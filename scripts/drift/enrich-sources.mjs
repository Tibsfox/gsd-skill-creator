#!/usr/bin/env node
// scripts/drift/enrich-sources.mjs
// Permanent repo utility shipped by Phase 684 (v1.49.569 Drift in LLM Systems mission).
//
// Reads sources/extraction.yaml (hand-extracted from drift-mission.tex §Stage 2),
// hits arXiv API for each entry with a non-null arxiv_id to pull the verbatim abstract
// + venue + canonical URL, and emits sources/index.bib (BibTeX) + sources/meta.json.
//
// Verbatim-abstract rule (0684-CONTEXT.md §D-05): Haiku MUST NOT paraphrase. Abstract
// text written into meta.json comes directly from the arXiv API response. Entries with
// arxiv_id=null (Greenblatt 2024, Betley 2024, Lindsey 2025) ship with abstract=null
// and needs_manual_source_resolution=true for Phase 684.1 to resolve.
//
// CLI:
//   node scripts/drift/enrich-sources.mjs \
//     --extraction <path-to-extraction.yaml> \
//     --out-bib   <path-to-index.bib> \
//     --out-meta  <path-to-meta.json> \
//     [--cache <cache-dir>]   (default: <dir-of-extraction>/.arxiv-cache/)
//     [--dry-run]             (skip API fetches; emit from cache only)
//     [--rate-ms <ms>]        (rate limit between arXiv queries; default 3000)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARXIV_API = 'https://export.arxiv.org/api/query?search_query=id:';
const DEFAULT_RATE_MS = 3000;

// ----------------------------------------------------------------------------
// Tiny YAML reader (flat hash-of-lists, sufficient for extraction.yaml shape)
// We avoid adding a yaml dependency — extraction.yaml is simple enough to parse
// with a hand-rolled tokenizer. Rejects any indentation other than 2-space.
// ----------------------------------------------------------------------------

export function parseExtractionYaml(text) {
  const out = { schema_version: null, mission: null, extraction_date: null, primary: [], supporting: [] };
  const lines = text.split(/\r?\n/);
  let mode = null;          // 'primary' | 'supporting' | null (top-level)
  let cur = null;           // current record being built
  let inKeyFinding = false; // multi-line key_finding handling

  const flush = () => { if (cur && mode) { out[mode].push(cur); cur = null; } };

  for (let ln of lines) {
    const raw = ln;
    ln = ln.replace(/\t/g, '  ');
    if (!ln.trim() || ln.trim().startsWith('#')) continue;

    // top-level keys
    if (!raw.startsWith(' ')) {
      flush();
      mode = null;
      const m = ln.match(/^(\w+):\s*(.*)$/);
      if (!m) continue;
      const [, key, rest] = m;
      if (key === 'primary' || key === 'supporting') { mode = key; continue; }
      out[key] = rest.replace(/^["']|["']$/g, '') || null;
      continue;
    }

    // record start: "  - cite_key: ..."
    const dash = raw.match(/^ {2}-\s+(\w+):\s*(.*)$/);
    if (dash) {
      flush();
      cur = {};
      const [, key, val] = dash;
      cur[key] = coerce(val);
      continue;
    }

    // field: "    <key>: <value>"
    const field = raw.match(/^ {4}(\w+):\s*(.*)$/);
    if (field && cur) {
      const [, key, val] = field;
      cur[key] = coerce(val);
    }
  }
  flush();
  return out;
}

function coerce(v) {
  const s = (v ?? '').trim();
  if (s === '' || s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^\d+$/.test(s)) return Number(s);
  return s.replace(/^["']|["']$/g, '');
}

// ----------------------------------------------------------------------------
// arXiv API — single-entry fetch, returns { abstract, venue, url } or null
// ----------------------------------------------------------------------------

export async function fetchArxiv(arxivId, { cacheDir, dryRun, fetchImpl = globalThis.fetch } = {}) {
  if (!arxivId) return null;
  const safeId = arxivId.replace(/[^0-9.v]/g, '_');
  const cached = cacheDir && path.join(cacheDir, `${safeId}.json`);
  if (cached && fs.existsSync(cached)) {
    return JSON.parse(fs.readFileSync(cached, 'utf8'));
  }
  if (dryRun) return null;
  if (!fetchImpl) throw new Error('fetch not available — use Node 18+ or inject fetchImpl');

  const url = ARXIV_API + encodeURIComponent(arxivId);
  const res = await fetchImpl(url, { headers: { 'User-Agent': 'drift-mission/1.0 (tibsfox.com)' } });
  if (!res.ok) throw new Error(`arXiv API returned ${res.status} for ${arxivId}`);
  const xml = await res.text();

  const absMatch = xml.match(/<summary>([\s\S]*?)<\/summary>/);
  const linkMatch = xml.match(/<id>([\s\S]*?)<\/id>/);
  const publishedMatch = xml.match(/<published>([\s\S]*?)<\/published>/);
  const record = {
    abstract: absMatch ? absMatch[1].trim().replace(/\s+/g, ' ') : null,
    venue: 'arXiv',
    url: linkMatch ? linkMatch[1].trim() : `https://arxiv.org/abs/${arxivId}`,
    published: publishedMatch ? publishedMatch[1].trim() : null,
  };
  if (cached) {
    fs.mkdirSync(path.dirname(cached), { recursive: true });
    fs.writeFileSync(cached, JSON.stringify(record, null, 2));
  }
  return record;
}

// ----------------------------------------------------------------------------
// BibTeX emission
// ----------------------------------------------------------------------------

export function toBibEntry(rec, enrichment) {
  const typeMap = { null: 'misc' };
  const type = rec.arxiv_id ? 'misc' : (typeMap[rec.venue] ?? 'misc');
  const fields = [
    ['author', rec.authors || ''],
    ['title', rec.title || ''],
    ['year', String(rec.year || '')],
  ];
  if (rec.arxiv_id) {
    fields.push(['eprint', rec.arxiv_id]);
    fields.push(['archivePrefix', 'arXiv']);
  }
  const v = enrichment?.venue ?? rec.venue;
  if (v) fields.push(['howpublished', v]);
  const url = enrichment?.url;
  if (url) fields.push(['url', url]);
  const body = fields
    .filter(([, val]) => val !== '' && val != null)
    .map(([k, val]) => `  ${k} = {${String(val).replace(/[{}]/g, '')}}`)
    .join(',\n');
  return `@${type}{${rec.cite_key},\n${body}\n}`;
}

// ----------------------------------------------------------------------------
// meta.json emission
// ----------------------------------------------------------------------------

export function toMetaEntry(rec, enrichment) {
  return {
    cite_key: rec.cite_key,
    tier: rec.tier,
    authors: rec.authors,
    year: rec.year,
    arxiv_id: rec.arxiv_id,
    title: rec.title,
    venue: enrichment?.venue ?? rec.venue ?? null,
    url: enrichment?.url ?? (rec.arxiv_id ? `https://arxiv.org/abs/${rec.arxiv_id}` : null),
    module: rec.module,
    // verbatim abstract from arXiv (never paraphrased); null if no arxiv_id
    abstract: enrichment?.abstract ?? null,
    // hand-distilled <=30-word finding from Stage-2 prose
    key_finding: rec.key_finding,
    // Phase 684.1 populates these three:
    review_status: null,
    rigor_score: null,
    rigor_concerns: null,
    surface_fit: null,
    opus_notes: null,
    // flag for 684.1 to resolve non-arXiv prose mentions
    needs_manual_source_resolution: rec.needs_manual_source_resolution === true,
  };
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { dryRun: false, rateMs: DEFAULT_RATE_MS };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--extraction') args.extraction = argv[++i];
    else if (a === '--out-bib') args.outBib = argv[++i];
    else if (a === '--out-meta') args.outMeta = argv[++i];
    else if (a === '--cache') args.cache = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--rate-ms') args.rateMs = Number(argv[++i]);
  }
  return args;
}

export async function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (!args.extraction || !args.outBib || !args.outMeta) {
    console.error('Usage: enrich-sources.mjs --extraction <yaml> --out-bib <bib> --out-meta <json> [--cache <dir>] [--dry-run] [--rate-ms <ms>]');
    process.exit(1);
  }
  const cacheDir = args.cache ?? path.join(path.dirname(args.extraction), '.arxiv-cache');
  fs.mkdirSync(cacheDir, { recursive: true });

  const text = fs.readFileSync(args.extraction, 'utf8');
  const extracted = parseExtractionYaml(text);
  const all = [...(extracted.primary || []), ...(extracted.supporting || [])];

  const bibEntries = [];
  const metaEntries = [];

  for (const rec of all) {
    let enrichment = null;
    if (rec.arxiv_id) {
      try {
        enrichment = await fetchArxiv(rec.arxiv_id, { cacheDir, dryRun: args.dryRun });
      } catch (err) {
        console.warn(`! ${rec.cite_key} (${rec.arxiv_id}): ${err.message}`);
      }
      if (!args.dryRun) await new Promise((r) => setTimeout(r, args.rateMs));
    }
    bibEntries.push(toBibEntry(rec, enrichment));
    metaEntries.push(toMetaEntry(rec, enrichment));
    console.log(`  ${rec.cite_key.padEnd(30)} ${rec.tier.padEnd(10)} ${enrichment ? 'enriched' : 'cached/skipped'}`);
  }

  fs.mkdirSync(path.dirname(args.outBib), { recursive: true });
  fs.writeFileSync(args.outBib, bibEntries.join('\n\n') + '\n');
  fs.mkdirSync(path.dirname(args.outMeta), { recursive: true });
  fs.writeFileSync(args.outMeta, JSON.stringify({
    schema_version: extracted.schema_version,
    mission: extracted.mission,
    generated_date: new Date().toISOString().split('T')[0],
    primary_count: (extracted.primary || []).length,
    supporting_count: (extracted.supporting || []).length,
    entries: metaEntries,
  }, null, 2) + '\n');

  console.log(`\n✓ Wrote ${bibEntries.length} BibTeX entries to ${args.outBib}`);
  console.log(`✓ Wrote ${metaEntries.length} meta records to ${args.outMeta}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
