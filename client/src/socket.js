import { io } from "socket.io-client";

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// One shared connection for the tab. We connect lazily so the landing page
// doesn't open a socket until the user actually hosts or joins.
export const socket = io(SERVER_URL, {
  autoConnect: false,
  // Polling first — Render/Vercel proxies often reject a direct WebSocket attempt
  // before the service is fully awake. Socket.io upgrades once polling works.
  transports: ["polling", "websocket"],
  upgrade: true,
  rememberUpgrade: true,
  timeout: 45_000,
  reconnectionAttempts: 10,
  reconnectionDelay: 1_000,
  reconnectionDelayMax: 5_000,
});

export function ensureConnected() {
  if (!socket.connected) socket.connect();
}

export function formatConnectError(err, { timedOut = false } = {}) {
  const raw = err?.message || "";
  if (timedOut) {
    return "Game server took too long to respond. Free hosting can take up to a minute to wake — try again.";
  }
  if (/websocket error/i.test(raw)) {
    return "Could not connect to the game server. Confirm the Render server is deployed and VITE_SERVER_URL is correct.";
  }
  if (err instanceof TypeError || /failed to fetch|network/i.test(raw)) {
    return "Could not reach the game server. Check your connection and that the server is running.";
  }
  return raw || "Could not connect to the game server.";
}

/** Hit the HTTP health check so Render/similar hosts wake before the socket handshake. */
export async function wakeServer() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  try {
    const res = await fetch(`${SERVER_URL}/`, { signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(
        `Game server returned ${res.status}. Deploy alkheelank-server on Render and set VITE_SERVER_URL to its URL.`,
      );
    }
    return res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Game server timed out while waking up. Try again in a moment.");
    }
    if (err instanceof TypeError) {
      throw new Error("Could not reach the game server. Check VITE_SERVER_URL and your Render deployment.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve once the socket is connected.
 * Do not fail on transient transport errors — Socket.io retries with polling.
 */
export function connectSocket({ timeoutMs = 45_000 } = {}) {
  if (socket.connected) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("connect", onConnect);
    };
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(value);
    };

    const onConnect = () => finish(resolve);
    const timer = setTimeout(
      () => finish(reject, new Error(formatConnectError(null, { timedOut: true }))),
      timeoutMs,
    );

    socket.on("connect", onConnect);
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
