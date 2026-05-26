#!/usr/bin/env node
/**
 * adoption-scan.mjs — static analysis: which src/ modules have real callers?
 *
 * Added v1.49.786 per AUDIT-2026-05-26 Tier 1 T1.2 strengthening lever
 * (adoption telemetry as observability surface). The audit found that
 * substrate modules ship default-off (correctly) but without adoption
 * telemetry the project can't distinguish living-code from shelfware. Era D
 * surfaced a 6-ship typical gap between substrate ship and first non-test
 * caller — meaning many modules sit dormant for ~6 milestones before any
 * real code touches them.
 *
 * What this scans:
 *   For each top-level `src/<module>/` directory, find every TypeScript file
 *   that imports from it and classify the importer by file path:
 *     - self       : importer lives under the same src/<module>/
 *     - test       : importer is a *.test.ts or under __tests__/
 *     - cli        : importer is src/cli/* or src/cli.ts
 *     - internal   : importer is some other src/<other-module>/
 *     - external   : importer is outside src/ (scripts/, tools/, etc.)
 *
 * Per-module status verdicts:
 *   - living      : ≥1 real caller (internal OR cli OR external — non-test)
 *   - test-only   : importers exist BUT all are test files
 *   - isolated    : zero importers anywhere
 *
 * Limitations (intentional for v786 ship 1/N):
 *   - Static analysis only. A module imported but never invoked at runtime
 *     still counts as 'living'. Future ship can add runtime call-graph.
 *   - Cross-module imports are detected via specifier path patterns:
 *       import ... from '../<module>/...'
 *       import ... from '../../<module>/...'
 *       import ... from './<module>/...' (when CWD is in a sibling)
 *     Index-file imports (`from '../<module>'` with no trailing path) are
 *     accepted. TypeScript path aliases (none currently configured) would
 *     need explicit handling.
 *   - Type-only imports are NOT distinguished from runtime imports. A
 *     module imported only for `import type { Foo }` still counts as living.
 *     This is intentional — type-only imports indicate the module's surface
 *     is consumed.
 *
 * Output:
 *   - default       : markdown table sorted by realCallerCount ascending
 *                     (shelfware candidates at top)
 *   - --json        : machine-readable JSON array of ModuleAdoptionRecord
 *   - --shelfware-threshold N : flag modules with realCallerCount < N
 *
 * Exit codes:
 *   0   scan succeeded (no shelfware threshold violations OR threshold not set)
 *   1   --shelfware-threshold N triggered (real-caller count below threshold)
 *   2   fatal error (src/ missing, malformed input)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep, dirname } from 'node:path';

const args = process.argv.slice(2);
const JSON_OUTPUT = args.includes('--json');
const thresholdIdx = args.indexOf('--shelfware-threshold');
const SHELFWARE_THRESHOLD = thresholdIdx >= 0 ? Number(args[thresholdIdx + 1]) : null;
const ROOT_IDX = args.indexOf('--root');
const ROOT = resolve(ROOT_IDX >= 0 ? args[ROOT_IDX + 1] : process.cwd());
const SRC_DIR = join(ROOT, 'src');
const allowlistIdx = args.indexOf('--allowlist');
const ALLOWLIST_PATH = allowlistIdx >= 0
  ? resolve(args[allowlistIdx + 1])
  : join(ROOT, 'tools', 'adoption-scan.allowlist.json');
const NO_ALLOWLIST = args.includes('--no-allowlist');

if (!existsSync(SRC_DIR)) {
  console.error(`[adoption-scan] FATAL: src/ not found at ${SRC_DIR}`);
  process.exit(2);
}

// ─── Allowlist loading ───────────────────────────────────────────────────────

/**
 * Load operator-curated exemptions. Returns Map<module, reason>. If the file
 * is absent or --no-allowlist is set, returns an empty map.
 *
 * Allowlist entries do NOT change a module's status (living/test-only/isolated)
 * — they only prevent the --shelfware-threshold flag from triggering on the
 * module. The full record always reports `allowlisted: bool` + `allowlistReason: string|null`
 * so the dashboard / report can surface the exemption transparently.
 */
function loadAllowlist() {
  if (NO_ALLOWLIST) return new Map();
  if (!existsSync(ALLOWLIST_PATH)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
    const map = new Map();
    for (const e of raw.entries ?? []) {
      if (!e.module) continue;
      map.set(e.module, e.reason ?? '(no reason given)');
    }
    return map;
  } catch (err) {
    console.error(`[adoption-scan] WARN: cannot parse allowlist at ${ALLOWLIST_PATH}: ${err.message}`);
    return new Map();
  }
}

/**
 * Directories scanned for importers OUTSIDE src/. These contribute to
 * 'external' importer classification — they represent real call paths from
 * tooling, scripts, and the desktop frontend. Without them, modules like
 * `scribe` (heavily used from tools/scribe/*) misclassify as test-only.
 *
 * Directories not present on disk are silently skipped.
 */
const EXTERNAL_IMPORTER_DIRS = ['tools', 'scripts', 'src-tauri', 'desktop'];

// ─── Module enumeration ──────────────────────────────────────────────────────

/**
 * List src/<module>/ directories. Excludes:
 *   - directories starting with '_' or '.'
 *   - __tests__ at the top level (test files share a flat sibling pattern)
 *   - 'types' (not a module — it's a shared types directory)
 */
function listModules() {
  return readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.') && name !== '__tests__')
    .sort();
}

// ─── File walking ────────────────────────────────────────────────────────────

function* walkTsFiles(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      // Skip nested node_modules just in case
      if (ent.name === 'node_modules') continue;
      yield* walkTsFiles(p);
    } else if (ent.isFile() && /\.(?:ts|tsx|mjs|js)$/.test(p) && !/\.d\.ts$/.test(p)) {
      yield p;
    }
  }
}

function isTestPath(absPath) {
  return (
    absPath.includes(`${sep}__tests__${sep}`) ||
    /\.test\.[mc]?[tj]sx?$/.test(absPath) ||
    /\.test\.sh$/.test(absPath)
  );
}

function isCliPath(absPath, relFromSrc) {
  // src/cli.ts or anything under src/cli/
  return relFromSrc === 'cli.ts' || relFromSrc.startsWith('cli' + sep) || relFromSrc.startsWith('cli/');
}

function classifyImporter(absPath, importerModule) {
  // The classification operates on the importer's location.
  const rel = relative(SRC_DIR, absPath);
  // Test detection comes first because a test file inside src/ or in tools/
  // counts as test, not internal/external.
  if (isTestPath(absPath)) return 'test';
  if (rel.startsWith('..')) return 'external'; // outside src/
  if (isCliPath(absPath, rel)) return 'cli';
  // src/<module>/... — what module owns this file?
  const firstSeg = rel.split(sep)[0];
  if (firstSeg === importerModule) return 'self';
  return 'internal';
}

// ─── Import parsing ──────────────────────────────────────────────────────────

const IMPORT_RE = /import\s+(?:[\w*\s{},$]+\s+from\s+)?['"]([^'"]+)['"]/g;
const EXPORT_FROM_RE = /export\s+(?:\*|{[^}]*})\s+from\s+['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_RE = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

function extractSpecifiers(content) {
  const specs = [];
  for (const re of [IMPORT_RE, EXPORT_FROM_RE, DYNAMIC_IMPORT_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content))) specs.push(m[1]);
  }
  return specs;
}

/**
 * Resolve an import specifier to a target src/<module>, or null if not src/-rooted.
 * importerAbsPath is the absolute path of the file containing the import.
 *
 * Accepts both relative ('./', '../') specifiers AND `src/<module>/...` style
 * specifiers from tooling files that live outside src/.
 */
function resolveToModule(importerAbsPath, specifier) {
  // Skip package imports, node: builtins
  if (specifier.startsWith('node:') || (!specifier.startsWith('.') && !specifier.startsWith('src/'))) {
    return null;
  }
  let resolved;
  if (specifier.startsWith('src/')) {
    // Absolute-from-repo-root style used by some tooling
    resolved = resolve(ROOT, specifier);
  } else {
    const importerDir = dirname(importerAbsPath);
    resolved = resolve(importerDir, specifier);
  }
  // Must be inside SRC_DIR
  const relFromSrc = relative(SRC_DIR, resolved);
  if (relFromSrc.startsWith('..') || relFromSrc.startsWith(sep) || relFromSrc === '') return null;
  // First segment of the relative path is the module name.
  const segs = relFromSrc.split(sep);
  return segs[0];
}

// ─── Scan ────────────────────────────────────────────────────────────────────

function scan() {
  const allowlist = loadAllowlist();
  const modules = listModules();
  const records = new Map();
  for (const m of modules) {
    records.set(m, {
      module: m,
      selfFiles: 0,
      testImporters: new Set(),
      cliImporters: new Set(),
      internalImporters: new Set(),
      externalImporters: new Set(),
      selfImporters: 0, // count, not set
    });
  }
  // First pass: count selfFiles
  for (const m of modules) {
    for (const _file of walkTsFiles(join(SRC_DIR, m))) {
      records.get(m).selfFiles += 1;
    }
  }
  // Second pass: walk EVERY .ts/.mjs/.js file under src/ AND the external
  // importer dirs (tools/, scripts/, src-tauri/, desktop/) and parse imports.
  const importerRoots = [SRC_DIR];
  for (const d of EXTERNAL_IMPORTER_DIRS) {
    const p = join(ROOT, d);
    if (existsSync(p)) importerRoots.push(p);
  }
  for (const root of importerRoots) {
  for (const file of walkTsFiles(root)) {
    const content = readFileSync(file, 'utf8');
    const specifiers = extractSpecifiers(content);
    for (const spec of specifiers) {
      const targetModule = resolveToModule(file, spec);
      if (!targetModule) continue;
      if (!records.has(targetModule)) continue;
      // Determine which module the importer lives in (or external)
      const relFromSrc = relative(SRC_DIR, file);
      const importerModule = relFromSrc.split(sep)[0];
      const cls = classifyImporter(file, targetModule);
      const rec = records.get(targetModule);
      const relForReport = relative(ROOT, file);
      if (cls === 'self') {
        rec.selfImporters += 1;
      } else if (cls === 'test') {
        rec.testImporters.add(relForReport);
      } else if (cls === 'cli') {
        rec.cliImporters.add(relForReport);
      } else if (cls === 'internal') {
        // Tag with the importing module rather than the file path
        rec.internalImporters.add(importerModule);
      } else if (cls === 'external') {
        rec.externalImporters.add(relForReport);
      }
    }
  }
  }
  return modules.map((m) => finalizeRecord(records.get(m), allowlist));
}

function finalizeRecord(raw, allowlist) {
  const realCallerCount =
    raw.internalImporters.size + raw.cliImporters.size + raw.externalImporters.size;
  const testCount = raw.testImporters.size;
  let status;
  if (realCallerCount > 0) status = 'living';
  else if (testCount > 0) status = 'test-only';
  else status = 'isolated';
  const allowlisted = allowlist.has(raw.module);
  return {
    module: raw.module,
    selfFiles: raw.selfFiles,
    selfImporters: raw.selfImporters,
    testImporters: [...raw.testImporters].sort(),
    cliImporters: [...raw.cliImporters].sort(),
    internalImporters: [...raw.internalImporters].sort(),
    externalImporters: [...raw.externalImporters].sort(),
    realCallerCount,
    testCount,
    status,
    allowlisted,
    allowlistReason: allowlisted ? allowlist.get(raw.module) : null,
  };
}

// ─── Output formatting ───────────────────────────────────────────────────────

function formatMarkdown(records) {
  const lines = [];
  lines.push('# Adoption Scan Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Root: \`${relative(process.cwd(), ROOT) || '.'}\``);
  lines.push('');

  const isolated = records.filter((r) => r.status === 'isolated');
  const testOnly = records.filter((r) => r.status === 'test-only');
  const living = records.filter((r) => r.status === 'living');

  lines.push(`**Summary:** ${records.length} modules — ${living.length} living · ${testOnly.length} test-only · ${isolated.length} isolated.`);
  lines.push('');
  lines.push('**What this measures:** TypeScript-import-surface adoption. A module is "living" if ≥1 non-test TS file (in `src/`, `tools/`, `scripts/`, `src-tauri/`, or `desktop/`) imports it. Modules invoked only via npm-scripts or shell-spawn (e.g., `node tools/foo.mjs <module-arg>`) will show as test-only — their CLI binary may still be in use even when their TS API is dormant.');
  lines.push('');

  if (isolated.length > 0) {
    const isolatedShelfware = isolated.filter((r) => !r.allowlisted);
    const isolatedAllowlisted = isolated.filter((r) => r.allowlisted);
    lines.push('## Isolated modules (no importers anywhere)');
    lines.push('');
    lines.push('These modules have zero importers — neither real code nor tests reference them.');
    lines.push('');
    if (isolatedShelfware.length > 0) {
      lines.push('### Shelfware candidates (not allowlisted)');
      lines.push('');
      lines.push('| Module | self files | self importers |');
      lines.push('|--------|-----------:|---------------:|');
      for (const r of isolatedShelfware) {
        lines.push(`| \`${r.module}\` | ${r.selfFiles} | ${r.selfImporters} |`);
      }
      lines.push('');
    }
    if (isolatedAllowlisted.length > 0) {
      lines.push('### Allowlisted (intentionally isolated)');
      lines.push('');
      lines.push('| Module | self files | reason |');
      lines.push('|--------|-----------:|--------|');
      for (const r of isolatedAllowlisted) {
        lines.push(`| \`${r.module}\` | ${r.selfFiles} | ${r.allowlistReason} |`);
      }
      lines.push('');
    }
  }

  if (testOnly.length > 0) {
    lines.push('## Test-only modules (importers exist but only from tests)');
    lines.push('');
    lines.push('These modules are exercised in tests but no real code path consumes them. They may be premature substrate or recently shipped (awaiting first real caller — Era D found a typical 6-ship gap).');
    lines.push('');
    lines.push('| Module | self files | test importers |');
    lines.push('|--------|-----------:|---------------:|');
    for (const r of testOnly.sort((a, b) => a.module.localeCompare(b.module))) {
      lines.push(`| \`${r.module}\` | ${r.selfFiles} | ${r.testCount} |`);
    }
    lines.push('');
  }

  lines.push('## Living modules (≥1 real caller)');
  lines.push('');
  lines.push('| Module | self files | real callers | test callers | internal importers |');
  lines.push('|--------|-----------:|-------------:|-------------:|--------------------|');
  for (const r of living.sort((a, b) => a.realCallerCount - b.realCallerCount)) {
    const importers = r.internalImporters.length > 0
      ? r.internalImporters.slice(0, 5).map((s) => `\`${s}\``).join(', ') + (r.internalImporters.length > 5 ? ` (+${r.internalImporters.length - 5})` : '')
      : '—';
    lines.push(`| \`${r.module}\` | ${r.selfFiles} | ${r.realCallerCount} | ${r.testCount} | ${importers} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function exitWhenDrained(code) {
  // Calling process.exit() synchronously can truncate buffered stdout/stderr
  // when output exceeds the OS pipe buffer (~64 KB on most Linux systems).
  // Schedule the exit after the next tick so flush completes first.
  // See Lesson #10420 candidate at v1.49.787.
  if (process.stdout.writableLength === 0 && process.stderr.writableLength === 0) {
    process.exit(code);
    return;
  }
  let waiting = 2;
  const maybeExit = () => { if (--waiting === 0) process.exit(code); };
  if (process.stdout.writableLength === 0) waiting -= 1;
  else process.stdout.once('drain', maybeExit);
  if (process.stderr.writableLength === 0) waiting -= 1;
  else process.stderr.once('drain', maybeExit);
  if (waiting === 0) process.exit(code);
}

function main() {
  const records = scan();
  if (JSON_OUTPUT) {
    process.stdout.write(JSON.stringify(records, null, 2) + '\n');
  } else {
    process.stdout.write(formatMarkdown(records));
  }
  if (SHELFWARE_THRESHOLD !== null && !Number.isNaN(SHELFWARE_THRESHOLD)) {
    // Allowlisted modules are excluded from threshold triggering — they remain
    // visible in the report (with `allowlisted: true`) but don't fail the gate.
    const shelfware = records.filter(
      (r) => r.realCallerCount < SHELFWARE_THRESHOLD && !r.allowlisted,
    );
    if (shelfware.length > 0) {
      console.error(`[adoption-scan] THRESHOLD: ${shelfware.length} non-allowlisted module(s) below realCallerCount<${SHELFWARE_THRESHOLD}`);
      for (const r of shelfware) {
        console.error(`  - ${r.module} (status=${r.status}, realCallers=${r.realCallerCount}, testCallers=${r.testCount})`);
      }
      exitWhenDrained(1);
      return;
    }
  }
  exitWhenDrained(0);
}

main();
