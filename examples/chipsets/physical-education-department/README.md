---
name: physical-education-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/physical-education-department/README.md
description: >
  Coordinated physical education department — seven named agents, six
  knowledge skills, three teams. Forked from the department template
  pattern first instantiated by math-department.
superseded_by: null
---

# Physical Education Department

## 1. What is the Physical Education Department?

The Physical Education Department chipset is a coordinated set of reasoning
agents, domain skills, and pre-composed teams that together provide structured
physical education support across movement, fitness, coaching, pedagogy,
inclusion, and lifetime physical practice. It is a direct instantiation of the
"department template pattern" established by the math department: a
router-topology architecture in which a single chair agent classifies incoming
queries and dispatches them to named specialists whose work products are
persisted as Grove records linked to the college concept graph.

Where the math department's specialists are named after historical
mathematicians whose work maps to their roles (Euclid for proof, Gauss for
computation, Noether for structure), the physical education department is named
after historical figures in the development of PE whose work maps to the
specialist roles: Naismith for the chair (because he invented basketball
explicitly as a physical-education problem, and his integrated view of PE as
whole-person development matches the chair's framing role), Kenneth Cooper for
cardiovascular science, Jesse Feiring Williams for curriculum philosophy,
Berenson for inclusion and gender equity, Sørensen for lifetime fitness and
aerobic dance, Wooden for coaching craft and strength-and-conditioning, and
Siedentop for pedagogy and the Sport Education model.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/physical-education-department .claude/chipsets/physical-education-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Naismith (the router agent) classifies the query along four
dimensions — domain, learner age, activity type, and educational intent — and
dispatches to the appropriate specialist agent. No explicit activation command
is needed; the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/physical-education-department/chipset.yaml', 'utf8')).name)"
# Expected output: physical-education-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring
judgment under ambiguity), four on Sonnet (for framework-driven analysis).

| Name                   | Historical Figure       | Role                                                                          | Model  | Tools                         |
|------------------------|-------------------------|-------------------------------------------------------------------------------|--------|-------------------------------|
| naismith               | James Naismith          | Department chair — classification, routing, synthesis, safety framing          | opus   | Read, Glob, Grep, Bash, Write |
| kenneth-cooper         | Kenneth Cooper, MD      | Cardiovascular specialist — aerobic science, FITT prescription, assessment    | opus   | Read, Grep, Bash              |
| jesse-feiring-williams | Jesse Feiring Williams  | Curriculum philosophy — whole-child framing, purpose, principle-based critique | opus   | Read, Grep, Write             |
| berenson               | Senda Berenson          | Inclusion specialist — gender equity, adapted PE, universal design            | sonnet | Read, Grep, Write             |
| sorensen               | Jackie Sørensen         | Lifetime fitness specialist — aerobic dance, group fitness, lifelong movement | sonnet | Read, Grep, Write             |
| wooden                 | John Wooden             | Coaching specialist — practice design, strength and conditioning, mentoring   | sonnet | Read, Grep, Write             |
| siedentop              | Daryl Siedentop         | Pedagogy specialist — Sport Education model, unit design, assessment           | sonnet | Read, Grep, Write             |

Naismith is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Naismith.

Two notes on the roster. First, Senda Berenson's 1892 women's basketball rules
were both a genuine opening for women in collegiate sport and a structural
constraint of their era. The department teaches both truths, and the Berenson
agent's AGENT.md treats the historical record directly. Second, John Wooden's
legacy as a coach is sometimes misrepresented as charisma-driven; the
Gallimore-Tharp observational data from 1974--75 showed a disciplined teacher
whose methods are recoverable and teachable, and the Wooden agent inherits
that evidence-based picture rather than the mythology.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                             | Domain            | Trigger Patterns                                                       | Agent Affinity                  |
|-----------------------------------|-------------------|------------------------------------------------------------------------|---------------------------------|
| movement-fundamentals             | physical-education| motor skill, locomotor, manipulative, catching, throwing, milestone    | naismith, siedentop             |
| cardiovascular-fitness            | physical-education| cardio, aerobic, cooper test, VO2max, heart rate, FITT, endurance      | kenneth-cooper, naismith        |
| strength-and-conditioning         | physical-education| strength, resistance, periodization, 1RM, plyometric, power            | wooden, kenneth-cooper          |
| sport-education-pedagogy          | physical-education| sport education, unit plan, curriculum, GPAI, PE assessment, roles     | siedentop, jesse-feiring-williams |
| coaching-and-teaching             | physical-education| coaching, practice design, pyramid of success, feedback, drill         | wooden, siedentop               |
| inclusive-physical-education      | physical-education| inclusion, adapted PE, gender equity, disability, universal design, aerobic dance, group fitness, lifetime fitness | berenson, sorensen, siedentop |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to more
than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common PE problem shapes.

| Team                                 | Agents                                                          | Use When                                                     |
|--------------------------------------|-----------------------------------------------------------------|--------------------------------------------------------------|
| physical-education-analysis-team     | naismith, kenneth-cooper, jesse-feiring-williams, berenson, sorensen, wooden, siedentop | Multi-domain, program-level, or transformation-scale requests |
| physical-education-workshop-team     | naismith, jesse-feiring-williams, siedentop, berenson           | Sport Education unit design, assessment rubric, unit transformation |
| physical-education-practice-team     | naismith, kenneth-cooper, wooden, sorensen                      | In-season practice, integrated conditioning, coach mentoring  |

**physical-education-analysis-team** is the full department. Use it for
problems that span multiple PE sub-domains or require the broadest possible
expertise.

**physical-education-workshop-team** pairs the chair with philosophy
(Williams), pedagogy (Siedentop), and inclusion (Berenson). Use it when the
primary goal is a rigorous single-unit design or assessment rubric with whole-
child intent.

**physical-education-practice-team** is the operational pipeline. Cooper
provides the physiology, Wooden provides the practice delivery, Sørensen
provides the group fitness variant when relevant. Designed for repeated
invocation through a season.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`physical-education-department` namespace. Five record types are defined:

| Record Type                   | Produced By                                     | Key Fields                                                         |
|-------------------------------|-------------------------------------------------|--------------------------------------------------------------------|
| PhysicalEducationAnalysis     | kenneth-cooper, berenson, naismith              | Fitness assessment, motor gap diagnosis, equity audit, stage assessment |
| PhysicalEducationPractice     | siedentop, wooden, sorensen, berenson, kenneth-cooper | Lesson plan, unit plan, practice plan, training program, class plan    |
| PhysicalEducationReview       | jesse-feiring-williams, berenson, siedentop     | Program critique, unit review, inclusion review, philosophical critique |
| PhysicalEducationExplanation  | jesse-feiring-williams, naismith                | Purpose statements, history lessons, concept explanations               |
| PhysicalEducationSession      | naismith                                        | Session log, classification metadata, work product links, timestamps    |

Records are content-addressed and immutable once written.
PhysicalEducationSession records link all work products from a single
interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college physical education department concept
graph:

- **Concept graph read/write**: Agents can read existing concept definitions
  and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a PhysicalEducationExplanation is produced,
  the chipset can automatically generate a Try Session based on the explanation.
- **Learning pathway updates**: Completed analyses, practices, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college physical education department structure:
  1. Movement and Motor Learning
  2. Fitness Science and Health Literacy
  3. Sport Pedagogy and Curriculum
  4. Coaching and Practice Design
  5. Inclusion, Equity, and Lifetime Activity

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The physical education department is one instantiation of the department
template pattern. To create a department for another applied domain (nutrition,
performing arts, outdoor education, etc.), follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/physical-education-department examples/chipsets/newdomain-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. Select figures whose contributions map to the specialist roles and
whose work teaches domain history. Diversity of tradition and era matters.

### Step 3: Replace skills with domain-appropriate content

Swap the six PE skills for domain equivalents. Each skill needs a domain value,
a description, a triggers list, and agent affinity mapping.

### Step 4: Define new Grove record types

Replace the five `PhysicalEducationX` record types with domain-appropriate
types. The minimum is a diagnostic type, a practice/artifact type, a review
type, an explanation type, and a session type.

### Step 5: Map to the target college department

Update the `college` section — set department, wings, and read/write permissions.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments. Update `benchmark.domains_covered` for the new
domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Naismith) as the entry point for
all queries. Three benefits:

1. **Classification**: Naismith determines which sub-domain(s) a query touches
   before dispatching, preventing wasted work by non-relevant agents.
2. **Safety framing**: PE recommendations often involve physical activity with
   real injury potential. A single point of safety review prevents specialist
   output from reaching the user without appropriate age and context framing.
3. **CAPCOM boundary**: The user interacts with exactly one agent, reducing
   cognitive load and providing a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (naismith, kenneth-cooper, jesse-feiring-williams): These
  roles require judgment under ambiguity. Classification and synthesis
  (Naismith), physiological prescription (Cooper), and philosophical critique
  (Williams) all involve multi-step reasoning where errors compound.
- **Sonnet agents** (berenson, sorensen, wooden, siedentop): These roles are
  framework-driven. Sport Education model application, practice design,
  adaptation, and group fitness class design all benefit from fast turnaround
  over deep deliberation.

This 3/4 split matches the math and business departments' ratio.

### Why this team structure

The three teams cover the three most common PE query shapes:

- **Full analysis**: needs every lens (all 7 agents) for multi-domain questions
  like program transformation or equity audits at scale.
- **Workshop**: needs philosophy + pedagogy + inclusion (4 agents, sequential)
  for rigorous single-unit or assessment design.
- **Practice delivery**: needs physiology + practice craft + group fitness
  (4 agents, parallel) for ongoing session-level work.

Teams are not exclusive. Naismith can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Naismith speaks to the
user. Other agents communicate through Naismith via internal dispatch. This is
enforced by the `is_capcom: true` flag on Naismith in `chipset.yaml` — only
one agent in the chipset may carry this flag.

## 10. Historical Transparency

The physical education department uses historical names for mnemonic and
educational value. Several of the seven have legacies that require transparent
handling.

- **James Naismith** invented basketball as a PE problem-solving exercise and
  spent most of his career as a teacher and athletic director at Kansas. His
  approach was integrated and pedagogically serious. His legacy is relatively
  uncomplicated within PE history.
- **Senda Berenson** opened women's collegiate basketball in 1892--96 under
  structural constraints (three-zone rules) that her era required. History
  evaluates both truths: the opening and the constraint. The Berenson agent
  teaches both.
- **Kenneth Cooper** developed the aerobic exercise framework while working
  for the US Air Force. His research is well-documented and his Cooper test
  remains widely used. His legacy within physical education and public health
  is substantial and largely uncontroversial.
- **Jesse Feiring Williams** produced the "education through the physical"
  framework that dominated mid-twentieth-century PE. His work has been
  extended and critiqued by subsequent scholars, and the Williams agent
  acknowledges those critiques rather than pretending the 1927 framework is
  complete.
- **Jackie Sørensen** developed aerobic dance in 1969 as a practical exercise
  program. Her contribution is well-documented in exercise science literature.
- **John Wooden**'s coaching methods were documented in detail by Gallimore
  and Tharp in 1974--75. The Wooden agent inherits the evidence-based picture
  (teacher with practice-design discipline) rather than the pop-culture
  mythology (motivational genius).
- **Daryl Siedentop** is a contemporary figure whose Sport Education model and
  teacher-effectiveness research are the backbone of modern PE pedagogy. His
  work is well-documented and widely adopted.

We include all seven because their contributions are pedagogically valuable
and teaching PE history honestly means naming the figures whose work shaped
the field. Users who prefer different names can rename the agents — the
template pattern supports this.

## 11. Relationship to Other Departments

The physical education department complements several other departments:

- **Nutrition department** handles food, macronutrients, hydration, and
  sports nutrition. PE borrows its recovery and fueling content.
- **Learning department** handles general learning theory that PE pedagogy
  draws on for skill acquisition, motor learning, and cognitive development.
- **Statistics department** handles quantitative methods that PE assessment
  draws on for fitness data, growth charts, and team statistics.
- **Medical and health science** (outside this department) handles sports
  medicine, injury rehabilitation, and clinical exercise physiology — topics
  explicitly excluded from this department's scope and referred out.

Future integration could formalize cross-department referrals via a dispatch
protocol so that, for example, a physical-education-practice-team could call
out to a nutrition specialist for a sports-nutrition sub-question without
leaving the PE department's session context.
