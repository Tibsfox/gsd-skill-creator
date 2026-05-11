# 04 — Forward Lessons: v1.49.634

Lessons emitted from this milestone, to be applied at future ship pipelines.

## Lesson #10168-followup — gate the counter-cadence cleanup cadence itself

**Context.** v1.49.585 registered Lesson #10168: every ~30 forward-cadence milestones, run a concerns-cleanup ship. The trigger fired at v1.49.615; the milestone shipped at v1.49.634 — **19 milestones late.** The original lesson was authored as soft prose (a watchlist bullet in `chapter/04-lessons.md`); no harness scanned for the overdue condition.

**Lesson.** Soft prose in retrospectives is not a substitute for a deterministic check. If a cadence is worth registering, it is worth gating.

**Proposed action for the next cycle.** Author a small tool — `tools/cadence-overdue.mjs` — that scans `.planning/STATE.md` (or RH PostgreSQL release_history table) for the last counter-cadence cleanup milestone, computes `current_degree - last_cleanup_degree`, and emits WARN at threshold-30 / FAIL at threshold-45. Wire as a pre-tag-gate advisory step (WARN-only initially; harden to BLOCK after one soak cycle following the C1 watchdog two-phase pattern). When applied, the v1.49.615 trigger would have surfaced at the right moment; v1.49.634 would have shipped at v1.49.615-or-near.

**Why now.** The cleanup-mission cadence is the only operational-cadence thread without a deterministic surface. All other gates installed in v1.49.585 + v1.49.634 are mechanical; this one stayed prose. Closing the gap is consistent with the v1.49.585 Lesson #10169 (gate-not-vigilance) discipline.

## Reachability audits as a first-class artifact

**Context.** C3 keystore reachability audit was the first formal artifact of its kind: a written audit that traces a security-critical TODO ("can this path actually be reached in a shipped binary?") through cfg flags, callers, and build profiles, producing a "fix-now / defer-with-marker" decision. The template at `components/00-shared-types.md` lists Audit date / Method / Findings / Decision / Inert proof.

**Lesson.** Many security-critical TODO/FIXME/HACK markers are unreachable in shipped binaries (gated behind dev-only features, debug-only modules, test fixtures). Without a reachability audit, the marker stays as a load-bearing concern; with one, it either becomes a real fix or a documented inert-marker that future audits can skip.

**Proposed action.** When CONCERNS.md flags a security-relevant marker (anything matching `keystore|crypto|secret|password|auth|token`), require a reachability audit using the C3 template before deciding fix-now vs defer. Future v1.49.6XX cleanup milestones should consume the template directly. The template is reusable as-is — copy `components/00-shared-types.md` "Keystore reachability audit report template" into the new mission's W0.

## Two-phase gate landings for runtime-touching code

**Context.** C1 watchdog landed observer-first (default policy `observe-only`; surfaces status without spawning or restarting processes). The `auto-restart` policy is opt-in via setting. This is the inverse of the v1.49.585 W1A hook BLOCK pattern (where hooks reject tool calls on day-one).

**Lesson.** For gates that exercise hook-level interception of tool calls (read-only relative to processes), BLOCK-first is safe: the worst case is a false-positive that requires the operator to add an override env var. For gates that touch live process state (spawn / restart / kill), observer-first is safer: an observability layer can soak for one or more milestones before authority is added.

**Proposed action.** Future runtime-touching gates (process supervisors, file-system watchers, daemons) should default to observe-only with opt-in authority. Document in `.planning/missions/<mission>/components/*.md` "Two-phase landing" section if applicable. Hook-level gates (rejecting tool calls) remain BLOCK-first.

## Three pre-existing test fragilities need a housekeeping mission

**Context.** Throughout v1.49.634 execution, three vitest tests flaked intermittently: `browser-tab-parity`, `connection-caching`, `public-deployment-smoke`. None are v1.49.634 regressions; all are pre-existing. They affect signal-to-noise in pre-tag-gate runs and produce false-positive CI red.

**Lesson.** Flaky tests in the pre-tag-gate path erode the gate's authority: operators learn to retry-on-red instead of investigating, which is the exact discipline-erosion mode the cleanup milestones exist to prevent.

**Proposed action.** Open a small housekeeping mission (~v1.49.640-650 range, ~1-2k tokens) targeting these three tests: stabilize (root-cause the flake and pin), quarantine (move to a separate `slow` or `flaky` project in vitest.config.ts that runs on-demand), or delete (if the test is testing a deprecated surface). Whichever resolution lands, document the decision per-test in the housekeeping mission's `chapter/03-retrospective.md`.

## Deferred-absorption pattern for upstream renames

**Context.** C7 upstream-alignment spot-check found one BEHAVIORAL delta: upstream renamed `gsd-review` → `gsd-quality` in `ns-review.md` frontmatter. Absorbing the rename atomically requires updating not just `.claude/commands/gsd/ns-review.md` but also `project-claude/commands/gsd/plan-review-convergence.md` body refs (2 hits) AND many upstream-mirrored workflows that still reference `/gsd-review`. Upstream's own migration is incomplete.

**Lesson.** Upstream renames sometimes ship across multiple releases. Absorbing a partial rename produces a worse state than the pre-absorb state: half-renamed local + half-renamed upstream is harder to reason about than fully-old-named local + half-renamed upstream.

**Proposed action.** Add a "deferred-absorption" branch to the C7 spec decision tree: when 1 BEHAVIORAL delta is found AND upstream's own migration is incomplete (workflows or references still use the old name), defer absorption to a future audit after upstream's release N+1 or N+2. Refresh the audit checklist at each upstream release to detect when the migration completes. The C7 spec at `.planning/missions/v1-49-634-concerns-cleanup-2/components/07-upstream-alignment-spotcheck.md` should grow this branch in a future cleanup mission.
