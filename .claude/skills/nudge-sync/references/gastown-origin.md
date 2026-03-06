# Gastown Origin: Nudge Sync

## Where This Comes From

The nudge-sync skill adapts Gastown's Deacon heartbeat system. In the original Gastown Go codebase, the Deacon is a supervisory process that periodically pings worker agents to verify they are alive and making progress. The "nudge" is the lightest possible communication -- a single file overwritten each time, checked on every poll cycle.

The name "Deacon" comes from Gastown's ecclesiastical naming convention. The Deacon watches over the congregation (worker agents) and reports concerns to the Mayor.

## Key Mapping: Gastown to Skill-Creator

| Gastown Concept | Nudge-Sync Equivalent | Adaptation Notes |
|----------------|---------------------|------------------|
| Deacon heartbeat | `health_check` nudge type | Same supervisory pattern |
| Deacon ping file | `.chipset/state/nudge/{agent-id}/latest.json` | Single-file overwrite preserved |
| Stall detection | `stall_warning` nudge type | Formalized as typed signal |
| Escalation to mayor | Mail-async `health_escalation` | Nudge detects, mail escalates |
| Heartbeat interval | Configurable nudge interval | Same timing concept |
| Response window | `requires_response` + interval | Explicit response protocol |

## Design Decisions

### Why Latest-Wins

Gastown's heartbeat system only cares about the current state. Historical health checks have no value -- if an agent is healthy now, it doesn't matter that it was nudged 10 times before. Discarding history keeps the channel fast and prevents unbounded file accumulation.

### Why Single File Per Agent

One file means one read operation per poll cycle. No directory scan needed, no sorting, no filtering. The agent reads `latest.json` and either processes it or moves on. This makes nudge the fastest channel in the chipset -- essential for its role as the health monitoring layer.

### Why Response Through the Same Channel

When a nudge requires a response, the responding agent writes to the sender's nudge directory. This keeps the response mechanism symmetric -- the witness checks its own `latest.json` for the response, using the same polling pattern it uses for everything else.

### Why Not Use Mail for Health Checks

Mail accumulates. If the witness sends 100 health checks and the polecat only reads mail once per minute, the polecat's mailbox fills with stale health checks. Nudge avoids this entirely -- 100 nudges result in exactly one file on disk.

## What Changed From Gastown

1. **Language:** Go to TypeScript -- async/await replaces goroutines
2. **Named types:** Formalized nudge types (`health_check`, `stall_warning`, `abort`, etc.) -- was a generic ping in Gastown
3. **Response protocol:** Explicit `requires_response` flag and response writing (Gastown used implicit timeouts)
4. **Multi-type:** Nudge carries different signal types, not just health checks (expanded from Gastown's single-purpose Deacon)
5. **Abort signal:** Added `abort` type for immediate work cancellation (new capability)
6. **Serialization:** Sorted-key JSON for deterministic output (consistent with all chipset skills)
