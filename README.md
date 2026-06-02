# AlkheelanK

**Fast-tap trivia for your living room.** A real-time multiplayer quiz game — the host runs the big screen, everyone else plays from their phones with a 6-digit PIN. Same energy and mechanics you already know, our own look.

- ▲ ◆ ● ■ — four colored, shaped answer tiles
- Score rewards **speed *and* correctness**
- Live answer distribution + climbing leaderboard between questions
- A dramatic final podium with confetti

> Built for personal use (family/friends). Game state is in-memory (no DB for live play). Hosts can **optionally** sign in to save quizzes — players never need an account.

---

## Stack

| Part   | Tech                                   | Deploy |
| ------ | -------------------------------------- | ------ |
| Client | React + Vite + Tailwind + Framer Motion | Vercel |
| Server | Node + Express + Socket.io (in-memory) | Render |

### Sync model

- **`game:PIN`** — room for everyone in a game (host + all players)
- **`host:PIN`** — host-only events (e.g. live answer counts)
- The **correct answer never leaves the server** in a player payload. Questions are broadcast via `buildPublicQuestion()` which only sends answer *text* by position; the correct index is revealed to everyone **only after** a question closes.

### Scoring

```
correct: 1000 * (0.5 + 0.5 * timeRemaining / timeLimit)
wrong:   0
```

One answer per player per question, enforced server-side. Late answers (after the timer) are ignored.

---

## Run it locally

You need **Node 18+**. Open two terminals.

**1. Server**

```bash
cd server
npm install
cp .env.example .env   # optional; defaults are fine for local
npm run dev            # http://localhost:3001
```

**2. Client**

```bash
cd client
npm install
cp .env.example .env   # VITE_SERVER_URL=http://localhost:3001
npm run dev            # http://localhost:5173
```

Open `http://localhost:5173` on your laptop/TV and click **Host**. On each phone (same network), open the same URL and enter the PIN. To reach phones, run the client with the host flag already set (Vite is configured with `host: true`) and visit `http://<your-computer-ip>:5173`.

---

## Host accounts (optional — Supabase)

Hosts can sign up / log in to **save quizzes** to their account and see a dashboard with launch / edit / duplicate / delete and a game-night history. This is fully optional: with no keys set, the app runs in **guest mode** (run one-off games, build quizzes that aren't saved). **Players never need an account.**

Setup (2 minutes):

```bash
# From repo root — copies .env files, installs deps, checks Supabase
npm run setup:all
```

Or manually:

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql) (or [`supabase/patch-missing-tables.sql`](supabase/patch-missing-tables.sql) if you already ran an older schema), and run it.
3. **Project Settings → API Keys**: copy the **Project URL** and **Publishable** key (`sb_publishable_...`) into `client/.env`:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # or legacy anon JWT (eyJ...)
```

4. (Optional) In **Authentication → Providers → Email**, turn off "Confirm email" for instant local testing, or leave it on for production.

5. **Google sign-in (local + production):** In **Authentication → Providers → Google**, enable the provider and complete the Google Cloud OAuth client. Then in **Authentication → URL configuration**, add **Redirect URLs** for every origin you use:
   - `http://localhost:5173/login` (and `/host` if you used an older build)
   - `https://YOUR-VERCEL-URL.vercel.app/login` (same for production)

   Set **Site URL** to your production URL when deployed. On Vercel, also set `VITE_SITE_URL` to that URL and redeploy.

> The anon key is a **public** browser key, gated by RLS — safe to ship. Never put the `service_role` or `sb_secret_` key in the client. On Vercel, add both `VITE_SUPABASE_*` vars in the project settings, then **redeploy** (env vars are baked in at build time). Step-by-step: [`docs/VERCEL_SETUP.md`](docs/VERCEL_SETUP.md).

---

## How to play

1. **Host** opens the site → **Host on the big screen** → pick a quiz. A 6-digit PIN appears.
2. **Players** open the site on their phones, type the PIN + a nickname.
3. Host hits **Start**. Each question shows on the big screen with a countdown; phones show four tiles to tap.
4. After the timer (or once everyone answers): the big screen reveals the correct answer + how many picked each tile, then the leaderboard. Phones show each player's hit/miss, points, and rank.
5. Host advances through all questions, then the **podium**.

---

## Deploy

### Server → Render

1. Push this repo to GitHub.
2. Render → **New → Blueprint** and select the repo (uses `render.yaml`), **or** New → Web Service with **Root Directory** `server`, build `npm install`, start `npm start`.
3. After the client is live, set the server env var **`CORS_ORIGIN`** to your Vercel URL (e.g. `https://alkheelank.vercel.app`).

### Client → Vercel

**Option A (recommended):** Root Directory = `client`

1. Vercel → **New Project** → import the repo.
2. **Settings → Build and Deployment → Root Directory** → set to `client` → Save.
3. Framework: **Vite** (build `npm run build`, output `dist`). `client/vercel.json` pins these and SPA rewrites.
4. Add env var **`VITE_SERVER_URL`** = your Render URL (e.g. `https://alkheelank-server.onrender.com`). Redeploy.

**Option B:** Root Directory left blank (repo root)

1. Use the repo-root `vercel.json` (builds `client/` and serves `client/dist`).
2. Do **not** also set Root Directory to `client` — pick one layout.

**404 `NOT_FOUND` on every URL (even `/`)**

The deploy can show “Ready” but serve Vercel’s blank 404 if the wrong folder is built. Check:

| Setting | Must be |
| -------- | -------- |
| Root Directory | `client` (Option A) **or** repo root (Option B) — never `server` |
| Output Directory | `dist` (Option A) **or** `client/dist` (Option B) |
| Framework | Vite |

After fixing, **Deployments → ⋯ → Redeploy**.

> Free Render web services sleep when idle — the first connection after a nap takes a few seconds to wake.

---

## Project layout

```
AlkheelanK/
├── server/                 # Express + Socket.io (in-memory game state)
│   └── src/
│       ├── index.js        # socket wiring, room broadcasts, timers
│       ├── gameManager.js  # state, scoring, public/private payloads
│       └── quizzes.js      # built-in quizzes (add your own here)
├── supabase/
│   └── schema.sql          # quizzes + game_history tables + RLS policies
└── client/                 # Vite + React + Tailwind
    └── src/
        ├── pages/          # Landing, Auth, Host (orchestrator), Dashboard,
        │                   #   QuizEditor, HostGame, Play
        ├── components/     # AnswerTile, Timer, Leaderboard, Podium, Logo…
        └── lib/            # auth, supabase, db, answer shapes, sound synth
```

## Add your own quiz

Edit `server/src/quizzes.js`. Each question needs exactly **4 answers** and a `correct` index (0–3):

```js
{
  question: "Best pizza topping?",
  answers: ["Pineapple", "Pepperoni", "Mushroom", "Plain"],
  correct: 1,
  timeLimit: 20,
}
```
