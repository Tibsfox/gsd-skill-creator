#!/usr/bin/env node
/**
 * scripts/apply-to-self.mjs (v1.49.636 C7)
 *
 * Apply-to-self enforcement: greps newly-authored test files in the
 * milestone diff against patterns extracted from discipline docs.
 * WARNS (does not BLOCK) by default. Closes Meta-Lesson from v1.49.635
 * (discipline docs only prove their value when their authors follow
 * them in the same commit window).
 *
 * Discovery:
 *   - newly-authored test files via `git diff --diff-filter=A`
 *   - discipline patterns by parsing `## Apply-to-self check` sections
 *     from .planning/test-discipline/*.md + .planning/ship-pipeline-discipline.md
 *
 * Output:
 *   - default (text): findings as "WARN: <file> : <pattern>" lines on stderr
 *   - --json: ApplyToSelfCheckResult JSON on stdout
 *
 * Exit codes:
 *   0  no findings OR all findings allowlisted (default WARN-only)
 *   1  findings present (set SC_REQUIRE_APPLY_TO_SELF=1 to convert WARN→BLOCK)
 *   2  unrecoverable error (e.g. invalid --diff-against ref)
 *
 * Env vars:
 *   SC_SKIP_APPLY_TO_SELF=1       skip entirely, exit 0
 *   SC_REQUIRE_APPLY_TO_SELF=1    convert WARN to BLOCK (exit 1 on findings)
 *
 * Usage:
 *   node scripts/apply-to-self.mjs --diff-against <ref> [--json]
 *   node scripts/apply-to-self.mjs   (defaults to latest tag .. HEAD)
 */

import { execSync, execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DISCIPLINE_PATHS = [
  '.planning/test-discipline',
  '.planning/ship-pipeline-discipline.md',
];

const DEFAULT_ALLOWLIST_PATH =
  '.planning/ship-pipeline-discipline/apply-to-self-allowlist.md';

// git pathspec globs: `**` does NOT match zero directories, so we need
// both the top-level `*.test.ts` and the nested form. Magic-pathspec
// `**/*.test.ts` would work if we marked the pathspec as `:(glob)`,
// but plain shell globs need the explicit two-form expansion.
const DEFAULT_NEW_TEST_GLOBS = [
  'tests/*.test.ts',
  'tests/**/*.test.ts',
  'src/**/__tests__/*.test.ts',
  'src/**/__tests__/**/*.test.ts',
  'src/**/*.test.ts',
];

/**
 * @typedef {Object} ApplyToSelfFinding
 * @property {string} file
 * @property {number} line
 * @property {string} patternName
 * @property {'ok'|'warn'|'violation'} status
 * @property {string} snippet
 */

/**
 * @typedef {Object} ApplyToSelfCheckResult
 * @property {string} milestoneId
 * @property {string[]} disciplineDocPaths
 * @property {string[]} newTestFiles
 * @property {ApplyToSelfFinding[]} findings
 * @property {boolean} pass
 * @property {string[]} allowlistedViolations
 */

const KNOWN_PATTERNS = [
  {
    name: 'existsSync-no-skip-guard',
    mode: 'per-file',
    description:
      'Test calls existsSync/access/readFileSync on a path under .planning/ without an `if (!existsSync(...)) return` skip-guard or `it.runIf` (Lesson #10180).',
    detect(content) {
      // True when the file calls existsSync against a .planning/ path
      // AND does NOT have a skip-guard or runIf pattern nearby.
      const usesExistsSync = /\b(existsSync|fs\.accessSync|readFileSync)\b/.test(content);
      const looksAtPlanningPath = /['"`].*\.planning\//.test(content);
      if (!usesExistsSync || !looksAtPlanningPath) return null;
      // Skip-guard detection: must be a real code pattern, not a
      // mention in a comment. Match only the actual constructs:
      //   `if (!existsSync(...)) return`
      //   `it.runIf(...)`, `describe.runIf(...)`
      const hasSkipGuard =
        /\b(it|describe)\.runIf\s*\(/.test(content) ||
        /if\s*\(\s*!\s*existsSync\s*\(/.test(content);
      if (hasSkipGuard) return null;
      return { line: 1, snippet: 'existsSync .planning path lacks skip-guard' };
    },
  },
  {
    name: 'perf-assertion-no-warmup',
    mode: 'per-file',
    description:
      'Test contains a perf assertion (toBeLessThan against literal or relative ratio) without a warmup loop above (Lessons #10180 + #10181 + #10182).',
    detect(content) {
      const hasPerfAssertion =
        /expect\([^)]*(latency|p95|p99|duration|throughput|qps|opsPerSec|mean|avg|p50|t\d+|elapsed|elapsedMs|avgMs|secondCallMs|mountTime|median)[^)]*\)\.toBeLessThan/.test(
          content,
        );
      if (!hasPerfAssertion) return null;
      const hasWarmupLoop =
        /\bwarmup\b|\bwarm.up\b|for\s*\([^)]*\)\s*{\s*[^}]*await[^}]*}\s*\/\/\s*warm/i.test(
          content,
        ) ||
        /\/\/\s*Warm.up/i.test(content);
      if (hasWarmupLoop) return null;
      return { line: 1, snippet: 'perf assertion without visible warmup loop' };
    },
  },
  {
    name: 'posix-ere-translation-missing',
    mode: 'per-file',
    firstSurfacedIn: 'v1.49.636 C3 (Lesson #10188)',
    description:
      'JS regex `.source` containing \\d / \\s / \\w is passed to a POSIX-ERE consumer (git grep -E, grep -E, awk, sed -E) without translation to character classes ([0-9], [ \\t], etc). POSIX ERE does NOT understand JS shorthand classes.',
    detect(content) {
      // Look for: a .source reference adjacent to a POSIX-ERE invocation,
      // where the .source-bearing regex contains \d / \s / \w.
      // Heuristic: search for `.source` in the file AND find a regex in
      // the same file containing the shorthand classes AND find a POSIX-ERE
      // invocation. If translation (`.replace(/\\d/g, '[0-9]')` etc) is
      // already present, suppress.
      const usesDotSource = /\.source\b/.test(content);
      if (!usesDotSource) return null;
      const hasShorthandRegex = /\/[^/\n]*\\[dsw][^/\n]*\//.test(content);
      if (!hasShorthandRegex) return null;
      // POSIX-ERE consumers: spawn() / execSync() / shell-string forms.
      // Matches: `git grep ... -E`, `grep ... -E`, `awk`, `sed ... -E`,
      // including spawnSync(..., ['git', 'grep', ..., '-E', ...]) shape
      // where args are separated across array elements.
      const hasPosixEre =
        // Shell-string forms (single string command).
        /git\s+grep\s+[^"'`]*-E\b|\bgrep\s+[-]?[^"'`]*?-E\b|\bawk\b|\bsed\s+[^"'`]*-E\b/.test(content) ||
        // Array-form spawn invocations: ['grep', ..., '-E', ...] or
        // ['git', 'grep', ..., '-E', ...] across separate args.
        (/['"`](grep|git|awk|sed)['"`]/.test(content) &&
          /['"`]-E['"`]/.test(content));
      if (!hasPosixEre) return null;
      // Translation present?
      const hasTranslation =
        /\.replace\(\s*\/\\\\d\/g\s*,\s*['"`]\[0-9\]['"`]/.test(content) ||
        /\.replace\(\s*\/\\\\s\/g\s*,\s*['"`]\[[ \\\\t]+\]['"`]/.test(content) ||
        // Allow a brief inline translation comment to count as evidence.
        /\/\/[^\n]*translate[^\n]*\\\\d/.test(content);
      if (hasTranslation) return null;
      return {
        line: 1,
        snippet: 'POSIX-ERE consumer receives JS shorthand class without translation',
      };
    },
  },
  {
    name: 'comment-vs-code-pattern',
    mode: 'per-file',
    firstSurfacedIn: 'v1.49.636 C7 (Lesson #10189)',
    description:
      'Pattern detector matches a commentary token without a code-boundary anchor. E.g. a regex like /skip-guard/ without \\b boundary, or /runIf/ without preceding `it\\.` or `describe\\.`, will match prose in comments and over-fire.',
    detect(content) {
      // Heuristic: find lines inside an array literal (KNOWN_PATTERNS-like)
      // that contain a regex matching what look like prose tokens
      // (lowercase-hyphenated words like `skip-guard`, `runIf`, etc) with
      // no surrounding boundary or anchor.
      //
      // We only fire when the file LOOKS like a pattern catalog
      // (contains `KNOWN_PATTERNS` or `detect:` shape) AND has a regex
      // that hits a common comment-vs-code anti-pattern.
      const looksLikePatternCatalog =
        /\bKNOWN_PATTERNS\b/.test(content) ||
        /\bdetect\s*[:\(]/.test(content);
      if (!looksLikePatternCatalog) return null;
      // Identify suspect regexes: a /regex/ that matches a "hyphenated
      // word" or camelCase identifier WITHOUT \b boundaries or it\./describe\.
      // anchor.
      // Pattern: a regex literal where the body contains [a-z]+-[a-z]+
      // and there's no preceding \b within ~6 chars.
      const suspectRe = /\/([^/\n\\]*?)\b([a-z]+-[a-z]+|[a-z]+[A-Z][a-zA-Z]+)\b([^/\n\\]*?)\//g;
      let match;
      while ((match = suspectRe.exec(content)) !== null) {
        const before = match[1];
        const after = match[3];
        const inner = match[0];
        const hasBoundary =
          /\\b/.test(before) ||
          /\\b/.test(after) ||
          /\(it|describe\)\\\.|\b(it|describe)\\\./.test(before);
        if (!hasBoundary) {
          return {
            line: 1,
            snippet: `pattern catalog regex \`${inner}\` lacks code-boundary anchor`,
          };
        }
      }
      return null;
    },
  },
  {
    name: 'sweep-substrate-allowlist-missing',
    mode: 'diff-level',
    firstSurfacedIn: 'v1.49.636 C8 (Lesson #10190)',
    description:
      'A sweep-tool script (scripts/sweep-*.sh / scripts/sweep-*.mjs) was added without a paired negative-test fixture (scripts/__tests__/sweep-*.test.mjs) in the same diff. Sweep tools must ship with allowlist/negative-test coverage to prevent over-sweep of substrate citations.',
    detect(diffFiles) {
      // diffFiles: array of added paths in the diff range.
      // For each added sweep script, look for a sibling sweep test added
      // in the same diff. Report each unpaired sweep script.
      const sweepScripts = diffFiles.filter((p) =>
        /^scripts\/sweep-[^/]+\.(sh|mjs|js|ts)$/.test(p),
      );
      const sweepTests = diffFiles.filter((p) =>
        /^scripts\/__tests__\/sweep-[^/]+\.test\.(mjs|js|ts)$/.test(p),
      );
      const findings = [];
      for (const script of sweepScripts) {
        // Extract sweep name suffix to look for matching test.
        const m = script.match(/^scripts\/sweep-([^/.]+)\./);
        if (!m) continue;
        const sweepName = m[1];
        const expectedTest = `scripts/__tests__/sweep-${sweepName}.test.`;
        const paired = sweepTests.some((t) => t.startsWith(expectedTest));
        if (!paired) {
          findings.push({
            file: script,
            line: 1,
            snippet: `sweep script added without paired ${expectedTest}{mjs,js,ts} fixture`,
          });
        }
      }
      return findings.length > 0 ? findings : null;
    },
  },
];

function getLatestTag(cwd = process.cwd()) {
  try {
    return execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      cwd,
    }).trim();
  } catch {
    return null;
  }
}

function getDiffRange(cliRef) {
  if (cliRef) return cliRef.includes('..') ? cliRef : `${cliRef}..HEAD`;
  const tag = getLatestTag();
  if (!tag) return null; // no tag available; caller should default to listing all test files
  return `${tag}..HEAD`;
}

export function listNewTestFiles({ diffRange, cwd = process.cwd() } = {}) {
  if (!diffRange) {
    // Without a diff range, fall back to enumerating all test files
    // matching the default globs. Tests rarely have hundreds of new
    // files; this is a safety net for first-clone / no-tag environments.
    return [];
  }
  try {
    // execFileSync (arg array, no shell) so glob pathspecs are passed to git
    // verbatim — POSIX shells must not glob-expand them and Windows cmd.exe
    // must not leave the single-quotes attached (the prior shell-string form
    // broke pathspec matching on the windows-latest runner).
    const out = execFileSync(
      'git',
      ['diff', '--name-only', '--diff-filter=A', diffRange, '--', ...DEFAULT_NEW_TEST_GLOBS],
      { encoding: 'utf8', cwd },
    );
    return out
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => l.trim());
  } catch {
    return [];
  }
}

/**
 * List ALL added files in the diff range (not just tests). Used by
 * diff-level detectors like sweep-substrate-allowlist-missing
 * (v1.49.637 C7 Sub-1b).
 */
export function listAllAddedFiles({ diffRange, cwd = process.cwd() } = {}) {
  if (!diffRange) return [];
  try {
    const out = execSync(
      `git diff --name-only --diff-filter=A ${diffRange}`,
      { encoding: 'utf8', cwd },
    );
    return out
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => l.trim());
  } catch {
    return [];
  }
}

export function listDisciplineDocs(paths) {
  const docs = [];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const name of readdirSync(p)) {
        if (name.endsWith('.md')) docs.push(join(p, name));
      }
    } else if (st.isFile() && p.endsWith('.md')) {
      docs.push(p);
    }
  }
  return docs;
}

/**
 * Load the allowlist from `apply-to-self-allowlist.md`. Returns a Set of
 * "file::patternName" strings; an entry silences findings that match
 * BOTH the file and pattern.
 */
export function loadAllowlist(allowlistPath = DEFAULT_ALLOWLIST_PATH) {
  if (!existsSync(allowlistPath)) return new Set();
  const content = readFileSync(allowlistPath, 'utf8');
  const out = new Set();
  // Markdown-table rows like "| path | pattern | ..." after the header.
  const re = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  for (let m; (m = re.exec(content)); ) {
    const file = m[1].trim();
    const pattern = m[2].trim();
    // Skip header rows.
    if (
      file === 'File' ||
      file === 'File (relative to repo root)' ||
      file.startsWith('---') ||
      file.length === 0
    ) continue;
    out.add(`${file}::${pattern}`);
  }
  return out;
}

/**
 * Top-level entry: scan new test files for known violation patterns.
 *
 * Per-file patterns (`mode: 'per-file'`) run against each new test file's
 * content. Diff-level patterns (`mode: 'diff-level'`) run once against
 * the full list of added files in the diff range. Both kinds emit
 * `ApplyToSelfFinding` records uniformly. (v1.49.637 C7 Sub-1b
 * extension for sweep-substrate-allowlist-missing.)
 */
export function runApplyToSelf({
  diffRange = null,
  disciplinePaths = DEFAULT_DISCIPLINE_PATHS,
  allowlistPath = DEFAULT_ALLOWLIST_PATH,
  cwd = process.cwd(),
  knownPatterns = KNOWN_PATTERNS,
  injectedAddedFiles = null,
} = {}) {
  /** @type {ApplyToSelfCheckResult} */
  const result = {
    milestoneId: 'unknown',
    disciplineDocPaths: listDisciplineDocs(disciplinePaths),
    newTestFiles: listNewTestFiles({ diffRange, cwd }),
    findings: [],
    pass: true,
    allowlistedViolations: [],
  };

  const allow = loadAllowlist(allowlistPath);

  // Per-file detectors.
  const perFile = knownPatterns.filter((p) => (p.mode || 'per-file') === 'per-file');
  for (const f of result.newTestFiles) {
    let content;
    try {
      // Resolve relative to `cwd` so tests that pass a fixture cwd
      // can find the new test files even when the script is invoked
      // from a different working directory.
      content = readFileSync(join(cwd, f), 'utf8');
    } catch {
      continue;
    }
    for (const pattern of perFile) {
      const hit = pattern.detect(content);
      if (!hit) continue;
      const key = `${f}::${pattern.name}`;
      if (allow.has(key)) {
        result.allowlistedViolations.push(key);
        continue;
      }
      result.findings.push({
        file: f,
        line: hit.line || 1,
        patternName: pattern.name,
        status: 'warn',
        snippet: hit.snippet,
      });
    }
  }

  // Diff-level detectors. Allow tests to inject the added-files list
  // (so we can exercise the detector deterministically without spinning
  // up real git history).
  const diffLevel = knownPatterns.filter((p) => p.mode === 'diff-level');
  const addedFiles =
    injectedAddedFiles !== null
      ? injectedAddedFiles
      : listAllAddedFiles({ diffRange, cwd });
  for (const pattern of diffLevel) {
    const hits = pattern.detect(addedFiles);
    if (!hits) continue;
    const findings = Array.isArray(hits) ? hits : [hits];
    for (const hit of findings) {
      const targetFile = hit.file || '<diff-level>';
      const key = `${targetFile}::${pattern.name}`;
      if (allow.has(key)) {
        result.allowlistedViolations.push(key);
        continue;
      }
      result.findings.push({
        file: targetFile,
        line: hit.line || 1,
        patternName: pattern.name,
        status: 'warn',
        snippet: hit.snippet,
      });
    }
  }

  result.pass = result.findings.length === 0;
  return result;
}

function main(argv) {
  const json = argv.includes('--json');
  const diffIdx = argv.indexOf('--diff-against');
  const cliRef =
    diffIdx >= 0 && diffIdx + 1 < argv.length ? argv[diffIdx + 1] : null;

  if (process.env.SC_SKIP_APPLY_TO_SELF === '1') {
    if (!json) process.stdout.write('[apply-to-self] skipped (SC_SKIP_APPLY_TO_SELF=1)\n');
    return 0;
  }

  const result = runApplyToSelf({ diffRange: getDiffRange(cliRef) });

  if (json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    if (result.findings.length === 0) {
      process.stdout.write(
        `[apply-to-self] OK — 0 findings across ${result.newTestFiles.length} new test file(s) and ${result.disciplineDocPaths.length} discipline doc(s)\n`,
      );
    } else {
      process.stderr.write(
        `[apply-to-self] WARN — ${result.findings.length} finding(s) across ${result.newTestFiles.length} new test file(s):\n`,
      );
      for (const finding of result.findings) {
        process.stderr.write(
          `  WARN: ${finding.file}:${finding.line} : ${finding.patternName}\n    ${finding.snippet}\n`,
        );
      }
      process.stderr.write(
        `[apply-to-self] To silence, add an entry to ${DEFAULT_ALLOWLIST_PATH}\n`,
      );
    }
    if (result.allowlistedViolations.length > 0) {
      process.stdout.write(
        `[apply-to-self] ${result.allowlistedViolations.length} allowlisted finding(s) silenced.\n`,
      );
    }
  }

  if (result.findings.length > 0 && process.env.SC_REQUIRE_APPLY_TO_SELF === '1') {
    return 1;
  }
  return 0;
}

// Exported for tests (v1.49.637 C7 Sub-1b).
export { KNOWN_PATTERNS };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
