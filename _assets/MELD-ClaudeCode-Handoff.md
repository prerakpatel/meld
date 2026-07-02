# MELD — Build Handoff for Claude Code

**Read this whole file first. It contains everything needed to build the game: the design, the rules, the generator, the security requirements, and how to deploy it for free.** The person you're building for is _not a coder_ — explain what you're doing in plain language as you go, and make choices that are safe and cheap by default.

---

## 1. What MELD is

A cozy daily word game, in the spirit of the New York Times Games apps (Wordle, Connections). The player is given a pool of letter-**chunks** (like COT, TON, DRA, GON) and melds two at a time into real words. Find all five words for the day, including the hidden **keystone**. Same puzzle for everyone each day, like Wordle.

**Design north star:** clean and editorial like NYT Games, but _warm_ — soft off-white paper background, a coral/clay accent, a bold slab-serif wordmark. Calm, confident, uncluttered. Fits in one mobile viewport with no scrolling.

---

## 2. Exact design spec (match this)

A finalized design mockup accompanies this handoff (screenshot). Build to match it. Key details:

- **Background:** warm off-white / bone (`#EDE8DF`-ish). Not pure white, not grey.
- **Wordmark:** "MELD" in a heavy slab serif (e.g. a font like _Rockwell_, _Zilla Slab_, or similar), near-black, letter-spaced, centered.
- **Subtitle:** `#1 · FIRESIDE` — the `#1` in coral, the theme name in muted grey caps, letter-spaced.
- **Status row:** left = "MELDS LEFT" label above 4 coral dots (lives). Right = "SCORE" label above a big bold number.
- **Meld area:** a white rounded card containing two empty "chunk" slots with a "+" between them, a helper line ("tap two chunks to meld"), and a large coral **Meld** button with a subtle dark bottom-edge (slightly raised feel, but flat—not glossy).
- **Chunk bank:** 8 tiles in a 4×2 grid. White, rounded, bold slab-serif letters, thin dark outline with a soft dark bottom shadow. Comfortable tap size.
- **Secondary buttons:** "Hint (−1 meld)" in coral with a bulb icon, and "Clear" in muted grey. Pill-shaped.
- **Today's Five:** a white rounded card. Five numbered slots (1–4 as grey circles, the 5th is a coral **key icon** = the keystone). As words are found, the word fills into its slot. The word "KEYSTONE" sits in coral by the key slot.
- **Accent color:** coral/tomato (`#E8654A`-ish). Keystone uses the same coral.
- **Type:** slab serif for the wordmark and tiles; a clean sans for labels and helper text.

**Critical layout requirement:** the entire game fits in one phone viewport (iPhone-sized) with **no scrolling**. The "Today's Five" card replaces the old growing word-list — found words go into the numbered slots, which is what keeps it above the fold.

---

## 3. Game rules (the logic — this is the source of truth)

- **Lives:** 4 melds' worth of mistakes. A _wrong_ meld costs one life. A _correct_ meld costs nothing.
- **Meld:** player taps two chunk tiles (they fill the two slots), then presses Meld. Tiles are **reusable** — a chunk stays in the bank after use, because chunks are shared across words (e.g. TON is in both COTTON and CARTON). Do NOT remove tiles after a correct meld.
- **Winning:** find all 5 words. **Losing:** run out of lives. On loss, reveal the missed words in their slots (no points), so the player is never left stuck.
- **Scoring:** each correct word = 20 points + a bonus equal to the number of lives still remaining (rewards efficiency, like using fewer Wordle rows). The **keystone** word = +15 bonus on top. Show a running score.
- **Hint:** reveals the first chunk of the next unfound word. Costs 1 life. This is the escape hatch so the player is never truly trapped.
- **Feedback:** a correct meld should feel rewarding — briefly highlight the melded tiles, animate the word into its slot, show the points earned. A wrong meld should clearly show a life was spent.
- **Daily puzzle:** same puzzle for everyone on a given calendar day. Pick the day's puzzle by date so it rotates through the puzzle set. (Later, puzzles can be generated further ahead; see §5.)
- **Share result:** at the end, generate a spoiler-free result line, e.g. `MELD #1  83pts` followed by a row of squares (🟩 found / 🟨 keystone / ⬜ missed). Copy-to-clipboard button.

---

## 4. Working reference prototype

A working HTML prototype of the full game logic accompanies this handoff (`meld-4lives.html`). **It is the source of truth for how the game behaves** — the meld action, the 4-life budget, scoring, the daily picker, the win/lose states, the share line. It works but is visually rough.

**Your job:** rebuild it as a clean, maintainable app that (a) behaves exactly like the prototype's logic and (b) looks exactly like the design mockup. Do not invent new mechanics. If the prototype and this document ever disagree on a rule, this document wins.

---

## 5. The puzzle generator (how daily puzzles are made)

Puzzles are **generated ahead of time offline**, not in the browser. This matters for both security (§6) and cost (§7): the app only ever _serves_ pre-made puzzles, so there's no puzzle-making logic exposed to players and nothing for a server to compute.

The generator (a small script) should:

1. Start from a curated list of **cozy-themed common words** (4–7 letters, words a normal person knows — use a word-frequency list so nothing is obscure).
2. Split each word into two clean chunks (avoid 1-letter chunks).
3. Pick a set of 5 words that share some chunks (chunk _reuse_ is what makes puzzles interesting — e.g. TON in COTTON and CARTON).
4. Validate every intended word against a real dictionary, and check what _unintended_ real words the chunk pool could also form — keep that number small so the player isn't unfairly rejected. Any reasonable real word the pool can form should either be an intended answer or explicitly allowed.
5. Mark one word as the **keystone** (suggest: the shortest/coziest word).
6. Output a batch of puzzles as data (theme, chunk pool, the 5 words + which is keystone).

A Python reference implementation using the `wordfreq` library exists and works — reproduce its approach. Generate a batch (e.g. 60+ days) at a time and ship them as a data file.

**Note on the word list:** prefer common words so the game builds vocabulary without being obscure or unfair. This is a core design value.

---

## 6. Security (do this correctly, explain it simply)

The person is worried about hacking and cheating. Here is the honest, proportionate approach — **do not over-engineer, but do these things:**

- **No backend for the core game.** The game is static files (HTML/CSS/JS). There is no server to hack, no database for the base game, no user data at risk. This is the single biggest security win — explain this to the person plainly.
- **No secrets in the app.** Never put API keys, passwords, or tokens in the frontend code. There shouldn't be any for the base game.
- **Answer obfuscation, not encryption.** Encode the puzzle answers (e.g. base64 or light scrambling) so they're not sitting in plain text for someone to screenshot-and-ask-an-AI. Be honest with the person: this deters casual cheating but a determined person can still decode it. That's fine — see below.
- **Cheating is solved socially, not technically.** Like Wordle, everyone plays the same daily puzzle and the only "score" is personal/among friends. As long as there's no high-stakes prize, cheating only spoils it for the cheater. **Recommendation to the person: keep any leaderboard friendly (streaks, friends, bragging) rather than competitive-with-rewards.** Do not try to build an unhackable anti-cheat system for the web — it doesn't exist and isn't needed here.
- **If accounts/leaderboard are added later** (not now): use a managed auth provider (e.g. Supabase Auth or similar) so password handling, hashing, and storage are done correctly by the platform — never roll your own login. Validate/score on the server side at that point so scores can't be trivially faked. Until then, keep it account-free.
- **Standard hygiene:** serve over HTTPS (the recommended hosts do this automatically), keep dependencies minimal and updated.

**Summary for the person:** "A daily word game has almost nothing worth hacking — no money, no personal data. Built as static files with obfuscated answers and a friendly (not high-stakes) leaderboard, it's safe by default. You are not building a bank."

---

## 7. Hosting — free and scalable (walk the person through it)

The game is static files, which is the ideal cheap-hosting case. Recommend **one** of these free tiers (all handle traffic spikes automatically and give HTTPS for free):

- **Cloudflare Pages** — very generous free tier, excellent at absorbing viral spikes.
- **Netlify** — dead-simple, drag-and-drop friendly, great for non-coders.
- **Vercel** — also easy, especially if the app is built with React/Next.

**Recommended for a non-coder: Netlify or Cloudflare Pages**, because deploying can be as simple as connecting a GitHub repo (or even dragging a folder onto their dashboard).

**Cost reality to tell the person:** the base game hosts for **$0** and stays free even under substantial traffic. You'd only pay money if you later add real accounts _and_ the game gets genuinely popular — a good problem, and far away.

**A custom domain** (like `playmeld.com`) is optional and costs ~$10–15/year — the only likely expense.

**Deployment steps to give the person (plain language):**

1. Put the finished code in a GitHub repository (Claude Code can set this up).
2. Create a free account on Netlify (or Cloudflare Pages).
3. Connect the GitHub repo; the host builds and publishes it automatically.
4. Every time the code updates, it re-publishes automatically.
5. (Optional) buy a domain and point it at the host — the host has a guided setup for this.

---

## 7b. Tech stack & architecture (important — read before choosing a stack)

**Stack choice — DECIDED: build this as a React web app.** The person has chosen React (not plain HTML/CSS/JS), and Figma Make already produces React, so this keeps everything in one world. Use a modern, standard, non-coder-friendly React setup: **Vite + React** (simple, fast, minimal config) is the recommended baseline. Keep it a single-page app. Do NOT add heavy state-management libraries (no Redux etc.) — React's built-in `useState`/`useReducer` is more than enough for this game. Keep dependencies minimal. Styling can be plain CSS or a lightweight approach (CSS modules or Tailwind are both fine — pick one and be consistent). The goal is a codebase a non-coder can read and that Claude Code can maintain easily.

**Think of the product in two separate layers — build only Layer 1 now:**

- **Layer 1 — the game (build this now):** tiles, melding, daily puzzle, in-session score, win/lose, share result. This layer is **100% static files, no server, no database.** Everything runs in the player's browser. Persist the player's _own_ streak/progress with browser **localStorage** (free, no backend, device-local). This layer alone is a complete, launchable product. Host it free on Netlify or Cloudflare Pages (§7).

- **Layer 2 — shared/persistent data (DO NOT build now; only when explicitly requested):** a cross-device leaderboard, accounts, or progress that follows a player to a new device. This is the _only_ thing that needs a database, because it requires data to live on the internet rather than on one phone. When the time comes, use **Supabase** (managed database + managed auth in one; free tier). The static game stays on Netlify/Cloudflare and talks to Supabase over the network. **Server-side validate any submitted score** before storing, so scores can't be faked. Never build a custom login/password system — let Supabase handle auth.

**Guidance to give the person:** launch Layer 1 first (free, safe, no database). Only add Layer 2 once the game has proven it's worth the added cost and complexity. Do not wire in a database on day one.

## 8. Suggested build order

1. Rebuild the game to match the design mockup exactly, wiring in the real logic from the prototype (§3, §4). Get it playable and pixel-close.
2. Wire in the pre-generated puzzle batch as an obfuscated data file (§5, §6).
3. Add the end-of-game share result and copy button (§3).
4. Set up the GitHub repo and deploy to a free host (§7). Give the person the live link.
5. LATER (only when asked): the "distinctive" hooks from the design brief — the keystone etymology reveal (teaches the word's origin after solving; serves the vocabulary goal), themed weeks, streaks. And optional accounts/leaderboard with a managed auth provider.

**Throughout: explain each step in plain language, prefer the safe and free option, and never ask the person to handle passwords, keys, or anything security-sensitive manually.**
