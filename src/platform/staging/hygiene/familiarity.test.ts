/**
 * Tests for familiarity tier classification logic.
 *
 * @module staging/hygiene/familiarity.test
 */

import { describe, it, expect } from 'vitest';
import { classifyFamiliarity } from './familiarity.js';
import type { ContentSourceInfo } from './trust-types.js';

describe('classifyFamiliarity', () => {
  describe('Home tier', () => {
    it('classifies origin "local-project" as home', () => {
      const result = classifyFamiliarity({ origin: 'local-project' });
      expect(result.tier).toBe('home');
    });

    it('classifies isProjectLocal: true as home regardless of origin', () => {
      const result = classifyFamiliarity({
        origin: 'external',
        isProjectLocal: true,
      });
      expect(result.tier).toBe('home');
    });

    it('returns a non-empty reason for home tier', () => {
      const result = classifyFamiliarity({ origin: 'local-project' });
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  describe('Neighborhood tier', () => {
    it('classifies origin "local-user" as neighborhood', () => {
      const result = classifyFamiliarity({ origin: 'local-user' });
      expect(result.tier).toBe('neighborhood');
    });

    it('classifies isUserLocal: true as neighborhood', () => {
      const result = classifyFamiliarity({
        origin: 'external',
        isUserLocal: true,
      });
      expect(result.tier).toBe('neighborhood');
    });

    it('classifies repoId in trustedRepos as neighborhood', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
        repoId: 'my-org/trusted-repo',
        trustedRepos: ['my-org/trusted-repo', 'other-org/also-trusted'],
      });
      expect(result.tier).toBe('neighborhood');
    });

    it('returns a non-empty reason for neighborhood tier', () => {
      const result = classifyFamiliarity({ origin: 'local-user' });
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  describe('Town tier', () => {
    it('classifies origin "known-repo" without trustedRepos match as town', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
        repoId: 'some-org/some-repo',
        trustedRepos: ['other-org/different-repo'],
      });
      expect(result.tier).toBe('town');
    });

    it('classifies origin "known-repo" with no repoId as town', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
      });
      expect(result.tier).toBe('town');
    });

    it('classifies origin "known-repo" with empty trustedRepos as town', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
        repoId: 'some-org/some-repo',
        trustedRepos: [],
      });
      expect(result.tier).toBe('town');
    });

    it('returns a non-empty reason for town tier', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
        repoId: 'some-org/some-repo',
      });
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  describe('Stranger tier (default)', () => {
    it('classifies origin "external" as stranger', () => {
      const result = classifyFamiliarity({ origin: 'external' });
      expect(result.tier).toBe('stranger');
    });

    it('classifies origin "unknown" as stranger', () => {
      const result = classifyFamiliarity({ origin: 'unknown' });
      expect(result.tier).toBe('stranger');
    });

    it('classifies unrecognized origin as stranger', () => {
      const result = classifyFamiliarity({ origin: 'something-weird' });
      expect(result.tier).toBe('stranger');
    });

    it('classifies empty string origin as stranger', () => {
      const result = classifyFamiliarity({ origin: '' });
      expect(result.tier).toBe('stranger');
    });

    it('returns a non-empty reason for stranger tier', () => {
      const result = classifyFamiliarity({ origin: 'external' });
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  describe('priority ordering', () => {
    it('home takes priority over neighborhood (isProjectLocal + isUserLocal)', () => {
      const result = classifyFamiliarity({
        origin: 'local-user',
        isProjectLocal: true,
        isUserLocal: true,
      });
      expect(result.tier).toBe('home');
    });

    it('home takes priority over town (isProjectLocal + known-repo)', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
        isProjectLocal: true,
      });
      expect(result.tier).toBe('home');
    });

    it('neighborhood takes priority over town (isUserLocal + known-repo)', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
        isUserLocal: true,
        repoId: 'some/untrusted',
      });
      expect(result.tier).toBe('neighborhood');
    });
  });

  describe('edge cases', () => {
    it('trustedRepos undefined does not match for neighborhood', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
        repoId: 'some-org/some-repo',
      });
      expect(result.tier).toBe('town');
    });

    it('repoId undefined with trustedRepos does not match for neighborhood', () => {
      const result = classifyFamiliarity({
        origin: 'known-repo',
        trustedRepos: ['some-org/some-repo'],
      });
      expect(result.tier).toBe('town');
    });

    it('isProjectLocal false does not trigger home', () => {
      const result = classifyFamiliarity({
        origin: 'external',
        isProjectLocal: false,
      });
      expect(result.tier).toBe('stranger');
    });

    it('isUserLocal false does not trigger neighborhood', () => {
      const result = classifyFamiliarity({
        origin: 'external',
        isUserLocal: false,
      });
      expect(result.tier).toBe('stranger');
    });
  });
});
