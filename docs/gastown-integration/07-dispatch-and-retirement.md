# 07 — Dispatch and Retirement Pipelines

## Two 7-Stage Pipelines

Work enters the system through the **sling dispatch** pipeline and exits through the **done retirement** pipeline. Both are strictly ordered, crash-recoverable, and idempotent.

## Sling Dispatch (Work In)

```
FETCH → ALLOCATE → PREPARE → HOOK → STORE → LAUNCH → CONFIRM
```

| Stage | Action | Failure Mode | Recovery |
|-------|--------|-------------|----------|
| 1. Fetch | Resolve bead ID → work item. Reject if not `open`. | Bead not found or already dispatched | No-op (idempotent) |
| 2. Allocate | Find idle polecat or spawn new (up to `max_parallel`) | Pool full | Queue for later dispatch |
| 3. Prepare | Create branch `polecat/{beadId}`, assemble context | Git error | Retry or escalate |
| 4. Hook | Set agent's hook, mark work `hooked` | Agent already has active hook | Select different agent |
| 5. Store | Write dispatch record to `.chipset/state/dispatch/` | Filesystem error | Retry (atomic write) |
| 6. Launch | Update agent → `active`, send work_assignment mail | Agent spawn failure | Recover from stored record |
| 7. Confirm | Update convoy progress, notify witness | Mail failure | Best-effort (work is dispatched) |

**Crash recovery:** On startup, scan `dispatch/` for records with stage < `confirmed`. Resume from the stored stage.

**Batch mode:** When ≥ `batch_threshold` (default 3) beads target the same rig, auto-create a convoy and dispatch in parallel up to `max_parallel`.

## Done Retirement (Work Out)

```
VALIDATE → COMMIT → PUSH → SUBMIT → NOTIFY → CLEANUP → TERMINATE
                      ↑
                 IRREVERSIBLE
```

| Stage | Action | Reversible? | Failure Mode |
|-------|--------|-------------|-------------|
| 1. Validate | Check acceptance criteria met | Yes | Bead stays `in_progress` |
| 2. Commit | Ensure all changes committed | Yes | Retry after fixing |
| 3. Push | `git push origin polecat/{beadId}` → status `done` | **NO** | Critical — escalate |
| 4. Submit | Create MR in `.chipset/state/merge-queue/` | Safe | Work in remote, retry |
| 5. Notify | Mail completion to mayor + witness | Safe | Best-effort |
| 6. Cleanup | Destroy workspace, clear hook | Safe | Manual cleanup |
| 7. Terminate | Mark agent `terminated` | Safe | Agent identity persists |

**The irreversibility boundary at Stage 3 is absolute.** Once the branch is pushed to remote, the work exists outside the agent's control. Stages 4-7 are consequences — if they fail, the work is still safe. The mayor can retry notifications manually.

## Integration: Dispatch → Execute → Retire → Merge

```
Mayor creates beads
  ↓
Sling dispatches to polecat (7 stages)
  ↓
Polecat executes (branch, code, test, commit)
  ↓
Done retires the polecat (7 stages, push at stage 3)
  ↓
Refinery processes merge queue (5 stages: checkout → rebase → test → merge → push)
  ↓
Bead status: merged
  ↓
Convoy progress updated
```

The refinery's merge pipeline is separate and asynchronous — done retirement submits the MR and moves on. The refinery processes the queue in its own time, strictly FIFO, one at a time.
