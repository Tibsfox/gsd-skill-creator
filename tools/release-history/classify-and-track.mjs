#!/usr/bin/env node
// Pass 3 — Classifier + Tracker writer.
// Rule-based lesson classification: look for keyword matches in later releases'
// feature titles / summaries. Match = 'applied'. No match = 'investigate'.
// Emits .planning/roadmap/RETROSPECTIVE-TRACKER.md.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const ctx_cfg = loadConfig();
mkdirSync(ctx_cfg.roadmap_dir_abs, { recursive: true });

const TRACKER_FILE = join(ctx_cfg.roadmap_dir_abs, 'RETROSPECTIVE-TRACKER.md');

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'was', 'are', 'have',
  'has', 'had', 'not', 'but', 'you', 'all', 'use', 'can', 'too', 'our', 'out',
  'any', 'one', 'two', 'three', 'when', 'what', 'how', 'why', 'where', 'who',
  'some', 'more', 'most', 'less', 'very', 'just', 'like', 'need', 'done',
  'been', 'its', 'their', 'them', 'then', 'than', 'over', 'into', 'onto',
  'off', 'well', 'good', 'bad', 'even', 'only', 'also', 'make', 'made', 'got',
  'get', 'gets', 'should', 'could', 'would', 'will', 'still', 'much', 'lot',
]);

function extractKeywords(text) {
  const words = (text || '').toLowerCase().match(/[a-z][a-z0-9_-]{3,}/g) || [];
  return [...new Set(words.filter(w => !STOPWORDS.has(w) && w.length >= 4))];
}

function compareSemver(a, b) {
  // a, b are objects {major, minor, patch}
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

async function main() {
  const client = await openDb(ctx_cfg);

  console.error('[classify] loading lessons + release timeline...');
  // Only classify rows that haven't been touched by human or LLM — preserve their work
  const { rows: lessons } = await client.query(`
    SELECT l.id, l.first_seen_version, l.body, l.long_body_md, l.status,
           r.semver_major, r.semver_minor, r.semver_patch
    FROM release_history.lesson l
    JOIN release_history.release r ON r.version = l.first_seen_version
    WHERE l.classification_source = 'rule'
    ORDER BY r.semver_major, r.semver_minor, r.semver_patch
  `);

  // Load per-release feature + name index for keyword matching
  const { rows: allReleases } = await client.query(`
    SELECT r.version, r.name, r.semver_major, r.semver_minor, r.semver_patch,
           string_agg(f.title || ' ' || COALESCE(f.summary_md, ''), ' ') AS feature_blob
    FROM release_history.release r
    LEFT JOIN release_history.feature f ON f.version = r.version
    GROUP BY r.version, r.name, r.semver_major, r.semver_minor, r.semver_patch
    ORDER BY r.semver_major, r.semver_minor, r.semver_patch
  `);

  console.error(`[classify] ${lessons.length} lessons, ${allReleases.length} releases`);

  let applied = 0, investigate = 0;

  // Calibrated classifier (v2):
  //   Count a match if EITHER:
  //     (a) ≥2 distinctive-keyword hits (len ≥ 6), OR
  //     (b) ≥3 total keyword hits with at least one distinctive
  //   Search only the next 100 later releases (bounded locality).
  //   Lessons with no distinctive keyword default to investigate.
  const DISTINCTIVE_LEN = 6;
  const MAX_LOOKAHEAD = 100;

  for (const lesson of lessons) {
    const keywords = extractKeywords(lesson.body);
    if (keywords.length < 2) {
      investigate++;
      continue;
    }
    const distinctiveKeywords = keywords.filter(k => k.length >= DISTINCTIVE_LEN);
    if (distinctiveKeywords.length === 0) {
      investigate++;
      continue;
    }
    const laterReleases = allReleases
      .filter(r =>
        compareSemver(
          { major: r.semver_major, minor: r.semver_minor, patch: r.semver_patch },
          { major: lesson.semver_major, minor: lesson.semver_minor, patch: lesson.semver_patch }
        ) > 0
      )
      .slice(0, MAX_LOOKAHEAD);
    let match = null;
    for (const later of laterReleases) {
      const haystack = (later.name + ' ' + (later.feature_blob || '')).toLowerCase();
      const hitKeywords = keywords.filter(kw => haystack.includes(kw));
      const hitDistinctive = hitKeywords.filter(kw => kw.length >= DISTINCTIVE_LEN);
      const qualifies =
        hitDistinctive.length >= 2 ||
        (hitKeywords.length >= 3 && hitDistinctive.length >= 1);
      if (qualifies) {
        match = { version: later.version, matchCount: hitKeywords.length, hits: hitKeywords };
        break;
      }
    }
    if (match) {
      await client.query(
        `UPDATE release_history.lesson
         SET status = 'applied',
             applied_in_version = $1,
             classification_source = 'rule',
             classification_note = $2
         WHERE id = $3`,
        [match.version, `Keyword match (${match.matchCount} hits: ${match.hits.slice(0,5).join(', ')}) in ${match.version}`, lesson.id]
      );
      applied++;
    } else {
      await client.query(
        `UPDATE release_history.lesson
         SET status = 'investigate', classification_source = 'rule'
         WHERE id = $1 AND classification_source = 'rule'`,
        [lesson.id]
      );
      investigate++;
    }
  }

  console.error(`[classify] ${applied} applied, ${investigate} investigate`);

  // --- Emit RETROSPECTIVE-TRACKER.md ---
  const { rows: counts } = await client.query(`
    SELECT status, classification_source, COUNT(*) AS n
    FROM release_history.lesson GROUP BY status, classification_source
  `);
  const total = counts.reduce((s, r) => s + parseInt(r.n, 10), 0);
  const byStatus = {};
  const bySource = { rule: 0, llm: 0, human: 0 };
  for (const r of counts) {
    byStatus[r.status] = (byStatus[r.status] || 0) + parseInt(r.n, 10);
    bySource[r.classification_source] = (bySource[r.classification_source] || 0) + parseInt(r.n, 10);
  }

  const { rows: openItems } = await client.query(`
    SELECT l.id, l.first_seen_version, l.body, l.long_body_md,
           l.classification_source, l.classification_note, l.requires_review
    FROM release_history.lesson l
    JOIN release_history.release r ON r.version = l.first_seen_version
    WHERE l.status = 'investigate'
    ORDER BY r.semver_major, r.semver_minor, r.semver_patch, l.id
    LIMIT 200
  `);

  const { rows: appliedItems } = await client.query(`
    SELECT l.id, l.first_seen_version, l.applied_in_version, l.body,
           l.classification_source, l.classification_note
    FROM release_history.lesson l
    WHERE l.status = 'applied'
    ORDER BY l.applied_in_version DESC NULLS LAST, l.id
    LIMIT 100
  `);

  const { rows: supersededItems } = await client.query(`
    SELECT l.id, l.first_seen_version, l.superseded_by_version, l.body,
           l.classification_source, l.classification_note
    FROM release_history.lesson l
    WHERE l.status = 'superseded'
    ORDER BY l.superseded_by_version DESC NULLS LAST, l.id
  `);

  const { rows: deferredItems } = await client.query(`
    SELECT l.id, l.first_seen_version, l.body,
           l.classification_source, l.classification_note
    FROM release_history.lesson l
    WHERE l.status = 'deferred'
    ORDER BY l.first_seen_version, l.id
  `);

  const { rows: reviewItems } = await client.query(`
    SELECT l.id, l.first_seen_version, l.status, l.applied_in_version,
           l.superseded_by_version, l.body, l.classification_note
    FROM release_history.lesson l
    WHERE l.requires_review = true AND l.classification_source = 'llm'
    ORDER BY l.status, l.id
    LIMIT 200
  `);

  const sourceIcon = s => s === 'llm' ? '🤖' : s === 'human' ? '👤' : '⚙';
  const lines = [];
  lines.push('# Retrospective Tracker');
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString().slice(0, 10)} from \`release_history.lesson\`. Authoritative source: Postgres (\`tibsfox.release_history\`)._`);
  lines.push('');
  lines.push('## Snapshot');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total lessons | ${total} |`);
  lines.push(`| Applied | ${byStatus.applied || 0} |`);
  lines.push(`| Deferred | ${byStatus.deferred || 0} |`);
  lines.push(`| Investigate | ${byStatus.investigate || 0} |`);
  lines.push(`| Superseded | ${byStatus.superseded || 0} |`);
  lines.push('');
  lines.push('## Classification Sources');
  lines.push('');
  lines.push('| Source | Count | Legend |');
  lines.push('|--------|-------|--------|');
  lines.push(`| ⚙ rule | ${bySource.rule} | keyword-match classifier |`);
  lines.push(`| 🤖 llm  | ${bySource.llm}  | Claude tiebreaker, requires review |`);
  lines.push(`| 👤 human | ${bySource.human} | manual override (authoritative) |`);
  lines.push('');

  if (reviewItems.length) {
    lines.push(`## Needs Review — LLM-classified (${reviewItems.length})`);
    lines.push('');
    lines.push('Review these LLM decisions. Flip to `human` after confirming or correcting.');
    lines.push('');
    lines.push('| # | Status | First Seen | Evidence | Lesson | LLM Reasoning |');
    lines.push('|---|--------|------------|----------|--------|---------------|');
    for (const l of reviewItems) {
      const body = (l.body || '').replace(/\|/g, '\\|').slice(0, 90);
      const reason = (l.classification_note || '').replace(/\|/g, '\\|').slice(0, 100);
      const evidence = l.applied_in_version || l.superseded_by_version || '—';
      lines.push(`| ${l.id} | \`${l.status}\` | \`${l.first_seen_version}\` | \`${evidence}\` | ${body} | ${reason} |`);
    }
    lines.push('');
  }

  lines.push(`## Open — Investigate (oldest first, up to 200 of ${byStatus.investigate || 0})`);
  lines.push('');
  lines.push('| # | Src | First Seen | Lesson |');
  lines.push('|---|-----|------------|--------|');
  for (const l of openItems) {
    const body = (l.body || '').replace(/\|/g, '\\|').slice(0, 150);
    lines.push(`| ${l.id} | ${sourceIcon(l.classification_source)} | \`${l.first_seen_version}\` | ${body} |`);
  }
  lines.push('');

  if (deferredItems.length) {
    lines.push(`## Deferred (${deferredItems.length})`);
    lines.push('');
    lines.push('| # | Src | First Seen | Lesson | Note |');
    lines.push('|---|-----|------------|--------|------|');
    for (const l of deferredItems) {
      const body = (l.body || '').replace(/\|/g, '\\|').slice(0, 100);
      const note = (l.classification_note || '').replace(/\|/g, '\\|').slice(0, 100);
      lines.push(`| ${l.id} | ${sourceIcon(l.classification_source)} | \`${l.first_seen_version}\` | ${body} | ${note} |`);
    }
    lines.push('');
  }

  if (supersededItems.length) {
    lines.push(`## Superseded (${supersededItems.length})`);
    lines.push('');
    lines.push('| # | Src | First Seen | Superseded By | Lesson |');
    lines.push('|---|-----|------------|---------------|--------|');
    for (const l of supersededItems) {
      const body = (l.body || '').replace(/\|/g, '\\|').slice(0, 120);
      lines.push(`| ${l.id} | ${sourceIcon(l.classification_source)} | \`${l.first_seen_version}\` | \`${l.superseded_by_version || '—'}\` | ${body} |`);
    }
    lines.push('');
  }

  lines.push(`## Applied — most recent 100 (of ${byStatus.applied || 0})`);
  lines.push('');
  lines.push('| # | Src | First Seen | Applied In | Lesson |');
  lines.push('|---|-----|------------|------------|--------|');
  for (const l of appliedItems) {
    const body = (l.body || '').replace(/\|/g, '\\|').slice(0, 120);
    lines.push(`| ${l.id} | ${sourceIcon(l.classification_source)} | \`${l.first_seen_version}\` | \`${l.applied_in_version || '—'}\` | ${body} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('_Classification pipeline:_');
  lines.push('_⚙ Rule-based = keyword overlap (≥2 distinctive or ≥3 total hits) with a later release within 100 versions._');
  lines.push('_🤖 LLM (`claude -p`) = reasoned classification with `requires_review=true`. Review and promote to 👤 human status to finalize._');
  lines.push('_👤 Human = manual override, preserved through re-runs._');
  lines.push('_See `.planning/missions/release-history-tracking/components/05-retrospective-tracker.md`._');

  writeFileSync(TRACKER_FILE, lines.join('\n'));
  console.error(`[classify] wrote ${TRACKER_FILE}`);

  await client.close();
  console.log(JSON.stringify({
    total, applied: byStatus.applied || 0, investigate: byStatus.investigate || 0,
    deferred: byStatus.deferred || 0, superseded: byStatus.superseded || 0,
    by_source: bySource,
    tracker: TRACKER_FILE.replace(REPO_ROOT + '/', ''),
  }, null, 2));
}

main().catch(e => {
  console.error('[classify] fatal:', e.message);
  process.exit(2);
});
