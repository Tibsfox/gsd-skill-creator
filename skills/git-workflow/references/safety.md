# Safety Rules

Eight non-negotiable safety rules for git operations. Violation of any rule is a critical error that must be reported immediately.

---

## Rule 1: Never --force push

**Rule:** Never use `git push --force` or `git push -f`.

**Rationale:** Force pushing rewrites remote history. Other developers who have fetched the original history will have divergent refs, leading to data loss and broken workflows. Even `--force-with-lease` should only be used to origin (personal fork), never to upstream, and only with explicit human confirmation.

**Enforcement:** Grep all scripts and TypeScript modules for `--force` and `-f` flags on push commands. If found, it is a test failure.

---

## Rule 2: Never auto-resolve conflicts

**Rule:** When a merge or rebase produces conflicts, report them and STOP. Never attempt automatic resolution.

**Rationale:** Conflict resolution requires understanding the intent behind both changes. Automated resolution (e.g., picking "ours" or "theirs") silently discards human work. The correct action is always: abort the operation, report the conflicting files, and wait for human guidance.

**Enforcement:** All merge and rebase operations must check for conflict state after execution. If CONFLICT is detected, the operation must be aborted and the conflict file list reported.

---

## Rule 3: Never commit to main directly

**Rule:** All work happens on feature branches merged into dev. The only path to main is through Gate 1 (dev -> main merge with human approval).

**Rationale:** Main represents the canonical state that upstream PRs are created from. Direct commits to main bypass review and can introduce untested changes into upstream contributions.

**Enforcement:** The branch-manager creates branches from dev. The contribute workflow is the only code path that touches main, and it requires Gate 1 approval.

---

## Rule 4: Never push to upstream directly

**Rule:** Never run `git push upstream` or any variant that pushes to the upstream remote. The only path to upstream is through Gate 2 (PR creation with human approval).

**Rationale:** The upstream remote is someone else's repository. Pushing directly (even if permissions allow) bypasses code review, CI, and the project's contribution process. Gate 2 ensures every upstream contribution is a PR with a human-reviewed title and description.

**Enforcement:** Gate 2 rejection produces zero upstream contact -- no push, no API calls, no PR created. The only push target is `origin` (the user's fork).

---

## Rule 5: Never run commands in DIRTY state

**Rule:** Before any git operation that modifies branches or history (merge, rebase, checkout, reset), the working tree must be CLEAN.

**Rationale:** DIRTY state means uncommitted changes exist. Running a merge or rebase in DIRTY state can silently incorporate those changes, or worse, create conflicts with the user's uncommitted work. Always stash or commit first.

**Enforcement:** All workflow functions call `assertClean()` before proceeding. The state machine rejects transitions from states that require a CLEAN precondition.

---

## Rule 6: Never delete branch with unmerged work

**Rule:** `git branch -D` (force delete) requires explicit human confirmation. Default branch deletion uses `git branch -d` (safe delete), which fails if the branch has unmerged commits.

**Rationale:** Force-deleting a branch with unmerged commits permanently destroys that work (the commits become unreachable and will be garbage-collected). The safe `-d` flag protects against accidental data loss.

**Enforcement:** The `removeBranch` function uses `-d` by default. The `force` option is available but must be explicitly requested. Protected branches (dev, main) cannot be deleted regardless of force flag.

---

## Rule 7: Always check state before and after operations

**Rule:** Every git operation must verify repository state before execution (precondition) and after execution (postcondition).

**Rationale:** Git operations can fail silently or produce unexpected state. A merge might succeed but leave the repo in MERGING state if the merge commit message editor was cancelled. A rebase might partially apply. Only state verification catches these partial failures.

**Enforcement:** All workflow orchestrators follow the pattern: `detectState -> execute -> detectState -> log`. The GitOperationLog records both `stateBefore` and `stateAfter` for every operation.

---

## Rule 8: Log everything

**Rule:** Every git operation must be logged to the JSONL operation log with timestamp, commands, state before/after, and success/failure.

**Rationale:** Operations without logs cannot be audited, debugged, or rolled back with confidence. The operation log is the single source of truth for what happened and when. When something goes wrong, the log shows exactly which command caused the failure and what state the repo was in.

**Enforcement:** The `logOperation` utility appends to `.sc-git/operations.jsonl` after every workflow function completes. Log entries include the full GitOperationLog interface fields.

---

## Summary

| # | Rule | Core Risk |
|---|---|---|
| 1 | No --force push | History destruction |
| 2 | No auto-resolve conflicts | Silent data loss |
| 3 | No direct main commits | Bypassed review |
| 4 | No direct upstream push | Bypassed contribution process |
| 5 | No DIRTY state operations | Uncommitted work corruption |
| 6 | No unmerged branch deletion | Unreachable commit loss |
| 7 | Always verify state | Silent partial failures |
| 8 | Always log operations | Unauditable changes |

---

*Reference document for git-workflow skill*
