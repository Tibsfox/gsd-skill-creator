---
name: experimental-design-team
type: team
category: physics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/physics/experimental-design-team/README.md
description: Physics laboratory and experiment design team for designing measurements, analyzing experimental data, uncertainty propagation, and Fermi estimation. Faraday leads the experimental design process, Curie reviews methodology and safety, the appropriate domain specialist (Newton or Maxwell) provides theoretical predictions, and Boltzmann handles statistical analysis and error propagation. Use for lab design, data analysis, uncertainty budgets, systematic error identification, and Fermi problems. Not for pure theoretical derivation, multi-domain research synthesis, or problems with no experimental component.
superseded_by: null
---
# Experimental Design Team

Laboratory-focused team for designing experiments, analyzing real-world data, quantifying uncertainty, and bridging theory to measurement. Faraday leads because experimental design is fundamentally a pedagogical and practical discipline -- knowing what to measure, how to measure it, and what can go wrong requires the deep physical intuition that Faraday specializes in.

## When to use this team

- **Designing experiments** -- planning a measurement procedure, selecting instruments, identifying control variables, and predicting expected results before entering the lab.
- **Analyzing lab data** -- interpreting raw measurements, fitting models to data, identifying systematic errors, and drawing conclusions from noisy observations.
- **Uncertainty analysis** -- propagating measurement uncertainties through calculations, building error budgets, distinguishing systematic from statistical errors, and reporting results with appropriate confidence intervals.
- **Fermi estimation** -- order-of-magnitude problems where the goal is a reasonable estimate with identified assumptions (e.g., "how many piano tuners are in Chicago?" but for physics: "what is the total power radiated by all the light bulbs in a city?").
- **Experimental verification of theory** -- designing a measurement to test a theoretical prediction, including identifying what precision is needed to distinguish competing models.
- **Instrument selection and calibration** -- choosing the right sensor, determining required resolution, planning calibration procedures.
- **Reproducing classic experiments** -- Millikan oil drop, Cavendish torsion balance, Michelson-Morley, photoelectric effect. Faraday designs the modern reproduction while the domain specialist provides the theory.

## When NOT to use this team

- **Pure theoretical derivation** with no experimental context -- use `problem-solving-team`.
- **Multi-domain research synthesis** -- use `physics-analysis-team`.
- **Single-domain computation** where no measurement is involved -- route to the specialist directly.
- **Engineering design** (building a bridge, sizing a motor) -- physics departments analyze; engineering departments design to spec.
- **Data science or machine learning** on non-physics datasets -- wrong department entirely.

## Composition

The team runs four Physics Department agents:

| Role | Agent | Responsibility | Model |
|------|-------|----------------|-------|
| **Lead / Designer** | `faraday` | Experimental design, procedure, intuition, safety awareness | Sonnet |
| **Methodology / Safety** | `curie` | Methodology review, safety flags, cross-domain awareness | Opus |
| **Theory** | `newton` or `maxwell` | Theoretical predictions for the measurement (selected by domain) | Opus / Sonnet |
| **Statistics / Error** | `boltzmann` | Uncertainty propagation, statistical analysis, error budgets | Sonnet |

The theory slot is filled by the domain-appropriate specialist: `newton` (Opus) for mechanics and gravitation experiments, `maxwell` (Sonnet) for E&M and optics experiments. For thermodynamics experiments, Boltzmann serves double duty as both theory source and statistical analyst. Curie makes this routing decision.

## Orchestration flow

```
Input: experiment goal + optional data + optional user level
        |
        v
+---------------------------+
| Faraday (Sonnet)          |  Phase 1: Design the experiment
| Lead / Designer           |          - identify the measurable quantity
+---------------------------+          - propose experimental procedure
        |                              - list required equipment
        |                              - identify control variables
        |                              - predict sources of error
        |                              - draw schematic (ASCII)
        |
        v
+---------------------------+
| Curie (Opus)              |  Phase 2: Methodology review
| Review and refine         |          - check for confounding variables
+---------------------------+          - flag safety hazards
        |                              - verify the measurement actually
        |                              |   tests what the user intends
        |                              - suggest improvements
        |                              - route to domain specialist
        |
        +------ Mechanics? -----> Newton (Opus)   ---+
        |                                            |
        +------ E&M/Optics? ----> Maxwell (Sonnet) --+
        |                                            |
        +------ Thermo? -------> Boltzmann (Sonnet) -+
        |                                            |
        v                                            v
   (skip if Fermi)              Phase 3: Theory prediction
                                         - derive expected result
                                         - identify measurable signature
                                         - specify precision needed to
                                         |   distinguish from null hypothesis
                                         - flag regime of validity
        |                                            |
        +--------------------------------------------+
        |
        v
+---------------------------+
| Boltzmann (Sonnet)        |  Phase 4: Statistical analysis
| Uncertainty & error       |          - propagate uncertainties
+---------------------------+          - build error budget table
        |                              - recommend sample size / repetitions
        |                              - identify dominant error source
        |                              - suggest how to reduce it
        |                              - chi-squared or residual analysis
        |                              |   (if data is provided)
        |
        v
+---------------------------+
| Faraday (Sonnet)          |  Phase 5: Synthesize and explain
| Final experimental brief  |          - compile complete procedure
+---------------------------+          - merge theory + error analysis
        |                              - produce lab-report-ready output
        |                              - suggest improvements for next run
        |
        v
+---------------------------+
| Curie (Opus)              |  Phase 6: Record
| Produce Grove records     |          - PhysicsExperiment record
+---------------------------+          - link theory + error products
        |                              - emit PhysicsSession
        |
        v
                  Final response to user
                  + PhysicsSession Grove record
```

## Design rules

Faraday and Curie enforce these rules across all experimental designs:

### Rule 1 -- Measure, don't assume

Every quantity that enters a calculation must either be measured or explicitly identified as an assumption. Hidden assumptions are the primary source of systematic error in experimental physics. If a problem says "assume g = 9.81 m/s^2," the design should note that this is an assumption and estimate the error introduced by the local value of g.

### Rule 2 -- Error budget before data collection

The uncertainty analysis (Phase 4) should inform the experimental design (Phase 1), not just describe it after the fact. Boltzmann's error budget identifies the dominant error source; Faraday then modifies the procedure to minimize that source. This feedback loop runs at design time, not after the experiment.

### Rule 3 -- Control variables are mandatory

Every experiment must identify at least one control variable and explain how it will be held constant. "We assume the temperature is constant" is not a control -- "we enclose the apparatus in a temperature-controlled chamber at 20.0 +/- 0.5 C" is a control.

### Rule 4 -- Safety is not optional

Curie reviews every experimental design for safety hazards. High voltage, radiation sources, cryogenics, vacuum systems, lasers, and chemical hazards are flagged explicitly with required precautions. An experiment that cannot be performed safely is redesigned, not approved with warnings.

### Rule 5 -- Fermi problems get Fermi treatment

For Fermi estimation problems, the team does not design a full experiment. Instead:
1. Faraday decomposes the problem into estimable sub-quantities.
2. The domain specialist provides physical bounds on each sub-quantity.
3. Boltzmann propagates the uncertainty of each estimate.
4. Faraday synthesizes the result with an honest confidence range.

The goal is a defensible order-of-magnitude estimate, not a precise measurement plan.

### Rule 6 -- Reproducibility is a first-class requirement

Every experimental procedure must be described with enough detail that another physicist could reproduce the measurement independently. Equipment model numbers, calibration procedures, environmental conditions, and data collection protocols are all required.

## Input contract

The team accepts:

1. **Experiment goal** (required). What the user wants to measure, test, or estimate. Can be a physical quantity, a hypothesis, or a Fermi question.
2. **Data** (optional). Raw measurement data for analysis. Can be provided as a table, CSV, or described in text.
3. **Equipment constraints** (optional). What instruments or facilities are available.
4. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Curie infers from the goal.
5. **Prior PhysicsSession hash** (optional). Grove hash for iterating on a previous design.

## Output contract

### Primary output: Experimental brief

A complete experimental brief that:

- States the measurement objective clearly
- Describes the procedure step by step
- Lists required equipment with specifications
- Identifies control variables and how they are maintained
- Provides the theoretical prediction (with derivation)
- Includes a complete error budget table
- Recommends sample size and number of repetitions
- Flags safety considerations
- Suggests improvements for subsequent runs

### Grove records

The team produces:

```yaml
type: PhysicsExperiment
objective: <what is being measured or tested>
hypothesis: <if applicable, the prediction being tested>
procedure:
  - <step 1>
  - <step 2>
  - ...
equipment:
  - name: <instrument>
    resolution: <measurement resolution>
    range: <measurement range>
control_variables:
  - <variable 1>: <how controlled>
  - <variable 2>: <how controlled>
theory_prediction:
  value: <expected result>
  derivation_hash: <grove hash of PhysicsDerivation>
error_budget:
  statistical:
    - source: <error source>
      magnitude: <estimated size>
  systematic:
    - source: <error source>
      magnitude: <estimated size>
      mitigation: <how to reduce>
  dominant_source: <which error dominates>
  total_uncertainty: <combined uncertainty>
safety_flags:
  - <hazard 1>: <required precaution>
repetitions_recommended: <number>
```

Each experiment is wrapped in a PhysicsSession record linking all work products.

## Escalation paths

### Internal escalations (within the team)

- **Theory prediction requires multiple domains:** If the theoretical prediction needs both mechanics and E&M (e.g., measuring the charge-to-mass ratio of an electron), Curie activates both Newton and Maxwell for Phase 3. This is the only case where the team runs two theory specialists.
- **Error budget reveals experiment is infeasible:** If Boltzmann's analysis shows the required precision exceeds available instrument resolution by more than an order of magnitude, Faraday redesigns the experiment or Curie reports that the measurement is not feasible with stated equipment.
- **Safety review blocks the design:** If Curie identifies a hazard that cannot be mitigated with available equipment, the experiment is redesigned with a safer alternative approach. The team does not approve unsafe procedures.

### External escalations (to other teams)

- **To physics-analysis-team:** When the experiment touches quantum or relativistic regimes that require Feynman or Chandrasekhar for the theoretical prediction (e.g., designing a test of time dilation, measuring quantum tunneling rates).
- **To problem-solving-team:** When the user needs a detailed derivation of the theory behind the measurement before designing the experiment.
- **To Mathematics Department:** When the statistical analysis requires advanced techniques (Bayesian inference, Monte Carlo error propagation, regression beyond linear fits) that exceed Boltzmann's standard toolkit.

### Escalation to the user

- **Under-specified experiment:** If the user has not provided enough information to design a meaningful experiment (e.g., "measure gravity" without specifying what aspect, what precision, what equipment), Faraday asks for clarification.
- **Ethical or regulatory concerns:** If the proposed experiment involves human subjects, environmental impact, or regulated materials, Curie flags this and notes that institutional review may be required.
- **Outside physics:** If the experimental goal is fundamentally biological, chemical, or geological in nature, Curie acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per experimental design:

- **Faraday** -- 2 Sonnet invocations (design + synthesize), ~30K tokens total
- **Curie** -- 2 Opus invocations (review + record), ~30K tokens total
- **Theory specialist** -- 1 invocation (Opus or Sonnet), ~20-40K tokens
- **Boltzmann** -- 1 Sonnet invocation, ~20-30K tokens
- **Total** -- 100-180K tokens, 3-10 minutes wall-clock

Moderately priced. The six-phase sequential flow is slower than single-agent invocation but ensures the design-review-theory-statistics pipeline catches errors early.

## Configuration

```yaml
name: experimental-design-team
lead: faraday
reviewer: curie
theory:
  mechanics: newton
  electromagnetism: maxwell
  thermodynamics: boltzmann  # double-duty with statistics
statistics: boltzmann

parallel: false  # sequential pipeline is essential for design feedback
timeout_minutes: 12

# Curie selects the theory specialist based on domain
auto_route_theory: true

# Fermi mode skips Phase 3 (theory) and simplifies Phase 4
fermi_mode: auto  # detected from problem type
```

## Invocation

```
# Design a lab experiment
> experimental-design-team: Design an experiment to measure the speed of sound
  in air at room temperature using only a tube, a speaker, and a microphone.
  Target precision: 1%. Level: intermediate.

# Analyze existing lab data
> experimental-design-team: I measured the period of a pendulum 20 times and
  got these values (in seconds): 1.42, 1.45, 1.43, 1.44, 1.41, 1.46, 1.43,
  1.44, 1.42, 1.45, 1.43, 1.44, 1.41, 1.43, 1.42, 1.44, 1.45, 1.43, 1.44,
  1.42. The pendulum length is 0.500 +/- 0.002 m. Calculate g with full
  uncertainty analysis.

# Fermi estimation
> experimental-design-team: Estimate the total kinetic energy of all the air
  molecules in this room (5m x 4m x 3m, standard conditions). How would you
  verify this estimate experimentally?

# Classic experiment reproduction
> experimental-design-team: I want to reproduce the Millikan oil drop
  experiment with modern equipment. Design the apparatus, procedure, and
  analysis pipeline. Level: graduate.

# Follow-up
> experimental-design-team: (session: grove:abc123) The dominant error was
  parallax in reading the micrometer. How can I redesign to eliminate this?
```

## Limitations

- The team designs experiments but does not execute them. Physical measurements, instrument readings, and data collection happen outside the team's scope.
- Statistical analysis is limited to Boltzmann's toolkit: propagation of uncertainties, chi-squared analysis, linear and polynomial regression, basic hypothesis testing. Advanced Bayesian methods or MCMC require escalation.
- The team does not have access to equipment catalogs or pricing databases. Equipment recommendations are based on physics requirements, not procurement constraints.
- For experiments requiring quantum or relativistic theory, the team must escalate to physics-analysis-team for the theoretical prediction. The experimental design itself remains in this team's scope.
- Simulation-based experimental design (computational experiments, virtual labs) is not supported. The team designs physical measurements of physical systems.
