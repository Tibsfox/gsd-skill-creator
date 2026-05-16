/**
 * tools/catalog-card-template/extractor.mjs — parse, validate, render
 * catalog-card HTML against the normative spec.
 *
 * Consumers: tools/update-catalog-indexes.mjs (gate), backfill scripts
 * (tools/{mus,nasa,elc,sps,trs}-card-backfill.mjs), meta-test
 * (tests/integration/catalog-card-gate-self-applies.test.ts).
 */

import { TRACK_TEMPLATES, HARD_LIMITS } from './spec.mjs';

/**
 * @typedef {Object} CardMetaField
 * @property {string} name   META field label (e.g. "S36", "SPS", "NASA")
 * @property {string} text   text content (may include allowed inline markup)
 */

/**
 * @typedef {Object} CardAST
 * @property {string} hrefDegree       e.g. "1.117/index.html"
 * @property {string|null} domainClass e.g. "domain-11" or null
 * @property {string} degreeNum        text of div.degree-num
 * @property {string} degreeTitle      text of div.degree-title
 * @property {CardMetaField[]} meta    list of div.degree-meta fields
 * @property {number} byteCount        full card HTML byte count
 * @property {string} rawHtml          original HTML
 */

/**
 * @typedef {Object} ViolationDetail
 * @property {string} field   field that violated (e.g. "degree-title", "degree-meta:S71")
 * @property {number} actual  measured value
 * @property {number} limit   limit value
 * @property {string} unit    "chars" | "bytes" | "count"
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} pass
 * @property {string} track
 * @property {string} degree
 * @property {number} byteCount
 * @property {ViolationDetail[]} fieldViolations
 * @property {string[]} forbiddenPatterns       matched forbidden patterns
 * @property {string[]} forbiddenMarkup         e.g. ["<a href=...> in degree-meta:S62"]
 * @property {string[]} missingRequired         missing required META fields
 * @property {string} blockerMessage            single-line BLOCKER format per spec
 */

const STRIP_TAGS_RE = /<[^>]+>/g;
const HTML_ENTITY_RE = /&[a-zA-Z]+;|&#\d+;/g;

/**
 * Strip HTML tags + decode common entities for char-count comparison.
 * Char counting is on the rendered text, not raw HTML.
 */
function textContent(html) {
  return html
    .replace(STRIP_TAGS_RE, '')
    .replace(HTML_ENTITY_RE, (m) => {
      const map = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&middot;': '·', '&ndash;': '–', '&mdash;': '—' };
      return map[m] || m;
    })
    .trim();
}

/**
 * @param {string} html
 * @returns {number}
 */
export function byteCountCard(html) {
  return Buffer.byteLength(html, 'utf8');
}

/**
 * Extract a single catalog card's structured form from its HTML.
 *
 * @param {string} html  raw card HTML beginning with <div class="degree-card...">
 * @returns {CardAST}
 */
export function extractCard(html) {
  const trimmed = html.trim();
  const domainMatch = trimmed.match(/<div class="degree-card\s+(domain-[\w-]+)"/);
  const hrefMatch = trimmed.match(/<a href="([^"]+)"/);

  const numMatch = trimmed.match(/<div class="degree-num">([\s\S]*?)<\/div>/);
  const titleMatch = trimmed.match(/<div class="degree-title">([\s\S]*?)<\/div>/);

  const meta = [];
  const metaRe = /<div class="degree-meta">\s*<strong>([^<:]+):<\/strong>\s*([\s\S]*?)<\/div>/g;
  let m;
  while ((m = metaRe.exec(trimmed)) !== null) {
    meta.push({ name: m[1].trim(), text: m[2].trim() });
  }

  return {
    hrefDegree: hrefMatch ? hrefMatch[1] : '',
    domainClass: domainMatch ? domainMatch[1] : null,
    degreeNum: numMatch ? numMatch[1].trim() : '',
    degreeTitle: titleMatch ? titleMatch[1].trim() : '',
    meta,
    byteCount: byteCountCard(html),
    rawHtml: html,
  };
}

/**
 * Validate a card AST against the normative spec for the given track.
 *
 * @param {CardAST} ast
 * @param {keyof typeof TRACK_TEMPLATES} track
 * @returns {ValidationResult}
 */
export function validateCard(ast, track) {
  const tmpl = TRACK_TEMPLATES[track];
  if (!tmpl) throw new Error(`Unknown track: ${track}`);

  const degree = ast.hrefDegree.replace(/\/index\.html$/, '');
  const fieldViolations = [];
  const forbiddenPatterns = [];
  const forbiddenMarkup = [];
  const missingRequired = [];

  // Byte count
  if (ast.byteCount > HARD_LIMITS.totalCardBytes) {
    fieldViolations.push({ field: 'total-card', actual: ast.byteCount, limit: HARD_LIMITS.totalCardBytes, unit: 'bytes' });
  }

  // degree-num
  const numText = textContent(ast.degreeNum);
  if (numText.length > HARD_LIMITS.degreeNumChars) {
    fieldViolations.push({ field: 'degree-num', actual: numText.length, limit: HARD_LIMITS.degreeNumChars, unit: 'chars' });
  }

  // degree-title
  const titleText = textContent(ast.degreeTitle);
  if (titleText.length > HARD_LIMITS.degreeTitleChars) {
    fieldViolations.push({ field: 'degree-title', actual: titleText.length, limit: HARD_LIMITS.degreeTitleChars, unit: 'chars' });
  }

  // per-meta-field chars
  for (const mf of ast.meta) {
    const mfText = textContent(mf.text);
    if (mfText.length > HARD_LIMITS.perMetaFieldChars) {
      fieldViolations.push({ field: `degree-meta:${mf.name}`, actual: mfText.length, limit: HARD_LIMITS.perMetaFieldChars, unit: 'chars' });
    }
  }

  // meta count
  if (ast.meta.length > tmpl.maxMetaCount) {
    fieldViolations.push({ field: 'degree-meta', actual: ast.meta.length, limit: tmpl.maxMetaCount, unit: 'count' });
  }

  // required meta presence
  const presentNames = new Set(ast.meta.map((mf) => mf.name));
  for (const req of tmpl.requiredMetaFields) {
    if (!presentNames.has(req)) missingRequired.push(req);
  }

  // forbidden content patterns
  const allText = [ast.degreeNum, ast.degreeTitle, ...ast.meta.map((mf) => mf.text)].join(' ');
  for (const pattern of HARD_LIMITS.forbiddenContentPatterns) {
    const match = allText.match(pattern);
    if (match) forbiddenPatterns.push(match[0]);
  }

  // forbidden inline markup
  for (const tag of HARD_LIMITS.forbiddenInlineMarkup) {
    const re = new RegExp(`<${tag}\\b[^>]*>`, 'i');
    for (const region of [
      { name: 'degree-num',   html: ast.degreeNum   },
      { name: 'degree-title', html: ast.degreeTitle },
      ...ast.meta.map((mf) => ({ name: `degree-meta:${mf.name}`, html: mf.text })),
    ]) {
      if (re.test(region.html)) {
        forbiddenMarkup.push(`<${tag}> in ${region.name}`);
      }
    }
  }

  const pass = fieldViolations.length === 0 && forbiddenPatterns.length === 0
            && forbiddenMarkup.length === 0 && missingRequired.length === 0;

  let blockerMessage = '';
  if (!pass) {
    const parts = [];
    if (fieldViolations.length > 0) {
      const fv = fieldViolations.map((v) => `${v.field} ${v.actual} ${v.unit} (limit ${v.limit})`).join(', ');
      parts.push(`fields exceed: ${fv}`);
    }
    if (forbiddenPatterns.length > 0) parts.push(`forbidden patterns: ${forbiddenPatterns.join(', ')}`);
    if (forbiddenMarkup.length > 0)  parts.push(`forbidden inline markup: ${forbiddenMarkup.join(', ')}`);
    if (missingRequired.length > 0)  parts.push(`missing required META: ${missingRequired.join(', ')}`);
    blockerMessage = `[card-template:BLOCKER] ${track} ${degree} card ${ast.byteCount} bytes (limit ${HARD_LIMITS.totalCardBytes}) — ${parts.join('; ')}`;
  }

  return { pass, track, degree, byteCount: ast.byteCount, fieldViolations, forbiddenPatterns, forbiddenMarkup, missingRequired, blockerMessage };
}

/**
 * Render a CardAST back to template-compliant HTML. Used by backfill scripts
 * to produce a clean card from a (possibly cleaned-up) AST.
 *
 * @param {CardAST} ast
 * @returns {string}
 */
export function renderCard(ast) {
  const domain = ast.domainClass ? ` ${ast.domainClass}` : '';
  const metaLines = ast.meta
    .map((mf) => `          <div class="degree-meta"><strong>${mf.name}:</strong> ${mf.text}</div>`)
    .join('\n');
  return [
    `<div class="degree-card${domain}"><a href="${ast.hrefDegree}">`,
    `          <div class="degree-num">${ast.degreeNum}</div>`,
    `          <div class="degree-title">${ast.degreeTitle}</div>`,
    metaLines,
    `        </a></div>`,
  ].join('\n');
}

/**
 * Walk a full catalog index HTML, return list of CardASTs.
 *
 * @param {string} indexHtml
 * @returns {CardAST[]}
 */
export function extractAllCards(indexHtml) {
  const cards = [];
  const re = /<div class="degree-card[^"]*">[\s\S]*?<\/a><\/div>/g;
  let m;
  while ((m = re.exec(indexHtml)) !== null) {
    cards.push(extractCard(m[0]));
  }
  return cards;
}
