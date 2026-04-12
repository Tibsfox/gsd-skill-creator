---
name: business-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/business-department/README.md
description: >
  Coordinated business department — seven named agents, six knowledge
  skills, three teams. Forked from the department template pattern
  first instantiated by math-department.
superseded_by: null
---

# Business Department

## 1. What is the Business Department?

The Business Department chipset is a coordinated set of reasoning agents,
domain skills, and pre-composed teams that together provide structured
business support across strategy, operations, entrepreneurship, finance,
commercial law, and ethics. It is a direct instantiation of the "department
template pattern" established by the math department: a router-topology
architecture in which a single chair agent classifies incoming queries and
dispatches them to named specialists whose work products are persisted as
Grove records linked to the college concept graph.

Where the math department's specialists are named after historical
mathematicians whose work maps to their roles (Euclid for proof, Gauss for
computation, Noether for structure), the business department is named after
historical figures in management and commerce whose work maps to the business
specialist roles: Drucker for the chair (because he was the coordinator and
integrator who defined modern management as a discipline), Follett for
integration, Ohno for operations, Ford for mass production and scale, Ma for
platforms, Christensen for disruption, and Mintzberg for pedagogy and
strategy-as-practice critique.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/business-department .claude/chipsets/business-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Drucker (the router agent) classifies the query along four
dimensions — domain, decision type, stakeholder scope, and user level — and
dispatches to the appropriate specialist agent. No explicit activation command
is needed; the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/business-department/chipset.yaml', 'utf8')).name)"
# Expected output: business-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring
judgment under ambiguity), four on Sonnet (for throughput-oriented analysis
and pedagogy).

| Name         | Historical Figure       | Role                                                    | Model  | Tools                         |
|--------------|-------------------------|---------------------------------------------------------|--------|-------------------------------|
| drucker      | Peter Drucker           | Department chair — classification, routing, synthesis, purpose framing | opus   | Read, Glob, Grep, Bash, Write |
| follett      | Mary Parker Follett     | Integration specialist — stakeholder conflict, power-with, law of the situation | opus   | Read, Grep, Write             |
| ohno         | Taiichi Ohno            | Operations specialist — waste, pull flow, root-cause analysis | opus   | Read, Grep, Bash              |
| ford         | Henry Ford              | Scale specialist — mass production, economies of scale, vertical integration | sonnet | Read, Bash                    |
| ma           | Jack Ma                 | Platform specialist — two-sided markets, cold-start, network effects | sonnet | Read, Bash                    |
| christensen  | Clayton Christensen     | Disruption specialist — disruption theory, jobs-to-be-done, innovator's dilemma | sonnet | Read, Bash                    |
| mintzberg    | Henry Mintzberg         | Pedagogy specialist — explanation, strategy-as-practice, management development | sonnet | Read, Write                   |

Drucker is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Drucker.

Two notes on the roster. First, Ford is included with historical transparency:
his production contributions were real and are worth understanding, while the
costs of his model (labor relations, flexibility cost) and his wider historical
record (antisemitism in the *Dearborn Independent*) are acknowledged rather
than elided. The Ford agent is the historical evidence, not a hero. Second,
Ma's position on this roster is based on his contribution to platform-business
practice; the political-economic complications of his later career are
acknowledged in his AGENT.md.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                              | Domain   | Trigger Patterns                                                         | Agent Affinity         |
|------------------------------------|----------|--------------------------------------------------------------------------|------------------------|
| organizational-strategy            | business | strategy, management by objectives, purpose, organization, knowledge worker | drucker, mintzberg     |
| operations-and-lean                | business | operations, waste, lean, just-in-time, kanban, root cause, 5 whys         | ohno, ford             |
| entrepreneurship-and-innovation    | business | entrepreneurship, innovation, disruption, jobs-to-be-done, MVP, platform  | christensen, ma        |
| corporate-finance-basics           | business | NPV, IRR, payback, break-even, debt vs equity, working capital, balance sheet | drucker, mintzberg     |
| contracts-and-business-law         | business | contract, intellectual property, patent, trademark, copyright, trade secret | mintzberg, drucker     |
| business-ethics-and-governance     | business | ethics, governance, stakeholders, board, fiduciary, CSR, ESG, whistleblowing | drucker, follett, mintzberg |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                     | Agents                                              | Use When                                                 |
|--------------------------|-----------------------------------------------------|----------------------------------------------------------|
| business-analysis-team   | drucker, follett, ohno, ford, ma, christensen, mintzberg | Multi-domain, executive-level, or full-analysis requests  |
| business-workshop-team   | drucker, christensen, follett, mintzberg            | Pivot, market entry, disruption response, strategy review |
| business-practice-team   | ohno, ford, ma, mintzberg                           | Ongoing operational improvement, process redesign, platform operations |

**business-analysis-team** is the full department. Use it for problems that
span multiple business domains or require the broadest possible expertise.

**business-workshop-team** pairs the chair with the strategic-lens specialists
(disruption, stakeholder integration, pedagogy critique). Use it when the
primary goal is a thorough treatment of one strategic question rather than a
multi-domain scan.

**business-practice-team** is the operational pipeline. Ohno diagnoses,
Ford/Ma provide scale or platform context when relevant, and Mintzberg
embeds the improvement via development and routines. Designed for iterative
invocation as part of an ongoing improvement program.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`business-department` namespace. Five record types are defined:

| Record Type         | Produced By                        | Key Fields                                                     |
|---------------------|------------------------------------|----------------------------------------------------------------|
| BusinessAnalysis    | ohno, follett, christensen, mintzberg | Diagnosis, root causes, stakeholder interests, JTBD findings, role diagnosis |
| BusinessConstruct   | ohno, ford, ma, follett            | Flow designs, integrative proposals, disruption strategies, development plans |
| BusinessReview      | mintzberg                          | Strategic-plan critiques, artifact reviews, execution gap analysis |
| BusinessExplanation | mintzberg                          | Level-appropriate teaching, concept explanations, worked examples |
| BusinessSession     | drucker                            | Session log, classification metadata, work product links, timestamps |

Records are content-addressed and immutable once written. BusinessSession
records link all work products from a single interaction, providing an audit
trail from query to result.

## 7. College Integration

The chipset connects to the college business department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions
  and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a BusinessExplanation is produced, the
  chipset can automatically generate a Try Session (interactive practice)
  based on the explanation content and the learner's current position.
- **Learning pathway updates**: Completed analyses, constructs, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college business department structure:
  1. Economic Organization & Markets
  2. Business Structures & Entrepreneurship
  3. Finance & Accounting Fundamentals
  4. Contracts, Rights & Legal Systems
  5. Ethics, Governance & Social Responsibility

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The business department is one instantiation of the department template
pattern. To create a department for another applied domain (project management,
design thinking, operations research, etc.), follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/business-department examples/chipsets/newdomain-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. Select figures whose contributions map to the specialist roles and
whose work teaches domain history. Diversity of tradition and era matters.

### Step 3: Replace skills with domain-appropriate content

Swap the six business skills for domain equivalents. Each skill needs a
domain value, a description, a triggers list, and agent affinity mapping.

### Step 4: Define new Grove record types

Replace the five `BusinessX` record types with domain-appropriate types.
The minimum is a diagnostic type, a construct/artifact type, a review type,
an explanation type, and a session type.

### Step 5: Map to the target college department

Update the `college` section — set department, wings, and read/write
permissions.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments. Update `benchmark.domains_covered` for the new
domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Drucker) as the entry point for
all queries. Three benefits:

1. **Classification**: Drucker determines which domain(s) a query touches
   before dispatching, preventing wasted work by non-relevant agents.
2. **Purpose framing**: Drucker is specifically chosen as the chair because
   his distinctive discipline — asking "what is this firm's purpose?" — is
   the framing that most business questions need before any analysis.
3. **CAPCOM boundary**: The user interacts with exactly one agent, reducing
   cognitive load and providing a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (drucker, follett, ohno): These roles require judgment
  under ambiguity. Classification and synthesis (Drucker), integrative
  conflict resolution (Follett), and operational root-cause diagnosis
  (Ohno) all involve multi-step reasoning where errors compound.
- **Sonnet agents** (ford, ma, christensen, mintzberg): These roles are
  more framework-driven. Scale economics, platform cold-start, disruption
  testing, and pedagogy all benefit from fast turnaround over deep reasoning.

This 3/4 split keeps the token budget practical while preserving quality
where it matters most. It matches the math department's ratio, which is
the reference point.

### Why this team structure

The three teams cover the three most common business query shapes:

- **Full analysis**: needs every lens (all 7 agents, parallel) for
  multi-domain questions.
- **Strategic workshop**: needs the strategic core (4 agents, parallel)
  for deep-dive on one question.
- **Operational practice**: needs the operational core (3-4 agents,
  sequential pipeline) for ongoing improvement work.

Teams are not exclusive. Drucker can assemble ad-hoc groups for queries
that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Drucker speaks to
the user. Other agents communicate through Drucker via internal dispatch.
This is enforced by the `is_capcom: true` flag on Drucker in `chipset.yaml` —
only one agent in the chipset may carry this flag.

## 10. Historical Transparency

The business department uses historical names for mnemonic and educational
value. Two of the seven (Ford and Ma) have legacies that require
transparent handling.

- **Henry Ford**'s production-engineering contributions were genuine and
  are useful to understand. His labor-relations record was authoritarian
  and produced recurring conflict; the Five-Dollar Day was a response to
  turnover, not generosity. His publication of antisemitic material in the
  *Dearborn Independent* is a serious stain on his historical record that
  is not elided by his technical achievements. The Ford agent is historical
  evidence, treated critically.
- **Jack Ma**'s platform-business contributions are substantial and
  pedagogically valuable. His 2020 public statements preceded a regulatory
  crackdown on Ant Group and the broader political-economic story continues
  to evolve. The Ma agent inherits the platform playbook while the political
  context is acknowledged in the AGENT.md.

We include both because the technical content is valuable and teaching
business history honestly requires not pretending that the figures in it
were uncomplicated heroes. Users who prefer different names can rename the
agents — the template pattern supports this.

## 11. Relationship to Other Departments

The business department complements several other departments:

- **Economics department** handles market theory, monetary policy,
  microeconomics foundations, and macroeconomic policy. Business borrows
  its markets content.
- **Project management department** handles execution detail — scheduling,
  dependencies, earned value, risk registers. Business handles the
  strategic frame in which projects live.
- **Statistics department** handles quantitative methods that business
  analysts draw on for forecasting, experimentation, and measurement.
- **Critical thinking department** handles the argumentation and
  reasoning infrastructure that business ethics and strategy both rely on.

Future integration could formalize cross-department referrals via a
dispatch protocol so that, for example, a business-analysis-team could
call out to a statistics specialist for a forecasting sub-question without
leaving the business department's session context.
