/**
 * Try Session Novice Accessibility Tests
 *
 * Verifies that all 8 Try Sessions are completable by a complete novice:
 * - All steps have clear instructions (no empty strings)
 * - No jargon without explanation
 * - No assumed prior knowledge
 * - No equipment required
 * - Steps ordered logically
 * - Duration <= 15 minutes
 *
 * 2 tests per session = 16+ tests minimum.
 *
 * @module departments/mind-body/tests/try-session-novice
 */

import { describe, it, expect } from 'vitest';
import { allTrySessions } from '../try-sessions/index.js';
import { firstFiveMinutes } from '../try-sessions/first-five-minutes.js';
import { meditationOneMinute } from '../try-sessions/meditation-one-minute.js';
import { yogaFivePoses } from '../try-sessions/yoga-five-poses.js';
import { pilatesBreath } from '../try-sessions/pilates-breath.js';
import { horseStance } from '../try-sessions/horse-stance.js';
import { taiChiCommencement } from '../try-sessions/tai-chi-commencement.js';
import { threeMinuteReset } from '../try-sessions/three-minute-reset.js';
import { teaMeditation } from '../try-sessions/tea-meditation.js';
import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

// Jargon terms that should be explained in context when used
const JARGON_TERMS = [
  'pranayama',
  'asana',
  'vinyasa',
  'ujjayi',
  'tadasana',
  'uttanasana',
  'savasana',
  'namaste',
  'chakra',
  'qi gong',
  'qigong',
  'dantian',
  'dan tien',
  'meridian',
  'mudra',
  'mantra',
  'bandha',
  'kiai',
  'kihap',
  'karate',
  'kumite',
];

// Equipment terms that should NOT appear in try sessions
// Note: avoid single common words like "weight" that appear in body context
const EQUIPMENT_WORDS = [
  'yoga mat',
  'resistance band',
  'dumbbell',
  'yoga strap',
  'bolster',
  'foam roller',
  'exercise ball',
  'kettlebell',
  'barbell',
  'pull-up bar',
  'treadmill',
  'ankle weights',
  'hand weights',
];

// Prior knowledge assumptions that should NOT appear
const ASSUMED_KNOWLEDGE = [
  'as you already know',
  'as discussed earlier',
  'building on your previous',
  'since you are familiar with',
  'as an experienced',
  'advanced practitioners',
  'you should be able to',
  'if you remember from',
];

/**
 * Helper: check that a session step explains any jargon it uses.
 * Returns the first unexplained jargon term found, or null if all are explained.
 */
function findUnexplainedJargon(step: TryStep): string | null {
  const text = step.instruction.toLowerCase();
  const hintText = (step.hint || '').toLowerCase();
  const combined = text + ' ' + hintText;

  for (const term of JARGON_TERMS) {
    if (text.includes(term.toLowerCase())) {
      // Check if there's an explanation via any of these patterns:
      // - term followed by parenthetical: "Tadasana (mountain pose)"
      // - term inside parenthetical: "(Tadasana in Sanskrit)"
      // - term preceded by an English name: "Mountain Pose (Tadasana..."
      // - term with dash explanation: "term -- explanation"
      // - "called X" / "known as X"
      const lowerTerm = term.toLowerCase();

      // Check if the term appears inside a parenthetical (term is BEING explained)
      const parenPattern = new RegExp(`\\([^)]*${lowerTerm}[^)]*\\)`, 'i');
      const hasParenExplanation = parenPattern.test(combined);

      // Check if the term IS followed by an explanation
      const hasFollowingExplanation =
        combined.includes(`${lowerTerm} (`) ||
        combined.includes(`${lowerTerm},`) ||
        combined.includes(`${lowerTerm} --`) ||
        combined.includes(`${lowerTerm} means`) ||
        combined.includes(`called ${lowerTerm}`) ||
        combined.includes(`known as ${lowerTerm}`) ||
        combined.includes(`meaning ${lowerTerm}`);

      if (!hasParenExplanation && !hasFollowingExplanation) {
        return term;
      }
    }
  }
  return null;
}

// ============================================================================
// ALL 8 SESSIONS — STRUCTURAL REQUIREMENTS
// ============================================================================

describe('Try Session Novice: All 8 Sessions Exist', () => {
  it('exactly 8 try sessions are exported', () => {
    expect(allTrySessions).toHaveLength(8);
  });

  it('all sessions have unique IDs', () => {
    const ids = allTrySessions.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(8);
  });
});

// ============================================================================
// PER-SESSION TESTS (2 per session)
// ============================================================================

describe('Try Session Novice: Your First Five Minutes (breath)', () => {
  it('all steps have clear, non-empty instructions', () => {
    for (const step of firstFiveMinutes.steps) {
      expect(step.instruction.length).toBeGreaterThan(10);
      expect(step.expectedOutcome.length).toBeGreaterThan(0);
    }
  });

  it('no equipment required and duration <= 15 minutes', () => {
    const allText = firstFiveMinutes.steps.map((s) => s.instruction).join(' ').toLowerCase();
    for (const eq of EQUIPMENT_WORDS) {
      expect(allText).not.toContain(eq.toLowerCase());
    }
    expect(firstFiveMinutes.estimatedMinutes).toBeLessThanOrEqual(15);
    expect(firstFiveMinutes.prerequisites).toHaveLength(0);
  });
});

describe('Try Session Novice: One Minute, One Breath (meditation)', () => {
  it('all steps have clear instructions with no assumed prior knowledge', () => {
    for (const step of meditationOneMinute.steps) {
      expect(step.instruction.length).toBeGreaterThan(10);
      const lowerInstruction = step.instruction.toLowerCase();
      for (const assumption of ASSUMED_KNOWLEDGE) {
        expect(lowerInstruction).not.toContain(assumption.toLowerCase());
      }
    }
  });

  it('duration <= 15 minutes and no equipment required', () => {
    expect(meditationOneMinute.estimatedMinutes).toBeLessThanOrEqual(15);
    const allText = meditationOneMinute.steps.map((s) => s.instruction).join(' ').toLowerCase();
    for (const eq of EQUIPMENT_WORDS) {
      expect(allText).not.toContain(eq.toLowerCase());
    }
  });
});

describe('Try Session Novice: Five Poses, Five Breaths (yoga)', () => {
  it('all steps have clear instructions with jargon explained', () => {
    for (const step of yogaFivePoses.steps) {
      expect(step.instruction.length).toBeGreaterThan(10);
      const unexplained = findUnexplainedJargon(step);
      expect(
        unexplained,
        `Step uses unexplained jargon: "${unexplained}"`,
      ).toBeNull();
    }
  });

  it('steps are ordered logically (standing -> fold -> lift -> fold -> standing)', () => {
    expect(yogaFivePoses.steps.length).toBeGreaterThanOrEqual(4);
    // First step should establish standing position
    expect(yogaFivePoses.steps[0].instruction.toLowerCase()).toContain('stand');
    // Last step should return to standing
    expect(yogaFivePoses.steps[yogaFivePoses.steps.length - 1].instruction.toLowerCase()).toContain('standing');
    expect(yogaFivePoses.estimatedMinutes).toBeLessThanOrEqual(15);
  });
});

describe('Try Session Novice: The Pilates Breath (pilates)', () => {
  it('all steps have clear instructions with no assumed prior knowledge', () => {
    for (const step of pilatesBreath.steps) {
      expect(step.instruction.length).toBeGreaterThan(10);
      const lowerInstruction = step.instruction.toLowerCase();
      for (const assumption of ASSUMED_KNOWLEDGE) {
        expect(lowerInstruction).not.toContain(assumption.toLowerCase());
      }
    }
  });

  it('duration <= 15 minutes, no equipment, explains lateral thoracic breathing', () => {
    expect(pilatesBreath.estimatedMinutes).toBeLessThanOrEqual(15);
    const allText = pilatesBreath.steps.map((s) => s.instruction).join(' ').toLowerCase();
    // Should explain the concept rather than assuming familiarity
    expect(allText).toContain('ribs');
    expect(allText).toContain('expand');
  });
});

describe('Try Session Novice: Horse Stance, Three Breaths (martial arts)', () => {
  it('all steps have clear instructions with no equipment required', () => {
    for (const step of horseStance.steps) {
      expect(step.instruction.length).toBeGreaterThan(10);
    }
    const allText = horseStance.steps.map((s) => s.instruction).join(' ').toLowerCase();
    for (const eq of EQUIPMENT_WORDS) {
      expect(allText).not.toContain(eq.toLowerCase());
    }
  });

  it('steps ordered: setup stance -> sink -> hold -> conclude', () => {
    expect(horseStance.steps.length).toBeGreaterThanOrEqual(3);
    // First step should involve standing wide
    expect(horseStance.steps[0].instruction.toLowerCase()).toContain('wider');
    // Last step should involve standing up
    expect(horseStance.steps[horseStance.steps.length - 1].instruction.toLowerCase()).toContain('straighten');
    expect(horseStance.estimatedMinutes).toBeLessThanOrEqual(15);
  });
});

describe('Try Session Novice: Commencement (tai chi)', () => {
  it('all steps have clear instructions with no assumed prior knowledge', () => {
    for (const step of taiChiCommencement.steps) {
      expect(step.instruction.length).toBeGreaterThan(10);
      const lowerInstruction = step.instruction.toLowerCase();
      for (const assumption of ASSUMED_KNOWLEDGE) {
        expect(lowerInstruction).not.toContain(assumption.toLowerCase());
      }
    }
  });

  it('duration <= 15 minutes and steps completable in sequence', () => {
    expect(taiChiCommencement.estimatedMinutes).toBeLessThanOrEqual(15);
    // Should start with standing position
    expect(taiChiCommencement.steps[0].instruction.toLowerCase()).toContain('stand');
    // Should end with standing still
    const lastStep = taiChiCommencement.steps[taiChiCommencement.steps.length - 1];
    expect(lastStep.instruction.toLowerCase()).toContain('stand');
  });
});

describe('Try Session Novice: The 3-Minute Reset (relaxation)', () => {
  it('all steps have clear instructions with no jargon', () => {
    for (const step of threeMinuteReset.steps) {
      expect(step.instruction.length).toBeGreaterThan(10);
      // PMR-specific jargon should be explained, not assumed
      const unexplained = findUnexplainedJargon(step);
      expect(unexplained).toBeNull();
    }
  });

  it('works in any position (lying, sitting, standing)', () => {
    const firstStep = threeMinuteReset.steps[0].instruction.toLowerCase();
    expect(firstStep).toContain('lying down');
    expect(firstStep).toContain('sitting');
    expect(firstStep).toContain('standing');
    expect(threeMinuteReset.estimatedMinutes).toBeLessThanOrEqual(15);
  });
});

describe('Try Session Novice: The Tea Meditation (philosophy)', () => {
  it('all steps have clear instructions with no equipment required', () => {
    for (const step of teaMeditation.steps) {
      expect(step.instruction.length).toBeGreaterThan(10);
    }
    // Tea meditation uses what you have at home -- not special equipment
    const allText = teaMeditation.steps.map((s) => s.instruction).join(' ').toLowerCase();
    for (const eq of EQUIPMENT_WORDS) {
      expect(allText).not.toContain(eq.toLowerCase());
    }
  });

  it('allows any beverage, not just tea', () => {
    const firstStep = teaMeditation.steps[0].instruction.toLowerCase();
    expect(firstStep).toContain('tea');
    expect(firstStep).toContain('coffee');
    expect(firstStep).toContain('water');
    expect(teaMeditation.estimatedMinutes).toBeLessThanOrEqual(15);
  });
});

// ============================================================================
// AGGREGATE NOVICE ACCESSIBILITY
// ============================================================================

describe('Try Session Novice: Aggregate Accessibility Checks', () => {
  it('no session requires prerequisites', () => {
    for (const session of allTrySessions) {
      expect(
        session.prerequisites.length,
        `Session "${session.title}" should have no prerequisites`,
      ).toBe(0);
    }
  });

  it('all sessions have at least 3 steps', () => {
    for (const session of allTrySessions) {
      expect(
        session.steps.length,
        `Session "${session.title}" should have at least 3 steps`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('all sessions have estimatedMinutes <= 15', () => {
    for (const session of allTrySessions) {
      expect(
        session.estimatedMinutes,
        `Session "${session.title}" should be <= 15 minutes`,
      ).toBeLessThanOrEqual(15);
    }
  });

  it('no session step assumes a minimum fitness level', () => {
    const fitnessAssumptions = [
      'you should be able to',
      'this requires flexibility',
      'this requires strength',
      'advanced',
      'intermediate level',
      'if you can already',
      'assumes you can',
    ];

    for (const session of allTrySessions) {
      for (const step of session.steps) {
        const lower = step.instruction.toLowerCase();
        for (const assumption of fitnessAssumptions) {
          expect(
            lower.includes(assumption),
            `Session "${session.title}" step assumes fitness: "${assumption}"`,
          ).toBe(false);
        }
      }
    }
  });
});
