#!/usr/bin/env node
// Shorten verbose Degree H1 titles in docs/release-notes/*/README.md.
//
// Rewrites only the first line (# v1.X.Y — Degree N: <Band> + <Species> ...) to a
// short form: strips long parentheticals and em-dash taglines with commas/ALL-CAPS.
//
// Usage:
//   node tools/release-history/shorten-degree-h1.mjs --dry-run
//   node tools/release-history/shorten-degree-h1.mjs --execute
//   node tools/release-history/shorten-degree-h1.mjs --execute --from v1.49.229 --to v1.49.500

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
const fromV = args.includes('--from') ? args[args.indexOf('--from') + 1] : 'v1.49.229';
const toV = args.includes('--to') ? args[args.indexOf('--to') + 1] : 'v1.49.500';

// Project root is derived from this script's location so the file carries no
// machine-specific path. This script lives at tools/release-history/*.mjs, so
// the repo root is two directories up.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..', '..');
const DIR = join(ROOT, 'docs/release-notes');

function semverKey(v) {
  const m = /^v(\d+)\.(\d+)(?:\.(\d+))?/.exec(v);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3] || 0)];
}
function inRange(v) {
  const [a, b, c] = semverKey(v);
  const [fa, fb, fc] = semverKey(fromV);
  const [ta, tb, tc] = semverKey(toV);
  const cmp = (x, y, z, xx, yy, zz) => x !== xx ? x - xx : y !== yy ? y - yy : z - zz;
  return cmp(a, b, c, fa, fb, fc) >= 0 && cmp(a, b, c, ta, tb, tc) <= 0;
}

// Strip parentheticals that contain commas OR are over 20 chars (after flattening inner parens).
// Keep short parentheticals like "(Annual)" or "(Indie)".
function stripLongParens(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === '(') {
      // Find matching close, respecting nesting
      let depth = 1;
      let j = i + 1;
      while (j < s.length && depth > 0) {
        if (s[j] === '(') depth++;
        else if (s[j] === ')') depth--;
        if (depth > 0) j++;
      }
      const inner = s.slice(i + 1, j);
      // Flatten nested parens from inner for the length/comma check
      const flat = inner.replace(/[()]/g, '');
      const isShort = flat.length <= 20 && !flat.includes(',');
      if (isShort) {
        out.push(`(${inner})`);
      } else {
        // Drop — also trim preceding space
        while (out.length && /\s$/.test(out[out.length - 1])) out[out.length - 1] = out[out.length - 1].replace(/\s+$/, '');
      }
      i = j + 1;
    } else {
      out.push(s[i]);
      i++;
    }
  }
  return out.join('').replace(/\s+/g, ' ').trim();
}

// Em-dash tagline rules:
//   - Keep the FIRST tagline segment IF short (<= 60 chars) and has no comma
//   - Drop any additional "— TAGLINE" segments
//   - Drop taglines with commas OR multiple em-dashes between
function trimTaglines(s) {
  // Normalize em-dash variants to "—"
  s = s.replace(/\s+[–—-]{2,}\s+/g, ' — ').replace(/\s+—\s+/g, ' — ');
  const parts = s.split(' — ');
  if (parts.length <= 1) return s;
  const [head, ...rest] = parts;
  // Keep only FIRST tagline segment if short and comma-free
  const first = rest[0];
  if (first && first.length <= 60 && !first.includes(',')) {
    return `${head} — ${first}`;
  }
  return head;
}

function shortenTitle(h1) {
  // Expected: "# v1.X.Y — <title>"
  const m = /^#\s+(v[\d.]+)\s*—\s*(.+)$/.exec(h1.trim());
  if (!m) return null;
  const version = m[1];
  let title = m[2].trim();

  // Strip long parens
  title = stripLongParens(title);
  // Collapse multi em-dash taglines
  title = trimTaglines(title);
  // Normalize whitespace
  title = title.replace(/\s+/g, ' ').replace(/\s+([+])\s+/g, ' + ').trim();

  return `# ${version} — ${title}`;
}

const versions = readdirSync(DIR, { withFileTypes: true })
  .filter(e => e.isDirectory() && /^v[\d.]+$/.test(e.name))
  .map(e => e.name)
  .filter(inRange)
  .sort((a, b) => {
    const [aa, ab, ac] = semverKey(a);
    const [ba, bb, bc] = semverKey(b);
    return aa - ba || ab - bb || ac - bc;
  });

let changed = 0;
let unchanged = 0;
let skipped = 0;

for (const v of versions) {
  const path = join(DIR, v, 'README.md');
  let content;
  try { content = readFileSync(path, 'utf8'); } catch { skipped++; continue; }
  const lines = content.split('\n');
  const oldH1 = lines[0];
  const newH1 = shortenTitle(oldH1);
  if (!newH1) { skipped++; continue; }
  if (newH1 === oldH1) { unchanged++; continue; }
  lines[0] = newH1;
  const newContent = lines.join('\n');
  if (!dryRun) writeFileSync(path, newContent);
  changed++;
  const verbose = args.includes('--verbose') || args.includes('-v');
  if (dryRun && (verbose || changed <= 5 || [250, 300, 350, 400, 450, 499].some(n => v === `v1.49.${n}`))) {
    console.error(`[dry] ${v}:`);
    console.error(`      OLD (${oldH1.length}): ${oldH1.slice(0, 120)}${oldH1.length > 120 ? '…' : ''}`);
    console.error(`      NEW (${newH1.length}): ${newH1}`);
  }
}

console.error(`\n${dryRun ? '[dry-run]' : '[execute]'} scanned ${versions.length}, changed ${changed}, unchanged ${unchanged}, skipped ${skipped}`);
