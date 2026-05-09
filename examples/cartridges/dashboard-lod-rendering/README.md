# dashboard-lod-rendering — Cartridge

The dashboard / level-of-detail / rendering substrate for SCRIBE.
SVG → Canvas → WebGL → WebGPU → Tauri+wgpu native — one substrate ladder, one
node-ID schema, one shader codebase shared across browser and native.

**Track:** T4 — DASHBOARD-LOD-RENDERING
**Mission:** SCRIBE (v1.49.621)
**Wave:** 2 (applied substrate)

## What this cartridge ships

```
dashboard-lod-rendering/
├── README.md                          (this file)
├── manifest.json                      (machine-readable metadata)
├── lod-thresholds.md                  (authoritative substrate-switch table)
├── webgl-primitives/
│   ├── README.md
│   ├── instanced-nodes.glsl           (SDF disk node primitive)
│   ├── edge-batch.glsl                (wide-line edge primitive)
│   └── regl-setup.ts                  (regl declarative wrapper)
├── webgpu-compute/
│   ├── README.md
│   └── force-atlas-2.wgsl             (3 compute kernels for GPU FA2)
├── dashboard-service/
│   ├── README.md
│   ├── serve.mjs                      (minimal Node HTTP server)
│   └── package.json
├── dashboard/                         (the working LOD demo)
│   ├── index.html
│   ├── app.js                         (pure ESM, zero deps)
│   ├── data/sample-graph.json         (32-node T5 sample-provenance corpus)
│   └── lib/                           (extension point for future renderers)
└── deploy/
    └── ftp-sync.sh                    (sync to tibsfox.com)
```

## Composes with

| Cartridge | What it provides | How dashboard uses it |
|---|---|---|
| **`svg-substrate`** (T2) | SVG primitive library, animation patterns, accessibility checklist, substrate-ladder thresholds (doc 07) | Doc 01 cites T2 doc 07 as the originating reference for the renderer ladder. The dashboard's SVG rung inherits T2's a11y discipline (T2 doc 06) and uses WAAPI (T2 doc 03) for scrubbing. |
| **`retrieval-provenance`** (T5) | PROV-O schema, two-table edge-list, recursive-CTE traversal helpers, hybrid-search RRF, sample provenance | The dashboard IS the visual presentation layer of T5's substrate. Every interaction in doc 08 maps to a T5 substrate decision (REPORT §6). The 32-node sample-provenance graph is the dashboard's first-light corpus. |

## Quickstart — open the floor demo

```bash
# Option 1: zero-dep static server
cd dashboard-service
node serve.mjs                     # listens on http://127.0.0.1:8088/

# Option 2: any other static server
cd dashboard
python3 -m http.server 8080        # http://127.0.0.1:8080/

# Option 3: directly from filesystem
open dashboard/index.html          # macOS
xdg-open dashboard/index.html      # Linux
```

The dashboard loads the 32-node T5 sample-provenance corpus by default.

## Quickstart — Tauri-native window (CAP-024)

Run the dashboard in a native OS window via the Tauri desktop app.  The same
`dashboard/index.html` + `app.js` + `webgpu-layout.js` load in the platform
webview (WebView2 / WKWebView / WebKitGTK); no WGSL changes required.

### Prerequisites

```bash
# Install Tauri CLI (one-time)
cargo install tauri-cli --version "^2"   # or: npm install -g @tauri-apps/cli

# Linux: ensure WebKitGTK development headers are present
sudo apt install libwebkit2gtk-4.1-dev   # Ubuntu/Debian
```

### Launch via npm script

```bash
# Start the full GSD-OS desktop app (main window + SCRIBE dashboard window):
npm run tauri:scribe

# The SCRIBE dashboard window opens automatically when you invoke the command
# from the main GSD-OS window UI, or via the Tauri IPC from any webview:
```

```ts
// Invoke from TypeScript (inside any Tauri webview):
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('open_scribe_dashboard');
// result = { label: "scribe-dashboard", created: true }
```

### How the resource bundling works

`tauri.conf.json` `bundle.resources` maps:

```
"../examples/cartridges/dashboard-lod-rendering/dashboard" → "scribe-dashboard"
```

At bundle time Tauri copies the entire `dashboard/` directory into the app's
resource bundle under the `scribe-dashboard/` subdirectory.  At runtime the
Rust command `open_scribe_dashboard` resolves the path via
`app.path().resource_dir()` and loads `scribe-dashboard/index.html` through the
Tauri `asset://` protocol.

### Idempotency

Calling `open_scribe_dashboard` when the window is already open brings it to
the foreground rather than creating a duplicate.

### Native wgpu rung (future)

The wgpu raw render loop (Vulkan/Metal/DX12, no webview overhead, bypasses the
browser compositor) is deferred to a follow-up milestone per doc 04 §13.  The
integration path is documented at
`.planning/missions/v1-49-621-scribe/t4-dashboard-lod-rendering/04-vulkan-native-tauri.md`.
When ready, the implementation belongs in `dashboard-service/native-rust/`.

## What the demo shows

- **The sample provenance graph**: commits → sessions → decisions → rejected
  alternatives → evidence → files. Click a `file` node, see the full upstream
  causal chain in the inspector.
- **Substrate handoff**: toggle the `Auto / SVG / Canvas` buttons in the header
  to manually force a substrate; click the "Codebase slice (1K files)" corpus
  button and watch the Auto router upgrade SVG→Canvas because N exceeds 2,000.
  Watch the substrate-pulse animation around the canvas border on each handoff.
- **Linked highlighting**: clicking a node highlights it + its 1-hop neighbours,
  dims everything else (per Buja et al. 1991).
- **Force-directed layout** with selected-node pinning (per doc 07 §7.2).
- **Fuzzy search**: type `IC-613` in the search box; jump to any matching node.
- **Keyboard shortcuts**: `/` focus search, `f` fit, `e`/`E` expand
  downstream/upstream, `Esc` clear selection.

## What the demo does NOT show (deferred)

- WebGL rung — primitive shaders are documented + cartridge-shipped; not wired
  to the active dashboard. Floor-demo corpus is too small to trigger WebGL.
- WebGPU rung — WGSL kernels documented + shipped; not wired live.
- Tauri+wgpu native window — documented architecture, deferred implementation.
- Document graph extractor — markdown-as-data extractor specced in doc 06,
  deferred implementation.
- Multi-level layout for >5K nodes — specced in doc 07 §9, deferred.

## Reference document set

The full track ships 8 documents at
`.planning/missions/v1-49-621-scribe/t4-dashboard-lod-rendering/`:

1. `01-lod-strategy.md` — substrate ladder + thresholds + decision tree
2. `02-webgl-glsl-data-viz.md` — WebGL rung specification
3. `03-webgpu-practical-guide.md` — WebGPU rung specification
4. `04-vulkan-native-tauri.md` — native rung via Tauri+wgpu
5. `05-node-based-code-visualization.md` — code-as-graph patterns
6. `06-document-graph-visualization.md` — doc-as-graph patterns
7. `07-force-directed-vs-hierarchical-layouts.md` — layout algorithms
8. `08-interactive-query-overlay.md` — T5 substrate → dashboard query API

(Doc 09 — dashboard service architecture — deferred per stop-condition.)

## License + attribution

Same license as gsd-skill-creator. The WGSL kernels in `webgpu-compute/` are
implementations of the published ForceAtlas2 algorithm (Jacomy et al. 2014,
PLOS ONE) per the WebGPU adaptation pattern in Brendel et al. 2024 (IEEE VIS);
no copied code from those publications.
