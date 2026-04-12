---
name: home-economics-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/home-economics-department/README.md
description: >
  Coordinated home-economics department — seven named agents, six
  knowledge skills, three teams. Forked from the department template
  pattern first instantiated by math-department. Habitability-first
  discipline inherited from Ellen Swallow Richards.
superseded_by: null
---

# Home Economics Department

## 1. What is the Home Economics Department?

The Home Economics Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured household support across habitability, nutrition, cooking technique, household economics, time and motion, and sustainable pedagogy. It is a direct instantiation of the "department template pattern" established by the math department: a router-topology architecture in which a single chair agent classifies incoming queries and dispatches them to named specialists whose work products are persisted as Grove records linked to the college concept graph.

Where the math department's specialists are named after historical mathematicians whose work maps to their roles (Euclid for proof, Gauss for computation, Noether for structure), the home economics department is named after historical figures in the discipline and its adjacent crafts: Richards for the chair (because she founded home economics as an academic discipline and gave it its sanitary-engineering frame), Gilbreth for motion study (because she applied scientific management to the household in her own books and her own household of twelve), Fisher-he for food writing (because M.F.K. Fisher redefined food writing as a literary form), Beecher for historical foundations, Child for cooking technique, Waters for seasonal and ingredient-first planning, and Liebhardt for pedagogy.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/home-economics-department .claude/chipsets/home-economics-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Richards (the router agent) classifies the query along four dimensions — subsystem, decision type, habitability impact, and user level — and dispatches to the appropriate specialist agent. Habitability is always audited before efficiency or aesthetics; that discipline is the chipset's founding commitment.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/home-economics-department/chipset.yaml', 'utf8')).name)"
# Expected output: home-economics-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring judgment under ambiguity), four on Sonnet (for throughput-oriented analysis and pedagogy).

| Name         | Historical Figure              | Role                                                    | Model  | Tools                         |
|--------------|--------------------------------|---------------------------------------------------------|--------|-------------------------------|
| richards     | Ellen Swallow Richards         | Department chair — classification, habitability audit, routing, synthesis, economic framing | opus   | Read, Glob, Grep, Bash, Write |
| gilbreth     | Lillian Gilbreth               | Motion study and ergonomics specialist — task decomposition, routine chart, waste therbligs | opus   | Read, Grep, Bash, Write       |
| fisher-he    | M.F.K. Fisher (Mary Frances)   | Food writing and sensory specialist — sensory description, narrative recipes, experiential framing | opus   | Read, Grep, Write             |
| beecher      | Catharine Beecher              | Historical foundations and curriculum specialist — lineage grounding, curriculum sequence | sonnet | Read, Grep, Write             |
| child        | Julia Child                    | Cooking technique specialist — technique guide, verification, diagnosis, substitution | sonnet | Read, Grep, Write             |
| waters       | Alice Waters                   | Seasonal and ingredient-first specialist — weekly meal plan, farm-to-table framing | sonnet | Read, Grep, Write             |
| liebhardt    | Carol Liebhardt                | Pedagogy and habit-formation specialist — teaching sequence, retros, documentation | sonnet | Read, Grep, Write             |

Richards is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Richards.

**Two notes on the roster.** First, Gilbreth appears here rather than Marion Nestle. Nestle's career work is food politics, public health nutrition, and academic food science, which belong to the nutrition department as its academic home. Gilbreth's work is home-economic in the root sense — the application of scientific management to the work of running a household — and is the better fit for this department's motion-study specialist role. Second, the `fisher-he` agent carries a `-he` suffix (for home-economics) specifically to disambiguate from the `fisher` agent in `examples/agents/data-science/fisher`, which represents R.A. Fisher, the British statistician and geneticist. The two Fishers are no relation, and the suffix prevents the name collision while preserving both agents' reachability.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                                | Domain         | Trigger Patterns                                                         | Agent Affinity               |
|--------------------------------------|----------------|--------------------------------------------------------------------------|------------------------------|
| household-systems-design             | home-economics | kitchen design, work triangle, storage, room layout, habitability, ventilation, mold | richards, beecher, gilbreth  |
| nutrition-and-meal-planning          | home-economics | meal plan, weekly menu, nutrition, food budget, leftovers, food safety    | waters, child, fisher-he     |
| food-technique-fundamentals          | home-economics | cooking technique, sauté, braise, roast, emulsion, knife work, recipe failure | child, waters, fisher-he     |
| household-economics-and-budgeting    | home-economics | budget, household spending, emergency fund, true cost, debt payoff        | richards, beecher, liebhardt |
| time-and-motion-in-the-home          | home-economics | routine, motion study, therblig, task sharing, family chores, workflow    | gilbreth, liebhardt, richards|
| sustainable-household-pedagogy       | home-economics | teaching kids, family retro, habit formation, home-ec curriculum          | liebhardt, beecher, waters   |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                              | Agents                                                            | Use When                                                   |
|-----------------------------------|-------------------------------------------------------------------|------------------------------------------------------------|
| home-economics-analysis-team      | richards, gilbreth, fisher-he, beecher, child, waters, liebhardt  | Multi-subsystem overhaul, new-household setup, life-stage transition |
| home-economics-workshop-team      | richards, waters, child, liebhardt                                | Meal plan overhaul, kitchen setup, budget rollout, one-skill teaching |
| home-economics-practice-team      | richards, gilbreth, waters, liebhardt                             | Ongoing monthly improvement cycles, seasonal rotation      |

**home-economics-analysis-team** is the full department. Use it for problems that span multiple household subsystems or require the broadest possible expertise.

**home-economics-workshop-team** pairs the chair with the planning-technique-pedagogy triangle (Waters, Child, Liebhardt). Use it when the primary goal is a thorough treatment of one deep household question rather than a multi-subsystem scan.

**home-economics-practice-team** is the operational pipeline. Gilbreth diagnoses, Waters designs the revised practice, Liebhardt embeds the habit. Designed for iterative monthly or quarterly invocation as part of an ongoing improvement program.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `home-economics-department` namespace. Five record types are defined:

| Record Type              | Produced By                           | Key Fields                                                       |
|--------------------------|---------------------------------------|------------------------------------------------------------------|
| HomeEconomicsAnalysis    | gilbreth, richards, child, fisher-he  | Motion study, waste therbligs, habitability audit, technique diagnosis |
| HomeEconomicsPractice    | waters, gilbreth, liebhardt           | Weekly meal plan, routine chart, kitchen design, teaching program |
| HomeEconomicsReview      | richards, fisher-he                   | Plan or routine critiques, artifact reviews                       |
| HomeEconomicsExplanation | liebhardt, beecher, child, fisher-he  | Level-appropriate teaching, historical grounding, sensory description |
| HomeEconomicsSession     | richards                              | Session log, classification, habitability audit, work product links |

Records are content-addressed and immutable once written. HomeEconomicsSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college home-economics department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a HomeEconomicsExplanation is produced, the chipset can automatically generate a Try Session (interactive practice) based on the explanation content and the learner's current position.
- **Learning pathway updates**: Completed analyses, practices, and explanations update the learner's progress along college-defined pathways.
- **Six wings** map to the college home-economics department structure:
  1. Household Systems & Habitability
  2. Nutrition & Meal Planning
  3. Cooking Technique & Craft
  4. Household Economics & Budgeting
  5. Time, Motion & Routine
  6. Pedagogy & Sustainable Practice

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The home-economics department is one instantiation of the department template pattern. To create a department for another applied domain, follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/home-economics-department examples/chipsets/newdomain-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure references. Select figures whose contributions map to the specialist roles and whose work teaches domain history.

### Step 3: Replace skills with domain-appropriate content

Swap the six home-economics skills for domain equivalents. Each skill needs a domain value, a description, a triggers list, and agent affinity mapping.

### Step 4: Define new Grove record types

Replace the five `HomeEconomicsX` record types with domain-appropriate types. The minimum is an analysis type, a practice/construct type, a review type, an explanation type, and a session type.

### Step 5: Map to the target college department

Update the `college` section — set department, wings, and read/write permissions.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The six default gates are generic enough for most departments. Update `benchmark.domains_covered` for the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Richards) as the entry point for all queries. Three benefits:

1. **Habitability audit first**: Richards audits habitability before any specialist work begins, preventing the department from optimizing a kitchen in a moldy house.
2. **Classification**: Richards determines which subsystem(s) a query touches before dispatching, preventing wasted work by non-relevant agents.
3. **CAPCOM boundary**: The user interacts with exactly one agent, reducing cognitive load and providing a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (richards, gilbreth, fisher-he): These roles require judgment under ambiguity. Classification with habitability audit (Richards), motion study and routine design (Gilbreth), and sensory and experiential framing (Fisher-he) all involve multi-step reasoning where errors compound.
- **Sonnet agents** (beecher, child, waters, liebhardt): These roles are more framework-driven. Historical grounding, technique application, seasonal planning, and pedagogical sequencing all benefit from fast turnaround over deep reasoning.

This 3/4 split keeps the token budget practical while preserving quality where it matters most. It matches the math and business departments' ratio.

### Why this team structure

The three teams cover the three most common home-economics query shapes:

- **Full analysis**: needs every lens (all 7 agents, parallel) for multi-subsystem household questions.
- **Strategic workshop**: needs the planning-technique-pedagogy triangle (4 agents, parallel) for a deep dive on one question.
- **Operational practice**: needs the diagnose-design-embed pipeline (4 agents, sequential) for ongoing improvement work.

Teams are not exclusive. Richards can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### Habitability-first discipline

Richards's classification includes a habitability impact dimension, and the chair halts the normal routing when a habitability concern is detected. This discipline is inherited directly from Ellen Swallow Richards's founding argument that household science begins with the conditions for human health — air, water, light, temperature, quiet, cleanliness — before any efficiency or aesthetic optimization. An efficient kitchen in a moldy house is a worse design than an awkward kitchen in a clean, well-ventilated one.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Richards speaks to the user. Other agents communicate through Richards via internal dispatch. This is enforced by the `is_capcom: true` flag on Richards in `chipset.yaml` — only one agent in the chipset may carry this flag.

## 10. Fisher-he Suffix Discipline

One agent on this roster carries a suffixed name: `fisher-he`. The suffix is not decorative; it is load-bearing disambiguation.

The `fisher` name without a suffix is already held by the R.A. Fisher agent in `examples/agents/data-science/fisher`, which represents Ronald Aylmer Fisher (1890-1962), the British statistician and geneticist whose work founded modern inferential statistics. That agent handles null hypothesis significance testing, ANOVA, experimental design, and the statistical foundations of genetics.

The home-economics department's `fisher-he` agent represents Mary Frances Kennedy Fisher (1908-1992), the American food writer. The two Fishers are no relation, share a surname by coincidence, and represent entirely different intellectual traditions. A query about the taste and texture of a soup goes to `fisher-he`; a query about whether soup preferences differ significantly between demographic groups goes to `fisher`.

The `-he` suffix marks this scoping in every place the agent is referenced: the directory name, the frontmatter `name` field, the `first_path`, cross-references in the chipset YAML, cross-references in the team READMEs, and the disambiguation note inside the agent's own `## Historical Connection` section. Evaluation gate `fisher_he_suffix_applied` blocks deployment if the suffix is missing anywhere.

## 11. Historical Transparency

The home economics department uses historical names for mnemonic and educational value. Three notes on the roster:

- **Ellen Swallow Richards**'s sanitary-engineering career was grounded in the science of her day, and her opposition to eugenics is on the record; her term *euthenics* was coined specifically as a non-eugenic alternative framing. The agent inherits the euthenic (controllable environment) frame, not the specifically moral tone of some of her rhetoric.
- **Catharine Beecher**'s 1869 framework is explicitly gendered and religiously framed, reflecting its nineteenth-century context. The agent handles this honestly as historical evidence and does not reproduce the framing normatively. What the agent inherits is the engineering-of-the-household insight, not the Victorian-era frame.
- **Alice Waters**'s Chez Panisse and Edible Schoolyard work has been critiqued on cost and access grounds — farm-to-table is not always affordable for all households. The agent inherits the seasonal-and-ingredient-first discipline while honoring budget as a hard input, so that seasonal eating is made accessible rather than presented as a luxury.

## 12. Relationship to Other Departments

The home economics department complements several other departments:

- **Nutrition department** handles medical nutrition, public-health food science, and therapeutic diets. Home economics handles household-scale nutrition planning within the nutrition department's framework; Marion Nestle belongs organizationally to nutrition, not home economics.
- **Business department** handles organizational and commercial economics. Home economics borrows its economic framing and applies it to the household unit.
- **Data science department** contains the `fisher` (R.A. Fisher) agent whose statistical methods are used to analyze household survey data and food-preference studies. The `-he` suffix on the home-economics Fisher prevents collision.
- **Agriculture and food systems department** (when it exists) handles the upstream farming and food-system questions that Waters's farm-to-table framing touches on.

Future integration could formalize cross-department referrals via a dispatch protocol so that, for example, a home-economics-analysis-team could call out to a nutrition specialist for a therapeutic-diet sub-question without leaving the home economics department's session context.
