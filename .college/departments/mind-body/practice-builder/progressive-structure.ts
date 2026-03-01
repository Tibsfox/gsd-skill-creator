/**
 * Progressive Structure -- 9-week guided curriculum.
 *
 * Guides users from breath fundamentals to personalized practice across
 * four phases:
 *
 * - Foundation (weeks 1-2): Breath ONLY. 5 min/day. Build the habit.
 * - Expansion (weeks 3-4): Add 1 module. 10-15 min/day. Explore.
 * - Integration (weeks 5-8): Add 2nd module. 15-25 min/day. Cross-connections.
 * - Personalization (weeks 9+): User designs own practice. Builder follows lead.
 *
 * The progressive structure respects the principle that showing up is more
 * important than duration. Week 1 asks for 5 minutes because 5 minutes
 * every day for two weeks builds a habit. 60 minutes once builds nothing.
 *
 * @module departments/mind-body/practice-builder/progressive-structure
 */

import type { MindBodyWingId } from '../types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A phase in the progressive practice structure */
export interface ProgressivePhase {
  /** Phase name */
  name: string;

  /** Week range [start, end] -- end is Infinity for personalization */
  weekRange: [number, number];

  /** Recommended daily practice time in minutes (range for flexibility) */
  dailyMinutes: { min: number; max: number };

  /** Number of modules allowed/recommended */
  modules: number;

  /** Description of this phase's purpose */
  description: string;

  /** Guidance text for the user */
  guidance: string;
}

// ─── Phase Definitions ──────────────────────────────────────────────────────

/**
 * Weeks 1-2: Foundation.
 *
 * Breath ONLY. 5 minutes per day. The entire goal is building the habit
 * of showing up. The practice is simple enough that there is no excuse
 * not to do it, and short enough that it never feels burdensome.
 */
export const foundationPhase: ProgressivePhase = {
  name: 'Foundation',
  weekRange: [1, 2],
  dailyMinutes: { min: 5, max: 5 },
  modules: 1,
  description: 'Breath ONLY. Build the habit of showing up.',
  guidance:
    'Your only job is to show up for 5 minutes. Sit or lie down. Breathe. ' +
    'That is the entire practice. If you do this every day for two weeks, ' +
    'you will have built the most important skill in all of mind-body practice: consistency.',
};

/**
 * Weeks 3-4: Expansion.
 *
 * Breath + 1 user-chosen module. 10-15 minutes per day. The user has
 * established a habit; now they add one dimension that interests them.
 */
export const expansionPhase: ProgressivePhase = {
  name: 'Expansion',
  weekRange: [3, 4],
  dailyMinutes: { min: 10, max: 15 },
  modules: 2,
  description: 'Add 1 module of your choice to breath practice.',
  guidance:
    'You have a breath practice. Now choose one discipline that calls to you -- ' +
    'meditation, yoga, tai chi, martial arts, pilates, relaxation, or philosophy. ' +
    'Add it to your daily practice. The breath remains the foundation; ' +
    'the new module is exploration.',
};

/**
 * Weeks 5-8: Integration.
 *
 * Breath + 2 modules. 15-25 minutes per day. Cross-module connections
 * emerge: breath links to movement, stillness informs action.
 */
export const integrationPhase: ProgressivePhase = {
  name: 'Integration',
  weekRange: [5, 8],
  dailyMinutes: { min: 15, max: 25 },
  modules: 3,
  description: 'Add a 2nd module. Discover cross-module connections.',
  guidance:
    'Add a second module to your practice. Notice how breath informs movement, ' +
    'how stillness informs action, how the disciplines begin to speak to each other. ' +
    'The connections between modules are where the deepest learning happens.',
};

/**
 * Weeks 9+: Personalization.
 *
 * User designs their own practice. The builder suggests but follows the
 * user's lead. Any combination of modules, any duration.
 */
export const personalizationPhase: ProgressivePhase = {
  name: 'Personalization',
  weekRange: [9, Infinity],
  dailyMinutes: { min: 5, max: 60 },
  modules: 8,
  description: 'Design your own practice. The builder follows your lead.',
  guidance:
    'You have a practice now. It is yours. Choose any combination of modules, ' +
    'any duration that serves you today. Some days will be 5 minutes of breath. ' +
    'Some days will be 60 minutes of deep exploration. The builder suggests -- you decide.',
};

/** All 4 progressive phases in chronological order */
export const allPhases: ProgressivePhase[] = [
  foundationPhase,
  expansionPhase,
  integrationPhase,
  personalizationPhase,
];

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Get the progressive phase for a given week number.
 *
 * @param weekNumber - The current week (1-based). Values < 1 are clamped to 1.
 * @returns The progressive phase for that week
 */
export function getPhaseForWeek(weekNumber: number): ProgressivePhase {
  const week = Math.max(1, weekNumber);

  for (const phase of allPhases) {
    if (week >= phase.weekRange[0] && week <= phase.weekRange[1]) {
      return phase;
    }
  }

  // Should be unreachable -- personalization covers weeks 9+
  return personalizationPhase;
}

/**
 * Get recommended modules for a given week and user preferences.
 *
 * Always includes 'breath' as the foundation. The number of additional
 * modules depends on the current phase.
 *
 * @param weekNumber - The current week (1-based)
 * @param userPreferences - User's preferred modules in priority order
 * @returns Recommended module list for that week
 */
export function getRecommendedModules(
  weekNumber: number,
  userPreferences: MindBodyWingId[],
): MindBodyWingId[] {
  const phase = getPhaseForWeek(weekNumber);
  const modules: MindBodyWingId[] = ['breath'];

  if (phase.modules <= 1) {
    // Foundation: breath only
    return modules;
  }

  // Add user-preferred modules up to the phase limit
  // (excluding breath since it's already included)
  const additionalCount = phase.modules - 1;
  const nonBreathPreferences = userPreferences.filter(m => m !== 'breath');

  for (let i = 0; i < Math.min(additionalCount, nonBreathPreferences.length); i++) {
    modules.push(nonBreathPreferences[i]);
  }

  return modules;
}
