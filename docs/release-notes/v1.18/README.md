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

---
