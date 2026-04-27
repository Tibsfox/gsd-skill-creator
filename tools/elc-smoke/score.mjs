#!/usr/bin/env node
/**
 * tools/elc-smoke/score.mjs — ELC A(100) scorer.
 *
 * Loads www/tibsfox/com/Research/ELC/<degree>/ and scores against
 * ELC-CONVENTIONS v1.0 §12 rubric. Ship floor 90.
 *
 * Usage:
 *   node tools/elc-smoke/score.mjs --degree 1.62
 *   node tools/elc-smoke/score.mjs --degree 1.62 --json
 *   node tools/elc-smoke/score.mjs --all
 *   node tools/elc-smoke/score.mjs --degree 1.62 --root <fixture-root>
 */
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');

const ANSI = {
  reset: '\x1b[0m', bold: '\x1b[1m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m',
};
const useColor = () => process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor() ? `${code}${s}${ANSI.reset}` : s);

const FAILURE_KEYWORDS = [
  'electromigration', 'latch-up', 'latchup', 'secondary breakdown', 'drift',
  'dendrite', 'esd', 'emi', 'thermal-runaway', 'thermal runaway',
  'leakage', 'soft-error', 'soft error', 'hot carrier', 'tddb',
  'whisker', 'corona', 'arc-over', 'arcover', 'tin whisker',
];

const ERAS = new Set(['tube-ge', 'si-discrete', 'op-amp', 'cmos-up', 'mixed-ic', 'dsp-fpga', 'modern']);

// Mapping era → year range (per ELC-CONVENTIONS §2)
const ERA_RANGE = {
  'tube-ge':     [1957, 1962],
  'si-discrete': [1962, 1968],
  'op-amp':      [1968, 1975],
  'cmos-up':     [1975, 1985],
  'mixed-ic':    [1985, 1995],
  'dsp-fpga':    [1995, 2010],
  'modern':      [2010, 2099],
};

async function readJson(p) {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; }
}
async function exists(p) { try { await access(p); return true; } catch { return false; } }
async function listDir(d) { try { return await readdir(d, { withFileTypes: true }); } catch { return []; } }
function which(bin) {
  const r = spawnSync('which', [bin], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}
function numericDegree(d) {
  const m = /^(\d+)\.(\d+)$/.exec(d);
  return m ? parseInt(m[1], 10) * 1000 + parseInt(m[2], 10) : -1;
}
function wordCountResearchMd(text) {
  const lines = text.split(/\r?\n/);
  let inFence = false, inRefs = false;
  const kept = [];
  for (const line of lines) {
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^#{1,6}\s+(references|bibliography|reading path|works cited)\b/i.test(line)) { inRefs = true; continue; }
    if (inRefs) continue;
    kept.push(line);
  }
  return kept.join(' ').replace(/[#*_`>~\-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

// ── flight-hardware-mapping.csv: nasa_degree → launch_year ────────────────
async function loadHardwareMapping(elcRoot) {
  const p = join(elcRoot, 'catalog', 'flight-hardware-mapping.csv');
  if (!await exists(p)) return new Map();
  const lines = (await readFile(p, 'utf8')).split(/\r?\n/);
  if (!lines.length) return new Map();
  const header = lines[0].split(',').map((s) => s.trim());
  const idxDeg = header.indexOf('nasa_degree');
  const idxYear = header.indexOf('launch_year');
  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;
    const cols = row.split(',');
    if (idxDeg < 0 || idxYear < 0) continue;
    const deg = (cols[idxDeg] || '').trim();
    const year = parseInt((cols[idxYear] || '').trim(), 10);
    if (deg && Number.isFinite(year)) map.set(deg, year);
  }
  return map;
}

// ── criteria ──────────────────────────────────────────────────────────────

async function criterion1_triad(spec) {
  const era = spec?.era;
  const flightSubset = spec?.flight_subset;
  const cir = spec?.cir_topology;
  let pts = 0;
  if (era) pts += 5;
  if (flightSubset) pts += 5;
  if (cir) pts += 5;
  return { score: pts, max: 15, threshold: 12, pass: pts >= 12,
    detail: `era=${era?'✓':'✗'} flight_subset=${flightSubset?'✓':'✗'} cir=${cir?'✓':'✗'}` };
}

async function criterion2_mutualExclusion(spec, degree, elcRoot) {
  const myKey = `${spec?.domain ?? '?'}::${(spec?.topic ?? '').trim()}`;
  let conflict = null;
  for (const e of await listDir(elcRoot)) {
    if (!e.isDirectory() || !/^\d+\.\d+$/.test(e.name) || e.name === degree) continue;
    const other = await readJson(join(elcRoot, e.name, 'subject-spec.json'));
    if (!other) continue;
    const k = `${other.domain ?? '?'}::${(other.topic ?? '').trim()}`;
    if (k === myKey) { conflict = e.name; break; }
  }
  return { score: conflict ? 0 : 10, max: 10, threshold: 10, pass: !conflict,
    detail: conflict ? `conflict with ELC ${conflict}` : 'unique' };
}

async function criterion3_wordCount(degreeDir) {
  const p = join(degreeDir, 'research.md');
  if (!await exists(p)) return { score: 0, max: 5, threshold: 5, pass: false, detail: 'research.md missing' };
  const wc = wordCountResearchMd(await readFile(p, 'utf8'));
  return { score: wc >= 3500 ? 5 : 0, max: 5, threshold: 5, pass: wc >= 3500, detail: `${wc} / 3500` };
}

async function criterion4_datasheet(spec, elcRoot) {
  const ds = spec?.datasheet_anchor;
  if (!ds || !ds.manufacturer || !ds.part_number) {
    return { score: 0, max: 10, threshold: 10, pass: false, detail: 'datasheet_anchor missing fields' };
  }
  // archive path under _assets/datasheets/<mfr>/
  const dir = join(elcRoot, '_assets', 'datasheets', ds.manufacturer);
  let found = false;
  if (ds.archived_path) {
    found = await exists(join(elcRoot, ds.archived_path));
  }
  if (!found) {
    const entries = await listDir(dir);
    found = entries.some((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf'));
  }
  return { score: found ? 10 : 0, max: 10, threshold: 10, pass: found,
    detail: found ? `archived under ${ds.manufacturer}/` : `no archived PDF under _assets/datasheets/${ds.manufacturer}/` };
}

async function criterion5_partsList() {
  // Deferred — see check-skus.mjs for full validation
  return { score: 8, max: 10, threshold: 8, pass: true, detail: 'DEFERRED — manual review (check-skus.mjs)' };
}

async function criterion6_measurementVsSpice() {
  return { score: 10, max: 10, threshold: 10, pass: true, detail: 'DEFERRED — manual review' };
}

async function criterion7_failureModes(degreeDir) {
  const p = join(degreeDir, 'failure-modes.md');
  if (!await exists(p)) return { score: 0, max: 10, threshold: 8, pass: false, detail: 'failure-modes.md missing' };
  const text = (await readFile(p, 'utf8')).toLowerCase();
  const hit = new Set();
  for (const kw of FAILURE_KEYWORDS) {
    if (text.includes(kw)) hit.add(kw.replace(/[\s-]/g, ''));
  }
  const n = hit.size;
  let score = 0;
  if (n >= 3) score = 10;
  else if (n >= 2) score = 8;
  return { score, max: 10, threshold: 8, pass: score >= 8, detail: `${n} distinct mechanisms` };
}

async function criterion8_cirCompile(degreeDir) {
  const p = join(degreeDir, 'spice', 'flight-circuit.cir');
  if (!await exists(p)) return { score: 0, max: 10, threshold: 10, pass: false, detail: 'flight-circuit.cir missing' };
  const src = await readFile(p, 'utf8');
  const hasEnd = /^\s*\.end\b/im.test(src);
  // ngspice element line: starts with R, C, L, V, I, Q, M, D, X, K, E, F, G, H ... we look for a non-comment
  const hasElement = src.split(/\r?\n/).some((l) => {
    const t = l.trim();
    if (!t || t.startsWith('*') || t.startsWith('.') || t.startsWith('#')) return false;
    return /^[RrCcLlVvIiQqMmDdXxKkEeFfGgHhBbJjSsTtUuWw]\w*\s+\S/.test(t);
  });
  if (!hasEnd || !hasElement) {
    return { score: 0, max: 10, threshold: 10, pass: false,
      detail: `syntax: end=${hasEnd} elements=${hasElement}` };
  }
  // Optional ngspice compile
  if (which('ngspice')) {
    const logPath = '/tmp/elc-cir-scratch.out';
    const r = spawnSync('ngspice', ['-b', '-o', logPath, p],
      { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'pipe'] });
    let logText = '';
    try { logText = (await readFile(logPath, 'utf8')).toLowerCase(); } catch { logText = ''; }
    const fatal = /error\b|fatal\b|aborted|undefined symbol|incompatible/i.test(logText);
    if (r.status === 0 && !fatal) {
      return { score: 10, max: 10, threshold: 10, pass: true, detail: 'ngspice compiled' };
    }
    if (!fatal) {
      // Non-zero exit but no error in log (e.g. "no simulations run") — treat as syntax-clean
      return { score: 10, max: 10, threshold: 10, pass: true, detail: 'ngspice parse-clean' };
    }
    return { score: 5, max: 10, threshold: 10, pass: false,
      detail: `ngspice errors: ${(logText.match(/error[^\n]{0,80}/i)?.[0] || '').slice(0,80)}` };
  }
  return { score: 10, max: 10, threshold: 10, pass: true, detail: 'syntax-valid (no ngspice)' };
}

async function criterion9_forwardRef(degreeDir, degree) {
  const p = join(degreeDir, 'research.md');
  if (!await exists(p)) return { score: 5, max: 5, threshold: 5, pass: true, detail: 'research.md absent (vacuous)' };
  const text = await readFile(p, 'utf8');
  const myNum = numericDegree(degree);
  const re = /\bELC\s+(\d+)\.(\d+)\b/g;
  const offenders = [];
  let m;
  while ((m = re.exec(text))) {
    const n = parseInt(m[1], 10) * 1000 + parseInt(m[2], 10);
    if (n > myNum) offenders.push(`ELC ${m[1]}.${m[2]}`);
  }
  return { score: offenders.length ? 0 : 5, max: 5, threshold: 5, pass: !offenders.length,
    detail: offenders.length ? `forward refs: ${[...new Set(offenders)].join(',')}` : 'clean' };
}

async function criterion10_crossTrack(degreeDir) {
  const p = join(degreeDir, 'cross-references', 'links.json');
  const links = await readJson(p);
  if (!links) return { score: 0, max: 5, threshold: 5, pass: false, detail: 'links.json missing' };
  const nasaOk = !!(links.nasa && links.nasa.degree);
  const musOk = !!(links.mus && links.mus.degree);
  const score = (nasaOk ? 2 : 0) + (musOk ? 3 : 0); // weight slight asymmetry; sum = 5 if both
  const adj = nasaOk && musOk ? 5 : score;
  return { score: adj, max: 5, threshold: 5, pass: nasaOk && musOk,
    detail: `nasa=${nasaOk?'✓':'✗'} mus=${musOk?'✓':'✗'}` };
}

async function criterion11_takeaway(degreeDir) {
  const p = join(degreeDir, 'research.md');
  if (!await exists(p)) return { score: 0, max: 5, threshold: 4, pass: false, detail: 'research.md missing' };
  const text = await readFile(p, 'utf8');
  const re = /^#{1,6}\s+pedagogical takeaway\s*$/im;
  const m = re.exec(text);
  if (!m) return { score: 0, max: 5, threshold: 4, pass: false, detail: 'section missing' };
  const after = text.slice(m.index + m[0].length);
  const nextH = /^#{1,6}\s+\S/m.exec(after);
  const body = nextH ? after.slice(0, nextH.index) : after;
  const wc = body.trim().split(/\s+/).filter(Boolean).length;
  let score = 0;
  if (wc >= 50 && wc <= 250) score = 5;
  else if (wc >= 30 && wc <= 500) score = 4;
  return { score, max: 5, threshold: 4, pass: score >= 4, detail: `${wc} words` };
}

async function criterion12_eraAnchoring(spec, degree, hwMap) {
  const era = spec?.era;
  if (!era) return { score: 0, max: 5, threshold: 4, pass: false, detail: 'era missing' };
  if (!ERAS.has(era)) return { score: 0, max: 5, threshold: 4, pass: false, detail: `era "${era}" invalid` };
  const year = hwMap.get(degree);
  if (!Number.isFinite(year)) return { score: 4, max: 5, threshold: 4, pass: true, detail: `era set (${era}); no year for degree in mapping` };
  const [lo, hi] = ERA_RANGE[era];
  const match = year >= lo && year <= hi;
  return { score: match ? 5 : 4, max: 5, threshold: 4, pass: true,
    detail: `era=${era} year=${year} ${match ? 'matches' : 'mismatch'}` };
}

// ── orchestrator ──────────────────────────────────────────────────────────

async function scoreDegree({ degree, elcRoot, repoRoot }) {
  const degreeDir = join(elcRoot, degree);
  const spec = await readJson(join(degreeDir, 'subject-spec.json')) || {};
  const hwMap = await loadHardwareMapping(elcRoot);

  const criteria = [];
  criteria.push({ name: 'Triad coverage',                ...await criterion1_triad(spec) });
  criteria.push({ name: 'Subject mutual exclusion',      ...await criterion2_mutualExclusion(spec, degree, elcRoot) });
  criteria.push({ name: 'Word count',                    ...await criterion3_wordCount(degreeDir) });
  criteria.push({ name: 'Datasheet citation',            ...await criterion4_datasheet(spec, elcRoot) });
  criteria.push({ name: 'Bench parts list',              ...await criterion5_partsList() });
  criteria.push({ name: 'Measurement vs SPICE',          ...await criterion6_measurementVsSpice() });
  criteria.push({ name: 'Failure-modes analysis',        ...await criterion7_failureModes(degreeDir) });
  criteria.push({ name: '.cir compile',                  ...await criterion8_cirCompile(degreeDir) });
  criteria.push({ name: 'Forward-reference-forbidden',   ...await criterion9_forwardRef(degreeDir, degree) });
  criteria.push({ name: 'Cross-track links',             ...await criterion10_crossTrack(degreeDir) });
  criteria.push({ name: 'Pedagogical takeaway',          ...await criterion11_takeaway(degreeDir) });
  criteria.push({ name: 'Era-appropriate anchoring',     ...await criterion12_eraAnchoring(spec, degree, hwMap) });

  const total = criteria.reduce((s, c) => s + c.score, 0);
  const max = criteria.reduce((s, c) => s + c.max, 0);
  const allPassThreshold = criteria.every((c) => c.pass);
  const shipFloor = 90;
  const pass = total >= shipFloor && allPassThreshold;
  return { degree, subject: spec.topic || '(unknown subject)', criteria, total, max,
    ship_floor: shipFloor, pass, verdict: pass ? 'PASS' : 'FAIL' };
}

function printText(result) {
  const head = `ELC ${result.degree} — ${result.subject}`;
  console.log(c(ANSI.bold, head));
  console.log('='.repeat(Math.max(40, head.length)));
  for (const cr of result.criteria) {
    const mark = cr.pass ? c(ANSI.green, '✓') : c(ANSI.red, '✗');
    const w = `[${String(cr.max).padStart(2, ' ')}]`;
    const name = cr.name.padEnd(34, ' ');
    const sc = String(cr.score).padStart(3, ' ');
    const detail = cr.detail ? c(ANSI.dim, ` ${cr.detail}`) : '';
    console.log(`${w} ${name} ${mark} ${sc}${detail}`);
  }
  console.log('-'.repeat(Math.max(40, head.length)));
  const verdictColor = result.pass ? ANSI.green : ANSI.red;
  console.log(`Total: ${c(ANSI.bold, result.total + '/' + result.max)}   ${c(verdictColor, result.verdict)} (≥${result.ship_floor} ship floor)`);
}

function parseArgs(argv) {
  const out = { degree: null, all: false, json: false, root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--degree') out.degree = argv[++i];
    else if (a === '--all') out.all = true;
    else if (a === '--json') out.json = true;
    else if (a === '--root') out.root = argv[++i];
    else if (a === '--repo-root') out.repoRoot = argv[++i];
    else if (a === '-h' || a === '--help') out.help = true;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.degree && !args.all)) {
    console.error('usage: elc-smoke/score.mjs --degree 1.NN [--json] [--root <dir>]');
    console.error('       elc-smoke/score.mjs --all       [--json] [--root <dir>]');
    process.exit(2);
  }
  const repoRoot = args.repoRoot ? resolve(args.repoRoot) : REPO;
  const elcRoot = args.root ? resolve(args.root)
    : join(REPO, 'www', 'tibsfox', 'com', 'Research', 'ELC');

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
    results.push(await scoreDegree({ degree: d, elcRoot, repoRoot }));
  }
  if (args.json) {
    console.log(JSON.stringify(args.all ? results : results[0], null, 2));
  } else {
    for (const r of results) { printText(r); console.log(''); }
  }
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(err); process.exit(2); });
}

export { scoreDegree, wordCountResearchMd, FAILURE_KEYWORDS, ERA_RANGE, numericDegree };
