# v1.15 — Live Dashboard Terminal

**Shipped:** 2026-02-13
**Phases:** 123-127 (5 phases) | **Plans:** 11 | **Requirements:** 17

Integrate Wetty browser-based terminal into the planning docs dashboard with session binding and unified launcher for a complete dev environment.

### Key Features

**Terminal Configuration (Phase 123):**
- TerminalConfigSchema with Zod validation
- Fields: port, base_path, auth_mode, theme, session_name
- Wired into IntegrationConfig alongside dashboard settings

**Process Management (Phase 124):**
- Wetty spawn lifecycle with configurable options
- HTTP health check via native fetch (no axios dependency)
- Start/stop/status/restart API

**tmux Session Binding (Phase 125):**
- Auto-detection of existing tmux sessions
- Compound attach-or-create command
- Configurable session names matching GSD session naming

**Dashboard Terminal Panel (Phase 126):**
- Themed iframe with dark CSS matching dashboard
- JavaScript offline fallback for disconnected state
- Config-driven URL construction

**Unified Launcher (Phase 127):**
- DevEnvironmentManager composing dashboard + terminal
- Promise.allSettled for independent service lifecycle
- Single start/stop/status API for both services

### Test Coverage

- 211 tests across 11 test files

## Retrospective

### What Worked
- **Wetty browser-based terminal integration gives a terminal-in-browser without building one from scratch.** Rather than implementing a terminal emulator, v1.15 embeds an existing one (Wetty) and focuses on the integration: session binding, process management, and dashboard embedding.
- **tmux session binding with auto-detection and attach-or-create semantics handles all the edge cases.** Existing session? Attach. No session? Create. Wrong session name? Configurable. This is production-grade session management.
- **DevEnvironmentManager composing dashboard + terminal with Promise.allSettled for independent lifecycle is the right composition pattern.** If the terminal fails to start, the dashboard still works (and vice versa). Independent services should have independent failure modes.

### What Could Be Better
- **Themed iframe embedding for the terminal panel couples the dashboard's CSS to Wetty's rendering.** If Wetty changes its DOM structure or styling, the theme integration may break.

## Lessons Learned

1. **Promise.allSettled over Promise.all for independent service startup prevents one failure from cascading.** The dashboard and terminal are independent -- a terminal spawn failure shouldn't prevent the dashboard from loading.
2. **A unified launcher with single start/stop/status API hides multi-service complexity.** Users interact with one command; the launcher manages two processes. This is the facade pattern applied to dev environment management.

---
