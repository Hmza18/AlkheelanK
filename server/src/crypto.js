import { randomBytes, randomInt } from "node:crypto";

/** URL-safe opaque token for host/player sessions. */
export function secureToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

/** Six-digit game PIN (100000–999999). */
export function securePin() {
  return String(randomInt(100_000, 1_000_000));
}
