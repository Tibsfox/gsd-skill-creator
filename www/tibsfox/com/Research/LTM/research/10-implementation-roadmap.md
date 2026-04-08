# Module 10: Implementation Roadmap & Risk Assessment

**LTM Research Series — Final Module**
**Date:** 2026-04-08
**Status:** Call to action

---

## 0. Executive Summary

Modules 01-09 of this research series established the problem space (what long-term memory for agents actually means), surveyed the state of the art (Memori, Cognee, LIGHT, BEAM, LoCoMo, LongMemEval), audited our current 6-tier LOD architecture (5,087 lines of TypeScript, 167 passing tests, ChromaDB + PostgreSQL + filesystem), and produced ten concrete improvement proposals (A-J).

This final module converts those proposals into a phased implementation roadmap with measurement gates. The central discipline is simple: **no improvement ships without a measurable score gain on our custom benchmark.** Proposals without measurement are hypotheses, not improvements.

The roadmap is structured in five phases:

1. **Foundation** — benchmark infrastructure and persistent RAM working layer (prerequisites)
2. **Quick wins** — HNSW preload and hybrid scorer v2 (low risk, measurable signal)
3. **Architectural additions** — semantic triples, summarization loop, LIGHT-style scratchpad
4. **Graph evolution** — Kuzu or PostgreSQL AGE graph layer with context-aware routing
5. **Long-term refinement** — compression, decay, and external cross-validation

Every phase has a measurement gate. Failing the gate means the phase does not advance; we iterate or roll back. The "never delete, only archive" policy applies to both data and to failed experiments — failed branches are preserved as research artifacts, not wiped.

This module is intentionally the last. It is the bridge from research to engineering.

---

## 1. Context Recap

Before the roadmap, the constraints:

**Hardware reality (measured, 2026-04-08):**
- 62 GB total RAM, 45.7 GB available at baseline
- `/dev/shm` tmpfs: 31 GB capacity, currently idle
- Single-box architecture (no distributed memory layer)
- RTX 4060 Ti (8 GB VRAM) for embeddings and local models

**Software state:**
- TypeScript library (`src/memory/*`) — 5,087 lines, 167 passing tests
- Rust Tauri v2 shell hosting the memory subsystem
- ChromaDB at `http://localhost:8100` (local HTTP service)
- PostgreSQL with 129 sessions, 16,928 turns (session log database)
- 6-tier LOD: RAM → Index → Files → Chroma → PostgreSQL → Corpus

**Operational principles (non-negotiable):**
- **Never delete, only archive** — every artifact, turn, and decision is permanent
- **Local-first** — benchmarks, data, and evaluation never leave the machine
- **Benchmark-driven** — every claim is a number, not a feeling
- **TDD cadence** — RED → GREEN → commit, per the project's proven plan template

**Proposals from Module 09 (recap):**

| ID | Proposal | Category |
|----|----------|----------|
| A | Persistent RAM disk working layer | Infrastructure (PREREQUISITE) |
| B | Semantic triples layer (Memori-style) | Architecture |
| C | Graph layer (Cognee-style) | Architecture |
| D | LIGHT-style working memory + scratchpad | Architecture |
| E | Conversation summarization loop | Process |
| F | Continuous benchmark feedback loop | Measurement (PREREQUISITE) |
| G | Hybrid scorer v2 | Retrieval quality |
| H | Precomputed retrieval index in RAM | Performance |
| I | Context-aware retrieval routing | Retrieval quality |
| J | Compression and decay | Lifecycle |

A and F are marked PREREQUISITE because they are what makes all subsequent measurements trustworthy. You cannot claim "semantic triples improved recall by 12 %" without F in place, and you cannot run F with usable latency without A.

---

## 2. Guiding Principles for the Roadmap

Four principles shape how phases are ordered and gated.

**Principle 1: Measure first, improve second.**
Phase 1 exists to build the ruler. We do not touch retrieval behavior until we can prove we know how to grade it. This is the same discipline as NASA flight testing: instrument, then fly.

**Principle 2: Earn complexity.**
Each new architectural layer (triples, graph, scratchpad) must earn its place by moving a number. A graph layer that improves HotPotQA by 1 % is not worth its maintenance cost. A graph layer that improves it by 20 % is. We will not add Kuzu "because Cognee did."

**Principle 3: Reversible over clever.**
Every phase ships behind a feature flag and with a rollback procedure that takes minutes, not days. The "never delete" policy means failed experiments are archived, not removed — a failed Phase 3 still informs Phase 4.

**Principle 4: Composability.**
Phases are designed so later phases can consume earlier ones without rewrites. The benchmark built in Phase 1 still grades Phase 5. The RAM working layer from Phase 1 hosts the triples from Phase 3 and the graph indices from Phase 4.

---

## 3. Phase 1 — Foundation (Benchmark + RAM Working Layer)

**Goal:** Instrument the system. Build the ruler. Provide the persistent fast-tier working layer everything else will use.

**Dependencies:**
- Current 6-tier LOD system is stable (✓ confirmed, long uptime)
- `/dev/shm` is available and not contended (✓ confirmed, 31 GB idle)
- PostgreSQL session log database is accessible (✓ confirmed, 129 sessions / 16,928 turns)

**Duration estimate:** Order of magnitude = weeks, not days, not months. Call it 2-4 weeks of focused work.

**Key files affected:**
- `src/memory/bench/` (NEW) — benchmark harness, dataset loaders, scoring
- `src/memory/bench/categories/` (NEW) — 10 BEAM-aligned category evaluators
- `src/memory/ram-layer/` (NEW) — persistent RAM working layer (tmpfs-backed)
- `src/memory/lod.ts` (MODIFY) — register RAM layer as tier 0.5
- `src/memory/config.ts` (MODIFY) — add RAM disk path, growth policy, flush interval
- `.planning/benchmarks/` (NEW) — benchmark configs, datasets, baseline captures

**Tests added (target):** +60 tests (from 167 → 227)
- 30 tests for benchmark harness correctness (known-good fixtures → expected scores)
- 20 tests for RAM layer persistence, growth, flush, recovery
- 10 tests for integration (RAM layer visible through LOD interface)

**Proposal F — Custom benchmark infrastructure (from Module 08):**

The benchmark must cover all 10 BEAM categories we identified:
1. Factual recall (single turn)
2. Factual recall (multi-session)
3. Temporal reasoning ("what did we decide last Tuesday?")
4. Preference continuity ("I told you I hate X")
5. Multi-hop reasoning (HotPotQA-style)
6. Contradiction detection (conflicting statements across sessions)
7. Entity linking (same entity under different names)
8. Intent classification (routing queries to correct tier)
9. Summarization fidelity (does summary preserve key claims?)
10. Long-context stress (LongMemEval-style, 100+ turn histories)

The harness reads from our actual PostgreSQL session log (129 sessions / 16,928 turns) — this is the crucial detail. We do not benchmark on synthetic LoCoMo conversations. We benchmark on **our own data**, because our data is the distribution we actually serve. External benchmarks appear only in Phase 5 as cross-validation.

Each category produces: a precision, a recall, a p95 latency, and a "cost" (tokens consumed by retrieval prompts). The headline number per category is F1.

**Proposal A — Persistent RAM disk working layer:**

```
Path:           /dev/shm/gsd-memory/working/
Initial size:   4 GB (well under 31 GB tmpfs capacity)
Growth policy:  +1 GB when utilization > 80 %, cap at 16 GB
Flush policy:   Every 60 s, write-ahead log to ~/.gsd/ram-layer-wal/
Recovery:       On boot, replay WAL into /dev/shm
Eviction:       None (never delete — promote to tier 2 files when warm-dirty)
```

The RAM layer is not a cache in the traditional sense. It is the **working tier** — where currently-active semantic triples, hot summaries, and precomputed indices live. It is persistent in the sense that the WAL ensures no data is lost on crash, even though `/dev/shm` itself is volatile.

The "never delete" policy is preserved by treating the RAM layer as a **promotion queue**: anything written to RAM is simultaneously WAL'd, and eventually flushed to tier 2 (files) or tier 4 (PostgreSQL) based on access pattern. Nothing evicts from the system — items only get colder.

**Risk assessment:**

| Risk | Category | Mitigation |
|------|----------|------------|
| tmpfs exhaustion starves other processes | Integration | 16 GB hard cap, monitor /dev/shm, alert at 70 % |
| WAL corruption on crash mid-write | Data loss | fsync on WAL append, checksum per record |
| Benchmark harness measures wrong thing | Complexity | Golden fixtures with hand-verified scores |
| Benchmark leaks private data to external service | Privacy | Harness is `import.meta.env.OFFLINE_ONLY === true`, no network in bench code |
| Baseline is unreproducible | Complexity | Pin system state (Node version, Chroma version, model hash) in baseline manifest |

**Rollback plan:**
- Feature flag `memory.ramLayer.enabled = false` → LOD bypasses RAM layer entirely, falls back to original 6-tier behavior
- Benchmark harness is additive — rolling it back is deleting directory `src/memory/bench/` and reverting `package.json`
- All Phase 1 commits are atomic (TDD RED/GREEN pattern), `git revert` works

**Measurement gate (must be met to proceed to Phase 2):**
- Benchmark runs end-to-end in < 15 minutes on full dataset
- Baseline captured with precision/recall/F1/p95 latency per all 10 BEAM categories
- Baseline is reproducible — two consecutive runs produce scores within ±1 % absolute F1
- RAM layer uptime: 72 hours continuous, zero data-loss events, WAL replay tested by `kill -9` simulation

If any of the above fails, Phase 1 does not complete. We do not proceed to Phase 2 with a broken ruler.

---

## 4. Phase 2 — Quick Wins (HNSW Preload + Scorer v2)

**Goal:** Demonstrate that the benchmark can detect real improvements, using two changes that should unambiguously help.

**Dependencies:**
- Phase 1 complete and gate passed
- Baseline numbers captured and archived under `.planning/benchmarks/baselines/phase-1-baseline.json`

**Duration estimate:** 1-2 weeks.

**Key files affected:**
- `src/memory/chroma/hnsw-preload.ts` (NEW) — loads HNSW index into `/dev/shm` on boot
- `src/memory/chroma/client.ts` (MODIFY) — checks for preloaded index, uses it if present
- `src/memory/scoring/hybrid.ts` (MODIFY) — scorer v2 with new signals
- `src/memory/scoring/signals/` (NEW) — recency, session-cohesion, entity-overlap, lexical-BM25
- `src/memory/tests/scoring.test.ts` (MODIFY) — add regression fixtures

**Tests added:** +25 tests (from 227 → 252)

**Proposal H — Precomputed retrieval index in RAM:**

ChromaDB's HNSW index is the biggest cold-start cost. By pre-building and memory-mapping it from `/dev/shm`, we eliminate the first-query penalty entirely. The preload logic:

1. On boot, check `/dev/shm/gsd-memory/chroma-hnsw/{collection}.bin` existence
2. If present and checksum matches Chroma's on-disk version → memory-map into process
3. If absent → rebuild from Chroma's persistent store, write to `/dev/shm`, checksum
4. First retrieval query is served from the RAM-resident index

Expected effect: p95 first-query latency drops from ~400 ms to ~30 ms. No recall change (same algorithm).

**Proposal G — Hybrid scorer v2:**

Current scorer weights dense-embedding similarity heavily. Scorer v2 adds:

```
score = w1 * dense_sim(q, doc)
      + w2 * bm25(q, doc)
      + w3 * recency_decay(doc.timestamp)
      + w4 * session_cohesion(doc.session_id, current_session)
      + w5 * entity_overlap(q.entities, doc.entities)
```

Weights `w1..w5` are tuned using Phase 1's benchmark as the fitness function. We run a small grid search (not Bayesian optimization, not RL — just a grid) and pick the weight combination that maximizes macro-F1 across the 10 BEAM categories.

**Risk assessment:**

| Risk | Category | Mitigation |
|------|----------|------------|
| Preload index stale vs. Chroma disk | Integration | Checksum gate + rebuild on mismatch |
| Scorer v2 overfits to benchmark | Regression | Hold out 20 % of dataset for validation, never tune on it |
| New signals increase p95 latency | Regression | Benchmark measures latency; gate rejects regressions |
| Scorer v2 regresses some categories while improving others | Complexity | Gate requires "no category drops more than 2 % F1" |

**Rollback plan:**
- Feature flag `memory.hnswPreload.enabled` and `memory.scorer.version = 1|2`
- Scorer v1 remains in codebase indefinitely as a comparison baseline
- If v2 regresses, we ship v1 and log the v2 experiment as `.planning/benchmarks/experiments/scorer-v2-failed.md`

**Measurement gate:**
- ≥ +5 % absolute F1 improvement on at least 3 BEAM categories (vs. Phase 1 baseline)
- No category regresses by more than 2 % absolute F1
- p95 latency unchanged or reduced
- Holdout validation set confirms improvement (not just training-set overfit)

---

## 5. Phase 3 — Architectural Additions (Triples + Summarization + Scratchpad)

**Goal:** Introduce the first set of genuinely new memory structures. Move the multi-session reasoning number.

**Dependencies:**
- Phase 2 complete, scorer v2 shipping, p95 latencies stable
- RAM working layer has hosted the HNSW index for ≥ 2 weeks without incident
- Benchmark has demonstrated it can detect a 5 % improvement — trust is established

**Duration estimate:** 4-8 weeks. This is the longest phase.

**Key files affected:**
- `src/memory/triples/` (NEW) — semantic triple extraction, storage, query
- `src/memory/triples/extractor.ts` (NEW) — LLM-backed extraction pipeline
- `src/memory/triples/store.ts` (NEW) — triple store backed by PostgreSQL + RAM index
- `src/memory/summarization/` (NEW) — conversation summarization loop
- `src/memory/summarization/roller.ts` (NEW) — rolling window summarizer
- `src/memory/working/` (NEW) — LIGHT-style working memory
- `src/memory/working/scratchpad.ts` (NEW) — agent-writable scratchpad
- `src/memory/lod.ts` (MODIFY) — register triples, summaries, scratchpad as retrieval sources
- `src/memory/routing/` (NEW, stub for Phase 4) — query → source routing

**Tests added:** +80 tests (from 252 → 332)

**Proposal B — Semantic triples layer (Memori-inspired):**

For each conversation turn, extract structured `(subject, predicate, object, confidence, provenance, timestamp)` tuples via a lightweight LLM call. Examples:

```
(user, prefers, "dark mode", 0.95, turn_2481, 2026-03-12T14:22Z)
(project "gsd-skill-creator", depends_on, "Tauri v2", 0.99, turn_2485, 2026-03-12T14:25Z)
(muse "Cedar", role, "filter and ledger", 1.0, turn_2501, 2026-03-12T15:01Z)
```

Triples are stored in PostgreSQL (for durability) and mirrored into the RAM working layer (for query speed). They are **additive** — we never overwrite; conflicting triples coexist with different timestamps and provenance, and retrieval surfaces the most recent unless explicitly asked for history.

This is where "never delete" meets "semantic consistency": contradictions are features, not bugs. The retrieval layer can ask "has the user ever said they prefer light mode?" and get the full history.

**Proposal E — Conversation summarization loop (Memori-inspired):**

A background process runs every N turns (N ≈ 20) and produces:
- A short (< 200 token) rolling summary of the last window
- A medium (< 500 token) session-level summary on session close
- A long-form archive summary on session promotion (tier 3 → tier 4)

Summaries are stored alongside raw turns, never replacing them. Retrieval can request the raw turns, the rolling summary, the session summary, or the archive — whichever best fits the query's LOD needs.

**Proposal D — LIGHT-style working memory + scratchpad (BEAM-inspired):**

An explicit scratchpad the agent can write to within a session, backed by the RAM working layer. The scratchpad is where in-progress reasoning lives: "I'm currently investigating X, have ruled out Y, and need to check Z." This mirrors BEAM's notion that working memory is task-scoped and should be flushable on task completion — but in our system, flushing means *promotion to tier 2/3*, not deletion.

**Risk assessment:**

| Risk | Category | Mitigation |
|------|----------|------------|
| LLM triple extraction is slow (per-turn cost) | Cost | Batch extraction every 10 turns; use local model (e.g. Qwen3-4B) before reaching for API |
| Triples are wrong and pollute retrieval | Regression | Confidence threshold (drop < 0.7); benchmark gate rejects regressions |
| Summarization drops important details | Regression | Benchmark category "summarization fidelity" directly tests this |
| Scratchpad leaks across sessions | Integration | Session-scoped keys, explicit promotion gesture |
| RAM working layer fills up | Integration | Growth policy from Phase 1, plus metric dashboard |
| Per-turn cost doubles due to extraction LLM | Cost | Budget gate: "cost per turn must not exceed 1.5× Phase 2" |

**Rollback plan:**
- Three independent feature flags: `memory.triples.enabled`, `memory.summarization.enabled`, `memory.scratchpad.enabled`
- Each can be disabled independently; the system degrades gracefully to the Phase 2 state
- Triple store is additive in PostgreSQL — rolling back is ignoring the table, not dropping it
- Summaries are stored alongside raw turns — rolling back is ignoring the summary column

**Measurement gate:**
- LoCoMo-style multi-session reasoning score improves from baseline 60.3 % to ≥ 75 %
- Factual recall (multi-session) category improves by ≥ 10 % F1
- Temporal reasoning category improves by ≥ 8 % F1
- Per-turn cost increases by ≤ 50 % (budget constraint)
- p95 latency increases by ≤ 25 % (comfort constraint)

---

## 6. Phase 4 — Graph Evolution (Kuzu or AGE + Context-Aware Routing)

**Goal:** Unlock multi-hop reasoning. Move the HotPotQA number. This is the highest-complexity phase.

**Dependencies:**
- Phase 3 complete with LoCoMo ≥ 75 %
- Triples layer is producing clean, high-confidence tuples at scale
- Team has appetite for new runtime dependency (graph DB)

**Duration estimate:** 6-12 weeks. The engineering is not the hard part; the integration and measurement are.

**Key files affected:**
- `src/memory/graph/` (NEW) — graph layer
- `src/memory/graph/kuzu-adapter.ts` OR `src/memory/graph/age-adapter.ts` (NEW) — choose one
- `src/memory/graph/builder.ts` (NEW) — build graph from triples layer
- `src/memory/graph/traversal.ts` (NEW) — multi-hop path queries
- `src/memory/routing/router.ts` (MODIFY) — promote from Phase 3 stub to full implementation
- `src-tauri/` (MODIFY) — add Kuzu binary bundling if chosen
- `package.json` (MODIFY) — new runtime dep

**Tests added:** +60 tests (from 332 → 392)

**Proposal C — Graph layer (Cognee-inspired):**

Two candidate backends:

| | Kuzu | PostgreSQL AGE |
|---|------|----------------|
| Install | New process/lib | Extension to existing PostgreSQL |
| Query language | Cypher | openCypher via AGE |
| Performance | Very fast on single-box | Good, leverages existing PG |
| Operational cost | New runtime | Zero new runtime |
| Privacy | Local | Local |
| Lock-in risk | Moderate | Low (same PG we already run) |

Recommendation: start with PostgreSQL AGE. It reuses infrastructure we already run (the same Postgres that holds 129 sessions / 16,928 turns), introduces no new process, and keeps backups unified. If AGE proves insufficient for traversal performance, revisit Kuzu in a later iteration.

The graph is built *from* the triples layer. Nodes are entities (subjects and objects), edges are predicates. The graph is rebuilt incrementally as new triples arrive.

**Proposal I — Context-aware retrieval routing:**

Queries are classified (intent classification — this is where the specs from Module 04 come in) and routed to appropriate sources:

| Query type | Primary source |
|------------|----------------|
| Factual lookup (single fact) | Triples layer |
| Recent context ("what did we just decide?") | Rolling summary + tier 0 RAM |
| Multi-hop reasoning ("how does X connect to Y?") | Graph traversal |
| Long historical ("six months ago we talked about…") | Session summaries + tier 3/4 |
| Exact quote / verbatim | Tier 2 files via BM25 |

The router is a small classifier — initially rule-based, later possibly a learned model. It is *itself* benchmarked: we measure routing accuracy directly.

**Risk assessment:**

| Risk | Category | Mitigation |
|------|----------|------------|
| Kuzu/AGE adds runtime dep that breaks Tauri bundling | Dependency | Prototype bundling in first week; if blocked, use AGE |
| Graph traversal is slow on large graphs | Complexity | Benchmark gate enforces p95 ceiling |
| Router misclassifies queries and degrades recall | Regression | Per-category benchmark catches this |
| Graph construction from triples introduces errors | Regression | Triple confidence threshold + graph validation pass |
| AGE extension incompatible with our PG version | Integration | Version-pin check before phase start |
| Graph rebuild cost exceeds nightly window | Cost | Incremental rebuild (delta-only) from start |

**Rollback plan:**
- Feature flag `memory.graph.enabled = false` → router falls back to Phase 3 sources
- Graph data is derived from triples — rolling back is dropping/ignoring the graph, triples persist
- If AGE chosen and fails: migrate to Kuzu without changing triples layer
- If router regresses: pin `memory.router.mode = 'phase3'`

**Measurement gate:**
- HotPotQA-style multi-hop reasoning correctness reaches ≥ 0.85
- Multi-hop category improves by ≥ 20 % F1 vs. Phase 3
- No other category regresses by more than 3 % F1
- Graph rebuild completes in < 10 minutes on full dataset
- Routing accuracy ≥ 0.90 on benchmark holdout

---

## 7. Phase 5 — Long-Term Refinement (Compression, Decay, External Cross-Validation)

**Goal:** Close the loop. Verify we have not merely overfit to our own benchmark. Prepare publication-ready numbers.

**Dependencies:**
- Phase 4 complete and gate passed
- System has been running in Phase 4 configuration for ≥ 30 days without incident
- External benchmark access secured (LoCoMo dataset, LongMemEval, BEAM subset)

**Duration estimate:** 4-8 weeks, but this phase is iterative — refinement continues indefinitely.

**Key files affected:**
- `src/memory/compression/` (NEW) — compression and decay
- `src/memory/compression/archive.ts` (NEW) — promote old items to compressed archive tier
- `src/memory/bench/external/` (NEW) — external benchmark adapters
- `docs/research/ltm-final-report.md` (NEW) — publication-ready writeup

**Tests added:** +40 tests (from 392 → 432)

**Proposal J — Compression and decay (aligned with "never delete"):**

The policy is strict: **we never delete**. What we *do* is compress and move to colder tiers.

- Items older than 90 days with access count ≤ 2 → compressed (zstd) into archive blobs
- Items older than 1 year → bundled into per-month tarballs
- Items older than 3 years → offline archive (still addressable, slower retrieval)

"Decay" here means *decay in retrieval weight*, not decay in existence. An item from 2023 that is asked for by name is retrievable; it just isn't boosted in general-purpose ranking.

**External cross-validation:**

We run our Phase 4 system on:
- LoCoMo dataset (original benchmark, external)
- LongMemEval
- A BEAM subset (the categories we can legally obtain)

Numbers are published alongside our custom-benchmark numbers. If the external numbers are dramatically lower, we have overfit. That's a discovery, not a failure — and it drives Phase 5.x iterations.

**Risk assessment:**

| Risk | Category | Mitigation |
|------|----------|------------|
| Compression corrupts items | Data loss | Checksum per compressed bundle, retain originals until verified |
| Decay weights hurt legitimate old-item retrieval | Regression | Benchmark "temporal reasoning" and "long historical" categories |
| External benchmarks leak private data | Privacy | External benchmark runs use sanitized fixtures only; our data never leaves |
| Gap between custom and external is huge | Complexity | Discovery, not failure — drives iteration |
| Publication pressure rushes numbers | Complexity | No publication without ≥ 3 consecutive stable runs |

**Rollback plan:**
- Compression is reversible (decompress + replace)
- Decay weights are tunable without data migration
- External benchmark adapters are additive

**Measurement gate:**
- Gap between custom-benchmark F1 and external-benchmark F1 is ≤ 10 % absolute
- "Temporal reasoning" category does not regress after decay weights ship
- Compression reduces disk footprint by ≥ 40 % with zero data loss (checksum verified)
- Publication-ready report generated from benchmark dashboard

---

## 8. Phased Timeline (Gantt-Style ASCII)

```
                    Weeks →    1    4    8   12   16   20   24   28   32   36   40
Phase 1: Foundation         [▓▓▓▓▓▓▓▓]
  Benchmark harness          [▓▓▓▓▓]
  RAM working layer          [▓▓▓▓▓▓]
  Baseline capture                  [▓▓]
  Gate                                 ◆
Phase 2: Quick Wins                  [▓▓▓▓]
  HNSW preload                       [▓▓]
  Scorer v2                           [▓▓▓]
  Gate                                     ◆
Phase 3: Architectural                   [▓▓▓▓▓▓▓▓▓▓▓▓]
  Semantic triples                       [▓▓▓▓▓▓]
  Summarization                              [▓▓▓▓]
  Scratchpad                                  [▓▓▓▓▓]
  Gate                                                     ◆
Phase 4: Graph                                           [▓▓▓▓▓▓▓▓▓▓▓▓]
  Backend choice + integ                                 [▓▓▓]
  Graph builder                                             [▓▓▓▓]
  Context router                                             [▓▓▓▓▓]
  Gate                                                                     ◆
Phase 5: Refinement                                                      [▓▓▓▓▓▓▓▓▓]
  Compression/decay                                                      [▓▓▓▓]
  External cross-val                                                        [▓▓▓▓▓]
  Publication gate                                                                  ◆
```

`◆ = measurement gate` — phase does not advance without passing. Bars are rough order-of-magnitude, not commitments.

---

## 9. Measurement Dashboard Spec

A single HTML dashboard consumed by both humans and CI. Served from the Tauri desktop app during development; exported as a static site for archival.

**Panel layout:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  LTM Memory Benchmark Dashboard       phase: 2   last run: 14:22Z   │
├───────────────────────────────┬─────────────────────────────────────┤
│  BEAM Categories (F1)         │  Per-phase deltas                   │
│  ─────────────────────────    │  ────────────────                   │
│  1. Factual recall      0.87  │  Phase 1 baseline       macro 0.71  │
│  2. Multi-session       0.79  │  Phase 2 current        macro 0.76  │
│  3. Temporal reason     0.72  │  Δ vs baseline          +0.05 ✓     │
│  4. Preference cont     0.84  │  Gate (≥ +5 %, 3 cats)  PASS ✓      │
│  5. Multi-hop           0.63  │                                     │
│  6. Contradiction       0.70  │  p95 latency        42 ms  (was 68) │
│  7. Entity linking      0.75  │  cost/turn          $0.008 (flat)   │
│  8. Intent class        0.89  │  RAM usage          3.2/4.0 GB      │
│  9. Summary fidelity    0.81  │  tests              252 passing     │
│ 10. Long-context        0.58  │  uptime             94 h            │
├───────────────────────────────┴─────────────────────────────────────┤
│  Regression guard:  no category dropped > 2 %   ✓                   │
│  Budget guard:      cost flat, latency improved ✓                   │
│  Phase 2 gate:      READY TO ADVANCE                                │
└─────────────────────────────────────────────────────────────────────┘
```

**Metrics tracked:**

| Metric | Source | Update frequency |
|--------|--------|-----------------|
| Per-category F1 | Benchmark run | Per commit (CI) + nightly full |
| p95/p99 retrieval latency | In-process timing | Per commit |
| Cost per turn (tokens) | Budget accounting | Per commit |
| RAM layer utilization | `/dev/shm` probe | Every 60 s |
| WAL replay success rate | Crash simulation job | Nightly |
| Test count / pass rate | Vitest output | Per commit |
| Uptime | Process monitor | Continuous |
| Phase gate status | Gate evaluator | Per commit |

**Storage:** Dashboard state lives in `.planning/benchmarks/dashboard/` as append-only JSONL. Every run produces one line. History is permanent (never-delete). The HTML is rendered from the JSONL.

---

## 10. CI Integration Plan

**Triggers:**
- Every PR to `artemis-ii` (or current working branch) → quick benchmark run (< 5 min, subset of categories)
- Merge to working branch → full benchmark run (all 10 categories)
- Nightly → full run + regression comparison vs. last 7 nights
- Pre-phase-advance → three consecutive green full runs required

**Gate enforcement:**
The `bench-gate` job reads the current phase from `.planning/benchmarks/current-phase.json` and evaluates that phase's specific gate. If the PR would cause a gate regression, the job fails. This is deterministic — no human judgment required for pass/fail.

**Artifacts produced per run:**
- `bench-run-<timestamp>.json` — full numeric results
- `bench-run-<timestamp>.html` — human-readable report
- `bench-run-<timestamp>.diff.md` — delta vs. previous run
- Written to `.planning/benchmarks/runs/` (append-only)

**CI config location:** `.github/workflows/bench.yml` (if publishing) or `.planning/ci/bench-local.sh` (if local-only CI).

Given our local-first posture, the primary runner is **local CI via a pre-commit hook + nightly systemd timer**. GitHub CI is optional and runs on sanitized fixtures only (never real session data).

---

## 11. Risk Assessment Matrix

Consolidated across all phases:

| # | Risk | Category | Likelihood | Impact | Phase | Mitigation |
|---|------|----------|------------|--------|-------|------------|
| 1 | tmpfs exhaustion | Integration | Medium | High | 1 | Hard caps, monitoring |
| 2 | WAL corruption on crash | Data loss | Low | High | 1 | fsync + checksum + replay tests |
| 3 | Benchmark overfit | Complexity | High | High | 2-5 | Holdout set, external validation Phase 5 |
| 4 | LLM triple extraction cost explosion | Cost | Medium | Medium | 3 | Local model first, batch extraction |
| 5 | Triples pollute retrieval with errors | Regression | Medium | High | 3 | Confidence threshold, benchmark gate |
| 6 | Graph DB dependency breaks Tauri bundling | Dependency | Medium | High | 4 | Prototype bundling first; prefer AGE |
| 7 | Router misclassification | Regression | Medium | Medium | 4 | Benchmark routing accuracy directly |
| 8 | Compression data corruption | Data loss | Low | Critical | 5 | Checksums, retain originals until verified |
| 9 | External benchmark leaks private data | Privacy | Low | Critical | 5 | Sanitized fixtures, no real data |
| 10 | Publication rush produces bad numbers | Complexity | Medium | Medium | 5 | 3-run stability requirement |
| 11 | MCP tool interface drift | Integration | Low | Medium | All | MCP contract tests |
| 12 | Hook collisions during CI | Integration | Low | Low | All | Hook namespace per phase |

**Critical (low likelihood, critical impact) risks** — 2, 8, 9 — are the ones that could destroy user data or trust. Every phase containing them has explicit verification steps. The "never delete" policy is the structural insurance against most data-loss risks.

---

## 12. Rollback Procedures (Summary)

Every phase ships with a rollback procedure that takes under 30 minutes.

**Phase 1 rollback:** `git revert` the Phase 1 merge commits; `memory.ramLayer.enabled=false`. Benchmark harness stays (it's additive and useful regardless).

**Phase 2 rollback:** `memory.hnswPreload.enabled=false`, `memory.scorer.version=1`. No data changes.

**Phase 3 rollback:** `memory.triples.enabled=false`, `memory.summarization.enabled=false`, `memory.scratchpad.enabled=false`. Triples and summaries remain in PostgreSQL (never delete).

**Phase 4 rollback:** `memory.graph.enabled=false`, `memory.router.mode='phase3'`. Graph data stays in AGE/Kuzu tables (never delete) for forensic analysis.

**Phase 5 rollback:** Decay weights reset to 1.0; compression reversed (decompression is deterministic); archive bundles retained.

**Universal rule:** Rollback never removes data. It only disables code paths. Any artifact produced during a failed experiment is archived under `.planning/benchmarks/experiments/phase-<n>-<experiment>/` as a research artifact.

---

## 13. Success Metrics — Final Targets

End-state targets after Phase 5 (aspirational but measurable):

| Metric | Current | Phase 5 target |
|--------|---------|----------------|
| Custom benchmark macro F1 | ~0.71 (estimated baseline) | ≥ 0.85 |
| LoCoMo multi-session reasoning | 60.3 % | ≥ 80 % |
| HotPotQA correctness | not measured | ≥ 0.85 |
| p95 retrieval latency | ~400 ms (cold) / ~120 ms (warm) | ≤ 50 ms (warm) |
| Cost per turn | baseline | ≤ 2× baseline |
| Test count | 167 | ≥ 432 |
| Uptime | stable (long) | ≥ 99 % over 90 days |
| External benchmark delta | not measured | ≤ 10 % below custom |

These are targets, not promises. The discipline is that each phase has its own measurable gate, and the final Phase 5 targets are what we would publish *if* we get there.

---

## 14. What This Roadmap Does Not Promise

Honesty about limits:

1. **No calendar dates.** Order-of-magnitude estimates only. Engineering has variance; we will not manufacture false certainty.
2. **No guaranteed numeric gains.** Gates are *conditions for advancing*, not predictions. A phase can fail to meet its gate, and that is a valid outcome that drives iteration.
3. **No assumption of correctness of external benchmarks.** LoCoMo and BEAM may have their own biases that do not reflect our distribution. Cross-validation is for calibration, not for blessing.
4. **No rewrite of the existing 6-tier LOD.** The roadmap is additive. The current 5,087 lines stay.
5. **No claim of SOTA.** We are building a system that works for us, on our data, on our hardware. "State of the art" is a marketing term; "works for us and we can prove it" is engineering.

---

## 15. Relationship to the Fox Companies Long-Term Lens

One paragraph, because the standing instruction requires keeping it in mind.

A benchmark-driven, locally-hosted, never-delete memory system with graph reasoning is directly aligned with FoxCompute (local compute for memory and reasoning) and FoxFiber (trust and provenance of stored claims). The roadmap keeps all data local, treats provenance as first-class (triples carry `provenance` and `timestamp` fields), and produces publication-ready numbers that do not leak private data. If Fox Companies eventually serve external tenants, this architecture ports cleanly: each tenant gets their own LOD stack on their own /dev/shm, the triples layer natively carries provenance for audit, and the benchmark harness lets us quote honest numbers to prospective partners. The IP stays in `.planning/`; the research artifacts shipped to `www/` are exactly that — research.

---

## 16. Call to Action

Modules 01-09 defined the problem and explored the solution space. Module 10 — this module — defines the execution discipline.

The discipline is simple enough to fit in three sentences:

> Build the ruler before you measure. Measure before you improve. Ship no change without a numeric gain on our custom benchmark.

Everything else — the RAM layer, the triples, the summaries, the graph, the decay, the cross-validation — is downstream of that discipline. If we hold the line on measurement-first, every phase's success or failure will be legible to future readers, including ourselves.

The first concrete next step is Phase 1: build the benchmark harness and bring up the RAM working layer. Nothing in Phases 2-5 can start until Phase 1's gate passes, and Phase 1's gate is deliberately strict: **reproducible baseline numbers across all 10 BEAM categories, RAM layer surviving a `kill -9` crash test, 72 hours of continuous uptime.**

Until that gate is passed, every proposal in Modules 01-09 — including the ones we are most excited about — is a hypothesis. After that gate is passed, they become *experiments*, and experiments either move a number or they don't. There is no third option.

**Benchmark-driven development: no improvement ships without a measurable score gain on our custom benchmark. Proposals without measurement are hypotheses, not improvements.**

---

*End of Module 10. End of LTM Research Series.*
