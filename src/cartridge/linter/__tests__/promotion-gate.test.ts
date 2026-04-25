/**
 * HB-05 — promotion-gate behavior: with flag on, lint failures BLOCK
 * promotion; with flag off, only warnings are emitted (non-blocking).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { runPromotionGate } from '../index.js';
import { withFlag, withMissingFile } from './test-helpers.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');
const failingMd = readFileSync(join(FIXTURES, 'negative-1-missing-computability.md'), 'utf8');
const passingMd = readFileSync(join(FIXTURES, 'positive-1-full-coverage.md'), 'utf8');

describe('runPromotionGate', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('flag ON + lint pass → not blocked, no warnings', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const r = runPromotionGate(passingMd, 'positive-1.md', { settingsPath: env.configPath });
    expect(r.flagEnabled).toBe(true);
    expect(r.lintFailed).toBe(false);
    expect(r.blocked).toBe(false);
    expect(r.warnings.length).toBe(0);
  });

  it('flag ON + lint fail → BLOCKED, warnings populated', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const r = runPromotionGate(failingMd, 'negative-1.md', { settingsPath: env.configPath });
    expect(r.flagEnabled).toBe(true);
    expect(r.lintFailed).toBe(true);
    expect(r.blocked).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings.join('\n')).toContain('computability-grounding');
  });

  it('flag OFF + lint fail → NOT blocked, warnings still emitted', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const r = runPromotionGate(failingMd, 'negative-1.md', { settingsPath: env.configPath });
    expect(r.flagEnabled).toBe(false);
    expect(r.lintFailed).toBe(true);
    expect(r.blocked).toBe(false); // critical: warnings only
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('missing config file → flag treated as off; not blocked', () => {
    const env = withMissingFile();
    cleanups.push(env.cleanup);
    const r = runPromotionGate(failingMd, 'negative-1.md', { settingsPath: env.configPath });
    expect(r.flagEnabled).toBe(false);
    expect(r.blocked).toBe(false);
  });

  it('flag OFF + lint pass → no warnings, no block', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const r = runPromotionGate(passingMd, 'positive-1.md', { settingsPath: env.configPath });
    expect(r.lintFailed).toBe(false);
    expect(r.blocked).toBe(false);
    expect(r.warnings.length).toBe(0);
  });
});
