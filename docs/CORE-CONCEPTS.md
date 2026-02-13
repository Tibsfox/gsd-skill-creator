# Core Concepts

## Skills

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

## Skill Scopes

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

## Observations

The system observes your Claude Code sessions and stores pattern summaries in `.planning/patterns/`. Observations are:

- **Token-efficient** - Stores summaries, not full transcripts
- **Bounded** - Configurable retention (default: 90 days / 1000 sessions)
- **Append-only** - JSONL format for safe concurrent writes

Observation data drives:
- Skill suggestions based on recurring workflows
- Co-activation tracking for agent composition
- Feedback-driven skill refinement

## Agents

When skills frequently activate together (5+ co-activations over 7+ days), the system suggests combining them into composite agents stored in `.claude/agents/`.

Agents:
- Bundle related expertise for common workflows
- Follow Claude Code's agent format
- Can specify model, tools, and included skills
- Are auto-generated from skill clusters
