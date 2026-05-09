# markup-lineage cartridge

**Mission:** SCRIBE (v1.49.621) · **Track:** T1 MARKUP-LINEAGE
**Convoy:** Wave 1 · **Source-of-truth research:** `.planning/missions/v1-49-621-scribe/t1-markup-lineage/`

## What this cartridge contains

| File | Purpose |
|---|---|
| `lineage.json` | Structured taxonomy of the markup family — branches, nodes, in-branch descent edges, cross-branch design influences, the five family invariants. Schema-versioned for downstream tooling. |
| `figures/family-tree.svg` | Hand-authored native SVG cladogram. ~22 KB; 50+ named nodes; three edge classes (in-branch, cross-branch design influence, failed/superseded). Self-demo bar artifact for T1. |
| `capabilities.md` | Per-format capability matrix across 27 markup formats and eight capability axes (schema, math, vector, xref, exec, lossless, streaming, author-density). |
| `citations.json` | Deduped canonical citation index covering all primary sources from T1 docs 01–07. ~35 citations spanning ISO standards, W3C Recommendations, IETF RFCs, doctoral theses, foundational books, and reference implementations. |

## How downstream tracks consume it

- **T2 SVG-substrate** loads `lineage.json` to anchor SVG's family-tree position; loads `capabilities.md` rows for SVG / MathML / KaTeX / MathJax / Typst.
- **T3 code-svg-hdl-bridge** (Wave 2) loads the same anchors to position SVG-as-IR.
- **T4 dashboard-lod-rendering** (Wave 2) loads `capabilities.md` rows for HTML5 + SVG.
- **T5 retrieval-provenance** loads `capabilities.md` rows for JATS / EPUB / DocBook (those formats carry explicit document-metadata vocabularies that PROV-O / OpenLineage map to).
- **SCRIBE convergence synthesis** loads `citations.json` as one of five inputs to the cross-track citation index.

## Self-demo verification

`figures/family-tree.svg` was authored as native SVG — no raster export, no `<image href>` references, no embedded base64 raster. Verification script (one-liner):

```bash
grep -c '<rect' figures/family-tree.svg     # node-rect count, ≥40
grep -c '<text' figures/family-tree.svg     # text-label count, ≥45
grep -c '<image' figures/family-tree.svg    # raster references, must be 0
```

The SVG opens directly in any modern browser (Chrome / Firefox / Safari / Edge ≥2020); also rendered via `librsvg2`, `inkscape`, or any conformant SVG 1.1 / 2.0 renderer.

## Mission SCRIBE substrate-continuity test

This cartridge is one of the input substrates to the SCRIBE convergence synthesis. The substrate-continuity claim Mission SCRIBE researches is that documents round-trip across markup, vector-graphics, hardware-description, GPU-rendering, and provenance substrates without semantic loss. The five family invariants in `lineage.json` are the markup-family slice of that claim.

## Provenance

- **Author:** T1 convoy lead (Mission SCRIBE Wave 1)
- **Built:** 2026-05-09
- **Source-of-truth docs:** docs 01–07 in `.planning/missions/v1-49-621-scribe/t1-markup-lineage/`
- **Citation count:** ~35 deduped across docs 01–07
- **Total research wordcount:** ~16,500 across seven docs

## License

Same as the gsd-skill-creator parent project.
