# v1.15 — Live Dashboard Terminal

**Released:** 2026-02-13
**Scope:** feature — browser-based terminal (Wetty) embedded in the planning docs dashboard with tmux session binding and unified service launcher
**Branch:** dev → main
**Tag:** v1.15 (2026-02-13T04:01:42-08:00) — "Live Dashboard Terminal"
**Predecessor:** v1.14 — Promotion Pipeline
**Successor:** v1.16 — Dashboard Console & Milestone Ingestion
**Classification:** feature release — extends the v1.12 dashboard surface with an embedded terminal panel
**Phases:** 123–127 (5 phases) · **Plans:** 11 · **Requirements:** 17
**Stats:** 22 commits · 30 terminal/launcher files · 211 tests across 11 test files
**Verification:** Wetty spawn + health-check lifecycle covered · tmux session detection + compound attach-or-create verified · Zod schema round-trip on `TerminalConfigSchema` · `Promise.allSettled` failure matrix exercised in `DevEnvironmentManager` tests

## Summary

**v1.15 completes the dev-environment composition started at v1.12.** The v1.12 milestone shipped the planning-docs dashboard as a static-generation + file-watch pair. The v1.13 session lifecycle and v1.14 promotion pipeline made the dashboard actionable, but there was still no way to *act* on what the dashboard showed without alt-tabbing to a terminal. v1.15 closes that loop by embedding Wetty (a browser-based terminal front-end that speaks to tmux) into the dashboard surface itself and wrapping both services under a single `DevEnvironmentManager`. Five phases, eleven plans, twenty-two commits, and two hundred and eleven tests later, the dashboard and terminal now start, stop, and report status as one unit while remaining independently failable — the central design constraint of the release.

**Wetty was chosen over a home-grown terminal because the integration surface is the work, not the emulator.** Building a terminal emulator in the browser is a large, off-topic engineering investment — xterm.js, PTY bridging, escape-sequence handling, copy-paste policy, scrollback buffers, resize semantics. Wetty already does all of that. The v1.15 scope was explicitly narrowed to the *integration* surface: how the terminal is configured, how it launches, how it discovers the right tmux session, how it gets embedded into the dashboard DOM, and how its lifecycle is coordinated with the dashboard service. Each of those became a distinct phase (123 through 127), each with 2–3 plans, each landed through red-green TDD with failing tests committed before implementation. The commit log reads `test(123-01) → feat(123-01) → test(123-02) → feat(123-02)` for every phase — a rhythm that paid off when session detection needed to be reshaped in phase 125 and the pre-existing tests caught the regression immediately.

**TerminalConfigSchema treats terminal configuration as first-class, not as environment-variable sprawl.** Phase 123 landed `src/integration/config/terminal-schema.ts` as a Zod schema with typed fields: `port`, `base_path`, `auth_mode`, `theme`, and `session_name`. This is the kind of decision that pays compounding interest — once the shape is a Zod schema, the reader parses it, the process manager consumes it, the panel renderer reads it, and the launcher threads it through without any string-munging in between. Phase 123-02 wired the schema into the composite `IntegrationConfig` alongside the existing dashboard configuration so that a single config file describes the full dev environment. The new `src/integration/config/terminal-types.ts` isolates the type exports so downstream consumers import types without pulling in the Zod runtime. This pattern directly inherits the v1.10 safe-deserialization discipline: schema-first parsing gates the shape before any field is trusted.

**The tmux session binding is the piece that makes the terminal feel like part of the GSD workflow, not a generic shell.** Phase 125 shipped `src/terminal/session.ts` with two primitives: `listTmuxSessions()` to enumerate live sessions and `buildSessionCommand(name)` to produce a compound attach-or-create shell command. The command construction is the subtle part — rather than branching in JavaScript based on whether the session exists, the emitted command is a single `tmux attach -t <name> || tmux new -s <name>` string that defers the decision to tmux itself. This is both simpler and more robust: there is no race window where the session could be created between the `list` call and the subsequent `attach`, and the fall-through semantics work whether the dashboard is freshly started or restarted mid-day. Phase 125-02 then wired that command as the `command` option passed to `launchWetty`, so the session binding is not a separate post-launch attach but part of the initial spawn. Sixty-two terminal-module tests cover the combinations (session present, absent, malformed, multiple) and pass on every commit from 125-02 onward.

**The dashboard terminal panel uses an iframe because decoupling beats deep integration at this scope.** Phase 126 shipped `src/dashboard/terminal-panel.ts` as an iframe renderer with themed dark CSS matching the dashboard chrome plus a JavaScript offline fallback for when the Wetty service is not reachable. An iframe is the boundary: Wetty owns everything inside, the dashboard owns everything outside, and the two communicate through the URL alone. This is the pragmatic answer to the "should we ship our own xterm.js panel?" question — the answer is no, not at v1.15, not until the integration friction from the iframe boundary proves to be a real user-visible problem. Phase 126-02 connected the panel's URL construction to the integration config reader so that changing the Wetty port in one place updates the panel target without any duplicated constants. The `src/dashboard/terminal-integration.ts` module is the thin glue that does that wiring; its tests exercise the config-change re-render path and the offline-detection path.

**The DevEnvironmentManager composes two services with independent failure modes — that is the entire design thesis of phase 127.** `src/launcher/dev-environment.ts` (182 lines, 203 lines of tests) wraps the `TerminalProcessManager` and a newly-factored `DashboardService` (the file watcher that v1.12 landed, now extracted into a `start/stop/status` class in `src/launcher/dashboard-service.ts`). The composition uses `Promise.allSettled` rather than `Promise.all` for both start-up and tear-down. The consequence is subtle but load-bearing: if the Wetty binary is missing, the dashboard still generates and serves; if the dashboard's file watcher hits an `ENOSPC`, the terminal still runs. Partial failures produce a partial `DevEnvironmentStatus` with per-service state, not a binary pass/fail. The eight lifecycle tests in `dev-environment.test.ts` explicitly walk the four corners — both succeed, terminal fails, dashboard fails, both fail — and assert the status shape in each. The static `fromConfig()` factory builds the full manager from an `IntegrationConfig` so production callers never construct services by hand; the same factory is what the CLI entry point will consume in v1.16.

**Test-first discipline was uniform across all five phases.** Every phase followed the pattern test-commit-then-feat-commit, visible in `git log v1.14..v1.15`: `test(123-01) 97315ab74`, `feat(123-01) 046a90c6a`, `test(123-02) 5db78442c`, `feat(123-02) 84e8e01bf`, and so on through phase 127. Two hundred and eleven tests across eleven test files is an average of just under twenty tests per plan, which is consistent with the 17-requirement scope (≈ twelve tests per requirement). The test files are colocated with the sources they exercise — `src/terminal/session.test.ts` next to `src/terminal/session.ts` — which keeps the coverage story legible and simplifies the refactoring cycles that inevitably follow a first TDD pass. No implementation commit landed without a preceding test commit, and no test commit was amended to match implementation reality — a small discipline that matters for archaeology.

**v1.15 also carried a significant out-of-band change: the skills optimization refactor.** Commit `dee76d18b refactor(skills): optimize all skills to fit within token budget` landed alongside the terminal work and touched every skill file in both `examples/skills/` and `project-claude/skills/`, plus every corresponding command in `project-claude/commands/`. This is why `git diff --shortstat v1.14..v1.15` reports 78 files and a large deletion count (15,123 lines removed); the terminal subsystem itself is the 30 files under `src/terminal/`, `src/launcher/`, `src/dashboard/terminal-*`, and `src/integration/config/terminal-*`. Callers who want the pure terminal diff can scope git to those paths; the full release diff includes the skills cleanup that happened to ride in the same tag. Treating the skills refactor as a separate logical deliverable in the release notes matters for honest accounting — it was not part of the phase 123–127 work, but it was in the tree when v1.15 was tagged.

**The v1.12 → v1.13 → v1.14 → v1.15 arc is the "dashboard becomes a workstation" arc.** v1.12 gave the dashboard a body (static generation + file watch). v1.13 gave it a pulse (session lifecycle + workflow coprocessor). v1.14 gave it a forward motion (promotion pipeline). v1.15 gives it hands (a terminal you can actually use without leaving the tab). v1.16 will give it a voice (dashboard console commands + milestone ingestion). This sequence matters for readers of the release history because the individual releases can each look small in isolation, but the trajectory is the point — each release is a specific, testable, committed step in a coherent direction. v1.15's 211 tests and 30 terminal-subsystem files belong to that trajectory.

## Key Features

| Area | What Shipped |
|------|--------------|
| Terminal configuration (Phase 123) | `TerminalConfigSchema` — Zod schema with `port`, `base_path`, `auth_mode`, `theme`, `session_name` in `src/integration/config/terminal-schema.ts` |
| Terminal configuration (Phase 123) | Integration config composition — terminal fields wired into the composite `IntegrationConfig` alongside dashboard settings in `src/integration/config/schema.ts` |
| Process management (Phase 124) | Wetty launcher + graceful shutdown — `src/terminal/launcher.ts` wraps spawn lifecycle with signal handling |
| Process management (Phase 124) | HTTP health probe via native `fetch` (no `axios` dependency) in `src/terminal/health.ts` |
| Process management (Phase 124) | `TerminalProcessManager` — start/stop/status/restart API that composes launcher + health probe (`src/terminal/process-manager.ts`) |
| tmux session binding (Phase 125) | `listTmuxSessions()` auto-detection + `buildSessionCommand()` compound attach-or-create in `src/terminal/session.ts` |
| tmux session binding (Phase 125) | Session command threaded into `launchWetty` via `command` option — single atomic spawn, no race window between list and attach |
| Dashboard terminal panel (Phase 126) | `src/dashboard/terminal-panel.ts` — iframe renderer with themed dark CSS and JavaScript offline fallback |
| Dashboard terminal panel (Phase 126) | `src/dashboard/terminal-integration.ts` — config-driven URL construction wired to integration config reader |
| Unified launcher (Phase 127) | `DashboardService` — file-watch + regenerate extracted into a start/stop/status class (`src/launcher/dashboard-service.ts`, 249 lines) |
| Unified launcher (Phase 127) | `DevEnvironmentManager` — composes terminal + dashboard via DI, `Promise.allSettled` for independent lifecycle (`src/launcher/dev-environment.ts`, 182 lines) |
| Unified launcher (Phase 127) | `DevEnvironmentManager.fromConfig()` static factory — builds the full manager from an `IntegrationConfig` for production callers |
| Out-of-band refactor | Skills token-budget optimization (`dee76d18b`) — every skill file in `examples/skills/` and `project-claude/skills/` + `project-claude/commands/` trimmed to fit budget |
| Test coverage | 211 tests across 11 test files, red-green TDD rhythm uniform across all five phases |

## Retrospective

### What Worked

- **Wetty browser-based terminal integration gave a terminal-in-browser without building one from scratch.** Rather than implementing a terminal emulator, v1.15 embedded an existing one (Wetty) and focused on the integration: session binding, process management, and dashboard embedding. The scope discipline kept the release shippable in five phases instead of fifteen.
- **tmux session binding with auto-detection and atomic attach-or-create handled all the edge cases.** Existing session? Attach. No session? Create. Wrong session name? Configurable. Using a compound `tmux attach -t X || tmux new -s X` command delegated the decision to tmux rather than branching in JavaScript, which removed a race window and simplified the state machine.
- **`DevEnvironmentManager` composing dashboard + terminal with `Promise.allSettled` for independent lifecycle is the right composition pattern.** If the terminal fails to start, the dashboard still works (and vice versa). Independent services have independent failure modes; `Promise.allSettled` is the literal JavaScript primitive that encodes that claim.
- **Test-first TDD was uniform across every phase.** Each plan landed with a `test(N-M)` commit before the matching `feat(N-M)` commit. When phase 125-02 had to reshape the session detection, the pre-existing 62 terminal tests caught the regression immediately rather than waiting for integration testing. The rhythm cost nothing and bought confidence.
- **Zod schema as the config boundary inherits v1.10's safe-deserialization discipline.** `TerminalConfigSchema` is not just a type; it is the runtime parser that validates every config read. Unknown fields reject early, malformed values reject early, and downstream consumers get typed objects without re-validating.

### What Could Be Better

- **Themed iframe embedding for the terminal panel couples the dashboard's CSS to Wetty's rendering.** If Wetty changes its DOM structure or class names, the theme integration may break. The current approach was the right v1.15 decision (shipping beats tuning) but a future milestone should revisit whether to vendor xterm.js directly and drop the iframe boundary.
- **The skills token-budget refactor rode in the v1.15 tag but is conceptually separate.** Tagging v1.15 captured both the terminal work and the skills cleanup in a single point, which muddies the release-note story. A separate `v1.14.1` or `v1.15-pre` tag for the skills refactor would have produced cleaner archaeology; future similar refactors should land under their own tag even when the diff is small.
- **17 requirements across 5 phases is on the light side for a feature release.** The scope was right-sized for shippability, but some observable aspects (authentication mode beyond `none`, reconnection UX on Wetty disconnect, keybinding coordination between Wetty and the browser chrome) are still pending. v1.15 shipped the skeleton; the muscles go on a later milestone.
- **Health-check via native `fetch` means Node 18+ is now a hard minimum for this subsystem.** The choice to drop `axios` in favor of `fetch` removed a dependency, but it also removed any prior compatibility shim. The `engines` field should be updated in package.json at the next release to make the requirement explicit.

## Lessons Learned

1. **Choose the emulator you can buy; build the integration you have to.** Wetty already solved the hard part (PTY bridging, escape sequences, scrollback, resize). The v1.15 contribution was the integration — config schema, process lifecycle, session binding, panel embedding, unified launcher. Narrowing scope to the integration surface is what let five phases ship in twenty-two commits.
2. **Compound shell commands beat branching in the orchestration language.** `tmux attach -t X || tmux new -s X` is one atomic spawn; `listSessions() → if exists attach else create` is two calls with a race window between them. When tmux itself can make the decision correctly, let it.
3. **`Promise.allSettled` is the right primitive for independent services.** `Promise.all` short-circuits on first rejection; two services with independent failure modes must not share a fate. Every launcher that starts N > 1 services should default to `allSettled` and explicitly opt into `all` only when the services are truly dependent.
4. **An iframe is a clean module boundary when you do not own the inner code.** The temptation to deep-integrate (mount xterm.js directly, share the dashboard's event bus) grows with the surface of the integration. The iframe enforces the boundary: URL in, display out, no shared state. Shipping beats tuning at v1.15 scope.
5. **Zod schemas at the config boundary inherit the v1.10 safe-deserialization discipline.** Every config read should flow through a Zod parse before any field is trusted. `TerminalConfigSchema` is the embodiment; the pattern should generalize to every new subsystem config that lands from here on.
6. **Extract services from feature code the moment you need a second lifecycle.** Phase 127 had to factor `DashboardService` out of `src/dashboard/generate.ts` because the unified launcher needed a start/stop/status contract the original watcher did not expose. The refactor was small and test-covered; it would have been much larger had two more subsystems already consumed the inline watcher first.
7. **Red-green TDD with separate test and feat commits makes archaeology easy.** `git log --oneline v1.14..v1.15` reads as a rhythm: `test(N-M)` then `feat(N-M)` for every one of eleven plans. Future readers can `git show <test-sha>` to see the requirement as code before the implementation exists — a built-in requirement-to-test trace without a separate tool.
8. **Static `fromConfig()` factories push config parsing to the edge.** `DevEnvironmentManager.fromConfig(config)` means the manager's constructor only takes already-parsed, already-validated service objects. Callers can use the manager in tests with mock services and in production with the factory; neither path duplicates config logic.
9. **Colocate test files with sources.** `src/terminal/session.test.ts` sits next to `src/terminal/session.ts`. This is a small convention but it means every module's coverage is obvious at a glance and the refactoring cycles that follow a first TDD pass do not have to hunt through a parallel test tree. Every new subsystem from v1.15 onward should follow the same convention.
10. **Tag refactors separately from feature work even when the diff is small.** The skills token-budget refactor and the terminal integration were both in the tree at v1.15; they should have been two tags. Future releases should prefer `v1.14.1` for standalone refactors over rolling them into the next feature tag.
11. **Schema files and type files should be separate modules.** `src/integration/config/terminal-schema.ts` exports the Zod schema; `src/integration/config/terminal-types.ts` exports the inferred types. Downstream consumers that only need types do not drag the Zod runtime into their bundles. The cost is one extra file; the benefit is every consumer chooses the weight it pays.
12. **A `status` API returning per-service state beats a binary pass/fail.** `DevEnvironmentStatus` reports `{ terminal: TerminalStatus, dashboard: DashboardStatus }` — the caller can render partial-up states (terminal running, dashboard stopped) rather than being forced into a lie about the overall system. Partial truth is better than total fiction.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.10](../v1.10/) | Safe-deserialization discipline — v1.15's `TerminalConfigSchema` inherits the Zod schema-first parsing pattern v1.10 normalized across the codebase |
| [v1.11](../v1.11/) | GSD Integration Layer — the `IntegrationConfig` composite schema that v1.15 extends with terminal fields |
| [v1.12](../v1.12/) | GSD Planning Docs Dashboard — the dashboard body that v1.15 adds hands to |
| [v1.12.1](../v1.12.1/) | Live Metrics Dashboard — the dashboard-generation path that `DashboardService` in v1.15 wraps |
| [v1.13](../v1.13/) | Session Lifecycle & Workflow Coprocessor — the GSD session naming that tmux session binding matches against |
| [v1.14](../v1.14/) | Promotion Pipeline — immediate predecessor; v1.14's workflow surface is what the terminal now lets you drive interactively |
| [v1.16](../v1.16/) | Dashboard Console & Milestone Ingestion — immediate successor; consumes `DevEnvironmentManager.fromConfig()` as the CLI entry point |
| [v1.17](../v1.17/) | Staging Layer — parallel execution surface that the embedded terminal makes observable |
| [v1.18](../v1.18/) | Information Design System — dashboard shape+color encoding that the terminal panel's themed iframe aligns with |
| [v1.19](../v1.19/) | Budget Display Overhaul — further dashboard panel work that builds on v1.15's panel-embedding pattern |
| [v1.20](../v1.20/) | Dashboard Assembly — the unified CSS pipeline that normalizes dashboard + terminal-panel styling |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri shell + PTY terminal that eventually subsumes the browser-Wetty path for desktop users |
| [v1.39](../v1.39/) | GSD-OS Bootstrap & READY Prompt — 7-service launcher with health checks, direct descendant of `DevEnvironmentManager` |
| `src/terminal/` | Full terminal subsystem — launcher, health, process manager, session, types (6 source files + 5 test files) |
| `src/launcher/` | Dashboard + terminal composition — dashboard-service, dev-environment, index, types |
| `src/integration/config/terminal-schema.ts` | Zod schema for terminal configuration — wired into the composite `IntegrationConfig` |
| `src/dashboard/terminal-panel.ts` | Iframe renderer with themed dark CSS and offline fallback |
| `src/dashboard/terminal-integration.ts` | Config-driven URL construction wired to the integration config reader |
| `.planning/MILESTONES.md` | Canonical phase-by-phase detail for phases 123–127 |

## Engine Position

v1.15 sits in the v1.12 → v1.16 "dashboard becomes a workstation" arc. v1.12 shipped the static dashboard; v1.13 added session lifecycle; v1.14 added promotion pipeline; v1.15 embeds the terminal that lets a user *act* on what the dashboard displays; v1.16 will add the command console and milestone ingestion that unify the two surfaces into one interactive tool. Every release in this arc is small individually (v1.15 is 17 requirements across 5 phases) but the trajectory compounds — by v1.20 the dashboard is a full assembly of panels sharing a CSS pipeline, by v1.21 the Tauri desktop shell makes it native, and by v1.39 the same `DevEnvironmentManager` composition pattern scales to seven services with health checks (GSD-OS Bootstrap). The `Promise.allSettled` independent-lifecycle pattern, the Zod-schema config boundary, the colocated tests, and the factory-from-config entry shape all start here and stay load-bearing through the v1.49 line. v1.15 is also the first release where the "integrate rather than build" scope decision (Wetty over home-grown xterm.js) is framed explicitly — a philosophy that v1.26 (Aminet), v1.29 (electronics), and v1.38 (SSH agent) all repeat when they choose an existing tool and contribute the integration surface instead.

## Files

- `src/terminal/launcher.ts` + `src/terminal/launcher.test.ts` — Wetty spawn lifecycle with graceful shutdown
- `src/terminal/health.ts` + `src/terminal/health.test.ts` — HTTP health probe via native `fetch`
- `src/terminal/process-manager.ts` + `src/terminal/process-manager.test.ts` — start/stop/status/restart API
- `src/terminal/session.ts` + `src/terminal/session.test.ts` — `listTmuxSessions()` + `buildSessionCommand()` compound attach-or-create
- `src/terminal/index.ts` + `src/terminal/types.ts` — barrel exports and shared types
- `src/integration/config/terminal-schema.ts` + `terminal-schema.test.ts` — Zod schema for terminal config
- `src/integration/config/terminal-types.ts` — type-only re-exports to avoid dragging the Zod runtime
- `src/integration/config/schema.ts` + `schema.test.ts` + `reader.test.ts` + `index.ts` + `types.ts` — composite integration config extended with terminal fields
- `src/dashboard/terminal-panel.ts` + `terminal-panel.test.ts` — iframe renderer with themed dark CSS and offline fallback
- `src/dashboard/terminal-integration.ts` + `terminal-integration.test.ts` — config-driven URL construction wired to the integration reader
- `src/launcher/dashboard-service.ts` + `dashboard-service.test.ts` — file-watch + regenerate extracted into a start/stop/status class (249 + 164 lines)
- `src/launcher/dev-environment.ts` + `dev-environment.test.ts` — `DevEnvironmentManager` composition with `Promise.allSettled` (182 + 203 lines)
- `src/launcher/index.ts` + `src/launcher/types.ts` — barrel exports + shared types (`DevEnvironmentStatus`, `DevEnvironmentConfig`, `DashboardServiceStatus`, `DashboardServiceConfig`)
- `examples/skills/` + `project-claude/skills/` + `project-claude/commands/` — skills token-budget optimization (out-of-band refactor carried in v1.15 tag, commit `dee76d18b`)
- `.planning/MILESTONES.md` — canonical phases 123–127 detail (11 plans, 17 requirements)

## Version History (preserved from original release notes)

The v1.15 tag was part of the v1.x line that extends the v1.0 adaptive learning loop. The table below is the line as it stood at v1.15 release time; it is retained here for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.15** | Live Dashboard Terminal — Wetty integration, tmux session binding, unified launcher (this release) |
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
