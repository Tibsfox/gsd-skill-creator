# Example Skills

This directory contains example skills demonstrating proper skill authoring patterns. Each example solves a real problem and can be copied and adapted for your own use.

## Available Examples

### General Skills

| Skill | Domain | Use Case |
|-------|--------|----------|
| [git-commit](git-commit/SKILL.md) | Git | Conventional commit messages |
| [code-review](code-review/SKILL.md) | Code Quality | PR review checklists |
| [test-generator](test-generator/SKILL.md) | Testing | Test case generation |
| [typescript-patterns](typescript-patterns/SKILL.md) | TypeScript | Best practices and patterns |

### GSD-Focused Examples

| Skill/Agent | Type | Use Case |
|-------------|------|----------|
| [gsd-explain](gsd-explain/SKILL.md) | Skill | Explains GSD workflows before execution |
| [gsd-preflight](gsd-preflight/SKILL.md) | Skill | Validates GSD artifacts pre-workflow |
| [gsd-health-checker](gsd-health-checker/AGENT.md) | Agent | Pre-flight health checks for GSD |

**Note:** These GSD-focused examples demonstrate **complementary** skills and agents that enhance GSD workflows without replacing core GSD functionality. They show:
- How to build skills that explain existing tools
- How to create validation layers for artifact integrity
- How to design agents that integrate as quality gates

## Key Patterns Demonstrated

### 1. Effective Descriptions

All examples use the "Use when..." pattern with specific trigger keywords:

```yaml
# GOOD - activates reliably
description: Generates conventional commit messages. Use when committing changes,
  writing commit messages, or when user mentions 'commit', 'conventional commits'.

# BAD - unreliable activation
description: Helps with git commits
```

The description field is how Claude Code determines when to apply a skill. Vague descriptions lead to unreliable activation (testing shows proper descriptions can improve activation from 20% to 90%).

### 2. Domain Separation

Examples are chosen to avoid semantic overlap:
- **git-commit:** Git workflow only
- **code-review:** Code quality/PR process
- **test-generator:** Testing patterns
- **typescript-patterns:** Language-specific advice

Each skill addresses a distinct concern. This prevents conflicts where multiple skills try to activate for the same user request.

### 3. Actionable Content

Each skill provides concrete, actionable guidance:
- Tables for quick reference
- Code examples for patterns
- Checklists for processes

## Using These Examples

### Copy to Your Project

```bash
# Copy an example to your project
cp -r examples/git-commit ~/.claude/skills/

# Or for project-level skills
cp -r examples/git-commit .claude/skills/
```

### Validate After Copying

```bash
skill-creator validate git-commit
```

### Customize

Edit the skill to match your team's conventions. The format allows customization while maintaining activation reliability.

## Verifying No Conflicts

These examples were designed to avoid conflicts. Verify with:

```bash
# From project root
skill-creator detect-conflicts --project examples/
```

Expected: No high-severity conflicts between examples.

## Creating Your Own Skills

Use these examples as templates:

1. **Copy** an example that's similar to what you want to build
2. **Rename** the directory to match your skill name
3. **Update** the `name` field in frontmatter to match the directory name
4. **Revise** the `description` field with your specific "Use when..." triggers
5. **Replace** the content with your skill's guidance
6. **Validate** with `skill-creator validate your-skill-name`
7. **Test** activation with `skill-creator test generate your-skill-name`

## See Also

- [CLI Reference](../docs/CLI.md) - Full command documentation
- [OFFICIAL-FORMAT.md](../docs/OFFICIAL-FORMAT.md) - Skill format specification
- [Tutorials](../docs/tutorials/) - Step-by-step guides
