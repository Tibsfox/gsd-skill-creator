import { describe, it, expect } from 'vitest';
import type { GapRecord } from '../../../../src/packs/dogfood/verification/types.js';
import type { LearnedConcept } from '../../../../src/packs/dogfood/learning/types.js';
import type { SkillUpdate } from '../../../../src/packs/dogfood/refinement/types.js';
import { refineSkills } from '../../../../src/packs/dogfood/refinement/skill-refiner.js';

// --- Factories ---

function makeLearnedConcept(overrides: Partial<LearnedConcept> = {}): LearnedConcept {
  return {
    id: 'concept-001',
    name: 'Fourier Transform',
    sourceChunk: 'part-02-ch-05-sec-03',
    sourceChapter: 5,
    sourcePart: 2,
    theta: Math.PI / 4,
    radius: 0.6,
    angularVelocity: 0.05,
    definition: 'The Fourier transform decomposes a function into its constituent frequencies via integration.',
    keyRelationships: ['Laplace Transform', 'Frequency Domain'],
    prerequisites: ['Integration', 'Complex Numbers'],
    applications: ['Signal Processing', 'Spectral Analysis'],
    ecosystemMappings: [
      {
        document: 'skills/fourier-transform/SKILL.md',
        section: 'definition',
        relationship: 'refines' as const,
        notes: 'Ecosystem has simplified version.',
      },
    ],
    confidence: 0.85,
    mathDensity: 0.7,
    abstractionLevel: 0.6,
    detectedAt: '2026-02-26T10:00:00Z',
    ...overrides,
  };
}

function makeGapRecordForSkill(overrides: Partial<GapRecord> = {}): GapRecord {
  return {
    id: 'gap-sk001',
    type: 'verified',
    severity: 'informational',
    concept: 'Fourier Transform',
    textbookSource: 'Chapter 5, Section 3',
    ecosystemSource: 'skills/fourier-transform/SKILL.md',
    textbookClaim: 'Standard Fourier transform definition.',
    ecosystemClaim: 'Ecosystem Fourier transform definition.',
    analysis: 'Definitions are consistent.',
    suggestedResolution: 'No changes needed.',
    affectsComponents: [],
    ...overrides,
  };
}

describe('skill-refiner', () => {
  describe('skill generation (REFINE-03)', () => {
    it('generates a refine update for a verified concept with ecosystem mapping', () => {
      const concept = makeLearnedConcept();
      const gap = makeGapRecordForSkill({ concept: 'Fourier Transform', type: 'verified' });
      const updates = refineSkills([concept], [gap]);

      expect(updates.length).toBeGreaterThanOrEqual(1);
      const update = updates[0];
      expect(update.action).toBe('refine');
    });

    it('generates a create update for a concept not in ecosystem', () => {
      const concept = makeLearnedConcept({
        id: 'concept-new',
        name: 'Wavelet Transform',
        ecosystemMappings: [],
        confidence: 0.9,
      });
      const gap = makeGapRecordForSkill({
        id: 'gap-new',
        concept: 'Wavelet Transform',
        type: 'missing-in-ecosystem',
      });
      const updates = refineSkills([concept], [gap]);

      expect(updates.length).toBeGreaterThanOrEqual(1);
      const update = updates.find(u => u.skillName.includes('wavelet'));
      expect(update).toBeDefined();
      expect(update!.action).toBe('create');
    });

    it('generates a merge update for two concepts mapping to the same skill', () => {
      const concept1 = makeLearnedConcept({
        id: 'concept-m1',
        name: 'DFT',
        confidence: 0.8,
        ecosystemMappings: [{
          document: 'skills/discrete-fourier/SKILL.md',
          section: 'definition',
          relationship: 'identical' as const,
          notes: 'Same skill.',
        }],
      });
      const concept2 = makeLearnedConcept({
        id: 'concept-m2',
        name: 'Discrete Fourier Transform',
        confidence: 0.8,
        ecosystemMappings: [{
          document: 'skills/discrete-fourier/SKILL.md',
          section: 'overview',
          relationship: 'identical' as const,
          notes: 'Same skill under different name.',
        }],
      });
      const gaps: GapRecord[] = [
        makeGapRecordForSkill({ id: 'gap-m1', concept: 'DFT', type: 'verified' }),
        makeGapRecordForSkill({ id: 'gap-m2', concept: 'Discrete Fourier Transform', type: 'verified' }),
      ];
      const updates = refineSkills([concept1, concept2], gaps);

      const mergeUpdate = updates.find(u => u.action === 'merge');
      expect(mergeUpdate).toBeDefined();
    });
  });

  describe('complex plane positioning', () => {
    it('every SkillUpdate has valid theta (0 to 2*PI) and radius > 0', () => {
      const concept = makeLearnedConcept();
      const gap = makeGapRecordForSkill();
      const updates = refineSkills([concept], [gap]);

      for (const update of updates) {
        expect(update.complexPlanePosition.theta).toBeGreaterThanOrEqual(0);
        expect(update.complexPlanePosition.theta).toBeLessThanOrEqual(2 * Math.PI);
        expect(update.complexPlanePosition.radius).toBeGreaterThan(0);
      }
    });

    it('position derived from the source concept complexPlanePosition', () => {
      const concept = makeLearnedConcept({
        theta: 1.23,
        radius: 0.45,
      });
      const gap = makeGapRecordForSkill();
      const updates = refineSkills([concept], [gap]);

      expect(updates.length).toBeGreaterThanOrEqual(1);
      expect(updates[0].complexPlanePosition.theta).toBe(1.23);
      expect(updates[0].complexPlanePosition.radius).toBe(0.45);
    });

    it('positions for Part III concepts are near theta ~ PI/4', () => {
      const concept = makeLearnedConcept({
        sourcePart: 3,
        theta: Math.PI / 4 + 0.05,
        radius: 0.5,
      });
      const gap = makeGapRecordForSkill();
      const updates = refineSkills([concept], [gap]);

      expect(updates.length).toBeGreaterThanOrEqual(1);
      const theta = updates[0].complexPlanePosition.theta;
      expect(Math.abs(theta - Math.PI / 4)).toBeLessThan(0.5);
    });
  });

  describe('evidence linking (REFINE-05)', () => {
    it('every SkillUpdate has non-empty evidenceFromTextbook citing chapter', () => {
      const concept = makeLearnedConcept({ sourceChapter: 7 });
      const gap = makeGapRecordForSkill();
      const updates = refineSkills([concept], [gap]);

      for (const update of updates) {
        expect(update.evidenceFromTextbook).toBeTruthy();
        expect(update.evidenceFromTextbook).toContain('Chapter 7');
      }
    });

    it('has evidenceFromEcosystem from ecosystem mapping for refine', () => {
      const concept = makeLearnedConcept();
      const gap = makeGapRecordForSkill();
      const updates = refineSkills([concept], [gap]);

      for (const update of updates) {
        expect(update.evidenceFromEcosystem).toBeTruthy();
        expect(update.evidenceFromEcosystem).toContain('skills/fourier-transform/SKILL.md');
      }
    });

    it('has "New knowledge" evidence for create actions', () => {
      const concept = makeLearnedConcept({
        id: 'concept-nk',
        name: 'Novel Concept',
        ecosystemMappings: [],
        confidence: 0.9,
      });
      const gap = makeGapRecordForSkill({
        id: 'gap-nk',
        concept: 'Novel Concept',
        type: 'missing-in-ecosystem',
      });
      const updates = refineSkills([concept], [gap]);

      const createUpdate = updates.find(u => u.action === 'create');
      expect(createUpdate).toBeDefined();
      expect(createUpdate!.evidenceFromEcosystem).toContain('New knowledge');
    });
  });

  describe('trigger patterns', () => {
    it('every SkillUpdate has at least 1 trigger pattern', () => {
      const concept = makeLearnedConcept();
      const gap = makeGapRecordForSkill();
      const updates = refineSkills([concept], [gap]);

      for (const update of updates) {
        expect(update.triggerPatterns.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('trigger patterns are descriptive strings', () => {
      const concept = makeLearnedConcept();
      const gap = makeGapRecordForSkill();
      const updates = refineSkills([concept], [gap]);

      for (const update of updates) {
        for (const pattern of update.triggerPatterns) {
          expect(typeof pattern).toBe('string');
          expect(pattern.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('filtering', () => {
    it('skips concepts with confidence below 0.7', () => {
      const concept = makeLearnedConcept({
        id: 'concept-low',
        name: 'Uncertain Concept',
        confidence: 0.3,
      });
      const gap = makeGapRecordForSkill({ concept: 'Uncertain Concept' });
      const updates = refineSkills([concept], [gap]);

      expect(updates).toHaveLength(0);
    });

    it('includes concepts with high confidence and no ecosystem mapping if important', () => {
      const concept = makeLearnedConcept({
        id: 'concept-new-imp',
        name: 'Important New Concept',
        ecosystemMappings: [],
        confidence: 0.95,
      });
      const gap = makeGapRecordForSkill({
        id: 'gap-imp',
        concept: 'Important New Concept',
        type: 'missing-in-ecosystem',
        severity: 'significant',
      });
      const updates = refineSkills([concept], [gap]);

      expect(updates.length).toBeGreaterThanOrEqual(1);
    });
  });
});
