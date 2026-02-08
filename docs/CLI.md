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

### Discover: Pattern Discovery

| Command | Alias | Description |
|---------|-------|-------------|
| [discover](#discover) | `disc` | Scan session logs, extract patterns, rank candidates, generate draft skills |

### Teams: Multi-Agent Coordination

| Command | Alias | Description |
|---------|-------|-------------|
| [team create](#team-create) | `tm c` | Create a team from pattern template |
| [team list](#team-list) | `tm l`, `tm ls` | List all teams with member counts |
| [team validate](#team-validate) | `tm v` | Validate team config(s) |
| [team spawn](#team-spawn) | `tm sp` | Check team readiness (agent resolution) |
| [team status](#team-status) | `tm s` | Show team details and validation summary |

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

**Team commands** accept `--scope=project` or `--scope=user` to filter by storage scope. Without `--scope`, commands search both scopes.

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

---

## Teams: Multi-Agent Coordination

Commands for creating, managing, and validating agent teams. Teams coordinate multiple Claude Code agents working together on complex tasks.

### team create

Create a new team from a pattern template.

**Synopsis:**

```
skill-creator team create [options]
```

**Description:**

Interactive wizard or flag-based team creation from pattern templates. When `--name` and `--pattern` are both provided, runs in non-interactive mode for scripted usage. Otherwise, launches an interactive wizard that prompts for team name, pattern, description, and member count.

Available patterns:
- **leader-worker**: One leader coordinates multiple workers (default)
- **pipeline**: Sequential processing stages with an orchestrator
- **swarm**: Peer agents with a coordinator for parallel work

**Options:**

| Option | Description |
|--------|-------------|
| `--pattern=<pattern>` | Team pattern: `leader-worker`, `pipeline`, `swarm` |
| `--name=<name>` | Team name (lowercase, hyphens) |
| `--members=<n>` | Number of workers (default: 3) |
| `--scope=<scope>` | Storage scope: `project` (default) or `user` |
| `--description=<text>` | Team description |
| `--help, -h` | Show help |

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | Team created successfully |
| 1 | Error or user cancelled |

**Examples:**

```bash
# Interactive wizard
skill-creator team create

# Non-interactive with flags
skill-creator team create --pattern=leader-worker --name=my-team

# Pipeline pattern with 4 members
skill-creator team create --pattern=pipeline --name=data-flow --members=4

# Create in user scope
skill-creator team create --pattern=swarm --name=research --scope=user

# Short form
skill-creator tm c
```

---

### team list

List all teams with member counts.

**Synopsis:**

```
skill-creator team list [options]
```

**Description:**

Discovers teams from both project and user scopes using the team store. Shows team name, topology pattern, member count, and scope in a styled table. Supports filtering by scope and three output modes: text (styled table), quiet (CSV-like), and JSON.

**Options:**

| Option | Description |
|--------|-------------|
| `--scope=<scope>` | Filter by scope: `project`, `user` (default: show both) |
| `--quiet, -q` | Machine-readable CSV-like output (`name,topology,memberCount,scope`) |
| `--json` | JSON output for scripting |
| `--help, -h` | Show help |

**Examples:**

```bash
# List all teams from both scopes
skill-creator team list

# Filter to project-level teams only
skill-creator team list --scope=project

# JSON output for scripting
skill-creator team list --json

# Quiet mode for piping
skill-creator team list --quiet

# Short forms
skill-creator tm l
skill-creator tm ls --json
```

**Sample Output:**

```
Teams:

  Name                  Pattern          Members  Scope
  ────────────────────  ───────────────  ───────  ───────
  research-team         leader-worker          4  project
  data-pipeline         pipeline               5  project
  code-review           swarm                  3  user

Found 3 team(s).
```

---

### team validate

Validate team configuration(s).

**Synopsis:**

```
skill-creator team validate [<name>] [options]
```

**Description:**

Runs the full validation pipeline on team configurations:

1. **Schema validation** - Correct structure with required fields
2. **Member resolution** - All member agent IDs are valid
3. **Topology rules** - Pattern-specific constraints (leader count, pipeline ordering)
4. **Tool overlap detection** - Identifies write-tool conflicts between members
5. **Skill conflict detection** - Finds semantically overlapping skill assignments
6. **Role coherence** - Validates member roles are consistent with topology

Errors are blocking (schema, leadAgentId, duplicates, topology, cycles). Warnings are informational (tool overlap, skill conflicts, role coherence).

**Options:**

| Option | Description |
|--------|-------------|
| `--all, -a` | Validate all discovered teams |
| `--scope=<scope>` | Storage scope: `project` (default) or `user` |
| `--quiet, -q` | Minimal output: `name,pass` or `name,fail` per team |
| `--json` | Full validation result as JSON |
| `--help, -h` | Show help |

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | All teams valid (or only warnings) |
| 1 | One or more teams have errors |

**Examples:**

```bash
# Validate a specific team
skill-creator team validate my-team

# Validate all teams
skill-creator team validate --all

# JSON output for CI
skill-creator team validate my-team --json

# Quick pass/fail check for all teams
skill-creator team validate --all --quiet

# Short forms
skill-creator tm v my-team
skill-creator tm v -a
skill-creator tm v -a -q
```

**Sample Output (text):**

```
✓ my-team PASS

✗ broken-team FAIL
  ✗ ERROR: leadAgentId 'missing-lead' does not match any member agentId
  ℹ Did you mean: main-lead, team-lead?
  ⚠ WARN: Tool overlap: members 'worker-a' and 'worker-b' share write tools: Edit, Write

Validation Summary
──────────────────────────────────────────────────
  Name                      Status   Errors   Warnings
  ─────────────────────────  ────────  ────────  ────────
  my-team                   PASS     0        0
  broken-team               FAIL     1        1

  1/2 teams passed validation
```

**Sample Output (JSON):**

```json
{
  "name": "my-team",
  "valid": true,
  "errors": [],
  "warnings": [],
  "memberResolution": [
    { "agentId": "lead-agent", "status": "found", "path": ".claude/agents/lead-agent.md" }
  ]
}
```

---

### team spawn

Check team readiness by validating agent resolution.

**Synopsis:**

```
skill-creator team spawn <name> [options]
```

**Description:**

Validates that all member agent files exist and are resolvable on disk. For each member, checks whether a corresponding `.md` agent file exists in `.claude/agents/`. When agents are missing, displays fuzzy name suggestions (Levenshtein distance <= 2 or 4+ character prefix match) and offers to generate the missing agent files interactively.

Interactive fix is only offered in text mode (not quiet or JSON).

**Options:**

| Option | Description |
|--------|-------------|
| `--scope=<scope>` | Scope to search: `project`, `user`, or both (default) |
| `--quiet, -q` | Machine-readable output (`name,ready` or `name,not-ready`) |
| `--json` | JSON output with per-member resolution details |
| `--help, -h` | Show help |

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | All member agents resolved (team is ready) |
| 1 | One or more agents missing (team is not ready) |

**Examples:**

```bash
# Check if team is ready to spawn
skill-creator team spawn my-team

# JSON output for scripting
skill-creator team spawn my-team --json

# Quick readiness check
skill-creator team spawn my-team --quiet

# Filter to project scope only
skill-creator team spawn my-team --scope=project

# Short form
skill-creator tm sp my-team
```

**Sample Output (ready):**

```
✓ Team 'my-team' is ready. 3 members resolved: lead-agent, worker-a, worker-b
```

**Sample Output (not ready):**

```
2 agent(s) resolved:
  + lead-agent .claude/agents/lead-agent.md
  + worker-a .claude/agents/worker-a.md

1 agent(s) not found:
  x Agent 'workerr-b' not found.
    Searched: .claude/agents/workerr-b.md, ~/.claude/agents/workerr-b.md
    Did you mean: worker-b?

? Generate missing agent file for 'workerr-b'? (Y/n)
```

**Sample Output (JSON):**

```json
{
  "name": "my-team",
  "ready": false,
  "members": [
    { "agentId": "lead-agent", "status": "found", "path": ".claude/agents/lead-agent.md" },
    { "agentId": "worker-a", "status": "found", "path": ".claude/agents/worker-a.md" },
    { "agentId": "workerr-b", "status": "missing", "suggestions": ["worker-b"] }
  ]
}
```

---

### team status

Show team details and validation summary.

**Synopsis:**

```
skill-creator team status <name> [options]
```

**Description:**

Displays full team configuration details including name, topology pattern, description, lead agent, creation date, a member table (Agent ID, Name, Type, Model), and a compact validation summary with error and warning counts.

This command is informational and always returns exit code 0 (except when the team is not found).

**Options:**

| Option | Description |
|--------|-------------|
| `--scope=<scope>` | Scope to search: `project`, `user`, or both (default) |
| `--quiet, -q` | Machine-readable output (`name,topology,memberCount,valid`) |
| `--json` | JSON output with full config and validation |
| `--help, -h` | Show help |

**Examples:**

```bash
# Show team details
skill-creator team status my-team

# JSON output for scripting
skill-creator team status my-team --json

# Quiet mode
skill-creator team status my-team --quiet

# Short form
skill-creator tm s my-team
```

**Sample Output (text):**

```
  Team: my-team
  Pattern: leader-worker
  Description: A team for code review tasks
  Lead Agent: lead-agent
  Created: 2026-02-05

  Members (3):
    Agent ID          Name                Type            Model
    ────────────────  ──────────────────  ──────────────  ──────────
    lead-agent        Lead Agent          coordinator     opus
    worker-a          Worker A            worker          sonnet
    worker-b          Worker B            worker          sonnet

  Validation: PASS (0 errors, 0 warnings)
```

**Sample Output (JSON):**

```json
{
  "name": "my-team",
  "topology": "leader-worker",
  "description": "A team for code review tasks",
  "leadAgentId": "lead-agent",
  "members": [
    { "agentId": "lead-agent", "name": "Lead Agent", "agentType": "coordinator", "model": "opus" },
    { "agentId": "worker-a", "name": "Worker A", "agentType": "worker", "model": "sonnet" },
    { "agentId": "worker-b", "name": "Worker B", "agentType": "worker", "model": "sonnet" }
  ],
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

**See Also:**

- [API Reference: Teams Module](API.md#teams-module)
- [GSD Teams Guide](GSD-TEAMS.md)
- [Team Creation Tutorial](tutorials/team-creation.md)

---

## discover

Scan Claude Code session logs to discover recurring interaction patterns and generate draft skills.

**Aliases:** `disc`

**Usage:**

```bash
skill-creator discover [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--exclude <project>` | Skip a specific project during scanning (can be repeated) |
| `--rescan` | Force full rescan, ignoring previously stored watermarks |

**Description:**

The `discover` command runs the full pattern discovery pipeline:

1. **Scan** — Enumerates all projects under `~/.claude/projects/` and stream-parses JSONL session files. Only new/modified sessions are processed on subsequent runs (watermark-based incremental scanning).
2. **Extract** — Identifies tool sequence n-grams (bigrams like Read→Edit, trigrams like Read→Edit→Bash) and classifies Bash commands into 8 categories (git, build, test, install, search, file-ops, docker, other).
3. **Cluster** — Groups similar user prompts using DBSCAN with automatic epsilon tuning via k-NN knee detection. Clusters per-project first, then merges across projects.
4. **Rank** — Scores all candidates using a multi-factor formula (frequency, cross-project occurrence, recency, consistency). Deduplicates against existing skills.
5. **Present** — Displays ranked tool pattern candidates and cluster candidates with evidence (sessions, projects, examples).
6. **Draft** — Generates SKILL.md files for selected candidates with pre-filled workflow steps.

Progress output is displayed during scanning (project count, session count, patterns found).

**Examples:**

```bash
# Run full discovery pipeline
skill-creator discover

# Exclude a project from scanning
skill-creator discover --exclude my-private-project

# Force full rescan (reprocess all sessions)
skill-creator discover --rescan

# Combine flags
skill-creator discover --rescan --exclude scratch-project
```

**Output:**

The command displays two ranked tables:

1. **Tool Pattern Candidates** — Recurring tool sequences and Bash patterns with scores and evidence
2. **Prompt Cluster Candidates** — Semantically similar user prompts grouped by intent

For each table, you can interactively select which candidates to turn into draft skills. Selected candidates generate SKILL.md files in `.claude/skills/`.

**Notes:**

- First run scans all sessions (may take 30-60s for large corpora). Subsequent runs are fast due to incremental scanning.
- Scan state is stored at `~/.gsd-skill-creator/discovery/scan-state.json`.
- Framework noise (patterns appearing in 15+ projects AND 80%+ of tracked projects) is automatically filtered.
- Patterns matching existing skills are deduplicated and not presented.

---

## Exit Codes

Commands return exit codes for CI/scripting integration:

| Command | Exit 0 | Exit 1 |
|---------|--------|--------|
| validate | All validations pass | Any validation fails |
| detect-conflicts | No high-severity conflicts | High-severity conflicts found (>90% similarity) |
| test run | All tests pass AND thresholds met | Failures OR accuracy/FPR thresholds exceeded |
| benchmark | Correlation >= 85% | Correlation < 85% |
| budget | Success | Error reading skills |
| migrate-agent | Success or no migration needed | Error during migration |
| team validate | All teams valid (or only warnings) | One or more teams have errors |
| team spawn | All member agents resolved | One or more agents missing |
| discover | Pipeline completes, drafts written | Error during scan/extract/rank |
| (all others) | Success | Error occurred |

### Threshold Flags for CI

`test run` supports threshold flags for CI pipelines:

- `--min-accuracy=<n>`: Exit 1 if accuracy below N%
- `--max-false-positive=<n>`: Exit 1 if false positive rate above N%

**Example CI check:**

```bash
skill-creator test run --all --min-accuracy=90 --max-false-positive=5
```

---

## CI Integration

### JSON Output

Commands supporting `--json` output for scripting:

| Command | JSON Flag | Output |
|---------|-----------|--------|
| detect-conflicts | `--json` | Conflict array with severity |
| score-activation | `--json` | Scores array with factors |
| test list | `--json` | Test case array |
| test run | `--json=compact\|pretty` | Results with metrics |
| simulate | `--json` | Prediction with confidence |
| benchmark | `--json` | Report with correlation |
| team list | `--json` | Team array with topology and scope |
| team validate | `--json` | Validation result with errors/warnings |
| team spawn | `--json` | Readiness status with member resolution |
| team status | `--json` | Full config with validation summary |

### JSON Schema: detect-conflicts

```json
{
  "conflicts": [
    {
      "skill1": "commit-helper",
      "skill2": "git-workflow",
      "similarity": 0.92,
      "severity": "high"
    }
  ],
  "threshold": 0.85,
  "scanned": 5
}
```

### JSON Schema: test run

```json
{
  "skill": "my-skill",
  "metrics": {
    "total": 10,
    "passed": 8,
    "failed": 2,
    "accuracy": 80.0,
    "falsePositiveRate": 10.0
  },
  "results": [
    {
      "id": "abc123",
      "prompt": "commit my changes",
      "expected": "positive",
      "actual": "positive",
      "confidence": 0.92,
      "passed": true
    }
  ]
}
```

### Example CI Pipeline

```yaml
# GitHub Actions workflow for skill quality
name: Skill Quality

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install skill-creator
        run: npm install -g skill-creator

      - name: Validate skills
        run: skill-creator validate --all

      - name: Check conflicts
        run: |
          skill-creator detect-conflicts --json > conflicts.json
          jq -e '.conflicts | length == 0' conflicts.json

      - name: Run tests
        run: skill-creator test run --all --min-accuracy=90 --max-false-positive=5

      - name: Validate teams
        run: skill-creator team validate --all --quiet

      - name: Benchmark accuracy
        run: skill-creator benchmark
```

---

## Common Tasks

Quick reference for common workflows.

### Check Skill Quality

```bash
# Validate structure and metadata
skill-creator validate my-skill

# Check for semantic conflicts
skill-creator detect-conflicts my-skill

# Score activation likelihood
skill-creator score-activation my-skill --verbose
```

### Test Activation Behavior

```bash
# Add test cases
skill-creator test add my-skill

# Run tests with details
skill-creator test run my-skill --verbose

# Simulate a specific prompt
skill-creator simulate "my test prompt" --verbose
```

### Optimize Activation Threshold

```bash
# Preview calibration changes
skill-creator calibrate --preview

# Apply optimal threshold
skill-creator calibrate

# Verify improvement
skill-creator benchmark
```

### Migrate Legacy Files

```bash
# Scan and migrate all legacy skills
skill-creator migrate

# Check agents for format issues
skill-creator agents validate

# Fix agent format issues
skill-creator migrate-agent
```

### Monitor Budget Usage

```bash
# Check user-level budget
skill-creator budget

# Check project-level budget
skill-creator budget --project

# See active skills
skill-creator status
```
