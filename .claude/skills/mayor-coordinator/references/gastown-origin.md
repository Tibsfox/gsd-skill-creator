# Gastown Origin: Mayor Coordinator

## Where This Comes From

The mayor-coordinator skill is a direct adaptation of Gastown's `mayor` role, defined in `internal/cmd/prime.go` as `RoleMayor Role = "mayor"`. In the original Go codebase, the mayor is the cross-rig orchestrator: it creates convoys (`internal/cmd/convoy.go`), dispatches work via the sling system (`internal/cmd/sling.go`), and monitors agent progress through mail and status queries.

## Chipset Mapping: Northbridge Pattern

In the chipset hardware metaphor, the mayor maps to the **Northbridge** (Memory Controller Hub). The Northbridge in a real chipset routes data between the CPU, RAM, and high-bandwidth peripherals. It never performs computation -- it coordinates data flow. Similarly, the mayor never executes work; it routes work items to execution units (polecats) and aggregates results.

| Hardware Component | Mayor Function |
|-------------------|----------------|
| Northbridge routing | Convoy dispatch to polecats |
| Memory controller | Work item state management |
| Bus arbitration | Agent allocation and scheduling |
| Interrupt handler | Escalation processing from witness |

## Key Gastown Source Files

| File | What the Mayor Uses |
|------|-------------------|
| `internal/cmd/convoy.go` | `gt convoy create`, `gt convoy list` -- batch work tracking |
| `internal/cmd/sling.go` | `gt sling <bead> <rig>` -- work dispatch to agents |
| `internal/cmd/prime.go` | Role detection, context injection for mayor agents |
| `internal/cmd/mail.go` | Inter-agent messaging (receive completions, send instructions) |

## The "Mayor Never Codes" Principle

From Gastown's architecture documentation: the mayor coordinates but never executes. This is not a soft guideline -- it is a structural constraint. In the original system, the mayor has its own independent git clone (separate from the shared `.repo.git`), meaning it physically cannot see polecat working branches. The mayor operates through the message bus (mail), not through direct memory access (shared repository).

This separation ensures that coordination failures cannot corrupt execution state, and execution failures cannot break coordination. The mayor can be restarted without affecting in-progress work, and polecats can crash without losing the coordination graph.

## Design Decision: Independent Clone

Gastown gives the mayor its own full git clone instead of a worktree from the shared bare repo. This is architecturally deliberate: the mayor does not need branch visibility (it does not review code), and isolation prevents accidental state corruption. In the skill-creator adaptation, this maps to the mayor operating exclusively through the StateManager API rather than reading state files directly.

## What Changed From Gastown

1. **Language:** Go commands to TypeScript StateManager API calls
2. **Convoy commands:** `gt convoy create` becomes `state.createConvoy()`
3. **Sling dispatch:** `gt sling` becomes `state.setHook()` + work status update
4. **Communication:** tmux-based nudges replaced with filesystem-based messaging
5. **Scope:** Single-rig focus (skill-creator operates within one project, not across rigs)
