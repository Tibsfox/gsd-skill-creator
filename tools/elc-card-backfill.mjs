#!/usr/bin/env node
/**
 * tools/elc-card-backfill.mjs — bring ELC catalog cards under the
 * v1.49.658 normative template. Sibling to mus-card-backfill.mjs (W2.3).
 *
 * ELC field schema (per components/00-shared-template-spec.md):
 *   required META: NASA, Flight subset
 *   maxMetaCount: 2
 *
 * Same backfill pattern as MUS: reduce over-spec cards, append overflow
 * to per-degree page, idempotent via start/end markers.
 *
 * Authored 2026-05-16 in v1.49.658 W2.4.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractAllCards, extractCard, validateCard, renderCard } from './catalog-card-template/extractor.mjs';
import { HARD_LIMITS, TRACK_TEMPLATES } from './catalog-card-template/spec.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TRACK = 'ELC';
const BACKFILL_MARKER = '<!-- v1.49.658-backfill-complete -->';
const RELOCATE_START = '<!-- v1.49.658-relocated:start -->';
const RELOCATE_END = '<!-- v1.49.658-relocated:end -->';

function resolveRoot(argv) {
  const i = argv.indexOf('--root');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return join(HERE, '..');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    write: args.includes('--write'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

function truncateAt(text, n) {
  if (text.length <= n) return text;
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
  const headerMatch = numOriginal.match(/^([A-Z]+ [\d.]+(?:\s*&middot;\s*D\d+[^/]{0,40}(?:&middot;[^/]{0,30})?)?)/);
  let newNum = headerMatch ? headerMatch[1].trim() : numOriginal;
  newNum = truncateAt(newNum, HARD_LIMITS.degreeNumChars);
  if (newNum !== numOriginal) removed.degreeNumOverflow = numOriginal;

  let newTitle = stripForbiddenPatterns(titleOriginal);
  newTitle = truncateAt(newTitle, HARD_LIMITS.degreeTitleChars);
  if (newTitle !== titleOriginal) removed.degreeTitleOverflow = titleOriginal;

  const newMeta = [];
  for (const mf of ast.meta) {
    const cleanedText = stripForbiddenPatterns(mf.text);
    const truncated = truncateAt(cleanedText, HARD_LIMITS.perMetaFieldChars);
    if (truncated !== mf.text) removed.metaFieldOverflow[mf.name] = mf.text;
    newMeta.push({ name: mf.name, text: truncated });
  }

  // Filter to only required fields (drop extras like "ELC 1.116:", "SPS:",
  // "Substrate convergence:") since ELC maxMetaCount=2 and required are
  // NASA + Flight subset.
  const filtered = [];
  for (const req of tmpl.requiredMetaFields) {
    const match = newMeta.find((mf) => mf.name === req);
    if (match) filtered.push(match);
  }
  // Mark dropped fields
  for (const mf of newMeta) {
    if (!filtered.some((f) => f.name === mf.name)) {
      removed.droppedMetaFields.push(mf);
    }
  }
  // Add placeholders for missing required
  for (const req of tmpl.requiredMetaFields) {
    if (!filtered.some((f) => f.name === req)) {
      filtered.push({ name: req, text: '(see linked page)' });
    }
  }

  return {
    newAst: { ...ast, degreeNum: newNum, degreeTitle: newTitle, meta: filtered },
    removed,
  };
}

function buildRelocationBlock(degree, removed) {
  const parts = [RELOCATE_START];
  parts.push(`<section class="catalog-overflow" data-source-milestone="v1.49.658">`);
  parts.push(`<h2>Catalog overflow (relocated 2026-05-16 v1.49.658)</h2>`);
  parts.push(`<p>The following content was relocated from the catalog-index card for ${TRACK} ${degree} to bring the card under the v1.49.658 normative template.</p>`);
  if (removed.degreeNumOverflow) parts.push(`<h3>Original degree-num</h3><pre>${escapeHtml(removed.degreeNumOverflow)}</pre>`);
  if (removed.degreeTitleOverflow) parts.push(`<h3>Original degree-title</h3><pre>${escapeHtml(removed.degreeTitleOverflow)}</pre>`);
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
  if (!existsSync(pagePath)) return { ok: false, reason: 'no-per-degree-page', path: pagePath };
  let html = readFileSync(pagePath, 'utf8');
  if (html.includes(RELOCATE_START) && html.includes(RELOCATE_END)) {
    const before = html.slice(0, html.indexOf(RELOCATE_START));
    const after = html.slice(html.indexOf(RELOCATE_END) + RELOCATE_END.length);
    html = before + relocationBlock + after;
  } else {
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
  const INDEX = join(RESEARCH_ROOT, TRACK, 'index.html');
  const { write, help } = parseArgs(argv);

  if (help) {
    console.log('elc-card-backfill.mjs — see mus-card-backfill.mjs --help; same CLI shape');
    process.exit(0);
  }
  if (!existsSync(INDEX)) {
    console.error(`[FATAL] ${TRACK} index not found: ${INDEX}`);
    process.exit(1);
  }

  const indexHtml = readFileSync(INDEX, 'utf8');
  const cards = extractAllCards(indexHtml);
  const violations = cards.map((ast) => ({ ast, v: validateCard(ast, TRACK) })).filter((x) => !x.v.pass);

  console.log(`# ${TRACK} card backfill — v1.49.658 (${write ? 'WRITE' : 'DRY-RUN'})`);
  console.log(`Total cards: ${cards.length}, Violations: ${violations.length}`);

  if (violations.length === 0) {
    console.log('All cards already template-compliant.');
    process.exit(0);
  }

  let updatedIndex = indexHtml;
  const perDegreePageWrites = [];
  const r1Failures = [];
  let passedAfter = 0;

  for (const { ast } of violations) {
    const degree = ast.hrefDegree.replace(/\/index\.html$/, '');
    const { newAst, removed } = reduceCard(ast, TRACK);
    const newCardHtml = renderCardWithMarker(newAst);
    const reparsed = extractCard(newCardHtml);
    const newValidation = validateCard(reparsed, TRACK);
    if (newValidation.pass) passedAfter++;
    if (updatedIndex.includes(ast.rawHtml)) {
      updatedIndex = updatedIndex.replace(ast.rawHtml, newCardHtml);
    }
    const block = buildRelocationBlock(degree, removed);
    const result = appendToDegreePage(RESEARCH_ROOT, TRACK, degree, block);
    if (!result.ok) r1Failures.push({ degree, reason: result.reason });
    else perDegreePageWrites.push({ path: result.path, html: result.html });
  }

  console.log(`After backfill: ${passedAfter}/${violations.length} PASS`);
  console.log(`R1 failures (no per-degree page): ${r1Failures.length}`);

  if (write) {
    writeFileSync(INDEX, updatedIndex);
    for (const w of perDegreePageWrites) writeFileSync(w.path, w.html);
    console.log(`[WRITE] Updated ${TRACK}/index.html + ${perDegreePageWrites.length} per-degree page(s).`);
  } else {
    console.log('[DRY-RUN] No files written.');
  }
  process.exit(0);
}

const invokedDirectly = process.argv[1] && (
  process.argv[1].endsWith('elc-card-backfill.mjs') || process.argv[1].endsWith('elc-card-backfill')
);
if (invokedDirectly) {
  main(process.argv).catch((err) => { console.error('Unhandled error:', err); process.exit(1); });
}
