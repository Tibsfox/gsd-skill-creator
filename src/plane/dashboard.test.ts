/**
 * Tests for terminal rendering functions in the plane dashboard.
 *
 * Validates bar chart rendering, edge cases (empty metrics, zero skills),
 * per-skill detail views, and one-line summary output.
 */

import { describe, it, expect } from 'vitest';

import {
  renderPlaneStatus,
  renderSkillDetail,
  renderSkillSummary,
} from './dashboard.js';

import type { PlaneMetrics, SkillPosition, TangentContext, ChordCandidate } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

function pos(theta: number, radius: number, angularVelocity = 0): SkillPosition {
  return { theta, radius, angularVelocity, lastUpdated: new Date().toISOString() };
}

function makeMetrics(overrides: Partial<PlaneMetrics> = {}): PlaneMetrics {
  return {
    totalSkills: 47,
    versineDistribution: { grounded: 12, working: 28, frontier: 7 },
    avgExsecant: 0.531,
    angularVelocityWarnings: [],
    chordCandidates: [],
    ...overrides,
  };
}

function makeChord(fromId: string, toId: string, savings: number): ChordCandidate {
  return {
    fromId,
    toId,
    fromPosition: pos(0.1, 0.5),
    toPosition: pos(1.0, 0.5),
    arcDistance: 0.9,
    chordLength: 0.9 - savings,
    savings,
    frequency: 5,
  };
}

function makeTangent(overrides: Partial<TangentContext> = {}): TangentContext {
  return {
    slope: -5.671,
    reach: 1.020,
    exsecant: 0.020,
    versine: 0.016,
    ...overrides,
  };
}

// ============================================================================
// renderPlaneStatus
// ============================================================================

describe('renderPlaneStatus', () => {
  it('renders output for balanced distribution', () => {
    const output = renderPlaneStatus(makeMetrics());

    expect(output).toContain('47 total');
    expect(output).toContain('Grounded: 12');
    expect(output).toContain('Working:  28');
    expect(output).toContain('Frontier: 7');
    // Should contain bar characters
    expect(output).toContain('\u2588');
    expect(output).toContain('\u2591');
  });

  it('handles zero skills gracefully', () => {
    const output = renderPlaneStatus(makeMetrics({
      totalSkills: 0,
      versineDistribution: { grounded: 0, working: 0, frontier: 0 },
    }));

    expect(output).toContain('No skills positioned');
    expect(output).not.toContain('Versine Distribution');
  });

  it('shows velocity warnings', () => {
    const output = renderPlaneStatus(makeMetrics({
      angularVelocityWarnings: ['fast-skill: angular velocity 0.150', 'drift-skill: angular velocity 0.120'],
    }));

    expect(output).toContain('Warnings: 2');
    expect(output).toContain('! fast-skill');
    expect(output).toContain('! drift-skill');
  });

  it('shows no warnings text', () => {
    const output = renderPlaneStatus(makeMetrics({
      angularVelocityWarnings: [],
    }));

    expect(output).toContain('none');
  });

  it('shows chord candidates', () => {
    const output = renderPlaneStatus(makeMetrics({
      chordCandidates: [makeChord('skill-a', 'skill-b', 0.15)],
    }));

    expect(output).toContain('skill-a');
    expect(output).toContain('skill-b');
    expect(output).toContain('Chord Candidates: 1');
  });

  it('shows no chords text', () => {
    const output = renderPlaneStatus(makeMetrics({
      chordCandidates: [],
    }));

    expect(output).toContain('Chord Candidates: none');
  });
});

// ============================================================================
// renderSkillDetail
// ============================================================================

describe('renderSkillDetail', () => {
  it('renders grounded skill correctly', () => {
    const position = pos(0.18, 0.82);
    const tangent = makeTangent({ versine: 0.016, exsecant: 0.016 });
    const output = renderSkillDetail('my-grounded-skill', position, tangent);

    expect(output).toContain('my-grounded-skill');
    expect(output).toContain('Grounded');
    // theta in degrees: 0.18 * 180 / pi ~ 10.3
    expect(output).toContain('10.3');
    expect(output).toContain('0.820');
  });

  it('renders frontier skill correctly', () => {
    const position = pos(1.3, 0.15);
    const tangent = makeTangent({ versine: 0.732, exsecant: 2.730 });
    const output = renderSkillDetail('frontier-skill', position, tangent);

    expect(output).toContain('Frontier');
    expect(output).toContain('frontier-skill');
  });

  it('shows stable velocity label', () => {
    const position = pos(0.5, 0.5, 0.01);
    const tangent = makeTangent();
    const output = renderSkillDetail('stable-skill', position, tangent);

    expect(output).toContain('stable');
  });

  it('shows volatile velocity label', () => {
    const position = pos(0.5, 0.5, 0.15);
    const tangent = makeTangent();
    const output = renderSkillDetail('volatile-skill', position, tangent);

    expect(output).toContain('volatile');
  });
});

// ============================================================================
// renderSkillSummary
// ============================================================================

describe('renderSkillSummary', () => {
  it('produces one-line output', () => {
    const output = renderSkillSummary('test-skill', pos(0.5, 0.7, 0.01));

    // Should not contain newlines
    expect(output.split('\n')).toHaveLength(1);
  });

  it('shows stability indicator for stable skill', () => {
    const output = renderSkillSummary('stable', pos(0.5, 0.7, 0.01));
    expect(output).toContain('\u25CF'); // ●
  });

  it('shows stability indicator for volatile skill', () => {
    const output = renderSkillSummary('volatile', pos(0.5, 0.7, 0.15));
    expect(output).toContain('\u25CB'); // ○
  });

  it('shows zone in uppercase', () => {
    // theta = 0.05 -> versine ~ 0.001 -> GROUNDED
    const output = renderSkillSummary('grounded-skill', pos(0.05, 0.5));
    expect(output).toContain('[GROUNDED]');
  });
});
