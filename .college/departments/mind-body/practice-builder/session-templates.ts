/**
 * Session Templates -- predefined time-commitment structures.
 *
 * Four templates covering the spectrum from minimal daily practice to
 * deep exploration sessions:
 *
 * - 5-min micro: breath + one technique. For days when showing up is the victory.
 * - 15-min morning: breath + gentle movement + brief meditation. Sustainable daily.
 * - 30-min full: warm-up + primary practice + cool-down + meditation. The "real" session.
 * - 60-min deep: warm-up + primary + secondary + relaxation + meditation. Full immersion.
 *
 * @module departments/mind-body/practice-builder/session-templates
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** Segment types within a template structure */
export type TemplateSegmentType = 'warmup' | 'primary' | 'secondary' | 'cooldown' | 'meditation';

/** A structural segment within a session template */
export interface TemplateSegment {
  /** Segment type */
  type: TemplateSegmentType;

  /** Duration in minutes */
  durationMinutes: number;

  /** Optional module preference for this segment */
  modulePreference?: string;
}

/** A complete session template */
export interface Template {
  /** Unique template identifier */
  id: string;

  /** Human-readable template name */
  name: string;

  /** Total duration in minutes */
  durationMinutes: 5 | 15 | 30 | 60;

  /** Ordered segment structure */
  structure: TemplateSegment[];
}

// ─── Templates ──────────────────────────────────────────────────────────────

/**
 * 5-minute micro session.
 *
 * Breath + one technique from selected module. For days when showing up
 * is the victory. The minimum viable practice.
 */
export const microTemplate: Template = {
  id: 'micro-5',
  name: '5-Minute Micro Session',
  durationMinutes: 5,
  structure: [
    { type: 'warmup', durationMinutes: 1, modulePreference: 'breath' },
    { type: 'primary', durationMinutes: 3 },
    { type: 'cooldown', durationMinutes: 1 },
  ],
};

/**
 * 15-minute morning session.
 *
 * Breath + gentle movement + brief meditation. Sustainable daily practice
 * that touches three dimensions: breath, body, mind.
 */
export const morningTemplate: Template = {
  id: 'morning-15',
  name: '15-Minute Morning Session',
  durationMinutes: 15,
  structure: [
    { type: 'warmup', durationMinutes: 3, modulePreference: 'breath' },
    { type: 'primary', durationMinutes: 7 },
    { type: 'meditation', durationMinutes: 5, modulePreference: 'meditation' },
  ],
};

/**
 * 30-minute full session.
 *
 * Warm-up + primary practice + cool-down + meditation. The "real" session
 * for dedicated practice days.
 */
export const fullTemplate: Template = {
  id: 'full-30',
  name: '30-Minute Full Session',
  durationMinutes: 30,
  structure: [
    { type: 'warmup', durationMinutes: 5, modulePreference: 'breath' },
    { type: 'primary', durationMinutes: 15 },
    { type: 'cooldown', durationMinutes: 5 },
    { type: 'meditation', durationMinutes: 5, modulePreference: 'meditation' },
  ],
};

/**
 * 60-minute deep session.
 *
 * Warm-up + primary + secondary + relaxation + meditation. For when time
 * and motivation align -- full immersion in practice.
 */
export const deepTemplate: Template = {
  id: 'deep-60',
  name: '60-Minute Deep Session',
  durationMinutes: 60,
  structure: [
    { type: 'warmup', durationMinutes: 10, modulePreference: 'breath' },
    { type: 'primary', durationMinutes: 20 },
    { type: 'secondary', durationMinutes: 10 },
    { type: 'cooldown', durationMinutes: 10, modulePreference: 'relaxation' },
    { type: 'meditation', durationMinutes: 10, modulePreference: 'meditation' },
  ],
};

/** All 4 session templates in ascending duration order */
export const allTemplates: Template[] = [
  microTemplate,
  morningTemplate,
  fullTemplate,
  deepTemplate,
];
