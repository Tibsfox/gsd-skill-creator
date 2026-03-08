# 02 — Concept Mapping

## Complete Translation Table

This document maps every Gastown concept to its gsd-skill-creator equivalent. Use this as a reference when reading Gastown documentation or when an agent needs to translate between the two systems.

### Agent Roles

| Gastown | GSD Chipset | Hardware Metaphor | Responsibility |
|---------|-------------|-------------------|----------------|
| **Mayor** | `mayor-coordinator` skill | Northbridge | Owns convoys, dispatches work, supervises agents. **Never executes work.** |
| **Polecat** | `polecat-worker` skill | ALU | Ephemeral executor. One work item per lifecycle. GUPP-driven. |
| **Witness** | `witness-observer` skill | PMU | Health monitoring, stall detection, graduated escalation. Read-only. |
| **Refinery** | `refinery-merge` skill | DMA | Sequential merge queue. FIFO, deterministic, never auto-resolves conflicts. |
| **Crew** | GSD agents (`.claude/agents/`) | GPR (general-purpose register) | Long-lived human-managed workspace. |
| **Deacon** | Not yet implemented | Timer chip | Background daemon, watchdog of agents. Boot watches the Deacon. |
| **Boot (the Dog)** | Not yet implemented | Reset circuit | Watchdog of the watchdog (checks Deacon every 5 min). |
| **Dog** | Not yet implemented | DMA helper | Infrastructure batch workers (not general workers). |

### Work Units

| Gastown | GSD Chipset | Description |
|---------|-------------|-------------|
| **Bead** | `WorkItem` (type) | Atomic trackable work unit. Git-backed in Gastown (Dolt), JSON-file-backed in chipset. |
| **Convoy** | `Convoy` (type) | Batch grouping of related beads. Tracks progress 0.0→1.0. |
| **Formula** | Not yet implemented | TOML workflow template (like microcode). Defines multi-step sequences. |
| **Molecule** | Not yet implemented | Instantiated formula. Durable multi-step workflow. |
| **Wisp** | Not yet implemented | Ephemeral bead destroyed after use. |
| **Hook** | `HookState` (type) | Pinned work assignment for an agent. GUPP says: if hooked, execute. |

### Work Lifecycle

| Gastown Status | Chipset `WorkStatus` | Meaning |
|----------------|---------------------|---------|
| Created | `open` | Work exists but unassigned |
| Slung | `hooked` | Mayor assigned to a polecat |
| In progress | `in_progress` | Polecat actively executing |
| Done | `done` | Polecat pushed branch, submitted MR |
| Merged | `merged` | Refinery merged to target branch |

### Communication

| Gastown | Chipset Channel | Type | Persistence | Hardware Metaphor |
|---------|----------------|------|-------------|-------------------|
| `gt mail` | `mail-async` skill | Async | Durable (JSON files, 24h retention) | PCIe |
| `gt nudge` | `nudge-sync` skill | Sync | Ephemeral (latest-wins) | SMI (System Management Interrupt) |
| `gt hook` | `hook-persistence` skill | Pull-based | Persistent (single file per agent) | MMIO (Memory-Mapped I/O) |
| `gt handoff` | `handoff` channel type | Cycling | Durable | Bus Reset |
| `gt seance` | Not yet implemented | Query | Read-only | — |
| `gt escalate` | Witness escalation pattern | Async | Durable | NMI (Non-Maskable Interrupt) |
| Groups | Not yet implemented | Multicast | Durable | — |
| Queues | Not yet implemented | Routed | Durable | — |
| Channels | Not yet implemented | Pub/sub | Configurable | — |

### Infrastructure

| Gastown | GSD Chipset | Description |
|---------|-------------|-------------|
| **Town** (`~/gt/`) | gsd-skill-creator workspace | Root directory coordinating all rigs |
| **Rig** | Project directory (or git worktree) | A project container wrapping a git repository |
| **Dolt SQL** | JSON files with atomic writes | State storage. Gastown uses a database; chipset uses filesystem. |
| **`gt` CLI** | Skills + StateManager API | Interface for agent operations |
| **`gt prime`** | SessionStart hooks | Context injection at agent startup |
| **`gt sling`** | `sling-dispatch` skill (7-stage pipeline) | Work dispatch mechanism |
| **`gt done`** | `done-retirement` skill (7-stage pipeline) | Work completion mechanism |
| **tmux** | Optional (GSD works without it) | Session management |
| **GUPP** | `gupp-propulsion` skill (advisory) | Execution enforcement principle |
| **NDI** | GSD phase verification | Nondeterministic Idempotence — eventual completion guarantee |
| **MEOW** | GSD phase/plan decomposition | Molecular Expression of Work — breaking goals into atoms |

### Dispatch Pipeline (7 Stages)

| Stage | Gastown (`gt sling`) | Chipset (`sling-dispatch` skill) |
|-------|---------------------|----------------------------------|
| 1 | Resolve bead | **Fetch**: resolve bead ID to work item, reject if not `open` |
| 2 | Select agent | **Allocate**: find idle polecat or spawn new (up to `max_parallel`) |
| 3 | Create workspace | **Prepare**: create branch `polecat/{beadId}`, assemble context |
| 4 | Assign work | **Hook**: set agent's hook, mark work `hooked` |
| 5 | Persist | **Store**: write dispatch record (crash recovery point) |
| 6 | Launch | **Launch**: update agent → `active`, send work_assignment mail |
| 7 | Confirm | **Confirm**: update convoy progress, notify witness |

### Retirement Pipeline (7 Stages)

| Stage | Gastown (`gt done`) | Chipset (`done-retirement` skill) |
|-------|--------------------|------------------------------------|
| 1 | Verify completion | **Validate**: check acceptance criteria met |
| 2 | Commit | **Commit**: ensure all changes committed |
| 3 | Push (IRREVERSIBLE) | **Push**: push branch, mark `done`. No return after this. |
| 4 | Submit MR | **Submit**: create merge request in queue |
| 5 | Notify | **Notify**: mail to mayor + witness |
| 6 | Cleanup | **Cleanup**: destroy workspace, clear hook |
| 7 | Terminate | **Terminate**: mark agent terminated, release resources |

### Concepts Not Yet Ported

These Gastown concepts exist in the upstream project but have not yet been absorbed into the chipset. They represent future integration opportunities:

| Concept | What It Does | Priority | Notes |
|---------|-------------|----------|-------|
| **Deacon** | Background daemon, runs plugins | Medium | Could map to a GSD PostToolUse hook |
| **Boot** | Watchdog of the watchdog | Low | Gastown-specific concern |
| **Dogs** | Infrastructure batch workers | Low | GSD uses hooks for infrastructure |
| **Seance** | Query predecessor sessions | Medium | Useful for context recovery |
| **Formula/Molecule** | TOML workflow templates | High | Maps to GSD plan templates |
| **Wasteland** | Federated cross-town coordination | High | Maps to multi-project orchestration |
| **Scheduler capacity control** | Deferred dispatch with circuit breaker | Medium | Chipset has `max_parallel` but no circuit breaker |
| **Batch-then-bisect merge** | Bors-style merge strategy | Medium | Chipset has simple FIFO merge |
| **Integration branches** | Epic-scoped branches | Low | GSD uses feature branches per plan |
| **Dashboard/Feed TUI** | Real-time monitoring | Medium | Could integrate with GSD statusline |
| **Data plane lifecycle** | 6-stage bead decay/compaction | Low | Chipset uses simple JSON retention |
