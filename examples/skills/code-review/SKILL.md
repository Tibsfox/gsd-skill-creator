---
name: code-review
description: Reviews code for bugs, style issues, and best practices. Use when reviewing pull requests, checking code quality, or when user mentions 'review', 'PR', 'code review', 'feedback on code'.
---

# Code Review

Perform thorough code reviews that catch bugs, improve code quality, and share knowledge across the team.

## Review Checklist

### 1. Correctness

| Check | What to Look For |
|-------|------------------|
| Logic errors | Incorrect conditions, wrong operators, inverted logic |
| Edge cases | Empty arrays, null values, boundary conditions |
| Off-by-one errors | Loop bounds, array indices, range endpoints |
| Resource leaks | Unclosed files, connections, event listeners |
| Race conditions | Shared state, async operations, concurrent access |
| Error handling | Missing try/catch, unhandled promise rejections |

### 2. Security

| Check | What to Look For |
|-------|------------------|
| Input validation | User input sanitization, type checking |
| SQL injection | String concatenation in queries, unsanitized parameters |
| XSS vulnerabilities | Unescaped HTML output, innerHTML usage |
| Authentication | Missing auth checks, insecure token handling |
| Authorization | Access control bypasses, privilege escalation |
| Secrets exposure | Hardcoded credentials, API keys in code |
| CSRF protection | Missing tokens, insecure cookie settings |

### 3. Performance

| Check | What to Look For |
|-------|------------------|
| N+1 queries | Queries in loops, missing eager loading |
| Unnecessary work | Repeated calculations, redundant operations |
| Memory issues | Large arrays, memory leaks, unbounded caches |
| Blocking operations | Synchronous I/O, long-running computations |
| Missing indexes | Slow database queries, full table scans |
| Inefficient algorithms | O(n^2) where O(n) is possible |

### 4. Maintainability

| Check | What to Look For |
|-------|------------------|
| Clear naming | Descriptive variable and function names |
| Single responsibility | Functions doing too much, god classes |
| DRY violations | Copy-pasted code, repeated patterns |
| Comments | Missing docs for complex logic, outdated comments |
| Code organization | Logical file structure, proper separation |
| Test coverage | Missing tests for new functionality |

## Severity Levels

Organize feedback by severity to help authors prioritize:

| Level | Definition | Action Required |
|-------|------------|-----------------|
| **CRITICAL** | Security vulnerability, data loss risk, crashes | Must fix before merge |
| **MAJOR** | Bug, significant performance issue, broken feature | Should fix before merge |
| **MINOR** | Code smell, minor improvement, non-blocking issue | Consider fixing |
| **STYLE** | Formatting, naming conventions, preferences | Optional |

## Review Format

Structure your review comments clearly:

```markdown
### [SEVERITY] Brief description

**File:** path/to/file.ts:42

**Issue:**
Description of what's wrong or could be improved.

**Suggestion:**
Proposed solution or alternative approach.

**Code:**
```typescript
// Current
const result = items.filter(x => x.active == true);

// Suggested
const result = items.filter(item => item.active);
```
```

## Common Patterns to Flag

### Anti-Patterns

| Pattern | Problem | Better Approach |
|---------|---------|-----------------|
| `== true` or `== false` | Redundant comparison | Use boolean directly |
| `catch(e) {}` | Swallowing errors | Log or rethrow |
| Magic numbers | Unclear meaning | Use named constants |
| Deep nesting | Hard to follow | Early returns, extract functions |
| Huge functions | Too many responsibilities | Split into smaller functions |

### Code Smells

- **Long parameter lists:** Consider using an options object
- **Boolean parameters:** Often indicate function should be split
- **Commented-out code:** Delete it, version control has history
- **TODO without issue:** Link to tracking issue or remove

## Positive Feedback

Don't just point out problems. Acknowledge good code:

- Clean abstractions
- Well-written tests
- Clear documentation
- Thoughtful error handling
- Performance optimizations

## Review Questions

Ask yourself before approving:

1. Would I be comfortable debugging this code at 2am?
2. Will a new team member understand this in 6 months?
3. Does this handle errors gracefully?
4. Are the tests meaningful and maintainable?
5. Does this follow project conventions?
