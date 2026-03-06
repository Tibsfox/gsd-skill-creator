# 05 — Agent Topology

## The Five Roles

Every Gastown chipset deployment has exactly five agent roles. Each role has a strict responsibility boundary — agents never reach outside their lane. This is the core design principle: **specialization and composition over generalization**.

### Mayor (Northbridge)

**Count:** Exactly 1. Always.

The mayor is the singleton coordinator. It creates convoys (batches of work), dispatches beads to polecats, monitors convoy progress, and handles escalations. The mayor sees the entire rig — all agents, all work items, all convoy status.

**The mayor NEVER:**
- Writes code or edits files
- Runs tests
- Resolves merge conflicts
- Monitors agent health directly (delegates to witness)
- Makes merge decisions (delegates to refinery)

**The mayor's tools:**
- `state.createWorkItem()` — create beads
- `state.createConvoy()` — group beads into convoys
- `state.setHook()` — assign work to polecats
- `state.listAgents()` — find idle polecats
- `state.getConvoy()` — check progress
- Mail (send work assignments, receive escalations)

**When the mayor receives an escalation:**
1. Stall alert from witness → decide: nudge, restart, or reassign
2. Conflict from refinery → assess, resolve manually or delegate to crew
3. Capacity limit → queue beads for later dispatch

### Polecat (ALU)

**Count:** 1–30, scaled to workload.

Polecats are the workers. Each polecat has a persistent identity but ephemeral sessions — it gets spawned, executes one work item, and terminates. The polecat lifecycle is one-way: spawned → active → done → terminated. There is no pause, no reassign, no re-activation.

**GUPP (Gas Town Universal Propulsion Principle):** If there is work on your hook, YOU MUST RUN IT. No deferral, no asking permission, no waiting for approval. Physics over politeness. This principle exists because LLMs are trained via RLHF to wait for human input — GUPP overrides that trained passivity.

**The polecat's lifecycle:**
```
1. Check hook → status: pending
2. Activate hook → status: active
3. Create branch: polecat/{beadId}
4. Execute work (write code, run tests, commit incrementally)
5. Touch hook periodically (update last_activity for witness monitoring)
6. Call done-retirement pipeline when complete
7. Terminate (no recovery, no re-use)
```

**The polecat NEVER:**
- Coordinates other agents
- Creates convoys
- Monitors other polecats
- Resolves merge conflicts
- Makes dispatch decisions

### Witness (PMU)

**Count:** 1–5, typically 1 per rig.

The witness is the health monitor. It runs a continuous patrol loop, checking every agent's hook state and activity timestamps. When it detects a stall (no activity for longer than the threshold), it escalates through a graduated severity chain.

**Patrol loop (every `nudge_interval`, default 2 min):**
```
SCAN → EVALUATE → ACT → WAIT

SCAN:     Read all agent hooks, check last_activity timestamps
EVALUATE: Compare (now - last_activity) against stall_detection threshold
ACT:      Send nudge (warning) → mail (alert) → escalate (critical)
WAIT:     Sleep until next interval
```

**Escalation ladder:**
| Level | Condition | Action |
|-------|-----------|--------|
| Normal | Activity within threshold | No action |
| Warning | Stalled > `stall_detection` (5 min) | Send nudge: `HEALTH_CHECK` |
| Alert | Stalled > 2× threshold, nudge unanswered | Send mail: `STALL_ALERT` to mayor |
| Critical | 2+ nudges unanswered | Send mail: `STALL_CRITICAL` to mayor with restart recommendation |

**The witness NEVER:**
- Modifies agent work (read-only)
- Resolves conflicts
- Terminates agents (recommends, doesn't act)
- Reassigns work (mayor decides)
- Writes code

### Refinery (DMA)

**Count:** 1–3, typically 1 per target branch.

The refinery processes the merge queue. It is strictly FIFO and strictly sequential — one merge request at a time, in the order they were submitted. This determinism is the entire point: you can always predict what the refinery will do next.

**5-stage merge pipeline:**
```
1. Checkout: Get the polecat's branch from remote
2. Rebase: git rebase {targetBranch}
   → On conflict: ABORT, mark MR conflicted, BLOCK queue, escalate
3. Test: Run configured test suite
   → On failure: treat as logical conflict, BLOCK queue, escalate
4. Merge: Fast-forward merge onto target
5. Push: Push to remote, update bead status → merged
```

**The refinery NEVER:**
- Auto-resolves conflicts (conflicts need semantic judgment)
- Reorders the queue (FIFO is absolute)
- Parallelizes merges (one at a time, always)
- Makes code changes (it moves code, it doesn't author code)
- Decides what to merge (it processes whatever is in the queue)

**When the queue blocks:**
The refinery sends a `CONFLICT` or `TEST_FAILURE` mail to the mayor and witness, then stops processing. The queue stays blocked until the conflicted MR is either fixed (human intervention) or removed. This is deliberate — silent conflict resolution is more dangerous than a blocked queue.

### Crew (GPR — Optional)

**Count:** 0–10.

Crew agents are long-lived, human-managed workspaces. Unlike polecats (ephemeral, one task), crew agents persist across multiple tasks and maintain their own full git clone. They're used for:

- Complex tasks that require human judgment throughout
- Debugging and investigation
- Tasks that span multiple beads
- Interactive development sessions

Crew agents are the GSD equivalent — they work like traditional Claude Code sessions guided by GSD phases and plans.

## Topology Diagrams

### Minimum Viable Topology (3 agents)

```
Mayor (1) ─── dispatch ──→ Polecat (1)
  ↑                            │
  └── escalation ── Witness (1) ←── monitor
```

Use this for: solo development, small tasks, learning the system.

### Standard Topology (6 agents)

```
Mayor (1) ─── dispatch ──→ Polecat Pool (3)
  ↑                            │
  ├── escalation ── Witness (1) ←── monitor
  │                            │
  └── merge result ── Refinery (1) ←── merge queue
```

Use this for: typical development, moderate parallelism.

### Full Topology (10+ agents)

```
Mayor (1) ─── dispatch ──→ Polecat Pool (5-10)
  ↑                            │
  ├── escalation ── Witness (2) ←── monitor
  │                            │
  ├── merge result ── Refinery (1) ←── merge queue
  │
  └── human tasks ──→ Crew (1-3)
```

Use this for: large milestones, parallel wave execution, production deployments.

## Agent Identity & Persistence

Every agent has a persistent identity stored in `.chipset/state/agents/{agent-id}.json`:

```json
{
  "id": "polecat-a1b2c3",
  "role": "polecat",
  "rig": "main-rig",
  "status": "idle",
  "created_at": "2026-03-05T10:00:00Z",
  "session_id": null,
  "metadata": {}
}
```

Agent IDs are stable across sessions. A polecat that terminates and is re-created gets a new ID. Identity files survive process restarts and are used for crash recovery — if Claude Code restarts, it reads the agent file and resumes from the last known state.

## Scaling Guidelines

| Metric | Guidance |
|--------|----------|
| **Polecats per milestone** | 3-5 for typical work, 7-10 for large milestones |
| **Beads per polecat** | 1 (always). Polecats are single-task. |
| **Convoys per milestone** | 1-3. Group related beads that should land together. |
| **Witnesses per rig** | 1 is sufficient for up to 10 polecats. Add a second at 15+. |
| **Max parallel** | Match to your API rate limits. 10 is a safe default for Anthropic. |
| **Batch threshold** | 3 (default). Lower means more convoys, more overhead. |
