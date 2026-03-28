# Compute Cost Analysis

> **Domain:** Maritime Infrastructure Economics
> **Module:** 1 -- Offshore and Marine-Deployed Data Center Economics
> **Through-line:** *The chiller plant is a tax on geography. Move the compute to where the coolant is free, and the economics shift from energy scarcity to structural engineering -- a trade the ocean wins at scale.* Shore-based data center CAPEX is well-documented. The marine premium is not. This module closes that gap with sourced numbers, not estimates.

---

## Table of Contents

1. [Shore-Based Data Center Benchmarks](#1-shore-based-data-center-benchmarks)
2. [Cost Component Breakdown](#2-cost-component-breakdown)
3. [Marine Deployment Premium](#3-marine-deployment-premium)
4. [Ocean Cooling Credit](#4-ocean-cooling-credit)
5. [Net Marine Compute CAPEX](#5-net-marine-compute-capex)
6. [AI vs. Standard Compute Density](#6-ai-vs-standard-compute-density)
7. [Container Data Center Benchmarks](#7-container-data-center-benchmarks)
8. [PNW Shore-Based Reference Points](#8-pnw-shore-based-reference-points)
9. [Operating Cost Model](#9-operating-cost-model)
10. [Water Consumption and Environmental](#10-water-consumption-and-environmental)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Shore-Based Data Center Benchmarks

The baseline for maritime compute economics begins with shore-based construction costs, which have been extensively documented by CBRE, Cushman & Wakefield, and Digital Realty across the 2024-2025 reporting period. These benchmarks establish the floor against which marine deployment premiums and cooling credits are measured [1][2].

| Facility Type | CAPEX/MW | CAPEX/sqft | Source |
|---|---|---|---|
| General purpose (Tier III) | $10-12M | $600-1,100 | CBRE / Cushman & Wakefield 2025 |
| AI-optimized (liquid cooled) | $20M+ | $1,200-2,200 | CBRE 2025 |
| Hyperscale campus | $12M avg | $1,050 | Digital Realty 2024 |
| Brownfield redevelopment | $7-8M | $525-700 | QTS / Dgtl Infra 2024 |
| Prime market (NYC/Silicon Valley) | $18-25M | $2,200 | Cushman & Wakefield 2024 |

The general-purpose Tier III facility at $10-12M per MW of IT load represents the most common benchmark in industry literature. This figure includes land acquisition, shell construction, MEP (mechanical, electrical, plumbing) systems, and first-generation IT infrastructure support. It does not include the IT hardware itself [1].

The AI-optimized benchmark at $20M+ per MW reflects the liquid cooling infrastructure, higher power density per rack (30-100 kW vs. 6-15 kW for standard), and structural reinforcement for GPU cluster weight. This category has grown rapidly since 2023, driven by large language model training demand [2].

> **SAFETY WARNING:** Cost benchmarks are snapshots of specific market conditions. The 23% year-over-year increase in large-parcel land costs (Cushman & Wakefield 2025) means benchmarks from even 12 months prior may significantly understate current costs. All figures in this module are 2024 USD unless otherwise noted.

---

## 2. Cost Component Breakdown

Understanding where money goes inside a data center is essential for calculating the marine deployment premium, because not all cost components are affected equally by maritime conditions.

### MEP Systems: 40-50% of Total Budget

Mechanical, electrical, and plumbing systems consume the largest share of data center construction cost. Within MEP, the breakdown is approximately [1][3]:

- **Electrical systems:** 40-45% of total expenditure (UPS, switchgear, PDUs, generators, transformer)
- **Cooling systems:** 20-40% of MEP budget (chillers, cooling towers, CRAH units, piping)
- **Plumbing and fire suppression:** 5-10% of MEP budget

### Land: 15-20% of Total Cost

Land acquisition averages $5.59/sqft nationally in 2024, with large-parcel costs (10+ acres) up 23% year-over-year per Cushman & Wakefield 2025 [1]. This cost component is eliminated entirely in vessel-mounted or platform-based marine deployment.

### Shell and Structure: 20-30%

Building shell, structural steel, concrete foundations, and site work. This is the component most affected by marine deployment -- corrosion-resistant materials, wave loading design, and weatherproofing add the marine structural premium.

### Soft Costs: 10-15%

Permitting, design, project management, commissioning. Marine deployment may increase permitting costs due to coastal zone management and maritime regulatory requirements.

---

## 3. Marine Deployment Premium

Shore-based data center benchmarks require three adjustments for maritime deployment. The marine structural premium is the dominant cost adder, partially offset by the ocean cooling credit (Section 4) and land cost elimination.

### Structural Premium: +30-50% on Shell

The marine structural premium covers:

- **Corrosion-resistant materials and coatings** for saltwater environments. Marine-grade stainless steel (316L) costs approximately 2-3x standard structural steel. Coatings (epoxy, polyurethane, zinc) add 10-20% to structural costs [4]
- **Structural reinforcement for wave loading** and vessel motion (if vessel-mounted). DNV GL classification standards require design for 25-year return period wave conditions [5]
- **Weatherproofing and pressure-rated enclosures** for subsurface or splash-zone installations
- **Marine electrical standards** (IEC 60092) vs. land-based codes -- marine-rated switchgear and cable costs 30-60% more than land equivalents [6]

### Land Cost Elimination: -15-20%

Vessel-mounted or offshore platform deployment eliminates land acquisition entirely. At $5.59/sqft average (2024), a 100 MW facility requiring approximately 400,000 sqft of land represents $2.2M in avoided land cost -- significant at small scale, proportionally minor at large scale relative to other cost components [1].

### Permitting Complexity: +5-15% on Soft Costs

Coastal zone management, Jones Act compliance (for US-flagged construction vessels), NEPA environmental review for offshore construction, and maritime classification society approvals add permitting timeline and cost. The Jones Act alone can double vessel charter costs for US coastal construction work [7].

---

## 4. Ocean Cooling Credit

The ocean cooling credit is the single largest offset to the marine deployment premium. North Pacific and North Atlantic surface water temperatures of 8-15C provide direct cooling without mechanical refrigeration, eliminating the chiller plant entirely [8].

### CAPEX Credit: $1-2M per MW

The derivation:
- MEP systems = 50% of $10M/MW baseline = $5M/MW
- Cooling = 20-40% of MEP = $1-2M/MW
- Ocean cooling eliminates this entire capital expenditure

The range reflects the variation between standard air-cooled facilities (lower cooling CAPEX) and high-density liquid-cooled facilities (higher cooling CAPEX). AI-optimized facilities at $20M+/MW have proportionally higher cooling CAPEX, making the ocean credit more valuable for compute-dense deployments [2][3].

### OPEX Credit: $0.5-1M per MW Annually

Cooling systems in shore-based data centers consume 15-20% of total facility electricity. At a 100 MW facility paying $0.10/kWh, cooling electricity costs $13-17.5M annually. Ocean cooling eliminates the mechanical cooling electricity load entirely, though seawater pump power consumption (approximately 2-5% of cooling load equivalent) partially offsets this credit [8][9].

### Water Consumption Elimination

Shore-based data centers consume approximately 2 million liters per day per 100 MW of IT load (IEA 2024 estimate). This water consumption -- a growing regulatory and social license concern in water-stressed regions -- is eliminated by ocean cooling. The ocean provides unlimited supply at zero marginal cost [10].

### Temperature Advantage

PNW coastal waters maintain 8-12C year-round surface temperatures (NOAA buoy data, Station 46087 Neah Bay). This provides a delta-T of 25-35C against standard server inlet temperatures of 35-45C, enabling direct heat exchange without mechanical refrigeration. Compare to Singapore (28-30C surface water) or Gulf of Mexico (25-30C summer), where ocean cooling provides a smaller or seasonal advantage [8].

> **Related:** [Energy Infrastructure Costs](02-energy-infrastructure.md) for power delivery to marine compute nodes; [Convergence Credits](04-convergence-credits.md) for integrated credit quantification

---

## 5. Net Marine Compute CAPEX

Combining the marine premium and ocean cooling credit:

| Component | Value | Basis |
|---|---|---|
| Shore-based baseline | $10M/MW | CBRE / Cushman & Wakefield 2025, Tier III general purpose |
| Marine structural premium | +35% on shell (+$1.4M/MW) | Estimated: 35% of 40% shell = $1.4M (midpoint of 30-50% range) |
| Marine electrical premium | +45% on electrical (+$0.9M/MW) | IEC 60092 marine-rated equipment vs. land-based |
| Ocean cooling CAPEX credit | -$1.5M/MW | Midpoint of $1-2M/MW range |
| Land cost elimination | -$0.5M/MW | Estimated for standard facility footprint |
| **Net marine compute CAPEX** | **~$12.3M/MW** | **+23% over shore-based baseline** |

This $12.3M/MW net marine compute CAPEX is comparable to AI-optimized shore-based facilities at equivalent compute density, with superior cooling headroom for future density growth. The marine platform trades a structural engineering premium for the elimination of cooling infrastructure and land -- a trade that becomes more favorable as compute density increases [2][3].

---

## 6. AI vs. Standard Compute Density

The economics of marine deployment shift dramatically between standard and AI-optimized compute:

### Standard Compute (6-15 kW/rack)

- Shore-based: $10-12M/MW
- Marine: ~$12.3M/MW (23% premium)
- Ocean cooling credit: modest ($1-1.5M/MW), because standard cooling CAPEX is lower
- **Verdict:** Marine deployment is 15-25% more expensive than shore-based for standard compute density

### AI-Optimized Compute (30-100 kW/rack)

- Shore-based: $20M+/MW (CBRE 2025)
- Marine: ~$18-22M/MW (cooling credit offsets more of the premium)
- Ocean cooling credit: significant ($2-4M/MW), because liquid cooling infrastructure is expensive
- **Verdict:** Marine deployment reaches cost parity or slight advantage for high-density AI compute

The implication for the maritime platform: vessel-mounted or offshore compute nodes should target high-density workloads (AI training, inference, HPC) where the ocean cooling credit has the greatest impact. Standard compute workloads are better served by shore-based facilities at the BPA hydro anchor [2][11].

---

## 7. Container Data Center Benchmarks

Containerized (modular) data centers are the most likely form factor for vessel-mounted maritime compute. Pre-fabricated in 20- or 40-foot ISO container form factors, they offer:

- **Standardized dimensions:** Compatible with container ship cargo holds and deck mounting
- **Factory-built quality:** Controlled manufacturing environment vs. field construction
- **Rapid deployment:** 12-16 weeks from order to operational vs. 18-24 months for purpose-built facilities
- **Cost benchmark:** $3-5M per container (1-2 MW IT load per 40ft unit) per Dgtl Infra 2024 [3]
- **Power density:** Up to 100 kW/rack achievable with direct liquid cooling in containerized form factor

For the maritime platform, containerized compute offers the additional advantage of removability -- containers can be offloaded for maintenance, upgrade, or redeployment without drydocking the vessel [3][12].

---

## 8. PNW Shore-Based Reference Points

The Pacific Northwest provides the shore-based anchor for the maritime platform, with Electric City (Grand Coulee Dam / BPA hydro) as the primary compute anchor point.

### Electric City Advantages

- **Power cost:** $0.02/kWh from BPA hydro -- the lowest grid electricity cost in the US [13]
- **Climate cooling:** Average temperature 7C (January) to 19C (July) -- reduces even shore-based cooling load
- **Columbia River water:** Abundant cooling water supply, no water stress
- **Existing fiber:** Existing telecommunications infrastructure along I-90 and I-82 corridors

### PNW Port Proximity

- **Seattle:** 280 miles from Electric City. Major container port (3.5M TEU, 2023)
- **Tacoma:** 270 miles from Electric City. Adjacent to Seattle port complex
- **Portland:** 290 miles from Electric City. Columbia River access, smaller container volumes

The cable distance from Electric City to coast (approximately 280 km) falls within the HVAC-HVDC break-even zone (~80-100 km for HVDC advantage), suggesting HVDC for the shore-to-offshore power link [14].

> **Related:** [Scenario Comparison](05-scenario-comparison.md) for PNW-specific deployment scenarios

---

## 9. Operating Cost Model

Annual operating costs for marine compute include categories not present in shore-based facilities:

| Cost Category | Shore-Based (per MW/yr) | Marine (per MW/yr) | Delta |
|---|---|---|---|
| Electricity (at BPA $0.02/kWh) | $175K | $175K | Neutral (cable-delivered) |
| Cooling electricity | $25-35K | $5-8K (pump only) | -$20-27K |
| Staffing (on-site) | $50-80K | $80-150K (marine crew) | +$30-70K |
| Maintenance | $30-50K | $60-120K (marine premium) | +$30-70K |
| Insurance | $15-25K | $40-80K (marine hull+P&I) | +$25-55K |
| Cable maintenance (allocated) | $0 | $10-30K | +$10-30K |
| **Total OPEX per MW/yr** | **$295-415K** | **$370-563K** | **+$75-148K** |

Marine OPEX runs approximately 25-40% higher than shore-based on a per-MW basis. The OPEX premium is smaller in absolute terms than the CAPEX cooling credit, meaning the breakeven period for marine vs. shore-based deployment depends heavily on compute density and utilization rate [9][15].

---

## 10. Water Consumption and Environmental

Data center water consumption has become a significant regulatory and social license factor. The IEA (2024) reports global data center electricity consumption reached approximately 460 TWh in 2022, with water consumption for cooling estimated at 2 million liters per day per 100 MW of IT load [10].

### Marine Advantage

Ocean-cooled facilities eliminate freshwater consumption entirely. In the PNW context, this eliminates competition with:
- Agricultural irrigation in the Columbia Basin
- Salmon habitat flow requirements in the Columbia and Snake river systems
- Municipal water supply in drought-prone eastern Washington

### Environmental Considerations

Marine deployment introduces different environmental concerns:
- **Thermal discharge:** Warm water returned to ocean from cooling circuit (typically 5-10C above ambient). Environmental impact depends on discharge rate and local marine ecology [16]
- **Noise:** Subsea infrastructure installation and operational noise affecting marine mammals. NOAA Level B harassment threshold: 120 dB re 1 uPa for continuous noise [17]
- **Electromagnetic fields:** Subsea power cables produce EMF that may affect magnetically-sensitive species (sharks, rays, salmon). Burial depth of 1-2 meters mitigates most effects [18]

> **SAFETY WARNING:** All marine infrastructure siting must comply with NEPA environmental review requirements. Cable and platform routes through tribal territorial waters require nation-specific consent per UNDRIP Article 31 and OCAP principles. This cost model does not constitute environmental clearance.

---

## 11. Cross-References

| Topic | Related Module | Related Projects |
|---|---|---|
| Power delivery to marine compute | [M2: Energy Infrastructure](02-energy-infrastructure.md) | THE, HGE |
| Vessel-mounted compute co-location | [M3: Transport Economics](03-maritime-transport-economics.md) | OCN, ROF |
| Ocean cooling as convergence credit | [M4: Convergence Credits](04-convergence-credits.md) | MCM, NND |
| Compute cost in scenario models | [M5: Scenario Comparison](05-scenario-comparison.md) | ACC |
| Compute cost sensitivity | [M6: Sensitivity Analysis](06-sensitivity-risk-analysis.md) | WSB |

---

## 12. Sources

1. Cushman & Wakefield. *U.S. Data Center Development Cost Guide 2025.* C&W Research, 2025.
2. CBRE. *Data Center Construction Cost Benchmarks 2025.* CBRE Research, 2025.
3. Dgtl Infra. "How Much Does It Cost to Build a Data Center?" dgtlinfra.com, June 2024.
4. ASTM International. *Standard Practice for Calculating Corrosion Rates from Electrochemical Measurements.* ASTM G102-89, 2024.
5. DNV GL. *Rules for Classification of Ships: Hull Structural Design.* DNV-RU-SHIP Pt.3, 2024.
6. International Electrotechnical Commission. *IEC 60092: Electrical Installations in Ships.* IEC, 2023.
7. Jones Act (46 U.S.C. 55102). Merchant Marine Act of 1920, Section 27.
8. NOAA. *National Data Buoy Center: Station 46087 (Neah Bay, WA).* NOAA NDBC, 2024.
9. U.S. Department of Energy. *Better Buildings: Data Center Energy Efficiency.* DOE, 2024.
10. International Energy Agency. *Energy and AI.* IEA, April 2025.
11. NVIDIA. *Data Center Design Guide for AI Workloads.* NVIDIA Technical Brief, 2024.
12. Schneider Electric. *Modular Data Center Design Guide.* White Paper 226, 2024.
13. Bonneville Power Administration. *Wholesale Power Rates.* BPA, FY2024.
14. ESRU, University of Strathclyde. *HVAC vs. HVDC Transmission: Break-Even Distance Analysis.* 2023.
15. Uptime Institute. *Annual Data Center Survey: Operating Cost Trends 2024.* Uptime Institute, 2024.
16. NOAA Fisheries. *Thermal Effluent Guidelines for Coastal Waters.* NOAA, 2023.
17. NOAA Fisheries. *Ocean Noise Strategy Roadmap.* NOAA, 2024.
18. Normandeau Associates. *Undersea Cable EMF Impacts on Marine Species: Literature Review.* 2023.
