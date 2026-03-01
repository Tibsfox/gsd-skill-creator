/**
 * Java Panel tests -- type safety and platform independence, Math.exp bindings,
 * OO design patterns, generics, PanelInterface contract.
 *
 * Covers test plan IDs: PAN-03
 */

import { describe, it, expect } from 'vitest';
import { JavaPanel } from './java-panel.js';
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

describe('JavaPanel', () => {
  const panel = new JavaPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('java');
    expect(panel.name).toBe('Java Panel');
    expect(panel.description.length).toBeGreaterThan(0);
  });

  describe('translate()', () => {
    it('PAN-03: exponential decay uses Math.exp in class structure', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.panelId).toBe('java');
      expect(expression.code).toBeDefined();
      expect(expression.code).toContain('Math.exp');
      expect(expression.code).toMatch(/public\s+(class|static)/);
      expect(expression.code).toContain('double');
      expect(expression.code).toMatch(/cooling/i);
      expect(expression.code).toMatch(/ambient/i);
      expect(expression.code).toMatch(/initial/i);
    });

    it('trig functions use Math.sin, Math.cos, Math.tan', () => {
      const expression = panel.translate(trigFunctionsConcept);
      expect(expression.panelId).toBe('java');
      expect(expression.code).toBeDefined();
      expect(expression.code).toContain('Math.sin');
      expect(expression.code).toContain('Math.cos');
      expect(expression.code).toContain('Math.tan');
    });

    it('OO design patterns: code contains class structure and typed signatures', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.code).toMatch(/public\s+class/);
      expect(expression.code).toMatch(/public\s+static\s+double/);
      // Examples should demonstrate generics or interface usage
      expect(expression.examples).toBeDefined();
      const allExamples = expression.examples!.join(' ');
      expect(allExamples).toMatch(/interface|generic|<T/i);
    });

    it('platform independence: notes explain portability', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.pedagogicalNotes).toBeDefined();
      const notes = expression.pedagogicalNotes!.toLowerCase();
      expect(notes).toMatch(/platform|portable|jvm|identical/);
    });
  });

  describe('getCapabilities()', () => {
    const capabilities = panel.getCapabilities();

    it('PanelInterface contract: mathematics domain with java.lang.Math library', () => {
      expect(capabilities.supportedDomains).toContain('mathematics');
      expect(capabilities.mathLibraries).toContain('java.lang.Math');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
      expect(capabilities.expressionFormats).toContain('code');
    });
  });

  describe('formatExpression()', () => {
    it('produces Java code with // comment annotations and class structure', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toContain('//');
      expect(formatted).toContain('Java Panel');
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('returns string mentioning type safety or platform independence or object model', () => {
      const feature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(feature).toBeDefined();
      expect(feature.toLowerCase()).toMatch(/type safety|platform independence|object model/);
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
      expect(registry.has('java')).toBe(true);
      expect(registry.get('java')).toBe(panel);
    });
  });
});
