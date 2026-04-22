#!/usr/bin/env node
/**
 * faust-check.mjs — compile-check Faust .dsp files using vendored faustwasm.
 *
 * Usage:
 *   node tools/nasa-smoke/faust-check.mjs <dsp-path> [<dsp-path>...]
 *   node tools/nasa-smoke/faust-check.mjs --all        # all .dsp under NASA tree
 *   node tools/nasa-smoke/faust-check.mjs --degree 59  # all .dsp for one degree
 *
 * Exits non-zero on any compile error. Prints per-file pass/fail with the
 * exact error text the browser runtime would surface.
 *
 * Uses the same faustwasm-0.16.1 API path the harness loader uses:
 *   instantiateFaustModuleFromFile -> LibFaust -> FaustCompiler ->
 *   FaustMonoDspGenerator.compile(compiler, 'patch', src, '-I libraries/ -ftz 2')
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const NASA_ROOT = join(REPO, 'www', 'tibsfox', 'com', 'Research', 'NASA');
const HARNESS_VENDOR = join(NASA_ROOT, '_harness', 'v1.0.0', 'faustwasm', 'index.js');

async function walkDsp(dir) {
  const out = [];
  async function recur(d) {
    let entries;
    try { entries = await readdir(d, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) await recur(p);
      else if (e.isFile() && e.name.endsWith('.dsp')) out.push(p);
    }
  }
  await recur(dir);
  return out;
}

async function loadFaust() {
  const faustUrl = 'file://' + HARNESS_VENDOR;
  const faust = await import(faustUrl);
  if (typeof faust.instantiateFaustModuleFromFile !== 'function') {
    throw new Error('vendored faustwasm missing instantiateFaustModuleFromFile');
  }
  const vendorDir = dirname(HARNESS_VENDOR);
  const faustModule = await faust.instantiateFaustModuleFromFile(
    join(vendorDir, 'libfaust-wasm.js')
  );
  const libFaust = new faust.LibFaust(faustModule);
  return { faust, libFaust };
}

async function compileDsp(faust, libFaust, dspPath) {
  const src = await readFile(dspPath, 'utf8');
  const compiler = new faust.FaustCompiler(libFaust);
  const generator = new faust.FaustMonoDspGenerator();
  try {
    await generator.compile(compiler, 'patch', src, '-I libraries/ -ftz 2');
    return { ok: true };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    // Pull out the Faust error line pattern if present:
    //   "patch:56 : ERROR : syntax error, unexpected MAX, ..."
    const lineMatch = msg.match(/patch:(\d+)\s*:\s*ERROR\s*:\s*([^\n]+)/);
    return {
      ok: false,
      message: msg,
      line: lineMatch ? parseInt(lineMatch[1], 10) : null,
      detail: lineMatch ? lineMatch[2] : null,
    };
  }
}

function sourceLine(src, lineNum) {
  if (!lineNum) return null;
  const lines = src.split(/\r?\n/);
  return lines[lineNum - 1] || null;
}

async function main() {
  const args = process.argv.slice(2);
  let targets = [];
  if (args.includes('--all')) {
    targets = await walkDsp(NASA_ROOT);
  } else if (args.includes('--degree')) {
    const idx = args.indexOf('--degree');
    const deg = args[idx + 1];
    if (!deg) { console.error('--degree requires a value'); process.exit(2); }
    targets = await walkDsp(join(NASA_ROOT, deg));
  } else {
    targets = args.filter(a => !a.startsWith('--')).map(a => resolve(a));
  }
  if (!targets.length) {
    console.error('usage: faust-check.mjs <dsp-path>... | --all | --degree <N>');
    process.exit(2);
  }

  console.log(`[faust-check] vendored faustwasm: ${relative(REPO, HARNESS_VENDOR)}`);
  const { faust, libFaust } = await loadFaust();
  console.log(`[faust-check] checking ${targets.length} .dsp file(s)\n`);

  let failed = 0;
  for (const p of targets) {
    const rel = relative(REPO, p);
    const result = await compileDsp(faust, libFaust, p);
    if (result.ok) {
      console.log(`  \u2713 ${rel}`);
    } else {
      failed++;
      const src = await readFile(p, 'utf8');
      const offending = sourceLine(src, result.line);
      console.log(`  \u2717 ${rel}`);
      if (result.line) {
        console.log(`      line ${result.line}: ${result.detail}`);
        if (offending) console.log(`      >>> ${offending.trim()}`);
      } else {
        console.log(`      ${result.message.split('\n')[0]}`);
      }
    }
  }
  console.log('');
  console.log(`[faust-check] ${targets.length - failed}/${targets.length} passed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('[faust-check] fatal:', err && err.message ? err.message : err);
  process.exit(2);
});
