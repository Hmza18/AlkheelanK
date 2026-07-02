/**
 * Optional: enable instant email signup (no confirmation email).
 * Requires SUPABASE_ACCESS_TOKEN in server/.env (Personal Access Token from
 * https://supabase.com/dashboard/account/tokens — scopes: auth_config_write)
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

if (!token || !ref) {
  console.log(`
Optional: skip email confirmation on sign-up

1. Create a token: https://supabase.com/dashboard/account/tokens
   (include auth_config_write)
2. Add to server/.env:  SUPABASE_ACCESS_TOKEN=sbp_...
3. Re-run: node scripts/configure-auth.mjs

Or manually: Authentication → Providers → Email → disable "Confirm email"
`);
  process.exit(0);
}

const siteUrl = (process.argv[2] || serverEnv.SITE_URL || serverEnv.PRODUCTION_SITE_URL || "http://localhost:5173").replace(
  /\/$/,
  "",
);
const productionSite = (serverEnv.PRODUCTION_SITE_URL || "https://www.alkheelan.xyz").replace(/\/$/, "");

const redirects = [
  "http://localhost:5173/**",
  "http://localhost:5173/login",
  "http://localhost:5173/host",
  `${productionSite}/**`,
  `${productionSite}/login`,
  `${productionSite}/host`,
  "https://alkheelan.xyz/**",
  "https://alkheelan.xyz/login",
  "https://alkheelan.xyz/host",
  `${siteUrl}/**`,
  `${siteUrl}/login`,
  `${siteUrl}/host`,
]
  .filter((v, i, a) => a.indexOf(v) === i)
  .join(",");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    mailer_autoconfirm: true,
    site_url: siteUrl,
    uri_allow_list: redirects,
  }),
});

if (!res.ok) {
  console.error("Auth config update failed:", res.status, await res.text());
  process.exit(1);
}

console.log("✓ Email autoconfirm enabled");
console.log(`✓ Site URL: ${siteUrl}`);
console.log("✓ Redirect URLs include /host for local + production");
