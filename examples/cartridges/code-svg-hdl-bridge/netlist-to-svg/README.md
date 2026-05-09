# netlist-to-svg

Yosys netlist → SCRIBE-compliant SVG renderer (design + reference + implementation).

## Status

The cartridge ships:

- `netlist-render.md` — design document for the Yosys JSON → SCRIBE SVG renderer (mission Doc 05 §4 algorithm)
- `add-netlist.svg`, `xor1-netlist.svg`, `mux-netlist.svg` — pre-rendered structural netlist SVGs (simplified path; hand-validated; T3-generated)
- `render.ts` — **NEW** (v1.49.621): thin wrapper calling `src/scribe/netlist-renderer/` with automatic Yosys availability detection and simplified-path fallback

The full-fidelity Yosys renderer lives at `src/scribe/netlist-renderer/` and requires Yosys + netlistsvg to be installed. When unavailable, the cartridge falls back automatically to the pre-rendered simplified-path SVGs.

## Yosys soft dependency — install instructions

Yosys is NOT a required runtime dependency. The cartridge works without it via the pre-rendered fallback SVGs.

To enable the full-fidelity Yosys path:

```bash
# Ubuntu/Debian
sudo apt install yosys

# macOS (Homebrew)
brew install yosys

# netlistsvg (required in addition to Yosys)
npm install -g netlistsvg

# Verify both tools are available
yosys -V
netlistsvg --version
```

## Cartridge fallback behavior

The `renderOrFallback()` function in `render.ts` probes for Yosys availability at call time:

```typescript
import { renderOrFallback, availabilityReport } from './render.js';

// Returns full-fidelity SVG when Yosys is installed; simplified fallback otherwise.
const svg = await renderOrFallback(verilogSource, 'add');

// Prints which path is active.
console.log(await availabilityReport());
```

## Naming policy (CAP-018 v1.49.621)

The pre-rendered simplified-path SVGs shipped with this cartridge have been validated against the Component 04 namespace conformance validator. They **remain intact** as the canonical fallback:

| File | Path | Status |
|---|---|---|
| `add-netlist.svg` | simplified path | KEPT — fallback; Component 04 PASS |
| `xor1-netlist.svg` | simplified path | KEPT — fallback; Component 04 PASS |
| `mux-netlist.svg` | simplified path | KEPT — fallback; Component 04 PASS |

When Yosys produces output that differs meaningfully from the simplified versions, add `*-yosys.svg` alongside (the simplified files are never deleted). When output is visually equivalent, replacement is acceptable.

## When to use this cartridge vs `netlistsvg`

The community-standard tool for Yosys netlist visualization is [`netlistsvg`](https://github.com/nturley/netlistsvg) by Neil Turley. Use that tool when:
- you need production-quality netlist rendering today
- you don't need round-trip metadata
- you have an existing Yosys-based flow

Use this cartridge's renderer when:
- you need round-trippable artifacts (the SVG carries SCRIBE metadata)
- you want to extend Yosys output into the SCRIBE provenance graph (T5 cartridge persistence)
- you want a uniform schema across AST / DFG / netlist diagrams

The two approaches are complementary; SCRIBE's renderer post-processes netlistsvg output to add the metadata layer.

## The Yosys → SVG pipeline

Per mission Doc 05 §4:

```
Verilog source
     │  yosys -q -p "read_verilog add.v; hierarchy -auto-top; proc; opt; write_json add.json"
     ▼
Yosys JSON netlist (canonical interchange format)
     │  netlistsvg add.json -o add-raw.svg
     ▼
Raw SVG (no SCRIBE metadata, no a11y)
     │  post-process: inject xmlns:scribe, <title>, <desc>, role, aria-labelledby, <scribe:graph>
     ▼
SCRIBE-conformant SVG (Component 04 namespace conformance validator: PASS)
```

## Determinism note

Given identical Verilog source + identical Yosys version → byte-identical Yosys JSON output.
The post-process layer adds a SHA digest of the Verilog source for provenance traceability.

Yosys version tested against: operator-dependent (tested in Yosys-equipped environment with `YOSYS_TEST=1`).

## Worked examples

The three pre-rendered SVGs in this directory correspond to the viewer's three dropdown items:

| File | Source | What it shows |
|---|---|---|
| `add-netlist.svg` | `function add(a, b) { return a + b }` | Two input ports + `+` operator + output port |
| `xor1-netlist.svg` | `function xor1(a, b) { return a ^ b }` | Two input ports + `^` (XOR) operator + output port |
| `mux-netlist.svg` | `function mux(c, a, b) { return c ? a : b }` | Three input ports + ternary (mux) + output port |

Each SVG carries the full SCRIBE metadata namespace and is round-trippable per the mission Doc 06 contract.

## See also

- `src/scribe/netlist-renderer/` — the full-fidelity Yosys renderer implementation (v1.49.621)
- mission Doc 05: HDL → SVG visualization (full survey)
- `netlist-render.md`: design document for the Yosys-driven renderer
- [Yosys Manual](https://yosyshq.net/yosys/documentation.html)
- [netlistsvg](https://github.com/nturley/netlistsvg) — the community-standard Yosys netlist visualizer
