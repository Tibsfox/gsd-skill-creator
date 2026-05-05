# v1.49.607 — GSD Code Atlas (counter-cadence)

**Shipped:** 2026-05-05
**Predecessor:** v1.49.606 (Apollo 17 Final Crewed Lunar Landing; NASA 1.84)
**Cadence:** counter-cadence (no NASA/MUS/ELC/SPS/TRS engine advance)

## Through-line

> *The atlas gives the codebase a mirror: every symbol, every file relationship, every mission's
> fingerprint — visible in one coherent surface.  What took days of archaeology across grep and
> git-log is now a single click.*

v1.49.607 is the full GSD Code Atlas milestone — 28 commits across five wave clusters.
W0–W3 built the clean-room primitives, substrate, views, and shell.  W4a closed the
ADR 0003 enforcement tool, dashboard hookup, user guide, and release-notes structure.
D1–D5 closed known scope-internal deferred items (extractor surgeries, IPC completeness,
linker idempotency, a11y, perf bench, sticky-regex engine fix).  E1–E4 closed newly-surfaced
items, the critical being E4: a real Rust SQLite delegate replacing the stub that had been
returning `Err` for all 13 IPC commands — the fix that made the atlas IPC actually functional.
Engine state is held across all five tracks — this is a pure tooling/infrastructure milestone.

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
