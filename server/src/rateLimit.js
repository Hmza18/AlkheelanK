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

function headerValue(headers, name) {
  const raw = headers?.[name];
  if (Array.isArray(raw)) return raw[0] || "";
  return typeof raw === "string" ? raw : "";
}

function splitIps(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function forwardedClientKey(headers) {
  const vercelForwarded = splitIps(headerValue(headers, "x-vercel-forwarded-for"));
  const vercelRealIp = splitIps(headerValue(headers, "x-real-ip"));
  // Same-origin Vercel rewrites send the original browser IP in Vercel-owned
  // headers. The final X-Forwarded-For hop is Vercel itself after Render's
  // proxy, which would collapse unrelated users into one limiter bucket.
  if (headerValue(headers, "x-vercel-id") && (vercelForwarded[0] || vercelRealIp[0])) {
    return vercelForwarded[0] || vercelRealIp[0];
  }

  const forwarded = splitIps(headerValue(headers, "x-forwarded-for"));
  if (forwarded.length) {
    // For direct-to-Render traffic, keep using the nearest proxy-appended hop
    // so a client-supplied leading XFF value cannot rotate limiter buckets.
    return forwarded[forwarded.length - 1];
  }
  return null;
}

/** Derive a stable client key from a Socket.io socket. */
export function clientKey(socket) {
  return forwardedClientKey(socket.handshake.headers) || socket.handshake.address || socket.id;
}

/** Derive a stable client key from an Express request. */
export function httpClientKey(req) {
  return forwardedClientKey(req.headers) || req.ip || "unknown";
}
