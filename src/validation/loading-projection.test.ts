import { describe, it, expect } from 'vitest';
import type { BudgetProfile } from '../types/application.js';
import type { SkillBudgetInfo } from './budget-validation.js';
import {
  ProjectedSkill,
  LoadingProjection,
  projectLoading,
} from './loading-projection.js';

// ============================================================================
// Test Helpers
// ============================================================================

/** Create a minimal SkillBudgetInfo for testing. */
function makeSkill(name: string, totalChars: number): SkillBudgetInfo {
  return {
    name,
    descriptionChars: Math.round(totalChars * 0.1),
    bodyChars: Math.round(totalChars * 0.9),
    totalChars,
    path: `/test/skills/${name}/SKILL.md`,
  };
}

/** Create a BudgetProfile with specific tier assignments. */
function makeProfile(
  name: string,
  budgetPercent: number,
  hardCeilingPercent: number,
  tiers: { critical?: string[]; standard?: string[]; optional?: string[] } = {}
): BudgetProfile {
  return {
    name,
    budgetPercent,
    hardCeilingPercent,
    tiers: {
      critical: tiers.critical ?? [],
      standard: tiers.standard ?? [],
      optional: tiers.optional ?? [],
    },
    thresholds: { warn50: true, warn80: true, warn100: true },
  };
}

// Default context window for tests
const CTX = 200_000;

// ============================================================================
// BM-02 -- LoadingProjection captures loaded vs deferred
// ============================================================================

describe('BM-02: loaded vs deferred', () => {
  it('should place all skills in loaded when they fit within budget', () => {
    // 6% of 200k = 12000 char budget
    const profile = makeProfile('test', 0.06, 0.10);
    const skills = [
      makeSkill('alpha', 3000),
      makeSkill('bravo', 3000),
      makeSkill('charlie', 3000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    expect(result.loaded).toHaveLength(3);
    expect(result.deferred).toHaveLength(0);
    expect(result.loaded.map(s => s.name)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('should defer skills that do not fit, keeping tier priority order', () => {
    // 6% of 200k = 12000 char budget
    const profile = makeProfile('test', 0.06, 0.10);
    const skills = [
      makeSkill('s1', 4000),
      makeSkill('s2', 4000),
      makeSkill('s3', 4000),
      makeSkill('s4', 4000),
      makeSkill('s5', 4000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // 4000*3 = 12000 fits; 4th does not
    expect(result.loaded).toHaveLength(3);
    expect(result.deferred).toHaveLength(2);
    expect(result.loaded.map(s => s.name)).toEqual(['s1', 's2', 's3']);
    expect(result.deferred.map(s => s.name)).toEqual(['s4', 's5']);
  });

  it('should return empty loaded and deferred for empty skills array', () => {
    const profile = makeProfile('test', 0.06, 0.10);
    const result = projectLoading([], profile, { contextWindowSize: CTX });

    expect(result.loaded).toHaveLength(0);
    expect(result.deferred).toHaveLength(0);
    expect(result.loadedTotal).toBe(0);
    expect(result.deferredTotal).toBe(0);
  });
});

// ============================================================================
// BM-03 -- Tier priority ordering (critical > standard > optional)
// ============================================================================

describe('BM-03: tier priority ordering', () => {
  it('should load critical skills first, then standard, then optional', () => {
    // Budget = 5% of 200k = 10000. Hard ceiling = 8% = 16000.
    // critical: 'crit-a' (5000) -- loads against hard ceiling
    // standard: 'std-a' (3000) -- loads against standard budget
    // optional: 'opt-a' (2000) -- loads against standard budget remaining
    const profile = makeProfile('test', 0.05, 0.08, {
      critical: ['crit-a'],
      standard: ['std-a'],
      optional: ['opt-a'],
    });
    const skills = [
      makeSkill('opt-a', 2000),
      makeSkill('std-a', 3000),
      makeSkill('crit-a', 5000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // All fit: critical against 16000, standard+optional against 10000
    expect(result.loaded).toHaveLength(3);
    // Order should be: critical first, then standard, then optional
    expect(result.loaded.map(s => s.name)).toEqual(['crit-a', 'std-a', 'opt-a']);
  });

  it('should defer standard and optional when only critical fits', () => {
    // Budget = 1% of 200k = 2000. Hard ceiling = 3% = 6000.
    const profile = makeProfile('test', 0.01, 0.03, {
      critical: ['crit-1'],
      standard: ['std-1'],
      optional: ['opt-1'],
    });
    const skills = [
      makeSkill('crit-1', 5000),
      makeSkill('std-1', 3000),
      makeSkill('opt-1', 2000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // crit-1 (5000) fits in hardCeiling (6000)
    // std-1 (3000) exceeds standardBudget (2000)
    // opt-1 (2000) exceeds standardBudget (2000 already at 0, but 2000 <= 2000 -- fits exactly)
    // Wait: 0 + 3000 > 2000 -- std-1 deferred
    // 0 + 2000 <= 2000 -- opt-1 fits
    expect(result.loaded.map(s => s.name)).toContain('crit-1');
    expect(result.deferred.map(s => s.name)).toContain('std-1');
  });

  it('should preserve tier ordering in deferred array (standard before optional)', () => {
    // Budget = 1% of 200k = 2000. Hard ceiling = 2% = 4000.
    // All skills are too large for their budgets except nothing
    const profile = makeProfile('test', 0.01, 0.02, {
      critical: ['crit-x'],
      standard: ['std-x'],
      optional: ['opt-x'],
    });
    const skills = [
      makeSkill('opt-x', 5000),
      makeSkill('std-x', 5000),
      makeSkill('crit-x', 5000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // crit-x (5000) > hardCeiling (4000) -- deferred
    // std-x (5000) > standardBudget (2000) -- deferred
    // opt-x (5000) > standardBudget (2000) -- deferred
    // Deferred order should be: critical, then standard, then optional
    expect(result.deferred.map(s => s.name)).toEqual(['crit-x', 'std-x', 'opt-x']);
  });
});

// ============================================================================
// BM-04 -- Same selection logic as BudgetStage
// ============================================================================

describe('BM-04: mirrors BudgetStage selection logic', () => {
  it('should check critical skills against hardCeilingPercent', () => {
    // Budget = 3% of 200k = 6000. Hard ceiling = 8% = 16000.
    const profile = makeProfile('test', 0.03, 0.08, {
      critical: ['big-crit'],
    });
    const skills = [makeSkill('big-crit', 10000)];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // 10000 > standardBudget (6000) but <= hardCeiling (16000)
    expect(result.loaded).toHaveLength(1);
    expect(result.loaded[0].name).toBe('big-crit');
  });

  it('should check standard skills against budgetPercent', () => {
    // Budget = 3% of 200k = 6000.
    const profile = makeProfile('test', 0.03, 0.08, {
      standard: ['std-skill'],
    });
    const skills = [makeSkill('std-skill', 7000)];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // 7000 > standardBudget (6000) -- deferred
    expect(result.deferred).toHaveLength(1);
    expect(result.deferred[0].name).toBe('std-skill');
  });

  it('should check optional skills against budgetPercent', () => {
    // Budget = 3% of 200k = 6000.
    const profile = makeProfile('test', 0.03, 0.08, {
      optional: ['opt-skill'],
    });
    const skills = [makeSkill('opt-skill', 7000)];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // 7000 > standardBudget (6000) -- deferred
    expect(result.deferred).toHaveLength(1);
    expect(result.deferred[0].name).toBe('opt-skill');
  });

  it('should maintain input order within same tier', () => {
    // Budget = 10% of 200k = 20000
    const profile = makeProfile('test', 0.10, 0.15, {
      standard: ['z-skill', 'a-skill', 'm-skill'],
    });
    const skills = [
      makeSkill('z-skill', 2000),
      makeSkill('a-skill', 2000),
      makeSkill('m-skill', 2000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    expect(result.loaded.map(s => s.name)).toEqual(['z-skill', 'a-skill', 'm-skill']);
  });
});

// ============================================================================
// BM-05 -- Single-skill flagging
// ============================================================================

describe('BM-05: single-skill oversized flagging', () => {
  it('should flag skills exceeding default singleSkillLimit (15000)', () => {
    const profile = makeProfile('test', 0.10, 0.15);
    const skills = [makeSkill('huge', 16000)];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    expect(result.loaded[0].oversized).toBe(true);
  });

  it('should not flag skills under singleSkillLimit', () => {
    const profile = makeProfile('test', 0.10, 0.15);
    const skills = [makeSkill('small', 14000)];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    expect(result.loaded[0].oversized).toBe(false);
  });

  it('should respect custom singleSkillLimit parameter', () => {
    const profile = makeProfile('test', 0.10, 0.15);
    const skills = [makeSkill('medium', 8000)];

    const result = projectLoading(skills, profile, {
      contextWindowSize: CTX,
      singleSkillLimit: 5000,
    });

    expect(result.loaded[0].oversized).toBe(true);
  });

  it('should not flag a skill exactly at the limit', () => {
    const profile = makeProfile('test', 0.10, 0.15);
    const skills = [makeSkill('exact', 15000)];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // 15000 is NOT > 15000, so not oversized
    expect(result.loaded[0].oversized).toBe(false);
  });
});

// ============================================================================
// BM-06 -- Profile awareness
// ============================================================================

describe('BM-06: profile awareness', () => {
  it('should produce different projections for different profiles', () => {
    // Executor: 6% of 200k = 12000
    const executorProfile = makeProfile('gsd-executor', 0.06, 0.10);
    // Planner: 5% of 200k = 10000
    const plannerProfile = makeProfile('gsd-planner', 0.05, 0.08);

    const skills = [
      makeSkill('s1', 4000),
      makeSkill('s2', 4000),
      makeSkill('s3', 4000),
    ];

    const executorResult = projectLoading(skills, executorProfile, { contextWindowSize: CTX });
    const plannerResult = projectLoading(skills, plannerProfile, { contextWindowSize: CTX });

    // Executor: 4000*3 = 12000 <= 12000 -- all fit
    expect(executorResult.loaded).toHaveLength(3);
    expect(executorResult.deferred).toHaveLength(0);

    // Planner: 4000*2 = 8000 fits, 4000*3 = 12000 > 10000 -- third deferred
    expect(plannerResult.loaded).toHaveLength(2);
    expect(plannerResult.deferred).toHaveLength(1);
  });

  it('should classify skills by profile tiers correctly', () => {
    // Profile with explicit tier assignments
    const profile = makeProfile('test-profile', 0.05, 0.08, {
      critical: ['important-skill'],
      optional: ['nice-to-have'],
    });

    const skills = [
      makeSkill('important-skill', 5000),
      makeSkill('nice-to-have', 5000),
      makeSkill('default-skill', 5000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // important-skill is critical, checked against hardCeiling (16000)
    const importantLoaded = result.loaded.find(s => s.name === 'important-skill');
    expect(importantLoaded).toBeDefined();
    expect(importantLoaded!.tier).toBe('critical');

    // nice-to-have is optional
    const niceLoaded = result.loaded.find(s => s.name === 'nice-to-have');
    const niceDeferred = result.deferred.find(s => s.name === 'nice-to-have');
    const niceSkill = niceLoaded ?? niceDeferred;
    expect(niceSkill).toBeDefined();
    expect(niceSkill!.tier).toBe('optional');

    // default-skill (not in any tier list) defaults to standard
    const defaultLoaded = result.loaded.find(s => s.name === 'default-skill');
    const defaultDeferred = result.deferred.find(s => s.name === 'default-skill');
    const defaultSkill = defaultLoaded ?? defaultDeferred;
    expect(defaultSkill).toBeDefined();
    expect(defaultSkill!.tier).toBe('standard');
  });

  it('should reflect profileName in the projection result', () => {
    const profile = makeProfile('gsd-executor', 0.06, 0.10);
    const result = projectLoading([], profile, { contextWindowSize: CTX });

    expect(result.profileName).toBe('gsd-executor');
  });
});

// ============================================================================
// ProjectedSkill shape
// ============================================================================

describe('ProjectedSkill shape', () => {
  it('should have all required fields for loaded skills', () => {
    const profile = makeProfile('test', 0.10, 0.15, {
      critical: ['my-skill'],
    });
    const skills = [makeSkill('my-skill', 5000)];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });
    const projected = result.loaded[0];

    expect(projected).toHaveProperty('name', 'my-skill');
    expect(projected).toHaveProperty('charCount', 5000);
    expect(projected).toHaveProperty('tier', 'critical');
    expect(projected).toHaveProperty('oversized', false);
    expect(projected).toHaveProperty('status', 'loaded');
  });

  it('should have all required fields for deferred skills', () => {
    // Budget = 1% = 2000
    const profile = makeProfile('test', 0.01, 0.02, {
      optional: ['big-opt'],
    });
    const skills = [makeSkill('big-opt', 5000)];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });
    const projected = result.deferred[0];

    expect(projected).toHaveProperty('name', 'big-opt');
    expect(projected).toHaveProperty('charCount', 5000);
    expect(projected).toHaveProperty('tier', 'optional');
    expect(projected).toHaveProperty('oversized', false);
    expect(projected).toHaveProperty('status', 'deferred');
  });
});

// ============================================================================
// LoadingProjection shape
// ============================================================================

describe('LoadingProjection shape', () => {
  it('should have all required fields', () => {
    const profile = makeProfile('test-agent', 0.06, 0.10);
    const skills = [
      makeSkill('loaded-skill', 3000),
      makeSkill('deferred-skill', 20000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    expect(result).toHaveProperty('loaded');
    expect(result).toHaveProperty('deferred');
    expect(result).toHaveProperty('loadedTotal');
    expect(result).toHaveProperty('deferredTotal');
    expect(result).toHaveProperty('budgetLimit');
    expect(result).toHaveProperty('profileName');

    expect(Array.isArray(result.loaded)).toBe(true);
    expect(Array.isArray(result.deferred)).toBe(true);
    expect(typeof result.loadedTotal).toBe('number');
    expect(typeof result.deferredTotal).toBe('number');
    expect(typeof result.budgetLimit).toBe('number');
    expect(typeof result.profileName).toBe('string');
  });

  it('should compute correct totals for loaded and deferred', () => {
    // Budget = 5% of 200k = 10000
    const profile = makeProfile('test', 0.05, 0.08);
    const skills = [
      makeSkill('a', 4000),
      makeSkill('b', 4000),
      makeSkill('c', 4000),
    ];

    const result = projectLoading(skills, profile, { contextWindowSize: CTX });

    // a+b = 8000 loaded, c = 4000 deferred (8000+4000=12000 > 10000)
    expect(result.loadedTotal).toBe(8000);
    expect(result.deferredTotal).toBe(4000);
  });

  it('should set budgetLimit to standardBudget (contextWindowSize * budgetPercent)', () => {
    const profile = makeProfile('test', 0.06, 0.10);
    const result = projectLoading([], profile, { contextWindowSize: CTX });

    // 200000 * 0.06 = 12000
    expect(result.budgetLimit).toBe(12000);
  });
});
