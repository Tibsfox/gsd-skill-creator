# Phase 23: Specialized Pack Integration - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate the 3 specialized packs (electronics, Minecraft/spatial-computing, OpenStack/cloud-systems) into the `.college/departments/` framework as fully discoverable departments with their domain-specific interactive features preserved. Each department gets 5 wings, typed RosettaConcept files, try-sessions, calibration stubs, and chipset configurations. The unique extensions (MNA simulator, spatial builds, runbooks) must be accessible through department-specific interfaces, not replaced by the generic college format.

</domain>

<decisions>
## Implementation Decisions

### Wing Grouping Strategy
- Electronics (15 modules, 4 tiers) maps to 5 wings using tier-based grouping: Tier 1 → 1 wing, Tier 2 → 1 wing, Tier 3 → 1 wing, Tier 4 split into 2 wings. Preserves progressive difficulty design.
- Cloud-systems (OpenStack/NASA SE) maps to 5 wings using service-layer grouping: Identity & Networking, Compute & Storage, Orchestration, NASA SE Lifecycle, Runbook Operations.
- Spatial-computing (Minecraft) maps to 5 wings using gameplay-to-engineering progression: Spatial Foundations, Building & Architecture, Redstone Engineering, Systems & Automation, Collaborative Design.
- Strict 5-wing structure for all three departments — matches Phase 22 pattern, keeps CollegeLoader assumptions uniform.
- Minimum 3 concepts per wing (matching Phase 22), natural maximum where source material warrants it. Electronics wings may have 5-8 concepts given 15 dense modules.

### Domain Extension Interfaces
- Each specialized department gets an `extensions/` directory alongside `concepts/` — pattern: `.college/departments/electronics/extensions/mna-lab.ts`
- Electronics: Try-sessions wrap the MNA simulator and other engines in `src/electronics-pack/simulator/`. Simulator code stays in `src/`, department try-sessions reference it. No code duplication.
- Cloud-systems: Try-sessions import and use existing `Runbook`, `ProcedureStep`, `NASASEPhase` types from `src/types/openstack.ts`. Preserves type safety.
- Domain prefixes: `elec-` for electronics, `spatial-` for spatial-computing, `cloud-` for cloud-systems. Consistent with existing convention (phys-, chem-, code-, etc.)

### Minecraft/Spatial-Computing Source
- No dedicated source pack exists — content created from domain knowledge. This is new content scaffolded in the college format, not a migration from existing YAML modules.
- Try-sessions describe concrete Minecraft builds: redstone calculator circuits, water elevators, automated farms. Uses real Minecraft vocabulary (blocks, redstone dust, repeaters, comparators).
- Wing structure follows gameplay-to-engineering progression, from spatial navigation to collaborative server projects.

### Chipset Migration
- YAML format preserved in `.college/departments/{dept}/chipset/` directories. Matches existing chipset convention (src/brainstorm/chipset.yaml, src/vtm/chipset.yaml).
- All three departments get chipset configurations: electronics (14 skills, routing tables), cloud-systems (service-based routing), spatial-computing (build-type routing).
- Both skill definitions and agent IDs are migrated into department chipset/ directories.

### Claude's Discretion
- Exact concept-to-wing mapping for electronics modules within the tier-based grouping
- Specific concept IDs and naming within each wing
- Calibration model details for each department
- Internal structure of the extensions/ directory beyond the typed interface files
- How to structure OpenStack chipset given no existing chipset.yaml source

</decisions>

<specifics>
## Specific Ideas

- Electronics department should preserve the Horowitz & Hill (Art of Electronics) chapter references from chipset.yaml
- Minecraft try-sessions should feel genuinely hands-on — describing builds with coordinates, block types, and redstone components
- OpenStack runbook try-sessions should reference the 8 core services (keystone, nova, neutron, cinder, glance, swift, heat, horizon) and NASA SE verification methods (test, analysis, inspection, demonstration)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/electronics-pack/simulator/mna-engine.ts`: MNA circuit analysis engine with DC analysis, AC analysis, stamp logging
- `src/electronics-pack/simulator/`: 11 engine files (dsp-engine, gpio-sim, logic-sim, plc-engine, solar-engine, transient, etc.)
- `src/electronics-pack/chipset.yaml`: 14 skill definitions with triggers, module mappings, HH chapter references, tier assignments
- `src/electronics-pack/metadata.yaml`: Module tier structure (4 tiers, 15 modules)
- `src/types/openstack.ts`: Full type definitions for OpenStack services, NASA SE phases, runbooks, communication loops
- `src/validation/openstack-validation.ts`: Zod schemas for all OpenStack/NASA SE types
- `src/cloud-ops/`: Cloud operations modules (dashboard, staging, git, observation)

### Established Patterns
- Phase 22 department pattern: DEPARTMENT.md, concepts/{wing-name}/{concept-file}.ts, try-sessions/, calibration/
- RosettaConcept typed files with domain prefix convention (code-, phys-, chem-, etc.)
- CollegeLoader auto-discovers from filesystem (COLL-05 principle)
- Minimum 3 concepts per wing, barrel exports via index.ts

### Integration Points
- CollegeLoader discovers departments from `.college/departments/` directory
- Try-sessions connect to source engines via TypeScript imports
- Extensions directory is new — needs to be discoverable or referenced from DEPARTMENT.md
- Chipset/ directories need to be loadable by existing chipset infrastructure

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-specialized-pack-integration*
*Context gathered: 2026-03-02*
