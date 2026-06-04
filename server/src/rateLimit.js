/**
 * Simple in-memory rate limiter (per key, fixed window).
 * Good enough for a single Render instance; reset on deploy.
 */
export function createRateLimiter({ windowMs, max }) {
  const buckets = new Map();

  return function allow(key) {
    const k = String(key || "unknown");
    const now = Date.now();
    let bucket = buckets.get(k);
    if (!bucket || now - bucket.start >= windowMs) {
      bucket = { start: now, count: 0 };
      buckets.set(k, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) return false;
    return true;
  };
}

export function clientKey(socket) {
  const fwd = socket.handshake.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) {
    return fwd.split(",")[0].trim();
  }
  return socket.handshake.address || socket.id;
}
