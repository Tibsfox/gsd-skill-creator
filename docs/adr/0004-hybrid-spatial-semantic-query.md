# ADR 0004 — Hybrid PostGIS + pgvector Spatial-Semantic Query Path

**Date:** 2026-05-10
**Status:** Accepted
**Supersedes:** None
**Predecessors:** ADR 0001 (vendoring policy), ADR 0003 (atlas clean-room policy)

## Context

The v1.49.607 atlas mirror at `src/intelligence/atlas-pg/` already shipped pgvector with an IVFFlat index on `atlas.symbols.embedding` for semantic-similarity search across 97,705+ symbols. The Part A GIS / Spatial Substrate research mission identified a complementary primitive — PostGIS spatial proximity via `ST_DWithin` + GiST — that co-exists in the same database, operates on a different column type, and combines with pgvector in a single SQL query.

The Part B build mission (component 03) absorbs the PostGIS + pgvector hybrid pattern into the atlas as a first-class query path. The decision recorded here covers *how* the two indexes compose so the planner uses both correctly.

## Decision

The atlas's hybrid spatial-proximity + semantic-similarity SQL is composed via a **CTE-MATERIALIZED prefilter pattern**:

```sql
WITH spatial_candidates AS MATERIALIZED (
  SELECT s.id, s.embedding, s.position, ...
  FROM atlas.symbols s
  WHERE s.position IS NOT NULL
    AND ST_DWithin(s.position, ST_SetSRID(ST_MakePoint($x, $y), 0), $radius)
)
SELECT id, ..., embedding <=> $query_vec AS semantic_distance
FROM spatial_candidates
ORDER BY embedding <=> $query_vec
LIMIT $k;
```

The GiST index on `position` leads (cheap bounding-box prune); the IVFFlat / HNSW index on `embedding` ranks survivors. The `MATERIALIZED` keyword forces the planner to materialise the spatial CTE before the vector sort runs.

## Consequences

**Positive:**
- Single SQL surface for two-axis search (spatial + semantic). Composes existing v607 pgvector work without modifying it.
- Correct cost model: the spatial filter (typically very selective — a 300-unit window pulls ~100 of 100K candidates) leads, so the vector ranking runs on a small set. Estimated 10–100× latency drop over a planner-default plan.
- pgvector and PostGIS columns / indexes don't interfere — different access methods, different operator classes.

**Negative:**
- The `MATERIALIZED` hint is required. Removing it (or relying on planner defaults) can invert the cost model for some workloads. The hint is captured as a constant in `src/atlas/spatial/hybrid-query.ts` and asserted by EXPLAIN tests.
- Per-row `<=>` cosine on candidates plus the spatial filter does double work compared to a pure vector search. For workloads where spatial relevance is irrelevant, the existing `src/intelligence/kb/symbols.ts` semantic search path is the right tool.

**Neutral:**
- SRID 0 throughout. The atlas does not have an Earth projection; `ST_DWithin` operates on logical layout coordinates.
- IVFFlat is the index in production at v1.49.607 (lists=100). If symbol count grows past ~10M, a re-tune to HNSW or larger-list IVFFlat may be warranted; that's a future decision.

## Alternatives Considered

1. **Pure pgvector search + post-filter spatially in app code.** Rejected: forces the planner to walk the entire IVFFlat and discard candidates after the network round-trip. Latency dominated by candidate count, not result count.
2. **Pure ST_DWithin search + brute-force cosine in app code.** Rejected: pulls all spatially-relevant rows over the wire including the 384-dim embedding. Bandwidth-bound.
3. **Two separate IPC calls (one spatial, one semantic) and intersect in app.** Rejected: doubles the round trips and makes the rank-fusion ad-hoc.
4. **Drop the `MATERIALIZED` hint and trust the planner.** Rejected: empirical test on a 100K-row fixture shows the planner can pick HNSW-leading or GiST-leading depending on `pg_stat_statistics` freshness; the hint pins the correct plan.

## References

- `.planning/missions/gis-spatial-substrate/research/mission.pdf` §2.4.6 — PostGIS + pgvector Hybrid (Critical) — Part A research mission citation base.
- `.planning/missions/gis-spatial-substrate/research/waves/W1-trackB-M3-M4.md` §4.6 — worked hybrid SQL example with MATERIALIZED pattern.
- `src/atlas/spatial/hybrid-query.ts` — the runtime implementation.
- `src/atlas/spatial/__tests__/hybrid-query.test.ts` — plan-shape and result-correctness tests.
- PostGIS Spatial Indexing Workshop (`http://postgis.net/workshops/postgis-intro/indexing.html`) — bounding-box-as-indexed-surface invariant.
- pgvector documentation (`https://github.com/pgvector/pgvector`) — IVFFlat / HNSW operator classes.
- Crunchy Data, "The Many Spatial Indexes of PostGIS" by Paul Ramsey — GiST vs SP-GiST vs BRIN tradeoffs.
