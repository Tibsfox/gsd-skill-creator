/**
 * HB-05 Five-Principle Structural-Completeness Linter.
 *
 * Implements the five-principle structural-completeness check from
 * arXiv:2604.21090 ("Structural Quality Gaps in AI Governance Prompts";
 * 37% of 34 governance files scored below the structural-completeness
 * threshold). Each principle pairs a TRIGGER pattern (does the SKILL.md
 * make a claim of this category?) with a GROUNDING pattern (does it
 * supply the corresponding structural element?).
 *
 *   1. computability-grounding   — algorithmic claims grounded in
 *      tractability / complexity / decidability discussion.
 *   2. proof-theoretic-structure — deductive claims framed with explicit
 *      if/then/else, premise/conclusion, or invariants.
 *   3. bayesian-epistemology     — uncertainty claims framed with prior /
 *      posterior / confidence / Bayesian language.
 *   4. data-classification       — data-handling claims paired with an
 *      explicit classification (PII / public / internal / restricted /
 *      confidential / etc.).
 *   5. assessment-rubric         — quality / good / better claims paired
 *      with an explicit rubric, criteria, or scoring section.
 *
 * Heuristic discipline:
 *   - false-negative-tolerant by default (a SKILL.md that does not raise
 *     a TRIGGER for principle N is auto-pass on N — we only flag when
 *     the SKILL.md *itself* makes a claim that demands the grounding).
 *   - false-positive-strict in `strict: true` mode (every principle is
 *     evaluated even without trigger; missing grounding fails).
 *
 * The check is purely string-based; it never reaches into the cartridge
 * runtime. Patterns are tuned to be conservative — when in doubt, pass.
 *
 * @module cartridge/linter/structural-completeness
 */

export type Principle =
  | 'computability-grounding'
  | 'proof-theoretic-structure'
  | 'bayesian-epistemology'
  | 'data-classification'
  | 'assessment-rubric';

export const PRINCIPLES: readonly Principle[] = Object.freeze([
  'computability-grounding',
  'proof-theoretic-structure',
  'bayesian-epistemology',
  'data-classification',
  'assessment-rubric',
] as const);

export interface PrincipleResult {
  satisfied: boolean;
  rationale: string;
}

export interface FivePrincipleCheckResult {
  filePath: string;
  passed: boolean;
  principleResults: Record<Principle, PrincipleResult>;
  overallScore: number; // 0..5
}

export interface StructuralCompletenessOptions {
  /**
   * When true, every principle is evaluated regardless of trigger
   * (false-positive-tolerant). When false (default), a principle is
   * auto-pass if no trigger phrase appears (false-negative-tolerant).
   */
  strict?: boolean;
}

/**
 * Each principle is a pair of regex sets:
 *   - `triggers`  : phrases that signal the SKILL.md makes a claim of
 *                   this kind. Lowercase; matched case-insensitively.
 *   - `groundings`: phrases that signal the SKILL.md supplies the
 *                   required structural element.
 */
interface PrincipleSpec {
  principle: Principle;
  triggers: RegExp[];
  groundings: RegExp[];
  triggerLabel: string;
  groundingLabel: string;
}

const SPECS: readonly PrincipleSpec[] = Object.freeze([
  {
    principle: 'computability-grounding',
    triggerLabel: 'computational claim',
    groundingLabel: 'computability/complexity discussion',
    triggers: [
      /\b(algorithm|algorithms|algorithmic)\b/i,
      /\b(comput(?:e|es|ing|ation|ational))\b/i,
      /\b(solve|solves|solving|decid(?:e|able|ability))\b/i,
      /\b(loop|loops|recursion|recursive)\b/i,
    ],
    groundings: [
      /\b(complexity|tractab(?:le|ility|ly)|intractab(?:le|ility))\b/i,
      /\bO\([^)]+\)/, // big-O notation, e.g., O(n log n)
      /\b(polynomial|exponential|np-?complete|np-?hard|p\s*vs\.?\s*np)\b/i,
      /\b(decidab(?:le|ility)|undecidab(?:le|ility)|halt(?:s|ing)?)\b/i,
      /\b(turing|recursion theorem|computab(?:le|ility))\b/i,
    ],
  },
  {
    principle: 'proof-theoretic-structure',
    triggerLabel: 'deductive claim',
    groundingLabel: 'proof-theoretic structure (if/then, premise→conclusion, invariant)',
    triggers: [
      /\b(prove|proves|proof|deduc(?:e|tion|tive)|infer(?:s|ence|red)?)\b/i,
      /\b(theorem|lemma|corollary|axiom)\b/i,
      /\b(implies|entail(?:s|ment)?|follows? from)\b/i,
      /\b(must|always|never)\b.{0,80}\b(then|when|if)\b/i,
    ],
    groundings: [
      /\bif\b[\s\S]{0,200}?\bthen\b/i,
      /\b(premise|conclusion|hypothes(?:is|es))\b/i,
      /\b(invariant|invariants|precondition|postcondition)\b/i,
      /\b(case\s+\d|case\s+analysis|by\s+induction|by\s+contradiction)\b/i,
      /(⇒|=>|→|->)/, // logical implication arrows
    ],
  },
  {
    principle: 'bayesian-epistemology',
    triggerLabel: 'uncertainty claim',
    groundingLabel: 'Bayesian framing (prior/posterior/confidence/probability)',
    triggers: [
      /\b(uncertain(?:ty|ties)?|unsure|ambiguous|likely|unlikely)\b/i,
      /\b(probabl[ey]|maybe|might|perhaps)\b/i,
      /\b(estimate|estimat(?:es|ing|ion)|guess(?:es|ing)?)\b/i,
      /\b(believe|belief|confidence|credence)\b/i,
    ],
    groundings: [
      /\b(prior|posterior|likelihood|bayes(?:ian)?)\b/i,
      /\b(confidence\s+interval|credible\s+interval|p-?value)\b/i,
      /\b(probabilit(?:y|ies)|p\s*\(|\bP\(|distribution)\b/i,
      /\b\d{1,3}\s*%\s*(confidence|certain|sure|chance)\b/i,
      /\b(monte\s+carlo|sampling|posterior\s+update)\b/i,
    ],
  },
  {
    principle: 'data-classification',
    triggerLabel: 'data-handling claim',
    groundingLabel: 'data classification (PII / public / internal / restricted)',
    triggers: [
      /\b(data|input|inputs|payload|payloads)\b/i,
      /\b(read|reads|write|writes|store|stores|persist(?:s|ing|ed)?)\b/i,
      /\b(file|files|database|table|record|records)\b/i,
      /\b(handle|handling|process(?:es|ing)?)\s+.{0,40}\b(data|input|content)\b/i,
    ],
    groundings: [
      /\b(pii|personally\s+identifiable)\b/i,
      /\b(public|internal|restricted|confidential|secret|classified)\b/i,
      /\b(classification|classified\s+as|sensitivity\s+level)\b/i,
      /\b(redact(?:ed|ion)?|anonymi[sz](?:e|ed|ation)|pseudonym(?:ous|i[sz]ed))\b/i,
      /\b(gdpr|hipaa|pci-?dss|soc\s*2|iso\s*27001)\b/i,
    ],
  },
  {
    principle: 'assessment-rubric',
    triggerLabel: 'quality claim',
    groundingLabel: 'assessment rubric / explicit criteria',
    triggers: [
      /\b(quality|good|better|best|excellent|poor|worse|worst)\b/i,
      /\b(correct|incorrect|valid|invalid|accept(?:able|ed)?|reject(?:ed)?)\b/i,
      /\b(success|successful|fail(?:ure|ed)?|score|scoring)\b/i,
      /\b(evaluat(?:e|ion|ed)|assess(?:ment|ed)?)\b/i,
    ],
    groundings: [
      /\b(rubric|criteria|criterion|checklist)\b/i,
      /\b(acceptance\s+criteria|definition\s+of\s+done)\b/i,
      /\b(score|scoring)\s+(of|out|0-?\d|\d\/\d|threshold)/i,
      /\b(pass(?:es|ed|ing)?\s+(if|when|requires)|fails?\s+(if|when))\b/i,
      /\b(metric|metrics|kpi|sla|slo)\b/i,
    ],
  },
]);

function anyMatch(text: string, patterns: readonly RegExp[]): RegExpMatchArray | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m;
  }
  return null;
}

function evaluatePrinciple(
  spec: PrincipleSpec,
  text: string,
  strict: boolean,
): PrincipleResult {
  const triggerMatch = anyMatch(text, spec.triggers);
  const groundingMatch = anyMatch(text, spec.groundings);

  if (groundingMatch) {
    return {
      satisfied: true,
      rationale: `${spec.groundingLabel} present (matched: "${groundingMatch[0]}").`,
    };
  }

  if (!triggerMatch && !strict) {
    // No claim made → auto-pass (false-negative-tolerant default).
    return {
      satisfied: true,
      rationale: `no ${spec.triggerLabel} detected; principle vacuously satisfied.`,
    };
  }

  if (strict) {
    return {
      satisfied: false,
      rationale: `strict mode: ${spec.groundingLabel} missing (no grounding pattern matched).`,
    };
  }

  return {
    satisfied: false,
    rationale:
      `${spec.triggerLabel} present (matched: "${triggerMatch![0]}") but ` +
      `${spec.groundingLabel} missing.`,
  };
}

/**
 * Run the five-principle structural-completeness check on a SKILL.md
 * (or any cartridge .md) document.
 *
 * @param skillMdContent  Markdown file contents.
 * @param filePath        Original path (used for the result record).
 * @param options         Optional strict mode toggle.
 * @returns A `FivePrincipleCheckResult` whose `passed` is true iff every
 *          principle is satisfied. `overallScore` is the count of
 *          satisfied principles in 0..5.
 */
export function checkStructuralCompleteness(
  skillMdContent: string,
  filePath: string,
  options: StructuralCompletenessOptions = {},
): FivePrincipleCheckResult {
  const strict = options.strict === true;
  const text = skillMdContent ?? '';

  const principleResults = {} as Record<Principle, PrincipleResult>;
  let satisfiedCount = 0;
  for (const spec of SPECS) {
    const r = evaluatePrinciple(spec, text, strict);
    principleResults[spec.principle] = r;
    if (r.satisfied) satisfiedCount += 1;
  }

  return {
    filePath,
    passed: satisfiedCount === PRINCIPLES.length,
    principleResults,
    overallScore: satisfiedCount,
  };
}
