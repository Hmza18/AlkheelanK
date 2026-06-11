/**
 * Simple in-memory rate limiter (per key, fixed window).
 * Good enough for a single Render instance; reset on deploy.
 */
export function createRateLimiter({ windowMs, max }) {
  const buckets = new Map();

  // Sweep expired buckets every 5 windows to prevent unbounded memory growth
  // from unique IPs (bots, port-scanners) that never make a second request.
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (now - b.start >= windowMs) buckets.delete(k);
    }
  }, windowMs * 5);
  sweepInterval.unref?.();

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

/**
 * Derive a stable client key from a Socket.io socket.
 *
 * When behind a reverse proxy (e.g. Render), the real client IP is appended to
 * X-Forwarded-For by each proxy in turn:
 *   X-Forwarded-For: <client-spoofable>, ..., <proxy-added-real-ip>
 *
 * Taking the LAST entry (added by the nearest trusted proxy) prevents a client
 * from spoofing an earlier entry to bypass rate limiting.
 */
export function clientKey(socket) {
  const fwd = socket.handshake.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) {
    const ips = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    return ips[ips.length - 1];
  }
  return socket.handshake.address || socket.id;
}
