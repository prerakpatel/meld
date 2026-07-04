# MELD

A cozy daily word game — meld two letter-chunks into a word, find all five of the day's words, including the hidden **keystone**. Same puzzle for everyone, every day.

An original game by **Prerak Patel** · © 2026 Prerak Patel. All rights reserved.

## How it works

- Fully static React app (Vite + Tailwind). No backend, no accounts, no network calls.
- The year of daily puzzles ships inside the app, lightly obfuscated (`src/data/puzzles.data.js`).
- Player progress, streaks, and stats live in the browser's localStorage only.
- The daily puzzle is picked by the player's local calendar date, like Wordle.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm run lint` | Lint |
| `npm run puzzles:pack` | Re-bundle `scripts/generated_puzzles.json` into the app (run after regenerating puzzles) |

## Maintenance: topping up puzzles

Puzzles are generated offline by `scripts/generate_puzzles.mjs` and packed by `scripts/pack_puzzles.mjs`. When the rotation nears its end (or once a year), regenerate and repack:

```
node scripts/generate_puzzles.mjs
npm run puzzles:pack
```

Then commit and push — Vercel redeploys automatically.

## Testing tricks

- `?practice` on the URL — plays a random puzzle without touching the real daily game, saved progress, or streak. Add a number (`?practice=42`) for a specific one. Works in production; intended for the creator.
- `?day=N` — jump to a specific day. **Dev builds only**; does nothing in production.
