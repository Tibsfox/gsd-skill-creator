/**
 * Pack registry tests.
 *
 * Tests the in-memory pack registry: register, lookup, list, filter,
 * tag search, and full-text search operations.
 *
 * @module registry.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { KnowledgePack, PackClassification } from '../types.js';
import { PackRegistry, createRegistry } from '../registry.js';

// ============================================================================
// Test helpers
// ============================================================================

/**
 * Create a minimal valid KnowledgePack with optional overrides.
 */
function makePack(overrides: Partial<KnowledgePack> = {}): KnowledgePack {
  return {
    pack_id: 'TEST-001',
    pack_name: 'Test Pack',
    version: '1.0.0',
    status: 'alpha',
    classification: 'core_academic',
    description: 'A test knowledge pack for unit testing.',
    short_description: 'Test pack',
    contributors: [{ name: 'Test Author', role: 'author' }],
    copyright: 'MIT',
    dependencies: [],
    prerequisite_packs: [],
    recommended_prior_knowledge: [],
    enables: [],
    grade_levels: [{ label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [10, 20] }],
    modules: [],
    learning_outcomes: [],
    assessment_methods: [],
    tools_required: [],
    tools_optional: [],
    interactive_elements: [],
    standards_alignment: [],
    content_flags: [],
    tags: ['test', 'unit-testing'],
    resources: [],
    related_packs: [],
    gsd_integration: { skill_creator_enabled: false },
    changelog: [],
    ...overrides,
  };
}

// ============================================================================
// createRegistry
// ============================================================================

describe('createRegistry', () => {
  it('returns a PackRegistry instance', () => {
    const registry = createRegistry();
    expect(registry).toBeInstanceOf(PackRegistry);
  });
});

// ============================================================================
// PackRegistry.register
// ============================================================================

describe('PackRegistry.register', () => {
  let registry: PackRegistry;

  beforeEach(() => {
    registry = createRegistry();
  });

  it('registers a valid pack successfully', () => {
    const pack = makePack({ pack_id: 'MATH-101' });
    registry.register(pack);
    expect(registry.count).toBe(1);
  });

  it('overwrites pack when registering same pack_id again (no error)', () => {
    const pack1 = makePack({ pack_id: 'MATH-101', pack_name: 'Math v1' });
    const pack2 = makePack({ pack_id: 'MATH-101', pack_name: 'Math v2' });
    registry.register(pack1);
    registry.register(pack2);
    expect(registry.count).toBe(1);
    expect(registry.lookup('MATH-101')?.pack_name).toBe('Math v2');
  });
});

// ============================================================================
// PackRegistry.lookup
// ============================================================================

describe('PackRegistry.lookup', () => {
  let registry: PackRegistry;

  beforeEach(() => {
    registry = createRegistry();
  });

  it('returns the pack when registered', () => {
    const pack = makePack({ pack_id: 'MATH-101' });
    registry.register(pack);
    const result = registry.lookup('MATH-101');
    expect(result).toBeDefined();
    expect(result?.pack_id).toBe('MATH-101');
  });

  it('returns undefined when not found', () => {
    expect(registry.lookup('NONEXISTENT')).toBeUndefined();
  });
});

// ============================================================================
// PackRegistry.listAll
// ============================================================================

describe('PackRegistry.listAll', () => {
  let registry: PackRegistry;

  beforeEach(() => {
    registry = createRegistry();
  });

  it('returns empty array when no packs registered', () => {
    expect(registry.listAll()).toEqual([]);
  });

  it('returns all registered packs', () => {
    registry.register(makePack({ pack_id: 'MATH-101' }));
    registry.register(makePack({ pack_id: 'CODE-101' }));
    registry.register(makePack({ pack_id: 'HIST-101' }));
    const all = registry.listAll();
    expect(all).toHaveLength(3);
    const ids = all.map((p) => p.pack_id);
    expect(ids).toContain('MATH-101');
    expect(ids).toContain('CODE-101');
    expect(ids).toContain('HIST-101');
  });
});

// ============================================================================
// PackRegistry.listByCategory
// ============================================================================

describe('PackRegistry.listByCategory', () => {
  let registry: PackRegistry;

  beforeEach(() => {
    registry = createRegistry();
    registry.register(makePack({ pack_id: 'MATH-101', classification: 'core_academic' }));
    registry.register(makePack({ pack_id: 'CODE-101', classification: 'applied' }));
    registry.register(makePack({ pack_id: 'ASTRO-101', classification: 'specialized' }));
  });

  it('filters by core_academic classification', () => {
    const result = registry.listByCategory('core_academic');
    expect(result).toHaveLength(1);
    expect(result[0].pack_id).toBe('MATH-101');
  });

  it('filters by applied classification', () => {
    const result = registry.listByCategory('applied');
    expect(result).toHaveLength(1);
    expect(result[0].pack_id).toBe('CODE-101');
  });

  it('filters by specialized classification', () => {
    const result = registry.listByCategory('specialized');
    expect(result).toHaveLength(1);
    expect(result[0].pack_id).toBe('ASTRO-101');
  });

  it('returns empty array for category with no matches', () => {
    const singleRegistry = createRegistry();
    singleRegistry.register(makePack({ pack_id: 'X', classification: 'applied' }));
    expect(singleRegistry.listByCategory('core_academic')).toEqual([]);
  });
});

// ============================================================================
// PackRegistry.listByTier
// ============================================================================

describe('PackRegistry.listByTier', () => {
  let registry: PackRegistry;

  beforeEach(() => {
    registry = createRegistry();
    registry.register(makePack({ pack_id: 'MATH-101', classification: 'core_academic' }));
    registry.register(makePack({ pack_id: 'CODE-101', classification: 'applied' }));
  });

  it('works identically to listByCategory', () => {
    const byCategory = registry.listByCategory('core_academic');
    const byTier = registry.listByTier('core_academic');
    expect(byTier).toEqual(byCategory);
  });

  it('returns packs matching the tier string', () => {
    const result = registry.listByTier('applied');
    expect(result).toHaveLength(1);
    expect(result[0].pack_id).toBe('CODE-101');
  });
});

// ============================================================================
// PackRegistry.searchByTags
// ============================================================================

describe('PackRegistry.searchByTags', () => {
  let registry: PackRegistry;

  beforeEach(() => {
    registry = createRegistry();
    registry.register(makePack({ pack_id: 'MATH-101', tags: ['mathematics', 'stem', 'foundational'] }));
    registry.register(makePack({ pack_id: 'MUSIC-101', tags: ['music', 'arts', 'creative'] }));
    registry.register(makePack({ pack_id: 'CODE-101', tags: ['coding', 'stem', 'practical'] }));
  });

  it('returns pack matching exact tag', () => {
    const result = registry.searchByTags(['stem']);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('MATH-101');
    expect(ids).toContain('CODE-101');
  });

  it('returns empty for non-matching tag', () => {
    const result = registry.searchByTags(['nonexistent']);
    expect(result).toHaveLength(0);
  });

  it('supports partial tag matching (starts-with)', () => {
    const result = registry.searchByTags(['math']);
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('MATH-101');
  });

  it('supports multiple tags with OR logic', () => {
    const result = registry.searchByTags(['stem', 'music']);
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('MATH-101');
    expect(ids).toContain('CODE-101');
    expect(ids).toContain('MUSIC-101');
  });

  it('ranks by relevance (more tag matches = higher rank)', () => {
    // MATH-101 has stem + foundational
    // CODE-101 has stem + practical
    // Searching ['stem', 'foundational'] -> MATH-101 matches 2 tags, CODE-101 matches 1
    const result = registry.searchByTags(['stem', 'foundational']);
    expect(result[0].pack_id).toBe('MATH-101');
  });
});

// ============================================================================
// PackRegistry.search
// ============================================================================

describe('PackRegistry.search', () => {
  let registry: PackRegistry;

  beforeEach(() => {
    registry = createRegistry();
    registry.register(
      makePack({
        pack_id: 'MATH-101',
        pack_name: 'Mathematics Foundations',
        description: 'Core mathematical concepts for young learners.',
        short_description: 'Math basics',
        tags: ['mathematics', 'stem'],
      }),
    );
    registry.register(
      makePack({
        pack_id: 'CODE-101',
        pack_name: 'Coding Fundamentals',
        description: 'Introduction to pattern recognition and logical thinking.',
        short_description: 'Learn to code',
        tags: ['coding', 'logic'],
      }),
    );
  });

  it('matches via pack_id', () => {
    const result = registry.search('math');
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('MATH-101');
  });

  it('matches via description', () => {
    const result = registry.search('pattern recognition');
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('CODE-101');
  });

  it('is case-insensitive', () => {
    const result = registry.search('MATHEMATICS');
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('MATH-101');
  });

  it('returns empty for no matches', () => {
    const result = registry.search('quantum physics');
    expect(result).toHaveLength(0);
  });

  it('matches via tags', () => {
    const result = registry.search('stem');
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('MATH-101');
  });

  it('matches via pack_name', () => {
    const result = registry.search('fundamentals');
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('CODE-101');
  });

  it('matches via short_description', () => {
    const result = registry.search('basics');
    const ids = result.map((p) => p.pack_id);
    expect(ids).toContain('MATH-101');
  });
});

// ============================================================================
// PackRegistry.count
// ============================================================================

describe('PackRegistry.count', () => {
  it('returns 0 for empty registry', () => {
    const registry = createRegistry();
    expect(registry.count).toBe(0);
  });

  it('returns correct count after registrations', () => {
    const registry = createRegistry();
    registry.register(makePack({ pack_id: 'A' }));
    registry.register(makePack({ pack_id: 'B' }));
    expect(registry.count).toBe(2);
  });
});

// ============================================================================
// PackRegistry.clear
// ============================================================================

describe('PackRegistry.clear', () => {
  it('removes all registered packs', () => {
    const registry = createRegistry();
    registry.register(makePack({ pack_id: 'A' }));
    registry.register(makePack({ pack_id: 'B' }));
    expect(registry.count).toBe(2);
    registry.clear();
    expect(registry.count).toBe(0);
    expect(registry.listAll()).toEqual([]);
  });
});
