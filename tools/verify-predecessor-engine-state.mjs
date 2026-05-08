#!/usr/bin/env node
/**
 * verify-predecessor-engine-state.mjs — audit MISSION-BRIEF predecessor
 * track-pick claims against on-disk Research/<TRACK>/<DEGREE>/index.html
 * <title> tags.
 *
 * Closes IC-613-4 from .planning/missions/v1-49-613-skylab-4-comet-kohoutek/CARRY-FORWARD.md
 *
 * Why this exists: at v613 W1 the MISSION-BRIEF stated "v612 ELC = OPEC oil
 * embargo" but on-disk www/tibsfox/com/Research/ELC/1.89/index.html confirmed
 * v612 actually shipped ESA-1973-12-28. Required mid-research pivot. The
 * authoring discipline (FA-613-6) makes this a prose-rule; this gate makes
 * it deterministic.
 *
 * Behavior:
 *   1. Read MISSION-BRIEF.md from given path (or auto-detect from current
 *      working directory mission package)
 *   2. Find the "engine state at close" clause in the predecessor sentence
 *   3. Extract per-track claims (NASA 1.NN / MUS 1.NN <pick> / ELC 1.NN <pick> /
 *      SPS #NN <pick>) using structured regex
 *   4. For each claim, read www/tibsfox/com/Research/<TRACK>/<DEGREE>/index.html
 *      <title> tag content
 *   5. Verify the claim's pick keywords appear in the title
 *   6. Report PASS / FAIL / WARN with diff details
 *
 * Invocation:
 *   node tools/verify-predecessor-engine-state.mjs <mission-package-dir>
 *   node tools/verify-predecessor-engine-state.mjs --auto      # find latest mission package
 *
 * Exit codes:
 *   0  all predecessor claims verified
 *   1  parse error (MISSION-BRIEF missing engine-state clause)
 *   2  one or more claims FAIL verification (mismatch with on-disk title)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const AUTO = args.includes('--auto');
const MISSION_DIR_ARG = args.find(a => !a.startsWith('--'));

const REPO_ROOT = process.cwd();

function findLatestMissionPackage() {
  const missionsDir = resolve(REPO_ROOT, '.planning/missions');
  if (!existsSync(missionsDir)) return null;
  const entries = readdirSync(missionsDir)
    .filter(name => /^v1-49-\d+-/.test(name))
    .map(name => ({
      name,
      path: join(missionsDir, name),
      mtime: statSync(join(missionsDir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return entries[0]?.path ?? null;
}

let missionDir;
if (AUTO) {
  missionDir = findLatestMissionPackage();
  if (!missionDir) {
    console.error('[verify-predecessor] FATAL: --auto could not locate any mission package under .planning/missions/');
    process.exit(1);
  }
} else if (MISSION_DIR_ARG) {
  missionDir = resolve(REPO_ROOT, MISSION_DIR_ARG);
} else {
  console.error('Usage: verify-predecessor-engine-state.mjs <mission-dir> | --auto');
  process.exit(1);
}

const briefPath = join(missionDir, 'MISSION-BRIEF.md');
if (!existsSync(briefPath)) {
  console.error(`[verify-predecessor] FATAL: MISSION-BRIEF.md not found at ${briefPath}`);
  process.exit(1);
}

const brief = readFileSync(briefPath, 'utf8');

// Find the predecessor sentence — the one starting with "**Predecessor (immediate"
const predecessorLine = brief.match(/\*\*Predecessor[^\n]+\n/);
if (!predecessorLine) {
  console.error('[verify-predecessor] FATAL: MISSION-BRIEF.md missing predecessor sentence');
  process.exit(1);
}

// Find the "engine state at close: ..." clause within that sentence
const engineStateMatch = predecessorLine[0].match(/engine state at close:\s*([^)]+)\)/i);
if (!engineStateMatch) {
  console.error('[verify-predecessor] FATAL: predecessor sentence missing "engine state at close:" clause');
  console.error('  predecessor sentence:');
  console.error(`  ${predecessorLine[0].trim()}`);
  process.exit(1);
}

const engineStateClause = engineStateMatch[1];

// Parse per-track claims. Each claim is separated by " / " in the engine-state clause.
// Patterns:
//   NASA 1.89        (no pick text — just degree)
//   MUS 1.89 The Who *Quadrophenia*    (pick text follows degree)
//   ELC 1.89 OPEC oil embargo
//   SPS #86 Northern Flying Squirrel
//   §6.6 register ...   (skip; not a track-pick)
//   TRS M1 W2 pack-08 ...   (skip in this validator; TRS doesn't have a per-degree page yet)

const TRACK_PATTERNS = [
  { track: 'NASA', re: /NASA\s+(1\.\d+)([^/]*?)(?=\s*\/|$)/ },
  { track: 'MUS',  re: /MUS\s+(1\.\d+)\s+([^/]+?)(?=\s*\/|$)/ },
  { track: 'ELC',  re: /ELC\s+(1\.\d+)\s+([^/]+?)(?=\s*\/|$)/ },
  { track: 'SPS',  re: /SPS\s+#(\d+)\s+([^/]+?)(?=\s*\/|$)/ },
];

const claims = [];
for (const { track, re } of TRACK_PATTERNS) {
  const m = engineStateClause.match(re);
  if (!m) continue;
  const degree = m[1];
  const pickText = (m[2] ?? '').trim();
  claims.push({ track, degree, pickText });
}

if (claims.length === 0) {
  console.error('[verify-predecessor] FATAL: no track claims parsed from engine-state clause');
  console.error(`  clause: ${engineStateClause}`);
  process.exit(1);
}

// Resolve on-disk path for each claim
function resolveTrackPath(track, degree) {
  if (track === 'SPS') {
    // SPS has slug-based subdirs not numeric-degree. Skip on-disk verification
    // for SPS until structured. Return null to indicate "not verifiable here."
    return null;
  }
  return resolve(REPO_ROOT, `www/tibsfox/com/Research/${track}/${degree}/index.html`);
}

function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

function tokenize(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const results = [];
for (const claim of claims) {
  const path = resolveTrackPath(claim.track, claim.degree);
  if (!path) {
    results.push({ ...claim, status: 'SKIP', detail: 'SPS uses slug-based subdirs; structured per-track verification deferred' });
    continue;
  }
  if (!existsSync(path)) {
    results.push({ ...claim, status: 'WARN', detail: `index.html missing at ${path}` });
    continue;
  }
  const html = readFileSync(path, 'utf8');
  const title = extractTitle(html);
  if (!title) {
    results.push({ ...claim, status: 'WARN', detail: 'index.html has no <title> tag', title });
    continue;
  }

  // Verify pick keywords appear in title (case-insensitive, word-level).
  // For NASA, claim.pickText is empty (just the degree). We accept on
  // degree-mention — the page exists at the right URL and the title contains
  // the degree number somewhere (either "NASA 1.NN" literal or "v1.NN").
  if (claim.track === 'NASA') {
    const lower = title.toLowerCase();
    if (lower.includes(claim.degree) || lower.includes(`v${claim.degree}`)) {
      results.push({ ...claim, status: 'PASS', detail: 'NASA degree marker present in title', title });
    } else {
      results.push({ ...claim, status: 'WARN', detail: `NASA title does not contain degree marker "${claim.degree}"`, title });
    }
    continue;
  }

  const claimTokens = tokenize(claim.pickText);
  const titleTokens = tokenize(title);
  const titleSet = new Set(titleTokens);

  // Required: at least 50% of claim tokens (>=2 chars) must appear in title
  const significant = claimTokens.filter(t => t.length >= 3);
  const matched = significant.filter(t => titleSet.has(t));
  const matchRatio = significant.length > 0 ? matched.length / significant.length : 1;

  if (matchRatio >= 0.5) {
    results.push({ ...claim, status: 'PASS', detail: `${matched.length}/${significant.length} keywords in title`, title });
  } else {
    results.push({ ...claim, status: 'FAIL', detail: `only ${matched.length}/${significant.length} keywords matched (${(matchRatio * 100).toFixed(0)}%)`, title, claimTokens: significant, matched });
  }
}

// Report
console.log(`[verify-predecessor] mission package: ${missionDir}`);
console.log(`[verify-predecessor] engine-state clause: ${engineStateClause.slice(0, 200)}${engineStateClause.length > 200 ? '...' : ''}`);
console.log(`[verify-predecessor] verified ${results.length} track claims:`);
for (const r of results) {
  const status = r.status.padEnd(4);
  const tag = r.track === 'SPS' ? `SPS #${r.degree}` : `${r.track} ${r.degree}`;
  console.log(`  [${status}] ${tag.padEnd(10)} pick="${r.pickText.slice(0, 40)}${r.pickText.length > 40 ? '...' : ''}"`);
  if (r.detail) console.log(`         ${r.detail}`);
  if (r.status === 'FAIL') {
    console.log(`         expected tokens: ${r.claimTokens.join(', ')}`);
    console.log(`         matched:         ${r.matched.join(', ')}`);
    console.log(`         actual title:    "${r.title}"`);
  }
}

const failures = results.filter(r => r.status === 'FAIL');
const warnings = results.filter(r => r.status === 'WARN');

console.log();
console.log(`[verify-predecessor] summary: ${results.filter(r => r.status === 'PASS').length} PASS / ${warnings.length} WARN / ${failures.length} FAIL / ${results.filter(r => r.status === 'SKIP').length} SKIP`);

if (failures.length > 0) {
  console.error(`[verify-predecessor] EXIT 2: ${failures.length} predecessor claim(s) failed verification`);
  console.error('  Fix: re-read on-disk Research/<TRACK>/<DEGREE>/index.html and update MISSION-BRIEF.md predecessor sentence to match.');
  process.exit(2);
}

process.exit(0);
