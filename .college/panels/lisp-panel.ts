/**
 * Lisp panel -- homoiconicity, where concept definitions ARE manipulable data structures.
 *
 * Translates concepts into Lisp S-expressions that demonstrate code-as-data,
 * macro expansion, and functional composition. In Lisp, a concept definition
 * IS a data structure you can inspect, transform, and compose.
 *
 * @module panels/lisp-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── Lisp Panel Implementation ──────────────────────────────────────────────

/**
 * The Lisp panel produces concept definitions that ARE manipulable data structures.
 *
 * Unlike other panels that generate code which computes, the Lisp panel generates
 * S-expression definitions that can be quoted, decomposed with car/cdr, and composed
 * with cons/append. This is homoiconicity -- code IS data IS curriculum.
 */
export class LispPanel extends PanelInterface {
  readonly panelId: PanelId = 'lisp';
  readonly name = 'Lisp Panel';
  readonly description = 'Code as data (homoiconicity). In Lisp, a concept definition IS a data structure you can inspect, transform, and compose. This is the Rosetta principle in its purest form.';

  /**
   * Translate a concept into homoiconic S-expression form.
   *
   * The returned code IS a data structure -- a quoted list that can be
   * programmatically inspected with car/cdr and composed with cons.
   */
  translate(concept: RosettaConcept): PanelExpression {
    const conceptName = concept.id;
    const safeName = conceptName.replace(/-/g, '_');

    // Build the core S-expression based on domain
    const code = this.buildSExpression(concept, safeName);
    const explanation = this.buildExplanation(concept);
    const examples = this.buildExamples(concept, safeName);
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
      supportedDomains: ['mathematics', 'computer-science', 'formal-languages'],
      mathLibraries: ['common-lisp-math', 'scheme-math'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push(';; ── Lisp Panel: Homoiconic Concept Expression ──────────────────');
    parts.push(';;');
    parts.push(';; The code below IS a data structure. You can quote it, inspect it,');
    parts.push(';; decompose it with car/cdr, and compose it with cons.');
    parts.push('');

    if (expression.code) {
      parts.push(expression.code);
      parts.push('');
    }

    if (expression.explanation) {
      parts.push(';; ── Explanation ──────────────────────────────────────────────────');
      for (const line of expression.explanation.split('\n')) {
        parts.push(`;; ${line}`);
      }
      parts.push('');
    }

    if (expression.examples && expression.examples.length > 0) {
      parts.push(';; ── Examples ─────────────────────────────────────────────────────');
      for (const example of expression.examples) {
        parts.push(example);
        parts.push('');
      }
    }

    return parts.join('\n');
  }

  /**
   * Return the distinctive feature of the Lisp panel for a given concept.
   * Always emphasizes homoiconicity -- that the concept IS a manipulable data structure.
   */
  getDistinctiveFeature(_concept: RosettaConcept): string {
    return 'Homoiconicity -- the concept definition IS a manipulable data structure. You can quote it, car/cdr it, eval it. Code is data is curriculum.';
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildSExpression(concept: RosettaConcept, safeName: string): string {
    if (concept.domain === 'mathematics' && concept.id === 'exponential-decay') {
      return this.buildExponentialDecaySExpr(safeName);
    }
    return this.buildGenericSExpr(concept, safeName);
  }

  private buildExponentialDecaySExpr(safeName: string): string {
    return [
      `;; The concept definition IS a quoted list -- inspectable data`,
      `(quote`,
      `  (define-concept "${safeName}"`,
      `    :domain "mathematics"`,
      `    :description "Newton\'s law of cooling: T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt)"`,
      `    :formula`,
      `      (lambda (t t-initial t-ambient k)`,
      `        (+ t-ambient`,
      `           (* (- t-initial t-ambient)`,
      `              (exp (- (* k t))))))))`,
      ``,
      `;; The same concept as an executable function`,
      `(defun cooling-curve (t t-initial t-ambient k)`,
      `  "Compute temperature at time t using Newton's law of cooling."`,
      `  (+ t-ambient`,
      `     (* (- t-initial t-ambient)`,
      `        (exp (- (* k t))))))`,
      ``,
      `;; Homoiconicity: the definition above IS a list. Prove it:`,
      `;; (car '(defun cooling-curve ...)) => defun`,
      `;; (cdr '(defun cooling-curve ...)) => (cooling-curve (t ...) ...)`,
      `;; (cons 'defmacro (cdr '(defun cooling-curve ...))) => (defmacro cooling-curve ...)`,
      `;;`,
      `;; You can inspect, transform, and compose this definition`,
      `;; because in Lisp, code IS data.`,
    ].join('\n');
  }

  private buildGenericSExpr(concept: RosettaConcept, safeName: string): string {
    return [
      `;; The concept definition IS a quoted list -- inspectable data`,
      `(quote`,
      `  (define-concept "${safeName}"`,
      `    :domain "${concept.domain}"`,
      `    :description "${concept.description}"))`,
      ``,
      `(defun ${safeName}-compute (&rest args)`,
      `  "Compute the ${concept.name} concept."`,
      `  (apply #'+ args))`,
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed as a Lisp S-expression.`,
      `The definition itself is a list -- a data structure that can be`,
      `programmatically inspected and transformed.`,
      `This is homoiconicity: the representation of the program IS`,
      `the data structure that the language manipulates.`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept, safeName: string): string[] {
    const examples: string[] = [];

    // Macro composition example
    examples.push([
      `;; Concept composition via macro -- defmacro creates new syntax`,
      `(defmacro with-decay ((t-initial t-ambient k) &body body)`,
      `  "Macro for composing decay concept into larger expressions."`,
      `  \`(let ((cooling-fn (lambda (t)`,
      `                      (+ ,t-ambient`,
      `                         (* (- ,t-initial ,t-ambient)`,
      `                            (exp (- (* ,k t)))))))`,
      `     ,@body))`,
    ].join('\n'));

    // Data manipulation example
    examples.push([
      `;; The concept definition is data -- manipulate it with car/cdr/cons`,
      `(let ((concept '(define-concept "${safeName}" :domain "${concept.domain}")))`,
      `  (car concept)          ;; => define-concept`,
      `  (cdr concept)          ;; => ("${safeName}" :domain "${concept.domain}")`,
      `  (cons 'extend concept)) ;; => (extend define-concept "${safeName}" ...)`,
    ].join('\n'));

    return examples;
  }

  private buildPedagogicalNotes(concept: RosettaConcept): string {
    return [
      `Homoiconicity: The concept definition you just read IS a list -- a data structure.`,
      `You can (car concept) to get the head, (cdr concept) to get the rest.`,
      `You can (eval concept) to execute it. Code IS data IS curriculum.`,
      ``,
      `This is the purest form of the Rosetta principle: the same concept expressed`,
      `as both program and data structure simultaneously. In Lisp, there is no`,
      `distinction between the representation and the thing represented.`,
      ``,
      `The macro system (defmacro) demonstrates concept composition -- new syntax`,
      `built from existing data structures. A concept can extend, transform, or`,
      `generate other concepts because they are all just lists.`,
      ``,
      `Key insight: When you look at the S-expression above, you are looking at`,
      `both executable code AND a manipulable data structure at the same time.`,
    ].join('\n');
  }
}
