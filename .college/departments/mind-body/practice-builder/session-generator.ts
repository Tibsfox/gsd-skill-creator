/**
 * Session Generator -- creates valid practice sessions from module combinations.
 *
 * Generates sessions for any combination of the 8 Mind-Body wings at 4 time
 * commitments (5, 15, 30, 60 minutes). Every session includes appropriate
 * warm-up (breath-based) and cool-down (relaxation-based) segments regardless
 * of modules selected.
 *
 * Time allocation:
 * - Warm-up: ~15-20% of total duration
 * - Primary segments: ~50-60%
 * - Cool-down: ~20-25%
 *
 * Safety integration is optional -- if a PhysicalSafetyWarden is available,
 * contraindicated techniques are filtered for flagged conditions.
 *
 * @module departments/mind-body/practice-builder/session-generator
 */

import type { MindBodyWingId } from '../types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single segment within a generated session */
export interface SessionSegment {
  /** Human-readable segment name */
  name: string;

  /** Description of what this segment involves */
  description: string;

  /** Duration in minutes */
  durationMinutes: number;

  /** Which module this segment draws from */
  module: MindBodyWingId;

  /** Techniques included in this segment */
  techniques: string[];
}

/** A fully generated practice session */
export interface GeneratedSession {
  /** Warm-up segment (always breath-based) */
  warmUp: SessionSegment;

  /** Primary practice segments */
  segments: SessionSegment[];

  /** Cool-down segment (always relaxation-based) */
  coolDown: SessionSegment;

  /** Total session duration in minutes */
  totalMinutes: number;

  /** Modules included in this session */
  modules: MindBodyWingId[];
}

// ─── Module Technique Registry ──────────────────────────────────────────────

/** Techniques available per module for session generation */
const MODULE_TECHNIQUES: Record<MindBodyWingId, { name: string; techniques: string[]; description: string }> = {
  breath: {
    name: 'Breathwork',
    techniques: ['Diaphragmatic breathing', 'Box breathing (4-4-4-4)', 'Ujjayi breath', 'Breath counting', 'Martial breath (kiai)'],
    description: 'Breath control and awareness exercises',
  },
  meditation: {
    name: 'Meditation',
    techniques: ['Mindfulness meditation', 'Concentration meditation', 'Zen meditation (zazen)', 'Body scan', 'Walking meditation', 'Loving-kindness (metta)'],
    description: 'Attention training and mindfulness practice',
  },
  yoga: {
    name: 'Yoga',
    techniques: ['Sun Salutation', 'Mountain pose (tadasana)', 'Downward dog', 'Warrior I & II', 'Tree pose', 'Child\'s pose'],
    description: 'Breath-linked movement and postures',
  },
  pilates: {
    name: 'Pilates',
    techniques: ['The Hundred', 'Roll-Up', 'Single Leg Stretch', 'Spine Stretch Forward', 'Swan', 'Side Kick Series'],
    description: 'Core-centered precision movement',
  },
  'martial-arts': {
    name: 'Martial Arts',
    techniques: ['Horse stance (ma bu)', 'Bow stance (gong bu)', 'Straight punch', 'Palm strike', 'Basic blocks', 'Simple form'],
    description: 'Stances, strikes, and forms',
  },
  'tai-chi': {
    name: 'Tai Chi',
    techniques: ['Opening form', 'Grasp sparrow\'s tail', 'Single whip', 'Cloud hands', 'Brush knee', 'Closing form'],
    description: 'Slow, flowing movement meditation',
  },
  relaxation: {
    name: 'Relaxation',
    techniques: ['Progressive muscle relaxation', 'Yoga nidra', 'Myofascial release', 'Stretching protocols', 'Nervous system regulation'],
    description: 'Recovery and parasympathetic activation',
  },
  philosophy: {
    name: 'Philosophy',
    techniques: ['Tradition study', 'Reflective journaling', 'Concept contemplation', 'Cross-tradition comparison', 'Ethical reflection'],
    description: 'Contemplative study of mind-body traditions',
  },
};

/** Warm-up techniques (always breath-based with optional gentle movement) */
const WARMUP_TECHNIQUES: Record<number, string[]> = {
  1: ['Diaphragmatic breathing'],
  2: ['Diaphragmatic breathing', 'Gentle neck rolls'],
  3: ['Diaphragmatic breathing', 'Gentle neck rolls', 'Shoulder circles'],
  5: ['Diaphragmatic breathing', 'Box breathing', 'Gentle neck rolls', 'Shoulder circles', 'Spinal twist'],
  10: ['Diaphragmatic breathing', 'Box breathing', 'Ujjayi breath', 'Gentle neck rolls', 'Shoulder circles', 'Spinal twist', 'Cat-cow stretch', 'Hip circles', 'Ankle rotations', 'Standing forward fold'],
};

/** Cool-down techniques (always relaxation-based) */
const COOLDOWN_TECHNIQUES: Record<number, string[]> = {
  1: ['Breath awareness'],
  2: ['Gentle stretching', 'Breath awareness'],
  3: ['Gentle stretching', 'Progressive relaxation', 'Breath awareness'],
  5: ['Gentle stretching', 'Progressive muscle relaxation', 'Nervous system settling', 'Body scan', 'Breath awareness'],
  10: ['Gentle stretching', 'Hip openers', 'Spinal decompression', 'Progressive muscle relaxation', 'Nervous system settling', 'Body scan', 'Breath counting', 'Stillness', 'Gratitude pause', 'Final breath awareness'],
  15: ['Gentle stretching', 'Hip openers', 'Spinal decompression', 'Hamstring release', 'Shoulder release', 'Progressive muscle relaxation', 'Nervous system settling', 'Yoga nidra introduction', 'Body scan', 'Breath counting', 'Stillness', 'Gratitude pause', 'Integration pause', 'Savasana', 'Final breath awareness'],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get warmup techniques for a given duration */
function getWarmUpTechniques(durationMinutes: number): string[] {
  const keys = Object.keys(WARMUP_TECHNIQUES).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const key of keys) {
    if (key <= durationMinutes) {
      best = key;
    }
  }
  return WARMUP_TECHNIQUES[best];
}

/** Get cooldown techniques for a given duration */
function getCoolDownTechniques(durationMinutes: number): string[] {
  const keys = Object.keys(COOLDOWN_TECHNIQUES).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const key of keys) {
    if (key <= durationMinutes) {
      best = key;
    }
  }
  return COOLDOWN_TECHNIQUES[best];
}

/** Select techniques for a module segment */
function selectTechniques(module: MindBodyWingId, durationMinutes: number): string[] {
  const info = MODULE_TECHNIQUES[module];
  // Roughly 1 technique per 3 minutes, minimum 1
  const count = Math.max(1, Math.min(info.techniques.length, Math.ceil(durationMinutes / 3)));
  return info.techniques.slice(0, count);
}

// ─── Session Generator ──────────────────────────────────────────────────────

/** Optional safety filter interface -- works without safety warden */
export interface SafetyFilter {
  filterContraindicated(techniques: string[], conditions: string[]): string[];
}

export class SessionGenerator {
  private safetyFilter?: SafetyFilter;

  constructor(safetyFilter?: SafetyFilter) {
    this.safetyFilter = safetyFilter;
  }

  /**
   * Generate a complete practice session.
   *
   * @param modules - Wings to include (defaults to ['breath'] if empty)
   * @param duration - Session duration: 5, 15, 30, or 60 minutes
   * @param conditions - Optional health conditions for safety filtering
   */
  generateSession(
    modules: MindBodyWingId[],
    duration: 5 | 15 | 30 | 60,
    conditions?: string[],
  ): GeneratedSession {
    // Default to breath if no modules provided
    const activeModules = modules.length > 0 ? [...modules] : ['breath' as MindBodyWingId];

    // Calculate time allocations
    const warmUpMinutes = Math.max(1, Math.round(duration * 0.175));
    const coolDownMinutes = Math.max(1, Math.round(duration * 0.225));
    const primaryMinutes = duration - warmUpMinutes - coolDownMinutes;

    // Generate warm-up (always breath-based)
    const warmUp = this.getWarmUp(activeModules, warmUpMinutes);

    // Generate cool-down (always relaxation-based)
    const coolDown = this.getCoolDown(activeModules, coolDownMinutes);

    // Generate primary segments -- distribute time across modules
    const segments = this.generatePrimarySegments(activeModules, primaryMinutes, conditions);

    return {
      warmUp,
      segments,
      coolDown,
      totalMinutes: duration,
      modules: activeModules,
    };
  }

  /**
   * Generate warm-up segment -- always breath-based with gentle movement.
   */
  getWarmUp(modules: MindBodyWingId[], durationMinutes: number): SessionSegment {
    let techniques = getWarmUpTechniques(durationMinutes);

    if (this.safetyFilter) {
      techniques = this.safetyFilter.filterContraindicated(techniques, []);
    }

    return {
      name: 'Warm-Up',
      description: 'Breath awareness and gentle movement to prepare body and mind',
      durationMinutes,
      module: 'breath',
      techniques,
    };
  }

  /**
   * Generate cool-down segment -- always relaxation-based with stretching.
   */
  getCoolDown(modules: MindBodyWingId[], durationMinutes: number): SessionSegment {
    let techniques = getCoolDownTechniques(durationMinutes);

    if (this.safetyFilter) {
      techniques = this.safetyFilter.filterContraindicated(techniques, []);
    }

    return {
      name: 'Cool-Down',
      description: 'Relaxation, stretching, and parasympathetic activation',
      durationMinutes,
      module: 'relaxation',
      techniques,
    };
  }

  /**
   * Generate primary practice segments, distributing time across modules.
   */
  private generatePrimarySegments(
    modules: MindBodyWingId[],
    totalMinutes: number,
    conditions?: string[],
  ): SessionSegment[] {
    const segments: SessionSegment[] = [];

    if (modules.length === 0) return segments;

    // Distribute time across modules
    const minutesPerModule = Math.max(1, Math.floor(totalMinutes / modules.length));
    let remainingMinutes = totalMinutes;

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const isLast = i === modules.length - 1;
      const segDuration = isLast ? remainingMinutes : minutesPerModule;

      if (segDuration <= 0) continue;

      let techniques = selectTechniques(mod, segDuration);

      // Apply safety filtering if conditions are present
      if (conditions && conditions.length > 0 && this.safetyFilter) {
        techniques = this.safetyFilter.filterContraindicated(techniques, conditions);
      }

      const info = MODULE_TECHNIQUES[mod];
      segments.push({
        name: info.name,
        description: info.description,
        durationMinutes: segDuration,
        module: mod,
        techniques,
      });

      remainingMinutes -= segDuration;
    }

    return segments;
  }
}
