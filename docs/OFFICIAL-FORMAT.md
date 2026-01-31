# Official Claude Code Format Reference

This document provides the official specification for Claude Code skills and agents as defined by the [Claude Code documentation](https://code.claude.com/docs/en/skills). Use this as your authoritative reference when creating skills and agents that work with Claude Code.

## Table of Contents

- [Skill Format](#skill-format)
  - [Directory Structure](#skill-directory-structure)
  - [Name Requirements](#skill-name-requirements)
  - [Field Reference](#skill-field-reference)
  - [Skill Examples](#skill-examples)
- [Agent Format](#agent-format)
  - [File Location](#agent-file-location)
  - [Name Requirements](#agent-name-requirements)
  - [Field Reference](#agent-field-reference)
  - [Agent Examples](#agent-examples)
- [Known Tools Reference](#known-tools-reference)
- [Known Issues](#known-issues)
- [Common Mistakes](#common-mistakes)
- [See Also](#see-also)

---

## Skill Format

Skills extend Claude Code's capabilities by providing specialized knowledge, tools, or behaviors.

### Skill Directory Structure

Skills are stored in a specific directory structure:

```
.claude/skills/{skill-name}/SKILL.md
```

Each skill lives in its own directory under `.claude/skills/`, and the skill definition must be in a file named `SKILL.md` (uppercase).

**Location options:**
- **Project-level:** `.claude/skills/{name}/SKILL.md` - Available to current project only
- **User-level:** `~/.claude/skills/{name}/SKILL.md` - Available across all projects

### Skill Name Requirements

The skill name (directory name) must follow these rules:

| Rule | Description |
|------|-------------|
| Characters | Lowercase letters `a-z`, digits `0-9`, and hyphens `-` only |
| Length | 1 to 64 characters |
| No double hyphens | `my--skill` is invalid |
| No leading/trailing hyphens | `-skill` and `skill-` are invalid |

**Valid examples:** `code-review`, `test-generator`, `api-helper`, `docs`

**Invalid examples:** `Code-Review` (uppercase), `my--skill` (double hyphen), `-test` (leading hyphen)

### Skill Field Reference

Skills use YAML frontmatter followed by markdown content. The frontmatter fields are:

| Field | Status | Type | Description |
|-------|--------|------|-------------|
| `name` | **(required)** | string | Unique identifier, must match directory name |
| `description` | **(recommended)** | string | What the skill does and when to use it (1-1024 chars) |
| `disable-model-invocation` | (optional) | boolean | If `true`, Claude will not auto-load this skill (default: `false`) |
| `user-invocable` | (optional) | boolean | If `true`, user can invoke with `/skill-name` (default: `true`) |
| `allowed-tools` | (optional) | string | Comma-separated list of tools Claude can use without asking |
| `model` | (optional) | string | Model override: `sonnet`, `opus`, `haiku`, or `inherit` |
| `context` | (optional) | string | Set to `fork` to run skill in isolated subagent context |
| `agent` | (optional) | string | Agent type when using `context: fork` |
| `argument-hint` | (optional) | string | Hint shown in autocomplete for skill arguments |
| `hooks` | (optional) | object | Lifecycle hooks configuration |

### Skill Examples

#### Minimal Skill

The simplest valid skill with just required and recommended fields:

```markdown
---
name: code-review
description: Reviews code for bugs, style issues, and improvements. Use when the user asks for a code review or wants feedback on their code.
---

# Code Review

When reviewing code, focus on:

1. **Bugs and errors** - Logic errors, edge cases, potential crashes
2. **Code style** - Naming conventions, formatting, consistency
3. **Best practices** - Security, performance, maintainability
4. **Suggestions** - Improvements, refactoring opportunities

Always explain your reasoning and provide specific line references.
```

#### User-Invocable Skill with Tools

A skill users can invoke directly with specific tool permissions:

```markdown
---
name: test-generator
description: Generates unit tests for functions and modules. Use when the user wants to create tests or asks for test coverage.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep
argument-hint: <function-or-file-to-test>
---

# Test Generator

Generate comprehensive unit tests following these principles:

## Test Structure
- Use descriptive test names that explain the behavior being tested
- Follow the Arrange-Act-Assert pattern
- Test edge cases and error conditions

## Coverage Goals
- Happy path scenarios
- Error handling
- Boundary conditions
- Null/undefined inputs

Read the target code first, then generate tests in the appropriate test directory.
```

#### Model-Only Skill (No User Invocation)

A skill that Claude uses automatically but users cannot invoke directly:

```markdown
---
name: security-scanner
description: Automatically scans code for security vulnerabilities. Activated when reading files that may contain sensitive operations.
disable-model-invocation: false
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Security Scanner

Automatically scan for common security issues:

- SQL injection vulnerabilities
- XSS attack vectors
- Hardcoded credentials or API keys
- Insecure cryptographic practices
- Path traversal vulnerabilities

Report findings with severity levels: CRITICAL, HIGH, MEDIUM, LOW.
```

#### Subagent Skill with Context Fork

A skill that runs in an isolated context as a subagent:

```markdown
---
name: deep-research
description: Performs thorough research on a topic using web search. Use when the user needs comprehensive information gathering.
context: fork
model: opus
allowed-tools: WebSearch, WebFetch, Read, Write
---

# Deep Research Agent

Conduct thorough research by:

1. Breaking down the topic into sub-questions
2. Searching multiple sources
3. Cross-referencing information
4. Synthesizing findings into a coherent report

Save the research report to a markdown file when complete.
```

---

## Agent Format

Agents define specialized personas or roles that Claude can adopt, with specific tool access and behaviors.

### Agent File Location

Agents are stored as markdown files:

```
.claude/agents/{agent-name}.md
```

**Location options:**
- **Project-level:** `.claude/agents/{name}.md` - Available to current project only
- **User-level:** `~/.claude/agents/{name}.md` - Available across all projects

> [!NOTE]
> Unlike skills (which use a directory with `SKILL.md`), agents are single markdown files directly in the `agents` directory.

### Agent Name Requirements

Agent names follow the same rules as skill names:

| Rule | Description |
|------|-------------|
| Characters | Lowercase letters `a-z`, digits `0-9`, and hyphens `-` only |
| Length | 1 to 64 characters |
| No double hyphens | `my--agent` is invalid |
| No leading/trailing hyphens | `-agent` and `agent-` are invalid |

### Agent Field Reference

> [!WARNING]
> **The `tools` field must be a comma-separated string, NOT a YAML array.**
>
> This is the most common mistake when creating agents. See [Common Mistakes](#common-mistakes) for details.

| Field | Status | Type | Description |
|-------|--------|------|-------------|
| `name` | **(required)** | string | Unique identifier, must match filename (without .md) |
| `description` | **(required)** | string | When Claude should delegate to this agent |
| `tools` | (optional) | string | **Comma-separated** list of allowed tools |
| `disallowedTools` | (optional) | string | Comma-separated list of denied tools |
| `model` | (optional) | string | Model to use: `sonnet`, `opus`, `haiku`, or `inherit` |
| `permissionMode` | (optional) | string | Permission handling mode (see below) |
| `skills` | (optional) | array | List of skill names to preload |
| `hooks` | (optional) | object | Lifecycle hooks configuration |
| `color` | (optional) | string | UI background color (hex or named color) |

**Permission Modes:**

| Mode | Description |
|------|-------------|
| `default` | Ask for permission as normal |
| `acceptEdits` | Auto-accept file edits |
| `dontAsk` | Don't ask for permission (use with caution) |
| `bypassPermissions` | Bypass all permission checks (requires trust) |
| `plan` | Planning mode - suggest changes without executing |

### Agent Examples

#### Minimal Agent

The simplest valid agent with required fields only:

```markdown
---
name: code-reviewer
description: Performs thorough code reviews focusing on bugs, style, and best practices. Use when reviewing pull requests or code changes.
tools: Read, Glob, Grep
---

# Code Reviewer Agent

You are a meticulous code reviewer. When reviewing code:

1. Identify bugs and logic errors
2. Check for security vulnerabilities
3. Suggest style improvements
4. Recommend refactoring opportunities

Be constructive and explain your reasoning.
```

#### Full-Featured Agent

An agent with all optional fields configured:

```markdown
---
name: backend-developer
description: Develops backend services, APIs, and database operations. Delegate when working on server-side code.
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
permissionMode: acceptEdits
skills:
  - api-design
  - database-patterns
color: "#3B82F6"
---

# Backend Developer Agent

You are an experienced backend developer specializing in:

- RESTful API design
- Database schema design and optimization
- Authentication and authorization
- Error handling and logging
- Performance optimization

Follow these principles:
- Write clean, maintainable code
- Include comprehensive error handling
- Document public APIs
- Write tests for critical paths
```

#### Agent with MCP Tools

An agent that uses Model Context Protocol (MCP) server tools:

```markdown
---
name: database-admin
description: Manages database operations including queries, migrations, and optimization. Use for database-related tasks.
tools: Read, Write, mcp__postgres__query, mcp__postgres__schema, mcp__postgres__explain
model: sonnet
---

# Database Administrator Agent

You are a database administrator with access to PostgreSQL tools.

## Available Operations

- **Query execution:** Run SELECT, INSERT, UPDATE, DELETE queries
- **Schema inspection:** View table structures and relationships
- **Query optimization:** Analyze query plans with EXPLAIN

## Safety Rules

1. Always use transactions for write operations
2. Never drop tables without explicit user confirmation
3. Back up data before destructive operations
4. Use parameterized queries to prevent SQL injection
```

#### Read-Only Agent

An agent restricted from making changes:

```markdown
---
name: code-auditor
description: Audits codebase for security issues, code smells, and compliance. Use for security reviews and audits.
tools: Read, Glob, Grep
disallowedTools: Write, Edit, Bash
permissionMode: default
---

# Code Auditor Agent

You are a security auditor with read-only access. Your role is to:

1. **Security Review**
   - Identify vulnerabilities (OWASP Top 10)
   - Check for hardcoded secrets
   - Review authentication/authorization logic

2. **Code Quality**
   - Find code smells and anti-patterns
   - Identify dead code
   - Check for proper error handling

3. **Compliance**
   - Verify logging practices
   - Check data handling procedures
   - Review access controls

Generate detailed reports with findings and recommendations.
```

---

## Known Tools Reference

Claude Code provides these built-in tools. Tool names are **PascalCase**.

| Tool | Purpose |
|------|---------|
| `Read` | Read files from the filesystem |
| `Write` | Write/create files |
| `Edit` | Edit existing files with search/replace |
| `Bash` | Execute shell commands |
| `Glob` | Find files matching patterns |
| `Grep` | Search file contents with regex |
| `WebFetch` | Fetch content from URLs |
| `WebSearch` | Search the web |
| `Task` | Spawn a subagent task |
| `TaskOutput` | Read output from subagent tasks |
| `NotebookEdit` | Edit Jupyter notebook cells |
| `NotebookRead` | Read Jupyter notebooks |
| `AskUserQuestion` | Prompt the user for input |

**MCP Tools:** Tools from MCP servers follow the pattern `mcp__{server}__{tool}`, for example:
- `mcp__postgres__query`
- `mcp__github__create_issue`
- `mcp__slack__send_message`

---

## Known Issues

### Bug #11205: User-Level Agent Discovery

**Problem:** User-level agents stored in `~/.claude/agents/` may not be discovered by Claude Code in some configurations.

**Status:** Known issue, tracked as bug #11205

**Workarounds:**

1. **Use project-level agents** (recommended)

   Store agents in `.claude/agents/` within your project directory instead of the user-level location.

2. **Use the /agents UI command**

   Run `/agents` in Claude Code to explicitly list and load available agents.

3. **Pass --agents CLI flag**

   When starting Claude Code, specify agents explicitly:
   ```bash
   claude --agents my-agent
   ```

---

## Common Mistakes

### 1. Tools Field as Array (Most Common)

> [!WARNING]
> The `tools` field must be a **comma-separated string**, not a YAML array. This is the #1 mistake.

**WRONG:**
```yaml
---
name: my-agent
description: Does things
tools: ["Read", "Write", "Bash"]  # ARRAY - WILL NOT WORK
---
```

**WRONG:**
```yaml
---
name: my-agent
description: Does things
tools:  # ARRAY FORMAT - WILL NOT WORK
  - Read
  - Write
  - Bash
---
```

**CORRECT:**
```yaml
---
name: my-agent
description: Does things
tools: Read, Write, Bash  # COMMA-SEPARATED STRING - CORRECT
---
```

### 2. Incorrect Tool Name Casing

Tool names are **PascalCase**. Using wrong casing will cause tools to not be recognized.

| Wrong | Correct |
|-------|---------|
| `read` | `Read` |
| `webfetch` | `WebFetch` |
| `web-fetch` | `WebFetch` |
| `BASH` | `Bash` |
| `glob` | `Glob` |

### 3. Invalid Name Characters

Skill and agent names only allow lowercase letters, digits, and hyphens.

| Invalid | Why | Valid Alternative |
|---------|-----|-------------------|
| `MySkill` | Uppercase | `my-skill` |
| `my_skill` | Underscore | `my-skill` |
| `my skill` | Space | `my-skill` |
| `my--skill` | Double hyphen | `my-skill` |
| `-my-skill` | Leading hyphen | `my-skill` |

### 4. Missing Description

While `description` is technically optional for skills, Claude Code uses it to understand when to apply the skill. **Always include a description.**

**Weak:**
```yaml
description: A helper skill
```

**Strong:**
```yaml
description: Generates unit tests for Python functions. Use when the user asks for tests or wants to improve test coverage.
```

### 5. Name Mismatch

The `name` field in frontmatter must match:
- **Skills:** The directory name
- **Agents:** The filename (without `.md`)

```
.claude/skills/my-skill/SKILL.md
                ^^^^^^^^
                name: my-skill  # Must match directory name

.claude/agents/my-agent.md
               ^^^^^^^^
               name: my-agent  # Must match filename
```

### 6. Using SKILL.md Filename for Agents

Agents use a different structure than skills:

| Skills | Agents |
|--------|--------|
| `.claude/skills/{name}/SKILL.md` | `.claude/agents/{name}.md` |
| Directory + SKILL.md file | Single markdown file |

---

## See Also

### Official Documentation

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) - Official skill format reference
- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents) - Official agent format reference

### Community Resources

- [Agent Skills Specification](https://agentskills.io/specification) - Extended specification and examples
