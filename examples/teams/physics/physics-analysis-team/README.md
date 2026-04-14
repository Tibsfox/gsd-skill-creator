---
name: physics-analysis-team
type: team
category: physics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/physics/physics-analysis-team/README.md
description: Full Physics Department analysis team for multi-domain problems spanning classical mechanics, electromagnetism, thermodynamics, quantum mechanics, and astrophysics. Curie classifies the query across physics domains and activates relevant specialists in parallel, then synthesizes their independent analyses into a unified response before Faraday wraps the result in pedagogically sound explanation. Use for research-level questions, cross-domain physics (E&M coupled to quantum, thermo coupled to mechanics), comprehensive analysis requiring multiple theoretical frameworks, or any problem where the relevant physics domain is ambiguous. Not for single-domain computation, simple kinematics, or problems outside physics.
superseded_by: null
---
# Physics Analysis Team

Full-department multi-domain analysis team for physics problems that span classical and modern domains or resist clean classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how the mathematics `math-investigation-team` coordinates across proof, computation, and structure.

## When to use this team

- **Multi-domain problems** spanning two or more physics domains -- where no single specialist covers the full scope (e.g., electromagnetic induction in a relativistic frame, thermodynamic properties of a quantum gas, gravitational lensing with E&M considerations).
- **Research-level questions** where the dominant physics is unclear and the problem may yield different insights from classical, quantum, and statistical perspectives simultaneously.
- **Graduate-level analysis** requiring coordinated input from multiple specialists (e.g., a stellar structure problem that needs Chandrasekhar's astrophysics, Boltzmann's statistical mechanics, and Feynman's quantum corrections).
- **Novel problems** where the user does not know which specialist to invoke, and Curie's classification is the right entry point.
- **Cross-framework synthesis** -- when understanding a physical system requires seeing it through multiple theoretical lenses (Newtonian mechanics via Newton, field theory via Maxwell, statistical ensemble via Boltzmann, quantum amplitudes via Feynman).
- **Verification of complex derivations** -- when a result needs independent checks from different theoretical frameworks (e.g., deriving the same result via Lagrangian mechanics and via statistical mechanics to confirm consistency).

## When NOT to use this team

- **Simple kinematics** -- projectile motion, free-body diagrams, uniform circular motion. Use `newton` directly.
- **Single-domain computation** where the physics is obvious -- a circuit problem goes to `maxwell`, a heat engine to `boltzmann`. Route directly.
- **Ear training** -- wrong department entirely (that would be music).
- **Pure mathematics** -- use the Mathematics Department teams instead. Physics analysis assumes physical systems and dimensional quantities.
- **Beginner-level teaching** with no research or multi-domain component -- use `faraday` directly for pedagogy.

## Composition

The team runs all seven Physics Department agents:

| Role | Agent | Domain | Model |
|------|-------|--------|-------|
| **Chair / Router** | `curie` | Classification, orchestration, synthesis | Opus |
| **Classical mechanics** | `newton` | Newtonian mechanics, Lagrangian/Hamiltonian formalism, gravitation | Opus |
| **Electromagnetism** | `maxwell` | E&M, optics, Maxwell's equations, wave theory | Sonnet |
| **Thermodynamics** | `boltzmann` | Statistical mechanics, thermodynamics, entropy, kinetic theory | Sonnet |
| **Quantum mechanics** | `feynman` | Quantum mechanics, QFT, path integrals, particle physics | Opus |
| **Astrophysics / Relativity** | `chandrasekhar` | Stellar structure, general relativity, cosmology, compact objects | Sonnet |
| **Pedagogy** | `faraday` | Level-appropriate explanation, experimental intuition, learning pathways | Sonnet |

Three agents run on Opus (Curie, Newton, Feynman) because their tasks require deep multi-step reasoning and synthesis. Four run on Sonnet because their tasks are well-scoped within a defined domain.

## Orchestration flow

```
Input: user query + optional user level + optional prior PhysicsSession hash
        |
        v
+---------------------------+
| Curie (Opus)              |  Phase 1: Classify the query
| Chair / Router            |          - domain(s) (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (derive/compute/explain/explore/verify)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |                              - safety/hazard flags (radiation, HV, etc.)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Newton   Maxwell  Boltzmann Feynman  Chandra   (Faraday
    (mech)   (E&M)    (thermo)  (quant)  (astro)    waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, analyzing the same
             physical system from their own theoretical framework.
             Each produces an independent Grove record.
             Curie activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Curie (Opus)              |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile frameworks
              +---------------------------+          - check dimensional consistency
                         |                           - rank findings by confidence
                         |                           - flag contradictions
                         v
              +---------------------------+
              | Faraday (Sonnet)          |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - physical intuition layer
              +---------------------------+          - analogies and visualization
                         |                           - suggest experiments or follow-ups
                         v
              +---------------------------+
              | Curie (Opus)              |  Phase 5: Record
              | Produce PhysicsSession   |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + PhysicsSession Grove record
```

## Synthesis rules

Curie synthesizes the specialist outputs using these rules:

### Rule 1 -- Converging frameworks strengthen results

When two or more specialists arrive at the same result from independent theoretical frameworks (e.g., Newton derives a force via Lagrangian mechanics and Boltzmann derives the same force from kinetic theory), mark the result as high-confidence. Cross-framework convergence is the strongest signal available in physics.

### Rule 2 -- Diverging results demand dimensional analysis first

When specialists disagree, Curie's first step is dimensional analysis. If one result has incorrect dimensions, that result is discarded. If both are dimensionally correct:

1. State both findings with attribution ("Newton's classical analysis yields X; Feynman's quantum treatment yields Y").
2. Identify the regime: check whether the disagreement is a legitimate classical-vs-quantum or classical-vs-relativistic distinction.
3. If the disagreement is not regime-dependent, re-delegate to the specialist whose result is less expected.
4. Report the disagreement honestly, noting which regime each result applies to.

### Rule 3 -- Limiting cases must agree

Any quantum result must reduce to the classical result in the appropriate limit (large quantum numbers, h -> 0). Any relativistic result must reduce to the Newtonian result at low velocities (v << c). If limiting-case agreement fails, one of the derivations contains an error.

### Rule 4 -- Conservation laws are non-negotiable

If any specialist's result violates conservation of energy, momentum, angular momentum, or charge, that result is rejected and the specialist is re-invoked with the constraint explicitly stated. Conservation laws are axioms, not suggestions.

### Rule 5 -- User level governs presentation, not physics

All specialist findings are included in the response regardless of user level. Faraday adapts the presentation -- physical analogies and worked examples for lower levels; tensor notation and Lagrangian formalism for higher levels. The physics does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language physics question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Curie infers from the query.
3. **Prior PhysicsSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query with physical reasoning
- Shows derivations at the appropriate level of detail
- Includes dimensional checks on all quantitative results
- Credits the specialists involved and their theoretical frameworks
- Notes any unresolved disagreements or regime-dependent distinctions
- Suggests follow-up problems, experiments, or explorations

### Grove record: PhysicsSession

```yaml
type: PhysicsSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: derive
  user_level: graduate
agents_invoked:
  - curie
  - newton
  - maxwell
  - boltzmann
  - feynman
  - chandrasekhar
  - faraday
work_products:
  - <grove hash of PhysicsDerivation>
  - <grove hash of PhysicsSolution>
  - <grove hash of PhysicsExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record (PhysicsDerivation, PhysicsSolution, PhysicsExperiment, or PhysicsExplanation) linked from the PhysicsSession.

## Escalation paths

### Internal escalations (within the team)

- **Newton and Feynman disagree on a result:** Check the limiting case. If the problem is in a regime where classical and quantum predictions genuinely differ (e.g., tunneling, spin statistics), both results are correct in their domain. If the problem is in the classical regime and they still disagree, re-derive from first principles.
- **Maxwell and Chandrasekhar disagree on a field solution:** Check whether relativistic corrections matter. Maxwell's equations are already Lorentz-covariant, so the disagreement usually comes from boundary conditions or coordinate choices. Re-examine assumptions.
- **Boltzmann's statistical result contradicts Newton's deterministic result:** Check whether the system has enough particles for the thermodynamic limit to apply. Small-N systems can have genuine discrepancies between deterministic mechanics and statistical predictions.
- **Dimensional inconsistency detected:** The result with incorrect dimensions is rejected unconditionally. The specialist is re-invoked with an explicit dimensional constraint.

### External escalations (from other teams)

- **From problem-solving-team:** When a problem set question reveals multi-domain coupling (e.g., a circuit problem that requires quantum tunneling in the junction), escalate to physics-analysis-team.
- **From experimental-design-team:** When experimental design requires theoretical input from multiple domains (e.g., designing a measurement that spans thermal and quantum regimes), escalate to physics-analysis-team.
- **From Mathematics Department:** When a mathematical structure has a direct physics interpretation (e.g., a differential equation is actually a Lagrangian), the physics-analysis-team can provide physical context.

### Escalation to the user

- **Open research question:** If the problem appears to be genuinely at the frontier of physics (e.g., quantum gravity regime, unresolved paradoxes), report this honestly with all evidence gathered and references to relevant literature.
- **Outside physics:** If the problem requires domain expertise outside physics (chemistry bonding, biological systems, engineering tolerances), Curie acknowledges the boundary and suggests appropriate resources.
- **Safety-critical:** If the query involves hazardous materials, high-energy systems, or radiation, Curie flags this explicitly regardless of the physics analysis.

## Token / time cost

Approximate cost per analysis:

- **Curie** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Newton, Feynman) + 3 Sonnet (Maxwell, Boltzmann, Chandrasekhar), ~30-60K tokens each
- **Faraday** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain and research-level problems. For single-domain or routine problems, use the specialist directly or the problem-solving-team.

## Configuration

```yaml
name: physics-analysis-team
chair: curie
specialists:
  - classical_mechanics: newton
  - electromagnetism: maxwell
  - thermodynamics: boltzmann
  - quantum_mechanics: feynman
  - astrophysics: chandrasekhar
pedagogy: faraday

parallel: true
timeout_minutes: 15

# Curie may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full multi-domain analysis
> physics-analysis-team: Analyze the thermodynamic properties of a neutron star
  crust, considering the interplay between nuclear forces (strong interaction),
  electron degeneracy pressure, and general relativistic corrections to the
  equation of state. Level: graduate.

# Cross-framework verification
> physics-analysis-team: Derive the Casimir effect from both the quantum
  field-theoretic perspective and the classical van der Waals framework. Under
  what conditions do the predictions differ?

# Follow-up
> physics-analysis-team: (session: grove:abc123) Now extend that analysis to
  the case of curved spacetime between the plates.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., nuclear physics beyond stellar structure, condensed matter band theory, plasma physics) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external computational resources beyond what each agent's tools provide (Bash for computation, Read/Grep for reference, math-coprocessor MCP tools for numerical work).
- Research-level open problems may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
- Experimental verification is outside scope -- the team analyzes theoretically. For experimental design, use the experimental-design-team.
