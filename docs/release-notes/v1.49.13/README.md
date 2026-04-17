# v1.49.13 — Skill Usage Telemetry & Adaptive Pipeline

**Released:** 2026-03-03
**Scope:** telemetry + adaptive feedback layer wired into the skill application pipeline — event emission, pattern detection, bounded score adjustment, cache promotion, digest integration
**Branch:** dev → main
**Tag:** v1.49.13 (merge `f23139b4e`)
**Commits:** `v1.49.12..v1.49.13` (33 commits, head `f23139b4e`)
**Files changed:** 24 (+3,625 / −6)
**Predecessor:** v1.49.12 — Heritage Skills Educational Pack
**Successor:** v1.49.14
**Classification:** feature — subsystem addition (new `src/telemetry/` module plus pipeline stage wiring)
**Phases covered:** 40–43 (4 phases, 10 plans) — EMIT / PTRN / ADAPT / INTG
**Verification:** 102 new telemetry tests · end-to-end pipeline integration tests · retention-pruning tests · privacy-enforcement tests (no user content in any event shape) · `sc:digest` Step 4.5 wired and executing

## Summary

**Telemetry ships as a normal pipeline stage, not a sidecar.** The `TelemetryStage` lives in `src/telemetry/telemetry-stage.ts` and runs as the final stage of `SkillApplicator` — wired in at commit `80e9eecd1`. That placement is deliberate. Every other application stage (score, budget, load, resolve) already carries a `PipelineContext`; the new `sessionId` field on that context (`098ac13c8`) lets every upstream decision be correlated to the session that made it without adding a new bus or side-channel. A telemetry sidecar would have required duplicating context plumbing; the stage form reuses what the pipeline already has. Four `UsageEvent` variants (`skill-scored`, `skill-budget-skipped`, `skill-loaded`, `skill-correction`) are defined as a discriminated union in `src/telemetry/types.ts`, so every consumer downstream of the `EventStore` can switch on `type` and get exhaustive narrowing from the compiler rather than runtime schema checks.

**Privacy is a type-level invariant, not a review-time guideline.** The comment at the top of `src/telemetry/types.ts` is terse for a reason: "NO user content in any event type. Only skill names, scores, token counts, and session IDs are recorded." The event interfaces literally cannot carry user content because the fields don't exist in the union — `SkillScoredEvent` has `skillName`, `score`, `matchType`, `sessionId`, `timestamp`, full stop. A future contributor who wants to add a prompt snippet or tool argument would need to edit `types.ts`, which pops the reviewer's attention at exactly the right moment. The `event-store.test.ts` privacy tests (`1c1f547be`) exercise malformed JSONL lines, rotation under size pressure, and the explicit assertion that appended records never contain a string resembling prompt text. The constraint is encoded in three places — type definitions, store-level privacy tests, and the 90-day retention job — so the system can't silently drift into logging content.

**Bounded ±20% score adjustment is the safety limit on the adaptive loop.** `ScoreAdjuster` in `src/telemetry/score-adjuster.ts` takes a `PatternReport` and applies at most a ×1.20 boost to skills flagged `high-value` and at most a ×0.80 dampening to skills flagged `dead`. Everything else gets multiplier 1.0. The bound is on the ScoreAdjuster, not on the scores themselves — `[0, 1]` clamping still runs after the multiplier — so a skill that is already saturated at 1.0 can't be boosted above 1.0, and a skill at 0.05 can't be dampened below 0.04. This matches v1.0's Learn-step philosophy (`≥ 3 corrections, ≥ 7-day cooldown, ≤ 20% max change per refinement`) and extends it: the Learn step operates on skill definitions, the ScoreAdjuster operates on scored candidates before budget admission. Same bound, different place in the pipeline, same reason — convergence under sustained evidence, no one-shot reweighting.

**Seven patterns, each tied to one remediation.** `UsagePatternDetector` in `src/telemetry/usage-pattern-detector.ts` emits exactly seven pattern kinds and every one of them maps to a concrete action: `high-value` → boost + cache promote, `dead` → dampen + suggest prune, `load-never-activate` → budget demote, `correction-magnet` → surface to `sc:digest` for author review, `score-drift` → annotate in adaptive suggestions, `budget-casualty` → re-rank under `BudgetStage` priority, `co-activation` → compose candidate for future agent synthesis. A pattern without a remediation is noise; the seven-pattern set is the minimal closure under "signal we can act on." The detector also separates `SkillCorrectionEvent` detection (PTRN-04/05/06 added in `144f7d624`) from scored-event detection, because corrections are rarer and require cross-event correlation rather than per-event classification.

**BudgetStage learned a new priority axis without a new sort key.** Commit `8808ddd65` extended `src/application/stages/budget-stage.ts` with high-value skill prioritization. The stage still sorts by score first — that contract is preserved — but when two skills tie on score and both fit the remaining budget, the one flagged `high-value` by the pattern report wins. When both fit but only one fits the remaining budget, the high-value one is admitted. The ordering tests in `budget-stage.test.ts` (added at `2cf790407`) pin the new semantics so a future refactor can't silently downgrade the high-value signal to a tiebreaker that disappears when scores are close but unequal.

**Integration into `sc:digest` Step 4.5 means usage analysis surfaces at the natural cadence.** Rather than minting a new command (`sc:telemetry`, `sc:usage`, or similar), commit `489ac2935` added the Usage Pattern Analysis section to `.claude/commands/sc/digest.md` as Step 4.5 — slotted between the existing pattern-extraction and decision-surfacing steps. A user running `sc:digest` at the end of a session gets telemetry-derived suggestions in the same report that carries everything else they expect. `AdaptiveSuggestions` (`c97b2d376`) renders two formatters — `prune` and `promote` — so the suggestions read as actionable items ("consider pruning `X` — loaded 8×, activated 0×") rather than raw pattern output.

**Ninety-day retention is enforced in code, not in a cron.** `TelemetryStage` calls `EventStore.pruneOlderThan()` on a time-based threshold (`b1e68107b`), and the prune test suite (`de72f8a27`) exercises boundary conditions — exactly-90-days, 89-days-old, 91-days-old, timezone-edge records. A retention policy that depends on an external cron is a retention policy that silently breaks when the cron fails; running it from the stage itself means any session that executes the pipeline also enforces retention. The 90-day window is a guess — explicitly acknowledged in the retrospective — but the guess is contained in one constant, not scattered across schedules and dashboards, so tuning it is a one-line change.

**CachePromoter closes the loop between observation and optimization.** `src/telemetry/cache-promoter.ts` (`98d9cb793`) reads the pattern report and promotes `high-value` skills to the warm cache tier without requiring developer intervention. The promotion is idempotent (re-running on the same report doesn't double-promote) and reversible (if a subsequent report flags the skill `dead`, the next ScoreAdjuster cycle will dampen it and the cache will eventually evict). The pattern is the same bounded-feedback shape as ScoreAdjuster: promotion happens because evidence says it should, not because a human said so, and the evidence has to be consistent enough to pass the detector thresholds.

**Total telemetry surface is 2,892 lines across thirteen files.** Eight source files (`types.ts` 194, `event-store.ts` 144, `telemetry-stage.ts` 94, `adaptive-suggestions.ts` 103, `cache-promoter.ts` 82, `score-adjuster.ts` 77, `usage-pattern-detector.ts` 230, `index.ts` 17) plus five test files (`event-store.test.ts` 291, `telemetry-stage.test.ts` 194, `usage-pattern-detector.test.ts` 728, `score-adjuster.test.ts` 192, `cache-promoter.test.ts` 166, `adaptive-suggestions.test.ts` 211). Test-to-source ratio is roughly 2.2:1 because the detector is the most adversarial surface — 728 test lines cover seven patterns, event-window boundaries, session-correlation edge cases, malformed events, empty stores, and all combinations of the pattern kinds.

**The Skill Applicator gains a final stage without perturbing upstream behavior.** `SkillApplicator` accepts the telemetry stage as the last stage in its constructor pipeline. Every upstream stage still returns the same result types; the telemetry stage is pass-through for the `ScoredSkill[]` it receives (emits events as a side effect, returns the input unchanged). This matches v1.49.12's additive discipline — new capability plugs in, existing behavior is unchanged, no caller has to change how it invokes the applicator unless it wants to read events back.

## Key Features

| Area | What Shipped |
|------|--------------|
| Event types | `src/telemetry/types.ts` — discriminated union `UsageEvent` with four variants (`SkillScoredEvent`, `SkillBudgetSkippedEvent`, `SkillLoadedEvent`, `SkillCorrectionEvent`), `PatternReport`, `EventStoreConfig` |
| EventStore | `src/telemetry/event-store.ts` — append-only JSONL store with rotation, malformed-line skip, `pruneOlderThan(days)`; 291 test lines in `event-store.test.ts` covering rotation, privacy, malformed input, retention |
| TelemetryStage | `src/telemetry/telemetry-stage.ts` — final stage of `SkillApplicator`, emits all four event variants from a single `PipelineContext`; 194 test lines, 12+ test cases |
| Session correlation | `src/application/skill-pipeline.ts` — new `sessionId` field on `PipelineContext`, propagates through every stage, lets events be grouped into sessions without a separate tracker (`098ac13c8`) |
| UsagePatternDetector | `src/telemetry/usage-pattern-detector.ts` — 230 lines detecting seven patterns: `high-value`, `dead`, `load-never-activate`, `correction-magnet`, `score-drift`, `budget-casualty`, `co-activation`; 728 test lines across two phases of additions (`0ecf3ae8f`, `144f7d624`) |
| ScoreAdjuster | `src/telemetry/score-adjuster.ts` — ±20% bounded multipliers, defaults `boostFactor=0.20` / `dampenFactor=0.20`, clamps to `[0, 1]` post-multiplier (`be06ad765`) |
| BudgetStage priority | `src/application/stages/budget-stage.ts` — high-value skills win ties and win contested admission when budget is tight; `ADAPT-05` ordering tests at `2cf790407` |
| CachePromoter | `src/telemetry/cache-promoter.ts` — idempotent warm-tier promotion driven by `PatternReport`; 166-line test suite (`98d9cb793`) |
| AdaptiveSuggestions | `src/telemetry/adaptive-suggestions.ts` — two formatters (`prune`, `promote`) rendering human-readable recommendations; 211-line test suite |
| `sc:digest` integration | `.claude/commands/sc/digest.md` — new Step 4.5 "Usage Pattern Analysis" section wired into the existing digest workflow (`489ac2935`) |
| 90-day retention | `TelemetryStage` calls `EventStore.pruneOlderThan()` with 90-day threshold (`363256814`, `b1e68107b`); boundary-condition tests in `de72f8a27` |
| Privacy posture | Type union forbids user content at the type level; `event-store.test.ts` asserts no prompt-text leakage; three-place enforcement (types + tests + retention) |
| Pipeline wiring | `SkillApplicator` gains a final telemetry stage at commit `80e9eecd1`; `ScoreAdjuster` wired before resolve stage at `c88709504` |
| End-to-end tests | `skill-applicator-telemetry.test.ts` covers full pipeline from scoring through event persistence (`9855cf796`) |
| Barrel exports | `src/telemetry/index.ts` — single entry-point exporting `TelemetryStage`, `UsagePatternDetector`, `PatternReport`, `ScoreAdjuster`, `AdaptiveSuggestions`, `SkillCorrectionEvent`, `EventStore`, `EventStoreConfig` |
| Version bump | `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` all bumped to 1.49.13 (`8b9208d58`) |

## Retrospective

### What Worked

- **Stage-shaped telemetry reused existing pipeline plumbing.** Making `TelemetryStage` a normal stage of `SkillApplicator` meant the new `sessionId` on `PipelineContext` did double duty — correlation for events and an additive field every existing stage could carry without changes. A sidecar would have required a parallel context bus.
- **Seven patterns with 1:1 remediation mappings.** `high-value → boost + promote`, `dead → dampen + prune`, `load-never-activate → demote`, `correction-magnet → author review`, `score-drift → annotate`, `budget-casualty → re-rank`, `co-activation → future compose` — every detected pattern resolves to exactly one action. Patterns without a remediation were considered and rejected.
- **Bounded ±20% adjustment matches v1.0's bounded-learning philosophy.** The same bound that caps refinement changes in the Learn step caps score adjustments in the adaptive stage, so the whole system converges under sustained evidence rather than single-event reweighting.
- **Privacy is a type invariant.** `UsageEvent` cannot carry user content because the union members have no fields for it. Any future expansion surfaces at PR time as a `types.ts` diff, which is exactly where cultural and legal review should happen.
- **Integration into `sc:digest` Step 4.5 avoided command proliferation.** The telemetry pipeline augmented an existing workflow instead of adding `sc:telemetry` or `sc:usage` as a new user-visible surface. Users get the analysis at the cadence they already run.
- **Retention runs inside the stage, not outside it.** 90-day pruning executes as part of `TelemetryStage`, so any session that executes the pipeline also enforces retention. No external cron to forget.

### What Could Be Better

- **102 tests against synthetic data, not production telemetry.** The detector is well-exercised against constructed event streams but has not yet processed real session data at scale. The seven patterns were chosen by anticipating the signals we would want to act on, not by observing what signals real sessions produce.
- **90-day retention is a guess.** Seasonal pattern detection conceptually needs a full season of history, but whether 90 days is the right window depends on project cadence, which varies by user. The value lives in one constant so tuning is cheap, but the initial pick is not evidence-grounded yet.
- **CachePromoter has no feedback from cache-hit telemetry.** It promotes based on pattern reports but doesn't yet observe whether the promotion delivered the expected latency benefit. A cache-hit counter would let the adaptive loop close on cache effectiveness the same way it closes on score effectiveness.
- **`co-activation` pattern detection ships but the Compose step doesn't consume it yet.** Detection is in place; the follow-on work of having `src/compose/` ingest co-activation reports to synthesize agents is future work.
- **ScoreAdjuster defaults are fixed constants, not configuration.** The pipeline always uses the ±20% defaults. When usage data suggests asymmetric bounds are correct (for example, dampening should be harder than boosting), the configuration surface exists but the wiring to change the defaults through deployment config is not in place.

## Lessons Learned

- **Append-only JSONL is the right persistence pattern for event streams.** Same primitive as `.planning/patterns/` — simple, auditable, no schema migrations, crash-safe with `fs.appendFile`. The v1.49.14 health log will use the same shape.
- **Telemetry patterns should map 1:1 to remediation actions.** A detected pattern without a concrete "what to do about it" is noise, not signal. The seven-pattern set is valuable because each triggers a specific response; rejecting observation-only patterns kept the set small and actionable.
- **Bounded feedback loops are essential for self-improving systems.** The ±20% per-cycle cap prevents oscillation and ensures convergence requires sustained evidence, not a single outlier. This is the same philosophy v1.0 encoded in the Learn step and v1.49.13 extends to the apply-time adjustment surface.
- **Encode privacy in the type system, not the review checklist.** A discriminated union whose members lack user-content fields makes "no user content" a compile-time property. Future contributors hit the constraint at the type signature, not at PR review.
- **Integration over proliferation.** Adding Step 4.5 to `sc:digest` surfaced the new analysis inside an existing user-facing command rather than inventing a new one. The cognitive cost to users is zero; the cognitive cost of discovering `sc:telemetry` would have been non-zero forever.
- **Reuse context fields to carry correlation.** `sessionId` on `PipelineContext` is a two-line addition that turns every existing stage into an event-correlation participant without any stage knowing about telemetry. Correlation plumbing is usually much more invasive than this.
- **Enforce retention from inside the system that produced the data.** `TelemetryStage` runs `pruneOlderThan()` as part of its own work, so any run of the pipeline also runs retention. An external cron can fail silently; an inline prune cannot.
- **Tests outnumber source 2:1 when the surface is adversarial.** The detector is the highest-risk module because its output steers the adaptive loop, so 728 test lines for 230 source lines is the right ratio. Ratios only get lopsided like this when the function is load-bearing and the input space is combinatoric.
- **Tie-breaking is a semantic choice, not a comparator detail.** `BudgetStage` admitting the high-value skill on a score tie is a contract worth pinning with tests — if a future refactor flattens the comparator, the adaptive signal silently disappears, and the tests at `2cf790407` catch that regression at commit time.
- **Additive subsystems let large milestones ship without rework.** `src/telemetry/` is a new directory; nothing existing had to change shape. The pipeline gained a final stage, a context field, and a budget-stage tiebreaker — all additive extensions of interfaces that were already there.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.12](../v1.49.12/) | Predecessor — Heritage Skills Educational Pack (the warden architecture and mission-pack staging this release builds alongside) |
| [v1.49.14](../v1.49.14/) | Successor — continues the v1.49.x line, reuses the append-only JSONL pattern for the health log noted in chapter 04 |
| [v1.49.11](../v1.49.11/) | Two releases back — gsd-init Hardening, last release before the heritage and telemetry arcs began |
| [v1.49.0](../v1.49.0/) | Parent mega-release — GSD-OS foundation that the `sc:digest` command (extended here with Step 4.5) ships within |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; ±20% bounded-learning philosophy extended here from the Learn step to the apply-time ScoreAdjuster |
| [v1.5](../v1.5/) | Pattern Discovery — precedent for pattern-detection-as-feature; v1.49.13's `UsagePatternDetector` is its telemetry-era counterpart |
| [v1.8](../v1.8/) | Capability-Aware Planning — extends the Compose step, which is the downstream consumer for `co-activation` patterns detected here |
| [v1.25](../v1.25/) | Ecosystem Integration — dependency DAG pattern the telemetry barrel at `src/telemetry/index.ts` follows |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — angular promotion pipeline, conceptual sibling of the CachePromoter surface |
| `src/telemetry/types.ts` | Discriminated union of `UsageEvent` variants — privacy invariant lives here |
| `src/telemetry/usage-pattern-detector.ts` | Seven-pattern detector (230 lines) |
| `src/telemetry/score-adjuster.ts` | ±20% bounded multipliers |
| `src/telemetry/telemetry-stage.ts` | Final pipeline stage, calls `EventStore.pruneOlderThan()` for 90-day retention |
| `src/telemetry/cache-promoter.ts` | Idempotent warm-tier promotion from pattern reports |
| `src/telemetry/adaptive-suggestions.ts` | `prune` and `promote` formatters for `sc:digest` Step 4.5 |
| `src/application/skill-applicator.ts` | Applicator that wires the telemetry stage in at commit `80e9eecd1` |
| `src/application/stages/budget-stage.ts` | BudgetStage with the high-value tiebreaker added at `8808ddd65` |
| `.claude/commands/sc/digest.md` | Step 4.5 Usage Pattern Analysis |
| `chapter/03-retrospective.md` | Chapter retrospective — What Worked / What Could Be Better |
| `chapter/04-lessons.md` | Five extracted lessons (append-only JSONL, 1:1 remediation mapping, bounded feedback, synthetic-vs-production test coverage, retention-window guess) |
| `.planning/patterns/` | Append-only JSONL precedent from v1.0 that this release reuses |

## Engine Position

v1.49.13 is the first release in the v1.49.x line to add a fully stage-shaped, privacy-typed, bounded-feedback telemetry subsystem to the skill application pipeline. It lands immediately after v1.49.12's heritage-skills milestone and sits at a turning point: v1.49.0–v1.49.12 largely built new user-facing surfaces (GSD-OS desktop, mission packs, heritage rooms, warden architecture), while v1.49.13 turns inward and begins instrumenting the skill system so later releases can make evidence-grounded decisions rather than author-guessed ones. Three reusable patterns emerge. First, the stage-shaped telemetry pattern — any future observation subsystem that needs session correlation can plug into `PipelineContext.sessionId` and ride the same pipeline as a final stage, without new buses. Second, the privacy-as-type-invariant pattern — any future event schema can lock privacy at compile time by keeping user-content fields out of the union, which is cheaper to enforce and harder to regress than a review checklist. Third, the bounded-feedback pattern — the ±20% limit on ScoreAdjuster is the same invariant v1.0 put on the Learn step, applied at a different point in the pipeline, and v1.49.14's health log is expected to inherit the same append-only-JSONL-with-inline-retention shape. Looking back, this release stands on v1.0's bounded learning, v1.5's pattern-discovery lineage, v1.8's capability-aware composition (the eventual consumer of `co-activation`), and v1.49.0's `sc:digest` command surface. Looking forward, the detector's seven-pattern set is the input for subsequent Compose-step evolution, the CachePromoter is the template for any future tier-promotion surface, and the 90-day retention constant is the first tunable parameter in what will become a broader observation-retention policy for the self-modifying system.

## Files

- `src/telemetry/types.ts` (194 lines) — discriminated union `UsageEvent` with four variants, `PatternReport`, `EventStoreConfig`; privacy invariant lives at the top of this file
- `src/telemetry/event-store.ts` (144 lines) + `event-store.test.ts` (291 lines) — append-only JSONL store with rotation, malformed-line skip, `pruneOlderThan(days)`; privacy and retention tests
- `src/telemetry/telemetry-stage.ts` (94 lines) + `telemetry-stage.test.ts` (194 lines) — final stage of `SkillApplicator`, emits all four event variants, runs retention inline
- `src/telemetry/usage-pattern-detector.ts` (230 lines) + `usage-pattern-detector.test.ts` (728 lines) — seven-pattern detector; 2.2:1 tests-to-source reflects adversarial input space
- `src/telemetry/score-adjuster.ts` (77 lines) + `score-adjuster.test.ts` (192 lines) — ±20% bounded multipliers, clamped to `[0, 1]`
- `src/telemetry/cache-promoter.ts` (82 lines) + `cache-promoter.test.ts` (166 lines) — idempotent warm-tier promotion driven by `PatternReport`
- `src/telemetry/adaptive-suggestions.ts` (103 lines) + `adaptive-suggestions.test.ts` (211 lines) — `prune` and `promote` formatters for `sc:digest` Step 4.5
- `src/telemetry/index.ts` (17 lines) — barrel export for the subsystem
- `src/application/skill-applicator.ts` + `skill-applicator-telemetry.test.ts` — wires `TelemetryStage` as the final stage at commit `80e9eecd1`
- `src/application/skill-pipeline.ts` + `skill-pipeline.test.ts` — `sessionId` added to `PipelineContext` at `098ac13c8` for event correlation
- `src/application/stages/budget-stage.ts` (169 lines) + `budget-stage.test.ts` — high-value skill tiebreaker added at `8808ddd65`, ADAPT-05 ordering pinned at `2cf790407`
- `.claude/commands/sc/digest.md` — Step 4.5 Usage Pattern Analysis section added at `489ac2935`
- `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` — version bumped to 1.49.13 at `8b9208d58`

Aggregate: 24 files changed, 3,625 insertions, 6 deletions, 33 commits spanning `v1.49.12..v1.49.13`.
