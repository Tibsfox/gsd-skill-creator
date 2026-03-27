# Sensitivity & Risk Analysis

> **Domain:** Maritime Infrastructure Economics
> **Module:** 6 -- Cost Driver Sensitivity, Risk-Adjusted NPV, and Tornado Analysis
> **Through-line:** *Every cost model is a bet. The question is not whether the bet is right -- it never is, exactly -- but which variables the bet is most sensitive to. A 20% swing in steel prices matters more than a 50% swing in permitting costs, because steel is 40% of the structural budget and permitting is 3%. This module identifies which variables matter most, how much they can move, and what that does to the platform's NPV.*

---

## Table of Contents

1. [Sensitivity Framework](#1-sensitivity-framework)
2. [Top Five Cost Drivers](#2-top-five-cost-drivers)
3. [Driver 1: Steel and Structural Costs](#3-driver-1-steel-and-structural-costs)
4. [Driver 2: Subsea Cable Installation](#4-driver-2-subsea-cable-installation)
5. [Driver 3: Offshore Wind CAPEX Trajectory](#5-driver-3-offshore-wind-capex-trajectory)
6. [Driver 4: BPA Power Cost Stability](#6-driver-4-bpa-power-cost-stability)
7. [Driver 5: Compute Revenue Rate](#7-driver-5-compute-revenue-rate)
8. [Tornado Chart Analysis](#8-tornado-chart-analysis)
9. [Risk-Adjusted NPV](#9-risk-adjusted-npv)
10. [Scenario-Specific Risks](#10-scenario-specific-risks)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Sensitivity Framework

Sensitivity analysis measures how changes in individual input variables affect the platform's key output metrics: Net CAPEX, Annual OPEX, Cost per MW-hour, and 20-year NPV. All analysis uses the Regional (100 MW) scenario as the reference case unless otherwise noted [1][2].

### Reference Case Parameters (100 MW Regional)

| Parameter | Reference Value | Source |
|---|---|---|
| Net CAPEX | $1.91B | M5 midpoint |
| Annual OPEX | $88.8M | M5 midpoint |
| Cost/MW-hr | $247 | M5 calculation |
| NPV (8% discount) | -$120M | M5 calculation |
| Compute revenue | $350/MW-hr | Cloud market benchmark |
| BPA power cost | $0.02/kWh | BPA FY2024 |
| Steel price index | 100 (2024 baseline) | World Steel Association |
| Cable vessel day rate | $225K/day | Industry midpoint |
| Utilization rate | 85% | Industry standard |
| Discount rate | 8% | Infrastructure fund benchmark |

### Sensitivity Range

Each driver is tested at -30%, -15%, reference, +15%, +30% of its reference value. This range captures plausible variation over a 5-10 year planning horizon [1].

---

## 2. Top Five Cost Drivers

Ranked by percentage impact on 20-year NPV at the 100 MW regional scale:

| Rank | Driver | NPV Impact (per +/-15%) | Affected Components |
|---|---|---|---|
| 1 | Compute revenue rate | +/-$320M | Revenue (all scenarios) |
| 2 | BPA power cost stability | +/-$210M | C5 credit, annual OPEX |
| 3 | Steel and structural costs | +/-$180M | Vessel CAPEX, platform structures |
| 4 | Subsea cable installation cost | +/-$155M | Cable CAPEX (30-45% of total) |
| 5 | Offshore wind CAPEX trajectory | +/-$85M | Offshore generation (future phases) |

**Key finding:** The platform's economics are most sensitive to revenue (compute pricing) and the BPA power advantage -- both of which are market-driven rather than engineering-driven. The engineering cost drivers (steel, cable, wind) have significant but smaller impact. This means the platform's viability depends more on the compute market than on construction efficiency [1][2].

---

## 3. Driver 1: Steel and Structural Costs

Steel prices directly affect vessel acquisition, offshore platform structures, and cable armoring. Global steel price volatility is driven by iron ore supply, Chinese production levels, and trade tariffs [3].

### Historical Volatility

- **2020-2024 range:** Hot-rolled coil steel varied between $450/mt and $1,900/mt -- a 4.2x swing
- **20-year average:** ~$700/mt (World Steel Association)
- **2024 benchmark:** ~$800/mt (flat-rolled, US domestic)

### Impact on Platform CAPEX

| Steel Price Change | Vessel Cost Impact | Cable Armor Impact | Platform Structure Impact | Total CAPEX Impact |
|---|---|---|---|---|
| -30% | -$30-60M | -$15-30M | -$10-20M | -$55-110M |
| -15% | -$15-30M | -$8-15M | -$5-10M | -$28-55M |
| Reference | $0 | $0 | $0 | $0 |
| +15% | +$15-30M | +$8-15M | +$5-10M | +$28-55M |
| +30% | +$30-60M | +$15-30M | +$10-20M | +$55-110M |

**Mitigation:** Steel price risk can be partially hedged through:
- Long-term supply agreements with steel mills (common in shipbuilding)
- Fixed-price vessel construction contracts (Korean/Chinese yards typically absorb steel risk)
- Steel futures contracts for the cable procurement component [3][4]

---

## 4. Driver 2: Subsea Cable Installation

Cable installation cost is driven by vessel day rates, weather availability, and seabed complexity. Installation often exceeds cable manufacturing cost for complex routes [5][6].

### Sensitivity Range

| Parameter | Low | Reference | High |
|---|---|---|---|
| Vessel day rate | $150K/day | $225K/day | $300K/day |
| Weather availability (annual) | 200 days | 150 days | 100 days |
| Installation speed | 2.0 km/hr | 1.5 km/hr | 0.8 km/hr |
| Cable cost/km (manufacturing) | $0.8M/km | $1.2M/km | $2.0M/km |

### Impact on 300 km Regional Cable

| Scenario | Cable CAPEX (300 km) | Delta from Reference |
|---|---|---|
| Favorable (low rate, good weather, flat seabed) | $240M | -$210M |
| Reference | $450M | $0 |
| Adverse (high rate, bad weather, rocky seabed) | $780M | +$330M |

Cable installation cost has the widest absolute range of any single CAPEX component. The difference between a favorable and adverse installation scenario is $540M -- nearly 30% of total platform CAPEX [5][6].

### PNW-Specific Risk

The PNW coast presents above-average cable installation difficulty:
- **Volcanic basalt substrate:** Requires rock cutting ($0.1-0.3 km/hr) vs. standard burial ($1.5-2.5 km/hr)
- **Short weather window:** May-September reliable; winter work at 2-3x effective cost due to weather downtime
- **Steep shelf gradient:** Rapid depth changes increase cable stress and require specialized laying profiles

> **Related:** [Energy Infrastructure](02-energy-infrastructure.md) Section 6 for cable installation economics detail

---

## 5. Driver 3: Offshore Wind CAPEX Trajectory

The platform's long-term energy economics depend on whether offshore wind CAPEX continues its historical decline. IRENA reports 62% cost reduction between 2010 and 2024, but future trajectory is uncertain [7][8].

### Trajectory Scenarios

| Scenario | 2024 CAPEX | 2030 CAPEX | 2035 CAPEX | 2035 LCOE | Source |
|---|---|---|---|---|---|
| Aggressive (DOE target) | $4,000+/kW (floating) | $2,000/kW | $1,200/kW | $45/MWh | DOE Floating Wind Shot |
| Moderate (IRENA trend) | $2,852/kW (fixed) | $2,200/kW | $1,800/kW | $55-65/MWh | IRENA learning curve |
| Conservative (supply chain constraints) | $2,852/kW | $2,500/kW | $2,200/kW | $70-90/MWh | Wood Mackenzie |
| Stalled (policy/supply failure) | $2,852/kW | $2,800/kW | $2,700/kW | $80-120/MWh | Risk scenario |

### Impact on Platform

At the regional scale (100 MW offshore wind), the difference between aggressive and stalled trajectories by 2035:
- **CAPEX difference:** $120M - $270M = $150M range
- **Annual LCOE difference:** $4.5M - $12M = $7.5M/year range
- **20-year NPV impact:** $75-150M at 8% discount rate

**Key insight:** Wind CAPEX trajectory matters less than BPA power cost for the platform's near-term economics. BPA hydro at $0.02/kWh ($20/MWh) is already cheaper than any wind scenario. Offshore wind matters only if BPA power cannot be cable-delivered to all compute nodes (i.e., for nodes beyond cable reach) [7][8][9].

> **CAUTION:** All forward-looking wind cost projections are labeled as projections. The DOE $45/MWh target requires technology breakthroughs (20 MW turbines, standardized floating platforms) that have not been demonstrated at commercial scale. The SINTEF/NorthWind "cheaper than expected" finding reflects European cost assumptions that may not transfer directly to PNW conditions.

---

## 6. Driver 4: BPA Power Cost Stability

The BPA hydro power advantage ($0.02/kWh) is the platform's single largest economic advantage. Any change to this cost -- through rate increases, policy changes, or capacity constraints -- has outsized impact [10][11].

### Risk Scenarios

| Scenario | BPA Rate | Annual Power Cost (100 MW) | Annual Savings vs. Grid | C5 Credit Impact |
|---|---|---|---|---|
| Current (stable) | $0.02/kWh | $17.5M | $87.5M | Reference |
| Moderate increase | $0.035/kWh | $30.7M | $74.3M | -15% |
| Significant increase | $0.05/kWh | $43.8M | $61.2M | -30% |
| Loss of preferential rate | $0.08/kWh | $70.1M | $34.9M | -60% |
| Grid parity | $0.12/kWh | $105M | $0 | -100% (credit eliminated) |

### BPA Rate Risk Factors

- **Salmon recovery costs:** Federal dam fish passage requirements may increase BPA operating costs
- **Dam removal advocacy:** Lower Snake River dam removal (politically active) could reduce BPA generation capacity by ~5%
- **Industrial load growth:** Data center demand in eastern Washington is growing rapidly; BPA allocation may not scale linearly
- **Climate change:** Reduced snowpack could lower Columbia River flows and hydroelectric generation, putting upward pressure on rates [10][11]

### Mitigation

- **Long-term power purchase agreement (PPA):** Lock in BPA rate for 15-20 years
- **Diversification:** Offset BPA dependency with onsite/offshore wind generation
- **Demand flexibility:** Scale compute load to match seasonal hydro generation patterns

---

## 7. Driver 5: Compute Revenue Rate

The platform's NPV is more sensitive to revenue than to any cost driver. Compute service pricing determines whether the platform generates positive returns [2][12].

### Revenue Scenarios

| Scenario | Revenue Rate | Annual Revenue (100 MW, 85%) | 20-Year Revenue (undiscounted) | NPV Impact vs. Reference |
|---|---|---|---|---|
| Premium (AI training) | $500/MW-hr | $372M | $7.44B | +$1.5B |
| Reference (cloud compute) | $350/MW-hr | $260M | $5.21B | $0 |
| Commodity (batch/archive) | $200/MW-hr | $149M | $2.98B | -$2.2B |
| Distressed (excess supply) | $150/MW-hr | $112M | $2.23B | -$3.0B |

**Key insight:** The maritime platform is NPV-positive at 8% discount rate only if compute revenue exceeds approximately $375/MW-hr. Below that threshold, the platform requires subsidy, strategic justification (infrastructure proof-of-concept), or revenue from non-compute sources (cable leasing, energy trading) [12].

### Market Risk

Cloud compute pricing has historically declined 5-10% annually due to competition, efficiency improvements, and capacity additions. However, AI workload demand has created a counter-trend: premium AI compute (GPU-hours) commands $1,000-5,000/MW-hr equivalent, 3-15x commodity pricing. The platform's financial viability depends on capturing AI-tier revenue, not commodity pricing [12][13].

---

## 8. Tornado Chart Analysis

Impact of +/-15% change in each driver on 20-year NPV (100 MW regional, 8% discount rate):

```
TORNADO CHART -- TOP 5 COST DRIVERS
Impact on 20-Year NPV (100 MW Regional Scenario)
================================================================

                      -$400M   -$200M    $0     +$200M   +$400M
                         |        |       |        |        |
  Compute Revenue    ====|========|=======|========|========|====
  (-15%)             <<<<<<<<<<<<<|                              (+15%)
                                  |>>>>>>>>>>>>>>>>>>>>>>>>>>>

  BPA Power Cost     ====|========|=======|========|========|
  (+15% = bad)       <<<<<<<<<<<<<|                              (-15% = good)
                                  |>>>>>>>>>>>>>>>>>>>>>>>

  Steel/Structural   ====|========|=======|========|========|
  (+15%)             <<<<<<<<<<<<|                               (-15%)
                                 |>>>>>>>>>>>>>>>>>>>>

  Cable Installation ====|========|=======|========|========|
  (+15%)             <<<<<<<<<<<|                                (-15%)
                                |>>>>>>>>>>>>>>>>>>>

  Offshore Wind CAPEX====|========|=======|========|========|
  (+15%)             <<<<<<|                                     (-15%)
                           |>>>>>>>>>>>

                         |        |       |        |        |
                      -$400M   -$200M    $0     +$200M   +$400M
```

### Reading the Chart

- **Longer bars = higher sensitivity.** Compute revenue dominates because it affects all 20 years of the NPV calculation
- **Revenue vs. cost asymmetry.** A 15% increase in revenue improves NPV by more than a 15% decrease in any single cost, because revenue is the largest term in the NPV equation
- **BPA power is a cost-side outlier.** Its impact exceeds steel and cable combined because it compounds annually (OPEX) rather than appearing once (CAPEX) [1][2]

---

## 9. Risk-Adjusted NPV

Risk-adjusted NPV incorporates probability-weighted scenarios rather than single-point estimates [2][14].

### Risk Categories

| Risk Category | Probability | Impact on NPV | Expected Value |
|---|---|---|---|
| Technology risk (marine compute failure) | 10% | -$1.91B (total CAPEX loss) | -$191M |
| Construction overrun (30% above budget) | 25% | -$573M | -$143M |
| Revenue shortfall (commodity pricing) | 30% | -$2.2B | -$660M |
| BPA rate increase (to $0.05/kWh) | 15% | -$280M | -$42M |
| Cable failure (major repair) | 20% | -$100-200M | -$30M |
| Regulatory delay (2 years) | 20% | -$150M (time value) | -$30M |
| Favorable outcome (AI premium revenue) | 20% | +$1.5B | +$300M |
| All convergence credits realized | 40% | +$548M | +$219M |

### Risk-Adjusted NPV Calculation

| Metric | Deterministic NPV (8%) | Risk Adjustment | Risk-Adjusted NPV |
|---|---|---|---|
| Reference case | -$120M | -- | -- |
| Expected downside | -- | -$1,096M | -- |
| Expected upside | -- | +$519M | -- |
| **Probability-weighted adjustment** | -- | **-$577M** | -- |
| **Risk-adjusted NPV** | -$120M | -$577M | **-$697M** |

### Interpretation

The risk-adjusted NPV of -$697M at 8% discount rate reflects the asymmetric risk profile of a first-of-kind infrastructure project: downside risks are numerous and have high expected values, while upside scenarios require favorable market conditions and successful technology execution [14].

**At 5% discount rate** (government capital), the risk-adjusted NPV improves to approximately -$257M -- still negative, but within range of strategic infrastructure subsidies for projects with demonstrated national interest (energy independence, compute sovereignty).

---

## 10. Scenario-Specific Risks

### Prototype (5 MW) Specific Risks

| Risk | Probability | Mitigation |
|---|---|---|
| Marine compute equipment failure | 20% | Redundant containers, shore-based backup |
| Cable damage (anchors, fishing) | 15% | Burial depth, exclusion zone, armoring |
| Vessel suitability issues | 10% | Extensive pre-purchase survey, classification |
| Permitting delay | 30% | Pre-application consultation, environmental baseline |

### Regional (100 MW) Specific Risks

| Risk | Probability | Mitigation |
|---|---|---|
| BPA allocation constraint | 15% | Multi-year PPA, generation diversification |
| PNW earthquake (Cascadia subduction) | 2%/year | Seismic design, cable route selection, insurance |
| Jones Act reclassification | 10% | Legal structure, foreign-flag operation strategy |
| Port capacity conflict | 10% | Long-term berth lease, NWSA partnership |
| Submarine cable fault | 5%/year | Repair vessel retainer, redundant cable route |

### Corridor (500 MW) Specific Risks

| Risk | Probability | Mitigation |
|---|---|---|
| Multi-jurisdiction regulatory conflict | 40% | Phased deployment, country-by-country permitting |
| Geopolitical instability (transit countries) | 20% | Route redundancy, diversified node locations |
| Technology obsolescence (20-year horizon) | 50% | Modular compute refresh, containerized hot-swap |
| Climate change impact on infrastructure | 30% | Climate-resilient design, adaptive maintenance |
| Exchange rate volatility | 35% | Revenue/cost currency matching, hedging |

> **SAFETY WARNING:** The Cascadia Subduction Zone poses a magnitude 8-9+ earthquake risk to PNW infrastructure, with a return period of approximately 200-600 years. Any subsea cable or port infrastructure in the PNW region must be designed to earthquake-resilient standards (IBC Seismic Design Category D or E). This is a non-negotiable safety requirement, not a cost optimization variable.

---

## 11. Cross-References

| Topic | Related Module | Related Projects |
|---|---|---|
| Compute cost inputs | [M1: Compute Costs](01-compute-cost-analysis.md) | MCM, NND |
| Energy cost inputs | [M2: Energy Infrastructure](02-energy-infrastructure.md) | THE, HGE, ACC |
| Transport cost inputs | [M3: Transport Economics](03-maritime-transport-economics.md) | OCN, WSB, ROF |
| Convergence credit sensitivity | [M4: Convergence Credits](04-convergence-credits.md) | ACC |
| Scenario baseline values | [M5: Scenario Comparison](05-scenario-comparison.md) | MCM |

---

## 12. Sources

1. Fox Infrastructure Group. *Maritime Platform Integrated Cost Model: Vision Document.* March 2026.
2. Brealey, Myers, Allen. *Principles of Corporate Finance.* 14th Edition, McGraw-Hill, 2023.
3. World Steel Association. *Steel Statistical Yearbook 2024.* worldsteel.org, 2024.
4. London Metal Exchange. *Steel Futures: HRC and Rebar Contract Specifications.* LME, 2024.
5. Thunder Said Energy. *Database of Cable Installation Vessels, Costs.* TSE, 2023.
6. Prysmian Group. *Submarine Cable Installation: Technical Capabilities and Vessel Fleet.* 2024.
7. International Renewable Energy Agency (IRENA). *Renewable Power Generation Costs in 2024.* IRENA, 2024.
8. U.S. Department of Energy / NREL. *Cost of Wind Energy Review: 2024 Edition.* NREL/TP-5000-91775, 2025.
9. SINTEF / NorthWind. "Floating Wind Can Be Cheaper Than Expected." SINTEF Blog, January 2025.
10. Bonneville Power Administration. *Wholesale Power Rates and Financial Overview.* BPA, FY2024.
11. Columbia Basin Institute. *Salmon Recovery and BPA Rate Impact Analysis.* 2024.
12. Synergy Research Group. *Cloud Infrastructure Service Revenue and Market Share.* Q4 2024.
13. NVIDIA. *Data Center GPU Pricing and Deployment Economics.* 2024.
14. Damodaran, Aswath. *Investment Valuation: Tools and Techniques.* 3rd Edition, Wiley, 2024.
15. USGS. *Cascadia Subduction Zone: Earthquake Hazard Assessment.* USGS, 2024.
16. Wood Mackenzie. *Global LCOE Reports: Wind and Solar 2024.* WoodMac, October 2024.
17. Drewry Shipping Consultants. *Ship Operating Costs Annual Review 2024/25.* Drewry, 2024.
18. International Group of P&I Clubs. *Annual Review 2024.* IG P&I, 2024.
