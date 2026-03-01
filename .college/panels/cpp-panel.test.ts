/**
 * C++ Panel tests -- performance and precision, cmath bindings,
 * double type enforcement, templates, PanelInterface contract.
 *
 * Covers test plan IDs: PAN-02, PAN-08, SC-13
 */

import { describe, it, expect } from 'vitest';
import { CppPanel } from './cpp-panel.js';
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

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CppPanel', () => {
  const panel = new CppPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('cpp');
    expect(panel.name).toBe('C++ Panel');
    expect(panel.description.length).toBeGreaterThan(0);
  });

  describe('translate()', () => {
    it('PAN-02 / SC-13: exponential decay uses std::exp with cmath and double types', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.panelId).toBe('cpp');
      expect(expression.code).toBeDefined();
      expect(expression.code).toContain('std::exp');
      expect(expression.code).toMatch(/<cmath>|cmath/);
      expect(expression.code).toContain('double');
      expect(expression.code).toMatch(/cooling/i);
      expect(expression.code).toMatch(/ambient/i);
      expect(expression.code).toMatch(/initial/i);
    });

    it('PAN-08: trig functions use std::sin, std::cos, std::tan', () => {
      const expression = panel.translate(trigFunctionsConcept);
      expect(expression.panelId).toBe('cpp');
      expect(expression.code).toBeDefined();
      expect(expression.code).toContain('std::sin');
      expect(expression.code).toContain('std::cos');
      expect(expression.code).toContain('std::tan');
    });

    it('type system enforcement: uses double not float for precision', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.code).toContain('double');
      // Pedagogical notes should explain why double over float
      const fullText = `${expression.pedagogicalNotes} ${expression.explanation}`;
      expect(fullText.toLowerCase()).toMatch(/precision|double|float/);
    });

    it('template/constexpr: examples include compile-time computation', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.examples).toBeDefined();
      expect(expression.examples!.length).toBeGreaterThan(0);
      const allExamples = expression.examples!.join(' ');
      expect(allExamples).toMatch(/template|constexpr/);
    });

    it('performance pedagogical focus: notes mention precision or performance or hardware', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.pedagogicalNotes).toBeDefined();
      expect(expression.pedagogicalNotes!.length).toBeGreaterThan(0);
      const notes = expression.pedagogicalNotes!.toLowerCase();
      expect(notes).toMatch(/precision|performance|hardware/);
    });
  });

  describe('getCapabilities()', () => {
    const capabilities = panel.getCapabilities();

    it('PanelInterface contract: mathematics domain with cmath library', () => {
      expect(capabilities.supportedDomains).toContain('mathematics');
      expect(capabilities.mathLibraries).toContain('cmath');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
      expect(capabilities.expressionFormats).toContain('code');
    });
  });

  describe('formatExpression()', () => {
    it('produces C++ code with // comment annotations', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toContain('//');
      expect(formatted).toContain('C++ Panel');
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('returns string mentioning performance or precision or hardware', () => {
      const feature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(feature).toBeDefined();
      expect(feature.toLowerCase()).toMatch(/performance|precision|hardware/);
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
      expect(registry.has('cpp')).toBe(true);
      expect(registry.get('cpp')).toBe(panel);
    });
  });
});
