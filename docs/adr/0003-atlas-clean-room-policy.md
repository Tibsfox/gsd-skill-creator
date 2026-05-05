# ADR 0003 — Atlas surface clean-room policy (zero external runtime deps)

- **Status:** Accepted
- **Date:** 2026-05-04
- **Milestone:** v1.49.607 (GSD Code Atlas)
- **Supersedes:** none
- **Superseded by:** none
- **Related:** ADR 0001 (vendoring policy — the anchor this ADR extends)

## Context

The v1.49.607 mission package as drafted by `vision-to-mission` selected best-in-class off-the-shelf libraries for each rendering surface: Cytoscape.js v3.31+ (WebGL graph at 3000+ nodes), D3 (hierarchical circle-pack + Sankey + linear/time scales), Prism (multi-language syntax highlighting), tree-sitter (multi-language parsing). The architecture was explicitly composition-as-Amiga-Principle: "the Atlas's only original work is the cross-file resolver, the provenance linker, and the cross-view coordinator."

At session open for v1.49.607, the operator gave a directive that supersedes that composition stance for the atlas surface: **no external runtime dependencies — clean-room reverse-engineer and build from scratch.**

Three forces motivate the directive:

1. **Sovereignty.** Every external runtime dep is a supply-chain attack surface, a license-compatibility constraint, and a future-update hazard. The atlas is a long-lived UI surface in a self-modifying system; its dependency footprint will compound across decades.
2. **Pedagogical mass.** A clean-room WebGL2 graph renderer, a clean-room circle-pack layout, a clean-room Sankey, and clean-room parsers for 8 languages are *exactly* the kind of substrate that gives the gsd-skill-creator system real teaching mass. The atlas becomes a working demonstration of how to build the primitives, not just how to compose them.
3. **Symmetry with the existing in-tree posture.** ADR 0001 already established a careful posture toward vendored upstream code in `.claude/`. Extending that posture to the runtime surface — at least for the atlas — closes the loop: planning surface and runtime surface are both authored in-house.

## Decision

**Every file under `src/atlas/*` is authored clean-room in this repository. The atlas surface adds zero new external runtime dependencies.**

Specifically:

| Capability the atlas needs | Forbidden external dep | Required clean-room location |
|---|---|---|
| WebGL2 graph renderer (force-directed; quadtree culling) | `cytoscape`, `cytoscape-cola`, `d3-force`, any sigma.js variant | `src/atlas/graph-renderer/` |
| Hierarchical circle-pack layout | `d3-hierarchy`, `d3-pack` | `src/atlas/pack-layout/` |
| Sankey layout | `d3-sankey` | `src/atlas/sankey/` |
| Linear / time / log scales + axes | `d3-scale`, `d3-axis`, `d3-time-format` | `src/atlas/scales/` |
| Multi-language syntax tokenizer | `prismjs`, `highlight.js`, `shiki`, `monaco-editor` | `src/atlas/syntax/` |
| Multi-language parser | `tree-sitter`, `web-tree-sitter`, `@tree-sitter/*` | `src/atlas/parsers/` |
| Symbol search + ranking | `flexsearch`, `lunr`, `fuse.js`, `minisearch` | `src/atlas/search/` |
| URL hash router | `react-router`, `history`, `wouter` | `src/atlas/router/` |
| Virtual scroll for code view | `react-window`, `react-virtual` | `src/atlas/virtual-scroll/` |

### What "clean-room" means here

Clean-room in this ADR's sense means **no upstream npm/cargo package whose code is fetched at install time** is added to support the atlas surface. It does not forbid:

1. **Reading published papers, references, and documentation.** The whole point of clean-room rebuilds is that the algorithms are published; reimplementing the Wang/Wang circle-pack algorithm or Reingold-Tilford trees from the published paper is fully encouraged. Cite the paper in a `CITATION.md` next to the implementation.
2. **Reusing existing in-tree primitives.** If `src/coprocessor/`, `src/runtime-hal/`, or v1.49.597 substrate already provides a primitive, the atlas reuses it directly. The constraint is on *new external* deps, not on internal composition.
3. **Reading other people's source as study material.** A maintainer may study how Cytoscape implements its WebGL renderer to understand the algorithmic choices, then author a fresh implementation in this repo. The line is whether the *code* in this repo is original — not whether the *ideas* are.

### What this ADR does NOT do

- It does not retroactively forbid existing external runtime deps elsewhere in the repo. Tauri v2, xterm.js, Vite, Vitest, basic-ftp, and the existing dependency tree remain unchanged.
- It does not forbid build-time or test-time tooling. Vitest, esbuild, TypeScript itself remain external. The constraint is on *runtime* deps that ship with the atlas surface.
- It does not block the atlas from calling into existing Tauri commands or the v1.49.597 IPC bridge — those are internal substrate, not new external deps.

### Enforcement

A new lint rule blocks any `package.json` `dependencies` or `devDependencies` addition under the atlas surface unless the dep already exists at the repo root and is shared with non-atlas code. The implementation lands in W4.3 alongside the module-boundary lint, the no-anthropic probe, and the no-spawn probe. Concretely: a CI test scans every `src/atlas/**/*.ts` import declaration; any import whose specifier resolves to `node_modules/` and is not in the v1.49.606 baseline `package.json` fails the test with a citation back to this ADR.

## Consequences

### Costs

- **Token + wall-time budget roughly doubles.** Original mission package: 231K tokens, ~4h parallel. Clean-room rewrite: ~450K tokens, ~8-10h parallel.
- **Opus-share rises** from ~31% to ~50%+. Parsers (W1.A) and the rendering primitives (W0.5) are the hard parts and get the strong-reasoning model.
- **Initial output quality is below off-the-shelf libraries.** A clean-room WebGL graph renderer at v1 will not match Cytoscape's polish on degenerate inputs (huge graphs, pathological cluster densities, edge-bundling). This is the cost paid for sovereignty + pedagogical mass.
- **Maintenance ownership shifts in-house.** Bugs in the atlas's renderer, parsers, layouts, syntax tokenizers are this project's bugs, not upstream's. Performance work is this project's work.

### Benefits

- **Zero supply-chain surface for the atlas.** No transitive deps. No license audit drift. No CVE exposure paths from the atlas to upstream registries.
- **Pedagogical mass.** The atlas becomes a substrate for teaching how to build these primitives. Future research-mission-generator output that touches graph rendering, hierarchical layout, or parser construction has in-tree references at hand.
- **Maintainability across decades.** No external dep to chase a deprecation, an API rewrite, or a maintainer-leaves-the-project event.
- **Symmetric with the rest of the project's stance.** ADR 0001 governs vendored *planning* code; this ADR governs vendored *runtime* code on the atlas surface. Together they close the sovereignty loop for new work.

### Out-of-scope (intentional non-goals)

- Retroactively rewriting non-atlas surfaces.
- Forbidding the atlas from cross-pollinating into shared `src/` primitives. If a clean-room layout helper proves useful elsewhere in the repo, lifting it from `src/atlas/pack-layout/` to a shared `src/layout/` location is encouraged.

## Reference implementations

The clean-room implementations are not unprecedented in this repo. The math coprocessor at `coprocessors/math/` is the closest existing prior art: a from-scratch GPU math chipset (algebrus / fourier / statos / symbex / vectora) authored in this repo rather than vendored from a numerical library. The atlas is the same pattern applied to UI/parsing primitives.

## Verification

Acceptance test for this ADR (lands W4.3 of v1.49.607):

```bash
node tools/atlas-deps-audit.mjs --strict
```

Exits 0 when every import under `src/atlas/**/*.ts` resolves to (a) another `src/atlas/*` path, (b) an existing repo-root primitive in `src/*` outside atlas, or (c) a baseline-shared dep already in v1.49.606 `package.json`. Exits non-zero if any new external is detected. The audit script and its hermetic tests are part of the v1.49.607 deliverable.
