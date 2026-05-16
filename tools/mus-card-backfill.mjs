#!/usr/bin/env node
/**
 * tools/mus-card-backfill.mjs — bring MUS catalog cards under the
 * v1.49.658 normative template.
 *
 * Walks www/tibsfox/com/Research/MUS/index.html, identifies cards that
 * violate the template (>1500B, forbidden patterns, missing fields,
 * inflated meta count), and rewrites them in-place. Substrate-rich
 * content that was on the card is appended to the linked per-degree
 * page (MUS/<degree>/index.html) under a marked section.
 *
 * Idempotent: re-runs are no-ops when all cards are already compliant.
 * Markers used:
 *   <!-- v1.49.658-backfill-complete --> on each backfilled card
 *   <!-- v1.49.658-relocated:start ... :end --> in each per-degree page
 *
 * Usage:
 *   node tools/mus-card-backfill.mjs                # dry-run; report only
 *   node tools/mus-card-backfill.mjs --write        # apply changes
 *   node tools/mus-card-backfill.mjs --report <path># write report to file
 *   node tools/mus-card-backfill.mjs --root <path>  # override repo root
 *
 * Exit codes:
 *   0  OK (dry-run summary, or write succeeded with no failures)
 *   1  I/O or parse error
 *   2  invalid arguments
 *
 * Authored 2026-05-16 in v1.49.658 W2.3.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractAllCards, extractCard, validateCard, renderCard } from './catalog-card-template/extractor.mjs';
import { HARD_LIMITS, TRACK_TEMPLATES } from './catalog-card-template/spec.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

function resolveRoot(argv) {
  const i = argv.indexOf('--root');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return join(HERE, '..');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const write = args.includes('--write');
  const help = args.includes('--help') || args.includes('-h');
  const reportIdx = args.indexOf('--report');
  const report = reportIdx >= 0 && args[reportIdx + 1] ? args[reportIdx + 1] : null;
  return { write, help, report };
}

const BACKFILL_MARKER = '<!-- v1.49.658-backfill-complete -->';
const RELOCATE_START = '<!-- v1.49.658-relocated:start -->';
const RELOCATE_END = '<!-- v1.49.658-relocated:end -->';

const TRACK = 'MUS';

function truncateAt(text, n) {
  if (text.length <= n) return text;
  // prefer cut at last space before n
  const slice = text.slice(0, n);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > n * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd();
}

function stripForbiddenPatterns(text) {
  let cleaned = text;
  for (const pattern of HARD_LIMITS.forbiddenContentPatterns) {
    cleaned = cleaned.replace(new RegExp(pattern.source, pattern.flags + 'g'), '');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Reduce a card AST to template-compliant form. Returns { newAst, removed }.
 * `removed` is a structured record of what was dropped, to be relocated.
 */
function reduceCard(ast, track) {
  const tmpl = TRACK_TEMPLATES[track];
  const removed = {
    degreeNumOverflow: '',
    degreeTitleOverflow: '',
    droppedMetaFields: [],
    metaFieldOverflow: {},
  };

  const numOriginal = ast.degreeNum;
  const titleOriginal = ast.degreeTitle;
  const headerMatch = numOriginal.match(/^([A-Z]+ [\d.]+(?:\s*&middot;\s*D\d+(?:\s+[\w&; ]{0,30})?)?)/);
  let newNum = headerMatch ? headerMatch[1].trim() : numOriginal;
  newNum = truncateAt(newNum, HARD_LIMITS.degreeNumChars);
  if (newNum !== numOriginal) {
    removed.degreeNumOverflow = numOriginal;
  }

  let newTitle = stripForbiddenPatterns(titleOriginal);
  newTitle = truncateAt(newTitle, HARD_LIMITS.degreeTitleChars);
  if (newTitle !== titleOriginal) {
    removed.degreeTitleOverflow = titleOriginal;
  }

  const newMeta = [];
  const sFieldRegex = /^S\d+$/;
  for (const mf of ast.meta) {
    const cleanedText = stripForbiddenPatterns(mf.text);
    const truncated = truncateAt(cleanedText, HARD_LIMITS.perMetaFieldChars);
    if (truncated !== mf.text) {
      removed.metaFieldOverflow[mf.name] = mf.text;
    }
    newMeta.push({ name: mf.name, text: truncated });
  }

  // Add placeholder for missing required fields. Required entries that are
  // /regex/ patterns are skipped if any existing meta matches the pattern.
  const presentNames = newMeta.map((mf) => mf.name);
  for (const req of tmpl.requiredMetaFields) {
    const isRegex = req.startsWith('/') && req.endsWith('/');
    const matched = isRegex
      ? presentNames.some((n) => new RegExp(req.slice(1, -1)).test(n))
      : presentNames.includes(req);
    if (!matched) {
      // For regex fields (e.g. /^S\d+$/), pick a sensible literal name.
      const literalName = isRegex ? 'S?' : req;
      newMeta.push({ name: literalName, text: '(see linked page)' });
    }
  }

  // Trim to maxMetaCount, preferring required fields.
  while (newMeta.length > tmpl.maxMetaCount) {
    const dropped = newMeta.pop();
    removed.droppedMetaFields.push(dropped);
  }

  const newAst = {
    ...ast,
    degreeNum: newNum,
    degreeTitle: newTitle,
    meta: newMeta,
  };
  return { newAst, removed };
}

function buildRelocationBlock(degree, removed) {
  const parts = [];
  parts.push(RELOCATE_START);
  parts.push(`<section class="catalog-overflow" data-source-milestone="v1.49.658">`);
  parts.push(`<h2>Catalog overflow (relocated 2026-05-16 v1.49.658)</h2>`);
  parts.push(`<p>The following content was relocated from the catalog-index card for ${TRACK} ${degree} to bring the card under the v1.49.658 normative template.</p>`);
  if (removed.degreeNumOverflow) {
    parts.push(`<h3>Original degree-num</h3><pre>${escapeHtml(removed.degreeNumOverflow)}</pre>`);
  }
  if (removed.degreeTitleOverflow) {
    parts.push(`<h3>Original degree-title</h3><pre>${escapeHtml(removed.degreeTitleOverflow)}</pre>`);
  }
  for (const [name, text] of Object.entries(removed.metaFieldOverflow)) {
    parts.push(`<h3>Original degree-meta:${name}</h3><pre>${escapeHtml(text)}</pre>`);
  }
  for (const dropped of removed.droppedMetaFields) {
    parts.push(`<h3>Dropped degree-meta:${dropped.name}</h3><pre>${escapeHtml(dropped.text)}</pre>`);
  }
  parts.push(`</section>`);
  parts.push(RELOCATE_END);
  return parts.join('\n');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|[a-zA-Z]+;)/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function appendToDegreePage(researchRoot, track, degree, relocationBlock) {
  const pagePath = join(researchRoot, track, degree, 'index.html');
  if (!existsSync(pagePath)) {
    return { ok: false, reason: 'no-per-degree-page', path: pagePath };
  }
  let html = readFileSync(pagePath, 'utf8');

  // Idempotency: if marker already present, replace existing block.
  if (html.includes(RELOCATE_START) && html.includes(RELOCATE_END)) {
    const before = html.slice(0, html.indexOf(RELOCATE_START));
    const after = html.slice(html.indexOf(RELOCATE_END) + RELOCATE_END.length);
    html = before + relocationBlock + after;
  } else {
    // Insert before </body>
    const bodyClose = html.lastIndexOf('</body>');
    if (bodyClose < 0) return { ok: false, reason: 'no-body-close', path: pagePath };
    html = html.slice(0, bodyClose) + '\n' + relocationBlock + '\n' + html.slice(bodyClose);
  }
  return { ok: true, path: pagePath, html };
}

function renderCardWithMarker(ast) {
  return renderCard(ast).replace('</a></div>', `</a></div>${BACKFILL_MARKER}`);
}

export async function main(argv = process.argv) {
  const REPO_ROOT = resolveRoot(argv);
  const RESEARCH_ROOT = join(REPO_ROOT, 'www', 'tibsfox', 'com', 'Research');
  const MUS_INDEX = join(RESEARCH_ROOT, TRACK, 'index.html');

  const { write, help, report } = parseArgs(argv);

  if (help) {
    console.log(`mus-card-backfill.mjs — bring MUS catalog cards under v1.49.658 template

Usage:
  node tools/mus-card-backfill.mjs              # dry-run; print report
  node tools/mus-card-backfill.mjs --write      # apply changes
  node tools/mus-card-backfill.mjs --report PATH
  node tools/mus-card-backfill.mjs --root PATH
`.trim());
    process.exit(0);
  }

  if (!existsSync(MUS_INDEX)) {
    console.error(`[FATAL] MUS index not found: ${MUS_INDEX}`);
    process.exit(1);
  }

  const indexHtml = readFileSync(MUS_INDEX, 'utf8');
  const cards = extractAllCards(indexHtml);

  const violations = [];
  for (const ast of cards) {
    const v = validateCard(ast, TRACK);
    if (!v.pass) violations.push({ ast, v });
  }

  const reportLines = [];
  reportLines.push(`# MUS card backfill report — v1.49.658 (${write ? 'WRITE' : 'DRY-RUN'})`);
  reportLines.push(`Total cards: ${cards.length}`);
  reportLines.push(`Violations:  ${violations.length}`);
  reportLines.push('');

  if (violations.length === 0) {
    reportLines.push('All cards already template-compliant. Nothing to do.');
    const txt = reportLines.join('\n');
    console.log(txt);
    if (report) writeFileSync(report, txt);
    process.exit(0);
  }

  let updatedIndex = indexHtml;
  const perDegreePageWrites = [];
  const r1Failures = [];

  for (const { ast, v } of violations) {
    const degree = ast.hrefDegree.replace(/\/index\.html$/, '');
    const { newAst, removed } = reduceCard(ast, TRACK);
    const newCardHtml = renderCardWithMarker(newAst);
    const reparsedAst = extractCard(newCardHtml);
    const newValidation = validateCard(reparsedAst, TRACK);

    const totalViolations = v.fieldViolations.length + v.forbiddenPatterns.length + v.forbiddenMarkup.length + v.missingRequired.length;
    reportLines.push(`## ${TRACK} ${degree}`);
    reportLines.push(`  before: ${ast.byteCount}B | ${totalViolations} violation(s) (${v.fieldViolations.length} field, ${v.forbiddenPatterns.length} forbidden-patterns, ${v.missingRequired.length} missing-required)`);
    reportLines.push(`  after:  ${reparsedAst.byteCount}B | ${newValidation.pass ? 'PASS' : 'STILL DRIFT — manual review'}`);
    if (!newValidation.pass) {
      reportLines.push(`    remaining: ${newValidation.blockerMessage}`);
    }

    // Replace card in index
    if (updatedIndex.includes(ast.rawHtml)) {
      updatedIndex = updatedIndex.replace(ast.rawHtml, newCardHtml);
    } else {
      reportLines.push(`  WARN: original card raw HTML not found in index for replace`);
    }

    // Prepare per-degree page write
    const block = buildRelocationBlock(degree, removed);
    const result = appendToDegreePage(RESEARCH_ROOT, TRACK, degree, block);
    if (!result.ok) {
      r1Failures.push({ degree, reason: result.reason, path: result.path });
      reportLines.push(`  R1 FAIL: ${result.reason} — ${result.path}`);
    } else {
      perDegreePageWrites.push({ degree, path: result.path, html: result.html });
    }
  }

  reportLines.push('');
  reportLines.push(`R1 failures (no per-degree page found): ${r1Failures.length}`);
  if (r1Failures.length > 0) {
    for (const f of r1Failures) reportLines.push(`  - ${TRACK} ${f.degree}: ${f.path}`);
  }
  reportLines.push('');

  const txt = reportLines.join('\n');
  console.log(txt);
  if (report) writeFileSync(report, txt);

  if (write) {
    writeFileSync(MUS_INDEX, updatedIndex);
    for (const w of perDegreePageWrites) writeFileSync(w.path, w.html);
    console.log(`\n[WRITE] Updated MUS/index.html + ${perDegreePageWrites.length} per-degree page(s).`);
  } else {
    console.log(`\n[DRY-RUN] No files written. Re-run with --write to apply.`);
  }

  process.exit(0);
}

const invokedDirectly = process.argv[1] && (
  process.argv[1].endsWith('mus-card-backfill.mjs') ||
  process.argv[1].endsWith('mus-card-backfill')
);
if (invokedDirectly) {
  main(process.argv).catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
