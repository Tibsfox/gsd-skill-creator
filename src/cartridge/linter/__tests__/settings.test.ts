/**
 * HB-05 — settings reader tests (mirror HB-02 settings test layout).
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULT_STRUCTURAL_COMPLETENESS_CONFIG,
  isStructuralCompletenessEnabled,
  readStructuralCompletenessConfig,
} from '../index.js';
import { withFlag, withMissingFile } from './test-helpers.js';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('structural-completeness — settings', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('default is enabled=false', () => {
    expect(DEFAULT_STRUCTURAL_COMPLETENESS_CONFIG.enabled).toBe(false);
  });

  it('returns disabled when config file is missing', () => {
    const env = withMissingFile();
    cleanups.push(env.cleanup);
    expect(readStructuralCompletenessConfig(env.configPath).enabled).toBe(false);
    expect(isStructuralCompletenessEnabled(env.configPath)).toBe(false);
  });

  it('returns disabled when JSON is malformed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sclint-malformed-'));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const p = join(claudeDir, 'gsd-skill-creator.json');
    writeFileSync(p, '{not-json,');
    expect(isStructuralCompletenessEnabled(p)).toBe(false);
  });

  it('returns disabled when block exists but flag missing', () => {
    const env = withFlag(undefined);
    cleanups.push(env.cleanup);
    expect(isStructuralCompletenessEnabled(env.configPath)).toBe(false);
  });

  it('returns disabled when flag is wrong type', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sclint-wrongtype-'));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const p = join(claudeDir, 'gsd-skill-creator.json');
    writeFileSync(
      p,
      JSON.stringify({
        'gsd-skill-creator': {
          'cs25-26-sweep': { 'structural-completeness-lint': { enabled: 'yes' } },
        },
      }),
    );
    expect(isStructuralCompletenessEnabled(p)).toBe(false);
  });

  it('returns enabled when flag is true', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    expect(isStructuralCompletenessEnabled(env.configPath)).toBe(true);
  });

  it('coexists with parallel cs25-26-sweep flags (does not clobber agentdog-schema)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sclint-coexist-'));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const p = join(claudeDir, 'gsd-skill-creator.json');
    writeFileSync(
      p,
      JSON.stringify({
        'gsd-skill-creator': {
          'cs25-26-sweep': {
            'agentdog-schema': { enabled: true },
            'structural-completeness-lint': { enabled: true },
          },
        },
      }),
    );
    expect(isStructuralCompletenessEnabled(p)).toBe(true);
  });
});
