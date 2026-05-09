# ast-to-svg

AST → SCRIBE-compliant SVG renderer (TypeScript reference).

## Purpose

Transforms a TypeScript AST (or any tree-shaped IR) into a SCRIBE-compliant SVG that preserves the source structure in metadata. The SVG visual rendering is the human-friendly view; the SCRIBE metadata is the machine-canonical form.

The reference renderer is `render.ts`. The in-browser version is in `../viewer/viewer.js` as `renderAstSvg()`.

## What gets emitted

Every SVG produced carries:

1. Root `<svg>` with `xmlns:scribe="https://tibsfox.com/Research/SCRIBE/ns#"`, `role="graphics-document"`, `aria-labelledby="t"`
2. Root `<title id="t">` and `<desc>` per T2 Doc 06 a11y discipline
3. `<metadata>` containing `<scribe:graph kind="ast" version="1" language="typescript">`
4. `<scribe:source path="..." sha="..." bytes="..." generator="...">`
5. `<scribe:nodes>` enumerating every AST node
6. `<scribe:edges>` enumerating every parent-child edge
7. Visual `<g class="layer edges">` and `<g class="layer nodes">` with cubic Bezier connectors (T2 Doc 01 §2 path mini-language) and rectangular node bodies
8. Per-`<g class="node">` redundant `data-node-id`, `data-sub_type`, `data-span` attrs
9. Per-`<g class="node">` `<title>` and `<desc>` (Doc 02 §3.2)

This is the *just enough* metadata layer (mission Doc 06 §5) — three-way redundant encoding.

## Layout

The renderer uses a Reingold-Tilford-style hierarchical layout for AST trees ([Reingold & Tilford 1981]; T2 Doc 01 §3 for the broader tree-layout tradition). Leaf nodes are placed left-to-right at the deepest level; internal nodes are centered above their children.

For DFG / netlist / CFG diagrams, different layout algorithms apply (mission Doc 05 §4 for netlist Sugiyama+orthogonal). Future cartridge versions will ship the alternative layouts.

## Examples

The `examples/` directory ships pre-rendered SVGs for the three viewer dropdown items:

- `add.svg` — `function add(a, b) { return a + b }` AST
- `xor1.svg` — `function xor1(a, b) { return a ^ b }` AST
- `mux.svg` — `function mux(c, a, b) { return c ? a : b }` AST

Each is hand-validated against the round-trip-spec.md invariants. Open in any browser to view.

## Composition with T2

Per `examples/cartridges/svg-substrate/`:
- The SVG primitives library (T2 cartridge `primitives/`) supplies the path-d patterns this renderer uses for connectors
- The a11y validator (T2 cartridge `validators/a11y-check.ts`) passes on this renderer's outputs unchanged
- The SVGO config (T2 cartridge `validators/svgo.config.js`) preserves metadata; combine with this cartridge's `svg-to-ast/svgo-roundtrip.config.js` for round-trip-aware optimization
- The `<use>`/`<symbol>` instancing pattern (T2 Doc 01 §9) is on the roadmap for repeated-node-kind sharing (not yet implemented at toy scope)

## See also

- Mission Doc 01: Code-to-SVG mappings
- Mission Doc 02: SVG-to-code reverse direction (the `parse.ts` companion)
- Mission Doc 06: The round-trip thesis
- `../viewer/index.html`: working in-browser demo
