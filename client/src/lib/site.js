/** Public join hostname shown on the host lobby (override with VITE_JOIN_HOST). */
export const JOIN_HOST = (
  import.meta.env.VITE_JOIN_HOST || "alkheelan.xyz"
).replace(/^https?:\/\//, "").replace(/\/$/, "");

export function joinDisplayPath() {
  return `${JOIN_HOST}/join`;
}

/** URL encoded in the lobby QR — works locally when VITE_SITE_URL is unset. */
export function joinQrUrl(pin) {
  const base = (import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");
  const origin =
    base ||
    (typeof window !== "undefined" ? window.location.origin : `https://${JOIN_HOST}`);
  const path = pin ? `/join?pin=${pin}` : "/join";
  return `${origin}${path}`;
}
