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
