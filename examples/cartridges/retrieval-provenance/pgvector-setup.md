# pgvector Setup Recipe

Cartridge: `retrieval-provenance`
Companion docs: `t5-retrieval-provenance/01-postgres-pgvector-practical-guide.md`

## 1. Install pgvector

### Debian/Ubuntu

```bash
sudo apt install postgresql-16-pgvector
```

### macOS (Homebrew)

```bash
brew install pgvector
```

### From source

```bash
git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### Managed providers

- **AWS RDS** — native support since RDS Postgres 15.5; enable via `CREATE EXTENSION vector`
- **Google Cloud SQL** — supported in Postgres 15+ shared previews
- **Supabase** — pre-installed; just `CREATE EXTENSION vector`
- **Neon** — pre-installed
- **Azure Database for PostgreSQL Flexible Server** — supported in Postgres 16+

## 2. Apply migrations

```bash
# Connect to the target database
export DATABASE_URL=postgresql://user:pass@localhost:5432/scribe

# Apply schema
psql "$DATABASE_URL" -f migrations/001-init.postgres.sql
psql "$DATABASE_URL" -f migrations/002-pgvector.postgres.sql
psql "$DATABASE_URL" -f fuzzy-search.sql
```

## 3. Pick an embedding model

| Model | Dim | Best for | Notes |
|---|---|---|---|
| `BAAI/bge-large-en-v1.5` | 1024 | General prose | Open-weights; SoTA on MTEB ~2024 |
| `intfloat/e5-large-v2` | 1024 | General prose | Open-weights; Microsoft Research |
| `voyage-code-3` | 1024 | Code + docs mixed | Hosted API; tuned for code |
| `text-embedding-3-small` | 1536 (or trunc) | General | Hosted; Matryoshka — truncate to 256/512/1024 |
| `nomic-embed-text-v1.5` | 768 (or trunc) | General | Open-weights; Matryoshka |

For SCRIBE the **default is `bge-large-en-v1.5` at 1024 dim** — open-weights, no per-call cost, well-tested on mixed code+prose corpora. Adjust the `vector(1024)` column type in `002-pgvector.postgres.sql` if you pick a different dimension.

## 4. Tune HNSW

Defaults from the migration: `m = 16`, `ef_construction = 64`. Tune at query time via:

```sql
SET LOCAL hnsw.ef_search = 60;  -- higher → better recall, slower query
```

Sweet-spot for 95% recall: `ef_search = 40-80`. Measure on your own corpus.

## 5. Backfill embeddings

The cartridge ships an extractor at `extractor/session-to-prov.mjs` that populates `prov_node` rows but leaves `embedding` NULL. Backfill in batches:

```sql
-- Identify rows needing embeddings
SELECT node_id, label, payload->>'subject' AS subject
FROM   prov_node
WHERE  embedding IS NULL
  AND  label IS NOT NULL
LIMIT  1000;
```

Then in your application code:

```ts
// Pseudocode — wire to your embedding API of choice
for (const batch of chunks(rows, 100)) {
  const texts = batch.map(r => `${r.label}\n${r.subject ?? ''}`);
  const embeddings = await embed(texts);  // [number[][]]
  for (const [row, emb] of zip(batch, embeddings)) {
    await pg.query(
      `UPDATE prov_node SET embedding = $1::vector WHERE node_id = $2`,
      [`[${emb.join(',')}]`, row.node_id]
    );
  }
}
```

## 6. Maintenance

- **Re-index** after a 10× corpus growth: `REINDEX INDEX CONCURRENTLY prov_node_embedding_hnsw;`
- **Bump `maintenance_work_mem`** to ≥ index size for builds (default 64 MB will spill).
- **Set `max_parallel_maintenance_workers ≥ 4`** for HNSW parallel builds (pgvector ≥ 0.6.0).
- **Pin pgvector version** in your provider settings so upgrades are deliberate, not surprise.

## 7. Verify

```sql
-- 1. Extension is loaded
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- 2. Index exists
SELECT indexname FROM pg_indexes WHERE indexname LIKE 'prov_node_embedding%';

-- 3. Hybrid query works (after backfill)
SELECT * FROM hybrid_search(
  'pgvector setup',
  '[0.1, 0.2, ...]'::vector,  -- your query embedding
  NULL,
  5
);
```

## 8. Common pitfalls

- **Forgetting to embed the query at query time** — using a stale or wrong-model embedding gives garbage recall.
- **Mixing dimensions** — `vector(1024)` cannot accept a 768-dim embedding; the model and column must match.
- **Selecting `*` in ANN queries** — pgvector returns the embedding by default (large); explicitly project the columns you need.
- **Skipping `WHERE` filters** — see doc 01 §4.2 on pre- vs post-filter; selective filters benefit from partial indexes.
