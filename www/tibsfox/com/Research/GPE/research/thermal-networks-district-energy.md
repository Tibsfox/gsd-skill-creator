# Thermal Energy Networks & District Energy Systems

> **Domain:** Global Power Efficiency / Energy Systems
> **Module:** Research Supplement — District Heating, Waste Heat Recovery, Thermal Storage, Network AI
> **Through-line:** *Heat is the most wasted form of energy on Earth. Industrial processes, data centers, power plants, and even human bodies shed thermal energy as an afterthought. District energy systems are the infrastructure that turns that waste into a commons — a shared thermal fabric that can make entire cities efficient in ways no individual building ever could alone.*

---

## Table of Contents

1. [What District Energy Is and Why It Matters](#1-what-district-energy-is-and-why-it-matters)
2. [The Four Generations of District Heating](#2-the-four-generations-of-district-heating)
   - 2.1 [Generation 1–3: Steam to Hot Water](#21-generation-13-steam-to-hot-water)
   - 2.2 [4th Generation: Low-Temperature, Bidirectional](#22-4th-generation-low-temperature-bidirectional)
   - 2.3 [5th Generation: Ambient Loop Systems](#23-5th-generation-ambient-loop-systems)
3. [Case Studies: District Heating at Scale](#3-case-studies-district-heating-at-scale)
   - 3.1 [Copenhagen HOFOR: 98% District Heating Penetration](#31-copenhagen-hofor-98-district-heating-penetration)
   - 3.2 [Helsinki Helen: Fossil-Free by 2030](#32-helsinki-helen-fossil-free-by-2030)
   - 3.3 [Seoul's District Heating Expansion](#33-seouls-district-heating-expansion)
4. [Waste Heat Recovery: Industrial and Digital Sources](#4-waste-heat-recovery-industrial-and-digital-sources)
   - 4.1 [Data Centers as Urban Heat Sources](#41-data-centers-as-urban-heat-sources)
   - 4.2 [Google Finland: The Hamina Data Center](#42-google-finland-the-hamina-data-center)
   - 4.3 [Stockholm Exergi and the Kista Connection](#43-stockholm-exergi-and-the-kista-connection)
   - 4.4 [Industrial Waste Heat Cascading](#44-industrial-waste-heat-cascading)
5. [Thermal Energy Storage: Shifting Heat in Time](#5-thermal-energy-storage-shifting-heat-in-time)
   - 5.1 [Borehole Thermal Energy Storage (BTES)](#51-borehole-thermal-energy-storage-btes)
   - 5.2 [Aquifer Thermal Energy Storage (ATES)](#52-aquifer-thermal-energy-storage-ates)
   - 5.3 [Phase-Change Materials (PCM)](#53-phase-change-materials-pcm)
   - 5.4 [Drake Landing Solar Community](#54-drake-landing-solar-community-canada)
6. [AI and Machine Learning for Thermal Network Optimization](#6-ai-and-machine-learning-for-thermal-network-optimization)
7. [Connection to Geothermal: Heat Pump Cascades](#7-connection-to-geothermal-heat-pump-cascades)
8. [DIY Project: Modeling a District Heating Network in Python](#8-diy-project-modeling-a-district-heating-network-in-python)
9. [The Complex Plane of Thermal Systems](#9-the-complex-plane-of-thermal-systems)
10. [Cross-Links and Sources](#10-cross-links-and-sources)

---

## 1. What District Energy Is and Why It Matters

District energy is the centralized production and distribution of thermal energy — heat or coolth — through insulated underground pipe networks to multiple buildings in a defined service area. Rather than each building operating its own boiler or chiller, district energy allows a single plant (or network of plants) to serve many loads simultaneously, capturing economies of scale and enabling fuel and waste-heat sources that are impractical at the building level.

The global significance is not symbolic. Space and water heating together account for approximately **40–50% of global final energy consumption** — more than all transport, more than all electricity end uses combined [IEA Heating 2024]. Electrification of direct combustion in heating (replacing gas boilers with heat pumps) is essential to decarbonization, but the efficiency multiplier from sharing thermal infrastructure at the district or urban scale is the mechanism that makes that transition economically viable across the full income spectrum.

In countries where district heating is mature — Denmark, Finland, Sweden, Estonia, Latvia, Iceland — the district heating share of residential heating ranges from 50% to 98%. In those countries, energy poverty rates for heating are dramatically lower than in countries (the UK, Ireland) where individual gas boilers dominate. The physics of shared thermal networks make them inherently more efficient; the social structure of collective ownership makes them more equitable.

The International Energy Agency's *Heating* report (2024) identifies district heating as one of the three critical pillars of decarbonized heating alongside heat pumps and building envelope improvement. The IEA estimates that the global district heating share must roughly double — from ~10% of heat demand to ~20% — by 2030 to remain on a Net Zero Emissions path [IEA NZE Scenario, 2023].

---

## 2. The Four Generations of District Heating

### 2.1 Generation 1–3: Steam to Hot Water

The technology has evolved through three distinct generations before arriving at the transformative fourth:

**1st Generation (pre-1930s):** Steam distribution at 200°C+. Massive distribution losses due to high temperature differentials, high pipe failure rates, expensive infrastructure. Examples: Manhattan's Con Edison steam system (1882 — the oldest surviving district steam network in North America) and several Scandinavian city centers.

**2nd Generation (1930s–1970s):** Pressurized hot water at 100–150°C. Safer than steam, lower distribution losses. Primarily coal-fired central plants. Copenhagen's original HOFOR network is 2nd generation infrastructure at its core.

**3rd Generation (1970s–2000s):** Pre-insulated pipes, hot water distribution at 70–90°C supply / 40–60°C return. The dominant technology worldwide today. Can incorporate combined heat and power (CHP) from natural gas, biomass, or waste-to-energy. Allows district cooling as a complementary offering. Efficiency improvements reduced distribution losses to 10–15% of heat delivered.

The problem with 3rd generation systems is that supply temperatures are too high to efficiently accept low-grade waste heat (from data centers, industrial cooling loops, sewage heat) and too high to run efficiently with heat pumps, which become less efficient as the temperature lift increases.

### 2.2 4th Generation: Low-Temperature, Bidirectional

4th Generation District Heating (4GDH), formalized in academic literature by Lund et al. [2014, *Energy*], proposes a fundamental redesign:

- **Supply temperature:** 50–70°C (down from 70–90°C)
- **Return temperature:** 20–40°C (down from 40–60°C)
- **Bidirectional flow:** prosumers — buildings with solar thermal collectors, heat pumps, or other thermal sources — can inject heat into the network as well as extract it
- **Low-grade source integration:** at 50°C, data center cooling water (typically 35–45°C outlet) can be directly integrated with a heat pump boost; solar thermal flat-plate collectors can run efficiently
- **Heat pump compatibility:** COP of heat pumps serving 4GDH networks is significantly higher than for 3GDH, because the temperature lift (from ambient to supply temperature) is smaller

The prosumer model is the radical departure. In a 4GDH network, a supermarket's refrigeration waste heat (typically 25–40°C), an office building's heat pump exhaust, or a solar thermal rooftop system can all become grid-interactive thermal assets. The network becomes a thermal commons — a shared resource that aggregates many small sources and many variable loads into a stable, efficient whole.

**Example:** The Lund University Energy Services (LUCAS) research site in Sweden operates a 4GDH pilot at 55°C supply / 25°C return. Measured distribution losses: 6–8% (versus 10–15% for 3GDH). COP of network-integrated heat pumps: 3.8–4.2 (versus 2.8–3.2 for 3GDH at the same source conditions) [Lund et al., 2021, *Applied Energy*].

### 2.3 5th Generation: Ambient Loop Systems

5th Generation District Heating and Cooling (5GDHC), also called ambient loop or balanced energy networks, is the emerging frontier:

- **Distribution temperature:** ambient ground temperature (10–20°C) — essentially no higher than the surrounding soil
- **Building-level heat pumps:** each building has its own heat pump that extracts heat from (or rejects heat to) the shared ambient loop
- **Bidirectional and simultaneous:** buildings heating extract from the loop; buildings cooling reject to the loop. In mixed-use urban areas (offices cooling during the day, residences heating in the evening), these flows naturally balance, dramatically reducing the need for central plant input
- **Near-zero distribution losses:** at ambient temperature, pipe-to-soil heat transfer is negligible
- **Can be operated as a peer-to-peer thermal market:** buildings that contribute more heat than they consume in summer can offset their winter heating costs

**Example:** The Islington Council project in London (Ring Road Ambient Loop, 2022) connects a mixed residential/commercial development of 300 units via a 5GDHC network. Measured heating energy savings: 40% versus individual gas boilers; cooling energy savings: 55% versus split-system air conditioning. Carbon reduction: 68% versus the building-level baseline [BEIS UK Report, 2023].

The challenge of 5GDHC: each building must invest in its own heat pump, which requires upfront capital and ongoing maintenance responsibility. The 4GDH model centralizes the heat pump at the network level, which is often more economically accessible for retrofitting existing buildings.

---

## 3. Case Studies: District Heating at Scale

### 3.1 Copenhagen HOFOR: 98% District Heating Penetration

Copenhagen's district heating network is the most cited exemplar of district energy at urban scale. Operated by HOFOR (Hovedstadens Forsyningsselskab — Copenhagen's city utility), the network serves approximately 99% of the city's buildings with a combined heat and power backbone and multiple renewable energy integrations.

**Key metrics (2024):**
- Service area: 62 municipalities across Greater Copenhagen, ~700,000 customers
- Annual heat delivery: ~30,000 GWh/year
- Network length: ~1,600 km of pipes
- Renewable share: approximately 65% of heat delivered (biomass, waste-to-energy, geothermal, solar thermal, excess wind)
- Distribution losses: ~15% (3GDH vintage infrastructure; 4GDH pilot zones achieving 8%)
- Average household heating cost: approximately DKK 6,000–8,000/year (~$850–1,150 USD) for a 120 m² apartment — among the lowest in Northern Europe
- Carbon intensity of heat delivered: approximately 45 gCO₂/kWh (down from 210 gCO₂/kWh in 2005)

**The wind coupling:** Denmark generates 88% of its electricity from wind and solar (2024). When the grid is oversupplied (negative spot prices, common on windy nights), HOFOR's large electric boilers and heat pumps convert surplus electricity to heat stored in large water tanks. This smooths the renewable electricity grid while providing cheap heat. The storage tanks — some the size of a 10-story building — act as giant thermal batteries, absorbing gigawatt-hours of excess renewable electricity. [HOFOR Annual Report 2024; Danish Energy Agency, 2024.]

**The transition timeline:** HOFOR has committed to carbon neutrality in heat supply by 2025 (using carbon accounting that includes biomass neutrality) and full fossil elimination by 2035 using a combination of heat pumps drawing on seawater, geothermal wells, and continued wind/solar integration. [HOFOR Climate Plan 2030.]

### 3.2 Helsinki Helen: Fossil-Free by 2030

Helen Ltd., Helsinki's city-owned energy company, operates Finland's largest district heating network with approximately 93% penetration across Helsinki (compared to the national average of ~50% for Finnish cities). The network delivers approximately 6,400 GWh/year of heat.

**The Salmisaari Transition:** Helen's primary challenge is Salmisaari — a large coal-fired CHP plant that supplied approximately 40% of Helsinki's district heating. Helen announced in 2020 that Salmisaari would close by 2024, requiring replacement of approximately 2,500 GWh/year of heat capacity. The replacement strategy:
- Large-scale seawater heat pumps (largest: 60 MW thermal, Katri Vala underground heat pump plant — the world's largest at time of installation, drawing heat from treated wastewater)
- Rock cavern heat storage (Mustikkamaa, 260,000 m³ volume, stores 90 GWh of heat)
- Seasonal thermal storage in the Gulf of Finland (pilot)
- Biomass district heating from Vuosaari industrial park
- Demand response and industrial waste heat purchasing agreements

**Data center waste heat:** Helen has formal waste heat purchase agreements with multiple Helsinki data center operators. When a data center's cooling water exits at 35–45°C, Helen's network (after a heat pump boost to 60–70°C) can absorb this as district heat. As of 2024, approximately 6% of Helen's annual heat delivery comes from data center waste heat — approximately 384 GWh/year, displacing roughly 80,000 tonnes of CO₂ versus natural gas. [Helen Annual Report 2024; IEA Finland Energy Policy Review 2023.]

### 3.3 Seoul's District Heating Expansion

Korea District Heating Corporation (KDHC) operates one of the world's largest district heating networks by service connections, serving approximately 2.6 million households across Seoul, Incheon, and 11 other Korean cities.

**Key metrics:**
- Total connections: ~2.6 million households + commercial (2023)
- Annual heat delivery: ~43,000 GWh/year
- Penetration in served areas: approximately 65% of multi-family housing stock
- Primary source: CHP from natural gas (approximately 70%), waste-to-energy (15%), industrial waste heat (10%), renewables (5%)
- Distribution losses: 8–12% (modern pre-insulated pipes, well-maintained)

**The Korean 5GDH push:** KDHC is piloting ambient loop district heating systems (5GDHC) in new development zones, particularly the Sejong smart city development. The pilot connects 4,200 residential units via a 10°C ambient loop with building-level heat pumps. Early monitoring (2023) shows 38% reduction in heating energy versus conventional 3GDH for the same zone. [KDHC Technology Report, 2023.]

**Climate variability challenge:** Seoul's heating demand is highly seasonal (cold continental winters, hot humid summers), making thermal storage critical. KDHC operates the Hwaseong underground thermal energy storage facility — a 300,000 m³ BTES field storing summer-collected solar thermal energy for winter heating. [KDHC Hwaseong BTES Report, 2022.]

---

## 4. Waste Heat Recovery: Industrial and Digital Sources

### 4.1 Data Centers as Urban Heat Sources

The global data center fleet consumed approximately 415 TWh of electricity in 2024 [IEA Energy and AI 2025]. Roughly 90–95% of that electricity is converted to heat inside the facility — servers, networking gear, and power conversion equipment produce heat as a byproduct of computation. That is approximately 370–395 TWh of thermal energy, representing a heat source equivalent to approximately 2% of global heat demand.

The physics of heat recovery from data centers:
- Air-cooled data centers exhaust heat at 25–45°C from their cooling systems — at temperatures useful for 4GDH and 5GDHC networks
- Liquid-cooled data centers (direct-to-chip cooling, immersion cooling) can exit at 45–65°C — potentially usable in 3GDH networks without heat pump boost
- High-performance computing (HPC) and AI training infrastructure generates heat at particularly high density, making liquid cooling (and therefore higher-temperature heat recovery) increasingly common

The economic barrier is proximity: district heating networks must be within ~10–30 km of the heat source for transport losses to be acceptable. Urban data centers (co-location facilities in city centers) are ideally positioned; hyperscale data centers built on cheap rural land are not.

**IEA projection:** Under its base case scenario, data center waste heat recovery could supply approximately 60 TWh/year of district heat across Europe by 2030 if policy frameworks (heat purchase agreements, connection mandates) are in place [IEA Energy and AI 2025].

### 4.2 Google Finland: The Hamina Data Center

Google's Hamina data center, located on the Gulf of Finland coast in the city of Hamina, is one of the most-cited examples of data center waste heat recovery at operational scale.

The facility, originally a paper mill converted in 2011, uses Baltic Sea seawater as a cooling medium. In 2022, Google and Hamina city utility Haminan Energia announced a formal waste heat recovery agreement: the data center's cooling water, exiting at approximately 35–45°C, is connected to Hamina's district heating network via a heat pump installation.

**Operational results (2023–2024):**
- Heat supplied to Hamina district network: approximately 100 GWh/year
- Fraction of Hamina's total district heat demand covered: approximately 30–40%
- Carbon reduction for Hamina's district heat: approximately 30,000 tonnes CO₂/year versus the previous fossil-fuel baseline
- Cost to Hamina residents: heat cost reduction of approximately €80–120/household/year

The Hamina project is significant not for its scale (it is a small city) but for its proof of concept: a hyperscale cloud data center can be directly integrated into a municipal district heating system with a formal purchase agreement structure. [Google Environmental Report 2024; Haminan Energia Annual Report 2024.]

### 4.3 Stockholm Exergi and the Kista Connection

Stockholm Exergi operates the Stockholm district heating network, serving approximately 800,000 residents. The network is the largest in Sweden and one of the largest in Europe, delivering approximately 9,000 GWh/year.

**The Kista IT park connection:** Kista is Stockholm's primary technology district, hosting major data centers operated by Ericsson, Microsoft, and several co-location providers. Stockholm Exergi has heat purchase agreements with multiple Kista facilities. As of 2024, approximately 3% of Stockholm's district heat (approximately 270 GWh/year) comes from IT park waste heat recovery.

**The biogenic CCS experiment:** Stockholm Exergi is also pioneering biogenic carbon capture and storage (bioCCS or BECCS) on its biomass boilers. If successful, this makes Stockholm district heating not just carbon-neutral but carbon-negative — each gigajoule of heat delivered removes net CO₂ from the atmosphere. The KVV8 bioCCS pilot (capacity: 800,000 tonnes CO₂/year) is the world's largest planned biogenic CCS facility. [Stockholm Exergi Annual Report 2024; EU Innovation Fund award documentation, 2023.]

### 4.4 Industrial Waste Heat Cascading

Industrial processes — steel mills, cement kilns, chemical plants, food processing facilities — exhaust enormous quantities of thermal energy at temperatures ranging from 50°C to 500°C+. Higher-temperature waste streams are candidates for electricity generation (organic Rankine cycle, steam turbines); lower-temperature streams are optimal for district heating.

**Temperature cascade hierarchy:**
| Waste heat temperature | Primary use | Residual use |
|------------------------|-------------|--------------|
| >300°C | Steam generation / electricity (ORC) | Residual to district heat |
| 150–300°C | Industrial process heat recovery | — |
| 80–150°C | Direct district heat injection (3GDH) | — |
| 45–80°C | District heat with heat pump boost | — |
| 25–45°C | 4GDH/5GDHC direct injection | — |
| <25°C | Ground-source heat pump source | — |

**Example — Ruukki steel, Hämeenlinna, Finland:** SSAB's steel processing facility at Hämeenlinna supplies waste heat at 60–80°C to the local Hämeenlinnan district heating network. Approximately 250 GWh/year of waste heat displaces biomass boiler operation, reducing the city's fuel costs by approximately €5 million/year. [Finnish Energy Industries, 2024.]

**Policy lever:** The EU Energy Efficiency Directive (EED) 2023 revision requires large industrial installations (>10 MW thermal) to submit waste heat utilization plans and mandates that network operators accept available waste heat above defined cost thresholds. This is the first binding EU framework for industrial waste heat integration. [EU EED 2023, Article 26.]

---

## 5. Thermal Energy Storage: Shifting Heat in Time

### 5.1 Borehole Thermal Energy Storage (BTES)

Borehole thermal energy storage uses arrays of vertical ground heat exchangers — essentially the same technology as ground-source heat pumps, but configured for bulk thermal storage rather than active heat extraction. Heat is injected into the ground during summer (or when surplus renewable electricity is available) and extracted during winter heating season.

**Technical parameters:**
- Borehole depth: 50–200 m (typical), drilled in close-spaced arrays (4–6 m spacing)
- Storage capacity: the thermal mass of soil/rock between boreholes. Typical energy density: 15–40 kWh/m³ of storage volume (versus 50–80 kWh/m³ for water tanks, but BTES can scale to millions of cubic meters)
- Round-trip efficiency: 50–80% depending on design, geology, and charge/discharge strategy
- Charge/discharge cycle: typically seasonal (months), not daily
- Appropriate geology: uniform rock or consolidated sediment; not suitable in fractured rock or near groundwater flows

**Scale:** The largest BTES systems are in the 100,000–500,000 borehole-meter range (e.g., 500 boreholes at 200 m depth = 100,000 m of borehole). KDHC's Hwaseong facility (South Korea) stores approximately 90 GWh seasonally. The economics become favorable at district scale (100+ buildings) because the surface area–to–volume ratio improves as the array grows.

### 5.2 Aquifer Thermal Energy Storage (ATES)

ATES uses natural groundwater-bearing geological formations (aquifers) to store heat or cold. Hot water is injected into a warm well during summer and pumped back through a heat exchanger in winter; cold water is injected into a cold well in winter and used for cooling in summer. A well pair serves both heating and cooling simultaneously (though at different times of year), making ATES a natural fit for building portfolios with both loads.

**Key advantages over BTES:**
- Much higher storage capacity per drilled meter (aquifer water has high specific heat capacity and natural thermal diffusivity handles the storage geometry)
- Lower installation cost per kWh of capacity in favorable geology
- Round-trip efficiency: 60–85% (higher than BTES because water movement carries heat directly to the heat exchanger)
- Operational temperature range: 5–30°C for cold storage, 30–80°C for heat storage (within aquifer temperature tolerance)

**Example:** The Amsterdam ATES cluster. Amsterdam has more than 500 ATES systems operating within the city limits — more than any other city in the world. The majority serve commercial buildings (offices, hospitals, universities) in a cold storage/heat storage configuration. Total estimated cold storage capacity: ~2,000 GWh/year, covering approximately 20% of Amsterdam's commercial cooling demand. [IF Technology ATES survey, 2023; Netherlands Enterprise Agency RVO, 2024.]

**Regulatory constraint:** ATES requires hydrogeological permitting. Multiple systems in the same aquifer can interfere with each other thermally. Dutch water authorities have developed ATES spatial planning frameworks (thermogeological zoning maps) that optimize aquifer utilization across multiple competing users — an early example of thermal commons management.

### 5.3 Phase-Change Materials (PCM)

Phase-change materials exploit the latent heat of a phase transition (solid-to-liquid or liquid-to-solid) to store large amounts of thermal energy at a nearly constant temperature. Unlike sensible heat storage (water tanks), PCM can store 5–14 times more energy per kilogram at the transition temperature.

**Relevant materials for district energy:**

| Material | Melting point | Latent heat | Application |
|----------|---------------|-------------|-------------|
| Water/ice | 0°C | 334 kJ/kg | District cooling, cold storage |
| Paraffin C16 | 18–20°C | 152 kJ/kg | Building thermal mass, 5GDHC |
| Fatty acid blends | 29–31°C | 160–180 kJ/kg | Building thermal mass |
| Sodium acetate trihydrate | 58°C | 265 kJ/kg | Hot water storage, 4GDH |
| Paraffin C28 | 61–64°C | 253 kJ/kg | Industrial waste heat storage |
| Potassium nitrate blends | 220–250°C | 100–150 kJ/kg | Industrial, CSP storage |

**District-scale application:** Ice slurry storage for district cooling is commercially mature. Ice is generated overnight (when electricity is cheap and cooling demand is low) and stored in insulated tanks; during peak cooling hours, ice slurry is pumped through the district cooling network, providing cooling at a fraction of real-time chiller electricity cost. **Tabreed** (National Central Cooling Company, UAE) operates ice slurry district cooling in Dubai and Abu Dhabi, with peak demand reduction of 30–40% compared to conventional chilled water systems. [Tabreed Annual Report 2024.]

### 5.4 Drake Landing Solar Community, Canada

Drake Landing Solar Community (DLSC) in Okotoks, Alberta, Canada, is the world's demonstration case for solar-seasonal BTES at residential scale. Built in 2007, it is a 52-home development designed to source ~90% of annual space heating from summer solar energy stored underground.

**System design:**
- 800 m² of flat-plate solar thermal collectors on garage rooftops
- Short-term thermal storage: 120,000-liter (120 m³) stainless steel tank in community energy center
- Long-term seasonal BTES: 144 boreholes, 35 m depth, 3,600 m² footprint, in the center of the development
- Distribution: 4th generation-compatible low-temperature loop at 40–45°C supply
- Backup: conventional natural gas boiler (original design; now partially supplemented by heat pumps)

**Measured performance (2007–2024 operational average):**
- Solar fraction (fraction of space heating from solar-seasonal BTES): 96% in the best year, 90% on 17-year average
- Annual natural gas savings per home: approximately 11,000 m³/year versus baseline Alberta homes
- System BTES efficiency (heat stored vs. heat recovered): approximately 75–80% seasonal
- CO₂ reduction: approximately 5 tonnes/home/year versus Alberta average baseline

The DLSC is important as a demonstration of what 4th generation district heating connected to seasonal solar thermal storage can achieve in a cold continental climate (Okotoks heating degree days are comparable to Edmonton or Winnipeg). The technology is commercially mature; the challenge is financing the community-scale infrastructure at the development stage, before individual buyers commit. [Natural Resources Canada, DLSC Performance Monitoring Report 2024; IEA SHC Task 45.]

---

## 6. AI and Machine Learning for Thermal Network Optimization

Thermal networks generate rich real-time data: supply and return temperatures at hundreds of substations, flow rates, pump pressures, ambient temperatures, building load measurements. This is a natural environment for machine learning — the optimization problem (minimize heat production cost while maintaining supply temperature and pressure within tolerances across the entire network) is high-dimensional, time-varying, and historically solved by conservative rule-based setpoints that leave significant efficiency on the table.

**Key AI applications in district energy:**

**Demand forecasting:** Thermal load is more predictable than electricity load but still highly variable with weather (especially for heating-dominated networks). Short-term ML forecasting (2–72 hours ahead) of aggregate network demand allows heat plant operators to minimize expensive peak-load boiler use. **Aalborg University** researchers demonstrated that LSTM-based 24-hour thermal load forecasting for the Aalborg district heating network achieved MAPE of 2.8% versus 4.5% for the statistical baseline, reducing peaking boiler operation hours by 12% annually. [Bacher et al., 2024, *Energy*].

**Optimal supply temperature control:** Most 3GDH networks operate at fixed supply temperature setpoints (e.g., 80°C always). The minimum supply temperature that meets all customer load requirements varies with outdoor temperature, time of day, and network topology. A reinforcement learning controller at the Ust-Kamenogorsk district heating network (Kazakhstan) reduced supply temperature by an average of 6°C below the rule-based setpoint without any loss-of-service events, reducing distribution heat losses by 9% and boiler fuel consumption by 7%. [Siemens Energy research, 2023.]

**Leak detection:** Underground pipe leaks waste heat and water, and can cause sinkhole hazards. ML-based anomaly detection using substation flow balance data (comparing expected versus measured flow at each node) can detect leaks 4–6 weeks earlier than pressure-drop-based detection. **NIBE** (Sweden) and **Danfoss** (Denmark) both offer ML-based leak detection as a service for district heating operators. Published case studies show 30–50% reduction in undetected leak duration versus conventional monitoring.

**Prosumer dispatch optimization:** In 4GDH networks with prosumer injection, the network operator must schedule which prosumers inject heat (and at what times) to maintain network stability. This is a real-time market design and optimization problem. University of Stuttgart researchers modeled a 4GDH network with 150 prosumers using a multi-agent RL framework and demonstrated 18% reduction in central plant operation versus rule-based prosumer scheduling. [Müller et al., 2023, *Applied Energy*.]

**Predictive maintenance:** Heat exchanger fouling, pump degradation, and insulation deterioration all reduce network efficiency over time. ML-based anomaly detection on pump power, flow rate, and temperature differential signals can flag degrading components 4–8 weeks before failure. A Danish network operator (Fjernvarme Fyn) reported 23% reduction in unplanned outages after deploying predictive maintenance ML in 2022.

---

## 7. Connection to Geothermal: Heat Pump Cascades

District heating and geothermal energy are natural partners. The core connection is the heat pump: a geothermal heat pump extracts heat from the ground (typically at 10–20°C) and upgrades it to a useful temperature (50–90°C) for the district network. At district scale, heat pump COP is substantially better than at building scale, because:

1. **Larger heat pumps are more efficient.** A 10 MW industrial heat pump achieves COP of 3.5–5.0; a 10 kW residential unit achieves 3.0–3.5 at comparable conditions.
2. **The shared ground loop can be managed for optimal temperature.** A building-scale GSHP depletes its local ground temperature under sustained load; a district-scale network can distribute extraction across a large field, maintaining steady source temperature.
3. **Cascade configurations.** In a cascade, the output of one heat pump becomes the source for the next, allowing a 10°C ground temperature to be stepped up to 80°C+ over multiple stages with each stage operating at its optimal lift.

**Deep geothermal integration:** In cities with accessible hydrothermal resources, deep geothermal (1–5 km wells) provides a base-load thermal source without the seasonal variability of solar thermal. Helsinki is drilling two 7 km deep geothermal wells (the ST1 Deep Heat project) targeting 120°C rock temperatures; if successful, each well provides approximately 10 MW thermal to the Helen district network without heat pump boost.

**Connection to GRD research:** The Geothermal Research & Development project (GRD) in the 190+ research series covers the physics of thermal gradient, geothermal heat exchanger design, and the thermodynamic limits on heat extraction — all directly foundational to understanding how district heating networks source their base-load heat. The GPE efficiency lens connects: countries with accessible geothermal resources (Iceland, New Zealand, Kenya, Costa Rica) can supply district heating at near-zero fuel cost, dramatically improving their $R_E$ component.

---

## 8. DIY Project: Modeling a District Heating Network in Python

**Difficulty:** Intermediate | **Cost:** $0 (software only) | **Time:** 6–12 hours

This project models a simplified district heating network — computing heat loss, pipe sizing, supply temperature profiles, and seasonal demand — using only Python standard libraries plus NumPy and matplotlib.

**System description:** A simple star topology with one central plant and five substations connected by buried insulated pipes of varying lengths.

```python
import numpy as np
import matplotlib.pyplot as plt
from dataclasses import dataclass
from typing import List

@dataclass
class PipeSegment:
    """One segment of district heating pipe."""
    length_m: float          # meters
    diameter_mm: float       # nominal diameter
    insulation_thickness_mm: float
    soil_temp_c: float = 8.0  # average annual soil temperature

    def heat_loss_w_per_m(self, supply_temp_c: float) -> float:
        """
        Linear heat loss model: q = U * (T_supply - T_soil)
        U is the thermal transmittance coefficient (W/m·K)
        Typical pre-insulated pipes: U = 0.20–0.35 W/(m·K) for DN100–DN200
        """
        # U coefficient from insulation thickness (simplified)
        r_insulation = self.insulation_thickness_mm / 1000  # m
        lambda_foam = 0.030  # W/(m·K) for PUR foam insulation
        U = lambda_foam / r_insulation  # simplified slab approximation
        U = min(U, 0.35)  # cap at realistic pipe U-value
        return U * (supply_temp_c - self.soil_temp_c)

    def annual_heat_loss_kwh(self, supply_temp_c: float,
                              hours_per_year: int = 6000) -> float:
        """Heat loss over the heating season."""
        q_per_m = self.heat_loss_w_per_m(supply_temp_c)
        # Both supply and return pipes lose heat
        total_watts = 2 * q_per_m * self.length_m
        return total_watts * hours_per_year / 1000  # kWh


@dataclass
class Substation:
    """A building connection point on the network."""
    name: str
    peak_demand_kw: float        # heating peak demand
    pipe: PipeSegment

    def annual_demand_kwh(self, heating_degree_days: float = 3200) -> float:
        """
        Simplified degree-day method for annual heat demand.
        Heating degree days base 15.5°C (ASHRAE standard).
        Design outdoor temperature assumed -10°C for sizing.
        """
        design_delta_t = 15.5 - (-10)  # = 25.5°C
        hours_equivalent = heating_degree_days * 24 / design_delta_t
        # Apply diversity factor (not all buildings at peak simultaneously)
        diversity_factor = 0.75
        return self.peak_demand_kw * hours_equivalent * diversity_factor


class DistrictHeatingNetwork:
    def __init__(self, supply_temp_c: float, substations: List[Substation]):
        self.supply_temp_c = supply_temp_c
        self.substations = substations

    def total_peak_demand_kw(self) -> float:
        # With diversity factor built into substations
        return sum(s.peak_demand_kw for s in self.substations) * 0.75

    def total_annual_demand_kwh(self, hdd: float = 3200) -> float:
        return sum(s.annual_demand_kwh(hdd) for s in self.substations)

    def total_distribution_loss_kwh(self) -> float:
        return sum(s.pipe.annual_heat_loss_kwh(self.supply_temp_c)
                   for s in self.substations)

    def distribution_efficiency(self, hdd: float = 3200) -> float:
        demand = self.total_annual_demand_kwh(hdd)
        loss = self.total_distribution_loss_kwh()
        return demand / (demand + loss)

    def report(self, hdd: float = 3200):
        print(f"\n=== District Heating Network Report ===")
        print(f"Supply temperature: {self.supply_temp_c}°C")
        print(f"Heating degree days: {hdd}")
        print(f"\nSubstation breakdown:")
        total_demand = 0
        total_loss = 0
        for s in self.substations:
            demand = s.annual_demand_kwh(hdd)
            loss = s.pipe.annual_heat_loss_kwh(self.supply_temp_c)
            total_demand += demand
            total_loss += loss
            print(f"  {s.name}: demand={demand/1000:.1f} MWh/yr, "
                  f"pipe loss={loss/1000:.1f} MWh/yr ({loss/demand*100:.1f}%)")
        print(f"\nNetwork totals:")
        print(f"  Heat delivered: {total_demand/1000:.1f} MWh/yr")
        print(f"  Distribution losses: {total_loss/1000:.1f} MWh/yr")
        print(f"  Distribution efficiency: {self.distribution_efficiency(hdd)*100:.1f}%")
        print(f"  Central plant output needed: {(total_demand+total_loss)/1000:.1f} MWh/yr")


# --- Example network: 3GDH vs 4GDH comparison ---

substations = [
    Substation("Hospital", 800, PipeSegment(500, 200, 80)),
    Substation("Office Block A", 400, PipeSegment(800, 150, 70)),
    Substation("Residential Zone", 600, PipeSegment(1200, 150, 70)),
    Substation("School", 250, PipeSegment(600, 100, 60)),
    Substation("Sports Center", 350, PipeSegment(900, 125, 65)),
]

print("=== 3rd Generation District Heating (85°C supply) ===")
net_3gdh = DistrictHeatingNetwork(85.0, substations)
net_3gdh.report()

print("\n=== 4th Generation District Heating (60°C supply) ===")
net_4gdh = DistrictHeatingNetwork(60.0, substations)
net_4gdh.report()
```

**What to explore:**
1. **Pipe sizing sensitivity:** Vary `diameter_mm` and measure how distribution loss changes. Larger pipes have lower velocity and pressure drop but more pipe surface area — the optimal diameter balances these.
2. **Climate comparison:** Change `heating_degree_days` from 1000 (mild, e.g., London) to 5000 (cold, e.g., Helsinki) and observe how the distribution loss fraction changes as demand grows but loss stays constant.
3. **Generation comparison:** The 3GDH vs. 4GDH output directly shows why lower supply temperatures reduce distribution losses.
4. **Seasonal demand curve:** Extend the model to add month-by-month outdoor temperature and compute monthly heat plant output — this is the real scheduling problem that district operators solve daily.

**Learning objectives:**
- Heat transfer in buried pipes (conduction through insulation, soil coupling)
- Degree-day method for building heating demand estimation
- Network efficiency calculation
- The quantitative argument for lower supply temperatures (4GDH)

---

## 9. The Complex Plane of Thermal Systems

Applying the energy state variable framework (Module 1 of `ai-learning-pathways.md`) to district thermal networks:

$$z_{TH}(t) = R_{TH}(t) + i \cdot X_{TH}(t)$$

**Real component $R_{TH}(t)$** — measurable thermal system efficiency:
- Network distribution efficiency (heat delivered / heat produced)
- Waste heat recovery fraction (% of total heat from zero-marginal-cost sources)
- Storage round-trip efficiency
- Carbon intensity of heat delivered (gCO₂/kWh)

**Imaginary component $X_{TH}(t)$** — experienced thermal comfort and thermal equity:
- Fraction of households experiencing adequate warmth in winter (EU-SILC survey data)
- Heating cost as fraction of income (thermal energy burden)
- Cultural experience of collective thermal infrastructure (solidarity vs. dependency)
- Reliability of heat supply (outage frequency, duration)

**Quadrant analysis:**

| Quadrant | Countries/systems | Character |
|----------|-------------------|-----------|
| I ($R_{TH}>0$, $X_{TH}>0$) | Copenhagen, Helsinki, Stockholm | Efficient district networks AND thermal comfort equity — the Nordic archetype |
| II ($R_{TH}<0$, $X_{TH}>0$) | Soviet-era networks (some Estonian, Latvian systems) | Old inefficient infrastructure but cultural solidarity around shared heating — residents trust the system even as it wastes fuel |
| III ($R_{TH}<0$, $X_{TH}<0$) | Sub-Saharan Africa, fragile states | Neither efficient heating nor experienced warmth — energy poverty in its thermal dimension |
| IV ($R_{TH}>0$, $X_{TH}<0$) | UK (gas boiler-dependent system) | National gas infrastructure appears efficient statistically; but 6.5 million fuel-poor households experience winter thermal stress |

The UK Quadrant IV position is the clearest policy signal: improving $R_{TH}$ further (slightly more efficient boilers, slightly better gas metering) does nothing for $X_{TH}$ — only structural change (insulation, shared infrastructure, heat pump deployment, social tariffs) can move the UK from Quadrant IV toward Quadrant I.

---

## 10. Cross-Links and Sources

**Cross-links within GPE and the broader Research Series:**
- **GRD (Geothermal Research & Development):** thermal physics foundations, heat exchanger design, deep geothermal resource assessment
- **OCN (Ocean & Data Center Cooling):** data center thermal management, seawater cooling, waste heat integration pathways
- **VAV (HVAC Systems):** building-level thermal systems that connect to district networks; heat pump integration at the substation interface
- **ai-learning-pathways.md:** complex plane framework for thermal systems (this document extends Section 1 of that module to the thermal domain)

**Primary sources:**

- IEA. *Heating*. International Energy Agency, 2024. https://www.iea.org/energy-system/buildings/heating
- IEA. *Energy and AI*. International Energy Agency, April 14, 2025. https://www.iea.org/reports/energy-and-ai
- IEA. *Net Zero by 2050*. IEA NZE Scenario. Paris, 2023.
- Lund, H., Werner, S., Wiltshire, R., et al. "4th Generation District Heating (4GDH): Integrating smart thermal grids into future sustainable energy systems." *Energy* 68 (2014): 1–11. doi:10.1016/j.energy.2014.02.089
- Lund, H., Østergaard, P.A., Chang, M., et al. "The status of 4th generation district heating: Research and results." *Energy* 164 (2018): 147–159.
- HOFOR. *Annual Report 2024*. Hovedstadens Forsyningsselskab. Copenhagen, 2024.
- Helen Ltd. *Annual Report 2024*. Helsinki Energy. Helsinki, 2024.
- KDHC. *Technology Report 2023*. Korea District Heating Corporation. Seoul, 2023.
- Google. *Environmental Report 2024*. Google LLC. Mountain View, 2024.
- Stockholm Exergi. *Annual Report 2024*. Stockholm, 2024.
- Natural Resources Canada. *Drake Landing Solar Community: Performance Monitoring Report 2024*. Ottawa, 2024.
- Bacher, P., Bergsteinsson, H., et al. "LSTM forecasting for district heating networks." *Energy* 288 (2024): 129721.
- EU Energy Efficiency Directive (EED). European Parliament Directive 2023/1791. Official Journal of the European Union, 2023.
- Tabreed. *Annual Report 2024*. National Central Cooling Company. Abu Dhabi, 2024.
- IF Technology. *ATES Netherlands Survey*. Arnhem, 2023.
- IEA SHC. *Task 45: Large Solar Heating/Cooling Systems, Seasonal Storage, Heat Pumps*. International Energy Agency Solar Heating and Cooling Programme.

---

*This module is part of the GPE Research Supplement series. See also: `ai-learning-pathways.md` (AI tools, complex plane, DIY projects) and `source-verification-2026.md` (data quality and update schedule). The five GPE research modules together form the research substrate for the 75-country Global Power Efficiency Rankings.*
