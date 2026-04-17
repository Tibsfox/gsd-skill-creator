#!/usr/bin/env node
// Pipeline reconciler — executable counterpart to the
// pipeline-reconciler agent. Checks 8 invariants between what the
// database claims and what's on disk. Read-only; never modifies.
//
// Exits:
//   0  — all invariants clean
//   1  — drift found (details in report + stdout JSON)
//   2  — fatal error

import { readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const cfg = loadConfig();
const ROADMAP_DIR = cfg.roadmap_dir_abs;
const SOURCE_DIR = cfg.source_dir_abs;
const REPORT_FILE = join(cfg.cache_dir_abs, '_reconciler-report.json');
mkdirSync(cfg.cache_dir_abs, { recursive: true });

const VERSION_RE = cfg.version_regex_compiled;

async function main() {
  const db = await openDb(cfg);
  const findings = [];
  const record = (id, ok, gate, evidence) => findings.push({ id, ok, gate, evidence });

  // #1 Release count symmetry
  {
    const { rows: [{ n: dbRows }] } = await db.query(
      `SELECT COUNT(*) AS n FROM release_history.release`);
    const chapterDirs = listVersionDirs(ROADMAP_DIR);
    const sourceDirs = listVersionDirs(SOURCE_DIR);
    const symmetric = parseInt(dbRows, 10) === chapterDirs.length;
    record(1, symmetric,
      'Release count symmetry',
      { db_rows: parseInt(dbRows, 10), chapter_dirs: chapterDirs.length, source_dirs: sourceDirs.length });
  }

  // #2 Retro flag vs chapter file
  {
    const { rows } = await db.query(`
      SELECT version FROM release_history.release WHERE has_retrospective = true
    `);
    const missing = [];
    for (const r of rows) {
      const fileExists =
        existsSync(join(ROADMAP_DIR, r.version, '03-retrospective.md')) ||
        existsSync(join(SOURCE_DIR, r.version, 'chapter', '03-retrospective.md'));
      if (!fileExists) missing.push(r.version);
    }
    record(2, missing.length === 0,
      'has_retrospective=true implies 03-retrospective.md exists',
      { flagged: rows.length, missing: missing.length, sample: missing.slice(0, 8) });
  }

  // #3 Lesson count vs chapter file
  {
    const { rows } = await db.query(`
      SELECT first_seen_version AS version, COUNT(*) AS n
      FROM release_history.lesson GROUP BY first_seen_version
    `);
    const missing = [];
    for (const r of rows) {
      if (parseInt(r.n, 10) === 0) continue;
      const ok =
        existsSync(join(ROADMAP_DIR, r.version, '04-lessons.md')) ||
        existsSync(join(SOURCE_DIR, r.version, 'chapter', '04-lessons.md'));
      if (!ok) missing.push(r.version);
    }
    record(3, missing.length === 0,
      'lesson_count>0 implies 04-lessons.md exists',
      { with_lessons: rows.length, missing: missing.length, sample: missing.slice(0, 8) });
  }

  // #4 Feature count vs chapter file
  {
    const { rows } = await db.query(`
      SELECT version, COUNT(*) AS n FROM release_history.feature GROUP BY version
    `);
    const missing = [];
    for (const r of rows) {
      if (parseInt(r.n, 10) === 0) continue;
      const ok = existsSync(join(ROADMAP_DIR, r.version, '01-features.md'));
      if (!ok) missing.push(r.version);
    }
    record(4, missing.length === 0,
      'features>0 implies 01-features.md exists',
      { with_features: rows.length, missing: missing.length, sample: missing.slice(0, 8) });
  }

  // #5 Publish checksum freshness — unpushed rows
  {
    const { rows } = await db.query(`
      SELECT COUNT(*) AS n FROM release_history.publish_target WHERE last_synced_at IS NULL
    `);
    const unsynced = parseInt(rows[0].n, 10);
    record(5, unsynced === 0,
      'All publish_target rows have been synced',
      { unsynced });
  }

  // #6 Ghost chapter stubs
  {
    const ghosts = cfg.ghosts || [];
    const missing = [];
    for (const g of ghosts) {
      const ok = existsSync(join(ROADMAP_DIR, g.version, '00-summary.md'));
      if (!ok) missing.push(g.version);
    }
    record(6, missing.length === 0,
      'Configured ghosts have chapter stubs',
      { total: ghosts.length, missing: missing.length, sample: missing });
  }

  // #7 Orphan chapter directories
  {
    const chapterDirs = listVersionDirs(ROADMAP_DIR);
    const { rows } = await db.query(`SELECT version FROM release_history.release`);
    const dbSet = new Set(rows.map(r => r.version));
    const orphans = chapterDirs.filter(v => !dbSet.has(v));
    record(7, orphans.length === 0,
      'No chapter dir without matching DB release row',
      { orphans: orphans.length, sample: orphans.slice(0, 8) });
  }

  // #8 Score freshness
  {
    const { rows } = await db.query(`
      SELECT COUNT(*) AS n FROM release_history.release r
      WHERE NOT EXISTS (
        SELECT 1 FROM release_history.release_score s WHERE s.version = r.version
      )
    `);
    const unscored = parseInt(rows[0].n, 10);
    record(8, unscored === 0,
      'All releases have a completeness score',
      { unscored });
  }

  await db.close();

  const total = findings.length;
  const passing = findings.filter(f => f.ok).length;
  const driftCount = total - passing;

  writeFileSync(REPORT_FILE, JSON.stringify({
    ran_at: new Date().toISOString(),
    passing, drift_count: driftCount, findings,
  }, null, 2));

  // Stdout: compact summary
  console.log(JSON.stringify({
    passing, total, drift_count: driftCount,
    failed_invariants: findings.filter(f => !f.ok).map(f => ({ id: f.id, gate: f.gate, evidence: f.evidence })),
  }, null, 2));

  // Stderr: human-readable
  for (const f of findings) {
    const icon = f.ok ? '✓' : '✗';
    console.error(`  ${icon} #${f.id} ${f.gate}`);
    if (!f.ok) console.error(`      ${JSON.stringify(f.evidence)}`);
  }
  console.error(`[reconciler] ${passing}/${total} invariants clean${driftCount ? ` — ${driftCount} drift finding(s)` : ''}`);

  process.exit(driftCount > 0 ? 1 : 0);
}

function listVersionDirs(base) {
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter(e => e.isDirectory() && VERSION_RE.test(e.name))
    .map(e => e.name);
}

main().catch(e => { console.error('[reconciler] fatal:', e.message); process.exit(2); });
