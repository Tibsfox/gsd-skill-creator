# CLI Reference

`skill-creator` is the command-line interface for managing Claude Code skills. It provides commands for creating, validating, testing, and optimizing skills throughout their lifecycle.

## Cheat Sheet

Quick reference for all commands organized by workflow stage.

### Create: Skill Authoring

| Command | Alias | Description |
|---------|-------|-------------|
| [create](#create) | `c` | Create a new skill through guided workflow |
| [list](#list) | `ls` | List all available skills with metadata |
| [search](#search) | `s` | Search skills by keyword interactively |
| [delete](#delete) | `del`, `rm` | Delete a skill |
| [resolve](#resolve) | `res` | Show which version of a skill is active |

### Validate: Quality Assurance

| Command | Alias | Description |
|---------|-------|-------------|
| [validate](#validate) | `v` | Validate skill structure and metadata |
| [detect-conflicts](#detect-conflicts) | `dc`, `conflicts` | Detect semantic conflicts between skills |
| [score-activation](#score-activation) | `sa`, `score` | Score skill activation likelihood |

### Test: Activation Testing

| Command | Alias | Description |
|---------|-------|-------------|
| [test](#test) | `t` | Manage skill test cases |
| [simulate](#simulate) | `sim` | Predict which skill would activate for a prompt |

### Calibrate: Threshold Optimization

| Command | Alias | Description |
|---------|-------|-------------|
| [calibrate](#calibrate) | `cal` | Optimize activation threshold from calibration data |
| [benchmark](#benchmark) | `bench` | Measure simulator accuracy vs real activation |

### Utilities

| Command | Alias | Description |
|---------|-------|-------------|
| [migrate](#migrate) | `mg` | Migrate legacy flat-file skills to subdirectory format |
| [migrate-agent](#migrate-agent) | `ma` | Migrate agents with legacy tools format |
| [budget](#budget) | `bg` | Show character budget usage across all skills |
| [invoke](#invoke) | `i` | Manually invoke a skill by name |
| [status](#status) | `st` | Show active skills and token budget |
| [suggest](#suggest) | `sg` | Analyze patterns and review skill suggestions |
| [suggestions](#suggestions) | `sgs` | List/manage skill suggestions |
| [feedback](#feedback) | `fb` | View feedback for skills |
| [refine](#refine) | `rf` | Generate and apply skill refinements |
| [history](#history) | `hist` | View skill version history |
| [rollback](#rollback) | `rb` | Rollback skill to previous version |
| [agents](#agents) | `ag` | Manage agent suggestions from skill clusters |
| [sync-reserved](#sync-reserved) | `sync` | Show/update reserved skill names list |
| [reload-embeddings](#reload-embeddings) | `re` | Reload embedding model (retry after fallback) |

---

## Global Options

Options that apply across multiple commands. Understanding the distinction between targeting and filtering is important for correct usage.

### Target vs Filter

- `--project, -p` = **TARGET** (where to operate)
- `--scope=<value>` = **FILTER** (what to show)

### --project, -p

Target project-level scope for operations. Without this flag, operations default to user-level (`~/.claude/skills/`).

- `--project`: Use project-level skills at `.claude/skills/`
- `-p`: Short form

**Applies to:** create, delete, validate, migrate, budget, detect-conflicts, score-activation

```bash
# Create skill at user level (default)
skill-creator create

# Create skill at project level
skill-creator create --project

# Delete from project scope
skill-creator delete my-skill -p
```

### --scope=<value>

Filter list output by scope. Only applies to the `list` command.

- `--scope=user`: Show only user-level skills
- `--scope=project`: Show only project-level skills
- `--scope=all`: Show skills from both scopes (default)

```bash
# Show all skills (default)
skill-creator list

# Show only user-level skills
skill-creator list --scope=user

# Show only project-level skills
skill-creator list --scope=project
```

### --verbose, -v

Show detailed output with additional information.

**Applies to:** score-activation, simulate, reload-embeddings

```bash
# Score with factor breakdown
skill-creator sa my-skill --verbose

# Simulation with trace details
skill-creator simulate "commit changes" -v
```

### --quiet, -q

Suppress non-essential output. Produces minimal, machine-friendly output.

**Applies to:** detect-conflicts, score-activation

```bash
# One line per conflict
skill-creator dc --quiet

# Minimal score output (skillName,score,label)
skill-creator sa --all --quiet
```

### --json

Output as JSON for scripting and CI integration.

**Applies to:** detect-conflicts, score-activation, test list, simulate, benchmark

```bash
# JSON for CI pipeline
skill-creator detect-conflicts --json

# Parse scores programmatically
skill-creator sa --all --json | jq '.results[].score'
```

---

## Create: Skill Authoring

Commands for creating, browsing, and managing skills.

### create

Create a new skill through guided workflow.

**Synopsis:**

```
skill-creator create [--project]
```

**Description:**

Interactive workflow that prompts for skill name, description, and content. Creates a properly formatted skill with YAML frontmatter in the appropriate location.

**Options:**

- `--project, -p`: Create at project-level scope (`.claude/skills/`)

**Examples:**

```bash
# Create a user-level skill (stored in ~/.claude/skills/)
skill-creator create

# Create a project-level skill (stored in .claude/skills/)
skill-creator create --project

# Short form
skill-creator c -p
```

---

### list

List all available skills with metadata.

**Synopsis:**

```
skill-creator list [--scope=<value>]
```

**Description:**

Shows all skills with their name, scope indicator, and description preview. Skills are displayed from both user and project scopes by default, with project-level skills taking precedence when names conflict.

**Options:**

- `--scope=user|project|all`: Filter by scope (default: all)

**Examples:**

```bash
# List all skills from both scopes
skill-creator list

# List only user-level skills
skill-creator list --scope=user

# List only project-level skills
skill-creator ls --scope=project
```

---

### search

Search skills by keyword interactively.

**Synopsis:**

```
skill-creator search
```

**Description:**

Interactive fuzzy search across skill names and descriptions. Type to filter, use arrow keys to navigate, and press Enter to select. Useful when you have many skills and need to quickly find one.

**Examples:**

```bash
# Launch interactive search
skill-creator search

# Short form
skill-creator s
```

---

### delete

Delete a skill.

**Synopsis:**

```
skill-creator delete <skill-name> [--project]
```

**Description:**

Removes a skill from the specified scope. If a version exists at both user and project scope, deleting one will make the other become active. The command warns about this before confirming deletion.

**Options:**

- `--project, -p`: Delete from project-level scope

**Examples:**

```bash
# Delete from user scope (default)
skill-creator delete my-commit-helper

# Delete from project scope
skill-creator delete react-patterns --project

# Short forms
skill-creator del my-skill
skill-creator rm my-skill -p
```

---

### resolve

Show which version of a skill is active.

**Synopsis:**

```
skill-creator resolve <skill-name>
```

**Description:**

When a skill exists at both user and project scope, project-level takes precedence. This command shows which version Claude Code will actually use and whether another version is being shadowed.

**Examples:**

```bash
# Check which version is active
skill-creator resolve my-commit-helper

# Short form
skill-creator res react-patterns
```

**Sample Output:**

```
Skill: my-commit-helper

+ Active: Project-level
  Path: .claude/skills/my-commit-helper/SKILL.md
  Description: Generate conventional commit messages...

o Shadowed: User-level
  Path: ~/.claude/skills/my-commit-helper/SKILL.md
  This version exists but is overridden by project-level.
```

---

## Validate: Quality Assurance

Commands for checking skill correctness and identifying potential issues.

### validate

Validate skill structure and metadata.

**Synopsis:**

```
skill-creator validate [<skill-name>] [--all] [--project]
```

**Description:**

Runs comprehensive validation checks on skills:

1. **Name validation** - Follows official Claude Code specification (lowercase, hyphens, no reserved names)
2. **Directory structure** - Correct subdirectory format with SKILL.md
3. **Metadata schema** - Valid YAML frontmatter with required fields
4. **Directory/name match** - Directory name matches frontmatter name field

**Options:**

- `--all, -a`: Validate all skills in scope
- `--project, -p`: Target project-level scope

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | All validations passed |
| 1 | One or more validations failed |

**Examples:**

```bash
# Validate a specific skill
skill-creator validate my-commit-helper

# Validate all user-level skills
skill-creator validate --all

# Validate all project-level skills
skill-creator validate --all --project

# Short form
skill-creator v my-skill
```

---

### detect-conflicts

Detect semantic conflicts between skills.

**Synopsis:**

```
skill-creator detect-conflicts [<skill-name>] [options]
```

**Description:**

Uses embedding-based semantic analysis to find skills with overlapping descriptions that may cause activation confusion. When skills are too similar, Claude may activate the wrong one or activate multiple skills unexpectedly.

The command generates rewrite suggestions to differentiate conflicting skills. When `ANTHROPIC_API_KEY` is available, suggestions use Claude; otherwise, heuristic suggestions are provided.

**Options:**

- `--threshold=<n>`: Similarity threshold (default: 0.85, range: 0.5-0.95)
- `--quiet, -q`: Minimal output (one line per conflict)
- `--json`: JSON output for scripting
- `--project, -p`: Target project-level scope

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | No conflicts or only MEDIUM severity |
| 1 | HIGH severity conflicts detected (>90% similarity) |

**Severity Levels:**

- **HIGH** (>90% similarity): Very likely conflict, review required
- **MEDIUM** (85-90% similarity): Possible conflict, worth reviewing

**Examples:**

```bash
# Check all skills for conflicts
skill-creator detect-conflicts

# Check specific skill against others
skill-creator detect-conflicts my-commit-helper

# Use stricter threshold
skill-creator dc --threshold=0.90

# JSON output for CI pipeline
skill-creator detect-conflicts --json

# Count conflicts
skill-creator dc --quiet | wc -l

# Short forms
skill-creator dc my-skill
skill-creator conflicts --threshold=0.80
```

---

### score-activation

Score skill activation likelihood.

**Synopsis:**

```
skill-creator score-activation [<skill-name>] [options]
```

**Description:**

Analyzes skill descriptions to predict how reliably they will trigger auto-activation. Scores range from 0-100 based on description quality factors like specificity, trigger phrases, and length.

The command uses local heuristics by default (no API calls, instant results). The `--llm` flag enables deeper analysis using Claude API for single-skill analysis.

**Options:**

- `--all, -a`: Score all skills in batch mode
- `--verbose, -v`: Show factor breakdown
- `--quiet, -q`: Minimal output (skillName,score,label)
- `--json`: JSON output for scripting
- `--llm`: Use Claude API for deep analysis (requires ANTHROPIC_API_KEY)
- `--project, -p`: Target project-level scope

**Score Labels:**

| Label | Score | Meaning |
|-------|-------|---------|
| Reliable | 90+ | Very likely to auto-activate correctly |
| Likely | 70-89 | Good chance of correct activation |
| Uncertain | 50-69 | May need improvement |
| Unlikely | <50 | Needs significant improvement |

**Scoring Factors:**

- **Specificity**: Unique terms vs generic terms
- **Activation phrases**: Explicit triggers like "use when..."
- **Length**: 50-150 characters optimal
- **Imperative verbs**: Action verbs at start (Generate, Run, etc.)
- **Generic penalty**: Reduction for overused terms

**Examples:**

```bash
# Score a single skill
skill-creator score-activation my-commit-helper

# Score with detailed factor breakdown
skill-creator sa my-commit-helper --verbose

# Score all skills
skill-creator score-activation --all

# JSON output for CI
skill-creator sa --all --json

# Sort skills by score
skill-creator sa --all --quiet | sort -t, -k2n

# LLM-powered deep analysis (single skill only)
skill-creator sa my-commit-helper --llm

# LLM analysis with full breakdown
skill-creator sa my-commit-helper --llm --verbose

# Short forms
skill-creator score my-skill
skill-creator sa --all -v
```

---

## Test: Activation Testing

Commands for managing and running test cases that verify skill activation behavior.

### test

Manage skill test cases.

**Synopsis:**

```
skill-creator test <subcommand> [options]
```

**Description:**

The `test` command manages activation test cases - defining expected behavior for "should this skill activate for this prompt?" Test cases verify that skills activate correctly for intended prompts and don't activate for unrelated prompts.

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `add` | Add a new test case |
| `list` | List test cases for a skill |
| `run` | Run tests for one or all skills |
| `edit` | Edit an existing test case |
| `delete` | Delete a test case |
| `generate` | Generate test cases automatically |
| `help` | Show help text |

**Global Options:**

- `--project, -p`: Use project scope (`.claude/skills/`)

---

### test add

Add a test case to a skill.

**Synopsis:**

```
skill-creator test add <skill-name> [options]
```

**Description:**

Creates a new test case for the specified skill. Can run interactively (prompting for each field) or with flags for scripted usage. Test cases define what behavior is expected - should the skill activate (positive), not activate (negative), or is it a borderline scenario (edge-case).

**Options:**

| Option | Description |
|--------|-------------|
| `--prompt="..."` | Test prompt (required in flag mode) |
| `--expected=<value>` | Expected behavior: `positive`, `negative`, or `edge-case` |
| `--description="..."` | Description of what test verifies |
| `--tags=tag1,tag2` | Comma-separated tags for filtering |
| `--difficulty=<value>` | Test difficulty: `easy`, `medium`, or `hard` |
| `--min-confidence=<n>` | Minimum confidence for positive tests (0-1) |
| `--max-confidence=<n>` | Maximum confidence for negative tests (0-1) |
| `--reason="..."` | Why skill should not activate (for negative tests) |

**Examples:**

```bash
# Interactive mode - prompts for all fields
skill-creator test add my-commit-skill

# Flag mode - positive test case
skill-creator test add my-commit-skill \
  --prompt="commit my changes with a good message" \
  --expected=positive \
  --description="Should activate for explicit commit requests"

# Negative test case with reason
skill-creator test add my-commit-skill \
  --prompt="what is a git commit?" \
  --expected=negative \
  --reason="Information query, not an action request" \
  --max-confidence=0.3

# Edge case with tags and difficulty
skill-creator test add my-commit-skill \
  --prompt="save my work" \
  --expected=edge-case \
  --tags=ambiguous,regression \
  --difficulty=hard
```

---

### test list

List test cases for a skill.

**Synopsis:**

```
skill-creator test list <skill-name> [options]
```

**Description:**

Displays all test cases for the specified skill in a table format. Supports filtering by expected behavior or tags, and can output JSON for scripting.

**Options:**

| Option | Description |
|--------|-------------|
| `--expected=<value>` | Filter by expected: `positive`, `negative`, or `edge-case` |
| `--tags=tag1,tag2` | Filter by tags (matches any tag) |
| `--json` | Output as JSON |

**Examples:**

```bash
# List all tests
skill-creator test list my-commit-skill

# Filter by expected behavior
skill-creator test list my-commit-skill --expected=negative

# Filter by tags
skill-creator test list my-commit-skill --tags=regression,edge-case

# JSON output for scripting
skill-creator test list my-commit-skill --json

# Short form
skill-creator t ls my-skill
```

---

### test run

Run tests for one or all skills.

**Synopsis:**

```
skill-creator test run <skill-name> [options]
skill-creator test run --all [options]
```

**Description:**

Executes test cases and reports pass/fail results. Tests pass when the simulated activation matches the expected behavior. Supports CI integration with JSON output (auto-detected) and quality gate thresholds.

**Options:**

| Option | Description |
|--------|-------------|
| `--all, -a` | Run tests for all skills |
| `--verbose, -v` | Show confidence scores for all results |
| `--json=<format>` | Output as JSON: `compact` or `pretty` (auto-detected in CI) |
| `--threshold=<n>` | Activation threshold (default: 0.75) |
| `--min-accuracy=<n>` | Fail if accuracy below N% |
| `--max-false-positive=<n>` | Fail if false positive rate above N% |

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | All tests pass, thresholds met |
| 1 | Test failures or thresholds exceeded |

**CI Integration:**

When running in CI (detected via `CI=true` environment variable), JSON output is automatically enabled in compact mode. Use `--min-accuracy` and `--max-false-positive` as quality gates.

**Examples:**

```bash
# Run tests for a single skill
skill-creator test run my-commit-skill

# Run with verbose output showing confidence scores
skill-creator test run my-commit-skill --verbose

# Run tests for all skills
skill-creator test run --all

# CI mode with quality gates
skill-creator test run --all --min-accuracy=90 --max-false-positive=5

# Custom threshold
skill-creator test run my-commit-skill --threshold=0.80

# Explicit JSON output
skill-creator test run my-commit-skill --json=pretty

# Short form
skill-creator t run my-skill -v
```

---

### test edit

Edit an existing test case.

**Synopsis:**

```
skill-creator test edit <skill-name> <test-id>
```

**Description:**

Opens an interactive editor to modify an existing test case. The test ID can be a partial match (first 8 characters are typically sufficient). Current values are pre-filled and pressing Enter keeps them unchanged.

**Examples:**

```bash
# Edit by full ID
skill-creator test edit my-commit-skill abc12345-def6-7890-ghij-klmnopqrstuv

# Edit by partial ID (first 8 characters)
skill-creator test edit my-commit-skill abc12345
```

---

### test delete

Delete a test case.

**Synopsis:**

```
skill-creator test delete <skill-name> <test-id> [--force]
```

**Description:**

Removes a test case from the specified skill. Shows test details and asks for confirmation unless `--force` is used.

**Options:**

| Option | Description |
|--------|-------------|
| `--force, -f` | Skip confirmation prompt |

**Examples:**

```bash
# Delete with confirmation
skill-creator test delete my-commit-skill abc12345

# Delete without confirmation
skill-creator test delete my-commit-skill abc12345 --force

# Short forms
skill-creator t rm my-skill abc12345 -f
skill-creator t del my-skill abc12345
```

---

### test generate

Generate test cases automatically.

**Synopsis:**

```
skill-creator test generate <skill-name> [options]
```

**Description:**

Automatically generates test cases for a skill using LLM analysis and/or heuristic patterns. Generated tests go through a review workflow where you can approve, edit, or reject each one before saving.

When `ANTHROPIC_API_KEY` is available, Claude Haiku generates context-aware test cases. Otherwise, heuristic generation creates tests based on skill description patterns.

**Options:**

| Option | Description |
|--------|-------------|
| `--count=<n>` | Tests per type (default: 5, max: 50) |
| `--no-review` | Save all generated tests without review |
| `--no-llm` | Skip LLM, use heuristic only |

**Examples:**

```bash
# Generate with default settings (5 positive, 5 negative)
skill-creator test generate my-commit-skill

# Generate more tests
skill-creator test generate my-commit-skill --count=20

# Skip review and save all
skill-creator test generate my-commit-skill --no-review

# Heuristic only (no API calls)
skill-creator test generate my-commit-skill --no-llm

# Combined options
skill-creator test generate my-commit-skill --count=10 --no-review

# Short form
skill-creator t gen my-skill
```

---

### simulate

Predict which skill would activate for a prompt.

**Synopsis:**

```
skill-creator simulate "<prompt>" [options]
skill-creator simulate --batch=<file> [options]
```

**Description:**

Runs activation simulation to predict which skill (if any) would activate for a given prompt. Useful for debugging activation behavior before creating test cases, or for batch analysis of prompt patterns.

In batch mode, reads prompts from a file (one per line). Lines starting with `#` are treated as comments and ignored.

**Options:**

| Option | Description |
|--------|-------------|
| `--verbose, -v` | Show all predictions and trace details |
| `--threshold=<n>` | Activation threshold (default: 0.75) |
| `--json` | Output as JSON |
| `--batch=<file>` | Read prompts from file (one per line) |
| `--project, -p` | Use project scope |

**Examples:**

```bash
# Single prompt simulation
skill-creator simulate "commit my changes"

# Verbose output with all predictions
skill-creator simulate "run database migrations" --verbose

# Custom threshold
skill-creator simulate "save my work" --threshold=0.80

# JSON output for scripting
skill-creator simulate "test prompt" --json

# Batch mode from file
skill-creator simulate --batch=prompts.txt

# Batch with JSON output
skill-creator simulate --batch=prompts.txt --json

# Project scope
skill-creator simulate "deploy to production" --project

# Short form
skill-creator sim "commit changes" -v
```

**Batch File Format:**

```
# Comments start with #
commit my changes
what is a commit?
save work and push
# Another comment
deploy to production
```

---

## Calibrate: Threshold Optimization

Commands for optimizing activation thresholds and measuring simulator accuracy.

### Calibration Workflow

The calibration workflow improves activation accuracy over time:

1. **Use skills normally** - Activation events are recorded automatically when skills activate or don't activate
2. **Accumulate data** - Wait until you have at least 75 events with known outcomes
3. **Run calibration** - `skill-creator calibrate` finds the F1-optimal threshold
4. **Review and apply** - Preview the proposed threshold and confirm before applying
5. **Verify improvement** - `skill-creator benchmark` measures real-world accuracy

---

### calibrate

Optimize activation threshold from calibration data.

**Synopsis:**

```
skill-creator calibrate [options]
skill-creator calibrate rollback
skill-creator calibrate history
```

**Description:**

Analyzes collected activation events to find the optimal threshold that maximizes F1 score (balance of precision and recall). Shows a preview of current vs optimal threshold with expected improvement before applying changes.

Requires at least 75 events with known outcomes before calibration can run. Events are collected automatically during normal skill usage.

**Options:**

| Option | Description |
|--------|-------------|
| `--preview` | Show proposed changes without applying |
| `--force, -f` | Skip confirmation prompt |

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `rollback` | Revert to the previous threshold |
| `history` | Show threshold history |

**Examples:**

```bash
# Preview calibration without applying
skill-creator calibrate --preview

# Run calibration with confirmation
skill-creator calibrate

# Apply without confirmation
skill-creator calibrate --force

# Short form
skill-creator cal
skill-creator cal --preview
```

**Sample Output:**

```
Calibration Analysis

Current threshold: 0.75 (F1: 82.3%)
Optimal threshold: 0.72 (F1: 87.1%)
Improvement: +4.8%

Based on 156 calibration events

? Apply new threshold 0.72? (Y/n)
```

---

### calibrate rollback

Revert to the previous threshold.

**Synopsis:**

```
skill-creator calibrate rollback
```

**Description:**

Undoes the most recent threshold change by reverting to the previous value in the threshold history. Useful if a calibration made activation behavior worse.

**Example:**

```bash
# Undo last calibration
skill-creator calibrate rollback

# Or equivalently
skill-creator cal rollback
```

**Sample Output:**

```
Rolled back to threshold 0.75
From: 2/4/2026, 3:45:00 PM
F1 score: 82.3%
Reason: calibration
```

---

### calibrate history

Show threshold history.

**Synopsis:**

```
skill-creator calibrate history
```

**Description:**

Displays all threshold snapshots with timestamps, F1 scores, and the reason for each change. The current active threshold is highlighted with `>`.

**Example:**

```bash
skill-creator calibrate history
```

**Sample Output:**

```
Threshold History

  Timestamp            Threshold    F1       Reason
  ------------------------------------------------------------
> 2/5/2026, 10:30 AM   0.72         87.1%    calibration
  2/4/2026, 3:45 PM    0.75         82.3%    calibration
  2/1/2026, 9:00 AM    0.75         78.5%    manual

Total: 3 snapshot(s)
```

---

### benchmark

Measure simulator accuracy vs real activation.

**Synopsis:**

```
skill-creator benchmark [options]
```

**Description:**

Computes correlation between simulated activation predictions and actual activation outcomes. Reports Matthews Correlation Coefficient (MCC), agreement rate, and confusion matrix breakdown.

Results are always written to `.planning/calibration/benchmark.json` for tracking over time, regardless of output mode.

**Options:**

| Option | Description |
|--------|-------------|
| `--verbose, -v` | Show per-skill breakdown |
| `--json` | Output JSON only |

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | Correlation >= 85% |
| 1 | Correlation < 85% |

**Examples:**

```bash
# Summary view
skill-creator benchmark

# Detailed per-skill breakdown
skill-creator benchmark --verbose

# JSON output for scripting
skill-creator benchmark --json

# Short form
skill-creator bench -v
```

**Sample Output:**

```
Benchmark Report

Correlation (MCC): 87%
Agreement rate: 91%

Confusion Matrix:
  True Positives:  142
  True Negatives:   89
  False Positives:  12
  False Negatives:  13

JSON written to: .planning/calibration/benchmark.json
```

**CI Integration:**

Use the exit code for CI quality gates:

```bash
# Fail CI if correlation drops below 85%
skill-creator benchmark || exit 1
```

---

## Utils: Utilities

Commands for migration, budget management, pattern detection, and system maintenance.

### Migration Commands

Commands for migrating skills and agents from legacy formats to current specifications.

---

### migrate

Migrate legacy flat-file skills to subdirectory format.

**Synopsis:**

```
skill-creator migrate [<skill-name>] [--project]
```

**Description:**

Scans for skills using the legacy flat-file format (`skill-name.md`) and migrates them to the current subdirectory format (`skill-name/SKILL.md`). Without a skill name, interactively migrates all detected legacy skills. With a skill name, migrates only that specific skill.

**Options:**

- `--project, -p`: Target project-level scope (`.claude/skills/`)

**Examples:**

```bash
# Scan and migrate all legacy skills interactively
skill-creator migrate

# Migrate a specific skill
skill-creator migrate my-commit-helper

# Migrate project-level skills
skill-creator migrate --project

# Short form
skill-creator mg my-skill -p
```

---

### migrate-agent

Migrate agents with legacy tools format.

**Synopsis:**

```
skill-creator migrate-agent [<agent-name>] [--dry-run]
```

**Description:**

Detects and fixes agents using the legacy array-style tools format. Converts tools arrays to the required comma-separated string format and corrects tool name casing issues.

Without an agent name, scans all agents in `.claude/agents/` and offers to migrate those needing fixes. With an agent name, migrates only that specific agent.

**Options:**

- `--dry-run, -d`: Preview changes without writing to files

**Examples:**

```bash
# Check all agents for legacy format issues
skill-creator migrate-agent

# Migrate a specific agent
skill-creator migrate-agent react-fullstack

# Preview changes without modifying files
skill-creator migrate-agent --dry-run

# Dry run for specific agent
skill-creator ma react-fullstack -d

# Short form
skill-creator ma
```

---

### Budget and Status

Commands for monitoring skill size and token budget usage.

---

### budget

Show character budget usage across all skills.

**Synopsis:**

```
skill-creator budget [--project]
```

**Description:**

Displays current character budget consumption with visual progress bar and per-skill breakdown. Claude Code limits skills to approximately 15,000 characters per skill and 15,500 characters cumulative. Skills exceeding the budget may be silently hidden.

Shows severity indicators and actionable suggestions when approaching or exceeding limits.

**Options:**

- `--project, -p`: Check project-level skills (`.claude/skills/`)

**Examples:**

```bash
# Check user-level skill budget
skill-creator budget

# Check project-level skill budget
skill-creator budget --project

# Short form
skill-creator bg -p
```

**Sample Output:**

```
Character Budget
[████████████░░░░░░░░] 62% (9,300 / 15,500 chars)

Per-Skill Breakdown
(sorted by size, largest first)

  [████░░░░░░] typescript-patterns
       4,200 chars (27% of budget)
       desc: 150, body: 4,050

  [███░░░░░░░] react-hooks
       3,100 chars (20% of budget)
       desc: 120, body: 2,980
```

---

### status

Show active skills and token budget.

**Synopsis:**

```
skill-creator status
```

**Description:**

Displays currently loaded skills in the session with their token counts and remaining budget. Also lists any skills flagged for review (where token cost exceeds savings).

**Examples:**

```bash
# Show active skills
skill-creator status

# Short form
skill-creator st
```

**Sample Output:**

```
Active Skills (3):
  - typescript-patterns (1,200 tokens)
  - testing-best-practices (800 tokens)
  - git-workflow (500 tokens)

Token Budget: 2,500 / 4,000 (62.5% used)
Remaining: 1,500 tokens
```

---

### invoke

Manually invoke a skill by name.

**Synopsis:**

```
skill-creator invoke <skill-name>
```

**Description:**

Loads a specific skill into the current session manually. Shows token usage, remaining budget, and a content preview. Useful for testing skills or forcing a specific skill to load regardless of automatic activation.

**Examples:**

```bash
# Load a specific skill
skill-creator invoke typescript-patterns

# Short form
skill-creator i react-hooks
```

**Sample Output:**

```
Skill 'typescript-patterns' loaded successfully.

Token usage: 1,200
Remaining budget: 2,800

Content preview:
────────────────────────────────────────
## TypeScript Patterns

When working with TypeScript, follow these patterns:

### Type Definitions

1. **Prefer interfaces over types** for object shapes...
```

---

### Pattern Detection and Learning

Commands for analyzing usage patterns, managing suggestions, and refining skills based on feedback.

---

### suggest

Analyze patterns and review skill suggestions.

**Synopsis:**

```
skill-creator suggest
```

**Description:**

Analyzes your Claude Code usage patterns stored in `.planning/patterns/sessions.jsonl` and surfaces skill suggestions when patterns repeat 3+ times. Provides an interactive review workflow with options to accept, preview, defer, dismiss, skip, or quit.

**Interactive Actions:**

| Action | Description |
|--------|-------------|
| Accept | Generate and save the skill immediately |
| Preview | See the generated skill content before deciding |
| Defer | Re-ask about this pattern in 7 days |
| Dismiss | Never suggest this pattern again |
| Skip | Move to next suggestion (leave pending) |
| Quit | Exit review (remaining stay pending) |

**Examples:**

```bash
# Run pattern detection and review suggestions
skill-creator suggest

# Short form
skill-creator sg
```

---

### suggestions

List and manage skill suggestions.

**Synopsis:**

```
skill-creator suggestions [list|clear]
```

**Description:**

View statistics about skill suggestions or manage dismissed suggestions.

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `list` | Show suggestion statistics and pending items (default) |
| `clear` | Remove all dismissed suggestions |

**Examples:**

```bash
# Show suggestion statistics
skill-creator suggestions

# List pending suggestions
skill-creator suggestions list

# Clear dismissed suggestions
skill-creator suggestions clear

# Short form
skill-creator sgs
```

---

### feedback

View feedback for skills.

**Synopsis:**

```
skill-creator feedback [list <skill-name>]
```

**Description:**

View correction history and feedback statistics for skills. Feedback is collected when you override or correct skill output, enabling the refinement system.

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `stats` | Show total feedback event count (default) |
| `list <skill>` | Show correction history for a specific skill |

**Examples:**

```bash
# Show feedback statistics
skill-creator feedback

# List feedback for a specific skill
skill-creator feedback list my-commit-skill

# Short form
skill-creator fb list my-skill
```

---

### refine

Generate and apply skill refinements.

**Synopsis:**

```
skill-creator refine <skill-name>
```

**Description:**

Generates and applies bounded refinements based on accumulated feedback. Requires at least 3 corrections before suggestions become available. Refinements are limited to 20% content change per application with a 7-day cooldown between refinements.

Always shows suggested changes and requires user confirmation before applying.

**Refinement Bounds:**

| Parameter | Value |
|-----------|-------|
| Minimum corrections | 3 |
| Maximum content change | 20% |
| Cooldown period | 7 days |

**Examples:**

```bash
# Check eligibility and refine a skill
skill-creator refine my-commit-skill

# Short form
skill-creator rf my-skill
```

---

### history

View skill version history.

**Synopsis:**

```
skill-creator history <skill-name>
```

**Description:**

Shows the git commit history for a skill file. Each entry shows the commit hash, date, version number (if tracked), and commit message.

**Examples:**

```bash
# View version history for a skill
skill-creator history my-commit-skill

# Short form
skill-creator hist my-skill
```

**Sample Output:**

```
Version History for 'my-commit-skill':
  a1b2c3d 2/5/2026 v3
    refine: updated trigger patterns
  e4f5g6h 2/1/2026 v2
    refine: improved description
  i7j8k9l 1/28/2026 v1
    feat: initial skill creation
```

---

### rollback

Rollback skill to previous version.

**Synopsis:**

```
skill-creator rollback <skill-name> [hash]
```

**Description:**

Reverts a skill to a previous version from git history. Without a hash, presents an interactive selection of available versions. With a hash, rolls back directly to that specific commit.

**Examples:**

```bash
# Interactive version selection
skill-creator rollback my-commit-skill

# Rollback to specific commit
skill-creator rollback my-commit-skill a1b2c3d

# Short form
skill-creator rb my-skill
```

---

### Agent Management

Commands for managing agent suggestions and validating agent format compliance.

---

### agents

Manage agent suggestions from skill clusters.

**Synopsis:**

```
skill-creator agents <subcommand>
```

**Description:**

Analyzes skill co-activation patterns and manages agent suggestions. When skills frequently activate together (5+ co-activations over 7+ days), suggests creating composite agents that bundle related expertise.

Generated agents follow the official Claude Code agent format with comma-separated tools field.

> **Note:** User-level agents (`~/.claude/agents/`) have a known discovery bug (GitHub #11205). Consider using project-level agents instead. Workarounds: use the `/agents` UI command, or pass agents via `--agents` CLI flag when starting Claude Code.

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `suggest` | Analyze co-activations and review agent suggestions |
| `list` | List existing agents with validation status |
| `validate` | Check all agents for format issues |

**Examples:**

```bash
# Analyze patterns and suggest agents
skill-creator agents suggest

# List agents with validation status
skill-creator agents list

# Validate all agent files
skill-creator agents validate

# Short forms
skill-creator ag suggest
skill-creator ag ls
skill-creator ag v
```

---

### Maintenance

Commands for system maintenance and configuration updates.

---

### sync-reserved

Show and update reserved skill names list.

**Synopsis:**

```
skill-creator sync-reserved
```

**Description:**

Displays the current reserved skill names configuration with categories and examples. Reserved names are skill names that conflict with Claude Code built-in commands and cannot be used.

Provides instructions for manually updating the reserved names list when Claude Code releases new versions.

**Examples:**

```bash
# Show reserved names and sync status
skill-creator sync-reserved

# Short form
skill-creator sync
```

---

### reload-embeddings

Reload the embedding model.

**Synopsis:**

```
skill-creator reload-embeddings [--verbose]
```

**Description:**

Checks the embedding service status and attempts to reload the model if currently in fallback (heuristic) mode. Use after GPU becomes available, network connectivity is restored, or to retry after an initial load failure.

**Options:**

- `--verbose, -v`: Show detailed status information

**Examples:**

```bash
# Check status and reload if needed
skill-creator reload-embeddings

# Verbose output
skill-creator reload-embeddings --verbose

# Short form
skill-creator re -v
```

**Sample Output:**

```
Embedding Service Status

Initialized: Yes
Mode: Heuristic (fallback)
Cache entries: 42

Attempting to reload embedding model...

✓ Model loaded successfully
Future embedding operations will use the model.
```
