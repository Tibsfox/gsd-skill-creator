# Gastown Origin: Polecat Worker

## Where This Comes From

The polecat-worker skill is a direct adaptation of Gastown's `polecat` role, defined in `internal/cmd/prime.go` as `RolePolecat Role = "polecat"`. In the original Go codebase, polecats are ephemeral worker agents spawned by the sling system (`internal/cmd/sling.go`), managed by the polecat manager (`internal/polecat/manager.go`), and governed by the GUPP principle injected via templates (`internal/templates/roles/polecat.md.tmpl`).

## Chipset Mapping: ALU Pattern

In the chipset hardware metaphor, the polecat maps to the **ALU (Arithmetic Logic Unit)**. The ALU in a real processor receives a single instruction, executes it, produces a result, and is immediately available for the next instruction. It has no memory of previous computations. Similarly, the polecat receives one bead, executes it autonomously, pushes the result, and terminates.

| Hardware Component | Polecat Function |
|-------------------|------------------|
| ALU instruction input | Bead on hook (work assignment) |
| ALU execution | Autonomous code execution per GUPP |
| ALU result output | Branch pushed to remote |
| ALU register clear | Worktree nuked on completion ("done means gone") |

## Key Gastown Source Files

| File | What It Provides |
|------|-----------------|
| `internal/cmd/polecat.go` | Polecat lifecycle management commands |
| `internal/cmd/polecat_spawn.go` | Polecat spawning logic (worktree + tmux session) |
| `internal/polecat/manager.go` | Allocation pool, naming, lifecycle tracking |
| `internal/templates/roles/polecat.md.tmpl` | GUPP injection template (autonomous mode instructions) |
| `internal/cmd/done.go` | `gt done` -- push, MR creation, worktree destruction |

## The GUPP Principle

GUPP (Gas Town Universal Propulsion Principle) is the core behavioral contract for polecats. From `polecat.md.tmpl`:

> Work is on your hook. After announcing your role, begin IMMEDIATELY. This is physics, not politeness. Gas Town is a steam engine -- you are a piston. Every moment you wait is a moment the engine stalls.

In hardware terms, GUPP makes the hook an NMI (Non-Maskable Interrupt). The polecat cannot defer, cannot wait for confirmation, cannot ask for clarification. It must begin execution immediately upon detecting work on its hook.

## The "Done Means Gone" Philosophy

From Gastown's `done.go`: when a polecat calls `gt done`, five things happen in sequence:

1. Branch is pushed to remote (write-through to durable storage)
2. A merge request bead is created (reorder buffer commit)
3. The witness is notified (interrupt acknowledge)
4. The worktree is destroyed (register deallocation)
5. The tmux session is terminated (pipeline drain)

This is irreversible by design. The worktree destruction prevents state leakage between tasks. In hardware terms, this is equivalent to zeroing registers after retirement.

## Polecat Spawning (sling.go)

The sling system spawns polecats through a pipeline that maps to instruction fetch-decode-execute:

1. **Fetch:** Resolve bead ID to a work item
2. **Decode:** Allocate a polecat name from the pool
3. **Setup:** Create a git worktree from the shared `.repo.git`
4. **Inject:** Run `gt prime --hook` to load role-specific context
5. **Execute:** GUPP activates -- polecat begins autonomous work

## What Changed From Gastown

1. **Language:** Go commands to TypeScript StateManager API calls
2. **Spawning:** `gt sling` becomes `state.createAgent()` + `state.setHook()`
3. **Completion:** `gt done` becomes `state.clearHook()` + `state.updateAgentStatus('terminated')`
4. **Communication:** tmux-based nudges replaced with filesystem-based messaging
5. **Worktree management:** Physical worktree creation/destruction is not modeled; branch management is the skill user's responsibility
6. **Session management:** No tmux dependency; sessions are implicit (one Claude Code conversation = one polecat session)
