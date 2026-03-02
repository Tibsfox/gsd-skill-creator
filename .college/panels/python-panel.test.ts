/**
 * Python Panel tests -- readability as mathematical notation, math.exp bindings,
 * numpy integration, PanelInterface contract.
 *
 * Covers test plan IDs: PAN-01, PAN-07, SC-12
 */

import { describe, it, expect } from 'vitest';
import { PythonPanel } from './python-panel.js';
import { PanelInterface, PanelRegistry } from './panel-interface.js';
import type { RosettaConcept } from '../rosetta-core/types.js';

// ─── Test Data ──────────────────────────────────────────────────────────────

const exponentialDecayConcept: RosettaConcept = {
  id: 'exponential-decay',
  name: 'Exponential Decay',
  domain: 'mathematics',
  description: 'T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt) — Newton\'s law of cooling',
  panels: new Map(),
  relationships: [
    { type: 'cross-reference', targetId: 'newtons-cooling-law', description: 'Applied form in cooking/thermodynamics' },
    { type: 'analogy', targetId: 'radioactive-decay', description: 'Same mathematical structure in physics' },
  ],
};

const trigFunctionsConcept: RosettaConcept = {
  id: 'trig-functions',
  name: 'Trigonometric Functions',
  domain: 'mathematics',
  description: 'Sine, cosine, tangent -- periodic functions on the unit circle',
  panels: new Map(),
  relationships: [],
};

const genericConcept: RosettaConcept = {
  id: 'generic-concept',
  name: 'Generic Concept',
  domain: 'mathematics',
  description: 'A generic mathematical concept for testing fallback behavior',
  panels: new Map(),
  relationships: [],
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PythonPanel', () => {
  const panel = new PythonPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('python');
    expect(panel.name).toBe('Python Panel');
    expect(panel.description.length).toBeGreaterThan(0);
  });

  describe('translate()', () => {
    it('PAN-01 / SC-12: exponential decay uses math.exp with Newton cooling law', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.panelId).toBe('python');
      expect(expression.code).toBeDefined();
      expect(expression.code).toContain('math.exp');
      expect(expression.code).toContain('import math');
      // Must have cooling law form: T_ambient + (T_initial - T_ambient) * math.exp(-k * t)
      expect(expression.code).toMatch(/def\s+cooling/);
      expect(expression.code).toMatch(/ambient/i);
      expect(expression.code).toMatch(/initial/i);
    });

    it('PAN-07: trig functions use math.sin, math.cos, math.tan', () => {
      const expression = panel.translate(trigFunctionsConcept);
      expect(expression.panelId).toBe('python');
      expect(expression.code).toBeDefined();
      expect(expression.code).toContain('math.sin');
      expect(expression.code).toContain('math.cos');
      expect(expression.code).toContain('math.tan');
    });

    it('numpy integration: examples include numpy usage', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.examples).toBeDefined();
      expect(expression.examples!.length).toBeGreaterThan(0);
      const allExamples = expression.examples!.join(' ');
      expect(allExamples).toContain('numpy');
    });

    it('readability pedagogical focus: notes mention readability or mathematical notation', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.pedagogicalNotes).toBeDefined();
      expect(expression.pedagogicalNotes!.length).toBeGreaterThan(0);
      const notes = expression.pedagogicalNotes!.toLowerCase();
      expect(notes).toMatch(/readability|mathematical notation/);
    });
  });

  describe('getCapabilities()', () => {
    const capabilities = panel.getCapabilities();

    it('PanelInterface contract: mathematics domain with math/numpy libraries', () => {
      expect(capabilities.supportedDomains).toContain('mathematics');
      expect(capabilities.mathLibraries).toContain('math');
      expect(capabilities.mathLibraries).toContain('numpy');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
      expect(capabilities.expressionFormats).toContain('code');
    });
  });

  describe('formatExpression()', () => {
    it('produces Python code with # comment annotations', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);
      expect(formatted.length).toBeGreaterThan(0);
      // Should contain Python comment style
      expect(formatted).toContain('#');
      // Should contain Python code
      expect(formatted).toContain('Python Panel');
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('returns string mentioning readability or mathematical notation', () => {
      const feature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(feature).toBeDefined();
      expect(feature.toLowerCase()).toMatch(/readability|mathematical notation|natural first panel/);
    });
  });

  describe('token cost', () => {
    it('generated expression within bounds (< 5000 chars)', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const totalLength =
        (expression.code?.length || 0) +
        (expression.explanation?.length || 0) +
        (expression.pedagogicalNotes?.length || 0);
      expect(totalLength).toBeLessThan(5000);
      expect(totalLength).toBeGreaterThan(100);
    });
  });

  describe('PanelRegistry integration', () => {
    it('registers without error', () => {
      const registry = new PanelRegistry();
      expect(() => registry.register(panel)).not.toThrow();
      expect(registry.has('python')).toBe(true);
      expect(registry.get('python')).toBe(panel);
    });
  });
});
