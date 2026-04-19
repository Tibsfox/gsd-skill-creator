/**
 * MD-4 — Quintessence Mapper tests.
 *
 * Gates: CF-MD4-02 (monotone in inputs), CF-MD4-01 (partial — base temp
 * monotone response before bounding).
 */

import { describe, it, expect } from 'vitest';
import {
  mapQuintessenceToBaseTemp,
  mapSnapshotToBaseTemp,
  extractQuintessenceSignal,
  type QuintessenceSignal,
} from '../quintessence-mapper.js';
import { DEFAULT_SETTINGS } from '../settings.js';
import type { QuintessenceSnapshot } from '../../types/symbiosis.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSignal(stability: number, fatefulEncounters: number): QuintessenceSignal {
  return { stability, fatefulEncounters };
}

function makeSnapshot(stabilityVsNovelty: number, fatefulEncounters: number): QuintessenceSnapshot {
  return {
    ts: 1000,
    selfVsNonSelf: 0.5,
    essentialTensions: 0.2,
    growthAndEnergyFlow: 1200,
    stabilityVsNovelty,
    fatefulEncounters,
  };
}

// ─── extractQuintessenceSignal ────────────────────────────────────────────────

describe('extractQuintessenceSignal', () => {
  it('extracts stability and fatefulEncounters from snapshot', () => {
    const snapshot = makeSnapshot(0.7, 3);
    const signal = extractQuintessenceSignal(snapshot);
    expect(signal.stability).toBeCloseTo(0.7);
    expect(signal.fatefulEncounters).toBe(3);
  });

  it('clamps stability to [0, 1] on over-range M8 values', () => {
    const snapshot = makeSnapshot(1.5, 0);
    const signal = extractQuintessenceSignal(snapshot);
    expect(signal.stability).toBe(1.0);
  });

  it('clamps stability to 0 for negative values', () => {
    const snapshot = makeSnapshot(-0.1, 0);
    const signal = extractQuintessenceSignal(snapshot);
    expect(signal.stability).toBe(0);
  });

  it('floors fatefulEncounters at 0 for negative raw', () => {
    const snapshot = makeSnapshot(0.5, -2);
    const signal = extractQuintessenceSignal(snapshot);
    expect(signal.fatefulEncounters).toBe(0);
  });
});

// ─── mapQuintessenceToBaseTemp — correctness ─────────────────────────────────

describe('mapQuintessenceToBaseTemp — correctness', () => {
  it('at stability=0.5 fateful=0 returns T_base * exp(lambda1 * 1)', () => {
    // stability=0.5 → novelty=0.5, stabSafe=0.5
    // quintDrive = exp(0.8 * (0.5/0.5) - 0.5 * 0) = exp(0.8)
    const signal = makeSignal(0.5, 0);
    const baseTemp = mapQuintessenceToBaseTemp(signal, DEFAULT_SETTINGS);
    const expected = DEFAULT_SETTINGS.T_base * Math.exp(0.8);
    expect(baseTemp).toBeCloseTo(expected, 6);
  });

  it('at stability=1.0 (maximally stable) produces near-minimal base', () => {
    // novelty=0, stabSafe=1.0 → quintDrive = exp(0.8 * 0 - 0) = 1.0
    // baseTemp = T_base * 1.0 = 0.5
    const signal = makeSignal(1.0, 0);
    const baseTemp = mapQuintessenceToBaseTemp(signal, DEFAULT_SETTINGS);
    expect(baseTemp).toBeCloseTo(DEFAULT_SETTINGS.T_base, 6);
  });

  it('at stability=0.0 (maximally novel) produces large base', () => {
    // novelty=1, stabSafe=0.01 → quintDrive = exp(0.8 * (1/0.01)) = exp(80) — huge
    // baseTemp >> T_max, will be clamped downstream
    const signal = makeSignal(0.0, 0);
    const baseTemp = mapQuintessenceToBaseTemp(signal, DEFAULT_SETTINGS);
    expect(baseTemp).toBeGreaterThan(DEFAULT_SETTINGS.T_max);
  });

  it('high fateful encounters reduces baseTemp relative to zero-fateful', () => {
    const signalLow = makeSignal(0.5, 0);
    const signalHigh = makeSignal(0.5, 100);
    const tempLow = mapQuintessenceToBaseTemp(signalLow, DEFAULT_SETTINGS);
    const tempHigh = mapQuintessenceToBaseTemp(signalHigh, DEFAULT_SETTINGS);
    // fateful norm(100) = 100/101 ≈ 0.99 → quintDrive substantially lower
    expect(tempHigh).toBeLessThan(tempLow);
  });
});

// ─── CF-MD4-02: monotone in Novelty (stability decreasing) ───────────────────

describe('CF-MD4-02 — monotone in novelty/stability', () => {
  it('baseTemp is strictly decreasing as stability increases (novelty decreases)', () => {
    const stabilities = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const temps = stabilities.map((s) =>
      mapQuintessenceToBaseTemp(makeSignal(s, 0), DEFAULT_SETTINGS),
    );
    for (let i = 0; i < temps.length - 1; i++) {
      expect(temps[i]).toBeGreaterThan(temps[i + 1]);
    }
  });

  it('baseTemp is strictly decreasing as fatefulEncounters increases', () => {
    const fatefulCounts = [0, 1, 2, 5, 10, 20, 50];
    const temps = fatefulCounts.map((f) =>
      mapQuintessenceToBaseTemp(makeSignal(0.5, f), DEFAULT_SETTINGS),
    );
    for (let i = 0; i < temps.length - 1; i++) {
      expect(temps[i]).toBeGreaterThan(temps[i + 1]);
    }
  });

  it('varying lambda1 scales the novelty effect proportionally', () => {
    const signal = makeSignal(0.5, 0);
    const tempLow = mapQuintessenceToBaseTemp(signal, { ...DEFAULT_SETTINGS, lambda1: 0.2 });
    const tempHigh = mapQuintessenceToBaseTemp(signal, { ...DEFAULT_SETTINGS, lambda1: 1.5 });
    expect(tempHigh).toBeGreaterThan(tempLow);
  });

  it('varying lambda2 scales the fateful-encounters effect proportionally', () => {
    const signal = makeSignal(0.5, 5);
    const tempLow = mapQuintessenceToBaseTemp(signal, { ...DEFAULT_SETTINGS, lambda2: 0.1 });
    const tempHigh = mapQuintessenceToBaseTemp(signal, { ...DEFAULT_SETTINGS, lambda2: 0.1 });
    // Same params → same result (sanity)
    expect(tempLow).toBeCloseTo(tempHigh, 10);
    // Higher lambda2 dampens more
    const tempHigherLambda2 = mapQuintessenceToBaseTemp(signal, { ...DEFAULT_SETTINGS, lambda2: 1.5 });
    expect(tempHigherLambda2).toBeLessThan(tempLow);
  });
});

// ─── mapSnapshotToBaseTemp convenience wrapper ────────────────────────────────

describe('mapSnapshotToBaseTemp', () => {
  it('produces same result as manual signal extraction + mapQuintessenceToBaseTemp', () => {
    const snapshot = makeSnapshot(0.6, 2);
    const direct = mapQuintessenceToBaseTemp(extractQuintessenceSignal(snapshot), DEFAULT_SETTINGS);
    const convenience = mapSnapshotToBaseTemp(snapshot, DEFAULT_SETTINGS);
    expect(convenience).toBeCloseTo(direct, 12);
  });
});

// ─── stabSafe divide-by-zero guard ───────────────────────────────────────────

describe('stabSafe clamp', () => {
  it('does not produce Infinity or NaN at stability=0', () => {
    const signal = makeSignal(0, 0);
    const baseTemp = mapQuintessenceToBaseTemp(signal, DEFAULT_SETTINGS);
    expect(Number.isFinite(baseTemp)).toBe(true);
    expect(Number.isNaN(baseTemp)).toBe(false);
  });

  it('produces a finite result when stability is exactly 0.01 (stabSafe boundary)', () => {
    const signal = makeSignal(0.01, 0);
    const baseTemp = mapQuintessenceToBaseTemp(signal, DEFAULT_SETTINGS);
    expect(Number.isFinite(baseTemp)).toBe(true);
  });
});
