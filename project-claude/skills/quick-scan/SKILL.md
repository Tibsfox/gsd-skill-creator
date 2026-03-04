---
name: quick-scan
description: >
  Post-commit spot-check for GSD phase execution. Lightweight CRC layer (Layer 3
  of DSP error correction) that reads the last commit diff and verifies it against
  plan intent. Strictly read-only — sensor, not actuator. ~300-600 tokens per commit.
  Use this skill whenever: a git commit succeeds during GSD phase execution, an agent
  completes a task commit, explicitly invoked by agent or lead for commit review.
user-invocable: false
---

# Quick-Scan

## Philosophy

Quick-scan is Layer 3 of the DSP error correction stack — the CRC layer. After each commit, it reads the diff and runs a 5-point spot-check against the current plan's intent.

Analogy: a CRC check does not repair data — it detects corruption and signals the receiver. Quick-scan works the same way. It reads, evaluates, and reports. The agent decides what to do with the result.

Cost: ~300-600 tokens per commit. At 2-3 commits per phase, that is ~1000-1800 tokens per phase — roughly 1-2% of a typical execution budget. Far cheaper than discovering the error in review.

---

## The Quick-Scan Checklist (SCAN-01)

After each commit, run the 5-point check in order. Each check requires reading one or two git outputs — no file modifications.

### 1. SCOPE — Are only the expected files touched?

```bash
git diff HEAD~1 --name-only
```

Compare the output against the plan's `files_modified` list (or the task's `<files>` field).

**Flag if:** Files appear that are not in the plan's expected file list. Unexpected files = possible scope creep or wrong-task commit.

---

### 2. MAGNITUDE — Is the change the right size?

```bash
git diff HEAD~1 --stat | tail -1
```

This gives a summary line like: `3 files changed, 142 insertions(+), 12 deletions(-)`.

Compare against the plan's estimated scope. A config tweak should be <20 lines. A new skill file should be 50-200 lines. A major feature should be hundreds.

**Flag if:** The change is 10x larger or 10x smaller than expected. Large deviation = investigate. Small deviation (2-3x) = note and continue.

---

### 3. INTENT — Does the commit message match what was actually changed?

```bash
git log -1 --format=%s
git diff HEAD~1 --stat
```

Read both and compare. The message describes the intent; the stat shows the reality.

**Flag if:** The message says "add feature X" but the diff only touches tests. Or message says "fix bug" but multiple new modules were added. Message-to-diff mismatch means intent was not captured clearly.

---

### 4. TESTS — Did the test count change as expected?

```bash
git diff HEAD~1 --name-only | grep -c '\.test\.'
```

If the plan calls for adding tests (TDD RED or GREEN commit, or "add tests" in task description), test files must appear in the diff.

**Flag if:** The plan explicitly adds tests but no `*.test.*` files are in the diff. Missing tests = plan requirement not met.

If the plan does NOT require test changes, zero test files in the diff is expected — do not flag.

---

### 5. FORBIDDEN — Any patterns that must never appear?

```bash
git diff HEAD~1
```

Scan the full diff for:
- `.planning/` paths (`.planning/` is gitignored and must never be committed)
- `.env` content or API key patterns (`sk-`, `ghp_`, `AKIA`, etc.)
- Hardcoded credentials, passwords, tokens
- Absolute system paths that leak machine state (`/home/username/`, `/Users/username/`)

**Flag if:** Any match found. FORBIDDEN flags are the highest severity — they require immediate correction before proceeding.

---

## Decision Logic (SCAN-04)

After running all 5 checks:

| Flags | Action |
|-------|--------|
| **0 flags** | Commit is clean. Continue to next task. No mention needed. |
| **1 flag (minor)** | Note it and continue. Include a one-line mention in the task completion message. |
| **2+ flags** | STOP. Investigate before proceeding. Consider amending the commit or reverting it. Do not continue to the next task until the issue is understood. |

For FORBIDDEN flags: treat as 2+ regardless of other flags. Stop immediately.

---

## Read-Only Constraint (SCAN-02)

Quick-scan NEVER modifies files. It does not:
- Edit source files
- Amend commits
- Create new files
- Revert changes

It reads git output, evaluates what it finds, and reports findings. The agent reading the report decides what corrective action (if any) to take.

This boundary is strict. If quick-scan were to modify files, it would change the very commit it is evaluating — invalidating the check. Layer 3 is a sensor. Actuators live at Layer 1 (hooks) and in the agent's task execution.

---

## When to Skip (SCAN-03)

Skip quick-scan for these commit types — they carry low risk or produce misleading diffs:

**Documentation-only commits** — all changed files are `*.md`:
```bash
git diff HEAD~1 --name-only | grep -v '\.md$' | wc -l
# If output is 0, all changes are markdown — skip scan
```

**Merge commits** — commit has 2 or more parents:
```bash
git log -1 --format=%P | wc -w
# If output >= 2, this is a merge commit — skip scan
```

**Pure .planning changes** — since `.planning/` is gitignored, these should not appear in commits. If they somehow do, the FORBIDDEN check (point 5) already catches them. No need for a separate skip rule.

When skipping, note the reason in the agent's task completion message: "Quick-scan skipped: docs-only commit."

---

## Token Budget

| Step | Tokens |
|------|--------|
| Read `git diff HEAD~1 --name-only` | ~20-50 |
| Read `git diff HEAD~1 --stat` | ~30-80 |
| Read `git log -1 --format=%s` | ~10-20 |
| Read `git diff HEAD~1` (full diff) | ~150-400 |
| Evaluate 5 checks | ~100 |
| **Total per commit** | **~300-600** |

At 2-3 task commits per phase: 600-1800 tokens per phase.
At ~100K tokens per phase context: quick-scan uses ~1-2% of the budget.

---

## Auto-Activation

Quick-scan activates:
- After `git commit` succeeds during GSD phase execution
- When an agent completes a task commit and is about to start the next task
- When explicitly invoked by agent or lead to review a specific commit

Works across all GSD execution contexts: executor agents, phase runners, continuation agents.

Does not activate during planning, context loading, or non-commit file operations.
