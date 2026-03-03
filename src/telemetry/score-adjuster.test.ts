import { describe, it, expect } from 'vitest';
import { ScoreAdjuster } from './score-adjuster.js';
import type { PatternReport } from './types.js';
import type { ScoredSkill } from '../types/application.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReport(overrides: Partial<PatternReport> = {}): PatternReport {
  return {
    type: 'report',
    totalSessions: 30,
    analyzedSkills: [],
    highValueSkills: [],
    deadSkills: [],
    budgetCasualties: [],
    correctionMagnets: [],
    scoreDriftSkills: [],
    loadNeverActivateSkills: [],
    ...overrides,
  };
}

function makeSkill(name: string, score: number, matchType: ScoredSkill['matchType'] = 'intent'): ScoredSkill {
  return { name, score, matchType };
}

// ---------------------------------------------------------------------------
// Default configuration (boostFactor=0.20, dampenFactor=0.20)
// ---------------------------------------------------------------------------

describe('ScoreAdjuster — default config (±20%)', () => {
  it('boosts high-value skill score by 20%', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('skill-a', 0.8)];
    const report = makeReport({ highValueSkills: ['skill-a'] });

    const result = adjuster.adjust(skills, report);

    expect(result[0].score).toBeCloseTo(0.96, 10);
  });

  it('dampens dead skill score by 20%', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('skill-b', 0.8)];
    const report = makeReport({ deadSkills: ['skill-b'] });

    const result = adjuster.adjust(skills, report);

    expect(result[0].score).toBeCloseTo(0.64, 10);
  });

  it('leaves unranked skill score unchanged (multiplier = 1.0)', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('skill-c', 0.7)];
    const report = makeReport();

    const result = adjuster.adjust(skills, report);

    expect(result[0].score).toBe(0.7);
  });

  it('clamps boosted high-value score to 1.0 when result would exceed 1.0', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('top-skill', 1.0)];
    const report = makeReport({ highValueSkills: ['top-skill'] });

    const result = adjuster.adjust(skills, report);

    expect(result[0].score).toBe(1.0);
  });

  it('dead skill at score 0.0 stays at 0.0 after dampening', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('zero-skill', 0.0)];
    const report = makeReport({ deadSkills: ['zero-skill'] });

    const result = adjuster.adjust(skills, report);

    expect(result[0].score).toBe(0.0);
  });

  it('empty skills array returns empty array', () => {
    const adjuster = new ScoreAdjuster();
    const result = adjuster.adjust([], makeReport({ highValueSkills: ['skill-a'] }));
    expect(result).toHaveLength(0);
  });

  it('empty report (no high-value or dead skills) leaves all scores unchanged', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('a', 0.5), makeSkill('b', 0.8), makeSkill('c', 0.3)];
    const result = adjuster.adjust(skills, makeReport());

    expect(result[0].score).toBe(0.5);
    expect(result[1].score).toBe(0.8);
    expect(result[2].score).toBe(0.3);
  });

  it('returns array of same length as input', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('a', 0.5), makeSkill('b', 0.8)];
    const result = adjuster.adjust(skills, makeReport({ highValueSkills: ['a'] }));
    expect(result).toHaveLength(2);
  });

  it('does NOT mutate the original skills array', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('skill-a', 0.8)];
    const originalScore = skills[0].score;
    const report = makeReport({ highValueSkills: ['skill-a'] });

    adjuster.adjust(skills, report);

    expect(skills[0].score).toBe(originalScore);
  });

  it('preserves matchType for adjusted skills', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [
      makeSkill('hv-skill', 0.6, 'file'),
      makeSkill('dead-skill', 0.5, 'context'),
      makeSkill('plain', 0.4, 'intent'),
    ];
    const report = makeReport({
      highValueSkills: ['hv-skill'],
      deadSkills: ['dead-skill'],
    });

    const result = adjuster.adjust(skills, report);

    expect(result[0].matchType).toBe('file');
    expect(result[1].matchType).toBe('context');
    expect(result[2].matchType).toBe('intent');
  });

  it('highValueSkills takes precedence when skill appears in both lists', () => {
    const adjuster = new ScoreAdjuster();
    const skills = [makeSkill('ambiguous', 0.8)];
    const report = makeReport({
      highValueSkills: ['ambiguous'],
      deadSkills: ['ambiguous'],
    });

    const result = adjuster.adjust(skills, report);

    // highValueSkills checked first → boost applied, not dampen
    expect(result[0].score).toBeCloseTo(0.96, 10);
  });
});

// ---------------------------------------------------------------------------
// Custom configuration
// ---------------------------------------------------------------------------

describe('ScoreAdjuster — custom config', () => {
  it('applies custom boostFactor=0.10 to high-value skills', () => {
    const adjuster = new ScoreAdjuster({ boostFactor: 0.10 });
    const skills = [makeSkill('skill-a', 0.8)];
    const report = makeReport({ highValueSkills: ['skill-a'] });

    const result = adjuster.adjust(skills, report);

    expect(result[0].score).toBeCloseTo(0.88, 10);
  });

  it('applies custom dampenFactor=0.05 to dead skills', () => {
    const adjuster = new ScoreAdjuster({ dampenFactor: 0.05 });
    const skills = [makeSkill('skill-b', 0.8)];
    const report = makeReport({ deadSkills: ['skill-b'] });

    const result = adjuster.adjust(skills, report);

    expect(result[0].score).toBeCloseTo(0.76, 10);
  });

  it('handles mixed skills with custom factors correctly', () => {
    const adjuster = new ScoreAdjuster({ boostFactor: 0.15, dampenFactor: 0.10 });
    const skills = [
      makeSkill('hv', 0.6),
      makeSkill('dead', 0.6),
      makeSkill('plain', 0.6),
    ];
    const report = makeReport({ highValueSkills: ['hv'], deadSkills: ['dead'] });

    const result = adjuster.adjust(skills, report);

    expect(result[0].score).toBeCloseTo(0.6 * 1.15, 10); // boosted
    expect(result[1].score).toBeCloseTo(0.6 * 0.90, 10); // dampened
    expect(result[2].score).toBe(0.6);                     // unchanged
  });
});
