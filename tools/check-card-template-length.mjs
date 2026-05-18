#!/usr/bin/env node
/**
 * tools/check-card-template-length.mjs — proactive MUS/ELC card-template
 * degree-title length validator (v1.49.676 cc1 Gate 2).
 *
 * Closes deferred Gate 2 candidate from v1.49.671. Surfaces card-template
 * length violations AHEAD of pre-tag-gate step 8 (catalog-index drift
 * BLOCKER) so authors get fast feedback at edit time rather than reactive
 * shipping pain.
 *
 * Behavior:
 *   - Scans MUS + ELC + SPS + TRS catalog indexes for card-template
 *     length-class violations (per HARD_LIMITS.degreeTitleChars=150 etc).
 *   - Exits 0 on PASS (no violations) and 1 on FAIL (any violations found).
 *   - --json emits machine-readable output for tooling consumers.
 *   - --quiet suppresses per-card detail; just emits the PASS/FAIL summary.
 *
 * Pre-tag-gate integration: runs as step 7.6/14 (right before step 8
 * catalog-index drift BLOCKER). Designed to fail-fast with a friendly
 * "fix your degree-title BEFORE catalog drift fires" message.
 *
 * Background:
 *   - HARD_LIMITS.degreeTitleChars = 150 (from tools/catalog-card-template/spec.mjs)
 *   - Reactive BLOCKER pattern observed at v672 + v674 — author over-runs
 *     150 chars in per-degree page <title>, hits at step 8 of pre-tag-gate
 *     with cryptic catalog-index-drift error, and must retry post-fix.
 *   - This gate converts the reactive pattern into proactive fast-feedback.
 *
 * See also: docs/counter-cadence-discipline.md (gate-not-vigilance);
 * v1.49.671 release notes (single-cc Gate 1 STATE.md normalizer precedent);
 * v1.49.676 release notes (cc cluster broad-cleanup substrate-class).
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractAllCards } from './catalog-card-template/extractor.mjs';
import { TRACK_TEMPLATES, HARD_LIMITS } from './catalog-card-template/spec.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(__filename), '..');
const RESEARCH_ROOT = join(REPO_ROOT, 'www/tibsfox/com/Research');

const TITLE_CHAR_LIMIT = HARD_LIMITS.degreeTitleChars;

// Tracks with HTML-rendered catalog indexes that carry card-template
// degree-title text. NASA's catalog is JS-rendered from CSV, so its
// per-degree <title> is audited separately via tools/nasa-card-backfill.mjs.
const HTML_RENDERED_TRACKS = ['MUS', 'ELC', 'SPS', 'TRS'];

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    quiet: argv.includes('--quiet'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function scanTrack(track) {
  const indexPath = join(RESEARCH_ROOT, track, 'index.html');
  if (!existsSync(indexPath)) {
    return { track, status: 'SKIPPED', reason: 'index.html absent', violations: [] };
  }
  const html = readFileSync(indexPath, 'utf8');
  const cards = extractAllCards(html);
  if (cards.length === 0) {
    return { track, status: 'SKIPPED', reason: 'no cards extracted', violations: [] };
  }

  const violations = [];
  for (const card of cards) {
    const titleLen = card.degreeTitle.length;
    if (titleLen > TITLE_CHAR_LIMIT) {
      violations.push({
        degree: card.hrefDegree,
        title: card.degreeTitle.slice(0, 60) + '...',
        length: titleLen,
        limit: TITLE_CHAR_LIMIT,
        overage: titleLen - TITLE_CHAR_LIMIT,
      });
    }
  }

  return {
    track,
    status: violations.length === 0 ? 'PASS' : 'FAIL',
    card_count: cards.length,
    violations,
  };
}

function formatTextReport(results) {
  const lines = [];
  lines.push('[check-card-template-length] v1.49.676 cc1 Gate 2 — proactive MUS/ELC title-length scan');
  lines.push('');
  let totalViolations = 0;
  for (const r of results) {
    if (r.status === 'SKIPPED') {
      lines.push(`[--] ${r.track.padEnd(4)} SKIPPED — ${r.reason}`);
      continue;
    }
    if (r.status === 'PASS') {
      lines.push(`[OK] ${r.track.padEnd(4)} PASS — ${r.card_count} cards, all titles <= ${TITLE_CHAR_LIMIT} chars`);
    } else {
      lines.push(`[X ] ${r.track.padEnd(4)} FAIL — ${r.violations.length} card(s) over ${TITLE_CHAR_LIMIT} chars`);
      for (const v of r.violations) {
        lines.push(`     ${v.degree.padEnd(20)} ${v.length} chars (overage +${v.overage}): ${v.title}`);
      }
      totalViolations += r.violations.length;
    }
  }
  lines.push('');
  if (totalViolations > 0) {
    lines.push(`Summary: ${totalViolations} violation(s) across ${results.filter((r) => r.status === 'FAIL').length} track(s)`);
    lines.push(`Fix: shorten degree-title in per-degree page <h1> + <title> + catalog-card div to <= ${TITLE_CHAR_LIMIT} chars`);
    lines.push(`After fix: re-run \`node tools/update-catalog-indexes.mjs --write\` to refresh catalog cards`);
    lines.push(`Override (emergency only): SC_SKIP_CARD_TEMPLATE_LENGTH=1 (document in release-notes)`);
  } else {
    lines.push(`Summary: all titles <= ${TITLE_CHAR_LIMIT} chars across ${results.filter((r) => r.status === 'PASS').length} track(s)`);
  }
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`tools/check-card-template-length.mjs — proactive MUS/ELC title-length gate (v1.49.676 cc1)

Usage:
  node tools/check-card-template-length.mjs [--json] [--quiet]

Options:
  --json     emit JSON results
  --quiet    suppress per-card detail
  --help     show this help

Exit codes:
  0  PASS — all titles within limit
  1  FAIL — at least one violation found
  2  internal error

See: docs/counter-cadence-discipline.md, v1.49.676 release notes.`);
    process.exit(0);
  }

  let results;
  try {
    results = HTML_RENDERED_TRACKS.map(scanTrack);
  } catch (err) {
    if (args.json) {
      console.log(JSON.stringify({ status: 'ERROR', error: String(err) }));
    } else {
      console.error('[check-card-template-length] ERROR:', err);
    }
    process.exit(2);
  }

  const anyFail = results.some((r) => r.status === 'FAIL');

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          status: anyFail ? 'FAIL' : 'PASS',
          title_char_limit: TITLE_CHAR_LIMIT,
          results,
        },
        null,
        2,
      ),
    );
  } else if (!args.quiet) {
    console.log(formatTextReport(results));
  } else {
    const totalViolations = results.reduce((sum, r) => sum + (r.violations?.length || 0), 0);
    console.log(`[check-card-template-length] ${anyFail ? 'FAIL' : 'PASS'} — ${totalViolations} violation(s)`);
  }

  process.exit(anyFail ? 1 : 0);
}

if (process.argv[1] === __filename) {
  main();
}
