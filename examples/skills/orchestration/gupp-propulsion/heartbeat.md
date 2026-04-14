# Deacon Heartbeat: Supervision Pattern

The Deacon heartbeat is the supervision loop that enforces GUPP timing across all active agents. It runs independently of any individual agent session, typically inside the witness-observer process or as a standalone patrol. The pattern converts passive stall detection (waiting for agents to report problems) into active health monitoring (checking each agent on a fixed schedule).

In hardware terms, the Deacon is a watchdog timer. Real embedded systems use watchdog timers to detect when the main processing loop has hung -- if the software does not "pet the dog" (write to a register) within a timeout window, the watchdog resets the processor. The Deacon works identically: each agent must update its activity timestamp within the stall threshold, or the Deacon triggers recovery.

## Heartbeat Loop

The Deacon heartbeat runs as a repeating cycle with a fixed period equal to the configured `nudge_interval`.

### Loop Structure

```
[START]
   |
   v
1. TIMER FIRES (every nudge_interval seconds)
   |
   v
2. SCAN active agents
   |  - Read state/agents/ for all agents with status='active'
   |  - Filter to agents with active hooks (hook.status='active')
   |
   v
3. CHECK each agent's last_activity timestamp
   |  - Read state/hooks/{agentId}.json -> lastActivity field
   |  - Calculate elapsed = now - lastActivity
   |
   v
4. EVALUATE against thresholds
   |  - elapsed < stall_detection? -> agent is healthy, skip
   |  - elapsed >= stall_detection? -> agent may be stalled
   |
   v
5. ACT based on stall state and history
   |  - First detection? -> send nudge (step 5a)
   |  - Previously nudged, still stalled? -> escalate to witness (step 5b)
   |  - Past restart_threshold? -> request restart (step 5c)
   |  - 3+ restarts for same bead? -> escalate to human (step 5d)
   |
   v
6. RECORD metrics
   |  - Log nudge sent/not-sent per agent
   |  - Update nudge effectiveness tracking
   |  - Record stall frequency
   |
   v
[WAIT nudge_interval seconds, then loop to START]
```

### Pseudocode

```typescript
interface DeaconState {
  nudgeCounts: Map<string, number>;       // agentId -> nudges sent this stall
  lastNudgeTime: Map<string, string>;     // agentId -> ISO timestamp of last nudge
  restartCounts: Map<string, number>;     // beadId -> restart count
  lastRestartTime: Map<string, string>;   // agentId -> ISO timestamp of last restart
}

async function deaconHeartbeat(
  state: StateManager,
  config: GUPPThresholds,
  deacon: DeaconState
): Promise<void> {

  // Step 2: Scan active agents
  const agents = await state.listAgents({ status: 'active' });

  for (const agent of agents) {
    // Step 2 (cont): Filter to agents with active hooks
    const hook = await state.getHook(agent.id);
    if (!hook || hook.status !== 'active') continue;
    if (!hook.workItem) continue;

    // Step 3: Check last activity
    const lastActivity = new Date(hook.lastActivity).getTime();
    const elapsed = (Date.now() - lastActivity) / 1000; // seconds

    // Step 4: Evaluate against stall threshold
    if (elapsed < config.stall_detection) {
      // Agent is healthy -- clear any stale nudge tracking
      deacon.nudgeCounts.delete(agent.id);
      continue;
    }

    // Step 5: Agent is stalled -- determine action
    const nudgeCount = deacon.nudgeCounts.get(agent.id) ?? 0;
    const beadId = hook.workItem.beadId;
    const restartCount = deacon.restartCounts.get(beadId) ?? 0;

    // Step 5d: Check human escalation threshold first
    if (restartCount >= 3) {
      await escalateToHuman(state, agent, hook, restartCount);
      continue;
    }

    // Step 5c: Check restart threshold
    if (elapsed >= config.restart_threshold && nudgeCount >= 1) {
      await requestRestart(state, agent, hook, deacon);
      continue;
    }

    // Step 5b: Check if previously nudged and still stalled
    if (nudgeCount >= 1) {
      const lastNudge = deacon.lastNudgeTime.get(agent.id);
      if (lastNudge) {
        const sinceLast = (Date.now() - new Date(lastNudge).getTime()) / 1000;
        if (sinceLast >= config.nudge_interval) {
          await escalateToWitness(state, agent, hook, nudgeCount);
          // Also send another nudge
          await sendNudge(state, agent, hook);
          deacon.nudgeCounts.set(agent.id, nudgeCount + 1);
          deacon.lastNudgeTime.set(agent.id, new Date().toISOString());
        }
      }
      continue;
    }

    // Step 5a: First detection -- send nudge
    await sendNudge(state, agent, hook);
    deacon.nudgeCounts.set(agent.id, 1);
    deacon.lastNudgeTime.set(agent.id, new Date().toISOString());
  }
}
```

## Step Details

### Step 5a: Send Nudge

When a stall is first detected (agent has hooked work, last activity exceeds stall threshold, no prior nudges), the Deacon sends a nudge through the nudge-sync channel.

```typescript
async function sendNudge(
  state: StateManager,
  agent: AgentIdentity,
  hook: HookState
): Promise<void> {
  const nudge: NudgeMessage = {
    from: 'deacon',
    type: 'health_check',
    message: `GUPP: you have hooked work (${hook.workItem!.beadId}). ` +
             `No activity for ${elapsed}s. Are you working?`,
    timestamp: new Date().toISOString(),
    requires_response: true,
  };

  // Write to .chipset/state/nudge/{agentId}/latest.json
  await writeNudge(agent.id, nudge);
}
```

The nudge uses `requires_response: true`, meaning the agent must write a response nudge within the next nudge interval. If the agent is genuinely working (slow commit, long test run), it responds and the stall clears. If the agent is stuck, no response arrives and the Deacon escalates.

**Expected outcomes:**

| Agent State | Response | Deacon Action |
|-------------|----------|---------------|
| Working but slow | Responds with status update | Clear stall tracking, resume normal monitoring |
| Context exhaustion | No response | Escalate on next cycle |
| Session crashed | No response | Escalate on next cycle |
| Waiting for user (trained passivity) | May or may not respond | Escalate if no response; nudge text reinforces GUPP |

### Step 5b: Escalate to Witness

If the agent has been nudged at least once and remains stalled after another `nudge_interval` period, the Deacon escalates to the witness-observer. The witness has broader context about rig health and can correlate stalls across multiple agents.

```typescript
async function escalateToWitness(
  state: StateManager,
  agent: AgentIdentity,
  hook: HookState,
  nudgeCount: number
): Promise<void> {
  const escalation: AgentMessage = {
    from: 'deacon',
    to: 'witness',
    channel: 'mail',
    payload: `STALL_ALERT: ${agent.id} stalled on ${hook.workItem!.beadId}. ` +
             `${nudgeCount} nudge(s) sent, no recovery. ` +
             `Last activity: ${hook.lastActivity}`,
    timestamp: new Date().toISOString(),
    durable: true,
  };

  // Write to .chipset/state/mail/witness/{timestamp}-deacon.json
  await sendMail(escalation);
}
```

The witness receives the escalation and applies its own classification logic (`warning`, `alert`, `critical`) before deciding whether to notify the mayor. The Deacon does not bypass the witness -- it follows the established escalation hierarchy.

### Step 5c: Request Boot Restart

If the agent remains stalled past the `restart_threshold` and has received at least one nudge, the Deacon requests a session restart through the Runtime HAL.

```typescript
async function requestRestart(
  state: StateManager,
  agent: AgentIdentity,
  hook: HookState,
  deacon: DeaconState
): Promise<void> {
  const beadId = hook.workItem!.beadId;

  // Check restart cooldown (60s minimum between restarts)
  const lastRestart = deacon.lastRestartTime.get(agent.id);
  if (lastRestart) {
    const sinceRestart = (Date.now() - new Date(lastRestart).getTime()) / 1000;
    if (sinceRestart < 60) return; // Cooldown not elapsed
  }

  // Check restart capability via HAL
  const hal = detectRuntime();
  const canRestart = hal.supportsRestart?.() ?? false;

  if (!canRestart) {
    // Runtime does not support restart -- escalate to human
    await escalateToHuman(state, agent, hook, 999);
    return;
  }

  // Increment restart counter for this bead
  const restartCount = (deacon.restartCounts.get(beadId) ?? 0) + 1;
  deacon.restartCounts.set(beadId, restartCount);
  deacon.lastRestartTime.set(agent.id, new Date().toISOString());

  // Send restart request to mayor (mayor executes the restart)
  const restartMsg: AgentMessage = {
    from: 'deacon',
    to: 'mayor',
    channel: 'mail',
    payload: `RESTART_REQUEST: ${agent.id} stalled on ${beadId}. ` +
             `Restart #${restartCount} of 3.`,
    timestamp: new Date().toISOString(),
    durable: true,
  };
  await sendMail(restartMsg);

  // Clear nudge tracking (fresh start after restart)
  deacon.nudgeCounts.delete(agent.id);
  deacon.lastNudgeTime.delete(agent.id);
}
```

The Deacon does not restart the agent directly -- it sends a restart request to the mayor, who coordinates the actual session restart. This preserves the topology's coordination/execution separation.

### Step 5d: Escalate to Human

After 3 restarts for the same bead, automated recovery is exhausted. The Deacon sends a mandatory human escalation through the mayor.

```typescript
async function escalateToHuman(
  state: StateManager,
  agent: AgentIdentity,
  hook: HookState,
  restartCount: number
): Promise<void> {
  const beadId = hook.workItem!.beadId;

  const escalation: AgentMessage = {
    from: 'deacon',
    to: 'mayor',
    channel: 'mail',
    payload: `HUMAN_ESCALATION: ${beadId} assigned to ${agent.id} has stalled ` +
             `${restartCount} times. Automated recovery exhausted. ` +
             `Requires human intervention. ` +
             `Possible causes: ambiguous requirements, missing dependency, ` +
             `scope exceeds single-agent capacity.`,
    timestamp: new Date().toISOString(),
    durable: true,
  };
  await sendMail(escalation);

  // Do NOT attempt another restart
  // Do NOT clear the hook (human decides what to do)
  // Do NOT terminate the agent (may have partial work to preserve)
}
```

After human escalation, the Deacon stops monitoring this bead. The human operator resolves the issue (reassign, split, clarify, cancel) and the Deacon resumes normal monitoring when the bead's state changes.

## Integration Points

The Deacon heartbeat integrates with four other chipset skills. Each integration is unidirectional -- the Deacon calls into other skills but is not called by them.

### nudge-sync

The Deacon writes nudge messages to stalled agents through the nudge-sync filesystem protocol.

| Direction | Data Flow |
|-----------|-----------|
| Deacon -> nudge-sync | Write `latest.json` to agent's nudge directory |
| Deacon reads | Agent's nudge response (if `requires_response: true`) |

**Filesystem paths used:**

```
Write: .chipset/state/nudge/{agentId}/latest.json
Read:  .chipset/state/nudge/deacon/latest.json (for responses)
```

The nudge message format follows nudge-sync's contract: `from`, `type`, `message`, `timestamp`, `requires_response`. The Deacon uses `type: "health_check"` for initial nudges and expects `type: "nudge_response"` in replies.

### witness-observer

The Deacon escalates persistent stalls to the witness-observer via durable mail. The witness has the broader rig-health context to decide whether a stall is isolated or systemic.

| Direction | Data Flow |
|-----------|-----------|
| Deacon -> witness | `health_escalation` mail when nudge fails to resolve stall |
| Witness -> mayor | Witness applies its own severity classification before forwarding |

The Deacon does not bypass the witness to reach the mayor for stall alerts. The escalation chain is: Deacon -> Witness -> Mayor. Only restart requests and human escalations go directly to the mayor (because they require immediate coordination action).

### beads-state

The Deacon reads agent activity timestamps and hook status from the beads-state filesystem. This is a read-only integration -- the Deacon never writes to hook or agent state files.

| Direction | Data Flow |
|-----------|-----------|
| Deacon reads | `state/hooks/{agentId}.json` for lastActivity timestamp |
| Deacon reads | `state/agents/{role}-{id}.json` for agent status |

**Fields consumed:**

```typescript
// From HookState
hook.status       // 'active' means agent has assigned work
hook.lastActivity // ISO timestamp of last activity
hook.workItem     // The assigned bead (for bead ID in messages)

// From AgentIdentity
agent.status      // 'active' means agent should be working
agent.id          // For addressing nudges and messages
```

### runtime-hal

The Deacon uses the Runtime HAL to determine restart capabilities and per-runtime thresholds.

| Direction | Data Flow |
|-----------|-----------|
| Deacon calls | `hal.getStallThreshold()` for per-runtime stall detection |
| Deacon calls | `hal.getNudgeInterval()` for per-runtime nudge timing |
| Deacon calls | `hal.supportsRestart()` for restart capability check |

If the HAL reports that the current runtime does not support restarts, the Deacon skips step 5c entirely and escalates to human when nudges fail to resolve the stall.

## Timing Diagram

A complete stall-detection-to-resolution sequence with default thresholds (stall_detection=300s, nudge_interval=120s, restart_threshold=600s):

```
T=0        Agent receives hooked work, begins execution
T=0-300    Normal operation -- agent is working, updating lastActivity
T=300      Agent stalls (stops updating lastActivity)
           ...
T=420      Deacon cycle fires (T=300 + nudge_interval=120)
           Deacon reads lastActivity, calculates elapsed=420-300=120
           120 < stall_detection(300)? No, elapsed since last update is 420-last
           [Note: elapsed is from lastActivity, not from stall start]
           Actually: elapsed = now(420) - lastActivity(300) = 120s
           120 < 300 -> agent still healthy, no action
           ...
T=600      Deacon cycle fires
           elapsed = 600 - 300 = 300s
           300 >= stall_detection(300) -> STALL DETECTED
           nudgeCount = 0 -> Step 5a: send nudge
           ...
T=720      Deacon cycle fires
           elapsed = 720 - 300 = 420s
           Agent did not respond to nudge
           nudgeCount = 1 -> Step 5b: escalate to witness
           Send another nudge (nudgeCount = 2)
           ...
T=900      Deacon cycle fires
           elapsed = 900 - 300 = 600s
           600 >= restart_threshold(600) -> Step 5c: request restart
           restartCount for bead = 1
```

If the agent responds to the nudge at T=650 (updates lastActivity), the stall clears:

```
T=650      Agent responds, updates lastActivity to T=650
T=720      Deacon cycle fires
           elapsed = 720 - 650 = 70s
           70 < 300 -> agent healthy, clear nudge tracking
```

## Configuration

The Deacon heartbeat uses these configurable parameters, all sourced from the chipset YAML through the Runtime HAL:

```yaml
gupp:
  thresholds:
    stall_detection: 300    # seconds before declaring stall
    nudge_interval: 120     # seconds between heartbeat checks
    restart_threshold: 600  # seconds before requesting restart
  limits:
    max_restarts_per_bead: 3
    restart_cooldown: 60    # seconds between restarts for same agent
    max_restart_threshold: 1800  # hard cap (30 min)
```

Per-runtime overrides (from the HAL's provider capabilities matrix) take precedence over these defaults when a specific runtime is detected. For example, Claude Code uses shorter intervals because its hook system provides faster stall detection.

## Failure Modes

| Failure | Impact | Recovery |
|---------|--------|----------|
| Deacon process crashes | No heartbeat monitoring until restart | Witness detects Deacon absence via its own patrol; mayor restarts Deacon |
| State directory inaccessible | Cannot read agent/hook files | Deacon logs error, skips cycle, retries next interval |
| Nudge write fails | Agent does not receive health check | Deacon retries on next cycle; escalation timer still advances |
| Multiple Deacon instances | Duplicate nudges to same agent | Harmless -- nudge is latest-wins, agent sees only the last one |
| Clock skew between agents | lastActivity comparison inaccurate | Use monotonic time where available; accept small skew as noise |

The Deacon is designed to be restartable and stateless between cycles. If the Deacon process dies and restarts, it rebuilds its tracking state from the filesystem on the first scan cycle. The only state that does not survive a Deacon restart is the in-memory nudge count and restart count -- these reset, which may cause one redundant nudge or one extra restart attempt. Both are harmless given the existing limits.
