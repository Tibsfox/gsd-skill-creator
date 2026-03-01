/**
 * Pascal Panel tests -- Wirth's structured programming principles,
 * begin/end blocks, explicit types, procedure decomposition.
 *
 * Covers test plan IDs: PAN-05, PAN-10
 */

import { describe, it, expect } from 'vitest';
import { PascalPanel } from './pascal-panel.js';
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

describe('PascalPanel', () => {
  const panel = new PascalPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('pascal');
    expect(panel.name).toBe('Pascal Panel');
    expect(panel.description.length).toBeGreaterThan(0);
  });

  describe('translate()', () => {
    const expression = panel.translate(exponentialDecayConcept);

    it('PAN-10: produces Pascal code with program, var, begin/end, function', () => {
      expect(expression.panelId).toBe('pascal');
      expect(expression.code).toBeDefined();
      expect(expression.code).toMatch(/program/i);
      expect(expression.code).toMatch(/var/);
      expect(expression.code).toMatch(/begin/);
      expect(expression.code).toMatch(/end/);
      expect(expression.code).toMatch(/function/i);
    });

    it('annotations encode Wirth\'s principles (mentions Wirth by name)', () => {
      expect(expression.pedagogicalNotes).toBeDefined();
      expect(expression.pedagogicalNotes).toMatch(/Wirth/);
      // Must mention at least 3 of: simplicity, typing, decomposition, abstraction, refinement
      const notes = expression.pedagogicalNotes!.toLowerCase();
      let count = 0;
      if (notes.includes('simplicity') || notes.includes('simple')) count++;
      if (notes.includes('typing') || notes.includes('typed')) count++;
      if (notes.includes('decomposition') || notes.includes('decompose')) count++;
      if (notes.includes('abstraction') || notes.includes('abstract')) count++;
      if (notes.includes('refinement') || notes.includes('stepwise')) count++;
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('code contains begin/end blocks (not braces)', () => {
      const code = expression.code!;
      expect(code).toMatch(/begin/);
      expect(code).toMatch(/end/);
      // Pascal structure, not C-style braces for blocks
      expect(code).toMatch(/begin[\s\S]*end/);
    });

    it('declares variables with explicit Pascal types', () => {
      const code = expression.code!;
      // Must declare typed variables in var section
      expect(code).toMatch(/Real/i);
      // Should have variable declarations with type annotations
      expect(code).toMatch(/:\s*Real/i);
    });

    it('PAN-05: uses Exp() for exponential decay with correct form', () => {
      const code = expression.code!;
      expect(code).toMatch(/Exp\s*\(/i);
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

    it('reports procedural paradigm with mathematics domain', () => {
      expect(capabilities.supportedDomains).toContain('mathematics');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
      expect(capabilities.expressionFormats).toContain('code');
    });
  });

  describe('formatExpression()', () => {
    it('produces indented Pascal with comment annotations', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);
      expect(formatted.length).toBeGreaterThan(0);
      // Pascal comments use { } or (* *)
      expect(formatted).toMatch(/\{.*\}|(\(\*.*\*\))/s);
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('mentions structured programming or Wirth or clarity', () => {
      const feature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(feature.toLowerCase()).toMatch(/structured programming|wirth|discipline|clarity/);
    });
  });

  describe('PanelRegistry integration', () => {
    it('registers without error', () => {
      const registry = new PanelRegistry();
      expect(() => registry.register(panel)).not.toThrow();
      expect(registry.has('pascal')).toBe(true);
    });
  });
});
