# Open Compute Node — Milestone Specification

**Date:** 2026-02-28
**Vision Document:** 00-vision-open-compute-node.md
**Research Reference:** 01-research-reference.md
**Estimated Execution:** ~18-24 context windows across ~8-12 sessions

---

## Mission Objective

Produce a complete, open-source engineering specification for a self-sustained AI compute node housed in a standard 40ft High Cube ISO shipping container. The specification includes dimensional blueprints (LaTeX), power system design, liquid cooling with integrated water filtration, GB200 NVL72 reference rack layout, US rail corridor deployment mapping, and community integration architecture. All specifications are publication-quality, include PE review disclaimers, and can be handed to a licensed engineer for review and construction.

"Done" means: a zip file containing LaTeX-rendered PDF blueprints, markdown mission documents, and a complete BOM that, taken together, describe a buildable system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPEN COMPUTE NODE v1.0                        │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │Structure │   │  Power   │   │ Cooling  │   │ Compute  │    │
│  │  (04)    │──→│  (05)    │──→│  (06)    │──→│  (07)    │    │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘    │
│       │              │              │              │           │
│       └──────────────┴──────────────┴──────────────┘           │
│                           │                                     │
│              ┌────────────┴────────────┐                        │
│              ↓                         ↓                        │
│        ┌──────────┐            ┌──────────┐                     │
│        │Deploy/   │            │Community │                     │
│        │Logistics │            │ Integr.  │                     │
│        │  (08)    │            │  (09)    │                     │
│        └────┬─────┘            └────┬─────┘                     │
│             └──────────┬────────────┘                           │
│                        ↓                                        │
│                 ┌──────────┐                                    │
│                 │Blueprints│                                    │
│                 │  (10)    │                                    │
│                 └──────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

### System Layers

1. **Foundation Layer** — Shared types, dimensional constraints, interface contracts
2. **Physical Layer** — Container structure, modifications, rack mounting
3. **Energy Layer** — Solar, wind, battery, power distribution
4. **Thermal Layer** — Liquid cooling, water filtration, waste management
5. **Compute Layer** — GPU racks, networking, DCIM, community allocation
6. **Deployment Layer** — Rail corridors, site selection, logistics
7. **Integration Layer** — Community programs, environmental return
8. **Documentation Layer** — LaTeX blueprints, BOM, final specification package

## Deliverables

| # | Deliverable | Acceptance Criteria | Component Spec |
|---|------------|-------------------|----------------|
| 1 | Shared interfaces & dimensional constraints | All modules reference consistent container dimensions; interface contracts compile | 04-container-structure.md |
| 2 | Container modification blueprint | LaTeX drawing with all penetrations, reinforcements, zones dimensioned | 04-container-structure.md |
| 3 | Internal rack layout blueprint | LaTeX drawing showing rack positions, aisle widths, clearances | 04-container-structure.md |
| 4 | Solar array sizing specification | kW nameplate, panel count, area, site requirements documented | 05-power-systems.md |
| 5 | Battery storage specification | kWh capacity, chemistry, dimensions, separate container design | 05-power-systems.md |
| 6 | Power distribution single-line diagram | LaTeX diagram showing DC bus, converters, bus bar, rack feeds | 05-power-systems.md |
| 7 | Cooling loop P&ID | LaTeX piping & instrumentation diagram for liquid cooling circuit | 06-cooling-water-systems.md |
| 8 | Water filtration system specification | 5-stage filtration with flow rates, media specs, replacement cycles | 06-cooling-water-systems.md |
| 9 | Waste management specification | 55-gallon drum system, fill rate estimates, disposal procedures | 06-cooling-water-systems.md |
| 10 | GB200 NVL72 rack integration spec | Power, cooling, network connections per rack documented | 07-compute-systems.md |
| 11 | Network architecture diagram | Fiber intake → ToR switch → rack connectivity documented | 07-compute-systems.md |
| 12 | US rail corridor deployment map | Top 20 candidate sites scored against selection matrix | 08-deployment-logistics.md |
| 13 | Site preparation specification | Foundation, external connections, security, access requirements | 08-deployment-logistics.md |
| 14 | Community compute allocation architecture | Network segmentation, access control, capacity management | 09-community-integration.md |
| 15 | Mural art program guidelines | Panel preparation, design submission, paint specifications | 09-community-integration.md |
| 16 | Complete LaTeX blueprint package | All drawings compiled into single PDF with table of contents | 10-blueprints-spec.md |
| 17 | Bill of Materials (BOM) | Complete parts list with quantities, specifications, estimated costs | 10-blueprints-spec.md |
| 18 | Final specification document | Integrated specification with all subsystems, PE disclaimers | 10-blueprints-spec.md |

## Component Breakdown

| Component | Spec Document | Dependencies | Model | Est. Tokens |
|-----------|---------------|-------------|-------|-------------|
| Shared types & interfaces | 04 | None | Sonnet | 8K |
| Container structure | 04 | Shared types | Opus | 25K |
| Power systems | 05 | Container dimensions | Opus | 30K |
| Cooling & water | 06 | Container dimensions, power | Opus | 30K |
| Compute systems | 07 | All physical specs | Sonnet | 20K |
| Deployment logistics | 08 | Site requirements from 04-06 | Sonnet | 20K |
| Community integration | 09 | Compute, network specs | Sonnet | 15K |
| Blueprints & BOM | 10 | ALL prior deliverables | Opus | 40K |
| Test plan | 11 | ALL specs | Sonnet | 15K |

## Interface Contracts

### Container → Power
- Penetration locations for DC power input (2× conduit, south wall)
- Bus bar mounting points (internal, floor-to-ceiling)
- Grounding system specification

### Container → Cooling
- Penetration locations for water intake/output (2× pipe, north wall)
- CDU mounting zone (east end, 2.5m × 2.35m × 2.69m)
- Floor drain/leak detection zones

### Container → Compute
- Rack mounting points (4× positions, center zone)
- Cable tray routes (ceiling-mounted, east-to-west)
- Network fiber entry point (east wall, with splice box)

### Power → Cooling
- 30kW allocation for CDU, pumps, filtration
- 48V DC feed to cooling subsystem PDU

### Cooling → Community
- Potable water output pipe (north wall, 1" min diameter)
- Flow meter and quality monitoring sensor interface
- Automated shutoff if quality drops below threshold

### Compute → Community
- VLAN-isolated network segment (10% capacity reservation)
- Fiber handoff point for community network connection
- Usage monitoring (anonymous, no PII collection)

## Safety Requirements

These are MANDATORY-PASS criteria. The mission CANNOT be marked complete if any fail.

| ID | Requirement | Verification |
|----|-------------|-------------|
| S-01 | Every specification document includes PE review disclaimer | Text search for disclaimer block |
| S-02 | Electrical designs reference NEC 2023 article numbers | Cross-reference check |
| S-03 | Water output specification references EPA 40 CFR 141 | Cross-reference check |
| S-04 | Fire suppression system specified (NFPA 75 compliant) | Design review |
| S-05 | Leak detection system specified for all liquid circuits | Design review |
| S-06 | Weight budget does not exceed ISO container max payload | Arithmetic verification |
| S-07 | All pressurized systems specify relief valves and ratings | Design review |
| S-08 | Electrical system includes overcurrent protection at every level | Single-line diagram review |
| S-09 | Emergency power disconnect accessible from exterior | Layout review |
| S-10 | Water filtration includes automated shutoff on quality failure | P&ID review |
