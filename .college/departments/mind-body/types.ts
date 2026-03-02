/**
 * Mind-Body Department domain types.
 *
 * Shared type definitions for all 8 wings of the Mind-Body department.
 * Extends rosetta-core base types with domain-specific interfaces for
 * techniques, practices, cultural context, training hall, sessions,
 * journal entries, and safety conditions.
 *
 * @module departments/mind-body/types
 */

import type { RosettaConcept, DepartmentWing } from '../../rosetta-core/types.js';

// Re-export base types used by downstream modules
export type { RosettaConcept, DepartmentWing };

// ─── Wing Identification ────────────────────────────────────────────────────

/** The 8 wing IDs within the Mind-Body department */
export type MindBodyWingId =
  | 'breath'
  | 'meditation'
  | 'yoga'
  | 'pilates'
  | 'martial-arts'
  | 'tai-chi'
  | 'relaxation'
  | 'philosophy';

// ─── Technique & Practice ───────────────────────────────────────────────────

/**
 * A single mind-body technique with cultural attribution.
 *
 * Every technique carries its tradition of origin, the original term
 * in its source language, safety notes, and accessibility modifications.
 */
export interface Technique {
  /** Unique technique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Tradition this technique originates from (e.g., 'Hatha Yoga', 'Shaolin Kung Fu') */
  tradition: string;

  /** Original term in source language with translation (e.g., 'Pranayama (breath control)') */
  originalTerm: string;

  /** Description of the technique */
  description: string;

  /** Safety notes and contraindications */
  safetyNotes: string[];

  /** Accessibility modifications for different ability levels */
  modifications: string[];
}

/**
 * A structured practice combining multiple techniques.
 *
 * Practices are the building blocks of sessions -- they group techniques
 * into coherent sequences with duration estimates and equipment needs.
 */
export interface Practice {
  /** Unique practice identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Ordered sequence of techniques in this practice */
  techniques: Technique[];

  /** Estimated duration in minutes */
  estimatedDuration: number;

  /** Required equipment (typically empty for mind-body practices) */
  equipmentRequired: string[];

  /** Conditions that make this practice inadvisable */
  contraindications: string[];
}

// ─── Cultural Context ───────────────────────────────────────────────────────

/**
 * Cultural context for a tradition or technique.
 *
 * Ensures proper attribution, respectful terminology, and historical
 * grounding for all content drawn from specific cultural traditions.
 */
export interface CulturalContext {
  /** Name of the tradition */
  traditionName: string;

  /** Geographic region of origin */
  originRegion: string;

  /** Historical period of development */
  historicalPeriod: string;

  /** Original terminology with translations */
  originalTerminology: Map<string, string>;

  /** Lineage of teachers/schools preserving this tradition */
  lineage: string[];

  /** Guidance on respectful framing of this tradition's content */
  respectfulFraming: string;
}

/**
 * A cultural tradition referenced across the Mind-Body department.
 *
 * Traditions are the source attributions for techniques, practices,
 * and philosophical frameworks.
 */
export interface Tradition {
  /** Unique tradition identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Geographic region of origin */
  region: string;

  /** Historical period (e.g., 'c. 500 BCE', 'Song Dynasty 960-1279 CE') */
  period: string;

  /** Description of the tradition */
  description: string;

  /** Key texts associated with this tradition */
  keyTexts: string[];

  /** How this tradition manifests in modern practice */
  modernContext: string;
}

// ─── Training Hall ──────────────────────────────────────────────────────────

/** Navigation option IDs in the Training Hall */
export type TrainingHallOptionId = 'browse' | 'try' | 'build' | 'map' | 'journal';

/**
 * A single navigation option in the Training Hall.
 */
export interface TrainingHallOption {
  /** Option identifier */
  id: TrainingHallOptionId;

  /** Display label */
  label: string;

  /** Description of what this option provides */
  description: string;

  /** Visual icon for the option */
  icon: string;
}

/**
 * The Training Hall view state -- what a user sees upon entering.
 */
export interface TrainingHallView {
  /** Contextual greeting based on practice history */
  greeting: string;

  /** Available navigation options */
  options: TrainingHallOption[];

  /** Current consecutive practice days */
  currentStreak: number;

  /** Total completed sessions */
  totalSessions: number;
}

// ─── Sessions & Journal ─────────────────────────────────────────────────────

/**
 * A structured session template combining multiple wings.
 */
export interface SessionTemplate {
  /** Unique session identifier */
  id: string;

  /** Human-readable session name */
  name: string;

  /** Session duration bucket */
  durationMinutes: 5 | 15 | 30 | 60;

  /** Wings involved in this session */
  modules: MindBodyWingId[];

  /** Warm-up techniques */
  warmUp: Technique[];

  /** Cool-down techniques */
  coolDown: Technique[];
}

/**
 * A journal entry recording a practice session.
 */
export interface JournalEntry {
  /** Date of the session */
  date: Date;

  /** Duration of the session in minutes */
  durationMinutes: number;

  /** Wings practiced during the session */
  modules: MindBodyWingId[];

  /** Self-reported energy level before the session (1-5) */
  energyBefore: 1 | 2 | 3 | 4 | 5;

  /** Self-reported energy level after the session (1-5) */
  energyAfter: 1 | 2 | 3 | 4 | 5;

  /** Optional free-form observation */
  observation?: string;
}

// ─── Safety ─────────────────────────────────────────────────────────────────

/**
 * A safety condition that modifies what practices are recommended.
 *
 * Safety conditions represent physical or medical states that require
 * movement modifications or contraindicate specific techniques.
 */
export interface SafetyCondition {
  /** Unique condition identifier */
  id: string;

  /** Human-readable condition name */
  name: string;

  /** Description of the condition */
  description: string;

  /** Movements or techniques that are contraindicated */
  contraindicatedMovements: string[];

  /** Suggested modifications for safe practice */
  suggestedModifications: string[];
}
