// Fixed admin login from config.json, with signed tokens (HMAC-SHA256) and a
// simple per-IP lockout after repeated wrong passwords.
const crypto = require("crypto");

function createAuth(cfg) {
  const A = cfg.admin;
  const attempts = new Map(); // ip -> { count, until }

  const b64 = (s) => Buffer.from(s).toString("base64url");
  const sign = (data) => crypto.createHmac("sha256", A.tokenSecret).update(data).digest("base64url");
  const same = (a, b) => {
    const x = crypto.createHash("sha256").update(String(a)).digest();
    const y = crypto.createHash("sha256").update(String(b)).digest();
    return crypto.timingSafeEqual(x, y);
  };

  function login(ip, username, password) {
    const now = Date.now();
    const rec = attempts.get(ip);
    if (rec && rec.until > now) {
      const mins = Math.ceil((rec.until - now) / 60000);
      return { ok: false, status: 429, message: `Too many attempts. Try again in ${mins} minute(s).` };
    }
    const okUser = same(username || "", A.username);
    const okPass = same(password || "", A.password);
    if (okUser && okPass) {
      attempts.delete(ip);
      const exp = now + A.tokenHours * 3600_000;
      const payload = b64(JSON.stringify({ u: A.username, exp }));
      return { ok: true, token: `${payload}.${sign(payload)}`, expiresAt: new Date(exp).toISOString(), username: A.username };
    }
    const count = (rec && rec.until <= now && rec.count >= A.maxLoginAttempts ? 0 : rec ? rec.count : 0) + 1;
    attempts.set(ip, { count, until: count >= A.maxLoginAttempts ? now + A.lockoutMinutes * 60_000 : 0 });
    return { ok: false, status: 401, message: "Wrong username or password." };
  }

  function verify(token) {
    if (typeof token !== "string") return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = sign(payload);
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
      const data = JSON.parse(Buffer.from(payload, "base64url").toString());
      return data.exp > Date.now() ? data : null;
    } catch {
      return null;
    }
  }

  function requireAdmin(req, res, next) {
    const h = req.headers.authorization || "";
    const user = verify(h.startsWith("Bearer ") ? h.slice(7) : null);
    if (!user) return res.status(401).json({ message: "Please log in again." });
    req.admin = user;
    next();
  }

  return { login, verify, requireAdmin };
}

module.exports = { createAuth };
