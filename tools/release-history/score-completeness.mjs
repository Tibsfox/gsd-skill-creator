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
//   node tools/release-history/score-completeness.mjs --rubric=multi-track-trs v1.49.587
//                                                                # force multi-track-trs rubric
//   node tools/release-history/score-completeness.mjs --rubric=auto v1.49.587
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
//   multi-track-trs  — combined three-track-plus-TRS forward-cadence milestones
//                      (v1.49.587 first exemplar). NASA forward-cadence + ship-pipeline +
//                      The Rendered Space (or analogous third track) bundled in one ship.
//                      Distinguished by **Track 1/2/3** bold-prefixes in Summary, structural
//                      firsts table, and Track-3-or-TRS markers. Auto-detected ahead of
//                      cleanup-mission (more specific). v1.49.588 T2.1 / closes Lesson #10175
//                      carryover for three-track-plus-TRS shape.

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
// v585+ chapter-first structure also has chapter/00-summary.md sections like
// `## Structural firsts at v1.49.NNN close` + `## Engine state at v1.49.NNN
// close` + `## Cross-track ... weave` — recognize those as Summary-class.
function scoreSummaryFindings(text) {
  // Try multiple Summary-class headings; take best score across all.
  const summaryHeadings = [
    /^#{2,4}\s+Summary\b/mi,
    /^#{2,4}\s+Structural firsts/mi,
    /^#{2,4}\s+Engine state at v[\d.]+/mi,
    /^#{2,4}\s+Cross-track .* weave/mi,
  ];
  let bestScore = 0;
  let bestSection = null;
  for (const re of summaryHeadings) {
    const section = extractSection(text, re);
    if (!section) continue;
    const findings = [...section.matchAll(/^\s*\*\*[^*\n]{3,100}(?:\.|:)\*\*/gm)].length;
    let s;
    if (findings >= 5) s = 15;
    else if (findings >= 3) s = 10;
    else if (findings >= 1) s = 5;
    else {
      const anyBold = (section.match(/\*\*[^*\n]+\*\*/g) || []).length;
      s = anyBold >= 3 ? 3 : 0;
    }
    if (s > bestScore) { bestScore = s; bestSection = section; }
  }
  return bestScore;
}

// Key Features table — pipe-table after a features-equivalent heading.
// Degree-format uses `## Key Features`; milestone-format uses `## Half A`,
// `## Half B`, `## Modules`, `## Deliverables`, `## Substrate`. v584+
// chapter-first format uses `## What shipped` (README) or `## Cross-track /
// Engine state` or `## Engine state full enumeration` (chapter/99-context).
// Any of those followed by a pipe-table counts.
function scoreKeyFeatures(text) {
  const headingRes = [
    /^#{2,4}\s+(Key Features|Half A|Half B|Modules|Deliverables|Substrate)\b/mi,
    /^#{2,4}\s+What shipped\b/mi,
    /^#{2,4}\s+Cross-track\s*\/?\s*Engine state\b/mi,
    /^#{2,4}\s+Engine state full enumeration\b/mi,
    /^#{2,4}\s+Cross-track structural pair anchor inventory\b/mi,
  ];
  let best = 0;
  for (const re of headingRes) {
    const section = extractSection(text, re);
    if (!section) continue;
    const tableLines = section.split(/\r?\n/).filter(l => /^\s*\|/.test(l)).length;
    let s;
    if (tableLines >= 5) s = 10;
    else if (tableLines >= 3) s = 6;
    else s = 2;
    if (s > best) best = s;
  }
  return best;
}

// Part A / Part B deep sections with bolded sub-themes (one function, returns split score)
// Pre-v584 used `## Part A: <name>` / `## Part B: <name>` for the two halves
// of paired-engine NASA-degree releases. v584+ chapter-first format moved
// equivalent depth to chapter sections like:
//   chapter/99-context.md `## §6.6 register full enumeration`         (Part A equivalent: structural-state depth)
//   chapter/99-context.md `## Cross-track structural pair anchor inventory` (Part B equivalent: cross-track depth)
//   chapter/99-context.md `## Tier 2 inline-Opus build-path provenance`  (Part B equivalent: tooling-arch depth)
//   chapter/00-summary.md `## Cross-track ... weave (six anchor points)`  (Part A or B equivalent)
function scorePartDepth(text, which) {
  const partRes = which === 'A'
    ? [
        /^###?\s+Part A[:\s]/m,
        /^#{2,4}\s+§6\.6 register\b/mi,
        /^#{2,4}\s+Engine state\b/mi,
        /^#{2,4}\s+(MUS )?Domain (register )?state\b/mi,
        /^#{2,4}\s+Carryover lessons applied/mi,
      ]
    : [
        /^###?\s+Part B[:\s]/m,
        /^#{2,4}\s+Cross-track structural pair/mi,
        /^#{2,4}\s+Cross-track .* weave/mi,
        /^#{2,4}\s+Tier \d+ inline-Opus build-path/mi,
        /^#{2,4}\s+Build path: Tier/mi,
        /^#{2,4}\s+New (lessons|observations)/mi,
        /^#{2,4}\s+Forward observations/mi,
      ];
  let best = 0;
  for (const re of partRes) {
    const section = extractSection(text, re);
    if (!section) continue;
    const bolded = [...section.matchAll(/^[-*]?\s*\*\*[^*\n]{5,200}\*\*/gm)].length;
    let s = 0;
    if (bolded >= 8) s = 10;
    else if (bolded >= 5) s = 7;
    else if (bolded >= 3) s = 5;
    else if (bolded >= 1) s = 2;
    if (s > best) best = s;
  }
  return best;
}

// Retrospective with both sub-sections.
// Heading patterns observed in the corpus:
//   Pre-v584 canonical:    `# Retrospective — v1.49.NNN`
//   v584+ version-prefix:  `# v1.49.NNN — Retrospective`
//   v584+ alt:             `# 03 — Retrospective: v1.49.NNN Process`
// After heading-demote-by-one in buildReleaseCorpus all become ## level. The
// regex relaxes from "first word after `## `" to "appears anywhere on the
// heading line" so version-prefixed forms also match. Same relaxation for
// What Worked / What Could Be Better subheadings — modern retros use freeform
// subheadings ("Carryover lessons applied", "New observations", etc.) so a
// presence-of-content fallback awards partial credit when subheadings drift.
function scoreRetrospective(text) {
  const hasRetro = /^#{2,4}\s+.*\bRetrospective\b/mi.test(text);
  if (!hasRetro) return 0;
  const worked = /^#{2,4}\s+.*\bWhat (Worked|s Working)\b/mi.test(text)
    || /^#{2,4}\s+.*\b(Carryover lessons applied|New observations)\b/mi.test(text);
  const better = /^#{2,4}\s+.*\bWhat Could Be Better\b/mi.test(text)
    || /^#{2,4}\s+.*\bWhat (Didn'?t Work|Needs Improvement)\b/mi.test(text)
    || /^#{2,4}\s+.*\b(Trust-budget|Process observation|Surprises|Drift)\b/mi.test(text);
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
    // Match "Lessons" or "Forward Lessons" appearing anywhere in the heading
    // line (not just first word after `## `). Covers:
    //   `## Lessons — v1.49.580` (pre-v584 canonical)
    //   `## v1.49.598 — Forward Lessons Emitted` (v584+ version-prefix)
    //   `## Lessons Learned` (legacy)
    const headerMatch = /^(#{2,4})\s+.*\b(?:Forward\s+)?Lessons(?:\s+Learned|\s+Emitted)?\b/i.exec(lines[i]);
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
// v584+ chapter-first format uses formal-ID lesson cross-references
// (`## #10NNN — Title` blocks in chapter/04-lessons.md with explicit
// `Cross-references:` lines + version-prefixed lesson body referents).
function scoreCrossRefs(text) {
  const headingRes = [
    /^#{2,4}\s+(Cross[- ]References|Convergent[- ]discovery|Convergent[- ]Discovery|Cross[- ]cluster)/mi,
    /^#{2,4}\s+Cross-track structural pair/mi,
    /^#{2,4}\s+Cross-references and parallels/mi,
    /^#{2,4}\s+See also\b/mi,
  ];
  let best = 0;
  for (const re of headingRes) {
    const section = extractSection(text, re);
    if (!section) continue;
    const pipes = (section.match(/\|/g) || []).length;
    const boldReferents = [...section.matchAll(/\*\*[^*\n]+\*\*/g)].length;
    const formalIdRefs = [...section.matchAll(/#10\d{3}\b/g)].length;
    const score = pipes + (boldReferents * 3) + (formalIdRefs * 2);
    let s;
    if (score >= 30) s = 10;
    else if (score >= 15) s = 7;
    else if (score >= 5) s = 4;
    else s = 2;
    if (s > best) best = s;
  }
  // Fallback: count formal-ID lesson cross-references anywhere in the corpus
  // as a partial credit (chapter/04-lessons.md is structured around these
  // and is the modern equivalent of an external-referent table).
  if (best < 4) {
    const totalFormalIds = [...text.matchAll(/#10\d{3}\b/g)].length;
    if (totalFormalIds >= 8) return Math.max(best, 7);
    if (totalFormalIds >= 4) return Math.max(best, 4);
    if (totalFormalIds >= 1) return Math.max(best, 2);
  }
  return best;
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
    // v584+ chapter-first ledger equivalents (broad — any "register state",
    // "Domain state", "series state", "engine state" section counts as a
    // running ledger because they enumerate cross-mission state at the
    // milestone close).
    /^#{2,4}\s+Engine state\b/mi,
    /^#{2,4}\s+§6\.6 register\b/mi,
    /^#{2,4}\s+(MUS )?Domain (register )?state\b/mi,
    /^#{2,4}\s+ELC Domain\b/mi,
    /^#{2,4}\s+SPS series state\b/mi,
    /^#{2,4}\s+TRS M\d+ substrate\b/mi,
    /^#{2,4}\s+Cross-track structural pair anchor/mi,
    /^#{2,4}\s+Cross-track \/?\s*Engine state\b/mi,
    /^#{2,4}\s+Soak observation/mi,
    /^#{2,4}\s+Forward queue\b/mi,
    /^#{2,4}\s+Three-track-plus-TRS cadence/mi,
  ];
  const hits = markers.filter(re => re.test(text)).length;
  if (hits >= 5) return 5;
  if (hits >= 3) return 4;
  if (hits >= 1) return 3;
  return 0;
}

// Infrastructure block. Degree-format uses `## Infrastructure` or `## Files`;
// milestone-format uses `## Branch state` (where the dev/main/tag topology
// lives), `## Dedications` (named contributors), or `## Out of scope`
// (project-discipline boundary). v584+ chapter-first format uses chapter/
// 99-context.md sections like `## Tier 2 inline-Opus build-path provenance`
// (build-path/tooling-arch infra) or `## Cadence` (release cadence infra)
// or `## See also` (cross-doc infra references).
function scoreInfrastructure(text) {
  const headingRes = [
    /^#{2,4}\s+(Infrastructure|Files|Branch state|Dedications|Out of scope|Out-of-scope discipline)\b/mi,
    /^#{2,4}\s+Tier \d+ inline-Opus build-path/mi,
    /^#{2,4}\s+Build path: Tier/mi,
    /^#{2,4}\s+Build artifacts shipped/mi,
    /^#{2,4}\s+Operational gates\b/mi,
    /^#{2,4}\s+Mid-build recoveries\b/mi,
    /^#{2,4}\s+Cadence\b/mi,
    /^#{2,4}\s+See also\b/mi,
    /^#{2,4}\s+Pipeline closure/mi,
    /^#{2,4}\s+File inventory\b/mi,
    /^#{2,4}\s+Cross-mission .* references\b/mi,
    /^#{2,4}\s+Next milestone scope\b/mi,
  ];
  let best = 0;
  for (const re of headingRes) {
    const section = extractSection(text, re);
    if (!section) continue;
    const bullets = (section.match(/^\s*[-*]\s/gm) || []).length;
    let s;
    if (bullets >= 5) s = 5;
    else if (bullets >= 2) s = 3;
    else s = 1;
    if (s > best) best = s;
  }
  return best;
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
// the corpus (README's `## Summary` / `## Cross-track summary` + the
// chapter/00-summary.md `## NN — Summary` / `## v1.49.NNN — Summary`
// post-demotion form), summing word counts so chapter-style narratives
// are not penalized for splitting prose between README and chapter file.
//
// v1.49.589 T2.1 (closes Lesson #10190 candidate): accepts BOTH the
// numbered-prefix chapter form (`## NN — Summary`) AND the
// version-prefix degree-style form (`## v1.NN.NNN — Summary`) AND the
// README's hyphenated forms (`## Cross-track summary`). All three
// communicate "this section is a Summary" with equal structural
// intent; the scorer should not reward one stylistic choice.
function scoreCleanupSummaryFromChapter(text) {
  const lines = text.split(/\r?\n/);
  let totalWords = 0;
  // Match: ## Summary | ## NN — Summary | ## v1.NN.NNN — Summary | ## Cross-track summary
  const summaryHeadingRe = /^#{2}\s+(?:(?:\d{2}|v\d+\.\d+\.\d+)\s+—\s+)?(?:Cross[- ]track\s+|Forward\s+|Engine\s+|Multi[- ]track\s+)?Summary\b/i;
  for (let i = 0; i < lines.length; i++) {
    if (!summaryHeadingRe.test(lines[i])) continue;
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
// (chapter heading; cleanup-mission style) AND `## v1.NN.NNN — Retrospective`
// (degree style; v1.49.589 T2.1 loosening). The shared scoreRetrospective
// requires bare `## Retrospective`, which both chapter prefix forms break.
function scoreCleanupRetrospective(text) {
  const hasRetro = /^#{2}\s+(?:(?:\d{2}|v\d+\.\d+\.\d+)\s+—\s+)?Retrospective/mi.test(text);
  if (!hasRetro) return 0;
  // Carryover-lessons + new-lessons sub-structure typical of cleanup retros.
  const carryover = /^#{2,4}\s+Carryover lessons (applied|carried)/mi.test(text);
  const newLessons = /^#{2,4}\s+(New lessons|Lessons emitted|What.*ship.*pipeline)/mi.test(text);
  const whatWorked = /^#{2,4}\s+What (Worked|s Working)/mi.test(text);
  const whatBetter = /^#{2,4}\s+(What Could Be Better|What.*(Didn'?t Work|Needs Improvement))/mi.test(text);
  const surprises = /^#{2,4}\s+Surprises\b/mi.test(text);
  let score = 5;
  if (carryover) score += 5;
  if (newLessons || whatWorked) score += 3;
  if (whatBetter) score += 2;
  if (surprises) score += 1;
  return Math.min(score, 15);
}

// Cleanup-mission Lessons matcher — accepts:
//   - numbered-chapter heading `## NN — Lessons Learned: …` (cleanup style)
//   - degree-style version-prefix `## v1.NN.NNN — Forward Lessons` (T2.1)
//   - bare `## Lessons` / `## Forward Lessons` / `## Lessons Learned`
// Counts numbered + bulleted + #ID-prefixed entries (cleanup releases use
// `### #10168 — title` style; degree releases use `## #10183 — title`).
function scoreCleanupLessons(text) {
  const lines = text.split(/\r?\n/);
  let best = 0;
  // Match: ## Lessons | ## NN — Lessons | ## v1.NN.NNN — Lessons | ## Forward Lessons | ## Lessons Learned
  const lessonsHeaderRe = /^(#{2,4})\s+(?:(?:\d{2}|v\d+\.\d+\.\d+)\s+—\s+)?(?:Forward\s+)?Lessons(?:\s+Learned)?\b/i;
  for (let i = 0; i < lines.length; i++) {
    const headerMatch = lessonsHeaderRe.exec(lines[i]);
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

// ---- multi-track-plus-TRS rubric (v1.49.587 first exemplar) ----
//
// Auto-detect whether a README looks like a three-track-plus-TRS milestone.
// Signal triad: explicit "three-track" / "multi-track" / "TRS" / "Track 3" /
// "The Rendered Space" in the **Type:** header field; body contains all three
// of Track 1, Track 2, and Track 3 (or TRS-equivalent third-track marker)
// in EITHER bold-form (**Track N**) OR heading-form (## Track N / ### Track N);
// presence of ## Structural firsts section. Returns true when ≥2 of 3 signals
// fire. Runs ahead of isCleanupMission in the dispatch (more specific).
//
// v1.49.589 T2.1 (closes Lesson #10190 candidate): loosened Signal 2 to accept
// heading-form Track markers since some README authors use ## Track N headings
// rather than **Track N** bolds; the scorer should not reward one stylistic
// choice over the other when both communicate the same structural intent.
export function isMultiTrackTrs(text) {
  const head = text.split(/\r?\n/).slice(0, 30).join('\n');
  let hits = 0;
  // Signal 1: explicit type marker
  if (/\*\*Type:?\*\*:?\s*[^\n]*(three[- ]track|multi[- ]track|TRS|Track\s*3|The Rendered Space)/i.test(head)) {
    hits++;
  }
  // Signal 2: body mentions Track 1 + Track 2 + (Track 3 OR TRS OR The Rendered Space)
  // accepting EITHER bold-form (**Track N**) OR heading-form (^## Track N / ^### Track N)
  const hasTrack1 = /\*\*Track\s+1\b|^#{2,4}\s+Track\s+1\b/m.test(text);
  const hasTrack2 = /\*\*Track\s+2\b|^#{2,4}\s+Track\s+2\b/m.test(text);
  const hasTrack3OrTrs = /\*\*Track\s+3\b|^#{2,4}\s+Track\s+3\b|\bTRS\b|The Rendered Space\b/m.test(text);
  if (hasTrack1 && hasTrack2 && hasTrack3OrTrs) hits++;
  // Signal 3: explicit structural-firsts or three-track sectional marker
  if (/^#{2,4}\s+(Structural firsts|Three[- ]track|Multi[- ]track)\b/im.test(text)) hits++;
  return hits >= 2;
}

// Multi-track-plus-TRS Summary aggregator. Same chapter-aware approach as
// scoreCleanupSummaryFromChapter but ALSO counts Track N markers in EITHER
// bold-form (**Track N**) OR heading-form (^## Track N / ^### Track N) to
// qualify the score against multi-track-shape expectation. Three or more
// tracks with ≥1500 words = max; bare track count without prose = floor.
//
// v1.49.589 T2.1 (closes Lesson #10190 candidate): heading-form acceptance
// matches the isMultiTrackTrs detector loosening.
function scoreMultiTrackSummary(text) {
  const lines = text.split(/\r?\n/);
  let totalWords = 0;
  let trackHits = 0;
  // Match: ## Summary | ## NN — Summary | ## v1.NN.NNN — Summary | ## Cross-track summary | ## Forward summary | etc.
  const summaryHeadingRe = /^#{2}\s+(?:(?:\d{2}|v\d+\.\d+\.\d+)\s+—\s+)?(?:Cross[- ]track\s+|Forward\s+|Engine\s+|Multi[- ]track\s+)?Summary\b/i;
  for (let i = 0; i < lines.length; i++) {
    if (!summaryHeadingRe.test(lines[i])) continue;
    let endIdx = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^#{1,2}\s/.test(lines[j])) { endIdx = j; break; }
    }
    const section = lines.slice(i + 1, endIdx).join('\n');
    totalWords += (section.trim().match(/\S+/g) || []).length;
    trackHits += [...section.matchAll(/\*\*Track\s+\d+/gi)].length;
    trackHits += [...section.matchAll(/^#{2,4}\s+Track\s+\d+/gim)].length;
  }
  if (trackHits >= 3 && totalWords >= 1500) return 15;
  if (trackHits >= 3 && totalWords >= 800)  return 12;
  if (trackHits >= 2 && totalWords >= 800)  return 10;
  if (trackHits >= 2 && totalWords >= 400)  return 7;
  if (totalWords >= 400) return 4;
  if (totalWords >= 150) return 2;
  return 0;
}

// Tracks-listed dimension. Combines distinct Track-N count (accepting BOTH
// bold-form AND heading-form markers) with structural-firsts bullet density
// in the chapter summary. Three tracks AND ≥10 structural-firsts bullets = max.
//
// v1.49.589 T2.1 (closes Lesson #10190 candidate): heading-form acceptance.
function scoreTracksListed(text) {
  const trackIds = new Set();
  for (const m of text.matchAll(/\*\*Track\s+(\d+)\b/gi)) trackIds.add(m[1]);
  for (const m of text.matchAll(/^#{2,4}\s+Track\s+(\d+)\b/gim)) trackIds.add(m[1]);
  const trackCount = trackIds.size;
  const sfSection = extractSection(text, /^#{2,4}\s+Structural firsts\b/mi);
  const sfBullets = sfSection ? (sfSection.match(/^\s*[-*]\s+\*\*[^*\n]+\.\*\*/gm) || []).length : 0;
  if (trackCount >= 3 && sfBullets >= 10) return 10;
  if (trackCount >= 3 && sfBullets >= 5)  return 8;
  if (trackCount >= 3) return 6;
  if (trackCount >= 2 && sfBullets >= 5)  return 5;
  if (trackCount >= 2) return 3;
  if (trackCount >= 1) return 1;
  return 0;
}

// Engine-state markers dimension. Looks for engine-state section
// (## Cross-track / Engine state, ## Engine state at close, ## Engine state)
// and counts engine-state metric markers within it (degree NN/360, §6.6
// register, Pass-N, CHAIN-CONVENTIONS, simulation.js block, MUS Pass-, ELC
// Pass-, forward-cadence count). Bullets and pipe-table rows in the section
// also contribute. Falls back to anywhere-in-text if no section found.
function scoreEngineStateMarkers(text) {
  const headingRe = /^#{2,4}\s+(Cross[- ]track\s*\/\s*Engine state|Engine state at close|Cross[- ]track|Engine state\b)/mi;
  const section = extractSection(text, headingRe);
  const markerRegexes = [
    /\bdegree\s+\d+\s*\/\s*360\b/i,
    /§6\.6\s+register/i,
    /\bPass-\d+/,
    /CHAIN-CONVENTIONS\s+v[\d.]+/i,
    /simulation\.js\s+block/i,
    /forward[- ]cadence count/i,
    /MUS Pass-/,
    /ELC Pass-/,
    /three[- ]track-?plus-?TRS/i,
  ];
  if (!section) {
    const hits = markerRegexes.filter(re => re.test(text)).length;
    if (hits >= 5) return 7;
    if (hits >= 3) return 4;
    if (hits >= 1) return 2;
    return 0;
  }
  const hits = markerRegexes.filter(re => re.test(section)).length;
  const bullets = (section.match(/^\s*[-*]\s/gm) || []).length;
  const pipes   = (section.match(/^\s*\|/gm) || []).length;
  const score = hits * 2 + Math.min(bullets, 5) + Math.min(pipes, 5);
  if (score >= 18) return 10;
  if (score >= 12) return 7;
  if (score >= 6)  return 4;
  if (score >= 2)  return 2;
  return 0;
}

// Multi-track-plus-TRS rubric: 8 dimensions × 100 max. Same 10-column schema
// as cleanup-mission; part_a/b stay 0 (unused). Slot mapping:
//   header_block              ← header_block (same; 10 max)
//   summary_findings          ← multi_track_summary (3 tracks + words; 15 max)
//   key_features_table        ← tracks_listed + structural-firsts (10 max)
//   part_a_depth              ← 0 (unused)
//   part_b_depth              ← 0 (unused)
//   retrospective_structure   ← cleanup-style retro (carryover + worked + better; 15 max)
//   lessons_learned           ← cleanup-style lessons (numbered/bulleted/hashId; 15 max)
//   cross_references          ← thread_state_markers (OPENED/CLOSED/EXTENDED/CARRY-FORWARD; 12 max)
//   running_ledgers           ← engine_state_markers (degree + register + Pass + ledger; 10 max)
//   infrastructure_block      ← forward_lessons_block (#NNNNN refs + Forward Lessons section; 13 max)
function scoreMultiTrackTrs(text) {
  const dimensions = {
    header_block:            scoreHeaderBlock(text),
    summary_findings:        scoreMultiTrackSummary(text),
    key_features_table:      scoreTracksListed(text),
    part_a_depth:            0,
    part_b_depth:            0,
    retrospective_structure: scoreCleanupRetrospective(text),
    lessons_learned:         scoreCleanupLessons(text),
    cross_references:        scoreThreadStateMarkers(text),
    running_ledgers:         scoreEngineStateMarkers(text),
    infrastructure_block:    scoreForwardLessonsBlock(text),
  };
  const score = Object.values(dimensions).reduce((s, v) => s + v, 0);
  return { score, grade: gradeOf(score), dimensions };
}

// Forward-lessons emitted block: count #NNNNN lesson IDs OR "## Forward
// lessons emitted" sectioned bullets. Accepts BOTH explicit enumeration
// (#10183 #10184 #10185 #10186) AND shorthand range form (#10183-#10186 OR
// #10183–#10186 with en-dash); range form expands to (end - start + 1).
//
// v1.49.589 T2.1 (closes Lesson #10190 candidate): range-form expansion
// matches the isMultiTrackTrs detector loosening. Ranges must span ≤20
// (anti-fraud — prevents claiming hundreds of lessons via #10000-#10999).
function countLessonRefs(text) {
  // Detect range form: #NNNNN-#NNNNN or #NNNNN–#NNNNN
  let count = 0;
  const consumed = new Set();
  for (const m of text.matchAll(/#(1\d{4})\s*[-–]\s*#(1\d{4})/g)) {
    const start = parseInt(m[1], 10);
    const end = parseInt(m[2], 10);
    if (end >= start && (end - start) <= 20) {
      count += (end - start + 1);
      consumed.add(m[1]);
      consumed.add(m[2]);
    }
  }
  // Add singletons (excluding range endpoints already counted)
  for (const m of text.matchAll(/#(1\d{4})\b/g)) {
    if (!consumed.has(m[1])) count++;
  }
  return count;
}

function scoreForwardLessonsBlock(text) {
  const headingRe = /^#{2,3}\s+Forward lessons (emitted|absorbed|carried)\b/mi;
  const section = extractSection(text, headingRe);
  if (!section) {
    // Fallback: count #NNNNN lesson refs (incl. range form) anywhere
    const refs = countLessonRefs(text);
    if (refs >= 5) return 10;
    if (refs >= 3) return 6;
    if (refs >= 1) return 3;
    return 0;
  }
  const ids = countLessonRefs(section);
  if (ids >= 6) return 12;
  if (ids >= 3) return 8;
  if (ids >= 1) return 4;
  return 2;
}

// Auto-detect engine-cadence shape: 5-track NASA-degree-advancing milestones
// with explicit `**NASA Mission:**` header field + `**Engine state:** ADVANCED`
// + multiple NEW LOCKED substrate primitives. v604+ run.
//
// Three-of-N detection: each signal independently insufficient, two-of-N
// confirms shape. Runs ahead of multi-track-trs because engine-cadence is
// the more specific shape (engine-cadence releases are a subset of
// 5-track-NASA shape but with stricter substrate-primitive structure).
export function isEngineCadence(text) {
  const head = text.split(/\r?\n/).slice(0, 30).join('\n');
  let hits = 0;
  // Signal 1: explicit NASA Mission header field (any).
  if (/\*\*NASA Mission:\*\*/i.test(head)) hits++;
  // Signal 2: explicit Type=Engine-cadence marker.
  if (/\*\*Type:\*\*\s*[^\n]*Engine[- ]cadence/i.test(head)) hits++;
  // Signal 3: NEW LOCKED density in entire corpus (3+).
  const newLockedCount = (text.match(/\bNEW\s+LOCKED\b/g) || []).length;
  if (newLockedCount >= 3) hits++;
  // Signal 4: 5-track Engine state advances bullets — all 5 present.
  const hasNasaBullet = /^- \*\*NASA degree:\*\*/m.test(text);
  const hasMusBullet  = /^- \*\*MUS degree:\*\*/m.test(text);
  const hasElcBullet  = /^- \*\*ELC degree:\*\*/m.test(text);
  const hasSpsBullet  = /^- \*\*SPS species:\*\*/m.test(text);
  const hasTrsBullet  = /^- \*\*TRS\b/m.test(text);
  if (hasNasaBullet && hasMusBullet && hasElcBullet && hasSpsBullet && hasTrsBullet) hits++;
  // Signal 5: 5-track convergence narrative anywhere.
  if (/\b5[- ]track\s+(NASA|substrate|convergence)/i.test(text)) hits++;
  // Signal 6: explicit Phases:** 6 (W0-W5 wave-pipeline) marker.
  if (/\*\*Phases:\*\*\s*6\s*\(W0-W5/i.test(head)) hits++;
  return hits >= 3;
}

// Engine-cadence rubric: same 10 dimensions as the default rubric but
// scoring is calibrated to recognize the chapter-content-rich nature of
// engine-cadence releases. Part A/B dimensions are awarded based on the
// chapter/03 "Carryover lessons applied" / "New observations" sections
// (Part A equivalent) and chapter/99 "Cross-track structural pair anchor
// inventory" / "Engine state at close" sections (Part B equivalent), and
// the final score does NOT subtract them (unlike the default rubric which
// treats them as unreachable for non-degree types).
function scoreEngineCadence(text) {
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
  // Direct sum out of 100; no A/B subtraction. Both dimensions are
  // achievable for engine-cadence shape via chapter content.
  const score = Object.values(dimensions).reduce((s, v) => s + v, 0);
  return { score, grade: gradeOf(score), dimensions };
}

export function scoreRelease(text, releaseType, options = {}) {
  const rubric = options.rubric || 'auto';

  // Engine-cadence rubric — runs ahead of multi-track-trs because
  // engine-cadence is more specific (5-track + chapter-content-rich + W-wave
  // pipeline). v604+ engine-cadence run shape; auto-detected via NASA
  // Mission + Engine state ADVANCED + Type marker + NEW LOCKED density.
  if (rubric === 'engine-cadence' ||
      (rubric === 'auto' && isEngineCadence(text))) {
    return scoreEngineCadence(text);
  }

  // Multi-track-plus-TRS rubric (explicit or auto-detected). Runs ahead of
  // cleanup-mission because three-track-plus-TRS milestones are typically
  // NASA-degree advances (release_type=degree) — the cleanup-mission branch
  // explicitly skips degree-type. Multi-track-trs applies regardless of
  // release_type so v1.49.587-shaped degrees get the right rubric.
  if (rubric === 'multi-track-trs' ||
      (rubric === 'auto' && isMultiTrackTrs(text))) {
    return scoreMultiTrackTrs(text);
  }

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
  if (!['auto', 'degree', 'structured', 'cleanup-mission', 'multi-track-trs'].includes(rubric)) {
    console.error(`[score] invalid --rubric=${rubric}. Valid: auto|degree|structured|cleanup-mission|multi-track-trs`);
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
