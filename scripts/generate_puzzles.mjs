// Generates puzzles for days 15..N (extending the existing 14 hand-made days
// toward a full year) from the curated word bank in word_bank.mjs.
//
// Every generated word is verified against a real English dictionary
// (word-list npm package) before it's allowed into the output — nothing here
// is trusted on the model's say-so. Run the self-test assertions at the
// bottom before trusting the output.

import fs from 'node:fs';
import wordListPath from 'word-list';
import { WORD_BANK } from './word_bank.mjs';

const TARGET_TOTAL_DAYS = 365;
const START_DAY = 15;
const MIN_FRAG = 2;
const MAX_FRAG = 5;

// ---- 1. Load the real-dictionary validity set ----
const dictionary = new Set(
  fs.readFileSync(wordListPath, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean),
);

// ---- 2. Load words already used in the existing 14 hand-made days ----
const existingSql = fs.readFileSync(new URL('../supabase/puzzles_migration.sql', import.meta.url), 'utf8');
const alreadyUsed = new Set(
  [...existingSql.matchAll(/"w":"([A-Z]+)"/g)].map((m) => m[1].toUpperCase()),
);
console.log(`Excluding ${alreadyUsed.size} words already used in days 1-14.`);

// ---- 3. Flatten the word bank, validate against the dictionary ----
const seen = new Set();
const candidates = []; // { word: 'GARDEN', theme: 'garden2' }
let rejectedInvalid = 0;
let rejectedDuplicate = 0;
let rejectedAlreadyUsed = 0;

for (const [theme, words] of Object.entries(WORD_BANK)) {
  for (const raw of words) {
    const word = raw.toUpperCase();
    if (alreadyUsed.has(word)) { rejectedAlreadyUsed++; continue; }
    if (seen.has(word)) { rejectedDuplicate++; continue; }
    if (word.length < 4 || word.length > 10) { rejectedInvalid++; continue; }
    if (!dictionary.has(word.toLowerCase())) { rejectedInvalid++; continue; }
    seen.add(word);
    candidates.push({ word, theme });
  }
}
console.log(`Candidates: ${candidates.length} valid | rejected: ${rejectedInvalid} not-real-words, ${rejectedDuplicate} dupes, ${rejectedAlreadyUsed} already-used.`);

// ---- 4. Compute all valid (a,b) splits per word ----
function splitsFor(word) {
  const out = [];
  for (let i = MIN_FRAG; i <= word.length - MIN_FRAG; i++) {
    const a = word.slice(0, i);
    const b = word.slice(i);
    if (a.length >= MIN_FRAG && a.length <= MAX_FRAG && b.length >= MIN_FRAG && b.length <= MAX_FRAG) {
      out.push([a, b]);
    }
  }
  return out;
}

const allSplitsByWord = new Map();
const prefixPotential = new Map(); // fragment -> count of words that could use it as prefix
const suffixPotential = new Map();

for (const { word } of candidates) {
  const splits = splitsFor(word);
  allSplitsByWord.set(word, splits);
  for (const [a, b] of splits) {
    prefixPotential.set(a, (prefixPotential.get(a) || 0) + 1);
    suffixPotential.set(b, (suffixPotential.get(b) || 0) + 1);
  }
}

// ---- 5. Pick the best split per word (favor fragments reused elsewhere) ----
const chosenSplit = new Map(); // word -> [a, b]
for (const { word } of candidates) {
  const splits = allSplitsByWord.get(word);
  if (!splits.length) continue;
  let best = splits[0];
  let bestScore = -1;
  for (const [a, b] of splits) {
    const score = (prefixPotential.get(a) || 0) + (suffixPotential.get(b) || 0);
    if (score > bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  chosenSplit.set(word, best);
}

// Words with no valid split (too short) are unusable
const usableCandidates = candidates.filter((c) => chosenSplit.has(c.word));

// ---- 6. Build fragment reuse index from chosen splits ----
const wordsByPrefix = new Map(); // frag -> [word,...]
const wordsBySuffix = new Map();
for (const { word } of usableCandidates) {
  const [a, b] = chosenSplit.get(word);
  if (!wordsByPrefix.has(a)) wordsByPrefix.set(a, []);
  wordsByPrefix.get(a).push(word);
  if (!wordsBySuffix.has(b)) wordsBySuffix.set(b, []);
  wordsBySuffix.get(b).push(word);
}

function connectionsOf(word, excludeSet) {
  const [a, b] = chosenSplit.get(word);
  const partners = new Set();
  for (const w of wordsByPrefix.get(a) || []) if (w !== word && !excludeSet.has(w)) partners.add(w);
  for (const w of wordsBySuffix.get(b) || []) if (w !== word && !excludeSet.has(w)) partners.add(w);
  return partners;
}

// ---- 7. Cluster into groups of 5 to form each day ----
const wordToTheme = new Map(usableCandidates.map((c) => [c.word, c.theme]));
const used = new Set(); // words already placed into a day
const remaining = [...usableCandidates.map((c) => c.word)];

// Sort seeds by connectivity descending so well-connected words get used first
remaining.sort((w1, w2) => connectionsOf(w2, used).size - connectionsOf(w1, used).size);

const days = [];
let dayNum = START_DAY;

function pickDayWords(seed) {
  const group = [seed];
  const groupSet = new Set(group);
  const excludeSet = new Set(used);

  // Prefer partners connected to the seed (or to each other), same theme when possible
  let guardIterations = 0;
  while (group.length < 5 && guardIterations < 2000) {
    guardIterations++;
    let candidate = null;

    // 1) a word connected to something already in the group
    for (const w of group) {
      const partners = [...connectionsOf(w, new Set([...excludeSet, ...groupSet]))];
      if (partners.length) {
        // Prefer same theme among partners
        candidate = partners.find((p) => wordToTheme.get(p) === wordToTheme.get(seed)) || partners[0];
        break;
      }
    }

    // 2) fall back: another unused word from the same theme
    if (!candidate) {
      candidate = remaining.find((w) => !excludeSet.has(w) && !groupSet.has(w) && wordToTheme.get(w) === wordToTheme.get(seed));
    }

    // 3) fall back further: any unused word at all
    if (!candidate) {
      candidate = remaining.find((w) => !excludeSet.has(w) && !groupSet.has(w));
    }

    if (!candidate) break;
    group.push(candidate);
    groupSet.add(candidate);
  }

  return group.length === 5 ? group : null;
}

for (const seed of remaining) {
  if (used.has(seed)) continue;
  if (days.length >= TARGET_TOTAL_DAYS - (START_DAY - 1)) break;

  const group = pickDayWords(seed);
  if (!group) continue;

  group.forEach((w) => used.add(w));

  // Theme = majority vote among the group
  const themeCounts = new Map();
  for (const w of group) themeCounts.set(wordToTheme.get(w), (themeCounts.get(wordToTheme.get(w)) || 0) + 1);
  const theme = [...themeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // Keystone = word with the most in-group connections
  let keystone = group[0];
  let keystoneScore = -1;
  for (const w of group) {
    const [a, b] = chosenSplit.get(w);
    let score = 0;
    for (const other of group) {
      if (other === w) continue;
      const [oa, ob] = chosenSplit.get(other);
      if (oa === a || oa === b || ob === a || ob === b) score++;
    }
    if (score > keystoneScore) {
      keystoneScore = score;
      keystone = w;
    }
  }

  const words = group.map((w) => {
    const [a, b] = chosenSplit.get(w);
    return { a, b, w, key: w === keystone };
  });

  const pool = [...new Set(words.flatMap((o) => [o.a, o.b]))].sort();

  days.push({ day: dayNum++, theme, pool, words });
}

console.log(`Generated ${days.length} new days (target was ${TARGET_TOTAL_DAYS - (START_DAY - 1)}).`);

// ---- 8. Self-test assertions ----
function assert(cond, msg) {
  if (!cond) throw new Error('SELF-TEST FAILED: ' + msg);
}

const allWordsEver = new Set(alreadyUsed);
for (const d of days) {
  assert(d.words.length === 5, `day ${d.day} does not have 5 words`);
  assert(d.words.filter((w) => w.key).length === 1, `day ${d.day} does not have exactly one keystone`);
  for (const w of d.words) {
    assert(w.a + w.b === w.w, `day ${d.day}: ${w.a}+${w.b} !== ${w.w}`);
    assert(dictionary.has(w.w.toLowerCase()), `day ${d.day}: "${w.w}" is not a real dictionary word`);
    assert(!allWordsEver.has(w.w), `day ${d.day}: "${w.w}" is a duplicate across the whole dataset`);
    allWordsEver.add(w.w);
  }
  const expectedPool = [...new Set(d.words.flatMap((o) => [o.a, o.b]))].sort();
  assert(JSON.stringify(expectedPool) === JSON.stringify(d.pool), `day ${d.day}: pool does not match unique fragments`);
}
const dayNumbers = days.map((d) => d.day);
assert(new Set(dayNumbers).size === dayNumbers.length, 'duplicate day numbers');
console.log('All self-test assertions passed.');

// ---- 9. Write outputs ----
fs.writeFileSync(new URL('./generated_puzzles.json', import.meta.url), JSON.stringify(days, null, 2));

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

const values = days.map((d) => {
  const poolJson = sqlEscape(JSON.stringify(d.pool));
  const wordsJson = sqlEscape(JSON.stringify(d.words));
  return `(${d.day}, '${sqlEscape(d.theme)}', '${poolJson}'::jsonb, '${wordsJson}'::jsonb)`;
}).join(',\n');

const sql = `-- Auto-generated by scripts/generate_puzzles.mjs — extends the puzzle rotation
-- from 14 days to ${days.length + 14} days (days ${START_DAY}-${days[days.length - 1].day}).
-- Run this once in the Supabase SQL Editor after puzzles_migration.sql.

insert into puzzles (day, theme, pool, words) values
${values}
on conflict (day) do nothing;
`;

fs.writeFileSync(new URL('../supabase/puzzles_year_migration.sql', import.meta.url), sql);
console.log(`Wrote scripts/generated_puzzles.json and supabase/puzzles_year_migration.sql (${days.length} days).`);

// ---- 10. Sample output for a quick sanity read ----
console.log('\nSample days:');
for (const d of [days[0], days[Math.floor(days.length / 2)], days[days.length - 1]]) {
  console.log(`Day ${d.day} (${d.theme}): pool=${d.pool.join(',')}`);
  d.words.forEach((w) => console.log(`  ${w.a}+${w.b} = ${w.w}${w.key ? '  [KEYSTONE]' : ''}`));
}
