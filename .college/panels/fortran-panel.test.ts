/**
 * Fortran Panel tests -- scientific computing heritage, array operations,
 * REAL precision, DO loops, authentic Fortran idioms.
 *
 * Covers test plan IDs: PAN-06, PAN-11
 */

import { describe, it, expect } from 'vitest';
import { FortranPanel } from './fortran-panel.js';
import { PanelInterface, PanelRegistry } from './panel-interface.js';
import type { RosettaConcept } from '../rosetta-core/types.js';

const exponentialDecayConcept: RosettaConcept = {
  id: 'exponential-decay',
  name: 'Exponential Decay',
  domain: 'mathematics',
  description: 'T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt) — Newton\'s law of cooling',
  panels: new Map(),
  relationships: [
    { type: 'cross-reference', targetId: 'newtons-cooling-law', description: 'Applied form in cooking/thermodynamics' },
  ],
};

const arrayOrientedConcept: RosettaConcept = {
  id: 'time-series-decay',
  name: 'Time Series Decay',
  domain: 'mathematics',
  description: 'Array of temperatures computed at time intervals for exponential cooling',
  panels: new Map(),
  relationships: [],
};

describe('FortranPanel', () => {
  const panel = new FortranPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('fortran');
    expect(panel.name).toBe('Fortran Panel');
    expect(panel.description.length).toBeGreaterThan(0);
  });

  describe('translate()', () => {
    const expression = panel.translate(exponentialDecayConcept);

    it('PAN-11: produces Fortran code with REAL declarations and EXP()', () => {
      expect(expression.panelId).toBe('fortran');
      expect(expression.code).toBeDefined();
      expect(expression.code).toMatch(/REAL/);
      expect(expression.code).toMatch(/EXP\s*\(/);
    });

    it('uses array notation for array-oriented concepts', () => {
      const arrayExpr = panel.translate(arrayOrientedConcept);
      const fullText = `${arrayExpr.code} ${arrayExpr.examples?.join(' ')}`;
      // Should demonstrate array operations (DIMENSION, array syntax, or DO loops)
      expect(fullText).toMatch(/DIMENSION|DO\s|array/i);
    });

    it('declares precision explicitly with REAL(KIND=8) or DOUBLE PRECISION', () => {
      const code = expression.code!;
      expect(code).toMatch(/REAL\s*\(\s*KIND\s*=\s*8\s*\)|DOUBLE\s+PRECISION/);
    });

    it('uses DO loops with authentic Fortran syntax', () => {
      const fullText = `${expression.code} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/DO\s/);
    });

    it('FORmula TRANslation: pedagogicalNotes explain the name origin', () => {
      expect(expression.pedagogicalNotes).toBeDefined();
      expect(expression.pedagogicalNotes).toMatch(/FOR.*mula.*TRAN.*slat/i);
    });

    it('PAN-06: uses EXP() intrinsic with correct cooling law form', () => {
      const code = expression.code!;
      expect(code).toMatch(/EXP\s*\(/);
      expect(code).toMatch(/ambient/i);
      expect(code).toMatch(/initial/i);
    });

    it('token cost within bounds (< 5000 chars)', () => {
      const totalLength =
        (expression.code?.length || 0) +
        (expression.explanation?.length || 0) +
        (expression.pedagogicalNotes?.length || 0);
      expect(totalLength).toBeLessThan(5000);
      expect(totalLength).toBeGreaterThan(100);
    });
  });

  describe('getCapabilities()', () => {
    const capabilities = panel.getCapabilities();

    it('reports imperative paradigm with scientific domains', () => {
      expect(capabilities.supportedDomains).toContain('mathematics');
      expect(capabilities.supportedDomains).toContain('scientific-computing');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
    });
  });

  describe('formatExpression()', () => {
    it('produces Fortran with ! comment annotations', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toMatch(/!/);
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('mentions scientific computing or formula translation', () => {
      const feature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(feature.toLowerCase()).toMatch(/scientific computing|formula translation|numerical methods/);
    });
  });

  describe('PanelRegistry integration', () => {
    it('registers without error', () => {
      const registry = new PanelRegistry();
      expect(() => registry.register(panel)).not.toThrow();
      expect(registry.has('fortran')).toBe(true);
    });
  });
});
