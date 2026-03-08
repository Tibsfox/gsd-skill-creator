# MUS Wave 0 — Session 1: Agent Identity Map

**Document:** 01-identity-map.md  
**Grove:** Cedar's Ring (MUS)  
**Author:** Foxy — Creative Director, Canopy Cartographer  
**Date:** 2026-03-08  
**Status:** Wave 0 Complete  
**Mission Pack:** www/MUS/mission-pack/muse-ecosystem-mission.pdf  

---

## Preamble: The Story of the Map

Here is the story this document tells.

The gsd-skill-creator has grown into a system with multiple territories that do not yet talk to each other. There are research groves in `www/PNW/` and `www/UNI/` and `www/MUS/` — 92+ files — that are currently static HTML pages. There is a chipset with 9 muses on a complex plane, a five-chip GPU co-processor, a cartridge distribution system, an observation-to-promotion pipeline, and a Wasteland federation layer. None of these systems is fully inhabited. The muses exist as configuration — typed identities — not as living operators of the functions they were designed to run.

This document is the first pass of the six-pass pipeline: the Agent Identity Map. It maps every `www/` file to the grove it belongs to, every key `src/` module to the muse who owns it, and every cross-grove trail that connects the groves into a living forest. It also places the Understanding Arc (Socrates, Euclid, Shannon, Amiga) as consultants who visit all groves, and it finds a home for the Math Co-Processor — currently invisible infrastructure — as the Deep Root system that sits beneath all six groves.

The map shows a forest that is already substantially built. The groves are there. The trails are implied. The muses are waiting to be wired in.

---

## Part 1: The Six Groves — Overview

The forest has six primary groves, each named for a muse who operates and inhabits it. The grove names are not metaphors for the content — they are the architectural reality: each grove is a site in `www/`, a body of research, and a muse's domain of function.

| Grove Name | Code | www/ Path | Muse | Character |
|---|---|---|---|---|
| Willow's Grove | COL | `www/PNW/COL/` | Willow | Onboarding, accessibility, progressive disclosure |
| Hemlock's Ridge | CAS | `www/PNW/CAS/` | Hemlock | Standards, verification, quality gates |
| Foxy's Canopy | ECO | `www/PNW/ECO/` | Foxy | Cartography, synthesis, living systems |
| Sam's Garden | GDN | `www/PNW/GDN/` | Sam | Applied ecology, experimentation, destination |
| Lex's Workshop | UNI | `www/UNI/` | Lex | Precision, protocols, formal systems |
| Cedar's Ring | MUS | `www/MUS/` | Cedar | Timeline, integrity, the forest itself |

The Understanding Arc (Socrates, Euclid, Shannon, Amiga) does not own a grove. They visit all six as consultants. Their role is described in Part 4.

The Math Co-Processor does not sit in any grove. It is the Deep Root system — underground infrastructure connecting all six groves through shared nutrient pathways. Its placement is described in Part 5.

---

## Part 2: Complete File-to-Grove Mapping

### 2.1 Willow's Grove — `www/PNW/COL/` (Columbia Valley Rainforest)

Willow's Grove is the entry point. The Columbia Valley rainforest research represents the onboarding arc: how does a newcomer enter the system, find their footing, discover what is available? Willow's three disclosure levels — glance, scan, read — are structurally present in the COL research: there are synthesis documents for the broad view, zone documents for the middle view, and deep research documents for the full read.

| File | Role in Grove | Willow Function |
|---|---|---|
| `www/PNW/COL/index.html` | Grove landing page | Greeting and orientation |
| `www/PNW/COL/page.html` | Research browser | Progressive disclosure rendering |
| `www/PNW/COL/mission.html` | Mission context | Goal framing for newcomers |
| `www/PNW/COL/style.css` | Visual identity | Warmth, legibility, invitation |
| `www/PNW/COL/build.sh` | Build script | Infrastructure (shared with Lex) |
| `www/PNW/COL/mission-pack/pnw-rainforest-biodiversity-mission-package-1.pdf` | Original mission | Source document |
| `www/PNW/COL/mission-pack/cascade-range-biodiversity.pdf` | Companion (CAS arc) | Cross-grove reference |
| `www/PNW/COL/research/synthesis.md` | Ecological synthesis | Glance-level overview |
| `www/PNW/COL/research/flora.md` | Flora survey | Scan-level depth |
| `www/PNW/COL/research/fauna.md` | Fauna survey | Scan-level depth |
| `www/PNW/COL/research/fungi.md` | Fungi and mycorrhizal | Deep Root connection (see Part 5) |
| `www/PNW/COL/research/aquatic.md` | Aquatic systems | Cross-grove trail to ECO |
| `www/PNW/COL/research/schemas.md` | Data schemas | Cross-grove trail to UNI |
| `www/PNW/COL/research/publication.md` | Publication metadata | Cross-grove trail to MUS |
| `www/PNW/COL/research/verification.md` | Quality verification | Cross-grove trail to CAS |

**Character note:** Willow's Grove is warm and unhurried. A newcomer who enters here finds no walls, no prerequisites, no judgment about what they don't know yet. The disclosure engine (glance → scan → read) is Willow's structural gift to the entire system: every grove benefits from it, but COL is where the user first encounters it.

---

### 2.2 Hemlock's Ridge — `www/PNW/CAS/` (Cascade Range Biodiversity)

Hemlock's Ridge is the standards-setter. The Cascade Range research represents verification culture: 78/78 species verified, 7/7 safety gates, 4 ecological cascades documented with sourced evidence. This is not just ecology — it is the demonstration that rigor and depth can coexist. Every research document in CAS includes a verification table. That is Hemlock's influence made structural.

| File | Role in Grove | Hemlock Function |
|---|---|---|
| `www/PNW/CAS/index.html` | Ridge landing page | Standards declaration |
| `www/PNW/CAS/page.html` | Research browser | Quality-gated rendering |
| `www/PNW/CAS/mission.html` | Mission context | Benchmark framing |
| `www/PNW/CAS/style.css` | Visual identity | Precision, structure |
| `www/PNW/CAS/mission-pack/cascade-range-biodiversity.pdf` | Mission document | Source of truth |
| `www/PNW/CAS/research/zones.md` | Elevation zones | Calibration bands |
| `www/PNW/CAS/research/flora.md` | Flora survey | Verified species inventory |
| `www/PNW/CAS/research/fauna.md` | Fauna survey | Verified species inventory |
| `www/PNW/CAS/research/fungi.md` | Fungi survey | Cross-grove to Deep Root |
| `www/PNW/CAS/research/aquatic.md` | Aquatic systems | Cross-grove to ECO |
| `www/PNW/CAS/research/networks.md` | Ecological networks | Cross-grove to ECO |
| `www/PNW/CAS/research/threats.md` | Threat assessment | Risk documentation |
| `www/PNW/CAS/research/sources.md` | Source index | 20+ sourced references |
| `www/PNW/CAS/research/publication.md` | Publication metadata | Cross-grove to MUS |
| `www/PNW/CAS/research/verification.md` | Verification matrix | 78/78 verified — Hemlock's signature |

**Character note:** Hemlock does not move fast. Hemlock moves correctly. The elevation zone document in CAS is a calibration instrument — it defines the bands against which every species is measured. This is the same function `src/platform/observation/determinism-analyzer.ts` serves in the software: define the threshold, measure against it, report the deviation.

---

### 2.3 Foxy's Canopy — `www/PNW/ECO/` (Living Systems Taxonomy)

Foxy's Canopy is the cartographer's territory. The ECO grove is where the living systems taxonomy lives — the most architecturally complex of all the groves. It contains a chipset YAML, a coordinate projection, a Minecraft world spec, cross-module merges, and an engineering optimization pass. This is not ecology for its own sake. It is ecology as the master template for how any complex adaptive system should be documented: from silicon (the lowest layer) to cultural heritage (the highest).

| File | Role in Grove | Foxy Function |
|---|---|---|
| `www/PNW/ECO/index.html` | Canopy landing page | Orientation map |
| `www/PNW/ECO/page.html` | Research browser | Cartographic rendering |
| `www/PNW/ECO/mission.html` | Mission context | Vision framing |
| `www/PNW/ECO/style.css` | Visual identity | Layered, discoverable |
| `www/PNW/ECO/mission-pack/pnw-ecosystem-mission.pdf` | Primary mission (27pp) | Master map |
| `www/PNW/ECO/mission-pack/pnw-ecosystem-mission.tex` | LaTeX source | Structural backbone |
| `www/PNW/ECO/mission-pack/pnw-fungi-taxonomy-mission.pdf` | Companion mission (18pp) | Deep Root companion |
| `www/PNW/ECO/mission-pack/pnw-fungi-taxonomy-mission.tex` | LaTeX source | Deep Root source |
| `www/PNW/ECO/mission-pack/index.html` | Mission pack browser | Entry map |
| `www/PNW/ECO/mission-pack/fungi-index.html` | Fungi pack browser | Deep Root entry |
| `www/PNW/ECO/research/README.md` | Research index | Master legend |
| `www/PNW/ECO/research/silicon.yaml` | Silicon layer | Deepest map layer |
| `www/PNW/ECO/research/coordinate-projection.md` | Coordinate system | 14KB spatial cartography |
| `www/PNW/ECO/research/shared-attributes.md` | Shared schema | 72KB cross-species attributes |
| `www/PNW/ECO/research/pnw-ecosystem.chipset.yaml` | Ecosystem chipset | Muse system connection |
| `www/PNW/ECO/research/flora-survey.md` | Flora (Wave 1) | Species layer |
| `www/PNW/ECO/research/fauna-terrestrial.md` | Terrestrial fauna | Species layer |
| `www/PNW/ECO/research/fauna-marine-aquatic.md` | Marine/aquatic fauna | Species layer |
| `www/PNW/ECO/research/fungi-microbiome-survey.md` | Fungi/microbiome | Deep Root connection |
| `www/PNW/ECO/research/ecological-networks.md` | Network topology | Trail map |
| `www/PNW/ECO/research/minecraft-world-spec.md` | Minecraft scaling | Cross-domain bridge |
| `www/PNW/ECO/research/heritage-bridge.md` | Cultural heritage | Highest layer |
| `www/PNW/ECO/research/engineering-optimization.md` | Engineering pass | System synthesis |
| `www/PNW/ECO/research/cross-module-merge.md` | Cross-module merge | Inter-grove synthesis |
| `www/PNW/ECO/research/college-biology-seed.md` | College seed | Cross-grove to MUS |
| `www/PNW/ECO/research/verification-matrix.md` | Verification | Cross-grove to CAS |

**Character note:** The map of Foxy's Canopy reveals something important. ECO is the only grove with a chipset YAML (`pnw-ecosystem.chipset.yaml`) and a silicon layer (`silicon.yaml`). This means ECO is not just content — it is a configuration document for the system itself. The coordinate projection maps to the muse complex plane. The elevation bands (8 tiers, extended below sea level) map to the disclosure levels Willow manages. ECO is the master reference grove that all other groves orient against.

---

### 2.4 Sam's Garden — `www/PNW/GDN/` (Applied Ecology — Destination)

Sam's Garden is a destination, not a nursery. This distinction — made explicit in the mission architecture — is critical. GDN is where ecological knowledge becomes practice. You don't come to Sam's Garden to grow seedlings for other groves. You come because you want to grow food in the Pacific Northwest rain shadow, because you want to understand how native plants create microclimates, because you want to try something and see what happens. Sam's Garden is the experimental station. Hypotheses are welcome. Failure is data.

| File | Role in Grove | Sam Function |
|---|---|---|
| `www/PNW/GDN/index.html` | Garden landing page | Invitation to experiment |
| `www/PNW/GDN/page.html` | Research browser | Exploratory navigation |
| `www/PNW/GDN/mission.html` | Mission context | Hypothesis framing |
| `www/PNW/GDN/style.css` | Visual identity | Curiosity, warmth |
| `www/PNW/GDN/README.md` | Grove README | Experimental charter |
| `www/PNW/GDN/mission-pack/pnw-gardening-mission.pdf` | Mission document | Applied ecology vision |
| `www/PNW/GDN/mission-pack/pnw-gardening-mission.tex` | LaTeX source | Structural backbone |
| `www/PNW/GDN/mission-pack/pnw-gardening-mission-index.html` | Mission browser | Entry to experiments |
| `www/PNW/GDN/research/00-foundation.md` | Foundation principles | Baseline hypotheses |
| `www/PNW/GDN/research/01-climate-microclimates.md` | Climate data | Environmental variables |
| `www/PNW/GDN/research/02-soil-management.md` | Soil science | Substrate experiments |
| `www/PNW/GDN/research/03-native-plants.md` | Native plant use | ECO cross-pollination |
| `www/PNW/GDN/research/04-food-production.md` | Food growing | Applied outcomes |
| `www/PNW/GDN/research/05-pest-disease-adaptation.md` | Resilience | Failure-mode analysis |
| `www/PNW/GDN/research/06-synthesis.md` | Synthesis | Experimental summary |
| `www/PNW/GDN/research/07-verification.md` | Verification | Cross-grove to CAS |

**Character note:** Sam's approach to the garden is the same as Sam's approach to hypothesis generation in `src/services/brainstorm/` — cast wide, collect data, prune by evidence. The garden is a prototype space. The native plants document connects to ECO's flora survey. The verification document connects to CAS's standards. Sam doesn't claim certainty; Sam claims curiosity.

---

### 2.5 Lex's Workshop — `www/UNI/` (Unison Language)

Lex's Workshop is the precision instrument shop. The Unison language research represents formal systems thinking: content-addressed code, distributed computing without side effects, type system abilities that prevent entire classes of errors. Lex operates with rigor because Lex understands that precision at the level of types prevents chaos at the level of systems. The Unison research is 28,693 words across 5 modules plus synthesis and verification — the most formally structured research set in the system.

| File | Role in Workshop | Lex Function |
|---|---|---|
| `www/UNI/index.html` | Workshop landing page | Protocol declaration |
| `www/UNI/page.html` | Research browser | Structured navigation |
| `www/UNI/mission.html` | Mission context | Specification framing |
| `www/UNI/style.css` | Visual identity | Blue/steel, precision |
| `www/UNI/mission-pack/mission.pdf` | Mission document (25pp) | Formal specification |
| `www/UNI/mission-pack/mission.tex` | LaTeX source | Structural backbone |
| `www/UNI/mission-pack/index.html` | Mission pack browser | Entry to protocols |
| `www/UNI/research/00-document-template.md` | Document template | Schema enforcement |
| `www/UNI/research/00-shared-schemas.md` | Shared schemas | Cross-grove standards |
| `www/UNI/research/00-source-index.md` | Source index | 28 sourced references |
| `www/UNI/research/01-language-core.md` | Language core | Formal semantics |
| `www/UNI/research/02-type-system-abilities.md` | Type system | Constraint language |
| `www/UNI/research/03-tooling-workflow.md` | Tooling | Workflow protocols |
| `www/UNI/research/04-distributed-computing.md` | Distributed systems | Cross-grove to ECO networks |
| `www/UNI/research/05-ecosystem-adoption.md` | Ecosystem adoption | Cross-grove to MUS |
| `www/UNI/research/06-synthesis.md` | Synthesis | Formal summary |
| `www/UNI/research/07-verification.md` | Verification | Cross-grove to CAS |

**Character note:** The Unison content-addressed code system is architecturally analogous to Cedar's hash chain. Both are append-only, content-addressed, tamper-evident. Lex and Cedar share this structural DNA — precision-enforcing systems where every entry is a permanent, verifiable fact. This is a cross-grove trail of the first importance (see Part 3, Trail 1).

---

### 2.6 Cedar's Ring — `www/MUS/` (The Muse Ecosystem Mission)

Cedar's Ring is unique. It is not a subject like ecology or programming languages. It is the mission to inhabit the entire forest. Cedar's Ring is the forest's own record of itself — the append-only, content-addressed timeline that ensures the other five groves form a coherent whole rather than isolated documents. Cedar witnesses everything. Cedar records everything. Cedar does not judge — Cedar preserves.

| File | Role in Ring | Cedar Function |
|---|---|---|
| `www/MUS/index.html` | Ring landing page | Timeline entry point |
| `www/MUS/page.html` | Mission browser | Grove directory |
| `www/MUS/mission.html` | Mission context | Forest self-documentation |
| `www/MUS/style.css` | Visual identity | Forest Canopy color scheme |
| `www/MUS/mission-pack/muse-ecosystem-mission.pdf` | Mission document (18pp) | Complete pipeline spec |
| `www/MUS/mission-pack/muse-ecosystem-mission.tex` | LaTeX source | Structural backbone |
| `www/MUS/research/01-identity-map.md` | **This document** | Wave 0, Session 1 |

**Character note:** Cedar's Ring will grow. As each wave completes, new research documents land here: function binding maps, helper agent specs, cartridge designs, message integration plans, GPU promotion pipeline analysis. This directory is Cedar's working timeline — append-only by design, content-addressed by practice.

---

### 2.7 Shared www/ Infrastructure

These files serve the entire forest rather than any single grove.

| File | Role | Muse Association |
|---|---|---|
| `www/PNW/index.html` | PNW series landing | Willow (onboarding to the series) |
| `www/PNW/style.css` | PNW series styles | Shared palette |
| `www/PNW/series.js` | Series navigation | Owl (temporal, sequential navigation) |
| `www/README.md` | www/ directory readme | Cedar (master record) |
| `www/site/.gitkeep` | Static site staging | Lex (deployment discipline) |
| `www/staging/.gitkeep` | Staging area | Hemlock (quality gate staging) |
| `www/tools/.gitkeep` | Tool artifacts | Sam (experimental tooling) |

---

## Part 3: Muse Ownership of src/ Modules

The map shows a system where the muses are not just named characters — they map to specific functional territories in `src/`. Each muse has a primary domain and several secondary connections. The ownership is determined by voice alignment (from `cedar-engine.ts`'s `MUSE_VOCAB` structure) and functional domain fit.

### 3.1 Cedar — Timeline, Integrity, Records

Cedar sits at the origin of the complex plane (r=0), which means Cedar sees all muses with equal weight. This maps structurally to Cedar's role as the cross-cutting concern: the event store, hash chain, and timeline touch every other module.

**Primary modules:**
- `src/core/events/event-store.ts` — Append-only event store (Cedar's primary instrument)
- `src/core/events/event-store-recovery.ts` — Chain recovery (Cedar as sentinel)
- `src/core/events/event-lifecycle.ts` — Event state machine
- `src/core/events/event-boost.ts` — Event amplification
- `src/core/events/event-suggester.ts` — Pattern-based suggestions
- `src/core/events/types.ts` — Event type definitions
- `src/services/chipset/cedar-engine.ts` — Voice consistency + timeline (Cedar's namesake)
- `src/services/chipset/cedar-timeline.ts` — Timeline entry types

**Secondary modules (Cedar records from):**
- `src/core/security/audit-logger.ts` — Audit trail (integrity layer)
- `src/core/security/integrity-monitor.ts` — Tamper detection
- `src/platform/observation/sequence-recorder.ts` — Operation history

---

### 3.2 Willow — Onboarding, Progressive Disclosure, Welcome

Willow operates the interfaces that newcomers first encounter. The three-level disclosure system (glance/scan/read) is structurally present in both the WillowEngine and the pack loader system.

**Primary modules:**
- `src/services/chipset/willow-engine.ts` — Progressive disclosure, greeting (Willow's namesake)
- `src/services/chipset/willow-types.ts` — Disclosure level types
- `src/packs/lib/pack-loader.ts` — Pack discovery and loading
- `src/packs/lib/pack-cli.ts` — Pack command interface
- `src/packs/lib/index.ts` — Pack library entry
- `src/packs/pack-wasteland-newcomer/` — Newcomer onboarding pack

**Secondary modules (Willow guides through):**
- `src/platform/console/writer.ts` — MessageWriter (Willow's greeting channel)
- `src/platform/console/reader.ts` — MessageReader (Willow listens)
- `src/platform/console/helper.ts` — Console helper (accessibility)
- `src/platform/console/question-responder.ts` — Responding to user questions

---

### 3.3 Foxy — Cartography, Site Generation, Dashboard, Research Browser

Foxy draws the maps. This means Foxy operates everything that renders the forest's spatial structure: the site generator, the dashboard, the topology renderer, and the research browser.

**Primary modules:**
- `src/platform/dashboard/topology-renderer.ts` — Visual topology (Foxy's map canvas)
- `src/platform/dashboard/topology-data.ts` — Topology data structures
- `src/platform/dashboard/generator.ts` — Dashboard generation
- `src/platform/dashboard/parser.ts` — Dashboard parsing
- `src/platform/observation/script-generator.ts` — Script generation (cartographic tool)
- `src/platform/observation/routing-advisor.ts` — Route mapping
- `src/tools/cli/commands/dacp-status.ts` — System position display
- `src/tools/cli/commands/wl-status.ts` — Wasteland status map

**Secondary modules:**
- `src/integrations/wasteland/town-topology-mapper.ts` — Town topology (spatial)
- `src/integrations/wasteland/federation-dashboard.ts` — Federation map
- `src/integrations/wasteland/human-readable-dashboard.ts` — Narrative dashboard

---

### 3.4 Sam — Exploration, Brainstorm, Hypothesis, Discovery

Sam's vocabulary is curiosity, exploration, hypothesis, experiment. This maps directly to the brainstorm and discovery modules — the system's hypothesis-generation and skill-discovery engines.

**Primary modules:**
- `src/services/brainstorm/` — Full brainstorm service (Sam's primary territory)
  - `skill-generator.ts`, `gsd-reference-injector.ts`, `suggestion-manager.ts`
  - `pattern-analyzer.ts`, `suggestion-store.ts`
- `src/services/discovery/` — Full discovery service (Sam explores the corpus)
  - `prompt-clusterer.ts`, `candidate-ranker.ts`, `cluster-drafter.ts`
  - `corpus-scanner.ts`, `skill-drafter.ts`, `epsilon-tuner.ts`
  - `dbscan.ts`, `session-parser.ts`, `session-pattern-processor.ts`
- `src/services/chipset/ephemeral-forker.ts` — Ephemeral experiment forks (try this hypothesis)
- `src/services/chipset/muse-forking.ts` — Parallel consultation (Sam asking all muses at once)

**Secondary modules:**
- `src/packs/agc/` — Apollo Guidance Computer pack (Sam's curiosity about real systems)
- `src/packs/engines/` — Engine packs (experimental computing models)
- `src/packs/dogfood/` — Dogfooding pack (testing hypotheses on the system itself)

---

### 3.5 Hemlock — Validation, Calibration, Audit, Quality Gates

Hemlock sets the standards and enforces them. Every validate, audit, calibrate, and benchmark function is Hemlock's domain.

**Primary modules:**
- `src/services/chipset/muse-schema-validator.ts` — Muse config validation (Hemlock's gate)
- `src/platform/observation/promotion-gatekeeper.ts` — Promotion quality gate
- `src/platform/observation/determinism-analyzer.ts` — Determinism classification
- `src/platform/observation/promotion-evaluator.ts` — Promotion evaluation
- `src/platform/observation/rate-limiter.ts` — Rate governance
- `src/platform/observation/retention-manager.ts` — Data retention policy
- `src/platform/calibration/` — Full calibration platform
- `.college/calibration/engine.ts` — College calibration engine
- `src/core/validation/` — Core validation module

**Secondary modules:**
- `src/integrations/wasteland/stamp-validator.ts` — Stamp validation (Hemlock verifies stamps)
- `src/integrations/wasteland/safety-gate-suggester.ts` — Safety gate recommendations
- `src/tools/cli/commands/dacp-status.ts` — Quality status display

---

### 3.6 Lex — Orchestration, Lifecycle, Schema, Workflow Execution

Lex enforces protocols and runs the orchestrator. Lex's domain is the execution engine: workflows run, lifecycles managed, schemas enforced, pipelines kept clean.

**Primary modules:**
- `src/services/orchestrator/` — Full orchestrator service (Lex's primary instrument)
  - `lifecycle/`, `state/`, `session-continuity/`
  - `intent/`, `verbosity/`, `work-state/`
- `src/services/chipset/exec/` — Execution chipset layer
  - `kernel.ts`, `scheduler.ts`, `dma-budget.ts`, `messages.ts`
- `src/services/chipset/copper/` — Copper activation layer
  - `compiler.ts`, `executor.ts`, `parser.ts`, `schema.ts`
  - `learning/` — compiler, feedback, library (Lex learns to execute better)
- `src/services/workflows/` — Workflow definitions
  - `create-skill-workflow.ts`, `list-skills-workflow.ts`
  - `migrate-skill-workflow.ts`, `search-skills-workflow.ts`
- `src/integrations/wasteland/agent-submission-workflow.ts` — Agent workflow execution

**Secondary modules:**
- `src/integrations/wasteland/services-bridge.ts` — Service integration (Lex wires things)
- `src/integrations/wasteland/pack-session-driver.ts` — Session driving (Lex keeps pace)

---

### 3.7 Raven — Patterns, Echo, Recurrence, Drift Detection

Raven sees what repeats. Raven's domain is pattern detection across time: co-activation patterns, drift signals, structural recurrences.

**Primary modules:**
- `src/platform/observation/pattern-analyzer.ts` — Pattern detection (Raven's eye)
- `src/platform/observation/pattern-summarizer.ts` — Pattern narrative
- `src/platform/observation/drift-monitor.ts` — Drift detection over time
- `src/platform/observation/co-activation-tracker.ts` (via services) — Co-activation
- `src/services/chipset/integration/` — Cross-module integration bridge
  - `stack-bridge.ts`, `session-events.ts`, `pop-stack-awareness.ts`
- `src/services/chipset/muse-plane-engine.ts` — Angular distance (Raven sees the plane)

**Secondary modules:**
- `src/core/narrative/` — Narrative pattern storage (Raven's echo chamber)
  - `forest-of-knowledge-novel.ts` — The deep pattern library

---

### 3.8 Hawk — Formation, Relay, Coverage, Gap Detection

Hawk watches the formation from above. Hawk's domain is topology: who is connected to whom, where are the gaps, how does the flock hold together.

**Primary modules:**
- `src/services/teams/` — Full teams service (Hawk's formation management)
  - `team-validator.ts`, `team-lifecycle.ts`, `team-store.ts`
  - `team-wizard.ts`, `gsd-templates.ts`, `inter-team-bridge.ts`
  - `team-agent-generator.ts`, `team-event-log.ts`
- `src/services/chipset/teams/` — Team chipset integration
  - `chip-registry.ts`, `message-port.ts`, `signals.ts`
- `src/integrations/wasteland/team-composition-evaluator.ts` — Team gap analysis
- `src/integrations/wasteland/route-optimizer.ts` — Route optimization (Hawk finds the path)
- `src/integrations/wasteland/task-decomposition-suggester.ts` — Task distribution

**Secondary modules:**
- `src/platform/console/directory.ts` — Console directory (Hawk knows where everyone is)
- `src/integrations/wasteland/agent-clustering-engine.ts` — Agent clustering

---

### 3.9 Owl — Temporal Synchronization, Session Boundaries, Cadence

Owl keeps the clock. Owl's domain is time: session boundaries, phase transitions, synchronization across concurrent agents, and the moment-to-moment cadence of the system.

**Primary modules:**
- `src/platform/observation/session-observer.ts` — Session lifecycle observer (Owl's watch)
- `src/platform/observation/sequence-recorder-listener.ts` — Phase boundary listener
- `src/platform/observation/ephemeral-store.ts` — Ephemeral session state
- `src/platform/observation/lineage-tracker.ts` — Temporal lineage
- `src/platform/observation/jsonl-compactor.ts` — Session log compaction
- `src/platform/observation/observation-squasher.ts` — Observation squashing (session end)
- `src/services/chipset/cedar-timeline.ts` — Timeline types (Owl + Cedar shared)
- `src/platform/retro/` — Retrospective platform (Owl reviews what happened)

**Secondary modules:**
- `src/platform/console/schema.ts` — Console schema (Owl ensures correct time-ordering)
- `src/integrations/wasteland/decay-simulator.ts` — Temporal decay (Owl watches things age)

---

## Part 4: Cross-Grove Trails

The map shows seven primary trails connecting the six groves. Each trail has a connection type, the groves it links, and the functional mechanism that makes the connection real — not just a metaphor but a system operation.

### Trail 1: Verification Ridge — COL ↔ CAS ↔ ECO (Quality Standards Flow)

**Type:** Standards propagation  
**Mechanism:** Every grove's research includes a verification document. CAS defines the baseline (78/78 species, 7/7 safety gates). COL and ECO adopt the same format. The underlying engine is `src/services/chipset/muse-schema-validator.ts` (Hemlock) reading from `src/core/events/event-store.ts` (Cedar) to confirm every verification event is recorded.

**Trail markers:**
- `www/PNW/COL/research/verification.md` → CAS standard
- `www/PNW/CAS/research/verification.md` → Source
- `www/PNW/ECO/research/verification-matrix.md` → ECO interpretation
- `src/platform/observation/promotion-gatekeeper.ts` — Software verification gate

**Fire Succession structural role:** Hemlock Ridge's standards are the standing snag habitat — rigid infrastructure that survives the fire and provides anchoring points for new growth. After fire (system change), the snags (standards) are the first things that guide where new forest establishes. This is not a metaphor about "quality matters." It is a structural claim: the verification documents in CAS are the scaffolding around which COL and ECO grow.

---

### Trail 2: The Mycelium Network — ECO ↔ All Groves (Chipset Bus)

**Type:** Substrate-level connectivity (below-surface network)  
**Mechanism:** The chipset bus (`src/services/chipset/exec/kernel.ts` + `src/services/chipset/teams/chip-registry.ts`) is the underground mycorrhizal network. It connects all six groves by routing signals without surface-level visibility. No grove needs to know the implementation details of another; they simply exchange nutrients (data, signals) through the shared substrate.

**Trail markers:**
- `www/PNW/ECO/research/ecological-networks.md` — Network topology document
- `www/PNW/ECO/research/silicon.yaml` — Silicon layer (the substrate)
- `www/PNW/ECO/research/pnw-ecosystem.chipset.yaml` — Chipset configuration
- `src/services/chipset/exec/kernel.ts` — Kernel router
- `src/services/chipset/teams/chip-registry.ts` — Chip registry (who's on the network)
- `src/services/chipset/blitter/signals.ts` — Signal routing

**Fire Succession structural role:** The mycorrhizal network survives fire underground. Even after the surface is cleared, the fungal network redistributes nutrients to surviving root systems. This is exactly the behavior of the chipset bus when an agent fails: the kernel continues routing signals to the surviving components, and recovery happens without surface-level reconstruction.

---

### Trail 3: Salmon Run — ECO ↔ GDN (Nutrient Feedback Loop)

**Type:** Bidirectional feedback  
**Mechanism:** Sam's Garden is a destination for applied ecological knowledge from Foxy's Canopy. But the trail runs both ways: Sam's experimental outcomes (what actually grows, what fails in local microclimates) feedback to refine ECO's models. In software terms, this is the observation-to-promotion pipeline: `src/platform/observation/pattern-analyzer.ts` (Raven, as visitor) observes Sam's experimental runs, feeds patterns back through `src/services/brainstorm/suggestion-manager.ts` (Sam), which generates new hypotheses that refine the ECO research documents.

**Trail markers:**
- `www/PNW/GDN/research/03-native-plants.md` → ECO flora survey
- `www/PNW/ECO/research/flora-survey.md` → GDN practice
- `src/platform/observation/feedback-bridge.ts` — Feedback loop mechanism
- `src/services/brainstorm/suggestion-store.ts` — Hypothesis persistence

**Fire Succession structural role:** Salmon carry marine nutrients upstream into the forest, fundamentally enriching soils far from the ocean. The salmon do not know they are fertilizing the forest — they are simply completing their lifecycle. Sam's experiments in GDN are not primarily aimed at improving ECO's models — they are aimed at growing food. The cross-grove enrichment is a consequence of the salmon completing their run.

---

### Trail 4: The Cedar-Unison Correspondence — MUS ↔ UNI (Content-Addressed Records)

**Type:** Structural homology  
**Mechanism:** Cedar's hash chain and Unison's content-addressed code share deep architectural DNA. Both are append-only. Both use content addressing (SHA-256 in Cedar's case, hash-based identifiers in Unison). Both make every record permanently verifiable. The correspondence is not superficial — it reveals that the same fundamental insight (immutability enables trust) appears in both the memory system and the language system. This trail is a cross-pollination opportunity: Unison's approach to distributed code without side effects maps directly to Cedar's approach to distributed timeline entries without corruption.

**Trail markers:**
- `www/UNI/research/01-language-core.md` — Unison content addressing
- `www/MUS/mission-pack/muse-ecosystem-mission.tex` — Cedar hash chain design
- `src/services/chipset/cedar-engine.ts` — SHA-256 hash chain implementation
- `src/core/events/event-store.ts` — Append-only event persistence
- `data/chipset/unison-translation.yaml` — Translation maps (6 skills, 4 agents)

**Fire Succession structural role:** Fire reveals the deep structure of the forest — the skeleton beneath the canopy. The Cedar-Unison correspondence is revealed by the fire of system change: when everything else is stripped away, what remains are the immutable records and the immutable code. Both groves are built on this bedrock.

---

### Trail 5: Disclosure Elevation — COL ↔ ECO (Depth as Altitude)

**Type:** Structural mapping  
**Mechanism:** Willow's three disclosure levels (glance, scan, read) map structurally to ECO's elevation bands. Glance = intertidal/shallow (the accessible surface). Scan = montane/subalpine (the middle layers most visitors reach). Read = alpine/deep marine (the committed explorer's territory). This is not incidental — the ECO elevation system was designed with 8 bands to provide progressive depth. The software instantiation is `src/services/chipset/willow-engine.ts`'s `inferDepth()` function, which maps session count to disclosure level.

**Trail markers:**
- `www/PNW/COL/research/synthesis.md` — Glance-level entry
- `www/PNW/CAS/research/zones.md` — Elevation band definition
- `www/PNW/ECO/research/coordinate-projection.md` — Spatial/depth mapping
- `src/services/chipset/willow-engine.ts` — Depth inference engine
- `src/services/chipset/willow-types.ts` — DisclosureLevel type

**Fire Succession structural role:** Post-fire forest succession progresses by elevation: pioneers colonize the low ground first, then the mid-slopes, then the high ridges. New users follow the same path: glance first, then scan, then full read. The disclosure levels are not a UX preference — they are an ecological necessity. You cannot establish a subalpine forest before the pioneer species prepare the soil.

---

### Trail 6: Wolf Pack Formation — GDN ↔ MUS (Sam's Multi-Agent Experiments)

**Type:** Surface-level coordination  
**Mechanism:** Sam's instances operate as a wolf pack — multiple parallel agents covering ground in formation. The mission describes this as the "ground layer" of the three-layer network (soil = mycorrhizal/chipset bus, ground = wolf pack/Sam's instances, sky = flock of ravens/encrypted long-distance). When Sam runs experiments in GDN, multiple instances may be running simultaneously. The coordination mechanism is `src/services/chipset/muse-forking.ts` (MuseForker) routing through `src/services/teams/inter-team-bridge.ts`. MUS (Cedar's Ring) records the outcomes.

**Trail markers:**
- `www/PNW/GDN/research/06-synthesis.md` — Experimental synthesis (pack result)
- `www/MUS/research/` — Timeline records (Cedar records the pack's runs)
- `src/services/chipset/muse-forking.ts` — Parallel fork coordination
- `src/services/chipset/ephemeral-forker.ts` — Ephemeral experiment forks
- `src/services/teams/inter-team-bridge.ts` — Cross-team coordination

**Fire Succession structural role:** Wolf packs don't control where the elk go — they patrol the territory and the elk population responds. Sam's multi-agent experiments don't control what questions users ask — they cover the terrain of possibilities and users encounter the territory naturally. The formation is not rigid; it adapts to the landscape.

---

### Trail 7: Flock of Ravens — All Groves (Long-Distance Encrypted Signals)

**Type:** Above-surface, encrypted, long-distance  
**Mechanism:** Raven's encrypted long-distance signal layer is the observation system that watches all groves from above. The "flock" is the set of pattern detection modules that run across all groves simultaneously: `src/platform/observation/pattern-analyzer.ts`, `src/platform/observation/drift-monitor.ts`, `src/platform/observation/promotion-detector.ts`. When Raven spots a repeating pattern across multiple groves — a structural recurrence — Raven signals the GPU promotion pipeline to consider whether that pattern should become a kernel.

**Trail markers:**
- All six grove research directories (Raven observes all)
- `src/platform/observation/pattern-analyzer.ts` — Pattern detection
- `src/platform/observation/drift-monitor.ts` — Drift monitoring
- `src/platform/observation/promotion-detector.ts` — Kernel candidate identification
- `src/services/chipset/blitter/signals.ts` — Signal routing from kernel back to groves
- `src/platform/observation/photon-emitter.ts` — Signal emission (long-distance encoding)

**Fire Succession structural role:** Ravens are among the first birds to return after fire. They survey the landscape from altitude, spot resources, and signal other animals to the territory. Raven's pattern-detection modules are the post-integration survey system: after a new feature lands (after the fire of change), Raven surveys the new landscape, identifies patterns, and signals where the next development should go.

---

## Part 5: The Math Co-Processor — Deep Root System

The Math Co-Processor does not belong to any single grove. It is the Deep Root — the shared substrate of nutrient pathways that sits beneath all six groves, invisible at the surface but essential to everything that grows.

### Location

`math-coprocessor/` at the repository root — deliberately outside `www/` and `src/`.

### Architecture

Five chips, each serving a different computational need:

| Chip | File | Function | Grove Connection |
|---|---|---|---|
| Algebrus | `math-coprocessor/chips/algebrus.py` | Linear algebra (cuBLAS) | ECO coordinate projections, UNI type reasoning |
| Fourier | `math-coprocessor/chips/fourier.py` | FFT/signal processing (cuFFT) | Raven pattern detection, MUS timeline analysis |
| Statos | `math-coprocessor/chips/statos.py` | Statistical operations (cuSOLVER) | Hemlock verification statistics, Sam experiments |
| Vectora | `math-coprocessor/chips/vectora.py` | Vector operations (cuRAND) | Sam's Monte Carlo hypotheses, ECO population modeling |
| Symbex | `math-coprocessor/chips/symbex.py` | Symbolic execution JIT (NVRTC) | Lex formal reasoning, Cedar hash verification |

**CPU fallback:** `math-coprocessor/fallback/cpu.py` — The forest still grows without the GPU. The mycorrhizal network functions without perfect conditions. The fallback is not a failure mode — it is the resilient root system that keeps the grove alive when the primary infrastructure is temporarily unavailable.

### Connection to Fire Succession

The Deep Root system is the underground fungal network that survived the fires of 49 previous chain versions. Every time the system was rebuilt, refactored, or replaced, the fundamental mathematical operations remained. The GPU co-processor is the culmination of this: it makes permanent what was previously ephemeral — the computation that happened inside language model inference now has a dedicated hardware path.

### Grove Service Map

| Muse | Math Co-Processor Service |
|---|---|
| Cedar | Hash verification via Symbex (JIT-compiled SHA-256 variants) |
| Willow | Similarity scoring via Algebrus (embedding distances for disclosure level inference) |
| Foxy | Coordinate projection via Algebrus + Vectora (complex plane → spatial maps) |
| Sam | Monte Carlo experiments via Vectora + Statos (hypothesis testing at scale) |
| Hemlock | Statistical verification via Statos (confidence intervals, calibration bounds) |
| Lex | Symbolic verification via Symbex (formal property checking) |
| Raven | Signal analysis via Fourier (pattern frequency detection in observation streams) |
| Hawk | Formation optimization via Vectora (team coverage optimization) |
| Owl | Temporal analysis via Fourier + Statos (session rhythm, cadence detection) |

---

## Part 6: Understanding Arc — Visitors and Consultants

The Understanding Arc (Socrates, Euclid, Shannon, Amiga) does not own territory in the forest. They are visitors who bring the deep historical context of human intellectual tradition to the muse debates. Their integration points are where the forest encounters its philosophical foundations.

### Socrates — Questions and Debate

**Visits:** All six groves, but especially Cedar's Ring and Sam's Garden  
**Function:** Structured inquiry. When the Centercamp debate mechanism activates — when a complex issue requires collective evaluation — Socrates provides the question structure. The Socratic method is the precursor to Sam's hypothesis formation: start with the question, not the answer.  
**Integration point:** The six-pass pipeline's Centercamp Return Path (Pass 6). When conflict or ambiguity is detected, the debate format that Socrates structures is how the muse team evaluates the issue before Cedar records the resolution.  
**src/ connection:** `src/platform/console/question-schema.ts` — The structured question format for user interaction is Socratic in structure (pose the question, wait for the response, follow up).

### Euclid — Formal Structure and Axioms

**Visits:** Lex's Workshop primarily, with excursions to Hemlock's Ridge  
**Function:** Axiomatic reasoning. Euclid brings the insight that complex truths can be built from minimal, verified axioms. This is the same insight behind Unison's type system: if the base types are correct, the complex behaviors built from them cannot contain certain classes of error.  
**Integration point:** `www/UNI/research/02-type-system-abilities.md` — The type system chapter is where Euclid sits most comfortably. The abilities system in Unison is an axiomatic constraint language.  
**src/ connection:** `src/services/chipset/muse-schema-validator.ts` — Zod schemas are the axiomatic layer of the muse system. Euclid would recognize the structure.

### Shannon — Information Theory and Signal/Noise

**Visits:** Raven's territory primarily, with visits to Cedar's Ring and the Math Co-Processor  
**Function:** Information theory. Shannon provides the theoretical foundation for why Cedar's hash chain works (entropy of a SHA-256 hash), why Raven's pattern detection is meaningful (signal vs. noise in observation streams), and why the three-layer network (mycorrhizal/wolf pack/flock of ravens) maps to Shannon's channel capacity model (low bandwidth underground, medium bandwidth surface, high bandwidth sky).  
**Integration point:** `src/platform/observation/pattern-analyzer.ts` — Every pattern detection operation is implicitly an information-theoretic calculation. Shannon makes this explicit.  
**src/ connection:** `math-coprocessor/chips/fourier.py` — The Fourier chip is the direct implementation of Shannon's frequency-domain signal analysis.

### Amiga — Hardware Meeting Software, Creative Computing

**Visits:** Sam's Garden, Foxy's Canopy, and the Math Co-Processor  
**Function:** The Amiga represents the moment when hardware and software became expressive rather than merely functional. The Amiga's custom chips (Blitter, Copper, Agnus) are the direct ancestors of the chipset architecture: the Blitter promotes operations to hardware, the Copper sequences them, the DMA bus routes them. Creative computing — using hardware expressively to create things that didn't exist before — is Amiga's gift to the forest.  
**Integration point:** `src/services/chipset/blitter/` — The Blitter is named for the Amiga's custom chip. This is not coincidence; it is genealogy.  
**src/ connection:** `src/packs/agc/` — The Apollo Guidance Computer pack is in Sam's territory, but Amiga visits because both represent early creative computing: hardware that enabled humans to do things that felt impossible before the hardware existed.

---

## Part 7: Fire Succession as Structural Pattern

Fire Succession was initially proposed as an analogy for the MUS mission. The architectural decision confirmed in pre-planning was to make it structural — to strengthen the pattern so it describes the system architecture, not just evokes it. This section is the structural account.

### The Four-Stage Model

Post-fire Pacific Northwest forest succession follows four stages:

1. **Pioneer stage** — Fast-growing colonizers (fireweed, alder) stabilize bare mineral soil. High diversity, low canopy.
2. **Shrub stage** — Shrubs establish, shade the pioneers, create soil structure. Medium diversity.
3. **Young forest stage** — Conifers establish, begin closing the canopy. Species sorting begins.
4. **Mature forest stage** — Canopy closes, understory specializes, mycorrhizal network fully established. High structural complexity.

### Mapping to System Development

| Succession Stage | System Phase | Grove Role |
|---|---|---|
| Pioneer | v1.0–v1.25 — First features, rapid iteration | COL (first grove, onboarding — the fireweed) |
| Shrub | v1.26–v1.44 — Infrastructure, patterns | CAS (standards establish — shrub layer sorts quality) |
| Young forest | v1.45–v1.49 — Integration, chipset | ECO + GDN (canopy forming — complex systems emerge) |
| Mature forest | v1.50+ — MUS mission, inhabited system | MUS + UNI (canopy closes — the forest talks to itself) |

### Fire Events as System Resets

The chain history has known "fire events" — moments where significant refactoring occurred and large portions of the system were rebuilt:

- **v1.9→v1.25:** First major reset ("first attempt at inhabited integration")
- **v1.42–v1.44:** Git/Gource integration fire — structure exposed
- **v1.48–v1.49:** Physical infrastructure fire — DACP capstone rebuilt from understanding

Each fire left standing snags (Hemlock's standards), underground network (Cedar's events), and seed bank (the research documents that survived in `docs/`). The mature forest stage at v1.50 grows from seeds that survived those fires.

### Structural Implication for MUS

The MUS mission does not burn the existing forest. It is the closing of the canopy — the moment when the groves connect through their above-ground branching (observation/signal layer), their surface coordination (wolf pack/teams layer), and their underground network (mycorrhizal/chipset bus layer). The forest has been growing for 49 versions. MUS is when it becomes self-aware.

---

## Part 8: Summary — The Living Forest at a Glance

The map shows a territory that is substantially built. Six groves, 92+ files, 9 muses with defined positions and vocabularies, a five-chip GPU co-processor as the deep root system, and seven cross-grove trails that form the connecting network.

**What exists:**
- All six grove directories with full research content
- All 9 muse engines in `src/services/chipset/`
- All three network layers (chipset bus, teams, observation)
- The Understanding Arc as named consultants
- The Math Co-Processor as shared substrate
- The Fire Succession model as structural architecture

**What this map enables (future passes):**
- **Pass 2 (Function Binding):** Wire each muse to the specific function calls they operate
- **Pass 3 (Helper Teams):** Create the 8 helper teams that guide users through the docs
- **Pass 4 (Cartridge Forest):** Package research + demos into loadable cartridges
- **Pass 5 (Message Integration):** Route muse conversations through console message channels
- **Pass 6 (GPU Promotion Loop):** Build the observation → refinement → kernel pipeline

The deeper pattern here is that the forest already knows its own structure. The research documents already cite each other across groves. The source modules already implement the muse functions. The Fire Succession model already describes the succession from pioneer codebase to mature inhabited system. This session's map is not drawing a new territory — it is reading the map that the forest has been drawing for 49 versions, and making it legible for the first time.

---

*Document generated: 2026-03-08*  
*Revision: v1 (Wave 0, Session 1)*  
*Next: 02-function-binding.md (Wave 1)*
