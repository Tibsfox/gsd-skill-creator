# Polecat Worker: Examples

## Example 1: Hook Detection and GUPP Activation

**Scenario:** A polecat session starts and finds work on its hook.

```typescript
const state = new StateManager({ stateDir: '.chipset/state/' });
const myId = 'polecat-alpha';

// Step 1: Check hook on startup
const hook = await state.getHook(myId);

if (!hook || hook.status === 'empty') {
  console.log('No work on hook -- idle');
  return;
}

// Step 2: GUPP activates -- announce immediately
const workItem = hook.workItem!;
await state.updateAgentStatus(myId, 'active');
await state.updateWorkStatus(workItem.beadId, 'in_progress');

// Send start announcement
const startMail: AgentMessage = {
  from: myId,
  to: 'mayor',
  channel: 'mail',
  payload: `STARTED: ${workItem.beadId} - ${workItem.title}`,
  timestamp: new Date().toISOString(),
  durable: true,
};
// Write to .chipset/state/mail/mayor/{timestamp}-{myId}.json

// Step 3: Execute the work
// Create branch: git checkout -b polecat/bead-a1b2c
// Read the work item description for instructions
// Write code, run tests, commit -- standard development workflow

// Step 4: Done
// git push origin polecat/bead-a1b2c
await state.updateWorkStatus(workItem.beadId, 'done');
await state.clearHook(myId);
await state.updateAgentStatus(myId, 'terminated');
```

## Example 2: Autonomous Execution with Branch Management

**Scenario:** Polecat executes a feature implementation with incremental commits.

```typescript
// Work item: "Add input validation to login form"
// Branch: polecat/bead-x7y8z

// Commit 1: Add validation schema
// git add src/validation/login-schema.ts
// git commit -m "feat(auth): add login input validation schema"

// Commit 2: Wire validation into form handler
// git add src/handlers/login.ts
// git commit -m "feat(auth): wire validation into login handler"

// Commit 3: Add tests
// git add tests/auth/login-validation.test.ts
// git commit -m "test(auth): add login validation tests"

// All acceptance criteria met -- call done
// git push origin polecat/bead-x7y8z

await state.updateWorkStatus('bead-x7y8z', 'done');
await state.clearHook(myId);

const doneMail: AgentMessage = {
  from: myId,
  to: 'mayor',
  channel: 'mail',
  payload: 'DONE: bead-x7y8z - 3 commits, tests passing, branch pushed',
  timestamp: new Date().toISOString(),
  durable: true,
};

await state.updateAgentStatus(myId, 'terminated');
// Session ends here -- polecat is gone
```

## Example 3: Context Recovery After Restart

**Scenario:** Polecat session crashes mid-execution. A new session starts and recovers.

```typescript
const state = new StateManager({ stateDir: '.chipset/state/' });
const myId = 'polecat-alpha';

// On restart: first action is always to check hook
const hook = await state.getHook(myId);

if (hook && hook.status === 'active') {
  // Work was in progress -- check git branch for progress
  // git log --oneline polecat/bead-a1b2c
  //   abc1234 feat(auth): add login schema
  //   def5678 feat(auth): wire validation
  //
  // Two commits already done. Check what remains from the work item description.
  // Continue from where the branch left off.

  const workItem = hook.workItem!;
  // Resume execution -- pick up remaining work
  // No need to re-announce (status already 'active')
}

if (hook && hook.status === 'pending') {
  // Work was assigned but polecat crashed before starting
  // Begin GUPP from step 2 (announce)
  await state.updateAgentStatus(myId, 'active');
  await state.updateWorkStatus(hook.workItem!.beadId, 'in_progress');
  // Continue with execution
}
```

## Example 4: Responding to a Witness Nudge

**Scenario:** The witness sends a nudge asking if the polecat is still working.

```typescript
// Nudge received: .chipset/state/mail/polecat-alpha/{ts}-witness-01.json
// { channel: 'nudge', payload: 'HEALTH_CHECK: are you active?' }

// Polecat responds with current status
const response: AgentMessage = {
  from: myId,
  to: 'witness-01',
  channel: 'mail',
  payload: `ACTIVE: bead-x7y8z, last commit 3m ago, 2/4 subtasks complete`,
  timestamp: new Date().toISOString(),
  durable: true,
};
// Write response to .chipset/state/mail/witness-01/{ts}-polecat-alpha.json
```

## Example 5: Handling Execution Failure

**Scenario:** Polecat encounters an error it cannot resolve.

```typescript
// Tests fail and the fix requires architectural changes beyond the bead scope

// Step 1: Commit current progress
// git add . && git commit -m "wip(auth): partial validation, blocked on schema change"

// Step 2: Push branch (preserve work)
// git push origin polecat/bead-x7y8z

// Step 3: Report failure
const failMail: AgentMessage = {
  from: myId,
  to: 'mayor',
  channel: 'mail',
  payload: 'FAILED: bead-x7y8z - validation requires schema migration (out of scope)',
  timestamp: new Date().toISOString(),
  durable: true,
};

// Step 4: Terminate
await state.updateWorkStatus('bead-x7y8z', 'done');
await state.clearHook(myId);
await state.updateAgentStatus(myId, 'terminated');
// Mayor will decide whether to spawn a new polecat or escalate
```
