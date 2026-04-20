---
name: math-coprocessor
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-03-07
first_path: examples/chipsets/math-coprocessor/README.md
description: Reference stub — canonical source is now at coprocessors/math/
superseded_by: coprocessors/math
---

# math-coprocessor — reference stub

**Canonical location:** [`coprocessors/math/`](../../../coprocessors/math/) at the
repo root.

Promoted from `examples/chipsets/` to a first-class sibling location on
2026-04-19 to reflect its role as a core gsd-skill-creator runtime for
local GPU math. The `examples/chipsets/` path is preserved as this stub so
cartridges and docs that still reference the old path can find the new one
without a broken link.

See [`coprocessors/math/README.md`](../../../coprocessors/math/README.md) for
the package, [`coprocessors/math/chipset.yaml`](../../../coprocessors/math/chipset.yaml)
for the chipset config, and [`coprocessors/math/PACKAGE.md`](../../../coprocessors/math/PACKAGE.md)
for the full runtime documentation.
