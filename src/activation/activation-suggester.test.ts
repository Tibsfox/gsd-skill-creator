import { describe, it, expect } from 'vitest';
import { ActivationSuggester } from './activation-suggester.js';
import type { ActivationScore, ScoringFactors, ActivationLabel } from '../types/activation.js';

function makeScore(overrides: Partial<ActivationScore> & { score: number }): ActivationScore {
  const defaultFactors: ScoringFactors = {
    specificityScore: 0.8,
    activationPatternScore: 0.8,
    lengthScore: 0.8,
    imperativeVerbScore: 0.8,
    genericPenalty: 0.8,
  };

  const getLabel = (score: number): ActivationLabel => {
    if (score >= 90) return 'Reliable';
    if (score >= 70) return 'Likely';
    if (score >= 50) return 'Uncertain';
    return 'Unlikely';
  };

  return {
    skillName: 'test-skill',
    score: overrides.score,
    label: getLabel(overrides.score),
    factors: { ...defaultFactors, ...overrides.factors },
    description: overrides.description ?? 'Test description',
  };
}

describe('ActivationSuggester', () => {
  const suggester = new ActivationSuggester();

  describe('tiered suggestions', () => {
    it('returns no suggestions for Reliable scores', () => {
      const result = makeScore({ score: 95 });
      const suggestions = suggester.suggest(result);
      expect(suggestions).toHaveLength(0);
    });

    it('returns 1 suggestion for Likely scores', () => {
      const result = makeScore({
        score: 75,
        factors: {
          specificityScore: 0.8,
          activationPatternScore: 0.3, // Low - triggers suggestion
          lengthScore: 0.8,
          imperativeVerbScore: 0.8,
          genericPenalty: 0.8,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions.length).toBeLessThanOrEqual(1);
    });

    it('returns up to 3 suggestions for Uncertain scores', () => {
      const result = makeScore({
        score: 55,
        factors: {
          specificityScore: 0.3,
          activationPatternScore: 0.3,
          lengthScore: 0.5,
          imperativeVerbScore: 0.5,
          genericPenalty: 0.6,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('returns up to 5 suggestions for Unlikely scores', () => {
      const result = makeScore({
        score: 30,
        factors: {
          specificityScore: 0.2,
          activationPatternScore: 0.2,
          lengthScore: 0.3,
          imperativeVerbScore: 0.3,
          genericPenalty: 0.4,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('suggestion types', () => {
    it('suggests activation phrase when pattern score is low', () => {
      const result = makeScore({
        score: 60,
        factors: {
          specificityScore: 0.9,
          activationPatternScore: 0.2,
          lengthScore: 0.9,
          imperativeVerbScore: 0.9,
          genericPenalty: 0.9,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions.some(s => s.type === 'addActivationPhrase')).toBe(true);
    });

    it('suggests specificity when specificity score is low', () => {
      const result = makeScore({
        score: 60,
        factors: {
          specificityScore: 0.3,
          activationPatternScore: 0.9,
          lengthScore: 0.9,
          imperativeVerbScore: 0.9,
          genericPenalty: 0.9,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions.some(s => s.type === 'addSpecificity')).toBe(true);
    });

    it('suggests length adjustment for short descriptions', () => {
      const result = makeScore({
        score: 60,
        description: 'Short',
        factors: {
          specificityScore: 0.9,
          activationPatternScore: 0.9,
          lengthScore: 0.3,
          imperativeVerbScore: 0.9,
          genericPenalty: 0.9,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions.some(s => s.type === 'adjustLength')).toBe(true);
    });

    it('suggests imperative verb when verb score is low', () => {
      const result = makeScore({
        score: 60,
        factors: {
          specificityScore: 0.9,
          activationPatternScore: 0.9,
          lengthScore: 0.9,
          imperativeVerbScore: 0.3,
          genericPenalty: 0.9,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions.some(s => s.type === 'addImperative')).toBe(true);
    });

    it('suggests reducing generic terms when penalty is high', () => {
      const result = makeScore({
        score: 60,
        factors: {
          specificityScore: 0.9,
          activationPatternScore: 0.9,
          lengthScore: 0.9,
          imperativeVerbScore: 0.9,
          genericPenalty: 0.5,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions.some(s => s.type === 'reduceGeneric')).toBe(true);
    });
  });

  describe('suggestion content', () => {
    it('includes example with before and after', () => {
      const result = makeScore({
        score: 40,
        factors: {
          specificityScore: 0.3,
          activationPatternScore: 0.2,
          lengthScore: 0.5,
          imperativeVerbScore: 0.5,
          genericPenalty: 0.6,
        }
      });
      const suggestions = suggester.suggest(result);
      const withExample = suggestions.find(s => s.example);
      expect(withExample).toBeDefined();
      expect(withExample?.example?.before).toBeDefined();
      expect(withExample?.example?.after).toBeDefined();
    });

    it('all suggestions have text', () => {
      const result = makeScore({
        score: 30,
        factors: {
          specificityScore: 0.2,
          activationPatternScore: 0.2,
          lengthScore: 0.3,
          imperativeVerbScore: 0.3,
          genericPenalty: 0.4,
        }
      });
      const suggestions = suggester.suggest(result);
      for (const suggestion of suggestions) {
        expect(suggestion.text).toBeDefined();
        expect(suggestion.text.length).toBeGreaterThan(0);
      }
    });
  });

  describe('priority ordering', () => {
    it('prioritizes activation phrase over other suggestions', () => {
      const result = makeScore({
        score: 40,
        factors: {
          specificityScore: 0.3,
          activationPatternScore: 0.2, // Low - should be first
          lengthScore: 0.3,
          imperativeVerbScore: 0.3,
          genericPenalty: 0.4,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions[0].type).toBe('addActivationPhrase');
    });

    it('prioritizes specificity over imperative and length', () => {
      const result = makeScore({
        score: 40,
        factors: {
          specificityScore: 0.3, // Low - should be second
          activationPatternScore: 0.9, // High - no suggestion
          lengthScore: 0.3,
          imperativeVerbScore: 0.3,
          genericPenalty: 0.4,
        }
      });
      const suggestions = suggester.suggest(result);
      expect(suggestions[0].type).toBe('addSpecificity');
    });
  });
});
