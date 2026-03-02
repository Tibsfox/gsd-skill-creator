/**
 * ALGOL Panel tests -- BNF notation, block structure, three-syntax architecture,
 * descendant tree, recursive procedures, call-by-name.
 *
 * Covers test plan IDs: PC-15, PC-16, INT-19, INT-20, PANEL-08
 */

import { describe, it, expect } from 'vitest';
import { AlgolPanel } from './algol-panel.js';
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

describe('AlgolPanel', () => {
  const panel = new AlgolPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('algol');
    expect(panel.name).toBe('ALGOL Panel');
  });

  describe('translate()', () => {
    const expression = panel.translate(exponentialDecayConcept);

    it('PC-15: BNF notation with ::= production operator', () => {
      const fullText = `${expression.code} ${expression.pedagogicalNotes} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/::=/);
      expect(fullText).toMatch(/<\w+>/);  // BNF non-terminals
      // Must explain BNF as meta-language
      expect(fullText.toLowerCase()).toMatch(/meta.?language|notation.*programming|syntax.*every/i);
    });

    it('PC-16: begin...end blocks with nested scopes', () => {
      const code = expression.code!;
      expect(code).toMatch(/begin/);
      expect(code).toMatch(/end/);
      // Should have annotation linking to C++/Java
      const fullText = `${code} ${expression.pedagogicalNotes}`;
      expect(fullText).toMatch(/C\+\+|Java|brace/i);
    });

    it('three-syntax architecture (reference, publication, implementation)', () => {
      const fullText = `${expression.code} ${expression.explanation} ${expression.examples?.join(' ')} ${expression.pedagogicalNotes}`;
      expect(fullText.toLowerCase()).toMatch(/reference\s+syntax|reference syntax/i);
      expect(fullText.toLowerCase()).toMatch(/publication\s+syntax|publication syntax/i);
      expect(fullText.toLowerCase()).toMatch(/implementation\s+syntax|implementation syntax/i);
      // Must contain "The Rosetta principle" annotation
      expect(fullText.toLowerCase()).toMatch(/rosetta/i);
    });

    it('recursive procedures demonstrated', () => {
      const fullText = `${expression.code} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/procedure/i);
      // Should mention recursion being controversial in 1960
      const allText = `${fullText} ${expression.pedagogicalNotes}`;
      expect(allText.toLowerCase()).toMatch(/recurs/i);
    });

    it('call-by-name evaluation explained', () => {
      const fullText = `${expression.pedagogicalNotes} ${expression.examples?.join(' ')}`;
      expect(fullText.toLowerCase()).toMatch(/call.by.name|call-by-name/i);
      // Should mention lazy evaluation or thunks
      expect(fullText.toLowerCase()).toMatch(/lazy|thunk|re.?evaluat/i);
    });

    it('descendant tree showing ALGOL lineage', () => {
      const fullText = `${expression.pedagogicalNotes} ${expression.examples?.join(' ')}`;
      // Must show ALGOL -> Pascal path
      expect(fullText).toMatch(/Pascal/);
      expect(fullText).toMatch(/Wirth/);
      // Must show ALGOL -> C path
      expect(fullText).toMatch(/\bC\b.*\bC\+\+|BCPL|CPL/);
    });

    it('INT-19: ALGOL->C++ ancestry traced via block structure', () => {
      const fullText = `${expression.code} ${expression.pedagogicalNotes} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/begin.*end/s);
      expect(fullText).toMatch(/C\+\+|brace/i);
    });

    it('INT-20: ALGOL->Pascal descent via Wirth', () => {
      const fullText = `${expression.pedagogicalNotes} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/Wirth/);
      expect(fullText).toMatch(/Pascal/);
    });

    it('no I/O standard annotation (deliberate omission)', () => {
      expect(expression.pedagogicalNotes).toBeDefined();
      const notes = expression.pedagogicalNotes!.toLowerCase();
      expect(notes).toMatch(/i\/o|input.?output/i);
      expect(notes).toMatch(/machine.?independent|omit|deliberat/i);
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

    it('reports procedural paradigm with CS and formal-languages', () => {
      expect(capabilities.supportedDomains).toContain('computer-science');
      expect(capabilities.supportedDomains).toContain('formal-languages');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
    });
  });

  describe('formatExpression()', () => {
    it('produces ALGOL code with comment annotations', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toMatch(/comment/i);
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('mentions BNF or ancestor or block structure or three-syntax', () => {
      const feature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(feature.toLowerCase()).toMatch(/bnf|ancestor|block structure|three.syntax/);
    });
  });

  describe('PanelRegistry integration', () => {
    it('registers without error', () => {
      const registry = new PanelRegistry();
      expect(() => registry.register(panel)).not.toThrow();
      expect(registry.has('algol')).toBe(true);
    });
  });
});
