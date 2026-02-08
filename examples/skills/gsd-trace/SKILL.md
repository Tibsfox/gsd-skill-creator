---
name: gsd-trace
description: Traces the history of decisions and requirements through GSD artifacts. Activates when user asks "why did we...", "what happened to...", "when did we decide...", or mentions 'decision history', 'requirement trace', 'archaeology'.
---

# GSD Decision Archaeology

Traces the evolution of decisions, requirements, and architectural choices through GSD artifacts, providing context for why things are the way they are.

## When to Use

Activate when the user:
- Asks "why did we decide X?"
- Wants to know "what happened to requirement Y?"
- Questions "when did we change approach Z?"
- Mentions "decision history", "requirement tracing", or "archaeology"
- Needs context on past choices before making new decisions

## What This Skill Does

Excavates the GSD artifact timeline to reconstruct:
- **Decision chains** - How one decision led to another
- **Requirement evolution** - How requirements changed from initial idea to implementation
- **Phase context** - Why phases were structured a certain way
- **Abandoned approaches** - What was tried and why it was discarded
- **Commit archaeology** - Linking decisions to actual code changes

## Tracing Methodology

### 1. Artifact Timeline Reconstruction

Build a chronological view from:

```yaml
Sources (in order of authority):
  1. PROJECT.md Key Decisions table
  2. STATE.md Session Continuity entries
  3. ROADMAP.md phase goals and success criteria
  4. Phase CONTEXT.md files
  5. Phase RESEARCH.md files
  6. Plan SUMMARY.md outcomes
  7. Git commit messages
  8. Archived milestone documents

Timeline Format:
  [Date] [Source] [Event Type] [Content]

  2026-01-15 PROJECT.md DECISION "Use JWT over sessions"
  2026-01-16 02-CONTEXT.md CONSTRAINT "Must support mobile apps"
  2026-01-18 02-RESEARCH.md FINDING "Sessions incompatible with React Native"
  2026-01-20 02-01-PLAN.md TASK "Implement JWT authentication"
  2026-01-21 git COMMIT "feat(02-01): JWT auth endpoints"
  2026-01-22 02-01-SUMMARY.md OUTCOME "JWT auth working, 15ms token validation"
```

### 2. Decision Chain Analysis

Trace backwards from a decision to understand causality:

```
Query: "Why did we use JWT instead of sessions?"

Chain:
  ┌─────────────────────────────────────────────────┐
  │ DECISION: Use JWT for authentication           │
  │ Source: PROJECT.md Key Decisions                │
  │ Date: 2026-01-15                                │
  │ Rationale: "Mobile app support requires         │
  │             stateless auth"                      │
  └─────────────────────────────────────────────────┘
                        ↑
                        │ Led to this decision
                        │
  ┌─────────────────────────────────────────────────┐
  │ CONSTRAINT: Must support React Native           │
  │ Source: 02-CONTEXT.md                           │
  │ Date: 2026-01-16                                │
  │ Context: "User wants mobile-first experience"   │
  └─────────────────────────────────────────────────┘
                        ↑
                        │ Motivated by
                        │
  ┌─────────────────────────────────────────────────┐
  │ REQUIREMENT: REQ-003 Mobile App                 │
  │ Source: REQUIREMENTS.md                         │
  │ Date: 2026-01-10                                │
  │ Original: "Users should access from phones"     │
  └─────────────────────────────────────────────────┘
                        ↑
                        │ Derived from
                        │
  ┌─────────────────────────────────────────────────┐
  │ VISION: "Accessible anywhere, anytime"          │
  │ Source: PROJECT.md What This Is                 │
  │ Date: 2026-01-05                                │
  └─────────────────────────────────────────────────┘

Answer:
JWT was chosen because the core vision required mobile accessibility,
which translated to REQ-003, which constrained us to stateless auth
patterns, making JWT the natural choice over session-based auth.
```

### 3. Requirement Evolution Tracking

Show how a requirement changed over time:

```
Trace: REQ-015 "Real-time notifications"

Timeline:
  2026-01-05  Initial vision: "Users should know immediately when things happen"
  2026-01-08  Formalized as REQ-015 in REQUIREMENTS.md
  2026-01-12  Research phase: Evaluated WebSockets, SSE, polling
  2026-01-14  DECISION: "Use WebSockets for <100 users, polling for >100"
  2026-01-20  Phase 5 planned: "Real-time notification system"
  2026-01-25  Execution: Implemented WebSocket server
  2026-01-27  BLOCKER: "WebSocket library incompatible with hosting platform"
  2026-01-28  DECISION: "Pivot to SSE (Server-Sent Events)"
  2026-01-30  Re-execution: Replaced WebSocket with SSE
  2026-02-01  VERIFICATION: "Notifications working, <500ms latency"
  2026-02-03  VALIDATED: Moved to "Validated Requirements" in PROJECT.md

Status: SHIPPED (but not as originally planned)
Key Pivot: WebSocket → SSE due to hosting constraints
Learning: "Always verify library compatibility with deployment environment"
```

### 4. Abandoned Approach Archaeology

Discover what was tried and discarded:

```
Query: "Why aren't we using GraphQL?"

Excavation:
  ┌─────────────────────────────────────────────────┐
  │ 2026-01-10: GraphQL mentioned in initial vision │
  │ Source: PROJECT.md (archived v1.0)              │
  └─────────────────────────────────────────────────┘
                        ↓
  ┌─────────────────────────────────────────────────┐
  │ 2026-01-12: Research phase explored GraphQL     │
  │ Source: 03-RESEARCH.md                          │
  │ Findings:                                       │
  │   Pros: Flexible queries, type safety           │
  │   Cons: Learning curve, caching complexity      │
  └─────────────────────────────────────────────────┘
                        ↓
  ┌─────────────────────────────────────────────────┐
  │ 2026-01-14: Decision made to use REST           │
  │ Source: PROJECT.md Key Decisions                │
  │ Rationale:                                      │
  │   "Team has REST expertise, GraphQL adds        │
  │    unnecessary complexity for v1.0 scope"       │
  │ Outcome:                                        │
  │   "GraphQL deferred to v2.0, REST for MVP"      │
  └─────────────────────────────────────────────────┘

Answer:
GraphQL was considered during Phase 3 research but deliberately
deferred to v2.0. The decision prioritized shipping v1.0 faster
with familiar technology (REST) over adopting GraphQL's learning
curve. This is documented in PROJECT.md Key Decisions table.
```

### 5. Phase Structure Rationale

Explain why phases are organized as they are:

```
Query: "Why is authentication Phase 4, not Phase 2?"

Analysis:
  ┌─────────────────────────────────────────────────┐
  │ ROADMAP.md Phase Structure:                     │
  │   Phase 1: Project setup                        │
  │   Phase 2: Database models                      │
  │   Phase 3: CRUD endpoints (public)              │
  │   Phase 4: Authentication ← Query target        │
  │   Phase 5: Protected routes                     │
  └─────────────────────────────────────────────────┘

Rationale:
  1. Phase 2 creates User model (dependency for auth)
  2. Phase 3 builds public API surface (testable without auth)
  3. Phase 4 adds auth (can test against existing endpoints)
  4. Phase 5 protects routes (requires working auth)

Source: ROADMAP.md Phase 4 Success Criteria
  "Auth middleware integrates with existing Phase 3 endpoints"

Design Pattern: Build core functionality first, secure it later
Benefits: Faster iteration during development, easier testing

This is a conscious "security-last" approach for MVP, documented
in PROJECT.md Constraints: "Auth deferrable to unblock core features"
```

## Trace Query Patterns

### Pattern 1: Decision Rationale

```
User: "Why did we choose PostgreSQL over MongoDB?"

Process:
  1. Search PROJECT.md Key Decisions for "PostgreSQL" or "MongoDB"
  2. If found, return Decision + Rationale + Outcome
  3. If not found, search RESEARCH.md files for database evaluations
  4. Cross-reference with REQUIREMENTS.md (what drove the choice?)
  5. Check git commits for database setup (implementation evidence)

Output:
  Decision: PostgreSQL selected
  Date: 2026-01-14
  Rationale: "Need ACID transactions for payment processing (REQ-023)"
  Alternatives Considered: MongoDB (rejected: no multi-document transactions)
  Source: PROJECT.md Key Decisions, 04-RESEARCH.md
  Evidence: git commit abc123f "feat(04-01): setup PostgreSQL with Prisma"
```

### Pattern 2: Requirement Status

```
User: "What happened to the admin dashboard requirement?"

Process:
  1. Search REQUIREMENTS.md for "admin dashboard"
  2. Check status: Validated / Active / Out of Scope
  3. If Out of Scope, find when it was descoped
  4. Search STATE.md Session Continuity for descoping decision
  5. Check milestones/ for historical requirement lists

Output:
  Requirement: REQ-008 "Admin Dashboard"
  Current Status: Out of Scope
  Original Priority: Should Have
  Descoped: 2026-01-20 (during v1.0 planning)
  Reason: "Scope reduced to hit v1.0 deadline, deferred to v1.1"
  Source: PROJECT.md Requirements (Out of Scope section)
  Alternative: "Admin features added to main UI with role checks"
```

### Pattern 3: Phase Outcome

```
User: "Did we actually build the caching layer in Phase 7?"

Process:
  1. Read ROADMAP.md Phase 7 goal and deliverables
  2. Check phase status (⏳, ✓, →)
  3. Read all 07-XX-SUMMARY.md files
  4. Cross-check with git commits referencing Phase 7
  5. Verify success criteria were met

Output:
  Phase 7: "Performance Optimization (Caching)"
  Status: ✓ Complete
  Plans Executed:
    07-01: Redis setup → SUMMARY: "Redis configured, 30s TTL"
    07-02: Cache middleware → SUMMARY: "Response caching working"
    07-03: Invalidation → SUMMARY: "Cache invalidates on POST/PUT/DELETE"

  Success Criteria:
    ✓ API response time <100ms (measured: 68ms avg)
    ✓ Cache hit rate >60% (measured: 73%)
    ✓ Invalidation working (verified in 07-03-SUMMARY.md)

  Evidence: git commits [abc123f, def456g, ghi789h]
  Answer: YES, caching layer fully implemented and verified
```

### Pattern 4: Architectural Evolution

```
User: "How did our API design change from v1.0 to v1.5?"

Process:
  1. Read milestones/v1.0-ROADMAP.md
  2. Read milestones/v1.5-ROADMAP.md
  3. Compare phase goals and deliverables
  4. Extract architectural changes from PROJECT.md Key Decisions
  5. Summarize evolution

Output:
  v1.0 (2026-01-05 → 2026-02-01):
    - REST API with 5 endpoints
    - SQLite database (single-user)
    - Session-based auth
    - Synchronous processing

  v1.5 (2026-02-05 → 2026-03-15):
    - REST API expanded to 18 endpoints
    - PostgreSQL (multi-tenant)
    - JWT auth (mobile support)
    - Background job queue (async processing)
    - API versioning (/v1/, /v2/ routes)

  Key Architectural Shifts:
    1. SQLite → PostgreSQL (scalability)
    2. Sessions → JWT (mobile compatibility)
    3. Sync → Async (long-running tasks)
    4. API versioning added (breaking changes managed)

  Driving Forces:
    - REQ-042: Multi-tenant support (motivated DB change)
    - REQ-038: Mobile app (motivated JWT)
    - REQ-051: Background exports (motivated job queue)
```

### Pattern 5: Blocker Resolution

```
User: "What was the Phase 8 blocker and how did we fix it?"

Process:
  1. Search STATE.md for "Phase 8" and "blocker"
  2. Read ROADMAP.md Phase 8 notes
  3. Check Session Continuity for blocker resolution
  4. Read affected plan SUMMARY files
  5. Find git commits related to the fix

Output:
  Blocker: "OAuth provider rate-limiting during dev"
  Discovered: 2026-02-18 (during 08-03-PLAN execution)
  Impact: Could not complete OAuth integration testing

  Resolution Path:
    2026-02-18: Blocker recorded in STATE.md
    2026-02-19: Created 08-04-PLAN "Mock OAuth for development"
    2026-02-20: Implemented mock OAuth server (git: abc123f)
    2026-02-21: Resumed 08-03-PLAN with mock provider
    2026-02-22: Phase 8 completed successfully

  Lesson Learned:
    "Always have dev/mock versions of external dependencies"
    (Added to PROJECT.md Key Decisions as design principle)
```

## Trace Report Format

```markdown
# Decision Trace Report

**Query:** [User's question]
**Traced:** [Date and time]
**Artifacts Analyzed:** [List of files consulted]

---

## Timeline

[Chronological sequence of events]

---

## Decision Chain

[Causal relationship diagram]

---

## Key Documents

### PROJECT.md Key Decisions

> [Relevant excerpt]

### REQUIREMENTS.md

> [Relevant requirements]

### Phase Context

> [Relevant CONTEXT.md or RESEARCH.md excerpts]

### Implementation Evidence

- Commit `abc123f`: [Commit message]
- Plan Summary: [Relevant SUMMARY.md excerpt]

---

## Answer

[Direct answer to user's query]

---

## Related Decisions

[Other decisions that might be relevant]

---

## Lessons Learned

[Any retrospective insights captured in artifacts]
```

## Integration with GSD

This skill **complements** GSD by:
- **Surfacing historical context** - Helps users understand past decisions before making new ones
- **Preventing repeated mistakes** - Shows what was tried and why it didn't work
- **Validating assumptions** - Checks if current understanding matches historical reality
- **Onboarding teammates** - Reconstructs project evolution for new contributors
- **Decision documentation** - Demonstrates value of GSD's artifact discipline

It **does not replace** GSD:
- No workflow orchestration
- No artifact modification
- Purely read-only analysis of existing GSD state
- Relies on GSD artifacts being complete and accurate

## Usage Examples

### Example 1: Understanding a Past Decision

```
User: "Why did we decide to use Prisma instead of TypeORM?"

Skill activates → Traces decision:

Decision Trace: Database ORM Selection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Timeline:
  2026-01-10: Research phase explores ORMs
  2026-01-12: Decision made for Prisma
  2026-01-15: Prisma implemented in Phase 4

Decision Chain:

  REQ-025: "Type-safe database queries"
      ↓
  04-RESEARCH.md: Evaluated Prisma, TypeORM, Kysely
      ↓
  PROJECT.md Decision: "Prisma for type safety + migrations"

Rationale:
  "Prisma chosen for:
   - Generated types from schema (type safety)
   - Built-in migration system
   - Better DX with autocomplete

   TypeORM rejected:
   - Decorator syntax too verbose
   - Migration system less reliable
   - Team preference for Prisma's approach"

Source: PROJECT.md Key Decisions (2026-01-12)
Evidence: git commit abc123f "feat(04-01): setup Prisma"

Answer: Prisma was selected over TypeORM primarily for type safety
        (REQ-025) and superior developer experience with autocomplete.
```

### Example 2: Tracking Requirement Evolution

```
User: "What happened to the real-time collaboration feature?"

Skill activates → Traces requirement:

Requirement Trace: Real-time Collaboration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Original Requirement:
  REQ-018: "Real-time collaborative editing"
  Source: REQUIREMENTS.md (v1.0)
  Priority: Could Have
  Date: 2026-01-08

Evolution:
  2026-01-08: Added to initial requirements
  2026-01-15: Research shows significant complexity
  2026-01-20: Descoped from v1.0 to v2.0
  2026-03-01: Re-evaluated in v2.0 planning
  2026-03-05: Descoped again to v3.0

Current Status: Out of Scope (deferred to v3.0)

Decision History:
  1. v1.0 descoping:
     "WebSocket infrastructure not ready, defer to v2.0"
     Source: STATE.md (2026-01-20)

  2. v2.0 descoping:
     "Operational transform complexity too high for timeline"
     Source: milestones/v2.0-ROADMAP.md notes

  3. v3.0 plan:
     "Evaluate CRDT libraries (Yjs, Automerge) instead of
      building from scratch"
     Source: PROJECT.md Future Considerations

Answer: Real-time collaboration was initially planned but
        repeatedly deferred due to technical complexity. It's
        currently planned for v3.0 using CRDT libraries rather
        than a custom implementation.
```

### Example 3: Phase Archaeology

```
User: "Why did Phase 6 take so long compared to others?"

Skill activates → Analyzes phase:

Phase Analysis: Phase 6 Duration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 6: "Payment Integration"
  Planned Duration: 5 days
  Actual Duration: 18 days
  Variance: +260%

Timeline:
  2026-01-25: Phase 6 started
  2026-01-28: BLOCKER: "Stripe test mode rate limits"
  2026-01-30: Created 06-05-PLAN to add retry logic
  2026-02-02: BLOCKER: "Webhook signature validation failing"
  2026-02-04: Research webhooks, found documentation gap
  2026-02-06: Added 06-06-PLAN for webhook testing infrastructure
  2026-02-08: BLOCKER: "PCI compliance requires HTTPS in dev"
  2026-02-10: Added 06-07-PLAN for ngrok integration
  2026-02-12: All blockers resolved, phase completed

Blockers Encountered:
  1. Rate limiting (2 days to resolve)
  2. Webhook validation (4 days to resolve)
  3. HTTPS requirement (5 days to resolve)

Additional Plans Created:
  Original: 4 plans (06-01 through 06-04)
  Added: 3 plans (06-05, 06-06, 06-07)
  Total: 7 plans

Lessons Learned:
  "Payment integrations require:
   - Webhook testing infrastructure (mock + real)
   - HTTPS even in development (ngrok)
   - Comprehensive error handling for API failures"
  Source: PROJECT.md Key Decisions

Answer: Phase 6 took 260% longer than planned due to 3 major
        blockers (rate limits, webhook validation, HTTPS). Each
        required additional planning and implementation. This
        taught us to budget more time for third-party integrations.
```

## Advanced Trace Patterns

### Cross-Phase Impact Analysis

```
Query: "If we change the User model now, what will break?"

Process:
  1. Find all phases that reference User model
  2. Read plan SUMMARY files for implementation details
  3. Check git history for files touching user schema
  4. Analyze dependencies

Output:
  User Model Dependencies:

  Phase 2: Database Models (creates User)
    └─ 02-01-PLAN: "User model with email, password hash"

  Phase 4: Authentication (uses User)
    ├─ 04-01-PLAN: "Login queries User by email"
    ├─ 04-02-PLAN: "JWT payload includes user.id, user.role"
    └─ 04-03-PLAN: "Registration creates User record"

  Phase 7: Profile Management (extends User)
    ├─ 07-01-PLAN: "User profile with avatar, bio"
    └─ 07-02-PLAN: "Profile updates modify User table"

  Phase 11: Admin Dashboard (queries User)
    └─ 11-03-PLAN: "User list with pagination"

  Impact Analysis:
    Breaking changes to User model will affect:
    - Authentication (Phase 4): 3 plans
    - Profiles (Phase 7): 2 plans
    - Admin (Phase 11): 1 plan

    Recommended approach:
    1. Add new fields (non-breaking)
    2. Deprecate old fields (warning period)
    3. Remove old fields in v2.0 (breaking change)

    Source: Similar pattern in PROJECT.md Key Decisions
            "Schema Evolution Strategy"
```

### Decision Consistency Check

```
Query: "Are we still following the 'API-first' principle we decided on?"

Process:
  1. Find original decision in PROJECT.md
  2. Check subsequent phases for compliance
  3. Flag any deviations

Output:
  Original Decision (2026-01-10):
    "API-first: All features built as API endpoints first,
     UI consumes same APIs"
    Source: PROJECT.md Key Decisions

  Compliance Check:
    ✓ Phase 3: CRUD API built before UI (compliant)
    ✓ Phase 8: OAuth API endpoints before UI flow (compliant)
    ✗ Phase 12: Admin UI built with direct DB queries (VIOLATION)

  Deviation Analysis:
    Phase 12 Summary: "Admin dashboard queries DB directly
                       for performance reasons"

    Justification: Found in 12-CONTEXT.md
      "Admin queries too complex for REST API, would require
       N+1 query patterns. Direct DB access with caching."

    Decision Updated: PROJECT.md (2026-02-15)
      "API-first with exceptions:
       - Admin dashboards may use direct DB access
       - Must document why API is insufficient"

  Answer: Mostly yes, with documented exception for admin features.
          The principle evolved to allow pragmatic deviations when
          justified and documented.
```

## Common Trace Queries

| Query Type | Example | Primary Sources |
|------------|---------|-----------------|
| Why Decision | "Why did we choose X over Y?" | PROJECT.md Key Decisions, RESEARCH.md |
| When Changed | "When did requirement Z change?" | REQUIREMENTS.md, STATE.md, git log |
| What Happened | "What happened in Phase N?" | ROADMAP.md, SUMMARY files, git commits |
| Who Decided | "Who decided to use technology T?" | Always Claude + User (GSD is collaborative) |
| How Implemented | "How did we implement feature F?" | PLAN files, SUMMARY files, git diffs |
| What Failed | "What approaches didn't work?" | RESEARCH.md, STATE.md Session Continuity |
| Impact Analysis | "What depends on module M?" | PLAN files, git history, code search |

## Limitations

This skill can only trace what GSD has documented:

**Can Trace:**
- Decisions recorded in PROJECT.md
- Requirements in REQUIREMENTS.md
- Phase execution via SUMMARY files
- Commits with descriptive messages
- Blockers in STATE.md

**Cannot Trace:**
- Undocumented decisions made outside GSD
- Requirements never written down
- Work done without plans/summaries
- Commits with vague messages
- Verbal discussions not captured

**Recommendation:** The more disciplined the GSD artifact maintenance, the better this skill works. Garbage in, garbage out.

## Best Practices

1. **Use specific queries** - "Why JWT?" works better than "Tell me about auth"
2. **Accept limitations** - If not documented, it can't be traced
3. **Cross-reference** - Combine multiple sources for complete picture
4. **Update artifacts** - When you learn something new, add it to PROJECT.md
5. **Commit messages matter** - Reference plan numbers for better archaeology

## Performance

- **Fast queries** - Reading markdown files is nearly instant
- **No LLM needed** - Most traces are pure text search + assembly
- **Scales well** - Even projects with 100+ phases remain traceable
- **Git integration** - Can leverage git log for commit archaeology

---

*This skill demonstrates the value of GSD's artifact discipline: every decision, requirement, and outcome becomes searchable project memory.*
