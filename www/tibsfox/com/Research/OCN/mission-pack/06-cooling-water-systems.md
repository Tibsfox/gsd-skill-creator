# Open Compute Node — Component Spec: Cooling & Water Systems

**Component:** 06-cooling-water-systems.md
**Wave:** 1C (3 tasks)
**Model:** Opus (1C.1, 1C.2), Sonnet (1C.3)
**Dependencies:** 04-container-structure.md (cooling zone dimensions, penetrations)

---

## Mission

Design the dual-purpose liquid cooling and water filtration system. The system provides direct-to-chip liquid cooling for GPU racks AND processes non-potable input water through multi-stage filtration to produce EPA-compliant potable water for community use. Produce a Piping & Instrumentation Diagram (P&ID) for the complete system.

## Reference Data

- Total heat rejection: ~140 kW
- GPU liquid cooling: ~115 kW (direct-to-chip via CDU)
- Air cooling (networking/misc): ~17 kW
- Coolant flow rate: 40-80 GPM per rack
- Coolant inlet temperature: 15-25°C
- Water filtration throughput: 5-20 GPM
- Output standard: EPA 40 CFR Part 141

## Deliverables

### D-06.1: Liquid Cooling Loop Specification

**Primary Cooling Loop (closed loop):**
- CDU (Coolant Distribution Unit) specification: capacity, pumps, heat exchanger
- Coolant: propylene glycol/water mix (food-grade, non-toxic)
- Manifold connections to rack cold plates
- Flow control valves per rack (isolation for maintenance)
- Pressure and temperature monitoring points
- Expansion tank and pressure relief

**Secondary Loop (open loop — water filtration):**
- Heat exchanger transfers waste heat from primary loop to incoming water
- Pre-warming of non-potable water aids filtration efficiency
- Overflow/bypass for excess water flow

### D-06.2: Water Filtration System Specification

5-stage filtration system housed in cooling zone:

| Stage | Component | Specification | Monitoring |
|-------|-----------|---------------|------------|
| 1 | Sediment pre-filter | 5-micron pleated cartridge, 20" housing | Differential pressure gauge |
| 2 | Activated carbon | GAC (Granular Activated Carbon), 10×54" tank | Chlorine residual sensor |
| 3 | Reverse osmosis | TFC membrane, 500+ GPD per element, 4-element housing | TDS meter (in/out) |
| 4 | UV sterilization | 254nm, 40mJ/cm² dose, flow-rated chamber | UV intensity sensor |
| 5 | Mineral rebalancing | Calcite/corosex contact tank | pH sensor |

**Quality Monitoring:**
- Inline TDS meter (must read <500 mg/L per EPA)
- pH sensor (6.5-8.5 range)
- Turbidity sensor (<1 NTU)
- UV transmittance sensor
- Automated shutoff valve if ANY quality parameter exceeds threshold

### D-06.3: Waste Management System

- 55-gallon steel drum (DOT 17H) positioned in cooling zone
- Sediment pre-filter backwash → drum
- RO concentrate (reject water) → partially to drum, partially to drain
- Carbon fines during replacement → drum
- Drum fill-level sensor (ultrasonic)
- Monthly swap procedure documented
- Waste manifest template (EPA RCRA if applicable)
- Upstream logistics: drum pickup by licensed hauler, return to processing

### D-06.4: P&ID Drawing (LaTeX)

Complete piping and instrumentation diagram showing:
- All pipes with size, material, flow direction
- All valves (gate, check, control, relief)
- All instruments (sensors, gauges, transmitters)
- All equipment (CDU, filters, UV, pumps, tanks)
- ISA 5.1 symbology standard
- Equipment tag numbers
- Primary and secondary loop identification

## Safety Requirements

- [ ] S-01: PE disclaimer on all pages
- [ ] S-07: Pressure relief valves on all pressurized circuits
- [ ] S-10: Automated water quality shutoff documented in P&ID
- [ ] Leak detection sensors at all floor-level connection points
- [ ] Coolant is food-grade non-toxic (propylene glycol, not ethylene glycol)
- [ ] UV system has flow interlock (no flow = UV off = output valve closed)
- [ ] RO membrane housing rated for maximum line pressure + safety factor

## Acceptance Criteria

1. Cooling system maintains GPU junction temps within NVIDIA spec with 10% margin
2. Water output meets all EPA 40 CFR 141 primary standards
3. P&ID follows ISA 5.1 symbology and is professionally readable
4. Waste drum swap procedure is documented step-by-step
5. All components fit within cooling zone (2,532mm × 2,352mm × 2,695mm)
6. Total water system weight (filled) within weight budget allocation
