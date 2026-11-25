const sql = require("mssql");

function sqlConfig(cfg, { withDatabase = true } = {}) {
  const d = cfg.database;
  const c = {
    server: d.server,
    user: d.user,
    password: d.password,
    options: {
      encrypt: !!d.encrypt,
      trustServerCertificate: d.trustServerCertificate !== false,
    },
    pool: d.pool || { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
  if (withDatabase) c.database = d.database;
  if (d.instanceName) c.options.instanceName = d.instanceName;
  else if (d.port) c.port = d.port;
  return c;
}

let poolPromise = null;

function getPool(cfg) {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(sqlConfig(cfg)).connect().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

module.exports = { sql, sqlConfig, getPool };
