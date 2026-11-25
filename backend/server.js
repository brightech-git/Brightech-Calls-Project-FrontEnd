// Brightech meeting booking API.
// Every setting comes from public/config.json (see public/config.example.json).
const path = require("path");
const express = require("express");
const { loadConfig, PUBLIC_DIR } = require("./src/config");
const { createSlotService } = require("./src/slots");
const { createAuth } = require("./src/auth");
const { publicRoutes, adminRoutes } = require("./src/routes");

const cfg = loadConfig();
const svc = createSlotService(cfg);
const auth = createAuth(cfg);
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", "loopback");
app.use(express.json({ limit: "20kb" }));

// CORS for the origins listed in config.json (e.g. the website on :3000).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && cfg.server.corsOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// The config files sit in public/ but must never be served.
app.use((req, res, next) => {
  if (/config(\.example)?\.json$/i.test(decodeURIComponent(req.path))) return res.sendStatus(404);
  next();
});

app.use("/api", publicRoutes(cfg, svc));
app.use("/api/admin", adminRoutes(cfg, svc, auth));
app.use("/api", (_req, res) => res.status(404).json({ message: "Not found." }));

app.get(["/admin", "/admin/"], (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "admin", "index.html")));
app.use(express.static(PUBLIC_DIR, { dotfiles: "ignore", index: "index.html" }));

app.use((err, _req, res, _next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ message: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body." });
  console.error("[api]", err);
  const dbDown = /ConnectionError|ESOCKET|ELOGIN|ETIMEOUT/.test(`${err.name} ${err.code}`);
  res.status(dbDown ? 503 : 500).json({ message: dbDown ? "Database is not reachable. Check config.json." : "Something went wrong." });
});

app.listen(cfg.server.port, cfg.server.host || "0.0.0.0", () => {
  console.log(`[api] Config: ${cfg._path}`);
  console.log(`[api] Booking page : http://localhost:${cfg.server.port}/`);
  console.log(`[api] Admin page   : http://localhost:${cfg.server.port}/admin`);
  console.log(`[api] Slots API    : http://localhost:${cfg.server.port}/api/slots`);
  svc.syncSlots(true).then(
    () => console.log(`[db] Connected to ${cfg.database.database}; slots ready for the next ${cfg.slots.daysAhead} days.`),
    (err) => console.error(`[db] Could not prepare slots: ${err.message}. Run "npm run db:setup" and check config.json.`)
  );
});
