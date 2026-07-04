// Generates all 365 puzzle days under a strict layout-stability rule:
// every single day must have EXACTLY 8 tiles, each tile 3-4 letters long
// (so every puzzle renders as an identical 4-column x 2-row grid — no
// puzzle can ever force a 3rd row or oddly-sized tiles).
//
// Days that already conformed to this rule (audited from the live dataset)
// are kept as-is. Every non-conforming day is replaced with freshly
// generated content, sourced from a curated word bank plus a filtered
// common-English-word supplement (needed for volume — seven letter's
// worth of word variety disappears once every word must be 6-8 letters).
//
// Every word is verified against a real dictionary before use. Run the
// self-test assertions at the bottom before trusting the output.

import fs from 'node:fs';
import wordListPath from 'word-list';
import { WORD_BANK } from './word_bank.mjs';

const MIN_FRAG = 3;
const MAX_FRAG = 4;
const POOL_SIZE = 8; // exact, not a cap
const TOTAL_DAYS = 365;

// ---- 1. Load the real-dictionary validity set ----
const dictionary = new Set(
  fs.readFileSync(wordListPath, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean),
);

// ---- 2. Audit the current live dataset for conformance ----
function parseDays(sql) {
  const out = [];
  const re = /\((\d+),\s*'([^']*)',\s*'(\[.*?\])'::jsonb,\s*'(\[.*?\])'::jsonb\)/gs;
  let m;
  while ((m = re.exec(sql))) {
    out.push({
      day: Number(m[1]),
      theme: m[2],
      pool: JSON.parse(m[3].replace(/''/g, "'")),
      words: JSON.parse(m[4].replace(/''/g, "'")),
    });
  }
  return out;
}

const migration1 = fs.readFileSync(new URL('../supabase/puzzles_migration.sql', import.meta.url), 'utf8');
const migration2 = fs.readFileSync(new URL('../supabase/puzzles_year_migration.sql', import.meta.url), 'utf8');
const currentDays = [...parseDays(migration1), ...parseDays(migration2)].sort((a, b) => a.day - b.day);

const keptDays = [];
const daysNeedingReplacement = [];
for (const d of currentDays) {
  const poolOk = d.pool.length === POOL_SIZE;
  const fragOk = d.pool.every((f) => f.length >= MIN_FRAG && f.length <= MAX_FRAG);
  if (poolOk && fragOk) keptDays.push(d);
  else daysNeedingReplacement.push(d.day);
}
console.log(`Audit of current ${currentDays.length} days: ${keptDays.length} already conform, ${daysNeedingReplacement.length} need replacement.`);

const alreadyUsed = new Set(keptDays.flatMap((d) => d.words.map((w) => w.w.toUpperCase())));

// ---- 3. Build the candidate word pool: curated bank + filtered common-word supplement ----
const seen = new Set(alreadyUsed);
const candidates = []; // { word, theme }
let rejectedInvalid = 0;
let rejectedDuplicate = 0;

function tryAdd(rawWord, theme) {
  const word = rawWord.toUpperCase();
  if (seen.has(word)) { rejectedDuplicate++; return; }
  if (word.length < 6 || word.length > 8) { rejectedInvalid++; return; }
  if (!dictionary.has(word.toLowerCase())) { rejectedInvalid++; return; }
  seen.add(word);
  candidates.push({ word, theme });
}

for (const [theme, words] of Object.entries(WORD_BANK)) {
  for (const raw of words) tryAdd(raw, theme);
}
const curatedCount = candidates.length;

// Supplement with common English words (needed for volume once every word must
// be exactly 6-8 letters) — still 100% real dictionary words, just not
// hand-picked for theme the way the curated bank is.
const commonWordsPath = new URL('./common_words_10k.txt', import.meta.url);
if (fs.existsSync(commonWordsPath)) {
  const badSuffix = ['ing', 'tion', 'sion', 'ment', 'ness', 'ity', 'ous', 'ive', 'ism', 'ology'];
  const properNounish = new Set(['ireland', 'william', 'houston', 'george', 'joseph', 'thomas', 'arthur', 'walter', 'albert', 'oregon', 'boston', 'dallas', 'denver', 'austin', 'renton', 'sydney', 'berlin', 'moscow', 'russia', 'canada', 'mexico', 'israel', 'poland']);
  const commonWords = fs.readFileSync(commonWordsPath, 'utf8').split('\n').map((w) => w.trim()).filter(Boolean);
  for (const w of commonWords) {
    if (!/^[a-z]+$/.test(w)) continue;
    if (properNounish.has(w)) continue;
    if (badSuffix.some((suf) => w.endsWith(suf))) continue;
    tryAdd(w, 'common');
  }
}
console.log(`Candidates: ${candidates.length} total (${curatedCount} from curated bank, ${candidates.length - curatedCount} from common-word supplement) | rejected: ${rejectedInvalid} invalid, ${rejectedDuplicate} dupes.`);

// ---- 4. Compute all valid (a,b) splits per word (3-4 letters each side only) ----
function splitsFor(word) {
  const out = [];
  for (let i = MIN_FRAG; i <= word.length - MIN_FRAG; i++) {
    const a = word.slice(0, i);
    const b = word.slice(i);
    if (a.length <= MAX_FRAG && b.length <= MAX_FRAG) out.push([a, b]);
  }
  return out;
}

const allSplitsByWord = new Map();
for (const { word } of candidates) allSplitsByWord.set(word, splitsFor(word));

const usableCandidates = candidates.filter((c) => allSplitsByWord.get(c.word).length > 0);
const wordToTheme = new Map(usableCandidates.map((c) => [c.word, c.theme]));
const isCurated = new Set(usableCandidates.filter((c) => c.theme !== 'common').map((c) => c.word));

// Rank candidate words by how many *other* usable words could plausibly share
// a fragment with them (used only to order search attempts, not to force reuse).
const fragPotential = new Map();
for (const { word } of usableCandidates) {
  for (const [a, b] of allSplitsByWord.get(word)) {
    fragPotential.set(a, (fragPotential.get(a) || 0) + 1);
    fragPotential.set(b, (fragPotential.get(b) || 0) + 1);
  }
}
function connectivityOf(word) {
  let score = 0;
  for (const [a, b] of allSplitsByWord.get(word)) score += (fragPotential.get(a) || 0) + (fragPotential.get(b) || 0);
  return score;
}

// Picks whichever valid split of `word` best matches the current pool (reuses
// existing fragments where possible; otherwise returns the split with the
// fewest brand-new fragments).
function bestSplitFor(word, fragSet) {
  const splits = allSplitsByWord.get(word);
  let best = splits[0];
  let bestNewFrags = Infinity;
  for (const [a, b] of splits) {
    const newFrags = (fragSet.has(a) ? 0 : 1) + (fragSet.has(b) ? 0 : 1);
    if (newFrags < bestNewFrags) { bestNewFrags = newFrags; best = [a, b]; }
  }
  return best;
}
function newFragCountFor(word, fragSet) {
  const [a, b] = bestSplitFor(word, fragSet);
  return (fragSet.has(a) ? 0 : 1) + (fragSet.has(b) ? 0 : 1);
}

// ---- 5. Backtracking search: build a 5-word group whose pool is EXACTLY 8 ----
const remaining = usableCandidates.map((c) => c.word);
// Prefer curated (thematic) words over the generic common-word supplement,
// only reaching for the supplement once curated options run out.
const CURATED_BONUS = 1_000_000;
remaining.sort((w1, w2) => {
  const score1 = connectivityOf(w1) + (isCurated.has(w1) ? CURATED_BONUS : 0);
  const score2 = connectivityOf(w2) + (isCurated.has(w2) ? CURATED_BONUS : 0);
  return score2 - score1;
});
const used = new Set();

function buildDay(seed) {
  const pool = new Set(bestSplitFor(seed, new Set()));
  const groupSplits = new Map([[seed, [...pool]]]);
  const group = [seed];

  // Search only among a bounded window of the most-connected remaining words
  // (checked against the seed's neighborhood first, full list as fallback).
  const searchPool = remaining.filter((w) => w !== seed && !used.has(w)).slice(0, 400);

  function backtrack(startIdx) {
    if (group.length === 5) return pool.size === POOL_SIZE;

    const wordsLeft = 5 - group.length;
    const budgetLeft = POOL_SIZE - pool.size;
    if (budgetLeft < 0 || budgetLeft > 2 * wordsLeft) return false;

    for (let i = startIdx; i < searchPool.length; i++) {
      const w = searchPool[i];
      if (used.has(w) || group.includes(w)) continue;

      const newFrags = newFragCountFor(w, pool);
      const newBudget = budgetLeft - newFrags;
      const newWordsLeft = wordsLeft - 1;
      if (newBudget < 0 || newBudget > 2 * newWordsLeft) continue;

      const split = bestSplitFor(w, pool);
      group.push(w);
      groupSplits.set(w, split);
      const addedA = !pool.has(split[0]);
      const addedB = !pool.has(split[1]);
      if (addedA) pool.add(split[0]);
      if (addedB) pool.add(split[1]);

      if (backtrack(i + 1)) return true;

      if (addedA) pool.delete(split[0]);
      if (addedB) pool.delete(split[1]);
      group.pop();
      groupSplits.delete(w);
    }
    return false;
  }

  return backtrack(0) ? { group, groupSplits } : null;
}

const newDays = [];
for (const seed of remaining) {
  if (used.has(seed)) continue;
  if (newDays.length >= daysNeedingReplacement.length) break;

  const result = buildDay(seed);
  if (!result) continue;
  const { group, groupSplits } = result;
  group.forEach((w) => used.add(w));

  const themeCounts = new Map();
  for (const w of group) themeCounts.set(wordToTheme.get(w), (themeCounts.get(wordToTheme.get(w)) || 0) + 1);
  const theme = [...themeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  let keystone = group[0];
  let keystoneScore = -1;
  for (const w of group) {
    const [a, b] = groupSplits.get(w);
    let score = 0;
    for (const other of group) {
      if (other === w) continue;
      const [oa, ob] = groupSplits.get(other);
      if (oa === a || oa === b || ob === a || ob === b) score++;
    }
    if (score > keystoneScore) { keystoneScore = score; keystone = w; }
  }

  const words = group.map((w) => {
    const [a, b] = groupSplits.get(w);
    return { a, b, w, key: w === keystone };
  });
  const pool = [...new Set(words.flatMap((o) => [o.a, o.b]))].sort();

  newDays.push({ dayNumberSlot: daysNeedingReplacement[newDays.length], theme, pool, words });
}
console.log(`Built ${newDays.length} replacement days (needed ${daysNeedingReplacement.length}).`);

// Assign the built replacements to the actual day numbers that needed fixing
const replacedDays = newDays.map((d, i) => ({ day: daysNeedingReplacement[i], theme: d.theme, pool: d.pool, words: d.words }));
const allDays = [...keptDays, ...replacedDays].sort((a, b) => a.day - b.day);

// ---- 6. Self-test assertions ----
function assert(cond, msg) {
  if (!cond) throw new Error('SELF-TEST FAILED: ' + msg);
}

assert(allDays.length === TOTAL_DAYS, `expected ${TOTAL_DAYS} days, got ${allDays.length}`);
const allWordsEver = new Set();
for (const d of allDays) {
  assert(d.words.length === 5, `day ${d.day} does not have 5 words`);
  assert(d.words.filter((w) => w.key).length === 1, `day ${d.day} does not have exactly one keystone`);
  assert(d.pool.length === POOL_SIZE, `day ${d.day} has ${d.pool.length} tiles, not exactly ${POOL_SIZE}`);
  assert(d.pool.every((f) => f.length >= MIN_FRAG && f.length <= MAX_FRAG), `day ${d.day} has a tile outside ${MIN_FRAG}-${MAX_FRAG} letters`);
  for (const w of d.words) {
    assert(w.a + w.b === w.w, `day ${d.day}: ${w.a}+${w.b} !== ${w.w}`);
    assert(dictionary.has(w.w.toLowerCase()), `day ${d.day}: "${w.w}" is not a real dictionary word`);
    assert(!allWordsEver.has(w.w), `day ${d.day}: "${w.w}" is a duplicate across the whole dataset`);
    allWordsEver.add(w.w);
  }
  const expectedPool = [...new Set(d.words.flatMap((o) => [o.a, o.b]))].sort();
  assert(JSON.stringify(expectedPool) === JSON.stringify(d.pool), `day ${d.day}: pool does not match unique fragments`);
}
const dayNumbers = allDays.map((d) => d.day);
assert(new Set(dayNumbers).size === dayNumbers.length, 'duplicate day numbers');
assert(JSON.stringify(dayNumbers) === JSON.stringify([...dayNumbers].sort((a, b) => a - b)), 'day numbers not sorted 1..365');
console.log('All self-test assertions passed: every one of the 365 days has exactly 8 tiles, each 3-4 letters.');

// ---- 7. Write outputs ----
fs.writeFileSync(new URL('./generated_puzzles.json', import.meta.url), JSON.stringify(allDays, null, 2));

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

function toValues(days) {
  return days.map((d) => {
    const poolJson = sqlEscape(JSON.stringify(d.pool));
    const wordsJson = sqlEscape(JSON.stringify(d.words));
    return `(${d.day}, '${sqlEscape(d.theme)}', '${poolJson}'::jsonb, '${wordsJson}'::jsonb)`;
  }).join(',\n');
}

const days1to14 = allDays.filter((d) => d.day <= 14);
const days15to365 = allDays.filter((d) => d.day > 14);

const upsertClause = `on conflict (day) do update set
  theme = excluded.theme,
  pool = excluded.pool,
  words = excluded.words;`;

fs.writeFileSync(new URL('../supabase/puzzles_migration.sql', import.meta.url), `-- Regenerated by scripts/generate_puzzles.mjs to enforce the fixed 8-tile,
-- 3-4-letter-fragment layout rule. Safe to re-run: overwrites days 1-14.

insert into puzzles (day, theme, pool, words) values
${toValues(days1to14)}
${upsertClause}
`);

fs.writeFileSync(new URL('../supabase/puzzles_year_migration.sql', import.meta.url), `-- Regenerated by scripts/generate_puzzles.mjs to enforce the fixed 8-tile,
-- 3-4-letter-fragment layout rule. Safe to re-run: overwrites days 15-365.

insert into puzzles (day, theme, pool, words) values
${toValues(days15to365)}
${upsertClause}
`);

console.log(`Wrote scripts/generated_puzzles.json, supabase/puzzles_migration.sql (${days1to14.length} days), and supabase/puzzles_year_migration.sql (${days15to365.length} days).`);

// ---- 8. Sample output ----
console.log('\nSample days:');
for (const d of [allDays[0], allDays[Math.floor(allDays.length / 2)], allDays[allDays.length - 1]]) {
  console.log(`Day ${d.day} (${d.theme}): pool=${d.pool.join(',')}`);
  d.words.forEach((w) => console.log(`  ${w.a}+${w.b} = ${w.w}${w.key ? '  [KEYSTONE]' : ''}`));
}
