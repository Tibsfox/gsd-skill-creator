---
name: spatial-computing-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/spatial-computing-department/README.md
description: >
  Coordinated spatial computing department — seven named agents, six knowledge
  skills, three teams. Instance of the department template pattern for spatial
  reasoning, VR/AR, voxel building, responsive environments, and constructionist
  learning.
superseded_by: null
---

# Spatial Computing Department

## 1. What is the Spatial Computing Department?

The Spatial Computing Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured spatial computing support across VR, AR, voxel world-building, responsive environments, and constructionist pedagogy. It is one instantiation of the "department template pattern" in gsd-skill-creator: an architecture designed to be forked and remapped to any academic or professional domain. Incoming queries are classified by a router agent (Sutherland), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/spatial-computing-department .claude/chipsets/spatial-computing-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Sutherland (the router agent) classifies the query and dispatches to the appropriate specialist agent. No explicit activation command is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/spatial-computing-department/chipset.yaml', 'utf8')).name)"
# Expected output: spatial-computing-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep reasoning), four on Sonnet (for throughput-oriented technical work and pedagogy).

| Name         | Historical Figure     | Role                                          | Model  | Tools                        |
|--------------|-----------------------|-----------------------------------------------|--------|------------------------------|
| sutherland   | Ivan Sutherland       | Department chair — classification, routing, synthesis | opus   | Read, Glob, Grep, Bash, Write |
| engelbart    | Douglas Engelbart     | Augmentation and navigation specialist         | opus   | Read, Grep, Bash             |
| bret-victor  | Bret Victor           | Direct manipulation and dynamic representation | opus   | Read, Grep, Bash             |
| krueger      | Myron Krueger         | Responsive environments, artificial reality    | sonnet | Read, Bash                   |
| furness      | Tom Furness           | VR/HMD, Super Cockpit discipline, comfort      | sonnet | Read, Bash                   |
| azuma        | Ronald Azuma          | AR registration, tracking, display config      | sonnet | Read, Bash                   |
| papert-sp    | Seymour Papert        | Pedagogy — constructionism, microworlds        | sonnet | Read, Bash, Write            |

Sutherland is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Sutherland.

### Note on `papert-sp`

The pedagogy agent uses the name `papert-sp` (suffix `-sp` for "spatial") because `papert` already exists in the coding department (`examples/agents/coding/papert/`). Both represent Seymour Papert, but through different departmental lenses:

- **`coding/papert`** — programming pedagogy, Logo syntax, algorithm construction
- **`spatial-computing/papert-sp`** — spatial and embodied learning, microworld design in voxel/VR/AR systems, body-scale exercises

A consumer installing both chipsets sees two distinct agents that inherit from the same historical figure but serve different domains. Cross-references in this chipset use `papert-sp` throughout.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                                     | Domain            | Trigger Patterns                                                 | Agent Affinity                    |
|-------------------------------------------|-------------------|------------------------------------------------------------------|-----------------------------------|
| spatial-reasoning-fundamentals            | spatial-computing | coordinate, navigate, spatial reasoning, mental rotation         | sutherland, engelbart, papert-sp  |
| 3d-interaction-design                     | spatial-computing | interaction, manipulation, selection, gesture, controller, fitts | bret-victor, sutherland, krueger  |
| augmented-reality-tracking                | spatial-computing | augmented reality, ar, tracking, registration, slam              | azuma, sutherland, furness        |
| immersive-environment-design              | spatial-computing | vr environment, immersive, responsive environment, cave          | krueger, furness, sutherland      |
| world-building-block-paradigms            | spatial-computing | voxel, minecraft, build, block, prefab, blueprint                | papert-sp, engelbart, sutherland  |
| embodied-computing-and-constructionism    | spatial-computing | learn spatial, teach, exercise, microworld, constructionism      | papert-sp, krueger, engelbart     |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                                | Agents                                                                 | Use When                                                 |
|-------------------------------------|------------------------------------------------------------------------|----------------------------------------------------------|
| spatial-computing-analysis-team     | sutherland, engelbart, bret-victor, krueger, furness, azuma, papert-sp | Multi-wing, novel, or full-analysis requests            |
| spatial-computing-workshop-team     | bret-victor, engelbart, krueger, papert-sp                             | Interaction review and iterative refinement              |
| spatial-computing-practice-team     | azuma, furness, bret-victor, papert-sp                                 | Translating concepts into executable prototype specs    |

**spatial-computing-analysis-team** is the full department. Use it for problems that span multiple wings or require the broadest possible expertise.

**spatial-computing-workshop-team** pairs the directness critic (Bret Victor) with augmentation reasoning (Engelbart), body-first environment perspective (Krueger), and pedagogy (Papert-sp). Use it when the primary goal is reviewing an existing design iteratively.

**spatial-computing-practice-team** is the prototype pipeline. Azuma designs tracking, Furness designs comfort and hardware, Bret Victor designs interaction, Papert-sp designs onboarding. Use it when turning a concept into a buildable spec.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `spatial-computing-department` namespace. Five record types are defined:

| Record Type                    | Produced By                       | Key Fields                                                              |
|--------------------------------|-----------------------------------|-------------------------------------------------------------------------|
| SpatialComputingAnalysis       | engelbart, azuma                  | target, assessment, augmentation rating, recommendations                |
| SpatialComputingDesign         | bret-victor, krueger, furness, azuma | task, interaction flow, principles applied, alternatives considered |
| SpatialComputingReview         | bret-victor, engelbart            | artifact, directness score, violations, strengths, priority fixes       |
| SpatialComputingExplanation    | papert-sp                         | topic, target level, explanation body, prerequisites, follow-up exercises |
| SpatialComputingSession        | sutherland                        | session ID, queries, agents invoked, work product links, timestamps     |

Records are content-addressed and immutable once written. SpatialComputingSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college spatial-computing department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a SpatialComputingExplanation is produced, the chipset can automatically generate a Try Session based on the explanation content.
- **Learning pathway updates**: Completed analyses, designs, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college spatial-computing department structure:
  1. Spatial Foundations
  2. Building & Architecture
  3. Redstone Engineering
  4. Systems & Automation
  5. Collaborative Design

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The spatial computing department is a forkable instance of the department template. To create a department for an adjacent domain (embodied AI, robotics, ubiquitous computing), follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/spatial-computing-department examples/chipsets/embodied-ai-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure references. Watch for name collisions in the shared examples tree — if your new department would clash with an existing agent (like papert), use a suffix convention (`-sp`, `-co`, etc.).

### Step 3: Replace skills with domain-appropriate content

Swap the six spatial skills for domain equivalents. Each skill needs a `domain`, `description`, `triggers` list, and `agent_affinity` mapping.

### Step 4: Define new Grove record types

Replace the five SpatialComputingX record types with domain-appropriate types. Every department needs at minimum a Design type, a Review type, an Explanation type, and a Session type.

### Step 5: Map to the target college department

Update the `college` section with your target department name and wing structure.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section and add domain-specific checks.

## 9. Architecture Notes

### Why these seven figures

The roster spans the full history of spatial computing:

- **Sutherland (1963)** — founder. Sketchpad, first HMD, CAD ancestor.
- **Engelbart (1968)** — augmentation. NLS, mouse, hypertext, collaboration.
- **Krueger (1970s)** — artificial reality. VIDEOPLACE, body as input.
- **Furness (1982)** — professional VR. Super Cockpit, HITLab, comfort discipline.
- **Papert (1980)** — constructionism. Logo, Mindstorms, turtle geometry.
- **Azuma (1997)** — AR rigor. Foundational survey, registration discipline.
- **Bret Victor (2012)** — direct manipulation. Learnable Programming, Dynamicland.

Seven figures, six decades, five wings of the department. Every major strand of spatial computing is represented by someone who actually shaped it.

### Why 3 Opus / 4 Sonnet

- **Opus agents** (sutherland, engelbart, bret-victor): Routing and synthesis (Sutherland) must classify across six skills and seven agents. Augmentation analysis (Engelbart) requires evaluating multi-dimensional trade-offs. Directness critique (Bret-victor) requires deep reasoning about interaction design.
- **Sonnet agents** (krueger, furness, azuma, papert-sp): Environment design, VR/HMD comfort protocols, AR tracking engineering, and pedagogy translation are throughput-oriented tasks with well-defined protocols. Sonnet is appropriate for the repeatable structural work.

### Why three teams

- **Analysis team**: full department, parallel, for multi-wing problems
- **Workshop team**: focused sequential critique, for iterative review
- **Practice team**: pipeline for concept-to-spec, for building prototypes

These shapes cover the three most common query patterns: "analyze this broad question," "review this specific artifact," "build me a spec from this concept."

### CAPCOM boundary

Sutherland is the only agent that talks to the user. Other agents produce Grove records; Sutherland translates them into level-appropriate prose. This boundary is enforced by the `is_capcom: true` flag — only one agent in the chipset may carry this flag.

## 10. Relationship to Adjacent Departments

- **Coding Department** — shares Papert but through a different lens. Cross-chipset queries that span programming and spatial thinking may route through both departments' chairs.
- **Technology Department** — adjacent for general computing; spatial computing is a specialization.
- **Mathematics Department** — spatial computing depends on math (coordinate systems, linear algebra, projective geometry). Complex math questions escalate to Hypatia.
- **Art Department** — responsive environments and VIDEOPLACE heritage overlap with interactive art.

The chipset does not hard-wire cross-department escalations; the router agent (Sutherland) detects out-of-domain queries and acknowledges the boundary, leaving the cross-department coordination to a higher layer.
