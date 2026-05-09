# retrieval-provenance — Cartridge

**Mission:** SCRIBE (v1.49.621)
**Track:** T5 — RETRIEVAL-PROVENANCE
**Source-of-truth docs:** `.planning/missions/v1-49-621-scribe/t5-retrieval-provenance/`

## What this cartridge ships

A buildable provenance substrate for code+docs corpora. Drop it into a
Postgres or SQLite database and you have a PROV-O-derived graph store
plus pgvector hybrid search plus fuzzy-search primitives plus an
extractor that turns Claude Code session archives into PROV-O bundles.

## Inventory

```
retrieval-provenance/
├── README.md                          (this file)
├── manifest.json                      (cartridge metadata)
├── pgvector-setup.md                  (Postgres + pgvector recipe)
├── chroma-setup.md                    (Chroma local-dev alternative)
├── fuzzy-search.sql                   (pg_trgm + fuzzystrmatch primitives)
├── migrations/
│   ├── 001-init.postgres.sql          (PROV-O core; Postgres)
│   ├── 001-init.sqlite.sql            (PROV-O core; SQLite parity)
│   └── 002-pgvector.postgres.sql      (optional embedding columns + HNSW)
├── prov-o-templates/
│   ├── README.md
│   ├── commit.jsonld
│   ├── session.jsonld
│   ├── decision.jsonld
│   └── file.jsonld
└── extractor/
    ├── README.md
    ├── session-to-prov.mjs            (session JSONL → SQL inserts)
    └── transcript-patterns.mjs        (pattern-matching extractor)
```

## Quickstart

### Postgres

```bash
createdb scribe
psql scribe -f migrations/001-init.postgres.sql
psql scribe -f migrations/002-pgvector.postgres.sql      # optional
psql scribe -f fuzzy-search.sql

# Extract a session archive
node extractor/session-to-prov.mjs \
  --archive .planning/sessions/<archive>.jsonl \
  --repo-root /path/to/repo \
  | psql scribe
```

### SQLite

```bash
sqlite3 scribe.db < migrations/001-init.sqlite.sql

# Note: the SQLite branch supports the core PROV-O graph + fts5 trigram
# search but does NOT include pgvector. Use Chroma alongside SQLite if
# vector recall is needed. See chroma-setup.md.
```

## Design decisions (substrate for downstream tracks)

These are the schema decisions that T3 (round-trip viewer) and T4 (dashboard)
should treat as substrate. Changing them in Wave 2 invalidates downstream work.

1. **PROV-O as the ontological backbone** — `prov_node` `node_type` is
   the closed PROV-O class set; `relation` is the closed PROV-O property
   set. CHECK constraints enforce both.
2. **Edge-list normal form** — two flat tables (`prov_node`, `prov_edge`),
   never one-table-per-relation.
3. **JSONB payloads** — heterogeneous attributes per node-type without
   column proliferation; promote hot keys to generated columns when needed.
4. **Content-addressed edge IDs** — `edge_id = sha256(src||rel||dst)[:16]`.
   Idempotent re-application; deterministic dedup.
5. **Sub-type discriminator** — `sub_type` distinguishes `commit`, `session`,
   `file`, `decision`, `alternative`, `task`, `evidence` within the PROV-O
   class. Downstream queries filter on `sub_type` first.
6. **Convenience views over edge list** — `commits_view`, `sessions_view`,
   `decisions_view` give strict-table semantics where the application wants
   them, without storing data twice.
7. **Recursive CTE traversal** — `upstream()` and `downstream()` SQL
   functions are the canonical graph-walk; no graph DB at this scale.
8. **Hybrid search via RRF** — `hybrid_search()` fuses pgvector ANN with
   `tsvector` BM25 via Reciprocal Rank Fusion (k=60). Standard combiner.
9. **IC-NNN-N.N as first-class** — the gsd-skill-creator commit-subject
   convention surfaces as `task` nodes with `identifier` payload.
10. **Pluggable extractor** — `session-to-prov.mjs` is the reference;
    bring your own session format by following the same node/edge mapping
    pattern.

## SQLite parity

Per the `portable-schema-generator` skill, the cartridge ships paired
Postgres and SQLite migrations. Differences (documented in
`migrations/001-init.sqlite.sql` header):

| Concern | Postgres | SQLite |
|---|---|---|
| Schema namespace | `scribe.` schema prefix | flat namespace |
| Timestamps | `TIMESTAMPTZ DEFAULT now()` | `TEXT DEFAULT (strftime(...))` |
| JSON column | `JSONB` | `TEXT` + `json_extract()` |
| Trigram index | `USING gin (col gin_trgm_ops)` | `fts5(... tokenize='trigram')` |
| Recursive functions | `CREATE FUNCTION ... LANGUAGE SQL` | App-side query templates |
| Vector | `vector(1024)` + HNSW | Not available; use Chroma alongside |

## License

Same license as the parent gsd-skill-creator repository.

## See also

- `t5-retrieval-provenance/REPORT.md` — convoy closeout report
- `t5-retrieval-provenance/01..06-*.md` — six required documents
- `t5-retrieval-provenance/sample-provenance/` — working demo on real commits
