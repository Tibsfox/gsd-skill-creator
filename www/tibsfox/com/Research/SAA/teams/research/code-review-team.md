# Code Review Team

Multi-perspective code review with specialized reviewers that analyze code from four distinct angles: correctness, security, performance, and maintainability. A coordinator synthesizes all findings into a prioritized, actionable review.

## When to Use This Team

- Pull request review where thoroughness matters more than speed
- Pre-merge review of critical paths (auth, payments, data pipelines)
- Codebase audit of an unfamiliar or inherited project
- Compliance-driven review requiring documented security analysis

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| review-coordinator | Leader | Synthesizes findings, resolves conflicts, prioritizes actions | Read, Glob, Grep | sonnet |
| correctness-reviewer | Worker | Logic errors, edge cases, race conditions, type safety | Read, Glob, Grep | sonnet |
| security-reviewer | Worker | OWASP patterns, auth flaws, injection, secret exposure | Read, Glob, Grep | sonnet |
| performance-reviewer | Worker | Algorithmic complexity, query efficiency, memory, bundle size | Read, Glob, Grep | sonnet |
| maintainability-reviewer | Worker | Naming, SRP, DRY, test coverage, documentation | Read, Glob, Grep | sonnet |

## Safety Properties

This team is designed to be the safest possible topology:

- **All members are read-only.** No member has Write, Edit, or Bash tools. The team cannot modify any files.
- **No side effects.** The team produces review findings as output text only.
- **Parallel-safe.** All four workers can analyze the same codebase simultaneously without conflict.
- **Deterministic scope.** Workers review only what the coordinator assigns; they cannot expand scope autonomously.

## How It Works

1. The **review-coordinator** receives the review request (files, PR diff, or directory scope).
2. The coordinator delegates specific files or concerns to each worker.
3. Workers analyze their assigned scope and report findings with severity ratings.
4. The coordinator collects all findings, resolves any conflicting recommendations (e.g., "add caching" vs. "keep it simple"), and produces a unified review.
5. The final output is a prioritized list of action items grouped by severity.

## Example Usage Scenario

**Input:** "Review the authentication module in src/auth/ before we ship v2.0"

**Flow:**
- correctness-reviewer checks token validation logic, session expiry edge cases, refresh token rotation
- security-reviewer checks for timing attacks, token storage, CSRF protection, secret handling
- performance-reviewer checks token caching strategy, database round-trips per auth check
- maintainability-reviewer checks test coverage, error message clarity, separation of concerns
- review-coordinator produces a single report: 2 critical (security), 3 moderate (correctness), 5 minor (maintainability)

## Integration Notes

- This team pairs well with a CI pipeline that triggers review on PR creation
- The read-only constraint means it can safely run against production code without risk
- For teams that need the review to also apply fixes, consider pairing this team's output with a separate fix-application agent
- Workers use sonnet for cost efficiency; the leader also uses sonnet since synthesis does not require opus-level reasoning for this domain

---

## Team Configuration

```json
{
  "name": "code-review-team",
  "description": "Multi-perspective code review with specialized reviewers for correctness, security, performance, and maintainability. All members are read-only for maximum safety.",
  "topology": "leader-worker",
  "members": [
    {
      "name": "review-coordinator",
      "role": "leader",
      "description": "Synthesizes findings from all reviewers, resolves conflicting recommendations, prioritizes action items by severity, and produces a unified review summary with clear next steps.",
      "tools": ["Read", "Glob", "Grep"],
      "model": "sonnet"
    },
    {
      "name": "correctness-reviewer",
      "role": "worker",
      "description": "Reviews code for logic errors, edge cases, off-by-one errors, race conditions, null/undefined handling, incorrect type coercions, and broken invariants. Focuses on whether the code does what it claims to do.",
      "tools": ["Read", "Glob", "Grep"],
      "model": "sonnet"
    },
    {
      "name": "security-reviewer",
      "role": "worker",
      "description": "Reviews code for OWASP Top 10 patterns, input validation gaps, authentication and authorization flaws, secret exposure, injection vulnerabilities, insecure deserialization, and missing security headers.",
      "tools": ["Read", "Glob", "Grep"],
      "model": "sonnet"
    },
    {
      "name": "performance-reviewer",
      "role": "worker",
      "description": "Reviews code for algorithmic complexity issues, inefficient database queries, N+1 problems, unnecessary re-renders, memory leaks, bundle size impact, and missing caching opportunities.",
      "tools": ["Read", "Glob", "Grep"],
      "model": "sonnet"
    },
    {
      "name": "maintainability-reviewer",
      "role": "worker",
      "description": "Reviews code for naming clarity, single responsibility violations, DRY violations, test coverage gaps, missing documentation, excessive coupling, and inconsistency with project conventions.",
      "tools": ["Read", "Glob", "Grep"],
      "model": "sonnet"
    }
  ]
}
```
