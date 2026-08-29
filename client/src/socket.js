import { io } from "socket.io-client";
import { healthCheckUrl, serverOrigin, socketServerUrl } from "./lib/serverUrl.js";

export const SERVER_URL = serverOrigin();

function isLocalDevOrigin() {
  if (typeof window === "undefined") return false;
  return /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
}

function serverReachHint() {
  if (isLocalDevOrigin()) {
    return "Start the game server in another terminal: `npm run dev:server` (from the project root). Vite proxies to port 3001.";
  }
  return "The game server may still be waking up on Render (free tier). Wait 30 seconds and try again.";
}

// Same-origin (Vite proxy / Vercel rewrite). Polling first — survives cold starts.
export const socket = io(socketServerUrl(), {
  autoConnect: false,
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

// ── Server clock sync ────────────────────────────────────────────────────────
// Game timing (question startedAt, countdown startedAt) is stamped with the
// SERVER clock. Clients render countdowns by comparing those stamps against
// Date.now() — so a phone whose wall clock is off by even a few seconds shows
// a timer visibly out of step with the host screen. We estimate the offset
// with a few ping samples (keeping the tightest-RTT one). Timer loops translate
// server timestamps on every tick so late sync samples correct active phases.
let serverClockOffset = 0; // serverNow - clientNow, latency-compensated
let bestSyncRtt = Infinity;

function sampleServerClock() {
  const sentAt = Date.now();
  socket.timeout(4000).emit("time:sync", sentAt, (err, res) => {
    if (err || typeof res?.serverNow !== "number") return;
    const now = Date.now();
    const rtt = now - sentAt;
    if (rtt <= bestSyncRtt) {
      bestSyncRtt = rtt;
      serverClockOffset = res.serverNow + rtt / 2 - now;
    }
  });
}

socket.on("connect", () => {
  bestSyncRtt = Infinity; // the route (and maybe the clock) changed — resample
  sampleServerClock();
  setTimeout(sampleServerClock, 400);
  setTimeout(sampleServerClock, 1200);
});

/** Convert a server-clock timestamp to this device's clock. */
export function serverToLocal(ts) {
  return typeof ts === "number" ? ts - serverClockOffset : ts;
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
  const url = healthCheckUrl();
  const attempts = 3;
  let lastErr;

  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), i === 0 ? 45_000 : 60_000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        cache: "no-store",
        mode: "cors",
      });
      if (!res.ok) {
        if (import.meta.env.DEV && (res.status === 502 || res.status === 504)) {
          throw new Error(`Could not reach the game server. ${serverReachHint()}`);
        }
        // Render free tier often returns 502/503 while spinning up — retry.
        if ((res.status === 502 || res.status === 503 || res.status === 504) && i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
          continue;
        }
        throw new Error(
          `Game server returned ${res.status}. Wait a moment and try again — free hosting can take up to a minute to wake.`,
        );
      }
      return res.json();
    } catch (err) {
      lastErr = err;
      if (err.name === "AbortError") {
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
          continue;
        }
        throw new Error("Game server timed out while waking up. Free hosting can take up to a minute — try again.");
      }
      if (err instanceof TypeError || /failed to fetch|network/i.test(err?.message || "")) {
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
          continue;
        }
        throw new Error(`Could not reach the game server. ${serverReachHint()}`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr || new Error(`Could not reach the game server. ${serverReachHint()}`);
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
