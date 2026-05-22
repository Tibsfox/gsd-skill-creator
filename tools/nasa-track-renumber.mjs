#!/usr/bin/env node
// Mechanically renumber substrate-era track-cards from "Track 1-8" to
// canonical "Track 1a, 1b, 2-7" labeling. Uses placeholder tokens to avoid
// cascade-rewrite collisions.

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const target = process.argv[2];
if (!target) { console.error('usage: track-renumber.mjs <index.html>'); process.exit(2); }

const orig = readFileSync(target, 'utf8');
let html = orig;

// Step 1: replace "Track N" -> placeholder "TRACKTOK_N"
// Match "Track <digit>" followed by a non-word char so we don't catch "Track 12".
for (const n of [8,7,6,5,4,3,2,1]) {
  const re = new RegExp(`Track ${n}(?=\\D)`, 'g');
  html = html.replace(re, `__TRACKTOK_${n}__`);
}

// Step 2: rewrite each placeholder to its v1.0 label
const mapping = {
  1: 'Track 1a',
  2: 'Track 1b',
  3: 'Track 2',
  4: 'Track 3',
  5: 'Track 4',
  6: 'Track 5',
  7: 'Track 6',
  8: 'Track 7',
};
for (const [k, v] of Object.entries(mapping)) {
  html = html.replace(new RegExp(`__TRACKTOK_${k}__`, 'g'), v);
}

if (html === orig) {
  console.log(`${target}: no changes`);
  process.exit(0);
}

copyFileSync(target, target + '.bak2');
writeFileSync(target, html);

const counts = {};
for (const lbl of ['Track 1a', 'Track 1b', 'Track 2', 'Track 3', 'Track 4', 'Track 5', 'Track 6', 'Track 7', 'Track 8']) {
  const re = new RegExp(`${lbl}\\b`, 'g');
  const m = html.match(re);
  counts[lbl] = m ? m.length : 0;
}
console.log(`${target}: renamed.`, JSON.stringify(counts));
