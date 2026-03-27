# Pacific Rim Compute & Global Deployment

> **Domain:** Cloud Infrastructure, Trade Corridors, and Deployment Architecture
> **Module:** 6 -- AWS/Azure Pacific Infrastructure, Western Seaboard Corridor, and Global Scale Pattern
> **Through-line:** *Amazon and Microsoft each committed more capital to data center expansion in 2025 than the entire publicly-traded US energy sector -- and both companies are headquartered within 15 miles of each other in the Puget Sound region.* The Pacific Northwest is not just where the cloud was invented; it is the prototype design center for the compute infrastructure of the Pacific Rim trade zone, and the Western Seaboard corridor from Puget Sound to the Bay Area is the deployment spine that connects local prototypes to global scale.

---

## Table of Contents

1. [The Pacific Rim Compute Thesis](#1-the-pacific-rim-compute-thesis)
2. [Amazon Web Services Pacific Infrastructure](#2-amazon-web-services-pacific-infrastructure)
3. [Microsoft Azure Pacific Infrastructure](#3-microsoft-azure-pacific-infrastructure)
4. [Grand Coulee Hydroelectric Advantage](#4-grand-coulee-hydroelectric-advantage)
5. [Submarine Cable Topology](#5-submarine-cable-topology)
6. [Western Seaboard Deployment Corridor](#6-western-seaboard-deployment-corridor)
7. [Boeing Cargo Compute Concept](#7-boeing-cargo-compute-concept)
8. [Wasteland Federation Integration](#8-wasteland-federation-integration)
9. [Scale Pattern: Puget Sound to Pacific Rim](#9-scale-pattern-puget-sound-to-pacific-rim)
10. [The Signal Report: Verification Matrix](#10-the-signal-report-verification-matrix)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Pacific Rim Compute Thesis

The Pacific Northwest's role in global compute infrastructure is not incidental -- it is structural. Two of the three largest cloud providers are headquartered in the region (Amazon in Seattle, Microsoft in Redmond). The third (Google, in Mountain View) is 800 miles south along the same Western Seaboard corridor. Together, these three companies operate the majority of the world's public cloud capacity [1].

The thesis: the Puget Sound region, by virtue of its concentration of cloud headquarters, aerospace manufacturing expertise, hydroelectric power access, and Pacific Rim trade position, is the natural prototype design center for the next generation of compute infrastructure. What gets designed and tested here becomes the template for global deployment.

```
PUGET SOUND COMPUTE ECOSYSTEM
================================================================

  AMAZON (Seattle HQ)                MICROSOFT (Redmond HQ)
  - AWS us-west-2 (Oregon)          - Azure West US 2 (Washington)
  - AWS us-west-1 (N. California)   - Azure West US 3 (Arizona)
  - AWS Chile (2026)                - Azure Japan East/West
  - Kuiper (LEO satellite)          - Azure Korea Central
  - $131B+ capex (2025)             - Maia 100 AI accelerators
       |                                  |
       +------ Puget Sound HQ nexus ------+
                      |
               BOEING (Everett)
               - Paine Field manufacturing
               - Tapestry AI logistics
               - Freight network as compute pipe
                      |
               GRAND COULEE DAM
               - Largest US power producer
               - Low-carbon, low-cost hydro
               - BPA regional power grid
                      |
               SUBMARINE CABLES
               - Trans-Pacific fiber
               - Quinault Beach cable landing
               - Low-latency Asia routes
================================================================
```

---

## 2. Amazon Web Services Pacific Infrastructure

### Global Scale

AWS operates 38 regions with over 100 Availability Zones across 27 countries as of 2026. The Pacific-relevant infrastructure includes [2]:

| Region | Location | AZs | Relevance to PNW |
|--------|----------|-----|-------------------|
| us-west-2 | Oregon | 4 | Primary West Coast region, <5ms latency from Seattle |
| us-west-1 | N. California | 3 | Bay Area coverage, Silicon Valley proximity |
| sa-east-1 | Sao Paulo | 3 | South American Pacific trade |
| AWS Chile | Chile (2026) | 3 | $4B+ committed; Pacific South America gateway |
| ap-northeast-1 | Tokyo | 4 | Pacific Rim: Japan, largest Asian market |
| ap-northeast-2 | Seoul | 4 | Pacific Rim: Korea, semiconductor hub |
| ap-northeast-3 | Osaka | 3 | Pacific Rim: Japan west, disaster recovery |
| ap-southeast-1 | Singapore | 3 | Pacific Rim: ASEAN gateway |
| ap-southeast-2 | Sydney | 3 | Pacific Rim: Oceania |

### Capital Expenditure

Amazon committed approximately $131 billion in capital expenditure in 2025, the majority directed at data center expansion and AI infrastructure. For context, this exceeds the combined capital expenditure of the entire publicly-traded US energy sector (Morningstar analysis) [2].

Amazon's 2026 capex is projected to be even higher, driven by:
- Generative AI infrastructure demand (training and inference clusters)
- AWS Trainium and Inferentia custom silicon deployment
- Project Kuiper LEO satellite constellation (broadband)
- Edge computing expansion via AWS Local Zones and Outposts

### AWS Local Zones

AWS Local Zones extend compute to within single-digit millisecond latency of end users in metropolitan areas. Pacific-relevant Local Zones include:
- Seattle, WA
- Portland, OR
- Los Angeles, CA
- San Francisco Bay Area, CA
- Phoenix, AZ
- Honolulu, HI [2]

These Local Zones create a low-latency compute layer that aligns with the Western Seaboard corridor, enabling edge compute applications (autonomous vehicles, AR/VR, real-time analytics) along the I-5 spine.

---

## 3. Microsoft Azure Pacific Infrastructure

### Global Scale

Microsoft Azure operates more than 70 regions and over 400 data centers globally, interconnected by 120,000+ miles of dedicated fiber on its AI Wide Area Network [3].

### Custom Silicon

Microsoft is deploying two custom chip families across its data center fleet:
- **Azure Maia 100:** Custom AI accelerator designed for large language model training and inference
- **Azure Cobalt 100:** ARM-based CPU for general-purpose cloud workloads, competitive with AWS Graviton

### Pacific Rim Presence

| Region | Location | Key Feature |
|--------|----------|-------------|
| West US 2 | Washington state | Primary PNW region |
| West US 3 | Arizona | Expansion region |
| Japan East | Tokyo | Largest Asian Azure region |
| Japan West | Osaka | Disaster recovery pair |
| Korea Central | Seoul | Semiconductor ecosystem proximity |
| Southeast Asia | Singapore | ASEAN gateway |
| Australia East | Sydney | Oceania |

### Capital Expenditure

Microsoft's Azure capital expenditure reached $37.5 billion in a single quarter (Q2 FY2026), making it the fastest-spending hyperscaler in terms of quarterly capital intensity. Microsoft faces an estimated $80 billion backlog of Azure orders constrained by power availability (Futurum Group analysis) [3].

The power constraint is the binding bottleneck: Microsoft can build data centers faster than regional power grids can provide electricity to run them. This makes the PNW's hydroelectric advantage particularly significant.

---

## 4. Grand Coulee Hydroelectric Advantage

Grand Coulee Dam is the largest electric power-producing facility in the United States. Located on the Columbia River in eastern Washington, it provides the structural energy advantage that makes the PNW uniquely competitive for energy-intensive compute workloads [4].

| Parameter | Value |
|-----------|-------|
| Total generating capacity | 6,809 MW (nameplate) |
| Annual generation | ~21 billion kWh |
| Number of generators | 33 (including pump-generators) |
| Dam height | 550 feet |
| Dam length | 5,223 feet |
| Operator | Bureau of Reclamation |
| Power marketed by | Bonneville Power Administration (BPA) |

### BPA Power Grid

The Bonneville Power Administration (BPA) markets power from 31 federal hydroelectric dams and one nuclear plant (Columbia Generating Station) in the Pacific Northwest. BPA's service territory covers portions of Washington, Oregon, Idaho, Montana, and small parts of neighboring states [4].

```
PNW HYDROELECTRIC ADVANTAGE FOR COMPUTE
================================================================

  Grand Coulee Dam (6,809 MW)
       |
  Columbia River System (31 federal dams)
       |
  Bonneville Power Administration
       |
  +----+----+----+----+
  |         |         |
  AWS       MSFT      Google
  Oregon    WA/OR     OR/WA
  DCs       DCs       DCs
       |
  RESULT:
  - Lowest-cost electricity in continental US for large loads
  - Low-carbon (hydro = near-zero operational emissions)
  - Abundant capacity (unlike power-constrained markets)
  - Structural advantage for AI training workloads
================================================================
```

### Cost Comparison

| Region | Industrial Electricity Rate (cents/kWh) | Carbon Intensity |
|--------|----------------------------------------|------------------|
| PNW (BPA territory) | 3.5-5.0 | ~20 g CO2/kWh (hydro-dominant) |
| Northern Virginia (Dominion) | 6.5-8.5 | ~350 g CO2/kWh (gas/nuclear mix) |
| Texas (ERCOT) | 5.0-9.0 (volatile) | ~400 g CO2/kWh (gas-dominant) |
| Japan (TEPCO) | 12.0-18.0 | ~450 g CO2/kWh |
| Singapore | 15.0-20.0 | ~400 g CO2/kWh |

The PNW's hydroelectric advantage provides both the lowest cost and lowest carbon intensity of any major compute region globally. This is a permanent structural advantage -- the dams are built, the water flows, and the power is abundant [4].

---

## 5. Submarine Cable Topology

The Pacific Northwest's connectivity to the Pacific Rim is provided by submarine fiber optic cables that land on the Oregon and Washington coasts [5]:

### Key Trans-Pacific Cables

| Cable | Route | Capacity | Landing Point (Pacific NW) |
|-------|-------|----------|---------------------------|
| PC-1 | US - Japan | 80 Gbps per fiber pair | Harbour Pointe, WA |
| North Pacific Cable | US - Japan | Legacy (upgraded) | Pacific City, OR |
| FASTER | US - Japan - Taiwan | 60 Tbps | Bandon, OR |
| Unity | US - Japan | 7.68 Tbps | Redondo Beach, CA (via land) |
| Jupiter | US - Japan - Philippines | 60 Tbps | Hermosa Beach, CA (via land) |
| Quinault Undersea Cable | US - Pacific (planned) | Multi-Tbps | Quinault Beach, WA |

### Latency Analysis

Trans-Pacific latency is dominated by the speed of light in fiber (approximately 200,000 km/s, or 5 microseconds per kilometer):

| Route | Distance (km) | One-Way Latency | Round-Trip |
|-------|--------------|-----------------|------------|
| Seattle → Tokyo | ~7,700 | ~60 ms | ~120 ms |
| Seattle → Seoul | ~8,500 | ~65 ms | ~130 ms |
| Seattle → Singapore | ~13,500 | ~100 ms | ~200 ms |
| Seattle → Sydney | ~12,500 | ~95 ms | ~190 ms |
| Seattle → Santiago | ~10,500 | ~80 ms | ~160 ms |

For comparison:
- Seattle → Oregon (AWS us-west-2): ~3 ms round-trip
- Seattle → Northern California (AWS us-west-1): ~15 ms round-trip
- Seattle → Bay Area (Moffett Field): ~12 ms round-trip [5]

The Western Seaboard corridor (Seattle → Bay Area) operates at LAN-like latencies compared to trans-Pacific routes, making it ideal for real-time coordination between PNW prototyping centers and Bay Area deployment partners.

---

## 6. Western Seaboard Deployment Corridor

### Corridor Architecture

The Western Seaboard deployment corridor is the physical pathway through which Signal Stack prototypes move from design to global deployment [6]:

```
WESTERN SEABOARD DEPLOYMENT CORRIDOR
================================================================

PUGET SOUND NEXUS (Design + Prototype)
    |
    | Paine Field (Boeing Everett, WATR Center)
    | Boeing Field (South Seattle test hub)
    | Amazon HQ / Microsoft HQ
    |
    | I-5 corridor (800 miles)
    |
BAY AREA NEXUS (Integration + Scale)
    |
    | Moffett Field (NASA Ames, Google/Alphabet)
    | Stanford / UC Berkeley ecosystem
    | Sand Hill Road capital
    |
    | California coast (400 miles)
    |
LOS ANGELES NEXUS (Media + Pacific Gateway)
    |
    | LAX submarine cable landing
    | Entertainment/media compute demand
    | Military/defense (Pt. Mugu, Vandenberg)
    |
    | Pacific coast → submarine cables
    |
PACIFIC RIM NODES
    |
    +---→ Tokyo (AWS ap-northeast-1, Azure Japan East)
    +---→ Seoul (AWS ap-northeast-2, Azure Korea Central)
    +---→ Singapore (AWS ap-southeast-1, Azure Southeast Asia)
    +---→ Sydney (AWS ap-southeast-2, Azure Australia East)
    +---→ Santiago (AWS Chile, new 2026)
================================================================
```

### Node Specifications

Each corridor node serves a specific function:

| Node | Function | Key Infrastructure |
|------|----------|--------------------|
| Paine Field | Design + manufacturing | WATR Center, Boeing factory, prototype lab |
| Boeing Field | Test + transit | Flight test, delivery hub, South Seattle tech |
| Amazon/Microsoft HQ | Cloud integration | Direct API access, partnership management |
| Moffett Field | Bay Area integration | NASA Ames, Google, VC ecosystem |
| Portland | Mid-corridor relay | Intel (Hillsboro), OHSU, clean energy |
| Sacramento | Government + agriculture | State data center, ag-tech corridor |
| Bay Area metro | Scale deployment | Hyperscaler DCs, startup ecosystem |
| Los Angeles | Pacific gateway | Submarine cable landing, entertainment |

---

## 7. Boeing Cargo Compute Concept

The compute-on-wings concept extends Boeing's existing cargo logistics into a distributed compute architecture [7]:

### Current State (2026)

Boeing's Tapestry Solutions subsidiary operates AI-driven logistics optimization for the US Department of Defense via the Transportation Intelligence Environment (TIE) platform. This demonstrates that Boeing's freight network already carries computational intelligence -- the question is scaling it from logistics optimization to general-purpose edge compute.

### Near-Term Evolution (2027-2028)

Cargo containers equipped with ruggedized GPU/TPU racks could be transported via Boeing's existing freight routes. The concept parallels AWS Snowball / Snowmobile (physical data transport), but adds compute processing in transit:

```
BOEING CARGO COMPUTE: TRANSPORT + PROCESS
================================================================

  Origin (Paine Field)
    ├── Physical cargo
    └── Compute container
         ├── GPU rack (NVIDIA H100/B200)
         ├── Cooling system
         ├── UPS / battery
         └── Satellite uplink (Starlink/Kuiper)

  In transit (SEA → SFO, ~2 hours)
    ├── Processing batch workloads
    ├── Training ML models on local data
    └── Uploading results via satellite backhaul

  Destination (Moffett Field)
    ├── Physical cargo delivered
    ├── Compute results downloaded
    └── Container reloaded for return trip
================================================================
```

### Amiga Principle in Cargo Compute

The cargo compute concept is the Amiga Principle applied to logistics: instead of a single massive data center (brute-force processor), distribute specialized compute functions across a fleet of mobile platforms (specialized chips) that each perform their designated function while in transit. The Boeing freight schedule is the clock signal; the cargo containers are the DMA channels [7].

---

## 8. Wasteland Federation Integration

### Federation Layer

The Wasteland federation architecture (from the gsd-skill-creator project) provides a compute task distribution layer that can integrate with the Signal Stack's physical infrastructure [8]:

| Federation Component | Signal Stack Integration |
|---------------------|--------------------------|
| DoltHub data federation | Distributed sensor data across mesh nodes |
| Observation protocol | Weather station and SDR data aggregation |
| DACP (Data Acquisition and Control Protocol) | Mesh node configuration and telemetry |
| Blitter operations | Data transform/ETL across federated nodes |

### Compute Task Routing

The federation layer enables compute tasks to be routed to the most appropriate infrastructure:

```
FEDERATION TASK ROUTING
================================================================

  Task: ML model training (large)
    → Route to: AWS us-west-2 (Oregon) via cloud API
    → Latency: ~3 ms from Seattle

  Task: Real-time sensor fusion (low latency)
    → Route to: Edge compute at mesh node
    → Latency: <1 ms (local)

  Task: Data archival (cost-sensitive)
    → Route to: Boeing cargo compute (batch)
    → Latency: hours (but lowest cost per TB)

  Task: Pacific Rim deployment (geo-distributed)
    → Route to: Azure Japan East / AWS Tokyo
    → Latency: ~120 ms from Seattle

  Federation router → selects optimal path
  Based on: latency requirement, cost, data locality, compliance
================================================================
```

---

## 9. Scale Pattern: Puget Sound to Pacific Rim

### The Scale Pattern

The Signal Stack's deployment follows a concentric expansion pattern [6]:

| Stage | Scale | Scope | Timeline |
|-------|-------|-------|----------|
| 1 | Prototype | Paine Field + Boeing Field | 6-12 months |
| 2 | Metro | Puget Sound basin (Seattle-Tacoma-Olympia) | 12-24 months |
| 3 | Regional | Pacific Northwest (WA, OR, southern BC) | 24-36 months |
| 4 | Corridor | Western Seaboard (Puget Sound → Bay Area) | 36-48 months |
| 5 | Continental | US West Coast + Alaska + Hawaii | 48-60 months |
| 6 | Pacific Rim | Trans-Pacific nodes (Tokyo, Seoul, Singapore, Sydney) | 60-84 months |

Each stage builds on the previous, using the same hardware designs, the same training curriculum, the same cooperative governance model, and the same federation protocol. What works at Paine Field works at Moffett Field works at any node in the network. The scale pattern is fractal: each regional deployment is a miniature version of the whole [6].

### Regional Burns as Deployment Instances

The BRC (Virtual Black Rock City) model applies: each person or community that clones the repository and deploys their own Signal Stack instance is hosting their own "regional burn" -- sovereign but connected via federation. The Puget Sound deployment is the flagship event; regional deployments are cloned instances adapted to local terrain, spectrum availability, and community needs [8].

### Success Metrics by Stage

| Stage | Key Metric | Target |
|-------|-----------|--------|
| Prototype | Functional mesh node count | 10 nodes |
| Metro | Coverage area (km2) | 500 km2 |
| Regional | Connected communities | 50 communities |
| Corridor | End-to-end latency (SEA→SFO) | <15 ms |
| Continental | Total deployed nodes | 1,000+ nodes |
| Pacific Rim | Trans-Pacific federation active | 5+ Pacific nodes |

---

## 10. The Signal Report: Verification Matrix

### Success Criteria Verification

| SC# | Criterion | Test ID(s) | Status |
|-----|-----------|-----------|--------|
| 1 | WA broadcast station inventory complete | CF-01, CF-02 | Pending |
| 2 | Full FCC spectrum allocation summarized | CF-03, CF-04 | Pending |
| 3 | Part 15 AM/FM rules documented with builds | CF-05, SC-FCC | Pending |
| 4 | LPFM licensing pathway documented | CF-06, CF-07 | Pending |
| 5 | HAM licensing and PNW repeater networks documented | CF-08, CF-09 | Pending |
| 6 | Three+ complete DIY build specs delivered | CF-10, CF-11 | Pending |
| 7 | Five+ HAPS/aerostat programs profiled | CF-12, CF-13 | Pending |
| 8 | Boeing/Paine Field pipeline mapped through retraining | CF-14, CF-15 | Pending |
| 9 | Puget Sound prototype center governance specified | CF-16, CF-17 | Pending |
| 10 | AWS/Azure Pacific Rim infrastructure inventoried | CF-18, CF-19 | Pending |
| 11 | Western Seaboard corridor mapped | CF-20, CF-21 | Pending |
| 12 | All builds verified FCC/FAA compliant | SC-FCC, SC-FAA, CF-22 | Pending |

### Safety-Critical Tests

| Test ID | Verifies | Expected Behavior |
|---------|----------|-------------------|
| SC-SRC | Source quality | All citations traceable to FCC.gov, ARRL, FAA, NASA, peer-reviewed, or professional organizations |
| SC-NUM | Numerical attribution | Every power limit, frequency, station count attributed to specific source |
| SC-ADV | No policy advocacy | Spectrum findings presented without advocating specific FCC legislative positions |
| SC-FCC | FCC compliance gate | No DIY build spec instructs unlicensed operation beyond Part 15 limits |
| SC-FAA | FAA airspace gate | All aerostat/HAPS deployment specs include mandatory FAA coordination |
| SC-IND | Indigenous attribution | All Coast Salish and other First Nations referenced by specific nation name |

### Module Cross-Reference Verification

| Topic | Appears In | Verified |
|-------|-----------|----------|
| FCC spectrum allocation | M1, M2, M3 | Pending |
| Part 15 unlicensed rules | M2, M3 | Pending |
| LPFM licensing | M2, M3 | Pending |
| HAM radio / Part 97 | M2, M3, M4 | Pending |
| SDR / RTL-SDR | M3, M4 | Pending |
| Mesh networking / AREDN | M3, M4, M5 | Pending |
| HAPS platforms | M4, M6 | Pending |
| Boeing / Paine Field | M5 | Pending |
| OCAP data sovereignty | M5 | Pending |
| AWS / Azure infrastructure | M6 | Pending |
| Grand Coulee hydro | M6 | Pending |
| Pacific Rim corridor | M6 | Pending |
| Amiga Principle | M2, M4, M6 | Pending |

---

## 11. Cross-References

- **SGL (Signal & Light):** DSP signal processing fundamentals for all communications layers
- **RBH:** Broadcast regulatory history as foundation for spectrum policy analysis
- **FCC:** Federal Communications Commission regulatory framework for all licensed operations
- **BPS (Bio-Physics Sensors):** Sensor networks integrated with mesh infrastructure
- **LED:** Signal chain hardware and protocol stack parallels
- **T55:** Amiga chipset architecture as compute distribution metaphor
- **SYS (Systems Administration):** Data center operations and network infrastructure
- **PSG:** Signal propagation modeling for coverage and deployment planning
- **K8S:** Container orchestration for cloud-native HAPS and edge compute services

---

## 12. Sources

1. Morningstar Research. *Hyperscaler Capital Expenditure Analysis 2025.* Amazon and Microsoft capex comparison to US energy sector.
2. Amazon Web Services. *AWS Global Infrastructure.* aws.amazon.com/about-aws/global-infrastructure. Region count, AZ count, Local Zone locations. AWS Chile region announcement, $4B+ commitment. $131B 2025 capex disclosure.
3. Microsoft Azure. *Azure Global Infrastructure.* azure.microsoft.com/en-us/global-infrastructure. 70+ regions, 400+ data centers, 120,000 miles fiber. Maia 100 and Cobalt 100 custom silicon. $37.5B quarterly capex. Futurum Group $80B backlog estimate.
4. Bureau of Reclamation. *Grand Coulee Dam.* usbr.gov/pn/grandcoulee. Generation capacity, dam specifications. Bonneville Power Administration: bpa.gov.
5. TeleGeography. *Submarine Cable Map.* submarinecablemap.com. Trans-Pacific cable routes, landing points, capacity specifications.
6. Fox Infrastructure Group. *Western Seaboard Deployment Architecture.* Internal planning document. Corridor node specifications, scale pattern, deployment timeline.
7. Boeing / Tapestry Solutions. *Transportation Intelligence Environment (TIE) Platform.* boeing.com. AI cargo logistics, compute-on-wings concept evolution.
8. GSD Ecosystem. *Wasteland Federation Architecture.* gsd-skill-creator project documentation. DoltHub integration, DACP protocol, blitter operations.
9. AWS. *AWS Local Zones.* aws.amazon.com/about-aws/global-infrastructure/localzones. Metro-area edge compute locations.
10. Microsoft. *Azure Maia 100 AI Accelerator.* azure.microsoft.com/blog. Custom AI silicon deployment timeline.
11. National Renewable Energy Laboratory. *US Electricity Generation by State.* nrel.gov. PNW hydroelectric generation as share of regional electricity.
12. International Energy Agency. *Data Centres and Data Transmission Networks.* iea.org. Global data center energy consumption trends.
13. BPA (Bonneville Power Administration). *Wholesale Power Rates.* bpa.gov/energy/wholesale-power-rates. PNW industrial electricity pricing.
14. HAPS Alliance. *Cell Towers in the Sky Reference Architecture.* hapsalliance.org. HAPS infrastructure as Pacific Rim compute overlay.
15. GSD Ecosystem / Center Camp. *Regional Burns as Deployment Instances.* Project documentation. Fractal deployment model via repository cloning.
16. Raven Aerostar. *Stratospheric Connectivity for Remote and Underserved Areas.* ravenaerostar.com. HAPS deployment for coverage gaps.
