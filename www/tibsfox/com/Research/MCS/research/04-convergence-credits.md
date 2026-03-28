# Convergence Credit Model

> **Domain:** Maritime Infrastructure Economics
> **Module:** 4 -- Shared Infrastructure Savings and Dual-Use Quantification
> **Through-line:** *The Amiga's genius was not in any single chip. It was in how the chips shared the bus. Agnus, Denise, and Paula each performed specialized work, but they shared DMA channels, memory bandwidth, and clock cycles in ways that made the whole system faster than the sum of its parts. A maritime platform that shares cables, hulls, cooling water, and port infrastructure across compute, energy, and transport functions follows the same principle -- and the savings are the convergence credits that make integrated deployment cheaper than standalone.*

---

## Table of Contents

1. [Convergence Credit Framework](#1-convergence-credit-framework)
2. [C1: Ocean Cooling Credit](#2-c1-ocean-cooling-credit)
3. [C2: Cable Bundle Dual-Use](#3-c2-cable-bundle-dual-use)
4. [C3: Vessel Hull Co-Location](#4-c3-vessel-hull-co-location)
5. [C4: Shared Port Logistics](#5-c4-shared-port-logistics)
6. [C5: BPA Hydro Power Advantage](#6-c5-bpa-hydro-power-advantage)
7. [Net Convergence Credit by Scale](#7-net-convergence-credit-by-scale)
8. [Credit Interaction Effects](#8-credit-interaction-effects)
9. [Accounting Methodology](#9-accounting-methodology)
10. [Limitations and Caveats](#10-limitations-and-caveats)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Convergence Credit Framework

A convergence credit is a quantified cost reduction that arises when infrastructure serves multiple functions simultaneously. Unlike economies of scale (which reduce unit cost through volume), convergence credits reduce system cost through architectural integration -- shared physical media serving multiple roles [1].

### Credit Taxonomy

| Credit ID | Type | Applies To | Mechanism |
|---|---|---|---|
| C1 | CAPEX + OPEX | Compute | Ocean provides free cooling, eliminating chiller plant |
| C2 | CAPEX | Cable infrastructure | Single trench serves both power and data |
| C3 | CAPEX | Vessel/platform | Hull already amortized by cargo function |
| C4 | OPEX | Port operations | Berth, crane, and service infrastructure shared |
| C5 | OPEX | Power cost | BPA hydro at $0.02/kWh vs. grid average $0.12/kWh |

### Measurement Principle

Each credit is calculated as the difference between:
- **Standalone cost:** Building each function (compute, energy, transport) as independent infrastructure
- **Integrated cost:** Building the same functions on a shared maritime platform

The convergence credit = standalone cost - integrated cost. Positive credit means the integrated platform is cheaper [1].

> **SAFETY WARNING:** Convergence credits are estimates based on component-level cost data applied to an integrated system that does not yet exist at scale. No maritime compute-energy-transport platform has been built and operated. Credits represent engineering-informed projections, not demonstrated savings. All credit ranges should be interpreted as planning estimates subject to validation through prototype deployment.

---

## 2. C1: Ocean Cooling Credit

**Credit type:** CAPEX elimination + OPEX reduction
**Applies to:** Compute nodes (offshore and vessel-mounted)
**Estimated value:** $1-2M/MW CAPEX, $0.5-1M/MW/year OPEX

### Derivation

The ocean cooling credit eliminates the mechanical cooling infrastructure required by shore-based data centers [2][3]:

**CAPEX component:**
- Shore-based data center MEP = 50% of $10M/MW = $5M/MW
- Cooling systems = 20-40% of MEP = $1-2M/MW
- Ocean deployment eliminates 100% of mechanical cooling CAPEX
- **C1 CAPEX credit: $1-2M/MW**

**OPEX component:**
- Shore-based cooling electricity = 15-20% of total facility power
- At 100 MW facility paying $0.10/kWh: cooling power = $13-17.5M/year
- Ocean cooling reduces to seawater pump power (~2-5% of cooling load equivalent)
- **C1 OPEX credit: $0.5-1M/MW/year**

### Scale Application

| Scale | CAPEX Credit | Annual OPEX Credit | 20-Year OPEX Credit |
|---|---|---|---|
| 5 MW prototype | $5-10M | $2.5-5M | $50-100M |
| 100 MW regional | $100-200M | $50-100M | $1-2B |
| 500 MW corridor | $500M-1B | $250-500M | $5-10B |

The C1 credit is the most reliable convergence credit because it is based on well-documented cooling infrastructure costs and straightforward physics (ocean water temperature vs. server inlet temperature) [2].

> **Related:** [Compute Cost Analysis](01-compute-cost-analysis.md) Section 4 for detailed cooling credit derivation

---

## 3. C2: Cable Bundle Dual-Use

**Credit type:** CAPEX reduction on cable installation
**Applies to:** Subsea cable infrastructure
**Estimated value:** 20-30% reduction on cable installation cost

### Derivation

The maritime platform requires both subsea power cables and communication fiber. Installing these in the same trench (even as separate physical cables) eliminates redundant:
- Vessel mobilization ($150,000-300,000/day, 2-4 weeks per campaign)
- Route survey and seabed preparation (same route serves both)
- Permitting and crossing agreements (single process, not two)
- Post-lay inspection and burial (one pass, not two) [4][5]

**Savings estimate:**
- Power cable installation cost: $0.5-2.5M/km (installation portion only)
- Fiber cable installation cost: $15-25K/km (installation portion -- cable itself is cheap)
- Combined installation: 70-80% of power cable installation cost + marginal fiber cost
- **C2 credit: 20-30% of total cable installation budget**

### Scale Application

| Scale | Cable Length | Standalone Install | Bundled Install | C2 Credit |
|---|---|---|---|---|
| 5 MW (50 km) | 50 km | $30-60M | $21-48M | $6-18M |
| 100 MW (300 km) | 300 km | $180-360M | $126-288M | $36-108M |
| 500 MW (10,000+ km) | 10,000 km | $6-12B | $4.2-9.6B | $1.2-3.6B |

### Limitations

C2 assumes both cables can physically share the same trench. In some seabed conditions (hard rock, steep gradient), the power cable route may not be optimal for fiber, reducing the bundling opportunity. Additionally, the power cable's electromagnetic field may require minimum separation distances from the fiber cable [4][5].

---

## 4. C3: Vessel Hull Co-Location

**Credit type:** CAPEX reduction on floating compute platform
**Applies to:** Vessel-mounted compute nodes
**Estimated value:** 40-60% reduction on floating platform structure cost

### Derivation

A standalone floating compute platform requires:
- Purpose-built hull or barge: $30-100M depending on size and classification
- Mooring system: $5-20M for deep-water permanent mooring
- Marine engineering and classification: $5-10M

A cargo vessel that already serves a logistics/transport function provides the hull, propulsion, power generation, and maritime certification as part of its cargo economics. The compute payload occupies cargo space that generates revenue per TEU-mile in its non-compute configuration [1][6].

**Savings estimate:**
- Standalone floating platform (equivalent to 5,000 TEU vessel hull): $40-80M
- Vessel acquisition for dual cargo/compute: $80-100M (but already justified by cargo revenue)
- Allocated compute platform cost: $0-40M (depending on cargo revenue offset)
- **C3 credit: 40-60% of floating platform structural cost**

### Accounting Note

C3 is the most complex credit to quantify because it depends on the opportunity cost of cargo capacity displaced by compute containers. A vessel carrying 40 compute containers in a 5,000 TEU hold displaces cargo revenue of approximately $2,000-5,000/TEU per voyage. The credit calculation must net this displaced revenue against the platform infrastructure savings [6].

---

## 5. C4: Shared Port Logistics

**Credit type:** OPEX reduction on port infrastructure
**Applies to:** Shore-side port operations
**Estimated value:** 15-25% reduction on port OPEX

### Derivation

A maritime compute platform requires port infrastructure for:
- Berth space for vessel docking and shore power connection
- Crane access for compute container loading/unloading
- Workshop and storage for compute equipment maintenance
- Fuel and provisioning services

A dedicated compute-only port facility would require all these independently. By co-locating with an existing cargo port (Seattle, Tacoma, Portland), the platform shares [7][8]:
- Berth infrastructure (tugs, pilots, line handlers)
- Crane and heavy-lift equipment
- Security, fire, and environmental response
- Administrative and regulatory interfaces

**Savings estimate:**
- Dedicated port facility OPEX: $5-15M/year (at 100 MW scale, 5 vessels)
- Shared port facility OPEX: $3.75-12.75M/year (15-25% reduction through shared services)
- **C4 credit: $0.75-3.75M/year at 100 MW scale**

### Scale Sensitivity

C4 is proportionally smaller at large scale because a 500 MW platform with 20+ vessels may require dedicated berths regardless. At prototype scale (1 vessel), shared port economics are most favorable [7].

---

## 6. C5: BPA Hydro Power Advantage

**Credit type:** OPEX reduction on electricity cost
**Applies to:** All compute operations receiving cable-delivered BPA power
**Estimated value:** $0.10/kWh savings vs. US grid average

### Derivation

The BPA hydro advantage is not strictly a convergence credit (it exists for any load located at Electric City), but it becomes a platform-level advantage when:
- Shore-based compute at Electric City runs at $0.02/kWh
- Offshore compute receives cable-delivered BPA power at $0.02/kWh + cable losses + cable OPEX
- The net delivered cost to offshore nodes is estimated at $0.03-0.05/kWh (depending on cable length and losses) [9][10]

### Scale Application

| Scale | Compute Load | Annual Power Cost (BPA) | Annual Power Cost (Grid) | C5 Credit |
|---|---|---|---|---|
| 5 MW | 5 MW | $876K | $5.26M | $4.38M/yr |
| 100 MW | 100 MW | $17.5M | $105M | $87.5M/yr |
| 500 MW | 500 MW | $87.6M | $526M | $438M/yr |

### 20-Year NPV of C5

| Scale | C5 Annual | 20-Year Undiscounted | 20-Year NPV (8%) |
|---|---|---|---|
| 5 MW | $4.38M | $87.6M | $43.0M |
| 100 MW | $87.5M | $1.75B | $859M |
| 500 MW | $438M | $8.76B | $4.30B |

C5 is the single largest credit in the platform economics. It is also the most sensitive to cable infrastructure costs -- if the cable CAPEX and OPEX required to deliver BPA power offshore exceeds the power cost savings, the credit inverts [9][10].

> **Related:** [Energy Infrastructure](02-energy-infrastructure.md) Section 8 for BPA hydro economics detail

---

## 7. Net Convergence Credit by Scale

Combining all five credits at each deployment scale:

### Prototype (5 MW)

| Credit | CAPEX | Annual OPEX | 20-Year OPEX |
|---|---|---|---|
| C1: Ocean cooling | $5-10M | $2.5-5M | $50-100M |
| C2: Cable bundle | $6-18M | -- | -- |
| C3: Hull co-location | $16-48M | -- | -- |
| C4: Shared port | -- | $0.2-0.5M | $4-10M |
| C5: BPA power | -- | $4.38M | $87.6M |
| **Total** | **$27-76M** | **$7.1-9.9M** | **$142-198M** |

### Regional (100 MW)

| Credit | CAPEX | Annual OPEX | 20-Year OPEX |
|---|---|---|---|
| C1: Ocean cooling | $100-200M | $50-100M | $1-2B |
| C2: Cable bundle | $36-108M | -- | -- |
| C3: Hull co-location | $80-240M (5 vessels) | -- | -- |
| C4: Shared port | -- | $0.75-3.75M | $15-75M |
| C5: BPA power | -- | $87.5M | $1.75B |
| **Total** | **$216-548M** | **$138-191M** | **$2.77-3.83B** |

**Net CAPEX credit as % of standalone:** 18-28% (matching the source material estimate from the vision document) [1].

### Full Corridor (500 MW)

| Credit | CAPEX | Annual OPEX | 20-Year OPEX |
|---|---|---|---|
| C1: Ocean cooling | $500M-1B | $250-500M | $5-10B |
| C2: Cable bundle | $1.2-3.6B | -- | -- |
| C3: Hull co-location | $320M-960M (20 vessels) | -- | -- |
| C4: Shared port | -- | $3-10M | $60-200M |
| C5: BPA power | -- | $438M | $8.76B |
| **Total** | **$2.02-5.56B** | **$691M-948M** | **$13.8-19.0B** |

---

## 8. Credit Interaction Effects

Convergence credits are not fully independent. Interaction effects reduce or amplify certain credits when combined [1]:

### Positive Interactions (Credits amplify each other)

- **C1 + C3:** Ocean cooling (C1) is only available because the compute is vessel-mounted (C3). The hull co-location enables the cooling credit
- **C2 + C5:** Cable bundling (C2) reduces the cost of delivering BPA power (C5) to offshore nodes. Lower cable cost means C5 reaches break-even at shorter distances

### Negative Interactions (Credits partially offset)

- **C3 vs. C5:** Vessel-mounted compute (C3) runs on onboard generators when not connected to shore power, reducing the C5 benefit. Full C5 credit requires cable-delivered power, which requires cable infrastructure investment
- **C4 at scale:** At 500 MW with 20+ vessels, the "shared" port advantage (C4) diminishes because the platform may dominate port capacity, requiring dedicated infrastructure regardless

### Net Interaction Effect

The interaction effects approximately cancel at the 100 MW regional scale, where the credit estimates in Section 7 are most reliable. At prototype scale, positive interactions dominate (small system, maximum sharing). At corridor scale, negative interactions grow (infrastructure demand exceeds shared capacity) [1].

---

## 9. Accounting Methodology

### Standalone Cost Baseline

The standalone baseline assumes each platform function is built independently:
- Compute: Shore-based data center at $10-12M/MW with grid power
- Energy: Dedicated offshore wind farm with separate cable to shore
- Transport: Standard cargo vessel fleet with no compute payload
- Port: Separate facilities for each function

### Integrated Cost

The integrated cost assumes the maritime platform architecture from the vision document:
- Compute nodes on vessel hulls with ocean cooling
- Power and data cables in shared trenches
- Vessels serving both cargo and compute roles
- Port infrastructure shared across all functions

### Credit Calculation

Credit = Standalone Cost - Integrated Cost

Credits are calculated at the component level and aggregated at the platform level. Double-counting is avoided by assigning each cost item to exactly one credit category [1].

---

## 10. Limitations and Caveats

1. **No operational precedent.** No maritime compute-energy-transport platform has been built. All credits are engineering estimates based on component-level data applied to an integrated architecture
2. **Marine premium uncertainty.** The +30-50% marine structural premium (which offsets C1) is estimated from offshore oil & gas and FPSO experience, not from maritime compute-specific projects
3. **Regulatory risk.** Jones Act compliance, coastal zone permits, and maritime classification for novel vessel uses could add costs not captured in the credit model
4. **Scale-dependent validity.** Credits are most reliable at the 100 MW regional scale. Prototype and corridor scales have higher uncertainty
5. **Cable loss not modeled.** C5 (BPA power advantage) does not deduct transmission losses on the subsea cable, which could reduce the net credit by 3-8% depending on cable length and voltage

> **SAFETY WARNING:** Convergence credit estimates should not be used as the sole basis for investment decisions. Independent engineering validation, detailed site-specific analysis, and risk-adjusted financial modeling (see M6) are required before committing capital based on these projections.

---

## 11. Cross-References

| Topic | Related Module | Related Projects |
|---|---|---|
| Ocean cooling detailed analysis | [M1: Compute Costs](01-compute-cost-analysis.md) | MCM, NND |
| Cable cost data | [M2: Energy Infrastructure](02-energy-infrastructure.md) | OCN, ROF |
| Vessel hull economics | [M3: Transport Economics](03-maritime-transport-economics.md) | WSB |
| Credits applied to scenarios | [M5: Scenario Comparison](05-scenario-comparison.md) | ACC |
| Credit sensitivity analysis | [M6: Risk Analysis](06-sensitivity-risk-analysis.md) | HGE |

---

## 12. Sources

1. Fox Infrastructure Group. *Maritime Platform Integrated Cost Model: Vision Document.* March 2026.
2. Cushman & Wakefield. *U.S. Data Center Development Cost Guide 2025.* C&W Research, 2025.
3. CBRE. *Data Center Construction Cost Benchmarks 2025.* CBRE Research, 2025.
4. Thunder Said Energy. *Database of Cable Installation Vessels, Costs.* TSE, 2023.
5. OilPrice.com. "Subsea Power Cables: The Future of Global Energy Transport." December 2023.
6. Drewry Shipping Consultants. *Ship Operating Costs Annual Review 2024/25.* Drewry, 2024.
7. Northwest Seaport Alliance. *Annual Report and Container Statistics 2023.* NWSA, 2024.
8. Port of Portland. *Terminal 6 Annual Review.* 2024.
9. Bonneville Power Administration. *Wholesale Power Rates and Financial Overview.* BPA, FY2024.
10. U.S. Energy Information Administration. *Electric Power Monthly: Average Retail Price.* EIA, 2024.
11. International Renewable Energy Agency (IRENA). *Renewable Power Generation Costs in 2024.* IRENA, 2024.
12. DNV. *Rules for Classification of Ships.* DNV-RU-SHIP, 2024.
13. ESRU, University of Strathclyde. *HVAC vs. HVDC Transmission: Break-Even Distance Analysis.* 2023.
14. Prysmian Group. *Submarine Cable Installation: Technical Capabilities.* 2024.
15. NOAA. *National Data Buoy Center: Station 46087 (Neah Bay, WA).* NOAA NDBC, 2024.
