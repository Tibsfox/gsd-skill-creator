/**
 * Tests for HealthFormatter.
 *
 * Covers:
 * - Terminal format includes skill name, all metric columns
 * - Terminal format shows N/A for null precision
 * - Terminal format shows FLAGGED indicator for flagged skills
 * - JSON format returns valid JSON with all fields
 * - Terminal format for multiple skills shows tabular layout
 */

import { describe, it, expect } from 'vitest';
import { HealthFormatter } from './health-formatter.js';
import type { HealthScore } from '../types/evaluator.js';

function makeHealthScore(overrides: Partial<HealthScore> = {}): HealthScore {
  return {
    skillName: 'test-skill',
    precision: 0.85,
    successRate: 0.75,
    tokenEfficiency: 0.80,
    staleness: 10,
    overallScore: 78,
    flagged: false,
    suggestions: [],
    ...overrides,
  };
}

describe('HealthFormatter', () => {
  const formatter = new HealthFormatter();

  it('terminal format includes skill name, all metric columns', () => {
    const score = makeHealthScore();
    const output = formatter.formatTerminal([score]);

    expect(output).toContain('test-skill');
    expect(output).toContain('85.0%');  // precision
    expect(output).toContain('75.0%');  // success rate
    expect(output).toContain('80%');    // token efficiency
    expect(output).toContain('10d');    // staleness
    expect(output).toContain('78');     // overall score
    expect(output).not.toContain('FLAGGED');
  });

  it('terminal format shows N/A for null precision', () => {
    const score = makeHealthScore({ precision: null });
    const output = formatter.formatTerminal([score]);

    expect(output).toContain('N/A');
  });

  it('terminal format shows FLAGGED indicator for flagged skills', () => {
    const score = makeHealthScore({
      flagged: true,
      overallScore: 30,
      suggestions: ['Precision is low. Consider refining description.'],
    });
    const output = formatter.formatTerminal([score], { verbose: true });

    expect(output).toContain('FLAGGED');
    expect(output).toContain('Precision is low');
  });

  it('JSON format returns valid JSON with all fields', () => {
    const scores = [
      makeHealthScore(),
      makeHealthScore({ skillName: 'other-skill', precision: null }),
    ];

    const jsonStr = formatter.formatJSON(scores);
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveProperty('skills');
    expect(parsed).toHaveProperty('summary');
    expect(parsed.skills).toHaveLength(2);
    expect(parsed.skills[0]).toHaveProperty('skillName');
    expect(parsed.skills[0]).toHaveProperty('precision');
    expect(parsed.skills[0]).toHaveProperty('successRate');
    expect(parsed.skills[0]).toHaveProperty('tokenEfficiency');
    expect(parsed.skills[0]).toHaveProperty('staleness');
    expect(parsed.skills[0]).toHaveProperty('overallScore');
    expect(parsed.summary).toHaveProperty('total');
    expect(parsed.summary).toHaveProperty('flagged');
    expect(parsed.summary).toHaveProperty('averageScore');
  });

  it('terminal format for multiple skills shows tabular layout', () => {
    const scores = [
      makeHealthScore({ skillName: 'alpha' }),
      makeHealthScore({ skillName: 'beta' }),
      makeHealthScore({ skillName: 'gamma' }),
    ];

    const output = formatter.formatTerminal(scores);

    // Should have header row
    expect(output).toContain('Skill');
    expect(output).toContain('Precision');
    expect(output).toContain('Success');

    // Should have all 3 skill names
    expect(output).toContain('alpha');
    expect(output).toContain('beta');
    expect(output).toContain('gamma');
  });

  it('formatSingle shows detailed single-skill view', () => {
    const score = makeHealthScore({
      flagged: true,
      suggestions: ['Run test generate to create test cases.'],
    });

    const output = formatter.formatSingle(score);

    expect(output).toContain('test-skill');
    expect(output).toContain('85.0%');
    expect(output).toContain('Run test generate');
  });

  it('terminal format shows summary footer with counts', () => {
    const scores = [
      makeHealthScore({ skillName: 'ok-skill', flagged: false }),
      makeHealthScore({ skillName: 'bad-skill', flagged: true }),
    ];

    const output = formatter.formatTerminal(scores);

    expect(output).toContain('2 skills');
    expect(output).toContain('1 flagged');
  });
});
