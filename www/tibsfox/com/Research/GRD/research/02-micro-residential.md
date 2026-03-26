# From Wrist Cooler to Heat Pump

> **Domain:** Micro/Personal & Residential Scale
> **Module:** 2 -- Personal Environments and Residential Thermal Management
> **Through-line:** *A Peltier junction in a cooling vest and a heat pump in a duplex are the same device at different scales. Both intercept a thermal gradient using electricity. The boundary conditions change -- body heat vs. building heat, skin vs. envelope -- but the dQ/dt equation is identical.*

---

## Table of Contents

1. [EV Thermal Management](#1-ev-thermal-management)
2. [Electric Aircraft and Submarine Thermal](#2-electric-aircraft-and-submarine-thermal)
3. [Wearable Thermal Devices](#3-wearable-thermal-devices)
4. [Residential Heat Pumps](#4-residential-heat-pumps)
5. [Envelope Performance](#5-envelope-performance)
6. [Multifamily and High-Rise](#6-multifamily-and-high-rise)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. EV Thermal Management

The global EV battery thermal management systems market was valued at approximately $5.4 billion in 2024, projected to reach $29 billion by 2030 [1][2].

### 1.1 Liquid Cooling

The industry standard: water-glycol circulated through cold plates bonded to battery modules. Performance: reduces peak battery temperature by 15-30% versus air cooling while maintaining cell-to-cell temperature uniformity below 5C.

### 1.2 Integrated Thermal Architectures

| System | Vehicle | Innovation |
|--------|---------|-----------|
| Tesla Octovalve | Model Y (2021+) | Single multi-port controller managing heat exchange between cabin, battery, and powertrain |
| BYD 16-in-1 | e-Platform 3.0 | Five thermal modes: high-temp heating, high-temp cooling, low-temp preheating, waste heat recovery, servo |
| Hanon Systems Gen 4 | Multiple OEMs | Multi-source heat pump capturing waste heat from motor, battery, and ambient simultaneously |

### 1.3 Heat Pumps in EVs

Heat pump technology extends EV driving range by approximately 10% at 0C (32F) compared to resistive heating. At moderate cold temperatures, COP of 2-3; advantage diminishes below -18C, at which point supplemental PTC resistive heating activates [2].

---

## 2. Electric Aircraft and Submarine Thermal

### 2.1 Boeing 787 No-Bleed Architecture

The Dreamliner introduced the first no-bleed architecture in commercial aircraft: electrically driven compressors replace engine bleed-air systems for cabin pressurization and air conditioning. Benefits: lighter, more efficient, finer per-zone temperature control [3].

### 2.2 Submarine Thermal Management

Nuclear submarines use closed-loop freshwater cooling interfaced with seawater heat exchangers. The challenge is bidirectional: maintain crew comfort in a sealed environment while minimizing thermal signature in surrounding water. All-electric ship programs (DDG-1000 Zumwalt class) integrate electric propulsion with thermal management [3].

---

## 3. Wearable Thermal Devices

| Device | Technology | Application |
|--------|-----------|-------------|
| Peltier cooling vests | Thermoelectric junction | Industrial workers, athletes, medical |
| Space suit liquid cooling garments | Circulating water in fabric tubes | EVA in space |
| Sublimators | Water evaporation in vacuum | Space suit emergency cooling |

Wearable thermal devices represent the smallest scale of the gradient engine: the boundary between human body heat and ambient environment, mediated by electricity.

---

## 4. Residential Heat Pumps

### 4.1 Deployment Data

According to IEA Global Energy Review 2025 [4]:
- U.S. heat pump sales rose 15% in 2024, with a 30% surge in the second half
- Heat pumps outsold natural gas furnaces by a record 30% margin
- Globally, heat pump sales rose 27% from 2020 to 2024
- European market declined 21% in 2024 (policy uncertainty, energy price normalization)

### 4.2 Economics

| System Type | Installed Cost | Savings vs. Gas | Payback |
|------------|---------------|-----------------|---------|
| Air-to-air (mini-split) | $3,000-6,000 | $400-714/yr | 4-8 years |
| Air-to-water | 2-4x gas boiler cost | Higher savings | 5-12 years |
| Ground-source | $15,000-30,000 | Highest savings | 8-15 years |

Financial incentives in 30+ countries cover over 70% of current heating demand [4].

### 4.3 System Types

- **Mini-split (ductless):** Individual room units; ideal for additions, retrofits, and homes without ductwork
- **Ducted air-source:** Replaces central furnace; uses existing ductwork
- **Ground-source (geothermal):** Highest efficiency; requires ground loop installation
- **Air-to-water:** Heats water for radiators or radiant floor; common in European markets

---

## 5. Envelope Performance

Danish data demonstrates that heat pumps in the best-insulated homes use 30% less electricity than those in poorly insulated homes. Upgrading a home's energy rating by two grades can halve heating energy demand [4][5].

### 5.1 Key Envelope Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| R-value | Thermal resistance of insulation | Walls: R-19+; Attic: R-49+ |
| Air changes per hour (ACH) | Infiltration rate (blower door test) | <3 ACH50 for energy efficiency |
| Window U-factor | Thermal transmittance of glazing | <0.30 for high performance |
| SHGC | Solar heat gain coefficient | Climate-dependent (0.25-0.40) |

### 5.2 The Envelope-Equipment Sequence

**Critical finding:** Envelope improvement should precede equipment upgrade. A heat pump installed in a leaky building will be oversized for the post-improvement load, leading to short cycling and reduced efficiency. The recommended sequence:
1. Air seal and insulate
2. Upgrade windows if needed
3. Size heat pump to the improved load
4. Install ventilation (ERV/HRV) to maintain indoor air quality

---

## 6. Multifamily and High-Rise

### 6.1 Variable Refrigerant Flow (VRF)

VRF systems serve 10-40+ zones from a single outdoor unit, offering simultaneous heating and cooling with energy recovery between zones. A unit heating a south-facing apartment can transfer rejected heat to one cooling a north-facing unit [5].

### 6.2 Water-Source Heat Pump Loops

Each apartment gets an individual heat pump sharing a common condenser water loop. Metering is straightforward; each unit controls its own comfort. The building-level water loop acts as a thermal bus, allowing simultaneous heating and cooling loads to balance each other.

### 6.3 High-Rise Specific Challenges

- **Stack effect:** Pressure differentials drive infiltration on lower floors, exfiltration on upper floors
- **Curtain wall performance:** Glazing-heavy facades have high thermal transmittance
- **Riser distribution:** Vertical pipe runs for hydronic systems add cost and complexity above 10 stories
- **Neutral pressure plane:** Must be managed to prevent stack-effect-driven energy waste

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [SHE](../SHE/index.html) | Smart home sensors; thermostat integration; building automation |
| [BCM](../BCM/index.html) | Building construction; envelope performance; insulation and air sealing |
| [THE](../THE/index.html) | Thermal energy fundamentals; heat transfer mechanisms |
| [LED](../LED/index.html) | Electronics thermal management; heat sinks; LED thermal design |

---

## 8. Sources

1. IDTechEx, "Thermal Management for Electric Vehicles 2025-2035."
2. Recurrent Auto, "Winter EV Range Study," 30,000-vehicle dataset, 2025/2026.
3. Boeing 787 Environmental Control Systems documentation; DDG-1000 program references.
4. IEA, "Global Energy Review 2025," heat pump deployment section.
5. NREL/DOE, "Overview of Building Electrification," NREL/TP-5500-88309.
