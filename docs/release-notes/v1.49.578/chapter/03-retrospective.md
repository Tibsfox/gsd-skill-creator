# v1.49.578 -- Retrospective

**Reads:** v1.49.577 JULIA-PARAMETER -- handoff "open items / follow-ups" section + self-review-pass findings.

**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes).

## Carryover from v1.49.577

v1.49.577 closed `ready_for_review` on 2026-04-26 with five enumerated open items. The carryover into v1.49.578 was deliberate and pre-staged: four commits were already on `origin/dev` at v1.49.578 milestone-open (`fd3d40b74` test-fix + `b75d675df` JP-001 SHA pin + `e71f488b5` JP-010a runAB wiring + `e9be25f72` JP-002 retrieve() wiring), accounting for W0 + W1 of the substantiation milestone. v1.49.578 then planned five additional waves (W2-W6) to dispose of the remaining open items.

The five carried open items and their disposition:

### Item 1 -- JP-001 actual lake build (CLOSED at v1.49.578)

v1.49.577 self-review noted: "JP-001 placeholder Mathlib commit hash (lean-toolchain.md documents the placeholder + substitution procedure)." The placeholder-to-real-SHA substitution was carried forward as `b75d675df` on dev pre-W2. The remaining gap was that no one had actually run `lake build` against the pinned SHA -- the procedure was prose, not automation.

v1.49.578 closes the gap two ways: (1) ships `tools/verify-mathlib-pin.sh` (W4, commit `96936725d`) that automates the parse-clone-checkout-cache-get-build-report flow with distinct exit codes; (2) ran the script end-to-end on Lean 4.15.0 / Mathlib4@`6955cd00`, with all four namespaces (Probability.Kernel.Disintegration.Basic 1760 jobs / InformationTheory.KullbackLeibler.Basic 2479 jobs / Probability.Distributions.Gaussian 2706 jobs / Probability.IdentDistrib 2438 jobs) compiling cleanly. The CLAUDE.md External Citations §arXiv:2510.04070 anchor is no longer "documented as compilable" -- it's "compiled, here's the script that re-verifies in one command."

### Item 2 -- JP-002 ready for future call-site wiring, pluralised (PARTIALLY CLOSED at v1.49.578)

v1.49.577 wired `anytime-gate.ts` into `retrieve()` but explicitly noted "ready for future call-site wiring -- pluralised." The plural was the asymmetry: one wired site, multiple candidate sites in `src/orchestration/` with potentially-similar streaming-decision shapes.

v1.49.578 surveyed the three concrete candidates and disposed of each:
- **`draft-verify-router.ts` (WIRED, `33a8a93e3`):** the natural shape was there -- the router accumulates draft-vs-verifier match indicators across `route()` calls, so an opt-in `acceptanceGate` field plus an `acceptanceVerdict()` snapshot read maps cleanly onto the e-process surface. Five tests landed.
- **`selector.ts` (DEFER):** read of source confirmed no streaming-decision shape -- one-shot batch ranking. The gate would have been inert.
- **`mesh-degree-monitor.ts` (DEFER):** read of source confirmed no streaming-decision shape -- event-driven + hard-rule + one-shot escalation. Same structural mismatch as `selector.ts`.

The DEFERs are read-of-source-grounded and documented in the mission spec at `.planning/missions/v1-49-578-jp-substantiation/components/01-jp002-selector.md` and `components/03-jp002-mesh-degree-monitor.md`. The next milestone reading the handoff sees "two sites surveyed, structural reason in mission spec" rather than "two sites still pending."

This is the substantiation-milestone honesty test: when the structural shape doesn't fit, name the mismatch and stop. Do not wire just to close the line item.

### Item 3 -- JP-040 NASA citations off-tree (CLOSED at v1.49.578)

v1.49.577 noted: citations live at `.planning/missions/nasa/REFERENCES.md`; that path is gitignored; the presence test asserting on it was structurally broken on CI and got deleted in `6598ac959`. The handoff said "long-term home is the nasa branch where the content actually lives."

Per user direction 2026-04-26 the `nasa` branch had been merged back into dev some time ago and is no longer active. v1.49.578 takes the cleaner path: relocate to `docs/research/nasa-citations.md` (W3, commit `e9f6da224`), restore the JP-040 presence test in `src/skill-promotion/__tests__/citations-presence.test.ts` with arXiv-ID + well-formed-H1 assertions. Four tests landed.

The lesson: "off-tree until a future branch consolidates" was the right call at the original moment, but once the branch consolidation actually happened (and reversed -- nasa merged back into dev), the off-tree justification evaporated. v1.49.578 caught the staleness in the same milestone pass.

### Item 4 -- JP-010a zero telemetry observations (CLOSED at v1.49.578)

v1.49.577 self-review noted: "JP-010a zero telemetry observations (audit-trail entry documents K=3 default; activates when callers wire the module)."

v1.49.578 grepped `src/` and `tools/` for `runAB(` callers and found exactly one real (non-test) site: `src/ab-harness/cli.ts`. Seeded that one site (W5, commit `520419af8`) with sensible defaults (`caller=ab-harness-cli`, `sessionType` from `process.env.CI`, `tractability` from `--tractability` flag). Two tests landed.

The "ready when callers exist" footnote becomes "one real caller now exists; every CLI invocation produces a JSONL observation."

### Item 5 -- wasserstein-boed.ts IPM-BOED replacement (CARRIED FORWARD as DEFER)

v1.49.577 self-review identified this as a MEDIUM finding: "src/ab-harness/wasserstein-boed.ts citation overclaim -- wassersteinExpectedUtility framed as IPM-BOED algorithm but ships a hand-constructed bounded-update heuristic. Added Limitations section + reframed."

v1.49.578 carries this forward as the only remaining open item, with explicit DEFER reasoning: a real IPM-BOED implementation needs a concrete `p(y | d, theta)` data-generating model, and no such model exists yet for skill-promotion experiments. This is an info-block, not a procedural gap. It will unblock when a real BOED experimental design surfaces.

This DEFER is the kind that should NOT be force-closed by a substantiation milestone -- forcing it would mean inventing a synthetic data-generating model just to have something to plug in, which would be worse than honestly carrying the gap.

## Approach

### Solo profile chosen deliberately

v1.49.577 was Fleet (8 modules, 19 named roles). v1.49.578 is Solo: one Opus session, no fleet dispatch, all components read top-to-bottom and executed inline. The shape fit the work: every wave is small (read source, edit, test, commit), the DEFER decisions need read-of-source judgement that's faster inline than coordinated, and the full token budget estimate (~95K-115K) sits comfortably in a single context window.

The Solo-after-Fleet pattern is itself a finding -- the substantive milestone needs the parallelism for breadth coverage; the substantiation milestone needs the focus for honest gap-filling.

### Pre-staged carryforward as W0/W1

Four commits already on `origin/dev` at milestone-open. Counting them as W0/W1 rather than re-doing the work was the right call: the substantiation milestone's value is the W2-W6 substantiation, not a pretense that the pre-staging didn't happen. The mission spec records the four commits explicitly so future readers don't search for "where did W1 happen?"

### DEFER as a first-class outcome

W2a (selector) + W2c (mesh-degree-monitor) deferred with read-of-source evidence. W5 (wasserstein-boed) deferred with info-block reasoning. Three DEFERs out of seven deliverables is high by some metrics, but each DEFER is grounded in a concrete reason that's documented in the mission spec or the commit body. The alternative -- forcing a wire-up that doesn't fit the call site's shape -- would have produced silent inert code that the next milestone would have to audit and likely undo.

The DEFER pattern matters because it preserves structural integrity: a milestone that wires three call sites is not categorically better than a milestone that wires one and DEFERs two with reasons. Quality of fit is the measure.

## What went well

1. **Mission package as substantiation-milestone scaffolding.** The `.planning/missions/v1-49-578-jp-substantiation/` package (README + 4 plan docs + 8 component specs) gave a clean wave plan even though the work was Solo. Component specs serving as DEFER-evidence carriers (W2a + W2c spec files document the structural mismatch in the mission package itself) is a pattern worth reusing.

2. **vitest run was clean throughout.** Zero regression, the pre-existing failure pattern from v1.49.577 close (math-foundations integration.test.ts + heuristics-free-skill-space integration.test.ts) was unchanged -- substantiation work didn't perturb pre-existing failures.

3. **lake build PASS exceeded expectations.** The original W4 plan accepted that the actual `lake build` execution might still be a DEFER (user opting to install Lean was a separate decision). Running it end-to-end -- and getting all four namespaces to compile cleanly -- was an over-delivery on the W4 spec.

4. **Test delta target overshoot.** Target was >=+10; landed +18. The over-delivery came from W4 verify-mathlib-pin landing 6 tests (planned >=1) -- the script grew enough surface area (SHA parse, exit codes, --no-build smoke) to deserve more coverage than the spec required.

5. **One-day turnaround.** All five waves + close on 2026-04-26, same day as the v1.49.577 close. The substantiation cycle is fast when the substantive work pre-stages cleanly.

## What was harder than expected

1. **Ranking which DEFERs are honest.** W2a (selector) DEFER felt borderline at first read -- the function does see a list of candidates and could in principle accumulate evidence across multiple selection passes. The clarifying question was: "does the call site actually poll across N invocations, or is each invocation one-shot from the call site's perspective?" Once framed that way, the answer was clearly one-shot. The lesson: DEFER decisions need a precisely-framed structural question, not a vibes assessment.

2. **JP-040 path discovery.** The original `.planning/missions/nasa/REFERENCES.md` path was easy to find; the question of where the on-tree relocation belongs was less obvious. `docs/research/nasa-citations.md` was selected as the lowest-friction location (creates a `docs/research/` convention if needed; sits beside other `docs/` content). The convention is documented in the commit body for future readers.

3. **lake build required Lean install.** W4 originally planned to ship the script and DEFER the actual run; running it required installing `elan` + Lean 4.15.0 + cloning Mathlib4 + ~5-15min lake build phase. The W4 over-delivery cost ~30 minutes of session time, but produced a real PASS rather than "PASS pending user install."

## What we would do differently

1. **Author release-notes at ship time.** v1.49.578 did not author release-notes when it shipped on 2026-04-26. The user flagged the drift on 2026-04-27 and the backfill is what produced this file. The 1-day delay is small in absolute terms but represents a regression in the ship-discipline pattern -- future milestones should author release-notes as part of W6 close, not as a follow-on. **[unavailable -- backfill 2026-04-27]:** the exact reason release-notes were skipped at original ship is not recorded in STATE.md or commit messages; the most likely cause is that the substantiation milestone's small-Solo-profile shape didn't trigger the release-notes step that a Fleet-profile milestone routinely produces.

2. **Run vitest twice at W6.** The risk register mentioned the v1.49.577 de-flake regressing; we ran vitest once. Running twice (or three times) would have given more confidence that flakiness wasn't masking a real regression. None surfaced after the close, so no harm done -- but the pattern is worth adopting.

3. **Document the DEFER pattern in skill memory.** The W2a + W2c DEFER decisions used a structural-question framing that's reusable across orchestration call-site assessments. That framing should land in skill memory (`.claude/skills/skill-integration/...` or similar) so future call-site surveys don't re-derive it.

## Net effect

Open items dropped from 5 to 1. Four loops closed -- three with commit SHAs (W2b + W3 + W4 + W5), three with DEFERs grounded in read-of-source evidence (W2a + W2c) or info-block reasoning (W5 carryforward). Test count +18 (target +10). Zero regression. One-day Solo turnaround following a Fleet-profile substantive milestone.

The pattern is reproducible and named in `chapter/04-lessons.md` for future cycles.

---

*v1.49.578 retrospective. Reads v1.49.577. Emits to v1.49.579+ carryover.*
