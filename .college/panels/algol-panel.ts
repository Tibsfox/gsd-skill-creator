/**
 * ALGOL panel -- BNF notation as meta-language, block structure, three-syntax architecture.
 *
 * ALGOL is the ancestor panel -- it teaches why every other panel looks the way it does.
 * ALGOL introduced block structure, lexical scoping, recursive procedures, BNF, and
 * the three-syntax architecture that IS the original Rosetta pattern.
 *
 * @module panels/algol-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── ALGOL Panel Implementation ─────────────────────────────────────────────

/**
 * The ALGOL panel teaches the evolutionary history of programming itself.
 *
 * Understanding ALGOL means understanding why C uses braces, why Java has
 * lexical scoping, and why every language specification uses BNF.
 * The three-syntax architecture (reference, publication, implementation)
 * is the original Rosetta pattern from 1960.
 */
export class AlgolPanel extends PanelInterface {
  readonly panelId: PanelId = 'algol';
  readonly name = 'ALGOL Panel';
  readonly description = 'The mother of structured programming. ALGOL introduced block structure, lexical scoping, recursive procedures, and Backus-Naur Form (BNF). ALGOL\'s three-syntax architecture (reference, publication, implementation) is the original Rosetta pattern. For thirty years, it was the ACM\'s standard for publishing algorithms -- code AS curriculum.';

  translate(concept: RosettaConcept): PanelExpression {
    const code = this.buildAlgolCode(concept);
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
      supportedDomains: ['computer-science', 'formal-languages', 'mathematics', 'algorithm-design'],
      mathLibraries: ['algol60-math'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push('comment ── ALGOL Panel: The Ancestor ────────────────────────────────;');
    parts.push('comment ALGOL introduced block structure, BNF, and three-syntax;');
    parts.push('');

    if (expression.code) {
      parts.push(expression.code);
      parts.push('');
    }

    if (expression.explanation) {
      parts.push('comment ── Explanation ──────────────────────────────────────────────;');
      for (const line of expression.explanation.split('\n')) {
        parts.push(`comment ${line};`);
      }
      parts.push('');
    }

    if (expression.examples && expression.examples.length > 0) {
      parts.push('comment ── Examples ─────────────────────────────────────────────────;');
      for (const example of expression.examples) {
        parts.push(example);
        parts.push('');
      }
    }

    return parts.join('\n');
  }

  getDistinctiveFeature(concept: RosettaConcept): string {
    if (concept.domain === 'formal-languages') {
      return 'BNF notation -- the meta-language that defines the syntax of every programming language.';
    }
    if (concept.domain === 'computer-science') {
      return 'The ancestor panel -- ALGOL introduced block structure, scoping, and recursion that every modern language inherits.';
    }
    return 'Three-syntax architecture: reference, publication, implementation -- the original Rosetta pattern (1960).';
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildAlgolCode(concept: RosettaConcept): string {
    if (concept.domain === 'mathematics' && (concept.id === 'exponential-decay' || concept.id === 'math-exponential-decay')) {
      return this.buildExponentialDecayAlgol();
    }
    return this.buildGenericAlgol(concept);
  }

  private buildExponentialDecayAlgol(): string {
    return [
      `comment ALGOL 60 -- Reference Syntax;`,
      `comment The mother of structured programming (1960);`,
      ``,
      `begin`,
      `  comment Block structure: begin...end creates a nested scope;`,
      `  comment This is the ancestor of { } in C, C++, Java, JavaScript;`,
      ``,
      `  real T_initial, T_ambient, k, t;`,
      `  comment Local variables with block scope -- ALGOL invented this;`,
      ``,
      `  real procedure cooling_curve(t, T_init, T_amb, k);`,
      `    value t, T_init, T_amb, k;`,
      `    real t, T_init, T_amb, k;`,
      `    comment Recursive procedures -- controversial in ALGOL 60;`,
      `    comment The committee debated whether recursion was practical;`,
      `    comment Now it is fundamental to every language;`,
      `    cooling_curve := T_amb + (T_init - T_amb) * exp(-k * t);`,
      ``,
      `  comment Integer procedure demonstrating recursion;`,
      `  integer procedure factorial(n);`,
      `    value n;`,
      `    integer n;`,
      `    factorial := if n = 0 then 1 else n * factorial(n - 1);`,
      ``,
      `  T_initial := 212.0;`,
      `  T_ambient := 72.0;`,
      `  k := 0.05;`,
      `  t := 30.0;`,
      ``,
      `end`,
    ].join('\n');
  }

  private buildGenericAlgol(concept: RosettaConcept): string {
    const safeName = concept.id.replace(/-/g, '_');
    return [
      `comment ALGOL 60 -- Reference Syntax;`,
      `begin`,
      `  real ${safeName}_value;`,
      `  comment ${concept.name}: ${concept.description};`,
      `  ${safeName}_value := 0.0`,
      `end`,
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed in ALGOL 60, the ancestor of structured programming.`,
      ``,
      `Three-syntax architecture -- the original Rosetta pattern:`,
      `1. Reference syntax: the canonical ALGOL code above (formal definition)`,
      `2. Publication syntax: formatted with mathematical symbols for journals`,
      `   (subscripts, Greek letters, special operators)`,
      `3. Implementation syntax: machine-specific encoding for actual execution`,
      ``,
      `The same algorithm, three representations. The Rosetta principle, 1960.`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept): string[] {
    return [
      // BNF grammar
      [
        `comment BNF -- Backus-Naur Form: the meta-language of all programming languages;`,
        `comment Every language spec you have ever read uses BNF, invented for ALGOL;`,
        ``,
        `comment Grammar for arithmetic expressions in BNF:`,
        `  <expression> ::= <term> | <expression> "+" <term> | <expression> "-" <term>`,
        `  <term> ::= <factor> | <term> "*" <factor> | <term> "/" <factor>`,
        `  <factor> ::= <number> | "(" <expression> ")" | <identifier>`,
        `  <number> ::= <digit> | <number> <digit>`,
      ].join('\n'),
      // Three-syntax demonstration
      [
        `comment ── Three-Syntax Architecture ──────────────────────────;`,
        `comment Reference syntax (canonical): cooling_curve := T_amb + (T_init - T_amb) * exp(-k * t);`,
        `comment Publication syntax (journal): T(t) = T_ambient + (T_initial - T_ambient) * e^{-kt};`,
        `comment Implementation syntax (machine): LOAD T_amb; PUSH T_init; SUB T_amb; MULT EXP_NEG_KT; ADD;`,
        `comment The Rosetta principle, 1960 -- same concept, three representations.;`,
      ].join('\n'),
      // Descendant tree
      [
        `comment ── Descendant Tree ─────────────────────────────────────;`,
        `comment ALGOL 60 -> Pascal (Wirth simplified ALGOL for teaching);`,
        `comment   Pascal -> Modula-2 -> Oberon;`,
        `comment ALGOL 60 -> CPL -> BCPL -> B -> C (Thompson/Ritchie);`,
        `comment   C -> C++ (Stroustrup) -> Java (Gosling);`,
        `comment ALGOL 68 -> influenced ML -> Haskell;`,
        `comment Most panel languages in the Rosetta Core descend from ALGOL.;`,
      ].join('\n'),
      // Call-by-name
      [
        `comment ── Call-by-Name Evaluation ──────────────────────────────;`,
        `comment ALGOL 60 introduced call-by-name: arguments are re-evaluated each use;`,
        `comment This is like lazy evaluation or thunks in modern languages;`,
        `comment Jensen's Device uses call-by-name to create generic summation:;`,
        `real procedure sum(term, i, lo, hi);`,
        `  value lo, hi;`,
        `  real term; integer i, lo, hi;`,
        `  begin real s; s := 0;`,
        `    for i := lo step 1 until hi do s := s + term;`,
        `    sum := s`,
        `  end;`,
        `comment Call: sum(1/i, i, 1, 100) -- 'term' is re-evaluated each iteration!;`,
      ].join('\n'),
    ];
  }

  private buildPedagogicalNotes(_concept: RosettaConcept): string {
    return [
      `ALGOL 60 (1960) is the ancestor of nearly every structured programming language.`,
      `Its innovations are so foundational that they are invisible -- you use them every day:`,
      ``,
      `- Block structure (begin...end): Creates nested scopes with local variables.`,
      `  C/C++/Java translated begin...end into { }, but the concept is ALGOL's.`,
      `  This is the ancestor of every brace-delimited block in modern languages.`,
      ``,
      `- BNF (Backus-Naur Form): The meta-language that defines the syntax of every`,
      `  programming language. <expression> ::= <term> | <expression> "+" <term>.`,
      `  Every language specification you have ever read uses BNF.`,
      ``,
      `- Recursive procedures: Controversial in 1960 (some committee members opposed it).`,
      `  Now fundamental to every programming language.`,
      ``,
      `- Call-by-name: Arguments re-evaluated at each use, like lazy evaluation and thunks.`,
      ``,
      `- Three-syntax architecture: Reference syntax (formal), publication syntax (human),`,
      `  implementation syntax (machine). The Rosetta principle, invented in 1960.`,
      ``,
      `- Descendant lineage:`,
      `  ALGOL 60 -> Pascal (Wirth simplified ALGOL for teaching)`,
      `  ALGOL 60 -> CPL -> BCPL -> B -> C -> C++ -> Java`,
      `  Most languages in the Rosetta Core descend from ALGOL.`,
      ``,
      `ALGOL deliberately omitted I/O to remain machine-independent -- a deliberate`,
      `design choice teaching the tradeoff between universality and practicality.`,
      `This made ALGOL unsuitable for commercial use but perfect for algorithm`,
      `publication. For thirty years, the ACM published algorithms in ALGOL.`,
    ].join('\n');
  }
}
