/**
 * Tests for ApproachPromoter
 *
 * Validates pattern promotion, trigger/action derivation, and SKILL.md output.
 */

import { describe, it, expect } from 'vitest';
import { ApproachPromoter } from '../approach-promoter.js';
import type { LearningPatternSuggestion } from '../learning-pattern-detector.js';

// ============================================================================
// Helpers
// ============================================================================

function makeSuggestion(
  confidence: number,
  type: 'sequence' | 'timing' | 'scoring' | 'engagement' = 'sequence',
  packIds: string[] = ['MATH-101'],
): LearningPatternSuggestion {
  return {
    id: `lp-${type}-test`,
    type,
    description: `Test ${type} pattern`,
    packIds,
    evidenceCount: 5,
    confidence,
    details: {},
    suggestedSkillName: `${type}-pattern-skill`,
    suggestedDescription: `A skill to address ${type} patterns`,
    applicablePacks: packIds,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ApproachPromoter', () => {
  describe('promote — high confidence', () => {
    it('includes suggestions above threshold', () => {
      const promoter = new ApproachPromoter({ minConfidence: 0.5 });
      const suggestions = [
        makeSuggestion(0.7, 'sequence'),
        makeSuggestion(0.3, 'timing'),
      ];

      const promoted = promoter.promote(suggestions);

      expect(promoted).toHaveLength(1);
      expect(promoted[0].skillName).toContain('sequence');
    });
  });

  describe('promote — low confidence filtered', () => {
    it('excludes suggestions below minConfidence', () => {
      const promoter = new ApproachPromoter({ minConfidence: 0.5 });
      const suggestions = [
        makeSuggestion(0.4, 'sequence'),
        makeSuggestion(0.3, 'timing'),
      ];

      const promoted = promoter.promote(suggestions);

      expect(promoted).toHaveLength(0);
    });
  });

  describe('promote — max cap', () => {
    it('respects maxPromotions limit', () => {
      const promoter = new ApproachPromoter({ maxPromotions: 2 });
      const suggestions = [
        makeSuggestion(0.9, 'sequence'),
        makeSuggestion(0.8, 'timing'),
        makeSuggestion(0.7, 'scoring'),
        makeSuggestion(0.6, 'engagement'),
      ];

      const promoted = promoter.promote(suggestions);

      expect(promoted).toHaveLength(2);
    });
  });

  describe('promote — sorted by confidence', () => {
    it('orders results by confidence descending', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [
        makeSuggestion(0.5, 'sequence'),
        makeSuggestion(0.9, 'timing'),
        makeSuggestion(0.7, 'scoring'),
      ];

      const promoted = promoter.promote(suggestions);

      expect(promoted[0].confidence).toBe(0.9);
      expect(promoted[1].confidence).toBe(0.7);
      expect(promoted[2].confidence).toBe(0.5);
    });
  });

  describe('promote — trigger conditions', () => {
    it('derives sequence triggers', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.7, 'sequence')];

      const promoted = promoter.promote(suggestions);

      expect(promoted[0].triggerConditions).toContain('learner starts a new module in applicable pack');
    });

    it('derives timing triggers', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.7, 'timing')];

      const promoted = promoter.promote(suggestions);

      expect(promoted[0].triggerConditions).toContain('learner spends less than average time on early module activities');
    });

    it('derives scoring triggers', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.7, 'scoring')];

      const promoted = promoter.promote(suggestions);

      expect(promoted[0].triggerConditions).toContain('learner assessment score drops between modules');
    });

    it('derives engagement triggers', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.7, 'engagement')];

      const promoted = promoter.promote(suggestions);

      expect(promoted[0].triggerConditions).toContain('learner skips activities in a module');
    });
  });

  describe('promote — action steps', () => {
    it('includes 2-3 concrete steps per promotion', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [
        makeSuggestion(0.7, 'sequence'),
        makeSuggestion(0.7, 'timing'),
        makeSuggestion(0.7, 'scoring'),
        makeSuggestion(0.7, 'engagement'),
      ];

      const promoted = promoter.promote(suggestions);

      for (const p of promoted) {
        expect(p.actionSteps.length).toBeGreaterThanOrEqual(2);
        expect(p.actionSteps.length).toBeLessThanOrEqual(4);
      }
    });
  });

  describe('promote — traceability', () => {
    it('matches sourcePatternId to input suggestion', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.7, 'sequence')];

      const promoted = promoter.promote(suggestions);

      expect(promoted[0].sourcePatternId).toBe('lp-sequence-test');
    });
  });

  describe('promote — empty input', () => {
    it('returns empty array for no suggestions', () => {
      const promoter = new ApproachPromoter();

      const promoted = promoter.promote([]);

      expect(promoted).toHaveLength(0);
    });
  });

  describe('toSkillMarkdown', () => {
    it('produces valid markdown with all sections', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.8, 'sequence')];
      const promoted = promoter.promote(suggestions)[0];

      const markdown = promoter.toSkillMarkdown(promoted);

      expect(markdown).toContain('# sequence-pattern-skill');
      expect(markdown).toContain('## Triggers');
      expect(markdown).toContain('## Steps');
      expect(markdown).toContain('## Applicable Packs');
      expect(markdown).toContain('---');
      expect(markdown).toContain('Confidence:');
      expect(markdown).toContain('Source Pattern:');
      expect(markdown).toContain('Promoted:');
    });
  });

  describe('toSkillMarkdown — contains triggers', () => {
    it('includes ## Triggers section with conditions', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.8, 'timing')];
      const promoted = promoter.promote(suggestions)[0];

      const markdown = promoter.toSkillMarkdown(promoted);

      expect(markdown).toContain('## Triggers');
      expect(markdown).toContain('- learner spends less than average time');
    });
  });

  describe('toSkillMarkdown — contains steps', () => {
    it('includes ## Steps section with numbered action steps', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.8, 'scoring')];
      const promoted = promoter.promote(suggestions)[0];

      const markdown = promoter.toSkillMarkdown(promoted);

      expect(markdown).toContain('## Steps');
      expect(markdown).toMatch(/^\d+\./m);
    });
  });

  describe('toSkillMarkdown — contains metadata', () => {
    it('includes confidence and source pattern in metadata', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.75, 'engagement')];
      const promoted = promoter.promote(suggestions)[0];

      const markdown = promoter.toSkillMarkdown(promoted);

      expect(markdown).toContain('Confidence: 75%');
      expect(markdown).toContain('Source Pattern: lp-engagement-test');
    });
  });

  describe('default config', () => {
    it('uses default minConfidence=0.5', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [
        makeSuggestion(0.49, 'sequence'),
        makeSuggestion(0.5, 'timing'),
      ];

      const promoted = promoter.promote(suggestions);

      expect(promoted).toHaveLength(1);
      expect(promoted[0].confidence).toBe(0.5);
    });

    it('uses default maxPromotions=5', () => {
      const promoter = new ApproachPromoter();
      const suggestions = Array.from({ length: 10 }, (_, i) =>
        makeSuggestion(0.9 - i * 0.05, ['sequence', 'timing', 'scoring', 'engagement'][i % 4] as any),
      );

      const promoted = promoter.promote(suggestions);

      expect(promoted.length).toBeLessThanOrEqual(5);
    });
  });

  describe('applicable packs', () => {
    it('includes applicable packs in promoted approach', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.8, 'sequence', ['MATH-101', 'SCI-101'])];

      const promoted = promoter.promote(suggestions);

      expect(promoted[0].applicablePacks).toEqual(['MATH-101', 'SCI-101']);
    });

    it('includes packs in markdown output', () => {
      const promoter = new ApproachPromoter();
      const suggestions = [makeSuggestion(0.8, 'sequence', ['MATH-101', 'SCI-101'])];
      const promoted = promoter.promote(suggestions)[0];

      const markdown = promoter.toSkillMarkdown(promoted);

      expect(markdown).toContain('MATH-101');
      expect(markdown).toContain('SCI-101');
    });
  });
});
