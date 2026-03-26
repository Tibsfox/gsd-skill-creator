# Spatial Knowledge Graph Construction

> **Domain:** Knowledge Engineering
> **Module:** 2 -- Spatial Knowledge Graph Construction
> **Through-line:** *Minecraft world data maps naturally to a knowledge graph. The challenge is not whether to build one but how to chunk a continuous 3D block world into semantically meaningful subgraphs without losing the spatial adjacency relationships that make the data meaningful.*

---

## Table of Contents

1. [Graph Schema for Minecraft Data](#1-graph-schema-for-minecraft-data)
2. [Node Types](#2-node-types)
3. [Edge Types](#3-edge-types)
4. [Spatial Chunking Strategies](#4-spatial-chunking-strategies)
5. [GraphRAG Patterns](#5-graphrag-patterns)
6. [Structure Detection](#6-structure-detection)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. Graph Schema for Minecraft Data

A Minecraft world is inherently a graph: blocks connect to adjacent blocks, chunks contain blocks, structures span chunks, entities inhabit blocks, containers hold items. The knowledge graph makes these implicit relationships explicit and queryable [1]:

### 1.1 Design Principles

- **Exclude air:** 60-80% of blocks in a loaded chunk are air -- omit them from the graph
- **Hierarchical:** World -> Dimension -> Region -> Chunk -> Section -> Block
- **Relational:** Spatial adjacency, containment, power connections, biome membership
- **Annotated:** Each node carries properties relevant to its type

---

## 2. Node Types

### 2.1 Block Nodes (Atomic Unit)

Properties: position (x, y, z), block state ID, material name, light level (block + sky), biome. A 16x384x16 chunk contains up to 98,304 blocks, but after excluding air, typically 20,000-40,000 remain [1].

### 2.2 Chunk Nodes (Spatial Aggregate)

Properties: chunk coordinates (cx, cz), biome distribution histogram, InhabitedTime (player presence metric), generation status, structure references. Chunks are the natural unit for "what's in this area?" queries [1].

### 2.3 Structure Nodes (Semantic Units)

Properties: bounding box, block composition histogram, classification (farm, house, mine, redstone circuit, natural formation). Structure detection requires spatial clustering of non-natural blocks [1].

### 2.4 Entity Nodes

Properties: type, position, inventory/contents, custom name, AI state. Includes mobs, items, vehicles, and armor stands [1].

### 2.5 Container Nodes

Specialization of block entities: chests, barrels, hoppers, furnaces, shulker boxes. Inventory contents as child relationships enable queries like "where is my iron?" [1].

---

## 3. Edge Types

| Edge Type | Connects | Semantics |
|-----------|----------|-----------|
| adjacent_to | Block -> Block | 6-connected spatial adjacency |
| contains | Chunk -> Block, Container -> Item | Containment hierarchy |
| part_of | Block -> Structure | Structural membership |
| powered_by | Block -> Block | Redstone power connections |
| in_biome | Block/Chunk -> Biome | Biome classification |
| near | Any -> Any | Proximity within configurable radius |

---

## 4. Spatial Chunking Strategies

Standard text RAG chunks by token count. Spatial RAG requires different strategies [1][2]:

### 4.1 Section-Based Chunking

Each 16x16x16 section becomes a RAG chunk. Natural boundary alignment, O(1) lookup by coordinate. **Drawback:** structures spanning section boundaries are split across chunks [2].

### 4.2 Structure-Based Chunking

Connected components of non-natural blocks form chunks. Captures semantic units (a complete farm, a complete house). **Drawback:** computationally expensive, variable chunk sizes [2].

### 4.3 Hybrid Chunking

Section-based for base indexing, with structure overlays that cross section boundaries. Best of both worlds but requires a two-level index: spatial for fast coordinate lookup, structural for semantic queries [2].

---

## 5. GraphRAG Patterns

Microsoft's GraphRAG pattern (community detection + cluster summarization) adapts well to Minecraft spatial data [2]:

### 5.1 Community Detection

Communities in the block graph correspond to player-built structures or natural formations. Cluster summaries become the "docent notes" for each location [2].

### 5.2 Dual-Retrieval Channel

- **Vector search:** Finds blocks matching a query description ("redstone contraption")
- **Graph traversal:** Finds the surrounding structure and connected systems

### 5.3 Corrective RAG

Validates retrieval quality after the initial fetch -- critical for spatial queries where the nearest relevant structure may not be the most contextually appropriate one [2].

### 5.4 Adaptive RAG

Adjusts retrieval strategy based on query complexity:
- Simple ("what block is this?") -> fast coordinate lookup
- Complex ("explain this redstone circuit") -> multi-hop graph traversal

---

## 6. Structure Detection

Identifying player-built structures in a world of mixed natural and placed blocks is the key algorithmic challenge [1]:

### 6.1 Block Classification

- **Natural blocks:** Stone, dirt, grass, water, sand (generated by world generator)
- **Placed blocks:** Crafted items, torches in caves, rails, redstone components
- **Ambiguous:** Cobblestone (natural in dungeons, placed in builds), wood (natural as trees, placed in buildings)

### 6.2 Clustering Approach

1. Identify all non-natural blocks
2. Spatial clustering (DBSCAN or connected components with distance threshold)
3. Classify clusters by composition: wood + glass + door = house; farmland + water + crops = farm; redstone + repeater = circuit

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [VAV](../VAV/index.html) | Voxel-based spatial indexing; block storage as a 3D array with sparse representation |
| [ECO](../ECO/index.html) | Biome classification parallels ecological habitat mapping; Minecraft biomes as simplified ecosystems |
| [CMH](../CMH/index.html) | Graph distribution across compute nodes; spatial partitioning for parallel processing |
| [MPC](../MPC/index.html) | Embedding vector computation for block type similarity search |
| [GRD](../GRD/index.html) | Gradient-based retrieval; spatial gradient of block density indicates structure boundaries |

---

## 8. Sources

1. [Minecraft Wiki -- Chunk Format, Block Entities, Entity Format](https://minecraft.wiki/)
2. [Microsoft GraphRAG -- Community Detection and Summarization](https://microsoft.github.io/graphrag/)
