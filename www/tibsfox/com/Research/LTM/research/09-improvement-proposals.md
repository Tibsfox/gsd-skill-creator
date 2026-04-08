# Improvement Proposals: Evolving Our Memory Architecture

**Module:** LTM-09
**Status:** Bridge document — research to implementation
**Author:** gsd-phase-researcher (Artemis II mission, Day 9)
**Date:** 2026-04-08
**Prior modules cited:** 01 (BEAM), 02 (Cognee), 03 (Memori), 04 (Zep/Graphiti), 05 (LangMem), 06 (LongMemEval), 07 (RAM disk deep dive), 08 (custom benchmark)

---

## Preamble: Where We Stand

Our current memory subsystem in gsd-skill-creator is a 6-tier Level-of-Detail (LOD) cache spanning RAM, an in-process index, flat markdown files, ChromaDB (HNSW vector store), PostgreSQL (session + turn history + pgvector), and an on-disk corpus mirror. It is 5,087 lines of TypeScript, 167 passing tests, and has been running in production against 129 sessions and 16,928 turns. The measured scores on public benchmarks are strong in isolation — LongMemEval R@5 96.6 percent, R@10 98.2 percent, ConvoMem 92.0 percent, MemBench 84.0 percent — but weak on the benchmark that matters most to us: LoCoMo at 60.3 percent.

The 20-point LoCoMo gap is not noise. LoCoMo stresses multi-session temporal reasoning, multi-hop linkage across conversations, and implicit reference resolution. Those are the same capabilities that Memori (81.95 percent), Zep (79.09 percent), and Cognee (0.93 on HotPotQA) have been engineering explicitly. Our current architecture retrieves passages well but does not *reason* across them. This module proposes a concrete sequence of upgrades to close that gap, grounded in what the other nine modules in this mission established.

The proposals below are not a menu. They are a build plan. Two of them — Proposal A (persistent RAM-disk working layer) and Proposal F (continuous benchmark feedback loop) — are prerequisites that must land before anything else. Without A, the latency budget for the richer retrievers in B, C, D, and G will blow out. Without F, we cannot tell which proposal helped and which regressed us, and the 20-point LoCoMo gap will stay a rumor instead of becoming a burndown chart.

This module is deliberately concrete. Every proposal has a sizing estimate, a risk register, a success metric, and a dependency list. Read it as a backlog.

---

## Proposal A: Persistent RAM Disk Working Layer

### What

Mount `/dev/shm/gsd-memory-working` as a 4 GB tmpfs-backed working layer that holds the hottest state in the memory subsystem: the current session's rolling window, the Chroma HNSW graph, the hybrid scorer cache, the most recent 200 turns across all sessions, and the scratchpad facts from Proposal D. Start at 4 GB, grow in 4 GB chunks as pressure increases, cap at 16 GB to leave headroom on the 45.7 GB available system RAM. Every write goes to tmpfs synchronously; a background flusher mirrors dirty pages to the on-disk canonical store during idle windows (no active query for more than 1,500 ms). On startup, rehydrate from the on-disk mirror in under 800 ms. On graceful shutdown, flush everything. On crash, rehydrate from the on-disk mirror — data is never canonical *only* in tmpfs.

### Why

Module 07 measured cold-start p95 latency on our current setup at 480 ms for the full retrieval pipeline against a warm pagecache, and 2,100 ms against a cold cache (after `echo 3 > /proc/sys/vm/drop_caches`). That is already borderline for interactive use. When we layer on the graph walks from Proposal C and the triple lookups from Proposal B, the cold-cache path will exceed 5 seconds. Every SOTA memory system in Modules 01 through 06 assumes its hot indexes live in RAM — Memori caches its triple index, Zep keeps Graphiti nodes in memory, Cognee batches graph reads into a single pass. We have the RAM. We have the tmpfs. We are not using either deliberately.

Module 07 also flagged a second motivation: `/dev/shm` is process-visible to any future sidecar (Rust, Python benchmark harness, or a second Node worker for embedding batch jobs). A tmpfs working layer becomes a shared-memory IPC channel for free. This matters for Proposal F, which needs to read live retrieval state without touching the Node event loop.

### How

- **New module:** `src/memory/working-layer.ts` — thin wrapper around `fs.promises` targeting `/dev/shm/gsd-memory-working`, with atomic rename-on-write, mtime tracking, and a background flusher.
- **New module:** `src/memory/working-layer-flusher.ts` — idle detection, dirty-set coalescing, write to on-disk mirror under `~/.gsd/memory/mirror/`.
- **Modified:** `src/memory/service.ts` — replace direct Chroma file paths with working-layer paths, wire shutdown hook to `flushAll()`.
- **Modified:** `src/memory/chroma-client.ts` — accept a configurable data directory, default to working layer.
- **New binary:** `scripts/memory-warmup.mjs` — runs on `npm run dev` or on Tauri window-created event, rehydrates tmpfs from mirror.
- **Key APIs:** `WorkingLayer.read(key)`, `WorkingLayer.write(key, bytes)`, `WorkingLayer.flush()`, `WorkingLayer.rehydrate()`, `WorkingLayer.pressure()` returning `{ usedBytes, capBytes, dirtyBytes }`.

### Size

Roughly 650 lines TypeScript plus 200 lines tests. Complexity: **medium** — the tricky part is the idle detector and the dirty-set coalescer, both of which need fuzz tests against SIGKILL scenarios.

### Risk

- tmpfs is RAM. If we forget to flush and the box loses power, data loss is possible. Mitigation: canonical store is always the on-disk mirror, and the flusher runs on a 30-second ceiling regardless of idle state.
- Chroma's SQLite metadata file does not tolerate mid-write truncation. We need to flush via a two-phase commit (write to `.tmp`, fsync, rename) or use Chroma's native snapshot API if it exists.
- If multiple Tauri windows spawn multiple Node workers, they all contend on the same tmpfs files. File locking via `proper-lockfile` is required.

### Success metric

- Cold-start p95 drops from 2,100 ms to under 400 ms.
- Warm p95 drops from 480 ms to under 180 ms.
- No data loss across 1,000 simulated SIGKILL cycles in CI.
- Measured by Proposal F's benchmark harness, latency panel.

### Priority

**H — PREREQUISITE.** Everything that follows assumes hot state lives in RAM. Without this, Proposals B, C, D, G, and H hit disk on every request and their latency budgets are unfundable.

### Dependencies

None. This is foundational.

---

## Proposal B: Semantic Triples Layer (Memori-Inspired)

### What

Add a dedicated subject-predicate-object triple extraction pipeline that runs on every inbound turn (both user and assistant). Extract triples with a small, fast local model (LLaMA-3.2-3B via llama.cpp, or a distilled entity extractor — Module 03 benchmarked both). Store the triples in a new PostgreSQL table `memory_triples` with columns `(id, session_id, turn_id, subject, predicate, object, confidence, extracted_at, source_hash)` plus GIN indexes on subject, predicate, and object. At retrieval time, parse the query for candidate entities, look up triples whose subject or object matches, and boost the hybrid scorer with a triple-match signal weighted at 0.35 (tunable via Proposal F). Surface triples directly in the prompt as structured facts alongside the top-k retrieved passages.

### Why

Module 03 showed that Memori's 81.95 percent LoCoMo score (versus Mem0's 62 percent) is driven almost entirely by the semantic triples layer. Memori extracts triples at write time, not at query time, which means the expensive LLM call happens once per turn instead of once per query. That matches our workload exactly: we write turns at roughly 40 per minute during active sessions and query at a much higher rate. Module 03 also showed that Memori's triple extraction achieves a 95 percent token reduction in the final context window compared to passing raw turn history, because a triple is 15 tokens and the turn that produced it is 300.

Our LoCoMo gap (60.3 percent versus Memori's 81.95) is almost certainly dominated by multi-session entity resolution — "what did I say about Foxy's background three weeks ago" requires linking entities across sessions, and a vector search alone cannot do that reliably. Triples make entity linkage a primary key lookup.

### How

- **New module:** `src/memory/triple-extractor.ts` — wraps a llama.cpp sidecar or an HTTP call to a local Ollama instance, runs a structured-output prompt, parses the JSON triples, validates, deduplicates.
- **New module:** `src/memory/triple-store.ts` — thin layer over PostgreSQL, implements `insert(triple)`, `lookupBySubject(entity)`, `lookupByObject(entity)`, `lookupByPredicate(pred)`, `recentForSession(sessionId, limit)`.
- **Migration:** `migrations/20260408_add_memory_triples.sql` — create table, indexes, and the `pg_trgm` fuzzy-match index on subject and object text columns.
- **Modified:** `src/memory/service.ts` — call extractor on every turn write, call store on every retrieve, merge triple-match into hybrid scorer.
- **Modified:** `src/memory/hybrid-scorer.ts` — add `tripleMatch` as a sixth signal, see Proposal G for the rescored formula.
- **Key APIs:** `TripleExtractor.extract(turnText, context)`, `TripleStore.lookup(entities)`, `TripleStore.backfill(sessionId)` for the 129 existing sessions.

### Size

Roughly 1,100 lines TypeScript, 400 lines tests, 80 lines SQL migration. Complexity: **high** — the extractor prompt needs iteration, deduplication across sessions is non-trivial, and the backfill pass against 16,928 existing turns will take several hours on our single GPU.

### Risk

- Triple extraction quality depends on the small model. Module 03 noted that LLaMA-3.2-3B produces noisy predicates ("thinks-about", "is-related-to") that dilute the index. We need a predicate whitelist or a canonicalization step.
- Backfilling 16,928 turns is a one-shot operation; if it fails halfway we need resumability. Store a `backfill_cursor` row and chunk the job.
- Entity resolution across sessions will mis-merge homonyms ("Cedar" the muse versus "cedar" the tree). Start with case-sensitive exact match, add coreference later.

### Success metric

- LoCoMo score rises from 60.3 to at least 75 percent (halfway to Memori).
- Custom benchmark (Proposal F) multi-session category rises by 15 points.
- Token efficiency: average prompt context bytes for retrieval-augmented generation drops by 40 percent.

### Priority

**H.** This is the single biggest lever for the LoCoMo gap.

### Dependencies

Proposal A (RAM disk, for the triple index cache) and Proposal F (benchmark, to prove the gain is real).

---

## Proposal C: Graph Layer (Cognee-Inspired)

### What

Add an explicit entity-relation graph alongside our vector store. Nodes are entities (people, projects, files, concepts) extracted from triples. Edges are predicates. Store the graph in Kuzu — an embedded graph database with a Cypher-like query language and zero operational overhead (Module 02 evaluated Neo4j, Memgraph, Kuzu, and PostgreSQL AGE; Kuzu won on embeddability and query performance for our scale). Implement a Chain-of-Thought graph-completion retriever: given a query, expand entities one hop, two hops, and three hops, score each path by semantic similarity to the query plus inverse hop distance, return the best paths as structured evidence alongside the vector results.

### Why

Module 02 showed Cognee's CoT graph-completion retriever hitting 0.93 on HotPotQA, a multi-hop benchmark where pure vector retrieval tops out around 0.65. Multi-hop is exactly where our LoCoMo score bleeds. When the user asks "what did Foxy say about the muse team after the Artemis launch," the answer requires linking (Foxy, muse-team) through the (Artemis, launch, date) node to sessions that happened after that date. A vector search will find one or the other half, never both. A one-hop graph walk from the Foxy node through the muse-team node to session entities gives the full context in a single query.

Module 02 also made the case against running a full graph DBMS. We are not Neo4j's target scale. Kuzu is embedded, ships as a single `.so`, and has a published MIT license. It sits on disk alongside our Chroma store and the working layer from Proposal A caches its buffer pool.

### How

- **New dependency:** `kuzu` npm package (bindings to the embedded engine).
- **New module:** `src/memory/graph-store.ts` — wraps Kuzu, implements `upsertNode(entity)`, `upsertEdge(subj, pred, obj)`, `expand(entity, hops)`, `shortestPath(a, b)`.
- **New module:** `src/memory/graph-retriever.ts` — the CoT graph-completion logic. Parse query entities, do a budgeted BFS to depth 3, score paths, return top-k paths as structured JSON.
- **New module:** `src/memory/graph-ingest.ts` — subscribes to triple-store writes (Proposal B) and upserts nodes and edges. Triples are the source of truth; the graph is a derived index.
- **Modified:** `src/memory/service.ts` — add a `graphRoute` path alongside `vectorRoute`, merged by the router in Proposal I.
- **Key APIs:** `GraphRetriever.walk(query, { maxHops: 3, budget: 500 })`, returning `{ paths: Path[], entities: Entity[], cost: number }`.

### Size

Roughly 1,400 lines TypeScript, 500 lines tests, plus Kuzu schema DDL. Complexity: **high** — graph retrievers are notoriously finicky about path-explosion, and we need a budgeted walk with early termination.

### Risk

- Kuzu is a younger project than Neo4j. API stability and bug exposure are higher. Mitigation: pin the version, keep the graph as a *derived* index rehydratable from triples, so a Kuzu data corruption is a rebuild, not a data loss.
- Path explosion at depth 3 will blow the latency budget unless we cap fan-out. Implement a soft cap of 500 nodes visited per query.
- The graph is populated *from* triples, so Proposal B must land first and be well-calibrated. Garbage-in triples produce a garbage graph.

### Success metric

- Multi-hop category on Proposal F benchmark rises from current (untested — estimated 45 percent) to 80 percent.
- HotPotQA smoke suite (we maintain a 200-question slice) rises from 0.62 to 0.85.
- Graph walk p95 under 250 ms with budget 500.

### Priority

**M-H.** Huge upside, but gated on Proposal B being stable first. Start design in parallel, land after B.

### Dependencies

Proposal A (RAM disk for Kuzu buffer pool), Proposal B (triples as source), Proposal F (benchmark).

---

## Proposal D: LIGHT-Style Working Memory + Scratchpad (BEAM-Inspired)

### What

Restructure the retrieval context into three explicit layers: **working memory** (the last N turns verbatim, default N=20), **scratchpad** (LLM-compressed facts extracted from turns older than N but within the current session, refreshed every 10 turns), and **episodic** (the full retrieval pipeline — vector plus triple plus graph, covering everything older or in other sessions). Expose these as distinct slots in the prompt template so the model knows their provenance and recency. Integrate into `src/memory/service.ts` as the top-level orchestrator.

### Why

Module 01 benchmarked BEAM's LIGHT framework against flat retrieval on ten memory-ability axes. The structured working memory plus scratchpad configuration produced a 3.5 to 12.7 percent gain across the board, with the biggest wins on temporal reasoning and implicit reference resolution — our two weakest categories. The reason is cognitive load management: a flat context of 50 retrieved chunks forces the model to rediscover what is recent and what is referenced. Splitting the context tells the model "these 20 turns are *now*, these 5 facts are *within this session*, these 10 passages are *everything else*."

BEAM also showed that scratchpad compression — running a cheap LLM to summarize older in-session turns into bullet points — preserves 94 percent of the answerable questions while using 18 percent of the tokens. That is leverage we are not currently using.

### How

- **New module:** `src/memory/working-memory.ts` — holds the last N turns in the RAM working layer from Proposal A. Circular buffer per session.
- **New module:** `src/memory/scratchpad.ts` — compresses turns N+1 through session-end into bullet-point facts every 10 turns. Uses a small local LLM.
- **Modified:** `src/memory/service.ts` — becomes an orchestrator that assembles `{ working, scratchpad, episodic }` slots and returns a structured object, not a flat string.
- **Modified:** `src/prompt/templates.ts` — prompt templates get three explicit sections with headers.
- **Key APIs:** `WorkingMemory.get(sessionId, n)`, `Scratchpad.refresh(sessionId)`, `MemoryService.assembleContext(query, sessionId)` returning `{ working, scratchpad, episodic, sources }`.

### Size

Roughly 550 lines TypeScript, 200 lines tests. Complexity: **medium** — the hard part is the scratchpad refresh cadence and the compression prompt.

### Risk

- Scratchpad compression can drop a load-bearing detail. Mitigation: never delete source turns, always keep the episodic layer as the ground truth.
- Prompt restructure affects every downstream consumer. Roll out behind a feature flag and A/B test.
- LLM compression cost. Mitigate by running on a small local model only (LLaMA-3.2-3B).

### Success metric

- BEAM axes average gain of at least 5 percent (versus published 3.5-12.7 percent range).
- Temporal reasoning subscore rises by 10 points on Proposal F benchmark.
- Prompt assembly p95 under 120 ms.

### Priority

**H.** High value, moderate effort, no external dependencies beyond A.

### Dependencies

Proposal A (working memory lives in RAM disk), Proposal F (benchmark to verify gain).

---

## Proposal E: Conversation Summarization Loop (Memori-Inspired)

### What

Maintain an evolving conversation summary per session, updated on every turn. The summary is a compact narrative (300-500 tokens) that captures the arc of the conversation: what has been discussed, what decisions were made, what is unresolved. Link triples from Proposal B back to the summary via a `source_summary_id` foreign key, so when we retrieve a triple we can surface its narrative context. Use an incremental update prompt — "here is the previous summary, here is the new turn, update the summary" — rather than a full re-summarization, to keep cost bounded.

### Why

Module 03's deep dive on Memori described the summarization loop as the second half of the dual-layer design: triples capture the *atoms* of knowledge, summaries capture the *story*. Memori's 81.95 percent LoCoMo score came from both working together — triples alone scored 71 percent in Memori's ablation, triples plus summaries scored 81.95 percent. The summary provides the model with the *why* behind a triple, which is what resolves implicit references like "that thing we decided yesterday."

Module 03 also highlighted the token efficiency story. Memori's summaries replaced multi-thousand-token raw history with a 400-token narrative plus 10-20 targeted triples. That is a 10x context compression with *improved* answer quality.

### How

- **New module:** `src/memory/summarizer.ts` — incremental summary update, caches previous summary in the working layer, runs a local LLM call on every Nth turn (N=1 for slow conversations, N=3 for fast ones — adaptive).
- **Migration:** `migrations/20260408_add_session_summaries.sql` — add `summary_text`, `summary_version`, `updated_at` columns to `sessions` table.
- **Modified:** `src/memory/triple-store.ts` — add `source_summary_id` foreign key on `memory_triples`.
- **Modified:** `src/memory/service.ts` — include the current session summary in the assembled context from Proposal D as part of the scratchpad slot.
- **Key APIs:** `Summarizer.update(sessionId, newTurn)`, `Summarizer.get(sessionId)`, `Summarizer.backfill(sessionIds)`.

### Size

Roughly 450 lines TypeScript, 150 lines tests, 30 lines SQL. Complexity: **low-medium** — mostly prompt engineering and cost accounting.

### Risk

- Summary drift — incremental updates can hallucinate or forget details. Mitigation: every 20 turns, do a full re-summarization from scratch as a checkpoint.
- LLM cost. Mitigate with local model only.
- Backfilling summaries for 129 existing sessions will take hours. Run once, cache forever.

### Success metric

- LoCoMo score gains an additional 3-5 points on top of Proposal B (target combined B+E: 80 percent).
- Average context size in retrieval-augmented generation drops by another 30 percent versus B alone.

### Priority

**M-H.** Pairs with B. Land immediately after B.

### Dependencies

Proposal B (triples reference summaries), Proposal A (summary cache), Proposal F (benchmark).

---

## Proposal F: Continuous Benchmark Feedback Loop

### What

Every change to any file under `src/memory/` triggers our custom benchmark harness (defined in Module 08) as a GitHub Actions workflow on PR. The harness runs the full 10-ability BEAM suite plus a 200-question LoCoMo slice plus the HotPotQA smoke suite against the PR branch, compares the results to the main branch baseline stored in `.planning/memory-benchmark-baseline.json`, and posts a comment to the PR with a regression table. Any ability that regresses by more than 2 percent (absolute) fails the PR check. A dashboard at `www/tibsfox/com/Research/LTM/benchmarks/index.html` visualizes the 10 BEAM scores plus the LoCoMo aggregate over time, updated on every merge to main.

### Why

Module 08 argued that the single biggest failure mode of memory system research is that researchers report one number (LongMemEval R@5, say) and silently regress on another (LoCoMo multi-hop). Our 60.3 percent LoCoMo gap is almost certainly the product of years of optimizing the signals we measured and not the ones we did not. The only cure is to measure everything on every change, all the time, and refuse to merge anything that regresses.

The gains from Proposals B, C, D, and E are predicted based on reading other teams' papers. We have no a priori guarantee any of them will work on our data. The benchmark loop is how we find out — cheaply, automatically, and before the code ships to main.

Module 08 also proposed the 10 ability axes (chosen to align with BEAM plus three of our own: temporal drift, session bridge, and implicit reference). Those become the columns of the dashboard. The rows are git commits. Seeing the 10-column line chart rise over six months is the point of this entire mission.

### How

- **New script:** `scripts/run-memory-benchmark.mjs` — orchestrates the benchmark. Loads the 10 ability suites from `benchmarks/memory/`, runs each against the memory service, writes results to `benchmark-results/<sha>.json`.
- **New workflow:** `.github/workflows/memory-benchmark.yml` — triggers on PRs touching `src/memory/**`, runs the benchmark, posts a comment, fails on regression.
- **New file:** `.planning/memory-benchmark-baseline.json` — checked into the repo, updated by a separate workflow on merge to main.
- **New dashboard:** `www/tibsfox/com/Research/LTM/benchmarks/index.html` — static page, reads `benchmark-results/*.json`, renders 10 line charts plus a LoCoMo aggregate.
- **New benchmark suites:** 10 files under `benchmarks/memory/ability-*.json` — question sets plus golden answers.
- **Key APIs:** `Benchmark.run(suiteId, memoryService)`, `Benchmark.compare(current, baseline)`, `Benchmark.regressionReport(diff)`.

### Size

Roughly 900 lines JavaScript (the runner), 300 lines workflow YAML, 400 lines dashboard HTML/JS, plus the benchmark suites themselves (Module 08 sized them at roughly 2,000 questions total, stored as JSON). Complexity: **medium** — the hard part is making the runner reproducible across runs.

### Risk

- Benchmark flakiness from LLM sampling. Mitigation: pin temperature to 0, seed randomness, run each question 3 times and take majority vote.
- Benchmark takes too long for PR gate. Mitigate with a fast suite (200 questions, runs in 5 minutes) for PRs and a full suite (2,000 questions, runs nightly) for regression detection.
- Baseline drift — if we update the baseline casually, regressions go undetected. Require a human reviewer for every baseline update.

### Success metric

- 100 percent of PRs touching `src/memory/` run the benchmark.
- Zero undetected regressions over any 4-week window.
- Dashboard goes green and stays green — rising on 8 of 10 axes over 3 months.

### Priority

**H — PREREQUISITE.** Nothing else in this document matters if we cannot tell whether it worked.

### Dependencies

None. This is the second foundation stone alongside Proposal A.

---

## Proposal G: Hybrid Scorer v2

### What

Extend the current 5-signal hybrid reranker (BM25, dense cosine, recency decay, session boost, corpus-tier weight) with five new signals: triple match (Proposal B), graph hop distance (Proposal C), summary cosine similarity (Proposal E), session recency decay with a tuned half-life, and a user preference signal (up-weight sources the user has interacted with). Calibrate the 10 signal weights via grid search against the Proposal F benchmark. Retire the hand-tuned weights; store the learned weights in `.planning/hybrid-scorer-weights.json`.

### Why

Module 06's LongMemEval analysis revealed that our current 5-signal scorer plateaus around 85 percent R@5 on most subsets but drops to 58 percent on the temporal-reasoning subset because recency decay is a single exponential with a hand-tuned half-life of 72 hours. Different question types want different half-lives. A grid search plus a benchmark loop lets us find them empirically.

Module 02's Cognee write-up also showed that graph hop distance is a stronger proximity signal than vector cosine for multi-hop questions — first-hop neighbors beat cosine-nearest-but-unlinked passages by 14 points. We need that signal in the mix.

### How

- **Modified:** `src/memory/hybrid-scorer.ts` — accept 10 signals, weights loaded from JSON, configurable scoring function (linear combination with optional sigmoid normalization).
- **New module:** `src/memory/scorer-calibrator.ts` — grid search over weight space, uses Proposal F benchmark as the objective function. Runs offline via `scripts/calibrate-scorer.mjs`.
- **New file:** `.planning/hybrid-scorer-weights.json` — the calibrated weights, versioned.
- **Key APIs:** `HybridScorer.score(candidate, query, signals)`, `Calibrator.search(suites, gridSize)`, `Calibrator.optimize()` returning the best weight vector.

### Size

Roughly 600 lines TypeScript, 250 lines tests. Complexity: **medium** — the grid search is mechanical but needs to parallelize across cores to finish in under an hour.

### Risk

- Overfitting the weights to the benchmark. Mitigation: hold out 20 percent of the benchmark as a validation set, only report final numbers on the held-out set.
- Weight drift across benchmark versions. Mitigation: re-calibrate after every benchmark suite update.

### Success metric

- Average gain of 4 percent across all 10 BEAM abilities after calibration.
- No regression on any single axis by more than 1 percent.

### Priority

**M.** Depends on B and C for the new signals. Land after C.

### Dependencies

Proposals B, C, E (provide the new signals), F (calibration objective).

---

## Proposal H: Precomputed Retrieval Index in RAM

### What

On service startup, preload the Chroma HNSW index, the triple-store GIN indexes, the Kuzu graph buffer pool, and the session summaries into the RAM-disk working layer from Proposal A. Keep them hot via a background warmer that touches them every 30 seconds. Eliminate the cold-start penalty for the first query after startup. Measure p50 and p95 improvement on Proposal F.

### Why

Module 07 measured that 90 percent of our cold-start latency comes from Chroma's HNSW graph rehydration (180 MB for our current vector count) and the SQLite page cache for session metadata. Both of those live on disk in our current setup and hit the disk on the first query of any session. Module 07 proved that preloading them into tmpfs cuts that to 30 ms.

This is the simplest performance win in the document. It is gated only on Proposal A existing.

### How

- **Modified:** `src/memory/service.ts` — on construct, call `WorkingLayer.rehydrate()` and warm each index.
- **New module:** `src/memory/index-warmer.ts` — background interval timer, touches each index to keep pages resident.
- **Key APIs:** `IndexWarmer.start()`, `IndexWarmer.stop()`, `IndexWarmer.pressureReport()`.

### Size

Roughly 200 lines TypeScript, 80 lines tests. Complexity: **low**.

### Risk

- RAM pressure if we preload too much. Mitigate with the 16 GB working-layer cap from Proposal A.
- Background timer leaks. Mitigate with a shutdown hook.

### Success metric

- Cold-start p95 under 200 ms (down from 2,100 ms).
- Warm-steady p95 under 100 ms (down from 480 ms).
- No increase in resident-set size beyond the working-layer cap.

### Priority

**M-H.** Low effort, high user-visible impact.

### Dependencies

Proposal A.

---

## Proposal I: Context-Aware Retrieval Routing

### What

Classify inbound queries into four types: **single-hop semantic**, **multi-hop relational**, **temporal**, and **implicit-reference**. Route each to the best-suited retrieval path: single-hop to the vector store, multi-hop to the graph walker (Proposal C), temporal to a time-indexed slice of the triple store, implicit-reference to the summary plus working memory (Proposal D and E). Train a small logistic classifier on the Proposal F benchmark questions as training data. Fall back to running all routes in parallel and merging via Proposal G's scorer when confidence is low.

### Why

Module 01's BEAM ability taxonomy made it clear that different questions want different mechanisms. Module 06's LongMemEval ablation showed that forcing one retriever to handle all question types leaves 12-18 points on the table per type. A router is how we recover those points. The classifier can be tiny (logistic regression on TF-IDF features plus a few hand-crafted signals like question-word presence) and ship as a 50 KB weights file.

### How

- **New module:** `src/memory/query-classifier.ts` — loads weights, classifies incoming queries, returns `{ type, confidence }`.
- **New module:** `src/memory/retrieval-router.ts` — dispatches to the appropriate retriever based on classifier output, merges with the parallel fallback when confidence is below 0.7.
- **New script:** `scripts/train-query-classifier.mjs` — trains on the benchmark, writes weights to `.planning/query-classifier-weights.json`.
- **Modified:** `src/memory/service.ts` — replace the hardcoded retrieval pipeline with a call to `RetrievalRouter.dispatch(query)`.
- **Key APIs:** `QueryClassifier.classify(query)`, `RetrievalRouter.dispatch(query, sessionId)`.

### Size

Roughly 450 lines TypeScript, 150 lines tests, 120 lines training script. Complexity: **medium**.

### Risk

- Classifier mispredictions send queries to the wrong retriever. Mitigation: the parallel fallback catches low-confidence cases.
- Training data bias — the benchmark questions may not represent real user queries. Mitigation: retrain quarterly on real query logs (anonymized).

### Success metric

- Per-type accuracy gains: multi-hop +8 percent, temporal +6 percent, implicit +5 percent.
- Routing overhead under 10 ms p95.

### Priority

**M.** Pays off once B, C, D, and E are in place.

### Dependencies

Proposals B, C, D, E, F.

---

## Proposal J: Compression and Decay

### What

Older memories get LLM-compressed into increasingly terse forms over time, but never deleted (aligned with the standing user policy: "never delete, only archive"). Keep full-resolution for turns within the last 7 days. At 7-30 days, keep the turn plus its extracted triples but drop non-essential metadata. At 30-180 days, keep a per-session summary plus the triples. At 180+ days, keep a terse narrative digest plus the triples. Triples are *always* preserved at full fidelity because they are cheap. The full original turn is always retrievable from PostgreSQL's cold tier; the compression only affects what lives in the hot layers.

### Why

Module 07's capacity analysis showed that at 16,928 turns and our current growth rate of 40 turns per minute during active sessions, we will hit 100,000 turns within 6-9 months. The Chroma vector store will still fit, but the retrieval quality degrades as the haystack grows and the working-layer RAM pressure increases. Hierarchical temporal resolution is the standard answer from the biological memory literature and Module 04's Zep/Graphiti writeup described the same pattern.

The key insight from Module 03 is that triples compress beautifully. A 400-token turn produces roughly 3-5 triples at 15 tokens each. That is a 5-8x compression with minimal quality loss, because the triples carry the facts and the narrative is reconstructable from them.

### How

- **New module:** `src/memory/compressor.ts` — scheduled job that walks turns older than 7 days, runs the compression prompt, writes the compressed form to a new `memory_compressed` table.
- **New module:** `src/memory/decay-scheduler.ts` — cron-like job runs nightly, moves turns between tiers.
- **Migration:** `migrations/20260408_add_memory_compressed.sql` — new table with `original_turn_id`, `tier`, `compressed_text`, `compressed_at`.
- **Modified:** `src/memory/service.ts` — retrieval looks up compressed form first, falls back to full text only when the scorer requests high-fidelity context.
- **Key APIs:** `Compressor.compress(turnId, targetTier)`, `DecayScheduler.run()`.

### Size

Roughly 700 lines TypeScript, 250 lines tests, 40 lines SQL. Complexity: **medium**.

### Risk

- Compression loss — the compressed form may drop a detail the user later needs. Mitigation: the full original is always in PostgreSQL cold tier, retrievable by ID. Compression only affects the hot path.
- Cost of nightly recompression of 100,000 turns. Mitigate: only compress new arrivals, never recompress.

### Success metric

- Working-layer RAM footprint stays under 16 GB at 100,000-turn scale.
- Retrieval quality on 180+ day questions stays within 3 percent of 7-day-or-newer questions.

### Priority

**L-M.** Only becomes critical at 50,000+ turns. Land in Q3.

### Dependencies

Proposals A, B, E.

---

## Prioritized Sequence and Build Plan

The ten proposals cluster into four phases. The ordering below respects dependencies and maximizes measurable progress per phase. Every phase ends with a benchmark run and a dashboard snapshot.

### Phase 0 — Foundations (weeks 1-2)

| # | Proposal | Why first |
|---|---|---|
| 1 | **A — RAM disk working layer** | Everything else assumes hot state is in RAM |
| 2 | **F — Continuous benchmark feedback loop** | Nothing else can be measured without it |

**Exit criteria:** benchmark runs on every PR, cold-start p95 under 400 ms, baseline snapshot captured.

### Phase 1 — Semantic Layer (weeks 3-6)

| # | Proposal | Why second |
|---|---|---|
| 3 | **B — Semantic triples layer** | Biggest LoCoMo lever |
| 4 | **E — Conversation summarization loop** | Pairs with B, small incremental cost |
| 5 | **D — LIGHT working memory plus scratchpad** | Structural win independent of B/E |
| 6 | **H — Precomputed index in RAM** | Trivial once A lands, visible latency win |

**Exit criteria:** LoCoMo rises from 60.3 to 78+. BEAM axes average +5 percent. Cold-start p95 under 200 ms.

### Phase 2 — Graph Layer (weeks 7-10)

| # | Proposal | Why third |
|---|---|---|
| 7 | **C — Graph layer (Kuzu + CoT retriever)** | Unlocks multi-hop, depends on B |
| 8 | **G — Hybrid scorer v2** | Needs C's signal to be worth the effort |
| 9 | **I — Context-aware retrieval routing** | Ties all four retrievers together |

**Exit criteria:** Multi-hop category rises from 45 to 80 percent. LoCoMo rises to 82+. HotPotQA smoke suite rises to 0.85.

### Phase 3 — Scale and Maintenance (weeks 11-14)

| # | Proposal | Why last |
|---|---|---|
| 10 | **J — Compression and decay** | Only needed at 50,000+ turn scale |

**Exit criteria:** Working layer stays under 16 GB at projected 100K-turn scale. Retrieval quality degradation under 3 percent for 180-day-old queries.

---

## Closing

This module is the bridge from research to implementation and the research is done. The LongMemEval, LoCoMo, HotPotQA, BEAM, Cognee, Memori, Zep, and LangMem findings all point in the same direction: structured memory — triples, graphs, summaries, working windows — beats flat retrieval by 15 to 20 percentage points on the benchmarks that matter. Our 60.3 percent LoCoMo is not a floor; it is the starting line for a burndown chart that has 20 points of upside if we execute the backlog above in order.

Two things must land before anything else. Proposal A gives us the latency budget to afford richer retrievers. Proposal F gives us the feedback loop to verify each change helps. Everything else slots in behind those two foundations.

The 5,087 lines of existing memory code are not thrown away. They become the substrate. Proposals B through J extend them, never replace them. The 167 passing tests stay green. The 129 sessions and 16,928 turns migrate forward via backfill jobs. This is a graft, not a rewrite.

When this backlog is done — conservatively, 14 weeks of focused work — gsd-skill-creator's memory subsystem will match or exceed published SOTA on LoCoMo, stay best-in-class on LongMemEval, and run entirely on local hardware with no cloud dependency. That is a research artifact worth publishing. It is also, more importantly, a memory system that will remember *you* correctly across the next thousand sessions.

Build the foundations. Measure everything. Ship the layers in order.

---

**Module LTM-09 complete.** Next module: LTM-10, implementation kickoff (phases, tasks, wave plan).
