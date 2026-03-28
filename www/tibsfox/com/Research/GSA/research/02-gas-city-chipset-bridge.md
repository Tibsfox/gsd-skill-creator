# Gas City / Chipset YAML Bridge Specification

> **Domain:** GSD Ecosystem Alignment
> **Module:** 2 -- Declarative Topology Bridge
> **Through-line:** *Gas City is building declarative LEGO from the top down. GSD chipset.yaml is building declarative configuration from the bottom up. They are converging on the same thing from opposite directions. The bridge between them is the highest-leverage alignment artifact in the current ecosystem -- if it holds, GSD becomes infrastructure for a federation of a thousand orchestrators.*

---

## Table of Contents

1. [The Convergence Hypothesis](#1-the-convergence-hypothesis)
2. [Gas Town Operational Roles](#2-gas-town-operational-roles)
3. [GSD Chipset Component Architecture](#3-gsd-chipset-component-architecture)
4. [Role-to-Component Mapping Table](#4-role-to-component-mapping-table)
5. [Bridge Specification: chipset.yaml for Gas City](#5-bridge-specification-chipsetyaml-for-gas-city)
6. [Two-Way Value Proposition](#6-two-way-value-proposition)
7. [Topology Expression Examples](#7-topology-expression-examples)
8. [Mode Mapping: ASIC, FPGA, Hybrid](#8-mode-mapping-asic-fpga-hybrid)
9. [Validation and Simulation](#9-validation-and-simulation)
10. [Bridge Limitations and Open Questions](#10-bridge-limitations-and-open-questions)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Convergence Hypothesis

Gas City and GSD chipset.yaml represent two independent solutions to the same problem: how to express an agent orchestrator topology as structured data rather than imperative code.

Gas City deconstructs Gas Town into composable LEGO primitives -- Mayor, Polecat, Witness, Deacon, Refinery, Convoy -- that can be assembled into custom orchestrator topologies [1]. The design goal is "a pure-declarative version of itself" -- Gas Town as configuration rather than binary [2].

GSD chipset.yaml already does this for a different orchestrator. The chipset architecture defines components (Agnus, Denise, Paula, 68000, Gary), assigns models, declares responsibilities, and specifies execution modes (ASIC for fixed topologies, FPGA for dynamic reconfiguration) [3].

The convergence hypothesis: chipset.yaml's schema can express Gas City topologies with minimal extension, enabling:
- GSD skill-creator to generate Gas City configurations from declarative intent
- Gas City users to leverage chipset.yaml validation, simulation, and dry-run tooling
- A shared vocabulary for describing orchestrator architectures across ecosystems

> **CAUTION:** This module presents a *bridge proposal* that requires review by Julian Knutsen and Chris Sells before any implementation. The Gas City component model is in active development and may evolve in ways that invalidate specific mapping assumptions.

> **Related:** [Yegge Ecosystem](01-yegge-ecosystem-alignment.md), [ISA & Bus](04-isa-bus-architecture.md)

---

## 2. Gas Town Operational Roles

Gas Town defines seven operational roles, each with specific responsibilities in the orchestrator pipeline [2]:

**Mayor** -- The central orchestrator. Directs work across all polecats, manages mail (structured communication), enforces HITL gates, and makes go/no-go decisions. Exactly one per Gas Town instance. The Mayor is the CPU.

**Polecat** -- Parallel execution workers. Each polecat operates in a Git worktree (or server-mode session), receives a work item from the Mayor, executes it, and returns results. Polecats are the coprocessors -- they run autonomously once given instructions. Scale from 1 to N based on available resources [1].

**Witness** -- I/O health monitor. Observes all sessions, detects anomalies, reports to the Mayor. Passive by design -- the Witness watches but does not intervene [1].

**Deacon** -- Daemon patrol. Detects zombie processes, stale sessions, and resource leaks. Routes escalation events to the Trust Tier Escalation Engine. Active patrol, unlike the passive Witness [1].

**Refinery** -- Merge queue management. Handles convoy landing (parallel polecat results merging into a single coherent output), conflict resolution, and final commit assembly. The Refinery is glue logic [1].

**Convoy** -- Work item grouping. Coordinates parallel polecat dispatch, ensures work items in a convoy are properly partitioned, and tracks completion across the group [1].

**Dogs** -- Specialized coprocessors. JSONL Dog (data format), Compactor Dog (cleanup), Doctor Dog (health checks). Each Dog has a narrow, well-defined function [1].

---

## 3. GSD Chipset Component Architecture

GSD's chipset architecture uses Amiga hardware as naming convention, mapping chip roles to orchestrator functions [3]:

**Agnus** -- DMA controller / orchestration. Manages resource allocation, token budgets, wave scheduling, and cache policy. The system bus master. Equivalent to Gas Town's Mayor.

**Denise** -- Display / output rendering. Handles document assembly, visualization, architecture diagrams, and final output production. Equivalent to Gas Town's Polecat (parallel workers producing output).

**Paula** -- I/O / audio / anticipatory. Manages monitoring, patrol, interrupts, and anticipatory caching. Equivalent to Gas Town's Witness + Deacon combined.

**68000 (CPU)** -- General computation and judgment. Handles merge logic, architecture review, safety boundary enforcement, and cross-module integration. Equivalent to Gas Town's Refinery.

**Gary** -- Glue logic. Bus arbitration, signal routing, coordination between other chips. Equivalent to Gas Town's Convoy.

**Custom Chips** -- Task-specific coprocessors. Equivalent to Gas Town's Dogs.

---

## 4. Role-to-Component Mapping Table

| Gas Town Role | GSD Chipset | Function Mapping | Cardinality |
|--------------|-------------|------------------|-------------|
| Mayor | Agnus | Orchestration, DMA -- directs work across all polecats | 1:1 |
| Polecat | Denise (x N) | Parallel execution workers -- render output | 1:N |
| Witness | Paula (monitoring) | I/O health monitoring, observes all sessions | 1:1 |
| Deacon | Paula (patrol) | Daemon patrol, zombie detection, escalation routing | 1:1 |
| Refinery | 68000 (merge logic) | Merge queue management, convoy landing | 1:1 |
| Convoy | Gary (glue) | Work item grouping, parallel polecat coordination | 1:1 |
| Dogs | Custom chips | JSONL Dog, Compactor Dog, Doctor Dog (coprocessors) | 1:N |

The mapping is structurally sound because both systems solve the same coordination problem. The naming differs; the architecture converges.

> **ALIGNED:** Every Gas Town role maps to exactly one GSD chipset component category. No roles are orphaned. No components are unused.

---

## 5. Bridge Specification: chipset.yaml for Gas City

A Gas City topology expressed in GSD chipset YAML:

```
chipset:
  name: gas-city-standard
  version: "1.0.0"
  mode: asic              # pre-built Gas Town topology
  source: gascity          # declares origin ecosystem

  agnus:                   # Mayor
    model: claude-sonnet-4-6
    role: mayor
    mail_inject: true
    hooks: [sessionStart, userPromptSubmitted, preToolUse]
    patrol_interval: 30s
    escalation:
      enabled: true
      severity: [warn, critical, block]

  denise:                  # Polecats (parallel workers)
    model: claude-sonnet-4-6
    role: polecat
    count: 4
    worktree: true
    formula: mol-polecat-work
    test_gates: [CLAUDE.md, AGENTS.md]
    prior_context: true    # inject prior attempt context on re-dispatch

  paula:                   # Witness + Deacon
    monitor: witness
    patrol: deacon
    escalation:
      enabled: true
      severity: [warn, critical, block]
    dogs:
      - compactor-dog
      - doctor-dog
    telemetry:
      otel: true
      backend: victoria-metrics

  cpu_68000:               # Refinery
    role: refinery
    merge_queue: true
    convoy_landing: true
    conflict_resolution: auto

  gary:                    # Convoy
    role: convoy
    partitioning: auto
    completion_tracking: true
```

This YAML is valid chipset.yaml with Gas City-specific extensions. The `source: gascity` field declares the origin ecosystem, enabling GSD tooling to apply Gas City-specific validation rules.

---

## 6. Two-Way Value Proposition

The bridge has value in both directions:

**GSD -> Gas City:**
- GSD skill-creator can generate Gas City configurations from declarative intent (natural language -> chipset.yaml -> Gas City topology)
- Chipset validation tooling (schema validation, dry-run simulation, budget estimation) becomes available to Gas City users
- The FPGA synthesis pipeline (Module 4) can produce Gas City topologies from intent classification

**Gas City -> GSD:**
- Gas City's component model provides a real-world validation target for chipset.yaml expressiveness
- Gas City's Commons board provides a contribution surface where GSD-generated configurations can be tested
- Gas City's user community becomes a testing ground for chipset.yaml tooling

```
TWO-WAY BRIDGE VALUE
================================================================

  GSD Skill-Creator                     Gas City
  +------------------------+           +-----------------------+
  | Intent classification  |---------->| Topology generation   |
  | chipset.yaml validation|---------->| Config validation     |
  | Dry-run simulation     |---------->| Pre-deploy testing    |
  | Budget estimation      |---------->| Resource planning     |
  +------------------------+           +-----------------------+
                                        |
  +------------------------+           |
  | Real-world validation  |<----------|
  | Community testing      |<----------|
  | Expressiveness proof   |<----------|
  | Commons board items    |<----------|
  +------------------------+
```

---

## 7. Topology Expression Examples

### Standard Gas Town (4 polecats)

```
chipset:
  name: gas-town-standard-4
  mode: asic
  source: gascity
  agnus:
    model: claude-sonnet-4-6
    role: mayor
    count: 1
  denise:
    model: claude-sonnet-4-6
    role: polecat
    count: 4
    worktree: true
```

### Minimal Gas Town (1 polecat, no convoy)

```
chipset:
  name: gas-town-minimal
  mode: asic
  source: gascity
  agnus:
    model: claude-haiku-4-5
    role: mayor
  denise:
    model: claude-sonnet-4-6
    role: polecat
    count: 1
```

### Heavy Gas Town (8 polecats, full monitoring)

```
chipset:
  name: gas-town-heavy-8
  mode: asic
  source: gascity
  agnus:
    model: claude-opus-4-6
    role: mayor
    escalation:
      enabled: true
      severity: [warn, critical, block]
  denise:
    model: claude-sonnet-4-6
    role: polecat
    count: 8
    worktree: true
    test_gates: [CLAUDE.md, AGENTS.md]
  paula:
    monitor: witness
    patrol: deacon
    telemetry:
      otel: true
  cpu_68000:
    role: refinery
    merge_queue: true
  gary:
    role: convoy
    partitioning: auto
```

### GSD Hybrid (FPGA mode, dynamic topology)

```
chipset:
  name: gsd-hybrid-research
  mode: fpga              # dynamic reconfiguration
  source: gsd
  agnus:
    model: claude-opus-4-6
    role: flight
  denise:
    model: claude-sonnet-4-6
    role: craft
    count: 3
  paula:
    model: claude-haiku-4-5
    role: log
    budget_tracking: true
```

---

## 8. Mode Mapping: ASIC, FPGA, Hybrid

GSD chipset.yaml defines three execution modes, each mapping to a different Gas City use case:

| Mode | Description | Gas City Application |
|------|------------|---------------------|
| ASIC | Pre-built, fixed topology | Standard Gas Town deployment -- production workload, no reconfiguration |
| FPGA | Dynamic reconfiguration | Gas City builder -- topology changes at runtime based on workload |
| Hybrid | ASIC base + FPGA extensions | Gas Town with custom Dogs or specialized polecats added dynamically |

The FPGA synthesis pipeline (Module 4) maps directly to Gas City's LEGO assembly: the six steps (ELABORATION -> SYNTHESIS -> TECHNOLOGY MAPPING -> PLACE AND ROUTE -> BITSTREAM -> SIMULATION) produce a chipset.yaml that expresses the assembled topology [3].

---

## 9. Validation and Simulation

chipset.yaml tooling provides three validation layers for Gas City topologies:

**Schema Validation:** Verify that the YAML conforms to the chipset schema (required fields, valid types, cardinality constraints). Example: Mayor count must be exactly 1. Polecat count must be >= 1 [3].

**Budget Estimation:** Calculate expected token consumption, context window usage, and estimated wall-clock time based on model assignments and task complexity. Uses the same estimation engine as GSD wave planning [3].

**Dry-Run Simulation:** Execute the topology against a mock workload, verifying that bus routing is correct, merge queue handles parallel output, and escalation routing reaches the intended handler. Catches configuration errors before deployment [3].

```
VALIDATION PIPELINE
================================================================

  chipset.yaml --> [Schema Validator] --> pass/fail
                   |
                   v
                   [Budget Estimator] --> token estimate, wall time
                   |
                   v
                   [Dry-Run Simulator] --> routing verification
                   |
                   v
                   DEPLOY or FIX
```

---

## 10. Bridge Limitations and Open Questions

**Limitation 1: Gas City is still in development.** The component model may evolve in ways that break specific mapping assumptions. The bridge spec must be versioned and re-evaluated against each Gas City release [4].

**Limitation 2: Dogs have no fixed schema.** Gas Town's Dog coprocessors are highly variable -- JSONL Dog, Compactor Dog, Doctor Dog each have different interfaces. The Custom Chips mapping in chipset.yaml would need a plugin system to handle arbitrary Dog types [1].

**Limitation 3: Trust Tier integration is one-way.** The bridge expresses topology but not trust state. Escalation severity, trust tier levels, and reputation scores are runtime state that chipset.yaml cannot capture statically. A separate runtime protocol would be needed [1].

**Open Question 1:** Does Gas City's component model use YAML internally, or would a translation layer be needed?

**Open Question 2:** How does Gas City handle hot reconfiguration (adding/removing polecats at runtime)? The FPGA mode analogy suggests dynamic chip addition, but the implementation details are unknown.

**Open Question 3:** Can Gas City's Commons board accept chipset.yaml contributions, or does it require a different format?

**Open Question 4:** How does Gas City handle multi-model routing? The chipset.yaml bridge assumes different models for different roles (Opus for Mayor, Sonnet for Polecats), but Gas City may route all roles through a single model.

**Open Question 5:** What is the Gas City equivalent of GSD's FPGA synthesis pipeline? If Gas City has its own topology assembly process, the bridge may need to translate between two different synthesis flows rather than replacing one with the other.

> **CAUTION:** This bridge specification is a proposal. It requires review by Julian Knutsen and Chris Sells before any implementation. The Gas City component model is actively evolving.

---

## 11. Bridge Verification Protocol

Before the bridge can be considered valid, the following verification steps must pass:

**V1 -- Schema Compatibility:** Generate chipset.yaml for each of the 4 topology examples. Validate each against the chipset schema. All must pass.

**V2 -- Round-Trip Fidelity:** Convert a Gas Town topology to chipset.yaml, then convert back. The resulting topology must be functionally identical to the original.

**V3 -- Extension Safety:** Verify that Gas City-specific extensions (`source: gascity`, `mail_inject`, `patrol_interval`) do not conflict with existing chipset.yaml fields.

**V4 -- Operational Equivalence:** A Gas Town instance configured via chipset.yaml must produce the same behavior as a natively configured Gas Town instance, for a defined test workload.

```
BRIDGE VERIFICATION PIPELINE
================================================================

  [Gas Town native config] ──> [Convert to chipset.yaml] ──> [V1: Schema check]
       |                              |                             |
       |                              v                            pass
       |                    [Convert back to native] ──────> [V2: Round-trip]
       |                                                           |
       v                                                          pass
  [Native execution] ──────────────────────────────> [V4: Compare behavior]
                                                           |
                                                          pass
                                                           |
                                                    BRIDGE VALIDATED
```

**Acceptance Criteria:** All four verification steps must pass. Failure at any step indicates the bridge specification needs revision. V4 (operational equivalence) is the binding test -- the other three are necessary but not sufficient.

---

## 12. Cross-References

- **Module 1 (Yegge Ecosystem):** Provides the ecosystem state that motivates this bridge
- **Module 3 (Wire Harness):** Bus signal types referenced by Gas City topology routing
- **Module 4 (ISA & Bus):** FPGA synthesis pipeline that produces Gas City configurations
- **GSD2:** Core GSD ecosystem where chipset.yaml originated
- **CMH:** Chipset architecture evolution history
- **ACE:** Agent collaboration patterns applicable to polecat coordination
- **MCF:** Multi-configuration framework relevant to topology variants
- **K8S:** Container orchestration patterns that inform the LEGO assembly metaphor

---

## 13. Sources

1. steveyegge/gastown v0.10.0 CHANGELOG and releases, github.com/steveyegge/gastown
2. Yegge, Steve. "Welcome to Gas Town." Medium, January 14, 2026
3. GSD Project Knowledge: gsd-chipset-architecture-vision.md
4. Yegge, Steve. "Welcome to the Wasteland: A Thousand Gas Towns." Medium, March 2026
5. Yegge, Steve. "The Future of Coding Agents." Medium, January 2026
6. GSD Project Knowledge: skill-creator-wasteland-integration-analysis.md
7. GSD chipset.yaml schema specification (src/core/chipset-validator.ts)
8. GSD FPGA synthesis pipeline specification (gsd-instruction-set-architecture-vision.md)
9. Amiga Hardware Reference Manual, 3rd Edition -- chipset naming convention origin
10. Gas City Commons board: contributor work items and component model documentation
11. DoltHub documentation: federation protocol for topology distribution
12. Julian Knutsen, Gas City design notes (indirect, via Yegge references)
13. Chris Sells, Gas City declarative builder architecture (indirect, via Yegge references)
14. GSD Project Knowledge: gsd-os-desktop-vision.md (Blueprint Editor as topology editor)
15. Kubernetes documentation: declarative infrastructure patterns (analogy reference)
16. Terraform HCL: declarative infrastructure-as-code patterns (analogy reference)
