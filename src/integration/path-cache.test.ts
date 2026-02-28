/**
 * TDD tests for MFE composition path cache.
 *
 * Tests basic cache operations, LRU eviction, statistics tracking,
 * and cache management.
 *
 * @module integration/path-cache.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { CompositionPath, CompositionStep, DomainId } from '../core/types/mfe-types.js';
import { createPathCache, type PathCache } from './path-cache.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStep(n: number): CompositionStep {
  return {
    stepNumber: n,
    primitive: `perception-step-${n}`,
    action: `apply step ${n}`,
    justification: `because ${n}`,
    inputType: 'number',
    outputType: 'number',
    verificationStatus: 'passed',
  };
}

function makePath(id: number): CompositionPath {
  return {
    steps: [makeStep(1), makeStep(2)],
    totalCost: id * 0.5,
    domainsSpanned: ['perception', 'waves'] as DomainId[],
    verified: true,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PathCache', () => {
  let cache: PathCache;

  // =========================================================================
  // 1. Basic cache operations
  // =========================================================================

  describe('Basic cache operations', () => {
    beforeEach(() => {
      cache = createPathCache({ maxSize: 10 });
    });

    it('returns null for unknown hash (cache miss)', () => {
      const result = cache.get('unknown-hash');
      expect(result).toBeNull();
    });

    it('stores a path and retrieves it by hash', () => {
      const path = makePath(1);
      cache.put('hash-1', path);
      const result = cache.get('hash-1');
      expect(result).toEqual(path);
    });

    it('has() returns true for cached hash, false for unknown', () => {
      cache.put('hash-1', makePath(1));
      expect(cache.has('hash-1')).toBe(true);
      expect(cache.has('unknown')).toBe(false);
    });

    it('put() with same hash overwrites previous entry', () => {
      const path1 = makePath(1);
      const path2 = makePath(2);
      cache.put('hash-1', path1);
      cache.put('hash-1', path2);
      const result = cache.get('hash-1');
      expect(result).toEqual(path2);
      expect(cache.size).toBe(1);
    });
  });

  // =========================================================================
  // 2. LRU eviction
  // =========================================================================

  describe('LRU eviction', () => {
    it('evicts least-recently-used when maxSize exceeded', () => {
      cache = createPathCache({ maxSize: 3 });
      cache.put('a', makePath(1));
      cache.put('b', makePath(2));
      cache.put('c', makePath(3));
      // Cache: [a, b, c] — 'a' is LRU

      cache.put('d', makePath(4));
      // 'a' should be evicted
      expect(cache.get('a')).toBeNull();
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
      expect(cache.size).toBe(3);
    });

    it('get() moves entry to most-recently-used', () => {
      cache = createPathCache({ maxSize: 3 });
      cache.put('a', makePath(1));
      cache.put('b', makePath(2));
      cache.put('c', makePath(3));

      // Access 'a' — now MRU. Order: [b, c, a]
      cache.get('a');

      // Adding 'd' should evict 'b' (now LRU), not 'a'
      cache.put('d', makePath(4));
      expect(cache.has('a')).toBe(true);
      expect(cache.get('b')).toBeNull();
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('evicted entry returns null on get()', () => {
      cache = createPathCache({ maxSize: 2 });
      cache.put('a', makePath(1));
      cache.put('b', makePath(2));
      cache.put('c', makePath(3)); // Evicts 'a'

      expect(cache.get('a')).toBeNull();
    });
  });

  // =========================================================================
  // 3. Cache statistics
  // =========================================================================

  describe('Cache statistics', () => {
    beforeEach(() => {
      cache = createPathCache({ maxSize: 3 });
    });

    it('stats() returns hits, misses, size, evictions', () => {
      const stats = cache.stats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('evictions');
      expect(stats.maxSize).toBe(3);
    });

    it('hit count increments on cache hit', () => {
      cache.put('a', makePath(1));
      cache.get('a');
      cache.get('a');
      expect(cache.stats().hits).toBe(2);
    });

    it('miss count increments on cache miss', () => {
      cache.get('nonexistent');
      cache.get('also-missing');
      expect(cache.stats().misses).toBe(2);
    });
  });

  // =========================================================================
  // 4. Cache management
  // =========================================================================

  describe('Cache management', () => {
    it('clear() empties the cache and resets stats', () => {
      cache = createPathCache({ maxSize: 10 });
      cache.put('a', makePath(1));
      cache.put('b', makePath(2));
      cache.get('a'); // hit
      cache.get('missing'); // miss

      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.stats().hits).toBe(0);
      expect(cache.stats().misses).toBe(0);
      expect(cache.stats().evictions).toBe(0);
      expect(cache.get('a')).toBeNull();
    });

    it('size property reflects current entry count', () => {
      cache = createPathCache({ maxSize: 10 });
      expect(cache.size).toBe(0);
      cache.put('a', makePath(1));
      expect(cache.size).toBe(1);
      cache.put('b', makePath(2));
      expect(cache.size).toBe(2);
      cache.put('a', makePath(3)); // Overwrite, not new
      expect(cache.size).toBe(2);
    });
  });
});
