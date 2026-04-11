# Provider: Fallback (Unknown Runtime)

## Detection Criteria

The fallback provider is selected when no other provider matches. This happens when:

1. `GT_RUNTIME` is not set (or set to an unrecognized value)
2. `CLAUDE_SESSION_ID` is not present
3. `.claude/settings.json` does not exist in the workspace
4. No known runtime binary is found in the process tree

The fallback provider is the terminal state of the detection cascade. It always succeeds -- there is no state below fallback.

## Capabilities

| Capability | Status |
|---|---|
| Session hooks | No |
| Context fork | No |
| Session ID | None |
| Startup injection | None -- agent starts generic, polls for assignment |
| GUPP strategy | `polling` -- agent periodically checks hook state file |
| Stall threshold | 300 seconds (default, generous due to polling latency) |
| Nudge interval | 120 seconds (default, matched to polling frequency) |
| Nudge support | Yes -- filesystem-based nudge messages |

The fallback provider is the lowest-capability configuration. It provides no runtime-specific integration but guarantees operational behavior through filesystem polling.

## Design Contract: No Crash, No Hang

The fallback provider's fundamental guarantee is graceful degradation:

1. **No crash** -- every HAL interface method returns a valid value; no exceptions thrown
2. **No hang** -- polling uses bounded intervals; no blocking waits; no infinite loops
3. **No error** -- `detectProvider()` returns `'unknown'` (a valid RuntimeProvider); no error codes
4. **Operational** -- work items flow through polling; agents execute; merges happen; convoys progress

This contract exists because the fallback provider runs in environments the chipset has never seen. The HAL cannot predict what capabilities exist, so it assumes the minimum and lets the agent operate at reduced speed rather than not at all.

## Startup Sequence

Without hooks or startup injection, the agent starts with no assignment context. It immediately enters a polling loop to discover its work.

**Sequence:**

1. Mayor writes the agent's assignment to `state/hooks/{agentId}.json`
2. Agent starts with a generic context (role and rig, but no specific bead assignment)
3. Agent enters polling loop: checks `state/hooks/{agentId}.json` every `nudgeInterval` seconds
4. When the hook state file contains a work item with status `pending`, the agent picks it up
5. Agent transitions hook status to `active` and begins execution

**Polling loop:**

```
Agent starts (no assignment)
  -> Check state/hooks/{agentId}.json
  -> Hook status is 'pending'?
       yes -> Read work item, set status to 'active', begin execution
       no  -> Wait nudgeInterval seconds, check again
```

**Startup latency:** The worst case is one full nudge interval (120s default) between when the mayor writes the assignment and when the agent discovers it. Average case is half the interval (60s). This is significantly slower than hook_injection (near-instant) or startup_fallback (seconds), but it works in every environment.

## GUPP Strategy: polling

GUPP rules are written to the hook state file alongside the work item assignment. The agent reads GUPP constraints each time it polls.

**GUPP enforcement flow:**

```
Mayor writes GUPP rules to state/hooks/{agentId}.json
  -> Agent polls hook file at nudgeInterval
  -> Reads GUPP constraints (stall threshold, allowed operations, scope)
  -> Operates under those constraints until next poll
  -> Each poll also updates lastActivity timestamp
  -> Witness monitors lastActivity for stall detection
```

**Advantage over startup_fallback:** Because the agent re-reads the hook file on every poll cycle, GUPP rules can be updated mid-session. The mayor can modify the hook state file, and the agent will pick up the new constraints on its next poll. This is slower than hook_injection but more flexible than startup_fallback.

**Disadvantage:** There is a window between GUPP rule updates and the agent's next poll where the agent operates under stale constraints. The maximum staleness equals the nudge interval.

## Stall Detection

Stall detection in the fallback provider is inherent in the polling mechanism:

1. Each time the agent polls its hook state file, it updates the `lastActivity` timestamp
2. The witness monitors this timestamp against the stall threshold (300s default)
3. If `lastActivity` is older than the threshold, the agent is declared stalled

**Why 300 seconds?** The nudge interval is 120s, so the agent updates `lastActivity` at most every 120s. The stall threshold must be greater than the nudge interval to avoid false positives. 300s allows for approximately 2.5 missed polls before declaring a stall, accounting for:

- Normal polling jitter (system load, I/O delays)
- One missed poll cycle (agent busy with a long operation)
- Network/filesystem latency in shared environments

## Nudge Messages

When the witness declares an agent stalled, it sends a nudge message to `state/mail/{agentId}/`. The agent checks this directory as part of its polling loop.

**Nudge response:**

```
Agent polls mail directory
  -> Nudge message found?
       yes -> Read nudge, report status (write response to state/mail/witness/)
       no  -> Continue normal polling
```

Nudge messages are non-durable (the witness does not expect a guaranteed response). If the agent misses a nudge because it was between poll cycles, the witness will send another nudge after the next stall threshold window.

## Polling Interval Configuration

The default nudge interval (120s) balances responsiveness against filesystem I/O:

- **Shorter intervals** (30-60s): More responsive but generates more filesystem reads; appropriate for fast local SSDs
- **Longer intervals** (180-300s): Less responsive but reduces I/O; appropriate for network filesystems or high-latency shared storage
- **Override:** Set `GT_NUDGE_INTERVAL` environment variable to customize

The nudge interval also determines the maximum GUPP staleness and the minimum time between `lastActivity` updates for stall detection.

## When Fallback Activates in Practice

Common scenarios where the fallback provider is selected:

1. **CI/CD environments** -- containers or runners without Claude Code or Codex installed
2. **Custom runtimes** -- new AI coding assistants the HAL does not yet recognize
3. **Manual testing** -- developer running chipset commands directly from a terminal
4. **Stripped environments** -- containers where environment variables and process trees are sanitized
5. **Future runtimes** -- any runtime released after the HAL was written; fallback ensures forward compatibility

## Limitations

- **High startup latency** -- up to one full nudge interval before the agent discovers its assignment
- **GUPP staleness window** -- up to one nudge interval of stale constraints after rule changes
- **No session ID** -- `getSessionId()` returns null; session correlation unavailable
- **No context forking** -- each agent starts completely fresh
- **Filesystem dependency** -- polling requires reliable filesystem access; corrupted state files cause agent confusion
- **Conservative thresholds** -- 300s stall / 120s nudge means slow detection of real stalls; operators may want to tune these down for responsive environments
