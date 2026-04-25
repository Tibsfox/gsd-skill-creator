# v1.49.575 — Retrospective

**Milestone:** CS25–26 Sweep → GSD Integration
**Closed:** 2026-04-25
**Phases:** 18 (796–813)
**Test delta:** +331 from baseline 27,556 → 27,887

## Through-line

> *"The fox finds the trail by recognizing the seams the deer made walking
> it. The seams were always there. The fox just looks where the path
> is."* — mission package closing quote.

The convergent-discovery framing carried over from v1.49.573 + v1.49.574
and tightened. The CS25–26 sweep is the third successive milestone where
GSD's load-bearing patterns turn out to have been published independently
during the same window we built them. The signal is no longer interesting
because it's surprising; it's interesting because it's stable. Three
milestones in, we can call it a property of the design space rather than a
coincidence.

## What worked

### Parallel fleet dispatch (Wave 1)

The Wave 1 plan dispatched three background subagent fleets — Track A
(M1+M2, 14 papers), Track B (M3+M4, 19 papers), Track C (M5+M6, 21 papers)
— in parallel from the main context. The pattern that v1.49.572 and
v1.49.574 established (engine-uses-subagents memory; one degree per agent;
main context stays lean) extended cleanly to a 3-fleet research dispatch.
Each track produced its own audit log
(`.planning/missions/cs25-26-sweep/work/modules/track-{a,b,c}-audit.md`),
its own ADR set with consistent frontmatter, and its own per-track
bibliography contributions that merged without conflict.

The aggregate Wave 1 wall-clock was bounded by the slowest fleet (Track C,
21 papers) rather than the sum. The compression ratio relative to
sequential execution was approximately 3:1 — same numerical relationship
v1.49.574's Half A achieved with its Track A+B parallelism. The pattern
generalizes.

### T1-only tier-split discipline carrying forward

v1.49.572 established the tier-gated Half B pattern. v1.49.575 doubled
down: 7 ADOPT modules ship as T1; HB-08..HB-12 (5 reviewed candidates)
defer to backlog at milestone-open. The discipline kept the milestone
deliverable. Without it, the temptation to absorb 12 reviewed candidates
in one milestone would have either blown the wall-clock budget or shipped
12 substrates at lower quality each. The 7-module shape is what fit; the
backlog deferral makes the deferred 5 a visible work product, not a
forgotten one.

### Convergent-discovery as keystone narrative

The convergent-discovery report was the strongest piece of writing in the
mission. Naming four anchors (Skills-as-md / GROUNDINGmd / Root-Theorem /
Last-Harness) and walking the architectural rhyme between published
derivation and GSD's grown convention turned the milestone into something
publishable independently of the substrate that landed. The 4,558-word
report would stand on its own as a position paper.

## What was hard

### Intake .tex preamble brokenness

The supplied 123KB intake .tex had pre-existing preamble issues that
broke the first xelatex pass during Phase 804. The diagnosis (missing
biblatex package config, conflicting font-fallback declarations in the
included header) and the manual fix added approximately 1.5 hours to
Phase 804's wall-clock. This is **not** a regression — the brokenness was
inherited from how the intake was generated, not introduced by GSD work.
But it's the kind of friction that compounds: every milestone that takes
externally-generated LaTeX as a starting point will re-pay the same
debugging cost until we standardize on a known-good preamble at the
mission-package generator level.

### M6 paper count discrepancy

A header in some intake materials says "M6 = 13 papers"; the bibliography
in the same intake lists 14 entries under M6's section. We preserved 14
throughout — the bibliography was the source-of-truth and 14 ADRs landed.
The discrepancy is harmless at the artifact level (the count appears in
two places in the intake's prose; we standardized on 14 in our outputs)
but it's a useful tell: the intake-generation pipeline does not
cross-check headers against bibliography, and the discrepancy slipped
through. A v1.49.576+ ticket should add a cross-check.

### Pre-existing math-foundations test failures

Two failures in
`src/mathematical-foundations/__tests__/integration.test.ts` continued to
trip throughout. Per prior STATE memory ("deferred to follow-up") they
are explicitly out-of-scope for v1.49.575. The Phase 813 regression
report (`REGRESSION.md`) documents them again; the fix is likely a
1-line update to the live-config sub-block iterator that skips the
`_comment` metadata key.

## Composition findings

### AEL × Last Harness composition

The most architecturally interesting finding of the milestone, formalized
in convergent-discovery report §5: **HB-04 (Last Harness W/E/E roles)
supplies the per-episode adversarial check; HB-07 (AEL fast/slow bandit)
supplies the cross-episode reflection-bandit. They compose, they don't
collide.**

The W/E/E paper (Last Harness) names what the existing six-step loop
already does. It says nothing about cross-episode policy update — that is
out-of-scope for it. The AEL paper names cross-episode reflection. It
says nothing about per-episode adversarial diagnosis — that is
out-of-scope for it.

The natural composition is HB-07 implementing `EvolutionExtensionPoint`
inside HB-04's Evolution role. HB-04 short-circuits invocation when the
role-split-activation gate is unauthorized; HB-07 emits its own
engagement-CAPCOM gate before mutating its private posterior; HB-04 fires
the protocol-update gate per proposal before activation. This is the
**double-gate semantic** — both authorizations independently required.
The Phase 813 keystone integration test
(`compose-hb04-hb07.test.ts`) verifies all four authorization
quadrants; only (T,T) accepts a bandit-source proposal.

This composition finding was discovered in Wave 1 Track A's audit (HB-04
ADR work surfaced the Evolution-extension shape); formalized in Wave 2's
convergent-discovery report; and shipped as load-bearing Half B
integration in Phase 812.

### CAPCOM HARD GATE pattern compounding

The trigger-vs-auth separation (two distinct marker files; presence of
trigger is "I asked"; non-empty contents of CAPCOM is "it's authorized")
matured through the chain v1.49.574 → HB-03 → HB-04 → HB-07.

- **v1.49.574** introduced the marker-file pattern at HB-04 of the
  megakernel substrate.
- **v1.49.575 HB-03** generalized it to the safety-harness layer.
- **v1.49.575 HB-04** added the conservative-default policy: flag-on +
  no-auth degrades to single-role rather than refusing entirely.
- **v1.49.575 HB-07** added the double-gate semantic: a bandit-source
  policy update requires two independent authorizations.

By Phase 812 the pattern was a copy-paste-with-customization template.
The four primitives (`isCapcomAuthorized` / `isActivationTriggered` /
`emitCapcomGate` / `defaultCapcomMarkerPath`) are the same shape across
all three modules; the differences are field names and the
`CapcomGateReason` enum. A v1.49.576+ extraction into a shared
`src/safety/capcom-gate-utils/` is a candidate refactor — but only after
a fourth gate ships, to ensure the abstraction is grounded in three
diverse use cases plus one stress-test.

## Backlog deferrals (HB-08..HB-12)

Five reviewed-and-deferred candidates. Each deferral has a stated
trigger condition for promotion to T1 in v1.49.576+:

- **HB-08 AGS/RPS chipset divergence metrics** (`2604.21255`) — promote
  when chipset measurement work surfaces a need to quantify per-chipset
  drift.
- **HB-09 DryRUN test-synthesis path** (`2604.21598`) — promote when
  HB-05's structural-completeness linter starts producing false negatives
  at sufficient rate that automated test-synthesis closes the gap.
- **HB-10 IRAP 5-round elicitation cap** (`2604.21380`) — promote when
  vision-to-mission elicitation friction exceeds the 5-round threshold in
  observed missions.
- **HB-11 Black-Box Skill Stealing threat model** (`2604.21829`) —
  promote when DoltHub federated skill economy lands.
- **HB-12 FSFM 4-class forgetting taxonomy** (`2604.20300`) — promote
  when bounded-learning policy is ready for a formalized
  forgetting-taxonomy upgrade.

None of these have a hard deadline; the v1.49.576 milestone-open will
re-review against the (then-current) state of dev.

## Convergent-discovery as external validation

Four independent peer-reviewed works arrived at GSD's load-bearing
patterns from four problem domains. The calibration is **design-discipline
level, not theorem level**. The published derivations are not formally
equivalent to GSD's field-grown conventions. What they share is a
discipline:

- Skills-as-md = the three-tier separation of LLM intent extraction
  (semantic) / deterministic transformation (gate-able) / domain-expert
  authoring (markdown). Same separation as vision-to-mission /
  research-mission-generator / skill-creator. Different vocabulary, same
  structural commitment.
- GROUNDINGmd = Hard Constraints (refusable) / Convention Parameters
  (typed-overridable) two-class taxonomy. Same as CLAUDE.md +
  Safety Warden BLOCK. Different framing, same structural defence
  against prompt-injection.
- Root Theorem = bounded-tape as a derived consequence, not a heuristic.
  Same conclusion as the GSD bounded-learning caps (20% / 3-correction /
  7-day cooldown). Different proof, same operational consequence.
- Last Harness = Worker / Evaluator / Evolution role split. Same
  three-role structure as the existing skill-creator six-step loop.
  Different vocabulary, same role boundaries.

We are not claiming we built it first or that we built it best. We are
claiming the patterns are recoverable from outside, by people who never
spoke to us. That is what convergent discovery means as a calibration
signal — design-discipline level, three milestones running.

## Per-phase wall-clock notes

Aggregate wall-clock by wave (approximate, from dispatched-agent task
durations where available):

- **Wave 0 Foundation** (Phase 796): ~1.3 hours single-context (Haiku
  tier).
- **Wave 1 Parallel research** (Phases 797–800): ~6.2 hours wall-clock,
  bounded by Track C (21 papers, M5+M6); aggregate compute ~18 hours
  across three concurrent fleets.
- **Wave 2 Synthesis** (Phases 801–803): ~3.1 hours sequential, Opus-heavy.
- **Wave 3 Publication + verify** (Phases 804–805): ~2.4 hours, including
  the .tex preamble fix.
- **Half B substrate** (Phases 806–812): ~5.5 hours across 7 modules,
  parallelized where module dependencies allowed (HB-01..HB-03
  independent; HB-04 before HB-07; HB-05 + HB-06 parallel).
- **Phase 813 closing wave** (this report): ~0.8 hours.

Total milestone wall-clock: ~19.3 hours across 18 phases. The Wave 1
parallel fleet contributed the largest single wall-clock saving (~12
hours saved relative to sequential execution).

## Forward citations to v1.49.576+

What v1.49.576+ should pick up from this milestone:

1. **HB-08..HB-12** — five reviewed-and-deferred candidates with stated
   promotion triggers. Re-review at milestone-open.
2. **CAPCOM gate utilities extraction** — after a fourth CAPCOM HARD
   GATE ships (v1.49.576+ candidate: HB-11 Black-Box Skill Stealing
   threat model would naturally take a CAPCOM gate), extract the four
   primitives into `src/safety/capcom-gate-utils/`. Three uses in
   v1.49.575 + a fourth in v1.49.576 = the abstraction is grounded.
3. **Math-foundations live-config test fix** — 1-line iterator fix to
   skip `_comment` metadata. Carry-forward from v1.49.572.
4. **Intake-generator preamble standardization** — every milestone that
   takes externally-generated .tex re-pays the preamble-debugging tax.
   A standard known-good preamble at the mission-package generator level
   would close this loop.
5. **Intake-generator header / bibliography cross-check** — the M6
   "13 vs 14" discrepancy is a pipeline tell; cross-check headers
   against bibliography to catch it at intake-time.
6. **HB-06 ambiguity-lint sensitivity tightening** — the v1.49.575
   calibration ships with zero false positives on 46 in-tree skills.
   Tightening could surface true positives but risks FP regression;
   v1.49.576+ work item.
7. **Phase 813 closing-wave template** — this milestone's closing wave
   produced 4 integration tests + regression report + 7 user guides +
   README + retrospective, all per-spec. The shape is reusable for
   v1.49.576+ closing waves.

## Dedications

(Mirrors `README.md`.)

- **Anthropic Claude Opus 4.7** sweep reviewer (the source review that
  filtered 930 → 54 papers).
- **Skills-as-md authors** (`2604.21910`).
- **GROUNDINGmd authors** (`2604.21744`).
- **Root Theorem author** (`2604.20874`).
- **Last Harness authors** (`2604.21003`).
- **Tool Attention authors** (`2604.21816`).
- **AgentDoG authors** (`2601.18491`).

## Closing

> *The seams were always there. The fox just looks where the path is.*

Three milestones of convergent-discovery validation. The next mission
opens against whatever surfaces in the dev branch state at the moment of
opening; the closing wave's job is done. The fox sleeps now, and the
deer keep walking.
