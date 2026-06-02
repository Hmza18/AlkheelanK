import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// One shared connection for the tab. We connect lazily so the landing page
// doesn't open a socket until the user actually hosts or joins.
export const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export function ensureConnected() {
  if (!socket.connected) socket.connect();
}
