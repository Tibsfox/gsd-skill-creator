# v1.18 — Information Design System

**Shipped:** 2026-02-14
**Phases:** 142-148 (7 phases) | **Plans:** 15 | **Requirements:** 53

Translate proven information design principles into the dashboard with a learnable visual language — shape+color encoding, persistent status gantry, topology views, and three-speed information layering.

### Key Features

**CSS Design System (Phase 142):**
- 6 domain colors mapped to project facets (skill, agent, team, phase, budget, session)
- 4 signal colors (success, warning, error, info) with accessible contrast ratios
- Typography system: Inter for UI text, JetBrains Mono for code/data
- Spacing tokens on a 4px grid with 5 named sizes
- 5 status states with consistent visual treatment

**Gantry Status Strip (Phase 143):**
- Persistent strip visible on all dashboard pages
- Agent circles showing active/idle state
- Phase progress fraction (e.g., "3/5")
- Budget bar with color-coded fill
- 8-cell maximum with overflow indicator

**Entity Shape System (Phase 144):**
- 6 SVG shapes: circle (skills), rect (agents), hexagon (teams), chevron (phases), diamond (adapters), dot (events)
- Shape+color dual encoding for accessibility
- Collapsible legend panel with all entity types

**Topology View (Phase 145):**
- Subway-map layout with SVG rendering
- Bezier curve edges with directional indicators
- 12-node collapse threshold for large topologies
- Animated pulses showing data flow
- Click-to-detail panel for node inspection

**Activity Feed (Phase 146):**
- Unicode shape indicators matching entity type
- Domain color coding per entry
- 8-entry newest-first display
- Tab toggle between activity feed and terminal view

**Budget Gauge & Silicon Panel (Phase 147):**
- Stacked bar with green/yellow/red threshold transitions
- Diamond adapter shapes for silicon panel
- VRAM gauge for memory-intensive operations
- Progressive enhancement for browsers without SVG support

**Domain Identifiers (Phase 148):**
- Domain-prefixed encoding: F-1 (skill), B-1.api (agent), T-1:rcp (team)
- Backward compatible with existing integer IDs
- SKILL.md metadata encoding for identifier persistence

### Test Coverage

- 515 tests across 15 test files

## Retrospective

### What Worked
- **Shape+color dual encoding for accessibility.** Using both SVG shapes (circle, rect, hexagon, chevron, diamond, dot) and domain colors means the visual language works for colorblind users. This is accessibility by architecture, not by afterthought.
- **Subway-map topology view.** Bezier curve edges with directional indicators and the 12-node collapse threshold show restraint -- the view stays readable at scale instead of becoming a hairball.
- **CSS design system with tokens, not hardcoded values.** 6 domain colors, 4 signal colors, 4px grid, named spacing sizes -- all as CSS custom properties. Every subsequent component inherits a consistent visual language without copy-pasting hex values.

### What Could Be Better
- **515 tests is adequate but the SVG rendering logic is hard to unit test.** Topology view, entity shapes, and budget gauges produce SVG output that's structurally verifiable but visually unverifiable without screenshot comparison.
- **8-cell gantry maximum may be limiting.** With 10 agents defined in later releases, the overflow indicator will be exercised frequently. The gantry should probably scale to the actual agent count.

## Lessons Learned

1. **Domain-prefixed identifiers (F-1, B-1.api, T-1:rcp) solve the naming collision problem.** When skills, agents, and teams coexist in the same namespace, prefix encoding makes type immediately visible from the ID alone. Backward compatibility with integer IDs preserves existing references.
2. **Three-speed information layering is the right abstraction for dashboards.** Not every user needs every detail. The gantry gives glance-level status, the activity feed gives recent context, and the topology view gives structural understanding. Each serves a different cognitive need.
3. **An entity legend is essential for visual systems.** The collapsible legend panel with all 6 entity types prevents the "what does the hexagon mean?" question. Self-documenting UIs reduce support burden.

---
