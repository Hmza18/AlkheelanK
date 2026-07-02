/**
 * Enable Google sign-in on Supabase + set OAuth redirect URLs.
 *
 * server/.env:
 *   SUPABASE_ACCESS_TOKEN=sbp_...   https://supabase.com/dashboard/account/tokens (auth_config_write)
 *   GOOGLE_CLIENT_ID=....apps.googleusercontent.com
 *   GOOGLE_CLIENT_SECRET=GOCSPX-...
 *
 * Optional:
 *   SITE_URL=http://localhost:5173
 *   PRODUCTION_SITE_URL=https://www.alkheelan.xyz
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
const googleId = process.env.GOOGLE_CLIENT_ID || serverEnv.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET || serverEnv.GOOGLE_CLIENT_SECRET;
const siteUrl = (process.argv[2] || serverEnv.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
const prodUrl = (serverEnv.PRODUCTION_SITE_URL || "https://www.alkheelan.xyz").replace(/\/$/, "");

const callbackUrl = ref ? `https://${ref}.supabase.co/auth/v1/callback` : "https://YOUR-REF.supabase.co/auth/v1/callback";

if (!ref) {
  console.error("Could not parse project ref from client/.env VITE_SUPABASE_URL");
  process.exit(1);
}

if (!token || !googleId || !googleSecret) {
  console.log(`
Google auth setup for project: ${ref}

━━━ Step 1: Google Cloud Console ━━━
https://console.cloud.google.com/auth/clients

Create OAuth client → Web application

Authorized JavaScript origins:
  ${siteUrl}
  ${prodUrl}

Authorized redirect URIs (do not change to your domain):
  ${callbackUrl}

Save Client ID + Client Secret.

━━━ Step 2: Supabase dashboard (manual) ━━━
https://supabase.com/dashboard/project/${ref}/auth/providers?provider=Google
  → Enable Google, paste Client ID + Secret

https://supabase.com/dashboard/project/${ref}/auth/url-configuration
  Site URL: ${siteUrl}
  Redirect URLs (one per line):
    ${siteUrl}/login
    ${siteUrl}/host
    ${prodUrl}/login
    ${prodUrl}/host

━━━ Step 3: Automate (optional) ━━━
Add to server/.env:
  SUPABASE_ACCESS_TOKEN=sbp_...
  GOOGLE_CLIENT_ID=....apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-...

Then run: npm run setup:google-auth
`);
  process.exit(0);
}

const redirects = [
  `${siteUrl}/login`,
  `${siteUrl}/host`,
  `${prodUrl}/login`,
  `${prodUrl}/host`,
].join(",");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    external_google_enabled: true,
    external_google_client_id: googleId,
    external_google_secret: googleSecret,
    site_url: siteUrl,
    uri_allow_list: redirects,
    mailer_autoconfirm: true,
  }),
});

if (!res.ok) {
  console.error("Supabase auth config failed:", res.status, await res.text());
  process.exit(1);
}

console.log("✓ Google provider enabled");
console.log("✓ Site URL:", siteUrl);
console.log("✓ Redirect URLs:", redirects.replace(/,/g, "\n   "));
console.log("\nTest: http://localhost:5173/login → Continue with Google");
