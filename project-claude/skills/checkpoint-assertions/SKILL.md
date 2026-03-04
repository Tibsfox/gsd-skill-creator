---
name: checkpoint-assertions
description: >
  Boundary assertions for GSD phase execution and agent git operations.
  Use this skill whenever: about to run git commit, completing a GSD phase
  or task, about to run git push, agent transitioning between tasks in a
  plan. Auto-activates during GSD phase execution, agent contexts involving
  git operations (commit, push, branch), and task boundary transitions in
  any plan type (execute, review, build). Works with all agent types:
  general-purpose, gsd-executor, gsd-planner.
user-invocable: false
---

# Checkpoint Assertions

## Philosophy

This is Layer 2 of the DSP error correction system — the TCP checksum layer. Hooks (Layer 1) are deterministic guards that run automatically. Assertions (Layer 2) are agent-run verification steps at task boundaries that catch drift before it compounds.

The agent runs 2-3 bash commands at each checkpoint, compares actual state against expected state, and stops if something is wrong. Low token cost (~50 tokens per checkpoint). Not an automated system — you are the checksum.

## Pre-Commit Assertions

Before any `git commit`, run these three checks:

```bash
# 1. Am I on the right branch?
git branch --show-current
# Expected: matches the branch in your task assignment (e.g., v1.50, dev)
```

```bash
# 2. What am I about to commit?
git diff --cached --name-only
# Expected: only files relevant to the current plan/task — no surprises
```

```bash
# 3. No forbidden files staged?
git diff --cached --name-only | grep -E '^\.(planning|env)|node_modules'
# Expected: no output (empty = clean)
```

If any assertion fails: STOP. Unstage wrong files with `git restore --staged <file>`. Verify branch with `git checkout <correct-branch>`. Then proceed.

## Post-Phase Assertions

After completing a phase, before marking the task complete:

```bash
# 1. Did I produce the expected output?
ls -la .planning/phases/{PHASE_DIR}/
# Expected: files listed in the plan's deliverables section exist
```

```bash
# 2. Is the output the right order of magnitude?
wc -l .planning/phases/{PHASE_DIR}/*.md
# Expected: review docs 200-500 lines, load docs 100-300 lines, plans 30-80 lines, summaries 50-120 lines
```

```bash
# 3. Did STATE.md get updated?
head -15 .planning/STATE.md
# Expected: current phase/plan reflects completed state, last_activity is today
```

If any assertion fails: investigate before proceeding. Do not mark a task complete if output is missing or suspiciously short (< 20 lines for any substantive deliverable).

## Pre-Push Assertions

Before any `git push`:

```bash
# 1. Am I pushing the right branch?
git branch --show-current
# Expected: matches task assignment
```

```bash
# 2. What commits am I pushing?
git log origin/{BRANCH}..HEAD --oneline
# Expected: only commits from current session's work — no stale or unrelated commits
```

```bash
# 3. No .planning in the commits?
git diff origin/{BRANCH}..HEAD --name-only | grep '\.planning'
# Expected: no output (empty = .planning is clean)
```

If any assertion fails: DO NOT PUSH. Investigate. Use `git log --oneline -10` and `git show <hash> --stat` to identify unexpected commits. Remove .planning files from history with `git rebase -i` if necessary.

## Auto-Activation

This skill activates in any of these contexts:

- **GSD phase execution** — agent running a plan via `/gsd:execute-phase` or similar
- **Git commit context** — agent preparing to stage files or run `git commit`
- **Git push context** — agent preparing to run `git push` or push to remote
- **Task transition** — agent completing one task and starting the next within a plan

The assertions are not blocking — the agent chooses to run them. The value comes from making the verification habitual at every boundary.

## Token Budget

| Checkpoint | Bash calls | Avg output | Tokens |
|---|---|---|---|
| Pre-commit | 3 | ~5 lines each | ~50 |
| Post-phase | 3 | ~10 lines each | ~75 |
| Pre-push | 3 | ~5 lines each | ~50 |
| **Per phase total** | **9** | — | **~175** |

At 3 phases per milestone: ~525 tokens total. Less than 0.1% of a typical phase execution budget. The cost of not running these assertions is significantly higher.
