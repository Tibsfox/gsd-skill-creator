/**
 * Tests for src/representation-audit/api.ts
 *
 * Coverage:
 *   - getLatestAuditResult returns null before any audit run
 *   - runAndCacheAudit stores and returns result
 *   - clearAuditCache resets to null
 *   - isCritical / isHealthy helpers
 *   - Successive calls overwrite the cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLatestAuditResult,
  clearAuditCache,
  runAndCacheAudit,
  isCritical,
  isHealthy,
} from '../api.js';

beforeEach(() => {
  clearAuditCache();
});

// ─── Initial state ────────────────────────────────────────────────────────────

describe('api — initial state', () => {
  it('getLatestAuditResult returns null before any run', () => {
    expect(getLatestAuditResult()).toBeNull();
  });

  it('isCritical returns false before any run', () => {
    expect(isCritical()).toBe(false);
  });

  it('isHealthy returns false before any run', () => {
    expect(isHealthy()).toBe(false);
  });
});

// ─── runAndCacheAudit ─────────────────────────────────────────────────────────

describe('api — runAndCacheAudit', () => {
  it('returns the result and stores it in cache', () => {
    const result = runAndCacheAudit({ matrix: null, communities: null });
    expect(result).not.toBeNull();
    expect(getLatestAuditResult()).toBe(result); // same object reference
  });

  it('result has DISABLED status when not enabled', () => {
    const result = runAndCacheAudit({ matrix: null, communities: null });
    expect(result.status).toBe('DISABLED');
  });

  it('result has OK status for enabled run with healthy matrix', () => {
    const healthyMatrix = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    const result = runAndCacheAudit(
      { matrix: healthyMatrix, communities: null },
      { enabled: true },
    );
    expect(result.status).toBe('OK');
  });

  it('result has CRITICAL status for enabled run with collapsed matrix', () => {
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    const result = runAndCacheAudit(
      { matrix: collapsedMatrix, communities: null },
      { enabled: true },
    );
    expect(result.status).toBe('CRITICAL');
  });
});

// ─── clearAuditCache ─────────────────────────────────────────────────────────

describe('api — clearAuditCache', () => {
  it('clears the cached result', () => {
    runAndCacheAudit({ matrix: null, communities: null });
    expect(getLatestAuditResult()).not.toBeNull();

    clearAuditCache();
    expect(getLatestAuditResult()).toBeNull();
  });

  it('isCritical is false after clear', () => {
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    runAndCacheAudit({ matrix: collapsedMatrix, communities: null }, { enabled: true });
    clearAuditCache();
    expect(isCritical()).toBe(false);
  });
});

// ─── isCritical / isHealthy ───────────────────────────────────────────────────

describe('api — isCritical', () => {
  it('returns true after CRITICAL result', () => {
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    runAndCacheAudit({ matrix: collapsedMatrix, communities: null }, { enabled: true });
    expect(isCritical()).toBe(true);
  });

  it('returns false after OK result', () => {
    const healthyMatrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    runAndCacheAudit({ matrix: healthyMatrix, communities: null }, { enabled: true });
    expect(isCritical()).toBe(false);
  });

  it('returns false after DISABLED result', () => {
    runAndCacheAudit({ matrix: null, communities: null }); // not enabled
    expect(isCritical()).toBe(false);
  });
});

describe('api — isHealthy', () => {
  it('returns true after OK result', () => {
    const healthyMatrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    runAndCacheAudit({ matrix: healthyMatrix, communities: null }, { enabled: true });
    expect(isHealthy()).toBe(true);
  });

  it('returns false after CRITICAL result', () => {
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    runAndCacheAudit({ matrix: collapsedMatrix, communities: null }, { enabled: true });
    expect(isHealthy()).toBe(false);
  });

  it('returns false after DISABLED result', () => {
    runAndCacheAudit({ matrix: null, communities: null });
    expect(isHealthy()).toBe(false);
  });
});

// ─── Cache overwrite ──────────────────────────────────────────────────────────

describe('api — successive calls overwrite cache', () => {
  it('second call overwrites first', () => {
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    runAndCacheAudit({ matrix: collapsedMatrix, communities: null }, { enabled: true });
    expect(isCritical()).toBe(true);

    const healthyMatrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    runAndCacheAudit({ matrix: healthyMatrix, communities: null }, { enabled: true });
    expect(isCritical()).toBe(false);
    expect(isHealthy()).toBe(true);
  });
});
