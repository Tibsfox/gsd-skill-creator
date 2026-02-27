# v1.48 — Physical Infrastructure Engineering Pack

**Shipped:** 2026-02-27
**Phases:** 12 (434-445) | **Plans:** 30 | **Commits:** 52
**Requirements:** 80 | **Tests:** 401 | **LOC:** ~21.4K

## Summary

A comprehensive engineering skill pack for physical infrastructure design: data center cooling, electrical power distribution, thermal analysis, and construction documentation. Provides domain-specific analysis skills with a blueprint engine generating P&ID, single-line diagrams, floor plans, and isometric views. All outputs pass through a non-bypassable Safety Warden enforcing PE disclaimer requirements and HITL gates before any engineering calculation leaves the system.

## Key Features

### Fluid Systems Engineering
- Darcy-Weisbach and Hazen-Williams pressure drop calculations with pipe roughness tables
- ASHRAE TC 9.9 thermal guidelines for data center cooling classes (A1-A4, H1)
- CDU (Coolant Distribution Unit) selection with flow rate, delta-T, and capacity matching
- Pump curve modeling with system curve intersection and operating point determination
- Glycol concentration effects on viscosity and heat transfer coefficients

### Power Systems Engineering
- NEC Article 220 demand factor calculations for service entrance sizing
- NEC Article 310 conductor ampacity with temperature derating and conduit fill
- NEC Article 690 solar PV system design: string sizing, inverter matching, rapid shutdown
- Transformer sizing with K-factor harmonic derating for non-linear loads
- UPS runtime calculations with battery aging, temperature correction, and efficiency curves
- PDU whip scheduling and branch circuit load balancing
- BESS (Battery Energy Storage System) capacity planning with depth-of-discharge limits
- DC distribution bus voltage drop analysis (48V, 380V)

### Thermal Engineering
- Conduction, convection, and radiation heat transfer with composite wall R-values
- LMTD (Log Mean Temperature Difference) for counter-flow and cross-flow heat exchangers
- Effectiveness-NTU method for heat exchanger sizing when outlet temperatures are unknown
- PUE, TUE, and WUE efficiency metric calculations with trending
- IT load profiling and cooling load estimation (sensible + latent)
- Free cooling economizer hour calculations by climate zone

### Blueprint Engine
- P&ID generation with 50 ISA-5.1 standard symbols (valves, instruments, vessels, pumps)
- Single-Line Diagram (SLD) generation with 30 IEEE C2-2023 symbols (breakers, transformers, buses)
- Floor plan layout with rack placement, hot/cold aisle containment, and clearance zones
- Isometric piping views with elevation markers and support spacing
- SVG output with optional DXF export for CAD integration
- Parametric symbol helpers with configurable scale and annotation

### Dimensional Analysis
- Physical unit tracking across all calculations (SI and Imperial with conversion)
- Tolerance stack-up analysis for mechanical assemblies (RSS and worst-case)
- Buckingham Pi theorem for dimensional homogeneity validation
- Interference checking between piping, conduit, and structural members
- Cable tray fill calculations with NEC 392 compliance

### Simulation Bridge
- OpenFOAM case file generation for CFD analysis (airflow, thermal plumes)
- ngspice netlist generation for power distribution circuit simulation
- React artifact output for interactive parameter exploration
- Minecraft redstone mapping for educational visualization of power distribution
- Factorio blueprint patterns for cooling loop and power grid layouts
- FreeCAD macro generation for 3D mechanical assembly review

### Construction Documents
- Bill of Materials (BOM) generation with quantity takeoff and lead-time estimates
- Installation sequence planning with predecessor dependencies
- Commissioning checklists mapped to ASHRAE Guideline 0 and NETA ATS
- Operations & Maintenance manual generation with preventive maintenance schedules
- Spare parts lists with criticality classification (A/B/C)

### Creative Pipeline
- Blender bpy script generation for 3D walkthroughs of mechanical rooms
- ffmpeg assembly scripts for construction progress timelapse from photo sequences
- Social media export templates (LinkedIn technical posts, Instagram carousel dimensions)
- Render preset management for different output targets

### Safety Architecture
- Safety Warden operating in 3 modes: annotate, gate, redirect
- Mandatory PE (Professional Engineer) disclaimer on all engineering outputs
- Non-bypassable architecture: safety checks are structural, not configurable
- HITL gate requiring explicit acknowledgment before calculation results are applied
- IEC/NEC/ASHRAE standard citation on every calculation output

### Router Topology Chipset
- Architect agent (Opus) as entry point for design intent classification
- 4 Sonnet specialist agents: Fluid, Power, Thermal, Blueprint
- 3 team topologies: domain-specialist (single domain), cross-domain (multi-system), full-build (end-to-end)
- Router dispatches to specialists based on intent signals with confidence thresholds

### Integration Pipelines
- Cooling E2E pipeline: IT load -> thermal calc -> fluid sizing -> P&ID -> BOM
- Power E2E pipeline: demand calc -> conductor sizing -> SLD -> panel schedule -> BOM
- Combined cross-domain pipeline: power + cooling + thermal with interference checking
- Each pipeline validates dimensional consistency at every stage boundary

### Educational Bridge
- Minecraft redstone circuits mapping to electrical distribution concepts
- Factorio fluid/logistics mapping to cooling and piping systems
- Mathematical connections to "The Space Between" curriculum (fluid dynamics, thermodynamics)
- Progressive disclosure from practical overview to full engineering reference

## Architecture

```
skills/physical-infrastructure/
├── SKILL.md                        # Progressive disclosure entry point
├── references/
│   ├── fluid-systems.md            # Darcy-Weisbach, Hazen-Williams, pump curves
│   ├── power-systems.md            # NEC 220/310/690, transformers, UPS, solar
│   ├── thermal-engineering.md      # Heat transfer, LMTD, e-NTU, efficiency
│   ├── blueprint-engine.md         # P&ID, SLD, floor plan, isometric generation
│   ├── dimensional-analysis.md     # Units, tolerances, Buckingham Pi
│   ├── simulation-bridge.md        # OpenFOAM, ngspice, FreeCAD inputs
│   ├── construction-docs.md        # BOM, sequences, commissioning, O&M
│   └── creative-pipeline.md        # Blender, ffmpeg, social media
├── symbols/
│   ├── isa-5.1/                    # 50 ISA-5.1 P&ID SVG symbols
│   └── ieee-c2/                    # 30 IEEE SLD SVG symbols
├── agents/
│   ├── architect.md                # Opus entry point — design intent router
│   ├── fluid-specialist.md         # Sonnet — pipe sizing, pressure drop
│   ├── power-specialist.md         # Sonnet — electrical loads, conductors
│   ├── thermal-specialist.md       # Sonnet — heat transfer, cooling
│   ├── blueprint-specialist.md     # Sonnet — drawing generation
│   └── safety-warden.md            # Safety agent — annotate/gate/redirect
├── teams/
│   ├── domain-specialist.yaml      # Single-domain focused team
│   ├── cross-domain.yaml           # Multi-system coordination
│   └── full-build.yaml             # End-to-end design-to-docs
└── chipset.yaml                    # Router topology with budget allocation
```

Layers:

```
                    +-----------------------+
                    |    Safety Warden      |  (crosscut — all outputs)
                    +-----------------------+
                              |
  +----------+  +----------+  +----------+  +-----------+
  |  Fluid   |  |  Power   |  | Thermal  |  | Blueprint |  Domain Skills
  +----------+  +----------+  +----------+  +-----------+
       |              |             |              |
  +----------+  +----------+  +----------+  +-----------+
  | Dim Anal |  | Sim Brdg |  | Constr   |  | Creative  |  Analysis / Output
  +----------+  +----------+  +----------+  +-----------+
       |              |             |              |
  +---------------------------------------------------+
  |            Integration Pipelines                   |  E2E Orchestration
  +---------------------------------------------------+
```

## Wave Execution

| Wave | Phases | Description |
|------|--------|-------------|
| 0 | 434 | Foundation types, unit system, safety warden architecture |
| 1A | 435 | Fluid systems: Darcy-Weisbach, Hazen-Williams, pump curves |
| 1B | 436 | Power systems: NEC calculations, transformer sizing, UPS |
| 2A | 437 | Thermal engineering: heat transfer, LMTD, efficiency metrics |
| 2B | 438 | Dimensional analysis: unit tracking, tolerance, Buckingham Pi |
| 3A | 439 | Blueprint engine: P&ID with ISA-5.1 symbols |
| 3B | 440 | Blueprint engine: SLD with IEEE symbols, floor plan, isometric |
| 4A | 441 | Simulation bridge: OpenFOAM, ngspice, FreeCAD, game patterns |
| 4B | 442 | Construction documents: BOM, sequences, commissioning, O&M |
| 5A | 443 | Creative pipeline: Blender, ffmpeg, social media export |
| 5B | 444 | Router topology chipset: Architect + 4 specialists, 3 teams |
| 6 | 445 | Integration pipelines, educational bridge, SKILL.md, tests |
