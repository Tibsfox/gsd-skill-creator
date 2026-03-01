/**
 * Systems Panels Integration Tests
 *
 * Verifies all 3 systems panels (Python, C++, Java) work together,
 * render Mathematics Department concepts correctly, and coexist
 * with the 6 heritage panels in PanelRegistry.
 *
 * Covers: MATH-02
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PanelInterface, PanelRegistry } from './panel-interface.js';
import { PythonPanel } from './python-panel.js';
import { CppPanel } from './cpp-panel.js';
import { JavaPanel } from './java-panel.js';
// Heritage panels for 9-panel coexistence test
import { LispPanel } from './lisp-panel.js';
import { PascalPanel } from './pascal-panel.js';
import { FortranPanel } from './fortran-panel.js';
import { PerlPanel } from './perl-panel.js';
import { AlgolPanel } from './algol-panel.js';
import { UnisonPanel } from './unison-panel.js';
// Math concepts
import {
  exponentialDecay,
  trigFunctions,
  complexNumbers,
  eulerFormula,
  ratiosProportions,
  logarithmicScales,
  fractalGeometry,
} from '../departments/mathematics/concepts/index.js';
import type { RosettaConcept, PanelId, PanelExpression } from '../rosetta-core/types.js';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const systemsPanels: PanelInterface[] = [
  new PythonPanel(),
  new CppPanel(),
  new JavaPanel(),
];

const heritagePanels: PanelInterface[] = [
  new LispPanel(),
  new PascalPanel(),
  new FortranPanel(),
  new PerlPanel(),
  new AlgolPanel(),
  new UnisonPanel(),
];

const allPanels: PanelInterface[] = [...systemsPanels, ...heritagePanels];

const mathConcepts: RosettaConcept[] = [
  exponentialDecay,
  trigFunctions,
  complexNumbers,
  eulerFormula,
  ratiosProportions,
  logarithmicScales,
  fractalGeometry,
];

// ─── Integration Tests ──────────────────────────────────────────────────────

describe('Systems Panels Integration', () => {

  describe('Registry Integration', () => {
    it('all 3 systems panels register in a fresh PanelRegistry without error', () => {
      const registry = new PanelRegistry();
      for (const panel of systemsPanels) {
        expect(() => registry.register(panel)).not.toThrow();
      }
      expect(registry.has('python')).toBe(true);
      expect(registry.has('cpp')).toBe(true);
      expect(registry.has('java')).toBe(true);
    });

    it('all 9 panels (3 systems + 6 heritage) coexist without conflict', () => {
      const registry = new PanelRegistry();
      for (const panel of allPanels) {
        expect(() => registry.register(panel)).not.toThrow();
      }
      expect(registry.getAll()).toHaveLength(9);
    });

    it('panelId uniqueness -- all 3 systems panels have distinct IDs', () => {
      const ids = systemsPanels.map(p => p.panelId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('Cross-Panel Translation (exponential decay)', () => {
    let expressions: Map<PanelId, PanelExpression>;

    beforeAll(() => {
      expressions = new Map();
      for (const panel of systemsPanels) {
        expressions.set(panel.panelId, panel.translate(exponentialDecay));
      }
    });

    it('all 3 panels translate exponentialDecay and return non-empty code', () => {
      for (const [id, expr] of expressions) {
        expect(expr.panelId).toBe(id);
        expect(expr.code).toBeDefined();
        expect(expr.code!.length).toBeGreaterThan(50);
      }
    });

    it('no two panels produce identical code', () => {
      const codes = Array.from(expressions.values()).map(e => e.code);
      for (let i = 0; i < codes.length; i++) {
        for (let j = i + 1; j < codes.length; j++) {
          expect(codes[i]).not.toBe(codes[j]);
        }
      }
    });
  });

  describe('Library Binding Verification', () => {
    it('Python panel uses math.exp for exponential decay', () => {
      const expr = systemsPanels[0].translate(exponentialDecay);
      expect(expr.code).toContain('math.exp');
    });

    it('Python panel uses math.sin/cos for trig functions', () => {
      const expr = systemsPanels[0].translate(trigFunctions);
      expect(expr.code).toContain('math.sin');
      expect(expr.code).toContain('math.cos');
    });

    it('C++ panel uses std::exp and cmath for exponential decay', () => {
      const expr = systemsPanels[1].translate(exponentialDecay);
      expect(expr.code).toContain('std::exp');
      expect(expr.code).toMatch(/<cmath>|cmath/);
      expect(expr.code).toContain('double');
    });

    it('Java panel uses Math.exp in public class for exponential decay', () => {
      const expr = systemsPanels[2].translate(exponentialDecay);
      expect(expr.code).toContain('Math.exp');
      expect(expr.code).toMatch(/public\s+(class|static)/);
    });
  });

  describe('MATH-02: Multi-Concept Rendering', () => {
    it('each of 7 math concepts renders through all 3 systems panels without throwing', () => {
      for (const concept of mathConcepts) {
        for (const panel of systemsPanels) {
          expect(() => {
            const expr = panel.translate(concept);
            expect(expr.code).toBeDefined();
            expect(expr.code!.length).toBeGreaterThan(20);
          }).not.toThrow();
        }
      }
    });

    it('all renderings produce non-empty code for each concept', () => {
      for (const concept of mathConcepts) {
        for (const panel of systemsPanels) {
          const expr = panel.translate(concept);
          expect(expr.code).toBeTruthy();
          expect(expr.panelId).toBe(panel.panelId);
        }
      }
    });
  });

  describe('Pedagogical Annotation Verification', () => {
    it('all 3 panels have non-empty pedagogicalNotes', () => {
      for (const panel of systemsPanels) {
        const expr = panel.translate(exponentialDecay);
        expect(expr.pedagogicalNotes).toBeDefined();
        expect(expr.pedagogicalNotes!.length).toBeGreaterThan(50);
      }
    });

    it('Python notes mention readability or notation', () => {
      const expr = systemsPanels[0].translate(exponentialDecay);
      expect(expr.pedagogicalNotes!.toLowerCase()).toMatch(/readability|mathematical notation/);
    });

    it('C++ notes mention precision, performance, or hardware', () => {
      const expr = systemsPanels[1].translate(exponentialDecay);
      expect(expr.pedagogicalNotes!.toLowerCase()).toMatch(/precision|performance|hardware/);
    });

    it('Java notes mention type safety, platform, or portable', () => {
      const expr = systemsPanels[2].translate(exponentialDecay);
      expect(expr.pedagogicalNotes!.toLowerCase()).toMatch(/type safety|platform|portable/);
    });
  });

  describe('Token Cost Bounds', () => {
    it('no panel exceeds 5000 tokens for any math concept', () => {
      for (const concept of mathConcepts) {
        for (const panel of systemsPanels) {
          const expr = panel.translate(concept);
          const formatted = panel.formatExpression(expr);
          const estimatedTokens = formatted.length / 4;
          expect(estimatedTokens).toBeLessThan(5000);
        }
      }
    });

    it('formatExpression output is reasonably sized (100-20000 chars)', () => {
      for (const panel of systemsPanels) {
        const expr = panel.translate(exponentialDecay);
        const formatted = panel.formatExpression(expr);
        expect(formatted.length).toBeGreaterThan(100);
        expect(formatted.length).toBeLessThan(20000);
      }
    });
  });

  describe('Capability Consistency', () => {
    it('all 3 panels report hasPedagogicalNotes=true and hasCodeGeneration=true', () => {
      for (const panel of systemsPanels) {
        const caps = panel.getCapabilities();
        expect(caps.hasPedagogicalNotes).toBe(true);
        expect(caps.hasCodeGeneration).toBe(true);
      }
    });

    it('all 3 panels include mathematics in supportedDomains', () => {
      for (const panel of systemsPanels) {
        const caps = panel.getCapabilities();
        expect(caps.supportedDomains).toContain('mathematics');
      }
    });
  });

  describe('Distinctive Features', () => {
    it('getDistinctiveFeature returns panel-specific content (no duplicates)', () => {
      const features: string[] = [];
      for (const panel of systemsPanels) {
        const feature = (panel as any).getDistinctiveFeature?.(exponentialDecay);
        if (feature) {
          features.push(feature);
        }
      }
      expect(features.length).toBe(3);
      const uniqueFeatures = new Set(features);
      expect(uniqueFeatures.size).toBe(3);
    });
  });
});
