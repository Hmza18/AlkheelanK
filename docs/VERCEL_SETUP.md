# Vercel production env (fixes “Login isn’t configured”)

Vite bakes `VITE_*` variables in at **build time**. If they are missing on Vercel, the live site runs in guest mode.

## 1. Add these in Vercel

**Project → Settings → Environment Variables** (enable for **Production**, **Preview**, and **Development**):

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR-PROJECT-REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your **Publishable** key from Supabase → Settings → API Keys |

Use the **Publishable** key (`sb_publishable_...`) for this project. Copy it from the dashboard — do not use the **Secret** key (`sb_secret_...`) here.

| Name | Value |
|------|--------|
| `VITE_SERVER_URL` | `https://alkheelank-server.onrender.com` |
| `VITE_SITE_URL` | Your Vercel URL, e.g. `https://alkheelan-k.vercel.app` or `https://www.alkheelan.xyz` |

## 1b. Render server CORS (required for live play)

The game server on Render must allow your client origin. In **Render → alkheelank-server → Environment**:

| Name | Value |
|------|--------|
| `CORS_ORIGIN` | `https://www.alkheelan.xyz,https://alkheelan.xyz,https://alkheelan-k.vercel.app,http://localhost:5173` |

Save and redeploy the Render service. Without this, the browser blocks requests even when the server is up.

## 2. Redeploy

**Deployments → ⋯ → Redeploy** (or push to `main` after env vars are saved).

A new build is required; changing env vars alone does not update an old deployment’s JS bundle.

## 3. Supabase redirect URLs (Google login) — required

If Google sign-in sends you to **localhost** (connection refused), Supabase **Site URL** is still set to local dev.

[Authentication → URL configuration](https://supabase.com/dashboard/project/_/auth/url-configuration) (open your project first)

- **Site URL:** `https://www.alkheelan.xyz` (your live URL — **not** `http://localhost:5173`)
- **Redirect URLs:**  
  - `https://www.alkheelan.xyz/login`  
  - `https://www.alkheelan.xyz/host`  
  - `http://localhost:5173/login`  
  - `http://localhost:5173/host`

Or run: `node scripts/fix-supabase-oauth-urls.mjs` (needs `SUPABASE_ACCESS_TOKEN` in `server/.env`).

## Never put on Vercel (client)

- `sb_secret_...` / `service_role` — server-only, bypasses RLS
