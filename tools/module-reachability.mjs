#!/usr/bin/env node
/**
 * module-reachability.mjs — bound src/ sprawl with a reachability ratchet.
 *
 * Walks the static + dynamic relative-import graph from the real program entry
 * points, maps every reached file to its top-level src/ subdirectory, and diffs
 * the reached set against every top-level src/ dir. Directories unreachable from
 * ANY entry point are ORPHANS. A JSON allowlist (ORPHAN_ALLOWLIST) grandfathers
 * today's orphans; any NEW orphan fails --check, and the allowlist ratchets
 * (an entry that stops being a real dir, or becomes reachable, also fails) so it
 * can only shrink. Mirrors the ledger discipline of loader-context-audit and the
 * --check/allowlist shape of tauri-boundary-audit.
 *
 * A second, parallel audit covers the Tauri command surface: handlers registered
 * in src-tauri/src/lib.rs `generate_handler!` vs names actually invoked from
 * desktop/ — registered-but-never-invoked leaves are orphan commands, gated the
 * same way against tools/tauri-command-reachability.allowlist.json.
 *
 * Modes:
 *   (default)   human text report
 *   --json      machine-readable report
 *   --check     exit 11 if any NEW orphan or stale allowlist entry (gate mode)
 *   --write     (re)generate docs/MODULE-MAP.md
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(import.meta.url), '..', '..');
const SRC = join(REPO, 'src');
const SRC_ALLOWLIST_PATH = join(REPO, 'tools', 'module-reachability.allowlist.json');
const TAURI_ALLOWLIST_PATH = join(REPO, 'tools', 'tauri-command-reachability.allowlist.json');
const MAP_PATH = join(REPO, 'docs', 'MODULE-MAP.md');
const LIB_RS = join(REPO, 'src-tauri', 'src', 'lib.rs');
const DESKTOP = join(REPO, 'desktop');
const EXIT_VIOLATION = 11;

// Real program entry surfaces. "Reachable" = reachable from ANY of these — the
// correct dead-code semantic. cli.ts pulls dispatch.ts (+ its dynamic command
// imports) transitively; the intelligence/atlas/dashboard/console entries are the
// files scripts/serve-dashboard.mjs dynamically imports from dist/.
const ROOTS = [
  'src/cli.ts',
  'src/mcp/server.ts',
  'src/index.ts',
  'src/intelligence/dashboard-bridge.ts',
  'src/intelligence/atlas-indexer/runner.ts',
  'src/intelligence/kb/store.ts',
  'src/intelligence/kb/migrations.ts',
  'src/intelligence/atlas-pg/mirror.ts',
  'src/intelligence/events/bus.ts',
  'src/atlas/spatial/server-ipc.ts',
  'src/atlas/spatial/pmtiles-reader.ts',
  'src/dashboard/generator.ts',
  'src/console/helper.ts',
].map((r) => join(REPO, r));

// ---------------------------------------------------------------------------
// src/ reachability BFS
// ---------------------------------------------------------------------------

// Strip // line and /* */ block comments so specifiers in comments aren't
// followed. Naive but safe: a missed real import would over-report an orphan,
// which the empirical count check (reached floor) would catch.
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let state = 'code'; // code | line | block | sq | dq | tq
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (state === 'code') {
      if (c === '/' && d === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && d === '*') { state = 'block'; i += 2; continue; }
      if (c === "'") { state = 'sq'; out += c; i++; continue; }
      if (c === '"') { state = 'dq'; out += c; i++; continue; }
      if (c === '`') { state = 'tq'; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (state === 'line') { if (c === '\n') { state = 'code'; out += c; } i++; continue; }
    if (state === 'block') { if (c === '*' && d === '/') { state = 'code'; i += 2; } else i++; continue; }
    // inside a string: keep chars (specifiers we want live in strings) but honor escapes
    if (state === 'sq') { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === "'") state = 'code'; i++; continue; }
    if (state === 'dq') { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === '"') state = 'code'; i++; continue; }
    if (state === 'tq') { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === '`') state = 'code'; i++; continue; }
  }
  return out;
}

const SPEC_RES = [
  /\bfrom\s*['"]([^'"]+)['"]/g, // import ... from '...'
  /\bimport\s*['"]([^'"]+)['"]/g, // bare import '...'
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // dynamic import('...')
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // require('...')
  /\bexport\s*\*\s*from\s*['"]([^'"]+)['"]/g, // export * from '...'
];

function extractSpecs(src) {
  const clean = stripComments(src);
  const specs = new Set();
  for (const re of SPEC_RES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(clean))) specs.add(m[1]);
  }
  return specs;
}

// Resolve an ESM-with-tsc relative specifier (carries a .js ext on disk .ts) to
// the real source file. Only relative specifiers are followed.
function resolveSpec(spec, fromFile) {
  if (!spec.startsWith('.')) return null; // bare pkg / node: builtin
  const base = resolve(dirname(fromFile), spec);
  const noExt = base.replace(/\.(js|jsx|mjs|cjs)$/, '');
  const candidates = [
    noExt + '.ts', noExt + '.tsx', noExt + '.mts',
    base + '.ts', base + '.tsx',
    join(base, 'index.ts'), join(base, 'index.tsx'),
    join(noExt, 'index.ts'), join(noExt, 'index.tsx'),
    base,
  ];
  for (const c of candidates) {
    try { if (existsSync(c) && statSync(c).isFile()) return c; } catch { /* noop */ }
  }
  return null;
}

function bfs(roots) {
  const seen = new Set();
  const queue = [];
  for (const r of roots) {
    if (existsSync(r)) queue.push(r);
    else process.stderr.write(`[module-reachability] WARN: root missing: ${relative(REPO, r)}\n`);
  }
  while (queue.length) {
    const f = queue.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    let src;
    try { src = readFileSync(f, 'utf8'); } catch { continue; }
    for (const spec of extractSpecs(src)) {
      const res = resolveSpec(spec, f);
      if (res && res.startsWith(SRC + sep) && !seen.has(res)) queue.push(res);
    }
  }
  return seen;
}

function topDirOf(absFile) {
  return relative(SRC, absFile).split(/[/\\]/)[0];
}

function allTopDirs() {
  return readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '__tests__')
    .map((d) => d.name)
    .sort();
}

function computeSrcReport() {
  const reachedFiles = bfs(ROOTS);
  const reachedDirs = new Set();
  for (const f of reachedFiles) reachedDirs.add(topDirOf(f));
  const dirs = allTopDirs();
  const orphans = dirs.filter((d) => !reachedDirs.has(d)).sort();
  const reached = dirs.filter((d) => reachedDirs.has(d)).sort();
  return { dirs, reached, orphans, reachedFileCount: reachedFiles.size };
}

// ---------------------------------------------------------------------------
// Tauri command reachability
// ---------------------------------------------------------------------------

function tauriRegisteredLeaves() {
  if (!existsSync(LIB_RS)) return [];
  const src = readFileSync(LIB_RS, 'utf8');
  const start = src.indexOf('generate_handler!');
  if (start < 0) return [];
  const open = src.indexOf('[', start);
  if (open < 0) return [];
  // Balance brackets so nested attrs like #[cfg(...)] don't truncate the block.
  let depth = 0;
  let end = -1;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '[') depth++;
    else if (src[j] === ']') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end < 0) return [];
  const block = src.slice(open + 1, end).replace(/\/\/[^\n]*/g, '');
  const leaves = new Set();
  for (const raw of block.split(',')) {
    const leaf = raw.trim().split('::').pop().trim();
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(leaf)) leaves.add(leaf);
  }
  return [...leaves].sort();
}

function walkFiles(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'build') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

function tauriInvokedNames() {
  const names = new Set();
  const re = /\binvoke\s*(?:<[^>]*>)?\s*\(\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]/g;
  for (const f of walkFiles(DESKTOP, ['.ts', '.tsx'])) {
    const src = readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(src))) names.add(m[1]);
  }
  return names;
}

function computeTauriReport() {
  const registered = tauriRegisteredLeaves();
  const invoked = tauriInvokedNames();
  const orphans = registered.filter((c) => !invoked.has(c)).sort();
  return { registered, registeredCount: registered.length, invokedCount: invoked.size, orphans };
}

// ---------------------------------------------------------------------------
// Allowlist ledger (mirrors tauri-boundary-audit loadAllowlist)
// ---------------------------------------------------------------------------

function loadAllowlist(path) {
  if (!existsSync(path)) return { orphans: [] };
  try {
    const a = JSON.parse(readFileSync(path, 'utf8'));
    return { orphans: Array.isArray(a.orphans) ? a.orphans : [], note: a.note };
  } catch {
    return { orphans: [] };
  }
}

// Diff current orphans vs allowlist. Returns the three ledger failures:
//   newOrphans      — orphan not grandfathered (must be wired or explicitly added)
//   staleReachable  — allowlisted entry that is now reachable (chip it out)
//   staleMissing    — allowlisted entry that is no longer a real dir/command
function ledgerDiff(currentOrphans, allowlist, universe) {
  const cur = new Set(currentOrphans);
  const uni = new Set(universe);
  const allow = new Set(allowlist.orphans);
  const newOrphans = currentOrphans.filter((o) => !allow.has(o));
  const staleReachable = allowlist.orphans.filter((o) => uni.has(o) && !cur.has(o));
  const staleMissing = allowlist.orphans.filter((o) => !uni.has(o));
  return { newOrphans, staleReachable, staleMissing };
}

// ---------------------------------------------------------------------------
// Report assembly + rendering
// ---------------------------------------------------------------------------

function assemble() {
  const src = computeSrcReport();
  const tauri = computeTauriReport();
  const srcAllow = loadAllowlist(SRC_ALLOWLIST_PATH);
  const tauriAllow = loadAllowlist(TAURI_ALLOWLIST_PATH);
  const srcLedger = ledgerDiff(src.orphans, srcAllow, src.dirs);
  // Tauri universe for stale checks = the registered command set: an allowlisted
  // command that is no longer registered is stale-missing; one now invoked is
  // stale-reachable (falls out of orphans).
  const tauriLedger = ledgerDiff(tauri.orphans, tauriAllow, tauri.registered);
  const ok =
    srcLedger.newOrphans.length === 0 &&
    srcLedger.staleReachable.length === 0 &&
    srcLedger.staleMissing.length === 0 &&
    tauriLedger.newOrphans.length === 0 &&
    tauriLedger.staleReachable.length === 0 &&
    tauriLedger.staleMissing.length === 0;
  return { src, tauri, srcAllow, tauriAllow, srcLedger, tauriLedger, ok };
}

function textReport(r) {
  const L = [];
  L.push('module-reachability — src/ orphan ratchet + Tauri command audit');
  L.push('');
  L.push(`src/ top-level dirs: ${r.src.dirs.length}  |  reached: ${r.src.reached.length}  |  orphan: ${r.src.orphans.length}  (allowlisted ${r.srcAllow.orphans.length}, reached files ${r.src.reachedFileCount})`);
  if (r.srcLedger.newOrphans.length) L.push(`  NEW ORPHANS (fail): ${r.srcLedger.newOrphans.join(', ')}`);
  if (r.srcLedger.staleReachable.length) L.push(`  STALE (now reachable, chip out): ${r.srcLedger.staleReachable.join(', ')}`);
  if (r.srcLedger.staleMissing.length) L.push(`  STALE (no longer a dir, remove): ${r.srcLedger.staleMissing.join(', ')}`);
  L.push('');
  L.push(`Tauri commands: registered ${r.tauri.registeredCount}  |  invoked-and-registered ${r.tauri.registeredCount - r.tauri.orphans.length}  |  orphan ${r.tauri.orphans.length}  (allowlisted ${r.tauriAllow.orphans.length})`);
  if (r.tauriLedger.newOrphans.length) L.push(`  NEW ORPHAN COMMANDS (fail): ${r.tauriLedger.newOrphans.join(', ')}`);
  if (r.tauriLedger.staleReachable.length) L.push(`  STALE (now invoked, chip out): ${r.tauriLedger.staleReachable.join(', ')}`);
  if (r.tauriLedger.staleMissing.length) L.push(`  STALE (no longer registered, remove): ${r.tauriLedger.staleMissing.join(', ')}`);
  L.push('');
  L.push(r.ok ? 'OK — no new orphans, allowlists current.' : `FAIL — ratchet violation (exit ${EXIT_VIOLATION}).`);
  return L.join('\n');
}

function markdownMap(r) {
  const L = [];
  L.push('# Module Reachability Map');
  L.push('');
  L.push('> Generated by `node tools/module-reachability.mjs --write`. Do not hand-edit.');
  L.push('> "Reachable" = reachable via the static + dynamic import graph from a real program');
  L.push('> entry point. Orphans are frozen by `tools/module-reachability.allowlist.json`; the');
  L.push('> ratchet (`--check`) fails on any NEW orphan and forces stale entries out. An orphan is');
  L.push('> NOT necessarily dead — some dirs are reached only at runtime by path or via Tauri.');
  L.push('');
  L.push('## Entry roots');
  L.push('');
  for (const root of ROOTS) L.push(`- \`${relative(REPO, root)}\``);
  L.push('');
  L.push(`## src/ summary — ${r.src.reached.length} reached / ${r.src.orphans.length} orphan of ${r.src.dirs.length} dirs`);
  L.push('');
  L.push(`Reached files walked: ${r.src.reachedFileCount}.`);
  L.push('');
  L.push('### Orphan dirs (allowlisted)');
  L.push('');
  L.push(r.src.orphans.length ? r.src.orphans.map((d) => `\`${d}\``).join(', ') : '_none_');
  L.push('');
  L.push('<details><summary>Reached dirs</summary>');
  L.push('');
  L.push(r.src.reached.map((d) => `\`${d}\``).join(', '));
  L.push('');
  L.push('</details>');
  L.push('');
  L.push('## Tauri command surface');
  L.push('');
  L.push(`Registered handlers: ${r.tauri.registeredCount} · invoked from \`desktop/\`: ${r.tauri.registeredCount - r.tauri.orphans.length} · orphan (registered, never invoked): ${r.tauri.orphans.length}.`);
  L.push('');
  L.push('<details><summary>Orphan commands (allowlisted)</summary>');
  L.push('');
  L.push(r.tauri.orphans.length ? r.tauri.orphans.map((c) => `\`${c}\``).join(', ') : '_none_');
  L.push('');
  L.push('</details>');
  L.push('');
  return L.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const checkOnly = args.includes('--check');
  const write = args.includes('--write');
  const dumpOrphans = args.includes('--dump-orphans'); // seed helper

  if (!existsSync(SRC)) {
    process.stderr.write('[module-reachability] src/ missing — wrong cwd?\n');
    process.exit(2);
  }

  const r = assemble();

  if (dumpOrphans) {
    process.stdout.write(JSON.stringify({ src: r.src.orphans, tauri: r.tauri.orphans }, null, 2) + '\n');
    process.exit(0);
  }

  if (write) {
    writeFileSync(MAP_PATH, markdownMap(r) + '\n', 'utf8');
    process.stdout.write(`[module-reachability] wrote ${relative(REPO, MAP_PATH)}\n`);
  }

  if (asJson) {
    process.stdout.write(JSON.stringify({
      src: { dirs: r.src.dirs.length, reached: r.src.reached, orphans: r.src.orphans, reachedFileCount: r.src.reachedFileCount },
      tauri: r.tauri,
      ledger: { src: r.srcLedger, tauri: r.tauriLedger },
      ok: r.ok,
    }, null, 2) + '\n');
  } else if (!checkOnly && !write) {
    process.stdout.write(textReport(r) + '\n');
  }

  if (!r.ok) process.exit(EXIT_VIOLATION);
  process.exit(0);
}

main();
