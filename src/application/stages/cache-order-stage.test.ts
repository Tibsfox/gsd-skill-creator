import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheOrderStage, DEFAULT_CACHE_TIER } from './cache-order-stage.js';
import { createEmptyContext } from '../skill-pipeline.js';
import type { ScoredSkill } from '../../types/application.js';
import type { Skill } from '../../types/skill.js';

/**
 * Build a mock Skill object with optional cacheTier in the extension metadata.
 * Supports both new format (nested under metadata.extensions) and legacy (root-level).
 */
function buildSkill(name: string, cacheTier?: string, legacy?: boolean): Skill {
  if (legacy && cacheTier) {
    return {
      metadata: {
        name,
        description: `${name} skill`,
        cacheTier,
      } as any,
      body: `body of ${name}`,
      path: `.claude/skills/${name}/SKILL.md`,
    };
  }

  const metadata: any = {
    name,
    description: `${name} skill`,
  };

  if (cacheTier) {
    metadata.metadata = {
      extensions: {
        'gsd-skill-creator': { cacheTier },
      },
    };
  }

  return {
    metadata,
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
function registerSkill(name: string, cacheTier?: string, legacy?: boolean): void {
  skillRegistry.set(name, buildSkill(name, cacheTier, legacy));
}

describe('CacheOrderStage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    skillRegistry.clear();
  });

  it('earlyExit returns context unchanged', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    const ctx = createEmptyContext({
      earlyExit: true,
      resolvedSkills: [scored('alpha', 0.9)],
    });

    const result = await stage.process(ctx);

    expect(result.earlyExit).toBe(true);
    expect(result.resolvedSkills).toEqual([scored('alpha', 0.9)]);
    expect(mockSkillStore.read).not.toHaveBeenCalled();
  });

  it('empty resolvedSkills returns unchanged', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    const ctx = createEmptyContext({ resolvedSkills: [] });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toEqual([]);
    expect(mockSkillStore.read).not.toHaveBeenCalled();
  });

  it('single skill passes through', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    registerSkill('solo', 'static');
    const ctx = createEmptyContext({
      resolvedSkills: [scored('solo', 0.8)],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toEqual([scored('solo', 0.8)]);
  });

  it('sorts static before session before dynamic within same score', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    registerSkill('dyn-skill', 'dynamic');
    registerSkill('stat-skill', 'static');
    registerSkill('sess-skill', 'session');

    const ctx = createEmptyContext({
      resolvedSkills: [
        scored('dyn-skill', 0.8),
        scored('stat-skill', 0.8),
        scored('sess-skill', 0.8),
      ],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills.map(s => s.name)).toEqual([
      'stat-skill',
      'sess-skill',
      'dyn-skill',
    ]);
  });

  it('defaults missing cacheTier to dynamic', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    // no-tier-skill has no cacheTier in frontmatter (defaults to dynamic)
    registerSkill('static-skill', 'static');
    // no-tier-skill not registered -> returns skill without cacheTier via default mock

    const ctx = createEmptyContext({
      resolvedSkills: [
        scored('no-tier-skill', 0.8),
        scored('static-skill', 0.8),
      ],
    });

    const result = await stage.process(ctx);

    // static should come first, missing-tier defaults to dynamic (last)
    expect(result.resolvedSkills.map(s => s.name)).toEqual([
      'static-skill',
      'no-tier-skill',
    ]);
    expect(DEFAULT_CACHE_TIER).toBe('dynamic');
  });

  it('preserves relative order of different scores', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    // high-dyn is dynamic at score 0.9, low-static is static at score 0.5
    registerSkill('high-dyn', 'dynamic');
    registerSkill('low-static', 'static');

    const ctx = createEmptyContext({
      resolvedSkills: [
        scored('high-dyn', 0.9),
        scored('low-static', 0.5),
      ],
    });

    const result = await stage.process(ctx);

    // Score 0.9 must come before score 0.5 regardless of tier
    expect(result.resolvedSkills.map(s => s.name)).toEqual([
      'high-dyn',
      'low-static',
    ]);
  });

  it('alphabetical tiebreaking within same tier and score', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    registerSkill('zeta', 'session');
    registerSkill('alpha', 'session');

    const ctx = createEmptyContext({
      resolvedSkills: [
        scored('zeta', 0.7),
        scored('alpha', 0.7),
      ],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills.map(s => s.name)).toEqual([
      'alpha',
      'zeta',
    ]);
  });

  it('mixed scores and tiers - full sort', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    // Score 0.8 group: dynamic, static, session
    // Score 0.5 group: session, static
    registerSkill('a-dyn', 'dynamic');
    registerSkill('b-static', 'static');
    registerSkill('c-session', 'session');
    registerSkill('d-session', 'session');
    registerSkill('e-static', 'static');

    const ctx = createEmptyContext({
      resolvedSkills: [
        scored('a-dyn', 0.8),
        scored('b-static', 0.8),
        scored('c-session', 0.8),
        scored('d-session', 0.5),
        scored('e-static', 0.5),
      ],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills.map(s => s.name)).toEqual([
      // Score 0.8 band: static, session, dynamic
      'b-static',
      'c-session',
      'a-dyn',
      // Score 0.5 band: static, session
      'e-static',
      'd-session',
    ]);
  });

  it('deterministic output', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    registerSkill('c-dyn', 'dynamic');
    registerSkill('a-stat', 'static');
    registerSkill('b-sess', 'session');

    const skills = [
      scored('c-dyn', 0.8),
      scored('a-stat', 0.8),
      scored('b-sess', 0.8),
    ];

    const ctx1 = createEmptyContext({ resolvedSkills: [...skills] });
    const result1 = await stage.process(ctx1);

    const ctx2 = createEmptyContext({ resolvedSkills: [...skills] });
    const result2 = await stage.process(ctx2);

    expect(result1.resolvedSkills).toEqual(result2.resolvedSkills);
  });

  it('does not modify original resolvedSkills array', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    registerSkill('z-dyn', 'dynamic');
    registerSkill('a-stat', 'static');

    const original = [
      scored('z-dyn', 0.8),
      scored('a-stat', 0.8),
    ];
    const originalCopy = [...original];

    const ctx = createEmptyContext({ resolvedSkills: original });
    await stage.process(ctx);

    // The original array passed in should not have been mutated
    expect(original).toEqual(originalCopy);
  });

  it('reads cacheTier from legacy format', async () => {
    const stage = new CacheOrderStage(mockSkillStore);
    // Legacy format: cacheTier at root of metadata
    registerSkill('legacy-static', 'static', true);
    registerSkill('normal-dyn', 'dynamic');

    const ctx = createEmptyContext({
      resolvedSkills: [
        scored('legacy-static', 0.7),
        scored('normal-dyn', 0.7),
      ],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills.map(s => s.name)).toEqual([
      'legacy-static',
      'normal-dyn',
    ]);
  });

  it('handles SkillStore.read() errors gracefully', async () => {
    // Override default mock to throw for broken-skill specifically
    registerSkill('good-static', 'static');
    mockSkillStore.read.mockImplementation((name: string) => {
      if (name === 'broken-skill') return Promise.reject(new Error('File not found'));
      const skill = skillRegistry.get(name);
      if (!skill) return Promise.resolve(buildSkill(name));
      return Promise.resolve(skill);
    });

    const stage = new CacheOrderStage(mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        scored('broken-skill', 0.8),
        scored('good-static', 0.8),
      ],
    });

    const result = await stage.process(ctx);

    // broken-skill defaults to dynamic on error, good-static is static
    expect(result.resolvedSkills.map(s => s.name)).toEqual([
      'good-static',
      'broken-skill',
    ]);
  });
});
