# v1.49.973 — Lessons

This ship codifies one lesson into the manifest (#10158, by relocation into the Sub-agent dispatch discipline) and applies several existing ones. Manifest lesson count 151 → 152.

## Codified

- **#10158 — Mid-flight fact corrections go via the main context, not queued to a finishing agent.** SendMessage queueing risks delivery-after-completion (originated v1.49.584). It directly governs the new SendMessage-continuation caveat in the dispatch discipline, so it was added to the Sub-agent dispatch `key_lessons` (it was previously referenced in release notes but codified in no discipline). This both fixed a discipline-coverage PARTIAL and made the caveat's citation load-bearing.

## Applied (existing lessons)

- **#10462 (describe, don't quote) / doc-accuracy discipline** — the ship's core risk was replacing false premises with new false ones. Every harness claim is tied to a tool contract or release-note datum; unverifiable claims were dropped.
- **#10436 (two-layer closure / preservation)** — the constrained-harness machinery was retained (reframed as fallback), not deleted, preserving multi-runtime support.
- **CF-H-030 SKILL.md/references split** — the HAL note was placed in `references/runtime-strategies.md` so `SKILL.md` stays within its 800-word budget; the budget test caught the first over-budget draft.
- **Adversarial pre-push review (v968 Ship 1.1)** — two rounds caught the first-pass over-claims and a wrong lesson citation before push.

## Process notes

- **Dogfooding a doc-accuracy review on a doc-accuracy ship is high-yield.** The lens that exists to catch overstated claims caught the author's own overstated claims; without it, this ship would have shipped new false premises while claiming to remove them.
- **A plan premise can be wrong, too.** The plan asserted the tool-use ceiling was false; the empirical record said otherwise. Verifying the plan's premises (not just executing them) is part of the work — the same pattern as the D1/D3 refutations in the 2026-06-03 verification pass.
- **CI on dev is the right place to discover budget/coverage drift** from a doc edit; the targeted local suite won't surface a word-budget or discipline-coverage regression unless you run those specific gates.
