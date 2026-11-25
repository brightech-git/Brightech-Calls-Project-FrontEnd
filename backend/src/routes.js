const express = require("express");

// Wraps async handlers so thrown errors reach the error middleware.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function publicRoutes(cfg, svc) {
  const r = express.Router();

  r.get("/health", wrap(async (_req, res) => {
    await svc.syncSlots();
    res.json({ ok: true, database: cfg.database.database });
  }));

  // Settings the website can use to show the booking widget.
  r.get("/settings", (_req, res) => {
    const s = cfg.slots;
    res.json({
      companyName: cfg.booking.companyName,
      durationMinutes: s.durationMinutes,
      daysAhead: s.daysAhead,
      requirePhone: cfg.booking.requirePhone,
    });
  });

  // Remaining (still bookable) slots only. ?from=YYYY-MM-DD&to=YYYY-MM-DD or ?date=YYYY-MM-DD
  r.get("/slots", wrap(async (req, res) => {
    const { date, from, to } = req.query;
    const slots = await svc.remainingSlots(date ? { from: date, to: date } : { from, to });
    res.json({ days: svc.groupByDate(slots), total: slots.length });
  }));

  r.post("/bookings", wrap(async (req, res) => {
    const booking = await svc.book(req.body, { source: "Website" });
    res.status(201).json({ message: "Your meeting is booked.", booking });
  }));

  return r;
}

function adminRoutes(cfg, svc, auth) {
  const r = express.Router();

  r.post("/login", (req, res) => {
    const { username, password } = req.body || {};
    const out = auth.login(req.ip, username, password);
    if (!out.ok) return res.status(out.status).json({ message: out.message });
    res.json({ token: out.token, expiresAt: out.expiresAt, username: out.username });
  });

  r.use(auth.requireAdmin);

  r.get("/me", (req, res) => res.json({ username: req.admin.u }));
  r.get("/stats", wrap(async (_req, res) => res.json(await svc.stats())));

  r.get("/bookings", wrap(async (req, res) => {
    res.json({ bookings: await svc.listBookings(req.query) });
  }));

  r.post("/bookings", wrap(async (req, res) => {
    const booking = await svc.book(req.body, { source: "Admin" });
    res.status(201).json({ message: "Slot booked.", booking });
  }));

  r.patch("/bookings/:id/cancel", wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Bad booking id." });
    await svc.cancelBooking(id);
    res.json({ message: "Booking cancelled. The slot is open again." });
  }));

  r.get("/blocked-dates", wrap(async (_req, res) => res.json({ dates: await svc.listBlockedDates() })));
  r.post("/blocked-dates", wrap(async (req, res) => {
    await svc.addBlockedDate(req.body && req.body.date, req.body && req.body.reason);
    res.status(201).json({ message: "Date blocked." });
  }));
  r.delete("/blocked-dates/:date", wrap(async (req, res) => {
    await svc.removeBlockedDate(req.params.date);
    res.json({ message: "Date opened again." });
  }));

  return r;
}

module.exports = { publicRoutes, adminRoutes };
