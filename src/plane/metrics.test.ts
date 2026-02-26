/**
 * Tests for dashboard metrics computation and snapshot persistence.
 *
 * Uses duck-typed mocks for PositionStore and ChordStore to avoid
 * coupling to the concrete classes and their async I/O.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  computeDashboardMetrics,
  saveMetricsSnapshot,
  loadMetricsSnapshot,
} from './metrics.js';

import {
  type SkillPosition,
  type ChordCandidate,
  MAX_ANGULAR_VELOCITY,
} from './types.js';

// ============================================================================
// Mock helpers
// ============================================================================

/** Create a mock PositionStore with the given positions map. */
function mockPositionStore(positions: Map<string, SkillPosition>) {
  return { all: () => positions, get: (id: string) => positions.get(id) ?? null };
}

/** Create a mock ChordStore with the given active chords. */
function mockChordStore(chords: ChordCandidate[]) {
  return { getAll: () => chords };
}

/** Helper to create a SkillPosition at given theta/radius. */
function pos(theta: number, radius: number, angularVelocity = 0): SkillPosition {
  return { theta, radius, angularVelocity, lastUpdated: new Date().toISOString() };
}

/** Helper to create a minimal ChordCandidate for testing. */
function chord(fromId: string, toId: string): ChordCandidate {
  return {
    fromId,
    toId,
    fromPosition: pos(0.1, 0.5),
    toPosition: pos(1.0, 0.5),
    arcDistance: 0.9,
    chordLength: 0.8,
    savings: 0.1,
    frequency: 5,
  };
}

// ============================================================================
// computeDashboardMetrics
// ============================================================================

describe('computeDashboardMetrics', () => {
  it('returns safe defaults for empty store', () => {
    const store = mockPositionStore(new Map());
    const chords = mockChordStore([]);
    const metrics = computeDashboardMetrics(store, chords);

    expect(metrics.totalSkills).toBe(0);
    expect(metrics.versineDistribution.grounded).toBe(0);
    expect(metrics.versineDistribution.working).toBe(0);
    expect(metrics.versineDistribution.frontier).toBe(0);
    expect(metrics.avgExsecant).toBe(0);
    expect(metrics.angularVelocityWarnings).toEqual([]);
    expect(metrics.chordCandidates).toEqual([]);
  });

  it('categorizes balanced distribution', () => {
    // Grounded: versine < 0.2 -> theta small (cos close to 1)
    // versine = 1 - cos(theta). For theta=0.1: versine ~ 0.005 (grounded)
    // Working: versine 0.2-0.6 -> theta ~ 0.64 to 0.93 rad
    // versine(0.65) = 1 - cos(0.65) ~ 0.20, versine(0.90) ~ 0.38
    // Frontier: versine >= 0.6 -> theta > ~1.0 rad
    // versine(1.2) = 1 - cos(1.2) ~ 0.64
    const positions = new Map<string, SkillPosition>();
    // 3 grounded
    positions.set('g1', pos(0.1, 0.5));
    positions.set('g2', pos(0.05, 0.5));
    positions.set('g3', pos(0.15, 0.5));
    // 5 working
    positions.set('w1', pos(0.70, 0.5));
    positions.set('w2', pos(0.75, 0.5));
    positions.set('w3', pos(0.80, 0.5));
    positions.set('w4', pos(0.85, 0.5));
    positions.set('w5', pos(0.90, 0.5));
    // 2 frontier
    positions.set('f1', pos(1.2, 0.5));
    positions.set('f2', pos(1.5, 0.5));

    const metrics = computeDashboardMetrics(
      mockPositionStore(positions),
      mockChordStore([]),
    );

    expect(metrics.versineDistribution.grounded).toBe(3);
    expect(metrics.versineDistribution.working).toBe(5);
    expect(metrics.versineDistribution.frontier).toBe(2);
    expect(metrics.totalSkills).toBe(10);
  });

  it('handles all skills in one zone', () => {
    const positions = new Map<string, SkillPosition>();
    for (let i = 0; i < 10; i++) {
      positions.set(`s${i}`, pos(0.05, 0.5));
    }

    const metrics = computeDashboardMetrics(
      mockPositionStore(positions),
      mockChordStore([]),
    );

    expect(metrics.versineDistribution.grounded).toBe(10);
    expect(metrics.versineDistribution.working).toBe(0);
    expect(metrics.versineDistribution.frontier).toBe(0);
  });

  it('computes average exsecant correctly', () => {
    // Use two known positions and verify avg is mean of individual exsecants.
    // exsecant(pos) = sec(theta) - 1 = 1/cos(theta) - 1
    const positions = new Map<string, SkillPosition>();
    positions.set('a', pos(0.5, 0.8));   // exsecant(0.5) = 1/cos(0.5) - 1 ~ 0.1395
    positions.set('b', pos(1.0, 0.6));   // exsecant(1.0) = 1/cos(1.0) - 1 ~ 0.8508

    const metrics = computeDashboardMetrics(
      mockPositionStore(positions),
      mockChordStore([]),
    );

    const exsA = 1 / Math.cos(0.5) - 1;
    const exsB = 1 / Math.cos(1.0) - 1;
    const expectedAvg = (exsA + exsB) / 2;

    expect(metrics.avgExsecant).toBeCloseTo(expectedAvg, 4);
  });

  it('detects angular velocity warnings', () => {
    const threshold = MAX_ANGULAR_VELOCITY / 2; // 0.1
    const positions = new Map<string, SkillPosition>();
    // 2 over threshold
    positions.set('fast1', pos(0.5, 0.5, 0.15));
    positions.set('fast2', pos(0.3, 0.5, -0.12));
    // 3 within bounds
    positions.set('slow1', pos(0.5, 0.5, 0.05));
    positions.set('slow2', pos(0.5, 0.5, 0.0));
    positions.set('slow3', pos(0.5, 0.5, -0.09));

    const metrics = computeDashboardMetrics(
      mockPositionStore(positions),
      mockChordStore([]),
    );

    expect(metrics.angularVelocityWarnings).toHaveLength(2);
  });

  it('warning strings include skill ID and velocity', () => {
    const positions = new Map<string, SkillPosition>();
    positions.set('my-skill', pos(0.5, 0.5, 0.15));

    const metrics = computeDashboardMetrics(
      mockPositionStore(positions),
      mockChordStore([]),
    );

    expect(metrics.angularVelocityWarnings).toHaveLength(1);
    const warning = metrics.angularVelocityWarnings[0];
    expect(warning).toContain('my-skill');
    expect(warning).toContain('0.150');
    expect(warning).toContain((MAX_ANGULAR_VELOCITY / 2).toFixed(3));
  });

  it('no warnings when all velocities within bounds', () => {
    const positions = new Map<string, SkillPosition>();
    positions.set('s1', pos(0.5, 0.5, 0.05));
    positions.set('s2', pos(0.5, 0.5, 0.0));
    positions.set('s3', pos(0.5, 0.5, -0.09));

    const metrics = computeDashboardMetrics(
      mockPositionStore(positions),
      mockChordStore([]),
    );

    expect(metrics.angularVelocityWarnings).toEqual([]);
  });

  it('includes chord candidates from store', () => {
    const chords = [chord('a', 'b'), chord('c', 'd')];

    const metrics = computeDashboardMetrics(
      mockPositionStore(new Map()),
      mockChordStore(chords),
    );

    expect(metrics.chordCandidates).toHaveLength(2);
    expect(metrics.chordCandidates[0].fromId).toBe('a');
    expect(metrics.chordCandidates[1].fromId).toBe('c');
  });

  it('totalSkills matches position count', () => {
    const positions = new Map<string, SkillPosition>();
    for (let i = 0; i < 7; i++) {
      positions.set(`skill-${i}`, pos(0.5, 0.5));
    }

    const metrics = computeDashboardMetrics(
      mockPositionStore(positions),
      mockChordStore([]),
    );

    expect(metrics.totalSkills).toBe(7);
  });
});

// ============================================================================
// saveMetricsSnapshot / loadMetricsSnapshot
// ============================================================================

describe('saveMetricsSnapshot', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), 'metrics-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('writes JSON file with timestamp', async () => {
    const metrics = {
      totalSkills: 5,
      versineDistribution: { grounded: 2, working: 2, frontier: 1 },
      avgExsecant: 0.42,
      angularVelocityWarnings: ['warn1'],
      chordCandidates: [],
    };

    const filePath = path.join(tmpDir, 'snapshot.json');
    await saveMetricsSnapshot(metrics, filePath);

    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed.totalSkills).toBe(5);
    expect(parsed.versineDistribution.grounded).toBe(2);
    expect(parsed.avgExsecant).toBe(0.42);
    expect(parsed.angularVelocityWarnings).toEqual(['warn1']);
    expect(typeof parsed.timestamp).toBe('string');
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('creates parent directory if needed', async () => {
    const filePath = path.join(tmpDir, 'nested', 'deep', 'snapshot.json');
    const metrics = {
      totalSkills: 0,
      versineDistribution: { grounded: 0, working: 0, frontier: 0 },
      avgExsecant: 0,
      angularVelocityWarnings: [],
      chordCandidates: [],
    };

    await saveMetricsSnapshot(metrics, filePath);

    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.totalSkills).toBe(0);
    expect(typeof parsed.timestamp).toBe('string');
  });
});

describe('loadMetricsSnapshot', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), 'metrics-load-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('loads saved snapshot (round-trip)', async () => {
    const metrics = {
      totalSkills: 3,
      versineDistribution: { grounded: 1, working: 1, frontier: 1 },
      avgExsecant: 0.55,
      angularVelocityWarnings: ['w1', 'w2'],
      chordCandidates: [],
    };

    const filePath = path.join(tmpDir, 'round-trip.json');
    await saveMetricsSnapshot(metrics, filePath);
    const loaded = await loadMetricsSnapshot(filePath);

    expect(loaded).not.toBeNull();
    expect(loaded!.totalSkills).toBe(3);
    expect(loaded!.versineDistribution).toEqual({ grounded: 1, working: 1, frontier: 1 });
    expect(loaded!.avgExsecant).toBe(0.55);
    expect(loaded!.angularVelocityWarnings).toEqual(['w1', 'w2']);
    expect(typeof loaded!.timestamp).toBe('string');
  });

  it('returns null for nonexistent file', async () => {
    const result = await loadMetricsSnapshot(path.join(tmpDir, 'does-not-exist.json'));
    expect(result).toBeNull();
  });
});
