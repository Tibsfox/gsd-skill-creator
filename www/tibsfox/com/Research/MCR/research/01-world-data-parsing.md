# World Data Parsing and Spatial Indexing

> **Domain:** Data Engineering
> **Module:** 1 -- World Data Parsing and Spatial Indexing
> **Through-line:** *A Minecraft world save is not a game -- it is a spatially-indexed database with a built-in 3D visualization engine. Every block placed at coordinates (x, y, z) is a record in a compacted binary format that encodes material type, block state, light level, biome classification, and entity associations.*

---

## Table of Contents

1. [World Save Directory Structure](#1-world-save-directory-structure)
2. [NBT Format](#2-nbt-format)
3. [Region/Anvil File Format](#3-regionanvil-file-format)
4. [Chunk Format (1.18+)](#4-chunk-format-118)
5. [Entity and POI Storage](#5-entity-and-poi-storage)
6. [Parsing Libraries](#6-parsing-libraries)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. World Save Directory Structure

```
world/
  level.dat .................. Global metadata (NBT, GZip)
  |                            seed, spawn, time, weather,
  |                            game rules, player state
  session.lock .............. Write-lock file
  region/ ................... Overworld terrain
  |   r.0.0.mca ............ Region file (Anvil format)
  |   r.0.-1.mca              Each covers 32x32 chunks
  |   ...                     = 512x512 block columns
  entities/ ................. Entity storage (1.17+)
  |   r.0.0.mca               Separated from terrain data
  poi/ ...................... Points of Interest
  |   r.0.0.mca               Villager workstations, beds,
  |                            bee nests, nether portals
  DIM-1/ ................... Nether
  |   region/, entities/
  DIM1/ .................... The End
  |   region/, entities/
  playerdata/ .............. Per-player state (.dat NBT)
  data/ .................... Map items, scoreboard, raids
  datapacks/ ............... Custom data packs
```

---

## 2. NBT Format

Named Binary Tag (NBT) is the tree-structured binary serialization format used throughout Minecraft for persistent data storage [1][2]:

### 2.1 Tag Types

| ID | Type | Description |
|----|------|------------|
| 1 | TAG_Byte | 8-bit signed integer |
| 2 | TAG_Short | 16-bit signed integer |
| 3 | TAG_Int | 32-bit signed integer |
| 4 | TAG_Long | 64-bit signed integer |
| 5 | TAG_Float | 32-bit IEEE 754 float |
| 6 | TAG_Double | 64-bit IEEE 754 float |
| 7 | TAG_Byte_Array | Array of bytes |
| 8 | TAG_String | UTF-8 string |
| 9 | TAG_List | Typed list of tags |
| 10 | TAG_Compound | Named tag container (dictionary) |
| 11 | TAG_Int_Array | Array of 32-bit integers |
| 12 | TAG_Long_Array | Array of 64-bit integers |

### 2.2 Encoding Differences

- **Java Edition:** Big-endian byte ordering, GZip compression
- **Bedrock Edition:** Little-endian with VarInt encoding for integers
- All persistent files are typically GZip-compressed

---

## 3. Region/Anvil File Format

Region files (.mca) store 32x32 chunks, covering a 512x512 block area [3]:

### 3.1 File Structure

1. **Location table** (4 KB): Maps each of the 1,024 chunk positions to a byte offset within the file
2. **Timestamp table** (4 KB): Last-modified timestamp for each chunk
3. **Chunk data**: Compressed NBT, each preceded by 4-byte length and 1-byte compression scheme indicator

### 3.2 Coordinate Mapping

Chunk coordinates map to region files via floor division by 32:
- Chunk (30, -3) maps to region (0, -1)
- Within a region file, chunks are addressed by modulo-32 coordinates
- Compression scheme 2 (zlib) is standard; scheme 1 (GZip) is also supported

---

## 4. Chunk Format (1.18+)

Since 1.18, the Overworld spans Y=-64 to Y=319 (384 blocks tall, 24 sections). Each chunk section is 16x16x16 blocks [3][4]:

### 4.1 Palette-Based Block Storage

Block storage uses a palette compression scheme:
- Each section maintains a local palette mapping small indices to global block state IDs
- A packed long array stores per-block palette indices
- Bits-per-entry determines format:
  - 0 bits: single-valued (entire section is one block type)
  - 1-4 bits: indirect palette (minimum 4 bits)
  - 5-8 bits: indirect palette
  - 9+ bits: global palette directly

### 4.2 Biome Data

Biomes use the same paletted structure but at 4x4x4 resolution (64 biome entries per section rather than 4,096 blocks) [4].

### 4.3 Additional Chunk Data

- **block_entities:** Chests, signs, spawners with NBT payloads
- **BlockLight / SkyLight:** 4 bits per block (0-15 light levels)
- **Heightmaps:** Packed 9-bit integers for rapid surface queries
- **InhabitedTime:** Cumulative player presence (affects regional difficulty)
- **Tile ticks:** Scheduled block updates (redstone, water flow)

---

## 5. Entity and POI Storage

### 5.1 Entity Storage (1.17+)

Since 1.17, entity data is stored in separate region files under `entities/`. Each entity has [5]:
- UUID, position (x, y, z), motion vector, rotation
- Custom name, type-specific data
- Mob-specific: health, inventory, villager profession
- Vehicle-specific: passengers, fuel

### 5.2 Points of Interest

POI files track villager-relevant locations [5]:
- Beds, job sites (workstations), bells
- Nether portals, bee nests, lodestones
- Each record: world position, type ID, "free tickets" counter for villager claiming

---

## 6. Parsing Libraries

### 6.1 JavaScript/TypeScript Ecosystem

| Library | Function |
|---------|----------|
| prismarine-nbt | Parse/serialize binary and stringified NBT (all endianness) |
| prismarine-world | Infinite chunk collection abstraction |
| prismarine-provider-anvil | Anvil format reader/writer |
| prismarine-chunk | In-memory chunk representation |
| minecraft-data | Block definitions, entity types, recipe data |

### 6.2 Python Ecosystem

| Library | Function |
|---------|----------|
| amulet-nbt | C++-backed high-performance NBT |
| nbtlib | Pure Python with path queries and schema support |
| twoolie/NBT | Mature community library |

### 6.3 Cross-Platform

The Kaitai Struct project provides a formal NBT specification that can auto-generate parsers in multiple languages [6].

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [VAV](../VAV/index.html) | Minecraft block storage as a voxel database; chunk/region hierarchy parallels storage volume management |
| [CMH](../CMH/index.html) | World data distribution across nodes; spatial partitioning for distributed RAG |
| [SPA](../SPA/index.html) | 3D spatial indexing; octree and spatial hash structures for block queries |
| [ECO](../ECO/index.html) | Biome data as ecological classification; Minecraft biomes map to real ecosystems |
| [MPC](../MPC/index.html) | Embedding computation for block type vectors; spatial similarity search |

---

## 8. Sources

1. [Minecraft Wiki -- NBT Format](https://minecraft.wiki/w/NBT_format)
2. [NeoForged -- NBT Documentation](https://docs.neoforged.net/docs/datastorage/nbt/)
3. [Minecraft Wiki -- Region File Format](https://minecraft.wiki/w/Region_file_format)
4. [Minecraft Wiki -- Chunk Format](https://minecraft.wiki/w/Chunk_format)
5. [Minecraft Wiki -- Java Edition Level Format](https://minecraft.wiki/w/Java_Edition_level_format)
6. [PrismarineJS -- prismarine-nbt](https://github.com/PrismarineJS/prismarine-nbt)
