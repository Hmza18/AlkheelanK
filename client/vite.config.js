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

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
