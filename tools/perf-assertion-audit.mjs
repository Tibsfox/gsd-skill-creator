#!/usr/bin/env node
/**
 * Perf-Assertion Audit Tool (v1.49.636 C3).
 *
 * Greps the repo for perf-assertion shapes per the extended catalog at
 * `.planning/test-discipline/perf-assertion-warmup.md` (Lessons #10181 +
 * #10182) and classifies each match by tier-up profile.
 *
 * Three shape classes detected:
 *   - absolute-threshold (named identifier — latency, p95, p99, etc.)
 *   - absolute-threshold (generic identifier — mean, avg, t1..tN, etc.)
 *   - relative-ratio (expect(b).toBeLessThan(a * N))
 *
 * Usage:
 *   node tools/perf-assertion-audit.mjs                 # human-readable
 *   node tools/perf-assertion-audit.mjs --json          # machine-readable
 *   node tools/perf-assertion-audit.mjs --diff <ref>    # only sites added since <ref>
 *
 * Exit codes:
 *   0  any hits found (informational; tool is read-only)
 *   1  unrecoverable error (e.g. missing source roots)
 *
 * For G-gate enforcement use the apply-to-self check at the bottom of
 * `perf-assertion-warmup.md` rather than this tool's exit code.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_ROOTS = ['src', 'desktop', 'tests'];

// POSIX ERE — must avoid non-capturing groups (?:...). Use plain capture
// groups instead; git grep -E doesn't support PCRE features by default.
const SHAPE_PATTERNS = {
  'absolute-threshold-named':
    /expect\([^)]*(latency|p95|p99|duration|throughput|qps|opsPerSec)[^)]*\)\.toBeLessThan/,
  'absolute-threshold-generic':
    /expect\((mean|avg|p50|t\d+|elapsed|elapsedMs|avgMs|secondCallMs|mountTime|median)\)\.toBeLessThan/,
  'relative-ratio':
    /expect\([^)]+\)\.toBeLessThan\([^)]+\*\s*\d+(\.\d+)?\)/,
};

// Native-module-backed import signatures — when a test file imports any
// of these, flagged sites get the `native-module-backed` profile.
const NATIVE_MODULE_HINTS = [
  'tree-sitter',
  'better-sqlite3',
  'keyring',
  '@napi-rs',
  'node-keytar',
];

// I/O-bound import signatures.
const IO_BOUND_HINTS = [
  'node:fs',
  'node:child_process',
  'node:http',
  'node:net',
  'node:dgram',
];

/**
 * Run `git grep -n` for an extended regex across SOURCE_ROOTS.
 * Returns an array of `{ path, lineNumber, snippet }` records.
 *
 * Note: POSIX ERE does NOT understand JS regex shorthand classes
 * (`\d`, `\s`, `\w`). We translate `\d` to `[0-9]` before invoking git
 * grep so callers can pass JS regex `.source` directly.
 */
function gitGrep(pattern) {
  // Translate JS shorthand to POSIX ERE equivalents.
  const ereCompat = pattern.replace(/\\d/g, '[0-9]').replace(/\\s/g, '[ \\t]');
  const result = spawnSync(
    'git',
    ['grep', '-n', '-E', ereCompat, '--', ...SOURCE_ROOTS],
    { encoding: 'utf8' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0 && result.status !== 1) {
    // 1 = no matches; treat as empty.
    throw new Error(
      `git grep failed (status ${result.status}): ${result.stderr}`,
    );
  }
  const lines = (result.stdout || '').trim().split('\n').filter(Boolean);
  return lines.map((line) => {
    const idx1 = line.indexOf(':');
    const idx2 = line.indexOf(':', idx1 + 1);
    if (idx1 < 0 || idx2 < 0) {
      return { path: line, lineNumber: 0, snippet: '' };
    }
    return {
      path: line.slice(0, idx1),
      lineNumber: parseInt(line.slice(idx1 + 1, idx2), 10),
      snippet: line.slice(idx2 + 1),
    };
  });
}

function classifyTierUp(path) {
  if (!existsSync(path)) return 'unknown';
  let contents;
  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    return 'unknown';
  }
  const hasNative = NATIVE_MODULE_HINTS.some((h) => contents.includes(h));
  const hasIo = IO_BOUND_HINTS.some((h) => contents.includes(h));
  if (hasNative && hasIo) return 'mixed';
  if (hasNative) return 'native-module-backed';
  if (hasIo) return 'io-bound';
  return 'pure-js';
}

function detectShape(snippet) {
  // Order matters: relative-ratio is the most specific (and would also
  // match the generic-identifier shape since `t4` etc. appear on both
  // sides). Check the more-specific pattern first.
  const ordered = [
    'relative-ratio',
    'absolute-threshold-named',
    'absolute-threshold-generic',
  ];
  for (const shape of ordered) {
    const re = SHAPE_PATTERNS[shape];
    if (re && re.test(snippet)) return shape;
  }
  return 'unknown';
}

/**
 * Filter findings to only lines added since `gitRef`. Useful for
 * apply-to-self gates that only care about new perf assertions
 * introduced by the current milestone.
 */
function filterAddedSince(findings, gitRef) {
  // Build a set of "path:line" for added lines in the diff against gitRef.
  const result = spawnSync(
    'git',
    ['diff', '--unified=0', gitRef + '..HEAD', '--', ...SOURCE_ROOTS],
    { encoding: 'utf8' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git diff failed: ${result.stderr}`);
  }
  const added = new Set();
  let currentPath = '';
  let currentNewStart = 0;
  let offsetInHunk = 0;
  for (const line of (result.stdout || '').split('\n')) {
    if (line.startsWith('+++ b/')) {
      currentPath = line.slice(6);
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (hunk) {
      currentNewStart = parseInt(hunk[1], 10);
      offsetInHunk = 0;
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.add(`${currentPath}:${currentNewStart + offsetInHunk}`);
      offsetInHunk++;
    } else if (!line.startsWith('-')) {
      offsetInHunk++;
    }
  }
  return findings.filter((f) => added.has(`${f.path}:${f.lineNumber}`));
}

function runAudit({ diffRef = null } = {}) {
  const seen = new Map();
  for (const [shape, re] of Object.entries(SHAPE_PATTERNS)) {
    const hits = gitGrep(re.source);
    for (const hit of hits) {
      const key = `${hit.path}:${hit.lineNumber}`;
      if (!seen.has(key)) {
        seen.set(key, { ...hit, shape, tierUp: classifyTierUp(hit.path) });
      }
    }
  }
  let findings = [...seen.values()].sort(
    (a, b) =>
      a.path.localeCompare(b.path) || a.lineNumber - b.lineNumber,
  );
  if (diffRef) {
    findings = filterAddedSince(findings, diffRef);
  }
  // Re-classify shapes for entries seen by multiple patterns (the
  // generic-identifier regex may double-match an absolute-threshold
  // already classified by name). Prefer the more-specific match.
  for (const finding of findings) {
    finding.shape = detectShape(finding.snippet);
  }
  return findings;
}

function formatHuman(findings) {
  if (findings.length === 0) {
    return 'perf-assertion-audit: 0 findings\n';
  }
  const lines = [`perf-assertion-audit: ${findings.length} finding(s)\n`];
  const tally = {};
  for (const f of findings) {
    tally[f.shape] = (tally[f.shape] || 0) + 1;
  }
  lines.push('Shape tally:');
  for (const [shape, count] of Object.entries(tally).sort()) {
    lines.push(`  ${shape}: ${count}`);
  }
  lines.push('');
  lines.push('Findings:');
  for (const f of findings) {
    lines.push(`  [${f.shape} | ${f.tierUp}] ${f.path}:${f.lineNumber}`);
    lines.push(`    ${f.snippet.trim()}`);
  }
  return lines.join('\n') + '\n';
}

function main(argv) {
  const json = argv.includes('--json');
  const diffIdx = argv.indexOf('--diff');
  const diffRef =
    diffIdx >= 0 && diffIdx + 1 < argv.length ? argv[diffIdx + 1] : null;

  const findings = runAudit({ diffRef });
  if (json) {
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    process.stdout.write(formatHuman(findings));
  }
  return 0;
}

// Exported for tests.
export { runAudit, classifyTierUp, detectShape, SHAPE_PATTERNS };

// Run main when invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
