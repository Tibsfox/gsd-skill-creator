# v1.49.607 — Structural Summary

## Milestone identity

**GSD Code Atlas — full milestone (28 commits: W0 → W4a → D1–D5 → E1–E4)**
Counter-cadence. No NASA/MUS/ELC/SPS/TRS engine advance.

## Structural firsts

1. **First ADR-as-CI-gate** — `tools/atlas-deps-audit.mjs` operationalises ADR 0003 (clean-room
   policy) as a runnable enforcement tool.  This is the first milestone where an ADR's policy
   constraint is verified mechanically at every run rather than by prose review alone.

2. **Second operational application of mission-package-as-milestone-context pattern** (Lesson
   #10222 reaffirmation) — the W0–W4 wave structure was dispatched from a single mission package
   staging document.  Each wave executed against a known-good prior wave tip.

3. **Clean-room rendering primitives as new substrate** — five independent algorithm
   implementations shipped across W0.5: graph-renderer (Fruchterman–Reingold force layout +
   quadtree Barnes-Hut + viewport pan/zoom), pack-layout (Wang-Wang circle-pack + Reingold-Tilford
   tree + smallest-enclosing-circle), scales+sankey (linear/log/time scales + Heckbert ticks +
   Sankey iterative layout + SVG renderer), syntax/parsers (state-machine lexers for 9 languages),
   search/trigram (TrigramIndex + query engine + highlighter).  Zero external runtime deps added
   (ADR 0003 clean-room; baseline package.json unchanged at 27 runtime deps).

4. **Migration 003 as third additive SQLite migration** — `003_atlas_symbols.sql` extends the
   Intelligence KB schema with `atlas_symbols`, `atlas_call_edges`, `atlas_type_relations`, and
   `atlas_file_index` tables.  The migration is additive-only (no DROP, no ALTER on existing
   columns), matching the ADR 0002 dual-impl precedence contract.

5. **117 new TypeScript files, ~370 new atlas-specific tests** — the largest single-milestone
   code surface since the artemis-ii memory arena (M1-M13, ~15,575 Rust lines).

## Engine state at v607 close

- NASA: 1.84 (Apollo 17, v606) — HELD
- MUS: 1.84 — HELD
- ELC: 1.84 — HELD
- SPS: species #80 (Black-backed Woodpecker, v605) — HELD; #81 TBD
- TRS M1 W2: pack-01 bound (48 edges, v605) — HELD

## Test count

- Atlas-specific tests: ~460 (24 test files in src/atlas/ + desktop/intelligence/atlas/;
  +90 net across D1–E4: 16 D1 + 12 D2 + 13 D3 + 4 D4 tools + 10 E2 + 16 E3 + 9 E4 Rust)
- Repo-wide (vitest run): **29,841 passing** (29,866 total — 17 skipped — 7 todo)
- tools-config tests: 9 new (atlas-deps-audit.test.mjs × 5 + atlas-perf-bench.test.mjs × 4)
  + 9 prior = 18 total

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
