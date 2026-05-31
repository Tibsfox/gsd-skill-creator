# v1.49.924 — Lessons

## Lesson #10463 — Staged CI-lane promotion via a non-blocking matrix leg

**Context.** Promoting an unproven CI lane (a new OS, runtime, or toolchain) straight into the ship-blocking workflow couples ship cadence to a lane with no track record — a flaky or broken leg can red-block a release at T14. Decoupling the lane entirely (a separate no-push nightly workflow) is the safe-but-blind opposite: it never blocks a ship, but produces no per-push signal, so regressions surface late.

**Rule.** Use the **staged** middle rung: a matrix leg that runs on every push yet cannot block a ship. Fold the new lane into the existing job's matrix with `continue-on-error: ${{ matrix.<dim> == '<new>' }}` (gated on the new dimension value) plus `fail-fast: false` (so a red new-leg never cancels the proven leg). This buys immediate per-push signal — visible red X on the leg — while the **run-level conclusion** the ship gate reads stays unaffected by the new leg's outcome.

**Empirically-established supporting fact (verified on real GitHub Actions, not docs/reasoning).** A job-level `continue-on-error` matrix leg that FAILS still yields a run-level conclusion of `success` — **unless** a `needs: [<job>]` downstream job consumes the deceptive per-leg success, in which case that downstream can fail the run and re-couple the lane to the gate. When the workflow's jobs are independent (no `needs:` edge into the matrixed job), the masking is clean. The v1.49.923 ship settled this with an isolated throwaway-branch probe after an adversarial review put a *sourced* blocker on the assumption — the cited "the workflow fails" cases all involved a `needs:` downstream, which this repo's `ci.yml` does not have.

**The drift-guard is the enforcement (sibling of #10461).** A structural parity test (`tests/integration/ci-matrix-parity.test.ts`) pins the matrix shape, the staged `continue-on-error` property, and the retired lane's absence — so the load-bearing flip (deleting `continue-on-error` once a green track record exists) is forced to be a deliberate act that also updates the test; a silent flip fails CI. That is #10461 (pin the property AND make every edit to it update the guard) applied to a CI-config invariant.

**Promote on a track record, not a single green (#10428 meta-cadence).** The three rungs: decoupled nightly lane → non-blocking matrix leg → load-bearing leg. The flip from the second rung to the third is deferred until N consecutive green pushes of the new leg accumulate across organic development churn — "green pushes from the promotion ship itself" do not count as a diversity track record.

**Cross-refs.** Sibling of #10428 (meta-cadence — staged rungs over a one-shot promotion) and #10461 (gate-enforce-every-runnable-surface + drift-guard pairing); the verify-against-ground-truth move is the #10427 (silent-vs-loud) discipline. Home: `docs/static-analysis-tool-discipline.md` (the enforcement is a structural drift-guard — the domain's "drift checkers" scope).

**Promotion note.** Promoted from the v1.49.923 candidate; single-instance, operator-authorized codification — the empirical GitHub-Actions masking fact is the load-bearing evidence rather than a multi-instance pattern count. Manifest lessons 149 → 150.

## Reinforced (no new lesson ID)

- **Resolve a sourced blocker against ground truth, not authority (#10427 loud-vs-silent sibling).** Carried forward from v1.49.923 and now baked into #10463: secondary sources set the hypothesis (the review's blocker cited a blog + a community thread, both describing the `needs:`-downstream case); an isolated empirical probe was the test that settled it.
