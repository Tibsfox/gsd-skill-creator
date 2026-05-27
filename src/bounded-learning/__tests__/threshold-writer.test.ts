/**
 * Tests for the threshold writer.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyRecommendation,
  readThresholdValue,
  setThresholdValue,
} from '../threshold-writer.js';
import type { CalibrationRecommendation } from '../types.js';

let tmpRoot: string;
let configPath: string;

function writeConfig(value: unknown): void {
  writeFileSync(configPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function makeRecommendation(
  overrides: Partial<CalibrationRecommendation> = {},
): CalibrationRecommendation {
  return {
    threshold: 'suggestions.min_occurrences',
    currentValue: 3,
    proposedValue: 2,
    direction: 'decrease',
    rejected: true,
    evidence: 50,
    rejectionThreshold: 40,
    observations: 10,
    meanObservation: 1,
    alpha: 0.05,
    reason: 'test recommendation',
    ...overrides,
  };
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'threshold-writer-test-'));
  configPath = join(tmpRoot, 'skill-creator.json');
});

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

describe('readThresholdValue', () => {
  it('resolves nested dotted-path values', () => {
    expect(readThresholdValue({ suggestions: { min_occurrences: 3 } }, 'suggestions.min_occurrences')).toBe(3);
    expect(readThresholdValue({ token_budget: { max_percent: 5 } }, 'token_budget.max_percent')).toBe(5);
  });

  it('returns undefined for missing segments', () => {
    expect(readThresholdValue({}, 'suggestions.min_occurrences')).toBeUndefined();
    expect(readThresholdValue({ suggestions: {} }, 'suggestions.min_occurrences')).toBeUndefined();
  });

  it('returns undefined for non-numeric leaf values', () => {
    expect(readThresholdValue({ suggestions: { min_occurrences: '3' } }, 'suggestions.min_occurrences')).toBeUndefined();
  });
});

describe('setThresholdValue', () => {
  it('updates a value without mutating the input', () => {
    const input = { suggestions: { min_occurrences: 3 } };
    const output = setThresholdValue(input, 'suggestions.min_occurrences', 2);
    expect(readThresholdValue(output, 'suggestions.min_occurrences')).toBe(2);
    expect(input.suggestions.min_occurrences).toBe(3);
  });

  it('preserves sibling keys', () => {
    const input = { suggestions: { min_occurrences: 3, cooldown_days: 7 } };
    const output = setThresholdValue(input, 'suggestions.min_occurrences', 2);
    expect(readThresholdValue(output, 'suggestions.cooldown_days')).toBe(7);
  });

  it('creates intermediate objects when missing', () => {
    const output = setThresholdValue({}, 'suggestions.min_occurrences', 5);
    expect(readThresholdValue(output, 'suggestions.min_occurrences')).toBe(5);
  });
});

describe('applyRecommendation', () => {
  it('returns noop on hold direction', async () => {
    writeConfig({ suggestions: { min_occurrences: 3 } });
    const rec = makeRecommendation({ direction: 'hold', proposedValue: null });
    const outcome = await applyRecommendation(rec, { configPath });
    expect(outcome.kind).toBe('noop');
  });

  it('returns dry-run when apply=false (default) on actionable recommendation', async () => {
    writeConfig({ suggestions: { min_occurrences: 3, cooldown_days: 7 } });
    const rec = makeRecommendation();
    const outcome = await applyRecommendation(rec, { configPath });
    expect(outcome.kind).toBe('dry-run');
    if (outcome.kind !== 'dry-run') throw new Error('unreachable');
    expect(outcome.proposedValue).toBe(2);
    expect(readThresholdValue(outcome.proposedConfig, 'suggestions.min_occurrences')).toBe(2);
    expect(readThresholdValue(outcome.proposedConfig, 'suggestions.cooldown_days')).toBe(7);
    // On-disk file untouched.
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'suggestions.min_occurrences')).toBe(3);
  });

  it('writes atomically when apply=true', async () => {
    writeConfig({ suggestions: { min_occurrences: 3, cooldown_days: 7 } });
    const rec = makeRecommendation();
    const outcome = await applyRecommendation(rec, { configPath, apply: true });
    expect(outcome.kind).toBe('applied');
    if (outcome.kind !== 'applied') throw new Error('unreachable');
    expect(outcome.previousValue).toBe(3);
    expect(outcome.newValue).toBe(2);
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'suggestions.min_occurrences')).toBe(2);
    expect(readThresholdValue(onDisk, 'suggestions.cooldown_days')).toBe(7);
  });

  it('refuses to apply on concurrent edit', async () => {
    // On-disk threshold is 5, but the recommendation was computed against 3.
    writeConfig({ suggestions: { min_occurrences: 5 } });
    const rec = makeRecommendation({ currentValue: 3 });
    const outcome = await applyRecommendation(rec, { configPath, apply: true });
    expect(outcome.kind).toBe('noop');
    if (outcome.kind !== 'noop') throw new Error('unreachable');
    expect(outcome.reason).toContain('Concurrent edit');
    // On-disk file unchanged.
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'suggestions.min_occurrences')).toBe(5);
  });

  it('returns noop when config file is missing', async () => {
    // configPath not created.
    const rec = makeRecommendation();
    const outcome = await applyRecommendation(rec, { configPath, apply: true });
    expect(outcome.kind).toBe('noop');
    if (outcome.kind !== 'noop') throw new Error('unreachable');
    expect(outcome.reason).toContain('not found');
  });

  it('returns noop when threshold is missing from config', async () => {
    writeConfig({ unrelated: { stuff: 42 } });
    const rec = makeRecommendation();
    const outcome = await applyRecommendation(rec, { configPath, apply: true });
    expect(outcome.kind).toBe('noop');
    if (outcome.kind !== 'noop') throw new Error('unreachable');
    expect(outcome.reason).toContain('not found in config');
    expect(existsSync(configPath)).toBe(true);
  });
});
