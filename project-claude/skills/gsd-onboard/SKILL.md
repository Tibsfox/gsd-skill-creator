---
name: gsd-onboard
description: Interactive tutorial for learning GSD (Get Shit Done) workflows. Activates when user is new to GSD, asks "how do I use GSD", mentions "tutorial", "learn GSD", "getting started", or needs onboarding help.
---

# GSD Interactive Tutorial

Guided walkthrough of GSD concepts with hands-on practice, reducing the learning curve from "overwhelming" to "accessible."

## When to Use

Activate when the user:
- Is new to GSD and asks how to get started
- Mentions "tutorial", "learn GSD", "how does this work"
- Seems confused about GSD workflows
- Asks "what's the best way to learn GSD"

## Tutorial Structure

The tutorial follows a **learn-by-doing** approach across 4 progressive stages:

```
Stage 1: Core Concepts (5 min)
  → What GSD does and why it exists

Stage 2: The GSD Lifecycle (10 min)
  → Initialization → Planning → Execution → Validation

Stage 3: Hands-On Practice (15 min)
  → Create a demo project and run actual workflows

Stage 4: Reference & Next Steps (5 min)
  → Quick reference, common patterns, where to get help
```

Total time: ~35 minutes (can pause/resume at any stage)

---

## Stage 1: Core Concepts

### What is GSD?

**GSD (Get Shit Done)** transforms Claude Code into a structured project management system.

**The Problem GSD Solves:**

| Without GSD | With GSD |
|-------------|----------|
| Context rot (quality degrades as window fills) | Fresh context via `/clear` + STATE.md |
| Scope creep (work expands without tracking) | Explicit roadmap with phase boundaries |
| Lost work (changes without commits) | Atomic commits per plan (granular rollback) |
| Forgotten decisions (context lost) | PROJECT.md Key Decisions table |
| Ad-hoc execution | Systematic: question → research → plan → execute |

### The GSD Philosophy

```
Question First → Research → Requirements → Roadmap → Plans → Execute → Verify
```

**Key Principles:**
1. **Deep questioning upfront** prevents late-stage pivots
2. **Markdown artifacts** (not databases) for transparency and git-trackability
3. **Agent orchestration** for specialized tasks
4. **Atomic commits** enable surgical rollback
5. **Bounded learning** - GSD improves but within guardrails

### File Structure Overview

GSD maintains all state in `.planning/`:

```
.planning/
├── PROJECT.md           # Vision, requirements, constraints, decisions
├── REQUIREMENTS.md      # What we're building (REQ-IDs)
├── ROADMAP.md          # Phase structure and status
├── STATE.md            # Session memory, current position
├── config.json         # Workflow preferences
│
├── phases/
│   ├── 01-foundation/
│   │   ├── 01-CONTEXT.md      # User vision
│   │   ├── 01-RESEARCH.md     # Optional research
│   │   ├── 01-01-PLAN.md      # Executable plan
│   │   └── 01-01-SUMMARY.md   # What was built
│   └── 02-features/...
│
└── milestones/
    └── v1.0-ROADMAP.md    # Archived milestones
```

**Understanding these files:**
- **PROJECT.md** = Your north star (what/why, never how)
- **ROADMAP.md** = The phases to get there
- **STATE.md** = Where you are right now
- **Phases** = Groups of related work
- **Plans** = Atomic, executable tasks

---

## Stage 2: The GSD Lifecycle

### Phase 1: Initialization

**Goal:** Transform vague idea into structured project

#### `/gsd:new-project` - New Project Setup

```
What it does:
1. Deep questioning (10-15 rounds) to extract vision
2. Spawns 4 parallel researchers:
   - Stack researcher (tech options)
   - Features researcher (capabilities)
   - Architecture researcher (patterns)
   - Pitfalls researcher (risks)
3. Creates PROJECT.md, REQUIREMENTS.md, ROADMAP.md

Time: 15-30 minutes
Output: Complete project structure, ready for Phase planning
```

**Example interaction:**
```
GSD: "What problem does this solve for users?"
You: "Developers waste time context-switching between tools"

GSD: "Who are the primary users?"
You: "Full-stack developers working on side projects"

GSD: "What's the core value proposition in one sentence?"
You: "One tool for planning, building, and shipping"

[... 12 more questions ...]

Result: PROJECT.md with clear vision, requirements, and 6-phase roadmap
```

#### `/gsd:new-milestone` - Add Milestone to Existing Project

```
What it does:
1. Updates PROJECT.md with new milestone context
2. Creates new REQUIREMENTS.md for milestone scope
3. Routes to roadmap creation

Time: 5-10 minutes
Use when: Starting v2.0, v2.1, etc.
```

### Phase 2: Planning

**Goal:** Break phases into executable plans

#### `/gsd:discuss-phase N` - Gather Context Before Planning

```
What it does:
1. Conversational questioning about phase vision
2. Captures user preferences and constraints
3. Creates NN-CONTEXT.md for planner to read

Time: 3-5 minutes
When to use: Before planning complex/ambiguous phases
```

**Example:**
```
You: /gsd:discuss-phase 2
GSD: "How should users authenticate? OAuth, JWT, sessions?"
You: "JWT for API, sessions for web app"
GSD: "Where should tokens be stored?"
You: "HTTP-only cookies for web, localStorage for mobile"

[Writes preferences to 02-CONTEXT.md]
```

#### `/gsd:research-phase N` - Research Implementation Approach

```
What it does:
1. Spawns gsd-phase-researcher
2. Researches best practices, patterns, pitfalls
3. Creates NN-RESEARCH.md with findings

Time: 5-10 minutes
When to use: New tech, unfamiliar domain, high-risk phase
```

#### `/gsd:plan-phase N` - Create Executable Plans

```
What it does:
1. Reads ROADMAP.md phase goal
2. Optionally reads CONTEXT.md and RESEARCH.md
3. Spawns gsd-planner to break phase into plans
4. Spawns gsd-plan-checker to verify plans match goal
5. Creates NN-01-PLAN.md, NN-02-PLAN.md, etc.

Time: 3-8 minutes
Output: Ready-to-execute plans with verification criteria
```

**Plan structure:**
```markdown
# Plan 02-01: User Authentication API

## Objective
Implement JWT-based authentication endpoints

## Tasks
1. Create User model with password hashing
2. POST /auth/register endpoint
3. POST /auth/login endpoint (returns JWT)
4. JWT middleware for protected routes

## Verification
- [ ] Users can register with email/password
- [ ] Login returns valid JWT
- [ ] Protected endpoints reject invalid tokens

## Commit Message
feat(02-01): implement JWT authentication endpoints
```

### Phase 3: Execution

**Goal:** Build what was planned

#### `/gsd:execute-phase N` - Execute All Plans in Phase

```
What it does:
1. Reads all plans for phase N
2. Groups into dependency waves
3. Spawns gsd-executor for each wave
4. Creates NN-NN-SUMMARY.md for each plan
5. Atomic commits per plan

Time: Varies (5-40 min per plan)
Mode: YOLO (autonomous) or Interactive (checkpoints)
```

**Wave-based parallelization:**
```
Phase 2 has 4 plans:

Wave 1 (no dependencies):
  - Plan 02-01: User model
  - Plan 02-02: Auth endpoints

Wave 2 (depends on Wave 1):
  - Plan 02-03: JWT middleware
  - Plan 02-04: Protected routes

Execution: Wave 1 runs in parallel, then Wave 2
```

#### `/gsd:quick` - Execute Quick Task Without Full Planning

```
What it does:
1. Lightweight execution path
2. Creates STATE.md entry
3. Atomic commit

Time: 2-5 minutes
When to use: Bug fixes, small tweaks, exploratory work
```

### Phase 4: Validation

**Goal:** Verify built features actually work

#### `/gsd:verify-work N` - User Acceptance Testing

```
What it does:
1. Spawns gsd-verifier
2. Interactive testing of phase deliverables
3. Creates VERIFICATION.md with gaps found
4. Auto-generates fix plans for gaps

Time: 3-7 minutes
When to use: After executing a phase, before moving on
```

**Example verification:**
```
Verifier: "Testing authentication flow..."
Verifier: "Can you register a new user? Try it."
You: "Yes, registration works"

Verifier: "Try logging in with wrong password"
You: "Hmm, it returns 500 instead of 401"

Verifier: "Gap found: Error handling for invalid credentials"
[Creates fix plan automatically]
```

#### `/gsd:audit-milestone` - Comprehensive Milestone Check

```
What it does:
1. Verifies all phases against ROADMAP goals
2. Checks cross-phase integration
3. Creates MILESTONE-AUDIT.md

Time: 5-10 minutes
When to use: Before /gsd:complete-milestone
```

### Phase 5: Completion

#### `/gsd:complete-milestone` - Archive and Prepare for Next

```
What it does:
1. Archives ROADMAP.md to milestones/vX.Y-ROADMAP.md
2. Deletes ROADMAP.md and REQUIREMENTS.md (fresh for next)
3. Evolves PROJECT.md with validated requirements
4. Updates STATE.md

When to use: After audit passes, ready for next milestone
```

---

## Stage 3: Hands-On Practice

### Demo Project: "Task Tracker API"

Let's build a simple project to practice the full GSD lifecycle.

#### Step 1: Initialize Project

```
/gsd:new-project

[Answer these questions:]
- What: Simple task tracker REST API
- Who: Learning developers
- Why: Practice CRUD operations and authentication
- Tech: Node.js, Express, SQLite
- Constraints: Must be completable in 2 hours

[GSD creates PROJECT.md, REQUIREMENTS.md, ROADMAP.md]

Roadmap created:
  Phase 1: Project setup
  Phase 2: Database and models
  Phase 3: CRUD endpoints
  Phase 4: Authentication
  Phase 5: Testing
```

#### Step 2: Plan First Phase

```
/gsd:plan-phase 1

[GSD creates plans:]
  01-01-PLAN.md: Initialize Node.js project, install deps
  01-02-PLAN.md: Setup Express server skeleton
  01-03-PLAN.md: Configure SQLite database

Ready to execute!
```

#### Step 3: Execute Phase

```
/gsd:execute-phase 1

[GSD executes all 3 plans, creates:]
  01-01-SUMMARY.md: "Created package.json, installed express/sqlite3"
  01-02-SUMMARY.md: "Setup Express server on port 3000"
  01-03-SUMMARY.md: "Configured SQLite with tasks table"

[3 atomic commits created]
Phase 1 complete!
```

#### Step 4: Verify Work

```
/gsd:verify-work 1

Verifier: "Testing server startup..."
You: "Server starts on port 3000 ✓"

Verifier: "Testing database connection..."
You: "Database file created, tasks table exists ✓"

Verification: PASS (no gaps)
```

#### Step 5: Continue to Next Phase

```
/gsd:progress

Current: Phase 1 of 5 complete
Next: /gsd:plan-phase 2
```

### Practice Exercises

Try these to solidify understanding:

**Exercise 1: Manual Editing**
- Edit ROADMAP.md to add a 6th phase
- Run `/gsd:progress` to see the update

**Exercise 2: Quick Task**
- Use `/gsd:quick` to add a README.md
- Check STATE.md to see it tracked

**Exercise 3: Context Reset**
- Run `/clear` to reset context
- Use `/gsd:progress` to restore state
- Notice: All state recovered from STATE.md!

**Exercise 4: Rollback**
- Find the commit for plan 01-02
- Run `git revert <commit>`
- See: Atomic commit makes surgical rollback easy

---

## Stage 4: Reference & Next Steps

### Quick Command Reference

| Command | When to Use |
|---------|-------------|
| `/gsd:new-project` | Starting from scratch |
| `/gsd:new-milestone` | Adding v2.0, v2.1, etc. |
| `/gsd:progress` | Check current state, get next action |
| `/gsd:discuss-phase N` | Gather context before planning |
| `/gsd:research-phase N` | Research unfamiliar domains |
| `/gsd:plan-phase N` | Create executable plans |
| `/gsd:execute-phase N` | Build what was planned |
| `/gsd:quick` | Small tasks without planning |
| `/gsd:verify-work N` | Test deliverables |
| `/gsd:audit-milestone` | Pre-completion check |
| `/gsd:complete-milestone` | Archive and prepare for next |
| `/gsd:debug` | Systematic debugging |

### Common Patterns

#### Pattern 1: Standard Phase Cycle
```
/gsd:plan-phase N
  → /clear (fresh context)
  → /gsd:execute-phase N
  → /gsd:verify-work N
```

#### Pattern 2: Complex Phase with Research
```
/gsd:discuss-phase N (gather vision)
  → /gsd:research-phase N (investigate)
  → /clear
  → /gsd:plan-phase N
  → /clear
  → /gsd:execute-phase N
```

#### Pattern 3: Mid-Work Context Reset
```
[Working on phase 3, context filling up]
  → /gsd:pause-work (creates checkpoint)
  → /clear
  → /gsd:resume-work (restores context)
```

#### Pattern 4: Debugging Workflow
```
/gsd:debug "describe the bug"
  → [Investigation, hypotheses, fix]
  → /clear
  → /gsd:debug (resume with same state)
```

### Configuration Options

Edit `.planning/config.json`:

```json
{
  "mode": "yolo",              // or "interactive"
  "model_profile": "quality",  // or "balanced", "budget"
  "depth": "standard",         // or "quick", "thorough"
  "research": true,            // Enable phase research
  "commit_docs": false         // Commit docs separately
}
```

**Mode:**
- `yolo`: Autonomous execution, no checkpoints
- `interactive`: Manual checkpoints for verification

**Model Profile:**
- `quality`: Opus executors (best quality, slower)
- `balanced`: Opus planners, Sonnet executors
- `budget`: Sonnet everywhere (faster, lower cost)

**Depth:**
- `quick`: Minimal questioning, fast
- `standard`: Balanced (default)
- `thorough`: Deep questioning, comprehensive

### Where to Get Help

**Built-in Help:**
```bash
/gsd:help              # Show all commands
/gsd:progress          # Current state + next action
/gsd-explain <command> # Explain what a command does
```

**Common Issues:**
- **Workflow fails mid-execution:** Run `/gsd-preflight` to check artifacts
- **Lost context after /clear:** Run `/gsd:progress` to restore
- **Don't know what to do next:** Run `/gsd:progress` for suggestions
- **STATE.md out of sync:** Run `/gsd:progress` to auto-sync

**Community:**
- GitHub Issues: Report bugs, request features
- Discord: Real-time help (use `/gsd:join-discord`)

### Next Steps

Now that you understand GSD:

**For Learning Projects:**
1. Use `/gsd:new-project` to structure your next side project
2. Practice the full lifecycle with something small
3. Experiment with different config settings

**For Existing Projects:**
1. Use `/gsd:new-milestone` to add GSD to existing work
2. Start with planning one phase to try it out
3. Gradually adopt more GSD workflows

**For Team Projects:**
1. Share `.planning/` directory via git
2. Team members can run `/gsd:progress` to sync
3. Use PROJECT.md Key Decisions for collaboration

---

## Interactive Quiz (Optional)

Test your understanding:

**Q1: When should you use /gsd:discuss-phase vs /gsd:plan-phase?**
<details>
<summary>Answer</summary>

Use `/gsd:discuss-phase` BEFORE `/gsd:plan-phase` when:
- Phase is ambiguous or has multiple approaches
- You want to capture preferences/constraints
- Phase is complex and planner would benefit from context

Skip `/gsd:discuss-phase` when:
- Phase goal is already clear in ROADMAP.md
- Standard patterns apply (no decisions needed)
</details>

**Q2: What does "atomic commits" mean in GSD?**
<details>
<summary>Answer</summary>

Each plan gets ONE commit. Benefits:
- Surgical rollback: `git revert` one plan without affecting others
- Clear history: Each commit maps to a plan
- Granular tracking: Know exactly what each plan changed
</details>

**Q3: How do you recover state after /clear?**
<details>
<summary>Answer</summary>

Run `/gsd:progress` or `/gsd:resume-work`. GSD reads:
- STATE.md (current position, decisions)
- ROADMAP.md (phase structure)
- PROJECT.md (vision, requirements)

All context is reconstructed from markdown files.
</details>

**Q4: When would you use /gsd:quick instead of planning a phase?**
<details>
<summary>Answer</summary>

Use `/gsd:quick` for:
- Bug fixes (small, clear scope)
- Documentation updates
- Minor tweaks/refactors
- Exploratory spikes

Use full planning for:
- New features
- Anything touching multiple files
- Work with unclear scope
</details>

---

## Congratulations!

You now understand:
- ✓ What GSD does and why it exists
- ✓ The full project lifecycle (init → plan → execute → verify)
- ✓ All major commands and when to use them
- ✓ How to recover state and handle context resets
- ✓ Configuration options and common patterns

**You're ready to use GSD!**

Start with a small project and practice the workflows. GSD becomes natural after 1-2 complete cycles.

---

## Integration with GSD

This skill **complements** GSD by:
- Lowering the barrier to entry for new users
- Providing hands-on practice in a safe environment
- Teaching the "why" behind GSD patterns
- Building mental models for effective usage

It **does not replace** GSD:
- Users still run actual GSD workflows
- No workflow logic is duplicated
- Purely educational/onboarding
