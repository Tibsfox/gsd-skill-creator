/**
 * Unit + integration tests for grounding faithfulness assertion (DRIFT-24).
 *
 * Covers:
 *  1. grounded   — response close to context → 'grounded', no telemetry
 *  2. lazy       — response close to query, far from context → 'lazy' + telemetry
 *  3. drifted    — response far from both → 'drifted'
 *  4. flag-off byte-identity — no-op (all scores 1, classification 'grounded')
 *  5. settings reader unit tests
 *  6. Fixture integration: all labelled examples match expected classification
 *  7. Integration: off-context response triggers grounding alert
 *
 * Embedding design: uses standard-basis (unit) vectors so cosine similarity
 * is analytically exact — orthogonal vectors give cos=0, parallel give cos=1,
 * anti-parallel give cos=-1.
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
  checkGroundingFaithfulness,
  readGroundingFaithfulnessFlag,
  cosineSimilarity,
} from '../grounding-faithfulness.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '../__fixtures__');

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

interface GroundingExample {
  id: string;
  label: string;
  description: string;
  response_embedding: number[];
  query_embedding: number[];
  context_embedding: number[];
  expected_classification: 'grounded' | 'lazy' | 'drifted';
}

interface GroundingFixture {
  examples: GroundingExample[];
}

function loadGroundingFixture(): GroundingFixture {
  const raw = readFileSync(join(fixturesDir, 'grounding-embeddings.json'), 'utf8');
  return JSON.parse(raw) as GroundingFixture;
}

// ---------------------------------------------------------------------------
// 1. Grounded test
// ---------------------------------------------------------------------------

describe('grounding-faithfulness: grounded', () => {
  it('returns grounded when response is parallel to context', () => {
    // response ≈ context = [1,0,0,0]; query is orthogonal [0,1,0,0].
    // cos(response, context) = 1.0 > groundingThreshold → grounded.
    const response = [1.0, 0.0, 0.0, 0.0];
    const query    = [0.0, 1.0, 0.0, 0.0];
    const context  = [1.0, 0.0, 0.0, 0.0];

    const result = checkGroundingFaithfulness(
      { response_embedding: response, query_embedding: query, context_embedding: context },
      { flagOverride: true },
    );
    expect(result.classification).toBe('grounded');
    expect(result.sgi_score).toBeGreaterThan(0.8);
  });

  it('sgi_score equals angular_response_to_context', () => {
    const response = [1.0, 0.01, 0.0, 0.0];
    const query    = [0.0, 0.0, 1.0, 0.0];
    const context  = [1.0, 0.0, 0.0, 0.0];

    const result = checkGroundingFaithfulness(
      { response_embedding: response, query_embedding: query, context_embedding: context },
      { flagOverride: true },
    );
    const expected = cosineSimilarity(response, context);
    expect(result.sgi_score).toBeCloseTo(expected, 10);
    expect(result.angular_response_to_context).toBeCloseTo(expected, 10);
  });
});

// ---------------------------------------------------------------------------
// 2. Lazy test
// ---------------------------------------------------------------------------

describe('grounding-faithfulness: lazy', () => {
  it('returns lazy when response is parallel to query but orthogonal to context', () => {
    // response=[1,0,0,0] ≈ query=[1,0,0,0]; context=[0,1,0,0] orthogonal.
    // cos(response, context) = 0 < groundingThreshold(0.8)
    // cos(response, query)   = 1 > lazyThreshold(0.85) → lazy.
    const response = [1.0, 0.0, 0.0, 0.0];
    const query    = [1.0, 0.0, 0.0, 0.0];
    const context  = [0.0, 1.0, 0.0, 0.0];

    const tmpLog = path.join(os.tmpdir(), `gf-lazy-${Date.now()}.jsonl`);
    const result = checkGroundingFaithfulness(
      { response_embedding: response, query_embedding: query, context_embedding: context },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    expect(result.classification).toBe('lazy');
    expect(existsSync(tmpLog)).toBe(true);
    const event = JSON.parse(readFileSync(tmpLog, 'utf8').trim().split('\n')[0]);
    expect(event.type).toBe('drift.retrieval.lazy_grounding_detected');
    expect(event.classification).toBe('lazy');
  });

  it('lazy result has low angular_response_to_context and high angular_response_to_query', () => {
    const response = [1.0, 0.0, 0.0, 0.0];
    const query    = [1.0, 0.0, 0.0, 0.0];
    const context  = [0.0, 1.0, 0.0, 0.0];

    const result = checkGroundingFaithfulness(
      { response_embedding: response, query_embedding: query, context_embedding: context },
      { flagOverride: true },
    );
    // cos([1,0,0,0], [0,1,0,0]) = 0 → below groundingThreshold
    expect(result.angular_response_to_context).toBeCloseTo(0, 5);
    // cos([1,0,0,0], [1,0,0,0]) = 1 → above lazyThreshold
    expect(result.angular_response_to_query).toBeCloseTo(1, 5);
  });
});

// ---------------------------------------------------------------------------
// 3. Drifted test
// ---------------------------------------------------------------------------

describe('grounding-faithfulness: drifted', () => {
  it('returns drifted when response is orthogonal to both query and context', () => {
    // response=[0,0,1,0], query=[1,0,0,0], context=[0,1,0,0] — all orthogonal.
    // cos(response, context) = 0 < groundingThreshold(0.8)
    // cos(response, query)   = 0 < lazyThreshold(0.85) → drifted.
    const response = [0.0, 0.0, 1.0, 0.0];
    const query    = [1.0, 0.0, 0.0, 0.0];
    const context  = [0.0, 1.0, 0.0, 0.0];

    const result = checkGroundingFaithfulness(
      { response_embedding: response, query_embedding: query, context_embedding: context },
      { flagOverride: true },
    );
    expect(result.classification).toBe('drifted');
    expect(result.sgi_score).toBeCloseTo(0, 5);
    expect(result.angular_response_to_query).toBeCloseTo(0, 5);
  });

  it('drifted result does not emit telemetry', () => {
    const response = [0.0, 0.0, 1.0, 0.0];
    const query    = [1.0, 0.0, 0.0, 0.0];
    const context  = [0.0, 1.0, 0.0, 0.0];
    const tmpLog = path.join(os.tmpdir(), `gf-drifted-${Date.now()}.jsonl`);

    checkGroundingFaithfulness(
      { response_embedding: response, query_embedding: query, context_embedding: context },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    // Only 'lazy' emits telemetry, not 'drifted'
    expect(existsSync(tmpLog)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Flag-off byte-identity
// ---------------------------------------------------------------------------

describe('grounding-faithfulness: flag-off byte-identity', () => {
  it('returns stub grounded result with all scores at 1 when flag is false', () => {
    // Even a completely off-context response should pass when flag is false.
    const response = [0.0, 0.0, 1.0, 0.0];
    const query    = [1.0, 0.0, 0.0, 0.0];
    const context  = [0.0, 1.0, 0.0, 0.0];

    const result = checkGroundingFaithfulness(
      { response_embedding: response, query_embedding: query, context_embedding: context },
      { flagOverride: false },
    );
    expect(result.classification).toBe('grounded');
    expect(result.sgi_score).toBe(1);
    expect(result.angular_response_to_context).toBe(1);
    expect(result.angular_response_to_query).toBe(1);
  });

  it('does not emit telemetry when flag is false', () => {
    const tmpLog = path.join(os.tmpdir(), `gf-flagoff-${Date.now()}.jsonl`);
    // lazy-path vectors — would trigger telemetry if flag were true
    const response = [1.0, 0.0, 0.0, 0.0];
    const query    = [1.0, 0.0, 0.0, 0.0];
    const context  = [0.0, 1.0, 0.0, 0.0];

    checkGroundingFaithfulness(
      { response_embedding: response, query_embedding: query, context_embedding: context },
      { flagOverride: false, telemetryPath: tmpLog },
    );
    expect(existsSync(tmpLog)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Settings reader unit tests
// ---------------------------------------------------------------------------

describe('grounding-faithfulness: settings reader', () => {
  it('readGroundingFaithfulnessFlag returns false when settings file is absent', () => {
    expect(readGroundingFaithfulnessFlag('/nonexistent/settings.json')).toBe(false);
  });

  it('readGroundingFaithfulnessFlag returns false for empty JSON', () => {
    expect(readGroundingFaithfulnessFlag('/dev/null')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Fixture integration
// ---------------------------------------------------------------------------

describe('grounding-faithfulness: fixture integration', () => {
  const fixture = loadGroundingFixture();

  it('loads fixture with 5 examples', () => {
    expect(fixture.examples.length).toBe(5);
  });

  it('all fixture examples match their expected_classification', () => {
    for (const example of fixture.examples) {
      const tmpLog = path.join(os.tmpdir(), `gf-fixture-${example.id}-${Date.now()}.jsonl`);
      const result = checkGroundingFaithfulness(
        {
          response_embedding: example.response_embedding,
          query_embedding: example.query_embedding,
          context_embedding: example.context_embedding,
        },
        { flagOverride: true, telemetryPath: tmpLog },
      );
      expect(result.classification).toBe(example.expected_classification);
    }
  });

  it('lazy examples from fixture emit telemetry', () => {
    const lazyExamples = fixture.examples.filter((e) => e.expected_classification === 'lazy');
    expect(lazyExamples.length).toBeGreaterThanOrEqual(1);
    for (const example of lazyExamples) {
      const tmpLog = path.join(os.tmpdir(), `gf-lazy-fixture-${example.id}-${Date.now()}.jsonl`);
      checkGroundingFaithfulness(
        {
          response_embedding: example.response_embedding,
          query_embedding: example.query_embedding,
          context_embedding: example.context_embedding,
        },
        { flagOverride: true, telemetryPath: tmpLog },
      );
      expect(existsSync(tmpLog)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Integration: off-context response triggers grounding alert
// ---------------------------------------------------------------------------

describe('grounding-faithfulness: integration cross-check', () => {
  it('off-context response triggers lazy classification and telemetry', () => {
    // Simulate a RAG response that ignored the retrieved context
    // and instead paraphrased the original query.
    // response ≈ query = [1,0,0,0]; context = [0,1,0,0] (orthogonal — different topic).
    const retrievedContext  = [0.0, 1.0, 0.0, 0.0];
    const userQuery         = [1.0, 0.0, 0.0, 0.0];
    const generatedResponse = [1.0, 0.0, 0.0, 0.0]; // parrots query, ignores context

    const tmpLog = path.join(os.tmpdir(), `gf-offcontext-${Date.now()}.jsonl`);
    const result = checkGroundingFaithfulness(
      {
        response_embedding: generatedResponse,
        query_embedding: userQuery,
        context_embedding: retrievedContext,
      },
      { flagOverride: true, telemetryPath: tmpLog },
    );

    expect(result.classification).toBe('lazy');
    expect(existsSync(tmpLog)).toBe(true);
    const event = JSON.parse(readFileSync(tmpLog, 'utf8').trim().split('\n')[0]);
    expect(event.type).toBe('drift.retrieval.lazy_grounding_detected');
  });
});
