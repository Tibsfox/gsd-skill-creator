// Plane Classifier Tests — TDD RED phase
//
// Tests the problem classifier that maps natural language problem descriptions
// to Complex Plane positions with domain activation signals.

import { describe, it, expect } from 'vitest';
import { classifyProblem } from './plane-classifier.js';
import type { PlaneClassification, DomainActivation } from './plane-classifier.js';

describe('plane-classifier', () => {
  describe('classifyProblem', () => {
    // Test 1: Pure perception problem
    it('maps a Pythagorean theorem problem to the perception domain', () => {
      const result: PlaneClassification = classifyProblem(
        'find the distance between two points using Pythagorean theorem'
      );

      expect(result.activatedDomains.length).toBeGreaterThan(0);
      expect(result.activatedDomains[0].domainId).toBe('perception');
      expect(result.confidence).toBeGreaterThan(0.3);
      // Position should be near perception center (-0.2, 0.2)
      expect(result.position.real).toBeLessThan(0.2);
      expect(result.position.imaginary).toBeGreaterThan(-0.2);
    });

    // Test 2: Pure waves problem
    it('maps a Fourier signal decomposition problem to the waves domain', () => {
      const result = classifyProblem(
        'decompose this signal into its frequency components using Fourier'
      );

      expect(result.activatedDomains.length).toBeGreaterThan(0);
      expect(result.activatedDomains[0].domainId).toBe('waves');
      expect(result.confidence).toBeGreaterThan(0.3);
      // Position should be near waves center (-0.4, 0.0)
      expect(result.position.real).toBeLessThan(0.0);
    });

    // Test 3: Pure change problem
    it('maps a derivative/integral problem to the change domain', () => {
      const result = classifyProblem(
        'find the derivative of x^3 and evaluate the integral'
      );

      expect(result.activatedDomains.length).toBeGreaterThan(0);
      expect(result.activatedDomains[0].domainId).toBe('change');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    // Test 4: Structure problem
    it('maps an eigenvalue problem to the structure domain', () => {
      const result = classifyProblem(
        'find the eigenvalues of this 3x3 matrix'
      );

      expect(result.activatedDomains.length).toBeGreaterThan(0);
      expect(result.activatedDomains[0].domainId).toBe('structure');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    // Test 5: Reality problem
    it('maps a photon energy calculation to the reality domain', () => {
      const result = classifyProblem(
        'calculate the energy of a photon with wavelength 500nm'
      );

      expect(result.activatedDomains.length).toBeGreaterThan(0);
      expect(result.activatedDomains[0].domainId).toBe('reality');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    // Test 6: Foundations problem
    it('maps a group theory / set theory problem to the foundations domain', () => {
      const result = classifyProblem(
        'prove this group is abelian using set theory axioms'
      );

      expect(result.activatedDomains.length).toBeGreaterThan(0);
      expect(result.activatedDomains[0].domainId).toBe('foundations');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    // Test 7: Mapping problem
    it('maps an entropy/probability problem to the mapping domain', () => {
      const result = classifyProblem(
        'compute the entropy of this probability distribution'
      );

      expect(result.activatedDomains.length).toBeGreaterThan(0);
      expect(result.activatedDomains[0].domainId).toBe('mapping');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    // Test 8: Emergence problem
    it('maps a Lorenz attractor problem to the emergence domain', () => {
      const result = classifyProblem(
        'model the Lorenz attractor and find its strange attractor'
      );

      expect(result.activatedDomains.length).toBeGreaterThan(0);
      expect(result.activatedDomains[0].domainId).toBe('emergence');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    // Test 9: Multi-domain — waves + change
    it('activates both waves and change for Fourier + differential equation', () => {
      const result = classifyProblem(
        'use Fourier analysis to solve this differential equation'
      );

      const domainIds = result.activatedDomains.map((d: DomainActivation) => d.domainId);
      expect(domainIds).toContain('waves');
      expect(domainIds).toContain('change');
      expect(result.activatedDomains.length).toBeGreaterThanOrEqual(2);
      // Position should be between waves and change centers
      expect(result.position.real).toBeLessThan(0.3);
    });

    // Test 10: Multi-domain — structure + foundations
    it('activates both structure and foundations for vector space dimension theorem', () => {
      const result = classifyProblem(
        'prove the dimension theorem for vector spaces using abstract algebra'
      );

      const domainIds = result.activatedDomains.map((d: DomainActivation) => d.domainId);
      expect(domainIds).toContain('structure');
      expect(domainIds).toContain('foundations');
      expect(result.activatedDomains.length).toBeGreaterThanOrEqual(2);
    });

    // Test 11: Empty input
    it('returns low confidence and origin for empty input', () => {
      const result = classifyProblem('');

      expect(result.position.real).toBe(0.0);
      expect(result.position.imaginary).toBe(0.0);
      expect(result.confidence).toBeLessThan(0.3);
      expect(result.activatedDomains).toHaveLength(0);
    });

    // Test 12: Nonsensical input
    it('returns low confidence and origin for nonsensical input', () => {
      const result = classifyProblem(
        'the quick brown fox jumps over the lazy dog'
      );

      expect(result.position.real).toBeCloseTo(0.0, 0);
      expect(result.position.imaginary).toBeCloseTo(0.0, 0);
      expect(result.confidence).toBeLessThan(0.3);
    });

    // Test 13: Broad synthesis problem
    it('activates synthesis domain for meta-mathematical cross-domain query', () => {
      const result = classifyProblem(
        'explain how all mathematical concepts connect across the Complex Plane'
      );

      const domainIds = result.activatedDomains.map((d: DomainActivation) => d.domainId);
      expect(domainIds).toContain('synthesis');
      expect(result.confidence).toBeGreaterThan(0.0);
    });
  });

  describe('classification properties', () => {
    it('returns domains ranked by score descending', () => {
      const result = classifyProblem(
        'use Fourier analysis to solve this differential equation'
      );

      for (let i = 1; i < result.activatedDomains.length; i++) {
        expect(result.activatedDomains[i - 1].score)
          .toBeGreaterThanOrEqual(result.activatedDomains[i].score);
      }
    });

    it('returns confidence clamped between 0.0 and 1.0', () => {
      const result = classifyProblem(
        'find the eigenvalues of this 3x3 matrix using linear algebra and abstract algebra with Fourier transforms'
      );

      expect(result.confidence).toBeGreaterThanOrEqual(0.0);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('returns position clamped between -1.0 and 1.0 on both axes', () => {
      const result = classifyProblem(
        'find the eigenvalues of this 3x3 matrix'
      );

      expect(result.position.real).toBeGreaterThanOrEqual(-1.0);
      expect(result.position.real).toBeLessThanOrEqual(1.0);
      expect(result.position.imaginary).toBeGreaterThanOrEqual(-1.0);
      expect(result.position.imaginary).toBeLessThanOrEqual(1.0);
    });

    it('includes matchedPatterns in each domain activation', () => {
      const result = classifyProblem(
        'find the eigenvalues of this 3x3 matrix'
      );

      for (const activation of result.activatedDomains) {
        expect(activation.matchedPatterns).toBeDefined();
        expect(activation.matchedPatterns.length).toBeGreaterThan(0);
      }
    });

    it('extracts keywords from input', () => {
      const result = classifyProblem(
        'find the eigenvalues of this 3x3 matrix'
      );

      expect(result.keywords).toBeDefined();
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords).toContain('eigenvalues');
      expect(result.keywords).toContain('matrix');
    });
  });
});
