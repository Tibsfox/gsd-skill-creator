# v1.12.1 — Live Metrics Dashboard

**Released:** 2026-02-12
**Scope:** real-time visibility into GSD session activity, phase velocity, planning quality, and historical trends — each metric sampled at the rate that matches its natural update frequency
**Branch:** dev → main
**Predecessor:** v1.12 — GSD Planning Docs Dashboard
**Successor:** v1.13 — Session Lifecycle & Workflow Coprocessor
**Classification:** feature release — live telemetry layer on the v1.12 dashboard substrate
**Phases:** 94–100 (7 phases) · **Plans:** 14 · **Requirements:** 30
**Stats:** 221 new metric tests · 460 total dashboard tests · 37 test files
**Engine Position:** the first live surface over the v1.12 `file://` page substrate; the three-tier sample-rate engine becomes the reference pattern for every later live telemetry module
**Verification:** per-section JavaScript refresh with independent polling rates · graceful degradation on every missing data source · CSS-only visualizations keep the zero-dependency constraint intact

## Summary

**Three-tier sample-rate engine.** v1.12.1 is the first release where the v1.12 dashboard becomes live, and the architectural decision that defines it is tiering refresh by metric volatility. The predecessor shipped a static HTML generator with a blanket auto-refresh script — poll the whole document every three seconds and let the browser swap scroll state. That design treats every piece of data identically: the session heartbeat, the phase velocity timeline, and the historical milestone table all get redrawn at the same cadence. v1.12.1 rejects that uniformity. Hot-tier data (live session pulse, active metrics) refreshes at 1–2 seconds, warm-tier data (phase velocity, planning quality) refreshes at 5–10 seconds, and cold-tier data (historical trends, milestone comparisons) refreshes only on change. Per-section JavaScript refresh with independent polling rates means the browser does exactly the work the data deserves and no more. That single decision — tiering refresh by metric volatility — propagates through every module and every test in the release.

**Typed collectors separate data from presentation.** This is the refactor that makes the three-tier engine tractable. The v1.12 dashboard's page modules mixed data access and HTML rendering; each page function read `.planning/` artifacts and emitted markup in one pass. That shape is fine for static generation but hostile to live refresh, where the browser needs to ask the generator for fresh data without re-rendering a whole page. v1.12.1 splits the pipeline. Collectors produce structured data — git metrics, session observations, planning artifacts — as typed objects. Renderers consume those objects and produce HTML. The same collector output can feed a static page, a live-refresh partial, or a future export format. This is the same discipline as the v1.0 `.claude/skills/` schema contract: define the data shape once, let every consumer bind to it, and you never have to invent a second representation when the surface expands.

**Live session pulse is the hot-tier affordance.** It is what makes the dashboard feel alive. An active session card shows a ticking duration counter and a heartbeat indicator; the commit feed lists recent commits as they land; message queue counters track pending and done work. These are the signals a working operator glances at to verify the session is still executing — the equivalent of the terminal cursor blink in a long-running process, generalized to the GSD workflow. The hot tier exists because these signals lose their meaning at slower cadences: a session heartbeat that only updates every ten seconds does not tell you whether the session is alive, it tells you whether the session was alive ten seconds ago. The 1–2 second cadence is not a performance budget, it is a semantic requirement. Polling slower would change what the card means.

**TDD rhythm analysis is the diagnostic most dashboards never attempt.** The warm tier renders a timeline visualization of phase progression, a per-phase stats table listing duration, commits, and status, and — uniquely — RED/GREEN cycle detection across the commit history. Most dashboards show commits over time as an undifferentiated count. v1.12.1 asks whether the commits follow the test-first rhythm the plan specified: does a failing-test commit precede the implementation commit for each plan unit, and how often does that pattern hold across the phase? When the rhythm is present, the phase is being executed in the manner it was planned; when the rhythm is absent, the phase is being executed ad-hoc regardless of what the PLAN.md said. This is process telemetry, not product telemetry. The v1.12 dashboard could tell you what shipped; v1.12.1 can tell you how it shipped.

**Planning quality becomes measurable for the first time.** The warm tier renders accuracy scores (plan versus actual), an emergent work ratio, deviation summaries, and an accuracy trend sparkline. Each of these answers a question the project has asked informally for months and never quantified: how often do plans survive contact with execution, how much of the work was foreseen versus invented, what drifted and by how much, is planning accuracy getting better or worse over time? Without these metrics, planning quality is a subjective judgment. With them, it is a measurement — imperfect, noisy, regression-prone, but a measurement. Historical trends live in the cold tier: milestone comparison tables, commit-type distribution charts, velocity curves over time, and file hotspots. These change when milestones close, so the cold tier recomputes only on change and otherwise pays zero polling cost. The three tiers together cover the full volatility spectrum, and the boundary between each tier is the cadence at which the underlying data actually moves.

**CSS-only visualizations keep the release self-contained.** Sparklines, timelines, distribution charts, and gauges all render with pure CSS — no D3, no Chart.js, no runtime library loads. The zero-dependency constraint the parent release established still holds, which means v1.12.1 pages open from `file://` on any browser without a network round trip. That discipline is expensive: CSS-only charts are fiddly to author and brittle under style changes. It is also load-bearing. Every later browser-based tool in the project inherits it: the dashboard console in v1.16 and v1.20, the session lifecycle view in v1.13, the Tauri webview in v1.21. None of them could have emitted library-loaded charts without breaking the constraint the dashboard fleet depends on.

**Graceful degradation for every missing data source is the operational property that makes the dashboard safe to enable early.** A dashboard that crashes when it cannot find `.planning/STATE.md` is unusable on a brand-new project; a dashboard that shows an empty card with a "no data yet" label is usable on day one. v1.12.1 adopts the second behavior universally. Collectors return empty typed results when their source artifact is missing or malformed; renderers detect the empty state and emit a placeholder rather than a rendering error. This is the same forgiveness principle as the v1.0 pattern store's append-only JSONL: the system survives missing inputs by design, not by accident. Operators can turn on the dashboard before the data exists and watch it fill in as artifacts accrue. The constraint also forces the data contract to be explicit — every collector's return type must carry an "empty" shape, which means every consumer has to handle the empty shape, which means no consumer ever hits undefined behavior on a new project.

**221 new metric tests across 460 total dashboard tests show the test suite scaling with feature surface.** v1.12 shipped 239 tests across 11 test files; v1.12.1 nearly doubles that footprint to 460 across 37 files, and the entire increment is dedicated to the new metric surface. Testing is not an afterthought bolted onto shipped code: it is the shipping discipline. Each tier has its own collector tests, renderer tests, and refresh-interval integration tests. The TDD rhythm detector has its own corpus fixture to catch false positives. The planning-accuracy calculation has snapshot tests for known drift cases. The cold-tier on-change behavior has tests that verify no polling occurs when source artifacts are untouched. The test scaling is the evidence that the three-tier engine, the typed-object refactor, and the graceful-degradation contract are all internally verified, not just externally claimed. A feature release that adds eight major modules without adding its tests is a feature release that ships its regressions as a dependency; v1.12.1 does the opposite.

**Scope expansion is the retrospective concern worth naming, and it is real.** Seven phases (94–100), fourteen plans, thirty requirements is a lot of surface for what is functionally an extension layer over v1.12. The three-tier engine, the collector refactor, the four dashboard sections, and the RED/GREEN detector could arguably have been three or four phases under tighter scoping. The work was worth shipping, but the phase count reflects an expansion decision made at plan time rather than a tight bound. Future feature releases of similar shape — telemetry over an existing static surface — should use v1.12.1 as a cautionary data point on phase inflation. The countervailing observation is that the 221-test increment matches the 14-plan count: roughly 15–16 new tests per plan. The phases expanded, but the per-phase verification density held. This is the pattern future releases should preserve even when the plan count tightens.

## Key Features

| Area | What Shipped |
|------|--------------|
| Three-tier sample-rate engine | Hot (1–2s) live pulse, Warm (5–10s) phase velocity + planning quality, Cold (on-change) historical trends; per-section JavaScript refresh with independent polling rates |
| Data collector architecture | Typed objects replace inline HTML; git metrics collector, session observation collector, planning artifact collector; deterministic empty-shape contract |
| Live session pulse (hot) | Active session card with ticking duration counter + heartbeat indicator; recent commit feed; pending/done message queue counters |
| Phase velocity (warm) | Timeline visualization of phase progression; per-phase stats table (duration, commits, status); TDD rhythm analysis detecting RED/GREEN cycles across commit history |
| Planning quality (warm) | Accuracy scores (plan vs actual), emergent work ratio, deviation summaries, accuracy trend sparkline — the first quantitative planning-quality signal in the project |
| Historical trends (cold) | Milestone comparison table, commit-type distribution chart, velocity curves over time, file hotspot list; recomputes only when source artifacts change |
| CSS-only visualizations | Sparklines, timelines, distribution charts, and gauges rendered without D3 / Chart.js; zero runtime dependencies; works from `file://` protocol unchanged |
| Pipeline integration | Full generator → collector → renderer pipeline with a `--live` flag that activates the tiered refresh script |
| Graceful degradation | Every collector returns an empty typed result on missing or malformed source; every renderer handles the empty shape without errors; dashboard usable on day-one projects |
| Test surface | 221 new metric tests across a total of 460 dashboard tests in 37 test files — roughly 15–16 new tests per new plan |
| CLI surface | `--live` flag on the dashboard generate command activates the tiered refresh script; existing `watch` / `clean` subcommands inherit live-mode behavior |
| Forward compatibility | Typed collector outputs reusable by later exporters and consumers (v1.15 terminal, v1.16 console, v1.20 dashboard assembly) |

## Retrospective

### What Worked

- **The three-tier sample-rate engine matches refresh cadence to data volatility.** Hot (1–2s) for the live pulse, warm (5–10s) for velocity and quality metrics, cold (on-change) for historical trends. Polling everything at the same rate wastes resources and creates false activity; tiered sampling is the semantically correct design.
- **CSS-only visualizations continue the `file://` protocol discipline from v1.12.** Sparklines, timelines, and distribution charts rendered in pure CSS keep the zero-dependency constraint intact and let the same pages open unchanged in the Tauri webview that lands in v1.21.
- **TDD rhythm analysis (RED/GREEN cycle detection) in the phase velocity metrics provides unique diagnostic value.** Most dashboards show commits over time; this one detects whether the development process follows the planned test-first pattern, turning a product metric into a process metric.
- **460 total dashboard tests across 37 test files (221 new) show the test suite scaling with features.** The ratio of roughly 15–16 new tests per new plan signals that verification density held even as the feature surface expanded across seven phases.
- **Typed object architecture for collectors decouples data from presentation.** The same collector output feeds static pages, live-refresh partials, and future export formats. v1.12 mixed these concerns inside page modules; v1.12.1 separates them and every subsequent dashboard-adjacent feature inherits the cleaner boundary.
- **Graceful degradation makes the dashboard usable on day-one projects.** Every collector returns an empty typed result for missing or malformed source; every renderer handles the empty shape. Projects just starting do not crash the dashboard, they see sections fill in as data accrues.

### What Could Be Better

- **Per-section JavaScript refresh with independent polling rates adds browser-runtime complexity.** Multiple independent timers polling different data sources at different rates can cause visual jitter under load and introduce race conditions against concurrent DOM updates. v1.12's single-loop refresh was simpler; the three-tier engine is more correct but harder to reason about at the browser level.
- **Seven phases (94–100) for what is functionally a metrics extension to v1.12 suggests scope expansion.** The three-tier engine, collector refactor, four dashboard sections, and RED/GREEN detector could arguably have been three or four phases under tighter bounds. The work shipped, but the phase count reflects plan-time expansion rather than a tight scope.
- **The cold-tier on-change detection depends on filesystem or manifest diffing to decide when to recompute.** Under `file://` there is no server to subscribe to change events, so the client still polls something — the cheaper manifest — to detect change. This is better than recomputing historical trends on every tick, but it is not the push-based "truly on change" the name implies.
- **Planning quality metrics are only as good as the planning artifacts they read.** Projects with sparse `.planning/` write-through or inconsistent PLAN.md formatting will see degraded accuracy scores not because planning is poor but because the source signal is noisy. The metric is honest about this only via its graceful-degradation empty states, not via an explicit calibration surface.
- **TDD rhythm detection has no tunable threshold.** The RED/GREEN cycle detector uses a heuristic on commit subjects and sequence; projects with commit styles that do not follow the expected patterns can read as "low rhythm" even when tests are being written first. A follow-up release could expose the heuristic as a config surface.

## Lessons Learned

- **Refresh cadence should track data volatility, not engineering convenience.** The three-tier engine works because 1–2s, 5–10s, and on-change correspond to real differences in how fast the underlying data moves. A uniform polling rate is always wrong for at least two of the three tiers — either polling too fast on stable data or too slow on fast data. Matching cadence to volatility is the pattern future telemetry releases should inherit.
- **Typed object architecture separates data from presentation, and the separation pays off when the surface expands.** Collectors produce structured data; renderers consume it. This lets the same collector feed multiple views or export formats without any collector rewriting. The v1.12 page modules mixed data and rendering in one pass; v1.12.1's split means v1.15, v1.16, and v1.20 can reuse the collector outputs unchanged.
- **Planning quality metrics make the planning process itself measurable.** Without them, planning quality is a subjective assessment. With them, you can track whether plans are getting more accurate over time — and you can name specific regressions when they happen instead of arguing about vibes.
- **Graceful degradation for every missing data source prevents dashboard crashes on new projects.** A dashboard that requires every source to exist is unusable on a project that just started. Missing data becomes empty sections, not runtime errors. The cost is a mandatory empty-shape contract on every collector; the benefit is day-one usability.
- **CSS-only visualizations are worth their authoring cost because they preserve the zero-dependency constraint.** Sparklines and timelines written in pure CSS are fiddlier than Chart.js equivalents, but they keep the `file://` invariant the v1.12 dashboard family is built around. Every release that broke the zero-dependency rule would have forced every later tool to carry a runtime bundle; v1.12.1 did not pay that cost.
- **TDD rhythm as a detectable signal turns process into product telemetry.** Detecting RED/GREEN commit cycles tells you whether work was done the way it was planned, not just what shipped. This is a harder question than "what did we ship" and a more honest one than "did tests pass." Ship process metrics when the process itself has a signature.
- **Phase count is a scope signal worth reading at retrospective time.** Seven phases for an extension layer is a lot. The work was valuable, but the phase count reflects plan-time expansion that future similar releases should tighten. A retrospective that names phase inflation explicitly makes the next plan shape it intentionally.
- **Tiered refresh means tiered testing.** Each tier has its own collectors, renderers, and refresh-interval contracts, and each tier needs its own tests. 221 new metric tests across 37 files is not overbuilding — it is the surface area the three-tier engine creates being verified at the right granularity. Under-testing any one tier would have landed a regression in a specific cadence band the others could not catch.
- **Empty-shape contracts are a collector-level discipline, not a renderer-level fallback.** If a collector can return undefined or null, every consumer has to guard against it in its own code. If the collector is required to return a typed empty result, the guard moves upstream once and applies everywhere. v1.12.1 put the contract at the collector; the renderer code is simpler as a result.
- **Live surfaces should be opt-in with a flag.** `--live` is not the default. A dashboard opened for a one-shot look should not poll indefinitely; the polling cost, however small, is wrong when nobody is watching. The flag pattern matches v1.12's own `--live` discipline and extends it cleanly.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | The 6-step adaptive loop; the planning-quality metrics in v1.12.1 are the first quantitative view onto the Observe → Learn portion of the loop |
| [v1.5](../v1.5/) | Pattern Discovery — the session observation collector reads patterns produced by the v1.5 pipeline |
| [v1.7](../v1.7/) | GSD Master Orchestration Agent — the live session pulse reflects state the v1.7 agent drives |
| [v1.8](../v1.8/) | Capability-Aware Planning — the phase velocity timeline renders the capability-aware roadmap shape |
| [v1.10](../v1.10/) | Security Hardening — collectors read planning state hardened by v1.10 guards (safe YAML, path validation) |
| [v1.11](../v1.11/) | GSD Integration Layer — the slash-command integration inherited from v1.12 remains in force |
| [v1.12](../v1.12/) | Predecessor — GSD Planning Docs Dashboard; v1.12.1 extends the same `file://` page substrate with live telemetry |
| [v1.13](../v1.13/) | Successor — Session Lifecycle & Workflow Coprocessor; reuses the collector outputs for session-visible state |
| [v1.15](../v1.15/) | Live Dashboard Terminal — further live-surface extension over the v1.12 page contract |
| [v1.16](../v1.16/) | Dashboard Console & Milestone Ingestion — the console backbone consumes v1.12.1 collector outputs |
| [v1.17](../v1.17/) | Staging Layer — staging data rendered through the same typed-collector pipeline |
| [v1.18](../v1.18/) | Information Design System — unifies the CSS vocabulary v1.12 seeded and v1.12.1 extended |
| [v1.19](../v1.19/) | Budget Display Overhaul — gauges rendered over the v1.12.1 CSS-only visualization pattern |
| [v1.20](../v1.20/) | Dashboard Assembly — unified CSS pipeline built on the v1.12 + v1.12.1 page contract |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri webview hosting the same `file://`-compatible pages v1.12.1 emits |
| `docs/release-notes/v1.12.1/chapter/` | Per-chapter detail: summary, retrospective, lessons, and context mirrors |
| `.planning/MILESTONES.md` | Canonical v1.12.1 phase-by-phase detail (phases 94–100, 14 plans, 30 requirements) |

## Cumulative Statistics

| Metric | v1.12 | v1.12.1 | Delta |
|--------|-------|---------|-------|
| Dashboard test files | 11 | 37 | +26 |
| Dashboard tests | 239 | 460 | +221 |
| Branch coverage target | 80% | 80% (maintained) | 0 |
| Phases in release | 6 (88–93) | 7 (94–100) | +1 |
| Plans in release | 7 | 14 | +7 |
| Requirements in release | 30 | 30 | 0 |
| Refresh tiers | 1 (uniform 3s) | 3 (hot/warm/cold) | +2 |
| Dashboard sections | 5 static pages | 5 static + 4 live | +4 live |

## Engine Position

v1.12.1 is the first live surface in the project, and it lands directly on the v1.12 static dashboard substrate without replacing any of it. Every invariant the predecessor established — works from `file://`, one-way generation from `.planning/`, per-page content-hashed incremental builds — still holds. What v1.12.1 adds is a cadence dimension. The static pages v1.12 emits remain valid; the `--live` flag layers the three-tier refresh engine on top, and operators who do not pass the flag get exactly the v1.12 experience. This is additive evolution, not replacement. The typed-collector refactor becomes load-bearing immediately: v1.13's session-lifecycle view, v1.15's live dashboard terminal, v1.16's dashboard console, v1.17's staging layer, and v1.20's unified CSS assembly all read collector outputs that v1.12.1 defined. The release also introduces the pattern of tiered refresh by data volatility, which reappears in every later live telemetry module the project ships. By the time v1.21's Tauri-hosted workbench lands, the hot/warm/cold tier vocabulary is vocabulary the whole dashboard family speaks. v1.12.1 is small by naming convention (a point release) and substantial by engine impact (the first live surface, the typed-collector contract, the three-tier engine, the TDD rhythm detector, and the planning-quality metric family all shipped here).

## Files

- `src/dashboard/collectors/` — typed object collectors for git metrics, session observations, and planning artifacts; empty-shape contract enforced per collector
- `src/dashboard/tiers/` — three-tier refresh engine: hot (1–2s), warm (5–10s), cold (on-change) with per-section polling rates
- `src/dashboard/refresh.ts` — live-mode refresh script extended for per-section independent polling (evolves the v1.12 84-line baseline)
- `src/dashboard/pages/pulse.ts` — live session pulse renderer: duration counter, heartbeat indicator, commit feed, message queue counters
- `src/dashboard/pages/velocity.ts` — phase velocity renderer: timeline, per-phase stats table, TDD rhythm analysis
- `src/dashboard/pages/quality.ts` — planning quality renderer: accuracy scores, emergent work ratio, deviation summaries, accuracy trend sparkline
- `src/dashboard/pages/trends.ts` — historical trends renderer: milestone comparison, commit-type distribution, velocity curves, file hotspots
- `src/dashboard/visualizations/` — CSS-only sparklines, timelines, distribution charts, gauges; zero runtime dependencies
- `src/dashboard/tdd-rhythm.ts` — RED/GREEN cycle detector reading commit subjects and sequence
- `src/dashboard/metric-tests/` — 221 new metric tests spanning the four dashboard sections and the three refresh tiers
- `src/cli/commands/dashboard.ts` — CLI `--live` flag activation of the tiered refresh engine (inherits v1.12's base subcommands)
- `.planning/milestones/` — v1.12.1 requirements + roadmap artifacts used by the collectors as source of truth
- `docs/release-notes/v1.12.1/chapter/` — parsed summary, retrospective, lessons, and context mirrors for the release

---

**Prev:** [v1.12](../v1.12/) · **Next:** [v1.13](../v1.13/)
