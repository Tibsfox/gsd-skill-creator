import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelFilterStage } from './model-filter-stage.js';
import { createEmptyContext } from '../skill-pipeline.js';
import type { ScoredSkill } from '../../types/application.js';
import type { Skill } from '../../types/skill.js';

/** Build a mock Skill object with optional modelGuidance on the raw metadata. */
function buildSkill(
  name: string,
  modelGuidance?: { preferred?: string[]; minimumCapability?: number }
): Skill {
  const metadata: Record<string, unknown> = {
    name,
    description: `${name} skill`,
  };

  if (modelGuidance) {
    metadata.modelGuidance = modelGuidance;
  }

  return {
    metadata: metadata as any,
    body: `body of ${name}`,
    path: `.claude/skills/${name}/SKILL.md`,
  };
}

function scored(name: string, score: number): ScoredSkill {
  return { name, score, matchType: 'intent' };
}

// Mock SkillStore with name-based lookup
const skillRegistry = new Map<string, Skill>();
const mockSkillStore = {
  read: vi.fn((name: string) => {
    const skill = skillRegistry.get(name);
    if (!skill) return Promise.resolve(buildSkill(name));
    return Promise.resolve(skill);
  }),
} as any;

/** Register a skill in the mock store for name-based lookup. */
function registerSkill(
  name: string,
  modelGuidance?: { preferred?: string[]; minimumCapability?: number }
): void {
  skillRegistry.set(name, buildSkill(name, modelGuidance));
}

describe('ModelFilterStage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    skillRegistry.clear();
  });

  it('passes through all skills when no modelProfile set on context', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('skill-a', { preferred: ['opus'] });
    registerSkill('skill-b', { preferred: ['haiku'] });

    const ctx = createEmptyContext({
      resolvedSkills: [scored('skill-a', 0.9), scored('skill-b', 0.7)],
      // no modelProfile
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(2);
    expect(result.budgetSkipped).toHaveLength(0);
  });

  it('passes through skills with no modelGuidance', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('plain-skill'); // no modelGuidance

    const ctx = createEmptyContext({
      modelProfile: 'quality',
      resolvedSkills: [scored('plain-skill', 0.8)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(1);
    expect(result.resolvedSkills[0].name).toBe('plain-skill');
  });

  it('keeps skills matching preferred model tier', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('opus-skill', { preferred: ['opus'] });

    const ctx = createEmptyContext({
      modelProfile: 'quality', // maps to opus
      resolvedSkills: [scored('opus-skill', 0.9)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(1);
    expect(result.resolvedSkills[0].name).toBe('opus-skill');
  });

  it('skips skills not matching preferred model tier', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('haiku-only', { preferred: ['haiku'] });

    const ctx = createEmptyContext({
      modelProfile: 'quality', // maps to opus
      resolvedSkills: [scored('haiku-only', 0.9)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(0);
    expect(result.budgetSkipped).toHaveLength(1);
    expect(result.budgetSkipped[0].name).toBe('haiku-only');
    expect(result.budgetSkipped[0].reason).toBe('model_mismatch');
  });

  it('maps quality profile to opus tier', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('opus-skill', { preferred: ['opus'] });

    const ctx = createEmptyContext({
      modelProfile: 'quality',
      resolvedSkills: [scored('opus-skill', 0.8)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(1);
  });

  it('maps balanced profile to sonnet tier', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('sonnet-skill', { preferred: ['sonnet'] });

    const ctx = createEmptyContext({
      modelProfile: 'balanced',
      resolvedSkills: [scored('sonnet-skill', 0.8)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(1);
  });

  it('maps budget profile to haiku tier', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('haiku-skill', { preferred: ['haiku'] });

    const ctx = createEmptyContext({
      modelProfile: 'budget',
      resolvedSkills: [scored('haiku-skill', 0.8)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(1);
  });

  it('skips skills below minimum capability level', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('high-cap', { minimumCapability: 2 }); // needs sonnet or above

    const ctx = createEmptyContext({
      modelProfile: 'budget', // haiku = capability level 1
      resolvedSkills: [scored('high-cap', 0.8)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(0);
    expect(result.budgetSkipped).toHaveLength(1);
    expect(result.budgetSkipped[0].reason).toBe('model_mismatch');
  });

  it('keeps skills at or above minimum capability level', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('moderate-cap', { minimumCapability: 2 }); // needs sonnet or above

    const ctx = createEmptyContext({
      modelProfile: 'quality', // opus = capability level 3
      resolvedSkills: [scored('moderate-cap', 0.8)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(1);
    expect(result.resolvedSkills[0].name).toBe('moderate-cap');
  });

  it('respects earlyExit flag', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    const ctx = createEmptyContext({
      earlyExit: true,
      modelProfile: 'quality',
      resolvedSkills: [scored('some-skill', 0.8)],
    });

    const result = await stage.process(ctx);

    expect(result.earlyExit).toBe(true);
    expect(result.resolvedSkills).toHaveLength(1);
    expect(mockSkillStore.read).not.toHaveBeenCalled();
  });

  it('handles mixed skills (some with modelGuidance, some without)', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('guided-match', { preferred: ['sonnet'] });
    registerSkill('guided-miss', { preferred: ['opus'] });
    registerSkill('unguided'); // no modelGuidance

    const ctx = createEmptyContext({
      modelProfile: 'balanced', // maps to sonnet
      resolvedSkills: [
        scored('guided-match', 0.9),
        scored('guided-miss', 0.8),
        scored('unguided', 0.7),
      ],
    });

    const result = await stage.process(ctx);

    const keptNames = result.resolvedSkills.map(s => s.name);
    expect(keptNames).toContain('guided-match');
    expect(keptNames).toContain('unguided');
    expect(keptNames).not.toContain('guided-miss');

    expect(result.budgetSkipped).toHaveLength(1);
    expect(result.budgetSkipped[0].name).toBe('guided-miss');
    expect(result.budgetSkipped[0].reason).toBe('model_mismatch');
  });

  it('unknown modelProfile defaults to sonnet tier', async () => {
    const stage = new ModelFilterStage(mockSkillStore);
    registerSkill('sonnet-skill', { preferred: ['sonnet'] });
    registerSkill('haiku-skill', { preferred: ['haiku'] });

    const ctx = createEmptyContext({
      modelProfile: 'unknown',
      resolvedSkills: [
        scored('sonnet-skill', 0.8),
        scored('haiku-skill', 0.7),
      ],
    });

    const result = await stage.process(ctx);

    const keptNames = result.resolvedSkills.map(s => s.name);
    expect(keptNames).toContain('sonnet-skill');
    expect(keptNames).not.toContain('haiku-skill');
  });
});
