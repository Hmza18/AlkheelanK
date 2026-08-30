import assert from "node:assert/strict";
import { forwardedClientKey } from "../server/src/rateLimit.js";

assert.equal(
  forwardedClientKey({
    "x-vercel-id": "iad1::abc",
    "x-vercel-forwarded-for": "203.0.113.10",
    "x-forwarded-for": "203.0.113.10, 198.51.100.20",
  }),
  "203.0.113.10",
  "Vercel-proxied requests should key by the original client IP",
);

assert.equal(
  forwardedClientKey({
    "x-vercel-id": "iad1::abc",
    "x-real-ip": "203.0.113.11",
    "x-forwarded-for": "203.0.113.11, 198.51.100.20",
  }),
  "203.0.113.11",
  "Vercel x-real-ip should be used when x-vercel-forwarded-for is absent",
);

assert.equal(
  forwardedClientKey({
    "x-forwarded-for": "10.0.0.1, 203.0.113.12",
  }),
  "203.0.113.12",
  "Direct Render requests should keep using the nearest proxy-appended XFF hop",
);

assert.equal(forwardedClientKey({}), null, "Missing headers should fall back to caller defaults");

console.log("OK: rate-limit client keys handle Vercel rewrites");
