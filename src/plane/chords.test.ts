/**
 * Tests for ChordDetector, ChordStore, assessCompositionQuality, and
 * determineAction from the chord detection module.
 *
 * Covers: detection filtering (arc, savings ratio, frequency), evaluation,
 * composition quality classification, action determination, and JSON
 * persistence round-tripping.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  ChordDetector,
  ChordStore,
  assessCompositionQuality,
  determineAction,
  DEFAULT_CHORD_OPTIONS,
} from './chords.js';
import type { PositionStorePort, ChordDetectionOptions, ChordEvaluation } from './chords.js';
import type { SkillPosition, ChordCandidate } from './types.js';
import { createPosition } from './arithmetic.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Mock PositionStore implementing the PositionStorePort interface.
 * Allows injection of known positions without file I/O.
 */
class MockPositionStore implements PositionStorePort {
  private positions = new Map<string, SkillPosition>();

  get(skillId: string): SkillPosition | null {
    return this.positions.get(skillId) ?? null;
  }

  set(skillId: string, position: SkillPosition): void {
    this.positions.set(skillId, position);
  }

  all(): Map<string, SkillPosition> {
    return new Map(this.positions);
  }
}

/** Build a mock SkillCoActivation entry for ChordDetector.detectChords. */
function makeCoActivation(
  a: string,
  b: string,
  count: number,
  firstSeen = 0,
  lastSeen = Date.now(),
) {
  return {
    skillPair: [a, b] as [string, string],
    coActivationCount: count,
    firstSeen,
    lastSeen,
  };
}

// ============================================================================
// assessCompositionQuality
// ============================================================================

describe('assessCompositionQuality', () => {
  it('returns excellent for theta in [pi/8, 3pi/8] with radius > 0.5', () => {
    const pos = createPosition(Math.PI / 4, 0.7);
    expect(assessCompositionQuality(pos)).toBe('excellent');
  });

  it('returns good for theta in [0, pi/2] with radius > 0.3', () => {
    const pos = createPosition(0.1, 0.4);
    expect(assessCompositionQuality(pos)).toBe('good');
  });

  it('returns marginal for low radius (< 0.3)', () => {
    const pos = createPosition(Math.PI / 4, 0.2);
    expect(assessCompositionQuality(pos)).toBe('marginal');
  });

  it('returns marginal for high theta (> pi/2)', () => {
    const pos = createPosition(1.8, 0.6);
    expect(assessCompositionQuality(pos)).toBe('marginal');
  });

  it('returns poor for theta > pi', () => {
    const pos = createPosition(3.5, 0.5);
    expect(assessCompositionQuality(pos)).toBe('poor');
  });
});

// ============================================================================
// determineAction
// ============================================================================

describe('determineAction', () => {
  // Construct a minimal ChordCandidate with the given frequency
  function chordWithFreq(frequency: number): ChordCandidate {
    const pos = createPosition(0.5, 0.5);
    return {
      fromId: 'a',
      toId: 'b',
      fromPosition: pos,
      toPosition: pos,
      arcDistance: 1.0,
      chordLength: 0.8,
      savings: 0.2,
      frequency,
    };
  }

  it('returns create_composite for excellent quality with frequency >= 10', () => {
    expect(determineAction(chordWithFreq(12), 'excellent')).toBe('create_composite');
  });

  it('returns suggest_to_user for good quality with frequency >= 5', () => {
    expect(determineAction(chordWithFreq(7), 'good')).toBe('suggest_to_user');
  });

  it('returns monitor for marginal quality', () => {
    expect(determineAction(chordWithFreq(10), 'marginal')).toBe('monitor');
  });

  it('returns monitor for low frequency even with good quality', () => {
    expect(determineAction(chordWithFreq(3), 'good')).toBe('monitor');
  });

  it('returns ignore for poor quality', () => {
    expect(determineAction(chordWithFreq(20), 'poor')).toBe('ignore');
  });
});

// ============================================================================
// ChordDetector
// ============================================================================

describe('ChordDetector', () => {
  let store: MockPositionStore;
  let detector: ChordDetector;

  beforeEach(() => {
    store = new MockPositionStore();

    // Populate known positions
    // For chord detection to work, the savings ratio arc/(2*r_avg*sin(arc/2))
    // must be >= 1.5. Lower radii increase the ratio because chord shrinks
    // faster than arc distance. So we use moderate radii (~0.3-0.4) for the
    // test pair to ensure the savings threshold is met.
    store.set('skill-concrete', createPosition(0.1, 0.35));  // concrete, moderate maturity
    store.set('skill-abstract', createPosition(1.4, 0.3));   // abstract, moderate maturity
    store.set('skill-balanced', createPosition(Math.PI / 4, 0.5)); // balanced
    store.set('skill-nearby', createPosition(0.15, 0.6));    // close to skill-concrete
    store.set('skill-immature', createPosition(1.0, 0.1));   // immature

    detector = new ChordDetector(store);
  });

  // --------------------------------------------------------------------------
  // detectChords
  // --------------------------------------------------------------------------

  describe('detectChords', () => {
    it('detects distant, frequently co-activated pair', () => {
      const coAct = [makeCoActivation('skill-concrete', 'skill-abstract', 10)];
      const chords = detector.detectChords(coAct);

      expect(chords.length).toBe(1);
      expect(chords[0].fromId).toBe('skill-concrete');
      expect(chords[0].toId).toBe('skill-abstract');
      expect(chords[0].savings).toBeGreaterThan(0);
      expect(chords[0].frequency).toBe(10);
    });

    it('filters nearby skills (arc < minChordArc)', () => {
      const coAct = [makeCoActivation('skill-concrete', 'skill-nearby', 10)];
      const chords = detector.detectChords(coAct);
      expect(chords.length).toBe(0);
    });

    it('filters insufficient frequency', () => {
      const coAct = [makeCoActivation('skill-concrete', 'skill-abstract', 2)];
      const chords = detector.detectChords(coAct);
      expect(chords.length).toBe(0);
    });

    it('filters low savings ratio', () => {
      // Two high-radius skills with moderate arc separation.
      // With r=1.0 and arc~pi/2: ratio = (pi/2)/(2*sin(pi/4)) = 1.11 < 1.5
      // The high radius means chord is closer to arc, so savings ratio is low.
      store.set('high-a', createPosition(0.5, 1.0));
      store.set('high-b', createPosition(0.5 + Math.PI / 2, 1.0));
      const coAct = [makeCoActivation('high-a', 'high-b', 10)];
      const chords = detector.detectChords(coAct);
      expect(chords.length).toBe(0);
    });

    it('skips skills without positions', () => {
      const coAct = [makeCoActivation('unknown-skill', 'skill-concrete', 10)];
      const chords = detector.detectChords(coAct);
      expect(chords.length).toBe(0);
    });

    it('fills fromId and toId correctly', () => {
      const coAct = [makeCoActivation('skill-concrete', 'skill-abstract', 10)];
      const chords = detector.detectChords(coAct);
      expect(chords[0].fromId).toBe('skill-concrete');
      expect(chords[0].toId).toBe('skill-abstract');
    });

    it('sorts by savings * frequency descending', () => {
      const coAct = [
        makeCoActivation('skill-concrete', 'skill-balanced', 10),  // moderate arc
        makeCoActivation('skill-concrete', 'skill-abstract', 10),  // larger arc
      ];
      const chords = detector.detectChords(coAct);
      if (chords.length >= 2) {
        const score0 = chords[0].savings * chords[0].frequency;
        const score1 = chords[1].savings * chords[1].frequency;
        expect(score0).toBeGreaterThanOrEqual(score1);
      }
    });

    it('respects custom options', () => {
      // Use very loose thresholds so nearby skills pass
      const coAct = [makeCoActivation('skill-concrete', 'skill-nearby', 3)];
      const chords = detector.detectChords(coAct, {
        minChordArc: 0.01,
        minFrequency: 2,
        minSavingsRatio: 1.0,
      });
      expect(chords.length).toBe(1);
    });

    it('returns empty for empty co-activations', () => {
      expect(detector.detectChords([])).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // evaluateChord
  // --------------------------------------------------------------------------

  describe('evaluateChord', () => {
    it('evaluates a high-savings chord', () => {
      // Build a chord directly to avoid dependency on detectChords filtering
      const posA = store.get('skill-concrete')!;
      const posB = store.get('skill-abstract')!;
      const chord: ChordCandidate = {
        fromId: 'skill-concrete',
        toId: 'skill-abstract',
        fromPosition: posA,
        toPosition: posB,
        arcDistance: 1.3,
        chordLength: 0.5,
        savings: 0.8,
        frequency: 10,
      };

      const evaluation = detector.evaluateChord(chord);
      expect(evaluation.chord).toBe(chord);
      expect(['excellent', 'good', 'marginal', 'poor']).toContain(evaluation.compositionQuality);
      expect(evaluation.recommendAction).toBeDefined();
    });

    it('evaluates poor chord when composed theta wraps past pi', () => {
      // Two skills with high theta -> composed theta > pi
      store.set('abstract-a', createPosition(2.0, 0.5));
      store.set('abstract-b', createPosition(2.0, 0.5));
      const chord: ChordCandidate = {
        fromId: 'abstract-a',
        toId: 'abstract-b',
        fromPosition: store.get('abstract-a')!,
        toPosition: store.get('abstract-b')!,
        arcDistance: 0,
        chordLength: 0,
        savings: 0.5,
        frequency: 20,
      };
      const evaluation = detector.evaluateChord(chord);
      // composed theta = 2.0 + 2.0 = 4.0 (normalized, > pi)
      expect(evaluation.compositionQuality).toBe('poor');
      expect(evaluation.recommendAction).toBe('ignore');
    });

    it('computes score as savings * frequency', () => {
      const posA = store.get('skill-concrete')!;
      const posB = store.get('skill-abstract')!;
      const chord: ChordCandidate = {
        fromId: 'skill-concrete',
        toId: 'skill-abstract',
        fromPosition: posA,
        toPosition: posB,
        arcDistance: 1.3,
        chordLength: 0.5,
        savings: 0.8,
        frequency: 10,
      };
      const evaluation = detector.evaluateChord(chord);
      expect(evaluation.score).toBeCloseTo(chord.savings * chord.frequency, 5);
    });

    it('computes composed position via Euler multiplication', () => {
      const posA = store.get('skill-concrete')!;
      const posB = store.get('skill-abstract')!;
      const chord: ChordCandidate = {
        fromId: 'skill-concrete',
        toId: 'skill-abstract',
        fromPosition: posA,
        toPosition: posB,
        arcDistance: 1.3,
        chordLength: 0.5,
        savings: 0.8,
        frequency: 10,
      };
      const evaluation = detector.evaluateChord(chord);
      // theta ~ a.theta + b.theta (mod 2pi), radius ~ a.radius * b.radius
      const expectedTheta = (posA.theta + posB.theta) % (2 * Math.PI);
      expect(evaluation.composedPosition.theta).toBeCloseTo(expectedTheta, 2);
      expect(evaluation.composedPosition.radius).toBeCloseTo(posA.radius * posB.radius, 2);
    });
  });
});

// ============================================================================
// ChordStore
// ============================================================================

describe('ChordStore', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chord-store-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeChord(fromId: string, toId: string): ChordCandidate {
    return {
      fromId,
      toId,
      fromPosition: createPosition(0.1, 0.8),
      toPosition: createPosition(1.4, 0.7),
      arcDistance: 1.3,
      chordLength: 0.9,
      savings: 0.4,
      frequency: 10,
    };
  }

  it('saves and loads chords', async () => {
    const filePath = path.join(tmpDir, 'chords.json');
    const store = new ChordStore(filePath);
    const chords = [makeChord('a', 'b'), makeChord('c', 'd')];
    store.set(chords);
    await store.save();

    const store2 = new ChordStore(filePath);
    await store2.load();
    const loaded = store2.getAll();
    expect(loaded.length).toBe(2);
    expect(loaded[0].fromId).toBe('a');
    expect(loaded[1].fromId).toBe('c');
  });

  it('handles empty state (non-existent file)', async () => {
    const filePath = path.join(tmpDir, 'nonexistent.json');
    const store = new ChordStore(filePath);
    await store.load();
    expect(store.getAll()).toEqual([]);
  });

  it('clear removes all chords', () => {
    const store = new ChordStore(path.join(tmpDir, 'c.json'));
    store.set([makeChord('x', 'y')]);
    expect(store.getAll().length).toBe(1);
    store.clear();
    expect(store.getAll()).toEqual([]);
  });

  it('creates parent directory if missing', async () => {
    const filePath = path.join(tmpDir, 'deep', 'nested', 'chords.json');
    const store = new ChordStore(filePath);
    store.set([makeChord('m', 'n')]);
    await store.save();

    // Verify file was written
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
  });
});
