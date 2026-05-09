# svg-substrate cartridge

**Source mission:** SCRIBE (v1.49.621), Track 2
**Origin:** `.planning/missions/v1-49-621-scribe/t2-svg-substrate/`

The svg-substrate cartridge is the SCRIBE-system's reference for native-SVG production. It packages the patterns, validators, and reference implementations that the eight Track-2 documents derive.

## Contents

- `primitives/` — Hand-authored SVG fragments (axes, arrows, callouts, common shapes) copy-pastable into new figures.
- `latex-to-svg/` — Reference pipeline rendering a LaTeX equation as native SVG. Two routes: `dvisvgm` (build-time, deterministic) and MathJax SVG output (runtime).
- `animations/` — Three pattern templates (timeline, step-by-step, morphing) plus the `build-step-by-step.ts` composer.
- `a11y-checklist.md` — The accessibility discipline every SCRIBE SVG must pass.
- `validators/` — `svgo` config that preserves a11y attributes; `xmllint`-based schema validator; `a11y-check.ts` that enforces the checklist mechanically.

## Self-demo bar

Every figure in the source mission's eight documents is a hand-authored native SVG. The step-by-step animation (`figures/step-by-step-demo.svg` in the mission directory; `animations/step-by-step-demo.svg` here) opens standalone in any modern browser and respects `prefers-reduced-motion`.

## Composes with

- `markup-lineage` cartridge (Track 1) — SVG is the terminal node of the markup family tree.
- `code-svg-hdl-bridge` cartridge (Track 3, Wave 2) — uses SVG as IR.
- `dashboard-lod-rendering` cartridge (Track 4, Wave 2) — uses SVG as the semantic overlay.

Together the five cartridges compose into `cartridges/foundational/scribe/` (post-synthesis).
