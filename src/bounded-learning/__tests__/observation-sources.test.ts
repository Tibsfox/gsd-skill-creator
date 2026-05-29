import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  loadObservationsForThreshold,
  observationSourceFor,
} from '../observation-sources.js';

describe('observationSourceFor — per-class registry (v1.49.798)', () => {
  it('classifies suggestions.* thresholds as wired suggestions.json source', () => {
    const info = observationSourceFor('suggestions.min_occurrences');
    expect(info.sourceId).toBe('suggestions.json');
    expect(info.wired).toBe(true);
  });

  it('classifies suggestions.cooldown_days under the same source', () => {
    const info = observationSourceFor('suggestions.cooldown_days');
    expect(info.sourceId).toBe('suggestions.json');
    expect(info.wired).toBe(true);
  });

  it('classifies suggestions.auto_dismiss_after_days under the same source', () => {
    const info = observationSourceFor('suggestions.auto_dismiss_after_days');
    expect(info.sourceId).toBe('suggestions.json');
    expect(info.wired).toBe(true);
  });

  it('classifies token_budget.warn_at_percent as WIRED token-budget-events source (v1.49.803)', () => {
    const info = observationSourceFor('token_budget.warn_at_percent');
    expect(info.sourceId).toBe('token-budget-events');
    expect(info.wired).toBe(true);
    expect(info.description).not.toContain('NOT YET CAPTURED');
  });

  it('classifies token_budget.max_percent as unwired (still pending; only warn_at_percent wired at v1.49.803)', () => {
    const info = observationSourceFor('token_budget.max_percent');
    expect(info.sourceId).toBe('token-budget-events');
    expect(info.wired).toBe(false);
  });

  it('classifies observation.retention_days as WIRED observation-retention-events source (v1.49.884 flip)', () => {
    const info = observationSourceFor('observation.retention_days');
    expect(info.sourceId).toBe('observation-retention-events');
    expect(info.wired).toBe(true);
    expect(info.description).toMatch(/v1\.49\.884 read-side wire/);
  });

  it('classifies predictive.low_confidence_threshold as WIRED predictive-low-confidence-events source (v1.49.837 flip)', () => {
    const info = observationSourceFor('predictive.low_confidence_threshold');
    expect(info.sourceId).toBe('predictive-low-confidence-events');
    expect(info.wired).toBe(true);
    expect(info.description).toMatch(/v1\.49\.837 wire/);
  });
});

describe('loadObservationsForThreshold — per-class dispatch (v1.49.798)', () => {
  let workDir: string;
  let suggestionsPath: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-obs-sources-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    suggestionsPath = join(workDir, 'suggestions.json');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('loads suggestions.json for suggestions.* thresholds', async () => {
    writeFileSync(
      suggestionsPath,
      JSON.stringify([
        { id: 's-1', state: 'accepted' },
        { id: 's-2', state: 'dismissed' },
      ]),
      'utf8',
    );
    const obs = await loadObservationsForThreshold('suggestions.min_occurrences', {
      suggestionsPath,
    });
    expect(obs).toHaveLength(2);
    expect(obs[0]?.value).toBe(1);
    expect(obs[1]?.value).toBe(-1);
  });

  it('reads token-budget-events for token_budget.warn_at_percent (v1.49.803)', async () => {
    // Suggestions data is present but MUST NOT be consumed by token_budget threshold.
    writeFileSync(
      suggestionsPath,
      JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' }))),
      'utf8',
    );
    const tokenBudgetEventsPath = join(workDir, 'token-budget-events.jsonl');
    writeFileSync(
      tokenBudgetEventsPath,
      [
        JSON.stringify({ timestamp: '2026-05-27T00:00:00.000Z', kind: 'responsive' }),
        JSON.stringify({ timestamp: '2026-05-27T00:01:00.000Z', kind: 'ignored' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const obs = await loadObservationsForThreshold('token_budget.warn_at_percent', {
      suggestionsPath,
      tokenBudgetEventsPath,
    });
    expect(obs).toHaveLength(2);
    expect(obs[0]?.value).toBe(1);
    expect(obs[0]?.decision).toBe('accepted');
    expect(obs[1]?.value).toBe(-1);
    expect(obs[1]?.decision).toBe('dismissed');
  });

  it('returns empty for token_budget.warn_at_percent when events file missing (honest baseline)', async () => {
    const obs = await loadObservationsForThreshold('token_budget.warn_at_percent', {
      tokenBudgetEventsPath: join(workDir, 'does-not-exist.jsonl'),
    });
    expect(obs).toEqual([]);
  });

  it('returns empty for token_budget.max_percent regardless of events file (still unwired at v1.49.803)', async () => {
    const tokenBudgetEventsPath = join(workDir, 'token-budget-events.jsonl');
    writeFileSync(
      tokenBudgetEventsPath,
      JSON.stringify({ timestamp: '2026-05-27T00:00:00.000Z', kind: 'responsive' }) + '\n',
      'utf8',
    );
    const obs = await loadObservationsForThreshold('token_budget.max_percent', {
      tokenBudgetEventsPath,
    });
    expect(obs).toEqual([]);
  });

  it('reads observation-retention events JSONL when present (v1.49.884 wire)', async () => {
    const eventsPath = join(workDir, 'observation-retention-events.jsonl');
    writeFileSync(
      eventsPath,
      [
        JSON.stringify({ timestamp: '2026-05-28T00:00:00.000Z', kind: 'too_aggressive' }),
        JSON.stringify({ timestamp: '2026-05-28T00:01:00.000Z', kind: 'too_lax' }),
        JSON.stringify({ timestamp: '2026-05-28T00:02:00.000Z', kind: 'too_aggressive' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const obs = await loadObservationsForThreshold('observation.retention_days', {
      observationRetentionEventsPath: eventsPath,
    });
    expect(obs).toHaveLength(3);
    // too_aggressive → -1 (favor raise), too_lax → +1 (favor lower).
    // Same polarity shape as token-budget.
    expect(obs.map((o) => o.value)).toEqual([-1, 1, -1]);
  });

  it('returns empty array for observation.retention_days when JSONL is missing (honest no-data baseline)', async () => {
    const obs = await loadObservationsForThreshold('observation.retention_days', {
      observationRetentionEventsPath: join(workDir, 'never-written.jsonl'),
    });
    expect(obs).toEqual([]);
  });

  it('reads predictive-low-confidence events JSONL when present (v1.49.837 wire)', async () => {
    const eventsPath = join(workDir, 'predictive-low-confidence-events.jsonl');
    writeFileSync(
      eventsPath,
      [
        JSON.stringify({ timestamp: '2026-05-27T00:00:00.000Z', kind: 'useful' }),
        JSON.stringify({ timestamp: '2026-05-27T00:01:00.000Z', kind: 'not_useful' }),
        JSON.stringify({ timestamp: '2026-05-27T00:02:00.000Z', kind: 'useful' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const obs = await loadObservationsForThreshold('predictive.low_confidence_threshold', {
      predictiveLowConfidenceEventsPath: eventsPath,
    });
    expect(obs).toHaveLength(3);
    // useful → -1 (favors increase), not_useful → +1 (favors decrease).
    // Polarity inverted relative to token-budget by design.
    expect(obs.map((o) => o.value)).toEqual([-1, 1, -1]);
  });

  it('returns empty array for predictive.low_confidence_threshold when JSONL is missing (honest no-data baseline)', async () => {
    const obs = await loadObservationsForThreshold('predictive.low_confidence_threshold', {
      predictiveLowConfidenceEventsPath: join(workDir, 'never-written.jsonl'),
    });
    expect(obs).toEqual([]);
  });

  it('returns empty array when suggestionsPath is undefined for suggestions class', async () => {
    const obs = await loadObservationsForThreshold('suggestions.min_occurrences', {});
    expect(obs).toEqual([]);
  });

  it('tolerates missing suggestions file (returns empty)', async () => {
    const obs = await loadObservationsForThreshold('suggestions.min_occurrences', {
      suggestionsPath: join(workDir, 'does-not-exist.json'),
    });
    expect(obs).toEqual([]);
  });

  it('tolerates malformed JSON in suggestions file (returns empty)', async () => {
    writeFileSync(suggestionsPath, '<<<not json>>>', 'utf8');
    const obs = await loadObservationsForThreshold('suggestions.min_occurrences', {
      suggestionsPath,
    });
    expect(obs).toEqual([]);
  });
});
