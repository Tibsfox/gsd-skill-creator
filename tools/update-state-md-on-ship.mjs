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

// NOTE: do NOT early-exit on `status === 'shipped'` here — the post-v1.49.621
// fix needs to detect stale-stuck STATE.md (status=shipped for an older tagged
// milestone with newer tags present) and advance. The "already shipped" no-op
// happens later, after the latest-tag comparison.

// Check if a git tag matching the STATE.md milestone exists.
let stateMilestoneSha = null;
try {
  stateMilestoneSha = execSync(`git rev-parse "${milestone}^{commit}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
} catch {
  // Tag not found → milestone hasn't been tagged/shipped yet (newly-opened milestone)
  console.log(`[update-state-md] no git tag for ${milestone} — milestone not shipped yet, no-op`);
  process.exit(0);
}

// STATE.md milestone has a tag. Now check whether it's the LATEST milestone tag.
//
// Bug fix (post-v1.49.621): the original implementation anchored only on
// STATE.md's `milestone` field. If subsequent milestones shipped without an
// explicit "open milestone" step that bumped that field (counter-cadence
// rapid-fire ships), the script would see status=shipped for the stale
// milestone and no-op — even though newer tags existed. v1.49.616 through
// v1.49.620 all silently slipped past the auto-update; STATE.md had to be
// hand-recovered at v1.49.621 close.
//
// Fix: detect the latest semver-sorted `v*.*.*` tag, compare to STATE.md.
// If STATE.md is stuck on an older tagged milestone, advance to the latest.
let latestTag = milestone;
let latestTagSha = stateMilestoneSha;
try {
  // `--merged HEAD` filters out tags on disconnected branches (e.g., the
  // paused v1.50.x branch in gsd-skill-creator). Without this filter, the
  // script would erroneously advance dev/main to a v1.50.x tag that's not
  // reachable from the active branch's history.
  const tagsRaw = execSync(`git tag --merged HEAD -l 'v*.*.*' --sort=-version:refname`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
  const tags = tagsRaw ? tagsRaw.split('\n').filter(Boolean) : [];
  if (tags.length > 0 && tags[0] !== milestone) {
    latestTag = tags[0];
    latestTagSha = execSync(`git rev-parse "${latestTag}^{commit}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  }
} catch {
  // Could not enumerate tags — fall through and treat STATE.md milestone as latest.
}

const isAdvancing = latestTag !== milestone;

// If STATE.md is at the latest tag AND status=shipped, nothing to do.
if (!isAdvancing && status === 'shipped') {
  console.log(`[update-state-md] STATE.md already at status=shipped for ${milestone} — no-op`);
  process.exit(0);
}

// At this point: either status=planning needs to become shipped, OR STATE.md
// is stuck on an older tag and needs to advance.
const targetMilestone = latestTag;
const targetSha = latestTagSha;
const nowIso = new Date().toISOString();

if (CHECK_ONLY) {
  if (isAdvancing) {
    console.log(
      `[update-state-md] WOULD ADVANCE: stale STATE.md at ${milestone} → latest tag ${targetMilestone} (sha=${targetSha.slice(0, 9)}, at=${nowIso})`,
    );
  } else {
    console.log(
      `[update-state-md] WOULD UPDATE: ${milestone} status=${status} → shipped (sha=${targetSha.slice(0, 9)}, at=${nowIso})`,
    );
  }
  process.exit(0);
}

let newFrontmatter = frontmatterRaw;

if (isAdvancing) {
  newFrontmatter = newFrontmatter.replace(
    /^milestone:\s*.*$/m,
    `milestone: ${targetMilestone}`,
  );
}

newFrontmatter = newFrontmatter.replace(
  /^status:\s*.*$/m,
  'status: shipped',
);

newFrontmatter = newFrontmatter.replace(
  /^last_updated:\s*"?[^"\n]*"?\s*$/m,
  `last_updated: "${nowIso}"`,
);

if (!/^shipped_at:/m.test(newFrontmatter)) {
  newFrontmatter = newFrontmatter.replace(
    /^status: shipped$/m,
    `status: shipped\nshipped_at: "${nowIso}"\nshipped_at_sha: "${targetSha.slice(0, 9)}"\nshipped_at_tag: "${targetMilestone}"`,
  );
} else {
  newFrontmatter = newFrontmatter.replace(
    /^shipped_at:\s*"?[^"\n]*"?\s*$/m,
    `shipped_at: "${nowIso}"`,
  );
  newFrontmatter = newFrontmatter.replace(
    /^shipped_at_sha:\s*"?[^"\n]*"?\s*$/m,
    `shipped_at_sha: "${targetSha.slice(0, 9)}"`,
  );
  if (/^shipped_at_tag:/m.test(newFrontmatter)) {
    newFrontmatter = newFrontmatter.replace(
      /^shipped_at_tag:\s*"?[^"\n]*"?\s*$/m,
      `shipped_at_tag: "${targetMilestone}"`,
    );
  } else {
    newFrontmatter = newFrontmatter.replace(
      /^shipped_at_sha:\s*"[^"]*"\s*$/m,
      (m) => `${m}\nshipped_at_tag: "${targetMilestone}"`,
    );
  }
}

const newRaw = `---\n${newFrontmatter}\n---\n${body}`;
writeFileSync(STATE_PATH, newRaw);

if (isAdvancing) {
  console.log(
    `[update-state-md] ADVANCED: stale STATE.md ${milestone} → ${targetMilestone} (sha=${targetSha.slice(0, 9)}, at=${nowIso})`,
  );
  console.log(
    `[update-state-md] WARNING: predecessor_* and ancillary fields (counter_cadence, nasa_degree, etc.) were NOT touched — operator should backfill manually if bookkeeping matters.`,
  );
} else {
  console.log(
    `[update-state-md] UPDATED: ${milestone} status=${status} → shipped (sha=${targetSha.slice(0, 9)}, at=${nowIso})`,
  );
}
process.exit(0);
