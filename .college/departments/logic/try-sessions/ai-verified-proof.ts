/**
 * AI-Verified Proof try-session -- propose / verify / audit pipeline.
 *
 * Walk a learner through the April 13, 2026 GPT-5.4 Pro proof of Erdős
 * problem #1196 (the Erdős-Sárközy-Szemerédi conjecture on primitive
 * sums) -- from the erdosproblems.com entry, through the Lean
 * formalisation in the DeepMind formal-conjectures repository, to the
 * survivorship-bias caveat Tao flagged, and finally to one other
 * AI-verified Erdős entry the learner discovers for themselves.
 *
 * @module departments/logic/try-sessions/ai-verified-proof
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const aiVerifiedProofSession: TrySessionDefinition = {
  id: 'logic-ai-verified-proof-first-steps',
  title: 'AI-Verified Proof: Propose, Verify, Audit',
  description:
    'A guided first pass through the April 13, 2026 GPT-5.4 Pro proof ' +
    'of Erdős problem #1196 -- reading the erdosproblems.com entry and ' +
    'Tao\'s verification note, examining the Lean formalisation in the ' +
    'DeepMind formal-conjectures repository, comparing the natural-' +
    'language proof to the Lean script, identifying the survivorship-' +
    'bias caveat Tao flagged, and locating one other AI-verified Erdős ' +
    'entry for comparison.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Open https://www.erdosproblems.com/1196 and read the entry for the Erdős-Sárközy-Szemerédi conjecture on primitive sums. Note the statement: for any primitive sequence A (no term divides another), ∑_{a in A} 1/(a log a) ≤ 1 + O(1/log x) under the stronger asymptotic. What was the status before April 13, 2026, and what does the "complete proof" edit from that date claim?',
      expectedOutcome:
        'You articulate the problem (a primitive-sequence sum bound), the historical record (conjectured 1935, partial results by Erdős and Sárközy over decades), and the April 13 2026 status flip from open to "solved by GPT-5.4 Pro in a single ~80-minute run, prompted by Liam \'Eric\' Price." You note the Lean formalisation link and the audit-by-Tao note.',
      hint: 'erdosproblems.com is a curated live registry -- every entry carries a status field (Open / Partial / Solved) and a changelog of who last touched it. #1196 is one of the flagship AI-verified entries.',
      conceptsExplored: ['logic-ai-verified-proof', 'math-erdos-problem-index'],
    },
    {
      instruction:
        'Open the DeepMind formal-conjectures repository (github.com/deepmind/formal-conjectures) and locate the Lean 4 file for #1196. Scan the proof script. How long is it (rough line count), and what are the top-level tactics you see used?',
      expectedOutcome:
        'You find the file (something like `Erdos/1196.lean` or `PrimitiveSums.lean`), note the script is on the order of hundreds to a few thousand lines, and identify common Lean 4 tactics: `intro`, `rcases`, `by_contra`, `ring_nf`, `omega`, `simp [*]`, `exact`, and invocations of domain-specific lemmas from Mathlib (primitive-sequence lemmas, log-sum inequalities, prime-counting asymptotics).',
      hint: 'Lean 4 tactic blocks are readable by a numerate outsider -- the keywords are mostly English verbs. You do not need to run the file; you are auditing the shape of the argument.',
      conceptsExplored: ['logic-ai-verified-proof'],
    },
    {
      instruction:
        'Compare the natural-language proof that GPT-5.4 Pro produced (as quoted on erdosproblems.com or in Price\'s X/Twitter thread announcing the result) against the Lean file you just scanned. Are there any steps in the NL proof that do NOT appear in the Lean script -- or any Lean lemmas that do not obviously correspond to an NL sentence?',
      expectedOutcome:
        'You identify the translation gap: the NL proof reads as a 3-5 page mathematical paper, while the Lean script is the formalised version (possibly machine-expanded by further tactic search beyond the NL sketch). One-to-one correspondence is rare; typical gaps are NL "trivially" lines expanded into 50-line Lean blocks, or Lean invocations of Mathlib lemmas that are named-only in the NL.',
      hint: 'The NL-vs-formal asymmetry is precisely the place where human audit is most valuable -- a human checks that the NL intent survives the formalisation, and that no Lean tactic quietly trivialises a critical inequality.',
      conceptsExplored: ['logic-ai-verified-proof'],
    },
    {
      instruction:
        'Find Tao\'s audit note on the proof (linked from erdosproblems.com #1196 or from Tao\'s blog terrytao.wordpress.com). Identify the survivorship-bias caveat he raises. What is it, and why is it a methodological concern for the propose/verify/audit pipeline?',
      expectedOutcome:
        'You state Tao\'s caveat: the published AI-verified proofs are the ones that survived filtering -- we rarely see the N failed proof attempts GPT-5.4 Pro produced before the one that verified. Without a denominator, claims of "AI solved Erdős #1196 in 80 minutes" overstate the pipeline\'s true solve rate. A sound methodology tracks the attempt-to-verification ratio, not just the successes.',
      hint: 'The same bias affects every AI-in-science result: we hear about the solved protein, the working catalyst, the proven theorem, and not the 10,000 failed attempts underneath. The wiki has a banner warning readers about this.',
      conceptsExplored: ['logic-ai-verified-proof', 'math-complex-numbers'],
    },
    {
      instruction:
        'Pick one other AI-verified Erdős entry from the teorth/erdosproblems wiki list: #1202, #152, #218, #281, #333, or #120. Read the entry. How does the audit trail on that entry compare to #1196 -- same proof assistant (Lean), or different (Coq / Isabelle)? Same AI model (GPT-5.4 Pro), or different?',
      expectedOutcome:
        'You summarise: entry #XXX was solved by model Y (e.g. Claude Opus 4.1, GPT-5.4 Pro, DeepMind Lean-specific agent) and verified in proof assistant Z (Lean / Coq / Isabelle). You compare the wall-clock time, the auditor (Tao, Bloom, other), and whether the Lean formalisation was done by the model or added later by a human.',
      hint: 'The wiki rows are uneven -- some AI-verified proofs have been re-verified by independent groups, others sit at single-source status. The diversity of tooling (not all Lean) is itself a methodological signal.',
      conceptsExplored: ['logic-ai-verified-proof', 'math-erdos-problem-index'],
    },
    {
      instruction:
        'State the propose/verify/audit pipeline in one sentence, then state which step of the pipeline is currently the bottleneck and why. Place AI-Verified Proof on the complex plane of experience: it is a high-abstractness, high-complexity concept at the crossroads of logic, AI, and mathematics.',
      expectedOutcome:
        'You state something like: "A large language model proposes a natural-language proof, a formal system (Lean / Coq / Isabelle) checks the proof for logical validity, and a human auditor verifies that the formalisation faithfully captures the proposed argument -- with the audit step currently the bottleneck because Tao-tier mathematicians are scarce and formalisation can hide trivialisation." You note the concept sits near theta=17*2pi/19 on the unit-radius-0.90 complex plane -- abstract-methodological, high-complexity.',
      hint: 'Proposal is fast (minutes), verification is medium (hours on a cluster), audit is slow (days-weeks of human time). The pipeline\'s throughput is gated by the slowest step -- currently the human audit.',
      conceptsExplored: ['logic-ai-verified-proof', 'math-complex-numbers'],
    },
  ],
};
