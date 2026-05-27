# 04 — Lessons Learned: v1.49.795 T1.1 Ship 1

## 1 candidate emitted; 0 promoted to ESTABLISHED

v795 lands the bounded-learning calibration loop primitive + CLI + writer. The build surfaced one new candidate (#10425) about anytime-valid e-process design on bounded binary observations; no candidates were promoted to ESTABLISHED this ship (#10425 needs a second instance or codification ship).

## Lesson candidate emitted this ship

| ID | Severity | Description | Source |
|---|---|---|---|
| #10425 candidate | MEDIUM | Two-sided likelihood-ratio e-processes (`cosh(λx) · exp(−λ²/2)`) on bounded observations strictly at \|x\|=1 are insensitive to unanimous direction: for any λ>0, `cosh(λ) · exp(−λ²/2) ≤ 1` with equality only at λ=0, so no λ rescues it. Use two one-sided e-processes at Bonferroni α/2 each instead. | v795 (initial calibration-loop design used a single two-sided e-process; math check surfaced the trap before commit) |

**#10425 promotion path.** First instance (v795 design). Promotion to ESTABLISHED on either (a) second-instance forward-shadow at a future bounded-learning ship, OR (b) codification at the next discipline-coverage codification ship if no second instance arrives first. Natural home: extend the Static-analysis tool authoring discipline OR start a new Bounded-learning discipline if more lessons accumulate.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 8th consecutive application since v784 codification. Caught the `calibrate` command name collision + the non-empty `src/bounded-learning/` namespace + the load-bearing math choice between one-sided/two-sided e-processes BEFORE any of them caused mid-build pivots. ~30 min recon → ~75 min build for primitive + CLI + tests + writer.
- **#10422 (Verdict-pattern surface separation)** — 5th forward application. Five files in `src/bounded-learning/` with single-responsibility scoping (types, mapper, loop, writer, index). Future ships can extend any one in isolation without rippling.
- **#10423 (Lightest wire that satisfies the verdict)** — 5th forward application. Single top-level CLI command + single dispatcher entry + single help row. No reuse of the orchestration namespace despite anytime-gate.ts living there; the bounded-learning concern is distinct enough to warrant its own module path.
- **#10424 (newly ESTABLISHED at v794) — Adoption-refresh AFTER bump-version.** Applied: T14 step 11 ordering correctly places adoption-refresh after bump-version. The gate this ship inherits from v794 is now load-bearing for v795's T14 sequence.

## Meta-observation: math-check-before-commit

The two-sided-e-process insensitivity (#10425 candidate) was caught by a hand-computed margin check mid-build: `cosh(0.5 · 1) · exp(−0.5²/2) = 1.1276 · 0.8825 = 0.9952 ≤ 1`. Had this not been caught, the trip-point test in `calibration-loop.test.ts` would have failed (no rejection after 10 unanimous accepts) and the failure would have cost a second design pass mid-test-suite.

Pattern: **when working with bounded-domain martingales, run the per-step evidence growth-rate check by hand BEFORE writing the test fixture.** The test fixture's trip-point assertion encodes a prediction; if the underlying math is wrong, the prediction is wrong, and the test failure surfaces the bug late. Running the math first lets the test fixture's assertions be load-bearing predictions.

This meta-observation may itself become #10426 candidate at a future ship that re-trips the same trap. For now it's an embedded note in this retrospective.

## Cross-discipline observation: "T1.1 most ambitious" was correctly framed

The v793 handoff named T1.1 as "the most ambitious remaining Tier 1 item." Ship 1 took ~75 min wall-clock vs the typical 30-45 min for verdict ships. The increment is real but bounded: T1.1 is a NEW-module ship that introduces a multi-file vertical with a new math primitive (the two-one-sided-Bonferroni construction), not just a CLI wrap over an existing primitive. Ships 2-6 are expected to be smaller (~30-45 min each) since the primitive + CLI scaffolding now exists; they're extensions, not new verticals.

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (no new domain)
Manifest lessons: 65 → 65 (no new formal ID; #10425 still candidate)
Codified-vs-uncodified gap: +1 (one new uncodified candidate)

## Forward backlog (post-v795)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10425 candidate | MEDIUM | Two-sided e-processes on bounded binary observations are insensitive to unanimous direction; use Bonferroni-combined one-sided instead. | v795 design |
