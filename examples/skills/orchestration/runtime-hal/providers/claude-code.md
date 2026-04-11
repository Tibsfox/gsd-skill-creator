# Provider: Claude Code

## Detection Criteria

Claude Code is detected through three signals, checked in order:

1. **GT_RUNTIME=claude** -- explicit override (highest priority)
2. **CLAUDE_SESSION_ID** environment variable present and non-empty
3. **.claude/settings.json** exists in the workspace root

If any of these signals match, the HAL reports `RuntimeProvider = 'claude'` and selects full hook-based strategies.

## Capabilities

| Capability | Status |
|---|---|
| Session hooks | Yes -- `.claude/settings.json` hook definitions |
| Context fork | Yes -- agents can fork context from parent sessions |
| Session ID | `CLAUDE_SESSION_ID` environment variable |
| Startup injection | SessionStart hook fires before first prompt |
| GUPP strategy | `hook_injection` -- rules injected via hooks |
| Stall threshold | 120 seconds (default) |
| Nudge interval | 30 seconds (default) |
| Nudge support | Yes -- filesystem-based nudge messages |

Claude Code is the highest-capability provider. All HAL interface methods return their most capable values when this provider is detected.

## Startup Sequence

Claude Code supports `SessionStart` hooks defined in `.claude/settings.json`. The mayor uses this mechanism to inject agent context before the agent's first prompt.

**Sequence:**

1. Mayor writes the agent's role, assigned bead, and GUPP rules into a hook entry in `.claude/settings.json`
2. Mayor spawns the agent session (new Claude Code instance)
3. Claude Code fires the `SessionStart` hook
4. The hook reads the agent's assignment from the state directory and injects it into context
5. The agent begins execution with full context -- no polling needed

**Hook entry format:**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "command": "cat state/hooks/{agentId}.json",
        "description": "Inject agent assignment and GUPP rules"
      }
    ]
  }
}
```

The hook command reads the agent's hook state file, which contains the work item assignment, GUPP constraints, and role-specific instructions.

## GUPP Strategy: hook_injection

GUPP rules are injected into the session context via the same hook mechanism used for startup. This is the most reliable GUPP enforcement strategy because:

1. **Rules load before the agent can act** -- the SessionStart hook fires before any user prompt
2. **Rules cannot be bypassed** -- they are part of the session context, not optional preamble text
3. **Stall detection is precise** -- hook callbacks update `lastActivity` timestamps in real time

**GUPP enforcement flow:**

```
SessionStart hook fires
  -> Reads state/hooks/{agentId}.json
  -> Injects: role, bead assignment, GUPP constraints
  -> Agent operates under injected constraints
  -> Each tool use updates lastActivity timestamp
  -> Witness monitors lastActivity for stall detection
```

## Session ID Integration

Claude Code sets `CLAUDE_SESSION_ID` as an environment variable for every active session. The HAL exposes this through `getSessionId()`, which other skills use to:

- Tag work items with the session that processed them
- Correlate log entries across agent sessions
- Verify that an agent is still running (session ID presence check)

If the session ID is absent during detection, the HAL falls through to filesystem detection (`.claude/settings.json`). Some edge cases where the session ID is not yet set:

- Hook execution during session initialization (before ID propagation)
- Containerized environments where env vars are stripped
- CI runners that start Claude Code in a non-standard way

## .claude/settings.json Integration

The settings file serves dual purposes for the HAL:

1. **Detection signal** -- its presence indicates a Claude Code environment
2. **Hook definition target** -- the mayor writes hook entries here for agent startup

The HAL reads this file during detection but never writes to it. Writing is the responsibility of the mayor-coordinator skill (which calls `getStartupCommands()` to get the commands and handles file mutation itself).

## Fallback Behavior

If Claude Code is detected but hooks fail to fire (corrupted settings file, permission error), the HAL does not switch providers. The detected provider remains `'claude'`, but the calling skill can detect hook failure through the absence of expected state changes and fall back to polling on its own. The HAL reports capabilities accurately; it does not guarantee they work in every edge case.

## Limitations

- **Single workspace** -- Claude Code hooks are per-workspace; multi-workspace setups require separate HAL detection per workspace
- **Settings file conflicts** -- if multiple agents write to `.claude/settings.json` concurrently, hook entries can be lost; the mayor must serialize hook writes
- **Session ID propagation delay** -- CLAUDE_SESSION_ID may not be available during the earliest phases of session initialization
