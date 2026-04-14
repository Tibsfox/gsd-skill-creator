# Housekeeping Research Series (HKP)

*A deep research series on data management, storage, housekeeping, and fast retrieval — from Vannevar Bush's Memex to HNSW vector indexes, from punch cards to persistent memory.*

**Project code:** HKP
**Documents:** 9
**Core words:** 26,383
**Status:** Complete
**Date:** 2026-04-10

---

## The four questions

This series answers four interlocking questions:

1. **What are we managing?** (data-foundations)
2. **Where does it live?** (storage-hierarchy, databases-and-stores)
3. **How do we find it?** (indexing-and-retrieval, search-and-query, caching-and-tiering)
4. **How do we care for it over time?** (lifecycle-and-housekeeping, catalogs-and-governance, personal-information-management)

The "housekeeping" framing is deliberate. Most data management literature focuses on the build — schemas, indexes, queries — and underweights the care. This series gives the care layer equal billing: retention, compaction, lineage, governance, and the individual's lifelong struggle to find their own stuff.

## Reading order

| # | Document | Words | Focus |
|---|----------|-------|-------|
| 1 | [Data Foundations](data-foundations.md) | 3,702 | Bytes, schemas, typing, naming, metadata as first-class |
| 2 | [Storage Hierarchy](storage-hierarchy.md) | 3,307 | Punch cards → tape → HDD → SSD → NVMe → Optane → DNA |
| 3 | [Databases and Stores](databases-and-stores.md) | 2,389 | Relational, KV, document, columnar, graph, vector, time-series |
| 4 | [Indexing and Retrieval](indexing-and-retrieval.md) | 3,032 | B-trees, LSM, hash, inverted, spatial, HNSW, bloom filters |
| 5 | [Search and Query](search-and-query.md) | 2,999 | SQL, NoSQL, Lucene, semantic search, RAG, hybrid retrieval |
| 6 | [Caching and Tiering](caching-and-tiering.md) | 2,525 | LRU, ARC, W-TinyLFU, working sets, tier migration, prefetching |
| 7 | [Lifecycle and Housekeeping](lifecycle-and-housekeeping.md) | 2,546 | Retention, VACUUM, compaction, tombstones, dedup, deletion |
| 8 | [Catalogs and Governance](catalogs-and-governance.md) | 2,811 | FAIR, lineage, provenance, data contracts, data mesh, observability |
| 9 | [Personal Information Management](personal-information-management.md) | 3,072 | Memex, Zettelkasten, PARA, Obsidian, Roam, lifelogging, AI assistants |

## How the documents connect

**Foundations → Everything.** Doc 1 establishes the vocabulary (record, schema, metadata, identity) the rest of the series uses.

**Storage ↔ Databases ↔ Indexes.** Docs 2–4 form a triangle. The physical hierarchy (2) constrains the database paradigms (3) that choose which indexes (4) to build. Every database is an opinion about which tier to run on and which indexes to build first.

**Indexes → Search → Caching.** Docs 4–6 form the "finding it fast" spine. Indexes give you logarithmic lookup, search gives you user-facing retrieval, caching keeps the hot subset ready. Each layer depends on the one beneath it.

**Lifecycle → Catalogs.** Docs 7–8 form the governance pair. Lifecycle is the mechanical side (what happens to bytes as they age); catalogs are the semantic side (what the organization knows about those bytes).

**PIM as the singular case.** Doc 9 is deliberately outside the enterprise frame. The individual trying to find their own files faces a harder retrieval problem than a search engine: small corpus, sparse metadata, no click signal. It's the test case that exposes what the enterprise tools can and can't solve at human scale.

## Relationship to active project work

This series maps directly onto the Memory Arena / Grove work on the `artemis-ii` branch:

- **Storage hierarchy (Doc 2)** → the multi-tier Arena (RAM + NVMe + VRAM + postgres cold source).
- **Indexing (Doc 4)** → HNSW vector indexes, embedded pre-indexes that beat MemPalace at NDCG@10=0.899.
- **Search (Doc 5)** → hybrid TF-IDF + embedding retrieval in the Grove search layer.
- **Caching and tiering (Doc 6)** → crossfade promote/demote policies, hysteresis cooldowns, working-set estimation.
- **Lifecycle (Doc 7)** → sweep driver, orphan recovery, compaction of the arena journals.
- **Catalogs (Doc 8)** → Grove format, knowledge-nodes.json in this very series, content-addressed records.
- **PIM (Doc 9)** → the whole point: the user's lifelong private knowledge graph, carefully managed.

## Key themes

- **The storage hierarchy is load-bearing.** Every engineering decision in data management is downstream of which tier the data lives on. Optimizations that ignore tier economics are usually wrong.
- **Naming is harder than it looks.** Karlton's aphorism survives because it is true. Content addressing, URIs, entity resolution, and the identity problem cost more engineering time than indexes do.
- **Deletion is expensive.** Getting rid of data is often harder than adding it. Tombstones, soft deletes, cascading FKs, GDPR right-to-erasure, and machine unlearning all reflect the same underlying asymmetry.
- **The 80% folklore recurs.** Every era has its "80% of data is unstructured" or "80% of project time is data cleaning" claim. The series flags these as folklore worth examining, not ground truth.
- **Personal retrieval is harder than web retrieval.** Google has click signals, a massive corpus, and thousands of engineers. An individual has none of those. That's why PIM is still an unsolved problem in 2026.

## Files in this directory

```
hkp-research/
├── README.md                        ← this file
├── data-foundations.md              ← Doc 1
├── storage-hierarchy.md             ← Doc 2
├── databases-and-stores.md          ← Doc 3
├── indexing-and-retrieval.md        ← Doc 4
├── search-and-query.md              ← Doc 5
├── caching-and-tiering.md           ← Doc 6
├── lifecycle-and-housekeeping.md    ← Doc 7
├── catalogs-and-governance.md       ← Doc 8
├── personal-information-management.md ← Doc 9
├── knowledge-nodes.json             ← cross-reference graph
└── retrospective.md                 ← series retrospective
```

## Companion series

- [rng-research](../rng-research/) — random number generation, 28,427 words
- [research-methodology](../research-methodology/) — how research itself is done, 43,522 words
- [dmn-research](../dmn-research/) — data mining as a discipline, 23,666 words
