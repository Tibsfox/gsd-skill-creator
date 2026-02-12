/**
 * Unit tests for AdaptiveRouter.
 *
 * Tests cover query classification into TF-IDF (fast path) and
 * embedding (semantic path) based on query complexity heuristics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveRouter } from './adaptive-router.js';
import type { RouteDecision } from './types.js';

describe('AdaptiveRouter', () => {
  let router: AdaptiveRouter;

  beforeEach(() => {
    router = new AdaptiveRouter();
  });

  describe('classify() returns tfidf for single word queries', () => {
    it('routes "typescript" to tfidf', () => {
      const result = router.classify('typescript');
      expect(result.strategy).toBe('tfidf');
      expect(result.reason).toContain('keyword');
    });

    it('routes "git" to tfidf', () => {
      const result = router.classify('git');
      expect(result.strategy).toBe('tfidf');
    });
  });

  describe('classify() returns tfidf for two-word queries', () => {
    it('routes "git commit" to tfidf', () => {
      const result = router.classify('git commit');
      expect(result.strategy).toBe('tfidf');
    });

    it('routes "skill search" to tfidf', () => {
      const result = router.classify('skill search');
      expect(result.strategy).toBe('tfidf');
    });
  });

  describe('classify() returns embedding for 5+ word natural language queries', () => {
    it('routes "how do I create a new typescript skill" to embedding', () => {
      const result = router.classify('how do I create a new typescript skill');
      expect(result.strategy).toBe('embedding');
    });

    it('routes "find skills that help with code review and testing" to embedding', () => {
      const result = router.classify('find skills that help with code review and testing');
      expect(result.strategy).toBe('embedding');
    });
  });

  describe('classify() returns embedding for queries with semantic markers', () => {
    it('routes "how to deploy" to embedding (semantic marker despite 3 words)', () => {
      const result = router.classify('how to deploy');
      expect(result.strategy).toBe('embedding');
    });

    it('routes "what skills work with React" to embedding', () => {
      const result = router.classify('what skills work with React');
      expect(result.strategy).toBe('embedding');
    });

    it('routes "similar to git-commit" to embedding', () => {
      const result = router.classify('similar to git-commit');
      expect(result.strategy).toBe('embedding');
    });

    it('recognizes "help me" as semantic marker', () => {
      const result = router.classify('help me find tools');
      expect(result.strategy).toBe('embedding');
    });

    it('recognizes "I need" as semantic marker', () => {
      const result = router.classify('I need a linter');
      expect(result.strategy).toBe('embedding');
    });

    it('recognizes "looking for" as semantic marker', () => {
      const result = router.classify('looking for debugging skills');
      expect(result.strategy).toBe('embedding');
    });

    it('recognizes "find" as semantic marker', () => {
      const result = router.classify('find testing utilities');
      expect(result.strategy).toBe('embedding');
    });

    it('recognizes "which" as semantic marker', () => {
      const result = router.classify('which skill handles formatting');
      expect(result.strategy).toBe('embedding');
    });

    it('recognizes "why" as semantic marker', () => {
      const result = router.classify('why does linting fail');
      expect(result.strategy).toBe('embedding');
    });
  });

  describe('classify() returns tfidf for exact-name patterns', () => {
    it('routes "git-commit" (hyphenated) to tfidf', () => {
      const result = router.classify('git-commit');
      expect(result.strategy).toBe('tfidf');
    });

    it('routes "my-skill-name" (multi-hyphen) to tfidf', () => {
      const result = router.classify('my-skill-name');
      expect(result.strategy).toBe('tfidf');
    });
  });

  describe('classify() defaults to tfidf for moderate queries', () => {
    it('routes "testing utility skill" (3 words, no semantic markers) to tfidf', () => {
      const result = router.classify('testing utility skill');
      expect(result.strategy).toBe('tfidf');
      expect(result.reason).toContain('moderate');
    });

    it('routes "code review tools" (3 words, no semantic markers) to tfidf', () => {
      const result = router.classify('code review tools');
      expect(result.strategy).toBe('tfidf');
    });
  });

  describe('classify() handles edge cases', () => {
    it('routes empty string to tfidf (fast path default)', () => {
      const result = router.classify('');
      expect(result.strategy).toBe('tfidf');
    });

    it('routes whitespace only to tfidf', () => {
      const result = router.classify('   ');
      expect(result.strategy).toBe('tfidf');
    });

    it('routes very long query (20+ words) to embedding', () => {
      const longQuery = 'this is a very long query with many words that should definitely be routed to the embedding strategy for semantic analysis and matching';
      const words = longQuery.split(/\s+/);
      expect(words.length).toBeGreaterThanOrEqual(20);
      const result = router.classify(longQuery);
      expect(result.strategy).toBe('embedding');
    });
  });

  describe('classify() is synchronous', () => {
    it('returns RouteDecision directly (not a Promise)', () => {
      const result = router.classify('typescript');
      // If it were a Promise, it would have a .then method
      expect(typeof (result as any).then).not.toBe('function');
      // Verify it has the expected shape
      expect(result).toHaveProperty('strategy');
      expect(result).toHaveProperty('reason');
    });
  });

  describe('classify() performance', () => {
    it('completes 1000 iterations in under 1000ms (avg < 1ms)', () => {
      const iterations = 1000;
      const queries = [
        'typescript',
        'git commit',
        'how do I create a skill',
        'my-skill-name',
        'testing utility skill',
      ];

      const start = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        router.classify(queries[i % queries.length]);
      }
      const end = process.hrtime.bigint();

      const totalMs = Number(end - start) / 1_000_000;
      expect(totalMs).toBeLessThan(1000);
    });
  });
});
