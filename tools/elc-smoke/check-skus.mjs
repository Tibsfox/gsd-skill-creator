#!/usr/bin/env node
/**
 * tools/elc-smoke/check-skus.mjs — verify Mouser/Digi-Key SKUs cited in ELC
 * bench-notes.md against the offline catalog (and optionally HTTP).
 *
 * Usage:
 *   node tools/elc-smoke/check-skus.mjs --degree 1.62
 *   node tools/elc-smoke/check-skus.mjs --all
 *   node tools/elc-smoke/check-skus.mjs --degree 1.62 --online
 *   node tools/elc-smoke/check-skus.mjs --root <fixture-root>
 *
 * Default: offline mode — checks each SKU is listed in
 *   catalog/parts-catalog/mouser-skus.csv  or  digikey-skus.csv
 * --online: HTTP-fetch the SKU page; tag "Active" / "Inactive" / "unknown".
 */
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');

const ANSI = {
  reset: '\x1b[0m', bold: '\x1b[1m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', dim: '\x1b[2m',
};
const useColor = () => process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor() ? `${code}${s}${ANSI.reset}` : s);

async function exists(p) { try { await access(p); return true; } catch { return false; } }
async function listDir(d) { try { return await readdir(d, { withFileTypes: true }); } catch { return []; } }
function numericDegree(d) {
  const m = /^(\d+)\.(\d+)$/.exec(d);
  return m ? parseInt(m[1], 10) * 1000 + parseInt(m[2], 10) : -1;
}

// ── SKU extraction ────────────────────────────────────────────────────────

const MOUSER_RE = /https?:\/\/(?:www\.)?mouser\.com\/ProductDetail\/([^\s)>"']+)/gi;
const DIGIKEY_RE = /https?:\/\/(?:www\.)?digikey\.com\/(?:en\/)?products\/(?:detail\/)?([^\s)>"']+)/gi;

function extractSkus(text) {
  const out = { mouser: new Set(), digikey: new Set() };
  let m;
  while ((m = MOUSER_RE.exec(text))) {
    // Mouser SKU is the trailing path segment, often "<MFR>/<PART>?qs=..."
    const raw = m[1].replace(/[?#].*$/, '').replace(/\/$/, '');
    out.mouser.add(raw);
  }
  while ((m = DIGIKEY_RE.exec(text))) {
    const raw = m[1].replace(/[?#].*$/, '').replace(/\/$/, '');
    out.digikey.add(raw);
  }
  return out;
}

// ── Catalog loading ───────────────────────────────────────────────────────

async function loadCatalog(elcRoot) {
  const cat = { mouser: new Set(), digikey: new Set() };
  const m = join(elcRoot, 'catalog', 'parts-catalog', 'mouser-skus.csv');
  const d = join(elcRoot, 'catalog', 'parts-catalog', 'digikey-skus.csv');
  if (await exists(m)) {
    for (const line of (await readFile(m, 'utf8')).split(/\r?\n/).slice(1)) {
      const sku = line.split(',')[0]?.trim();
      if (sku) cat.mouser.add(sku);
    }
  }
  if (await exists(d)) {
    for (const line of (await readFile(d, 'utf8')).split(/\r?\n/).slice(1)) {
      const sku = line.split(',')[0]?.trim();
      if (sku) cat.digikey.add(sku);
    }
  }
  return cat;
}

function catalogContains(catSet, sku) {
  if (catSet.has(sku)) return true;
  // Allow trailing-slash / case fuzz; also match by last path component
  for (const c of catSet) {
    if (c === sku) return true;
    if (c.split('/').pop() === sku.split('/').pop()) return true;
  }
  return false;
}

// ── Online check (best-effort) ────────────────────────────────────────────

async function fetchActiveStatus(url) {
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'user-agent': 'gsd-skill-creator-elc-smoke/1.0' } });
    if (!res.ok) return { ok: false, status: 'fetch-failed', code: res.status };
    const text = await res.text();
    if (/\bActive\b/i.test(text)) return { ok: true, status: 'Active' };
    if (/\b(Obsolete|NRND|Inactive|Discontinued)\b/i.test(text)) return { ok: false, status: 'Obsolete/NRND' };
    return { ok: true, status: 'unknown' };
  } catch (err) {
    return { ok: false, status: 'fetch-err', err: String(err) };
  }
}

// ── Per-degree check ──────────────────────────────────────────────────────

async function checkDegree({ degree, elcRoot, online, catalog }) {
  const benchPath = join(elcRoot, degree, 'bench-notes.md');
  const result = { degree, mouser: [], digikey: [], summary: { total: 0, valid: 0, invalid: 0 }, missing: false };
  if (!await exists(benchPath)) {
    result.missing = true;
    return result;
  }
  const text = await readFile(benchPath, 'utf8');
  const skus = extractSkus(text);

  for (const sku of skus.mouser) {
    const inCat = catalogContains(catalog.mouser, sku);
    let entry = { sku, source: 'mouser', in_catalog: inCat, online: null };
    if (online) {
      const url = `https://www.mouser.com/ProductDetail/${sku}`;
      entry.online = await fetchActiveStatus(url);
    }
    const valid = inCat && (online ? entry.online.ok : true);
    entry.valid = valid;
    result.mouser.push(entry);
  }
  for (const sku of skus.digikey) {
    const inCat = catalogContains(catalog.digikey, sku);
    let entry = { sku, source: 'digikey', in_catalog: inCat, online: null };
    if (online) {
      const url = `https://www.digikey.com/en/products/${sku}`;
      entry.online = await fetchActiveStatus(url);
    }
    const valid = inCat && (online ? entry.online.ok : true);
    entry.valid = valid;
    result.digikey.push(entry);
  }
  const all = [...result.mouser, ...result.digikey];
  result.summary.total = all.length;
  result.summary.valid = all.filter((e) => e.valid).length;
  result.summary.invalid = all.filter((e) => !e.valid).length;
  return result;
}

function printResult(r, online) {
  const head = `ELC ${r.degree} — SKU check${online ? ' (online)' : ' (offline)'}`;
  console.log(c(ANSI.bold, head));
  console.log('-'.repeat(Math.max(40, head.length)));
  if (r.missing) {
    console.log(c(ANSI.yellow, 'bench-notes.md not found — skipped'));
    return;
  }
  for (const e of [...r.mouser, ...r.digikey]) {
    const mark = e.valid ? c(ANSI.green, '✓') : c(ANSI.red, '✗');
    const onl = e.online ? ` online=${e.online.status}` : '';
    console.log(`  ${mark} [${e.source}] ${e.sku} catalog=${e.in_catalog}${c(ANSI.dim, onl)}`);
  }
  if (r.summary.total === 0) console.log(c(ANSI.yellow, '  (no SKU links found in bench-notes.md)'));
  console.log(`  ${r.summary.valid}/${r.summary.total} valid`);
}

function parseArgs(argv) {
  const out = { degree: null, all: false, online: false, json: false, root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--degree') out.degree = argv[++i];
    else if (a === '--all') out.all = true;
    else if (a === '--online') out.online = true;
    else if (a === '--json') out.json = true;
    else if (a === '--root') out.root = argv[++i];
    else if (a === '-h' || a === '--help') out.help = true;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.degree && !args.all)) {
    console.error('usage: elc-smoke/check-skus.mjs --degree 1.NN [--online] [--json]');
    console.error('       elc-smoke/check-skus.mjs --all       [--online] [--json]');
    process.exit(2);
  }
  if (args.online && typeof fetch !== 'function') {
    console.error('--online requires Node ≥ 18 with global fetch; aborting');
    process.exit(2);
  }
  const elcRoot = args.root ? resolve(args.root)
    : join(REPO, 'www', 'tibsfox', 'com', 'Research', 'ELC');
  const catalog = await loadCatalog(elcRoot);

  let degrees;
  if (args.all) {
    const entries = await listDir(elcRoot);
    degrees = entries.filter((e) => e.isDirectory() && /^\d+\.\d+$/.test(e.name)).map((e) => e.name);
    degrees.sort((a, b) => numericDegree(a) - numericDegree(b));
  } else {
    degrees = [args.degree];
  }

  const results = [];
  for (const d of degrees) {
    results.push(await checkDegree({ degree: d, elcRoot, online: args.online, catalog }));
  }
  if (args.json) {
    console.log(JSON.stringify(args.all ? results : results[0], null, 2));
  } else {
    for (const r of results) { printResult(r, args.online); console.log(''); }
  }
  const allOk = results.every((r) => r.missing || r.summary.invalid === 0);
  process.exit(allOk ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(err); process.exit(2); });
}

export { extractSkus, loadCatalog, catalogContains, checkDegree };
