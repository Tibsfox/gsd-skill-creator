# scribe — Foundational Chipset

**Version:** 1.49.621 · **Mission:** scribe · **Milestone:** v1.49.621 · **Role:** `foundational` · **License:** Apache-2.0

## What this gives you

The `scribe` chipset is the foundational composition of the five SCRIBE track cartridges shipped in Part 1 of mission v1.49.621. It is a **thin shell**: it declares the categorical-sum composition of its members and re-exposes the SCRIBE metadata namespace; member cartridges remain authoritative for their own content. Loading this chipset gives a runtime the full substrate for going from markup-lineage taxonomy through round-trippable SVG-as-IR to a navigable, provenance-aware research dashboard, all under one cartridge surface.

## Composes-with

| Name | Track | Version | What it contributes |
|---|---|---|---|
| `markup-lineage` | T1 | 1.0.0 | Lineage taxonomy of the document-markup family (Tunnicliffe → SGML → SCRIBE → TeX/LaTeX → HTML → XML → MathML/SVG → modern lightweight markup). 35-source canonical citation index with the schema this chipset extends. Hand-authored native-SVG cladogram. |
| `svg-substrate` | T2 | 1.0.0 | SVG 2 deep-dive, animation primitives, formula-editor lineage, accessibility checklist, validators, and LaTeX-to-SVG renderers. Native-SVG self-demo bar (no raster fallbacks anywhere). |
| `code-svg-hdl-bridge` | T3 | 1.0.0 | SVG as a round-trippable IR between TypeScript-toy-subset and Verilog. Ships a working in-browser bidirectional viewer demonstrating AST↔SVG↔HDL with metadata-preserving SVGO config. Declares `composes_with: [svg-substrate, retrieval-provenance, markup-lineage]`. |
| `dashboard-lod-rendering` | T4 | 0.1.0 | SVG → Canvas → WebGL → WebGPU → Vulkan substrate ladder for visualising codebase + planning-doc graphs. ForceAtlas2 layout, four query primitives (LOOKUP/NEIGHBOURHOOD/SEARCH/HYBRID-SEARCH), 32-node sample-provenance demo. Declares `composes_with: [svg-substrate, retrieval-provenance]`. |
| `retrieval-provenance` | T5 | 1.0.0 | PROV-O-derived provenance graph + pgvector + fuzzy search + session extractor for code+docs corpora. Postgres + SQLite migrations. Substrate-decision-bearing for downstream tracks. |

## Composition algebra

Categorical sum (`algebra: "sum"` in `composition-graph.json`) per `src/coherent-functors/composition.ts`. The composition DAG is acyclic — the substrate-conformance test in Component 09 (`cartridge-composes-with-graph.test.ts`) asserts this.

The 5 `composes_with` edges declared in member cartridges (T3 → {T1, T2, T5}; T4 → {T2, T5}) are the `edges[]` in `composition-graph.json`. T1, T2, T5 are leaves of the composition DAG.

## Files in this directory

| File | Purpose |
|---|---|
| `manifest.json` | The chipset manifest. Conforms to `CartridgeManifest` (Component 00). |
| `composition-graph.json` | Machine-readable composition DAG. Conforms to `CompositionGraph` (Component 00). |
| `README.md` | This document. |

## Pointers

- **Per-track READMEs.** Substrate detail lives in each member cartridge's own `README.md` under `examples/cartridges/<name>/`. Do not duplicate their content here; this chipset is intentionally thin.
- **Unified citation index.** The cross-track-deduplicated citation index for the foundational chipset lives at `.planning/missions/v1-49-621-scribe/CITATIONS.json`. T1's `examples/cartridges/markup-lineage/citations.json` declares the canonical schema (`https://schemas.gsd.tools/cartridge/citations/v1.json`); the unified index extends that schema with `citedByTracks` and `loadBearingFor`.
- **Composition algebra.** `src/coherent-functors/composition.ts` is the categorical-sum reference. The composer at `src/scribe/cartridge-composition/compose-chipset.ts` enforces acyclicity, no-missing-members, and unique cartridge names.

## Re-generation

```bash
npx tsx src/scribe/cartridge-composition/generate-outputs.mts
```

The generator is **idempotent**: re-running it produces byte-identical `manifest.json`, `composition-graph.json`, and `CITATIONS.json`. Add new member cartridges by editing the `MEMBERS` array in `generate-outputs.mts`; new citations by editing `TRACK_CITATIONS` in `merge-citations.ts`. The unit-test suite at `src/scribe/cartridge-composition/__tests__/` enforces dedup correctness, manifest validity, no-cycles, and idempotent re-runs.
