# v1.49.607 — GSD Code Atlas (counter-cadence)

**Shipped:** 2026-05-04
**Predecessor:** v1.49.606 (Apollo 17 Final Crewed Lunar Landing; NASA 1.84)
**Cadence:** counter-cadence (no NASA/MUS/ELC/SPS/TRS engine advance)

## Through-line

> *The atlas gives the codebase a mirror: every symbol, every file relationship, every mission's
> fingerprint — visible in one coherent surface.  What took days of archaeology across grep and
> git-log is now a single click.*

v1.49.607 is the build/verify/audit/release-notes wave (W4a) of the GSD Code Atlas milestone.
It closes the four deliverables not shipped in W0–W3: the ADR 0003 enforcement tool
(`atlas-deps-audit`), the dashboard Atlas tab hookup, the Atlas user guide, and the 5-file
release-notes structure itself.  Engine state is held across all five tracks — this is a
pure tooling/infrastructure milestone.

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

## W0–W3 summary (prior waves, all shipped)

| Wave | Commits | Deliverables |
|---|---|---|
| W0 | d381ac095 | types + migration 003 + atlas schemas |
| W0.5 | cc4535170 / 54c4c7bbb / 4e7df2177 / f4c67c69c + 7d0000ea0 | graph-renderer + pack-layout + scales+sankey + syntax/parsers |
| W1 | aeaacca28 / 97609a0f7 / ee9dadfbd | symbol indexer+resolver + KB+provenance + Tauri/SSE/IPC |
| W2 | 563b2d7f5 / 872fe3b0c / 4b13b86d5 / 5e27ab6d7 / 1d220bca3 | system-map + symbol-graph + archeology + code-view + search-palette |
| W3 | 146e83ec1 | atlas shell + URL-hash coordinator |

## W4a deliverables (this commit)

1. `tools/atlas-deps-audit.mjs` — ADR 0003 enforcement; 89 files scanned, 0 violations
2. `tools/__tests__/atlas-deps-audit.test.mjs` — 5 hermetic vitest cases; all pass
3. `vitest.tools.config.mjs` — atlas-deps-audit test registered
4. `dist/dashboard/atlas.html` — Atlas tab HTML page (mirrors intelligence.html pattern)
5. `dist/dashboard/intelligence.html` — Atlas tab added to nav list
6. `dist/dashboard/intelligence/nav-shim.js` — updated to inject both Intelligence + Atlas tabs
7. `docs/atlas-user-guide.md` — ~200-line user guide (8 sections)
8. `docs/release-notes/v1.49.607/` — 5-file structure (this release)

## Forward lessons emitted

- **#10248 CANDIDATE** — clean-room rebuild costs ~2.5× the original estimate when the
  primitive set (graph-renderer, pack-layout, scales+sankey, syntax/parsers, trigram search)
  is built from published algorithms rather than wrapping an existing library.
- **#10249 CANDIDATE** — ADR-as-supply-chain-policy (ADR 0003) converts a prose rule into a
  CI-gated invariant; the audit tool closes the enforcement loop at < 100 ms per run.
- **#10250 CANDIDATE** — W3 source-guard pattern (coordinator as single-writer for cross-view
  state) is reusable for any multi-pane dashboard; eliminates event-loop cycles between panes.
