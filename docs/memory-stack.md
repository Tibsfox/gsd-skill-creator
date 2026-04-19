# Memory Stack — M1 through M5

**Modules:** M1 Semantic Memory Graph · M2 Hierarchical Hybrid Memory · M3 Decision-Trace Ledger · M4 Branch-Context Experimentation · M5 Agentic Orchestration  
**Register:** Mechanism  
**Source:** Edge et al. 2024 (GraphRAG); Wang et al. 2024 (memory survey); Pan et al. 2025 (KVFlow); Traag et al. 2019 (Leiden); base mission §1.4.1–§1.4.5, §2.2–§2.6  
**Paths:** `src/graph/` · `src/memory/` (extended) · `src/traces/` · `src/branches/` · `src/orchestration/` · `src/cache/`  
**Opt-in flag:** `gsd-skill-creator.orchestration.enabled` (gates M5; M1–M4 each have their own flags)

---

## Overview

The five mechanism modules (M1–M5) form the memory and orchestration substrate of the Living Sensoria stack. They are layered: each module produces structured data that the modules above it consume.

```
M5 Agentic Orchestration
    ↑ reads M1 graph, M2 memory, M3 traces, M4 branches
M4 Branch-Context Experimentation
    ↑ reads M1 graph (skill entities)
M3 Decision-Trace Ledger
    ↑ writes to M2 long-term memory; reads M1 activations
M2 Hierarchical Hybrid Memory
    ↑ reads from M1 community structure
M1 Semantic Memory Graph
    ↑ reads from Grove content-addressed records
```

All five modules are Grove-native: they extend or build on top of the existing `src/memory/` and `src/mesh/` Grove substrate rather than replacing it. The Grove re-architecture inventory (`docs/grove-rearch/inventory.md`) documents the precise EXTEND / NEW-LAYER decision for every affected file. Zero REWRITE decisions were executed.

---

## M1 — Semantic Memory Graph

**Path:** `src/graph/`  
**Source:** Edge et al. 2024 (GraphRAG evaluation); Traag, Waltman, Van Eck 2019 (Leiden algorithm, *Scientific Reports* 9(1), §Results)  
**Grove decision:** NEW-LAYER over `grove-format.ts`

M1 builds an explicit entity/relationship graph from codebase and session context. Skill entities, agent entities, and session events are extracted as typed `Entity` and `Edge` records and written to Grove via the existing `ContentAddressedSetStore`. Leiden community detection (Traag 2019, §Results) then partitions the graph into well-connected communities — Leiden's guarantee that no community contains disconnected subgraphs makes community-level summarisation reliable rather than noise-amplifying.

Seven query patterns are supported: direct entity lookup, edge traversal, community membership, cross-community path, temporal slice, activation sequence, and precedent similarity. Retrieval identifies the relevant community first, then descends to specific nodes — the hierarchical pattern demonstrated to achieve a ~27-point sensemaking improvement over flat-vector retrieval in the GraphRAG evaluation (Edge et al. 2024).

**Acceptance criteria (LS-02, LS-03):** entity extraction precision ≥0.85 on a 200-session fixture; community modularity ≥0.4 on a synthetic benchmark, within 2% of the Leiden reference output.

---

## M2 — Hierarchical Hybrid Memory

**Path:** `src/memory/` (extended: `short-term.ts`, `long-term.ts`, `scorer.ts`, `reflection.ts`, `read-write-reflect.ts`)  
**Source:** Wang et al. 2024 (memory survey, §5 — hybrid memory architectures)  
**Grove decision:** EXTEND of `chroma-store.ts`, `pg-store.ts`, `ram-cache.ts`, `service.ts`, `types.ts`

M2 implements a three-tier hybrid memory architecture: short-term (RAM cache, `src/memory/ram-cache.ts`), warm tier (ChromaDB at `http://localhost:8100`, `src/memory/chroma-store.ts`), and long-term/cold tier (PostgreSQL + pgvector, `src/memory/pg-store.ts`). Entries flow from short-term toward long-term through a priority scorer that fuses three signals:

```
score = α · recency + β · relevance + γ · importance
```

where α, β, γ are configurable weights (defaults: 0.4, 0.4, 0.2). A reflection pass periodically summarises the 1,000 most recent short-term entries into ≤100 long-term entries without losing referenced-entity recall (LS-05).

**ChromaDB endpoint:** M2 is hardwired to `http://localhost:8100` (not the ChromaDB default port 8000). This is the project-local install confirmed by the CF-M2-05 grep check.

**Acceptance criteria (LS-04, LS-05):** read latency <10ms p95 for warm entries; reflection pass reduces 1,000 short-term entries to ≤100 long-term without entity recall loss.

---

## M3 — Decision-Trace Ledger

**Path:** `src/traces/` (schema.ts, writer.ts, reader.ts, precedent.ts)  
**Source:** Milestone spec §D05; base mission §1.4.3, §2.4  
**Grove decision:** EXTEND of `src/mesh/event-log.ts` (added `logDecisionTrace` + `readDecisionTraces`); EXTEND of `src/mesh/types.ts` (added `decision_trace` MeshEventType variant)

M3 maintains an append-only trace of every skill activation, agent composition decision, and significant reasoning step. Traces are written via the extended `event-log.ts` (`logDecisionTrace`) and stored as JSONL at `.planning/traces/decisions.jsonl`. The writer (`src/traces/writer.ts`) redacts obvious secrets on write — any value whose key matches `api_key`, `password`, `token`, `secret`, or `private_key` is replaced with `[REDACTED]` before the trace entry is committed.

Precedent queries (`src/traces/precedent.ts`) surface traces semantically similar to a current decision context, enabling the system to retrieve what was decided, why, and what the outcome was on analogous past situations.

The append-only invariant (IMP-07, `fs.appendFile` exclusively) is enforced at the write-path level and tested by SC-M3-APPEND.

**Acceptance criteria (LS-06, LS-07):** every skill activation writes a trace with lossless round-trip; semantic handoff preserves intent/reasoning/constraints on 50 benchmark precedent queries.

---

## M4 — Branch-Context Experimentation

**Path:** `src/branches/` (fork.ts, explore.ts, commit.ts, manifest.ts, delta.ts)  
**Source:** Milestone spec §D06; base mission §1.4.4, §2.5  
**Grove decision:** EXTEND of `src/mesh/lifecycle-resolver.ts` (added `BranchLifecycleResolver`); EXTEND of `src/mesh/skill-diff.ts` (added `byteChangeFraction`)

M4 implements copy-on-write branches for skill variants. A branch is forked from trunk with `fork.ts`, explored with edits in `.planning/branches/<branch-id>/`, and committed back to trunk via `commit.ts` when the variant proves better. The first-commit-wins rule prevents concurrent branches from overwriting each other: when N=5 concurrent branches attempt to commit, the first succeeds and the remaining N-1 receive a clear diagnostic rather than silently overwriting.

All refinements are bounded at ≤20% change relative to the parent skill body (`byteChangeFraction` on `SkillDiff`, SC-REFINE-BOUND). Branches are userspace-portable — they use `fs` operations under `.planning/branches/`, not git worktrees, so they run identically on macOS, Linux, and Windows CI.

**Acceptance criteria (LS-08, LS-09):** fork/explore/commit cycle completes on all three CI platforms; first-commit-wins with N=5 concurrent branches.

---

## M5 — Agentic Orchestration and Prefix Cache

**Path:** `src/orchestration/` (retrieval-loop.ts, selector.ts) · `src/cache/` (prefix-index.ts, step-graph.ts, preload.ts)  
**Source:** Pan et al. 2025 (KVFlow anticipatory preload); Edge et al. 2024 (GraphRAG multi-turn retrieval)  
**Grove decision:** NEW-LAYER (strictly additive; no existing files modified)

M5 provides multi-turn retrieval and anticipatory preloading. The retrieval loop (`retrieval-loop.ts`) runs multi-turn queries against M1, M2, and M3, composing results through the existing `hybrid-scorer.ts` as a secondary ranker. The selector (`selector.ts`) chooses between cached and live execution paths using the existing mesh routing policy.

The prefix cache (`src/cache/prefix-index.ts`) implements a radix-tree index over skill execution step sequences. The step-graph predictor (`step-graph.ts`) scores the probability of each next step given the current sequence, enabling KVFlow-style anticipatory preloading (Pan et al. 2025) of likely-next skills before they are requested. The preloader (`preload.ts`) fetches those skill bodies into the warm tier (M2 ChromaDB) during idle time in the current step.

**Acceptance criteria (LS-10, LS-11, LS-12):** multi-turn top-k ≥27-point margin over RAGSearch baseline; ≥60% cache hit on the KVFlow-analogue step-graph fixture; first-token latency reduced ≥10x on the 1,000-session cold-load baseline.

---

## How the Five Compose

The eight-module integration (Phase 647, `src/integration/__tests__/living-sensoria/`) verifies the full composition chain end-to-end:

1. M6 Sensoria reads M5 relevance scores as its `[L]` (signal-strength) input.
2. M7 Umwelt's generative model initialises from M1 communities and updates from M3 decision traces.
3. M8 Quintessence reads from all seven modules to compute its five axes.
4. M3 traces carry the `traceId` correlating every activation record to its teaching and co-evolution context in M8.

The integration test records a full end-to-end trace from skill activation through net-shift computation, Markov-blanket update, and Quintessence report.

---

## Primary Sources

- Edge, D., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." Microsoft Research. GraphRAG evaluation and ~27-point sensemaking improvement baseline.
- Wang, L., et al. (2024). "A Survey on Large Language Model based Autonomous Agents." §5 — hybrid short/long-term memory architectures and reflection mechanisms.
- Pan, X., et al. (2025). KVFlow anticipatory preload model for step-graph prediction and prefix-cache population. Cited as the design basis for M5's preloader.
- Traag, V. A., Waltman, L., Van Eck, N. J. (2019). "From Louvain to Leiden: guaranteeing well-connected communities." *Scientific Reports* 9(1). §Results — connectivity guarantee enabling reliable hierarchical summarisation. DOI: 10.1038/s41598-019-41695-z.

---

## MA-1 Eligibility Over M3 Traces

The MA-1 eligibility-trace layer (v1.49.561 refinement wave) attaches a derived index to M3 without modifying the M3 ledger itself. Each M3 decision-trace entry gains an `eligibilitySnapshotId` cross-reference pointing to a parallel JSONL file at `.planning/traces/eligibility.jsonl`. The ledger format is unchanged; CF-M3-05 (append-only, human-readable) is preserved.

MA-1 computes an exponentially-decayed eligibility trace `eᵢ(t)` over every active M5 feature at each decision boundary per Barto 1983 Eq. 3 (p. 841), with decay constant `δ = 0.9` (default). The trace is bounded in memory by O(|active features|) — features whose `eᵢ` decays below 1e-12 are pruned. MA-2's TD-error actor update reads this trace alongside MA-6's `r(t)` to update M5 selector weights via Barto 1983 Eq. 2. The eligibility index can be regenerated from the M3 ledger and MA-6 reinforcement log if lost; it is a derived structure, not a primary source. With `traces.eligibility = false` (the default), no index is written and the M3 ledger is entirely unaffected (SC-MA1-01).

---

## See Also

- `docs/sensoria.md` — M6 reads M5 relevance as signal input
- `docs/umwelt.md` — M7 reads M1 communities and M3 traces
- `docs/symbiosis.md` — M8 reads all seven modules for Quintessence
- `docs/grove-rearch/inventory.md` — Per-file EXTEND / NEW-LAYER decisions for `src/memory/` and `src/mesh/`
- `docs/foundations/theoretical-audit.md` — Theoretical basis including GraphRAG and Leiden derivations
- `docs/reinforcement-taxonomy.md` — MA-6 reinforcement channels that MA-1 eligibility indexes against
- `docs/refinement-wave.md` — refinement wave overview
