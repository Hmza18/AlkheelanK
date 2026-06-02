import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const clientEnv = loadEnv(join(root, "client", ".env"));
const url = clientEnv.VITE_SUPABASE_URL;
const key = clientEnv.VITE_SUPABASE_ANON_KEY;
const serverUrl = clientEnv.VITE_SERVER_URL;

let ok = true;

console.log("\n=== AlkheelanK setup check ===\n");

if (!url || !key) {
  console.log("✗ client/.env missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  ok = false;
} else {
  console.log("✓ Supabase env vars present");
  const sb = createClient(url, key);
  const { error } = await sb.from("quizzes").select("id").limit(1);
  if (error?.message === "Invalid API key") {
    console.log("✗ Publishable key rejected — copy the key from Supabase → Settings → API Keys");
    ok = false;
  } else if (error) {
    console.log("✗ Supabase API:", error.message);
    ok = false;
  } else {
    console.log("✓ Supabase API key works");
  }

  const tables = ["quizzes", "question_bank", "quiz_shares", "game_history"];
  for (const table of tables) {
    const { error: te } = await sb.from(table).select("id").limit(1);
    if (te?.code === "PGRST205" || te?.message?.includes("does not exist")) {
      console.log(`✗ Table missing: ${table} — run: npm run apply-schema --prefix scripts`);
      ok = false;
    } else if (te) {
      console.log(`? ${table}: ${te.message}`);
    } else {
      console.log(`✓ Table: ${table}`);
    }
  }
}

if (!serverUrl) {
  console.log("✗ VITE_SERVER_URL missing in client/.env");
  ok = false;
} else {
  console.log(`✓ VITE_SERVER_URL = ${serverUrl}`);
  try {
    const res = await fetch(`${serverUrl.replace(/\/$/, "")}/`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) console.log("✓ Game server reachable");
    else console.log(`? Game server returned ${res.status} (start: cd server && npm run dev)`);
  } catch {
    console.log("? Game server not running locally (ok if you only need login UI)");
  }
}

if (!existsSync(join(root, "server", ".env"))) {
  console.log("✗ server/.env missing (created by setup — should exist)");
  ok = false;
} else {
  console.log("✓ server/.env exists");
}

console.log(ok ? "\n✓ Ready for local dev. Restart Vite if it was already running.\n" : "\nFix the items above, then re-run: npm run setup\n");
process.exit(ok ? 0 : 1);
