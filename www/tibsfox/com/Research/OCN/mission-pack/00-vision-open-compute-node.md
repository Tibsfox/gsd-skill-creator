# Open Compute Node — Vision Guide
# A Standardized Shipping Container AI Infrastructure with Net-Positive Environmental Return

**Date:** 2026-02-28
**Status:** Initial Vision / Pre-Mission
**Depends on:** gsd-local-cloud-provisioning-vision.md, gsd-chipset-architecture-vision.md, gsd-learn-kung-fu-teaching-reference.md (progressive disclosure patterns)
**Context:** Open-source design for a self-sustained, modular AI compute node housed in a standard ISO shipping container, powered by 100% renewable energy, with integrated water filtration that returns clean potable water to communities — deployed along US rail corridors near existing fiber routes.

---

## Vision

A shipping container arrives by rail at a small town in the American Southwest. It's painted with a mural designed by local schoolchildren — a desert landscape with constellations mapped by a 12-year-old who learned astronomy from the library's free compute terminal. Workers connect two lines: power from the solar array that was installed the week before, and a water intake from the nearby agricultural runoff channel. Within hours, the container is alive — its GPU racks humming behind liquid cooling loops, the water flowing through filtration stages and emerging clean enough to irrigate the community garden next door. The filtration byproducts collect in a single 55-gallon drum that gets swapped monthly and sent upstream for proper processing. A portion of the compute power is allocated to the town's library network, free of charge, forever.

This is not a data center. Data centers are buildings that consume resources. This is a compute node that gives back more than it takes — clean water, clean energy, free knowledge access, and a canvas for community expression. The design is open-source, built on open standards, and engineered so that anyone with access to a shipping container and sunlight can build one.

The gap is simple: every major cloud provider is racing to build AI infrastructure, but they're all building proprietary facilities that extract from communities — consuming power, consuming water, consuming land. The Open Compute Node inverts this relationship. It uses the same standardized logistics that move goods globally (the ISO shipping container) to move compute to where it's needed, and it pays its rent in clean water and free compute cycles.

By designing from the ground up with open standards — ISO container dimensions, standard 44U rack units, commodity solar panels, off-the-shelf water filtration — we create a blueprint that can be manufactured anywhere, deployed anywhere, and maintained by anyone. The NVIDIA GB200 NVL72 serves as our reference case study not because it's the only option, but because it represents the current frontier of compute density and power requirements. If the design works for 120kW of liquid-cooled GPUs, it works for anything.

## Problem Statement

1. **AI infrastructure is extractive.** Current data center designs consume massive amounts of power, water, and land while returning nothing to the communities they occupy. The GB200 NVL72 alone requires approximately 120kW per rack and liquid cooling — infrastructure that typically exists only in purpose-built facilities accessible to hyperscalers.

2. **Compute access is geographically concentrated.** The majority of AI compute capacity sits in a handful of metropolitan areas near major internet exchanges. Rural communities, small towns, and developing regions are structurally excluded from the AI revolution, both as consumers and as beneficiaries.

3. **Existing modular data centers are proprietary.** While containerized data centers exist commercially (BMarko, Delta, CANCOM), they are designed as products to be sold, not as open blueprints to be shared. No open-source, end-to-end specification exists for a self-sustained compute node with integrated environmental benefits.

4. **Renewable energy integration remains an afterthought.** Most data center renewable energy strategies involve purchasing offsets or PPAs rather than true on-site generation. The engineering challenge of powering 120kW+ continuous loads from solar/wind/battery alone has been explored theoretically but not specified as a deployable open design.

5. **Water consumption is treated as an externality.** Traditional data center cooling consumes millions of gallons annually. The Open Compute Node treats water not as a consumable but as a service — intake dirty water, use it for cooling, filter it clean, return it to the community. The compute node becomes water infrastructure.

## Core Concept

**Deploy → Connect → Compute → Return.**

A fully assembled Open Compute Node arrives at a prepared site via standard intermodal logistics (rail, truck, or ship). External connections are made: renewable power input, non-potable water intake, filtered water output, network fiber. The node self-tests, comes online, allocates its community compute share, and begins operation. Monthly maintenance consists of swapping the waste drum and routine hardware checks.

### The Node — External View

```
   ┌─────────────────────────────────────────────────────────┐
   │  ╔══════════════════════════════════════════════════╗    │
   │  ║         COMMUNITY MURAL ART SURFACE             ║    │
   │  ║     (designed by local community before          ║    │
   │  ║      deployment, painted at factory)             ║    │
   │  ╚══════════════════════════════════════════════════╝    │
   │                                                         │
   │  40ft High Cube ISO Container (12.03m × 2.35m × 2.69m) │
   │                                                         │
   │  [SOLAR IN]  [WATER IN]  [WATER OUT]  [FIBER]  [WASTE]  │
   │      ↓            ↓           ↑          ↕        ↑     │
   │   Renewable    Non-potable  Potable    Network   55-gal  │
   │   Power        Water        Water      Uplink    Drum    │
   └─────────────────────────────────────────────────────────┘
```

### The Node — Internal Layout (Top-Down)

```
   ┌──────────────────────────────────────────────────────────┐
   │ ENTRY │   POWER    │       COMPUTE ZONE        │ COOLING │
   │ ZONE  │   ZONE     │    (Standard 44U Racks)   │  ZONE   │
   │       │            │                           │         │
   │ Door  │ PDU/UPS    │  ┌──┐ ┌──┐ ┌──┐ ┌──┐    │ CDU     │
   │ Fire  │ Battery    │  │R1│ │R2│ │R3│ │R4│    │ Filters │
   │ Supp. │ Inverter   │  │  │ │  │ │  │ │  │    │ Pumps   │
   │ Mon.  │ Switchgear │  └──┘ └──┘ └──┘ └──┘    │ Waste   │
   │       │            │  Hot Aisle / Cold Aisle   │ Drum    │
   └──────────────────────────────────────────────────────────┘
    ← 2m → ← 2.5m ──→  ← ──── 5m ──────── →  ← 2.5m ──→
```

## Architecture

### System Layers

```
Layer 7: Community Services    — Library/school compute, monitoring dashboard
Layer 6: Compute Payload       — GPU racks, networking, storage
Layer 5: Cooling & Water       — CDU, filtration, waste management
Layer 4: Power Systems         — Solar/wind, battery, PDU, inverters
Layer 3: Environmental Control — HVAC, fire suppression, leak detection
Layer 2: Structural            — Container mods, rack mounting, cable management
Layer 1: Site Infrastructure   — Foundation, external connections, fiber
Layer 0: Logistics             — Rail corridor mapping, deployment planning
```

### Module Dependency Map

```
Community Services ──→ Compute Payload
         │                    │
         │              ┌─────┴─────┐
         │              ↓           ↓
         │         Cooling      Power Systems
         │           │              │
         │           ↓              ↓
         └──→ Environmental Control ←┘
                      │
                      ↓
               Structural Mods
                      │
                      ↓
              Site Infrastructure
                      │
                      ↓
                  Logistics
```

**Cross-component connections:**
- Power Systems → Cooling — CDU pumps draw from power distribution
- Cooling → Compute — Liquid cooling manifolds connect to rack cold plates
- Cooling → Water Filtration — Cooling loop waste heat drives filtration
- Water Filtration → Community — Clean water output piped to community use
- Compute → Community — Allocated compute capacity via network
- Structural → All — Container modifications constrain all internal layouts
- Logistics → Site — Rail corridor determines fiber and water availability

## Container Structure Module

The foundation of everything. A standard 40ft High Cube ISO container (ISO 668) is selected for maximum internal volume while maintaining compatibility with global intermodal logistics — rail, ship, truck, crane. The High Cube variant adds 30cm of internal height (2.69m vs 2.39m), critical for rack clearance and overhead cable management.

**Key Modifications:**
- Reinforced floor for rack weight (GB200 NVL72: 1,360kg per rack)
- Penetrations for power, water, fiber, and exhaust
- Internal insulation (thermal + acoustic)
- Hot aisle/cold aisle containment structure
- Fire suppression system (clean agent, not water)
- Access door replacement (security + environmental seal)

## Power Systems Module

100% renewable energy is the non-negotiable requirement. The reference design uses a hybrid solar + battery + wind configuration sized for the GB200 NVL72's 120kW continuous draw plus overhead systems (~30kW for cooling, PDU, monitoring = ~150kW total).

**Engineering Reality Check:**
- Solar capacity factor in US Southwest: ~24.7%
- For 150kW continuous: need ~600kW nameplate solar capacity
- At ~5W/sq ft for modern panels: ~120,000 sq ft (~2.75 acres) of solar
- Battery storage: minimum 600kWh for overnight + weather gaps (4-hour buffer)
- Wind supplements solar during low-sun periods
- Site must have sufficient solar irradiance (>5 kWh/m²/day)

## Cooling and Water Systems Module

The dual-purpose innovation: liquid cooling for the compute payload AND water filtration for the community. Non-potable water enters, passes through the cooling loop (absorbing waste heat from the GPUs), then passes through multi-stage filtration before being returned as clean potable water.

**Filtration Stages:**
1. Coarse pre-filter (sediment, large particulates)
2. Activated carbon (organic compounds, chlorine, taste/odor)
3. Reverse osmosis membrane (dissolved solids, heavy metals)
4. UV sterilization (pathogens)
5. Mineral rebalancing (for potability)

**Waste Management:**
- Filtration byproducts collect in a single 55-gallon drum
- Drum swap frequency: monthly (estimated based on water quality)
- Waste is categorized and shipped upstream for proper processing
- Return to base elements for industrial reuse

## Compute Systems Module

Using the NVIDIA GB200 NVL72 as the reference case study — the most demanding current AI compute platform:

- 72 Blackwell GPUs + 36 Grace CPUs per rack
- ~120kW power consumption per rack
- Liquid cooling required (direct-to-chip)
- Weight: 1,360 kg (3,000 lbs) per rack
- Performance: 720 PFLOPS FP4, exascale in a single rack

**Rack Layout:**
Given internal container width of 2.35m and standard 600mm rack width, the container can accommodate 3-4 racks in a row with hot/cold aisle containment. The reference design uses 2 GB200 NVL72 racks (or equivalent) to stay within power and cooling budgets.

## Deployment & Logistics Module

US rail network: ~140,000 miles of track, much of it paralleling major fiber routes laid in railroad rights-of-way. This creates natural deployment corridors where both network connectivity and logistics access are already established.

**Site Selection Criteria:**
- Within 1 mile of active rail line (intermodal access)
- Within 1 mile of fiber route (network connectivity)
- Solar irradiance > 5 kWh/m²/day (renewable energy viability)
- Non-potable water source available (cooling + filtration input)
- Community partner (library, school, or municipal entity)
- Zoning compatible with light industrial use
- Level foundation pad (concrete or compacted gravel)

## Community Integration Module

**Compute Allocation:**
- Minimum 10% of total compute capacity dedicated to free community use
- Accessed via local network connection at partner institution (library/school)
- No usage tracking, no data collection on community users
- Available for: education, research, local government, nonprofit use

**Mural Art Program:**
- Before deployment, container exterior panels are prepared for art
- Community submits designs (school art programs, local artists)
- Selected design painted at manufacturing facility (weather-resistant coating)
- Container becomes a landmark, not an eyesore
- Panels can be refreshed during major hardware upgrade cycles

**Environmental Return:**
- Clean water output: continuous, free of charge, piped to community use
- Net positive water cycle (more clean water out than dirty water in by volume)
- Renewable energy excess during low-compute periods fed back to local grid
- Noise: liquid cooling is dramatically quieter than air-cooled alternatives
- Waste: single drum, monthly swap, fully tracked and properly processed

## Skill-Creator Integration

### Chipset Configuration

```yaml
name: open-compute-node
version: 1.0.0
description: "Open-source shipping container AI compute node with net-positive environmental return"

skills:
  mechanical-engineering:
    domain: infrastructure
    description: "Structural analysis, container modifications, rack mounting"
  electrical-engineering:
    domain: infrastructure
    description: "Power distribution, solar/battery sizing, NEC compliance"
  fluid-engineering:
    domain: infrastructure
    description: "Cooling loops, water filtration, plumbing, waste management"
  compute-systems:
    domain: technology
    description: "GPU rack configuration, networking, DCIM"
  environmental-science:
    domain: science
    description: "Water quality, waste processing, environmental impact"
  logistics:
    domain: operations
    description: "Rail corridors, fiber routes, deployment planning"
  technical-drawing:
    domain: documentation
    description: "LaTeX blueprints, CAD specifications, BOM generation"
  community-design:
    domain: social
    description: "Public compute allocation, art program, stakeholder engagement"

agents:
  topology: "leader-worker"
  agents:
    - name: "systems-architect"
      role: "ARCH — maintains overall system integration and interface contracts"
    - name: "structural-engineer"
      role: "CRAFT — container modifications, rack mounting, load analysis"
    - name: "power-engineer"
      role: "CRAFT — renewable energy, battery, power distribution"
    - name: "thermal-engineer"
      role: "CRAFT — cooling systems, water filtration, waste management"
    - name: "compute-engineer"
      role: "CRAFT — GPU configuration, networking, DCIM"
    - name: "logistics-planner"
      role: "CRAFT — rail corridors, site selection, deployment planning"
    - name: "documentation-specialist"
      role: "EXEC — LaTeX blueprints, technical specifications"
    - name: "safety-warden"
      role: "SECURE — PE disclaimers, NEC compliance, safety validation"

evaluation:
  gates:
    pre_deploy:
      - check: "safety_disclaimers"
        threshold: 100
        action: "block"
      - check: "dimensional_consistency"
        threshold: 95
        action: "block"
      - check: "power_budget_balance"
        threshold: 100
        action: "block"
      - check: "thermal_budget_balance"
        threshold: 100
        action: "block"
      - check: "water_quality_compliance"
        threshold: 100
        action: "block"
```

## Scope Boundaries

### In Scope (v1.0)
- Complete mechanical specification for 40ft HC container modifications
- Power system design: solar + battery + wind for 150kW continuous
- Liquid cooling system with integrated water filtration
- GB200 NVL72 reference rack layout (adaptable to other compute)
- US rail corridor deployment mapping (top 20 candidate sites)
- Community compute allocation architecture
- Mural art program design guidelines
- LaTeX technical drawings for all major assemblies
- Bill of Materials (BOM) with commodity component specifications
- 55-gallon waste management system specification
- Network architecture (fiber connection to rack)

### Out of Scope (Future Considerations)
- Manufacturing process engineering (how to build at scale)
- Regulatory compliance per specific jurisdiction (varies by state/county)
- Specific community partnership agreements (legal/political)
- Grid interconnection engineering (for excess power export)
- Multi-node clustering (orchestrating multiple containers as a compute cluster)
- Seismic/hurricane hardening (specialized environmental variants)
- Maritime deployment (offshore variants)
- International deployment (non-US rail/fiber/regulatory)

## Success Criteria

1. **Dimensional fit:** All components fit within 40ft HC ISO container internal dimensions (12.03m × 2.35m × 2.69m) with maintenance access clearance.
2. **Power self-sufficiency:** Renewable energy system provides 150kW continuous with 99.5% uptime modeled across reference site weather data.
3. **Thermal balance:** Cooling system maintains all compute components within manufacturer specifications with 10% safety margin.
4. **Water quality:** Output water meets EPA National Primary Drinking Water Standards (40 CFR Part 141).
5. **Waste containment:** All filtration byproducts contained in single 55-gallon drum with monthly swap cycle.
6. **Weight compliance:** Total loaded weight within ISO container structural limits and intermodal transport regulations.
7. **Community compute:** Minimum 10% compute allocation architecture functional and documented.
8. **Open specification:** All documents released under permissive open-source license (CC BY-SA 4.0 for docs, MIT for code).
9. **Blueprint completeness:** LaTeX technical drawings cover all major assemblies with dimensions, materials, and tolerances.
10. **Safety compliance:** Every specification includes PE review disclaimer; electrical designs reference NEC 2023; plumbing references UPC/IPC.
11. **Logistics viability:** At least 20 candidate deployment sites identified along US rail corridors with fiber access.
12. **Modular upgradeability:** Compute racks, power components, and filtration stages all independently replaceable without structural modification.

## Relationship to Other Vision Documents

| Document | Relationship |
|----------|-------------|
| gsd-local-cloud-provisioning-vision.md | Shares infrastructure-as-code philosophy; Open Compute Node is the physical layer that local cloud runs on |
| gsd-chipset-architecture-vision.md | Compute node's internal systems mirror chipset metaphor — power = clock, cooling = bus arbitration, racks = execution units |
| gsd-amiga-vision-architectural-leverage.md | The Amiga Principle incarnate: achieving remarkable results through architectural elegance at infrastructure scale |
| gsd-bbs-educational-pack-vision.md | Community compute allocation creates the "BBS" — a shared knowledge access point for the modern era |
| gsd-learn-kung-fu-pack-vision.md | The progressive disclosure model applies to community compute: simple library terminals → full research workstations |
| gsd-cloud-ops-curriculum-vision.md | Operating and maintaining Open Compute Nodes IS the cloud ops curriculum made physical |

## The Through-Line

The original Amiga shipped with its full hardware reference manual in the box. Commodore published the register maps, the DMA timings, the custom chip specifications — everything a developer needed to push the hardware beyond what its creators imagined. The Open Compute Node publishes everything too: the structural modifications, the power calculations, the cooling loop specifications, the water filtration stages, the rack layouts. Not because openness is fashionable, but because openness is how you get a 12-year-old in a small town to look at a blueprint and think "I could build that."

The Space Between argues that consciousness emerges from the interaction between physical substrate and mathematical structure. The Open Compute Node is that argument made literal — mathematical computation emerging from physical infrastructure that improves the physical world it inhabits. A container that cleans water, generates energy, provides knowledge, and becomes art. That's the quark traveling through time and space, the idea made manifest in steel and silicon and sunlight.

---
*This vision guide is intended as input for GSD's `new-project` workflow.
Research phase should focus on: ASHRAE thermal guidelines, NEC 2023 electrical code, EPA drinking water standards, NVIDIA GB200 cooling specifications, ISO 668 container standards, US DOE data center efficiency guidelines, and railroad right-of-way fiber route mapping.*
