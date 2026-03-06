# GUPP Propulsion: Boundaries

## Advisory Nature

GUPP is an execution enforcement mechanism, not a governance system. It operates within the structural boundaries set by higher-authority systems. Understanding where GUPP stops is as important as understanding where it starts.

### GUPP Is Advisory in GSD

The GSD orchestrator controls *what* gets executed, *when* phases transition, and *whether* work passes verification gates. GUPP controls *how urgently* an agent acts on assigned work. These are orthogonal concerns with a clear hierarchy:

```
Authority Hierarchy (highest to lowest):

1. Human operator         -- can override anything
2. GSD orchestrator       -- phase gates, checkpoints, verification
3. GUPP propulsion        -- execution timing enforcement
4. Agent autonomy         -- must obey all three above
```

GUPP never overrides GSD decisions. Specific cases:

| GSD Situation | GUPP Behavior |
|--------------|---------------|
| Phase gate requires human verification | GUPP does NOT force execution past the gate |
| Checkpoint blocks pending decision | GUPP does NOT auto-select and proceed |
| Verification step fails | GUPP does NOT retry without orchestrator approval |
| Plan is paused by orchestrator | GUPP does NOT resume execution |
| Plan is complete | GUPP deactivates; no work to enforce |

### Where GUPP Does Apply

Within the space that GSD has approved -- an active phase, an approved plan, a committed task -- GUPP has full authority over execution timing:

| Approved Context | GUPP Authority |
|-----------------|----------------|
| Task assigned to agent via hook | Agent must begin immediately |
| Agent stalls during approved task | GUPP triggers nudge/escalation |
| Agent waits for user input unnecessarily | GUPP identifies this as a stall |
| Agent summarizes instead of executing | GUPP enforcement intervenes |

GUPP fills the gap between "the orchestrator said to do this task" and "the agent actually starts doing it."

## Restart Limits

The watchdog restart mechanism prevents infinite restart loops through hard limits at multiple levels.

### Maximum Restart Threshold

The `restart_threshold` configuration sets how long a stalled agent waits before a restart is requested. This value has a hard cap:

| Parameter | Configurable Range | Hard Cap |
|-----------|-------------------|----------|
| `restart_threshold` | 120s - 1800s | 1800s (30 min) |

Setting `restart_threshold` above 1800s in the chipset YAML is silently clamped to 1800. This prevents configurations that allow agents to stall for unreasonably long periods before any automated recovery.

### Maximum Restarts Per Bead

Each work item (bead) tracks how many times its assigned agent has been restarted. After 3 restarts for the same bead, automated recovery stops:

```
Restart 1: Session restart, GUPP re-injection
Restart 2: Session restart, GUPP re-injection (may adjust strategy)
Restart 3: Session restart, GUPP re-injection (final automated attempt)
Restart 4: BLOCKED -- mandatory human escalation
```

The restart counter is stored in the bead's state file (`state/hooks/{agentId}.json`) and persists across sessions. Clearing the counter requires human action (resetting the bead or assigning it to a different agent).

### Restart Cooldown

Consecutive restarts for the same agent must be separated by at least 60 seconds. This prevents rapid restart loops where a restart immediately triggers another stall detection:

```
Restart at T=0
  -> Agent starts
  -> Agent stalls at T=5s (context issue)
  -> Stall detected at T=125s (nudge_interval)
  -> Cooldown check: T=125s - T=0 = 125s > 60s -> OK, restart allowed
```

Without the cooldown, a pathological case could trigger a restart every `nudge_interval` seconds, consuming resources without progress.

## Human Escalation Rules

### When Escalation Triggers

Human escalation is mandatory in these situations:

1. **3-restart limit reached:** The same bead has caused 3 agent restarts without resolution. The work item likely has a structural problem (ambiguous requirements, missing dependencies, impossible scope) that no amount of agent restarts will fix.

2. **Restart threshold exceeded with no restart capability:** The Runtime HAL reports that the current runtime does not support session restarts. GUPP cannot enforce its watchdog. After the stall threshold plus one nudge interval with no recovery, escalation to human is the only option.

3. **Witness reports critical stall:** The witness classifies a stall as `critical` (two nudges sent, no response). GUPP surfaces this to the mayor, who surfaces it to the human.

### Escalation Message Format

Escalation messages are sent via durable mail to the mayor, who surfaces them through the human operator's monitoring channel:

```json
{
  "from": "witness-d3e4f",
  "to": "mayor-a1b2c",
  "type": "health_escalation",
  "subject": "HUMAN_ESCALATION: bead-x7y8z requires human intervention",
  "body": "Bead bead-x7y8z assigned to polecat-alpha has stalled 3 times. Restart history: [T1: context exhaustion, T2: stall after 4min, T3: stall after 2min]. Automated recovery exhausted. Possible causes: ambiguous requirements, missing dependency, scope exceeds single-agent capacity.",
  "timestamp": "2026-03-05T10:45:00Z",
  "read": false,
  "priority": "urgent"
}
```

### What the Human Can Do

After escalation, the human operator has these options:

| Action | Effect |
|--------|--------|
| Reset the bead's restart counter | Allows 3 more automated restart attempts |
| Reassign the bead to a different agent | Fresh agent may succeed where the first failed |
| Split the bead into smaller work items | Reduces scope per agent, improving success rate |
| Clarify the bead's requirements | Fixes the root cause if the problem was ambiguity |
| Mark the bead as blocked | Removes it from the dispatch queue until resolved |
| Cancel the bead | Removes the work item entirely |

GUPP does not presume to know which action is correct. It detects the problem, exhausts automated recovery, and hands control to a human.

## Threshold Constraints

### Minimum Values

All thresholds have minimum values to prevent pathological configurations:

| Parameter | Minimum | Reason |
|-----------|---------|--------|
| `stall_detection` | 60s | Agents need at least 1 minute to set up context and begin work |
| `nudge_interval` | 30s | Nudges more frequent than 30s create excessive filesystem I/O |
| `restart_threshold` | 120s | Must be at least 2x nudge_interval to allow nudge recovery |

### Maximum Values

| Parameter | Maximum | Reason |
|-----------|---------|--------|
| `stall_detection` | 1800s (30 min) | Stalls longer than 30 minutes are almost certainly real |
| `nudge_interval` | 600s (10 min) | Nudges less frequent than 10 minutes defeat the purpose of heartbeat supervision |
| `restart_threshold` | 1800s (30 min) | Hard cap prevents indefinite stall tolerance |

### Relationship Constraints

The thresholds must satisfy ordering relationships:

```
nudge_interval < stall_detection < restart_threshold
```

If the configuration violates this ordering, GUPP clamps the values:
- If `nudge_interval >= stall_detection`, nudge_interval is set to `stall_detection / 2`
- If `stall_detection >= restart_threshold`, stall_detection is set to `restart_threshold / 2`

## Anti-Patterns

### GUPP as Task Manager

GUPP does not decide what work to do. It does not prioritize tasks, schedule dispatch, or manage queues. If an agent has two beads somehow assigned (which should never happen -- one hook per agent), GUPP does not choose between them. The mayor and sling-dispatch handle task management.

### GUPP as Quality Gate

GUPP does not evaluate the quality of work produced. An agent executing garbage code at full speed satisfies GUPP. Quality evaluation is the witness-observer's and refinery-merge's responsibility. GUPP cares only about execution timing, not execution quality.

### Overriding Checkpoints

GUPP must never bypass a GSD checkpoint. If an agent encounters a `type="checkpoint:human-verify"` task, it stops and returns the checkpoint message. GUPP does not classify this as a stall. A checkpoint-blocked agent is in a valid state -- waiting for human input by design, not by trained passivity.

### Aggressive Thresholds

Setting `stall_detection` to 60s and `nudge_interval` to 30s may seem like "maximum enforcement" but in practice causes:

1. False positives during normal work (agent is committing, not stalled)
2. Excessive nudge traffic (filesystem writes every 30s per agent)
3. Witness spending more time nudging than observing
4. Nudge effectiveness dropping (agents learn to ignore frequent false nudges)

The defaults (300s stall, 120s nudge, 600s restart) are tuned for typical LLM agent behavior. Adjust conservatively based on observed metrics.

### Infinite Restart Loops

Without the 3-restart limit, a pathological scenario exists:

```
Agent starts -> stalls -> restart -> starts -> stalls -> restart -> ...
```

This consumes resources (new context windows, new sessions) without making progress. The 3-restart limit with human escalation breaks the loop and forces root-cause investigation.

## Scope of Enforcement

### What GUPP Enforces

- Agents with hooked work must begin execution promptly
- Stalled agents are detected and nudged
- Persistent stalls trigger graduated escalation
- Session restarts are attempted (with limits) for unresponsive agents

### What GUPP Does Not Enforce

- Work quality (correctness, completeness, code style)
- Commit frequency or message format
- Branch naming conventions
- Test coverage or passing rate
- Communication frequency beyond nudge responses
- Phase transition or plan completion criteria
