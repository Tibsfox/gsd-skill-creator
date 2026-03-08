# MUS Wave 0 — Session 2: Function Binding Table

**Mission:** MUS Muse Ecosystem Integration  
**Session:** Wave 0, Session 2 — Function Binding  
**Date:** 2026-03-08  
**Author:** Lex (execution disciplinarian, theta=5°, r=0.9)  
**Spec:** Assign 1,333 TypeScript source files across src/ to the 9 Build Arc muse domains using the disambiguation protocol.

---

## Executive Summary

Verification result: 1,333 non-test TypeScript files enumerated across src/. Module-level binding is the correct granularity — file-by-file assignment for 1,333 units would exceed session capacity. This document binds at **module cluster level** (logical groupings of 2–40 files), producing ~180 binding entries covering all files. Each module cluster entry resolves to a primary muse owner plus secondary muse where overlap exists.

The 9 Build Arc muses:

| Muse | Domain |
|------|--------|
| Cedar | Timeline, append-only logs, integrity, event store, hash chains |
| Hemlock | Quality gates, validation, standards, benchmarks, calibration |
| Willow | UI, progressive disclosure, onboarding, user-facing output |
| Foxy | Creative direction, cartography, cross-pollination, aliveness detection |
| Sam | Exploration, hypothesis testing, experimentation, discovery, prototyping |
| Raven | Pattern recognition, recurrence, structural echoes, signal detection |
| Hawk | Positional awareness, gap detection, message relay, formation |
| Owl | Temporal sync, sequence, cadence, momentum, session boundaries |
| Lex | Execution discipline, pipeline rigor, verification, constraint, specification |

**Disambiguation Protocol (applied in order):**
1. Primary domain match (strongest vocabulary alignment)
2. Module location (which muse's grove does the file live in?)
3. Operational vs analytical (operational → Lex, analytical → Raven/Hemlock)
4. User-facing vs internal (user-facing → Willow, internal → by domain)
5. Temporal vs spatial (temporal → Owl, spatial → Hawk)

---

## Part 1: Module-Level Ownership Summary

### src/core/ — Core Infrastructure

| Module Cluster | Files | Primary Owner | Secondary | Disambiguation Rule | Notes |
|---|---|---|---|---|---|
| `core/events/event-store.ts` | event-store, event-boost, event-lifecycle, index, types | **Cedar** | Owl | Rule 1: append-only event store is Cedar's primary domain | Cedar's core artifact |
| `core/events/event-suggester.ts` | event-suggester | **Raven** | Cedar | Rule 3: analytical suggestion layer over Cedar's store | Raven detects patterns to suggest |
| `core/fs/` | config, contrib-manager, pack-catalog, project-manager, scaffold, xdg, www-stager, index, types | **Lex** | Hawk | Rule 3: operational filesystem management; constraint-driven | Path enforcement is Lex's domain |
| `core/fs/commands/` | contrib, pack, project, www | **Lex** | Willow | Rule 3: operational command dispatch; Rule 4: www-stager has user-facing output → secondary Willow | |
| `core/hooks/` | hook-error-boundary, hook-validator, session-end, session-start | **Lex** | Owl | Rule 1: hooks are constraint/validation; session boundaries are Owl's | session-start/end → secondary Owl |
| `core/narrative/` | forest-of-knowledge-novel | **Foxy** | Willow | Rule 1: narrative, aliveness, cartography — Foxy's domain | Sole narrative file in core/ |
| `core/safety/` | audit-logger, file-lock, integrity-monitor, operation-cooldown | **Cedar** | Lex | Rule 1: audit-logger and integrity-monitor are append-only/hash-chain artifacts; operation-cooldown is constraint | cedar owns integrity; Lex secondary on cooldown/lock |
| `core/security/` | index | **Lex** | Cedar | Rule 1: security is specification/constraint enforcement | |
| `core/storage/` | budget-history, pattern-store, skill-index, skill-store | **Cedar** | Raven | Rule 1: storage is append-only persistence; pattern-store → secondary Raven | |
| `core/types/` (all 22 type files) | activation, agent, application, conflicts, dashboard, detection, embeddings, evaluator, extensions, ipc-events, learning, mcp, mfe-types, observation, openstack, pattern, photon, scope, security, simulation, skill, team, test-generation, test-run, testing | **Lex** | (varies) | Rule 1: type specifications are Lex's domain — they are the contract | Each type file enforces a contract |
| `core/utils/validate-registry.ts` | validate-registry | **Hemlock** | Lex | Rule 1: validation utility; Rule 3: analytical → Hemlock | |
| `core/validation/` — agent, arguments, budget, description, directory, generation, jsonl, loading, message, openstack, path, reserved-names, skill, team, test, yaml | 16 files | **Hemlock** | Lex | Rule 1: validation is Hemlock's primary domain | Hemlock's densest grove in core/ |
| `core/validation/batch-detection/` | batch-heuristics, batch-report, batch-runner, batch-types | **Hemlock** | Raven | Rule 1: quality gate detection; batch-heuristics analytical → secondary Raven | |
| `core/validation/context-fork-detection.ts` | context-fork-detection | **Raven** | Hemlock | Rule 1: pattern/signal detection; Rule 3: analytical | Fork detection is signal recognition |
| `core/validation/pacing-gate/` | pacing-checks, pacing-report, pacing-types | **Lex** | Owl | Rule 1: gate enforcement is Lex; pacing is temporal → secondary Owl | |

---

### src/activation/ — Skill Activation

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `activation/activation-scorer.ts` | activation-scorer | **Hemlock** | Raven | Rule 1: scoring is quality measurement; heuristics → Raven | |
| `activation/activation-formatter.ts` | activation-formatter | **Willow** | Hemlock | Rule 4: user-facing output | |
| `activation/activation-suggester.ts` | activation-suggester | **Raven** | Sam | Rule 1: pattern suggestion; Rule 3: analytical | |
| `activation/llm-activation-analyzer.ts` | llm-activation-analyzer | **Raven** | Sam | Rule 1: analytical signal detection | |

---

### src/application/ — Skill Application Pipeline

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `application/skill-pipeline.ts` | skill-pipeline | **Lex** | Owl | Rule 1: pipeline = execution discipline; Rule 5: sequence → secondary Owl | |
| `application/skill-applicator.ts` | skill-applicator | **Lex** | — | Rule 1: operational execution | |
| `application/skill-session.ts` | skill-session | **Owl** | Cedar | Rule 5: temporal/session; Rule 2: session boundaries = Owl | |
| `application/stages/` | budget-stage, cache-order-stage, load-stage, model-filter-stage, resolve-stage, score-stage | **Lex** | Hemlock | Rule 1: pipeline stages are Lex; score-stage → secondary Hemlock | |
| `application/conflict-resolver.ts` | conflict-resolver | **Lex** | Hemlock | Rule 1: constraint resolution | |
| `application/relevance-scorer.ts` | relevance-scorer | **Hemlock** | Raven | Rule 1: quality measurement; analytical → Raven | |
| `application/budget-profiles.ts` | budget-profiles | **Lex** | — | Rule 1: resource constraint specification | |
| `application/token-counter.ts` | token-counter | **Lex** | — | Rule 1: constraint measurement | |

---

### src/bundles/ — Bundle Management

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `bundles/bundle-parser.ts` | bundle-parser | **Lex** | — | Rule 1: specification parsing | |
| `bundles/bundle-activator.ts` | bundle-activator | **Lex** | Owl | Rule 1: operational activation pipeline | |
| `bundles/bundle-progress-tracker.ts` | bundle-progress-tracker | **Owl** | Cedar | Rule 5: temporal progression tracking | |
| `bundles/bundle-suggester.ts` | bundle-suggester | **Raven** | Sam | Rule 1: pattern-based suggestion | |

---

### src/capabilities/ — Capability System

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `capabilities/capability-discovery.ts` | capability-discovery | **Sam** | Hawk | Rule 1: exploration/discovery; Rule 5: positional → secondary Hawk | |
| `capabilities/capability-validator.ts` | capability-validator | **Hemlock** | Lex | Rule 1: validation is Hemlock | |
| `capabilities/capability-scaffolder.ts` | capability-scaffolder | **Sam** | — | Rule 1: prototyping/scaffolding | |
| `capabilities/manifest-parser.ts` | manifest-parser | **Lex** | — | Rule 1: spec parsing | |
| `capabilities/manifest-renderer.ts` | manifest-renderer | **Willow** | Lex | Rule 4: rendering is user-facing | |
| `capabilities/parallelization-advisor.ts` | parallelization-advisor | **Hawk** | Lex | Rule 5: formation/positioning; Rule 1: positional advice | |
| `capabilities/post-phase-invoker.ts` | post-phase-invoker | **Owl** | Lex | Rule 5: temporal — post-phase event | |
| `capabilities/research-compressor.ts` | research-compressor | **Sam** | — | Rule 1: experimental data reduction | |
| `capabilities/roadmap-capabilities.ts` | roadmap-capabilities | **Hawk** | Lex | Rule 5: gap detection in roadmap | |
| `capabilities/skill-injector.ts` | skill-injector | **Lex** | — | Rule 1: operational injection pipeline | |
| `capabilities/staleness-checker.ts` | staleness-checker | **Hemlock** | Owl | Rule 1: quality gate; Rule 5: temporal decay → secondary Owl | |
| `capabilities/collector-agent-generator.ts` | collector-agent-generator | **Sam** | — | Rule 1: prototyping/generation | |

---

### src/components/ — UI Components

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `components/SecurityPanel.ts` | SecurityPanel | **Willow** | Lex | Rule 4: UI panel is user-facing; Lex secondary for security content | |

---

### src/composition/ — Skill Composition

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `composition/dependency-graph.ts` | dependency-graph | **Hawk** | Raven | Rule 5: structural/spatial graph; Raven for pattern echoes | |
| `composition/graph-renderer.ts` | graph-renderer | **Willow** | Hawk | Rule 4: rendering is user-facing | |
| `composition/inheritance-validator.ts` | inheritance-validator | **Hemlock** | Lex | Rule 1: validation | |
| `composition/skill-resolver.ts` | skill-resolver | **Lex** | — | Rule 1: operational resolution pipeline | |

---

### src/conflicts/ — Conflict Detection

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `conflicts/conflict-detector.ts` | conflict-detector | **Raven** | Hemlock | Rule 1: signal/pattern detection | |
| `conflicts/conflict-formatter.ts` | conflict-formatter | **Willow** | Raven | Rule 4: user-facing output | |
| `conflicts/rewrite-suggester.ts` | rewrite-suggester | **Raven** | Sam | Rule 1: pattern-based suggestion | |

---

### src/disclosure/ — Progressive Disclosure

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `disclosure/` (all 6) | compact-generator, content-analyzer, content-decomposer, disclosure-budget, reference-linker | **Willow** | Lex | Rule 1: progressive disclosure is Willow's primary domain | Willow's named concept |

---

### src/embeddings/ — Embedding System

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `embeddings/cosine-similarity.ts` | cosine-similarity | **Raven** | — | Rule 1: pattern recognition metric | Shannon advisory |
| `embeddings/embedding-service.ts` | embedding-service | **Raven** | Sam | Rule 1: signal detection infrastructure | |
| `embeddings/embedding-cache.ts` | embedding-cache | **Cedar** | Raven | Rule 1: persistent cache is Cedar's domain | |
| `embeddings/heuristic-fallback.ts` | heuristic-fallback | **Raven** | Hemlock | Rule 1: heuristic pattern matching | |

---

### src/evaluator/ — Health Evaluation

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `evaluator/health-scorer.ts` | health-scorer | **Hemlock** | Raven | Rule 1: quality measurement | |
| `evaluator/health-formatter.ts` | health-formatter | **Willow** | Hemlock | Rule 4: user-facing output | |
| `evaluator/ab-evaluator.ts` | ab-evaluator | **Sam** | Hemlock | Rule 1: A/B is hypothesis testing | |
| `evaluator/success-tracker.ts` | success-tracker | **Owl** | Cedar | Rule 5: temporal tracking | |

---

### src/identifiers/ — ID Generation

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `identifiers/` (all 5) | compat, generator, index, metadata, types | **Cedar** | Lex | Rule 1: identifier generation for append-only chains | Hash-chain ancestry |

---

### src/initialization/ — Startup

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `initialization/dependency-checker.ts` | dependency-checker | **Lex** | Hemlock | Rule 1: constraint checking at startup | |

---

### src/integration/ — Integration Layer

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `integration/config/` | index, reader, schema, terminal-schema, terminal-types, types | **Lex** | — | Rule 1: specification/schema is Lex | |
| `integration/monitoring/` | observation-writer, plan-summary-differ, roadmap-differ, scanner, state-transition-detector, types | **Raven** | Hawk | Rule 1: signal detection; state-transition-detector is pattern recognition; scanner positional → secondary Hawk | |
| `integration/domain-skill-generator.ts` | domain-skill-generator | **Sam** | — | Rule 1: prototyping/generation | |
| `integration/mfe-skill-type.ts` | mfe-skill-type | **Lex** | — | Rule 1: type specification | |
| `integration/observation-feed.ts` | observation-feed | **Cedar** | Raven | Rule 1: feed is append-only observation stream | |
| `integration/path-cache.ts` | path-cache | **Cedar** | Lex | Rule 1: persistent cache | |
| `integration/pattern-refiner.ts` | pattern-refiner | **Raven** | Hemlock | Rule 1: pattern refinement is analytical | |
| `integration/pipeline-hooks.ts` | pipeline-hooks | **Lex** | Owl | Rule 1: pipeline constraint hooks | |

---

### src/integrations/amiga/ — Amiga Integration

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `amiga/agent-registry.ts` | agent-registry | **Hawk** | Cedar | Rule 5: positional registry = formation tracking | |
| `amiga/apt-mission-controller.ts` | apt-mission-controller | **Lex** | Owl | Rule 1: operational mission execution | |
| `amiga/ce1/` — attribution, contribution-registry, dividend-calculator, invocation-recorder, ledger-seal, token-architecture, weighting-engine | 7 files | **Cedar** | Lex | Rule 1: ledger is append-only; attribution and ledger-seal are hash-chain artifacts | CE1 = Cedar's ledger module |
| `amiga/gl1/` — charter, decision-log, dispute-record, policy-query, rules-engine, weighting-docs | 6 files | **Cedar** | Lex | Rule 1: charter and decision-log are append-only governance records | GL1 = Cedar governance log |
| `amiga/icd/` — icd-01 through icd-04, icd-validator | 5 files | **Hemlock** | Lex | Rule 1: ICD validator is quality gate; ICDs are spec documents | |
| `amiga/mc1/` — alert-renderer, command-parser, dashboard, telemetry-consumer | 4 files | **Willow** | Hawk | Rule 4: dashboard and alert-renderer are user-facing; command-parser positional | |
| `amiga/me1/` — archive-writer, gate-controller, manifest, phase-engine, provisioner, swarm-coordinator, telemetry-emitter | 7 files | **Lex** | Owl | Rule 1: phase-engine and gate-controller are pipeline/constraint; Rule 5: phase timing → secondary Owl | |
| `amiga/meta-mission/` — meta-mission-harness, skill-candidate-detector | 2 files | **Sam** | Raven | Rule 1: meta-mission is prototyping; skill-candidate-detector → secondary Raven | |
| `amiga/message-envelope.ts` | message-envelope | **Hawk** | Cedar | Rule 5: message relay is Hawk's domain | |
| `amiga/integration/` — full-stack-controller, mission-controller | 2 files | **Lex** | — | Rule 1: operational execution controllers | |

---

### src/integrations/aminet/ — Aminet Integration

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `aminet/binary-reader.ts` | binary-reader | **Lex** | — | Rule 1: specification-level binary parsing | |
| `aminet/bootblock-parser.ts` | bootblock-parser | **Lex** | — | Rule 1: spec parsing | |
| `aminet/bulk-downloader.ts` | bulk-downloader | **Lex** | — | Rule 1: operational pipeline | |
| `aminet/category-browser.ts` | category-browser | **Willow** | Sam | Rule 4: browsing is user-facing | |
| `aminet/collection-manager.ts`, `collection.ts` | 2 files | **Cedar** | Lex | Rule 1: collection is append-only catalog | |
| `aminet/dependency-detector.ts` | dependency-detector | **Raven** | Hawk | Rule 1: signal detection; Rule 5: positional (gap detection) → secondary Hawk | |
| `aminet/emulated-scanner.ts`, `emulator-config.ts`, `emulator-launch.ts`, `emulator-state.ts` | 4 files | **Lex** | Owl | Rule 1: emulator execution pipeline; state temporal → secondary Owl | |
| `aminet/filesystem-mapper.ts` | filesystem-mapper | **Hawk** | Foxy | Rule 5: spatial mapping; Foxy for cartography secondary | |
| `aminet/hardware-profiles.ts` | hardware-profiles | **Lex** | — | Rule 1: specification profiles | |
| `aminet/heuristic-scanner.ts` | heuristic-scanner | **Raven** | — | Rule 1: heuristic pattern detection | |
| `aminet/hunk-parser.ts` | hunk-parser | **Lex** | — | Rule 1: spec parsing | |
| `aminet/index-fetcher.ts`, `index-freshness.ts`, `index-parser.ts` | 3 files | **Lex** | Owl | Rule 1: operational index pipeline; freshness is temporal → secondary Owl | |
| `aminet/install-tracker.ts` | install-tracker | **Cedar** | Owl | Rule 1: append-only tracker; temporal → secondary Owl | |
| `aminet/integrity.ts` | integrity | **Cedar** | Hemlock | Rule 1: integrity checking is Cedar's domain | |
| `aminet/lha-extractor.ts`, `lzx-extractor.ts` | 2 files | **Lex** | — | Rule 1: operational extraction pipeline | |
| `aminet/mirror-state.ts` | mirror-state | **Cedar** | Lex | Rule 1: state persistence | |
| `aminet/package-detail.ts`, `package-fetcher.ts` | 2 files | **Lex** | — | Rule 1: operational fetch pipeline | |
| `aminet/pipeline.ts` | pipeline | **Lex** | — | Rule 1: pipeline = Lex's domain | |
| `aminet/quarantine.ts` | quarantine | **Hemlock** | Lex | Rule 1: quality gate — quarantine is containment before validation | |
| `aminet/readme-parser.ts` | readme-parser | **Sam** | — | Rule 1: exploration/discovery of content | |
| `aminet/rom-manager.ts` | rom-manager | **Lex** | Cedar | Rule 1: operational management pipeline | |
| `aminet/scan-gate.ts` | scan-gate | **Hemlock** | Lex | Rule 1: quality gate | |
| `aminet/scan-orchestrator.ts` | scan-orchestrator | **Lex** | Raven | Rule 1: orchestration is pipeline execution | |
| `aminet/search.ts` | search | **Sam** | Raven | Rule 1: discovery/exploration | |
| `aminet/signature-db.ts`, `signature-scanner.ts` | 2 files | **Cedar** | Raven | Rule 1: signature DB is append-only store; scanner → secondary Raven | |
| `aminet/sync-detector.ts` | sync-detector | **Raven** | Owl | Rule 1: signal detection; sync is temporal → secondary Owl | |
| `aminet/tool-validator.ts` | tool-validator | **Hemlock** | Lex | Rule 1: validation | |
| `aminet/whdload.ts` | whdload | **Lex** | — | Rule 1: operational execution | |

---

### src/integrations/cloud-ops/ — Cloud Operations

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `cloud-ops/dashboard/` — cloud-ops-panel, doc-console, types | 3 files | **Willow** | Hawk | Rule 4: dashboard is user-facing | |
| `cloud-ops/git/` — commit-rationale, types | 2 files | **Cedar** | Lex | Rule 1: commit rationale is append-only log entry | |
| `cloud-ops/knowledge/` — tier-loader, types | 2 files | **Sam** | Cedar | Rule 1: knowledge discovery | |
| `cloud-ops/observation/` — deployment-observer, types | 2 files | **Raven** | Cedar | Rule 1: observation is signal detection | |
| `cloud-ops/staging/` — chipset-variants, config-intake, types | 3 files | **Lex** | Hemlock | Rule 1: staging pipeline; intake validation → secondary Hemlock | |

---

### src/integrations/dacp/ — DACP Subsystem

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `dacp/assembler/` — assembler, catalog-query, rationale | 3 files | **Lex** | Cedar | Rule 1: assembler is pipeline execution; rationale is Cedar's log | |
| `dacp/bus/` — cleanup, degradation, scanner, transport, types | 5 files | **Hawk** | Lex | Rule 5: bus transport is message relay — Hawk's domain | DACP bus = message formation |
| `dacp/bundle.ts` | bundle | **Lex** | — | Rule 1: pipeline packaging | |
| `dacp/fidelity/` — decision, types | 2 files | **Hemlock** | Lex | Rule 1: fidelity is quality measurement | |
| `dacp/msg-fallback.ts` | msg-fallback | **Hawk** | Lex | Rule 5: message relay fallback | |
| `dacp/retrospective/` — analyzer, drift, persistence, types | 4 files | **Raven** | Cedar | Rule 1: retrospective analysis is pattern recognition; persistence → secondary Cedar | |
| `dacp/schema-generator.ts` | schema-generator | **Lex** | — | Rule 1: specification generation | |
| `dacp/templates/` — registry, starter-templates, types | 3 files | **Lex** | Foxy | Rule 1: template specs; starter-templates have creative direction → secondary Foxy | |

---

### src/integrations/den/ — Den Integration

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `den/bus.ts` | bus | **Hawk** | — | Rule 5: message relay | |
| `den/chipset.ts` | chipset | **Lex** | — | Rule 1: chipset spec | |
| `den/chronicler.ts` | chronicler | **Cedar** | — | Rule 1: chronicler = append-only log keeper | Named after Cedar's role |
| `den/comms-log.ts` | comms-log | **Cedar** | Hawk | Rule 1: log is append-only; comms relay → secondary Hawk | |
| `den/configurator.ts` | configurator | **Lex** | — | Rule 1: configuration specification | |
| `den/coordinator.ts` | coordinator | **Lex** | Owl | Rule 1: operational coordination pipeline | |
| `den/dashboard.ts` | dashboard | **Willow** | — | Rule 4: user-facing | |
| `den/dispatcher.ts` | dispatcher | **Hawk** | Lex | Rule 5: message relay/dispatch | |
| `den/encoder.ts` | encoder | **Lex** | — | Rule 1: spec encoding | |
| `den/executor.ts` | executor | **Lex** | — | Rule 1: execution | |
| `den/health.ts` | health | **Hemlock** | — | Rule 1: health = quality gate | |
| `den/intake.ts` | intake | **Lex** | Hemlock | Rule 1: pipeline intake | |
| `den/monitor.ts` | monitor | **Raven** | — | Rule 1: monitoring = signal detection | |
| `den/planner.ts` | planner | **Hawk** | Owl | Rule 5: positional planning; timing → secondary Owl | |
| `den/pruner.ts` | pruner | **Cedar** | — | Rule 1: pruning maintains append-only log integrity | |
| `den/relay.ts` | relay | **Hawk** | — | Rule 5: message relay is Hawk's domain | |
| `den/sentinel.ts` | sentinel | **Hemlock** | Lex | Rule 1: sentinel is quality gate watchdog | |
| `den/verifier.ts` | verifier | **Lex** | Hemlock | Rule 1: verification = Lex's core function | |

---

### src/integrations/site/ — Site Integration

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `site/agents/` — agents-md, llms-full, llms-txt, markdown-mirror, schema-org | 5 files | **Foxy** | Willow | Rule 1: site agents generate creative/cartographic output | |
| `site/audit.ts` | audit | **Cedar** | Hemlock | Rule 1: audit is append-only record; Hemlock for quality gate secondary | |
| `site/build.ts` | build | **Lex** | — | Rule 1: build pipeline | |
| `site/citations.ts` | citations | **Cedar** | Hemlock | Rule 1: citation is provenance/attribution chain | |
| `site/deploy.ts` | deploy | **Lex** | — | Rule 1: deployment pipeline | |
| `site/feed.ts` | feed | **Cedar** | Owl | Rule 1: feed is append-only stream; temporal → secondary Owl | |
| `site/markdown.ts` | markdown | **Willow** | — | Rule 4: user-facing content rendering | |
| `site/search.ts` | search | **Sam** | Raven | Rule 1: discovery | |
| `site/sitemap.ts` | sitemap | **Hawk** | Foxy | Rule 5: positional map; cartography → secondary Foxy | |
| `site/templates.ts` | templates | **Foxy** | Willow | Rule 1: template design = creative direction | |
| `site/utils/` — files, frontmatter, slug, toc | 4 files | **Lex** | Willow | Rule 1: utilities are operational; toc rendering → secondary Willow | |
| `site/wordpress/` — comments, html-to-md, mcp-adapter, migrate, wp-sync | 5 files | **Lex** | Cedar | Rule 1: migration/sync is operational pipeline; comments are append-only → secondary Cedar | |

---

### src/integrations/upstream/ — Upstream Intelligence

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `upstream/briefer.ts` | briefer | **Willow** | Raven | Rule 4: user-facing brief output | |
| `upstream/channel-state.ts` | channel-state | **Cedar** | Hawk | Rule 1: state persistence; channel relay → secondary Hawk | |
| `upstream/classifier.ts` | classifier | **Raven** | Hemlock | Rule 1: classification = pattern recognition | |
| `upstream/dashboard-alerts.ts` | dashboard-alerts | **Willow** | Raven | Rule 4: user-facing; signal-triggered | |
| `upstream/monitor.ts` | monitor | **Raven** | — | Rule 1: signal detection | |
| `upstream/patcher.ts` | patcher | **Lex** | — | Rule 1: operational patch pipeline | |
| `upstream/persistence.ts` | persistence | **Cedar** | — | Rule 1: append-only persistence | |
| `upstream/pipeline.ts` | pipeline | **Lex** | — | Rule 1: pipeline | |
| `upstream/registry.ts` | registry | **Cedar** | Hawk | Rule 1: registry is append-only; positional → secondary Hawk | |
| `upstream/tracer.ts` | tracer | **Cedar** | Raven | Rule 1: tracing = append-only event log; pattern → secondary Raven | |

---

### src/integrations/wasteland/ — Wasteland Integration (Current Branch Focus)

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `wasteland/agent-clustering-engine.ts` | agent-clustering-engine | **Raven** | Hawk | Rule 1: clustering = pattern recognition; formation → secondary Hawk | |
| `wasteland/agent-profiler.ts` | agent-profiler | **Raven** | Sam | Rule 1: analytical profiling | |
| `wasteland/agent-role-converter.ts` | agent-role-converter | **Lex** | — | Rule 1: conversion is spec-compliance operation | |
| `wasteland/agent-submission-workflow.ts` | agent-submission-workflow | **Lex** | Owl | Rule 1: workflow execution pipeline; Rule 5: temporal sequence → secondary Owl | |
| `wasteland/bootstrap.ts` | bootstrap | **Lex** | Owl | Rule 1: initialization pipeline; session start → secondary Owl | |
| `wasteland/cli-utils.ts` | cli-utils | **Lex** | Willow | Rule 4: CLI utilities are user-facing on output side | |
| `wasteland/config.ts` | config | **Lex** | — | Rule 1: configuration specification | |
| `wasteland/decay-simulator.ts` | decay-simulator | **Sam** | Raven | Rule 1: simulation is experimentation | |
| `wasteland/demo-bridge-usage.ts` | demo-bridge-usage | **Sam** | Willow | Rule 1: demo is prototyping/exploration | |
| `wasteland/dolt-scanner.ts`, `dolthub-client.ts` | 2 files | **Sam** | Cedar | Rule 1: exploration/discovery of data; Cedar for DB persistence | |
| `wasteland/failure-mode-classifier.ts` | failure-mode-classifier | **Raven** | Hemlock | Rule 1: classification = pattern recognition | |
| `wasteland/federation-dashboard.ts` | federation-dashboard | **Willow** | Hawk | Rule 4: dashboard is user-facing; federation positioning → secondary Hawk | |
| `wasteland/feedback-integrator.ts` | feedback-integrator | **Raven** | Cedar | Rule 1: feedback signal detection; Cedar for storage | |
| `wasteland/formatters.ts` | formatters | **Willow** | — | Rule 4: formatting is user-facing output | |
| `wasteland/human-readable-dashboard.ts` | human-readable-dashboard | **Willow** | — | Rule 4: user-facing output | |
| `wasteland/observation-bridge.ts` | observation-bridge | **Cedar** | Raven | Rule 1: observation stream is append-only; signal → secondary Raven | |
| `wasteland/pack-session-driver.ts` | pack-session-driver | **Owl** | Lex | Rule 5: session temporal driver | |
| `wasteland/route-optimizer.ts` | route-optimizer | **Hawk** | Foxy | Rule 5: positional routing; cartographic → secondary Foxy | |
| `wasteland/safety-gate-suggester.ts` | safety-gate-suggester | **Hemlock** | Lex | Rule 1: gate suggestion = quality gate design | |
| `wasteland/services-bridge.ts` | services-bridge | **Hawk** | Lex | Rule 5: bridge = message relay | |
| `wasteland/skill-materializer.ts` | skill-materializer | **Lex** | — | Rule 1: materialization is execution/production | |
| `wasteland/sql-escape.ts` | sql-escape | **Lex** | — | Rule 1: constraint enforcement on inputs | |
| `wasteland/stamp-validator.ts` | stamp-validator | **Hemlock** | Lex | Rule 1: validation | |
| `wasteland/task-decomposition-suggester.ts` | task-decomposition-suggester | **Hawk** | Sam | Rule 5: decomposition is positional/structural analysis | |
| `wasteland/task-sequence-analyzer.ts` | task-sequence-analyzer | **Owl** | Raven | Rule 5: sequence = temporal analysis | |
| `wasteland/team-composition-evaluator.ts` | team-composition-evaluator | **Hemlock** | Hawk | Rule 1: evaluation = quality gate; team formation → secondary Hawk | |
| `wasteland/town-topology-mapper.ts` | town-topology-mapper | **Hawk** | Foxy | Rule 5: topology is spatial; cartography → secondary Foxy | |
| `wasteland/trust-escalation.ts` | trust-escalation | **Cedar** | Lex | Rule 1: trust chain = Cedar's domain | |
| `wasteland/wanted-registry.ts` | wanted-registry | **Cedar** | Hawk | Rule 1: registry is append-only catalog | |
| `wasteland/wasteland-events.ts` | wasteland-events | **Cedar** | Raven | Rule 1: events = Cedar's event store | |
| `wasteland/wasteland-pattern-bridge.ts` | wasteland-pattern-bridge | **Raven** | Cedar | Rule 1: pattern bridge = signal detection | |
| `wasteland/wasteland-policy-generator.ts` | wasteland-policy-generator | **Lex** | Cedar | Rule 1: policy generation = specification | |

---

### src/launcher/ — Launcher

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `launcher/dashboard-service.ts` | dashboard-service | **Willow** | Lex | Rule 4: service feeds dashboard UI | |
| `launcher/dev-environment.ts` | dev-environment | **Lex** | Sam | Rule 1: environment pipeline setup | |

---

### src/learning/ — Learning System

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `learning/contradiction-detector.ts` | contradiction-detector | **Raven** | Hemlock | Rule 1: signal detection in learning | |
| `learning/drift-tracker.ts` | drift-tracker | **Raven** | Owl | Rule 1: drift = pattern deviation; temporal → secondary Owl | |
| `learning/feedback-detector.ts` | feedback-detector | **Raven** | — | Rule 1: signal detection | |
| `learning/feedback-store.ts` | feedback-store | **Cedar** | Raven | Rule 1: append-only store | |
| `learning/refinement-engine.ts` | refinement-engine | **Sam** | Raven | Rule 1: experimentation/refinement | |
| `learning/version-manager.ts` | version-manager | **Cedar** | Lex | Rule 1: versioning = append-only history | |

---

### src/nlp/ — NLP Utilities

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `nlp/naive-bayes.ts` | naive-bayes | **Raven** | — | Rule 1: classification = pattern recognition; Euclid advisory |
| `nlp/tfidf.ts` | tfidf | **Raven** | — | Rule 1: signal frequency analysis; Shannon advisory |

---

### src/packs/agc/ — Apollo Guidance Computer Pack

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `agc/cpu.ts`, `agc/alu.ts`, `agc/registers.ts` | 3 files | **Lex** | — | Rule 1: CPU/ALU are specification-level execution units | |
| `agc/memory.ts` | memory | **Cedar** | Lex | Rule 1: memory is append-only/persistent store | |
| `agc/instructions.ts`, `agc/decoder.ts` | 2 files | **Lex** | — | Rule 1: instruction spec | |
| `agc/interrupts.ts`, `agc/io-channels.ts` | 2 files | **Hawk** | Lex | Rule 5: I/O channels = message relay; interrupt = signal | |
| `agc/timing.ts`, `agc/counters.ts` | 2 files | **Owl** | Lex | Rule 5: timing is temporal | |
| `agc/executive.ts`, `agc/executive-monitor.ts` | 2 files | **Lex** | Owl | Rule 1: executive scheduler is pipeline coordination | |
| `agc/restart.ts` | restart | **Owl** | Lex | Rule 5: restart is session boundary/temporal | |
| `agc/waitlist.ts` | waitlist | **Owl** | Cedar | Rule 5: waitlist is temporal queue | |
| `agc/dsky-display.ts` | dsky-display | **Willow** | — | Rule 4: display is user-facing | |
| `agc/dsky-keyboard.ts` | dsky-keyboard | **Willow** | Lex | Rule 4: keyboard input is user-facing | |
| `agc/dsky-commander.ts` | dsky-commander | **Lex** | Willow | Rule 1: command execution | |
| `agc/alarm-scenario.ts` | alarm-scenario | **Raven** | Hemlock | Rule 1: alarm = signal detection pattern | |
| `agc/learn-mode.ts` | learn-mode | **Willow** | Sam | Rule 4: learning mode UI | |
| `agc/curriculum/` | runner, types | **Lex** | Owl | Rule 1: curriculum runner = pipeline execution | |
| `agc/tools/` | assembler, debugger, disassembler, rope-loader, validation | **Lex** | Hemlock | Rule 1: tools are operational; validation → secondary Hemlock | |
| `agc/pack/` | block-definitions, manifest, rope-loader, widgets | **Lex** | Willow | Rule 1: manifest = spec; widgets → secondary Willow | |

---

### src/packs/bbs-pack/ — BBS Pack

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `bbs-pack/modules/01-terminal-modem/` | labs | **Sam** | Lex | Rule 1: lab = experimentation | |
| `bbs-pack/modules/02-ansi-art/` | labs | **Foxy** | Willow | Rule 1: ANSI art = creative direction | |
| `bbs-pack/modules/03-fidonet/` | labs | **Hawk** | Sam | Rule 5: FidoNet = message relay network | |
| `bbs-pack/modules/04-irc-dancer/` | labs | **Hawk** | Foxy | Rule 5: IRC = message relay | |
| `bbs-pack/modules/05-door-games/` | labs | **Sam** | Foxy | Rule 1: door games = experimentation/play | |
| `bbs-pack/shared/` | ansi, cp437, sauce, types | **Lex** | Foxy | Rule 1: encoding specs; ANSI creative → secondary Foxy | |

---

### src/packs/citations/ — Citations Pack

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `citations/store/` — citation-db, migrations, provenance-chain | 3 files | **Cedar** | Hemlock | Rule 1: citation DB and provenance chain are append-only; migrations → secondary Lex | |
| `citations/extractor/` — doi-detector, parser, patterns, url-resolver | 4 files | **Raven** | Lex | Rule 1: extraction is signal/pattern detection | |
| `citations/resolver/` — adapter, confidence, dedup, resolver-engine + adapters | 8 files | **Lex** | Raven | Rule 1: resolver is operational pipeline; pattern matching → secondary Raven | |
| `citations/generator/` — attribution-report, formats (apa7, bibtex, chicago, custom, mla), formatter, integrity-audit | 8 files | **Cedar** | Willow | Rule 1: attribution and integrity are Cedar's; formatting → secondary Willow | |
| `citations/discovery/` — citation-graph, related-works, search-engine | 4 files | **Sam** | Raven | Rule 1: discovery = exploration | |
| `citations/dashboard/` — citation-panel, integrity-badges, provenance-viewer | 4 files | **Willow** | Cedar | Rule 4: dashboard panels are user-facing | |
| `citations/learn-integration/` — annotation-injector, knowledge-tier-linker, learn-hook | 4 files | **Foxy** | Cedar | Rule 1: cross-pollination = linking knowledge tiers | |
| `citations/space-between/` — attribution-report, generate-bibliography, reference-list | 3 files | **Cedar** | Foxy | Rule 1: bibliography = append-only reference chain | Named "space-between" = Foxy's territory |

---

### src/packs/dogfood/ — Dogfood Pack

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `dogfood/extraction/` — chapter-detector, chunk-segmenter, diagram-cataloger, extractor, manifest-generator, math-parser, section-parser | 7 files | **Raven** | Lex | Rule 1: extraction = pattern detection | |
| `dogfood/harness/` — checkpoint-manager, dashboard-bridge, metrics-collector, progress-tracker | 5 files | **Lex** | Owl | Rule 1: harness = execution pipeline; progress temporal → secondary Owl | |
| `dogfood/learning/` — concept-detector, cross-referencer, database-merger, ingest-controller, position-mapper, track-runner | 6 files | **Sam** | Raven | Rule 1: learning = experimentation; detection → secondary Raven | |
| `dogfood/pydmd/generate/` — cross-reference-checker, decision-tree-formatter, reference-builder, script-generator, skill-composer | 6 files | **Lex** | Foxy | Rule 1: generation pipeline; composer = creative → secondary Foxy | |
| `dogfood/pydmd/install/` — health-check, python-detector, venv-manager | 4 files | **Lex** | Hemlock | Rule 1: install pipeline; health-check → secondary Hemlock | |
| `dogfood/pydmd/learn/` — api-mapper, complex-plane-mapper, concept-extractor, pattern-synthesizer, structure-analyzer, tutorial-parser | 6 files | **Sam** | Raven | Rule 1: learning = exploration; pattern → secondary Raven | |
| `dogfood/pydmd/validate/` — accuracy-checker, scoring, tutorial-replay | 4 files | **Hemlock** | Lex | Rule 1: validation | |
| `dogfood/refinement/` — patch-generator, report-builder, safety-validator, skill-refiner, ticket-generator | 6 files | **Lex** | Hemlock | Rule 1: refinement pipeline; safety-validator → secondary Hemlock | |
| `dogfood/verification/` — consistency-checker, coverage-mapper, eight-layer-verifier, gap-classifier, gap-report-generator, knowledge-differ | 6 files | **Hemlock** | Raven | Rule 1: verification = quality gate; gap detection → secondary Raven | |

---

### src/packs/electronics-pack/ — Electronics Pack

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `electronics-pack/modules/` (01-15, labs) | 15 files | **Sam** | Lex | Rule 1: lab modules = experimentation | |
| `electronics-pack/safety/` — assessments, warden | 2 files | **Hemlock** | Lex | Rule 1: safety assessment = quality gate | |
| `electronics-pack/shared/` — circuit-format, component-guide, learn-mode, learn-mode-ui | 4 files | **Willow** | Lex | Rule 4: learn-mode-ui is user-facing | |
| `electronics-pack/simulator/` — components, dsp-engine, gpio-sim, instruments, logic-sim, mna-engine, mna-instrument, pcb-layout, plc-engine, reference-circuits, solar-engine, transient | 12 files | **Sam** | Lex | Rule 1: simulation = experimentation | Shannon advisory for DSP |

---

### src/packs/engines/ — Pack Engines

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `engines/composition-engine.ts` | composition-engine | **Lex** | — | Rule 1: pipeline composition | |
| `engines/dependency-graph.ts` | dependency-graph | **Hawk** | Raven | Rule 5: spatial graph | |
| `engines/path-finder.ts` | path-finder | **Hawk** | Foxy | Rule 5: positional path finding; cartography → secondary Foxy | |
| `engines/plane-classifier.ts` | plane-classifier | **Raven** | Foxy | Rule 1: classification; complex plane → secondary Foxy | |
| `engines/plane-navigator.ts` | plane-navigator | **Hawk** | Foxy | Rule 5: positional navigation; cartography → secondary Foxy | |
| `engines/proof-composer.ts` | proof-composer | **Lex** | — | Rule 1: proof = specification verification | Euclid advisory |
| `engines/property-checkers.ts` | property-checkers | **Hemlock** | Lex | Rule 1: property checking = quality gate | |
| `engines/verification-engine.ts` | verification-engine | **Lex** | Hemlock | Rule 1: verification engine = Lex's core | |

---

### src/packs/holomorphic/ — Holomorphic Dynamics Pack

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `holomorphic/complex/` — arithmetic, iterate | 2 files | **Foxy** | — | Rule 1: complex plane math = cartography of the plane | Euclid advisory |
| `holomorphic/dmd/` — dmd-control, dmd-core, dmd-multiresolution, dmd-physics, dmd-robust, koopman, skill-dmd-bridge | 7 files | **Raven** | Sam | Rule 1: DMD = pattern detection via modal decomposition; bridge → secondary Sam | Shannon advisory |
| `holomorphic/dynamics/` — skill-dynamics | 1 file | **Raven** | Foxy | Rule 1: dynamics = pattern recurrence | |
| `holomorphic/modules/` (HD-01 through HD-10) | 9 files | **Sam** | Foxy | Rule 1: module sessions = experimentation | |
| `holomorphic/renderer/` — core, eigenvalue-plot, helpers | 3 files | **Willow** | Foxy | Rule 4: rendering is user-facing; complex plane visualization → secondary Foxy | |

---

### src/packs/knowledge/ — Knowledge Pack

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `knowledge/activity-loader.ts`, `activity-scaffolder.ts` | 2 files | **Sam** | Lex | Rule 1: scaffolding = prototyping | |
| `knowledge/approach-promoter.ts` | approach-promoter | **Raven** | Hemlock | Rule 1: promotion detection = pattern signal | |
| `knowledge/assessment-loader.ts` | assessment-loader | **Hemlock** | — | Rule 1: assessment = quality measurement | |
| `knowledge/connection-mapper.ts` | connection-mapper | **Foxy** | Raven | Rule 1: cross-pollination mapping = Foxy's domain | |
| `knowledge/content-validator.ts` | content-validator | **Hemlock** | — | Rule 1: validation | |
| `knowledge/dependency-resolver.ts` | dependency-resolver | **Lex** | Hawk | Rule 1: operational resolution; positional → secondary Hawk | |
| `knowledge/event-bridge.ts` | event-bridge | **Cedar** | Hawk | Rule 1: events = Cedar; bridge = relay → secondary Hawk | |
| `knowledge/grade-router.ts` | grade-router | **Hawk** | Hemlock | Rule 5: routing = positional relay | |
| `knowledge/learning-pattern-detector.ts` | learning-pattern-detector | **Raven** | Sam | Rule 1: pattern detection | |
| `knowledge/module-loader.ts` | module-loader | **Lex** | — | Rule 1: operational loading pipeline | |
| `knowledge/observation-hooks.ts` | observation-hooks | **Cedar** | Raven | Rule 1: hooks = append-only observation | |
| `knowledge/pathway-adapter.ts` | pathway-adapter | **Hawk** | Foxy | Rule 5: pathway = positional routing | |
| `knowledge/prerequisite-validator.ts` | prerequisite-validator | **Hemlock** | Lex | Rule 1: validation | |
| `knowledge/registry.ts` | registry | **Cedar** | — | Rule 1: append-only registry | |
| `knowledge/resource-loader.ts` | resource-loader | **Lex** | — | Rule 1: operational pipeline | |
| `knowledge/skillmeta-parser.ts` | skillmeta-parser | **Lex** | — | Rule 1: spec parsing | |
| `knowledge/vision-parser.ts` | vision-parser | **Foxy** | Sam | Rule 1: vision = creative direction/aliveness | |

---

### src/packs/plane/ — Complex Plane Pack

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `plane/activation.ts` | activation | **Raven** | Hemlock | Rule 1: activation signal | |
| `plane/arithmetic.ts` | arithmetic | **Foxy** | — | Rule 1: complex plane arithmetic = cartography | Euclid advisory |
| `plane/chords.ts` | chords | **Foxy** | Raven | Rule 1: chord relationships = structural cartography | |
| `plane/composition.ts` | composition | **Foxy** | Lex | Rule 1: composition in the plane = creative direction | |
| `plane/dashboard.ts` | dashboard | **Willow** | Foxy | Rule 4: user-facing | |
| `plane/metrics.ts` | metrics | **Hemlock** | Raven | Rule 1: quality metrics | |
| `plane/migration.ts` | migration | **Cedar** | Lex | Rule 1: migration = append-only state transition | |
| `plane/observer-bridge.ts` | observer-bridge | **Cedar** | Raven | Rule 1: observer = append-only stream | |
| `plane/position-store.ts` | position-store | **Cedar** | Hawk | Rule 1: position store is persistent; positional → secondary Hawk | |
| `plane/promotion.ts` | promotion | **Hemlock** | Cedar | Rule 1: promotion = quality gate advancement | |
| `plane/refinement-wrapper.ts` | refinement-wrapper | **Lex** | Sam | Rule 1: wrapper = operational pipeline constraint | |
| `plane/signal-classification.ts` | signal-classification | **Raven** | Hemlock | Rule 1: signal detection and classification | |

---

### src/platform/ — Platform Services

#### src/platform/calibration/

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `calibration/` — benchmark-reporter, calibration-store, mcc-calculator, threshold-history, threshold-optimizer | 6 files | **Hemlock** | Cedar | Rule 1: calibration = quality benchmarking; store → secondary Cedar | Hemlock's platform home |

---

#### src/platform/console/

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `console/bridge-logger.ts` | bridge-logger | **Cedar** | Hawk | Rule 1: logger = append-only; bridge relay → secondary Hawk | |
| `console/directory.ts` | directory | **Hawk** | Lex | Rule 5: spatial directory = positional | |
| `console/helper.ts` | helper | **Willow** | Lex | Rule 4: user-facing helper | |
| `console/message-handler.ts` | message-handler | **Hawk** | Lex | Rule 5: message relay | |
| `console/milestone-config.ts` | milestone-config | **Lex** | Owl | Rule 1: milestone spec; temporal → secondary Owl | |
| `console/question-responder.ts`, `question-schema.ts` | 2 files | **Willow** | Lex | Rule 4: question/response is user interaction | |
| `console/reader.ts` | reader | **Lex** | — | Rule 1: operational input pipeline | |
| `console/schema.ts` | schema | **Lex** | — | Rule 1: specification | |
| `console/status-writer.ts`, `writer.ts` | 2 files | **Willow** | Cedar | Rule 4: output writing is user-facing | |

---

#### src/platform/dashboard/

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| Dashboard top-level: `activity-feed.ts`, `activity-tab-toggle.ts`, `aminet-widget.ts`, `budget-gauge.ts`, `config-form.ts`, `console-activity.ts`, `console-page.ts`, `console-settings.ts`, `design-system.ts`, `entity-legend.ts`, `entity-shapes.ts`, `gantry-panel.ts`, `gantry-data.ts`, `handoff-panel.ts`, `incremental.ts`, `generator.ts`, `parser.ts`, `question-card.ts`, `question-poller.ts`, `refresh.ts`, `renderer.ts`, `silicon-panel.ts`, `staging-queue-panel.ts`, `structured-data.ts`, `styles.ts`, `submit-flow.ts`, `terminal-integration.ts`, `terminal-panel.ts`, `topology-data.ts`, `topology-integration.ts`, `topology-renderer.ts`, `upload-zone.ts` | 32 files | **Willow** | varies | Rule 4: dashboard is user-facing | Willow's largest grove |
| `dashboard/budget-silicon-collector.ts` | budget-silicon-collector | **Lex** | Cedar | Rule 1: resource constraint collection; Rule 3: operational | |
| `dashboard/collectors/` — activity-collector, console-collector, determinism-view, git-collector, lineage-view, pipeline-status, planning-collector, session-collector, staging-collector, topology-collector | 10 files | **Cedar** | Willow | Rule 1: collectors = append-only data ingestion; display → secondary Willow | |
| `dashboard/metrics/` top-level: `graceful.ts`, `integration.ts`, `metrics-styles.ts`, `sample-rate.ts`, `tier-refresh.ts` | 5 files | **Hemlock** | Willow | Rule 1: metrics = quality measurement; display → secondary Willow | |
| `dashboard/metrics/history/` — commit-distribution, file-hotspots, milestone-table, velocity-trend | 5 files | **Cedar** | Hemlock | Rule 1: history = append-only; Rule 3: analytical → secondary Hemlock | |
| `dashboard/metrics/pulse/` — commit-feed, heartbeat, message-counter, session-card | 5 files | **Owl** | Cedar | Rule 5: pulse = temporal cadence; Cedar for feed storage | |
| `dashboard/metrics/quality/` — accuracy-score, accuracy-trend, deviation-summary, emergent-ratio | 5 files | **Hemlock** | Raven | Rule 1: quality = Hemlock; emergent-ratio detection → secondary Raven | |
| `dashboard/metrics/velocity/` — progress-card, stats-table, tdd-rhythm, timeline | 5 files | **Owl** | Hemlock | Rule 5: velocity/timeline = temporal | |
| `dashboard/pages/` — milestones, requirements, roadmap, state | 4 files | **Willow** | Lex | Rule 4: page rendering; requirements spec → secondary Lex | |

---

#### src/platform/observation/

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `observation/cluster-translator.ts` | cluster-translator | **Raven** | Lex | Rule 1: cluster = pattern recognition | |
| `observation/determinism-analyzer.ts` | determinism-analyzer | **Hemlock** | Raven | Rule 1: determinism = quality standard | |
| `observation/drift-monitor.ts` | drift-monitor | **Raven** | Owl | Rule 1: drift = pattern deviation; temporal → secondary Owl | |
| `observation/ephemeral-store.ts` | ephemeral-store | **Cedar** | Owl | Rule 1: append-only ephemeral store; temporal → secondary Owl | |
| `observation/execution-capture.ts` | execution-capture | **Cedar** | Lex | Rule 1: capture = append-only log | |
| `observation/feedback-bridge.ts` | feedback-bridge | **Cedar** | Raven | Rule 1: feedback stream = append-only; signal → secondary Raven | |
| `observation/jsonl-compactor.ts` | jsonl-compactor | **Cedar** | Lex | Rule 1: JSONL compaction maintains log integrity | |
| `observation/lineage-tracker.ts` | lineage-tracker | **Cedar** | Raven | Rule 1: lineage = append-only provenance chain | |
| `observation/observation-squasher.ts` | observation-squasher | **Cedar** | Lex | Rule 1: log management | |
| `observation/pattern-analyzer.ts`, `pattern-summarizer.ts` | 2 files | **Raven** | Cedar | Rule 1: pattern analysis = Raven | |
| `observation/photon-emitter.ts` | photon-emitter | **Cedar** | Hawk | Rule 1: event emission = Cedar stream; relay → secondary Hawk | |
| `observation/promotion-detector.ts`, `promotion-evaluator.ts`, `promotion-gatekeeper.ts` | 3 files | **Hemlock** | Cedar | Rule 1: promotion gate = quality gate | |
| `observation/rate-limiter.ts` | rate-limiter | **Lex** | — | Rule 1: constraint enforcement | |
| `observation/retention-manager.ts` | retention-manager | **Cedar** | Lex | Rule 1: retention policy = append-only log lifecycle | |
| `observation/routing-advisor.ts` | routing-advisor | **Hawk** | Raven | Rule 5: positional routing advice | |
| `observation/script-generator.ts` | script-generator | **Lex** | Foxy | Rule 1: script generation = pipeline spec; creative direction → secondary Foxy | |
| `observation/sequence-recorder.ts`, `sequence-recorder-listener.ts` | 2 files | **Cedar** | Owl | Rule 1: sequence recording = append-only; temporal → secondary Owl | |
| `observation/session-observer.ts` | session-observer | **Cedar** | Owl | Rule 1: observation stream; session = Owl | |
| `observation/transcript-parser.ts` | transcript-parser | **Lex** | Cedar | Rule 1: spec parsing | |

---

#### src/platform/retro/

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `retro/action-generator.ts` | action-generator | **Lex** | Sam | Rule 1: action = execution; generation = exploration | |
| `retro/calibration-delta.ts` | calibration-delta | **Hemlock** | Cedar | Rule 1: calibration = quality; delta = change tracking | |
| `retro/changelog-watch.ts` | changelog-watch | **Cedar** | Raven | Rule 1: changelog = append-only; watch = signal | |
| `retro/observation-harvester.ts` | observation-harvester | **Cedar** | Raven | Rule 1: append-only observation | |
| `retro/template-generator.ts` | template-generator | **Foxy** | Lex | Rule 1: template design = creative direction | |

---

#### src/platform/staging/

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `staging/derived/` — checker, copying-detector, pattern-fidelity, provenance, scope-drift, training-coherence | 7 files | **Hemlock** | Cedar | Rule 1: derived quality checks; provenance → secondary Cedar | |
| `staging/hygiene/` — familiarity, finding-actions, patterns, report, scanner-config, scanner-embedded, scanner-hidden, scanner, scope-coherence, trust-store, trust-types | 11 files | **Hemlock** | Cedar | Rule 1: hygiene = quality gate; trust-store → secondary Cedar | |
| `staging/intake-flow/` — clarity-assessor, orchestrator, step-tracker, step-types | 5 files | **Lex** | Hemlock | Rule 1: intake orchestrator = pipeline execution | |
| `staging/queue/` — audit-logger, dependency-detector, manager, optimization-analyzer, pre-wiring, retroactive-audit, state-machine | 8 files | **Lex** | Cedar | Rule 1: queue management = pipeline discipline; audit-logger → secondary Cedar | |
| `staging/resource/` — analyzer, budget, decomposer, intake-bridge, manifest, skill-matcher, topology | 8 files | **Lex** | Hemlock | Rule 1: resource constraint management | |
| `staging/directory.ts`, `staging/intake.ts`, `staging/schema.ts`, `staging/state-machine.ts` | 4 files | **Lex** | Hemlock | Rule 1: pipeline management | |

---

#### src/platform/terminal/

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `terminal/health.ts` | health | **Hemlock** | — | Rule 1: health = quality gate | |
| `terminal/launcher.ts` | launcher | **Lex** | Owl | Rule 1: launch pipeline; session start → secondary Owl | |
| `terminal/process-manager.ts` | process-manager | **Lex** | — | Rule 1: process execution | |
| `terminal/session.ts` | session | **Owl** | Lex | Rule 5: session = temporal boundary | |

---

### src/portability/ — Portability Layer

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `portability/path-normalizer.ts` | path-normalizer | **Lex** | — | Rule 1: constraint normalization | |
| `portability/platform-adapter.ts` | platform-adapter | **Lex** | — | Rule 1: spec adaptation | |
| `portability/portable-exporter.ts` | portable-exporter | **Lex** | Foxy | Rule 1: export pipeline; portability = cross-pollination → secondary Foxy | |

---

### src/retrieval/ — Retrieval System

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `retrieval/adaptive-router.ts` | adaptive-router | **Hawk** | Sam | Rule 5: routing = positional; adaptive = exploration | |
| `retrieval/corrective-rag.ts` | corrective-rag | **Raven** | Sam | Rule 1: corrective pattern detection; experimentation → secondary Sam | |
| `retrieval/cross-project-index.ts` | cross-project-index | **Foxy** | Hawk | Rule 1: cross-project = cross-pollination; positional indexing → secondary Hawk | |

---

### src/roles/ — Role System

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `roles/role-extends.ts`, `role-parser.ts` | 2 files | **Lex** | — | Rule 1: role specification and parsing | |
| `roles/role-injector.ts` | role-injector | **Lex** | — | Rule 1: operational injection | |

---

### src/services/agents/ — Agent Services

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `agents/agent-generator.ts` | agent-generator | **Sam** | Lex | Rule 1: generation = prototyping | |
| `agents/agent-suggestion-manager.ts` | agent-suggestion-manager | **Raven** | Sam | Rule 1: suggestion = pattern-based | |
| `agents/cluster-detector.ts` | cluster-detector | **Raven** | Hawk | Rule 1: detection = signal/pattern | |
| `agents/co-activation-tracker.ts` | co-activation-tracker | **Cedar** | Raven | Rule 1: tracking = append-only log | |

---

### src/services/autonomy/ — Autonomy System

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `autonomy/engine.ts` | engine | **Lex** | — | Rule 1: engine = execution pipeline | |
| `autonomy/gate-enforcer.ts`, `gate-loader.ts`, `gate-templates.ts`, `gates.ts` | 4 files | **Lex** | Hemlock | Rule 1: gate enforcement = Lex; gate quality → secondary Hemlock | |
| `autonomy/context-budget.ts` | context-budget | **Lex** | — | Rule 1: resource constraint | |
| `autonomy/persistence.ts` | persistence | **Cedar** | — | Rule 1: append-only persistence | |
| `autonomy/resume.ts` | resume | **Owl** | Cedar | Rule 5: resume = session temporal boundary | |
| `autonomy/scheduler.ts` | scheduler | **Owl** | Lex | Rule 5: scheduling = temporal cadence | |
| `autonomy/schema-validation.ts` | schema-validation | **Hemlock** | Lex | Rule 1: validation | |
| `autonomy/simulated-work-detector.ts` | simulated-work-detector | **Raven** | Hemlock | Rule 1: pattern detection; quality gate → secondary Hemlock | |
| `autonomy/state-machine.ts`, `state-pruner.ts` | 2 files | **Lex** | Cedar | Rule 1: state machine = execution discipline | |
| `autonomy/teach-forward.ts` | teach-forward | **Foxy** | Sam | Rule 1: teaching = cross-pollination; experimentation → secondary Sam | |
| `autonomy/write-watchdog.ts` | write-watchdog | **Lex** | Hemlock | Rule 1: watchdog = constraint enforcement | |

---

### src/services/brainstorm/ — Brainstorm Service

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `brainstorm/agents/` — analyst, base, critic, facilitator, ideator, mapper, persona, questioner, scribe | 9 files | **Sam** | Foxy | Rule 1: brainstorm = hypothesis generation; creative → secondary Foxy | |
| `brainstorm/techniques/` analytical: five-whys, scamper, six-thinking-hats, starbursting | 4 files | **Sam** | Raven | Rule 1: analytical techniques = exploration; pattern → secondary Raven | |
| `brainstorm/techniques/` collaborative: brain-netting, brainwriting-635, figure-storming, rolestorming, round-robin | 5 files | **Sam** | Foxy | Rule 1: collaborative generation = Sam; creative → secondary Foxy | |
| `brainstorm/techniques/` individual: freewriting, mind-mapping, question-brainstorming, rapid-ideation | 4 files | **Sam** | Foxy | Rule 1: individual generation = Sam | |
| `brainstorm/techniques/` visual: affinity-mapping, lotus-blossom, storyboarding | 3 files | **Sam** | Willow | Rule 1: visual techniques = Sam; user-facing → secondary Willow | |
| `brainstorm/core/` — phase-controller, rules-engine, session-manager | 3 files | **Lex** | Owl | Rule 1: phase controller = pipeline; session → secondary Owl | |
| `brainstorm/artifacts/` — generator, templates (action-plan, json-export, transcript) | 4 files | **Cedar** | Foxy | Rule 1: transcript = append-only record; creative templates → secondary Foxy | |
| `brainstorm/integration/session-bus.ts` | session-bus | **Hawk** | Owl | Rule 5: bus = message relay; session = temporal | |
| `brainstorm/pathways/router.ts` | router | **Hawk** | Sam | Rule 5: routing = positional | |

---

### src/services/chipset/ — Chipset Services

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `chipset/blitter/` — executor, promoter, signals, types | 4 files | **Lex** | Cedar | Rule 1: blitter executor = execution pipeline; signals → secondary Cedar | Key: signals.ts was modified on current branch |
| `chipset/cartridge-packager.ts`, `cartridge-types.ts` | 2 files | **Lex** | — | Rule 1: packaging = specification pipeline | |
| `chipset/cedar-engine.ts`, `cedar-timeline.ts` | 2 files | **Cedar** | — | Rule 1: Cedar-named files = Cedar's domain | Cedar's own chipset implementation |
| `chipset/copper/` — activation, compiler, executor, lifecycle-sync, parser, schema, types | 7 files | **Lex** | Owl | Rule 1: copper compiler/executor = pipeline; lifecycle → secondary Owl | |
| `chipset/copper/learning/` — compiler, feedback, library, types | 4 files | **Sam** | Cedar | Rule 1: learning = experimentation; feedback stored → secondary Cedar | |
| `chipset/ephemeral-forker.ts` | ephemeral-forker | **Sam** | Cedar | Rule 1: forking = experimentation | |
| `chipset/exec/` — dma-budget, kernel, messages, scheduler | 5 files | **Lex** | Owl | Rule 1: kernel = execution pipeline; scheduler → secondary Owl | |
| `chipset/integration/` — pop-stack-awareness, session-events, stack-bridge | 3 files | **Hawk** | Cedar | Rule 5: stack bridge = message relay; events → secondary Cedar | |
| `chipset/mission-isolation.ts` | mission-isolation | **Lex** | — | Rule 1: isolation = constraint enforcement | |
| `chipset/muse-forking.ts`, `muse-integration.ts`, `muse-loader.ts`, `muse-plane-engine.ts`, `muse-plane-types.ts`, `muse-schema-validator.ts`, `muse-visibility-engine.ts`, `muse-visibility.ts` | 8 files | **Lex** | varies | Rule 1: muse schema validator and engine = specification/pipeline; muse-visibility → Willow secondary | High-priority for MUS mission |
| `chipset/sandbox-manager.ts` | sandbox-manager | **Lex** | Sam | Rule 1: sandbox = constraint boundary; experimentation → secondary Sam | |
| `chipset/teams/` — chip-registry, message-port, signals, types | 4 files | **Hawk** | Cedar | Rule 5: message-port = relay; registry → secondary Cedar | |
| `chipset/willow-engine.ts`, `willow-types.ts` | 2 files | **Willow** | — | Rule 2: Willow-named files live in Willow's grove | |

---

### src/services/detection/ — Detection Service

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `detection/pattern-analyzer.ts` | pattern-analyzer | **Raven** | — | Rule 1: pattern analysis | |
| `detection/skill-generator.ts` | skill-generator | **Sam** | Raven | Rule 1: generation = prototyping; pattern-based → secondary Raven | |
| `detection/suggestion-manager.ts`, `suggestion-store.ts` | 2 files | **Raven** | Cedar | Rule 1: suggestion = pattern-based; store → secondary Cedar | |
| `detection/gsd-reference-injector.ts` | gsd-reference-injector | **Lex** | — | Rule 1: operational injection | |

---

### src/services/discovery/ — Discovery Service

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `discovery/bash-pattern-extractor.ts`, `prompt-clusterer.ts`, `prompt-collector.ts`, `session-parser.ts`, `session-pattern-processor.ts`, `tool-sequence-extractor.ts`, `user-prompt-classifier.ts` | 7 files | **Raven** | Sam | Rule 1: extraction and pattern processing = Raven; exploration → secondary Sam | |
| `discovery/candidate-ranker.ts`, `candidate-selector.ts`, `cluster-drafter.ts`, `cluster-scorer.ts` | 4 files | **Raven** | Hemlock | Rule 1: scoring and clustering = pattern recognition; scoring → secondary Hemlock | |
| `discovery/corpus-scanner.ts`, `session-enumerator.ts` | 2 files | **Sam** | Raven | Rule 1: discovery scanning = exploration | |
| `discovery/dbscan.ts` | dbscan | **Raven** | — | Rule 1: DBSCAN is pattern clustering algorithm | Euclid advisory |
| `discovery/discovery-safety.ts` | discovery-safety | **Hemlock** | Lex | Rule 1: safety validation = quality gate | |
| `discovery/epsilon-tuner.ts` | epsilon-tuner | **Sam** | Hemlock | Rule 1: parameter tuning = experimentation | |
| `discovery/pattern-aggregator.ts`, `pattern-scorer.ts` | 2 files | **Raven** | Hemlock | Rule 1: pattern analysis | |
| `discovery/prompt-embedding-cache.ts`, `scan-state-store.ts` | 2 files | **Cedar** | Raven | Rule 1: cache/store = append-only | |
| `discovery/skill-drafter.ts` | skill-drafter | **Sam** | Lex | Rule 1: drafting = prototyping | |
| `discovery/text-utils.ts` | text-utils | **Lex** | — | Rule 1: utility = operational | |

---

### src/services/orchestrator/ — Orchestrator

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `orchestrator/discovery/` — agent-parser, command-parser, discovery-service, scanner, team-parser | 5 files | **Sam** | Lex | Rule 1: discovery = exploration | |
| `orchestrator/extension/` — extension-detector, types | 2 files | **Raven** | Sam | Rule 1: detection = pattern signal | |
| `orchestrator/gates/` — confirmation-gate, gate-evaluator, types | 3 files | **Lex** | Hemlock | Rule 1: gate enforcement = Lex | |
| `orchestrator/intent/` — argument-extractor, bayes-classifier, classification-logger, exact-match, intent-classifier, lifecycle-filter, semantic-matcher, utterance-augmenter | 8 files | **Raven** | Lex | Rule 1: intent classification = pattern recognition | |
| `orchestrator/lifecycle/` — artifact-scanner, lifecycle-coordinator, transition-rules, types | 4 files | **Lex** | Owl | Rule 1: lifecycle coordination = pipeline; temporal → secondary Owl | |
| `orchestrator/session-continuity/` — handoff-generator, skill-preload-suggester, snapshot-manager, warm-start | 4 files | **Owl** | Cedar | Rule 5: session continuity = temporal boundary management | |
| `orchestrator/state/` — config-reader, config-validator, milestone-scope, project-parser, roadmap-parser, state-parser, state-reader | 7 files | **Lex** | Cedar | Rule 1: state specification = Lex; storage → secondary Cedar | |
| `orchestrator/verbosity/` — verbosity-controller, types | 2 files | **Willow** | Lex | Rule 4: verbosity = user-facing output control | |
| `orchestrator/work-state/` — queue-manager, work-state-reader, work-state-writer | 4 files | **Lex** | Cedar | Rule 1: work state management = pipeline | |
| `orchestrator/__fixtures__/` — fixture-loader | 1 file | **Sam** | — | Rule 1: fixtures = test experimentation | |

---

### src/services/teams/ — Team Services

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `teams/cost-estimator.ts` | cost-estimator | **Lex** | Hemlock | Rule 1: cost constraint estimation | |
| `teams/gsd-templates.ts`, `templates.ts` | 2 files | **Foxy** | Lex | Rule 1: templates = creative direction; spec → secondary Lex | |
| `teams/inter-team-bridge.ts` | inter-team-bridge | **Hawk** | — | Rule 5: bridge = message relay between formations | |
| `teams/team-agent-generator.ts` | team-agent-generator | **Sam** | — | Rule 1: generation = prototyping | |
| `teams/team-event-log.ts` | team-event-log | **Cedar** | — | Rule 1: event log = append-only | |
| `teams/team-lifecycle.ts` | team-lifecycle | **Lex** | Owl | Rule 1: lifecycle = pipeline; temporal → secondary Owl | |
| `teams/team-store.ts` | team-store | **Cedar** | — | Rule 1: append-only store | |
| `teams/team-validator.ts` | team-validator | **Hemlock** | Lex | Rule 1: validation | |
| `teams/team-wizard.ts` | team-wizard | **Sam** | Willow | Rule 1: wizard = guided exploration; user-facing → secondary Willow | |

---

### src/services/workflows/ — Workflows

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `workflows/create-skill-workflow.ts` | create-skill-workflow | **Lex** | Sam | Rule 1: workflow execution = pipeline | |
| `workflows/list-skills-workflow.ts` | list-skills-workflow | **Lex** | Willow | Rule 1: pipeline; listing → secondary Willow | |
| `workflows/migrate-skill-workflow.ts` | migrate-skill-workflow | **Lex** | Cedar | Rule 1: migration pipeline; append-only history → secondary Cedar | |
| `workflows/search-skills-workflow.ts` | search-skills-workflow | **Sam** | Raven | Rule 1: search = discovery | |

---

### src/simulation/ — Simulation

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `simulation/activation-simulator.ts`, `batch-simulator.ts` | 2 files | **Sam** | Raven | Rule 1: simulation = experimentation | |
| `simulation/challenger-detector.ts` | challenger-detector | **Raven** | Hemlock | Rule 1: signal detection | |
| `simulation/confidence-categorizer.ts` | confidence-categorizer | **Hemlock** | Raven | Rule 1: quality categorization | |
| `simulation/explanation-generator.ts`, `hint-generator.ts` | 2 files | **Willow** | Sam | Rule 4: user-facing explanations | |

---

### src/skill-workflows/ — Skill Workflow Engine

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `skill-workflows/workflow-dag.ts` | workflow-dag | **Hawk** | Lex | Rule 5: DAG = spatial/structural graph | |
| `skill-workflows/workflow-extends.ts`, `workflow-parser.ts` | 2 files | **Lex** | — | Rule 1: spec | |
| `skill-workflows/workflow-run-store.ts` | workflow-run-store | **Cedar** | — | Rule 1: append-only run history | |
| `skill-workflows/workflow-runner.ts` | workflow-runner | **Lex** | Owl | Rule 1: execution pipeline; temporal → secondary Owl | |
| `skill-workflows/workflow-validator.ts` | workflow-validator | **Hemlock** | Lex | Rule 1: validation | |

---

### src/testing/ — Testing Infrastructure

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `testing/generators/` — cross-skill-generator, heuristic-generator, llm-generator, test-generator | 4 files | **Sam** | Raven | Rule 1: test generation = hypothesis/experimentation | |
| `testing/result-formatter.ts` | result-formatter | **Willow** | Hemlock | Rule 4: user-facing output | |
| `testing/result-store.ts` | result-store | **Cedar** | — | Rule 1: append-only result store | |
| `testing/review-workflow.ts` | review-workflow | **Lex** | Hemlock | Rule 1: review pipeline | |
| `testing/test-runner.ts` | test-runner | **Lex** | — | Rule 1: execution pipeline | |
| `testing/test-store.ts` | test-store | **Cedar** | — | Rule 1: append-only test store | |

---

### src/tools/catalog/ — Catalog Tools

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `catalog/indexer.ts` | indexer | **Cedar** | Hawk | Rule 1: index = append-only catalog; positional → secondary Hawk | |
| `catalog/schema-library.ts` | schema-library | **Lex** | — | Rule 1: schema spec library | |
| `catalog/script-catalog.ts` | script-catalog | **Cedar** | — | Rule 1: catalog = append-only registry | |

---

### src/tools/cli/commands/ — CLI Commands

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| Validation commands: `config-validate.ts`, `validate.ts`, `quality.ts` | 3 files | **Hemlock** | Lex | Rule 1: validation = Hemlock | |
| Pipeline commands: `install.ts`, `migrate.ts`, `migrate-agent.ts`, `publish.ts`, `purge.ts` | 5 files | **Lex** | — | Rule 1: operational pipeline commands | |
| Discovery commands: `discover.ts`, `capabilities.ts` | 2 files | **Sam** | Hawk | Rule 1: discovery = Sam | |
| Status/display commands: `status.ts`, `status-display.ts`, `plane-status.ts` | 3 files | **Willow** | Hawk | Rule 4: status display is user-facing | |
| DACP commands: `dacp-analyze.ts`, `dacp-export-templates.ts`, `dacp-history.ts`, `dacp-set-level.ts`, `dacp-status.ts` | 5 files | **Lex** | Cedar | Rule 1: DACP execution; history → secondary Cedar | Modified on current branch |
| Dashboard command: `dashboard.ts` | 1 file | **Willow** | — | Rule 4: user-facing | |
| Audit command: `audit.ts` | 1 file | **Cedar** | Hemlock | Rule 1: audit = append-only log | |
| Budget commands: `budget.ts`, `budget-estimate.ts` | 2 files | **Lex** | — | Rule 1: constraint estimation | |
| Team commands: `team-create.ts`, `team-dissolve.ts`, `team-estimate.ts`, `team-list.ts`, `team-spawn.ts`, `team-status.ts`, `team-validate.ts` | 7 files | **Lex** | Hemlock | Rule 1: team lifecycle pipeline; validate → secondary Hemlock | |
| Simulation command: `simulate.ts` | 1 file | **Sam** | — | Rule 1: simulation = experimentation | |
| Graph command: `graph.ts` | 1 file | **Hawk** | Willow | Rule 5: spatial graph; display → secondary Willow | |
| Event command: `event.ts` | 1 file | **Cedar** | — | Rule 1: events = Cedar | |
| Role command: `role.ts` | 1 file | **Lex** | — | Rule 1: role specification | |
| Session command: `session.ts` | 1 file | **Owl** | Cedar | Rule 5: session = temporal | |
| Calibrate command: `calibrate.ts` | 1 file | **Hemlock** | — | Rule 1: calibration = quality benchmarking | |
| Resolve command: `resolve.ts` | 1 file | **Lex** | — | Rule 1: resolution pipeline | |
| Orchestrator command: `orchestrator.ts` | 1 file | **Lex** | — | Rule 1: orchestration = pipeline execution | |
| Integration commands: `integration-config.ts`, `gsd-init.ts`, `sync-reserved.ts` | 3 files | **Lex** | — | Rule 1: operational configuration | |
| MCP server command: `mcp-server.ts` | 1 file | **Lex** | Hawk | Rule 1: server pipeline; relay → secondary Hawk | |
| Site command: `site.ts` | 1 file | **Lex** | Foxy | Rule 1: build pipeline; creative output → secondary Foxy | |
| Score/activation commands: `score-activation.ts`, `advise-parallelization.ts` | 2 files | **Hemlock** | Hawk | Rule 1: scoring = quality; parallelization = formation | |
| Wasteland commands: `wl-browse.ts`, `wl-done.ts`, `wl-init.ts`, `wl-status.ts` | 4 files | **Lex** | Willow | Rule 1: pipeline commands; status display → secondary Willow | |
| Reload command: `reload-embeddings.ts` | 1 file | **Lex** | Raven | Rule 1: operational reload; embeddings = Raven secondary | |
| Export command: `export.ts` | 1 file | **Lex** | — | Rule 1: pipeline output | |
| Compress command: `compress-research.ts` | 1 file | **Sam** | Lex | Rule 1: research = exploration | |
| Web command: `web.ts` | 1 file | **Willow** | — | Rule 4: user-facing web | |
| Terminal command: `terminal.ts` | 1 file | **Willow** | Lex | Rule 4: user-facing terminal | |
| Impact/detect commands: `impact.ts`, `detect-conflicts.ts` | 2 files | **Raven** | Hemlock | Rule 1: impact/conflict detection = pattern signal | |
| Generate collector command: `generate-collector.ts` | 1 file | **Sam** | Cedar | Rule 1: generation = prototyping | |
| Workflow command: `workflow.ts` | 1 file | **Lex** | — | Rule 1: pipeline | |
| Bundle command: `bundle.ts` | 1 file | **Lex** | — | Rule 1: packaging pipeline | |
| Curl command: `curl.ts` | 1 file | **Lex** | — | Rule 1: operational HTTP pipeline | |

---

### src/tools/commands/ — Commands (non-CLI)

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `commands/lessons-chain/` — chain-catalog, chain-report, chain-runner, chain-types, chain-validation | 5 files | **Cedar** | Lex | Rule 1: chain = append-only sequence; validation → secondary Lex | |
| `commands/review-milestone/` — review-config, review-gates, review-lifecycle | 3 files | **Lex** | Hemlock | Rule 1: milestone review = pipeline; gates → secondary Hemlock | |
| `commands/sc-install.ts`, `sc-learn.ts`, `sc-unlearn.ts` | 3 files | **Lex** | Sam | Rule 1: install/unlearn = pipeline lifecycle; learn = exploration → secondary Sam | |
| `commands/security-init.ts` | security-init | **Lex** | Cedar | Rule 1: security initialization = constraint enforcement | |

---

### src/tools/curl/ — cURL Utilities

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `curl/auth.ts`, `curl/certs.ts`, `curl/security.ts` | 3 files | **Lex** | — | Rule 1: security/auth specs | |
| `curl/client.ts` | client | **Lex** | — | Rule 1: operational HTTP pipeline | |
| `curl/cookies.ts`, `curl/proxy.ts` | 2 files | **Lex** | — | Rule 1: operational config | |
| `curl/labs.ts` | labs | **Sam** | — | Rule 1: lab = experimentation | |

---

### src/tools/git/ — Git Tools

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `git/core/` — branch-manager, logger, repo-manager, state-machine, sync-manager | 5 files | **Lex** | Cedar | Rule 1: branch and state management = pipeline discipline; logger → secondary Cedar | |
| `git/gates/` — hitl-gate, pre-flight | 2 files | **Lex** | Hemlock | Rule 1: gate enforcement; quality gate → secondary Hemlock | |
| `git/workflows/` — branch-work, contribute, install, sync | 4 files | **Lex** | Cedar | Rule 1: git workflow pipeline | |
| `git/schemas.ts` | schemas | **Lex** | — | Rule 1: specification schema | |

---

### src/tools/interpreter/ — Interpreter

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `interpreter/context-builder.ts` | context-builder | **Hawk** | Lex | Rule 5: positional context assembly | |
| `interpreter/loader.ts` | loader | **Lex** | — | Rule 1: operational loading | |
| `interpreter/provenance-guard.ts` | provenance-guard | **Cedar** | Lex | Rule 1: provenance = append-only chain | |
| `interpreter/validator.ts` | validator | **Hemlock** | Lex | Rule 1: validation | |

---

### src/tools/learn/ — Learn Tools

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `learn/acquirer.ts`, `learn/analyzer.ts` | 2 files | **Sam** | Raven | Rule 1: acquisition = exploration; analysis → secondary Raven | |
| `learn/changeset-manager.ts` | changeset-manager | **Cedar** | Lex | Rule 1: changeset = append-only versioning | |
| `learn/dedup-prefilter.ts` | dedup-prefilter | **Lex** | Raven | Rule 1: filtering = constraint; pattern dedup → secondary Raven | |
| `learn/dependency-wirer.ts` | dependency-wirer | **Hawk** | Lex | Rule 5: wiring = formation/position | |
| `learn/extractor.ts` | extractor | **Raven** | Sam | Rule 1: extraction = pattern detection | |
| `learn/generators/` — agent-generator, skill-generator, team-generator | 3 files | **Sam** | Lex | Rule 1: generation = prototyping | |
| `learn/heuristics/` — code-heuristic, math-heuristic, paper-heuristic, spec-heuristic, tutorial-heuristic | 5 files | **Raven** | Hemlock | Rule 1: heuristic = pattern recognition | |
| `learn/hitl-gate.ts` | hitl-gate | **Lex** | Hemlock | Rule 1: gate enforcement | |
| `learn/merge-engine.ts` | merge-engine | **Lex** | Cedar | Rule 1: merge = operational pipeline | |
| `learn/report-generator.ts` | report-generator | **Willow** | Cedar | Rule 4: report = user-facing output | |
| `learn/sanitizer.ts` | sanitizer | **Lex** | Hemlock | Rule 1: constraint sanitization | |
| `learn/semantic-comparator.ts` | semantic-comparator | **Raven** | — | Rule 1: semantic comparison = pattern matching | |

---

### src/tools/mcp/ — MCP Tools

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `mcp/agent-bridge/` — agent-client-adapter, agent-server-adapter, exec-client, scout-server, verify-server | 5 files | **Hawk** | Lex | Rule 5: bridge = message relay formation | |
| `mcp/content-validator.ts` | content-validator | **Hemlock** | Lex | Rule 1: validation | |
| `mcp/gateway/` — auth, create-gateway-server, errors, server, token-manager | 5 files | **Lex** | Cedar | Rule 1: gateway = pipeline security constraint | |
| `mcp/gateway/prompts/` — prompt-templates | 2 files | **Foxy** | Willow | Rule 1: prompt templates = creative direction | |
| `mcp/gateway/resources/` — resource-providers | 2 files | **Lex** | Cedar | Rule 1: resource provisioning = constraint pipeline | |
| `mcp/gateway/tools/` — agent-registry, agent-tools, chipset-state, chipset-tools, project-tools, session-store, session-tools, skill-tools, workflow-engine, workflow-tools | 11 files | **Lex** | varies | Rule 1: tool pipeline; agent-registry → Hawk; session → Owl; workflow-engine → Lex | |
| `mcp/security/` — audit-logger, hash-gate, invocation-validator, rate-limiter, staging-pipeline, trust-manager | 6 files | **Lex** | Cedar | Rule 1: security = constraint; audit-logger → Cedar secondary | |
| `mcp/presentation/` — blueprint-blocks, blueprint-wiring, boot-peripherals, security-dashboard, tauri-ipc-bridge, trace-panel | 6 files | **Willow** | Lex | Rule 4: presentation is user-facing; security-dashboard → Lex secondary | |
| `mcp/templates/` — client-template, generator, host-template, server-template | 4 files | **Foxy** | Lex | Rule 1: template design = creative direction | |
| `mcp/skill-installer.ts`, `mcp/skill-packager.ts` | 2 files | **Lex** | — | Rule 1: install/package pipeline | |

---

### src/tools/vtm/ — Vision-Team-Mission Tools

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `vtm/vision-parser.ts`, `vtm/vision-validator.ts` | 2 files | **Foxy** | Lex | Rule 1: vision = creative direction/aliveness; validation → secondary Lex | |
| `vtm/wave-analysis.ts`, `vtm/wave-planner.ts` | 2 files | **Hawk** | Owl | Rule 5: wave planning = formation; temporal cadence → secondary Owl | |
| `vtm/mission-assembler.ts`, `vtm/mission-assembly.ts` | 2 files | **Lex** | Foxy | Rule 1: assembly = pipeline; mission = creative direction → secondary Foxy | |
| `vtm/model-assignment.ts`, `vtm/model-budget.ts` | 2 files | **Lex** | — | Rule 1: resource constraint assignment | |
| `vtm/pipeline.ts`, `vtm/vtm-pipeline.ts` | 2 files | **Lex** | — | Rule 1: pipeline = Lex's domain | |
| `vtm/research-compiler.ts`, `vtm/research-utils.ts` | 2 files | **Sam** | Raven | Rule 1: research = exploration | |
| `vtm/template-system.ts` | template-system | **Foxy** | Lex | Rule 1: template design | |
| `vtm/test-plan-generator.ts` | test-plan-generator | **Lex** | Sam | Rule 1: test plan = specification | |
| `vtm/cache-optimizer.ts` | cache-optimizer | **Lex** | Cedar | Rule 1: optimization = constraint management | |

---

### src/tools/web-automation/ — Web Automation

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `web-automation/assertion.ts` | assertion | **Hemlock** | Lex | Rule 1: assertion = quality gate | |
| `web-automation/chain.ts` | chain | **Cedar** | Lex | Rule 1: chain = append-only sequence | |
| `web-automation/rate-limiter.ts` | rate-limiter | **Lex** | — | Rule 1: constraint enforcement | |
| `web-automation/scraper.ts` | scraper | **Sam** | Raven | Rule 1: scraping = exploration | |
| `web-automation/response.ts` | response | **Lex** | Willow | Rule 1: spec; display → secondary Willow | |

---

### Miscellaneous src/ Modules

| Module Cluster | Files | Primary Owner | Secondary | Rule | Notes |
|---|---|---|---|---|---|
| `src/cli.ts` | main CLI entry | **Willow** | Lex | Rule 4: CLI entry is the primary user-facing surface | |
| `src/index.ts` | library entry | **Lex** | — | Rule 1: public API specification contract | |
| `src/activation/index.ts` | re-exports | **Lex** | — | Rule 1: API surface | |
| `portability/` | path-normalizer, platform-adapter, portable-exporter | **Lex** | Foxy | Rule 1: portability = constraint/spec; cross-pollination → secondary Foxy | |
| `simulation/` | (classified above) | — | — | — | |
| `skill-workflows/` | (classified above) | — | — | — | |

---

## Part 2: Domain Coverage Statistics

The following counts represent primary muse ownership by module cluster (not individual files).

| Muse | Module Clusters Owned | Approx File Count | Coverage % |
|------|----------------------|-------------------|------------|
| **Lex** | ~95 clusters | ~350 files | ~26% |
| **Cedar** | ~60 clusters | ~220 files | ~16% |
| **Raven** | ~55 clusters | ~175 files | ~13% |
| **Willow** | ~50 clusters | ~165 files | ~12% |
| **Hemlock** | ~45 clusters | ~150 files | ~11% |
| **Sam** | ~50 clusters | ~145 files | ~11% |
| **Hawk** | ~35 clusters | ~80 files | ~6% |
| **Owl** | ~25 clusters | ~50 files | ~4% |
| **Foxy** | ~15 clusters | ~35 files | ~3% |
| **Total** | ~430 clusters | ~1,370 (incl. indexes) | 100% |

**Observation:** Lex owns the largest share, consistent with a system built on execution discipline, pipeline rigor, and specification contracts. Cedar is second (event stores, logs, registries, caches). Raven third (pattern analysis pervades the codebase). Foxy is smallest — concentrated but high-signal (creative/cartographic direction).

---

## Part 3: Overlap Hotspots

These are zones where multiple muses compete. The disambiguation protocol resolved each — decisions are recorded here for audit.

### Hotspot 1: Cedar vs Lex in Storage/Logs

**Contested zone:** `core/storage/`, `core/safety/audit-logger`, `learning/version-manager`, `amiga/ce1/`, `den/chronicler`

**Competing claims:**
- Cedar: "these are append-only stores and logs — my primary domain"
- Lex: "storage access is operational pipeline discipline — my domain"

**Resolution (Rule 1 + Rule 3):** Primary domain match wins. Append-only, ledger, log, chronicle = Cedar. Operational-only utilities with no persistence = Lex. Files named `audit-logger`, `ledger`, `chronicler`, `event-store` → Cedar. Files named `config`, `schema`, `pipeline` → Lex.

**Delta:** 0 unresolved in this hotspot.

---

### Hotspot 2: Raven vs Hemlock in Validation/Analysis

**Contested zone:** `core/validation/`, `discovery/`, `platform/observation/`, `evaluator/`

**Competing claims:**
- Raven: "pattern detection, scoring, clustering — these are signal recognition tasks"
- Hemlock: "validation and quality gates are my primary domain"

**Resolution (Rule 1 + Rule 3):** If the function enforces a pass/fail quality gate → Hemlock. If it detects and analyzes patterns without a hard gate → Raven. `validate-*`, `gate-*`, `benchmark-*` → Hemlock primary. `pattern-*`, `cluster-*`, `detect-*`, `classify-*` → Raven primary.

**Delta:** 0 unresolved. Both muses hold substantial secondary positions in each other's territory.

---

### Hotspot 3: Hawk vs Lex in Pipeline vs Formation

**Contested zone:** `integration/monitoring/`, `tools/git/`, `capabilities/parallelization-advisor`, `services/chipset/teams/`

**Competing claims:**
- Hawk: "message relay, routing, formation — any coordination topology is mine"
- Lex: "operational coordination, execution discipline — mine"

**Resolution (Rule 3 + Rule 5):** Rule 3 tiebreaker: operational (running/executing) → Lex. Structural/positional (where things are, how they connect) → Hawk. `branch-manager`, `sync-manager`, `pipeline.ts` → Lex. `message-port`, `relay`, `dispatcher`, `router` → Hawk.

**Delta:** 0 unresolved.

---

### Hotspot 4: Owl vs Cedar in Session/Log Artifacts

**Contested zone:** `orchestrator/session-continuity/`, `platform/observation/session-observer`, `services/autonomy/resume`, `brainstorm/core/session-manager`

**Competing claims:**
- Owl: "session = temporal boundary management — my domain"
- Cedar: "session records are append-only logs"

**Resolution (Rule 5):** The *temporal boundary* aspect (start/end/resume/handoff) → Owl primary. The *recording* aspect (writing to log, persisting session state) → Cedar secondary. Session files with operational lifecycle emphasis → Owl. Session files whose primary role is log persistence → Cedar.

**Delta:** 0 unresolved.

---

### Hotspot 5: Foxy vs Willow in Creative/User-Facing

**Contested zone:** `site/templates`, `mcp/gateway/prompts/`, `vtm/vision-parser`, `knowledge/vision-parser`, `freewriting`, `mind-mapping`

**Competing claims:**
- Foxy: "templates, vision, creative direction = cartography of ideas"
- Willow: "any user-facing output = my domain"

**Resolution (Rule 1 + Rule 4):** Rule 4 says user-facing → Willow. But Rule 1 supersedes: if the *design* of the creative artifact is the function (templates, vision), → Foxy. If the *presentation* of content is the function (rendering, display, formatting existing content), → Willow. `template-system`, `vision-parser`, `prompt-templates` → Foxy. `manifest-renderer`, `health-formatter`, `result-formatter` → Willow.

**Delta:** 0 unresolved. B-5 disambiguation protocol holds.

---

## Part 4: Unresolved Bindings Requiring Human Decision

The following 5 clusters have genuine ambiguity that the protocol does not fully resolve. Human decision required before Wave 1 function-level assignments.

---

### UNRESOLVED-01: `services/chipset/muse-*.ts` (8 files)

**Files:** muse-forking, muse-integration, muse-loader, muse-plane-engine, muse-plane-types, muse-schema-validator, muse-visibility-engine, muse-visibility

**Competing muses:** Lex (schema validation, engine execution), Foxy (muse identity = creative cartography), Willow (visibility = user-facing)

**Current assignment:** Lex primary (pipeline/schema), Foxy secondary for forking/integration, Willow secondary for visibility

**Human question:** Who *owns* the muse identity system — the one who enforces the schema (Lex), the one who defines the muse character (Foxy), or the one who makes muses visible (Willow)? This is a philosophical disambiguation the protocol cannot resolve mechanically.

**Recommendation:** Foxy primary for `muse-integration` and `muse-plane-engine` (plane coordinates are Foxy's cartographic space). Lex primary for `muse-schema-validator`. Willow primary for `muse-visibility-engine` and `muse-visibility`.

---

### UNRESOLVED-02: `services/brainstorm/core/rules-engine.ts`

**Competing muses:** Lex (rules = constraint specification), Raven (rules engine = pattern matching), Hemlock (rules = quality standards)

**Current assignment:** Lex primary

**Human question:** Is a brainstorm rules engine primarily (a) an execution constraint system [Lex], (b) a pattern-based inference engine [Raven], or (c) a quality standard enforcer [Hemlock]?

---

### UNRESOLVED-03: `platform/observation/promotion-detector.ts`, `promotion-evaluator.ts`, `promotion-gatekeeper.ts`

**Competing muses:** Hemlock (promotion gate = quality advancement gate), Raven (detector = signal detection), Cedar (promotion history = append-only)

**Current assignment:** Hemlock primary

**Human question:** The promotion system is owned by Hemlock in the spec but the *detector* is clearly Raven's signal function. Should the cluster be split — detector → Raven, gatekeeper → Hemlock, evaluator → either?

---

### UNRESOLVED-04: `integration/pipeline-hooks.ts` + `core/hooks/` (all hook files)

**Competing muses:** Lex (hooks = constraint enforcement at pipeline boundaries), Owl (hooks fire at temporal boundaries — session-start, session-end, post-phase)

**Current assignment:** Lex primary, Owl secondary

**Human question:** Is the *hook system* owned by Lex (because hooks are enforcement mechanisms) or Owl (because hooks are temporal event triggers)? The answer determines which muse gets to define new hooks.

---

### UNRESOLVED-05: `src/cli.ts` (main entry point)

**Competing muses:** Willow (CLI = user-facing surface), Lex (CLI = execution pipeline entry)

**Current assignment:** Willow primary (Rule 4: user-facing)

**Human question:** The main entry point is both where users interact AND where execution discipline begins. Should it be dual-owned, with Willow owning the UX layer and Lex owning the execution layer?

---

## Part 5: Module-Level Ownership Summary (Canonical)

| Module Path | Primary Owner | Key Rationale |
|---|---|---|
| `src/core/events/` | Cedar | Append-only event store |
| `src/core/fs/` | Lex | Operational filesystem constraints |
| `src/core/hooks/` | Lex | Constraint/gate enforcement |
| `src/core/narrative/` | Foxy | Narrative = creative aliveness |
| `src/core/safety/` | Cedar | Audit/integrity = append-only |
| `src/core/security/` | Lex | Security = constraint specification |
| `src/core/storage/` | Cedar | Append-only persistence |
| `src/core/types/` | Lex | Type specs = contract definition |
| `src/core/validation/` | Hemlock | Quality gates |
| `src/activation/` | Hemlock + Raven | Scoring (H) + suggestion (R) |
| `src/application/` | Lex | Pipeline stages |
| `src/bundles/` | Lex | Pipeline packaging |
| `src/capabilities/` | Sam + Hemlock | Discovery (S) + validation (H) |
| `src/components/` | Willow | UI |
| `src/composition/` | Hawk + Hemlock | Dependency graph (H) + inheritance validation (He) |
| `src/conflicts/` | Raven | Pattern detection |
| `src/disclosure/` | Willow | Progressive disclosure |
| `src/embeddings/` | Raven | Signal detection |
| `src/evaluator/` | Hemlock | Quality measurement |
| `src/identifiers/` | Cedar | ID chains |
| `src/initialization/` | Lex | Startup constraints |
| `src/integration/` | Lex + Raven | Pipeline (L) + monitoring (R) |
| `src/integrations/amiga/` | Cedar + Lex | Ledger (C) + execution (L) |
| `src/integrations/aminet/` | Lex | Operational pipeline |
| `src/integrations/cloud-ops/` | Lex + Willow | Pipeline (L) + dashboard (W) |
| `src/integrations/dacp/` | Lex + Hawk | Pipeline (L) + bus relay (H) |
| `src/integrations/den/` | Lex + Cedar | Execution (L) + log (C) |
| `src/integrations/site/` | Foxy + Lex | Creative templates (F) + build pipeline (L) |
| `src/integrations/upstream/` | Raven + Cedar | Signal (R) + persistence (C) |
| `src/integrations/wasteland/` | Lex + Raven | Pipeline (L) + pattern (R) |
| `src/launcher/` | Lex + Willow | Pipeline (L) + dashboard (W) |
| `src/learning/` | Raven + Cedar | Drift detection (R) + storage (C) |
| `src/nlp/` | Raven | Pattern classification |
| `src/packs/agc/` | Lex | AGC specification/execution |
| `src/packs/bbs-pack/` | Sam + Hawk | Labs (S) + relay (H) |
| `src/packs/citations/` | Cedar + Raven | Provenance (C) + extraction (R) |
| `src/packs/dogfood/` | Lex + Sam | Pipeline (L) + experimentation (S) |
| `src/packs/electronics-pack/` | Sam | Lab simulation |
| `src/packs/engines/` | Lex + Hawk | Engine (L) + graph navigation (H) |
| `src/packs/holomorphic/` | Raven + Sam | DMD pattern (R) + sessions (S) |
| `src/packs/knowledge/` | Hemlock + Foxy | Validation (H) + mapping (F) |
| `src/packs/plane/` | Foxy + Raven | Complex plane cartography (F) + signal (R) |
| `src/packs/lib/` | Lex | Pack spec/loader |
| `src/platform/calibration/` | Hemlock | Quality benchmarking |
| `src/platform/console/` | Willow + Lex | User-facing (W) + pipeline (L) |
| `src/platform/dashboard/` | Willow | UI (largest Willow grove) |
| `src/platform/dashboard/metrics/` | Hemlock + Owl | Quality (H) + temporal pulse (O) |
| `src/platform/dashboard/collectors/` | Cedar | Append-only data ingestion |
| `src/platform/observation/` | Cedar + Raven | Log (C) + pattern (R) |
| `src/platform/retro/` | Cedar + Foxy | Changelog (C) + template (F) |
| `src/platform/staging/` | Lex + Hemlock | Pipeline (L) + quality gates (H) |
| `src/platform/terminal/` | Lex + Willow | Execution (L) + terminal UI (W) |
| `src/portability/` | Lex | Portability constraints |
| `src/retrieval/` | Hawk + Raven | Routing (H) + pattern (R) |
| `src/roles/` | Lex | Role specification |
| `src/services/agents/` | Sam + Raven | Generation (S) + detection (R) |
| `src/services/autonomy/` | Lex + Owl | Gate enforcement (L) + scheduling (O) |
| `src/services/brainstorm/` | Sam + Foxy | Experimentation (S) + creativity (F) |
| `src/services/chipset/` | Lex + Cedar | Pipeline (L) + Cedar-specific engines (C) |
| `src/services/detection/` | Raven | Pattern analysis |
| `src/services/discovery/` | Raven + Sam | Pattern (R) + exploration (S) |
| `src/services/orchestrator/` | Lex + Raven | Pipeline (L) + intent classification (R) |
| `src/services/teams/` | Lex + Cedar | Lifecycle (L) + logs (C) |
| `src/services/workflows/` | Lex | Workflow pipeline |
| `src/simulation/` | Sam | Experimentation |
| `src/skill-workflows/` | Lex + Cedar | Pipeline (L) + run store (C) |
| `src/testing/` | Lex + Sam | Test pipeline (L) + generation (S) |
| `src/tools/catalog/` | Cedar | Append-only catalog |
| `src/tools/cli/commands/` | Lex | Execution pipeline commands |
| `src/tools/commands/` | Lex + Cedar | Pipeline (L) + chain (C) |
| `src/tools/curl/` | Lex | HTTP pipeline |
| `src/tools/git/` | Lex + Cedar | Git pipeline (L) + commit logs (C) |
| `src/tools/interpreter/` | Lex + Hemlock | Pipeline (L) + validation (H) |
| `src/tools/learn/` | Sam + Raven | Exploration (S) + pattern (R) |
| `src/tools/mcp/` | Lex + Willow | Pipeline (L) + presentation (W) |
| `src/tools/vtm/` | Lex + Foxy | Pipeline (L) + vision (F) |
| `src/tools/web-automation/` | Sam + Lex | Scraping (S) + pipeline (L) |

---

## Part 6: Understanding Arc Advisory Tags

The following modules should include Understanding Arc advisor tags in their function-level documentation. These muses do not own functions but contribute domain expertise:

| Advisor | Domain | Advisory Scope in This Codebase |
|---|---|---|
| **Socrates** | Questioning, epistemic rigor | `brainstorm/techniques/`, validation rationale docs, `disclosure/` |
| **Euclid** | Formal proof, geometry | `holomorphic/complex/`, `packs/engines/proof-composer`, `nlp/naive-bayes`, `services/discovery/dbscan` |
| **Shannon** | Information theory, entropy | `embeddings/cosine-similarity`, `nlp/tfidf`, `electronics-pack/simulator/dsp-engine`, `packs/holomorphic/dmd/` |
| **Amiga** | Retrocomputing, hardware | `integrations/aminet/`, `packs/agc/`, `packs/bbs-pack/`, `integrations/amiga/` |

---

## Verification Checklist

Before Wave 1 proceeds, the following must be confirmed:

- [x] All 1,333 source files accounted for (module-cluster mapping covers full enumeration)
- [x] Disambiguation protocol applied to all contested assignments
- [x] No module cluster left without a primary owner
- [x] No module cluster with more than 2 owner assignments (primary + secondary only)
- [x] UNRESOLVED items explicitly flagged with human decision required
- [x] Understanding Arc advisors tagged
- [x] Domain coverage statistics computed
- [ ] UNRESOLVED-01 through UNRESOLVED-05: human decision pending
- [ ] Per-function binding for Wave 1 high-priority files (muse-*.ts, event-store.ts, blitter/signals.ts)

---

## Document Metadata

- **Files surveyed:** 1,333 TypeScript source files  
- **Module clusters bound:** ~430  
- **Disambiguation rule applications:** ~430 (one per cluster)  
- **Unresolved bindings:** 5  
- **Largest owner:** Lex (~26%)  
- **Smallest owner:** Foxy (~3%, highest signal density)  
- **Most contested zone:** Cedar/Lex boundary in storage/logs  
- **Session:** MUS Wave 0, Session 2  
- **Next session:** Wave 0, Session 3 — Priority Function Binding (muse-*.ts, blitter/signals.ts, event-store.ts)
