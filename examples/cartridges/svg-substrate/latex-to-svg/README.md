# LaTeX to SVG reference

Two routes for rendering a LaTeX equation as native SVG. See Doc 02 (`../../../.planning/missions/v1-49-621-scribe/t2-svg-substrate/02-formula-editor-lineage.md`) for the full discussion.

## Route A — `dvisvgm` (build-time, deterministic)

Recommended for any equation that ships as a static artifact in a corpus. Output is reproducible byte-for-byte across runs given identical input and identical TeX/font-package versions.

Prerequisites: a working TeX Live install with `dvisvgm` (default in TeX Live 2020+).

```sh
./render.sh "E = mc^2"          # writes equation.svg
./render.sh -i input.tex        # rendering full LaTeX file
```

`render.sh` wraps `latex` (or `xelatex --no-pdf`) → `.dvi` → `dvisvgm --no-fonts --exact --bbox=preview` → `.svg`. The `--no-fonts` flag emits glyphs as `<path>` data (the SCRIBE preferred form for portability); `--exact` matches Knuth's box metrics; `--bbox=preview` produces a tightly-cropped equation-only output.

## Route B — MathJax (runtime, browser-side)

Recommended for hosted documents where equations are dynamic or where the build pipeline does not have TeX Live.

```js
import { mathjax } from './render.ts';
const svg = await mathjax.renderToSvg('E = mc^2');
```

`render.ts` wraps `mathjax-full` v3+ in headless mode, configured for SVG output. The module spins up a single shared instance per process and re-uses it across calls.

## Self-demo

The reference equation $E = mc^2$ rendered via Route A produces output equivalent to `figures/02-equation-demo.svg` in the source mission. The rendered SVG carries glyphs as `<path>` data inside `<defs>` and instances them via `<use>`, mirroring the cache-and-instance pattern Doc 02 §6 documents.

## Round-trip discipline

Doc 02 §11 covers the round-trip discipline. Short version: when round-trip is load-bearing, route through MathML as the canonical IR. Author in TeX, store MathML, render to SVG for the print-quality artifact and to MathML-via-browser for the interactive artifact.
