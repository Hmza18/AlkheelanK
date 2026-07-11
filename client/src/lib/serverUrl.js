/** Render / local game-server origin (for docs and server-side tooling only). */
export function serverOrigin() {
  return (import.meta.env.VITE_SERVER_URL || "http://localhost:3001").replace(/\/$/, "");
}

/**
 * Base URL for HTTP calls to the game server.
 * Always same-origin: Vite proxies in dev, Vercel rewrites in production.
 * Avoids cross-origin CORS / ad-blocker issues with onrender.com.
 */
export function serverBase() {
  return "";
}

export function serverUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${serverBase()}${p}`;
}

/** Same-origin socket.io — proxied to the game server. */
export function socketServerUrl() {
  return undefined;
}

export function healthCheckUrl() {
  return serverUrl("/health");
}
