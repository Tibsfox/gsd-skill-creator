# M2: RAG Pipeline Architecture Survey

**Module 2 of the Voxel as Vessel research atlas.**
Retrieval-Augmented Generation is a pipeline. Seven stages, each with a voxel analogue. The document goes in as text and comes out as blocks you can walk through.

---

## 1. The Seven-Stage Pipeline

RAG is not a monolith — it is a sequence of discrete stages, each with well-defined inputs, outputs, and failure modes. VAV maps each stage to a Minecraft structural analogue.

### 1.1 Pipeline Overview

| Stage | Operation | Input | Output | Voxel Analogue |
|-------|-----------|-------|--------|----------------|
| **1. Ingest** | Parse source, normalize text | Raw documents (PDF, HTML, Markdown) | Clean text with metadata | Raw materials arriving at the build site |
| **2. Chunk** | Split into retrieval units | Normalized text | Overlapping chunks (256-512 tokens) | Cutting blocks into 16x16x16 sections |
| **3. Embed** | Encode chunks as vectors | Text chunks | Dense vectors (1024-3072 dim) | Enchanting blocks with NBT float arrays |
| **4. Store** | Persist chunks + embeddings | Vectors + chunk text + metadata | Indexed storage objects | Placing sections into Anvil region files → RADOS objects |
| **5. Retrieve** | Find relevant chunks for a query | Query embedding + index | Top-k candidate chunks | Spatial coordinate query + NBT deserialization |
| **6. Rerank** | Score candidates with cross-encoder | Query + candidate texts | Reordered, scored candidates | Selecting the best blocks from the retrieval radius |
| **7. Generate** | Produce final answer | Query + top reranked chunks | LLM response grounded in evidence | Reading the assembled structure aloud |

> "We introduce RAG models where the parametric memory is a pre-trained seq2seq model and the non-parametric memory is a dense vector index of Wikipedia, accessed with a pre-trained neural retriever."
> — Lewis, P. et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. NeurIPS 2020.

---

## 2. Stage Details

### 2.1 Ingest

The ingest stage converts heterogeneous source formats into normalized text:

**Input formats:** PDF (via pdfplumber/pymupdf), HTML (via beautifulsoup/trafilatura), Markdown, plain text, DOCX, code files.

**Normalization steps:**
1. Extract text content, preserving paragraph boundaries.
2. Strip boilerplate (navigation, headers, footers, ads) from HTML.
3. Normalize Unicode (NFC form), collapse whitespace.
4. Extract and preserve metadata: source URL, title, author, publication date, language.
5. Detect and segment tables, code blocks, and figures (store separately or inline with markers).

**Quality gates:** Documents below a minimum token threshold (e.g., 50 tokens) are flagged for review. Documents with encoding errors or unextractable content are routed to a dead-letter queue.

In VAV, ingested documents are the raw material. Each document will become one or more chunk columns in the Minecraft world. The metadata travels with the document as NBT compound tags.

### 2.2 Chunk

Chunking determines the granularity of retrieval. Too large: retrieved context is diluted. Too small: context is fragmented and retrieval misses surrounding information.

**Strategies:**

| Strategy | Method | Pros | Cons |
|----------|--------|------|------|
| **Fixed-size** | Split every N tokens with M overlap | Simple, predictable | Cuts mid-sentence |
| **Recursive character** | Split on `\n\n`, then `\n`, then `. `, then ` ` | Respects structure | Uneven chunk sizes |
| **Semantic** | Split at topic boundaries (detected via embedding shift) | Coherent chunks | Expensive, non-deterministic |
| **Sentence window** | Each chunk = target sentence + N surrounding sentences | Good for Q&A | High overlap, storage cost |

**VAV mapping:** Each chunk becomes a 16x16x16 **section** — the fundamental structural unit in Minecraft. A section holds 4,096 blocks. With one block per token, a section holds up to 4,096 tokens. In practice, VAV targets ~400 tokens per section (using a subset of the 16x16x16 space), leaving headroom for metadata blocks and padding.

**Overlap handling:** Adjacent sections share boundary tokens. The overlap region is stored in both sections but tagged with `vav:overlap=true` in the block state properties. At retrieval time, the deduplication layer strips overlapping tokens.

### 2.3 Embed

Embedding converts text chunks into dense vector representations in a continuous space where semantic similarity corresponds to geometric proximity.

**Models evaluated for VAV:**

| Model | Dimensions | Max Tokens | MTEB Score | Notes |
|-------|-----------|------------|------------|-------|
| **OpenAI text-embedding-3-large** | 3072 | 8191 | 64.6 | Matryoshka support, truncatable to 256/512/1024/1536 |
| **BGE-M3 (BAAI)** | 1024 | 8192 | 68.3 | Multilingual, open-source, hybrid dense+sparse+colbert |
| **Cohere embed-v3** | 1024 | 512 | 64.5 | Native search_document/search_query task types |
| **GTE-Qwen2-7B-instruct** | 3584 | 32768 | 70.2 | Long-context, instruction-tuned, open-source |

**NBT encoding in VAV:**

Embedding vectors are stored as `TAG_List` of `TAG_Float` within an NBT compound tag attached to each section:

```
Section NBT:
  └─ "vav:embedding" (TAG_Compound)
       ├─ "model" (TAG_String): "text-embedding-3-large"
       ├─ "dim" (TAG_Short): 3072
       ├─ "vector" (TAG_List of TAG_Float): [0.0234, -0.1567, ...]
       └─ "matryoshka_dims" (TAG_Int_Array): [256, 512, 1024, 1536, 3072]
```

The `matryoshka_dims` field declares which prefix truncations are valid for this embedding, enabling the LOD zone system (v2) to use shorter vectors for distant sections.

### 2.4 Store

The store stage persists embedded chunks and their metadata for later retrieval.

**Conventional RAG storage:** Vector databases (Pinecone, Weaviate, Qdrant, Milvus) or search engines with vector support (Elasticsearch, OpenSearch).

**VAV storage:** The Minecraft Anvil format on RADOS (see M1: Ceph Architecture).

Storage mapping:

```
Text chunk (400 tokens)
    → Section (16x16x16 blocks, palette-encoded)
        → Chunk column (up to 24 stacked sections)
            → Region file (.mca, up to 1024 chunk columns)
                → RADOS object in vav-regions pool
```

Each level of the hierarchy adds structure:
- **Section** stores one text chunk + its embedding vector.
- **Chunk column** groups sections from the same document, stacked vertically (y-axis = document order).
- **Region file** groups spatially adjacent chunk columns — documents that are semantically similar (close in embedding space) share a region.
- **RADOS object** is the replication and recovery unit — Ceph ensures its durability.

### 2.5 Retrieve

Retrieval finds the chunks most relevant to a user query.

**Two-phase retrieval in VAV:**

**Phase 1 — Coarse retrieval (spatial query):**
1. Embed the query using the same model as the corpus.
2. Map the query embedding to (x, z) coordinates via the same coordinate mapper used during ingest.
3. Identify which region files contain the target coordinates (O(1) lookup from the spatial index in `vav-meta`).
4. Fetch the relevant `.mca` files from RADOS (or `vav-cache` if hot).
5. Deserialize NBT to extract section embeddings.

**Phase 2 — Fine retrieval (vector comparison):**
1. Compare the query embedding against all section embeddings in the fetched regions.
2. Use cosine similarity or dot product (depending on embedding model normalization).
3. Return top-k sections (typically k=20-50 for reranking).

**Spatial locality advantage:** Because the coordinate mapper places semantically similar documents in adjacent regions, the coarse spatial query naturally limits the search space. Instead of scanning the entire corpus, VAV scans only the relevant neighborhood — analogous to walking to the right neighborhood in a city before searching individual buildings.

### 2.6 Rerank

Reranking applies a more expensive cross-encoder model to the candidate set, improving precision.

**Why reranking matters:**

Embedding-based retrieval uses a bi-encoder architecture: query and document are encoded independently, then compared via dot product. This is fast (encode once, compare many) but lossy — it cannot capture fine-grained query-document interactions.

Cross-encoder rerankers process the query and document together as a single input, enabling full attention across both sequences. This is more accurate but O(n) in the candidate set — hence the two-stage pipeline.

**Reranking models:**

| Model | Type | Speed | Quality |
|-------|------|-------|---------|
| **Cohere Rerank 3.5** | Cross-encoder API | ~50ms per batch of 100 | SOTA on BEIR (2024) |
| **BGE-Reranker-v2-m3** | Cross-encoder, open-source | ~200ms per batch of 100 | Competitive with commercial |
| **ColBERT v2** | Late interaction (token-level) | ~20ms per batch of 100 | Fast, lower peak quality |
| **RankGPT** | LLM-as-reranker (listwise) | ~2s per batch of 20 | High quality, very slow |

**VAV reranking:** Operates on deserialized NBT float arrays. The candidate set (top-k from Phase 2) is passed through the cross-encoder with the original query text. The reranker scores each candidate chunk. Top-n (typically 3-10) proceed to generation.

### 2.7 Generate

The generation stage produces a natural language answer grounded in the retrieved and reranked evidence.

**Prompt construction:**

```
System: You are a research assistant. Answer based ONLY on the provided context.
         If the context doesn't contain the answer, say so.

Context:
[Section from r.3.7.mca, chunk (5,12), section y=4]
{chunk text here}

[Section from r.3.8.mca, chunk (0,3), section y=7]
{chunk text here}

[Section from r.3.7.mca, chunk (5,13), section y=4]
{chunk text here}

User: {original query}
```

Each context block includes its VAV spatial coordinates. This enables:
- **Source attribution:** The answer can cite specific voxel locations.
- **Spatial exploration:** The user can navigate to the cited section in the Minecraft world to see surrounding context.
- **Provenance chain:** Query → coordinates → region file → RADOS object → original document.

---

## 3. Hybrid Retrieval

### 3.1 The Case for Hybrid Search

Dense vector search excels at semantic matching ("What causes ocean acidification?" matches "CO2 absorption lowers seawater pH") but struggles with:

- Exact keyword matching (product IDs, proper nouns, code identifiers)
- Rare terms absent from the embedding model's training distribution
- Boolean/filter queries ("all documents from 2024 containing 'CRUSH'")

BM25 excels at these cases but misses semantic matches.

**Solution: hybrid retrieval** combining both approaches.

### 3.2 Reciprocal Rank Fusion (RRF)

RRF merges ranked lists from multiple retrievers without requiring score normalization:

```
RRF_score(d) = Σ  1 / (k + rank_i(d))
               i∈retrievers
```

Where k is a constant (typically 60) that controls how much weight is given to top-ranked vs. lower-ranked documents.

**Example:**

| Document | Dense Rank | BM25 Rank | RRF Score (k=60) |
|----------|-----------|-----------|-------------------|
| doc_A | 1 | 5 | 1/61 + 1/65 = 0.0318 |
| doc_B | 3 | 1 | 1/63 + 1/61 = 0.0323 |
| doc_C | 2 | 8 | 1/62 + 1/68 = 0.0308 |
| doc_D | 7 | 2 | 1/67 + 1/62 = 0.0311 |

RRF ranking: doc_B > doc_A > doc_D > doc_C. Document B wins because it ranks well in both systems, even though it is #1 in neither.

### 3.3 VAV Hybrid Implementation

In VAV, BM25 operates on the original chunk text (stored in section NBT as `TAG_String`), while dense retrieval operates on the embedding vectors. Both produce ranked lists, merged via RRF before reranking.

---

## 4. Matryoshka Embeddings

### 4.1 Multi-Granularity Representations

Kusupati et al. (NeurIPS 2022) introduced Matryoshka Representation Learning (MRL): a training technique where the first d dimensions of an embedding are themselves a valid d-dimensional embedding.

```
Full vector:    [v_1, v_2, ..., v_256, ..., v_512, ..., v_1024, ..., v_3072]
                 ├──── 256-dim ────┤
                 ├──────── 512-dim ────────┤
                 ├────────────── 1024-dim ──────────────┤
                 ├──────────────────────── 3072-dim ────────────────────────┤
```

Each prefix is a progressively more detailed representation of the same text. The 256-dim prefix captures coarse semantics; the full 3072-dim vector captures fine distinctions.

### 4.2 VAV Application

Matryoshka embeddings enable the LOD zone system:

| Distance from query | Embedding dimensions used | Purpose |
|--------------------|-----------------------------|---------|
| Current section | Full 3072-dim | Precise reranking |
| Adjacent sections (±1 region) | 1024-dim | Accurate neighborhood search |
| Nearby (±4 regions) | 512-dim | Coarse similarity filtering |
| Distant (±16 regions) | 256-dim | Quick "is this area relevant?" check |

This mirrors Minecraft's own LOD system: nearby chunks render full detail, distant chunks render simplified terrain. Same principle, applied to semantic resolution instead of visual resolution.

> Source: Kusupati, A. et al. (2022). *Matryoshka Representation Learning*. NeurIPS 2022.

---

## 5. Advanced RAG Patterns

### 5.1 Corrective RAG (CRAG)

CRAG (Yan et al., 2024) adds a self-evaluation loop after retrieval:

```
Query → Retrieve → Evaluate Relevance
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
        CORRECT     AMBIGUOUS    INCORRECT
        (use as-is)  (refine     (discard,
                      query,      fall back
                      retrieve    to web
                      again)      search)
```

A lightweight evaluator model scores each retrieved chunk as correct, ambiguous, or incorrect. Only correct chunks proceed to generation. Ambiguous chunks trigger query refinement. Incorrect chunks trigger fallback retrieval (web search, alternative corpus).

**VAV compatibility:** The evaluator runs after NBT deserialization. Incorrect chunks' spatial coordinates are logged to identify "dead zones" in the voxel corpus — regions where embeddings have drifted or documents are outdated. These dead zones become targets for re-embedding.

### 5.2 Agentic RAG

Agentic RAG replaces the fixed pipeline with an LLM agent that decides retrieval strategy dynamically:

1. Agent receives the query.
2. Agent decides: single retrieval? Multi-hop? Which tools? Which corpora?
3. Agent calls retrieval tools, inspects results, decides if sufficient.
4. Agent may decompose the query, retrieve for sub-questions, synthesize.
5. Agent generates final answer when satisfied.

**VAV compatibility:** The agent navigates the voxel corpus the way a player navigates a Minecraft world — moving to a location (retrieving a region), inspecting the surroundings (reading section embeddings), deciding where to go next (following semantic trails). The spatial metaphor is not just storage — it is the agent's navigation model.

### 5.3 GraphRAG

Microsoft Research (2024) demonstrated that building a knowledge graph from the corpus enables:

- **Community detection** — clustering related entities and concepts.
- **Global summarization** — answering queries that require synthesizing information across many documents.
- **Relationship traversal** — following entity connections the way you follow paths in a graph.

**VAV compatibility:** The knowledge graph can be overlaid on the voxel world as a network of "redstone" connections between blocks. Entities are blocks; relationships are redstone dust connecting them. The graph is literally visible in the world — you can see which concepts are connected by following the wires.

> Source: Microsoft Research (2024). *GraphRAG: Unlocking LLM Discovery on Narrative Private Data*.

---

## 6. Performance Benchmarks

### 6.1 RAG Effectiveness

Microsoft's 2024 evaluation across multiple benchmarks:

| Metric | Naive RAG | + Reranking | + Hybrid (RRF) | + CRAG |
|--------|-----------|-------------|-----------------|--------|
| **Hallucination rate** | Baseline | -20% | -35% | -40-60% |
| **NDCG@10** | 0.42 | 0.51 | 0.55 | 0.58 |
| **Answer faithfulness** | 0.71 | 0.79 | 0.82 | 0.87 |

Two-stage retrieval (retrieve + rerank) alone improves NDCG@10 by +10-15%.

### 6.2 Latency Budget

Target end-to-end latency for a VAV retrieval query:

| Stage | Target | Notes |
|-------|--------|-------|
| Query embedding | 20ms | Single embedding API call |
| Coordinate mapping | <1ms | UMAP transform (pre-fitted) |
| RADOS region fetch | 50ms | From cache pool; 200ms if cache miss |
| NBT deserialization | 10ms | Per region file |
| Vector comparison | 5ms | Cosine similarity on extracted embeddings |
| Reranking | 50ms | Cohere Rerank 3.5 API call |
| Generation | 500-2000ms | LLM inference, streaming |
| **Total** | **~650-2100ms** | Comparable to conventional RAG |

The VAV overhead (NBT parse, coordinate mapping) adds ~60ms vs. a conventional vector database. This is acceptable — generation dominates latency.

---

## Sources

1. Lewis, P. et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. NeurIPS 2020.
2. Kusupati, A. et al. (2022). *Matryoshka Representation Learning*. NeurIPS 2022.
3. Yan, S. et al. (2024). *Corrective Retrieval Augmented Generation*. arXiv:2401.15884.
4. Microsoft Research (2024). *GraphRAG: Unlocking LLM Discovery on Narrative Private Data*.
5. Robertson, S. & Zaragoza, H. (2009). *The Probabilistic Relevance Framework: BM25 and Beyond*. Foundations and Trends in IR.
6. Malkov, Y. & Yashunin, D. (2018). *Efficient and Robust Approximate Nearest Neighbor using Hierarchical Navigable Small World Graphs*. IEEE TPAMI.
7. Cormack, G. et al. (2009). *Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods*. SIGIR 2009.
8. OpenAI. *Embeddings Guide*. https://platform.openai.com/docs/guides/embeddings
9. Cohere. *Rerank API Documentation*. https://docs.cohere.com/reference/rerank
