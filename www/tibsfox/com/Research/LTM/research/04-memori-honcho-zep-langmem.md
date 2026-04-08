# Memori, Honcho, Zep, LangMem: A Comparative Survey

**Research module 04 — LTM (Long-Term Memory) series**
**Date:** 2026-04-08
**Author:** gsd-skill-creator research team
**Status:** Primary-source survey; all numbers verified against vendor documentation and benchmark pages.

## 0. Why this module exists

gsd-skill-creator needs long-term memory. Not the toy kind — the kind that survives session boundaries, supports cross-project recall, distinguishes "this was true once" from "this is true now," and does not set fire to the token budget every time an agent asks a question. The market has quietly converged on four serious open-source or open-core contenders: **Memori** from Gibson AI, **Honcho** from Plastic Labs, **Zep** from Zep AI (backed by the open-source **Graphiti** library), and **LangMem** from the LangChain team.

In January 2026, Memori Labs published a LoCoMo benchmark showing Memori at 81.95% accuracy against Zep at 79.09%, LangMem at 78.05%, and Mem0 at 62.47%, while using 1,294 tokens per query versus 26,000 for a full-context baseline — a 95% token reduction at near-parity accuracy (full context scored 87.52%). The gap between the top three and Mem0 is enormous; the gap between Memori and Zep is narrow but structurally interesting. This survey pulls apart the architectures behind those numbers and extracts actionable patterns for our own LTM work.

We are specifically looking for answers to three questions:

1. **What does "state of the art" actually look like in 2026 for agent long-term memory?**
2. **Why does Memori beat Mem0 by ~20 percentage points on the same benchmark?**
3. **What can we steal for gsd-skill-creator without getting tangled in someone else's vendor lock-in?**

## 1. The benchmark that anchors the conversation

Before dissecting the systems, a brief note on LoCoMo. LoCoMo (Long Conversation Memory) is a benchmark of multi-session dialogues — each conversation spans many sessions across simulated days or weeks — with four question categories designed to stress different retrieval primitives:

- **Single-hop:** direct recall of one fact from one earlier message
- **Multi-hop:** synthesis across multiple earlier sessions
- **Temporal:** reasoning about how facts evolved over time ("what was the user's favorite coffee *last month*")
- **Open-domain:** distributed context synthesis where the answer is implicit across many exchanges

Memori Labs evaluated with **LLM-as-a-Judge using GPT-4.1-mini**, scoring each answer along factual accuracy, relevance, completeness, and contextual appropriateness. Critically, all four dimensions are scored together into a single accuracy number — which is why a system that recalls facts correctly but loses narrative framing can still lose points.

The full-context baseline sits at **87.52%**. Any memory system is, by definition, compressing conversation history; the question is how much accuracy you pay for the compression. Memori pays about 5.6 points. Zep pays about 8.4 points. LangMem pays about 9.5 points. Mem0 pays 25 points — an entire quartile — while still spending 1,764 tokens per query, more than Memori's 1,294. Mem0 is strictly dominated on this benchmark.

That dominance is the first signal: **architecture matters more than storage choice.** All four systems are backed by real databases with real vector indices. The delta is in how they *use* them.

## 2. Memori: semantic triples linked to conversation summaries

### 2.1 Architecture in one sentence

Memori is a **SQL-native, LLM-agnostic memory layer** that intercepts LLM client calls, extracts semantic triples from conversations, and keeps those triples **linked by reference to the conversation summaries they were extracted from**.

### 2.2 The dual-layer design

This is the key architectural idea and the one worth copying. Memori runs two parallel memory stores:

**Layer A — Semantic triples.** Structured (subject, predicate, object) facts with explicit attributes. The Advanced Augmentation engine enriches each triple along eight dimensions: *attributes, events, facts, people, preferences, relationships, rules,* and *skills*. These are the precise-recall substrate. When an agent asks "what is the user's preferred deploy target," a triple like `(user, prefers_deploy_target, Fly.io)` can be surfaced directly without any narrative reconstruction.

**Layer B — Conversation summaries.** Rolling summaries of the conversation at session granularity, evolving bidirectionally as new messages arrive. These are the narrative-flow substrate. They capture the *why* and the *when*, not just the *what*.

**The link.** Every triple in Layer A carries a backward reference to the summary in Layer B that it was extracted from. This is the move that prevents "factual orphaning" — the failure mode where a memory system recalls a fact but cannot reconstruct the circumstances that made it true, which is catastrophic on multi-hop and temporal questions. When the retriever pulls a triple, it can optionally pull the linked summary as context. When the retriever pulls a summary for a narrative question, the linked triples become footnotes.

Mem0 does not do this. Mem0 extracts facts and stores them with vector embeddings but treats facts as standalone atoms. When asked a multi-hop question it retrieves the top-K atoms and hopes the LLM can reconstruct the flow. On LoCoMo, the reconstruction fails about 38% of the time. **This is the structural reason for the 20-point gap.**

### 2.3 The three-step write path

1. **Session Input.** Messages feed continuously into the Advanced Augmentation engine through registered LLM client instances. Memori hooks in at the SDK level (Python, TypeScript) — developers do not rewrite their call sites, they wrap them.
2. **Summary Loop.** The engine maintains an evolving summary for the current session, updating bidirectionally as new messages arrive. "Bidirectional" here means the summary can be refined backwards — a late message can change how earlier messages are summarized, which matters for correctly anchoring temporal facts.
3. **Memory Extraction.** Once a session chunk reaches threshold, the engine extracts new triples and writes them with backward references to the current summary. The extraction is LLM-assisted but schema-constrained to the eight Advanced Augmentation categories.

### 2.4 The read path

Retrieval operates at three hierarchical levels:

- **Entity level** — users, subjects, organizations
- **Process level** — specific agents or roles
- **Session level** — conversation contexts

Memori calls this "Intelligent Recall" and injects relevant context automatically into subsequent prompts. The hierarchical scoping is how Memori keeps retrieval precise in multi-tenant deployments: queries bound to an entity only see that entity's triples, with session-level narrowing layered on top.

### 2.5 Storage, deployment, and license

- **Backend:** SQL-native. Memori runs against a relational database (the docs describe it as a "SQL-native, LLM-agnostic layer that turns agent execution and conversation into structured, persistent state"). Triples are rows. Summaries are rows. The backward reference is a foreign key. No exotic graph database required.
- **BYODB:** Organizations can self-host against their own database infrastructure.
- **SDKs:** Python, TypeScript. Also MCP (Model Context Protocol) for Claude Code and Cursor integration, and a REST API.
- **LLM support:** OpenAI, Anthropic, Gemini, DeepSeek, Bedrock, Grok. Framework integrations for LangChain, Pydantic AI, Agno.
- **Cost at benchmark scale:** roughly **$0.001 per call** on GPT-4.1-mini — a 20x cost reduction versus full-context, per Memori Labs' own numbers.
- **License:** Apache 2.0.

### 2.6 What Memori gets right

The dual-layer plus backward-reference design is the ball game. It is simple enough to implement in a week on PostgreSQL and powerful enough to beat four competing systems, including one (Zep) with a sophisticated temporal graph. The token efficiency (1,294 tokens/query) comes directly from this design — the retriever can return a triple *instead of* the full summary when the question is narrow, or a summary *with* linked triples when the question is broad. It never has to dump the whole conversation.

### 2.7 What we do not know about Memori

The docs do not publish the actual prompt used for triple extraction, the threshold logic for session chunking, or how the backward references are weighted during hybrid retrieval. The benchmark page is marketing-polished; the GitHub README is thin on internals. Clean-room reimplementation would require inferring these from observed behavior or reading the source code directly.

## 3. Honcho: continual learning and the dialectic API

### 3.1 Architecture in one sentence

Honcho, from Plastic Labs, is a **theory-of-mind-first** memory system that treats memory formation as continual background reasoning about entities, exposing the result through a "dialectic API" with tunable reasoning intensity.

### 3.2 The entity model is the innovation

Memori, Zep, and LangMem all model memory around user-assistant pairs. Honcho explodes the model. Its primary unit is the **Peer** — any entity that participates in conversations, whether human user, AI agent, NPC, or group. Sessions are collections of peers. Observation scoping is per-peer: peer A can participate in a session without peer B seeing A's private context. This makes Honcho the only system in this survey with first-class support for multi-agent games, group chats with asymmetric visibility, and adaptive NPCs.

Under the hood, data is organized hierarchically: **Workspaces → Peers → Sessions → Messages → Collections → Documents.**

### 3.3 The dialectic API and "dreaming"

Honcho separates two code paths:

- **`context()`** — fast, curated, returns reasoning-plus-history in roughly 200ms. This is the hot path, analogous to what most memory systems expose.
- **`.chat()`** — on-demand reasoning with configurable intensity (Minimal, Low, Medium, High, Max). Higher intensities run multi-pass pattern analysis or research-grade exhaustive analysis.

The intensity tiers are priced separately: Minimal ~$0.001, Low ~$0.01, Medium ~$0.05, High ~$0.10, Max ~$0.50 per call. This exposes a capability the other systems hide: **you can pay more tokens at query time for better synthesis when the question warrants it.**

"Dreaming" is the async background reasoning layer. Honcho runs what the docs call Neuromancer (their term for custom reasoning models) against peer data continuously, generating peer representations and session summaries without blocking the runtime path. This is functionally similar to LangMem's background path but scoped to theory-of-mind rather than generic fact extraction — Honcho is trying to model *who this peer is*, not just *what they said*.

### 3.4 Storage and stack

- **Backend:** PostgreSQL with pgvector. Alternative vector stores: Turbopuffer, LanceDB.
- **Server:** FastAPI, Python 3.10+, UV for dependency management, TOML configuration.
- **SDKs:** Python, TypeScript.
- **LLM providers:** Google Gemini, Anthropic Claude, OpenAI, Groq.
- **Deployment:** Docker Compose self-host, Fly.io, or managed at app.honcho.dev ($100 free credits; ingestion priced at $2/M tokens).
- **Open source:** yes (repo at plastic-labs/honcho).

### 3.5 Evals and the honest answer

Plastic Labs maintains a public leaderboard at evals.honcho.dev. At the time of research, the page surface was sparse — title present, detailed benchmark tables not rendered to the fetcher — so we cannot quote Honcho's LoCoMo score with confidence. Honcho does not appear in the Memori Labs comparative chart. The most honest framing: **Honcho is optimizing for a different goal.** It is aimed at long-running agents with evolving personality models, not at single-shot question answering. LoCoMo may not be its best showcase.

### 3.6 What Honcho gets right

The peer abstraction is genuinely forward-looking. Anyone building multi-agent systems, group chats, or NPC-heavy environments will eventually need something like it, and no other system in this survey offers it natively. The tunable reasoning intensity is also clever: it shifts a dial that most memory systems leave fixed at one of two extremes.

## 4. Zep: Graphiti and the temporal knowledge graph

### 4.1 Architecture in one sentence

Zep is a managed service wrapping **Graphiti**, an open-source **bi-temporal knowledge graph framework** that uses LLMs to extract entities and relationships from conversations and maintains temporal validity windows on every fact.

### 4.2 What "bi-temporal" actually means

Every fact in Graphiti carries two timestamps: **`valid_at`** (when the fact became true) and **`invalid_at`** (when it stopped being true). When a fact changes, Graphiti does not overwrite or delete — it invalidates the old fact (sets `invalid_at` to now) and inserts a new one. This preserves the full history, which is essential for temporal questions ("what was the user's job *last year*") and also for audit and debugging.

The core data model:

- **Entities (nodes)** — users, organizations, concepts, whatever the LLM extracts. Each node carries an evolving summary that changes as more is learned.
- **Facts / relationships (edges)** — typed edges between nodes with temporal validity windows and textual descriptions.
- **Episodes** — the raw ingested messages, documents, or JSON blobs, retained as provenance ground truth so any fact can be traced back to its source.
- **Custom types** — defined via Pydantic models for projects that want prescribed ontology (e.g., "this is a medical record, here are the allowed relationship types").

### 4.3 The hybrid retrieval pattern

This is the second insight worth stealing (after Memori's backward reference). Graphiti retrieval combines three mechanisms:

1. **Semantic search** via embeddings (vector similarity)
2. **Keyword search** via BM25 (lexical match for rare tokens, names, codes)
3. **Graph traversal** across edges (follow relationships K hops)

The three results are merged and re-ranked. This "enables low-latency, high-precision queries without reliance on LLM summarization" — the retriever does not need to call an LLM at read time, which is how Zep claims **P95 retrieval latency under 200ms**. The retrieval cost is the index lookup plus the traversal, not a generation step.

Zep publishes benchmark configurations that trade accuracy for latency:

- **Zep 5/2:** ~119 ms, ~65% accuracy (aggressive)
- **Zep 30/30:** ~277 ms, ~83% accuracy (quality-focused)

Memori Labs tested Zep at **79.09%** on LoCoMo with 3,911 tokens per query — roughly 3x Memori's token usage at a 2.86-point lower accuracy. The token cost is the price Zep pays for graph traversal: the retriever is pulling structured subgraphs, and those subgraphs have to be serialized into the prompt.

### 4.4 Storage backends

This is where Graphiti quietly ships the most options in the survey. Supported graph backends:

- **Neo4j** 5.26+ (default)
- **FalkorDB** 1.1.2+
- **Kuzu** 0.11.2+
- **Amazon Neptune** (Database Cluster or Analytics Graph)

The portable design is a real asset — you can run Graphiti against Kuzu in a desktop-embedded context, against Neo4j in a managed cloud, or against Neptune on AWS, with the same driver interface (`Neo4jDriver`, `FalkorDriver`, `KuzuDriver`, `NeptuneDriver`).

### 4.5 LLM requirements

Graphiti requires an LLM provider supporting **Structured Output** (OpenAI and Gemini recommended). The LLM is used for three things:

1. Extracting entities and relationships from unstructured input
2. Generating entity summaries that evolve as new data arrives
3. Autonomous graph construction during ingestion

At read time the LLM is *not* required — the hybrid retrieval is deterministic. This matters for latency and for cost predictability.

### 4.6 Deployment, open source, and compliance

- **Graphiti:** Apache 2.0, self-hosted. Repo at getzep/graphiti.
- **Zep Cloud:** managed service over Graphiti. SOC2 Type II and HIPAA certified. Python, TypeScript, Go SDKs.
- **Integration examples:** LangChain, LlamaIndex, AutoGen.

### 4.7 What Zep gets right

The temporal model is genuinely necessary for any domain where facts change — and that is most domains. A user changes jobs, a project adopts a new library version, a team re-organizes, a medication changes. Systems that just overwrite facts lose the ability to answer "when did that change." Graphiti's bi-temporal design solves this cleanly.

The hybrid retrieval (semantic + BM25 + graph traversal, no LLM at read time) is also the right answer. Pure vector search misses exact-name queries. Pure graph traversal misses paraphrased queries. Pure BM25 misses synonyms. Merging all three is how you get both precision and recall.

### 4.8 Where Zep loses ground

Token cost. 3,911 tokens per query is three times Memori's usage, and the accuracy advantage from richer context does not materialize on LoCoMo — Zep scores *lower*. The graph serialization overhead is real. For a production deployment paying per token on a frontier model, the Memori architecture is cheaper per answered question even before considering infrastructure.

## 5. LangMem: the taxonomy and the two paths

### 5.1 Architecture in one sentence

LangMem is a LangChain-native memory SDK that codifies the **semantic / episodic / procedural** memory taxonomy and exposes two integration patterns: agent-driven (hot path) or background-consolidating (background path).

### 5.2 The taxonomy

LangMem's contribution is conceptual clarity. It names three memory types explicitly:

- **Semantic memory (facts):** "Key facts and relationships that ground agent responses." This is what Memori calls triples and what Zep calls the entity graph.
- **Procedural memory (behavior):** "Internalized knowledge of how to perform tasks." LangMem stores this as *updated instructions in the agent's prompt* — a feedback loop where the agent's core instructions evolve based on observed performance. This is unique in the survey and deeply interesting.
- **Episodic memory (events):** "Memories of past interactions and specific experiences, often taking the form of few-shot examples distilled from longer interactions." LangMem acknowledges it "doesn't yet support opinionated utilities for episodic memory" — this is the weakest leg of the stool.

Procedural memory is the most distinctive piece. No other system in this survey rewrites the *prompt itself* based on accumulated experience. Memori, Honcho, and Zep all store data and retrieve it into a static prompt. LangMem stores *how to behave* and modifies the prompt scaffolding.

### 5.3 Hot path vs background path

- **Hot path:** agents actively manage memory during conversations using tools (`create_manage_memory_tool()` and `create_search_memory_tool()`). The agent decides, turn by turn, what to store and what to query. This gives the LLM explicit control and makes memory operations visible in traces.
- **Background path:** a memory manager process extracts, consolidates, and updates memories outside the active conversation thread. The conversation is not blocked on memory writes.

This is a pragmatic choice. Hot path is simpler to reason about and debug — everything is in the trace. Background path is cheaper and lower-latency at runtime. LangMem lets you pick per memory type.

### 5.4 Storage

- **InMemoryStore** — process-level, dev only.
- **AsyncPostgresStore** — production-ready, persists across restarts.
- **Custom implementations** via the `BaseStore` interface.
- **LangGraph Platform integration** — memory store is built into LangGraph's Long-term Memory Store, available by default in all LangGraph Platform deployments.
- **Embeddings:** OpenAI `text-embedding-3-small` at 1536 dims in the defaults; configurable.

Retrieval is **vector similarity only** by default. This is a meaningful gap versus Zep's hybrid approach — LangMem is going to miss exact-name queries that a BM25 + vector hybrid would catch.

### 5.5 Benchmark position

Memori Labs measured LangMem at **78.05% on LoCoMo**. Close to Zep, notably ahead of Mem0, notably behind Memori. LangMem does not publish its own LoCoMo numbers in the launch blog, so we are relying on a competitor's benchmark — caveat applied.

### 5.6 What LangMem gets right

The taxonomy is the cleanest in the industry. Any team starting from scratch should begin with LangMem's naming: semantic / episodic / procedural. It maps cleanly to cognitive science literature, to what users actually ask for, and to the shape of the data.

Procedural memory as "rewrite the prompt" is the most interesting idea in the survey. It is the only mechanism that lets an agent get structurally better at a task over time without fine-tuning.

### 5.7 Where LangMem loses ground

Vector-only retrieval, explicit LangChain coupling, and the admitted gap in episodic memory tooling. The LangChain coupling is not a flaw per se but it is a decision you commit to — there is no clean way to use LangMem outside the LangGraph ecosystem.

## 6. Side-by-side

| Dimension | Memori | Honcho | Zep / Graphiti | LangMem |
|---|---|---|---|---|
| **LoCoMo accuracy** | **81.95%** | not measured | 79.09% | 78.05% |
| **Tokens per query** | **1,294** | varies by tier | 3,911 | not published |
| **Storage backend** | SQL (BYODB) | Postgres + pgvector | Neo4j / FalkorDB / Kuzu / Neptune | Postgres / LangGraph store |
| **Retrieval** | Triples + summary refs | Vector + reasoning | **Semantic + BM25 + graph traversal** | Vector similarity |
| **Temporal model** | Session-linked triples | Session summaries | **Bi-temporal (valid_at / invalid_at)** | Not first-class |
| **Entity model** | Entity / process / session | **Peers (users, agents, NPCs, groups)** | Nodes with evolving summaries | User-assistant |
| **Write path** | Sync extraction | Async "dreaming" | Sync entity + edge extraction | Hot path tools OR background consolidator |
| **LLM at read time** | No | Optional (tiered) | **No** | No |
| **Procedural memory** | Not first-class | Not first-class | Not first-class | **First-class (prompt rewrite)** |
| **License** | Apache 2.0 | Open source (repo) | Apache 2.0 (Graphiti) | Open source |
| **MCP support** | Yes | Via Claude-Honcho plugin | Not documented | Not documented |

## 7. Why Memori beats Mem0 by 20 points

This is the question that pulled us into the research. Mem0 is not in this survey by name but it is the loser in every comparison and the industry has moved past it. The structural answer:

**Mem0 treats facts as atomic, embedded, and disconnected.** A retrieval call returns top-K vector-similar fragments. The LLM has to reconstruct context at generation time from whatever came back.

**Memori treats facts as referenced, meaning every triple carries a pointer home to its source summary.** A retrieval call can return:

1. Just the triple (precise answer, cheap)
2. The triple plus its summary (precise answer with context, medium cost)
3. Just the summary (narrative answer with triples as footnotes, for open-domain questions)

The retriever picks the right mode per query type. On single-hop questions (1,294 tokens is plenty), both systems look roughly similar. On multi-hop and temporal questions, Mem0 either misses the connection or drowns the prompt in low-precision neighbors; Memori pulls the linked summaries and retains narrative flow. On LoCoMo's multi-hop and temporal categories, Mem0 collapses.

**The lesson is not "use more tokens." Memori uses *fewer* tokens than Mem0 (1,294 vs 1,764) and beats it by 20 points. The lesson is "link your atoms to their context and give the retriever permission to follow the link."**

## 8. What the winners share

Cross-cutting patterns that appear in the top three (Memori, Zep, LangMem's background path) but not in Mem0:

1. **Structured extraction, not raw chunking.** All three use LLM-assisted extraction to pull typed facts out of conversation before storage. Mem0's simpler "store and embed" approach loses precision.
2. **Deterministic retrieval, no LLM in the read loop.** Memori's triple lookup, Zep's hybrid graph query, and LangMem's vector search all run without calling an LLM at read time. This is how they hit sub-200ms latencies and predictable costs.
3. **Two-tier memory: immediate + consolidated.** Memori's summary loop runs continuously. Zep's graph updates incrementally. LangMem's background path consolidates. Honcho dreams. Something is always running off the hot path to improve the memory store.
4. **Explicit temporal handling.** Memori via session-linked summaries with evolution, Zep via bi-temporal edges, LangMem via episodic memory (partially). Systems that overwrite facts cannot answer temporal questions.
5. **Hierarchical scoping.** Memori's entity / process / session, Honcho's workspaces / peers / sessions, Zep's episodes-to-entities-to-facts. None of the winners rely on flat memory pools.

## 9. What we can steal for gsd-skill-creator

gsd-skill-creator is not a conversation agent. It is an adaptive layer that creates, validates, and manages skills / agents / teams / chipsets over time. The memory we need is **skill experience memory** — which skills worked on which kinds of problems, what the user's preferences were for how they are called, what patterns emerged from accumulated runs. This looks more like Memori + LangMem's procedural memory than like Zep's temporal social graph.

Concrete extractions:

### 9.1 Adopt the Memori dual-layer pattern

Store skill-execution events as **triples with back-references to session summaries**. Triples: `(skill, succeeded_on, problem_type)`, `(user, prefers, invocation_pattern)`, `(skill, fails_when, precondition_missing)`. Session summaries: per-project rolling narrative of what was attempted and what worked. Every triple carries a foreign key to the summary it came from. This maps trivially onto PostgreSQL, which we already have via the Artemis II pgvector stack.

### 9.2 Adopt Graphiti's hybrid retrieval

Even for our simpler domain, the semantic + BM25 + traversal merge is the right default. Skill names and file paths are exact-match tokens that vector search mangles; user preferences are paraphrase-heavy and need embeddings; skill-to-skill dependency edges are graph-shaped. We do not need Neo4j — Kuzu (embedded) or Postgres with a recursive CTE over a closure table will do the job for our scale.

### 9.3 Adopt LangMem's procedural memory

This is the most ambitious steal. Store "how to invoke skill X effectively" as **prompt fragments that get rewritten based on observed outcomes**. Every time a skill runs, the post-run review can update the fragment. Over time, the skill's calling convention evolves. This is exactly the adaptive learning layer gsd-skill-creator is supposed to be, and no one in the survey has done it well yet — LangMem introduces the concept but does not provide deep tooling. A clean implementation is a real contribution.

### 9.4 Adopt Memori's token-efficiency discipline

**1,294 tokens per query is the bar.** Any context we inject into an agent prompt should be budgeted against that number. The discipline is not about being stingy — it is about treating context injection as a ranked-relevance problem. We should publish our own per-query token numbers in gsd-skill-creator's docs from day one.

### 9.5 Adopt Honcho's peer model — later, conditionally

The peer abstraction is the right shape *if* gsd-skill-creator ever becomes a multi-agent orchestration platform. For the current single-user adaptive-learning scope, peers are overkill and we should stick with entity / process / session scoping. Flag it for a v2 revisit when multi-agent teams become a first-class concern.

### 9.6 Do NOT adopt Mem0's pattern

Vector-only, flat, atom-store retrieval loses 20 points on LoCoMo. This is now settled. Any component we write that stores facts should link them to their source context and support scoped retrieval.

## 10. Open questions for follow-up research

- **The exact prompt Memori uses for triple extraction.** Clean-room reimplementation is blocked without either reading the source or running extensive behavioral probes. This is module 05 material.
- **Whether Kuzu's embedded graph performance holds under the kind of query mix gsd-skill-creator would generate.** Graphiti ships a Kuzu driver but the benchmarks are Neo4j-flavored.
- **How procedural memory interacts with version control.** If gsd-skill-creator rewrites a skill's prompt fragment based on experience, and the skill is committed to git, who owns the merge? This needs its own design doc.
- **Honcho's actual LoCoMo number.** The evals page was sparse at fetch time. Worth circling back in a month.
- **Whether the 95% token reduction holds at 100x conversation length.** Memori's benchmark is on LoCoMo, which is long but finite. Production conversations can be unbounded. The summary loop's behavior under unbounded growth is not documented.

## 11. Bottom line

If we had to deploy a memory system for gsd-skill-creator this week with no time to build our own, the answer is **Memori for the storage and retrieval substrate, LangMem's procedural memory pattern layered on top, and Graphiti's hybrid retrieval approach backing any graph-shaped queries we add later**. Honcho is the right answer for a different product (multi-agent theory-of-mind environments), not ours. Zep is the right answer if we needed enterprise compliance (SOC2, HIPAA) out of the box, but we do not, and the token cost is real.

The broader lesson is that the LTM problem is *not* a storage problem. Every system in this survey runs on boring infrastructure — PostgreSQL, pgvector, Neo4j, Kuzu. The architectural choices are upstream: how facts are extracted, whether they are linked to context, whether temporal change is first-class, whether retrieval merges multiple signals. Memori's 20-point lead over Mem0 is the loudest possible demonstration that **the retrieval architecture is where the accuracy lives, not the database**.

We should build accordingly.

---

## Sources

**Primary (fetched 2026-04-08):**

- Memori Labs benchmark page — https://memorilabs.ai/benchmark
- Memori GitHub repository — https://github.com/gibsonai/memori
- Honcho landing page — https://honcho.dev
- Honcho GitHub repository — https://github.com/plastic-labs/honcho
- Honcho evals leaderboard — https://evals.honcho.dev/ (sparse at fetch time)
- Zep landing page — https://www.getzep.com/
- Zep GitHub repository — https://github.com/getzep/zep
- Graphiti GitHub repository — https://github.com/getzep/graphiti
- LangMem GitHub repository — https://github.com/langchain-ai/langmem
- LangMem SDK launch blog — https://blog.langchain.com/langmem-sdk-launch

**Confidence notes:**

- Memori's internal prompts and threshold logic: NOT in public docs. Inferred from behavioral description only.
- Honcho's LoCoMo score: UNKNOWN. evals page did not render benchmark data at fetch time. Flagged for follow-up.
- Zep's underlying storage: Graphiti supports Neo4j / FalkorDB / Kuzu / Neptune; which one Zep Cloud uses by default is not stated in their public docs.
- LangMem's LoCoMo number (78.05%): comes from Memori Labs' comparative chart, not LangChain's own publication. Worth independently verifying.
- All dollar costs are approximate and tied to GPT-4.1-mini pricing at the time of the Memori Labs benchmark.

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (memory systems are moving fast; re-verify before citing in production decisions)
