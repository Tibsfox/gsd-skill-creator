/**
 * Tests for tools/perf-assertion-audit.mjs (v1.49.636 C3).
 *
 * Asserts the audit tool catches both shape classes added at Lesson
 * #10181 (absolute-threshold generic + relative-ratio) and classifies
 * tier-up profiles via test-file content inspection.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  detectShape,
  classifyTierUp,
  runAudit,
  SHAPE_PATTERNS,
} from '../perf-assertion-audit.mjs';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('detectShape', () => {
  it('classifies named absolute-threshold sites', () => {
    expect(detectShape('expect(p95).toBeLessThan(10)')).toBe(
      'absolute-threshold-named',
    );
    expect(detectShape('expect(latency).toBeLessThan(50)')).toBe(
      'absolute-threshold-named',
    );
    expect(detectShape('expect(opsPerSec).toBeGreaterThan(100)')).not.toBe(
      'absolute-threshold-named',
    );
  });

  it('classifies generic absolute-threshold sites (Lesson #10181)', () => {
    expect(detectShape('expect(mean).toBeLessThan(200)')).toBe(
      'absolute-threshold-generic',
    );
    expect(detectShape('expect(avg).toBeLessThan(50)')).toBe(
      'absolute-threshold-generic',
    );
    expect(detectShape('expect(t1).toBeLessThan(100)')).toBe(
      'absolute-threshold-generic',
    );
    expect(detectShape('expect(elapsedMs).toBeLessThan(50)')).toBe(
      'absolute-threshold-generic',
    );
  });

  it('classifies relative-ratio sites (Lesson #10181)', () => {
    expect(detectShape('expect(t4).toBeLessThan(t1 * 5)')).toBe(
      'relative-ratio',
    );
    expect(detectShape('expect(t4).toBeLessThan(t1 * 10)')).toBe(
      'relative-ratio',
    );
    expect(detectShape('expect(hot.elapsedMs).toBeLessThan(cold.elapsedMs * 0.5)')).toBe(
      'relative-ratio',
    );
  });

  it('returns "unknown" for non-perf assertions', () => {
    expect(detectShape('expect(result).toEqual(expected)')).toBe('unknown');
    expect(detectShape('expect(count).toBe(7)')).toBe('unknown');
  });
});

describe('classifyTierUp', () => {
  let tmpDir;
  let nativeFile;
  let pureFile;
  let ioFile;
  let mixedFile;

  // Set up fixture files in a temp dir before any tier-up test.
  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'tier-up-test-'));
    nativeFile = join(tmpDir, 'native.test.ts');
    pureFile = join(tmpDir, 'pure.test.ts');
    ioFile = join(tmpDir, 'io.test.ts');
    mixedFile = join(tmpDir, 'mixed.test.ts');

    writeFileSync(
      nativeFile,
      "import Parser from 'tree-sitter';\nimport Foo from 'foo';\n",
    );
    writeFileSync(pureFile, "import { foo } from './foo';\n");
    writeFileSync(
      ioFile,
      "import { readFileSync } from 'node:fs';\nimport Bar from 'bar';\n",
    );
    writeFileSync(
      mixedFile,
      "import Parser from 'tree-sitter';\nimport { readFileSync } from 'node:fs';\n",
    );
  });

  afterAll(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('classifies native-module-backed via tree-sitter import', () => {
    expect(classifyTierUp(nativeFile)).toBe('native-module-backed');
  });

  it('classifies pure-js when no native or io imports present', () => {
    expect(classifyTierUp(pureFile)).toBe('pure-js');
  });

  it('classifies io-bound via node:fs import', () => {
    expect(classifyTierUp(ioFile)).toBe('io-bound');
  });

  it('classifies mixed when both native + io hints present', () => {
    expect(classifyTierUp(mixedFile)).toBe('mixed');
  });

  it('returns "unknown" when file does not exist', () => {
    expect(classifyTierUp('/nonexistent/path/foo.test.ts')).toBe('unknown');
  });
});

describe('SHAPE_PATTERNS — regex compilation', () => {
  it('every shape pattern compiles to a valid RegExp', () => {
    for (const [shape, re] of Object.entries(SHAPE_PATTERNS)) {
      expect(re).toBeInstanceOf(RegExp);
      expect(shape).toMatch(/^[a-z-]+$/);
    }
  });

  it('exposes three documented shape classes', () => {
    expect(Object.keys(SHAPE_PATTERNS)).toEqual(
      expect.arrayContaining([
        'absolute-threshold-named',
        'absolute-threshold-generic',
        'relative-ratio',
      ]),
    );
  });
});

describe('runAudit — repo-level smoke test', () => {
  it('returns an array of findings against the live repo', () => {
    const findings = runAudit();
    expect(Array.isArray(findings)).toBe(true);
    // The repo has historical perf assertions; expect at least 1 hit.
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f.path).toMatch(/\.(t|j)sx?$|\.test\./);
      expect(typeof f.lineNumber).toBe('number');
      expect(['absolute-threshold-named', 'absolute-threshold-generic', 'relative-ratio', 'unknown']).toContain(f.shape);
      expect(['pure-js', 'native-module-backed', 'io-bound', 'mixed', 'unknown']).toContain(f.tierUp);
    }
  });

  it('catches the v1.49.636 carry-forward sites (Lessons #10181 + #10182)', () => {
    const findings = runAudit();
    const paths = findings.map((f) => f.path);
    // S1: analyzer perf test with generic `mean` identifier.
    expect(paths).toEqual(
      expect.arrayContaining([
        'src/intelligence/analyzer/__tests__/performance.test.ts',
      ]),
    );
    // S2: atlas-indexer relative-ratio site.
    expect(paths).toEqual(
      expect.arrayContaining([
        'src/intelligence/atlas-indexer/__tests__/runner.test.ts',
      ]),
    );
  });
});

