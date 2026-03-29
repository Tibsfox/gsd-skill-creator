# Educational Output Generator — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 2 | **Track:** A
**Model Assignment:** Sonnet
**Estimated Tokens:** ~25K
**Dependencies:** Component #3 (Per-Mission Pipeline)
**Produces:** `skills/nasa/edu-generator/SKILL.md`, TRY Session template, DIY project template, College of Knowledge format adapters

---

## Objective

Build the educational output generator that produces TRY Sessions, DIY project specifications, study guides, and College of Knowledge-formatted content from each mission's pipeline output. Every mission produces at least one TRY Session and one DIY project. Done means: educational content is produced in consistent, engaging format that a student can follow without prior expertise.

## Context

The NASA mission series is simultaneously a GSD ecosystem exercise and an educational resource. Parts C, D, E, and F each produce content that must be translated into student-facing materials. The educational output generator standardizes this translation.

The College of Knowledge (`.college/` directory) organizes knowledge by department. NASA content maps to multiple departments: Mathematics (from Part D derivations), Physics (from Parts B and E), Engineering (from Part D), History (from Part A), and potentially Culinary Arts (astronaut food science, if relevant to a mission).

TRY Sessions are the GSD ecosystem's signature educational format: guided, hands-on exercises with clear entry conditions, step-by-step instructions, expected outcomes, and "what just happened" explanations. The name comes from the BBS educational pack lineage — "try it yourself."

DIY projects are longer-form, more open-ended specifications that a student builds over hours or days, producing a tangible artifact (a simulation, a model, a working circuit, a drawing).

## Technical Specification

### TRY Session Template

```markdown
# TRY: [Session Title]

**Mission:** [NASA Mission Name]
**Duration:** [15 min / 30 min / 1 hour]
**Difficulty:** [Beginner / Intermediate / Advanced]
**Department:** [College of Knowledge department]
**What You Need:** [Software, tools, materials — all must be free/accessible]

---

## What You'll Learn
[1-2 sentences: the "giddy smile" moment this session aims for]

## Entry Conditions
- [ ] [Prerequisite 1 — be specific: "Python 3.8+ installed" not "programming experience"]
- [ ] [Prerequisite 2]

## The Exercise

### Step 1: [Action verb first]
[Clear instruction. What to type, click, or do.]
[Expected result: what you should see/hear/measure.]

### Step 2: [Action verb first]
[Continue...]

### Step N: [Final step]
[The payoff — the moment of understanding.]

## What Just Happened
[2-3 paragraphs explaining the underlying concept. Connect to NASA mission.
 This is where the "spaces between" learning happens — the student did the
 thing, now they understand why it works.]

## Going Deeper
- [Link to Part D engineering content]
- [Link to Part E simulation]
- [Link to TSPB mathematical foundation]

## The NASA Connection
[How this exercise connects to what NASA actually did on this mission.
 Make the student feel like they just did something an aerospace engineer does.]
```

### DIY Project Template

```markdown
# DIY: [Project Title]

**Mission:** [NASA Mission Name]
**Duration:** [2 hours / 1 day / weekend project]
**Difficulty:** [Intermediate / Advanced]
**Department:** [College of Knowledge department]
**What You Build:** [One sentence: the tangible artifact]
**What You Need:** [Complete materials/tools list]

---

## Project Overview
[What you're building and why it matters. Connect to the NASA mission.]

## Design Specification
[What the finished project should do/look like/produce.]

## Build Steps
[Detailed, numbered steps. Each step produces something verifiable.]

## Test Your Build
[How to verify your project works correctly.]

## How NASA Did It
[The real engineering/science behind your project. Full technical depth.]

## Extend It
[Ideas for making the project more sophisticated.]
```

### College of Knowledge Mapping

| Part | Content Type | Department | Format |
|------|-------------|------------|--------|
| A | Historical narrative | History | Study guide |
| B | Science findings | Physics / Astronomy | Reference module |
| C | Educational exercises | Cross-departmental | TRY Sessions |
| D | Engineering analysis | Engineering / Mathematics | Workbook + DIY |
| E | Simulations | Computer Science / Physics | TRY Sessions + DIY |
| F | Operations | Systems Engineering | TRY Sessions (CAPCOM) |

### Behavioral Requirements

- Every mission produces ≥1 TRY Session and ≥1 DIY project
- All required tools/software must be free and accessible (no commercial-only dependencies)
- TRY Sessions must be completable in stated duration by stated difficulty level
- DIY projects must produce a tangible, verifiable artifact
- "What Just Happened" section is mandatory — exercises without explanation are incomplete
- The NASA Connection section is mandatory — grounding in real mission context is the value proposition

## Implementation Steps

1. Create `skills/nasa/edu-generator/SKILL.md` with content generation logic
2. Create TRY Session and DIY project templates
3. Build College of Knowledge format adapters (one per department)
4. Implement content-to-department routing (which Part content goes to which department)
5. Test: generate a TRY Session from synthetic Part D engineering content

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| EG-01 | Part D orbital mechanics content | TRY Session: "Calculate an orbit" | All template sections present; duration realistic |
| EG-02 | Part E simulation spec | DIY Project: "Build a trajectory visualizer" | Materials free; steps verifiable; artifact defined |
| EG-03 | Part A historical narrative | Study guide in History department format | College format headers; cross-references present |
| EG-04 | Mission with minimal science | ≥1 TRY Session still produced | History or engineering TRY Session generated |
| EG-05 | Generated TRY Session | "What Just Happened" section present | Explanation ≥2 paragraphs; connects to mission |

## Verification Gate

- [ ] TRY Session template complete with all mandatory sections
- [ ] DIY project template complete with all mandatory sections
- [ ] College of Knowledge format adapters produce valid department-formatted output
- [ ] Generated content meets minimum quality: entry conditions present, steps verifiable, NASA Connection present
- [ ] All tools/software referenced are free and accessible

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| All tools/software must be free and accessible | GATE |
| TRY Sessions involving electronics must include safety warnings | GATE |
| No classified or restricted data in educational content | ABSOLUTE |
