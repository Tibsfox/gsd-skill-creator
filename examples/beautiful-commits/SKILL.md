---
name: beautiful-commits
description: Crafts beautiful, professional git commit messages following Conventional Commits with semantic structure. Use when committing changes, writing commit messages, or when user mentions 'commit', 'git commit', 'commit message', or wants help with commits.
---

# Beautiful Git Commits

Guides creation of professional, semantic commit messages that are clear, meaningful, and follow industry best practices.

## The Anatomy of a Beautiful Commit

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Structure Rules

```yaml
Subject Line (Header):
  Format: <type>(<scope>): <subject>
  Max Length: 72 characters (50 preferred)
  Capitalization: Lowercase type, lowercase subject
  Punctuation: No period at end
  Tense: Imperative mood ("add" not "added" or "adds")

Body (Optional):
  Purpose: Explain WHY and WHAT, not HOW
  Wrap: 72 characters per line
  Separate: One blank line after subject

Footer (Optional):
  Purpose: Breaking changes, issue refs, co-authors, metadata
  Format: Token: Value or Token #123
  Examples: BREAKING CHANGE:, Fixes #123, Co-Authored-By:
```

## Commit Types

| Type | When to Use | Example |
|------|-------------|---------|
| **feat** | New feature for the user | `feat(auth): add password reset flow` |
| **fix** | Bug fix for the user | `fix(api): handle null response from webhook` |
| **docs** | Documentation only | `docs(readme): add installation instructions` |
| **style** | Code style/formatting (no logic change) | `style(ui): reformat button components with prettier` |
| **refactor** | Code change that neither fixes bug nor adds feature | `refactor(parser): extract validation to separate function` |
| **perf** | Performance improvement | `perf(db): add index on user.email for faster lookups` |
| **test** | Adding or fixing tests | `test(auth): add edge cases for JWT validation` |
| **build** | Build system or dependencies | `build(deps): upgrade react from 18.0 to 18.2` |
| **ci** | CI/CD configuration | `ci(actions): add test coverage reporting` |
| **chore** | Other changes (tooling, config) | `chore(lint): add eslint rule for unused vars` |
| **revert** | Revert a previous commit | `revert: feat(auth): add password reset flow` |

## Scope Guidelines

The scope specifies what part of the codebase is affected:

```yaml
Good Scopes (Specific):
  - Component/Module: auth, api, ui, db, parser
  - Feature Area: login, checkout, dashboard
  - File/Package: user-service, payment-gateway

Bad Scopes (Vague):
  - Too broad: app, code, project
  - Too specific: login-button-component-file
  - Inconsistent: sometimes "authentication", sometimes "auth"

Examples:
  feat(auth): add JWT middleware
  fix(checkout): handle expired payment methods
  docs(api): document rate limiting endpoints
  perf(parser): optimize regex compilation
```

## The Imperative Mood Test

**Rule:** Subject line should complete the sentence: "If applied, this commit will ___"

```yaml
✓ GOOD (Imperative):
  "If applied, this commit will add login functionality"
  → feat(auth): add login functionality

  "If applied, this commit will fix memory leak in parser"
  → fix(parser): fix memory leak in stream processing

  "If applied, this commit will update documentation"
  → docs(readme): update installation steps

✗ BAD (Past Tense):
  "If applied, this commit will added login functionality" ✗
  → feat(auth): added login functionality (WRONG)

✗ BAD (Present Tense):
  "If applied, this commit will adds login functionality" ✗
  → feat(auth): adds login functionality (WRONG)

✗ BAD (Gerund):
  "If applied, this commit will adding login functionality" ✗
  → feat(auth): adding login functionality (WRONG)
```

## Subject Line Patterns

### Good Subject Lines

```yaml
Clear and Specific:
  ✓ feat(auth): add password reset via email
  ✓ fix(api): handle 500 errors from payment gateway
  ✓ refactor(db): extract user queries to repository pattern
  ✓ perf(parser): reduce memory usage by 40% with streaming
  ✓ test(auth): add edge cases for expired tokens

Focused (One Thing):
  ✓ feat(ui): add dark mode toggle
  ✓ fix(checkout): prevent duplicate order submissions
  ✓ docs(api): add examples for authentication endpoints

Actionable Verbs:
  ✓ add, remove, update, fix, implement, optimize
  ✓ extract, rename, move, split, merge
  ✓ support, enable, allow, prevent
```

### Bad Subject Lines (Anti-Patterns)

```yaml
Too Vague:
  ✗ fix: bug fixes
  ✗ feat: new stuff
  ✗ update: changes
  ✗ refactor: improvements

No Context:
  ✗ fix: fix the thing
  ✗ feat: add feature
  ✗ docs: update docs

Past Tense:
  ✗ feat(auth): added login
  ✗ fix(api): fixed the bug
  ✗ docs: updated readme

Present Tense (3rd person):
  ✗ feat(auth): adds login
  ✗ fix(api): fixes the bug

Too Long:
  ✗ feat(auth): add a new comprehensive authentication system with JWT tokens, refresh tokens, and session management
  (88 chars, should be <72, preferably <50)

Multiple Things:
  ✗ feat(auth): add login, signup, and password reset
  (Should be 3 separate commits)

Emotional/Unprofessional:
  ✗ fix: finally fixed this annoying bug!!!
  ✗ feat: awesome new feature 🎉
  ✗ refactor: cleaned up the mess

Implementation Details:
  ✗ fix(api): change line 47 to use try/catch
  ✗ feat(ui): add <Button> component with props
  (Focus on WHAT/WHY, not HOW)
```

## Writing the Body

The body is **optional** but valuable for complex changes. Use it to explain:

- **Why** the change is needed (motivation)
- **What** problem it solves
- **How** it differs from previous behavior (if not obvious)
- **Context** or background information
- **Trade-offs** or alternatives considered

### Body Guidelines

```yaml
When to Add Body:
  - Change is non-obvious
  - Requires understanding of context
  - Multiple approaches were considered
  - Breaking change or significant impact
  - Complex bug fix with subtle cause

When to Skip Body:
  - Change is self-explanatory
  - Trivial updates (typo, formatting)
  - Commit message subject is sufficient

Format:
  - Wrap at 72 characters
  - Use imperative mood
  - Separate paragraphs with blank lines
  - Use bullet points for lists
```

### Good Body Examples

```
feat(api): add rate limiting to authentication endpoints

Implement rate limiting to prevent brute force attacks on login
and registration endpoints. Uses token bucket algorithm with
Redis for distributed state.

Limits:
- Login: 5 requests per minute per IP
- Registration: 3 requests per hour per IP
- Password reset: 2 requests per hour per email

Returns 429 Too Many Requests with Retry-After header when
limit is exceeded.
```

```
fix(parser): prevent memory leak in streaming parser

The parser was holding references to all processed nodes in
memory, causing OOM errors for large files. Changed to use
streaming approach that processes nodes and immediately
releases references.

Memory usage for 100MB file:
- Before: 2.5GB RAM (OOM crash)
- After: 150MB RAM (stable)

Fixes #1234
```

```
refactor(db): migrate from raw SQL to query builder

Previous implementation used string concatenation for SQL
queries, which is vulnerable to SQL injection and hard to
maintain. Migrated to Kysely query builder for type safety
and security.

This is a significant refactor touching all database queries,
but with 100% test coverage to ensure no behavioral changes.

BREAKING CHANGE: Database connection config format changed
from `{host, port, user, pass}` to `{connectionString}`.
Update .env files accordingly.
```

## Footer Metadata

### Breaking Changes

```yaml
Format:
  BREAKING CHANGE: <description>

Example:
  feat(api): change user endpoint response format

  Migrate from nested user object to flat structure for
  consistency with other endpoints.

  BREAKING CHANGE: /api/user response changed from
  {user: {id, name}} to {id, name}. Update client code
  to remove .user property access.
```

### Issue References

```yaml
Formats:
  Fixes #123          (closes issue/PR #123)
  Closes #456         (closes issue/PR #456)
  Resolves #789       (closes issue/PR #789)
  Refs #234           (references but doesn't close)
  See also #567       (related issue)

Examples:
  fix(auth): handle expired JWT tokens

  Tokens were not properly invalidated when expired, causing
  403 errors on refresh. Added expiry check to middleware.

  Fixes #892

---

  feat(ui): add dark mode toggle

  Implements user-requested dark theme with system preference
  detection and manual override.

  Closes #445
  Closes #502
  Refs #123
```

### Co-Authors

```yaml
Format:
  Co-Authored-By: Name <email@example.com>

Example:
  feat(parser): add support for nested expressions

  Implements recursive descent parser for handling arbitrarily
  nested expressions with proper precedence.

  Co-Authored-By: Alice Smith <alice@example.com>
  Co-Authored-By: Bob Jones <bob@example.com>
```

### Other Trailers

```yaml
Reviewed-By: Name <email>
Signed-Off-By: Name <email>
Acked-By: Name <email>
Cc: Name <email>
```

## Complete Examples

### Example 1: Simple Feature

```
feat(auth): add password reset flow

Implements email-based password reset with time-limited tokens.
Users receive reset link valid for 1 hour.

- Token stored in Redis with 1h TTL
- Email sent via SendGrid
- Rate limited to 2 requests/hour per email

Closes #234
```

### Example 2: Bug Fix

```
fix(checkout): prevent duplicate order creation

Race condition allowed multiple clicks on "Place Order" to
create duplicate orders. Added client-side button disable
and server-side idempotency key check.

Idempotency keys expire after 24 hours. Duplicate requests
within 24h return original order ID.

Fixes #789
```

### Example 3: Breaking Change

```
feat(api): migrate to v2 endpoints with versioned URLs

Add URL versioning to API for backward compatibility during
future changes. All endpoints now under /api/v2/ prefix.

Old /api/users endpoint → /api/v2/users
Old /api/products endpoint → /api/v2/products

BREAKING CHANGE: All API clients must update base URL from
/api/ to /api/v2/. Old endpoints will be deprecated in v3.0.

Migration guide: docs/api-v2-migration.md

Refs #445
```

### Example 4: Performance Improvement

```
perf(db): add composite index on user queries

Added composite index on (user_id, created_at) to optimize
common query pattern in activity feed.

Query time for feed load:
- Before: 2.4s (full table scan)
- After: 45ms (index scan)

95th percentile response time improved from 3.2s to 120ms.
```

### Example 5: Refactoring

```
refactor(auth): extract JWT logic to separate module

Moved JWT creation, validation, and refresh logic from
route handlers to dedicated auth/jwt.ts module. No
behavioral changes, just better separation of concerns.

Benefits:
- Easier to test in isolation
- Reusable across multiple routes
- Clearer responsibility boundaries

Test coverage maintained at 100% for all auth flows.
```

### Example 6: Multiple Co-Authors

```
feat(search): implement full-text search with PostgreSQL

Add full-text search capability using PostgreSQL's built-in
tsvector and tsquery features. Supports:

- Fuzzy matching with typo tolerance
- Relevance ranking with ts_rank
- Highlighting of matched terms
- Search across title, description, and tags

Performance tested with 1M records:
- Average query time: 35ms
- 99th percentile: 120ms

Co-Authored-By: Alice Chen <alice@example.com>
Co-Authored-By: Bob Wilson <bob@example.com>
Co-Authored-By: Carol Davis <carol@example.com>
```

## Atomic Commits

**Rule:** One logical change per commit.

```yaml
✓ GOOD (Atomic):
  Commit 1: feat(auth): add User model
  Commit 2: feat(auth): add login endpoint
  Commit 3: feat(auth): add JWT middleware
  Commit 4: test(auth): add auth integration tests

✗ BAD (Too Large):
  Commit 1: feat(auth): implement entire authentication system
  (Should be 4+ separate commits)

✗ BAD (Unrelated):
  Commit 1: fix(auth): fix login bug and add dark mode
  (Two unrelated changes, should be 2 commits)

Benefits of Atomic Commits:
  - Easy to review (small, focused changes)
  - Easy to revert (surgical rollback)
  - Clear history (each commit tells a story)
  - Easy to cherry-pick (independent changes)
```

## Commit Message Checklist

Before committing, verify:

```yaml
Structure:
  [ ] Type is valid (feat, fix, docs, etc.)
  [ ] Scope is specific and consistent
  [ ] Subject is <72 chars (preferably <50)
  [ ] Subject starts with lowercase
  [ ] Subject has no period at end
  [ ] Subject uses imperative mood
  [ ] One blank line between subject and body
  [ ] Body lines wrapped at 72 chars
  [ ] One blank line between body and footer

Content:
  [ ] Subject clearly describes WHAT changed
  [ ] Body (if present) explains WHY
  [ ] Body avoids implementation details (HOW)
  [ ] Commit is atomic (one logical change)
  [ ] Breaking changes are flagged
  [ ] Related issues are referenced

Quality:
  [ ] Passes imperative mood test
  [ ] Professional tone (no emotions, jokes)
  [ ] No spelling errors
  [ ] Accurate (describes actual changes)
```

## Workflow Integration

### When Writing Commits

1. **Review staged changes** to understand scope
2. **Determine type** (feat, fix, docs, etc.)
3. **Identify scope** (component, module, area)
4. **Draft subject** using imperative mood
5. **Add body** if change needs explanation
6. **Add footer** for breaking changes, issues, co-authors
7. **Run checklist** before committing

### Tools and Automation

```bash
# Git commit template
git config commit.template ~/.gitmessage.txt

# Commit message validation hook
# .git/hooks/commit-msg
#!/bin/sh
commit_msg=$(cat "$1")
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?: [a-z].{1,70}$"

if ! echo "$commit_msg" | head -1 | grep -Eq "$pattern"; then
  echo "ERROR: Commit message doesn't match Conventional Commits format"
  echo "Format: <type>(<scope>): <subject>"
  exit 1
fi

# Commitizen (interactive commit tool)
npm install -g commitizen
git cz  # Interactive commit message builder

# Commitlint (validate commits)
npm install -g @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
```

## Anti-Patterns to Avoid

```yaml
1. "WIP" Commits:
   ✗ "WIP: working on login"
   → Should be squashed before merging

2. "Fix typo" Commits:
   ✗ "fix typo", "fix another typo"
   → Should be squashed into original commit

3. Vague Subjects:
   ✗ "fix: fix bug"
   ✗ "update: changes"
   ✗ "refactor: improve code"

4. Essay-Length Subjects:
   ✗ "feat(auth): add comprehensive authentication system with JWT tokens, refresh tokens, session management, and password reset"
   → Move details to body

5. Emotional Language:
   ✗ "fix: finally fixed this annoying bug!!!"
   ✗ "feat: awesome new feature 🎉"
   → Keep it professional

6. Implementation Details in Subject:
   ✗ "fix(api): change line 47 to use try/catch"
   → Focus on WHAT, not HOW

7. Multiple Unrelated Changes:
   ✗ "feat(auth): add login and fix navbar bug and update docs"
   → Split into 3 commits

8. No Type/Scope:
   ✗ "add login feature"
   → Use: feat(auth): add login feature

9. Wrong Tense:
   ✗ "feat(auth): added login" (past)
   ✗ "feat(auth): adds login" (present)
   → Use: feat(auth): add login (imperative)

10. Merge Commit Messages:
    ✗ "Merge branch 'feature/login' into main"
    → Use squash merges or rebase for cleaner history
```

## Style Guide Summary

```yaml
Type:
  - Lowercase
  - One of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

Scope:
  - Lowercase
  - Parentheses: (scope)
  - Specific, consistent
  - Optional but recommended

Subject:
  - Lowercase first letter
  - Imperative mood
  - No period at end
  - <72 chars (50 preferred)

Body:
  - Optional
  - Wrap at 72 chars
  - Explain WHY and WHAT
  - Blank line after subject

Footer:
  - Optional
  - BREAKING CHANGE: for breaking changes
  - Fixes #123 for issue references
  - Co-Authored-By: for attribution
  - Blank line after body
```

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Git Documentation: Commit Messages](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project#_commit_guidelines)
- [How to Write a Git Commit Message](https://cbea.ms/git-commit/)

---

**Philosophy:** A beautiful commit is one that tells a clear story, is easy to understand months later, and enables confident code archaeology. Invest time in commit messages—they're documentation that lives forever in your git history.
