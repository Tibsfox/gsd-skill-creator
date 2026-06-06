#!/usr/bin/env node
// tools/tauri-boundary-audit.mjs — Tauri boundary audit (CONCERNS §15)
//
// Enforces the HARD RULE from CLAUDE.md "Quick Reference":
//   - src/  never imports @tauri-apps/api
//   - desktop/ (non-test source) never imports Node.js builtins
//
// Authored 2026-05-10 in v1.49.634 component C02.
//
// Usage:
//   node tools/tauri-boundary-audit.mjs              # text report, exit 0/10
//   node tools/tauri-boundary-audit.mjs --json       # JSON report
//   node tools/tauri-boundary-audit.mjs --check      # exit-code only (pre-tag-gate)
//   node tools/tauri-boundary-audit.mjs --include-allowlisted  # debug
//
// Exit codes:
//   0  clean (or all violations allowlisted)
//   10 violations found
//   2  invalid args / not in repo

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

const SRC_DIR = join(REPO_ROOT, 'src');
const DESKTOP_DIR = join(REPO_ROOT, 'desktop');
const ALLOWLIST_PATH = join(REPO_ROOT, 'tools', 'tauri-boundary-audit.allowlist.json');

// Canonical relative path: forward-slash separators on every platform. The
// allowlist JSON and the gate's downstream consumers key on '/'-separated
// paths; path.relative() emits '\' on Windows, so normalize here. On POSIX
// this is a no-op (sep is already '/').
const relPosix = (from, to) => relative(from, to).split(sep).join('/');

const FILE_EXT_RE = /\.(ts|tsx|js|mjs|cjs)$/;
const TEST_FILE_RE = /\.(test|spec)\.[tj]sx?$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.next', '__tests__']);

// Match real `import ... from '@tauri-apps/api...'` and `require('@tauri-apps/api...')` statements.
// Multiline-safe: import block can span lines, but the from clause is on a single physical line.
const TAURI_IMPORT_RE = /(?:from\s*['"]|require\s*\(\s*['"]|import\s*\(\s*['"]|import\s+['"])(@tauri-apps\/api(?:\/[^'"]*)?)['"]/g;

// Node-only modules forbidden in desktop/ webview source (sample of common ones; expandable).
const NODE_BUILTINS = new Set([
  'fs', 'fs/promises', 'path', 'os', 'child_process', 'crypto',
  'stream', 'buffer', 'http', 'https', 'net', 'tls', 'dgram',
  'util', 'process', 'events', 'cluster', 'worker_threads',
  'readline', 'repl', 'vm', 'zlib', 'tty',
]);

const NODE_IMPORT_RE = /(?:from\s*['"]|require\s*\(\s*['"]|import\s*\(\s*['"]|import\s+['"])(node:[a-z_/]+|[a-z_]+)['"]/g;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    if (ent.name.startsWith('.')) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, acc);
    } else if (ent.isFile() && FILE_EXT_RE.test(ent.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function lineNumberOf(content, charIdx) {
  let line = 1;
  for (let i = 0; i < charIdx && i < content.length; i += 1) {
    if (content[i] === '\n') line += 1;
  }
  return line;
}

// Replace comment regions with spaces so character offsets remain stable.
// Handles // line comments and /* … */ block comments. Does not attempt to
// parse template-literal-embedded comments; close-enough for an audit pass.
function stripComments(content) {
  const out = content.split('');
  let i = 0;
  let inString = null; // tracks current string delim
  while (i < out.length) {
    const ch = out[i];
    const next = out[i + 1];
    if (inString) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      inString = ch;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '/') {
      while (i < out.length && out[i] !== '\n') {
        out[i] = ' ';
        i += 1;
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = content.indexOf('*/', i + 2);
      const stop = end === -1 ? out.length : end + 2;
      for (let j = i; j < stop; j += 1) {
        if (out[j] !== '\n') out[j] = ' ';
      }
      i = stop;
      continue;
    }
    i += 1;
  }
  return out.join('');
}

function scanSrcForTauri(files) {
  const violations = [];
  for (const file of files) {
    if (TEST_FILE_RE.test(file)) continue;
    let raw;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const content = stripComments(raw);
    let match;
    TAURI_IMPORT_RE.lastIndex = 0;
    while ((match = TAURI_IMPORT_RE.exec(content)) !== null) {
      violations.push({
        file: relPosix(REPO_ROOT, file),
        line: lineNumberOf(content, match.index),
        importPath: match[1],
        kind: 'src-imports-tauri',
      });
    }
  }
  return violations;
}

function scanDesktopForNode(files) {
  const violations = [];
  for (const file of files) {
    if (TEST_FILE_RE.test(file)) continue;
    // Also skip vite config and similar build-time files
    const base = file.split(/[/\\]/).pop() ?? '';
    if (base === 'vite.config.ts' || base === 'vitest.config.ts') continue;
    let raw;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const content = stripComments(raw);
    let match;
    NODE_IMPORT_RE.lastIndex = 0;
    while ((match = NODE_IMPORT_RE.exec(content)) !== null) {
      const spec = match[1];
      let isNode = false;
      if (spec.startsWith('node:')) {
        isNode = true;
      } else if (NODE_BUILTINS.has(spec)) {
        isNode = true;
      }
      if (isNode) {
        violations.push({
          file: relPosix(REPO_ROOT, file),
          line: lineNumberOf(content, match.index),
          importPath: spec,
          kind: 'desktop-imports-node',
        });
      }
    }
  }
  return violations;
}

function loadAllowlist() {
  if (!existsSync(ALLOWLIST_PATH)) {
    return { violations: [] };
  }
  try {
    return JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
  } catch {
    return { violations: [] };
  }
}

function isAllowlisted(violation, allowlist) {
  return allowlist.violations.some(
    (a) =>
      a.file === violation.file &&
      a.line === violation.line &&
      a.importPath === violation.importPath,
  );
}

function formatTextReport(violations, allowlisted) {
  const lines = [];
  lines.push('tauri-boundary-audit (CONCERNS §15)');
  lines.push(`scanned: src/ + desktop/ (excluding *.test.*, node_modules, dist, build)`);
  lines.push('');
  if (violations.length === 0 && allowlisted.length === 0) {
    lines.push('CLEAN — no boundary violations found.');
    return lines.join('\n');
  }
  if (violations.length > 0) {
    lines.push(`VIOLATIONS (${violations.length}):`);
    for (const v of violations) {
      lines.push(`  ${v.file}:${v.line}  [${v.kind}]  ${v.importPath}`);
    }
  }
  if (allowlisted.length > 0) {
    lines.push('');
    lines.push(`ALLOWLISTED (${allowlisted.length}) — counted as pass but flagged for follow-on:`);
    for (const v of allowlisted) {
      lines.push(`  ${v.file}:${v.line}  [${v.kind}]  ${v.importPath}`);
    }
  }
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const asJson = args.includes('--json');
  const includeAllowlisted = args.includes('--include-allowlisted');

  if (!existsSync(SRC_DIR) || !existsSync(DESKTOP_DIR)) {
    process.stderr.write('[tauri-boundary-audit] src/ or desktop/ missing — wrong cwd?\n');
    process.exit(2);
  }

  const srcFiles = walk(SRC_DIR);
  const desktopFiles = walk(DESKTOP_DIR);

  const allViolations = [
    ...scanSrcForTauri(srcFiles),
    ...scanDesktopForNode(desktopFiles),
  ];

  const allowlist = loadAllowlist();
  const real = [];
  const allowlisted = [];
  for (const v of allViolations) {
    if (isAllowlisted(v, allowlist)) {
      allowlisted.push(v);
    } else {
      real.push(v);
    }
  }

  if (asJson) {
    const out = includeAllowlisted
      ? { violations: real, allowlisted }
      : { violations: real };
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  } else if (!checkOnly) {
    process.stdout.write(formatTextReport(real, includeAllowlisted ? allowlisted : []) + '\n');
  }

  if (real.length > 0) {
    process.exit(10);
  }
  process.exit(0);
}

main();
