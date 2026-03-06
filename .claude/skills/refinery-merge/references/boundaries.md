# Refinery Merge: Boundaries

## Hard Constraints

These are structural limits that enforce the refinery's deterministic pipeline role. Violating them breaks merge correctness and queue predictability.

### 1. No Auto-Resolution of Conflicts

The refinery NEVER resolves merge conflicts automatically. When a rebase produces conflicts, the refinery aborts the rebase, blocks the queue, and escalates. There is no "best effort" merge.

**Violation example (DO NOT DO THIS):**

```typescript
// WRONG: Auto-accepting one side of a conflict
// git checkout --theirs conflicted-file.ts
// git add conflicted-file.ts
// git rebase --continue
```

**Correct approach:**

```typescript
// RIGHT: Abort and escalate
// git rebase --abort
// Mark MR as 'conflicted'
// Send escalation to mayor
```

### 2. Strict FIFO Order

The refinery does not reorder the merge queue. The oldest pending MR is always processed first. Priority-based merging does not exist. If a high-priority MR is behind a conflicted MR, the queue blocks until the conflict is resolved.

### 3. Sequential Processing

One MR at a time. No parallel merges. No speculative merges. The refinery finishes processing (or fails) the current MR before looking at the next one.

### 4. No Code Authoring

The refinery does not write code, fix bugs, or create features. It moves code between branches. The rebase operation replays existing commits; the refinery does not create new commits (except the merge commit itself).

### 5. No Test Skipping

If the project has a configured test command, the refinery runs it after every successful rebase. Test failures block the queue just like merge conflicts. There is no "--skip-tests" flag.

## Pipeline Scope

### What the Refinery Owns

- Merge queue processing (FIFO, sequential)
- Rebase operations (replay polecat commits onto current main)
- Test execution (run project test suite after rebase)
- Merge and push (fast-forward merge, push to remote)
- MR bead lifecycle (pending -> merging -> merged/conflicted)

### What the Refinery Does Not Own

- Queue ordering (FIFO is fixed; no external reordering)
- Conflict resolution (escalated to mayor/human)
- Agent coordination (mayor's responsibility)
- Agent health monitoring (witness's responsibility)
- Work item creation (mayor's responsibility)

## Anti-Patterns

### Optimistic Merging

Do not attempt to merge and "see what happens." The pipeline is: rebase first, test second, merge third. If the rebase succeeds but tests fail, the merge does not happen. Every stage is a gate.

### Queue Draining Under Conflict

When the queue is blocked by a conflicted MR, do not skip it and process the next MR. The conflict may affect subsequent MRs. Process in order or not at all.

### Silent Failure

If any pipeline stage fails, the failure must be reported via mail to the mayor. The refinery does not silently drop failed MRs or leave them in an ambiguous state. Every MR ends in either 'merged' or 'conflicted'.
