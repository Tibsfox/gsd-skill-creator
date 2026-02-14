# State

## Current Position

Milestone: v1.21 -- GSD-OS Desktop Foundation
Phase: 158 -- Tauri Scaffold + IPC Foundation (COMPLETE)
Plan: 04 complete (phase done, 4/4 plans)
Status: Phase 158 complete, ready for parallel tracks
Last activity: 2026-02-14 -- Completed 158-04 (IPC benchmark + capability ACL)

Progress: [#.........] 1/11 phases

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14 after v1.20 shipped)

**Core value:** Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code

**Current focus:** Build Tauri desktop application shell with WebGL 8-bit graphics, first-boot calibration, Amiga-inspired desktop environment, and native system bridges (PTY, file watcher, IPC)

## Accumulated Context

### Config
- Mode: yolo
- Depth: comprehensive
- Model profile: quality (opus executors)
- Parallelization: enabled
- commit_docs: false

### Architecture Notes
- Existing TypeScript library (`src/`) remains unchanged -- compiled via `tsc` to `dist/`
- New Rust backend in `src-tauri/` (PTY, file watcher, IPC commands, state management)
- New webview frontend in `desktop/` (WebGL engine, desktop shell, terminal, calibration)
- `desktop/` uses Vite for bundling, targets browser context only (no Node.js APIs)
- Strict boundary: `src/` never imports from `desktop/` or `@tauri-apps/api`
- Strict boundary: `desktop/` never imports Node.js modules (`fs`, `path`, `child_process`)
- Dashboard generators invoked by Rust backend as build-time or sidecar, not imported into webview
- WebGL canvas at z-index 0 (background, pointer-events: none), DOM at z-index 1+ (all interactive content)
- Dashboard module: src/dashboard/ (parser, renderer, generator, structured-data, incremental, refresh, collectors, metrics, terminal-panel, terminal-integration, upload-zone, config-form, submit-flow, question-card, question-poller, console-page, console-settings, console-activity, staging-queue-panel, entity-shapes, entity-legend, gantry-panel, gantry-data, budget-gauge, silicon-panel, activity-feed, activity-tab-toggle, topology-renderer, topology-data, topology-integration, budget-silicon-collector, console-collector)
- Terminal module: src/terminal/ (launcher, health, process-manager, session, types, index)
- Launcher module: src/launcher/ (dashboard-service, dev-environment, types, index)
- Console module: src/console/ (message types/schemas, reader, writer, message-handler, status-writer, helper endpoint, bridge-logger, question-schema, question-responder)
- Staging module: src/staging/ (hygiene/, intake-flow/, resource/, derived/, queue/)
- Identifiers module: src/identifiers/ (types, generator, compat, metadata, index)
- 24 milestones shipped, 157 phases, 449 plans, ~195k LOC

### Key Decisions (v1.21)
- tauri-build has independent versioning from tauri crate (2.5.x vs 2.10.x)
- AppManifest capability ACL: use try_build(Attributes::new().app_manifest(manifest)), not AppManifest::build()
- Tauri requires RGBA PNG icons (1-bit colormap rejected at compile time)
- Tauri v2.10.x for desktop framework (not Electron)
- xterm.js v5.5.x (not v6.0 -- breaking API changes)
- portable-pty 0.9.0 for Rust PTY management
- notify 8.2.0 for native file watching
- Custom WebGL2 shaders (not Three.js/CRTFilter.js)
- culori v4.0 for OKLCH palette generation
- Vite v6.x for desktop/ frontend bundling
- CSS fallback mandatory for WebGL context loss (Linux WebKitGTK/NVIDIA)
- Watermark-based PTY flow control from day one (not optional)
- Binary encoding for PTY IPC (Vec<u8>, not JSON strings)
- desktop/ is standalone package (not workspace) for clean separation from src/
- Vite build target safari13 per Tauri v2 WebKitGTK engine requirements
- mockIPC passes Channel object directly (use .id property, not string parsing)
- vitest 3.x in desktop/ (not 4.x -- latest stable is 3.2.4)
- Channel mock: runCallback with {index, message} envelope; Channel unwraps internally to onmessage
- IPC benchmark uses CHUNK_COUNT=10 for channel throughput measurement baseline

### Parallelization Plan
After Phase 158, three independent tracks:
- Track A (Graphics): 160 -> 161
- Track B (Terminal): 162 -> 163
- Track C (File Watcher): 159
Tracks converge at 164-166 (Desktop + Dashboard)

### Todos
- (none)

### Blockers
- (none)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total milestones | 24 shipped (v1.0-v1.20 + v1.8.1 patch) |
| Total phases | 157 complete |
| Total plans | 449 complete |
| Total LOC | ~195k TypeScript + Rust |
| v1.21 phases | 1/11 complete |
| v1.21 plans | 4/? complete |
| v1.21 requirements | 50 total |
| 158-01 duration | 11min |
| 158-02 duration | 2min |
| 158-03 duration | 6min |
| 158-04 duration | 3min |

## Session Continuity

Last: 2026-02-14 -- Completed 158-04 (IPC benchmark + capability ACL)
Stopped at: Completed 158-04-PLAN.md (Phase 158 complete)
Next action: Plan parallel tracks -- Track A (160 WebGL), Track B (162 Terminal), Track C (159 File Watcher)
Context: Phase 158 fully complete. Tauri scaffold with IPC foundation: 5 Rust commands, TypeScript wrappers for commands/events/channels, benchmark runner, capability ACL. 11 passing desktop tests. Ready for parallel phase execution.

---
*Last updated: 2026-02-14 (158-04 complete, phase 158 done)*
