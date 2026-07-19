/**
 * Instruction Autoformalization try-session -- logic (June-2026 arXiv).
 * @module departments/logic/try-sessions/instruction-autoformalization
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const instructionAutoformalizationSession: TrySessionDefinition = {
  id: 'logic-instruction-autoformalization-first-steps',
  title: "Compiling a Natural-Language Agent Policy into Verified Policy-as-Code",
  description:
    "Take an informal agent policy written in prose, hand-formalize it into Cedar-style permit/forbid rules, run a generator-critic coverage loop, evaluate a request through a default-deny decision point, and state the invariant a verifier would machine-check.",
  estimatedMinutes: 24,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Write down a short natural-language agent policy with three clauses — e.g. 'the billing agent may issue refunds up to $50', 'it must never email customers', 'it may read but not write the ledger'. Underline the obligation, permission, and prohibition in each clause.",
      expectedOutcome:
        "You see that an agent instruction is really a set of deontic statements — permissions, prohibitions, and bounded obligations — even when it is phrased as ordinary prose.",
      hint: "Every 'may', 'must', 'must never', and numeric ceiling is a separate norm to capture.",
      conceptsExplored: ["logic-instruction-autoformalization", "logic-deontic-logic"],
    },
    {
      instruction:
        "Hand-translate each clause into a Cedar-style rule: an effect (permit/forbid), a principal (the agent), an action (refund/email/read/write), a resource, and a condition (amount <= 50). Set the default to deny.",
      expectedOutcome:
        "You have a small policy-as-code ruleset and understand that default-deny with explicit permits is what makes the prohibition clauses enforceable rather than advisory.",
      hint: "A prohibition can be encoded either as an explicit forbid rule or as the absence of any permit — decide which and be consistent.",
      conceptsExplored: ["logic-instruction-autoformalization"],
    },
    {
      instruction:
        "Define a coverage metric: for each NL clause, check whether some rule entails it. Compute coverage = (clauses entailed) / (total clauses) for your hand-written ruleset.",
      expectedOutcome:
        "You can measure how faithfully a formal policy captures its informal source — the exact signal the paper's critic uses to accept or reject a candidate policy.",
      hint: "A clause is uncovered if you can construct a request the clause forbids but your ruleset permits (or vice versa).",
      conceptsExplored: ["logic-instruction-autoformalization"],
    },
    {
      instruction:
        "Simulate the generator-critic loop: deliberately omit one rule so coverage < 1, then have the 'critic' name the uncovered clause and the 'generator' add the missing rule. Repeat until coverage = 1.",
      expectedOutcome:
        "You understand autoformalization as an iterative loop, not a single translation: the critic's coverage feedback is what drives the generator toward a policy that entails the whole specification.",
      hint: "The loop terminates when no request distinguishes the ruleset from the intended NL policy.",
      conceptsExplored: ["logic-instruction-autoformalization"],
    },
    {
      instruction:
        "Evaluate a concrete request — refund of $75 — against your ruleset using forbid-overrides, default-deny semantics. Then evaluate a $40 refund and an email action.",
      expectedOutcome:
        "You see a policy decision point in action: the $75 refund and the email are denied, the $40 refund is permitted, and denial is the default whenever no permit matches.",
      hint: "Forbid-overrides means a matching forbid rule beats any matching permit; default-deny means silence is denial.",
      conceptsExplored: ["logic-instruction-autoformalization"],
    },
    {
      instruction:
        "Connect the ruleset back to deontic logic: map each permit/forbid rule to an O/P/F operator over the agent's action worlds, and check that your default-deny policy has no rule that both obligates and forbids the same action.",
      expectedOutcome:
        "You can read the Cedar policy as the executable image of a deontic norm-base, and you have checked the consistency condition that keeps the enforced policy free of dilemmas.",
      hint: "A permit with an unsatisfiable condition and a forbid on the same action is the policy-as-code analogue of O(phi) and O(not phi).",
      conceptsExplored: ["logic-instruction-autoformalization", "logic-deontic-logic"],
    },
    {
      instruction:
        "State the invariant a verifier should machine-check on the compiled policy — for example, 'every NL clause is entailed by exactly one rule, and the policy is default-deny and dilemma-free' — and describe how a verified proof would certify it before deployment.",
      expectedOutcome:
        "You can articulate the formal guarantee autoformalization is meant to deliver — coverage plus default-deny plus consistency — and how it upgrades a probabilistic guardrail into a machine-checkable one.",
      hint: "Coverage certifies faithfulness to the source; default-deny and dilemma-freedom certify the policy is safe and self-consistent.",
      conceptsExplored: ["logic-instruction-autoformalization", "logic-ai-verified-proof"],
    },
  ],
};
