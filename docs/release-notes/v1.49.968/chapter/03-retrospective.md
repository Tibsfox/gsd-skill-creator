# v1.49.968 — Retrospective

## What went right

- **The codification corrected the plan on a verified premise.** The audit plan said
  to make reviewers "worktree-isolated." The project's own v963/v964 experience
  (`feedback_workflow-agents-invalidate-file-read-state`) had already found that a
  fresh worktree lacks `node_modules`, so `tsx`/`vitest` probes fail there — the
  learned best practice is read-only `Explore` reviewers + additive-only probes +
  a post-run `git status` clean-check. The doc, the workflow, and the drift-guard
  all encode the *correct* discipline rather than the plan's suggestion. A faithful
  codification is one that ships what was learned, not what was proposed.
- **The drift-guard shipped with the feature and is mutation-proven.** Four distinct
  mutations (rename a lens, remove a phase, add `isolation: 'worktree'`, drop a
  cross-reference) were each shown to fail the guard, then the files were restored
  byte-identical. The guard is not vacuously true.
- **Dogfooding closed the loop.** The new workflow reviewed its own diff and returned
  0 confirmed findings, with the adversarial verify sub-stage correctly refuting both
  raised findings (one was the perpetual working-tree STORY.md regen, correctly
  reasoned as not-in-commit; one was a valid reading of "mutation-proven"). The
  mechanism demonstrably works on a real ship.

## What went well in process

- **Static review and runtime probing proved complementary.** The five-lens review
  reads the *diff*; it cannot see runtime behavior. A separate zero-agent probe found
  that the Workflow runtime delivers `args` to a `scriptPath` invocation as a JSON
  **string**, so the `args: { base, intent }` parameterization the doc advertises was
  silently falling back to defaults. The static panel passed clean precisely because
  the defect only manifests at execution. Fixed (string→object coercion via
  `JSON.parse`) and verified with a parse probe.
- **Scale-to-risk was applied to the fix, honestly.** The args-coercion fix is a
  7-line, directly-verified robustness change; re-running the full 7-agent panel
  (~364K tokens) on it would have been disproportionate — exactly the trap the
  scale-to-risk clause in the new doc warns against. Direct verification (drift-guard
  green + parse probe) was the proportionate response, and the release notes say so.
- **Gate-coupling was respected, not bulldozed.** The obvious "add a pre-tag-gate
  step" would have bumped the gate count 20 → 21 and forced a re-normalization of
  every printed denominator + the exit-code legend pinned by the v966 self-
  consistency guard. That belongs in its own ship; this one lands the advisory rung
  and documents the gate-enforcement rung as future work (#10463 staged promotion).

## What to watch

- **Advisory, not enforced.** Nothing yet *fails the build* if the review is skipped.
  The deterministic attestation rung (a pre-tag-gate check that the review ran) is
  the planned promotion after K clean advisory ships; until then the step relies on
  ship-runner discipline + the canonical doc.
- **The review is judgment, not determinism.** It can miss things and raise false
  positives (it raised 2 here, both refuted). It complements — never replaces — the
  gate and the test suite.
- **`args` delivery is harness-shaped.** The coercion handles the observed JSON-string
  form and the object form; a future runtime that delivers `args` some third way would
  fall back to defaults (HEAD~1 + commit-message intent inference), which is safe but
  silent. The defaults are deliberately the correct behavior for the dominant "review
  the just-committed ship" case.
