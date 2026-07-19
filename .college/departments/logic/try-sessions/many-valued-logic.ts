/**
 * Many-Valued Logic try-session -- truth beyond {T, F}.
 *
 * Walk a learner through the systems that reject bivalence: build the
 * Kleene strong three-valued tables, contrast them with Lukasiewicz,
 * construct Belnap's four-valued FDE (true, false, both, neither),
 * see how a designated-value set decides validity, watch classical
 * laws (excluded middle, explosion) fail, and hand-check one argument
 * for designated-value preservation.
 *
 * @module departments/logic/try-sessions/many-valued-logic
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const manyValuedLogicSession: TrySessionDefinition = {
  id: 'logic-many-valued-logic-first-steps',
  title: 'Many-Valued Logic: Truth Beyond True and False',
  description:
    'A guided first pass through logics that reject bivalence -- ' +
    'building the Kleene three-valued negation and conjunction tables, ' +
    'contrasting Kleene with Lukasiewicz on implication, constructing ' +
    'Belnap\'s four-valued FDE, using a designated-value set to decide ' +
    'validity, watching the law of excluded middle and explosion fail, ' +
    'and hand-checking one argument for designated-value preservation.',
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Take the three Kleene values ordered F < U < T, where U is "undefined / indeterminate". Compute the strong Kleene truth tables for negation (~) and conjunction (&) by hand: ~T=F, ~F=T, ~U=U, and A&B = min(A,B) on that ordering. Fill in all nine rows of the & table.',
      expectedOutcome:
        'You produce a 3x3 conjunction table where T&T=T, T&U=U, T&F=F, U&U=U, U&F=F, F&anything=F, and a negation table that fixes U as its own negation. You see that & is lattice meet (min) and, by the dual, disjunction is lattice join (max) over F < U < T.',
      hint: 'Strong Kleene reads U as "value not yet known": T&U is U because the result depends on the unknown, but F&U is F because a false conjunct already forces the whole conjunction false regardless of the unknown.',
      conceptsExplored: ['logic-many-valued-logic', 'log-truth-tables'],
    },
    {
      instruction:
        'Now compute the Lukasiewicz three-valued implication and compare it to the Kleene material implication (A->B defined as ~A | B). Focus on the single row A=U, B=U. What does Kleene give, and what does Lukasiewicz give?',
      expectedOutcome:
        'You derive that Kleene A->B = ~A|B gives U->U = U|U = U, whereas Lukasiewicz defines U->U = T (an implication from a value to itself is designated). You conclude the two three-valued logics share negation, conjunction and disjunction but diverge on implication -- Lukasiewicz keeps A->A a tautology, Kleene does not.',
      hint: 'Lukasiewicz built his implication to preserve reflexivity of entailment; the divergence is exactly the U->U cell. Everything else in the two implication tables agrees.',
      conceptsExplored: ['logic-many-valued-logic', 'log-truth-tables'],
    },
    {
      instruction:
        'Switch to Belnap\'s four-valued FDE. Its values are not on a single line -- they form a bilattice over two independent bits: "told true?" and "told false?". Enumerate the four states and name each: (told-true only), (told-false only), (told both), (told neither).',
      expectedOutcome:
        'You list the four values as T = told-true-not-false, F = told-false-not-true, Both (B, contradictory: told true AND false), and Neither (N, no information: told neither). You see FDE as the logic of a database that may be over-informed (Both) or under-informed (Neither) about any atom.',
      hint: 'Belnap motivated FDE with a computer database fed by inconsistent and incomplete sources: Both models a clash between two sources, Neither models a gap where no source spoke.',
      conceptsExplored: ['logic-many-valued-logic', 'log-propositional-logic'],
    },
    {
      instruction:
        'Introduce designated values -- the subset that plays the role classical logic gives to {true}. An argument is valid iff every valuation sending all premises to designated values also sends the conclusion to a designated value. Compare K3 (designated = {T}) with Priest\'s LP (designated = {T, U}). Which one designates the "middle" value?',
      expectedOutcome:
        'You state that K3 (Kleene) designates only {T}, while LP (Logic of Paradox) reuses the same three values and truth tables but designates {T, U}, reading U as "both true and false". Validity is designation-preservation, so changing the designated set -- with identical connective tables -- yields a different consequence relation.',
      hint: 'The connectives can be byte-identical between K3 and LP; only the designated set differs. That single choice is what makes LP paraconsistent and K3 not.',
      conceptsExplored: ['logic-many-valued-logic', 'log-propositional-logic'],
    },
    {
      instruction:
        'Test the law of excluded middle, p | ~p, in Kleene K3. Evaluate it at p = U and check whether it is a tautology (designated under every valuation). Then test the law of non-contradiction ~(p & ~p) at p = U as well.',
      expectedOutcome:
        'You compute p|~p at p=U as U|U = U, which is NOT designated in K3 ({T} only), so excluded middle fails to be a K3 tautology. Likewise ~(p & ~p) at p=U is ~(U) = U, also undesignated -- non-contradiction fails too. You conclude that abandoning bivalence costs you the classical tautologies at the indeterminate value.',
      hint: 'This is the point of a three-valued gap logic: neither p|~p nor its negation is forced. In LP, by contrast, U is designated, so both come out designated -- LP keeps the laws but tolerates contradiction instead.',
      conceptsExplored: ['logic-many-valued-logic', 'log-truth-tables'],
    },
    {
      instruction:
        'Test explosion (ex contradicto quodlibet): from p & ~p, does an arbitrary q follow? Check it in LP by finding a valuation where the premise p & ~p is designated but the conclusion q is not. Try p = U (designated in LP) and q = F.',
      expectedOutcome:
        'You find that at p=U, LP gives p & ~p = U & U = U, which is designated, while q = F is not designated -- so the premise is designated and the conclusion is not, and explosion FAILS. You conclude LP is paraconsistent: a contradiction does not entail everything, which is exactly why the middle value is designated.',
      hint: 'Paraconsistency is the payoff of designating the "both" value: you can reason from an inconsistent set of premises without deriving arbitrary garbage. The same valuation trick shows FDE is paraconsistent too.',
      conceptsExplored: ['logic-many-valued-logic', 'log-propositional-logic'],
    },
    {
      instruction:
        'Hand-check one full validity claim: is modus ponens (p, p->q therefore q) valid in Lukasiewicz L3? Enumerate the valuations where both premises are designated ({T}) and verify q is designated in each. Then place Many-Valued Logic on the complex plane of experience -- a Formal Logic concept at theta = 5*2*pi/23 on the radius-0.82 circle.',
      expectedOutcome:
        'You enumerate the rows where p = T and p->q = T (Lukasiewicz), find they force q = T in every such row, and conclude modus ponens is L3-valid. You summarise the whole session: many-valued logic recomputes the connectives over an enlarged value set and lets a chosen designated subset decide validity, generalising the two-row truth table to 3, 4, or n rows. You note the concept sits at theta=5*2*pi/23, radius 0.82 -- abstract, formal, moderately complex.',
      hint: 'A validity check is always the same procedure regardless of value count: hold the premises at designated values, sweep the free variables, and confirm the conclusion never drops out of the designated set. Only the size of the sweep grows.',
      conceptsExplored: ['logic-many-valued-logic', 'log-truth-tables', 'log-propositional-logic'],
    },
  ],
};
