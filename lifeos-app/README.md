# Life OS

Your command deck as a real app — Postgres-backed, real login, works from any device,
pulls in real data from Strava, Hevy, Wallet, Apple Health, and Google Calendar, has
dedicated Week and Month views, and an AI mentor that remembers patterns across
sessions instead of starting fresh every time.

This guide is written for zero terminal experience. Every step happens on a website,
in a browser. The only "technical" moments are pasting values you're given into a
form field — nothing to type from scratch, nothing to run as a command.

## Step 1 — Get a free database (Neon)

1. Go to https://neon.tech in your browser, sign up (free).
2. Create a project — any name is fine.
3. It'll show you a connection string starting with `postgresql://`. Click to copy it.
   Paste it somewhere temporary (Notes app) — you'll need it in Step 3.

## Step 2 — Put this code on GitHub

1. Go to https://github.com, sign up if you don't have an account (free).
2. Click the `+` in the top right → "New repository". Name it `lifeos`, keep it
   Private, click Create.
3. On the new repo's page, click "uploading an existing file".
4. Find the `lifeos-app` folder you unzipped, and drag the whole folder straight
   onto that upload page in your browser. GitHub will pull in every file inside it.
5. Scroll down, click "Commit changes".

## Step 3 — Deploy it (Vercel)

1. Go to https://vercel.com, sign up using your GitHub account (one click).
2. Click "Add New" → "Project", pick the `lifeos` repo you just created.
3. Before clicking Deploy, click "Environment Variables" and add these one at a time
   (name on the left, value on the right):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from Step 1 |
   | `NEXTAUTH_SECRET` | `L4rKIid4tp5QYyN11922D/iBomda36i9TsWLo180kCo=` |
   | `NEXTAUTH_URL` | leave blank for now, you'll add it in Step 3b |
   | `CRON_SECRET` | `c87f80466e4409e2dcb9da3e654b47121b8b8ce9` |

   (The two secret values above were generated for you — safe to use as-is since
   only you have this document. If you ever want fresh ones, just ask.)

4. Click Deploy. It'll take a minute or two — Vercel builds the app and sets up
   every database table automatically, no commands needed on your end.
5. Once it's live, copy the `https://something.vercel.app` URL it gives you.

### Step 3b — one more paste

1. Back in Vercel's project settings → Environment Variables, add `NEXTAUTH_URL`
   with the value being that `https://something.vercel.app` URL you just copied.
2. Go to the "Deployments" tab and click "Redeploy" on the latest one, so it picks
   up that new value.

## Step 4 — Create your login

Visit `https://your-url.vercel.app/setup` in your browser. Fill in an email and
password — this is a one-time page, it only works until the first account exists,
then it locks itself.

After that, go to `/login` and sign in with what you just chose.

## Step 5 — Connect your data (optional, do this whenever)

Go to `/settings` on your deployed app:

- **Strava** — needs its own free app registration first: go to
  https://www.strava.com/settings/api, create an app, set "Authorization Callback
  Domain" to your Vercel domain (just the domain, no `https://`, e.g.
  `your-url.vercel.app`). Copy the Client ID and Client Secret it gives you into
  Vercel's environment variables as `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`,
  redeploy, then click "connect strava" on `/settings`.
- **Hevy** — paste your API key from https://hevy.com/settings?developer (needs Pro).
- **Wallet** — paste your API token from the Wallet web app → Settings → Rest API/MCP
  (needs Premium).
- **Apple Health** — copy the webhook URL shown on `/settings`, paste it into the
  Health Auto Export app on your iPhone as a new REST API automation.
- **Google Calendar** — go to https://console.cloud.google.com, create a project,
  enable the "Google Calendar API" under APIs & Services, then create an OAuth
  Client ID (type: Web application) under Credentials. Add
  `https://your-url.vercel.app/api/integrations/google-calendar/callback` as an
  authorized redirect URI. Copy the Client ID and Secret into Vercel as
  `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, redeploy, then click "connect
  calendar" on `/settings`. Your events then show up in the Week view.

## Step 6 — Daily AI tasks

Add one more environment variable in Vercel: `ANTHROPIC_API_KEY`, from
https://console.anthropic.com (this is billed per use, separate from any Claude.ai
subscription — a daily task list costs a fraction of a cent). Redeploy once more.

Every morning it'll sync your connected sources and generate that day's task list
automatically. There's also a "regenerate" button on the dashboard for any time.

## Week and Month views

`/dashboard/week` and `/dashboard/month` (linked from the top of the dashboard)
roll up your synced data into a weekly and monthly view — runs, gym sessions,
steps, calendar events, plus an editable weekly focus, a running list of wins,
and a monthly reflection (what went right / what to change). Navigate between
weeks or months with the arrows; each is independently editable and saved.

## AI memory

Every time the daily task generator or the "AI Mentor" chat box on the dashboard
runs, it writes one short observation to a running memory log — patterns like
"gym consistency drops when sleep is under 6h" or "kept deferring the AbbVie
follow-up three sessions running." Future runs read the last 15 of these before
responding, so the advice compounds instead of resetting to a blank slate each
time. This is deliberately simple (no vector database) — recency-based retrieval
over plain text notes, which is enough for one person's data. If it ever
outgrows that, the retrieval logic lives in `lib/integrations/memoryNotes.ts`
and can be swapped for embeddings-based search without touching anything else.

## If something doesn't work

The most likely failure points, in order:
- **Deploy fails** — usually a missing or mistyped environment variable. Vercel
  shows the build log; the error is usually near the bottom.
- **`/setup` says already set up but you never did it** — someone (or a bot) beat
  you to it because the app was live before you visited `/setup`. Let me know and
  I'll show you how to clear the `User` table in Neon's dashboard (just a few clicks,
  no SQL needed) and try again.
- **Wallet sync errors on `/settings`** — I built it against BudgetBakers' public
  docs, but the exact endpoint paths are only visible inside your own account's
  API docs page. If it errors, that's the first thing to check against
  `lib/integrations/wallet.ts`.

I couldn't test any of this end-to-end myself — no way to reach Strava, Hevy, Wallet,
or a real Postgres database from where I run. Everything here is verified to type-check
and build correctly, but come back the moment something behaves differently than
described and we'll sort it out together.
