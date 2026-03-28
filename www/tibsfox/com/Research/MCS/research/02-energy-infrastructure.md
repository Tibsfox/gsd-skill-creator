# Energy Infrastructure Costs

> **Domain:** Maritime Infrastructure Economics
> **Module:** 2 -- Offshore Wind, Subsea Cable, and Hydro Power Economics
> **Through-line:** *Power follows the path of least resistance, and so does money. The BPA dam at Grand Coulee delivers electricity at $0.02/kWh because the Columbia River does the work for free. Offshore wind at $4,000+/kW is expensive because floating steel in deep water is hard. The subsea cable connecting them costs $0.5-5M per kilometer because the ocean floor is unforgiving. This module maps the energy spine economics from shore anchor to offshore node.*

---

## Table of Contents

1. [Offshore Wind: CAPEX and LCOE](#1-offshore-wind-capex-and-lcoe)
2. [Fixed vs. Floating: Technology Comparison](#2-fixed-vs-floating-technology-comparison)
3. [Wind CAPEX Trajectory 2024-2035](#3-wind-capex-trajectory-2024-2035)
4. [Subsea Power Cable Costs](#4-subsea-power-cable-costs)
5. [HVAC vs. HVDC Break-Even](#5-hvac-vs-hvdc-break-even)
6. [Cable Installation Economics](#6-cable-installation-economics)
7. [Communication Fiber Economics](#7-communication-fiber-economics)
8. [BPA Hydro Anchor Economics](#8-bpa-hydro-anchor-economics)
9. [Grid Interconnect Costs](#9-grid-interconnect-costs)
10. [PNW Offshore Wind Resources](#10-pnw-offshore-wind-resources)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Offshore Wind: CAPEX and LCOE

Offshore wind is the primary renewable generation source for the maritime platform's offshore nodes. Cost data from IRENA, NREL, and Wood Mackenzie provide the benchmark framework [1][2][3].

| Technology | CAPEX/kW | LCOE | Source |
|---|---|---|---|
| Fixed-bottom offshore wind | $2,852/kW | $79/MWh | IRENA 2024 |
| Fixed offshore (Wood Mackenzie) | -- | $230/MWh | Wood Mackenzie 2024 |
| Floating offshore (current) | $4,000+/kW | $320/MWh | Wood Mackenzie 2024 |
| Floating (WindFloat Atlantic pilot) | -- | $112/MWh | MDPI FOW Review 2024 |
| DOE Floating Wind Shot target | -- | $45/MWh | DOE NREL 2024 (by 2035) |
| ETIPWind target at 20 GW capacity | -- | EUR 40-80/MWh | SINTEF/NorthWind 2024 |
| Onshore wind (benchmark) | -- | $75/MWh | Wood Mackenzie 2024 |
| BPA Grand Coulee hydro | -- | $0.02/kWh ($20/MWh) | BPA FY2024 rates |

The spread between IRENA's $79/MWh and Wood Mackenzie's $230/MWh for fixed-bottom offshore wind reflects methodological differences: IRENA uses global weighted averages including low-cost Chinese installations, while Wood Mackenzie focuses on Western market project costs including financing, permitting, and transmission [1][3].

**Capacity factors:** Modern fixed-bottom offshore wind reaches 40-60% capacity factor (IRENA 2024). North Sea installations routinely achieve 45-55%. PNW offshore wind resources are less developed but NREL estimates 40-50% capacity factors for the Oregon-Washington coast [4].

---

## 2. Fixed vs. Floating: Technology Comparison

The PNW continental shelf drops steeply, with depths exceeding 60 meters within 10-20 nautical miles of shore. This limits fixed-bottom technology (economical to ~60m depth) and favors floating platforms for PNW deployment [4][5].

| Parameter | Fixed-Bottom | Floating |
|---|---|---|
| Maximum depth | ~60m | 60-1,000m+ |
| Foundation type | Monopile, jacket, gravity | Spar, semi-sub, TLP, barge |
| CAPEX/kW (2024) | $2,852 (IRENA) | $4,000+ (Wood Mac) |
| Installation complexity | Moderate | High (tow-out, mooring) |
| Decommissioning | Complex (pile extraction) | Simpler (tow to shore) |
| PNW suitability | Limited (narrow shelf) | Primary option |

**Floating wind technology status:** As of 2024, global floating wind capacity is approximately 260 MW across a handful of pilot projects (Hywind Scotland 30 MW, WindFloat Atlantic 25 MW, Kincardine 50 MW, and several Asian demonstrations). Commercial-scale floating wind farms (500 MW+) are not expected before 2028-2030 [5].

> **CAUTION:** Floating wind cost projections (DOE $45/MWh by 2035) are targets, not demonstrated costs. Current floating LCOE of $112-320/MWh reflects pilot-scale economics. The projected 60-85% cost reduction requires supply chain maturation, standardized floating foundations, and serial manufacturing that does not yet exist at scale.

---

## 3. Wind CAPEX Trajectory 2024-2035

Global weighted average installed cost for offshore wind has fallen 62% between 2010 and 2024 (IRENA 2024). Total installed offshore wind capacity grew from 3.1 GW in 2010 to 82.9 GW in 2024 [1].

### Learning Curve

Offshore wind follows an approximate 12-15% learning rate (cost reduction per doubling of cumulative capacity). With current global capacity at ~83 GW, the next doubling to ~166 GW is projected by 2028-2029 [1][6].

### Supply Chain Dynamics

Chinese offshore wind turbine manufacturers offer equipment at $300,000/MW (SINTEF October 2024), compared to European land-based turbines at $1,400/MW. This 80% cost differential demonstrates the impact of supply chain maturity and manufacturing scale -- though Western markets face trade barriers, certification requirements, and local content mandates that limit direct price transfer [6].

### DOE Floating Wind Shot

The U.S. Department of Energy's Floating Offshore Wind Shot targets $45/MWh LCOE by 2035 through:
- Standardized floating platform designs enabling serial manufacturing
- Larger turbines (15-20 MW) reducing foundation cost per MW
- Industrialized mooring and anchoring systems
- Port infrastructure investment for assembly and deployment [4]

**Platform implication:** At $45/MWh, floating offshore wind becomes competitive with natural gas generation ($40-70/MWh) and approaches BPA hydro economics for offshore generation. The maritime platform's energy economics improve significantly if the 2035 target is achieved.

---

## 4. Subsea Power Cable Costs

Subsea power cables represent the infrastructure spine of the maritime platform, connecting offshore generation, compute nodes, and the shore anchor. Cost varies dramatically by voltage class, water depth, and seabed conditions [7][8][9].

| Cable Type | Installed Cost/km | Notes / Source |
|---|---|---|
| HVAC medium voltage (<150 kV) | $0.5-2.0M/km | Short, shallow, protected routes (Industry data 2024) |
| HVDC (+/-100-300 kV) | $1.0-4.0M/km | Standard interconnectors (Industry data 2024) |
| Complex / erratic seabed | $3.0-5.0M/km | Deep water, rocky terrain (Thunder Said Energy 2023) |
| Offshore wind inter-array | $0.5M/km | Within-farm cabling (Thunder Said Energy 2023) |
| Subsea power cable (general) | $2.5M+/km | OilPrice.com 2023 |
| EuroAsia Interconnector | $0.74M/km | 1,208 km at $900M (Submarine Networks 2021) |

### Cost Components

Subsea cable installed cost includes three major components:
- **Cable manufacturing:** 30-50% of total. Conductor (copper or aluminum), insulation (XLPE), armoring (steel wire), and sheath
- **Installation:** 40-60% of total. Vessel mobilization, cable laying, burial, and jointing
- **Route survey and permitting:** 5-15% of total. Seabed survey, environmental assessment, crossing agreements [7][8]

### Real-Project Benchmarks

| Project | Length | Cost | Cost/km | Notes |
|---|---|---|---|---|
| EuroAsia Interconnector | 1,208 km | $900M | $0.74M/km | HVDC, Mediterranean, deep water |
| NordLink (Norway-Germany) | 623 km | ~$2.4B | $3.9M/km | HVDC 525 kV, North Sea |
| Viking Link (UK-Denmark) | 765 km | ~$2.2B | $2.9M/km | HVDC 525 kV |
| North Sea Link (Norway-UK) | 720 km | ~$2.3B | $3.2M/km | HVDC 525 kV, deepest subsea link |
| Basslink (Australia) | 370 km | ~$0.8B | $2.2M/km | HVDC 400 kV, Bass Strait |

---

## 5. HVAC vs. HVDC Break-Even

AC cables are economical for distances under approximately 80-100 km; beyond that, HVDC becomes cost-effective despite higher converter station costs. The break-even point depends on cable rating, reactive compensation requirements, and converter station technology [10].

```
HVAC vs. HVDC COST BREAK-EVEN
================================================================

Cost
  ^
  |      HVAC (cable + reactive compensation)
  |     /
  |    /          HVDC (cable + converter stations)
  |   /          /
  |  /          /
  | /     ____/
  |/ ____/
  |/___________________________> Distance (km)
  0    40    80    120   160   200

  Break-even zone: ~80-100 km
  HVAC: Lower terminal cost, higher per-km cost (reactive losses)
  HVDC: Higher terminal cost ($150-300M per converter station pair),
        lower per-km cost (no reactive losses)
```

**Platform implication:** The shore-to-offshore link from Electric City to the PNW coast (~280 km) clearly requires HVDC. Within an offshore compute cluster, short inter-node links may use HVAC [10][11].

### Converter Station Costs

HVDC converter stations (voltage source converter technology) cost approximately $150-300M per pair, depending on power rating and technology generation. This fixed cost is why HVDC is uneconomical for short distances but dominant for long subsea routes [10].

---

## 6. Cable Installation Economics

Cable installation is frequently the cost-controlling factor in complex subsea routes. The specialized vessel fleet and weather-dependent scheduling create significant cost variability [8].

### Vessel Day Rates

- **Cable installation vessel:** $150,000-300,000/day charter rate
- **State-of-the-art vessels:** Prysmian's *Leonardo da Vinci* cost $200M to build, lays up to 2.1 km/hour in depths up to 3,000 meters
- **Weather downtime:** North Pacific installations face 30-50% weather downtime in winter (November-March), effectively doubling seasonal installation costs [8]

### Installation Speed

- **Open ocean, flat seabed:** 1.5-2.5 km/hour
- **Complex seabed, burial required:** 0.5-1.0 km/hour
- **Rock cutting/trenching:** 0.1-0.3 km/hour
- **Landfall / shore approach:** 50-200 meters/day (horizontal directional drilling)

### PNW Installation Challenges

The PNW coast presents above-average installation difficulty:
- **Steep continental shelf:** Depths exceed 200m within 30 nautical miles
- **Rocky seabed:** Volcanic basalt substrate along Oregon-Washington coast
- **Weather window:** Reliable installation season is May-September only
- **Crossing zones:** Multiple existing cable and pipeline crossings near port approaches

> **Related:** [Convergence Credits](04-convergence-credits.md) for cable bundle dual-use savings; [Scenario Comparison](05-scenario-comparison.md) for cable cost in platform scenarios

---

## 7. Communication Fiber Economics

Submarine communication cables cost $30,000-50,000 per km (OilPrice.com 2023 / Thematica) -- two orders of magnitude cheaper than power cables [9].

### Dual-Use Opportunity

Bundling power and fiber in the same cable trench provides installation cost savings even if the cables are physically separate systems. The trench is the expensive part (vessel mobilization, burial equipment, route survey), and the marginal cost of a second cable in an existing trench is approximately 15-25% of the first cable's installation cost [8].

### Existing PNW Submarine Fiber

Multiple submarine fiber cables land on the PNW coast:
- **PC-1 (Pacific Crossing):** Japan to Harbour Pointe, WA
- **FASTER:** Japan to Bandon, OR
- **Multiple trans-Pacific cables** through the Pacific Gateway complex

The existing fiber infrastructure provides data backhaul options for the maritime platform that reduce the urgency of new submarine data cable construction [12].

---

## 8. BPA Hydro Anchor Economics

The Bonneville Power Administration (BPA) provides the foundation power economics for the maritime platform. Grand Coulee Dam, the largest hydroelectric facility in the US, anchors the Electric City compute location [13].

### Power Cost

- **BPA wholesale rate:** approximately $0.02/kWh (FY2024)
- **US grid average:** approximately $0.12/kWh (EIA 2024)
- **Cost advantage:** $0.10/kWh, or $876,000/MW/year at 100% utilization

### Scale Economics

| Scale | Annual Power Cost (BPA) | Annual Power Cost (Grid Avg) | Annual Savings |
|---|---|---|---|
| 5 MW prototype | $876K | $5.3M | $4.4M |
| 100 MW regional | $17.5M | $105M | $87.5M |
| 500 MW corridor | $87.6M | $526M | $438M |

At 500 MW scale, the BPA power cost advantage delivers $438M annually compared to US grid average pricing. Over a 20-year platform life, this represents $8.76B in power savings before discounting -- the single largest economic driver in the platform model [13][14].

### Reliability

BPA hydro achieves >95% availability with capacity factors of 30-40% (seasonal variation due to snow melt). Combined with the Federal Columbia River Power System's 31 dams, the generation portfolio provides baseload reliability superior to any single-source generation [13].

---

## 9. Grid Interconnect Costs

Connecting the maritime platform to the BPA grid at Electric City requires:

- **Substation upgrade:** $10-30M depending on existing capacity and voltage transformation requirements
- **HVDC converter station:** $150-300M per pair for the shore-to-offshore link
- **Grid tie agreements:** BPA interconnection queue timelines of 2-5 years (2024)
- **Transmission upgrade (if needed):** $1-5M per mile for new HVDC overland transmission

**Total grid interconnect estimate:** $30-50M for the 100 MW regional scenario, scaling approximately logarithmically (not linearly) with capacity due to shared converter infrastructure [10][14].

---

## 10. PNW Offshore Wind Resources

NREL's offshore wind resource assessment identifies the Oregon-Washington coast as having significant wind resources, though less developed than the North Sea or US Atlantic [4][15].

### Resource Characteristics

- **Average wind speed:** 8-10 m/s at 100m hub height (NREL 2024)
- **Capacity factor estimate:** 40-50% for fixed-bottom, 35-45% for early floating
- **Water depth:** 60-200m within BOEM lease areas (requires floating technology)
- **Grid connection distance:** 20-50 nautical miles to shore

### Development Status

As of 2024, no offshore wind installations exist off the PNW coast. BOEM has identified two Wind Energy Areas off Oregon (Brookings and Coos Bay), with lease auctions projected for 2025-2026. Washington state has not yet identified offshore wind lease areas [15].

**Platform implication:** PNW offshore wind is a 2030+ energy source for the maritime platform. Early-phase deployment must rely on the BPA hydro anchor with subsea cable delivery to offshore nodes [4][15].

---

## 11. Cross-References

| Topic | Related Module | Related Projects |
|---|---|---|
| Compute power requirements | [M1: Compute Costs](01-compute-cost-analysis.md) | MCM, NND |
| Cable as convergence credit | [M4: Convergence Credits](04-convergence-credits.md) | OCN, ROF |
| Energy cost in scenarios | [M5: Scenario Comparison](05-scenario-comparison.md) | ACC, HGE |
| Wind cost sensitivity | [M6: Risk Analysis](06-sensitivity-risk-analysis.md) | THE |
| Vessel fuel transition | [M3: Transport Economics](03-maritime-transport-economics.md) | OCN |

---

## 12. Sources

1. International Renewable Energy Agency (IRENA). *Renewable Power Generation Costs in 2024.* IRENA, Abu Dhabi, 2024.
2. U.S. Department of Energy / NREL. *Cost of Wind Energy Review: 2024 Edition.* NREL/TP-5000-91775, 2025.
3. Wood Mackenzie. *Global LCOE Reports: Wind and Solar 2024.* WoodMac, October 2024.
4. NREL. *Annual Technology Baseline (ATB): Offshore Wind 2024.* atb.nrel.gov, 2024.
5. MDPI. "Development and Analysis of a Global Floating Wind Levelised Cost of Energy Map." *Clean Technologies* 6(3), September 2024.
6. SINTEF / NorthWind. "Floating Wind Can Be Cheaper Than Expected." SINTEF Blog, January 2025.
7. Thunder Said Energy. *Database of Cable Installation Vessels, Costs.* TSE, 2023.
8. Prysmian Group. *Submarine Cable Installation: Technical Capabilities.* 2024.
9. OilPrice.com. "Subsea Power Cables: The Future of Global Energy Transport." December 2023.
10. ESRU, University of Strathclyde. *HVAC vs. HVDC Transmission: Break-Even Distance Analysis.* 2023.
11. ABB / Hitachi Energy. *HVDC Technology: Converter Station Design Guide.* 2024.
12. TeleGeography. *Submarine Cable Map 2024.* telegeography.com, 2024.
13. Bonneville Power Administration. *Wholesale Power Rates and Financial Overview.* BPA, FY2024.
14. U.S. Energy Information Administration. *Electric Power Monthly: Average Retail Price.* EIA, 2024.
15. Bureau of Ocean Energy Management. *Oregon Offshore Wind Energy Areas.* BOEM, 2024.
16. Norwegian Public Roads Administration (NPRA). *E39 Coastal Highway Project -- Subsea Infrastructure Studies.* 2019-2024.
