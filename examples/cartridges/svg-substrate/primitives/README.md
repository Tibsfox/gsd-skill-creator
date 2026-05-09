# SVG primitives library

Copy-pastable hand-authored SVG fragments. Each primitive is a self-contained `<g>` or `<symbol>` with `<title>` and `<desc>` baked in.

## Contents

- `arrow.svg` — Standard right-pointing arrow marker; usable as a `<marker>` definition.
- `axis-x.svg` — Horizontal axis with ticks and labels (parameterised by the author).
- `callout.svg` — Annotation callout (arrow + text box) for figure annotation.
- `dot.svg` — Circle data-mark with `role="graphics-symbol"` ready for `aria-label` injection.

These are reference implementations; the SCRIBE author copies the relevant fragment into a new figure and edits in place. They are intentionally minimal — the goal is hand-authored output, not a runtime library.
