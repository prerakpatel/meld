// MELD puzzle generator — builds the full daily rotation from scratch.
//
// Every generated day satisfies, by construction:
//   STRUCTURE   exactly 5 words, each = two chunks; pool of exactly 8 unique
//               chunks, each 3-4 letters (fixed 4x2 board, like Wordle's grid)
//   FAIRNESS    no two chunks in the pool can form a *common* English word
//               that isn't one of the day's answers; at most 2 obscure
//               dictionary words are formable (the app accepts those without
//               penalty via the packed "ok" list)
//   WORDS       common vocabulary only (frequency list + curated cozy bank),
//               6-8 letters, dictionary-verified, WordNet-definable (hints),
//               no grim words, no word repeated across the whole rotation
//   SPLITS      natural seams only: never inside a digraph, never leaving a
//               chunk that starts with a doubled letter; compound-word splits
//               (MILK+MAID) preferred
//   THEME       a day gets a theme label only when all five words genuinely
//               share it (tagged via WordNet's semantic categories);
//               otherwise the label is null and the app shows the date
//   CHALLENGE   at least 2 "trap" pairs per day — chunk pairs that look
//               pronounceable but are not words
//
// Usage:  node scripts/generate_puzzles.mjs
// Then:   node scripts/build_definitions.mjs && npm run puzzles:pack

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { WORD_BANK } from './word_bank.mjs';

const require = createRequire(import.meta.url);
const wordnetPath = require('wordnet-db').path;

const MIN_FRAG = 3;
const MAX_FRAG = 4;
const POOL_SIZE = 8;
const WORDS_PER_DAY = 5;
const MIN_WORD_LEN = 6;
const MAX_WORD_LEN = 8;
const MAX_OBSCURE_DECOYS = 2;
const MIN_TRAPS = 2;

// Deterministic PRNG so reruns are reproducible.
let seed = 20260705;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- sources
const common10k = fs.readFileSync(new URL('./common_words_10k.txt', import.meta.url), 'utf8')
  .split('\n').map(w => w.trim()).filter(Boolean);
const COMMON_SET = new Set(common10k);

const usrDict = new Set(
  fs.existsSync('/usr/share/dict/words')
    ? fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n')
        .map(w => w.trim()).filter(w => /^[a-z]+$/.test(w))
    : [],
);

// WordNet: lemma sets per part of speech and gloss availability. Lemmas that
// WordNet itself capitalizes (Korean, Warner, Turner) are proper nouns and
// are skipped entirely — a daily answer must be an ordinary word.
const wnLemmas = { noun: new Set(), verb: new Set(), adj: new Set(), adv: new Set() };
const glossable = new Set();
for (const pos of ['noun', 'verb', 'adj', 'adv']) {
  for (const line of fs.readFileSync(`${wordnetPath}/data.${pos}`, 'utf8').split('\n')) {
    if (!line || line.startsWith('  ')) continue;
    const bar = line.indexOf(' | ');
    if (bar < 0) continue;
    const fields = line.slice(0, bar).split(' ');
    const wordCount = parseInt(fields[3], 16);
    for (let i = 0; i < wordCount; i++) {
      const lemma = fields[4 + i * 2];
      if (/^[a-z]+$/.test(lemma)) {
        wnLemmas[pos].add(lemma);
        glossable.add(lemma);
      }
    }
  }
}

// Themes come only from the hand-curated bank — a day is labeled only when
// all five words were curated under the same broad theme. (WordNet's sense
// categories proved unreliable: it files "upgrade" under hillsides.)
const BANK_THEME_MAP = {
  'CREATURES': ['woodland', 'birds', 'savanna', 'smallmammals', 'babyanimals', 'insects', 'moreinsects', 'amphibians', 'reptiles', 'seacreatures2', 'morebirds', 'moremammals', 'farmanimals2', 'bugsgarden', 'finalcreatures'],
  'FOOD & DRINK': ['bakery', 'savorykitchen', 'breakfast', 'dairy', 'desserts2', 'desserts3', 'condiments', 'breadtypes', 'beverages', 'campfirefood', 'cookingverbs', 'cookingtools', 'cookingmethods', 'morecooking', 'morefood', 'spicerack', 'herbs', 'teahouse', 'fruits', 'vegetables', 'moreveg', 'moreveg2', 'morefruit', 'farmproduce', 'farmmarket', 'finalfood'],
  'GREEN & GROWING': ['trees', 'flowers', 'garden', 'moregarden', 'moreflowers', 'moreflowers2', 'moretrees', 'gardening2', 'cottagecore'],
  'HOUSE & HOME': ['home', 'attic', 'bathhome', 'bedroom', 'laundry', 'candles', 'keepsakes', 'morehousehold', 'fireside', 'containers', 'finalhome'],
  'WEATHER & SKY': ['weather', 'weatherphenomena', 'weatherinstruments', 'weathercozy', 'weatherwords2', 'moreweather', 'skywords', 'celestial', 'astronomy2', 'morecelestial', 'nightwords', 'naturephenomena'],
  'SEASONS & HOLIDAYS': ['time', 'seasonsfeel', 'seasonsmore', 'moreseasons', 'timepieces', 'autumnholiday', 'springholiday', 'summerholiday', 'winterholiday', 'celebration', 'celebrations2', 'wintercozy'],
  'SEA & SHORE': ['ocean', 'pond', 'riverlife', 'waterways', 'islandlife', 'fishinglife', 'boatinglife', 'moresea', 'vessels'],
  'THE OUTDOORS': ['mountains', 'desert', 'jungle', 'countryside', 'volcano', 'cavelife', 'geography', 'moregeography', 'arctic', 'pathways', 'campgear', 'directions', 'farm', 'finalnature'],
  'CRAFT & MAKING': ['crafts', 'workshop', 'invention', 'laboratory', 'tools', 'farmtools', 'sewingcraft', 'papercraft', 'woodcraft', 'toolshed', 'morecraft', 'textiles', 'morefabric', 'hardware', 'papergoods'],
  'THE WARDROBE': ['wardrobe', 'clothing2', 'footwear', 'headwear', 'moreclothing'],
  'MUSIC & STAGE': ['music', 'theater', 'dance', 'circus', 'moremusic', 'musicalgear', 'moreinstruments'],
  'WORDS & BOOKS': ['library', 'reading', 'bookish', 'school', 'academics', 'moreacademic', 'storytelling'],
  'FUN & GAMES': ['toys', 'playground2', 'outdoorplay', 'gameroom', 'moregames', 'hobbies2', 'moretoys', 'sports', 'wintersports'],
  'ONCE UPON A TIME': ['fantasy', 'pirate', 'magicwords', 'fantasycreatures', 'moremythical', 'morefantasy', 'adventure', 'moreadventure', 'finalwhimsy'],
  'EARTH & TREASURE': ['gems', 'gemsmore', 'moregems', 'rocksminerals', 'metals'],
  'GOING PLACES': ['vehicles', 'aviation', 'trainlife', 'spacecraft', 'travelwords'],
  'PLACES': ['buildings', 'morebuildings', 'morearchitecture', 'market'],
  'PEOPLE': ['professions', 'moreprofessions'],
  'COLOR & SHAPE': ['colors', 'morecolors', 'shapes'],
};
const themeByWord = new Map();
for (const [display, keys] of Object.entries(BANK_THEME_MAP)) {
  for (const key of keys) {
    for (const raw of WORD_BANK[key] ?? []) {
      const w = raw.toLowerCase();
      if (!themeByWord.has(w)) themeByWord.set(w, display);
    }
  }
}
function themeOf(word) {
  return themeByWord.get(word) ?? null;
}

// ------------------------------------------------------- candidate words
const GRIM = new Set(['cancer', 'cancers', 'murder', 'murders', 'killer', 'killers', 'coffin', 'coffins', 'corpse', 'corpses', 'sewage', 'racism', 'racist', 'nazism', 'suicide', 'slavery', 'torture', 'warfare', 'tumors', 'crisis', 'victim', 'victims', 'prison', 'hostage', 'disease', 'divorce', 'funeral', 'poverty', 'assault', 'weapons', 'bombing', 'threats', 'illness',
  // not grim, just dreary or charged — poor daily answers
  'democrat', 'behalf', 'situated', 'tested', 'whereas', 'thereby', 'herein', 'hereby']);

// -ing answers only from this lexicalized set — WordNet nominalizes every
// gerund ("sucking: the act of sucking"), which lets dull ones through.
const ING_ALLOW = new Set(['morning', 'evening', 'ceiling', 'pudding', 'dumpling', 'duckling', 'gosling', 'sapling', 'sibling', 'darling', 'herring', 'kindling', 'stocking', 'sterling', 'wedding', 'building', 'painting', 'lightning', 'clothing', 'awning', 'frosting', 'seasoning', 'dressing', 'stuffing', 'lodging', 'landing']);

// A word only counts as real if a real dictionary lists it lowercase — the
// frequency list alone is web-scraped and full of names and brands.
function isRealWord(w) {
  return usrDict.has(w) || glossable.has(w);
}

function looksLikeAnswer(w) {
  if (!/^[a-z]+$/.test(w)) return false;
  if (w.length < MIN_WORD_LEN || w.length > MAX_WORD_LEN) return false;
  if (GRIM.has(w)) return false;
  // past-tense forms make dreary answers unless they're really their own word
  if (w.endsWith('ed') && !wnLemmas.noun.has(w) && !wnLemmas.adj.has(w)) return false;
  // -ing forms only from the curated lexicalized list
  if (w.endsWith('ing') && !ING_ALLOW.has(w)) return false;
  // comparatives/superlatives (YOUNGER, LOWEST) make dreary answers
  if (w.endsWith('est') && wnLemmas.adj.has(w.slice(0, -3))) return false;
  if (w.endsWith('er') && wnLemmas.adj.has(w.slice(0, -2)) && !wnLemmas.noun.has(w)) return false;
  // adjective-derived -ly adverbs (ACTIVELY, TRULY, GENTLY); BUTTERFLY survives
  if (w.endsWith('ly')) {
    const base = w.slice(0, -2);
    if (wnLemmas.adj.has(base) || wnLemmas.adj.has(base + 'e') || wnLemmas.adj.has(base + 'le') || wnLemmas.noun.has(base)) return false;
  }
  // plurals of short words (LOSSES, MASSES) make dreary answers
  if (w.endsWith('s') && !w.endsWith('ss')) {
    const base = w.endsWith('es') && isRealWord(w.slice(0, -2)) ? w.slice(0, -2)
      : isRealWord(w.slice(0, -1)) ? w.slice(0, -1) : null;
    if (base && base.length < 5) return false;
  }
  return isRealWord(w);
}

// ----------------------------------------------------------- split rules
const VOWELS = new Set('aeiou');
const DIGRAPHS = new Set(['th', 'ch', 'sh', 'ph', 'wh', 'ck', 'qu', 'gh']);
const isV = (c) => VOWELS.has(c);

// Common-word parts (3+ letters) for compound detection: AIR|PLANE, MILK|MAID.
const partWords = new Set([...COMMON_SET, ...glossable].filter(w => w.length >= 3));

// Consonant clusters that read naturally at a chunk edge. A chunk may end in
// a legal onset (STR-) or coda (-AIRP's "rp" is a coda, but see the compound
// rule); a chunk may start with a legal onset or a common mid-word cluster.
const ONSETS = new Set(['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'str', 'scr', 'spr', 'spl', 'thr', 'sh', 'ch', 'th', 'wh', 'ph', 'qu']);
const CODAS = new Set(['st', 'nd', 'nt', 'mp', 'rt', 'rd', 'rn', 'rm', 'rk', 'rl', 'rp', 'rb', 'ng', 'nk', 'sk', 'sp', 'ct', 'pt', 'lt', 'ld', 'lf', 'lk', 'lm', 'lp', 'ck', 'nch', 'rch']);
const isC = (c) => !VOWELS.has(c) && c !== 'y';
function trailingCluster(s) {
  let i = s.length;
  while (i > 0 && isC(s[i - 1])) i--;
  return s.slice(i);
}
function leadingCluster(s) {
  let i = 0;
  while (i < s.length && isC(s[i])) i++;
  return s.slice(0, i);
}

function naturalSplits(word) {
  // If the word is a compound of two real words (AIR+PLANE, MILK+MAID), only
  // a split on that boundary reads naturally — never across it.
  const compoundBoundaries = [];
  for (let j = 3; j <= word.length - 3; j++) {
    if (partWords.has(word.slice(0, j)) && partWords.has(word.slice(j))) compoundBoundaries.push(j);
  }

  const out = [];
  for (let i = MIN_FRAG; i <= word.length - MIN_FRAG; i++) {
    const a = word.slice(0, i);
    const b = word.slice(i);
    if (a.length > MAX_FRAG || b.length > MAX_FRAG) continue;
    if (a === b) continue; // one tile can't be tapped twice (COUS+COUS)
    if (compoundBoundaries.length && !compoundBoundaries.includes(i)) continue;
    if (DIGRAPHS.has(word[i - 1] + word[i])) continue; // never cut a digraph
    if (b[0] === b[1]) continue; // no chunk starting "TTER"/"LLET"
    const aTail = trailingCluster(a);
    if (aTail.length >= 2 && !ONSETS.has(aTail) && !CODAS.has(aTail)) continue; // no "UPG"
    const bHead = leadingCluster(b);
    if (bHead.length >= 2 && !ONSETS.has(bHead) && !CODAS.has(bHead)) continue;
    let score = 0;
    if (compoundBoundaries.includes(i)) score += 3; // MILK+MAID
    if (isV(word[i - 1]) && !isV(word[i])) score += 2; // vowel|consonant seam
    else if (!isV(word[i - 1]) && !isV(word[i])) score += 1; // consonant cluster seam
    else if (!isV(word[i - 1]) && isV(word[i])) score += 0.5;
    else score -= 1; // vowel|vowel reads worst
    out.push({ a: a.toUpperCase(), b: b.toUpperCase(), score });
  }
  return out.sort((x, y) => y.score - x.score);
}

const candidates = [];
const seen = new Set();
for (const raw of [...common10k, ...Object.values(WORD_BANK).flat()]) {
  const w = raw.toLowerCase();
  if (seen.has(w)) continue;
  seen.add(w);
  if (!looksLikeAnswer(w)) continue;
  if (!glossable.has(w) && !(w.endsWith('s') && glossable.has(w.slice(0, -1)))) continue; // hintable
  const splits = naturalSplits(w);
  if (!splits.length) continue;
  candidates.push({ word: w.toUpperCase(), splits, theme: themeOf(w) });
}
console.log(`Candidates: ${candidates.length} common, natural-splitting, hintable words.`);

// ------------------------------------------------- decoys, traps, checks
// Anything a player might reasonably believe is a word: big dictionary,
// WordNet, the common list, and naive plurals of all of the above.
const DECOY_REAL = new Set();
for (const w of [...usrDict, ...glossable, ...COMMON_SET]) {
  if (w.length >= MIN_WORD_LEN && w.length <= MAX_WORD_LEN) DECOY_REAL.add(w);
  const s = w + 's';
  if (s.length >= MIN_WORD_LEN && s.length <= MAX_WORD_LEN) DECOY_REAL.add(s);
}

// Seam-bigram plausibility (from the common list) for counting trap pairs.
const bigramCount = new Map();
for (const w of common10k) {
  for (let i = 0; i < w.length - 1; i++) {
    const bg = w.slice(i, i + 2);
    bigramCount.set(bg, (bigramCount.get(bg) ?? 0) + 1);
  }
}
const PLAUSIBLE_BIGRAM = 40;

// Verdict on a finished day: common-word decoys are fatal, obscure ones are
// capped, pronounceable-but-fake pairs are the challenge we want.
function auditPool(pool, intendedPairs, intendedWords) {
  let obscure = 0;
  let traps = 0;
  for (const a of pool) {
    for (const b of pool) {
      if (a === b) continue;
      if (intendedPairs.has(a + '+' + b)) continue;
      const joined = (a + b).toLowerCase();
      if (intendedWords.has(joined)) continue; // alt-split of an answer: app accepts it
      if (COMMON_SET.has(joined)) return null; // a common word would be "rejected" — unfair
      if (DECOY_REAL.has(joined)) {
        if (++obscure > MAX_OBSCURE_DECOYS) return null;
      } else if ((bigramCount.get(joined[a.length - 1] + joined[a.length]) ?? 0) >= PLAUSIBLE_BIGRAM) {
        traps++;
      }
    }
  }
  return { obscure, traps };
}

// ------------------------------------------------------------ day search
const used = new Set();

function bestSplitFor(cand, fragSet) {
  let best = null;
  let bestKey = -Infinity;
  for (const s of cand.splits) {
    const newFrags = (fragSet.has(s.a) ? 0 : 1) + (fragSet.has(s.b) ? 0 : 1);
    const key = -newFrags * 10 + s.score; // reuse first, then naturalness
    if (key > bestKey) { bestKey = key; best = s; }
  }
  return best;
}

// Randomized greedy: assemble a day in 5 picks, retry on failure. Far faster
// than exhaustive backtracking, which thrashes when the decoy/trap audit
// rejects most complete pools.
function buildDay(searchPool, maxAttempts = 4000) {
  if (searchPool.length < WORDS_PER_DAY) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pool = new Set();
    const group = [];
    const groupSplits = new Map();

    const place = (cand) => {
      const split = bestSplitFor(cand, pool);
      pool.add(split.a);
      pool.add(split.b);
      group.push(cand);
      groupSplits.set(cand.word, split);
    };

    place(searchPool[Math.floor(rand() * searchPool.length)]);

    let dead = false;
    while (group.length < WORDS_PER_DAY) {
      const wordsLeftAfter = WORDS_PER_DAY - group.length - 1;
      const fragsNeeded = POOL_SIZE - pool.size;

      // Scan from a random offset; collect a handful of feasible picks and
      // choose one, preferring picks that reuse existing chunks.
      const options = [];
      const start = Math.floor(rand() * searchPool.length);
      for (let s = 0; s < searchPool.length && options.length < 24; s++) {
        const cand = searchPool[(start + s) % searchPool.length];
        if (group.some(g => g.word === cand.word)) continue;
        const split = bestSplitFor(cand, pool);
        const nf = (pool.has(split.a) ? 0 : 1) + (pool.has(split.b) || split.a === split.b ? 0 : 1);
        const remaining = fragsNeeded - nf;
        if (remaining < 0 || remaining > 2 * wordsLeftAfter) continue;
        options.push({ cand, nf });
      }
      if (!options.length) { dead = true; break; }

      // Reuse keeps the pool interlocked — weight toward it when available.
      const reusers = options.filter(o => o.nf < 2);
      const pickFrom = reusers.length && rand() < 0.7 ? reusers : options;
      place(pickFrom[Math.floor(rand() * pickFrom.length)].cand);
    }
    if (dead || pool.size !== POOL_SIZE) continue;

    const intendedPairs = new Set(group.map(c => {
      const s = groupSplits.get(c.word);
      return s.a + '+' + s.b;
    }));
    const intendedWords = new Set(group.map(c => c.word.toLowerCase()));
    const verdict = auditPool([...pool], intendedPairs, intendedWords);
    if (!verdict || verdict.traps < MIN_TRAPS) continue;
    return { group, groupSplits, verdict };
  }
  return null;
}

function finishDay(result, theme) {
  const { group, groupSplits, verdict } = result;
  group.forEach(c => used.add(c.word));

  // keystone: the word whose chunks are most shared with the others
  let keystone = group[0].word;
  let bestShared = -1;
  for (const c of group) {
    const s = groupSplits.get(c.word);
    let shared = 0;
    for (const o of group) {
      if (o === c) continue;
      const os = groupSplits.get(o.word);
      if ([os.a, os.b].includes(s.a) || [os.a, os.b].includes(s.b)) shared++;
    }
    if (shared > bestShared) { bestShared = shared; keystone = c.word; }
  }

  const words = shuffle(group).map(c => {
    const s = groupSplits.get(c.word);
    return { a: s.a, b: s.b, w: c.word, key: c.word === keystone };
  });
  const pool = [...new Set(words.flatMap(o => [o.a, o.b]))].sort();
  return { theme, pool, words, traps: verdict.traps, obscure: verdict.obscure };
}

// Themed days first: every word in the day shares the label, honestly.
const days = [];
const byTheme = new Map();
for (const c of candidates) {
  if (!c.theme) continue;
  if (!byTheme.has(c.theme)) byTheme.set(c.theme, []);
  byTheme.get(c.theme).push(c);
}

for (const [theme, list] of [...byTheme.entries()].sort((a, b) => b[1].length - a[1].length)) {
  let searchPool = shuffle(list);
  let failures = 0;
  while (failures < 3) {
    searchPool = searchPool.filter(c => !used.has(c.word));
    if (searchPool.length < WORDS_PER_DAY) break;
    const result = buildDay(searchPool, 8000);
    if (!result) { failures++; continue; }
    failures = 0;
    days.push(finishDay(result, theme));
  }
}
const themedCount = days.length;
console.log(`Built ${themedCount} genuinely themed days.`);

// Then neutral days from everything left (mixed vocabulary, no label).
let neutralPool = shuffle(candidates);
for (;;) {
  neutralPool = neutralPool.filter(c => !used.has(c.word));
  if (neutralPool.length < WORDS_PER_DAY) break;
  const result = buildDay(neutralPool);
  if (!result) break;
  days.push(finishDay(result, null));
}
console.log(`Built ${days.length - themedCount} neutral days (${days.length} total).`);

// Interleave so themed days sprinkle through the year rather than clumping.
const finalDays = shuffle(days).map((d, i) => ({
  day: i + 1,
  theme: d.theme,
  pool: d.pool,
  words: d.words,
}));

// ------------------------------------------------------------ self-tests
function assert(cond, msg) {
  if (!cond) throw new Error('SELF-TEST FAILED: ' + msg);
}
const allWordsEver = new Set();
for (const d of finalDays) {
  assert(d.words.length === WORDS_PER_DAY, `day ${d.day}: needs 5 words`);
  assert(d.pool.length === POOL_SIZE, `day ${d.day}: needs exactly 8 chunks`);
  assert(d.pool.every(f => f.length >= MIN_FRAG && f.length <= MAX_FRAG), `day ${d.day}: chunk outside 3-4 letters`);
  assert(d.words.filter(w => w.key).length === 1, `day ${d.day}: needs exactly one keystone`);
  for (const w of d.words) {
    assert(w.a + w.b === w.w, `day ${d.day}: ${w.a}+${w.b} !== ${w.w}`);
    assert(isRealWord(w.w.toLowerCase()), `day ${d.day}: ${w.w} not a real word`);
    assert(!allWordsEver.has(w.w), `day ${d.day}: ${w.w} repeated across the set`);
    allWordsEver.add(w.w);
  }
  const expectedPool = [...new Set(d.words.flatMap(o => [o.a, o.b]))].sort();
  assert(JSON.stringify(expectedPool) === JSON.stringify(d.pool), `day ${d.day}: pool mismatch`);
  const intendedPairs = new Set(d.words.map(w => w.a + '+' + w.b));
  const intendedWords = new Set(d.words.map(w => w.w.toLowerCase()));
  assert(auditPool(d.pool, intendedPairs, intendedWords), `day ${d.day}: decoy audit failed`);
}
console.log('All self-tests passed.');

fs.writeFileSync(new URL('./generated_puzzles.json', import.meta.url), JSON.stringify(finalDays, null, 2));

const themeTally = {};
for (const d of finalDays) themeTally[d.theme ?? '(neutral)'] = (themeTally[d.theme ?? '(neutral)'] ?? 0) + 1;
console.log(`\nWrote ${finalDays.length} days to generated_puzzles.json`);
console.log('Theme mix:', JSON.stringify(themeTally, null, 1));
console.log('\nSample days:');
for (const d of [finalDays[0], finalDays[Math.floor(finalDays.length / 2)], finalDays[finalDays.length - 1]]) {
  console.log(`Day ${d.day} [${d.theme ?? 'neutral'}]: ${d.pool.join(',')}`);
  d.words.forEach(w => console.log(`  ${w.a}+${w.b} = ${w.w}${w.key ? '  [KEYSTONE]' : ''}`));
}
