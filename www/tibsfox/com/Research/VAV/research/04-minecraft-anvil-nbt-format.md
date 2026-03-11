# Minecraft Anvil / NBT Format Deep Dive

> **Module ID:** VAV-ANVIL
> **Domain:** Storage Format & Binary Encoding
> **Through-line:** *The voxel is the vessel.* Minecraft's Anvil format is not a game file — it is a chunked, compressed, spatially-indexed binary container with a 13-year lineage of backwards compatibility. Every block in the world has an address. Every address resolves through a chain of headers, sectors, palettes, and packed bit arrays. To use this format as a knowledge store, you must understand every layer of that chain — because the encoding IS the retrieval path.

---

## Table of Contents

1. [Region File Architecture](#1-region-file-architecture)
2. [The 8 KiB Header](#2-the-8-kib-header)
3. [Sector Alignment and Compression](#3-sector-alignment-and-compression)
4. [Chunk Payload Structure](#4-chunk-payload-structure)
5. [NBT Type System](#5-nbt-type-system)
6. [Block State Palette Compression](#6-block-state-palette-compression)
7. [Section Geometry and Y-Range](#7-section-geometry-and-y-range)
8. [Embedding Storage in NBT](#8-embedding-storage-in-nbt)
9. [Coordinate System and Addressing](#9-coordinate-system-and-addressing)
10. [Tooling Ecosystem](#10-tooling-ecosystem)
11. [Format Versioning](#11-format-versioning)
12. [Cross-Reference](#12-cross-reference)
13. [Sources](#13-sources)

---

## 1. Region File Architecture

### 1.1 The .mca File

Minecraft stores world data in **region files** with the `.mca` extension (Minecraft Anvil). Each region file covers a 32x32 grid of chunks, which translates to 512x512 blocks of horizontal world surface. A single region file is the atomic unit of world storage on disk. [SRC-REGION]

The file naming convention encodes the region's position: `r.<X>.<Z>.mca` where X and Z are region coordinates derived from chunk coordinates. Region (0,0) covers chunks (0,0) through (31,31). Region (-1,0) covers chunks (-32,0) through (-1,31). This naming scheme means you can derive a file path from any block coordinate through two right-shifts: block >> 4 = chunk, chunk >> 5 = region.

The Anvil format replaced the older McRegion format (.mcr) in Minecraft 1.2 (March 2012). The change increased the maximum build height from 128 to 256 blocks and introduced per-section storage. The 1.18 update (November 2021) extended the Y-range further from [0, 255] to [-64, 319], adding 4 more sections below and 4 above. The on-disk region file structure remained the same — only the chunk payload grew. [SRC-CHUNK]

### 1.2 Why This Format Matters for RAG

A region file is a **spatially-indexed container with built-in compression, sector alignment, and a fixed-size header for O(1) chunk lookup**. These are not game-specific properties. They are storage engineering properties that any chunked retrieval system needs. The format gives you:

- Spatial locality: nearby data lives in the same file
- O(1) lookup: header table maps chunk offset directly, no index scan
- Compression: zlib or LZ4 per chunk, not per file
- Atomic chunk writes: individual chunks can be updated without rewriting the region
- Proven at scale: billions of worlds, petabytes of player-generated data

---

## 2. The 8 KiB Header

### 2.1 Offset Table (Bytes 0-4095)

The first 4096 bytes of every .mca file contain the **chunk offset and sector count table**. This table has exactly 1024 entries (32x32 chunks), each 4 bytes wide. [SRC-REGION]

For chunk at local position (x, z) within the region, the entry index is:

```
index = ((x % 32) + (z % 32) * 32) * 4
```

Each 4-byte entry encodes:
- **Bytes 0-2 (3 bytes, big-endian):** Offset in 4096-byte sectors from the start of the file
- **Byte 3 (1 byte):** Number of sectors the chunk occupies

An offset of 0 and length of 0 means the chunk has not been generated. The minimum valid offset is 2 (since sectors 0 and 1 are the header itself).

### 2.2 Timestamp Table (Bytes 4096-8191)

The second 4096 bytes contain 1024 four-byte big-endian timestamps, one per chunk, recording the last modification time as a Unix epoch (seconds since 1970-01-01). Same index formula as the offset table. [SRC-REGION]

These timestamps enable incremental backup, cache invalidation, and change detection — all useful properties when the format carries mutable knowledge rather than mutable terrain.

---

## 3. Sector Alignment and Compression

### 3.1 4096-Byte Sectors

All data in a region file is aligned to **4096-byte (4 KiB) sector boundaries**. The header occupies sectors 0 and 1. Chunk data starts at sector 2 or later. When a chunk is written, it is padded to fill its final sector. This alignment matches filesystem block sizes on most modern systems and enables efficient I/O without read-modify-write cycles. [SRC-REGION]

When a chunk grows beyond its allocated sectors, Minecraft appends it to the end of the file and updates the header. When a chunk shrinks, the freed sectors become available for reuse. This is a simple free-list allocator — not sophisticated, but robust enough for 13 years of production use.

### 3.2 Compression Schemes

Each chunk payload begins with a **compression scheme byte** that identifies the codec:

| Byte Value | Compression | Notes |
|------------|-------------|-------|
| 1 | GZip | Legacy, rarely used |
| 2 | Zlib (deflate) | Default for most implementations |
| 3 | Uncompressed | Raw NBT, no compression |
| 4 | LZ4 | Added in 24w04a (2024), faster decompression |

Zlib (value 2) is the standard. The compressed payload immediately follows the scheme byte. Decompression yields raw NBT binary data. For RAG workloads with embedding payloads, LZ4 offers better read latency at the cost of slightly larger compressed size — a worthwhile trade when retrieval speed matters more than storage density. [SRC-REGION]

---

## 4. Chunk Payload Structure

### 4.1 Chunk Envelope

After the 8 KiB header, each chunk's on-disk representation begins with:

```
[4 bytes] length (big-endian int32) — byte count of compression_type + compressed_data
[1 byte]  compression_type
[n bytes] compressed NBT data (n = length - 1)
```

The length field counts everything after itself: the 1-byte compression type plus the compressed data. Padding bytes fill the remainder of the last sector. [SRC-CHUNK]

### 4.2 Top-Level NBT Compound

Once decompressed, the chunk is a single NBT compound tag. Key fields include:

| Field | Type | Description |
|-------|------|-------------|
| `DataVersion` | TAG_Int | Format version number for world upgrader |
| `xPos` | TAG_Int | Chunk X coordinate |
| `zPos` | TAG_Int | Chunk Z coordinate |
| `yPos` | TAG_Int | Lowest section Y index (typically -4 since 1.18) |
| `Status` | TAG_String | Generation status (e.g., "minecraft:full") |
| `sections` | TAG_List | List of 16x16x16 section compounds |
| `block_entities` | TAG_List | Tile entity data (chests, signs, etc.) |
| `Heightmaps` | TAG_Compound | Precomputed height data |

The `sections` list is where block data lives. Each entry represents a 16x16x16 vertical slice of the chunk. [SRC-CHUNK]

---

## 5. NBT Type System

### 5.1 Named Binary Tag Format

NBT (Named Binary Tag) is Minecraft's binary serialization format, designed by Markus "Notch" Persson in 2010. It is a tree structure of typed, named tags — conceptually similar to JSON but binary-encoded with explicit types. [SRC-NBT]

The 12 tag types form a complete type system:

| ID | Name | Payload | Size |
|----|------|---------|------|
| 0 | TAG_End | None (terminates TAG_Compound) | 0 bytes |
| 1 | TAG_Byte | Signed 8-bit integer | 1 byte |
| 2 | TAG_Short | Signed 16-bit big-endian integer | 2 bytes |
| 3 | TAG_Int | Signed 32-bit big-endian integer | 4 bytes |
| 4 | TAG_Long | Signed 64-bit big-endian integer | 8 bytes |
| 5 | TAG_Float | 32-bit IEEE 754 float, big-endian | 4 bytes |
| 6 | TAG_Double | 64-bit IEEE 754 double, big-endian | 8 bytes |
| 7 | TAG_Byte_Array | Length-prefixed array of bytes | 4 + n bytes |
| 8 | TAG_String | Length-prefixed modified UTF-8 | 2 + n bytes |
| 9 | TAG_List | Typed list (all elements same type) | 1 + 4 + n*elem bytes |
| 10 | TAG_Compound | Named tag map, terminated by TAG_End | variable |
| 11 | TAG_Int_Array | Length-prefixed array of int32 | 4 + 4n bytes |
| 12 | TAG_Long_Array | Length-prefixed array of int64 | 4 + 8n bytes |

### 5.2 Binary Encoding Rules

Every named tag on disk is encoded as: `[1 byte type ID] [2 bytes name length] [name bytes] [payload]`. TAG_End has no name or payload — it is a single zero byte. TAG_List entries omit individual names but carry a type byte and count at the list level. TAG_Compound contains named tags until TAG_End. [SRC-NBT]

### 5.3 Relevance to Embedding Storage

The type system directly supports vector storage:

- **TAG_Float (type 5):** Individual float values
- **TAG_List of TAG_Float (type 9 containing type 5):** Variable-length float vectors — ideal for embeddings
- **TAG_Byte_Array (type 7):** Raw binary blobs for quantized embeddings
- **TAG_Long_Array (type 12):** Packed bit arrays, already used for block state palettes
- **TAG_String (type 8):** Document text, metadata, source identifiers
- **TAG_Compound (type 10):** Structured metadata containers

A 1024-dimensional float32 embedding stored as TAG_List of TAG_Float occupies 1 (list type) + 4 (count) + 1024 * 4 (floats) = **4101 bytes (~4 KiB)**. A 1536-dim embedding: ~6 KiB. Both fit comfortably within a single chunk section's custom tag space. [SRC-NBT]

---

## 6. Block State Palette Compression

### 6.1 Palette-Indexed Block Storage

Since the Flattening (1.13), Minecraft stores block states using a **palette plus packed long array** scheme. Each chunk section's `block_states` compound contains: [SRC-CHUNK]

- **`palette`** (TAG_List of TAG_Compound): A list of unique block states present in this section. Each entry has a `Name` (e.g., "minecraft:stone") and optional `Properties` compound (e.g., facing=north).
- **`data`** (TAG_Long_Array): Block indices packed into 64-bit longs, referencing the palette by index.

### 6.2 Bits-Per-Entry Calculation

The number of bits used per block index is:

```
bits_per_entry = max(4, ceil(log2(palette_size)))
```

The minimum is 4 bits even for palettes smaller than 16 entries. When the palette exceeds 16 entries (requiring more than 4 bits), the bit width grows: 5 bits for up to 32 entries, 6 for 64, and so on. At a threshold (currently palette_size > some limit, typically around 16 for sections), the game switches to a direct global palette where each entry is the full block state ID. [SRC-CHUNK]

Each 64-bit long holds `floor(64 / bits_per_entry)` indices. Indices do not span long boundaries — remaining bits in each long are unused padding. For a full 16x16x16 = 4096 block section:

```
longs_needed = ceil(4096 / floor(64 / bits_per_entry))
```

With 4 bits per entry: 16 indices per long, 256 longs total (2048 bytes of packed data).

### 6.3 Implications for RAG Vocabulary Encoding

This palette scheme is directly applicable to knowledge storage. A document chunk with a small vocabulary of semantic labels (topic IDs, source categories, confidence levels) produces a **small palette and high compression**. A section containing only 3 block types uses 4 bits per entry — 2 KiB for 4096 positions. The palette itself is a few hundred bytes.

For RAG: imagine each "block" position in a section maps to a token, sentence, or sub-document unit. The palette entries are the unique semantic labels. High redundancy (many blocks sharing few labels) yields excellent compression. This is the same principle behind dictionary encoding in columnar databases — Minecraft just happened to implement it for terrain.

---

## 7. Section Geometry and Y-Range

### 7.1 Section Structure

Each chunk section is a **16x16x16 cube of blocks** — 4096 block positions. Sections are stacked vertically within a chunk. The section's Y index identifies its position in the stack. [SRC-CHUNK]

Since Minecraft 1.18, the world Y-range extends from **-64 to 319**, yielding:

```
total_height = 319 - (-64) + 1 = 384 blocks
sections = 384 / 16 = 24 sections per chunk
section_Y_indices = -4, -3, -2, -1, 0, 1, 2, ... 19
```

Each section can independently hold its own palette, block states, biome data, and light data. Empty sections (all air) can be omitted entirely from the sections list — a natural form of sparse storage.

### 7.2 Biome Packing

Since 1.18, biomes are stored per-section using the same palette + packed long array scheme, but at **4x4x4 resolution** (64 entries per section rather than 4096). This coarser grid reflects the fact that biomes vary more gradually than individual blocks. [SRC-CHUNK]

For RAG purposes, the biome layer provides a **coarse-grained metadata channel** — 64 slots per section where each slot covers a 4x4x4 volume. Topic-level classification, source provenance, or confidence tiers map naturally to this resolution.

### 7.3 Heightmaps

The chunk's `Heightmaps` compound contains precomputed vertical projections stored as TAG_Long_Array with 9-bit entries (values 0-384). Four heightmap types exist: WORLD_SURFACE, OCEAN_FLOOR, MOTION_BLOCKING, and MOTION_BLOCKING_NO_LEAVES. [SRC-CHUNK]

For spatial indexing, heightmaps offer a 2D summary of the chunk's vertical extent — useful for queries that need to find the "surface" of a knowledge region without scanning every section.

---

## 8. Embedding Storage in NBT

### 8.1 Custom Namespace Tags

Minecraft's NBT format allows **arbitrary named tags** within compounds. The game ignores tags it does not recognize, making it safe to inject custom data. The convention for mods and custom data is to use namespace prefixes. [SRC-NBT]

For the Voxel-as-Vessel system, we define:

| Tag Path | Type | Description |
|----------|------|-------------|
| `rag:embedding` | TAG_List (TAG_Float) | Dense embedding vector |
| `rag:source_id` | TAG_String | Document source identifier |
| `rag:chunk_index` | TAG_Int | Position within source document |
| `rag:text` | TAG_String | Raw text content of this knowledge chunk |
| `rag:metadata` | TAG_Compound | Arbitrary key-value metadata |
| `rag:timestamp` | TAG_Long | Ingestion timestamp (Unix millis) |
| `rag:version` | TAG_Int | Schema version for forward compatibility |

### 8.2 Storage Budget Per Section

A chunk section's base overhead (palette + block states + biomes + light) is typically 4-12 KiB compressed. The NBT format imposes no hard limit on section size — only the region file's sector allocation constrains it. A section with:

- 1024-dim float32 embedding: ~4 KiB
- 512 bytes of text content
- 256 bytes of metadata
- Base block/biome data: ~4 KiB

Total: ~9 KiB uncompressed per section, compressing to roughly 4-6 KiB with zlib. A full 24-section chunk: ~100-150 KiB. A full 1024-chunk region: ~100-150 MiB. Manageable for any modern system.

### 8.3 Quantized Embedding Alternative

For storage-sensitive deployments, embeddings can be quantized to int8 and stored as TAG_Byte_Array: 1024 bytes for 1024-dim instead of 4096 bytes. The 4x reduction trades approximately 1-3% retrieval accuracy for significantly denser packing. The choice between TAG_List(TAG_Float) and TAG_Byte_Array is a deployment decision, not a format limitation. [SRC-NBT]

---

## 9. Coordinate System and Addressing

### 9.1 Block to Region Resolution

The coordinate chain from a single block to its region file is entirely bitwise:

```
block_x, block_z         (world coordinates, signed 32-bit)
chunk_x = block_x >> 4   (divide by 16, floor)
chunk_z = block_z >> 4
region_x = chunk_x >> 5  (divide by 32, floor)
region_z = chunk_z >> 5
```

File path: `region/r.{region_x}.{region_z}.mca`
Header offset: `((chunk_x & 31) + (chunk_z & 31) * 32) * 4`

The section Y index within a chunk: `section_y = (block_y + 64) >> 4 - 4` (for 1.18+ worlds starting at Y=-64). [SRC-REGION]

### 9.2 Addressing Capacity

With signed 32-bit block coordinates:
- X range: -2,147,483,648 to 2,147,483,647
- Z range: same
- That yields ~4.6 x 10^18 block positions on each horizontal plane
- Chunk positions: ~2.9 x 10^17
- Region files: ~2.8 x 10^14

Even at the chunk level, **~2.9 x 10^17 unique positions** — far beyond any realistic document corpus. At the section level (24 sections per chunk), the address space is even larger. The coordinate system will not be the bottleneck. [SRC-REGION]

### 9.3 Spatial Queries

Given this addressing scheme, spatial queries become coordinate queries:
- **Point lookup:** block coord -> chunk -> region -> header -> sector -> decompress -> section
- **Range query:** bounding box of chunk coordinates -> iterate matching regions and chunks
- **Nearest neighbor:** requires an external spatial index (R-tree, k-d tree) or the mapping from embedding space to coordinates must preserve locality (see Module 06)

---

## 10. Tooling Ecosystem

### 10.1 Python Libraries

| Library | Purpose | Status |
|---------|---------|--------|
| **anvil-parser** | Read/write .mca region files, chunk access by coordinate | Active, pip-installable |
| **nbt** (twoolie/NBT) | Low-level NBT read/write, tag manipulation | Stable, pip-installable |
| **amulet-core** | Cross-version world editing, block translation tables | Active, handles version differences |
| **amulet-nbt** | Fast NBT parsing (Cython-accelerated) | Part of Amulet project |
| **litematica-tools** | Schematic file handling | Niche but useful for structure templates |

### 10.2 Other Languages

| Tool | Language | Notes |
|------|----------|-------|
| **NBTExplorer** | C# | GUI browser for NBT data, useful for debugging |
| **fastnbt** | Rust | High-performance NBT serde, good for pipeline tools |
| **hematite-nbt** | Rust | Alternative Rust NBT library |
| **MCEdit** | Python (legacy) | Full world editor, archived but historically important |
| **Querz NBT** | Java | Native Java NBT library, mirrors Mojang's internal impl |

### 10.3 Selection for PoC

The proof-of-concept (Module 05) will use **anvil-parser** for .mca file I/O and **nbt** for fine-grained tag manipulation. anvil-parser handles the region header, sector allocation, and compression transparently. The nbt library provides direct access to the tag tree for injecting custom namespace tags. Both are pure Python and pip-installable with no native dependencies.

---

## 11. Format Versioning

### 11.1 DataVersion Field

Every chunk carries a `DataVersion` TAG_Int that identifies the exact game version that last saved it. Minecraft uses this field to run **data fixers** — migration functions that upgrade old chunk formats to current. [SRC-CHUNK]

Key DataVersion milestones:

| DataVersion | Game Version | Change |
|-------------|-------------|--------|
| 1343 | 1.12.2 | Last pre-Flattening format |
| 1519 | 1.13 | The Flattening: numeric block IDs replaced with namespaced strings + palette |
| 2860 | 1.18 | World height extended to [-64, 319], 24 sections |
| 3463 | 1.20 | Current stable baseline |

For the VAV system, DataVersion serves as a **schema version** for the knowledge encoding. When the embedding format changes (e.g., dimension size, quantization scheme, new metadata fields), increment a custom version tag and write migration logic — the same pattern Mojang has used successfully for 13 years.

---

## 12. Cross-Reference

| Module | Connection |
|--------|------------|
| M1 (Thesis) | Anvil format is the concrete implementation of "voxel as information vessel" |
| M2 (Ceph/RADOS) | Region files map to RADOS objects; sector alignment maps to stripe units |
| M3 (RAG Pipeline) | Chunk sections are the retrieval units; NBT tags carry embeddings and text |
| M5 (PoC Plan) | anvil-parser and nbt are the library choices for the implementation |
| M6 (Spatial Mapping) | Coordinate system is the target space for embedding projection |
| M7 (v2 Seed Space) | NBT custom tags carry seed-space metadata; DataVersion enables schema migration |

---

## 13. Sources

| ID | Reference |
|----|-----------|
| SRC-REGION | Minecraft Wiki. "Region file format." https://minecraft.wiki/w/Region_file_format |
| SRC-CHUNK | Minecraft Wiki. "Chunk format." https://minecraft.wiki/w/Chunk_format |
| SRC-NBT | Minecraft Wiki. "NBT format." https://minecraft.wiki/w/NBT_format |
| SRC-ANVIL | Minecraft Wiki. "Anvil file format." https://minecraft.wiki/w/Anvil_file_format |
| SRC-FLATTEN | Minecraft Wiki. "Java Edition 1.13/Flattening." https://minecraft.wiki/w/Java_Edition_1.13/Flattening |
| SRC-AMULET | Amulet Team. "Amulet Map Editor." https://github.com/Amulet-Team/Amulet-Map-Editor |
| SRC-ANVIL-PY | matcool. "anvil-parser." https://github.com/matcool/anvil-parser |
| SRC-FASTNBT | owengage. "fastnbt." https://github.com/owengage/fastnbt |
