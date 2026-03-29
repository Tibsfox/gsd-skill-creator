# Vision Guide -- Fleet Feature Refinement

> Same destination. Original path. The fox finds where the ground has been worn smooth -- then builds a better road.

## The Through-Line

Forty-five years of engineering work leaves residue. Not the kind that accumulates in corners and needs cleaning -- the kind that becomes load-bearing. PIC programming in a strip-mall electronics shop in Everett. C on machines that had no operating system to hide behind. Display interfaces, toll call restrictors, wood product sensors for Eddie Bauer fixtures. DVD division build management at Philips Semiconductor in the same building where the 555 timer was designed. Sysadmin staffing and consulting at Taos. Systems that had to work because there was no one to call if they didn't.

The through-line is not nostalgia. It is specification. Every system built under genuine constraints -- memory pressure, hardware limits, deadline pressure, no documentation, no second chances -- teaches the same lesson in different dialects: **the constraint is the teacher**. The system that has to fit in 2K of RAM teaches you what a 2K system is actually for. The system that can't crash teaches you what crashing actually costs. The system that has to explain itself to a customer who doesn't read manuals teaches you what interface design actually means.

The Fleet Feature Refinement mission is built from that residue. Ten modules. Four teams. One architecture. Zero borrowed code.

## The Amiga Principle

The Commodore Amiga had a custom chipset: Agnus for DMA scheduling, Denise for pixel rendering, Paula for audio output. Three specialized chips, each addressing the same shared memory through different lenses. No chip tried to do another chip's job. The CPU was freed to do CPU work because the custom chips handled everything else. The result was a machine that outperformed systems with ten times the raw clock speed -- not because of power, but because of architecture.

This is the Amiga Principle: **specialize the hardware, share the bus, free the CPU**.

Applied to fleet architecture:
- Safety Warden is Paula. It gates every output before delivery. It does not compute. It does not route. It gates.
- Credential Tiering is Denise. It renders the access picture -- who can see what, who can do what, at what scope. It does not enforce. It specifies.
- DACP Event Bus is Agnus. It schedules and routes. It does not process events. It moves them.

The CPU (the orchestrating model, the human at the terminal) is freed to do orchestration work because the custom modules handle everything else.

## Convergent Discovery with thepopebot

The ten problem statements in this mission were not invented. They were discovered -- and then discovered again, independently, by a different engineer working from a different context.

thepopebot is a fleet management system built by someone who arrived at the same destination via a different path. The convergence is the proof. When two independent engineers, working without coordination, both identify that:

- Safety warden gates need to be non-optional and non-bypassable
- Credential tiering is structurally separate from credential enforcement
- Event bus isolation prevents cross-module queue poisoning
- Model routing needs a fallback path that is explicit, not implicit
- Audit trail immutability is a correctness requirement, not a logging nicety

...then the architecture is not a preference. It is load-bearing.

The clean-room discipline here is absolute: no thepopebot source was read before specification was written. The convergence was verified after the fact. The proof is in the parallel structure of the problem statements -- same problems, different implementations, same solutions. **This is what convergent discovery looks like.**

## The 10 Problem Statements

### M8 -- Safety Warden
**Problem:** Fleet outputs reach users without systematic verification. Some outputs are incorrect. Some outputs are incomplete. Some outputs carry unverified claims. There is no gate.

**Statement:** Every output produced by any module must pass a block-level safety gate before delivery. The gate must be non-optional. The gate must be non-bypassable. The gate must produce a deterministic pass/fail result with a traceable reason.

### M3 -- Credential Tiering
**Problem:** Fleet operations are granted to agents based on identity, not role. Role changes require reconfiguring identities. Scope is not enforced at the architecture level.

**Statement:** Operations are authorized by tier, not identity. Tiers encode role, scope, and clearance. Identity maps to tier. Tier grants operation class. No operation executes outside its tier boundary.

### M6 -- Chipset Schema
**Problem:** Chipset YAML definitions are informally structured. Extensions break existing definitions. There is no versioning contract.

**Statement:** Chipset YAML has a formal schema with versioning. New chip types extend the schema without modifying existing definitions. Existing YAML loads without change after schema extension.

### M4 -- DACP Event Bus
**Problem:** Cross-module communication happens through shared state. Module A writes to a location that Module B reads. When Module A changes its write format, Module B breaks silently.

**Statement:** Cross-module communication flows through a typed event bus. Events are declared, not inferred. Producers emit typed events. Consumers subscribe to typed events. Type mismatches fail at declaration, not at runtime.

### M1 -- Cluster Topology
**Problem:** Fleet node registration is manual. Node health is not tracked. Failover is not defined. The system does not know what it contains.

**Statement:** Nodes register with the cluster. Registration includes capability declaration. Health is monitored. Failover paths are pre-computed. The system always knows what it contains and what it can do.

### M7 -- Model Routing
**Problem:** Workloads are dispatched to models by convention. Conventions drift. Expensive models handle cheap workloads. Cheap models are asked for expensive reasoning. Cost is untracked.

**Statement:** Workloads have declared complexity profiles. Routing matches complexity to capability. Cost is tracked per workload class. Fallback is explicit and logged. Routing decisions are auditable.

### M2 -- Intake Layer
**Problem:** Inputs enter the system without validation. Malformed inputs are discovered deep in the pipeline, after expensive computation. Error messages reference internals.

**Statement:** All inputs pass an intake contract before entering the pipeline. Contract violations are rejected at the boundary with user-facing explanations. Nothing malformed reaches downstream modules.

### M5 -- Skill Audit Trail
**Problem:** Skill invocations are not logged. When a skill produces incorrect output, there is no record of what was invoked, with what context, at what time.

**Statement:** Every skill invocation produces an immutable log entry: skill name, version, input hash, output hash, timestamp, invoking agent, completion status. The log is append-only. No entry is modifiable after writing.

### M9 -- Pattern Detection
**Problem:** Anomalies in fleet behavior are discovered by users after they cause problems. There is no proactive monitoring. Signal is buried in noise.

**Statement:** Pattern detection runs continuously against the audit trail and event bus. Anomalies are classified (performance, correctness, safety, cost). Classified anomalies surface to the retrospective engine. No anomaly is silently discarded.

### M10 -- Retro Loop
**Problem:** Lessons learned from mission retrospectives are written in documents that no future mission reads. Carry-forward context is lost between sessions. Each mission starts from zero.

**Statement:** The retrospective engine produces structured carry-forward packages: lesson records with module attribution, pattern signatures, and recommended adjustments. The retro loop seeds the next mission's context. Knowledge compounds across missions.

## Core Concept

**Ten modules. Four teams. One architecture. Zero borrowed code.**

The architecture is not additive. Each module is structurally necessary for the others to function correctly. Safety Warden cannot gate outputs that were never logged (M5). Pattern detection cannot surface anomalies from events that were never routed (M4). Model routing cannot optimize across a cluster topology that was never registered (M1). The retro loop cannot carry forward lessons that were never classified (M9, M10).

The dependency graph is the architecture. The rollout sequence respects it.

## Scope Boundaries

**In scope:**
- All 10 module specifications (schema, contracts, test suites)
- Chipset YAML extension definitions
- DACP operation type declarations
- Integration test harness (full-cycle, end-to-end)
- Wave execution plan with CAPCOM gate specifications
- Retrospective and carry-forward documentation

**Out of scope:**
- Production deployment infrastructure
- Model API integrations (mock interfaces only)
- User interface for fleet management
- Federation between independent fleet instances
- Real-time monitoring dashboards
- Historical data migration from pre-FLT systems

## Success Criteria

1. All 72 tests passing (8 safety-critical at BLOCK level, 32 contract-functional, 20 integration, 12 edge-case)
2. All 10 module specs complete with schema definitions and DACP operation types
3. Chipset YAML schema extended with FLT chip types, existing definitions unmodified
4. Full-cycle integration test running end-to-end (M8 gate -> M3 credential -> M6 schema -> M4 bus -> M1 topology -> M7 routing -> M2 intake -> M5 audit -> M9 pattern -> M10 retro)
5. Clean-room compliance verified: no thepopebot source in implementation
6. Retrospective complete with carry-forward package for next mission

> **Related:** [02-research-reference.md](02-research-reference.md), [03-milestone-spec.md](03-milestone-spec.md), ABL (Amiga Principle), AAR (architecture audit), WAL (Lex's theorem)
