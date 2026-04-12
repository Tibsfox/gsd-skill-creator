import { describe, it, expect, beforeEach } from 'vitest';
import { LodService, LodLevel, LOD_SCALING, LOD_DESCRIPTORS } from '../index.js';
import type { LodContext } from '../index.js';

describe('LodService', () => {
  let service: LodService;

  beforeEach(() => {
    service = new LodService();
  });

  // ─── resolve() ───────────────────────────────────────────────────────────

  describe('resolve()', () => {
    it('returns DEFAULT_LOD (DETAILED) when no context signals', () => {
      expect(service.resolve({})).toBe(LodLevel.DETAILED);
    });

    it('explicit override always wins', () => {
      const context: LodContext = {
        override: LodLevel.CONCEPT,
        phase: 'execute', // would be FABRICATION
        effort: 'exhaustive', // would be AS_BUILT
      };
      expect(service.resolve(context)).toBe(LodLevel.CONCEPT);
    });

    it('maps GSD phases to LOD', () => {
      expect(service.resolve({ phase: 'discuss' })).toBe(LodLevel.SCHEMATIC);
      expect(service.resolve({ phase: 'plan' })).toBe(LodLevel.DETAILED);
      expect(service.resolve({ phase: 'execute' })).toBe(LodLevel.FABRICATION);
      expect(service.resolve({ phase: 'verify' })).toBe(LodLevel.AS_BUILT);
      expect(service.resolve({ phase: 'ship' })).toBe(LodLevel.AS_BUILT);
    });

    it('maps effort levels to LOD', () => {
      expect(service.resolve({ effort: 'minimal' })).toBe(LodLevel.CONCEPT);
      expect(service.resolve({ effort: 'standard' })).toBe(LodLevel.DETAILED);
      expect(service.resolve({ effort: 'thorough' })).toBe(LodLevel.FABRICATION);
      expect(service.resolve({ effort: 'exhaustive' })).toBe(LodLevel.AS_BUILT);
    });

    it('maps content types to LOD', () => {
      expect(service.resolve({ contentType: 'research' })).toBe(LodLevel.DETAILED);
      expect(service.resolve({ contentType: 'code' })).toBe(LodLevel.FABRICATION);
      expect(service.resolve({ contentType: 'report' })).toBe(LodLevel.SCHEMATIC);
    });

    it('maps token budgets to LOD', () => {
      expect(service.resolve({ tokenBudget: 3_000 })).toBe(LodLevel.CONCEPT);
      expect(service.resolve({ tokenBudget: 10_000 })).toBe(LodLevel.SCHEMATIC);
      expect(service.resolve({ tokenBudget: 25_000 })).toBe(LodLevel.DETAILED);
      expect(service.resolve({ tokenBudget: 40_000 })).toBe(LodLevel.CONSTRUCTION);
      expect(service.resolve({ tokenBudget: 60_000 })).toBe(LodLevel.FABRICATION);
      expect(service.resolve({ tokenBudget: 100_000 })).toBe(LodLevel.AS_BUILT);
    });

    it('takes minimum when multiple signals conflict', () => {
      // phase=execute → FABRICATION (400), effort=minimal → CONCEPT (100)
      // minimum wins → CONCEPT
      expect(service.resolve({
        phase: 'execute',
        effort: 'minimal',
      })).toBe(LodLevel.CONCEPT);
    });

    it('uses Magic level when set', () => {
      service.setMagicLevel(1); // FULL_MAGIC → CONCEPT
      expect(service.resolve({})).toBe(LodLevel.CONCEPT);

      service.setMagicLevel(4); // VERBOSE → FABRICATION
      expect(service.resolve({})).toBe(LodLevel.FABRICATION);
    });

    it('Magic level participates in minimum selection', () => {
      service.setMagicLevel(2); // GUIDED → SCHEMATIC (200)
      // phase=execute → FABRICATION (400)
      // minimum → SCHEMATIC (200)
      expect(service.resolve({ phase: 'execute' })).toBe(LodLevel.SCHEMATIC);
    });
  });

  // ─── getScaling() ────────────────────────────────────────────────────────

  describe('getScaling()', () => {
    it('returns scaling for each level', () => {
      const concept = service.getScaling(LodLevel.CONCEPT);
      expect(concept.wordCountMultiplier).toBe(0.1);
      expect(concept.includeCode).toBe(false);
      expect(concept.maxPasses).toBe(1);

      const fabrication = service.getScaling(LodLevel.FABRICATION);
      expect(fabrication.wordCountMultiplier).toBe(1.0);
      expect(fabrication.includeCode).toBe(true);
      expect(fabrication.maxPasses).toBe(8);
    });

    it('word count multipliers increase monotonically', () => {
      const levels = [
        LodLevel.CONCEPT, LodLevel.SCHEMATIC, LodLevel.DETAILED,
        LodLevel.CONSTRUCTION, LodLevel.FABRICATION, LodLevel.AS_BUILT,
      ];
      for (let i = 1; i < levels.length; i++) {
        const prev = service.getScaling(levels[i - 1]);
        const curr = service.getScaling(levels[i]);
        expect(curr.wordCountMultiplier).toBeGreaterThanOrEqual(prev.wordCountMultiplier);
      }
    });
  });

  // ─── shouldInclude() ─────────────────────────────────────────────────────

  describe('shouldInclude()', () => {
    it('CONCEPT includes only title, purpose, boundary', () => {
      expect(service.shouldInclude('title', LodLevel.CONCEPT)).toBe(true);
      expect(service.shouldInclude('purpose', LodLevel.CONCEPT)).toBe(true);
      expect(service.shouldInclude('boundary', LodLevel.CONCEPT)).toBe(true);
      expect(service.shouldInclude('approach', LodLevel.CONCEPT)).toBe(false);
      expect(service.shouldInclude('implementation-code', LodLevel.CONCEPT)).toBe(false);
      expect(service.shouldInclude('cross-references', LodLevel.CONCEPT)).toBe(false);
    });

    it('FABRICATION includes code and configs', () => {
      expect(service.shouldInclude('implementation-code', LodLevel.FABRICATION)).toBe(true);
      expect(service.shouldInclude('configuration', LodLevel.FABRICATION)).toBe(true);
      expect(service.shouldInclude('test-cases', LodLevel.FABRICATION)).toBe(true);
    });

    it('AS_BUILT includes everything', () => {
      expect(service.shouldInclude('verification-results', LodLevel.AS_BUILT)).toBe(true);
      expect(service.shouldInclude('maintenance-notes', LodLevel.AS_BUILT)).toBe(true);
      expect(service.shouldInclude('as-built-diff', LodLevel.AS_BUILT)).toBe(true);
    });

    it('code excluded below FABRICATION', () => {
      expect(service.shouldInclude('implementation-code', LodLevel.CONCEPT)).toBe(false);
      expect(service.shouldInclude('implementation-code', LodLevel.SCHEMATIC)).toBe(false);
      expect(service.shouldInclude('implementation-code', LodLevel.DETAILED)).toBe(false);
      expect(service.shouldInclude('implementation-code', LodLevel.CONSTRUCTION)).toBe(false);
      expect(service.shouldInclude('implementation-code', LodLevel.FABRICATION)).toBe(true);
    });
  });

  // ─── scaleWordCount() ────────────────────────────────────────────────────

  describe('scaleWordCount()', () => {
    it('scales base word count by LOD multiplier', () => {
      const base = 8000;
      expect(service.scaleWordCount(base, LodLevel.CONCEPT)).toBe(800);
      expect(service.scaleWordCount(base, LodLevel.SCHEMATIC)).toBe(2000);
      expect(service.scaleWordCount(base, LodLevel.DETAILED)).toBe(4000);
      expect(service.scaleWordCount(base, LodLevel.FABRICATION)).toBe(8000);
      expect(service.scaleWordCount(base, LodLevel.AS_BUILT)).toBe(9600);
    });
  });

  // ─── scaleTokenBudget() ──────────────────────────────────────────────────

  describe('scaleTokenBudget()', () => {
    it('scales token budget by LOD multiplier', () => {
      const base = 25000;
      expect(service.scaleTokenBudget(base, LodLevel.CONCEPT)).toBe(5000);
      expect(service.scaleTokenBudget(base, LodLevel.FABRICATION)).toBe(25000);
    });
  });

  // ─── estimateFromBudget() ────────────────────────────────────────────────

  describe('estimateFromBudget()', () => {
    it('maps token budgets to LOD levels', () => {
      expect(service.estimateFromBudget(2_000)).toBe(LodLevel.CONCEPT);
      expect(service.estimateFromBudget(10_000)).toBe(LodLevel.SCHEMATIC);
      expect(service.estimateFromBudget(20_000)).toBe(LodLevel.DETAILED);
      expect(service.estimateFromBudget(35_000)).toBe(LodLevel.CONSTRUCTION);
      expect(service.estimateFromBudget(70_000)).toBe(LodLevel.FABRICATION);
      expect(service.estimateFromBudget(200_000)).toBe(LodLevel.AS_BUILT);
    });
  });

  // ─── toPromptSuffix() ───────────────────────────────────────────────────

  describe('toPromptSuffix()', () => {
    it('generates prompt suffix for CONCEPT', () => {
      const suffix = service.toPromptSuffix(LodLevel.CONCEPT);
      expect(suffix).toContain('LOD 100');
      expect(suffix).toContain('Concept');
      expect(suffix).toContain('Do NOT include code blocks');
      expect(suffix).toContain('Do NOT include tables');
    });

    it('generates prompt suffix for FABRICATION without exclusions', () => {
      const suffix = service.toPromptSuffix(LodLevel.FABRICATION);
      expect(suffix).toContain('LOD 400');
      expect(suffix).toContain('Fabrication');
      expect(suffix).not.toContain('Do NOT include code blocks');
    });

    it('includes content strategy', () => {
      const suffix = service.toPromptSuffix(LodLevel.SCHEMATIC);
      expect(suffix).toContain('Section headers with 2-3 sentence descriptions');
    });
  });

  // ─── LOD_DESCRIPTORS completeness ─────────────────────────────────────────

  describe('LOD_DESCRIPTORS', () => {
    it('has a descriptor for every LodLevel', () => {
      const levels = [
        LodLevel.CONCEPT, LodLevel.SCHEMATIC, LodLevel.DETAILED,
        LodLevel.CONSTRUCTION, LodLevel.FABRICATION, LodLevel.AS_BUILT,
      ];
      for (const level of levels) {
        const d = LOD_DESCRIPTORS[level];
        expect(d).toBeDefined();
        expect(d.name).toBeTruthy();
        expect(d.bimAnalog).toBeTruthy();
        expect(d.gsdAnalog).toBeTruthy();
        expect(d.includes.length).toBeGreaterThan(0);
      }
    });

    it('includes grow monotonically (each level includes previous)', () => {
      const levels = [
        LodLevel.CONCEPT, LodLevel.SCHEMATIC, LodLevel.DETAILED,
        LodLevel.CONSTRUCTION, LodLevel.FABRICATION, LodLevel.AS_BUILT,
      ];
      for (let i = 1; i < levels.length; i++) {
        const prev = new Set(LOD_DESCRIPTORS[levels[i - 1]].includes);
        const curr = new Set(LOD_DESCRIPTORS[levels[i]].includes);
        for (const item of prev) {
          expect(curr.has(item)).toBe(true);
        }
      }
    });

    it('AS_BUILT excludes nothing', () => {
      expect(LOD_DESCRIPTORS[LodLevel.AS_BUILT].excludes).toHaveLength(0);
    });
  });

  // ─── LOD_SCALING completeness ──────────────────────────────────────────────

  describe('LOD_SCALING', () => {
    it('has scaling for every LodLevel', () => {
      const levels = [
        LodLevel.CONCEPT, LodLevel.SCHEMATIC, LodLevel.DETAILED,
        LodLevel.CONSTRUCTION, LodLevel.FABRICATION, LodLevel.AS_BUILT,
      ];
      for (const level of levels) {
        const s = LOD_SCALING[level];
        expect(s).toBeDefined();
        expect(s.wordCountMultiplier).toBeGreaterThan(0);
        expect(s.maxPasses).toBeGreaterThan(0);
        expect(s.targetSections).toBeGreaterThan(0);
      }
    });

    it('maxPasses increase with LOD', () => {
      expect(LOD_SCALING[LodLevel.CONCEPT].maxPasses)
        .toBeLessThanOrEqual(LOD_SCALING[LodLevel.FABRICATION].maxPasses);
    });
  });
});
