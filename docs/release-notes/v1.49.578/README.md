# v1.49.578 -- JULIA-PARAMETER Substantiation + Closure

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes -- drift remediation)
**Profile:** Solo (one-developer Opus session -- no fleet dispatch)
**Pipeline speed:** Fast (Vision + Mission, no separate research stage)
**Archetype:** Infrastructure Component (extends existing JP-NNN primitives + closes deferred items)

**Through-line:** *Close the open loops the v1.49.577 handoff handed forward -- wire the primitives into more call sites, on-tree the citations the gitignore sequestered, automate the verification we couldn't run, and seed the telemetry with one real caller.*

**Prior milestone:** v1.49.577 JULIA-PARAMETER (closing commit on dev `821568eea`, on main `1b9eedb9b`, npm `gsd-skill-creator@1.49.577`). v1.49.577 closed `ready_for_review` on 2026-04-26 with five "open items / follow-ups." v1.49.578 is the keeper milestone that turns four of those five into a commit SHA, a file path, or an explicit DEFER with the external block named.

**Closing commits:**
- dev: `520419af8` (W5 -- seed JP-010a kAxes from `src/ab-harness/cli.ts`)
- main: `2100e5391` (merge: v1.49.578 JULIA-PARAMETER Substantiation + Closure from dev)

**Tag:** `v1.49.578` (annotated, pushed)
**npm:** `gsd-skill-creator@1.49.578`
**GitHub release:** https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v1.49.578

---

## Wave outcomes

| Wave | Component | Outcome | Commit | Test delta |
|---|---|---|---|---|
| W0/W1 | Carryforward (test-fix + JP-001 pin + JP-002 retrieve + JP-010a runAB) | Already on dev at `e9be25f72` | `b9076c4d9..e9be25f72` | (carried) |
| W2a | `src/orchestration/selector.ts` -- JP-002 wiring | **DEFER** -- selector is one-shot batch, no streaming-decision shape | (no commit) | 0 |
| W2b | `src/orchestration/draft-verify-router.ts` -- JP-002 wiring | **WIRED** -- opt-in `acceptanceGate` + `acceptanceVerdict()` | `33a8a93e3` | +5 |
| W2c | `src/orchestration/mesh-degree-monitor.ts` -- JP-002 wiring | **DEFER** -- event-driven + hard-rule + one-shot escalation, no streaming-decision shape | (no commit) | 0 |
| W3  | `docs/research/nasa-citations.md` + JP-040 presence test restored | **WIRED** -- on-tree, JP-040 block restored | `e9f6da224` | +4 |
| W4  | `tools/verify-mathlib-pin.sh` + JP-001 lake build PASS | **WIRED + LAKE_BUILD_PASS** -- ran end-to-end on Lean 4.15.0 / Mathlib4@`6955cd00`, 4/4 namespaces compiled cleanly | `96936725d` | +6 |
| W5  | JP-010a real-caller seed at `src/ab-harness/cli.ts` | **WIRED** -- `caller=ab-harness-cli`, `sessionType` from `process.env.CI`, `tractability` from `--tractability` flag | `520419af8` | +2 |
| W6  | Closing wave (STATE/ROADMAP/version/tag/release/npm/merge-to-main) | This commit | `520419af8` (dev) / `2100e5391` (main) | regression-only |

**Total test delta:** 28,492 -> 28,510 (+18, target was >=+10). Zero regression.

---

## What v1.49.578 delivered

### 1. JP-002 anytime-valid extended beyond `retrieve()` (W2b WIRED; W2a + W2c DEFER with read-of-source evidence)

The v1.49.577 handoff said "JP-002 ready for future call-site wiring -- pluralised." v1.49.578 wired the second call site and surveyed the two remaining candidates honestly:

- **`src/orchestration/draft-verify-router.ts` (WIRED, `33a8a93e3`):** Adds opt-in `acceptanceGate` field to `RouterConfig`. When supplied, the router accumulates draft-accept indicators across `route()` calls and exposes the verdict via a new `acceptanceVerdict()` method. The metric fed to the gate is `+1` when `draftAccepted` is true, `-1` otherwise -- bounded, mean-zero under the null "draft tier is unreliable," positive in expectation when the draft tier matches the verifier frequently. Type-I error bound holds at any sample size, so callers may poll the verdict after every route safely. The gate does NOT change `route()`'s pipeline or output; the bit-exact decomposition guarantee still holds.
- **`src/orchestration/selector.ts` (DEFER):** read of source confirmed `selector.ts` is a one-shot batch selector with no streaming-decision shape -- it sees the full candidate set, ranks once, and returns. Anytime-valid gates only earn their keep when the call site polls a running e-process; the DEFER is structural, not procedural, and is documented in the mission spec so future work doesn't relitigate the question.
- **`src/orchestration/mesh-degree-monitor.ts` (DEFER):** read of source confirmed the monitor is event-driven + hard-rule + one-shot escalation -- a single threshold trip fires the escalation; there is no notion of "accumulate evidence across N polls before deciding." Same structural mismatch as selector.ts. DEFER documented.

The DEFER pattern matters: rather than wire `anytime-gate.ts` into a site that doesn't have the shape (which would either be inert or force the gate to fight the call site's natural control flow), v1.49.578 names the mismatch and stops. The next milestone reading the handoff sees "two sites surveyed, structural reason in mission spec" rather than "two sites still pending."

### 2. JP-040 NASA citations on-tree + presence test restored (W3 WIRED, `e9f6da224`)

The JP-040 SAGES (arXiv:2512.09111) + EEI Formation Flying (arXiv:2604.21024) NASA-mission-series citations had lived at `.planning/missions/nasa/REFERENCES.md` -- which is gitignored. The presence test that asserted on that path was structurally broken on CI and got deleted in `6598ac959`. v1.49.578 relocates the citations to `docs/research/nasa-citations.md` (on-tree, survives `git clone`), restores the JP-040 presence test in `src/skill-promotion/__tests__/citations-presence.test.ts`, and asserts on existence + both arXiv IDs + well-formed H1-title Markdown.

Per user direction 2026-04-26 the `nasa` branch was merged back into dev some time ago and is no longer active -- all NASA-series work continues on dev/main, so the on-tree relocation closes the original "long-term home is the nasa branch" footnote without a branch switch.

### 3. JP-001 Mathlib pin verification automated + ran end-to-end (W4 WIRED + LAKE_BUILD_PASS, `96936725d`)

The v1.49.577 handoff said "JP-001 actual `lake build` execution against the pinned commit -- DEFER, requires Lean install." v1.49.578 ships the automation AND ran it end-to-end:

- **Script:** `tools/verify-mathlib-pin.sh` -- idempotent bash that parses the pinned SHA from `src/mathematical-foundations/lean-toolchain.md` dynamically (the doc is the source of truth, not the script), checks for `elan` + `lake` on PATH (prints actionable install instructions and exits non-zero if missing), clones or fast-forwards Mathlib4 at `$MATHLIB_DIR` (default `.mathlib-verify-checkout`, gitignored), checks out the pinned commit, runs `lake exe cache get` (skippable via `LAKE_OFFLINE`), runs `lake build` for the four load-bearing namespaces from JP-001, and reports PASS/FAIL per namespace. Distinct exit codes: 0 ok / 1 lean missing / 2 git fail / 3 cache get fail / 4 build fail / 5 SHA parse fail. `--no-build` smoke-tests parse + clone without the long lake-build phase.
- **End-to-end PASS:** Ran on Lean 4.15.0 / Mathlib4 commit `6955cd00cec441d129d832418347a89d682205a6`. All four namespaces compiled cleanly:
  - `Mathlib.Probability.Kernel.Disintegration.Basic` (1760 jobs)
  - `Mathlib.InformationTheory.KullbackLeibler.Basic` (2479 jobs)
  - `Mathlib.Probability.Distributions.Gaussian` (2706 jobs)
  - `Mathlib.Probability.IdentDistrib` (2438 jobs)

The "v1.50 proof companion needs a Lean-statable target" thread (CLAUDE.md External Citations §arXiv:2510.04070 Markov kernels in Lean Mathlib) is now reproducible in one command rather than an interactive procedure.

### 4. JP-010a first real caller seeded (W5 WIRED, `520419af8`)

The v1.49.577 self-review pass acknowledged "JP-010a zero telemetry observations -- audit-trail entry documents K=3 default; activates when callers wire the module" as an open item. v1.49.578 grepped `src/` and `tools/` for `runAB(` callers and found exactly one real (non-test) site: `src/ab-harness/cli.ts`. The seed threads sensible defaults:

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

Every `skill-creator ab <skill> --variant=...` run now appends a JSONL observation to the default K-axis log path. Real values for `userDomain` / `expertiseLevel` flow once richer callers thread them explicitly; the CLI seeds the surface that exists. The "zero observations" footnote becomes "one observation per CLI run, structurally."

---

## Open items remaining at close (down from 5 to 1)

| Item | Status | Why |
|---|---|---|
| `wasserstein-boed.ts` IPM-BOED replacement | **DEFER** (carried from v1.49.577) | Info-blocked: needs a concrete `p(y \| d, theta)` data-generating model that doesn't exist yet for skill-promotion experiments. Will unblock when a real BOED experimental design surfaces. |

The other four open items from v1.49.577 (JP-001 lake build, JP-002 wirings, JP-040 on-tree, JP-010a real caller) are now all closed -- either with a commit SHA + tests, or with an explicit DEFER + read-of-source evidence.

---

## Files

- See `chapter/00-summary.md` for the long-form release summary
- See `chapter/03-retrospective.md` for the v1.49.577 -> v1.49.578 carryover retrospective
- See `chapter/04-lessons.md` for the lessons emitted forward
- See `chapter/99-context.md` for engine-state context after v1.49.578 (and backfill provenance)

---

*v1.49.578 / JULIA-PARAMETER Substantiation + Closure / 2026-04-26 (release-notes backfilled 2026-04-27)*
