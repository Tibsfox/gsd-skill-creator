# Gastown Origin: Witness Observer

## Where This Comes From

The witness-observer skill is a direct adaptation of Gastown's `witness` role, defined in `internal/cmd/prime.go` as `RoleWitness Role = "witness"`. In the original Go codebase, the witness is a per-rig observer that runs patrol loops to monitor polecat and crew agent health, detect stalls, and escalate to the mayor when intervention is needed.

## Chipset Mapping: PMU Pattern

In the chipset hardware metaphor, the witness maps to the **PMU (Performance Monitoring Unit)**. A real PMU sits on the processor die and counts hardware events (cache misses, branch mispredictions, pipeline stalls) without interfering with computation. It exposes counters that the operating system or profiler reads. Similarly, the witness watches agents without modifying their work, counting stall events and reporting metrics.

| Hardware Component | Witness Function |
|-------------------|-----------------|
| PMU event counter | Stall duration tracking per agent |
| PMU overflow interrupt | Escalation when stall exceeds threshold |
| PMU sampling | Periodic patrol loop (5 min default) |
| PMU read-only access | Never modifies agent state or work |

## Key Gastown Source Files

| File | What It Provides |
|------|-----------------|
| `internal/cmd/prime.go` | `RoleWitness` role definition and context injection |
| Witness patrol logic | Periodic agent health scanning |
| `internal/boot/boot.go` | Boot watchdog pattern (witness for the deacon) |
| `internal/cmd/mail.go` | Communication channel for escalations |

## The Patrol Pattern

The witness runs a continuous loop:

1. **Scan:** List all active agents in the rig
2. **Evaluate:** Check each agent's hook activity timestamp against the stall threshold
3. **Act:** Send nudge if stalled; escalate if nudge was already sent
4. **Wait:** Sleep for the patrol interval before the next cycle

This is architecturally identical to a hardware watchdog timer. The difference is that the witness monitors multiple agents (polecats) rather than a single subsystem.

## Supervision Hierarchy

In Gastown's supervision hierarchy:

```
Daemon -> Boot -> Deacon -> Mayor -> Witness -> Polecats/Crew
```

The witness sits between the mayor and the workers. It does not have authority to terminate agents or reassign work. It reports to the mayor, who makes coordination decisions.

## What Changed From Gastown

1. **Language:** Go patrol loops to TypeScript async polling
2. **Communication:** tmux-based nudges replaced with filesystem-based nudge messages
3. **Scope:** Single-rig focus (skill-creator operates within one project)
4. **Stall detection:** Same logic (timestamp comparison), TypeScript implementation
5. **Escalation:** Same graduated protocol (nudge -> alert -> critical), filesystem messages instead of tmux injection
