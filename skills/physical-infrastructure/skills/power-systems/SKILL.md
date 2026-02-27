---
name: pie-power-systems
version: 1.0.0
description: "Electrical power distribution design for infrastructure: load calculations (NEC 220), conductor sizing (NEC 310.16), transformer/UPS/PDU selection, redundancy architectures (N through 2N+1), DC distribution, and voltage classes 120V-480V. Activates for electrical load calculations, conductor sizing, power equipment selection, data center power design, and redundancy architecture planning."
user-invocable: true
allowed-tools: Read Grep Glob Bash
metadata:
  extensions:
    gsd-skill-creator:
      version: 1
      createdAt: "2026-02-26"
      triggers:
        intents:
          - "load calculation"
          - "conductor sizing"
          - "ampacity"
          - "voltage drop"
          - "transformer"
          - "UPS"
          - "PDU"
          - "power distribution"
          - "NEC"
          - "redundancy"
          - "2N"
          - "N+1"
          - "electrical"
          - "circuit breaker"
          - "480V"
          - "208V"
          - "three-phase"
          - "power factor"
        contexts:
          - "data center power design"
          - "electrical system design"
          - "infrastructure engineering"
          - "power system sizing"
applies_to:
  - skills/physical-infrastructure/**
  - "*.calc"
  - "*.sld"
---

# Power Systems Skill

## At a Glance

Design and validate electrical power distribution systems from utility service entrance through rack-level PDUs, covering all voltage classes from 120V single-phase through 480V three-phase.

**Activates on:** InfrastructureRequest type='power', any load calculation, conductor sizing, transformer/UPS/PDU selection, redundancy architecture design.

**Key capabilities:**
- NEC Article 220 load calculations (connected load and optional 220.87 methods)
- NEC Table 310.16 conductor sizing with temperature and conduit fill corrections
- Transformer sizing (kVA, K-factor for non-linear loads, impedance selection)
- UPS selection (online double-conversion, runtime calculation, redundancy modes)
- PDU selection (floor-standing and rack PDU, whip ratings, phase balance)
- Redundancy architectures: N, N+1, 2N, and 2N+1 with topology diagrams
- Voltage classes: 120V, 208V, 240V, 277V, 400V, 480V
- DC distribution patterns: 380V DC bus, 48V telecom, 12V on-board
- Safety: arc flash boundaries, GFCI/GFP requirements, shock thresholds

**Code references:** NEC 220 for load calculations, NEC 310 for conductors, NEC 230 for services — always reference the current locally adopted edition of NFPA 70.

> **ENGINEERING DISCLAIMER:** Electrical system design must be verified by a licensed Professional Engineer or licensed Electrician before installation. Arc flash analysis, fault current calculations, and equipment grounding require site-specific engineering. All work must comply with the locally adopted edition of NFPA 70 (NEC) and applicable OSHA standards. User assumes all responsibility for verification.

**Quick routing:**
- Load calculation needed? Start at [Electrical Load Calculation](#electrical-load-calculation)
- Sizing conductors? Go to [Conductor Sizing](#conductor-sizing)
- Selecting equipment? See [Transformer Sizing](#transformer-sizing), [UPS Systems](#ups-systems), or [PDU Selection](#pdu-selection)
- Designing redundancy? See [Redundancy Architectures](#redundancy-architectures)
- Voltage class selection? See [Voltage Classes and DC Distribution](#voltage-classes-and-dc-distribution)

## Electrical Load Calculation

### Connected Load Method (NEC 220 General)

Process: sum all equipment nameplate ratings, apply NEC demand factors, add 25% future growth margin.

NEC demand factors reduce calculated load to account for the fact that not all loads operate simultaneously:

**Lighting — NEC Table 220.42:**
- First 3 kVA at 100%
- Next 117 kVA at 35%
- Remainder at 25%

**Receptacles — multi-outlet circuits (>10 kVA):**
- First 10 kVA at 100%
- Remainder at 50%

**Motors — NEC 430.24:**
- Largest motor full-load current x 125%
- All remaining motors at 100%
- HVAC: use larger of heating or cooling load, not both (NEC 220.60)

**Data center calculation (industry practice):**
1. IT load = rack_count x avg_rack_density_kW x diversity_factor (0.7-0.9)
2. UPS losses: 3-8% of IT load (online double-conversion)
3. PDU losses: <2% of IT load
4. Cooling: 15-40% of IT load (depending on target PUE)
5. Lighting and miscellaneous: 3-5% of IT load
6. Total calculated load = sum of all above
7. Design service = total x 1.25 (NEC 230.42 minimum service sizing)

### Optional Method (NEC 220.87)

Use for existing facilities with 12+ months of metering data:
- Load = 125% x highest 15-minute demand recorded in past 12 months
- Add 125% of all new loads being installed
- More accurate than connected load method for established facilities
- Preferred when measured data is available — avoids over-sizing

### Worked Example: 100-Rack Data Center

| Load Component | Calculation | kW |
|----------------|-------------|-----|
| IT load | 100 racks x 10 kW x 0.8 diversity | 800 |
| UPS losses | 800 kW x 5% | 40 |
| PDU losses | 800 kW x 1.5% | 12 |
| Cooling (PUE 1.4) | 800 kW x 32% | 256 |
| Lighting + misc | 800 kW x 3% | 24 |
| **Subtotal** | | **1,132** |
| **Design service (x 1.25)** | | **1,415** |

This facility needs approximately 1,415 kW (1,770 kVA at 0.8 PF) service entrance capacity. PUE contribution is the dominant non-IT factor — reducing PUE from 1.4 to 1.2 saves ~160 kW of service capacity.

For full NEC 220 demand factor tables and calculation worksheets: @references/nec-load-calculations.md

## Conductor Sizing

### Ampacity Tables (NEC Table 310.16)

NEC Table 310.16 provides ampacity for copper conductors in raceway at ambient 30 deg C. The 75 deg C column is standard for most commercial and industrial installations:

| Wire Size | 75 deg C Ampacity | Common Use |
|-----------|-------------------|------------|
| 12 AWG | 25A | Branch circuits to 20A breaker |
| 10 AWG | 35A | 30A circuits |
| 8 AWG | 50A | 40A circuits |
| 6 AWG | 65A | 50A circuits |
| 4 AWG | 85A | 60-70A circuits |
| 2 AWG | 115A | 90A circuits |
| 1/0 AWG | 150A | 125A subfeed |
| 4/0 AWG | 230A | 200A service/feeder |
| 500 kcmil | 380A | 350A feeder |

Full table including aluminum conductors and all three temperature ratings: @references/conductor-sizing.md

### Correction Factors

**Ambient temperature correction (NEC Table 310.15(B)(1)):**
- 30 deg C ambient: x 1.00 (base — no correction needed)
- 40 deg C ambient (data center hot aisle): x 0.87 for 75 deg C insulation
- 45 deg C ambient: x 0.82
- 50 deg C ambient (industrial): x 0.75

**Conduit fill correction (NEC 310.15(C)):**
- 1-3 conductors: x 1.00 (no correction)
- 4-6 conductors: x 0.80
- 7-9 conductors: x 0.70
- 10-20 conductors: x 0.50

Correction factors are **multiplicative** — apply both when both conditions exist. Example: 8 AWG copper at 40 deg C with 6 conductors in conduit: 50A x 0.87 x 0.80 = 34.8A derated ampacity.

### Voltage Drop Verification

**Formulas:**
- Single-phase: V_drop = (2 x L_ft x I_A x R_ohm_per_1000ft) / 1000
- Three-phase: V_drop = (1.732 x L_ft x I_A x R_ohm_per_1000ft) / 1000

**Limits (NEC informational notes):**
- Branch circuits: 3% maximum voltage drop
- Total system (feeder + branch): 5% maximum
- At 3% drop: 120V circuit delivers >= 116.4V; 480V feeder delivers >= 465.6V

Conductors sized for voltage drop are often larger than the ampacity requirement — always use the larger conductor.

## Transformer Sizing

### kVA Calculation

- Three-phase: kVA = (V_line x I_line x 1.732) / 1000
- Single-phase: kVA = (V x I) / 1000
- From load: kVA = kW / power_factor (use 0.9 for UPS-fed IT loads, 0.8 for general commercial)
- Sizing margin: transformer nameplate kVA >= total connected kVA / 0.8 (do not load above 80% to reduce temperature rise and extend transformer life)

### K-Factor for Non-Linear Loads

K-factor quantifies the harmonic heating effect: K = sum(Ih^2 x h^2) / sum(Ih^2), where Ih = harmonic current magnitude at harmonic order h.

| K-Rating | Load Type | Application |
|----------|-----------|-------------|
| K-1 | Linear resistive loads | Heating, incandescent lighting |
| K-13 | Modern UPS, switch-mode PSUs | Data centers, server rooms |
| K-20 | Variable frequency drives, arc furnaces | Heavy industrial |

A standard K-1 transformer feeding K-13 loads must be derated to approximately 50% of nameplate kVA. Solution: specify a K-13 or K-20 rated transformer at full nameplate — same physical size, designed for harmonic currents.

### Impedance

- Typical: 5.75% for medium-voltage transformers, 2-4% for small dry-type
- Lower impedance: lower voltage drop under load, but higher available fault current at secondary terminals
- Higher impedance: limits fault current (helps downstream protective devices coordinate), but increases voltage drop at full load
- Trade-off: data centers often prefer 5.75% for fault current limiting; downstream breakers must have adequate interrupting rating

### Efficiency

NEMA Premium (TP-1) transformers: 98.3% efficiency at 35% loading (peak efficiency point). At full load: ~97.5%. Total losses at 80% loading for 1000 kVA unit: approximately 20 kW heat rejection to electrical room — must be included in HVAC calculations.

## UPS Systems

### Online Double-Conversion

Path: Utility AC -> Rectifier -> DC Bus -> Inverter -> Load AC

- Server always powered from inverter output — seamless utility failure transition (<2 ms)
- Battery connected in parallel on DC bus; charges during normal operation, discharges on utility loss
- DC bus voltage: 480V bus for large systems (100+ kVA); 48V for small edge UPS
- Preferred for data centers: clean sine wave output, tight voltage regulation (+/- 1%), frequency regulation (+/- 0.1 Hz)

### Runtime Calculation

Formula: Runtime_min = (Battery_Ah x V_dc x inverter_efficiency) / Load_W x 60

Example: 200 Ah VRLA battery bank at 480V DC bus, 95% inverter efficiency, 60 kW load:
Runtime = (200 x 480 x 0.95) / 60,000 x 60 = 91.2 minutes

**Battery types:**
- VRLA (Valve Regulated Lead-Acid): 3-5 year life, lowest cost, heaviest, 200-500 cycles
- Li-ion: 10-15 year life, 2-3x energy density, higher upfront cost, 3,000+ cycles
- Li-ion is increasingly standard for new data center builds due to reduced floor space and longer replacement cycles

### Sizing Rule

UPS kVA = IT load kW x 1.25 / power_factor

- kVA vs kW: UPS rated in kVA; IT load measured in kW; use IT power factor (0.9 typical) to convert
- Design margin of 1.25 per BICSI guidelines prevents loading above 80%
- Example: 400 kW IT load at 0.9 PF = 444 kVA. With margin: 444 x 1.25 = 556 kVA -> select 600 kVA UPS

### Redundancy Configurations

- **N:** One UPS sized for full load; any UPS failure = outage
- **N+1:** N+1 UPS modules in a single frame; one module can fail with remaining N sustaining full load
- **2N:** Two complete UPS systems (Path A + Path B), each independently capable of full load. Requires dual-corded servers (two power supplies, each on a separate path)
- **2N+1:** Each path is N+1 redundant; maximum protection against both single-point and maintenance-concurrent failures

## PDU Selection

### Floor-Standing PDU

- Contains: step-down transformer (480V -> 208V typical), main input breaker, branch circuit panel with output breakers, power monitoring (BCMS)
- Rating range: 75 kVA (typical 20-rack cluster) to 225 kVA (large zone)
- Input: typically 480V 3-phase from UPS output
- Output: 208V 3-phase distributed to rack PDUs via whip cables
- Monitoring: per-circuit current monitoring via Branch Circuit Monitoring System (BCMS); enables load balancing and capacity planning

### Rack PDU

Connects floor-standing PDU output to server rack outlets via whip cables:

| Whip Type | Voltage | Ampacity | Max Load |
|-----------|---------|----------|----------|
| L6-20 | 208V | 20A | 3.5 kW |
| L6-30 | 208V | 30A | 6.2 kW |
| L6-50 | 208V | 50A | 10.4 kW |
| L6-60 | 208V | 60A | 12.5 kW |

**Intelligent rack PDU features:** per-outlet monitoring (amps, watts, kWh), remote outlet switching, outlet grouping for managed power cycling, environmental monitoring (temperature and humidity sensors built in).

### Phase Balance

Load must be balanced across A, B, C phases within +/- 10% deviation. Unbalanced phases cause neutral current in three-phase systems, increased losses, and potential nuisance tripping. Check with PDU metering; redistribute circuits as needed during commissioning and periodically during operation.

## Redundancy Architectures

### N — No Redundancy

```
[Utility] --> [Transformer] --> [UPS] --> [PDU] --> [Rack Load]

Any single component failure = full outage
```

Use case: Development environments, non-critical applications, cost-constrained small offices.

### N+1 — One Spare Module

```
[UPS Module 1] --+
[UPS Module 2] --+-- [Static Bypass] --> [PDU] --> [Load]
[UPS Module 3] --+   (N=2 required, 1 spare)
```

One UPS module can fail; remaining two sustain full load. Maintenance: one module can be serviced without outage if remaining capacity is sufficient.

Use case: SMB data centers, Uptime Institute Tier II.

### 2N — Dual Path

```
Path A: [Utility A] --> [Xfmr A] --> [UPS A] --> [PDU A] --+
                                                             +-- [Dual-Corded Server]
Path B: [Utility B] --> [Xfmr B] --> [UPS B] --> [PDU B] --+

Each path independently sustains full load.
```

Requires servers with dual power supplies (standard for data center servers). Each PSU connects to a different path. Either path can sustain full load if the other fails completely.

Use case: Enterprise data centers, Uptime Institute Tier III-IV.

### 2N+1 — Maximum Redundancy

```
Path A: [UPS A1 + UPS A2 (N+1)] --> [PDU A] --+
                                                +-- [Dual-Corded Server]
Path B: [UPS B1 + UPS B2 (N+1)] --> [PDU B] --+

Each path is N+1 internally; one entire path can fail
with the other sustaining N+1 redundancy.
```

Maximum protection: tolerates simultaneous UPS module failure and complete path failure. One path can be taken fully offline for maintenance while the other remains N+1 redundant.

Use case: Mission-critical facilities, Uptime Institute Tier IV, financial trading, healthcare.

For transfer switch types, automatic source transfer, and generator integration: @references/redundancy-architectures.md

## Voltage Classes and DC Distribution

### Supported Voltage Classes

| Class | Configuration | Typical Use |
|-------|--------------|-------------|
| 120V | Single-phase (L-N of 120/240V) | Residential receptacles, small office |
| 208V | Three-phase (L-L of 120/208V Y) | Data center rack PDUs, small commercial |
| 240V | Single-phase (L-L of 120/240V split) | Residential HVAC, large appliances |
| 277V | Single-phase (L-N of 480V Y) | Commercial/industrial lighting |
| 400V | Three-phase (European 230/400V) | EU data centers, IEC standard equipment |
| 480V | Three-phase (Y) | US data center primary distribution, large motors, switchgear |

InfrastructureRequest.constraints.voltageClass maps to these six values.

### DC Distribution Patterns

- **380-400V DC bus:** Gaining adoption in hyperscale data centers. Eliminates AC-DC conversion in server PSU for ~3-5% efficiency gain. Safety: 380V DC is not inherently safer than 240V AC; same LOTO requirements apply.
- **48V DC:** Predominant in telecom central offices (NEBS standards) and blade server backplanes. -48V nominal (negative grounded per legacy telecom practice).
- **12V on-board:** Converted from 48V by server VRMs (voltage regulator modules). CPU power rails further step down to ~1.0V.
- **LVDC (Low Voltage DC):** Growing for edge computing, IoT sensor networks, EV charging infrastructure.

## Safety Boundaries

### Electrical Hazard Thresholds by Safety Class

| Hazard | Residential | Commercial | Data Center | Industrial |
|--------|------------|-----------|-------------|-----------|
| Max voltage (unqualified) | 50V AC | 50V AC | 50V AC | 50V AC |
| Arc flash boundary | Not calculated | Per IEEE 1584 | Per IEEE 1584 | Per IEEE 1584 |
| GFCI required | 125V 15/20A per NEC 210.8 | 125V 15/20A wet locations | 125V 15/20A near CDU/water | All 125V near water |
| GFP required | No | >1000A services | All UPS >1000A output | All services >1000A |
| BESS protection | NFPA 855 | NFPA 855 | NFPA 855 + FM Global | NFPA 855 + suppression |

Arc flash hazard increases with available fault current. Data center 480V buses with low-impedance transformers can produce very high incident energy — PPE Category 2-4 (8-40 cal/cm^2) is common. Labels per NEC 110.16 required on all equipment likely to be serviced while energized.

**Safety warden triggers:**
- Calculated voltage exceeds safety class threshold without PPE call-out: severity 'critical', domain 'voltage'
- Missing GFCI protection near water-cooled equipment: severity 'warning'
- Missing arc flash label call-out: severity 'warning'
- Any 480V+ industrial class work described without "qualified persons only" notation: severity 'critical'

## Reference Documents

| Reference | When to Read | Coverage |
|-----------|-------------|----------|
| @references/nec-load-calculations.md | Full NEC 220 demand factor tables | Complete load calculation methodology |
| @references/conductor-sizing.md | Full NEC 310.16 ampacity table, correction factors | Complete conductor selection |
| @references/redundancy-architectures.md | Transfer switches, generator integration, Tier correlation | Redundancy topology design |

---
*Power Systems Skill v1.0.0 — Physical Infrastructure Engineering Pack*
*Phase 436-01 | References: NFPA 70 (NEC 2023), IEEE 1584, NFPA 855, BICSI 002*
*All outputs require verification by a licensed Professional Engineer and licensed Electrician.*
