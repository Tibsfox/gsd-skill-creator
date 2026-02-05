/**
 * Unit tests for ActivationScorer.
 *
 * Tests cover scoring ranges, labels, individual factors, and batch scoring.
 * No mocking needed - ActivationScorer is pure heuristic analysis.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ActivationScorer } from './activation-scorer.js';

describe('ActivationScorer', () => {
  let scorer: ActivationScorer;

  beforeEach(() => {
    scorer = new ActivationScorer();
  });

  describe('score()', () => {
    it('returns score between 0 and 100', () => {
      const result = scorer.score({ name: 'test', description: 'A test skill' });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('returns high score for high-quality descriptions', () => {
      // High-quality description: starts with imperative verb, has activation pattern,
      // optimal length, specific terms, no generic terms
      const result = scorer.score({
        name: 'prisma-migrations',
        description: 'Execute Prisma migrations for PostgreSQL schemas. Use when deploying database changes to staging or production environments.',
      });
      // Should score at least "Likely" (70+) with all positive factors
      expect(['Reliable', 'Likely']).toContain(result.label);
      expect(result.score).toBeGreaterThanOrEqual(70);
      // Verify factors are all positive
      expect(result.factors.imperativeVerbScore).toBe(1.0); // starts with Execute
      expect(result.factors.activationPatternScore).toBeGreaterThan(0); // has "Use when"
      expect(result.factors.lengthScore).toBe(1.0); // optimal length
    });

    it('returns Unlikely label for vague descriptions', () => {
      const result = scorer.score({
        name: 'helper',
        description: 'Helps with stuff',
      });
      expect(result.label).toBe('Unlikely');
      expect(result.score).toBeLessThan(50);
    });

    it('returns Likely label for good but not excellent descriptions', () => {
      // Good description: starts with imperative verb, specific terms, no activation pattern
      const result = scorer.score({
        name: 'json-parser',
        description: 'Parse JSON configuration from YAML manifests and validate against schemas.',
      });
      expect(['Reliable', 'Likely']).toContain(result.label);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('returns Uncertain label for mediocre descriptions', () => {
      const result = scorer.score({
        name: 'code-helper',
        description: 'A tool that helps with code and files.',
      });
      expect(['Uncertain', 'Unlikely']).toContain(result.label);
      expect(result.score).toBeLessThan(70);
    });

    it('includes all factor scores', () => {
      const result = scorer.score({ name: 'test', description: 'Generate unit tests' });
      expect(result.factors).toHaveProperty('specificityScore');
      expect(result.factors).toHaveProperty('activationPatternScore');
      expect(result.factors).toHaveProperty('lengthScore');
      expect(result.factors).toHaveProperty('imperativeVerbScore');
      expect(result.factors).toHaveProperty('genericPenalty');
    });

    it('includes skill name and description in result', () => {
      const result = scorer.score({
        name: 'my-skill',
        description: 'My skill description',
      });
      expect(result.skillName).toBe('my-skill');
      expect(result.description).toBe('My skill description');
    });
  });

  describe('length scoring', () => {
    it('penalizes very short descriptions', () => {
      const result = scorer.score({ name: 'test', description: 'Git' });
      expect(result.factors.lengthScore).toBeLessThan(0.5);
    });

    it('penalizes extremely short descriptions heavily', () => {
      const result = scorer.score({ name: 'test', description: 'Hi' });
      expect(result.factors.lengthScore).toBe(0.2);
    });

    it('gives optimal score for medium descriptions', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Generate TypeScript types from OpenAPI schemas. Use when integrating REST APIs.',
      });
      expect(result.factors.lengthScore).toBeGreaterThanOrEqual(0.9);
    });

    it('gives optimal score for descriptions in 50-150 char range', () => {
      // Exactly 80 characters
      const result = scorer.score({
        name: 'test',
        description: 'Parse and validate JSON configuration files for development environment setup.',
      });
      expect(result.factors.lengthScore).toBe(1.0);
    });

    it('reduces score for very long descriptions', () => {
      const longDesc = 'This is a word. '.repeat(30); // ~480 chars
      const result = scorer.score({ name: 'test', description: longDesc });
      expect(result.factors.lengthScore).toBeLessThan(0.8);
    });

    it('gives 0.5 minimum for very long descriptions', () => {
      const veryLongDesc = 'word '.repeat(100); // 500 chars
      const result = scorer.score({ name: 'test', description: veryLongDesc });
      expect(result.factors.lengthScore).toBe(0.5);
    });
  });

  describe('activation patterns', () => {
    it('boosts score for "use when" pattern', () => {
      const withPattern = scorer.score({
        name: 'test',
        description: 'Formats code. Use when cleaning up before commit.',
      });
      const withoutPattern = scorer.score({
        name: 'test',
        description: 'Formats code for cleanup.',
      });
      expect(withPattern.factors.activationPatternScore).toBeGreaterThan(
        withoutPattern.factors.activationPatternScore
      );
    });

    it('boosts score for "when user asks" pattern', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Runs tests. Invoke when user asks to verify changes.',
      });
      expect(result.factors.activationPatternScore).toBeGreaterThan(0.3);
    });

    it('boosts score for "when working with" pattern', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Lint files when working with TypeScript projects.',
      });
      expect(result.factors.activationPatternScore).toBeGreaterThan(0);
    });

    it('stacks multiple activation patterns', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Use when debugging. Invoke when user asks for help. Apply when working on TypeScript.',
      });
      expect(result.factors.activationPatternScore).toBeGreaterThanOrEqual(0.8);
    });

    it('caps activation pattern score at 1.0', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Use when X. Use when Y. Use when Z. Invoke when A. Apply when B.',
      });
      expect(result.factors.activationPatternScore).toBeLessThanOrEqual(1.0);
    });

    it('returns 0 for descriptions without activation patterns', () => {
      const result = scorer.score({
        name: 'test',
        description: 'A simple tool for parsing data.',
      });
      expect(result.factors.activationPatternScore).toBe(0);
    });
  });

  describe('imperative verbs', () => {
    it('boosts score when starting with imperative verb', () => {
      const withVerb = scorer.score({
        name: 'test',
        description: 'Generate unit tests for React components.',
      });
      const withoutVerb = scorer.score({
        name: 'test',
        description: 'Unit tests for React components.',
      });
      expect(withVerb.factors.imperativeVerbScore).toBeGreaterThan(
        withoutVerb.factors.imperativeVerbScore
      );
    });

    it('gives full score for description starting with imperative verb', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Build production bundles for deployment.',
      });
      expect(result.factors.imperativeVerbScore).toBe(1.0);
    });

    it('gives partial score for imperative verb at sentence start', () => {
      const result = scorer.score({
        name: 'test',
        description: 'A deployment tool. Build production bundles when ready.',
      });
      expect(result.factors.imperativeVerbScore).toBe(0.8);
    });

    it('recognizes various imperative verbs', () => {
      const verbs = ['Create', 'Parse', 'Validate', 'Deploy', 'Configure', 'Extract'];
      for (const verb of verbs) {
        const result = scorer.score({
          name: 'test',
          description: `${verb} something useful.`,
        });
        expect(result.factors.imperativeVerbScore).toBe(1.0);
      }
    });

    it('gives baseline score without imperative verbs', () => {
      const result = scorer.score({
        name: 'test',
        description: 'A useful tool for development.',
      });
      expect(result.factors.imperativeVerbScore).toBe(0.5);
    });
  });

  describe('specificity', () => {
    it('rewards specific technology terms', () => {
      const specific = scorer.score({
        name: 'test',
        description: 'Run ESLint and Prettier on TypeScript files.',
      });
      const generic = scorer.score({
        name: 'test',
        description: 'Help with code quality stuff.',
      });
      expect(specific.factors.specificityScore).toBeGreaterThan(
        generic.factors.specificityScore
      );
    });

    it('penalizes descriptions with only generic terms', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Help with stuff and things in the project.',
      });
      expect(result.factors.specificityScore).toBeLessThan(0.5);
    });

    it('rewards domain-specific terminology', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Analyze GraphQL schemas and generate TypeScript resolvers.',
      });
      expect(result.factors.specificityScore).toBeGreaterThan(0.8);
    });

    it('returns 0.5 for empty description', () => {
      const result = scorer.score({ name: 'test', description: '' });
      expect(result.factors.specificityScore).toBe(0.5);
    });
  });

  describe('generic penalty', () => {
    it('applies penalty for generic terms', () => {
      const withGeneric = scorer.score({
        name: 'test',
        description: 'Help with code stuff in the project.',
      });
      const withoutGeneric = scorer.score({
        name: 'test',
        description: 'Lint TypeScript modules in monorepo.',
      });
      expect(withGeneric.factors.genericPenalty).toBeLessThan(
        withoutGeneric.factors.genericPenalty
      );
    });

    it('has minimum penalty of 0.5', () => {
      const result = scorer.score({
        name: 'test',
        description: 'help code stuff things work files data project app',
      });
      expect(result.factors.genericPenalty).toBeGreaterThanOrEqual(0.5);
    });

    it('gives full score (1.0) for no generic terms', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Analyze GraphQL schemas TypeScript resolvers.',
      });
      expect(result.factors.genericPenalty).toBe(1.0);
    });
  });

  describe('scoreBatch()', () => {
    it('scores multiple skills', () => {
      const results = scorer.scoreBatch([
        { name: 'a', description: 'First skill description here.' },
        { name: 'b', description: 'Second skill description here.' },
      ]);
      expect(results).toHaveLength(2);
      expect(results[0].skillName).toBe('a');
      expect(results[1].skillName).toBe('b');
    });

    it('returns empty array for empty input', () => {
      const results = scorer.scoreBatch([]);
      expect(results).toEqual([]);
    });

    it('maintains order of input', () => {
      const results = scorer.scoreBatch([
        { name: 'z', description: 'Zebra' },
        { name: 'a', description: 'Apple' },
        { name: 'm', description: 'Mango' },
      ]);
      expect(results.map((r) => r.skillName)).toEqual(['z', 'a', 'm']);
    });
  });

  describe('custom weights', () => {
    it('accepts custom weight configuration', () => {
      const customScorer = new ActivationScorer({
        weights: { specificityWeight: 0.5 },
      });
      const result = customScorer.score({ name: 'test', description: 'Test skill description.' });
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('merges custom weights with defaults', () => {
      const customScorer = new ActivationScorer({
        weights: { specificityWeight: 1.0 },
      });
      // With specificityWeight at 1.0 and specific terms, should score higher
      const specificResult = customScorer.score({
        name: 'test',
        description: 'TypeScript GraphQL ESLint Prettier',
      });
      // Compare with default scorer
      const defaultResult = scorer.score({
        name: 'test',
        description: 'TypeScript GraphQL ESLint Prettier',
      });
      expect(specificResult.score).toBeGreaterThan(defaultResult.score);
    });

    it('handles zero weights', () => {
      const customScorer = new ActivationScorer({
        weights: {
          specificityWeight: 0,
          activationPatternWeight: 0,
          lengthWeight: 0,
          imperativeVerbWeight: 0,
          genericPenaltyWeight: 0,
        },
      });
      const result = customScorer.score({ name: 'test', description: 'Any description' });
      expect(result.score).toBe(0);
    });
  });

  describe('label thresholds', () => {
    it('returns Reliable for score >= 90', () => {
      const scorer = new ActivationScorer({
        weights: {
          specificityWeight: 1.0,
          activationPatternWeight: 0,
          lengthWeight: 0,
          imperativeVerbWeight: 0,
          genericPenaltyWeight: 0,
        },
      });
      const result = scorer.score({
        name: 'test',
        description: 'TypeScript GraphQL ESLint Prettier Webpack',
      });
      // All specific terms = specificityScore 1.0, weight 1.0 = 100
      expect(result.label).toBe('Reliable');
    });

    it('returns Likely for score 70-89', () => {
      const scorer = new ActivationScorer({
        weights: {
          specificityWeight: 0.8,
          activationPatternWeight: 0,
          lengthWeight: 0,
          imperativeVerbWeight: 0,
          genericPenaltyWeight: 0,
        },
      });
      const result = scorer.score({
        name: 'test',
        description: 'TypeScript GraphQL ESLint Prettier Webpack',
      });
      expect(result.score).toBe(80);
      expect(result.label).toBe('Likely');
    });

    it('returns Uncertain for score 50-69', () => {
      const scorer = new ActivationScorer({
        weights: {
          specificityWeight: 0.6,
          activationPatternWeight: 0,
          lengthWeight: 0,
          imperativeVerbWeight: 0,
          genericPenaltyWeight: 0,
        },
      });
      const result = scorer.score({
        name: 'test',
        description: 'TypeScript GraphQL ESLint Prettier Webpack',
      });
      expect(result.score).toBe(60);
      expect(result.label).toBe('Uncertain');
    });

    it('returns Unlikely for score < 50', () => {
      const scorer = new ActivationScorer({
        weights: {
          specificityWeight: 0.4,
          activationPatternWeight: 0,
          lengthWeight: 0,
          imperativeVerbWeight: 0,
          genericPenaltyWeight: 0,
        },
      });
      const result = scorer.score({
        name: 'test',
        description: 'TypeScript GraphQL ESLint Prettier Webpack',
      });
      expect(result.score).toBe(40);
      expect(result.label).toBe('Unlikely');
    });
  });

  describe('edge cases', () => {
    it('handles empty description', () => {
      const result = scorer.score({ name: 'test', description: '' });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.label).toBe('Unlikely');
    });

    it('handles description with only stop words', () => {
      const result = scorer.score({
        name: 'test',
        description: 'the a an is are was were be been',
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('handles description with special characters', () => {
      const result = scorer.score({
        name: 'test',
        description: 'Parse JSON!!! Generate @types... Handle $special chars???',
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('handles very long skill name', () => {
      const result = scorer.score({
        name: 'a'.repeat(1000),
        description: 'Normal description here.',
      });
      expect(result.skillName).toBe('a'.repeat(1000));
    });

    it('is case-insensitive for term matching', () => {
      const lower = scorer.score({
        name: 'test',
        description: 'generate typescript code',
      });
      const upper = scorer.score({
        name: 'test',
        description: 'GENERATE TYPESCRIPT CODE',
      });
      expect(lower.factors.imperativeVerbScore).toBe(upper.factors.imperativeVerbScore);
    });
  });
});
