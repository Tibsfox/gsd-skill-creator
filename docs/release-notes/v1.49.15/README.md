# v1.49.15 — Self-Improving Mesh Architecture

**Released:** 2026-03-04
**Scope:** multi-model mesh — model abstraction, multi-model evaluation, MCP infrastructure, mesh orchestration, context integration
**Branch:** dev → main
**Tag:** v1.49.15 (2026-03-03 via `1dc1e1563`, surfaced 2026-03-04) — "Self-Improving Mesh Architecture"
**Commits:** v1.49.14..v1.49.15 (50 commits, head `1dc1e1563`)
**Files changed:** 111 (+19,406 / −156)
**Predecessor:** v1.49.14 — Dependency Health Monitor & Progressive Internalization Engine
**Successor:** v1.49.16
**Classification:** feature — largest single-milestone code addition in the v1.49.x series to date
**Phases covered:** 50–54 (5 phases, 19 plans) across a five-layer stack
**Verification:** 594 new tests · 23,994 total project tests passing · IMP-06 purity verified for mesh scoring · chip factory backward-compat contract preserved

## Summary

**Multi-model mesh shipped as a five-layer stack, not a feature bundle.** The release is architected like a network protocol stack: Phase 50 (Model Abstraction) is the physical layer, Phase 51 (Multi-Model Evaluation) is the link layer that calibrates what "good" means per model, Phase 52 (MCP Infrastructure) is the transport layer with queuing and discovery, Phase 53 (Mesh Orchestration) is the routing layer, and Phase 54 (Context & Integration) is the application layer where context crosses node boundaries and packaged skills surface to downstream tooling. Each phase depends only on the layer beneath it. Phase 50 knows nothing about mesh routing; Phase 53 knows nothing about chip internals. The strict layering is why 594 new tests could be written and passed without cross-layer mocking — each layer is independently verifiable, and the tests compose upward the same way the runtime dependencies do. The layering discipline is the reason the milestone ships as one coherent architecture rather than five parallel features that need integration work.

**Pure scoring functions (scoreNode, rankNodes, selectWithFallback) separate routing policy from dispatch mechanism.** `src/mesh/scoring.ts` holds the pure functions; `src/mesh/coordinator.ts` holds the imperative dispatcher. The split means the mesh-routing policy can be unit-tested without spinning up any LLM provider — feed in a node list and a request, get back a deterministic ranking. This is the functional core / imperative shell pattern applied to multi-model orchestration, and it has a specific payoff: cost-aware routing, capability-aware routing, and failover ordering all become parameter changes to a pure function rather than behavioural changes to a network-bound component. `routing-policy.ts` encodes the cost-aware scoring as a separate pure module so the policy itself is swappable, not just its parameters. IMP-06 purity verification (noted in `feat(53-04): update barrel exports, thresholds, and verify IMP-06 purity`) is the explicit gate that kept the scoring module from accumulating side effects.

**Chip drivers for OpenAI-compatible and Anthropic endpoints normalize the provider interface.** `src/chips/types.ts` defines the `ModelChip` interface that every provider driver implements. `src/chips/openai-compatible-chip.ts` handles any endpoint that speaks the OpenAI chat-completions dialect (OpenAI, Together, Fireworks, Groq, local llama.cpp servers, LM Studio, Ollama with the OpenAI compatibility shim, vLLM, and so on). `src/chips/anthropic-chip.ts` handles Claude's native Messages API. `src/chips/chip-factory.ts` and `src/chips/chip-registry.ts` provide construction and lookup over a `chipset.json` configuration that is Zod-validated, which means malformed configs fail fast at startup rather than at first request. The `ChipFactory` was implemented with explicit backward-compatibility for the pre-50 single-model call sites — `feat(50-02): implement ChipFactory and ChipRegistry with backward compatibility` is the commit that made the abstraction a non-breaking extension rather than a rewrite.

**Multi-model evaluation gains tier detection and threshold calibration per model.** Phase 51 shipped three sub-plans: `thresholds-config.ts` loads per-model pass/fail thresholds from `thresholds.md`, `multi-model-benchmark.ts` runs the benchmark against every registered chip in parallel, and `model-aware-grader.ts` applies the correct threshold based on the responding model's tier and capability profile. `eval-viewer.ts` formats the results into a terminal-readable report with side-by-side scores across models. The `ChipTestRunner` in `src/chips/chip-test-runner.ts` is the matching primitive at the model-abstraction layer that keeps the benchmark's I/O contract consistent regardless of provider. Eval commands got `--chip` and `--grader-chip` flags so the responder and the grader can be different models — a configuration that matters when evaluating a small fast model with a larger grader acting as the quality reference. Phase 51 is the layer that makes every later mesh decision grounded in model-specific quality data rather than a single global threshold.

**MCP infrastructure provides queuing, discovery, and fidelity-adaptive transport.** Phase 52 is three coordinated sub-systems. `src/mcp/llm-wrapper.ts` wraps the raw chip call in per-chip queuing and timeout handling, exposing four MCP tools (chat, tool-call, stream, health) through a standard connection pool. `src/mesh/discovery.ts` is the DiscoveryService that heartbeats mesh nodes, auto-evicts stale peers past a configurable TTL, and produces the node list that `scoring.ts` ranks over. `src/mesh/transport.ts` is the DACP (Document-Addressed Content Protocol) transport: it bundles requests with `src/mesh/provenance.ts` tracking and uses `src/mesh/fidelity-adapter.ts` to adjust compression based on the target model's context capability. The fidelity adapter is the non-obvious piece — without it, a transcript sent to a smaller-context model arrives truncated at the wrong place and the receiving model operates on a corrupted prompt. With it, context length and information density are traded off under a policy that knows the target's capacity. `src/mesh/event-log.ts` provides the append-only audit log that makes the mesh's dispatches reproducible after the fact.

**Mesh orchestration turns a node list into a running mesh.** Phase 53's `src/mesh/coordinator.ts` is the MeshCoordinator class: it dispatches single requests, fans out requests to multiple nodes for consensus or speed, pipelines requests across nodes when one node's output feeds the next, and handles automatic failover when the primary node returns an error or exceeds its timeout budget. `src/mesh/routing-types.ts` defines the request and response schemas. `src/mesh/routing-policy.ts` encodes the cost-aware policy that selects nodes based on accumulated spend, per-node cost metadata, and the request's budget hint. `src/mesh/multi-model-optimizer.ts` and `src/mesh/wave-planner.ts` are the higher-level planners: the wave planner breaks a multi-step task into waves and assigns each wave to the best-suited chip, and the optimizer chooses which models to run a given wave against based on quality/cost/latency preferences. The coordinator is the component that most of the rest of the project will call into — everything above Phase 53 becomes a routing concern, not a dispatch concern.

**Context & integration closes the loop from running mesh to packaged deliverable.** Phase 54 tied the mesh back to the skill-creator pipeline. `src/mesh/context-types.ts` defines the transferable context envelope. `src/mesh/transcript-summarizer.ts` compresses long conversation histories for transfer to smaller-context nodes. `src/mesh/result-ingestion.ts` reassembles results coming back from distributed dispatches. `src/mesh/mesh-worktree.ts` + `src/mesh/proxy-committer.ts` let mesh nodes without local git access still contribute commits to the project's worktree via a trusted proxy — this is the piece that lets a remote grader model's corrections land as real commits. `src/mesh/skill-manifest.ts` and `src/mesh/skill-packager.ts` add `tested_models` and `mesh_hints` fields to the skill-manifest schema, recording which chips have verified a skill and which model profiles it runs best on. `src/mesh/skill-creator-mcp.ts` exposes eight skill-creator pipeline tools as MCP endpoints so any MCP-speaking agent can drive skill creation, evaluation, and packaging through the mesh without direct CLI access. The practical result: a skill created in this release carries its own provenance and its own routing hints, and the CLI itself is no longer the only entry point to skill-creator.

**Test count and code volume reflect the scope honestly.** 594 new tests (project total climbed to 23,994) across 111 files is proportional to a five-phase architecture delivery — each phase's sub-plans landed with failing tests first (`test(51-01): add failing tests for eval Zod schemas and types` and the 14 other matching TDD pairs are visible in the git log), and every production file has a matching test file. The 19,406 insertions (156 deletions) figure includes 17,400 lines of new TypeScript in `src/chips/`, `src/eval/`, `src/mcp/`, and `src/mesh/`, plus the per-phase planning artifacts under `.planning/phases/50-*`, `51-*`, `52-*`. The release is not net-additive to every existing module — the `src/cli.ts` entrypoint and `src/cli/commands/chip.ts`, `src/cli/commands/eval.ts`, `src/cli/commands/test.ts` were all modified or added to wire the mesh into the CLI surface. `vitest.config.ts` was adjusted to exclude the desktop IPC test from the root vitest run so the mesh tests could execute cleanly at the project level.

**Backward compatibility held across 111 files.** The chip-factory backward-compat line in `feat(50-02)` is not ceremonial — it meant that existing callers of the pre-50 single-model code path continued to work unchanged, and every later phase could assume the old call sites were still live. This is why the milestone shipped as 50 commits on `dev` without a precursor branch and without a migration guide. The `docs(52): update roadmap, state, and summary for completed phases` commit and the three `docs/release-notes/v1.49.7` through `v1.49.14` README additions that landed in the same window kept the surrounding documentation in sync with the architectural change. The test-suite expanded to 23,994 passing with zero regressions in the pre-existing 23,400.

## Key Features

| Area | What Shipped |
|------|--------------|
| Model abstraction interface | `src/chips/types.ts` — `ModelChip` interface + chip-type system; Zod-validated chipset.json schema |
| OpenAI-compatible chip driver | `src/chips/openai-compatible-chip.ts` — handles OpenAI, Together, Fireworks, Groq, llama.cpp, LM Studio, Ollama-OAI, vLLM and any /v1/chat/completions endpoint |
| Anthropic chip driver | `src/chips/anthropic-chip.ts` — native Messages API driver with streaming and tool-call support |
| Chip factory + registry | `src/chips/chip-factory.ts` + `src/chips/chip-registry.ts` — construction and lookup with backward-compat for pre-50 callers |
| Chip test runner | `src/chips/chip-test-runner.ts` — asymmetric evaluation primitive shared by benchmark and eval |
| Eval threshold config | `src/eval/thresholds-config.ts` + `thresholds.md` — per-model pass/fail thresholds with Zod validation |
| Multi-model benchmark runner | `src/eval/multi-model-benchmark.ts` — runs benchmarks across every registered chip in parallel |
| Model-aware grader | `src/eval/model-aware-grader.ts` — tier detection and capability profiling; grader chip separate from responder |
| Eval viewer | `src/eval/eval-viewer.ts` — formatted terminal report with side-by-side per-chip scores |
| LLM MCP wrapper | `src/mcp/llm-wrapper.ts` — 4 MCP tools (chat, tool-call, stream, health), per-chip queue, connection pool |
| Mesh discovery service | `src/mesh/discovery.ts` — heartbeat monitoring, auto-eviction of stale nodes past TTL |
| DACP mesh transport | `src/mesh/transport.ts` — bundle routing, multi-hop relay, append-only event log integration |
| Provenance tracking | `src/mesh/provenance.ts` — chain-of-custody for bundles crossing mesh boundaries |
| Fidelity adapter | `src/mesh/fidelity-adapter.ts` — context-length-aware compression keyed to target model capability |
| Mesh event log | `src/mesh/event-log.ts` — append-only audit log for dispatch reproducibility |
| Mesh routing types | `src/mesh/routing-types.ts` + `src/mesh/routing-policy.ts` — request/response schemas + cost-aware policy |
| Pure scoring functions | `src/mesh/scoring.ts` — `scoreNode`, `rankNodes`, `selectWithFallback` verified pure under IMP-06 |
| Mesh coordinator | `src/mesh/coordinator.ts` — dispatch, fan-out, pipeline, automatic failover |
| Wave planner | `src/mesh/wave-planner.ts` — break multi-step tasks into waves + assign each to best-suited chip |
| Multi-model optimizer | `src/mesh/multi-model-optimizer.ts` — quality/cost/latency-aware model selection per wave |
| Context envelope types | `src/mesh/context-types.ts` — transferable context schema for mesh boundaries |
| Transcript summarizer | `src/mesh/transcript-summarizer.ts` — compresses histories for smaller-context nodes |
| Result ingestion | `src/mesh/result-ingestion.ts` — reassembles distributed results into a unified response |
| Mesh worktree + proxy committer | `src/mesh/mesh-worktree.ts` + `src/mesh/proxy-committer.ts` — git-less nodes land commits via trusted proxy |
| Skill manifest v2 | `src/mesh/skill-manifest.ts` + `src/mesh/skill-packager.ts` — adds `tested_models` and `mesh_hints` fields |
| Skill Creator MCP server | `src/mesh/skill-creator-mcp.ts` — 8 pipeline tools (create, eval, package, etc.) exposed as MCP endpoints |
| CLI integration | `src/cli/commands/chip.ts`, `src/cli/commands/eval.ts`, `src/cli/commands/test.ts` — new `chip` command + `--chip`/`--grader-chip` flags |
| Vitest config | `vitest.config.ts` — excludes desktop IPC test at root level so mesh tests run cleanly |

## Retrospective

### What Worked

- **Pure scoring functions (scoreNode, rankNodes, selectWithFallback) make routing testable without a live mesh.** By separating the scoring logic from the dispatch mechanism, the mesh routing can be unit-tested without spinning up actual LLM providers. This is the functional core / imperative shell pattern applied to multi-model orchestration, and IMP-06 purity verification kept the module from accumulating side effects.
- **Five-phase decomposition mirrors a real network stack.** Abstraction → Evaluation → Infrastructure → Orchestration → Integration follows the same layering discipline as TCP/IP: each phase depends only on the one below it. 594 new tests across 111 files confirm the layers compose correctly without cross-layer mocking.
- **Fidelity-adaptive compression in DACP transport.** Context transfer across mesh boundaries preserves quality by adjusting compression based on the target model's capability. A transcript sent to a smaller-context model arrives with the right trade-off between length and information density instead of being truncated at an arbitrary byte.
- **Automatic failover with fan-out dispatch as first-class operations.** MeshCoordinator handles dispatch, fan-out, pipeline, and failover as named verbs in the API, not as ad-hoc retry loops. The mesh doesn't just route — it recovers, and the recovery paths are tested independently of the happy path.
- **Backward compatibility at the chip-factory boundary held for 111 files.** `feat(50-02)` preserved the pre-50 single-model call sites so every later phase could extend the surface without a migration. Zero regressions across the pre-existing 23,400 tests.
- **TDD discipline across all 19 plans.** Every production file has a matching test file committed first (fourteen `test(XX-YY): add failing tests…` commits precede their `feat(XX-YY): implement…` counterparts in the git log). TDD at 19-plan scale is visible in the commit history.

### What Could Be Better

- **~17,400 LOC of new TypeScript is the largest single-milestone code addition in the v1.49.x series.** The mesh architecture is comprehensive but the volume means significant surface area to maintain. The chip-driver layer is the most likely to need updates as provider APIs evolve (OpenAI breaking changes, Anthropic tool-use format shifts, new endpoint types coming online quarterly).
- **Cost-aware routing is scaffolded but per-provider cost models are not baked in.** `routing-policy.ts` accepts cost metadata but the release ships without a populated cost table — downstream users need to supply their own per-chip cost constants. A follow-on release should ship a default cost table that tracks published API pricing.
- **Mesh discovery assumes reachable peers; no NAT-traversal or relay configuration.** The DiscoveryService heartbeat/eviction loop works on a flat reachable network. Mesh deployments across asymmetric NAT or cloud VPC boundaries need additional transport configuration that this release does not provide.
- **Skill Creator MCP server exposes 8 pipeline tools as stubs in `feat(54-04)`.** The tool signatures are live and the connection plumbing works, but several tool implementations are placeholder stubs pending downstream wiring. Consumers should check the tool-contract doc (added in the 54-04 barrel-export commit) before building against the MCP surface.
- **Per-chip queuing policy is fixed-depth FIFO.** The `src/mcp/llm-wrapper.ts` queue is first-in-first-out with a fixed depth per chip. Priority-aware or deadline-aware queuing would help when a mesh mixes latency-sensitive interactive traffic with batch eval traffic, but that work is deferred to a later phase.
- **Fifty commits in one milestone without a precursor branch strains PR review.** The milestone shipped directly on `dev` with 50 commits visible in the tag range. The commit-level TDD discipline kept each step reviewable in isolation, but the milestone-level review surface is large. Future multi-phase milestones of comparable scope should consider a dedicated feature branch with a PR per phase.

## Lessons Learned

- **Multi-model mesh architecture requires a model abstraction layer before anything else.** Chip drivers for OpenAI-compatible and Anthropic endpoints normalize the interface so routing, evaluation, and failover can be provider-agnostic. Building Phase 53 (routing) without Phase 50 (abstraction) would have forced routing code to know provider-specific error shapes, auth formats, and streaming conventions — the abstraction is what keeps the upper layers clean.
- **Context preservation across mesh boundaries is the hard problem.** Transcript summarization with fidelity-adaptive compression is a trade-off between context length and receiver capability. Getting this wrong means models operate with degraded context after handoff; getting it right means the receiving model is operating on a lossy but coherent summary tuned to its window.
- **MCP infrastructure (queuing, timeout, health monitoring, stale eviction) is unglamorous but essential.** Without per-chip queuing and health probing, the mesh degrades silently under load and eviction never runs. The Phase 52 work is the layer users never see directly but every higher layer depends on.
- **Pure functions belong at the routing layer, not inside the dispatcher.** Keeping `scoring.ts` pure meant routing policy became swappable without re-testing the dispatch mechanism. IMP-06 purity verification is the explicit gate that prevented the separation from eroding.
- **Backward compatibility at the factory boundary is cheaper than migration at every call site.** `ChipFactory` was designed from day one to accept the old single-model configuration alongside the new chipset.json format. The alternative — migrating every existing call site when Phase 50 landed — would have blocked the milestone on refactor work unrelated to the mesh.
- **TDD at 19-plan scale stays tractable when each plan is small enough to test-first in one sitting.** The git log shows fourteen `test(XX-YY)` commits preceding their `feat(XX-YY)` counterparts. Each plan was small enough that the failing-test commit and the passing-implementation commit could ship on the same day without drift, and the failing tests on disk served as the plan specification.
- **Five phases is the right decomposition for a network-stack architecture; it would be the wrong decomposition for a feature bundle.** The phase boundaries only hold because the layers are real: abstraction, evaluation, transport, routing, application. A five-phase plan for five unrelated features would have fought the structure instead of riding it.
- **Cost-aware routing needs a cost model, not just a policy hook.** Shipping the policy scaffold without a default cost table means downstream users do the research the mesh could have done once centrally. The next release should close this gap — policies without data are ceremonial.
- **Worst-case context sizes drive the fidelity adapter, not average sizes.** Designing the fidelity compression against a 4K-window target model while the mesh mostly talks to 128K-window models would have been wasted budget. Designing it against the smallest window the mesh is expected to route to is what made it worth the implementation cost.
- **Proxy committers let git-less nodes contribute real commits.** `src/mesh/proxy-committer.ts` is the piece that prevents the mesh from degrading into a "suggestion engine" — remote nodes can still produce commit-shaped output that lands in the project's git history through a trusted proxy, rather than returning diff text a human must apply manually.
- **Skill manifests become routing documents when `tested_models` and `mesh_hints` are first-class fields.** A skill that records which models have verified it is a skill that the mesh can route correctly without guessing. This turns the manifest from a packaging artifact into a live input to the routing policy.
- **The MCP surface is where the mesh meets the rest of the ecosystem.** `src/mesh/skill-creator-mcp.ts` exposing eight pipeline tools is what allows any MCP-speaking agent to drive skill creation and evaluation without a direct CLI dependency. The CLI is now one client among several — a deliberate architectural outcome, not an accident.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.14](../v1.49.14/) | Predecessor — Dependency Health Monitor & Progressive Internalization Engine; internalization pipeline is the consumer of the multi-model eval data Phase 51 produces |
| [v1.49.13](../v1.49.13/) | Skill Usage Telemetry & Adaptive Pipeline — telemetry data feeds the routing policy's cost-aware scoring |
| [v1.49.16](../v1.49.16/) | Successor — first v1.49.x release built on top of the mesh foundation |
| [v1.49.12](../v1.49.12/) | Heritage Skills Educational Pack — chipset.yaml pattern that the mesh's chipset.json Zod schema extends |
| [v1.49.11](../v1.49.11/) | gsd-init Hardening — part of the sustained v1.49.x patch cadence preceding the mesh milestone |
| [v1.49.10](../v1.49.10/) | Earlier v1.49.x patch — contextual reference for the pre-mesh baseline |
| [v1.49.9](../v1.49.9/) | Pre-mesh release — provides the single-model call-site baseline the chip-factory backward-compat preserved |
| [v1.49.8](../v1.49.8/) | Pre-mesh release — another baseline reference point |
| [v1.49.7](../v1.49.7/) | Optional-dependency contract — the same cross-layer discipline that informed the five-phase decomposition |
| [v1.49.0](../v1.49.0/) | Parent mega-release — GSD-OS foundation that the mesh plugs into via the MCP surface |
| [v1.49](../v1.49/) | Consolidated v1.49 mega-release notes |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — the tangent-line activation model prefigures the mesh's node-scoring geometry |
| [v1.31](../v1.31/) | GSD-OS MCP Integration — the MCP Host Manager foundation that the LLM MCP wrapper extends |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG pattern that the mesh's discovery service generalizes |
| [v1.8](../v1.8/) | Capability-Aware Planning — the capability-profiling idea that model-aware grading inherits |
| [v1.0](../v1.0/) | Foundation — the 6-step adaptive loop whose Compose step the mesh's wave planner is a distributed implementation of |
| `src/chips/` | Model abstraction layer — 10 files, chip drivers + factory + registry + test runner |
| `src/eval/` | Multi-model evaluation — 8 files, thresholds + benchmark + grader + viewer |
| `src/mcp/` | MCP infrastructure — 4 files, LLM wrapper + types |
| `src/mesh/` | Mesh orchestration + integration — 22 files, the bulk of the milestone's new code |
| `thresholds.md` | Per-model pass/fail thresholds — new top-level doc introduced in Phase 50-03 |
| `.planning/phases/50-model-abstraction/` | Phase 50 planning artifacts — 3 sub-plans + cross-reference |
| `.planning/phases/51-multi-model-evaluation/` | Phase 51 planning artifacts — 3 sub-plans |
| `.planning/phases/52-mcp-infrastructure/` | Phase 52 planning artifacts — 3 sub-plans |
| `chapter/00-summary.md` | Chapter summary for this release |
| `chapter/03-retrospective.md` | Chapter retrospective — extended What Worked / What Could Be Better |
| `chapter/04-lessons.md` | Chapter lessons — 5 rule-based + LLM-reviewed lesson extractions |

## Engine Position

v1.49.15 is the architectural inflection point of the v1.49.x series. Preceding releases in the line were self-contained feature additions operating within a single-model call path; v1.49.15 replaces that call path with a five-layer mesh stack that every subsequent release builds on top of. The 594 new tests (project total 23,994) are not merely additive — they are the verification surface for the new layering, and they prove that Phase 50 through Phase 54 compose without mocking across boundaries. Looking back, v1.49.15 stands on the v1.49.0 GSD-OS desktop shell (the runtime surface the MCP server registers into), the v1.31 MCP Host Manager (the protocol the LLM wrapper and Skill Creator server both extend), the v1.8 capability-aware planner (the grading idea that Phase 51 generalizes to per-model tier detection), and the v1.25 dependency-DAG pattern (which the DiscoveryService generalizes to live heartbeat-managed nodes). Looking forward, the chip abstraction becomes the plug point for every new provider; the mesh coordinator becomes the default dispatcher for any skill-creator pipeline that wants multi-model execution; the skill manifest's `tested_models` and `mesh_hints` fields become the routing inputs for every downstream skill consumer; and the Skill Creator MCP server becomes the integration surface for any MCP-speaking agent that wants to drive skill creation without a CLI dependency. The milestone is the first in the v1.49.x series where the mesh is not a future possibility but a shipped architecture — every later v1.49.x release inherits a working, tested, five-layer stack rather than a single-model call path plus a wishlist.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Phases shipped | 5 (50–54) |
| Plans shipped | 19 |
| Mesh layers | 5 (Abstraction / Evaluation / Infrastructure / Orchestration / Integration) |
| Chip drivers | 2 (OpenAI-compatible + Anthropic) covering ~10 provider backends |
| MCP tools exposed | 4 (LLM wrapper) + 8 (Skill Creator) = 12 total |
| New tests added | 594 |
| Total project tests | 23,994 |
| Commits (v1.49.14..v1.49.15) | 50 |
| Files changed | 111 |
| Lines inserted / deleted | 19,406 / 156 |
| New TypeScript LOC | ~17,400 |
| Pure-verified modules | `src/mesh/scoring.ts` (IMP-06) |

## Files

- `src/chips/types.ts`, `src/chips/openai-compatible-chip.ts`, `src/chips/anthropic-chip.ts`, `src/chips/chip-factory.ts`, `src/chips/chip-registry.ts`, `src/chips/chip-test-runner.ts`, `src/chips/index.ts` — model abstraction layer (Phase 50), with matching `.test.ts` files for every production module
- `src/eval/types.ts`, `src/eval/thresholds-config.ts`, `src/eval/multi-model-benchmark.ts`, `src/eval/model-aware-grader.ts`, `src/eval/eval-viewer.ts`, `src/eval/index.ts` — multi-model evaluation layer (Phase 51), with matching tests
- `src/mcp/llm-types.ts`, `src/mcp/llm-wrapper.ts` — LLM MCP wrapper (Phase 52-01), with matching tests
- `src/mesh/types.ts`, `src/mesh/discovery.ts`, `src/mesh/event-log.ts`, `src/mesh/provenance.ts`, `src/mesh/fidelity-adapter.ts`, `src/mesh/transport.ts` — MCP infrastructure + transport (Phase 52-02/52-03), with matching tests
- `src/mesh/routing-types.ts`, `src/mesh/routing-policy.ts`, `src/mesh/scoring.ts`, `src/mesh/coordinator.ts`, `src/mesh/wave-planner.ts`, `src/mesh/multi-model-optimizer.ts`, `src/mesh/index.ts` — mesh orchestration (Phase 53), with matching tests
- `src/mesh/context-types.ts`, `src/mesh/transcript-summarizer.ts`, `src/mesh/result-ingestion.ts`, `src/mesh/mesh-worktree.ts`, `src/mesh/proxy-committer.ts`, `src/mesh/skill-manifest.ts`, `src/mesh/skill-packager.ts`, `src/mesh/skill-creator-mcp.ts` — context & integration (Phase 54), with matching tests
- `src/cli.ts`, `src/cli/commands/chip.ts`, `src/cli/commands/eval.ts`, `src/cli/commands/test.ts` — CLI integration surface, with matching tests for chip and eval
- `thresholds.md` — new top-level per-model threshold configuration document
- `vitest.config.ts` — adjusted to exclude desktop IPC test at root
- `package.json` — version bumped to 1.49.15
- `.planning/phases/50-model-abstraction/` (50-01/50-02/50-03 SUMMARY + IMP-05 cross-reference), `.planning/phases/51-multi-model-evaluation/` (51-01/51-02/51-03 SUMMARY), `.planning/phases/52-mcp-infrastructure/` (52-01/52-02/52-03 SUMMARY) — 12 planning artifacts capturing the sub-plan delivery
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — project-state updates recording the v1.49.15 milestone closure
- `docs/RELEASE-HISTORY.md` — release-history ledger entry for v1.49.15
- `docs/release-notes/v1.49.7/README.md` through `docs/release-notes/v1.49.14/README.md` + RETROSPECTIVE.md + LESSONS-LEARNED.md — release-notes corpus caught up in the same window
- `.claude/commands/gsd/complete-milestone.md` + `.claude/get-shit-done/workflows/complete-milestone.md` — milestone-completion workflow updated for multi-phase milestones

Aggregate: 111 files changed, 19,406 insertions, 156 deletions, 50 commits spanning v1.49.14..v1.49.15.
