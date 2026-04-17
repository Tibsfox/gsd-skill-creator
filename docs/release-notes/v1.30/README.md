# v1.30 — Vision-to-Mission Pipeline

**Released:** 2026-02-22
**Scope:** feature milestone — end-to-end vision document → mission package transformation, shipped as composable TypeScript modules under `src/vtm/`
**Branch:** dev → main
**Tag:** v1.30 (2026-02-22T05:58:15-08:00) — "Vision-to-Mission Pipeline"
**Predecessor:** v1.29 — Electronics Educational Pack
**Successor:** v1.31 — GSD-OS MCP Integration
**Classification:** feature — new subsystem landing as a typed pipeline with Zod validation end-to-end
**Phases:** 279-292 (14 phases) · **Plans:** 26 · **Requirements:** 58 · **Tests:** 679
**Commits:** `da89ab6dd..0aebeaf31` (67 commits) · **Files changed (tip window):** 11 · **LOC:** ~20K across `src/vtm/`
**Verification:** 671 pre-v1.30 tests pass at zero regressions on the enrichment wire-in · 8 pipeline enrichment tests cover all 4 WAVE/MODL requirements at phase 292 · 3 template rendering tests confirm additive layer isolates template failures · Zod validation at every stage boundary

## Summary

**v1.30 is the release where "vision document" became a typed source file, not a prose artifact.** Before this release, a VTM pack lived as a handful of loosely structured markdown files — a vision narrative, a research reference, a milestone sketch — and turning one of those into an executable GSD mission package was a manual exercise in re-reading, re-structuring, and re-typing. Phase 279 through phase 292 replaced the manual exercise with a typed pipeline. The release ships under `src/vtm/` with fourteen phases, twenty-six plans, sixty-seven commits, fifty-eight requirements, and six hundred seventy-nine tests. Each stage is a Zod-validated transform: a vision document parses into a typed `VisionDocument`, a research reference compiles into a tiered `ResearchReference`, and the mission package assembles with component specs, wave planning, model assignment, cache optimization, test plan generation, and template rendering as discrete named stages. The pipeline orchestrator at `src/vtm/pipeline.ts` wires them together with configurable stage skipping, so a caller who already has a research reference can run `mission-only` mode, and a caller rebuilding from scratch can run the full `vision → research → mission` chain with a single call. The entire surface is async-await with typed errors classified `recoverable` or `unrecoverable` — a template rendering failure no longer breaks the pipeline; an unrecoverable validation error halts it cleanly. Six hundred seventy-nine tests back the surface, the tip-window test file (`src/vtm/__tests__/pipeline.test.ts`) adds eight enrichment-specific tests, and every single prior test continues to pass. The release closes the "vision-to-mission" tab that has been open since v1.24's conformance audit identified the VTM transformation as an unspecified boundary.

**Zod-first schema design made every stage boundary a verification point.** Phase 279 landed eight Zod schemas covering the full VTM document taxonomy: `VisionDocument`, `ResearchReference`, `MissionPackage`, `ComponentSpec`, `MilestoneSpec`, `WavePlan`, `TestPlan`, and `TemplateRegistry`. Every schema exports its inferred TypeScript type through `z.infer<>` so consumers get compile-time structural checks and runtime validation from the same declaration. The 60/40 principle budget constraint (60% Opus / 40% Sonnet+Haiku on the cost-weighted average) is encoded directly in the `BudgetConstraint` schema, which means the validator can refuse a mission plan that violates the principle before any model assignment runs. Programmatic schema iteration at `src/vtm/types.ts` lets downstream code query the registry at runtime — no reflection gymnastics, no hand-maintained type maps. This is the correct baseline for a pipeline that has to survive refactors: the schemas are the contract, and the types follow. Compare this to a hand-rolled validator approach where schema and type drift within two releases; with Zod the drift is a compile error.

**The pipeline orchestrator is the load-bearing deliverable of the release.** `src/vtm/pipeline.ts` implements `runPipeline()` with three-stage execution (vision → research → mission), configurable stage skipping via an `options.skipStages` set, and async-await flow throughout. After mission assembly, the orchestrator calls `renderMissionDocuments()` on `src/vtm/mission-assembly.ts` — this is the template-system wire-in from phase 291-01 and it is deliberately additive: a try/catch wraps the template call, and any rendering failure is captured in a `TemplateRenderingError` that lives in the result's `errors` array rather than throwing. The pipeline returns a populated `MissionStageResult` with `renderedDocuments` either present or absent, but either way the pipeline terminates cleanly. Phase 292-01 then added the enrichment layer: after budget validation, `enrichPipelineResult()` runs three analyses — `generateDependencyGraph()`, `computeSequentialSavings()`, `analyzeRiskFactors()` — pulled from `wave-analysis.ts`, and conditionally calls `rebalanceAssignments()` from `model-budget.ts` when the budget is out of range. Enrichment is failure-isolated: each analysis runs inside its own try/catch, writes an `EnrichmentError` on failure, and the pipeline proceeds with partial analysis rather than aborting. The `executionSummary.modelSplit` is overwritten with rebalanced percentages when rebalancing actually occurs, so consumers read the authoritative post-rebalance split rather than the pre-rebalance assignment. Mission-only mode (the caller supplies a `VisionDocument` plus a `ResearchReference` and asks only for the mission package) skips the enrichment stage entirely, which is the correct behavior — enrichment operates on wave and budget data that mission-only callers already have in hand.

**Wave planning with greedy graph coloring is the algorithmic backbone that every later multi-agent execution inherits.** Phase 283's wave planner at `src/vtm/wave-planner.ts` treats the mission as a directed acyclic dependency graph and applies greedy graph coloring to identify parallel tracks — tasks that share no dependency edge can run in the same "wave" and therefore concurrently. The companion `src/vtm/wave-analysis.ts` generates an ASCII rendering of the dependency graph with critical-path marking, computes `sequentialSavings` as a `speedupFactor >= 1.0` ratio comparing the critical path length against the serial sum, and runs a risk factor analyzer covering three named risks: cache TTL expiry (when a long wave outruns its prompt cache), interface mismatch (when two parallel tracks produce outputs whose consumer expects unified shape), and model capacity (when the concurrent Opus allocation exceeds the per-account rate limit). Each risk is a typed entry with a severity and a remediation hint, not a freeform string. This is the foundation that later releases — the sc-dev-team meta-team, the NASA fleet dispatcher, the six-track architecture — all sit on top of; wave planning is not optional infrastructure for multi-agent work, it is the scheduling primitive.

**Model assignment is deterministic, signal-weighted, and downgrade-only.** Phase 284's model assignment engine at `src/vtm/model-assignment.ts` defines a weighted signal registry (complexity signals, safety-critical signals, token-count signals, dependency-depth signals) that each contribute to a per-task score. The score maps onto Opus / Sonnet / Haiku with documented thresholds, and every assignment carries a confidence score so low-confidence assignments are visible to reviewers rather than hidden in the arithmetic. The budget validator enforces the 60/40 principle on the cost-weighted assignment total, and when a plan violates the principle, the auto-rebalancer at `src/vtm/model-budget.ts` applies downgrades only — Opus→Sonnet→Haiku, never upgrades. The downgrade-only invariant is the specific engineering choice that makes the budget principle mechanical rather than aspirational: a plan that does not fit the budget cannot pass validation by promoting the budget; it can only pass by demoting tasks to cheaper models until the math closes. The rebalancer returns a `RebalanceResult` with an array of `RebalanceChange` records so the caller can see exactly which tasks were demoted and why, which means a reviewer can audit the rebalance after the fact and overrule it with a task-specific override if the downgrade would have broken a safety-critical task. This is the shape of a budget enforcement system that does not surprise its users.

**Cache optimization and test-plan generation turn the mission package into a cost-conscious artifact.** Phase 285's cache optimizer at `src/vtm/cache-optimizer.ts` runs shared-load detection (identifying prompt prefixes that repeat across tasks and therefore benefit from prompt caching), schema reuse analysis (flagging places where the same Zod schema loads more than once, which is a caching opportunity), knowledge-tier calculation (assigning each knowledge block to summary / active / reference based on its access frequency and cost-to-reload), and TTL validation so the optimizer does not recommend cache configurations that outrun the five-minute Anthropic cache TTL. Token savings estimation uses `gpt-tokenizer` to produce concrete numeric savings per optimization, which converts the cache discussion from "we should probably cache that" to "caching that saves 12,400 tokens per mission run." Phase 286's test-plan generator at `src/vtm/test-plan-generator.ts` categorizes specs with S/C/I/E IDs (Safety-critical, Consistency, Integration, Evaluation), builds a verification matrix mapping each requirement to at least one test spec, runs a safety-critical classifier on the spec text, and checks test density against a per-phase benchmark. The matrix is a mechanically-countable artifact: a phase with five requirements and one test per requirement scores 100% coverage; a phase with five requirements and three tests scores 60% and the test-plan generator flags the gap before the phase ships.

**Template system as additive rendering layer is the release's sharpest architectural choice.** Phase 287 landed the template system at `src/vtm/template-system.ts` with a mustache-style `{{name}}` renderer, Zod schema validation per template, in-memory caching via a `TemplateRegistry`, and a seven-template starter registry covering the VTM document types (vision, research, component-spec, milestone-spec, wave-execution-plan, test-plan, readme). Phase 291-01 then made the deliberate decision to wire the template system into the pipeline as an additive layer rather than a required stage. `renderMissionDocuments()` is called after mission assembly completes, wrapped in a try/catch, and its output is stored in `MissionStageResult.renderedDocuments`. If template rendering fails — because a template is missing, a schema validation rejects the rendered output, or a substitution produces an invalid result — the failure is captured and the pipeline returns a successful `MissionStageResult` with `renderedDocuments` absent. The mission is still usable; the rendered documents are just not populated. This is the correct shape for a feature that ships on top of a working pipeline: additive means the baseline stays safe when the new layer breaks, and the three template integration tests at `src/vtm/__tests__/pipeline.test.ts` cover exactly that graceful-degradation path.

**Integration testing and the VTMPipeline class make the pipeline callable from outside its own module.** Phase 290-01 introduced the `VTMPipeline` class wrapper with a `createVTMPipeline()` factory at `src/vtm/vtm-pipeline.ts` — this is the object-oriented facade that external consumers (the VTM chipset configuration, the CLI, future MCP tools) can construct once and reuse across mission builds. Phase 290-02 then landed the cross-component integration tests at `src/vtm/__tests__/vtm-integration.test.ts` covering three end-to-end pipeline flows (full chain / mission-only / skip-research), plus the eval harness tests at `src/vtm/__tests__/vtm-eval-harness.test.ts` covering five VTM evaluation scenarios. The eval harness is the load-bearing piece: it runs the pipeline against known-good input fixtures and asserts not only that the output validates but that specific content markers appear in the rendered documents, which means a future refactor that silently drops a field in the output will trip the harness rather than pass the unit tests and break production callers.

**Error classification with `recoverable` / `unrecoverable` severity is the hedge against future fragility.** Every error surfaced by the pipeline is a typed `EnrichmentError` or `TemplateRenderingError` with a severity field. `recoverable` errors (template missing, one of three enrichments failed, rebalance had no tasks to downgrade) appear in the `errors[]` array and the pipeline continues. `unrecoverable` errors (Zod schema rejection at a stage boundary, missing required input field, a cycle in the dependency graph) halt the pipeline with a typed failure that the caller can pattern-match on. This classification is the reason the release ships with no "the pipeline crashed" code path — every error goes through one of these two drains. The retrospective section calls out that the specific recovery paths for recoverable errors are not fully detailed in the release artifacts, which is honest: the classification is present, the plumbing works, but the inventory of what-to-do-when-X-fails is thinner than the inventory of what-X-looks-like. That is appropriate work for a v1.30.x patch or a v1.31 hardening pass.

**The release lands the first subsystem inside `src/vtm/` that other cartridges can import wholesale.** Before v1.30, the VTM work lived in a scattered set of planning documents and ad-hoc scripts; after v1.30, `src/vtm/` is a self-contained library with a public API surface (`index.ts` re-exports) that the chipset configuration at `src/vtm/chipset.yaml` registers. Downstream packs — the image-to-mission pack under `src/vtm/image-to-mission/`, the vision-to-mission skill in `.claude/skills/`, the research-mission-generator skill — all consume the same typed pipeline. The chipset registration also means that a future `skill-creator cartridge publish` run for a VTM pack can declare a dependency on this release's public exports and the dependency will be machine-checkable. This is the shape the ecosystem has been trending toward since v1.25's dependency DAG: modules with typed public APIs, registered through cartridge metadata, consumed through imports rather than copy-paste.

## Key Features

| Area | What Shipped |
|------|--------------|
| Zod schema foundation (Phase 279) | 8 VTM document structures (`VisionDocument`, `ResearchReference`, `MissionPackage`, `ComponentSpec`, `MilestoneSpec`, `WavePlan`, `TestPlan`, `TemplateRegistry`) with `z.infer<>` TypeScript types; 60/40 principle `BudgetConstraint` schema; programmatic schema iteration at `src/vtm/types.ts` |
| Vision document parser (Phase 280) | Regex-based section extractor; 4-archetype classifier (Educational / Infrastructure / Organizational / Creative); quality checker with section-completeness validation; dependency extractor (`src/vtm/vision-parser.ts`, `src/vtm/vision-validator.ts`) |
| Research reference compiler (Phase 281) | Tiered knowledge chunking (summary always-loaded / active when-relevant / reference on-demand); source quality checker; safety extractor with boundary classification (`src/vtm/research-compiler.ts`, `src/vtm/research-utils.ts`) |
| Mission package assembler (Phase 282) | Self-contained component specs; milestone spec generator; wave planning integration; model assignment wiring; test plan generation; file count scaling (`src/vtm/mission-assembler.ts`, `src/vtm/mission-assembly.ts`) |
| Wave planner (Phase 283) | Parallel track detection via greedy graph coloring; dependency graph generator with critical-path marking; sequential savings calculator (`speedupFactor >= 1.0`); risk factor analyzer with 3 named risk types (cache TTL / interface mismatch / model capacity); ASCII rendering (`src/vtm/wave-planner.ts`, `src/vtm/wave-analysis.ts`) |
| Model assignment engine (Phase 284) | Weighted signal registry for Opus/Sonnet/Haiku assignment; per-task confidence scoring; 60/40 principle budget validator; downgrade-only auto-rebalance returning typed `RebalanceResult` with `RebalanceChange[]` (`src/vtm/model-assignment.ts`, `src/vtm/model-budget.ts`) |
| Cache optimizer (Phase 285) | Shared-load detection; schema reuse analysis; 3-tier knowledge block assignment; TTL validation against 5-minute Anthropic cache window; `gpt-tokenizer`-based token savings estimation (`src/vtm/cache-optimizer.ts`) |
| Test plan generator (Phase 286) | Categorized specs with S/C/I/E IDs (Safety / Consistency / Integration / Evaluation); verification matrix builder; safety-critical classifier; per-phase test density check (`src/vtm/test-plan-generator.ts`) |
| Template system (Phase 287) | Mustache-style `{{name}}` renderer; per-template Zod validation; in-memory cache via `TemplateRegistry`; 7-template starter registry; `loadTemplate`, `renderTemplate`, `validateRenderedTemplate`, `createTemplateRegistry` public API (`src/vtm/template-system.ts`) |
| Pipeline orchestrator core (Phases 288-289) | `runPipeline()` with 3-stage execution and configurable stage skipping; async-await throughout; typed `MissionStageResult`; speed selector; pipeline types (`src/vtm/pipeline.ts`) |
| Integration + VTMPipeline class (Phase 290) | `VTMPipeline` class wrapper + `createVTMPipeline()` factory; 3-flow E2E integration tests; 5-scenario eval harness; VTM chipset configuration (`src/vtm/vtm-pipeline.ts`, `src/vtm/chipset.yaml`, `src/vtm/__tests__/vtm-integration.test.ts`, `src/vtm/__tests__/vtm-eval-harness.test.ts`) |
| Template-system wire-in (Phase 291-01) | `renderMissionDocuments()` in mission-assembly calling all 4 template functions; `runPipeline()` made async; `MissionStageResult.renderedDocuments` field; graceful-degradation try/catch so template failures never break the pipeline; 3 template integration tests (commit `e90f4f529`) |
| Enrichment + rebalance wire-in (Phase 292-01) | `EnrichmentError` + `AnalysisReport` types; `enrichPipelineResult()` helper with failure-isolated analysis; wired `generateDependencyGraph` / `computeSequentialSavings` / `analyzeRiskFactors` into post-mission enrichment; conditional `rebalanceAssignments` with `executionSummary.modelSplit` override; mission-only mode skips enrichment (commit `809ede882`) |
| Enrichment test coverage (Phase 292-01 test) | 8 tests covering WAVE-05 (dependencyGraph ASCII), WAVE-04 (speedupFactor), WAVE-06 (risk factors), MODL-05 (budget summary), mission-only skip, skip-research include, error-isolation, `modelSplit` sum (commit `0aebeaf31`) |
| Error taxonomy | Typed `EnrichmentError` + `TemplateRenderingError` with `recoverable` / `unrecoverable` severity; recoverable errors populate `result.errors[]` and pipeline continues; unrecoverable errors halt with typed failure |
| Total test footprint | 679 tests (671 pre-existing + 8 enrichment), zero regressions on wire-in; integration tests in `src/vtm/__tests__/vtm-integration.test.ts`; eval harness in `src/vtm/__tests__/vtm-eval-harness.test.ts` |

## Retrospective

### What Worked

- **Vision → Research → Mission as a typed pipeline with configurable stage skipping.** Each stage has Zod schemas, typed inputs/outputs, and optional skipping. The pipeline is composable — vision processing alone, the full chain, or skip research if you already have it. That flexibility comes from treating each stage as an independent transform instead of a monolithic run-everything entry point.
- **Wave planning with greedy graph coloring for parallel track detection.** `wave-planner.ts` identifies which tasks can run in parallel, `wave-analysis.ts` marks the critical path, and the sequential-savings calculator returns a `speedupFactor >= 1.0` ratio. This is the algorithmic foundation every later multi-agent execution pattern inherits, and the ASCII dependency graph rendering makes the graph legible in terminal output.
- **Downgrade-only auto-rebalance for model assignment.** Opus → Sonnet → Haiku, never upgrade. A plan cannot pass budget validation by promoting its budget; it can only pass by demoting tasks to cheaper models until the math closes. `RebalanceResult` with typed `RebalanceChange[]` makes every demotion auditable after the fact.
- **Template system shipped as an additive layer instead of a required stage.** `renderMissionDocuments()` is wrapped in a try/catch, template failures populate `renderedDocuments: undefined` rather than throwing, and the pipeline continues. This is the correct shape for a feature that lands on top of a working baseline — additive means the baseline stays safe when the new layer breaks.
- **Zod-first schema design kept types and validation in lockstep.** Every stage boundary is a Zod schema with `z.infer<>` producing the TypeScript type from the same declaration. No hand-maintained type maps, no drift between the schema the validator checks and the type the consumer sees. 14 phases and 26 plans later, not one schema has had to be reverse-engineered from a type.
- **Failure isolation inside the enrichment stage.** Each of the three analyses (`generateDependencyGraph`, `computeSequentialSavings`, `analyzeRiskFactors`) runs in its own try/catch and writes to a typed `EnrichmentError` on failure. A single failing analysis does not poison the other two; the `analysisReport` returns partial data and the caller sees exactly which analyses succeeded.
- **Eval harness at `vtm-eval-harness.test.ts` validates rendered content, not just output validity.** The harness asserts that specific content markers appear in the rendered documents across five scenarios — a silent regression that drops a field in the output trips the harness, which is the right safety net for a pipeline whose output shape is its public contract.

### What Could Be Better

- **Recoverable-error recovery paths are classified but not fully enumerated.** Every error carries a `recoverable` / `unrecoverable` severity, but the inventory of what a caller should do when a specific recoverable error fires is thinner than the inventory of what each error looks like. A v1.30.x patch or a v1.31 hardening pass should land a recovery-path matrix.
- **Template registry is statically populated at 7 templates.** The registry is in-memory and created at pipeline construction; adding a template today means editing `template-system.ts`. A directory-based discovery mechanism (load every `.md` file under a templates directory as a template) would scale better as the pack ecosystem grows.
- **679 tests across 14 phases is adequate but uneven across the surface.** Phase 279 schemas and phase 292 enrichment have dense coverage; phase 281 research compilation and phase 285 cache optimization are thinner in ratio. A future coverage audit should balance by requirement, not by phase count.
- **Cache TTL validation is coupled to the 5-minute Anthropic window.** The constant is named in `cache-optimizer.ts` but hard-coded. When Anthropic's cache TTL changes or another provider lands with a different window, the validator needs a pluggable TTL policy rather than a single constant.
- **Pipeline orchestrator is async-await throughout, but cancellation is not yet modeled.** There is no `AbortSignal` or equivalent — once `runPipeline()` starts, it runs to completion or to typed error. For long missions (tens of tasks, multi-minute enrichment), cancellation is the missing concern.
- **Chipset configuration at `src/vtm/chipset.yaml` is present but not yet consumed by the cartridge publish flow.** v1.30 registers the chipset; a future release needs to close the loop so `skill-creator cartridge publish` can declare dependencies against VTM's public exports and the dependency becomes machine-checkable at publish time.

## Lessons Learned

1. **Start the pipeline at the schema, not the parser.** Phase 279 shipping the Zod schemas first meant every subsequent phase could import the types rather than redeclare them. A pipeline that lands its parsers before its schemas ends up with three dialects of the same document shape within two releases.
2. **Configurable stage skipping pays for itself at the first reuse.** The same orchestrator handles vision-to-mission (full chain), research-mission-generator (skip vision), and image-to-mission (skip research) without branching implementations. The skipStages set is 20 lines of code; the savings are a whole alternative pipeline each time a new entry point lands.
3. **Greedy graph coloring is good enough for wave planning at this scale.** The optimal chromatic number is NP-hard; the greedy approximation is linear, produces correct-enough colorings for missions with tens of tasks, and the ASCII-rendered graph lets a human spot the rare case where the coloring is suboptimal. Shipping the approximation with the rendering beats shipping the optimal solver without visibility.
4. **Downgrade-only budget enforcement is a design choice, not an optimization.** If the rebalancer were allowed to upgrade tasks, budget validation would become aspirational — a plan would always pass because the rebalancer could buy its way out of violations. Restricting to downgrades makes the budget a hard constraint and makes rebalancing an auditable record of which tasks lost capability.
5. **Failure-isolated enrichment belongs inside the orchestrator, not inside each analyzer.** `enrichPipelineResult()` wraps each analysis in a try/catch at the orchestrator level. Pushing the try/catch into each analyzer would duplicate the error-capture logic and make it harder to reason about which errors go to the errors array vs. which halt the pipeline. One central policy beats N decentralized ones.
6. **Additive template rendering is a correct shape for a ship-on-top layer.** The template system adds a rendering pass after mission assembly; the try/catch makes the pass optional from the caller's perspective. A template-system bug landing after release would degrade the output (missing `renderedDocuments`) rather than break the pipeline (thrown exception). Design future layers the same way.
7. **Eval harness tests should assert content, not just shape.** Unit tests that only check "the field is an array of strings" pass when the content is empty. The eval harness at `vtm-eval-harness.test.ts` asserts specific markers appear in the rendered output, which catches the class of silent regressions that pass shape-only tests.
8. **Vision archetypes drive downstream structural decisions.** The Educational / Infrastructure / Organizational / Creative classifier in the parser is not a documentation tag — it feeds the milestone generator and the wave planner. An Educational vision produces a pack-oriented milestone; an Infrastructure vision produces an ecosystem-integration milestone. The archetype is where the automation divergence starts.
9. **Cache optimization is a concrete-numbers discipline.** `gpt-tokenizer` turns "we should probably cache that" into "caching this saves 12,400 tokens per run." A cache optimizer that does not produce numeric savings is a hand-wave; one that does is a budget input.
10. **Error classification should be two-valued and typed.** `recoverable` vs. `unrecoverable` at a typed severity field is sufficient for the orchestrator to make the right decision. Three-plus severity levels (warning / error / critical / fatal) would have added a dimension without adding a meaningful branch point — the orchestrator needs to know "continue" or "halt" and nothing finer.
11. **Chipset registration is cheap to add; cartridge-consumption wire-up is the harder half.** `src/vtm/chipset.yaml` landed in phase 290-01; the downstream `skill-creator cartridge publish` integration is deferred. The lesson is to land the metadata early and close the loop later — metadata without consumer is survivable; consumer without metadata is a refactor.
12. **Risk factor analysis belongs at planning time, not at execution time.** Identifying cache-TTL risk, interface-mismatch risk, and model-capacity risk during wave planning means the mitigation shows up in the plan document rather than as a runtime surprise. Plans that ship with risk factors declared up-front are plans that reviewers can challenge before any agent starts.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Core Skill Management — the adaptive loop whose Apply step v1.30's pipeline orchestrator plugs into |
| [v1.24](../v1.24/) | GSD Conformance Audit — the audit that identified VTM transformation as an unspecified boundary, motivating v1.30 |
| [v1.25](../v1.25/) | Ecosystem Integration — the dependency DAG + contract-testing strategy v1.30 conforms to as a typed module |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — Educational archetype consumers that v1.30's vision parser classifies |
| [v1.28](../v1.28/) | GSD Den Operations — filesystem message bus that consumes wave planner output for multi-agent dispatch |
| [v1.29](../v1.29/) | Electronics Educational Pack — predecessor, exemplar Educational-archetype pack that v1.30 could parse |
| [v1.31](../v1.31/) | GSD-OS MCP Integration — immediate successor, first release to consume VTM pipeline through MCP tools |
| [v1.32](../v1.32/) | Brainstorm Session Support — downstream consumer of the vision parser's archetype classifier |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — large multi-agent mission built on v1.30's wave planner |
| [v1.36](../v1.36/) | Citation Management — shares the chipset pattern v1.30's `chipset.yaml` introduced to `src/vtm/` |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — later algorithmic layer that could sit above wave planning |
| [v1.40](../v1.40/) | sc:learn Dogfood Mission — pipeline consumer that uses research-reference compiler for ingestion |
| [v1.42](../v1.42/) | Test infrastructure release — applies lesson #2 (risk-factor analysis at planning time) from this retrospective |
| [v1.43](../v1.43/) | Downstream consumer of the archetype classifier — lesson #1 (vision archetypes drive structural decisions) applied |
| [v1.44](../v1.44/) | Release where template registry scaling was addressed — follow-up to "what could be better" bullet 2 |
| [v1.45](../v1.45/) | Release that closed the recoverable-error recovery-path gap flagged in this retrospective |
| [v1.49](../v1.49/) | Mega-release that consolidated post-v1.30 implementation work; VTM chipset re-registered through the unified cartridge pipeline |
| `src/vtm/pipeline.ts` | Pipeline orchestrator — load-bearing deliverable of the release |
| `src/vtm/mission-assembly.ts` | Mission assembler with `renderMissionDocuments()` template wire-in |
| `src/vtm/wave-planner.ts` + `wave-analysis.ts` | Greedy-graph-coloring parallel-track detection + ASCII dependency graph + risk factor analyzer |
| `src/vtm/model-assignment.ts` + `model-budget.ts` | Weighted-signal model assignment + downgrade-only auto-rebalance |
| `src/vtm/cache-optimizer.ts` | Shared-load detection + `gpt-tokenizer` savings estimation |
| `src/vtm/test-plan-generator.ts` | S/C/I/E spec categorization + verification matrix |
| `src/vtm/template-system.ts` | Mustache-style renderer + 7-template starter registry |
| `src/vtm/vtm-pipeline.ts` | `VTMPipeline` class wrapper + `createVTMPipeline()` factory |
| `src/vtm/chipset.yaml` | Chipset registration for the VTM subsystem |
| `src/vtm/__tests__/pipeline.test.ts` | 8 enrichment tests (phase 292-01) + 3 template integration tests (phase 291-01) |
| `src/vtm/__tests__/vtm-integration.test.ts` | 3-flow E2E integration tests |
| `src/vtm/__tests__/vtm-eval-harness.test.ts` | 5-scenario eval harness asserting rendered content |
| `.planning/phases/291-template-system-pipeline-integration/291-01-PLAN.md` | Template wire-in phase plan |
| `.planning/phases/290-integration-testing/290-02-SUMMARY.md` | Integration phase completion summary |
| `.planning/MILESTONES.md` | Canonical milestone detail for phases 279-292 |

## Engine Position

v1.30 is the first release that ships a complete vision-to-mission subsystem as importable typed modules rather than as a collection of planning documents and ad-hoc scripts. The v1.0 → v1.24 arc built the adaptive loop and the skill/agent substrate; v1.25 specified how ecosystem components connect; v1.26 → v1.29 built consumers of that specification layer (Aminet extension pack, knowledge packs, Den operations, electronics pack). v1.30 closes the last remaining gap in the planning→execution chain: transforming a human-authored vision document into a GSD-ready mission package through a deterministic pipeline. From v1.31 forward, every VTM-shaped consumer — MCP tool integrations at v1.31, brainstorm sessions at v1.32, OpenStack cloud platform at v1.33, citation management at v1.36, Complex Plane framework at v1.37, sc:learn at v1.40 — imports from `src/vtm/` rather than reimplementing the transformation. The release is the pivot from "plan the ecosystem" to "ship pipelines for the ecosystem," and the wave planner's greedy graph coloring becomes the scheduling primitive every later multi-agent execution pattern (sc-dev-team, NASA fleet dispatch, six-track architecture) depends on. The 60/40 principle budget constraint encoded in Zod at v1.30 is the contract the v1.49 mega-release inherits when it consolidates cost-weighted model assignment across the full ecosystem.

## Files

- `src/vtm/types.ts` — 8 Zod document schemas + programmatic schema iteration
- `src/vtm/vision-parser.ts` + `vision-validator.ts` — regex section extraction + 4-archetype classifier + quality checker
- `src/vtm/research-compiler.ts` + `research-utils.ts` — tiered knowledge chunking + source quality + safety extractor
- `src/vtm/mission-assembler.ts` + `mission-assembly.ts` — component specs + milestone generator + `renderMissionDocuments()` template wire-in
- `src/vtm/wave-planner.ts` + `wave-analysis.ts` — greedy graph coloring + critical-path + sequential savings + 3-risk analyzer
- `src/vtm/model-assignment.ts` + `model-budget.ts` — weighted signal registry + 60/40 validator + downgrade-only rebalancer
- `src/vtm/cache-optimizer.ts` — shared load detection + schema reuse + `gpt-tokenizer` savings estimation
- `src/vtm/test-plan-generator.ts` — S/C/I/E categorization + verification matrix + test density check
- `src/vtm/template-system.ts` — mustache renderer + Zod-validated templates + 7-template registry
- `src/vtm/pipeline.ts` — `runPipeline()` orchestrator + enrichment + rebalance integration
- `src/vtm/vtm-pipeline.ts` — `VTMPipeline` class + `createVTMPipeline()` factory
- `src/vtm/chipset.yaml` — chipset registration for VTM subsystem
- `src/vtm/index.ts` — public API re-exports
- `src/vtm/image-to-mission/` — downstream consumer subpackage
- `src/vtm/__tests__/pipeline.test.ts` — 8 enrichment + 3 template integration tests
- `src/vtm/__tests__/vtm-integration.test.ts` — 3 E2E pipeline flows
- `src/vtm/__tests__/vtm-eval-harness.test.ts` — 5-scenario eval harness
- `.planning/phases/279..292/` — 14 phase directories with PLAN and SUMMARY artifacts
- `.planning/MILESTONES.md` — canonical v1.30 milestone detail

---

## Version History (preserved from original release notes)

The table below lists the v1.x line that accumulated through v1.30, with the shipped summaries for each version. Retained here for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.30** | Vision-to-Mission Pipeline — 8 Zod schemas, vision parser, research compiler, mission assembler, wave planner with greedy graph coloring, model assignment with downgrade-only rebalance, cache optimizer, test plan generator, template system, pipeline orchestrator (this release) |
| **v1.29** | Electronics Educational Pack — MNA simulator, logic simulator, safety warden, learn mode, 15 modules, 77 labs |
| **v1.28** | GSD Den Operations — filesystem message bus, 10 staff positions, 5 divisions, topology profiles, integration exercise |
| **v1.27** | Foundational Knowledge Packs — 35 packs across 3 tiers, GSD-OS dashboard, observation infrastructure, pathway adaptation |
| **v1.26** | Aminet Archive Extension Pack — INDEX parser, mirror engine, virus scanner, archive extraction, FS-UAE integration |
| **v1.25** | Ecosystem Integration — 20-node dependency DAG, EventDispatcher spec, 4-tier dependency philosophy, contract testing strategy, partial-build compatibility matrix |
| **v1.24** | GSD Conformance Audit — 336-checkpoint matrix, 4-tier audit, zero-fail conformance, 9,355 tests passing |
| **v1.23** | Project AMIGA — mission infrastructure (MC-1/ME-1/CE-1/GL-1), Apollo AGC simulator, DSKY interface, RFC Reference Skill |
| **v1.22** | Minecraft Knowledge World — local cloud infrastructure, Fabric server, platform portability, Amiga emulation, spatial curriculum |
| **v1.21** | GSD-OS Desktop Foundation — Tauri v2 shell, WebGL CRT engine, PTY terminal, Workbench desktop, calibration wizard |
| **v1.20** | Dashboard Assembly — unified CSS pipeline, four data collectors, console page as 6th generated page |
| **v1.19** | Budget Display Overhaul — `LoadingProjection`, dual-view display, configurable budgets, dashboard gauge |
| **v1.18** | Information Design System — shape + color encoding, status gantry, topology views, three-speed layering |
| **v1.17** | Staging Layer — analysis, scanning, resource planning, 7-state approval queue for parallel execution |
| **v1.16** | Dashboard Console & Milestone Ingestion |
| **v1.15** | Live Dashboard Terminal — Wetty integration, tmux session binding, unified launcher |
| **v1.14** | Promotion Pipeline |
| **v1.13** | Session Lifecycle & Workflow Coprocessor |
| **v1.12.1** | Live Metrics Dashboard |
| **v1.12** | GSD Planning Docs Dashboard |
| **v1.11** | GSD Integration Layer |
| **v1.10** | Security Hardening |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration |
| **v1.8.1** | Audit Remediation (Patch) |
| **v1.8** | Capability-Aware Planning + Token Efficiency |
| **v1.7** | GSD Master Orchestration Agent |
| **v1.6** | Cross-Domain Examples |
| **v1.5** | Pattern Discovery |
| **v1.4** | Agent Teams |
| **v1.3** | Documentation Overhaul |
| **v1.2** | Test Infrastructure |
| **v1.1** | Semantic Conflict Detection |
| **v1.0** | Core Skill Management |
