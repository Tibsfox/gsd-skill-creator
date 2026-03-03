/**
 * Behavioral tests for the pacing advisory verify subcommand.
 *
 * Proves that cmdVerifyPacing reads .planning/STATE.md and config.json,
 * runs session budget checks, and outputs a formatted advisory report
 * with advisory_only: true (never blocking).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Module under test — use project-local copy
const projectRoot = join(__dirname, '..', '..');
const verify = require(join(projectRoot, '.claude/get-shit-done/bin/lib/verify.cjs'));
const { cmdVerifyPacing } = verify;

// ============================================================================
// Test fixtures
// ============================================================================

function createPacingFixture(opts: {
  stateContent?: string;
  configContent?: string;
  skipPlanning?: boolean;
}): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'verify-pacing-'));

  if (!opts.skipPlanning) {
    const planningDir = join(tmpDir, '.planning');
    mkdirSync(planningDir, { recursive: true });

    if (opts.stateContent) {
      writeFileSync(join(planningDir, 'STATE.md'), opts.stateContent);
    }
    if (opts.configContent) {
      writeFileSync(join(planningDir, 'config.json'), opts.configContent);
    }
  }

  return tmpDir;
}

/** Captures JSON output by mocking process.stdout.write and process.exit */
function captureOutput(fn: () => void): any {
  let captured = '';
  const origExit = process.exit;
  const origWrite = process.stdout.write;

  process.exit = vi.fn(() => { throw new Error('EXIT_0'); }) as any;
  process.stdout.write = vi.fn((chunk: any) => {
    captured += typeof chunk === 'string' ? chunk : chunk.toString();
    return true;
  }) as any;

  try {
    fn();
  } catch (e: any) {
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
// cmdVerifyPacing
// ============================================================================

describe('cmdVerifyPacing', () => {
  let tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs = [];
  });

  it('returns advisory_only: true -- never blocks', () => {
    const stateContent = [
      '---',
      'milestone: v1.50.13',
      'status: active',
      '---',
      '# Project State',
      '',
      '## Performance Metrics',
      '',
      '| Phase | Plans | Total | Avg/Plan |',
      '|-------|-------|-------|----------|',
      '| 556 | 2/2 | ~10min | ~5min |',
      '| 557 | 2/2 | ~6min | ~3min |',
    ].join('\n');

    const dir = createPacingFixture({ stateContent });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyPacing(dir, false);
    });

    expect(result.advisory_only).toBe(true);
  });

  it('returns pass status when within session budget', () => {
    const stateContent = [
      '---',
      'milestone: v1.50.13',
      'status: active',
      '---',
      '# Project State',
      '',
      '## Performance Metrics',
      '',
      '| Phase | Plans | Total | Avg/Plan |',
      '|-------|-------|-------|----------|',
      '| 556 | 2/2 | ~10min | ~5min |',
    ].join('\n');

    const dir = createPacingFixture({ stateContent });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyPacing(dir, false);
    });

    expect(result.status).toBe('pass');
    expect(result.checks).toBeDefined();
    expect(Array.isArray(result.checks)).toBe(true);
  });

  it('returns warn status when exceeding session budget', () => {
    const stateContent = [
      '---',
      'milestone: v1.50.13',
      'status: active',
      '---',
      '# Project State',
      '',
      '## Performance Metrics',
      '',
      '| Phase | Plans | Total | Avg/Plan |',
      '|-------|-------|-------|----------|',
      '| 556 | 2/2 | ~10min | ~5min |',
      '| 557 | 2/2 | ~6min | ~3min |',
      '| 558 | 3/3 | ~13min | ~4min |',
      '| 559 | 3/3 | ~10min | ~3min |',
      '| 560 | 2/2 | ~9min | ~4min |',
      '| 561 | 3/3 | ~12min | ~4min |',
    ].join('\n');

    const configContent = JSON.stringify({
      pacing: { maxSubversionsPerSession: 3 }
    });

    const dir = createPacingFixture({ stateContent, configContent });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyPacing(dir, false);
    });

    expect(result.status).toBe('warn');
  });

  it('each check has { name, status, detail } structure', () => {
    const stateContent = [
      '---',
      'milestone: v1.50.13',
      'status: active',
      '---',
      '# Project State',
      '',
      '## Performance Metrics',
      '',
      '| Phase | Plans | Total | Avg/Plan |',
      '|-------|-------|-------|----------|',
      '| 556 | 2/2 | ~10min | ~5min |',
    ].join('\n');

    const dir = createPacingFixture({ stateContent });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyPacing(dir, false);
    });

    expect(result.checks.length).toBeGreaterThan(0);
    for (const check of result.checks) {
      expect(check).toHaveProperty('name');
      expect(check).toHaveProperty('status');
      expect(check).toHaveProperty('detail');
    }
  });

  it('report field contains human-readable multi-line text', () => {
    const stateContent = [
      '---',
      'milestone: v1.50.13',
      'status: active',
      '---',
      '# Project State',
    ].join('\n');

    const dir = createPacingFixture({ stateContent });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyPacing(dir, false);
    });

    expect(typeof result.report).toBe('string');
    expect(result.report).toContain('\n');
    expect(result.report.length).toBeGreaterThan(20);
  });

  it('handles missing .planning/ directory gracefully (error result, no crash)', () => {
    const dir = createPacingFixture({ skipPlanning: true });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyPacing(dir, false);
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    // Should return an error result, not throw
    expect(result.error || result.status).toBeDefined();
  });

  it('uses default budget when config.json is missing', () => {
    const stateContent = [
      '---',
      'milestone: v1.50.13',
      'status: active',
      '---',
      '# Project State',
      '',
      '## Performance Metrics',
      '',
      '| Phase | Plans | Total | Avg/Plan |',
      '|-------|-------|-------|----------|',
      '| 556 | 2/2 | ~10min | ~5min |',
    ].join('\n');

    const dir = createPacingFixture({ stateContent });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyPacing(dir, false);
    });

    // Should still work with default budget, not crash
    expect(result.advisory_only).toBe(true);
    expect(result.checks).toBeDefined();
  });
});
