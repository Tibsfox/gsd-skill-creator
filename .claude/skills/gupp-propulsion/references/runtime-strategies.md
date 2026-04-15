# GUPP — Per-Runtime Enforcement Strategies

Runtime-specific enforcement detail for `gupp-propulsion`. Loaded on demand; the core principle and safety boundaries live in `../SKILL.md`.

GUPP enforcement adapts to each runtime's capabilities through the Runtime HAL. The HAL detects the active runtime and GUPP selects the highest-fidelity enforcement mechanism available.

## Claude Code

Claude Code provides the richest enforcement surface through its session hooks system.

| Layer | Mechanism | Details |
|-------|-----------|---------|
| Primary | `hook_injection` | SessionStart hook in `.claude/settings.json` injects GUPP rules and work context before the agent's first prompt. The agent starts in autonomous mode with zero setup latency. |
| Secondary | `prompt_preamble` | AUTONOMOUS WORK MODE template prepended to agent context. Reinforces GUPP when hooks fire inconsistently. |
| Enforcement | `deacon_heartbeat` | Witness runs the Deacon heartbeat patrol at 2-minute intervals. Detects agents that received hooks but stalled before beginning work. |
| Watchdog | `boot_restart` | If an agent remains stalled for 5+ minutes after hook injection, the watchdog requests a session restart. The restarted session re-fires the SessionStart hook, giving GUPP another chance. |

## Codex

Codex lacks session hooks. GUPP uses startup command injection as the primary strategy.

| Layer | Mechanism | Details |
|-------|-----------|---------|
| Primary | `startup_fallback` | `gt prime` command injected via tmux sends the agent's role, bead assignment, and GUPP rules through the startup context. |
| Secondary | `prompt_preamble` | AUTONOMOUS WORK MODE template in agent context. |
| Enforcement | `nudge_loop` | Witness sends nudges at 1-minute intervals for stall detection. Shorter interval compensates for lower hook fidelity. |
| Watchdog | `boot_restart` | Session restart after sustained stall. |

## Gemini

Gemini has no hook support and limited startup injection. GUPP relies on polling.

| Layer | Mechanism | Details |
|-------|-----------|---------|
| Primary | `prompt_preamble` | GUPP rules prepended to the agent's prompt context. This is the only reliable injection point. |
| Secondary | `polling` | Agent polls `state/hooks/{agentId}.json` on a timer to detect new work assignments. |
| Enforcement | `nudge_loop` | Witness sends nudges at the configured interval. |
| Watchdog | `boot_restart` | Session restart after sustained stall. |

## Cursor

Cursor has session-level tool access but no hook primitives. GUPP uses the same strategy as Gemini (prompt preamble + polling).

## Strategy Selection

The Runtime HAL exposes `getGUPPStrategy()` which returns the primary strategy for the detected runtime. Other chipset skills call this method without knowing which runtime is active:

```typescript
const hal = detectRuntime();
const strategy = hal.getGUPPStrategy();

switch (strategy) {
  case 'hook_injection':
    // Claude Code path: inject via SessionStart hook
    break;
  case 'startup_fallback':
    // Codex path: inject via gt prime command
    break;
  case 'polling':
    // Gemini/Cursor/unknown path: agent polls for assignments
    break;
}
```

## Configurable Thresholds

All GUPP timing parameters are configurable through the chipset YAML. Defaults are tuned for typical LLM agent behavior but can be adjusted per-project or per-runtime based on observed performance.

```yaml
gupp:
  thresholds:
    stall_detection: 300    # seconds (5 min) -- time before declaring an agent stalled
    nudge_interval: 120     # seconds (2 min) -- time between heartbeat checks
    restart_threshold: 600  # seconds (10 min) -- time before requesting session restart
```

### Threshold Reference

| Parameter | Default | Range | Purpose |
|-----------|---------|-------|---------|
| `stall_detection` | 300s (5 min) | 60s - 1800s | How long an agent can be idle with hooked work before it is considered stalled |
| `nudge_interval` | 120s (2 min) | 30s - 600s | How often the Deacon heartbeat checks each active agent |
| `restart_threshold` | 600s (10 min) | 120s - 1800s | How long a stalled agent can remain unresponsive before a restart is requested |

The Runtime HAL provides per-runtime defaults that override the chipset YAML defaults when a specific runtime is detected. For example, Claude Code uses a 120s stall threshold (the hook system makes stalls more detectable) while Gemini uses 300s (polling introduces latency).

## Deacon Heartbeat Pattern

The Deacon heartbeat is the supervision loop that enforces GUPP across all active agents. It runs independently of any individual agent session — typically inside the witness-observer or as a standalone patrol process.

```
1. Timer fires (every nudge_interval seconds)
2. For each agent with an active hook:
   a. Read last_activity timestamp from state file
   b. If now - last_activity > stall_detection:
      i.  Send nudge via nudge-sync
      ii. Record nudge timestamp and count
3. For each previously nudged agent:
   a. If still stalled after nudge_interval:
      i.  Escalate to witness-observer
      ii. Witness sends health_escalation mail to mayor
4. For each agent past restart_threshold:
   a. Request boot restart via Runtime HAL
   b. Increment restart counter for this bead
   c. If restart_count >= 3: escalate to human
```

The full heartbeat protocol is documented in the skill's `heartbeat.md`.
