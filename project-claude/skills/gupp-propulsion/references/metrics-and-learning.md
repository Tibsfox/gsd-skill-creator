# GUPP — Observable Metrics and Learning Feedback Loop

Metrics reference for `gupp-propulsion`. Loaded on demand; core activation rules live in `../SKILL.md`.

GUPP exposes these metrics for skill-creator's pattern detection and adaptive learning. Over time, skill-creator proposes refinements to thresholds and strategy selections based on observed effectiveness.

## GUPP Response Time

Time elapsed from hook assignment to first work activity (first commit, first file edit, or first status update). Measured per-agent, per-session.

```
gupp_response_time_seconds{agent="polecat-alpha", runtime="claude"} 12.4
```

Ideal: under 30 seconds for Claude Code (hook injection), under 60 seconds for Codex (startup fallback), under 120 seconds for Gemini (polling).

## Nudge Effectiveness

Boolean per-nudge: did the agent resume work within `nudge_interval` seconds after receiving the nudge? Tracks whether nudges are actually fixing stalls or just adding noise.

```
gupp_nudge_effective{agent="polecat-alpha", nudge_id="n-001"} true
gupp_nudge_effective{agent="polecat-beta", nudge_id="n-002"} false
```

A nudge effectiveness rate below 50% suggests the stall detection threshold is too aggressive (false positives) or the agent is genuinely stuck and needs restart rather than nudging.

## Strategy Success Rate

Per-runtime success rate: what percentage of GUPP activations result in the agent beginning work within the expected response window? Tracks which primary strategy produces the fastest, most reliable GUPP response.

```
gupp_strategy_success_rate{runtime="claude", strategy="hook_injection"} 0.94
gupp_strategy_success_rate{runtime="codex", strategy="startup_fallback"} 0.78
gupp_strategy_success_rate{runtime="gemini", strategy="polling"} 0.65
```

## Stall Frequency

How often agents stall per session. A session with zero stalls is ideal. High stall frequency may indicate a systemic issue (context window exhaustion, ambiguous work items, missing dependencies).

```
gupp_stalls_per_session{runtime="claude"} 0.3
gupp_stalls_per_session{runtime="codex"} 1.1
```

## Learning Feedback Loop

Skill-creator observes these metrics across sessions and proposes adjustments:

1. **Threshold tuning:** If stall detection fires frequently but nudge effectiveness is low, increase `stall_detection` to reduce false positives.
2. **Strategy switching:** If a runtime's primary strategy has low success rate, recommend switching to the secondary.
3. **Interval optimization:** If nudge effectiveness is high but response time is long, decrease `nudge_interval` for faster recovery.
4. **Restart policy:** If restarts consistently fix stalls, the agent may need better initial context (improve hook injection quality).

## Restart Limit Implementation

After 3 restarts for the same bead without resolution, GUPP stops attempting automated recovery and escalates to a human operator:

```typescript
if (restartCount >= 3) {
  const escalation: AgentMessage = {
    from: witnessId,
    to: 'mayor',
    channel: 'mail',
    payload: `HUMAN_ESCALATION: ${beadId} has stalled ${restartCount} times. ` +
             `Automated recovery exhausted. Requires human intervention.`,
    timestamp: new Date().toISOString(),
    durable: true,
  };
  // Mayor surfaces this to the human operator
}
```

The mayor receives the escalation and surfaces it through whatever channel the human is monitoring (terminal output, notification file, log). GUPP does not attempt a fourth restart.
