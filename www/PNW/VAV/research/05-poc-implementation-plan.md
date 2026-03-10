# Proof-of-Concept Implementation Plan

> **Module ID:** VAV-POC
> **Domain:** Implementation & Benchmarking
> **Through-line:** *Prove it or shut up.* The thesis claims Minecraft's Anvil format can serve as a RAG storage backend. The PoC must demonstrate a complete encode-store-retrieve-return loop, measure it against baseline formats, and report honest numbers. No hand-waving, no "it should work" — working code and measured latency, or the thesis is a hallucination.

---

## Table of Contents

1. [Objectives](#1-objectives)
2. [Architecture Overview](#2-architecture-overview)
3. [Library Selection](#3-library-selection)
4. [API Surface](#4-api-surface)
5. [Encode Pipeline](#5-encode-pipeline)
6. [Storage Backend Abstraction](#6-storage-backend-abstraction)
7. [Retrieval Pipeline](#7-retrieval-pipeline)
8. [Benchmark Suite](#8-benchmark-suite)
9. [Storage Overhead Analysis](#9-storage-overhead-analysis)
10. [Success Metrics](#10-success-metrics)
11. [Implementation Phases](#11-implementation-phases)
12. [Risk Register](#12-risk-register)
13. [Cross-Reference](#13-cross-reference)
14. [Sources](#14-sources)

---

## 1. Objectives

### 1.1 Primary Goal

Build a Python library that implements a **minimal but complete RAG loop** using Minecraft's Anvil region format as the storage backend:

1. Accept a text document
2. Chunk it into retrieval units
3. Generate or accept embeddings for each chunk
4. Encode each chunk + embedding into an Anvil-format chunk section
5. Write the chunk section to a .mca region file
6. Given a query embedding, retrieve the k most similar chunks by scanning stored embeddings
7. Return the original text

If this loop works — if you can put knowledge in and get it back out, correctly, through the voxel encoding layer — then the thesis is viable. Everything else is optimization.

### 1.2 Secondary Goals

- Measure **write latency** (document to stored .mca)
- Measure **read latency** (query to returned text)
- Measure **retrieval precision** (precision@k compared to a reference brute-force search)
- Measure **storage overhead** (bytes-on-disk compared to raw JSONL, Parquet, and native vector DB formats)
- Validate that the **coordinate mapping** from Module 06 preserves semantic locality

---

## 2. Architecture Overview

### 2.1 Component Diagram

```
Input Document
      |
      v
[Text Chunker] -----> [Embedding Generator]
      |                        |
      v                        v
[Anvil Encoder] <---- chunk_text + embedding + metadata
      |
      v
[Storage Backend] ----> .mca file on local FS (v1)
      |                 RADOS object pool  (v2, mock first)
      v
[Spatial Index] ------> coordinate -> chunk mapping
      |
      v
[Query Engine] <----- query_embedding
      |
      v
[Anvil Decoder] ----> decompress -> parse NBT -> extract text + embedding
      |
      v
Retrieved Chunks (ranked by similarity)
```

### 2.2 Layer Separation

The implementation separates three concerns:

1. **Format layer** (anvil_encoder.py, anvil_decoder.py): Converts between Python objects and Anvil/NBT binary. No knowledge of storage location.
2. **Storage layer** (storage_backend.py): Reads and writes .mca files. Abstracted so local filesystem and Ceph/RADOS share an interface.
3. **Query layer** (query_engine.py): Embedding comparison, spatial lookup, result ranking. No knowledge of binary format.

This separation means you can swap the storage backend (local -> Ceph -> S3) without touching the encoder, or change the embedding model without touching the storage layer.

---

## 3. Library Selection

### 3.1 Core Dependencies

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| **anvil-parser** | >=1.4.0 | .mca region file I/O | Handles header parsing, sector allocation, compression. Pure Python, no native deps. |
| **nbt** | >=1.5.0 | NBT tag construction and manipulation | Direct tag tree access for custom namespace injection. |
| **numpy** | >=1.24 | Embedding arithmetic | Cosine similarity, vector normalization, batch operations. Standard. |
| **boto3** | >=1.28 | S3/RGW object access (v2) | When the storage backend targets Ceph Object Gateway. Optional for v1. |

### 3.2 Optional / Future Dependencies

| Library | Purpose | When |
|---------|---------|------|
| **rados** (python-rados) | Native RADOS protocol access | v2, when bypassing S3 for direct object store |
| **sentence-transformers** | Embedding generation | If PoC includes its own embedding step |
| **pyarrow** | Parquet baseline comparison | Benchmark suite only |
| **h5py** | HDF5 baseline comparison | Benchmark suite only |
| **faiss-cpu** | Reference vector search | Benchmark precision comparison |

### 3.3 Why Not amulet-core?

Amulet is a full world editor with version translation tables, GUI support, and cross-edition compatibility. It is excellent software but carries dependencies and abstractions the PoC does not need. anvil-parser is smaller, simpler, and sufficient for reading and writing .mca files with custom NBT content. If version translation becomes important later (handling worlds saved by different Minecraft versions), amulet-core can be introduced.

---

## 4. API Surface

### 4.1 Core Functions

```python
# --- Encode ---
def encode_document(
    text: str,
    coords: tuple[int, int, int],  # (chunk_x, section_y, chunk_z)
    embedding: np.ndarray,          # float32 vector
    metadata: dict | None = None,
    source_id: str | None = None,
    chunk_index: int = 0
) -> ChunkSection:
    """Encode a text chunk + embedding into an Anvil chunk section."""

# --- Store ---
def store_chunk(
    section: ChunkSection,
    backend: StorageBackend,
) -> str:
    """Write a chunk section to the storage backend. Returns storage key."""

# --- Retrieve ---
def retrieve(
    query_embedding: np.ndarray,
    backend: StorageBackend,
    k: int = 10,
    search_radius: int | None = None,
) -> list[RetrievalResult]:
    """Find k nearest chunks by embedding similarity. Returns ranked results."""
```

### 4.2 Data Classes

```python
@dataclass
class ChunkSection:
    chunk_x: int
    chunk_z: int
    section_y: int
    text: str
    embedding: np.ndarray
    metadata: dict
    source_id: str
    chunk_index: int

@dataclass
class RetrievalResult:
    text: str
    similarity: float
    coords: tuple[int, int, int]
    source_id: str
    chunk_index: int
    metadata: dict
```

### 4.3 Storage Backend Interface

```python
class StorageBackend(Protocol):
    def write_section(self, section: ChunkSection) -> str: ...
    def read_section(self, chunk_x: int, section_y: int, chunk_z: int) -> ChunkSection | None: ...
    def scan_sections(self, region_x: int, region_z: int) -> Iterator[ChunkSection]: ...
    def list_regions(self) -> list[tuple[int, int]]: ...
```

The local filesystem implementation writes to `world/region/r.X.Z.mca`. The mock Ceph implementation writes each region file as a RADOS object keyed by `r.X.Z`. The S3/RGW implementation writes each region file as an S3 object in a bucket.

---

## 5. Encode Pipeline

### 5.1 Text Chunking

The encoder does **not** perform text chunking itself — it accepts pre-chunked text. This is deliberate. Chunking strategy (fixed-size, sentence-boundary, semantic, recursive) is a RAG design decision orthogonal to the storage format. The PoC ships with a simple fixed-size chunker (512 tokens) for benchmarking, but the API accepts any pre-chunked input.

### 5.2 NBT Construction

For each text chunk, the encoder builds an NBT compound tag tree:

```
TAG_Compound("") {
    TAG_Int("DataVersion"): 3463
    TAG_Int("xPos"): chunk_x
    TAG_Int("zPos"): chunk_z
    TAG_Int("yPos"): min_section_y
    TAG_String("Status"): "minecraft:full"
    TAG_List("sections") [TAG_Compound] {
        TAG_Compound {
            TAG_Byte("Y"): section_y
            TAG_Compound("block_states") {
                TAG_List("palette") [TAG_Compound] {
                    TAG_Compound { TAG_String("Name"): "minecraft:stone" }
                }
                // single-entry palette, no data array needed
            }
            TAG_Compound("rag") {
                TAG_List("embedding") [TAG_Float]: [0.123, -0.456, ...]
                TAG_String("source_id"): "doc-001"
                TAG_Int("chunk_index"): 0
                TAG_String("text"): "The actual document text..."
                TAG_Long("timestamp"): 1741564800000
                TAG_Int("version"): 1
                TAG_Compound("metadata") {
                    TAG_String("topic"): "storage systems"
                    TAG_String("author"): "..."
                }
            }
        }
    }
}
```

The `block_states` palette contains a single entry ("minecraft:stone") to produce a valid Minecraft chunk that tools can open. The `rag:` compound holds all knowledge-specific data. This dual-valid design means the .mca file is simultaneously a valid Minecraft world and a RAG database.

### 5.3 Coordinate Assignment

The encode function accepts explicit coordinates. The caller is responsible for mapping document chunks to voxel coordinates — this mapping is the subject of Module 06 (Spatial Embedding Mapping). The PoC provides a simple sequential mapper (chunk 0 -> (0,0,0), chunk 1 -> (1,0,0), ...) and a Hilbert curve mapper for locality-preserving assignment.

---

## 6. Storage Backend Abstraction

### 6.1 Local Filesystem Backend

The simplest backend. Region files live in a directory tree mirroring Minecraft's world structure:

```
world_root/
  region/
    r.0.0.mca
    r.0.-1.mca
    r.1.0.mca
    ...
```

Write path: determine region coords from chunk coords, open or create .mca file, write chunk data via anvil-parser's API, flush to disk. Read path: determine region file path, open .mca, read chunk by local coordinates, decompress and parse NBT, extract `rag:` compound.

### 6.2 Mock Ceph Backend

For the PoC, the Ceph backend is a **mock** that stores region files as individual objects in a local directory, keyed by `r.X.Z`. The interface is identical to the real Ceph backend but uses filesystem operations instead of RADOS calls. This lets us develop and benchmark the full pipeline without a running Ceph cluster.

When the mock is replaced with real Ceph (via python-rados or boto3 targeting Ceph RGW), the only change is the transport layer — the .mca binary format, encoding, and decoding remain identical.

### 6.3 S3/RGW Backend

For deployments where Ceph exposes an S3-compatible gateway (RGW), the backend stores each .mca file as an S3 object:

```
Bucket: vav-knowledge-store
Key: region/r.0.0.mca
```

boto3 handles uploads and downloads. The .mca file is the S3 object body, complete with headers and compressed chunks. This means standard S3 tooling (aws cli, Cyberduck, rclone) can inspect the stored data directly.

---

## 7. Retrieval Pipeline

### 7.1 Brute-Force Scan (v1)

The initial retrieval strategy is exhaustive: scan all stored sections, extract embeddings, compute cosine similarity against the query embedding, return the top-k results. This is O(n) in the number of stored sections — intentionally naive, because the PoC must establish a **correctness baseline** before optimizing for speed.

```python
def retrieve_brute_force(query: np.ndarray, backend: StorageBackend, k: int) -> list:
    results = []
    for rx, rz in backend.list_regions():
        for section in backend.scan_sections(rx, rz):
            sim = cosine_similarity(query, section.embedding)
            results.append((sim, section))
    results.sort(key=lambda x: x[0], reverse=True)
    return results[:k]
```

### 7.2 Spatial-Bounded Scan (v1.5)

When the coordinate mapping preserves semantic locality (Module 06), retrieval can be bounded: start at the query embedding's projected coordinates and scan outward in expanding rings. Stop when the spatial distance exceeds a threshold or the result set is full. This is not approximate nearest neighbor in the traditional sense — it exploits the locality guarantee of the coordinate mapping to prune the search space.

### 7.3 Index-Accelerated Retrieval (v2)

For production-scale corpora, an external spatial index (R-tree or k-d tree over chunk coordinates) accelerates lookup. The index maps coordinate bounding boxes to region/chunk addresses. Combined with a locality-preserving coordinate mapping, this achieves sub-linear retrieval without requiring a specialized vector database.

---

## 8. Benchmark Suite

### 8.1 Test Corpus

The benchmark uses a **standardized test corpus** for reproducibility:

| Corpus | Size | Chunks (512-token) | Purpose |
|--------|------|---------------------|---------|
| Small | 100 documents | ~1,000 chunks | Development iteration |
| Medium | 10,000 documents | ~100,000 chunks | Latency profiling |
| Large | 100,000 documents | ~1,000,000 chunks | Scale behavior |

Documents sourced from public domain text (Project Gutenberg, Wikipedia dumps, arXiv abstracts) to avoid licensing concerns.

### 8.2 Benchmark Dimensions

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Write latency** | Time from (text, embedding) to flushed .mca | Report p50, p95, p99 |
| **Read latency** | Time from query embedding to returned text | <100ms p95 (local, small corpus) |
| **Retrieval precision** | precision@10 vs. brute-force numpy baseline | Within 5% of reference |
| **Storage overhead** | Bytes on disk per document chunk | Report ratio vs. baselines |
| **Compression ratio** | Compressed .mca size vs. uncompressed NBT | Report |
| **Throughput** | Chunks written per second, chunks read per second | Report |

### 8.3 Baseline Comparisons

To contextualize the Anvil format's overhead, the benchmark suite compares against:

| Format | Implementation | Notes |
|--------|---------------|-------|
| **Raw JSONL** | One JSON object per line, embedding as float array | Simplest possible baseline |
| **Parquet** | pyarrow, columnar, Snappy compression | Industry standard for analytics |
| **SQLite + numpy** | Text in SQLite, embeddings as numpy .npy blobs | Common lightweight RAG approach |
| **FAISS flat index** | faiss-cpu IndexFlatIP | Reference vector search performance |

The comparison is not meant to prove Anvil is "better" — it is meant to quantify the cost of spatial indexability and Minecraft compatibility. If the overhead is 2x raw JSONL, that may be acceptable. If it is 20x, the thesis needs revision.

---

## 9. Storage Overhead Analysis

### 9.1 Per-Chunk Budget

For a single document chunk with a 1024-dim float32 embedding:

| Component | Raw Size | Notes |
|-----------|----------|-------|
| Embedding (1024 floats) | 4,096 bytes | TAG_List header adds 5 bytes |
| Text (avg 2KB) | ~2,000 bytes | TAG_String with UTF-8 |
| Metadata | ~200 bytes | Source ID, chunk index, timestamp, version |
| NBT structure overhead | ~150 bytes | Compound tags, names, type bytes |
| Block states (minimal) | ~50 bytes | Single-palette entry, no data array |
| **Uncompressed total** | **~6,500 bytes** | |
| **Zlib compressed** | **~4,000-5,000 bytes** | Embeddings compress poorly; text compresses well |

### 9.2 Per-Region Budget

A full region (1024 chunks x 1 section each):

| Metric | Value |
|--------|-------|
| Header | 8,192 bytes (fixed) |
| Chunk data | ~4,000 x 1024 = ~4 MiB compressed |
| **Total .mca file** | **~4 MiB** for 1,024 document chunks |

### 9.3 Comparison Projections

For 1,000 document chunks (1024-dim, 2KB text each):

| Format | Estimated Size | Ratio vs. JSONL |
|--------|---------------|-----------------|
| Raw JSONL (uncompressed) | ~6.5 MB | 1.0x |
| Raw JSONL (gzip) | ~4.5 MB | 0.69x |
| Parquet (Snappy) | ~4.2 MB | 0.65x |
| Anvil .mca (zlib) | ~4.0 MB | 0.62x |
| SQLite + numpy | ~5.8 MB | 0.89x |

The Anvil format's per-chunk zlib compression, combined with palette deduplication for block states, makes it surprisingly competitive on storage size. The overhead is in the header (8 KiB fixed per region) and the NBT structural bytes — both amortized across chunks in a region.

---

## 10. Success Metrics

### 10.1 Must-Pass (P0)

| Metric | Criterion | Rationale |
|--------|-----------|-----------|
| Roundtrip correctness | 100% of stored text recovered exactly | Non-negotiable. Data integrity is binary. |
| End-to-end latency (local) | p95 < 100ms for retrieve(k=10) on small corpus | Proves the format isn't prohibitively slow |
| Precision@10 | Within 5% of numpy brute-force baseline | Proves the encoding doesn't corrupt similarity |
| Valid .mca output | Files open in NBTExplorer and Minecraft | Proves dual-validity (game world + knowledge store) |

### 10.2 Should-Pass (P1)

| Metric | Criterion | Rationale |
|--------|-----------|-----------|
| Storage overhead | < 2x vs. raw JSONL (gzip) | Spatial indexing shouldn't cost more than 2x |
| Write throughput | > 100 chunks/sec (local SSD) | Ingest must not be a bottleneck |
| Spatial locality | Semantically similar chunks within 5-chunk radius | Validates Module 06 mapping |

### 10.3 Nice-to-Have (P2)

| Metric | Criterion | Rationale |
|--------|-----------|-----------|
| Mock Ceph latency | < 2x local latency | Validates backend abstraction |
| Minecraft walkability | World loads in game client, chunks visible | Cool demo, not technically required |

---

## 11. Implementation Phases

### 11.1 Phase 1: Encoder/Decoder (Week 1)

- Implement `encode_document()` and decode functions
- NBT tag construction with custom `rag:` namespace
- Unit tests: roundtrip encode->decode for text, embeddings, metadata
- Validation: output files parse with NBTExplorer

### 11.2 Phase 2: Storage Backend (Week 1-2)

- Implement local filesystem backend
- Implement mock Ceph backend (local directory, RADOS-like interface)
- Integration tests: encode->store->retrieve roundtrip
- Validation: .mca files open in Minecraft

### 11.3 Phase 3: Query Engine (Week 2)

- Implement brute-force retrieval
- Implement spatial-bounded retrieval
- Precision tests against numpy reference
- Latency profiling

### 11.4 Phase 4: Benchmarks (Week 3)

- Generate test corpora (small, medium)
- Run benchmark suite across all formats
- Produce comparison tables and latency distributions
- Write benchmark report

### 11.5 Phase 5: Report (Week 3)

- Document results in research module format
- Update thesis with empirical findings
- Identify v2 optimization targets

---

## 12. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| anvil-parser lacks custom tag support | High | Medium | Fall back to nbt library for direct .mca construction |
| Zlib overhead dominates latency | Medium | Low | Profile and consider LZ4 or uncompressed mode |
| Embedding floats compress poorly | Low | High | Expected; budget accordingly. Consider quantization. |
| Coordinate mapping breaks locality | High | Medium | Module 06 research; PoC includes locality validation |
| .mca files rejected by Minecraft | Low | Low | Validate with game client early in Phase 1 |
| python-rados unavailable on test system | Medium | Medium | Mock backend first; real Ceph integration is v2 |

---

## 13. Cross-Reference

| Module | Connection |
|--------|------------|
| M1 (Thesis) | PoC validates the core thesis claim |
| M2 (Ceph/RADOS) | Storage backend abstraction targets Ceph as v2 backend |
| M3 (RAG Pipeline) | PoC implements the complete pipeline described in M3 |
| M4 (Anvil/NBT) | Format specification that the encoder implements |
| M6 (Spatial Mapping) | Coordinate assignment strategy used by the encoder |
| M7 (v2 Seed Space) | PoC results inform seed-space design decisions |

---

## 14. Sources

| ID | Reference |
|----|-----------|
| SRC-ANVIL-PY | matcool. "anvil-parser." https://github.com/matcool/anvil-parser |
| SRC-NBT-PY | twoolie. "NBT." https://github.com/twoolie/NBT |
| SRC-AMULET | Amulet Team. "Amulet Map Editor." https://github.com/Amulet-Team/Amulet-Map-Editor |
| SRC-FAISS | Meta AI. "FAISS: A Library for Efficient Similarity Search." https://github.com/facebookresearch/faiss |
| SRC-PARQUET | Apache Software Foundation. "Apache Parquet." https://parquet.apache.org/ |
| SRC-SENTENCE-TX | Reimers, N. and Gurevych, I. "Sentence-BERT." https://www.sbert.net/ |
| SRC-REGION | Minecraft Wiki. "Region file format." https://minecraft.wiki/w/Region_file_format |
| SRC-CHUNK | Minecraft Wiki. "Chunk format." https://minecraft.wiki/w/Chunk_format |
