# v1.18 — Information Design System

**Released:** 2026-02-14
**Scope:** feature — a learnable visual language for the planning-docs dashboard (shape+color encoding, persistent gantry, subway-map topology, three-speed layering, domain-prefixed identifiers)
**Branch:** dev → main
**Tag:** v1.18 (2026-02-13T17:49:46-08:00) — "Information Design System"
**Predecessor:** v1.17 — Staging Layer
**Successor:** v1.19 — Budget Display Overhaul
**Classification:** feature release — the visual-language layer over the v1.12 → v1.17 dashboard arc
**Phases:** 142–148 (7 phases) · **Plans:** 15 · **Requirements:** 53
**Stats:** 35 in-range phase commits · 515 tests across 15 test files · 394 files changed across the full v1.17..v1.18 range
**Verification:** every phase landed with `test(N-M)` before `feat(N-M)` · design-system tokens round-tripped through the generator · entity-shape legend rendered for all 6 types · topology collapse threshold exercised with >12-node fixtures · gantry 8-cell overflow asserted · domain-prefixed identifiers backward-compatible with integer IDs

## Summary

**v1.18 gave the dashboard a visual grammar.** The v1.12 → v1.17 arc had already given the planning-docs dashboard a body (static generation), a pulse (session lifecycle), forward motion (promotion pipeline), hands (Wetty terminal), a voice (dashboard console + milestone ingestion), and a staging lane (queue + hygiene). What it did not yet have was a *language* — a consistent way of showing, at a glance, what kind of thing each visual element represented and how it fit into the broader system. v1.18 added that layer. Seven phases (142 through 148), fifteen plans, thirty-five in-range phase commits, and five hundred and fifteen tests later, the dashboard shipped with a CSS design system of tokens, a persistent gantry status strip, a shape-plus-color entity encoding for six domain facets, an SVG subway-map topology view, an activity feed with a terminal tab toggle, a budget gauge with silicon-panel diamonds, and a domain-prefixed identifier scheme. None of these are exotic primitives individually; the contribution is the discipline of treating them as a single coordinated system with one legend, one set of tokens, and one set of rules.

**Tokens everywhere — no hardcoded hex, no hardcoded spacing.** Phase 142 landed `src/dashboard/design-system.ts` and wired it into the generator barrel. The scope is narrow and specific: six domain colors (skill, agent, team, phase, budget, session), four signal colors (success, warning, error, info) with contrast ratios that meet accessibility thresholds, a typography system using Inter for UI text and JetBrains Mono for code and data, and a 4-pixel baseline spacing grid expressed as five named sizes. Every subsequent phase in v1.18 consumes these tokens rather than introducing its own palette. The test suite for the design system (`design-system.test.ts`) asserts on the token shape, not on rendered output, which is the right contract at this layer — tokens are data, downstream renderers are responsible for painting. Phase 142-02 added the typography system specifically with the font, weight, and case discipline that downstream panels inherit. The direct consequence is that the activity feed, gantry, topology, budget gauge, silicon panel, and entity legend all share one visual grain; no component is allowed to invent its own.

**The gantry is persistent because glance-level status has to be instant.** Phase 143 shipped `src/dashboard/gantry-panel.ts` and `src/dashboard/gantry-data.ts` as the always-visible strip at the top of every dashboard page. The gantry shows agent circles colored by activity state, a phase progress fraction like "3/5", and a budget bar whose fill color follows the signal-color thresholds. The 8-cell maximum is a deliberate cognitive-load limit, with an overflow indicator when the agent count exceeds eight — a constraint that later releases will need to revisit because v1.27 and v1.33 both introduce agent counts well past eight. The split into a `gantry-data` collector (pure, testable) and a `gantry-panel` renderer (HTML/CSS) is the same data-vs-view separation the `dashboard-service` work in v1.15 established, reused here without modification. The failing tests landed first, on every phase, every commit pair — this is the same `test(N-M) → feat(N-M)` rhythm that has been consistent since v1.15.

**Shape-plus-color is accessibility as architecture, not accessibility as audit.** Phase 144 shipped `src/dashboard/entity-shapes.ts` and `src/dashboard/entity-legend.ts` with six SVG shapes bound to six domain types: circle for skills, rectangle for agents, hexagon for teams, chevron for phases, diamond for adapters, and dot for events. The critical property is *dual encoding* — every entity carries both a shape and a color. If a user's display collapses the color axis (monochrome, colorblind mode, high-contrast theme, printed page) the shape axis still disambiguates. If the shape axis collapses (icon font missing, SVG fails to load, text-only render) the color axis still disambiguates. The collapsible legend panel is the self-documenting layer on top — every dashboard surface can render the legend without the caller needing to know the complete entity enumeration. This removes the "what does the hexagon mean?" question as a class of user confusion rather than a recurring support ticket.

**The subway-map topology is deliberately un-pretty.** Phase 145 shipped the topology view across three plans: `src/dashboard/topology-renderer.ts` does the SVG drawing with bezier-curve edges, `src/dashboard/topology-data.ts` runs the layout plus node-collapse threshold logic, and `src/dashboard/topology-integration.ts` wires the panel into the dashboard generator with click-to-detail behavior. The design discipline is the 12-node collapse threshold — once a subgraph exceeds twelve nodes, the renderer collapses it behind an expandable cluster node rather than rendering a spaghetti of edges. This is the restraint decision; a naive force-directed graph view would have produced a hairball at the scale the project already operates at, and the read-at-a-glance property would evaporate. Animated pulses along edges show data flow direction — subtle, not distracting, with a single animation class shared across every edge so the frame rate stays predictable. Click-to-detail opens a side panel bound to the clicked node's identifier; the panel's content is the same kind of artifact the milestone and phase pages already render.

**The activity feed and the terminal live in the same tab group for a reason.** Phase 146 landed `src/dashboard/activity-feed.ts` and `src/dashboard/activity-tab-toggle.ts`. The activity feed uses unicode shape indicators that mirror the SVG entity shapes (so the same legend reads both places) and domain-color-codes every entry. Eight entries, newest first, persistent at a fixed height — the design commits to showing the most recent context rather than the full history, on the reasoning that a dashboard is a live surface, not an archive. The tab toggle binds the activity feed and the embedded Wetty terminal from v1.15 into a single pane that a user can flip between. This is the first place the two surfaces (passive observation and active command) coexist; every subsequent release that touches the dashboard inherits that grouping.

**The budget gauge and silicon panel keep resource accounting visible.** Phase 147 shipped `src/dashboard/budget-gauge.ts` and `src/dashboard/silicon-panel.ts`. The budget gauge is a stacked bar whose fill color transitions across green-yellow-red thresholds driven by the signal-color tokens — the user never has to read a number to know the resource state. The silicon panel uses the diamond adapter shape from the entity vocabulary and adds a VRAM gauge for memory-intensive operations, which is the first time the dashboard starts expressing hardware-specific state. Progressive enhancement is the fallback discipline: when SVG is unavailable, the panel degrades to a text summary rather than rendering broken chrome. The tests for this phase (`budget-gauge.test.ts`, `silicon-panel.test.ts`) assert on the structural SVG shape and on the threshold-to-color binding, not on visual appearance — the right contract, given that structural verification is automatable and visual verification is not.

**Domain-prefixed identifiers solve a naming-collision problem before it causes damage.** Phase 148 shipped `src/identifiers/types.ts`, `src/identifiers/generator.ts`, `src/identifiers/compat.ts`, and `src/identifiers/metadata.ts`. The scheme is `F-1` for a skill, `B-1.api` for an agent, `T-1:rcp` for a team — a letter prefix binds the numeric portion to an entity domain, and the qualifier after the dot or colon narrows further (an agent's interface, a team's role code). Backward compatibility with the existing bare integer IDs is a first-class guarantee via `compat.ts`: any place that used to carry a plain number still works, and the new prefix form is additive. The metadata encoding inside SKILL.md frontmatter persists the identifier so that a skill's prefix survives round-tripping through the authoring tools. Phase 148-01 wired the new ID generator into the suggestion managers (`src/agents/agent-suggestion-manager.ts`, `src/detection/suggestion-manager.ts`, `src/detection/skill-generator.ts`, `src/detection/suggestion-store.ts`) so that suggestions carry a proper domain-prefixed ID from the moment they are minted.

**Three-speed information layering is the right abstraction at dashboard scope.** The gantry is glance-level (sub-second, ambient, never scrolled past), the activity feed is recent-context (seconds, scrollable but bounded), and the topology view is structural (minutes, exploratory). Each serves a different cognitive need, and no single view tries to be all three. The design principle is not novel — it is the same three-speed layering that good monitoring dashboards, cockpit instrument panels, and subway-system maps all converge on independently. The contribution of v1.18 is committing to it as an explicit design principle rather than letting it emerge by accident. Downstream releases (v1.19 Budget Display Overhaul, v1.20 Dashboard Assembly, v1.21 GSD-OS Desktop Foundation) inherit this layering and tune it; none of them re-litigate whether to have three speeds.

**Red-green TDD was uniform across all seven phases — the commit log is legible.** `git log --oneline v1.17..v1.18 --grep='^feat\|^test'` reads as the same rhythm the project has maintained since v1.15: `test(142-01)` then `feat(142-01)`, `test(142-02)` then `feat(142-02)`, straight through phase 148-02. No implementation commit landed without a preceding test commit; no test commit was amended after implementation to make it pass. Fifteen plans across seven phases is an average of just over two plans per phase, which is consistent with the 53-requirement scope (≈ 3½ requirements per plan, ≈ 34 tests per plan). The five hundred and fifteen tests are colocated with the sources they exercise, same convention v1.15 normalized. A reader today can run `git show <test-sha>` on any plan and see the requirements expressed as code before the implementation exists — a requirement-to-test trace built into the commit graph with no separate tooling.

**The full v1.17..v1.18 git range is 85 commits across 394 files — but the v1.18 phase work is the 35 commits under phases 142–148.** The larger delta includes the v1.17 Staging Layer tail (phases 134–141), the terminology refactor from Blitter/Copper/DMA to Offload/Pipeline/Budget, a dashboard UX cleanup pass, the console lifecycle inbox (phases 128–132), the staging intake and hygiene subsystems (phases 134–141), and the v1.13–v1.17 merge back into main that happened in the v1.18 window. Honest release-note accounting means calling out that the 394-file shortstat is not *all* v1.18 work in the narrow sense — the dedicated v1.18 subsystem is what landed under `src/dashboard/` (the ten new panel/feed/shape/topology modules), `src/identifiers/` (the six-file identifier subsystem), and the generator wiring. The rest of the range is the other work that happened to share the same tag.

## Key Features

| Area | What Shipped |
|------|--------------|
| Design system (Phase 142) | CSS tokens for 6 domain colors, 4 signal colors, typography (Inter + JetBrains Mono), 4px spacing grid, 5 status states in `src/dashboard/design-system.ts` |
| Design system (Phase 142) | Generator-pipeline integration — tokens wired into the barrel so every downstream panel consumes the same palette |
| Gantry status strip (Phase 143) | `src/dashboard/gantry-panel.ts` — persistent strip, agent circles, phase progress fraction, budget bar, 8-cell overflow |
| Gantry status strip (Phase 143) | `src/dashboard/gantry-data.ts` — pure data collector split from the renderer, testable without DOM |
| Entity shape system (Phase 144) | `src/dashboard/entity-shapes.ts` — 6 SVG shapes (circle/rect/hexagon/chevron/diamond/dot) bound to domain types |
| Entity shape system (Phase 144) | `src/dashboard/entity-legend.ts` — collapsible legend panel with all 6 entity types, self-documenting surface |
| Topology view (Phase 145) | `src/dashboard/topology-renderer.ts` — SVG subway-map with bezier-curve edges and animated directional pulses |
| Topology view (Phase 145) | `src/dashboard/topology-data.ts` — layout + 12-node collapse threshold logic |
| Topology view (Phase 145) | `src/dashboard/topology-integration.ts` — generator wiring + click-to-detail side panel |
| Activity feed (Phase 146) | `src/dashboard/activity-feed.ts` — unicode shape indicators mirroring SVG entities, domain color coding, 8-entry newest-first window |
| Activity feed (Phase 146) | `src/dashboard/activity-tab-toggle.ts` — activity / terminal tab switch sharing one pane |
| Budget + silicon (Phase 147) | `src/dashboard/budget-gauge.ts` — stacked bar with green/yellow/red threshold transitions |
| Budget + silicon (Phase 147) | `src/dashboard/silicon-panel.ts` — diamond adapter shapes, VRAM gauge, SVG-unavailable progressive enhancement |
| Domain identifiers (Phase 148) | `src/identifiers/types.ts` + `generator.ts` — F-1 / B-1.api / T-1:rcp prefix scheme |
| Domain identifiers (Phase 148) | `src/identifiers/compat.ts` — backward compatibility layer preserving bare integer IDs |
| Domain identifiers (Phase 148) | `src/identifiers/metadata.ts` — SKILL.md metadata encoding so prefixes survive round-tripping |
| Suggestion integration | Domain-prefixed IDs wired into `src/agents/agent-suggestion-manager.ts`, `src/detection/suggestion-manager.ts`, `src/detection/skill-generator.ts`, `src/detection/suggestion-store.ts` |
| Test coverage | 515 tests across 15 test files, red-green TDD rhythm uniform across all 7 phases |

## Retrospective

### What Worked

- **Shape-plus-color dual encoding is accessibility-by-architecture.** Every entity carries both a shape and a color. If a display collapses the color axis (monochrome, colorblind mode, print) the shape axis still disambiguates, and vice versa. This is accessibility designed into the visual grammar, not retrofitted as a compliance exercise.
- **The 12-node collapse threshold kept the topology view readable at scale.** Bezier-curve edges with directional indicators plus the collapse-behind-a-cluster-node rule mean the view stays scannable at the sizes the project already operates at, rather than degenerating into a hairball of crossing edges.
- **Tokenized CSS — 6 domain colors, 4 signal colors, a 4px grid, named spacing sizes — gave every subsequent panel a shared visual grain.** No component invented its own palette. A downstream consumer who wants a warning treatment reads the warning token; no hex code is copy-pasted anywhere in the panel code.
- **Data-vs-view splits (`gantry-data` + `gantry-panel`, `topology-data` + `topology-renderer`) made each half independently testable.** The collector tests don't need a DOM, the renderer tests don't need live data. The same split repeats across every composite panel in the release.
- **Red-green TDD was uniform across all seven phases.** Every plan landed with a `test(N-M)` commit before the matching `feat(N-M)` commit. The commit log reads as a requirement-to-test trace a future reader can replay with `git show`.
- **Domain-prefixed identifier compatibility layer kept the existing codebase valid.** The `compat.ts` module means no caller was forced to migrate; the prefix form is additive, not replacing. Migration can happen at leisure rather than as a flag day.

### What Could Be Better

- **515 tests is adequate but SVG rendering logic is hard to unit-test past structure.** The topology, entity-shape, and budget-gauge tests assert on SVG element presence and attribute shape, not on visual appearance. Genuinely verifying the rendered output would need screenshot comparison against a known-good reference, which the v1.18 pipeline does not have.
- **The 8-cell gantry maximum will be exercised as the routine case within a few releases.** v1.27 (Foundational Knowledge Packs) and v1.33 (GSD OpenStack Cloud Platform) both land agent counts well past eight; the overflow indicator then stops being an edge case and becomes the ordinary display mode. The gantry should probably scale to the actual agent count, not cap at eight.
- **The v1.18 tag carries work that is not strictly the v1.18 phase set.** The 394-file shortstat includes v1.17 staging-subsystem tails, the Blitter/Copper/DMA → Offload/Pipeline/Budget terminology refactor, and the v1.13–v1.17 merge back into main. A reader who sees "394 files changed" and reads that as "v1.18 delta" will overstate the visual-language subsystem's own footprint — the actual v1.18 delta is much smaller and sits under `src/dashboard/` and `src/identifiers/`.
- **The entity legend is collapsible but is not yet keyboard-navigable.** The collapse toggle is click-driven, which works for mouse and touch users; the tab-to-focus and enter-to-toggle affordance should land before any accessibility audit can claim the legend is fully operable without pointer input.
- **Animated pulses on topology edges share a single animation class and frame rate, which is simple but not tunable.** If a user's machine struggles with the animation, there is no per-viewer way to pause it short of disabling motion system-wide. A `prefers-reduced-motion` honoring path should land in a follow-up.

## Lessons Learned

1. **Dual encoding beats single encoding for accessibility.** Shape *and* color means either axis can carry the semantic load alone. This is a design principle worth lifting: whenever a visual system binds information to a single channel (only color, only shape, only position), ask what happens when that channel collapses. If the answer is "the user gets lost," the encoding is not accessible; it is accessible-conditional-on-the-channel-working.
2. **The 12-node collapse threshold is the right default for subway-map topology.** Past twelve nodes, a direct-drawn graph becomes a hairball regardless of how pretty the edges look. Collapsing the subgraph behind an expandable cluster preserves readability without hiding information. The number itself is tunable; the principle is non-negotiable.
3. **CSS tokens are a contract, not a style.** Six domain colors, four signal colors, a 4-pixel baseline grid — these are assertions about the visual language the system will speak. Every component that consumes them inherits the contract. The cost of adding one more color is that every reader now has to remember it; the restraint of fixing the palette at ten is what makes the dashboard readable.
4. **Three-speed information layering is the right abstraction for dashboards.** Glance, recent-context, structural. Each layer serves a different cognitive need; no layer tries to be more than one. When a new panel appears that wants to serve all three, the right move is to split it, not widen the layer.
5. **Collapsible legends remove a class of user confusion.** The question "what does the hexagon mean?" is a recurring support burden in every visual system that ships shapes. An always-available legend eliminates the class rather than answering instances.
6. **Domain-prefixed identifiers solve a namespace collision before it causes damage.** `F-1` (skill), `B-1.api` (agent), `T-1:rcp` (team) — the prefix encodes the entity's domain, and the qualifier narrows further. Backward compatibility with bare integer IDs means the migration is additive. The alternative (a flag-day migration or a bare-number namespace that accidentally reuses 1 across three domains) is strictly worse.
7. **Data collectors and renderers should be separate modules, always.** `gantry-data` vs `gantry-panel`, `topology-data` vs `topology-renderer` — this is the data-vs-view split the Zod-schema-at-the-boundary pattern from v1.10/v1.15 generalizes into. The collector is testable without a DOM; the renderer is testable without live data; neither test depends on the other.
8. **Progressive enhancement belongs at the panel level, not the framework level.** The silicon panel's SVG-unavailable fallback is one rendering branch in one file, not a global framework setting. This keeps the cost of the fallback proportional to the panel, and makes each panel's degradation story legible in isolation.
9. **Tag commit ranges tell honest stories only if the tag lines up with the phase set.** The v1.18 tag contains the seven v1.18 phases plus the tail of v1.17, plus a major terminology refactor, plus a merge-forward. Future releases should prefer tagging terminology refactors and merges separately; when a release-note reader sees a file count, that count should correspond to the release-note subject.
10. **Shape indicators that mirror SVG shapes let the same legend read across surfaces.** The activity feed uses unicode shape characters that map one-to-one to the SVG shapes in the topology view. A user who learns the legend once reads both places. This is a small discipline with a big legibility return.
11. **Click-to-detail belongs on every node-rendered surface.** Topology nodes that open a side panel bound to the node's identifier give the user a uniform way to drill from glance to specifics. The pattern generalizes: any visual element that represents a distinct entity should be clickable to its detail, and the detail view should be the same component the system already uses.
12. **Red-green TDD with separate test and feat commits makes archaeology easy.** `test(142-01)` then `feat(142-01)` across fifteen plans produces a commit log a reader can replay a plan at a time. This is the discipline the v1.15 release notes also emphasize; v1.18 upholds it with no erosion.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.10](../v1.10/) | Security Hardening — Zod-schema-at-the-boundary discipline that v1.18's design-system tokens and entity-shape parser inherit |
| [v1.12](../v1.12/) | GSD Planning Docs Dashboard — the static dashboard body v1.18's visual grammar paints on |
| [v1.13](../v1.13/) | Session Lifecycle & Workflow Coprocessor — the session data the gantry surfaces as glance-level status |
| [v1.14](../v1.14/) | Promotion Pipeline — the forward-motion surface the activity feed chronicles |
| [v1.15](../v1.15/) | Live Dashboard Terminal — the embedded Wetty terminal that the activity-feed tab toggle groups with in the same pane |
| [v1.16](../v1.16/) | Dashboard Console & Milestone Ingestion — the interactive surface whose console-page renderer consumes the v1.18 design-system tokens |
| [v1.17](../v1.17/) | Staging Layer — the immediate predecessor whose queue panel becomes a first consumer of the v1.18 shape-plus-color encoding |
| [v1.19](../v1.19/) | Budget Display Overhaul — immediate successor, extends `src/dashboard/budget-gauge.ts` into a full dual-view dashboard component |
| [v1.20](../v1.20/) | Dashboard Assembly — unifies the v1.18 tokens into a single CSS pipeline across every panel |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — the Tauri shell that ports the v1.18 browser-based visual grammar into native webviews |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG that the topology view's collapse threshold is sized to render |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — first release whose agent count exceeds the 8-cell gantry cap; exercises the overflow indicator |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — 31-agent configuration that forces the gantry-scaling follow-up |
| [v1.39](../v1.39/) | GSD-OS Bootstrap & READY Prompt — the 7-service launcher whose dashboard surface inherits v1.18's three-speed layering |
| `src/dashboard/` | Full visual-grammar subsystem — design-system, gantry, entity shapes/legend, topology (renderer + data + integration), activity feed, tab toggle, budget gauge, silicon panel |
| `src/identifiers/` | Domain-prefixed identifier subsystem — types, generator, compat, metadata, index |
| `.planning/MILESTONES.md` | Canonical phase-by-phase detail for phases 142–148 |

## Engine Position

v1.18 sits in the v1.12 → v1.21 "dashboard becomes a workstation" arc. v1.12 shipped the dashboard body; v1.13 gave it a pulse; v1.14 gave it forward motion; v1.15 gave it hands (the embedded Wetty terminal); v1.16 gave it a voice (the console); v1.17 gave it a staging lane; v1.18 gives it a language. v1.19 extends the budget gauge into a full dual-view component, v1.20 unifies every panel under one CSS pipeline, v1.21 ports the whole surface into a native Tauri desktop shell. Every piece of v1.18 remains load-bearing through the v1.49 line: the six domain colors, the four signal colors, the six entity shapes, the three-speed layering, the 8-cell gantry cap (until scaling re-opens in v1.27/v1.33), the 12-node topology collapse, the domain-prefixed identifier scheme. The "accessibility by architecture" framing (shape *and* color, never only one) becomes the default approach every later visual-system release inherits without re-arguing. The data-vs-view split (`gantry-data` vs `gantry-panel`) that v1.18 normalizes is the same pattern v1.20's unified CSS pipeline depends on, and the same pattern the Tauri webviews in v1.21 consume on the other side of the IPC boundary.

## Files

- `src/dashboard/design-system.ts` + `design-system.test.ts` — CSS tokens, palette, typography, spacing grid, status states (Phase 142)
- `src/dashboard/gantry-panel.ts` + `gantry-panel.test.ts` — persistent status strip renderer with 8-cell overflow (Phase 143)
- `src/dashboard/gantry-data.ts` + `gantry-data.test.ts` — pure data collector split from the renderer (Phase 143)
- `src/dashboard/entity-shapes.ts` + `entity-shapes.test.ts` — 6 SVG shapes bound to domain types (Phase 144)
- `src/dashboard/entity-legend.ts` + `entity-legend.test.ts` — collapsible legend panel (Phase 144)
- `src/dashboard/topology-renderer.ts` + `topology-renderer.test.ts` — SVG subway-map with bezier edges and animated pulses (Phase 145)
- `src/dashboard/topology-data.ts` + `topology-data.test.ts` — layout + 12-node collapse threshold (Phase 145)
- `src/dashboard/topology-integration.ts` + `topology-integration.test.ts` — generator wiring + click-to-detail side panel (Phase 145)
- `src/dashboard/activity-feed.ts` + `activity-feed.test.ts` — unicode shape indicators, domain color coding, 8-entry window (Phase 146)
- `src/dashboard/activity-tab-toggle.ts` + `activity-tab-toggle.test.ts` — activity/terminal tab group (Phase 146)
- `src/dashboard/budget-gauge.ts` + `budget-gauge.test.ts` — stacked bar with green/yellow/red threshold transitions (Phase 147)
- `src/dashboard/silicon-panel.ts` + `silicon-panel.test.ts` — diamond adapters, VRAM gauge, SVG-unavailable progressive enhancement (Phase 147)
- `src/identifiers/types.ts` + `src/identifiers/generator.ts` + `generator.test.ts` — F-1 / B-1.api / T-1:rcp scheme (Phase 148)
- `src/identifiers/compat.ts` + `compat.test.ts` — backward compatibility with bare integer IDs (Phase 148)
- `src/identifiers/metadata.ts` + `metadata.test.ts` — SKILL.md metadata encoding (Phase 148)
- `src/identifiers/index.ts` — barrel exports for the identifier subsystem
- `src/agents/agent-suggestion-manager.ts`, `src/detection/suggestion-manager.ts`, `src/detection/skill-generator.ts`, `src/detection/suggestion-store.ts` — domain-prefixed ID integration (Phase 148-01)
- `src/dashboard/generator.ts` — pipeline wiring that composes every v1.18 panel into the generated dashboard
- `.planning/MILESTONES.md` — canonical phase-by-phase detail for phases 142–148 (15 plans, 53 requirements)

---

## Version History (preserved from original release notes)

The v1.18 tag was part of the v1.x line extending the v1.0 adaptive-learning loop. The table below was preserved from the original release notes for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.18** | Information Design System — shape+color encoding, status gantry, topology views, three-speed layering (this release) |
| **v1.17** | Staging Layer |
| **v1.16** | Dashboard Console & Milestone Ingestion |
| **v1.15** | Live Dashboard Terminal |
| **v1.14** | Promotion Pipeline |
| **v1.13** | Session Lifecycle & Workflow Coprocessor |
| **v1.12.1** | Live Metrics Dashboard |
| **v1.12** | GSD Planning Docs Dashboard |
| **v1.11** | GSD Integration Layer |
| **v1.10** | Security Hardening |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration |
| **v1.8.1** | Audit Remediation (Patch) |
| **v1.8** | Capability-Aware Planning + Token Efficiency |
| **v1.7** | GSD Master Orchestration Agent |
| **v1.6** | Cross-Domain Examples |
| **v1.5** | Pattern Discovery |
| **v1.4** | Agent Teams |
| **v1.3** | Documentation Overhaul |
| **v1.2** | Test Infrastructure |
| **v1.1** | Semantic Conflict Detection |
| **v1.0** | Core Skill Management |
