# In-Game Exploration Interface and Prior Art

> **Domain:** Game-AI Integration
> **Module:** 4 -- In-Game Exploration Interface and Prior Art
> **Through-line:** *The player's position and gaze direction become the query. Walking through the world becomes retrieval. The PrismarineJS ecosystem provides the bridge between Minecraft's binary world data and the RAG system's knowledge graph.*

---

## Table of Contents

1. [The Position-as-Query Paradigm](#1-the-position-as-query-paradigm)
2. [PrismarineJS Ecosystem](#2-prismarinejs-ecosystem)
3. [Prior Art: LLM Minecraft Agents](#3-prior-art-llm-minecraft-agents)
4. [The Gap in Prior Art](#4-the-gap-in-prior-art)
5. [Interface Design](#5-interface-design)
6. [Educational World Packs](#6-educational-world-packs)
7. [Safety Considerations](#7-safety-considerations)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. The Position-as-Query Paradigm

Traditional RAG systems require the user to type a query. In Minecraft World RAG, the query is implicit in the player's state [1]:

- **Position (x, y, z):** Determines which knowledge graph subgraphs are spatially relevant
- **Facing direction (yaw, pitch):** Determines what the player is looking at -- the "focus" of the query
- **Recent movement trajectory:** Provides context about exploration intent (approaching a structure vs. passing through)
- **Current dimension:** Overworld, Nether, or End -- determines which region files to query

### 1.1 Retrieval Trigger

Given position (x, y, z) and facing direction, retrieve the 5 most contextually relevant knowledge graph subgraphs within 200 ms. Relevance combines:
- Spatial proximity (nearby structures)
- Gaze alignment (what the player is looking at)
- Novelty (structures not yet visited or discussed)

---

## 2. PrismarineJS Ecosystem

The PrismarineJS project provides a comprehensive JavaScript/TypeScript toolkit for Minecraft protocol and data handling [2]:

| Library | Function | MCR Use |
|---------|----------|---------|
| prismarine-nbt | Parse/serialize NBT in all encodings | World file reading |
| prismarine-world | Infinite world abstraction with pluggable storage | Core world API |
| prismarine-provider-anvil | Anvil format reader/writer | Load .mca region files |
| prismarine-chunk | In-memory chunk representation | Block access by coordinate |
| prismarine-viewer | WebGL 3D renderer in browser | Visualization without game client |
| mineflayer | High-level bot API for Minecraft servers | Live game integration |
| minecraft-data | Block definitions, entity types, recipes | Name resolution, properties |

### 2.1 prismarine-viewer as Visualization Layer

prismarine-viewer renders a prismarine-world instance in a browser using WebGL. This could serve as the visualization layer for the RAG system without requiring a running Minecraft client -- a lightweight alternative for the museum/explore mode [2].

---

## 3. Prior Art: LLM Minecraft Agents

### 3.1 Voyager (2023)

The first LLM-powered embodied lifelong learning agent in Minecraft. Uses GPT-4 via blackbox prompting (no fine-tuning). Three key components [3]:

- **Automatic curriculum:** Proposes exploration tasks based on current skill level
- **Skill library:** Stores mastered behaviors as executable JavaScript code
- **Iterative prompting:** Incorporates environment feedback and self-verification

Results: 3.3x more unique items, 15.3x faster tech tree progression vs. baselines. Key insight: code as action space enables compositional behaviors [3].

### 3.2 STEVE (2024)

Embodies vision perception, language instruction, and code action in a single framework. Processes visual input alongside natural language to generate actionable code [4].

### 3.3 MineDojo

Framework providing a simulation suite with thousands of diverse tasks plus an internet-scale knowledge base from Minecraft videos, tutorials, wiki pages, and forum discussions [4].

---

## 4. The Gap in Prior Art

All existing agents operate on live game state via Mineflayer connections to running servers. None address [3][4]:

| Capability | Voyager | STEVE | MineDojo | MCR (This Project) |
|-----------|---------|-------|----------|-------------------|
| Parse saved world files | No | No | No | **Yes** |
| Persistent knowledge graph | No | No | No | **Yes** |
| Read-only exploration | No | No | No | **Yes** |
| Archetype-adaptive RAG | No | No | No | **Yes** |
| Offline world analysis | No | No | No | **Yes** |

---

## 5. Interface Design

### 5.1 Chat-Based Interaction

The simplest interface: player types questions in Minecraft chat, LLM responds with contextually aware answers based on current position and world knowledge [1].

### 5.2 Proximity-Triggered Narration

In museum/explore mode, approaching significant locations automatically triggers contextual commentary. No player input required -- the system detects position changes and surfaces relevant annotations [1].

### 5.3 HUD Overlay

For modded clients, overlay annotations on the game screen: structure names, block counts, material composition, historical notes about build progression [1].

---

## 6. Educational World Packs

Curated world saves designed specifically for RAG-guided exploration. Each pack includes .mca files, pre-built knowledge graph, annotation metadata, and curriculum guide [1]:

| Pack | Subject | Key Feature |
|------|---------|-------------|
| Redstone Fundamentals | Boolean logic | Circuit exploration from gates to ALU |
| Biome Survey | Ecology | Terrain traversal across all biome types |
| Architecture History | Building styles | Structural analysis of historical styles |
| Survival Diary | Resource management | Base archaeology reading player progression |

---

## 7. Safety Considerations

| Concern | Type | Mitigation |
|---------|------|-----------|
| World data privacy | GATE | Player world files may contain personal builds. Never share parsed data without consent |
| Mod safety | ABSOLUTE | Only parse vanilla block/entity types. Reject unknown block IDs gracefully |
| Read-only integrity | ABSOLUTE | Museum mode must guarantee immutability architecturally, not just by policy |
| Age-appropriate content | GATE | LLM narration must be appropriate for all ages regardless of world contents |
| Performance safety | ANNOTATE | Streaming/lazy loading to prevent memory exhaustion on large worlds |
| Copyright | ANNOTATE | This project parses save files (user data), not game assets |

---

## 8. Cross-References

| Project | Connection |
|---------|------------|
| [VAV](../VAV/index.html) | Block storage architecture; Minecraft's region-chunk hierarchy as a storage system case study |
| [ECO](../ECO/index.html) | Biome Survey educational pack maps Minecraft biomes to real ecosystem research |
| [CMH](../CMH/index.html) | World data distribution for large world parsing; parallel chunk processing |
| [MPC](../MPC/index.html) | Embedding computation for spatial similarity search across block types |
| [SPA](../SPA/index.html) | 3D spatial awareness; player position tracking and gaze-based query |
| [GRD](../GRD/index.html) | Gradient-based retrieval ranking; spatial relevance scoring |

---

## 9. Sources

1. [GSD Minecraft World RAG Vision Document](../../index.html)
2. [PrismarineJS Project -- GitHub](https://github.com/PrismarineJS)
3. [Voyager: An Open-Ended Embodied Agent | arXiv 2305.16291](https://arxiv.org/abs/2305.16291)
4. [MineDojo: Building Open-Ended Embodied Agents | NeurIPS 2022](https://minedojo.org/)
