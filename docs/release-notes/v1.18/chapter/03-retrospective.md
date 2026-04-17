# Retrospective — v1.18

## What Worked

- **Shape+color dual encoding for accessibility.** Using both SVG shapes (circle, rect, hexagon, chevron, diamond, dot) and domain colors means the visual language works for colorblind users. This is accessibility by architecture, not by afterthought.
- **Subway-map topology view.** Bezier curve edges with directional indicators and the 12-node collapse threshold show restraint -- the view stays readable at scale instead of becoming a hairball.
- **CSS design system with tokens, not hardcoded values.** 6 domain colors, 4 signal colors, 4px grid, named spacing sizes -- all as CSS custom properties. Every subsequent component inherits a consistent visual language without copy-pasting hex values.

## What Could Be Better

- **515 tests is adequate but the SVG rendering logic is hard to unit test.** Topology view, entity shapes, and budget gauges produce SVG output that's structurally verifiable but visually unverifiable without screenshot comparison.
- **8-cell gantry maximum may be limiting.** With 10 agents defined in later releases, the overflow indicator will be exercised frequently. The gantry should probably scale to the actual agent count.

## Lessons Learned

1. **Domain-prefixed identifiers (F-1, B-1.api, T-1:rcp) solve the naming collision problem.** When skills, agents, and teams coexist in the same namespace, prefix encoding makes type immediately visible from the ID alone. Backward compatibility with integer IDs preserves existing references.
2. **Three-speed information layering is the right abstraction for dashboards.** Not every user needs every detail. The gantry gives glance-level status, the activity feed gives recent context, and the topology view gives structural understanding. Each serves a different cognitive need.
3. **An entity legend is essential for visual systems.** The collapsible legend panel with all 6 entity types prevents the "what does the hexagon mean?" question. Self-documenting UIs reduce support burden.

---
