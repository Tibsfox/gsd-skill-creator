# Archetype-Adaptive RAG Strategies

> **Domain:** RAG Architecture
> **Module:** 3 -- Archetype-Adaptive RAG Strategies
> **Through-line:** *A Skyblock island with 200 blocks needs different indexing than a Creative megastructure with 2 million blocks. The world archetype determines the RAG profile -- chunk size, embedding strategy, retrieval weighting, and the LLM's conversational posture.*

---

## Table of Contents

1. [The Four Archetypes](#1-the-four-archetypes)
2. [Skyblock: Sparse and Constraint-Driven](#2-skyblock-sparse-and-constraint-driven)
3. [Creative: Dense and Intention-Rich](#3-creative-dense-and-intention-rich)
4. [Survival: Emergent Narrative](#4-survival-emergent-narrative)
5. [Adventure/Explore: Read-Only Museum](#5-adventureexplore-read-only-museum)
6. [RAG Profile Comparison](#6-rag-profile-comparison)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. The Four Archetypes

Different world archetypes create fundamentally different RAG profiles. Each demands different chunking strategies, different retrieval priorities, and different conversational postures from the LLM [1]:

| Archetype | Block Density | Semantic Density | LLM Posture |
|-----------|-------------|-----------------|-------------|
| Skyblock | Very sparse | Maximum (every block matters) | Resource advisor |
| Creative | Very dense | High (intentional placement) | Architecture critic |
| Survival | Mixed | Medium (natural + player) | Archaeologist |
| Adventure | Immutable | Pre-computed | Museum docent |

---

## 2. Skyblock: Sparse and Constraint-Driven

Skyblock worlds begin with minimal resources on a small floating island in void. Modern Skyblock data packs generate void terrain with preserved biome maps [2]:

### 2.1 RAG Characteristics

- **Graph size:** Hundreds to low thousands of blocks
- **Semantic density:** Maximum -- every single block is precious
- **Key insight:** A cobblestone generator is not just "cobblestone near lava and water" -- it is the economic engine of the entire world

### 2.2 RAG Profile

- **Chunk strategy:** Entire island as one chunk (small enough)
- **Embedding weight:** Block rarity and functional role weighted heavily
- **Retrieval priority:** Functional significance over spatial proximity
- **LLM posture:** Constraint-aware -- acknowledge scarcity, suggest resource optimization, celebrate milestones
- **Context allocation:** Full world can fit in a single context window

---

## 3. Creative: Dense and Intention-Rich

Creative worlds have no resource constraints, no survival mechanics, and unlimited flight. Players build large-scale structures, artistic installations, and redstone megaprojects [2]:

### 3.1 RAG Characteristics

- **Graph size:** Potentially enormous (millions of blocks)
- **Semantic density:** High for builds, zero for empty space
- **Key insight:** Structure detection is the primary challenge -- distinguishing one build from another in a continuous landscape

### 3.2 RAG Profile

- **Chunk strategy:** Structure-based chunking (each build = one chunk)
- **Embedding weight:** Structural coherence over individual block identity
- **Retrieval priority:** Architectural patterns, symmetry, material palettes
- **LLM posture:** Architecture analyst -- discuss design choices, scale, style
- **Context allocation:** Per-structure summaries rather than raw block data

---

## 4. Survival: Emergent Narrative

Survival worlds contain both natural terrain and player modifications. The boundary between them tells the story of the player's progression [2]:

### 4.1 RAG Characteristics

- **Graph size:** Large (explored terrain + player builds)
- **Semantic density:** Variable -- dense in bases, sparse in wilderness
- **Key insight:** Temporal ordering through InhabitedTime and block update timestamps provides narrative sequencing

### 4.2 RAG Profile

- **Chunk strategy:** Hybrid -- section-based for terrain, structure-based for builds
- **Embedding weight:** Player-placed blocks weighted over natural blocks
- **Retrieval priority:** The "story" of each area -- progression, expansion, improvement
- **LLM posture:** Archaeologist -- read the player's history from their builds. Early-game crude shelters vs. late-game automated farms
- **Context allocation:** Prioritize areas with high InhabitedTime (more player activity)

---

## 5. Adventure/Explore: Read-Only Museum

This is not a vanilla Minecraft mode but a custom enforcement layer. The world is treated as an immutable artifact [3]:

### 5.1 Implementation Options

| Approach | Method | Trade-offs |
|----------|--------|-----------|
| Server plugin | Deny all interaction events | Requires running server |
| Client mod | Intercept input | Client-side only |
| Adventure mode + empty tags | No block breaking without tagged tools | Partial (entity interaction still allowed) |
| Limited Spectator mod | Adventure mode + flight + interaction blocked | Most complete |

### 5.2 RAG Characteristics

- **Graph size:** Fixed (world is immutable)
- **Semantic density:** Pre-computed for all locations
- **Key insight:** Since the world cannot change, the entire knowledge graph can be pre-computed and cached permanently

### 5.3 RAG Profile

- **Chunk strategy:** Pre-indexed with annotations
- **Embedding weight:** All weights pre-computed
- **Retrieval priority:** Proximity-triggered -- approaching a location surfaces its annotation
- **LLM posture:** Museum docent -- prepared remarks supplemented by responsive Q&A
- **Context allocation:** Pre-generated per-location context blocks, loaded on approach

---

## 6. RAG Profile Comparison

| Parameter | Skyblock | Creative | Survival | Adventure |
|-----------|----------|----------|----------|-----------|
| Chunk strategy | Whole-world | Structure-based | Hybrid | Pre-indexed |
| Block weighting | Rarity | Pattern | Origin (player/natural) | Pre-computed |
| Retrieval trigger | Any query | Structure proximity | Exploration | Spatial approach |
| Context budget | Full world | Per-structure | Per-area | Per-location |
| Update frequency | Real-time | On-demand | Real-time | Never (immutable) |
| Indexing cost | Trivial | High | Medium | One-time |

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [ECO](../ECO/index.html) | Ecosystem modeling in Minecraft biomes; survival worlds as simplified ecological simulations |
| [VAV](../VAV/index.html) | Voxel architecture for block storage; world archetype determines storage access patterns |
| [GSD2](../GSD2/index.html) | Adaptive retrieval strategy parallels GSD's adaptive agent dispatch based on task complexity |
| [MPC](../MPC/index.html) | Embedding computation for spatial similarity; ALGEBRUS for distance matrix operations |
| [BRC](../BRC/index.html) | Museum mode parallels the BRC browsable catalog; curated experiences with guided narration |

---

## 8. Sources

1. [Minecraft Wiki -- Skyblock, Creative Mode, Survival Mode](https://minecraft.wiki/)
2. [Corrective and Adaptive RAG Patterns | arXiv](https://arxiv.org/)
3. [Limited Spectator Mod / Adventure Mode Configuration](https://minecraft.wiki/w/Adventure)
