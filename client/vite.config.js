import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (process.env.VERCEL && (!supabaseUrl || !supabaseKey)) {
  console.warn(
    "\n[Vercel build] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing — " +
      "production will show “Login isn't configured”. See docs/VERCEL_SETUP.md\n",
  );
}

const gameServer = "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": { target: gameServer, changeOrigin: true },
      "/socket.io": { target: gameServer, ws: true, changeOrigin: true },
      "/health": { target: gameServer, changeOrigin: true },
      "/quizzes": { target: gameServer, changeOrigin: true },
      "/features": { target: gameServer, changeOrigin: true },
      "/generate-quiz": { target: gameServer, changeOrigin: true },
      "/ingest-quiz": { target: gameServer, changeOrigin: true },
      "/image-search": { target: gameServer, changeOrigin: true },
      "/starter-images": { target: gameServer, changeOrigin: true },
    },
  },
});
