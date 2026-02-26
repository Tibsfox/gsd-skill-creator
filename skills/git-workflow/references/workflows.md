# Deterministic Workflow Sequences

Six common git workflows, each as a numbered sequence of exact commands. Every step includes the expected state after execution. If state does not match, STOP and report.

---

## 1. Start New Feature

Create a feature branch from dev, optionally with a worktree.

| Step | Command | Expected State After |
|---|---|---|
| 1 | `sc git status` | CLEAN on dev branch |
| 2 | `sc git work my-feature --type feature` | Branch `feature/my-feature` created |
| 3 | (optional) `sc git work my-feature --type feature --worktree` | Worktree at `worktrees/<repo>/feature-my-feature/` |
| 4 | `git checkout feature/my-feature` | CLEAN on feature/my-feature |

**Detailed commands (without sc wrappers):**

```bash
# 1. Verify clean state
git status --porcelain=v2    # must be empty
git rev-parse --abbrev-ref HEAD   # must be 'dev'

# 2. Create branch from dev
git checkout -b feature/my-feature dev
git config branch.feature/my-feature.pushRemote origin

# 3. (Optional) Create worktree instead
git worktree add worktrees/repo/feature-my-feature feature/my-feature

# 4. Verify
git rev-parse --abbrev-ref HEAD   # 'feature/my-feature'
git status --porcelain=v2         # empty
```

---

## 2. Complete Feature

Merge a completed feature branch back into dev and clean up.

| Step | Command | Expected State After |
|---|---|---|
| 1 | `sc git status` | CLEAN on feature branch |
| 2 | `git checkout dev` | CLEAN on dev |
| 3 | `git merge --no-ff feature/my-feature` | CLEAN on dev (merged) |
| 4 | `git branch -d feature/my-feature` | Branch removed |
| 5 | (if worktree) `git worktree remove <path>` | Worktree removed |

**Detailed commands:**

```bash
# 1. Verify clean state on feature branch
git status --porcelain=v2    # must be empty

# 2. Switch to dev
git checkout dev

# 3. Merge with no-ff (preserves branch history)
git merge --no-ff feature/my-feature

# 4. Remove feature branch
git branch -d feature/my-feature

# 5. Remove worktree if it exists
git worktree list --porcelain | grep -A2 "branch refs/heads/feature/my-feature"
git worktree remove worktrees/repo/feature-my-feature

# 6. Verify
git branch | grep feature/my-feature   # should not appear
git status --porcelain=v2               # empty
```

---

## 3. Sync Upstream

Fetch changes from the upstream remote and integrate them into dev.

| Step | Command | Expected State After |
|---|---|---|
| 1 | `sc git status` | CLEAN on dev |
| 2 | `sc git sync --dry-run` | Shows N new commits (no changes) |
| 3 | `sc git sync` | CLEAN on dev, N commits integrated |
| 4 | (on conflict) Sync aborts automatically | CLEAN on dev (no changes) |

**Detailed commands:**

```bash
# 1. Verify clean state
git status --porcelain=v2    # must be empty
git rev-parse --abbrev-ref HEAD   # must be 'dev'

# 2. Fetch upstream
git fetch upstream

# 3. Count new commits
git rev-list --count dev..upstream/main

# 4a. Dry run: just show commits
git log --oneline dev..upstream/main

# 4b. Apply via rebase (default)
git rebase upstream/main
# OR apply via merge
git merge upstream/main --no-ff

# 5. On conflict: abort immediately
git rebase --abort   # or git merge --abort
# Report conflict files: git diff --name-only --diff-filter=U

# 6. Update config
# config.lastSync = new Date().toISOString()
```

---

## 4. Prepare Contribution

Full contribution workflow through both HITL gates.

| Step | Command | Expected State After |
|---|---|---|
| 1 | `sc git status` | CLEAN on dev |
| 2 | `sc git sync` | Dev up to date with upstream |
| 3 | `sc git gate merge` | Gate 1 presented to human |
| 4 | (approved) merge executes | CLEAN on dev, main updated |
| 5 | `sc git gate pr` | Gate 2 presented to human |
| 6 | (approved) PR created | PR URL returned |

**Detailed sequence:**

```bash
# Pre-flight: sync first
git fetch upstream
git rebase upstream/main

# Gate 1: dev -> main
# Present diff summary, file groups, commit history
# Human approves or rejects
# If rejected: STOP, no changes

# If approved:
git checkout main
git merge --no-ff dev
git checkout dev

# Gate 2: main -> upstream PR
# Present PR title + description (editable)
# Human approves or rejects
# If rejected: ZERO upstream contact

# If approved:
git push origin main
gh pr create --repo upstream/repo --base main --head user:main \
  --title "..." --body "..."
```

---

## 5. Handle Conflict

When a merge or rebase produces conflicts, identify and resolve them.

| Step | Action | Expected State After |
|---|---|---|
| 1 | Conflict detected | CONFLICT state |
| 2 | List conflicting files | File list shown |
| 3 | Human resolves each file | Files edited |
| 4 | Mark resolved | DIRTY state |
| 5 | Continue operation | CLEAN state |

**Detailed commands:**

```bash
# 1. Identify conflicting files
git status --porcelain=v2 | grep '^u '
git diff --name-only --diff-filter=U

# 2. Show conflict markers in a file
git diff <file>

# 3. After human edits, mark resolved
git add <file>

# 4. Continue the operation
git rebase --continue    # if rebasing
git merge --continue     # if merging (or git commit)

# 5. Verify clean state
git status --porcelain=v2    # must be empty
```

**If resolution is impossible, abort safely:**

```bash
git rebase --abort    # restores pre-rebase state
git merge --abort     # restores pre-merge state
```

---

## 6. Emergency Rollback

When something goes wrong and you need to return to a known good state.

| Step | Command | Expected State After |
|---|---|---|
| 1 | `git reflog` | Shows recent HEAD positions |
| 2 | Identify last good state | SHA identified |
| 3 | `git reset --hard <sha>` | CLEAN at known good state |
| 4 | Verify | State matches expectations |

**Detailed commands:**

```bash
# 1. View recent history
git reflog show --format='%H %gD %gs' | head -20

# 2. Identify the good state (e.g., before the bad merge)
# Look for entries like "checkout: moving from dev to main"

# 3. Reset to that state (DESTRUCTIVE - confirm with human first)
git reset --hard <sha>

# 4. Verify
git status --porcelain=v2    # clean
git log --oneline -5          # expected history
```

**IMPORTANT:** `git reset --hard` is destructive. Only use with explicit human confirmation. The reflog preserves history for 90 days, so recovery is possible even after a hard reset.

---

*Reference document for git-workflow skill*
