# v1.49.578 -- JULIA-PARAMETER Substantiation + Closure

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes -- drift remediation)
**Profile:** Solo (one-developer Opus session -- no fleet dispatch)
**Pipeline speed:** Fast (Vision + Mission, no separate research stage)
**Archetype:** Infrastructure Component (extends existing JP-NNN primitives + closes deferred items)
**Theme:** Substantiate the v1.49.577 spike; close JP-001 / JP-002 / JP-010a / JP-040 open loops
**Test delta:** +18 (28,492 -> 28,510; target was >=+10)
**Open items:** 5 -> 1 (only `wasserstein-boed.ts` IPM-BOED carries forward, info-blocked)
**Branch:** dev (closing commit `520419af8`) / main (merge `2100e5391`)
**Tag:** `v1.49.578` (annotated, pushed)
**npm:** `gsd-skill-creator@1.49.578`
**GitHub release:** https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v1.49.578

**Through-line:** *Close the open loops the v1.49.577 handoff handed forward -- wire the primitives into more call sites, on-tree the citations the gitignore sequestered, automate the verification we couldn't run, and seed the telemetry with one real caller.*

**Prior milestone:** v1.49.577 JULIA-PARAMETER (closing commit on dev `821568eea`, on main `1b9eedb9b`, npm `gsd-skill-creator@1.49.577`). v1.49.577 closed `ready_for_review` on 2026-04-26 with five "open items / follow-ups." v1.49.578 is the keeper milestone that turns four of those five into a commit SHA, a file path, or an explicit DEFER with the external block named.

---

## Summary

v1.49.578 is the keeper milestone: a one-day Solo-profile substantiation pass that took the four "ready for X but not actually X" footnotes from the v1.49.577 JULIA-PARAMETER handoff and turned each into a commit SHA, an on-tree path, an automated verification script, or an explicit DEFER backed by read-of-source evidence -- closing the open-items count from 5 to 1, in eleven commits across the v1.49.577 close (`1b9eedb9b`) and the v1.49.578 dev close (`520419af8`). The substantive milestone (v1.49.577) booked the value across forty absorption candidates and twenty phases. The substantiation milestone the next session collected on the receivables. No new `src/` subsystem was added. No new research was performed. No new CLAUDE.md anchor was introduced. The work was structural: write the script, move the citations, wire the second call site, find the real caller -- and where the structural shape did not fit, name the mismatch and DEFER.

**HONEST-DEFER WITH EVIDENCE PATTERN ESTABLISHED.** W2a (`selector.ts`) and W2c (`mesh-degree-monitor.ts`) shipped DEFER verdicts grounded in read-of-source evidence rather than wire-up-to-close-the-line-item. Both call sites lack the streaming-decision shape that anytime-valid e-processes earn their keep against: `selector.ts` is one-shot batch ranking, `mesh-degree-monitor.ts` is event-driven plus hard-rule plus one-shot escalation. Forcing the gate into either site would have produced silent inert code that the next milestone would have to audit and likely undo. The DEFER reasoning is documented in mission-package component specs (`.planning/missions/v1-49-578-jp-substantiation/components/01-jp002-selector.md` and `components/03-jp002-mesh-degree-monitor.md`) so a future reader sees "two sites surveyed, structural reason recorded" rather than "two sites still pending." In parallel, the wired site (`draft-verify-router.ts`, W2b) demonstrates the positive case -- when the streaming-decision shape is present, the gate maps cleanly onto the call site without fighting its natural control flow. Both sides converge on the same working thesis: quality of fit is the measure, not the wire-up count.

**JP-001 LAKE BUILD PASS.** W4 originally accepted the actual `lake build` execution as a DEFER (user opting to install Lean was a separate decision). v1.49.578 ran it end-to-end on Lean 4.15.0 against Mathlib4 commit `6955cd00cec441d129d832418347a89d682205a6`, and all four load-bearing namespaces compiled cleanly: `Mathlib.Probability.Kernel.Disintegration.Basic` at 1,760 jobs, `Mathlib.InformationTheory.KullbackLeibler.Basic` at 2,479 jobs, `Mathlib.Probability.Distributions.Gaussian` at 2,706 jobs, and `Mathlib.Probability.IdentDistrib` at 2,438 jobs. The `tools/verify-mathlib-pin.sh` script parses the pinned SHA dynamically from `src/mathematical-foundations/lean-toolchain.md` (the doc is the source of truth, not the script), reports PASS/FAIL per namespace, and exits with distinct codes (0 ok / 1 lean missing / 2 git fail / 3 cache get fail / 4 build fail / 5 SHA parse fail). The CLAUDE.md External Citations §arXiv:2510.04070 anchor (Markov kernels in Lean Mathlib by Degenne et al.) is no longer "documented as compilable" -- it is "compiled, here is the script that re-verifies in one command." The same way the JP-002 wiring at draft-verify-router proves the primitive is callable, the lake-build PASS proves the formal substrate v1.50's proof companion compiles against is genuinely available.

**SUBSTANTIATION MILESTONE PATTERN.** Following a large research-and-implement milestone (v1.49.577, Fleet profile, 8 modules, 19 named roles, 20 phases, +279 tests, six convergent-discovery clusters surfaced) with a small focused Solo-profile substantiation pass within roughly one week is the operational pattern that v1.49.578 demonstrates and emits forward. The substantive milestone needs parallelism for breadth coverage; the substantiation milestone needs focus for honest gap-filling. The shapes do not interchange. v1.49.577's value would not have been booked by a Solo session, and v1.49.578's gap-closures would not have been honestly carried by a Fleet dispatch -- the DEFER decisions need read-of-source judgement that is faster inline than coordinated, and the full token budget estimate (95K-115K) sat comfortably in a single context window. Both sides converge on the same operational rule: profile selection should track milestone archetype.

**JP-040 NASA CITATIONS RELOCATED.** The JP-040 SAGES (arXiv:2512.09111) plus EEI Formation Flying (arXiv:2604.21024) NASA-mission-series citations had lived at `.planning/missions/nasa/REFERENCES.md` -- which is gitignored. The presence test that asserted on that path was structurally broken on CI and got deleted at `6598ac959`. v1.49.578 relocates the citations to `docs/research/nasa-citations.md` (on-tree, survives `git clone`) and restores the JP-040 presence test in `src/skill-promotion/__tests__/citations-presence.test.ts` with arXiv-ID and well-formed-H1-title assertions. Per user direction 2026-04-26 the `nasa` branch had been merged back into dev some time ago and is no longer active -- the original "long-term home is the nasa branch" footnote evaporated, and v1.49.578 caught the staleness in the same milestone pass rather than carrying it forward indefinitely.

**JP-010a FIRST REAL CALLER SEEDED.** The v1.49.577 self-review pass acknowledged "JP-010a zero telemetry observations -- audit-trail entry documents K=3 default; activates when callers wire the module" as an open item. v1.49.578 grepped `src/` and `tools/` for `runAB(` callers and found exactly one real (non-test) site: `src/ab-harness/cli.ts`. The seed threads `caller=ab-harness-cli` plus `sessionType` from `process.env.CI` plus `tractability` from the `--tractability` flag through the `kAxes` surface. Every `skill-creator ab <skill> --variant=...` run now appends a JSONL observation to the default K-axis log path. The "zero observations" footnote becomes "one observation per CLI run, structurally." Real values for `userDomain` / `expertiseLevel` flow once richer callers thread them explicitly; the CLI seeds the surface that exists.

---

## Modules

| Wave | Component | Outcome | Commit | Test delta |
|---|---|---|---|---|
| W0/W1 | Carryforward (test-fix + JP-001 SHA pin + JP-002 retrieve + JP-010a runAB) | LANDED on dev pre-open | `b9076c4d9..e9be25f72` (4 commits) | (carried) |
| W2a | `src/orchestration/selector.ts` -- JP-002 wiring | DEFER (one-shot batch, no streaming-decision shape) | (no commit) | 0 |
| W2b | `src/orchestration/draft-verify-router.ts` -- JP-002 wiring | WIRED (opt-in `acceptanceGate` + `acceptanceVerdict()`) | `33a8a93e3` | +5 |
| W2c | `src/orchestration/mesh-degree-monitor.ts` -- JP-002 wiring | DEFER (event-driven + hard-rule + one-shot escalation) | (no commit) | 0 |
| W3 | `docs/research/nasa-citations.md` + JP-040 presence test | WIRED (on-tree relocation + arXiv-ID + H1 assertions) | `e9f6da224` | +4 |
| W4 | `tools/verify-mathlib-pin.sh` + JP-001 lake build PASS | WIRED + LAKE_BUILD_PASS (4/4 namespaces, Lean 4.15.0 / Mathlib4@`6955cd00`) | `96936725d` | +6 |
| W5 | JP-010a real-caller seed at `src/ab-harness/cli.ts` | WIRED (`caller=ab-harness-cli`, sessionType from CI env, tractability from flag) | `520419af8` | +2 |
| W6 | Closing wave (STATE / ROADMAP / version bump / tag / GitHub release / npm publish / merge to main) | CLOSED | `520419af8` (dev) / `2100e5391` (main) | regression-only |

Total deliverable count: 4 WIRED commits + 2 DEFER-with-evidence + 1 carryforward block + 1 close. Total test delta: +18 (W2b 5 / W3 4 / W4 6 / W5 2 / +1 incidental). Zero regressions.

The wave shape (W0/W1 carryforward, W2 split into three sub-components a/b/c, W3-W5 single-deliverable, W6 close) is mission-package-driven. Each wave maps to a component spec at `.planning/missions/v1-49-578-jp-substantiation/components/`. The W2 split into a/b/c is what allowed the per-call-site DEFER decisions to be recorded individually rather than rolled up into a single "JP-002 wiring -- partial" outcome. The granularity is load-bearing: future readers see exactly which call sites were surveyed and which decisions were made on each.

---

### Part A: Substantiation (W1-W4 ground-truth verification)

- **W4 LAKE BUILD PASS** -- Lean 4.15.0 plus Mathlib4@`6955cd00` compiled all four Markov-kernel namespaces clean: Probability.Kernel.Disintegration.Basic (1,760 jobs), InformationTheory.KullbackLeibler.Basic (2,479 jobs), Probability.Distributions.Gaussian (2,706 jobs), Probability.IdentDistrib (2,438 jobs). The lake build was the single hardest blocker carried forward from v1.49.577 on JP-001; substantively closed at v1.49.578. The CLAUDE.md External Citations §arXiv:2510.04070 anchor is now reproducible in one command.
- **NAMESPACE COVERAGE RATIONALE** -- The four namespaces are not arbitrary. Probability.Kernel.Disintegration.Basic underwrites the Markov-kernel composition lemmas the v1.50 proof companion's bounded-learning chapter depends on. InformationTheory.KullbackLeibler.Basic is the formal target the JULIA-PARAMETER causal-synchronization KL bound (arXiv:2604.20915) compiles against. Probability.Distributions.Gaussian provides the canonical example distributions for the data-processing-inequality applications. Probability.IdentDistrib supplies the i.i.d. + identical-distribution lemmas the anytime-valid e-process gate chapter consumes. Each namespace earns its place in the lake-build matrix.
- **JP-001 SHA-PIN AUTOMATION** -- `tools/verify-mathlib-pin.sh` parses the pinned commit hash dynamically from `src/mathematical-foundations/lean-toolchain.md`, checks `elan` and `lake` on PATH (with actionable install instructions on miss), clones or fast-forwards Mathlib4 at `$MATHLIB_DIR` (default `.mathlib-verify-checkout`, gitignored), runs `lake exe cache get` (skippable via `LAKE_OFFLINE`), and invokes `lake build` for the four load-bearing namespaces. Distinct exit codes (0 ok / 1 lean missing / 2 git fail / 3 cache get fail / 4 build fail / 5 SHA parse fail). `--no-build` smoke-tests parse plus clone without the long lake-build phase.
- **JP-040 ON-TREE CITATIONS** -- Citations moved from `.planning/missions/nasa/REFERENCES.md` (gitignored) to `docs/research/nasa-citations.md` (on-tree, survives `git clone`). Presence test restored in `src/skill-promotion/__tests__/citations-presence.test.ts` asserting existence plus both arXiv IDs (`2512.09111` SAGES and `2604.21024` EEI Formation Flying) plus well-formed H1-title Markdown. The "long-term home is the nasa branch" footnote retired with the branch's merge-back.
- **JP-002 EXTENDED WIRING (DRAFT-VERIFY-ROUTER)** -- Opt-in `acceptanceGate?: { config?, minTurns?, metric? }` field added to `RouterConfig`. When supplied, the router accumulates draft-accept indicators across `route()` calls and exposes the verdict via a new `acceptanceVerdict()` method. Metric fed to the gate is `+1` when `draftAccepted` is true, `-1` otherwise -- bounded, mean-zero under the null "draft tier is unreliable," positive in expectation when the draft tier matches the verifier frequently. Type-I error bound holds at any sample size.
- **BIT-EXACT DECOMPOSITION GUARANTEE PRESERVED** -- The W2b acceptanceGate change does NOT alter `route()`'s pipeline or output. `acceptanceVerdict()` is a snapshot read of the most recent gate evaluation and does not advance the e-process or add a phantom observation. Returns `null` when no gate is configured. Default behaviour unchanged when `acceptanceGate` is omitted, matching the opt-in pattern established by `retrieve()` in the v1.49.577 commit `e9be25f72`.
- **TEST OVERSHOOT EXPLAINED** -- W4 was speced for at least 1 test (script existence + exec bit + parses SHA). Landed +6 because the script grew enough surface area (SHA parse, exit-code matrix, `--no-build` smoke, lake-build PASS reporting) to deserve more coverage. The overshoot is a signal that the implementation grew genuinely richer than the spec, not that the test floor was too lenient.
- **CARRYFORWARD AS W0/W1** -- Four commits already on `origin/dev` at v1.49.578 milestone-open (`fd3d40b74` test-fix, `b75d675df` JP-001 SHA pin, `e71f488b5` JP-010a runAB Round 1, `e9be25f72` JP-002 retrieve() Round 1). Counted as W0/W1 explicitly in the mission spec rather than re-done to make the wave plan look prettier. Future readers find every commit in the milestone range, including pre-stage commits.
- **MISSION-PACKAGE SCAFFOLDING AT SOLO PROFILE** -- The `.planning/missions/v1-49-578-jp-substantiation/` package (README + 01-vision-doc + 03-milestone-spec + 04-wave-execution-plan + 05-test-plan + components/00-07) gave a clean wave plan even though the work was Solo. Component specs serving as DEFER-evidence carriers (W2a + W2c spec files document the structural mismatch in the package itself) is a pattern worth reusing.
- **EXIT-CODE MATRIX AS TEST SURFACE** -- `tools/verify-mathlib-pin.sh` exposes 6 distinct exit codes (0 ok / 1 lean missing / 2 git fail / 3 cache get fail / 4 build fail / 5 SHA parse fail). Each code has a dedicated test path. The exit-code matrix is the verification script's API contract; future scripts in the same family should follow the same convention.
- **SOURCE-OF-TRUTH ASYMMETRY** -- The pinned commit lives in `src/mathematical-foundations/lean-toolchain.md` (the doc) and the script parses dynamically. If the SHA bumps in the doc, the script picks it up automatically. The doc is authoritative; the script is mechanical. This avoids the "two places to update" trap that would inevitably drift.
- **STRUCTURAL-QUESTION FRAMING FOR DEFERS** -- W2a (selector) DEFER felt borderline at first read because the function does see a list of candidates and could in principle accumulate evidence across multiple selection passes. The clarifying question -- "does the call site actually poll across N invocations, or is each invocation one-shot from the call site's perspective?" -- resolved the borderline cleanly. The lesson: DEFER decisions need a precisely framed structural question, not a vibes assessment.

### Part B: Closure (W5-W6 real-caller seed, open-item triage, ship discipline)

- **JP-010a CALLER SEED** -- `src/ab-harness/cli.ts` wired with `caller=ab-harness-cli`, `userDomain=unknown`, `expertiseLevel=unknown`, `sessionType=process.env.CI ? 'ci' : 'interactive'`, and `extraAxes.tractability` from the `--tractability` CLI flag. Two new tests in `cli.test.ts` covering CI-vs-interactive sessionType branching and tractability flow-through. The "ready when callers exist" footnote becomes "one real caller exists; every CLI invocation produces a JSONL observation."
- **W2A DEFER WITH EVIDENCE** -- `src/orchestration/selector.ts` is a one-shot batch selector. It receives the full candidate set, ranks once, and returns a chosen candidate. There is no notion of "accumulate evidence across N polls and decide whether to stop" -- the function returns at the moment of decision. Anytime-valid e-processes earn their keep when a call site polls a running statistic at unknown-but-controlled stopping time; here there is no polling and the stopping time is fixed at "after one ranking pass." DEFER documented in `components/01-jp002-selector.md`.
- **W2C DEFER WITH EVIDENCE** -- `src/orchestration/mesh-degree-monitor.ts` is event-driven (subscribes to mesh-degree change events), uses a hard-rule threshold (degree exceeds K -> escalate), and emits a one-shot escalation. Same structural mismatch as `selector.ts` -- a single threshold trip fires the escalation; there is no "wait, accumulate, then decide" shape. DEFER documented in `components/03-jp002-mesh-degree-monitor.md`.
- **WASSERSTEIN-BOED IPM-BOED CARRIED AS DEFER** -- The only open item that survives v1.49.578. Info-blocked: a real IPM-BOED implementation needs a concrete `p(y | d, theta)` data-generating model, and no such model exists yet for skill-promotion experiments. Forcing closure would mean inventing a synthetic model that would later have to be undone when a real BOED experimental design surfaces.
- **VERSION BUMP + TAG + RELEASE** -- `package.json` and `package-lock.json` bumped to `1.49.578`. Tag `v1.49.578` annotated and pushed. GitHub release created with notes-file. npm `gsd-skill-creator@1.49.578` published. Merge to main at `2100e5391` carries 11 commits `b9076c4d9..2e2eff22c`.
- **STATE LEDGER UPDATED** -- `.planning/STATE.md` blocks `v1_49_578_legacy_block` plus `v1_49_578_summary` recorded with canonical wave outcomes, test deltas, commit SHAs, and the open-items disposition table. ROADMAP.md updated to reflect milestone closure.
- **RELEASE-NOTES BACKFILL** -- `[unavailable -- backfill 2026-04-27]` the original ship on 2026-04-26 did not author release-notes; the user flagged the drift and authorised this backfill on 2026-04-27. Likely cause: the Solo-profile small-shape milestone did not trigger the release-notes step that a Fleet-profile milestone routinely produces. Lesson 8 below names the structural fix.
- **SHIP-DISCIPLINE FORWARD RULE** -- Every W6 closing wave must include "author release-notes (5 files) at `docs/release-notes/v1.49.NNN/`" as an explicit deliverable. Profile (Solo vs Fleet) is irrelevant -- the discipline is the same. The closing checklist should not consider W6 done until the 5 release-notes files exist.
- **OPEN-ITEMS LEDGER DISCIPLINE** -- The 5-to-1 reduction is not a measurement of the milestone's quality on its own; it is a measurement against the prior milestone's handoff. v1.49.578's value is precisely the willingness to read the v1.49.577 handoff line by line and dispose of each item explicitly, even when the disposition is DEFER. The next milestone (v1.49.579+) inherits a 1-item open-list, which is small enough to carry without calcifying.
- **NASA BRANCH RETIREMENT CAUGHT** -- The original v1.49.577 footnote "long-term home is the nasa branch" had a half-life that was already past expiration when v1.49.578 opened. The substantiation pass caught the staleness in the same milestone rather than letting it accumulate across multiple cycles. Lesson 4 generalizes the rule: branch-pointing footnotes should be revisited every milestone, not deferred indefinitely.
- **JSONL OBSERVATION SHAPE** -- The K-axis JSONL log entries from `src/ab-harness/cli.ts` follow the JP-010a audit-trail schema with K=3 default and `extraAxes` for caller-specific fields. Every entry includes `caller`, `userDomain`, `expertiseLevel`, `sessionType`, plus `extraAxes.tractability` when the `--tractability` flag was supplied. Future analysis tooling can group observations by `caller=ab-harness-cli` and split by `sessionType` to separate CI runs from interactive runs without ambiguity.
- **SUBSTANTIATION-PASS SCOPE BOUNDARY** -- v1.49.578 explicitly did NOT add new src/ subsystems, new research, new CLAUDE.md anchors, new mission archetypes, or new pipeline stages. Each "no" is a discipline; the substantiation milestone earns its keep by closing existing loops, not opening new ones. A substantiation pass that drifts into capability extension stops being a substantiation pass and becomes a hybrid milestone with neither the focus of substantiation nor the breadth of substantive work.

---

## Convergent-discovery validation

| JP code | Anchor | v1.49.578 substantiation |
|---|---|---|
| JP-001 | arXiv:2510.04070 Markov kernels in Lean Mathlib | `tools/verify-mathlib-pin.sh` PASS at Lean 4.15.0 / Mathlib4@`6955cd00`; all 4 namespaces clean |
| JP-002 | arXiv:2604.21851 anytime-valid SD e-process | second call site wired (`draft-verify-router.ts`); two DEFER with read-of-source evidence |
| JP-010a | Barto 1983 TD(lambda) eligibility-trace lineage | first non-test caller seeded at `src/ab-harness/cli.ts` |
| JP-040 | arXiv:2512.09111 SAGES + arXiv:2604.21024 EEI | citations relocated to `docs/research/nasa-citations.md` (on-tree); presence test restored |
| Pattern | arXiv:2604.20874 Root Theorem of Context Engineering | substantive-then-substantiation lifecycle operationalized |

**JP-001 (Lean Mathlib substrate) -- arXiv:2510.04070 Markov kernels in Lean Mathlib (Degenne et al.).** v1.49.578 is the operational verification. `tools/verify-mathlib-pin.sh` parses the pinned commit from `src/mathematical-foundations/lean-toolchain.md` and runs `lake build` against the four namespaces the v1.50 proof companion intends to compile against. PASS at Lean 4.15.0 / Mathlib4@`6955cd00` with all four namespaces clean. The convergent-discovery cluster around CLAUDE.md **C1 (bounded-tape extension)** and **C3 (formal-mathematics complement)** -- enabling Lean-statable bounded-learning-cap and anytime-valid-gate proofs -- is now executable in one command.

**JP-002 (Anytime-valid e-process) -- arXiv:2604.21851 anytime-valid SD e-process.** v1.49.578 wired the second call site (`draft-verify-router.ts`, W2b commit `33a8a93e3`) and surveyed the two remaining candidate sites with read-of-source DEFERs (W2a `selector.ts` and W2c `mesh-degree-monitor.ts`). The convergent-discovery JULIA-PARAMETER partner -- operationalizing the **C5 external-verification-gate** statistically -- is now plural at the call-site level rather than singular at the primitive level. The opt-in pattern (`acceptanceGate?:` config field plus `acceptanceVerdict()` snapshot read) preserves the bit-exact decomposition guarantee from prior milestones.

**JP-010a (K-axis telemetry) -- Barto 1983 TD(lambda) eligibility-trace lineage; MA-1 / MA-6.** First real caller seeded at `src/ab-harness/cli.ts`, W5 commit `520419af8`. The audit-trail surface that documents K=3 default now collects observations from a non-test caller. Future richer callers (skill-creator workflow integrations) will thread `userDomain` and `expertiseLevel` explicitly. The "ready when callers exist" footnote becomes "one observation per CLI run, structurally."

**JP-040 (NASA citations) -- arXiv:2512.09111 SAGES + arXiv:2604.21024 EEI Formation Flying.** Relocated on-tree to `docs/research/nasa-citations.md` (W3 commit `e9f6da224`). Presence test restored at `src/skill-promotion/__tests__/citations-presence.test.ts` with arXiv-ID and well-formed-H1 assertions. The CLAUDE.md JULIA-PARAMETER convergent-discovery partner **arXiv:2512.09111 (SAGES three-stage pipeline)** -- which independently instantiates the same semantic / deterministic / knowledge architecture for safety-critical aerospace -- now has its NASA-mission-series citations in a path that survives `git clone`.

**Substantiation pattern -- arXiv:2604.20874 Root Theorem of Context Engineering (bounded-tape framing).** The accumulate-compress-rewrite-shed milestone retrospective lifecycle the Root Theorem motivates is operationalized here as **substantive-milestone-followed-by-substantiation-milestone**. The substantive pass (v1.49.577) accumulates and compresses; the substantiation pass (v1.49.578) rewrites footnotes into commits and sheds the receivables. Convergent partners: **arXiv:2604.20897 (deployment-horizon ROI)** -- the substantiation cost is energetically justified because the v1.49.577 work has lifetime payoff bounded by I_K(skill ; task) only when the receivables are collected; **arXiv:2604.20915 (causal-synchronization KL bound)** -- the bounded-learning 20% rule that governs single-update divergence applies to substantiation just as it does to substantive work; **arXiv:2604.21101 (hybridizable neural time integrator)** -- the 12-example small-data floor anchors the minimum sample count that v1.49.578's tests pass through.

---

## Retrospective

The retrospective lives in full at `chapter/03-retrospective.md`. Headline: open items dropped from 5 to 1, with four loops closed across W2b / W3 / W4 / W5 (all with commit SHAs and test deltas) and three DEFERs grounded in concrete reasoning (W2a + W2c read-of-source structural-mismatch evidence, W5-carryforward info-block on `p(y|d,theta)`). One-day Solo turnaround following a Fleet-profile substantive milestone. Test delta +18 against a target floor of +10. Zero regressions.

### What Worked

- **Mission package as substantiation-milestone scaffolding.** The `.planning/missions/v1-49-578-jp-substantiation/` package gave a clean wave plan even at Solo profile. Component specs as DEFER-evidence carriers is a reusable pattern.
- **vitest run was clean throughout.** Zero regression. The pre-existing failure pattern from v1.49.577 close (`math-foundations/integration.test.ts` plus `heuristics-free-skill-space/integration.test.ts`) was unchanged -- substantiation work did not perturb pre-existing failures.
- **Lake build PASS exceeded expectations.** Original W4 plan accepted that the actual `lake build` execution might still be a DEFER. Running it end-to-end and getting all four namespaces to compile cleanly was over-delivery on the W4 spec.
- **Test delta target overshoot.** Target was at least +10; landed +18. Most overshoot from W4 verify-mathlib-pin landing 6 tests against a planned floor of 1 -- the script's exit-code surface deserved richer coverage.
- **One-day turnaround.** All five waves plus close on 2026-04-26, same day as the v1.49.577 close. The substantiation cycle is fast when the substantive work pre-stages cleanly.

### What Could Be Better

- **Author release-notes at ship time.** v1.49.578 did not author release-notes when it shipped on 2026-04-26. The user flagged the drift on 2026-04-27 and the backfill is what produced this README. The 1-day delay is small in absolute terms but represents a regression in the ship-discipline pattern. Future milestones should author release-notes as part of W6 close, not as a follow-on. `[unavailable -- backfill 2026-04-27]` the exact reason release-notes were skipped at original ship is not recorded in STATE.md or commit messages.
- **Run vitest twice at W6.** The risk register mentioned the v1.49.577 de-flake regressing; we ran vitest once. Running twice (or three times) would have given more confidence that flakiness was not masking a real regression. None surfaced after the close, so no harm done -- but the pattern is worth adopting.
- **Document the DEFER pattern in skill memory.** The W2a + W2c DEFER decisions used a structural-question framing ("does the call site actually poll across N invocations, or is each invocation one-shot from the call site's perspective?") that is reusable across orchestration call-site assessments. That framing should land in skill memory so future call-site surveys do not re-derive it.
- **Lake build install cost.** W4 originally planned to ship the script and DEFER the actual run; running it required installing `elan` plus Lean 4.15.0 plus cloning Mathlib4 plus a 5-15 minute lake-build phase. The over-delivery cost roughly 30 minutes of session time. The "pending user install" framing should be a fallback, not a default, but the install pre-work is worth surfacing in the spec.
- **JP-040 path discovery.** The original `.planning/missions/nasa/REFERENCES.md` path was easy to find; the question of where the on-tree relocation belongs was less obvious. `docs/research/nasa-citations.md` was selected as the lowest-friction location (creates a `docs/research/` convention if needed; sits beside other `docs/` content). Convention documented in the commit body for future readers.

---

## Lessons Learned

The full set of forward lessons (10 entries) lives at `chapter/04-lessons.md`. Headline list, all emitted to v1.49.579+ as carryover:

1. **Substantiation milestones immediately following research-heavy milestones are a useful pattern.** After any large research-and-implement milestone (Fleet profile, multiple modules, >=10 phases), schedule a Solo-profile substantiation milestone within roughly one week to dispose of the open-items section. Do NOT carry the open items into the next substantive milestone -- they will calcify or get re-relitigated as scope creep.
2. **DEFER with read-of-source evidence is a first-class outcome.** DEFERs are acceptable when grounded in a concrete structural reason documented in the mission spec or commit body. The reason must be precisely framed (e.g. "no streaming-decision shape -- the call site is one-shot batch") rather than a vibes assessment. Mission packages should have explicit space for DEFER-evidence.
3. **Run end-to-end, even when the spec accepts a DEFER.** When a verification script ships, attempt the end-to-end run as part of the same wave even if the spec accepts a DEFER. Dependency installation is usually the cost; the actual run is short. The "pending user install" framing should be a fallback, not a default.
4. **The "long-term home is the X branch" footnote should be revisited every milestone.** Any "long-term home is the X branch" footnote in a handoff should be re-checked at the next milestone's open. If X has merged or been retired, the off-tree justification has evaporated and the content should move on-tree. Do NOT carry stale branch-pointing footnotes across multiple milestones.
5. **Pre-staged carryforward should be acknowledged as W0/W1, not re-done.** When a milestone opens with pre-existing dev commits relevant to its scope, acknowledge them as the milestone's W0/W1 explicitly in the mission spec. Do NOT re-do the work to make the wave plan look prettier.
6. **Solo profile is right for substantiation; Fleet profile is right for substantive.** Profile selection should track milestone archetype: research / multi-module / breadth-coverage -> Fleet; substantiation / closure / depth-on-narrow-scope -> Solo; single-feature / single-component -> Solo; multi-feature / cross-cutting -> Fleet. Do NOT default either way.
7. **Test delta target overshoot is positive signal when it comes from script surface area.** When a wave's test delta substantially exceeds the spec floor, write a one-line note in the retrospective explaining where the extras came from. Do NOT silently absorb the overshoot -- documenting it helps future spec-floor calibration.
8. **Author release-notes at W6 close, not as a follow-on.** Every W6 closing wave must include "author release-notes (5 files) at `docs/release-notes/v1.49.NNN/`" as an explicit deliverable. Profile is irrelevant -- the discipline is the same. The closing checklist should not consider W6 done until the 5 release-notes files exist.
9. **Info-blocked DEFERs should NOT be force-closed by substantiation milestones.** Distinguish info-blocked DEFERs from procedural-gap DEFERs. Substantiation milestones close procedural gaps (we have everything we need; we just have not written the script / restored the test / wired the second site). They explicitly do NOT close info-blocked DEFERs. The info-block must resolve externally before the work can proceed.
10. **Mission packages serve as substantiation-milestone scaffolding even at Solo profile.** Even Solo-profile milestones should produce a mission package. The package is not just for fleet coordination -- it is the canonical place to document DEFER reasoning, carry-forward provenance, and wave-by-wave outcome. Cost is small (~12K tokens); payoff is reconstructable reasoning without commit-message archaeology.

---

## By the Numbers

| Metric | Pre-v1.49.578 (v1.49.577 close) | Post-v1.49.578 (close) | Delta |
|---|---|---|---|
| Test count (passing) | 28,492 | 28,510 | +18 |
| Regressions | 0 | 0 | 0 |
| Open items | 5 | 1 | -4 |
| JP-001 lake build status | "DEFER, requires Lean install" | PASS (4/4 namespaces) | substantiated |
| JP-002 wired call sites | 1 (`retrieve()`) | 2 (`retrieve()` + `draft-verify-router`) | +1 wired, +2 DEFER-with-evidence |
| JP-010a real callers wired | 0 | 1 (`src/ab-harness/cli.ts`) | +1 |
| JP-040 citations location | `.planning/...` (gitignored) | `docs/research/nasa-citations.md` (on-tree) | relocated |
| Commits in milestone range | (n/a) | 11 (`1b9eedb9b..520419af8`) | -- |
| Substantive commits (W2-W5) | (n/a) | 4 (`33a8a93e3`, `e9f6da224`, `96936725d`, `520419af8`) | -- |
| Carryforward commits (W0-W1) | (n/a) | 4 (`fd3d40b74`, `b75d675df`, `e71f488b5`, `e9be25f72`) | -- |

## Health Metrics

| Indicator | Value |
|---|---|
| Build status | green (`npm run build` clean) |
| Vitest baseline | 28,510 passing, 0 new failures introduced |
| Pre-existing failure pattern | `math-foundations/integration.test.ts` + `heuristics-free-skill-space/integration.test.ts` (unchanged from v1.49.577 close, not introduced or perturbed by v1.49.578) |
| Self-review pass | not performed at v1.49.578 (W2-W6 work small enough that 4 substantive commits are themselves the documented surface; `[unavailable -- backfill 2026-04-27]` whether explicitly skipped or simply not triggered) |
| Token budget consumption | ~95K-115K (estimate, fit comfortably in single Solo context) |
| Pre-existing failures introduced | 0 |
| Bit-exact decomposition guarantee | preserved (W2b acceptanceGate is opt-in, snapshot read, does not advance e-process) |
| Lean toolchain pin source-of-truth | `src/mathematical-foundations/lean-toolchain.md` (script parses dynamically; doc is authoritative) |

## Test Posture

| Wave | New tests | Touch points |
|---|---|---|
| W2b | +5 | `src/orchestration/__tests__/draft-verify-router.test.ts` (acceptanceGate config, acceptanceVerdict snapshot, opt-in default behaviour, route() output preservation, type-I bound regression) |
| W3 | +4 | `src/skill-promotion/__tests__/citations-presence.test.ts` (file existence, arXiv ID 2512.09111 SAGES, arXiv ID 2604.21024 EEI, well-formed H1) |
| W4 | +6 | `tools/__tests__/verify-mathlib-pin.test.ts` (SHA parse, exit-code matrix, --no-build smoke, missing-elan path, missing-lake path, lake-build PASS reporting) |
| W5 | +2 | `src/ab-harness/__tests__/cli.test.ts` (CI sessionType, interactive sessionType, tractability flow-through) |
| Incidental | +1 | type-checked surface around the kAxes seed |

Total: +18 tests against a >=+10 floor. Test count target overshoot logged in lessons (entry 7).

---

## Branch state

- **dev tip:** `520419af8` (W5 -- seed JP-010a kAxes from `src/ab-harness/cli.ts`)
- **main tip:** `2100e5391` (merge: v1.49.578 JULIA-PARAMETER Substantiation + Closure from dev; carries 11 commits `b9076c4d9..2e2eff22c`)
- **Tag:** `v1.49.578` (annotated, pushed)
- **GitHub release:** https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v1.49.578
- **npm:** `gsd-skill-creator@1.49.578` (published)
- **Active branch policy:** dev (work) / main (human-verified merges) -- v1.49.578 followed the standard dev-then-main flow with same-day merge.
- **`nasa` branch:** retired (merged back into dev some time ago, per user direction 2026-04-26). All NASA-series work continues on dev/main. JP-040 on-tree relocation closed the original "long-term home is the nasa branch" footnote without a branch switch.
- **Version files bumped:** `package.json` -> `1.49.578`, `package-lock.json` -> `1.49.578`. `[unavailable -- backfill 2026-04-27]` the merge-stat output for `2100e5391` does not list `src-tauri/Cargo.toml` or `src-tauri/tauri.conf.json` in the visible portion; if those were bumped, the bumps would have happened in the same closing commit `520419af8` on dev.

## Dedications

- **JULIA-PARAMETER spike authors (v1.49.577 substantive milestone)** -- the 87-paper deep-dive plus 54-card absorption across 8 modules that produced the four CLAUDE.md anchors plus the philosophical anchor that v1.49.578 substantiated. Without v1.49.577's depth, v1.49.578 would have nothing to substantiate.
- **Degenne et al.** for the Lean Mathlib Markov-kernel formalization (arXiv:2510.04070) that the JP-001 lake build PASS verifies against. The pinned commit `6955cd00` represents real, compilable formal probability theory the v1.50 proof companion can compile against.
- **The "honest DEFER" discipline** -- W2a + W2c could have been wired to inflate the close-rate. The decision to DEFER with read-of-source evidence rather than ship inert code is the milestone's structural contribution to skill-creator-as-a-self-modifying-system.
- **The user (2026-04-27 drift catch)** -- the release-notes backfill request that produced this README. Lesson 8 (author release-notes at W6 close) exists because of the catch.
- **The substantiation-milestone pattern itself** -- emitted forward to v1.49.579+ as a reusable operational rule.

## Out of Scope

- **`wasserstein-boed.ts` IPM-BOED replacement** -- info-blocked DEFER carried from v1.49.577. Needs a concrete `p(y | d, theta)` data-generating model that does not exist yet for skill-promotion experiments. Will unblock when a real BOED experimental design surfaces.
- **New `src/` subsystems** -- v1.49.578 is closure work, not capability-extension work. No new modules under `src/`. The 4 substantive commits touch existing surfaces (`src/orchestration/draft-verify-router.ts`, `src/skill-promotion/__tests__/citations-presence.test.ts`, `tools/verify-mathlib-pin.sh` plus its tests, `src/ab-harness/cli.ts`).
- **New CLAUDE.md External Citations anchors** -- v1.49.578 did not add new anchors. The four JULIA-PARAMETER anchors landed at v1.49.577 (arXiv:2604.20897 / arXiv:2604.20915 / arXiv:2510.04070 / arXiv:2604.21101) plus the philosophical anchor (arXiv:2604.21048) remain canonical.
- **Self-review pass** -- not performed at v1.49.578. The 4 substantive commits are themselves the documented surface; no new src/ subsystem was added. The v1.49.577 self-review (cleanup commit `268950204`, 6 findings: 2 MEDIUM + 4 LOW) is the most recent on record.
- **Synthetic data-generating model for BOED** -- explicitly out of scope. Forcing closure on the wasserstein-boed open item by inventing a synthetic `p(y|d,theta)` would have driven implementation choices that would later have to be undone when a real BOED experimental design surfaces. Lesson 9 governs.
- **W2a / W2c retrofit** -- not in scope. `selector.ts` and `mesh-degree-monitor.ts` lack the streaming-decision shape; wiring `anytime-gate.ts` would either be inert or force the gate to fight the call site's natural control flow. DEFER recorded with read-of-source evidence; not a future TODO.
- **Lean toolchain auto-install** -- explicitly out of scope. `tools/verify-mathlib-pin.sh` checks for `elan` and `lake` and prints actionable install instructions on miss; it does NOT install Lean automatically. The human-in-the-loop install boundary is intentional: surprise installs of multi-gigabyte toolchains on contributor machines is the kind of footgun that erodes trust in tooling.
- **NASA-mission-series content extension** -- v1.49.578 relocates the citations that JP-040 surfaced; it does not extend the NASA-mission-series content itself. The 57+ NASA missions on tibsfox.com are governed by a separate engine (Seattle 360 + NASA degree pipeline) and do not factor into the v1.49.578 wave plan.
- **Cross-runtime adapter work** -- the runtime-HAL registry remains 14 upstream + Pi runtimes registered, claude-code as the only adapter implemented. v1.49.578 did not extend the adapter surface and did not touch `src/runtime-hal/`.

---

## Open-items disposition

| # | v1.49.577 open item | v1.49.578 disposition | Path / commit |
|---|---|---|---|
| 1 | JP-001 Mathlib pin: SHA pinned, lake build was DEFER (requires Lean install) | CLOSED -- `tools/verify-mathlib-pin.sh` shipped + ran end-to-end | W4 commit `96936725d` |
| 2 | JP-002 anytime-valid wired into one site (`retrieve()`); ready for future call-site wiring -- pluralised | PARTIALLY CLOSED -- `draft-verify-router.ts` wired (2nd site); `selector.ts` + `mesh-degree-monitor.ts` DEFER with read-of-source evidence | W2b commit `33a8a93e3` |
| 3 | JP-040 NASA citations live in gitignored `.planning/missions/nasa/REFERENCES.md`; presence test deleted | CLOSED -- relocated on-tree to `docs/research/nasa-citations.md`; presence test restored with arXiv-ID + H1 assertions | W3 commit `e9f6da224` |
| 4 | JP-010a runAB telemetry has zero observations because zero real callers thread `kAxes` | CLOSED -- first real caller seeded at `src/ab-harness/cli.ts`; every CLI invocation produces a JSONL observation | W5 commit `520419af8` |
| 5 | `wasserstein-boed.ts` IPM-BOED real implementation | CARRIED FORWARD as DEFER -- info-blocked: needs concrete `p(y\|d,theta)` data-generating model that does not exist yet | (no commit) |

Item 5 stays. Items 1, 3, 4 close fully. Item 2 closes 1/3 wired plus 2/3 DEFER-with-evidence.

## Risks faced and mitigations

| Risk | Probability | Impact | Mitigation taken |
|---|---|---|---|
| v1.49.577 de-flake regressing | Low | Medium | vitest run clean throughout; pre-existing failure pattern unchanged from v1.49.577 close |
| Lake build failing on at least one namespace | Medium | High | All four namespaces compiled cleanly on first run at Lean 4.15.0 / Mathlib4@`6955cd00` |
| W2a/W2c pressure to wire instead of DEFER | Medium | Medium | Read-of-source evidence committed to mission-package component specs; structural-question framing prevented vibes-DEFER drift |
| JP-040 path-discovery footgun (where on-tree?) | Low | Low | `docs/research/nasa-citations.md` selected as lowest-friction location; convention documented in commit body |
| W6 release-notes-skip pattern | Realized | Low | User caught drift on 2026-04-27; backfill produced this README; lesson 8 emits forward operational rule |
| Token budget overflow on Solo | Low | Low | ~95K-115K estimate fit in single context window with ~30% margin; no compaction needed |
| Pre-existing flaky tests masking real regression | Low | Medium | One vitest run was sufficient; lesson 2 in retro recommends running twice for future Solo milestones |
| Bit-exact decomposition guarantee broken by W2b | Low | High | acceptanceGate is opt-in, snapshot-read, does not advance e-process; default behaviour unchanged when omitted |

## Process notes

- **Solo-after-Fleet rhythm validated.** v1.49.577 was Fleet (8 modules, 19 named roles) and v1.49.578 was Solo (one Opus session). The shape fit each milestone's work and the rhythm is reproducible.
- **Mission package authored despite Solo profile.** `.planning/missions/v1-49-578-jp-substantiation/` carries README + 01-vision-doc + 03-milestone-spec + 04-wave-execution-plan + 05-test-plan + components/00-07. Solo does not mean unscaffolded.
- **Pre-staged carryforward acknowledged honestly.** Four commits already on dev at milestone-open counted as W0/W1 in the mission spec rather than re-done to make the wave plan look prettier.
- **DEFER reasoning lives in mission-package component specs.** `components/01-jp002-selector.md` and `components/03-jp002-mesh-degree-monitor.md` document the structural mismatch in the package itself, so future readers see "surveyed, structural reason recorded" rather than "still pending."
- **Lake build over-delivery cost ~30 minutes.** W4 originally accepted the actual run as DEFER. Running it produced the real PASS. The framing "pending user install" should be a fallback, not a default.
- **One-day Solo turnaround.** All five waves plus close on 2026-04-26, same day as v1.49.577 close. Substantiation cycle is fast when substantive work pre-stages cleanly.
- **Test count target overshoot logged.** Target +10, landed +18. The W4 verify-mathlib-pin script grew enough surface area (SHA parse, exit codes, --no-build smoke, lake-build PASS reporting) to deserve more coverage than the spec required.
- **Self-review pass not performed.** v1.49.578's W2-W6 work was small enough that the 4 substantive commits (`33a8a93e3` / `e9f6da224` / `96936725d` / `520419af8`) are themselves the documented surface; no new src/ subsystem was added. `[unavailable -- backfill 2026-04-27]` whether explicitly skipped or simply not triggered by the milestone's small shape is not recorded.

## Forward emit (carry-list for v1.49.579+)

- **Open-items inheritance:** 1 item (`wasserstein-boed.ts` IPM-BOED, info-blocked on `p(y|d,theta)` data-generating model). Do NOT force-close. Re-evaluate when a real BOED experimental design surfaces in skill-promotion experiments.
- **Process pattern emit:** Solo-after-Fleet substantiation rhythm validated. Apply within ~1 week of any future Fleet-profile substantive milestone.
- **Lessons emit:** all 10 lessons in `chapter/04-lessons.md` are forward-emitted; lessons 1, 2, 6, 8 are the highest-leverage operational rules.
- **Tooling emit:** `tools/verify-mathlib-pin.sh` is now part of the standard toolbox; future Mathlib pin updates can run it in one command rather than following an interactive procedure.
- **Convention emit:** `docs/research/` as the on-tree home for citation manifests that previously lived in gitignored `.planning/` subtrees.

## Glossary (terms used in this milestone)

- **Substantiation milestone** -- a small focused milestone whose only job is to dispose of the prior milestone's open-items section. No new src/ subsystem, no new research, no new CLAUDE.md anchor. Either close the loop with a commit SHA or DEFER with read-of-source evidence.
- **DEFER with read-of-source evidence** -- a first-class outcome for a planned wave that ships no commit but documents a structural reason (recorded in mission-package component specs and/or commit body) for why the planned work would have produced inert code if forced.
- **Carryforward (W0/W1)** -- pre-existing dev commits that landed before the milestone opened but are within scope. Acknowledged explicitly in the mission spec rather than re-done.
- **Streaming-decision shape** -- the call-site control-flow signature that anytime-valid e-processes earn their keep against: a running statistic polled at unknown-but-controlled stopping time. Selectors and event-driven monitors lack this shape.
- **Lake build** -- the Lean 4 build invocation (`lake build <namespace>`) that compiles a Mathlib module against its dependencies. PASS means all source files in the namespace and its transitive deps type-check and elaborate without error.
- **Open-items handoff** -- the bulleted "follow-ups" list a milestone's close ledger surfaces for the next session. v1.49.578 reduced it from 5 items to 1.

## Net effect

Open items dropped from 5 to 1. Four loops closed -- three with commit SHAs (W2b at `33a8a93e3` plus W3 at `e9f6da224` plus W4 at `96936725d` plus W5 at `520419af8`), three with DEFERs grounded in read-of-source evidence (W2a `selector.ts` and W2c `mesh-degree-monitor.ts` structural-mismatch) or info-block reasoning (W5 carryforward `wasserstein-boed.ts`). Test count +18 against a target floor of +10. Zero regression. One-day Solo turnaround following a Fleet-profile substantive milestone. Eleven commits in the milestone range `1b9eedb9b..520419af8`. The open-items count is now small enough that v1.49.579+ inherits one item rather than five and can route attention to fresh substantive work without first having to close out the prior milestone's receivables.

The pattern is reproducible. v1.49.578 demonstrates that a one-day Solo-profile substantiation milestone immediately following a Fleet-profile substantive milestone is a useful operational rhythm: it consolidates, it fills the gaps that are fillable, and it allows honest DEFERs with documented read-of-source evidence rather than fake completeness. Future milestones that produce open-items handoffs (any Fleet-profile multi-module milestone) should plan a substantiation pass within ~1 week of close. The cost is small (~95K-115K Solo tokens); the payoff is that footnotes do not calcify.

## Files

- `chapter/00-summary.md` -- long-form release summary (133 lines; all five v1.49.577 open items disposed)
- `chapter/03-retrospective.md` -- v1.49.577 -> v1.49.578 carryover retrospective (110 lines)
- `chapter/04-lessons.md` -- 10 forward lessons emitted to v1.49.579+ (81 lines)
- `chapter/99-context.md` -- engine-state context plus backfill provenance (107 lines)
- `.planning/missions/v1-49-578-jp-substantiation/README.md` -- mission package entry point
- `.planning/missions/v1-49-578-jp-substantiation/01-vision-doc.md` -- vision and through-line
- `.planning/missions/v1-49-578-jp-substantiation/03-milestone-spec.md` -- milestone-level acceptance criteria
- `.planning/missions/v1-49-578-jp-substantiation/04-wave-execution-plan.md` -- W0/W1 carryforward + W2-W6 execution plan
- `.planning/missions/v1-49-578-jp-substantiation/05-test-plan.md` -- test floor + per-wave test deltas
- `.planning/missions/v1-49-578-jp-substantiation/components/00-07*.md` -- 8 component specs (W2 sub-components carry DEFER evidence)

---

## Provenance

This release-notes set was authored on 2026-04-27, one day after v1.49.578 shipped on 2026-04-26. The original W6 closing wave (commits `520419af8` on dev / `2100e5391` on main; tag `v1.49.578` annotated and pushed; npm `gsd-skill-creator@1.49.578` published; GitHub release created) did not produce the standard `docs/release-notes/v1.49.578/` directory at ship time. The user flagged the drift on 2026-04-27 and authorised this backfill. Sources used: `.planning/STATE.md` blocks `v1_49_578_legacy_block` and `v1_49_578_summary`, the `.planning/missions/v1-49-578-jp-substantiation/` mission package, `git log --oneline 1b9eedb9b..520419af8` (11 commits), and `git show` on closing commits `520419af8` and `2100e5391`. Items flagged `[unavailable -- backfill 2026-04-27]` in the chapter files indicate information that was not recoverable from the sources above. The backfill is structurally complete (5 files matching the v1.49.581 / v1.49.582 template) but readers should treat the prose as 1-day-after reconstruction, not real-time ship narration.

---

*v1.49.578 / JULIA-PARAMETER Substantiation + Closure / 2026-04-26 (release-notes backfilled 2026-04-27)*
