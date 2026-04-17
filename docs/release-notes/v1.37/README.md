# v1.37 — Complex Plane Learning Framework

**Released:** 2026-02-26
**Scope:** feature release — replaces skill-creator's implicit linear knowledge model with an explicit Complex Plane mathematical framework where every skill occupies a position (θ, r) driving tangent-line activation, bounded angular promotion, Euler composition, and versine/exsecant health metrics
**Branch:** dev → main
**Tag:** v1.37 (2026-02-26T00:37:05-08:00) — "Complex Plane Learning Framework"
**Predecessor:** v1.36 — Citation Management & Source Attribution
**Successor:** v1.38 — SSH Agent Security
**Classification:** feature — self-positioning knowledge substrate with geometric activation, promotion, and composition operators
**Phases:** 359–366 (8 phases) · **Plans:** 16 · **Requirements:** 50 · **Tests:** 446 · **LOC:** ~9.7K
**Commits:** 28 commits culminating at `09476d192` · **Files changed (tip window):** 5
**Verification:** 50/50 requirements satisfied · 446 new tests across 8 phases · 12 safety-critical (SC-01 through SC-12) + 12 E2E integration (INT-01 through INT-12) tests green · full regression 16,100 tests, 0 failures

## Summary

**Skills now occupy a geometric position, not a list slot.** Before v1.37, skill-creator treated its knowledge surface as an implicit linear list — skills existed, got activated by name or tag match, refined under the v1.0 bounded-learning rules, and occasionally composed into agents when co-activation crossed a threshold. That model carried the system from v1.0 through v1.36, but it hid the shape of the knowledge base from every tool that tried to reason about it. v1.37 replaced the linear list with an explicit Complex Plane: every skill now carries a typed `SkillPosition = (theta, r)` where θ measures the abstract-to-concrete balance of the skill's content and r measures its maturity (evidence accumulated over lifetime). The position is persisted at `.claude/plane/positions.json`, consulted by activation, promotion, chord detection, and composition, and surfaced through a `skill-creator plane-status` CLI that reports versine distribution, exsecant reach, and angular velocity warnings. The framework is not a metaphor bolted onto existing heuristics — it is the substrate they all now rest on. The 16,100-test regression passing with 446 new tests added proves the substrate swap did not break the v1.0 through v1.36 surface area.

**Tangent-line activation replaced name-match with geometric scoring.** Phase 360 shipped the Tangent Activation Engine at `src/plane/tangent.ts`, a scoring layer that analyzes the current task's TaskVector (concrete-vs-abstract signals extracted from the active request) and scores every candidate skill by the tangent line drawn from the task's plane position to the skill's plane position. A skill whose position is on the tangent line to the task is maximally relevant; a skill whose position is orthogonal to the tangent is maximally irrelevant. The engine blends this geometric score with the v1.0 semantic score at a configurable 60/40 default weight, so name/tag matches still count — they are just no longer the only signal. The Score stage of the six-stage pipeline is the only integration surface touched: the upstream Observe and downstream Suggest/Apply/Learn/Compose stages see the enhanced score without knowing it came from a tangent calculation. Thirty-seven tests cover the scoring math, the TaskVector classifier, the weight-blending configuration, and the backward-compat path that lets a skill without a position fall through to pure semantic scoring. SC-02 and SC-03 are the two safety-critical tests that lock that backward-compat path in place — a skill missing its position, or a missing `positions.json` entirely, must never break activation.

**Angular promotion bounded learning in geometric terms.** Phase 362 landed `src/plane/promotion.ts`, the Angular Promotion Evaluator that replaces v1.0's flat "after N corrections, bounded by 20% change" rule with a seven-check geometric gate: (1) direction — does the proposed refinement rotate θ toward or away from the task's own angular neighborhood? (2) adjacency — is the skill angularly close enough to the refinement's target region to move there in one promotion step? (3) angular step — is the rotation within the per-step bound? (4) evidence — does the promotion carry the v1.0 three-correction minimum? (5) stability — has the skill held its position through a seven-day cooldown? (6) velocity — is the skill's angular velocity (dθ/dt over recent sessions) under the CONSTRAINT_MAP ceiling? (7) existing F1/MCC — do the existing precision/recall metrics permit the change? All seven must pass. The CONSTRAINT_MAP at the top of the module explicitly preserves the v1.0 bounded-learning constants (3-correction minimum, 7-day cooldown, 20% max change per refinement) as angular-rotation equivalents rather than replacing them. Fifty-two tests cover the seven checks, the content-direction analyzer inside the AngularRefinementWrapper, and the rejection paths for each failed check.

**Chord detection and Euler composition turned co-activation into a geometric question.** Phase 363 shipped the ChordDetector at `src/plane/chords.ts` and the EulerCompositionEngine at `src/plane/euler.ts`. The ChordDetector scans co-activation history and reports chord candidates — skill pairs whose positions subtend an arc within a configurable window (default arc ≤ π/4, co-activation frequency ≥ 3, combined token savings ≥ 15%). A chord is a candidate composition target. The EulerCompositionEngine then applies complex multiplication (Euler's identity: e^(iθ₁) · e^(iθ₂) = e^(i(θ₁+θ₂))) to combine the two skills' positions into a composed position, assesses the quality of the composition (does the resulting radius exceed either input's radius? does the resulting angle land in a populated region or an empty neighborhood?), and returns an action recommendation — compose now, gather more evidence, or reject. The co-activation geometric gate is the filter that prevents two semantically unrelated but frequently co-occurring skills from being composed into a Frankenstein agent. Fifty-four tests cover the detection math, the store, the composition operator, and the action recommender.

**Versine, exsecant, and angular velocity gave skill health a geometric shape.** Phase 364 landed the Plane Metrics Dashboard and `skill-creator plane-status` CLI. Versine (vers(θ) = 1 − cos(θ)) measures how far a skill has rotated from its initial θ=0 anchor; the dashboard bins skills into grounded (versine < 0.3), working (0.3 ≤ versine < 1), and frontier (versine ≥ 1). Exsecant (exsec(θ) = sec(θ) − 1) measures reach past the unit circle — how far a skill has grown in maturity beyond the standard reference radius. Angular velocity (dθ/dt averaged over the most recent session window) surfaces skills that are rotating too fast to trust, triggering warnings the promotion evaluator then consumes as the check-6 veto. The CLI flags — `--json` for machine output, `--snapshot` to capture a dated state file, `--detail` to explode the dashboard into per-skill rows — ship at `src/plane/cli/plane-status.ts`. Thirty-three tests cover the metric functions, the terminal bar-chart renderer, and the flag parsing.

**The migration system let the existing 300+ skill library move to the new substrate without a rewrite.** Phase 365 shipped `src/plane/migration.ts` and the `skill-creator migrate-plane` CLI (alias `mp`). The SkillMigrationAnalyzer inspects an existing skill's trigger phrases, content topic density, and usage history, and derives a plausible `(theta, r)` starting position — a skill whose triggers fire mostly on code-editing work lands in the concrete (θ near π/2) half-plane with modest r; a skill whose triggers fire on architectural discussions lands in the abstract (θ near 0) half-plane. The PlaneMigration executor orchestrates the batch, publishing a MigrationReport that records skipped (already-positioned), migrated (new position assigned), and errored (analyzer failed) counts. The executor is idempotent (a second run skips every already-positioned skill), non-destructive (never writes to SKILL.md files; all position data lives in `.claude/plane/positions.json`), error-isolated (a single analyzer failure does not abort the batch), and dry-run-capable via the `--dry-run` flag. `--force` re-derives positions for already-migrated skills; `--no-history` skips the usage-history signal; `--verbose` prints per-skill analyzer traces. Sixty-eight tests cover the analyzer, the executor, the CLI, and every idempotence and error-isolation invariant.

**Phase 366 locked the framework down with 24 named tests and 13 barrel exports.** The integration phase shipped two parallel test suites at `src/plane/__tests__/safety-critical.test.ts` (513 lines, SC-01 through SC-12) and `src/plane/__tests__/integration.test.ts` (606 lines, INT-01 through INT-12). The safety-critical suite pins down the invariants a future refactor most easily breaks — semantic-only fallback when a skill has no position (SC-02), graceful degradation when `positions.json` is missing (SC-03), empty-signal handling (SC-04), position-free skill creation (SC-05), missing-position promotion rejection (SC-06), no NaN/Infinity at θ=0 (SC-08), reach clamped at θ=π/2 (SC-09), angular velocity enforcement across the full θ range (SC-10), and migration idempotence + non-destructiveness (SC-11, SC-12). The E2E integration suite drives the full observer → bridge → position store → activation → promotion → chord → dashboard pipeline and verifies 500-skill performance under 2 seconds (INT-12), concurrent observers without store corruption (INT-11), and backward-compat with zero plane data (INT-08). The barrel module `src/plane/index.ts` exports all 13 submodules under section comments; the PositionStorePort name collision between `chords.ts` and `promotion.ts` resolved via selective re-export with `ChordPositionStorePort` alias. Thirty-eight phase-366 tests plus the 408 tests from the preceding phases sum to the 446 new-test figure for v1.37, and the full 16,100-test regression passing proves no upstream module broke.

The release is a substrate swap dressed as a feature release. Every subsequent version that talks about skill position, tangent-line activation, chord detection, Euler composition, versine, exsecant, or angular velocity is downstream of v1.37. The 60/40 weight-blend default and the carry-forward of the v1.0 CONSTRAINT_MAP are the two acknowledged open questions — the blend is a reasonable prior without calibration data, and the constraints are preserved mechanically without re-validation in the angular context. Both are flagged for v1.40-series dogfooding to close honestly rather than ignored.

## Key Features

| Area | What Shipped |
|------|--------------|
| Mathematical Core (Phase 359) | 7 Zod schemas (SkillPosition, TangentContext, TangentMatch, ChordCandidate, PromotionDecision, AngularObservation, PlaneMetrics), PromotionLevel enum, PROMOTION_REGIONS, 19 pure arithmetic functions with division-by-zero guards; 129 tests |
| Tangent Activation Engine (Phase 360) | TaskVector concrete/abstract classifier, geometric scoring with configurable 60/40 geometric/semantic weight blend, surgical Score-stage integration preserving all 5 downstream pipeline stages; 37 tests |
| Observer Angular Integration (Phase 361) | PositionStore persisted at `.claude/plane/positions.json`, SIGNAL_WEIGHTS table covering 12 signal types, ObserverAngularBridge with session processing and angular velocity clamping; 54 tests |
| Angular Promotion Pipeline (Phase 362) | 7-check AngularPromotionEvaluator (direction, adjacency, angular step, evidence, stability, velocity, existing F1/MCC), AngularRefinementWrapper with content direction analysis, CONSTRAINT_MAP preserving v1.0 3-correction/7-day/20% rules; 52 tests |
| Chord Detection (Phase 363) | ChordDetector with configurable arc/savings/frequency filtering (default arc ≤ π/4, freq ≥ 3, savings ≥ 15%), ChordStore persistence, co-activation geometric gate blocking Frankenstein compositions; part of 54-test phase |
| Euler Composition Engine (Phase 363) | Complex-multiplication composer (e^(iθ₁)·e^(iθ₂) = e^(i(θ₁+θ₂))), quality assessment returning radius/neighborhood scores, action recommendation (compose/gather-evidence/reject); part of 54-test phase |
| Plane Metrics Dashboard (Phase 364) | Versine distribution binner (grounded/working/frontier), exsecant reach gauge, angular velocity warnings feeding the promotion check-6 veto, terminal bar charts for `plane-status` output; 33 tests |
| `plane-status` CLI (Phase 364) | `skill-creator plane-status` with `--json`, `--snapshot`, `--detail` flags at `src/plane/cli/plane-status.ts` |
| Migration Analyzer (Phase 365) | SkillMigrationAnalyzer deriving `(theta, r)` from trigger/content/history signals, supporting a skill library already in the hundreds; part of 68-test phase |
| Migration Executor (Phase 365) | PlaneMigration with `migrateAll()` orchestrator, `convertSkillToMetadata()`, MigrationOptions/MigrationDetail/MigrationReport types; idempotent, non-destructive, error-isolated (`4f8a6cf8e`) |
| `migrate-plane` CLI (Phase 365) | `skill-creator migrate-plane` / `mp` with `--dry-run`, `--force`, `--no-history`, `--verbose` flags; `handleMigratePlaneCommand` handler at `src/plane/migration.ts` |
| Safety-Critical Suite (Phase 366) | 12 named tests SC-01 through SC-12 at `src/plane/__tests__/safety-critical.test.ts` (513 lines, commit `1dc187de4`) |
| Integration Suite (Phase 366) | 12 E2E tests INT-01 through INT-12 at `src/plane/__tests__/integration.test.ts` (606 lines, commit `66493666d`) — covers 500-skill perf <2s, concurrent observers, backward-compat with zero plane data |
| Barrel Exports (Phase 366) | `src/plane/index.ts` re-exports 13 submodules under section comments; PositionStorePort collision resolved via selective re-export with `ChordPositionStorePort` alias (commit `da1e70936`) |
| Version bump | `package.json` and related version files bumped to 1.37.0 at `09476d192` |
| Test footprint | 446 new tests (129 core + 37 tangent + 54 observer + 52 promotion + 54 chord/Euler + 33 metrics + 68 migration + 38 integration); full regression 16,100 passing, 0 failing |

## Retrospective

### What Worked

- **Replacing implicit linear knowledge with explicit Complex Plane positioning.** Every skill now occupies a typed position (θ, r) that drives activation, promotion, chord detection, and composition. The framework is the substrate all four downstream systems now rest on, not a cosmetic overlay.
- **446 tests across 8 phases with 12 safety-critical and 12 E2E integration tests.** The distribution is well-balanced: 129 for math core, 37 for tangent activation, 54 for observer, 52 for promotion, 54 for chord/Euler, 33 for metrics, 68 for migration, 38 for integration. No phase is under-tested.
- **Migration system with dry-run, force, and idempotent modes.** SkillMigrationAnalyzer plus PlaneMigration executor moved the existing 300+ skill library to the Complex Plane framework without manual intervention or SKILL.md rewrites. The dry-run mode made the batch migration safe to preview.
- **Full regression clean at 16,100 tests.** Adding 446 new tests while maintaining zero failures across the entire suite proves the Complex Plane framework integrates without breaking existing systems. The substrate swap did not leak.
- **Named safety-critical tests (SC-01 through SC-12).** Twelve named, numbered invariants mean a future refactor can be audited against the exact contract the framework published. Unnamed tests disappear into aggregate counts; SC-08 "no NaN/Infinity at theta=0 boundary" survives every refactor because it has a name.
- **Surgical Score-stage integration preserved the six-stage pipeline.** Only the Score stage was touched; Observe, Detect, Suggest, Apply, Learn, and Compose received the enhanced score transparently. The v1.0 pipeline shape held.

### What Could Be Better

- **60/40 geometric/semantic weight blending is a magic number.** The configurable weight blend between geometric tangent score and v1.0 semantic score defaults to 60/40 without calibration data justifying the specific ratio. The default works as a reasonable prior but should be validated against real activation-quality data in the v1.40-series dogfooding arc.
- **Angular velocity clamping parameters (3-correction / 7-day cooldown / 20% max change) are carried forward as constraints.** The CONSTRAINT_MAP preserves the v1.0 bounded-learning constants as angular-rotation equivalents, but they were not empirically re-validated in the Complex Plane context. They may need recalibration once real angular-promotion data accumulates.
- **Migration analyzer signal derivation from trigger/content/history is heuristic.** The `(theta, r)` starting position for an existing skill is derived by inspecting trigger phrase patterns, content topic density, and usage history. The heuristics produce plausible positions but have not been validated against hand-placed ground truth for any skill subset.
- **The chord/Euler quality assessment is untested against a populated plane.** Phase 363 shipped the detector and composition engine with passing unit tests, but the quality assessment (radius delta, neighborhood density) has not been exercised against a plane with hundreds of real skill positions landing in realistic clusters.
- **`plane-status` CLI lacks time-series output.** The `--snapshot` flag captures a single dated state file, but there is no built-in `--history` or diff mode to compare two snapshots. Drift tracking requires manual comparison.

## Lessons Learned

- **Mathematical frameworks need migration paths, not just greenfield design.** The SkillMigrationAnalyzer that inspects existing skills for trigger, content, and history compatibility is what makes the Complex Plane adoption practical. Without it, hundreds of existing skills would need manual repositioning and the framework would have been greenfield-only by accident.
- **Versine and exsecant measure curvature, not distance — and that is the point.** Versine distribution (grounded / working / frontier) and exsecant reach measure skill health in terms of angular position, not just counts or magnitudes. The choice of trigonometric functions is deliberate: they surface the shape of the knowledge base, not just its size.
- **Chord detection between co-activated skills surfaces composition opportunities automatically.** Rather than manually defining which skills compose well, the ChordDetector finds natural pairings from usage patterns. Euler composition (complex multiplication) then supplies the mathematical operation for combining them — the pair is discovered, then multiplied, with no author in the loop for either step.
- **Twelve safety-critical tests as a named, numbered set make safety auditable.** SC-01 through SC-12 can be referenced in compliance discussions, retrospectives, and refactor reviews. Unnamed tests disappear into aggregate counts and lose their contractual force.
- **Magic numbers deserve honest flags, not quiet defaults.** The 60/40 geometric/semantic weight blend and the carry-forward of the v1.0 CONSTRAINT_MAP constants are acknowledged in the retrospective as open questions rather than hidden inside the code. Flagging them surfaces the calibration work for a future release instead of burying it.
- **Backward-compat tests deserve names, too.** SC-02 (semantic-only fallback when skill has no position), SC-03 (graceful degradation with missing `positions.json`), INT-08 (entire system works with zero plane data) — all three make the backward-compat contract auditable. A substrate swap that breaks the previous surface is a regression, not a feature.
- **Preserve the six-stage pipeline boundary; touch only the minimum.** Tangent activation entered via the Score stage only, leaving Observe, Detect, Suggest, Apply, Learn, and Compose untouched. The pipeline shape from v1.0 held, which is why the 16,100-test regression passed. Substrate swaps should shrink their contact surface to the one stage that must change.
- **Idempotence and non-destructiveness are non-optional for migrations over live data.** `skill-creator migrate-plane` is idempotent (second run skips positioned skills), non-destructive (never writes to SKILL.md), and error-isolated (one analyzer failure does not abort the batch). A migration tool that cannot be run twice safely is a migration tool that will corrupt production on retry.
- **Name-collision between adjacent modules is a design signal, not a cosmetic fix.** The PositionStorePort collision between `chords.ts` and `promotion.ts` forced the barrel module to decide which store was canonical. The resolution via `ChordPositionStorePort` alias is a workaround; the deeper lesson is that two modules sharing a port name likely want to share an implementation too, and that refactor is follow-up work.
- **Geometric vetoes belong in the promotion pipeline, not in the activation layer.** The seven-check AngularPromotionEvaluator keeps angular-velocity vetoes, adjacency checks, and direction filters at the promotion gate. Mixing them into activation would slow every Score call and couple the two layers unnecessarily. Keep the fast path fast and the slow path rigorous.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Core Skill Management — the six-stage pipeline (Observe/Detect/Suggest/Apply/Learn/Compose) that v1.37 extends at the Score stage and preserves at every other stage |
| [v1.0](../v1.0/) | Bounded learning parameters (3-correction / 7-day cooldown / 20% max change) — preserved verbatim in the v1.37 CONSTRAINT_MAP as angular-rotation equivalents |
| [v1.1](../v1.1/) | Semantic Conflict Detection — the semantic scoring layer that tangent activation blends with at the 60/40 default weight |
| [v1.5](../v1.5/) | Pattern Discovery — the Observe → Detect pipeline whose signal output feeds the ObserverAngularBridge in Phase 361 |
| [v1.8](../v1.8/) | Capability-Aware Planning — the Compose stage that chord detection now supplies candidate pairs to |
| [v1.25](../v1.25/) | Ecosystem Integration — the 20-node dependency DAG that Complex Plane positions now complement with angular coordinates |
| [v1.34](../v1.34/) | Documentation Ecosystem — the doc refresh that v1.37 now publishes the plane-status and migrate-plane CLIs into |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — the complex-plane classifier and navigator that v1.37 builds the user-facing learning surface on top of |
| [v1.35](../v1.35/) | SAFE-04 through SAFE-08 safety test naming convention — the precedent v1.37's SC-01 through SC-12 follows |
| [v1.36](../v1.36/) | Citation Management — immediate predecessor; provenance chains that the migration analyzer consults via usage-history signal |
| [v1.38](../v1.38/) | SSH Agent Security — immediate successor; isolates the `.claude/plane/positions.json` store in the per-agent worktree sandbox |
| [v1.39](../v1.39/) | GSD-OS Bootstrap — exposes `plane-status` through the 7-service launcher with health checks |
| [v1.40](../v1.40/) | sc:learn Dogfood Mission — the release slated to calibrate the 60/40 blend default against real activation data |
| [v1.42](../v1.42/) | Applies lesson #4 (named safety tests) to the broader test corpus with a per-phase test census |
| [v1.49](../v1.49/) | Mega-release that consolidated the post-v1.37 plane work into the unified cartridge pipeline |
| `src/plane/index.ts` | Barrel exports for the 13 submodules of the Complex Plane framework (commit `da1e70936`) |
| `src/plane/migration.ts` | Migration analyzer and executor with CLI command (commit `4f8a6cf8e`) |
| `src/plane/__tests__/safety-critical.test.ts` | SC-01 through SC-12 safety-critical suite, 513 lines (commit `1dc187de4`) |
| `src/plane/__tests__/integration.test.ts` | INT-01 through INT-12 E2E integration suite, 606 lines (commit `66493666d`) |
| `.claude/plane/positions.json` | PositionStore persistence file — source of truth for every skill's (theta, r) |
| `docs/release-notes/v1.37/chapter/03-retrospective.md` | Retrospective chapter with the full What Worked / What Could Be Better inventory |
| `docs/release-notes/v1.37/chapter/04-lessons.md` | Lessons chapter with extracted entries and their applied-or-investigate classification |

## Engine Position

v1.37 sits in the middle of the post-v1.29 knowledge-subsystem arc. v1.29 landed the first educational pack; v1.30 typed the pipeline; v1.31 exposed it through MCP; v1.32 added brainstorm support; v1.33 delivered the multi-agent cloud; v1.34 refined the docs; v1.35 encoded 451 mathematical primitives as a typed DAG with the complex-plane classifier and navigator; v1.36 added citation provenance. v1.37 is the release that takes the classifier and navigator from v1.35 and turns them into a user-facing learning surface — every skill in the library, not just every mathematical primitive, now carries a Complex Plane position. Every subsequent release that talks about skill position, tangent activation, chord detection, Euler composition, versine, exsecant, or angular velocity is downstream of v1.37. The framework is additive to v1.0's six-stage pipeline (only the Score stage was touched) and preserves v1.0's bounded-learning constants verbatim in the CONSTRAINT_MAP.

## Cumulative Statistics

- **Phases landed at tip:** 366 (v1.37 covers 359–366, 8 phases)
- **Plans completed in window:** 16
- **Commits in window:** 28
- **Requirements closed:** 50/50
- **Tests added to suite:** 446 across the 8-phase window
- **Source LOC:** ~9.7K
- **Phase test distribution:** 129 (math core) / 37 (tangent) / 54 (observer) / 52 (promotion) / 54 (chord+Euler) / 33 (metrics) / 68 (migration) / 38 (integration)
- **Safety-critical tests:** 12 (SC-01 through SC-12)
- **E2E integration tests:** 12 (INT-01 through INT-12)
- **Barrel-exported modules:** 13 (via `src/plane/index.ts`)
- **Full-suite regression:** 16,100 tests passing, 0 failing
- **CLI surface added:** 2 commands (`plane-status`, `migrate-plane` / `mp`) with 7 combined flags
- **Default geometric/semantic weight blend:** 60/40 (configurable)
- **Chord detection defaults:** arc ≤ π/4, co-activation frequency ≥ 3, savings ≥ 15%
- **Promotion check count:** 7 (direction, adjacency, angular step, evidence, stability, velocity, existing F1/MCC)
- **Signal weights classified:** 12 types in SIGNAL_WEIGHTS

## Taxonomic State

- **Complex Plane axis θ:** abstract-to-concrete balance, range [0, π/2] where θ=0 is maximally abstract and θ=π/2 is maximally concrete
- **Complex Plane axis r:** maturity (evidence accumulated over skill lifetime), unbounded above
- **Versine bins:** grounded (vers(θ) < 0.3) / working (0.3 ≤ vers(θ) < 1) / frontier (vers(θ) ≥ 1)
- **Exsecant gauge:** measures reach past the unit circle, surfacing skills whose r has grown beyond the standard reference radius
- **Angular velocity ceiling:** enforced by CONSTRAINT_MAP as the check-6 veto in the Angular Promotion Evaluator
- **Promotion regions:** named constants in PROMOTION_REGIONS defining the (θ, r) neighborhoods a promotion may rotate a skill into
- **Signal types classified:** 12 entries in SIGNAL_WEIGHTS spanning concrete/abstract context, corrections, refinements, co-activations
- **Chord arc default:** π/4 (45 degrees), adjustable via ChordDetector configuration
- **Position store canonical path:** `.claude/plane/positions.json`, JSON-persisted, load-on-demand by every downstream module

## Files

- `src/plane/index.ts` — barrel module re-exporting 13 submodules under section comments; resolves PositionStorePort name collision between `chords.ts` and `promotion.ts` via selective re-export with `ChordPositionStorePort` alias (commit `da1e70936`, 47-line net addition)
- `src/plane/migration.ts` — SkillMigrationAnalyzer, PlaneMigration executor, MigrationOptions / MigrationDetail / MigrationReport types, `handleMigratePlaneCommand` CLI handler; idempotent, non-destructive, error-isolated; wired as `migrate-plane` / `mp` command in `src/cli.ts` (commit `4f8a6cf8e`, 210-line addition)
- `src/plane/__tests__/safety-critical.test.ts` — SC-01 through SC-12 safety-critical suite; covers semantic-only fallback, graceful degradation, empty signals, position-free creation, missing-position rejection, θ=0 boundary, θ=π/2 clamping, angular velocity bound, migration idempotence and non-destructiveness; 513 lines (commit `1dc187de4`)
- `src/plane/__tests__/integration.test.ts` — INT-01 through INT-12 E2E integration suite; covers observer→bridge→store pipeline, store→activation scoring, promotion with geometric fields, co-activation→chord candidates, migration→store→activation, dashboard rendering, full lifecycle, zero-plane-data backward-compat, scoring toggles, concurrent-observer store integrity, 500-skill performance under 2 seconds; 606 lines (commit `66493666d`)
- `package.json` — version bumped to 1.37.0 at `09476d192` as part of the milestone-completion chore commit
- `docs/release-notes/v1.37/chapter/00-summary.md` — summary chapter pointing to this README
- `docs/release-notes/v1.37/chapter/03-retrospective.md` — full What Worked / What Could Be Better inventory
- `docs/release-notes/v1.37/chapter/04-lessons.md` — extracted lessons with applied-or-investigate classification
- `docs/release-notes/v1.37/chapter/99-context.md` — prev/next navigation and parse-confidence metadata

---

_Parse confidence: 1.00 — authored from git log `v1.37~5..v1.37` plus tag metadata, chapter files, phase breakdown (359–366), and the safety-critical + integration test inventories in `src/plane/__tests__/`._
