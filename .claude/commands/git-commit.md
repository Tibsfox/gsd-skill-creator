---
name: git-commit
description: Generates conventional commit messages following Angular format. Use when committing changes, writing commit messages, or when user mentions 'commit', 'conventional commits', 'commit message'.
---

# Conventional Commit Messages

Generate commit messages that follow the Conventional Commits specification for clear, consistent version history.

## Format

```
type(scope): description

[optional body]

[optional footer]
```

## Commit Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace, no logic changes |
| `refactor` | Code change that neither fixes nor adds features |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or external dependencies |
| `ci` | CI/CD configuration changes |
| `chore` | Other maintenance tasks |
| `revert` | Reverting a previous commit |

## Scope Examples

The scope provides additional context about what part of the codebase changed:

- `feat(auth)`: Authentication-related feature
- `fix(api)`: Bug fix in API layer
- `docs(readme)`: README documentation
- `style(lint)`: Linting configuration
- `refactor(core)`: Core module restructure

## Guidelines

### Keep the Subject Line Short
- Under 72 characters
- Use imperative mood ("add" not "added")
- No period at the end

### Body for Context
- Explain **why**, not just what
- Wrap at 72 characters
- Blank line between subject and body

### Footer for Metadata
- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`

## Examples

### Simple Feature
```
feat(auth): add password reset functionality
```

### Bug Fix with Issue Reference
```
fix(api): handle null response from user endpoint

The /users/:id endpoint could return null for deleted users,
causing a crash in the profile component.

Closes #456
```

### Breaking Change
```
feat(api): change authentication to JWT

Migrate from session-based auth to JWT tokens for better
scalability and stateless operation.

BREAKING CHANGE: All API clients must now include JWT token
in Authorization header. Session cookies no longer accepted.
```

### Documentation Update
```
docs(readme): update installation instructions

Add troubleshooting section for common npm issues
and clarify Node.js version requirements.
```

## Quick Reference

| Element | Rule |
|---------|------|
| Type | Required, lowercase |
| Scope | Optional, lowercase, in parentheses |
| Description | Required, imperative mood, no period |
| Body | Optional, explains why |
| Footer | Optional, issue refs or BREAKING CHANGE |
