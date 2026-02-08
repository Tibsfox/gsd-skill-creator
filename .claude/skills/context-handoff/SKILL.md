---
name: context-handoff
description: Creates structured context handoff documents for session continuity. Use when ending a work session, switching context, handing off to another developer, or when user mentions 'handoff', 'context', 'session', 'continue later', 'pick up where I left off', 'what was I doing'.
---

# Context Handoff

Create comprehensive handoff documents that allow work to resume with zero context loss. Whether handing off to a future session, another developer, or a different AI assistant, the handoff document captures everything needed to continue immediately.

## When to Create a Handoff

| Situation | Urgency | What to Capture |
|-----------|---------|-----------------|
| End of work session | Normal | Full state, next steps, open questions |
| Switching to different task | Normal | Partial state, bookmark for return |
| Context window getting large | High | Everything needed to continue in fresh session |
| Handing off to another person | High | Full state plus rationale and gotchas |
| Before a long break | Normal | Full state, environment setup steps |
| After hitting a blocker | High | What was tried, what failed, theories |

---

## Handoff Document Template

```markdown
# Context Handoff: [Task/Feature Name]

**Created:** [date and time]
**Author:** [who created this]
**Status:** [in-progress | blocked | ready-for-review | paused]
**Priority:** [high | medium | low]

## What We Are Building

[One paragraph: what is the goal, why does it matter, and what does success look like.]

## Current State

### Completed
- [x] [Task that is done] -- [relevant file or commit]
- [x] [Task that is done] -- [relevant file or commit]

### In Progress
- [ ] [Current task] -- [how far along, what remains]

### Not Started
- [ ] [Future task]
- [ ] [Future task]

## Key Files

| File | Role | Status |
|------|------|--------|
| [absolute/path/to/file.ts] | [what it does] | [created/modified/needs-changes] |
| [absolute/path/to/test.ts] | [tests for what] | [passing/failing/not-written] |

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| [What was decided] | [Why] | [What else was considered] |

## Blockers and Open Questions

### Blockers
- **[Blocker title]:** [Description. What was tried. What might work.]

### Open Questions
- [Question that needs answering before continuing]
- [Question about design/approach]

## Environment State

### Prerequisites
- [Tool/dependency version required]
- [Service that needs to be running]

### How to Reproduce Current State
```bash
# Commands to get to where we left off
[relevant commands]
```

### Running Tests
```bash
[exact test command]
```

## What to Do Next

1. **[First action]** -- [specific details, not vague]
2. **[Second action]** -- [specific details]
3. **[Third action]** -- [specific details]

## Gotchas and Warnings

- [Something non-obvious that will trip you up]
- [A known issue that looks like a bug but is intentional]
- [A file that looks unused but is actually important]
```

---

## Task-Type-Specific Capture

Different types of work require different context to be preserved.

### Coding Task Handoff

Focus on: code state, test state, design decisions, technical debt.

```markdown
## Code State

### Branch
- Branch: `feature/user-auth`
- Base: `main` at commit `abc1234`
- Commits on branch: 3 (all passing CI)

### Architecture Decisions
- Chose JWT over sessions because [reason]
- Using middleware pattern for auth because [reason]
- Token refresh implemented as [approach]

### Test Coverage
- Unit tests: 12 passing, 2 failing (expected -- implementation not complete)
- Integration tests: not started
- Failing tests are in `src/auth/__tests__/refresh.test.ts` lines 45-67

### Technical Debt Created
- [ ] Hardcoded token expiry (should be configurable) -- `src/auth/config.ts:12`
- [ ] Error messages need i18n -- `src/auth/errors.ts`

### Dependencies Added
- `jose` v5.2.0 -- JWT signing/verification
- `@types/jose` -- already included in jose v5

### What the Code Does Right Now
1. User can sign up with email/password
2. User can log in and receive access + refresh tokens
3. Access token validation middleware works
4. Refresh token endpoint EXISTS but is not fully implemented (returns 501)
```

### Research Task Handoff

Focus on: findings so far, sources, evaluation criteria, gaps.

```markdown
## Research State

### Question
[What are we trying to figure out?]

### Findings So Far

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| [Option A] | [pros] | [cons] | [promising/rejected/needs-more-info] |
| [Option B] | [pros] | [cons] | [promising/rejected/needs-more-info] |

### Sources Reviewed
- [URL or document] -- [key takeaway]
- [URL or document] -- [key takeaway]

### Not Yet Investigated
- [Area that needs research]
- [Question that needs a source]

### Emerging Recommendation
[If one exists, what is it and what confidence level?]
```

### Debugging Task Handoff

Focus on: symptoms, what was tried, what was ruled out, theories.

```markdown
## Bug State

### Symptom
[Exact description of what goes wrong, when, and how to reproduce]

### Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Expected: X, Actual: Y]

### Environment
- OS: [version]
- Runtime: [version]
- Relevant dependency versions: [list]

### What Was Tried

| Attempt | Result | What It Told Us |
|---------|--------|-----------------|
| [Thing tried] | [Failed/Partial/Worked] | [Insight gained] |
| [Thing tried] | [Failed/Partial/Worked] | [Insight gained] |

### Ruled Out
- [Theory that was disproven and why]
- [Component that is NOT the problem and how we know]

### Current Theories (Ranked)
1. **[Most likely theory]** -- Evidence: [what supports this]
2. **[Second theory]** -- Evidence: [what supports this]

### Next Debugging Steps
1. [Specific thing to try next and what it will tell us]
2. [Specific thing to try next and what it will tell us]

### Relevant Logs / Stack Traces
```
[Exact error output, not paraphrased]
```
```

---

## File Path Preservation

Always use absolute paths in handoff documents. Relative paths become ambiguous when context changes.

### Rules

| Rule | Example |
|------|---------|
| Use absolute paths | `/home/user/project/src/auth/login.ts` |
| Include line numbers for specific locations | `/home/user/project/src/auth/login.ts:42-67` |
| Reference files that exist | Verify paths before writing them |
| Note files that were deleted | "Removed `/path/to/old-file.ts` (replaced by ...)" |
| Group by directory | Organize file lists by directory structure |

### Path Verification

Before finalizing a handoff document, verify that referenced files exist.

```bash
# Check all referenced files
for f in path/to/file1.ts path/to/file2.ts; do
  [ -f "$f" ] && echo "OK: $f" || echo "MISSING: $f"
done
```

---

## Decision Log Format

Decisions lose their rationale over time. Capture why, not just what.

```markdown
### Decision: [Short Title]

**Date:** [when]
**Context:** [what situation prompted this decision]
**Decision:** [what was decided]
**Rationale:** [why this option was chosen]
**Alternatives:**
- [Alternative A] -- rejected because [reason]
- [Alternative B] -- rejected because [reason]
**Consequences:** [what this decision implies for future work]
**Revisit if:** [conditions that would make us reconsider]
```

### Example

```markdown
### Decision: Use SQLite for Local Development

**Date:** 2024-03-15
**Context:** Need a database for local dev that doesn't require Docker or cloud services.
**Decision:** Use SQLite for development, PostgreSQL for staging/production.
**Rationale:** Reduces setup friction. Our ORM abstracts most SQL differences.
**Alternatives:**
- PostgreSQL everywhere -- rejected because requires Docker/install for every dev
- In-memory only -- rejected because can't inspect data between runs
**Consequences:** Must test with PostgreSQL in CI. Cannot use PostgreSQL-specific features in app code.
**Revisit if:** We need PostgreSQL-specific features (JSON operators, full-text search, advisory locks).
```

---

## Blocker Tracking

Document blockers with enough detail that someone else can unblock them.

```markdown
### Blocker: [Title]

**Severity:** [hard-block | soft-block | inconvenience]
**Blocking:** [what task(s) cannot proceed]
**Description:** [what the blocker is]
**Attempted solutions:**
1. [What was tried] -- Result: [what happened]
2. [What was tried] -- Result: [what happened]
**Possible resolutions:**
- [Option A with estimated effort]
- [Option B with estimated effort]
**Who can help:** [person, team, or resource that might have the answer]
```

### Severity Definitions

| Severity | Meaning | Action |
|----------|---------|--------|
| Hard block | Cannot continue any related work | Escalate immediately |
| Soft block | Can work around it temporarily | Schedule resolution, document workaround |
| Inconvenience | Slows work but doesn't stop it | Note for future improvement |

---

## Recovery Instructions

The handoff must enable someone to resume without asking questions.

### Minimum Viable Recovery

```markdown
## Quick Start (Resume Work)

### 1. Get to the right state
```bash
git checkout feature/user-auth
git pull origin feature/user-auth
npm install
```

### 2. Verify the environment
```bash
cp .env.example .env  # Then fill in values
npm test              # Should see 12 passing, 2 failing (expected)
npm run dev           # App should start on port 3000
```

### 3. Pick up where we left off
Open `src/auth/refresh.ts` -- the `handleRefreshToken` function at line 34
is where implementation stopped. The function signature and tests exist;
the body needs to be filled in.

### 4. Run the relevant tests
```bash
npm test -- --grep "refresh token"
```
```

---

## Quality Checklist

Before considering a handoff document complete:

- [ ] Task status is clearly stated (in-progress, blocked, done)
- [ ] All modified files are listed with absolute paths
- [ ] Decisions include rationale, not just the choice
- [ ] Blockers include what was tried and possible resolutions
- [ ] Next steps are specific actions, not vague goals
- [ ] Environment setup instructions are included
- [ ] Test commands are exact (copy-pasteable)
- [ ] Branch name and base commit are recorded
- [ ] Open questions are explicitly listed
- [ ] Gotchas and warnings are documented
- [ ] Someone unfamiliar with the work could resume from this document

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| "Continue the auth work" | Too vague to act on | Specify exact file, function, and what remains |
| Relative paths | Ambiguous in different contexts | Always use absolute paths |
| Missing rationale | Next person re-litigates decisions | Always capture why, not just what |
| No reproduction steps | Cannot verify current state | Include exact commands to get to current state |
| Outdated handoff | Document doesn't match reality | Update handoff as last action before stopping |
| Only listing what is done | No guidance on what to do next | Always include prioritized next steps |
| Assuming shared context | "You know the thing with the API" | Write as if the reader knows nothing about recent work |
| No test commands | Reader has to figure out how to verify | Include exact test commands with expected output |
