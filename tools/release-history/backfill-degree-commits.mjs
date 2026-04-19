#!/usr/bin/env node
// Backfill commit counts for degree releases where the tag doesn't point at the
// actual content commit (bulk re-tag artifact, Phase 06).
//
// For releases with name "Degree N: …", find the commit whose message contains
// "degree N" (case-insensitive) and compare to the "degree N-1" commit. Count
// commits between them.
//
// Updates release_history.release.commits (and files_changed / lines too) only
// for degree releases. NASA degrees excluded (their names are "Degree N: …" but
// the real content commits exist in a different pattern — handled separately).
//
// Usage:
//   node tools/release-history/backfill-degree-commits.mjs --dry-run
//   node tools/release-history/backfill-degree-commits.mjs --execute

import { spawnSync } from 'node:child_process';
import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';

const args = process.argv.slice(2);
const execute = args.includes('--execute');

function git(...a) {
  const r = spawnSync('git', a, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) return null;
  return r.stdout.trim();
}

// Find the FIRST commit (oldest) whose subject matches "degree N" exactly on the `feat(www):` path.
// Returns SHA or null.
function findDegreeCommit(n) {
  // Use --grep with word boundary; --perl-regexp and \b need --perl-regexp
  const out = git('log', '--all', '--format=%H%x09%s', '--perl-regexp', '--grep', `feat\\(www\\): degree ${n}\\b`);
  if (!out) return null;
  // Take the LAST line (oldest; git log is newest-first)
  const lines = out.trim().split('\n').filter(Boolean);
  if (!lines.length) return null;
  return lines[lines.length - 1].split('\t')[0];
}

function countCommits(from, to) {
  const out = git('rev-list', '--count', `${from}..${to}`);
  return out !== null ? parseInt(out, 10) : null;
}

function diffStats(from, to) {
  const out = git('diff', '--shortstat', `${from}..${to}`);
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

  // Match "Degree <n>: ..." in the name (Seattle360 + NASA format)
  const { rows } = await db.query(`
    SELECT version, name, commits
    FROM release_history.release
    WHERE name ~ '^Degree [0-9]+:'
    ORDER BY semver_major, semver_minor, semver_patch
  `);
  console.error(`[degree-backfill] ${rows.length} degree releases`);

  let updated = 0, noCommit = 0, skipped = 0;

  for (const r of rows) {
    const m = /^Degree (\d+):/.exec(r.name);
    if (!m) { skipped++; continue; }
    const n = parseInt(m[1], 10);
    const sha = findDegreeCommit(n);
    if (!sha) { noCommit++; continue; }
    // Find previous degree commit as baseline
    let prevSha = null;
    if (n > 1) prevSha = findDegreeCommit(n - 1);
    if (!prevSha) {
      // Degree 1 or predecessor missing — use sha^ (parent)
      const parent = git('rev-parse', `${sha}^`);
      if (!parent) { noCommit++; continue; }
      prevSha = parent;
    }
    const commits = countCommits(prevSha, sha);
    const diff = diffStats(prevSha, sha);

    if (execute) {
      await db.query(
        `UPDATE release_history.release
         SET commits = $1, files_changed = $2, lines_added = $3, lines_removed = $4
         WHERE version = $5`,
        [commits, diff.files, diff.added, diff.removed, r.version]
      );
    }
    updated++;
    if (updated <= 5 || updated % 50 === 0) {
      console.error(`[degree-backfill] ${r.version} Degree ${n}: was ${r.commits} -> ${commits} commits, ${diff.files} files`);
    }
  }

  await db.close();
  console.error(`[degree-backfill] ${execute ? 'wrote' : 'dry-run'}: updated ${updated}, no_commit ${noCommit}, skipped ${skipped}`);
}

main().catch(e => { console.error('[degree-backfill] fatal:', e.message); process.exit(2); });
