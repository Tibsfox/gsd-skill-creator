---
title: "v1.49.968 — codify adversarial pre-push ship review"
version: v1.49.968
date: 2026-06-04
summary: >
  Turns the project's empirically-best QA mechanism — the ad-hoc adversarial
  Workflow review that caught real defects pre-push in v965, v966, and 11/35 F4
  ships — into a load-bearing, repeatable T14 step: a reusable five-lens review
  workflow, a canonical process doc, a new pre-flight step P, and a mutation-proven
  drift-guard. Lands advisory (staged #10463). Dogfooded on its own diff.
tags: [ship-pipeline, review, workflow, qa, drift-guard, staged-promotion]
---

# v1.49.968 — codify adversarial pre-push ship review

**Shipped:** 2026-06-04

The adversarial Workflow review that recent ships ran by hand is now a documented,
reusable T14 step with a drift-guard — and it was used to review this very ship.

## Why this ship

Ship 1.1 of the 2026-06-03 audit plan — the highest-leverage move in Phase 1. The
multi-agent adversarial review of the ship diff has repeatedly caught defects the
deterministic gate and tests passed clean: 3 real BLOCKERs in v1.49.965 (Ship 0.1),
1 real MAJOR in v1.49.966 (Ship 0.2), and a real defect in 11 of 35 F4-campaign
ships. It was entirely ad-hoc — nothing made it repeatable or guarded it against
quietly being dropped. This ship makes it load-bearing.

## What shipped

- **`tools/ship-review/adversarial-ship-review.mjs`** — a reusable Workflow-runtime
  script. Five parallel **read-only** (`Explore`) lens reviewers — correctness,
  scope & convention, guard / test soundness, doc / release-note accuracy, security
  / leak — pipeline into an adversarial **VERIFY** sub-stage that tries to *refute*
  each finding; only survivors are "confirmed" for the orchestrator to fix in code.
- **`docs/adversarial-ship-review.md`** — the canonical process doc: the five
  lenses, the isolation discipline, finding disposition, scale-to-risk, and the
  staged-promotion plan, with the evidence table.
- **`docs/T14-SHIP-SEQUENCE.md`** — a new pre-flight **step P**: run the review on
  the diff *before* `git push origin dev` and fix confirmed REAL findings in code.
- **`tests/integration/adversarial-ship-review-discipline.test.ts`** — a #10461
  Layer-2 drift-guard pinning the five lenses, the Review→Verify shape, the
  read-only/no-worktree isolation invariant, and the cross-references across all
  three surfaces. **Mutation-proven** (4 distinct mutations each fail it).
- **`tools/render-claude-md/disciplines.json`** — extends the "Ship pipeline"
  discipline; CLAUDE.md re-rendered (gitignored, not committed).

**Isolation reflects the learned best practice**, not the plan's outdated
suggestion: reviewers are read-only `Explore` agents (and, if a probe is needed,
additive-only), **never** worktree-isolated — a fresh worktree lacks `node_modules`
so `tsx`/`vitest` probes fail there (the v963/v964 finding,
`feedback_workflow-agents-invalidate-file-read-state`). The orchestrator `git
status`-checks the tree after the run.

## Verification

- New drift-guard 6/6 green and **mutation-proven**: renaming a lens, removing the
  Review or Verify phase, adding `isolation: 'worktree'`, dropping the T14 workflow
  reference, or dropping a doc lens each fail it; files restored byte-identical.
- Build green; the story-gate-ordering test still green (the step-P insertion did
  not reorder bump-version vs append-story-entry); `render:claude-md --check`
  in-sync; pre-tag-gate "all 20 checks PASS".
- **Dogfooded.** The new workflow reviewed this ship's own diff: **0 confirmed
  findings** (5 lenses), with 2 raised findings correctly **refuted** by the verify
  sub-stage — read-only reviewers left zero working-tree leaks.
- A separate runtime probe then surfaced a real defect the *static* review could not
  see: the Workflow runtime delivers `args` to a `scriptPath` invocation as a JSON
  **string**, so the documented `args: { base, intent }` parameterization was
  silently falling back to defaults. Fixed (coerce string→object via `JSON.parse`)
  and verified by a parse probe (`base`/`intent`/`dimensions` now resolve). The
  args-coercion fix was directly verified rather than re-paneled — scale-to-risk,
  the discipline this ship codifies. Static review + runtime probing proved
  complementary.

## Engine state

- **NASA degree:** 1.178 (frozen — unchanged)
- **Counter-cadence count:** 29 (unchanged — normal forward `feat`)
- **Manifest lessons:** 151 (unchanged — applies #10463 staged promotion + #10461
  drift-guard pairing + #10427 load-bearing; no new lesson)
- **cadence_advances:** none (not a degree advance)
