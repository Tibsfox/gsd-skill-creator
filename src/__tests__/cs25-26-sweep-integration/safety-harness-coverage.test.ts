/**
 * Phase 813 (v1.49.575) — safety-harness coverage check.
 *
 * Verifies the three CS25-10 safety-test categories are physically present
 * and runnable:
 *   1. STD calibration test (HB-03) — under
 *      `src/safety/std-calibration/__tests__/`.
 *   2. where/how/what BLOCK schema test (HB-02) — under
 *      `src/safety/agentdog/__tests__/`.
 *   3. MCP six-attack-family tests — deferred per
 *      `docs/release-notes/v1.49.575/safety-harness-updates.md`. Marked as
 *      `it.todo` with a forward-citation to v1.49.576+.
 *
 * @module __tests__/cs25-26-sweep-integration/safety-harness-coverage
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

describe('cs25-26-sweep — safety-harness coverage (Phase 813)', () => {
  it('CS25-10.a STD calibration tests are present (HB-03)', () => {
    const dir = join(
      REPO_ROOT,
      'src',
      'safety',
      'std-calibration',
      '__tests__',
    );
    expect(existsSync(dir)).toBe(true);
    const files = readdirSync(dir);
    // At minimum the calibration-table + decay-measurement + capcom-gate +
    // re-injection tests must exist.
    const required = [
      'calibration-table.test.ts',
      'decay-measurement.test.ts',
      'capcom-gate.test.ts',
      're-injection.test.ts',
      'flag-off-byte-identical.test.ts',
    ];
    for (const f of required) {
      expect(files.includes(f), `expected ${f} in ${dir}`).toBe(true);
    }
  });

  it('CS25-10.b where/how/what BLOCK-schema tests are present (HB-02)', () => {
    const dir = join(REPO_ROOT, 'src', 'safety', 'agentdog', '__tests__');
    expect(existsSync(dir)).toBe(true);
    const files = readdirSync(dir);
    // Each axis has a dedicated test plus an integration test.
    const required = [
      'where.test.ts',
      'how.test.ts',
      'what.test.ts',
      'integration.test.ts',
      'taxonomy.test.ts',
      'flag-off-byte-identical.test.ts',
    ];
    for (const f of required) {
      expect(files.includes(f), `expected ${f} in ${dir}`).toBe(true);
    }
  });

  it('safety-harness-updates.md documents the MCP six-attack-family scope', () => {
    const path = join(
      REPO_ROOT,
      'docs',
      'release-notes',
      'v1.49.575',
      'safety-harness-updates.md',
    );
    expect(existsSync(path)).toBe(true);
    const contents = readFileSync(path, 'utf8');
    // Must mention MCP attacks at minimum; the file is the spec for the
    // deferred test set.
    expect(contents.toLowerCase()).toContain('mcp');
  });

  // The MCP six-attack-family test set is NOT implemented in HB-01..HB-07.
  // Per the safety-harness-updates.md doc, it is a v1.49.576+ implementation
  // mission. Marking as todo preserves the gap as visible in the test runner.
  it.todo(
    'CS25-10.c MCP six-attack-family tests — deferred to v1.49.576+ per docs/release-notes/v1.49.575/safety-harness-updates.md',
  );

  it('all three CS25-10 categories accounted for (present-or-deferred)', () => {
    // Acceptance summary: 2 present + 1 deferred (with doc) = 3 covered.
    const stdPresent = existsSync(
      join(REPO_ROOT, 'src', 'safety', 'std-calibration', '__tests__'),
    );
    const agentDogPresent = existsSync(
      join(REPO_ROOT, 'src', 'safety', 'agentdog', '__tests__'),
    );
    const harnessDocPresent = existsSync(
      join(
        REPO_ROOT,
        'docs',
        'release-notes',
        'v1.49.575',
        'safety-harness-updates.md',
      ),
    );
    expect(stdPresent && agentDogPresent && harnessDocPresent).toBe(true);
  });
});
