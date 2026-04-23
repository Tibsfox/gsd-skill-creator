/**
 * Unit + integration tests for BEE-RAG context-entropy guard (DRIFT-25).
 *
 * Covers:
 *  1. healthy    — high-entropy context → 'healthy', no alert
 *  2. collapsed  — degenerate context (all attention on 1 segment) → 'collapsed' + alert + telemetry
 *  3. token-probability path — direct entropy on token_probabilities
 *  4. flag-off byte-identity — no-op (entropy=1, healthy, no alert)
 *  5. settings reader unit tests
 *  6. Fixture integration: all labelled examples match expected classification
 *  7. Integration: high-entropy passes; collapsed fires alert
 *
 * Default-off guarantee: importing this module installs no global hooks.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

import {
  checkContextEntropy,
  readContextEntropyFlag,
  normalisedShannonEntropy,
} from '../context-entropy.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '../__fixtures__');

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

interface EntropyExample {
  id: string;
  label: string;
  description: string;
  response_embedding: number[];
  context_embeddings: number[][];
  expected_classification: 'healthy' | 'collapsing' | 'collapsed';
}

interface EntropyFixture {
  examples: EntropyExample[];
}

function loadEntropyFixture(): EntropyFixture {
  const raw = readFileSync(join(fixturesDir, 'context-entropy.json'), 'utf8');
  return JSON.parse(raw) as EntropyFixture;
}

// ---------------------------------------------------------------------------
// Helper tests: normalisedShannonEntropy
// ---------------------------------------------------------------------------

describe('context-entropy: normalisedShannonEntropy helper', () => {
  it('uniform distribution returns entropy 1.0', () => {
    expect(normalisedShannonEntropy([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(1.0, 5);
  });

  it('degenerate distribution [1,0,0,0] returns entropy 0.0', () => {
    expect(normalisedShannonEntropy([1.0, 0.0, 0.0, 0.0])).toBeCloseTo(0.0, 5);
  });

  it('single element returns 1.0 (trivially uniform)', () => {
    expect(normalisedShannonEntropy([42])).toBe(1.0);
  });

  it('all-zero weights returns 1.0 (no information → treat as uniform)', () => {
    expect(normalisedShannonEntropy([0, 0, 0, 0])).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// 1. Healthy test (embedding path)
// ---------------------------------------------------------------------------

describe('context-entropy: healthy', () => {
  it('returns healthy for uniform-attention context (4 orthogonal segments)', () => {
    // response=[0.5,0.5,0.5,0.5] is equidistant from each basis vector
    const result = checkContextEntropy(
      {
        response_embedding: [0.5, 0.5, 0.5, 0.5],
        context_embeddings: [
          [1.0, 0.0, 0.0, 0.0],
          [0.0, 1.0, 0.0, 0.0],
          [0.0, 0.0, 1.0, 0.0],
          [0.0, 0.0, 0.0, 1.0],
        ],
      },
      { flagOverride: true },
    );
    expect(result.classification).toBe('healthy');
    expect(result.alert).toBe(false);
    expect(result.entropy).toBeGreaterThan(0.9);
  });

  it('does not emit telemetry for healthy classification', () => {
    const tmpLog = path.join(os.tmpdir(), `ce-healthy-${Date.now()}.jsonl`);
    checkContextEntropy(
      {
        response_embedding: [0.5, 0.5, 0.5, 0.5],
        context_embeddings: [
          [1.0, 0.0, 0.0, 0.0],
          [0.0, 1.0, 0.0, 0.0],
          [0.0, 0.0, 1.0, 0.0],
          [0.0, 0.0, 0.0, 1.0],
        ],
      },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    expect(existsSync(tmpLog)).toBe(false);
  });

  it('empty context_embeddings returns healthy (cannot collapse with no context)', () => {
    const result = checkContextEntropy(
      { response_embedding: [1.0, 0.0, 0.0, 0.0], context_embeddings: [] },
      { flagOverride: true },
    );
    expect(result.classification).toBe('healthy');
    expect(result.alert).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Collapsed test (embedding path)
// ---------------------------------------------------------------------------

describe('context-entropy: collapsed', () => {
  it('returns collapsed when response aligns with one segment and is opposite to others', () => {
    // response=[1,0,0,0]; seg0 parallel, seg1-3 anti-parallel → weights [1, 0, 0, 0]
    const tmpLog = path.join(os.tmpdir(), `ce-collapsed-${Date.now()}.jsonl`);
    const result = checkContextEntropy(
      {
        response_embedding: [1.0, 0.0, 0.0, 0.0],
        context_embeddings: [
          [1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
        ],
      },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    expect(result.classification).toBe('collapsed');
    expect(result.alert).toBe(true);
    expect(result.entropy).toBeLessThan(result.threshold / 2);
    expect(existsSync(tmpLog)).toBe(true);
    const event = JSON.parse(readFileSync(tmpLog, 'utf8').trim().split('\n')[0]);
    expect(event.type).toBe('drift.retrieval.context_collapse_detected');
    expect(event.classification).toBe('collapsed');
    expect(typeof event.timestamp).toBe('string');
  });

  it('entropy is near zero for fully collapsed attention', () => {
    const result = checkContextEntropy(
      {
        response_embedding: [1.0, 0.0, 0.0, 0.0],
        context_embeddings: [
          [1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
        ],
      },
      { flagOverride: true },
    );
    expect(result.entropy).toBeCloseTo(0, 3);
  });
});

// ---------------------------------------------------------------------------
// 3. Token-probability path
// ---------------------------------------------------------------------------

describe('context-entropy: token-probability path', () => {
  it('healthy: uniform token probabilities → entropy near 1', () => {
    const result = checkContextEntropy(
      { token_probabilities: [0.25, 0.25, 0.25, 0.25] },
      { flagOverride: true },
    );
    expect(result.classification).toBe('healthy');
    expect(result.entropy).toBeCloseTo(1.0, 5);
  });

  it('collapsed: degenerate token probabilities → collapsed + alert + telemetry', () => {
    const tmpLog = path.join(os.tmpdir(), `ce-tokprob-${Date.now()}.jsonl`);
    const result = checkContextEntropy(
      { token_probabilities: [1.0, 0.0, 0.0, 0.0] },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    expect(result.classification).toBe('collapsed');
    expect(result.alert).toBe(true);
    expect(existsSync(tmpLog)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Flag-off byte-identity
// ---------------------------------------------------------------------------

describe('context-entropy: flag-off byte-identity', () => {
  it('returns healthy with entropy=1 when flag is false even for collapsed input', () => {
    const result = checkContextEntropy(
      {
        response_embedding: [1.0, 0.0, 0.0, 0.0],
        context_embeddings: [
          [1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
        ],
      },
      { flagOverride: false },
    );
    expect(result.classification).toBe('healthy');
    expect(result.alert).toBe(false);
    expect(result.entropy).toBe(1);
  });

  it('does not emit telemetry when flag is false', () => {
    const tmpLog = path.join(os.tmpdir(), `ce-flagoff-${Date.now()}.jsonl`);
    checkContextEntropy(
      {
        response_embedding: [1.0, 0.0, 0.0, 0.0],
        context_embeddings: [
          [1.0, 0.0, 0.0, 0.0],
          [-1.0, 0.0, 0.0, 0.0],
        ],
      },
      { flagOverride: false, telemetryPath: tmpLog },
    );
    expect(existsSync(tmpLog)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Settings reader unit tests
// ---------------------------------------------------------------------------

describe('context-entropy: settings reader', () => {
  it('readContextEntropyFlag returns false when settings file is absent', () => {
    expect(readContextEntropyFlag('/nonexistent/settings.json')).toBe(false);
  });

  it('readContextEntropyFlag returns false for empty JSON', () => {
    expect(readContextEntropyFlag('/dev/null')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Fixture integration
// ---------------------------------------------------------------------------

describe('context-entropy: fixture integration', () => {
  const fixture = loadEntropyFixture();

  it('loads fixture with 4 examples', () => {
    expect(fixture.examples.length).toBe(4);
  });

  it('all fixture examples match their expected_classification', () => {
    for (const example of fixture.examples) {
      const result = checkContextEntropy(
        {
          response_embedding: example.response_embedding,
          context_embeddings: example.context_embeddings,
        },
        { flagOverride: true },
      );
      expect(
        result.classification,
        `Example ${example.id}: entropy=${result.entropy}, threshold=${result.threshold}`,
      ).toBe(example.expected_classification);
    }
  });

  it('collapsed examples from fixture emit telemetry', () => {
    const collapsedExamples = fixture.examples.filter(
      (e) => e.expected_classification === 'collapsed',
    );
    expect(collapsedExamples.length).toBeGreaterThanOrEqual(1);
    for (const example of collapsedExamples) {
      const tmpLog = path.join(
        os.tmpdir(),
        `ce-fixture-collapsed-${example.id}-${Date.now()}.jsonl`,
      );
      checkContextEntropy(
        {
          response_embedding: example.response_embedding,
          context_embeddings: example.context_embeddings,
        },
        { flagOverride: true, telemetryPath: tmpLog },
      );
      expect(existsSync(tmpLog)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Integration: high-entropy passes, collapsed fires alert
// ---------------------------------------------------------------------------

describe('context-entropy: integration cross-check', () => {
  it('high-entropy fixture passes without alert', () => {
    const fixture = loadEntropyFixture();
    const healthyExample = fixture.examples.find((e) => e.expected_classification === 'healthy');
    expect(healthyExample).toBeDefined();
    if (!healthyExample) return;

    const tmpLog = path.join(os.tmpdir(), `ce-int-healthy-${Date.now()}.jsonl`);
    const result = checkContextEntropy(
      {
        response_embedding: healthyExample.response_embedding,
        context_embeddings: healthyExample.context_embeddings,
      },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    expect(result.classification).toBe('healthy');
    expect(result.alert).toBe(false);
    expect(existsSync(tmpLog)).toBe(false);
  });

  it('collapsed fixture fires alert and telemetry event', () => {
    const fixture = loadEntropyFixture();
    const collapsedExample = fixture.examples.find(
      (e) => e.expected_classification === 'collapsed',
    );
    expect(collapsedExample).toBeDefined();
    if (!collapsedExample) return;

    const tmpLog = path.join(os.tmpdir(), `ce-int-collapsed-${Date.now()}.jsonl`);
    const result = checkContextEntropy(
      {
        response_embedding: collapsedExample.response_embedding,
        context_embeddings: collapsedExample.context_embeddings,
      },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    expect(result.alert).toBe(true);
    expect(['collapsing', 'collapsed']).toContain(result.classification);
    expect(existsSync(tmpLog)).toBe(true);
    const event = JSON.parse(readFileSync(tmpLog, 'utf8').trim().split('\n')[0]);
    expect(event.type).toBe('drift.retrieval.context_collapse_detected');
  });
});
