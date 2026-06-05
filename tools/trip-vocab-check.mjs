#!/usr/bin/env node
/**
 * trip-vocab-check.mjs — deterministic content-filter trip-vocab budget check.
 *
 * Closes GAP-7 ("Content Filter Vulnerability", the last open architecture gap;
 * PROJECT.md GAP table / AUDIT-2026-06-03). Ship 5.3 (v1.49.983). The NASA
 * sub-agent dispatch trip-vocab pattern (Lessons #10401/#10402/#10403/#10407)
 * is direct evidence: the surface vocabulary of a brief or dispatch prompt
 * predicts whether a build sub-agent ships or trips the Anthropic content-filter
 * classifier mid-flight. Until this ship the only artifact was a MANUAL `grep`
 * checklist in docs/MISSION-PACKAGE-DISCIPLINE.md §3.3 — an un-gated runnable
 * surface (#10461). This tool automates the §3 discipline as a DETERMINISTIC
 * check (pure regex counting + integer comparison — no LLM, no network), so
 * identical input always yields an identical verdict.
 *
 * ## What it counts (canonical per MISSION-PACKAGE-DISCIPLINE.md §3)
 *
 *   - PRIMARY class  — the title-line "hard budget = 0" tokens (§3.1). Any
 *     occurrence in a title line elevates trip risk to near-certain.
 *   - SECONDARY class — the body "density" tokens (§3.1). High aggregate count
 *     across classes trips the filter even when the title line is clean
 *     (v707 Artemis I: 16 across 6 classes, title-line 0 → tripped twice).
 *
 * The token lists are encoded in code, NOT re-listed in this tool's user-facing
 * output, per Lesson #10462 ("describe, don't quote" — enumerated trip-vocab
 * self-replicates into generated pages). Output prints class TOTALS and the
 * number of distinct classes matched, never the matched tokens themselves.
 *
 * ## Modes
 *
 *   --mode brief  (default) — split input into a TITLE LINE (first markdown H1,
 *                  else first non-blank line) and the FULL body. Verdict:
 *                  title-line PRIMARY > 0  OR  body SECONDARY > --secondary-max.
 *                  Implements §3.1 (title-line hard) + §3.3 (body density).
 *   --mode prompt — no title line; the whole text is the dispatch prompt
 *                  (#10407: the density budget applies to the PROMPT too, not
 *                  just the brief). Verdict: PRIMARY anywhere > 0  OR
 *                  SECONDARY > --secondary-max. A dispatch prompt should carry
 *                  zero primary trip-vocab and bounded secondary density.
 *   --mode page   — scan a generated HTML page; the TITLE LINE is the page's
 *                  first <h1> (else <title>), the body is the tag-stripped text.
 *                  Same verdict rule as brief. NOTE: a page mode scan is a
 *                  POST-HOC proxy (the page already generated successfully);
 *                  primary tokens like "impact" are intrinsic to many
 *                  legitimate missions, so page mode deliberately gates only the
 *                  H1 title-line for PRIMARY, not the whole body.
 *
 * ## CLI
 *   node tools/trip-vocab-check.mjs <path> [--mode brief|prompt|page]
 *   node tools/trip-vocab-check.mjs --stdin --mode prompt
 *   node tools/trip-vocab-check.mjs <path> --secondary-max 10   # §3.3 advisory
 *   node tools/trip-vocab-check.mjs <path> --json
 *
 * Default --secondary-max is 5 (the #10402 STRICT operational rule "secondary
 * > 5 → select Path B preemptively"); pass --secondary-max 10 for the §3.3
 * advisory threshold.
 *
 * ## Exit codes
 *   0  PASS       — within budget (title-line primary 0 AND secondary ≤ max)
 *   1  TRIP-RISK  — over budget (actionable: re-author the title / reduce
 *                   secondary density / select Path B hand-author)
 *   2  FATAL      — usage error / unreadable input
 */

import { readFileSync } from 'node:fs';

// ── Canonical token classes (MISSION-PACKAGE-DISCIPLINE.md §3.1) ────────────
// PRIMARY: title-line hard-budget tokens. SECONDARY: body-density tokens.
// Matched case-insensitively as substrings (a deliberate strengthening of the
// §3.3 manual greps, which are case-sensitive: the content-filter does not care
// about case, so e.g. "Impact" in a title must still count).
const PRIMARY_TOKENS = [
  'deferr', 'trip', 'content-filter', 'impact',
  'terminal-event', 'crash', 'destruct', 'kinetic',
];
const SECONDARY_TOKENS = [
  'hurricane', 'scrub', 'leak', 'did not establish',
  'communications not established', 'ablat',
];

const DEFAULT_SECONDARY_MAX = 5;
const VALID_MODES = ['brief', 'prompt', 'page'];

function fail(msg) {
  console.error(`[trip-vocab-check] FATAL: ${msg}`);
  process.exit(2);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Count token occurrences (case-insensitive, substring) per class and total.
 * Returns { total, classes } where `classes` is the count of DISTINCT classes
 * with ≥1 match (the "N across K classes" metric), never the token strings.
 */
function countClass(text, tokens) {
  let total = 0;
  let classes = 0;
  for (const token of tokens) {
    // Multi-word phrase tokens ("did not establish", "communications not
    // established") match across ANY whitespace run, including newlines — the
    // content-filter does not care about spacing, so a double-space or a
    // line-broken phrase must still count (brief/prompt body text is raw, not
    // whitespace-collapsed like page mode).
    const pattern = escapeRe(token).replace(/ /g, '\\s+');
    const matches = text.match(new RegExp(pattern, 'gi'));
    const n = matches ? matches.length : 0;
    if (n > 0) classes += 1;
    total += n;
  }
  return { total, classes };
}

/**
 * Extract the title line for the given mode.
 *   brief — first markdown H1 (`# ...`), else first non-blank line.
 *   page  — first <h1>…</h1> inner text, else <title>…</title>, tag-stripped.
 *   prompt — none (returns '').
 */
function extractTitleLine(text, mode) {
  if (mode === 'prompt') return '';
  if (mode === 'page') {
    const h1 = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = h1 ? h1[1] : (text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    return stripHtml(title).trim();
  }
  // brief: prefer the first markdown H1, else the first non-blank line.
  const lines = text.split(/\r?\n/);
  const h1Line = lines.find((l) => /^#\s+\S/.test(l));
  if (h1Line) return h1Line.replace(/^#+\s*/, '').trim();
  return (lines.find((l) => l.trim() !== '') ?? '').trim();
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Compute the trip-vocab report for `text` under `mode`. Pure: no I/O.
 */
export function analyzeTripVocab(text, { mode = 'brief', secondaryMax = DEFAULT_SECONDARY_MAX } = {}) {
  const titleLine = extractTitleLine(text, mode);
  const bodyText = mode === 'page' ? stripHtml(text) : text;

  const titlePrimary = countClass(titleLine, PRIMARY_TOKENS);
  const fullPrimary = countClass(bodyText, PRIMARY_TOKENS);
  const fullSecondary = countClass(bodyText, SECONDARY_TOKENS);

  // Which PRIMARY metric gates depends on the mode: brief/page gate the title
  // line (primary in body prose is allowed — e.g. "impact" in a mission body);
  // prompt has no title, so primary ANYWHERE is a risk (#10407).
  const gatedPrimary = mode === 'prompt' ? fullPrimary.total : titlePrimary.total;
  const reasons = [];
  if (gatedPrimary > 0) {
    reasons.push(
      mode === 'prompt'
        ? `prompt primary ${gatedPrimary} > 0 (budget 0)`
        : `title-line primary ${gatedPrimary} > 0 (budget 0)`,
    );
  }
  if (fullSecondary.total > secondaryMax) {
    reasons.push(
      `body secondary ${fullSecondary.total} across ${fullSecondary.classes} class(es) > ${secondaryMax}`,
    );
  }
  const verdict = reasons.length > 0 ? 'trip-risk' : 'pass';

  return {
    mode,
    secondaryMax,
    titleLinePrimary: titlePrimary.total,
    bodyPrimary: fullPrimary.total,
    bodySecondary: fullSecondary.total,
    bodySecondaryClasses: fullSecondary.classes,
    gatedPrimary,
    verdict,
    reasons,
  };
}

function render(report, { json }) {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const primaryLabel = report.mode === 'prompt' ? 'prompt primary' : 'title-line primary';
  console.log(`[trip-vocab-check] mode=${report.mode}  secondary-max=${report.secondaryMax}`);
  console.log(`  ${primaryLabel}: ${report.gatedPrimary} (budget 0)`);
  console.log(`  body secondary: ${report.bodySecondary} across ${report.bodySecondaryClasses} class(es) (budget ≤ ${report.secondaryMax})`);
  if (report.mode !== 'prompt') {
    console.log(`  body primary: ${report.bodyPrimary} (informational — primary in body prose is not gated in ${report.mode} mode)`);
  }
  if (report.verdict === 'trip-risk') {
    console.log(`  VERDICT: TRIP-RISK — ${report.reasons.join('; ')}`);
    console.log(`  Action: re-author the title line to 0 primary tokens and/or reduce secondary density; if intrinsic to the topic, select Path B (main-context hand-author). See docs/MISSION-PACKAGE-DISCIPLINE.md §3.`);
  } else {
    console.log(`  VERDICT: PASS — within trip-vocab budget`);
  }
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: node tools/trip-vocab-check.mjs <path> [--mode brief|prompt|page] [--secondary-max N] [--stdin] [--json]');
    process.exit(0);
  }

  const json = argv.includes('--json');
  const useStdin = argv.includes('--stdin');

  const modeIdx = argv.indexOf('--mode');
  const mode = modeIdx >= 0 ? argv[modeIdx + 1] : 'brief';
  if (!VALID_MODES.includes(mode)) {
    fail(`--mode must be one of: ${VALID_MODES.join(', ')}; got '${mode ?? '<missing>'}'`);
  }

  const maxIdx = argv.indexOf('--secondary-max');
  let secondaryMax = DEFAULT_SECONDARY_MAX;
  if (maxIdx >= 0) {
    const n = Number(argv[maxIdx + 1]);
    if (!Number.isInteger(n) || n < 0) {
      fail(`--secondary-max must be a non-negative integer; got '${argv[maxIdx + 1] ?? '<missing>'}'`);
    }
    secondaryMax = n;
  }

  let text;
  if (useStdin) {
    try {
      text = readFileSync(0, 'utf8');
    } catch (err) {
      fail(`could not read stdin: ${err.message}`);
    }
  } else {
    // First non-flag, non-flag-value positional arg is the path.
    const flagValueIdxs = new Set([modeIdx >= 0 ? modeIdx + 1 : -1, maxIdx >= 0 ? maxIdx + 1 : -1]);
    const path = argv.find((a, i) => !a.startsWith('--') && !a.startsWith('-') && !flagValueIdxs.has(i));
    if (!path) fail('no input path given (pass a file path, or use --stdin)');
    try {
      text = readFileSync(path, 'utf8');
    } catch (err) {
      fail(`could not read ${path}: ${err.message}`);
    }
  }

  const report = analyzeTripVocab(text, { mode, secondaryMax });
  render(report, { json });
  process.exit(report.verdict === 'trip-risk' ? 1 : 0);
}

// Run as CLI unless imported (the analyzeTripVocab export is for tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
