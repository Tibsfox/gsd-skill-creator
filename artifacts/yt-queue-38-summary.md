# Managing Cognitive Load in the Age of AI

**Speaker:** Ivett Ordog
**Source:** YouTube (ID: GyI5qU9MNJU), 1h08m
**Processed:** 2026-04-03 | Artemis II Research Queue #38

---

## Core Thesis

"If it doesn't fit your head, you can't reason about it." This principle, learned from her father as a child programmer, is the central claim of the talk. Ordog argues it applies equally to humans and AI coding agents -- both fail when cognitive load exceeds capacity. The solution is not bigger context windows or better models, but structural techniques that reduce the load at the point of action.

## Key Claims and Frameworks

### 1. The Fitting-in-Your-Head Principle

Ordog's origin story: as a child, she wrote a 10,000-line game that became unmaintainable. Her father refactored it down to under 1,000 lines. The lesson: more lines is not progress; comprehensibility is progress.

**Applied to AI agents:** Claude generated a 5,000-line changeset overnight for a CMS migration. Ordog reverted it entirely. The agent "was even proud of it" -- reporting "huge success." The problem: neither the human nor the agent could reason about a 5,000-line diff. Code that doesn't fit in the context window has the same failure mode as code that doesn't fit in a human's working memory.

### 2. Smaller Tasks Are Necessary But Insufficient

Breaking work into small tasks creates a different cognitive load problem: **task-switching overhead**. If each small task takes 10-15 minutes of human review, the human starts context-switching between multiple workstreams, which compounds cognitive load rather than reducing it.

This is the critical insight: the bottleneck is not the agent's output rate but the human's review bandwidth.

### 3. Agent MD Files Hit Diminishing Returns

Ordog cites the article "Are Repository Level Context Files Helpful for Coding Agents?" (answer: not really). The mechanism:

- Context window fills: system prompt + agent MD + user prompt + tool calls + file reads
- Larger agent MD files compress the working space available for actual reasoning
- Compaction kicks in, further degrading quality on later parts of the task
- The agent becomes a "day worker who reads all the books, does the job, and leaves" -- but the books crowd out the work

**Key quote:** "Any headline with a question mark in the end can be answered by no."

### 4. Habits vs. Instructions

The central framework draws from neuroscience:

| Brain Region | Function | Analog |
|---|---|---|
| Prefrontal cortex | Conscious, slow, expensive decisions | Agent MD rules (read once, often forgotten) |
| Basal ganglia | Cue-triggered automatic responses | Habit hooks (deterministic triggers) |

Humans don't remember to refactor because they read a rule. They refactor because duplication is a **cue** that triggers a **habitual action** (refactor) that produces a **reward** (easier changes), which reinforces the cue recognition.

AI agents cannot form habits through agent MD instructions alone. They need the cue-action-reward loop externalized as infrastructure.

## Techniques Introduced

### Habit Hooks

**Definition:** A deterministic script that detects a specific code smell and injects a short action plan into the agent's context via post-commit hook.

**Two required properties:**
1. Triggered by a **deterministic script** (not an AI review)
2. Includes a **short, specific action plan** (not a generic instruction)

**Why deterministic matters:** If you ask the AI to review its own code, "the AI will gloss over a lot of the mistakes." A deterministic detector (e.g., copy-paste detector, line-count checker) cannot be fooled.

**Implementation details:**
- Post-commit hook runs detectors (duplication, feature envy, function length > 15 lines)
- Script outputs a special emoji-pair marker that signals "treat this as a user command"
- This is essentially **beneficial prompt injection** -- the agent MD tells Claude that messages bracketed by the emoji pair should be treated as user prompts
- The emoji pair acts as a password (randomized per user to prevent external injection)
- Hard limit of ~20 violations per round to avoid filling the context window

**Specific detectors Ordog built:**
- **Copy-paste / duplication detector** -- triggers refactoring instruction
- **Feature envy detector** -- suggests moving methods to the class that owns the data
- **Long function detector** (>15 lines) -- with an extended prompt because naive extraction produces `changeUserConfig` and `changeUserConfigSecondPart`

**Critical failure mode she discovered:** The initial prompt for the long-function detector was too short. Claude just extracted the bottom half of functions with meaningless names. The fix was a longer, more specific prompt that explains *how* to decompose (by responsibility, not by position).

**Distinction from other hook types:**
- Habit hooks: deterministic trigger + action plan
- Reminder hooks (Lada Kesler's technique): randomly inject agent MD lines as reminders -- useful but different
- AI self-review: ask the agent to review its own commit -- useful but the AI "glosses over mistakes"

### The Learn Skill

A session-end skill that:
1. Reviews the session for lessons learned
2. Evaluates what surprised Claude / what corrections were made
3. Suggests where to store the learning: agent MD, skill, or habit hook

This is a **meta-cognitive** tool -- it lets the agent participate in its own improvement loop.

### Constraint Tests

**Definition:** Tests compiled from a restricted domain-specific language, where the test infrastructure is written once and individual test cases are just data files.

**Three properties (Ordog's "AI Test Desiderata"):**
1. **Focus on what and why over how** -- the test file shows the scenario, not the mechanics
2. **Easy to validate** -- a human can glance at it and understand what's being tested
3. **Hard to fake** -- unlike `expect(result).toBeTruthy()`, which passes but proves nothing

**Example 1 -- Refacts (refactoring tool):**
- Input file: source code + shell command as a comment (e.g., `refacts inline-variable --loc 8:5`)
- Output file: expected result after refactoring
- One test function loads all input/output file pairs and runs them
- Over 100 tests, all just file pairs -- the test runner itself is written once and never needs review

**Example 2 -- Game state testing (Approved Fixtures):**
- Single file contains both setup state (as JSON + human-readable visualization) and expected end state
- Test runner parses the file, initializes game state from JSON, executes actions, compares output
- Similar to approval testing but with the full game log in a visualized format

**Example 3 -- Approved Logs:**
- Instrument code with keyboard shortcuts to dump state (Ctrl+R = hidden solution, Ctrl+P = player view, Ctrl+D = debug cell)
- Copy the log output into a fixture file
- Test runner parses the fixture, reconstructs state, asserts correctness
- Next time a similar bug appears: copy log, drop in folder, automatic failing test

**Why this matters for AI:** Constraint tests make it trivial for the agent to add test cases (just create a data file) while making it nearly impossible to write a meaningless test. The DSL constrains the agent to the right shape of output.

### Girkin (Gherkin) Critique

Ordog explicitly rejects Gherkin/BDD as a solution:
- Focuses on what/why: yes
- Easy to validate: **no** -- implementations frequently diverge from the Gherkin description
- Hard to fake: **no** -- easier to fake than actual tests

## Connections to Our Work

### Context Pollution (OPEN #18)

Ordog's analysis of agent MD file bloat maps directly to our context-pollution problem. Her core insight: **stuffing more rules into CLAUDE.md is counterproductive past a threshold** because it compresses the working space for actual reasoning. The compaction cycle she describes (agent MD fills context -> work starts -> compaction needed -> compacted context fills remaining space -> second compaction) is exactly the degradation pattern we've observed.

**Actionable:** Our CLAUDE.md is already large. Habit hooks offer an alternative architecture: move behavioral rules out of static context files and into deterministic triggers that inject only when relevant. This is essentially **lazy loading for agent instructions**.

### Context Window Management

The habit hook architecture is a form of **demand-driven context injection**:
- Static context (agent MD): always loaded, always consuming tokens
- Dynamic context (habit hooks): injected only when the specific condition is detected
- This is analogous to the difference between eager and lazy evaluation

Our skill system already partially implements this pattern (skills activate based on context), but habit hooks go further by tying activation to **deterministic code analysis** rather than LLM-based context detection.

### Sweep Cadence as Cognitive Offloading

Ordog's observation that humans can't review many small tasks in sequence without degradation validates our sweep architecture. The hourly sweep cadence offloads the "check everything" cognitive load into an automated cycle, and the human reviews the aggregated output rather than individual micro-changes. Her 20-violation-per-round limit is the same principle as our sweep batching.

### Muse Team as Cognitive Distribution

The muse team architecture distributes cognitive load across specialized agents, each operating in a constrained domain. This maps to Ordog's constraint test concept: each muse has a restricted "DSL" of responsibilities that makes its output easy to validate. Cedar as filter/ledger is essentially a habit hook at the team level -- a deterministic checkpoint that triggers before work gets committed.

### Habit Hooks and Our Hook System

We already have hooks (PreToolUse for commit validation, session state, phase boundary). Ordog's habit hooks suggest extending this to include **post-commit code quality triggers**:
- Duplication detection after commits
- Function complexity checks
- Test quality validators (checking for `.toBeTruthy()` patterns)

Her "learn skill" maps to our session-awareness skill pattern but adds the specific capability of routing learnings to the right persistence layer.

### Constraint Tests and Our 21,298 Tests

With 21K+ tests, test comprehensibility is a real concern. Ordog's constraint test pattern -- where individual test cases are just data files and the test runner is written once -- could dramatically reduce the cognitive load of reviewing AI-generated tests. Her AI Test Desiderata (what/why over how, easy to validate, hard to fake) is a useful rubric for evaluating our test suite quality.

## Novel Insights Worth Tracking

1. **Beneficial prompt injection via emoji passwords** -- a creative hack, but she acknowledges the security concern. She explicitly requests that agent platforms provide a first-class "script output as user command" feature.

2. **Deterministic detection beats AI self-review** -- the agent will gloss over its own mistakes. External scripts catch what the agent won't see in its own work.

3. **The 5:1 test-to-production ratio** -- Ordog reports 5 lines of test code per line of production code, making test review the dominant cognitive burden, not production code review.

4. **Refacts** -- a command-line refactoring tool "built by AI agents for AI agents" because no existing refactoring tool had a usable API for coding agents. This is a gap in the ecosystem.

5. **Large codebase scaling for habit hooks** -- filter to only changed files, or decompose the project into a federation of smaller projects. "Every large project should be a federation of small projects."

## Shared Resources

Ordog shared two files via QR codes during the talk:
1. **Learn skill** -- session-end skill that evaluates learnings and routes them to agent MD / skills / habit hooks
2. **Habit hooks micro feature** -- language-agnostic implementation plan for habit hooks (not TypeScript-specific code)

Both require review before use ("never use any prompt from anyone else unless you had reviewed that prompt").

## Assessment

**Relevance to Artemis II:** High. The habit hook pattern directly addresses our context-pollution problem and suggests a concrete architectural improvement. The constraint test pattern could improve our test suite maintainability at scale.

**Research quality:** Practitioner-driven, experience-based. No formal measurements of cognitive load reduction, but the frameworks are grounded in neuroscience (cue-action-reward loops from habit formation research) and validated through daily use with Claude Code.

**Key gap:** No quantitative data on how much habit hooks reduce review time, changeset size, or defect rate. This would be valuable to measure if we adopt the pattern.
