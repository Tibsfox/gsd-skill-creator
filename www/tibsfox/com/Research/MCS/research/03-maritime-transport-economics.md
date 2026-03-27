# Maritime Transport Economics

> **Domain:** Maritime Infrastructure Economics
> **Module:** 3 -- Vessel Acquisition, Operating Costs, and Port Infrastructure
> **Through-line:** *A container vessel is not just a cargo carrier. It is a hull, a power plant, a cooling system, and a mobile platform -- the same convergence the Amiga achieved in silicon, achieved in steel. The economics of that convergence depend on numbers that the shipping industry publishes but the compute industry has never consumed. This module bridges that gap.*

---

## Table of Contents

1. [Vessel Acquisition Costs](#1-vessel-acquisition-costs)
2. [Annual Operating Cost Model](#2-annual-operating-cost-model)
3. [Crew Cost Economics](#3-crew-cost-economics)
4. [Fuel Cost Modeling](#4-fuel-cost-modeling)
5. [LNG and Hydrogen Fuel Transition](#5-lng-and-hydrogen-fuel-transition)
6. [Autonomous Vessel Economics](#6-autonomous-vessel-economics)
7. [Insurance and Classification](#7-insurance-and-classification)
8. [PNW Port Infrastructure](#8-pnw-port-infrastructure)
9. [Maintenance and Drydock](#9-maintenance-and-drydock)
10. [Regulatory Compliance Costs](#10-regulatory-compliance-costs)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Vessel Acquisition Costs

Vessel acquisition represents the mobile component of the maritime platform. Cost varies by vessel type, size, yard of construction, and delivery timeline. Korean and Chinese yards dominate new-build pricing for standard cargo vessel classes [1][2].

| Vessel Type / Size | New-Build Cost | Source |
|---|---|---|
| Small cargo (1,000-5,000 TEU) | $15-50M | FreightAmigo / Bearcat 2026 |
| Standard freight (5,000-10,000 TEU) | $30-100M | FreightAmigo 2024 |
| Large container (10,000+ TEU) | $100-200M | FreightAmigo / Wikipedia 2024 |
| Ultra-large (20,000+ TEU) | $200-267M | Accio.com market data 2024 |
| 4,000-6,000 TEU (Korean yards) | $80-100M | Industry operator quoted 2024 |
| Used vessel (5-year-old) | 60-70% of new-build | Bearcat Express 2026 |

### Platform-Relevant Vessel Selection

For the maritime platform, the optimal vessel class is the 4,000-6,000 TEU range ($80-100M new-build) for several reasons:

- **Cargo capacity:** Sufficient holds for 20-40 containerized compute units (1-2 MW each, 20-80 MW total IT load)
- **Power generation:** Main engine 20-40 MW, auxiliary generators 5-10 MW -- sufficient for onboard compute when supplemented with shore power at port
- **Speed:** 18-22 knots service speed, adequate for PNW coastal routes
- **Draft:** 12-14 meters, compatible with Seattle, Tacoma, and Portland port depths
- **Availability:** Well-supplied class from Korean, Chinese, and Japanese yards [1][2]

### Used Vessel Economics

Five-year-old vessels at 60-70% of new-build cost represent a significant capital efficiency opportunity for early-phase platform deployment. A used 5,000 TEU vessel at $50-65M provides the same hull and power plant as a new-build at $80-100M, with 15-20 years of remaining economic life before major structural overhaul [2].

---

## 2. Annual Operating Cost Model

Vessel operating costs are well-documented by the shipping industry. The cost structure for a large vessel (5,000-10,000 TEU) breaks down as follows [1][3]:

| Cost Item | Annual Range | Notes |
|---|---|---|
| Crew wages + related | $2-5M | Route and flag-state dependent |
| Fuel (HFO/VLSFO) | $3-10M | Route-dependent; dominant variable cost |
| IMO 2020 sulfur surcharge | $150-300/container | ~$500K-1.5M/yr at 3,000 TEU utilization |
| EU ETS (European ports) | $50-150/container | From 2024 phase-in (NA ports exempt) |
| Annual maintenance | $1-3M (amortized) | Drydock every 3-5 years |
| Insurance (H&M + P&I) | 0.5-1.5% of vessel value | $400K-1.5M/yr for $80-100M vessel |
| Port fees | Variable | $50K-200K per port call |
| Stores and supplies | $200-500K | Provisions, lubricants, spare parts |
| **Total Annual OPEX** | **$8-22M** | **Varies by route, speed, and utilization** |

### Platform-Modified Operating Profile

Vessel-mounted compute modifies the standard operating profile:
- **Reduced steaming:** Platform vessels may operate as semi-stationary compute nodes at anchor rather than continuous cargo routing, reducing fuel consumption by 50-70%
- **Increased power demand:** Onboard compute adds 20-80 MW electrical load, consuming fuel or requiring shore power connection
- **Modified crew:** Compute operations require IT staff in addition to marine crew, adding $500K-2M annually
- **Increased insurance:** Novel use (compute platform) may attract higher P&I premiums initially [3][4]

---

## 3. Crew Cost Economics

Crew costs are the second-largest operating expense after fuel, and the primary target for autonomous vessel economics [3][5].

### Standard Manning

A 5,000-10,000 TEU container vessel typically operates with:
- **Officers:** 8-12 (captain, chief officer, second/third officers, chief engineer, second/third/fourth engineers)
- **Ratings:** 8-15 (bosun, ABs, oilers, electrician, cook, messroom)
- **Total complement:** 18-25 crew members

### Cost by Flag State

| Flag State | Annual Crew Cost (approx.) | Notes |
|---|---|---|
| US (Jones Act) | $4-6M | Highest global crew cost; mandatory for US coastal trade |
| European (NIS, DIS) | $2-4M | Norwegian/Danish international registers |
| Philippine/Indian crew | $1.5-2.5M | Open registry, competitive manning agencies |
| Chinese crew | $1-2M | Domestic fleet manning rates |

### Jones Act Impact

The Jones Act (46 U.S.C. 55102) requires US-built, US-flagged, and US-crewed vessels for domestic waterborne commerce. For the maritime platform operating between US ports (Seattle, Tacoma, Portland), Jones Act compliance approximately doubles crew costs and triples vessel acquisition cost compared to open-registry alternatives [6].

**Platform implication:** Jones Act exemption strategies (offshore operation beyond US territorial waters, foreign-flag vessel with US port calls classified as international trade) are critical to platform economics. Legal analysis required -- see Fox Legal Staffing Analysis [6].

---

## 4. Fuel Cost Modeling

Fuel is the largest variable operating cost for conventional vessels. The maritime platform's fuel economics depend on the operating profile: continuous steaming vs. anchored compute operation [3][7].

### Fuel Consumption

| Operating Mode | Daily Consumption (5,000 TEU) | Annual Cost (at $600/mt VLSFO) |
|---|---|---|
| Full speed (22 knots) | 150-200 mt/day | $33-44M |
| Service speed (18 knots) | 80-120 mt/day | $17.5-26M |
| Slow steaming (14 knots) | 40-60 mt/day | $8.8-13M |
| At anchor (generators only) | 10-20 mt/day | $2.2-4.4M |
| Cold lay-up | 2-5 mt/day | $0.4-1.1M |

### Platform Operating Profile

For a vessel-mounted compute node operating primarily at anchor with periodic repositioning:
- **At-anchor fuel consumption:** 10-20 mt/day for auxiliary generators powering compute load
- **Annual fuel cost (at anchor):** $2.2-4.4M per vessel
- **Shore power option:** If shore power available at $0.02/kWh (BPA), electricity cost for equivalent compute load is $350K-1.4M annually for 20-80 MW -- significantly cheaper than onboard generation

The shore power vs. onboard generation economics strongly favor cable-delivered BPA hydro power wherever the cable infrastructure exists [7][13].

---

## 5. LNG and Hydrogen Fuel Transition

The maritime industry is transitioning away from heavy fuel oil (HFO) toward lower-emission alternatives. IMO 2023 GHG strategy targets 20-30% reduction by 2030 and net-zero by approximately 2050 [7][8].

### LNG (Liquefied Natural Gas)

- **Current adoption:** ~400 LNG-fueled vessels in operation globally (2024)
- **Fuel cost:** $10-15/mmBTU vs. $8-12/mmBTU equivalent for VLSFO (variable, regionally dependent)
- **CAPEX premium:** 15-25% vessel cost premium for LNG fuel system (dual-fuel engines, cryogenic tanks)
- **Emissions reduction:** ~25% CO2 reduction, near-zero SOx and particulate
- **Methane slip concern:** Unburned methane (GWP 80x CO2 over 20 years) partially offsets CO2 benefit [8]

### Hydrogen and Ammonia

- **Green hydrogen:** $3-8/kg (2024), projected $1-2/kg by 2030 (DOE Hydrogen Shot)
- **Ammonia:** Leading candidate for long-distance shipping fuel (energy density advantage over compressed hydrogen)
- **CAPEX premium:** 30-50% for ammonia-ready vessel design (toxicity handling, modified engines)
- **Timeline:** Commercial ammonia-fueled vessels not expected before 2028-2030 [8][9]

### Platform Implication

The maritime platform's fuel transition economics favor:
1. **Short-term (2024-2028):** VLSFO for vessel repositioning, shore power (BPA hydro) for compute
2. **Medium-term (2028-2035):** LNG dual-fuel for vessel operations, continued shore power for compute
3. **Long-term (2035+):** Green hydrogen/ammonia for vessel operations; offshore wind supplements shore power

The key insight: because platform vessels spend most time at anchor (not steaming), the fuel transition urgency is lower than for conventional shipping. The dominant energy cost is compute power, which is cable-delivered from BPA hydro [7][8][9].

---

## 6. Autonomous Vessel Economics

Autonomous and remotely-operated vessels represent a potential cost reduction pathway for the platform's vessel fleet [5][10].

### Current Status

- **Yara Birkeland:** 120 TEU, fully electric, fully autonomous coastal feeder (Norway). Operational testing 2022-2025; production economics pending
- **MUNIN project:** EU-funded autonomous bulk carrier concept (2012-2015), foundational research
- **ReVolt concept:** DNV 100 TEU autonomous short-sea vessel design

### Economic Analysis

Research from Gdynia Maritime University (ScienceDirect 2017) and follow-on MUNIN program data shows [5][10]:
- **Lifecycle savings:** Expected present value savings of $4.3M over a 25-year bulk carrier lifecycle
- **Freight rate reduction:** Required freight rate 3.4% lower for equivalent autonomous bulker vs. conventional manned ship
- **Shore Control Centre:** Can monitor approximately 90 vessels simultaneously, amortizing SCC operational cost across fleet
- **Communication costs:** Increase ~10x vs. conventional vessel (significant for data-heavy compute payloads)

### Platform Application

For compute-carrying vessels running workloads en route:
- The 10x communication cost premium is offset by the compute revenue those workloads generate
- Autonomous navigation reduces crew to a shore-monitored skeleton (compliance crew for regulatory requirements)
- Estimated crew cost savings: 40-60% ($1-3M/yr per vessel at scale)

> **CAUTION:** IMO regulatory framework for autonomous vessels (Maritime Autonomous Surface Ships, or MASS) is under development. Full regulatory approval for unmanned commercial vessels in international waters is not expected before 2030. Near-term autonomous deployment is limited to coastal and domestic waters with flag-state approval [10].

---

## 7. Insurance and Classification

Maritime insurance is more complex and expensive than land-based property insurance due to the perils of the sea, salvage obligations, and P&I club structures [11].

### Insurance Types

| Type | Coverage | Annual Premium |
|---|---|---|
| Hull & Machinery (H&M) | Physical damage to vessel | 0.3-0.8% of hull value |
| Protection & Indemnity (P&I) | Third-party liability, pollution, crew injury | $200K-500K/yr (mutual club entry) |
| Cargo | Cargo damage/loss | 0.1-0.3% of cargo value |
| War Risk | War, terrorism, piracy zones | 0.02-0.05% (PNW: minimal) |
| Loss of Hire | Revenue loss during repairs | 0.5-1.0% of daily earnings |

### Compute Platform Premium

Novel use of vessels as compute platforms will attract underwriting scrutiny:
- **Precedent:** Floating production storage and offloading (FPSO) vessels provide the closest insurance analogy
- **Expected premium:** 20-50% above standard H&M rates for the first 5 years of operational track record
- **Data center coverage:** Separate inland marine or technology E&O policy for the compute equipment ($50-150K/yr per vessel)

### Classification Societies

DNV, Lloyd's Register, Bureau Veritas, and ABS provide the classification framework. A novel compute-platform vessel will require:
- **Class notation:** Likely "Special Purpose Ship" under IMO MODU/SPS code
- **Annual survey cost:** $50-100K per vessel
- **5-year special survey (drydock):** $200-500K including underwater inspection [11][12]

---

## 8. PNW Port Infrastructure

The Pacific Northwest's three major ports provide the shore-side logistics base for the maritime platform [13][14].

### Seattle (Terminal 5 / Terminal 18)

- **Container throughput:** ~3.5M TEU (2023, combined with Tacoma as Northwest Seaport Alliance)
- **Depth:** 50 feet (15.2m) at Terminal 5 -- accommodates vessels up to 14,000 TEU
- **Shore power:** Available at select berths (cold-ironing capability)
- **Rail:** BNSF and UP intermodal connections
- **Compute platform suitability:** Excellent. Deep berths, shore power, proximity to fiber landing stations, data center corridor along I-90

### Tacoma

- **Container throughput:** Combined with Seattle under NWSA
- **Depth:** 51 feet (15.5m) at Husky Terminal -- deepest berths in PNW
- **Shore power:** Limited availability (expansion planned)
- **Land availability:** More available than Seattle for shore-side compute infrastructure
- **Compute platform suitability:** Strong. Deepest berths, land availability, less urban density for infrastructure expansion

### Portland (Terminal 6)

- **Container throughput:** ~200K TEU (2023) -- significantly smaller than Seattle/Tacoma
- **Depth:** 43 feet (13.1m) -- limits vessel size to ~5,000 TEU
- **Columbia River:** 105 miles from ocean; river bar crossing limits vessel draft
- **Compute platform suitability:** Moderate. Closest to Electric City via Columbia Gorge, but depth and bar limitations restrict vessel class

### Port Infrastructure Investment Estimate

Dedicated berth and maintenance facility for the maritime platform:

| Component | Estimate | Basis |
|---|---|---|
| Dedicated berth lease (20-year) | $20-50M | NWSA commercial rates, long-term |
| Shore power infrastructure (100 MW) | $15-30M | Substation, cable, shore-side switchgear |
| Maintenance and repair facility | $10-20M | Workshop, dry storage, crane access |
| Fiber connectivity | $1-3M | Submarine landing station to berth |
| **Total port infrastructure** | **$46-103M** | |

> **Related:** [Convergence Credits](04-convergence-credits.md) for shared port logistics savings; [Scenario Comparison](05-scenario-comparison.md) for port costs in deployment models

---

## 9. Maintenance and Drydock

Vessel maintenance follows a regulatory-mandated schedule that creates predictable cost cycles [11][12].

### Survey Schedule

| Survey Type | Interval | Estimated Cost | Scope |
|---|---|---|---|
| Annual survey | Yearly | $50-100K | Above-waterline inspection, safety equipment |
| Intermediate survey | 2.5 years | $100-200K | Underwater inspection (divers or ROV) |
| Special survey | 5 years | $2-5M | Full drydock, hull treatment, machinery overhaul |
| Docking survey | 5 years | Included in special | Bottom painting, propeller/rudder inspection |

### Compute Equipment Maintenance

In addition to standard vessel surveys, the compute payload requires:
- **Hardware refresh:** 3-5 year cycle for GPU/server replacement ($2-4M per MW of IT load)
- **Network equipment:** 5-7 year refresh cycle
- **Cooling system service:** Annual seawater intake inspection, heat exchanger cleaning
- **Power conditioning:** UPS battery replacement every 5-7 years

### Total Maintenance Budget

For a platform vessel (5,000 TEU hull + 40 MW compute payload):
- **Annual hull/vessel maintenance:** $1-3M (amortized special survey)
- **Annual compute maintenance:** $1-2M (hardware refresh amortized)
- **Total annual maintenance:** $2-5M per vessel

---

## 10. Regulatory Compliance Costs

Maritime operations face a layered regulatory environment from international, national, and state authorities [6][15].

### Key Regulatory Frameworks

| Authority | Regulation | Cost Impact |
|---|---|---|
| IMO | MARPOL, SOLAS, ISM Code | Baseline vessel compliance (built into class) |
| IMO 2020 | Sulfur cap (0.5% SOx) | $150-300/container surcharge or scrubber ($5-10M) |
| US Coast Guard | USCG inspection, manning | Certificate of inspection, manning requirements |
| Jones Act | 46 U.S.C. 55102 | 2-3x vessel cost, 2x crew cost for domestic trade |
| EPA | NPDES vessel discharge permit | Ballast water, scrubber discharge, sewage |
| NEPA | Environmental review | $500K-2M per project for offshore infrastructure |
| State (WA/OR) | Coastal zone management | Permit review, public comment, environmental mitigation |

### Estimated Annual Compliance Cost

For a platform vessel operating in PNW waters:
- **Flag-state compliance:** $200-400K/yr (surveys, certificates, manning)
- **Environmental compliance:** $100-300K/yr (monitoring, permits, mitigation)
- **Jones Act premium:** $2-6M/yr additional crew cost if domestic trade classification applies
- **Regulatory uncertainty premium:** Insurance and legal reserve of 5-10% of operating budget

---

## 11. Cross-References

| Topic | Related Module | Related Projects |
|---|---|---|
| Vessel as compute platform | [M1: Compute Costs](01-compute-cost-analysis.md) | MCM, NND |
| Vessel fuel from BPA hydro | [M2: Energy Infrastructure](02-energy-infrastructure.md) | THE, HGE |
| Hull co-location credit | [M4: Convergence Credits](04-convergence-credits.md) | ACC, ROF |
| Vessel fleet in scenarios | [M5: Scenario Comparison](05-scenario-comparison.md) | OCN |
| Fuel cost sensitivity | [M6: Risk Analysis](06-sensitivity-risk-analysis.md) | WSB |

---

## 12. Sources

1. FreightAmigo. "How Much Does a Container Ship Cost? Complete Guide 2024." FreightAmigo, 2024.
2. Bearcat Express. "Vessel Acquisition: New-Build vs. Second-Hand Economics." 2026.
3. Drewry Shipping Consultants. *Ship Operating Costs Annual Review 2024/25.* Drewry, 2024.
4. Moore Stephens. *OpCost: Ship Operating Cost Benchmarking.* 2024.
5. Kretschmann et al. "Analyzing the Economic Benefit of Unmanned Autonomous Ships." *Transportation Research Part D.* ScienceDirect, 2017.
6. Jones Act (46 U.S.C. 55102). Merchant Marine Act of 1920, Section 27.
7. Ship & Bunker. *Global Bunker Price Index 2024.* shipandbunker.com, 2024.
8. International Maritime Organization. *IMO 2023 GHG Strategy.* IMO MEPC 80, 2023.
9. U.S. Department of Energy. *Hydrogen Shot: Clean Hydrogen Cost Target.* DOE, 2024.
10. MDPI. "Costs and Benefits of Autonomous Shipping -- A Literature Review." *Applied Sciences* 11(10), 2021.
11. International Group of P&I Clubs. *Annual Review 2024.* IG P&I, 2024.
12. DNV. *Rules for Classification of Ships.* DNV-RU-SHIP, 2024.
13. Northwest Seaport Alliance. *Annual Report and Container Statistics 2023.* NWSA, 2024.
14. Port of Portland. *Terminal 6 Annual Review.* 2024.
15. U.S. Environmental Protection Agency. *Vessel General Permit (VGP) for Discharges.* EPA, 2023.
16. Accio.com. "Container Ship Market: Ultra-Large Vessel Pricing." Market Data, 2024.
17. Washington State Department of Ecology. *Coastal Zone Management Program.* 2024.
