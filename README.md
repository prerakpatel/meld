# MELD

A cozy daily word game — meld two letter-chunks into a word, find all five of the day's words, including the hidden **keystone**. Same puzzle for everyone, every day.

An original game by **Prerak Patel** · © 2026 Prerak Patel. All rights reserved.

## How it works

- Fully static React app (Vite + Tailwind). No backend, no accounts, no network calls.
- 457 daily puzzles (~15 months) ship inside the app, lightly obfuscated (`src/data/puzzles.data.js`), each with hint definitions and a fairness-checked chunk pool. Days with a genuine shared theme carry a label; the rest show the date.
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

Puzzles are generated offline by `scripts/generate_puzzles.mjs`, hint clues by `scripts/build_definitions.mjs` (WordNet, offline), and both are packed by `scripts/pack_puzzles.mjs`. When the rotation nears its end (or once a year), regenerate and repack:

```
node scripts/generate_puzzles.mjs
node scripts/build_definitions.mjs
npm run puzzles:pack
```

Then commit and push — Vercel redeploys automatically.

## Testing tricks

- **Creator practice mode** — tap the MELD wordmark 7 times quickly to toggle unlimited random puzzles. Nothing in the UI or URL reveals it, and it never touches the real daily game, saved progress, or streak. Tap 7 times again to return to today.
- `?day=N` — jump to a specific day. **Dev builds only**; does nothing in production.
