#!/usr/bin/env node
/**
 * nasa-nav-promote-predecessor.mjs — promote a predecessor degree's index.html
 * nav-card from the leading-edge "Series hub" form to a "Next mission" link
 * pointing at the just-shipped successor degree.
 *
 * The site nav convention (NASA-DEGREE-CANONICAL §3.A nav-card), verified across
 * 1.218/1.219/1.220:
 *   - A degree WITH a shipped successor -> Previous / Current / Next mission.
 *   - The LEADING-EDGE degree (newest, no successor yet) -> Previous / Current /
 *     Series hub (right cell href="../index.html"). A "Next mission ->
 *     ../1.NNN/index.html" pointing at a not-yet-shipped degree is a DEAD LINK
 *     that nasa-consistency-audit BLOCKS (NAV_DEAD_TARGET + DEAD_INTERNAL_LINKS).
 *
 * So when degree D ships, D itself uses the leading-edge form (emitted by the
 * decompose-build index task) and its predecessor P (the prior leading edge)
 * must be PROMOTED: P's right nav cell flips Series hub -> Next mission -> D.
 * This script performs exactly that flip, on BOTH nav-cards (top + bottom), and
 * is idempotent (re-running once P already points at D is a no-op).
 *
 * Usage:
 *   node tools/nasa-nav-promote-predecessor.mjs \
 *     --predecessor 1.220 --new-degree 1.221 --new-mission "GRACE" \
 *     [--root <repo-root>] [--check]
 *
 *   --check   report-only; write nothing; exit 1 if a promotion is still
 *             needed, 0 if already promoted. Wire into a gate/drift-guard.
 *
 * Exit codes:
 *   0  promoted, or already promoted, or --check found nothing to do
 *   1  --check found a pending promotion (write would change the file)
 *   2  usage error / predecessor index missing / unexpected nav structure
 *
 * Read/writes ONLY the predecessor's index.html. Never touches the new degree
 * (its leading-edge nav is the build agent's job). Drift-guard:
 * tests/integration/nasa-nav-promote-predecessor.test.ts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function argVal(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}
function die(code, msg) {
  console.error(`[nasa-nav-promote-predecessor] ${msg}`);
  process.exit(code);
}

const CHECK = process.argv.includes('--check');
const PRED = argVal('--predecessor');
const NEW = argVal('--new-degree');
const MISSION = argVal('--new-mission');
const ROOT = argVal('--root') || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEGREE_RE = /^1\.\d+$/;
if (!PRED || !NEW || !MISSION) {
  die(2, 'usage: --predecessor 1.N --new-degree 1.M --new-mission "Name" [--root <dir>] [--check]');
}
if (!DEGREE_RE.test(PRED)) die(2, `--predecessor must look like 1.N, got "${PRED}"`);
if (!DEGREE_RE.test(NEW)) die(2, `--new-degree must look like 1.N, got "${NEW}"`);

const indexPath = path.join(ROOT, 'www/tibsfox/com/Research/NASA', PRED, 'index.html');
if (!fs.existsSync(indexPath)) die(2, `predecessor index not found: ${indexPath}`);
const html = fs.readFileSync(indexPath, 'utf8');

// Minimal HTML escape for the mission name placed inside the anchor text.
const escMission = MISSION.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const newHref = `../${NEW}/index.html`;
const newAnchor = `v${NEW} ${escMission} &rarr;`;

// The nav-card RIGHT cell. `class="right"` is nav-card-specific (the styling
// `.nav-card .right`), and the nav-label/anchor pair pins it further. Matches
// both the top and the bottom nav-card. Strict on purpose: any structural drift
// fails loudly (found<2) rather than silently corrupting the page.
const RIGHT_CELL_RE =
  /(<div class="right">\s*<div class="nav-label">)([^<]*)(<\/div>\s*<a href=")([^"]*)(">)([^<]*)(<\/a>\s*<\/div>)/g;

let found = 0;
let promoted = 0;
let already = 0;
const conflicts = [];

const out = html.replace(RIGHT_CELL_RE, (m, p1, navLabel, p3, href, p5, _anchor, p7) => {
  found++;
  const label = navLabel.trim();
  if (label === 'Next mission' && href === newHref) {
    already++;
    return m;
  }
  if (label === 'Series hub') {
    promoted++;
    return `${p1}Next mission${p3}${newHref}${p5}${newAnchor}${p7}`;
  }
  if (label === 'Next mission') {
    conflicts.push(`right cell already points to "${href}" (expected Series hub or ${newHref})`);
    return m;
  }
  conflicts.push(`unexpected nav-label "${label}" (expected "Series hub" or "Next mission")`);
  return m;
});

if (found === 0) {
  die(2, `no nav-card right cell found in ${indexPath} (expected <div class="right"><div class="nav-label">…)`);
}
if (found !== 2) {
  console.error(`[nasa-nav-promote-predecessor] warning: expected 2 nav-card right cells (top+bottom), found ${found}`);
}
if (conflicts.length) {
  die(2, `cannot promote ${PRED}: ${[...new Set(conflicts)].join('; ')}`);
}

if (CHECK) {
  if (promoted > 0) {
    console.error(`[check] ${PRED} needs promotion -> next ${NEW} (${promoted} cell(s) on the Series-hub form)`);
    process.exit(1);
  }
  console.log(`[check] ${PRED} already promoted -> next ${NEW} (${already}/${found} cells)`);
  process.exit(0);
}

if (promoted === 0) {
  console.log(`already promoted: ${PRED} -> next ${NEW} (${already}/${found} cells, no change)`);
  process.exit(0);
}

fs.writeFileSync(indexPath, out);
console.log(`promoted ${PRED} -> next mission ${NEW} ${MISSION} (${promoted} cell(s) updated, ${already} already correct)`);
process.exit(0);
