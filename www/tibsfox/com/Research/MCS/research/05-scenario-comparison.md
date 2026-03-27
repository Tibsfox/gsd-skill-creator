# Scenario Comparison

> **Domain:** Maritime Infrastructure Economics
> **Module:** 5 -- Three-Scale CAPEX/OPEX/NPV Analysis
> **Through-line:** *The question every infrastructure investor asks is not "does it work?" but "at what scale does it pay?" A prototype proves the concept. A regional deployment proves the economics. A corridor deployment proves the vision. This module answers all three with numbers, not narratives.*

---

## Table of Contents

1. [Scenario Framework](#1-scenario-framework)
2. [Prototype Scenario: 5 MW](#2-prototype-scenario-5-mw)
3. [Regional Scenario: 100 MW](#3-regional-scenario-100-mw)
4. [Corridor Scenario: 500 MW](#4-corridor-scenario-500-mw)
5. [Cost per MW-Hour of Compute](#5-cost-per-mw-hour-of-compute)
6. [Scenario Comparison Table](#6-scenario-comparison-table)
7. [NPV Analysis](#7-npv-analysis)
8. [Scale Economics](#8-scale-economics)
9. [PNW-Specific Deployment Model](#9-pnw-specific-deployment-model)
10. [Comparison to Conventional Alternatives](#10-comparison-to-conventional-alternatives)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Scenario Framework

Three deployment scales represent distinct phases of the maritime platform, each with different risk profiles, funding requirements, and economic characteristics [1].

| Parameter | Prototype | Regional | Corridor |
|---|---|---|---|
| Compute capacity | 5 MW | 100 MW | 500 MW |
| Vessels | 1 | 5 | 20+ |
| Cable length | 50 km | 300 km | 10,000+ km |
| Shore anchor | Electric City (BPA) | Electric City (BPA) | BC-to-Chile spine |
| Offshore wind | None (BPA power via cable) | 100 MW fixed/floating | 500+ MW distributed |
| Investment horizon | 5-year proof of concept | 20-year operational | 30-year infrastructure |
| Primary purpose | Technology validation | Commercial operation | Full corridor deployment |

### Cost Taxonomy

All costs are 2024 USD. CAPEX includes design, procurement, construction, and commissioning. OPEX includes annual operating costs (power, crew, maintenance, insurance, port fees). NPV uses three discount rates: 5% (government/utility), 8% (infrastructure fund), 12% (private equity) [1].

---

## 2. Prototype Scenario: 5 MW

The prototype validates the maritime compute platform concept with a single vessel carrying 5 MW of containerized compute, powered via a 50 km subsea cable from shore.

### CAPEX Breakdown

| Component | Estimate | Basis |
|---|---|---|
| Compute infrastructure (5 MW) | $60M | 5 MW x $12M/MW (marine premium net of cooling credit) |
| Offshore wind generation | $0 | Prototype uses BPA power via cable |
| Subsea cable (50 km, HVAC) | $50-100M | $1-2M/km for protected coastal route |
| Platform vessel (used 5,000 TEU) | $50-65M | Used vessel at 60-70% of $80-100M new-build |
| Shore interconnect | $5-10M | Grid tie at Electric City / coastal substation |
| Permitting and engineering | $5-10M | NEPA review, marine classification, coastal permits |
| **Total CAPEX** | **$170-245M** | |
| Convergence credits (C1-C4) | -$27-76M | See M4 convergence credit model |
| **Net CAPEX** | **$94-218M** | |

### Annual OPEX

| Category | Estimate | Basis |
|---|---|---|
| Power (BPA at $0.02/kWh) | $876K | 5 MW x 8,760 hrs x $0.02 |
| Cable maintenance | $500K-1M | $10-20K/km/year |
| Vessel operating | $3-5M | At-anchor profile, reduced crew |
| Compute maintenance | $500K-1M | Hardware refresh amortized |
| Insurance | $400-800K | Hull + P&I + compute equipment |
| Port fees | $200-500K | Annual berth lease, services |
| **Total Annual OPEX** | **$5.5-9.3M** | |

---

## 3. Regional Scenario: 100 MW

The regional scenario represents commercial-scale deployment with 5 vessels, 100 MW of compute, and an integrated energy spine [1][2].

### CAPEX Breakdown

| Component | Estimate | Basis |
|---|---|---|
| Compute infrastructure (100 MW) | $1.2B | 100 MW x $12M/MW |
| Offshore wind (100 MW) | $285M | 100 MW x $2,852/kW (IRENA 2024 fixed) |
| Subsea power cable (300 km, HVDC) | $300-600M | $1-2M/km + converter stations ($150-300M) |
| Subsea fiber bundle (300 km) | $10-15M | $30-50K/km co-installed |
| Platform vessels (5) | $100-500M | $20-100M each depending on type/condition |
| Port infrastructure | $50-100M | Dedicated berth, shore power, maintenance |
| Shore interconnect + BPA tie | $30-50M | Grid upgrade and converter |
| Permitting and engineering | $20-40M | Multiple permits, EIS, classification |
| **Total CAPEX** | **$1.99-2.79B** | |
| Convergence credits (C1-C4) | -$216-548M | See M4 |
| **Net CAPEX** | **$1.24-2.57B** | |

### Annual OPEX

| Category | Estimate | Basis |
|---|---|---|
| Power (BPA delivered) | $17.5M | 100 MW x 8,760 hrs x $0.02 (+cable losses) |
| Cable maintenance | $3-6M | 300 km power + fiber |
| Vessel operating (5 vessels) | $15-25M | At-anchor + periodic repositioning |
| Compute maintenance | $10-20M | 100 MW hardware refresh amortized |
| Insurance | $5-10M | Fleet H&M + P&I + compute |
| Port operations | $3-5M | Berth, services, shore power O&M |
| Offshore wind O&M | $5-10M | Industry benchmark $50-100K/MW/yr |
| Staffing (marine + IT) | $8-15M | 50-100 FTE across fleet and shore |
| **Total Annual OPEX** | **$66.5-111M** | |

---

## 4. Corridor Scenario: 500 MW

The full corridor scenario integrates with the Fox Infrastructure Group BC-to-Chile spine. This is a multi-decade infrastructure play requiring sovereign-level financing [1].

### CAPEX Breakdown

| Component | Estimate | Basis |
|---|---|---|
| Compute infrastructure (500 MW) | $6B | 500 MW x $12M/MW |
| Offshore wind (500 MW distributed) | $1.4B | Mixed fixed/floating, distributed along spine |
| Subsea power cable (10,000+ km, HVDC) | $4-8B | $1-4M/km HVDC with converter stations |
| Subsea fiber bundle | $300-500M | $30-50K/km |
| Vessel fleet (20+) | $500M-2B | Mixed new-build and used |
| Port infrastructure (5-10 ports) | $250-500M | Distributed along spine |
| Shore interconnects (multiple) | $150-300M | BPA + local grid ties |
| Permitting (multi-jurisdiction) | $50-100M | US, Canada, Mexico, Central/South America |
| **Total CAPEX** | **$12.65-18.9B** | |
| Convergence credits (C1-C4) | -$2.02-5.56B | See M4 |
| **Net CAPEX** | **$7.09-16.88B** | |

### Annual OPEX

| Category | Estimate | Basis |
|---|---|---|
| Power (BPA + distributed) | $100-200M | Mixed BPA and offshore wind |
| Cable maintenance | $30-80M | 10,000+ km subsea cable network |
| Vessel operations (20+) | $60-150M | Fleet operating costs |
| Compute maintenance | $50-100M | 500 MW hardware refresh |
| Insurance | $25-50M | Fleet + infrastructure portfolio |
| Port operations (5-10 ports) | $15-30M | Distributed shore facilities |
| Offshore wind O&M | $25-50M | 500 MW distributed |
| Staffing | $40-80M | 200-500 FTE global operation |
| **Total Annual OPEX** | **$345-740M** | |

> **CAUTION:** Corridor-scale estimates carry uncertainty ranges of +/-50% or greater. Multi-jurisdictional regulatory costs, exchange rate risk, and geopolitical stability across the BC-to-Chile corridor are not modeled. These estimates are order-of-magnitude planning figures, not investment-grade projections.

---

## 5. Cost per MW-Hour of Compute

The primary platform economics metric: total cost (CAPEX amortized + annual OPEX) divided by MW-hours of compute delivered [1][3].

### Methodology

- CAPEX amortized over 20 years using straight-line depreciation
- OPEX at midpoint of estimated range
- Utilization rate assumed at 85% (industry standard for well-managed data centers)
- Available compute hours: MW x 8,760 hours x 85% = 7,446 MW-hours per MW per year

### Results

| Metric | Prototype (5 MW) | Regional (100 MW) | Corridor (500 MW) |
|---|---|---|---|
| Net CAPEX (midpoint) | $156M | $1.91B | $12.0B |
| Annual CAPEX amortization | $7.8M | $95.5M | $600M |
| Annual OPEX (midpoint) | $7.4M | $88.8M | $542M |
| Total annual cost | $15.2M | $184.3M | $1,142M |
| Annual MW-hours (85% utilization) | 37,230 | 744,600 | 3,723,000 |
| **Cost per MW-hour** | **$408/MWh** | **$247/MWh** | **$307/MWh** |

### Interpretation

- **Prototype ($408/MWh):** High unit cost reflects fixed infrastructure (cable, vessel) spread over small compute base. Not commercially viable as a standalone operation -- justified as technology validation
- **Regional ($247/MWh):** Lowest unit cost. Convergence credits, BPA power, and scale reduce unit economics to a competitive range. This is the sweet spot for initial commercial operation
- **Corridor ($307/MWh):** Unit cost rises due to longer cable runs (HVDC at $1-4M/km), multi-jurisdiction complexity, and distributed infrastructure maintenance. Scale advantages in compute are offset by spine infrastructure costs

> **Related:** [Sensitivity Analysis](06-sensitivity-risk-analysis.md) for cost driver impact on these metrics

---

## 6. Scenario Comparison Table

| Parameter | Prototype | Regional | Corridor |
|---|---|---|---|
| Net CAPEX | $94-218M | $1.24-2.57B | $7.09-16.88B |
| Annual OPEX | $5.5-9.3M | $66.5-111M | $345-740M |
| Cost/MW-hr (midpoint) | $408 | $247 | $307 |
| Convergence credit % | 16-31% | 18-28% | 16-29% |
| BPA power savings (annual) | $4.4M | $87.5M | $438M |
| Vessels | 1 | 5 | 20+ |
| Cable km | 50 | 300 | 10,000+ |
| Compute density | 5 MW / vessel | 20 MW / vessel | 25 MW / vessel |
| Break-even (vs. grid power) | ~12 years | ~7 years | ~10 years |
| Risk level | High (technology) | Medium (execution) | High (geopolitical) |

---

## 7. NPV Analysis

20-year net present value analysis for the regional (100 MW) scenario at three discount rates [3][4].

### Revenue Assumptions

- Compute service revenue: $350/MW-hour (cloud compute market rate, conservative)
- Revenue growth: 2% annually (inflation-adjusted)
- Utilization: 85% (Year 1-3: 50%, 70%, 80% ramp; Year 4+: 85%)

### NPV Results (100 MW Regional)

| Metric | 5% Discount | 8% Discount | 12% Discount |
|---|---|---|---|
| Total Revenue (20-yr PV) | $3.34B | $2.66B | $2.03B |
| Net CAPEX (midpoint) | -$1.91B | -$1.91B | -$1.91B |
| Total OPEX (20-yr PV) | -$1.11B | -$0.87B | -$0.65B |
| **Net NPV** | **$320M** | **-$120M** | **-$530M** |
| IRR | ~6.8% | -- | -- |

### Interpretation

- **At 5% discount rate** (government/utility capital): NPV-positive at $320M. Viable for publicly-financed infrastructure or utility-backed investment
- **At 8% discount rate** (infrastructure fund): NPV-negative at -$120M. Near break-even; sensitive to revenue assumptions and convergence credit realization
- **At 12% discount rate** (private equity): NPV-negative at -$530M. Not viable as a purely private investment at current cost assumptions
- **Implied IRR:** ~6.8%, consistent with large infrastructure projects (ports, subsea cables, offshore wind farms typically deliver 5-8% IRR) [3][4]

> **SAFETY WARNING:** NPV projections assume compute service revenue of $350/MW-hour, which is below current cloud compute pricing but reflects assumed downward pressure from commodity compute supply growth. Revenue sensitivity is explored in M6.

---

## 8. Scale Economics

### Economies of Scale

The platform exhibits standard infrastructure scale economics:
- **Compute:** $12M/MW at all scales (linear scaling, no volume discount in this model)
- **Cable:** Cost per km decreases slightly with distance (mobilization amortized over longer run)
- **Vessels:** Fleet discounts of 5-10% for multi-vessel orders from the same yard
- **Port:** Shared port infrastructure has decreasing marginal cost per additional vessel

### Diseconomies of Scale

The corridor scenario demonstrates diseconomies that the regional scenario avoids:
- **Cable distance:** 10,000+ km of HVDC cable is 30x the regional scenario, but infrastructure complexity increases faster than linearly (converter stations, repair logistics, political risk)
- **Multi-jurisdiction:** Each national boundary adds regulatory compliance cost and political risk premium
- **Maintenance logistics:** Subsea cable repair vessels must be positioned along the corridor, requiring distributed fleet infrastructure [5]

### Optimal Scale

The regional scenario (100 MW, 5 vessels, 300 km cable) represents the optimal scale for initial commercial deployment:
- Lowest cost per MW-hour ($247)
- Highest convergence credit efficiency (18-28%)
- Single-jurisdiction regulatory environment (US West Coast)
- Proximity to BPA hydro anchor
- Manageable complexity for first-generation operations team

---

## 9. PNW-Specific Deployment Model

The regional scenario maps to specific PNW geography [6][7].

```
PNW REGIONAL DEPLOYMENT (100 MW)
================================================================

  SHORE ANCHOR                    OFFSHORE ZONE
  +-----------------+             +-------------------+
  | Electric City   |             | Compute Cluster   |
  | Grand Coulee    |  280 km     | 5 vessels at      |
  | BPA $0.02/kWh   |--HVDC----->| anchor, 20 MW each|
  | Columbia River   |  cable     | Ocean-cooled       |
  +-----------------+             | 85% utilization    |
        |                         +-------------------+
        | I-90/I-82                      |
        | corridor                       | 20 km
        v                                v
  +-----------------+             +-------------------+
  | Seattle/Tacoma  |             | Offshore Wind     |
  | NWSA Ports      |             | 100 MW (future)   |
  | Shore power     |             | BOEM lease area   |
  | Maintenance base|             | Oregon coast      |
  +-----------------+             +-------------------+
```

### Route Economics

- **Electric City to coast (HVDC):** 280 km at $1.5M/km = $420M (cable + converter stations)
- **Shore to offshore cluster:** 20 km at $1M/km = $20M (HVAC, short protected route)
- **Total cable infrastructure:** ~$440M
- **BPA power delivered offshore:** $0.02/kWh + ~$0.01/kWh cable amortization + losses = ~$0.035/kWh
- **Annual power cost (100 MW at $0.035/kWh):** $30.7M

---

## 10. Comparison to Conventional Alternatives

How does the maritime platform compare to conventional shore-based deployment at Electric City (no offshore component)?

| Metric | Maritime Platform (100 MW) | Shore-Based at Electric City | Delta |
|---|---|---|---|
| CAPEX | $1.91B | $1.0-1.2B | +$710M-910M |
| Annual OPEX | $88.8M | $45-60M | +$29-44M |
| Power cost | $30.7M (cable-delivered) | $17.5M (direct BPA) | +$13.2M |
| Cooling cost | $0 (ocean) | $5-10M (air/evaporative) | -$5-10M |
| Land cost | $0 (offshore) | $20-40M (100 MW footprint) | -$20-40M |
| Cost/MW-hr | $247 | $165 | +$82 |

**The shore-based alternative is cheaper.** The maritime platform's premium justifies itself only if:
1. Offshore location provides unique value (latency to transpacific cable, proximity to offshore wind)
2. Scalability beyond shore-based capacity limits is required
3. The platform serves as infrastructure proof-of-concept for the corridor vision
4. Vessel mobility enables workload positioning that shore-based cannot replicate [8]

---

## 11. Cross-References

| Topic | Related Module | Related Projects |
|---|---|---|
| Compute CAPEX inputs | [M1: Compute Costs](01-compute-cost-analysis.md) | MCM, NND |
| Energy cost inputs | [M2: Energy Infrastructure](02-energy-infrastructure.md) | THE, HGE |
| Vessel cost inputs | [M3: Transport Economics](03-maritime-transport-economics.md) | OCN, WSB |
| Convergence credit inputs | [M4: Convergence Credits](04-convergence-credits.md) | ACC |
| Sensitivity on these results | [M6: Risk Analysis](06-sensitivity-risk-analysis.md) | ROF |

---

## 12. Sources

1. Fox Infrastructure Group. *Maritime Platform Integrated Cost Model: Vision Document.* March 2026.
2. International Renewable Energy Agency (IRENA). *Renewable Power Generation Costs in 2024.* IRENA, 2024.
3. Brealey, Myers, Allen. *Principles of Corporate Finance.* 14th Edition, McGraw-Hill, 2023. (NPV methodology)
4. Damodaran, Aswath. *Investment Valuation.* 3rd Edition, Wiley, 2024. (Discount rate frameworks)
5. ESRU, University of Strathclyde. *HVAC vs. HVDC Transmission: Break-Even Distance Analysis.* 2023.
6. Bonneville Power Administration. *Wholesale Power Rates and Financial Overview.* BPA, FY2024.
7. Northwest Seaport Alliance. *Annual Report and Container Statistics 2023.* NWSA, 2024.
8. CBRE. *Data Center Construction Cost Benchmarks 2025.* CBRE Research, 2025.
9. Wood Mackenzie. *Global LCOE Reports: Wind and Solar 2024.* WoodMac, October 2024.
10. Cushman & Wakefield. *U.S. Data Center Development Cost Guide 2025.* C&W Research, 2025.
11. NREL. *Annual Technology Baseline (ATB): Offshore Wind 2024.* atb.nrel.gov, 2024.
12. U.S. Energy Information Administration. *Electric Power Monthly: Average Retail Price.* EIA, 2024.
13. Drewry Shipping Consultants. *Ship Operating Costs Annual Review 2024/25.* Drewry, 2024.
14. Uptime Institute. *Annual Data Center Survey 2024.* Uptime Institute, 2024.
15. Digital Realty. *Capital Markets Day Presentation: Build Cost Benchmarks.* 2024.
