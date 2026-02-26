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

---
