/**
 * Unison panel -- content-addressed code with hash-based identity.
 *
 * Demonstrates Unison's revolutionary approach: code identified by content hash,
 * not by name. Stored as typed ASTs in a database, not text files. Algebraic
 * effects ("abilities") make side effects visible in type signatures.
 *
 * @module panels/unison-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── Unison Panel Implementation ────────────────────────────────────────────

/**
 * The Unison panel is the existence proof that the Rosetta Core's vision
 * of canonical concept identity -- independent of expression -- works as
 * a real programming language.
 *
 * A function's identity is its content hash. Rename it to anything and
 * the hash stays the same. Names are metadata. Identity is content.
 */
export class UnisonPanel extends PanelInterface {
  readonly panelId: PanelId = 'unison';
  readonly name = 'Unison Panel';
  readonly description = 'Content-addressed code — a function\'s identity is its content hash, not its name. Code stored as typed ASTs in a database, not text files. Names are metadata. Builds don\'t exist. Dependency conflicts are structurally impossible. Algebraic effects ("abilities") make side effects visible in type signatures.';

  translate(concept: RosettaConcept): PanelExpression {
    const code = this.buildUnisonCode(concept);
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
      supportedDomains: ['distributed-computing', 'type-theory', 'functional-programming', 'mathematics'],
      mathLibraries: ['base.Float', 'base.Nat', 'base.Int'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push('-- ── Unison Panel: Content-Addressed Code ─────────────────────────');
    parts.push('-- Identity is content hash. Names are metadata.');
    parts.push('');

    if (expression.code) {
      parts.push(expression.code);
      parts.push('');
    }

    if (expression.explanation) {
      parts.push('-- ── Explanation ─────────────────────────────────────────────────');
      for (const line of expression.explanation.split('\n')) {
        parts.push(`-- ${line}`);
      }
      parts.push('');
    }

    if (expression.examples && expression.examples.length > 0) {
      parts.push('-- ── Examples ────────────────────────────────────────────────────');
      for (const example of expression.examples) {
        parts.push(example);
        parts.push('');
      }
    }

    return parts.join('\n');
  }

  getDistinctiveFeature(concept: RosettaConcept): string {
    if (concept.domain === 'distributed-computing') {
      return 'Content-addressed code enables trivial distributed deployment -- send the hash, the code follows.';
    }
    if (concept.domain === 'type-theory') {
      return 'Abilities (algebraic effects) make side effects visible and testable in type signatures.';
    }
    return 'Content-addressed code -- a function\'s identity is its content hash, not its name. The Rosetta Core\'s concept identity principle as a working language.';
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildUnisonCode(concept: RosettaConcept): string {
    if (concept.domain === 'mathematics' && concept.id === 'exponential-decay') {
      return this.buildExponentialDecayUnison();
    }
    return this.buildGenericUnison(concept);
  }

  private buildExponentialDecayUnison(): string {
    return [
      `-- Unison: content-addressed code`,
      `-- This function's identity is its hash, not its name.`,
      `-- Rename it to anything -- the hash stays the same.`,
      ``,
      `coolingCurve : Float -> Float -> Float -> Float -> Float`,
      `coolingCurve t tInitial tAmbient k =`,
      `  tAmbient + (tInitial - tAmbient) * Float.exp (Float.negate k * t)`,
      ``,
      `-- Hash: #k2f8a3b1x9  (computed from the AST, not the name)`,
      `-- If we wrote:`,
      `--   exponentialDecay : Float -> Float -> Float -> Float -> Float`,
      `--   exponentialDecay t tInitial tAmbient k =`,
      `--     tAmbient + (tInitial - tAmbient) * Float.exp (Float.negate k * t)`,
      `-- The hash would be: #k2f8a3b1x9  (same hash! same structure, different name)`,
      `-- Names are metadata. Identity is content.`,
      ``,
      `-- Watch expression: evaluate and cache by hash`,
      `> coolingCurve 30.0 212.0 72.0 0.05`,
    ].join('\n');
  }

  private buildGenericUnison(concept: RosettaConcept): string {
    const safeName = concept.id.replace(/-/g, '');
    return [
      `-- Unison: content-addressed code`,
      `${safeName} : Text -> Text`,
      `${safeName} input = "${concept.name}: " ++ input`,
      ``,
      `-- Hash: #abc123 (computed from AST)`,
      `> ${safeName} "example"`,
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed in Unison, the content-addressed language.`,
      ``,
      `The function above has a content hash computed from its typed AST.`,
      `Renaming it does not change the hash because the structure is identical.`,
      `This parallels the Rosetta Core's canonical concept identity --`,
      `a concept's identity is independent of how it is expressed.`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept): string[] {
    return [
      // Ability declaration with handler
      [
        `-- Abilities: side effects visible in type signatures`,
        `-- Maps to the Calibration Engine's observe/compare/adjust/record cycle`,
        `ability Calibrate where`,
        `  observe : Result -> Observation`,
        `  compare : Observation -> Intent -> Delta`,
        `  adjust  : Delta -> DomainModel -> Adjustment`,
        `  record  : Adjustment -> ()`,
        ``,
        `-- A function declares its effects in its type:`,
        `cookAndCalibrate : Recipe ->{Calibrate, IO} Meal`,
        ``,
        `-- Handler swaps implementation without changing code:`,
        `-- Swap the handler for testing, not the code -- effect isolation`,
        `handle cookAndCalibrate recipe with`,
        `  Calibrate.observe result -> resume (Observation result)`,
        `  Calibrate.compare obs intent -> resume (computeDelta obs intent)`,
      ].join('\n'),
      // Codebase-as-database
      [
        `-- Codebase as database:`,
        `-- Unison stores code as typed ASTs in SQLite, not as text files.`,
        `-- Names are metadata attached to hashes.`,
        `-- Builds don't exist -- there's nothing to compile.`,
        `-- Dependency conflicts are structurally impossible.`,
        `-- Like the Rosetta Core's Concept Registry:`,
        `--   canonical concept identity separates identity from naming.`,
        `-- In Unison, #k2f8a3b1x9 IS the function, "coolingCurve" is just a label.`,
        `> List.map (coolingCurve 212.0 72.0 0.05) [0.0, 10.0, 20.0, 30.0]`,
      ].join('\n'),
    ];
  }

  private buildPedagogicalNotes(_concept: RosettaConcept): string {
    return [
      `Content-addressed code: A function's identity is its content hash, not its name.`,
      `Two differently-named functions with identical structure produce the same hash.`,
      `This is the Rosetta Core's concept identity principle as a working language.`,
      ``,
      `Codebase as database: Unison stores code as typed ASTs in SQLite, not as text files.`,
      `Names are metadata. Builds don't exist. Dependency conflicts are structurally impossible.`,
      ``,
      `Abilities (algebraic effects): Side effects are declared in type signatures.`,
      `A function's type tells you exactly what effects it can perform.`,
      `Swap the handler to swap the implementation -- perfect for testing and isolation.`,
      ``,
      `The Calibration Engine parallel: Unison's ability Calibrate where observe/compare/`,
      `adjust/record maps directly to the Calibration Engine's feedback cycle. Both separate`,
      `the description of WHAT effects occur from HOW they are handled.`,
      ``,
      `Concept Registry parallel: Unison's hash-based identity and the Rosetta Core's`,
      `canonical concept identity both separate identity from naming. A concept is what`,
      `it IS (its structure/content), not what it's CALLED (its name).`,
    ].join('\n');
  }
}
