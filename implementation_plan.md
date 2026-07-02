# Meld — Architecture Plan

## Executive Summary

Meld is a daily word-combining puzzle game (like Wordle, but for compound words). Today it's a single static React app with 14 puzzles baked into the code and no memory of who played what. The goal: turn it into a public daily game with real puzzle delivery and streak/stats tracking, kept cheap and low-maintenance since there's no dedicated ops/dev team behind it.

## Technology Stack

- **Frontend:** React + Vite (already built — no rework needed)
- **Styling:** Add Tailwind CSS (swap in gradually, doesn't require a rewrite)
- **State Management:** Local `useState` for gameplay (already in place); a small data-fetching layer (e.g. `@tanstack/react-query`) for talking to the backend
- **Backend + Database:** Supabase (managed Postgres + auto-generated API + built-in auth) instead of a hand-rolled server
- **Hosting / CI/CD:** Vercel or Netlify for the frontend (free tier, auto-deploys from GitHub); Supabase's own hosting for backend/database (also free tier to start)

## Why Supabase instead of a custom backend

You said the two things you actually need are: (1) puzzles served reliably, ideally without a code redeploy every time you add one, and (2) player streaks/stats. Both map cleanly onto a managed database + a bit of read/write logic — neither needs a custom server you'd have to patch and monitor yourself. A custom Node/Express backend would mean owning server security updates, uptime, and scaling by hand; Supabase (or Firebase as the alternative) hosts and patches that layer for you, has a generous free tier, and gives you a real Postgres database with a point-and-click table editor — useful since you're not writing SQL by hand day to day.

## High-Level Architecture

```
Player's browser
   │
   ▼
React app (Vercel/Netlify)
   │  fetches today's puzzle, reads/writes streak
   ▼
Supabase
   ├─ Postgres table: puzzles (day, theme, words JSON)
   ├─ Postgres table: player_stats (device/account id, streak, last_played)
   └─ Auth (optional — anonymous device id is enough for streaks;
            real accounts only needed if players want stats to follow them across devices)
```

- **Puzzles move from the code into a database table.** You (or anyone helping you) can add/edit a day's puzzle through Supabase's table editor — no code change, no redeploy.
- **"Today's puzzle" logic moves server-side** (a Supabase Edge Function or even just a query filtered by date) so it's driven by the database, not baked-in JavaScript math — this also removes the current bug-like behavior where reloading always gives you the same puzzle.
- **Streaks** are tracked by a lightweight anonymous identifier stored in the browser (no login required to start), upgradeable to real accounts later if you want cross-device streaks.

## State Management & Data Fetching Strategy

Gameplay state (selected tiles, current guess, win/lose) stays exactly as it is today — local `useState` in `App.jsx`, no need to touch it. The only new piece is fetching "today's puzzle" and the player's streak from Supabase on load, which is a good fit for React Query: it handles loading/error states and caching for you without hand-written fetch logic scattered around the component.

## Routing & Code Organization

No routing needed yet — it's a single-page daily game. Suggested folder split as the backend is added:
- `src/features/game/` — existing gameplay UI
- `src/features/stats/` — streak display, fetched from Supabase
- `src/lib/supabase.js` — one file holding the Supabase client setup

## Performance & Optimization Strategy

- Keep the bundle small — this app doesn't need heavy libraries; Tailwind and React Query are both lightweight.
- Cache "today's puzzle" response client-side for the day (React Query does this by default) so you're not re-fetching on every interaction.
- Supabase's free tier includes its own CDN/caching for static queries — no extra setup required at this scale.

## Cost Estimate

- Vercel/Netlify: free tier (personal projects/small traffic)
- Supabase: free tier (500MB database, 50k monthly active users on auth) — comfortably covers "not sure / just want it to not break" scale
- Realistic cost until meaningful growth: **$0/month**

## Suggested Next Steps

1. Create a free Supabase project, add a `puzzles` table, migrate the 14 existing puzzles into it.
2. Replace `getTodayPuzzle()` in [puzzles.js](src/puzzles.js) with a Supabase query.
3. Add an anonymous streak-tracking table and wire it into the win screen.
4. Deploy the frontend to Vercel or Netlify with auto-deploy from your GitHub repo.
