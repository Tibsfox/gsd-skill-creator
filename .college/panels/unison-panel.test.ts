/**
 * Unison Panel tests -- content-addressed code, hash-based identity,
 * abilities (algebraic effects), codebase-as-database.
 *
 * Covers test plan IDs: PC-17, PC-18, INT-21, INT-22, PANEL-09
 */

import { describe, it, expect } from 'vitest';
import { UnisonPanel } from './unison-panel.js';
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

describe('UnisonPanel', () => {
  const panel = new UnisonPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('unison');
    expect(panel.name).toBe('Unison Panel');
  });

  describe('translate()', () => {
    const expression = panel.translate(exponentialDecayConcept);

    it('PC-17: hash identity -- two names, same hash for identical structure', () => {
      const fullText = `${expression.code} ${expression.examples?.join(' ')}`;
      // Must show two differently-named functions with the same hash
      expect(fullText).toMatch(/#[a-z0-9]+/i);
      // Must demonstrate that renaming produces same hash
      expect(fullText.toLowerCase()).toMatch(/same hash|same.*hash|rename|different name/i);
    });

    it('PC-18: ability declaration with handler', () => {
      const fullText = `${expression.code} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/ability\s+\w+/);
      expect(fullText).toMatch(/handle/);
    });

    it('content-addressed code -- identity is content hash, not name', () => {
      const fullText = `${expression.code} ${expression.pedagogicalNotes}`;
      expect(fullText.toLowerCase()).toMatch(/content.?address/);
      // Connect to Rosetta Core concept identity
      expect(fullText.toLowerCase()).toMatch(/rosetta|concept identity/);
    });

    it('codebase-as-database -- ASTs in SQLite, not text files', () => {
      const fullText = `${expression.pedagogicalNotes} ${expression.examples?.join(' ')}`;
      expect(fullText.toLowerCase()).toMatch(/sqlite|database|typed ast/i);
      expect(fullText.toLowerCase()).toMatch(/text file|not.*text|names.*metadata/i);
    });

    it('ability handler pattern for effect isolation', () => {
      const fullText = `${expression.code} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/handle/);
      // Should explain testability / effect isolation
      const allText = `${fullText} ${expression.pedagogicalNotes}`;
      expect(allText.toLowerCase()).toMatch(/test|swap|isolat|effect/);
    });

    it('INT-21: Calibration mapping to observe/compare/adjust/record', () => {
      const fullText = `${expression.code} ${expression.examples?.join(' ')} ${expression.pedagogicalNotes}`;
      // Must map ability pattern to Calibration Engine cycle
      expect(fullText.toLowerCase()).toMatch(/calibrat/);
      expect(fullText).toMatch(/observe|compare|adjust|record/);
    });

    it('INT-22: Concept Registry parallel -- hash identity = concept identity', () => {
      const fullText = `${expression.pedagogicalNotes} ${expression.examples?.join(' ')}`;
      expect(fullText.toLowerCase()).toMatch(/concept.*identity|canonical.*identity|rosetta.*identity/);
    });

    it('watch expressions with > syntax', () => {
      const fullText = `${expression.code} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/>\s+\w+/);
    });

    it('exponential decay with Unison type annotation', () => {
      const code = expression.code!;
      expect(code).toMatch(/Float\s*->\s*Float/);
      expect(code).toMatch(/coolingCurve|cooling_curve|exponentialDecay/);
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

    it('reports functional paradigm with distributed-computing and type-theory', () => {
      expect(capabilities.supportedDomains).toContain('distributed-computing');
      expect(capabilities.supportedDomains).toContain('type-theory');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
    });
  });

  describe('formatExpression()', () => {
    it('produces Unison code with -- comment annotations', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toMatch(/--/);
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('mentions content-addressed or hash-based identity', () => {
      const feature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(feature.toLowerCase()).toMatch(/content.?address|hash.?based identity|abilities/);
    });
  });

  describe('PanelRegistry integration', () => {
    it('registers without error', () => {
      const registry = new PanelRegistry();
      expect(() => registry.register(panel)).not.toThrow();
      expect(registry.has('unison')).toBe(true);
    });
  });
});
