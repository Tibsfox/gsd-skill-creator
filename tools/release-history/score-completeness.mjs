#!/usr/bin/env node
// Score each release README against docs/release-notes/TEMPLATE.md.
// Writes release_history.release_score rows. Idempotent.
//
// Usage:
//   node tools/release-history/score-completeness.mjs            # score all
//   node tools/release-history/score-completeness.mjs v1.49.165  # one release
//   node tools/release-history/score-completeness.mjs --summary  # print distribution
//   node tools/release-history/score-completeness.mjs --rubric=cleanup-mission v1.49.585
//                                                                # force cleanup-mission rubric
//   node tools/release-history/score-completeness.mjs --rubric=auto v1.49.585
//                                                                # auto-detect (default)
//
// Rubrics:
//   degree           — paired-engine prose-style NASA-degree releases (release_type=degree)
//   structured       — feature/milestone/patch (default for non-degree)
//   cleanup-mission  — counter-cadence operational-debt milestones (Lesson #10168 cadence;
//                      v1.49.585 first exemplar). Distinguished by "## Components",
//                      "## Threads closed/opened", "## Forward lessons emitted" markers
//                      and engine-state-unchanged sanity. Auto-detected from README
//                      text when --rubric=auto (default). v1.49.586 T2.3 / Lesson #10175.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

// Build the scored corpus from README.md + any chapter/*.md files.
// Many degrees keep rich retrospective + lessons content in the chapter
// tree; scoring on README alone misses that content. Concatenate with
// separators so section-header regexes still work correctly across the
// boundary.
function buildReleaseCorpus(readmePath, version) {
  let text = readFileSync(readmePath, 'utf8');
  const chapterDir = join(dirname(readmePath), 'chapter');
  if (!existsSync(chapterDir)) return text;
  let chapterNames;
  try {
    chapterNames = readdirSync(chapterDir)
      .filter(n => n.endsWith('.md'))
      .sort();
  } catch {
    return text;
  }
  for (const name of chapterNames) {
    try {
      let chapter = readFileSync(join(chapterDir, name), 'utf8');
      // Demote all headings by one level when concatenating so the
      // chapter's H1 title becomes H2 inside the combined text. This
      // keeps scorer regexes (which look for `## Lessons`, `## Retro`,
      // etc.) working without a separate heading-level dimension.
      chapter = chapter.replace(/^(#{1,5})(\s+)/gm, '#$1$2');
      text += '\n\n<!-- chapter: ' + name + ' -->\n\n' + chapter;
    } catch {}
  }
  return text;
}

// --- dimension graders ---
// Each returns an integer score for its dimension.

// Header block: **Released:** (or **Shipped:**) + at least 3 other bold fields.
// The canonical template puts the colon inside the bold markers:
// `**Released:** YYYY-MM-DD`. Older notes sometimes use `**Released**: …`.
// Accept either form.
function scoreHeaderBlock(text) {
  const hasDate = /\*\*(?:Released|Shipped|Date)(?::\*\*|\*\*:)\s*\d{4}-\d{2}-\d{2}/m.test(text);
  if (!hasDate) return 0;
  // Count all **Field:** (colon-inside) or **Field**: (colon-outside) patterns
  // in the first 40 lines.
  const head = text.split(/\r?\n/).slice(0, 40).join('\n');
  const fields = [...head.matchAll(/^\s*\*\*[A-Z][A-Za-z ]+(?::\*\*|\*\*:)/gm)].length;
  if (fields >= 4) return 10;
  if (fields >= 3) return 7;
  if (fields >= 2) return 4;
  return 2;
}

// Summary section with bolded findings — **SOMETHING** at line start.
// Accepts h2-h4 to support corpus-builder's chapter-demoted `### Summary`.
function scoreSummaryFindings(text) {
  const summary = extractSection(text, /^#{2,4}\s+Summary\b/mi);
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

// Key Features table — pipe-table after a features-equivalent heading.
// Degree-format uses `## Key Features`; milestone-format uses `## Half A`,
// `## Half B`, `## Modules`, `## Deliverables`, `## Substrate`. Any of those
// followed by a pipe-table counts.
function scoreKeyFeatures(text) {
  const headingRe = /^#{2,4}\s+(Key Features|Half A|Half B|Modules|Deliverables|Substrate)\b/mi;
  const section = extractSection(text, headingRe);
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

// Lessons Learned with numbered entries OR bullets (both formats occur).
// When the combined corpus contains multiple Lessons sections (README
// with bullets + chapter with numbered), take the best score across all.
//
// Slicing: section runs to the next heading of the same-or-higher level.
// (Earlier behavior stopped at any subsequent heading, which broke when
// chapter files used h3 sub-headings within the lessons block — common in
// milestone-format releases that group lessons by category.)
function scoreLessons(text) {
  const lines = text.split(/\r?\n/);
  let best = 0;
  for (let i = 0; i < lines.length; i++) {
    const headerMatch = /^(#{2,4})\s+Lessons(?:\s+Learned)?\b/i.exec(lines[i]);
    if (!headerMatch) continue;
    const startLevel = headerMatch[1].length;
    let endIdx = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      const inner = /^(#{1,4})\s/.exec(lines[j]);
      if (inner && inner[1].length <= startLevel) { endIdx = j; break; }
    }
    const section = lines.slice(i + 1, endIdx).join('\n');
    const numbered = [...section.matchAll(/^\s*\d+\.\s+/gm)].length;
    const bulleted = [...section.matchAll(/^\s*[-*]\s+\*\*/gm)].length;
    const count = Math.max(numbered, bulleted);
    let s = 0;
    if (count >= 8) s = 10;
    else if (count >= 5) s = 7;
    else if (count >= 3) s = 4;
    else if (count >= 1) s = 2;
    if (s > best) best = s;
  }
  return best;
}

// Cross-references. Degree-format uses `## Cross-References`; milestone-
// format uses `## Convergent-discovery validation` or `## Cross-cluster
// validation` for the same structural role (named external referents).
function scoreCrossRefs(text) {
  const headingRe = /^#{2,4}\s+(Cross[- ]References|Convergent[- ]discovery|Convergent[- ]Discovery|Cross[- ]cluster)/mi;
  if (!headingRe.test(text)) return 0;
  const section = extractSection(text, headingRe);
  // Pipe-count remains the proxy for "named external referents in a table",
  // but a milestone-format §Convergent-discovery often has prose with
  // multiple bold-prefixed referents instead of a pipe-table. Count both.
  const pipes = (section.match(/\|/g) || []).length;
  const boldReferents = [...section.matchAll(/\*\*[^*\n]+\*\*/g)].length;
  const score = pipes + (boldReferents * 3);
  if (score >= 30) return 10;
  if (score >= 15) return 7;
  if (score >= 5) return 4;
  return 2;
}

// Running ledgers (at least one of the Acoustic Progression / Artist-City
// Patterns / Energy Distribution / Genre Evolution type tables for degree
// releases; By the numbers / Health metrics / Test posture for milestones).
function scoreRunningLedgers(text) {
  const markers = [
    /^#{2,4}\s+Acoustic Progression/mi,
    /^#{2,4}\s+Artist[- ]City Patterns/mi,
    /^#{2,4}\s+Energy Distribution/mi,
    /^#{2,4}\s+Genre Evolution/mi,
    /^#{2,4}\s+Engine Position/mi,
    /^#{2,4}\s+Cumulative.*Statistics/mi,
    /^#{2,4}\s+Taxonomic State/mi,
    // Milestone-format equivalents.
    /^#{2,4}\s+By the numbers/mi,
    /^#{2,4}\s+Health metrics/mi,
    /^#{2,4}\s+Test posture/mi,
    /^#{2,4}\s+By the Numbers/mi,
  ];
  const hits = markers.filter(re => re.test(text)).length;
  if (hits >= 3) return 5;
  if (hits >= 1) return 3;
  return 0;
}

// Infrastructure block. Degree-format uses `## Infrastructure` or `## Files`;
// milestone-format uses `## Branch state` (where the dev/main/tag topology
// lives), `## Dedications` (named contributors), or `## Out of scope`
// (project-discipline boundary).
function scoreInfrastructure(text) {
  const headingRe = /^#{2,4}\s+(Infrastructure|Files|Branch state|Dedications|Out of scope|Out-of-scope discipline)\b/mi;
  if (!headingRe.test(text)) return 0;
  const section = extractSection(text, headingRe);
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

// Auto-detect whether a README looks like a cleanup-mission release.
// Cleanup-mission marker triad: explicit "counter-cadence" or "cleanup"
// in the **Type:** header field OR title; no NASA-mission line in the
// header (no "NASA Mission:", "Degree NN", "**Mission Code:**"); presence
// of an "Engine state: UNCHANGED" or "Components/Gates" structural section.
// Returns true only when at least 2 of 3 signals fire.
export function isCleanupMission(text) {
  const head = text.split(/\r?\n/).slice(0, 30).join('\n');
  let hits = 0;
  // Signal 1: explicit type marker
  if (/\*\*Type:?\*\*:?\s*[^\n]*(counter[- ]cadence|cleanup|operational[- ]debt|foundation[- ]shoring)/i.test(head) ||
      /^#\s+v[\d.]+\s+—\s+[^\n]*(Concerns Cleanup|Foundation Shoring|Operational Debt|Counter[- ]cadence)/im.test(text)) {
    hits++;
  }
  // Signal 2: NO NASA mission code in header (negative signal)
  const hasNasa = /\*\*(Mission Code|NASA Mission|Degree)\b/m.test(head) ||
                  /^#\s+v[\d.]+\s+—\s+(NASA|Degree|Pioneer|Apollo|Surveyor|Lunar Orbiter|Explorer|OAO|Mariner|Voyager)/im.test(text);
  if (!hasNasa) hits++;
  // Signal 3: explicit cleanup structural sections
  if (/^#{2,3}\s+(Forward lessons emitted|Threads (closed|opened|extended)|Components|Gates? (added|installed))\b/im.test(text) ||
      /Engine state:?\*?\*?\s+UNCHANGED/i.test(text)) {
    hits++;
  }
  return hits >= 2;
}

// Cleanup-mission Summary that aggregates ALL Summary-shaped sections in
// the corpus (README's `## Summary` + chapter/00-summary.md's
// `## NN — Summary: …`), summing word counts so chapter-style narratives
// are not penalized for splitting prose between README and chapter file.
function scoreCleanupSummaryFromChapter(text) {
  const lines = text.split(/\r?\n/);
  let totalWords = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!/^#{2}\s+(?:\d{2}\s+—\s+)?Summary\b/i.test(lines[i])) continue;
    let endIdx = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^#{1,2}\s/.test(lines[j])) { endIdx = j; break; }
    }
    const section = lines.slice(i + 1, endIdx).join('\n');
    totalWords += (section.trim().match(/\S+/g) || []).length;
  }
  if (totalWords >= 1500) return 15;
  if (totalWords >= 800) return 10;
  if (totalWords >= 400) return 5;
  if (totalWords >= 150) return 2;
  return 0;
}

// Cleanup-mission Retrospective that matches `## NN — Retrospective`
// (chapter heading). The shared scoreRetrospective requires bare
// `## Retrospective`, which the chapter prefix breaks.
function scoreCleanupRetrospective(text) {
  const hasRetro = /^#{2}\s+(?:\d{2}\s+—\s+)?Retrospective/mi.test(text);
  if (!hasRetro) return 0;
  // Carryover-lessons + new-lessons sub-structure typical of cleanup retros.
  const carryover = /^#{2,4}\s+Carryover lessons (applied|carried)/mi.test(text);
  const newLessons = /^#{2,4}\s+(New lessons|Lessons emitted|What.*ship.*pipeline)/mi.test(text);
  const whatWorked = /^#{2,4}\s+What (Worked|s Working)/mi.test(text);
  const whatBetter = /^#{2,4}\s+(What Could Be Better|What.*(Didn'?t Work|Needs Improvement))/mi.test(text);
  let score = 5;
  if (carryover) score += 5;
  if (newLessons || whatWorked) score += 3;
  if (whatBetter) score += 2;
  return Math.min(score, 15);
}

// Cleanup-mission Lessons matcher — accepts the numbered-chapter heading
// `## NN — Lessons Learned: …` AND counts both numbered + #ID-prefixed
// entries (cleanup releases use `### #10168 — title` style).
function scoreCleanupLessons(text) {
  const lines = text.split(/\r?\n/);
  let best = 0;
  for (let i = 0; i < lines.length; i++) {
    const headerMatch = /^(#{2,4})\s+(?:\d{2}\s+—\s+)?Lessons(?:\s+Learned)?\b/i.exec(lines[i]);
    if (!headerMatch) continue;
    const startLevel = headerMatch[1].length;
    let endIdx = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      const inner = /^(#{1,4})\s/.exec(lines[j]);
      if (inner && inner[1].length <= startLevel) { endIdx = j; break; }
    }
    const section = lines.slice(i + 1, endIdx).join('\n');
    const numbered = [...section.matchAll(/^\s*\d+\.\s+/gm)].length;
    const bulleted = [...section.matchAll(/^\s*[-*]\s+\*\*/gm)].length;
    const hashIds = [...section.matchAll(/^#{2,4}\s+#?1\d{4}\b/gm)].length;
    const count = Math.max(numbered, bulleted, hashIds);
    let s = 0;
    if (count >= 8) s = 12;
    else if (count >= 5) s = 9;
    else if (count >= 3) s = 6;
    else if (count >= 1) s = 3;
    if (s > best) best = s;
  }
  return best;
}

// Cleanup-mission rubric: 8 dimensions × 100 max. Same 10-column schema;
// the two unused columns (part_a_depth, part_b_depth) store 0 and are
// normalized out (raw is out of 100, no rescale needed since cleanup
// rubric is calibrated to 100 directly). Slot mapping:
//   header_block              ← header_block (same)
//   summary_findings          ← summary_findings (relaxed: 1500-word target)
//   key_features_table        ← components_listed (count of ## Components / Gates)
//   part_a_depth              ← 0 (unused)
//   part_b_depth              ← 0 (unused)
//   retrospective_structure   ← retrospective_structure (same)
//   lessons_learned           ← lessons_learned (forward + carry both count)
//   cross_references          ← thread_state_markers (## Threads closed/opened/extended)
//   running_ledgers           ← engine_state_unchanged_marker
//   infrastructure_block      ← forward_lessons_block
function scoreCleanupMission(text) {
  const dimensions = {
    header_block:            scoreHeaderBlock(text),
    summary_findings:        scoreCleanupSummaryFromChapter(text) || scoreCleanupSummary(text),
    key_features_table:      scoreComponentsListed(text),
    part_a_depth:            0,
    part_b_depth:            0,
    retrospective_structure: scoreCleanupRetrospective(text),
    lessons_learned:         scoreCleanupLessons(text),
    cross_references:        scoreThreadStateMarkers(text),
    running_ledgers:         scoreEngineStateUnchanged(text),
    infrastructure_block:    scoreForwardLessonsBlock(text),
  };
  const score = Object.values(dimensions).reduce((s, v) => s + v, 0);
  return { score, grade: gradeOf(score), dimensions };
}

// Cleanup summary: 1500-word target (vs 2000 for NASA prose), relaxed.
function scoreCleanupSummary(text) {
  const summary = extractSection(text, /^#{2}\s+Summary\b/mi);
  if (!summary) return 0;
  const words = (summary.trim().match(/\S+/g) || []).length;
  if (words >= 1500) return 15;
  if (words >= 800) return 10;
  if (words >= 400) return 5;
  if (words >= 150) return 2;
  return 0;
}

// Components/Gates listed — count bold lead-ins or pipe-table rows in
// any section whose header matches the components-equivalent set.
function scoreComponentsListed(text) {
  const headingRe = /^#{2,4}\s+(Components|Gates? (added|installed)|Cross[- ]track|Component matrix)\b/mi;
  const section = extractSection(text, headingRe);
  if (!section) {
    // Fallback: count "C0N" or "T2.N" component-id mentions in the full text;
    // cleanup missions often inline the component list in Summary prose.
    const mentions = [...text.matchAll(/\b(C\d{2}|T\d\.\d)\b/g)].length;
    if (mentions >= 12) return 10;
    if (mentions >= 6) return 6;
    if (mentions >= 3) return 3;
    return 0;
  }
  const tableLines = section.split(/\r?\n/).filter(l => /^\s*\|/.test(l)).length;
  const boldLeads = [...section.matchAll(/^[-*]?\s*\*\*[^*\n]{3,200}\*\*/gm)].length;
  const score = tableLines + boldLeads * 2;
  if (score >= 12) return 12;
  if (score >= 6) return 8;
  if (score >= 3) return 5;
  return 2;
}

// Thread state markers: count distinct "## Threads (closed|opened|extended)"
// entries OR explicit "OPENED:" / "CLOSED:" / "EXTENDED:" / "CARRY-FORWARD:"
// markers in a Threads section.
function scoreThreadStateMarkers(text) {
  const headingRe = /^#{2,3}\s+(Threads (closed|opened|extended|carry[- ]forward)|Thread state|Threads? (closed|opened|extended)( \/ (closed|opened|extended)){0,3})\b/mi;
  const section = extractSection(text, headingRe);
  if (!section) {
    // Fallback: count thread-state markers anywhere in the text.
    const anywhere = [...text.matchAll(/\*\*?(OPENED|CLOSED|EXTENDED|CARRY[- ]FORWARD):/g)].length;
    if (anywhere >= 4) return 7;
    if (anywhere >= 2) return 4;
    if (anywhere >= 1) return 2;
    return 0;
  }
  const markers = [...section.matchAll(/\*\*?(OPENED|CLOSED|EXTENDED|CARRY[- ]FORWARD):/g)].length;
  if (markers >= 5) return 12;
  if (markers >= 3) return 9;
  if (markers >= 1) return 5;
  return 2;
}

// Engine-state-unchanged sanity marker for cleanup missions.
function scoreEngineStateUnchanged(text) {
  if (/Engine state:?\*?\*?\s+UNCHANGED/i.test(text)) return 8;
  if (/Engine (remains?|stays?)\s+at\b/i.test(text)) return 5;
  if (/^\*\*Engine Position:?\*\*/im.test(text)) return 3;
  return 0;
}

// Forward-lessons emitted block: count #NNNNN lesson IDs OR "## Forward
// lessons emitted" sectioned bullets.
function scoreForwardLessonsBlock(text) {
  const headingRe = /^#{2,3}\s+Forward lessons (emitted|absorbed|carried)\b/mi;
  const section = extractSection(text, headingRe);
  if (!section) {
    // Fallback: count #NNNNN lesson refs anywhere
    const refs = [...text.matchAll(/#1\d{4}\b/g)].length;
    if (refs >= 5) return 10;
    if (refs >= 3) return 6;
    if (refs >= 1) return 3;
    return 0;
  }
  const ids = [...section.matchAll(/#1\d{4}\b/g)].length;
  if (ids >= 6) return 12;
  if (ids >= 3) return 8;
  if (ids >= 1) return 4;
  return 2;
}

export function scoreRelease(text, releaseType, options = {}) {
  const rubric = options.rubric || 'auto';

  // Cleanup-mission rubric (explicit or auto-detected). Calibrated to 100
  // directly; the 10-column store keeps part_a/b at 0.
  if (rubric === 'cleanup-mission' ||
      (rubric === 'auto' && releaseType !== 'degree' && isCleanupMission(text))) {
    return scoreCleanupMission(text);
  }

  // Prose rubric for degree-type paired-engine releases. Different
  // scoring dimensions (prose depth + named-entity density + Part A/B
  // sync), but the same 10-column storage schema so release_score
  // stays one table. Columns map by position:
  //   header_block              ← header_block (same)
  //   summary_findings          ← prose_depth (word count tiers)
  //   key_features_table        ← named_entity_density
  //   part_a_depth              ← part_a_depth (same)
  //   part_b_depth              ← part_b_depth (same)
  //   retrospective_structure   ← retrospective_structure (same)
  //   lessons_learned           ← lessons_learned (same, prose-style OK)
  //   cross_references          ← cross_sync (A/B thematic crosslinks)
  //   running_ledgers           ← running_ledgers (same)
  //   infrastructure_block      ← dedication + engine_position marker
  if (releaseType === 'degree') {
    const dimensions = {
      header_block:            scoreHeaderBlock(text),
      summary_findings:        scoreProseDepth(text),
      key_features_table:      scoreNamedEntities(text),
      part_a_depth:            scorePartDepth(text, 'A'),
      part_b_depth:            scorePartDepth(text, 'B'),
      retrospective_structure: scoreRetrospective(text),
      lessons_learned:         scoreLessons(text),
      cross_references:        scoreProseCrossSync(text),
      running_ledgers:         scoreRunningLedgers(text),
      infrastructure_block:    scoreDedicationMarker(text),
    };
    const score = Object.values(dimensions).reduce((s, v) => s + v, 0);
    return { score, grade: gradeOf(score), dimensions };
  }

  // Structured rubric — feature, milestone, patch, unclassified.
  //
  // Non-degree releases rarely use Part A / Part B structure, so the
  // 20 points those dimensions hold are unreachable by design. To
  // avoid auto-penalizing them 20 points, score those dims (they still
  // store in the table for visibility) but normalize the final score
  // to [0, 100] across the 80 points that are actually achievable.
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
  const raw = Object.values(dimensions).reduce((s, v) => s + v, 0);
  // Skip Part A/B for non-degree types: raw is out of 80, scale to 100.
  const score = Math.round(((raw - dimensions.part_a_depth - dimensions.part_b_depth) / 80) * 100);
  return { score, grade: gradeOf(score), dimensions };
}

// --- prose rubric graders ---

// Word count in the Summary section — rewards long-form essays.
function scoreProseDepth(text) {
  const summary = extractSection(text, /^##\s+Summary\b/mi);
  if (!summary) return 0;
  const words = (summary.trim().match(/\S+/g) || []).length;
  if (words >= 2000) return 15;
  if (words >= 1000) return 10;
  if (words >= 500) return 5;
  if (words >= 200) return 2;
  return 0;
}

// Density of capitalized multi-word noun phrases in the Summary —
// a proxy for named entities (people, places, songs, taxa, missions).
function scoreNamedEntities(text) {
  const summary = extractSection(text, /^##\s+Summary\b/mi);
  if (!summary) return 0;
  // Multi-word capitalized sequences: "Gus Grissom", "Lunar Orbiter 3",
  // "Sound of Puget Sound", "Varied Thrush", etc.
  const matches = summary.match(/\b([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[a-z]{1,3}|\d+))+)\b/g) || [];
  const unique = new Set(matches).size;
  if (unique >= 40) return 10;
  if (unique >= 25) return 7;
  if (unique >= 15) return 4;
  if (unique >= 5)  return 2;
  return 0;
}

// Cross-sync: thematic linking between Part A and Part B. Count
// paragraphs where both the Part A subject and Part B subject are
// named together (or a transitional phrase like "and", "while",
// "the same way" connects them). Heuristic: count paragraphs that
// contain both "Part A" / "Part B" themed markers, OR a moderate
// proxy — count mentions of "the same", "both", "each", "mirror"
// as prose-crosslink signals.
function scoreProseCrossSync(text) {
  const summary = extractSection(text, /^##\s+Summary\b/mi);
  if (!summary) return 0;
  const paragraphs = summary.split(/\n\n+/);
  const crossWords = /\b(the same|both sides|each (side|degree)|mirror|synchroniz|at the same time|convergenc|paired|in parallel)\b/i;
  let hits = 0;
  for (const p of paragraphs) {
    if (crossWords.test(p)) hits++;
  }
  if (hits >= 5) return 10;
  if (hits >= 3) return 7;
  if (hits >= 1) return 4;
  return 0;
}

// Dedication + Engine Position markers (Fox Companies degree style)
function scoreDedicationMarker(text) {
  const head = text.split(/\r?\n/).slice(0, 30).join('\n');
  let score = 0;
  if (/^\s*\*\*Dedication:?\*\*:?\s/mi.test(head)) score += 3;
  if (/^\s*\*\*Engine Position:?\*\*:?\s/mi.test(head)) score += 2;
  return score;
}

async function main() {
  const args = process.argv.slice(2);
  const summary = args.includes('--summary');
  const rubricArg = args.find(a => a.startsWith('--rubric='));
  const rubric = rubricArg ? rubricArg.split('=')[1] : 'auto';
  if (!['auto', 'degree', 'structured', 'cleanup-mission'].includes(rubric)) {
    console.error(`[score] invalid --rubric=${rubric}. Valid: auto|degree|structured|cleanup-mission`);
    process.exit(2);
  }
  const explicit = args.find(a => !a.startsWith('--'));

  const cfg = loadConfig();
  const db = await openDb(cfg);

  const { rows: releases } = await db.query(
    explicit
      ? `SELECT version, source_readme, release_type FROM release_history.release WHERE version = $1`
      : `SELECT version, source_readme, release_type FROM release_history.release
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
    const text = buildReleaseCorpus(readmePath, r.version);
    const { score, grade, dimensions } = scoreRelease(text, r.release_type, { rubric });
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

// Only run main() when invoked as a script, not when imported as a module.
import { fileURLToPath as _ftpURL } from 'node:url';
if (process.argv[1] && _ftpURL(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error('[score] fatal:', e.message); console.error(e.stack); process.exit(2); });
}
