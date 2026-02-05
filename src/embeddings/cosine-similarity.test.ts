import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from './cosine-similarity.js';

describe('cosineSimilarity', () => {
  describe('basic similarity cases', () => {
    it('returns 1.0 for identical vectors', () => {
      const vec = [1, 2, 3, 4, 5];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 10);
    });

    it('returns 1.0 for parallel vectors with different magnitudes', () => {
      const a = [1, 2, 3];
      const b = [2, 4, 6]; // Same direction, 2x magnitude
      expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 10);
    });

    it('returns -1.0 for opposite vectors', () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 10);
    });

    it('returns 0.0 for orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 10);
    });

    it('returns 0.0 for orthogonal vectors in 2D', () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 10);
    });
  });

  describe('zero vector handling', () => {
    it('returns 0.0 when first vector is zero', () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('returns 0.0 when second vector is zero', () => {
      const a = [1, 2, 3];
      const b = [0, 0, 0];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('returns 0.0 when both vectors are zero', () => {
      const a = [0, 0, 0];
      const b = [0, 0, 0];
      expect(cosineSimilarity(a, b)).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('throws error for empty vectors', () => {
      expect(() => cosineSimilarity([], [])).toThrow('Vectors must not be empty');
    });

    it('throws error when first vector is empty', () => {
      expect(() => cosineSimilarity([], [1, 2])).toThrow('Vectors must not be empty');
    });

    it('throws error when second vector is empty', () => {
      expect(() => cosineSimilarity([1, 2], [])).toThrow('Vectors must not be empty');
    });

    it('throws error for different length vectors', () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => cosineSimilarity(a, b)).toThrow('Vectors must have same length');
    });

    it('works with single-element vectors', () => {
      expect(cosineSimilarity([5], [5])).toBeCloseTo(1.0, 10);
      expect(cosineSimilarity([5], [-5])).toBeCloseTo(-1.0, 10);
    });
  });

  describe('normalized vectors', () => {
    it('works correctly with pre-normalized vectors', () => {
      // Unit vectors
      const a = [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)];
      const b = [1, 0, 0];
      // Dot product is 1/sqrt(3), magnitudes are 1 and 1
      expect(cosineSimilarity(a, b)).toBeCloseTo(1 / Math.sqrt(3), 10);
    });

    it('returns 1.0 for identical normalized vectors', () => {
      const norm = Math.sqrt(14);
      const vec = [1 / norm, 2 / norm, 3 / norm];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 10);
    });
  });

  describe('numerical precision', () => {
    it('handles very small values', () => {
      const a = [1e-100, 2e-100, 3e-100];
      const b = [1e-100, 2e-100, 3e-100];
      expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 10);
    });

    it('handles very large values', () => {
      const a = [1e100, 2e100, 3e100];
      const b = [1e100, 2e100, 3e100];
      expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 10);
    });

    it('handles mixed positive and negative values', () => {
      const a = [1, -2, 3, -4];
      const b = [2, -4, 6, -8];
      expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 10);
    });
  });

  describe('realistic embedding vectors', () => {
    it('computes similarity for 384-dim vectors', () => {
      // Simulate BGE-small output dimension
      const dim = 384;

      // Create two similar random vectors
      const base = Array.from({ length: dim }, () => Math.random() - 0.5);
      const similar = base.map((v) => v + (Math.random() - 0.5) * 0.1);

      const similarity = cosineSimilarity(base, similar);
      // Similar vectors should have high similarity
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('computes low similarity for unrelated vectors', () => {
      const dim = 384;

      // Create two completely independent random vectors
      const a = Array.from({ length: dim }, () => Math.random() - 0.5);
      const b = Array.from({ length: dim }, () => Math.random() - 0.5);

      const similarity = cosineSimilarity(a, b);
      // Random vectors in high dimensions tend toward orthogonal
      expect(Math.abs(similarity)).toBeLessThan(0.3);
    });
  });
});
