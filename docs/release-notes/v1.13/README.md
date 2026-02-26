# v1.13 — Session Lifecycle & Workflow Coprocessor

**Shipped:** 2026-02-12
**Phases:** 101-114 (14 phases) | **Plans:** 35 | **Requirements:** 39

A dual-track system adding gsd-stack (bash session/recording infrastructure) and chipset (TypeScript Amiga-inspired coprocessor architecture) that converge at integration -- sessions feed learning, lifecycle events drive Pipeline execution.

### gsd-stack Track (Phases 101-107)

Pure bash infrastructure for session management and recording.

**Stack Core (Phase 101):**
- `gsd-stack` CLI with directory bootstrapping and environment configuration
- History logging to `history.jsonl`, status and log subcommands
- Auto-creates `.claude/stack/` hierarchy (pending/, done/, sessions/, recordings/, saves/)

**Message Stack (Phase 102):**
- `push` — Queue messages with priority (urgent/normal/low), YAML frontmatter, stdin support
- `peek` — Inspect next message without consuming (FIFO/LIFO mode)
- `pop` — Consume and move message from pending/ to done/ (audit-preserving)
- `clear` — Move all pending to done/ with count reported

**Advanced Operations (Phase 103):**
- `poke` — Direct tmux session interaction (send-keys bypass queue)
- `drain` — Headless batch mode, sequential pop-and-execute via `claude -p --continue`

**Session Lifecycle (Phases 104-105):**
- `session` — Start managed Claude Code session in tmux with meta.json, heartbeat process
- `list` — Show all sessions with live state detection (active/stalled/paused/stopped/saved)
- `watch` — Read-only tmux attach for monitoring running sessions
- `pause` — Send Ctrl+C interrupt, update meta to paused, auto-save state
- `resume` — Three-path logic: warm-start paused, recover stalled, seed from saved
- `stop` — Graceful shutdown sequence with final stats
- `save` — Snapshot creation with meta, STATE.md, pending stack, terminal context

**Recording System (Phases 106-107):**
- `record` — Background capture to stream.jsonl (terminal, stack events, file changes)
- `mark` — Insert named markers during recording
- `play` — Four replay modes: analyze (timeline), step (interactive), run (benchmark), feed (playbooks)
- `metrics` — 14-metric computation engine with display and `--compare` for side-by-side diffs

### Chipset Track (Phases 108-113)

TypeScript Amiga-inspired coprocessor architecture for agent coordination.

**Pipeline List Format (Phase 108):**
- WAIT/MOVE/SKIP instruction types with Zod schemas and YAML parser
- WAIT instructions sync to GSD lifecycle events (phase-start, phase-planned, tests-passing, etc.)
- MOVE instructions specify target (skill/script/team) with activation mode (sprite/full/blitter/async)
- Pre-compilation during planning, automatic loading during execution

**Offload Engine (Phase 109):**
- Script promotion from skill metadata for deterministic operations
- Child process execution with timeout management, output capture
- Completion signals propagate for downstream Pipeline synchronization

**Pipeline Executor (Phase 110):**
- Lifecycle sync bridge: GSD lifecycle events resolve WAIT instructions
- Activation dispatch: sprite (~200 tokens), full, blitter (offload), async modes
- SKIP condition evaluation against filesystem state and runtime variables

**Team-as-Chip Framework (Phase 111):**
Four specialized chips modeled after the Amiga chipset:

| Chip | Domain | Analog |
|------|--------|--------|
| **Agnus** | Context management (STATE.md, observations, lifecycle) | Memory controller |
| **Denise** | Output rendering (dashboards, reports, visualizations) | Graphics processor |
| **Paula** | I/O operations (git, file system, external tools) | I/O controller |
| **Gary** | Glue logic (coordination, message routing, signal distribution) | Bus controller |

- FIFO message ports with reply-based ownership semantics
- 32-bit signal system for lightweight wake/sleep coordination
- Budget channel token allocation per team

**Exec Kernel (Phase 112):**
- Prioritized round-robin scheduler (phase-critical 60%, workflow 15%, background 10%, pattern detection 10%)
- 18 typed message protocols for inter-team communication
- Per-team token budgets with guaranteed minimums and burst mode (BLITHOG)

**Pipeline Learning (Phase 113):**
- Observation-to-list compiler with confidence scoring
- Jaccard feedback engine for accuracy tracking and refinement
- Versioned library with best-match retrieval indexed by workflow type

### Integration (Phase 114)

- **StackBridge:** Recording events feed Pipeline learning system
- **SessionEventBridge:** Lifecycle states become Pipeline WAIT targets
- **PopStackAwareness:** Respects pause state, touches heartbeat, logs markers

### Test Coverage

- 541 bash tests (gsd-stack)
- 516 TypeScript tests (chipset)
- 12 end-to-end integration tests across 25 test files

---
