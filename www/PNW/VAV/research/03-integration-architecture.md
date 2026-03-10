# M3: Integration Architecture Design

**Module 3 of the Voxel as Vessel research atlas.**
This is where the two systems meet. Ceph stores objects. Minecraft structures worlds. RAG retrieves knowledge. The integration layer makes them one system — a world you can walk through that answers your questions.

---

## 1. The Encoding Scheme

### 1.1 Core Isomorphism

The block-token isomorphism is the central design principle of VAV. It defines a structure-preserving mapping between text and voxels:

| Text Domain | Voxel Domain | Relationship |
|-------------|-------------|-------------|
| Token | Block (1x1x1) | 1:1 identity mapping |
| Document chunk (~400 tokens) | Section (16x16x16) | Structural unit |
| Document (~20 chunks) | Chunk column (16x384x16) | Vertical stack |
| Corpus shard (~1024 documents) | Region file (512x384x512 blocks) | Storage unit |
| Full corpus | World (unbounded) | Complete namespace |

The isomorphism preserves three properties:

1. **Identity** — each token maps to exactly one block state; each block state maps to exactly one token.
2. **Adjacency** — tokens adjacent in the source text are adjacent in voxel space.
3. **Hierarchy** — the containment hierarchy (token ∈ chunk ∈ document ∈ corpus) maps to the Minecraft hierarchy (block ∈ section ∈ chunk column ∈ region).

### 1.2 Token-to-Block Mapping

Each unique token in the corpus vocabulary receives a unique Minecraft block state:

```
Token: "photosynthesis"  →  Block State: minecraft:emerald_block
Token: "the"             →  Block State: minecraft:stone
Token: "mitochondria"    →  Block State: minecraft:redstone_block
Token: "="               →  Block State: minecraft:iron_bars[north=true,south=true]
```

The mapping is stored in the world's vocabulary manifest (`vav-meta` pool):

```json
{
  "vocabulary": {
    "version": 1,
    "model": "cl100k_base",
    "token_count": 100256,
    "mappings": [
      {"token_id": 0, "token": "!", "block_state": "minecraft:white_wool"},
      {"token_id": 1, "token": "\"", "block_state": "minecraft:orange_wool"},
      ...
    ]
  }
}
```

**Block state assignment strategy:**

1. **Frequency-based coloring:** High-frequency tokens (the, a, is, of) map to common natural blocks (stone, dirt, sand). The visual landscape reflects word frequency — common words form the terrain, rare words stand out as distinct structures.
2. **Semantic category grouping:** Tokens from the same semantic domain share block material families. Science terms → ore blocks. Action verbs → redstone components. Punctuation → fence/bar variants. This makes the voxel corpus visually interpretable — you can see topic clusters by color.
3. **Property encoding:** Block state properties (orientation, connectivity, waterlogged) encode token metadata. A log block's `axis` property could indicate part-of-speech; a slab's `type=top|bottom` could indicate sentence position.

### 1.3 Chunk-to-Section Mapping

A text chunk maps to a 16x16x16 section. The 4,096 available block positions are filled as follows:

```
Section Layout (16x16x16 = 4,096 positions):

Layer y=0 to y=15 (16 layers):
  Each layer: 16x16 = 256 positions
  Reading order: x increases left-to-right, z increases front-to-back
  Layer order: y increases bottom-to-top

Token placement:
  Token 0   → (x=0,  y=0,  z=0)
  Token 1   → (x=1,  y=0,  z=0)
  ...
  Token 15  → (x=15, y=0,  z=0)
  Token 16  → (x=0,  y=0,  z=1)
  ...
  Token 255 → (x=15, y=0,  z=15)
  Token 256 → (x=0,  y=1,  z=0)    ← next layer
  ...
  Token 399 → (x=15, y=1,  z=8)    ← end of ~400-token chunk
  Remaining → air (minecraft:air)   ← padding
```

**Padding semantics:** Unfilled positions are `minecraft:air`. Air blocks are omitted from the palette in Minecraft's storage format, so padding costs zero additional storage. The section's `vav:token_count` NBT tag records how many positions contain real tokens.

### 1.4 Embedding-to-NBT Mapping

Each section's embedding vector is stored as an NBT compound:

```
Section Root (TAG_Compound)
├── "Y" (TAG_Byte): section y-index
├── "block_states" (TAG_Compound): standard Minecraft palette + data
├── "biomes" (TAG_Compound): standard Minecraft biome data
└── "vav" (TAG_Compound): VAV extension data
    ├── "embedding" (TAG_Compound)
    │   ├── "model" (TAG_String): "text-embedding-3-large"
    │   ├── "dim" (TAG_Short): 3072
    │   ├── "vector" (TAG_List of TAG_Float): [0.0234, -0.1567, ...]
    │   └── "matryoshka" (TAG_Int_Array): [256, 512, 1024, 1536, 3072]
    ├── "source" (TAG_Compound)
    │   ├── "doc_id" (TAG_String): "arxiv:2401.15884"
    │   ├── "chunk_index" (TAG_Int): 7
    │   ├── "char_offset" (TAG_Int): 3200
    │   └── "char_length" (TAG_Int): 1847
    ├── "text" (TAG_String): "The corrective retrieval..."
    ├── "token_count" (TAG_Short): 412
    ├── "overlap_prev" (TAG_Short): 32
    └── "overlap_next" (TAG_Short): 32
```

The `vav` compound is a VAV-specific extension. Standard Minecraft clients ignore unrecognized NBT tags, so VAV region files remain valid Minecraft worlds — you can open them in a vanilla client and walk through the blocks, even without the VAV retrieval layer.

---

## 2. Storage Hierarchy

### 2.1 Complete Hierarchy Diagram

```
WORLD (full RAG corpus — unbounded)
│
├── DIMENSION: overworld (primary corpus)
│   │
│   ├── REGION r.0.0.mca (corpus shard — 32×32 chunk columns)
│   │   │   RADOS key: "regions/r.0.0.mca"
│   │   │   Size: 1-12 MB
│   │   │   xattrs: version, bounds, palette_hash, chunk_count
│   │   │
│   │   ├── CHUNK (0,0) — Document "Ceph Architecture Guide"
│   │   │   │   16 blocks wide × 384 blocks tall × 16 blocks deep
│   │   │   │   NBT: DataVersion, LastUpdate, Status, Heightmaps
│   │   │   │
│   │   │   ├── SECTION y=0 — Chunk 1: "Introduction" (~400 tokens)
│   │   │   │   16×16×16 = 4,096 block positions
│   │   │   │   Palette: {0: air, 1: stone, 2: oak_log, 3: emerald_block, ...}
│   │   │   │   Data: packed long array of palette indices
│   │   │   │   vav:embedding: TAG_Float[3072]
│   │   │   │   vav:text: "Introduction to Ceph..."
│   │   │   │
│   │   │   ├── SECTION y=1 — Chunk 2: "RADOS Fundamentals" (~400 tokens)
│   │   │   │   ...
│   │   │   │
│   │   │   └── SECTION y=19 — Chunk 20: "Conclusion" (~280 tokens)
│   │   │       vav:token_count: 280
│   │   │
│   │   ├── CHUNK (0,1) — Document "CRUSH Algorithm Paper"
│   │   │   ...
│   │   │
│   │   └── CHUNK (31,31) — Document "BlueStore Internals"
│   │       ...
│   │
│   ├── REGION r.0.1.mca (adjacent corpus shard)
│   │   ...
│   │
│   └── REGION r.N.M.mca
│       ...
│
├── DIMENSION: nether (alternate corpus / archive)
│   ...
│
└── DIMENSION: end (experimental / staging)
    ...
```

### 2.2 Capacity at Each Level

| Level | Dimensions | Tokens | Text Equivalent | Storage |
|-------|-----------|--------|-----------------|---------|
| **Block** | 1×1×1 | 1 token | ~4 characters | ~2 bits (palette index) |
| **Section** | 16×16×16 | ~400 tokens | ~1,600 characters | ~4 KB (palette + data + embedding) |
| **Chunk column** | 16×384×16 | ~8,000 tokens | ~32,000 characters | ~80 KB (20 populated sections) |
| **Region** | 512×384×512 | ~8.2M tokens | ~33M characters | ~4 MB (avg. Anvil file) |
| **Dimension** | Unbounded | Unbounded | Unbounded | Sum of regions |
| **World** | 3 dimensions | Unbounded | Unbounded | Sum of dimensions |

**Scaling examples:**

| Corpus Size | Documents | Regions | RADOS Objects | Raw Storage | Replicated (3x) |
|------------|-----------|---------|---------------|-------------|------------------|
| Small (textbook) | 50 | 1 | 1 | 4 MB | 12 MB |
| Medium (department) | 5,000 | 5 | 5 | 20 MB | 60 MB |
| Large (enterprise) | 500,000 | 500 | 500 | 2 GB | 6 GB |
| Massive (web crawl) | 50,000,000 | 50,000 | 50,000 | 200 GB | 600 GB |

Even the massive tier is comfortable for a production Ceph cluster. The Anvil format is remarkably storage-efficient thanks to palette compression and section omission.

---

## 3. Spatial Coordinate Mapping

### 3.1 The Mapping Problem

The coordinate mapper must solve: given a document's embedding vector in R^3072, assign it (x, z) coordinates in the Minecraft world such that semantically similar documents are spatially adjacent.

This is a **dimensionality reduction** problem: project from high-dimensional embedding space to 2D spatial coordinates.

### 3.2 Projection Methods

**Method 1: UMAP (Uniform Manifold Approximation and Projection)**

UMAP preserves both local and global structure of the high-dimensional data:

```
Input: embedding vectors ∈ R^3072 for all documents
Output: 2D coordinates ∈ R^2

Steps:
1. Fit UMAP model on corpus embeddings (one-time, O(n log n))
2. Transform: embed(doc) → (u, v) ∈ R^2
3. Quantize: (u, v) → (chunk_x, chunk_z) ∈ Z^2
4. Assign to region: region_x = chunk_x // 32, region_z = chunk_z // 32
```

Advantages: excellent preservation of cluster structure. Walking through the world, you encounter neighborhoods of related documents.

Disadvantages: non-deterministic (random initialization), requires refitting when corpus changes significantly, projection is non-invertible.

**Method 2: PCA (Principal Component Analysis)**

Use the first two principal components as spatial coordinates:

```
Input: embedding matrix X ∈ R^{n×3072}
Output: projected coordinates ∈ R^{n×2}

Steps:
1. Compute covariance matrix (or SVD) — O(n × d^2)
2. Take first 2 eigenvectors as projection axes
3. Project: (x, z) = X @ [pc1, pc2]
4. Quantize to integer chunk coordinates
```

Advantages: deterministic, fast, invertible (approximately). New documents can be projected without refitting.

Disadvantages: linear projection misses nonlinear manifold structure.

**Method 3: Morton Codes (Z-order curves)**

For pre-clustered documents where cluster IDs are known:

```
Input: (cluster_id, intra_cluster_rank) for each document
Output: (chunk_x, chunk_z) via Morton interleaving

Steps:
1. Assign cluster_id based on k-means or topic model
2. Within each cluster, order by a secondary criterion (date, subtopic)
3. Interleave bits of (cluster_id, rank) to produce Morton code
4. Decode Morton code to (x, z)
```

Advantages: perfect locality preservation within clusters. Cache-friendly access patterns (see M1 §3.3).

Disadvantages: requires pre-clustering, inter-cluster boundaries are arbitrary.

### 3.3 Y-Axis: Document Structure

The y-axis (vertical) is not projected from embeddings — it encodes **document structure**:

```
y=0:   Section 0 — first chunk of the document
y=1:   Section 1 — second chunk
...
y=19:  Section 19 — twentieth chunk (typical document end)
y=20+: Air (unused sections omitted from storage)
```

Walking upward through a chunk column is like reading a document from beginning to end. The y-axis is the reading dimension; the x-z plane is the similarity dimension.

### 3.4 Coordinate Stability

A critical requirement: **adding new documents should not move existing documents.** If coordinates shift on every ingest, cached region files are invalidated and spatial references break.

Strategies for coordinate stability:

1. **Reserved grid:** Pre-allocate a spatial grid. New documents are assigned to the nearest empty cell. Existing documents never move.
2. **Append-only regions:** New documents go into new region files at the world's expanding frontier. Old regions are immutable after initial ingest.
3. **Periodic rebalance:** Allow coordinate reassignment during explicit "reindex" operations (like a Minecraft world optimization). Between reindexes, coordinates are stable.

VAV uses strategy 2 (append-only) by default, with optional strategy 3 for mature corpora.

---

## 4. API Surface

### 4.1 Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                   RAG Layer                           │
│                                                      │
│  query(text) → ranked_chunks                         │
│  ingest(document) → spatial_coords                   │
│  rerank(query, candidates) → scored_candidates       │
│  generate(query, chunks) → answer                    │
│                                                      │
├─────────────────────────────────────────────────────┤
│                 Minecraft Layer                       │
│                                                      │
│  encode_section(tokens, embedding) → NBT             │
│  decode_section(NBT) → tokens, embedding             │
│  pack_region(sections[]) → Anvil .mca                │
│  unpack_region(.mca) → sections[]                    │
│  coordinate_map(embedding) → (x, y, z)              │
│  palette_build(vocabulary) → block_state_map         │
│                                                      │
├─────────────────────────────────────────────────────┤
│                   Ceph Layer                          │
│                                                      │
│  store_region(key, .mca, xattrs) → ack              │
│  fetch_region(key) → .mca + xattrs                   │
│  list_regions(prefix) → keys[]                       │
│  store_meta(key, data) → ack                         │
│  fetch_meta(key) → data                              │
│  cache_put(key, embedding, ttl) → ack               │
│  cache_get(key) → embedding | miss                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 4.2 Ingest Flow (Write Path)

```
Document (PDF)
    │
    ▼ [RAG Layer: ingest]
Parse → Normalize → Chunk (400 tokens each)
    │
    ▼ [RAG Layer: embed]
Embed each chunk → vectors ∈ R^3072
    │
    ▼ [RAG Layer: coordinate_map]
Map document embedding → (chunk_x, chunk_z)
    │
    ▼ [Minecraft Layer: encode_section]
For each chunk:
    tokens → block states (via palette)
    embedding → NBT TAG_Float array
    metadata → NBT compound tags
    → Section NBT
    │
    ▼ [Minecraft Layer: pack_region]
Collect sections into chunk columns
Pack chunk columns into Anvil .mca format
    │
    ▼ [Ceph Layer: store_region]
Upload .mca as RADOS object
Set xattrs (version, bounds, palette_hash)
Store omap entries (embedding index offsets)
    │
    ▼ [Ceph Layer: store_meta]
Update spatial index in vav-meta
Update vocabulary manifest if new tokens
    │
    Done ✓
```

### 4.3 Query Flow (Read Path)

```
User query: "How does CRUSH distribute objects?"
    │
    ▼ [RAG Layer: query]
Embed query → q ∈ R^3072
    │
    ▼ [RAG Layer: coordinate_map]
Map q → (target_x, target_z) = (3, 7)
    │
    ▼ [Ceph Layer: fetch_region]
Fetch r.0.0.mca (region containing chunk 3,7)
    Also prefetch adjacent: r.0.1.mca, r.1.0.mca (spatial neighbors)
    │
    ▼ [Minecraft Layer: unpack_region]
Deserialize Anvil → extract sections
    │
    ▼ [Minecraft Layer: decode_section]
For each section in target neighborhood:
    Extract vav:embedding → candidate vectors
    Extract vav:text → candidate texts
    │
    ▼ [RAG Layer: vector comparison]
Cosine similarity(q, each candidate) → top-50
    │
    ▼ [RAG Layer: hybrid merge]
BM25 on candidate texts → top-50 sparse
RRF merge dense + sparse → top-30
    │
    ▼ [RAG Layer: rerank]
Cross-encoder(query, top-30) → top-5
    │
    ▼ [RAG Layer: generate]
LLM(query + top-5 contexts) → answer
    │
    Return: answer + source coordinates
    "CRUSH uses a pseudo-random hash... [source: r.0.0.mca (3,7) §4]"
```

---

## 5. Cross-Module Consistency

### 5.1 Schema Versioning

Every component references a shared schema version:

```
Schema Version: 1

Components that must agree:
├── Vocabulary manifest (vav-meta) — token → block state mapping
├── Encoding spec (vav-meta/level.dat) — section layout, padding rules
├── Region xattr: vav.version — must match current schema version
├── Coordinate mapper — projection method + parameters
└── Embedding model — model name + dimension
```

If any component's version disagrees, the system refuses to serve queries until reconciled. This prevents silent corruption from version skew.

### 5.2 Consistency Invariants

These invariants must hold at all times:

1. **Palette completeness:** Every block state present in any section's data array must exist in the vocabulary manifest.
2. **Embedding alignment:** Every section's `vav:embedding.model` must match the world's configured embedding model.
3. **Coordinate uniqueness:** No two documents occupy the same (chunk_x, chunk_z) column.
4. **Region coverage:** Every populated chunk column must be contained in exactly one region file in RADOS.
5. **Index accuracy:** The spatial index in `vav-meta` must list all regions and their coordinate bounds. No region exists outside the index.
6. **Provenance chain:** Every section must contain `vav:source.doc_id` that resolves to an original document in the ingest log.

### 5.3 Validation Checks

Validation runs as a background process (analogous to Ceph's scrubbing):

| Check | Frequency | Cost | Detects |
|-------|-----------|------|---------|
| **Palette hash verification** | Per-read (cheap) | O(1) xattr read | Vocabulary drift |
| **Embedding dimension check** | Per-query | O(k) for k candidates | Model mismatch |
| **Coordinate uniqueness scan** | Daily | O(n) full index scan | Duplicate assignments |
| **Region-index reconciliation** | Weekly | O(r) for r regions | Orphaned regions, missing index entries |
| **Full NBT integrity** | Monthly | O(sections) | Corrupt NBT, broken invariants |

### 5.4 Module Dependency Map

```
M1: Ceph/RADOS Architecture
│   Provides: object storage, replication, CRUSH placement, CephX auth
│   Consumed by: M3 Ceph Layer, M4 Anvil storage target
│
M2: RAG Pipeline Architecture
│   Provides: embedding models, chunking strategy, reranking, hybrid search
│   Consumed by: M3 RAG Layer, M3 encoding scheme
│
M3: Integration Architecture (this module)
│   Provides: encoding scheme, coordinate mapping, API surface, consistency rules
│   Consumes: M1 (storage), M2 (retrieval), M4 (Anvil format)
│   Consumed by: M5 (implementation), M6 (deployment)
│
M4: Anvil Format Deep-Dive (future)
│   Provides: .mca binary format spec, NBT encoding details, section packing
│   Consumed by: M3 Minecraft Layer
│
M5: Reference Implementation (future)
│   Consumes: M3 (full API surface)
│
M6: Deployment & Operations (future)
    Consumes: M1 (cluster ops), M3 (system config), M5 (application)
```

---

## 6. Design Decisions and Trade-offs

### 6.1 Why Anvil Format?

Alternatives considered:

| Format | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Anvil (.mca)** | Battle-tested, browsable in Minecraft, palette compression, section omission | Fixed 32x32 region grid, Minecraft version coupling | **Selected** — browsability is the killer feature |
| **Custom binary** | Maximum flexibility, no version coupling | No ecosystem tools, no browsability | Rejected — loses the "vessel" metaphor |
| **Parquet/Arrow** | Columnar analytics, wide tool support | No spatial structure, no visual navigation | Rejected — optimized for tables, not worlds |
| **HDF5** | Multi-dimensional arrays, compression | Complex API, poor streaming, no game client | Rejected — industrial but not navigable |

The Anvil format is not the most efficient choice for pure storage. It IS the only choice that makes the corpus a world you can walk through.

### 6.2 Why One Token Per Block?

At one token per block, a 400-token chunk uses 400 of 4,096 available positions (9.8% fill rate). This seems wasteful. Alternatives:

- **N tokens per block:** Pack multiple tokens into block state properties. Higher density, but blocks become unreadable — you cannot visually interpret a block that represents 4 tokens.
- **One sentence per block:** Coarser granularity, higher fill rate, but loses token-level mapping.
- **One token per block (selected):** Low fill rate but perfect isomorphism. Every block IS a token. The empty space is features, not waste — padding blocks cost zero storage (air sections are omitted), and the empty space provides room for metadata blocks, visual separators, and future extensions.

### 6.3 Why Three Pools?

A single RADOS pool would be simpler. Three pools provide:

1. **Independent tuning:** Region files are large and cold (erasure coding OK). Metadata is small and critical (always replicated). Cache is ephemeral (low replication, TTL expiry).
2. **Access control:** CephX keyrings scope per pool. A reader cannot modify metadata.
3. **Performance isolation:** Cache pool traffic does not compete with region file I/O for the same PG locks.

---

## Sources

1. Weil, S. A. (2007). *Ceph: Reliable, Scalable, and High-Performance Distributed Storage*. PhD Thesis, UC Santa Cruz.
2. Lewis, P. et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. NeurIPS 2020.
3. Mojang Studios. *Anvil File Format*. Minecraft Wiki. https://minecraft.wiki/w/Anvil_file_format
4. Mojang Studios. *NBT Format*. Minecraft Wiki. https://minecraft.wiki/w/NBT_format
5. Mojang Studios. *Chunk Format*. Minecraft Wiki. https://minecraft.wiki/w/Chunk_format
6. McInnes, L. et al. (2018). *UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction*. arXiv:1802.03426.
7. Morton, G. M. (1966). *A Computer Oriented Geodetic Data Base and a New Technique in File Sequencing*. IBM Technical Report.
8. OpenAI. *Embeddings Guide*. https://platform.openai.com/docs/guides/embeddings
9. Ceph Foundation. *RADOS Gateway*. https://docs.ceph.com/en/latest/radosgw/
