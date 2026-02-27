# ASHRAE TC 9.9 -- Deep Reference

*Fluid Systems Skill -- Data center cooling standards and CDU selection*

---

## Water Class Full Specifications

| Class | Supply Temp | Return Temp | Typical DeltaT | Chiller/Cooling Config | Annual PUE Impact | Server Inlet Air Check | Heat Recovery Viable |
|-------|------------|-------------|----------------|------------------------|-------------------|----------------------|---------------------|
| W1 | 2-17C | 12-27C | 10C | Mechanical chiller required year-round | PUE 1.3-1.5 | Not required (air already cold) | No (too cold) |
| W2 | 2-27C | 12-37C | 10C | Chiller + water-side economizer | PUE 1.2-1.4 | Recommended | Marginal |
| W3 | 2-33C | 12-43C | 10C | Extended economizer, chiller backup | PUE 1.1-1.3 | Required | Possible above 35C |
| W4 | 2-45C | 12-55C | 10-12C | Primarily free cooling, minimal chiller | PUE 1.05-1.15 | Required (must verify) | Yes, above 40C return |
| W5 | >45C | >55C | 10-15C | Free cooling only, heat recovery system | PUE 1.03-1.10 | Required (critical) | Yes, primary design goal |

**Key considerations for class selection:**

- Higher class reduces cooling energy but requires IT equipment rated for warmer inlet temperatures
- GPU-heavy workloads (AI/ML) may require W1/W2 due to component thermal limits
- W4/W5 enable district heating integration, improving overall energy efficiency beyond PUE
- Mixed environments (air + liquid): air-cooled components constrain the minimum supply temperature

## Water Class Selection Decision Tree

```
START: What is the climate zone?
  |
  +-- Hot/humid (tropical, subtropical, >5000 CDH)
  |     |
  |     +-- IT equipment supports ASHRAE A3/A4? --> W3 (limited economizer hours)
  |     +-- IT equipment A1/A2 only? --> W1 or W2
  |
  +-- Temperate (2000-5000 CDH)
  |     |
  |     +-- Heat recovery desired? --> W4 or W5
  |     +-- No heat recovery --> W3 (good economizer hours)
  |
  +-- Cold (Nordic, <2000 CDH)
        |
        +-- Heat recovery for district heating? --> W5 (optimal)
        +-- Maximum free cooling? --> W4
        +-- Conservative approach? --> W3 (safe choice)

CDH = Cooling Degree Hours above 18C (annual)
```

**Override rules:**

- If any server vendor spec limits coolant inlet to < 35C, cap at W3
- If facility has existing chilled water plant, start with W2 and evaluate upgrade path
- New builds should target W3 minimum (future-proofing)

## CDU Selection Criteria

### CDU Form Factor Selection Matrix

| Rack Heat Load | Recommended CDU Form Factor | Typical Capacity | Pros | Cons |
|----------------|---------------------------|------------------|------|------|
| 5-15 kW/rack | Rear-door heat exchanger | 15-30 kW | Retrofit-friendly, no floor space | Limited capacity, passive |
| 15-40 kW/rack | In-row CDU | 30-80 kW | Good capacity, accessible | Occupies rack positions |
| 30-80 kW/rack | Overhead CDU | 50-150 kW | No floor space used | Ceiling clearance, maintenance access |
| 40-100+ kW/rack | In-rack CDU | 40-100 kW | Closest to load, best response | Per-rack cost, more connections |
| 100+ kW/rack | Centralized CDU room | 200-1000+ kW | Economy of scale, redundancy | Long pipe runs, single point of failure |

### CDU Sizing

```
CDU_rated_kW >= rack_peak_heat_load x 1.25
```

The 1.25 factor accounts for:
- Measurement uncertainty in rack power (+/- 10%)
- Future load growth allowance (+15%)
- Heat exchanger fouling over time

### Redundancy Options

| Configuration | CDU Count | Capacity Each | When to Use |
|---------------|----------|---------------|-------------|
| N (no redundancy) | 1 | 100% load | Development/test only |
| N+1 | N+1 | 100%/N of load | Standard production |
| 2N | 2 per unit | 100% load each | High availability (Tier III+) |

### Connector Standards

- ISO 16028 quick-disconnect fittings (flat-face, non-drip)
- Stainless steel or brass body for corrosion resistance
- Pressure rating: 1 MPa minimum (10 bar)
- Flow rating: match cold plate flow requirement with <5 kPa drop across coupling

### Manifold Design

- Supply and return headers sized for total row/zone flow
- Balancing valves on each branch for flow equalization
- Air elimination device (float-type) at high points
- Pressure gauges at manifold inlet/outlet and critical branches
- Isolation valves for each rack connection (maintenance without shutdown)
- Temperature sensors at manifold inlet/outlet for monitoring

## DTC Flow Calculations

### Per-Component Flow Rates

| Component | Typical Flow Rate | Pressure Drop | Notes |
|-----------|------------------|---------------|-------|
| Intel Xeon CPU cold plate | 0.5-0.8 LPM | 10-20 kPa | Verify with OEM spec |
| AMD EPYC CPU cold plate | 0.5-1.0 LPM | 10-25 kPa | Higher TDP models need more |
| NVIDIA H100 GPU cold plate | 1.0-2.0 LPM | 15-30 kPa | GPU TDP 700W requires high flow |
| NVIDIA B200 GPU cold plate | 1.5-2.5 LPM | 20-35 kPa | 1000W TDP, verify with vendor |
| Memory DIMM cold rail | 0.2-0.5 LPM | 5-10 kPa | Optional, for highest density |

### Total Rack Flow Calculation

```
Q_rack = (sum of all cold plate flows) x 1.1 (balance factor)
```

**Example: 8-GPU AI server rack (2 CPUs + 8 GPUs per node, 4 nodes):**

```
Per node: 2 x 0.8 LPM (CPU) + 8 x 1.5 LPM (GPU) = 1.6 + 12.0 = 13.6 LPM
Per rack: 4 nodes x 13.6 = 54.4 LPM
With balance factor: 54.4 x 1.1 = 59.8 LPM
```

### Pressure Budget

```
DeltaP_total = DeltaP_cold_plates + DeltaP_manifold + DeltaP_hoses + DeltaP_CDU
```

Typical budget: 50-150 kPa total. CDU pump must overcome this at design flow.

## Leak Detection Architecture

### Four-Zone Detection System

| Zone | Location | Sensor Type | Response Time | Action |
|------|----------|------------|---------------|--------|
| Zone 1 | Server tray overflow | Moisture sensor pad | <30 seconds | Local alert to BMS |
| Zone 2 | CDU/rack drain pan | Conductive cable sensor | <30 seconds | Auto-shutoff CDU supply valve |
| Zone 3 | Raised floor/room | Floor-mounted rope sensor | <60 seconds | Room alarm + facility shutoff |
| Zone 4 | Building BMS | Aggregated alarm | Immediate | Facility-wide emergency protocol |

### Response Protocol

1. **Zone 1 alarm:** Alert only. Monitor for escalation. No automatic shutoff (may be condensation).
2. **Zone 2 alarm:** Automatic CDU supply valve closure. Alert operations. Rack continues on residual cooling for 30-60 seconds.
3. **Zone 3 alarm:** Room-level alert. All CDU supply valves in zone close. Building maintenance dispatched.
4. **Zone 4 alarm:** Facility emergency. Fire suppression system may activate if water volume is significant.

### Sensor Placement Guidelines

- Under every CDU assembly (rope sensor in drain pan)
- At each rack base (pad sensor in drip tray)
- Every 3 meters along raised-floor perimeter (rope sensor)
- At all pipe penetrations through walls/floors (point sensor)
- Cable routing: keep sensor cables separate from power cables to avoid false alarms

## ASHRAE A-Class Server Inlet Air Temperature

Even in liquid-cooled environments, air cooling handles partial IT load (disk drives, power supplies, network switches).

| ASHRAE Class | Allowable Inlet Temp Range | Humidity Range | Typical Facility |
|-------------|---------------------------|----------------|------------------|
| A1 | 15-32C | 20-80% RH | Enterprise, standard |
| A2 | 10-35C | 20-80% RH | Extended range, modern servers |
| A3 | 5-40C | 8-85% RH | Hardened, economizer-optimized |
| A4 | 5-45C | 8-90% RH | Maximum economizer, limited equipment |

**Verification requirement for mixed cooling:**

In DTC environments, the CDU removes 60-80% of heat at the cold plate. The remaining 20-40% (power supplies, drives, memory not on liquid loop) must be handled by air cooling. Verify that:

1. Air supply temperature stays within the server's ASHRAE class rating
2. Airflow volume is sufficient for the residual heat load
3. Hot aisle temperature does not exceed return air capability of CRAH/CRAC units

---
*ASHRAE TC 9.9 Deep Reference v1.0.0 -- Fluid Systems Skill*
*All outputs require verification by a licensed Professional Engineer.*
