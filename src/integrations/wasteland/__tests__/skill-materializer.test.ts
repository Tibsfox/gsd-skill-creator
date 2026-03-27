/**
 * Tests for Skill Materializer — SKILL.md generation from recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  materializeTeamSkill,
  materializeDecompositionSkill,
  materializeRoutingSkill,
  materializeGateSkill,
  materializeAll,
} from '../skill-materializer.js';
import type { TeamScore, DecompositionTemplate, RoutingRule, GateSpec } from '../types.js';

const TEAM: TeamScore = {
  teamId: 'alpha',
  members: ['cedar', 'lex'],
  coverageScore: 0.9,
  gapScore: 0.8,
  redundancyScore: 0.1,
  overallScore: 0.85,
  gaps: ['deploy'],
  confidence: 0.9,
};

const TEMPLATE: DecompositionTemplate = {
  id: 'tmpl-1',
  phases: [
    { name: 'plan', taskType: 'planning', recommendedArchetype: 'planner', estimatedDurationMs: 5000, dependencies: [] },
  ],
  parallelizablePhases: [],
  estimatedDurationMs: 5000,
  confidence: 0.8,
};

const ROUTE: RoutingRule = {
  id: 'r-1',
  taskType: 'build',
  route: ['hub', 'leaf'],
  weight: 0.9,
  latencyEstimateMs: 200,
  successRateEstimate: 0.85,
  abTestActive: false,
};

const GATE: GateSpec = {
  id: 'g-1',
  name: 'timeout-check',
  type: 'pre-execution',
  automationLevel: 'human-approval',
  sourceFailureSignatures: ['sig-1'],
  truePositiveRate: 0.9,
  falsePositiveRate: 0.05,
};

describe('materializeTeamSkill', () => {
  it('generates SKILL.md with frontmatter', () => {
    const skill = materializeTeamSkill(TEAM, 0.9, ['evidence-1']);
    expect(skill.skillName).toBe('team-alpha');
    expect(skill.category).toBe('team-composition');
    expect(skill.content).toContain('---');
    expect(skill.content).toContain('name: team-alpha');
    expect(skill.content).toContain('cedar');
    expect(skill.content).toContain('lex');
    expect(skill.content).toContain('deploy'); // gap
  });

  it('includes recommendation metadata', () => {
    const skill = materializeTeamSkill(TEAM, 0.9, ['e1']);
    expect(skill.recommendation.type).toBe('team-composition');
    expect(skill.recommendation.confidence).toBe(0.9);
  });
});

describe('materializeDecompositionSkill', () => {
  it('generates decomposition SKILL.md', () => {
    const skill = materializeDecompositionSkill(TEMPLATE, 0.8, ['evidence-1']);
    expect(skill.category).toBe('task-decomposition');
    expect(skill.content).toContain('plan');
    expect(skill.content).toContain('planning');
  });
});

describe('materializeRoutingSkill', () => {
  it('generates routing SKILL.md', () => {
    const skill = materializeRoutingSkill(ROUTE, 0.85, ['evidence-1']);
    expect(skill.category).toBe('routing-rule');
    expect(skill.content).toContain('hub');
    expect(skill.content).toContain('leaf');
    expect(skill.content).toContain('85');
  });
});

describe('materializeGateSkill', () => {
  it('generates gate SKILL.md', () => {
    const skill = materializeGateSkill(GATE, 0.9, ['evidence-1']);
    expect(skill.category).toBe('safety-gate');
    expect(skill.content).toContain('timeout-check');
    expect(skill.content).toContain('pre-execution');
  });
});

describe('materializeAll', () => {
  it('materializes all skill types above confidence threshold', () => {
    const skills = materializeAll([TEAM], [TEMPLATE], [ROUTE], [GATE], 0.7);
    expect(skills.length).toBeGreaterThanOrEqual(1);
    const categories = skills.map(s => s.category);
    expect(categories).toContain('safety-gate'); // gates always included
  });

  it('returns empty for no inputs', () => {
    const skills = materializeAll([], [], [], [], 0.5);
    expect(skills).toEqual([]);
  });
});
