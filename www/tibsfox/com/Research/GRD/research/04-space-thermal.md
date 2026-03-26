# From Ammonia Loops to Sunshields

> **Domain:** Space Thermal Engineering
> **Module:** 4 -- ISS, JWST, Voyager, and Beyond
> **Through-line:** *A heat pump in a house in Everett and the ammonia loops on the International Space Station are solving the same equation. The only difference is the boundary conditions. On the ground, you have convection as an ally. In orbit, you have no convection at all.*

---

## Table of Contents

1. [ISS Active Thermal Control System](#1-iss-active-thermal-control-system)
2. [JWST: Passive Cooling to 40K](#2-jwst-passive-cooling-to-40k)
3. [Voyager: RTG Thermal Management](#3-voyager-rtg-thermal-management)
4. [Future: Lunar and Mars Thermal](#4-future-lunar-and-mars-thermal)
5. [SmallSat Thermal Solutions](#5-smallsat-thermal-solutions)
6. [Cross-References](#6-cross-references)
7. [Sources](#7-sources)

---

## 1. ISS Active Thermal Control System

The ISS ATCS is the most complex operational thermal management system ever built, using mechanically pumped anhydrous ammonia in closed-loop circuits [1]:

### 1.1 Architecture

| Component | Function |
|-----------|----------|
| Cold plates | Absorb heat from electronics and crew systems |
| Interface Heat Exchangers (IFHX) | Transfer heat between internal water/air loops and external ammonia loops |
| Ammonia pump modules | Circulate ammonia through external loops |
| External radiator panels | Reject heat to space via infrared emission |
| Thermal Radiator Rotary Joints (TRRJ) | Allow radiators to track optimal rejection angles |
| PVTCS | Photovoltaic Thermal Control System -- manages excess heat from electrical power |

### 1.2 Key Design Features

- Total heater power of 1.8 kW on bypass lines prevents ammonia freezing
- Radiator panels can be rotated to track optimal thermal rejection angles
- Internal loops use water (crew-safe); external loops use ammonia (toxic but thermally superior)
- The IFHX is the critical boundary between crew-safe and crew-hostile thermal fluids

### 1.3 The Structural Isomorphism

The ISS cold plate is structurally identical to a data center liquid cooling cold plate. The ammonia loop is functionally identical to a chilled water loop in a commercial building. The radiator panels are conceptually identical to a cooling tower. The communities rarely talk to each other, but the engineering is the same.

---

## 2. JWST: Passive Cooling to 40K

The James Webb Space Telescope uses passive thermal management to achieve extraordinary performance [2]:

### 2.1 The Five-Layer Sunshield

- Deployed size: 21.2m x 14.2m
- Material: Kapton/aluminum layers
- First layer intercepts 90% of incoming solar energy
- Each successive layer blocks more through radiation and reflection
- Combined: blocks 99.999% of solar energy
- Cold side passively reaches approximately 40K (-233C)
- Hot side (spacecraft bus) operates near 300K (+27C)
- Temperature gradient: 260K across a single structure

### 2.2 MIRI Active Cryocooling

The Mid-Infrared Instrument requires 6.4K (-267C) -- colder than passive cooling can achieve. A pulse-tube cryocooler provides the additional cooling:
- Two-stage compression system
- Helium gas as working fluid
- Consumes approximately 300W of electrical power
- Cools MIRI detector from passive 40K to operational 6.4K

### 2.3 Material Selection

Beryllium was chosen for the primary mirror segments for its near-zero coefficient of thermal expansion at cryogenic temperatures. At 40K, beryllium's dimensional stability is exceptional -- the mirror shape holds to nanometer precision.

---

## 3. Voyager: RTG Thermal Management

Voyager 1 and 2, launched in 1977, represent the ultimate minimal thermal system [3]:

### 3.1 Radioisotope Thermoelectric Generators

- Fuel: Plutonium-238
- Conversion: Seebeck effect (decay heat directly to electricity, no moving parts)
- Power decline: approximately 4W per year as isotope decays (half-life 87.7 years)
- Current power (2025): approximately 4W electrical each
- Instruments being selectively deactivated to conserve power

### 3.2 Thermal Management at 15 Billion Miles

- **Thermal louvers** with bimetallic actuators passively regulate heat rejection
- **Heater triage** as power declines: deciding which systems get heat and which are allowed to freeze
- **No solar input** at interstellar distances -- the only heat source is radioactive decay
- The engineering question is not how to reject heat but how to conserve it

### 3.3 The Elegance

The Voyager spacecraft survive interstellar space on the waste heat of radioactive decay alone. No compressor, no pumps, no refrigerant, no combustion. Just plutonium atoms decaying according to physics, thermocouples converting the temperature differential to electricity, and thermal louvers passively managing the balance. It is the most minimal thermal system ever to achieve a mission duration of 48+ years.

---

## 4. Future: Lunar and Mars Thermal

### 4.1 Lunar Surface

The lunar surface presents the most extreme thermal cycling environment for human habitation [4]:

| Condition | Value |
|-----------|-------|
| Day temperature | +127C (+261F) |
| Night temperature | -173C (-280F) |
| Day/night cycle | 14 Earth days each |
| Atmosphere | Effectively none (no convection) |

Thermal solutions must handle a 300C swing every 28 days with no convective cooling available. Candidate approaches: regolith shielding (thermal mass), deployable radiators, heat pipes to permanently shadowed craters.

### 4.2 Mars Habitats

Mars presents a different challenge: thin atmosphere (some convection possible, unlike vacuum) with dust accumulation reducing solar panel output. Average surface temperature: -60C. Candidate approaches: pressurized habitats with electric heating, in-situ resource utilization (ISRU) for insulation, and nuclear fission power for both electricity and heat.

Both environments demand electric thermal solutions -- no combustion atmosphere is available on either body.

---

## 5. SmallSat Thermal Solutions

Miniaturized spacecraft face unique thermal challenges [5]:

| Solution | Scale | Mechanism |
|----------|-------|-----------|
| Coatings-only | CubeSat | Surface emissivity/absorptivity tuning |
| Miniaturized heat pipes | MicroSat | Passive two-phase heat transport |
| Deployable radiators | SmallSat | Increased rejection area post-deployment |
| Paraffin thermal storage | CubeSat | PCM absorbs transient heat loads |

The SmallSat community has driven innovation in passive thermal management because active systems (pumps, compressors) consume too much of the limited power budget. This innovation feeds back to terrestrial applications: lightweight, passive thermal solutions for IoT sensors, remote installations, and off-grid structures.

---

## 6. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Signal processing in spacecraft telemetry; biological thermoregulation vs. engineered systems |
| [THE](../THE/index.html) | Thermal energy fundamentals; radiation as primary heat transfer in vacuum |
| [ECO](../ECO/index.html) | Ecological thermal gradients; organism thermoregulation strategies |
| [MPC](../MPC/index.html) | Mathematical modeling of thermal systems; COP optimization |

---

## 7. Sources

1. NASA, "Active Thermal Control System (ATCS) Overview."
2. Parrish et al. (2005). "Cryogenic Thermal System Design of JWST ISIM." *SAE Technical Paper* 2005-01-3041.
3. NASA/JPL, "Voyager Mission Status" and thermal management documentation.
4. NASA, "Thermal Technology Roadmap 2024."
5. NASA, "Small Spacecraft Technology State of the Art: Thermal Control," 2024 edition.
