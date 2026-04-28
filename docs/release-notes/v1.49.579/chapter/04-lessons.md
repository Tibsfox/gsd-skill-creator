# Lessons — v1.49.579

16 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Multivariate sliced-Wasserstein extension is the natural successor scope.**
   v1.49.579 ships univariate Beta-Bernoulli only; the multivariate extension is the single open item carried forward and is the explicit scope of v1.49.580. Forward rule: when a milestone has an explicit single-item open list documented up-front, the next milestone's scope should be that item — uniquely.
   _⚙ Status: `applied` (applied in `v1.49.580`) · lesson #10076_

2. **Honesty-in-place is a stable resting state — but only if the next milestone has a structural plan.**
   v1.49.578 closed JP-022 with honesty-in-place; v1.49.579 converted that to a structural fix. The pattern only works if the honesty pass names the gap explicitly enough that a follow-on milestone can target it.
   _⚙ Status: `investigate` · lesson #10077_

3. **Reuse the JP-002 e-process — never reimplement.**
   `src/orchestration/anytime-gate.ts` is the canonical sequential-stopping surface for the entire codebase. Forward rule: every new sequential-decision module MUST consume it; reimplementing an e-process inside a new subsystem is a refactor target, not a feature.
   _⚙ Status: `investigate` · lesson #10078_

4. **Conjugate primitives are decoupled from the BOED outer loop.**
   Pure-arithmetic primitives in a `conjugate.ts` module, Monte-Carlo only at the outer loop. v1.49.580 multivariate Dirichlet update follows the same decoupling.
   _⚙ Status: `investigate` · lesson #10079_

5. **Honesty-audit tests as a forward-protection pattern.**
   When removing a heuristic constant or narrative framing during a substantiation pass, add a forward-protection test that asserts the absence. Reusable for any future "delete-then-replace" honesty rewrite.
   _⚙ Status: `investigate` · lesson #10080_

6. **Test-floor over-delivery signals substantiation character.**
   Substantiation milestones target ≥3× the test floor; build-out milestones target the floor. v1.49.580 (build-out) ran closer to floor; v1.49.579 (substantiation) hit 3×.
   _⚙ Status: `investigate` · lesson #10081_

7. **Solo profile is the right shape for substantiation.**
   Single agent holding full algorithmic context across all six waves. Fleet dispatch reserved for parallel research / multi-track build patterns.
   _⚙ Status: `investigate` · lesson #10082_

8. **`closes JP-NNN` commit-message hygiene works.**
   The W4 commit explicitly references the v1.49.578 JP-022 footnote by language. Reader can trace from a `git log` line back to the originating self-review finding without external lookup.
   _⚙ Status: `investigate` · lesson #10083_

9. **Release-notes drift is a real cost — 5-file structure is mandatory.**
   Every dev-line milestone ship MUST include README + chapter/00-summary + chapter/03-retrospective + chapter/04-lessons + chapter/99-context BEFORE npm publish + tag + GitHub release. Skipping creates RELEASE-HISTORY.md drift requiring manual backfill.
   _⚙ Status: `investigate` · lesson #10084_

10. **Closing-wave checklist additions for fast-cadence days.**
   When multiple milestones close in a single day, the closing-wave checklist must be denser, not sparser. Each milestone close authors release-notes BEFORE the version is locked on npm.
   _⚙ Status: `investigate` · lesson #10085_

11. **Univariate-first scoping pays for itself.**
   When an algorithmic family naturally scales from 1-D to N-D, scope the 1-D version as a separate milestone. The 1-D version is the substantiation; the N-D version is the extension. Splitting them gives clean DEFER targets and clean test-coverage stories.
   _⚙ Status: `investigate` · lesson #10086_

12. **Single-day same-anchor cluster pattern is feasible only under specific conditions.**
   Single-day milestone clusters (v1.49.577–580 all 2026-04-26) work when (a) all milestones share a common research anchor, (b) each has a single structurally-clean DEFER pointing at the next, (c) test-floor targets stay within Solo-Opus achievable bounds, and (d) the closing-wave checklist for each includes release-notes authoring. The 2026-04-26 cluster missed (d); future clusters should not.
---
   _⚙ Status: `investigate` · lesson #10087_

13. **Fast-cadence cluster shipped 4 milestones in 1 day; release-notes were dropped from the ship pipeline.**
   Remediated 2026-04-27 with backfill + new pre-ship gate `tools/release-history/check-completeness.mjs`. The closing-wave checklist did not include a release-notes authoring step; this is now the load-bearing forward rule for v1.49.582+.
   _⚙ Status: `investigate` · lesson #10088_

14. **W5 metric-scaling adjustment was reactive, not anticipated.**
   `scaledPosteriorShift` was within the JP-002 e-process gate's noise floor at small round counts in the integration test. The 2× scaling was a modest fix but the mission spec did not anticipate it. Lesson: when wiring a new statistic into an existing anytime-gate surface, do an early gate-sensitivity sanity check before authoring the integration test, not during.
   _⚙ Status: `investigate` · lesson #10089_

15. **Beta-sampler shape < 1 corner case cost an extra ~30 minutes.**
   The Marsaglia-Tsang Gamma sampler is not directly usable for shape < 1; the Best (1978) boost handles this but verifying numerical stability across the (0, 1) shape range required an extra verification pass. Worth it: the Beta(0.5, 0.5) reference test exercises exactly this region.
   _⚙ Status: `investigate` · lesson #10090_

16. **No release-notes drift detector existed at ship time.**
   The `tools/release-history/check-completeness.mjs` pre-ship gate now closes this gap, but only because v1.49.582 emitted the forward rule. Earlier discovery would have prevented the four-version backfill (v1.49.577–580).
---
   _⚙ Status: `investigate` · lesson #10091_
