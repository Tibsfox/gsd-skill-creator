# Mem0: Architecture & Research Position

**Research Module:** LTM Research Series, Module 02
**Status:** Primary-source technical review, unbiased
**Date:** 2026-04-08
**Author:** gsd-skill-creator LTM research mission
**Subject:** Mem0 — open-source memory layer for LLM applications
**Purpose:** Identify what to adopt and what to avoid for our own long-term memory system

---

## 1. Executive Position

Mem0 is the most widely-adopted open-source memory layer for LLM applications, with strong developer ergonomics, a clean API surface, and a well-written ECAI-accepted paper. It is also the memory system that most visibly underperforms independent benchmarks relative to its own marketing. This module measures both sides honestly.

The short version: Mem0 is a **fact-extraction-and-dedup** system dressed as a memory system. It extracts "facts" from conversations using an LLM, compares them against stored vectors, and asks another LLM to emit one of four operations (ADD / UPDATE / DELETE / NOOP). That loop is the entire core. Everything else — hosted platform, graph variant, multi-tenant dashboards, observability — is scaffolding around that loop.

This architecture is simple, composable, and easy to integrate in five minutes. It is also the reason Mem0 struggles on any benchmark that rewards temporal precision, multi-hop reasoning, or contradiction handling under adversarial conditions. The loop was not designed to track time, reconcile causally-linked claims, or reason over relationships. The graph variant (Mem0ᵍ) adds ~2% over the base system, which tells us the authors know this is a gap and are patching it rather than re-architecting.

**For our LTM system we should adopt:** the clean four-operation CRUD surface, the layered scoping model (user / session / agent), the metadata filter contract, and the developer ergonomics. **We should avoid:** treating fact extraction as the foundation, letting LLMs decide conflict resolution without a verifier, hiding temporal state inside prose, and confusing "compression" with "understanding." These are substantively different problems and Mem0 conflates them.

---

## 2. The Architecture, As It Actually Is

### 2.1 The Two-Phase Pipeline

Every memory.add() call in Mem0 runs through two LLM-backed phases. This is documented in the paper ("Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory," Chhikara et al., arXiv:2504.19413) and confirmed in the open-source source tree.

**Phase 1 — Extraction.** A prompt template is filled with the most recent conversation turns and sent to an extraction LLM. By default this is `gpt-4.1-nano-2025-04-14`, chosen for cost, though any OpenAI-compatible model can be swapped in via config. The model is asked to return a JSON object with a `facts` array. Each fact is a short declarative string — "User prefers dark mode," "User's dog is named Otter," "Meeting scheduled for Thursday at 3pm."

**Phase 2 — Update.** For each extracted fact, Mem0 runs a vector similarity search against the existing memory store (scoped by `user_id` / `session_id` / `run_id`). The top-K similar memories (typically K=5) are passed together with the new fact into a second LLM call. This second prompt asks the model to emit a tool call naming one of four operations:

- **ADD** — the fact is new, store it
- **UPDATE** — the fact supersedes a specific existing memory (the model must name the memory ID)
- **DELETE** — the fact contradicts and invalidates a specific existing memory
- **NONE** — the fact is already captured, do nothing

The emitted operation is then applied to the vector store (and the graph, if Graph Memory is enabled). This two-phase design is the pipeline's central idea. Everything in the Mem0 codebase that touches memory construction is, at bottom, either feeding this pipeline or reading its outputs.

### 2.2 Storage Layer

Mem0 is pluggable at the storage layer. The primary vector store is **Qdrant** (the default, used in docs and tutorials) but the OSS package ships adapters for Chroma, Weaviate, Pinecone, Milvus, pgvector, FAISS, and several others. Each adapter implements a narrow interface: upsert, delete, similarity search with metadata filters. The ordering of what gets surfaced from a search is left to the vector store's native ranking plus Mem0's metadata scoping — there is no learned reranker in the base path (a reranker is optionally configurable).

Embeddings are produced by an **embedding model** also pluggable via config, with `text-embedding-3-small` as the OpenAI default. Each extracted fact becomes one vector — not each conversation turn, not each session, but each atomized fact string. This is a critical architectural commitment: **Mem0 trades raw recall fidelity for compression**. Once a fact is extracted the original conversation context is discarded from the retrieval path. You cannot "zoom out" from a fact to the turn it came from unless you explicitly store a pointer via metadata.

### 2.3 Memory Scoping

Mem0 uses three scope identifiers attached as metadata to every memory:

- **`user_id`** — long-term, persists across sessions. The "who is this memory about."
- **`session_id`** — short-term, conversation-scoped. Cleaned up on session end if configured.
- **`run_id`** / **`agent_id`** — system-state for a particular agent or execution.

Search operations accept these as filters, and the default search strategy ranks user-scope memories ahead of session and agent memories. The documentation calls this a "layered retrieval" model but structurally it is flat metadata with a ranking preference; there is no separate data path per layer.

### 2.4 Graph Memory Variant (Mem0ᵍ)

The Graph Memory variant ships as an optional module. Supported backends: **Neo4j** (Aura and self-hosted), **Memgraph**, **Amazon Neptune Analytics**, **Neptune DB**, **Kuzu**, and **Apache AGE** (Postgres extension).

Architecturally, Graph Memory runs **alongside** vector storage, not in place of it. During `memory.add`, the extraction LLM is also asked to identify entities and relationships, which become nodes and edges in the graph. During `memory.search`, vector similarity runs first, the graph query runs in parallel, and related entities from the graph are appended to the vector results without re-ranking. This is important: **the graph does not replace vector recall, it garnishes it.** Any query that truly requires multi-hop graph reasoning still depends on the vector result being the right entry point.

The paper reports Mem0ᵍ achieves ~2% higher aggregate LoCoMo score than base Mem0 (68.4% vs 66.9% in their own numbers). For the amount of infrastructure complexity a graph database adds, 2% is a thin payoff — and it strongly suggests the graph is used as an index, not as a reasoning substrate.

### 2.5 The API Surface

The public API is small and clean. This is one of Mem0's genuine strengths.

```python
from mem0 import Memory
m = Memory()

# Write
m.add("I moved to Lisbon last month", user_id="alice", metadata={"category": "location"})

# Read
m.search(query="where does alice live", user_id="alice", limit=5)

# Modify
m.update(memory_id="abc-123", data="Alice moved to Porto in March")

# Remove
m.delete(memory_id="abc-123")
m.delete_all(user_id="alice")

# Audit
m.history(memory_id="abc-123")  # returns the change log for a memory
m.get_all(user_id="alice")      # dump everything scoped to alice
```

A CLI ships alongside (`@mem0/cli` on npm, `mem0-cli` on pip) that mirrors these operations for ops debugging.

There is one notable footgun. The `infer` parameter on `add()` controls whether Phase 1 + Phase 2 run or whether the payload is stored raw. The docs explicitly warn: *"Mixing both modes for the same fact will save it twice."* Raw inserts skip dedup; subsequent `infer=True` calls on overlapping content create duplicates rather than updates. This is an honest leak of the underlying abstraction — the dedup logic lives in the LLM prompt, not in the storage layer.

---

## 3. Memory Types — What Mem0 Claims vs What It Implements

Mem0's documentation names three memory categories:

- **Factual memory** — "user preferences, account details, domain facts"
- **Episodic memory** — "summaries of past interactions or completed tasks"
- **Semantic memory** — "relationships between concepts so agents can reason about them later"

Noticeably absent: **procedural memory** (how-to knowledge, learned skills). Mem0 has no first-class concept for procedural memory. You can store "User's preferred deploy script is `./bin/ship.sh`" as a fact, but there is no machinery for storing, retrieving, or composing multi-step procedures.

More importantly, the "three memory types" taxonomy is presented as distinct but implemented as **a single vector collection with different phrasings**. There is no separate data path, no separate retrieval logic, no separate dedup rules per type. A "factual" memory and a "semantic" memory end up as sibling rows in the same Qdrant collection, distinguished only by whatever wording the extraction LLM happened to produce. The categorization exists in prose, not in storage.

This is a significant design choice that cuts two ways. Upside: uniformity. Every memory is the same shape, which makes the system easy to reason about and easy to port. Downside: the distinction between stable identity facts ("User's name is Alice"), fluctuating state ("User is currently in Lisbon"), and procedural knowledge ("User deploys by running ./ship.sh and then checking /health") is invisible to the retrieval pipeline. All three are embeddings in the same space, ranked by cosine similarity, with no structural hint about stability or volatility.

This is the root cause of several Mem0 failure modes on temporal benchmarks: **the system has no type-aware handling of knowledge that changes.**

---

## 4. Fact Extraction and Conflict Resolution, In Detail

### 4.1 Extraction

The extraction prompt is a few-shot template. It shows the LLM example conversations and example `facts` arrays, then asks for the same shape on the current input. Users can override this via the `custom_fact_extraction_prompt` (Python) or `customPrompt` (TypeScript) config fields. The Mem0 docs acknowledge that prompts "too broad cause unrelated facts to slip through, requiring users to keep instructions tight and test them with real transcripts" — an honest admission that the extraction quality is a per-domain tuning exercise, not a solved problem.

The extraction LLM returns facts as **flat declarative strings with no structured fields.** This is critical: there is no timestamp, no confidence, no source turn pointer, no entity typing in the output shape. Everything the model wants to capture must be inlined into the fact string itself. "Alice moved to Lisbon on 2026-03-14" and "Alice moved to Lisbon last month" are different strings even though they may refer to the same event, and the dedup LLM has to figure out they are the same.

### 4.2 Conflict Resolution

The Update phase is where Mem0's design limitations become concrete. When a new fact arrives, the top-K similar existing memories are passed to the update LLM with a prompt along the lines of "here is the new fact, here are the existing memories, emit ADD / UPDATE / DELETE / NONE and if UPDATE/DELETE name the memory ID."

This loop has several failure modes that show up in practice:

1. **Semantic near-misses fool the retriever.** The update LLM only sees the top-K. If the true contradicting memory is ranked 6th, the LLM will happily ADD the new fact and you'll have two contradicting memories side-by-side.
2. **Temporal contradictions require temporal reasoning the LLM isn't given.** If the store contains "User lives in Lisbon" from 2026-01-10 and the new fact is "User lives in Porto" from 2026-03-14, whether this is an UPDATE or a DELETE depends on whether the old fact was a point-in-time assertion or a durable attribute. Mem0 gives the LLM no temporal structure to reason with; the dates, if present at all, are inlined in the prose.
3. **The LLM is not consistent.** The same fact presented twice can yield ADD once and NONE another time, because the top-K search results differ slightly or because the LLM samples differently. This is the root of duplicate-accretion bugs that appear in Mem0 deployments at scale.

The docs state *"check existing memories for duplicates or contradictions so the latest truth wins"* — which is an accurate description of the intent but glosses over the point that "latest truth wins" is only correct if you actually know which memory is later, and Mem0 does not maintain explicit temporal order outside of storage timestamps that the update LLM may or may not see.

### 4.3 The `history()` Endpoint

Mem0 does track a change log per memory via the `history()` endpoint. This is a per-memory audit trail of ADD / UPDATE / DELETE events with timestamps. It is a useful diagnostic tool but it is **not used by the retrieval path**. The update LLM does not consult history when deciding what to do with a new fact. History is for humans, not for the system.

---

## 5. Benchmark Reality — Published Claims and Independent Numbers

### 5.1 Mem0's Own Numbers (from the arXiv paper and mem0.ai/research)

Aggregate LoCoMo (LLM-as-Judge accuracy):

| System | LoCoMo J |
|---|---|
| Full-context (GPT-4 with entire conversation in prompt) | 72.9% |
| **Mem0ᵍ (graph variant)** | 68.4% |
| **Mem0 (base)** | 66.9% |
| Standard RAG | 61.0% |
| OpenAI Memory | 52.9% |

Latency (search phase):

- Mem0 p50: ~0.20s, p95: ~0.15s (end-to-end 1.44s)
- Full-context p95: ~17.12s end-to-end
- **Claimed:** 91% lower p95 latency

Token cost:

- Mem0: ~1.8K tokens per conversation
- Full-context: ~26K tokens per conversation
- **Claimed:** 90% token savings

These are the numbers Mem0 cites everywhere. They are real, they are from the paper, and they describe a system that is cheaper and faster than stuffing the full conversation into the prompt. That is a valid comparison — but it is also a **low bar.** Full-context is an anti-baseline; anyone beating full-context on cost is doing what they said they would. The harder comparison is against other memory systems.

### 5.2 Independent Benchmarks

The **Memori Labs benchmark** (2025-2026) reports LoCoMo scores very different from Mem0's numbers:

| System | LoCoMo (Memori Labs run) |
|---|---|
| Memori | 81.95% |
| Zep | 79.09% |
| LangMem | 78.05% |
| **Mem0** | **62.47%** |

The gap between Mem0's self-reported 66.9% and the independent 62.47% is narrower than it looks — different runs, different judges, different model versions will move LLM-as-Judge numbers by a few points routinely. The more interesting gap is the **~20 points between Mem0 and Memori/Zep** on the same benchmark under the same conditions. That is not measurement noise.

The 2026 Dev.to comparison (Bhardwaj, "5 AI Agent Memory Systems Compared") reports similar ordering:

| System | LoCoMo |
|---|---|
| SuperLocalMemory V3 Mode C | 87.7% |
| Zep | ~85% |
| Letta/MemGPT | ~83.2% |
| Supermemory | ~70% |
| Mem0 (independent reproduction) | ~58% |

These independent numbers place Mem0 consistently at the bottom of the credible memory-system cluster. Zep, Letta, and Memori are all 15-25 points ahead.

### 5.3 The Reproduction Bug

GitHub issue [mem0ai/mem0#3944](https://github.com/mem0ai/mem0/issues/3944) is worth reading in full. A researcher (Donghua-Cai) tried to reproduce the LoCoMo numbers against the Mem0 hosted platform with `gpt-4o-mini`. Their LLM-as-Judge score came in around **0.20**, an order of magnitude below the paper.

The root cause, identified by the researcher and confirmed by Mem0 contributors: **the hosted platform was substituting the current wall-clock date for the LoCoMo dataset timestamps.** Example — for "When did Caroline go to the LGBTQ support group?" (correct answer: 7 May 2023), Mem0 stored "Caroline attended an LGBTQ conference in early January 2026" because that was the date when the ingestion job ran. The system hallucinated a timestamp from the processing clock and burned it into the memory.

This is a revealing bug. It is not a bug about benchmark reproducibility. **It is a bug about where temporal state lives in Mem0's architecture.** In a well-designed memory system the source event's timestamp is first-class metadata that flows through extraction untouched. In Mem0, the extraction LLM is told to produce facts as prose, which means the LLM gets to choose what timestamp to put in the prose, and if the LLM is given no explicit time context it will default to "now." The bug was patched (closed 2026-03-27) but the architectural gap that allowed it is structural.

### 5.4 Benchmark Caveats (being fair)

The LoCoMo benchmark is not above criticism. Independent audits of LoCoMo ground truth have found ~99 hallucinated, misattributed, or ambiguous answers across the dataset's ten conversations. The honest ceiling is closer to 93-94%, not 100%. Anyone claiming perfect LoCoMo scores is measuring something else. And LoCoMo's ~115K-token haystacks are increasingly tractable as a plain in-context problem with 1M-token frontier models — the benchmark is measuring a constraint that is receding.

That said, the relative ordering between memory systems on the same benchmark, run the same way, is informative. Mem0 sits at the bottom of the independent-evaluation cluster. The system is architecturally weaker on temporal precision and multi-hop reasoning than its peers. The benchmark criticisms do not rescue it.

---

## 6. Where Mem0 Underperforms, And Why

Pulling the threads together, here are the concrete architectural reasons Mem0 scores below peers on independent benchmarks. These are the lessons we steal for our own design.

### 6.1 Temporal State Is Prose

Mem0 has no first-class time-of-assertion, time-of-validity, or valid-until fields on memories. Dates live inside fact strings as incidental natural language. The update LLM cannot reason about time unless it happens to notice a date in the string. Zep and Graphiti handle this directly with bi-temporal edge properties; Mem0 does not.

**Implication:** Any benchmark question of the form "when did X happen" or "what was true as of Y" depends on an LLM parsing prose instead of the system looking up structured time.

### 6.2 Conflict Resolution Is One-Shot And Stateless

The ADD/UPDATE/DELETE/NONE decision is made in a single LLM call against the top-K nearest vectors. There is no verifier, no second pass, no consistency check against a broader neighborhood. If the true conflict is at rank K+1, the new fact gets ADDed alongside the contradicting one and both persist. Over long sessions, this accumulates noise rapidly.

**Implication:** A "verifier" layer — a second pass that double-checks that the operation chosen is actually consistent with the rest of the store — is missing. We should build one.

### 6.3 No Multi-Hop Graph Reasoning Path

Mem0ᵍ runs the graph alongside vector search and appends results, rather than traversing. When a question requires chaining ("Who introduced Alice to Bob, and what company does that person work at now?"), Mem0 relies on the vector hit landing on the right starting entity and then stitching the rest with LLM reasoning over the retrieved bag-of-facts. The graph is present but underused.

**Implication:** Graph traversal should be a first-class retrieval strategy, not an afterthought that decorates vector results.

### 6.4 Fact Atomization Destroys Context

Once a turn has been converted to facts, the original turn is gone from the retrieval path. If the extraction LLM missed something or phrased it badly, that information is unrecoverable at query time. This is the fundamental cost of compression — and Mem0 pays it on every write.

**Implication:** Our system should retain a raw-conversation side-channel addressable by metadata, even if extracted facts are the primary retrieval unit. Lossy compression with a lossless fallback.

### 6.5 No Procedural Memory

Mem0 has no concept of "how to do X" as stored, composable knowledge. All memory is declarative.

**Implication:** For agent memory — where "last time I hit this error, I ran this command" matters — Mem0 is the wrong shape. Our system needs a procedural tier.

### 6.6 Retrieval Ranking Is Storage-Native

By default, Mem0 lets the vector store's native ranking decide what comes back. There is no learned reranker, no BM25 fusion, no RRF, no entity-graph boost on the base path. A reranker is optional. Zep, Memori, and SuperLocalMemory all do multi-signal fusion by default and score better because of it.

**Implication:** Default-on hybrid retrieval (semantic + lexical + entity + recency) is table stakes for a 2026-era memory system.

---

## 7. What Mem0 Does Well — And We Should Copy

Being honest about weaknesses means being honest about strengths too. Mem0 is popular for reasons, and the reasons are good.

### 7.1 API Ergonomics

Four verbs — `add`, `search`, `update`, `delete` — plus three scope identifiers — `user_id`, `session_id`, `run_id` — cover the 80% case in five minutes of integration work. This is the correct surface. We should not invent more verbs unless we have a compelling reason. Memory systems that require you to pick a memory tier, a storage class, and a retention policy at every write lose integrators to the ones that do not.

### 7.2 The `infer` Escape Hatch

Mem0's `infer=False` lets you store raw payloads bypassing extraction. This is a real-world concession: sometimes you just want to stash a blob. Every memory system should offer this escape hatch explicitly (and warn honestly about the dedup consequence, which Mem0 does).

### 7.3 Pluggable Storage

The adapter pattern for vector stores (Qdrant, Chroma, Weaviate, pgvector, FAISS, Pinecone, Milvus, and more) is well-executed and lets integrators use whatever they already run in production. This is the right architectural bet for an open-source library.

### 7.4 Per-Memory History/Audit

The `history()` endpoint is underused in the core pipeline but it is the right primitive. Every memory mutation should be auditable. We should build this in from the start, and — unlike Mem0 — actually use it during conflict resolution.

### 7.5 The Paper Itself

The Mem0 arXiv paper is clear, honest about what it does and does not do, and reports real latency and token numbers. It is a model for how to publish an applied-systems paper. Marketing on the blog overclaims relative to the paper, but the paper is a useful document.

### 7.6 Observability Hooks

SOC 2 / HIPAA compliance, BYOK encryption, Kubernetes deployment, timestamped versioned exportable memory records, and dashboard visibility into TTL / size / access per memory — these are production-grade operational features. Most memory systems ship without them. Mem0 ships with them and it is one reason they have enterprise traction.

---

## 8. Integration Patterns (As Documented)

Mem0 integrates as a middleware layer between agent framework and LLM. Documented patterns:

- **LangChain** — memory.add on each turn, memory.search before each LLM call, inject results into the prompt as a system message.
- **LangGraph** — same pattern, typically attached to the state reducer.
- **LlamaIndex** — integrated as a memory node in the query pipeline.
- **CrewAI** — per-agent memory scoped by `agent_id`.
- **Custom agents (OpenAI, Anthropic)** — direct SDK use, call `add` post-turn and `search` pre-turn.

The integration surface is uniform because the API is uniform. This is another argument for keeping the verb count small.

---

## 9. Production Considerations

**Latency** — 200ms median search is competitive. The write path is slower than read because it involves two LLM calls (extraction + update decision). For chat applications where the user doesn't wait on the write, this is fine. For agent loops where the memory must be read-after-write consistent within the same turn, the write latency becomes a blocker.

**Cost** — Two LLM calls per memory.add is non-trivial at scale. With `gpt-4.1-nano` the per-call cost is low but over millions of writes it compounds. Switching to a smaller/faster extraction model via config is the standard optimization; the paper itself uses a small model.

**Scale** — The vector-store side scales with whichever backend you pick. The LLM side scales linearly with message volume. There is no batching primitive for the update phase in the OSS package; each fact gets its own round-trip.

**Failure modes in production** — the community bug tracker (before filtering) surfaces: duplicate memories accumulating over long sessions, update LLM returning malformed JSON, extraction LLM producing empty facts arrays on short messages, session memory not cleaning up on session end. All tractable, all operational, none deal-breakers — but they are the kind of bugs you fix at 2am, not the kind that require a redesign.

---

## 10. Community Criticism — What Users Actually Say

Patterns visible across GitHub issues, Hacker News threads, and practitioner blog posts from 2025-2026:

- **"It forgets things it should remember."** The dedup LLM chooses NONE when it should have chosen UPDATE or ADD. The most common category of bug report.
- **"It remembers things it should have updated."** Accumulating duplicates over long conversations.
- **"The hosted platform is a different system than the OSS package."** Subtle behavioral differences. Reproductions against the paper use the OSS path; production often hits the platform path; results diverge.
- **"The graph variant is not worth the operational complexity."** Running Neo4j for 2% benchmark improvement is a hard sell outside enterprise.
- **"Fact extraction is brittle for non-English."** The default prompt is English-biased.
- **"Temporal questions are unreliable."** The bug pattern behind issue #3944 shows up in the wild.

None of these are surprising given the architecture. They are the expected consequences of a pipeline built around "LLM extracts prose facts, LLM decides what to do with them, vector store holds the result."

---

## 11. Synthesis — What We Adopt, What We Avoid

### Adopt

1. **Small CRUD API.** Four verbs: add, search, update, delete. Resist the urge to add more.
2. **Three scope identifiers.** user, session, run/agent — as flat metadata, enforced on every write.
3. **Pluggable vector store.** Adapter pattern, adapters for Qdrant / pgvector / Chroma / FAISS at minimum.
4. **Explicit raw-storage escape hatch.** Our equivalent of `infer=False`, with honest dedup warnings.
5. **First-class per-memory history.** Every mutation audited, exposed via API.
6. **Observability from day one.** TTL, size, access counts, last-touched, versioning.
7. **Metadata-scoped search filters.** Mem0 gets this right.
8. **Clear published benchmark numbers.** Honest latency and cost reporting. The paper format.

### Avoid

1. **LLM as sole conflict resolver.** Add a verifier layer. Second-pass consistency check.
2. **Temporal state hidden in prose.** Time-of-assertion and time-of-validity are first-class metadata, not incidental natural language.
3. **Monolithic vector collection for all memory types.** Factual, episodic, semantic, procedural are different shapes and want different retrieval strategies.
4. **Graph as a garnish.** If we do graph, it is a first-class traversal path with its own ranking contribution, not an appendage to vector results.
5. **One-shot top-K dedup.** The top-K window is too narrow. We need wider-context conflict detection, possibly cross-session.
6. **Fact atomization without a lossless fallback.** Keep the raw turns addressable.
7. **English-only extraction prompts.** Multilingual from day zero.
8. **Trusting marketing benchmarks.** Ours should be reproducible by a stranger with a GitHub clone and an API key.

### The Meta-Lesson

Mem0 treated memory as a **compression problem**: how do we store less while keeping the gist? The benchmarks suggest memory is actually a **reconciliation problem**: how do we keep multiple overlapping, evolving, sometimes-contradictory assertions consistent enough to answer questions reliably? These are not the same problem and a system optimized for one will not automatically be good at the other. Our LTM system should be designed for reconciliation first, compression second.

---

## 12. Open Questions for Future Modules

- **How does Zep's bi-temporal Graphiti model hold up under the same adversarial conditions?** (Module 03)
- **Is Memori's 81.95% architectural, or is it prompt engineering on top of the same basic loop?** (Module 04)
- **What does a verifier layer actually look like in practice — another LLM call, a symbolic consistency check, or a learned model?** (Module 05)
- **Can we build a procedural memory tier that is retrievable by task-context rather than by declarative similarity?** (Module 06)
- **How does the pgvector-native architecture compare to dedicated vector stores for a 10M-memory system?** (Module 07)

---

## Sources

Primary sources (HIGH confidence):
- [Mem0 paper — "Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory" (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413)
- [Mem0 GitHub repository](https://github.com/mem0ai/mem0)
- [Mem0 official site](https://mem0.ai)
- [Mem0 research page](https://mem0.ai/research)
- [Mem0 memory types documentation](https://docs.mem0.ai/core-concepts/memory-types)
- [Mem0 memory operations documentation](https://docs.mem0.ai/core-concepts/memory-operations)
- [Mem0 graph memory documentation](https://docs.mem0.ai/open-source/graph_memory/overview)
- [Mem0 custom fact extraction documentation](https://docs.mem0.ai/open-source/features/custom-fact-extraction-prompt)

Secondary sources (MEDIUM confidence):
- [GitHub issue mem0ai/mem0#3944 — LoCoMo reproduction failure](https://github.com/mem0ai/mem0/issues/3944)
- [Mem0 "State of AI Agent Memory 2026" blog post](https://mem0.ai/blog/state-of-ai-agent-memory-2026)
- [LoCoMo benchmark topic page — Emergent Mind](https://www.emergentmind.com/topics/locomo-benchmark)
- ["5 AI Agent Memory Systems Compared" — Bhardwaj, Dev.to, 2026](https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3)
- ["Best AI Agent Memory Frameworks 2026" — Atlan](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/)

Critical sources (benchmark methodology review):
- [MemPalace benchmark audit](https://www.mempalace.tech/benchmarks)
- [MemPalace benchmark methodology issue — milla-jovovich/mempalace#29](https://github.com/milla-jovovich/mempalace/issues/29)
- [Zep LoCoMo corrected evaluation — getzep/zep-papers#5](https://github.com/getzep/zep-papers/issues/5)

**Research confidence:** HIGH on architecture (paper + code + docs triangulated). MEDIUM-HIGH on benchmark reality (multiple independent runs agree on relative ordering, absolute numbers vary). HIGH on community criticism patterns (consistent across sources). **Valid until:** ~30 days — Mem0 ships rapidly and the dedup/temporal behavior is actively being patched.

---

*Module 02 of the gsd-skill-creator LTM research mission. Next module: Zep & Graphiti architecture deep-dive.*
