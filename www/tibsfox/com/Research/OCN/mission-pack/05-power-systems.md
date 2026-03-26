# Open Compute Node — Component Spec: Power Systems

**Component:** 05-power-systems.md
**Wave:** 1B (4 tasks)
**Model:** Opus (1B.1, 1B.4), Sonnet (1B.2, 1B.3)
**Dependencies:** 04-container-structure.md (zone dimensions, penetration locations)

---

## Mission

Design the complete renewable energy system that provides 150kW continuous power (120kW compute + 30kW overhead) using 100% solar + wind + battery. The power system spans MULTIPLE physical units: the compute container, one or more BESS containers, and the solar/wind array. Produce a power distribution single-line diagram showing the complete DC power path from generation to rack bus bar.

## Reference Data

- Total continuous load: 150 kW
- Daily energy: 3,600 kWh
- Solar capacity factor (Southwest US): 24.7%
- Required solar nameplate: ~607 kW
- Battery storage target: 2,000-4,000 kWh (LFP)
- Wind supplementation: 50-100 kW nameplate
- Target architecture: All-DC (minimize conversion losses)

## Deliverables

### D-05.1: Solar Array Specification
- Panel selection criteria (efficiency ≥22%, commodity availability)
- Array configuration (string voltage, combiner boxes)
- Mounting system (ground-mount, fixed tilt optimized for latitude)
- Site area requirements (2.5-3 acres including access roads)
- DC output specification (1500V DC bus)

### D-05.2: Battery Energy Storage System (BESS)
- Chemistry: LFP (Lithium Iron Phosphate) for safety and cycle life
- Capacity: 2,000-4,000 kWh usable
- Physical: Containerized BESS (one or two 20ft containers)
- Charge/discharge rate: C/2 minimum (75-150 kW)
- BMS (Battery Management System) specification
- Thermal management (self-contained cooling)
- Safety: NFPA 855 compliance for BESS installations

### D-05.3: Wind Supplementation
- Turbine selection criteria (75 kW class, commercial)
- Tower/foundation requirements
- Grid-forming inverter for DC bus integration
- Cut-in/cut-out wind speed constraints

### D-05.4: Power Distribution Single-Line Diagram
Complete DC power path:

```
Solar (1500V DC) → Combiner → DC Bus (1500V)
Wind (AC) → Rectifier → DC Bus (1500V)
BESS ↔ DC Bus (1500V) [bidirectional]
DC Bus (1500V) → DC-DC Converter → 48-51V DC
48-51V DC → Bus Bar (in container) → Rack PSUs
48-51V DC → Auxiliary PDU → Cooling, filtration, monitoring
```

Must include:
- Overcurrent protection at every level (NEC Article 690, 705, 706)
- Disconnect switches (accessible from exterior)
- Grounding system (NEC Article 250)
- Arc-fault protection where required
- Surge protection
- Monitoring/metering points

## Safety Requirements

- [ ] S-01: PE disclaimer on all pages
- [ ] S-08: Overcurrent protection at every distribution level
- [ ] S-09: Emergency disconnect accessible from container exterior
- [ ] NEC 2023 Article 690 (Solar PV) compliance documented
- [ ] NEC 2023 Article 706 (Energy Storage) compliance documented
- [ ] NFPA 855 (BESS) compliance documented
- [ ] All wiring sized per NEC ampacity tables with derating factors

## Acceptance Criteria

1. Solar + wind + battery provides 150kW continuous at 99.5% modeled availability (reference: NREL TMY3 data for Tucson, AZ)
2. Battery storage bridges minimum 10 hours of zero solar input
3. All DC-DC conversion stages documented with efficiency ratings
4. Total system efficiency (solar panel to rack bus bar) ≥85%
5. Single-line diagram is complete and NEC-referenced
6. BESS container(s) dimensions and weight specified
7. Total site footprint documented (acres)
