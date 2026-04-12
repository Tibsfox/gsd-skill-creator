---
name: physics-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/physics-department/README.md
description: >
  Coordinated physics department — seven named agents, six knowledge
  skills, three teams. Third instantiation of the department template pattern.
superseded_by: null
---

# Physics Department

## 1. What is the Physics Department?

The Physics Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured physics support
across classical mechanics, electromagnetism, thermodynamics, quantum mechanics,
relativity and astrophysics, and experimental methods. It is the third
instantiation of the "department template pattern" in gsd-skill-creator,
following the math department (first) and music department (second). Incoming
requests are classified by a router agent (Curie), dispatched to the
appropriate specialist, and all work products are persisted as Grove records
linked to the college concept graph.

Physics presents a distinct challenge for the department template: unlike
mathematics (which is primarily deductive) or music (which balances structure
with aesthetics), physics requires the tight coupling of mathematical formalism
with empirical observation. Agents must move fluidly between symbolic derivation
and physical intuition — checking whether equations are dimensionally consistent,
whether approximations are physically reasonable, and whether results match
known experimental values.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/physics-department .claude/chipsets/physics-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Curie (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/physics-department/chipset.yaml', 'utf8')).name)"
# Expected output: physics-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning and multi-step derivation), four on Sonnet (for throughput-oriented
computation and pedagogy).

| Name            | Historical Figure              | Role                                                     | Model  | Tools                        |
|-----------------|--------------------------------|----------------------------------------------------------|--------|------------------------------|
| curie           | Marie Curie                    | Department chair — classification, routing, synthesis    | opus   | Read, Glob, Grep, Bash, Write |
| newton          | Isaac Newton                   | Mechanics specialist — classical dynamics, gravitation, conservation laws | opus   | Read, Grep, Bash             |
| maxwell         | James Clerk Maxwell            | Electromagnetism specialist — fields, waves, optics, circuits | sonnet | Read, Bash                   |
| boltzmann       | Ludwig Boltzmann               | Thermodynamics specialist — statistical mechanics, entropy, kinetic theory | sonnet | Read, Bash                   |
| feynman         | Richard Feynman                | Quantum specialist — quantum mechanics, QED, path integrals | opus   | Read, Grep, Bash             |
| chandrasekhar   | Subrahmanyan Chandrasekhar     | Astrophysics and relativity specialist — stellar physics, GR, cosmology | sonnet | Read, Grep                   |
| faraday         | Michael Faraday                | Pedagogy guide — experimental intuition, explanation, learning paths | sonnet | Read, Write                  |

Curie is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Curie.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                    | Domain  | Trigger Patterns                                                                            | Agent Affinity       |
|--------------------------|---------|---------------------------------------------------------------------------------------------|----------------------|
| classical-mechanics      | physics | force, Newton's law, momentum, projectile, friction, torque, angular momentum, simple harmonic, orbital mechanics | newton               |
| electromagnetism         | physics | electric field, magnetic field, Maxwell's equations, electromagnetic, circuit, capacitor, inductor, Gauss's law, Faraday's law, optics, wave equation | maxwell              |
| thermodynamics           | physics | entropy, thermodynamics, heat engine, Carnot, partition function, Boltzmann distribution, kinetic theory, specific heat, phase transition | boltzmann            |
| quantum-mechanics        | physics | quantum, wave function, Schrodinger, Hamiltonian, spin, entanglement, superposition, Heisenberg, Dirac, perturbation theory | feynman              |
| relativity-astrophysics  | physics | relativity, spacetime, Lorentz, black hole, cosmology, gravitational wave, stellar, neutron star, Chandrasekhar limit, metric tensor, geodesic | chandrasekhar        |
| experimental-methods     | physics | error analysis, uncertainty, measurement, data fitting, chi-squared, calibration, systematic error, laboratory, experimental design | faraday, curie       |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                       | Agents                                                      | Use When                                           |
|----------------------------|-------------------------------------------------------------|----------------------------------------------------|
| physics-analysis-team      | curie, newton, maxwell, boltzmann, feynman, chandrasekhar, faraday | Multi-domain, research-level, or full-analysis requests |
| problem-solving-team       | newton, maxwell, feynman, boltzmann                         | Calculation-heavy or multi-step derivation requests |
| experimental-design-team   | faraday, curie, boltzmann, chandrasekhar                    | Laboratory work, experimental design, or measurement analysis |

**physics-analysis-team** is the full department. Use it for problems that
span multiple physics domains or require the broadest possible expertise — for
example, a problem involving both electromagnetic induction and thermodynamic
efficiency of a generator.

**problem-solving-team** pairs the four computation-focused specialists. Newton
handles the mechanics, Maxwell the fields, Feynman the quantum aspects, and
Boltzmann the statistical mechanics. Use it when the primary goal is deriving
equations, solving problems, or verifying calculations across subdomains.

**experimental-design-team** is the laboratory pipeline. Faraday designs the
experiment and explains the physical intuition, Curie coordinates and
synthesizes, Boltzmann handles statistical analysis of data, and Chandrasekhar
contributes observational methodology from astrophysics. Use it for lab design,
error analysis, and data interpretation.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`physics-department` namespace. Five record types are defined:

| Record Type         | Produced By                     | Key Fields                                                        |
|---------------------|---------------------------------|-------------------------------------------------------------------|
| PhysicsDerivation   | newton, maxwell, feynman        | starting principles, derivation steps, approximations, dimensional analysis, result |
| PhysicsExperiment   | faraday, curie                  | hypothesis, procedure, apparatus, raw data, error analysis, conclusions |
| PhysicsSolution     | newton, maxwell, boltzmann, feynman | problem statement, diagram refs, solution steps, unit checks, final answer |
| PhysicsExplanation  | faraday                         | topic, target level, explanation body, physical analogies, prerequisites |
| PhysicsSession      | curie                           | session ID, queries, dispatches, work product links, timestamps   |

Records are content-addressed and immutable once written. PhysicsSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college physics department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a PhysicsExplanation is produced, the chipset
  can automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed derivations, solutions, and
  explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college physics department structure:
  1. **Motion & Forces** — kinematics, Newton's laws, gravitation, rotational
     dynamics, oscillatory motion (4 concepts)
  2. **Energy & Work** — work-energy theorem, conservation of energy, power,
     potential energy landscapes, Lagrangian mechanics (5 concepts)
  3. **Waves, Sound & Light** — wave mechanics, superposition, interference,
     diffraction, acoustics, geometric and physical optics (4 concepts)
  4. **Electricity & Magnetism** — electrostatics, magnetostatics, circuits,
     electromagnetic induction, Maxwell's equations (4 concepts)
  5. **Modern Physics & Cosmology** — special relativity, general relativity,
     quantum mechanics, nuclear and particle physics, cosmological models
     (4 concepts)

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph. The 21
concepts across the five wings provide full coverage of an undergraduate physics
curriculum.

## 8. Customization Guide

The physics department follows the same template pattern as its math and music
siblings. To fork it for another physical science (chemistry, earth science,
astronomy), follow these six steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/physics-department examples/chipsets/chemistry-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a chemistry department you might use: Lavoisier (router/chair),
Mendeleev (periodic trends), Pauling (bonding), Curie (nuclear chemistry),
Gibbs (thermochemistry), Hodgkin (structural analysis), Faraday (pedagogy).

### Step 3: Replace skills with domain-appropriate content

Swap the six physics skills for chemistry equivalents. Each skill needs:
- A `domain` value (e.g., `chemistry`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `PhysicsX` record types with domain-appropriate types. A
chemistry department might use: ChemicalDerivation, ChemicalExperiment,
ChemicalSolution, ChemicalExplanation, ChemicalSession. Each type should
describe the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target (e.g., `chemistry`)
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled (some departments
  may want read-only access to avoid unreviewed graph mutations)

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments, but you may want to add domain-specific checks
(e.g., "all experiment record types must declare a safety-notes field").

Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Curie) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Curie determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Curie collects results from
   multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

Alternative topologies (mesh, pipeline, broadcast) are possible but the router
pattern best fits the department metaphor: students talk to the department
office, which routes them to the right professor.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (curie, newton, feynman): These roles require the deepest
  reasoning. Routing and synthesis (Curie) must understand all six domains
  well enough to classify correctly. Classical mechanics (Newton) involves
  multi-step derivations where sign errors and coordinate-frame mistakes
  compound, and the agent must catch dimensional inconsistencies. Quantum
  mechanics (Feynman) requires managing operator algebra, bra-ket notation,
  and perturbation expansions where a wrong commutator invalidates everything
  downstream.
- **Sonnet agents** (maxwell, boltzmann, chandrasekhar, faraday): These roles
  are throughput-oriented. Electromagnetic field calculations (Maxwell) are
  often pattern-matched to standard geometries. Statistical mechanics
  (Boltzmann) leans on standard partition function techniques. Astrophysics
  (Chandrasekhar) frequently applies known scaling relations. Pedagogical
  explanation (Faraday) benefits from fast turnaround to iterate on clarity.
  Sonnet's speed matters more than its depth ceiling for these tasks.

This 3/4 split keeps the token budget practical while preserving quality where
it matters most.

### Why Curie as chair

Marie Curie is the natural choice for department chair for several reasons:

- **Breadth**: Her work spanned experimental physics, theoretical physics, and
  chemistry — she understands cross-domain routing intuitively.
- **Rigor**: Two Nobel Prizes (Physics 1903, Chemistry 1911) represent the
  standard of verification the router must uphold.
- **Experimental grounding**: As an experimentalist, she ensures the department
  never drifts into pure formalism disconnected from physical reality.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Curie speaks to the user.
Other agents communicate through Curie via internal dispatch. This is enforced
by the `is_capcom: true` flag — only one agent in the chipset may carry this
flag. The pattern is borrowed from NASA mission control, where a single
communicator relays between the flight director's team and the crew, preventing
information overload and conflicting instructions.

## 10. Relationship to Math and Music Departments

The physics department is the third instantiation of the department template
pattern, following math (first) and music (second). Together, these three
chipsets validate that the template generalizes across domains with
fundamentally different reasoning requirements:

| Property               | Math Department       | Music Department       | Physics Department      |
|------------------------|-----------------------|------------------------|-------------------------|
| Primary reasoning mode | Deductive proof       | Aesthetic + structural  | Formalism + empiricism  |
| Chair/router           | Hypatia               | Bach                   | Curie                   |
| Opus count             | 3                     | 3                      | 3                       |
| Sonnet count           | 4                     | 4                      | 4                       |
| Skills                 | 6                     | 6                      | 6                       |
| Teams                  | 3                     | 3                      | 3                       |
| Grove record types     | 5                     | 5                      | 5                       |
| College wings          | 5                     | 5                      | 5                       |

The consistent 7-agent / 6-skill / 3-team / 5-grove / 5-wing structure across
all three departments confirms that the template's shape is domain-independent.
What changes between instantiations is the content within each slot: the agent
names, skill trigger patterns, record type fields, and wing definitions.

### Cross-department interactions

Physics has natural bridges to both sibling departments:

- **Math Department**: Physics agents frequently need mathematical support.
  Newton might request proof verification from Euclid, or Feynman might need
  Noether's expertise on symmetry groups and invariants. The math department's
  algebraic-reasoning and numerical-analysis skills complement the physics
  department's derivation workflows.
- **Music Department**: The connection is subtler but real. Acoustics and wave
  mechanics (physics) underpin harmony and timbre (music). Fourier analysis
  appears in both departments. A future cross-department team could pair
  Maxwell (wave equations) with Rameau (harmonic analysis) for problems in
  musical acoustics.

These cross-department bridges are not yet formalized in the chipset
configuration, but the Grove namespace system supports cross-namespace record
references, so a PhysicsDerivation can link to a MathProof that validates one
of its steps. Future work could add an explicit `cross_department_dispatch`
field to the chipset schema.

### Template validation

Three instantiations is the minimum needed to distinguish a genuine pattern
from a coincidence. The math department proved the template worked for pure
reasoning. The music department proved it worked for a domain where evaluation
is partly subjective. The physics department proves it works for a domain
where formal reasoning must be continuously grounded in empirical reality.
Any future department (chemistry, computer science, linguistics, history)
can now fork any of the three existing departments with confidence that the
template's structure is sound.
