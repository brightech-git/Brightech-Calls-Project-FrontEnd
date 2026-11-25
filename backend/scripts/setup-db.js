// npm run db:setup
// Creates the database and tables named in public/config.json by running the
// scripts in ../sql in order. Safe to run more than once.
const fs = require("fs");
const path = require("path");
const { loadConfig } = require("../src/config");
const { sql, sqlConfig } = require("../src/db");

const DEFAULTS = { BTSCALLS: "database", MeetSlot: "slots", MeetBooking: "bookings", MeetBlockedDate: "blockedDates" };

function applyNames(text, cfg) {
  for (const [def, key] of Object.entries(DEFAULTS)) {
    const name = key === "database" ? cfg.database.database : cfg.tables[key];
    if (name !== def) text = text.replace(new RegExp(`\\b${def}\\b`, "g"), name);
  }
  return text;
}

async function main() {
  const cfg = loadConfig();
  const dir = path.join(__dirname, "..", "sql");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  // Connect without a database first so CREATE DATABASE works on a fresh server.
  const pool = await new sql.ConnectionPool(sqlConfig(cfg, { withDatabase: false })).connect();
  try {
    for (const file of files) {
      const text = applyNames(fs.readFileSync(path.join(dir, file), "utf8"), cfg);
      const batches = text.split(/^\s*GO\s*$/im).map((b) => b.trim()).filter(Boolean);
      // USE only lasts for one batch over the driver, so carry it into the next ones.
      let useStmt = "";
      for (const batch of batches) {
        if (/^USE\s+\w+\s*;?$/i.test(batch)) { useStmt = batch.replace(/;?$/, ";"); continue; }
        await pool.request().batch(useStmt ? `${useStmt}\nEXEC(N'${batch.replace(/'/g, "''")}')` : batch);
      }
      console.log(`[db:setup] ran ${file}`);
    }
    console.log(`[db:setup] Database ${cfg.database.database} is ready.`);
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error("[db:setup] failed:", err.message);
  process.exit(1);
});
