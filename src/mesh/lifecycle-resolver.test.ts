import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillLifecycleResolver, type SkillLifecycleState } from './lifecycle-resolver.js';
import type { SkillStore } from '../storage/skill-store.js';
import type { ResultStore } from '../testing/result-store.js';

// ============================================================================
// Mock factories
// ============================================================================

function mockSkillStore(overrides?: {
  exists?: (name: string) => Promise<boolean>;
  list?: () => Promise<string[]>;
}): Pick<SkillStore, 'exists' | 'list'> {
  return {
    exists: overrides?.exists ?? vi.fn().mockResolvedValue(true),
    list: overrides?.list ?? vi.fn().mockResolvedValue([]),
  } as unknown as Pick<SkillStore, 'exists' | 'list'>;
}

function mockResultStore(overrides?: {
  list?: (skillName: string) => Promise<unknown[]>;
}): Pick<ResultStore, 'list'> {
  return {
    list: overrides?.list ?? vi.fn().mockResolvedValue([]),
  } as unknown as Pick<ResultStore, 'list'>;
}

// ============================================================================
// SkillLifecycleResolver — state derivation
// ============================================================================

describe('SkillLifecycleResolver', () => {
  describe('resolve()', () => {
    it('returns "draft" when skill exists but has no results', async () => {
      const skillStore = mockSkillStore({
        exists: vi.fn().mockResolvedValue(true),
      });
      const resultStore = mockResultStore({
        list: vi.fn().mockResolvedValue([]),
      });

      const resolver = new SkillLifecycleResolver(
        skillStore as unknown as SkillStore,
        resultStore as unknown as ResultStore,
        'user',
      );

      const state = await resolver.resolve('existing-skill');
      expect(state).toBe('draft');
    });

    it('returns "tested" when results exist but none have graderChipName', async () => {
      const skillStore = mockSkillStore({
        exists: vi.fn().mockResolvedValue(true),
      });
      const resultStore = mockResultStore({
        list: vi.fn().mockResolvedValue([
          { id: 'run-1', metrics: { accuracy: 80 }, results: [], threshold: 0.75 },
          { id: 'run-2', metrics: { accuracy: 85 }, results: [], threshold: 0.75 },
        ]),
      });

      const resolver = new SkillLifecycleResolver(
        skillStore as unknown as SkillStore,
        resultStore as unknown as ResultStore,
        'user',
      );

      const state = await resolver.resolve('tested-skill');
      expect(state).toBe('tested');
    });

    it('returns "graded" when at least one result has graderChipName set', async () => {
      const skillStore = mockSkillStore({
        exists: vi.fn().mockResolvedValue(true),
      });
      const resultStore = mockResultStore({
        list: vi.fn().mockResolvedValue([
          { id: 'run-1', metrics: { accuracy: 80 }, results: [], threshold: 0.75 },
          {
            id: 'run-2',
            metrics: { accuracy: 90 },
            results: [],
            threshold: 0.75,
            graderChipName: 'claude-3-opus',
          },
        ]),
      });

      const resolver = new SkillLifecycleResolver(
        skillStore as unknown as SkillStore,
        resultStore as unknown as ResultStore,
        'user',
      );

      const state = await resolver.resolve('graded-skill');
      expect(state).toBe('graded');
    });

    it('throws Error("Skill not found: nonexistent") when skill does not exist', async () => {
      const skillStore = mockSkillStore({
        exists: vi.fn().mockResolvedValue(false),
      });
      const resultStore = mockResultStore();

      const resolver = new SkillLifecycleResolver(
        skillStore as unknown as SkillStore,
        resultStore as unknown as ResultStore,
        'user',
      );

      await expect(resolver.resolve('nonexistent')).rejects.toThrow('Skill not found: nonexistent');
    });

    it('returns "graded" when only graderChipName result exists (all graded)', async () => {
      const skillStore = mockSkillStore({
        exists: vi.fn().mockResolvedValue(true),
      });
      const resultStore = mockResultStore({
        list: vi.fn().mockResolvedValue([
          {
            id: 'run-1',
            metrics: { accuracy: 92 },
            results: [],
            threshold: 0.75,
            graderChipName: 'claude-3-sonnet',
            chipName: 'gpt-4',
          },
        ]),
      });

      const resolver = new SkillLifecycleResolver(
        skillStore as unknown as SkillStore,
        resultStore as unknown as ResultStore,
        'user',
      );

      const state = await resolver.resolve('fully-graded-skill');
      expect(state).toBe('graded');
    });
  });

  // ==========================================================================
  // listAll()
  // ==========================================================================

  describe('listAll()', () => {
    it('returns empty array when no skills exist', async () => {
      const skillStore = mockSkillStore({
        list: vi.fn().mockResolvedValue([]),
      });
      const resultStore = mockResultStore();

      const resolver = new SkillLifecycleResolver(
        skillStore as unknown as SkillStore,
        resultStore as unknown as ResultStore,
        'user',
      );

      const inventory = await resolver.listAll();
      expect(inventory).toEqual([]);
    });

    it('returns inventory of all skills with resolved states', async () => {
      const skillStore = mockSkillStore({
        exists: vi.fn().mockResolvedValue(true),
        list: vi.fn().mockResolvedValue(['draft-skill', 'tested-skill', 'graded-skill']),
      });
      const resultStore = mockResultStore({
        list: vi.fn().mockImplementation(async (skillName: string) => {
          if (skillName === 'draft-skill') return [];
          if (skillName === 'tested-skill') {
            return [{ id: 'r1', metrics: {}, results: [], threshold: 0.75 }];
          }
          if (skillName === 'graded-skill') {
            return [{ id: 'r1', metrics: {}, results: [], threshold: 0.75, graderChipName: 'claude-3' }];
          }
          return [];
        }),
      });

      const resolver = new SkillLifecycleResolver(
        skillStore as unknown as SkillStore,
        resultStore as unknown as ResultStore,
        'user',
      );

      const inventory = await resolver.listAll();
      expect(inventory).toHaveLength(3);

      const draftEntry = inventory.find((s) => s.name === 'draft-skill');
      const testedEntry = inventory.find((s) => s.name === 'tested-skill');
      const gradedEntry = inventory.find((s) => s.name === 'graded-skill');

      expect(draftEntry?.status).toBe('draft');
      expect(testedEntry?.status).toBe('tested');
      expect(gradedEntry?.status).toBe('graded');
    });

    it('returns "draft" for skills where resolve() throws (graceful degradation)', async () => {
      const skillStore = mockSkillStore({
        exists: vi.fn().mockRejectedValue(new Error('Store unavailable')),
        list: vi.fn().mockResolvedValue(['broken-skill']),
      });
      const resultStore = mockResultStore();

      const resolver = new SkillLifecycleResolver(
        skillStore as unknown as SkillStore,
        resultStore as unknown as ResultStore,
        'user',
      );

      const inventory = await resolver.listAll();
      expect(inventory).toHaveLength(1);
      expect(inventory[0].name).toBe('broken-skill');
      expect(inventory[0].status).toBe('draft');
    });
  });

  // ==========================================================================
  // SkillLifecycleState type
  // ==========================================================================

  describe('SkillLifecycleState type', () => {
    it('all valid states are assignable', () => {
      const states: SkillLifecycleState[] = ['draft', 'tested', 'graded', 'optimized', 'packaged'];
      expect(states).toHaveLength(5);
    });
  });
});
