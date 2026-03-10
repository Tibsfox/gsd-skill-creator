# Economics Cross-Thread: Integrated Techno-Economic Framework

> **Module ID:** X-ECON (Cross-reference prefix: X-ECON-xxx)
> **Domain:** Cross-Module Economic Synthesis -- Thermal & Hydrogen Energy Systems
> **Through-line:** *Every energy technology is ultimately an economic proposition.* A heat pump with COP 4.0 delivers four units of heat per unit of electricity, but the decision to install one depends on the price of that electricity, the capital cost of the equipment, the policy incentives in play, and the cost of the alternative it replaces. The same logic applies to waste heat recovery, green hydrogen, geothermal power, and every other technology examined in this research series. This module synthesizes the economic data from Modules A, B, E, and F into a unified framework that allows direct comparison across technologies, quantifies the Pacific Northwest's structural advantages, and maps the investment decision landscape from 2025 through 2050.

---

## Table of Contents

1. [Cost Metrics Unified](#1-cost-metrics-unified)
2. [PNW Energy Economics](#2-pnw-energy-economics)
3. [Investment Decision Framework](#3-investment-decision-framework)
4. [System-Level Economics](#4-system-level-economics)
5. [PNW Deployment Scenarios](#5-pnw-deployment-scenarios)
6. [Economic Barriers and Accelerators](#6-economic-barriers-and-accelerators)
7. [Key Findings](#7-key-findings)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. Cost Metrics Unified

### 1.1 The Comparison Problem

Energy technologies express their economics in fundamentally different units. Heat pumps report COP. Waste heat recovery systems quote payback periods in years. Hydrogen production uses LCOH in dollars per kilogram. Electricity generation uses LCOE in dollars per megawatt-hour. Comparing a heat pump to an ORC system to an electrolyzer requires translating all of these metrics into a common economic language.

This section establishes that common language by normalizing costs to two reference units: **dollars per delivered BTU** ($/BTU) for thermal energy applications and **dollars per kilowatt-hour equivalent** ($/kWh-eq) for electricity and electricity-equivalent applications. Where technologies span both domains (for example, waste heat converted to electricity via ORC, then used to power an electrolyzer), the full chain cost is traced through each conversion step.

### 1.2 COP -- Heat Pump Cost per Delivered BTU

The coefficient of performance (COP) is the ratio of useful heat delivered to electrical energy consumed (Module A, A-COP). A heat pump with COP 4.0 delivers 4 kWh of heat per 1 kWh of electricity input. The cost per delivered BTU depends on the electricity price and the COP:

```
Cost per delivered BTU = (Electricity price per kWh) / (COP x 3,412 BTU/kWh)
```

At PNW residential rates and typical system COP values:

| COP | Electricity Rate ($/kWh) | Cost per Delivered MMBtu | Comparison |
|-----|--------------------------|--------------------------|------------|
| 2.5 (cold day, ASHP) | $0.10 | $11.72 | Below gas furnace in most PNW markets |
| 3.0 (mild, ASHP) | $0.10 | $9.77 | Roughly half the cost of gas furnace |
| 3.5 (average season, ASHP) | $0.10 | $8.37 | Strongly favorable |
| 4.0 (GSHP or mild ASHP) | $0.10 | $7.33 | Ground-source territory |
| 4.5 (GSHP, optimal) | $0.10 | $6.51 | Best-case ground-source |
| 1.0 (electric resistance) | $0.10 | $29.31 | Reference: worst-case electric |
| 0.96 (96% gas furnace) | Gas $1.20/therm | $12.50 | PNW typical gas heating cost |

Sources: Module A (IEA-HP, EPA-ESTAR), Module F (EIA-WA)

The critical takeaway: in the PNW, where residential electricity rates average roughly $0.10/kWh and natural gas costs approximately $1.00-1.40 per therm, a heat pump operating at COP 3.0 or above delivers heat at roughly half the cost of a gas furnace. At COP 4.0 (achievable with ground-source systems or air-source systems in mild PNW weather), the cost advantage widens to approximately 40% below gas. This is before accounting for any carbon pricing or policy incentives.

Module A documents that PNW west-of-Cascades design temperatures of 23-24F allow air-source heat pumps to operate at higher average seasonal COP than in colder climates (Module A, Section 10). A Seattle or Portland heat pump spends the majority of heating hours at outdoor temperatures between 35-50F, where COP values of 3.5-5.0 are readily achievable with modern variable-speed equipment (Module A, Section 4).

### 1.3 WHR Payback Periods -- Cost per Recovered BTU

Waste heat recovery (WHR) technologies are evaluated primarily by their capital cost per unit of recovered energy and the resulting payback period -- the time required for avoided energy purchases to recoup the capital investment. Module B provides comprehensive cost data (Module B, Section 12.3).

**Heat-to-Heat Technologies (expressed per kW of recovered thermal energy):**

| Technology | Capital Cost Range | Typical Payback | Effective $/MMBtu (avoided fuel) |
|---|---|---|---|
| Recuperator | $5-30/kW recovered | 1-3 years | $0.15-0.88 |
| Economizer | $10-40/kW recovered | 1-2 years | $0.29-1.17 |
| Shell-and-tube HX | $20-80/kW recovered | 1-4 years | $0.59-2.34 |
| Plate HX | $15-60/kW recovered | 1-3 years | $0.44-1.76 |
| Heat pipe HX | $30-100/kW recovered | 2-5 years | $0.88-2.93 |
| Absorption heat pump | $300-800/kW heating | 3-7 years | $8.79-23.45 |

*Effective $/MMBtu calculation assumes 8,000 operating hours per year and a 15-year equipment life. These are annualized capital costs only; operating cost of recovered heat is near zero for passive systems.*

**Heat-to-Power Technologies (expressed per kW of electrical output):**

| Technology | Capital Cost Range | Typical Payback | Effective LCOE ($/kWh) |
|---|---|---|---|
| ORC system | $2,000-5,000/kWe | 3-7 years | $0.04-0.12 |
| Kalina cycle | $3,000-7,000/kWe | 5-10 years | $0.06-0.14 |
| TEG system | $20,000-50,000/kWe | 10+ years | $0.30-0.80+ |
| MVR system | $200-500/kW evaporative | 2-4 years | N/A (thermal output) |

*LCOE estimates assume 8,000 operating hours per year, 15-year lifetime, 3% O&M, and near-zero fuel cost (waste heat is free at the margin). These represent fully burdened capital recovery; the marginal cost of WHR electricity is near zero once the system is installed.*

Sources: Module B (DOE-WHR, JOUHARA, KOSMADAKIS)

The most significant economic signal in this data: simple heat exchangers (recuperators, economizers, plate exchangers) have payback periods of 1-3 years, making them no-regret investments for any industrial facility with accessible waste heat above 100C. The economic case weakens as conversion complexity increases -- ORC systems at 3-7 years are still attractive, but TEGs at 10+ years remain niche except where their zero-maintenance characteristic justifies the premium (remote monitoring stations, spacecraft, hazardous locations).

### 1.4 LCOH Trajectory -- Green Hydrogen Cost per Kilogram

The levelized cost of hydrogen (LCOH) captures the all-in production cost per kilogram including electricity, capital amortization, operations, maintenance, water, and stack replacement. Module E traces the LCOH trajectory from historical actuals to DOE targets (Module E, E-LCOH):

| Year / Target | LCOH ($/kg) | Key Driver | Source |
|---|---|---|---|
| 2018 (actual) | ~$6.00 | AWE CAPEX $1,200/kW; solar PV >$40/MWh | SCIDIR-H2 |
| 2020 (actual) | $4.00-6.00 | Wide regional variation | OIES-ET48 |
| 2024 (actual) | $3.00-4.00 | AWE CAPEX ~$800/kW; PV <$30/MWh (best sites) | SCIDIR-H2 |
| 2024 (PNW hydro) | $2.10-2.60 | BPA rates $25/MWh; PEM at 85% capacity factor | NREL-LCOH |
| 2026 (DOE target) | $2.00 | BIL-funded R&D and deployment | DOE-H2COST |
| 2030 (projection) | ~$3.00 (solar/wind) | Global average for well-sited renewables | OIES-ET48 |
| 2031 (DOE target) | $1.00 | Hydrogen Shot "1-1-1" goal | DOE-MYPP |
| 2050 (projection) | $1.00-2.00 | DNV long-range; manufacturing learning curves | OIES-ET48 |

The PNW-specific LCOH of $2.10-2.60/kg is already 25-45% below the 2024 global average of $3.00-4.00/kg. This advantage derives from three factors that Module E quantifies: BPA wholesale electricity at $25-35/MWh (vs. $40-60/MWh elsewhere), hydroelectric baseload enabling 80-95% electrolyzer capacity factor (vs. 15-30% for solar-only), and near-zero grid carbon intensity satisfying the highest tier of IRA Section 45V credits.

To convert LCOH into an energy-equivalent cost for comparison with other fuels:

| Fuel | Energy Content | Cost per Unit | Effective $/MMBtu |
|---|---|---|---|
| Green hydrogen ($2.35/kg PNW) | 120 MJ/kg (HHV) = 113,600 BTU/kg | $2.35/kg | $20.69 |
| Green hydrogen ($1.00/kg target) | 113,600 BTU/kg | $1.00/kg | $8.80 |
| Natural gas (PNW) | 100,000 BTU/therm | $1.20/therm | $12.00 |
| Diesel fuel | 138,490 BTU/gal | $4.00/gal | $28.88 |
| Gray hydrogen (SMR) | 113,600 BTU/kg | $1.00-1.80/kg | $8.80-15.85 |

At $2.35/kg, green hydrogen in the PNW is not yet cost-competitive with natural gas on a raw BTU basis ($20.69 vs. $12.00/MMBtu). However, two factors narrow or close the gap: the IRA Section 45V production tax credit of $3.00/kg brings the effective LCOH below zero (Module E, E-ECON), and carbon pricing under Washington's Climate Commitment Act adds $10-25/tonne CO2 to fossil fuel costs (Module B, Section 13.5), which translates to approximately $0.60-1.50/MMBtu additional cost on natural gas.

### 1.5 LCOE from Hydroelectric and Geothermal

The PNW's electricity generation costs establish the floor for all electrically-powered technologies in this framework.

**Hydroelectric LCOE:**

BPA wholesale power rates of $25-35/MWh ($0.025-0.035/kWh) for industrial customers represent the delivered cost of federal hydroelectric power. This is among the lowest electricity costs in the United States (Module F, Section 4.3). For context, the 2024 national average industrial electricity rate is approximately $0.08/kWh (EIA). BPA's cost-based rates are a function of the Columbia River system's massive capacity (22,000+ MW across 31 federal dams) amortized over decades of operation.

The FCRPS generates approximately $3-4 billion annually in wholesale power value at these rates (Module F, Section 6.4). The economic significance extends well beyond electricity: BPA's power sales revenue cross-subsidizes $500-700 million per year in fish and wildlife programs.

**Geothermal LCOE:**

Neal Hot Springs, the PNW's only commercial-scale geothermal power plant at 22 MW, operates as a binary-cycle ORC facility with approximately 90-95% capacity factor (Module F, Section 7.3). While project-specific LCOE data for Neal Hot Springs is not publicly disclosed, industry benchmarks for binary-cycle geothermal plants of similar scale place LCOE at $40-80/MWh, depending on well productivity and resource temperature.

The DOE's geothermal LCOE projections suggest that EGS technology, once commercialized, could achieve $45-75/MWh (GEO-RISE). At the Newberry Crater site, where resource temperatures exceed 300C at 3,000 meters (Module F, Section 8.2), higher-enthalpy production could push LCOE toward the lower end of this range. If Quaise Energy's millimeter-wave drilling technology matures as projected, accessing superhot resources (>400C) could further reduce per-well output costs (Module F, Section 8.3).

**Comparative LCOE Table:**

| Resource | PNW LCOE ($/MWh) | Capacity Factor | Dispatchable? |
|---|---|---|---|
| Federal hydroelectric (BPA) | $25-35 | 30-50% (storage dams) | Yes |
| Mid-Columbia PUD hydro (surplus) | $15-25 | Varies by season | Yes |
| Geothermal (conventional, Neal HS) | $40-80 | 90-95% | Yes |
| Geothermal (EGS, projected) | $45-75 | 90-95% | Yes |
| Columbia Gorge wind | $25-45 | 30-40% | No |
| Solar PV (eastern OR/WA) | $25-40 | 20-28% | No |
| Natural gas CCGT | $40-80 | On demand | Yes |
| Nuclear (Columbia Generating Stn) | $30-50 | 90-93% | Yes (limited ramp) |

Sources: Module F (EIA-WA, EIA-OR, GEO-RISE), Module E (OIES-ET48)

### 1.6 Unified Cost Comparison: $/BTU Delivered

The following table normalizes the primary technologies across Modules A, B, E, and F to a common $/MMBtu delivered basis, enabling direct comparison:

| Technology | Energy Form | Effective $/MMBtu Delivered | Capital Intensity | Notes |
|---|---|---|---|---|
| Heat pump (COP 3.5, $0.10/kWh) | Thermal | $8.37 | Moderate ($3,500-35,000) | Includes "free" ambient heat |
| Heat pump (COP 3.5, $0.04/kWh industrial) | Thermal | $3.35 | Moderate | PNW industrial rate advantage |
| Recuperator WHR | Thermal | $0.15-0.88 | Very low | Annualized capital only; near-zero marginal |
| Economizer WHR | Thermal | $0.29-1.17 | Very low | Proven, mature technology |
| ORC electricity (at $0.06/kWh) | Electrical | $17.58 | Moderate | Converted via 3,412 BTU/kWh |
| Green hydrogen (PNW, $2.35/kg) | Chemical | $20.69 | High | Includes storage flexibility premium |
| Green hydrogen (target, $1.00/kg) | Chemical | $8.80 | High | At DOE Hydrogen Shot target |
| Natural gas (PNW, $1.20/therm) | Thermal | $12.00 | Very low | Incumbent; no conversion losses |
| BPA hydroelectric ($0.03/kWh) | Electrical | $8.79 | Sunk (amortized) | Foundation of PNW cost advantage |

The unified comparison reveals a clear hierarchy. Direct waste heat recovery (recuperators, economizers, heat exchangers) is the cheapest energy source in the table by a wide margin -- well below $1/MMBtu on an annualized capital basis. Heat pumps powered by PNW electricity occupy the next tier at $3-8/MMBtu. Natural gas at ~$12/MMBtu sits in the middle. Green hydrogen at current prices ($20.69/MMBtu) is at the high end, reflecting its current role as a premium fuel for applications where electrification is not feasible (heavy transport, industrial feedstock, seasonal storage).

---

## 2. PNW Energy Economics

### 2.1 The Structural Advantage

The Pacific Northwest's energy economics are anchored by a single geological fact: the Columbia River drops 1,288 feet in elevation between its source and the Pacific Ocean, and the federal government spent decades building dams to capture that gravitational energy. The result is an electricity system that delivers wholesale power at $25-35/MWh -- roughly half the national average (Module F, Section 4.3).

This foundational advantage cascades through every technology in this research series:

- **Heat pumps** operate on cheaper electricity, reducing the already-favorable operating cost further below gas heating
- **Electrically-driven WHR** (MVR systems with COP of 8 at $0.04/kWh) displaces thermal energy at $1.40/MMBtu -- far below natural gas (Module B, Section 13.5)
- **Electrolyzers** produce hydrogen with an electricity component of approximately $1.65/kg at BPA rates, compared to $3.30/kg at national average rates (Module E, E-LCOH)
- **Grid-connected industrial processes** face lower operating costs, improving the payback on capital-intensive efficiency investments

### 2.2 BPA Rate Structure and Electrolyzer Economics

BPA's rate structure merits detailed examination because it defines the floor for PNW hydrogen production costs.

BPA sells power from federal dams at cost-based rates to preference customers (public utilities, cooperatives, tribal utilities) and at market rates to others (Module F, Section 4.3). The distinction matters:

| Rate Category | Typical Rate ($/MWh) | Availability | Relevance to Hydrogen |
|---|---|---|---|
| BPA Priority Firm (PF) | $25-35 | Preference customers | Baseline for PUD-sited electrolyzers |
| Mid-Columbia PUD surplus | $15-25 | Negotiated; seasonal | Douglas/Grant County spring surplus |
| BPA Industrial Firm | $30-40 | Large industrial loads | Direct BPA service territories |
| Market rate (spring surplus) | $0-20 | Spot market; variable | Curtailment-capture hydrogen production |
| Market rate (winter peak) | $40-80 | Spot market; variable | Avoid production during peaks |

Sources: Module E (E-PNW), Module F (F-HYDRO, F-GRID)

The most compelling hydrogen production economics arise during spring surplus periods (April-June), when snowmelt drives hydroelectric output to annual peaks simultaneously with strong Columbia Gorge winds (Module E, E-PNW; Module F, Section 5). During these periods, BPA has historically curtailed wind generation to manage grid frequency, and wholesale prices can fall to near zero. An electrolyzer operating during surplus periods at effectively $0-15/MWh electricity cost would produce hydrogen with an electricity component below $0.83/kg -- potentially achieving sub-$1.50/kg LCOH when combined with falling electrolyzer CAPEX.

Douglas County PUD (Wells Dam, 840 MW) and Grant County PUD (Wanapum 1,092 MW + Priest Rapids 956 MW) are specifically identified in Module E as candidates for hydrogen production from surplus hydroelectric. Their surplus power at $15-25/MWh in spring could support LCOH of $1.50-2.00/kg with 2024 electrolyzer costs.

### 2.3 Validating the PNW LCOH Estimate

Module E estimates PNW hydroelectric-powered PEM electrolysis at $2.10-2.60/kg LCOH. The breakdown:

| Cost Component | Value | Contribution to LCOH |
|---|---|---|
| Electricity | $25/MWh x 55 kWh/kg | $1.375/kg (53%) |
| Capital recovery | $600/kW CAPEX, 85% CF, 80,000 hr life | $0.40-0.60/kg (20%) |
| O&M | 3% of CAPEX annually | $0.15-0.25/kg (8%) |
| Stack replacement | 1 replacement over life | $0.10-0.20/kg (6%) |
| Water treatment | $0.02/kg | $0.02/kg (1%) |
| Balance of plant | Included in CAPEX | -- |
| **Total** | | **$2.06-2.47/kg** |

This range is consistent with the $2.10-2.60/kg stated in Module E and validates the estimate as conservative. Several factors could push PNW LCOH below $2.00/kg before 2030:

1. **Electrolyzer CAPEX decline:** PEM costs are projected to fall from $600/kW (2024) to $300-400/kW (2030) on a 16-20% learning rate (Module E, E-MFG). This alone reduces the capital component by approximately $0.15-0.25/kg.
2. **Surplus power capture:** Shifting production to surplus periods (spring runoff + wind) at $15-20/MWh reduces the electricity component by $0.25-0.55/kg.
3. **Capacity factor optimization:** Grid-connected systems with smart dispatch can achieve 90%+ capacity factor, further diluting per-kilogram capital costs.
4. **Stack lifetime improvement:** DOE targets 80,000+ hours (from current 40,000-80,000 hours), reducing replacement cost.

With these improvements, sub-$2.00/kg green hydrogen from PNW hydro appears achievable by 2028-2030 even without the Section 45V tax credit.

### 2.4 Heat Pump Economics in the PNW

The PNW is arguably the most favorable market for heat pump adoption in the United States, based on the intersection of mild climate, cheap electricity, and carbon-conscious policy:

**Climate advantage:** West-of-Cascades design temperatures of 23-24F (Module A, Section 10.1) mean air-source heat pumps operate at their efficiency sweet spot for the vast majority of heating hours. Seattle's heating degree days (4,797 HDD65) are moderate compared to Minneapolis (7,876 HDD65) or Chicago (6,536 HDD65), resulting in lower annual heating demand and higher seasonal average COP. A heat pump that averages COP 3.5 over the season in Seattle might average COP 2.5 over the season in Minneapolis.

**Electricity cost advantage:** At PNW residential rates near $0.10/kWh, annual heating cost for a standard home with an air-source heat pump (COP 3.5 seasonal) is approximately $600-800/year. The same home with a gas furnace (96% AFUE) at $1.20/therm pays approximately $900-1,200/year. The heat pump saves $200-400 annually in operating cost while providing air conditioning in summer (Module A, Section 9.4).

**Retrofit economics for existing PNW homes:**

| Investment | Cost | Annual Savings | Simple Payback |
|---|---|---|---|
| Air seal + attic insulation + ASHP | $8,000-15,000 (before incentives) | $400-700 | 11-21 years |
| Same with IRA tax credit ($2,000 HP + up to $1,600 insulation) | $4,400-11,400 | $400-700 | 6-16 years |
| Passive House + mini-split (new construction) | Premium: $10,000-26,000 | $500-900 vs. standard | 11-29 years (but comfort + resilience gains) |

Source: Module A, Section 9.4

The payback periods for heat pump retrofits in the PNW are longer than in regions with higher electricity costs or harsher climates, precisely because the gas heating cost they displace is relatively low. This is the paradox of PNW heat pump economics: the operating cost advantage is real but modest, making the investment case dependent on incentives, avoided gas infrastructure costs, and the declining-carbon-grid trajectory that makes heat pumps progressively cleaner each year.

### 2.5 WHR Economics in the PNW Context

Module B identifies a distinctive WHR economic landscape in the PNW (Module B, Section 13.5):

**Low electricity prices cut both ways.** Cheap hydroelectric power makes electrically-driven WHR technologies (heat pumps, MVR) more attractive because the electricity input is cheaper. However, it simultaneously makes heat-to-electricity WHR technologies (ORC, TEG) less attractive because the electricity they produce displaces cheaper grid power. An ORC system generating electricity at $0.06/kWh in Ohio (where it displaces $0.08-0.10/kWh grid power) has a stronger payback than the same system in Washington (where it displaces $0.03-0.04/kWh industrial power).

**The carbon policy equalizer.** Washington's Climate Commitment Act places a carbon price of $10-25/tonne CO2 on industrial emissions (Module B, Section 13.5). At $20/tonne CO2, the carbon cost adds approximately $1.10/MMBtu to natural gas combustion, improving WHR payback by increasing the value of every BTU of fossil fuel avoided. As carbon prices are expected to escalate over time, WHR investments made today become progressively more valuable.

**Marginal grid pricing matters more than average.** PNW average electricity prices are low, but marginal grid electricity during winter peak periods is supplied by natural gas peaker plants at $40-80/MWh (Module B, Section 13.5). WHR electricity generated during these periods has high avoided-cost value. An ORC system at a food processing plant that operates year-round generates its most valuable kWh during the winter evening peak, when PNW grid prices spike. Time-of-use economics can dramatically improve WHR payback periods over simple average-rate calculations.

---

## 3. Investment Decision Framework

### 3.1 Technology Deployment Decision Matrix

The following framework maps each technology to the conditions under which it becomes the economically rational choice:

| Technology | Deploy When... | Avoid When... | PNW-Specific Trigger |
|---|---|---|---|
| Air-source heat pump | Replacing gas furnace/boiler; new construction | Gas equipment <5 years old; very poor building envelope | Gas furnace end-of-life; new construction code |
| Ground-source heat pump | New construction with land; replacing oil/propane | Retrofit in dense urban; very mild climate (low delta-T) | Lot size > 0.5 acre; seeking 5.0+ seasonal COP |
| Recuperator/economizer WHR | Exhaust gas >150C; boiler systems | Low-hours operation (<2,000 hr/yr) | Any PNW industrial boiler without one |
| Plate/shell HX for WHR | Compatible source/sink temperatures | Large temp mismatch requiring upgrade | Food/beverage; data center to district heat |
| ORC system | >200C waste heat; >500 kWe output | <100C source; <100 kWe (economics marginal) | Pulp mill exhaust; large food processing |
| MVR system | Evaporation/distillation processes; COP >5 | Batch operations <2,000 hr/yr | Dairy, pulp/paper, food dehydration |
| Industrial heat pump | Upgrading 40-60C waste heat to 70-90C | Source and sink temps already matched | Data center WHR to district heating |
| PEM electrolyzer | Surplus renewable power; IRA 45V eligible | High electricity cost (>$60/MWh); no H2 demand | Spring hydro surplus; wind curtailment capture |
| AWE electrolyzer | Steady baseload power; large scale (>10 MW) | Highly variable power; small scale | BPA industrial firm power; PUD surplus |
| Geothermal power | Known resource >150C at <3km; firm PPA | Unexplored resource; no transmission access | Basin and Range sites (eastern OR) |

### 3.2 Capital Cost vs. Operating Cost Tradeoffs

The fundamental investment tension in energy technology is between capital expenditure (CAPEX) and operating expenditure (OPEX). Technologies with high CAPEX and low OPEX (heat pumps, electrolyzers, geothermal wells) require patient capital and long time horizons. Technologies with low CAPEX and higher OPEX (gas boilers, diesel generators) are cheaper to acquire but more expensive to run.

**CAPEX/OPEX profiles by technology:**

| Technology | Upfront CAPEX | Annual OPEX (% of CAPEX) | Fuel/Energy Cost | Total Lifetime Cost Dominance |
|---|---|---|---|---|
| Residential ASHP | $3,500-7,500 | 2-3% (maintenance) | Electricity (dominant) | OPEX-dominated |
| Residential GSHP | $15,000-35,000 | 1-2% | Electricity | CAPEX-dominated first 10 years |
| Industrial heat pump | $300-800/kW | 3-5% | Electricity | Balanced |
| ORC system | $2,000-5,000/kWe | 3-5% | Free (waste heat) | CAPEX-dominated |
| PEM electrolyzer | $600/kW (2024) | 3% CAPEX + stack | Electricity (50-70% LCOH) | OPEX-dominated |
| AWE electrolyzer | $800/kW (2024) | 3% CAPEX + stack | Electricity (50-70% LCOH) | OPEX-dominated |
| Geothermal well + plant | $5-10M/well + $2,500-4,000/kWe plant | 2-3% | Free (geothermal heat) | CAPEX-dominated |
| Gas furnace (residential) | $2,500-5,000 | 1-2% | Natural gas (dominant) | OPEX-dominated |

The PNW's low electricity costs amplify the advantage of electrically-powered systems (heat pumps, electrolyzers, MVR) by reducing the OPEX component that dominates their lifetime cost. Conversely, the PNW's sunk hydroelectric infrastructure (CAPEX amortized decades ago) means the region's cheapest electrons come from assets with no remaining capital cost to recover -- a structural advantage unavailable to new-build generation.

### 3.3 Policy Incentives Landscape

Federal and state incentives substantially alter the investment calculus for all technologies in this framework:

**IRA Section 45V -- Clean Hydrogen Production Tax Credit:**

| CO2 Intensity (kg CO2/kg H2) | Credit ($/kg H2) | PNW Eligibility |
|---|---|---|
| <0.45 | $3.00 | Yes (hydro-powered) |
| 0.45-1.50 | $1.00 | Marginal (grid mix) |
| 1.50-2.50 | $0.75 | Unlikely for PNW green H2 |
| 2.50-4.00 | $0.60 | No |

Source: Module E, E-ECON

At PNW LCOH of $2.10-2.60/kg and a $3.00/kg credit, the effective production cost is negative: the credit exceeds the cost. This creates a market-development incentive for overproduction, driving infrastructure buildout and demand aggregation (Module E, E-ECON). The 45V credit is available for 10 years from facility commissioning.

**IRA Heat Pump Tax Credits:**

| Incentive | Amount | Eligibility |
|---|---|---|
| Federal residential HP tax credit (25C) | Up to $2,000 | ENERGY STAR certified heat pumps |
| High-Efficiency Electric Home Rebate (HEEHR) | Up to $8,000 | Low-to-moderate income households |
| Insulation and air sealing credits | Up to $1,600 | Combined with HP installation |

Source: Module A, Section 5.3

**Washington State Carbon Pricing:**

Washington's Climate Commitment Act (operational since 2023) establishes a cap-and-invest program that prices industrial carbon emissions at $10-25/tonne CO2 (Module B, Section 13.5). This price is expected to increase over time as emission caps tighten. Each $10/tonne increase in carbon price adds approximately $0.55/MMBtu to the cost of natural gas combustion, progressively improving the economics of all electrification, efficiency, and WHR investments.

**State Clean Energy Mandates:**

Washington's CETA (100% clean electricity by 2045) and Oregon's HB 2021 (100% clean electricity by 2040) do not directly incentivize the technologies in this framework, but they guarantee that the grid powering heat pumps and electrolyzers will become progressively cleaner. A heat pump installed in 2025 on a 65% clean grid will operate on a 100% clean grid by 2040-2045, eliminating its indirect emissions entirely without any action by the building owner (Module A, Section 10.2).

### 3.4 Payback Period Comparison Table

The following table compares payback periods across all technologies, normalized to PNW economic conditions:

| Technology | Installed Cost (representative) | Annual Savings/Revenue | Simple Payback | With Incentives |
|---|---|---|---|---|
| ASHP replacing gas furnace (residential) | $6,000 | $300-500/yr | 12-20 years | 8-13 years |
| GSHP replacing gas furnace (residential) | $25,000 | $600-900/yr | 28-42 years | 15-25 years |
| Economizer on industrial boiler | $20,000 (500 kW) | $12,000-15,000/yr | 1.3-1.7 years | N/A (already fast) |
| Plate HX for food processing WHR | $50,000 (1 MW) | $20,000-30,000/yr | 1.7-2.5 years | N/A |
| ORC on pulp mill exhaust (2 MWe) | $6,000,000 | $1,000,000-1,500,000/yr | 4-6 years | 3-5 years (ITC) |
| MVR on dairy evaporation | $200,000 (400 kW evap) | $80,000-120,000/yr | 1.7-2.5 years | N/A |
| PEM electrolyzer (10 MW, PNW hydro) | $6,000,000 | Revenue from H2 sales | 3-5 years | <0 years (45V credit) |
| Geothermal plant (Basin & Range, 20 MW) | $80,000,000-120,000,000 | $8,000,000-15,000,000/yr (PPA) | 8-15 years | 5-10 years (ITC/PTC) |

*Savings based on PNW energy prices. Revenue estimates assume market rates for hydrogen ($3-4/kg pre-credit) and geothermal electricity ($45-65/MWh PPA). Simple payback does not account for discount rates, escalation, or financing costs.*

---

## 4. System-Level Economics

### 4.1 The Gradient Interception Principle

Module B's central thermodynamic concept -- that energy does not disappear but downgrades from high temperature to low temperature (Module B, Section 1) -- has a direct economic corollary: every point at which you intercept an energy gradient and extract useful work reduces the total waste of the system. Each interception point has its own conversion efficiency and capital cost, but the cumulative benefit of multiple interception points can exceed what any single technology achieves alone.

This is the **gradient interception economics** principle: the total system value is greater than the sum of individual technology values because each upstream interception reduces the waste stream available to downstream technologies while also reducing the system's total fuel consumption and emissions.

### 4.2 Integrated Cascade Example

Consider a concrete PNW example -- a pulp mill with high-temperature exhaust:

**Stage 1: High-grade heat recovery (recuperator)**
- Source: 400C furnace exhaust
- Recovery: Preheat combustion air to 300C
- Efficiency: 85% heat exchanger effectiveness
- Investment: $50,000; payback 1.5 years
- Exhaust exits at 200C (still hot)

**Stage 2: Medium-grade heat-to-power (ORC)**
- Source: 200C exhaust from Stage 1
- Recovery: ORC generating 500 kWe
- Efficiency: 12% thermal-to-electric (at 200C source)
- Investment: $1,500,000; payback 5 years
- Exhaust exits at 90C

**Stage 3: Low-grade heat upgrade (industrial heat pump)**
- Source: 90C exhaust from Stage 2
- Recovery: Heat pump upgrades to 130C process steam (COP 3.0)
- Electricity input: 167 kW (from ORC output)
- Investment: $100,000; payback 3 years
- Exhaust exits at 40C

**Stage 4: Residual heat capture (district heating or data center source)**
- Source: 40C residual
- Recovery: Direct heat exchange to nearby building or greenhouse
- Efficiency: 90% (simple heat exchange; no temperature upgrade needed)
- Investment: $200,000 (piping network); payback 5-7 years

**System-Level Analysis:**

| Metric | Individual Best Technology | Integrated Cascade |
|---|---|---|
| Total heat recovered from 400C exhaust | ~70% (Stage 1 alone) | ~92% (all stages) |
| Electricity generated | 0 (recuperator only) | 500 kWe (Stage 2) |
| Process heat upgraded | 0 | 500 kW at 130C (Stage 3) |
| Building heating served | 0 | ~200 kW (Stage 4) |
| Total system investment | $50,000 | $1,850,000 |
| Combined payback | 1.5 years | 4.2 years (blended) |
| Annual value recovered | $33,000 | $440,000 |

The integrated cascade recovers 13 times more annual value than the recuperator alone, at a blended payback of 4.2 years. Each successive stage captures energy that the previous stage could not -- not because the upstream technology failed, but because it was optimized for a different temperature range. The thermodynamic cascade mirrors the economic cascade: the cheapest interventions go first (recuperator), and each subsequent investment is justified by the residual opportunity.

### 4.3 Waste Heat to Hydrogen Pathway

Module B identifies two pathways connecting waste heat to hydrogen production (Module B, Section 14.4):

**Pathway 1: WHR to electricity to electrolysis**

Industrial waste heat (200-400C) -> ORC (12-15% thermal-to-electric) -> PEM electrolyzer (55 kWh/kg) -> green hydrogen

Overall efficiency: 8-15% of waste heat energy converted to hydrogen energy content. At zero marginal cost for waste heat, the question is whether the ORC + electrolyzer capital investment is justified.

Economics:
- 2 MW ORC from 200C exhaust: $6,000,000 CAPEX
- 2 MW = 2,000 kW x 8,000 hours = 16,000 MWh/yr electricity
- 16,000 MWh / 55 kWh/kg = 290,909 kg H2/year
- At $2.35/kg (PNW wholesale): $683,636/yr revenue
- At $2.35/kg + $3.00/kg 45V credit: $1,557,727/yr revenue
- Payback without credit: 8.8 years
- Payback with 45V credit: 3.9 years

The Section 45V credit transforms waste-heat hydrogen from a marginal proposition to an attractive investment. The key nuance: the hydrogen produced from waste heat electricity may qualify for the highest 45V tier ($3.00/kg) if the waste heat source is industrial and the electrolyzer operation can be documented as displacing zero-carbon grid power (Module E, E-ECON).

**Pathway 2: Waste heat as thermal input to SOEC**

High-temperature waste heat (700-900C) can directly reduce the electrical energy required for solid oxide electrolysis by 20-30% compared to ambient-temperature PEM or AWE systems (Module B, Section 14.4; Module E, E-SOEC). This thermal credit reduces the electricity component of LCOH:

| Electrolyzer Type | Electricity Consumption | With Waste Heat Integration | LCOH Impact at $30/MWh |
|---|---|---|---|
| PEM (ambient) | 55 kWh/kg | N/A | $1.65/kg electricity component |
| SOEC (no thermal input) | 42 kWh/kg | N/A | $1.26/kg |
| SOEC (with 700C waste heat) | 35 kWh/kg | 20% reduction | $1.05/kg |
| SOEC (with 900C waste heat) | 30 kWh/kg | 30% reduction | $0.90/kg |

The SOEC + waste heat pathway could achieve electricity costs below $1.00/kg for the electricity component alone -- closing in on the DOE Hydrogen Shot $1/kg total LCOH target. The challenge is that very few PNW industrial sources produce waste heat at 700-900C, and SOEC technology is still at early commercial maturity with shorter stack lifetimes (20,000-40,000 hours vs. 60,000-90,000 hours for AWE).

### 4.4 Levelized Cost of the Integrated System

A fully integrated PNW clean energy system would combine multiple technologies operating at different scales and temperatures. The system-level LCOE is not a simple average of component LCOEs but rather a weighted calculation that accounts for the complementary nature of the components.

**Representative PNW Integrated System (2035 projection):**

| Component | Capacity | LCOE/LCOH | Role |
|---|---|---|---|
| BPA hydroelectric | Baseload | $25-35/MWh | Grid backbone; electrolyzer power |
| Geothermal (Newberry EGS, Phase 1) | 50 MW | $50-70/MWh | Baseload complement; drought buffer |
| Columbia Gorge wind | Variable | $30-40/MWh | High-CF renewable; spring surplus |
| Pumped storage (Goldendale) | 1,200 MW / 12 hr | $0.05-0.08/kWh stored | Diurnal shifting; peak supply |
| PEM electrolyzers (surplus capture) | 50 MW | $1.80-2.20/kg H2 | Seasonal storage; industrial supply |
| Building heat pumps (regional fleet) | Distributed | $8-10/MMBtu delivered | Space heating electrification |
| Industrial WHR (food/pulp/data centers) | Distributed | <$2/MMBtu recovered | Efficiency; reduces total generation need |

**System economics vs. components in isolation:**

The integrated system produces economic benefits that no component captures alone:

1. **Surplus absorption:** Electrolyzers convert spring hydro/wind surplus (otherwise curtailed) to hydrogen, capturing value that would be $0/MWh without them
2. **Peak shaving:** Heat pump demand response and pumped storage reduce the need for expensive peaker plants during winter peaks, lowering the marginal cost from $40-80/MWh to $25-40/MWh
3. **WHR reduces total load:** Every BTU recovered from industrial waste heat is a BTU that does not need to be generated. At the margin, this defers grid capacity additions worth $1,500-3,000/kW in new generation
4. **Geothermal fills the hydro gap:** Geothermal's 90-95% capacity factor provides firm capacity during drought years when hydro output drops 15-30%, reducing the need for gas backfill
5. **Carbon pricing compounds:** Each component reduces emissions, reducing the system's exposure to escalating carbon prices under Washington's CCA

---

## 5. PNW Deployment Scenarios

### 5.1 Near-Term (2025-2030): Foundation

**Heat pump adoption accelerates.** Federal tax credits (IRA, up to $2,000-8,000), state building codes (Washington electric-ready requirement), and natural gas equipment end-of-life cycles drive increased heat pump installations. PNW adoption rates reach 30-40% of new residential HVAC installations by 2028, up from approximately 15-20% in 2024. The economics are favorable but not compelling on operating cost alone; policy push and equipment replacement timing are the primary drivers. Total regional heat pump fleet grows from ~2 million units to ~3 million (Module A, Section 10.4).

**Waste heat recovery in food processing expands.** The PNW's food and beverage sector (wineries, breweries, dairy, seafood) deploys proven WHR technologies: plate heat exchangers for brew water preheating (payback 1-2 years), MVR systems for dairy evaporation (payback 2-3 years), and heat pipe heat exchangers for winery operations (Module B, Section 13.1). Carbon pricing under Washington's CCA improves payback by $0.50-1.50/MMBtu on avoided gas. Total PNW industrial WHR investment: $50-100 million over the period.

**Pilot hydrogen production from surplus hydro.** The Pacific Northwest Hydrogen Hub (PNWH2), funded through the Bipartisan Infrastructure Law, commissions 20-50 MW of PEM electrolyzers at Columbia River sites. Initial production serves petroleum refining (displacing gray hydrogen), industrial ammonia synthesis, and heavy-duty truck fueling along I-5 and I-84 corridors (Module E, E-PNW). LCOH: $2.00-2.50/kg pre-credit; effectively negative with 45V PTC. Annual production: 5,000-15,000 tonnes of green hydrogen.

**Geothermal exploration intensifies.** Washington's Geothermal Resources Act (2024) and DOE exploration funding support 3-5 new exploration wells in eastern Oregon Basin and Range sites. Neal Hot Springs continues operating at 22 MW, 90-95% capacity factor. 2-3 additional conventional hydrothermal projects begin development at 10-30 MW each (Module F, Section 11.5). Cumulative PNW geothermal capacity approaches 50-80 MW by 2030.

### 5.2 Medium-Term (2030-2040): Scale

**Geothermal baseload comes online.** Newberry Crater EGS achieves commercial operation at 50-100 MW (Module F, Section 11.5). Basin and Range conventional plants add another 100-200 MW. Geothermal LCOE falls to $45-65/MWh as drilling techniques improve and resource characterization reduces exploration risk. Total PNW geothermal: 200-500 MW, providing 1-3% of regional generation but crucially serving as firm, dispatchable capacity independent of precipitation.

**Hydrogen infrastructure reaches critical mass.** Electrolyzer capacity expands to 200-500 MW. Hydrogen pipeline corridors connect Columbia River production sites to demand centers in Portland, Seattle, and the Tri-Cities. Underground hydrogen storage (salt caverns or lined rock caverns) provides seasonal buffering, enabling year-round supply from seasonally variable production (Module E, E-PNW). LCOH falls to $1.50-2.00/kg as electrolyzer costs decline to $300-400/kW and surplus electricity capture strategies mature.

**Grid-scale storage portfolio matures.** Goldendale pumped storage (1,200 MW, 14,400 MWh) enters service, providing 12 hours of discharge capacity for peak and multi-day events (Module F, Section 9.3). Swan Lake North (393 MW, 3,930 MWh) operational in southern Oregon. Combined with grid-scale batteries (2-4 hour duration), the storage portfolio enables management of the PNW's growing renewable intermittency as solar and wind reach 20-30% of generation.

**Industrial WHR becomes standard practice.** Washington's escalating carbon price (projected $30-50/tonne CO2 by 2035) makes WHR investment unavoidable for large emitters. ORC installations at pulp mills and large food processors; data center waste heat-to-district-heating projects in suburban Portland and eastern Washington. MVR deployment expands to all major dairy and evaporation facilities. Total PNW industrial WHR displaces 5-10% of industrial fossil fuel consumption.

### 5.3 Long-Term (2040-2050): Integration

**100% clean electricity achieved.** Oregon reaches its 2040 target; Washington reaches its 2045 target. The grid that powers every heat pump, every electrolyzer, and every electrically-driven WHR system is now entirely carbon-free. This means:

- Heat pump heating has zero lifecycle carbon emissions regardless of COP
- All grid-connected hydrogen production is automatically "green" without carbon accounting complexity
- The economic advantage of efficiency (high COP, WHR) shifts from carbon avoidance to cost avoidance -- each kWh saved still reduces the electricity bill, but no longer reduces emissions

**Integrated clean energy system.** The PNW operates a diversified portfolio: hydroelectric (50-55% of generation, subject to climate variability), wind (15-20%), solar (10-15%), geothermal (5-10%), nuclear (5%, if Columbia Generating Station is extended or small modular reactors deploy), and storage (pumped hydro + batteries + hydrogen for multi-week duration). Gas generation is eliminated.

**Hydrogen as industrial feedstock and seasonal storage.** Annual PNW hydrogen production reaches 200,000-500,000 tonnes, serving industrial decarbonization (steel, chemicals, refining), heavy transport, maritime fueling, and seasonal energy storage. LCOH is $1.00-1.50/kg, competitive with gray hydrogen even without tax credits. Hydrogen exports to California and Asia via pipeline and ammonia shipping become economically viable (Module E, E-PNW).

**Heat pump penetration reaches 70-80% of residential heating.** New gas connections to buildings are prohibited or economically uncompetitive. Ground-source heat pumps become the standard for new commercial and institutional construction. The PNW's gas distribution infrastructure begins planned decommissioning in low-density areas, with remaining gas pipeline capacity repurposed for hydrogen blending or dedicated hydrogen service (Module A, Section 10.3).

---

## 6. Economic Barriers and Accelerators

### 6.1 Capital Availability

The technologies in this framework span a wide range of capital requirements, from $6,000 for a residential heat pump to $120 million for a geothermal power plant. The barrier is not the total investment -- the PNW clean energy transition requires billions in aggregate capital -- but the structure and timing of that capital.

**Residential scale:** Heat pump adoption is constrained by household capital availability. Even with IRA credits reducing net cost to $4,000-11,000, this remains a significant expenditure for middle-income households. On-bill financing, utility rebate programs, and property-assessed clean energy (PACE) loans lower the barrier but do not eliminate it.

**Industrial scale:** WHR investments with 1-3 year payback periods (economizers, heat exchangers) should be no-brainer investments, yet many industrial facilities still operate without them. The barrier is not capital cost but institutional: competing capital allocation priorities, deferred maintenance backlogs, and the split-incentive problem in leased facilities.

**Infrastructure scale:** Hydrogen hubs, geothermal plants, and pumped storage projects require hundreds of millions to billions in capital with multi-year construction timelines and uncertain revenue streams. Federal funding (BIL H2Hubs, DOE geothermal programs, FERC-licensed PSH) de-risks these investments but cannot cover the full cost. Private capital participation requires long-term power purchase agreements (PPAs) or hydrogen offtake contracts that do not yet exist at scale in the PNW.

### 6.2 Permitting Timelines

Permitting is the single most cited delay factor across all large-scale energy technologies in the PNW:

| Technology | Typical Permitting Timeline | Key Bottleneck |
|---|---|---|
| Residential heat pump | Days to weeks | None (standard equipment) |
| Industrial WHR retrofit | Weeks to months | Air quality permits if modifying exhaust |
| Electrolyzer facility (10+ MW) | 1-2 years | NFPA 2 compliance; local zoning; H2 safety |
| Geothermal exploration well | 2-5 years | NEPA review on federal land; water rights |
| Geothermal power plant | 3-7 years | BLM/USFS permitting; EIS; tribal consultation |
| Pumped storage (FERC license) | 5-10+ years | FERC licensing; environmental review; water rights |

The mismatch between policy ambition (100% clean electricity by 2040-2045) and permitting reality (5-10 years for a geothermal or pumped storage project) is the most acute tension in PNW energy planning. Washington's Geothermal Resources Act (2024) attempts to address this for geothermal specifically (Module F, Section 7.6), but no comparable acceleration exists for pumped storage or large hydrogen facilities.

### 6.3 Workforce Development

Each technology requires a different workforce profile:

- **Heat pumps:** HVAC technicians with heat pump-specific training (refrigerant handling, inverter diagnostics, Manual J load calculations). The existing HVAC workforce is large but oriented toward gas furnaces; retraining is the bottleneck, not headcount.
- **WHR systems:** Industrial engineers, process engineers, and millwrights who can design, install, and maintain ORC, heat exchanger, and MVR systems. This expertise exists in the PNW but is concentrated in pulp and paper -- expanding to food processing, data centers, and other sectors requires cross-training.
- **Electrolyzers:** Electrochemical engineers, electrical technicians, and process operators familiar with hydrogen safety (NFPA 2, ASME B31.12). This workforce essentially does not exist at scale; it must be created through community college programs, manufacturer training, and on-the-job learning.
- **Geothermal:** Geologists, drilling engineers, and reservoir engineers. The PNW has fewer geothermal professionals than California or Nevada because the industry has been smaller. University programs at Oregon State and University of Washington are expanding geothermal curricula.

### 6.4 BPA Rate Structure Dynamics

BPA's cost-based rates are not fixed -- they are periodically adjusted through a public rate-setting process. Several factors could affect future BPA rates relevant to electrolyzer economics:

**Upward pressure:**
- Climate variability reducing hydroelectric output in dry years (Module F, Section 5)
- Fish passage and dam operations costs ($500-700 million/year, Module F, Section 6.4)
- Aging infrastructure maintenance and replacement
- Potential removal or modification of Lower Snake River dams

**Downward pressure:**
- Fully amortized dam infrastructure with no remaining capital cost
- Efficiency improvements in generator and transmission equipment
- Revenue from new loads (electrolyzers, data centers) that improve system utilization

The sensitivity of hydrogen economics to electricity price makes BPA rate trajectories a critical variable. A $5/MWh increase in BPA rates adds approximately $0.28/kg to LCOH (at 55 kWh/kg consumption). A $5/MWh decrease saves the same amount. For electrolyzer projects with 20-30 year lifetimes, BPA rate forecasting is as important as technology cost projections.

### 6.5 Carbon Pricing Scenarios

Washington's Climate Commitment Act (CCA) establishes a floor for carbon pricing in the PNW. The impact on technology economics depends on the price trajectory:

| Carbon Price ($/tonne CO2) | Impact on Natural Gas ($/MMBtu) | Impact on Gray H2 ($/kg) | WHR Payback Improvement |
|---|---|---|---|
| $15 (2023 actual) | +$0.83 | +$0.15-0.18 | 5-10% shorter |
| $25 (2025 projected) | +$1.38 | +$0.25-0.30 | 10-15% shorter |
| $50 (2030 projected) | +$2.75 | +$0.50-0.60 | 20-30% shorter |
| $100 (2035-2040, aggressive) | +$5.50 | +$1.00-1.20 | 40-50% shorter |
| $150 (2040-2050, deep decarb) | +$8.25 | +$1.50-1.80 | 50-60% shorter |

*CO2 intensity of natural gas combustion: 53.06 kg CO2/MMBtu (EPA). Gray hydrogen via SMR: 9-12 kg CO2/kg H2.*

At $50/tonne CO2, natural gas becomes $2.75/MMBtu more expensive. This shifts the gas-vs-heat-pump crossover point further in favor of the heat pump, shortens WHR payback periods on gas-fired equipment, and widens the gap between gray and green hydrogen. At $100/tonne, the carbon cost alone adds $5.50/MMBtu to gas -- more than the current PNW wholesale gas price in some periods -- fundamentally restructuring the industrial energy cost landscape.

### 6.6 Technology Learning Curves

Manufacturing scale drives cost reduction along predictable learning curves. The relevant learning rates for this framework:

| Technology | Learning Rate (% cost reduction per doubling) | Current Deployment | Doublings to 2050 |
|---|---|---|---|
| PEM electrolyzer | 16-20% | ~1.4 GW global | 8-9 doublings to 700 GW |
| AWE electrolyzer | 12-16% | ~1.4 GW global | 8-9 doublings to 700 GW |
| Solar PV (reference) | ~24% | ~1,500 GW global | 2-3 doublings |
| Residential heat pump | 5-8% | ~18M units US | 1-2 doublings |
| ORC systems | 8-12% | ~4 GW global | 3-4 doublings |
| Geothermal (conventional) | 5-10% | ~16 GW global | 2-3 doublings |
| EGS (enhanced geothermal) | 15-25% (projected) | <0.1 GW | 10+ doublings |

Sources: Module E (SCIDIR-H2, OIES-ET48), Module F (GEO-RISE)

Electrolyzers are at the steepest part of their learning curve, with 8-9 doublings of cumulative deployment projected by 2050. This implies cost reductions of 75-85% from current levels if learning rates hold -- consistent with the DOE's trajectory from $600/kW (PEM, 2024) to $150-250/kW (2050) (Module E, E-MFG).

EGS technology, if it follows the pattern of other energy technologies with steep initial learning curves, could see dramatic cost reductions as early projects inform later designs. The combination of Fervo Energy's commercial demonstration and Quaise Energy's millimeter-wave drilling research suggests that geothermal could be the next technology to ride a learning curve similar to solar PV's historic trajectory -- but this remains uncertain and dependent on successful technology demonstrations (Module F, Section 8).

Heat pumps, by contrast, are a mature technology with a flatter learning curve. Cost reductions will continue but at the 5-8% per doubling rate typical of established manufacturing. The primary cost reduction pathway for heat pumps is not technology learning but manufacturing scale and supply chain competition, particularly as Chinese manufacturers (Midea, Gree, Haier) expand globally (Module A, Section 5.4).

---

## 7. Key Findings

### Finding 1: PNW Electricity Cost Advantage Amplifies Across All Technologies

The PNW's BPA-based hydroelectric system provides electricity at $25-35/MWh wholesale -- roughly half the national average. This single factor ripples through every technology in this framework: heat pumps operate at lower cost, electrolyzers produce cheaper hydrogen, MVR systems displace thermal energy at $1.40/MMBtu, and grid-connected industrial processes have lower operating costs than competitors in any other U.S. region. The advantage is structural (based on sunk hydroelectric infrastructure) and durable (no private competitor can build 22,000 MW of new hydro). Every economic comparison in this synthesis is meaningfully more favorable in the PNW than it would be elsewhere. (Modules A, B, E, F)

### Finding 2: The IRA Section 45V Credit Makes PNW Green Hydrogen Economically Irrational Not to Produce

At PNW LCOH of $2.10-2.60/kg and a $3.00/kg production tax credit for the lowest-emission tier (which PNW hydroelectric-powered hydrogen qualifies for), the effective net cost of production is negative. The credit exceeds the cost. This is not a marginal incentive -- it is a market-creation mechanism that makes every kilogram of green hydrogen produced in the PNW profitable from day one, even before finding a buyer at market price. The constraint is not economics but infrastructure: electrolyzer manufacturing capacity, hydrogen storage, pipeline construction, and end-use conversion. (Modules E, F)

### Finding 3: Waste Heat Recovery Payback Periods Are Shortest Where Capital Costs Are Lowest, Not Where Energy Costs Are Highest

The WHR technologies with the fastest payback in the PNW are not the most sophisticated (ORC, TEG) but the simplest (recuperators, economizers, plate heat exchangers) -- 1-3 year payback even at PNW's low energy prices. This finding from Module B has a direct policy implication: industrial energy efficiency programs should prioritize deploying simple heat exchange technologies at every eligible facility before investing in complex heat-to-power conversion. A $20,000 economizer with a 1.5-year payback deployed at 100 PNW facilities generates more total energy savings than a single $6 million ORC installation. (Module B)

### Finding 4: Carbon Pricing Is the Economic Bridge Between PNW's Low Energy Costs and Clean Technology Adoption

The PNW's cheap electricity and gas reduce the operating cost savings from efficiency investments, creating longer payback periods than in higher-cost regions. Washington's Climate Commitment Act carbon price ($10-25/tonne, escalating) closes this gap by adding a cost to fossil fuel combustion that increases over time. At $50/tonne CO2 (projected ~2030), carbon costs add $2.75/MMBtu to natural gas, shortening WHR payback periods by 20-30% and widening the heat pump vs. gas furnace operating cost advantage from approximately $2-4/MMBtu to $5-7/MMBtu. Carbon pricing transforms PNW energy economics from "clean energy is slightly cheaper" to "clean energy is substantially cheaper." (Modules A, B, F)

### Finding 5: Seasonal Complementarity Creates System Value That No Single Technology Captures

The PNW's energy system has a distinctive seasonal profile: spring hydro/wind surplus, summer declining hydro, fall minimum generation, winter peak heating demand. Module F documents this pattern, and Module E identifies how hydrogen production can exploit it. The system-level economic insight is that technologies deployed to capture surplus energy (electrolyzers in spring), reduce peak demand (heat pumps and WHR in winter), and provide firm capacity (geothermal year-round) are worth more together than separately. An electrolyzer that operates only during spring surplus captures energy that would otherwise be curtailed at $0/MWh; a geothermal plant that operates year-round provides firm capacity that reduces reliance on gas peakers at $40-80/MWh during winter peaks. The economic value of this complementarity is the avoided cost of the gas infrastructure that would otherwise be needed. (Modules A, B, E, F)

### Finding 6: The Gradient Interception Cascade Multiplies Value at Each Stage

The integrated cascade analysis (Section 4.2) demonstrates that multi-stage waste heat recovery from a single industrial source (400C exhaust) can recover 92% of available thermal energy and generate $440,000/year in annual value, compared to 70% recovery and $33,000/year from the highest-value single technology alone. The economic principle: the last dollar invested in a gradient cascade earns less than the first dollar, but the total return on the integrated investment exceeds the return on any single component. This finding has direct implications for industrial facility design -- engineering the full temperature cascade from the outset, rather than retrofitting individual recovery stages, captures maximum value. (Module B, with connections to Modules A and E)

### Finding 7: Geothermal Is the PNW's Most Under-Invested Clean Energy Resource Relative to Its Economic Potential

The PNW generates less than 0.3% of its electricity from geothermal despite sitting atop the Cascadia Subduction Zone and the Cascade Range volcanic chain (Module F, Section 1.1). The economic explanation is simple: cheap hydro removed the incentive to drill expensive wells. But the forward-looking economics are shifting. Climate variability threatens hydro reliability (15-30% output reduction in drought years, Module F, Section 5). Geothermal's 90-95% capacity factor provides drought-independent firm capacity worth $40-80/MWh in avoided peaker costs. The Basin and Range sites in eastern Oregon (Neal Hot Springs model) offer conventional hydrothermal resources with moderate drilling risk and proven technology. EGS at Newberry represents higher risk but transformative potential -- 100+ MW from a single volcanic center. The gap between the PNW's geothermal potential and its geothermal investment is the largest single economic opportunity in this framework. (Module F)

---

## 8. Cross-References

| Cross-Reference ID | Description | Source Module |
|---|---|---|
| X-ECON-COP | COP-based cost per BTU calculations | A (A-COP) |
| X-ECON-WHR | WHR payback and capital cost data | B (B-COST, Section 12.3) |
| X-ECON-LCOH | LCOH trajectory and PNW-specific estimate | E (E-LCOH, E-PNW) |
| X-ECON-LCOE | LCOE comparison for PNW generation resources | F (F-HYDRO, F-GEO) |
| X-ECON-45V | IRA Section 45V hydrogen production tax credit | E (E-ECON) |
| X-ECON-CCA | Washington Climate Commitment Act carbon pricing | B (Section 13.5) |
| X-ECON-BPA | BPA rate structure and wholesale power economics | E (E-PNW), F (F-HYDRO) |
| X-ECON-ORC | ORC economics for WHR and geothermal applications | B (B-ORC), F (F-GEO) |
| X-ECON-GSHP | Ground-source heat pump installed cost and payback | A (A-GSHP) |
| X-ECON-EGS | Enhanced geothermal system cost projections | F (F-EGS) |
| X-ECON-CASCADE | Gradient interception cascade economics | B (Section 14), synthesis |
| X-ECON-SOEC-WHR | SOEC thermal integration cost reduction | E (E-SOEC), B (Section 14.4) |
| X-ECON-SURPLUS | Spring surplus power and hydrogen production | E (E-PNW), F (F-GRID) |
| X-ECON-PUMP | Pumped storage economics and grid role | F (F-PUMP) |

---

## 9. Sources

All sources referenced in this cross-thread synthesis are documented in their respective source modules. The following index maps abbreviated citations to their full references:

| Abbreviation | Full Reference | Module(s) |
|---|---|---|
| IEA-HP | International Energy Agency. *The Future of Heat Pumps.* 2022 | A |
| EPA-ESTAR | U.S. EPA. ENERGY STAR Most Efficient 2025 criteria | A |
| WEF-HP | World Economic Forum. *How much money and energy can heat pumps save households?* 2025 | A |
| DOE-WHR | U.S. Department of Energy. *Waste Heat Recovery: Technology and Opportunities in U.S. Industry* | B |
| JOUHARA | Jouhara et al. *Waste heat recovery technologies and applications.* Thermal Science and Engineering Progress, 2018 | B |
| KOSMADAKIS | Kosmadakis. *Estimating the potential of industrial waste heat recovery.* Applied Thermal Engineering, 2019 | B |
| CEC-WHR | California Energy Commission. Heat pipe technology demonstrations | B |
| SCIDIR-H2 | Green hydrogen production via water electrolysis (ScienceDirect compendium) | E |
| OIES-ET48 | Oxford Institute for Energy Studies. *Energy Transition Paper ET48* | E |
| NREL-H2 | NREL hydrogen research program and benchmarks | E |
| NREL-LCOH | NREL LCOH methodology and calculations | E |
| DOE-H2COST | DOE Hydrogen and Fuel Cells Program cost data | E |
| DOE-MYPP | DOE Multi-Year Program Plan for Hydrogen | E |
| REZNICEK | Reznicek et al. LCOH sensitivity analysis methodology | E |
| EIA-WA | U.S. Energy Information Administration. Washington State profile | A, B, F |
| EIA-OR | U.S. Energy Information Administration. Oregon State profile | A, F |
| GEO-RISE | Geothermal Rising industry reports and conference proceedings | F |
| ALTAROCK | AltaRock Energy project documentation (Newberry EGS) | F |
| OR-DOE | Oregon Department of Energy grant programs | F |

---

*Thermal & Hydrogen Energy Systems -- PNW Energy Research*
*Cross-Thread Economic Synthesis: Modules A, B, E, F*
