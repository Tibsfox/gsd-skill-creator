# 06 — Communication Channels

## Four Channels, Four Purposes

Gastown agents communicate through four distinct channels, each optimized for a different use case. The filesystem is the bus — every channel reads and writes JSON files using atomic operations (write-temp → fsync → rename).

```
┌────────────────────────────────────────────────────────┐
│              .chipset/state/ (the bus)                   │
│                                                         │
│  mail/          nudge/         hooks/       merge-queue/ │
│  ├─ mayor/      ├─ mayor/      ├─ mayor.json  ├─ mr-001 │
│  ├─ polecat-1/  ├─ polecat-1/  ├─ polecat-1   ├─ mr-002 │
│  ├─ polecat-2/  ├─ polecat-2/  ├─ polecat-2   └─ ...    │
│  ├─ witness/    ├─ witness/    ├─ witness                │
│  └─ refinery/   └─ refinery/   └─ refinery               │
└────────────────────────────────────────────────────────┘
```

## Channel 1: Mail (Async Durable — PCIe)

**Purpose:** Structured messages that must survive recipient session death.

**When to use:** Work assignments, completion reports, escalations, merge notifications — anything where losing the message means losing work.

**Filesystem layout:**
```
.chipset/state/mail/{recipient-id}/{timestamp}-{sender-id}.json
```

**Message format:**
```json
{
  "from": "mayor-a1b2c",
  "to": "polecat-alpha",
  "type": "work_assignment",
  "subject": "Implement auth middleware",
  "body": "Bead gt-abc12 assigned. Branch: polecat/gt-abc12. Acceptance: ...",
  "timestamp": "2026-03-05T10:30:00Z",
  "read": false,
  "priority": "normal"
}
```

**Message types:**
| Type | Sender → Recipient | Purpose |
|------|-------------------|---------|
| `work_assignment` | Mayor → Polecat | New work dispatched |
| `completion_report` | Polecat → Mayor | Work done, MR submitted |
| `merge_notification` | Refinery → Mayor | MR merged or failed |
| `health_escalation` | Witness → Mayor | Stall detected, action needed |
| `coordination` | Any → Any | General coordination |

**Protocol:**
1. Sender creates JSON with all required fields
2. Serialize with sorted keys (deterministic, git-friendly)
3. Write to `{recipient-mailbox}/{timestamp}-{sender}.json.tmp`
4. Fsync temp file
5. Rename to final path (atomic — reader sees complete or nothing)

**Retention:** Messages older than 24 hours are moved to `archive/` subdirectory. The archive is append-only and can be safely deleted when disk space is needed.

**Security:** Mail content is validated before writing. No executable payloads, no path traversal, no credential-shaped strings. See [03-trust-boundary.md](03-trust-boundary.md).

## Channel 2: Nudge (Sync Ephemeral — SMI)

**Purpose:** Immediate pings where only the latest matters. Think of it as tapping someone on the shoulder.

**When to use:** Health checks, status pings, abort signals — anything where history doesn't matter, only "right now."

**Filesystem layout:**
```
.chipset/state/nudge/{recipient-id}/latest.json
```

Note: **single file**, overwritten on every nudge. Only the latest nudge exists. This is by design — nudges are ephemeral, latest-wins.

**Nudge format:**
```json
{
  "from": "witness-d3e4f",
  "type": "health_check",
  "message": "You have hooked work. Are you working on it?",
  "timestamp": "2026-03-05T10:35:00Z",
  "requires_response": true
}
```

**Nudge types:**
| Type | Purpose |
|------|---------|
| `health_check` | Witness checking if agent is alive |
| `stall_warning` | Agent hasn't reported activity |
| `priority_change` | Mayor changed work priority |
| `abort` | Mayor requesting agent stop work |
| `sync_request` | Any agent requesting sync |
| `nudge_response` | Response to a nudge |

**Response protocol:** If `requires_response: true`, the recipient writes a response nudge to the *sender's* nudge directory:
```
.chipset/state/nudge/{sender-id}/latest.json
```

This overwrites any previous nudge to the sender. Both sides see only the latest.

## Channel 3: Hook (Pull-Based Assignment — MMIO)

**Purpose:** Work assignment registers. Each agent has exactly one hook — either empty or holding a work item. Agents poll their hook to discover new assignments.

**When to use:** This is how the mayor assigns work. The polecat polls its hook, finds a pending item, and executes it per GUPP.

**Filesystem layout:**
```
.chipset/state/hooks/{agent-id}.json
```

**Hook format:**
```json
{
  "agent_id": "polecat-alpha",
  "status": "active",
  "work_item": {
    "bead_id": "gt-abc12",
    "title": "Add README section",
    "assigned_at": "2026-03-05T10:30:00Z"
  },
  "last_activity": "2026-03-05T10:32:00Z"
}
```

**Status lifecycle:**
```
empty ──→ pending ──→ active ──→ completed ──→ empty
  ↑         (mayor)    (agent)     (agent)     (mayor)
  └─────────────────────────────────────────────────┘
```

| Transition | Who | When |
|------------|-----|------|
| empty → pending | Mayor (via sling dispatch) | Work assigned |
| pending → active | Owning agent | Agent starts executing |
| active → completed | Owning agent | Agent finishes work |
| completed → empty | Mayor (after verification) | Cleanup |

**Rules:**
- One hook per agent (no parallel assignments)
- No skipping states
- Only the owning agent can transition pending→active and active→completed
- Only the mayor can transition empty→pending and completed→empty
- `last_activity` is updated periodically by the agent (liveness signal for witness)

**GUPP enforcement:** The `gupp-propulsion` skill checks hook state. If `status === 'pending'` or `status === 'active'`, GUPP says: execute immediately. No deferral.

## Channel 4: Handoff (Ownership Cycling — Bus Reset)

**Purpose:** Context transfer when an agent session ends (context window full, timeout, crash). The outgoing session writes a handoff document, the incoming session reads it to resume.

**When to use:** Polecat sessions cycle frequently (context windows fill up). The handoff preserves what the agent was doing, what's left to do, and any decisions made.

**Filesystem layout:**
```
.chipset/state/handoff/{agent-id}/{timestamp}.json
```

**Handoff format:**
```json
{
  "agent_id": "polecat-alpha",
  "bead_id": "gt-abc12",
  "session_outgoing": "session-xyz",
  "summary": "Implemented auth middleware. 3 of 5 tests passing.",
  "remaining": ["Fix CORS test", "Add rate limiting test"],
  "branch": "polecat/gt-abc12",
  "last_commit": "a1b2c3d",
  "timestamp": "2026-03-05T11:00:00Z"
}
```

Unlike nudges (latest-wins), handoffs are append-only — every session cycling creates a new handoff file. The incoming session reads the latest one.

## Channel Selection Guide

| Need | Channel | Why |
|------|---------|-----|
| Assign work to a polecat | Hook | Pull-based, one at a time, GUPP-enforced |
| Tell mayor work is done | Mail | Must survive session death |
| Check if agent is alive | Nudge | Only current status matters |
| Escalate a stall | Mail | Must survive, has severity |
| Resume after session death | Handoff | Context preservation |
| Report merge result | Mail | Must survive for mayor to act |
| Signal priority change | Nudge | Ephemeral, latest-wins |
| Emergency abort | Nudge | Immediate, no queuing |

## Filesystem as Bus: Why Not Sockets?

Three reasons (see [ADR-002](../gastown-integration/../../data/chipset/gastown-orchestration/docs/adr/002-filesystem-as-bus.md)):

1. **Crash recovery.** Files survive process death. Sockets don't.
2. **Inspectability.** `cat .chipset/state/hooks/polecat-alpha.json` tells you everything. No special tooling needed.
3. **Git compatibility.** State files are JSON with sorted keys. They diff cleanly, which matters for debugging.

The tradeoff is latency — filesystem polling is slower than socket notification. For AI agent orchestration (where operations take minutes, not milliseconds), this tradeoff is correct.
