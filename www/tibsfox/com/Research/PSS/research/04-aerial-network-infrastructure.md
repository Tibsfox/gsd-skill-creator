# Aerial Network Infrastructure

> **Domain:** High-Altitude Platform Stations & Tethered Aerostats
> **Module:** 4 -- Stratospheric and Tropospheric Communications Platforms
> **Through-line:** *Between the ground where mesh panels sit and the orbits where satellites circle, there is a vast volume of atmosphere that has been almost entirely unused for communications infrastructure -- until now.* Tethered aerostats at 300 meters and stratospheric platforms at 20 kilometers are closing the gaps that ground towers cannot reach: the San Juan Islands, the Olympic Peninsula, the Cascade backcountry, and the maritime corridors of Puget Sound.

---

## Table of Contents

1. [The Altitude Gap](#1-the-altitude-gap)
2. [Tethered Aerostats: Persistent Low-Altitude Platforms](#2-tethered-aerostats-persistent-low-altitude-platforms)
3. [High-Altitude Platform Stations (HAPS)](#3-high-altitude-platform-stations-haps)
4. [Project Loon Legacy Architecture](#4-project-loon-legacy-architecture)
5. [Active HAPS Programs (2026 Survey)](#5-active-haps-programs-2026-survey)
6. [Coverage Geometry and Link Budgets](#6-coverage-geometry-and-link-budgets)
7. [FAA Airspace Coordination](#7-faa-airspace-coordination)
8. [ITU Spectrum Allocation for HAPS](#8-itu-spectrum-allocation-for-haps)
9. [Boeing AI Cargo Logistics and Compute-on-Wings](#9-boeing-ai-cargo-logistics-and-compute-on-wings)
10. [Puget Sound Deployment Scenarios](#10-puget-sound-deployment-scenarios)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Altitude Gap

Communications infrastructure has historically been constrained to two altitude regimes: ground level (towers, typically 30-300 meters above ground) and orbital altitudes (LEO at 500-2000 km, MEO at 2000-35000 km, GEO at 35,786 km). Between these two regimes lies a vast volume of atmosphere that has been largely unused [1].

```
ALTITUDE REGIMES FOR COMMUNICATIONS
================================================================
ALTITUDE         REGIME              TECHNOLOGY
----------------------------------------------------------------
35,786 km        GEO orbit           Comsat (Intelsat, SES)
2,000-35,000 km  MEO orbit           GPS, O3b (SES)
500-2,000 km     LEO orbit           Starlink, OneWeb, Kuiper
20-35 km         UPPER STRATO        ← Unexploited (radiation)
17-21 km         LOWER STRATO        ← HAPS zone (stable winds)
10-17 km         TROPOPAUSE          ← Commercial aviation
1-10 km          UPPER TROPO         ← Unexploited (weather)
300-1000 m       LOWER TROPO         ← Tethered aerostats
30-300 m         TOWER LEVEL         Cell towers, broadcast
0-30 m           GROUND LEVEL        Mesh panels, Wi-Fi, IoT
================================================================

  THE ALTITUDE GAP: 300m to 17km
  Almost entirely unused for persistent communications
  This is where the PNW Signal Stack's aerial layer lives
```

The lower stratosphere (17-21 km) offers uniquely favorable conditions for persistent aerial platforms:

- **Stable winds:** Stratospheric winds at 18-20 km altitude are typically 5-25 m/s, compared to 30-60 m/s in the jet stream at 10-12 km
- **Above weather:** Virtually all precipitation, cloud formation, and turbulence occurs below the tropopause (~10-12 km in the PNW)
- **Clear line of sight:** A platform at 20 km has line-of-sight to receivers 500+ km away
- **Solar energy:** Continuous solar availability for solar-powered platforms during long summer days (important for PNW, where summer days exceed 15 hours) [2]

---

## 2. Tethered Aerostats: Persistent Low-Altitude Platforms

Tethered aerostats operate at altitudes of 100-1500 meters, anchored to the ground by a tether that also carries power and data. They offer deployment timelines measured in hours rather than the months required for tower construction [3].

### Altaeros ST-300 and ST-Flex

Altaeros Energies (founded from MIT in 2010) developed the SuperTower (ST) series of tethered aerostats designed specifically for telecommunications:

| Parameter | ST-300 | ST-Flex |
|-----------|--------|---------|
| Operational altitude | Up to 300 meters (1,000 feet) | Up to 240 meters |
| Payload capacity | Up to 100 kg | Up to 30 kg |
| Deployment time | 24-48 hours | 4-8 hours |
| Endurance | Days to weeks (helium envelope) | Days (helium envelope) |
| Wind tolerance | Up to 110 km/h (70 mph) | Up to 80 km/h |
| Tether | Composite fiber, carries power + fiber optic | Lightweight composite |
| Power to payload | Up to 3 kW via tether | Up to 500 W |
| Typical payload | LTE/5G base station | LTE small cell, sensors |

Altaeros held a 5-year, $99 million contract with US Customs and Border Patrol for persistent surveillance applications using the ST-300. The ST-Flex variant was trialed with World Mobile for community cellular coverage in Africa and with SoftBank HAPSMobile for HAPS integration testing [3].

### Coverage Advantage

A tethered aerostat at 300 meters altitude provides dramatically more coverage than a conventional tower:

```
COVERAGE RADIUS vs ALTITUDE (line-of-sight to flat terrain)
================================================================
Altitude (m)    LOS Radius (km)    Coverage Area (km2)
----------------------------------------------------------------
30              19.6               1,206
60              27.7               2,410
100             35.7               4,003
200             50.5               8,012
300             61.8               12,000
600             87.4               24,000
1000            112.8              40,000
================================================================

  Formula: d = sqrt(2 * R_earth * h)
  Where R_earth = 6,371 km, h = antenna height
  Actual coverage reduced by terrain, RF margin, cell loading
```

At 300 meters, a single aerostat covers approximately 12,000 km2 -- roughly the area of the Puget Sound metropolitan area from Olympia to Bellingham.

---

## 3. High-Altitude Platform Stations (HAPS)

HAPS operate in the lower stratosphere (17-21 km), above weather and most air traffic, providing wide-area communications coverage equivalent to hundreds of ground towers [2].

### Key Advantages Over Satellites

| Metric | HAPS (20 km) | LEO Satellite (550 km) | GEO Satellite (35,786 km) |
|--------|-------------|----------------------|--------------------------|
| One-way latency | <1 ms | 4-20 ms | 600 ms |
| Round-trip latency | <2 ms | 8-40 ms | 1200 ms |
| Path loss (2 GHz) | ~135 dB | ~155 dB | ~190 dB |
| Coverage diameter | ~200-500 km | ~1,000 km | ~1/3 of Earth |
| Deploy/redeploy time | Hours to days | Months to years | Years |
| Fuel/energy | Solar (renewable) | Orbital fuel (finite) | Station-keeping fuel |
| Maintenance | Land and service | Replace satellite | Not serviceable |
| Cost per platform | $1-10M (est.) | $0.5-3M per satellite | $100M+ per satellite |

HAPS offers a unique combination: satellite-like coverage area with fiber-like latency and terrestrial-like path loss, at a fraction of satellite constellation cost. The trade-off is operational complexity -- keeping a platform aloft at 20 km in all weather conditions and all seasons requires sophisticated autonomous flight control [2].

### HAPS Alliance Reference Architecture

The HAPS Alliance (industry consortium including SoftBank, Raven Aerostar, Airbus, BAE Systems, and others) released its first Reference Architecture in November 2024, titled "Cell Towers in the Sky." The architecture defines [4]:

- **HAPS-RAN:** Radio Access Network optimized for stratospheric deployment
- **HAPS-Core:** Cloud-native core network running on the platform or ground
- **HAPS-Transport:** Backhaul links (optical, RF, or hybrid) connecting the platform to ground stations
- **HAPS-Command:** Autonomous flight control and mission management

---

## 4. Project Loon Legacy Architecture

Google's Project Loon (2013-2021) validated the fundamental architecture for stratospheric communications platforms. Loon's contribution was proving three critical capabilities [5]:

### Balloon-to-Balloon Mesh Backhaul

Loon demonstrated that multiple stratospheric platforms could form a mesh network, relaying traffic across hundreds of kilometers without touching the ground between endpoints. Each balloon carried both user-facing LTE antennas (pointing down) and inter-balloon optical links (pointing sideways to neighboring balloons).

```
LOON MESH ARCHITECTURE
================================================================

  ◯ Balloon A          ◯ Balloon B          ◯ Balloon C
  20 km alt.           20 km alt.           20 km alt.
  |   \  optical  /    |    \  optical  /    |
  |    \_________/     |     \_________/     |
  |   inter-balloon    |    inter-balloon    |
  |                    |                     |
  v                    v                     v
  LTE                  LTE                   LTE
  (user-facing)        (user-facing)         (user-facing)
  |                    |                     |
  |                    |                     |
  smartphones          smartphones           smartphones
  on ground            on ground             on ground

  Ground station <── backhaul from Balloon A ──> Internet
  Traffic from Balloon C reaches ground via A→B→C mesh
================================================================
```

### Standard Smartphone Connectivity

Loon proved that stratospheric LTE could connect to unmodified smartphones on the ground -- no special hardware or app required. The path loss at 20 km altitude with sufficient antenna gain and transmit power allows standard 4G LTE handshakes [5].

### Autonomous Station-Keeping

Loon's navigation system used altitude adjustment (changing the balloon's altitude to catch wind currents blowing in the desired direction) to maintain station within a target coverage area. Machine learning algorithms predicted wind patterns and planned altitude profiles days in advance [5].

Loon shut down in January 2021 due to commercial viability challenges -- the cost per connected user could not compete with terrestrial alternatives in the regions it served (Kenya, Peru). However, the technical architecture was validated and has directly informed all subsequent HAPS programs [5].

---

## 5. Active HAPS Programs (2026 Survey)

### Raven Aerostar Thunderhead

| Parameter | Value |
|-----------|-------|
| Developer | Raven Aerostar (division of Raven Industries, acquired by Textron 2022) |
| Platform type | Stratospheric balloon |
| Altitude | 17-21 km |
| Duration | Record: 300+ days (April 2025 world record) |
| Connectivity | 4G LTE via Abside HAPS-RAN: 23 Mbps down / 6 Mbps up to unmodified phones |
| Coverage | ~200 km diameter per platform |
| Status | Active commercial deployments; Abside partnership for HAPS-RAN |

Raven Aerostar set the world record for stratospheric balloon duration in April 2025, demonstrating the reliability needed for persistent telecommunications service. The Thunderhead platform carries a multi-band payload capable of serving standard LTE devices on the ground without modification [6].

### SoftBank HAPSMobile Sunglider

| Parameter | Value |
|-----------|-------|
| Developer | HAPSMobile (SoftBank subsidiary) + AeroVironment |
| Platform type | Solar-powered fixed-wing UAV |
| Wingspan | 78 meters |
| Altitude | 19-20 km |
| Duration | Target: months-continuous |
| Connectivity | LTE to standard devices demonstrated from 62,500 feet; 15-hour video conference |
| Status | Flight testing; solar cell efficiency improvements ongoing |

Sunglider demonstrated LTE connectivity to unmodified smartphones from 62,500 feet altitude, including sustained video conferencing for 15 hours -- proving the viability of HAPS for real-time communications [7].

### BAE Systems PHASA-35

| Parameter | Value |
|-----------|-------|
| Developer | BAE Systems (UK) |
| Platform type | Solar-electric HALE UAV |
| Wingspan | 35 meters |
| Altitude | 20 km target |
| Duration | Target: 1 year continuous |
| Status | Stratospheric test flights at Spaceport America, Dec 2024; targeting 2026 operations |

PHASA-35 (Persistent High-Altitude Solar Aircraft) completed stratospheric test flights at Spaceport America in New Mexico in December 2024. BAE Systems targets operational deployment in 2026, initially for defense and surveillance applications with telecommunications payloads to follow [8].

### Sceye Airship

| Parameter | Value |
|-----------|-------|
| Developer | Sceye Inc. (New Mexico) |
| Platform type | Lighter-than-air airship (hybrid buoyancy + solar propulsion) |
| Altitude | 20 km |
| Duration | Target: months-continuous |
| Connectivity | 5G demonstration completed; diurnal solar-powered flight August 2024 |
| Status | Active development; Spaceport America test flights ongoing |

Sceye's airship design offers larger payload capacity than balloon or fixed-wing platforms, enabling more powerful telecommunications equipment and potentially multiple service antennas for different frequency bands [9].

### Airbus Zephyr / AALTO HAPS

| Parameter | Value |
|-----------|-------|
| Developer | Airbus Defence and Space / AALTO HAPS |
| Platform type | Solar-electric HALE UAV |
| Wingspan | 25 meters (Zephyr S), 33 meters (Zephyr T) |
| Altitude | 21 km |
| Duration | Record: 64 days (Zephyr S, 2022) |
| Connectivity | 5G trials July 2024; UK CAA Design Organisation Approval August 2024 |
| Status | AALTO HAPS spinoff from Airbus for commercial operations |

Zephyr holds the endurance record for solar-electric HALE UAVs at 64 days. The AALTO HAPS spinoff is commercializing the platform with UK CAA Design Organisation Approval received in August 2024, clearing the regulatory path for commercial operations [10].

---

## 6. Coverage Geometry and Link Budgets

### Coverage Diameter vs Altitude

For a HAPS platform providing LTE service at 2 GHz, the coverage area is determined by:

1. **Line-of-sight radius:** Geometric horizon distance from the platform altitude
2. **Minimum elevation angle:** The minimum angle above the horizon at which a ground user can receive adequate signal (typically 15-30 degrees for reliable service)
3. **Cell loading:** Maximum number of simultaneous users per cell sector

```
HAPS COVERAGE GEOMETRY
================================================================

              HAPS Platform
                  ◯  (altitude h)
                 / | \
                /  |  \
               /   |   \
              / el |    \    el = elevation angle
             / min |     \
            /      |      \
           /       |       \
    ──────/────────|────────\──────── Ground plane
    <---- r ------>|<---- r ----->
                   |
    Coverage radius r = h / tan(el_min)

    At 20 km altitude, 15° min elevation:
    r = 20,000 / tan(15°) = 74.6 km
    Coverage diameter = ~150 km

    At 20 km altitude, 30° min elevation:
    r = 20,000 / tan(30°) = 34.6 km
    Coverage diameter = ~70 km
================================================================
```

### Link Budget Analysis

A simplified downlink budget for HAPS LTE at 2 GHz [11]:

| Parameter | Value | Notes |
|-----------|-------|-------|
| HAPS transmit power | +43 dBm (20 W) | Per antenna sector |
| HAPS antenna gain | +15 dBi | Phased array, beam-formed |
| EIRP | +58 dBm | Transmit power + antenna gain |
| Free-space path loss (20 km slant) | -134.5 dB | FSPL at 2 GHz, 20 km |
| Atmospheric absorption | -0.5 dB | Clear air at 2 GHz |
| Rain margin (PNW) | -2.0 dB | Heavy rain at 2 GHz (negligible) |
| Building penetration | -15 dB | Indoor users (outdoor: 0 dB) |
| User device antenna gain | +0 dBi | Smartphone isotropic |
| **Received signal (outdoor)** | **-79 dBm** | Well above LTE sensitivity |
| **Received signal (indoor)** | **-94 dBm** | Marginal but usable |

LTE receiver sensitivity is typically -100 to -110 dBm depending on bandwidth and modulation. The outdoor budget shows comfortable margin; indoor service requires lower modulation rates but remains viable [11].

> **Related:** [SGL (Signal & Light)](../SGL/page.html?doc=01-real-time-dsp-algorithms) for OFDM modulation fundamentals, [PSG](../PSG/) for propagation modeling techniques

---

## 7. FAA Airspace Coordination

### Tethered Aerostat Regulations

Tethered aerostats in the United States are regulated by FAA under 14 CFR Part 101 (Moored Balloons, Kites, and Unmanned Free Balloons). Key requirements [12]:

- **NOTAM filing:** Mandatory before any aerostat deployment above 150 feet AGL
- **Lighting:** Must carry high-intensity flashing lights visible for 5+ miles at night
- **Marking:** Tether must be marked with high-visibility pennants every 50 feet
- **ATC coordination:** Required in controlled airspace (Class B/C/D near airports)
- **Altitude restriction:** Class A airspace begins at 18,000 feet MSL (above most aerostat operations)

### HAPS Airspace Coordination

HAPS platforms at 17-21 km altitude operate in the stratosphere, above controlled airspace (Class A extends to 60,000 feet / 18.3 km). The FAA has been developing a Concept of Operations (CONOPS) for Extended Traffic Management (ETM) that addresses stratospheric platforms [12]:

```
FAA AIRSPACE CLASSES (relevant to aerial platforms)
================================================================
ALTITUDE          CLASS     RULES
----------------------------------------------------------------
> 60,000 ft (FL600)  Class E     IFR/VFR; HAPS operate here
  (18.3 km)                      Coordination via ETM CONOPS
----------------------------------------------------------------
18,000-60,000 ft     Class A     IFR only; ATC clearance required
  (5.5-18.3 km)                  Commercial aviation zone
----------------------------------------------------------------
Surface-18,000 ft    Class B-G   Various rules depending on
  (0-5.5 km)                     proximity to airports
================================================================

  HAPS target: 17-21 km (55,000-69,000 ft)
  Tethered aerostats: 100-1000 m (330-3,280 ft)
  Both require FAA coordination before deployment
```

> **FAA COMPLIANCE NOTE:** No aerial platform -- tethered aerostat, HAPS, or otherwise -- should be deployed without proper FAA coordination. This includes NOTAM filing, ATC notification, and compliance with all applicable regulations. The guidance in this module is educational; consult FAA and aviation legal counsel before any deployment.

---

## 8. ITU Spectrum Allocation for HAPS

The ITU has designated specific frequency bands for HAPS use through a series of World Radiocommunication Conference (WRC) decisions [13]:

### ITU Resolution 221 HAPS Frequencies

| Band | Frequency Range | ITU Region | Direction | Notes |
|------|----------------|-----------|-----------|-------|
| 6 GHz | 5850-5875 MHz | Regions 1, 2, 3 | Ground-to-HAPS | Shared with fixed service |
| 28 GHz | 27.9-28.2 GHz | Region 2 (Americas) | HAPS-to-ground | IMT backhaul |
| 31 GHz | 31.0-31.3 GHz | Regions 1, 2, 3 | HAPS-to-ground | Shared with fixed service |
| 38 GHz | 38.0-39.5 GHz | All regions | HAPS-to-ground | WRC-23 decisions |
| 47 GHz | 47.2-47.5 GHz | All regions | HAPS-to-ground | High-capacity links |
| 2 GHz | 1885-1980/2010-2025/2110-2170 MHz | Various | User-facing LTE | IMT designation |

The 2 GHz IMT designation allows HAPS to provide standard LTE/5G service directly to consumer devices -- the critical enabler for coverage to unmodified smartphones [13].

> **SAFETY NOTE:** ITU HAPS frequency allocations are evolving. WRC-23 made significant changes, and WRC-27 is expected to address additional HAPS spectrum needs. Verify current allocations with the ITU Radio Regulations before any deployment planning.

---

## 9. Boeing AI Cargo Logistics and Compute-on-Wings

Boeing's Tapestry Solutions subsidiary applies AI and machine learning to its Transportation Intelligence Environment (TIE) platform for the US Department of Defense. The TIE platform includes [14]:

- **Cargo Assistant:** AI-driven data entry and validation for load planning
- **Free Query:** Interactive mapping and logistics visualization
- **Help Chat:** Generative AI agent for load planning assistance

This AI cargo logistics capability provides the foundation for a broader "compute-on-wings" concept where aircraft and vessels carry compute payloads alongside physical cargo. The concept extends naturally from Boeing's existing infrastructure:

```
COMPUTE-ON-WINGS EVOLUTION
================================================================
CURRENT (2026):
  Aircraft → Physical cargo + AI load planning
  TIE Platform → DOD logistics optimization

NEAR-TERM (2027-2028):
  Aircraft → Physical cargo + edge compute nodes
  Cargo containers → Include GPU/TPU racks
  Route optimization → Includes compute workload scheduling

FUTURE (2029+):
  Boeing freight network → Distributed compute fabric
  Each aircraft → Mobile data center node
  Pacific Rim routes → Compute pipeline SEA↔SFO↔NRT↔ICN
================================================================
```

The Boeing Narrowband Research (BNR) transport concept -- moving prototype hardware from the Bay Area to Paine Field via Boeing logistics -- is an early instantiation of this pattern: using existing freight infrastructure to move compute assets along defined corridors [14].

> **Related:** [Aerospace Pipeline & Prototype Design](05-aerospace-pipeline-prototype.md) for Boeing/Paine Field workforce integration, [Pacific Rim Compute & Global Deployment](06-pacific-rim-compute-deployment.md) for Pacific Rim compute infrastructure

---

## 10. Puget Sound Deployment Scenarios

### Scenario 1: Maritime Coverage

A single tethered aerostat at 300 meters altitude, deployed from a barge in central Puget Sound, could provide LTE coverage across the entire Sound from Olympia to the San Juan Islands. This addresses the persistent connectivity gap experienced by Washington State Ferries passengers and marine operators [3].

### Scenario 2: Cascadia Emergency Response

During a CSZ earthquake, a fleet of 3-5 HAPS platforms at 20 km altitude could provide emergency LTE coverage for the entire Puget Sound metro area, replacing hundreds of damaged or powerless cell towers. Each platform covers a 150 km diameter, and the fleet provides redundant coverage through overlapping cells [2].

### Scenario 3: Olympic Peninsula Coverage

The Olympic Peninsula's rugged terrain and sparse population make ground tower economics unfavorable. A single HAPS platform positioned over the Olympic Range could serve the entire Peninsula, including the Quinault, Makah, Hoh, and Quileute tribal nations' territories, providing connectivity that currently requires expensive satellite backhaul [2].

### Scenario 4: Innovation Corridor

A permanent HAPS platform over the I-5 corridor between Everett (Boeing) and Seattle could serve as a flying edge compute node, providing ultra-low-latency services for autonomous vehicle testing, smart transportation infrastructure, and industrial IoT applications along the corridor.

---

## 11. Cross-References

- **SGL (Signal & Light):** OFDM and LTE signal processing fundamentals
- **RBH:** Regulatory history and spectrum licensing evolution
- **FCC:** Spectrum allocation for HAPS and aerostat operations
- **BPS (Bio-Physics Sensors):** Sensor data backhaul via aerial platforms
- **LED:** Signal timing and deterministic protocol parallels
- **T55:** Embedded systems for aerial platform payloads
- **SYS (Systems Administration):** Network operations for aerial infrastructure
- **PSG:** Propagation modeling for aerial coverage planning
- **K8S:** Cloud-native architectures for HAPS-Core network functions

---

## 12. Sources

1. HAPS Alliance. *First Reference Architecture: Cell Towers in the Sky.* hapsalliance.org, November 2024. HAPS industry architecture and deployment concepts.
2. NASA/TM-20230018267. *High Altitude Platform System (HAPS): LTE from the Stratosphere.* ntrs.nasa.gov. NASA technical memorandum on HAPS communications capabilities.
3. Altaeros Energies. *SuperTower ST-300 and ST-Flex Specifications.* altaeros.com. Tethered aerostat technical parameters and deployment experience.
4. HAPS Alliance. *Reference Architecture v1.0: HAPS-RAN, HAPS-Core, HAPS-Transport, HAPS-Command.* hapsalliance.org, 2024.
5. Loon LLC. *System Design of the Physical Layer for Loon's High-Altitude Platform.* Springer Journal on Wireless Communications and Networking, 2019.
6. Raven Aerostar. *Thunderhead Balloon System: 4G LTE Stratospheric Connectivity.* ravenaerostar.com. Platform specifications, Abside HAPS-RAN partnership, April 2025 duration record.
7. HAPSMobile / SoftBank. *Sunglider Demonstration Results.* hapsmobile.com. LTE connectivity from 62,500 feet, video conference demonstration.
8. BAE Systems. *PHASA-35 Stratospheric Test Flights.* baesystems.com. Spaceport America test flights December 2024, 2026 operational timeline.
9. Sceye Inc. *Sceye Airship Platform.* sceye.com. 5G demonstration, diurnal flight August 2024, hybrid airship design.
10. Airbus / AALTO HAPS. *Zephyr Program and AALTO Spinoff.* airbus.com / aaltohaps.com. 64-day endurance record, UK CAA approval August 2024.
11. 3GPP TR 38.811. *Study on New Radio (NR) to support Non-Terrestrial Networks.* 3GPP, 2020. Link budget analysis for HAPS LTE/5G.
12. Federal Aviation Administration. *14 CFR Part 101: Moored Balloons, Kites, and Unmanned Free Balloons.* ecfr.gov. Tethered aerostat regulations, NOTAM requirements.
13. ITU. *Resolution 221 (Rev.WRC-23): HAPS Frequency Allocations.* itu.int. HAPS spectrum designations by region.
14. Boeing / Tapestry Solutions. *Transportation Intelligence Environment (TIE) Platform.* boeing.com. AI cargo logistics, Cargo Assistant, generative AI Help Chat.
15. FAA. *Extended Traffic Management (ETM) Concept of Operations.* faa.gov. Stratospheric airspace management for HAPS.
16. World Mobile Group. *Aerostat Connectivity Trials.* worldmobile.io. Altaeros ST-Flex community connectivity deployments.
