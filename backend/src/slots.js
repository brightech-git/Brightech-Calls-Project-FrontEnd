// Slot generation, remaining-slot lookup and booking logic.
const crypto = require("crypto");
const { sql, getPool } = require("./db");

const YMD = /^\d{4}-\d{2}-\d{2}$/;

// ---------- small date helpers (server local time) ----------
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const slotStart = (date, hhmm) => { const d = parseYmd(date); const [h, m] = hhmm.split(":").map(Number); d.setHours(h, m, 0, 0); return d; };
const isValidYmd = (s) => YMD.test(s) && ymd(parseYmd(s)) === s;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function createSlotService(cfg) {
  const T = cfg.tables; // validated identifiers
  const S = cfg.slots;
  let lastSync = 0;
  let syncing = null;

  // Times of day for one day, from dayStart to dayEnd, skipping breaks.
  function dayTimes() {
    const out = [];
    const end = toMin(S.dayEnd);
    const breaks = (S.breaks || []).map((b) => [toMin(b.start), toMin(b.end)]);
    for (let t = toMin(S.dayStart); t + S.durationMinutes <= end; t += S.durationMinutes + (S.gapMinutes || 0)) {
      const e = t + S.durationMinutes;
      if (breaks.some(([bs, be]) => t < be && e > bs)) continue;
      out.push({ s: toHHMM(t), e: toHHMM(e) });
    }
    return out;
  }

  function horizon() {
    const from = new Date(); from.setHours(0, 0, 0, 0);
    const to = new Date(from); to.setDate(to.getDate() + S.daysAhead);
    return { from: ymd(from), to: ymd(to) };
  }

  // Slots that config.json says should exist between today and today + daysAhead.
  function plannedSlots() {
    const holidays = new Set(S.holidays || []);
    const times = dayTimes();
    const rows = [];
    const { from } = horizon();
    const d = parseYmd(from);
    for (let i = 0; i <= S.daysAhead; i++, d.setDate(d.getDate() + 1)) {
      const date = ymd(d);
      if (!S.workingDays.includes(d.getDay()) || holidays.has(date)) continue;
      for (const t of times) rows.push({ d: date, s: t.s, e: t.e });
    }
    return rows;
  }

  // Keeps MeetSlot in line with config.json: inserts new slots, re-activates
  // planned ones and switches off future slots that config no longer plans.
  // Booked slots are never deleted.
  async function syncSlots(force = false) {
    if (!force && Date.now() - lastSync < 60_000) return;
    if (syncing) return syncing;
    syncing = (async () => {
      const pool = await getPool(cfg);
      const { from, to } = horizon();
      const json = JSON.stringify(plannedSlots());
      await pool.request()
        .input("json", sql.NVarChar(sql.MAX), json)
        .input("cap", sql.Int, S.capacityPerSlot)
        .input("from", sql.Date, from)
        .input("to", sql.Date, to)
        .query(`
          ;WITH p AS (
            SELECT d, s, e FROM OPENJSON(@json) WITH (d DATE '$.d', s CHAR(5) '$.s', e CHAR(5) '$.e')
          )
          MERGE dbo.${T.slots} WITH (HOLDLOCK) AS m
          USING p ON m.SlotDate = p.d AND m.StartTime = p.s
          WHEN MATCHED AND (m.IsActive = 0 OR m.EndTime <> p.e OR m.Capacity <> @cap) THEN
            UPDATE SET IsActive = 1, EndTime = p.e, Capacity = @cap
          WHEN NOT MATCHED BY TARGET THEN
            INSERT (SlotDate, StartTime, EndTime, Capacity) VALUES (p.d, p.s, p.e, @cap)
          WHEN NOT MATCHED BY SOURCE AND m.SlotDate BETWEEN @from AND @to AND m.IsActive = 1 THEN
            UPDATE SET IsActive = 0;
        `);
      lastSync = Date.now();
    })().finally(() => { syncing = null; });
    return syncing;
  }

  function clampRange(fromQ, toQ) {
    const h = horizon();
    let from = fromQ && isValidYmd(fromQ) ? fromQ : h.from;
    let to = toQ && isValidYmd(toQ) ? toQ : h.to;
    if (from < h.from) from = h.from;
    if (to > h.to) to = h.to;
    return { from, to };
  }

  // Only slots that still have room, are not on a blocked date and start
  // after the minimum notice period.
  async function remainingSlots({ from: fromQ, to: toQ } = {}) {
    await syncSlots();
    const { from, to } = clampRange(fromQ, toQ);
    if (from > to) return [];
    const pool = await getPool(cfg);
    const { recordset } = await pool.request()
      .input("from", sql.Date, from)
      .input("to", sql.Date, to)
      .query(`
        SELECT s.SlotId, CONVERT(CHAR(10), s.SlotDate, 23) AS SlotDate, s.StartTime, s.EndTime, s.Capacity,
               s.Capacity - COUNT(b.BookingId) AS Remaining
        FROM dbo.${T.slots} s
        LEFT JOIN dbo.${T.bookings} b ON b.SlotId = s.SlotId AND b.Status = 'Booked'
        WHERE s.IsActive = 1
          AND s.SlotDate BETWEEN @from AND @to
          AND NOT EXISTS (SELECT 1 FROM dbo.${T.blockedDates} x WHERE x.BlockedDate = s.SlotDate)
        GROUP BY s.SlotId, s.SlotDate, s.StartTime, s.EndTime, s.Capacity
        HAVING s.Capacity - COUNT(b.BookingId) > 0
        ORDER BY s.SlotDate, s.StartTime;
      `);
    const cutoff = Date.now() + S.minNoticeMinutes * 60_000;
    return recordset.filter((r) => slotStart(r.SlotDate, r.StartTime).getTime() > cutoff);
  }

  function groupByDate(slots) {
    const days = new Map();
    for (const s of slots) {
      if (!days.has(s.SlotDate)) days.set(s.SlotDate, []);
      days.get(s.SlotDate).push({ slotId: s.SlotId, start: s.StartTime, end: s.EndTime, remaining: s.Remaining });
    }
    return [...days].map(([date, slots]) => ({ date, slots }));
  }

  function validateBooking(body, { source }) {
    const b = body || {};
    const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const out = {
      slotId: Number(b.slotId),
      name: str(b.name, 100),
      email: str(b.email, 150),
      phone: str(b.phone, 20),
      company: str(b.company, 150),
      purpose: str(b.purpose, cfg.booking.maxPurposeLength),
    };
    const errors = [];
    if (!Number.isInteger(out.slotId) || out.slotId <= 0) errors.push("Pick a slot.");
    if (out.name.length < 2) errors.push("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) errors.push("A valid email is required.");
    if (out.phone && !/^[0-9+\-() ]{6,20}$/.test(out.phone)) errors.push("Phone number looks wrong.");
    if (cfg.booking.requirePhone && !out.phone && source !== "Admin") errors.push("Phone number is required.");
    if (errors.length) throw new HttpError(400, errors.join(" "));
    return out;
  }

  // Books a slot inside a serializable transaction so two people can never
  // take the last place in the same slot.
  async function book(body, { source = "Website" } = {}) {
    const input = validateBooking(body, { source });
    const pool = await getPool(cfg);
    const tx = new sql.Transaction(pool);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const slotRes = await new sql.Request(tx).input("id", sql.Int, input.slotId).query(`
        SELECT s.SlotId, CONVERT(CHAR(10), s.SlotDate, 23) AS SlotDate, s.StartTime, s.EndTime, s.Capacity, s.IsActive,
               (SELECT COUNT(*) FROM dbo.${T.bookings} b WITH (UPDLOCK, HOLDLOCK) WHERE b.SlotId = s.SlotId AND b.Status = 'Booked') AS Taken,
               CASE WHEN EXISTS (SELECT 1 FROM dbo.${T.blockedDates} x WHERE x.BlockedDate = s.SlotDate) THEN 1 ELSE 0 END AS Blocked
        FROM dbo.${T.slots} s WITH (UPDLOCK, HOLDLOCK)
        WHERE s.SlotId = @id;
      `);
      const slot = slotRes.recordset[0];
      if (!slot || !slot.IsActive) throw new HttpError(404, "That slot does not exist.");
      if (slot.Blocked) throw new HttpError(409, "Bookings are closed on that date.");
      const notice = source === "Admin" ? 0 : S.minNoticeMinutes;
      if (slotStart(slot.SlotDate, slot.StartTime).getTime() <= Date.now() + notice * 60_000) {
        throw new HttpError(409, "That slot is no longer available.");
      }
      if (slot.Taken >= slot.Capacity) throw new HttpError(409, "Sorry, that slot was just booked. Please pick another.");

      const ref = "BTS" + slot.SlotDate.replace(/-/g, "").slice(2) + crypto.randomBytes(3).toString("hex").toUpperCase();
      const ins = await new sql.Request(tx)
        .input("ref", sql.VarChar(20), ref)
        .input("slotId", sql.Int, slot.SlotId)
        .input("name", sql.NVarChar(100), input.name)
        .input("email", sql.NVarChar(150), input.email)
        .input("phone", sql.VarChar(20), input.phone || null)
        .input("company", sql.NVarChar(150), input.company || null)
        .input("purpose", sql.NVarChar(500), input.purpose || null)
        .input("source", sql.VarChar(20), source)
        .query(`
          INSERT INTO dbo.${T.bookings} (BookingRef, SlotId, CustomerName, Email, Phone, Company, Purpose, Source)
          OUTPUT INSERTED.BookingId
          VALUES (@ref, @slotId, @name, @email, @phone, @company, @purpose, @source);
        `);
      await tx.commit();
      return {
        bookingId: ins.recordset[0].BookingId,
        bookingRef: ref,
        date: slot.SlotDate,
        start: slot.StartTime,
        end: slot.EndTime,
        name: input.name,
        email: input.email,
      };
    } catch (err) {
      try { await tx.rollback(); } catch { /* already rolled back */ }
      throw err;
    }
  }

  // ---------- admin queries ----------
  async function listBookings({ status, from, to, q } = {}) {
    const pool = await getPool(cfg);
    const r = pool.request();
    const where = [];
    if (status === "Booked" || status === "Cancelled") { r.input("status", sql.VarChar(20), status); where.push("b.Status = @status"); }
    if (from && isValidYmd(from)) { r.input("from", sql.Date, from); where.push("s.SlotDate >= @from"); }
    if (to && isValidYmd(to)) { r.input("to", sql.Date, to); where.push("s.SlotDate <= @to"); }
    if (q && typeof q === "string" && q.trim()) {
      r.input("q", sql.NVarChar(160), `%${q.trim().slice(0, 150)}%`);
      where.push("(b.CustomerName LIKE @q OR b.Email LIKE @q OR b.Phone LIKE @q OR b.Company LIKE @q OR b.BookingRef LIKE @q)");
    }
    const { recordset } = await r.query(`
      SELECT TOP 1000 b.BookingId, b.BookingRef, CONVERT(CHAR(10), s.SlotDate, 23) AS SlotDate, s.StartTime, s.EndTime,
             b.CustomerName, b.Email, b.Phone, b.Company, b.Purpose, b.Status, b.Source,
             CONVERT(VARCHAR(16), b.CreatedAt, 120) AS CreatedAt
      FROM dbo.${T.bookings} b
      JOIN dbo.${T.slots} s ON s.SlotId = b.SlotId
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY s.SlotDate, s.StartTime, b.BookingId;
    `);
    return recordset;
  }

  async function cancelBooking(id) {
    const pool = await getPool(cfg);
    const { rowsAffected } = await pool.request().input("id", sql.Int, id).query(`
      UPDATE dbo.${T.bookings} SET Status = 'Cancelled', CancelledAt = SYSDATETIME()
      WHERE BookingId = @id AND Status = 'Booked';
    `);
    if (!rowsAffected[0]) throw new HttpError(404, "Booking not found or already cancelled.");
  }

  async function stats() {
    const pool = await getPool(cfg);
    const today = ymd(new Date());
    const { recordset } = await pool.request().input("today", sql.Date, today).query(`
      SELECT
        SUM(CASE WHEN b.Status = 'Booked' AND s.SlotDate >= @today THEN 1 ELSE 0 END) AS Upcoming,
        SUM(CASE WHEN b.Status = 'Booked' AND s.SlotDate = @today THEN 1 ELSE 0 END) AS Today,
        SUM(CASE WHEN b.Status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled,
        COUNT(*) AS Total
      FROM dbo.${T.bookings} b JOIN dbo.${T.slots} s ON s.SlotId = b.SlotId;
    `);
    const remaining = await remainingSlots();
    const row = recordset[0] || {};
    return { upcoming: row.Upcoming || 0, today: row.Today || 0, cancelled: row.Cancelled || 0, total: row.Total || 0, openSlots: remaining.length };
  }

  async function listBlockedDates() {
    const pool = await getPool(cfg);
    const { recordset } = await pool.request().query(`
      SELECT CONVERT(CHAR(10), BlockedDate, 23) AS BlockedDate, Reason FROM dbo.${T.blockedDates}
      WHERE BlockedDate >= CAST(GETDATE() AS DATE) ORDER BY BlockedDate;
    `);
    return recordset;
  }

  async function addBlockedDate(date, reason) {
    if (!isValidYmd(date || "")) throw new HttpError(400, "Date must be YYYY-MM-DD.");
    const pool = await getPool(cfg);
    await pool.request()
      .input("d", sql.Date, date)
      .input("r", sql.NVarChar(200), typeof reason === "string" ? reason.trim().slice(0, 200) || null : null)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.${T.blockedDates} WHERE BlockedDate = @d)
          INSERT INTO dbo.${T.blockedDates} (BlockedDate, Reason) VALUES (@d, @r)
        ELSE UPDATE dbo.${T.blockedDates} SET Reason = @r WHERE BlockedDate = @d;
      `);
  }

  async function removeBlockedDate(date) {
    if (!isValidYmd(date || "")) throw new HttpError(400, "Date must be YYYY-MM-DD.");
    const pool = await getPool(cfg);
    await pool.request().input("d", sql.Date, date).query(`DELETE FROM dbo.${T.blockedDates} WHERE BlockedDate = @d;`);
  }

  return {
    syncSlots, remainingSlots, groupByDate, book, listBookings, cancelBooking, stats,
    listBlockedDates, addBlockedDate, removeBlockedDate, horizon,
  };
}

module.exports = { createSlotService, HttpError };
