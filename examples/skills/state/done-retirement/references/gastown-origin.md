# Gastown Origin: Done Retirement

## Where This Comes From

The done-retirement skill is a direct adaptation of Gastown's `gt done` command, implemented in `internal/cmd/done.go`. In the original Go codebase, `gt done` is the pipeline termination command -- it pushes the polecat's branch to the shared repository, creates a merge request bead for the refinery, notifies the witness, destroys the worktree, and kills the tmux session. The entire sequence is designed to be irreversible after the push step.

## Chipset Mapping: Instruction Retirement Unit

In the chipset hardware metaphor, done retirement maps to the **instruction retirement unit** of an out-of-order processor. In a real CPU, the retirement unit:

1. Waits for instructions to complete execution
2. Verifies results are correct (no exceptions)
3. Writes results to the architectural register file (commit point)
4. Updates the reorder buffer
5. Frees physical registers and execution resources

Similarly, done retirement waits for polecat execution to complete, validates the work, pushes the branch (architectural commit), creates the merge request (reorder buffer update), and frees the workspace and agent slot.

| Hardware Component | Done Retirement Function |
|-------------------|--------------------------|
| Completion check | Validate work is done (Stage 1) |
| Exception check | Verify no uncommitted changes (Stage 2) |
| Register file write | Push branch to shared repo (Stage 3) |
| Reorder buffer update | Create merge request record (Stage 4) |
| Interrupt dispatch | Send completion notifications (Stage 5) |
| Physical register deallocation | Destroy workspace (Stage 6) |
| Retirement pointer advance | Terminate agent (Stage 7) |

## Key Gastown Source Files

| File | What It Provides |
|------|-----------------|
| `internal/cmd/done.go` | The `gt done` pipeline -- push, MR creation, worktree destruction, session termination |
| `internal/templates/roles/polecat.md.tmpl` | GUPP contract that defines when a polecat should call done |
| `internal/cmd/refinery.go` | Refinery that processes the MRs created by done |

## The Irreversibility Contract

Gastown's `done.go` implements a strict irreversibility boundary. The pipeline has five steps in the Go implementation:

1. **Push branch to remote** (write-through to durable storage)
2. **Create MR bead** (reorder buffer commit)
3. **Notify witness** (interrupt acknowledge)
4. **Destroy worktree** (register deallocation)
5. **Kill tmux session** (pipeline drain)

The push (step 1) is the commit point. After the push succeeds, the remaining steps are consequences that unfold even if some fail. In the original Go code, the worktree destruction (`git worktree remove --force`) and tmux session kill (`tmux kill-session`) are deliberately performed without error checks on their return values -- they are best-effort cleanup after the irreversible commit.

In the skill, this maps to the 7-stage pipeline with the irreversibility boundary at Stage 3 (Push). The additional stages (validate and commit) are pre-push safety checks that the original Go code handled implicitly.

## "Done Means Gone" Philosophy

From Gastown's design philosophy, "done means gone" has two meanings:

1. **The work is gone from the polecat.** After done, the polecat has no local copy of the work. The worktree is destroyed. The branch exists only in the shared repository. If the work needs revision, a new polecat is spawned to work on the branch.

2. **The polecat is gone from the system.** After done, the polecat's session is terminated. The agent slot is freed. There is no re-activation, no pausing, no reassignment. The polecat's lifecycle is one-way: spawned, active, done, gone.

This philosophy prevents state leakage between tasks. Each polecat starts with a clean slate and ends with total cleanup. In hardware terms, this is equivalent to zeroing all registers after instruction retirement -- the execution unit carries no state from previous instructions.

## Convoy Integration

In Gastown, `done.go` updates the convoy's progress tracking when a bead completes. The convoy is a batch of related beads dispatched together (see sling_batch.go). Each bead's completion increments the convoy's done count. When all beads in a convoy are done, the mayor knows the entire batch is complete.

The progress calculation is simple: `completed / total`. The convoy record in state tracks this as a float between 0.0 and 1.0. The mayor polls convoy progress to determine when to move to the next phase of work.

## Merge Queue Submission

The merge request created in Stage 4 feeds directly into the refinery's merge queue. In Gastown, `done.go` creates a "merge bead" that the refinery picks up during its queue processing loop. The refinery processes these beads in strict FIFO order -- the first bead to call done is the first to be merged.

The merge request record contains:
- Source branch (the polecat's working branch)
- Target branch (usually main)
- Bead ID (links back to the original work item)
- Status (starts as `pending`)

The refinery transitions the status through `pending` -> `merging` -> `merged` (or `conflicted` if the merge fails).

## What Changed From Gastown

1. **Language:** Go `gt done` command to TypeScript retirement pipeline
2. **Pipeline stages:** Go's 5-step implicit pipeline expanded to 7 explicit stages with validation and commit pre-checks
3. **Worktree management:** Physical `git worktree remove --force` abstracted to workspace cleanup
4. **Session management:** tmux `kill-session` replaced with agent status update to `terminated`
5. **Communication:** tmux-based witness notification replaced with filesystem-based mail
6. **Merge request:** In-memory Go bead replaced with filesystem-persisted MergeRequest JSON
7. **Error handling:** Go's fire-and-forget cleanup made explicit with post-push failure tolerance
8. **Convoy tracking:** Progress update preserved from the original but formalized as a state manager operation
