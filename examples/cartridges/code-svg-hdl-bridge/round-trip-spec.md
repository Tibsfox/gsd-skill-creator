# SCRIBE Round-Trip Invariant Specification

**Cartridge:** code-svg-hdl-bridge · **Companion to:** mission Doc 06.

This is the artifact-level specification of the SCRIBE round-trip invariants. The full intellectual case is in mission Doc 06 (`.planning/missions/v1-49-621-scribe/t3-code-svg-hdl-bridge/06-the-round-trip-thesis.md`); this document is the implementation contract for downstream consumers.

## 1. Invariants by `kind`

### 1.1 `kind="ast"` invariants

For an `forward → reverse → forward` round-trip to be lossless on AST artifacts:

- **I-AST-1.** Every AST node has exactly one `<scribe:node>` element.
- **I-AST-2.** Each node's `sub_type` matches a closed taxonomy (TypeScript SyntaxKind names).
- **I-AST-3.** Each leaf node carries `span="START..END"` byte offsets into the source.
- **I-AST-4.** Every non-root node has exactly one incoming `<scribe:edge rel="child">`.
- **I-AST-5.** Sibling order is preserved (via `<scribe:edges>` ordering or `payload='{"order":N}'`).
- **I-AST-6.** Identifier nodes carry their identifier text as `label`; literal nodes carry the literal as `label`.

### 1.2 `kind="netlist"` invariants

For HDL round-trip:

- **I-HDL-1.** One `<scribe:graph>` per Verilog `module`; module name preserved in label of port-container or first node.
- **I-HDL-2.** Each port's `data-direction` ∈ {input, output, inout}.
- **I-HDL-3.** Each port's bit-width preserved (in payload or `data-width`).
- **I-HDL-4.** Bit ordering preserved (`data-bit-order` ∈ {descending, ascending}; default descending).
- **I-HDL-5.** Sequential vs combinational distinguished via `sub_type` (`always_ff` vs `always_comb`).
- **I-HDL-6.** Clock domain on `always_ff` cells (`data-clock="<signal-name>"`).
- **I-HDL-7.** Reset polarity preserved (`data-reset-polarity`).
- **I-HDL-8.** Module instantiation hierarchy via `<scribe:edge rel="instantiates">`.

### 1.3 Cross-`kind` invariants

Universally:

- **I-CROSS-1.** `<scribe:source sha="...">` matches actual source SHA.
- **I-CROSS-2.** `xmlns:scribe="https://tibsfox.com/Research/SCRIBE/ns#"` declared at root.
- **I-CROSS-3.** `<scribe:graph version="1">` declared.

## 2. The triple-redundancy contract

To survive the most likely metadata-stripping transforms, SCRIBE artifacts encode the same information three ways:

1. **`<metadata>` block** — `<scribe:graph>` with full edge-list (machine-canonical).
2. **Per-element `data-*` attributes** — `data-node-id`, `data-sub_type`, `data-span` etc. (survives some optimizers that strip `<metadata>`).
3. **Per-element `<title>` and `<desc>`** — human-readable + a11y-required (survives nearly all transforms).

The triple-encoding cost is ~30-50% file-size overhead; the benefit is that any *one* of the three independent encodings being lost still allows recovery via the other two. See mission Doc 06 §5.

## 3. The contract with downstream tools

Tools that *consume* SCRIBE artifacts must:

1. Preserve `xmlns:scribe` namespace declarations.
2. Preserve `<metadata>` elements (W3C SVG 2 spec §6 says preserve; SVGO's `removeMetadata` plugin is opt-in violation).
3. Preserve `data-*` attributes (or document what they strip).
4. Preserve `<title>` and `<desc>` (a11y-critical per T2 Doc 06).

Tools that satisfy this by default: Inkscape (Plain SVG mode), all major browsers (display only), most XML-aware editors.

Tools that violate by default: SVGO (opt-out via `svgo-roundtrip.config.js`), some Markdown sanitizers, ImageMagick (rasterization), most online "SVG optimizers."

## 4. The "no-metadata" graceful-degradation ladder

When some metadata is missing, recovery degrades gracefully:

| Surviving | Recovery quality |
|---|---|
| Everything | Full semantic round-trip |
| Only `data-*` | Full semantic round-trip via `data-*` reassembly |
| Only `<title>`/`<desc>` | Semi-semantic (labels present, sub_types inferred from labels) |
| Only structural | Topology + labels; no types or spans |
| Only pixels | Visual recovery via OCR + edge tracing (out of SCRIBE scope) |

The viewer (`viewer/viewer.js`) currently implements full and structural recovery; the intermediate ladder steps are documented in Doc 02 §6 but not yet implemented.

## 5. Validator

The cartridge ships `svg-to-ast/validate.ts` (TypeScript reference) and the in-browser `validateScribeSvg()` function in `viewer/viewer.js`. Both check:

1. a11y compliance (T2 Doc 06 + T2 cartridge `validators/a11y-check.ts`)
2. SCRIBE namespace declared
3. `<scribe:graph>` present and well-formed
4. `<scribe:source>` with `path` + `sha`
5. Per-`kind` invariants from §1
6. Visual-vs-metadata cross-check (every `<scribe:node>` has matching `<g>`)

Any failure is a round-trip warning; the visual SVG is still valid SVG.

## 6. Persistence to T5

Round-trip events SHOULD be persisted to a SCRIBE-compatible PROV-O graph (T5 cartridge schema). Reference SQL:

```sql
INSERT INTO prov_node (node_id, node_type, sub_type, label, payload) VALUES
  ('rt:add.svg:e1', 'Activity', 'roundTrip', 'TypeScript→AST→SVG round-trip',
   '{"roundTrip":{"direction":"forward","sourceSha":"...","svgSha":"..."}}');

INSERT INTO prov_edge (edge_id, src, rel, dst) VALUES
  (sha256('rt:add.svg:e1' || 'used' || 'src:add.ts:f02e9b'),
    'rt:add.svg:e1', 'used', 'src:add.ts:f02e9b');
```

This uses T5's substrate-decisions exactly (`Activity` node type, `sub_type='roundTrip'`, JSONB payload, content-addressed `edge_id`). See mission Doc 06 §8 and T5 cartridge `migrations/001-init.postgres.sql`.

## 7. Versioning

This spec is version 1. Forward-compatibility requires `<scribe:graph version="1">` so consumers can reject unsupported versions. Future versions will be backward-compatible at the read-side or will bump the major version to signal breaking changes.

## 8. Reference

Full intellectual case: `.planning/missions/v1-49-621-scribe/t3-code-svg-hdl-bridge/06-the-round-trip-thesis.md`.

Empirical proof: `viewer/index.html` (open in browser).
