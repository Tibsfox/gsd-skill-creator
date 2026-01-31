# Dynamic Skill Creator

A self-evolving skill ecosystem for Claude Code that observes usage patterns, suggests skill creation, and composes related skills into purpose-built agents.

## Table of Contents

- [What It Does](#what-it-does)
- [Core Concepts](#core-concepts)
- [Installation](#installation)
- [CLI Commands](#cli-commands)
- [How It Works](#how-it-works)
- [File Structure](#file-structure)
- [Skill Format](#skill-format)
- [Official Claude Code Format](#official-claude-code-format)
- [Token Budget](#token-budget)
- [Bounded Learning](#bounded-learning)
- [Agent Generation](#agent-generation)
- [Configuration](#configuration)
- [Development](#development)
- [Requirements Implemented](#requirements-implemented)

---

## What It Does

The Dynamic Skill Creator helps you build a personalized knowledge base for Claude Code through six core capabilities:

| Capability | Description |
|------------|-------------|
| **1. Capturing Patterns** | Observes your Claude Code sessions to detect recurring workflows, commands, and file access patterns |
| **2. Suggesting Skills** | Proposes skill creation when patterns repeat 3+ times with evidence explaining why |
| **3. Managing Skills** | Provides guided workflows for creating, searching, listing, and organizing skills |
| **4. Auto-Loading** | Automatically loads relevant skills based on context while respecting token budgets (2-5% of context) |
| **5. Learning** | Refines skills based on your corrections and feedback with bounded parameters and user confirmation |
| **6. Composing Agents** | Groups frequently co-activated skills into composite agents stored in `.claude/agents/` |

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

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Agent identifier |
| `description` | string | What the agent does |
| `tools` | string | Comma-separated list of allowed tools |
| `model` | string | Model to use (`inherit`, `sonnet`, `opus`, `haiku`) |
| `skills` | string[] | Skills to preload |

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
# Run all tests (202 tests)
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

---

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

All contributions should include tests and pass the existing test suite (202 tests).
