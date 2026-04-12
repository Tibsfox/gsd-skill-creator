---
name: critical-thinking-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/critical-thinking-department/README.md
description: >
  Coordinated critical thinking department — seven named agents, six knowledge
  skills, three teams. Built on the department template pattern with Paul-Elder
  universal standards and the heuristics-and-biases tradition.
superseded_by: null
---

# Critical Thinking Department

## 1. What is the Critical Thinking Department?

The Critical Thinking Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured critical thinking support across argument evaluation, logical reasoning, cognitive bias detection, evidence assessment, creative thinking, and decision-making. It is one instantiation of the department template pattern in gsd-skill-creator: a chipset architecture designed to be forked and remapped to any knowledge domain. Incoming requests are classified by a router agent (Paul), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college critical-thinking concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/critical-thinking-department .claude/chipsets/critical-thinking-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Paul (the router agent) classifies the query domain and dispatches to the appropriate specialist agent. No explicit activation command is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/critical-thinking-department/chipset.yaml', 'utf8')).name)"
# Expected output: critical-thinking-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep reasoning), four on Sonnet (for throughput-oriented diagnosis, generation, and pedagogy).

| Name         | Historical Figure  | Role                                                  | Model  | Tools                        |
|--------------|--------------------|-------------------------------------------------------|--------|------------------------------|
| paul         | Richard Paul       | Department chair — classification, routing, synthesis | opus   | Read, Glob, Grep, Bash, Write |
| elder        | Linda Elder        | Structural analyst — argument reconstruction, elements | opus   | Read, Grep                   |
| tversky      | Amos Tversky       | Bias diagnostician — heuristics and biases            | opus   | Read, Bash                   |
| kahneman-ct  | Daniel Kahneman    | Dual-process specialist — System 1 / System 2         | sonnet | Read, Write                  |
| de-bono      | Edward de Bono     | Creative generator — lateral thinking, Six Hats       | sonnet | Read, Write                  |
| dewey-ct     | John Dewey         | Reflective inquirer — five-phase inquiry              | sonnet | Read, Write                  |
| lipman       | Matthew Lipman     | Pedagogy guide — community of inquiry, Socratic       | sonnet | Read, Write                  |

Paul is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Paul.

The `-ct` suffix on `dewey-ct` and `kahneman-ct` disambiguates these agents from the Dewey and Kahneman agents in the Psychology Department, which are drawn from the same historical figures but play different roles.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                  | Domain | Trigger Patterns                                               | Agent Affinity       |
|------------------------|--------|----------------------------------------------------------------|----------------------|
| argument-evaluation    | critical-thinking | is this argument valid, steel-man, premise, hidden assumption | paul, elder     |
| logical-reasoning      | critical-thinking | modus ponens, modus tollens, valid, inductive, syllogism       | elder, tversky       |
| cognitive-biases       | critical-thinking | bias, confirmation bias, anchoring, base rate, motivated reasoning | tversky, kahneman-ct |
| evidence-assessment    | critical-thinking | source reliable, study design, peer review, replication        | elder, tversky       |
| creative-thinking      | critical-thinking | brainstorm, lateral thinking, six hats, reframe, PO            | de-bono              |
| decision-making        | critical-thinking | decision, pros and cons, expected value, pre-mortem, reversible | kahneman-ct, tversky |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                           | Agents                                               | Use When                                       |
|--------------------------------|------------------------------------------------------|------------------------------------------------|
| critical-thinking-analysis-team | paul, elder, tversky, kahneman-ct, de-bono, dewey-ct, lipman | Multi-lens audits, ill-structured problems, full analysis |
| critical-thinking-workshop-team | elder, tversky, kahneman-ct, lipman                 | Deep analysis of a single argument or claim    |
| critical-thinking-practice-team | dewey-ct, de-bono, elder, lipman                    | Drill-and-practice, skill development          |

**critical-thinking-analysis-team** is the full department. Use it for problems that span multiple reasoning dimensions or require the broadest evaluation.

**critical-thinking-workshop-team** pairs the structural analyst (Elder) with the bias diagnostician (Tversky), the dual-process specialist (Kahneman-ct), and the pedagogy guide (Lipman). Use it when the primary goal is deep focused analysis of a single argument or claim.

**critical-thinking-practice-team** is the practice pipeline. Dewey-ct frames the practice question, de-Bono generates varied examples, Elder walks through the analysis, and Lipman produces the explanation and pathway update.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `critical-thinking-department` namespace. Five record types are defined:

| Record Type                   | Produced By           | Key Fields                                                 |
|-------------------------------|-----------------------|------------------------------------------------------------|
| CriticalThinkingAnalysis      | elder, dewey-ct       | reconstruction, elements, validity, soundness, structural issues |
| CriticalThinkingConstruct     | de-bono               | generated options, reframings, Six Hats outputs, provocations |
| CriticalThinkingReview        | tversky, kahneman-ct  | bias findings, mode diagnosis, corrections                  |
| CriticalThinkingExplanation   | lipman                | target level, explanation body, pathway, follow-up questions |
| CriticalThinkingSession       | paul                  | session ID, query, classification, agents, work product links |

Records are content-addressed and immutable once written. CriticalThinkingSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college critical-thinking department concept graph:

- **Concept graph read/write**: Agents can read concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a CriticalThinkingExplanation is produced, the chipset can generate a Try Session (interactive practice) based on the explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, diagnoses, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college critical-thinking structure:
  1. Claims & Evidence
  2. Arguments & Logical Reasoning
  3. Fallacies & Biases
  4. Applied Critical Thinking
  5. Metacognition & Intellectual Humility

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The critical thinking department is one of several departments built on the template pattern. To create a department for another domain, follow the general pattern documented in `examples/DEPARTMENT-PATTERN.md`.

Department-specific notes:

- The `-ct` suffix pattern is used when an agent shares a historical figure with another department's agent. Preserve this convention when forking.
- The Paul-Elder universal intellectual standards are specific to this department. Other departments may have their own synthesis standards.
- The bias catalog (Tversky's domain) is extensive; forked departments may inherit a subset relevant to their own domain.
- The community-of-inquiry pedagogy (Lipman's domain) generalizes well to most teaching departments.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Paul) as the entry point for all queries. This provides three benefits:

1. **Classification**: Paul determines which domain(s) a query touches before dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Paul collects results from multiple specialists and synthesizes a unified response against the universal intellectual standards.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces cognitive load and provides a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (paul, elder, tversky): These roles require the deepest reasoning. Classification and synthesis (Paul) must understand all six skill domains and apply the universal standards. Structural reconstruction (Elder) requires careful handling of hidden premises and ambiguous text. Bias diagnosis (Tversky) demands precise judgment about when a bias is genuinely present vs. when the reasoning is simply disagreeable.
- **Sonnet agents** (kahneman-ct, de-bono, dewey-ct, lipman): These roles are throughput-oriented. Mode diagnosis, option generation, inquiry framing, and pedagogical translation benefit from fast turnaround; their tasks have clearer bounds.

This 3/4 split keeps the token budget practical while preserving quality where it matters most. The split is shared with other judgment-heavy departments (math, psychology) but is not universal — a pure pedagogy or practice-oriented department might run with fewer Opus agents.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full analysis**: needs every perspective (all 7 agents)
- **Argument-focused**: needs the logical and bias core (4 agents, no creative or inquiry)
- **Practice**: needs the pedagogy-focused pipeline (4 agents, sequential)

Teams are not exclusive. Paul can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary and universal standards

The CAPCOM pattern means only Paul speaks to the user. Other agents communicate through Paul via internal dispatch. Paul additionally applies the Paul-Elder universal intellectual standards (clarity, accuracy, precision, relevance, depth, breadth, logic, significance, fairness) to every specialist output before it leaves the department. This enforcement is what distinguishes the Critical Thinking Department chipset from a simple collection of reasoning tools.

## 10. Relationship to Other Departments

The Critical Thinking Department complements other departments rather than competing with them:

- **Psychology Department** (`examples/chipsets/psychology-department/`): Psychology focuses on how minds work (development, behavior, emotion, cognition as psychological phenomena). Critical Thinking focuses on how minds should work (normative reasoning standards). The overlap is the cognitive biases skill, handled here from the critical-thinking angle and by Kahneman in psychology from the behavioral-economics angle.
- **Problem-Solving Department** (`examples/chipsets/problem-solving-department/`): Problem-solving generates and executes solutions. Critical thinking evaluates the reasoning behind them. A complete problem-solving session typically invokes both departments.
- **Math Department** (`examples/chipsets/math-department/`): Math provides the formal machinery (Bayes' theorem, expected value, statistical inference) that critical thinking applies. Tversky's probability corrections can dispatch to the math department for rigorous computation.

Future integration could formalize cross-department dispatch by allowing Paul to delegate specific sub-queries to other departments' chairs. The infrastructure exists in the Grove namespace model — each department has its own namespace but records are globally addressable by hash.
