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

  it('classifies token_budget.* thresholds as unwired token-budget-events source', () => {
    const info = observationSourceFor('token_budget.warn_at_percent');
    expect(info.sourceId).toBe('token-budget-events');
    expect(info.wired).toBe(false);
    expect(info.description).toContain('NOT YET CAPTURED');
  });

  it('classifies token_budget.max_percent under the same unwired source', () => {
    const info = observationSourceFor('token_budget.max_percent');
    expect(info.sourceId).toBe('token-budget-events');
    expect(info.wired).toBe(false);
  });

  it('classifies observation.* thresholds as unwired observation-retention-events source', () => {
    const info = observationSourceFor('observation.retention_days');
    expect(info.sourceId).toBe('observation-retention-events');
    expect(info.wired).toBe(false);
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

  it('returns empty array for token_budget.* thresholds (source not yet captured)', async () => {
    // Suggestions data is present but MUST NOT be consumed by token_budget threshold.
    writeFileSync(
      suggestionsPath,
      JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' }))),
      'utf8',
    );
    const obs = await loadObservationsForThreshold('token_budget.warn_at_percent', {
      suggestionsPath,
    });
    expect(obs).toEqual([]);
  });

  it('returns empty array for observation.* thresholds', async () => {
    const obs = await loadObservationsForThreshold('observation.retention_days', {
      suggestionsPath,
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
