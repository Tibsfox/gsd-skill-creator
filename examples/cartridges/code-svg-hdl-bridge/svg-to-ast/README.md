# svg-to-ast

Reverse-direction parser: SCRIBE-compliant SVG → AST → source.

## Files

- `parse.ts` — TypeScript reference parser. Includes both `parseSemantic()` (uses SCRIBE metadata; lossless within the metadata's coverage) and `parseStructural()` stub (lossy fallback per mission Doc 02 §6 — not yet implemented at toy scope).
- `metadata-spec.md` — The full SCRIBE round-trip metadata namespace specification (companion to mission Doc 02 §4).
- `validate.ts` — Validator checking the round-trip invariants (mission Doc 06 §7). Extends T2 cartridge `validators/a11y-check.ts`.
- `svgo-roundtrip.config.js` — SVGO config that preserves `<metadata>`, `data-*` attributes, custom namespaces, and node IDs. Use this config (not stock SVGO defaults) on SCRIBE artifacts.

## Why this matters

Most SVG processing tools (especially SVGO with default config) strip metadata. T3's round-trip thesis (mission Doc 06) depends on the metadata surviving every transform. This cartridge's `svgo-roundtrip.config.js` is the *opt-out from the destructive default*; use it whenever a SCRIBE SVG passes through SVGO in your pipeline.

## Composition with T2

T2's a11y SVGO config (`examples/cartridges/svg-substrate/validators/svgo.config.js`) preserves `<title>`/`<desc>`/`<metadata>`/ARIA roles. This cartridge's config extends that with additional preservations specific to SCRIBE round-trip:

- `cleanupIDs` disabled — SCRIBE node IDs (`n1`, `n2`, ...) must match between `<scribe:node id=...>` and `<g class="node" id=...>`
- `removeUnknownsAndDefaults` configured to keep `data-*` attrs
- `removeUnusedNS` disabled — preserves `xmlns:scribe` even when it appears unused at the root

Both configs are compatible; you can use them together by composing the plugin lists.

## Usage

```typescript
import { parseSemantic, validateScribeSvg } from './parse';
import { astToSource } from './regenerate';

const svgString = await fs.readFile('input.svg', 'utf-8');
const report = validateScribeSvg(svgString);
if (report.some(r => r.startsWith('FAIL'))) throw new Error('SCRIBE round-trip preconditions not met');

const { ast, source } = parseSemantic(svgString);
const regeneratedSource = astToSource(ast);
console.log('Original SHA:', source.sha);
console.log('Regenerated:', regeneratedSource);
```

The in-browser version of all three functions is bundled into `../viewer/viewer.js` (no module system required).

## Lossy fallback (deferred)

`parseStructural()` is the lossy-recovery path for SVGs that have lost their SCRIBE metadata. The algorithm is documented in mission Doc 02 §6 (find rect+text candidates, find path candidates, resolve endpoints by spatial nearest-neighbor, recover labels from `<text>`). Not yet implemented at toy scope; the cartridge reserves the symbol so callers can detect availability via runtime feature-detection.

## See also

- Mission Doc 02: SVG-to-code (reverse direction)
- Mission Doc 06 §6: contract with consuming tools
- T2 cartridge `validators/a11y-check.ts`
