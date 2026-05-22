#!/usr/bin/env node
// tools/nasa-nav-grid-span-fix.mjs
//
// Follow-on fix to nasa-nav-and-track-css-patcher.mjs (v1.49.716).
//
// Bug: pages whose <main> uses `display: grid; grid-template-columns: 1fr Npx`
// auto-place the patched-in top nav-card as grid item 1 (col 1), which shifts
// the .content card into col 2 (the narrow sidebar slot) — visible as a huge
// blank section below the top nav-card on v1.0–v1.165 (131 of 169 pages).
//
// Fix: inject a one-line CSS rule that makes every direct-child .nav-card of a
// grid container span all columns. Idempotent. Creates .bak4 backups so the
// .bak3 rollback chain stays intact.
//
// Usage:
//   node tools/nasa-nav-grid-span-fix.mjs              # patch all eligible
//   node tools/nasa-nav-grid-span-fix.mjs 1.165 1.50   # specific
//   DRY_RUN=1 node tools/nasa-nav-grid-span-fix.mjs    # report only

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const NASA_ROOT = path.join(REPO_ROOT, 'www/tibsfox/com/Research/NASA');
const DRY_RUN = process.env.DRY_RUN === '1';

// Identity-line marker — used for idempotency check.
const SPAN_RULE = '  main > .nav-card, .grid > .nav-card, .content > .nav-card { grid-column: 1 / -1; }';

function listMissions() {
  return fs.readdirSync(NASA_ROOT)
    .filter(n => /^1\.\d+$/.test(n))
    .sort((a, b) => Number(a.split('.')[1]) - Number(b.split('.')[1]));
}

// Page is eligible if <style> contains `main { ... display: grid ... }`.
function pageNeedsFix(html) {
  return /\bmain\s*\{[^}]*display:\s*grid/i.test(html);
}

function alreadyFixed(html) {
  return html.includes(SPAN_RULE) ||
         /main\s*>\s*\.nav-card[^{]*\{[^}]*grid-column\s*:\s*1\s*\/\s*-1/i.test(html);
}

// Inject the span rule at the START of the first <style> block.
function injectSpanRule(html) {
  return html.replace(/<style>/, `<style>\n${SPAN_RULE}`);
}

const argMissions = process.argv.slice(2).filter(a => /^1\.\d+$/.test(a));
const missions = argMissions.length > 0 ? argMissions : listMissions();

let patched = 0;
let alreadyOk = 0;
let notEligible = 0;
let skipped = 0;
const report = [];

for (const ver of missions) {
  const file = path.join(NASA_ROOT, ver, 'index.html');
  if (!fs.existsSync(file)) {
    skipped++;
    report.push(`SKIP ${ver}: file not found`);
    continue;
  }
  const before = fs.readFileSync(file, 'utf8');

  if (!pageNeedsFix(before)) {
    notEligible++;
    report.push(`NA   ${ver}: <main> not a grid container`);
    continue;
  }
  if (alreadyFixed(before)) {
    alreadyOk++;
    report.push(`OK   ${ver}: span rule already present`);
    continue;
  }

  const after = injectSpanRule(before);
  if (after === before) {
    skipped++;
    report.push(`NOOP ${ver}: no <style> block found`);
    continue;
  }

  if (DRY_RUN) {
    report.push(`DRY  ${ver}: would inject span rule`);
  } else {
    fs.writeFileSync(file + '.bak4', before);
    fs.writeFileSync(file, after);
    report.push(`FIX  ${ver}: span rule injected`);
  }
  patched++;
}

const PRINT_LIMIT = 30;
console.log(report.slice(0, PRINT_LIMIT).join('\n'));
if (report.length > PRINT_LIMIT) {
  console.log(`... ${report.length - PRINT_LIMIT} more entries`);
}
console.log('\nSummary:');
console.log(`  patched:      ${patched}`);
console.log(`  already-ok:   ${alreadyOk}`);
console.log(`  not-eligible: ${notEligible}`);
console.log(`  skipped:      ${skipped}`);
console.log(`  total:        ${missions.length}`);
if (DRY_RUN) console.log('\n(DRY_RUN=1 — no files written)');
