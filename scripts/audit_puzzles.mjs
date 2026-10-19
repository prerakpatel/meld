// Checks every packed puzzle against MELD's fixed-shape and fairness rules.
// Run any time puzzles change:  npm run puzzles:audit
//
// Shape (so the board looks identical every day): exactly 8 unique chunks of
// 3-4 letters, 5 words of 6-8 letters, one keystone, every word = its chunks.
// Fairness: any other real word the 8 chunks can spell must be in the day's
// `ok` list (melding it is free instead of costing a meld).

import fs from 'node:fs';
import { PUZZLES_B64 } from '../src/data/puzzles.data.js';

const puzzles = JSON.parse(Buffer.from(PUZZLES_B64, 'base64').toString('utf8'));

const wn = new Set();
const dir = new URL('../node_modules/wordnet-db/dict/', import.meta.url);
for (const f of ['index.noun', 'index.verb', 'index.adj', 'index.adv']) {
  for (const line of fs.readFileSync(new URL(f, dir), 'utf8').split('\n')) {
    if (line && !line.startsWith(' ')) wn.add(line.split(' ')[0]);
  }
}

const problems = [];
const fail = (day, msg) => problems.push(`day ${day}: ${msg}`);

puzzles.forEach((p, i) => {
  if (p.day !== i + 1) fail(p.day, `expected day ${i + 1}`);
  if (p.pool.length !== 8 || new Set(p.pool).size !== 8) fail(p.day, 'needs exactly 8 unique chunks');
  for (const c of p.pool) if (!/^[A-Z]{3,4}$/.test(c)) fail(p.day, `chunk ${c} is not 3-4 letters`);
  if (p.words.length !== 5) fail(p.day, 'needs 5 words');
  if (p.words.filter((w) => w.key).length !== 1) fail(p.day, 'needs exactly one keystone');
  for (const w of p.words) {
    if (w.a + w.b !== w.w) fail(p.day, `${w.a}+${w.b} !== ${w.w}`);
    if (w.w.length < 6 || w.w.length > 8) fail(p.day, `${w.w} is not 6-8 letters`);
    if (!p.pool.includes(w.a) || !p.pool.includes(w.b)) fail(p.day, `${w.w} not buildable from the pool`);
  }
  const answers = new Set(p.words.map((w) => w.w));
  const ok = new Set(p.ok ?? []);
  for (const a of p.pool) for (const b of p.pool) {
    const j = a + b;
    if (a !== b && !answers.has(j) && wn.has(j.toLowerCase()) && !ok.has(j)) fail(p.day, `${j} is a real word but would cost a meld`);
  }
});

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`All ${puzzles.length} puzzles pass: 8 chunks of 3-4 letters, 5 words, 1 keystone, no real-word traps.`);
