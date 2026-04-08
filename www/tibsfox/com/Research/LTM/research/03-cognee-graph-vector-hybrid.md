# Cognee: Graph + Vector Hybrid Memory

**LTM Research Module 03**
**Date:** 2026-04-08
**Branch:** artemis-ii
**Audience:** gsd-skill-creator maintainers evaluating a graph layer for long-term memory

---

## Executive Summary

Cognee is an open-source "AI memory engine" built by topoteretes that occupies a specific and increasingly contested spot in the LTM landscape: the hybrid of a knowledge graph and a vector index, unified under a single pipeline API and a single query surface (`cognee.search()`). Unlike Mem0 (which treats memory as a set of tagged fact strings in a vector store) and unlike Graphiti (which is graph-first over Neo4j and emphasizes temporal edges), Cognee starts from the premise that neither graph structure nor vector similarity is sufficient on its own for multi-hop reasoning, and that the *interface between them* is where most of the engineering value lives.

The claim is testable and Cognee publishes the test. On a 24-question subset of HotPotQA, run 45 times each on Modal Cloud, Cognee's optimized Graph Completion with Chain-of-Thought configuration scored 0.93 human-like correctness, 0.85 DeepEval correctness, 0.84 F1, and 0.69 exact match, beating Mem0, LightRAG, and Graphiti in the same harness. The reported improvements from their own previous configuration are dramatic: +25% human correctness, +49% DeepEval correctness, +314% F1, and +1618% exact match. Those last two deltas aren't typos, they're artifacts of a system that previously almost never produced exact-match strings and now, with Chain-of-Thought over graph triples, does.

For gsd-skill-creator, the relevance is concrete. Our current LTM architecture has **no graph component**. We have embeddings, we have a vector store, we have agents that retrieve by similarity and feed context into an LLM. This works for single-fact recall. It does not work for questions that require traversing relationships — "which skills have I authored that depend on the trust-relationship provider" is a query that similarity search will approximate badly and graph traversal will answer exactly. Cognee is not the only path to adding graph structure, but it is the most mature open-source project in this space that has published a reproducible benchmark, and it deserves a close read before we commit to any design.

**Primary recommendation:** Read this module end-to-end. Then treat Cognee as a reference architecture to study, not necessarily an SDK to adopt wholesale. Its Python-only SDK is a hard blocker for a TypeScript/Rust/GLSL codebase, and its pipeline complexity is real. But its Extract-Cognify-Load (ECL) framework, its nine-retriever taxonomy, and especially its Graph Completion Chain-of-Thought retriever give us a vocabulary and a set of patterns we can reimplement in our own stack. The graph is the important part. The Python wrapper is not.

---

## 1. Architecture: Ontologies, Knowledge Graphs, and Vector DBs

Cognee describes itself as a "living knowledge graph" but this framing is slightly misleading. Internally the system is three stores working in concert, not one:

1. **A graph store.** This holds entities (called DataPoints), their properties, and the typed edges between them. Supported backends include Neo4j, FalkorDB, Kuzu, NetworkX (in-memory), and PostgreSQL with graph extensions. The local-first default stack uses **Kuzu**, an embedded property graph database written in C++ that runs in-process with no server — conceptually similar to DuckDB but for graphs.

2. **A vector store.** This holds embeddings of text chunks, summaries, and DataPoint descriptions. Cognee supports roughly 29 backends at last count, including Qdrant, LanceDB, Milvus, Weaviate, Pinecone, Redis, and pgvector. The local-first default is **LanceDB**, again embedded and file-backed.

3. **A relational/metadata store.** SQLite by default, PostgreSQL in production. This holds pipeline state, document provenance, user and tenant isolation, permissions, and the task execution log.

These three stores are not independent silos. The pipeline guarantees that every DataPoint written to the graph has at least one embedded description in the vector store, and that the relational store carries the mapping between them. The query layer exploits this: a vector search returns chunk IDs, those IDs resolve to graph nodes, and graph traversal expands context from there. This is the "hybrid" in hybrid retrieval — it is not "run both searches and union the results," it is "use the vector search to locate anchors in the graph, then let graph structure do the reasoning."

Ontologies are the fourth conceptual layer, but Cognee's treatment of them is lighter than the marketing suggests. The system supports **RDF-based ontologies** and can ground extracted entities against a supplied schema, but the documentation is thin and most users rely on **auto-generated ontologies** derived from Pydantic models during extraction. In practice, this means you write a Pydantic `BaseModel` describing the entity types you expect — say, `Skill`, `Agent`, `Dependency`, `Commit` — and Cognee's LLM-driven extraction step tries to fit chunks of input text into instances of those models. The Pydantic schema *is* the ontology for most deployments. True RDF-grounded ontologies exist but are used in a minority of production setups.

This matters for us. If we were to adopt Cognee-style patterns in gsd-skill-creator, the natural ontology is already sitting in our source tree: `Skill`, `Agent`, `Chipset`, `Team`, `Phase`, `Task`, `Wave`, `Commit`. These are already TypeScript interfaces. Translating them to Pydantic (or to whatever schema language our re-implementation uses) is mechanical.

---

## 2. The ECL Pipeline: Extract, Cognify, Load

The arXiv paper *Optimizing the Interface Between Knowledge Graphs and LLMs for Complex Reasoning* (arXiv:2505.24478) formalizes Cognee's pipeline as **ECL — Extract, Cognify, Load**. This is the most important piece of architectural vocabulary Cognee introduces and it is worth learning even if we never touch their code.

### Extract
Heterogeneous input in, normalized content out. Cognee ingests 38+ data types including PDFs, Word docs, Excel, Markdown, HTML, audio (transcribed), images (captioned by vision models), and full database connections (Databricks, BigQuery, Snowflake, PostgreSQL). The extract phase handles format detection, text extraction, OCR where needed, and chunking. Chunks are typically paragraph-sized and are the atomic unit that flows into the next stage.

### Cognify
The meaningful work happens here. Cognify is Cognee's term for the combined operation of entity extraction, relation extraction, attribute extraction, and graph construction. It is driven by LLM calls templated through two key prompts:

- **`graph_prompt`** — instructs the LLM to read a chunk and emit a structured list of entities, relations, and attributes. The prompt can be single-step ("return all entities and their relations") or incremental ("first identify entities, then for each entity identify its attributes, then identify relations between entities"). The incremental version produces better graphs but costs more tokens.
- **`qa_system_prompt`** — instructs the LLM on tone, verbosity, and format when generating final answers at retrieval time. This is separate from extraction and is tuned independently.

The output of Cognify is a set of DataPoints ready to be written to the graph, plus the chunk-level embeddings ready to be written to the vector store.

### Load
The write phase. DataPoints go to the graph backend (Kuzu, Neo4j, whatever), embeddings go to the vector backend (LanceDB, Qdrant, whatever), and provenance/metadata goes to the relational backend (SQLite, Postgres). Load is transactional in the sense that a single Cognify run either fully commits to all three stores or rolls back — though the exact transaction semantics depend on the chosen backends, and truly atomic cross-store writes are not guaranteed.

**ECL as a mental model** is strictly more powerful than RAG's "chunk + embed + store" because it adds the structured extraction step. And it is strictly less rigid than traditional ETL because Cognify is LLM-driven and can handle arbitrary input. The cost is latency and token spend: cognifying a 10,000-word document might make dozens of LLM calls and take 30-60 seconds. This is Cognee's biggest practical weakness at scale.

---

## 3. DataPoints and Tasks: The Programming Model

Cognee's programming model is built on two primitives.

**DataPoints** are the nodes in the knowledge graph. Every DataPoint has a UUID, a type (from the Pydantic ontology), a set of properties, a human-readable description (which gets embedded), and a set of relations to other DataPoints. A `Skill` DataPoint might have properties `{name, version, author, trigger_phrase}` and relations `{depends_on → Skill, created_by → Agent, uses → Chipset}`. DataPoints are the unit of memory.

**Tasks** are the nodes in the pipeline graph. A task is a function that consumes one kind of input and produces another — chunk a document, extract entities from a chunk, resolve entity coreferences, write DataPoints to the store. Tasks compose into **pipelines**, and pipelines are how `cognee.cognify()` actually works under the hood. The default pipeline is opinionated and works out of the box, but users can write custom tasks to handle domain-specific extraction, which is how Cognee adapts to weird data sources.

The two-primitive model is clean and maps well to what we already do in gsd-skill-creator. Our equivalent of a Task is a skill action or an agent phase. Our equivalent of a DataPoint is a file in `.planning/` or a trust-relationship record. The pattern is there. What Cognee adds is (a) the explicit graph of DataPoints as first-class infrastructure, and (b) a declarative pipeline DSL for composing extraction steps.

---

## 4. The Nine Retrievers

This is the most practically useful part of Cognee's architecture and the part most worth stealing. Cognee defines nine named retriever classes, all inheriting from `BaseRetriever` with two methods: `get_context(query)` returns raw evidence, and `get_completion(query)` returns a natural-language answer. `cognee.search()` picks the right retriever based on a `SearchType` enum argument.

| Retriever | What it does | Best for |
|---|---|---|
| **SummariesRetriever** | Vector search over pre-written summaries | Fast overview queries |
| **ChunksRetriever** | Vector search returning raw text fragments | Direct citation lookups |
| **CompletionRetriever** | Standard RAG: retrieve chunks, stuff into prompt, generate | Baseline QA |
| **GraphCompletionRetriever** | Vector search finds anchor nodes, then expand graph triples, serialize as text, generate | Single-hop graph QA |
| **GraphSummaryCompletionRetriever** | Like GraphCompletion but summarizes the graph context before passing to the LLM | Large subgraph queries |
| **GraphCompletionContextExtensionRetriever** | Iteratively expands graph context across multiple retrieval rounds | Multi-hop requiring breadth |
| **GraphCompletionCotRetriever** | The star of the show. Chain-of-thought over graph context: generate initial answer, reflect, ask a follow-up question, re-retrieve, refine, repeat | Complex multi-hop reasoning |
| **CypherSearchRetriever** | Run raw Cypher against Neo4j or compatible graph store | Power users, known queries |
| **NaturalLanguageRetriever** | LLM translates natural language to Cypher, runs it, retries on failure | Ad-hoc exploration |

The taxonomy is the insight here. Most RAG systems give you one retriever and call it a day. Cognee's observation is that different query shapes require different retrieval strategies, and dispatching between them is itself a research problem. The `SearchType` enum is the surface where that dispatch happens.

The **GraphCompletionCotRetriever** is worth special attention because it is the one that produced those eye-popping benchmark numbers. It works like this:

1. Vector-search the user's query against DataPoint descriptions to find seed nodes.
2. Expand one or two hops of graph triples around those seeds.
3. Serialize the triples as structured text ("Alice → authored → Skill A; Skill A → depends_on → Skill B; Skill B → created_by → Bob").
4. Pass the serialized graph plus the original question to the LLM and ask for an initial answer.
5. Prompt the LLM to reflect on whether the answer is complete and, if not, to propose a follow-up question that would fill the gap.
6. Use the follow-up question as a new seed for another vector+graph retrieval.
7. Append the new context and repeat steps 4-6 for N rounds (default ~3).
8. Return the final refined answer plus the full reasoning trace.

The magic isn't any single step — steps 1-4 are just GraphRAG with a triple serialization format. The magic is step 5, the reflection loop. Cognee's benchmark data suggests this is where the +1618% exact-match delta comes from: on multi-hop HotPotQA questions, a single pass finds the first-hop evidence but misses the second-hop bridge. The reflection loop *notices* it is missing the second hop and goes back to get it.

This pattern is reimplementable in any language. It does not require Cognee's Python SDK. It does require a graph store, embeddings, and an LLM with good instruction-following. We have all three available.

---

## 5. Ontologies: User-Defined or Auto-Generated?

Both, with a strong lean toward auto-generated in practice.

The supported modes:
- **Pydantic-model-as-ontology (default).** User supplies Pydantic `BaseModel` classes. Cognee's extraction prompts are templated with the model schema and the LLM is instructed to populate instances. This is how 90% of Cognee users define their ontology.
- **RDF/OWL ontologies.** User supplies an RDF file. Cognee grounds extracted entities against it, preferring exact class matches. This mode exists, is documented thinly, and is used mostly in enterprise deployments where a domain ontology already exists.
- **Fully unstructured.** No ontology at all. Cognee's default graph_prompt extracts "whatever entities and relations make sense" and the schema emerges from the data. This produces messy graphs but requires zero upfront work.

Our natural fit is the Pydantic model approach, adapted to TypeScript. We already have interfaces for all the domain objects we care about. A small zod/JSON Schema → extraction-prompt translator would let us reuse those definitions as the ontology without a second source of truth.

---

## 6. Contradictions, Updates, and Temporal Reasoning

This is where Cognee's story is weakest and where we need to be most careful if we adopt its patterns.

**Contradictions.** Cognee's default behavior is append-only. If you ingest "Alice lives in Seattle" and later ingest "Alice lives in Portland," you get two `Alice-livesIn-City` edges in the graph and the retriever may surface either or both. There is no built-in conflict resolution. The documentation suggests users handle this via custom tasks that deduplicate or supersede, but there is no first-class "this edge replaces that edge" primitive. Compare this to Graphiti, which makes temporal supersession a first-class concept with `valid_from` and `invalidated_at` timestamps on every edge.

**Updates.** `cognee.cognify()` re-run on the same document does not cleanly update the existing graph. The default behavior is to append new DataPoints, producing duplicates. Users who need true updates typically write a custom task that diffs extracted entities against existing ones and performs merges — this is left as an exercise.

**Temporal reasoning.** Cognee's schema has no native time dimension. DataPoints can carry `created_at` properties if the ontology defines them, and relations can carry timestamps, but the retrievers do not reason about time-ordering by default. The Hindsight vs Cognee comparison published on vectorize.io flags this explicitly as a limitation: "offers no temporal reasoning capabilities for time-aware queries." Cognee's own research roadmap mentions a DeepEval partnership for memory-specific evaluation including temporal reasoning, which reads as an acknowledgment that the capability is not yet there.

For our use case, this matters. gsd-skill-creator tracks skill authorship, commits, phase transitions, wave boundaries — time is everywhere. If we adopt Cognee-style graph memory without a temporal model, we will hit the same wall Cognee has. The fix is not hard conceptually — put `valid_from` and `valid_to` on every edge, and have the retriever filter by query time — but it is not free, and it is not in Cognee today.

---

## 7. LLM Integration

Cognee integrates with LLMs via **LiteLLM**, which gives it access to effectively every major provider and most local runtimes through a single interface:

- **OpenAI** (GPT-4o, GPT-4 family, default for most users).
- **Anthropic** (Claude family, well supported).
- **Local models** via Ollama, LM Studio, vLLM, llama.cpp — anything LiteLLM speaks.
- **Other hosted providers** including Gemini, Anyscale, Groq, Together, Mistral.

Configuration is environment-variable driven: set `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, and the system picks up the change. Extraction and generation can use different models, which is a useful cost optimization — extract with a cheap model, generate final answers with a smart one.

Embeddings are configured separately via `EMBEDDING_PROVIDER` and `EMBEDDING_MODEL`. Cognee supports OpenAI embeddings, local sentence-transformers, and anything else LiteLLM can dispatch to. Our existing default (`all-MiniLM-L6-v2`) would drop in cleanly.

---

## 8. The `cognee.search()` API

The user-facing query surface is deceptively simple:

```python
results = await cognee.search(
    query_text="What skills depend on trust-relationship-provider?",
    query_type=SearchType.GRAPH_COMPLETION_COT,
    top_k=10,
)
```

The `SearchType` enum is the dispatch mechanism to the nine retrievers. Values include `SUMMARIES`, `CHUNKS`, `COMPLETION`, `GRAPH_COMPLETION`, `GRAPH_SUMMARY_COMPLETION`, `GRAPH_COMPLETION_CONTEXT_EXTENSION`, `GRAPH_COMPLETION_COT`, `CYPHER`, and `NATURAL_LANGUAGE`. The API handles permission filtering (tenant isolation is enforced at the retrieval layer), result formatting, and error recovery.

Under the hood, `search()` does three things:
1. Instantiates the right retriever class based on `query_type`.
2. Calls `retriever.get_context(query)` to gather evidence.
3. Calls `retriever.get_completion(query)` to generate the final answer, passing the context forward.

This two-method split is worth noting. Separating context-gathering from answer-generation means you can cache context, audit what was retrieved, or feed the context into a different model for answer generation. It also means the retriever can return "no answer, here's what I found" without forcing a hallucinated response.

---

## 9. Scaling: What Happens at 100K and 1M Memories?

Cognee's public benchmarks are on small datasets. The HotPotQA evaluation uses 24 questions. The primary use cases cited in their materials are "institutional knowledge extraction" for mid-sized document corpuses — think a company wiki, a research archive, a product documentation set. The Medium article from Reveriano explicitly notes: "further evaluation is necessary to assess its performance and scalability when handling large-scale databases."

What we can infer from the architecture:

**At 100K DataPoints**, the bottleneck is likely the graph backend. Kuzu (the local default) is fast for single-hop queries but multi-hop traversal across 100K nodes depends heavily on edge density. Neo4j with proper indexes handles this comfortably. LanceDB handles 100K embeddings without breathing hard. SQLite for metadata is fine. The user-visible concern at this scale is probably **Cognify latency** — ingesting 100K DataPoints' worth of source material is many hours of LLM calls and many dollars of token spend.

**At 1M DataPoints**, Kuzu may start to strain depending on query patterns. PostgreSQL with graph extensions, or FalkorDB, become more attractive. Neo4j Enterprise handles this routinely. The vector store should migrate from LanceDB to Qdrant or Milvus for better concurrency. SQLite should migrate to Postgres. Cognify latency at this scale is impractical for single-machine ingestion — users would need to parallelize across workers.

**Beyond 1M**, you are off the end of Cognee's tested envelope. Nobody has published benchmarks at this scale. The architecture does not preclude scaling but the out-of-the-box defaults do not support it.

For gsd-skill-creator, our realistic memory footprint is probably in the 10K-100K range per domain (skills, agents, missions, commits). This is squarely within Cognee's comfort zone and scaling is not our first concern. If we ever wanted to store every commit across every branch as a memory, that's a million-plus and we'd need a different strategy.

---

## 10. Criticisms and Known Limitations

The honest picture of Cognee's weaknesses:

1. **Python-only SDK.** This is the biggest blocker for us. gsd-skill-creator is TypeScript + Rust + GLSL. We cannot call Cognee in-process. We would need a sidecar Python service with an HTTP or gRPC interface, which adds deployment complexity and a runtime dependency we do not currently have. This alone probably rules out adopting Cognee as our SDK.

2. **Pipeline complexity.** Simple ingestion is "6 lines of code." Custom extraction for non-trivial domains requires writing Pydantic models, custom tasks, and sometimes custom prompts. The docs lag the API, so deep customization often means reading source code.

3. **No native temporal reasoning.** Flagged already. This is a real gap for memory systems that need to reason about change over time.

4. **Append-only by default.** Updates and contradictions require custom handling.

5. **Cognify latency and cost.** Every ingested document triggers multiple LLM calls. For a large corpus or frequent updates, this adds up. Cognee mitigates with caching and incremental extraction but the fundamental cost is real.

6. **Documentation lag.** The project moves fast, the docs move slower, and there are capabilities in the API that aren't documented yet. Users end up reading test files and source code.

7. **Cloud offering still young.** Cognee Cloud is new. Most production deployments are self-hosted, which means you own the ops burden for three databases (graph + vector + relational).

8. **No public benchmark at scale.** Strong numbers on 24 HotPotQA questions is informative but not a replacement for results on larger corpora. The forthcoming DeepEval memory-specific benchmark will help when it lands.

9. **Ontology support is lighter than marketed.** RDF grounding exists but most users fall back to Pydantic-as-ontology. If you want formal ontology alignment, you will be writing glue code.

10. **Multi-database ops complexity.** SQLite + LanceDB + Kuzu locally is fine. Postgres + Qdrant + Neo4j in production is three systems to monitor, back up, and upgrade independently.

---

## 11. What This Means for gsd-skill-creator

Pulling the threads together:

**The graph idea is right.** Hybrid graph + vector memory beats vector-only for multi-hop queries. Cognee's benchmark is the clearest evidence we have, and the pattern (vector search finds anchors → graph traversal finds relations → serialized triples feed the LLM → reflection loop fills gaps) is sound. Our current vector-only LTM will hit a ceiling on queries that require traversing our own domain relationships, and we will notice this as "the system seems forgetful about how things connect." Adding a graph layer is the fix.

**Cognee-the-SDK is probably not the right adoption path.** Python-only rules it out for in-process use in our TypeScript/Rust codebase. A Python sidecar is possible but adds runtime complexity we have been deliberately avoiding.

**Cognee-the-reference-architecture is absolutely the right study material.** The ECL pipeline, the DataPoints + Tasks programming model, the nine-retriever taxonomy, and especially the Graph Completion Chain-of-Thought retriever are patterns we can reimplement in our own stack. The vocabulary alone is worth stealing.

**Our probable path:**

1. **Add a graph store** to the LTM architecture. Candidates: Kuzu (embeddable, fast, matches Cognee's default), Neo4j (heaviest, most powerful), in-memory NetworkX-style (simplest, rebuilds from source each session). For a first implementation, embeddable-and-in-process is the right tradeoff.

2. **Define the ontology in TypeScript.** Our domain objects (Skill, Agent, Chipset, Mission, Phase, Wave, Commit, Trust-Relationship) become the node types. Our existing relationships become the edge types.

3. **Build a Cognify-equivalent extraction pipeline.** For now, this can be specific to our domain — we do not need to handle arbitrary PDFs. We need to extract DataPoints from our own source tree, our `.planning/` directory, our commit history, our skill definitions. This is a more constrained problem than Cognee's.

4. **Implement a GraphCompletionCot-style retriever.** Vector search for anchors, graph expansion for context, triple serialization, LLM generation, reflection loop. This is maybe 400 lines of TypeScript on top of our existing vector store and a graph library.

5. **Add temporal awareness from day one.** Every edge gets `valid_from` and `valid_to`. The retriever filters by query time. This is the one place we explicitly improve on Cognee rather than copying it.

6. **Benchmark against our own corpus.** Cognee's HotPotQA numbers are informative but not directly applicable. We should build a small eval set of multi-hop questions over our own domain ("which skills did Claude-Opus-4.6 author that depend on the trust-relationship chipset and were introduced after v1.40?") and measure vector-only vs graph+vector vs graph+vector+CoT.

The goal is not to become Cognee. The goal is to learn what Cognee learned, skip the mistakes it made (Python-only, no temporal model, append-only updates), and end up with a memory layer that fits our stack and our domain. This module is the first half of that work. The second half is the design doc that follows.

---

## Sources

- [Cognee homepage](https://www.cognee.ai/) — product overview, ECL pipeline description, deployment options
- [Cognee research and evaluation results](https://www.cognee.ai/research-and-evaluation-results) — HotPotQA benchmark, comparison with Mem0/Graphiti/LightRAG, optimization deltas
- [Cognee GitHub repository](https://github.com/topoteretes/cognee) — source, supported backends, example code, architecture notes
- [Cognee: The art of intelligent retrieval](https://www.cognee.ai/blog/deep-dives/the-art-of-intelligent-retrieval-unlocking-the-power-of-search) — nine-retriever taxonomy, BaseRetriever interface, SearchType dispatch
- [Cognee AI memory evaluations](https://www.cognee.ai/blog/deep-dives/ai-memory-evals-0825) — full benchmark methodology, 45 runs, DeepEval integration
- [arXiv:2505.24478 — Optimizing the Interface Between Knowledge Graphs and LLMs for Complex Reasoning](https://arxiv.org/html/2505.24478v1) — ECL framework formalization, prompt templates, evaluation harness
- [Knowledge Graphs with Cognee (Medium, Francisco Reveriano)](https://medium.com/@reveriano.francisco/knowledge-graphs-vs-agentic-rag-part-1-2480895da8ec) — practical usage, RDF ontologies, scaling observations
- [Hindsight vs Cognee: AI Agent Memory Comparison (vectorize.io)](https://vectorize.io/articles/hindsight-vs-cognee) — local-first stack (SQLite/LanceDB/Kuzu), limitations, Python-only blocker, temporal reasoning gap
- [Graph Chain-of-Thought (ACL 2024 Findings)](https://aclanthology.org/2024.findings-acl.11.pdf) — academic foundation for graph-CoT reasoning patterns
- [Scaling Graph Chain-of-Thought Reasoning (arXiv:2511.01633)](https://arxiv.org/pdf/2511.01633) — multi-agent extensions of the graph-CoT pattern

**Confidence:** HIGH for architecture, retriever taxonomy, benchmark numbers, ECL framework (verified across multiple official sources). MEDIUM for scaling claims and internal pipeline details (inferred from docs and third-party coverage, not stress-tested). LOW for ontology depth and RDF grounding specifics (docs are thin, most users use Pydantic fallback).
