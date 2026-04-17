#!/usr/bin/env node
// Regenerate docs/RELEASE-HISTORY.md from release_history.* — adds Retro + Lessons
// columns so the canonical index reflects what's actually on disk.
//
// Preserves header prose (the two paragraphs above the table). Rewrites only the
// table itself. Idempotent.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const ctx_cfg = loadConfig();
const HISTORY = ctx_cfg.index_file_abs;
const SOURCE_DIR = ctx_cfg.source_dir;  // relative path like "docs/release-notes"

// Paths of published chapter subfiles, relative to the repo root.
function chapterFileRel(version, filename) {
  return `${SOURCE_DIR}/${version}/chapter/${filename}`;
}
function chapterFileExists(version, filename) {
  return existsSync(join(REPO_ROOT, chapterFileRel(version, filename)));
}
// A link target used from inside the HISTORY file — relative to the HISTORY file's directory.
function linkFromHistoryTo(relFromRepoRoot) {
  const historyDir = dirname(HISTORY);
  return relative(historyDir, join(REPO_ROOT, relFromRepoRoot));
}

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

  // Track any drift between DB claims and actual chapter files on disk.
  const driftRetro = [];
  const driftLessons = [];

  const body = rows.map(r => {
    const isGhost = r.source_readme.includes('never existed') || r.source_readme.includes('dead link');
    // Ghosts point at /chapter/ since we seed chapter stubs there
    const versionLinkRel = isGhost
      ? `${SOURCE_DIR}/${r.version}/chapter/`
      : `${SOURCE_DIR}/${r.version}/`;
    const versionCell = `[${r.version}](${linkFromHistoryTo(versionLinkRel)})`;

    // Retro cell — link to chapter file if present on disk
    let retroCell = '—';
    if (r.has_retrospective) {
      const retroFile = chapterFileRel(r.version, '03-retrospective.md');
      if (chapterFileExists(r.version, '03-retrospective.md')) {
        retroCell = `[✓](${linkFromHistoryTo(retroFile)})`;
      } else {
        retroCell = '✓ _(no file)_';
        driftRetro.push(r.version);
      }
    }

    // Lessons cell — link to chapter file if present on disk
    let lessonsCell = '—';
    if (r.lesson_count > 0) {
      const label = r.applied_count > 0 ? `${r.applied_count}/${r.lesson_count}` : `${r.lesson_count}`;
      if (chapterFileExists(r.version, '04-lessons.md')) {
        lessonsCell = `[${label}](${linkFromHistoryTo(chapterFileRel(r.version, '04-lessons.md'))})`;
      } else {
        lessonsCell = `${label} _(no file)_`;
        driftLessons.push(r.version);
      }
    }

    const notes = isGhost ? '_no original README, chapter stub only_' : '';
    return `| ${versionCell} | ${esc(r.name) || '—'} | ${r.shipped || '—'} | ${r.phases ?? '—'} | ${r.plans ?? '—'} | ${retroCell} | ${lessonsCell} | ${notes} |`;
  });

  // Surface drift in the summary line so it doesn't hide
  if (driftRetro.length || driftLessons.length) {
    header[5] = header[5] + `\n\n> **Drift detected:** ${driftRetro.length} releases flag a retrospective but have no \`03-retrospective.md\` on disk; ${driftLessons.length} flag lessons without \`04-lessons.md\`. Run \`node tools/release-history/publish.mjs --execute\` to sync, or investigate with \`node tools/release-history/audit.mjs\`.`;
  }

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
