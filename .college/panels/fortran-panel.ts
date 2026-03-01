/**
 * Fortran panel -- scientific computing, array operations, numerical methods.
 *
 * Translates concepts using authentic Fortran idioms for high-performance
 * numerical computation, array-oriented programming, and scientific notation.
 * FORmula TRANslation: the equation IS the code.
 *
 * @module panels/fortran-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── Fortran Panel Implementation ───────────────────────────────────────────

/**
 * The Fortran panel expresses mathematical formulas as code that reads like
 * a textbook equation. Scientific computing heritage: sixty years of
 * computational science, from weather prediction to particle physics.
 */
export class FortranPanel extends PanelInterface {
  readonly panelId: PanelId = 'fortran';
  readonly name = 'Fortran Panel';
  readonly description = 'Scientific computing heritage. Fortran was designed for FORmula TRANslation — mathematical expressions in Fortran look almost exactly like their textbook form. It connects you to sixty years of computational science.';

  translate(concept: RosettaConcept): PanelExpression {
    const code = this.buildFortranCode(concept);
    const explanation = this.buildExplanation(concept);
    const examples = this.buildExamples(concept);
    const pedagogicalNotes = this.buildPedagogicalNotes(concept);

    return {
      panelId: this.panelId,
      code,
      explanation,
      examples,
      pedagogicalNotes,
    };
  }

  getCapabilities(): PanelCapabilities {
    return {
      supportedDomains: ['mathematics', 'physics', 'engineering', 'scientific-computing'],
      mathLibraries: ['intrinsic-math', 'lapack', 'blas'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push('! ── Fortran Panel: Scientific Computing Heritage ─────────────────');
    parts.push('! FORmula TRANslation: the equation IS the code.');
    parts.push('');

    if (expression.code) {
      parts.push(expression.code);
      parts.push('');
    }

    if (expression.explanation) {
      parts.push('! ── Explanation ───────────────────────────────────────────────────');
      for (const line of expression.explanation.split('\n')) {
        parts.push(`! ${line}`);
      }
      parts.push('');
    }

    if (expression.examples && expression.examples.length > 0) {
      parts.push('! ── Examples ─────────────────────────────────────────────────────');
      for (const example of expression.examples) {
        parts.push(example);
        parts.push('');
      }
    }

    return parts.join('\n');
  }

  getDistinctiveFeature(_concept: RosettaConcept): string {
    return 'Scientific computing heritage -- FORmula TRANslation means mathematical expressions ARE the code. Fortran connects to sixty years of computational science.';
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildFortranCode(concept: RosettaConcept): string {
    if (concept.domain === 'mathematics' && concept.id === 'exponential-decay') {
      return this.buildExponentialDecayFortran();
    }
    return this.buildGenericFortran(concept);
  }

  private buildExponentialDecayFortran(): string {
    return [
      `PROGRAM ExponentialDecay`,
      `  ! FORmula TRANslation: the equation IS the code`,
      `  IMPLICIT NONE`,
      ``,
      `  ! Scientific computing: explicit precision declaration`,
      `  ! KIND=8 gives double precision (~15 significant digits)`,
      `  REAL(KIND=8) :: T_initial, T_ambient, k, t, T_result`,
      `  INTEGER :: i`,
      ``,
      `  T_initial = 212.0D0`,
      `  T_ambient = 72.0D0`,
      `  k = 0.05D0`,
      ``,
      `  ! Newton's cooling law -- the formula translates directly`,
      `  ! Compare the code below to the textbook equation:`,
      `  !   T(t) = T_ambient + (T_initial - T_ambient) * exp(-k*t)`,
      `  ! They are nearly identical. That is the Fortran principle.`,
      ``,
      `  DO i = 0, 60, 10`,
      `    t = REAL(i, KIND=8)`,
      `    T_result = T_ambient + (T_initial - T_ambient) * EXP(-k * t)`,
      `    WRITE(*,'(A,F6.1,A,F8.2)') '  t=', t, '  T=', T_result`,
      `  END DO`,
      ``,
      `END PROGRAM ExponentialDecay`,
      ``,
      `! Equivalent as a pure function:`,
      `REAL(KIND=8) FUNCTION cooling_curve(t, T_init, T_amb, k)`,
      `  REAL(KIND=8), INTENT(IN) :: t, T_init, T_amb, k`,
      `  ! Newton's cooling law -- the formula translates directly`,
      `  cooling_curve = T_amb + (T_init - T_amb) * EXP(-k * t)`,
      `END FUNCTION cooling_curve`,
    ].join('\n');
  }

  private buildGenericFortran(concept: RosettaConcept): string {
    const safeName = concept.id.replace(/-/g, '_').toUpperCase().substring(0, 20);
    return [
      `PROGRAM ${safeName}`,
      `  ! ${concept.name}`,
      `  IMPLICIT NONE`,
      `  REAL(KIND=8) :: value`,
      `  INTEGER :: i`,
      ``,
      `  ! ${concept.description}`,
      `  REAL(KIND=8), DIMENSION(100) :: data_array`,
      ``,
      `  DO i = 1, 100`,
      `    data_array(i) = REAL(i, KIND=8)`,
      `  END DO`,
      ``,
      `END PROGRAM ${safeName}`,
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed in Fortran.`,
      `Fortran (1957) was designed for FORmula TRANslation --`,
      `mathematical expressions look almost exactly like their textbook form.`,
      `Compare the code to the equation: they are nearly identical.`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept): string[] {
    return [
      [
        `! Array-oriented computation: compute cooling curve at many points`,
        `! Fortran's array operations eliminate the need for element-by-element loops`,
        `REAL(KIND=8), DIMENSION(100) :: times, temperatures`,
        `REAL(KIND=8) :: T_initial, T_ambient, k`,
        ``,
        `! Generate time array`,
        `DO i = 1, 100`,
        `  times(i) = REAL(i, KIND=8)`,
        `END DO`,
        ``,
        `! Whole-array operation: the formula applies to every element`,
        `temperatures = T_ambient + (T_initial - T_ambient) * EXP(-k * times)`,
      ].join('\n'),
    ];
  }

  private buildPedagogicalNotes(_concept: RosettaConcept): string {
    return [
      `FORmula TRANslation: Designed in 1957 by John Backus at IBM, Fortran`,
      `is the oldest high-level language still in active use. Its design principle --`,
      `mathematical formulas should translate directly into code -- means Fortran`,
      `code reads like a textbook equation.`,
      ``,
      `Scientific computing heritage:`,
      `- REAL(KIND=8) declares double precision (~15 significant digits)`,
      `- EXP(), SIN(), COS(), SQRT() are intrinsic functions (built into the language)`,
      `- DO loops iterate with clear start, stop, and step values`,
      `- Array operations apply formulas to entire arrays at once`,
      `- IMPLICIT NONE enforces explicit variable declarations`,
      ``,
      `From weather prediction to particle physics, from structural engineering`,
      `to computational chemistry -- Fortran code runs the simulations that`,
      `advance scientific knowledge. The same syntax you see above is running`,
      `on supercomputers today.`,
    ].join('\n');
  }
}
