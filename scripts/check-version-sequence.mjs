#!/usr/bin/env node
/**
 * scripts/check-version-sequence.mjs (v1.49.636 C5)
 *
 * Sanity-checks that the upcoming `package.json` version bump is
 * sequential (`prev.patch + 1`) relative to the most recent git tag
 * matching `vN.N.N`. Closes Lesson #10183 (slot-pinning incident at
 * v1.49.635 → v1.49.650 → v1.49.635 correction).
 *
 * Default behavior: warn on non-sequential bump, exit 0 (soft gate).
 *   SC_REQUIRE_SEQUENTIAL_VERSION=1   hard-fail on non-sequential (exit 1)
 *   SC_SKIP_VERSION_SEQUENCE_CHECK=1  silence + pass (intentional gap)
 *
 * Output:
 *   default          human-readable text on stdout (verdict line) + warn on stderr
 *   --json           VersionSequenceCheckResult JSON on stdout
 *
 * Exit codes:
 *   0  sequential OR soft-warn OR explicit skip
 *   1  non-sequential AND SC_REQUIRE_SEQUENTIAL_VERSION=1
 *   2  package.json version is malformed (unparseable)
 *
 * See: .planning/missions/v1-49-636-housekeeping-cluster-3/components/05-version-sequence-check.md
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {Object} VersionSequenceCheckResult
 * @property {string} packageJsonVersion
 * @property {string|null} latestTagVersion
 * @property {boolean} isSequential
 * @property {number} gap
 * @property {'pass'|'warn'|'fail'} verdict
 * @property {string} message
 */

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(s) {
  const m = VERSION_RE.exec(s);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

export function readPackageVersion(packageJsonPath = 'package.json') {
  const raw = readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(raw);
  if (typeof pkg.version !== 'string') {
    throw new Error(
      `package.json version field is not a string (got ${typeof pkg.version})`,
    );
  }
  return pkg.version;
}

/**
 * Returns all `vN.N.N` git tags sorted by semver (latest last).
 * Returns [] when no matching tags or git is not available.
 */
export function listGitVersionTags(cwd = process.cwd()) {
  try {
    const out = execSync('git tag -l "v*.*.*" --sort=v:refname', {
      encoding: 'utf8',
      cwd,
    });
    return out
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^v\d+\.\d+\.\d+$/.test(l));
  } catch {
    return [];
  }
}

/**
 * Latest tag matching the same major.minor as `current`, returned as
 * the bare version string (no `v` prefix). Returns `null` when no
 * matching prior tag exists (e.g. first release in a new minor line).
 */
export function findPriorTagSameMinor(current, tags) {
  const curr = parseVersion(current);
  if (!curr) return null;
  const [cMajor, cMinor] = curr;
  // Pick the highest tag that matches the same major.minor and has a
  // strictly lower patch.
  let best = null;
  for (const tag of tags) {
    const v = parseVersion(tag.slice(1)); // strip 'v'
    if (!v) continue;
    const [maj, min, pat] = v;
    if (maj !== cMajor || min !== cMinor) continue;
    if (pat >= curr[2]) continue; // not strictly prior
    if (best === null || pat > parseVersion(best)[2]) best = tag.slice(1);
  }
  return best;
}

export function checkVersionSequence({ cwd = process.cwd(), packageJsonPath = 'package.json' } = {}) {
  /** @type {VersionSequenceCheckResult} */
  const result = {
    packageJsonVersion: '',
    latestTagVersion: null,
    isSequential: false,
    gap: 0,
    verdict: 'pass',
    message: '',
  };

  let pkgVersion;
  try {
    pkgVersion = readPackageVersion(`${cwd}/${packageJsonPath}`.replace('//', '/'));
  } catch (err) {
    result.verdict = 'fail';
    result.message = `package.json read/parse error: ${err.message}`;
    return result;
  }
  result.packageJsonVersion = pkgVersion;

  const parsed = parseVersion(pkgVersion);
  if (!parsed) {
    result.verdict = 'fail';
    result.message = `package.json version "${pkgVersion}" is not in N.N.N format`;
    return result;
  }

  const tags = listGitVersionTags(cwd);
  const prior = findPriorTagSameMinor(pkgVersion, tags);
  result.latestTagVersion = prior;

  if (prior === null) {
    // No prior tag in this minor line — first patch release. Treat as
    // pass (sequential by definition from "nothing").
    result.isSequential = true;
    result.gap = 0;
    result.verdict = 'pass';
    result.message =
      `package.json ${pkgVersion}: no prior v${parsed[0]}.${parsed[1]}.x tag — first patch in minor line; sequential by definition.`;
    return result;
  }

  const priorParsed = parseVersion(prior);
  const expectedPatch = priorParsed[2] + 1;
  const gap = parsed[2] - expectedPatch;
  result.gap = gap;
  result.isSequential = gap === 0;

  if (result.isSequential) {
    result.verdict = 'pass';
    result.message = `package.json ${pkgVersion} is sequential vs prior tag v${prior} (patch + 1).`;
  } else if (gap < 0) {
    result.verdict = 'fail';
    result.message = `package.json ${pkgVersion} REGRESSES vs prior tag v${prior} (gap ${gap}; patch must be > prior).`;
  } else {
    result.verdict = 'warn';
    result.message = `package.json ${pkgVersion} skips ${gap} slot(s) vs prior tag v${prior} (expected v${parsed[0]}.${parsed[1]}.${expectedPatch}).`;
  }

  return result;
}

function main(argv) {
  const json = argv.includes('--json');
  const result = checkVersionSequence();

  if (json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(result.message + '\n');
  }

  // Hard fail: malformed package.json (verdict === 'fail' from parse, OR
  // patch regression). Always exit 2 on parse error; exit 1 only when
  // operator opted into strict mode.
  if (result.verdict === 'fail') {
    if (result.message.startsWith('package.json read/parse error') ||
        result.message.includes('is not in N.N.N format')) {
      return 2;
    }
    // Regression (patch < prior) is always a hard fail.
    process.stderr.write(`ERROR: ${result.message}\n`);
    return 1;
  }

  if (result.verdict === 'warn') {
    if (process.env.SC_SKIP_VERSION_SEQUENCE_CHECK === '1') {
      // Explicit override: silence + pass.
      return 0;
    }
    if (process.env.SC_REQUIRE_SEQUENTIAL_VERSION === '1') {
      process.stderr.write(
        `ERROR: non-sequential version bump and SC_REQUIRE_SEQUENTIAL_VERSION=1\n`,
      );
      return 1;
    }
    // Soft-warn: print to stderr, return 0.
    process.stderr.write(
      `WARNING: ${result.message} If intentional, set SC_SKIP_VERSION_SEQUENCE_CHECK=1 + document in release-notes.\n`,
    );
    return 0;
  }

  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
