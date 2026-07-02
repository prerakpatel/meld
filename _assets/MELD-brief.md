# MELD — Design Brief v0.1

A cozy daily word game. Tap two visible chunks, meld them into a word, find the day's full set. Built to be fair, warm, and quietly addictive — Wordle's habit-shape with a word-building soul.

---

## The one-sentence pitch
You're given a handful of letter-chunks; meld two at a time into real words until you've found all five, including the hidden **keystone**. Fewer wasted melds = higher score.

## Why it works (the design thesis)
Every game the player loves — Wordle, Connections, Crossword, Strands — is a cold logical engine wearing a warm, familiar surface. MELD follows the same trick: the surface is gentle word-building (no trivia, nothing to "know"), the engine underneath is pattern-recognition under a spending constraint. The freshness isn't a never-before-seen mechanic; it's the **fairness rule + cozy identity + daily ritual** executed cleanly.

## The core fairness rule (non-negotiable)
**Never ask the player to know something invisible.** Every chunk is shown as a tile. The player never has to deconstruct a word, guess a syllable boundary, or recall a fact. They only have to *recognize* which two visible pieces snap together. This is the line that separates MELD from a crossword and keeps it feeling fair.

---

## Mechanics (current build)
- **Bank:** ~8 chunk-tiles shown. Chunks are reusable — TON appears in both COTTON and CARTON, so a tile is never consumed.
- **Meld:** tap two tiles → they fill the two slots → press Meld.
- **Budget:** a visible meld budget (currently 8 dots). A *wrong* meld spends one; a *correct* one does not.
- **Scoring:** each word = 20 pts + leftover-meld bonus; keystone = +15. Efficiency is rewarded, exactly like using fewer Wordle rows.
- **Hint:** reveals the first chunk of the next word; costs one meld. The escape hatch so the player is never trapped.
- **End state:** solve all five, or spend out. Missed words are revealed (no limbo). Score shown.
- **Share artifact:** spoiler-free result line — `MELD #1 83pts 🟩🟩🟨🟩⬜` (green found, gold keystone, white missed). Leaderboard-ready.

## Theme & tone
Cozy, warm, coffee-table calm. Today's set is fireside-themed (COTTON, CARTON, DRAGON, WAGGON, EMBER → keystone EMBER). Each day's words share a gentle theme; the keystone is the warm payoff word. Palette: warm paper, clay, moss, gold. Serif display, restrained.

## Cultural lineage (the honest version)
The "operate on chunks larger than a single letter" idea descends from word-transformation traditions (Russian **Balda** — build words by adding pieces to a grid; syllable-operation puzzles). We deliberately rejected raw syllables because syllable boundaries are invisible and contested — unfair. Visible pre-cut chunks are the fair version of the same instinct.

---

## What's solid vs. what's open

**Solid:** the meld action feels good; the budget/score gives real stakes; the share format works; the fairness rule is clear and defensible.

**Open / to build:**
1. **Generator** — the biggest one. Need an algorithm that produces a daily set: pick a themed word group, cut each into chunks, pool the chunks, guarantee (a) every word is solvable from the pool, (b) good *decoy* pairings exist (chunks that look meldable but aren't), (c) a unique-ish difficulty. Without this it's not a daily product.
2. **Difficulty curve** — tune bank size, number of words, number of decoys, budget size. Needs playtesting.
3. **Visual/UX** — hand off to Claude Design for a distinctive identity. (This brief is the input.)
4. **Leaderboard & sharing** — streaks, daily rank, friend compare. The share line already encodes the data.
5. **Multiplayer (optional, later)** — "race the same daily puzzle, compare scores." Soft requirement; solo-first.

---

## Ideas to lift it from "fine" to "distinctive"
These are the candidate hooks that could make MELD *yours*, not just competent:
- **Golden chunk:** one chunk lives in two different words — spotting the double-use is the day's "aha."
- **The keystone reveal:** after solving, show the keystone word's etymology or a one-line origin — so you *learn* something, feeding the "builds my vocabulary" goal.
- **Themed weeks:** Mon–Sun share a meta-theme; a 7th hidden word assembles from one chunk per day (a Strands-style long game that rewards the daily habit).
- **Twist tile:** an occasional wild chunk that can be two things (e.g. silent vs. voiced), adding a deduction layer without breaking fairness.
- **Streak warmth:** the cozy framing extends to the streak — a hearth that grows, not a cold number.

---

## Immediate next steps
1. ✅ Fix prototype logic (tiles stay, no dead space, real empty states) — done in v3.
2. → Hand this brief + v3 to **Claude Design** for a visual identity pass.
3. → Prototype the **generator** so daily puzzles are real, not hand-authored.
4. → Layer in one "distinctive" hook (recommend: keystone etymology reveal — cheapest, most on-brief).
