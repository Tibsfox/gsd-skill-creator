# v1.49.579 — BAYES-SEQUENTIAL — Forward Lessons (Emitted to v1.49.580+)

**Status:** Backfilled 2026-04-27 (1 day after release; original ship did not author release-notes — drift remediation)

## Lessons forward

### 1. Multivariate sliced-Wasserstein extension is the natural successor scope

v1.49.579 ships univariate Beta-Bernoulli only. The multivariate IPM-BOED extension via sliced-Wasserstein is the single open item carried forward and is the explicit scope of v1.49.580 BAYES-SEQUENTIAL-MV. **Forward operational rule:** when a milestone has an explicit single-item open list documented up-front in the mission spec, the *next* milestone's scope should be that item — uniquely. v1.49.580 followed this rule and closed the multivariate extension as its sole milestone. The 4-milestone-in-1-day pattern (v1.49.577–580 all 2026-04-26) is feasible only because each milestone had a single, structurally-clean DEFER pointing at the next one.

### 2. Honesty-in-place is a stable resting state — but only if the next milestone has a structural plan

v1.49.578 closed JP-022 with honesty-in-place (`## Limitations` documented the heuristic). v1.49.579 converted that to a structural fix. **The pattern only works if the honesty pass names the gap explicitly enough that a follow-on milestone can target it.** Forward operational rule: when a self-review pass adds a `## Limitations` section to a module, the resolution metadata should include either (a) a structural plan for closure (with a target milestone), or (b) an explicit "this is the resting state — do not convert" annotation. Honesty-in-place without a plan-of-record creates ambient drift; honesty-in-place with a plan-of-record is a milestone seed.

### 3. Reuse the JP-002 e-process — never reimplement

v1.49.579 demonstrates that the JP-002 anytime-valid e-process at `src/anytime-valid/` consumed via `src/orchestration/anytime-gate.ts` is the canonical sequential-stopping surface for the entire codebase. `src/bayes-ab/coordinator.ts` does not contain a martingale; it consumes the existing gate. **Forward operational rule:** every new sequential-decision module MUST consume `src/orchestration/anytime-gate.ts`. Reimplementing an e-process inside a new subsystem is a refactor target, not a feature. This rule applies to v1.49.580 BAYES-SEQUENTIAL-MV (which inherits the same gate) and to any future sequential-decision module.

### 4. Conjugate primitives are decoupled from the BOED outer loop

`posteriorBeta`, `betaMean`, `betaVariance`, and `summariseOutcomes` at `src/bayes-ab/conjugate.ts` are reusable beyond this milestone. They are pure integer/float arithmetic and do not depend on the Monte-Carlo loop. **Forward operational rule:** when v1.49.580 BAYES-SEQUENTIAL-MV ships, the multivariate conjugate primitives (e.g., Dirichlet posterior update) should follow the same decoupling pattern — pure-arithmetic primitives in a `conjugate.ts` module, Monte-Carlo only at the BOED outer loop. The decoupling is what makes the primitives reusable in unrelated contexts.

### 5. Honesty-audit tests as a forward-protection pattern

The W4 commit added 4 honesty-audit tests in `src/ab-harness/__tests__/wasserstein-boed.test.ts` that grep the source string and assert absence: `MAX_SHIFT_STDS` is gone, `VAR_SHRINK` is gone, "illustrative heuristic" framing is gone, `## Limitations` is trimmed to multivariate-only. **Forward operational rule:** when removing a heuristic constant or narrative framing during a substantiation pass, add a forward-protection test that asserts the absence. The test prevents a future regression from reintroducing the heuristic under the algorithm's name. This pattern is reusable for any future "delete-then-replace" honesty rewrite.

### 6. Test-floor over-delivery signals substantiation character

The mission spec required test delta ≥+15. v1.49.579 delivered +45 (3× the floor). **The over-delivery reflects the substantiation character of the milestone**, not gold-plating. Substantiation milestones earn dense unit-test coverage on each new primitive to prevent regression of the honesty pass; build-out milestones (e.g., v1.49.580 multivariate extension) typically run closer to the test-floor target because the primitives are already covered. Forward operational rule: substantiation milestones target ≥3× the test floor; build-out milestones target the floor.

### 7. Solo profile is the right shape for substantiation

v1.49.578 and v1.49.579 were both Solo (single Opus session, no fleet dispatch). The substantiation pattern — converting honesty-in-place footnotes to structural fixes — benefits from a single agent holding full algorithmic context across all six waves. **Forward operational rule:** substantiation milestones default to Solo. Fleet dispatch is reserved for parallel research / multi-track build patterns (e.g., the v1.49.577 JULIA-PARAMETER 8-module fleet) or three-track forward-cadence degree builds (v1.49.581+).

### 8. `closes JP-NNN` commit-message hygiene works

v1.49.578 introduced the `closes JP-NNN` reference convention for footnote-to-substantiation traceability. v1.49.579 used it consistently — the W4 commit `47551ad0e` says "Closes the v1.49.578 footnote 'wasserstein-boed.ts ships an illustrative IPM-aware heuristic with hand-picked constants.'" **Forward operational rule:** keep using JP-NNN references on closing-wave commits. The reference is what lets a reader trace from a current `git log` line back to the originating self-review finding without external lookup.

### 9. Release-notes drift is a real cost — 5-file structure is mandatory

v1.49.579 shipped without release-notes at the time. This file (and the other 4 in `docs/release-notes/v1.49.579/`) are backfilled 2026-04-27. The 4-milestone-in-1-day cadence (v1.49.577–580 all 2026-04-26) was the proximate cause: the closing-wave checklist did not include a release-notes authoring step. **Forward operational rule (also captured at v1.49.582 lessons-forward §12):** every dev-line milestone ship MUST include the full 5-file release-notes structure under `docs/release-notes/<version>/`:
- `README.md`
- `chapter/00-summary.md`
- `chapter/03-retrospective.md`
- `chapter/04-lessons.md`
- `chapter/99-context.md`

Skipping this step creates RELEASE-HISTORY.md drift requiring manual backfill. The v1.49.581 and v1.49.582 NASA degree releases (which followed v1.49.577–580 immediately) explicitly added this step to their closing-wave checklists and have not drifted.

### 10. Closing-wave checklist additions for fast-cadence days

When multiple milestones close in a single day, the closing-wave checklist must be denser, not sparser. **Forward operational rule for fast-cadence days:** each milestone close authors release-notes BEFORE the npm publish + tag + GitHub release sequence. The release-notes pass is the last opportunity to catch a "this milestone is actually two milestones" or "this DEFER is undocumented" issue before the version is locked on npm. Skipping the pass for speed is a false economy — it requires 2× the effort to backfill cleanly later (as this 2026-04-27 pass demonstrates).

### 11. Univariate-first scoping pays for itself

v1.49.579 deliberately scoped to univariate Beta-Bernoulli, with multivariate explicitly DEFER. v1.49.580 picked up the multivariate extension and shipped same-day. **The univariate-first split worked because the algorithmic primitives (Beta sampler, conjugate update, W1 IPM) are the same in 1-D and N-D — only the W1→sliced-W1 step differs.** Forward operational rule: when an algorithmic family naturally scales from 1-D to N-D, scope the 1-D version as a separate milestone. The 1-D version is the substantiation; the N-D version is the extension. Splitting them gives clean DEFER targets and clean test-coverage stories.

### 12. Single-day same-anchor cluster pattern (v1.49.577 → v1.49.580)

v1.49.577 (JULIA-PARAMETER ship), v1.49.578 (substantiation), v1.49.579 (BAYES-SEQUENTIAL substantiation), v1.49.580 (BAYES-SEQUENTIAL-MV extension) all closed 2026-04-26. The cluster is anchored on a single research artifact (the v1.49.577 JULIA-PARAMETER mission's identification of arXiv:2604.21849 as the IPM-BOED anchor). **Forward operational rule:** single-day milestone clusters are feasible when (a) all milestones share a common research anchor, (b) each has a single structurally-clean DEFER pointing at the next, (c) test-floor targets stay within Solo-Opus achievable bounds (typically ≤+50 net new tests per milestone), and (d) the closing-wave checklist for each includes release-notes authoring. The 2026-04-26 cluster missed (d); future clusters should not.

---

*v1.49.579 forward lessons. Emitted to v1.49.580+ as carryover. Backfilled 2026-04-27.*
