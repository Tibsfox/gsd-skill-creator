# Session-to-Provenance Extractor

Reference implementations of the session→PROV-O extraction pipeline
described in `t5-retrieval-provenance/06-reasoning-metadata-capture.md`.

## Files

| File | Purpose |
|---|---|
| `session-to-prov.mjs` | Convert `.planning/sessions/<archive>.jsonl` + `.meta.json` + `git log` into idempotent SQL inserts for `prov_node` + `prov_edge` |
| `transcript-patterns.mjs` | Pattern-matching extractor for unstructured transcripts; emits JSONL events compatible with `observe.mjs` |

## Quickstart

```bash
# 1. Apply schema to your database
psql "$DATABASE_URL" -f ../migrations/001-init.postgres.sql

# 2. Extract a session into SQL
node session-to-prov.mjs \
  --archive  /path/to/.planning/sessions/2026-04-25-cs25-26-sweep.jsonl \
  --repo-root /path/to/gsd-skill-creator \
  > /tmp/prov.sql

# 3. Apply
psql "$DATABASE_URL" -f /tmp/prov.sql
```

## Pattern-extractor usage

```bash
# Extract decision/friction/evidence candidates from a transcript dump
cat transcript.txt | node transcript-patterns.mjs > extracted-events.jsonl

# Append to a live observe.mjs session (after manual review)
cat extracted-events.jsonl >> .planning/sessions/current.jsonl
```

## Pattern set versioning

The v1 pattern set is intentionally minimal. As you observe high-value
patterns specific to your workflow, add them to `PATTERNS_V2` (or further)
and bump the `extracted_from` payload tag. Versioning the pattern set
matters: future you needs to know which pattern version produced a given
extracted event.

## Limitations

- The extractor does **not** capture implicit decisions (decisions made
  silently by the model). Use `observe.mjs event decision ...`
  during the session to capture them.
- The extractor does **not** semantic-link evidence to decisions.
  That requires a second LLM pass; see doc 06 §5.2 for the deferred
  approach.
- The extractor sets all extracted events to a single timestamp; for
  per-event timestamps, use `observe.mjs` instead of post-hoc extraction.

See doc 06 for full discussion.
