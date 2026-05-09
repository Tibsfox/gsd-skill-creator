# Yosys Netlist → SCRIBE SVG Renderer Design

Companion to mission Doc 05 §4 (the algorithmic layer).

## Input

Yosys JSON output, produced by:

```bash
yosys -p "read_verilog mydesign.v; synth; write_json mydesign.json"
```

The format is documented in the [Yosys Manual §6 "JSON Netlist Format"](https://yosyshq.net/yosys/documentation.html#chapter:json). Each `module` object contains:

- `ports`: public-interface signals (with `direction` ∈ {input, output, inout} and `bits` array enumerating physical wire IDs)
- `cells`: internal standard-cell instances (with `type` like `$add`, `$mux`, `$dff`; `parameters`; `port_directions`; `connections`)
- `netnames`: human-readable signal names (with `bits` array)

## Output

SVG with `<scribe:graph kind="netlist">` and a layered Sugiyama-style layout per [Sugiyama, Tagawa & Toda 1981]. Each cell rendered as a `<g class="op">` containing a `<use href="#cell-<type>">` referencing a per-cell-type `<symbol>` definition (T2 Doc 01 §9 instancing). Each port rendered as a `<g class="port">` with a `<circle>` and label.

## Algorithm (mission Doc 05 §4)

```
1. extract module → SCRIBE generic graph
   - port nodes (sub_type="port", payload contains direction + width)
   - cell nodes (sub_type="<yosys-type>", payload contains parameters)
   - wire edges (rel="wire", connects port-output → port-input)

2. coalesce wire-buses by netname
   - a 32-bit signal is one logical edge, not 32 individual edges

3. Sugiyama layer assignment (longest-path)
   - input ports forced to layer 0
   - output ports forced to layer N

4. within-layer ordering (median heuristic, Eades & Wormald 1994)

5. coordinate assignment (Brandes & Köpf 2002)

6. orthogonal edge routing (rectilinear, Tamassia 1987)

7. emit SVG:
   - <defs> with one <symbol id="cell-$add"> etc per cell type
   - <metadata> with full SCRIBE graph
   - <g class="layer wires"> with <path class="wire"> elements
   - <g class="layer ports"> with port elements
   - <g class="layer ops"> with <use> instancing per cell
```

## Mapping table

| Yosys JSON | SCRIBE SVG |
|---|---|
| `module` name | `<scribe:graph>` + module-name container |
| `module.ports.<name>` | `<scribe:node sub_type="port" label="<name>" payload='{"direction":"...","width":N}'/>` |
| `module.cells.<name>` | `<scribe:node sub_type="<yosys-type>" label="<name>" payload='{...parameters...}'/>` |
| `module.cells.<name>.connections.<port>` | `<scribe:edge rel="wire" src="<cell-id>:<port>" dst="<other-cell-id>:<port>"/>` |
| `module.netnames.<name>` | wire labels in visual layer |

## Implementation status

- **In viewer (`../viewer/viewer.js` `renderNetlistSvg()`):** simplified version that derives netlist directly from AST, not from Yosys output. Sufficient for toy-scope demonstration.
- **In cartridge:** design document only (this file). A standalone Yosys-driven renderer is deferred per mission Doc 03 §10.
- **In community:** [`netlistsvg`](https://github.com/nturley/netlistsvg) (Neil Turley) is the closest existing implementation. SCRIBE's renderer would be a fork that adds metadata emission.

## Citations

- [Brandes & Köpf 2002] Brandes U, Köpf B. "Fast and Simple Horizontal Coordinate Assignment." *Graph Drawing 2001*, LNCS 2265, 31-44.
- [Eades & Wormald 1994] Eades P, Wormald NC. "Edge Crossings in Drawings of Bipartite Graphs." *Algorithmica* 11, 379-403.
- [nturley 2017] Turley N. *netlistsvg*. <https://github.com/nturley/netlistsvg>.
- [Sugiyama, Tagawa & Toda 1981] Sugiyama K, Tagawa S, Toda M. "Methods for visual understanding of hierarchical system structures." *IEEE TSMC* SMC-11(2), 109-125.
- [Tamassia 1987] Tamassia R. "On Embedding a Graph in the Grid with the Minimum Number of Bends." *SIAM J. Computing* 16(3), 421-444.
- [Yosys Manual] Wolf C. *Yosys Manual*. <https://yosyshq.net/yosys/documentation.html>.
