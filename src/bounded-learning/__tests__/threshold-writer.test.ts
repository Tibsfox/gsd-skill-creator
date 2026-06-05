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

  it('writes cooldown_days through to disk and preserves siblings (v1.49.796)', async () => {
    writeConfig({ suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 } });
    const rec = makeRecommendation({
      threshold: 'suggestions.cooldown_days',
      currentValue: 7,
      proposedValue: 6,
      direction: 'decrease',
      meanObservation: 1,
      reason: 'cooldown_days test recommendation',
    });
    const outcome = await applyRecommendation(rec, { configPath, apply: true });
    expect(outcome.kind).toBe('applied');
    if (outcome.kind !== 'applied') throw new Error('unreachable');
    expect(outcome.previousValue).toBe(7);
    expect(outcome.newValue).toBe(6);
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'suggestions.cooldown_days')).toBe(6);
    expect(readThresholdValue(onDisk, 'suggestions.min_occurrences')).toBe(3);
    expect(readThresholdValue(onDisk, 'suggestions.auto_dismiss_after_days')).toBe(30);
  });

  it('writes token_budget.warn_at_percent through to disk and preserves siblings (v1.49.798)', async () => {
    writeConfig({
      suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 },
      token_budget: { max_percent: 5, warn_at_percent: 4 },
    });
    const rec = makeRecommendation({
      threshold: 'token_budget.warn_at_percent',
      currentValue: 4,
      proposedValue: 3,
      direction: 'decrease',
      meanObservation: 1,
      reason: 'token_budget.warn_at_percent test recommendation',
    });
    const outcome = await applyRecommendation(rec, { configPath, apply: true });
    expect(outcome.kind).toBe('applied');
    if (outcome.kind !== 'applied') throw new Error('unreachable');
    expect(outcome.previousValue).toBe(4);
    expect(outcome.newValue).toBe(3);
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'token_budget.warn_at_percent')).toBe(3);
    expect(readThresholdValue(onDisk, 'token_budget.max_percent')).toBe(5);
    expect(readThresholdValue(onDisk, 'suggestions.min_occurrences')).toBe(3);
    expect(readThresholdValue(onDisk, 'suggestions.cooldown_days')).toBe(7);
    expect(readThresholdValue(onDisk, 'suggestions.auto_dismiss_after_days')).toBe(30);
  });

  it('writes auto_dismiss_after_days through to disk and preserves siblings (v1.49.797)', async () => {
    writeConfig({ suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 } });
    const rec = makeRecommendation({
      threshold: 'suggestions.auto_dismiss_after_days',
      currentValue: 30,
      proposedValue: 29,
      direction: 'decrease',
      meanObservation: 1,
      reason: 'auto_dismiss_after_days test recommendation',
    });
    const outcome = await applyRecommendation(rec, { configPath, apply: true });
    expect(outcome.kind).toBe('applied');
    if (outcome.kind !== 'applied') throw new Error('unreachable');
    expect(outcome.previousValue).toBe(30);
    expect(outcome.newValue).toBe(29);
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'suggestions.auto_dismiss_after_days')).toBe(29);
    expect(readThresholdValue(onDisk, 'suggestions.min_occurrences')).toBe(3);
    expect(readThresholdValue(onDisk, 'suggestions.cooldown_days')).toBe(7);
  });
});

describe('applyRecommendation — retention bidirectional guard (v1.49.982 / Ship 5.2 Option D)', () => {
  let eventsPath: string;

  beforeEach(() => {
    eventsPath = join(tmpRoot, 'observation-retention-events.jsonl');
  });

  function writeEvents(kinds: Array<'too_aggressive' | 'too_lax'>): void {
    const lines = kinds.map((kind, i) =>
      JSON.stringify({ timestamp: `2026-06-0${(i % 9) + 1}T00:00:00.000Z`, kind, droppedCount: 3, retentionDays: 90 }),
    );
    writeFileSync(eventsPath, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
  }

  const retentionRec = () =>
    makeRecommendation({
      threshold: 'observation.retention_days',
      currentValue: 90,
      proposedValue: 91,
      direction: 'increase',
      reason: 'retention guard test',
    });

  it('refuses --apply when the signal is one-directional (only too_aggressive)', async () => {
    writeConfig({ observation: { retention_days: 90 } });
    writeEvents(['too_aggressive', 'too_aggressive', 'too_aggressive']);
    const outcome = await applyRecommendation(retentionRec(), { configPath, apply: true, retentionEventsPath: eventsPath });
    expect(outcome.kind).toBe('refused');
    if (outcome.kind !== 'refused') throw new Error('unreachable');
    expect(outcome.reason).toContain('not verifiably bidirectional');
    // On-disk config untouched.
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'observation.retention_days')).toBe(90);
  });

  it('refuses --apply when there are no retention events at all', async () => {
    writeConfig({ observation: { retention_days: 90 } });
    // eventsPath intentionally not created (missing file → 0 events).
    const outcome = await applyRecommendation(retentionRec(), { configPath, apply: true, retentionEventsPath: eventsPath });
    expect(outcome.kind).toBe('refused');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'observation.retention_days')).toBe(90);
  });

  it('refuses --apply when the signal is one-directional (only too_lax)', async () => {
    // The guard is symmetric: a future all-too_lax corpus is just as degenerate.
    writeConfig({ observation: { retention_days: 90 } });
    writeEvents(['too_lax', 'too_lax']);
    const outcome = await applyRecommendation(retentionRec(), { configPath, apply: true, retentionEventsPath: eventsPath });
    expect(outcome.kind).toBe('refused');
  });

  it('applies when the signal is verifiably bidirectional (both kinds present)', async () => {
    writeConfig({ observation: { retention_days: 90 } });
    writeEvents(['too_aggressive', 'too_lax', 'too_aggressive']);
    const outcome = await applyRecommendation(retentionRec(), { configPath, apply: true, retentionEventsPath: eventsPath });
    expect(outcome.kind).toBe('applied');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'observation.retention_days')).toBe(91);
  });

  it('does NOT guard dry-run (the intended post-fix path)', async () => {
    writeConfig({ observation: { retention_days: 90 } });
    writeEvents(['too_aggressive']); // one-directional
    const outcome = await applyRecommendation(retentionRec(), { configPath, apply: false, retentionEventsPath: eventsPath });
    expect(outcome.kind).toBe('dry-run');
    // Dry-run never writes regardless.
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'observation.retention_days')).toBe(90);
  });

  it('does NOT guard other thresholds (retention signal is irrelevant to them)', async () => {
    writeConfig({ suggestions: { min_occurrences: 3 } });
    writeEvents(['too_aggressive']); // one-directional retention, but rec is for a different threshold
    const outcome = await applyRecommendation(makeRecommendation(), { configPath, apply: true, retentionEventsPath: eventsPath });
    expect(outcome.kind).toBe('applied');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(readThresholdValue(onDisk, 'suggestions.min_occurrences')).toBe(2);
  });
});
