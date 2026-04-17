#!/usr/bin/env node
// Pass 3 — Lesson extractor.
// Reads release_history.retrospective rows (kind=lessons_learned, what_could_be_better)
// and splits each block into individual lesson rows. Inserts with status='investigate'
// as default — classification is a separate step.
//
// Idempotent: natural key = (first_seen_version, sha1(body)). Re-running updates
// long_body_md but preserves manual status overrides.

import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const cfg = loadConfig();
const REPORT_FILE = join(cfg.cache_dir_abs, '_lessons-report.json');
mkdirSync(cfg.cache_dir_abs, { recursive: true });

function sha1(s) {
  return createHash('sha1').update(s).digest('hex');
}

// Split a lessons block into individual lessons.
// Patterns handled (checked in order):
//   A. 1. **Bold phrase.** Rest of paragraph.              ← no separator, bold closes at **
//   B. 1. **Bold phrase** -- explanation.
//   C. - **Bold phrase** — explanation.
//   D. - **Bold phrase**: explanation.
//   E. **Bold phrase** -- explanation.  (unnumbered)
//   F. Fallback: numbered/bulleted items without bold
function splitLessons(body) {
  const lessons = [];
  const lines = body.split(/\r?\n/);

  // Pattern A: **phrase.** rest     (bold ends, then immediate content)
  const boldNoSep = /^\s*(?:\d+\.|-|\*)?\s*\*\*([^*]+?)\*\*\s+(.+?)\s*$/;
  // Pattern B/C/D: **phrase** SEP rest
  const boldWithSep = /^\s*(?:\d+\.|-|\*)?\s*\*\*([^*]+?)\*\*\s*(?:--|—|–|:)\s*(.+?)\s*$/;

  let current = null;
  const pushCurrent = () => {
    if (!current) return;
    // Strip stray leading/trailing ** and separator residue
    current.body = current.body.replace(/^\*+|\*+$/g, '').replace(/\s+/g, ' ').trim();
    current.long_body_md = current.long_body_md
      .replace(/^\*+\s*/, '')            // leading ** residue
      .replace(/\s*\*+$/, '')            // trailing ** residue
      .replace(/^(?:--|—|–|:)\s*/, '')   // stray separator
      .trim();
    lessons.push(current);
  };

  for (const line of lines) {
    // Prefer explicit separator; fall back to bold-only
    const mSep = boldWithSep.exec(line);
    const mNoSep = mSep ? null : boldNoSep.exec(line);
    const m = mSep || mNoSep;
    if (m) {
      pushCurrent();
      current = { body: m[1].trim(), long_body_md: m[2].trim() };
      continue;
    }
    // Continuation line for current lesson
    if (current && line.trim() && !/^\s*#/.test(line)) {
      const stripped = line.trim();
      if (stripped) current.long_body_md += '\n' + stripped;
    }
  }
  pushCurrent();

  // Fallback F: no bold phrases found — try first-sentence split per list item
  if (lessons.length === 0) {
    const looseRe = /^\s*(?:\d+\.|-|\*)\s+(.+?)\s*$/gm;
    let m;
    while ((m = looseRe.exec(body)) !== null) {
      const content = m[1].trim();
      if (content.length < 20) continue;
      // Split at first end-of-sentence punctuation NOT followed by alphanumeric
      // (avoids splitting on "install." when followed by "sh")
      const sentMatch = /^([^.!?]+[.!?])(?=\s|$)\s*(.*)/.exec(content);
      if (sentMatch) {
        lessons.push({
          body: sentMatch[1].slice(0, 200).trim(),
          long_body_md: sentMatch[2] || sentMatch[1],
        });
      } else {
        lessons.push({
          body: content.slice(0, 200),
          long_body_md: content,
        });
      }
    }
  }
  return lessons
    .filter(l => l.body && l.body.length >= 3 && l.body.length <= 300)
    .map(l => ({
      body: l.body.replace(/^["'*]+|["'*]+$/g, '').trim(),
      long_body_md: l.long_body_md.trim(),
    }));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const rebuild = args.includes('--rebuild');

  const client = await openDb(cfg);

  if (rebuild && !dryRun) {
    console.error('[lessons] --rebuild: truncating lesson table');
    await client.truncate('lesson');
  }

  // Pull all lesson-bearing retrospectives
  const { rows: retros } = await client.query(`
    SELECT version, kind, body_md
    FROM release_history.retrospective
    WHERE kind IN ('lessons_learned', 'what_could_be_better')
    ORDER BY (SELECT semver_major FROM release_history.release r WHERE r.version = retrospective.version),
             (SELECT semver_minor FROM release_history.release r WHERE r.version = retrospective.version),
             (SELECT semver_patch FROM release_history.release r WHERE r.version = retrospective.version),
             kind
  `);

  console.error(`[lessons] ${retros.length} retrospective blocks to split`);

  const stats = {
    blocks: retros.length,
    lessons_extracted: 0,
    lessons_inserted: 0,
    lessons_updated: 0,
    by_kind: {},
    per_version: {},
  };

  for (const row of retros) {
    const lessons = splitLessons(row.body_md);
    stats.lessons_extracted += lessons.length;
    stats.by_kind[row.kind] = (stats.by_kind[row.kind] || 0) + lessons.length;
    stats.per_version[row.version] = (stats.per_version[row.version] || 0) + lessons.length;

    if (dryRun) continue;

    for (const l of lessons) {
      // Natural key: (first_seen_version, lowercased body). Simple text comparison
      // preserves manual status overrides on re-run.
      const existing = await client.query(
        `SELECT id, classification_source FROM release_history.lesson
         WHERE first_seen_version = $1 AND lower(body) = lower($2)`,
        [row.version, l.body]
      );

      if (existing.rows.length) {
        // Update long_body_md only; preserve classification
        await client.query(
          `UPDATE release_history.lesson
           SET long_body_md = $1
           WHERE id = $2`,
          [l.long_body_md, existing.rows[0].id]
        );
        stats.lessons_updated++;
      } else {
        await client.query(
          `INSERT INTO release_history.lesson
             (first_seen_version, body, long_body_md, status, classification_source)
           VALUES ($1, $2, $3, 'investigate', 'rule')`,
          [row.version, l.body.slice(0, 500), l.long_body_md]
        );
        stats.lessons_inserted++;
      }
    }
  }

  await client.close();

  writeFileSync(REPORT_FILE, JSON.stringify(stats, null, 2));
  console.error(`[lessons] done — ${stats.lessons_extracted} extracted, ${stats.lessons_inserted} inserted, ${stats.lessons_updated} updated`);
  console.log(JSON.stringify({
    blocks_processed: stats.blocks,
    lessons_extracted: stats.lessons_extracted,
    lessons_inserted: stats.lessons_inserted,
    lessons_updated: stats.lessons_updated,
    by_kind: stats.by_kind,
  }, null, 2));
}

main().catch(e => {
  console.error('[lessons] fatal:', e.message);
  process.exit(2);
});
