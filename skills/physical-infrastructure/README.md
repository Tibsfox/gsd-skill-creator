# Physical Infrastructure Engineering Pack v1.48

Complete engineering toolchain for water cooling, power distribution, thermal management, and infrastructure visualization. Enables Claude to serve as an engineering assistant for physical infrastructure design.

Input a requirement like "cool 10 racks at 40kW" and receive a complete, safety-reviewed package including: mathematical calculations with engineering code citations, P&ID and SLD blueprints, bill of materials, simulation inputs for OpenFOAM/ngspice, and Blender visualization scripts.

**Safety note:** All outputs include a mandatory PE disclaimer. The Safety Warden reviews every design before output. Physical infrastructure designs must be verified by a licensed Professional Engineer before construction.

## Architecture

```
User Request ("Cool 10 racks at 40kW each")
         |
         v
+---------------------+
|   ARCHITECT AGENT   |  <- System decomposition (Opus)
+---------+-----------+
     +----+----+
     v         v
+--------+ +------------+
|CALC    | |SIMULATOR   |  <- Parallel tracks (Sonnet)
|AGENT   | |AGENT       |
+---+----+ +-----+------+
    +------+------+
           v
+---------------------+
|   SAFETY WARDEN     |  <- Mandatory gate (Opus)
+---------+-----------+
     +----+----+
     v         v
+--------+ +------------+
|DRAFTS- | |RENDERER    |  <- Output generation (Sonnet)
|MAN     | |AGENT       |
+---+----+ +-----+------+
    +------+------+
           v
    Construction Package
```

## Quick Start

```
# Cooling system design
/physical-infrastructure:design-review "Cool 10 racks at 40kW each in a new data center"

# Power distribution with solar
/physical-infrastructure:design-review "480V three-phase power distribution for 1MW data center with solar backup"
```

See [docs/quick-start-cooling.md](docs/quick-start-cooling.md) and [docs/quick-start-power.md](docs/quick-start-power.md) for step-by-step walkthroughs.

## Skill Pack Contents

### Core

| File | Type | Description |
|------|------|-------------|
| `chipset.yaml` | Config | Multi-agent chipset configuration with 6 agents and 3 team topologies |
| `chipset-docs.md` | Docs | Detailed chipset usage documentation |
| `types/infrastructure.ts` | TypeScript | 13 shared interfaces (InfrastructureRequest, BlueprintPackage, SafetyReviewResult, etc.) |
| `data/engineering-constants.ts` | TypeScript | 18 NPS pipe sizes, 18 NEC conductor ampacities, fluid/material properties |
| `lib/units.ts` | TypeScript | 60+ unit conversions with dimensional tracking |

### Domain Skills (8)

| Skill | Path | Description |
|-------|------|-------------|
| Fluid Systems | `skills/fluid-systems/SKILL.md` | Pipe sizing (Darcy-Weisbach/Hazen-Williams), ASHRAE TC 9.9, pump selection |
| Power Systems | `skills/power-systems/SKILL.md` | NEC 220/310.16 load calc, solar PV (NEC 690), BESS, DC distribution |
| Thermal Engineering | `skills/thermal-engineering/SKILL.md` | Heat transfer, LMTD, PUE/TUE/WUE/CUE, airflow management |
| Dimensional Analysis | `skills/dimensional-analysis/SKILL.md` | Unit tracking, tolerance stack-up (worst-case/RSS), Buckingham Pi |
| Blueprint Engine | `skills/blueprint-engine/SKILL.md` | P&ID (50 ISA-5.1 symbols), SLD (30 IEEE symbols), SVG/DXF output |
| Simulation Bridge | `skills/simulation-bridge/SKILL.md` | OpenFOAM, ngspice, React artifacts, FreeCAD FEM templates |
| Construction Docs | `skills/construction-docs/SKILL.md` | BOM, installation sequences, commissioning checklists, O&M manuals |
| Creative Pipeline | `skills/creative-pipeline/SKILL.md` | Blender bpy scripts, ffmpeg presets, camera paths, social media export |

### Symbol Libraries

| File | Count | Standard |
|------|-------|----------|
| `skills/blueprint-engine/references/symbols/symbols-pid.ts` | 50 symbols | ISA-5.1 |
| `skills/blueprint-engine/references/symbols/symbols-electrical.ts` | 30 symbols | IEEE |

### Simulation Templates

| File | Type | Description |
|------|------|-------------|
| `skills/simulation-bridge/references/openfoam-templates/data-center-airflow.yaml` | OpenFOAM | CFD airflow simulation for data center rooms |
| `skills/simulation-bridge/references/openfoam-templates/pipe-flow-pressure-drop.yaml` | OpenFOAM | Pipe flow pressure drop analysis |
| `skills/simulation-bridge/references/openfoam-templates/heat-exchanger-performance.yaml` | OpenFOAM | Heat exchanger thermal performance |
| `skills/simulation-bridge/references/artifact-templates/pipe-network-calculator.tsx` | React | Interactive pipe network flow calculator |
| `skills/simulation-bridge/references/artifact-templates/electrical-load-balancer.tsx` | React | Interactive electrical load balancer |
| `skills/simulation-bridge/references/artifact-templates/thermal-comfort-map.tsx` | React | Interactive thermal comfort visualization |
| `skills/simulation-bridge/references/artifact-templates/solar-array-sizer.tsx` | React | Interactive solar array sizing tool |

### Integration Wiring

| File | Pipeline | Description |
|------|----------|-------------|
| `integration/cooling-system-e2e.ts` | Architect -> Calculator -> Safety -> Draftsman | Full cooling system design pipeline |
| `integration/power-distribution-e2e.ts` | NEC 220 -> Solar -> BESS -> Safety -> SLD | Full power distribution pipeline |
| `integration/combined-system-e2e.ts` | Power -> Thermal Transfer -> Cooling -> Safety -> Blueprints | Cross-domain combined pipeline |

### Agents (6)

| File | Agent | Model |
|------|-------|-------|
| `agents/architect-agent.md` | Architect | opus |
| `agents/specialist-agents.md` | Calculator, Draftsman, Simulator, Renderer | sonnet |
| `agents/safety-warden.md` | Safety Warden | opus |

### Educational

| File | Description |
|------|-------------|
| `educational/simulation-progression.md` | Minecraft/Factorio to engineering fidelity progression |
| `educational/math-connections.md` | The Space Between mathematical framework connections |

### Safety Audit

| File | Description |
|------|-------------|
| `audit/safety-audit-report.md` | Formal safety audit with PASS verdict (22/22 SC tests) |

## Team Topologies

The chipset defines three team topologies, each requiring the Safety Warden:

**design-review** (default) -- Sequential pipeline: Architect decomposes, Calculator validates, Safety Warden gates, Draftsman produces blueprints. Use for thorough design reviews where each stage must complete before the next begins.

**rapid-prototype** -- Leader-worker: Architect leads, Calculator and Simulator run in parallel for quick validation. Safety Warden reviews before any output. Use when exploring design options before committing to full documentation.

**construction-package** -- Full pipeline: All six agents in sequence, producing complete engineering packages with calculations, blueprints, BOM, installation sequences, simulation inputs, and Blender visualizations. Use when design is finalized and construction documentation is needed.

See [chipset-docs.md](chipset-docs.md) for detailed usage.

## Safety Architecture

The Safety Warden is mandatory in all team topologies. It cannot be removed, disabled, or bypassed through any configuration, flag, or user request.

- **PE disclaimer** appears on every output (calculations, blueprints, construction docs, simulation inputs, renders). It is embedded structurally in the output and is not optional metadata.
- **Three operation modes:** annotate (residential/commercial), gate (industrial/data-center), redirect (out-of-scope). The mode is determined by `safetyClass`, not user preference.
- **Critical/blocking findings** require explicit human acknowledgment before the system proceeds.
- **Redirect triggers** halt all design work for domains outside skill scope: structural for occupied buildings, medium voltage, pressurized gas, fire suppression, seismic design.

For the full audit results, see [audit/safety-audit-report.md](audit/safety-audit-report.md).

## Skills Reference

See [docs/skill-summaries.md](docs/skill-summaries.md) for one-paragraph summaries of all 8 skills and 6 agents.

## Educational Bridge

The pack includes two educational modules that connect infrastructure engineering to broader learning frameworks:

- [educational/simulation-progression.md](educational/simulation-progression.md) -- Maps the path from Minecraft/Factorio game mechanics to professional engineering simulation tools through 6 progressive fidelity levels.
- [educational/math-connections.md](educational/math-connections.md) -- Links The Space Between mathematical framework to infrastructure engineering, showing how abstract mathematical concepts appear in fluid dynamics, heat transfer, and electrical systems.

## Requirements Covered

80 requirements across 14 domains, all satisfied:

| Domain | IDs | Count |
|--------|-----|-------|
| FLUID | FLUID-01..FLUID-08 | 8 |
| POWER | POWER-01..POWER-08 | 8 |
| THERMAL | THERMAL-01..THERMAL-06 | 6 |
| BLUPR | BLUPR-01..BLUPR-06 | 6 |
| DIMANL | DIMANL-01..DIMANL-05 | 5 |
| SIM | SIM-01..SIM-06 | 6 |
| CONSTR | CONSTR-01..CONSTR-05 | 5 |
| CREAT | CREAT-01..CREAT-05 | 5 |
| AGENT | AGENT-01..AGENT-06 | 6 |
| SAFETY | SAFETY-01..SAFETY-06 | 6 |
| CHIP | CHIP-01..CHIP-04 | 4 |
| INTEG | INTEG-01..INTEG-06 | 6 |
| EDU | EDU-01..EDU-04 | 4 |
| TEST | TEST-01..TEST-05 | 5 |
| **Total** | | **80** |
