# DC Distribution — Deep Reference

*Power Systems Skill — 380V DC architecture, protection devices, efficiency analysis*

## 380V DC Architecture Details

### Component Chain

```
Utility AC ─┬─ Input Breaker ─── Transformer ─── Rectifier/PFC ─── 380V DC Bus
             │                                                          │
             │                                                    Bus Protection
             │                                                          │
             │                                           ┌──────────────┼──────────────┐
             │                                     Per-Rack Fuse   Per-Rack Fuse   Per-Rack Fuse
             │                                           │              │              │
             │                                     Server PSU     Server PSU     Server PSU
             │                                     (DC input)     (DC input)     (DC input)
             └── Generator (via ATS, AC side only)
```

### Bus Specifications

- **Nominal voltage:** 380V DC (IEC 62040-5-3 standard)
- **Voltage tolerance:** +/- 10% (342-418V DC operating range)
- **Ripple:** <5% peak-to-peak on rectifier output
- **Grounding:** Typically IT system (floating) with insulation monitoring; or mid-point grounded (+/- 190V to ground)
- **Bus capacitance:** Significant stored energy; requires discharge mechanism for maintenance safety
- **Server PSU requirement:** Wide-range DC input (260-400V DC typical); not all server models support DC input — verify before specifying

### Rectifier Specifications

- **Active front end (AFE):** IGBT-based rectifier with power factor correction
- **Input power factor:** >0.99 with AFE; reduces harmonic distortion on AC supply
- **Efficiency:** 97-98% (high-quality AFE rectifier)
- **Modular design:** N+1 rectifier modules for redundancy; hot-swappable
- **BESS integration:** Battery connects directly to DC bus via bidirectional converter or direct coupling (if voltage-compatible)

### Standards

| Standard | Scope |
|----------|-------|
| IEC 62040-5-3 | DC output UPS systems for 380V DC |
| ETSI EN 300 132-3-1 | 400V DC power supply interface |
| EMerge Alliance 380V DC | Data center DC distribution standard |
| ITU-T L.1200 | Direct current power feeding interface |

## Efficiency Analysis: AC vs DC Distribution

### Traditional AC Distribution Chain

```
Utility AC ─── Transformer ─── UPS Rectifier ─── UPS Inverter ─── PDU Transformer ─── Server PSU
              (99%)           (97%)              (97%)            (98%)              (92%)

Chain efficiency: 0.99 x 0.97 x 0.97 x 0.98 x 0.92 = 0.840 (84.0%)
```

For 100 kW IT load: 100 / 0.84 = 119 kW from utility = **19 kW losses**

### 380V DC Distribution Chain

```
Utility AC ─── Transformer ─── Rectifier/PFC ─── DC Bus ─── Server PSU (DC input)
              (99%)           (97%)                         (95%)

Chain efficiency: 0.99 x 0.97 x 0.95 = 0.912 (91.2%)
```

For 100 kW IT load: 100 / 0.912 = 110 kW from utility = **10 kW losses**

### Efficiency Comparison Summary

| Metric | AC Distribution | 380V DC Distribution | Delta |
|--------|----------------|---------------------|-------|
| Chain efficiency | 84.0% | 91.2% | +7.2 pp |
| Losses per 100 kW IT | 19 kW | 10 kW | -9 kW |
| Annual energy saved (per 100kW) | — | 78,840 kWh | — |
| Cost savings (@$0.10/kWh) | — | $7,884/yr | — |
| Conversion stages | 4 (AC-DC-AC-AC-DC) | 2 (AC-DC) | -2 stages |

**Caveats:**
- AC numbers assume traditional double-conversion UPS with PDU transformer; modern high-efficiency UPS (e-conversion mode) narrows the gap to 3-4%
- DC PSU efficiency (95%) assumes purpose-built DC input; not all server vendors offer DC input models
- Battery integration more efficient in DC architecture: battery connects directly to DC bus without additional conversion

## Protection Devices for DC

### DC Circuit Breakers

DC breakers are fundamentally different from AC breakers:

- **AC breakers** interrupt current at natural zero-crossing (every half-cycle, 120 times/second at 60Hz)
- **DC breakers** must force current to zero through arc extinguishing mechanisms (magnetic blowout, arc chutes, or solid-state interruption)
- **NEVER use an AC-rated breaker on a DC circuit** — it will arc internally and fail to interrupt, potentially causing fire

**DC breaker ratings:**
- Voltage rating: specific to DC; a 480V AC breaker is NOT rated for 480V DC
- Current rating: same concept as AC but verify DC-specific listing
- Interrupting capacity: DC fault current can be very high; verify breaker can interrupt maximum available fault current

### Types of DC Protection Devices

| Device | Application | Response Time | Notes |
|--------|-------------|---------------|-------|
| Molded case DC breaker | Main bus protection, feeder | 10-50 ms | Magnetic blowout arc extinction |
| DC fuse (current-limiting) | String/rack protection | <5 ms | Fastest; limits let-through energy |
| Solid-state DC breaker | High-speed protection | <1 ms | Semiconductor-based; no arc; expensive |
| DC contactor | Load switching | 10-20 ms | Auxiliary contacts for control; not fault-rated alone |
| AFCI (DC arc fault) | Array and distribution | 0.5-2 s | Detects series arc; required per NEC 690.11 |

### DC Fuse Selection

- **Class T fuse:** Most common for DC distribution; current-limiting; available 1-800A
- **Class J fuse:** Alternative for larger ratings; current-limiting; available 1-600A
- **Voltage rating:** Must meet or exceed DC system voltage; a 600V AC fuse may only be rated for 300V DC — check marking
- **Interrupt rating:** 200 kAIC common for Class T; adequate for most data center DC buses
- **Coordination:** Upstream fuse (bus) must be slower than downstream fuse (rack) for selective coordination

## Grounding and Fault Detection

### Ungrounded (Floating / IT) DC System

```
       Rectifier
         │
    (+) ─┤─── Load ───┤─ (-)
         │             │
         │    [IMD]    │
         │      │      │
         └──────┴──────┘
                │
               PE (protective earth)
```

- **Normal operation:** No current flows to ground; touch voltage = 0V
- **Single ground fault:** System becomes grounded at fault point; touch voltage at opposite pole = full bus voltage; IMD alarms
- **Double ground fault:** Short circuit through ground path; protection must trip
- **Insulation Monitoring Device (IMD):** Continuously measures resistance between each pole and PE; alarms at <100 kohm threshold (adjustable)
- **Advantage:** Highest safety during single-fault condition — no shock hazard until second fault
- **Disadvantage:** Must respond to IMD alarm before second fault occurs; more complex fault location

### Solidly Grounded DC System

```
       Rectifier
         │
    (+) ─┤─── Load ───┤─ (-)
         │             │
         │             └──── PE (grounded)
         │
    (floating positive pole)
```

- **Normal operation:** Negative (or positive) pole bonded to PE
- **Ground fault on floating pole:** Direct short circuit through ground; protection trips immediately
- **Advantage:** Simple fault detection; conventional overcurrent protection works
- **Disadvantage:** Higher touch voltage risk — contact with floating pole at any time = full bus voltage to ground
- **Application:** Simpler systems where rapid fault clearing is preferred over first-fault safety

### Mid-Point Grounded DC System

```
       Rectifier
         │
    (+) ─┤─── Load ───┤─ (-)
         │             │
         │   Center ───┤── PE
         │    Tap      │
         └─────────────┘
```

- **Normal operation:** Center tap grounded; each pole is 190V to ground for 380V system
- **Advantage:** Lower touch voltage (190V vs 380V); better for personnel safety
- **Disadvantage:** Requires center-tapped source; unbalanced loads cause ground current
- **Application:** Some European 380V DC installations

## Conversion Challenges

### Voltage Drop in DC

DC voltage drop is purely resistive (no reactive impedance component):

V_drop = I x R x L / 1000 (for one-way distance)

For two-wire DC circuit: V_drop = 2 x I x R_per_1000ft x L / 1000

DC voltage drop is more significant than equivalent AC because:
1. No reactive compensation possible (capacitors don't help with DC drop)
2. DC loads are constant-power — as voltage drops, current increases, increasing drop further
3. Conductor sizing for DC feeders should target <2% drop (tighter than AC 3% branch limit)

### Telecom -48V System Conventions

Legacy telecom DC systems use inverted polarity convention:

- **Negative bus (-48V) is the return conductor** — grounded
- **Positive bus (0V/ground)** — bonded to earth
- **Current flows on the negative rail** — reverse of conventional thinking
- **Reason:** Historical — positive grounding reduces galvanic corrosion in wet cable vaults
- **Battery:** Float voltage -54.5V (2.27V/cell x 24 cells); end-of-discharge -42V
- **Protection:** 60A class T fuses per server/blade; one per load circuit

### 48V to 12V Conversion (On-Server)

- **Voltage Regulator Module (VRM):** Buck converter on server motherboard; 48V in, 12V or 1.0-1.8V out
- **Efficiency:** 48V-to-12V: 96-97%; 12V-to-CPU (1.0V): 85-90%
- **Advantage over AC:** 48V-to-12V single-stage is more efficient than 240VAC-to-12V multi-stage
- **Transient response:** VRMs must respond to CPU power transients (microsecond load steps); requires output capacitor bank
- **Open Compute Project:** Standardized 48V rack power architecture; multiple server vendors now offer 48V input servers

## Future of DC Distribution

### Adoption Drivers

1. **Efficiency mandates:** Hyperscalers targeting PUE <1.1; eliminating conversion stages is one of the few remaining efficiency levers
2. **BESS integration:** Batteries are inherently DC; direct coupling to DC bus avoids bidirectional inverter losses
3. **Solar PV coupling:** PV arrays produce DC; DC coupling to data center bus avoids inverter on generation side
4. **EV charging:** DC fast charging (150-350 kW) shares DC bus infrastructure opportunity
5. **Edge computing:** Small deployments in telecom shelters naturally fit 48V DC heritage

### Barriers

1. **Certification lag:** UL/NEC standards for DC components trail AC by decades; fewer listed products
2. **Installer familiarity:** Electricians trained on AC; DC requires different safety practices (no zero-crossing arc extinction)
3. **Stranded AC investment:** Existing facilities have AC infrastructure; retrofit economics unfavorable
4. **Vendor ecosystem:** Fewer DC PDU, breaker, and monitoring vendors vs mature AC market
5. **Server compatibility:** Not all server models offer DC input PSU; limits deployment flexibility

### Expected Trajectory

| Timeframe | Development |
|-----------|-------------|
| 2024-2026 | Hyperscale greenfield builds increasingly specify 380V DC option alongside AC |
| 2026-2028 | Second-tier cloud providers evaluate DC for new builds; BESS-coupled DC systems become standard at utility scale |
| 2028-2030 | DC distribution products mature to AC-equivalent vendor diversity; retrofit products emerge |
| 2030+ | Mixed AC/DC distribution becomes standard design pattern for new data centers |

**Key indicator:** When 380V DC-input servers become standard (not optional) from Dell, HPE, and Lenovo, DC distribution adoption will accelerate rapidly. Currently (2026), DC-input is available but requires special order on most platforms.

---
*Deep reference for Power Systems Skill — DC distribution architecture and engineering*
*Source: IEC 62040-5-3, ETSI EN 300 132-3-1, EMerge Alliance, NEC 2023*
