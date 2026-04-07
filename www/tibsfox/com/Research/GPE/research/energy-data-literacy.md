# Energy Data Literacy: Reading the Numbers

> **Domain:** Global Power Efficiency / Energy Systems
> **Module:** Research Supplement — How to Read Energy Bills, Units, Rate Structures, Grid Operations, Carbon Accounting, Data Sources
> **Through-line:** *Every number in the GPE rankings started as a meter reading somewhere. Understanding energy data means being able to follow that number from the meter on a building in Seoul to the kilowatt-hour figure in a national electricity balance sheet to the intensity ratio that places a country in the rankings. This module is the entry point for everything else in the GPE series — the literacy layer below which all other analysis rests.*

---

## Table of Contents

1. [Why Energy Data Literacy Matters](#1-why-energy-data-literacy-matters)
2. [Understanding Energy Units](#2-understanding-energy-units)
   - 2.1 [The Core Units and Their Relationships](#21-the-core-units-and-their-relationships)
   - 2.2 [Conversion Reference Table](#22-conversion-reference-table)
   - 2.3 [Scale Reference: From a Lightbulb to a Country](#23-scale-reference-from-a-lightbulb-to-a-country)
3. [How to Read an Electricity Bill](#3-how-to-read-an-electricity-bill)
   - 3.1 [Residential Bills: kWh, Fixed Charges, Taxes](#31-residential-bills-kwh-fixed-charges-taxes)
   - 3.2 [Commercial and Industrial Bills: Demand Charges](#32-commercial-and-industrial-bills-demand-charges)
   - 3.3 [Time-of-Use Pricing](#33-time-of-use-pricing)
   - 3.4 [Rate Structures: A Taxonomy](#34-rate-structures-a-taxonomy)
4. [How to Read a Utility Rate Schedule](#4-how-to-read-a-utility-rate-schedule)
5. [Understanding Grid Operations](#5-understanding-grid-operations)
   - 5.1 [ISO/RTO Market Structure](#51-isorto-market-structure)
   - 5.2 [Wholesale Electricity Markets](#52-wholesale-electricity-markets)
   - 5.3 [Capacity Markets and Ancillary Services](#53-capacity-markets-and-ancillary-services)
   - 5.4 [How Retail Rates Are Set](#54-how-retail-rates-are-set)
6. [Carbon Accounting Basics](#6-carbon-accounting-basics)
   - 6.1 [Scope 1, 2, and 3 Emissions](#61-scope-1-2-and-3-emissions)
   - 6.2 [Market-Based vs. Location-Based Accounting](#62-market-based-vs-location-based-accounting)
   - 6.3 [Carbon Offsets vs. Carbon Insets](#63-carbon-offsets-vs-carbon-insets)
7. [Energy Data Sources for Research](#7-energy-data-sources-for-research)
8. [How the GPE Ranking Metric Works](#8-how-the-gpe-ranking-metric-works)
9. [How to Read an Energy Audit Report](#9-how-to-read-an-energy-audit-report)
10. [DIY Project: Pull Your Utility Data via Green Button and Analyze in Python](#10-diy-project-pull-your-utility-data-via-green-button-and-analyze-in-python)
11. [College of Knowledge Integration](#11-college-of-knowledge-integration)
12. [Cross-Links and Sources](#12-cross-links-and-sources)

---

## 1. Why Energy Data Literacy Matters

Energy literacy is increasingly a civic skill, not just a technical one. Energy costs are a primary driver of inflation, industrial competitiveness, and household economic security. Carbon accounting shapes corporate reporting requirements, investment decisions, and treaty compliance. The transition to renewable energy is reshaping utility rates, grid operations, and building systems in ways that affect every household and business. Yet most people cannot explain the difference between a kilowatt and a kilowatt-hour, cannot read their own utility bill beyond the "amount due" line, and have no framework for evaluating claims about national energy efficiency.

The GPE rankings exist precisely to address this. But the rankings are most powerful when the reader understands what the numbers mean — how they are calculated, what sources feed them, where they can be wrong, and what a given ranking tells you about a country's energy system that the number alone does not convey.

This module is the **entry point** to the GPE research series. It assumes no prior technical background. By the end, readers should be able to:
- Convert any energy quantity to any other with confidence
- Read their own electricity bill and understand every line
- Understand how wholesale electricity prices are set and how they flow to retail rates
- Perform basic carbon accounting for a household or organization
- Access and interpret primary energy data from the major authoritative sources
- Understand exactly how the GPE electricity intensity metric is computed and what it measures

---

## 2. Understanding Energy Units

### 2.1 The Core Units and Their Relationships

Energy and power are among the most unit-cluttered domains in science and engineering. History, geography, and industry have produced a bewildering set of unit systems that coexist in active use. The following is the minimum coherent set needed for energy research:

**Power vs. Energy:** The single most important conceptual distinction in energy literacy.
- **Power** is the rate of energy flow — how fast energy is being used or produced. The SI unit is the **watt (W)** = 1 joule per second.
- **Energy** is the total amount of energy used over a period of time. The SI unit is the **joule (J)**. In electricity, energy is almost always measured in **kilowatt-hours (kWh)**.

The relationship: **Energy = Power × Time**. A 1,000-watt (1 kW) space heater running for 3 hours uses 3 kWh of energy. A 100-watt lightbulb running for 10 hours uses 1 kWh.

**The kilowatt-hour (kWh)** is the commercial unit of electrical energy worldwide. It is:
- 1 kilowatt (1,000 watts) of power for 1 hour
- Equal to 3,600,000 joules (3.6 MJ)
- The unit on every residential electricity bill
- The unit in which national electricity consumption statistics are reported (scaled to terawatt-hours, TWh, for national totals: 1 TWh = 1 billion kWh = 10¹² watt-hours)

**The British Thermal Unit (BTU)** is the traditional unit for heat energy in the United States (and UK historical usage):
- 1 BTU = the energy needed to raise 1 pound of water by 1°F
- 1 BTU = 1,055 joules ≈ 0.000293 kWh
- Natural gas is measured and billed in therms (1 therm = 100,000 BTU) or dekatherms (1 dth = 10 therms = 1,000,000 BTU = 1 MMBTU)
- Heating and cooling equipment capacity is rated in BTU/hour or tons (1 ton of refrigeration = 12,000 BTU/hour)

**The therm:** The retail unit for natural gas in the United States. 1 therm = 100,000 BTU = 29.3 kWh of heat energy (if combusted at 100% efficiency; a 95%-efficient furnace converts 1 therm to 27.8 kWh of useful heat).

**The joule:** The SI base unit of energy. Used in physics and scientific literature but rarely in energy industry practice. Key: 1 kWh = 3.6 MJ (megajoules = 10⁶ joules).

**The watt-peak (Wp) / kilowatt-peak (kWp):** Used for solar panel ratings. The "peak" refers to performance at Standard Test Conditions (STC: 1,000 W/m² irradiance, 25°C cell temperature, standard spectrum). A 400 Wp solar panel produces 400 watts under STC; actual average output is 150–250 watts depending on location and orientation. A system rated at 5 kWp in Seattle produces approximately 5 × 1,200 peak-sun-hours/year = 6,000 kWh/year.

### 2.2 Conversion Reference Table

| From | To | Multiply by | Note |
|------|----|-------------|------|
| kWh | MJ | 3.6 | Exact |
| kWh | BTU | 3,412 | Exact |
| BTU | kWh | 0.000293 | = 1/3,412 |
| therm | kWh (heat) | 29.3 | At 100% efficiency |
| therm | BTU | 100,000 | Exact (definition) |
| MMBTU | kWh | 293 | = 1,000,000 BTU |
| MWh | kWh | 1,000 | Exact (prefix) |
| GWh | MWh | 1,000 | Exact (prefix) |
| TWh | GWh | 1,000 | Exact (prefix) |
| TWh | billion kWh | 1 | Exact |
| ton of refrigeration | kW (cooling) | 3.517 | = 12,000 BTU/hr |
| EJ (exajoule) | TWh | 277.8 | IEA often cites EJ for primary energy |
| Mtoe (million tonnes oil equiv.) | TWh | 11,630 | IEA/BP convention |

**Worked example:** Ireland consumed approximately 35 TWh of electricity in 2024, with a GDP per capita of approximately $129,000 (PPP-adjusted) and a population of 5.3 million. The GPE intensity calculation:

$$EI = \frac{35 \text{ TWh}}{129,000 \text{ USD/cap} \times 5.3 \text{ million}} \times 10^6 = \frac{35 \times 10^9 \text{ kWh}}{6.84 \times 10^{11} \text{ USD}} \times 10^6 \approx 0.51 \text{ kWh}/\$1,000$$

This is the calculation that places Ireland #1 in the GPE rankings — the combination of a high-GDP, service-oriented economy with relatively modest electricity consumption (limited manufacturing, mild climate, newer efficient housing stock).

### 2.3 Scale Reference: From a Lightbulb to a Country

| Scale | Power / Energy | Example |
|-------|----------------|---------|
| Human resting metabolism | ~80 W | A sleeping person is roughly an 80-watt heater |
| LED lightbulb | 8–10 W (≈60W incandescent equivalent) | |
| Laptop computer | 15–45 W | |
| Hair dryer | 1,200–1,800 W (1.2–1.8 kW) | |
| Electric vehicle charging (Level 2) | 7.2–11.5 kW | |
| Average US home (annual) | ~10,500 kWh/year (≈1.2 kW average) | EIA RECS 2020 |
| Average Japanese home (annual) | ~4,400 kWh/year | METI Japan |
| Gas-fired power plant (large) | 500–1,000 MW | |
| Large offshore wind farm | 1,000–3,000 MW (nameplate) | |
| Total US electricity consumption | ~4,400 TWh/year | 4.4 × 10¹² kWh |
| Total global electricity consumption | ~28,000–30,000 TWh/year | IEA 2024 |
| Total global primary energy | ~620 EJ/year | IEA WEB 2024 |

The comparison between US and Japanese home energy consumption (10,500 vs. 4,400 kWh/year) is not primarily a climate difference — it reflects differences in appliance efficiency standards, home size, and energy culture. A Japanese household in Tokyo uses 58% less electricity than a US household in a similar climate zone. This gap is a direct manifestation of the GPE rankings: Japan's residential sector efficiency partly explains its position, and the US's higher residential consumption is a structural driver of its lower GPE rank relative to its income level.

---

## 3. How to Read an Electricity Bill

### 3.1 Residential Bills: kWh, Fixed Charges, Taxes

A typical US residential electricity bill has the following components:

**Energy charge:** The core charge for electricity consumed, in dollars per kWh. For example: 320 kWh × $0.145/kWh = $46.40. This is the part of the bill that varies directly with consumption and is reduced by efficiency measures.

**Fixed/customer charge:** A flat monthly fee charged regardless of consumption. Typically $8–20/month in the US, covering meter reading, billing, and a portion of distribution infrastructure. This charge cannot be reduced by using less electricity — it is a structural feature of the utility's cost recovery. High fixed charges are controversial in low-income utility regulation because they shift cost burden from high consumers to low consumers.

**Distribution charge:** Sometimes itemized separately (in New England and New York, for example), the distribution charge covers the "wires" that connect the generation system to your home. Increasingly charged per kWh, but sometimes has a demand component.

**Transmission charge:** Covers the high-voltage transmission grid. Typically small ($0.01–0.03/kWh).

**Fuel cost adjustment / Energy cost adjustment:** Utilities with fuel pass-through provisions charge this separately to reflect actual fuel costs (natural gas price volatility, for example). This charge can swing dramatically — during the 2022 US natural gas price spike, some New England utilities added $0.04–0.08/kWh in fuel adjustment charges.

**Renewable portfolio standard (RPS) surcharge / system benefits charge:** Charges to recover the cost of state-mandated renewable energy procurement, efficiency programs, and low-income assistance. Typically $0.005–0.02/kWh.

**Taxes and fees:** Sales tax, local franchise fees, utility excise tax. Vary by state and municipality: New York City's combined state and city taxes add approximately $0.03/kWh to residential bills.

**Total effective rate:** Sum all components divided by kWh consumed = your true all-in rate. US national average for residential electricity: approximately $0.165/kWh as of Q1 2026, but ranging from $0.098/kWh in Idaho (hydroelectric-dominant) to $0.35+/kWh in California and Hawaii. [EIA Electric Power Monthly, March 2026.]

### 3.2 Commercial and Industrial Bills: Demand Charges

The most important distinction between residential and commercial electricity pricing is the **demand charge**: a charge based on the highest rate of electricity consumption (the peak demand) during the billing period, not just the total consumption.

**How demand is measured:** The utility meter records power consumption (in kilowatts) averaged over 15-minute or 30-minute intervals throughout the month. The highest such reading — even if it occurred only once, for 15 minutes, during a cold snap when all HVAC units ran simultaneously — becomes the "billing demand" for the month.

**Why utilities charge it:** Utility distribution infrastructure (transformers, cables, substations) must be sized for peak demand, not average demand. A building that normally uses 100 kW but occasionally peaks at 500 kW requires a 500 kW transformer to serve it. The demand charge allocates the cost of that infrastructure proportionately to the customers who create the need for it.

**Typical commercial demand charge:** $5–20/kW/month depending on utility and rate class. A building with a 500 kW peak demand at $12/kW pays $6,000/month in demand charges alone — often 30–50% of a commercial electricity bill.

**Why this matters for efficiency:** Reducing peak demand (through demand response, battery storage, or operational scheduling) has a disproportionate impact on commercial bills. Installing a $50,000 battery system that shaves 100 kW of peak demand at $15/kW/month saves $1,500/month = $18,000/year, with 33-month payback. This is the economic engine behind commercial energy storage deployment.

### 3.3 Time-of-Use Pricing

**Time-of-Use (TOU)** rate structures charge different prices for electricity depending on when it is consumed:

- **Peak period:** typically weekday afternoons (e.g., 4–9 PM in California PG&E E-TOU-C rate), when the grid is most stressed by simultaneous commercial and residential demand. Peak rate: $0.40–0.60/kWh in California TOU
- **Off-peak period:** overnight and weekends, when renewable generation is abundant and demand is low. Off-peak rate: $0.08–0.15/kWh
- **Super off-peak:** some California rates add a "super off-peak" period (typically 12–6 AM) to encourage EV charging overnight. Rates may drop to $0.04–0.08/kWh

**Flat bill with TOU:** A household that runs dishwasher, laundry, and EV charging overnight instead of during the evening saves 40–70% on those loads' energy costs without changing consumption. The behavior shift, not efficiency improvement, is the mechanism.

**Dynamic pricing:** A more advanced form of TOU where prices change in real-time (hourly or even 5-minute intervals) based on actual grid conditions. Hourly real-time pricing is available to residential customers in Illinois (ComEd, through the Hourly Pricing program) and some other markets. Research suggests that households on real-time pricing shift 10–15% of their load in response to price signals, providing meaningful grid flexibility benefits. [Allcott, 2011; ComEd Hourly Pricing Evaluation, 2023.]

### 3.4 Rate Structures: A Taxonomy

| Rate type | Who it applies to | Key feature |
|-----------|-------------------|-------------|
| Flat residential | Most residential customers | Fixed $/kWh regardless of time or consumption level |
| Tiered / inclining block | California, Pacific NW residential | Price increases with consumption level — incentivizes conservation |
| Time-of-use (TOU) | Opt-in residential, most commercial | Price varies by time of day |
| Real-time pricing (RTP) | Large commercial/industrial, opt-in residential | Price follows spot market, updated hourly |
| Demand + energy | Commercial and industrial | Separate charges for peak demand (kW) and total consumption (kWh) |
| Net metering | Distributed solar customers | Excess generation credited at retail rate; excess billed at retail rate |
| Net billing (NEM 3.0) | California residential solar post-2023 | Excess generation credited at lower wholesale-adjacent rate; one-way retail rate for consumption |

---

## 4. How to Read a Utility Rate Schedule

Utility rate schedules (also called tariffs) are the legal documents that define exactly how electricity is priced for each customer class. In the United States, they are publicly filed with state public utility commissions (PUCs) and available in every state's utility regulatory commission docket portal.

**Key components of a commercial rate schedule:**

**Applicability clause:** Defines which customers are eligible for this rate (e.g., "applicable to commercial accounts with metered demand greater than 20 kW and less than 500 kW in the utility's service territory"). Most customers are in exactly one applicable rate class; some have the option to choose between multiple.

**Rate table:** Lists all charges — per-kWh energy charge, per-kW demand charge, fixed monthly customer charge, any surcharges. Published to four decimal places. For TOU rates, shows separate values for each time period.

**Billing demand determination:** Exactly how the peak demand reading is computed. Some utilities use the highest 15-minute interval; others use the average of the 3 highest 15-minute intervals in a month; others use a ratchet (if the current month's demand is below 70% of the 12-month peak, you still pay based on 70% of that peak — a provision that can severely penalize demand response if you reduce demand in one month but it doesn't also reduce the historical peak basis).

**Power factor clause:** Many commercial rates include a power factor adjustment. Power factor measures the ratio of real power (watts, which does useful work) to apparent power (volt-amperes, which the utility must supply). If a building runs inductive loads (motors, older fluorescent ballasts) without power factor correction capacitors, the power factor may be 0.85–0.90, meaning the utility delivers 10–15% more current than the building "uses" — increasing their infrastructure costs. Low power factor triggers additional charges.

**How to find your utility's rate schedule:**
- California: California PUC (CPUC) Energy Division tariff database
- New York: New York DPS EDRP portal (www.dps.ny.gov)
- Federal utilities (TVA, WAPA, BPA): utility websites directly
- Most states: type "[utility name] tariff schedule" — PUC filings are public records

---

## 5. Understanding Grid Operations

### 5.1 ISO/RTO Market Structure

The US bulk electric power system is operated by Regional Transmission Organizations (RTOs) and Independent System Operators (ISOs), which are non-profit entities that coordinate grid operations and manage wholesale electricity markets across multi-state regions:

| ISO/RTO | Region | States/area |
|---------|--------|-------------|
| PJM Interconnection | Mid-Atlantic/Midwest | 13 states + DC; ~65 million people |
| MISO (Midcontinent ISO) | Central US | 15 states + Manitoba; ~45 million |
| SPP (Southwest Power Pool) | South-Central | 14 states; ~17 million |
| CAISO (California ISO) | California | California + parts of Nevada |
| ERCOT (Texas) | Texas | Most of Texas (standalone grid) |
| NYISO | New York | New York State |
| ISO-NE | New England | 6 New England states |
| WECC (non-CAISO West) | Western US | Includes Utah, Arizona, Colorado — no single RTO; utility coordination |

Regions without RTOs (most of the Southeast, parts of the Northwest) operate under vertically integrated utilities that both own generation assets and operate the distribution grid — a different model where wholesale market dynamics are less transparent.

**European equivalent:** ENTSO-E (European Network of Transmission System Operators for Electricity) coordinates the interconnected European grid across 39 member TSOs. Each country has its own TSO (Elia in Belgium, National Grid ESO in UK, RTE in France, Terna in Italy). European single electricity market (SEM) operates day-ahead and intraday markets analogous to US RTOs.

### 5.2 Wholesale Electricity Markets

Wholesale electricity is bought and sold through several market mechanisms that ultimately feed into the retail rates consumers pay:

**Day-ahead market:** Every afternoon, the ISO clears a forward market for next-day electricity delivery, dispatching least-cost generation resources to meet the forecasted demand for each hour of the following day. Generators submit offers (price, MW capacity); load-serving entities submit bids (forecast demand, maximum price). The market clears at the System Marginal Price (SMP) — the marginal cost of the most expensive generator needed to meet demand in each hour. All cleared generators receive the SMP (not their individual offer price) — this is the "locational marginal price" (LMP) system.

**Real-time market:** Every 5 minutes, the ISO adjusts dispatch in real time to balance actual load against day-ahead schedules. Real-time LMPs can spike dramatically when unexpected events occur (generator outages, unexpected demand surges). On a summer afternoon with limited transmission capacity and surging AC load, real-time prices in some ISO hubs have reached $2,000–10,000/MWh (versus typical day-ahead prices of $30–80/MWh) — a 50–300x premium.

**How retail rates relate to wholesale:** Retail rates are set by PUCs based on utilities' long-term cost of service — a blend of fuel costs, capacity costs, transmission costs, and administrative costs. They do not directly track wholesale spot prices. However, over 1–3-year regulatory cycles, wholesale price trends work through into retail rate cases. The 2021–2023 natural gas price spike is a clear example: retail electricity rates in New England and the Mid-Atlantic rose 30–50% over 2021–2023, reflecting the pass-through of higher gas-fired generation costs through regulatory filings.

### 5.3 Capacity Markets and Ancillary Services

**Capacity markets** are a mechanism to ensure sufficient generation capacity exists to meet peak demand, not just in the current year but in future years when new capacity investment is needed. RTOs like PJM run annual capacity auctions where generators offer to be available during peak periods 3 years in the future in exchange for capacity payments:

- Capacity prices are set by a downward-sloping demand curve (the variable resource requirement, VRR curve) that reflects the social value of reliability
- All resources clearing the capacity auction receive the clearing price ($/MW/day) times their offered capacity (MW) times 365 days
- Demand response resources and energy storage can participate as capacity resources, offering to reduce load or dispatch stored energy during peak events in exchange for capacity payments

**Ancillary services:** The grid requires moment-to-moment frequency regulation services (to keep generators synchronized at 60 Hz), spinning and non-spinning reserves (ready backup generation), and voltage support. These services are traded in separate markets:

- **Frequency regulation (RegA/D):** Fast-response assets (batteries, flywheels, demand response) that can inject or absorb small amounts of power within seconds. PJM pays approximately $30–60/MW/hour for regulation service — a significant revenue stream for battery storage operators
- **Spinning reserve:** Generation that is synchronized to the grid and can ramp from partial to full output within 10 minutes
- **Non-spinning (supplemental) reserve:** Generation that can reach full output within 30 minutes

Understanding these markets is increasingly important for building energy managers: demand response programs that enroll commercial buildings in DR capacity markets or ancillary service markets can generate $50,000–500,000/year for a large commercial building with flexible load.

### 5.4 How Retail Rates Are Set

In restructured states, retail electricity prices are set by PUC rate cases — formal regulatory proceedings in which the utility proposes a rate change, intervening parties (consumer advocates, large industrials, environmental groups) can challenge the proposal, and the PUC issues an order setting rates for the next regulatory period (typically 3–5 years). Rate cases are public proceedings with extensive technical testimony and discovery.

In competitive retail markets (Pennsylvania, Texas, Illinois, New York, and others), retail customers can choose their electricity supplier from a list of competitive retail energy providers (REPs). REPs offer various rate products: fixed-price contracts (price locked for 12–36 months), variable contracts (price tracks wholesale), green contracts (matched to renewable energy certificates).

---

## 6. Carbon Accounting Basics

### 6.1 Scope 1, 2, and 3 Emissions

The **GHG Protocol Corporate Accounting and Reporting Standard** (WRI/WBCSD, 2004, updated through 2015) defines the universal framework for organizational carbon accounting:

**Scope 1 — Direct emissions:** Emissions from sources owned or controlled by the organization. Examples: natural gas combusted in on-site boilers, fuel combusted in company-owned vehicles, refrigerant leaks from on-site equipment, industrial process emissions.

**Scope 2 — Purchased energy indirect emissions:** Emissions from the generation of electricity, heat, steam, or cooling purchased and consumed by the organization but generated off-site. Scope 2 is where utility electricity choice matters for carbon accounting: switching from coal-heavy grid electricity to renewable energy reduces Scope 2 emissions.

**Scope 3 — Other indirect emissions:** All other value chain emissions — both upstream (from goods and services purchased, capital goods, business travel, employee commuting) and downstream (product use, end-of-life). Scope 3 typically accounts for 70–90% of a company's total carbon footprint but is the most difficult to measure and the subject of the most accounting disagreements.

**Relevance to GPE:** The GPE rankings use electricity intensity (kWh/GDP), which is a Scope 2 proxy for the electricity dimension of national carbon performance. A complete national carbon account adds Scope 1 (all direct fossil fuel combustion, industry, agriculture) and the upstream Scope 3 (emissions embedded in imported goods). Countries that have "decarbonized" by offshoring heavy industry have shifted Scope 1/2 emissions to Scope 3 — a form of carbon accounting arbitrage that inflates their GPE position relative to their true carbon footprint.

### 6.2 Market-Based vs. Location-Based Accounting

Scope 2 emissions can be calculated in two ways under the GHG Protocol, and the choice matters significantly for renewable energy claims:

**Location-based method:** Uses the average carbon intensity of the regional electricity grid (the average CO₂ per kWh for all generation in the balancing authority or country). This reflects what was actually generated to serve load in the region. For a building in PJM (2024 average intensity: approximately 375 gCO₂/kWh), location-based Scope 2 = annual kWh × 375 gCO₂/kWh.

**Market-based method:** Uses contractual instruments — Renewable Energy Certificates (RECs), Power Purchase Agreements (PPAs), green tariffs — to attribute zero carbon to the portion of consumption backed by renewable energy certificates. A company that purchases RECs matching 100% of its electricity consumption reports zero market-based Scope 2, regardless of what was actually generated at the moment the electricity was used.

**The controversy:** Critics argue that market-based accounting with unbundled RECs (RECs purchased separately from the electricity itself, often from geographically distant renewable projects) does not represent a causal link between the buyer's consumption and renewable generation. A company buying 2020-vintage RECs from a North Dakota wind farm to cover its 2024 Texas electricity consumption has not changed what was generated at any moment to serve its load. The Science Based Targets initiative (SBTi) and GreenHouse Gas Protocol are converging toward requiring "24/7 CFE" (carbon-free energy matched on an hourly, location-matched basis) for the highest-integrity corporate clean electricity claims. [Google 24/7 CFE methodology; SBTi Corporate Net-Zero Standard, 2024.]

### 6.3 Carbon Offsets vs. Carbon Insets

**Carbon offsets:** Credits representing emission reductions or removals that occurred outside the buyer's value chain. A company buys a verified offset representing 1 tonne of CO₂ sequestered by forest preservation in the Amazon; it retires that offset and deducts 1 tonne from its gross emissions to arrive at its net emissions claim.

**Criticism of offsets:**
- **Additionality:** Would the sequestration or emission reduction have happened anyway without the offset payment?
- **Permanence:** Forest carbon can be released by wildfire, pest outbreak, or future land-use change
- **Leakage:** Protecting one forest can shift deforestation pressure to another area
- Major registries (Verra VCS, Gold Standard) have been criticized for overstating additionality [Grantham Research Institute analysis, 2023]

**Carbon insets:** A newer concept — reducing emissions within the company's own supply chain (e.g., switching a contract farmer from synthetic fertilizer to regenerative practices) rather than purchasing external offsets. Insets are considered higher integrity because they address emissions that appear in the company's own Scope 3 inventory rather than purchasing external reductions.

---

## 7. Energy Data Sources for Research

| Source | URL | Coverage | Key data |
|--------|-----|----------|----------|
| IEA (International Energy Agency) | iea.org | 150+ countries, 1971– | Electricity balances, primary energy, efficiency, CO₂ |
| IEA Electricity 2025 | iea.org/reports/electricity-2025 | Global, 2024 data | Annual electricity review with country detail |
| Ember Global Electricity Review | ember-energy.org | 88+ countries, 2000– | Annual TWh, generation mix, clean share; free download |
| EIA International | eia.gov/international | 217 countries | US-government energy statistics; free bulk download |
| IRENA (Renewable Energy Agency) | irena.org | 200+ countries | Renewable capacity, generation, costs |
| World Bank SE4All / SDG7 | trackingsdg7.esmap.org | 180+ countries | Access, clean cooking, efficiency, renewables |
| Our World in Data (Energy) | ourworldindata.org/energy | 200+ countries, 1800– | Chart + download tool over Ember/BP data |
| Energy Institute Statistical Review | energyinst.org/statistical-review | Global, 1965– | Formerly BP Statistical Review; primary energy, oil/gas/coal |
| OpenEI | openei.org | US focus | Rate tariffs, building data, utility service territories |
| US EIA Electric Power Monthly | eia.gov/electricity/monthly | US, state level | US retail rates, generation, fuel mix; monthly updates |
| ENTSO-E Transparency Platform | transparency.entsoe.eu | Europe | Hourly generation/load/price data for European TSOs; free API |
| EPEX Spot | epexspot.com | European day-ahead prices | Hour-by-hour European wholesale electricity prices |
| NOAA Climate Data Online | ncdc.noaa.gov/cdo-web | Global | Weather station data; heating/cooling degree days |
| IMF World Economic Outlook | imf.org/weo | 195 countries | GDP per capita (PPP), growth projections; April and October releases |
| Eurostat | ec.europa.eu/eurostat | EU-27 + | Energy prices, consumption by sector, energy poverty |

**For GPE specifically:**
- **Electricity TWh by country:** Ember Global Electricity Review (primary), IEA Electricity (verification)
- **GDP per capita (PPP):** IMF WEO database (primary), World Bank WDI (verification)
- **Carbon intensity of electricity:** Ember Carbon Intensity Explorer (primary)
- **Grid reliability (SAIDI):** World Bank ESMAP, utilities' own reports
- **Electrification rates:** IEA/World Bank SDG7 Tracking

---

## 8. How the GPE Ranking Metric Works

The Global Power Efficiency rankings use a single primary metric:

$$EI = \frac{E_{TWh}}{GDP_{cap} \times N_{pop}} \times 10^6$$

where:
- $E_{TWh}$ = annual electricity consumption in terawatt-hours
- $GDP_{cap}$ = GDP per capita in USD (IMF WEO, PPP-adjusted, purchasing power parity)
- $N_{pop}$ = population (in persons)
- $GDP_{cap} \times N_{pop}$ = total GDP in USD
- Multiplying by $10^6$ converts from kWh/USD to kWh/$1,000

**Why this metric:**
- **Normalizes for economic output:** A country that uses more electricity because it produces more goods and services should not be penalized for its productivity. Dividing by GDP removes the economic size effect.
- **PPP adjustment:** GDP per capita in PPP terms adjusts for the fact that a dollar buys different amounts of goods and services in different countries. Using market exchange rate GDP would penalize low-income countries whose currencies are undervalued.
- **Measures what matters:** Lower $EI$ means the economy extracts more economic value per unit of electricity consumed — either because it uses electricity efficiently or because its economy is structured toward less energy-intensive sectors.

**What the metric does not capture:**
- Carbon intensity of electricity generation (a country can have low $EI$ but generate that electricity entirely from coal — the GPE rankings do not penalize this)
- Primary energy efficiency (the GPE metric is only for electricity, not total energy including transport fuels, industrial heat, etc.)
- Distribution of efficiency gains (some countries have low average $EI$ because their industry is efficient, even if residential efficiency is poor)
- Time of consumption (load shape, peak demand — equally electricity-efficient countries may have very different implications for grid infrastructure requirements)

**Computing your own GPE score:**
1. Find your country's annual electricity consumption (TWh): Ember GER or IEA
2. Find your country's GDP per capita (USD PPP): IMF WEO database
3. Find your country's population: World Bank WDI
4. Apply the formula above

To check against the published rankings: Ireland's 2024 data (approximately 35 TWh, $129,000 GDP/cap PPP, 5.3 million population) yields approximately 0.51 kWh/$1,000, consistent with the top-ranked position.

---

## 9. How to Read an Energy Audit Report

An energy audit is a systematic assessment of a building's energy performance. ASHRAE defines three levels:

**Level 1 — Walk-through assessment:** A visual inspection identifying low-cost/no-cost opportunities (setpoint adjustments, lighting upgrades, operational improvements). Output: a brief list of recommendations with rough payback estimates. Cost: $0–2,000.

**Level 2 — Energy survey and analysis:** Utility bill analysis + detailed engineering calculations + itemized recommendations with energy, cost, and payback estimates. ASHRAE 211 standard. This is the minimum required for BPS compliance audits under LL97 and most state programs. Output: 20–100-page report. Cost: $5,000–50,000 depending on building size.

**Level 3 — Detailed analysis of capital-intensive modifications:** Full engineering analysis of major retrofits (HVAC replacement, envelope upgrades) with simulation modeling (EnergyPlus or eQUEST). Output: investment-grade analysis suitable for financing applications. Cost: $15,000–150,000.

**Key sections of a Level 2 audit report:**

**Existing conditions summary:** Building description (vintage, size, construction type), current utility bills (12-month baseline), current EUI (Energy Use Intensity: kBtu/sq ft/year), current carbon footprint, benchmarking comparison (ENERGY STAR percentile).

**Energy conservation measures (ECMs):** The core of the report. Each ECM is described with:
- Technical description (what is being changed)
- Current annual energy use for this end use (kWh or therms)
- Projected savings (kWh/year, therms/year)
- Implementation cost (total installed cost)
- Annual dollar savings (at current utility rates)
- Simple payback (implementation cost / annual savings)
- Net present value (NPV at a discount rate, typically 3–7%)
- CO₂ reduction (tonnes/year)

**Prioritized ECM list:** ECMs are typically ranked by simple payback (fastest payback first) or NPV. Typical payback hierarchy: operational improvements (0–2 years), lighting upgrades (2–5 years), HVAC controls (3–7 years), HVAC equipment replacement (7–15 years), envelope improvements (10–25 years).

**Implementation pathway:** Most audits include a phased implementation plan — which ECMs to pursue in years 1–2 (low-hanging fruit), years 3–5 (moderate capital), and years 5–10+ (major capital). The phasing reflects both cash flow constraints and the interaction between measures (envelope improvements reduce the HVAC system sizing needed, so it's often better to improve the envelope before sizing the replacement HVAC).

---

## 10. DIY Project: Pull Your Utility Data via Green Button and Analyze in Python

**Difficulty:** Beginner | **Cost:** $0 | **Time:** 3–5 hours

Green Button is a US Department of Energy initiative that requires utilities to provide customers with their own electricity usage data in a standardized XML format. Most major US utilities support Green Button either as a direct download ("Green Button Download My Data") or as an API ("Green Button Connect My Data").

```python
import xml.etree.ElementTree as ET
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from pathlib import Path
from datetime import datetime, timezone

# --- Step 1: Parse Green Button XML ---

def parse_green_button_xml(xml_path: str) -> pd.DataFrame:
    """
    Parse a Green Button XML file into a DataFrame of 15-minute or hourly intervals.
    Green Button uses ESPI (Energy Service Provider Interface) schema.
    Typical structure: IntervalBlock > IntervalReading > timePeriod + value
    """
    tree = ET.parse(xml_path)
    root = tree.getroot()

    # ESPI namespace (common in Green Button exports)
    ns = {
        'atom': 'http://www.w3.org/2005/Atom',
        'espi': 'http://naesb.org/espi'
    }

    readings = []
    for entry in root.findall('atom:entry', ns):
        content = entry.find('atom:content', ns)
        if content is None:
            continue
        interval_block = content.find('espi:IntervalBlock', ns)
        if interval_block is None:
            continue
        for reading in interval_block.findall('espi:IntervalReading', ns):
            period = reading.find('espi:timePeriod', ns)
            value_elem = reading.find('espi:value', ns)
            if period is not None and value_elem is not None:
                start = int(period.find('espi:start', ns).text)
                duration = int(period.find('espi:duration', ns).text)
                value = float(value_elem.text)
                readings.append({
                    'timestamp': datetime.fromtimestamp(start, tz=timezone.utc),
                    'duration_seconds': duration,
                    'value_wh': value  # Green Button values are in Wh
                })

    df = pd.DataFrame(readings)
    df['kwh'] = df['value_wh'] / 1000
    df['timestamp'] = pd.to_datetime(df['timestamp']).dt.tz_localize(None)
    df = df.sort_values('timestamp').reset_index(drop=True)
    return df


def compute_energy_stats(df: pd.DataFrame, annual_income: float = 75000) -> dict:
    """
    Compute key energy statistics from Green Button interval data.
    annual_income: household income for energy burden calculation (optional)
    """
    # Annual totals (use most recent 12 months if more data available)
    if len(df) > 8760:  # More than 1 year of hourly data
        df = df.tail(8760)

    annual_kwh = df['kwh'].sum()

    # Assume average US retail rate; replace with your actual rate
    kwh_rate = 0.165  # $/kWh — US average Q1 2026
    annual_cost = annual_kwh * kwh_rate

    energy_burden_pct = (annual_cost / annual_income) * 100 if annual_income > 0 else None

    # Load factor: ratio of average demand to peak demand (higher = flatter = more efficient to serve)
    avg_kw = df['kwh'].mean()  # Average kW (since each interval = 1 hour for hourly data)
    peak_kw = df['kwh'].max()
    load_factor = avg_kw / peak_kw if peak_kw > 0 else 0

    # Peak demand hours (identify which hours have highest consumption)
    df_copy = df.copy()
    df_copy['hour'] = df_copy['timestamp'].dt.hour
    hourly_avg = df_copy.groupby('hour')['kwh'].mean()
    peak_hour = hourly_avg.idxmax()

    # GPE-equivalent intensity: kWh per $1,000 of income
    gpe_household_intensity = (annual_kwh / (annual_income / 1000))

    return {
        'annual_kwh': annual_kwh,
        'annual_cost_usd': annual_cost,
        'energy_burden_pct': energy_burden_pct,
        'avg_load_kw': avg_kw,
        'peak_load_kw': peak_kw,
        'load_factor': load_factor,
        'peak_hour_of_day': peak_hour,
        'gpe_household_intensity': gpe_household_intensity,
    }


def compare_to_gpe_countries(household_intensity: float) -> str:
    """
    Compare household electricity intensity to GPE country averages.
    Countries are expressed as kWh per $1,000 GDP per capita — your household
    equivalent uses kWh per $1,000 income.
    """
    gpe_benchmarks = {
        'Ireland (Rank 1)': 0.51,
        'Denmark (Rank 7)': 0.89,
        'Germany (Rank 10)': 1.10,
        'Japan (Rank ~25)': 1.53,
        'US Average (~Rank 45)': 2.81,
        'China (Rank 66)': 4.58,
    }
    lines = [f"\nYour household intensity: {household_intensity:.2f} kWh/$1,000 income"]
    lines.append("GPE country benchmarks (kWh/$1,000 GDP per capita):")
    for country, intensity in sorted(gpe_benchmarks.items(), key=lambda x: x[1]):
        comparison = "higher" if household_intensity > intensity else "lower"
        lines.append(f"  {country}: {intensity:.2f} "
                     f"(your household is {abs(household_intensity-intensity):.2f} {comparison})")
    return "\n".join(lines)


def plot_usage_patterns(df: pd.DataFrame):
    """Plot load profile: daily average, weekday vs weekend, monthly totals."""
    df_plot = df.copy()
    df_plot['hour'] = df_plot['timestamp'].dt.hour
    df_plot['month'] = df_plot['timestamp'].dt.month
    df_plot['dayofweek'] = df_plot['timestamp'].dt.dayofweek
    df_plot['is_weekend'] = df_plot['dayofweek'] >= 5

    fig, axes = plt.subplots(1, 3, figsize=(15, 4))

    # Average load by hour of day (weekday vs weekend)
    weekday = df_plot[~df_plot['is_weekend']].groupby('hour')['kwh'].mean()
    weekend = df_plot[df_plot['is_weekend']].groupby('hour')['kwh'].mean()
    axes[0].plot(weekday.index, weekday.values, 'b-o', markersize=4, label='Weekday')
    axes[0].plot(weekend.index, weekend.values, 'r-o', markersize=4, label='Weekend')
    axes[0].set_xlabel('Hour of Day')
    axes[0].set_ylabel('Average kWh')
    axes[0].set_title('Average Load Profile')
    axes[0].legend()
    axes[0].set_xticks(range(0, 24, 3))

    # Monthly consumption
    monthly = df_plot.groupby('month')['kwh'].sum()
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    colors = ['steelblue' if v < monthly.mean() * 1.2 else 'coral'
              for v in monthly.values]
    axes[1].bar([month_names[m-1] for m in monthly.index], monthly.values, color=colors)
    axes[1].set_xlabel('Month')
    axes[1].set_ylabel('kWh')
    axes[1].set_title('Monthly Consumption')
    axes[1].tick_params(axis='x', rotation=45)

    # Time series (daily totals)
    daily = df_plot.resample('D', on='timestamp')['kwh'].sum().reset_index()
    axes[2].plot(daily['timestamp'], daily['kwh'], alpha=0.6, color='steelblue', linewidth=0.8)
    rolling = daily['kwh'].rolling(30, center=True).mean()
    axes[2].plot(daily['timestamp'], rolling, 'r-', linewidth=2, label='30-day avg')
    axes[2].set_xlabel('Date')
    axes[2].set_ylabel('Daily kWh')
    axes[2].set_title('Daily Consumption Over Time')
    axes[2].xaxis.set_major_formatter(mdates.DateFormatter('%b %Y'))
    axes[2].legend()

    plt.tight_layout()
    plt.savefig('household_energy_analysis.png', dpi=150)
    print("Saved: household_energy_analysis.png")


# --- Usage ---
# 1. Log in to your utility's website (e.g., Puget Sound Energy, PG&E, Con Edison)
# 2. Navigate to "My Account" > "Energy Usage" > "Download My Data" / "Green Button"
# 3. Download the XML file
# 4. Run:
#
# df = parse_green_button_xml('path/to/your_usage.xml')
# stats = compute_energy_stats(df, annual_income=85000)
# print(f"Annual kWh: {stats['annual_kwh']:.0f}")
# print(f"Energy burden: {stats['energy_burden_pct']:.1f}%")
# print(f"Peak demand: {stats['peak_load_kw']:.1f} kW")
# print(compare_to_gpe_countries(stats['gpe_household_intensity']))
# plot_usage_patterns(df)
```

**What you'll learn from your own data:**
- Your household's energy burden (compare to the 6%/10% thresholds from `building-equity-decarbonization.md`)
- Whether you have a morning or evening peak (determines best window for laundry, dishwasher, EV charging on TOU rates)
- Your summer vs. winter consumption split (reveals whether heating or cooling dominates)
- Your GPE-equivalent household intensity and how it compares to national averages and peer countries

---

## 11. College of Knowledge Integration

This module is the **entry-point module for the energy learning arc** in the GPE series. The College of Knowledge framework maps learning into departments with interconnected curricula. The energy learning arc within the College spans multiple departments:

**Rosetta Core (ECO — Ecology):** Energy as ecosystem service; energy flows in natural systems; photosynthesis as the original solar energy conversion; thermodynamic constraints on all living systems. The Rosetta Panel maps energy literacy across four languages: the mathematical (thermodynamics, power systems), the observational (meter readings, satellite data), the experiential (energy burden, heat stress), and the systemic (grid operations, policy frameworks).

**Mathematics department:** Energy unit conversions are an application of dimensional analysis (a Rosetta Core skill). The GPE ranking formula is applied linear algebra. The complex plane framework (from `ai-learning-pathways.md`) is advanced complex analysis applied to real-world systems.

**Physics/Science department:** Thermodynamics (heat engines, COP of heat pumps, refrigeration cycles) underpins Modules 6 (thermal networks), 7 (cooling), and the GRD geothermal project. Electromagnetism underpins power systems (AC circuits, power factor, transmission line physics).

**Economics/Social Science department:** Utility rate design, capacity markets, carbon pricing, energy burden — all are applied economics. The split incentive problem (Module 7 of `building-equity-decarbonization.md`) is a classic principal-agent problem from microeconomics. Energy poverty is a welfare economics problem.

**Computer Science/Data Science department:** This module's DIY project (Green Button data analysis), plus the Python projects across Modules 6–10, are data science applications. The energy data sources table is an applied data engineering curriculum.

**Sequence recommendation:**
1. This module (`energy-data-literacy.md`) — literacy foundation
2. `ai-learning-pathways.md` — complex plane framework + AI tools
3. `thermal-networks-district-energy.md` — thermal systems in depth
4. `building-equity-decarbonization.md` — policy and equity layer
5. `climate-adaptation-cooling.md` — demand-side challenge
6. `verification-matrix.md` — data quality and primary sources

---

## 12. Cross-Links and Sources

**Cross-links:**
- **All GPE content:** This is the literacy prerequisite for all other GPE modules
- **ai-learning-pathways.md:** Complex plane framework, AI tools, DIY projects — this module is the foundation layer that module builds on
- **source-verification-2026.md:** Primary source quality assessment for the data behind the GPE rankings

**Primary sources:**

- IEA. *Electricity 2025*. International Energy Agency, 2025. https://www.iea.org/reports/electricity-2025
- U.S. EIA. *Electric Power Monthly*. Energy Information Administration, March 2026. https://www.eia.gov/electricity/monthly/
- U.S. EIA. *Residential Energy Consumption Survey (RECS) 2020*. EIA, 2020. https://www.eia.gov/consumption/residential/
- World Resources Institute / WBCSD. *GHG Protocol Corporate Accounting and Reporting Standard*. 2004, updated 2015. https://ghgprotocol.org/corporate-standard
- ASHRAE. *Standard 211-2022: Commercial Building Energy Audits*. ASHRAE, 2022.
- ASHRAE. *Standard 90.1-2022: Energy Standard for Sites and Buildings Except Low-Rise Residential Buildings*. ASHRAE, 2022.
- U.S. Department of Energy. *Green Button Initiative*. https://www.energy.gov/data/green-button
- Ember. *Global Electricity Review 2025*. Ember Energy, April 8, 2025. https://ember-energy.org/latest-insights/global-electricity-review-2025/
- IMF. *World Economic Outlook Database*. International Monetary Fund, April 2026. https://www.imf.org/weo
- PJM. *State of the Market Report 2024*. Monitoring Analytics, 2024.
- ComEd. *Hourly Pricing Program Evaluation 2023*. Commonwealth Edison, 2023.
- Allcott, H. "Rethinking real-time electricity pricing." *Resource and Energy Economics* 33, no. 4 (2011): 820–842.
- OpenEI. *Utility Rate Database*. Open Energy Information. https://openei.org/wiki/Utility_Rate_Database
- SBTi. *Corporate Net-Zero Standard*. Science Based Targets initiative, 2024. https://sciencebasedtargets.org/net-zero

---

*This module is the foundational literacy layer for the GPE Research Supplement series. Readers new to energy data should start here before proceeding to any other module. The DIY project in Section 10 provides a practical bridge from national-scale statistics to household-level data exploration.*
