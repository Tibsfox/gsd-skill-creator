# v1.49.578 -- JULIA-PARAMETER Substantiation + Closure -- Summary

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release)
**Profile:** Solo (one-developer Opus session)
**Shape:** W0/W1 carryforward -> W2 (3 components, 1 wired + 2 DEFER with evidence) -> W3 -> W4 -> W5 -> W6 close
**Dev closing commit:** `520419af8`
**Main closing commit:** `2100e5391`

## One-line

v1.49.578 is the keeper milestone: it took the four "ready for future call-site wiring / documented as pending / long-term home is the nasa branch" footnotes from the v1.49.577 JULIA-PARAMETER handoff and turned each into a commit SHA, an on-tree path, an automated verification script, or an explicit DEFER backed by read-of-source evidence -- closing the open-items count from 5 to 1, all on Solo profile in eleven commits across the v1.49.577 close (`1b9eedb9b`) and the v1.49.578 dev close (`520419af8`).

## What "substantiation milestone" means

v1.49.577 was the substantive milestone -- 40/40 candidate absorptions across BLOCK + HIGH + MEDIUM, 20 phases, +279 tests over the v1.49.576 baseline, six convergent-discovery clusters surfaced, four CLAUDE.md anchor papers integrated. It closed `ready_for_review` with a clean conscience, but with five "open items / follow-ups" in the handoff -- four of which were "ready for X but not actually X" gaps and one of which was an info-blocked DEFER.

v1.49.578 is what those five gaps deserved: a milestone whose only job is to close the loops without inventing scope. No new src/ subsystem. No new research. No new CLAUDE.md anchor. Just: write the script, move the citations, wire the second call site, find the real caller. Or, if the structural shape doesn't fit, name the mismatch and DEFER.

This is a useful pattern for any large research-and-implement milestone: the substantive work books the value; the substantiation milestone the next session collects on the receivables.

## The five open items at v1.49.577 close

The v1.49.577 handoff carried forward five items. v1.49.578 disposes of each:

| # | Item | v1.49.578 action |
|---|---|---|
| 1 | JP-001 Mathlib pin: SHA pinned, but `lake build` against pinned commit was DEFER (requires Lean install) | **CLOSED**: tools/verify-mathlib-pin.sh shipped + ran end-to-end; 4/4 namespaces PASS on Lean 4.15.0 / Mathlib4@`6955cd00` |
| 2 | JP-002 anytime-valid wired into one site (`retrieve()`); "ready for future call-site wiring -- pluralised" | **PARTIALLY CLOSED**: `draft-verify-router.ts` wired (2nd site); `selector.ts` + `mesh-degree-monitor.ts` DEFER with read-of-source evidence (no streaming-decision shape) |
| 3 | JP-040 NASA citations live in gitignored `.planning/missions/nasa/REFERENCES.md`; presence test deleted | **CLOSED**: relocated to `docs/research/nasa-citations.md` on-tree; presence test restored with arXiv-ID + well-formed-H1 assertions |
| 4 | JP-010a runAB telemetry has zero observations because zero real callers thread `kAxes` | **CLOSED**: first real caller seeded at `src/ab-harness/cli.ts`; every CLI invocation now produces a JSONL observation |
| 5 | `wasserstein-boed.ts` IPM-BOED real implementation | **CARRIED FORWARD as DEFER** (info-blocked: needs a concrete `p(y\|d,theta)` data-generating model that doesn't exist yet for skill-promotion experiments) |

Item 5 stays. Items 1, 3, 4 close fully. Item 2 closes 1/3 wired + 2/3 DEFER-with-evidence.

## Wave-by-wave outcomes

### W0 / W1 -- Carryforward (already on dev at `e9be25f72`)

Four commits already on `origin/dev` at milestone-open were carried as W0/W1:

- `fd3d40b74` -- `test(config-flags): replace live-file enabled=false assertion with schema-shape check` (test fix)
- `b75d675df` -- `chore(mathematical-foundations): pin real Mathlib commit hash for JP-001` (JP-001 SHA pin)
- `e71f488b5` -- `feat(ab-harness): wire JP-010a K-axis telemetry into runAB` (JP-010a Round 1)
- `e9be25f72` -- `feat(orchestration): wire JP-002 anytime-valid early-stop into retrieve()` (JP-002 first wiring)

These are the prerequisites W2-W5 build on.

### W2a -- `selector.ts` -- DEFER

Read of source: `selector.ts` is a one-shot batch selector. It receives the full candidate set, ranks once, and returns a chosen candidate. There is no notion of "accumulate evidence across N polls and decide whether to stop" -- the function returns at the moment of decision. Anytime-valid e-processes earn their keep when a call site polls a running statistic at unknown-but-controlled stopping time; here there is no polling and the stopping time is fixed at "after one ranking pass." Wiring `anytime-gate.ts` would either be inert (the gate sees one observation and has nothing to gate) or would force the gate to fight the call site's natural control flow. DEFER documented in `.planning/missions/v1-49-578-jp-substantiation/components/01-jp002-selector.md` with the structural reason; the next milestone's reader sees "surveyed, structural mismatch" rather than "still pending."

### W2b -- `draft-verify-router.ts` -- WIRED (`33a8a93e3`, +5 tests)

Adds opt-in `acceptanceGate?: { config?, minTurns?, metric? }` field to `RouterConfig`. When supplied, the router accumulates draft-accept indicators across `route()` calls and exposes the verdict via a new `acceptanceVerdict()` method. The metric fed to the gate is `+1` when `draftAccepted` is true, `-1` otherwise -- bounded, mean-zero under the null "draft tier is unreliable," positive in expectation when the draft tier matches the verifier frequently. Type-I error bound holds at any sample size, so callers may poll the verdict after every route safely.

The gate does NOT change `route()`'s pipeline or output. The bit-exact decomposition guarantee from prior milestones still holds. `acceptanceVerdict()` is a snapshot read of the most recent gate evaluation -- does not advance the e-process or add a phantom observation. Returns `null` when no gate is configured. Default behaviour unchanged when `acceptanceGate` is omitted, matching the opt-in pattern established by `retrieve()` in v1.49.577 commit `e9be25f72`.

### W2c -- `mesh-degree-monitor.ts` -- DEFER

Read of source: the monitor is event-driven (subscribes to mesh-degree change events), uses a hard-rule threshold (degree exceeds K -> escalate), and emits a one-shot escalation. No streaming-decision shape. Same structural mismatch as `selector.ts` -- a single threshold trip fires the escalation; there is no notion of "wait, accumulate, then decide." DEFER documented in `.planning/missions/v1-49-578-jp-substantiation/components/03-jp002-mesh-degree-monitor.md`.

### W3 -- JP-040 NASA citations on-tree (`e9f6da224`, +4 tests)

Moves the JP-040 SAGES (arXiv:2512.09111) + EEI Formation Flying (arXiv:2604.21024) NASA-mission-series citations from `.planning/missions/nasa/REFERENCES.md` (gitignored) to `docs/research/nasa-citations.md` (on-tree). Restores the JP-040 presence test in `src/skill-promotion/__tests__/citations-presence.test.ts` (removed in `6598ac959` because the original `.planning/` target was gitignored). The new assertions check existence on-tree, both arXiv IDs, and well-formed H1-title Markdown.

Per user direction 2026-04-26 the `nasa` branch was merged back into dev some time ago and is no longer active -- all NASA-series work continues on dev/main, so the on-tree relocation closes the original "long-term home is the nasa branch" footnote without a branch switch.

### W4 -- `tools/verify-mathlib-pin.sh` + lake build PASS (`96936725d`, +6 tests)

Two deliverables in one commit -- the automation script and the actual end-to-end run.

**Script:** parses the pinned SHA from `src/mathematical-foundations/lean-toolchain.md` dynamically (the doc is the source of truth, not the script -- if the SHA bumps in the doc, the script picks it up automatically). Checks for `elan` + `lake` on PATH and prints actionable install instructions if missing. Clones or fast-forwards Mathlib4 at `$MATHLIB_DIR` (default `.mathlib-verify-checkout`, gitignored). Checks out the pinned commit. Runs `lake exe cache get` (skippable via `LAKE_OFFLINE`). Runs `lake build` for the four load-bearing namespaces from JP-001. Reports PASS/FAIL per namespace; exits non-zero on any failure. Distinct exit codes: 0 ok / 1 lean missing / 2 git fail / 3 cache get fail / 4 build fail / 5 SHA parse fail. `--no-build` smoke-tests parse + clone without the long lake-build phase.

**End-to-end PASS:** ran the script on Lean 4.15.0 / Mathlib4 commit `6955cd00cec441d129d832418347a89d682205a6`. All four namespaces compiled cleanly:
- `Mathlib.Probability.Kernel.Disintegration.Basic` (1760 jobs)
- `Mathlib.InformationTheory.KullbackLeibler.Basic` (2479 jobs)
- `Mathlib.Probability.Distributions.Gaussian` (2706 jobs)
- `Mathlib.Probability.IdentDistrib` (2438 jobs)

The CLAUDE.md External Citations §arXiv:2510.04070 anchor (Markov kernels in Lean Mathlib by Degenne et al.) is the formal substrate v1.50's proof companion compiles against. JP-001 was already pinned to a real SHA at v1.49.577; v1.49.578 closes the loop by verifying the pin actually compiles -- and now any future contributor can verify the same in one command rather than following an interactive procedure.

### W5 -- JP-010a first real caller seeded (`520419af8`, +2 tests)

`src/ab-harness/cli.ts` is the only real (non-test) caller of `runAB()` in the codebase per `grep -rn 'runAB(' src tools --include='*.ts'`. The seed threads sensible defaults through:

```
kAxes: {
  userDomain:    'unknown',                 // CLI doesn't know the domain
  expertiseLevel:'unknown',                 // CLI doesn't know the user
  sessionType:   process.env.CI ? 'ci' : 'interactive',
  extraAxes: {
    caller:      'ab-harness-cli',
    tractability,                           // from --tractability flag
  },
}
```

Closes the v1.49.577 footnote "JP-010a telemetry has 0 observations" substantively: every `skill-creator ab <skill> --variant=...` run now appends a JSONL observation to the default K-axis log path. Real values for `userDomain` / `expertiseLevel` will flow once richer callers thread them explicitly; the CLI seeds the surface that exists.

Tests (2 new in `cli.test.ts`, 13 passing total):
- end-to-end CLI run produces JSONL with `caller=ab-harness-cli` + `sessionType=interactive` when `CI` env unset
- `sessionType=ci` when `process.env.CI` is truthy + `tractability` flows

### W6 -- closing wave (commit `520419af8` on dev, `2100e5391` on main)

STATE.md `v1_49_578_legacy_block` + `v1_49_578_summary` blocks recorded. ROADMAP.md updated. Version bump in `package.json` + `package-lock.json` to `1.49.578`. Tag `v1.49.578` annotated and pushed. GitHub release created with notes-file. npm `gsd-skill-creator@1.49.578` published. `dev` merged to `main` (merge commit `2100e5391`). `wasserstein-boed.ts` IPM-BOED carried forward as DEFER (info-blocked).

**[unavailable -- backfill 2026-04-27]:** the original close did not author release-notes, so no `chapter/` or `README.md` was committed at ship time; this backfill covers the gap.

## Test ledger

| Metric | Value |
|---|---|
| Baseline (v1.49.577 close) | 28,492 passing |
| Final (v1.49.578 close) | 28,510 passing |
| Delta | +18 (target was >=+10) |
| Regressions | 0 |
| New test files | (touches in `draft-verify-router.test.ts`, `citations-presence.test.ts`, `verify-mathlib-pin.test.ts`, `cli.test.ts`) |

The +18 lands as: W2b draft-verify-router gate +5 / W3 JP-040 presence +4 / W4 verify-mathlib-pin +6 / W5 ab-harness-cli +2 / +1 incidental.

## Why this milestone matters

A large research-and-implement milestone (v1.49.577) inevitably leaves footnotes -- partial wirings, deferred verifications, off-tree citations, instrumentation without callers. Without a substantiation pass these footnotes either calcify into permanent "open items" the next milestone inherits, or they get re-relitigated as scope creep inside an unrelated future milestone.

v1.49.578 demonstrates that a one-day Solo-profile substantiation milestone immediately following a Fleet-profile substantive milestone is a useful pattern: it consolidates, it fills the gaps that are fillable, and it allows honest DEFERs with documented read-of-source evidence rather than fake completeness. The open-items count drops from 5 to 1, and the 1 that remains is a genuine info-block (no `p(y|d,theta)` model exists yet for skill-promotion experiments) rather than a procedural gap.

The pattern is named in `chapter/04-lessons.md` and recommended for adoption after future research-heavy milestones.

---

*v1.49.578 / JULIA-PARAMETER Substantiation + Closure / 2026-04-26 (release-notes backfilled 2026-04-27)*
