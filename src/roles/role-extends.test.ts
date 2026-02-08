/**
 * Tests for role extends composition with additive constraint merging.
 *
 * Covers:
 * - Role without extends returns as-is
 * - Simple extends: constraints additive, skills union, tools/model inherited
 * - Tools child-wins semantics
 * - Model child-wins semantics
 * - Constraint deduplication (exact string match)
 * - Skill deduplication
 * - Circular extends detection
 * - Missing parent error
 * - Deep chain (3 levels) with ancestor-first constraint order
 * - Max depth exceeded error
 */

import { describe, it, expect } from 'vitest';
import { resolveRoleExtends } from './role-extends.js';
import type { RoleDefinition } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeRole(
  name: string,
  overrides: Partial<Omit<RoleDefinition, 'name'>> = {},
): RoleDefinition {
  return {
    name,
    extends: null,
    skills: [],
    constraints: [],
    ...overrides,
  };
}

type RoleMap = Record<string, RoleDefinition>;

function makeLoader(roles: RoleMap) {
  return async (name: string): Promise<RoleDefinition | null> => {
    return roles[name] ?? null;
  };
}

// ============================================================================
// No extends
// ============================================================================

describe('resolveRoleExtends - no extends', () => {
  it('returns role as-is with chain [name] when no extends', async () => {
    const role = makeRole('base-reviewer', {
      constraints: ['Never modify files'],
      skills: ['code-analysis'],
      tools: 'Read, Glob, Grep',
    });

    const result = await resolveRoleExtends(role, makeLoader({}));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.resolved.name).toBe('base-reviewer');
      expect(result.resolved.constraints).toEqual(['Never modify files']);
      expect(result.resolved.skills).toEqual(['code-analysis']);
      expect(result.resolved.tools).toBe('Read, Glob, Grep');
      expect(result.chain).toEqual(['base-reviewer']);
    }
  });
});

// ============================================================================
// Simple extends
// ============================================================================

describe('resolveRoleExtends - simple extends', () => {
  it('merges constraints additively (parent first), skills as union, inherits tools/model', async () => {
    const parent = makeRole('base-reviewer', {
      constraints: ['Never modify files', 'Provide evidence'],
      skills: ['code-analysis'],
      tools: 'Read, Glob, Grep',
      model: 'sonnet' as const,
    });

    const child = makeRole('security-reviewer', {
      extends: 'base-reviewer',
      constraints: ['Rate by severity'],
      skills: ['owasp-scanner'],
    });

    const result = await resolveRoleExtends(child, makeLoader({ 'base-reviewer': parent }));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      // Constraints: parent first, then child
      expect(result.resolved.constraints).toEqual([
        'Never modify files',
        'Provide evidence',
        'Rate by severity',
      ]);
      // Skills: union deduplicated
      expect(result.resolved.skills).toEqual(['code-analysis', 'owasp-scanner']);
      // Tools: child omits -> inherits parent
      expect(result.resolved.tools).toBe('Read, Glob, Grep');
      // Model: child omits -> inherits parent
      expect(result.resolved.model).toBe('sonnet');
      // Extends nullified in resolved output
      expect(result.resolved.extends).toBeNull();
      // Chain
      expect(result.chain).toEqual(['base-reviewer', 'security-reviewer']);
    }
  });
});

// ============================================================================
// Tools child-wins
// ============================================================================

describe('resolveRoleExtends - tools child-wins', () => {
  it('child tools override parent tools', async () => {
    const parent = makeRole('parent', {
      tools: 'Read, Write, Bash',
    });

    const child = makeRole('child', {
      extends: 'parent',
      tools: 'Read, Glob, Grep',
    });

    const result = await resolveRoleExtends(child, makeLoader({ parent }));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.resolved.tools).toBe('Read, Glob, Grep');
    }
  });
});

// ============================================================================
// Model child-wins
// ============================================================================

describe('resolveRoleExtends - model child-wins', () => {
  it('child model overrides parent model', async () => {
    const parent = makeRole('parent', {
      model: 'sonnet' as const,
    });

    const child = makeRole('child', {
      extends: 'parent',
      model: 'opus' as const,
    });

    const result = await resolveRoleExtends(child, makeLoader({ parent }));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.resolved.model).toBe('opus');
    }
  });
});

// ============================================================================
// Constraint deduplication
// ============================================================================

describe('resolveRoleExtends - constraint deduplication', () => {
  it('same constraint in parent and child appears only once', async () => {
    const parent = makeRole('parent', {
      constraints: ['Never modify files', 'Provide evidence'],
    });

    const child = makeRole('child', {
      extends: 'parent',
      constraints: ['Never modify files', 'Rate by severity'],
    });

    const result = await resolveRoleExtends(child, makeLoader({ parent }));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.resolved.constraints).toEqual([
        'Never modify files',
        'Provide evidence',
        'Rate by severity',
      ]);
    }
  });
});

// ============================================================================
// Skill deduplication
// ============================================================================

describe('resolveRoleExtends - skill deduplication', () => {
  it('same skill in parent and child appears only once', async () => {
    const parent = makeRole('parent', {
      skills: ['code-analysis', 'linting'],
    });

    const child = makeRole('child', {
      extends: 'parent',
      skills: ['code-analysis', 'owasp-scanner'],
    });

    const result = await resolveRoleExtends(child, makeLoader({ parent }));
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.resolved.skills).toEqual(['code-analysis', 'linting', 'owasp-scanner']);
    }
  });
});

// ============================================================================
// Circular extends
// ============================================================================

describe('resolveRoleExtends - circular extends', () => {
  it('A extends B, B extends A returns error containing "Circular"', async () => {
    const a = makeRole('a', { extends: 'b' });
    const b = makeRole('b', { extends: 'a' });

    const result = await resolveRoleExtends(a, makeLoader({ a, b }));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Circular');
    }
  });
});

// ============================================================================
// Missing parent
// ============================================================================

describe('resolveRoleExtends - missing parent', () => {
  it('child extends non-existent role returns error containing "not found"', async () => {
    const child = makeRole('child', { extends: 'nonexistent' });

    const result = await resolveRoleExtends(child, makeLoader({}));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('not found');
    }
  });
});

// ============================================================================
// Deep chain (3 levels)
// ============================================================================

describe('resolveRoleExtends - deep chain', () => {
  it('grandparent -> parent -> child: constraints accumulate ancestor-first', async () => {
    const grandparent = makeRole('grandparent', {
      constraints: ['Rule A'],
      skills: ['skill-a'],
      tools: 'Read',
      model: 'sonnet' as const,
    });

    const parent = makeRole('parent', {
      extends: 'grandparent',
      constraints: ['Rule B'],
      skills: ['skill-b'],
      tools: 'Read, Write',
    });

    const child = makeRole('child', {
      extends: 'parent',
      constraints: ['Rule C'],
      skills: ['skill-c'],
    });

    const loader = makeLoader({ grandparent, parent });
    const result = await resolveRoleExtends(child, loader);
    expect('resolved' in result).toBe(true);
    if ('resolved' in result) {
      expect(result.chain).toEqual(['grandparent', 'parent', 'child']);
      // Constraints from all three in ancestor-first order
      expect(result.resolved.constraints).toEqual(['Rule A', 'Rule B', 'Rule C']);
      // Skills union
      expect(result.resolved.skills).toEqual(['skill-a', 'skill-b', 'skill-c']);
      // Tools: child omits -> parent's (child-wins applied at parent level)
      expect(result.resolved.tools).toBe('Read, Write');
      // Model: child omits, parent omits -> grandparent's
      expect(result.resolved.model).toBe('sonnet');
    }
  });
});

// ============================================================================
// Max depth exceeded
// ============================================================================

describe('resolveRoleExtends - max depth', () => {
  it('chain deeper than maxDepth returns error', async () => {
    const a = makeRole('a', { extends: 'b' });
    const b = makeRole('b', { extends: 'c' });
    const c = makeRole('c', {});

    const result = await resolveRoleExtends(a, makeLoader({ a, b, c }), 1);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('depth');
    }
  });
});
