#!/usr/bin/env node
// Backfill commits / files_changed / lines_added / lines_removed from git tags.
//
// For every release in release_history.release, find the matching git tag
// (or tag-like ref) and the previous release's tag, then count commits +
// diff stats between them. Writes back to the release row.
//
// Only updates columns where the DB value is NULL — preserves any
// README-extracted values. Use --force to overwrite.
//
// Usage:
//   node tools/release-history/backfill-git-stats.mjs            # fill nulls
//   node tools/release-history/backfill-git-stats.mjs --force    # overwrite all
//   node tools/release-history/backfill-git-stats.mjs --dry-run  # print plan

import { spawnSync } from 'node:child_process';
import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

function git(...a) {
  const r = spawnSync('git', a, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) return null;
  return r.stdout.trim();
}

function tagExists(tag) {
  return git('rev-parse', '--verify', tag) !== null;
}

function resolveTag(version) {
  // Try: v1.49.39, 1.49.39, refs/tags/v1.49.39
  for (const candidate of [version, version.replace(/^v/, ''), `refs/tags/${version}`]) {
    if (tagExists(candidate)) return candidate;
  }
  return null;
}

function countCommits(fromTag, toTag) {
  // Default rev-list counts every commit reachable from <toTag> but not
  // from <fromTag>. For most milestones this matches the atomic-commit
  // count exactly. Pathological cases — milestones tagged on a merge
  // commit that pulled in a long-divergent parallel-engine branch (NASA,
  // Seattle 360, artemis-ii) — can produce counts in the thousands.
  //
  // Two-stage fallback when default count > 500:
  //   (1) first-parent --no-merges between the tags
  //   (2) if that's still > 500, use first-parent since the prev-tag
  //       commit-date — this bounds inflation when the prev tag and
  //       current tag are on parallel branches sharing only an old
  //       merge-base (e.g. v1.49.569/v1.49.570 = 3 hours apart in time
  //       but share a merge-base 30+ tags back, yielding 5384 default /
  //       3030 first-parent --no-merges / 4 first-parent since-date).
  const def = git('rev-list', '--count', `${fromTag}..${toTag}`);
  if (def === null) return null;
  const n = parseInt(def, 10);
  if (n <= 500) return n;

  const fp = git('rev-list', '--count', '--first-parent', '--no-merges', `${fromTag}..${toTag}`);
  const fpN = fp !== null ? parseInt(fp, 10) : n;
  if (fpN <= 500) return fpN;

  // Stage 2: date-bounded first-parent count. When the prev tag's
  // commit-date is well before the current tag's commit-date but the
  // tags share an old merge-base, this counts only the release-line
  // commits actually authored in the window between the two tags.
  const prevDate = git('log', fromTag, '-1', '--format=%cI');
  if (!prevDate) return fpN;
  const sinceCount = git('rev-list', '--count', toTag, '--first-parent', `--since=${prevDate}`);
  if (sinceCount === null) return fpN;
  const sN = parseInt(sinceCount, 10);
  return sN > 0 ? sN : fpN;
}

function diffStats(fromTag, toTag) {
  // git diff --shortstat → " 12 files changed, 345 insertions(+), 67 deletions(-)"
  const out = git('diff', '--shortstat', `${fromTag}..${toTag}`);
  if (!out) return { files: null, added: null, removed: null };
  const fm = /(\d+)\s+files?\s+changed/.exec(out);
  const am = /(\d+)\s+insertion/.exec(out);
  const rm = /(\d+)\s+deletion/.exec(out);
  return {
    files: fm ? parseInt(fm[1], 10) : 0,
    added: am ? parseInt(am[1], 10) : 0,
    removed: rm ? parseInt(rm[1], 10) : 0,
  };
}

async function main() {
  const cfg = loadConfig();
  const db = await openDb(cfg);

  const { rows: releases } = await db.query(`
    SELECT version, commits, files_changed, lines_added, lines_removed,
           semver_major, semver_minor, semver_patch, semver_prerelease
    FROM release_history.release
    ORDER BY semver_major, semver_minor, semver_patch, semver_prerelease
  `);

  console.error(`[backfill] ${releases.length} releases`);

  const stats = { total: releases.length, updated: 0, no_tag: 0, no_prev: 0, skipped: 0, errors: 0 };
  const updates = [];

  for (let i = 0; i < releases.length; i++) {
    const r = releases[i];
    const prev = i > 0 ? releases[i - 1] : null;

    // Skip rows that already have all 4 and --force not set
    const hasAll = r.commits != null && r.files_changed != null && r.lines_added != null && r.lines_removed != null;
    if (hasAll && !force) { stats.skipped++; continue; }

    const tag = resolveTag(r.version);
    if (!tag) { stats.no_tag++; continue; }

    // Find previous ref: prior release's tag, or the repo's root commit if this is v1.0
    let prevRef = null;
    if (prev) {
      prevRef = resolveTag(prev.version);
    }
    if (!prevRef) {
      // Use root commit as baseline
      prevRef = git('rev-list', '--max-parents=0', 'HEAD');
      if (!prevRef) { stats.no_prev++; continue; }
      prevRef = prevRef.split('\n')[0];
    }

    const commits = countCommits(prevRef, tag);
    const diff = diffStats(prevRef, tag);

    const newVals = {
      commits: (r.commits == null || force) ? commits : r.commits,
      files_changed: (r.files_changed == null || force) ? diff.files : r.files_changed,
      lines_added: (r.lines_added == null || force) ? diff.added : r.lines_added,
      lines_removed: (r.lines_removed == null || force) ? diff.removed : r.lines_removed,
    };

    updates.push({ version: r.version, ...newVals });

    if (!dryRun) {
      await db.query(
        `UPDATE release_history.release
         SET commits = $1, files_changed = $2, lines_added = $3, lines_removed = $4
         WHERE version = $5`,
        [newVals.commits, newVals.files_changed, newVals.lines_added, newVals.lines_removed, r.version]
      );
    }
    stats.updated++;
    if ((i + 1) % 100 === 0) console.error(`[backfill] ${i + 1}/${releases.length}`);
  }

  await db.close();

  console.error(`[backfill] done — updated ${stats.updated}, no tag ${stats.no_tag}, no prev ${stats.no_prev}, skipped ${stats.skipped}`);
  console.log(JSON.stringify({
    ...stats,
    mode: dryRun ? 'dry-run' : force ? 'force' : 'fill-nulls',
    sample: updates.slice(0, 5),
  }, null, 2));
}

main().catch(e => { console.error('[backfill] fatal:', e.message); process.exit(2); });
