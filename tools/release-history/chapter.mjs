#!/usr/bin/env node
// Pass 2 — Chapter generator.
// Reads release_history.* and produces .planning/roadmap/<version>/*.md chapters.
// Each release gets: 00-summary, 99-context, and conditionally 01-features,
// 03-retrospective, 04-lessons. Plus top-level STORY.md and INDEX.md.
//
// Idempotency model (v1.49.585 C04):
//   - DEFAULT: preserve existing chapter files whose first 200 bytes do NOT
//     match the DB-derivable opener template. This protects hand-authored
//     gold-standard release-notes (CONCERNS §5; v1.49.583 incident).
//   - --force-regenerate flag: bypass preservation and overwrite all chapters.
//     Use when backfilling historical milestones (e.g. v1.49.577–580 case).
//   - Conservative bias: when in doubt, PRESERVE. A false-preserve costs
//     nothing (DB regen runs frequently); a false-overwrite costs a hand-
//     authored gold-standard ship.

import { writeFileSync, readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const ctx_cfg = loadConfig();
const ROADMAP_DIR = ctx_cfg.roadmap_dir_abs;
mkdirSync(ROADMAP_DIR, { recursive: true });

// CLI flag parsing: --force-regenerate bypasses idempotent preservation.
const ARGV = process.argv.slice(2);
const FORCE_REGENERATE = ARGV.includes('--force-regenerate');

function esc(s) { return (s || '').replace(/\|/g, '\\|'); }
function fmtDate(d) {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
}
function trimPara(s, max = 400) {
  if (!s) return '';
  const trimmed = s.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

// ---------------------------------------------------------------------------
// Idempotent-write helper (C04 from v1.49.585).
// ---------------------------------------------------------------------------

/**
 * Normalize text for opener-match comparison: collapse whitespace runs to
 * single space, strip leading UTF-8 BOM, trim. Used to compare two openers
 * tolerantly across whitespace formatting differences.
 */
export function normalizeOpener(s) {
  if (!s) return '';
  // Strip UTF-8 BOM if present.
  let t = s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
  return t.replace(/\s+/g, ' ').trim();
}

/**
 * Decide whether the existing chapter file's first 200 bytes match the
 * shape of the generated DB-derivable opener.
 *
 * Heuristic: normalize both, take the first 100 chars, compute a Jaccard-like
 * overlap on whitespace-split tokens. >50% overlap → match (DB-derivable).
 *
 * Conservative direction: when in doubt, return false (mismatch → preserve).
 */
export function openerMatches(existingOpener, generatedOpener) {
  const a = normalizeOpener(existingOpener).slice(0, 200);
  const b = normalizeOpener(generatedOpener).slice(0, 200);
  if (!a || !b) return false;
  if (a === b) return true;

  // Token overlap (Jaccard-like on lowercased words).
  const ta = new Set(a.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  const tb = new Set(b.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return false;
  let intersect = 0;
  for (const t of ta) if (tb.has(t)) intersect++;
  const minSize = Math.min(ta.size, tb.size);
  const overlap = intersect / minSize;
  return overlap > 0.5;
}

/**
 * Write a chapter file, preserving hand-authored content by default.
 *
 * Returns { wrote: boolean, reason: string } so the caller can build a
 * summary report.
 *
 * Decision tree:
 *   1. forceRegenerate=true → write
 *   2. file does not exist → write
 *   3. file <200 bytes (stub) → write
 *   4. opener matches generated (DB-derivable) → write iff content drifted
 *   5. opener does not match (hand-authored) → PRESERVE
 */
export function writeChapterIdempotent(chapterPath, generatedContent, forceRegenerate) {
  if (forceRegenerate) {
    writeFileSync(chapterPath, generatedContent);
    return { wrote: true, reason: 'force-regenerate flag' };
  }

  if (!existsSync(chapterPath)) {
    writeFileSync(chapterPath, generatedContent);
    return { wrote: true, reason: 'file did not exist' };
  }

  let existing;
  try {
    existing = readFileSync(chapterPath, 'utf-8');
  } catch (e) {
    // Unreadable → fall back to write (better than silent skip).
    writeFileSync(chapterPath, generatedContent);
    return { wrote: true, reason: `existing unreadable: ${e.message}` };
  }

  if (existing.length < 200) {
    writeFileSync(chapterPath, generatedContent);
    return { wrote: true, reason: `existing file <200 bytes (stub)` };
  }

  const existingOpener = existing.slice(0, 200);
  const generatedOpener = generatedContent.slice(0, 200);

  if (openerMatches(existingOpener, generatedOpener)) {
    if (existing === generatedContent) {
      return { wrote: false, reason: 'byte-identical to generated' };
    }
    writeFileSync(chapterPath, generatedContent);
    return { wrote: true, reason: 'DB-derivable opener; content drift' };
  }

  // Hand-authored opener detected; preserve.
  return { wrote: false, reason: 'existing opener non-derivable; preserved' };
}

// Per-version write log, populated by writeChapterIdempotent calls in main().
// Surfaced as a summary block at end of run.
const writeLog = [];
function logWrite(version, fileName, result) {
  writeLog.push({ version, fileName, ...result });
}

async function main() {
  const args = process.argv.slice(2);
  const explicit = args.find(a => !a.startsWith('--'));

  const client = await openDb(ctx_cfg);

  // Load all releases in semver order
  const { rows: releases } = await client.query(`
    SELECT version, semver_major, semver_minor, semver_patch, name, shipped_at,
           commits, files_changed, lines_added, lines_removed, branch, tag,
           dedication, phases, plans, source_readme, parse_confidence,
           has_retrospective, retrospective_status
    FROM release_history.release
    ORDER BY semver_major, semver_minor, semver_patch
  `);

  console.error(`[chapter] ${releases.length} releases`);

  // Preload features, retros, lessons by version
  const featuresByVersion = {};
  const retrosByVersion = {};
  const lessonsByVersion = {};

  const { rows: features } = await client.query(`
    SELECT version, position, title, location, summary_md, line_count
    FROM release_history.feature
    ORDER BY version, position
  `);
  for (const f of features) {
    (featuresByVersion[f.version] ??= []).push(f);
  }

  const { rows: retros } = await client.query(`
    SELECT version, kind, body_md
    FROM release_history.retrospective
    ORDER BY version, kind
  `);
  for (const r of retros) {
    (retrosByVersion[r.version] ??= []).push(r);
  }

  const { rows: lessons } = await client.query(`
    SELECT id, first_seen_version, body, long_body_md, status,
           applied_in_version, superseded_by_version,
           classification_source, classification_note, requires_review
    FROM release_history.lesson
    ORDER BY first_seen_version, id
  `);
  for (const l of lessons) {
    (lessonsByVersion[l.first_seen_version] ??= []).push(l);
  }

  const targets = explicit ? releases.filter(r => r.version === explicit) : releases;

  let chapterCount = 0;
  let fileCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    const idx = releases.findIndex(x => x.version === r.version);
    const prev = idx > 0 ? releases[idx - 1] : null;
    const next = idx < releases.length - 1 ? releases[idx + 1] : null;

    const chapterDir = join(ROADMAP_DIR, r.version);
    if (!existsSync(chapterDir)) mkdirSync(chapterDir, { recursive: true });

    // 00-summary.md
    const bridge = prev
      ? `> Following ${prev.version}${prev.name ? ` — _${prev.name}_` : ''}, ${r.version} ${r.name ? `ships as ${r.name}.` : `continues the arc.`}`
      : `> ${r.version} opens the project${r.name ? ` with ${r.name}.` : '.'}`;

    const summary = [
      bridge,
      '',
      `# ${r.version}${r.name ? ` — ${r.name}` : ''}`,
      '',
      r.shipped_at ? `**Shipped:** ${fmtDate(r.shipped_at)}` : '',
      [
        r.commits != null ? `**Commits:** ${r.commits}` : null,
        r.files_changed != null ? `**Files:** ${r.files_changed}` : null,
        (r.lines_added != null || r.lines_removed != null)
          ? `**Lines:** +${r.lines_added || 0} / -${r.lines_removed || 0}`
          : null,
      ].filter(Boolean).join(' | '),
      [
        r.branch ? `**Branch:** ${r.branch}` : null,
        r.tag ? `**Tag:** ${r.tag}` : null,
      ].filter(Boolean).join(' | '),
      r.dedication ? `**Dedicated to:** ${r.dedication}` : '',
      '',
      `_Parse confidence: ${r.parse_confidence.toFixed(2)} — source \`${r.source_readme}\`_`,
      '',
      '## Summary',
      '',
      (featuresByVersion[r.version]?.length
        ? `This release carried ${featuresByVersion[r.version].length} feature${featuresByVersion[r.version].length === 1 ? '' : 's'}; see \`01-features.md\`.`
        : 'No structured feature list was captured for this release; see the source README for prose details.'),
      (retrosByVersion[r.version]?.length
        ? `It also produced retrospective content (${retrosByVersion[r.version].map(x => x.kind).join(', ')}); see \`03-retrospective.md\`.`
        : ''),
      (lessonsByVersion[r.version]?.length
        ? `${lessonsByVersion[r.version].length} lesson${lessonsByVersion[r.version].length === 1 ? '' : 's'} extracted; see \`04-lessons.md\` or the \`RETROSPECTIVE-TRACKER.md\`.`
        : ''),
      '',
      '---',
      '',
      [
        prev ? `**Prev:** [${prev.version}](../${prev.version}/00-summary.md)` : '_(first release)_',
        next ? `**Next:** [${next.version}](../${next.version}/00-summary.md)` : '_(current tip)_',
      ].join(' · '),
      '',
    ].filter(l => l !== '').join('\n').replace(/\n{3,}/g, '\n\n');

    {
      const result = writeChapterIdempotent(join(chapterDir, '00-summary.md'), summary, FORCE_REGENERATE);
      logWrite(r.version, '00-summary.md', result);
      if (result.wrote) fileCount++;
    }

    // 01-features.md
    if (featuresByVersion[r.version]?.length) {
      const feats = featuresByVersion[r.version];
      const lines = [`# Features — ${r.version}`, ''];
      for (const f of feats) {
        lines.push(`## ${f.title}`);
        lines.push('');
        if (f.location) lines.push(`**Location:** \`${f.location}\``);
        lines.push('');
        lines.push(trimPara(f.summary_md, 1500));
        lines.push('');
      }
      const result = writeChapterIdempotent(join(chapterDir, '01-features.md'), lines.join('\n'), FORCE_REGENERATE);
      logWrite(r.version, '01-features.md', result);
      if (result.wrote) fileCount++;
    }

    // 03-retrospective.md
    if (retrosByVersion[r.version]?.length) {
      const rr = retrosByVersion[r.version];
      const lines = [`# Retrospective — ${r.version}`, ''];
      const kindOrder = ['what_worked', 'what_could_be_better', 'decisions', 'surprises', 'lessons_learned'];
      const kindTitles = {
        what_worked: 'What Worked',
        what_could_be_better: 'What Could Be Better',
        decisions: 'Decisions',
        surprises: 'Surprises',
        lessons_learned: 'Lessons Learned',
      };
      for (const k of kindOrder) {
        const row = rr.find(x => x.kind === k);
        if (!row) continue;
        lines.push(`## ${kindTitles[k]}`);
        lines.push('');
        lines.push(row.body_md.trim());
        lines.push('');
      }
      const result = writeChapterIdempotent(join(chapterDir, '03-retrospective.md'), lines.join('\n'), FORCE_REGENERATE);
      logWrite(r.version, '03-retrospective.md', result);
      if (result.wrote) fileCount++;
    }

    // 04-lessons.md
    if (lessonsByVersion[r.version]?.length) {
      const ll = lessonsByVersion[r.version];
      const srcIcon = s => s === 'llm' ? '🤖' : s === 'human' ? '👤' : '⚙';
      const lines = [`# Lessons — ${r.version}`, '', `${ll.length} lesson${ll.length === 1 ? '' : 's'} extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.`, ''];
      for (let j = 0; j < ll.length; j++) {
        const l = ll[j];
        lines.push(`${j + 1}. **${l.body}**`);
        if (l.long_body_md && l.long_body_md !== l.body) {
          lines.push(`   ${trimPara(l.long_body_md, 800)}`);
        }
        const evidence = l.status === 'applied' && l.applied_in_version
          ? ` (applied in \`${l.applied_in_version}\`)`
          : l.status === 'superseded' && l.superseded_by_version
          ? ` (superseded by \`${l.superseded_by_version}\`)`
          : '';
        lines.push(`   _${srcIcon(l.classification_source)} Status: \`${l.status}\`${evidence} · lesson #${l.id}${l.requires_review ? ' · needs review' : ''}_`);
        if (l.classification_source === 'llm' && l.classification_note) {
          lines.push(`   > LLM reasoning: ${l.classification_note}`);
        }
        lines.push('');
      }
      const result = writeChapterIdempotent(join(chapterDir, '04-lessons.md'), lines.join('\n'), FORCE_REGENERATE);
      logWrite(r.version, '04-lessons.md', result);
      if (result.wrote) fileCount++;
    }

    // 99-context.md
    const ctx = [
      `# Context — ${r.version}`,
      '',
      `- **Version:** \`${r.version}\``,
      `- **Shipped:** ${fmtDate(r.shipped_at) || '—'}`,
      `- **Branch:** ${r.branch || '—'}`,
      `- **Tag:** ${r.tag || '—'}`,
      `- **Dedication:** ${r.dedication || '—'}`,
      `- **Phases:** ${r.phases ?? '—'} · **Plans:** ${r.plans ?? '—'}`,
      `- **Parse confidence:** ${r.parse_confidence.toFixed(2)}`,
      `- **Retrospective:** ${r.has_retrospective ? 'present' : r.retrospective_status}`,
      `- **Prev:** ${prev ? `[${prev.version}](../${prev.version}/00-summary.md)` : '—'}`,
      `- **Next:** ${next ? `[${next.version}](../${next.version}/00-summary.md)` : '—'}`,
      '',
      '## Source',
      '',
      `Parsed from: \`${r.source_readme}\``,
      '',
    ].join('\n');
    {
      const result = writeChapterIdempotent(join(chapterDir, '99-context.md'), ctx, FORCE_REGENERATE);
      logWrite(r.version, '99-context.md', result);
      if (result.wrote) fileCount++;
    }

    chapterCount++;
    if ((i + 1) % 100 === 0) console.error(`[chapter] ${i + 1}/${targets.length}`);
  }

  // STORY.md + INDEX.md top-level
  if (!explicit) {
    const storyLines = [
      '# The Story of This Project',
      '',
      'Read this directory like a book. Each subdirectory is a chapter. Each chapter is a release.',
      `The story begins at \`${releases[0].version}\` and continues to \`${releases[releases.length - 1].version}\`.`,
      '',
      `**${releases.length} chapters.** ${releases.filter(r => r.has_retrospective).length} have retrospectives.`,
      'For the structural view, read `INDEX.md`. For the backlog of open lessons, read `RETROSPECTIVE-TRACKER.md`.',
      '',
      '## Chapters',
      '',
    ];
    for (const r of releases) {
      storyLines.push(`- **[${r.version}](${r.version}/00-summary.md)** — ${r.name || '_(unnamed)_'}${r.shipped_at ? ` · ${fmtDate(r.shipped_at)}` : ''}`);
    }
    writeFileSync(join(ROADMAP_DIR, 'STORY.md'), storyLines.join('\n'));

    const indexLines = [
      '# Release History — Chapter Index',
      '',
      `_Generated ${new Date().toISOString().slice(0, 10)} from \`release_history.*\`. Source of truth: Postgres._`,
      '',
      `**${releases.length} releases.** ${releases.filter(r => r.has_retrospective).length} with retrospective. ${Object.keys(lessonsByVersion).length} with extracted lessons.`,
      '',
      '| Version | Name | Shipped | Retro | Lessons | Chapter |',
      '|---------|------|---------|-------|---------|---------|',
    ];
    for (const r of [...releases].reverse()) {
      const retroFlag = r.has_retrospective ? '✓' : '—';
      const lessonCount = lessonsByVersion[r.version]?.length ?? 0;
      indexLines.push(`| \`${r.version}\` | ${esc(r.name) || '—'} | ${fmtDate(r.shipped_at) || '—'} | ${retroFlag} | ${lessonCount || '—'} | [read](${r.version}/00-summary.md) |`);
    }
    writeFileSync(join(ROADMAP_DIR, 'INDEX.md'), indexLines.join('\n'));
  }

  await client.close();

  console.error(`[chapter] done — ${chapterCount} chapters, ${fileCount} files written`);

  // v1.49.585 C04 — emit idempotent-write summary so CI logs reveal preserve/write decisions.
  if (writeLog.length > 0) {
    const wrote = writeLog.filter(e => e.wrote).length;
    const preserved = writeLog.filter(e => !e.wrote).length;
    console.error(`[chapter] idempotent-write summary: ${wrote} wrote, ${preserved} preserved`);
    if (FORCE_REGENERATE) {
      console.error(`[chapter] (--force-regenerate flag was set; all writes were unconditional)`);
    } else if (preserved > 0) {
      // Show preserved-file summary for visibility
      const preservedByReason = {};
      for (const e of writeLog.filter(x => !x.wrote)) {
        preservedByReason[e.reason] = (preservedByReason[e.reason] ?? 0) + 1;
      }
      for (const [reason, count] of Object.entries(preservedByReason)) {
        console.error(`[chapter]   preserved (${count}): ${reason}`);
      }
    }
  }

  console.log(JSON.stringify({ chapters: chapterCount, files: fileCount, idempotent_writes: writeLog.length }, null, 2));
}

main().catch(e => {
  console.error('[chapter] fatal:', e.message);
  console.error(e.stack);
  process.exit(2);
});
