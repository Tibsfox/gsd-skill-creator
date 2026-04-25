/**
 * HB-06 ambiguity linter — flag-off byte-identical invariant.
 *
 * With `cs25-26-sweep.ambiguity-lint.enabled=false` (or block absent, or
 * file absent), the settings reader must report disabled. The promotion
 * pipeline contract is: when disabled, callers treat any `flags` as
 * advisory warnings and do not change exit codes / promotion decisions.
 *
 * This test asserts the settings-reader contract; the linter itself is
 * pure and always produces a result. Default-off therefore means
 * promotion behavior is byte-identical to the v1.49.574 baseline because
 * callers gate their action on `isAmbiguityLintEnabled()`.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isAmbiguityLintEnabled,
  readAmbiguityLintConfig,
} from '../ambiguity-settings.js';

function withFlag(value: boolean | undefined): {
  configPath: string;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), 'amb-lint-test-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  const block: Record<string, unknown> = {};
  if (value !== undefined) block.enabled = value;
  writeFileSync(
    configPath,
    JSON.stringify({
      'gsd-skill-creator': {
        'cs25-26-sweep': {
          'ambiguity-lint': block,
        },
      },
    }),
  );
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function withMissingFile(): { configPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'amb-lint-test-'));
  return {
    configPath: join(dir, '.claude', 'never-created.json'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

describe('HB-06 ambiguity — flag-off byte-identical', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('config-missing case → disabled', () => {
    const env = withMissingFile();
    cleanups.push(env.cleanup);
    expect(isAmbiguityLintEnabled(env.configPath)).toBe(false);
    expect(readAmbiguityLintConfig(env.configPath).enabled).toBe(false);
  });

  it('flag-false case → disabled', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    expect(isAmbiguityLintEnabled(env.configPath)).toBe(false);
  });

  it('flag-absent (block present, no enabled key) → disabled', () => {
    const env = withFlag(undefined);
    cleanups.push(env.cleanup);
    expect(isAmbiguityLintEnabled(env.configPath)).toBe(false);
  });

  it('flag-true case → enabled (proves the off case is meaningful)', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    expect(isAmbiguityLintEnabled(env.configPath)).toBe(true);
  });

  it('malformed JSON → fail-closed disabled', () => {
    const dir = mkdtempSync(join(tmpdir(), 'amb-lint-test-'));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const configPath = join(claudeDir, 'gsd-skill-creator.json');
    writeFileSync(configPath, '{ this is : not json');
    expect(isAmbiguityLintEnabled(configPath)).toBe(false);
  });
});
