/**
 * Chord Detection and Persistence for the Complex Plane.
 *
 * ChordDetector scans co-activation data and filters by geometric criteria
 * (angular separation, savings ratio, frequency) to produce ranked
 * ChordCandidate arrays. ChordStore provides JSON persistence at
 * `.claude/plane/chords.json`.
 *
 * Key concept: A chord is a straight-line shortcut between two skills on the
 * complex plane. When two distant skills co-activate frequently, the chord
 * formalizes this learning shortcut with geometric savings metrics.
 *
 * Imports: types.ts (SkillPosition, ChordCandidate), arithmetic.ts (arcDistance,
 * chordLength, composePositions).
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { SkillPosition, ChordCandidate } from './types.js';
import { arcDistance, chordLength, composePositions } from './arithmetic.js';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Minimal interface for position lookup, decoupled from the concrete
 * PositionStore class. Enables mock injection in tests.
 */
export interface PositionStorePort {
  get(skillId: string): SkillPosition | null;
  all(): Map<string, SkillPosition>;
}

/** Configuration options for chord detection filtering. */
export interface ChordDetectionOptions {
  /** Minimum arc distance (radians) between two skills to consider a chord. */
  minChordArc: number;
  /** Minimum arc/chord ratio for the savings to be meaningful. */
  minSavingsRatio: number;
  /** Minimum co-activation count to consider a pair. */
  minFrequency: number;
}

/** Default chord detection options. */
export const DEFAULT_CHORD_OPTIONS: ChordDetectionOptions = {
  minChordArc: Math.PI / 4,
  minSavingsRatio: 1.5,
  minFrequency: 5,
};

/** Result of evaluating a single chord candidate. */
export interface ChordEvaluation {
  chord: ChordCandidate;
  score: number;
  composedPosition: SkillPosition;
  compositionQuality: 'excellent' | 'good' | 'marginal' | 'poor';
  recommendAction: 'create_composite' | 'suggest_to_user' | 'monitor' | 'ignore';
}

// ============================================================================
// assessCompositionQuality
// ============================================================================

/**
 * Classify the quality of a composed skill position.
 *
 * Boundary rules (checked in order):
 * 1. poor: theta > pi (wraps past halfway, divergent skills)
 * 2. excellent: theta in [pi/8, 3pi/8] AND radius > 0.5
 * 3. good: theta in [0, pi/2] AND radius > 0.3
 * 4. marginal: everything else
 */
export function assessCompositionQuality(
  composed: SkillPosition,
): 'excellent' | 'good' | 'marginal' | 'poor' {
  const { theta, radius } = composed;

  if (theta > Math.PI) return 'poor';
  if (theta >= Math.PI / 8 && theta <= 3 * Math.PI / 8 && radius > 0.5) return 'excellent';
  if (theta >= 0 && theta <= Math.PI / 2 && radius > 0.3) return 'good';
  return 'marginal';
}

// ============================================================================
// determineAction
// ============================================================================

/**
 * Map composition quality and chord frequency to a recommended action.
 *
 * - ignore: poor quality (no matter the frequency)
 * - create_composite: excellent quality + high frequency (>= 10)
 * - suggest_to_user: good quality + sufficient frequency (>= 5)
 * - monitor: everything else
 */
export function determineAction(
  chord: ChordCandidate,
  quality: string,
): 'create_composite' | 'suggest_to_user' | 'monitor' | 'ignore' {
  if (quality === 'poor') return 'ignore';
  if (quality === 'excellent' && chord.frequency >= 10) return 'create_composite';
  if (quality === 'good' && chord.frequency >= 5) return 'suggest_to_user';
  return 'monitor';
}

// ============================================================================
// ChordDetector
// ============================================================================

/** Co-activation entry shape expected by detectChords. */
interface CoActivationEntry {
  skillPair: [string, string];
  coActivationCount: number;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Detects geometrically meaningful chords from co-activation data.
 *
 * Constructor-injected PositionStorePort enables testing with mock stores
 * and decouples from the concrete PositionStore (which has async I/O).
 */
export class ChordDetector {
  private readonly positionStore: PositionStorePort;

  constructor(positionStore: PositionStorePort) {
    this.positionStore = positionStore;
  }

  /**
   * Scan co-activation data and filter by geometric criteria.
   *
   * For each pair:
   * 1. Look up both positions
   * 2. Filter by minimum arc distance
   * 3. Filter by minimum savings ratio (arc / chord)
   * 4. Filter by minimum co-activation frequency
   * 5. Sort by savings * frequency descending
   */
  detectChords(
    coActivations: CoActivationEntry[],
    options?: Partial<ChordDetectionOptions>,
  ): ChordCandidate[] {
    const opts: ChordDetectionOptions = { ...DEFAULT_CHORD_OPTIONS, ...options };
    const results: ChordCandidate[] = [];

    for (const entry of coActivations) {
      const posA = this.positionStore.get(entry.skillPair[0]);
      const posB = this.positionStore.get(entry.skillPair[1]);

      // Skip pairs where either skill has no position
      if (!posA || !posB) continue;

      // Compute arc distance between the two positions
      const arc = arcDistance(posA, posB);
      if (arc < opts.minChordArc) continue;

      // Compute chord length and savings
      const chord = chordLength(posA, posB);
      const savings = arc - chord;

      // Compute savings ratio (avoid division by zero)
      const savingsRatio = chord > 0 ? arc / chord : 0;
      if (savingsRatio < opts.minSavingsRatio) continue;

      // Filter by minimum frequency
      if (entry.coActivationCount < opts.minFrequency) continue;

      results.push({
        fromId: entry.skillPair[0],
        toId: entry.skillPair[1],
        fromPosition: posA,
        toPosition: posB,
        arcDistance: arc,
        chordLength: chord,
        savings,
        frequency: entry.coActivationCount,
      });
    }

    // Sort by savings * frequency descending
    results.sort((a, b) => (b.savings * b.frequency) - (a.savings * a.frequency));

    return results;
  }

  /**
   * Evaluate a chord candidate: compose positions, classify quality, and
   * determine the recommended action.
   */
  evaluateChord(chord: ChordCandidate): ChordEvaluation {
    const composed = composePositions(chord.fromPosition, chord.toPosition);
    const quality = assessCompositionQuality(composed);
    const action = determineAction(chord, quality);
    const score = chord.savings * chord.frequency;

    return {
      chord,
      score,
      composedPosition: composed,
      compositionQuality: quality,
      recommendAction: action,
    };
  }
}

// ============================================================================
// ChordStore
// ============================================================================

/**
 * JSON persistence layer for chord candidates.
 *
 * Stores an array of ChordCandidate objects at a configurable file path
 * (default: `.claude/plane/chords.json`). Creates the directory tree
 * lazily on first save.
 */
export class ChordStore {
  private chords: ChordCandidate[] = [];
  private readonly filePath: string;

  constructor(filePath = '.claude/plane/chords.json') {
    this.filePath = filePath;
  }

  /**
   * Load chords from the JSON file.
   * If the file does not exist or contains invalid JSON, initializes empty.
   */
  async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.chords = parsed;
      } else {
        this.chords = [];
      }
    } catch {
      this.chords = [];
    }
  }

  /**
   * Save chords to the JSON file.
   * Creates the parent directory tree if it does not exist.
   */
  async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.chords, null, 2), 'utf-8');
  }

  /** Get a defensive copy of all stored chords. */
  getAll(): ChordCandidate[] {
    return [...this.chords];
  }

  /** Replace the stored chords with a new array (defensive copy). */
  set(chords: ChordCandidate[]): void {
    this.chords = [...chords];
  }

  /** Remove all stored chords. */
  clear(): void {
    this.chords = [];
  }
}
