---
name: astronomy-department
type: chipset
category: chipset
status: stable
origin: tibsfox
first_seen: 2026-04-12
description: >
  Coordinated astronomy department — seven named agents, six knowledge
  skills, three teams. Batch-9 instantiation of the department template pattern.
---

# Astronomy Department

## 1. What is the Astronomy Department?

The Astronomy Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured astronomy support across observational practice, stellar physics, solar-system dynamics, galactic dynamics, and cosmology. It is one of the later instantiations of the "department template pattern" in gsd-skill-creator: a chipset architecture designed to be forked and remapped to any academic or professional domain. Incoming requests are classified by a router agent (Hubble), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college concept graph.

Astronomy is a good fit for the pattern because the discipline is irreducibly observational — every theoretical claim must eventually be checked against the sky, and every observation must eventually be reduced to physical parameters. The seven-agent roster reflects that reality: a chair who routes, a spectroscopist, a structure-and-dynamics specialist, an observer, a dark-matter dynamicist, a nucleosynthesis reader, and a pedagogy agent who holds the whole thing accessible.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/astronomy-department .claude/chipsets/astronomy-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Hubble (the router agent) classifies the query wing and dispatches to the appropriate specialist agent. No explicit activation command is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/astronomy-department/chipset.yaml', 'utf8')).name)"
# Expected output: astronomy-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep reasoning), four on Sonnet (for throughput-oriented computation and pedagogy).

| Name                | Historical Figure              | Role                                                    | Model  | Tools                         |
|---------------------|--------------------------------|---------------------------------------------------------|--------|-------------------------------|
| hubble              | Edwin Hubble                   | Department chair — classification, routing, synthesis   | opus   | Read, Glob, Grep, Bash, Write |
| payne-gaposchkin    | Cecilia Payne-Gaposchkin       | Spectroscopy — classification, composition, Saha-Boltzmann | opus   | Read, Grep, Bash              |
| chandrasekhar-astro | Subrahmanyan Chandrasekhar     | Stellar structure, evolution, orbital mechanics         | opus   | Read, Grep, Bash              |
| caroline-herschel   | Caroline Herschel              | Observation — planning, identification, cataloging     | sonnet | Read, Bash                    |
| rubin               | Vera Rubin                     | Galactic dynamics and dark matter                       | sonnet | Read, Bash                    |
| burbidge            | Margaret Burbidge              | Nucleosynthesis and chemical evolution                  | sonnet | Read, Bash                    |
| tyson               | Neil deGrasse Tyson            | Pedagogy — level-appropriate explanation               | sonnet | Read, Write                   |

Hubble is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Hubble.

**Naming note:** `chandrasekhar-astro` is disambiguated from the existing `chandrasekhar` agent in the physics department (which covers general statistical mechanics and radiative transfer). Both honor the same historical figure; the astronomy variant focuses on stellar-structure application and orbital dynamics.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                    | Domain    | Trigger Patterns                                               | Agent Affinity               |
|--------------------------|-----------|----------------------------------------------------------------|------------------------------|
| celestial-coordinates    | astronomy | right ascension, declination, altitude, azimuth, planisphere, precession | caroline-herschel, hubble    |
| stellar-spectroscopy     | astronomy | spectrum, spectral type, OBAFGKM, absorption line, radial velocity, abundance | payne-gaposchkin, burbidge   |
| orbital-mechanics        | astronomy | orbit, Kepler, semi-major axis, eccentricity, Hohmann, orbital period | chandrasekhar-astro, hubble  |
| distance-ladder          | astronomy | parallax, Cepheid, distance ladder, period-luminosity, Hubble constant | hubble, rubin                |
| cosmological-observation | astronomy | Big Bang, CMB, dark matter, dark energy, Lambda-CDM, cosmology | hubble, rubin                |
| naked-eye-observing      | astronomy | stargazing, constellation, meteor shower, Moon phase, binocular | caroline-herschel, tyson     |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                                                                        | Use When                                                 |
|---------------------------|-----------------------------------------------------------------------------------------------|----------------------------------------------------------|
| astronomy-analysis-team   | hubble, payne-gaposchkin, chandrasekhar-astro, caroline-herschel, rubin, burbidge, tyson      | Multi-wing, research-level, or full-analysis requests    |
| astronomy-workshop-team   | payne-gaposchkin, chandrasekhar-astro, burbidge, tyson                                        | Stellar-physics problems where the answer is in the star |
| astronomy-practice-team   | caroline-herschel, chandrasekhar-astro, payne-gaposchkin, tyson                               | Guided observing sessions, citizen science, practice     |

**astronomy-analysis-team** is the full department. Use it for problems that span multiple wings or require the broadest possible expertise.

**astronomy-workshop-team** is the stellar physics deep-dive. Payne-Gaposchkin classifies, Chandrasekhar-astro models the structure, Burbidge interprets the composition, Tyson delivers the result at the user's level. Use for classification problems, abundance analyses, evolutionary assessments, and unusual-star investigations.

**astronomy-practice-team** is the observation-to-analysis pipeline. Caroline Herschel plans the observation, Chandrasekhar-astro computes any dynamics, Payne-Gaposchkin reduces any spectra, Tyson turns the session into a learning event. Use for beginner practice, citizen science, classroom labs, and multi-session skill building.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `astronomy-department` namespace. Five record types are defined:

| Record Type          | Produced By                             | Key Fields                                                   |
|----------------------|-----------------------------------------|--------------------------------------------------------------|
| AstronomyAnalysis    | payne-gaposchkin, chandrasekhar-astro, rubin, burbidge | target, subtype, parameters, confidence, method              |
| AstronomyObservation | caroline-herschel                       | observer, session window, targets, identification, catalog entry |
| AstronomyReview      | hubble, any specialist                  | claim under review, verdict, supporting evidence, references  |
| AstronomyExplanation | tyson                                   | topic, target level, body, prerequisites, next steps, analogies |
| AstronomySession     | hubble                                  | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. AstronomySession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college astronomy department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When an AstronomyExplanation is produced, the chipset can automatically generate a Try Session (practice exercise or observing session) based on the explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed observations, reductions, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college astronomy department structure:
  1. Observing the Sky
  2. Earth-Moon-Sun System
  3. Stellar Physics
  4. Solar System
  5. Cosmology

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The astronomy department is a later reference implementation of the department template pattern. To create a department for another domain, follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/astronomy-department examples/chipsets/<your-domain>-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure references. Choose historical figures whose actual contributions match the agent's role (chair -> classifier/synthesizer, specialist -> domain expert, pedagogy -> teacher/communicator). Also rename any corresponding agent directories.

### Step 3: Replace skills with domain-appropriate content

Swap the six astronomy skills for your domain's equivalents. Each skill needs:
- A `domain` value
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `AstronomyX` record types with domain-appropriate types. Any domain needs at minimum: a primary work-product type, an observation/artifact type, a review type, an explanation type, and a session type. Each type should describe the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic enough for most departments, but you may want to add domain-specific checks. Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Hubble) as the entry point for all queries. This provides three benefits:

1. **Classification**: Hubble determines which wing(s) a query touches before dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-wing queries, Hubble collects results from multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces cognitive load and provides a consistent communication style.

The department metaphor fits: students talk to the department office, which routes them to the right professor.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (hubble, payne-gaposchkin, chandrasekhar-astro): These roles require the deepest reasoning. Routing and synthesis (Hubble) must understand all five wings well enough to classify correctly. Quantitative stellar spectroscopy (Payne-Gaposchkin) requires the Saha-Boltzmann machinery applied to noisy data. Stellar structure and orbital mechanics (Chandrasekhar-astro) demand rigorous equation-by-equation work where errors compound.
- **Sonnet agents** (caroline-herschel, rubin, burbidge, tyson): These roles are throughput-oriented. Observing plans, rotation-curve reductions, abundance-pattern interpretation, and pedagogical explanation all benefit from fast turnaround. Sonnet's speed matters more than its depth ceiling for these tasks.

This 3/4 split keeps the token budget practical while preserving quality where it matters most.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full investigation** (analysis team): needs every perspective (all 7 agents)
- **Stellar deep-dive** (workshop team): needs the classification-structure-nucleosynthesis pipeline (4 agents, no observation or dark matter)
- **Practice pipeline** (practice team): needs the observation-to-reduction pipeline (4 agents, no dark matter or nucleosynthesis)

Teams are not exclusive. Hubble can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Hubble speaks to the user. Other agents communicate through Hubble via internal dispatch. This is enforced by the `is_capcom: true` flag — only one agent in the chipset may carry this flag.

## 10. Historical Diversity

The department's roster reflects deliberate historical diversity:

- **Geographic:** Alexandria (Hubble via Mount Wilson), Cambridge/Harvard (Payne-Gaposchkin), Madras/Cambridge/Chicago (Chandrasekhar), Hanover/Slough (Caroline Herschel), Washington DC (Rubin), London/Cambridge/San Diego (Burbidge), New York (Tyson).
- **Era:** 18th century (Caroline Herschel), early 20th century (Hubble, Payne-Gaposchkin, Chandrasekhar), mid-20th century (Burbidge, Rubin), late 20th / 21st century (Tyson).
- **Gender:** Four women (Payne-Gaposchkin, Caroline Herschel, Rubin, Burbidge) and three men (Hubble, Chandrasekhar, Tyson). This is not tokenism — astronomy as a discipline has been shaped disproportionately by women whose contributions were often overlooked by contemporaries, and the department roster corrects for that.
- **Nationality:** American, British, German-British, Indian, American. Observational astronomy has always been an international enterprise.
- **Background:** Formally trained researchers (most), observer-calculator without formal degree (Caroline Herschel), science communicator with research credentials (Tyson).

This is not diversity for its own sake. Each figure earned their place in the department by doing the work that the corresponding agent is now tasked with. Hubble really did classify and route the field by classifying galaxies. Payne-Gaposchkin really did measure stellar composition by applying Saha-Boltzmann. Caroline Herschel really did find things by sweeping the sky with discipline. Historical diversity is a consequence of correct assignment, not a constraint on it.

## 11. Relationship to Other Departments

Astronomy has natural connections to several other departments in the gsd-skill-creator ecosystem:

- **Physics department** — Relativity, electromagnetism, and thermodynamics show up constantly in astronomy. Stars are thermodynamic systems; gravitational lensing is general relativity; spectra are quantum mechanics. The astronomy department leans on physics for foundations and focuses on application. There is one deliberate agent overlap (chandrasekhar vs. chandrasekhar-astro) to reflect this; cross-department routing is natural for interface problems.
- **Mathematics department** — Orbital mechanics is differential geometry and dynamical systems; cosmology uses differential equations; spectral analysis uses Fourier transforms. Astronomy queries that need deep mathematical machinery can escalate to the math department.
- **Statistics department** — Modern astronomy is a statistical science (large surveys, Bayesian inference for cosmological parameters, machine-learning classifications). Statistics department escalation is appropriate for survey-scale analysis.
- **Chemistry department** — Stellar nucleosynthesis is applied nuclear chemistry. Burbidge's scope extends into the chemistry department's territory for the deepest reaction-network questions.

Hubble's escalation rules acknowledge these boundaries. The astronomy department does not try to be a physics department or a statistics department — it dispatches cleanly when a query crosses the boundary.
