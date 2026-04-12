---
name: systems-team
type: team
category: engineering
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/engineering/systems-team/README.md
description: Systems engineering and integration team for complex engineered systems. Four agents -- Johnson-K (lead), Tesla, Watt, Polya-E -- handle requirements management, V-model lifecycle, integration planning, verification and validation, interface control, and technical performance tracking. Use for systems-level problems, NASA-style SE processes, complex integration challenges, and verification/validation planning.
superseded_by: null
---
# Systems Team

Systems engineering and integration team for complex engineered systems. Manages the V-model lifecycle from requirements through verification, with emphasis on integration, interface control, and cross-domain verification.

## When to use this team

- **Systems engineering problems** requiring requirements decomposition, traceability, and V-model lifecycle management.
- **Integration challenges** where subsystems from different engineering domains must work together.
- **Verification and validation planning** for complex systems with hundreds of requirements.
- **Interface control** between electrical, mechanical, thermal, and software subsystems.
- **Technical performance measure (TPM) tracking** for systems in development.
- **NASA-style SE processes** (SP-2016-6105) applied to any complex system.
- **Mission design** requiring end-to-end systems analysis (trajectory, power, thermal, communications).

## When NOT to use this team

- **Single-domain structural or materials analysis** -- use roebling or lovelace-e directly.
- **Full design review** with safety analysis across all domains -- use the engineering-review-team.
- **Early-stage concept generation** -- use the design-sprint-team for rapid exploration.
- **Pure pedagogy** -- use polya-e directly.

## Composition

| Role | Agent | Contribution | Model |
|------|-------|-------------|-------|
| **Lead / Systems Engineer** | `johnson-k` | Requirements management, V-model, verification planning, mission analysis | Opus |
| **Electrical / Controls** | `tesla` | Electrical subsystem integration, control systems, EMC, avionics | Opus |
| **Mechanical / Thermal** | `watt` | Thermal subsystem integration, mechanical interfaces, fluid systems | Sonnet |
| **Pedagogy / Documentation** | `polya-e` | Requirements writing guidance, SE process explanation, documentation | Sonnet |

This team is led by Johnson-K (not Brunel) because systems engineering is Johnson-K's primary domain. Brunel serves as CAPCOM for user communication but delegates systems-level orchestration to Johnson-K within this team. The team excludes Roebling and Lovelace-E because structural and materials questions are typically resolved at the component level, while this team operates at the system and subsystem level.

## Orchestration flow

```
Input: systems engineering problem + optional system description + optional user level
        |
        v
+---------------------------+
| Johnson-K (Opus)          |  Phase 1: Define the systems context
| Lead                      |          - system boundaries
+---------------------------+          - subsystem decomposition
        |                              - interface identification
        |                              - requirements hierarchy
        |
        +--------+--------+
        |        |        |
        v        v        v
     Tesla     Watt    Polya-E
     (elec)   (mech)   (docs)
        |        |        |
    Phase 2: Subsystem analysis
             Tesla: electrical architecture,
               control systems, interfaces
             Watt: mechanical/thermal architecture,
               physical interfaces, energy budgets
             Polya-E: requirements quality check,
               documentation scaffolding
        |        |        |
        +--------+--------+
                 |
                 v
      +---------------------------+
      | Johnson-K (Opus)          |  Phase 3: Integration assessment
      | Systems synthesis         |          - interface compatibility
      +---------------------------+          - requirements coverage
                 |                           - TPM status
                 v                           - verification plan
      +---------------------------+
      | Polya-E (Sonnet)          |  Phase 4: Document
      | Present results           |          - SE artifact generation
      +---------------------------+          - level-appropriate output
                 |
                 v
          Systems team output
          + EngineeringSession Grove record
```

## Systems Engineering Protocol

### Phase 1 -- Systems Context (Johnson-K)

Johnson-K defines:
- **System boundary:** What is inside the system, what is outside, what crosses the boundary.
- **Subsystem decomposition:** Major subsystems and their responsibilities.
- **Functional architecture:** What functions the system must perform and how they map to subsystems.
- **Interface list:** Every interface between subsystems, classified by type (physical, functional, thermal, data).
- **Requirements hierarchy:** System requirements decomposed to subsystem requirements.

### Phase 2 -- Subsystem Analysis (Parallel)

Each specialist analyzes their domain:

- **Tesla** assesses the electrical architecture: power budget, signal paths, control loops, EMC, grounding, and data interfaces. Produces a power budget and control architecture.
- **Watt** assesses the mechanical/thermal architecture: mass budget, thermal budget, mechanical interfaces, fluid connections, and vibration. Produces a mass budget and thermal analysis.
- **Polya-E** reviews the requirements for quality (necessary, verifiable, unambiguous, complete, consistent, achievable, traceable) and flags deficiencies. Produces a requirements quality assessment.

### Phase 3 -- Integration Assessment (Johnson-K)

Johnson-K synthesizes:
- **Interface compatibility:** Do the subsystem interfaces match? Are signal levels, connector types, thermal paths, and mechanical mounting points consistent?
- **Requirements coverage:** Are all system requirements allocated to subsystems? Are all subsystem requirements traceable to system requirements?
- **TPM status:** Are mass, power, delta-v, data rate, and other TPMs within budget?
- **Verification plan:** For each requirement, what verification method (test, inspection, analysis, demonstration) will be used?
- **Risk register:** What integration risks exist and how will they be mitigated?

### Phase 4 -- Documentation (Polya-E)

Polya-E produces the output document:
- Systems analysis summary at the appropriate user level
- Requirements traceability matrix (or subset)
- Interface control summary
- TPM dashboard
- Verification plan outline
- Recommendations and next steps

## Input contract

1. **Systems engineering problem** (required). Description of the system, the question, or the lifecycle phase.
2. **System description** (optional). Existing documentation of the system architecture.
3. **User level** (optional). Defaults to advanced (systems engineering is inherently advanced).

## Output contract

### Primary output: Systems analysis report

A structured report containing:
- System architecture overview
- Requirements analysis (quality, completeness, traceability)
- Subsystem assessments (electrical, mechanical/thermal)
- Interface compatibility assessment
- TPM status dashboard
- Verification plan
- Risks and recommendations

### Grove record: EngineeringSession

```yaml
type: EngineeringSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original systems engineering question>
classification:
  domain: systems
  complexity: professional
  type: analyze
  user_level: advanced
agents_invoked:
  - johnson-k
  - tesla
  - watt
  - polya-e
work_products:
  - <grove hash of EngineeringAnalysis: systems>
  - <grove hash of EngineeringAnalysis: electrical>
  - <grove hash of EngineeringAnalysis: mechanical>
  - <grove hash of EngineeringReview: requirements>
concept_ids:
  - engr-control-systems
  - engr-testing-methodology
user_level: advanced
```

## Escalation paths

### Internal escalations

- **Structural integration:** If the systems analysis reveals structural concerns (launch loads, vibration), Johnson-K escalates to the engineering-review-team to bring in Roebling.
- **Materials issues:** If a material selection affects system performance (mass, thermal, corrosion), Johnson-K routes to Lovelace-E through Brunel.
- **Requirements conflict:** If two subsystem requirements are incompatible, Johnson-K mediates. If the conflict cannot be resolved at the subsystem level, it escalates to the system requirements level.

### External escalation

- **Design authority:** For real-world systems, Johnson-K notes that systems engineering decisions must be approved by the responsible design authority (chief engineer, program manager, or technical authority).
- **Outside engineering:** If the problem touches domains beyond engineering (regulatory, financial, political), Johnson-K acknowledges the boundary.

## Token / time cost

Approximate cost per systems analysis:

- **Johnson-K** -- 2 Opus invocations (context + synthesis), ~40K tokens total
- **Tesla** -- 1 Opus invocation (electrical assessment), ~25K tokens
- **Watt** -- 1 Sonnet invocation (mechanical/thermal assessment), ~20K tokens
- **Polya-E** -- 1 Sonnet invocation (documentation), ~15K tokens
- **Total** -- 100-150K tokens, 4-10 minutes wall-clock

## Configuration

```yaml
name: systems-team
lead: johnson-k
specialists:
  - electrical: tesla
  - mechanical: watt
documentation: polya-e

parallel: true
timeout_minutes: 12
```

## Invocation

```
# Systems engineering for a spacecraft
> systems-team: Decompose the requirements for a CubeSat that must image the
  Earth's surface at 5-meter resolution and downlink data within 24 hours of
  capture. Level: professional.

# Integration challenge
> systems-team: We have an electrical subsystem designed by Team A and a
  mechanical subsystem designed by Team B. The interface is a mounting plate
  with power and data connectors. Review the interface for compatibility.

# Verification planning
> systems-team: Create a verification plan for a 50-requirement system
  specification for an autonomous ground vehicle.
```

## Limitations

- No structural specialist (Roebling) on this team -- structural integration is handled at a high level or escalated.
- No materials specialist (Lovelace-E) -- material-level issues are flagged for follow-up.
- The team operates at the system and subsystem level, not the component level.
- For systems with strong structural or materials coupling (bridges, buildings, aircraft structures), the engineering-review-team is more appropriate.
