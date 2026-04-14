---
name: chemistry-department
type: chipset
category: chemistry
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/chemistry-department/README.md
description: >
  Coordinated chemistry department — seven named agents, six knowledge
  skills, three teams. Second instantiation of the department template pattern.
superseded_by: null
---

# Chemistry Department

## 1. What is the Chemistry Department?

The Chemistry Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured chemistry support across atomic structure, chemical bonding, reactions, organic chemistry, analytical methods, and materials science. It is the second instantiation of the "department template pattern" in gsd-skill-creator, forked from the math department and remapped to the chemical sciences. Incoming requests are classified by a router agent (Lavoisier), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/chemistry-department .claude/chipsets/chemistry-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Lavoisier (the router agent) classifies the query domain and dispatches to the appropriate specialist agent. No explicit activation command is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/chemistry-department/chipset.yaml', 'utf8')).name)"
# Expected output: chemistry-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep reasoning about electronic structure, periodic relationships, and multi-domain classification), four on Sonnet (for throughput-oriented computation, analysis, and pedagogy).

| Name       | Historical Figure          | Role                                          | Model  | Tools                        |
|------------|----------------------------|-----------------------------------------------|--------|------------------------------|
| lavoisier  | Antoine Lavoisier          | Department chair -- classification, routing, synthesis, safety | opus   | Read, Glob, Grep, Bash, Write |
| mendeleev  | Dmitri Mendeleev           | Periodic / inorganic specialist -- periodic trends, stoichiometry | opus   | Read, Grep, Bash             |
| curie-m    | Marie Curie                | Nuclear specialist -- radioactivity, isotopes, radiation safety | sonnet | Read, Bash                   |
| pauling    | Linus Pauling              | Bonding specialist -- molecular orbital theory, electronegativity, mechanisms | opus   | Read, Grep, Bash             |
| hodgkin    | Dorothy Hodgkin            | Analytical specialist -- spectroscopy, chromatography, crystallography | sonnet | Read, Bash                   |
| franklin   | Rosalind Franklin          | Materials specialist -- polymers, crystal structures, surface science | sonnet | Read, Bash                   |
| avogadro   | Amedeo Avogadro            | Pedagogy guide -- mole concept, explanations, learning paths | sonnet | Read, Write                  |

Lavoisier is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Lavoisier.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                    | Domain    | Trigger Patterns                                                      | Agent Affinity       |
|--------------------------|-----------|-----------------------------------------------------------------------|----------------------|
| atomic-structure         | chemistry | electron configuration, atomic orbital, quantum number, ionization energy, periodic trend, atomic radius, shielding | mendeleev, pauling   |
| chemical-bonding         | chemistry | bond, covalent, ionic, molecular orbital, hybridization, VSEPR, electronegativity, Lewis structure | pauling              |
| reactions-stoichiometry  | chemistry | reaction, balance, stoichiometry, yield, equilibrium, enthalpy, kinetics, rate law | mendeleev, pauling   |
| organic-chemistry        | chemistry | organic, functional group, mechanism, synthesis, stereochemistry, alkene, alcohol, carbonyl, aromatic | pauling, franklin    |
| analytical-methods       | chemistry | spectrum, NMR, IR, mass spec, chromatography, HPLC, titration, crystallography, X-ray diffraction | hodgkin              |
| materials-chemistry      | chemistry | polymer, crystal, semiconductor, nanomaterial, surface, thin film, alloy, composite, ceramic | franklin             |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                                    | Use When                                           |
|---------------------------|-----------------------------------------------------------|----------------------------------------------------|
| chemistry-analysis-team   | lavoisier, mendeleev, curie-m, pauling, hodgkin, franklin, avogadro | Multi-domain, research-level, or full-analysis requests |
| synthesis-team            | pauling, mendeleev, franklin, avogadro                    | Synthesis planning, reaction design, mechanism analysis |
| lab-team                  | hodgkin, curie-m, lavoisier, avogadro                     | Experimental design, analytical methods, lab safety |

**chemistry-analysis-team** is the full department. Use it for problems that span multiple chemical domains or require the broadest possible expertise. Lavoisier classifies, all specialists work in parallel, findings are synthesized, and Avogadro wraps the result pedagogically.

**synthesis-team** pairs the bonding specialist (Pauling) with the periodic expert (Mendeleev), the materials specialist (Franklin), and the pedagogy guide (Avogadro). Use it when the primary goal is designing a synthetic route, analyzing a mechanism, or selecting reagents.

**lab-team** is the experimental pipeline. Hodgkin designs analytical methods and experiments, Curie-M handles nuclear and radiation considerations, Lavoisier provides safety oversight, and Avogadro documents procedures at the appropriate level.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `chemistry-department` namespace. Five record types are defined:

| Record Type          | Produced By                    | Key Fields                                                |
|----------------------|--------------------------------|-----------------------------------------------------------|
| ChemistryAnalysis    | hodgkin, franklin              | technique, instrument parameters, analyte, matrix, detection limit, precision, interpretation |
| ChemistryReaction    | pauling, mendeleev, curie-m    | reaction SMILES, mechanism steps, intermediates, rate-determining step, energy profile |
| ChemistrySynthesis   | pauling, mendeleev             | target molecule, route steps, reagent list, atom economy, overall yield estimate, safety notes |
| ChemistryExplanation | avogadro                       | topic, target level, explanation body, prerequisites, worked examples, practice problems |
| ChemistrySession     | lavoisier                      | session ID, queries, dispatches, work product links, timestamps, safety flags |

Records are content-addressed and immutable once written. ChemistrySession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college chemistry department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a ChemistryExplanation is produced, the chipset can automatically generate a Try Session (interactive practice) based on the explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, reactions, syntheses, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college chemistry department structure:
  1. Atomic Structure & Periodicity
  2. Chemical Bonding & Molecular Structure
  3. Reactions & Stoichiometry
  4. Organic & Biological Chemistry
  5. Analytical & Materials Chemistry

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

### Concept inventory (21 concepts across 5 wings)

**Wing 1 -- Atomic Structure & Periodicity** (5 concepts):
atomic models, electron configuration, quantum numbers, periodic trends (radius/IE/EA/EN), isotopes and nuclear stability.

**Wing 2 -- Chemical Bonding & Molecular Structure** (4 concepts):
ionic vs covalent bonding, molecular orbital theory, VSEPR and molecular geometry, intermolecular forces.

**Wing 3 -- Reactions & Stoichiometry** (5 concepts):
reaction types and classification, stoichiometric calculations, chemical equilibrium, thermodynamics (enthalpy/entropy/Gibbs), kinetics and rate laws.

**Wing 4 -- Organic & Biological Chemistry** (4 concepts):
functional groups and nomenclature, reaction mechanisms (SN1/SN2/E1/E2), stereochemistry, biomolecular chemistry (amino acids/carbohydrates/lipids).

**Wing 5 -- Analytical & Materials Chemistry** (3 concepts):
spectroscopic methods (NMR/IR/MS/UV-Vis), chromatographic techniques, materials characterization (XRD/SEM/TEM).

## 8. Customization Guide

The chemistry department is the second implementation of the department template pattern. To create a department for another domain, follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/chemistry-department examples/chipsets/biology-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure references. For a biology department you might use: darwin (router/chair), mendel (genetics), pasteur (microbiology), leeuwenhoek (microscopy/cell biology), goodall (ecology/behavior), mcclintock (molecular biology), montessori (pedagogy). Also rename any corresponding agent directories if your project uses per-agent config files.

### Step 3: Replace skills with domain-appropriate content

Swap the six chemistry skills for biology equivalents. Each skill needs:
- A `domain` value (e.g., `biology`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `ChemistryX` record types with domain-appropriate types. A biology department might use: BiologyObservation, BiologyExperiment, BiologyExplanation, BiologyGenomicAnalysis, BiologySession. Each type should describe the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target (e.g., `biology`)
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled (some departments may want read-only access to avoid unreviewed graph mutations)

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic enough for most departments, but you may want to add domain-specific checks (e.g., "all experiment record types must declare a biosafety level field").

Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Lavoisier) as the entry point for all queries. This provides three benefits:

1. **Classification**: Lavoisier determines which domain(s) a query touches before dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Lavoisier collects results from multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces cognitive load and provides a consistent communication style.

Alternative topologies (mesh, pipeline, broadcast) are possible but the router pattern best fits the department metaphor: students talk to the department office, which routes them to the right professor.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (lavoisier, mendeleev, pauling): These roles require the deepest reasoning. Routing, synthesis, and safety classification (Lavoisier) must understand all six domains well enough to classify correctly and catch hazards. Periodic trend reasoning (Mendeleev) requires tracking multiple competing factors (effective nuclear charge, shielding, relativistic effects) that interact non-linearly. Bonding analysis (Pauling) requires multi-step orbital symmetry arguments where errors compound.
- **Sonnet agents** (curie-m, hodgkin, franklin, avogadro): These roles are throughput-oriented. Nuclear decay calculations, spectral interpretation, materials lookup, and pedagogical explanation benefit from fast turnaround. Sonnet's speed matters more than its depth ceiling for these tasks.

This 3/4 split keeps the token budget practical while preserving quality where it matters most.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full analysis**: needs every perspective (all 7 agents)
- **Synthesis-focused**: needs the bonding and periodic core plus materials confirmation and teaching (4 agents, no analytical/nuclear)
- **Lab-focused**: needs the experimental pipeline with safety oversight (4 agents, no bonding theory or materials deep-dive)

Teams are not exclusive. Lavoisier can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Lavoisier speaks to the user. Other agents communicate through Lavoisier via internal dispatch. This is enforced by the `is_capcom: true` flag -- only one agent in the chipset may carry this flag.

### Safety as first-class concern

Unlike the math department, the chemistry department has an explicit safety dimension. Lavoisier's role includes hazard classification and safety oversight as a primary duty, not an afterthought. Every team configuration includes at least one safety-aware agent (Lavoisier in the analysis and lab teams, Pauling's safety flagging in the synthesis team). This reflects the reality that chemistry research involves physical hazards that must be addressed before any work proceeds.

## 10. Relationship to Math Department

The chemistry department and the math department (`examples/chipsets/math-department/`) are complementary domains in the college structure:

- **Chemistry Department** provides domain-specific reasoning agents for chemical problems -- bonding, reactions, analytical methods, materials, nuclear chemistry. These are chemistry-native tasks that require specialized domain knowledge.
- **Math Department** provides mathematical reasoning agents -- proof, computation, analysis, algebra, pattern recognition. These are domain-independent mathematical capabilities.

In practice, chemistry agents may invoke mathematical reasoning when needed. Pauling's orbital calculations involve linear algebra. Curie-M's decay equations involve calculus. Hodgkin's crystallographic analysis involves group theory. When a chemistry problem has a deep mathematical component that exceeds the chemistry agents' built-in mathematical capability, the appropriate path is to invoke a math department agent (e.g., Euler for a complex integral in thermodynamics, or Noether for symmetry analysis of crystal systems).

Future integration could formalize this by adding a `cross_department_dispatch` field to the chipset, allowing chemistry agents to declare which math department agents they may call. The math department's proof verification and computation would remain independent -- the chemistry department never manages mathematical proofs directly.

This separation of concerns follows the same pattern as a university's departmental structure: chemistry professors know enough math to teach their courses, but send students to the math department for the foundations.
