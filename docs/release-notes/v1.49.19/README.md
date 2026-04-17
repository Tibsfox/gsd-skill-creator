# v1.49.19 — Gastown Chipset Integration

**Released:** 2026-03-06
**Scope:** multi-agent orchestration chipset — absorbs steveyegge/gastown patterns as a deployable chipset definition with 12 skills, schema-validated YAML, atomic StateManager, and a 10-document integration guide
**Branch:** dev → main
**Tag:** v1.49.19 (2026-03-06)
**Commits:** v1.49.18..v1.49.19 (26 commits, head `274a37473`)
**Files changed:** 63 (+11,135 / −3)
**Predecessor:** v1.49.18 — Space Between Observatory
**Successor:** v1.49.20
**Classification:** feature — first externally-absorbed chipset shipped as a composable orchestration primitive
**Waves covered:** 0–4 (5 sequential execution waves across ~40 min wall time)
**Verification:** 108 new tests across 7 test files (safety-critical, core-functionality, integration, edge-cases, state-manager, validate-chipset, types) · 4-stage chipset validator (schema, token budget, topology, channels) · JSON Schema (draft-07) · atomic StateManager with crash-recoverable writes

## Summary

**Gastown chipset ships as the first externally-absorbed multi-agent orchestration primitive.** Before v1.49.19 the project had chipsets as an internal format (v1.49.17's Space Between cartridge being the first concrete instance) but no precedent for absorbing an entire coordination pattern from an external project. `data/chipset/gastown-orchestration/gastown-orchestration.yaml` ships as the canonical manifest — it declares the agent topology (Mayor, Polecat, Witness, Refinery), the communication channels (Mail, Nudge, Hook, Sling, Done), the persistence substrate (Beads), and the runtime abstractions (Runtime HAL, GUPP propulsion) as one integrated definition. The YAML is not a configuration file in the typical sense; it is the executable specification for a multi-agent orchestration rig, and the 4-stage validator that reads it is what distinguishes a chipset from a directory of related skills. The absorption follows the code-absorber philosophy established earlier in the v1.49.x line at a higher level of abstraction — instead of absorbing code, v1.49.19 absorbs a coordination pattern and the vocabulary that makes it reasonable to talk about.

**Twelve skills land in `.claude/skills/` as first-class orchestration primitives.** Mayor (Northbridge-style coordination pattern for multi-agent convoys), Polecat (ALU execution pattern for ephemeral autonomous work), Witness (PMU observation pattern for agent-health monitoring), Refinery (DMA merge-queue pattern for sequential deterministic merges), Mail (durable asynchronous messaging channel), Nudge (synchronous immediate signaling channel), Hook (pull-based work-assignment channel implementing GUPP), Sling (instruction-dispatch pipeline for routing work items), Done (pipeline retirement protocol for completed work), Runtime HAL (multi-runtime agent orchestration with provider detection), GUPP propulsion (interrupt controller converting polled to proactive execution), and Beads (git-friendly crash-recoverable state persistence). Each skill ships with its own SKILL.md plus a `references/gastown-origin.md` that preserves provenance against the upstream project — the absorption is traceable rather than laundered. Where a skill has structural depth, `references/boundaries.md` and `references/examples.md` carry the surface contract and concrete usage shapes so consumers are not left guessing at intent. The skills form a coherent toolkit: Mayor coordinates, Polecat executes, Witness observes, Refinery merges, and the five channels (Mail/Nudge/Hook/Sling/Done) plus Runtime HAL, GUPP, and Beads fill in the substrate the other four depend on.

**The 4-stage chipset validator is the release's load-bearing architectural claim.** `src/chipset/gastown/validate-chipset.ts` (paired with `validate-chipset.test.ts`) layers validation so errors surface at the most specific level possible rather than collapsing into a single "invalid config" failure. Stage 1 validates schema — the YAML matches the JSON Schema draft-07 at `data/chipset/schema/gastown-chipset-schema.json`. Stage 2 validates token budget — the declared per-agent token envelopes sum within the rig's overall budget, with enough headroom for the orchestrator overhead. Stage 3 validates topology — the declared agents reference valid roles, the convoy structure has no orphaned nodes, and the heartbeat supervision pattern (Deacon) has a valid supervisor target. Stage 4 validates channels — every channel declared in the rig maps to a skill that exists on disk, every cross-channel dependency resolves, and the dispatch configuration references valid channel names. Each stage produces actionable diagnostics tagged with the stage that caught the error, which is the diagnostic experience difference between "configuration failed" and "stage 3 topology check: Mayor references undefined agent role `deacon-supervisor`". The layering is itself the design.

**StateManager implements atomic writes with crash recovery as the persistence contract.** `src/chipset/gastown/state-manager.ts` (paired with `state-manager.test.ts`) handles the most dangerous persistence failure mode — write interrupted mid-operation — via the write-temp / fsync / rename pattern. State is either fully committed or fully absent, never partially corrupted. This matters because a multi-agent rig accumulates state across convoys, work items, merge queues, mail, nudge signals, and hooks — and any of those becoming partially written under a crash would propagate into a decision-making agent reading inconsistent state. The StateManager is small by design (the atomic-rename discipline is a handful of function calls, not a framework) because the correctness argument is easier to audit when the implementation fits in the reader's head. The scaffolded state directories at `data/chipset/gastown-orchestration/state/` (agents, convoys, hooks, mail, merge-queue, nudge, work) plus `.gitkeep` placeholders show the operational footprint before any runtime populates them.

**Five execution waves with ten parallel tracks delivered the stack in ~40 minutes wall time.** Wave 0 (`85abd3434`, `5c54dc10b`, `4ce7ae2be`, `81480a3de`) landed the foundation — chipset YAML, directory scaffold, JSON schema, shared TypeScript interfaces. Wave 1 (1a + 1b) split into the validator track (`aa52788e6` + `0c08f4807`) and the state/beads track (`4fa325304` + `20853db2f` + `0b5d57a05` + `265ad89f8`) — TDD on both sides, tests first then implementation. Wave 2 (2a + 2b + 2c) added the coordination skills on three parallel tracks: 2a for worker patterns (`7c97d7325` + `f8aa50189` + `e2ac49a68`), 2b for communication channels (`88322c7ad`), and 2c for dispatch and retirement (`69655cd2e` + `0730870f3`). Wave 3 (3a + 3b) brought the runtime abstractions: 3a for runtime HAL (`fe32f0332` + `86411cd46`) and 3b for propulsion patterns (`ee8a416ef` + `7be5cf1b2`). Wave 4 (4a + 4b) closed with the test battery (`fce1dd937` + `952b8f449` + `274a37473`) and the documentation stack (`4a95c6da0` + `1c51defaf` + `0b388f1f9`). The five-wave / ten-track cadence is now proven across v1.49.8, v1.49.9, and v1.49.19 — 26 commits across 63 files in 40 wall minutes is the repeatable throughput ceiling for structured parallel work in this project.

**The 10-document integration guide is the knowledge layer that does not transfer through code.** `docs/gastown-integration/` ships ten numbered documents: 01-architecture-overview, 02-concept-mapping, 03-trust-boundary, 04-chipset-setup, 05-agent-topology, 06-communication-channels, 07-dispatch-and-retirement, 08-upstream-intelligence, 09-multi-instance, 10-gsd-milestone-workflow, plus a README. The architecture overview names the load-bearing pieces; concept-mapping translates gastown's vocabulary into the project's; trust-boundary documents what the chipset is and is not allowed to see; agent-topology covers the Mayor/Polecat/Witness/Refinery shape; communication-channels covers Mail/Nudge/Hook/Sling/Done; dispatch-and-retirement covers the work lifecycle; upstream-intelligence covers what gastown taught us that does not live in the absorbed artifacts; multi-instance covers running multiple rigs; gsd-milestone-workflow covers how chipsets participate in the GSD milestone cycle. Three architecture decision records (`docs/adr/001-chipset-over-port.md`, `002-filesystem-as-bus.md`, `003-gupp-advisory.md`) plus a glossary (`docs/glossary.md`) and user guide (`docs/user-guide.md`) under `data/chipset/gastown-orchestration/docs/` round out the chipset-local documentation. The integration guide is the discipline that keeps the absorption from becoming a code dump — it names the ideas, not just the files.

**Eighteen TypeScript interfaces in `src/chipset/gastown/types.ts` encode the coordination vocabulary.** `src/chipset/gastown/types.ts` (paired with `types.test.ts`) defines the type surface for the chipset — rig shape, agent role, convoy, work item, mail message, nudge signal, hook descriptor, dispatch instruction, retirement record, channel configuration, topology node, budget envelope, and the validator-result variants. The type surface is the compile-time proof that the YAML, the validator, the StateManager, and the consuming skills all agree on vocabulary. Nothing in the chipset can drift silently — a rename in `types.ts` propagates through the validator, the state manager, and every consuming skill via the type checker. This is why the chipset-absorbing approach beats a loose "folder of skills" arrangement: the types are the contract, and the contract is enforced at compile time, not at runtime.

**Seven test files and 108 tests bracket the orchestration surface without overclaiming coverage.** `safety-critical.test.ts` (16 tests, SC-01 through SC-16) covers the failure modes where being wrong is catastrophic — atomic-write interrupts, topology with cycles, budget overruns, schema violations with malformed inputs, unhooked agents, unreachable convoys. `core-functionality.test.ts` (18 tests) covers the happy paths. `integration.test.ts` (8 tests) covers end-to-end flows across multiple skills. `edge-cases.test.ts` (6 tests, EC-01 through EC-06) covers empty rigs, busy polecat pools, atomic writes under concurrency, malformed state files, unknown runtime providers, and chipsets with empty optional arrays. `state-manager.test.ts`, `validate-chipset.test.ts`, and `types.test.ts` carry the per-module coverage. The 108-test count is not the headline — the headline is that the suite is structured around failure classes (safety-critical, core, integration, edge) rather than file-by-file, so the reader can audit "what failure modes does this absorb" directly from the test file names.

**Provenance to steveyegge/gastown preserved in `references/gastown-origin.md` under each skill.** Every absorbed skill carries a `references/gastown-origin.md` that names the upstream origin, the concept as gastown described it, and the translation into this project's vocabulary. This is how the absorption stays honest — six months from now when someone asks why Mayor is called Mayor, the provenance document answers it, and the answer is auditable rather than oral tradition. The provenance pattern extends the teaching-reference-IS-the-research pattern from v1.49.8 and v1.49.9 to external absorption: the reference is what lets the absorption survive handoff. It is also what lets upstream intelligence (document 08 in the integration guide) be a real workflow rather than a gesture — the origin docs plus the upstream-intelligence doc together describe how to pull forward improvements from the upstream project as they happen.

**The release's architectural footprint is large relative to its file count.** 63 files changed and 11,135 insertions is a mid-sized release by v1.49.x standards, but the coordination surface it establishes is disproportionate. Every future chipset-style absorption has the Gastown pattern as the template. Every future multi-agent orchestration has Mayor / Polecat / Witness / Refinery as available building blocks. Every future persistence need has the StateManager's atomic-write contract as the default primitive. And every future chipset definition has the 4-stage validator as the gate that keeps the config honest. v1.49.19 is the release where externally-absorbed multi-agent orchestration became a first-class primitive in the project.

## Key Features

| Area | What Shipped |
|------|--------------|
| Chipset manifest | `data/chipset/gastown-orchestration/gastown-orchestration.yaml` — canonical rig definition: agent topology, communication channels, dispatch configuration, runtime HAL bindings |
| JSON Schema | `data/chipset/schema/gastown-chipset-schema.json` — draft-07 schema that Stage 1 of the validator checks against |
| 4-stage validator | `src/chipset/gastown/validate-chipset.ts` + `validate-chipset.test.ts` — schema / token budget / topology / channels, each stage producing stage-tagged diagnostics |
| StateManager | `src/chipset/gastown/state-manager.ts` + `state-manager.test.ts` — atomic write-temp / fsync / rename discipline, crash-recoverable, no partial-write corruption |
| Type system | `src/chipset/gastown/types.ts` + `types.test.ts` — 18 TypeScript interfaces encoding rig / agent / convoy / work / channel / budget / validator-result vocabulary |
| Barrel export | `src/chipset/gastown/index.ts` wired into `src/chipset/index.ts` — chipset module publishes the Gastown surface as a single import |
| Mayor skill | `.claude/skills/mayor-coordinator/` — Northbridge-style coordination pattern; SKILL.md + references/boundaries.md + references/examples.md + references/gastown-origin.md |
| Polecat skill | `.claude/skills/polecat-worker/` — ALU execution pattern for ephemeral autonomous work; same 4-file structure |
| Witness skill | `.claude/skills/witness-observer/` — PMU observation pattern for agent health monitoring |
| Refinery skill | `.claude/skills/refinery-merge/` — DMA merge-queue pattern for sequential deterministic merges |
| Mail channel skill | `.claude/skills/mail-async/` — durable asynchronous messaging channel |
| Nudge channel skill | `.claude/skills/nudge-sync/` — synchronous immediate signaling channel |
| Hook channel skill | `.claude/skills/hook-persistence/` — pull-based work-assignment channel (GUPP get-up-and-push protocol) |
| Sling dispatch skill | `.claude/skills/sling-dispatch/` — 7-stage instruction dispatch pipeline |
| Done retirement skill | `.claude/skills/done-retirement/` — 7-stage pipeline retirement protocol |
| Runtime HAL skill | `.claude/skills/runtime-hal/` — multi-runtime agent orchestration with provider detection for claude-code, codex, fallback |
| GUPP propulsion skill | `.claude/skills/gupp-propulsion/` — interrupt controller converting polled to proactive agent execution, with per-runtime strategies |
| Beads persistence skill | `.claude/skills/beads-state/` — git-friendly, crash-recoverable state persistence for the chipset |
| Safety-critical tests | `src/chipset/gastown/safety-critical.test.ts` — 16 tests (SC-01 through SC-16) covering catastrophic-failure modes |
| Core + integration + edge tests | `core-functionality.test.ts` (18) + `integration.test.ts` (8) + `edge-cases.test.ts` (6, EC-01 through EC-06) |
| Architecture decision records | `data/chipset/gastown-orchestration/docs/adr/001-chipset-over-port.md` + `002-filesystem-as-bus.md` + `003-gupp-advisory.md` |
| Chipset-local docs | `data/chipset/gastown-orchestration/docs/glossary.md` + `user-guide.md` + `README.md` |
| Integration guide | `docs/gastown-integration/` — 10 numbered documents plus README covering architecture / trust / topology / channels / dispatch / upstream / multi-instance / milestone workflow |
| State directory scaffold | `data/chipset/gastown-orchestration/state/{agents,convoys,hooks,mail,merge-queue,nudge,work}/` with `.gitkeep` placeholders |
| Wave cadence | 5 execution waves × 10 parallel tracks × ~40 min wall time, 26 commits landing in dependency order from YAML foundation to full test battery |

## Retrospective

### What Worked

- **5 execution waves with 10 parallel tracks in ~40 min wall time.** The wave-based parallel execution pattern is now proven across v1.49.8, v1.49.9, and v1.49.19. 26 commits across 63 files in 40 minutes demonstrates the repeatable throughput ceiling for structured parallel work, and the dependency ordering (foundation → validator + state → skills → runtime → tests → docs) is reviewable top-to-bottom as a build log.
- **4-stage chipset validator (schema, token budget, topology, channels).** Layered validation catches different classes of errors at different stages — schema violations first, then resource constraints, then structural integrity, then communication correctness. The diagnostic experience difference between "configuration failed" and "stage 3 topology check: Mayor references undefined agent role" is the whole point of the layering.
- **StateManager with atomic writes and crash recovery.** The write-temp / fsync / rename discipline handles the most dangerous persistence failure mode (write interrupted mid-operation) correctly. State is either fully committed or fully absent — no partial corruption. The implementation is small enough that the correctness argument fits in the reader's head.
- **12 skills absorbed from steveyegge/gastown with provenance preserved.** Mayor, Polecat, Witness, Refinery, Mail, Nudge, Hook, Sling, Done, Runtime HAL, GUPP, Beads each ship with a `references/gastown-origin.md` tracing the upstream concept. Provenance makes the absorption honest — the answer to why Mayor is called Mayor is auditable, not oral tradition.
- **Types-first discipline across the stack.** `src/chipset/gastown/types.ts` with 18 interfaces landed in Wave 0 before any validator or state-manager code depended on them. Every later wave compiled clean against those types on first try. When the stack is co-designed, types-first is the cheap path.
- **Provenance pattern extends the teaching-reference-IS-the-research pattern to external absorption.** `references/gastown-origin.md` per skill, plus the upstream-intelligence document in the integration guide, describes how to pull forward improvements from the upstream project as they happen. The absorption is not laundered — it is a structured relationship.
- **JSON Schema (draft-07) as the Stage 1 gate.** `data/chipset/schema/gastown-chipset-schema.json` makes the YAML's shape machine-checkable without any custom parser logic in Stage 1. The validator layers the project-specific rules on top.

### What Could Be Better

- **10-document integration guide is substantial documentation for an absorption.** The architecture, security model, trust boundaries, agent topology, communication, dispatch/retirement, upstream intelligence, multi-instance, and GSD milestone workflow documents are thorough, but maintaining synchronization between the docs and the evolving implementation is a recurring cost that this release did not automate.
- **18 TypeScript interfaces without published API documentation.** The interfaces define the contracts for gastown integration, but consumers need more than type definitions to understand the intended usage patterns. The next release should emit generated API docs from the type system.
- **Only one concrete chipset — Gastown itself.** The chipset format is now proven on one absorption, but one chipset is not a format stress test. A second chipset built against a different coordination pattern would validate that the 4-stage validator generalizes beyond the Mayor/Polecat/Witness/Refinery topology.
- **Token budget enforcement is validated at config time, not at runtime.** Stage 2 of the validator checks that declared budgets sum within the rig envelope, but nothing in v1.49.19 measures real token consumption against the declared budgets during execution. Budget drift between spec and reality is an open exposure.
- **StateManager is single-process only.** The atomic-rename discipline is correct for one process writing at a time, but the chipset envisions multi-instance execution (documented in `09-multi-instance.md`), and the StateManager does not yet have a documented multi-writer contract.

## Lessons Learned

- **Absorbing an external project's patterns requires integration documentation at the architecture level.** The 10-document guide covers security, trust, topology, and communication — this is the knowledge that does not transfer through code alone. Code absorption without this layer produces a zip file; code absorption with it produces a reusable primitive.
- **4-stage chipset validation is the right pattern for structured configuration.** Schema → budget → topology → channels catches errors at the most specific level possible, producing actionable diagnostics rather than generic "invalid config" failures. Each stage's failure mode is distinct enough that the layering is its own documentation.
- **Atomic writes with crash recovery should be the default persistence pattern.** The StateManager's write-to-temp / fsync / rename discipline is the correct way to handle any state that must survive process termination. Skipping this for multi-agent orchestration state is how rigs end up with inconsistent decisions.
- **Provenance documents make external absorption honest.** `references/gastown-origin.md` under every absorbed skill is the discipline that keeps the absorption from becoming an unattributed code dump. Provenance also enables upstream-intelligence workflows — you cannot pull forward improvements from a project you no longer trace back to.
- **Wave-based parallel execution scales when the dependency graph is acyclic.** 5 waves × 10 tracks worked because Wave N's outputs were the inputs to Wave N+1, and the within-wave tracks had no cross-dependencies. Flattening the dependency graph early made the parallelism available; the parallelism then paid back in wall-time.
- **Types-first for multi-module stacks where every module shares vocabulary.** 18 interfaces landing in Wave 0 before any consumer depends on them means every later wave compiles clean on first try. Types-first is cheap when the stack is co-designed; it is expensive when types are back-fitted after diverging implementations.
- **JSON Schema for Stage 1 and hand-rolled validators for everything after.** Draft-07 is machine-checkable and covers the shape-of-data question; project-specific rules (budget, topology, channels) need hand-rolled code because they encode domain invariants. Splitting the two concerns keeps each one honest.
- **Communication channels and coordination skills are different abstractions.** Mail, Nudge, Hook, Sling, Done are channels — they move messages. Mayor, Polecat, Witness, Refinery are coordinators — they decide. Mixing them in one skill family would collapse a distinction that pays back in every debugging session.
- **Runtime HAL is the abstraction that lets a chipset target multiple runtimes.** Claude-Code, Codex, and a fallback polling strategy live behind the HAL, so the coordination skills do not branch on runtime internally. The HAL is the interface; the providers implement it.
- **Scaffolding state directories with `.gitkeep` placeholders documents operational footprint.** The `agents/`, `convoys/`, `hooks/`, `mail/`, `merge-queue/`, `nudge/`, `work/` tree under `data/chipset/gastown-orchestration/state/` makes the runtime surface visible in the repo before any instance populates it.
- **ADRs land with the code, not after it.** Three ADRs (chipset-over-port, filesystem-as-bus, gupp-advisory) shipped with the chipset itself rather than as retrospective explanation. The argument for a design decision is cheapest to write while the decision is fresh.
- **Safety-critical test files earn their own prefix.** `safety-critical.test.ts` with tests tagged SC-01 through SC-16 makes the catastrophic-failure coverage directly auditable by file name rather than by digging through a flat suite. Edge-case tests (EC-01 through EC-06) carry the same prefix discipline.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.18](../v1.49.18/) | Predecessor — Space Between Observatory; sets up the observatory pattern the Witness skill extends |
| [v1.49.17](../v1.49.17/) | Cartridge format predecessor — chipset-as-packaging mechanism the gastown chipset extends at the orchestration level |
| [v1.49.20](../v1.49.20/) | Successor — continues the v1.49.x line after the first externally-absorbed chipset lands |
| [v1.49.16](../v1.49.16/) | Muse Integration & MCP Pipeline — MCP surface the runtime HAL composes over |
| [v1.49.15](../v1.49.15/) | Earlier v1.49.x release in the same documentation-catch-up window |
| [v1.49.14](../v1.49.14/) | Code absorber philosophy — the precursor pattern that the gastown absorption extends to coordination patterns |
| [v1.49.12](../v1.49.12/) | Heritage Skills Pack — the pack architecture the gastown skill family inherits |
| [v1.49.10](../v1.49.10/) | Flat-atoms architecture — the monolithic pattern chipset composition was designed to prevent |
| [v1.49.9](../v1.49.9/) | Earlier five-wave / ten-track execution pattern — cadence the v1.49.19 waves repeat |
| [v1.49.8](../v1.49.8/) | Earlier five-wave / ten-track execution pattern — first proof the cadence generalizes |
| [v1.49.7](../v1.49.7/) | Optional-dependency contract — discipline the validator's stage gating follows |
| [v1.49.0](../v1.49.0/) | Parent mega-release where the v1.49.x line and the GSD-OS desktop surface first shipped |
| [v1.49](../v1.49/) | Consolidated mega-release notes for the v1.49 line |
| [v1.36](../v1.36/) | Citation Management — the provenance-chain pattern the `references/gastown-origin.md` files follow |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — earlier multi-agent coordination pattern in the project's history |
| [v1.31](../v1.31/) | GSD-OS MCP Integration — MCP precedent the Runtime HAL composes over |
| [v1.28](../v1.28/) | GSD Den Operations — earlier filesystem-message-bus precedent the ADR `002-filesystem-as-bus` cites |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — pack-shape template reused at the skill level |
| [v1.25](../v1.25/) | Ecosystem Integration — dependency-DAG pattern the chipset composes over |
| [v1.8](../v1.8/) | Capability-Aware Planning — composition endpoint the chipset coordination extends |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop the chipset extends at the Compose step |
| `data/chipset/gastown-orchestration/gastown-orchestration.yaml` | Canonical chipset manifest |
| `data/chipset/schema/gastown-chipset-schema.json` | JSON Schema (draft-07) for Stage 1 validation |
| `src/chipset/gastown/validate-chipset.ts` | 4-stage validator implementation |
| `src/chipset/gastown/state-manager.ts` | Atomic StateManager with crash recovery |
| `src/chipset/gastown/types.ts` | 18-interface type system |
| `src/chipset/gastown/safety-critical.test.ts` | 16-test catastrophic-failure suite |
| `src/chipset/gastown/edge-cases.test.ts` | 6-test edge-case suite (EC-01 through EC-06) |
| `.claude/skills/mayor-coordinator/SKILL.md` | Mayor coordination skill entry point |
| `.claude/skills/polecat-worker/SKILL.md` | Polecat worker skill entry point |
| `.claude/skills/witness-observer/SKILL.md` | Witness observation skill entry point |
| `.claude/skills/refinery-merge/SKILL.md` | Refinery merge-queue skill entry point |
| `.claude/skills/runtime-hal/SKILL.md` | Runtime HAL skill entry point |
| `.claude/skills/gupp-propulsion/SKILL.md` | GUPP propulsion skill entry point |
| `.claude/skills/beads-state/SKILL.md` | Beads persistence skill entry point |
| `docs/gastown-integration/01-architecture-overview.md` | Integration guide entry point |
| `data/chipset/gastown-orchestration/docs/adr/001-chipset-over-port.md` | ADR for chipset-over-direct-port choice |

## Engine Position

v1.49.19 is the first externally-absorbed chipset milestone in the v1.49.x line and the first release to ship multi-agent orchestration as a composable chipset rather than ad-hoc skill collection. It stands on v1.49.17's cartridge-format precedent (composition-as-packaging at the educational-content level, now extended to coordination patterns), v1.49.14's code-absorber philosophy (which this release lifts to pattern absorption), the v1.49.12 pack architecture (which the 12 skills inherit), the v1.49.8 / v1.49.9 five-wave execution cadence (which this release repeats at 26 commits and 63 files), and the v1.49.0 mega-release that established the v1.49.x line's architectural grain. Looking forward, every future chipset-style absorption has the Gastown pattern as the template: canonical YAML + JSON Schema Stage 1 + 4-stage validator + atomic StateManager + skill family with preserved provenance + 10-document integration guide. Every future multi-agent orchestration has Mayor / Polecat / Witness / Refinery as available building blocks and Mail / Nudge / Hook / Sling / Done as channel primitives. The Runtime HAL becomes the abstraction layer for any future multi-runtime coordination need. The release's 11,135-insertion footprint is mid-sized by v1.49.x standards, but the coordination surface it establishes is disproportionate to the file count.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.18..v1.49.19) | 26 |
| Files changed | 63 |
| Lines inserted / deleted | 11,135 / 3 |
| Execution waves | 5 (Wave 0 through Wave 4) |
| Parallel tracks | 10 |
| Wall time (documented) | ~40 minutes |
| New skills | 12 (Mayor, Polecat, Witness, Refinery, Mail, Nudge, Hook, Sling, Done, Runtime HAL, GUPP, Beads) |
| New chipsets | 1 (Gastown Orchestration) |
| New validators | 1 (4-stage: schema / budget / topology / channels) |
| New tests | 108 across 7 test files |
| Safety-critical tests | 16 (SC-01 through SC-16) |
| Edge-case tests | 6 (EC-01 through EC-06) |
| TypeScript interfaces | 18 |
| JSON Schema version | draft-07 |
| Integration guide documents | 10 + README |
| Architecture decision records | 3 (001-chipset-over-port, 002-filesystem-as-bus, 003-gupp-advisory) |
| State directories scaffolded | 7 (agents, convoys, hooks, mail, merge-queue, nudge, work) |

## Taxonomic State

| Dimension | Before v1.49.19 | After v1.49.19 |
|-----------|------------------|-----------------|
| Multi-agent orchestration | Ad-hoc skill collection, no manifest | Canonical chipset YAML + 4-stage validator |
| External pattern absorption | Code-level absorber (v1.49.14) | Coordination-pattern absorber with preserved provenance |
| Chipset format | v1.49.17 cartridge format (content) | Extended to orchestration chipsets |
| Persistence contract | Per-feature ad-hoc state | Atomic StateManager with crash recovery |
| Runtime abstraction | Single-runtime assumptions | Runtime HAL with claude-code / codex / fallback providers |
| Coordination vocabulary | Implicit per-project | 18-interface explicit type system |
| Communication channels | Bespoke per feature | 5 named channels (Mail / Nudge / Hook / Sling / Done) |
| Work lifecycle | Ad-hoc dispatch | 7-stage Sling dispatch + 7-stage Done retirement |
| Schema validation | Per-feature validators | JSON Schema (draft-07) Stage 1 + 3 project-rule stages |

## Files

- `data/chipset/gastown-orchestration/gastown-orchestration.yaml` — canonical chipset manifest (rig topology, channels, dispatch)
- `data/chipset/schema/gastown-chipset-schema.json` — draft-07 JSON Schema for Stage 1 validation
- `src/chipset/gastown/validate-chipset.ts` + `validate-chipset.test.ts` — 4-stage validator (schema / budget / topology / channels)
- `src/chipset/gastown/state-manager.ts` + `state-manager.test.ts` — atomic StateManager (write-temp / fsync / rename)
- `src/chipset/gastown/types.ts` + `types.test.ts` — 18 TypeScript interfaces encoding rig / agent / convoy / work / channel / budget vocabulary
- `src/chipset/gastown/safety-critical.test.ts` — 16 tests, SC-01 through SC-16
- `src/chipset/gastown/core-functionality.test.ts` — 18 tests, happy paths
- `src/chipset/gastown/integration.test.ts` — 8 tests, end-to-end flows
- `src/chipset/gastown/edge-cases.test.ts` — 6 tests, EC-01 through EC-06
- `src/chipset/gastown/index.ts` — barrel export; wired into `src/chipset/index.ts`
- `.claude/skills/mayor-coordinator/` — Mayor coordination skill (SKILL.md + references/boundaries.md + examples.md + gastown-origin.md)
- `.claude/skills/polecat-worker/` — Polecat worker skill (4-file structure)
- `.claude/skills/witness-observer/` — Witness observer skill (4-file structure)
- `.claude/skills/refinery-merge/` — Refinery merge-queue skill
- `.claude/skills/mail-async/`, `.claude/skills/nudge-sync/`, `.claude/skills/hook-persistence/`, `.claude/skills/sling-dispatch/`, `.claude/skills/done-retirement/` — five channel and lifecycle skills
- `.claude/skills/runtime-hal/` — Runtime HAL skill with `providers/claude-code.md`, `providers/codex.md`, `providers/fallback.md`
- `.claude/skills/gupp-propulsion/` — GUPP propulsion skill with `heartbeat.md` and `references/boundaries.md`
- `.claude/skills/beads-state/` — Beads state-persistence skill
- `data/chipset/gastown-orchestration/docs/adr/001-chipset-over-port.md` + `002-filesystem-as-bus.md` + `003-gupp-advisory.md` — three architecture decision records
- `data/chipset/gastown-orchestration/docs/glossary.md` + `user-guide.md` + `README.md` — chipset-local docs
- `data/chipset/gastown-orchestration/state/{agents,convoys,hooks,mail,merge-queue,nudge,work}/.gitkeep` — state directory scaffold
- `docs/gastown-integration/01-architecture-overview.md` through `10-gsd-milestone-workflow.md` plus `README.md` — 11-file integration guide

Aggregate: 63 files changed, 11,135 insertions, 3 deletions, 26 commits spanning v1.49.18..v1.49.19.
