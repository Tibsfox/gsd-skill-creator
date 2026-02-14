# Requirements: v1.18 — Information Design System

**Source:** gsd-information-design-implementation-guide.md
**Milestone:** v1.18
**Created:** 2026-02-13

## Design System Foundation

- [ ] REQ-DS-01: CSS custom properties for 6 domain colors (Frontend blue, Backend green, Testing amber, Infrastructure purple, Observation teal, Silicon rose)
- [ ] REQ-DS-02: CSS custom properties for 4 signal colors (success green, warning orange, error red, neutral gray)
- [ ] REQ-DS-03: JetBrains Mono for data/monospace contexts, Inter for UI chrome
- [ ] REQ-DS-04: `font-variant-numeric: tabular-nums` globally for all numeric content
- [ ] REQ-DS-05: Weight-based hierarchy (bold primary, regular secondary) at same point size
- [ ] REQ-DS-06: Spacing tokens (letter-spacing 0.025em, line-height 1.5, card margins 16-24px)
- [ ] REQ-DS-07: Five status states as CSS classes: not-started (empty gray), active (filled domain), complete (green check), blocked (red struck), attention (half-filled orange)
- [ ] REQ-DS-08: Sentence case for labels/headings, ALL CAPS reserved for interrupts only
- [ ] REQ-DS-09: Design system CSS importable by dashboard and all future GSD UI components

## Gantry (Persistent Status Strip)

- [ ] REQ-GA-01: Fixed-position status strip below nav on all dashboard pages
- [ ] REQ-GA-02: Agent status indicators (filled/empty circles, domain-colored)
- [ ] REQ-GA-03: Phase progress fraction (e.g., "1/2" not "50%")
- [ ] REQ-GA-04: Token budget as single colored bar segment
- [ ] REQ-GA-05: Maximum 8 cells in gantry (strict limit)
- [ ] REQ-GA-06: Symbols before text (visual indicators before labels)
- [ ] REQ-GA-07: Auto-refresh via existing polling mechanism
- [ ] REQ-GA-08: Data sourced from STATE.md and active session observations

## Shape/Color Entity System

- [ ] REQ-SC-01: Six entity shapes: Agent=circle, Skill=rectangle, Team=hexagon, Phase/Milestone=chevron, Adapter=diamond, Plan=dot
- [ ] REQ-SC-02: Domain-colored shapes for two-dimensional encoding (blue circle = frontend agent)
- [ ] REQ-SC-03: Milestone cards prefixed with chevrons, status-colored
- [ ] REQ-SC-04: Domain-colored shapes in activity/terminal panel headers
- [ ] REQ-SC-05: Collapsible shape/color legend footer (visible once, then dismissed)

## Identifier Encoding

- [ ] REQ-ID-01: Domain prefixes (F=Frontend, B=Backend, T=Testing, I=Infrastructure, O=Observation, S=Silicon)
- [ ] REQ-ID-02: Agent identifiers as domain-number (F-1, B-1, T-1)
- [ ] REQ-ID-03: Skill identifiers as agent.abbreviation dot notation (F-1.rcp, B-1.api)
- [ ] REQ-ID-04: Adapter identifiers as agent:abbreviation colon notation (F-1:rcp)
- [ ] REQ-ID-05: SuggestionManager assigns domain-prefixed identifiers when proposing skills
- [ ] REQ-ID-06: AgentComposer uses domain-prefixed agent identifiers
- [ ] REQ-ID-07: Backward compatibility (old-style names still work)
- [ ] REQ-ID-08: Identifier encoding added to generated SKILL.md metadata

## Topology View

- [ ] REQ-TV-01: Simplified network diagram renderer (SVG, no library dependency)
- [ ] REQ-TV-02: Data sourced from chipset.yaml agent routes
- [ ] REQ-TV-03: Animated edge pulses for active routes, dashed lines for dormant
- [ ] REQ-TV-04: Maximum 12 nodes visible (collapse inactive branches)
- [ ] REQ-TV-05: Click-to-detail interaction (side panel, not in-map)
- [ ] REQ-TV-06: Integration with auto-refresh
- [ ] REQ-TV-07: Route-map panel on dashboard

## Activity Feed

- [ ] REQ-AF-01: Feed component translating SessionObserver events into shape/color/identifier format
- [ ] REQ-AF-02: Maximum 8 visible entries, newest at top
- [ ] REQ-AF-03: One-line descriptions only, never wrapping
- [ ] REQ-AF-04: Domain-colored entity shapes as leading indicators
- [ ] REQ-AF-05: Tab toggle between Activity (guide sign) and Terminal (raw output)
- [ ] REQ-AF-06: No timestamps in feed (read-level detail in log panel)

## Token Budget Gauge

- [ ] REQ-BG-01: Horizontal stacked bar for token budget with domain-colored segments
- [ ] REQ-BG-02: Threshold color transitions (80% orange, 95% red)
- [ ] REQ-BG-03: No numbers at glance level (just bar fill), percentages at scan level
- [ ] REQ-BG-04: Gray for headroom segment

## Silicon Panel

- [ ] REQ-SP-01: Diamond-shaped adapter indicators with confidence scores
- [ ] REQ-SP-02: Adapter lifecycle mapped to five-state vocabulary
- [ ] REQ-SP-03: VRAM gauge as horizontal stacked bar
- [ ] REQ-SP-04: Progressive enhancement (no silicon.yaml = no panel, disabled = message, enabled = full panel)

## Three-Speed Principle

- [ ] REQ-3S-01: Every element must work at glance level (2 seconds — shape + color)
- [ ] REQ-3S-02: Most elements must work at scan level (10 seconds — numbers + short labels)
- [ ] REQ-3S-03: Detail panels support read level (30+ seconds — full descriptions, logs)
- [ ] REQ-3S-04: No descriptions at glance level (read-level content only)

## Technical Constraints

- [ ] REQ-TC-01: Vanilla HTML/CSS with minimal JS (no JavaScript frameworks)
- [ ] REQ-TC-02: Self-contained output (no external dependencies beyond fonts)
- [ ] REQ-TC-03: Incremental builds (only regenerate changed pages)
- [ ] REQ-TC-04: Fractions over percentages for progress display
- [ ] REQ-TC-05: Horizontal bars only (no pie charts)
