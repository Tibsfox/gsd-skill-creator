# v1.17 — Staging Layer

**Released:** 2026-02-13
**Scope:** feature — a staging pipeline between human ideation and machine execution, with scanning, trust-weighted reporting, intake routing, resource analysis, derived-knowledge checking, and a pre-wired queue
**Branch:** dev → main
**Tag:** v1.17 (2026-02-13T15:47:37-08:00) — "Staging Layer"
**Predecessor:** v1.16 — Dashboard Console & Milestone Ingestion
**Successor:** v1.18 — Information Design System
**Classification:** feature release — first end-to-end "intake → execution" path
**Phases:** 134–141 (8 phases) · **Plans:** 35 · **Requirements:** 38
**Stats:** 83 commits · 20,888 LOC staging module · 699 tests across 35 test files
**Verification:** staging directory + schema round-trip · hygiene scanners exercised against embedded-instruction, hidden-content, and YAML config corpora · trust tier decay computed on seeded trust store · intake flow crash-recovery via step tracker · resource manifest generated end-to-end from vision doc · derived-knowledge provenance + phantom-content + scope-drift + copying-signal detectors covered · 7-state queue transitions audit-logged · pre-wiring engine produces all 5 topology types · dashboard panel renders queue with SVG dependency overlay

## Summary

**v1.17 defines the seam between human ideation and machine execution.** The v1.12–v1.16 arc built a dashboard that could *show* planning state and a console that could *act* on it. v1.17 answers the upstream question: how does a unit of work *become* a phase in the first place? The answer is a staging layer — a filesystem-backed pipeline where raw ideation is classified, scanned, trust-weighted, broken down into requirements, matched to existing skills, given a topology recommendation, budgeted, checked for phantom content, queued, and pre-wired into an execution plan before anything reaches the parallel execution surface. Eight phases (134–141), thirty-five plans, thirty-eight requirements, eighty-three commits, and six hundred and ninety-nine tests later, the new `src/staging/` module ships at 20,888 lines of code as a complete intake path with two coordinated state machines, four scanner families, four familiarity tiers, five topology types, seven queue states, and a dashboard panel that surfaces all of it in one view.

**The 5-state staging pipeline is a filesystem that doubles as a UI.** Phase 134 shipped the staging foundation as `.planning/staging/` with state-named subdirectories: `inbox/`, `checking/`, `attention/`, `ready/`, and `aside/`. Each staged item lives as a directory under its current state, with a companion metadata file capturing source, timestamps, and state transitions. `listStagingItems()` walks the directory tree; `moveStagingItem()` renames across state directories atomically. The key design decision is that the states *are* directories — `ls .planning/staging/attention/` tells you exactly which items need a human eye, no CLI needed. The state-machine transitions in `src/staging/state-machine.ts` enforce legal moves (you cannot go `inbox → ready` without passing through `checking`); the schema in `src/staging/schema.ts` validates companion metadata via Zod before any handler trusts a field. This inherits the v1.10 safe-deserialization discipline and the v1.0 append-only-JSONL-as-primitive philosophy: the simplest durable thing that survives a crash is a directory tree with typed metadata, and everything else builds on it.

**The hygiene engine treats adversarial content as a first-class input.** Phase 135 shipped a three-scanner family in `src/staging/hygiene/` addressing the three realistic attack surfaces on an AI ingestion pipeline: embedded-instruction injection, hidden content (zero-width characters, invisible markers, obfuscated whitespace), and unsafe YAML configurations. The scanner interface is uniform — `scan(content, context) → Finding[]` — and eleven built-in patterns across the three categories ship in the initial registry. The unified scan engine in `src/staging/hygiene/scan-engine.ts` composes them into a single pass with per-finding severity (info, warning, critical) and per-pattern provenance (which scanner, which rule). This is deliberately a starting set rather than an exhaustive one — the point is the *shape* of the pattern registry, not the completeness of the catalog. New patterns can be added as first-class records without touching the scanner plumbing, which is the real test the hygiene engine has to pass.

**Trust is a decaying scalar, not a boolean.** Phase 136 shipped the trust-aware reporting layer in `src/staging/hygiene/trust/`: four familiarity tiers (Home for your own code, Neighborhood for close collaborators, Town for the organization, Stranger for external or unknown origin), a trust-decay store that reduces trust over time for infrequently-accessed sources, and a finding-actions module that filters hygiene reports based on the tier of the source. Critical hygiene patterns lock out before reaching execution regardless of trust tier — that is the hard boundary. Below critical, the report is weighted: a warning in Home code is informational; the same warning in Stranger code is a gate. This is the design that keeps the system usable when most content is trusted while staying defensive when it is not. The decay function is linear in days since last access, capped to a per-tier minimum; the scope/privilege coherence checker in `src/staging/hygiene/trust/coherence.ts` cross-checks tier against the privileges requested by a hygiene finding (a Stranger-tier file requesting write access to `.planning/` gets flagged regardless of content).

**The smart intake flow routes work by clarity, not by size.** Phase 137 shipped the three-path intake router in `src/staging/intake-flow/`: a clarity assessor classifies incoming content into one of three states — clear (proceeds directly to resource analysis), gaps (enters a questioning loop until the gaps are closed), or confused (kicks off a research pipeline before re-entering intake). The orchestrator in `src/staging/intake-flow/orchestrator.ts` composes the clarity assessor with a step tracker that persists intake state to disk after each step, so a browser crash or session timeout does not lose partially-completed intake work. The step tracker is the feature that makes smart intake resumable — every decision-point writes a record, and every re-entry reads the last record and picks up from the same step. This becomes critical when the resource analysis step (Phase 138) starts doing real computation over large vision documents; losing five minutes of analysis to a dropped WebSocket would be a non-starter. Deterministic routing means the same input reaches the same path regardless of which operator triggers the intake — no hidden configuration, no per-session state.

**Resource analysis converts vision documents into executable manifests.** Phase 138 shipped the resource-analysis submodule in `src/staging/resource/` — a vision-document analyzer that extracts requirements and scope, a skill cross-reference matcher that pairs requirements with existing `.claude/skills/` capabilities, a topology recommender that proposes one of five execution shapes (single, pipeline, map-reduce, router, hybrid) based on work complexity, a token-budget estimator, and a work decomposer that turns a vision into a structured manifest. The manifest is the hand-off contract between intake and the queue: everything the queue needs to pre-wire execution is on the manifest, and the manifest is schema-validated at the boundary. The `intake-bridge.ts` module connects the intake flow's output to the resource-analysis input, preserving the step-tracker state across the boundary so the same "pick up where we left off" guarantee holds end-to-end. Skill matching is a cross-reference lookup, not a fuzzy match — an explicit requirement that mentions an unknown skill produces a gap, not a guess.

**Derived-knowledge checking hardens the system against plausible-but-unsupported content.** Phase 139 shipped four detectors in `src/staging/derived/`: provenance-chain tracking (where did this knowledge come from, and is the chain intact back to a trusted source?), phantom-content detection (claims that are well-formed but have no supporting evidence in the provided sources), scope-drift detection (gradual requirement expansion between successive intake rounds), and copying-signal detection (verbatim content from external sources that should have been paraphrased or cited). Each detector is a pure function over the same `DerivedKnowledgeContext` value, which makes them trivially composable into the unified checker in `derived/index.ts`. The claim-level granularity matters — a single vision document can have clean provenance for 90% of its claims and a phantom 10%, and the report should call out the phantom claims specifically rather than rejecting the whole document. This is the quality gate that keeps the staging layer useful when the upstream source is an AI-generated draft or a scraped research summary.

**The 7-state queue adds an audit log to every state transition.** Phase 140 shipped the staging queue in `src/staging/queue/`: a 7-state machine (pending → analyzing → blocked → ready → executing → done → failed) with a file-backed append-only audit log, a cross-queue dependency detector that finds transitive blockers across multiple in-flight items, an optimization analyzer that identifies batching opportunities, parallel lanes, and shared setup across queued items, and a queue manager facade that wraps state transitions with automatic audit-log writes. The audit log is the non-negotiable piece — every transition (including failed transitions, re-tries, and manual overrides) writes a line to `.planning/staging/queue/audit.jsonl`, and the line format is stable enough to replay history into a reconstructed state. When something goes wrong in a 7-state machine, you need the full history, and the append-only file gives you that history for free. The dependency detector extends the v1.8 capability-aware planning work: instead of asking "can this phase run?", it asks "given everything else in the queue, when is this phase's earliest ready moment?"

**Queue pipelining closes the loop from staged idea to wired execution.** Phase 141 shipped the final three pieces: a pre-wiring engine (`src/staging/queue/pre-wiring.ts`, 325 lines) that converts a resource manifest into an execution plan covering all five topology types with round-robin skill distribution for pipeline and hybrid stages, a coordinator/worker split for map-reduce, and a skill-less router agent for the router topology; a retroactive hygiene audit recommender (`retroactive-audit.ts`, 217 lines) that identifies already-ready or already-queued entries that should be re-scanned when a new critical pattern lands in the registry; and the dashboard staging queue panel (`src/dashboard/staging-queue-panel.ts`, 410 lines) with a four-column kanban layout, per-state badge colors, and an SVG overlay that draws dependency lines between cards based on the client-side bounding-rect positions. The dashboard panel is what makes the staging layer legible — a single screen showing every in-flight item, its state, its blockers, and the pre-wired topology it will execute under. The final `feat(141-04)` commit added barrel-level integration tests proving that a manifest flows all the way through to a rendered SVG without any step dropping data.

**Test-first discipline was uniform across all eight phases and thirty-five plans.** Every plan in the release landed with a `test(N-M)` commit before the matching `feat(N-M)` commit — visible as pairs across the full 83-commit log (e.g. `test(135-02) 7bbe918bd` before `feat(135-02) 423cfd795` for the embedded-instruction scanner, `test(140-01) 6cb86314e` before `feat(140-01) 023b91104` for the queue core). Six hundred and ninety-nine tests across thirty-five test files is an average of just under twenty tests per plan — consistent with the 38-requirement scope (roughly eighteen tests per requirement). The test files are colocated with their sources following the v1.15 convention (`src/staging/queue/pre-wiring.test.ts` next to `src/staging/queue/pre-wiring.ts`), and no implementation commit landed without a preceding test commit. This matters not just for coverage but for archaeology: a future reader can `git show <test-sha>` to see the requirement as code before the implementation existed — a built-in requirement-to-test trace that needs no separate tooling.

## Key Features

| Area | What Shipped |
|------|--------------|
| Staging Foundation (Phase 134) | `src/staging/` with 5-state filesystem pipeline (`inbox → checking → attention → ready → aside`), state-named subdirectories under `.planning/staging/`, Zod schema for companion metadata (`schema.ts`), state machine (`state-machine.ts`), directory creation helpers (`directory.ts`), document intake (`intake.ts`) |
| Hygiene Engine — Patterns (Phase 135) | `src/staging/hygiene/` — 11 built-in patterns across 3 categories (embedded-instruction injection, hidden content, YAML config safety), unified scan engine (`scan-engine.ts`), embedded-instruction scanner, hidden-content scanner, YAML safety scanner, severity levels with per-finding provenance |
| Trust-Aware Reporting (Phase 136) | `src/staging/hygiene/trust/` — 4 familiarity tiers (Home/Neighborhood/Town/Stranger), linear trust decay store with per-tier floor, scope/privilege coherence checker, trust-filtered hygiene report generator, finding-actions module with critical-pattern lockout |
| Smart Intake Flow (Phase 137) | `src/staging/intake-flow/` — clarity assessor with 3-path deterministic routing (clear/gaps/confused), intake orchestrator composing clarity assessor with step tracker, step tracker for crash recovery (writes disk record per decision point), intake-flow barrel index |
| Resource Analysis (Phase 138) | `src/staging/resource/` — vision document analyzer, skill cross-reference matcher against `.claude/skills/`, topology recommender (single/pipeline/map-reduce/router/hybrid), token budget estimator, work decomposer, resource manifest generator, intake bridge connecting intake flow output to resource-analysis input |
| Derived Knowledge Checking (Phase 139) | `src/staging/derived/` — provenance chain tracker, pattern fidelity + phantom content detector, scope drift detector, copying signal detector, training pair coherence checker, unified derived-knowledge checker, claim-level granularity (partial-pass reports) |
| Staging Queue — Core (Phase 140) | `src/staging/queue/` — 7-state machine (`pending → analyzing → blocked → ready → executing → done → failed`), append-only JSONL audit logger (`audit-logger.ts`), cross-queue dependency detector, optimization analyzer (batching + parallel lanes + shared setup), queue manager facade wrapping transitions with automatic audit writes |
| Queue Pipelining — Wiring (Phase 141) | Pre-wiring engine (`pre-wiring.ts`, 325 lines) producing all 5 topology types, retroactive hygiene audit recommender (`retroactive-audit.ts`, 217 lines) with `ELIGIBLE_STATES` + `SEVERITY_ORDER`, dashboard staging queue panel (`src/dashboard/staging-queue-panel.ts`, 410 lines) with 4-column kanban + SVG dependency overlay |
| Staging Barrel Index | `src/staging/index.ts` — public surface re-exports (types, schema, state machine, hygiene, trust, intake-flow, resource, derived, queue, pre-wiring, retroactive-audit) so downstream consumers import from a single entry point |
| Integration Tests | `src/staging/queue/index.test.ts` — end-to-end tests: pre-wiring generates valid output from manifest, retroactive audit recommends for eligible entries, dashboard panel renders queue data with SVG |
| Test Coverage | 699 tests across 35 test files, red-green TDD rhythm uniform across all 8 phases and 35 plans |
| Documentation Surface | `.planning/STATE.md` updated with staging-layer checkpoint, staging module entry in `.planning/MILESTONES.md`, phase-level plan documents for 134–141 |

## Retrospective

### What Worked

- **The 5-state filesystem pipeline is a clean mental model.** `inbox → checking → attention → ready → aside` maps directly to human decision-making. State-named subdirectories make the pipeline physically visible: `ls .planning/staging/` tells you everything at a glance, no CLI required. Atomic moves across directories give legal-transition enforcement for free.
- **Trust-aware reporting with decay is the right security model for mixed-source inputs.** The four familiarity tiers (Home/Neighborhood/Town/Stranger) with linear trust decay over time avoid the failure mode of binary trust, where every source is either fully-trusted or fully-locked-out. Critical pattern lockout stays as the hard boundary; everything below critical is weighted by tier.
- **Derived knowledge checking catches phantom content at the seam.** Provenance-chain tracking, phantom-content detection, scope-drift detection, and copying-signal detection together address the specific failure mode of AI-assisted intake: generated content that looks authoritative but has no backing. Claim-level granularity means partial passes are possible — a 90%-clean document is salvageable, a 50%-phantom document is not.
- **699 tests across 35 files is a proportional scope.** More than double the v1.15 test count, consistent with an 8-phase security-critical release. The red-green TDD rhythm (every `feat` preceded by a `test`) caught the 141-03 test-regex regression before it shipped and kept 140-02's dependency detector honest across its refactor.
- **Pure functions at the detector layer compose cleanly.** The four derived-knowledge detectors all take the same `DerivedKnowledgeContext` input and return findings; the unified checker is literally `concat(...detectors.map(d => d(ctx)))`. Adding a fifth detector is a new file and a line in the unified checker — no plumbing to update.
- **Append-only audit logs make the 7-state queue debuggable.** When something goes wrong, you replay the log. There is no "but what was the state at 14:32?" question because the log is the state, and every transition is a line.

### What Could Be Better

- **Two state machines in one release is a lot to absorb.** The staging pipeline (5 states) and the queue (7 states) are both introduced here, and the exact moment at which a staged item transitions from the pipeline into the queue is implicit in the intake-bridge code rather than explicit in the release notes. A future revision should add a single diagram that shows both state machines and the bridge between them.
- **11 hygiene patterns is a starting set, not a complete catalog.** The three categories (injection, obfuscation, unsafe config) cover the obvious adversarial cases, but novel attack vectors emerge as attackers adapt. The real test of the pattern registry is how easy it is to *add* new patterns, and that ergonomics story has not yet been exercised in practice.
- **Trust decay parameters are hard-coded constants.** The linear-decay function, the per-tier floors, and the default tier for unknown sources are all baked into `src/staging/hygiene/trust/decay.ts` rather than being user-configurable. This is the right v1.17 decision (shipping beats tuning) but a future milestone should expose these as configuration so teams can calibrate to their own trust distributions.
- **The dashboard panel's SVG dependency lines are client-side positioned.** The lines are drawn by a small client-side script reading card bounding rects after layout. This works for the first render but can shimmer on resize and is a known friction point for the v1.18 information-design work. A server-computed layout (or a CSS grid with deterministic positions) would be more robust.
- **Pre-wiring's topology selection heuristic is simple.** The topology recommender picks from five options based on a small complexity score; the recommendation is not always the best fit for work with heterogeneous steps. v1.25's ecosystem integration DAG work will need to revisit the heuristic to handle multi-stage pipelines with per-stage topology preferences.

## Lessons Learned

1. **The staging pipeline is the system's front door; model it like one.** A file-system-as-UI where each state is a directory gives operators immediate legibility — `ls` is the dashboard. Every future subsystem with multiple resting states should consider whether the state *is* the directory before reaching for a database.
2. **Two state machines require a bridge that is itself a testable artifact.** The intake-bridge between the 5-state pipeline and the 7-state queue is a small file (`src/staging/resource/intake-bridge.ts`) with its own tests; without it the two machines would drift into incompatibility. Always name the bridge.
3. **Trust is a scalar with decay, not a boolean.** Binary-trust models fail closed too often or fail open too often; a decaying scalar with tier floors and a hard critical lockout threads both needles. The same pattern should apply anywhere the system ingests content of varied provenance.
4. **Three-path clarity routing reduces decision fatigue.** Clear / gaps / confused lets the system self-select its processing depth — fast-track when the input is unambiguous, questioning loop when gaps are surface, research pipeline when confusion runs deep. No single path handles everything, and forcing one always wastes effort somewhere.
5. **Append-only audit logs are non-negotiable for staging systems.** Every state transition writes a JSONL line; the log replays to reconstruct state. Debugging a 7-state machine without a full history is a category error; the log is the history for free.
6. **Crash recovery with step-tracker resumability is essential for multi-step intake.** When the resource-analysis step does real computation over large vision documents, a dropped connection cannot cost the operator that work. Every multi-step flow should persist per-step state to disk and resume from the last write.
7. **Pure-function detectors compose into a unified checker without plumbing.** The derived-knowledge module is four detectors that share a context type and return findings; the unified checker is a concatenation. Adding a fifth detector requires no plumbing, no registration, no event bus — just a new file and a line in the composite. This is the shape every new-type-of-check subsystem should take.
8. **Claim-level granularity beats document-level verdicts.** A 90%-clean vision document is usable with 10% flagged; a document-level pass/fail would either reject the whole thing or admit the phantom 10%. Granularity at the unit of trust is what makes the report actionable rather than pejorative.
9. **Test-first TDD with paired commits scales to 35 plans.** Every plan across the release shows a `test(N-M)` commit before its `feat(N-M)` commit. This makes requirement-to-test archaeology a `git show` away and catches regressions during refactors (141-03 test-regex fix caught by the pre-existing failing tests). The rhythm cost nothing and saved multiple incidents.
10. **The staging layer is the first-class extension point for future work.** v1.18 will consume the panel via the information-design system, v1.24 will audit-log the staging conformance boundary, and v1.46 will extend the step-tracker JSONL logger to pipeline-wide rollback/recovery. Building the staging layer with clean extension seams at v1.17 is what makes those follow-ons small.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Foundation — append-only JSONL primitive that the staging queue's audit log inherits, and `.planning/` convention that `.planning/staging/` extends |
| [v1.8](../v1.8/) | Capability-Aware Planning — the dependency model that v1.17's cross-queue dependency detector extends with in-flight awareness |
| [v1.10](../v1.10/) | Security Hardening — Zod schema-first parsing discipline that `src/staging/schema.ts` and the trust-store schemas inherit |
| [v1.11](../v1.11/) | GSD Integration Layer — composite configuration shape that the staging module's runtime config plugs into |
| [v1.12](../v1.12/) | GSD Planning Docs Dashboard — the dashboard body that the staging queue panel (v1.17 Phase 141) adds a panel to |
| [v1.13](../v1.13/) | Session Lifecycle & Workflow Coprocessor — the session boundaries that trust-decay timestamps anchor against |
| [v1.14](../v1.14/) | Promotion Pipeline — upstream "what is ready to promote?" pipeline that the staging layer feeds |
| [v1.15](../v1.15/) | Live Dashboard Terminal — colocated-tests convention and `Promise.allSettled` independent-lifecycle pattern inherited by the queue manager |
| [v1.16](../v1.16/) | Dashboard Console & Milestone Ingestion — immediate predecessor; v1.16's ingestion surface is what v1.17 formalizes as the staging pipeline |
| [v1.18](../v1.18/) | Information Design System — immediate successor; the shape+color encoding the staging queue panel conforms to |
| [v1.19](../v1.19/) | Budget Display Overhaul — consumes v1.17's token-budget estimator output |
| [v1.20](../v1.20/) | Dashboard Assembly — unified CSS pipeline that normalizes the staging queue panel styling alongside other panels |
| [v1.24](../v1.24/) | GSD Conformance Audit — extends the audit-log discipline from staging transitions to conformance checkpoints |
| [v1.25](../v1.25/) | Ecosystem Integration — revisits the topology recommender heuristic for multi-stage pipelines with per-stage topology preferences |
| [v1.38](../v1.38/) | SSH Agent Security — CVE-informed staging scanner that extends v1.17's hygiene engine with supply-chain patterns |
| [v1.46](../v1.46/) | Pipeline logger with rollback/recovery — direct extension of v1.17's step-tracker JSONL pattern |
| `src/staging/` | Full staging module — 20,888 LOC across 8 subdirectories (directory/schema/state-machine/intake, hygiene, intake-flow, resource, derived, queue) |
| `src/staging/queue/` | Queue core — types, state machine, audit logger, dependency detector, optimization analyzer, manager facade, pre-wiring, retroactive-audit |
| `src/staging/hygiene/` | Hygiene engine — pattern registry, embedded-instruction scanner, hidden-content scanner, YAML safety scanner, scan engine, trust-filter layer |
| `src/dashboard/staging-queue-panel.ts` | 4-column kanban panel with SVG dependency overlay (410 lines) |
| `.planning/staging/` | Filesystem pipeline — `inbox/`, `checking/`, `attention/`, `ready/`, `aside/` with companion metadata |
| `.planning/staging/queue/audit.jsonl` | Append-only audit log for every queue state transition |
| `.planning/MILESTONES.md` | Canonical phase-by-phase detail for phases 134–141 |

## Engine Position

v1.17 sits at the seam between the v1.12–v1.16 "dashboard becomes a workstation" arc and the v1.18–v1.25 "system becomes a platform" arc. The v1.12 dashboard showed state; the v1.13 session lifecycle and v1.14 promotion pipeline made it actionable; the v1.15 embedded terminal and v1.16 dashboard console gave it hands and a voice; v1.17 adds the front door — a path by which new work *enters* the system before it can be acted on. Every release downstream builds on this door. v1.18's information-design system encodes the shapes the staging queue panel uses. v1.19 and v1.20 normalize the panel's styling alongside other panels. v1.24 extends the audit-log discipline from staging transitions to full GSD conformance checkpoints. v1.25's ecosystem-integration DAG revisits the topology recommender. v1.38's CVE-informed staging scanner extends the v1.17 hygiene pattern registry with supply-chain patterns. v1.46's pipeline logger generalizes the step-tracker JSONL pattern to rollback/recovery across the whole pipeline. The staging module is also the first release where all four quality dimensions of the system (schema, trust, provenance, state) are unified under one subsystem — a pattern that becomes the template for later self-contained modules (citation in v1.36, electronics in v1.29, SSH agent in v1.38). The `.planning/staging/` directory and the `src/staging/` module both remain load-bearing at v1.49.

## Files

- `src/staging/directory.ts` + `directory.test.ts` — `.planning/staging/` directory creation with state subdirectories
- `src/staging/schema.ts` + `schema.test.ts` — Zod schema for companion metadata
- `src/staging/state-machine.ts` + `state-machine.test.ts` — 5-state pipeline transitions
- `src/staging/intake.ts` + `intake.test.ts` — document intake with companion metadata
- `src/staging/types.ts` + `types.test.ts` — shared staging types
- `src/staging/hygiene/` — pattern registry, scan engine, embedded-instruction / hidden-content / YAML safety scanners, trust-filter layer, finding-actions
- `src/staging/hygiene/trust/` — familiarity classifier, trust-decay store, scope/privilege coherence checker, trust-filtered report
- `src/staging/intake-flow/` — clarity assessor, step tracker (crash recovery), orchestrator, barrel index
- `src/staging/resource/` — vision analyzer, skill matcher, topology recommender, token-budget estimator, work decomposer, manifest generator, intake bridge
- `src/staging/derived/` — provenance-chain tracker, phantom-content + pattern-fidelity detector, scope-drift detector, copying-signal detector, training-pair coherence checker, unified checker
- `src/staging/queue/types.ts`, `state-machine.ts`, `audit-logger.ts`, `dependency-detector.ts`, `optimization-analyzer.ts`, `manager.ts`, `pre-wiring.ts`, `retroactive-audit.ts`, `index.ts` — queue core + wiring
- `src/dashboard/staging-queue-panel.ts` + `staging-queue-panel.test.ts` — 4-column kanban, per-state badges, SVG dependency overlay (410 lines)
- `src/staging/index.ts` — public barrel re-exports across the whole module
- `.planning/staging/` — filesystem pipeline (`inbox/`, `checking/`, `attention/`, `ready/`, `aside/`)
- `.planning/staging/queue/audit.jsonl` — append-only audit log for queue transitions
- `.planning/MILESTONES.md` — canonical phases 134–141 detail (35 plans, 38 requirements)

## Version History (preserved from original release notes)

The v1.17 tag is part of the v1.x line that extends the v1.0 adaptive learning loop. The table below is the line as it stood at v1.17 release time, retained for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.17** | Staging Layer — filesystem pipeline, hygiene engine, trust tiers, smart intake, resource analysis, derived-knowledge checking, 7-state queue, pre-wiring (this release) |
| **v1.16** | Dashboard Console & Milestone Ingestion |
| **v1.15** | Live Dashboard Terminal |
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
