/**
 * Perl Panel tests -- regex-as-syntax, closure factories, POD-as-curriculum,
 * CPAN ecosystem, sigils, Huffman coding principle.
 *
 * Covers test plan IDs: PC-13, PC-14, PANEL-07
 */

import { describe, it, expect } from 'vitest';
import { PerlPanel } from './perl-panel.js';
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

const textConcept: RosettaConcept = {
  id: 'pattern-matching',
  name: 'Pattern Matching',
  domain: 'text-processing',
  description: 'Regular expression matching and text transformation',
  panels: new Map(),
  relationships: [],
};

describe('PerlPanel', () => {
  const panel = new PerlPanel();

  it('implements PanelInterface', () => {
    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('perl');
    expect(panel.name).toBe('Perl Panel');
  });

  describe('translate()', () => {
    const expression = panel.translate(exponentialDecayConcept);

    it('PC-13: regex-as-syntax with /pattern/ and =~', () => {
      expect(expression.code).toBeDefined();
      // Must contain regex syntax as grammar, not library calls
      expect(expression.code).toMatch(/=~/);
      expect(expression.code).toMatch(/\/[^/]+\//);
      // Should have annotation about finite automaton
      const fullText = `${expression.code} ${expression.pedagogicalNotes}`;
      expect(fullText.toLowerCase()).toMatch(/finite automat|regex.*syntax|regex.*grammar/i);
    });

    it('PC-14: closure factory with sub returning sub', () => {
      const code = expression.code!;
      expect(code).toMatch(/sub\s+make_cooling_curve/);
      expect(code).toMatch(/my\s*\(\s*\$t_initial/);
      expect(code).toMatch(/return\s+sub\s*\{/);
    });

    it('POD-as-curriculum with =head1 and =cut', () => {
      const code = expression.code!;
      expect(code).toMatch(/=head1/);
      expect(code).toMatch(/=cut/);
    });

    it('PANEL-07: all three (regex + closures + POD) in a single expression', () => {
      const code = expression.code!;
      // All three must be in the SAME code field
      const hasRegex = /=~/.test(code) || /\/[^/]+\//.test(code);
      const hasClosure = /sub\s*\{/.test(code) && /return\s+sub/.test(code);
      const hasPOD = /=head1/.test(code) && /=cut/.test(code);
      expect(hasRegex).toBe(true);
      expect(hasClosure).toBe(true);
      expect(hasPOD).toBe(true);
    });

    it('CPAN annotation with hierarchical namespaces', () => {
      const fullText = `${expression.pedagogicalNotes} ${expression.examples?.join(' ')}`;
      expect(fullText).toMatch(/CPAN/);
      expect(fullText).toMatch(/Math::|Lingua::|Text::/);
    });

    it('uses Perl sigils ($, @, %)', () => {
      const code = expression.code!;
      expect(code).toMatch(/\$\w/);   // $scalar
      expect(code).toMatch(/@\w/);    // @array
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

    it('reports multi-paradigm with text-processing and mathematics', () => {
      expect(capabilities.supportedDomains).toContain('text-processing');
      expect(capabilities.supportedDomains).toContain('mathematics');
      expect(capabilities.hasPedagogicalNotes).toBe(true);
      expect(capabilities.hasCodeGeneration).toBe(true);
    });
  });

  describe('formatExpression()', () => {
    it('produces Perl code with # comments and POD sections', () => {
      const expression = panel.translate(exponentialDecayConcept);
      const formatted = panel.formatExpression(expression);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toMatch(/#/);
    });
  });

  describe('getDistinctiveFeature()', () => {
    it('returns domain-appropriate strings', () => {
      const textFeature = panel.getDistinctiveFeature(textConcept);
      expect(textFeature.toLowerCase()).toMatch(/regex|text/);

      const mathFeature = panel.getDistinctiveFeature(exponentialDecayConcept);
      expect(mathFeature.length).toBeGreaterThan(0);
    });
  });

  describe('Huffman coding principle', () => {
    it('pedagogicalNotes mention Larry Wall and Huffman coding', () => {
      const expression = panel.translate(exponentialDecayConcept);
      expect(expression.pedagogicalNotes).toMatch(/Larry Wall/i);
      expect(expression.pedagogicalNotes).toMatch(/Huffman/i);
    });
  });

  describe('PanelRegistry integration', () => {
    it('registers without error', () => {
      const registry = new PanelRegistry();
      expect(() => registry.register(panel)).not.toThrow();
      expect(registry.has('perl')).toBe(true);
    });
  });
});
