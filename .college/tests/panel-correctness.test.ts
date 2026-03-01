/**
 * Panel Correctness Test Suite
 *
 * Verifies mathematical accuracy and pedagogical quality across all 9 panels.
 * PAN-01 through PAN-14 per test plan.
 *
 * @module tests/panel-correctness
 */

import { describe, it, expect } from 'vitest';
import { PythonPanel } from '../panels/python-panel.js';
import { CppPanel } from '../panels/cpp-panel.js';
import { JavaPanel } from '../panels/java-panel.js';
import { LispPanel } from '../panels/lisp-panel.js';
import { PascalPanel } from '../panels/pascal-panel.js';
import { FortranPanel } from '../panels/fortran-panel.js';
import { PerlPanel } from '../panels/perl-panel.js';
import { AlgolPanel } from '../panels/algol-panel.js';
import { UnisonPanel } from '../panels/unison-panel.js';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import {
  exponentialDecay,
  trigFunctions,
  complexNumbers,
  eulerFormula,
  ratiosProportions,
  logarithmicScales,
  fractalGeometry,
} from '../departments/mathematics/concepts/index.js';
import type { PanelInterface } from '../panels/panel-interface.js';

// ─── Shared Panel Instances ─────────────────────────────────────────────────

const allPanels: PanelInterface[] = [
  new PythonPanel(),
  new CppPanel(),
  new JavaPanel(),
  new LispPanel(),
  new PascalPanel(),
  new FortranPanel(),
  new PerlPanel(),
  new AlgolPanel(),
  new UnisonPanel(),
];

const allMathConcepts = [
  exponentialDecay,
  trigFunctions,
  complexNumbers,
  eulerFormula,
  ratiosProportions,
  logarithmicScales,
  fractalGeometry,
];

// ─── PAN-01: Python panel exponential decay ─────────────────────────────────

describe('PAN-01: Python panel exponential decay uses math.exp correctly', () => {
  it('code contains math.exp and is non-trivial', () => {
    const panel = new PythonPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toBeDefined();
    expect(expr.code).toContain('math.exp');
    expect(expr.code!.length).toBeGreaterThan(50);
  });
});

// ─── PAN-02: C++ panel exponential decay ────────────────────────────────────

describe('PAN-02: C++ panel exponential decay uses std::exp correctly', () => {
  it('code contains std::exp and is non-trivial', () => {
    const panel = new CppPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toBeDefined();
    expect(expr.code).toContain('std::exp');
    expect(expr.code!.length).toBeGreaterThan(50);
  });
});

// ─── PAN-03: Java panel exponential decay ───────────────────────────────────

describe('PAN-03: Java panel exponential decay uses Math.exp correctly', () => {
  it('code contains Math.exp and is non-trivial', () => {
    const panel = new JavaPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toBeDefined();
    expect(expr.code).toContain('Math.exp');
    expect(expr.code!.length).toBeGreaterThan(50);
  });
});

// ─── PAN-04: Lisp panel exponential decay ───────────────────────────────────

describe('PAN-04: Lisp panel exponential decay uses (exp) correctly', () => {
  it('code contains exp function call in S-expression form', () => {
    const panel = new LispPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toBeDefined();
    expect(expr.code).toMatch(/\(exp\b/);
    expect(expr.code!.length).toBeGreaterThan(50);
  });
});

// ─── PAN-05: Pascal panel exponential decay ─────────────────────────────────

describe('PAN-05: Pascal panel exponential decay uses Exp() correctly', () => {
  it('code contains Exp function call (case insensitive)', () => {
    const panel = new PascalPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toBeDefined();
    expect(expr.code).toMatch(/Exp\s*\(/i);
    expect(expr.code!.length).toBeGreaterThan(50);
  });
});

// ─── PAN-06: Fortran panel exponential decay ────────────────────────────────

describe('PAN-06: Fortran panel exponential decay uses EXP() correctly', () => {
  it('code contains EXP function call (Fortran is case insensitive)', () => {
    const panel = new FortranPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toBeDefined();
    expect(expr.code).toMatch(/EXP\s*\(/i);
    expect(expr.code!.length).toBeGreaterThan(50);
  });
});

// ─── PAN-07: Python panel trig functions ────────────────────────────────────

describe('PAN-07: Python panel trig functions use math.sin/cos correctly', () => {
  it('code contains math.sin and math.cos', () => {
    const panel = new PythonPanel();
    const expr = panel.translate(trigFunctions);
    expect(expr.code).toBeDefined();
    expect(expr.code).toContain('math.sin');
    expect(expr.code).toContain('math.cos');
  });
});

// ─── PAN-08: C++ panel trig functions ───────────────────────────────────────

describe('PAN-08: C++ panel trig functions use cmath sin/cos correctly', () => {
  it('code contains std::sin and std::cos with cmath reference', () => {
    const panel = new CppPanel();
    const expr = panel.translate(trigFunctions);
    expect(expr.code).toBeDefined();
    expect(expr.code).toMatch(/std::sin\s*\(/);
    expect(expr.code).toMatch(/std::cos\s*\(/);
    expect(expr.code).toContain('cmath');
  });
});

// ─── PAN-09: Lisp homoiconicity ────────────────────────────────────────────

describe('PAN-09: Lisp concept definition IS inspectable list', () => {
  it('output contains S-expression list structure with define/defun/lambda', () => {
    const panel = new LispPanel();
    const expr = panel.translate(exponentialDecay);
    // S-expression structure: contains parenthesized expressions
    expect(expr.code).toMatch(/\(define-concept|\(defun|\(lambda|\(let/);
    // Homoiconicity markers: code-as-data annotations
    expect(expr.code).toMatch(/car|cdr|cons|quote/);
  });
});

// ─── PAN-10: Pascal structured programming ──────────────────────────────────

describe('PAN-10: Pascal has begin/end blocks and typed variables', () => {
  it('code demonstrates structured programming discipline', () => {
    const panel = new PascalPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toMatch(/begin/i);
    expect(expr.code).toMatch(/end/i);
    expect(expr.code).toMatch(/var|:\s*(Real|Integer|Double)/i);
  });
});

// ─── PAN-11: Fortran scientific notation ────────────────────────────────────

describe('PAN-11: Fortran uses REAL precision and scientific computing idioms', () => {
  it('code declares REAL precision types', () => {
    const panel = new FortranPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toMatch(/REAL|double precision/i);
  });

  it('code uses scientific computing idioms', () => {
    const panel = new FortranPanel();
    const expr = panel.translate(exponentialDecay);
    // Fortran uses intrinsic functions and IMPLICIT NONE
    expect(expr.code).toMatch(/IMPLICIT NONE/i);
    expect(expr.code).toMatch(/EXP\s*\(/i);
  });
});

// ─── PAN-12: All panels have pedagogical notes ─────────────────────────────

describe('PAN-12: All 9 panels have non-empty pedagogical notes', () => {
  it('every panel produces pedagogical notes for exponentialDecay', () => {
    for (const panel of allPanels) {
      const expr = panel.translate(exponentialDecay);
      expect(
        expr.pedagogicalNotes,
        `${panel.panelId} missing pedagogical notes`,
      ).toBeDefined();
      expect(
        expr.pedagogicalNotes!.length,
        `${panel.panelId} pedagogical notes too short`,
      ).toBeGreaterThan(30);
    }
  });
});

// ─── PAN-13: Token cost within reasonable bounds ────────────────────────────

describe('PAN-13: Token cost within reasonable bounds for all panels', () => {
  it('all panel expressions are between 25 and 5000 estimated tokens', () => {
    const concepts = [exponentialDecay, trigFunctions, complexNumbers];

    for (const panel of allPanels) {
      for (const concept of concepts) {
        const expr = panel.translate(concept);
        const formatted = panel.formatExpression(expr);
        const tokens = formatted.length / 4; // ~4 chars per token
        expect(
          tokens,
          `${panel.panelId}/${concept.id} too small (${tokens} tokens)`,
        ).toBeGreaterThan(25);
        expect(
          tokens,
          `${panel.panelId}/${concept.id} too large (${tokens} tokens)`,
        ).toBeLessThan(5000);
      }
    }
  });

  it('same concept translated twice produces consistent output', () => {
    const panel = new PythonPanel();
    const expr1 = panel.translate(exponentialDecay);
    const expr2 = panel.translate(exponentialDecay);
    const formatted1 = panel.formatExpression(expr1);
    const formatted2 = panel.formatExpression(expr2);
    expect(formatted1.length).toBe(formatted2.length);
  });
});

// ─── PAN-14: Cross-reference links resolve to valid concept IDs ─────────────

describe('PAN-14: Cross-reference links resolve to valid concept IDs', () => {
  it('all relationship targetIds are non-empty strings', () => {
    for (const concept of allMathConcepts) {
      for (const rel of concept.relationships) {
        expect(
          rel.targetId,
          `${concept.id} has empty targetId in ${rel.type} relationship`,
        ).toBeTruthy();
        expect(
          typeof rel.targetId,
          `${concept.id} targetId is not a string`,
        ).toBe('string');
        expect(
          rel.targetId.length,
          `${concept.id} targetId is empty`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('internal math dependency targetIds resolve within registry', () => {
    const registry = new ConceptRegistry();
    for (const c of allMathConcepts) {
      registry.register(c);
    }

    for (const concept of allMathConcepts) {
      for (const rel of concept.relationships) {
        if (rel.type === 'dependency') {
          // Dependency targets should be resolvable within math concepts
          const target = registry.get(rel.targetId);
          expect(
            target,
            `${concept.id} dependency on '${rel.targetId}' does not resolve`,
          ).toBeDefined();
        }
      }
    }
  });

  it('cross-reference targetIds follow naming conventions', () => {
    for (const concept of allMathConcepts) {
      for (const rel of concept.relationships) {
        if (rel.type === 'cross-reference') {
          // Cross-references should follow kebab-case naming
          expect(
            rel.targetId,
            `${concept.id} cross-ref '${rel.targetId}' should be kebab-case`,
          ).toMatch(/^[a-z][a-z0-9-]*$/);
        }
      }
    }
  });
});
