# v1.49.607 — Structural Summary

## Milestone identity

**GSD Code Atlas — full milestone (28 commits: W0 → W4a → D1–D5 → E1–E4)**
Counter-cadence. No NASA/MUS/ELC/SPS/TRS engine advance.

## Structural firsts

**First ADR-as-CI-gate.** `tools/atlas-deps-audit.mjs` operationalises ADR 0003 (clean-room
   policy) as a runnable enforcement tool.  This is the first milestone where an ADR's policy
   constraint is verified mechanically at every run rather than by prose review alone.

2. **Second operational application of mission-package-as-milestone-context pattern** (Lesson
   #10222 reaffirmation) — the W0–W4 wave structure was dispatched from a single mission package
   staging document.  Each wave executed against a known-good prior wave tip.

**Clean-room rendering primitives as new substrate.** five independent algorithm
   implementations shipped across W0.5: graph-renderer (Fruchterman–Reingold force layout +
   quadtree Barnes-Hut + viewport pan/zoom), pack-layout (Wang-Wang circle-pack + Reingold-Tilford
   tree + smallest-enclosing-circle), scales+sankey (linear/log/time scales + Heckbert ticks +
   Sankey iterative layout + SVG renderer), syntax/parsers (state-machine lexers for 9 languages),
   search/trigram (TrigramIndex + query engine + highlighter).  Zero external runtime deps added
   (ADR 0003 clean-room; baseline package.json unchanged at 27 runtime deps).

**Migration 003 as third additive SQLite migration.** `003_atlas_symbols.sql` extends the
   Intelligence KB schema with `atlas_symbols`, `atlas_call_edges`, `atlas_type_relations`, and
   `atlas_file_index` tables.  The migration is additive-only (no DROP, no ALTER on existing
   columns), matching the ADR 0002 dual-impl precedence contract.

**117 new TypeScript files, ~370 new atlas-specific tests.** the largest single-milestone
   code surface since the artemis-ii memory arena (M1-M13, ~15,575 Rust lines).

## Engine state at v607 close

- NASA: 1.84 (Apollo 17, v606) — HELD
- MUS: 1.84 — HELD
- ELC: 1.84 — HELD
- SPS: species #80 (Black-backed Woodpecker, v605) — HELD; #81 TBD
- TRS M1 W2: pack-01 bound (48 edges, v605) — HELD

## Test count

- Atlas-specific tests: ~478 (24 src/atlas + desktop/intelligence/atlas + 18 W4c
  atlas-bridge.test.ts; +90 net across D1–E4 + 18 W4c)
- Repo-wide (vitest run): **30,025 passing** (30,049 total — 17 skipped — 7 todo)
  at W4c.5 polish close.  W4d/W4e endpoints are live-tested rather than unit-tested
  because they exercise external services (PG + Chroma + git subprocess).
- tools-config tests: 9 new (atlas-deps-audit × 5 + atlas-perf-bench × 4) + 9 prior
  = 18 total

## Atlas surface (post-E4)

- `src/atlas/` — 57 TypeScript files (graph-renderer, pack-layout, sankey, scales, syntax,
  search primitives)
- `desktop/intelligence/atlas/` — 32 TypeScript files (shell, coordinator, focus-state,
  system-map, symbol-graph, archeology, code-view, search-palette)
- `src-tauri/src/intelligence/atlas.rs` — 12 pre-existing Tauri commands +
  `SqliteAtlasKbDelegate` (~470 lines; E4); `AtlasState::default()` now uses SQLite delegate
- `tools/atlas-deps-audit.mjs` — ADR 0003 enforcement tool
- `tools/atlas-perf-bench.mjs` — syntax tokenizer perf bench (D4; 9 languages × 10K LOC)
- `dist/dashboard/atlas.html` + nav updates — dashboard integration

## Structural firsts added by D/E waves

6. **First real Rust SQLite delegate for the Atlas IPC surface (E4)** — `SqliteAtlasKbDelegate`
   in `src-tauri/src/intelligence/atlas.rs` mirrors the `RealKbDelegate` pattern from the
   v1.49.597 Intelligence surface.  Registry at `~/.gsd/intelligence/registry.db`; per-project
   DB at `<project>/.gsd/intelligence/intelligence.db`.  Empty-state contract: no-registry /
   unknown-snapshot both return `Ok(vec![])`, never `Err` — the desktop tab stays blank, not
   broken.

7. **First sticky-regex lexer engine (D5)** — eliminates the O(n²) `source.slice(pos)` pattern
   in `src/atlas/syntax/lexer-state-machine.ts`.  8 of 9 grammars exceed the 10K LOC/sec
   mission-spec target at 10K-line scale; GLSL bottleneck is the coarse-AST pipeline, not the
   lexer (deferred as D6 candidate).

## Structural firsts added by W4c / W4d / W4e

8. **First browser-mode atlas (W4c)** — the four-pane shell + Cmd-K palette load directly
   from `dashboard/atlas.html` against the dashboard's existing
   `POST /api/intelligence/invoke` HTTP IPC bridge.  The bridge gained 14 atlas command
   handlers via `src/intelligence/atlas-bridge.ts` + `installAtlasCommands()`, mirroring
   the Rust `SqliteAtlasKbDelegate` over an in-process scan-every-project resolution
   model.  ADR 0003 invariant preserved: the new atlas browser bundle imports nothing
   from `@tauri-apps/api`; `atlas-deps-audit --strict` reports 0 violations.

9. **First Postgres atlas mirror schema (W4e.A)** — `atlas` schema in the existing
   `tibsfox` DB mirrors the SQLite migration 003 tables with `(project_id, id)`
   composite primary keys, a `GENERATED ALWAYS AS … STORED` `TSVECTOR` for sub-50 ms
   text search, and a `vector(384)` column with an ivfflat cosine index for W4e.B.
   Write-through architecture: SQLite stays canonical, the mirror is a derivative
   cache; failures log + skip rather than blocking.

10. **First in-process pgvector semantic search (W4e.B)** — `@huggingface/transformers`
    quantized `Xenova/all-MiniLM-L6-v2` (~25 MB weights, no GPU, ~192 symbols/s on CPU)
    runs server-side in the dashboard process.  Symbol embeddings populated post-mirror;
    cosine search exposed at `POST /api/atlas/search/semantic`.  Verified at 97,705
    embedded symbols against this repo with sub-300 ms query latency.

11. **First ChromaDB mission-doc collection (W4e.C)** — `gsd-missions` collection
    holding `.planning/missions/**/*.md` content with metadata (`milestoneTag`,
    `missionDir`, `path`).  Embeddings supplied explicitly via the same Xenova
    pipeline used for pgvector — the chromadb 3.x default-EF dep is sidestepped, and
    cross-store similarity is well-defined because both stores share an embedding
    space.  Exposed at `GET /api/atlas/mission-search?q=…`.

12. **First file → milestone → planning-doc chain via git-tags-only (W4d)** — three
    git-backed endpoints (`/api/atlas/file-history`, `/api/atlas/mission-docs`,
    `/api/atlas/file-blame`) plus a `.planning/missions/v1-49-NNN-*/` glob convention
    give any GSD repo a zero-config provenance chain.  No `mission_links` registry
    required; works on any file with git history.
