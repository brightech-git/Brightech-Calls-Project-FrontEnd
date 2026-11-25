// Loads every setting from public/config.json.
// On first run the file is created from public/config.example.json so the
// real credentials never have to live in git (config.json is gitignored).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const CONFIG_PATH = process.env.BTS_CONFIG || path.join(PUBLIC_DIR, "config.json");
const EXAMPLE_PATH = path.join(PUBLIC_DIR, "config.example.json");

const IDENT = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.copyFileSync(EXAMPLE_PATH, CONFIG_PATH);
    console.warn(`[config] Created ${CONFIG_PATH} from config.example.json. Edit it with your SQL Server and admin details.`);
  }

  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (err) {
    throw new Error(`[config] ${CONFIG_PATH} is not valid JSON: ${err.message}`);
  }

  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };

  need(cfg.server && Number.isInteger(cfg.server.port), "server.port must be a number");
  need(cfg.database && cfg.database.server && cfg.database.database, "database.server and database.database are required");
  need(cfg.admin && cfg.admin.username && cfg.admin.password, "admin.username and admin.password are required");

  cfg.tables = Object.assign({ slots: "MeetSlot", bookings: "MeetBooking", blockedDates: "MeetBlockedDate" }, cfg.tables);
  for (const [k, v] of Object.entries(cfg.tables)) need(IDENT.test(v), `tables.${k} "${v}" is not a valid table name`);
  need(IDENT.test(cfg.database.database || ""), "database.database must be a plain name like BTSCALLS");

  const s = (cfg.slots = Object.assign({
    workingDays: [1, 2, 3, 4, 5], dayStart: "10:00", dayEnd: "18:00", durationMinutes: 30, gapMinutes: 0,
    breaks: [], capacityPerSlot: 1, daysAhead: 14, minNoticeMinutes: 60, holidays: [],
  }, cfg.slots));
  need(HHMM.test(s.dayStart) && HHMM.test(s.dayEnd), "slots.dayStart / slots.dayEnd must be HH:MM");
  need(Number.isInteger(s.durationMinutes) && s.durationMinutes >= 5, "slots.durationMinutes must be 5 or more");
  need(Number.isInteger(s.capacityPerSlot) && s.capacityPerSlot >= 1, "slots.capacityPerSlot must be 1 or more");
  need(Number.isInteger(s.daysAhead) && s.daysAhead >= 0 && s.daysAhead <= 366, "slots.daysAhead must be 0-366");
  for (const b of s.breaks || []) need(HHMM.test(b.start) && HHMM.test(b.end), "slots.breaks entries need start/end as HH:MM");
  for (const h of s.holidays || []) need(YMD.test(h), `slots.holidays entry "${h}" must be YYYY-MM-DD`);

  cfg.booking = Object.assign({ companyName: "Brightech Software", requirePhone: true, maxPurposeLength: 500 }, cfg.booking);
  cfg.admin = Object.assign({ tokenHours: 8, maxLoginAttempts: 5, lockoutMinutes: 5 }, cfg.admin);
  cfg.server.corsOrigins = cfg.server.corsOrigins || [];

  if (errors.length) throw new Error("[config] Problems in config.json:\n - " + errors.join("\n - "));

  if (cfg.admin.password === "CHANGE_ME") console.warn("[config] admin.password is still CHANGE_ME. Set a real password in config.json.");
  if (!cfg.admin.tokenSecret || cfg.admin.tokenSecret.startsWith("CHANGE_ME")) {
    cfg.admin.tokenSecret = crypto.randomBytes(32).toString("hex");
    console.warn("[config] admin.tokenSecret not set; using a random one (admins must log in again after a restart).");
  }

  cfg._path = CONFIG_PATH;
  return cfg;
}

module.exports = { loadConfig, PUBLIC_DIR };
