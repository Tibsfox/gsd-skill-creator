# Provider: Codex

## Detection Criteria

Codex is detected through two signals, checked in order:

1. **GT_RUNTIME=codex** -- explicit override (highest priority)
2. **Process tree contains `codex` binary** -- detected during process tree scan (Step 4 of cascade)

Codex does not set `CLAUDE_SESSION_ID` and does not use `.claude/settings.json`, so Steps 2 and 3 of the detection cascade do not match. Detection relies on the explicit override or the process tree scan.

## Capabilities

| Capability | Status |
|---|---|
| Session hooks | No -- Codex does not support hook definitions |
| Context fork | No -- agents cannot fork context from parent sessions |
| Session ID | `GT_SESSION_ID` environment variable (set by gt prime) |
| Startup injection | `gt prime` command with role and assignment flags |
| GUPP strategy | `startup_fallback` -- rules baked into startup context |
| Stall threshold | 180 seconds (default, longer than Claude Code due to slower feedback) |
| Nudge interval | 60 seconds (default) |
| Nudge support | Yes -- filesystem-based nudge messages |

Codex is a medium-capability provider. It lacks hooks and context forking, but supports structured startup injection through the `gt prime` command.

## Startup Sequence

Since Codex does not support session hooks, the mayor uses the `gt prime` command to inject agent context at startup time. The agent receives its full context through command-line arguments rather than hook callbacks.

**Sequence:**

1. Mayor writes the agent's assignment to `state/hooks/{agentId}.json`
2. Mayor runs `gt prime --role {role} --agent {agentId} --rig {rigName}`
3. The `gt prime` command reads the hook state file and constructs a startup prompt
4. Codex starts with the constructed prompt as initial context
5. The agent begins execution with full context -- no polling needed for initial assignment

**gt prime command:**

```bash
gt prime \
  --role polecat \
  --agent polecat-alpha \
  --rig my-rig \
  --state-dir .chipset/state/
```

The `gt prime` command:
- Reads `state/hooks/polecat-alpha.json` for the work item assignment
- Reads `state/agents/polecat-alpha.json` for role and rig context
- Constructs a startup prompt with GUPP rules embedded
- Launches the Codex session with the constructed prompt

## GUPP Strategy: startup_fallback

GUPP rules are embedded in the agent's startup prompt by `gt prime`. Once the agent starts, the GUPP constraints are fixed for the duration of the session. The agent cannot receive updated GUPP rules mid-session (unlike Claude Code, where hook injection can update constraints).

**GUPP enforcement flow:**

```
gt prime constructs startup prompt
  -> Embeds: role, bead assignment, GUPP constraints
  -> Codex session starts with embedded context
  -> Agent operates under startup constraints
  -> Stall detection via filesystem: witness watches hook file mtime
  -> If stalled: witness sends nudge via state/mail/
```

**Key difference from hook_injection:** If GUPP rules need to change mid-session (e.g., reassigning a bead), the agent must be terminated and restarted with new `gt prime` arguments. There is no way to inject updated rules into a running Codex session.

## Session ID: GT_SESSION_ID

The `gt prime` command sets `GT_SESSION_ID` as an environment variable when launching the Codex session. This serves the same purpose as `CLAUDE_SESSION_ID` in Claude Code: session correlation, log tagging, and liveness verification.

Unlike `CLAUDE_SESSION_ID`, `GT_SESSION_ID` is set by the Gastown tooling (not by Codex itself). If the agent is started without `gt prime`, this variable is absent. The HAL's `getSessionId()` checks both `CLAUDE_SESSION_ID` and `GT_SESSION_ID` and returns whichever is present.

## Nudge Loop Enforcement

Because Codex lacks hooks, stall detection cannot rely on hook callbacks. Instead, the witness monitors the hook state file's modification time:

1. When the agent completes work on a bead, it updates `state/hooks/{agentId}.json` with a new `lastActivity` timestamp
2. The witness periodically checks this timestamp against the stall threshold (180s default)
3. If the timestamp is stale, the witness sends a nudge message to `state/mail/{agentId}/`
4. The agent's nudge loop checks its mail directory every 60 seconds and responds to nudges

**Nudge loop in the agent:**

```
Every 60 seconds:
  -> Check state/mail/{agentId}/ for new messages
  -> If nudge found: acknowledge and report status
  -> If no nudge: continue working
```

This is less responsive than Claude Code's hook-based stall detection (which updates in real time) but provides reliable coverage for the no-hooks environment.

## Fallback Behavior

If Codex is detected but `gt prime` fails (binary not found, state directory missing), the HAL does not switch providers. The detected provider remains `'codex'`, and the calling skill receives the `startup_fallback` strategy. If startup fails, the mayor should retry or fall back to manual agent initialization (writing the assignment file and relying on the agent's polling loop).

## Limitations

- **No mid-session GUPP updates** -- rules are fixed at startup; changes require agent restart
- **No context forking** -- each agent starts fresh; no shared context inheritance
- **gt prime dependency** -- startup injection requires the gt binary; if unavailable, falls back to polling
- **Longer stall detection** -- filesystem-based monitoring adds latency compared to hook callbacks
- **GT_SESSION_ID is optional** -- only set by gt prime; direct Codex invocation has no session ID
