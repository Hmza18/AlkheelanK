/**
 * Sets Supabase Auth Site URL + redirect allow-list for production (fixes Google → localhost).
 * Requires SUPABASE_ACCESS_TOKEN in server/.env (https://supabase.com/dashboard/account/tokens)
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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
const serverEnv = loadEnv(join(root, "server", ".env"));
const token = process.env.SUPABASE_ACCESS_TOKEN || serverEnv.SUPABASE_ACCESS_TOKEN;
const ref =
  serverEnv.SUPABASE_PROJECT_REF ||
  clientEnv.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const siteUrl = (process.argv[2] || serverEnv.SITE_URL || "https://www.alkheelan.xyz").replace(
  /\/$/,
  "",
);

if (!token || !ref) {
  console.log(`
Manual fix (2 min) — Google redirecting to localhost:

1. Open: https://supabase.com/dashboard/project/${ref || "YOUR_REF"}/auth/url-configuration
2. Site URL → ${siteUrl}
3. Redirect URLs → add each line:
   ${siteUrl}/login
   ${siteUrl}/host
   http://localhost:5173/login
   http://localhost:5173/host

Optional: add SUPABASE_ACCESS_TOKEN to server/.env and re-run:
  node scripts/fix-supabase-oauth-urls.mjs
`);
  process.exit(0);
}

const redirects = [
  `${siteUrl}/login`,
  `${siteUrl}/host`,
  "http://localhost:5173/login",
  "http://localhost:5173/host",
].join(",");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    site_url: siteUrl,
    uri_allow_list: redirects,
  }),
});

if (!res.ok) {
  console.error("Failed:", res.status, await res.text());
  process.exit(1);
}

console.log("✓ Site URL:", siteUrl);
console.log("✓ Redirect URLs updated (production + localhost)");
