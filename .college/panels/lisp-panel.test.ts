/**
 * Lisp Panel tests -- homoiconicity, S-expression structure, macro annotations,
 * PanelInterface contract, and the code-as-data principle.
 *
 * Covers test plan IDs: PAN-04, PAN-09
 */

import { describe, it, expect } from 'vitest';
import { LispPanel } from './lisp-panel.js';
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

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('LispPanel', () => {
  const panel = new LispPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('lisp');
    expect(panel.name).toBe('Lisp Panel');
    expect(panel.description.length).toBeGreaterThan(0);
  });

  describe('translate()', () => {
    const expression = panel.translate(exponentialDecayConcept);

    it('PAN-09: returns PanelExpression with homoiconic S-expression code', () => {
      expect(expression.panelId).toBe('lisp');
      expect(expression.code).toBeDefined();
      // Code must contain nested S-expression structure (defun/define form)
      expect(expression.code).toMatch(/\(def(un|ine)/);
      // Must have nested parentheses forming valid S-expression structure
      const openParens = (expression.code!.match(/\(/g) || []).length;
      const closeParens = (expression.code!.match(/\)/g) || []).length;
      expect(openParens).toBeGreaterThan(5);
      expect(openParens).toBe(closeParens);
    });

    it('includes macro composition via defmacro in examples', () => {
      expect(expression.examples).toBeDefined();
      expect(expression.examples!.length).toBeGreaterThan(0);
      const macroExample = expression.examples!.find(e => e.includes('defmacro'));
      expect(macroExample).toBeDefined();
      expect(macroExample).toMatch(/defmacro/);
      // Should show concept composition
      expect(macroExample).toMatch(/with-decay|compose|concept/i);
    });

    it('demonstrates S-expression decomposability with quote', () => {
      // The code should contain a quoted form showing definition as inspectable data
      expect(expression.code).toMatch(/quote|'/);
      // Must demonstrate that the definition IS a list (car/cdr decomposable)
      const fullText = `${expression.code} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/car|cdr|cons/);
    });

    it('pedagogicalNotes teach homoiconicity and code-as-data', () => {
      expect(expression.pedagogicalNotes).toBeDefined();
      expect(expression.pedagogicalNotes!.length).toBeGreaterThan(0);
      expect(expression.pedagogicalNotes!.toLowerCase()).toMatch(/homoiconicity/);
      expect(expression.pedagogicalNotes!.toLowerCase()).toMatch(/data structure/);
    });

    it('PAN-04: exponential decay code includes exp with correct mathematical form', () => {
      expect(expression.code).toBeDefined();
      // Must use (exp ...) for exponential computation
      expect(expression.code).toMatch(/\(exp\s/);
      // Must reference the key variables of Newton's cooling law
      const code = expression.code!;
      expect(code).toMatch(/ambient|t.amb/i);
      expect(code).toMatch(/initial|t.init/i);
    });

    it('token cost is within reasonable bounds (< 5000 chars at active depth)', () => {
      const totalLength =
        (expression.code?.length || 0) +
        (expression.explanation?.length || 0) +
        (expression.pedagogicalNotes?.length || 0);
      expect(totalLength).toBeLessThan(5000);
      expect(totalLength).toBeGreaterThan(100); // Must be substantive
    });
  });

  describe('getCapabilities()', () => {
    const capabilities = panel.getCapabilities();

    it('PanelInterface contract: functional paradigm with pedagogical notes', () => {
      expect(capabilities.supportedDomains).toContain('mathematics');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
      expect(capabilities.expressionFormats).toContain('code');
      expect(capabilities.mathLibraries.length).toBeGreaterThan(0);
    });
  });

  describe('formatExpression()', () => {
    it('produces indented S-expression output with pedagogical annotations', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);

      expect(formatted.length).toBeGreaterThan(0);
      // Should contain S-expression code
      expect(formatted).toMatch(/\(/);
      // Should contain comment annotations (;; style)
      expect(formatted).toMatch(/;;/);
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('returns string mentioning homoiconicity or code-as-data', () => {
      const feature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(feature).toBeDefined();
      expect(feature.toLowerCase()).toMatch(/homoiconicity|code.{0,5}data|manipulable data structure/);
    });
  });

  describe('PanelRegistry integration', () => {
    it('registers without error', () => {
      const registry = new PanelRegistry();
      expect(() => registry.register(panel)).not.toThrow();
      expect(registry.has('lisp')).toBe(true);
      expect(registry.get('lisp')).toBe(panel);
    });
  });
});
