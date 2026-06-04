# v1.49.968 — Lessons

No new manifest lesson is promoted (manifest stays at 151). This ship codifies an
existing *practice* into load-bearing surfaces and applies several existing lessons.

## Applied (existing lessons)

- **#10463 (staged CI-lane / gate promotion).** The review lands ADVISORY first (a
  documented step + a reusable workflow), which is rung 1. The deterministic
  pre-tag-gate attestation is an explicit future rung, deferred because a gate step
  would bump the count 20 → 21 and force a denominator re-normalization against the
  v966 self-consistency guard. Staged rungs over a one-shot promotion.
- **#10461 (gate-enforce-every-runnable-surface + drift-guard pairing).** The codified
  process is a runnable surface whose correctness depends on the three surfaces
  (workflow / doc / T14 step) staying in sync. The drift-guard
  `adversarial-ship-review-discipline.test.ts` is the Layer-2 pin, run on every ship
  by the root vitest project — a sibling of `bypass-vocab-parity.test.ts`.
- **#10427 (failure-mode contracts).** The review is the *judgment* layer that
  catches load-bearing defects a deterministic gate cannot express; it is positioned
  before push (where a confirmed REAL finding is still cheap to fix in code) and is
  explicit that it complements, not replaces, the gate and tests.
- **Scale-to-risk (the discipline this ship codifies, applied to itself).** The
  args-coercion fix was directly verified rather than re-paneled; the v967 Ship 0.3
  precedent (a trivial validator-checked edit verified directly, not paneled) is the
  same call.

## Process notes

- **A faithful codification ships what was learned, not what was proposed.** The plan
  said "worktree-isolated reviewers"; the project had already learned that worktrees
  lack `node_modules` (so probes fail there) and that read-only/additive-only is the
  right isolation. The deliverable encodes the corrected discipline and the
  drift-guard pins the *absence* of `isolation: 'worktree'` so a future edit that adds
  it back is a deliberate, guard-updating act.
- **Static review cannot see runtime behavior — pair it with a runtime probe for
  executable deliverables.** The five-lens panel passed the diff clean; a zero-agent
  runtime probe caught the `args`-as-string defect. When the deliverable is itself a
  runnable artifact, exercise it, don't just read it.
- **Mutation-prove a drift-guard before trusting it.** Back up, mutate each pinned
  property, confirm the guard fails, restore byte-identical. A guard that does not
  fail on the mutation it claims to catch is worse than no guard.
