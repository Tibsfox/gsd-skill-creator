---
name: trades-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/trades-department/README.md
description: >
  Coordinated trades department — seven named agents, six knowledge
  skills, three teams. Craft-and-dignity framing with Vitruvius as
  chair, technical specialists Edison/Nasmyth/Brunel-TR, pedagogy
  specialists Rose/Crawford, and Taylor with explicit historical
  transparency on the labor critique of scientific management.
superseded_by: null
---

# Trades Department

## 1. What is the Trades Department?

The Trades Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured support for craft and trades work across craft methodology, workshop practice, tool and machine selection, materials and fit, apprenticeship pedagogy, and measurement and tolerance. It is an instantiation of the department template pattern established by the math and business departments, adapted for a craft-and-dignity framing in which Vitruvius's firmitas/utilitas/venustas triad organizes the responses and the cognitive content of manual work is treated as serious.

Where the math department is named after mathematicians whose work maps to its specialist roles, and the business department after management figures, the trades department is named after figures from the history of craft, engineering, mechanization, work measurement, and the philosophical defense of manual work. Vitruvius (Roman architect) chairs it. Edison (Menlo Park workshop designer) and Nasmyth (precision power, Bridgewater Foundry) handle the shop and machine-shop foundations. Brunel-TR (Marc Brunel, Portsmouth block mills) handles mechanization history. Taylor (scientific management) handles work measurement, with mandatory historical framing. Rose (*The Mind at Work*) and Crawford (*Shop Class as Soulcraft*) handle the pedagogy and the philosophical defense.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/trades-department .claude/chipsets/trades-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Vitruvius (the router agent) classifies the query along five dimensions — domain, complexity, type, user level, and firmitas/utilitas/venustas emphasis — and dispatches to the appropriate specialist agent. No explicit activation command is needed; the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/trades-department/chipset.yaml', 'utf8')).name)"
# Expected output: trades-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring judgment under ambiguity), four on Sonnet (for framework-driven or tightly scoped tasks).

| Name | Historical Figure | Role | Model | Tools |
|------|-------------------|------|-------|-------|
| vitruvius | Marcus Vitruvius Pollio | Department chair — classification, routing, synthesis, triad framing | opus | Read, Glob, Grep, Bash, Write |
| edison | Thomas Alva Edison | Workshop and invention-environment specialist | opus | Read, Glob, Grep, Bash |
| nasmyth | James Nasmyth | Precision-power and machine-shop specialist | opus | Read, Grep, Bash |
| brunel-tr | Marc Isambard Brunel | Mechanization and mass-production-origin specialist | sonnet | Read, Bash |
| taylor | Frederick W. Taylor | Work-measurement specialist with labor-transparency framing | sonnet | Read, Bash |
| rose | Mike Rose | Cognition-of-manual-work and pedagogy specialist | sonnet | Read, Write |
| crawford | Matthew Crawford | Philosophy of manual competence and craft-education specialist | sonnet | Read, Write |

Vitruvius is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Vitruvius.

### The brunel-tr suffix

The trades Brunel is Marc Isambard Brunel (the father). The engineering department (see `examples/agents/engineering/brunel`) has a separate agent for Isambard Kingdom Brunel (the son, of Great Western Railway and SS *Great Britain* fame). The two Brunels are the same family but their contributions are different: Marc is the mechanization-of-hand-trades figure whose work at Portsmouth established mass-production logic; Isambard is the railways-and-ships figure whose work defined industrial-scale engineering. The `-tr` suffix on this department's Brunel marks the trades scoping and prevents collision with the engineering Brunel. Every cross-reference in the chipset and its documentation uses `brunel-tr` consistently.

### Historical transparency on Taylor

Frederick W. Taylor's time-study work is included in the department because work measurement is a legitimate discipline with real uses in safety, ergonomics, capacity planning, and process improvement. The historical context of scientific management is not elided. Every Taylor invocation includes an explicit labor-relations framing — the Watertown Arsenal strike, the Braverman/Rose/Crawford critiques, the TPS alternative — as a core output rather than a postscript. Users who expect a neutral cheerleader for Taylorism will not find one here. Users who want honest work-measurement content with transparent context will.

### Historical transparency on Brunel-TR

The Portsmouth Block Mills are one of the most historically important machine shops ever built. They also displaced 100 skilled craftsmen per 10 unskilled operators. The skill-transfer tradeoff — the transfer of craft knowledge from the shop floor to the engineering drawings — is named explicitly in Brunel-TR's output as one of the central facts of industrial mechanization, not as an optional footnote. The same applies when the agent is asked to advise on modern mechanization proposals: the labor consequences are part of the evaluation, not hidden behind the economics.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill | Domain | Trigger Patterns | Agent Affinity |
|-------|--------|------------------|----------------|
| craft-methodology | trades | craft arc, intent, layout, roughing, fitting, finishing, inspection | vitruvius, crawford, rose |
| workshop-practice | trades | workshop, shop layout, bench, tool room, shop safety | edison, nasmyth, vitruvius |
| tool-and-machine | trades | tool selection, hand vs power, CNC, precision power | nasmyth, brunel-tr, edison |
| materials-and-fit | trades | wood movement, thermal expansion, tolerance stack, fit allowance | vitruvius, nasmyth, brunel-tr |
| apprenticeship-pedagogy | trades | apprenticeship, observe/practice/correct, master/apprentice, teaching craft | rose, crawford, vitruvius |
| measurement-and-tolerance | trades | measurement, tolerance, datum, accuracy/precision/resolution | nasmyth, taylor, brunel-tr |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team | Agents | Use When |
|------|--------|----------|
| trades-analysis-team | vitruvius, edison, nasmyth, brunel-tr, taylor, rose, crawford | Multi-domain craft problems, complex shop-and-pedagogy questions, curriculum design |
| trades-workshop-team | vitruvius, edison, nasmyth, crawford | Shop redesign, tooling investment, layout diagnosis, invention-environment design |
| trades-practice-team | vitruvius, rose, crawford, nasmyth | Apprenticeship design, stuck-learner diagnosis, trades-education defense |

**trades-analysis-team** is the full department. Use it for problems that span multiple trades domains or require the broadest possible set of lenses.

**trades-workshop-team** is the shop-design and shop-improvement team. It pairs Edison (environment) with Nasmyth (precision) and adds Crawford for the philosophical framing when the shop has educational consequences.

**trades-practice-team** is the pedagogy pipeline. Rose provides the cognitive content, Crawford the philosophical defense, and Nasmyth the technical grounding that prevents the pedagogy from floating free of actual craft.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `trades-department` namespace. Five record types are defined:

| Record Type | Produced By | Key Fields |
|-------------|-------------|------------|
| TradesAnalysis | edison, nasmyth, brunel-tr, taylor, rose | Diagnosis, findings, root causes, recommendations, historical-transparency notes |
| TradesCraft | edison, nasmyth, brunel-tr, vitruvius | Designed artifacts — shop layouts, jig/fixture designs, dedicated machinery, apprenticeship programs |
| TradesReview | vitruvius, crawford, rose | Critiques of existing shops, programs, machine tool evaluations, pedagogy reviews |
| TradesExplanation | rose, crawford, vitruvius, nasmyth | Teaching artifacts at specified level — cognitive descriptions, philosophical framings, history, technique |
| TradesSession | vitruvius | Session log, classification metadata, work-product links, triad emphasis, transparency notes |

Records are content-addressed and immutable once written. TradesSession records link all work products from a single interaction and carry the historical-transparency flags that any Taylor or Brunel-TR invocation added.

## 7. College Integration

The chipset connects to the college trades department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a TradesExplanation is produced, the chipset can automatically generate a Try Session (interactive practice) based on the explanation and the learner's current position.
- **Learning pathway updates**: Completed analyses, crafts, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college trades department structure:
  1. Craft Methodology and Process
  2. Workshop Practice and Culture
  3. Tools, Machines, and Mechanization
  4. Materials, Fit, and Tolerance
  5. Apprenticeship, Pedagogy, and the Cognitive Life of Craft

## 8. Customization Guide

The trades department is one instantiation of the department template pattern. To create a department for another applied domain (field-specific trades, manufacturing engineering, restoration, etc.), follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/trades-department examples/chipsets/newdomain-department
```

### Step 2: Rename agents

Replace agent names, roles, and historical figure references. Select figures whose contributions map to the specialist roles and whose work teaches domain history. Apply historical transparency wherever a figure's record requires it.

### Step 3: Replace skills

Swap the six trades skills for domain equivalents. Each skill needs a domain value, a description, a triggers list, and agent affinity mapping.

### Step 4: Define new Grove record types

Replace the five `TradesX` record types with domain-appropriate types. The minimum is a diagnostic type, a construct/artifact type, a review type, an explanation type, and a session type.

### Step 5: Map to the target college department

Update the `college` section — department, wings, and read/write permissions.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The default gates are generic. Update `benchmark.domains_covered` for the new domain areas and keep the historical-transparency gates if any of the figures have labor-relations or other complex histories.

## 9. Architecture Notes

### Why the triad

The firmitas/utilitas/venustas triad is not decoration. It is the organizing principle for every synthesized response. Every query is tagged with which of the three terms dominate, and the synthesis places the dominant term first. This produces responses that are structured rather than ad hoc and that reliably cover the three aspects of craft — the structural, the functional, and the aesthetic — without any being neglected.

### Why router topology

The router topology places a single agent (Vitruvius) at the entry point for all queries. Three benefits: classification (determining which domains a query touches before dispatching), triad framing (ensuring the firmitas/utilitas/venustas lens is applied), and CAPCOM boundary (the user interacts with one agent).

### Why 3 Opus / 4 Sonnet

Opus agents (Vitruvius, Edison, Nasmyth) handle the classification, shop-design, and machine-shop judgment tasks that reward deep reasoning. Sonnet agents (Brunel-TR, Taylor, Rose, Crawford) handle the history, measurement, ethnography, and philosophical framing tasks where the frameworks are well-established and the reasoning is more bounded. The 3/4 split matches the math and business departments and keeps the token budget practical.

### Why this team structure

The three teams cover three distinct query shapes. Full analysis needs all seven lenses. Workshop redesign needs the shop-and-machine core plus Crawford for framing. Pedagogy needs Rose and Crawford with Nasmyth's grounding. Teams are not exclusive — Vitruvius can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary

Only Vitruvius speaks to the user. Other agents communicate through Vitruvius via internal dispatch. This is enforced by the `is_capcom: true` flag on Vitruvius in `chipset.yaml` — only one agent may carry this flag.

## 10. Historical Transparency

The trades department uses historical names for mnemonic and educational value. Two figures on the roster have legacies that require transparent handling.

- **Frederick W. Taylor** developed time-study methods with real technical content and deployed them in a context of adversarial labor relations that the labor movement resisted for good reasons. Watertown, Braverman, Rose, and Crawford are part of the record. The agent's output includes the labor framing as a core element, not a postscript. The Toyota Production System is named as a worker-participative alternative to classical Taylorism.
- **Marc Brunel** designed the Portsmouth Block Mills, the first mechanized mass-production line in history. The same design displaced 100 skilled craftsmen per 10 unskilled operators. The skill-transfer tradeoff is named in the agent's output, not hidden. The `-tr` suffix distinguishes this agent from the engineering department's `brunel` (Isambard Kingdom Brunel, Marc's son).

We include both because the technical content is valuable and teaching trades history honestly requires not pretending that every figure was an uncomplicated hero. Users who prefer different names can rename the agents — the template pattern supports this.

## 11. Relationship to Other Departments

The trades department complements several other departments:

- **Engineering department** handles structural, electrical, aerospace, mechanical, materials, and pedagogy at the engineering-design level. Trades handles the shop and craft side of the same problems; engineering handles the design side. The two Brunel agents (Marc in trades, Isambard in engineering) are an explicit example of this division.
- **Business department** handles the management and strategic framing around which a shop operates. A shop's decision to mechanize is a trades question in its engineering content and a business question in its economic framing.
- **Materials science department** handles the fundamental material properties; trades handles the craft-level use of those properties, including the traditional allowances that predate and sometimes contradict the laboratory data.
- **Education department** handles general pedagogy; the trades practice team handles craft-specific pedagogy where the observe/practice/correct loop is the core method rather than the classroom.

Future integration could formalize cross-department referrals via a dispatch protocol so that, for example, a trades-analysis-team could call out to an engineering structural specialist for a sub-question without leaving the trades session context.
