# Dynamic Skill Creator

A self-evolving skill ecosystem for Claude Code that observes usage patterns, suggests skill creation, and composes related skills into purpose-built agents.

Built with [GSD (Get Shit Done)](https://github.com/Tibsfox/get-shit-done)

## Table of Contents

- [What It Does](#what-it-does)
- [Core Concepts](#core-concepts)
- [Installation](#installation)
- [Documentation](#documentation)
- [CLI Commands](#cli-commands)
- [How It Works](#how-it-works)
- [File Structure](#file-structure)
- [Skill Format](#skill-format)
- [Official Claude Code Format](#official-claude-code-format)
- [Token Budget](#token-budget)
- [Bounded Learning](#bounded-learning)
- [Agent Generation](#agent-generation)
- [Agent Teams](#agent-teams)
- [Pattern Discovery](#pattern-discovery)
- [Configuration](#configuration)
- [Development](#development)
- [Requirements Implemented](#requirements-implemented)

---

## What It Does

The Dynamic Skill Creator helps you build a personalized knowledge base for Claude Code through these core capabilities:

| Capability | Description |
|------------|-------------|
| **1. Capturing Patterns** | Observes your Claude Code sessions to detect recurring workflows, commands, and file access patterns |
| **2. Suggesting Skills** | Proposes skill creation when patterns repeat 3+ times with evidence explaining why |
| **3. Managing Skills** | Provides guided workflows for creating, searching, listing, and organizing skills |
| **4. Auto-Loading** | Automatically loads relevant skills based on context while respecting token budgets (2-5% of context) |
| **5. Learning** | Refines skills based on your corrections and feedback with bounded parameters and user confirmation |
| **6. Composing Agents** | Groups frequently co-activated skills into composite agents stored in `.claude/agents/` |
| **7. Quality Validation** | Detects semantic conflicts between skills and scores activation likelihood (v1.1) |
| **8. Testing & Simulation** | Automated test cases, activation simulation, and calibration benchmarks (v1.2) |
| **9. Agent Teams** | Multi-agent team coordination with leader-worker, pipeline, and swarm topologies (v1.4) |
| **10. Pattern Discovery** | Scan session logs to discover recurring workflows and generate draft skills automatically (v1.5) |

### Version History

| Version | Key Features |
|---------|--------------|
| **v1.0** | Core skill management, pattern observation, learning loop, agent composition |
| **v1.1** | Semantic conflict detection, activation scoring, local embeddings via HuggingFace |
| **v1.2** | Test infrastructure, activation simulation, threshold calibration, benchmarking |
| **v1.3** | Documentation overhaul, official format specification, getting started guide |
| **v1.4** | Agent Teams: team schemas, storage, validation, CLI commands, GSD workflow templates |
| **v1.5** | Pattern Discovery: session log scanning, tool sequence extraction, DBSCAN clustering, draft generation |
| **v1.6** | 34 cross-domain examples (20 skills, 8 agents, 3 teams), local installation, beautiful-commits skill |

---

## Core Concepts

### Skills

Skills are reusable knowledge files stored in `.claude/skills/`. Each skill is a Markdown file with YAML frontmatter that defines:

- **Triggers** - When the skill should activate (intent patterns, file patterns, context patterns)
- **Content** - The knowledge or instructions to inject into Claude's context
- **Metadata** - Name, description, version, enabled status, timestamps

Example skill structure:
```
.claude/skills/
  typescript-patterns/
    SKILL.md        # Main skill file (frontmatter + content)
    reference.md    # Optional reference material
    scripts/        # Optional automation scripts
```

**Key Properties:**
- Human-readable and editable as plain Markdown
- Portable (no project-specific paths or dependencies)
- Version-tracked through git history
- Can extend other skills via `extends:` frontmatter

### Skill Scopes

Skills can exist at two locations (scopes):

| Scope | Location | Purpose |
|-------|----------|---------|
| **User-level** | `~/.claude/skills/` | Shared across all projects. Default scope. |
| **Project-level** | `.claude/skills/` | Project-specific customizations. |

**Precedence Rule:** When the same skill name exists at both scopes, the project-level version takes precedence. This allows you to:
- Create portable user-level skills shared across projects
- Override specific skills per-project when needed

**Scope Commands:**

```bash
# Create at user-level (default)
skill-creator create

# Create at project-level
skill-creator create --project

# See which version of a skill is active
skill-creator resolve my-skill

# List skills filtered by scope
skill-creator list --scope=user
skill-creator list --scope=project

# Delete project-level version (user-level becomes active)
skill-creator delete my-skill --project
```

**Use Cases:**

- **User-level skills** - Personal preferences, coding standards you use everywhere, language-specific patterns
- **Project-level skills** - Project conventions, framework-specific patterns, team standards that override your personal defaults

### Observations

The system observes your Claude Code sessions and stores pattern summaries in `.planning/patterns/`. Observations are:

- **Token-efficient** - Stores summaries, not full transcripts
- **Bounded** - Configurable retention (default: 90 days / 1000 sessions)
- **Append-only** - JSONL format for safe concurrent writes

Observation data drives:
- Skill suggestions based on recurring workflows
- Co-activation tracking for agent composition
- Feedback-driven skill refinement

### Agents

When skills frequently activate together (5+ co-activations over 7+ days), the system suggests combining them into composite agents stored in `.claude/agents/`.

Agents:
- Bundle related expertise for common workflows
- Follow Claude Code's agent format
- Can specify model, tools, and included skills
- Are auto-generated from skill clusters

---

## Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

**Quick start:**
```bash
# Clone and install
git clone <repository-url> 
cd gsd-skill-creator
npm install
npm run build

# Link globally (optional)
npm link

# Verify
skill-creator help
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/GETTING-STARTED.md) | Installation, quickstart, and tutorials |
| [CLI Reference](docs/CLI.md) | Complete command documentation |
| [API Reference](docs/API.md) | Programmatic usage for library consumers |
| [Architecture](docs/architecture/) | System design for contributors |
| [GSD Teams Guide](docs/GSD-TEAMS.md) | Teams vs subagents for GSD workflows |
| [Skills vs Agents vs Teams](docs/COMPARISON.md) | Choosing the right abstraction level |
| [Team Creation Tutorial](docs/tutorials/team-creation.md) | End-to-end team creation walkthrough |
| [Examples](examples/) | 34 ready-to-use skills, agents, and teams across 26 domains |

---

## CLI Commands

### Skill Management

| Command | Alias | Description |
|---------|-------|-------------|
| `create` | `c` | Create a new skill through guided workflow |
| `list` | `ls` | List all available skills with metadata |
| `search` | `s` | Search skills by keyword interactively |
| `invoke <name>` | `i` | Manually invoke/load a skill by name |
| `status` | `st` | Show active skills and token budget |

**Examples:**
```bash
skill-creator create                    # Start skill creation wizard
skill-creator list                      # Show all skills
skill-creator search                    # Interactive search
skill-creator invoke typescript-patterns  # Load a specific skill
skill-creator status                    # Show active skills and budget
```

### Pattern Detection

| Command | Alias | Description |
|---------|-------|-------------|
| `suggest` | `sg` | Analyze patterns and review skill suggestions |
| `suggestions` | `sgs` | List all suggestion statistics |
| `suggestions list` | - | List pending suggestions |
| `suggestions clear` | - | Clear dismissed suggestions |

**Examples:**
```bash
skill-creator suggest          # Interactive review of suggestions
skill-creator suggestions      # Show suggestion stats
skill-creator suggestions list # List pending suggestions
skill-creator suggestions clear # Clear dismissed
```

### Learning Loop

| Command | Alias | Description |
|---------|-------|-------------|
| `feedback <skill>` | `fb` | View feedback recorded for a skill |
| `refine <skill>` | `rf` | Generate and apply skill refinements |
| `history <skill>` | `hist` | View skill version history |
| `rollback <skill> [hash]` | `rb` | Rollback skill to previous version |

**Examples:**
```bash
skill-creator feedback my-skill        # View feedback for a skill
skill-creator refine my-skill          # Apply refinements
skill-creator history my-skill         # View version history
skill-creator rollback my-skill        # Interactive rollback
skill-creator rollback my-skill abc123 # Rollback to specific commit
```

### Agent Composition

| Command | Alias | Description |
|---------|-------|-------------|
| `agents suggest` | `ag sg` | Analyze co-activations and review agent suggestions |
| `agents list` | `ag ls` | List pending agent suggestions |

**Examples:**
```bash
skill-creator agents suggest  # Review agent suggestions interactively
skill-creator agents list     # List pending agent suggestions
skill-creator ag sg           # Shorthand for agents suggest
```

### Team Management

| Command | Alias | Description |
|---------|-------|-------------|
| `team create` | `tm c` | Create a team from pattern template |
| `team list` | `tm ls` | List all teams with member counts |
| `team validate` | `tm v` | Validate team configuration(s) |
| `team spawn` | `tm sp` | Check team readiness (agent resolution) |
| `team status` | `tm s` | Show team details and validation summary |

**Examples:**
```bash
skill-creator team create                          # Interactive team wizard
skill-creator team create --name my-team --pattern leader-worker  # Non-interactive
skill-creator team list                            # List all teams
skill-creator team validate my-team                # Validate specific team
skill-creator team spawn my-team                   # Check readiness
skill-creator team status my-team                  # Show details
```

### Pattern Discovery

| Command | Alias | Description |
|---------|-------|-------------|
| `discover` | `disc` | Scan session logs, extract patterns, rank candidates, generate draft skills |

**Examples:**
```bash
skill-creator discover                      # Full pipeline: scan → extract → rank → select → draft
skill-creator discover --exclude my-project  # Skip specific project
skill-creator discover --rescan             # Force full rescan (ignore watermarks)
```

### Quality & Validation

| Command | Alias | Description |
|---------|-------|-------------|
| `detect-conflicts` | `dc` | Detect semantic conflicts between skills |
| `score-activation` | `sa` | Score activation likelihood for a skill |
| `reload-embeddings` | - | Reload the embedding model |

**Examples:**
```bash
skill-creator detect-conflicts              # Check all skills for conflicts
skill-creator detect-conflicts --threshold 0.8  # Custom threshold
skill-creator score-activation my-skill     # Score single skill
skill-creator score-activation --all        # Score all skills
skill-creator score-activation my-skill --llm  # Use LLM analysis
```

### Testing & Simulation

| Command | Alias | Description |
|---------|-------|-------------|
| `test add <skill>` | `t add` | Add a test case for a skill |
| `test list <skill>` | `t ls` | List test cases for a skill |
| `test edit <skill> <id>` | `t edit` | Edit a test case |
| `test delete <skill> <id>` | `t del` | Delete a test case |
| `test run <skill>` | `t run` | Run tests for a skill |
| `test generate <skill>` | `t gen` | Auto-generate test cases (heuristic, cross-skill, LLM) |
| `simulate <skill>` | `sim` | Simulate activation with confidence levels |
| `calibrate` | `cal` | Optimize thresholds via F1 score |
| `benchmark` | `bench` | Measure simulator correlation (MCC) |

**Examples:**
```bash
skill-creator test add my-skill             # Add test case interactively
skill-creator test list my-skill            # List all test cases
skill-creator test run my-skill             # Run tests (shows accuracy, FPR)
skill-creator test generate my-skill        # Auto-generate tests
skill-creator test generate my-skill --llm  # LLM-enhanced generation
skill-creator simulate my-skill "user query here"  # Simulate activation
skill-creator simulate my-skill --batch     # Batch mode with progress bar
skill-creator calibrate                     # Optimize thresholds from history
skill-creator benchmark                     # Check simulator correlation
```

For complete CLI documentation including all options, examples, and exit codes, see [docs/CLI.md](docs/CLI.md).

---

## How It Works

The system operates in a six-step workflow:

### Step 1: Session Observation

When you use Claude Code, the system observes:
- **Commands executed** - Build, test, deploy commands
- **Files touched** - File types, paths, access patterns
- **Decisions made** - Choices, preferences, corrections
- **Skills activated** - Which skills loaded and when

Observations are stored as compact summaries in `.planning/patterns/sessions.jsonl`.

### Step 2: Pattern Detection

The pattern analyzer scans observations for:
- **Command sequences** - Recurring command patterns (e.g., always running tests after changes)
- **File patterns** - Frequently accessed file types or paths (e.g., `*.test.ts` files)
- **Workflow patterns** - Common task structures (e.g., create PR → review → merge)

When a pattern appears **3+ times**, it becomes a skill candidate.

### Step 3: Skill Suggestion

Run `skill-creator suggest` to review candidates:
1. See the detected pattern and evidence (occurrences, dates, files)
2. Preview the generated skill content before accepting
3. **Accept** - Create the skill immediately
4. **Defer** - Ask again in 7 days
5. **Dismiss** - Never suggest this pattern again

### Step 4: Skill Application

When you work in Claude Code:
1. The **relevance scorer** matches skills to your current context
2. Skills with matching triggers are ranked by specificity
3. Skills load automatically within the **token budget** (2-5% of context)
4. **Conflicts** are resolved by specificity and recency
5. You can see active skills with `skill-creator status`

### Step 5: Feedback Learning

The system learns from your corrections:
1. **Detects** when you override or correct skill output
2. **Accumulates** feedback over time in `.planning/patterns/feedback.jsonl`
3. After **3+ corrections**, suggests bounded refinements
4. Refinements are **limited to 20%** content change
5. **7-day cooldown** between refinements
6. **User confirmation** always required

### Step 6: Agent Composition

For skills that frequently activate together:
1. **Co-activation tracker** detects stable skill pairs (5+ co-activations)
2. **Cluster detector** groups related skills (2-5 skills per cluster)
3. **Stability check** ensures pattern persists (7+ days)
4. **Agent generator** creates `.claude/agents/` files
5. Generated agents combine expertise from multiple skills

---

## File Structure

```
your-project/
├── .claude/
│   ├── skills/                      # Skill storage
│   │   └── <skill-name>/
│   │       ├── SKILL.md            # Main skill file (frontmatter + content)
│   │       ├── reference.md        # Optional reference material
│   │       └── scripts/            # Optional automation scripts
│   ├── agents/                      # Generated/custom agents
│   │   └── <agent-name>.md         # Composite agent file
│   ├── teams/                       # Agent team configurations
│   │   └── <team-name>.json        # Team config (members, topology)
│   └── settings.json               # Claude Code settings (hooks, etc.)
│
├── .planning/
│   ├── patterns/                    # Observation data
│   │   ├── sessions.jsonl          # Session observations (append-only)
│   │   ├── suggestions.json        # Skill suggestion state
│   │   ├── feedback.jsonl          # User corrections/feedback
│   │   └── agent-suggestions.json  # Agent suggestion state
│   ├── PROJECT.md                  # Project context
│   ├── REQUIREMENTS.md             # Requirements specification
│   ├── ROADMAP.md                  # Development roadmap
│   └── STATE.md                    # Session memory
│
└── node_modules/
    └── dynamic-skill-creator/       # If installed as dependency
```

---

## Skill Format

> [!NOTE]
> For the complete official Claude Code skill format specification, see [docs/OFFICIAL-FORMAT.md](docs/OFFICIAL-FORMAT.md). This section shows the extended format used by gsd-skill-creator.

Skills use Markdown with YAML frontmatter:

```markdown
---
name: typescript-patterns
description: Common TypeScript patterns and best practices
triggers:
  intents:
    - "typescript"
    - "type safety"
    - "generics"
  files:
    - "*.ts"
    - "*.tsx"
    - "tsconfig.json"
  contexts:
    - "refactoring"
    - "code review"
  threshold: 0.5
enabled: true
version: 3
extends: javascript-patterns    # Optional: inherit from another skill
createdAt: "2026-01-30T10:00:00Z"
updatedAt: "2026-01-30T15:30:00Z"
---

## TypeScript Patterns

When working with TypeScript, follow these patterns:

### Type Definitions

1. **Prefer interfaces over types** for object shapes that may be extended
2. **Use type aliases** for unions, intersections, and computed types
3. **Avoid `any`** - use `unknown` for truly unknown types

### Strict Mode

Always enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Generic Patterns

Use generics for reusable, type-safe functions:

```typescript
function identity<T>(value: T): T {
  return value;
}
```
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique skill identifier |
| `description` | string | Yes | Human-readable description |
| `triggers.intents` | string[] | No | Intent patterns that activate the skill (extension) |
| `triggers.files` | string[] | No | File glob patterns that activate the skill (extension) |
| `triggers.contexts` | string[] | No | Context keywords that activate the skill (extension) |
| `triggers.threshold` | number | No | Minimum relevance score (0-1, default 0.5) (extension) |
| `enabled` | boolean | No | Whether skill is active (default true) (extension) |
| `version` | number | Auto | Auto-incremented on updates (extension) |
| `extends` | string | No | Parent skill name to inherit from (extension) |
| `createdAt` | string | Auto | ISO timestamp of creation (extension) |
| `updatedAt` | string | Auto | ISO timestamp of last update (extension) |

*Fields marked (extension) are gsd-skill-creator additions, not part of official Claude Code format.*

### Effective Descriptions

Claude uses skill descriptions to decide when to auto-activate skills during conversations. Well-written descriptions significantly improve activation rates.

**The "Use when..." Pattern**

The most effective descriptions follow a two-part structure:
1. **Capability statement** - What the skill does
2. **Trigger conditions** - When to activate (using "Use when...")

```yaml
# Good: Clear capability and triggers
description: Guides structured git commits with conventional format. Use when committing changes, preparing commit messages, or when user asks about commit conventions.

# Bad: No trigger context
description: Guide for git commit patterns (seen 5 times).
```

**Tips for Better Activation:**

| Do | Don't |
|----|-------|
| Include "Use when..." clause | Use generic descriptions |
| Add specific keywords users mention | Include occurrence counts |
| Keep under 150 characters | Put trigger info only in skill body |
| Describe observable triggers | Use first/second person |

**Trigger Keywords:**

Include words users actually say or type:
- Actions: "committing", "reviewing", "debugging", "testing"
- Questions: "how do I", "what's the best way"
- Contexts: "working with", "setting up", "creating"

**Example Skills:**

These examples demonstrate effective description patterns:

```yaml
# Example 1: Git Commit Workflow
---
name: git-commit-workflow
description: Guides structured git commits with conventional format. Use when committing changes, writing commit messages, or when user mentions 'commit', 'conventional commits'.
---

## Conventional Commit Format

Structure: `type(scope): description`

Types: feat, fix, docs, style, refactor, test, chore

# Example 2: TypeScript Setup
---
name: typescript-setup
description: Automates TypeScript project configuration. Use when initializing a new TypeScript project, configuring tsconfig, or when user asks about TypeScript setup.
---

## TypeScript Project Setup

When setting up TypeScript projects...

# Example 3: Code Review
---
name: code-review
description: Reviews code for best practices and potential issues. Use when reviewing pull requests, checking code quality, or when user mentions 'review', 'PR', or 'code quality'.
---

## Code Review Checklist

When reviewing code...
```

Note how each example:
- States capability first (what it does)
- Includes "Use when..." with specific scenarios
- Lists keywords users might mention

---

## Official Claude Code Format

Claude Code has an official specification for skills and agents. This tool generates files that comply with the official format while adding optional extensions.

**Official Format Reference:** See [docs/OFFICIAL-FORMAT.md](docs/OFFICIAL-FORMAT.md) for complete documentation of:
- Required and optional frontmatter fields
- Directory structure requirements
- Field reference tables with constraints
- Copy-paste examples
- Common mistakes to avoid

### Official vs Extension Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | Official | Unique identifier (required) |
| `description` | Official | What skill does (required) |
| `user-invocable` | Official | Allow /skill-name invocation |
| `disable-model-invocation` | Official | Prevent auto-activation |
| `allowed-tools` | Official | Tools Claude can use |
| `triggers` | **Extension** | gsd-skill-creator auto-activation patterns |
| `extends` | **Extension** | Skill inheritance |
| `version` | **Extension** | Auto-incremented version tracking |
| `enabled` | **Extension** | Enable/disable without deleting |
| `createdAt`, `updatedAt` | **Extension** | Timestamp tracking |

Extension fields are stored under `metadata.extensions.gsd-skill-creator` to avoid polluting the official namespace.

> [!NOTE]
> Extension fields are value-adds from gsd-skill-creator. Skills work in Claude Code even without them - they enhance the skill management experience.

**Extension Documentation:** See [docs/EXTENSIONS.md](docs/EXTENSIONS.md) for complete documentation of gsd-skill-creator's custom fields including triggers, learning, extends, and migration guides.

---

## Token Budget

Skills load within a configurable token budget to avoid context bloat:

| Setting | Default | Description |
|---------|---------|-------------|
| **Budget** | 2-5% | Percentage of context window reserved for skills |
| **Priority** | Specificity | More specific/relevant skills load first |
| **Caching** | Enabled | Recently used skills stay loaded |
| **Overflow** | Queued | Excess skills queue for next session |

**Check current status:**
```bash
skill-creator status
```

**Output example:**
```
Active Skills (3):
  - typescript-patterns (1,200 tokens)
  - testing-best-practices (800 tokens)
  - git-workflow (500 tokens)

Token Budget: 2,500 / 4,000 (62.5% used)
Remaining: 1,500 tokens
```

**Skills that cost more tokens than they save are flagged for review.**

---

## Bounded Learning

Skill refinement has strict guardrails to prevent runaway changes:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Min corrections** | 3 | Require consistent feedback before suggesting changes |
| **Max change** | 20% | Prevent drastic alterations in a single refinement |
| **Cooldown** | 7 days | Allow observation of changes before next refinement |
| **User confirm** | Always | Human in the loop for every change |

### Refinement Workflow

```bash
# 1. Check eligibility
skill-creator refine my-skill
# Output: "Eligible for refinement (5 corrections)"

# 2. Review suggested changes
# Shows: section, original text, suggested text, reason

# 3. Confirm or cancel
# "Apply these refinements? [y/N]"

# 4. Rollback if needed
skill-creator rollback my-skill
```

### What Gets Refined

- **Trigger patterns** - Based on when skill activated vs. when it should have
- **Content accuracy** - Based on corrections you made to skill output
- **Missing sections** - Based on information you frequently added

---

## Agent Generation

> [!NOTE]
> For the complete official Claude Code agent format specification, see [docs/OFFICIAL-FORMAT.md](docs/OFFICIAL-FORMAT.md).

Generated agents follow Claude Code's `.claude/agents/` format:

```markdown
---
name: react-fullstack-agent
description: Combines expertise from: react-hooks, react-components, api-patterns. Auto-generated from skill cluster.
tools: Read, Write, Edit, Bash, Glob, Grep
model: inherit
skills:
  - react-hooks
  - react-components
  - api-patterns
---

You are a specialized agent combining expertise from the following skills:
- **react-hooks**: React hook patterns and best practices
- **react-components**: Component design patterns
- **api-patterns**: API integration patterns

When invoked, apply the combined knowledge from these skills to complete
the task effectively.

## How to Use

This agent was auto-generated from a skill cluster. The skills listed above
will be preloaded into your context, giving you specialized knowledge for
tasks that commonly require these capabilities together.

## Skills Included

### react-hooks
React hook patterns and best practices for useState, useEffect, useCallback, useMemo, and custom hooks.

### react-components
Component design patterns including composition, render props, higher-order components, and controlled/uncontrolled patterns.

### api-patterns
API integration patterns for REST, GraphQL, error handling, caching, and optimistic updates.
```

### Agent Frontmatter

All agent frontmatter fields follow the official Claude Code specification:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Agent identifier (required) |
| `description` | string | What the agent does (required) |
| `tools` | string | **Comma-separated string** of allowed tools (NOT an array) |
| `model` | string | Model to use (`inherit`, `sonnet`, `opus`, `haiku`) |
| `skills` | string[] | Skills to preload |

> [!WARNING]
> The `tools` field must be a comma-separated string (e.g., `tools: Read, Write, Bash`), not a YAML array. This is the most common agent format mistake.

### Agent Format Compliance

Generated agents follow the official Claude Code agent format:

- **name**: lowercase letters, numbers, and hyphens only
- **description**: explains when Claude should delegate to this agent
- **tools**: comma-separated string (e.g., `tools: Read, Write, Bash`)
- **model**: optional model alias (sonnet, opus, haiku, inherit)

Run `skill-creator agents validate` to check all agents for format issues.
Run `skill-creator migrate-agent` to fix agents with legacy format (array tools).

### Known Issues

**User-Level Agent Discovery (GitHub #11205)**

There is a known bug where agents in `~/.claude/agents/` may not be automatically discovered by Claude Code at session startup.

**Workarounds:**
1. Use project-level agents (`.claude/agents/`) instead
2. Use the `/agents` UI command within Claude Code
3. Pass agents via `--agents` CLI flag when starting Claude Code

This tool will warn you when creating user-level agents about this issue.

---

## Agent Teams

Agent teams coordinate multiple Claude Code agents working together on complex tasks. Teams support leader-worker, pipeline, swarm, and custom topologies.

### Team Configuration

Teams are stored as JSON files in `.claude/teams/`:

```json
{
  "name": "research-team",
  "description": "Parallel research across multiple dimensions",
  "leadAgentId": "research-synthesizer",
  "members": [
    { "agentId": "research-synthesizer", "name": "Synthesizer", "agentType": "coordinator", "model": "sonnet" },
    { "agentId": "researcher-alpha", "name": "Alpha", "agentType": "specialist", "model": "opus" }
  ],
  "createdAt": "2026-01-15T10:00:00Z"
}
```

Each member references an agent file in `.claude/agents/`. The `leadAgentId` must match one member's `agentId`.

### Team Validation

Team validation checks schema compliance, topology rules, tool overlap, skill conflicts, and role coherence:

```bash
skill-creator team validate my-team   # Validate specific team
skill-creator team validate --all     # Validate all teams
```

Errors are blocking (invalid schema, missing lead, duplicate IDs, topology violations, dependency cycles). Warnings are informational (tool overlap, skill conflicts, role coherence).

### GSD Workflow Templates

Two built-in templates for GSD workflows:

| Template | Members | Pattern | Use Case |
|----------|---------|---------|----------|
| Research Team | 5 (1 synthesizer + 4 researchers) | leader-worker | Parallel ecosystem research |
| Debugging Team | 4 (1 coordinator + 3 investigators) | leader-worker | Adversarial debugging |

```typescript
import { generateGsdResearchTeam, generateGsdDebuggingTeam } from 'gsd-skill-creator';

const research = generateGsdResearchTeam();
const debugging = generateGsdDebuggingTeam();
```

See [GSD Teams Guide](docs/GSD-TEAMS.md) for detailed workflow analysis and [Skills vs Agents vs Teams](docs/COMPARISON.md) for choosing the right abstraction.

---

## Pattern Discovery

The `discover` command scans your Claude Code session history to find recurring interaction patterns and generate draft skills from them.

### How It Works

1. **Scan** — Enumerates all projects under `~/.claude/projects/` and stream-parses JSONL session files
2. **Extract** — Identifies tool sequence n-grams (Read→Edit→Bash) and Bash command patterns (git workflows, build commands)
3. **Cluster** — Groups similar user prompts using DBSCAN with automatic epsilon tuning
4. **Rank** — Scores candidates using frequency, cross-project occurrence, recency, and consistency
5. **Present** — Shows ranked candidates with evidence (which sessions, which projects, examples)
6. **Draft** — Generates SKILL.md files with pre-filled workflow steps for selected candidates

### Key Features

| Feature | Description |
|---------|-------------|
| **Incremental scanning** | Only processes new/modified sessions on subsequent runs via watermarks |
| **Noise filtering** | Filters framework patterns appearing in 15+ projects (dual-threshold) |
| **Deduplication** | Skips patterns that match existing skills |
| **Semantic clustering** | Groups similar prompts using embeddings + DBSCAN |
| **Stream parsing** | Handles 23MB+ session files without loading into memory |
| **Subagent support** | Includes subagent session directories in analysis |

### Usage

```bash
# Discover patterns from all projects
skill-creator discover

# Exclude specific projects from scanning
skill-creator discover --exclude my-private-project

# Force full rescan (ignore previous watermarks)
skill-creator discover --rescan
```

The command displays progress during scanning (project count, session count, patterns found) and presents an interactive selection UI for choosing which candidates to turn into skills.

---

## Configuration

### Retention Settings

Pattern retention is bounded to prevent unbounded growth:

| Setting | Default | Description |
|---------|---------|-------------|
| `maxAgeDays` | 90 | Maximum age of observations |
| `maxSessions` | 1000 | Maximum number of sessions to retain |

### Trigger Thresholds

| Threshold | Value | Description |
|-----------|-------|-------------|
| **Skill suggestion** | 3+ occurrences | Minimum pattern repetitions |
| **Agent suggestion** | 5+ co-activations | Minimum skill pair activations |
| **Stability requirement** | 7+ days | Minimum pattern persistence |
| **Refinement eligibility** | 3+ corrections | Minimum feedback count |

### Validation Thresholds (v1.1+)

| Threshold | Default | Range | Description |
|-----------|---------|-------|-------------|
| **Conflict threshold** | 0.85 | 0.5-0.95 | Semantic similarity for conflict detection |
| **Activation threshold** | 0.75 | 0.5-0.95 | Confidence level for activation prediction |
| **Too-close-to-call** | <2% margin | - | Flags skills that are borderline competitors |

### Cluster Constraints

| Setting | Default | Description |
|---------|---------|-------------|
| `minClusterSize` | 2 | Minimum skills per cluster |
| `maxClusterSize` | 5 | Maximum skills per cluster |
| `minCoActivations` | 5 | Minimum co-activation count |
| `stabilityDays` | 7 | Minimum pattern stability |

### Refinement Bounds

| Setting | Default | Description |
|---------|---------|-------------|
| `minCorrections` | 3 | Corrections needed before refinement |
| `maxContentChangePercent` | 20 | Maximum change per refinement |
| `cooldownDays` | 7 | Days between refinements |

---

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test src/agents/cluster-detector.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
# Compile TypeScript
npm run build

# Type check without emit
npx tsc --noEmit

# Clean and rebuild
rm -rf dist/ && npm run build
```

### Project Structure

```
src/
├── storage/           # Skill storage
│   ├── skill-store.ts       # SkillStore class (CRUD operations)
│   ├── pattern-store.ts     # PatternStore class (JSONL operations)
│   └── skill-index.ts       # SkillIndex class (fast lookup)
│
├── types/             # TypeScript type definitions
│   ├── skill.ts            # Skill, SkillMetadata, Triggers
│   ├── observation.ts      # SessionObservation, Pattern
│   └── learning.ts         # Feedback, Refinement types
│
├── workflows/         # CLI workflows
│   ├── create-skill-workflow.ts   # Guided skill creation
│   ├── list-skills-workflow.ts    # List skills
│   └── search-skills-workflow.ts  # Search skills
│
├── application/       # Skill application
│   ├── relevance-scorer.ts    # Score skill relevance
│   ├── conflict-resolver.ts   # Resolve skill conflicts
│   ├── skill-session.ts       # Manage active skills
│   └── skill-applicator.ts    # Apply skills to context
│
├── observation/       # Session observation
│   ├── transcript-parser.ts   # Parse session transcripts
│   ├── pattern-summarizer.ts  # Summarize patterns
│   ├── retention-manager.ts   # Manage retention bounds
│   └── session-observer.ts    # Observe sessions
│
├── detection/         # Pattern detection
│   ├── pattern-analyzer.ts    # Analyze patterns
│   ├── suggestion-store.ts    # Store suggestions
│   ├── skill-generator.ts     # Generate skill content
│   └── suggestion-manager.ts  # Manage suggestions
│
├── learning/          # Feedback learning
│   ├── feedback-store.ts      # Store feedback
│   ├── feedback-detector.ts   # Detect corrections
│   ├── refinement-engine.ts   # Generate refinements
│   └── version-manager.ts     # Git version control
│
├── composition/       # Skill extension
│   ├── dependency-graph.ts    # Cycle detection (Kahn's algorithm)
│   └── skill-resolver.ts      # Resolve inheritance
│
├── agents/            # Agent composition
│   ├── co-activation-tracker.ts  # Track skill pairs
│   ├── cluster-detector.ts       # Detect clusters
│   ├── agent-generator.ts        # Generate agents
│   └── agent-suggestion-manager.ts # Manage suggestions
│
├── embeddings/        # Local embedding infrastructure (v1.1)
│   ├── embedding-service.ts    # HuggingFace transformers
│   ├── embedding-cache.ts      # Content-hash caching
│   ├── cosine-similarity.ts    # Similarity calculation
│   └── heuristic-fallback.ts   # Graceful degradation
│
├── conflicts/         # Conflict detection (v1.1)
│   ├── conflict-detector.ts    # Pairwise similarity
│   ├── conflict-formatter.ts   # CLI output formatting
│   └── rewrite-suggester.ts    # Conflict resolution hints
│
├── activation/        # Activation scoring (v1.1)
│   ├── activation-scorer.ts    # Heuristic scoring (0-100)
│   ├── activation-suggester.ts # Improvement suggestions
│   └── llm-activation-analyzer.ts # Optional LLM analysis
│
├── testing/           # Test infrastructure (v1.2)
│   ├── test-store.ts          # Test case JSON storage
│   ├── test-runner.ts         # Test execution engine
│   ├── test-generator.ts      # Auto-generation orchestrator
│   └── result-formatter.ts    # Terminal/JSON output
│
├── simulation/        # Activation simulation (v1.2)
│   ├── activation-simulator.ts # Single query simulation
│   ├── batch-simulator.ts      # Batch processing with progress
│   └── challenger-detector.ts  # Competition analysis
│
├── calibration/       # Threshold tuning (v1.2)
│   ├── calibration-store.ts   # Event collection (JSONL)
│   ├── threshold-optimizer.ts # F1 score optimization
│   ├── threshold-history.ts   # Rollback support
│   └── benchmark-reporter.ts  # MCC correlation metrics
│
├── teams/             # Agent team management (v1.4)
│   ├── team-store.ts          # Team config CRUD
│   ├── team-validator.ts      # Full validation pipeline
│   ├── team-scaffold.ts       # Agent file generation
│   ├── create-team-workflow.ts # Interactive/non-interactive creation
│   └── gsd-templates.ts       # GSD research and debugging templates
│
├── discovery/         # Pattern discovery from session logs (v1.5)
│   ├── types.ts               # Zod schemas for JSONL session format
│   ├── session-parser.ts      # Streaming JSONL parser
│   ├── session-enumerator.ts  # Session enumeration from index files
│   ├── user-prompt-classifier.ts # 4-layer noise filtering
│   ├── scan-state-store.ts    # Atomic persistence for scan state
│   ├── corpus-scanner.ts      # Incremental scanning with watermarks
│   ├── tool-sequence-extractor.ts # N-gram extraction (bigrams/trigrams)
│   ├── bash-pattern-extractor.ts  # 8-category command classification
│   ├── pattern-aggregator.ts  # Cross-session aggregation + noise filter
│   ├── session-pattern-processor.ts # Per-session processing + subagents
│   ├── pattern-scorer.ts      # Multi-factor scoring formula
│   ├── candidate-ranker.ts    # Ranking with evidence + deduplication
│   ├── skill-drafter.ts       # Draft SKILL.md generation
│   ├── candidate-selector.ts  # Interactive multiselect UI
│   ├── dbscan.ts              # DBSCAN clustering algorithm
│   ├── epsilon-tuner.ts       # Auto epsilon via k-NN knee detection
│   ├── prompt-collector.ts    # Prompt collection wrapper
│   ├── prompt-embedding-cache.ts # Content-hash embedding cache
│   ├── prompt-clusterer.ts    # Per-project clustering + merge
│   ├── cluster-scorer.ts      # 4-factor cluster scoring
│   ├── cluster-drafter.ts     # Activation-focused cluster drafts
│   └── discover-command.ts    # CLI command orchestrator
│
├── cli.ts             # CLI entry point
└── index.ts           # Module exports
```

---

## Requirements Implemented

### v1 Core Requirements (33 total)

#### Foundation (FOUND-01 to FOUND-04)
| ID | Requirement | Status |
|----|-------------|--------|
| FOUND-01 | System stores patterns in `.planning/patterns/` as append-only JSONL files | ✓ |
| FOUND-02 | System stores skills in `.claude/skills/` as Markdown files with YAML frontmatter | ✓ |
| FOUND-03 | Skill format follows Claude Code conventions with trigger and learning extensions | ✓ |
| FOUND-04 | System maintains skill index for fast discovery without reading all files | ✓ |

#### Skill Definition (SKILL-01 to SKILL-05)
| ID | Requirement | Status |
|----|-------------|--------|
| SKILL-01 | User can create a skill with name, purpose, triggers, and content | ✓ |
| SKILL-02 | Skill defines trigger conditions (intent, file, context patterns) | ✓ |
| SKILL-03 | Skill can be enabled or disabled via frontmatter flag | ✓ |
| SKILL-04 | Skill content is human-readable and editable as plain Markdown | ✓ |
| SKILL-05 | Skills are portable (no project-specific paths or dependencies) | ✓ |

#### Skill Registry (REG-01 to REG-04)
| ID | Requirement | Status |
|----|-------------|--------|
| REG-01 | User can list all available skills with metadata | ✓ |
| REG-02 | User can search skills by name, purpose, or trigger patterns | ✓ |
| REG-03 | System detects conflicts when multiple skills match same trigger | ✓ |
| REG-04 | System tracks skill versions through git history | ✓ |

#### Skill Creation (CREATE-01 to CREATE-04)
| ID | Requirement | Status |
|----|-------------|--------|
| CREATE-01 | User can create skill manually via guided workflow | ✓ |
| CREATE-02 | Claude proposes skill structure based on user description | ✓ |
| CREATE-03 | User can refine proposed skill before saving | ✓ |
| CREATE-04 | Created skills are immediately usable without restart | ✓ |

#### Skill Application (APPLY-01 to APPLY-05)
| ID | Requirement | Status |
|----|-------------|--------|
| APPLY-01 | System loads relevant skills into context based on current task | ✓ |
| APPLY-02 | Skill loading respects token budget (2-5% of context window) | ✓ |
| APPLY-03 | User can manually invoke any skill via command | ✓ |
| APPLY-04 | System scores skill relevance when multiple skills match | ✓ |
| APPLY-05 | User can see which skills are currently active | ✓ |

#### Observation (OBS-01 to OBS-04)
| ID | Requirement | Status |
|----|-------------|--------|
| OBS-01 | System captures usage patterns at session start/end via hooks | ✓ |
| OBS-02 | Observation tracks: commands used, files touched, decisions made | ✓ |
| OBS-03 | Observation summarizes patterns, not full transcripts (token-efficient) | ✓ |
| OBS-04 | Observation history has bounded retention (configurable) | ✓ |

#### Pattern Detection (DETECT-01 to DETECT-04)
| ID | Requirement | Status |
|----|-------------|--------|
| DETECT-01 | System analyzes patterns to identify skill candidates | ✓ |
| DETECT-02 | System suggests skill creation when pattern exceeds threshold (3+) | ✓ |
| DETECT-03 | User can accept, defer, or dismiss skill suggestions | ✓ |
| DETECT-04 | System explains why a skill is being suggested (pattern evidence) | ✓ |

#### Token Efficiency (TOKEN-01 to TOKEN-03)
| ID | Requirement | Status |
|----|-------------|--------|
| TOKEN-01 | System tracks token usage before and after skill application | ✓ |
| TOKEN-02 | System reports estimated token savings per skill | ✓ |
| TOKEN-03 | Skills that cost more than they save are flagged for review | ✓ |

### v2 Extension Requirements (10 total)

#### Learning (LEARN-01 to LEARN-04)
| ID | Requirement | Status |
|----|-------------|--------|
| LEARN-01 | System captures user corrections and overrides as feedback | ✓ |
| LEARN-02 | Skills can be refined based on accumulated feedback | ✓ |
| LEARN-03 | Learning is bounded (within defined parameters, user-confirmed) | ✓ |
| LEARN-04 | User can rollback skill to previous version | ✓ |

#### Composition (COMP-01 to COMP-03)
| ID | Requirement | Status |
|----|-------------|--------|
| COMP-01 | Skill can extend another skill via `extends:` frontmatter | ✓ |
| COMP-02 | System resolves skill inheritance and merges content | ✓ |
| COMP-03 | System detects and prevents circular dependencies | ✓ |

#### Agent Emergence (AGENT-01 to AGENT-03)
| ID | Requirement | Status |
|----|-------------|--------|
| AGENT-01 | System detects when skills frequently activate together | ✓ |
| AGENT-02 | System suggests agent creation for stable skill clusters | ✓ |
| AGENT-03 | Generated agents integrate with `.claude/agents/` format | ✓ |

### v1.4 Agent Teams Requirements (37 total)

#### Team Schemas (SCHEMA-01 to SCHEMA-08)
| ID | Requirement | Status |
|----|-------------|--------|
| SCHEMA-01 | TeamConfig type with name, description, leadAgentId, members | ✓ |
| SCHEMA-02 | TeamMember type with agentId, name, agentType, model, backend | ✓ |
| SCHEMA-03 | TeamTask type with id, subject, status, owner, dependencies | ✓ |
| SCHEMA-04 | TeamTopology union: leader-worker, pipeline, swarm, custom | ✓ |
| SCHEMA-05 | TeamValidationResult with valid, errors, warnings, data | ✓ |
| SCHEMA-06 | Zod schemas for runtime validation of all team types | ✓ |
| SCHEMA-07 | InboxMessage type for inter-agent communication | ✓ |
| SCHEMA-08 | StructuredMessageType union with string for forward compatibility | ✓ |

#### Team Scaffolding (SCAFFOLD-01 to SCAFFOLD-06)
| ID | Requirement | Status |
|----|-------------|--------|
| SCAFFOLD-01 | TeamStore provides CRUD for team configs in .claude/teams/ | ✓ |
| SCAFFOLD-02 | writeTeamAgentFiles generates agent .md files for each member | ✓ |
| SCAFFOLD-03 | Interactive create-team workflow with pattern selection | ✓ |
| SCAFFOLD-04 | Non-interactive team creation for scripted usage | ✓ |
| SCAFFOLD-05 | Leader content uses coordinator tools, workers use standard tools | ✓ |
| SCAFFOLD-06 | All team modules exported via barrel files | ✓ |

#### Team Validation (VALID-01 to VALID-07)
| ID | Requirement | Status |
|----|-------------|--------|
| VALID-01 | Schema validation via Zod with descriptive error messages | ✓ |
| VALID-02 | Topology rules: leader-worker requires exactly one leader | ✓ |
| VALID-03 | Tool overlap detection across team members (write tools only) | ✓ |
| VALID-04 | Skill conflict detection across team members | ✓ |
| VALID-05 | Role coherence validation (description matches role) | ✓ |
| VALID-06 | Dependency cycle detection in team tasks (Kahn's algorithm) | ✓ |
| VALID-07 | Full validation pipeline combining all checks | ✓ |

#### Team CLI Commands (CLI-01 to CLI-06)
| ID | Requirement | Status |
|----|-------------|--------|
| CLI-01 | team create command with interactive and non-interactive modes | ✓ |
| CLI-02 | team list command with scope filtering and output formats | ✓ |
| CLI-03 | team validate command with single-team and batch modes | ✓ |
| CLI-04 | team spawn command to check agent resolution readiness | ✓ |
| CLI-05 | team status command with config display and validation summary | ✓ |
| CLI-06 | team/tm namespace dispatch with help text | ✓ |

#### GSD Workflow Templates (GSD-01 to GSD-04)
| ID | Requirement | Status |
|----|-------------|--------|
| GSD-01 | Research team template: 1 synthesizer + 4 specialist researchers | ✓ |
| GSD-02 | Debugging team template: 1 coordinator + 3 investigators | ✓ |
| GSD-03 | Template generators return TeamConfig + sample tasks | ✓ |
| GSD-04 | GSD teams conversion guide (teams vs subagents decision framework) | ✓ |

#### Documentation (DOCS-01 to DOCS-06)
| ID | Requirement | Status |
|----|-------------|--------|
| DOCS-01 | CLI reference updated with all team commands | ✓ |
| DOCS-02 | API reference updated with teams module | ✓ |
| DOCS-03 | Architecture docs updated with teams layer | ✓ |
| DOCS-04 | Tutorial: end-to-end team creation walkthrough | ✓ |
| DOCS-05 | README updated with v1.4 Agent Teams | ✓ |
| DOCS-06 | Skills vs Agents vs Teams comparison guide | ✓ |

### v1.5 Pattern Discovery Requirements (27 total)

#### Scanning & Parsing (SCAN-01 to SCAN-09)
| ID | Requirement | Status |
|----|-------------|--------|
| SCAN-01 | Stream-parse JSONL session files line-by-line without loading into memory | ✓ |
| SCAN-02 | Enumerate all projects and sessions from sessions-index.json | ✓ |
| SCAN-03 | Track scanned sessions incrementally via watermark | ✓ |
| SCAN-04 | Skip already-scanned sessions on subsequent runs | ✓ |
| SCAN-05 | Support project exclude list | ✓ |
| SCAN-06 | Display progress output during scan | ✓ |
| SCAN-07 | Handle all 7 JSONL entry types | ✓ |
| SCAN-08 | Extract tool_use blocks from nested assistant content arrays | ✓ |
| SCAN-09 | Filter noise from user entries (97% are non-prompts) | ✓ |

#### Pattern Extraction (PATT-01 to PATT-05)
| ID | Requirement | Status |
|----|-------------|--------|
| PATT-01 | Extract tool sequence n-grams (bigrams, trigrams) | ✓ |
| PATT-02 | Extract recurring Bash command patterns | ✓ |
| PATT-03 | Track per-session and cross-project frequency | ✓ |
| PATT-04 | Filter framework noise (15+ projects threshold) | ✓ |
| PATT-05 | Include subagent sessions in analysis | ✓ |

#### Ranking & Output (RANK-01 to RANK-05)
| ID | Requirement | Status |
|----|-------------|--------|
| RANK-01 | Multi-factor scoring (frequency, cross-project, recency, consistency) | ✓ |
| RANK-02 | Evidence with sessions, projects, and invocations | ✓ |
| RANK-03 | Interactive candidate selection | ✓ |
| RANK-04 | Draft SKILL.md with pre-filled workflow steps | ✓ |
| RANK-05 | Deduplicate against existing skills | ✓ |

#### Semantic Clustering (CLUS-01 to CLUS-03)
| ID | Requirement | Status |
|----|-------------|--------|
| CLUS-01 | Cluster user prompts with DBSCAN + embeddings | ✓ |
| CLUS-02 | Label clusters with representative prompt text | ✓ |
| CLUS-03 | Surface clusters alongside tool sequence patterns | ✓ |

#### Persistence (PERS-01 to PERS-02)
| ID | Requirement | Status |
|----|-------------|--------|
| PERS-01 | Persistent scan state with Zod validation | ✓ |
| PERS-02 | Atomic writes (write-tmp-then-rename) | ✓ |

#### CLI (CLI-01 to CLI-03)
| ID | Requirement | Status |
|----|-------------|--------|
| CLI-01 | `discover` command for full pipeline | ✓ |
| CLI-02 | `--exclude` flag for project exclusion | ✓ |
| CLI-03 | `--rescan` flag to force full rescan | ✓ |

---

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

All contributions should include tests and pass the existing test suite.
