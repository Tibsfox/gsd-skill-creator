---
name: problem-solving-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/problem-solving-department/README.md
description: >
  Coordinated problem-solving department — seven named agents, six knowledge
  skills, three teams. Built on the department template pattern with Polya's
  four-phase method as the synthesis scaffold and Schoenfeld's control layer
  as the execution discipline.
superseded_by: null
---

# Problem Solving Department

## 1. What is the Problem Solving Department?

The Problem Solving Department chipset is a coordinated set of solving agents, domain skills, and pre-composed teams that together provide structured problem-solving support across comprehension, strategy selection, mathematical problem solving, design thinking, collaborative solving, and metacognitive monitoring. It is one instantiation of the department template pattern in gsd-skill-creator: a chipset architecture designed to be forked and remapped to any knowledge domain. Incoming requests are classified by a router agent (Polya-PS), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college problem-solving concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/problem-solving-department .claude/chipsets/problem-solving-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Polya-PS (the router agent) classifies the query and dispatches to the appropriate specialist agent. No explicit activation command is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/problem-solving-department/chipset.yaml', 'utf8')).name)"
# Expected output: problem-solving-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep reasoning), four on Sonnet (for throughput-oriented framing, execution, and pedagogy).

| Name        | Historical Figure | Role                                                       | Model  | Tools                         |
|-------------|-------------------|------------------------------------------------------------|--------|-------------------------------|
| polya-ps    | George Polya      | Department chair — classification, routing, synthesis     | opus   | Read, Glob, Grep, Bash, Write |
| simon       | Herbert A. Simon  | State-space specialist — formalization, bounded rationality | opus | Read, Grep                    |
| newell      | Allen Newell      | Means-ends specialist — difference reduction, GPS          | opus   | Read, Bash                    |
| schoenfeld  | Alan Schoenfeld   | Mathematical solver — Polya phases + control layer        | sonnet | Read, Bash                    |
| jonassen    | David Jonassen    | Ill-structured specialist — typology, framing             | sonnet | Read, Write                   |
| bransford   | John Bransford    | IDEAL specialist — anchored instruction, case grounding   | sonnet | Read, Write                   |
| brown-ps    | Ann Brown         | Pedagogy — reciprocal teaching, metacognitive scaffolding | sonnet | Read, Write                   |

Polya-PS is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Polya-PS.

The `-ps` suffix on `polya-ps` and `brown-ps` disambiguates these agents from any same-figure agents in other departments (Polya appears conceptually in the math department; Brown may appear in reading comprehension or psychology contexts).

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                         | Domain | Trigger Patterns                                                   | Agent Affinity           |
|-------------------------------|--------|--------------------------------------------------------------------|--------------------------|
| problem-comprehension         | problem-solving | understand, knowns, unknowns, decompose, what is the goal | polya-ps, jonassen, simon |
| strategy-selection            | problem-solving | which approach, working backwards, means-ends, pattern recognition | polya-ps, simon, newell |
| mathematical-problem-solving  | problem-solving | solve this problem, polya, four phase, look back, math problem | schoenfeld, polya-ps, simon |
| design-thinking-ps            | problem-solving | design thinking, how might we, prototype, ideate, reframe | jonassen, bransford |
| collaborative-problem-solving | problem-solving | team problem, group, brainstorm, reciprocal, devils advocate | jonassen, brown-ps, bransford |
| metacognitive-monitoring      | problem-solving | am I stuck, metacognition, control layer, strategy switch, grinding | brown-ps, schoenfeld, polya-ps |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                          | Agents                                                            | Use When                                          |
|-------------------------------|-------------------------------------------------------------------|---------------------------------------------------|
| problem-solving-analysis-team | polya-ps, simon, newell, schoenfeld, jonassen, bransford, brown-ps | Multi-method attacks, ill-structured, full analysis |
| problem-solving-workshop-team | simon, newell, schoenfeld, brown-ps                              | Focused solve of a single tractable problem      |
| problem-solving-practice-team | jonassen, bransford, schoenfeld, brown-ps                        | Drill-and-practice, skill development             |

**problem-solving-analysis-team** is the full department. Use it for problems that span multiple solving dimensions or require the broadest investigation.

**problem-solving-workshop-team** pairs the state-space formalizer (Simon) with the means-ends executor (Newell), the control-layer monitor (Schoenfeld), and the pedagogy wrap (Brown-PS). Use it when the primary goal is focused solving of a tractable, well-defined problem.

**problem-solving-practice-team** is the practice pipeline. Jonassen frames the practice question, Bransford generates anchored examples, Schoenfeld walks through the solve with explicit control, and Brown-PS produces the explanation and pathway update.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `problem-solving-department` namespace. Five record types are defined:

| Record Type                | Produced By               | Key Fields                                                        |
|----------------------------|---------------------------|-------------------------------------------------------------------|
| ProblemSolvingAnalysis     | simon, jonassen, bransford | State schema, framing, stakeholders, problem type, decomposition |
| ProblemSolvingPlan         | newell, polya-ps          | Strategy, difference metric, operator sequence, subgoals          |
| ProblemSolvingTrace        | schoenfeld, newell        | Execution trace, monitoring checks, control events, switches    |
| ProblemSolvingExplanation  | brown-ps                  | Level-appropriate explanation, practice sequence, pathway        |
| ProblemSolvingSession      | polya-ps                  | Session ID, query, classification, agents, work product links    |

Records are content-addressed and immutable once written. ProblemSolvingSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college problem-solving department concept graph:

- **Concept graph read/write**: Agents can read concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a ProblemSolvingExplanation is produced, the chipset can generate a Try Session (interactive practice) based on the explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed solves, analyses, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college problem-solving structure:
  1. Understanding Problems
  2. Problem-Solving Strategies
  3. Creative & Lateral Thinking
  4. Collaborative Problem Solving
  5. Complex & Wicked Problems

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The problem-solving department is one of several departments built on the template pattern. To create a department for another domain, follow the general pattern documented in `examples/DEPARTMENT-PATTERN.md`.

Department-specific notes:

- The `-ps` suffix pattern is used when an agent shares a historical figure with another department's agent. Preserve this convention when forking.
- Polya's four-phase method is specific to this department as the synthesis scaffold. Other departments may have their own synthesis structures.
- Schoenfeld's control layer is the execution discipline; forked departments may inherit the concept of in-session monitoring but tailor its triggers to their domain.
- Jonassen's problem typology is broad and generalizes well to most departments that handle both well-structured and ill-structured problems.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Polya-PS) as the entry point for all queries. This provides three benefits:

1. **Classification**: Polya-PS determines which problem type a query represents before dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-method problems, Polya-PS collects results from multiple specialists and synthesizes a unified response against the four-phase scaffold.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces cognitive load and provides a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (polya-ps, simon, newell): These roles require the deepest reasoning. Classification and synthesis (Polya-PS) must understand all six skill domains and apply the four-phase scaffold. State-space formalization (Simon) requires careful analysis of representation, size, and structural features. Means-ends search (Newell) demands precise judgment about which operator reduces which difference at each step.
- **Sonnet agents** (schoenfeld, jonassen, bransford, brown-ps): These roles are throughput-oriented. Math execution with monitoring, ill-structured framing, anchored case selection, and pedagogical translation all benefit from fast turnaround; their tasks have clearer bounds.

This 3/4 split keeps the token budget practical while preserving quality where it matters most. The split is shared with other judgment-heavy departments (math, critical thinking, psychology) but is not universal.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full analysis**: needs every perspective (all 7 agents)
- **Workshop**: needs the tractable-problem core (4 agents: Simon, Newell, Schoenfeld, Brown-PS)
- **Practice**: needs the pedagogy-focused pipeline (4 agents, sequential: Jonassen, Bransford, Schoenfeld, Brown-PS)

Teams are not exclusive. Polya-PS can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary and the four-phase scaffold

The CAPCOM pattern means only Polya-PS speaks to the user. Other agents communicate through Polya-PS via internal dispatch. Polya-PS additionally applies Polya's four-phase scaffold (understand, plan, execute, review) to every synthesized response before it leaves the department. This scaffold enforcement is what distinguishes the Problem Solving Department chipset from a simple collection of solving tools — every response is structured against the same four-phase frame regardless of which specialists contributed.

## 10. Relationship to Other Departments

The Problem Solving Department complements other departments rather than competing with them:

- **Critical Thinking Department** (`examples/chipsets/critical-thinking-department/`): Problem solving generates and executes solutions. Critical thinking evaluates the reasoning behind them. A complete analysis session typically invokes both departments: critical thinking to check the argument that a proposed solution is correct, problem solving to generate the solution in the first place.
- **Math Department** (`examples/chipsets/math-department/`): Math provides the formal machinery (algebra, calculus, probability, optimization) that problem solving applies. Schoenfeld's math problem solving often dispatches to the math department for rigorous computation within a broader problem-solving session.
- **Psychology Department** (`examples/chipsets/psychology-department/`): Psychology focuses on how minds work; problem solving focuses on how to use them effectively. The overlap is metacognition (Brown-PS here, different researchers in psychology) and decision-making under uncertainty.

Future integration could formalize cross-department dispatch by allowing Polya-PS to delegate specific sub-queries to other departments' chairs. The infrastructure exists in the Grove namespace model — each department has its own namespace but records are globally addressable by hash.
