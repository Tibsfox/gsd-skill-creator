---
name: problem-solving-team
type: team
category: physics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/physics/problem-solving-team/README.md
description: Physics computation and derivation team for problem sets, exam preparation, and step-by-step solutions. Newton leads the workflow, routes to the appropriate domain specialist (Maxwell for E&M, Boltzmann for thermodynamics), enforces dimensional checks, and hands off to Faraday for pedagogical explanation. Use for homework help, exam prep, derivations, and any problem where the domain is clear and the goal is a correct, well-explained solution. Not for multi-domain research, experimental design, or problems requiring quantum or relativistic corrections beyond the classical regime.
superseded_by: null
---
# Problem Solving Team

Focused computation and derivation team for physics problems with clear domain classification. Prioritizes correctness, step-by-step rigor, and pedagogical clarity over broad multi-domain synthesis. The lean four-agent roster keeps token cost low while covering the three most common problem-set domains: classical mechanics, electromagnetism, and thermodynamics.

## When to use this team

- **Physics problem sets** -- textbook or homework problems in mechanics, E&M, or thermodynamics where the goal is a correct numerical or symbolic answer with full working shown.
- **Exam preparation** -- timed-style problem practice where the student needs to see the solution strategy, not just the answer.
- **Derivations** -- deriving a known result from first principles (e.g., deriving the Euler-Lagrange equation, proving Gauss's law from Coulomb's law, deriving the Maxwell-Boltzmann distribution).
- **Step-by-step solutions** -- when the user explicitly wants to see every algebraic step, every substitution, every dimensional check.
- **Dimensional analysis and estimation** -- back-of-envelope calculations, order-of-magnitude estimates, Fermi-style reasoning about physical systems.
- **Verification of student work** -- checking a derivation for errors, finding where an argument goes wrong, suggesting corrections.

## When NOT to use this team

- **Multi-domain research** where the problem spans classical and modern physics -- use `physics-analysis-team`.
- **Quantum mechanics problems** -- this team has no quantum specialist. Route to `feynman` directly or escalate to `physics-analysis-team`.
- **General relativity or astrophysics** -- this team has no relativity specialist. Route to `chandrasekhar` directly or escalate to `physics-analysis-team`.
- **Experimental design** -- use `experimental-design-team`.
- **Pure pedagogy** with no computation -- use `faraday` directly.
- **Problems requiring numerical simulation** or Monte Carlo methods -- the problem-solving-team works analytically. For statistical computation, use `boltzmann` with math-coprocessor tools.

## Composition

The team runs four Physics Department agents:

| Role | Agent | Domain | Model |
|------|-------|--------|-------|
| **Lead / Coordinator** | `newton` | Classical mechanics, Lagrangian/Hamiltonian methods, dimensional analysis | Opus |
| **E&M specialist** | `maxwell` | Electrostatics, magnetostatics, circuits, waves, optics | Sonnet |
| **Thermo specialist** | `boltzmann` | Thermodynamics, statistical mechanics, entropy, heat engines | Sonnet |
| **Pedagogy** | `faraday` | Level-appropriate explanation, physical intuition, learning pathways | Sonnet |

Newton runs on Opus because the lead role requires multi-step reasoning, strategy selection, and dimensional verification across the entire solution. The three Sonnet agents handle well-scoped domain computation and explanation.

## Orchestration flow

```
Input: user problem + optional user level + optional prior PhysicsSession hash
        |
        v
+---------------------------+
| Newton (Opus)             |  Phase 1: Classify and strategize
| Lead / Coordinator        |          - identify domain (mech / E&M / thermo)
+---------------------------+          - select solution strategy
        |                              - identify relevant conservation laws
        |                              - choose coordinate system / basis
        |                              - set up the problem formally
        |
        |   +--- Mechanics? ------> Newton solves directly (Phase 2a)
        |   |
        |   +--- E&M? -----------> Maxwell solves (Phase 2b)
        |   |
        |   +--- Thermo? --------> Boltzmann solves (Phase 2c)
        |   |
        |   +--- Mixed mech+E&M? -> Newton + Maxwell in parallel (Phase 2d)
        |   |
        |   +--- Mixed mech+thermo? -> Newton + Boltzmann in parallel (Phase 2e)
        |
        v
+---------------------------+
| Domain specialist(s)      |  Phase 2: Compute / derive
| Produce solution steps    |          - apply the strategy Newton chose
+---------------------------+          - show all algebraic steps
        |                              - carry units through every line
        |                              - flag any assumptions explicitly
        |
        v
+---------------------------+
| Newton (Opus)             |  Phase 3: Dimensional check
| Verify the solution       |          - confirm dimensions on every term
+---------------------------+          - check limiting cases
        |                              - verify conservation laws satisfied
        |                              - sanity-check numerical magnitude
        |
        v
+---------------------------+
| Faraday (Sonnet)          |  Phase 4: Explain the physics
| Pedagogical wrap          |          - translate math into physical intuition
+---------------------------+          - provide analogies and diagrams (ASCII)
        |                              - suggest related problems
        |                              - note common mistakes to avoid
        |
        v
+---------------------------+
| Newton (Opus)             |  Phase 5: Record
| Produce Grove records     |          - PhysicsSolution or PhysicsDerivation
+---------------------------+          - link to PhysicsExplanation from Faraday
        |                              - emit PhysicsSession
        |
        v
                  Final response to user
                  + PhysicsSession Grove record
```

## Solution rules

Newton enforces these rules across all solutions:

### Rule 1 -- Units on every line

Every equation in the solution carries explicit units. If a specialist produces a line without units, Newton rejects it and requests the dimensional annotation. This is non-negotiable: dimensional analysis catches more errors than any other single technique.

### Rule 2 -- State all assumptions

Every approximation (small angle, ideal gas, massless rope, frictionless surface, steady-state, quasi-static) is stated explicitly at the point it is used. Hidden assumptions are the primary source of physics errors.

### Rule 3 -- Check limiting cases

After obtaining a result, Newton verifies at least one limiting case. For example:
- Does the expression reduce to the known result when a parameter goes to zero or infinity?
- Does it give the correct answer for a simple special case?
- Is the sign physically sensible?

If a limiting case fails, the derivation contains an error and must be re-examined.

### Rule 4 -- Conservation laws as checkpoints

For mechanics problems, verify conservation of energy and momentum at the end. For E&M problems, verify charge conservation and Poynting's theorem if applicable. For thermodynamics problems, verify the first and second laws. These checks are performed by Newton as part of Phase 3, not by the domain specialist.

### Rule 5 -- Strategy before computation

Newton always states the solution strategy before any computation begins. "We will use conservation of energy because the forces are conservative and we care about initial and final states, not the path" comes before any equations. This serves both as a pedagogical tool and as a constraint that prevents the specialist from wandering into an inefficient approach.

## Input contract

The team accepts:

1. **User problem** (required). A physics problem stated in natural language, possibly with given quantities, diagrams described in text, or equations.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Newton infers from the problem statement.
3. **Prior PhysicsSession hash** (optional). Grove hash for follow-up problems or multi-part assignments.

## Output contract

### Primary output: Step-by-step solution

A complete solution that:

- States the strategy and relevant physics principles before computation
- Shows every algebraic step with units
- Includes a dimensional check on the final result
- Verifies at least one limiting case
- Confirms conservation laws are satisfied
- Provides Faraday's physical explanation and intuition layer
- Suggests related problems for further practice

### Grove records

The team produces one or more of:

```yaml
type: PhysicsSolution
problem: <original problem statement>
strategy: <solution strategy chosen by Newton>
domain: classical_mechanics | electromagnetism | thermodynamics
steps:
  - <step 1 with units>
  - <step 2 with units>
  - ...
result: <final answer with units and significant figures>
dimensional_check: pass | fail
limiting_cases_checked:
  - <description of limiting case and result>
conservation_verified:
  - energy: pass
  - momentum: pass
```

```yaml
type: PhysicsDerivation
theorem: <name of result being derived>
starting_from: <axioms or laws used as starting point>
steps:
  - <derivation step 1>
  - <derivation step 2>
  - ...
result: <derived expression>
assumptions:
  - <assumption 1>
  - <assumption 2>
```

Each solution is wrapped in a PhysicsSession record linking all work products together.

## Escalation paths

### Internal escalations (within the team)

- **Problem requires quantum mechanics:** Newton identifies this at classification time and escalates to `physics-analysis-team` rather than attempting a classical approximation that would be wrong. Examples: tunneling, spin, entanglement, band structure.
- **Problem requires general relativity:** Newton identifies this and escalates. Examples: strong gravitational fields, frame dragging, cosmological expansion. Weak-field Newtonian gravity is handled in-team.
- **Dimensional check fails in Phase 3:** Newton rejects the specialist's solution and re-invokes with an explicit dimensional constraint. If the second attempt also fails, Newton re-derives from scratch.
- **Mixed E&M + thermo (e.g., thermoelectric effects):** Maxwell and Boltzmann solve in parallel; Newton synthesizes their outputs using shared boundary conditions.

### External escalations (to other teams)

- **To physics-analysis-team:** Multi-domain problems discovered during classification, or when a simple problem turns out to require quantum or relativistic corrections.
- **To experimental-design-team:** When the user asks "how would I measure this?" after a computation, redirect to the experimental-design-team with the theoretical result as input.
- **To Mathematics Department:** When a derivation requires advanced mathematical techniques (contour integration, group theory, differential geometry) beyond the physics specialists' scope.

### Escalation to the user

- **Ambiguous problem statement:** If the problem is under-specified (missing a given quantity, ambiguous geometry, unclear what is being asked), Newton asks for clarification rather than guessing.
- **Multiple valid approaches:** If the problem can be solved by fundamentally different strategies (energy methods vs. force methods, Lagrangian vs. Newtonian), Newton states both options and asks the user's preference, or solves via both and compares.
- **Outside physics:** If the problem is actually engineering, chemistry, or mathematics in disguise, Newton acknowledges the boundary.

## Token / time cost

Approximate cost per problem:

- **Newton** -- 2-3 Opus invocations (classify + verify + record), ~30-40K tokens total
- **Domain specialist** -- 1 Sonnet invocation (Maxwell or Boltzmann), ~20-40K tokens
- **Faraday** -- 1 Sonnet invocation, ~15-20K tokens
- **Total** -- 80-150K tokens, 2-8 minutes wall-clock

Substantially cheaper than the full physics-analysis-team. This is the right cost for problem-set work where the domain is known and multi-framework synthesis is unnecessary.

## Configuration

```yaml
name: problem-solving-team
lead: newton
specialists:
  - electromagnetism: maxwell
  - thermodynamics: boltzmann
pedagogy: faraday

parallel: false  # sequential by default; parallel for mixed-domain
timeout_minutes: 10

# Newton routes to the appropriate specialist
auto_route: true

# Newton can solve mechanics problems directly without delegation
lead_can_solve: true
```

## Invocation

```
# Mechanics problem
> problem-solving-team: A 2 kg block slides down a 30-degree frictionless incline
  and collides elastically with a 5 kg block at rest on a level surface. Find
  the velocity of each block after the collision if the first block started
  from rest 3 meters up the incline. Level: intermediate.

# E&M derivation
> problem-solving-team: Derive the magnetic field inside and outside a long
  solenoid with n turns per unit length carrying current I, using Ampere's law.
  Show all steps. Level: beginner.

# Thermodynamics problem set
> problem-solving-team: An ideal Carnot engine operates between a hot reservoir
  at 600 K and a cold reservoir at 300 K. If the engine absorbs 1000 J of heat
  per cycle, calculate (a) the work done per cycle, (b) the heat rejected,
  (c) the entropy change of the universe per cycle. Level: intermediate.

# Follow-up
> problem-solving-team: (session: grove:abc123) Now repeat part (a) for a real
  engine with 60% of Carnot efficiency.
```

## Limitations

- The team covers three domains: classical mechanics, electromagnetism, and thermodynamics. Quantum mechanics and astrophysics/relativity are explicitly out of scope and will be escalated.
- The team works analytically. Numerical simulation, finite element methods, and Monte Carlo approaches are not available within the team's workflow.
- The sequential flow (Newton -> specialist -> Newton -> Faraday) means the team is slower than invoking a single specialist directly. For problems where you already know the domain and do not need dimensional verification or pedagogy, use the specialist agent directly.
- Newton's dimensional analysis is symbolic, not numerical. Numerical precision issues (floating-point, significant figures) are noted but not deeply analyzed.
- The team does not have access to a problem database or textbook solutions. Verification is by independent re-derivation and limiting-case checks, not by lookup.
