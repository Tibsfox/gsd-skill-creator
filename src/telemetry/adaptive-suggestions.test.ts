import { describe, it, expect } from 'vitest';
import { AdaptiveSuggestions } from './adaptive-suggestions.js';
import type { PatternReport, SkillPatternEntry } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(skillName: string, overrides: Partial<SkillPatternEntry> = {}): SkillPatternEntry {
  return {
    skillName,
    sessionCount: 10,
    loadCount: 8,
    budgetSkipCount: 1,
    avgScore: 0.75,
    loadRate: 0.8,
    budgetSkipRate: 0.1,
    ...overrides,
  };
}

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

// ---------------------------------------------------------------------------
// buildPruneSuggestion
// ---------------------------------------------------------------------------

describe('AdaptiveSuggestions.buildPruneSuggestion()', () => {
  const suggestions = new AdaptiveSuggestions();

  it('returns no-candidates message when deadSkills is empty', () => {
    const result = suggestions.buildPruneSuggestion(makeReport());
    expect(result).toContain('No dead skill candidates');
    expect(typeof result).toBe('string');
  });

  it('no-candidates message includes session count', () => {
    const result = suggestions.buildPruneSuggestion(makeReport({ totalSessions: 45 }));
    expect(result).toContain('45');
  });

  it('lists dead skill by name when present', () => {
    const report = makeReport({
      totalSessions: 30,
      deadSkills: ['unused-skill'],
      analyzedSkills: [makeEntry('unused-skill', { loadCount: 3, budgetSkipCount: 0 })],
    });
    const result = suggestions.buildPruneSuggestion(report);
    expect(result).toContain('unused-skill');
  });

  it('includes evidence: 0 scored matches and session count', () => {
    const report = makeReport({
      totalSessions: 30,
      deadSkills: ['unused-skill'],
      analyzedSkills: [makeEntry('unused-skill')],
    });
    const result = suggestions.buildPruneSuggestion(report);
    expect(result).toContain('0 scored matches');
    expect(result).toContain('30');
  });

  it('includes load count and budget-skip count from analyzedSkills', () => {
    const report = makeReport({
      deadSkills: ['ghost'],
      analyzedSkills: [makeEntry('ghost', { loadCount: 7, budgetSkipCount: 2 })],
    });
    const result = suggestions.buildPruneSuggestion(report);
    expect(result).toContain('7');
    expect(result).toContain('2');
  });

  it('contains the no-changes confirmation warning', () => {
    const report = makeReport({
      deadSkills: ['skill-x'],
      analyzedSkills: [makeEntry('skill-x')],
    });
    const result = suggestions.buildPruneSuggestion(report);
    expect(result).toContain('No changes will be made until you confirm');
  });

  it('lists multiple dead skills numbered', () => {
    const report = makeReport({
      deadSkills: ['dead-a', 'dead-b', 'dead-c'],
      analyzedSkills: [
        makeEntry('dead-a'),
        makeEntry('dead-b'),
        makeEntry('dead-c'),
      ],
    });
    const result = suggestions.buildPruneSuggestion(report);
    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
    expect(result).toContain('dead-a');
    expect(result).toContain('dead-b');
    expect(result).toContain('dead-c');
  });

  it('does not crash when dead skill has no matching analyzedSkills entry', () => {
    const report = makeReport({
      deadSkills: ['orphan-skill'],
      analyzedSkills: [], // no entry for orphan-skill
    });
    // Should not throw
    const result = suggestions.buildPruneSuggestion(report);
    expect(result).toContain('orphan-skill');
  });
});

// ---------------------------------------------------------------------------
// buildPromoteSuggestion
// ---------------------------------------------------------------------------

describe('AdaptiveSuggestions.buildPromoteSuggestion()', () => {
  const suggestions = new AdaptiveSuggestions();

  it('returns no-candidates message when highValueSkills is empty', () => {
    const result = suggestions.buildPromoteSuggestion(makeReport());
    expect(result).toContain('No high-value skill candidates');
    expect(typeof result).toBe('string');
  });

  it('no-candidates message includes session count', () => {
    const result = suggestions.buildPromoteSuggestion(makeReport({ totalSessions: 50 }));
    expect(result).toContain('50');
  });

  it('lists high-value skill by name when present', () => {
    const report = makeReport({
      highValueSkills: ['star-skill'],
      analyzedSkills: [makeEntry('star-skill', { loadRate: 0.9, avgScore: 0.85 })],
    });
    const result = suggestions.buildPromoteSuggestion(report);
    expect(result).toContain('star-skill');
  });

  it('formats load rate as percentage (0.75 → "75.0%")', () => {
    const report = makeReport({
      highValueSkills: ['skill-a'],
      analyzedSkills: [makeEntry('skill-a', { loadRate: 0.75 })],
    });
    const result = suggestions.buildPromoteSuggestion(report);
    expect(result).toContain('75.0%');
  });

  it('formats avgScore to 2 decimal places', () => {
    const report = makeReport({
      highValueSkills: ['skill-a'],
      analyzedSkills: [makeEntry('skill-a', { avgScore: 0.8333 })],
    });
    const result = suggestions.buildPromoteSuggestion(report);
    expect(result).toContain('0.83');
  });

  it('includes session load count and total sessions', () => {
    const report = makeReport({
      totalSessions: 40,
      highValueSkills: ['skill-b'],
      analyzedSkills: [makeEntry('skill-b', { loadCount: 32 })],
    });
    const result = suggestions.buildPromoteSuggestion(report);
    expect(result).toContain('32');
    expect(result).toContain('40');
  });

  it('contains the no-changes confirmation warning', () => {
    const report = makeReport({
      highValueSkills: ['skill-x'],
      analyzedSkills: [makeEntry('skill-x')],
    });
    const result = suggestions.buildPromoteSuggestion(report);
    expect(result).toContain('No changes will be made until you confirm');
  });

  it('lists multiple high-value skills numbered', () => {
    const report = makeReport({
      highValueSkills: ['hv-1', 'hv-2', 'hv-3'],
      analyzedSkills: [makeEntry('hv-1'), makeEntry('hv-2'), makeEntry('hv-3')],
    });
    const result = suggestions.buildPromoteSuggestion(report);
    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
    expect(result).toContain('hv-1');
    expect(result).toContain('hv-2');
    expect(result).toContain('hv-3');
  });

  it('does not crash when high-value skill has no matching analyzedSkills entry', () => {
    const report = makeReport({
      highValueSkills: ['mystery-skill'],
      analyzedSkills: [],
    });
    const result = suggestions.buildPromoteSuggestion(report);
    expect(result).toContain('mystery-skill');
  });
});
