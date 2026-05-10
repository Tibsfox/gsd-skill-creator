# v1.49.607 — GSD Code Atlas (counter-cadence)

**Released:** 2026-05-06
**Type:** Engine-cadence degree-advancing milestone (v604+ run)
**NASA Mission:** GSD Code Atlas (counter-cadence)
**Predecessor:** v1.49.606
**Mission package:** `.planning/missions/v1-49-607-gsd-code-atlas-counter-cadence/`
**Phases:** 6 (W0-W5 wave-pipeline: W0 version+brief / W1 research / W2 build / W3 recovery+catalog / W4 release-notes / W5 ship-pipeline)

## Summary


**Shipped:** 2026-05-05
**Predecessor:** v1.49.606 (Apollo 17 Final Crewed Lunar Landing; NASA 1.84)
**Cadence:** counter-cadence (no NASA/MUS/ELC/SPS/TRS engine advance)

## Through-line

> *The atlas gives the codebase a mirror: every symbol, every file relationship, every mission's
> fingerprint — visible in one coherent surface.  What took days of archaeology across grep and
> git-log is now a single click.*

v1.49.607 is the full GSD Code Atlas milestone — 60 commits across nine wave clusters.
W0–W3 built the clean-room primitives, substrate, views, and shell.  W4a closed the
ADR 0003 enforcement tool, dashboard hookup, user guide, and release-notes structure.
D1–D5 closed known scope-internal deferred items (extractor surgeries, IPC completeness,
linker idempotency, a11y, perf bench, sticky-regex engine fix).  E1–E4 closed newly-surfaced
items, the critical being E4: a real Rust SQLite delegate replacing the stub that had been
returning `Err` for all 13 IPC commands — the fix that made the atlas IPC actually functional.
W4c added a browser-mode atlas (no Tauri shell required) via the dashboard's HTTP IPC bridge.
W4d added file ↔ milestone ↔ planning-doc wiring through git tags + the `.planning/missions/`
convention.  W4e added a Postgres + pgvector + ChromaDB acceleration stack so symbols are text-
and semantic-searchable across projects, and planning docs are retrievable by content.
Engine state is held across all five tracks — this is a pure tooling/infrastructure milestone.

See `chapter/05-w4d-w4e-addendum.md` for the full W4c/W4d/W4e narrative + endpoint inventory
+ six new forward-lesson candidates (#10260–#10265).

## Cross-track context

| Track | State | Note |
|---|---|---|
| NASA | 1.84 (Apollo 17) | HELD — v606 closed at 1.84; no advance this milestone |
| MUS | 1.84 | HELD |
| ELC | 1.84 | HELD |
| SPS | Species #81 (TBD) | HELD — no new SPS species this milestone |
| TRS | M1 W2 pack-01 bound | HELD — 48 cross-pack edges; no new pack bound this milestone |

## Substrate provider cross-reference

- **v1.49.597** — Intelligence Dashboard substrate provider (KB, SSE, IPC, Tauri shell); the
  atlas builds on top of this without modifying the substrate layer.
- **v1.49.606** — immediate predecessor degree-advancing milestone; engine state at v606 close
  is the starting state for this milestone.

## Wave summary

| Wave | Commits | Deliverables |
|---|---|---|
| W0 | d381ac095 | types + migration 003 + atlas schemas |
| W0.5 | cc4535170 / 54c4c7bbb / 4e7df2177 / f4c67c69c + 7d0000ea0 | graph-renderer + pack-layout + scales+sankey + syntax/parsers |
| W1 | aeaacca28 / 97609a0f7 / ee9dadfbd | symbol indexer+resolver + KB+provenance + Tauri/SSE/IPC |
| W2 | 563b2d7f5 / 872fe3b0c / 4b13b86d5 / 5e27ab6d7 / 1d220bca3 | system-map + symbol-graph + archeology + code-view + search-palette |
| W3 | 146e83ec1 | atlas shell + URL-hash coordinator |
| W4a | f0b4959ec / 18b360fc8 / 3a5b9dc32 / c4b33cf19 | atlas-deps-audit + dashboard hookup + user guide + release-notes |
| D1–D5 | 9126055b7 / c80962ae9 / 9161a72c8 / 2639c6e55 / c3a7a8f37 | extractor surgeries + IPC completeness + linker idempotency + a11y + perf bench + sticky-regex engine |
| E1–E4 | 9c769c691 / 784c6fbfc / 7ecd6c2b7 + E1 | C++ operator overloads + nested-class methods + TS re-exports + Rust nested-fn + real SQLite delegate (CRITICAL) |
| W4c.1–.5 | 874d35d46 / c7707048a / 3d581ffbb / b7c627119 / c2639fca1 / 3a48febb9 | browser atlas: HTTP IPC bridge + atlas browser bundle pipeline + drop Tauri-only gate + inline component CSS + SQL migrations into dist + spot-check usability polish |
| W4d.1–.3 | 786955eab / 660a910f2 / 0e9533947 / 682bf59ee | git-history endpoints + archeology pane file-overlay + gutter blame badges + CLI exclude-dirs + polish |
| W4e.A–.C | 786955eab / 660a910f2 / 3d61a5e13 / f9791501e | Postgres atlas mirror + pgvector semantic search + Chroma mission-doc retrieval + auto-discover snapshots |

## Forward lessons emitted

- **#10248 CANDIDATE** — clean-room rebuild costs ~2.5× the original estimate when the
  primitive set (graph-renderer, pack-layout, scales+sankey, syntax/parsers, trigram search)
  is built from published algorithms rather than wrapping an existing library.
- **#10249 CANDIDATE** — ADR-as-supply-chain-policy (ADR 0003) converts a prose rule into a
  CI-gated invariant; the audit tool closes the enforcement loop at < 100 ms per run.
- **#10250 CANDIDATE** — W3 source-guard pattern (coordinator as single-writer for cross-view
  state) is reusable for any multi-pane dashboard; eliminates event-loop cycles between panes.
- **#10254 CANDIDATE** — run the desktop UI end-to-end before claiming ship-ready.  A stub
  delegate that returns `Err` for all IPC commands compiles clean and passes unit tests; only
  a live UI smoke-test reveals it.  Post-W4 work-review pass before tag is required, not
  optional.
- **#10255 CANDIDATE** — when a perf claim looks suspiciously bad, re-measure on a clean
  build at the actual target scale (D4 bench surfaced the GLSL O(n²) issue; D5 fixed the
  engine; the real bottleneck at spec scale is the coarse-AST pipeline, not the lexer).
- **#10260 CANDIDATE (W4c)** — dual-mode IPC shims (Tauri / browser feature-detection +
  HTTP fallback) cost ~50 LOC and unlock browser-mode operation of any feature on top.
- **#10261 CANDIDATE (W4e.A)** — write-through side-stores (PG mirror, vector index)
  remain caches, not sources of truth.  Failures log + skip; canonical store stays SQLite.
- **#10262 CANDIDATE (W4e.B/C)** — local Xenova all-MiniLM-L6-v2 + pgvector + Chroma is
  the cheapest semantic substrate for ≤100 K rows: ~200 symbols/s on CPU, sub-300 ms
  query latency, zero per-query cost, no GPU required.
- **#10263 CANDIDATE (W4e.A regression fix)** — UI snapshot/list endpoints must walk the
  same store the UI's read path uses.  Querying the derived store causes "looks loaded
  but yields zero rows" when the canonical store has been wiped between runs.
- **#10264 CANDIDATE (W4d)** — `git log --follow + git describe --contains` plus a glob
  on `.planning/missions/v1-49-NNN-*/` gives any GSD repo a zero-config file →
  milestone → planning-doc chain without an explicit `mission_links` registry.
- **#10265 CANDIDATE (W4e.C)** — chromadb 3.x's optional default-EF dep is best avoided
  by constructing collections without an embedding function and supplying embeddings
  explicitly on every upsert/query, sharing the application's existing pipeline.

## See also

- Chapter contents: [00-summary](chapter/00-summary.md) · [03-retrospective](chapter/03-retrospective.md) · [04-lessons](chapter/04-lessons.md) · [99-context](chapter/99-context.md)

## Build artifacts shipped

- `www/tibsfox/com/Research/NASA/<degree>/` — index.html + 13-file artifact suite + 3 JSON files + forest-module
- `www/tibsfox/com/Research/MUS/<degree>/` — index.html + artifact suite
- `www/tibsfox/com/Research/ELC/<degree>/` — index.html + artifact suite
- `www/tibsfox/com/Research/SPS/<species-slug>/` — index.html + artifact suite (audio + sims + anatomy + diagrams)
- FTP sync to tibsfox.com via `npm run ftp-sync -- 1.<degree>` — typically 40-50 files / 1-2 MB

## Key Features

| Track | Detail |
|-------|--------|
| NASA | GSD Code Atlas (counter-cadence) |
| MUS | cross-track INSIDE-window pick at v1.49.607 |
| ELC | cross-track INSIDE-window pick at v1.49.607 |
| SPS | cross-track INSIDE-window pick at v1.49.607 |
| TRS | pack-pair completion at v1.49.607 |
