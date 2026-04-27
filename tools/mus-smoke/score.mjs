#!/usr/bin/env node
/**
 * tools/mus-smoke/score.mjs — MUS A(100) scorer.
 *
 * Loads www/tibsfox/com/Research/MUS/<degree>/ and scores against
 * MUS-CONVENTIONS v1.0 §11 rubric. Ship floor 90.
 *
 * Usage:
 *   node tools/mus-smoke/score.mjs --degree 1.62
 *   node tools/mus-smoke/score.mjs --degree 1.62 --json
 *   node tools/mus-smoke/score.mjs --all
 *   node tools/mus-smoke/score.mjs --degree 1.62 --root <fixture-root>
 */
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');

const FAILURE_KEYWORDS = []; // unused for MUS

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};
const useColor = () => process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor() ? `${code}${s}${ANSI.reset}` : s);

// ── filesystem helpers ────────────────────────────────────────────────────

async function readJson(p) {
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function listDir(d) {
  try { return await readdir(d, { withFileTypes: true }); } catch { return []; }
}

function which(bin) {
  const r = spawnSync('which', [bin], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

// ── word-count (excludes fenced code blocks + reference list) ─────────────

function wordCountResearchMd(text) {
  const lines = text.split(/\r?\n/);
  let inFence = false;
  let inRefs = false;
  const kept = [];
  for (const line of lines) {
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    // Reference-list heuristic: drop everything from a "## References" /
    // "## Reading Path" / "## Bibliography" heading to EOF.
    if (/^#{1,6}\s+(references|bibliography|reading path|works cited)\b/i.test(line)) {
      inRefs = true;
      continue;
    }
    if (inRefs) continue;
    kept.push(line);
  }
  const text2 = kept.join(' ').replace(/[#*_`>~\-]/g, ' ');
  const words = text2.split(/\s+/).filter(Boolean);
  return words.length;
}

// ── LilyPond syntax validity ──────────────────────────────────────────────

function lilypondValid(src) {
  return /\\version\s/.test(src) && /\\score\s*\{[\s\S]*\}/m.test(src);
}

// ── Faust syntax validity ─────────────────────────────────────────────────

function faustValid(src) {
  return /import\s*\(\s*"stdfaust\.lib"\s*\)/.test(src) ||
         /^\s*process\s*=/m.test(src);
}

// ── Compare degrees as numbers (1.5 < 1.10 lexically wrong) ───────────────

function numericDegree(d) {
  // "1.62" → 0162 ; treat digits-after-dot as integer
  const m = /^(\d+)\.(\d+)$/.exec(d);
  if (!m) return -1;
  return parseInt(m[1], 10) * 1000 + parseInt(m[2], 10);
}

// ── criteria ──────────────────────────────────────────────────────────────

async function criterion1_triadCoverage(spec) {
  // 5 points each for nasa / s36 / sps presence
  const t = spec?.triad || {};
  const has = (o) => o && typeof o === 'object' && Object.keys(o).length > 0;
  let pts = 0;
  if (has(t.nasa)) pts += 5;
  if (has(t.s36)) pts += 5;
  if (has(t.sps)) pts += 5;
  return { score: pts, max: 15, threshold: 12, pass: pts >= 12,
    detail: `nasa=${has(t.nasa)?'✓':'✗'} s36=${has(t.s36)?'✓':'✗'} sps=${has(t.sps)?'✓':'✗'}` };
}

async function criterion2_mutualExclusion(spec, degree, mussRoot) {
  const myKey = `${spec?.domain ?? '?'}::${(spec?.topic ?? '').trim()}`;
  const entries = await listDir(mussRoot);
  let conflict = null;
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (!/^\d+\.\d+$/.test(e.name)) continue;
    if (e.name === degree) continue;
    const otherSpec = await readJson(join(mussRoot, e.name, 'subject-spec.json'));
    if (!otherSpec) continue;
    const k = `${otherSpec.domain ?? '?'}::${(otherSpec.topic ?? '').trim()}`;
    if (k === myKey) { conflict = e.name; break; }
  }
  return { score: conflict ? 0 : 10, max: 10, threshold: 10, pass: !conflict,
    detail: conflict ? `conflict with MUS ${conflict}` : 'unique' };
}

async function criterion3_wordCount(degreeDir) {
  const p = join(degreeDir, 'research.md');
  if (!await exists(p)) return { score: 0, max: 5, threshold: 5, pass: false, detail: 'research.md missing' };
  const text = await readFile(p, 'utf8');
  const wc = wordCountResearchMd(text);
  const pass = wc >= 3500;
  return { score: pass ? 5 : 0, max: 5, threshold: 5, pass,
    detail: `${wc} / 3500` };
}

async function criterion4_scoreExample(degreeDir) {
  const p = join(degreeDir, 'score', 'example-1.ly');
  if (!await exists(p)) return { score: 0, max: 10, threshold: 10, pass: false, detail: 'score/example-1.ly missing' };
  const src = await readFile(p, 'utf8');
  if (!lilypondValid(src)) return { score: 0, max: 10, threshold: 10, pass: false, detail: 'invalid LilyPond syntax' };
  // optional compile if lilypond available
  if (which('lilypond')) {
    const r = spawnSync('lilypond', ['--version'], { encoding: 'utf8' });
    if (r.status !== 0) return { score: 5, max: 10, threshold: 10, pass: false, detail: 'lilypond present but not invokable' };
  }
  return { score: 10, max: 10, threshold: 10, pass: true, detail: 'valid syntax' };
}

async function criterion5_audioDemos(degreeDir) {
  const dir = join(degreeDir, 'audio-demos');
  const entries = await listDir(dir);
  const dsps = entries.filter((e) => e.isFile() && e.name.endsWith('.dsp'));
  if (dsps.length < 2) return { score: 0, max: 10, threshold: 10, pass: false, detail: `${dsps.length} .dsp files (need ≥2)` };
  let valid = 0;
  for (const e of dsps) {
    const src = await readFile(join(dir, e.name), 'utf8');
    if (faustValid(src)) valid++;
  }
  if (valid < 2) return { score: 0, max: 10, threshold: 10, pass: false, detail: `${valid}/${dsps.length} valid Faust syntax` };
  return { score: 10, max: 10, threshold: 10, pass: true, detail: `${valid} files valid` };
}

async function criterion6_spectrograms(degreeDir) {
  const a = join(degreeDir, 'spectrograms', 'species-call.png');
  const b = join(degreeDir, 'spectrograms', 'artist-work-clip.png');
  const ea = await exists(a);
  const eb = await exists(b);
  const pts = (ea ? 5 : 0) + (eb ? 5 : 0);
  return { score: pts, max: 10, threshold: 10, pass: pts === 10,
    detail: `species=${ea?'✓':'✗'} artist=${eb?'✓':'✗'}` };
}

async function criterion7_pedAnchor(spec) {
  const arr = spec?.pedagogical_anchors;
  if (!Array.isArray(arr)) return { score: 0, max: 10, threshold: 8, pass: false, detail: 'no anchors array' };
  if (arr.length === 0) return { score: 0, max: 10, threshold: 8, pass: false, detail: '0 anchors' };
  const score = arr.length >= 3 ? 10 : 8;
  return { score, max: 10, threshold: 8, pass: score >= 8, detail: `${arr.length} anchors` };
}

async function criterion8_conceptRegistry(spec, repoRoot) {
  const id = spec?.concept_id;
  if (!id) return { score: 0, max: 10, threshold: 10, pass: false, detail: 'no concept_id' };
  const conceptsRoot = join(repoRoot, '.college', 'departments', 'music', 'concepts');
  // recursive walk for any .ts file referencing the id
  async function walk(d) {
    const out = [];
    for (const e of await listDir(d)) {
      const p = join(d, e.name);
      if (e.isDirectory()) out.push(...await walk(p));
      else if (e.isFile() && e.name.endsWith('.ts')) out.push(p);
    }
    return out;
  }
  const files = await walk(conceptsRoot);
  let found = false;
  const idEsc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`["']${idEsc}["']`);
  for (const f of files) {
    const src = await readFile(f, 'utf8');
    if (re.test(src)) { found = true; break; }
  }
  return { score: found ? 10 : 0, max: 10, threshold: 10, pass: found,
    detail: found ? `id ${id} found` : `id ${id} not found in concepts/` };
}

async function criterion9_forwardRef(degreeDir, degree) {
  const p = join(degreeDir, 'research.md');
  if (!await exists(p)) return { score: 10, max: 10, threshold: 10, pass: true, detail: 'research.md absent (vacuous)' };
  const text = await readFile(p, 'utf8');
  const myNum = numericDegree(degree);
  // Pattern matches "MUS 1.NN" with NN digits
  const re = /\bMUS\s+(\d+)\.(\d+)\b/g;
  const offenders = [];
  let m;
  while ((m = re.exec(text))) {
    const n = parseInt(m[1], 10) * 1000 + parseInt(m[2], 10);
    if (n > myNum) offenders.push(`MUS ${m[1]}.${m[2]}`);
  }
  return { score: offenders.length ? 0 : 10, max: 10, threshold: 10, pass: !offenders.length,
    detail: offenders.length ? `forward refs: ${[...new Set(offenders)].join(',')}` : 'clean' };
}

async function criterion10_crossTrack(degreeDir) {
  const p = join(degreeDir, 'cross-references', 'links.json');
  const links = await readJson(p);
  if (!links) return { score: 0, max: 5, threshold: 5, pass: false, detail: 'links.json missing' };
  const nasaOk = !!(links.nasa && links.nasa.degree);
  const elcOk = !!(links.elc && links.elc.degree);
  const pts = (nasaOk ? 2.5 : 0) + (elcOk ? 2.5 : 0);
  // round half up
  const score = Math.round(pts);
  return { score, max: 5, threshold: 5, pass: score === 5,
    detail: `nasa=${nasaOk?'✓':'✗'} elc=${elcOk?'✓':'✗'}` };
}

async function criterion11_takeaway(degreeDir) {
  const p = join(degreeDir, 'research.md');
  if (!await exists(p)) return { score: 0, max: 5, threshold: 4, pass: false, detail: 'research.md missing' };
  const text = await readFile(p, 'utf8');
  // Find section "Pedagogical Takeaway"; allow optional numeric prefix per template (e.g. "## 8. Pedagogical takeaway")
  const re = /^#{1,6}\s+(?:\d+\.\s+)?pedagogical takeaway\s*$/im;
  const m = re.exec(text);
  if (!m) return { score: 0, max: 5, threshold: 4, pass: false, detail: 'section missing' };
  const after = text.slice(m.index + m[0].length);
  // up to next heading (any level)
  const nextH = /^#{1,6}\s+\S/m.exec(after);
  const body = nextH ? after.slice(0, nextH.index) : after;
  const wc = body.trim().split(/\s+/).filter(Boolean).length;
  let score = 0;
  if (wc >= 50 && wc <= 250) score = 5;
  else if (wc >= 30 && wc <= 500) score = 4;
  return { score, max: 5, threshold: 4, pass: score >= 4, detail: `${wc} words` };
}

// ── orchestrator ──────────────────────────────────────────────────────────

async function scoreDegree({ degree, mussRoot, repoRoot }) {
  const degreeDir = join(mussRoot, degree);
  const spec = await readJson(join(degreeDir, 'subject-spec.json'));

  const criteria = [];
  criteria.push({ name: 'Triad coverage',                ...await criterion1_triadCoverage(spec || {}) });
  criteria.push({ name: 'Subject mutual exclusion',      ...await criterion2_mutualExclusion(spec || {}, degree, mussRoot) });
  criteria.push({ name: 'Word count',                    ...await criterion3_wordCount(degreeDir) });
  criteria.push({ name: 'Score example',                 ...await criterion4_scoreExample(degreeDir) });
  criteria.push({ name: 'Audio demos',                   ...await criterion5_audioDemos(degreeDir) });
  criteria.push({ name: 'Spectrogram set',               ...await criterion6_spectrograms(degreeDir) });
  criteria.push({ name: 'Pedagogical anchor',            ...await criterion7_pedAnchor(spec || {}) });
  criteria.push({ name: 'Concept-registry entry',        ...await criterion8_conceptRegistry(spec || {}, repoRoot) });
  criteria.push({ name: 'Forward-reference-forbidden',   ...await criterion9_forwardRef(degreeDir, degree) });
  criteria.push({ name: 'Cross-track links',             ...await criterion10_crossTrack(degreeDir) });
  criteria.push({ name: 'Pedagogical takeaway',          ...await criterion11_takeaway(degreeDir) });

  const total = criteria.reduce((s, c) => s + c.score, 0);
  const max = criteria.reduce((s, c) => s + c.max, 0);
  const allPassThreshold = criteria.every((c) => c.pass);
  const shipFloor = 90;
  const pass = total >= shipFloor && allPassThreshold;
  return { degree, subject: spec?.topic || '(unknown subject)', criteria, total, max, ship_floor: shipFloor, pass,
    verdict: pass ? 'PASS' : 'FAIL' };
}

function printText(result) {
  const head = `MUS ${result.degree} — ${result.subject}`;
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
    console.error('usage: mus-smoke/score.mjs --degree 1.NN [--json] [--root <dir>]');
    console.error('       mus-smoke/score.mjs --all       [--json] [--root <dir>]');
    process.exit(2);
  }
  const repoRoot = args.repoRoot ? resolve(args.repoRoot) : REPO;
  const mussRoot = args.root
    ? resolve(args.root)
    : join(REPO, 'www', 'tibsfox', 'com', 'Research', 'MUS');

  let degrees;
  if (args.all) {
    const entries = await listDir(mussRoot);
    degrees = entries.filter((e) => e.isDirectory() && /^\d+\.\d+$/.test(e.name)).map((e) => e.name);
    degrees.sort((a, b) => numericDegree(a) - numericDegree(b));
  } else {
    degrees = [args.degree];
  }

  const results = [];
  for (const d of degrees) {
    results.push(await scoreDegree({ degree: d, mussRoot, repoRoot }));
  }
  if (args.json) {
    console.log(JSON.stringify(args.all ? results : results[0], null, 2));
  } else {
    for (const r of results) { printText(r); console.log(''); }
  }
  const allPass = results.every((r) => r.pass);
  process.exit(allPass ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(err); process.exit(2); });
}

export { scoreDegree, wordCountResearchMd, lilypondValid, faustValid, numericDegree };
