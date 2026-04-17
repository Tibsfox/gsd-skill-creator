# v1.12 — GSD Planning Docs Dashboard

**Released:** 2026-02-12
**Scope:** static HTML dashboard generator that mirrors `.planning/` artifacts into browsable, machine-readable pages — hot during sessions, static at rest
**Branch:** dev → main
**Tag:** v1.12 (2026-02-12T09:48:39-08:00) — "GSD Planning Docs Dashboard"
**Predecessor:** v1.11 — GSD Integration Layer
**Successor:** v1.12.1 — Live Metrics Dashboard
**Classification:** feature release — read-only derived view of planning state
**Phases:** 88–93 (6 phases) · **Plans:** 7 · **Requirements:** 30
**Stats:** 5 commits in the uplift range (ab3e7fb6e..da4d892d0) · 17 files changed · 1,418 insertions · 21 deletions · 239 tests · 81.34% branch coverage
**Verification:** integration test writes fixture `.planning/`, generates, validates DOCTYPE + nav + title + charset + viewport on all 5 pages · per-page SHA-256 hash entries in build manifest · navigation links validated against page filenames

## Summary

**v1.12 is the first browser-native view of `.planning/` state, and it ships as a `file://` document by design.** The dashboard has no server, no CDN, no build step for viewing, and no runtime dependencies beyond whatever browser the user already has open. The generator reads `.planning/` markdown artifacts — PROJECT, REQUIREMENTS, ROADMAP, STATE, MILESTONES — and writes static HTML with embedded CSS into an output directory the user opens directly with `open index.html` or a local `file://` URL. That single constraint propagates through every design choice: JSON-LD is inline, Open Graph meta tags are inline, the dark-theme stylesheet is inline, the refresh script is inline, the navigation is relative links between sibling files. The constraint also becomes a pattern. Every browser-based tool that follows — the live metrics dashboard in v1.12.1, the dashboard console in v1.20, the Tauri-hosted workbench in v1.21 — inherits the "works from `file://`" invariant from this release.

**The release is a six-phase span (88–93) with seven plans and thirty requirements.** The last five commits before the v1.12 tag tell the story compactly: `ab3e7fb6e` added failing tests for incremental builds and auto-refresh; `d61ca517f` implemented the feature behind those tests including SHA-256 content hashing, manifest loading and saving, needsRegeneration checks, and the refresh script with scroll preservation and a visual refresh indicator; `d85b6b27d` added the slash command at `project-claude/commands/gsd-dashboard.md` and the `clean` subcommand that removes generated HTML and the manifest; `810c8090e` added a 308-line integration test that writes fixture planning files, runs the generator, and validates HTML structure plus content assertions plus per-page hash entries; `da4d892d0` backfilled branch coverage across the page modules (state, roadmap, milestones, requirements), the parser, and the generator to reach the 81% branch target that was the phase 93 gate. The tag message records 15 commits total for the release; the uplift pipeline ran against the last 5 in the range `v1.12~5..v1.12` because those were the shipping commits, the rest were upstream phase work (88–91) preserved by the earlier plan artifacts.

**Incremental builds make the dashboard feel instant even as `.planning/` grows.** The mechanism is a content-addressed rebuild: for each source file the generator computes a SHA-256, compares it against the previous value stored in `.dashboard-manifest.json`, and skips page regeneration when the hash matches. The 112-line `src/dashboard/incremental.ts` holds the primitives — `computeHash`, `loadManifest`, `saveManifest`, `needsRegeneration` — and the generator wires them into each page build. The CLI reports regenerated versus skipped pages so the operator can see the work that was avoided. This is a standard Make-style content-hash pattern, but landed in a dashboard context it means sessions where nothing changed in `.planning/` are effectively no-ops; only the pages whose source files actually moved get rewritten. The pattern carries forward into every later tool that mirrors planning state.

**Auto-refresh with scroll preservation via sessionStorage is the live-mode affordance.** The refresh script — 84 lines in `src/dashboard/refresh.ts`, injected inline when `--live` is passed — polls for document changes at a configurable interval (default three seconds), saves the current scroll position to `sessionStorage` before reload, and restores it afterward. A small visual indicator confirms a refresh happened without stealing focus. This is not websockets, not server-sent events, not a file-watch bridge; it is a vanilla `setTimeout` loop that reads local state and swaps the document. The scope matches the constraint: if the dashboard has to work from `file://`, the refresh loop has to work from `file://` too, which means no server-sent channel is available. What sessionStorage provides is exactly the minimum — the page feels live inside a session but does not carry state across browser restarts. For the dashboard's actual job (reflect planning state during a working session) this is correct.

**JSON-LD and Open Graph meta tags on planning documents are forward-thinking and cheap.** Every page emits `Schema.org` `SoftwareSourceCode` and `ItemList` structured data inline, plus `og:title`, `og:description`, `og:type` tags in the head. There is no public website at v1.12; no search engine will ever see these pages; no social-media card preview will render them. The motivation is not SEO at ship time, it is forward-compatibility: when the project eventually exports any of this state to a public surface, the structured data is already there, correctly typed, attached to the right pages. Cost at shipping: roughly one function in each page module. Cost at any future port: zero. The v1.12 bet is that emitting structured metadata as a habit is cheaper than retrofitting it across a fleet of already-shipped pages.

**The slash command `/gsd-dashboard` closes the loop between GSD workflows and the dashboard.** The 105-line command file at `project-claude/commands/gsd-dashboard.md` documents the three subcommands — `generate`, `watch`, `clean` — and describes the phase-transition auto-trigger configuration. The CLI at `src/cli/commands/dashboard.ts` registers the subcommands, wires the `--live`, `--watch`, `--refresh-interval`, and `--watch-interval` flags, and provides the `clean` subcommand that removes generated HTML plus the manifest so a next run starts from zero. The auto-trigger hook — enabled via integration config — regenerates the dashboard on phase transitions so the page an operator has open reflects the latest roadmap move without a manual refresh of the `.planning/` reader. Even without the slash command, the CLI is standalone and scriptable.

**The 239-test, 81% branch coverage result reflects a deliberate quality gate, not a happy accident.** Phase 93 set 80% as the minimum branch coverage target; `da4d892d0` is the commit that dragged coverage from below 80 to 81.34 by filling in the edge paths: partial-field state pages, blocked and shipped and done and executing roadmap statuses, milestones with no stats, requirements with no goal, parser with no totals footer, empty accomplishments. The integration test (`810c8090e`) complements unit coverage with a full-pipeline walk: write fixtures into a temp `.planning/`, run the generator, assert DOCTYPE, nav, title, charset, and viewport on each of the five pages, verify that navigation links resolve to valid page filenames, check content-specific assertions (project name, REQ-IDs, phases, milestones), and confirm the build manifest contains per-page hash entries. The integration test adds 308 lines on its own — roughly 20% of the entire uplift-range diff — which signals the weight the release places on pipeline-level verification, not just unit-level.

**The `.planning/` separation is the architectural contribution.** Planning files remain the source of truth. The dashboard is a derived view, generated by a one-way pipeline, written to an output directory the operator can delete and regenerate at will. The dashboard never writes back into `.planning/`; its only filesystem side effects are the HTML output and the build manifest next to it. That one-way coupling means the dashboard cannot corrupt planning state through a bug, cannot race with planning edits through concurrent writes, and cannot accumulate drift against the canonical artifacts. Every subsequent dashboard-adjacent feature — the live metrics in v1.12.1, the dashboard console in v1.20, the topology and staging collectors — inherits this one-way direction. It is the dashboard pattern's load-bearing invariant.

## Key Features

| Area | What Shipped |
|------|--------------|
| Generator core | Markdown parser reads `.planning/` PROJECT, REQUIREMENTS, ROADMAP, STATE, MILESTONES (`src/dashboard/generator.ts`, `src/dashboard/index.ts`) |
| Renderer | HTML renderer with embedded dark-theme CSS, semantic HTML5, no external dependencies, works from `file://` protocol |
| Dashboard pages | Index (aggregated health + build log), Requirements (REQ-ID badges + cross-nav), Roadmap (pending/active/complete), Milestones (expandable timeline), State (position + blockers) |
| Incremental builds | SHA-256 content hashing, `.dashboard-manifest.json` build manifest, `computeHash` / `loadManifest` / `saveManifest` / `needsRegeneration` primitives (`src/dashboard/incremental.ts`, 112 lines) |
| Live mode | Auto-refresh script with scroll preservation via sessionStorage, visual refresh indicator, configurable interval (default 3s) (`src/dashboard/refresh.ts`, 84 lines) |
| Structured data | JSON-LD (Schema.org `SoftwareSourceCode`, `ItemList`) + Open Graph meta tags (`og:title`, `og:description`, `og:type`) on every page |
| CLI surface | `skill-creator dashboard` command with `generate` / `watch` / `clean` subcommands; flags `--live`, `--watch`, `--refresh-interval`, `--watch-interval` (`src/cli/commands/dashboard.ts`) |
| GSD integration | `/gsd-dashboard` slash command (`project-claude/commands/gsd-dashboard.md`, 105 lines); phase-transition auto-trigger when integration config enables it; manifest + install.cjs registration |
| Integration test | Full-pipeline fixture test validates DOCTYPE, nav, title, charset, viewport on all 5 pages; link resolution; content assertions; build manifest hash entries (`src/dashboard/integration.test.ts`, 308 lines, 45 assertions) |
| Branch coverage backfill | Dedicated coverage commit (`da4d892d0`) for state/roadmap/milestones/requirements page edge cases, parser edge cases, generator live-mode + incremental branches |
| Clean subcommand | Removes all generated HTML plus `.dashboard-manifest.json` so next run starts from zero |
| Test totals | 239 tests across 11 test files · 81.34% branch coverage (≥ 80% phase 93 requirement met) |

## Retrospective

### What Worked

- **Static HTML with embedded CSS and no external dependencies works from `file://` protocol.** No server needed, no CDN, no build step for viewing. This constraint ensures the dashboard works anywhere and becomes the pattern every later browser-based tool inherits.
- **JSON-LD and Open Graph meta tags on planning documents is forward-thinking.** Schema.org `SoftwareSourceCode` and `ItemList` metadata makes the project machine-readable before there is a public website to serve it from. The marginal cost at ship time is roughly one function per page; the saved cost at any future port is significant.
- **Incremental builds via SHA-256 content hashing avoid regenerating unchanged pages.** The `.dashboard-manifest.json` manifest tracks what needs rebuilding, keeping generation fast as pages grow. Sessions where `.planning/` did not move produce effectively no work.
- **Test-first discipline on the new incremental and refresh modules.** Commit `ab3e7fb6e` landed the failing tests before `d61ca517f` implemented the feature — a clean red-green sequence at the commit level, verifiable in git history.
- **A 308-line integration test for a 1,418-line release.** Roughly 20% of the uplift-range diff is a full-pipeline test that writes fixtures, generates, and validates structure plus content plus manifest. The weight matches the intent: the generator is a pipeline, so pipeline-level verification is the correct gate.
- **Separating source of truth (`.planning/`) from derived view (HTML output).** One-way generation means the dashboard can never corrupt planning data through a bug. Every later dashboard-adjacent feature inherits this invariant.

### What Could Be Better

- **Auto-refresh with a 3-second default could be expensive for large `.planning/` directories.** Polling every three seconds recalculates hashes even when nothing has changed. File-system watch events would be more efficient but harder to implement portably under the `file://` constraint. Users with deep planning trees should raise the interval.
- **239 tests at 81% branch coverage leaves 19% uncovered.** For a dashboard that renders HTML from planning artifacts, the uncovered branches likely include edge cases in markdown parsing that could produce broken output. The 80% gate was met; the remaining 19% is residual risk.
- **Dark theme only; no light theme or high-contrast option.** A single visual identity was the right v1.12 decision for cohesion but it underserves users who prefer or require lighter palettes. Accessibility review deferred to a later release.
- **No feed, no diff view, no history.** The dashboard reflects current state; it does not show "what changed since yesterday" or "which plan transitioned today". That is the job of v1.12.1 Live Metrics Dashboard and v1.15 Live Dashboard Terminal, but the absence is a v1.12 gap worth naming.
- **`file://` constraint rules out some nice-to-haves.** No websockets means no push updates; no CORS-permitted fetch means no external JSON feeds; no server means no search API. The constraint buys portability but closes doors that a server-hosted variant would have open.

## Lessons Learned

1. **The `file://` protocol constraint forces good architecture.** No runtime dependencies, no CORS, no server — just HTML/CSS/JS that opens in any browser. This becomes the foundation for all subsequent browser-based tools in the project (v1.12.1, v1.15, v1.20, v1.21).
2. **Mirroring `.planning/` artifacts into browsable HTML creates a read-only view of project state.** The planning files remain the source of truth; the dashboard is a derived view. This separation means the dashboard can never corrupt planning data, can never race with planning edits, and can always be regenerated from scratch.
3. **Dark theme with consistent layout across all pages establishes a visual identity early.** The dashboard pages look like they belong together, which matters when they are extended in v1.12.1, v1.15, and beyond. Consistency is cheaper to ship than to retrofit.
4. **Incremental builds should be hash-based, not timestamp-based.** Timestamps lie when files are touched without content changes (editor saves, git checkouts, backups). SHA-256 over the source file is a small cost per build and a correct signal every time.
5. **Forward-compatible metadata is cheap at ship time and expensive to retrofit.** JSON-LD and Open Graph tags cost one function per page at v1.12. Adding them across an already-shipped fleet of pages later would have cost a coordinated sweep. The rule generalizes: emit structured metadata as a habit.
6. **Test before feature, verified at commit boundary.** The incremental-builds and refresh work landed as a failing-test commit (`ab3e7fb6e`) followed by a green commit (`d61ca517f`). The git log itself documents the red-green rhythm; future audits can verify it without re-reading the prose.
7. **Integration tests earn their seats when the deliverable is a pipeline.** A generator that reads markdown, renders HTML, and writes a manifest is a pipeline by definition. A 308-line integration test that walks the full pipeline with fixtures catches integration bugs that unit tests miss by construction.
8. **Coverage gates are useful when they are specific.** "80% branch coverage on the dashboard module" is auditable; "high quality tests" is not. Commit `da4d892d0`'s only job was dragging coverage from below 80 to 81.34 by filling named branch categories, and it succeeded because the target was a number.
9. **Slash commands are the right binding between GSD workflows and adjacent tools.** A `/gsd-dashboard` command with `generate` / `watch` / `clean` subcommands fits how the project is used: workflow-triggered, named by purpose, discoverable in the GSD command surface.
10. **One-way coupling is the dashboard pattern's load-bearing invariant.** Source of truth on one side, derived view on the other, generation pipeline as the only connecting wire. Every later dashboard-adjacent feature in the project — live metrics, dashboard console, workbench desktop — inherits this shape.
11. **A dedicated `clean` subcommand is worth the ten lines it costs.** Without it, stale HTML and a stale manifest can confuse debugging. With it, the operator has an explicit reset. Small operational affordances repay themselves on the first time they are used.
12. **Feature flag the live mode, do not make it the default.** `--live` is opt-in. A dashboard opened for a one-shot look should not poll indefinitely. Defaults should match the common case; flags should light up the less common ones.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | The 6-step adaptive loop; v1.12 dashboard gives the loop a view surface for planning artifacts |
| [v1.5](../v1.5/) | Pattern Discovery — dashboard surfaces pattern activity captured by the v1.5 pipeline |
| [v1.7](../v1.7/) | GSD Master Orchestration Agent — the dashboard is an operator surface onto state the v1.7 agent manages |
| [v1.8](../v1.8/) | Capability-Aware Planning — the dashboard renders the capability-aware roadmap shape |
| [v1.10](../v1.10/) | Security Hardening — dashboard reads planning state hardened by v1.10 guards (safe YAML, path validation) |
| [v1.11](../v1.11/) | Predecessor — GSD Integration Layer; v1.12's slash command and integration hook build on it |
| [v1.12.1](../v1.12.1/) | Successor — Live Metrics Dashboard; extends v1.12's browser surface with live telemetry |
| [v1.13](../v1.13/) | Session Lifecycle & Workflow Coprocessor — dashboard becomes the session-visible state view |
| [v1.15](../v1.15/) | Live Dashboard Terminal — further extension of the browser-based operator surface |
| [v1.16](../v1.16/) | Dashboard Console & Milestone Ingestion — dashboard becomes the console backbone |
| [v1.17](../v1.17/) | Staging Layer — staging data rendered into dashboard pages |
| [v1.18](../v1.18/) | Information Design System — unifies the visual language the v1.12 dark theme seeded |
| [v1.19](../v1.19/) | Budget Display Overhaul — gauges rendered over the v1.12 page substrate |
| [v1.20](../v1.20/) | Dashboard Assembly — unified CSS pipeline built on the v1.12 page contract |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri webview hosting the same `file://`-compatible pages |
| `project-claude/commands/gsd-dashboard.md` | 105-line slash-command definition for generate/watch/clean |
| `src/cli/commands/dashboard.ts` | CLI entry point for the dashboard subcommands |
| `src/dashboard/generator.ts` | Generator core; wires parser + pages + incremental + refresh |
| `src/dashboard/incremental.ts` | 112-line hashing + manifest primitives |
| `src/dashboard/refresh.ts` | 84-line live-mode refresh script with scroll preservation |
| `src/dashboard/integration.test.ts` | 308-line full-pipeline integration test, 45 assertions |
| `.planning/MILESTONES.md` | Canonical v1.12 phase-by-phase detail (phases 88–93, 7 plans, 30 requirements) |

## Engine Position

v1.12 is the first release in the project that produced a browser-native surface, and every subsequent browser-based tool inherits its three load-bearing invariants: works from `file://`, one-way generation from `.planning/`, and per-page content-hashed incremental builds. The successor v1.12.1 (Live Metrics Dashboard) adds live telemetry over the same page substrate. v1.13's session-lifecycle work reuses the dashboard as its operator-visible state view. v1.15's live dashboard terminal, v1.16's dashboard console, v1.17's staging layer, v1.18's information design system, v1.19's budget-display gauges, and v1.20's unified CSS assembly all land over the v1.12 page contract without replacing it. When v1.21 brings up the GSD-OS desktop foundation in Tauri, the webview runs the same `file://`-compatible HTML pages v1.12 first emitted. The release is small by commit count (five shipping commits in the uplift range, fifteen overall) but it sets a contract that is still in force at v1.49 and will carry through v1.50 and beyond.

## Files

- `project-claude/commands/gsd-dashboard.md` — 105-line slash command spec, three subcommands, phase-transition auto-trigger documentation
- `project-claude/install.cjs` — registers `gsd-dashboard` in installer validation
- `project-claude/manifest.json` — adds `gsd-dashboard` to the manifest
- `src/cli/commands/dashboard.ts` — CLI for `generate` / `watch` / `clean` with live/watch/interval flags
- `src/dashboard/generator.ts` — generator core that wires parser, pages, incremental builds, and live-mode refresh injection
- `src/dashboard/incremental.ts` — 112-line content-hash primitives: `computeHash`, `loadManifest`, `saveManifest`, `needsRegeneration`
- `src/dashboard/incremental.test.ts` — 100-line unit test for hash consistency, manifest round-trip, and regeneration logic
- `src/dashboard/refresh.ts` — 84-line live-mode refresh script with sessionStorage scroll preservation and visual refresh indicator
- `src/dashboard/refresh.test.ts` — 45-line test for interval, scroll preservation, and visual indicator behavior
- `src/dashboard/integration.test.ts` — 308-line full-pipeline test with fixture `.planning/` and 45 assertions across structure, content, and manifest
- `src/dashboard/index.ts` — barrel exports for the new modules and types
- `src/dashboard/generator.test.ts` — generator tests including live-mode injection and incremental branches
- `src/dashboard/pages/state.test.ts` — branch-coverage tests for partial-field state pages
- `src/dashboard/pages/roadmap.test.ts` — branch-coverage tests for blocked/shipped/done/executing/empty statuses
- `src/dashboard/pages/milestones.test.ts` — branch-coverage tests for in-progress, no-stats, and no-goal cases
- `src/dashboard/pages/requirements.test.ts` — branch-coverage tests for no-goal-with-groups and empty-groups-no-goal cases
- `src/dashboard/parser.test.ts` — branch-coverage tests for no-totals-footer and empty-accomplishments cases
- `.planning/MILESTONES.md` — canonical v1.12 phase-by-phase detail (phases 88–93)

---

**Prev:** [v1.11](../v1.11/) · **Next:** [v1.12.1](../v1.12.1/)
