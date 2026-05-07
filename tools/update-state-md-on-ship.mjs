#!/usr/bin/env node
/**
 * update-state-md-on-ship.mjs — auto-update .planning/STATE.md when a
 * milestone is tagged + shipped.
 *
 * Closes IC-613-3 from .planning/missions/v1-49-613-skylab-4-comet-kohoutek/CARRY-FORWARD.md
 *
 * Why this exists: STATE.md is updated at milestone OPEN (W0) but historically
 * not at milestone SHIP. So between ship-tag and next-milestone-open, STATE.md
 * describes the previous-milestone-as-`status: planning` indefinitely.
 * Session-start hook surfaces stale STATE.md to context, risking duplicate-ship
 * attempts or confusion about pipeline state.
 *
 * Behavior (idempotent):
 *   1. Read .planning/STATE.md (no-op if missing — STATE.md is gitignored)
 *   2. Parse YAML frontmatter; extract `milestone` field (e.g., "v1.49.613")
 *   3. Check if a git tag matching the milestone exists
 *      - if no tag: no-op (milestone hasn't shipped yet)
 *      - if tag exists AND status=planning: update to shipped
 *      - if tag exists AND status=shipped: no-op (already updated)
 *   4. On update: set status=shipped, add shipped_at + shipped_at_sha,
 *      refresh last_updated. Leave all other fields untouched.
 *
 * Invocation:
 *   node tools/update-state-md-on-ship.mjs            # auto-detect, apply if tag exists
 *   node tools/update-state-md-on-ship.mjs --check    # report-only (no write); exit 0 if would-no-op or would-update; exit 1 on error
 *
 * Exit codes:
 *   0  no-op or successful update (or --check report)
 *   1  STATE.md missing milestone field or malformed frontmatter
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');

const STATE_PATH = resolve(process.cwd(), '.planning', 'STATE.md');

if (!existsSync(STATE_PATH)) {
  // No STATE.md — nothing to do (planning artifacts may not exist in all clones)
  console.log('[update-state-md] no STATE.md at .planning/STATE.md — no-op');
  process.exit(0);
}

const raw = readFileSync(STATE_PATH, 'utf8');

// Parse YAML frontmatter — must start with `---\n` and end with `---\n`
const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!match) {
  console.error('[update-state-md] FATAL: STATE.md is missing YAML frontmatter');
  process.exit(1);
}

const [, frontmatterRaw, body] = match;

// Extract milestone field — minimal YAML parse (we only read scalar fields)
function readField(yaml, key) {
  const re = new RegExp(`^${key}:\\s*"?([^"\n]*)"?\\s*$`, 'm');
  const m = yaml.match(re);
  return m ? m[1].trim() : null;
}

const milestone = readField(frontmatterRaw, 'milestone');
const status = readField(frontmatterRaw, 'status');

if (!milestone) {
  console.error('[update-state-md] FATAL: STATE.md missing `milestone` field');
  process.exit(1);
}

if (status === 'shipped') {
  console.log(`[update-state-md] STATE.md already at status=shipped for ${milestone} — no-op`);
  process.exit(0);
}

// Check if a git tag matching milestone exists
let tagSha = null;
try {
  tagSha = execSync(`git rev-parse "${milestone}^{commit}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
} catch {
  // Tag not found → milestone not shipped yet
  console.log(`[update-state-md] no git tag for ${milestone} — milestone not shipped yet, no-op`);
  process.exit(0);
}

// At this point: tag exists AND status != shipped → update STATE.md
const nowIso = new Date().toISOString();

if (CHECK_ONLY) {
  console.log(
    `[update-state-md] WOULD UPDATE: ${milestone} status=${status} → shipped (sha=${tagSha.slice(0, 9)}, at=${nowIso})`,
  );
  process.exit(0);
}

let newFrontmatter = frontmatterRaw;

// Update status field
newFrontmatter = newFrontmatter.replace(
  /^status:\s*.*$/m,
  'status: shipped',
);

// Update last_updated field (preserve quote style)
newFrontmatter = newFrontmatter.replace(
  /^last_updated:\s*"?[^"\n]*"?\s*$/m,
  `last_updated: "${nowIso}"`,
);

// Add shipped_at + shipped_at_sha if not already present
if (!/^shipped_at:/m.test(newFrontmatter)) {
  // Insert after status: shipped line
  newFrontmatter = newFrontmatter.replace(
    /^status: shipped$/m,
    `status: shipped\nshipped_at: "${nowIso}"\nshipped_at_sha: "${tagSha.slice(0, 9)}"`,
  );
} else {
  // Update existing shipped_at + shipped_at_sha (idempotency safety)
  newFrontmatter = newFrontmatter.replace(
    /^shipped_at:\s*"?[^"\n]*"?\s*$/m,
    `shipped_at: "${nowIso}"`,
  );
  newFrontmatter = newFrontmatter.replace(
    /^shipped_at_sha:\s*"?[^"\n]*"?\s*$/m,
    `shipped_at_sha: "${tagSha.slice(0, 9)}"`,
  );
}

const newRaw = `---\n${newFrontmatter}\n---\n${body}`;
writeFileSync(STATE_PATH, newRaw);

console.log(
  `[update-state-md] UPDATED: ${milestone} status=${status} → shipped (sha=${tagSha.slice(0, 9)}, at=${nowIso})`,
);
process.exit(0);
