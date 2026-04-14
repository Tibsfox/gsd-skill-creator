---
name: learning-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/learning-department/README.md
description: >
  Coordinated learning department — seven named agents, six knowledge
  skills, three teams. Forked from the department template pattern
  first instantiated by math-department. Four agents carry a "-learn"
  suffix to disambiguate from siblings in other departments.
superseded_by: null
---

# Learning Department

## 1. What is the Learning Department?

The Learning Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured instructional-design support across cognitive-level calibration, developmental readiness, scaffolding, deliberate practice, mindset and motivation, experiential learning, and prepared environments. It is a direct instantiation of the department template pattern established by the math department: a router-topology architecture in which a single chair agent (Bloom) classifies incoming queries and dispatches them to named specialists whose work products are persisted as Grove records linked to the college concept graph.

Where the math department's specialists are named after historical mathematicians whose work maps to their roles (Euclid for proof, Gauss for computation, Noether for structure), the learning department is named after historical figures whose research programs map to the specialist roles: Bloom for the chair (because his career was spent synthesizing and coordinating across traditions, and his taxonomy is the most widely-used classification in the field), Ericsson for deliberate practice, Dweck for mindset and motivation, Piaget for constructivism and development, Vygotsky for ZPD and scaffolding, Dewey for experiential learning and reflective inquiry, and Montessori for prepared environments.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/learning-department .claude/chipsets/learning-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Bloom (the router agent) classifies the query along four dimensions — learner target, cognitive level, problem type, and intervention scope — and dispatches to the appropriate specialist agent. No explicit activation command is needed; the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/learning-department/chipset.yaml', 'utf8')).name)"
# Expected output: learning-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring judgment under ambiguity), four on Sonnet (for framework-driven analysis).

| Name              | Historical Figure    | Role                                                           | Model  | Tools                         |
|-------------------|----------------------|----------------------------------------------------------------|--------|-------------------------------|
| bloom             | Benjamin Bloom       | Department chair — classification, routing, synthesis, objective design | opus   | Read, Glob, Grep, Bash, Write |
| ericsson          | K. Anders Ericsson   | Deliberate practice specialist — drill design, edge calibration, plateau escape | opus   | Read, Grep, Bash              |
| dweck             | Carol Dweck          | Mindset specialist — attribution diagnosis, feedback-language audit, intervention scripts | opus   | Read, Grep, Write             |
| piaget-learn      | Jean Piaget          | Developmental specialist — constructivism, schema diagnosis, disequilibrium design | sonnet | Read, Grep                    |
| vygotsky-learn    | Lev Vygotsky         | Scaffolding specialist — ZPD assessment, scaffold plans, fading schedules | sonnet | Read, Grep                    |
| dewey-learn       | John Dewey           | Experiential specialist — continuity/interaction evaluation, reflective cycle, PBL audit | sonnet | Read, Write                   |
| montessori-learn  | Maria Montessori     | Prepared-environment specialist — environment design, materials, sensitive periods | sonnet | Read, Write                   |

Bloom is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Bloom.

## 4. The "-learn" Suffix — Sibling Disambiguation

Four of the seven agents carry a `-learn` suffix because their historical figures are already represented elsewhere in the college as specialists with different focuses. This is the first department to require suffix discipline at this scale, and the pattern is worth documenting for future departments that run into similar collisions.

| Learning-department agent | Suffix reason | Sibling agent(s) elsewhere |
|---------------------------|---------------|-----------------------------|
| `piaget-learn` | Piaget's learning-design applications | `examples/agents/psychology/piaget` — broader cognitive-development research program |
| `vygotsky-learn` | Vygotsky's ZPD and scaffolding as a learning-design tool | `examples/agents/psychology/vygotsky` — broader sociocultural research program |
| `dewey-learn` | Dewey's educational philosophy as a learning-design tool | `examples/agents/philosophy/dewey` — pragmatist philosophy; `examples/agents/critical-thinking/dewey-ct` — reflective-thinking as a general inquiry method |
| `montessori-learn` | Montessori's prepared-environment pedagogy as a learning-design tool | `examples/agents/history/montessori` — her biography and historical influence |

The suffix is applied consistently inside this department:

- **Directory:** `examples/agents/learning/<name>-learn/AGENT.md`
- **Frontmatter `name`:** `<name>-learn`
- **Frontmatter `first_path`:** points to the suffixed directory
- **Cross-references:** every mention of the four suffixed agents inside this department uses the suffix. Bare unsuffixed references to these four names inside this department are errors.
- **Disambiguation notes:** each suffixed agent's `## Historical Connection` section includes an explicit disambiguation note pointing to the sibling(s) in other departments, so a user who routes into the wrong department can be redirected.

The discipline is enforced at commit time by a grep check that flags bare references to the four names inside the learning department's files. The only permitted exceptions are the disambiguation notes themselves, which intentionally reference the sibling paths.

When forking this chipset for another department, decide whether the suffix applies. If the historical figures are unique to your new department, drop the suffixes. If they also collide, apply the pattern consistently.

## 5. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                                  | Domain   | Trigger Patterns                                             | Agent Affinity                |
|----------------------------------------|----------|--------------------------------------------------------------|-------------------------------|
| bloom-taxonomy-and-mastery             | learning | objective, bloom, mastery, cognitive level, formative assessment | bloom, ericsson               |
| deliberate-practice-design             | learning | deliberate practice, drill, plateau, fluency, feedback loop  | ericsson, bloom               |
| mindset-and-motivation                 | learning | mindset, motivation, not a math person, praise, growth mindset | dweck, bloom                  |
| constructivism-and-schema              | learning | schema, constructivism, misconception, assimilation          | piaget-learn, bloom           |
| zpd-and-scaffolding                    | learning | ZPD, scaffold, how much help, fade, peer tutor               | vygotsky-learn, bloom         |
| prepared-environment-and-experience    | learning | prepared environment, experiential, PBL, reflective, self-correcting | dewey-learn, montessori-learn |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 6. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                       | Agents                                                                     | Use When                                                 |
|----------------------------|----------------------------------------------------------------------------|----------------------------------------------------------|
| learning-analysis-team     | bloom, piaget-learn, vygotsky-learn, ericsson, dweck, dewey-learn, montessori-learn | Curriculum reviews, multi-lens diagnoses, new-to-learning-design questions |
| learning-workshop-team     | bloom, piaget-learn, vygotsky-learn, dweck                                 | Focused unit design, one-learner intervention plans      |
| learning-practice-team     | bloom, ericsson, vygotsky-learn, montessori-learn                          | Procedural-fluency drill pipelines, plateau escape       |

**learning-analysis-team** is the full department. Use it for problems that span multiple lenses or require the broadest possible expertise.

**learning-workshop-team** pairs the chair with developmental, scaffolding, and motivation specialists for focused design work. Use it when the question is clear in scope but needs more than one lens.

**learning-practice-team** is the drill pipeline. Ericsson designs the drill, Vygotsky-learn supplies the entry scaffolds, and Montessori-learn supplies the materials and workspace. Designed for repeated invocation as procedural gaps are identified through the school year.

## 7. Grove Record Types

All department work products are persisted as Grove records under the `learning-department` namespace. Five record types are defined:

| Record Type         | Produced By                                   | Key Fields                                                       |
|---------------------|------------------------------------------------|------------------------------------------------------------------|
| LearningAnalysis    | piaget-learn, vygotsky-learn, ericsson, dweck  | Diagnostic findings, zone verdict, schema analysis, attribution  |
| LearningDesign      | bloom, ericsson, vygotsky-learn, dweck, dewey-learn, montessori-learn | Lesson plans, drill pipelines, scaffold plans, intervention scripts, unit designs |
| LearningReview      | dewey-learn, montessori-learn, piaget-learn    | Unit reviews, PBL audits, environment audits, lesson-fit reviews |
| LearningExplanation | bloom                                           | Level-appropriate teaching artifacts at specific Bloom cells     |
| LearningSession     | bloom                                           | Session log, classification metadata, work product links, user role |

Records are content-addressed and immutable once written. LearningSession records link all work products from a single interaction, providing an audit trail from query to result.

## 8. College Integration

The chipset connects to the college learning department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a LearningDesign or LearningExplanation is produced, the chipset can automatically generate a Try Session (interactive practice) based on the content and the learner's current position.
- **Learning pathway updates**: Completed analyses, designs, and reviews update the learner's progress along college-defined pathways.
- **Six wings** map to the college learning department structure:
  1. Cognitive Levels & Objective Design
  2. Developmental Readiness & Schema
  3. Scaffolding & Zone of Proximal Development
  4. Deliberate Practice & Mastery
  5. Motivation, Mindset & Attribution
  6. Experiential Learning & Prepared Environment

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 9. Customization Guide

The learning department is one instantiation of the department template pattern. To create a department for another applied domain, follow these steps.

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/learning-department examples/chipsets/newdomain-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical-figure references. Select figures whose contributions map to the specialist roles and whose work teaches the discipline's history.

### Step 3: Handle collisions

Check whether any of your chosen names already exist elsewhere in `examples/agents/`. If so, apply a suffix consistently — directory, frontmatter name, first_path, and all cross-references. The `-learn` pattern in this department is the reference.

### Step 4: Replace skills with domain-appropriate content

Swap the six learning skills for domain equivalents. Each skill needs a domain value, a description, a triggers list, and agent affinity mapping.

### Step 5: Define new Grove record types

Replace the five `LearningX` record types with domain-appropriate types. The minimum is a diagnostic type, a design/artifact type, a review type, an explanation type, and a session type.

### Step 6: Map to the target college department

Update the `college` section — set department, wings, and read/write permissions.

### Step 7: Update evaluation gates

The six default gates are generic enough for most departments. Update `benchmark.domains_covered` for the new domain areas.

## 10. Architecture Notes

### Why router topology

The router topology places a single agent (Bloom) as the entry point for all queries. Three benefits:

1. **Classification**: Bloom determines which lenses a query touches before dispatching, preventing wasted work by non-relevant agents.
2. **Taxonomy framing**: Bloom is specifically chosen as the chair because his matrix (learner, level, type, scope) is the framing most learning-design questions need before any analysis.
3. **CAPCOM boundary**: The user interacts with exactly one agent, reducing cognitive load and providing a consistent communication style calibrated to user role (teacher, parent, curriculum designer, self-learner).

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (Bloom, Ericsson, Dweck): These roles require judgment under ambiguity. Classification and synthesis (Bloom), drill diagnosis and calibration under uncertainty (Ericsson), and attribution and motivation reading (Dweck) all involve multi-step reasoning where errors compound.
- **Sonnet agents** (Piaget-learn, Vygotsky-learn, Dewey-learn, Montessori-learn): These roles are more framework-driven. Developmental-fit checking, ZPD dynamic assessment, PBL-criteria audit, and environment-checklist audit all benefit from fast turnaround and clear procedures.

This 3/4 split keeps the token budget practical while preserving quality where it matters most. It matches the math and business department ratios.

### Why this team structure

The three teams cover the three most common learning-design query shapes:

- **Full analysis**: needs every lens (all 7 agents) for multi-dimensional curriculum reviews and diffuse diagnoses.
- **Design workshop**: needs the design core (4 agents, pipeline) for focused unit design and one-learner intervention plans.
- **Practice pipeline**: needs the drill core (4 agents, pipeline) for procedural-fluency work and plateau escapes.

Teams are not exclusive. Bloom can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Bloom speaks to the user. Other agents communicate through Bloom via internal dispatch. This is enforced by the `is_capcom: true` flag on Bloom in `chipset.yaml` — only one agent in the chipset may carry this flag.

## 11. Research Honesty

The learning department draws on research traditions whose replication records vary. The chipset aims to represent the current state honestly rather than to overpromise.

- **Bloom's taxonomy and mastery learning**: The taxonomy remains the most widely-used classification in the field and is descriptively robust. The two-sigma effect for tutoring is a real, large effect on carefully-controlled studies, though classroom-scale implementations rarely match it fully.
- **Deliberate practice (Ericsson)**: The four conditions framework is well-supported. The "10,000 hours" number is a simplification that Ericsson himself disputed. Expert-performance research consistently shows that structure, feedback, and edge difficulty matter more than raw hours.
- **Mindset theory (Dweck)**: The core findings on praise language and attribution replicate. Effect sizes in classroom interventions are small but real, concentrated in lower-performing students and supportive environments. The "silver bullet" framing popular in the 2010s was wrong; the underlying framework is not.
- **Piaget**: Stages are approximate descriptive tools, softened considerably by modern research showing earlier competencies in infants and more variation in adults. The constructivist mechanism (assimilation, accommodation) remains a useful working model.
- **Vygotsky**: ZPD and scaffolding are well-supported by modern tutoring research and cognitive-apprenticeship findings. The original sociocultural framework has influenced contemporary peer-tutoring and group-learning research.
- **Dewey and Montessori**: Both are philosophically and pedagogically influential. Modern research on project-based learning (Larmer, Mergendoller) and Montessori outcomes (Lillard) provides partial empirical support for both traditions.

When a specialist's recommendation rests on a contested finding, the agent notes this honestly and Bloom preserves the caveat in the user-facing synthesis. Practitioners deserve to know when they are applying a strong finding versus one-lever-among-many.

## 12. Relationship to Other Departments

The learning department complements several other departments:

- **Psychology department** handles the broader research programs that underlie this department's applied work. `psychology/piaget` and `psychology/vygotsky` cover the primary research records; `learning/piaget-learn` and `learning/vygotsky-learn` cover the learning-design applications.
- **Philosophy department** handles Dewey's pragmatism and philosophy of education at the foundational level. `philosophy/dewey` covers the philosophy; `learning/dewey-learn` covers the learning-design applications.
- **Critical thinking department** handles Dewey's reflective-thinking framework as a general inquiry method. `critical-thinking/dewey-ct` covers inquiry generally; `learning/dewey-learn` covers inquiry inside classroom learning design.
- **History department** handles biography and historical influence of educational reformers. `history/montessori` covers Maria Montessori's life and influence; `learning/montessori-learn` covers the applied pedagogy.
- **Nutrition, physical-education, and home-economics departments** share concerns with learning department on child-development, habits, and applied daily-life skills.

Future integration could formalize cross-department referrals via a dispatch protocol so that, for example, a learning-analysis-team could call out to a psychology specialist for a clinical question without leaving the learning department's session context.

## 13. Suffix Map at a Glance

Quick reference for anyone working across departments:

| Topic | Learning department agent | Where to go for broader context |
|-------|---------------------------|---------------------------------|
| Cognitive development (applied) | `piaget-learn` | `psychology/piaget` |
| Sociocultural theory (applied) | `vygotsky-learn` | `psychology/vygotsky` |
| Pragmatist philosophy of education | `dewey-learn` | `philosophy/dewey` |
| General reflective inquiry | `dewey-learn` | `critical-thinking/dewey-ct` |
| Montessori pedagogy | `montessori-learn` | `history/montessori` |

Inside the learning department's own files, always use the `-learn` form for the four suffixed agents. The unsuffixed form refers to the sibling agent in another department, and should only appear in disambiguation notes.
