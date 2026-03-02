/**
 * Tests for all 8 Mind-Body Try Sessions.
 *
 * Validates structure, accessibility, and content quality.
 * Every session must be completable by a first-timer with
 * zero experience, no equipment, and no special clothing.
 */

import { describe, it, expect } from 'vitest';
import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

import { allTrySessions } from './index.js';
import { firstFiveMinutes } from './first-five-minutes.js';
import { meditationOneMinute } from './meditation-one-minute.js';
import { yogaFivePoses } from './yoga-five-poses.js';
import { pilatesBreath } from './pilates-breath.js';
import { horseStance } from './horse-stance.js';
import { taiChiCommencement } from './tai-chi-commencement.js';
import { threeMinuteReset } from './three-minute-reset.js';
import { teaMeditation } from './tea-meditation.js';

// ─── Equipment / jargon detection ────────────────────────────────────────────

const EQUIPMENT_WORDS = [
  'mat required',
  'yoga mat',
  'dumbbell',
  'weights',
  'weight plate',
  'resistance band',
  'yoga block',
  'strap',
  'bolster',
  'foam roller',
  'equipment required',
  'you will need',
  'you need a',
];

const UNEXPLAINED_JARGON = [
  /\bpranayama\b(?![^(]*\))/i,
  /\basana\b(?![^(]*\))/i,
  /\bchakra\b(?![^(]*\))/i,
  /\bnamaste\b(?![^(]*\))/i,
  /\bdantian\b(?![^(]*\))/i,
  /\bmeridian\b(?![^(]*\))/i,
];

function getFullText(session: TrySessionDefinition): string {
  const parts = [session.title, session.description];
  for (const step of session.steps) {
    parts.push(step.instruction, step.expectedOutcome);
    if (step.hint) parts.push(step.hint);
  }
  return parts.join(' ');
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Mind-Body Try Sessions', () => {
  describe('allTrySessions barrel export', () => {
    it('contains exactly 8 sessions', () => {
      expect(allTrySessions).toHaveLength(8);
    });

    it('contains all 8 named sessions', () => {
      const ids = allTrySessions.map((s) => s.id);
      expect(ids).toContain('mb-try-first-five-minutes');
      expect(ids).toContain('mb-try-meditation-one-minute');
      expect(ids).toContain('mb-try-yoga-five-poses');
      expect(ids).toContain('mb-try-pilates-breath');
      expect(ids).toContain('mb-try-horse-stance');
      expect(ids).toContain('mb-try-tai-chi-commencement');
      expect(ids).toContain('mb-try-three-minute-reset');
      expect(ids).toContain('mb-try-tea-meditation');
    });

    it('has no duplicate IDs', () => {
      const ids = allTrySessions.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('structural validity', () => {
    it.each(allTrySessions.map((s) => [s.title, s]))(
      '%s has a valid TrySessionDefinition structure',
      (_title, session) => {
        const s = session as TrySessionDefinition;
        expect(s.id).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.description).toBeTruthy();
        expect(s.estimatedMinutes).toBeGreaterThan(0);
        expect(s.estimatedMinutes).toBeLessThanOrEqual(15);
        expect(Array.isArray(s.prerequisites)).toBe(true);
        expect(Array.isArray(s.steps)).toBe(true);
      },
    );

    it.each(allTrySessions.map((s) => [s.title, s]))(
      '%s has at least 3 steps',
      (_title, session) => {
        expect((session as TrySessionDefinition).steps.length).toBeGreaterThanOrEqual(3);
      },
    );

    it.each(allTrySessions.map((s) => [s.title, s]))(
      '%s has no more than 6 steps',
      (_title, session) => {
        expect((session as TrySessionDefinition).steps.length).toBeLessThanOrEqual(6);
      },
    );
  });

  describe('step quality', () => {
    it.each(allTrySessions.map((s) => [s.title, s]))(
      '%s -- every step has clear instruction text',
      (_title, session) => {
        for (const step of (session as TrySessionDefinition).steps) {
          expect(step.instruction.length).toBeGreaterThan(20);
          expect(step.expectedOutcome.length).toBeGreaterThan(10);
          expect(step.conceptsExplored.length).toBeGreaterThan(0);
        }
      },
    );
  });

  describe('accessibility -- no equipment required', () => {
    it.each(allTrySessions.map((s) => [s.title, s]))(
      '%s does not assume equipment',
      (_title, session) => {
        const text = getFullText(session as TrySessionDefinition).toLowerCase();
        for (const eqWord of EQUIPMENT_WORDS) {
          expect(text).not.toContain(eqWord);
        }
      },
    );

    it.each(allTrySessions.map((s) => [s.title, s]))(
      '%s has no prerequisites',
      (_title, session) => {
        expect((session as TrySessionDefinition).prerequisites).toHaveLength(0);
      },
    );
  });

  describe('accessibility -- no unexplained jargon', () => {
    it.each(allTrySessions.map((s) => [s.title, s]))(
      '%s does not use unexplained jargon',
      (_title, session) => {
        const text = getFullText(session as TrySessionDefinition);
        for (const pattern of UNEXPLAINED_JARGON) {
          expect(text).not.toMatch(pattern);
        }
      },
    );
  });

  describe('ID format', () => {
    it.each(allTrySessions.map((s) => [s.title, s]))(
      '%s follows mb-try-{name} pattern',
      (_title, session) => {
        expect((session as TrySessionDefinition).id).toMatch(/^mb-try-[a-z][a-z0-9-]+$/);
      },
    );
  });

  describe('individual session spot checks', () => {
    it('firstFiveMinutes covers diaphragmatic breathing', () => {
      const concepts = firstFiveMinutes.steps.flatMap((s) => s.conceptsExplored);
      expect(concepts).toContain('mb-breath-diaphragmatic');
    });

    it('meditationOneMinute is estimated at 1 minute', () => {
      expect(meditationOneMinute.estimatedMinutes).toBe(1);
    });

    it('yogaFivePoses has exactly 5 steps for 5 poses', () => {
      expect(yogaFivePoses.steps).toHaveLength(5);
    });

    it('pilatesBreath covers the powerhouse concept', () => {
      const concepts = pilatesBreath.steps.flatMap((s) => s.conceptsExplored);
      expect(concepts).toContain('mb-pilates-powerhouse');
    });

    it('horseStance references martial arts history', () => {
      const concepts = horseStance.steps.flatMap((s) => s.conceptsExplored);
      expect(concepts).toContain('mb-ma-horse-stance');
    });

    it('taiChiCommencement covers yin-yang principle', () => {
      const concepts = taiChiCommencement.steps.flatMap((s) => s.conceptsExplored);
      expect(concepts).toContain('mb-tc-yin-yang');
    });

    it('threeMinuteReset covers nervous system regulation', () => {
      const concepts = threeMinuteReset.steps.flatMap((s) => s.conceptsExplored);
      expect(concepts).toContain('mb-relax-nervous-system');
    });

    it('teaMeditation covers zen philosophy', () => {
      const concepts = teaMeditation.steps.flatMap((s) => s.conceptsExplored);
      expect(concepts).toContain('mb-phil-zen');
    });
  });
});
