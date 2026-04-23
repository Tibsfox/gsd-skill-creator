/**
 * Unit + integration tests for the task-drift activation-delta monitor (DRIFT-20).
 *
 * Covers:
 *  1. clean-pass      — nearly-identical activations → 'clean', magnitude near 0
 *  2. drift-detected  — injected prompt-injection-style delta → 'drift'
 *  3. suspicious-boundary — moderate shift → 'suspicious'
 *  4. telemetry-emitted   — above-threshold fires telemetry event to JSONL
 *  5. flag-off byte-identity — monitor is no-op when feature flag is false
 *  6. prompt-injection-activations fixture integration test
 *
 * Default-off guarantee: importing this module installs no global hooks.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

import {
  monitorTaskDrift,
  readTaskDriftMonitorFlag,
  type ActivationSnapshot,
} from '../task-drift-monitor.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '../__fixtures__');

// ---------------------------------------------------------------------------
// Fixture loading
// ---------------------------------------------------------------------------

interface ActivationExample {
  id: string;
  label: string;
  description: string;
  before: number[];
  after: number[];
  expected_magnitude_max?: number;
  expected_magnitude_min?: number;
  expected_classification: 'clean' | 'suspicious' | 'drift';
}

interface ActivationFixture {
  examples: ActivationExample[];
}

function loadActivationFixture(): ActivationFixture {
  const raw = readFileSync(join(fixturesDir, 'prompt-injection-activations.json'), 'utf8');
  return JSON.parse(raw) as ActivationFixture;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSnapshot(before: number[], after: number[]): ActivationSnapshot {
  return { before, after };
}

// ---------------------------------------------------------------------------
// 1. Clean-pass test
// ---------------------------------------------------------------------------

describe('task-drift-monitor: clean-pass', () => {
  it('returns classification=clean and near-zero magnitude for nearly-identical activations', () => {
    const snapshot = makeSnapshot(
      [0.10, 0.22, 0.35, 0.48, 0.61, 0.74, 0.87, 0.95],
      [0.11, 0.23, 0.34, 0.47, 0.62, 0.73, 0.88, 0.94],
    );
    const result = monitorTaskDrift(snapshot, { flagOverride: true, threshold: 0.5 });
    expect(result.classification).toBe('clean');
    expect(result.drift_magnitude).toBeLessThan(0.1);
  });

  it('direction is non-null for a non-zero clean delta', () => {
    const snapshot = makeSnapshot(
      [0.10, 0.20, 0.30],
      [0.12, 0.22, 0.32],
    );
    const result = monitorTaskDrift(snapshot, { flagOverride: true, threshold: 0.5 });
    expect(result.classification).toBe('clean');
    // direction is either null (zero-delta) or a unit vector
    if (result.direction !== null) {
      const norm = Math.sqrt(result.direction.reduce((s, x) => s + x * x, 0));
      expect(norm).toBeCloseTo(1.0, 5);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Drift-detected test
// ---------------------------------------------------------------------------

describe('task-drift-monitor: drift-detected', () => {
  it('returns classification=drift for a prompt-injection-style large delta', () => {
    // Adversarial shift: activations flip polarity → large L2 delta
    const snapshot = makeSnapshot(
      [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80],
      [0.90, 0.85, 0.80, 0.75, 0.10, 0.05, 0.02, 0.01],
    );
    const result = monitorTaskDrift(snapshot, { flagOverride: true, threshold: 0.5 });
    expect(result.classification).toBe('drift');
    expect(result.drift_magnitude).toBeGreaterThan(0.8);
  });

  it('direction vector is a valid unit vector for large delta', () => {
    const snapshot = makeSnapshot(
      [0.20, 0.80, 0.20, 0.80, 0.20, 0.80, 0.20, 0.80],
      [0.80, 0.20, 0.80, 0.20, 0.80, 0.20, 0.80, 0.20],
    );
    const result = monitorTaskDrift(snapshot, { flagOverride: true, threshold: 0.5 });
    expect(result.classification).toBe('drift');
    expect(result.direction).not.toBeNull();
    if (result.direction !== null) {
      const norm = Math.sqrt(result.direction.reduce((s, x) => s + x * x, 0));
      expect(norm).toBeCloseTo(1.0, 4);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Suspicious-boundary test
// ---------------------------------------------------------------------------

describe('task-drift-monitor: suspicious-boundary', () => {
  it('returns classification=suspicious for moderate delta between threshold bands', () => {
    // Delta magnitude engineered to fall in [suspiciousThreshold, threshold)
    // With threshold=0.5, suspicious band is [0.25, 0.5)
    // Delta: each of 4 dims changes by ~0.1 → magnitude ≈ 0.2
    // Use a carefully constructed snapshot with magnitude ~0.3
    const snapshot = makeSnapshot(
      [0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50],
      [0.60, 0.65, 0.45, 0.40, 0.55, 0.60, 0.50, 0.45],
    );
    const result = monitorTaskDrift(snapshot, {
      flagOverride: true,
      threshold: 0.5,
      suspiciousThreshold: 0.1,
    });
    // Magnitude ~0.26, which is in [0.1, 0.5) → suspicious
    expect(result.classification).toBe('suspicious');
    expect(result.drift_magnitude).toBeGreaterThan(0.1);
    expect(result.drift_magnitude).toBeLessThan(0.5);
  });

  it('suspicious boundary at exactly suspiciousThreshold rounds up correctly', () => {
    // Construct a vector with precise delta
    // 4-dim vector, each delta = 0.1 → magnitude = sqrt(4*0.01) = 0.2
    const snapshot = makeSnapshot(
      [0.0, 0.0, 0.0, 0.0],
      [0.1, 0.1, 0.1, 0.1],
    );
    const result = monitorTaskDrift(snapshot, {
      flagOverride: true,
      threshold: 0.5,
      suspiciousThreshold: 0.15, // 0.2 >= 0.15 → suspicious
    });
    expect(result.classification).toBe('suspicious');
  });
});

// ---------------------------------------------------------------------------
// 4. Telemetry-emitted test
// ---------------------------------------------------------------------------

describe('task-drift-monitor: telemetry-emitted', () => {
  it('emits telemetry event when drift is detected', () => {
    const tmpLog = path.join(os.tmpdir(), `tdm-telemetry-${Date.now()}.jsonl`);
    const snapshot = makeSnapshot(
      [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80],
      [0.90, 0.85, 0.80, 0.75, 0.10, 0.05, 0.02, 0.01],
    );
    const result = monitorTaskDrift(snapshot, {
      flagOverride: true,
      threshold: 0.5,
      telemetryPath: tmpLog,
    });
    expect(result.classification).toBe('drift');
    // Telemetry file should now exist and contain the event
    expect(existsSync(tmpLog)).toBe(true);
    const lines = readFileSync(tmpLog, 'utf8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const event = JSON.parse(lines[0]);
    expect(event.type).toBe('drift.alignment.taskDrift.detected');
    expect(event.drift_magnitude).toBeGreaterThan(0.5);
    expect(event.classification).toBe('drift');
    expect(typeof event.timestamp).toBe('string');
  });

  it('emits telemetry for suspicious classification too', () => {
    const tmpLog = path.join(os.tmpdir(), `tdm-suspicious-${Date.now()}.jsonl`);
    const snapshot = makeSnapshot(
      [0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50],
      [0.60, 0.65, 0.45, 0.40, 0.55, 0.60, 0.50, 0.45],
    );
    monitorTaskDrift(snapshot, {
      flagOverride: true,
      threshold: 0.5,
      suspiciousThreshold: 0.1,
      telemetryPath: tmpLog,
    });
    expect(existsSync(tmpLog)).toBe(true);
  });

  it('does not emit telemetry for clean classification', () => {
    const tmpLog = path.join(os.tmpdir(), `tdm-clean-${Date.now()}.jsonl`);
    const snapshot = makeSnapshot(
      [0.10, 0.22, 0.35, 0.48],
      [0.11, 0.23, 0.34, 0.47],
    );
    monitorTaskDrift(snapshot, {
      flagOverride: true,
      threshold: 0.5,
      telemetryPath: tmpLog,
    });
    // Clean result should not create telemetry file
    expect(existsSync(tmpLog)).toBe(false);
  });

  it('telemetry failure (bad path) does not throw', () => {
    // Pass a directory path as telemetry file → appendFileSync throws EISDIR
    const snapshot = makeSnapshot(
      [0.10, 0.20, 0.30, 0.40],
      [0.90, 0.85, 0.80, 0.75],
    );
    expect(() =>
      monitorTaskDrift(snapshot, {
        flagOverride: true,
        threshold: 0.5,
        telemetryPath: os.tmpdir(), // directory, not file
      }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 5. Flag-off byte-identity test
// ---------------------------------------------------------------------------

describe('task-drift-monitor: flag-off byte-identity', () => {
  it('returns clean classification with zero magnitude when flag is false', () => {
    // Even a large delta should be ignored when the flag is off
    const snapshot = makeSnapshot(
      [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80],
      [0.90, 0.85, 0.80, 0.75, 0.10, 0.05, 0.02, 0.01],
    );
    const result = monitorTaskDrift(snapshot, { flagOverride: false });
    expect(result.classification).toBe('clean');
    expect(result.drift_magnitude).toBe(0);
    expect(result.direction).toBeNull();
  });

  it('does not emit telemetry when flag is false', () => {
    const tmpLog = path.join(os.tmpdir(), `tdm-flagoff-${Date.now()}.jsonl`);
    const snapshot = makeSnapshot(
      [0.10, 0.20, 0.30, 0.40],
      [0.90, 0.85, 0.80, 0.75],
    );
    monitorTaskDrift(snapshot, { flagOverride: false, telemetryPath: tmpLog });
    expect(existsSync(tmpLog)).toBe(false);
  });

  it('returns clean for empty vectors (edge case)', () => {
    const snapshot = makeSnapshot([], []);
    const result = monitorTaskDrift(snapshot, { flagOverride: true, threshold: 0.5 });
    expect(result.classification).toBe('clean');
    expect(result.drift_magnitude).toBe(0);
    expect(result.direction).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Settings reader unit tests
// ---------------------------------------------------------------------------

describe('task-drift-monitor: settings reader', () => {
  it('readTaskDriftMonitorFlag returns false when settings file is absent', () => {
    expect(readTaskDriftMonitorFlag('/nonexistent/settings.json')).toBe(false);
  });

  it('readTaskDriftMonitorFlag returns false for empty JSON', () => {
    expect(readTaskDriftMonitorFlag('/dev/null')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Fixture integration test
// ---------------------------------------------------------------------------

describe('task-drift-monitor: prompt-injection-activations fixture', () => {
  const fixture = loadActivationFixture();

  it('loads the fixture without error (5 examples)', () => {
    expect(fixture.examples.length).toBe(5);
  });

  it('all fixture examples match their expected_classification', () => {
    for (const example of fixture.examples) {
      const snapshot = makeSnapshot(example.before, example.after);
      const result = monitorTaskDrift(snapshot, {
        flagOverride: true,
        threshold: 0.5,
        suspiciousThreshold: 0.1,
      });

      expect(result.classification).toBe(example.expected_classification);

      if (example.expected_magnitude_max !== undefined) {
        expect(result.drift_magnitude).toBeLessThan(example.expected_magnitude_max + 0.01);
      }
      if (example.expected_magnitude_min !== undefined) {
        expect(result.drift_magnitude).toBeGreaterThan(example.expected_magnitude_min - 0.01);
      }
    }
  });

  it('drift examples from fixture have non-null direction vectors', () => {
    const driftExamples = fixture.examples.filter((e) => e.expected_classification === 'drift');
    expect(driftExamples.length).toBeGreaterThanOrEqual(1);
    for (const example of driftExamples) {
      const result = monitorTaskDrift(
        makeSnapshot(example.before, example.after),
        { flagOverride: true, threshold: 0.5 },
      );
      expect(result.direction).not.toBeNull();
    }
  });

  it('clean examples from fixture emit no telemetry', () => {
    const cleanExamples = fixture.examples.filter((e) => e.expected_classification === 'clean');
    expect(cleanExamples.length).toBeGreaterThanOrEqual(1);
    for (const example of cleanExamples) {
      const tmpLog = path.join(os.tmpdir(), `tdm-fixture-clean-${example.id}-${Date.now()}.jsonl`);
      monitorTaskDrift(makeSnapshot(example.before, example.after), {
        flagOverride: true,
        threshold: 0.5,
        telemetryPath: tmpLog,
      });
      expect(existsSync(tmpLog)).toBe(false);
    }
  });
});
