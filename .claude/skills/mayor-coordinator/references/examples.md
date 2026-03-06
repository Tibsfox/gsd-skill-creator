# Mayor Coordinator: Examples

## Example 1: Convoy Creation and Dispatch

**Scenario:** The human operator has broken a feature into three tasks that can run in parallel.

**Step 1 -- Create work items:**

```typescript
const state = new StateManager({ stateDir: '.chipset/state/' });

const fix = await state.createWorkItem('Fix login validation', 'Email regex rejects valid TLDs', 'P1');
const test = await state.createWorkItem('Add login tests', 'Coverage gap in auth module', 'P2');
const docs = await state.createWorkItem('Update auth docs', 'Login flow diagram outdated', 'P3');
```

**Step 2 -- Bundle into convoy:**

```typescript
const convoy = await state.createConvoy('Login Fix Sprint', [
  fix.beadId,
  test.beadId,
  docs.beadId,
]);
// convoy.progress is 0.0 (no work started)
```

**Step 3 -- Allocate and dispatch:**

```typescript
// Check for existing idle polecats
let polecats = (await state.listAgents({ role: 'polecat' }))
  .filter(a => a.status === 'idle');

// Spawn additional polecats if needed
while (polecats.length < 3) {
  polecats.push(await state.createAgent('polecat', 'my-project'));
}

// Dispatch: one bead per polecat
await state.setHook(polecats[0].id, fix.beadId);
await state.updateWorkStatus(fix.beadId, 'hooked');

await state.setHook(polecats[1].id, test.beadId);
await state.updateWorkStatus(test.beadId, 'hooked');

await state.setHook(polecats[2].id, docs.beadId);
await state.updateWorkStatus(docs.beadId, 'hooked');
```

**Step 4 -- Monitor progress:**

```typescript
// Periodic check (called on interval or after receiving mail)
await state.updateConvoyProgress(convoy.id);
const status = await state.getConvoy(convoy.id);

if (status && status.progress === 1.0) {
  console.log('Convoy complete');
} else {
  console.log(`Progress: ${((status?.progress ?? 0) * 100).toFixed(0)}%`);
}
```

## Example 2: Dispatch Orchestration with Priority

**Scenario:** Five beads need dispatching but only two polecats are available. The mayor queues by priority.

```typescript
// Sort work items by priority (P1 first)
const priorityOrder = { P1: 0, P2: 1, P3: 2 };
const sorted = workItems.sort((a, b) =>
  priorityOrder[a.priority] - priorityOrder[b.priority]
);

const idle = (await state.listAgents({ role: 'polecat' }))
  .filter(a => a.status === 'idle');

// Dispatch what we can (P1 items first)
for (let i = 0; i < Math.min(idle.length, sorted.length); i++) {
  await state.setHook(idle[i].id, sorted[i].beadId);
  await state.updateWorkStatus(sorted[i].beadId, 'hooked');
}

// Remaining items stay in 'open' status, dispatched when polecats free up
const queued = sorted.slice(idle.length);
// queued items remain open, mayor dispatches them on next cycle
```

## Example 3: Escalation Handling

**Scenario:** The witness reports polecat-gamma has been stalled for 35 minutes.

```typescript
// Witness sends mail: { from: 'witness-01', to: 'mayor-01', channel: 'mail',
//   payload: 'STALL_ALERT: polecat-gamma idle 35m on bead-x7y8z' }

// Mayor reads mail from filesystem
// .chipset/state/mail/mayor-01/2026-03-06T09:15:00Z-witness-01.json

// Step 1: Check agent status
const agent = await state.getAgent('polecat-gamma');
const hook = await state.getHook('polecat-gamma');

if (agent?.status === 'stalled' && hook?.status === 'active') {
  // Step 2: Send nudge
  const nudgeMessage: AgentMessage = {
    from: 'mayor-01',
    to: 'polecat-gamma',
    channel: 'nudge',
    payload: 'Progress check on ' + hook.workItem?.beadId,
    timestamp: new Date().toISOString(),
    durable: false,
  };
  // Write nudge file

  // Step 3: Wait for response (next monitoring cycle)
  // If still stalled on next check:

  // Step 4: Terminate and reassign
  await state.updateAgentStatus('polecat-gamma', 'terminated');
  const workId = hook.workItem?.beadId;
  await state.clearHook('polecat-gamma');

  if (workId) {
    // Spawn replacement and re-dispatch
    const replacement = await state.createAgent('polecat', agent.rig);
    await state.updateWorkStatus(workId, 'open');
    await state.setHook(replacement.id, workId);
    await state.updateWorkStatus(workId, 'hooked');
  }
}
```

## Example 4: Merge Conflict Escalation

**Scenario:** The refinery reports a merge conflict on a completed polecat's branch.

```typescript
// Refinery sends mail: { from: 'refinery-01', to: 'mayor-01', channel: 'mail',
//   payload: 'CONFLICT: bead-a1b2c branch conflicts with main' }

// Mayor response: block the queue, report to human
// The mayor does NOT attempt to resolve the conflict

// Step 1: Acknowledge the block
const ackMessage: AgentMessage = {
  from: 'mayor-01',
  to: 'refinery-01',
  channel: 'mail',
  payload: 'ACK_CONFLICT: queue blocked, awaiting human resolution',
  timestamp: new Date().toISOString(),
  durable: true,
};

// Step 2: Report to human operator (via convoy status or logging)
// The conflict details go in the convoy progress report
```
