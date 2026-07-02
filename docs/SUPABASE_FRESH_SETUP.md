# Fresh Supabase setup (new project)

Use this when starting over — e.g. old project deleted or dashboard empty.

## 1. Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. **New project** → pick a name (e.g. `kheelan`), set a **database password** (save it), choose a region close to you.
3. Wait until the project finishes provisioning (~2 minutes).

## 2. Copy API keys into the app

**Project Settings → API Keys**

| Dashboard | Put in `client/.env` |
|-----------|----------------------|
| Project URL | `VITE_SUPABASE_URL` |
| Publishable key (`sb_publishable_…`) | `VITE_SUPABASE_ANON_KEY` |

Example:

```env
VITE_SERVER_URL=http://localhost:3001
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Restart Vite after saving (`npm run dev` in `client`).

## 3. Create database tables

**Option A — SQL Editor (easiest)**

1. Open **SQL → New query** in the dashboard.
2. Paste the full contents of [`supabase/schema.sql`](../supabase/schema.sql).
3. Click **Run**.

**Option B — CLI script (if you saved the DB password)**

1. Add to `server/.env`:
   ```env
   SUPABASE_DB_PASSWORD=your-database-password
   ```
2. From repo root:
   ```bash
   npm run apply-schema -- --full
   ```

## 4. Auth settings (login)

**Authentication → URL configuration**

| Field | Local dev | Production (later) |
|-------|-----------|-------------------|
| Site URL | `http://localhost:5173` | `https://your-live-domain.com` |
| Redirect URLs | `http://localhost:5173/login` | `https://your-live-domain.com/login` |

**Authentication → Providers → Email**

- For quick local testing: turn **off** “Confirm email” (avoids confirmation emails and Supabase’s ~2/hour built-in email cap).
- For production: leave confirmation **on** and set up **Authentication → SMTP** (Resend, SendGrid, etc.) — the default Supabase mailer is not meant for real signups.

If sign-up says **email rate limit exceeded**: you hit that cap. Use **Google** sign-in, disable confirm email above, or wait ~1 hour.

**Authentication → Providers → Google** (optional)

- Enable Google, add OAuth client from Google Cloud Console.
- **Callback URL** (in Google Cloud, not your domain):  
  `https://mcwiescfsbuuglrnakyh.supabase.co/auth/v1/callback`
- **JavaScript origins:** `http://localhost:5173` (+ your production URL)
- Or run `npm run setup:google-auth` after adding credentials to `server/.env` (see script output).

Same redirect URLs as above.

Optional automation (needs a [personal access token](https://supabase.com/dashboard/account/tokens) in `server/.env` as `SUPABASE_ACCESS_TOKEN`):

```bash
node scripts/configure-auth.mjs
```

## 5. Verify

```bash
npm run setup
```

You should see `✓ Supabase API key works` and all tables listed.

Then open `http://localhost:5173/login` — sign up with email or Google.

## 6. Production (Vercel)

After local login works, add the same `VITE_SUPABASE_*` vars in Vercel and redeploy. See [`VERCEL_SETUP.md`](VERCEL_SETUP.md).
