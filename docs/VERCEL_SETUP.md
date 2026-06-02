# Vercel production env (fixes “Login isn’t configured”)

Vite bakes `VITE_*` variables in at **build time**. If they are missing on Vercel, the live site runs in guest mode.

## 1. Add these in Vercel

**Project → Settings → Environment Variables** (enable for **Production**, **Preview**, and **Development**):

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://lfoydcrwkjhzanveyxjj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your **Publishable** key from [Supabase → API Keys](https://supabase.com/dashboard/project/lfoydcrwkjhzanveyxjj/settings/api-keys) |

Use the **Publishable** key (`sb_publishable_...`) for this project. Copy it from the dashboard — do not use the **Secret** key (`sb_secret_...`) here.

| Name | Value |
|------|--------|
| `VITE_SERVER_URL` | Your Render game server URL, e.g. `https://alkheelank-server.onrender.com` |
| `VITE_SITE_URL` | Your Vercel URL, e.g. `https://your-project.vercel.app` |

## 2. Redeploy

**Deployments → ⋯ → Redeploy** (or push to `main` after env vars are saved).

A new build is required; changing env vars alone does not update an old deployment’s JS bundle.

## 3. Supabase redirect URLs (Google login)

[Authentication → URL configuration](https://supabase.com/dashboard/project/lfoydcrwkjhzanveyxjj/auth/url-configuration)

- **Site URL:** your Vercel URL  
- **Redirect URLs:**  
  - `https://YOUR-VERCEL-URL.vercel.app/login`  
  - `https://YOUR-VERCEL-URL.vercel.app/host`  
  - `http://localhost:5173/login`  
  - `http://localhost:5173/host`

## Never put on Vercel (client)

- `sb_secret_...` / `service_role` — server-only, bypasses RLS
