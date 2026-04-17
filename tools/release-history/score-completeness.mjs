#!/usr/bin/env node
// Score each release README against docs/release-notes/TEMPLATE.md.
// Writes release_history.release_score rows. Idempotent.
//
// Usage:
//   node tools/release-history/score-completeness.mjs            # score all
//   node tools/release-history/score-completeness.mjs v1.49.165  # one release
//   node tools/release-history/score-completeness.mjs --summary  # print distribution

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

// --- dimension graders ---
// Each returns an integer score for its dimension.

// Header block: **Released:** (or **Shipped:**) + at least 3 other bold fields
function scoreHeaderBlock(text) {
  const hasDate = /\*\*(?:Released|Shipped|Date)\*\*?\s*:\s*\d{4}-\d{2}-\d{2}/m.test(text);
  if (!hasDate) return 0;
  // Count all **Field:** patterns in the first 40 lines
  const head = text.split(/\r?\n/).slice(0, 40).join('\n');
  const fields = [...head.matchAll(/^\s*\*\*[A-Z][A-Za-z ]+\*\*:/gm)].length;
  if (fields >= 4) return 10;
  if (fields >= 3) return 7;
  if (fields >= 2) return 4;
  return 2;
}

// Summary section with bolded findings — **SOMETHING** at line start
function scoreSummaryFindings(text) {
  const summary = extractSection(text, /^##\s+Summary\s*$/mi);
  if (!summary) return 0;
  // Count bolded lead-ins: lines starting with **PHRASE.** or **PHRASE:**
  const findings = [...summary.matchAll(/^\s*\*\*[^*\n]{3,100}(?:\.|:)\*\*/gm)].length;
  if (findings >= 5) return 15;
  if (findings >= 3) return 10;
  if (findings >= 1) return 5;
  // Fallback: any bold anywhere in summary counts partially
  const anyBold = (summary.match(/\*\*[^*\n]+\*\*/g) || []).length;
  return anyBold >= 3 ? 3 : 0;
}

// Key Features table — must be a pipe-table after Key Features heading
function scoreKeyFeatures(text) {
  const section = extractSection(text, /^##\s+Key Features\s*$/mi);
  if (!section) return 0;
  const tableLines = section.split(/\r?\n/).filter(l => /^\s*\|/.test(l)).length;
  if (tableLines >= 5) return 10;
  if (tableLines >= 3) return 6;
  return 2;
}

// Part A / Part B deep sections with bolded sub-themes (one function, returns split score)
function scorePartDepth(text, which) {
  const re = which === 'A'
    ? /^###?\s+Part A[:\s]/m
    : /^###?\s+Part B[:\s]/m;
  const section = extractSection(text, re);
  if (!section) return 0;
  // Count bold lead-in bullets: - **THING** or lines starting with **...**
  const bolded = [...section.matchAll(/^[-*]?\s*\*\*[^*\n]{5,200}\*\*/gm)].length;
  if (bolded >= 8) return 10;
  if (bolded >= 5) return 7;
  if (bolded >= 3) return 5;
  if (bolded >= 1) return 2;
  return 0;
}

// Retrospective with both sub-sections
function scoreRetrospective(text) {
  const hasRetro = /^#{2,4}\s+Retrospective/mi.test(text);
  if (!hasRetro) return 0;
  const worked = /^#{2,4}\s+What (Worked|s Working)/mi.test(text);
  const better = /^#{2,4}\s+What Could Be Better|^#{2,4}\s+What (Didn'?t Work|Needs Improvement)/mi.test(text);
  let score = 5;
  if (worked) score += 5;
  if (better) score += 5;
  return score;
}

// Lessons Learned with numbered entries
function scoreLessons(text) {
  const section = extractSection(text, /^#{2,4}\s+Lessons(?:\s+Learned)?\s*$/mi);
  if (!section) return 0;
  // Numbered: "1. **..." or just "1. ..."
  const numbered = [...section.matchAll(/^\s*\d+\.\s+/gm)].length;
  if (numbered >= 8) return 10;
  if (numbered >= 5) return 7;
  if (numbered >= 3) return 4;
  if (numbered >= 1) return 2;
  return 0;
}

// Cross-references
function scoreCrossRefs(text) {
  if (!/^#{2,4}\s+Cross[- ]References/mi.test(text)) return 0;
  const section = extractSection(text, /^#{2,4}\s+Cross[- ]References/mi);
  const links = (section.match(/\|/g) || []).length;
  if (links >= 30) return 10;
  if (links >= 15) return 7;
  if (links >= 5) return 4;
  return 2;
}

// Running ledgers (at least one of the Acoustic Progression / Artist-City Patterns /
// Energy Distribution / Genre Evolution type tables)
function scoreRunningLedgers(text) {
  const markers = [
    /^#{2,4}\s+Acoustic Progression/mi,
    /^#{2,4}\s+Artist[- ]City Patterns/mi,
    /^#{2,4}\s+Energy Distribution/mi,
    /^#{2,4}\s+Genre Evolution/mi,
    /^#{2,4}\s+Engine Position/mi,
    /^#{2,4}\s+Cumulative.*Statistics/mi,
    /^#{2,4}\s+Taxonomic State/mi,
  ];
  const hits = markers.filter(re => re.test(text)).length;
  if (hits >= 3) return 5;
  if (hits >= 1) return 3;
  return 0;
}

// Infrastructure block
function scoreInfrastructure(text) {
  if (!/^#{2,4}\s+Infrastructure\b/mi.test(text) &&
      !/^#{2,4}\s+Files\b/mi.test(text)) return 0;
  const section = extractSection(text,
    /^#{2,4}\s+(Infrastructure|Files)\b/mi);
  // Count bullets
  const bullets = (section.match(/^\s*[-*]\s/gm) || []).length;
  if (bullets >= 5) return 5;
  if (bullets >= 2) return 3;
  return 1;
}

// Extract a section's body (from header to next same-or-higher heading)
function extractSection(text, headerRe) {
  const lines = text.split(/\r?\n/);
  let startIdx = -1;
  let startLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    if (headerRe.test(lines[i])) {
      startIdx = i;
      const m = /^(#+)/.exec(lines[i]);
      startLevel = m ? m[1].length : 2;
      break;
    }
  }
  if (startIdx < 0) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const m = /^(#+)\s/.exec(lines[i]);
    if (m && m[1].length <= startLevel) { endIdx = i; break; }
  }
  return lines.slice(startIdx + 1, endIdx).join('\n');
}

// --- main ---

function gradeOf(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function scoreRelease(text) {
  const dimensions = {
    header_block:            scoreHeaderBlock(text),
    summary_findings:        scoreSummaryFindings(text),
    key_features_table:      scoreKeyFeatures(text),
    part_a_depth:            scorePartDepth(text, 'A'),
    part_b_depth:            scorePartDepth(text, 'B'),
    retrospective_structure: scoreRetrospective(text),
    lessons_learned:         scoreLessons(text),
    cross_references:        scoreCrossRefs(text),
    running_ledgers:         scoreRunningLedgers(text),
    infrastructure_block:    scoreInfrastructure(text),
  };
  const score = Object.values(dimensions).reduce((s, v) => s + v, 0);
  return { score, grade: gradeOf(score), dimensions };
}

async function main() {
  const args = process.argv.slice(2);
  const summary = args.includes('--summary');
  const explicit = args.find(a => !a.startsWith('--'));

  const cfg = loadConfig();
  const db = await openDb(cfg);

  const { rows: releases } = await db.query(
    explicit
      ? `SELECT version, source_readme FROM release_history.release WHERE version = $1`
      : `SELECT version, source_readme FROM release_history.release
         ORDER BY semver_major, semver_minor, semver_patch`,
    explicit ? [explicit] : []
  );

  if (releases.length === 0) {
    console.error('[score] no releases matched');
    await db.close();
    return;
  }

  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let scored = 0;

  for (const r of releases) {
    const readmePath = join(REPO_ROOT, 'docs', 'release-notes', r.version, 'README.md');
    if (!existsSync(readmePath)) {
      // Ghost — score 0
      await db.query(
        `INSERT INTO release_history.release_score
           (version, score, grade, notes, scored_at)
         VALUES ($1, 0, 'F', 'No README on disk (ghost release)', CURRENT_TIMESTAMP)
         ON CONFLICT (version) DO UPDATE SET score = 0, grade = 'F',
           notes = EXCLUDED.notes, scored_at = CURRENT_TIMESTAMP`,
        [r.version]
      );
      dist.F++;
      scored++;
      continue;
    }
    const text = readFileSync(readmePath, 'utf8');
    const { score, grade, dimensions } = scoreRelease(text);
    dist[grade]++;
    scored++;

    await db.query(
      `INSERT INTO release_history.release_score
         (version, score, grade,
          header_block, summary_findings, key_features_table,
          part_a_depth, part_b_depth,
          retrospective_structure, lessons_learned, cross_references,
          running_ledgers, infrastructure_block,
          scored_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
       ON CONFLICT (version) DO UPDATE SET
         score = EXCLUDED.score,
         grade = EXCLUDED.grade,
         header_block = EXCLUDED.header_block,
         summary_findings = EXCLUDED.summary_findings,
         key_features_table = EXCLUDED.key_features_table,
         part_a_depth = EXCLUDED.part_a_depth,
         part_b_depth = EXCLUDED.part_b_depth,
         retrospective_structure = EXCLUDED.retrospective_structure,
         lessons_learned = EXCLUDED.lessons_learned,
         cross_references = EXCLUDED.cross_references,
         running_ledgers = EXCLUDED.running_ledgers,
         infrastructure_block = EXCLUDED.infrastructure_block,
         scored_at = CURRENT_TIMESTAMP`,
      [r.version, score, grade,
       dimensions.header_block, dimensions.summary_findings, dimensions.key_features_table,
       dimensions.part_a_depth, dimensions.part_b_depth,
       dimensions.retrospective_structure, dimensions.lessons_learned, dimensions.cross_references,
       dimensions.running_ledgers, dimensions.infrastructure_block]
    );

    if (explicit || summary) {
      console.error(`  ${r.version.padEnd(14)} ${grade} ${String(score).padStart(3)} ${JSON.stringify(dimensions)}`);
    }
  }

  await db.close();

  const total = scored;
  const avg = total > 0 ? (dist.A * 95 + dist.B * 85 + dist.C * 75 + dist.D * 65 + dist.F * 45) / total : 0;
  console.error(`[score] ${scored} releases scored`);
  console.error(`  A: ${dist.A} | B: ${dist.B} | C: ${dist.C} | D: ${dist.D} | F: ${dist.F}`);
  console.error(`  average score ≈ ${avg.toFixed(1)}`);
  console.log(JSON.stringify({ scored, distribution: dist, average_score: Math.round(avg) }, null, 2));
}

main().catch(e => { console.error('[score] fatal:', e.message); console.error(e.stack); process.exit(2); });
