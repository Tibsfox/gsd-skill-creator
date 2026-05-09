# Animation pattern library

Three reference templates for the canonical animation patterns from Doc 03 and Doc 04. Each template is a complete, standalone SVG file; the author copies the relevant template and edits in place.

## Templates

- `timeline.svg` — Master timeline: a sequence of elements appearing/transforming in chained order. SMIL-driven; standalone-openable.
- `step-by-step.svg` — Layered-opacity step animation pattern (Doc 04). Solves a small algebra equation; replace step content in place. Standalone-openable; respects `prefers-reduced-motion`.
- `morphing.svg` — Path morphing across SMIL `<animate attributeName="d">`. Demonstrates the same-command-shape constraint and a fallback animation when shapes diverge.

## Composer

`build-step-by-step.ts` — Reference TypeScript composer. Reads a YAML or JSON file enumerating steps + per-step SVG fragments, emits the composite step-by-step SVG. See Doc 04 §8 for the schema.

## When to use each substrate

Per Doc 03 §10:

- **SMIL** — required when the file must open standalone in a browser without a JS host. The default for SCRIBE corpus figures.
- **CSS** — appropriate when the SVG is hosted in an HTML page where author convenience matters; embedded `<style>` blocks animate any CSS-animatable property.
- **WAAPI** — required when user-controllable scrubbing or programmatic state-machine integration is needed; not standalone-openable (needs JS host).
- **JS rAF** — last resort for physics simulation, real-time data, or hand-rolled timing curves.

## Self-demo

`step-by-step.svg` is the load-bearing artifact for the SCRIBE step-by-step pattern. Open it in any modern browser; it animates a four-step solution to `2x + 3 = 11` and respects `prefers-reduced-motion`.
