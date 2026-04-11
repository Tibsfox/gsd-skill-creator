# Gastown Origin: Refinery Merge

## Where This Comes From

The refinery-merge skill is a direct adaptation of Gastown's `refinery` role, defined in `internal/cmd/prime.go` as `RoleRefinery Role = "refinery"`. In the original Go codebase, the refinery is a per-rig merge queue processor that handles merge requests from completed polecats. It uses the refinery worktree (which tracks the main branch) to rebase, test, and merge polecat branches sequentially.

## Chipset Mapping: DMA Controller Pattern

In the chipset hardware metaphor, the refinery maps to the **DMA (Direct Memory Access) controller**. A real DMA controller moves data between peripherals and memory without CPU intervention. The CPU sets up the transfer (source, destination, size) and the DMA controller executes it independently. Similarly, the refinery moves code from polecat branches (peripheral) to main (memory) without mayor (CPU) coordination during normal operations.

| Hardware Component | Refinery Function |
|-------------------|------------------|
| DMA channel | Single merge queue (one transfer at a time) |
| DMA source address | Polecat branch (source of changes) |
| DMA destination address | Main branch (target for merge) |
| DMA transfer complete interrupt | Merge success mail to mayor |
| DMA bus error | Merge conflict escalation |
| DMA channel busy flag | Queue blocked status |

## Key Gastown Source Files

| File | What It Provides |
|------|-----------------|
| `internal/cmd/refinery.go` | Merge queue processing commands |
| `internal/templates/roles/refinery.md.tmpl` | Refinery role instructions and constraints |
| `internal/cmd/done.go` | Creates MR beads that feed the refinery queue |

## The Sequential Merge Pattern

Gastown's refinery processes merges strictly one at a time. This is not a performance limitation -- it is a correctness guarantee. Sequential processing ensures:

1. Each merge sees the latest state of main (after all previous merges)
2. Rebase conflicts are detected immediately (not masked by parallel merges)
3. Test results are meaningful (tests run against the actual state that will be deployed)
4. Merge history is linear and auditable

In hardware terms, this is a single-channel DMA controller. Multi-channel DMA exists but adds complexity (arbitration, priority, conflict detection). The refinery trades throughput for correctness.

## The "Never Auto-Resolve" Principle

From Gastown's design philosophy: merge conflicts represent semantic disagreements between code paths. A conflict is not a formatting issue that can be mechanically resolved -- it is a signal that two humans (or agents) made incompatible decisions. The refinery's job is to detect this signal and route it to someone who can make the judgment call.

Auto-resolution strategies (like "accept theirs" or "accept ours") are dangerous because they silently discard one side's intent. The refinery blocks the queue instead, making the conflict visible and unavoidable.

## What Changed From Gastown

1. **Language:** Go refinery commands to TypeScript StateManager operations
2. **Queue storage:** Filesystem-based MergeRequest JSON files instead of in-memory Go structs
3. **Communication:** tmux-based notifications replaced with filesystem-based mail
4. **Test execution:** Configurable test command instead of hardcoded Go test
5. **Worktree management:** Not modeled in skill; branch operations are the skill user's responsibility
6. **Bead lifecycle:** MergeRequest entity explicitly tracks merge status (pending/merging/merged/conflicted)
