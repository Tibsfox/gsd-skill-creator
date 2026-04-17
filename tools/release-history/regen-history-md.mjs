#!/usr/bin/env node
// Regenerate docs/RELEASE-HISTORY.md from release_history.* — adds Retro + Lessons
// columns so the canonical index reflects what's actually on disk.
//
// Preserves header prose (the two paragraphs above the table). Rewrites only the
// table itself. Idempotent.

import { readFileSync, writeFileSync } from 'node:fs';
import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';

const ctx_cfg = loadConfig();
const HISTORY = ctx_cfg.index_file_abs;

async function main() {
  const client = await openDb(ctx_cfg);

  const { rows } = await client.query(`
    SELECT r.version, r.name,
           to_char(r.shipped_at, 'YYYY-MM-DD') AS shipped,
           r.phases, r.plans,
           r.has_retrospective,
           r.source_readme,
           COALESCE(lc.n, 0)::int AS lesson_count,
           COALESCE(ac.n, 0)::int AS applied_count
    FROM release_history.release r
    LEFT JOIN (
      SELECT first_seen_version AS version, COUNT(*) AS n
      FROM release_history.lesson
      GROUP BY first_seen_version
    ) lc ON lc.version = r.version
    LEFT JOIN (
      SELECT first_seen_version AS version, COUNT(*) AS n
      FROM release_history.lesson
      WHERE status = 'applied'
      GROUP BY first_seen_version
    ) ac ON ac.version = r.version
    ORDER BY r.semver_major DESC, r.semver_minor DESC, r.semver_patch DESC,
             r.semver_prerelease DESC NULLS LAST
  `);

  await client.close();

  const esc = s => (s || '').replace(/\|/g, '\\|');
  const oldest = rows[rows.length - 1]?.version || '';
  const newest = rows[0]?.version || '';
  const retroCount = rows.filter(r => r.has_retrospective).length;

  const header = [
    '# Release History',
    '',
    `${rows.length} milestones shipped across the ${oldest} → ${newest} arc. The table below lists every shipped release, newest first.`,
    '',
    'Each version links to a detailed release notes directory with full feature descriptions, and where available, retrospectives and lessons learned. The `Retro` column shows whether a retrospective was captured (`✓` when present). `Lessons` counts extracted retrospective lessons, with `applied/total` when any are known to be applied in a later release. See `.planning/roadmap/RETROSPECTIVE-TRACKER.md` (private) for the full backlog.',
    '',
    `**Snapshot:** ${rows.length} releases · ${retroCount} with retrospectives · `
      + `${rows.filter(r => r.lesson_count > 0).length} with extracted lessons · `
      + `source of truth: Postgres \`release_history\` schema, regenerated via \`tools/release-history/regen-history-md.mjs\`.`,
    '',
    '| Version | Name | Shipped | Phases | Plans | Retro | Lessons | Notes |',
    '|---------|------|---------|--------|-------|-------|---------|-------|',
  ];

  const body = rows.map(r => {
    const isGhost = r.source_readme.includes('never existed') || r.source_readme.includes('dead link');
    // Ghosts point at /chapter/ since we now seed chapter stubs there
    const linkPath = isGhost
      ? `release-notes/${r.version}/chapter/`
      : `release-notes/${r.version}/`;
    const versionCell = `[${r.version}](${linkPath})`;
    const retro = r.has_retrospective ? '✓' : '—';
    let lessons = '—';
    if (r.lesson_count > 0) {
      lessons = r.applied_count > 0 ? `${r.applied_count}/${r.lesson_count}` : `${r.lesson_count}`;
    }
    const notes = isGhost ? '_no original README, chapter stub only_' : '';
    return `| ${versionCell} | ${esc(r.name) || '—'} | ${r.shipped || '—'} | ${r.phases ?? '—'} | ${r.plans ?? '—'} | ${retro} | ${lessons} | ${notes} |`;
  });

  const out = [...header, ...body, ''].join('\n');
  writeFileSync(HISTORY, out);
  console.error(`[regen] wrote ${HISTORY} — ${rows.length} rows, ${retroCount} with retros`);
  console.log(JSON.stringify({
    rows: rows.length,
    with_retro: retroCount,
    with_lessons: rows.filter(r => r.lesson_count > 0).length,
    oldest, newest,
  }, null, 2));
}

main().catch(e => { console.error('[regen] fatal:', e.message); process.exit(2); });
