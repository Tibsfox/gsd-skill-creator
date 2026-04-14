# HKP Series Retrospective

*Housekeeping research series — what the nine-document pipeline produced, and what the series revealed about the topic itself.*

**Date:** 2026-04-10
**Series:** HKP
**Documents:** 9
**Core words:** 26,383
**Agents used:** 9 parallel (general-purpose)

---

## What the series is

Nine scholarly documents covering data management, storage, housekeeping, and fast retrieval as a unified field. The framing was deliberately unusual: most literature treats indexes, databases, caches, and governance as separate disciplines. This series treats them as facets of a single concern — *how do we keep data findable and trustworthy over time?* — and built the arc accordingly.

## What went well

**The four-question framing held together.** The series is organized around four interlocking questions:
1. What are we managing?
2. Where does it live?
3. How do we find it?
4. How do we care for it over time?

Every document answered some part of at least one question, and no document straddled more than two. This made the decomposition clean — no agent produced work that overlapped another agent's territory.

**The PIM document as a foil.** Putting personal information management next to enterprise governance was the structural decision that most paid off. It forces the reader to confront the scale asymmetry: the same techniques that work on Google's corpus break on your own laptop because you don't have click signal, a massive document set, or a relevance team. This reframes what "data management" even means.

**Parallel dispatch held up at 9 agents.** The previous DMN series ran 8 parallel agents cleanly. This one ran 9 with no failed or off-topic outputs, and average word count actually rose (2,958 → 2,931 core, but median 2,899 → 2,999). The pattern scales.

**Direct project relevance.** Unlike the DMN series (data mining as a discipline), HKP maps one-to-one onto active code in the Memory Arena / Grove work. Every document has a concrete analog in the codebase:
- Storage hierarchy → RAM + NVMe + VRAM + cold source tiers
- Indexing → HNSW embedding index
- Search → TF-IDF + dense hybrid retrieval
- Caching → crossfade promote/demote with hysteresis
- Lifecycle → sweep daemon, orphan recovery, compaction
- Catalogs → Grove format, content-addressed records

The research series is, in effect, a literature review for work already in flight. That's the best possible condition for a deep-research pipeline.

## What's missing

**No code artifacts.** Unlike the RNG series (which shipped working PCG implementations), HKP is pure prose. Follow-ups could include:
- A miss-ratio curve (MRC) benchmark harness for the Arena caching layer, operationalizing SHARDS.
- A reference HNSW configuration table with recall/latency/memory at different M and efConstruction values, tied to your pre-indexed embedding work.
- A tombstone/GC pressure benchmark for the Arena's journal compaction.

**Not enough on non-Western database history.** The databases-and-stores document leans on US tech company canon (Google BigTable, Amazon Dynamo, Facebook RocksDB). The Yandex / Alibaba / ByteDance lineage — ClickHouse, TiDB, Cassandra deployments at China scale — is underweighted. A "Regional Histories of Data Infrastructure" follow-up would fix this.

**Failure cases are thin.** Most of the docs describe how things are *supposed* to work. The lifecycle document touches on tombstone pathology, but the series doesn't systematically cover famous incidents: the Uber MySQL/Postgres schism (2016), the GitHub 24-hour outage (2018), the AWS S3 outage (2017), the Heroku Postgres follower-promotion incidents. A "Data Management Postmortems" document would be a natural extension.

**Benchmarks are absent.** Jeff Dean's "latency numbers" are mentioned, but the series doesn't update them for 2026 — NVMe Gen5 latencies, HBM3 bandwidth, S3 Express One Zone numbers, DRAM persistence across restarts (via NVDIMM or CXL). A "Latency Numbers for 2026" update would be a single-document companion worth writing.

## Observations about the topic

**The discipline is fractured by scale.** The same techniques that work at hyperscale (Google, AWS) don't work at personal scale. The reverse is also true: Obsidian's markdown-on-disk approach would collapse at 100M documents; Google's web crawl approach is absurd for a single user. The series makes this tension visible but doesn't resolve it, because it isn't resolvable — it's structural.

**Storage hierarchy is the most load-bearing concept.** Doc 2 (storage-hierarchy) is the one the other eight documents implicitly reference most. Every trade-off in databases, indexes, caches, and lifecycle comes back to "which tier are we on?" The memory wall (Wulf & McKee 1995) is still the central economic reality 31 years later.

**Housekeeping is underrated.** The lifecycle and catalogs documents (7, 8) are the ones most readers would skip, and also the ones that produce most production outages. Compaction tuning, vacuum settings, lineage gaps, schema drift — these are what page oncall at 3am, not a poorly-tuned index. The series gives them proportional weight, which is unusual for the genre.

**The "finding things fast" problem is a retrieval cascade.** The reason a search query feels instant is not one clever algorithm but a six-layer pipeline: cached results → inverted index → posting list intersection → BM25 scoring → dense reranker → learning-to-rank. Each layer costs a few ms. Taking any layer out makes the experience unacceptable. Doc 4 and Doc 5 together make this cascade visible.

## Observations about the process

**Briefs with concrete paper citations landed higher word counts.** The two longest documents (data-foundations at 3,702 and storage-hierarchy at 3,307) had the most specific name/year/paper references in their briefs. The agent had more "targets to hit" and produced denser prose. Briefs with more general concept lists produced shorter, more summary-flavored outputs.

**The "Format reference" line is doing real work.** Every brief pointed at a specific prior document (`rng-research/history-origins.md` or `dmn-research/history-origins.md`). The outputs matched that reference consistently — italic subtitle, em-dash framing, H2 sections, narrative prose. Without that anchor, agents drift toward bullet-point summaries.

**9 parallel > 8 parallel was not noticeably slower.** Wall-clock from dispatch to last completion was roughly comparable to DMN's 8-agent run. The bottleneck is per-agent research time, not orchestration cost. Future series can probably go to 12 agents without degrading throughput.

**Completing sources-verified notes is worth the tokens.** One agent (data-foundations) voluntarily returned source URLs along with the completion message. That's a pattern worth encouraging in future briefs: "After writing, reply DONE: file.md, N words. If you used web sources, list up to 5 as bullet points."

## Metrics

| Metric | Value |
|--------|-------|
| Documents produced | 9 |
| Total words (core) | 26,383 |
| With README + retrospective | ~28,500 |
| Shortest document | 2,389 (databases-and-stores) |
| Longest document | 3,702 (data-foundations) |
| Mean per document | 2,931 |
| Median per document | 2,999 |
| Parallel agents used | 9 |
| Failed agents | 0 |
| Revision rounds needed | 0 |
| Format consistency | 9/9 |

## Lessons for the next series

1. **Four-question framings beat topic-list framings.** "Decompose into 9 documents" is underspecified; "answer these 4 questions across 9 documents" produces cleaner boundaries.
2. **Always include one document at human scale.** The PIM document reframes the whole series. Future series should include at least one doc that drops from enterprise to individual scale (or vice versa) to force the framing shift.
3. **Specific paper citations in briefs produce denser output.** Name-drop shamelessly in the brief.
4. **Direct project relevance is the best fuel.** HKP maps onto active code. The prose is sharper when the researcher knows the topic will be used, not just archived.
5. **Ask agents to return sources in the completion note.** Cheap, useful, easy to add.

## Open follow-ups

- **HKP-2:** a sequel focused on failure cases — Data Management Postmortems. Cassandra tombstone pathologies, Postgres VACUUM blowups, S3 outages, GitHub split brain.
- **Latency Numbers for 2026:** a single-document update to Jeff Dean's 2012 table.
- **HNSW tuning guide:** applied follow-up to doc 4, with benchmarks on a real corpus.
- **Code companion:** reference implementations of LRU, ARC, and W-TinyLFU in Rust, with a MRC benchmark, matching the RNG series's PCG implementation.
