# M7: Block and Chunk Data Deep Dive

> **Module ID:** VAV-BLOCK
> **Domain:** BlockState Encoding, Chunk Generation, RAG Isomorphism Formalization
> **Through-line:** *The palette is the vocabulary. The bits-per-entry is the entropy. The section is the document.* This module formalizes what v1 sketched: the mathematical equivalence between Minecraft's palette-compressed block storage and a RAG corpus's tokenized document store. Every block in a section has a palette index. Every token in a document has a vocabulary index. The encoding function is the same function. The compression is the same compression. The retrieval path is the same path. This is not analogy — it is isomorphism, and here we prove it.

---

## Table of Contents

1. [BlockState Palette Compression (Java 1.18+)](#1-blockstate-palette-compression-java-118)
2. [Chunk Generation Pipeline](#2-chunk-generation-pipeline)
3. [RAG Isomorphism Formalization](#3-rag-isomorphism-formalization)
4. [Wire-Format Examples](#4-wire-format-examples)
5. [Storage Analysis](#5-storage-analysis)
6. [Connection to v1 Modules](#6-connection-to-v1-modules)
7. [Sources](#7-sources)

---

## 1. BlockState Palette Compression (Java 1.18+)

### 1.1 The Section as Data Container

Every chunk in a Minecraft world is divided vertically into **sections** — 16x16x16 cubes of 4,096 block positions. Since 1.18, a chunk spans Y=-64 to Y=319 (384 blocks), yielding 24 sections indexed from Y=-4 to Y=19. Each section independently stores its own block data through a palette-compressed scheme defined in the `block_states` NBT compound. [SRC-CHUNK]

The `block_states` compound contains exactly two fields:

| Field | NBT Type | Description |
|-------|----------|-------------|
| `palette` | TAG_List of TAG_Compound | Ordered list of unique block state descriptors present in this section |
| `data` | TAG_Long_Array | Packed integer array of palette indices, one per block position |

When a section contains only a single block type (e.g., entirely air), the `data` field is omitted — the palette alone (a single entry) fully describes all 4,096 positions. This is the ultimate compression: zero bits per entry when the vocabulary has exactly one word. [SRC-CHUNK]

### 1.2 Palette Entries

Each palette entry is a TAG_Compound with:

- **`Name`** (TAG_String, required): The namespaced block identifier, e.g., `"minecraft:stone"`, `"minecraft:oak_log"`.
- **`Properties`** (TAG_Compound, optional): Key-value pairs describing the block state variant. For example, an oak log has `axis: "y"`, a stair has `facing: "north"`, `half: "bottom"`, `shape: "straight"`, `waterlogged: "false"`.

The palette is ordered — the index of each entry in the TAG_List is the integer stored in the packed `data` array. Palette index 0 is the first entry, index 1 is the second, and so on. The palette is local to each section; two sections in the same chunk may have entirely different palettes with different orderings.

**Palette size in practice:**

| Terrain Type | Typical Palette Size | Example Block States |
|---|---|---|
| Deep underground (stone layer) | 2-5 | stone, deepslate, air (caves), lava, bedrock |
| Forest surface | 15-30 | grass_block, dirt, oak_log, oak_leaves, air, dandelion, tall_grass, water, ... |
| Village structure | 40-80 | cobblestone, oak_planks, glass_pane, oak_door, torch, chest, bed, ... |
| Decorated interior | 80-128+ | All furniture blocks, redstone components, glazed terracotta variants, ... |

### 1.3 Bits-Per-Entry Calculation

The number of bits used to represent each palette index is:

```
bits_per_entry = max(4, ceil(log2(palette_size)))
```

The minimum is **4 bits**, enforced even when the palette contains fewer than 16 entries. This minimum exists because the indirect palette encoding (palette + packed data) is only used for palette sizes from 1 to a threshold. Above the threshold, a direct encoding using global block state IDs replaces the palette entirely. [SRC-CHUNK]

The bits-per-entry progression:

| Palette Size | Raw Bits Needed | Actual BPE | Entries Per Long | Wasted Bits Per Long |
|---|---|---|---|---|
| 1 | 0 | (data omitted) | N/A | N/A |
| 2-16 | 1-4 | 4 | 16 | 0 |
| 17-32 | 5 | 5 | 12 | 4 |
| 33-64 | 6 | 6 | 10 | 4 |
| 65-128 | 7 | 7 | 9 | 1 |
| 129-256 | 8 | 8 | 8 | 0 |
| 257-512 | 9 | 9 | 7 | 1 |
| 513-1024 | 10 | 10 | 6 | 4 |
| 1025-2048 | 11 | 11 | 5 | 9 |
| 2049-4096 | 12 | 12 | 5 | 4 |

### 1.4 Packed Long Array Layout

Since Java Edition 1.16 (20w17a), palette indices are packed into 64-bit longs with a critical constraint: **entries do not span long boundaries**. Each long holds `floor(64 / bpe)` complete entries, and the remaining bits at the top of the long are unused padding. [SRC-CHUNK]

For 4 bits per entry:

```
Long layout (4 bpe, 16 entries per long):
Bit: 63                                                           0
     [pad][entry15][entry14]...[entry2][entry1][entry0]
     [0000][iiii][iiii]...[iiii][iiii][iiii]

     Each [iiii] = 4-bit palette index (0-15)
     16 entries x 4 bits = 64 bits, 0 bits padding
```

For 5 bits per entry:

```
Long layout (5 bpe, 12 entries per long):
Bit: 63                                                           0
     [pad ][entry11][entry10]...[entry1][entry0]
     [0000][iiiii][iiiii]...[iiiii][iiiii]

     Each [iiiii] = 5-bit palette index (0-31)
     12 entries x 5 bits = 60 bits, 4 bits padding
```

The total number of longs required for a full section:

```
entries_per_long = floor(64 / bpe)
longs_needed     = ceil(4096 / entries_per_long)
```

For the common cases:

| BPE | Entries/Long | Longs Needed | Data Bytes |
|---|---|---|---|
| 4 | 16 | 256 | 2,048 |
| 5 | 12 | 342 | 2,736 |
| 6 | 10 | 410 | 3,280 |
| 7 | 9 | 456 | 3,648 |
| 8 | 8 | 512 | 4,096 |
| 12 | 5 | 820 | 6,560 |

### 1.5 Block Index Ordering

Blocks within the packed array follow a fixed linear order derived from their 3D coordinates within the section:

```
block_index = ((y * 16) + z) * 16 + x
```

Where x, y, z range from 0 to 15. This maps the 3D section space into a linear sequence: block (0,0,0) is index 0, block (1,0,0) is index 1, block (15,0,0) is index 15, block (0,0,1) is index 16, and so on through block (15,15,15) at index 4095.

The Y-major ordering means that a horizontal layer (constant Y) occupies 256 contiguous indices. This favors terrain storage, where horizontal layers tend to be homogeneous (all stone at depth, all air above surface). For RAG document encoding, this ordering means the x-z plane at each y level is a natural "page" — 256 token positions arranged in a 16x16 grid, with y-levels stacking pages into a volume.

---

## 2. Chunk Generation Pipeline

### 2.1 The Eight Stages

Minecraft's world generation follows a deterministic, staged pipeline. Each stage reads the output of previous stages and writes new data into the chunk. The stages execute in strict order, and a chunk's `Status` field records the last completed stage. Understanding this pipeline matters for VAV because the RAG ingest pipeline maps to it — each stage transforms raw material into increasingly structured output. [SRC-WORLDGEN]

| # | Stage | Description | VAV Analogue |
|---|---|---|---|
| 1 | `empty` | Chunk allocated, no data generated | Document ID assigned |
| 2 | `structure_starts` | Structure bounding boxes placed (villages, strongholds, mineshafts) | Document metadata extracted (title, headings, sections) |
| 3 | `structure_references` | Cross-chunk structure references linked | Cross-document references resolved (citations, hyperlinks) |
| 4 | `biomes` | 3D biome assignment per 4x4x4 cube (64 entries per section) using multi-noise router | Topic classification per chunk (64 topic labels per section at coarse resolution) |
| 5 | `noise` | Base terrain density from 50+ octaves of Perlin/simplex noise; 3D climate map per quarter-chunk (temperature, humidity, continentalness, erosion, weirdness, depth) | Base embedding computation — the "shape" of the document in vector space |
| 6 | `surface` | Surface block placement: grass_block, sand, snow, mycelium based on biome | Surface-level formatting: sentence boundaries, paragraph markers, section headers |
| 7 | `carvers` | Cave and ravine carving into the terrain | Content pruning: removing boilerplate, deduplicating, stripping noise |
| 8 | `features` | Trees, ores, flowers, lakes, structures finalized, entity spawning | Feature extraction: named entities, key phrases, semantic tags |

After all 8 stages complete, the chunk status becomes `full` — ready for use. [SRC-WORLDGEN]

### 2.2 Noise Generation Detail

The noise stage is the most computationally expensive and the most relevant to the VAV isomorphism. Minecraft uses a **multi-noise router** that combines over 50 independent noise maps to produce a single density value at each block position. The six climate parameters — temperature, humidity, continentalness, erosion, weirdness, and depth — form a 6-dimensional vector at each position that determines biome placement. [SRC-WORLDGEN-ZUCCONI]

```
Climate vector at position (x, y, z):
  C(x,y,z) = [temperature, humidity, continentalness, erosion, weirdness, depth]

Biome selection:
  biome = argmin_b || C(x,y,z) - B(b) ||

Where B(b) is the target climate vector for biome b.
```

This is a nearest-neighbor lookup in 6D climate space — structurally identical to a k-NN query in RAG embedding space. The biome assignment IS a retrieval operation: given a query point (the block's climate vector), find the closest entry in the biome vocabulary. The block receives the biome label the way a document chunk receives a topic label — by proximity in parameter space.

### 2.3 Heightmaps

After generation completes, four heightmap arrays are computed and stored in the chunk's `Heightmaps` NBT compound:

| Heightmap | What It Records | RAG Analogue |
|---|---|---|
| `WORLD_SURFACE` | Highest non-air block (Y coordinate) | Document length (number of non-empty token positions) |
| `MOTION_BLOCKING` | Highest block that blocks entity motion | Semantic density ceiling (highest-weight section) |
| `OCEAN_FLOOR` | Highest solid block (ignores water) | Core content boundary (excluding boilerplate) |
| `MOTION_BLOCKING_NO_LEAVES` | Highest motion-blocking block excluding leaves | Core content boundary excluding metadata |

Each heightmap entry is a 9-bit value (range 0-384) packed into a TAG_Long_Array. With 256 entries per chunk (16x16 columns) and 7 entries per long (floor(64/9) = 7), each heightmap occupies `ceil(256/7) = 37 longs = 296 bytes`. [SRC-CHUNK]

Heightmaps provide a 2D summary projection of a 3D structure — exactly what a document embedding provides for a multi-section document. The WORLD_SURFACE heightmap of a chunk column is a compressed representation of "how much content is here at each (x,z) position," analogous to a document's token-count-per-section profile.

### 2.4 Light Propagation

Light data is stored per-section in two nibble arrays (4 bits per block, 2,048 bytes each): `BlockLight` (emitted by torches, lava, glowstone; range 0-15) and `SkyLight` (from the sky, attenuated by opacity; range 0-15). Light propagates via flood-fill, decaying by 1 per block for block light.

For VAV, the light layer provides a natural **relevance heat map**: blocks near a light source (query match) have high light values. Light decays with distance — relevance decays with semantic distance. The 4-bit range (0-15) maps to a confidence score discretized into 16 levels.

---

## 3. RAG Isomorphism Formalization

### 3.1 The Encoding Function

The v1 modules (M3, M4) sketched the palette-vocabulary correspondence. Here we formalize it.

**Definition.** Let V = {v_1, v_2, ..., v_n} be a vocabulary of n unique tokens. Let P = {p_0, p_1, ..., p_{n-1}} be a palette of n block state descriptors. The **encoding function** E: V -> P is a bijection:

```
E(v_i) = p_{i-1}    for i in {1, ..., n}
```

The **decoding function** D: P -> V is the inverse:

```
D(p_j) = v_{j+1}    for j in {0, ..., n-1}
```

**Theorem (Round-Trip Identity).** For all tokens t in V:

```
D(E(t)) = t
```

*Proof.* E(v_i) = p_{i-1}. D(p_{i-1}) = v_{(i-1)+1} = v_i. Since t = v_i, D(E(t)) = t. The composition is the identity on V. QED.

The bijection ensures lossless encoding: every token maps to exactly one block state, every block state maps to exactly one token, and no information is lost in the round trip. This is the foundation the entire VAV system rests on.

### 3.2 Information-Theoretic Entropy

**Definition.** A section with palette size |P| = n has a **vocabulary entropy** of:

```
H_max = ceil(log_2(n)) bits per entry
```

This is the maximum entropy — achieved when all palette entries are equally likely. In practice, block distributions in Minecraft sections are highly skewed (stone and air dominate underground sections), just as token distributions in natural language are highly skewed (the, a, is dominate English text). The actual Shannon entropy is:

```
H = -sum_{i=0}^{n-1} p_i * log_2(p_i)
```

Where p_i is the frequency of palette entry i among the 4,096 block positions. H <= H_max, with equality when all entries are equi-probable.

**The palette compression ratio** is:

```
CR = H_max / H_uncompressed = ceil(log_2(n)) / ceil(log_2(N_global))
```

Where N_global is the total number of possible block states (~26,000 in Java 1.21 when all property combinations are enumerated). Without palette compression, each block would require ceil(log_2(26000)) = 15 bits. A section with 8 unique block states uses max(4, ceil(log_2(8))) = 4 bits — a 3.75x compression ratio over global addressing.

This is identical to how vocabulary-indexed tokenization compresses text. A document that uses only 500 of the 100,000 tokens in a tokenizer's vocabulary can represent each token in ceil(log_2(500)) = 9 bits instead of ceil(log_2(100000)) = 17 bits — a 1.89x compression ratio.

### 3.3 The Complete Isomorphism Table

| Minecraft Concept | RAG Concept | Mathematical Bridge |
|---|---|---|
| Palette entry | Token type | E: V -> P (bijective encoding function) |
| Palette size \|P\| | Vocabulary size \|V\| | \|P\| = \|V\|; same finite set cardinality |
| Bits-per-entry (BPE) | Vocabulary entropy | H = max(4, ceil(log_2(\|V\|))) bits per token |
| Packed long array | Document body | Linear sequence of encoded tokens |
| Block index (y*256 + z*16 + x) | Token position | Position in linear array, 0-indexed |
| Section (16x16x16 = 4096 blocks) | Document chunk | Fixed-length 4096-token document unit |
| Chunk column (24 sections) | Document | 24 chunks stacked = 98,304 token positions |
| Region file (32x32 = 1024 chunks) | Corpus shard | 1024 documents in one storage unit |
| World (unbounded regions) | Full corpus | Unbounded document collection |
| Palette deduplication | Tokenizer vocabulary | Both reduce entropy via deduplication of repeated symbols |
| `data` omitted (single-entry palette) | Empty/uniform document | Zero entropy: one symbol repeated 4096 times |
| Biome palette (4x4x4 = 64 entries) | Topic labels (coarse) | Coarse-grained metadata at 1/64th resolution |
| Light level (0-15) | Relevance score | 4-bit discretized confidence/relevance |
| Heightmap (9-bit per column) | Document density profile | 2D projection summarizing vertical extent |

### 3.4 Structural Preservation Properties

The isomorphism preserves three structural properties:

**1. Containment hierarchy.** Token in chunk in document in corpus maps to block in section in chunk-column in region. Every level of the text hierarchy has a corresponding level in the voxel hierarchy, and the containment relationships are preserved:

```
t in C in D in K   <=>   b in S in CC in R

where:
  t  = token,        b  = block
  C  = text chunk,   S  = section
  D  = document,     CC = chunk column
  K  = corpus shard, R  = region file
```

**2. Adjacency.** Tokens adjacent in the source text occupy adjacent block positions in the section (by the linear index formula). Chunks from the same document occupy vertically adjacent sections (stacked on the y-axis). Documents that are semantically similar occupy spatially adjacent chunk columns (via the embedding-to-coordinate projection from M6).

**3. Compression equivalence.** Both systems achieve compression through the same mechanism: maintain a local dictionary of unique symbols (palette / vocabulary), then represent each position as an index into that dictionary. The compression ratio in both cases is determined by the ratio of unique symbols to total symbols — i.e., the redundancy of the content.

### 3.5 Edge Cases and Overflow

**Maximum palette size.** A section can have at most 4,096 unique block states (every position different). At this maximum, BPE = 12, and the packed data array is 820 longs (6,560 bytes). Beyond a configurable threshold (implementation-dependent, typically palette_size > some value between 16 and 4096), the game switches to a **direct encoding** using global block state IDs instead of a local palette. [SRC-CHUNK]

**Vocabulary overflow.** If a RAG corpus vocabulary exceeds the number of representable block states (~26,000 unique states in vanilla Minecraft), the encoding function E cannot be injective over the full vocabulary. Solutions:

1. **Multi-section splitting** — distribute the vocabulary across sections, each section handling a vocabulary shard.
2. **Property encoding** — use block state properties (facing, waterlogged, axis, etc.) as additional encoding bits, expanding the effective vocabulary size.
3. **Custom block states** — via resource packs or data packs, define additional block states with custom property enumerations (see M8: Texture/Resource Packs).

In practice, 26,000 unique block states is sufficient for most vocabularies. The cl100k_base tokenizer (used by GPT-4) has 100,256 tokens, but a typical document uses only 2,000-5,000 unique tokens — well within a single section's palette capacity.

---

## 4. Wire-Format Examples

### 4.1 Example 1: Minimal Section (Stone and Air)

A section deep underground containing only stone and air — the simplest non-trivial case. Two palette entries, 4 bits per entry (the minimum).

```nbt
TAG_Compound("") {
  TAG_Byte("Y"): 0
  TAG_Compound("block_states") {
    TAG_List("palette") [TAG_Compound, 2 entries]: [
      TAG_Compound { TAG_String("Name"): "minecraft:air" },
      TAG_Compound { TAG_String("Name"): "minecraft:stone" }
    ]
    TAG_Long_Array("data") [256 longs]: [
      // Palette index 0 = air, index 1 = stone
      // 4 bpe, 16 entries per long
      // Solid stone (y=0..14) except top layer air (y=15)
      0x1111111111111111L,  // 16x stone — 240 longs for layers 0-14
      ...
      0x0000000000000000L,  // 16x air — 16 longs for layer 15
      ...
    ]
  }
  TAG_Compound("biomes") {
    TAG_List("palette") [TAG_Compound, 1 entry]: [
      TAG_Compound { TAG_String("Name"): "minecraft:plains" }
    ]
    // No "data" field — single biome, zero entropy
  }
  TAG_Byte_Array("BlockLight") [2048 bytes]: [0, 0, 0, ...]
  TAG_Byte_Array("SkyLight") [2048 bytes]: [0, 0, 0, ...]
}
```

**Binary size breakdown:**

| Component | Bytes | Notes |
|---|---|---|
| Palette (2 entries + list overhead) | 55 | Two TAG_Compound entries (~24+26 bytes) + list header (5 bytes) |
| `data` TAG_Long_Array | 2,056 | type (1) + name (6) + count (4) + 256 longs * 8 bytes |
| Biome palette (1 entry) | 30 | Single-entry, no data array needed |
| Light arrays (BlockLight + SkyLight) | 4,108 | 2 * (type + name + length + 2048 bytes) |
| Section envelope | ~20 | Compound tags, Y byte |
| **Total uncompressed** | **~6,270** | Before zlib |
| **Estimated compressed** | **~200-400** | Highly compressible (repetitive data) |

### 4.2 Example 2: Forest Surface Section (6 Block Types)

A section at the surface of a forest biome. Six palette entries, still 4 BPE (since 6 < 16). This example shows how Properties compounds add palette overhead.

```nbt
TAG_Compound("") {
  TAG_Byte("Y"): 4
  TAG_Compound("block_states") {
    TAG_List("palette") [TAG_Compound, 6 entries]: [
      TAG_Compound { TAG_String("Name"): "minecraft:air" },
      TAG_Compound { TAG_String("Name"): "minecraft:grass_block"
        TAG_Compound("Properties") { TAG_String("snowy"): "false" } },
      TAG_Compound { TAG_String("Name"): "minecraft:dirt" },
      TAG_Compound { TAG_String("Name"): "minecraft:oak_log"
        TAG_Compound("Properties") { TAG_String("axis"): "y" } },
      TAG_Compound { TAG_String("Name"): "minecraft:oak_leaves"
        TAG_Compound("Properties") {
          TAG_String("distance"): "1"
          TAG_String("persistent"): "false"
          TAG_String("waterlogged"): "false" } },
      TAG_Compound { TAG_String("Name"): "minecraft:short_grass" }
    ]
    TAG_Long_Array("data") [256 longs]: [
      0x2222222222222222L,  // y=0..2: 16x dirt (48 longs, 3 layers)
      ...
      0x1111111311111111L,  // y=3: grass_block + oak_log trunk (16 longs)
      ...
      0x0000000300000000L,  // y=4..8: air + trunk + canopy (80 longs)
      0x0000044400000000L,  // oak_leaves cluster
      ...
      0x0000000000000000L,  // y=9..15: pure air (112 longs)
      ...
    ]
  }
}
```

**Palette overhead for 6 entries:** ~259 bytes (air: 24B, grass_block+props: 52B, dirt: 25B, oak_log+props: 42B, oak_leaves+3 props: 86B, short_grass: 30B). The palette cost grows with the number of properties per entry — a section with redstone components (3-5 properties each) will have proportionally larger palette overhead even with a modest entry count.

### 4.3 Example 3: RAG-Encoded Section (Document Chunk)

A section encoding a 400-token text chunk. Palette entries represent tokens, not terrain. This is what a VAV document chunk looks like on disk.

```nbt
TAG_Compound("") {
  TAG_Byte("Y"): 0
  TAG_Compound("block_states") {
    TAG_List("palette") [TAG_Compound, 187 entries]: [
      // 187 unique tokens in this 400-token chunk
      TAG_Compound { TAG_String("Name"): "minecraft:air" },           // padding
      TAG_Compound { TAG_String("Name"): "minecraft:stone" },         // "the"
      TAG_Compound { TAG_String("Name"): "minecraft:granite" },       // "of"
      TAG_Compound { TAG_String("Name"): "minecraft:diorite" },       // "and"
      TAG_Compound { TAG_String("Name"): "minecraft:andesite" },      // "to"
      TAG_Compound { TAG_String("Name"): "minecraft:emerald_block" }, // "photosynthesis"
      TAG_Compound { TAG_String("Name"): "minecraft:diamond_block" }, // "mitochondria"
      ...  // (187 entries total)
    ]
    // 187 entries -> ceil(log2(187)) = 8 bpe, 8 entries/long, 512 longs
    TAG_Long_Array("data") [512 longs]: [
      // "the" "process" "of" "photosynthesis" ... -> indices 1, 37, 2, 5 ...
      0x0502250100000001L,  // First 8 entries (right to left)
      ...
    ]
  }
  TAG_Compound("vav:meta") {                                // RAG metadata
    TAG_String("vav:source_id"): "doc_2847"
    TAG_Int("vav:chunk_index"): 0
    TAG_String("vav:text"): "The process of photosynthesis ..."
    TAG_Long("vav:timestamp"): 1741564800000L
    TAG_Int("vav:version"): 1
  }
  TAG_Compound("vav:embedding") {                           // Dense vector
    TAG_String("model"): "text-embedding-3-large"
    TAG_Short("dim"): 1024
    TAG_List("vector") [TAG_Float, 1024 entries]: [0.0234F, -0.1567F, ...]
  }
}
```

**Storage budget:** Palette (187 entries, ~30 B each): ~5,610 B. Data array (512 longs): 4,104 B. vav:meta compound: ~450 B. vav:embedding (1024 floats): 4,120 B. Overhead: ~50 B. **Total uncompressed: ~14,334 B (~14 KiB). Estimated compressed: ~6-8 KiB** (palette strings compress well; float vectors resist compression).

---

## 5. Storage Analysis

### 5.1 Per-Section Storage by Palette Size

The quantitative analysis v1 deferred (retrospective item 3.2). Here are concrete numbers for the `data` array alone, plus estimated palette overhead:

| Palette Size | BPE | Data Bytes | Palette Bytes (est.) | Section Total (est.) | Notes |
|---|---|---|---|---|---|
| 1 | 0 | 0 | ~30 | ~30 | Single block type, data omitted |
| 2 | 4 | 2,048 | ~55 | ~2,103 | Minimum non-trivial |
| 8 | 4 | 2,048 | ~240 | ~2,288 | Typical underground |
| 16 | 4 | 2,048 | ~480 | ~2,528 | 4-BPE ceiling |
| 32 | 5 | 2,736 | ~960 | ~3,696 | Surface terrain |
| 64 | 6 | 3,280 | ~1,920 | ~5,200 | Complex structure |
| 128 | 7 | 3,648 | ~3,840 | ~7,488 | Heavily decorated |
| 256 | 8 | 4,096 | ~7,680 | ~11,776 | Very diverse section |
| 512 | 9 | 4,560 | ~15,360 | ~19,920 | Approaching practical maximum |
| 4096 | 12 | 6,560 | ~122,880 | ~129,440 | Theoretical maximum (every block unique) |

*Palette byte estimates assume ~30 bytes per entry (Name string + compound overhead). Entries with Properties compounds will be larger.*

### 5.2 Per-Chunk and Per-Region Totals

Aggregating from section to chunk to region for a typical RAG-encoded corpus:

**Assumptions for RAG encoding:**
- Average 187 unique tokens per 400-token chunk (empirical for English text)
- BPE = 8 (ceil(log_2(187)) = 8)
- 1024-dim embedding per section
- Sections used per chunk column: 1 (one document chunk per column, vertically stacked for multi-chunk documents)

| Level | Unit Count | Uncompressed | Compressed (est.) |
|---|---|---|---|
| Section | 1 | ~14 KiB | ~7 KiB |
| Chunk column (1 doc, 1 section) | 1 | ~14 KiB + overhead | ~8 KiB |
| Chunk column (20-section doc) | 20 sections | ~280 KiB | ~140 KiB |
| Region file (1024 chunks, 1 section each) | 1,024 | ~14 MiB | ~7 MiB |
| Region file (1024 chunks, 20 sections avg) | 20,480 | ~280 MiB | ~140 MiB |

### 5.3 Comparison with Alternative Formats

For a corpus of 10,000 document chunks (400 tokens each, with 1024-dim embeddings):

| Format | Storage Size | Notes |
|---|---|---|
| **JSONL** (text + embedding as JSON floats) | ~62 MB | ~6.2 KB/chunk: 400 chars text + 1024 floats as ASCII |
| **JSONL** (text + embedding as base64) | ~46 MB | ~4.6 KB/chunk: base64 encoding of float32 array |
| **Parquet** (columnar, snappy) | ~42 MB | Good float compression, column pruning |
| **Qdrant** (native format) | ~45 MB | HNSW index adds ~5 MB overhead |
| **VAV Anvil** (palette + packed + embedding) | ~70 MB | ~7 KB/chunk compressed; palette overhead is the cost |
| **VAV Anvil (no embedding)** | ~30 MB | Blocks-only encoding without float vectors |

**Overhead ratio:** VAV Anvil is approximately **1.5-1.7x** the size of Parquet or native vector DB storage for the same corpus. The overhead comes from:

1. **Palette strings** — each unique token's block state Name is a full namespaced string (~25 bytes), repeated per section. In JSONL, the token IS the data; in Anvil, the token must be mapped to a block name and stored alongside the index array.
2. **Sector alignment** — region file sectors are 4 KiB aligned, causing internal fragmentation for small chunks.
3. **NBT overhead** — type bytes, name length prefixes, compound delimiters add ~10-15% to payload size.

The 1.5-1.7x overhead buys: spatial navigability, visual debuggability, the entire Minecraft tooling ecosystem, and structural compatibility with Ceph's object model. Whether that trade is worthwhile depends on the deployment context. For a production vector DB at scale, native formats win on density. For an exploratory, human-navigable knowledge base, the overhead is modest and the benefits are substantial.

### 5.4 Compression Effectiveness

Zlib compression ratios for different section types (measured from v1 estimates, to be validated in PoC):

| Section Type | Uncompressed | Compressed | Ratio |
|---|---|---|---|
| Homogeneous (all stone) | ~30 B | ~30 B | 1:1 (already minimal) |
| Terrain (8 block types) | ~2,300 B | ~600 B | 3.8:1 |
| Forest surface (30 types) | ~4,200 B | ~1,400 B | 3.0:1 |
| RAG chunk (187 tokens, no embed) | ~10,200 B | ~3,200 B | 3.2:1 |
| RAG chunk (187 tokens + 1024-dim embed) | ~14,300 B | ~7,000 B | 2.0:1 |

The embedding vector is the compression-resistant component — float32 arrays have high entropy and compress poorly (typically 1.2-1.5x). The palette and packed index data compress well (3-4x) due to repetitive string patterns and sparse index distributions. Quantizing embeddings to int8 (TAG_Byte_Array) would improve compression to ~2.5:1 overall at the cost of ~1-3% retrieval accuracy.

---

## 6. Connection to v1 Modules

### 6.1 M1: Ceph/RADOS Architecture

The section is the atomic data unit inside the RADOS object chain: RADOS object -> `.mca` file -> chunk (up to 1,024) -> section (up to 24). Section-level palette compression directly determines RADOS object size and CRUSH placement group distribution. The xattr `vav.palette_hash` defined in M1 section 2.2 is now concretely specified: SHA-256 of concatenated palette entries (sorted by Name) across all sections, enabling vocabulary comparison without decompressing chunks.

### 6.2 M2: RAG Pipeline Architecture

The encoding function E(token) -> block_state defined in section 3.1 of this module is the formal specification of what M2 called "enchanting blocks with NBT float arrays" in its pipeline overview table. The seven RAG stages (ingest, chunk, embed, store, retrieve, rerank, generate) operate on sections whose internal structure is now fully specified: palette = vocabulary, data = document body, vav:embedding = dense vector.

The Matryoshka embedding LOD zones from M2 section 4.2 apply at the section level: each section's `vav:embedding` compound can store prefix-truncated vectors, and the retrieval pipeline selects the appropriate truncation based on query distance.

### 6.3 M3: Integration Architecture

The isomorphism table in section 3.3 of this module completes the mapping that M3 section 1.1 began. M3 defined the token-to-block mapping conceptually; this module provides the mathematical encoding/decoding functions, proves the round-trip identity, and quantifies the information-theoretic cost.

The chunk-to-section mapping from M3 section 1.3 is now grounded in specific byte counts: a 400-token chunk with 187 unique tokens produces a section consuming ~14 KiB uncompressed, ~7 KiB compressed. The section layout (x/z/y ordering, 256 positions per layer) specified in M3 is confirmed by the block index formula in section 1.5 of this module.

### 6.4 M4: Anvil/NBT Format

M4 section 6 introduced palette compression at a survey level. This module drills into the packed long array layout with bit-level precision: the no-spanning constraint, the entries-per-long calculation, the wasted-bits-per-long overhead. The wire-format examples in section 4 provide the concrete NBT dumps that M4 described abstractly and that the M1 retrospective (item 3.5) identified as a critical gap.

The NBT type system from M4 section 5 is exercised throughout the wire-format examples: TAG_Compound for palette entries and metadata, TAG_String for block names and text content, TAG_Long_Array for packed data, TAG_List of TAG_Float for embedding vectors, TAG_Byte_Array for light data.

---

## 7. Sources

| ID | Reference |
|----|-----------|
| SRC-CHUNK | Minecraft Wiki. "Chunk format." https://minecraft.wiki/w/Chunk_format |
| SRC-WORLDGEN | Minecraft Wiki. "World generation." https://minecraft.wiki/w/World_generation |
| SRC-WORLDGEN-ZUCCONI | Zucconi, Alan. "The World Generation of Minecraft." https://www.alanzucconi.com/2022/06/05/minecraft-world-generation/ (2022; updated August 2024) |
| SRC-NBT | Minecraft Wiki. "NBT format." https://minecraft.wiki/w/NBT_format |
| SRC-REGION | Minecraft Wiki. "Region file format." https://minecraft.wiki/w/Region_file_format |
| SRC-FLATTEN | Minecraft Wiki. "Java Edition 1.13/Flattening." https://minecraft.wiki/w/Java_Edition_1.13/Flattening |
| SRC-SHANNON | Shannon, C. E. (1948). "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27(3), 379-423. |
| SRC-PALETTE | Minecraft Wiki. "Data pack: Block state format." https://minecraft.wiki/w/Chunk_format#Block_state_format |
| SRC-ANVIL | Minecraft Wiki. "Anvil file format." https://minecraft.wiki/w/Anvil_file_format |
| SRC-MATRYOSHKA | Kusupati, A. et al. (2022). "Matryoshka Representation Learning." *NeurIPS 2022*. |
