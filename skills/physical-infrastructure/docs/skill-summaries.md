# Skill and Agent Summaries

One-paragraph summary of each skill and agent in the Physical Infrastructure Engineering Pack v1.48.

---

## Domain Skills (8)

### 1. Fluid Systems

Pipe sizing and fluid flow calculations for water cooling infrastructure. Implements both Darcy-Weisbach (for steel pipe) and Hazen-Williams (for plastic pipe) methods with NPS pipe selection from the ASME B36.10M table. Covers flow rates, pressure drops, Reynolds number classification, pump curves and selection, and NPSH verification. References ASHRAE TC 9.9 water quality classes (W1-W5) for data center cooling water specifications. Includes CDU (Cooling Distribution Unit) selection guidance for direct-to-chip cooling deployments. Safety coverage: pressure limits (ASME B31.3), water hammer mitigation (SC-14), and leak containment for DTC systems (SC-20).

### 2. Power Systems

Electrical load calculations and power distribution design per the National Electrical Code. Implements NEC Article 220 demand load calculations, NEC Table 310.16 conductor sizing for copper and aluminum at three temperature ratings (60C/75C/90C), and transformer sizing with standard kVA size selection. Covers redundancy architectures from N through 2N+1 with Tier classification mapping. Includes NEC 690 solar PV sizing with peak sun hours and system efficiency, and BESS (Battery Energy Storage System) sizing with depth-of-discharge and roundtrip efficiency. Supports DC distribution with emphasis on the arc safety differences from AC (no zero-crossing). Voltage range: 120V-480V AC.

### 3. Thermal Engineering

Heat transfer fundamentals and data center thermal management. Covers conduction, convection, and radiation with governing equations for each mode. Implements LMTD (Log Mean Temperature Difference) and epsilon-NTU methods for heat exchanger sizing, including the L'Hopital edge case for balanced counter-flow (equal temperature differences). Calculates all four data center efficiency metrics: PUE (Power Usage Effectiveness), TUE (Total Usage Effectiveness), WUE (Water Usage Effectiveness), and CUE (Carbon Usage Effectiveness) with target values for each. Includes cooling load calculation by component type (servers, networking, storage, lighting, people) with percentage-of-total guidance. Covers airflow management: raised floor plenum, hot aisle/cold aisle containment, and blanking panels.

### 4. Dimensional Analysis

Unit tracking and dimensional consistency verification across all engineering calculations. Provides SI-to-Imperial and Imperial-to-SI conversions for all physical quantities used in the pack (pressure, flow rate, temperature, length, area, volume, power, energy). Implements tolerance stack-up analysis in both worst-case (linear addition) and RSS (Root Sum Square) methods for multi-component assemblies. Performs spatial constraint verification and AABB collision detection for equipment placement. Applies Buckingham Pi theorem for identifying dimensionless groups governing physical phenomena (e.g., Reynolds number and relative roughness for pipe friction).

### 5. Blueprint Engine

Technical drawing generation for P&ID (Piping and Instrumentation Diagrams) and SLD (Single Line Diagrams). Provides 50 ISA-5.1 symbols organized by category: valves (11), pumps (5), heat exchangers (5), vessels (5), instruments (15), and pipe fittings (9). Provides 30 IEEE electrical symbols including transformers, circuit breakers, motors, generators, and meters. Primary output format is SVG with DXF secondary via svg2dxf conversion pattern. All drawings include ANSI/ASME Y14.1 title blocks with the PE disclaimer. The `checkedBy` field is hardcoded to "VERIFY WITH LICENSED PE" and is not configurable. Supports floor plans and isometric piping drawings.

### 6. Simulation Bridge

Simulation input file generation at three progressive fidelity levels. Level 1: self-contained React artifacts with React.useState and pure solver functions for interactive browser-based exploration (pipe network calculator, electrical load balancer, thermal comfort map, solar array sizer). Level 2: pipe network solvers and circuit simulators for intermediate validation. Level 3: full OpenFOAM case directories (data center airflow, pipe flow pressure drop, heat exchanger performance), ngspice netlists, and FreeCAD FEM setups. All outputs are simulation INPUT files -- the skill never executes solvers. Templates are parameterized YAML that accept design variables and generate complete case configurations.

### 7. Construction Docs

Construction documentation generation from validated designs. Produces Bills of Material (BOM) using a 7-category template with 100-range line numbering for organized material tracking. Generates installation sequences following the standard data center MEP (Mechanical, Electrical, Plumbing) workflow across 6 phases: structural supports, piping rough-in, electrical rough-in, equipment setting, connection and trim, and testing/commissioning. Includes pre-commissioning checklists covering both hydrostatic testing (IPC 312.5) and insulation resistance testing (IEEE 43 megger). Generates O&M (Operations and Maintenance) manual templates.

### 8. Creative Pipeline

Infrastructure visualization using Blender Python (bpy) scripts and ffmpeg media assembly. Generates parametric 3D models of infrastructure components: pipes as Bezier curves with configurable NPS sizing, equipment as parametric meshes (pumps, transformers, panels). Uses Principled BSDF materials for compatibility with both EEVEE and Cycles renderers, including Blender 3.x/4.x input name compatibility. Creates camera animation paths for facility walkthroughs. Defines ffmpeg presets as sourceable shell functions for composability, with platform-specific export variants: 16:9 (landscape), 9:16 (vertical), 1:1 (square), and thumbnail formats.

---

## Agents (6)

### 1. Architect Agent (Opus)

First responder for all infrastructure design requests. Parses natural language requirements into structured `InfrastructureRequest` objects with type, constraints, safetyClass, and outputFormat fields. Resolves constraint conflicts (e.g., available space vs. required equipment footprint). Decomposes complex requests into subsystem specifications for specialist agents. Routes all designs through the Safety Warden before any output reaches the user -- this is non-negotiable rule #1. Uses claude-opus-4-5 for the architectural reasoning and judgment required to decompose ambiguous real-world requirements into precise engineering specifications.

### 2. Calculator Agent (Sonnet)

Mathematical validation engine. Always loads the dimensional-analysis skill unconditionally (Mars Climate Orbiter prevention -- unit errors in engineering calculations have real-world consequences). Returns `CalculationRecord[]` with full unit tracking: every input and output carries a `UnitValue` with numeric value and unit string. All calculations include method citations (e.g., "Darcy-Weisbach + ASHRAE TC 9.9", "NEC Article 220 + NEC Table 310.16"). Safety margins are explicit fields on every calculation record.

### 3. Draftsman Agent (Sonnet)

Blueprint generation from safety-approved designs. Loads the blueprint-engine and construction-docs skills. Produces `BlueprintPackage` objects containing drawings (SVG format), BOM, and title blocks. Activation is gated behind Safety Warden approval -- the Draftsman never receives calculation results that have not passed safety review. Every title block includes the PE disclaimer. Drawing numbers follow MEP convention: M-series for mechanical (P&ID), E-series for electrical (SLD).

### 4. Simulator Agent (Sonnet)

Simulation input generation at three fidelity levels. Defaults to Level 1 (React artifact) unless the user explicitly requests higher fidelity. Level 1 produces self-contained interactive artifacts. Level 3 produces complete OpenFOAM case directories or ngspice netlists. Activated by user request or Safety Warden recommendation (when a design is complex enough to benefit from simulation validation before construction).

### 5. Renderer Agent (Sonnet)

Blender visualization and media production. Generates bpy (Blender Python) scripts for 3D infrastructure models with Principled BSDF materials, lighting setups, and camera animation paths. Produces ffmpeg assembly commands for video compilation. Creates platform-specific export variants for presentations and social media. This agent is optional in the construction-package pipeline.

### 6. Safety Warden (Opus)

Mandatory safety review gate for every output. Cannot be removed from any team topology. Cannot be disabled by any configuration. Operates in three modes determined by `safetyClass` (not user preference): **annotate** (residential/commercial) adds safety notes alongside output; **gate** (industrial/data-center) blocks output on critical/blocking findings until human acknowledges; **redirect** (out-of-scope) halts all design work entirely. Embeds the PE disclaimer on every output without exception. Blocks critical and blocking findings with a Human-in-the-Loop gate requiring explicit acknowledgment text. Reviews against 7-domain safety threshold matrix (pressure, voltage AC, voltage DC, temperature, chemical, structural, arc flash) with severity levels aligned to professional engineering standards (ASME B31.3, NFPA 70E, ASHRAE TC 9.9, NEC 2023, OSHA 1910.303).
