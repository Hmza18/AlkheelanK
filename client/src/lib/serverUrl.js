/** Production / explicit override — full origin including port. */
export function serverOrigin() {
  return (import.meta.env.VITE_SERVER_URL || "http://localhost:3001").replace(/\/$/, "");
}

/**
 * Base URL for HTTP calls to the game server.
 * In dev, use same-origin paths so Vite can proxy to localhost:3001.
 */
export function serverBase() {
  if (import.meta.env.DEV) return "";
  return serverOrigin();
}

export function serverUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${serverBase()}${p}`;
}

/** Socket.io target — undefined in dev connects to the Vite dev server (proxied). */
export function socketServerUrl() {
  if (import.meta.env.DEV) return undefined;
  return serverOrigin();
}

export function healthCheckUrl() {
  return serverUrl("/health");
}
