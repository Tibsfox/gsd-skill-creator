# Tutorial: Creating and Testing a Skill

[Back to Getting Started](../GETTING-STARTED.md) | [Next: Conflict Detection](conflict-detection.md)

**Time:** 15 minutes
**Prerequisites:** skill-creator installed ([Installation Guide](../../INSTALL.md))

---

## What You Will Learn

By the end of this tutorial, you will be able to:

- Plan a skill that solves a real workflow problem
- Create a skill with a reliable activation description
- Validate the skill against official Claude Code format
- Generate test cases to verify activation behavior
- Run tests and interpret the results
- Iterate on skill descriptions to improve activation

## What You Will Build

A working skill that activates reliably for your intended use case. The example walks through creating a skill, but you should substitute your own skill idea to get hands-on experience with a real workflow.

---

## Step 1: Plan Your Skill

Before creating a skill, identify a repeatable task in your workflow that would benefit from persistent instructions.

### Good Skill Candidates

Skills work best for:

| Candidate Type | Example |
|----------------|---------|
| Repeated workflows | "Every time I commit, I want conventional format" |
| Domain expertise | "When reviewing code, check these security patterns" |
| Project conventions | "Use this test structure for all new tests" |
| Language patterns | "When writing TypeScript, prefer these idioms" |

### Poor Skill Candidates

Skills are less effective for:

- One-time tasks (just ask Claude directly)
- Highly variable workflows (too broad to activate reliably)
- Information you need rarely (context budget cost exceeds benefit)

### Define Your Skill

Answer these questions before proceeding:

1. **Name:** What short, descriptive name captures the skill? (lowercase, hyphens only)
2. **Purpose:** What does this skill help with?
3. **Triggers:** When should this skill activate? What words or phrases indicate it is needed?

> **Checkpoint:** Write down your answers.
>
> Example:
> - Name: `git-commit-helper`
> - Purpose: Generate conventional commit messages following Angular format
> - Triggers: "commit", "commit message", "conventional commits", "committing changes"
>
> If you cannot articulate when the skill should activate, stop and refine your idea before continuing.

---

## Step 2: Create the Skill

Run the skill creation command:

```bash
skill-creator create
```

The interactive wizard prompts for three inputs:

### Prompt 1: Skill Name

Enter a lowercase name with hyphens:

```
? Skill name: git-commit-helper
```

**Naming rules:**
- Lowercase letters and hyphens only
- No spaces, underscores, or special characters
- Cannot match reserved Claude Code command names

### Prompt 2: Description

The description determines when Claude Code activates the skill automatically. This is the most important field.

**Use the "Use when..." pattern:**

```
? Description: Generates conventional commit messages following Angular format. Use when committing changes, writing commit messages, or when user mentions 'commit', 'conventional commits', or 'commit message format'.
```

**Description anatomy:**

| Part | Purpose | Example |
|------|---------|---------|
| What it does | Brief capability summary | "Generates conventional commit messages following Angular format" |
| Use when... | Explicit activation triggers | "Use when committing changes, writing commit messages" |
| Keyword list | Specific trigger words | "commit, conventional commits, commit message format" |

**Why this pattern matters:**

Claude Code scans skill descriptions to decide which skills to activate. Vague descriptions like "helps with git" activate unreliably. Specific descriptions with explicit triggers activate consistently.

**Quality comparison:**

| Quality | Description | Activation Rate |
|---------|-------------|-----------------|
| Poor | "Helps with git" | ~20% |
| Medium | "Generates commit messages" | ~60% |
| Good | "Generates conventional commit messages. Use when committing changes or writing commit messages." | ~90% |

### Prompt 3: Content

Enter the skill instructions. This is what Claude sees when the skill activates:

```
? Content: (Press Enter for multi-line editor)
```

The multi-line editor opens. Enter your skill content:

```markdown
## Conventional Commit Format

Structure: `type(scope): description`

### Types

| Type | When to Use |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| style | Formatting, no logic change |
| refactor | Code change, no feature/fix |
| test | Adding or updating tests |
| chore | Maintenance tasks |

### Guidelines

- Keep the first line under 72 characters
- Use imperative mood ("add" not "added")
- Reference issues when applicable: `feat(ui): add dark mode (#123)`
```

> **Checkpoint:** After creation, you should see:
> ```
> Skill created: git-commit-helper
> Location: ~/.claude/skills/git-commit-helper/SKILL.md
> ```
>
> Verify with: `skill-creator list`
>
> Your new skill should appear in the list with its description.

---

## Step 3: Validate the Skill

Validation ensures the skill follows the official Claude Code format. Skills that fail validation may not load correctly.

Run validation:

```bash
skill-creator validate git-commit-helper
```

### Validation Checks

| Check | What It Verifies |
|-------|------------------|
| Name format | Lowercase, hyphens, no reserved names |
| Directory structure | Correct `skill-name/SKILL.md` layout |
| Metadata schema | Valid YAML frontmatter with required fields |
| Directory/name match | Directory name matches frontmatter name |

### Interpreting Results

**All checks pass:**

```
Validating skill: git-commit-helper

[PASS] Name format valid
[PASS] Directory structure valid
[PASS] Metadata schema valid
[PASS] Directory/name match

Validation passed
```

**Check fails:**

```
Validating skill: git-commit-helper

[PASS] Name format valid
[FAIL] Directory structure valid
       Expected: git-commit-helper/SKILL.md
       Found: git-commit-helper.md

Validation failed
```

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Invalid name format | Uppercase or special characters | Rename with lowercase and hyphens only |
| Directory structure invalid | Flat file instead of subdirectory | Run `skill-creator migrate` |
| Reserved name | Conflicts with Claude command | Choose a different name |
| Missing frontmatter | No YAML header | Recreate skill with `skill-creator create` |

> **Checkpoint:** Validation should pass with all checks green.
>
> ```
> Validation passed
> ```
>
> If validation fails, fix the reported issues before continuing.

For all validation options, see [CLI Reference: validate](../CLI.md#validate).

---

## Step 4: Generate Test Cases

Test cases verify that your skill activates for intended prompts and does not activate for unrelated prompts.

### Why Testing Matters

A skill that activates unreliably creates problems:

- **False negatives:** Skill does not activate when it should, user does not get expected help
- **False positives:** Skill activates when it should not, cluttering context with irrelevant instructions

Testing catches these issues before they affect your workflow.

### Generate Tests

Run test generation:

```bash
skill-creator test generate git-commit-helper
```

The generator creates test cases based on your skill description:

1. **Positive tests:** Prompts that should activate the skill
2. **Negative tests:** Prompts that should not activate the skill

### Review Workflow

For each generated test, you can:

| Action | When to Use |
|--------|-------------|
| Accept | Test case looks correct |
| Edit | Good idea but wording needs adjustment |
| Skip | Not sure, revisit later |

**Example positive test:**

```
Prompt: "help me write a commit message for these changes"
Expected: positive (should activate)

Accept / Edit / Skip?
```

**Example negative test:**

```
Prompt: "what is the git log command?"
Expected: negative (should NOT activate)
Reason: Information query about git, not a commit request

Accept / Edit / Skip?
```

### Test Coverage

Good test coverage includes:

- Direct trigger phrases ("commit my changes")
- Indirect triggers ("save my work with a good message")
- Negative cases from related domains ("what is git?")
- Edge cases ("commit" mentioned but not a commit request)

> **Checkpoint:** After generation, you should see:
> ```
> Generated 10 test cases for git-commit-helper
>
> Positive tests: 5
> Negative tests: 5
>
> Tests saved to: ~/.claude/skills/git-commit-helper/tests.json
> ```
>
> Verify with: `skill-creator test list git-commit-helper`
>
> You should see a table of test cases.

For all generation options, see [CLI Reference: test generate](../CLI.md#test-generate).

---

## Step 5: Run Tests

Execute the test suite to measure activation accuracy.

Run tests:

```bash
skill-creator test run git-commit-helper
```

### Test Execution

Each test case runs through the activation simulator:

1. Simulator receives the test prompt
2. Computes activation score against all skills
3. Compares result to expected behavior
4. Reports pass/fail for each test

### Interpreting Results

```
Running tests for: git-commit-helper

[PASS] "help me write a commit message" (positive, 87.2%)
[PASS] "commit these changes" (positive, 91.5%)
[PASS] "what is git log?" (negative, 12.3%)
[FAIL] "save my work" (positive, 43.1%)
...

Results: 9/10 passed (90% accuracy)
False positives: 0
False negatives: 1
```

### Key Metrics

| Metric | Good Value | Meaning |
|--------|------------|---------|
| Accuracy | > 80% | Percentage of tests that match expected behavior |
| False positive rate | < 10% | Skill activates when it should not |
| False negative rate | < 20% | Skill does not activate when it should |

### What Test Results Mean

| Result | Interpretation | Action |
|--------|----------------|--------|
| High accuracy (>90%) | Skill description is well-tuned | Continue to deployment |
| Medium accuracy (70-90%) | Some edge cases to address | Refine description triggers |
| Low accuracy (<70%) | Description needs significant work | Rewrite description using "Use when..." pattern |
| High false positives | Description too broad | Add more specific trigger keywords |
| High false negatives | Description too narrow | Add more activation phrases |

> **Checkpoint:** Tests should pass with >80% accuracy.
>
> ```
> Results: 9/10 passed (90% accuracy)
> False positives: 0
> ```
>
> If accuracy is below 80%, proceed to Step 6 to improve the description.

For verbose output with confidence scores, see [CLI Reference: test run](../CLI.md#test-run).

---

## Step 6: Iterate (Optional)

If test accuracy is below target, improve the skill description.

### Identify the Problem

Review failed tests to understand the pattern:

| Failure Pattern | Problem | Solution |
|-----------------|---------|----------|
| Multiple false negatives | Description missing trigger phrases | Add more "Use when..." phrases |
| Multiple false positives | Description too generic | Make triggers more specific |
| Edge case failures | Ambiguous phrasing | Clarify when skill should vs should not activate |

### Edit the Skill

Open the skill file directly:

```bash
# Location shown during creation
# Example: ~/.claude/skills/git-commit-helper/SKILL.md
```

Update the description in the YAML frontmatter:

```yaml
---
name: git-commit-helper
description: Generates conventional commit messages following Angular format. Use when committing changes, writing commit messages, finalizing work, or when user mentions 'commit', 'conventional commits', 'commit message format', 'save changes'. Do not activate for general git questions or log viewing.
---
```

**Improvement techniques:**

1. **Add missing triggers:** If "save my work" failed, add "save" and "finalize" to triggers
2. **Add exclusions:** "Do not activate for general git questions" reduces false positives
3. **Be explicit:** List specific keywords rather than relying on semantic understanding

### Re-run Tests

After editing:

```bash
skill-creator test run git-commit-helper
```

### The Test-Driven Skill Development Cycle

```
Create skill → Generate tests → Run tests → Review failures → Edit description → Re-run tests
       ↑                                                                              |
       └──────────────────────────────────────────────────────────────────────────────┘
```

Continue iterating until accuracy exceeds your target threshold.

> **Checkpoint:** After iteration, accuracy should improve.
>
> Before: 70% accuracy
> After: 92% accuracy
>
> When satisfied with accuracy, the skill is ready for regular use.

For advanced threshold optimization, see [Calibration Tutorial](calibration.md).

---

## Summary

### What You Accomplished

- Created a skill with a reliable activation description
- Validated the skill against Claude Code format
- Generated test cases for positive and negative scenarios
- Measured activation accuracy through test execution
- Learned to iterate based on test feedback

### Key Takeaways

| Principle | Why It Matters |
|-----------|----------------|
| Description quality is critical | The "Use when..." pattern improves activation from 20% to 90% |
| Test before deploying | Catch false positives/negatives before they affect workflow |
| Iterate based on data | Test results guide description improvements |
| Be specific, not generic | Explicit triggers outperform vague descriptions |

### Command Reference

| Task | Command |
|------|---------|
| Create skill | `skill-creator create` |
| List skills | `skill-creator list` |
| Validate skill | `skill-creator validate <name>` |
| Generate tests | `skill-creator test generate <name>` |
| Run tests | `skill-creator test run <name>` |

### Next Steps

Now that you can create and test skills, learn to:

1. **[Conflict Detection](conflict-detection.md):** Find and resolve semantic overlap between skills
2. **[Calibration](calibration.md):** Optimize activation thresholds based on real usage
3. **[CI Integration](ci-integration.md):** Add skill quality checks to your CI pipeline

---

[Back to Getting Started](../GETTING-STARTED.md) | [Next: Conflict Detection](conflict-detection.md)
