// Builds scripts/definitions.json: a short, clue-style definition for every
// word in the puzzle set, extracted offline from WordNet (Princeton's open
// dictionary, via the wordnet-db package — a dev dependency, never shipped).
// The definitions become the in-game hint clues, so they must never contain
// the answer word itself.
//
// Run after regenerating puzzles:  node scripts/build_definitions.mjs

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dictPath = require('wordnet-db').path;

const MAX_LEN = 72; // fits the two-line clue slot on a phone

// ---- 1. Parse WordNet data files into lemma -> [glosses] (noun-first) ----
const glossesByLemma = new Map();
for (const pos of ['noun', 'verb', 'adj', 'adv']) {
  const lines = fs.readFileSync(`${dictPath}/data.${pos}`, 'utf8').split('\n');
  for (const line of lines) {
    if (!line || line.startsWith('  ')) continue; // license header
    const bar = line.indexOf(' | ');
    if (bar < 0) continue;
    const gloss = line.slice(bar + 3).trim();
    const fields = line.slice(0, bar).split(' ');
    const wordCount = parseInt(fields[3], 16);
    for (let i = 0; i < wordCount; i++) {
      const lemma = fields[4 + i * 2].toLowerCase();
      if (lemma.includes('_') || lemma.includes('(')) continue; // multiword/annotated
      if (!glossesByLemma.has(lemma)) glossesByLemma.set(lemma, []);
      glossesByLemma.get(lemma).push(gloss);
    }
  }
}
console.log(`WordNet parsed: ${glossesByLemma.size} single-word lemmas.`);

// ---- 2. Clean a raw gloss into a one-line clue ----
function cleanGloss(gloss) {
  let def = gloss.split(';')[0]; // drop usage examples
  def = def.replace(/^\([^)]*\)\s*/, ''); // drop leading domain tags like "(music)"
  // The puzzle bundle is decoded with atob(), which only handles ASCII —
  // transliterate accents and drop anything else non-ASCII.
  def = def.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '');
  def = def.trim();
  if (!def) return null;
  if (def.length > MAX_LEN) {
    const cut = def.lastIndexOf(' ', MAX_LEN - 1);
    if (cut < 20) return null; // would truncate too aggressively to read well
    def = def.slice(0, cut) + '...';
  }
  return def;
}

// A clue must not reveal the answer: reject glosses containing the word
// itself or its base form.
function leaksAnswer(def, forms) {
  const low = def.toLowerCase();
  return forms.some((f) => low.includes(f));
}

function defineWord(word) {
  const w = word.toLowerCase();
  const candidates = [w];
  if (w.endsWith('es') && w.length > 4) candidates.push(w.slice(0, -2));
  if (w.endsWith('s') && w.length > 3) candidates.push(w.slice(0, -1));

  for (const cand of candidates) {
    for (const gloss of glossesByLemma.get(cand) ?? []) {
      const def = cleanGloss(gloss);
      if (def && !leaksAnswer(def, candidates)) return def;
    }
  }
  return null;
}

// ---- 3. Define every word in the current puzzle set ----
const puzzles = JSON.parse(fs.readFileSync(new URL('./generated_puzzles.json', import.meta.url), 'utf8'));
const definitions = {};
const missing = [];
for (const d of puzzles) {
  for (const { w } of d.words) {
    if (definitions[w]) continue;
    const def = defineWord(w);
    if (def) definitions[w] = def;
    else missing.push(w);
  }
}

fs.writeFileSync(
  new URL('./definitions.json', import.meta.url),
  JSON.stringify(definitions, null, 1),
);

const total = Object.keys(definitions).length + missing.length;
console.log(`Defined ${Object.keys(definitions).length}/${total} words (${missing.length} missing — the game falls back to a starts-with clue for those).`);
if (missing.length) console.log('Missing:', missing.slice(0, 30).join(', '), missing.length > 30 ? '…' : '');
