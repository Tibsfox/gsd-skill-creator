# v1.14 — Promotion Pipeline

**Released:** 2026-02-13
**Scope:** integration release — wire five previously isolated subsystems (Execution Capture, Pipeline Learning, Observation, Calibration, Pattern Detection) into a single promotion flow from tool execution through dashboard visualization
**Branch:** dev → main
**Tag:** v1.14 (2026-02-13T02:06:29-08:00) — "Promotion Pipeline"
**Predecessor:** v1.13 — Session Lifecycle & Workflow Coprocessor
**Successor:** v1.15 — Live Dashboard Terminal
**Classification:** integration release — no new capabilities; connects existing ones
**Phases:** 115–122 (8 phases) · **Plans:** 16 · **Requirements:** 27
**Stats:** 51 commits · 85 files · 8,798 insertions / 1,520 deletions
**Verification:** test-first for every phase · 8 collectors validated · SHA-256 hashing on captured executions · dry-run gating before script emission · F1/accuracy/MCC thresholds on promotion · drift-triggered automatic demotion

## Summary

**v1.14 is the integration release that made promotion a first-class system concern.** For nine versions the project had accumulated the raw materials for automating deterministic tool use — the Observation store from v1.5, the Calibration harness from v1.2 extended through v1.9, the Pipeline Learning module renamed from "Copper" in this release's opening refactor, the Blitter execution offload renamed from the Amiga-era "Blitter" label to the plainer "Offload" concept, and the Pattern Detection pipeline that drops suggestions into the learn/suggest loop. Each of these existed as an island. A user correction flowed into the pattern store; a deterministic bash equivalent of a recurring Read-then-Grep sequence was never emitted; nothing in the system said "this is safe to promote from an LLM-executed tool call to a cached script." v1.14 closed that loop. Execution capture feeds the determinism analyzer, which feeds the promotion detector's weighted composite score, which feeds the script generator's tool-to-bash translator, which feeds the gatekeeper's calibration-metric check, which feeds the drift monitor's post-promotion variance budget, which feeds the lineage tracker's bidirectional provenance graph, which feeds three dashboard collectors. One flow. Eight phases. Sixteen plans. Twenty-seven requirements.

**The release doubles as a terminology cleanup.** Eight of the first nine commits in the v1.13..v1.14 range are `refactor(...): rename Copper to Pipeline` and `refactor(blitter): rename Blitter terminology to Offload concepts` commits. The original Amiga-inspired naming (Copper for the learning coprocessor, Blitter for the execution offload, DMA for the budget system) was evocative in early drafts but had become friction at v1.13 when new contributors had to learn both the Amiga reference and the modern concept to read the code. v1.14 kept the project's Amiga spirit (the `chipset/` directory stayed, the learning coprocessor pattern stayed) but renamed the identifiers to what they do: Copper → Pipeline, Blitter → Offload, DMA → Budget. The rename landed before the new integration code so that Phases 115–122 only had to target one vocabulary. The lesson — rename before extending, not after — became a standing operational rule for subsequent milestones.

**Weighted composite scoring gave promotion decisions a transparent rubric.** The promotion detector in Phase 117 assigns each candidate a score from three components: determinism at forty percent, frequency at thirty-five percent, token savings at twenty-five percent. Each weight is a single number in a config file, not an opaque learned parameter. Every promotion carries the three sub-scores and the final composite in its audit trail, so an operator looking at a surprise promotion can see which dimension drove the decision. The split is a first-pass engineering assertion, not a tuned value — the release philosophy was "make the rubric visible, then tune," not "tune first." The gate thresholds in Phase 119 add a second layer: F1, accuracy, and Matthews correlation coefficient from the v1.2 and v1.9 calibration harness must all clear configured minimums before the script emits. No single metric can overrule the others; no metric is hidden.

**The three-tier determinism classification is the conceptual contribution of the release.** Phase 116's DeterminismAnalyzer does not return a boolean. It returns one of three tags: deterministic (same input produces same output across every captured run), semi-deterministic (same side effects but outputs differ in non-semantic ways like timestamps or ordering), and non-deterministic (outputs differ in content). Binary classification — which was the obvious first design — loses the middle tier, and the middle tier is where most real tool invocations live. A git status call produces different output each run but the same side-effect shape; an ls -la call varies with modification times but has consistent structure. Promoting those as strictly deterministic would miss; refusing them as non-deterministic would over-reject. Semi-deterministic lets the analyzer classify them correctly and lets the gatekeeper apply a different threshold set. The taxonomy is the work; the code is the embodiment.

**Drift monitoring plus automatic demotion made promotion a reversible decision.** A promoted script is not a tattoo. Phase 120's DriftMonitor continues to compare post-promotion outputs against the captured baseline and triggers demotion when variance crosses threshold. The FeedbackBridge at Phase 120-02 closes the outer loop by funneling user corrections back into the pattern store so that demotion is visible to the learning track, not a silent downgrade. Without the drift monitor, promotion would be a one-way ratchet — every incorrect promotion would stay promoted until someone noticed by hand. With it, promotion is an operating regime with a feedback signal, not a gate. This pattern carried forward: v1.15's live dashboard terminal exposed drift events in the session stream; v1.42's TDD pipeline inherited the dry-run-then-monitor discipline; the pattern-store schema has not had to change since.

**The LineageTracker gave the pipeline an auditable substrate.** Every artifact in the promotion flow — an observation, a detected pattern, a promotion candidate, a generated script, a gate decision, a drift event — carries a type tag and a parent link. The tracker walks the links in both directions: upstream (from a promoted script to the observations that justified it) and downstream (from an observation to the scripts it shaped). Cycle safety, type filtering, and barrel exports landed in Phase 121-02 with the getByArtifactType method and a visited-set that includes the starting node so self-reference does not explode the walk. The tracker fed three dashboard collectors in Phase 122 — PipelineStatus, DeterminismView, LineageView — which themselves fed the v1.15 live dashboard. The lineage graph is not decorative. It is the mechanism by which a human operator (or a later learning track, or an audit) can answer "why was this script emitted" without reading the commit log.

**The eight-phase span for a linear flow is a known cost of integration.** Capture then Analyze then Score then Generate then Gate then Monitor then Track then Display is eight steps; each got a phase; each phase had two plans on average. A faster project would have compressed this into three or four phases with multiple deliverables each. v1.14 did not compress, because each step had to land test-first and barrel-export cleanly so the next phase's plan could import it. The cost paid for that discipline was real: phase-granularity overhead (plan files, verification loops, commit overhead) for work that could have been one design document and a single integration PR. The benefit paid back immediately: v1.15 picked up the dashboard collectors as-is with no refactor; v1.17's staging layer wired into the promotion gatekeeper without a schema change; the memory-arena work on artemis-ii inherited the lineage graph shape when it needed its own provenance tracking.

**Overlapping metrics surface was a known design debt, accepted.** The gatekeeper uses F1, accuracy, and MCC — the same metrics the v1.2 test infrastructure uses for its own gating, and the same metrics v1.9's evaluator-optimizer uses for plan scoring. Three systems now compute overlapping quality metrics for different purposes. A unified metrics module would be cleaner; v1.14 chose not to build it because the unifying refactor would block the integration release. The debt was recorded in the retrospective; a consolidation lives in the backlog as a future metrics module that all three consumers would import from. For now the duplication is intentional, documented, and tracked.

## Key Features

| Area | What Shipped |
|------|--------------|
| Execution capture (Phase 115) | `pairToolExecutions()` pairs tool_use / tool_result events; `ExecutionCapture` pipeline stores paired records with SHA-256 content hashes for cross-session comparison; structured capture format with timestamps and metadata |
| Determinism analyzer (Phase 116) | `DeterminismAnalyzer` with variance scoring and configurable thresholds per tool type; three-tier classification `deterministic` / `semi-deterministic` / `non-deterministic`; cross-session comparison for stability assessment |
| Promotion detector (Phase 117) | `PromotionDetector` identifies candidates from pattern store; weighted composite scoring — determinism 40%, frequency 35%, token savings 25%; tool filtering and confidence filtering; candidate ranking with evidence trail |
| Script generator (Phase 118) | `ScriptGenerator` with tool-to-bash mapping and metadata headers; dry-run validation and output comparison before script emission; Blitter/Offload operation conformance for execution integration; barrel exports |
| Promotion gatekeeper (Phase 119) | `PromotionGatekeeper` with calibration-metric threshold checking (F1, accuracy, MCC) wired from v1.2/v1.9 harness; auditable decision trail for every promote/reject call; decision-logic unit tests |
| Drift monitor + feedback bridge (Phase 120) | `DriftMonitor` with post-promotion variance monitoring and automatic demotion on output divergence; `FeedbackBridge` connecting user corrections in the pattern store to promotion decisions; barrel-exported feedback types |
| Lineage tracker (Phase 121) | `LineageTracker` with bidirectional provenance querying (upstream + downstream walks); `getByArtifactType()` filter; cycle and self-reference safety via starting-artifact visited-set; barrel exports from the observation module |
| Dashboard collectors (Phase 122) | `PipelineStatusCollector` reads PatternStore to count artifacts per stage; `DeterminismViewCollector` delegates to `DeterminismAnalyzer.classify()` with per-operation breakdown; `LineageViewCollector` traces promotion paths and builds chronologically-ordered graphs; barrel exports for all three |
| Terminology cleanup (opening commits) | Copper → Pipeline rename across learning, activation, compiler, parser, executor, schema, lifecycle-sync, types; Blitter → Offload rename in executor, promoter, signals, types; DMA → Budget rename in budget module; chip-definition → engine-terminology rename in teams |
| Type-strict fix-up | Strict-mode type errors resolved across six files; dashboard type definitions added for `PipelineStatusView`, `DeterminismRow`, `DeterminismViewData`, `LineageNode`, `LineageGraphEntry`, `LineageViewData` |
| Dashboard live server | SSE auto-refresh for the dashboard live server; horizontal tab bar replacing broken sidebar nav; UX cleanup layer for 1080p readability; chart replacements with proper visualizations |
| `.gitignore` fix | `dashboard/` pattern was blocking `src/dashboard/` source tree; narrowed the pattern so source is tracked and only generated dashboard output is ignored |

## Retrospective

### What Worked

- **Connecting five isolated subsystems into a single pipeline is genuine integration work.** Blitter/Offload, Pipeline Learning, Observation, Calibration, and Pattern Detection existed independently. This release wired them into a promotion flow with data moving from capture through analysis to promotion to display without manual glue code.
- **Weighted composite scoring makes promotion decisions transparent.** Determinism 40%, frequency 35%, token savings 25%. Each factor has a weight, each promotion has a score, each score has evidence. No opaque ML; a human can audit any decision by reading three numbers and the commit that set them.
- **Automatic demotion via the drift monitor prevents promoted scripts from going stale.** Promotion is not a permanent decision. If a script's behavior diverges from expected, it gets demoted without human intervention and the demotion is logged as a lineage event.
- **Full lineage tracking (observation → pattern → promotion → script) with bidirectional querying makes the pipeline auditable.** You can trace any promoted script back to the observations that justified it, or walk forward from an observation to the scripts it influenced. Cycle safety and type filtering landed in the same phase so the walk is total.
- **Test-first held across all 16 plans.** Every feature phase had a paired `test(...)` commit before the corresponding `feat(...)` commit. The fixture for "failing test first" was never skipped; this is visible in the commit log and prevented silent regressions when collectors were wired to real data sources.
- **The Copper/Blitter/DMA rename landed before the new integration code.** Ordering the terminology refactor ahead of Phase 115 meant the eight-phase integration wave only had to target the new vocabulary. Landing it after would have doubled review cost.

### What Could Be Better

- **Eight phases for a fundamentally linear flow is a lot of phase overhead.** Capture → Analyze → Score → Generate → Gate → Monitor → Track → Display is a pipeline; each step became its own phase with its own plan and commit sequence. A more experienced integration project would have compressed this into three or four phases.
- **F1/accuracy/MCC calibration metrics as gate criteria overlap with v1.2's test infrastructure metrics.** The evaluator-optimizer from v1.9 also uses these metrics. Three systems now compute overlapping quality metrics for different purposes; a unified metrics module is still in the backlog.
- **The 40/35/25 composite weights are assertions, not measurements.** The release ships the rubric and the evidence trail but not a calibration of the weights against observed promotion quality. Later milestones will need to tune against real promotion outcomes.
- **Dry-run validation covers output shape but not semantic equivalence.** A generated bash script that produces the same text as the original tool call passes dry-run even if the tool call's downstream effect is different. The semantic-equivalence check is future work; dry-run is a necessary but not sufficient gate.

## Lessons Learned

1. **Three-tier determinism classification is the right granularity.** Binary (deterministic / non-deterministic) would miss semi-deterministic operations — commands that produce different output but the same side effects. More tiers would be noise. Three tiers is the minimum that preserves the useful distinction and the maximum that an operator can hold in their head while reading a classification table.
2. **Dry-run validation before script creation prevents generating broken scripts.** The cost of a failed dry run is negligible — one execution, one comparison, no commit. The cost of promoting a broken script is a regression that erodes trust in the automation and a demotion event that the team has to investigate. The one-to-many cost ratio means dry-run is the cheapest test in the pipeline, and it runs every time.
3. **Dashboard collectors for pipeline status bring promotion visibility into the existing dashboard.** Rather than building a new UI, the promotion pipeline feeds into the v1.12 and v1.12.1 dashboard infrastructure. Integration over invention. The collectors are plain-data objects; the rendering layer did not need to know about promotion at all.
4. **Rename before extending, not after.** The Copper/Blitter/DMA terminology rename landing ahead of Phases 115 through 122 let the integration wave target one vocabulary. Landing it after would have required a second rename pass across the new code. This is a general rule: batch the vocabulary shift, then build on top of the stable names.
5. **The weighted composite is the right shape for promotion scoring.** Determinism, frequency, and token-savings are orthogonal; each covers a distinct failure mode (promoting flaky tools, promoting one-off tools, promoting tools that save nothing). The 40/35/25 split is a first guess, but the shape is the contribution — other weightings are tunable parameters, not schema changes.
6. **Reversible automation requires a monitor and a feedback bridge.** Promotion without a demotion path is a one-way ratchet. The DriftMonitor + FeedbackBridge pair keeps promotion in a regulated regime: anything that drifts too far gets pulled back, and user corrections route into the signal that drives the next decision.
7. **Lineage with cycle safety and type filtering should ship together.** A provenance graph without cycle safety explodes on pathological inputs; a provenance graph without type filtering forces every consumer to re-implement the filter. Shipping both at Phase 121-02 meant the dashboard collectors in Phase 122 could import one API and not special-case their walks.
8. **Overlapping metrics across subsystems is an acceptable intermediate state.** F1, accuracy, and MCC are computed in v1.2 (test infrastructure), v1.9 (evaluator-optimizer), and v1.14 (gatekeeper). The right long-term answer is a shared metrics module; the right short-term answer is to accept the duplication and document the debt rather than block the integration release on the refactor.
9. **Eight phases for a linear flow is a known cost, not an error.** Each phase ships testable, barrel-exported, reviewable work. The phase overhead is the price of test-first discipline at the granularity the project chose. The compression opportunity is real but would have traded reviewability for speed; v1.14 kept the discipline.
10. **Auditable decision trails are cheaper to build than to retrofit.** Every promote/reject carries evidence of the composite score and the gate thresholds that applied. Adding the evidence field at Phase 119 cost almost nothing; adding it after a year of promotions would have meant reconstructing history from commit context.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Root — the 6-step adaptive loop (Observe → Detect → Suggest → Apply → Learn → Compose) that v1.14 closes between Observe and Apply via promotion |
| [v1.2](../v1.2/) | Test Infrastructure — source of the F1/accuracy/MCC metrics the gatekeeper imports |
| [v1.5](../v1.5/) | Pattern Discovery — shaped the pattern store that the promotion detector reads |
| [v1.7](../v1.7/) | GSD Master Orchestration Agent — orchestrator that invokes promoted scripts through the Offload (formerly Blitter) layer |
| [v1.8](../v1.8/) | Capability-Aware Planning + Token Efficiency — token-savings component of the composite score was shaped by v1.8's token accounting |
| [v1.9](../v1.9/) | Ecosystem Alignment & Advanced Orchestration — evaluator-optimizer uses the same F1/accuracy/MCC metrics the gatekeeper gates on |
| [v1.10](../v1.10/) | Security Hardening — JSONL checksums and the sanitized pattern store are the substrate the lineage tracker walks |
| [v1.12](../v1.12/) | GSD Planning Docs Dashboard — dashboard infrastructure the Phase 122 collectors plug into |
| [v1.12.1](../v1.12.1/) | Live Metrics Dashboard — the live display layer that consumes the new pipeline collectors |
| [v1.13](../v1.13/) | Predecessor — Session Lifecycle & Workflow Coprocessor; v1.14 integrates on top of its session capture |
| [v1.15](../v1.15/) | Successor — Live Dashboard Terminal; inherits the three v1.14 collectors without refactor |
| [v1.17](../v1.17/) | Staging Layer — analysis, scanning, resource planning wired into the promotion gatekeeper |
| [v1.42](../v1.42/) | Dogfood Mission — reuses the dry-run-then-monitor discipline established here |
| [v1.44](../v1.44/) | Downstream consumer of the F1/accuracy/MCC gate pattern |
| `.planning/MILESTONES.md` | Full Phase 115–122 detail: plans, verification, commit manifest |
| `src/dashboard/collectors/` | `pipeline-status.ts`, `determinism-view.ts`, `lineage-view.ts` — three collectors shipped here |
| `src/observation/lineage-tracker.ts` | Bidirectional provenance tracker, cycle-safe, type-filterable |
| `docs/FEATURES.md` | Updated to describe the promotion pipeline as an integrated flow |

## Engine Position

v1.14 is the project's first integration-focused release and closes the gap between observation and execution that the v1.0 loop had always implied but never automated. Before v1.14, a user correction or repeated tool sequence lived in the pattern store as information; after v1.14, it lived there as potential action, with a detector, a scorer, a generator, a gate, a monitor, and a provenance trail that together decide whether to promote it to an executable script. The integration is load-bearing for every subsequent milestone that involves automating tool sequences: v1.15's live dashboard terminal exposed the pipeline events in real time; v1.17's staging layer plugged its resource checks into the gatekeeper; v1.30's vision-to-mission pipeline used the same dry-run-then-monitor pattern for mission-package generation; v1.42's dogfood mission used the drift monitor to catch regressions in the extraction pipeline; the memory-arena work on artemis-ii inherited the lineage-graph shape when pattern journaling needed its own provenance tracking. The 40/35/25 composite, the three-tier determinism taxonomy, the F1/accuracy/MCC gate, and the reversible-promotion discipline are all v1.14 primitives that later releases reuse by importing rather than reinventing. The eight-phase span is long for what v1.14 shipped, but the artifacts it produced have not needed a re-design since — which is the durable test for an integration release.

## Files

- `src/dashboard/collectors/pipeline-status.ts` — reads PatternStore to count artifacts per promotion stage; sortable by any field; plain-data output (131 lines)
- `src/dashboard/collectors/determinism-view.ts` — delegates to `DeterminismAnalyzer.classify()` for per-operation breakdown; plain-data output (59 lines)
- `src/dashboard/collectors/lineage-view.ts` — traces promotion paths via LineageTracker chains; chronological ordering; `getArtifactChain()` lookup; graceful missing-data handling (210 lines)
- `src/dashboard/collectors/index.ts` — barrel exports for the three collectors (18 lines)
- `src/observation/lineage-tracker.ts` — bidirectional provenance tracker with type filtering and cycle safety; starting-artifact visited-set prevents self-reference blowup
- `src/observation/index.ts` — barrel-exports `LineageTracker` and all lineage types from the observation module
- `src/types/dashboard.ts` — adds `PipelineStatusView`, `DeterminismRow`, `DeterminismViewData`, `LineageNode`, `LineageGraphEntry`, `LineageViewData` type definitions
- `src/chipset/copper/` → Pipeline rename (learning, activation, compiler, parser, executor, schema, lifecycle-sync, types)
- `src/chipset/blitter/` → Offload rename (executor, promoter, signals, types)
- `src/chipset/exec/dma-budget.ts` → Budget rename; `src/chipset/teams/chip-registry.ts` → engine-terminology rename
- `serve-dashboard.mjs` — live server with SSE auto-refresh
- `.gitignore` — narrowed `dashboard/` pattern so `src/dashboard/` source is tracked; only generated dashboard output is ignored
- `docs/FEATURES.md`, `docs/RELEASE-HISTORY.md`, `docs/REQUIREMENTS.md` — documentation refresh for v1.8–v1.13 catch-up and v1.14 additions
- `.planning/MILESTONES.md` — canonical Phase 115–122 plan-by-plan detail (16 plans, 27 requirements, 32 phase-scoped commits within the 51-commit release window)
