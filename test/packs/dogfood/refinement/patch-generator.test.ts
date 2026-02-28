import { describe, it, expect } from 'vitest';
import type { GapRecord, GapType, GapSeverity } from '../../../../src/dogfood/verification/types.js';
import type { KnowledgePatch } from '../../../../src/dogfood/refinement/types.js';
import { generatePatches } from '../../../../src/dogfood/refinement/patch-generator.js';

// --- Factory ---

function makeGapRecord(overrides: Partial<GapRecord> = {}): GapRecord {
  return {
    id: 'gap-001',
    type: 'inconsistent',
    severity: 'significant',
    concept: 'Fourier Transform',
    textbookSource: 'Chapter 5, Section 3',
    ecosystemSource: 'skills/fourier-transform/SKILL.md#definition',
    textbookClaim: 'The Fourier transform decomposes a function into its constituent frequencies.',
    ecosystemClaim: 'The Fourier transform converts time-domain signals to frequency space.',
    analysis: 'The ecosystem description is technically correct but incomplete — it omits the decomposition aspect and limits to signals.',
    suggestedResolution: 'Update ecosystem definition to include function decomposition, not just signal conversion.',
    affectsComponents: ['concept-detector', 'position-mapper'],
    ...overrides,
  };
}

describe('patch-generator', () => {
  describe('patch generation from actionable gaps (REFINE-01)', () => {
    it('generates an update patch from an inconsistent gap', () => {
      const gap = makeGapRecord({ type: 'inconsistent' });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(1);
      expect(patches[0].patchType).toBe('update');
      expect(patches[0].currentContent).toBeTruthy();
      expect(patches[0].proposedContent).toBeTruthy();
      expect(patches[0].rationale).toContain('Chapter 5');
    });

    it('generates a replace patch from an outdated gap', () => {
      const gap = makeGapRecord({
        id: 'gap-002',
        type: 'outdated',
        concept: 'Laplace Transform',
        textbookSource: 'Chapter 8, Section 1',
        ecosystemSource: 'skills/laplace/SKILL.md#overview',
        textbookClaim: 'Modern formulation of Laplace transform uses bilateral integration.',
        ecosystemClaim: 'Laplace transform uses unilateral integration only.',
        analysis: 'Ecosystem uses outdated formulation.',
        suggestedResolution: 'Replace with bilateral formulation.',
      });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(1);
      expect(patches[0].patchType).toBe('replace');
    });

    it('generates an add patch from an incomplete gap', () => {
      const gap = makeGapRecord({
        id: 'gap-003',
        type: 'incomplete',
        concept: 'Convolution Theorem',
        textbookSource: 'Chapter 6',
        ecosystemSource: 'skills/convolution/SKILL.md',
        textbookClaim: 'Convolution theorem links multiplication in frequency domain to convolution in time domain.',
        ecosystemClaim: 'Convolution mentioned but not formally stated.',
        analysis: 'Missing formal statement of the theorem.',
        suggestedResolution: 'Add formal convolution theorem statement.',
      });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(1);
      expect(patches[0].patchType).toBe('add');
    });

    it('generates at least 3 patches from 5+ mixed gap records', () => {
      const gaps: GapRecord[] = [
        makeGapRecord({ id: 'gap-a', type: 'inconsistent' }),
        makeGapRecord({ id: 'gap-b', type: 'outdated' }),
        makeGapRecord({ id: 'gap-c', type: 'incomplete' }),
        makeGapRecord({ id: 'gap-d', type: 'verified' }),
        makeGapRecord({ id: 'gap-e', type: 'new-connection' }),
        makeGapRecord({ id: 'gap-f', type: 'missing-in-textbook' }),
      ];
      const patches = generatePatches(gaps);

      expect(patches.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('safety constraint (SAFETY-03)', () => {
    it('every patch has requiresReview set to true', () => {
      const gaps: GapRecord[] = [
        makeGapRecord({ id: 'gap-s1', type: 'inconsistent' }),
        makeGapRecord({ id: 'gap-s2', type: 'outdated' }),
        makeGapRecord({ id: 'gap-s3', type: 'incomplete' }),
      ];
      const patches = generatePatches(gaps);

      for (const patch of patches) {
        expect(patch.requiresReview).toBe(true);
      }
    });

    it('patches are data objects only — function returns array without side effects', () => {
      const gap = makeGapRecord();
      const patches = generatePatches([gap]);

      expect(Array.isArray(patches)).toBe(true);
      for (const patch of patches) {
        expect(typeof patch).toBe('object');
        expect(patch).toHaveProperty('id');
        expect(patch).toHaveProperty('patchType');
      }
    });
  });

  describe('cross-linking (REFINE-05)', () => {
    it('every patch has a gapId matching an input gap record id', () => {
      const gaps: GapRecord[] = [
        makeGapRecord({ id: 'gap-x1', type: 'inconsistent' }),
        makeGapRecord({ id: 'gap-x2', type: 'outdated' }),
      ];
      const gapIds = new Set(gaps.map(g => g.id));
      const patches = generatePatches(gaps);

      for (const patch of patches) {
        expect(patch.gapId).toBeTruthy();
        expect(gapIds.has(patch.gapId)).toBe(true);
      }
    });

    it('every patch has a non-empty targetDocument and targetSection', () => {
      const gap = makeGapRecord();
      const patches = generatePatches([gap]);

      for (const patch of patches) {
        expect(patch.targetDocument).toBeTruthy();
        expect(patch.targetSection).toBeTruthy();
      }
    });
  });

  describe('confidence scoring', () => {
    it('caps confidence below 0.8 for geometry-sensitive targets', () => {
      const gap = makeGapRecord({
        id: 'gap-geo1',
        ecosystemSource: 'docs/unit-circle-model.md#synthesis',
      });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(1);
      expect(patches[0].confidence).toBeLessThan(0.8);
    });

    it('gives confidence >= 0.8 for simple factual corrections', () => {
      const gap = makeGapRecord({
        id: 'gap-fact1',
        ecosystemSource: 'skills/basic-algebra/SKILL.md#definition',
      });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(1);
      expect(patches[0].confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('all patches have confidence in range [0.0, 1.0]', () => {
      const gaps: GapRecord[] = [
        makeGapRecord({ id: 'gap-c1', type: 'inconsistent', ecosystemSource: 'docs/unit-circle.md' }),
        makeGapRecord({ id: 'gap-c2', type: 'outdated', ecosystemSource: 'skills/calc/SKILL.md' }),
        makeGapRecord({ id: 'gap-c3', type: 'incomplete', ecosystemSource: 'docs/synthesis-overview.md' }),
      ];
      const patches = generatePatches(gaps);

      for (const patch of patches) {
        expect(patch.confidence).toBeGreaterThanOrEqual(0.0);
        expect(patch.confidence).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('minimal patching', () => {
    it('uses annotate patchType when gap suggests restructuring', () => {
      const gap = makeGapRecord({
        id: 'gap-ann1',
        type: 'incomplete',
        suggestedResolution: 'Restructure the entire section to better organize the content.',
      });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(1);
      expect(patches[0].patchType).toBe('annotate');
    });

    it('skips philosophical content gaps', () => {
      const gap = makeGapRecord({
        id: 'gap-phil1',
        type: 'inconsistent',
        analysis: 'This gap relates to the philosophy of consciousness and meaning of mathematical beauty.',
      });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(0);
    });
  });

  describe('non-actionable gaps', () => {
    it('produces no patches for verified gaps', () => {
      const gap = makeGapRecord({ id: 'gap-v1', type: 'verified' });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(0);
    });

    it('produces no patches for missing-in-textbook gaps', () => {
      const gap = makeGapRecord({ id: 'gap-mt1', type: 'missing-in-textbook' });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(0);
    });

    it('produces no patches for new-connection gaps', () => {
      const gap = makeGapRecord({ id: 'gap-nc1', type: 'new-connection' });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(0);
    });

    it('produces no patches for missing-in-ecosystem gaps', () => {
      const gap = makeGapRecord({ id: 'gap-me1', type: 'missing-in-ecosystem' });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(0);
    });

    it('produces no patches for differently-expressed gaps', () => {
      const gap = makeGapRecord({ id: 'gap-de1', type: 'differently-expressed' });
      const patches = generatePatches([gap]);

      expect(patches).toHaveLength(0);
    });
  });
});
