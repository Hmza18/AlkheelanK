/**
 * Verifies get_quiz_share_by_code RPC and that quiz_shares is not openly listable.
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "client", ".env");
if (!existsSync(envPath)) {
  console.error("Missing client/.env");
  process.exit(1);
}
const env = {};
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("VITE_SUPABASE_* not set");
  process.exit(1);
}

const supabase = createClient(url, key);

const list = await supabase.from("quiz_shares").select("id").limit(1);
const rpc = await supabase.rpc("get_quiz_share_by_code", { share_code: "00000000" });

const listLeaks = Array.isArray(list.data) && list.data.length > 0;
const rpcOk = !rpc.error;

console.log("quiz_shares anon enumeration:", listLeaks ? "LEAK" : "blocked (0 rows)");
console.log("get_quiz_share_by_code RPC:", rpcOk ? "ok" : rpc.error?.message);
process.exit(!listLeaks && rpcOk ? 0 : 1);
