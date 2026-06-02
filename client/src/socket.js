import { io } from "socket.io-client";

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// One shared connection for the tab. We connect lazily so the landing page
// doesn't open a socket until the user actually hosts or joins.
export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  // Give cold-hosted servers time to accept the first socket after wake-up.
  timeout: 45_000,
  reconnectionAttempts: 5,
});

export function ensureConnected() {
  if (!socket.connected) socket.connect();
}

/** Hit the HTTP health check so Render/similar hosts wake before the socket handshake. */
export function wakeServer() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  return fetch(`${SERVER_URL}/`, { signal: ctrl.signal })
    .catch(() => {})
    .finally(() => clearTimeout(timer));
}

/** Resolve once the socket is connected, or reject on timeout / connect_error. */
export function connectSocket({ timeoutMs = 45_000 } = {}) {
  if (socket.connected) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
      fn(value);
    };

    const onConnect = () => finish(resolve);
    const onError = (err) =>
      finish(reject, err instanceof Error ? err : new Error("Could not reach the game server."));

    const timer = setTimeout(
      () => finish(reject, new Error("Game server took too long to respond. Try again in a moment.")),
      timeoutMs,
    );

    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
    ensureConnected();
  });
}

/** Emit a socket event and wait for the server's ack callback. */
export function emitWithAck(event, payload, timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Server didn't respond. Try again.")),
      timeoutMs,
    );
    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      if (response?.error) reject(new Error(response.error));
      else resolve(response);
    });
  });
}
