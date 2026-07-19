/**
 * Deontic Logic try-session -- logic (June-2026 arXiv cohort, T2).
 * @module departments/logic/try-sessions/deontic-logic
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const deonticLogicSession: TrySessionDefinition = {
  id: 'logic-deontic-logic-first-steps',
  title: "Deriving Standard Deontic Logic and Making It Survive a Moral Dilemma",
  description:
    "Build Standard Deontic Logic as a small Kripke model of ideal worlds, derive the O/P/F operators and the deontic square, then watch conflicting duties trivialize SDL and repair it into a conflict-tolerant system.",
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Write down a Kripke frame with four worlds and a 0/1 accessibility matrix R, where R[w] marks the deontically ideal worlds seen from world w; then pick a proposition p and assign it a truth value in each of the four worlds.",
      expectedOutcome:
        "You understand that deontic accessibility singles out the acceptable or ideal worlds, and that obligation will be defined as truth across exactly those worlds rather than truth at the actual world.",
      hint: "Think of the ideal worlds seen from w as the futures where every duty in force at w is honored.",
      conceptsExplored: ["logic-deontic-logic"],
    },
    {
      instruction:
        "Define O(phi) at w ('phi is obligatory at w') as: phi holds in every R-ideal world of w. Then compute permission P(phi) = not O(not phi) and prohibition F(phi) = O(not phi) from your frame for the proposition p.",
      expectedOutcome:
        "You see that permission is the modal dual of obligation and prohibition is obligation-of-the-negation, and that O(p) can be true while p is false at the actual world — a violated duty.",
      hint: "P(phi) says at least one ideal world has phi; F(phi) says no ideal world has phi.",
      conceptsExplored: ["logic-deontic-logic"],
    },
    {
      instruction:
        "Place O(phi), F(phi), P(phi), and not-O(phi) at the four corners of the deontic square of opposition and verify from your computed values which pairs are contradictories, contraries, subcontraries, and subalterns.",
      expectedOutcome:
        "You can read the deontic square as the modal reshaping of the classical square of opposition, giving you the full obligatory/forbidden/permitted/omissible vocabulary in one diagram.",
      hint: "O(phi) and P(phi) come out as subalterns — obligatory implies permitted — once seriality holds.",
      conceptsExplored: ["logic-deontic-logic"],
    },
    {
      instruction:
        "Impose axiom D by making R serial — every world sees at least one ideal world — and check that O(phi) implies P(phi) everywhere; then delete an ideal edge to create a dead-end world and watch that implication fail.",
      expectedOutcome:
        "You understand that D (seriality) is exactly the 'no vacuous obligation' constraint that identifies SDL with the normal modal system KD and blocks empty-ideal-slice pathologies.",
      hint: "On a dead-end world the ideal slice is empty, so O(phi) is vacuously true for every phi, even O(false).",
      conceptsExplored: ["logic-deontic-logic", "log-logic-in-law"],
    },
    {
      instruction:
        "Introduce a genuine dilemma by forcing both O(p) and O(not p) at some world, then apply the aggregation rule O(p) and O(q) implies O(p and q) to derive O(p and not p) = O(false), and trace how axiom D turns that into a contradiction.",
      expectedOutcome:
        "You see concretely why SDL cannot represent conflicting duties: aggregation plus seriality collapses any dilemma into triviality, so every proposition becomes obligatory.",
      hint: "O(false) with O(phi)->P(phi) gives P(false), which contradicts the seriality axiom D.",
      conceptsExplored: ["logic-deontic-logic", "logic-many-valued-logic"],
    },
    {
      instruction:
        "Repair the system: drop the aggregation/adjunction rule (a non-adjunctive deontic logic) or swap in a paraconsistent negation, then re-run the O(p)/O(not p) dilemma and confirm you can no longer derive O(false) or arbitrary obligations.",
      expectedOutcome:
        "You understand the paper's core move — conflict tolerance means keeping both duties on the books while blocking the single inference that would explode them into triviality.",
      hint: "If you can never build O(p and not-p) in the first place, the explosion never gets started.",
      conceptsExplored: ["logic-deontic-logic", "logic-many-valued-logic"],
    },
    {
      instruction:
        "Encode a legal contrary-to-duty scenario — 'you ought not to park here; but if you do park, you ought to pay the fine' — show SDL's Chisholm-style inconsistency, then state the non-triviality invariant a verifier could machine-check on your repaired system.",
      expectedOutcome:
        "You can connect deontic logic back to logic-in-law through contrary-to-duty obligations and see how a verified proof could certify that a real norm-base stays consistent under conflict.",
      hint: "The primary duty and the reparational duty must be independently satisfiable; SDL wrongly ties them together.",
      conceptsExplored: ["logic-deontic-logic", "log-logic-in-law", "logic-ai-verified-proof"],
    },
  ],
};
