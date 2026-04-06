# Power Systems

> **Domain:** Electrical Engineering — Renewable Energy, Power Distribution, Energy Storage
> **Module:** 2 — Open Compute Node: Complete Power System Specification
> **Through-line:** *Sunlight lands on silicon at 1,000 W/m². By the time it reaches a GPU cold plate it has passed through atmosphere, glass, semiconductor junctions, copper conductors, magnetic cores, and printed circuit boards. Every conversion steals a fraction. The discipline of power systems engineering is the art of losing as little as possible on that journey — and storing enough of what arrives to last through the night.*

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
>
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation based on this specification:
>
> 1. All structural calculations must be verified by a PE licensed in the jurisdiction of deployment.
> 2. All electrical designs must comply with local amendments to the National Electrical Code (NEC 2023 / NFPA 70).
> 3. All energy storage installations must comply with NFPA 855 and local amendments.
> 4. Arc flash hazard analysis (NFPA 70E) must be performed by a qualified electrical engineer before energizing any portion of this system.
> 5. Grid interconnection, if pursued, requires coordination with the local utility and compliance with IEEE 1547-2018.
> 6. Site-specific soil, seismic, and wind load analysis must be performed before mounting structures are erected.
>
> *The authors assume no liability for use of this specification without proper professional review.*

---

## Table of Contents

1. [Load Analysis](#1-load-analysis)
2. [Solar Array Sizing](#2-solar-array-sizing)
3. [Battery Energy Storage System](#3-battery-energy-storage-system)
4. [Wind Supplementation](#4-wind-supplementation)
5. [Power Distribution Architecture](#5-power-distribution-architecture)
6. [Grid Interconnection](#6-grid-interconnection)
7. [Power Quality and Monitoring](#7-power-quality-and-monitoring)
8. [Safety and Codes](#8-safety-and-codes)
9. [System Integration and Performance Summary](#9-system-integration-and-performance-summary)
10. [Sources and Standards](#10-sources-and-standards)

---

## 1. Load Analysis

### 1.1 Reference Configuration

The Open Compute Node power system is specified for two deployment configurations. The **single-rack reference** is the primary design basis — one GB200 NVL72 rack plus all overhead systems — and serves as the unit cell for multi-rack deployments. All sizing in this document leads from the single-rack reference unless the dual-rack configuration is explicitly called out.

| Configuration | Compute Load | Total Continuous Load |
|--------------|-------------|----------------------|
| Single-rack (reference) | 120 kW | ~150 kW |
| Dual-rack | 240 kW | ~280 kW |

### 1.2 Detailed Load Breakdown — Single-Rack Reference

#### 1.2.1 Compute Subsystem

The NVIDIA GB200 NVL72 is the compute reference platform. Per NVIDIA specifications, the rack draws approximately 120 kW at continuous full load. This is not a peak or theoretical figure — it is the sustained thermal design power (TDP) under high-utilization AI training workloads. Power supply redundancy within the rack is N+N: the rack contains eight power shelves, each with six 5.5 kW power supply units (PSUs), providing 264 kW of installed PSU capacity against the 120 kW load. The rack accepts a 48–51V DC bus bar input, converting internally to the voltages required by each compute tray.

| Component | Rated Power | Notes |
|-----------|------------|-------|
| GB200 NVL72 compute rack | 120 kW | Continuous full-load TDP |
| Direct-to-chip liquid cooling (GPUs/CPUs) | Included in 120 kW | Heat to CDU, not electrical |
| NVLink fabric and networking | ~10 kW | Included in rack TDP |

#### 1.2.2 Cooling Subsystem

The Coolant Distribution Unit (CDU) and associated pumps, fans, and control electronics consume approximately 15–20 kW depending on ambient conditions and flow rate. This load is outside the rack TDP but is part of the facility electrical budget. The CDU maintains coolant at 15–25°C inlet temperature per ASHRAE TC 9.9 Class W32 requirements.

| Component | Power Draw | Notes |
|-----------|-----------|-------|
| CDU primary pumps (2× redundant) | 7–10 kW | Variable-speed, load-following |
| CDU fan array (if dry cooler) | 5–8 kW | Dependent on ambient |
| CDU controls and instrumentation | ~0.5 kW | Always-on |
| Water filtration system pumps | ~1–2 kW | Depends on throughput |
| **Cooling subtotal** | **13.5–20.5 kW** | Design basis: 18 kW |

#### 1.2.3 Facility Overhead

| Component | Power Draw | Notes |
|-----------|-----------|-------|
| LED lighting (interior zones) | 0.5 kW | Dimming controls |
| Fire suppression panel + sensors | 0.3 kW | Always-on standby |
| Security system (access control, cameras) | 0.5 kW | Always-on |
| Environmental monitoring | 0.3 kW | Temperature, humidity, leak |
| DCIM gateway and networking | 0.8 kW | Management plane |
| Power monitoring equipment | 0.3 kW | Per-circuit metering |
| Miscellaneous / future growth margin | 2.3 kW | 10% design margin |
| **Facility overhead subtotal** | **~5 kW** | |

#### 1.2.4 Power Distribution Losses

Every energy conversion and distribution stage introduces resistive and switching losses. The all-DC architecture described in Section 5 minimizes conversion stages, but losses remain unavoidable.

| Stage | Estimated Loss |
|-------|---------------|
| Solar MPPT charge controller efficiency | 2–3% |
| DC bus conductor losses (1500V distribution) | 0.5–1% |
| DC-DC converter (1500V → 48V) | 3–4% |
| Bus bar and cable runs (48V distribution) | 0.5–1% |
| **Total distribution loss** | **~6–9%** |

For sizing purposes, a 7% total distribution loss is used. This means the solar/storage system must deliver approximately 161 kW at the array output to put 150 kW into loads, or equivalently, the nameplate solar capacity calculation uses an effective load of 161 kW.

#### 1.2.5 Complete Load Summary — Single Rack

| Load Category | Power (kW) | % of Total |
|--------------|-----------|-----------|
| Compute — GB200 NVL72 | 120.0 | 74.5% |
| Cooling — CDU and pumps | 18.0 | 11.2% |
| Facility overhead | 5.0 | 3.1% |
| Power distribution losses (7%) | 11.4 | 7.1% |
| **Design basis (continuous)** | **~154.4 kW** | **100%** |
| **Rounded design basis** | **155 kW** | |

The 155 kW figure is used throughout this document as the single-rack system design basis. References to "150 kW" in the vision documents round down slightly; the more conservative 155 kW is used here for sizing.

#### 1.2.6 Peak vs. Average Load Profiles

GPU workloads are not constant. The 120 kW rack TDP represents the maximum sustained compute state. Real workloads exhibit two distinct profiles:

**Training profile:** Sustained high utilization for hours to days. GPU utilization 85–100%, power draw at or near TDP. This is the design basis — the system must sustain this profile continuously.

**Inference profile:** Bursty utilization. Requests arrive, GPUs ramp to full power for milliseconds to seconds, then return to idle. Average power may be 40–70% of TDP. During inference workloads the BESS absorbs power fluctuations and the solar array operates at a slightly relaxed average point.

**Idle/maintenance profile:** GPUs in low-power state. Power draw approximately 20–30 kW for the compute rack plus full overhead (23 kW). Total ~43–53 kW. During idle periods the battery charges aggressively.

| Profile | Compute Power | Total Facility | Duration |
|---------|--------------|---------------|---------|
| Training (design basis) | 120 kW | 155 kW | Hours–days |
| Inference (average) | 60–85 kW | 95–120 kW | Varies |
| Idle / maintenance | 20–30 kW | 43–53 kW | Short-term |
| Peak transient (GPU ramp) | 130–140 kW | 165–175 kW | < 10 seconds |

The BESS handles peak transients. The solar array and wind generation are sized for the training (continuous maximum) profile. Inference and idle profiles produce net positive battery charging during daylight hours, building reserve for overnight operation.

---

## 2. Solar Array Sizing

### 2.1 Solar Resource Basis

The Open Compute Node is sited along US rail corridors with solar irradiance greater than 5 kWh/m²/day. The reference deployment site is the US Southwest — the Sunset Route (Union Pacific) and BNSF Transcon corridors through Texas, New Mexico, Arizona, and Southern California.

NREL's National Solar Radiation Database (NSRDB) provides the authoritative irradiance data. The reference location is Tucson, AZ, which represents the median of high-priority corridor sites:

| Location | Annual GHI (kWh/m²/day) | Notes |
|---------|------------------------|-------|
| El Paso, TX | 6.2 | Highest on corridor |
| Tucson, AZ | 5.9 | Reference design site |
| Albuquerque, NM | 5.7 | NREL TMY3 reference station |
| Phoenix, AZ | 5.8 | High summer, acceptable winter |
| Flagstaff, AZ | 5.3 | Higher elevation, cooler, good irradiance |
| Minimum acceptable site | 5.0 | Below this: underperformance |

**Capacity factor basis:** NREL utility-scale solar capacity factor data (2022–2024) shows a national average of approximately 24.7% for ground-mounted, fixed-tilt PV systems. Single-axis tracking improves this to approximately 29–31% at Southwest sites. The fixed-tilt figure (24.7%) is used as the conservative design basis; tracking systems provide reserve margin.

### 2.2 Nameplate Solar Capacity Required

The fundamental relationship between continuous load, capacity factor, and required nameplate capacity:

```
Required Nameplate = Continuous Load ÷ Capacity Factor
Required Nameplate = 155 kW ÷ 0.247 = 627 kW
```

Rounding to the nearest standard string configuration multiple, the design basis is **630 kW nameplate** solar capacity. This is the installed DC nameplate figure (DC-rated power under Standard Test Conditions, STC).

The DC-to-AC inverter ratio (DC:AC ratio, or "inverter loading ratio") for solar installations typically runs 1.15–1.30. With a 630 kW DC array connected to, for example, 500 kW of inverter capacity (or DC-DC converter capacity), the array operates in clipping during peak irradiance hours — a deliberate design choice that maximizes energy harvest during the shoulder hours that matter most for the overnight charge cycle.

### 2.3 Panel Selection

Modern monocrystalline silicon panels are the standard for utility-scale and commercial installations. The 2024–2025 commodity market for bifacial monocrystalline PERC (Passivated Emitter and Rear Cell) and TOPCon (Tunnel Oxide Passivated Contact) panels provides panels in the 400–580W range at 21–24% module efficiency.

**Reference panel specification (commodity 2025 commercial):**

| Parameter | Value |
|-----------|-------|
| Module type | Bifacial monocrystalline TOPCon |
| Rated power (STC) | 500–540 W per panel |
| Module efficiency | 22–23% |
| Dimensions | ~2,278 × 1,134 mm (2.58 m²) |
| Voc (open circuit) | ~53–56 V |
| Vmp (max power) | ~44–47 V |
| Isc (short circuit) | ~14–15 A |
| Temperature coefficient (Pmax) | -0.30%/°C |
| Degradation rate | 0.5%/year (NREL data) |
| Warranty | 25 years linear output, 30 year product |

Using a 520W reference panel:

```
Panels required = 630,000 W ÷ 520 W = 1,212 panels
```

Round up to the nearest even string count. For a 1,500V DC bus with Vmp at operating temperature (assume 45°C ambient reduces Vmp by ~5%), each string of 28 panels provides approximately:

```
String voltage = 28 × 44.5V × (1 - 0.003 × (45-25)) = 28 × 41.8V ≈ 1,170V DC
```

This falls within the 1,500V DC system rating while staying below the maximum system voltage limit. With 28 panels per string, 1,212 panels form approximately 43 strings, organized across combiner boxes.

**Array configuration summary:**

| Parameter | Value |
|-----------|-------|
| Total panels | 1,232 (43 strings × 28 panels + 4 spare strings) |
| Strings per combiner box | 8–10 |
| Number of combiner boxes | 5 |
| DC system voltage | 1,500V nominal |
| Total DC nameplate | ~640 kW (STC) |
| Operating temperature derating | ~8% → 589 kW at 45°C ambient |

### 2.4 Array Area Calculation

Modern panel installations achieve approximately 5–6 W per square foot (54–65 W/m²) of ground coverage when spacing is included for maintenance access, inter-row shading avoidance, and drainage.

| Metric | Value |
|--------|-------|
| Active panel area (1,232 × 2.58 m²) | ~3,179 m² |
| Ground coverage ratio | 0.40–0.45 (fixed tilt) |
| Total ground area required | ~7,065–7,947 m² |
| **Total ground area (rounded)** | **~7,500 m² (~1.85 acres)** |
| With access roads and perimeter fence | ~10,000–12,000 m² (~2.5–3.0 acres) |
| In square footage (commonly cited) | ~107,000–130,000 sq ft |

The vision document figure of "120,000 sq ft (~2.75 acres)" is consistent with this calculation and represents a mid-range estimate appropriate for conceptual planning.

### 2.5 Mounting System

**Fixed tilt (design basis):**

Ground-mounted, fixed-tilt racking with tilt angle optimized for latitude. For Southwest US sites (latitudes 31–36°N), optimal tilt angle is approximately 20–30°. Tilt angle = latitude × 0.9 is a common rule of thumb; for Tucson (32.2°N) this gives approximately 29°.

Fixed-tilt racking systems (Unirac, Enerack, GameChange Solar) use driven helical or ballasted foundation systems. Driven steel posts avoid concrete and allow faster installation. The racking must be designed for local wind and snow loads per ASCE 7-22.

**Single-axis tracking (upgrade option):**

Single-axis horizontal tracking (east-west rotation) increases energy yield by 15–25% compared to fixed tilt at Southwest sites, according to NREL performance modeling. A 630 kW fixed array produces approximately 155 MWh/month at the reference site; a tracked array of equivalent nameplate produces approximately 185–194 MWh/month.

From the system sizing perspective, single-axis tracking either allows nameplate capacity reduction to ~500 kW for the same energy delivery, or — more valuably — increases the BESS charge rate during peak hours without increasing the array footprint. Single-axis tracking is recommended in the detailed design phase.

**Tracking economics note:** Single-axis tracker systems cost approximately $0.08–0.12/W more than fixed-tilt. For a 630 kW array this represents a $50,000–$75,000 premium against a ~20% energy yield gain. For an always-on critical load application, the yield gain is material and the premium is justified.

### 2.6 Degradation and System Life

NREL data establishes 0.5%/year as the median degradation rate for monocrystalline silicon panels. Over a 25-year design life:

| Year | Output Multiplier | Effective Capacity |
|------|------------------|--------------------|
| 1 | 1.000 | 640 kW |
| 5 | 0.975 | 624 kW |
| 10 | 0.950 | 608 kW |
| 15 | 0.925 | 592 kW |
| 20 | 0.900 | 576 kW |
| 25 | 0.875 | 560 kW |

At year 25, the 640 kW nameplate produces effectively 560 kW — still above the 627 kW nameplate required if degradation is ignored. The initial oversizing to 640 kW nameplate provides approximately 2% end-of-life margin. For a 25-year mission, a detailed design should consider sizing to 650–660 kW nameplate to maintain positive margin through the design life.

---

## 3. Battery Energy Storage System

### 3.1 Sizing Philosophy

The BESS serves three distinct functions in the Open Compute Node power architecture:

1. **Diurnal buffering:** Store daytime solar surplus to power overnight operation.
2. **Weather resilience:** Bridge multi-day cloudy periods without grid dependency.
3. **Transient response:** Absorb and supply short-duration power variations (GPU ramp events, cloud-induced solar dips).

Each function has different sizing implications. The sizing approach is to satisfy the most demanding constraint — diurnal buffering at the reference design basis — and verify the other constraints are met.

**Diurnal sizing basis (minimum viable):**

For a site with 5.9 kWh/m²/day irradiance and 155 kW continuous load:

```
Daily energy requirement: 155 kW × 24 hours = 3,720 kWh/day
Daily solar production (640 kW × 24.7% CF): 640 × 0.247 × 24 = 3,789 kWh/day
Net: approximately balanced on a daily average basis
```

The average is balanced by design — that is what the capacity factor sizing ensures. However, solar production is concentrated in daylight hours (approximately 6–8 peak hours per day). The facility runs 24 hours. The battery must absorb the daytime surplus and discharge it overnight.

```
Daylight hours (approximate, Southwest US): 6.5 effective peak hours
Daytime solar production: 640 kW × 6.5 hours = 4,160 kWh
Daytime load consumption: 155 kW × 6.5 hours = 1,008 kWh
Daytime surplus available for BESS charging: 4,160 - 1,008 = 3,152 kWh
Overnight load (17.5 hours): 155 kW × 17.5 = 2,713 kWh
Required usable BESS capacity: ~2,713 kWh
```

With 80% depth of discharge (DoD) limit for LFP cycle-life preservation:

```
Installed BESS capacity = 2,713 kWh ÷ 0.80 = 3,391 kWh
```

Rounded to standard containerized BESS units: **3,500 kWh installed capacity.**

**Weather resilience check:**

A two-day cloudy period reduces solar production to approximately 20% of normal (cloud attenuation):

```
Deficit per cloudy day: 3,720 - (3,789 × 0.20) = 3,720 - 758 = 2,962 kWh/day
Two-day deficit: 5,924 kWh
```

A 3,500 kWh BESS provides approximately 0.59 days of weather reserve at full load. For extended weather resilience, the design should either size the BESS to 6,000–7,500 kWh (two additional 20ft BESS containers) or incorporate load shedding during extended weather events — reducing compute load to inference-only (approximately 60 kW) extends BESS reserve to approximately 1.4 days.

**Design recommendation:** 3,500 kWh usable capacity in two 20ft ISO containers (described below) plus a load-management protocol for weather events exceeding 24 hours.

### 3.2 Chemistry Selection: LFP vs. NMC

The choice of LFP (Lithium Iron Phosphate, LiFePO4) over NMC (Lithium Nickel Manganese Cobalt Oxide) is not a performance choice — it is a safety and deployment-context choice.

| Parameter | LFP | NMC |
|-----------|-----|-----|
| Energy density (volumetric) | 250–350 Wh/L | 400–700 Wh/L |
| Energy density (gravimetric) | 120–180 Wh/kg | 150–220 Wh/kg |
| Cycle life at 80% DoD | 6,000–10,000 cycles | 1,000–2,000 cycles |
| Calendar life | 10–15 years | 5–10 years |
| Thermal runaway onset temp | ~270°C | ~150–200°C |
| Thermal runaway severity | Low — minimal gas release | High — violent, fire |
| Cobalt content | None | Significant |
| Cost per kWh (2025) | $90–120/kWh | $80–110/kWh |
| Operating temperature range | -20°C to +60°C | -20°C to +45°C |

For an unattended, remotely deployed container adjacent to a community facility, NMC thermal runaway risk is unacceptable. LFP's resistance to thermal runaway — the phosphate bond structure does not release oxygen when overheated, depriving potential fires of the oxidizer that makes NMC events catastrophic — makes it the only viable chemistry for this application.

The cycle life advantage is also decisive. At one full charge-discharge cycle per day, 6,000 LFP cycles = 16.4 years of operation before reaching 80% state-of-health. NMC at 1,500 cycles reaches end-of-life in 4.1 years. LFP matches the 25-year system design life horizon with a single mid-life battery replacement rather than requiring four NMC replacements.

### 3.3 Physical Configuration — BESS Containers

The weight and volume of a 3,500 kWh LFP system makes it incompatible with co-location inside the compute container. At approximately 5–6 kg/kWh for containerized LFP systems, a 3,500 kWh system weighs 17,500–21,000 kg — exceeding the compute container's remaining payload capacity (approximately 15,680 kg) when compute, cooling, and structural modifications are accounted for.

**Configuration: Two 20ft ISO BESS containers, placed adjacent to the compute container.**

| Parameter | Value |
|-----------|-------|
| BESS container count | 2 × 20ft ISO |
| Capacity per container | ~1,750 kWh usable |
| Installed capacity per container | ~2,190 kWh (@ 80% DoD) |
| Rack format inside each container | 1P2S or 2P2S cell module strings |
| Cell format | 280Ah prismatic LFP cells (standard form factor) |
| BMS type | Active balancing, distributed + master |
| Cooling type | Self-contained HVAC within each BESS container |
| Container weight (each, loaded) | ~18,000–22,000 kg |
| DC output voltage (each container) | 1,000–1,500V DC (configurable) |
| Maximum charge/discharge rate | C/2 = 875–1,100 kW total system |

**Charge/discharge rate verification:**

At 155 kW continuous discharge and 3,500 kWh installed capacity, the C-rate is:
```
C-rate = 155 kW ÷ 3,500 kWh = 0.044C (very gentle discharge)
```

LFP cells are rated for continuous 1C discharge and peak 3–5C discharge. The 0.044C operating C-rate is far below stress conditions, contributing to the excellent cycle life at this application.

### 3.4 Battery Management System Requirements

The BMS is the safety-critical intelligence layer of the BESS. Each 20ft BESS container requires an integrated BMS with the following capabilities:

**Cell-level monitoring:**
- Individual cell voltage monitoring (±1 mV resolution)
- Individual cell temperature monitoring (±0.5°C resolution)
- Cell string current monitoring
- State of Charge (SoC) estimation (±2% accuracy)
- State of Health (SoH) tracking (capacity fade monitoring over life)
- State of Power (SoP) — available power at current temperature and SoC

**Active balancing:**
Active cell balancing (vs. passive/dissipative balancing) is required for systems operating over thousands of cycles. Passive balancing dissipates excess charge as heat, degrading cells over time. Active balancing transfers charge between cells, maintaining string uniformity without thermal stress.

**Thermal management:**
- HVAC system within BESS container maintains cell temperature 20–30°C
- High-temperature alarm: >45°C → reduce charge/discharge rate
- High-temperature shutdown: >55°C → disconnect
- Low-temperature protection: <0°C → disable charging (LFP cannot accept charge below freezing)
- Pre-conditioning: heat cells before allowing high-rate discharge at low ambient temperatures

**Protection systems:**
- Over-voltage protection (cell and pack level)
- Under-voltage protection
- Over-current protection (charge and discharge)
- Short-circuit protection (< 1ms response)
- Ground fault detection (ISO-SYS for ungrounded DC systems)
- Arc fault detection

**Communications:**
- Modbus TCP / CANbus to site Energy Management System (EMS)
- MQTT telemetry to cloud monitoring
- Local HMI display with SoC, alarm status, key parameters
- Remote firmware update capability

### 3.5 Round-Trip Efficiency

LFP round-trip efficiency (DC-DC, from storage to delivery) is 92–95% for well-designed systems. Sources of loss include:

| Loss Mechanism | Typical Value |
|---------------|--------------|
| Cell electrochemical resistance | 1–2% |
| BMS electronics overhead | 0.5% |
| DC-DC converter losses (bidirectional) | 2–3% |
| Thermal management overhead | 0.5–1% |
| **Total round-trip loss** | **4–7%** |
| **Round-trip efficiency** | **93–96%** |

For energy balance calculations, 93% round-trip efficiency is used. This means that for every 1,000 kWh stored, 930 kWh is recovered. The 7% loss is converted to heat within the BESS container, managed by the container HVAC.

### 3.6 BESS Parameters Summary

These ten parameters align with the key framework for utility-scale BESS evaluation (referenced from the BESS research literature, Video #27 in the research queue):

| Parameter | Value | Notes |
|-----------|-------|-------|
| 1. Capacity (usable) | 3,500 kWh | 80% DoD from 4,375 kWh installed |
| 2. Power rating | 875 kW continuous | C/4 rate, well within LFP rating |
| 3. Chemistry | LFP (LiFePO4) | Thermal safety for unattended deployment |
| 4. Cycle life | 6,000+ cycles at 80% DoD | ~16 years at 1 cycle/day |
| 5. Round-trip efficiency | 93–95% | DC-to-DC |
| 6. DoD limit | 80% | Preserves cycle life |
| 7. Calendar life | 15+ years | First replacement ~year 16 |
| 8. Operating temperature | 20–30°C (managed) | BESS HVAC maintains this range |
| 9. Response time | < 100ms | Full power response |
| 10. Safety standard | NFPA 855 compliant | UL 9540A fire test required |

---

## 4. Wind Supplementation

### 4.1 Role in the Hybrid System

Wind generation is the third leg of the renewable energy triad — solar, storage, and wind. Its primary value is temporal complementarity with solar: wind often blows at night, during cloudy weather, and during winter months when solar production is reduced. For a system with a 24/7 compute load and no tolerance for outages, wind is the hedge against extended low-solar events.

Wind is not the primary generation source. At the reference Southwest US sites, solar provides approximately 75–80% of annual energy production. Wind provides 15–20%, and BESS bridges the gaps.

### 4.2 Turbine Class Selection

For a single-node deployment, the relevant turbine class is 50–100 kW nameplate. This is the small-to-medium commercial turbine range, above residential/small commercial (< 10 kW) and below utility-scale (≥ 500 kW).

**Reference turbine: 75 kW class commercial horizontal-axis wind turbine (HAWT)**

| Parameter | Value |
|-----------|-------|
| Rated power | 75 kW |
| Rotor diameter | 24–32 m |
| Hub height | 30–50 m |
| Cut-in wind speed | 3–4 m/s |
| Rated wind speed | 11–13 m/s |
| Cut-out wind speed | 25 m/s |
| Capacity factor (Southwest US) | 20–35% |
| Annual energy production (Southwest US) | 131–230 MWh at 20–35% CF |
| Expected contribution | ~15–20% of annual facility energy |

Commercial turbines in this class (Enercon E-33, Northern Power NPS 60c, Goldwind GW50/750) are available with grid-forming inverters or rectifier/DC-bus interfaces suitable for direct DC bus integration.

### 4.3 Capacity Factor and Siting

Southwest US wind capacity factors vary significantly by site. Open plains and ridge-top locations achieve 30–35%; sheltered desert valleys may only achieve 20–25%. The NREL Wind Resource Database (WRD) and the Wind Prospector tool provide site-specific data at 100m hub heights.

| Southwest US Wind Region | Typical CF (50m hub) | CF (100m hub) |
|-------------------------|---------------------|--------------|
| Texas Panhandle | 35–40% | 40–45% |
| New Mexico high plains | 25–35% | 30–38% |
| Arizona desert valleys | 18–25% | 22–28% |
| Arizona/NM border ridges | 28–35% | 32–38% |

The reference design assumes 25% capacity factor as a conservative estimate across the target corridor. At 75 kW nameplate × 25% CF × 8,760 hours/year = 164 MWh/year of wind generation.

This wind production represents approximately 164 MWh ÷ (155 kW × 8,760 h) = 12% of annual facility energy demand — a meaningful but not dominant contribution. The primary value is reducing BESS cycling frequency during extended low-solar periods, which directly extends battery life.

### 4.4 Mounting and Installation Considerations

**Separate tower — not on or adjacent to the compute container.** Wind turbines at this scale induce significant vibration through the tower structure. Transmitting this vibration to the compute container would create chronic mechanical stress on GPU cold-plate connections, PCB solder joints, and hard-mounted hardware. The tower foundation must be separated by at least 1.5× the hub height (minimum 45–75 m from the container) to prevent both vibration transmission and blade-strike hazard.

**Foundation:** Turbines in the 75 kW class require engineered foundation designs specific to soil conditions. Typical approach is a reinforced concrete spread footing or drilled pier system. Foundation design is site-specific and requires geotechnical investigation.

**Noise considerations:** At 50m hub height, a 75 kW turbine typically produces 95–105 dB(A) at source, attenuating to approximately 45–55 dB(A) at 200m distance. For community deployments adjacent to residential areas, setback requirements and noise ordinances must be verified with the local authority having jurisdiction (AHJ). Typical setback requirements range from 500–1,000 m from occupied structures. Community consultation on turbine placement is essential.

**Connection to DC bus:** The turbine's generator output is AC (3-phase). Integration with the DC bus requires a dedicated AC-to-DC rectifier and DC-DC converter rated for the turbine's output range. Alternatively, some turbine manufacturers offer DC output options for off-grid integration. The turbine must include a grid-forming or grid-following inverter stage capable of operating islanded (without utility grid reference) or a passive rectifier with DC-DC control.

---

## 5. Power Distribution Architecture

### 5.1 DC Bus Architecture — Why DC for This Application

Conventional commercial and industrial electrical distribution is AC (120V/240V single-phase, 208V/240V/480V three-phase in the US). Data center power has historically converted AC utility power to DC internally at the rack PSU level. The Open Compute Node inverts this: it generates DC (solar panels, battery), consumes DC (GPU racks), and chooses to distribute at DC rather than converting to AC and back again.

**Arguments for all-DC architecture:**

1. **Conversion efficiency:** Each AC-DC conversion loses 3–6% of energy to heat. A traditional path (solar → inverter → AC bus → UPS → PDU → rack PSU) involves 3–4 conversions. The all-DC path (solar → MPPT → DC bus → DC-DC converter → rack bus bar) involves 2 conversions. At 155 kW continuous, avoiding two conversion stages saves approximately 9–12 kW of loss — equivalent to powering the entire facility overhead load.

2. **Battery integration:** Batteries are inherently DC. In an AC architecture, the battery requires a bidirectional inverter to connect to the AC bus. In a DC architecture, the battery connects to the DC bus through a bidirectional DC-DC converter, which is simpler, lighter, and more efficient.

3. **Solar native output:** Solar panels produce DC. MPPT charge controllers are DC-in, DC-out. Converting to AC only to convert back to DC is wasteful by definition.

4. **GPU rack compatibility:** The GB200 NVL72 accepts 48–51V DC bus bar input directly. The racks contain their own internal DC-DC converters for the lower voltages required by GPUs and CPUs. The rack is designed for DC distribution, not AC.

5. **Fault isolation:** DC architectures at 1,500V require different but manageable protection strategies. At 48V distribution within the container, arc energy is dramatically reduced compared to 480V AC, improving safety for maintenance personnel.

**Industry precedent:** The Open Compute Project (Meta, Microsoft, Google initiative) standardized on 48V DC distribution for hyperscale data centers. The DOE's Lawrence Berkeley National Laboratory has published analysis showing 10–15% efficiency gains for DC-coupled data center microgrids vs. traditional AC architectures.

### 5.2 Voltage Architecture

The system operates at three distinct DC voltage levels:

| Level | Voltage | Function |
|-------|---------|---------|
| Generation/transmission | 1,500V DC | Solar combiner output to BESS and converter input |
| Intermediate storage | 1,000–1,500V DC | BESS output (configurable string voltage) |
| Load distribution | 48–51V DC | Rack bus bar, aux PDU |

**1,500V DC reasoning:** 1,500V is the current US code maximum for utility-scale PV systems (NEC Article 690 was amended to allow 1,500V in 2014). At 1,500V, the same power is transmitted at lower current, allowing smaller conductor sizes over the distribution distance between the solar array (~100m from compute container) and the BESS/converter. For a 640 kW array at 1,500V, peak current is approximately 427A — manageable with 500–600A rated combiner equipment.

**48–51V reasoning:** The GB200 NVL72 rack PSU input specification is 48–51V DC. This is the Open Rack v3 standard bus voltage. At 120 kW on a 48V bus, the current is 2,500A — high but standard for copper bus bar systems in this application. Bus bar cross-sections of 100×10mm copper are typical for this current density.

### 5.3 Power Flow Single-Line Description

The following describes the complete power path from photon to GPU:

**Generation layer (outdoors):**

Solar panels are organized into strings of 28 panels each, with string current approximately 14–15A at operating conditions. Each string connects to a combiner box located in the solar array. Combiner boxes aggregate 8–10 strings per box, provide string-level overcurrent protection (fuses per NEC Article 690.9) and string monitoring, and output a single DC circuit at 1,500V nominal to the DC distribution cabling.

Wind turbine output (3-phase AC or DC depending on turbine type) runs to the turbine interface cabinet, which includes rectifier and DC-DC converter stages to present a 1,500V DC output to the DC bus.

**BESS layer (BESS containers, outdoor adjacent):**

Both BESS containers present a 1,000–1,500V DC interface to the site DC bus through bidirectional DC-DC converters and DC disconnect switches. Each BESS container includes a 1,500V-rated DC disconnect accessible from the container exterior per NEC 690.17 requirements (adapted for Article 706 ESS context). The EMS coordinates charge/discharge between the two containers to equalize state-of-charge.

**Interconnection and protection layer (exterior/underground):**

Underground conduit (PVC Schedule 80 or steel) runs from the solar combiner outputs, turbine interface, and BESS containers to the main DC switchgear cabinet, which is wall-mounted on the exterior of the compute container or in a small equipment enclosure adjacent to it. This cabinet contains:
- Main DC disconnect (manual, lockable, accessible without tools per NEC 690.13 / 706.15)
- Main overcurrent protective device (DC-rated fuse or circuit breaker)
- Surge protective device (SPD, ANSI/IEEE C62.41 rated for 1,500V DC)
- Revenue-grade energy meter (bidirectional, kWh and kW)
- Ground fault detector (for ungrounded 1,500V DC system)

**Conversion layer (inside compute container, power zone):**

Inside the compute container, a DC-DC converter (or bank of converters for N+1 redundancy) steps the 1,500V DC distribution voltage down to 48–51V DC at high current. For 155 kW at 98% converter efficiency, the converter handles approximately 158 kW input. Modern DC-DC converters (TDK Lambda, ABB, Vicor) in the 50–100 kW unit size achieve 97–98% efficiency. Two 80 kW converters in a 2×N+1 configuration provide redundancy — loss of one converter reduces capacity to 80 kW, triggering load management to inference profile.

**Distribution layer (inside compute container):**

The 48V DC bus runs via copper bus bar from the DC-DC converters to a 48V rack PDU (rPDU) system. The bus bar is sized for 2,500A at 48V (120 kW) plus 20% margin = 3,000A rated bus bar. Bus bar is bare copper, silver-plated at connection points to prevent oxidation. Bus bar supports, cable management, and isolation are per NEC Article 310 and Article 480 requirements.

Auxiliary loads (cooling, filtration, monitoring) receive 48V from the bus through appropriately rated branch circuits and DC-rated breakers.

**Rack interface:**

The GB200 NVL72 rack connects to the 48V bus bar directly at the rack's power shelf input terminals. The rack's internal power shelves contain the final DC-DC conversion stages to operating voltages.

```
SOLAR ARRAY (640 kW, 1,500V DC)
        |
        | [String fuses + monitoring]
        |
   COMBINER BOXES (5×)
        |
        | [1,500V DC underground cable]
        |
   WIND TURBINE (75 kW)
        | [Rectifier + DC-DC]
        |
   ─────┴──────────────────────── SITE DC BUS (1,500V) ──────┐
                                                              │
                                                     BESS CONTAINERS (2×)
                                                     [3,500 kWh LFP total]
                                                     [Bidirectional DC-DC]
        |
   MAIN DC SWITCHGEAR (1,500V)
   [Disconnect + OCPD + SPD + Meter + GFD]
        |
   DC-DC CONVERTER BANK (2× 80kW, N+1)
   [1,500V → 48V, 97-98% efficiency]
        |
   48V DC BUS BAR (3,000A rated)
        |
   ─────┬──────────────────────────────────
        │                                  │
   RACK PDU                           AUX PDU
   (120 kW)                           (35 kW)
        │                                  │
   GB200 NVL72 RACK              Cooling, filtration,
   (120 kW, 48V input)           monitoring, lighting
```

### 5.4 Grounding System

NEC Article 250 governs grounding and bonding. For a DC PV system, the grounding strategy is a critical design decision affecting both safety and ground fault detection capability.

**System grounding approach:** The 1,500V DC generation/distribution system is operated as an ungrounded (floating) DC system with a ground fault detector. This is permitted by NEC 690.41 for ungrounded PV systems. The ungrounded approach prevents a first fault from creating a shock hazard (no complete circuit path to earth) while the ground fault detector alerts operators to the first fault, preventing the second fault from creating a dangerous condition.

**Grounding electrode system:** Per NEC 250.52, a grounding electrode system consisting of driven ground rods (minimum 5/8" × 8 ft copper-clad steel) at each major equipment location, interconnected with a grounding electrode conductor, provides equipment grounding reference. A single-point ground (SPG) at the main DC switchgear cabinet prevents ground loops from inducing noise in the low-voltage monitoring circuits.

**Equipment grounding:** All metal enclosures, conduit, racks, containers, and structural steel are bonded together with an equipment grounding conductor (EGC) sized per NEC 250.122 based on the overcurrent protective device rating. The compute container structure, BESS containers, and solar array mounting structure are all bonded to the equipment grounding system.

**Lightning protection:** A lightning protection system (LPS) per NFPA 780 is recommended for ground-mounted solar arrays and the wind turbine tower. The LPS provides a dedicated low-impedance path for lightning current to earth, protecting the array wiring, inverter/converter equipment, and downstream electronics from transient overvoltage. SPD devices at the combiner boxes and main DC switchgear provide additional transient protection.

### 5.5 Overcurrent Protection

NEC Article 240 and Article 690 govern overcurrent protection for DC PV circuits. A coordination study must be performed to ensure that protective devices clear faults progressively from the load side (smallest device) to the source side (largest device) without selective coordination failures.

**Protection device hierarchy:**

| Level | Device | Rating Basis | NEC Reference |
|-------|--------|-------------|---------------|
| Individual PV string | 15–20A DC fuse (in combiner box) | 156% × Isc per NEC 690.9 | Art. 690.9 |
| Combiner box output | 200–250A DC breaker or fuse | Sum of protected strings | Art. 690.9 |
| Main DC disconnect | 500–600A DC OCPD | Array maximum short-circuit current | Art. 690.13 |
| BESS output | 400–500A DC OCPD | BESS maximum discharge current | Art. 706.20 |
| DC-DC converter input | 300–400A DC OCPD | Converter rated input current | Art. 240 |
| 48V distribution bus | 3,000A DC bus fuse | Full bus current | Art. 240 |
| Branch circuits (48V) | 20–200A DC breakers | Per-circuit load current × 125% | Art. 240.4 |

**DC-rated equipment requirement:** All breakers, fuses, and disconnect switches in the DC circuits must be rated for DC voltage and current. AC-rated protective devices do not interrupt DC arc current reliably — DC arcs are continuous (AC arcs self-extinguish at current zero-crossings). DC-rated equipment uses magnetic arc blow-out, arc chutes, or other DC-specific arc suppression mechanisms. Using AC-rated devices in DC circuits is a serious safety and code violation.

---

## 6. Grid Interconnection

### 6.1 Configuration Options

The Open Compute Node is designed as a primary off-grid system. However, the presence of grid power at many rail-adjacent sites creates an opportunity for hybrid configurations. Three configurations are possible:

**Configuration A — Fully off-grid (reference design):**
No utility connection. Solar + wind + BESS only. Highest operational independence, lowest regulatory complexity. A generator connection provision (manual transfer switch for maintenance) may be included without creating a grid-tied configuration.

**Configuration B — Hybrid (grid as backup):**
Utility connection as backup power source during extended low-generation events. Transfer switch (automatic or manual) selects between renewable DC bus and utility grid connection. When utility connection is present, the DC-DC converter block is replaced by a bidirectional inverter/charger that can charge BESS from grid or export excess solar to grid.

**Configuration C — Grid-tied with net metering:**
Full grid interconnection under IEEE 1547-2018. Permits export of excess solar and wind generation to the utility during high-generation periods, with net metering credit applied to utility charges during low-generation periods. This configuration maximizes energy value but requires utility interconnection study, protective relay coordination, anti-islanding protection, and utility agreement.

### 6.2 Net Metering Potential

For sites along the rail corridor with grid access, net metering represents a meaningful economic benefit. During training profile operation (155 kW load, 640 kW solar peak), excess solar production during midday could reach 480 kW after accounting for load and BESS charging. Over a full year at the reference site, excess solar exportable to grid might total 300–400 MWh/year.

At a hypothetical net metering rate of $0.08–0.10/kWh, this represents $24,000–$40,000/year in energy credits — a material contribution to operating economics. However, net metering policy varies by state and utility, and many states have implemented net metering caps or reduced rates for commercial-scale systems. This requires site-specific evaluation.

### 6.3 IEEE 1547-2018 Requirements

If grid interconnection is pursued, IEEE 1547-2018 ("Standard for Interconnection and Interoperability of Distributed Energy Resources with Associated Electric Power Systems Interfaces") establishes the technical requirements. Key requirements include:

- Anti-islanding protection: the system must detect loss of grid and disconnect within 2 seconds to prevent energizing grid lines with workers assuming them de-energized
- Voltage and frequency ride-through requirements (the system must stay connected through defined grid disturbances)
- Reactive power support capability
- Power quality — harmonic distortion limits (< 5% THD total, < 3% any single harmonic)
- Interconnection interface must include accessible disconnect visible and lockable from the utility meter location

IEEE 1547-2018 is referenced by most US state interconnection tariffs and is required for utility approval of grid-tied systems above a threshold size (varies by utility, typically 10 kW–1 MW for distribution-level interconnection).

### 6.4 Transfer Switch Specification

For Configuration B (grid backup), an automatic transfer switch (ATS) or static transfer switch (STS) provides seamless transition between renewable DC bus and grid backup:

- Transfer time: < 4ms for static transfer switch (within UPS ride-through capability)
- Rating: sized for maximum facility load (200–250 kVA for single-rack reference)
- Compliance: UL 1008 (transfer switch equipment)
- Controls: integrated with EMS via Modbus TCP

---

## 7. Power Quality and Monitoring

### 7.1 UPS Function — Battery as Ride-Through

In a traditional data center, a dedicated UPS (Uninterruptible Power Supply) provides milliseconds-to-seconds of ride-through during power interruptions, protecting compute equipment from abrupt power loss that causes hardware damage and data corruption. In the Open Compute Node, the BESS performs this function continuously.

The BESS is always connected to the DC bus. During a sudden drop in solar generation (cloud edge transit) or loss of wind, the BESS automatically responds within the BMS response time (< 100ms) — faster than most UPS systems. The DC-DC converter, receiving stable DC bus voltage from the BESS, presents uninterrupted power to the 48V bus bar. From the compute rack's perspective, there is no disturbance.

This eliminates the dedicated UPS as a discrete system component, reducing capital cost and one conversion stage loss.

**Ride-through capability:** With 3,500 kWh BESS at 93% round-trip efficiency and 155 kW load, the theoretical ride-through duration is:

```
Ride-through = (3,500 kWh × 0.93 × 0.80 DoD) ÷ 155 kW = 16.7 hours
```

This far exceeds the 4-hour UPS requirement common in Tier III/IV data center specifications.

### 7.2 Voltage Regulation

The 48V DC bus must maintain voltage within ±2% (47.0–49.0V) at the rack PDU input terminals to keep the GB200 rack PSUs within their specified input range. Voltage regulation is achieved through:

1. **DC-DC converter output regulation:** Modern high-frequency DC-DC converters maintain output voltage within ±0.5% against load transients. Response bandwidth is typically 10–100 kHz.

2. **Bus bar voltage drop:** At 2,500A through a 100×10mm copper bus bar of 5m length, resistive drop is approximately 0.3–0.5V (< 1%). Bus bar must be sized to keep total drop under 0.5V from converter output to furthest rack PDU connection point.

3. **Cable sizing:** Branch circuit cables from bus bar to each rack PDU must be sized to maintain voltage at the PDU within ±1% to leave margin for converter regulation tolerance. For a 120 kW rack on a 48V system, branch circuit current is approximately 2,500A — bus bar connection directly to the rack is standard.

### 7.3 Power Factor and Harmonics

The all-DC distribution system does not have power factor concerns in the traditional sense — power factor is an AC phenomenon. However, DC-DC converters with high-frequency switching create harmonic currents on the input (1,500V DC) side that can interfere with MPPT algorithms in solar charge controllers. Conducted EMI filters at converter inputs limit this interference.

On the AC side of the wind turbine interface, the turbine inverter's output harmonics must comply with IEEE 519-2022 (Recommended Practice and Requirements for Harmonic Control in Electric Power Systems). IEEE 519 limits total harmonic distortion (THD) at the point of common coupling.

### 7.4 PUE and Efficiency Metrics

Power Usage Effectiveness (PUE) is the data center efficiency metric defined as:

```
PUE = Total Facility Power ÷ IT Load Power
```

For the single-rack reference design:

```
PUE = 155 kW ÷ 120 kW = 1.29
```

This is better than the US data center average (approximately 1.55 per LBNL 2023 data) but is a result of liquid cooling removing a significant air-handling load. The theoretical PUE minimum for this design would approach 1.06–1.10 with all losses accounted (cooling pumps are unavoidable, monitoring is essential).

**NREL target for this design: PUE < 1.3.** Exceeding this target (lower PUE) is achievable through:
- Variable-speed CDU pump drives responding to actual heat load
- LED lighting on occupancy sensors (reduces average lighting load)
- Eliminating AC conversion stages (achieved by all-DC architecture)
- BESS efficiency improvements as chemistry matures

### 7.5 Per-Rack Metering and DCIM Integration

**Per-circuit metering at the 48V bus bar:**

Each major branch circuit — rack PDU feed, CDU feed, auxiliary PDU feed — receives a DC-rated revenue-grade energy meter monitoring:
- Voltage (±0.5%)
- Current (±0.5%)
- Power (kW)
- Energy (kWh)
- Minimum/maximum and average values over configurable intervals

**DCIM (Data Center Infrastructure Management) integration:**

A DCIM system aggregates power data from all metering points, environmental sensors (temperature, humidity, leak detection), and network monitoring. For the Open Compute Node, the DCIM function is implemented as a lightweight software stack on the management server within the compute container. The management server also communicates with:
- BMS in both BESS containers (Modbus TCP)
- Solar array monitoring system (Modbus TCP or SunSpec protocol)
- Wind turbine SCADA (Modbus TCP)
- EMS (Energy Management System) for coordinated charge/discharge control
- Remote monitoring via MQTT to cloud dashboard

DCIM data is retained on-site for 90 days and archived to the cloud for the facility lifetime. Remote monitoring enables predictive maintenance, anomaly detection, and capacity planning without requiring on-site personnel.

---

## 8. Safety and Codes

### 8.1 Governing Codes — Reference Matrix

| Code/Standard | Scope | Article/Section |
|--------------|-------|----------------|
| NEC 2023 (NFPA 70) | All electrical installations | Multiple |
| NEC Article 690 | Solar PV systems | Solar array, string wiring, combiner boxes |
| NEC Article 705 | Interconnected power production | Wind turbine, grid-tie if applicable |
| NEC Article 706 | Energy storage systems (ESS) | BESS containers and wiring |
| NEC Article 480 | Battery systems | Cell-level, module-level requirements |
| NEC Article 250 | Grounding and bonding | All equipment |
| NEC Article 110.26 | Working clearances | Electrical equipment access |
| NEC Article 310 | Conductors for general wiring | Wire sizing and ampacity |
| NEC Article 240 | Overcurrent protection | All circuits |
| NFPA 855 | ESS installation standard | BESS container placement and separation |
| NFPA 70E | Electrical safety in the workplace | Arc flash analysis |
| IEEE 1547-2018 | Grid interconnection | If grid-tied (Configuration B or C) |
| UL 9540A | ESS fire test | BESS modules — required for NFPA 855 |
| ANSI/IEEE C62.41 | Surge protection | SPD specifications |
| ASCE 7-22 | Structural loads | Wind, snow, seismic for mounting structures |

### 8.2 NEC Article 690 — Solar PV Systems

Article 690 covers PV source circuits, PV output circuits, inverter output circuits, and associated equipment. Key requirements for the Open Compute Node:

**690.7 — Maximum voltage:** Systems over 1,000V (including 1,500V systems) require equipment rated for the maximum system voltage. All combiners, cables, fuses, and disconnect switches in the 1,500V array must be 1,500V DC rated. PV wire (USE-2 or PV Wire, XHHW-2) must be rated for 1,500V and 90°C.

**690.9 — Overcurrent protection:** Each PV source circuit (string) requires overcurrent protection if the current exceeds the conductor ampacity or module series fuse rating. String fuses in combiner boxes must be sized at 156% × Isc per 690.9(B).

**690.11 — Arc-fault circuit protection:** PV systems > 80V must include arc-fault circuit protection (AFCI) compliant with UL 1699B. AFCI detectors in combiner boxes or MPPT controllers monitor for the DC arc signature that indicates insulation failure or loose connections in the PV string wiring.

**690.12 — Rapid shutdown:** For building-integrated systems, rapid shutdown is required to reduce string voltage to < 80V within 30 seconds for firefighter safety. For a ground-mounted array at distance from the compute container, the ground-mount exception may apply (shutdown required only at array boundary), but this requires AHJ confirmation.

**690.13 — PV disconnect:** A disconnecting means for the PV system, accessible from the utility meter location (or exterior access point), must be provided to allow utility or emergency personnel to disconnect the PV source from the system.

### 8.3 NEC Article 706 — Energy Storage Systems

Article 706 was added in NEC 2017 and significantly updated in NEC 2020 and 2023 to address the proliferation of large-scale BESS. Key requirements:

**706.10 — ESS installation:** BESS containers must be installed per NFPA 855 separation distances. For outdoor BESS containers adjacent to other structures, minimum separation is 3 feet (0.9m) between containers and between containers and the compute container. For BESS systems > 20 kWh, NFPA 855 requires fire detection and suppression within the BESS enclosure.

**706.15 — Disconnecting means:** ESS disconnecting means must be accessible, lockable, and — for systems > 1,500 Wh — must be located to allow safe disconnection in emergency conditions. Exterior-accessible disconnect is required.

**706.20 — Overcurrent protection:** ESS output circuits must include overcurrent protection. For DC systems, DC-rated fuses or circuit breakers are required.

**706.30 — Signs and markings:** BESS containers must be marked with: system voltage, maximum current, chemistry type (LFP), and emergency contact information. Warning label: "ENERGY STORAGE SYSTEM — HIGH VOLTAGE DC — DANGER ARC FLASH HAZARD."

### 8.4 NEC Article 480 — Battery Systems

Article 480 applies to stationary battery installations. For LFP cells:

- Battery rooms/enclosures must be ventilated per the hydrogen gas generation requirements (LFP generates less hydrogen than lead-acid but ventilation is still required)
- Eyewash stations and personal protective equipment requirements apply during maintenance activities
- Battery terminals must be guarded against accidental contact
- Spill containment for battery electrolyte (LFP electrolyte is lithium hexafluorophosphate in organic solvent — requires containment even though thermal stability is high)

### 8.5 Arc Flash Hazard Analysis

Arc flash is a serious risk in any medium-to-high voltage electrical system. Arc flash occurs when an electrical fault creates a sustained plasma arc that releases enormous energy as heat, light, and pressure. Arc flash injuries are severe: workers within the incident energy boundary without proper PPE face life-threatening burns.

**Arc flash in the 1,500V DC system:**

DC arcs are particularly dangerous because they do not self-extinguish at a current zero-crossing (which occurs 120 times per second in AC circuits). Once a DC arc is established, it sustains until the circuit breaker or fuse clears the fault. The clearing time of the protective device, combined with the fault current magnitude, determines the incident energy at a given working distance.

An arc flash hazard analysis (NFPA 70E, IEEE 1584-2018 for AC; IEC 61641 for DC) must be performed by a qualified electrical engineer before energizing any portion of the 1,500V DC system. The analysis calculates:
- Arcing fault current at each busbar and protective device
- Incident energy (cal/cm²) at defined working distances
- Arc flash boundary (distance at which incident energy = 1.2 cal/cm², threshold for a second-degree burn with momentary exposure)
- Required PPE arc rating (cal/cm²) for working within the arc flash boundary

**Typical PPE requirements for 1,500V DC systems:**

Work within the arc flash boundary requires PPE rated equal to or greater than the calculated incident energy at that location. For 1,500V DC systems with clearing times in the 0.1–0.5s range, incident energy can range from Category 2 (8 cal/cm², 1m working distance) to Category 4 (40+ cal/cm² if clearing times are long). PPE requirements escalate from flash-resistant (FR) clothing and face shield at Category 1/2 to full arc flash suit at Category 3/4.

**Mitigation strategies:**
- Zone-selective interlocking between upstream and downstream breakers reduces clearing time and incident energy
- Current-limiting fuses clear in < 8ms at fault currents above their threshold, dramatically reducing incident energy
- Working on energized equipment only when absolutely necessary (NFPA 70E Hierarchy of Risk Controls)
- Lockout/tagout procedures before any work that allows de-energization

### 8.6 Working Clearance Requirements — NEC 110.26

NEC 110.26 establishes minimum working clearances in front of electrical equipment based on voltage level. All electrical panels, disconnect switches, and switchgear in the compute container and adjacent equipment enclosures must meet these clearances:

| Voltage | Condition | Minimum Clearance |
|---------|-----------|------------------|
| 0–150V | Ground or grounded on one side | 3 feet (914 mm) |
| 151–600V | Ground or grounded on one side | 3.5 feet (1,067 mm) |
| 600–2,500V | Exposed live parts on both sides | 6 feet (1,829 mm) |
| 48V DC bus bar | Accessible in container | 3 feet minimum |
| 1,500V DC switchgear | Exterior enclosure | 6 feet minimum |

The compute container internal layout — specifically the power zone (2.5m zone at the non-door end) — must provide at least 3 feet (914 mm) of working clearance in front of all panel boards, PDUs, and DC-DC converters. With 2.35m internal container width and equipment mounted on one wall, this is achievable but must be verified in detailed layout design.

### 8.7 Lockout/Tagout Procedures

OSHA 29 CFR 1910.147 (Control of Hazardous Energy) governs LOTO for electrical, mechanical, and stored energy hazards. For the Open Compute Node power system, LOTO is required before:

- Any work on PV string circuits or combiner box wiring
- Any work on BESS containers or interconnecting cables
- Any work on the DC-DC converter or main DC switchgear
- Any work on the 48V bus bar or rack PDU connections

LOTO procedure must account for the multiple stored energy sources in this system — solar panels continue generating DC voltage during daylight hours even when disconnect switches are open. A safe work procedure must address:

1. Operate main DC disconnect (isolates BESS and converters from 1,500V bus)
2. Shade or cover solar panels (or accept that PV string circuits remain energized up to string open-circuit voltage)
3. Discharge BESS to safe voltage level per BESS manufacturer procedure
4. Apply lockout devices on all disconnect switches and tag with worker name and date
5. Verify absence of voltage with a properly rated DC voltmeter before touching any conductors

**Warning:** PV panels cannot be fully de-energized in daylight. Open-circuit voltage remains present at all PV string terminals even when disconnect switches are open. Any work on PV wiring in daylight requires hot-work PPE (appropriate arc flash rated) or physical covering of the panels.

### 8.8 NFPA 855 — BESS Safety

NFPA 855 (Standard for the Installation of Stationary Energy Storage Systems) is the primary safety standard for large BESS installations. For the Open Compute Node, key requirements include:

**Separation distances:** BESS containers must maintain minimum separation from the compute container and from each other. For systems > 600 kWh, NFPA 855 Section 15.3 requires:
- 3 feet minimum between BESS and adjacent structures (may be increased by AHJ)
- BESS containers in close proximity to the compute container may require an intervening fire wall or additional separation to meet AHJ requirements

**Fire detection and suppression within BESS:** For systems > 50 kWh, NFPA 855 requires listed fire detection and automatic suppression inside the BESS enclosure. Each 20ft BESS container must include:
- Smoke/heat detectors per NFPA 72
- Automatic suppression system (dry chemical, FM-200, or water mist per UL 9540A test results for the specific BESS product)
- Ventilation for off-gas events (LFP off-gassing is less severe than NMC but must be accommodated)

**UL 9540A testing:** NFPA 855 requires that ESS installations use equipment tested per UL 9540A (Test Method for Evaluating Thermal Runaway Fire Propagation in Battery Energy Storage Systems). This test evaluates whether a thermal runaway event in one cell can propagate to adjacent cells/modules. LFP chemistry typically passes UL 9540A at module or rack level without propagation suppression, which is a significant safety advantage over NMC.

---

## 9. System Integration and Performance Summary

### 9.1 System Energy Balance

The annual energy balance for the single-rack reference design at the Tucson, AZ reference site:

| Energy Flow | Annual (MWh) | Notes |
|-------------|-------------|-------|
| Solar generation (640 kW × 24.7% × 8,760h) | 1,384 | STC nameplate × CF |
| Wind generation (75 kW × 25% × 8,760h) | 164 | Estimated CF |
| Total renewable generation | 1,548 | |
| BESS round-trip loss (7% of cycled energy) | -73 | ~1,045 MWh cycled × 7% |
| Distribution losses (7% of delivered energy) | -95 | |
| Net delivered energy | 1,380 | |
| Facility demand (155 kW × 8,760h) | 1,357 | |
| **Net surplus** | **+23 MWh/year** | **+1.7% above demand** |

The 1.7% net surplus confirms the solar sizing is correct but tight. The system operates at near-zero margin on an annual basis, which is appropriate for an off-grid design: significant surplus would indicate oversizing (and wasted capital cost), while significant deficit would indicate insufficient renewable generation.

On a monthly basis, the balance varies significantly:

| Month | Solar CF (approx) | BESS State | Notes |
|-------|-------------------|-----------|-------|
| June–August | 0.28–0.30 | Net positive | Peak summer surplus charges BESS |
| March–May, Sept–Oct | 0.25–0.27 | Near balance | Spring/fall shoulder |
| November–February | 0.18–0.22 | BESS critical | Winter is the tightest period |

During winter months, wind generation (which is typically higher in winter at Southwest sites) is the key supplement to reduced solar production. Load management (inference-only mode) may be deployed on the worst winter days to conserve BESS charge.

### 9.2 System Efficiency Summary

| Stage | Efficiency | Cumulative Efficiency |
|-------|-----------|----------------------|
| Panel STC → operating conditions | 92% | 92% |
| MPPT tracking | 99% | 91% |
| 1,500V distribution conductors | 99.5% | 90.6% |
| DC-DC converter (1,500V → 48V) | 97.5% | 88.3% |
| 48V bus bar to rack input | 99% | 87.4% |
| **Solar panel to rack bus bar** | | **~87%** |

The 87% end-to-end efficiency meets the 85% acceptance criterion from the mission brief (05-power-systems.md) and exceeds it comfortably. This confirms the all-DC architecture delivers on its efficiency promise.

### 9.3 Site Footprint Summary

| Component | Footprint | Notes |
|-----------|-----------|-------|
| Compute container (40ft HC) | 28.3 m² | Interior floor area |
| BESS containers (2× 20ft) | 26.4 m² | 2× 13.2 m² interior |
| Equipment enclosures (switchgear, etc.) | ~10 m² | Outdoor pads |
| Solar array (including spacing) | ~10,000 m² | 1.0 m² panel area per kW × 640kW × 1/(GCR 0.40) |
| Access roads within solar array | ~1,500 m² | Perimeter + center road |
| Wind turbine pad and setback | ~1,000 m² | Pad + no-access zone near base |
| Total site area (all components) | ~12,565 m² | **~3.1 acres** |

The 3.1-acre figure is consistent with the vision document's "2.5 acres" estimate — the slight difference reflects the addition of BESS containers, switchgear pads, and access roads that were excluded from the simplified vision estimate.

### 9.4 Capital Cost Order-of-Magnitude

*Note: These are rough order-of-magnitude estimates for planning purposes only. Actual procurement costs depend on site, timing, quantity, and installer selection. PE review required before using these figures in any financial document.*

| Component | Est. Unit Cost | Quantity | Est. Total |
|-----------|---------------|----------|-----------|
| Solar panels (640 kW) | $0.25/W | 640,000 W | $160,000 |
| Solar racking and mounting | $0.15/W | 640,000 W | $96,000 |
| Solar wiring, combiners, conduit | $0.10/W | 640,000 W | $64,000 |
| MPPT charge controllers | $0.08/W | 640,000 W | $51,200 |
| BESS containers (2× 3,500 kWh total) | $120/kWh | 3,500 kWh | $420,000 |
| Wind turbine (75 kW, installed) | $2,500/kW | 75 kW | $187,500 |
| DC-DC converter bank (2× 80 kW) | $100/kW | 160 kW | $16,000 |
| DC switchgear and protection | — | — | $35,000 |
| Grounding, lightning protection | — | — | $15,000 |
| Power monitoring and EMS | — | — | $20,000 |
| Installation labor, site prep | — | — | $80,000 |
| **Power system subtotal (est.)** | | | **~$1,144,700** |

---

## 10. Sources and Standards

### Primary Standards

| Standard | Organization | Scope |
|----------|-------------|-------|
| NEC 2023 (NFPA 70) | NFPA | National Electrical Code — electrical installations |
| NFPA 855:2023 | NFPA | Stationary Energy Storage Systems |
| NFPA 70E:2024 | NFPA | Electrical Safety in the Workplace |
| NFPA 780:2023 | NFPA | Lightning Protection Systems |
| IEEE 1547-2018 | IEEE | Distributed Energy Resources interconnection |
| IEEE 519-2022 | IEEE | Harmonic control in power systems |
| IEEE 1584-2018 | IEEE | Arc-flash hazard calculations (AC) |
| ASCE 7-22 | ASCE | Structural loads for structures |
| UL 1699B | UL | Arc-fault circuit protection (DC PV) |
| UL 9540A | UL | ESS thermal runaway fire propagation |
| UL 1008 | UL | Transfer switch equipment |

### Key Research Sources

| Source | Contribution |
|--------|-------------|
| NREL National Solar Radiation Database (NSRDB) | Irradiance data, capacity factor (24.7%) |
| NREL Annual Technology Baseline (ATB) | Solar and wind cost and performance data |
| NREL Wind Resource Database (WRD) | Site-specific wind capacity factors |
| NREL TMY3 — Tucson, AZ | Reference meteorological year for system modeling |
| DOE/LBNL Data Center Report 2023 | US data center PUE averages, efficiency benchmarks |
| Open Compute Project — Open Rack v3 | 48V DC distribution specification |
| NVIDIA GB200 NVL72 System Guide | Rack power, cooling, and physical specifications |
| SemiAnalysis GB200 Analysis | Detailed hardware architecture and power delivery |
| IEC 61641 | Enclosed switchgear testing under arcing fault conditions |
| OSHA 29 CFR 1910.147 | Lockout/Tagout standard |

### Cross-References within This Document Series

| Document | Relationship |
|----------|-------------|
| 01-vision-architecture.md | Establishes system architecture context, community return model |
| 02-engineering-specifications.md | ISO container dimensions, GB200 specs, NEC standards table |
| 04-container-power-cooling.md | Internal container layout, power zone dimensions, penetration locations |

---

> **Reminder:** All electrical specifications in this document require review and approval by a licensed Professional Engineer (PE) registered in the jurisdiction of deployment before construction, fabrication, or installation. Arc flash hazard analysis per NFPA 70E must be completed before energizing any electrical equipment. Working on energized PV circuits requires appropriate PPE — PV panels cannot be de-energized in daylight. All BESS container installations must comply with NFPA 855 separation, fire suppression, and UL 9540A requirements.
