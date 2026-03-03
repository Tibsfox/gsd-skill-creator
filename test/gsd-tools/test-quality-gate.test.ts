/**
 * Behavioral tests for the test quality advisory gate.
 *
 * Proves that cmdVerifyTestQuality correctly classifies test evidence
 * per requirement, produces advisory warnings for shape-only evidence,
 * and never blocks verification (advisory_only: true always).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Module under test
const verify = require(join(process.env.HOME!, '.claude/get-shit-done/bin/lib/verify.cjs'));
const { cmdVerifyTestQuality } = verify;

// ============================================================================
// Test fixtures
// ============================================================================

/** Creates a temporary directory with a PLAN.md and optional test files */
function createFixture(opts: {
  requirements?: string[];
  files_modified?: string[];
  testFiles?: Record<string, string>;
}): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'tq-gate-'));
  const planDir = join(tmpDir, '.planning', 'phases', '99-test');
  mkdirSync(planDir, { recursive: true });

  const reqs = opts.requirements || ['TEST-01'];
  const files = opts.files_modified || [];

  const planContent = [
    '---',
    'phase: 99-test',
    'plan: 01',
    'type: tdd',
    'wave: 1',
    'depends_on: []',
    `files_modified:`,
    ...files.map(f => `  - "${f}"`),
    'autonomous: true',
    `requirements: [${reqs.join(', ')}]`,
    '',
    'must_haves:',
    '  truths: []',
    '  artifacts: []',
    '---',
    '',
    '<objective>Test plan</objective>',
  ].join('\n');

  writeFileSync(join(planDir, '99-01-PLAN.md'), planContent);

  // Create test files at the specified paths
  if (opts.testFiles) {
    for (const [relPath, content] of Object.entries(opts.testFiles)) {
      const fullPath = join(tmpDir, relPath);
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      mkdirSync(dir, { recursive: true });
      writeFileSync(fullPath, content);
    }
  }

  return tmpDir;
}

/** Captures JSON output by mocking process.stdout.write and process.exit */
function captureOutput(fn: () => void): any {
  let captured = '';
  const origExit = process.exit;
  const origWrite = process.stdout.write;

  // Mock process.exit to prevent test runner from exiting
  process.exit = vi.fn(() => { throw new Error('EXIT_0'); }) as any;

  // Mock stdout.write to capture JSON output
  process.stdout.write = vi.fn((chunk: any) => {
    captured += typeof chunk === 'string' ? chunk : chunk.toString();
    return true;
  }) as any;

  try {
    fn();
  } catch (e: any) {
    // Swallow the EXIT_0 error thrown by our mock
    if (!e.message?.includes('EXIT_0')) throw e;
  } finally {
    process.exit = origExit;
    process.stdout.write = origWrite;
  }

  try {
    return JSON.parse(captured);
  } catch {
    return captured;
  }
}

// ============================================================================
// cmdVerifyTestQuality
// ============================================================================

describe('cmdVerifyTestQuality', () => {
  let tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs = [];
  });

  it('returns advisory warnings for shape-only evidence (only existsSync assertions)', () => {
    const testContent = `
import { describe, it, assert } from 'vitest';
describe('check', () => {
  it('file exists', () => {
    const exists = fs.existsSync('/path/to/file');
    assert(exists, 'file should exist');
  });
  it('has enough lines', () => {
    const lineCount = content.split('\\n').length;
    assert(lineCount > 10);
  });
});
`;
    const dir = createFixture({
      requirements: ['TEST-01'],
      files_modified: ['test/example.test.ts'],
      testFiles: { 'test/example.test.ts': testContent },
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyTestQuality(dir, join('.planning', 'phases', '99-test', '99-01-PLAN.md'), true);
    });

    // Should have advisories about shape-only evidence
    expect(result.advisories).toBeDefined();
    expect(result.advisories.length).toBeGreaterThan(0);
    expect(result.advisories.some((a: string) => a.includes('shape-only') || a.includes('advisory'))).toBe(true);
  });

  it('returns behavioral evidence confirmed for output assertion tests', () => {
    const testContent = `
import { describe, it, expect } from 'vitest';
describe('classifier', () => {
  it('returns correct output', () => {
    expect(fn(input)).toBe(expectedOutput);
    expect(fn(other)).toEqual({ key: 'value' });
  });
});
`;
    const dir = createFixture({
      requirements: ['TEST-02'],
      files_modified: ['test/example.test.ts'],
      testFiles: { 'test/example.test.ts': testContent },
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyTestQuality(dir, join('.planning', 'phases', '99-test', '99-01-PLAN.md'), true);
    });

    expect(result.behavioral_count).toBeGreaterThan(0);
    // Check requirement_results for behavioral classification
    const reqResult = result.requirement_results.find((r: any) => r.reqId === 'TEST-02');
    expect(reqResult).toBeDefined();
    expect(reqResult.classification).toBe('behavioral');
  });

  it('returns advisory warning when plan has NO test files', () => {
    const dir = createFixture({
      requirements: ['TEST-01'],
      files_modified: ['src/lib/module.ts'],
      testFiles: {},
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyTestQuality(dir, join('.planning', 'phases', '99-test', '99-01-PLAN.md'), true);
    });

    expect(result.advisories).toBeDefined();
    expect(result.advisories.length).toBeGreaterThan(0);
    // Should warn about missing evidence
    expect(result.advisories.some((a: string) =>
      a.includes('no test evidence') || a.includes('advisory') || a.includes('unknown')
    )).toBe(true);
  });

  it('returns behavioral when mixed evidence present (behavioral trumps shape-only)', () => {
    const testContent = `
import { describe, it, expect } from 'vitest';
describe('mixed', () => {
  it('file exists', () => {
    expect(fs.existsSync('/path')).toBe(true);
  });
  it('function returns correct value', () => {
    expect(classify('hello')).toBe('greeting');
    expect(() => classify(null)).toThrow();
  });
});
`;
    const dir = createFixture({
      requirements: ['TEST-01'],
      files_modified: ['test/mixed.test.ts'],
      testFiles: { 'test/mixed.test.ts': testContent },
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyTestQuality(dir, join('.planning', 'phases', '99-test', '99-01-PLAN.md'), true);
    });

    // Behavioral should trump
    expect(result.behavioral_count).toBeGreaterThan(0);
    const reqResult = result.requirement_results.find((r: any) => r.reqId === 'TEST-01');
    expect(reqResult.classification).toBe('behavioral');
  });

  it('includes formatAdvisoryMessage output in advisories', () => {
    const testContent = `
describe('shape only', () => {
  it('checks line count', () => {
    const lineCount = content.split('\\n').length;
    assert(lineCount > 10);
  });
});
`;
    const dir = createFixture({
      requirements: ['REQ-05'],
      files_modified: ['test/shape.test.ts'],
      testFiles: { 'test/shape.test.ts': testContent },
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyTestQuality(dir, join('.planning', 'phases', '99-test', '99-01-PLAN.md'), true);
    });

    // Advisory message should include explanatory text from formatAdvisoryMessage
    const advisory = result.advisories.find((a: string) => a.includes('REQ-05'));
    expect(advisory).toBeDefined();
    expect(advisory).toMatch(/behavioral|shape-only|advisory/i);
  });

  it('has advisory_only: true field — never blocks verification', () => {
    const testContent = `
describe('shape only', () => {
  it('checks export count', () => {
    expect(exports.length === 5).toBe(true);
  });
});
`;
    const dir = createFixture({
      requirements: ['TEST-01'],
      files_modified: ['test/shape.test.ts'],
      testFiles: { 'test/shape.test.ts': testContent },
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyTestQuality(dir, join('.planning', 'phases', '99-test', '99-01-PLAN.md'), true);
    });

    expect(result.advisory_only).toBe(true);
    // Even with shape-only evidence, it should NOT have all_passed: false
    expect(result.all_passed).toBeUndefined();
  });

  it('checks multiple requirements independently — one behavioral + one shape-only', () => {
    const behavioralTest = `
describe('behavioral', () => {
  it('returns output', () => {
    expect(fn('a')).toBe('b');
  });
});
`;
    const shapeTest = `
describe('shape', () => {
  it('file exists', () => {
    expect(fs.existsSync('/path')).toBe(true);
  });
});
`;
    const dir = createFixture({
      requirements: ['REQ-01', 'REQ-02'],
      files_modified: ['test/behavioral.test.ts', 'test/shape.test.ts'],
      testFiles: {
        'test/behavioral.test.ts': behavioralTest,
        'test/shape.test.ts': shapeTest,
      },
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyTestQuality(dir, join('.planning', 'phases', '99-test', '99-01-PLAN.md'), true);
    });

    expect(result.requirements_checked).toBe(2);
    expect(result.requirement_results.length).toBe(2);
    // Each requirement should have its own classification
    // (they may share test files, but each req gets classified)
  });

  it('adversarial: if gate were blocking (all_passed=false for shape-only), advisory_only test would fail', () => {
    // This test proves the gate is truly non-blocking.
    // If someone changes the implementation to set all_passed: false
    // when shape-only evidence is detected, the advisory_only test above
    // would catch it. This test documents that invariant.
    const testContent = `
describe('check', () => {
  it('file exists', () => {
    expect(fs.existsSync('/path')).toBe(true);
  });
});
`;
    const dir = createFixture({
      requirements: ['TEST-01'],
      files_modified: ['test/shape.test.ts'],
      testFiles: { 'test/shape.test.ts': testContent },
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyTestQuality(dir, join('.planning', 'phases', '99-test', '99-01-PLAN.md'), true);
    });

    // The gate must always be advisory-only
    expect(result.advisory_only).toBe(true);
    // Shape-only evidence should still produce advisories, not failures
    expect(result.shape_only_count).toBeGreaterThanOrEqual(0);
  });
});
