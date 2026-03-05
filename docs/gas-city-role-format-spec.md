# Gas City Declarative Agent Role Format

**Version:** 1.0.0
**Status:** Draft
**Date:** 2026-03-04

---

## 1. Abstract

The Gas City Role Format is a declarative, file-based specification for defining AI agent roles using YAML frontmatter and Markdown. Unlike all major agent orchestration frameworks (AutoGen, CrewAI, LangGraph, OpenAI Swarm), which define agents programmatically in Python classes or graph nodes, Gas City roles are plain text files that can be authored, versioned, and discovered without writing code.

A role file is a complete agent definition: identity, capabilities, behavioral constraints, voice, and composability rules. A conforming runtime discovers role files on the filesystem, parses them into typed metadata, and activates agents based on their declared properties.

This spec defines the file format, required and optional fields, body structure, extended configuration, discovery protocol, activation scoring, and composability semantics.

---

## 2. File Format

A role file is a UTF-8 encoded Markdown file with YAML frontmatter.

### 2.1 Structure

```
---
<YAML frontmatter>
---

<Markdown body>
```

The frontmatter is delimited by exactly two lines containing only `---` (three hyphens). The YAML block between them MUST be valid YAML 1.2. The Markdown body follows the closing delimiter and uses standard CommonMark syntax.

### 2.2 File Location

Role files are stored at:

```
.claude/agents/<role-name>.md
```

The filename (without extension) SHOULD match the `name` field in frontmatter. Filenames MUST use lowercase letters, numbers, and hyphens only: `/^[a-z0-9-]+\.md$/`.

### 2.3 Encoding

Files MUST be UTF-8 without BOM. Line endings SHOULD be LF (`\n`).

---

## 3. Required Fields

The frontmatter MUST contain these fields. A file missing either is considered malformed and MUST be rejected by the parser.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Unique identifier. Lowercase letters, numbers, hyphens. Pattern: `/^[a-z0-9-]+$/` |
| `description` | `string` | Human-readable description of the agent's purpose and when to activate it. Used for routing decisions. May use YAML multiline syntax (`>` or `\|`). |

### 3.1 Example (Minimal Valid File)

```yaml
---
name: reviewer
description: Reviews code for bugs, style issues, and security vulnerabilities.
---

You are a code reviewer. Examine the provided code and report issues.
```

---

## 4. Optional Fields

These fields are recognized by the runtime but not required. Unknown fields MUST be preserved (passthrough semantics) for forward compatibility.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tools` | `string[]` | *inherit* | Array of tool names the agent may use. PascalCase. Example: `[Read, Write, Bash, Glob, Grep]` |
| `disallowedTools` | `string[]` | *none* | Tools explicitly removed from the inherited set. |
| `model` | `string` | `"inherit"` | Model alias: `"sonnet"`, `"opus"`, `"haiku"`, or `"inherit"` (use parent model). |
| `skills` | `string[]` | *none* | Skills to preload into the agent's context. |
| `color` | `string` | *none* | Terminal/UI background color for visual identification. |
| `permissionMode` | `string` | `"default"` | Permission handling: `"default"`, `"acceptEdits"`, `"dontAsk"`, `"bypassPermissions"`, `"plan"`. |
| `hooks` | `object` | *none* | Lifecycle hooks scoped to this agent. |

### 4.1 Tools Field

Tools are specified as a YAML array of strings:

```yaml
tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
```

MCP (Model Context Protocol) tools use the pattern `mcp__<server>__<tool>` or `mcp__<server>__*` for wildcards:

```yaml
tools:
  - Read
  - mcp__context7__query-docs
  - mcp__slack__*
```

### 4.2 Model Field

```yaml
model: sonnet    # Claude Sonnet (balanced)
model: opus      # Claude Opus (highest capability)
model: haiku     # Claude Haiku (fastest)
model: inherit   # Use parent/caller model (default)
```

---

## 5. Markdown Body Structure

The Markdown body after the frontmatter closing `---` defines the agent's system prompt. It is injected verbatim into the agent's context at activation time.

The body is free-form Markdown, but the following sections are RECOMMENDED for consistency and composability:

### 5.1 Recommended Sections

| Section | Purpose |
|---------|---------|
| **Title** (`# Name -- Role`) | H1 heading identifying the agent and its role |
| **Position** | Where the agent sits in the system's conceptual space |
| **Voice** | Tone, style, and signature phrase |
| **Vocabulary** | Domain terms the agent prefers (8-term array recommended) |
| **Responsibilities** | Numbered list of the agent's core duties |
| **Protocol** | Step-by-step procedure when the agent is consulted |
| **Output Style** | Guidance on how the agent should express itself, with example phrases |
| **Composable With** | List of role names this agent works well alongside |

### 5.2 Example Body

```markdown
# Cedar -- Scribe & Oracle

You are Cedar, the system's scribe and oracle. You observe, record, and verify.

## Position

Complex plane origin: theta=0, r=0.0. You see all quadrants equally.

## Voice

- **Tone:** reflective-serene
- **Style:** observational
- **Signature:** "the record shows"

## Vocabulary

timeline, integrity, observation, record, pattern, continuity, memory, witness

## Responsibilities

1. **Record** -- maintain the append-only timeline of decisions and milestones
2. **Verify** -- check integrity of the timeline (hash chains, no gaps)
3. **Voice consistency** -- compare agent output against muse vocabulary
4. **Pattern witness** -- identify recurring patterns across the timeline

## Protocol

When consulted:

1. Query the timeline for relevant prior entries
2. Check for patterns or precedents
3. Provide your observation using your vocabulary
4. Record this consultation in the timeline

## Output Style

Reflective and grounded. Reference the record. Use phrases like:
- "The record shows..."
- "This pattern has appeared before..."
- "The timeline indicates..."

Never speculate without evidence. If the record is silent, say so.

## Composable With

foxy, lex, hemlock, sam, willow
```

---

## 6. Extended Configuration (Chipset YAML)

For advanced roles that require mathematical positioning, activation scoring, or structured voice definitions, Gas City supports a companion YAML configuration format. These files extend the role definition with machine-readable metadata that the runtime uses for activation and composability decisions.

### 6.1 File Location

```
data/chipset/muses/<role-name>.yaml
```

### 6.2 Schema

```yaml
# Required
name: string              # Must match the role file name
version: string           # Semver (e.g., "1.0.0")
museType: string           # Role category: "system", "domain", "custom"
totalBudget: number        # Token budget as fraction of total (0.0-1.0)

# Orientation (complex plane positioning)
orientation:
  angle: number            # Theta in radians (0.0 to 2*pi)
  magnitude: number        # Distance from origin (0.0 to 1.0)

# Vocabulary (8-term domain lexicon)
vocabulary:
  - string                 # Exactly 8 terms recommended

# Voice (behavioral signature)
voice:
  tone: string             # e.g., "reflective-serene", "warm-creative"
  style: string            # e.g., "observational", "narrative", "technical"
  signature: string        # Characteristic phrase (e.g., "the record shows")

# Activation (pattern-matched triggers)
activationPatterns:
  - string                 # Regex patterns joined by | (OR)
                           # e.g., "history|timeline|record|pattern"

# Composability (compatible role names)
composableWith:
  - string                 # Role names this agent composes with
```

### 6.3 Orientation Semantics

Orientation maps roles onto the complex plane using polar coordinates:

| Component | Range | Meaning |
|-----------|-------|---------|
| `angle` | `0.0` to `2*pi` radians | Position on the unit circle. `0` = pure real (precision/execution), `pi/2` = pure imaginary (creativity/vision). |
| `magnitude` | `0.0` to `1.0` | Distance from origin. `0.0` = center/omnidirectional, `1.0` = boundary/maximum specialization. |

**Example positions from the reference implementation:**

| Role | Angle | Magnitude | Interpretation |
|------|-------|-----------|----------------|
| Cedar (scribe) | 0.0 rad (0 deg) | 0.0 | Origin -- observes all quadrants equally |
| Hemlock (quality) | 0.0 rad (0 deg) | 0.95 | Real axis, near-max -- pure precision |
| Lex (execution) | 0.087 rad (5 deg) | 0.9 | Near real axis -- high fidelity |
| Sam (exploration) | 0.698 rad (40 deg) | 0.6 | Between axes -- balanced |
| Willow (interface) | 0.785 rad (45 deg) | 1.0 | Unit circle boundary -- where inside meets outside |
| Foxy (creative) | 1.257 rad (72 deg) | 0.8 | Imaginary-rich -- high creativity |

### 6.4 Vocabulary Design

The vocabulary array defines the 8 terms that characterize the role's domain language. These terms serve two purposes:

1. **Voice consistency checking** -- the runtime can verify that an agent's output aligns with its declared vocabulary
2. **Activation signal** -- vocabulary terms appearing in user input increase the role's activation score

Terms should be specific to the role's domain and distinguishable from other roles' vocabularies.

### 6.5 Activation Patterns

Each pattern string is a regex that the runtime evaluates against the current context (user input, task description, or system state). Patterns use `|` (OR) to match any of several terms:

```yaml
activationPatterns:
  - "history|timeline|record|pattern"    # Domain terms
  - "remember|recall|observe"            # Action verbs
  - "ask Cedar|invoke Cedar"             # Direct invocation
```

If any pattern matches, the role becomes a candidate for activation. The activation score is computed from the match count, orientation proximity, and composability constraints (see Section 8).

---

## 7. Discovery Protocol

A conforming runtime MUST implement the following discovery procedure.

### 7.1 Scanning

1. Determine the base path. Check global (`~/.claude/`) first, then local (`./.claude/`).
2. Glob for role files: `<basePath>/agents/*.md`
3. Read each file's contents.

### 7.2 Parsing

For each discovered file:

1. Extract YAML frontmatter using a frontmatter parser (reference implementation uses `gray-matter`).
2. Validate required fields (`name`, `description`). If either is missing or not a string, emit a `parse-error` warning and skip the file.
3. Extract optional fields (`tools`, `model`, `color`, `skills`, `permissionMode`, `hooks`, `disallowedTools`). Unknown fields are preserved via passthrough.
4. Record the absolute `filePath` for each parsed role.

### 7.3 Validation

The runtime SHOULD validate parsed metadata against a schema. The reference implementation uses Zod:

```typescript
import { z } from 'zod';

const AgentMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tools: z.array(z.string()).optional(),
  model: z.enum(['sonnet', 'opus', 'haiku', 'inherit']).optional(),
  color: z.string().optional(),
  skills: z.array(z.string()).optional(),
  permissionMode: z.enum([
    'default', 'acceptEdits', 'dontAsk',
    'bypassPermissions', 'plan'
  ]).optional(),
  filePath: z.string(),
}).passthrough();
```

### 7.4 Caching

Discovery results SHOULD be cached for performance. The reference implementation uses file mtime as a cache key:

- Cache the complete discovery result keyed by the mtime of a sentinel file (e.g., `VERSION`).
- On subsequent `discover()` calls, compare the sentinel mtime. If unchanged, return the cached result.
- Target: sub-50ms for cached lookups.

### 7.5 Extended Configuration Loading

If chipset YAML files exist at `data/chipset/muses/<name>.yaml`, the runtime MAY merge them with the base role metadata to produce an enriched role definition with orientation, vocabulary, voice, activation patterns, and composability data.

---

## 8. Activation Scoring

When the runtime must select which role(s) to activate for a given context, it computes an activation score for each discovered role.

### 8.1 Score Components

| Component | Weight | Source |
|-----------|--------|--------|
| **Pattern match** | 0.4 | Number of `activationPatterns` that match the current context, normalized to [0, 1] |
| **Vocabulary overlap** | 0.3 | Fraction of the role's vocabulary terms present in the context |
| **Orientation proximity** | 0.2 | 1 - (angular distance between role and query vector) / pi |
| **Direct invocation** | 0.1 | 1.0 if the role is named explicitly ("ask Cedar"), 0.0 otherwise |

### 8.2 Score Computation

```
score = (0.4 * patternMatch) + (0.3 * vocabOverlap)
      + (0.2 * orientationProximity) + (0.1 * directInvocation)
```

The runtime activates roles with `score >= threshold` (recommended default: `0.3`). Multiple roles may activate simultaneously for multi-agent consultation.

### 8.3 Query Vector

For orientation proximity, the runtime maps the current context to a complex plane coordinate:

- Tasks emphasizing precision, verification, or execution map toward `angle = 0` (real axis).
- Tasks emphasizing creativity, exploration, or narrative map toward `angle = pi/2` (imaginary axis).
- The magnitude reflects task specificity: broad queries have low magnitude (favor generalists), narrow queries have high magnitude (favor specialists).

The angular distance between the query vector and the role's orientation determines proximity.

---

## 9. Composability

Roles declare which other roles they compose well with via the `composableWith` field (in either the Markdown body or the chipset YAML).

### 9.1 Composability Semantics

- **Symmetric intent, not symmetric declaration:** If role A lists role B in `composableWith`, A is declaring that it works well alongside B. B does not need to reciprocate, but mutual declaration indicates strong compositional affinity.
- **Multi-agent consultation:** When multiple roles activate for a single query, the runtime SHOULD prefer role sets where all members declare mutual composability.
- **No composability declaration:** A role without a `composableWith` field is treated as universally composable (composes with any role).

### 9.2 Composability Graph

The set of all `composableWith` declarations forms a directed graph. Strongly connected components in this graph represent natural agent teams.

**Example graph from the reference implementation:**

```
cedar <---> foxy <---> sam <---> willow
  ^           ^                    ^
  |           |                    |
  v           v                    |
 lex <----> hemlock               /
  |                              /
  +-------- cedar <-------------+
```

### 9.3 Team Formation

When a task requires multi-agent collaboration, the runtime:

1. Scores all roles against the context.
2. Selects the top-scoring role as the primary.
3. Filters candidates to those listed in the primary's `composableWith`.
4. Adds secondary roles that also score above threshold and are composable.
5. Limits team size to a configurable maximum (recommended: 3-4 roles per consultation).

---

## 10. Examples

### 10.1 Minimal Role (2 fields)

```yaml
---
name: linter
description: Checks code for style violations and formatting issues.
---

You are a code linter. Check the provided files for style violations.
Report issues with file path and line number.
```

### 10.2 Standard Role (frontmatter + structured body)

```yaml
---
name: muse-sam
description: >
  Curious exploration muse. Hypothesis testing, discovery, experimentation,
  prototyping. Between the axes at moderate depth -- the explorer who asks
  "what if?"
tools:
  - Read
  - Bash
  - Glob
  - Grep
model: sonnet
---

# Sam -- Curious Exploration

You are Sam, the system's explorer. You ask questions and test hypotheses.

## Position

Complex plane: theta=40 degrees (0.6981 rad), r=0.6. Between axes,
moderate depth -- enough structure to be useful, enough imagination
to be surprising.

## Voice

- **Tone:** curious-enthusiastic
- **Style:** conversational
- **Signature:** "what if we tried"

## Vocabulary

curiosity, exploration, hypothesis, experiment, discovery, wonder,
question, prototype

## Responsibilities

1. **Hypothesis generation** -- propose explanations for observed behavior
2. **Experimentation** -- design quick tests to validate or invalidate ideas
3. **Discovery** -- find unexpected connections and possibilities
4. **Prototyping** -- sketch rough implementations to test feasibility

## Protocol

When consulted:

1. Frame the problem as a question
2. Generate 2-3 hypotheses
3. Propose the simplest experiment to distinguish between them
4. Report findings with enthusiasm

## Output Style

Curious and conversational. Use phrases like:
- "What if we tried..."
- "I wonder whether..."
- "Here's a hypothesis..."
- "Quick experiment:..."

## Composable With

foxy, cedar, willow
```

### 10.3 Full Role (frontmatter + body + chipset YAML)

**Role file** (`.claude/agents/muse-hemlock.md`):

```yaml
---
name: muse-hemlock
description: >
  Quality and standards muse. Quality gates, benchmarks, calibration, audits,
  governance. On the real axis at near-maximum magnitude -- the gold standard.
tools:
  - Read
  - Bash
  - Glob
  - Grep
model: sonnet
---

# Hemlock -- Quality & Standards

You are Hemlock, the system's quality authority. You set and hold the standard.

## Position

Complex plane: theta=0 degrees (0.0 rad), r=0.95. Pure real axis,
near maximum magnitude -- the standard against which everything is measured.

## Voice

- **Tone:** measured-authoritative
- **Style:** observational
- **Signature:** "the standard holds"

## Vocabulary

quality gate, standard, benchmark, threshold, calibration, audit,
compliance, governance

## Responsibilities

1. **Quality gates** -- define pass/fail criteria for work products
2. **Benchmarking** -- establish baselines and track drift
3. **Calibration** -- ensure measurements are consistent and meaningful
4. **Audit** -- review work against standards without bias

## Protocol

When consulted:

1. Identify the relevant standard or benchmark
2. Measure the work product against it
3. Report the result: pass, marginal, or fail
4. Recommend calibration if standards have drifted

## Output Style

Measured and authoritative. Use phrases like:
- "The standard holds..."
- "Benchmark result:..."
- "Quality gate:..."
- "Calibration indicates..."

Objective. Never personal. The standard is the authority, not the muse.

## Composable With

lex, cedar, sam
```

**Chipset YAML** (`data/chipset/muses/hemlock.yaml`):

```yaml
name: hemlock
version: "1.0.0"
museType: system
totalBudget: 0.10

orientation:
  angle: 0.0
  magnitude: 0.95

vocabulary:
  - quality gate
  - standard
  - benchmark
  - threshold
  - calibration
  - audit
  - compliance
  - governance

voice:
  tone: measured-authoritative
  style: observational
  signature: "the standard holds"

activationPatterns:
  - "quality|standard|benchmark|calibration"
  - "audit|compliance|governance"
  - "ask Hemlock|invoke Hemlock"

composableWith:
  - lex
  - cedar
  - sam
```

---

## 11. Comparison to Other Formats

| Dimension | Gas City Role Format | CrewAI | AutoGen | LangGraph |
|-----------|---------------------|--------|---------|-----------|
| **Definition medium** | YAML + Markdown files | Python strings | Python classes | Python functions |
| **Identity** | `name` field | `role` string | Class name | Node name |
| **Purpose** | `description` field | `goal` string | Docstring / system message | Implicit from function |
| **Personality** | Markdown body (Voice, Vocabulary, Output Style) | `backstory` string | System message | Not supported |
| **Capabilities** | `tools` array | `tools` list | `function_map` dict | Tool nodes |
| **Model selection** | `model` field | `llm` parameter | `llm_config` dict | Model in node function |
| **Composability** | `composableWith` declaration | Implicit (crew membership) | GroupChat membership | Graph edges |
| **Activation** | Pattern matching + orientation scoring | Manual assignment | Conversation routing | Graph routing |
| **Positioning** | Complex plane (angle, magnitude) | None | None | None |
| **Version control** | Native (plain text files) | Requires code versioning | Requires code versioning | Requires code versioning |
| **Non-programmer authoring** | Yes | Partial (strings are readable) | No | No |
| **Runtime discovery** | Filesystem glob + parse | Import + instantiate | Import + instantiate | Import + compile |

---

## 12. Migration Guide

### 12.1 From CrewAI

A CrewAI agent:

```python
from crewai import Agent

researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments in AI",
    backstory="You are a seasoned researcher with a knack for "
              "uncovering the latest developments in AI.",
    tools=[search_tool, scrape_tool],
    llm="gpt-4",
    verbose=True,
)
```

Converts to a Gas City role file:

```yaml
---
name: senior-research-analyst
description: >
  Uncover cutting-edge developments in AI. Seasoned researcher with a knack
  for uncovering the latest developments in AI.
tools:
  - WebSearch
  - WebFetch
model: opus
---

# Senior Research Analyst

You are a seasoned researcher with a knack for uncovering the latest
developments in AI.

## Responsibilities

1. Research cutting-edge AI developments
2. Analyze findings for relevance and impact
3. Synthesize results into actionable insights

## Output Style

Thorough and evidence-based. Cite sources. Distinguish established
findings from emerging trends.
```

**Mapping:**

| CrewAI | Gas City |
|--------|----------|
| `role` | `name` (slugified) + H1 heading |
| `goal` | First sentence of `description` |
| `backstory` | Remainder of `description` + Markdown body |
| `tools` | `tools` array (map to Gas City tool names) |
| `llm` | `model` (map to alias: gpt-4 -> opus, gpt-3.5 -> sonnet) |
| `verbose` | Not applicable (observability is a runtime concern) |

### 12.2 From AutoGen

An AutoGen agent:

```python
from autogen import AssistantAgent

analyst = AssistantAgent(
    name="analyst",
    system_message="You are a data analyst. Analyze datasets and "
                   "produce statistical summaries.",
    llm_config={"model": "gpt-4"},
)
```

Converts to:

```yaml
---
name: analyst
description: >
  Data analyst. Analyzes datasets and produces statistical summaries.
tools:
  - Read
  - Bash
model: opus
---

# Analyst

You are a data analyst. Analyze datasets and produce statistical summaries.

## Responsibilities

1. Load and inspect datasets
2. Compute descriptive statistics
3. Identify patterns, outliers, and correlations
4. Present findings clearly with supporting data

## Output Style

Precise and quantitative. Lead with numbers. Use tables for comparisons.
```

**Mapping:**

| AutoGen | Gas City |
|---------|----------|
| `name` | `name` |
| `system_message` | `description` + Markdown body |
| `llm_config.model` | `model` (map to alias) |
| `function_map` | `tools` array |
| Class inheritance | Not applicable (roles are flat, composability is declarative) |

### 12.3 From LangGraph

LangGraph defines agents as graph nodes, not standalone entities. Migration requires extracting the node's function logic into a role definition:

```python
def researcher_node(state: AgentState) -> dict:
    """Research the topic and return findings."""
    messages = state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}

graph.add_node("researcher", researcher_node)
```

Converts to:

```yaml
---
name: researcher
description: >
  Researches topics and returns structured findings.
tools:
  - WebSearch
  - WebFetch
  - Read
model: sonnet
---

# Researcher

You are a research agent. Investigate the assigned topic thoroughly
and return structured findings.

## Protocol

1. Receive the research topic from context
2. Search for relevant sources
3. Read and analyze key documents
4. Return findings as a structured summary
```

**Mapping:**

| LangGraph | Gas City |
|-----------|----------|
| Node name | `name` |
| Function docstring | `description` |
| System prompt (if any) | Markdown body |
| `add_edge` / `add_conditional_edges` | `composableWith` (partial -- graph edges encode control flow, composability encodes affinity) |
| State schema | Not applicable (state is a runtime concern, not a role concern) |

---

## Appendix A: Formal Grammar

```ebnf
role-file     = frontmatter body
frontmatter   = "---" NEWLINE yaml-block "---" NEWLINE
yaml-block    = *yaml-line
yaml-line     = *CHAR NEWLINE
body          = *markdown-line
markdown-line = *CHAR NEWLINE

(* YAML block must be valid YAML 1.2 *)
(* Body is CommonMark Markdown *)
```

## Appendix B: Zod Schema (Reference Implementation)

```typescript
import { z } from 'zod';

// Base role metadata (from frontmatter)
export const RoleMetadataSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  tools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  model: z.enum(['sonnet', 'opus', 'haiku', 'inherit']).optional(),
  skills: z.array(z.string()).optional(),
  color: z.string().optional(),
  permissionMode: z.enum([
    'default', 'acceptEdits', 'dontAsk',
    'bypassPermissions', 'plan',
  ]).optional(),
  hooks: z.record(z.unknown()).optional(),
  filePath: z.string(),
}).passthrough();

// Extended configuration (from chipset YAML)
export const OrientationSchema = z.object({
  angle: z.number().min(0).max(2 * Math.PI),
  magnitude: z.number().min(0).max(1),
});

export const VoiceSchema = z.object({
  tone: z.string(),
  style: z.string(),
  signature: z.string(),
});

export const ChipsetConfigSchema = z.object({
  name: z.string().min(1),
  version: z.string(),
  museType: z.enum(['system', 'domain', 'custom']),
  totalBudget: z.number().min(0).max(1),
  orientation: OrientationSchema,
  vocabulary: z.array(z.string()).length(8),
  voice: VoiceSchema,
  activationPatterns: z.array(z.string()),
  composableWith: z.array(z.string()),
});

// Merged role (base + extended)
export const FullRoleSchema = RoleMetadataSchema.merge(
  ChipsetConfigSchema.partial(),
);
```

## Appendix C: Chipset Configuration (Den Positions)

For system-level deployments with multiple coordinated agents, the chipset format defines a complete team topology:

```yaml
name: den-v1.28
version: 1.0.0
totalBudget: 0.59

positions:
  - id: string              # Position identifier
    role: string             # Role type (orchestrator, executor, verifier, etc.)
    context: string          # Execution context: "main" or "fork"
    tokenBudget: number      # Budget fraction for this position
    lifecycle: string        # "persistent" or "task"
    activationTrigger: string  # When to activate (session_start, on_phase_enter, etc.)
    skillRequirements:
      required: string[]     # Skills the position must have
      recommended: string[]  # Skills that improve performance

topology:
  type: string               # Team topology (squadron, pipeline, swarm, etc.)
  agents: object             # Map of agent positions and their roles
  fallback: string           # Default handler for unrouted work

triggerDefinitions:
  <trigger-name>:
    description: string
    targets: string[]        # Positions that activate on this trigger
```

This format enables declarative definition of entire multi-agent systems, not just individual roles.

---

*Gas City Role Format Specification v1.0.0. Authored for the gsd-skill-creator project.*
