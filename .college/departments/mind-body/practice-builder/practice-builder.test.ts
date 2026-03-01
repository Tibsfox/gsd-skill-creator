/**
 * Practice Builder -- comprehensive test suite.
 *
 * Tests for session generator, session templates, and progressive structure.
 * Minimum 25 tests covering all module combinations, time templates,
 * progressive phases, and edge cases.
 *
 * @module departments/mind-body/practice-builder/practice-builder.test
 */

import { describe, it, expect } from 'vitest';
import type { MindBodyWingId } from '../types.js';
import { SessionGenerator } from './session-generator.js';
import type { GeneratedSession } from './session-generator.js';
import {
  microTemplate,
  morningTemplate,
  fullTemplate,
  deepTemplate,
  allTemplates,
} from './session-templates.js';
import type { Template } from './session-templates.js';
import {
  foundationPhase,
  expansionPhase,
  integrationPhase,
  personalizationPhase,
  allPhases,
  getPhaseForWeek,
  getRecommendedModules,
} from './progressive-structure.js';

// ─── Session Generator Tests ────────────────────────────────────────────────

describe('SessionGenerator', () => {
  const generator = new SessionGenerator();

  it('generates valid session for single module (breath only)', () => {
    const session = generator.generateSession(['breath'], 15);
    expect(session.modules).toEqual(['breath']);
    expect(session.warmUp).toBeDefined();
    expect(session.coolDown).toBeDefined();
    expect(session.segments.length).toBeGreaterThanOrEqual(1);
    expect(session.totalMinutes).toBe(15);
  });

  it('generates valid session for all 8 modules combined', () => {
    const allModules: MindBodyWingId[] = [
      'breath', 'meditation', 'yoga', 'pilates',
      'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
    ];
    const session = generator.generateSession(allModules, 60);
    expect(session.modules).toHaveLength(8);
    expect(session.segments.length).toBeGreaterThanOrEqual(1);
    expect(session.totalMinutes).toBe(60);
  });

  it('5-min session has warm-up and cool-down', () => {
    const session = generator.generateSession(['breath'], 5);
    expect(session.warmUp).toBeDefined();
    expect(session.warmUp.durationMinutes).toBeGreaterThanOrEqual(1);
    expect(session.coolDown).toBeDefined();
    expect(session.coolDown.durationMinutes).toBeGreaterThanOrEqual(1);
  });

  it('60-min session has proportional warm-up and cool-down', () => {
    const session = generator.generateSession(['yoga', 'meditation'], 60);
    // Warm-up should be ~15-20% of 60 = 9-12 minutes
    expect(session.warmUp.durationMinutes).toBeGreaterThanOrEqual(9);
    expect(session.warmUp.durationMinutes).toBeLessThanOrEqual(15);
    // Cool-down should be ~20-25% of 60 = 12-15 minutes
    expect(session.coolDown.durationMinutes).toBeGreaterThanOrEqual(10);
    expect(session.coolDown.durationMinutes).toBeLessThanOrEqual(18);
  });

  it('session with no modules defaults to breath', () => {
    const session = generator.generateSession([], 15);
    expect(session.modules).toEqual(['breath']);
    expect(session.segments[0].module).toBe('breath');
  });

  it('total minutes of segments match requested duration (within 1 min tolerance)', () => {
    const durations: Array<5 | 15 | 30 | 60> = [5, 15, 30, 60];

    for (const duration of durations) {
      const session = generator.generateSession(['yoga', 'breath'], duration);
      const segmentSum =
        session.warmUp.durationMinutes +
        session.segments.reduce((sum, s) => sum + s.durationMinutes, 0) +
        session.coolDown.durationMinutes;

      expect(Math.abs(segmentSum - duration)).toBeLessThanOrEqual(1);
    }
  });

  it('every generated session has non-empty warmUp and coolDown', () => {
    const modules: MindBodyWingId[] = ['meditation', 'yoga', 'pilates'];
    const durations: Array<5 | 15 | 30 | 60> = [5, 15, 30, 60];

    for (const duration of durations) {
      const session = generator.generateSession(modules, duration);
      expect(session.warmUp.techniques.length).toBeGreaterThan(0);
      expect(session.coolDown.techniques.length).toBeGreaterThan(0);
      expect(session.warmUp.name).toBe('Warm-Up');
      expect(session.coolDown.name).toBe('Cool-Down');
    }
  });

  it('warm-up is always breath-based', () => {
    const session = generator.generateSession(['yoga', 'pilates'], 30);
    expect(session.warmUp.module).toBe('breath');
  });

  it('cool-down is always relaxation-based', () => {
    const session = generator.generateSession(['martial-arts', 'tai-chi'], 30);
    expect(session.coolDown.module).toBe('relaxation');
  });

  it('handles single module at each duration', () => {
    const modules: MindBodyWingId[] = [
      'breath', 'meditation', 'yoga', 'pilates',
      'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
    ];

    for (const mod of modules) {
      const session = generator.generateSession([mod], 15);
      expect(session.totalMinutes).toBe(15);
      expect(session.modules).toContain(mod);
    }
  });

  it('getWarmUp returns segment with breath techniques', () => {
    const warmUp = generator.getWarmUp(['yoga'], 5);
    expect(warmUp.module).toBe('breath');
    expect(warmUp.durationMinutes).toBe(5);
    expect(warmUp.techniques.length).toBeGreaterThan(0);
    expect(warmUp.techniques).toContain('Diaphragmatic breathing');
  });

  it('getCoolDown returns segment with relaxation techniques', () => {
    const coolDown = generator.getCoolDown(['yoga'], 5);
    expect(coolDown.module).toBe('relaxation');
    expect(coolDown.durationMinutes).toBe(5);
    expect(coolDown.techniques.length).toBeGreaterThan(0);
  });

  it('works without safety filter (optional integration)', () => {
    // No safety filter provided -- should work fine
    const gen = new SessionGenerator();
    const session = gen.generateSession(['yoga'], 30, ['knee-injury']);
    expect(session.totalMinutes).toBe(30);
    // Without safety filter, conditions are passed but not filtered
    expect(session.segments.length).toBeGreaterThanOrEqual(1);
  });

  it('uses safety filter when provided', () => {
    const mockFilter = {
      filterContraindicated: (techniques: string[], _conditions: string[]) =>
        techniques.filter(t => t !== 'Headstand'),
    };
    const gen = new SessionGenerator(mockFilter);
    const session = gen.generateSession(['yoga'], 30, ['neck-injury']);
    expect(session.totalMinutes).toBe(30);
  });
});

// ─── Template Tests ─────────────────────────────────────────────────────────

describe('Session Templates', () => {
  it('all 4 templates have valid structure', () => {
    for (const template of allTemplates) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.durationMinutes).toBeGreaterThan(0);
      expect(template.structure.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('microTemplate.durationMinutes === 5', () => {
    expect(microTemplate.durationMinutes).toBe(5);
  });

  it('morningTemplate.durationMinutes === 15', () => {
    expect(morningTemplate.durationMinutes).toBe(15);
  });

  it('fullTemplate.durationMinutes === 30', () => {
    expect(fullTemplate.durationMinutes).toBe(30);
  });

  it('deepTemplate.durationMinutes === 60', () => {
    expect(deepTemplate.durationMinutes).toBe(60);
  });

  it('each template segments sum to template duration', () => {
    for (const template of allTemplates) {
      const sum = template.structure.reduce((acc, seg) => acc + seg.durationMinutes, 0);
      expect(sum).toBe(template.durationMinutes);
    }
  });

  it('allTemplates has exactly 4 entries', () => {
    expect(allTemplates).toHaveLength(4);
  });

  it('templates are ordered by ascending duration', () => {
    for (let i = 1; i < allTemplates.length; i++) {
      expect(allTemplates[i].durationMinutes).toBeGreaterThan(
        allTemplates[i - 1].durationMinutes,
      );
    }
  });

  it('each template has a unique ID', () => {
    const ids = allTemplates.map(t => t.id);
    expect(new Set(ids).size).toBe(allTemplates.length);
  });

  it('deep template includes all 5 segment types', () => {
    const types = deepTemplate.structure.map(s => s.type);
    expect(types).toContain('warmup');
    expect(types).toContain('primary');
    expect(types).toContain('secondary');
    expect(types).toContain('cooldown');
    expect(types).toContain('meditation');
  });
});

// ─── Progressive Structure Tests ────────────────────────────────────────────

describe('Progressive Structure', () => {
  it('week 1 returns foundationPhase', () => {
    expect(getPhaseForWeek(1)).toBe(foundationPhase);
  });

  it('week 2 returns foundationPhase', () => {
    expect(getPhaseForWeek(2)).toBe(foundationPhase);
  });

  it('week 3 returns expansionPhase', () => {
    expect(getPhaseForWeek(3)).toBe(expansionPhase);
  });

  it('week 6 returns integrationPhase', () => {
    expect(getPhaseForWeek(6)).toBe(integrationPhase);
  });

  it('week 10 returns personalizationPhase', () => {
    expect(getPhaseForWeek(10)).toBe(personalizationPhase);
  });

  it('week 100 returns personalizationPhase', () => {
    expect(getPhaseForWeek(100)).toBe(personalizationPhase);
  });

  it('foundation allows only breath (1 module)', () => {
    expect(foundationPhase.modules).toBe(1);
    const modules = getRecommendedModules(1, ['yoga', 'meditation']);
    expect(modules).toEqual(['breath']);
  });

  it('expansion allows breath + 1 more (2 modules)', () => {
    expect(expansionPhase.modules).toBe(2);
    const modules = getRecommendedModules(3, ['yoga', 'meditation']);
    expect(modules).toEqual(['breath', 'yoga']);
  });

  it('integration allows breath + 2 more (3 modules)', () => {
    expect(integrationPhase.modules).toBe(3);
    const modules = getRecommendedModules(5, ['yoga', 'meditation', 'pilates']);
    expect(modules).toEqual(['breath', 'yoga', 'meditation']);
  });

  it('personalization allows any combination (8 modules)', () => {
    expect(personalizationPhase.modules).toBe(8);
    const allPrefs: MindBodyWingId[] = [
      'meditation', 'yoga', 'pilates', 'martial-arts',
      'tai-chi', 'relaxation', 'philosophy',
    ];
    const modules = getRecommendedModules(10, allPrefs);
    // breath + up to 7 preferences = 8
    expect(modules.length).toBe(8);
    expect(modules[0]).toBe('breath');
  });

  it('allPhases has exactly 4 entries', () => {
    expect(allPhases).toHaveLength(4);
  });

  it('phases cover all weeks with no gaps', () => {
    // Foundation: 1-2, Expansion: 3-4, Integration: 5-8, Personalization: 9+
    expect(allPhases[0].weekRange[0]).toBe(1);
    expect(allPhases[0].weekRange[1]).toBe(2);
    expect(allPhases[1].weekRange[0]).toBe(3);
    expect(allPhases[1].weekRange[1]).toBe(4);
    expect(allPhases[2].weekRange[0]).toBe(5);
    expect(allPhases[2].weekRange[1]).toBe(8);
    expect(allPhases[3].weekRange[0]).toBe(9);
    expect(allPhases[3].weekRange[1]).toBe(Infinity);
  });

  it('getRecommendedModules always includes breath', () => {
    for (let week = 1; week <= 20; week++) {
      const modules = getRecommendedModules(week, ['yoga', 'meditation']);
      expect(modules[0]).toBe('breath');
    }
  });

  it('getRecommendedModules excludes breath from user preferences to avoid duplication', () => {
    const modules = getRecommendedModules(5, ['breath', 'yoga', 'meditation']);
    // Should be ['breath', 'yoga', 'meditation'] -- breath only once
    const breathCount = modules.filter(m => m === 'breath').length;
    expect(breathCount).toBe(1);
  });

  it('each phase has non-empty name, description, and guidance', () => {
    for (const phase of allPhases) {
      expect(phase.name.length).toBeGreaterThan(0);
      expect(phase.description.length).toBeGreaterThan(0);
      expect(phase.guidance.length).toBeGreaterThan(0);
    }
  });

  it('clamping: week 0 or negative returns foundationPhase', () => {
    expect(getPhaseForWeek(0)).toBe(foundationPhase);
    expect(getPhaseForWeek(-5)).toBe(foundationPhase);
  });
});
