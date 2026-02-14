# Roadmap: v1.18 — Information Design System

**Goal:** Translate proven information design principles (subway maps, typography, highway signage) into the dashboard and skill-creator interfaces, creating a learnable visual language with shape+color encoding, persistent status gantry, topology views, and three-speed information layering.

## Phases

### Phase 142 — Design System Foundation
**Status:** planned
**Goal:** Establish CSS design system with domain colors, signal colors, typography, spacing tokens, and five-state status vocabulary before changing any components.
**Plans:** 2
- 142-01: CSS custom properties (domain colors, signal colors, spacing tokens, status states)
- 142-02: Typography system (font imports, weight hierarchy, numeric treatment, case discipline)

### Phase 143 — Gantry Status Strip
**Status:** planned
**Goal:** Build persistent real-time status strip answering "what's happening right now" in 2 seconds, with agent indicators, phase progress, and token budget.
**Depends on:** Phase 142
**Plans:** 2
- 143-01: Gantry component (fixed position, agent circles, phase fraction, budget bar)
- 143-02: Gantry data pipeline (STATE.md parsing, session observation sourcing, auto-refresh)

### Phase 144 — Shape/Color Entity System
**Status:** planned
**Goal:** Apply the shape+color encoding across dashboard components — entity shapes, domain colors, milestone chevrons, and collapsible legend.
**Depends on:** Phase 142
**Plans:** 2
- 144-01: Entity shape/color rendering (6 shapes, 6 domain colors, CSS classes, symbol rendering)
- 144-02: Dashboard component updates (milestone chevrons, activity headers, legend footer)

### Phase 145 — Topology View
**Status:** planned
**Goal:** Build a subway-map-style network diagram showing agent/skill/team connections with animated edges and click-to-detail.
**Depends on:** Phase 144
**Plans:** 3
- 145-01: SVG network diagram renderer (node positioning, edge drawing, layout algorithm)
- 145-02: Topology data pipeline (chipset.yaml parsing, active route detection, collapse logic)
- 145-03: Topology interactivity (animated pulses, click-to-detail side panel, auto-refresh)

### Phase 146 — Activity Feed
**Status:** planned
**Goal:** Build non-technical-friendly activity stream using shape/color/identifier format with tab toggle to terminal view.
**Depends on:** Phase 144
**Plans:** 2
- 146-01: Activity feed component (8-entry limit, shape indicators, one-line descriptions)
- 146-02: Activity/terminal tab toggle and SessionObserver event translation

### Phase 147 — Budget Gauge & Silicon Panel
**Status:** planned
**Goal:** Visualize token budget as domain-colored stacked bar and adapter health with diamond indicators and VRAM gauge.
**Depends on:** Phase 142
**Plans:** 2
- 147-01: Token budget gauge (stacked bar, domain segments, threshold transitions)
- 147-02: Silicon panel (diamond adapters, VRAM gauge, progressive enhancement)

### Phase 148 — Identifier Encoding
**Status:** planned
**Goal:** Push topology-encoding identifier system into skill-creator's generation pipeline with domain prefixes and backward compatibility.
**Depends on:** Phase 144
**Plans:** 2
- 148-01: Domain prefix assignment (SuggestionManager, AgentComposer, identifier generation)
- 148-02: Backward compatibility and SKILL.md metadata integration

## Dependency Graph

```
Phase 142 (Foundation)
  ├── Phase 143 (Gantry)
  ├── Phase 144 (Shape/Color)
  │     ├── Phase 145 (Topology)
  │     ├── Phase 146 (Activity Feed)
  │     └── Phase 148 (Identifier Encoding)
  └── Phase 147 (Budget/Silicon)
```

## Execution Waves

- **Wave 1:** Phase 142 (solo — foundation for all)
- **Wave 2:** Phases 143 + 144 + 147 (parallel — all depend only on 142)
- **Wave 3:** Phases 145 + 146 + 148 (parallel — all depend on 144, which is in Wave 2)
