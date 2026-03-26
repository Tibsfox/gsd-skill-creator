# Deployment and Site Logistics

> **Domain:** Site Selection & Infrastructure Logistics
> **Module:** 3 -- Open Compute Node: Rail Corridors, Site Selection, and Site Preparation
> **Through-line:** *The container arrives by rail, backs onto a prepared pad, connects two lines, and turns on. The entire logistics model depends on a single insight: rail corridors, fiber routes, and solar irradiance all converge in the same under-served US regions. The underserved areas are where AI compute is least present — and most needed.*

---

## Table of Contents

1. [The Rail Corridor Deployment Model](#1-the-rail-corridor-deployment-model)
2. [Target Deployment Corridors](#2-target-deployment-corridors)
3. [Site Selection Scoring Matrix](#3-site-selection-scoring-matrix)
4. [Top Candidate Deployment Sites](#4-top-candidate-deployment-sites)
5. [Site Preparation Specification](#5-site-preparation-specification)
6. [Foundation Design](#6-foundation-design)
7. [External Connections](#7-external-connections)
8. [Security and Monitoring](#8-security-and-monitoring)
9. [Deployment Sequence](#9-deployment-sequence)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Rail Corridor Deployment Model

The Open Compute Node deployment model is not a data center siting strategy. It is a logistics strategy.

**The key insight:** US Class I railroad rights-of-way became the route of choice for fiber optic cable laying during the 1990s-2000s telecommunications buildout. Major carriers (Level 3/Lumen, Zayo, Crown Castle, others) co-located fiber along Union Pacific, BNSF, CSX, and Norfolk Southern corridors. The same corridors that move freight also carry data infrastructure.

**The convergence:** Southwest rail corridors — where BNSF and Union Pacific run through New Mexico, Arizona, and Texas — have three simultaneous attributes:
1. Existing rail sidings for intermodal container delivery
2. Fiber optic presence (Level 3, Zayo, or regional carriers)
3. Solar irradiance exceeding 6 kWh/m²/day (among the highest in North America)

These are also the regions most underserved by existing AI compute infrastructure, which concentrates in Northern Virginia, Phoenix metro (large campus data centers), and Pacific Northwest (large hyperscaler facilities). Rural communities along these corridors — small towns in New Mexico, rural Arizona, eastern California — have essentially no access to local compute resources.

**The deployment unit:** The container is factory-assembled and tested, then shipped to the prepared site via standard intermodal logistics (rail flatcar or truck). No specialized installation crew required. Two external connections (water, power) plus fiber. Site preparation is the only local construction.

---

## 2. Target Deployment Corridors

### 2.1 Priority One — Southwest (Excellent Solar, Existing Infrastructure)

| Corridor | Railroad | States | Solar Irradiance | Fiber Carriers |
|----------|----------|--------|-----------------|----------------|
| Sunset Route | Union Pacific | TX, NM, AZ, CA | 6.0-6.5 kWh/m²/day | Level 3/Lumen, Zayo |
| Transcon | BNSF | TX, NM, AZ, CA | 5.8-6.5 kWh/m²/day | Level 3, AT&T |
| I-10 Corridor | UP/BNSF | TX, NM, AZ | 5.5-6.5 kWh/m²/day | Multiple carriers |
| I-40 Corridor | BNSF | TX, NM, AZ | 5.5-6.2 kWh/m²/day | Level 3, CenturyLink |
| I-25 Corridor | BNSF | NM, CO | 5.0-6.0 kWh/m²/day | Level 3, Zayo |

### 2.2 Priority Two — Secondary Corridors (Good Solar, Established Fiber)

| Corridor | Railroad | States | Solar Irradiance |
|----------|----------|--------|-----------------|
| California Central Valley | UP/BNSF | CA | 5.0-5.5 kWh/m²/day |
| Texas High Plains | BNSF | TX | 5.0-5.5 kWh/m²/day |
| Great Plains | UP/BNSF | NE, KS, OK | 4.5-5.5 kWh/m²/day |

### 2.3 Why These Corridors

**Solar economics:** Sites below 35°N latitude with clear skies receive 6+ kWh/m²/day — roughly 2.5× the irradiance of Seattle (2.4 kWh/m²/day average). This reduces solar array size and battery storage requirements proportionally.

**Fiber density:** Southwest corridors were priority routes during the fiber buildout era because they connect Los Angeles, Phoenix, Dallas, and Houston — major interconnection hubs. Fiber POPs (Points of Presence) exist at most towns with rail stops.

**Water availability:** Agricultural regions in New Mexico, Arizona, and California have irrigation infrastructure and non-potable water sources (agricultural runoff, treated wastewater, irrigation district water). This is the OCN's water input.

**Community need:** Rural communities along these corridors have limited access to computing resources. Libraries and schools in towns under 10,000 population are the target community partners.

---

## 3. Site Selection Scoring Matrix

Each candidate site is scored against seven criteria (total 100 points):

| Criterion | Weight | 10 Points | 7 Points | 4 Points | 0 Points |
|-----------|--------|-----------|----------|----------|----------|
| Solar irradiance | 25% | >6 kWh/m²/day | 5-6 kWh/m²/day | 4-5 kWh/m²/day | <4 kWh/m²/day |
| Fiber access | 20% | Direct POP on-site | <0.5 mile | <1 mile | >1 mile |
| Rail siding access | 15% | Existing siding | Within 0.5 mile | Within 1 mile | >1 mile |
| Water source | 15% | Adjacent (pipe connection) | <0.5 mile | <1 mile | >1 mile |
| Community partner | 10% | Committed (MOU signed) | Interested (in discussion) | Identified | None identified |
| Land availability | 10% | Available <$5K/acre | Available <$20K/acre | Available >$20K | Unavailable |
| Zoning compatibility | 5% | Pre-zoned appropriate | Re-zonable (likely) | Re-zonable (uncertain) | Not feasible |

**Target:** ≥20 candidate sites identified. ≥10 sites scoring ≥70/100.

---

## 4. Top Candidate Deployment Sites

Representative high-scoring sites along priority corridors (coordinates approximate; verified NREL NSRDB data required per S-01 through S-10 safety requirements):

| Rank | Location | Corridor | Score | Solar | Fiber | Rail | Water | Notes |
|------|----------|----------|-------|-------|-------|------|-------|-------|
| 1 | Lordsburg, NM | I-10/Sunset | 87 | 6.4 | Direct | Existing siding | Ag irrigation | Union Pacific stop; BNSF Transcon nearby |
| 2 | Deming, NM | I-10 | 85 | 6.3 | <0.5mi | Existing siding | NM irrigation district | Municipal partner interest documented |
| 3 | Tucson area (east), AZ | Sunset | 84 | 6.2 | Direct | Existing siding | Ag water | UP Sunset Route siding access |
| 4 | Belen, NM | BNSF/I-25 | 83 | 5.9 | <0.5mi | Major siding | Rio Grande | BNSF crew change point; active siding |
| 5 | Winslow, AZ | I-40/Transcon | 82 | 6.0 | <0.5mi | Active siding | Agricultural | Historic rail town; community library |
| 6 | Needles, CA | Transcon | 81 | 6.4 | <0.5mi | Active siding | Colorado R. | High solar; border community |
| 7 | Dalhart, TX | Texas High Plains | 80 | 5.9 | <1mi | Grain elevator siding | Ag water | School district partner candidate |
| 8 | Flagstaff area, AZ | I-40 | 78 | 5.6 | Direct | BNSF stop | Municipal water | Higher altitude; good fiber density |
| 9 | Garden City, KS | Great Plains | 76 | 5.1 | <1mi | BNSF siding | Ag irrigation | Liberal KS nearby for fallback |
| 10 | Bakersfield area, CA | Central Valley | 75 | 5.3 | Direct | UP/BNSF | Ag district | Strong fiber presence; community college |

*Note: This table represents a design-phase candidate list. Final site selection requires field verification of GPS coordinates, fiber POP locations (lat/lon, carrier contacts), NREL NSRDB data pull for exact irradiance values, water source flow rates, and executed community partner agreements.*

---

## 5. Site Preparation Specification

### 5.1 Overview

Site preparation is the only local construction required. The container arrives assembled and tested. Site prep converts a bare location into a deployable host site. Total preparation time: 2-4 weeks with a small local crew.

### 5.2 Required Site Elements

| Element | Specification |
|---------|---------------|
| Foundation pad | 15m × 5m minimum; level ±25mm; 3m clearance all sides |
| Power connection | DC bus from solar array to container penetrations |
| Water intake | Pipe from source with shutoff valve, flow meter, coarse screen |
| Water output | Pipe to community distribution point with flow meter |
| Fiber conduit | From nearest splice point to container entry |
| Waste access path | Graded path for drum dolly to north wall |
| Security perimeter | Chain-link fence with access gate |

---

## 6. Foundation Design

### 6.1 Minimum Foundation (Gravel Pad)

- Compacted gravel pad, minimum depth 150mm, 15m × 5m footprint
- Compaction to 95% standard Proctor density
- Level within ±25mm across the full pad area
- Drainage grade: minimum 2% slope away from pad edges
- Geotextile fabric underlayer to prevent soil migration

### 6.2 Preferred Foundation (Reinforced Concrete)

- Reinforced concrete slab, minimum 150mm thick
- Reinforcement: #4 rebar at 400mm on center, both directions
- Anchor bolts: M24 at corner casting positions (4× per ISO specification)
- Concrete strength: minimum 25 MPa (3,625 psi) at 28 days
- Drainage channels along perimeter
- Reference standard: ASCE 7-22 for structural load calculations

### 6.3 Site Clearance

- 3m clearance on all four sides for maintenance access
- 5m clearance on the north wall (water connections, waste drum access)
- Overhead clearance: minimum 4m for container delivery by crane or tilt-bed truck
- Vehicle access: graded road capable of 30-ton gross vehicle weight for delivery

---

## 7. External Connections

### 7.1 Power Connection

```
Solar Array (off-site) ──→ DC Disconnect (exterior) ──→ Container Penetration
                                    ↑
                               Accessible from
                              outside container
                          (Emergency shutoff - S-09)
```

- DC bus conduit: minimum 2" rigid conduit from solar array to container penetrations
- Weatherproof conduit fittings at all entries
- Exterior-accessible disconnect switch (required per S-09 safety requirement)
- Ground fault protection per NEC Article 690 (solar) and 706 (BESS)
- Surge protection device at container service entrance

### 7.2 Water Intake

- Pipe from water source: minimum 2" diameter, schedule 40 or better
- Isolation shutoff valve at source and at container wall
- Coarse screen filter at intake (50-100 mesh, cleanable)
- Flow meter: totalizing (for monthly reporting to community partner)
- Pressure regulation if source pressure exceeds 80 PSI
- Winterization: buried below frost depth in northern sites

### 7.3 Potable Water Output

- 1" minimum pipe diameter from container north wall to distribution point
- Flow meter at output (automated quality monitoring integration)
- Sample port for water quality testing access
- Automated shutoff valve (electronically controlled, tied to quality sensors)
- Community distribution point: spigot, tank fill connection, or building tie-in

### 7.4 Fiber Optic Connection

- Single-mode fiber preferred (OS2) for long-distance connections
- Multi-mode acceptable for <300m community connections
- Connector type: LC/UPC or MPO (per carrier specification)
- Buried conduit from carrier splice point to container splice box
- Minimum 3 spare strands for redundancy and future expansion
- Weatherproof splice enclosure at container entry point

---

## 8. Security and Monitoring

Designed for unmanned remote operation — no on-site staff required. Monthly maintenance visit is the only planned human presence.

### 8.1 Perimeter Security

- Chain-link fence, minimum 6-foot height, with barbed wire top optional
- Access gate: single vehicle gate with keyed padlock (or electronic lock with audit log)
- Site lighting: solar-powered LED security lights at four fence corners (motion-triggered)
- No-climb fence fabric at critical areas (power equipment zones)

### 8.2 Container Security

- Container door: electronic lock with audit log and emergency panic bar (interior)
- Access log: date/time/user for every entry event, retained 12 months
- Keypad or RFID entry (avoid network-dependent entry for remote reliability)
- Emergency bypass: physical key override for electronic lock failure

### 8.3 Remote Monitoring

- IP cameras: 4 minimum (container exterior, gate, water connections, solar array)
- Local storage (NVR on local network — no cloud dependency)
- Retention: 30-day rolling video storage minimum
- Remote access via VPN over site fiber connection
- Alert capability: motion detection, door open, power fault, water quality fault

---

## 9. Deployment Sequence

The complete deployment sequence from site selection to operational node:

| Phase | Duration | Activities |
|-------|----------|-----------|
| **Site selection** | 2-4 weeks | Score candidates, visit top 3, execute land access agreement |
| **Community partnership** | 4-8 weeks (parallel) | Identify library/school/municipal partner, execute MOU |
| **Mural design program** | 8-12 weeks (parallel) | Open call for designs, community vote, finalize artwork |
| **Factory build and test** | 8-12 weeks | Container modification, equipment installation, factory acceptance test |
| **Site preparation** | 2-4 weeks | Foundation, utility connections, security fence |
| **Mural painting** | 1-2 weeks (at factory) | Professional application during final factory phase |
| **Transport and set** | 1-3 days | Rail or truck delivery, crane placement on foundation |
| **External connections** | 1-2 days | Power, water, fiber connection and testing |
| **Commissioning** | 2-5 days | System startup, water quality testing, compute allocation verification |
| **Handoff** | 1 day | Community partner orientation, dashboard access, maintenance briefing |
| **Total (calendar)** | ~20-30 weeks | From site selection decision to operational node |

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [OCN Module 01](01-vision-architecture.md) | Vision that defines the deployment model and community return |
| [OCN Module 02](02-engineering-specifications.md) | Physical specifications that define site requirements |
| [OCN Module 04](04-container-power-cooling.md) | Container and systems that the site must support |
| [OCN Module 05](05-community-integration.md) | Community partnerships formalized during deployment sequence |
| [NND](../NND/index.html) | New New Deal: rail corridor deployment as economic development; policy framework for rural AI infrastructure |
| [SYS](../SYS/index.html) | Systems administration for remote monitoring and site operations |
| [BCM](../BCM/index.html) | Site construction and container modification principles |
| [EMG](../EMG/index.html) | Generator backup power systems; site power continuity during solar gaps |

---

## 11. Sources

1. BNSF Railway — Transcon and intermodal corridor route maps
2. Union Pacific — Sunset Route and I-10 corridor information
3. NREL (National Renewable Energy Laboratory) — NSRDB solar irradiance data by location
4. FCC Broadband Map — Fiber infrastructure presence by corridor and county
5. ASCE 7-22 — Minimum Design Loads and Associated Criteria for Buildings and Other Structures
6. EPA 40 CFR Part 141 — National Primary Drinking Water Regulations
7. NFPA 70 (NEC 2023) — National Electrical Code, Articles 690, 706, 230
8. ISO 668:2020 — Freight containers: Classification, dimensions and ratings
9. DOT 49 CFR Part 178 — Specifications for Packagings (55-gallon drum standards)
10. USDA Rural Utilities Service — Rural broadband and infrastructure programs

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation, all structural, electrical, and plumbing designs must be verified by licensed professionals in the jurisdiction of deployment. Site-specific soil, seismic, and wind load analysis must be performed.
