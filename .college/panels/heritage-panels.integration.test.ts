/**
 * Heritage Panels Integration Tests
 *
 * Verifies all 6 heritage/frontier panels work together -- registering
 * in PanelRegistry, translating the same concept across all panels,
 * and maintaining pedagogical annotation quality.
 *
 * Covers: PAN-12, PAN-13, PAN-14
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PanelInterface, PanelRegistry } from './panel-interface.js';
import { LispPanel } from './lisp-panel.js';
import { PascalPanel } from './pascal-panel.js';
import { FortranPanel } from './fortran-panel.js';
import { PerlPanel } from './perl-panel.js';
import { AlgolPanel } from './algol-panel.js';
import { UnisonPanel } from './unison-panel.js';
import type { RosettaConcept, PanelId, PanelExpression } from '../rosetta-core/types.js';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const testConcept: RosettaConcept = {
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

const expectedPanelIds: PanelId[] = ['lisp', 'pascal', 'fortran', 'perl', 'algol', 'unison'];

const allPanels: PanelInterface[] = [
  new LispPanel(),
  new PascalPanel(),
  new FortranPanel(),
  new PerlPanel(),
  new AlgolPanel(),
  new UnisonPanel(),
];

// ─── Integration Tests ──────────────────────────────────────────────────────

describe('Heritage Panels Integration', () => {

  describe('Registry Integration', () => {
    it('all 6 panels register in a fresh PanelRegistry without error', () => {
      const registry = new PanelRegistry();
      for (const panel of allPanels) {
        expect(() => registry.register(panel)).not.toThrow();
      }
      expect(registry.getAll()).toHaveLength(6);
    });

    it('registry has() returns true for all 6 panel IDs', () => {
      const registry = new PanelRegistry();
      for (const panel of allPanels) {
        registry.register(panel);
      }
      for (const id of expectedPanelIds) {
        expect(registry.has(id)).toBe(true);
      }
    });

    it('panelId uniqueness -- no duplicates among the 6 panels', () => {
      const ids = allPanels.map(p => p.panelId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(6);
    });
  });

  describe('Cross-Panel Translation', () => {
    let expressions: Map<PanelId, PanelExpression>;

    beforeAll(() => {
      expressions = new Map();
      for (const panel of allPanels) {
        expressions.set(panel.panelId, panel.translate(testConcept));
      }
    });

    it('all 6 panels translate the same concept and return non-empty code', () => {
      for (const [id, expr] of expressions) {
        expect(expr.panelId).toBe(id);
        expect(expr.code).toBeDefined();
        expect(expr.code!.length).toBeGreaterThan(50);
      }
    });

    it('no two panels produce identical code for the same concept', () => {
      const codes = Array.from(expressions.values()).map(e => e.code);
      for (let i = 0; i < codes.length; i++) {
        for (let j = i + 1; j < codes.length; j++) {
          expect(codes[i]).not.toBe(codes[j]);
        }
      }
    });
  });

  describe('PAN-12: Pedagogical Annotation Verification', () => {
    const distinctiveKeywords: Record<string, RegExp> = {
      lisp: /homoiconicity|code.{0,5}data/i,
      pascal: /wirth|structured/i,
      fortran: /scientific|formula/i,
      perl: /regex|closure|pod/i,
      algol: /bnf|block structure|ancestor/i,
      unison: /content.?address|hash|abilities/i,
    };

    it('every panel\'s translate() output has non-empty pedagogicalNotes', () => {
      for (const panel of allPanels) {
        const expr = panel.translate(testConcept);
        expect(expr.pedagogicalNotes).toBeDefined();
        expect(expr.pedagogicalNotes!.length).toBeGreaterThan(50);
      }
    });

    it('each panel\'s notes contain its distinctive pedagogical keyword', () => {
      for (const panel of allPanels) {
        const expr = panel.translate(testConcept);
        const pattern = distinctiveKeywords[panel.panelId];
        expect(expr.pedagogicalNotes).toMatch(pattern);
      }
    });
  });

  describe('PAN-13: Token Cost Bounds', () => {
    it('no panel exceeds 5000 tokens for active-depth output', () => {
      for (const panel of allPanels) {
        const expr = panel.translate(testConcept);
        const formatted = panel.formatExpression(expr);
        // Estimate tokens as chars / 4
        const estimatedTokens = formatted.length / 4;
        expect(estimatedTokens).toBeLessThan(5000);
      }
    });

    it('formatExpression output is reasonably sized (100-20000 chars)', () => {
      for (const panel of allPanels) {
        const expr = panel.translate(testConcept);
        const formatted = panel.formatExpression(expr);
        expect(formatted.length).toBeGreaterThan(100);
        expect(formatted.length).toBeLessThan(20000);
      }
    });
  });

  describe('PAN-14: Cross-Reference Validity', () => {
    it('panels with cross-references mention valid panel IDs or domains', () => {
      // ALGOL references Pascal and C++
      const algolPanel = allPanels.find(p => p.panelId === 'algol')!;
      const algolExpr = algolPanel.translate(testConcept);
      const algolText = `${algolExpr.code} ${algolExpr.pedagogicalNotes} ${algolExpr.examples?.join(' ')}`;
      expect(algolText).toMatch(/Pascal/);
      expect(algolText).toMatch(/C\+\+/);

      // Unison references Concept Registry
      const unisonPanel = allPanels.find(p => p.panelId === 'unison')!;
      const unisonExpr = unisonPanel.translate(testConcept);
      const unisonText = `${unisonExpr.pedagogicalNotes} ${unisonExpr.examples?.join(' ')}`;
      expect(unisonText.toLowerCase()).toMatch(/concept.*identity|rosetta/);
    });
  });

  describe('Capability Consistency', () => {
    it('every panel reports hasPedagogicalNotes=true and hasCodeGeneration=true', () => {
      for (const panel of allPanels) {
        const caps = panel.getCapabilities();
        expect(caps.hasPedagogicalNotes).toBe(true);
        expect(caps.hasCodeGeneration).toBe(true);
      }
    });

    it('every panel has at least one supportedDomain', () => {
      for (const panel of allPanels) {
        const caps = panel.getCapabilities();
        expect(caps.supportedDomains.length).toBeGreaterThan(0);
      }
    });

    it('every panel has at least one expressionFormat', () => {
      for (const panel of allPanels) {
        const caps = panel.getCapabilities();
        expect(caps.expressionFormats.length).toBeGreaterThan(0);
      }
    });
  });

  describe('formatExpression Non-Empty', () => {
    it('formatExpression returns non-empty string for all panels', () => {
      for (const panel of allPanels) {
        const expr = panel.translate(testConcept);
        const formatted = panel.formatExpression(expr);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Distinctive Features Unique', () => {
    it('getDistinctiveFeature returns panel-specific content (no duplicates)', () => {
      const features: string[] = [];
      for (const panel of allPanels) {
        // Type-safe: cast to any since getDistinctiveFeature is not on PanelInterface
        const feature = (panel as any).getDistinctiveFeature?.(testConcept);
        if (feature) {
          features.push(feature);
        }
      }
      // All panels implement getDistinctiveFeature
      expect(features.length).toBe(6);
      // No two panels return identical features
      const uniqueFeatures = new Set(features);
      expect(uniqueFeatures.size).toBe(6);
    });
  });
});
