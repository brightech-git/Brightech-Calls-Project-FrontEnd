(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = "btsAdminToken";
  const store = {
    get: () => { try { return sessionStorage.getItem(KEY); } catch { return null; } },
    set: (v) => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch { /* private mode */ } },
  };
  let token = store.get();
  let picker = null;
  let slot = null;

  const show = (box, text, ok) => { box.textContent = text; box.className = "msg show " + (ok ? "ok" : "bad"); };
  const hide = (box) => { box.className = "msg"; };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const to12 = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
  const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const todayYmd = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  async function api(path, opts = {}) {
    const res = await fetch("/api/admin" + path, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== "/login") { logout(); throw new Error("Session expired. Please log in again."); }
    if (!res.ok) throw new Error(data.message || "Request failed.");
    return data;
  }

  // ---------- login ----------
  function logout() {
    token = null; store.set(null);
    $("appView").classList.add("hidden");
    $("loginView").classList.remove("hidden");
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hide($("loginMsg"));
    try {
      const data = await api("/login", { method: "POST", body: JSON.stringify({ username: $("username").value, password: $("password").value }) });
      token = data.token; store.set(token);
      $("password").value = "";
      start(data.username);
    } catch (err) { show($("loginMsg"), err.message, false); }
  });
  $("logout").onclick = logout;

  // ---------- tabs ----------
  document.querySelectorAll("[data-tab]").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x === b));
      document.querySelectorAll("[data-panel]").forEach((p) => p.classList.toggle("hidden", p.dataset.panel !== b.dataset.tab));
      if (b.dataset.tab === "book") picker ? picker.reload() : initPicker();
      if (b.dataset.tab === "blocked") loadBlocked();
      if (b.dataset.tab === "bookings") loadBookings();
    };
  });

  // ---------- stats + bookings ----------
  async function loadStats() {
    try {
      const s = await api("/stats");
      $("sToday").textContent = s.today; $("sUpcoming").textContent = s.upcoming;
      $("sOpen").textContent = s.openSlots; $("sCancelled").textContent = s.cancelled;
    } catch { /* shown by the list */ }
  }

  async function loadBookings() {
    hide($("listMsg"));
    const q = new URLSearchParams();
    if ($("fQ").value.trim()) q.set("q", $("fQ").value.trim());
    if ($("fFrom").value) q.set("from", $("fFrom").value);
    if ($("fTo").value) q.set("to", $("fTo").value);
    if ($("fStatus").value) q.set("status", $("fStatus").value);
    const tbody = $("rows");
    tbody.replaceChildren();
    try {
      const { bookings } = await api("/bookings?" + q);
      if (!bookings.length) {
        const tr = el("tr"); const td = el("td", "empty", "No bookings match."); td.colSpan = 7; tr.append(td); tbody.append(tr);
      }
      for (const b of bookings) {
        const tr = el("tr");
        const client = el("td"); client.append(el("b", null, b.CustomerName), el("div", "muted", b.Company || ""), el("small", "muted", b.BookingRef));
        const contact = el("td"); contact.append(el("div", null, b.Email), el("div", "muted", b.Phone || ""));
        const status = el("td"); status.append(el("span", "pill " + b.Status, b.Status), document.createTextNode(" "), el("span", "pill src", b.Source));
        const act = el("td");
        if (b.Status === "Booked") {
          const c = el("button", "danger small", "Cancel");
          c.onclick = async () => {
            if (!window.confirm(`Cancel ${b.CustomerName}'s meeting on ${fmtDate(b.SlotDate)} at ${to12(b.StartTime)}?`)) return;
            try { const r = await api(`/bookings/${b.BookingId}/cancel`, { method: "PATCH" }); show($("listMsg"), r.message, true); refresh(); }
            catch (err) { show($("listMsg"), err.message, false); }
          };
          act.append(c);
        }
        tr.append(el("td", null, fmtDate(b.SlotDate)), el("td", null, `${to12(b.StartTime)} - ${to12(b.EndTime)}`), client, contact, el("td", null, b.Purpose || ""), status, act);
        tbody.append(tr);
      }
    } catch (err) { show($("listMsg"), err.message, false); }
  }
  $("fApply").onclick = loadBookings;
  $("fQ").addEventListener("keydown", (e) => { if (e.key === "Enter") loadBookings(); });

  function refresh() { loadStats(); loadBookings(); }

  // ---------- book a slot ----------
  function initPicker() {
    picker = SlotPicker($("picker"), (s) => {
      slot = s;
      $("chosen").textContent = s ? "Selected: " + s.label : "No slot chosen yet.";
      $("bSubmit").disabled = !s;
    });
  }
  $("bookForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!slot) return;
    $("bSubmit").disabled = true;
    const body = Object.fromEntries(new FormData($("bookForm")));
    body.slotId = slot.slotId;
    try {
      const r = await api("/bookings", { method: "POST", body: JSON.stringify(body) });
      show($("bookMsg"), `Booked ${r.booking.name} for ${slot.label}. Ref ${r.booking.bookingRef}.`, true);
      $("bookForm").reset();
      loadStats();
    } catch (err) { show($("bookMsg"), err.message, false); }
    picker.reload();
  });

  // ---------- blocked dates ----------
  async function loadBlocked() {
    const tbody = $("blockedRows");
    tbody.replaceChildren();
    try {
      const { dates } = await api("/blocked-dates");
      if (!dates.length) { const tr = el("tr"); const td = el("td", "muted", "No upcoming blocked dates."); td.colSpan = 3; tr.append(td); tbody.append(tr); }
      for (const d of dates) {
        const tr = el("tr");
        const act = el("td"); const b = el("button", "ghost small", "Open again");
        b.onclick = async () => {
          try { await api("/blocked-dates/" + d.BlockedDate, { method: "DELETE" }); loadBlocked(); loadStats(); }
          catch (err) { show($("blockMsg"), err.message, false); }
        };
        act.append(b);
        tr.append(el("td", null, fmtDate(d.BlockedDate)), el("td", null, d.Reason || ""), act);
        tbody.append(tr);
      }
    } catch (err) { show($("blockMsg"), err.message, false); }
  }
  $("blockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const r = await api("/blocked-dates", { method: "POST", body: JSON.stringify({ date: $("blDate").value, reason: $("blReason").value }) });
      show($("blockMsg"), r.message, true);
      $("blockForm").reset();
      loadBlocked(); loadStats();
    } catch (err) { show($("blockMsg"), err.message, false); }
  });

  // ---------- start ----------
  function start(username) {
    $("loginView").classList.add("hidden");
    $("appView").classList.remove("hidden");
    $("who").textContent = `Signed in as ${username}`;
    $("fFrom").value = todayYmd();
    $("blDate").min = todayYmd();
    refresh();
  }

  if (token) api("/me").then((r) => start(r.username)).catch(logout);
  else logout();
})();
