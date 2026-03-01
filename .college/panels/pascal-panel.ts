/**
 * Pascal panel -- Wirth's principles of structured programming.
 *
 * Translates concepts with annotations encoding structured programming
 * discipline: strong typing, procedure decomposition, data abstraction,
 * and stepwise refinement. Every construct has explicit boundaries.
 *
 * @module panels/pascal-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── Pascal Panel Implementation ────────────────────────────────────────────

/**
 * The Pascal panel encodes Wirth's principles in every annotation.
 *
 * A reader learns structured programming by exploring the code -- every
 * begin/end block, every typed declaration, every procedure decomposition
 * teaches discipline that produces clarity.
 */
export class PascalPanel extends PanelInterface {
  readonly panelId: PanelId = 'pascal';
  readonly name = 'Pascal Panel';
  readonly description = 'Structured thinking. Wirth designed Pascal to make the learner understand. Every construct has explicit boundaries. Every variable has a declared type. The discipline produces clarity.';

  translate(concept: RosettaConcept): PanelExpression {
    const code = this.buildPascalCode(concept);
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
      supportedDomains: ['mathematics', 'computer-science', 'education'],
      mathLibraries: ['system-math'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push('{ ── Pascal Panel: Structured Programming ───────────────────────── }');
    parts.push('{ Wirth designed Pascal to teach. Every construct exists to make }');
    parts.push('{ the programmer\'s intent explicit and verifiable. }');
    parts.push('');

    if (expression.code) {
      parts.push(expression.code);
      parts.push('');
    }

    if (expression.explanation) {
      parts.push('{ ── Explanation ─────────────────────────────────────────────────── }');
      for (const line of expression.explanation.split('\n')) {
        parts.push(`{ ${line} }`);
      }
      parts.push('');
    }

    if (expression.examples && expression.examples.length > 0) {
      parts.push('{ ── Examples ──────────────────────────────────────────────────── }');
      for (const example of expression.examples) {
        parts.push(example);
        parts.push('');
      }
    }

    return parts.join('\n');
  }

  getDistinctiveFeature(_concept: RosettaConcept): string {
    return 'Structured programming discipline -- Wirth designed Pascal to make every construct explicit, typed, and decomposed into verifiable units. Clarity through structure.';
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildPascalCode(concept: RosettaConcept): string {
    if (concept.domain === 'mathematics' && (concept.id === 'exponential-decay' || concept.id === 'math-exponential-decay')) {
      return this.buildExponentialDecayPascal();
    }
    return this.buildGenericPascal(concept);
  }

  private buildExponentialDecayPascal(): string {
    return [
      `program ExponentialDecay;`,
      `{ Wirth's Principle: Every program has a name. Every name has meaning. }`,
      ``,
      `var`,
      `  T_initial, T_ambient, k, t, result: Real;`,
      `  { Wirth's Principle: Every variable is declared with its type. }`,
      `  { The declaration IS the documentation. Strong typing prevents }`,
      `  { entire categories of errors before the program ever runs. }`,
      ``,
      `function CoolingCurve(t, T_init, T_amb, k: Real): Real;`,
      `{ Wirth's Principle: Functions decompose complex operations into }`,
      `{ named, typed, self-documenting units. Stepwise refinement means }`,
      `{ each procedure does one thing, clearly. }`,
      `begin`,
      `  CoolingCurve := T_amb + (T_init - T_amb) * Exp(-k * t)`,
      `end;`,
      ``,
      `{ Wirth's Principle: The main block is the top-level abstraction. }`,
      `{ begin...end makes the boundaries of execution explicit. }`,
      `begin`,
      `  T_initial := 212.0;`,
      `  T_ambient := 72.0;`,
      `  k := 0.05;`,
      `  t := 30.0;`,
      `  result := CoolingCurve(t, T_initial, T_ambient, k);`,
      `  WriteLn('Temperature at t=', t:6:1, ': ', result:8:2)`,
      `end.`,
    ].join('\n');
  }

  private buildGenericPascal(concept: RosettaConcept): string {
    const safeName = concept.id.replace(/-/g, '_');
    return [
      `program ${safeName};`,
      `{ Wirth's Principle: Every program has a name. }`,
      ``,
      `var`,
      `  value: Real;`,
      ``,
      `begin`,
      `  { ${concept.name}: ${concept.description} }`,
      `  value := 0.0;`,
      `  WriteLn('${concept.name}')`,
      `end.`,
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed in Pascal.`,
      `Pascal was designed by Niklaus Wirth as a teaching language --`,
      `every construct exists to make the programmer's intent visible.`,
      `The begin/end blocks create explicit scope boundaries.`,
      `The typed var declarations document the data before the logic.`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept): string[] {
    return [
      [
        `{ Wirth's stepwise refinement: decompose into procedures }`,
        `procedure DisplayResult(label: String; value: Real);`,
        `begin`,
        `  WriteLn(label, ': ', value:8:2)`,
        `end;`,
      ].join('\n'),
    ];
  }

  private buildPedagogicalNotes(_concept: RosettaConcept): string {
    return [
      `Niklaus Wirth designed Pascal (1970) to teach programming as a systematic`,
      `discipline. Every design choice encodes a principle:`,
      ``,
      `1. Simplicity: The language has few constructs, each with clear semantics.`,
      `2. Explicit typing: var declarations document data types before logic begins.`,
      `   Strong typed variables prevent errors at compile time, not runtime.`,
      `3. Procedure decomposition: Functions and procedures decompose complexity`,
      `   into named, typed, self-documenting units via stepwise refinement.`,
      `4. Data abstraction: Records and types model the problem domain explicitly.`,
      `5. Stepwise refinement: Wirth's method -- start with the highest-level`,
      `   abstraction and progressively elaborate each step.`,
      ``,
      `Pascal's begin...end blocks make scope boundaries visible. Unlike braces,`,
      `which can be missed, begin and end are words that demand to be read.`,
      `The discipline produces clarity -- and clarity produces correctness.`,
    ].join('\n');
  }
}
