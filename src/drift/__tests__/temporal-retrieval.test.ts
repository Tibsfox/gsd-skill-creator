/**
 * Unit + integration tests for temporal retrieval check (DRIFT-23).
 *
 * Covers:
 *  1. fresh      — retrieval_ts ≈ ssot_ts → 'fresh', no alert
 *  2. stale      — retrieval_ts is 2 × maxLag past ssot_ts → 'stale', alert + telemetry
 *  3. critically-stale — lag >> threshold → 'critically-stale', alert + telemetry
 *  4. flag-off byte-identity — no-op when feature flag is false
 *  5. settings reader unit tests
 *  6. Integration: stale fixture triggers temporal alert
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
  checkTemporalRetrieval,
  readTemporalCheckFlag,
} from '../temporal-retrieval.js';

const here = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ONE_HOUR_MS = 3_600_000;
const ONE_DAY_MS = 86_400_000;

function msAgo(ms: number): Date {
  return new Date(Date.now() - ms);
}

// ---------------------------------------------------------------------------
// 1. Fresh test
// ---------------------------------------------------------------------------

describe('temporal-retrieval: fresh', () => {
  it('classifies as fresh when lag is within maxLagMs', () => {
    const ssot = msAgo(ONE_HOUR_MS);          // SSoT updated 1 h ago
    const retrieval = new Date();              // retrieved now
    const result = checkTemporalRetrieval(
      { retrieval_timestamp: retrieval, ssot_timestamp: ssot, max_lag_ms: ONE_DAY_MS },
      { flagOverride: true },
    );
    expect(result.classification).toBe('fresh');
    expect(result.alert).toBe(false);
    expect(result.lag_ms).toBeGreaterThan(0);
    expect(result.lag_ms).toBeLessThan(ONE_DAY_MS);
  });

  it('classifies as fresh when retrieval_timestamp === ssot_timestamp', () => {
    const now = new Date();
    const result = checkTemporalRetrieval(
      { retrieval_timestamp: now, ssot_timestamp: now },
      { flagOverride: true },
    );
    expect(result.classification).toBe('fresh');
    expect(result.alert).toBe(false);
    expect(result.lag_ms).toBe(0);
  });

  it('accepts ISO string timestamps', () => {
    const ssot = new Date(Date.now() - ONE_HOUR_MS);
    const retrieval = new Date();
    const result = checkTemporalRetrieval(
      {
        retrieval_timestamp: retrieval.toISOString(),
        ssot_timestamp: ssot.toISOString(),
      },
      { flagOverride: true },
    );
    expect(result.classification).toBe('fresh');
  });
});

// ---------------------------------------------------------------------------
// 2. Stale test
// ---------------------------------------------------------------------------

describe('temporal-retrieval: stale', () => {
  it('classifies as stale when lag is between 1x and 3x maxLagMs', () => {
    // SSoT updated 2 days ago; maxLag = 1 day → lag ≈ 2 × maxLag → stale
    const ssot = msAgo(2 * ONE_DAY_MS);
    const retrieval = new Date();
    const tmpLog = path.join(os.tmpdir(), `tr-stale-${Date.now()}.jsonl`);
    const result = checkTemporalRetrieval(
      { retrieval_timestamp: retrieval, ssot_timestamp: ssot, max_lag_ms: ONE_DAY_MS },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    expect(result.classification).toBe('stale');
    expect(result.alert).toBe(true);
    expect(existsSync(tmpLog)).toBe(true);
    const lines = readFileSync(tmpLog, 'utf8').trim().split('\n');
    const event = JSON.parse(lines[0]);
    expect(event.type).toBe('drift.retrieval.stale_index_detected');
    expect(event.classification).toBe('stale');
  });

  it('alert is true for stale classification', () => {
    const ssot = msAgo(2 * ONE_DAY_MS);
    const result = checkTemporalRetrieval(
      { retrieval_timestamp: new Date(), ssot_timestamp: ssot, max_lag_ms: ONE_DAY_MS },
      { flagOverride: true },
    );
    expect(result.alert).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Critically-stale test
// ---------------------------------------------------------------------------

describe('temporal-retrieval: critically-stale', () => {
  it('classifies as critically-stale when lag > 3x maxLagMs', () => {
    // SSoT updated 10 days ago; maxLag = 1 day → lag = 10 × maxLag → critically-stale
    const ssot = msAgo(10 * ONE_DAY_MS);
    const retrieval = new Date();
    const tmpLog = path.join(os.tmpdir(), `tr-critical-${Date.now()}.jsonl`);
    const result = checkTemporalRetrieval(
      { retrieval_timestamp: retrieval, ssot_timestamp: ssot, max_lag_ms: ONE_DAY_MS },
      { flagOverride: true, telemetryPath: tmpLog },
    );
    expect(result.classification).toBe('critically-stale');
    expect(result.alert).toBe(true);
    expect(existsSync(tmpLog)).toBe(true);
    const event = JSON.parse(readFileSync(tmpLog, 'utf8').trim().split('\n')[0]);
    expect(event.type).toBe('drift.retrieval.stale_index_detected');
    expect(event.classification).toBe('critically-stale');
  });

  it('lag_ms is correctly signed for critically-stale scenario', () => {
    const ssot = msAgo(10 * ONE_DAY_MS);
    const result = checkTemporalRetrieval(
      { retrieval_timestamp: new Date(), ssot_timestamp: ssot, max_lag_ms: ONE_DAY_MS },
      { flagOverride: true },
    );
    // retrieval is after ssot → lag_ms should be positive
    expect(result.lag_ms).toBeGreaterThan(8 * ONE_DAY_MS);
  });
});

// ---------------------------------------------------------------------------
// 4. Flag-off byte-identity
// ---------------------------------------------------------------------------

describe('temporal-retrieval: flag-off byte-identity', () => {
  it('returns fresh/no-alert when flag is false even for critically stale input', () => {
    const ssot = msAgo(10 * ONE_DAY_MS);
    const result = checkTemporalRetrieval(
      { retrieval_timestamp: new Date(), ssot_timestamp: ssot, max_lag_ms: ONE_DAY_MS },
      { flagOverride: false },
    );
    expect(result.classification).toBe('fresh');
    expect(result.alert).toBe(false);
    expect(result.lag_ms).toBe(0);
  });

  it('does not emit telemetry when flag is false', () => {
    const ssot = msAgo(10 * ONE_DAY_MS);
    const tmpLog = path.join(os.tmpdir(), `tr-flagoff-${Date.now()}.jsonl`);
    checkTemporalRetrieval(
      { retrieval_timestamp: new Date(), ssot_timestamp: ssot },
      { flagOverride: false, telemetryPath: tmpLog },
    );
    expect(existsSync(tmpLog)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Settings reader unit tests
// ---------------------------------------------------------------------------

describe('temporal-retrieval: settings reader', () => {
  it('readTemporalCheckFlag returns false when settings file is absent', () => {
    expect(readTemporalCheckFlag('/nonexistent/settings.json')).toBe(false);
  });

  it('readTemporalCheckFlag returns false for empty JSON', () => {
    expect(readTemporalCheckFlag('/dev/null')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Integration: stale fixture triggers alert
// ---------------------------------------------------------------------------

describe('temporal-retrieval: integration', () => {
  it('stale-index scenario fires alert and telemetry event', () => {
    // Simulate a Grove RAG path where the index was last updated 5 days ago
    // and a retrieval is performed now (maxLag = 24 h default).
    const indexUpdateTime = new Date(Date.now() - 5 * ONE_DAY_MS).toISOString();
    const retrievalTime = new Date().toISOString();
    const tmpLog = path.join(os.tmpdir(), `tr-integration-${Date.now()}.jsonl`);

    const result = checkTemporalRetrieval(
      {
        retrieval_timestamp: retrievalTime,
        ssot_timestamp: indexUpdateTime,
        max_lag_ms: ONE_DAY_MS,
      },
      { flagOverride: true, telemetryPath: tmpLog },
    );

    expect(result.alert).toBe(true);
    expect(['stale', 'critically-stale']).toContain(result.classification);
    expect(existsSync(tmpLog)).toBe(true);

    const lines = readFileSync(tmpLog, 'utf8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const event = JSON.parse(lines[0]);
    expect(event.type).toBe('drift.retrieval.stale_index_detected');
    expect(typeof event.timestamp).toBe('string');
  });
});
