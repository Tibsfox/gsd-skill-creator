#!/usr/bin/env node
/**
 * One-shot: delete a release-history entry that no longer has a corresponding
 * git tag on origin. Used to remove orphans created by slot-correction
 * (e.g., v1.49.650 → v1.49.635 rename at v1.49.635 ship), where the old
 * label was un-published from origin but the RH database still carries
 * the entry from its pre-correction ingest.
 *
 * Usage:
 *   node tools/release-history/run-with-pg.mjs delete-orphan-version v1.49.650
 *
 * Safety:
 *   - Refuses to delete a version that still has a corresponding git tag
 *     (use `git tag --list <version>` to confirm absence first).
 *   - Reports row counts before/after the delete.
 *   - Re-runs `regen-history-md` so docs/RELEASE-HISTORY.md reflects the
 *     post-delete state.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

async function main() {
  const version = process.argv[2];
  if (!version) {
    console.error('usage: delete-orphan-version.mjs <version>');
    console.error('  e.g.: delete-orphan-version.mjs v1.49.650');
    process.exit(2);
  }

  const tagCheck = spawnSync('git', ['tag', '--list', version], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (tagCheck.stdout.trim() === version) {
    console.error(`error: ${version} still exists as a local git tag — refusing to delete.`);
    console.error('  Delete the local tag first: git tag -d ' + version);
    process.exit(3);
  }
  const originCheck = spawnSync(
    'git',
    ['ls-remote', '--tags', 'origin', `refs/tags/${version}`],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  if (originCheck.stdout.trim().length > 0) {
    console.error(`error: ${version} still exists on origin — refusing to delete.`);
    console.error('  Delete the remote tag first: git push --delete origin ' + version);
    process.exit(3);
  }

  const cfg = await loadConfig();
  const db = await openDb(cfg);

  const before = await db.query(
    'SELECT version, shipped_at, name FROM release_history.release WHERE version = $1',
    [version],
  );
  if (before.rows.length === 0) {
    console.log(`[delete-orphan] ${version}: no rows in release_history.release; nothing to delete`);
    await db.close();
    return;
  }
  console.log(`[delete-orphan] before:`, before.rows[0]);

  await db.begin();
  try {
    // Delete from all tables referencing this version. Schema info:
    //   release_history.release (primary)
    //   release_history.lessons (FK)
    //   release_history.metrics (FK)
    //   release_history.completeness_scores (FK)
    // Per-table column conventions:
    //   release_history.release      version column = `version`
    //   release_history.feature      version column = `version`
    //   release_history.retrospective version column = `version`
    //   release_history.metric       version column = `version`
    //   release_history.lesson       version column = `first_seen_version`
    const deletes = [
      { table: 'release_history.lesson', column: 'first_seen_version' },
      { table: 'release_history.metric', column: 'version' },
      { table: 'release_history.feature', column: 'version' },
      { table: 'release_history.retrospective', column: 'version' },
      { table: 'release_history.release', column: 'version' },
    ];
    for (const { table, column } of deletes) {
      try {
        const res = await db.query(`DELETE FROM ${table} WHERE ${column} = $1`, [version]);
        console.log(`[delete-orphan]   ${table}: deleted ${res.rowCount ?? '?'} rows`);
      } catch (e) {
        // Table may not exist in this DB version; log + continue
        console.log(`[delete-orphan]   ${table}: skipped (${e.message})`);
      }
    }
    await db.commit();
  } catch (e) {
    await db.rollback();
    console.error(`[delete-orphan] FAILED: ${e.message}`);
    await db.close();
    process.exit(1);
  }

  const after = await db.query(
    'SELECT version FROM release_history.release WHERE version = $1',
    [version],
  );
  console.log(`[delete-orphan] after: ${after.rows.length} rows remaining for ${version}`);

  await db.close();

  // Regenerate docs/RELEASE-HISTORY.md to reflect the post-delete state.
  console.log(`[delete-orphan] regenerating docs/RELEASE-HISTORY.md ...`);
  const regen = spawnSync(
    'node',
    [join(HERE, 'run-with-pg.mjs'), 'regen-history-md'],
    { cwd: REPO_ROOT, stdio: 'inherit' },
  );
  if (regen.status !== 0) {
    console.error(`[delete-orphan] regen-history-md exited ${regen.status}`);
    process.exit(regen.status ?? 1);
  }

  console.log(`[delete-orphan] ${version}: complete`);
}

main().catch((e) => {
  console.error(`[delete-orphan] fatal: ${e.message}`);
  process.exit(1);
});
