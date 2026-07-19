/**
 * Definite Descriptions try-session -- logic (June-2026 arXiv cohort, T2).
 * @module departments/logic/try-sessions/definite-descriptions
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const definiteDescriptionsSession: TrySessionDefinition = {
  id: 'logic-definite-descriptions-first-steps',
  title: "Deriving 'The F is G': Russellian Elimination and Scope",
  description:
    "Build the three-conjunct Russellian expansion of a definite description by hand, then use a tiny finite model to discover how negation scope produces two logically non-equivalent readings of the same sentence.",
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Write the sentence 'The present King of France is bald' and try to give it a truth value while treating 'the King of France' as a name that denotes nothing in your domain; record exactly where the evaluation stalls.",
      expectedOutcome:
        "You see that a genuine singular term with no bearer leaves the atomic sentence with no classical truth value, so reference failure is a real logical defect rather than a stylistic quibble.",
      hint: "In first-order logic every name must denote some element of the domain before any predicate can be applied to it.",
      conceptsExplored: ["logic-definite-descriptions", "log-predicate-logic"],
    },
    {
      instruction:
        "By hand, rewrite the schema 'The F is G' as the three-conjunct formula there-exists x such that (Fx and for-all y (Fy implies y = x) and Gx), and label the three conjuncts existence, uniqueness, and predication.",
      expectedOutcome:
        "You recognize that 'the F' is not a term at all but a compact package of quantifiers and identity, which is the heart of Russell's contextual definition of the definite article.",
      hint: "The uniqueness conjunct is the universally quantified clause that forces every F to be identical to x.",
      conceptsExplored: ["logic-definite-descriptions", "log-predicate-logic"],
    },
    {
      instruction:
        "Fix a finite domain {a, b, c}, choose predicate extensions in which exactly one element satisfies F, and evaluate the three-conjunct formula step by step down to a single truth value.",
      expectedOutcome:
        "You confirm the Russellian expansion is fully bivalent and mechanically computable on a concrete model, needing no appeal to intuition about what 'the F' refers to.",
      hint: "Check the uniqueness clause by testing y against every element of the domain, not only the element you intended.",
      conceptsExplored: ["logic-definite-descriptions", "log-predicate-logic"],
    },
    {
      instruction:
        "Now alter the model so that nothing satisfies F, and re-evaluate the same three-conjunct formula; write down the resulting truth value for the whole sentence.",
      expectedOutcome:
        "You observe the sentence comes out plainly FALSE rather than truth-valueless, so reference failure dissolves into ordinary falsity without invoking any third truth value.",
      hint: "The existence conjunct is the first to fail, and a single false conjunct makes the entire conjunction false.",
      conceptsExplored: ["logic-definite-descriptions", "logic-many-valued-logic"],
    },
    {
      instruction:
        "Write both candidate readings of the negation: the narrow not-(there-exists x (Fx and unique and Gx)) and the wide there-exists x (Fx and unique and not Gx), then mark which reading contains the primary occurrence of the description.",
      expectedOutcome:
        "You understand that negating a definite description is ambiguous precisely because 'the F' unpacks into quantifiers, and that the iota scope bracket is the device that fixes the intended reading.",
      hint: "The position of the negation sign relative to the leading existential quantifier is itself the scope decision.",
      conceptsExplored: ["logic-definite-descriptions", "log-predicate-logic"],
    },
    {
      instruction:
        "Evaluate both the narrow and the wide readings against the model in which nothing satisfies F, and record the two resulting truth values side by side in a small table.",
      expectedOutcome:
        "You see the narrow reading is true while the wide reading is false, which proves the two scopes are logically non-equivalent and that scope is truth-conditionally real, not mere notation.",
      hint: "The wide reading still asserts that a unique F exists, whereas the narrow reading denies the whole existence-uniqueness-predication package.",
      conceptsExplored: ["logic-definite-descriptions", "log-predicate-logic"],
    },
    {
      instruction:
        "Translate a two-description sentence, 'The F is the H', into logic and check that after expansion every occurrence of 'the ...' has vanished, leaving only quantifiers, the identity relation, and the predicates F and H.",
      expectedOutcome:
        "You grasp that 'the' is an incomplete symbol: it has no standalone meaning, is fully eliminable, and is meaningful only in the context of a complete sentence.",
      hint: "Give each description its own existence-and-uniqueness block, then bind the two witnesses with the identity relation.",
      conceptsExplored: ["logic-definite-descriptions", "logic-kuratowski-ordered-pair"],
    },
    {
      instruction:
        "Implement the_F_is_G(domain, F, G) that computes Fs = [x for x in domain if F(x)] and returns len(Fs) == 1 and G(Fs[0]), then run it on both the unique-F and empty-F models and on the negated variants.",
      expectedOutcome:
        "You confirm by execution that the empty and unique cases match your hand derivation, and that moving the not reproduces the narrow-versus-wide scope split you tabulated earlier.",
      hint: "Guard the indexing so the empty case short-circuits to False on len(Fs) == 1 before you ever try to read element zero.",
      conceptsExplored: ["logic-definite-descriptions", "log-predicate-logic"],
    },
  ],
};
