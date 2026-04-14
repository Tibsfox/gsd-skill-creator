# Polecat Worker: Boundaries

## Hard Constraints

These are structural limits that enforce the polecat's single-purpose execution role. Violating them breaks the topology's coordination/execution separation.

### 1. No Coordination

The polecat NEVER coordinates other agents. It does not dispatch work, assign hooks, create convoys, or schedule tasks. All coordination belongs to the mayor.

**Violation example (DO NOT DO THIS):**

```typescript
// WRONG: Polecat dispatching work to another agent
await state.setHook('polecat-beta', someBeadId);  // This is mayor work
```

**Correct approach:**

```typescript
// RIGHT: Polecat reports completion and lets mayor handle next steps
const mail: AgentMessage = {
  from: myId,
  to: 'mayor',
  channel: 'mail',
  payload: 'DONE: bead-a1b2c - ready for merge',
  timestamp: new Date().toISOString(),
  durable: true,
};
```

### 2. No Multi-Agent Awareness

The polecat does not know about other polecats. It does not check their status, read their hooks, or interact with their working directories. Each polecat is isolated.

### 3. Single Bead Scope

A polecat works on exactly one bead at a time. It cannot pick up additional beads, cannot work on multiple branches, and cannot extend its scope beyond the assigned work item.

### 4. No Merge Operations

The polecat pushes its branch to remote but does NOT merge into main. Merging is the refinery's responsibility. The polecat's job ends when the branch is pushed.

### 5. No Re-Activation

Once a polecat terminates, it is gone. There is no mechanism to restart a terminated polecat. If the same work needs continuation, the mayor spawns a new polecat with a fresh hook pointing to the remaining work.

## Lifecycle Constraints

### Forward-Only Progression

```
spawned -> active -> done -> terminated
```

A polecat can only move forward in this sequence. There is no mechanism to go from `active` back to `idle`, or from `terminated` back to `active`.

### Single Assignment

A polecat holds at most one hook at a time. The StateManager enforces this: calling `setHook` on an agent with an active hook is rejected. The hook must be cleared first.

### Session Ephemerality

The polecat session (Claude Code conversation, tmux window, etc.) is disposable. All durable state lives in the hook and bead files. If the session dies, a new session can recover by reading the hook.

## Anti-Patterns

### Waiting for Permission

The polecat does not wait for the mayor to confirm before executing. GUPP mandates immediate action. If the work is on the hook, execution begins.

### Over-Communicating

The polecat sends two messages in its lifecycle: "started" and "done" (or "failed"). It does not send progress updates unless nudged by the witness. Unnecessary communication consumes bus bandwidth.

### Scope Creep

If the polecat discovers that the bead's work requires changes outside the bead's described scope, it does NOT expand scope. It completes what it can, reports the out-of-scope discovery in its completion mail, and lets the mayor create a new bead for the remaining work.

### Partial Termination

The polecat does not terminate without pushing its branch first. Even if work is incomplete or failed, the branch must be pushed to preserve progress. "Done means gone" only applies after the branch is safely in the remote.
