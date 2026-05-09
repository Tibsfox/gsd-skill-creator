# code-svg-hdl-bridge

Cartridge for SCRIBE Track 3 — round-tripping source code, SVG diagrams, and hardware description language (HDL).

**Mission:** SCRIBE (v1.49.621), Wave 2.
**Status:** Working. Self-demo bar PASS — bidirectional round-trip operational at toy scope (3 examples in the viewer dropdown).

## What this cartridge ships

A *just-enough* metadata layer that makes SVG round-trippable with source code on one side and Verilog on the other:

- **`ast-to-svg/`** — AST → SCRIBE-compliant SVG renderer. TypeScript reference + worked examples.
- **`svg-to-ast/`** — Reverse direction: SCRIBE-compliant SVG → AST → source. Includes the metadata-namespace spec, the validator, and the SVGO config that preserves SCRIBE metadata.
- **`hdl-quickstart/`** — Chisel + Amaranth quickstart for users who want to use a "real" HDL alongside the SCRIBE bridge.
- **`netlist-to-svg/`** — Yosys netlist → SCRIBE SVG (design + reference impl outline).
- **`viewer/`** — Working interactive round-trip viewer. Open `viewer/index.html` in any browser. **The self-demo.**
- **`round-trip-spec.md`** — The round-trip invariant spec (companion to mission Doc 06).
- **`manifest.json`** — Cartridge metadata.

## Quickstart — open the viewer

```bash
# Direct file:// open
open examples/cartridges/code-svg-hdl-bridge/viewer/index.html

# Or serve
cd examples/cartridges/code-svg-hdl-bridge/viewer
python3 -m http.server 8000   # then browse to http://localhost:8000/
```

The viewer auto-loads the `add(a, b)` example and runs a round-trip on page load. Pane 5's status line should read PASS in green.

Try the dropdown: `add` → 32-bit adder; `xor1` → 1-bit XOR; `mux` → 2:1 multiplexer. All three round-trip cleanly.

## Composes-with

| Cartridge | Composition |
|---|---|
| `svg-substrate` (T2) | T2 supplies the SVG primitives, the a11y discipline (`<title>`/`<desc>`/ARIA), and the `<use>`/`<symbol>` instancing pattern that this cartridge's renderers use. The T2 a11y validator (`validators/a11y-check.ts`) passes on this cartridge's emitted SVGs unchanged. |
| `retrieval-provenance` (T5) | T5 supplies the PROV-O edge-list schema, the JSONB+sub_type pattern, and the recursive-CTE traversal helpers. This cartridge's round-trip metadata persists into the T5 provenance graph (see Doc 06 §8 for the SQL inserts). |
| `markup-lineage` (T1) | T1 supplies the SGML/XML lineage that motivates SVG-as-markup-substrate. SVG inherits its element/attribute model from XML; the `xmlns:scribe` namespace pattern is XML-spec-defined. |

The five SCRIBE cartridges compose into the foundational `cartridges/foundational/scribe/` chipset post-synthesis.

## Self-demo verification

The viewer was empirically verified via Node + jsdom harness on 2026-05-09. All three examples round-trip cleanly:

```
--- function add(a, b) { return a + b }
  reverse-via-SVG regen: function add(a, b) { return a + b }  -> PASS
--- function xor1(a, b) { return a ^ b }
  reverse-via-SVG regen: function xor1(a, b) { return a ^ b }  -> PASS
--- function mux(c, a, b) { return c ? a : b }
  reverse-via-SVG regen: function mux(c, a, b) { return c ? a : b }  -> PASS
===== reverse round-trip: ALL PASS =====
```

For operator spot-check instructions see `viewer/index.html` step-by-step or the mission Doc 07 §6.

## Round-trip namespace

Cartridge artifacts use the namespace `https://tibsfox.com/Research/SCRIBE/ns#`. Full spec at `svg-to-ast/metadata-spec.md` and at the round-trip thesis (mission Doc 06 §4).

## Scope and limits

**In scope:**
- TypeScript toy subset (single-function, expression-only, primitive operators)
- AST as `kind="ast"` SVG with full SCRIBE metadata
- Verilog emission (synthesizable subset, IEEE 1364 + 1800 `wire`/`logic`)
- Structural netlist as `kind="netlist"` SVG
- Bidirectional round-trip via SVG metadata

**Out of scope (deferred to follow-on milestones):**
- Full TypeScript (loops, calls, classes, async)
- HLS pipelines (Vivado HLS, Bambu) as inputs
- VHDL / Chisel / Amaranth / SpinalHDL as round-trip targets (quickstart only)
- Yosys-driven netlist rendering (viewer ships simplified version; mission Doc 05 documents full path)
- Formal verification of the round-trip (mission Doc 08 design only)
- Persistence to T5 provenance graph at runtime (mission Doc 06 §8 documents schema)
- Lossy-fallback structural recovery (Doc 02 §6 documents algorithm; not implemented in viewer)
- Chip-as-document silicon-layer extension (mission Doc 09 vision only)

Each deferred item is enumerated in the mission REPORT's CAP-T3-XXX inventory for vision-to-mission consumption.

## License

Apache-2.0 (cartridge default). The SCRIBE namespace identifier (`https://tibsfox.com/Research/SCRIBE/ns#`) is intentional and stable.

## See also

- Mission research corpus: `.planning/missions/v1-49-621-scribe/t3-code-svg-hdl-bridge/{01..09}-*.md` (9 docs, ~24K words)
- T2 SVG substrate: `examples/cartridges/svg-substrate/`
- T5 retrieval provenance: `examples/cartridges/retrieval-provenance/`
