/**
 * HB-02 AgentDoG — settings reader tests.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULT_AGENTDOG_CONFIG,
  isAgentDogEnabled,
  readAgentDogConfig,
} from '../index.js';
import { withFlag, withMissingFile } from './test-helpers.js';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('AgentDoG — settings', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('default is enabled=false', () => {
    expect(DEFAULT_AGENTDOG_CONFIG.enabled).toBe(false);
  });

  it('returns disabled when config file is missing', () => {
    const env = withMissingFile();
    cleanups.push(env.cleanup);
    expect(readAgentDogConfig(env.configPath).enabled).toBe(false);
    expect(isAgentDogEnabled(env.configPath)).toBe(false);
  });

  it('returns disabled when JSON is malformed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agentdog-malformed-'));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const p = join(claudeDir, 'gsd-skill-creator.json');
    writeFileSync(p, '{not-json,');
    expect(isAgentDogEnabled(p)).toBe(false);
  });

  it('returns disabled when block exists but flag missing', () => {
    const env = withFlag(undefined);
    cleanups.push(env.cleanup);
    expect(isAgentDogEnabled(env.configPath)).toBe(false);
  });

  it('returns disabled when flag is the wrong type', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agentdog-wrongtype-'));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const p = join(claudeDir, 'gsd-skill-creator.json');
    writeFileSync(
      p,
      JSON.stringify({
        'gsd-skill-creator': {
          'cs25-26-sweep': { 'agentdog-schema': { enabled: 'yes' } },
        },
      }),
    );
    expect(isAgentDogEnabled(p)).toBe(false);
  });

  it('returns enabled when flag is true', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    expect(isAgentDogEnabled(env.configPath)).toBe(true);
  });

  it('coexists with parallel cs25-26-sweep flags (does not clobber tool-attention)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agentdog-coexist-'));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const p = join(claudeDir, 'gsd-skill-creator.json');
    writeFileSync(
      p,
      JSON.stringify({
        'gsd-skill-creator': {
          'cs25-26-sweep': {
            'tool-attention': { enabled: true },
            'agentdog-schema': { enabled: true },
          },
        },
      }),
    );
    expect(isAgentDogEnabled(p)).toBe(true);
  });
});
