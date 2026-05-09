# SCRIBE Round-Trip Metadata Namespace Specification

**Version:** 1
**Namespace URI:** `https://tibsfox.com/Research/SCRIBE/ns#`
**Companion:** mission Doc 02 §4

This document specifies the SCRIBE round-trip metadata namespace as a *consumable* spec (downstream tools can implement against it). The intellectual case for the design lives in mission Doc 06; this is the implementation contract.

## 1. Namespace declaration

Every SCRIBE-compliant SVG MUST declare:

```xml
xmlns:scribe="https://tibsfox.com/Research/SCRIBE/ns#"
```

at the root `<svg>` element. The URI is an identifier (in the [Berners-Lee 1996] URI-as-identifier sense), not necessarily a resolvable URL. Implementations MUST NOT dereference the URI.

## 2. Top-level element

```xml
<scribe:graph version="1"
              kind="ast|callgraph|dfg|cfg|netlist|fsm"
              [language="typescript|verilog|systemverilog|vhdl|chisel|amaranth|spinalhdl|c|cpp|python"]>
  ...
</scribe:graph>
```

- **`version`** REQUIRED. Currently `"1"`. Consumers MUST reject unknown versions.
- **`kind`** REQUIRED. Closed enum: `ast`, `callgraph`, `dfg`, `cfg`, `netlist`, `fsm`.
- **`language`** OPTIONAL for AST/CFG/DFG kinds; meaningless for `netlist`.

## 3. Source provenance

```xml
<scribe:source path="..." sha="..." [bytes="..."] [generator="..."]/>
```

- **`path`** REQUIRED. Repo-relative path (or absolute URI for external sources).
- **`sha`** REQUIRED. Source file's hex digest, leading 16+ chars. Algorithm: SHA-1, SHA-256, or any deterministic content-addressed identifier. Implementations MAY use SHA-1 for browser-resident demos (faster); production tooling SHOULD use SHA-256.
- **`bytes`** OPTIONAL. Source-file size in bytes.
- **`generator`** OPTIONAL. Free-form tool identifier (e.g., `scribe-roundtrip-viewer/1.0`).

## 4. Nodes

```xml
<scribe:nodes>
  <scribe:node id="..." sub_type="..." label="..."
               [span="START..END"]
               [payload='{"key":"value"}']/>
  ...
</scribe:nodes>
```

- **`id`** REQUIRED. Graph-local identifier; MUST be a valid CSS identifier (matches `data-node-id` on visual elements).
- **`sub_type`** REQUIRED. From the closed per-`kind` taxonomy. Examples by kind:
  - `kind="ast"` `language="typescript"`: TypeScript SyntaxKind names — `FunctionDeclaration`, `Identifier`, `BinaryExpression`, `ReturnStatement`, etc.
  - `kind="netlist"`: Yosys cell types — `$add`, `$mul`, `$mux`, `$dff`, `port`, etc.
  - `kind="callgraph"`: `function`, `method`, `constructor`.
  - `kind="cfg"`: `basic_block`.
- **`label`** REQUIRED. Human-readable name (often identifier text or operator glyph).
- **`span`** REQUIRED for `kind="ast"`. Byte-offset range into source as `START..END`.
- **`payload`** OPTIONAL. JSON-encoded extra data.

## 5. Edges

```xml
<scribe:edges>
  <scribe:edge id="..." rel="..." src="..." dst="..."
               [payload='{"key":"value"}']/>
  ...
</scribe:edges>
```

- **`id`** REQUIRED. Content-addressed: `sha256(src||rel||dst)[:16]` per the T5 cartridge convention. Implementations MAY use a simpler scheme (`e0`, `e1`, ...) for deterministic test artifacts, as long as IDs are stable across re-renders of the same source.
- **`rel`** REQUIRED. From the closed relation set:
  - `child` — parent → child in AST/tree
  - `wire` — connection between netlist cells
  - `calls` — callgraph caller → callee
  - `uses` / `defines` — DFG def-use
  - `next` / `true_branch` / `false_branch` — CFG transitions
  - `instantiates` — module instantiation hierarchy
  - `wasDerivedFrom` / `wasGeneratedBy` / `used` — PROV-O persistence relations
- **`src`** REQUIRED. ID of source node.
- **`dst`** REQUIRED. ID of destination node.
- **`payload`** OPTIONAL. JSON-encoded extra data; for `child` relations carries `{"order":N}` to preserve sibling order.

## 6. Optional layout hints

```xml
<scribe:layout algorithm="reingold-tilford|sugiyama|force-directed|orthogonal"
               [seed="..."]/>
```

If present, downstream re-renderers SHOULD use the named algorithm. Without this hint, layout choice is implementation-defined.

## 7. Optional round-trip stamps

```xml
<scribe:roundtrip lastSync="ISO-8601-timestamp"
                  reverseDirection="hand-edit|tool-emit|auto"/>
```

Records the last time SVG ↔ code synchronization occurred. Useful for live tooling to detect divergence.

## 8. Per-element redundancy (the triple-encoding contract)

To survive metadata-stripping transforms, the same data SHOULD be encoded in three places:

1. **`<scribe:nodes>` and `<scribe:edges>`** in `<metadata>` — machine-canonical
2. **`data-node-id`, `data-sub_type`, `data-span`, `data-rel`, `data-src`, `data-dst`** on visual `<g>` and `<path>` elements — survives some optimizers that strip `<metadata>`
3. **`<title>` and `<desc>`** child elements per visual node — a11y-required, survives nearly all transforms

The triple-encoding cost is ~30-50% file size; the benefit is graceful degradation across the failure modes enumerated in mission Doc 06 §4.

## 9. Examples

The following is a complete minimum SCRIBE-compliant SVG for the AST of `function add(a, b) { return a + b }`. The actual generated artifacts (5,388 bytes for full triple-redundant version) live at `../ast-to-svg/examples/add.svg`.

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:scribe="https://tibsfox.com/Research/SCRIBE/ns#"
     viewBox="0 0 540 280"
     role="graphics-document"
     aria-labelledby="t">
  <title id="t">add.ts AST</title>
  <desc>SCRIBE round-trip artifact: add.ts (35 bytes) parsed to AST.</desc>
  <metadata>
    <scribe:graph version="1" kind="ast" language="typescript">
      <scribe:source path="add.ts" sha="cb1aaef8c3f5..." bytes="35" generator="scribe-roundtrip-viewer/1.0"/>
      <scribe:nodes>
        <scribe:node id="n8" sub_type="FunctionDeclaration" label="add" span="0..35"/>
        <scribe:node id="n1" sub_type="Identifier" label="add" span="9..12"/>
        <scribe:node id="n2" sub_type="Parameter" label="a" span="13..14"/>
        <scribe:node id="n3" sub_type="Parameter" label="b" span="16..17"/>
        <scribe:node id="n7" sub_type="ReturnStatement" label="" span="28..33"/>
        <scribe:node id="n6" sub_type="BinaryExpression" label="+" span="28..33"/>
        <scribe:node id="n4" sub_type="Identifier" label="a" span="28..29"/>
        <scribe:node id="n5" sub_type="Identifier" label="b" span="32..33"/>
      </scribe:nodes>
      <scribe:edges>
        <scribe:edge id="e0" rel="child" src="n8" dst="n1" payload='{"order":0}'/>
        <scribe:edge id="e1" rel="child" src="n8" dst="n2" payload='{"order":1}'/>
        <scribe:edge id="e2" rel="child" src="n8" dst="n3" payload='{"order":2}'/>
        <scribe:edge id="e3" rel="child" src="n8" dst="n7" payload='{"order":3}'/>
        <scribe:edge id="e4" rel="child" src="n7" dst="n6" payload='{"order":0}'/>
        <scribe:edge id="e5" rel="child" src="n6" dst="n4" payload='{"order":0}'/>
        <scribe:edge id="e6" rel="child" src="n6" dst="n5" payload='{"order":1}'/>
      </scribe:edges>
    </scribe:graph>
  </metadata>
  <!-- ... visual content with redundant data-* + per-node title/desc ... -->
</svg>
```

## 10. Schema-versioning policy

Version `1` is the current spec. Future versions MAY add new optional elements/attributes (backward-compatible additions). Removing or repurposing existing elements/attributes requires bumping to version `2`. Consumers MUST check `version` on `<scribe:graph>` before processing.

## 11. References

- mission Doc 02 §4 — the namespace specification (this document is the cartridge-shipped form)
- mission Doc 06 §5 — the *just enough* metadata layer rationale
- mission Doc 06 §6 — the contract with consuming tools
- T2 cartridge `validators/a11y-check.ts` — a11y baseline this spec composes with
- T5 cartridge `migrations/001-init.postgres.sql` — PROV-O substrate for round-trip persistence
- W3C SVG 2 §6 "Metadata"
- W3C PROV-O Recommendation
