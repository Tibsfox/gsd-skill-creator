# Tutorial: Detecting and Resolving Skill Conflicts

[Back to Getting Started](../GETTING-STARTED.md) | [Previous: Skill Creation](skill-creation.md) | [Next: Calibration](calibration.md)

**Time:** 10 minutes
**Prerequisites:** At least 2 skills created ([Skill Creation Tutorial](skill-creation.md))

---

## What You Will Learn

By the end of this tutorial, you will be able to:

- Understand what skill conflicts are and why they matter
- Run conflict detection to identify overlapping skills
- Interpret conflict severity levels and similarity scores
- Choose and apply appropriate resolution strategies
- Prevent future conflicts through skill planning

## Why Conflicts Matter

When two skills have similar descriptions, Claude Code may:

- Activate the wrong skill for a given prompt
- Activate multiple skills when only one is needed
- Exhibit unpredictable activation behavior

Conflict detection identifies these issues before they affect your workflow.

---

## Step 1: Understand Conflict Types

Skills can conflict in several ways. Understanding the conflict type helps choose the right resolution.

### Semantic Similarity

Two skills describe similar capabilities using different words.

**Example:**

| Skill | Description |
|-------|-------------|
| `commit-helper` | "Generates commit messages for code changes" |
| `git-workflow` | "Helps write commit messages following conventions" |

These skills overlap semantically even though the exact words differ. The embedding-based conflict detection identifies this similarity.

### Trigger Overlap

Two skills use the same activation keywords.

**Example:**

| Skill | Triggers in Description |
|-------|------------------------|
| `commit-helper` | "Use when committing changes or writing commit messages" |
| `changelog-helper` | "Use when writing commit messages or updating changelog" |

Both activate on "commit messages" - creating ambiguity.

### Domain Collision

Two skills operate in the same problem space but serve different purposes.

**Example:**

| Skill | Purpose |
|-------|---------|
| `code-review` | "Reviews code for bugs and style issues" |
| `pr-feedback` | "Provides feedback on pull request changes" |

These serve similar but distinct purposes. Whether they conflict depends on how often the user needs both simultaneously.

### Severity Levels

| Severity | Similarity Score | Meaning |
|----------|------------------|---------|
| HIGH | > 90% | Very likely conflict, review required |
| MEDIUM | 85-90% | Possible conflict, worth reviewing |
| LOW | < 85% | Unlikely conflict, usually safe |

> **Checkpoint:** Review your existing skills mentally.
>
> Run: `skill-creator list`
>
> Ask yourself: Which of my skills might conflict? Skills in similar domains (git, testing, documentation) are most likely to overlap.

---

## Step 2: Run Conflict Detection

Detect conflicts across all your skills:

```bash
skill-creator detect-conflicts
```

### Understanding the Output

**No conflicts found:**

```
Scanning 5 skills for conflicts...

No conflicts detected above threshold (0.85)
```

**Conflicts found:**

```
Scanning 5 skills for conflicts...

Conflicts found:

  [HIGH] commit-helper <-> git-workflow (92% similar)
         commit-helper: "Generates commit messages for code changes"
         git-workflow: "Helps write commit messages following conventions"

  [MEDIUM] code-review <-> pr-feedback (87% similar)
           code-review: "Reviews code for bugs and style issues"
           pr-feedback: "Provides feedback on pull request changes"

2 conflicts detected
```

### Output Components

| Component | Meaning |
|-----------|---------|
| Severity tag | HIGH, MEDIUM based on similarity score |
| Skill names | The two conflicting skills |
| Similarity % | How similar the descriptions are (higher = more conflict) |
| Descriptions | Both descriptions shown for comparison |

### Checking Specific Skills

To check one skill against all others:

```bash
skill-creator detect-conflicts commit-helper
```

This is useful when adding a new skill to an existing collection.

### Adjusting Sensitivity

The default threshold is 0.85 (85% similarity). Adjust for stricter or looser detection:

```bash
# Stricter: only flag very similar skills
skill-creator detect-conflicts --threshold=0.90

# Looser: catch more potential conflicts
skill-creator detect-conflicts --threshold=0.80
```

> **Checkpoint:** Note any conflicts with score > 0.7.
>
> For each conflict, write down:
> - Both skill names
> - Similarity percentage
> - Whether this conflict affects your workflow
>
> If you have no conflicts, continue anyway - the resolution strategies apply when conflicts arise.

For all detection options, see [CLI Reference: detect-conflicts](../CLI.md#detect-conflicts).

---

## Step 3: Analyze Conflict Results

Before resolving, understand why skills conflict.

### Reading the Conflict Report

For each conflict, identify:

1. **What overlaps:** Which keywords or concepts appear in both descriptions?
2. **Why they conflict:** Is it the same capability, or similar but distinct?
3. **Impact:** Does this conflict actually cause problems in your workflow?

### Example Analysis

**Conflict:**
```
[HIGH] commit-helper <-> git-workflow (92% similar)
```

**Overlapping concepts:**

| Concept | commit-helper | git-workflow |
|---------|---------------|--------------|
| "commit" | Yes | Yes |
| "messages" | Yes | Yes |
| "conventions" | Implicit | Explicit |
| "git" | Implicit | Explicit |

**Why they conflict:** Both skills activate on commit-related prompts. Claude cannot reliably choose between them.

**Impact assessment:**

| Question | Answer |
|----------|--------|
| Do I need both skills? | Maybe - one is more detailed |
| Do they serve different purposes? | No - both do the same thing |
| Have I experienced activation problems? | Yes - wrong skill activates sometimes |

### Creating a Conflict Summary

For each conflict, document:

```
Conflict: commit-helper <-> git-workflow
Similarity: 92%
Overlapping keywords: commit, messages, write
Same purpose: Yes - both generate commit messages
Recommended action: Merge into single skill
```

> **Checkpoint:** For each conflict, identify the overlapping keywords or phrases.
>
> Write your analysis:
> - Conflict 1: [skill-a] <-> [skill-b], overlaps on: [keywords]
> - Conflict 2: ...
>
> If the overlap is purely coincidental (different domains, same words), the conflict may not need resolution.

---

## Step 4: Resolution Strategies

Choose a resolution strategy based on your analysis.

### Strategy 1: Merge

Combine two skills into one broader skill.

**When to use:**
- Both skills serve the same purpose
- Content is complementary, not contradictory
- You do not need them to activate separately

**Process:**

1. Create a new skill with combined content
2. Write a description covering both use cases
3. Delete the original conflicting skills
4. Generate new tests for the merged skill

**Example:**

Before:
- `commit-helper`: Basic commit format
- `git-workflow`: Advanced commit conventions

After:
- `commit-workflow`: Complete commit guidance combining both

**Merged description:**
```
Generates conventional commit messages and guides git commit workflow. Use when committing changes, writing commit messages, or following commit conventions. Covers basic format, type prefixes, scope usage, and body guidelines.
```

### Strategy 2: Specialize

Make each skill's description more specific to reduce overlap.

**When to use:**
- Skills serve distinct but related purposes
- You need both skills to exist independently
- Clear differentiation is possible

**Process:**

1. Identify the unique aspect of each skill
2. Rewrite descriptions to emphasize differences
3. Add exclusion phrases ("Do not activate for...")
4. Re-run conflict detection to verify

**Example:**

Before (92% similar):
- `commit-helper`: "Generates commit messages for code changes"
- `git-workflow`: "Helps write commit messages following conventions"

After (68% similar):
- `commit-helper`: "Generates brief one-line commit messages for quick changes. Use when making small commits or hotfixes. Do not activate for major features or when conventions discussion is needed."
- `git-workflow`: "Comprehensive git workflow guide including branching, rebasing, and conventional commits. Use when discussing git strategy, PR workflows, or commit conventions for large features."

### Strategy 3: Delete

Remove the redundant skill.

**When to use:**
- One skill supersedes the other
- You do not actually use one of the skills
- Skill was created by mistake or experiment

**Process:**

1. Decide which skill to keep
2. Verify the remaining skill covers all needed functionality
3. Delete the redundant skill

```bash
skill-creator delete git-workflow
```

### Decision Tree

```
Do both skills serve the same purpose?
├── Yes → Is content complementary?
│   ├── Yes → MERGE
│   └── No → DELETE the weaker one
└── No → Can they be clearly differentiated?
    ├── Yes → SPECIALIZE
    └── No → Consider if both are needed
        ├── Yes → MERGE with sections
        └── No → DELETE the less useful one
```

> **Checkpoint:** Choose a resolution strategy for your conflicts.
>
> | Conflict | Strategy | Reason |
> |----------|----------|--------|
> | commit-helper <-> git-workflow | Merge | Same purpose, complementary content |
> | code-review <-> pr-feedback | Specialize | Different scopes (all code vs PR only) |

---

## Step 5: Implement Resolution

Apply your chosen strategy and verify the conflict is resolved.

### Example: Specializing Descriptions

**Original conflict:**

```
[HIGH] code-review <-> pr-feedback (87% similar)
```

**Step 1: Edit code-review**

```yaml
---
name: code-review
description: Reviews code for bugs, security issues, and style problems. Use when asking for code review, checking code quality, or when user mentions 'review', 'bugs', 'code quality'. Focuses on individual code snippets and files. Do not activate for pull request workflow or PR comments.
---
```

**Step 2: Edit pr-feedback**

```yaml
---
name: pr-feedback
description: Provides structured feedback on pull requests including summary, concerns, and approval recommendations. Use when reviewing PRs, writing PR comments, or when user mentions 'pull request', 'PR review', 'merge request'. Focuses on changeset-level review. Do not activate for general code review without PR context.
---
```

**Step 3: Re-run conflict detection**

```bash
skill-creator detect-conflicts
```

**Expected result:**

```
Scanning 5 skills for conflicts...

No conflicts detected above threshold (0.85)
```

The similarity should drop below the threshold after specialization.

### Verifying Resolution

| Check | Command | Success Criteria |
|-------|---------|------------------|
| Conflict resolved | `detect-conflicts` | No HIGH severity conflicts |
| Both skills valid | `validate --all` | All validations pass |
| Activation still works | `test run <skill>` | Accuracy remains > 80% |

> **Checkpoint:** After implementing resolution, conflict score should drop below 0.7.
>
> Run: `skill-creator detect-conflicts`
>
> Expected: Previously HIGH conflicts now show MEDIUM or no longer appear.
>
> If conflict persists, make descriptions more distinct by adding exclusion phrases.

---

## Step 6: Prevent Future Conflicts

Build habits that prevent conflicts from occurring.

### Planning Skills Before Creating

Before creating a new skill:

1. Run `skill-creator list` to see existing skills
2. Check if existing skill already covers the use case
3. Run `skill-creator detect-conflicts new-skill-name` after creation

### Domain Separation Strategy

Organize skills by distinct domains with minimal overlap:

| Domain | Example Skills | Trigger Words |
|--------|---------------|---------------|
| Git | `commit-workflow`, `branch-strategy` | commit, branch, merge, rebase |
| Testing | `test-patterns`, `mock-guide` | test, mock, assert, coverage |
| TypeScript | `ts-patterns`, `type-safety` | type, interface, generic |
| Documentation | `doc-standards`, `api-docs` | document, readme, api |

Avoid multiple skills in the same domain unless clearly differentiated.

### Regular Conflict Checks

Run conflict detection periodically:

```bash
# Add to your workflow after creating/editing skills
skill-creator detect-conflicts

# In CI pipeline (see CI Integration tutorial)
skill-creator detect-conflicts --json
```

### Pre-Creation Checklist

Before creating a new skill, verify:

- [ ] No existing skill covers this use case
- [ ] Description uses unique trigger words
- [ ] Domain does not overlap with existing skills
- [ ] "Do not activate for..." exclusions are specific

> **Checkpoint:** Create a domain map for your skills.
>
> | Domain | Skills | Status |
> |--------|--------|--------|
> | Git | commit-workflow | No conflicts |
> | Testing | test-patterns, mock-guide | Checked, distinct |
>
> This map helps you plan new skills without introducing conflicts.

For automated conflict checking in CI, see [CI Integration Tutorial](ci-integration.md).

---

## Summary

### What You Accomplished

- Identified potential conflicts between your skills
- Analyzed why skills conflict (semantic, trigger, domain)
- Applied resolution strategies (merge, specialize, delete)
- Verified resolution through re-running detection
- Established practices to prevent future conflicts

### Key Takeaways

| Principle | Why It Matters |
|-----------|----------------|
| Domain separation | Skills in different domains rarely conflict |
| Specific descriptions | Explicit triggers reduce overlap |
| Exclusion phrases | "Do not activate for..." prevents false positives |
| Regular checking | Catch conflicts before they cause problems |

### Command Reference

| Task | Command |
|------|---------|
| Check all conflicts | `skill-creator detect-conflicts` |
| Check specific skill | `skill-creator detect-conflicts <name>` |
| Adjust threshold | `skill-creator detect-conflicts --threshold=0.90` |
| JSON output | `skill-creator detect-conflicts --json` |

### Resolution Quick Reference

| Situation | Strategy |
|-----------|----------|
| Same purpose, complementary | Merge |
| Different purposes, similar words | Specialize |
| One supersedes the other | Delete redundant |
| Unclear if needed | Try specializing first |

### Next Steps

With conflict-free skills, learn to:

1. **[Calibration](calibration.md):** Optimize activation thresholds for even better accuracy
2. **[CI Integration](ci-integration.md):** Automate conflict detection in your pipeline

---

[Back to Getting Started](../GETTING-STARTED.md) | [Previous: Skill Creation](skill-creation.md) | [Next: Calibration](calibration.md)
