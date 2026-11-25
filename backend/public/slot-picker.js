// Shared slot picker used by the booking page and the admin "Book a slot" tab.
// Shows only remaining slots from GET /api/slots.
window.SlotPicker = function SlotPicker(root, onPick) {
  const daysEl = root.querySelector("[data-days]");
  const slotsEl = root.querySelector("[data-slots]");
  let days = [];
  let activeDate = null;
  let picked = null;

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const fmt = (date) => {
    const d = new Date(date + "T00:00:00");
    return { wd: d.toLocaleDateString(undefined, { weekday: "short" }), dd: d.getDate(), mon: d.toLocaleDateString(undefined, { month: "short" }) };
  };
  const to12 = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

  function renderDays() {
    daysEl.replaceChildren();
    if (!days.length) { slotsEl.replaceChildren(el("div", "empty", "No slots are open right now. Please check again later.")); return; }
    for (const day of days) {
      const f = fmt(day.date);
      const b = el("button", "day" + (day.date === activeDate ? " active" : ""));
      b.type = "button";
      b.append(el("small", null, f.wd), el("b", null, String(f.dd)), el("small", null, `${f.mon} · ${day.slots.length} open`));
      b.onclick = () => { activeDate = day.date; picked = null; onPick(null); renderDays(); };
      daysEl.append(b);
    }
    renderSlots();
  }

  function renderSlots() {
    slotsEl.replaceChildren();
    const day = days.find((d) => d.date === activeDate);
    if (!day) return;
    for (const s of day.slots) {
      const b = el("button", "slot" + (picked && picked.slotId === s.slotId ? " active" : ""), to12(s.start));
      b.type = "button";
      b.append(el("small", null, `to ${to12(s.end)}${s.remaining > 1 ? ` · ${s.remaining} left` : ""}`));
      b.onclick = () => { picked = { ...s, date: day.date, label: `${fmt(day.date).wd} ${fmt(day.date).dd} ${fmt(day.date).mon}, ${to12(s.start)} to ${to12(s.end)}` }; onPick(picked); renderSlots(); };
      slotsEl.append(b);
    }
  }

  async function load() {
    slotsEl.replaceChildren(el("div", "empty", "Loading slots..."));
    try {
      const res = await fetch("/api/slots");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not load slots.");
      days = data.days;
      if (!days.some((d) => d.date === activeDate)) activeDate = days[0] ? days[0].date : null;
      if (picked && !days.some((d) => d.slots.some((s) => s.slotId === picked.slotId))) { picked = null; onPick(null); }
      renderDays();
    } catch (err) {
      daysEl.replaceChildren();
      slotsEl.replaceChildren(el("div", "empty", err.message));
    }
  }

  load();
  return { reload: load };
};
