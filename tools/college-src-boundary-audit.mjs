#!/usr/bin/env node
/**
 * college-src-boundary-audit.mjs — .college/ -> src/ cross-rootdir gate (v1.49.930)
 *
 * Walks .college/**\/*.ts and flags any import declaration whose specifier
 * resolves into the src/ rootdir. The src/ <-> .college/ boundary is ASYMMETRIC
 * (docs/cross-rootdir-wire-discipline.md #10435):
 *   - src/ -> .college/  is caught by tsc (`.college/` is outside the src rootDir).
 *   - .college/ -> src/  is NOT caught by tsc (`.college/` is excluded from the
 *     tsconfig include), so a latent cross-rootdir import can sit undetected as
 *     dead code (the v1.49.929 recon surfaced exactly one such instance:
 *     runbook-interface.ts, removed in v1.49.930 CF1a).
 *
 * This tool is the DETECTOR layer of the two-layer closure (#10436): CF1a is the
 * source-eliminator (removed the offending file); this gate prevents recurrence.
 * Either layer alone is incomplete — deletion without a gate lets a future author
 * re-introduce the same class silently. The live `.college/` tree is asserted
 * clean by the companion test's Case 6 (the #10461 Layer-2 drift-guard), which is
 * run by the gate+CI-enforced tools suite (vitest.tools.config.mjs).
 *
 * Cross-rootdir wires that NEED a src/ type MUST redeclare it locally per the
 * "local-interface redeclaration discipline" (docs/cross-rootdir-wire-discipline.md);
 * they must never reach across the boundary.
 *
 * A specifier resolves into src/ when:
 *   - it is a relative path ('./' or '../') whose resolved absolute path contains
 *     a '/src/' segment that is NOT inside '/.college/', OR
 *   - it is a bare specifier beginning with 'src/' (a tsconfig-paths style import).
 *
 * Exit codes:
 *   0 = no violations
 *   1 = violations found (default + --strict)
 *
 * Usage:
 *   node tools/college-src-boundary-audit.mjs            # print summary, exit 1 on violation
 *   node tools/college-src-boundary-audit.mjs --strict   # same (alias)
 *   node tools/college-src-boundary-audit.mjs --json      # machine-readable JSON (exit 0)
 *   node tools/college-src-boundary-audit.mjs --college-root <path>  # hermetic test override
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// ── argument parsing ────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const MODE_JSON = argv.includes('--json');
const MODE_STRICT = argv.includes('--strict');

function getFlag(flag) {
  const i = argv.indexOf(flag);
  return (i >= 0 && argv[i + 1]) ? argv[i + 1] : null;
}

const REPO_ROOT = getFlag('--root') ?? join(HERE, '..');
// --college-root <path> : override the .college scan root (hermetic tests).
const COLLEGE_ROOT = getFlag('--college-root') ?? join(REPO_ROOT, '.college');

// ── collect all .ts files under the college root ────────────────────────────
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

// ── import-specifier extraction (comment-aware) ─────────────────────────────
// Matches: import ... from '...'  / import '...'  / export ... from '...'
const IMPORT_RE = /\bfrom\s+['"]([^'"]+)['"]/g;
const IMPORT2_RE = /^\s*import\s+['"]([^'"]+)['"]/gm;

/**
 * Strip // line comments and block comments so we don't false-positive on
 * import specifiers referenced inside comment text or doc examples (the removed
 * runbook-interface.ts had a comment mentioning 'src/dashboard'). Simple state
 * machine — verbatim sibling of tools/atlas-deps-audit.mjs.
 */
function stripComments(source) {
  let result = '';
  let i = 0;
  const n = source.length;
  while (i < n) {
    if (source[i] === '/' && source[i + 1] === '/') {
      while (i < n && source[i] !== '\n') i++;
      continue;
    }
    if (source[i] === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < n - 1 && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (source[i] === '`') {
      result += source[i++];
      while (i < n && source[i] !== '`') {
        if (source[i] === '\\') { result += ' '; i += 2; continue; }
        result += ' '; i++;
      }
      if (i < n) { result += source[i++]; }
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
// A .college/ file may import: relative paths that stay inside .college/, bare
// package deps, node: built-ins, vitest. It may NOT import anything resolving
// into the src/ rootdir.
function classify(spec, filePath) {
  // Bare 'src/...' (tsconfig-paths style) — direct cross-rootdir reach.
  if (spec === 'src' || spec.startsWith('src/')) {
    return { kind: 'CROSS_ROOTDIR_VIOLATION', spec };
  }

  // Relative imports — resolve and check whether they land in src/.
  if (spec.startsWith('./') || spec.startsWith('../')) {
    const resolved = resolvePath(dirname(filePath), spec);
    // A path that contains a /src/ segment but is NOT inside a /.college/ segment
    // has reached across the rootdir boundary.
    if (resolved.includes('/src/') && !resolved.includes('/.college/')) {
      return { kind: 'CROSS_ROOTDIR_VIOLATION', spec, resolved };
    }
    return { kind: 'OK', spec };
  }

  // node: built-ins, vitest, and bare package deps are all fine for .college/.
  return { kind: 'OK', spec };
}

// ── audit ────────────────────────────────────────────────────────────────────
const allFiles = walkTs(COLLEGE_ROOT);
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
        resolved: result.resolved ?? null,
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
    process.stdout.write(`college-src-boundary-audit: PASS — ${filesScanned} files scanned, 0 violations\n`);
  } else {
    process.stderr.write(`college-src-boundary-audit: FAIL — ${violations.length} .college/->src/ import(s) in ${filesScanned} files\n\n`);
    for (const v of violations) {
      process.stderr.write(`  ${v.file}:${v.line}  [${v.kind}]  import '${v.spec}'\n`);
    }
    process.stderr.write(
      `\n  .college/ must not import from src/ (asymmetric rootdir boundary, ` +
      `#10435). Redeclare the needed type locally (local-interface redeclaration ` +
      `discipline) — see docs/cross-rootdir-wire-discipline.md.\n\n`,
    );
  }
}

// ── exit code ────────────────────────────────────────────────────────────────
if (violations.length > 0 && (MODE_STRICT || !MODE_JSON)) {
  process.exit(1);
}
