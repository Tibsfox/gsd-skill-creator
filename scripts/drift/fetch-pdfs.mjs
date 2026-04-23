#!/usr/bin/env node
// scripts/drift/fetch-pdfs.mjs
// Permanent repo utility shipped by Phase 684.1 (v1.49.569 Drift in LLM Systems mission).
//
// Downloads arXiv PDFs for editorial review (full-PDF Opus audit) or for any future
// wave that needs the raw source rather than the abstract-level summary in meta.json.
//
// Input:  sources/extraction.yaml  (or sources/meta.json — both carry arxiv_id)
// Output: sources/pdfs/<arxiv_id>.pdf  (one per entry with a non-null arxiv_id)
//
// Deliberately minimal — no PDF parsing, no text extraction. The caller decides what
// to do with the bytes. We keep it a permanent utility because:
//   (a) Phase 684.1 needs it
//   (b) future drift-adjacent missions will re-use the arXiv fetch contract
//   (c) replicating it ad-hoc in a script invites the malformed-arxiv-id footgun
//       (e.g. "2404.5411" vs "2404.05411") which we eat here via validateArxivId()
//
// CLI:
//   node scripts/drift/fetch-pdfs.mjs \
//     --meta   <path-to-meta.json> \
//     --out    <path-to-pdf-dir> \
//     [--rate-ms <ms>]   (default 3000, per arXiv ToS)
//     [--dry-run]        (log plan, make no network calls)
//     [--force]          (re-download even if <out>/<id>.pdf exists)

import fs from 'node:fs';
import path from 'node:path';

const ARXIV_PDF = 'https://arxiv.org/pdf/';
const DEFAULT_RATE_MS = 3000;

// ----------------------------------------------------------------------------
// arXiv ID validation
// ----------------------------------------------------------------------------
//
// Canonical post-2007 format: YYMM.NNNNN where N is 4 or 5 digits.
// Older pre-2007 format:      <subject>/YYMMNNN   (e.g. math.CO/0201001) — we
// accept this but emit a warning since drift corpus post-dates 2024.
// Versioned IDs (e.g. 2404.05411v3) are accepted and the suffix is preserved.

const ARXIV_NEW_RE = /^(\d{4})\.(\d{4,5})(v\d+)?$/;
const ARXIV_OLD_RE = /^[a-z][a-z.-]*\/(\d{7})(v\d+)?$/i;

export function validateArxivId(id) {
  if (id == null) return { ok: false, reason: 'null arxiv_id' };
  if (typeof id !== 'string') return { ok: false, reason: `arxiv_id must be string, got ${typeof id}` };
  const trimmed = id.trim();
  if (!trimmed) return { ok: false, reason: 'empty arxiv_id' };
  if (ARXIV_NEW_RE.test(trimmed)) {
    const [, yymm, num] = trimmed.match(ARXIV_NEW_RE);
    const yy = Number(yymm.slice(0, 2));
    const mm = Number(yymm.slice(2));
    if (mm < 1 || mm > 12) return { ok: false, reason: `invalid month in YYMM: ${yymm}` };
    // month validity only; year can be future (2601.x is valid in our 2026 corpus)
    return { ok: true, format: 'new', normalized: trimmed, yy, mm, num };
  }
  if (ARXIV_OLD_RE.test(trimmed)) {
    return { ok: true, format: 'old', normalized: trimmed, warning: 'pre-2007 format — drift corpus post-dates 2024' };
  }
  return { ok: false, reason: `unrecognized arXiv ID format: "${trimmed}" (expected YYMM.NNNNN or subj/YYMMNNN)` };
}

// ----------------------------------------------------------------------------
// Fetch one PDF
// ----------------------------------------------------------------------------

export async function fetchOnePdf(arxivId, { outDir, dryRun, force, fetchImpl = globalThis.fetch, log = console } = {}) {
  const v = validateArxivId(arxivId);
  if (!v.ok) return { status: 'skip', arxiv_id: arxivId, reason: v.reason };

  const safeId = v.normalized.replace(/[/]/g, '_');
  const outPath = outDir && path.join(outDir, `${safeId}.pdf`);

  if (outPath && fs.existsSync(outPath) && !force) {
    return { status: 'cached', arxiv_id: arxivId, path: outPath };
  }

  if (dryRun) {
    return { status: 'dry-run', arxiv_id: arxivId, url: ARXIV_PDF + v.normalized };
  }

  if (!fetchImpl) throw new Error('fetch not available — use Node 18+ or inject fetchImpl');

  const url = ARXIV_PDF + v.normalized;
  const res = await fetchImpl(url, { redirect: 'follow' });
  if (!res.ok) return { status: 'error', arxiv_id: arxivId, http: res.status, reason: `HTTP ${res.status}` };

  const buf = Buffer.from(await res.arrayBuffer());
  // minimal sanity — arXiv PDFs start with %PDF-
  if (buf.length < 5 || buf.slice(0, 5).toString() !== '%PDF-') {
    return { status: 'error', arxiv_id: arxivId, reason: 'response is not a PDF', size: buf.length };
  }

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buf);
  }
  return { status: 'ok', arxiv_id: arxivId, path: outPath, bytes: buf.length, warning: v.warning };
}

// ----------------------------------------------------------------------------
// Fetch a batch (reads meta.json shape, respects rate limit)
// ----------------------------------------------------------------------------

export async function fetchBatch(entries, opts = {}) {
  const rateMs = opts.rateMs ?? DEFAULT_RATE_MS;
  const results = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const r = await fetchOnePdf(e.arxiv_id, opts);
    r.cite_key = e.cite_key;
    results.push(r);
    if (opts.log && opts.log.log) opts.log.log(`  [${i + 1}/${entries.length}] ${e.cite_key}: ${r.status}`);
    if (i < entries.length - 1 && r.status !== 'cached' && r.status !== 'skip' && !opts.dryRun) {
      await new Promise((res) => setTimeout(res, rateMs));
    }
  }
  return results;
}

// ----------------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------------

function parseArgs(argv) {
  const a = { dryRun: false, force: false };
  for (let i = 2; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === '--meta') a.meta = argv[++i];
    else if (tok === '--out') a.out = argv[++i];
    else if (tok === '--rate-ms') a.rateMs = Number(argv[++i]);
    else if (tok === '--dry-run') a.dryRun = true;
    else if (tok === '--force') a.force = true;
  }
  return a;
}

export async function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (!args.meta || !args.out) {
    console.error('Usage: fetch-pdfs.mjs --meta <meta.json> --out <dir> [--rate-ms <ms>] [--dry-run] [--force]');
    process.exit(1);
  }
  const meta = JSON.parse(fs.readFileSync(args.meta, 'utf8'));
  const entries = (meta.entries ?? []).filter((e) => e.arxiv_id);
  console.log(`Fetching ${entries.length} PDFs from arXiv into ${args.out}`);
  const results = await fetchBatch(entries, {
    outDir: args.out,
    dryRun: args.dryRun,
    force: args.force,
    rateMs: args.rateMs,
    log: console,
  });
  const ok = results.filter((r) => r.status === 'ok').length;
  const cached = results.filter((r) => r.status === 'cached').length;
  const err = results.filter((r) => r.status === 'error' || r.status === 'skip').length;
  console.log(`Done: ${ok} fetched, ${cached} cached, ${err} skipped/errored`);
  process.exit(err > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(2); });
}
