# GSD Workflows: Teams vs Subagents

GSD uses two parallelism mechanisms for distributing work across agents:

- **Task() subagents** -- a single agent spawned for a focused job. The parent waits for it to finish, then continues. This is the default mechanism for all GSD commands.
- **Agent Teams** -- multiple coordinated agents working simultaneously under a lead agent. Members run in parallel, and the lead synthesizes their output.

Most GSD workflows should stay as subagents. Only two patterns genuinely benefit from teams: parallel research and adversarial debugging. This guide explains why.

**Navigation:** [Getting Started](GETTING-STARTED.md) | [CLI Reference](CLI.md) | [Workflows](WORKFLOWS.md)

---

## Table of Contents

- [Decision Framework](#decision-framework)
- [Workflow Reference Table](#workflow-reference-table)
- [Workflows That Benefit from Teams](#workflows-that-benefit-from-teams)
- [Workflows That Should Stay as Subagents](#workflows-that-should-stay-as-subagents)
- [Team Sizing Considerations](#team-sizing-considerations)
- [Creating GSD Teams](#creating-gsd-teams)

---

## Decision Framework

Use this decision tree when evaluating whether a GSD workflow should use teams:

```
Does the work require PARALLEL independent investigation?
  YES --> Does each investigator need their own context window?
    YES --> Use a team (parallel research, adversarial debugging)
    NO  --> Use subagents with sequential spawning
  NO  --> Does the work require SEQUENTIAL processing?
    YES --> Stay with subagents (output of step N feeds step N+1)
    NO  --> Is it a single focused task?
      YES --> Stay with subagents
      NO  --> Evaluate case-by-case
```

Three questions cut through most decisions:

1. **Are there truly independent work streams?** If the work can be split into parts that don't need each other's output, teams can parallelize it. If step 2 depends on step 1's output, subagents are correct.

2. **Does each worker benefit from a separate context window?** Teams give each member their own context. This matters when each investigator needs to go deep into different areas without polluting each other's context. A single agent researching 4 dimensions sequentially suffers quality degradation as its context fills.

3. **Do you need adversarial perspectives?** When multiple agents investigate the same problem from different angles, they avoid confirmation bias. A single debugger pursuing one hypothesis will find evidence for it -- even when the real cause is something else.

If you answered "no" to all three, use a subagent.

---

## Workflow Reference Table

| Workflow | Mechanism | Rationale |
|----------|-----------|-----------|
| Parallel research (`/gsd:research-phase`) | **Team** | 4 researchers investigate independently, synthesizer combines findings |
| Adversarial debugging (`/gsd:debug --adversarial`) | **Team** | Competing hypotheses reduce confirmation bias |
| Planning (`/gsd:plan-phase`) | Subagent | Sequential: gather context, break down work, write plans |
| Execution (`/gsd:execute-phase`) | Subagent | Each plan is a focused, atomic unit of work |
| Verification (`/gsd:verify-work`) | Subagent | Single verifier checks against must_haves |
| Phase research (`/gsd:research-phase` simple) | Subagent | Single researcher for focused domain investigation |
| Roadmap creation | Subagent | Sequential: questioning, then roadmap derivation |
| Quick tasks (`/gsd:quick`) | Subagent | Small, focused, single-concern work |
| Debugging (`/gsd:debug` standard) | Subagent | Single debugger with hypothesis-test cycle |
| Code review | Subagent | Single reviewer with focused checklist |

---

## Workflows That Benefit from Teams

### Parallel Research Team

**When to use:** Full ecosystem research with 4+ dimensions to investigate simultaneously. This is the "deep research" variant of `/gsd:research-phase` where you need comprehensive coverage of stack, features, architecture, and pitfalls.

**Pattern:** Leader-worker topology. 1 synthesizer lead + 4 specialist researchers.

**How it works:**

1. The synthesizer (lead) receives the research objective and spawns tasks for each dimension.
2. Each researcher investigates one dimension independently and in parallel:
   - **Stack Researcher** -- standard libraries, frameworks, and tools for the domain
   - **Features Researcher** -- expected features and capabilities
   - **Architecture Researcher** -- architecture patterns and project structure
   - **Pitfalls Researcher** -- common mistakes, anti-patterns, and gotchas
3. The synthesizer waits for all 4 to complete, then combines findings into a unified research summary.

**Why teams help:** Each researcher gets their own context window. A single agent researching all 4 dimensions sequentially fills its context with stack investigation results before it even starts on architecture. By the time it reaches pitfalls, quality has degraded. With a team, each researcher starts fresh and goes deep.

**Agent IDs:**

| Role | Agent ID | Type |
|------|----------|------|
| Lead | `gsd-research-synthesizer` | coordinator |
| Stack | `gsd-researcher-stack` | specialist |
| Features | `gsd-researcher-features` | specialist |
| Architecture | `gsd-researcher-architecture` | specialist |
| Pitfalls | `gsd-researcher-pitfalls` | specialist |

**Template:** `generateGsdResearchTeam()` from `gsd-skill-creator`

```typescript
import { generateGsdResearchTeam } from 'gsd-skill-creator';

const result = generateGsdResearchTeam();
// result.config      -- TeamConfig with 5 members
// result.sampleTasks -- 4 research tasks + 1 synthesis task
// result.patternInfo -- topology and member summary
```

---

### Adversarial Debugging Team

**When to use:** Complex bugs where the obvious explanation might be wrong. When you've been stuck on a bug and single-agent debugging keeps circling back to the same dead end.

**Pattern:** Leader-worker topology. 1 coordinator + 3 independent investigators.

**How it works:**

1. The coordinator analyzes symptoms and forms multiple hypotheses about the root cause.
2. Each debugger receives a different investigation angle:
   - **Debugger Alpha** -- investigates the most likely hypothesis (the obvious suspect)
   - **Debugger Beta** -- challenges the obvious explanation, pursues alternative hypotheses
   - **Debugger Gamma** -- focuses on environmental and configuration causes (build, deps, infra)
3. All three investigate independently. This is the key property: they don't see each other's findings during investigation, preventing confirmation bias.
4. The coordinator collects all findings and synthesizes them into a root cause analysis.

**Why teams help:** Adversarial investigation. If all debuggers pursued the same hypothesis, they would confirm each other's bias. A single debugger that suspects a race condition will find evidence supporting that theory -- even when the real cause is a configuration error. Independent investigation with different starting assumptions increases the chance of finding the actual root cause.

**Agent IDs:**

| Role | Agent ID | Type |
|------|----------|------|
| Lead | `gsd-debug-lead` | coordinator |
| Primary | `gsd-debugger-alpha` | specialist |
| Adversarial | `gsd-debugger-beta` | specialist |
| Environmental | `gsd-debugger-gamma` | specialist |

**Template:** `generateGsdDebuggingTeam()` from `gsd-skill-creator`

```typescript
import { generateGsdDebuggingTeam } from 'gsd-skill-creator';

const result = generateGsdDebuggingTeam();
// result.config      -- TeamConfig with 4 members
// result.sampleTasks -- hypothesize + 3 investigate + synthesize
// result.patternInfo -- topology and member summary
```

---

## Workflows That Should Stay as Subagents

The remaining GSD workflows share characteristics that make teams counterproductive.

### Sequential Dependency

Planning, execution, and roadmap creation are inherently sequential. Each step depends on the output of the previous step.

**Planning** follows a strict pipeline: gather context from existing files and requirements, break the work into atomic tasks, write detailed plan files with verification criteria. Step 2 needs step 1's output. Step 3 needs step 2's output. A team would add coordination overhead without enabling any parallelism.

**Roadmap creation** is the same: the roadmap agent asks questions to understand the project, then derives phases and plans from the answers. The questioning and derivation stages are tightly coupled -- you can't parallelize them.

**Execution** runs one plan at a time (or one wave of independent plans). Each plan is designed as a single unit of work for one agent. Splitting a plan across multiple team members would require constant coordination about shared files, and the atomic commit model (one commit per task) would break.

### Single Concern

Several workflows are designed for a single agent with focused attention:

- **Verification** (`/gsd:verify-work`): One verifier checks must_haves against what was built. Splitting verification across multiple agents risks gaps at the boundaries -- "I thought you were checking that part."
- **Quick tasks** (`/gsd:quick`): By definition small and focused. The overhead of coordinating a team exceeds the work itself.
- **Code review**: One reviewer with a checklist. Multiple reviewers would need to coordinate which files they're each reviewing and merge their feedback.

### Context Continuity

Some workflows benefit from having the full picture in a single context window:

- **Verification** needs to see both the plan (what was supposed to be built) and the implementation (what was actually built) simultaneously. Splitting this across agents means no single agent sees the complete picture.
- **Standard debugging** (`/gsd:debug` without `--adversarial`): A single debugger forms a hypothesis, tests it, refines it, and iterates. This cycle requires context from previous iterations. A team of debuggers would each need to re-establish context.

### Coordination Cost

Teams add overhead: task assignment, message passing between members, and synthesis of outputs. For workflows where the work itself is sequential or single-concern, this overhead provides zero benefit and slows things down. A subagent spawned with Task() starts immediately, does its work, and returns -- no coordination needed.

---

## Team Sizing Considerations

### Context Budget

Each team member's agent file contributes to the lead agent's context when it reads the team configuration. Keep this in mind:

- GSD agent files range from ~250 to ~1400 lines.
- A 5-member team where all agents average 800 lines means ~4000 lines of agent definitions loaded into the lead's context.
- This leaves less room for the actual work (research findings, debugging logs, code analysis).

**Recommendation:** Keep team member agent files focused and reasonably sized. Use the `prompt` field on TeamMember for task-specific instructions rather than putting everything in the agent `.md` file. The `prompt` field carries the differentiation; the agent file carries the base methodology.

### Model Selection

Not every team member needs the same model:

| Role | Recommended Model | Rationale |
|------|-------------------|-----------|
| Coordinator / Synthesizer | sonnet | Coordination and synthesis benefit from speed. The lead spends most time waiting for workers and combining outputs, not doing deep analysis. |
| Researcher (deep investigation) | opus | Research requires deep reasoning: evaluating library trade-offs, understanding architecture patterns, identifying non-obvious pitfalls. |
| Debugger (hypothesis testing) | opus | Debugging requires reasoning about complex system interactions and forming/testing hypotheses. |
| Debugger (environmental) | sonnet | Environmental and configuration checks are more mechanical: verify versions, check configs, scan logs. Speed helps here. |

### Member Count

More members means more coordination overhead for the lead:

- **Research team (5 members):** Well-suited because the 4 research dimensions are naturally independent and the synthesis step is well-defined.
- **Debugging team (4 members):** Three investigation agents is a good balance. More than 3 debuggers would likely produce overlapping investigations.
- **General guideline:** If you're adding team members beyond what the templates provide, ask whether the new member would truly investigate something independent or just overlap with existing members.

---

## Creating GSD Teams

### Programmatic (Recommended)

Import and call the template generator functions:

```typescript
import { generateGsdResearchTeam, generateGsdDebuggingTeam } from 'gsd-skill-creator';

// Research team with defaults
const research = generateGsdResearchTeam();

// Research team with custom name
const customResearch = generateGsdResearchTeam({
  name: 'my-project-research',
  description: 'Research team for my-project domain investigation',
});

// Debugging team with defaults
const debugging = generateGsdDebuggingTeam();
```

Each function returns a `TemplateResult`:

```typescript
interface TemplateResult {
  config: TeamConfig;       // Full team configuration
  sampleTasks: TeamTask[];  // Pre-configured tasks for the workflow
  patternInfo: {
    topology: string;       // 'leader-worker'
    description: string;    // Human-readable pattern description
    memberSummary: string;  // e.g., '1 synthesizer + 4 researchers'
  };
}
```

### CLI

Use the `team create` command with the appropriate pattern:

```bash
# Interactive wizard -- select the GSD research or debugging pattern
skill-creator team create

# Non-interactive with name and pattern
skill-creator team create --name gsd-research --pattern leader-worker
```

### After Creation

Both methods produce a `TemplateResult`. To persist the team:

1. Save the config with `TeamStore.save(result.config)`
2. Generate agent files with `writeTeamAgentFiles(result.config)` (skips files that already exist)
3. Validate with `validateTeamConfig(result.config)` to confirm everything is wired correctly
