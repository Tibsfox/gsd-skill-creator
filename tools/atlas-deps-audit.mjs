#!/usr/bin/env node
/**
 * atlas-deps-audit.mjs — ADR 0003 enforcement (v1.49.607 W4a)
 *
 * Walks src/atlas/**\/*.ts AND desktop/intelligence/atlas/**\/*.ts,
 * parses each import declaration (regex-based), and flags any bare-module
 * import that is not:
 *   - a relative path (./  or ../)
 *   - vitest or vitest/*
 *   - a node:* built-in
 *   - a name already present in the baseline package.json as a dep
 *
 * Cross-tree relative imports leaving the atlas surface are allowed when
 * they target the W1 atlas substrate allowlist:
 *   src/intelligence/types.ts
 *   src/intelligence/ipc.ts
 *   src/intelligence/events/types.ts
 *   src/intelligence/symbols/
 *   src/intelligence/kb/symbols.ts
 *   src/intelligence/kb/provenance.ts
 *   src/intelligence/provenance/
 *   src/atlas/           (intra-primitive imports from desktop/intelligence/atlas/)
 *   src/security/loader-context.ts  (Tier-E LoaderContext chokepoint; wired into
 *                        atlas at v1.49.905 by spatial/pmtiles-reader.ts; ADR-0003 cat. b)
 *
 * Exit codes:
 *   0 = no violations
 *   1 = violations found
 *
 * Usage:
 *   node tools/atlas-deps-audit.mjs           # print summary
 *   node tools/atlas-deps-audit.mjs --strict  # same; exit 1 on violation
 *   node tools/atlas-deps-audit.mjs --json    # machine-readable JSON output
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// ── argument parsing ────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const MODE_JSON   = argv.includes('--json');
const MODE_STRICT = argv.includes('--strict');

// --root <path>       : override repo root (for hermetic tests)
// --atlas-root <path> : override atlas scan root (for hermetic tests; both
//                       sub-trees are placed under this path)
function getFlag(flag) {
  const i = argv.indexOf(flag);
  return (i >= 0 && argv[i + 1]) ? argv[i + 1] : null;
}

const REPO_ROOT       = getFlag('--root')       ?? join(HERE, '..');
const ATLAS_ROOT_OVERRIDE = getFlag('--atlas-root') ?? null;

// ── baseline package.json deps ──────────────────────────────────────────────
const pkgPath = join(REPO_ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const BASELINE_DEPS = new Set([
  ...Object.keys(pkg.dependencies   ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]);

// ── atlas surface roots ─────────────────────────────────────────────────────
const ATLAS_ROOTS = ATLAS_ROOT_OVERRIDE
  ? [
      join(ATLAS_ROOT_OVERRIDE, 'src', 'atlas'),
      join(ATLAS_ROOT_OVERRIDE, 'desktop', 'intelligence', 'atlas'),
    ]
  : [
      join(REPO_ROOT, 'src', 'atlas'),
      join(REPO_ROOT, 'desktop', 'intelligence', 'atlas'),
    ];

// ── allowed cross-tree target patterns (suffix/prefix) ──────────────────────
// These are W1 substrate paths that the atlas surface is permitted to import.
const CROSS_TREE_ALLOW_PATTERNS = [
  // Exact or prefix: src/atlas/ (intra-primitive)
  /\/src\/atlas\//,
  // src/intelligence/types.ts|ipc.ts
  /\/src\/intelligence\/types\.js/,
  /\/src\/intelligence\/ipc\.js/,
  // src/intelligence/events/types.ts
  /\/src\/intelligence\/events\/types\.js/,
  // src/intelligence/symbols/
  /\/src\/intelligence\/symbols\//,
  // src/intelligence/kb/symbols.ts
  /\/src\/intelligence\/kb\/symbols\.js/,
  // src/intelligence/kb/provenance.ts
  /\/src\/intelligence\/kb\/provenance\.js/,
  // src/intelligence/provenance/
  /\/src\/intelligence\/provenance\//,
  // src/security/loader-context.ts — Tier-E LoaderContext security chokepoint
  // (v1.49.782 surface; wired into the atlas surface at v1.49.905 by
  // spatial/pmtiles-reader.ts). ADR-0003 category (b): an existing repo-root
  // primitive in src/* outside atlas. Imported as '../../security/loader-context.js'
  // (no 'src/' segment in the relative specifier), so this pattern matches the
  // chokepoint by its file suffix rather than a /src/ prefix.
  /\/security\/loader-context\.js$/,
];

// ── collect all .ts files under roots ───────────────────────────────────────
function walkTs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTs(full, acc);
    } else if (extname(entry) === '.ts') {
      acc.push(full);
    }
  }
  return acc;
}

const allFiles = [];
for (const root of ATLAS_ROOTS) {
  walkTs(root, allFiles);
}

// ── import-specifier extraction ──────────────────────────────────────────────
// Matches: import ... from '...'  / import '...'  / export ... from '...'
// (single or double quotes)
const IMPORT_RE = /\bfrom\s+['"]([^'"]+)['"]/g;
const IMPORT2_RE = /^\s*import\s+['"]([^'"]+)['"]/gm;

/**
 * Strip // line comments and /* block comments so we don't false-positive
 * on import specifiers referenced inside comment text or template examples.
 * We use a simple state machine rather than a full TS parser.
 */
function stripComments(source) {
  let result = '';
  let i = 0;
  const n = source.length;
  while (i < n) {
    // Single-line comment
    if (source[i] === '/' && source[i + 1] === '/') {
      // Consume until EOL
      while (i < n && source[i] !== '\n') i++;
      continue;
    }
    // Block comment
    if (source[i] === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < n - 1 && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2; // skip */
      continue;
    }
    // Template literal — skip body (but keep the delimiters so structure is preserved)
    if (source[i] === '`') {
      result += source[i++];
      while (i < n && source[i] !== '`') {
        if (source[i] === '\\') { result += ' '; i += 2; continue; }
        // Inside ${...} — recurse by just marking it as space so regexes don't match
        result += ' '; i++;
      }
      if (i < n) { result += source[i++]; } // closing `
      continue;
    }
    result += source[i++];
  }
  return result;
}

function extractSpecifiers(source) {
  const stripped = stripComments(source);
  const specs = [];
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(stripped)) !== null) specs.push(m[1]);
  IMPORT2_RE.lastIndex = 0;
  while ((m = IMPORT2_RE.exec(stripped)) !== null) specs.push(m[1]);
  return specs;
}

// ── classify a specifier ─────────────────────────────────────────────────────
function classify(spec, filePath) {
  // Relative imports
  if (spec.startsWith('./') || spec.startsWith('../')) {
    // Check if a cross-tree relative import resolves outside the atlas surface
    // by looking for known non-allowed substrate paths.
    const isCrossTree = !ATLAS_ROOTS.some(root => {
      // Resolve the import relative to the file and check prefix
      try {
        const resolved = new URL(spec, `file://${filePath}`).pathname;
        return resolved.startsWith(root);
      } catch {
        return false;
      }
    });
    if (isCrossTree) {
      // Check allow patterns
      const allowed = CROSS_TREE_ALLOW_PATTERNS.some(p => p.test(spec));
      if (!allowed) return { kind: 'CROSS_TREE_VIOLATION', spec };
    }
    return { kind: 'OK', spec };
  }

  // node: built-ins
  if (spec.startsWith('node:')) return { kind: 'OK', spec };

  // vitest
  if (spec === 'vitest' || spec.startsWith('vitest/')) return { kind: 'OK', spec };

  // Get the bare package name (handles scoped packages)
  let pkgName = spec;
  if (spec.startsWith('@')) {
    // scoped: @scope/name/subpath → @scope/name
    const parts = spec.split('/');
    pkgName = parts.slice(0, 2).join('/');
  } else {
    // unscoped: name/subpath → name
    pkgName = spec.split('/')[0];
  }

  if (BASELINE_DEPS.has(pkgName)) return { kind: 'OK', spec };

  return { kind: 'BARE_VIOLATION', spec, pkgName };
}

// ── audit ────────────────────────────────────────────────────────────────────
const violations = [];
let filesScanned = 0;

for (const file of allFiles) {
  filesScanned++;
  let source;
  try { source = readFileSync(file, 'utf8'); } catch { continue; }

  const specs = extractSpecifiers(source);
  for (const spec of specs) {
    const result = classify(spec, file);
    if (result.kind !== 'OK') {
      // Find approximate line number
      const lines = source.split('\n');
      let lineNum = '?';
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`'${spec}'`) || lines[i].includes(`"${spec}"`)) {
          lineNum = i + 1;
          break;
        }
      }
      violations.push({
        file: file.replace(REPO_ROOT + '/', ''),
        line: lineNum,
        spec,
        kind: result.kind,
        pkgName: result.pkgName ?? null,
      });
    }
  }
}

// ── output ───────────────────────────────────────────────────────────────────
if (MODE_JSON) {
  process.stdout.write(JSON.stringify({
    version: '1.0.0',
    scanned: filesScanned,
    violations: violations.length,
    results: violations,
    pass: violations.length === 0,
  }, null, 2) + '\n');
} else {
  if (violations.length === 0) {
    process.stdout.write(`atlas-deps-audit: PASS — ${filesScanned} files scanned, 0 violations\n`);
  } else {
    process.stderr.write(`atlas-deps-audit: FAIL — ${violations.length} violation(s) in ${filesScanned} files\n\n`);
    for (const v of violations) {
      process.stderr.write(`  ${v.file}:${v.line}  [${v.kind}]  import '${v.spec}'\n`);
    }
    process.stderr.write('\n');
  }
}

// ── exit code ────────────────────────────────────────────────────────────────
if (violations.length > 0 && (MODE_STRICT || !MODE_JSON)) {
  process.exit(1);
}
