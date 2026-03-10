# Air Purification Systems
## Clean Air, Water & Food — Module 1

*Part of the AWF Living Systems Research Series | Pacific Northwest Research Library*

---

## Table of Contents

1. [Health Context and Scale](#health-context-and-scale)
2. [Core Purification Technologies](#core-purification-technologies)
3. [Technology Deep Dives](#technology-deep-dives)
4. [2024–2025 Key Developments](#20242025-key-developments)
5. [AI Integration and Smart Systems](#ai-integration-and-smart-systems)
6. [Market Landscape](#market-landscape)
7. [Indoor vs Outdoor Considerations](#indoor-vs-outdoor-considerations)
8. [Technology Selection Guide](#technology-selection-guide)
9. [Cross-Module Links](#cross-module-links)
10. [Source References](#source-references)

---

## Health Context and Scale

### Global Burden

Air pollution constitutes one of the most significant environmental health challenges documented by modern epidemiology. The Health Effects Institute's *State of Global Air 2024* confirmed 8.1 million premature deaths annually attributable to air pollution, positioning it among the leading causes of preventable mortality worldwide (Health Effects Institute, 2024).

In the United States, the American Lung Association's *State of the Air 2025* report found that nearly half of the U.S. population — approximately 156 million people — lives in counties where air quality received a failing grade on at least one pollution measure (American Lung Association, 2025). This represents a substantial fraction of the population with chronic exposure to particulate matter and ground-level ozone at levels the ALA defines as unhealthy.

### The Indoor Exposure Problem

A critical but underappreciated dimension of air quality is that humans in industrialized nations spend an estimated 90% of their time indoors (World Economic Forum, November 2024). Indoor air quality does not automatically track outdoor quality; in many cases it diverges significantly. Research published in Springer Nature (2024) documented "sick building syndrome" patterns in poorly ventilated spaces, where the accumulation of volatile organic compounds (VOCs), particulates, biological contaminants, and combustion byproducts from indoor sources can result in symptoms including headaches, fatigue, respiratory irritation, and reduced cognitive performance.

Indoor air contaminants derive from multiple simultaneous sources: building materials off-gassing VOCs (formaldehyde from pressed wood, benzene from adhesives), combustion appliances (natural gas cooking, wood stoves, candles), consumer products (cleaning agents, air fresheners, personal care products), biological sources (mold, pollen, pet dander, dust mites), and infiltration of outdoor pollution. The net result is that occupants may face a complex, time-varying mixture of contaminants that no single purification technology addresses completely.

### Contaminant Categories Relevant to Indoor Air

Understanding purification technology requires first characterizing what is being removed:

| Contaminant Category | Examples | Primary Health Concern |
|---------------------|----------|----------------------|
| Particulate Matter PM2.5 | Combustion soot, smoke, fine dust | Cardiovascular and pulmonary disease |
| Particulate Matter PM10 | Pollen, coarser dust, mold spores | Respiratory irritation, allergy |
| Volatile Organic Compounds (VOCs) | Formaldehyde, benzene, toluene, xylene | Irritation, carcinogenicity (some compounds) |
| Biological contaminants | Bacteria, viruses, mold spores, dust mite allergens | Infection, allergic sensitization |
| Nitrogen dioxide (NO2) | Gas combustion byproduct | Respiratory irritation |
| Carbon monoxide (CO) | Incomplete combustion | Acute toxicity at high levels |
| Ozone (O3) | Outdoor infiltration, some air purifier byproduct | Respiratory irritation, lung damage |
| Radon | Natural radioactive decay from soil | Lung cancer risk (long-term exposure) |
| PFAS particles | Coated cookware, water-resistant textiles | Under ongoing EPA and NIH research |

*Note: Health effects cited above refer to established findings in peer-reviewed literature. For specific exposure-response relationships, consult Health Effects Institute (2024) and EPA Clean Air Act regulatory assessments.*

---

## Core Purification Technologies

The following table summarizes eight distinct purification mechanisms, their primary targets, documented efficacy, and key limitations. Each technology operates on a different physical or chemical principle, and most practical applications involve combining two or more mechanisms.

### Technology Comparison Matrix

| Technology | Primary Mechanism | Primary Targets | Documented Efficacy | Key Limitations | Byproduct Risk |
|-----------|------------------|-----------------|--------------------|-----------------|-----------------|
| HEPA Filtration | Mechanical interception, diffusion, impaction | PM2.5, PM10, allergens, mold spores, viruses (when ≥0.3µm) | 99.97% capture of particles ≥0.3µm (HEPA standard); 78.8% PM reduction in primary rooms; 57.9% in secondary rooms (Li et al., 2024) | No gas/VOC removal; filter replacement required; pressure drop reduces airflow | None inherent; filter disposal |
| Activated Carbon | Adsorption | VOCs, odors, chlorine gas, some chemicals | VOC adsorption effective for toluene, benzene, formaldehyde at low concentrations; limited data on high-concentration events | Finite adsorption capacity; breakthrough when saturated; ineffective against particles | None inherent; spent carbon disposal |
| UV-C Disinfection | Photon-induced DNA/RNA damage | Bacteria, viruses, biological contaminants | WHO-recognized mechanism for pathogen inactivation; efficacy depends on exposure time and lamp intensity | No particle or chemical removal; effectiveness diminishes with dust accumulation on lamps | Ozone generation possible (dependent on wavelength; 254nm preferred) |
| Photocatalytic Oxidation (PCO) | Light-activated TiO2 nanoparticles oxidize VOCs | VOCs, some bacteria and mold | Degrades VOCs at lower concentrations; variable performance across contaminant types | Intermediate byproducts under investigation; variable performance by VOC type | Acetaldehyde and formaldehyde detected as intermediate oxidation products in some studies |
| Electrostatic Precipitators (ESP) | High-voltage electrostatic field charges and captures particles | Sub-micron particles, smoke, dust | Effective for fine particles; no filter replacement required | May generate ozone; performance degrades without regular cleaning; limited on gases/biologicals | Ozone generation; ionic wind may redistribute particles |
| Plasma-based Systems | Corona discharge or DBD plasma ionizes air | Bacteria, viruses, VOCs, mold, odors | Pathogen neutralization documented for specific organisms in controlled settings; VOC destruction variable | Ozone must be carefully controlled; byproduct profile complex; limited standardized testing | Ozone, NOx, and potentially other oxidation byproducts |
| Plant Biofilters | Phytoremediation and root-zone microbial activity | VOCs (formaldehyde, benzene, trichloroethylene), CO2 | NASA (1989) confirmed specific plant species removed VOCs under controlled conditions; insufficient air exchange rate for standalone residential use | Requires high plant density for meaningful effect; plant health maintenance; potential mold risk in humid conditions | None if managed properly |
| Nanofiber Filters | High surface-area-to-volume ratio fibrous matrix | Fine particles, some bioaerosols | Demonstrated superior filtration efficiency versus conventional fiber filters in laboratory settings; emerging technology | Manufacturing cost constraints; limited long-term field data; not yet widely standardized | None inherent |

### Reading the Efficacy Data

The figures above require careful interpretation:

**HEPA efficacy:** The 99.97% figure refers to single-pass capture efficiency in a controlled test environment. A meta-analysis of 148 studies found a 50% reduction in small particle counts in occupied spaces — a substantially lower figure than the filter specification (Li et al., 2024 as reported in ACS EST Engineering). The difference reflects real-world factors: recirculation rates, room geometry, occupant activity, and the fraction of air that actually passes through the unit.

**Room-level measurements:** A study across 29 homes measured PM2.5 reductions of 78.8% in the room containing a HEPA purifier and 57.9% in adjacent secondary rooms, demonstrating meaningful spillover benefit but lower performance away from the unit (Li et al., 2024).

**UV-C nuance:** Efficacy depends critically on lamp intensity, irradiation time, and the geometry of the exposure chamber. In-duct UV-C systems with longer exposure chambers outperform portable devices with brief exposure windows. Dust accumulation on lamps reduces output over time; regular maintenance is required.

---

## Technology Deep Dives

### HEPA Filtration

HEPA (High Efficiency Particulate Air) filters operate through four physical capture mechanisms: inertial impaction (large particles cannot follow airstream curves), interception (mid-size particles contact fibers while following streamlines), diffusion (very small particles undergo Brownian motion, increasing fiber contact probability), and electrostatic attraction (some HEPA filters carry electrostatic charge that assists particle capture).

The HEPA standard — 99.97% capture at ≥0.3 microns — reflects the "most penetrating particle size" (MPPS). Particles larger than 0.3µm are captured more efficiently by impaction and interception. Particles smaller than 0.3µm are captured more efficiently by diffusion. At exactly 0.3µm, neither mechanism dominates, producing the efficiency minimum that defines the standard.

**Applications in indoor environments:** HEPA filtration is the dominant technology in residential, commercial, and medical air purifiers. It addresses the largest fraction of total particulate burden in most indoor environments, including allergens (pollen, pet dander, dust mite debris, mold spores) and fine combustion particles.

**HEPA does not remove gases or VOCs.** This is a fundamental limitation that must be understood in any multi-contaminant environment. Standalone HEPA systems leave the VOC burden entirely unaddressed.

### Activated Carbon (Activated Charcoal)

Activated carbon is a porous carbonaceous material with an extremely high internal surface area — commercial activated carbons range from 500 to 1,500 square meters per gram. VOCs and other molecular species adsorb (bind to the surface) when air passes through or over the carbon matrix. The adsorption is reversible — temperature and pressure changes can cause desorption — but under normal indoor conditions, adsorbed species remain bound until the carbon is replaced or regenerated.

**Capacity limits:** Each gram of activated carbon has a finite adsorption capacity. In environments with high VOC loads (new construction, recently painted rooms, industrial spaces), activated carbon can saturate faster than expected. Once saturated, the filter provides no additional protection and previously adsorbed compounds may begin desorbing. Filter replacement schedules should account for actual VOC load, not just calendar time.

**Selectivity:** Activated carbon is most effective against organic compounds with molecular weights above approximately 45 g/mol. Formaldehyde, with a molecular weight of 30 g/mol, is notoriously difficult for standard granular activated carbon to capture without chemical impregnation (potassium permanganate impregnated carbons address this limitation).

### UV-C Disinfection

Ultraviolet-C radiation (wavelength 200–280nm, with 254nm being the classic germicidal wavelength) damages nucleic acids in microorganisms by forming pyrimidine dimers that prevent DNA replication. The WHO recognizes UV-C as an effective disinfection mechanism for biological contaminants in air and water systems.

**Dose determines efficacy:** Pathogen inactivation follows a log-reduction curve; 90% inactivation of a given organism requires a specific UV dose (measured in mJ/cm²), and 99.9% requires approximately 3× that dose. Different organisms have substantially different UV sensitivity. Bacterial spores and some viruses require significantly higher doses than vegetative bacteria.

**Ozone wavelength risk:** UV-C lamps emitting at wavelengths below approximately 240nm can generate ozone by splitting O2 molecules. Standard germicidal lamps at 254nm with proper quartz envelopes do not generate significant ozone. Lamp selection and quality control are critical to avoiding ozone as a byproduct.

**In-duct applications:** UV-C is commonly integrated into HVAC systems to provide continuous disinfection of circulated air. Centralized in-duct systems treat large air volumes but require proper lamp placement, intensity, and regular maintenance to maintain efficacy.

### Photocatalytic Oxidation (PCO)

PCO systems use UV or visible light to activate a catalyst — most commonly titanium dioxide (TiO2) — which then generates hydroxyl radicals (.OH) and other reactive oxygen species. These radicals oxidize VOCs, breaking down complex organic molecules into simpler compounds, ideally water and carbon dioxide.

**Byproduct concern:** The oxidation pathway does not always proceed to completion. Intermediate byproducts have been detected in controlled laboratory studies, including acetaldehyde and formaldehyde — compounds that are themselves indoor air quality concerns. The significance of this incomplete oxidation in real-world operating conditions is an active area of research, and standardized test methods for PCO byproducts remain underdeveloped as of 2025 (addressed in part by NIST September 2025 work described below).

**Emerging photocatalysts:** Research into visible-light-activated photocatalysts (moving beyond UV-dependent TiO2) and composite nanostructures continues. Singh et al. (2024) in *Environmental Research* reviewed next-generation photocatalytic materials with improved selectivity and reduced byproduct formation.

### Electrostatic Precipitators (ESP)

ESPs apply a high-voltage electric field to impart charge to airborne particles, which then migrate to oppositely charged collection plates. Unlike filters, ESP collection plates can be cleaned and reused, reducing ongoing consumable costs. ESPs are effective against sub-micron particles that challenge mechanical filtration.

**Ozone generation:** The corona discharge process that charges particles also ionizes oxygen molecules, producing ozone as a byproduct. Ozone concentrations from ESP devices vary widely with design and operating voltage. Regulatory limits for ozone generation from air cleaning devices differ by jurisdiction. California Air Resources Board (CARB) certification requires that air cleaning devices sold in California not produce ozone above 0.050 ppm.

**Performance degradation:** Collection plates require regular manual cleaning. As deposits accumulate, collection efficiency decreases. Systems with indicator lights or automatic cleaning cycles maintain performance better than systems requiring user-scheduled maintenance.

### Plasma-based Systems

Plasma air purification encompasses several related technologies: dielectric barrier discharge (DBD), corona discharge, and cold plasma ionization. All generate reactive species — ozone, hydroxyl radicals, superoxide ions, and UV photons — that interact with pollutants and biological contaminants in the air stream.

**Demonstrated pathogen effects:** Laboratory studies have documented inactivation of specific bacteria and viruses under controlled plasma exposure conditions. Field performance in complex, variable indoor environments is less well characterized.

**Ozone and byproduct management:** Plasma systems can generate ozone as an operational byproduct. System design choices — discharge gap, electrode geometry, operating frequency — significantly affect ozone output. Some commercial plasma systems incorporate ozone decomposition catalysts downstream of the plasma stage to reduce emitted ozone to acceptable levels.

### Plant Biofilters

The NASA Clean Air Study (B.C. Wolverton et al., 1989) remains the foundational reference for plant-based air purification. Under controlled chamber conditions, specific plant species — including golden pothos, peace lily, snake plant, Chinese evergreen, and others — removed VOCs including formaldehyde, benzene, and trichloroethylene from sealed test chambers.

**Limitations for standalone residential use:** The NASA study used sealed test chambers at high contaminant concentrations. In real buildings with normal ventilation, air exchange rates far exceed the phytoremediation capacity achievable with practical numbers of houseplants. Researchers have estimated that removing a meaningful fraction of indoor VOC load through plants alone would require hundreds of plants per room. Plant biofilters are not considered a standalone air purification solution for typical residential or commercial spaces.

**Active plant biofilter systems:** Engineering adaptations — systems that pull air through root zones and growing media — increase the plant-air contact rate substantially. These "active green walls" or "biotechnological plant biofilters" have demonstrated improved VOC removal in controlled studies compared to passive plants, but remain less studied at scale than conventional filtration technologies.

### Nanofiber Filters

Electrospun nanofiber filter media consist of polymer fibers with diameters in the range of 100 nm to several micrometers — far finer than conventional HEPA glass fiber media. The high surface-area-to-volume ratio and smaller fiber spacing enable high particle capture efficiency with lower pressure drop compared to conventional media at equivalent efficiency.

**Current status:** Nanofiber filters are an active research and early commercialization area as of 2025. Laboratory demonstrations show promising filtration characteristics across particle size ranges, including the sub-0.1µm ultrafine range where conventional HEPA capture efficiency is reduced. Cost constraints and manufacturing scalability limit widespread deployment in consumer products. Standardized testing protocols for nanofiber filter performance are still developing.

---

## 2024–2025 Key Developments

### NIST September 2025: New Standard Test Method for Air Cleaner Byproducts

The National Institute of Standards and Technology published a new standard test methodology in September 2025 specifically addressing byproduct emissions from air cleaning devices (NIST, September 2025). The methodology covers three categories of concern:

- **Ozone** — relevant to ESP, plasma, and UV-C systems
- **Formaldehyde** — relevant to PCO systems and material off-gassing from purifier components
- **Ultrafine particles (UFP)** — relevant to plasma, PCO, and ionization systems that may generate particle nucleation

The NIST methodology provides a reproducible test protocol that enables standardized comparison across device types and manufacturers. This addresses a significant gap in the field: previously, byproduct characterization methods varied substantially across studies, making device-to-device comparisons difficult.

**Significance for consumers and procurement:** The NIST test methodology creates a foundation for third-party certification programs to evaluate not just what air purifiers remove but what they emit. This is particularly relevant for UV-C, PCO, plasma, and electrostatic technologies where byproduct generation is a documented concern.

### HEPA Meta-Analysis: Real-World vs. Rated Performance

A meta-analysis of 148 studies examining HEPA air purifier performance in real occupied spaces found a 50% reduction in small particle counts — substantially lower than the 99.97% filter specification (Li et al., 2024, *ACS EST Engineering*). The gap reflects:

- **Air exchange dilution:** Not all room air passes through the purifier in a given time period
- **Particle resuspension:** Occupant activity continuously reintroduces settled particles
- **Room geometry:** Dead zones and airflow patterns limit purifier reach
- **Purifier sizing:** Many installations use units rated for smaller air volumes than the actual room

The same body of research documented a separate study across 29 homes measuring 78.8% PM reduction in primary rooms and 57.9% in secondary rooms adjacent to the purifier room — showing meaningful but size-dependent real-world performance (Li et al., 2024).

### American Lung Association State of the Air 2025

The American Lung Association's 2025 annual report documented that nearly half the U.S. population lives in counties that failed at least one air quality measure (American Lung Association, 2025). The report covers ozone and particulate pollution separately and assigns letter grades to counties nationwide. 2025 data reflects continued challenges from wildfire smoke events that affect air quality across regions distant from fire origin points.

### AI-Driven Smart Purifier Developments

Springer Nature published a 2025 study calling for standardized frameworks for AI energy efficiency in air filtration systems (Springer Nature, August 2025). The study reviewed the current generation of IoT-integrated air purifiers that incorporate real-time sensor arrays and adaptive control algorithms. Key capabilities documented in the review include:

- **Particulate sensors:** PM1.0, PM2.5, PM10 monitoring with sub-minute response
- **Gas sensors:** VOC, CO2, CO, formaldehyde, and humidity monitoring
- **Predictive control:** Machine learning algorithms anticipating occupancy patterns and pre-adjusting purifier output
- **Multi-zone coordination:** Arrays of networked purifiers adjusting collectively based on whole-building sensor data
- **Energy optimization:** Fan speed and filter stage activation adjusted to sensor readings rather than running at maximum continuously

The standardization gap identified in the Springer Nature study concerns the lack of consistent metrics for evaluating energy efficiency trade-offs in AI-controlled systems — a prerequisite for meaningful comparison across manufacturers.

---

## AI Integration and Smart Systems

### Current Capabilities

The integration of sensor arrays and adaptive control represents the primary performance advance in residential and commercial air purification systems from 2022–2025. Conventional air purifiers operate on timers or simple manual speed settings. Smart air purifiers incorporate:

**Sensor arrays:** Multiple simultaneous pollutant sensors enabling real-time indoor air quality indexing. Commercial systems measure PM2.5, PM10, total VOC concentration, CO2 (as a proxy for occupancy and ventilation adequacy), temperature, and humidity. Premium systems add formaldehyde-specific sensors and CO sensors.

**Adaptive fan control:** Purifier fan speed responds to measured air quality, running at low speed during clean periods (reducing noise and energy consumption) and ramping to maximum speed when sensors detect elevated contaminant levels. This replaces fixed schedules that cannot respond to actual conditions.

**Cloud integration and remote monitoring:** Many systems provide smartphone applications displaying historical air quality data, filter life estimates, and remote control. Air quality data from networked devices can aggregate to neighborhood-level maps.

**Filter life estimation:** Traditional filter replacement was calendar-based. Smart systems estimate filter life based on cumulative particle load and hours of operation, reducing waste from premature replacement and preventing degraded performance from overdue replacement.

### Research Frontiers (2025)

**Multi-sensor fusion:** Research into combining data from multiple sensor types — PM, gas, biological — using machine learning to characterize contamination events (cooking vs. cleaning product use vs. wildfire smoke infiltration vs. HVAC malfunction) and optimize purifier response accordingly.

**Demand-controlled ventilation integration:** Systems integrating air purifier control with HVAC demand-controlled ventilation, so that increased outdoor air supply and increased recirculation filtration are coordinated responses to detected indoor air quality events.

**Energy efficiency standardization:** The Springer Nature (August 2025) study identified the absence of standardized AI energy efficiency metrics as a priority gap. Without consistent benchmarks, manufacturers cannot make comparable claims about efficiency gains from AI control, and buyers cannot evaluate them.

---

## Market Landscape

### Global Market Size

The global air filtration market was valued at $15.54 billion in 2022 and is projected to reach $28.45 billion by 2032 (Springer Nature, 2025). This growth trajectory reflects:

- Increased consumer awareness of indoor air quality following COVID-19
- Growing wildfire smoke events affecting more populated regions
- Commercial building upgrades driven by HVAC efficiency and occupant health requirements
- Expansion of HVAC filtration in commercial construction in Asia-Pacific markets

### Market Segments

The air filtration market spans several distinct segments with different growth drivers:

| Segment | Primary Technology | Key Growth Drivers |
|---------|------------------|-------------------|
| Residential air purifiers | HEPA + activated carbon | Consumer health awareness, wildfire smoke events |
| Commercial HVAC filtration | High-MERV mechanical filters, in-duct UV-C | Building codes, occupant wellness programs |
| Medical/cleanroom filtration | HEPA, ULPA | Regulatory requirements, hospital-acquired infection prevention |
| Industrial process filtration | Electrostatic precipitators, baghouse filters | Emissions regulations, worker health |
| Automotive cabin air filtration | HEPA, activated carbon | Vehicle electrification (quieter cabins increase filtration value) |
| Smart/IoT-connected purifiers | HEPA + multi-sensor | Premiumization, platform ecosystem development |

### Technology Adoption Patterns

HEPA-plus-activated-carbon combination units dominate the residential segment. UV-C is increasingly offered as an add-on stage in mid-range and premium units. PCO and plasma technologies appear in premium niche products and commercial applications. Nanofiber media is beginning to appear in premium filter replacements for existing purifier platforms.

---

## Indoor vs Outdoor Considerations

### Why Indoor and Outdoor Air Quality Differ

Outdoor air quality is governed by meteorology, emission sources (traffic, industry, wildfire, agriculture), and atmospheric chemistry. Indoor air quality begins with outdoor air infiltrating the building envelope, but diverges significantly based on:

**Indoor sources:** Building materials, furnishings, consumer products, cooking, combustion appliances, occupant activity, and biological growth generate contaminants that do not exist outdoors. New construction and recently renovated spaces typically have elevated VOC loads from fresh materials.

**Infiltration dynamics:** Outdoor PM and gas concentrations infiltrate through building envelopes at rates determined by envelope tightness, ventilation system design, and pressure differentials. Tighter buildings infiltrate less outdoor pollution but also dilute indoor contaminants less, potentially concentrating indoor-sourced pollutants.

**Outdoor ozone and PM2.5 during wildfire events:** High outdoor PM2.5 during wildfire smoke events represents a case where outdoor air quality substantially degrades indoor air quality even in well-sealed buildings.

### The Ventilation-Filtration Interaction

Ventilation (bringing in outdoor air) and filtration (cleaning recirculated indoor air) address different aspects of the indoor air quality problem:

- **Ventilation** dilutes indoor-sourced contaminants by replacing indoor air with outdoor air, but at the cost of potentially importing outdoor contaminants
- **Filtration** removes particulates and (in multi-stage systems) gases from air without the dilution-import trade-off, but does not address CO2 buildup from occupancy
- **During poor outdoor air quality events** (wildfire smoke, high pollen, high outdoor PM2.5), filtration of recirculated air is preferred over increased ventilation

**ASHRAE Standard 62.1** governs ventilation rates for acceptable indoor air quality in commercial buildings. The standard specifies minimum outdoor air supply rates by occupancy and space type. Demand-controlled ventilation (DCV) adjusts outdoor air supply based on occupancy sensors and CO2 measurements.

### Pacific Northwest Air Quality Context

The PNW faces a distinctive set of air quality challenges that make air purification technology choices regionally specific.

**Wildfire Smoke — The Dominant Seasonal Threat**

Wildfire smoke is the primary air quality challenge for Pacific Northwest communities. Washington and Oregon consistently rank among the states most affected by wildfire smoke, with the I-5 corridor from Eugene to Bellingham acting as a channeling path for smoke from both Cascade Range fires and long-range transport from California and British Columbia fires. The Columbia River Gorge functions as a natural wind tunnel that can concentrate smoke from eastern Oregon/Washington fires into the Portland-Vancouver metro area.

During the September 2020 wildfire crisis, Portland recorded AQI values exceeding 500 — the highest in the world at the time — and Seattle exceeded 300 for multiple consecutive days (Washington Department of Ecology, 2020; Oregon DEQ, 2020). These events drove widespread adoption of portable HEPA purifiers and DIY Corsi-Rosenthal box filters across the region. Field evaluations during the 2020 events documented that Corsi-Rosenthal boxes (box fan + MERV-13 filters) reduced indoor PM2.5 by 40-60% in homes without central HVAC filtration (Puget Sound Clean Air Agency, 2020).

Under high-smoke conditions:
- Window and door sealing reduces infiltration
- HVAC outdoor air dampers may be closed to reduce smoke infiltration
- Portable HEPA purifiers in occupied rooms provide measurable benefit based on the 29-home study showing 78.8% primary room PM reduction (Li et al., 2024)
- Corsi-Rosenthal boxes serve as lower-cost alternatives during acute smoke events, with documented effectiveness in PNW deployments

**Maritime Moisture and Indoor Mold**

The PNW's wet climate — western Washington and Oregon receive 37-140+ inches of annual precipitation — creates persistent indoor moisture challenges absent in drier regions. The western Cascades foothills and Olympic Peninsula receive some of the highest rainfall in the contiguous United States. This sustained humidity drives indoor mold growth in older construction without adequate vapor barriers, particularly in crawl spaces, basements, and bathrooms.

Indoor mold produces spores (addressed by HEPA filtration) and volatile organic compounds including microbial VOCs (mVOCs) responsible for musty odors (addressed by activated carbon). Multi-stage purifiers combining HEPA + activated carbon are particularly relevant in PNW maritime climates. The Washington State Department of Health documents mold as one of the most common indoor air quality complaints in western Washington (WA DOH, indoor air quality guidance).

**Volcanic and Geologic Sources**

The Cascade volcanic arc — from Mount Baker to Mount Hood — poses episodic SO2 and volcanic ash hazards. While major eruptions are rare, degassing from active volcanoes (particularly Mount St. Helens, Mount Rainier, and Mount Baker) contributes low-level SO2 to regional air chemistry. The 1980 Mount St. Helens eruption deposited ash across eastern Washington at concentrations that required respiratory protection; emergency preparedness planning for Cascade eruptions includes air filtration guidance from the Cascades Volcano Observatory (USGS CVO).

**Agricultural Burning and Columbia Basin Air Quality**

Eastern Washington and Oregon's Columbia Basin — a major agricultural region producing wheat, potatoes, hops, and orchard crops — experiences seasonal air quality degradation from agricultural field burning (particularly grass seed and wheat stubble), dust from dry farming operations, and pesticide drift. Exposure patterns differ from western Washington: dry climate, less mold, more dust and combustion particulates. The Washington Department of Ecology regulates agricultural burning under WAC 173-430, with burn bans triggered by meteorological conditions.

---

## Technology Selection Guide

The following guidance summarizes technology applicability by contaminant target. Specific product selection involves additional factors (room size, noise tolerance, energy cost, maintenance burden) not covered here.

### Selection by Primary Contaminant Concern

| Primary Concern | Recommended Technology | Notes |
|----------------|----------------------|-------|
| Particulate (PM2.5, allergens, mold spores) | HEPA filtration | Baseline recommendation; size unit appropriately to room CADR |
| VOCs and chemical odors | Activated carbon (paired with HEPA) | Carbon stage essential; replacement schedule based on VOC load |
| Biological pathogens (bacteria, viruses) | UV-C (in-duct or in-device); HEPA for larger particles | UV-C dose and lamp condition are critical variables |
| Mixed (particles + VOCs + biologicals) | Multi-stage: HEPA + activated carbon + UV-C | Addresses broadest contaminant spectrum |
| Sub-micron particles (ultrafine) | HEPA (designed for <0.3µm); nanofiber (emerging) | Standard HEPA efficiency drops below 0.3µm; some HEPA+ filters are optimized |
| Wildfire smoke events | HEPA purifier sized to room; seal envelope | PM2.5 dominates; carbon helps with smoke odor VOCs |
| Formaldehyde (new construction) | Potassium permanganate-impregnated carbon + HEPA | Standard carbon has limited formaldehyde uptake |

### Multi-Stage System Design

For environments requiring broad contaminant coverage, multi-stage designs sequentially address different pollutant classes:

1. **Pre-filter** — captures large particles, extending HEPA filter life
2. **HEPA stage** — removes fine particles, allergens, mold spores
3. **Activated carbon stage** — adsorbs VOCs and odors
4. **UV-C stage** — inactivates biological contaminants
5. *(Optional)* **Post-treatment** — ozone catalytic decomposition if upstream stage generates ozone

Sequencing matters: larger particle capture before HEPA extends filter life; UV-C after HEPA ensures biological contaminants are captured before UV exposure, improving inactivation efficiency.

---

## Cross-Module Links

**PFAS as an airborne contaminant:** PFAS compounds are associated primarily with water contamination (Module 02) and food packaging migration (Module 03), but research has also documented PFAS as airborne particles from consumer products and treated textiles. Air filtration with HEPA media may capture PFAS-containing particles; gas-phase PFAS is less characterized.

**Pesticide VOCs and indoor air:** Some pesticide formulations applied indoors or tracked in from outdoor use contribute to indoor VOC loads. The pesticide residue framework documented in Module 03 (Food Safety) includes compounds that may be relevant to indoor air quality in agricultural proximity settings.

**Water quality and humidifier aerosols:** Humidifiers aerosolize water, and dissolved minerals or biological contaminants in tap water can be dispersed as fine particles into indoor air. Module 02 (Water Filtration) covers water quality inputs that affect this pathway.

---

## Source References

All sources follow the quality standards defined in `00-sensitivity-protocol.md` and `00-source-index.md`.

| ID | Source | Year | Category |
|----|--------|------|---------|
| HEI-2024 | Health Effects Institute. *State of Global Air 2024* | 2024 | PRO |
| ALA-2025 | American Lung Association. *State of the Air 2025* | 2025 | PRO |
| WEF-2024 | World Economic Forum. *What causes indoor air pollution and how to tackle it* | November 2024 | PRO |
| LI-2024 | Li et al. Review of indoor air purifying technologies. *ACS EST Engineering*, 4(11), 2607–2630 | 2024 | PEER |
| SINGH-2024 | Singh et al. Review of indoor air purifying technologies. *Environmental Research* | 2024 | PEER |
| NIST-2025 | National Institute of Standards and Technology. *New Standard Test Method for Air Cleaner By-Products* | September 2025 | GOV |
| SN-2025 | Springer Nature. AI-driven innovations for air filtration | August 2025 | PEER |
| NASA-1989 | Wolverton, B.C. et al. *Interior Landscape Plants for Indoor Air Pollution Abatement*. NASA Technical Report | 1989 | GOV |

*Additional sources: American Society of Heating, Refrigerating and Air-Conditioning Engineers (ASHRAE) Standard 62.1 (referenced for ventilation rate framework); California Air Resources Board (CARB) certification program for ozone emission limits from air cleaning devices.*

---

*Module 1 of 6 | AWF Living Systems Research | Pacific Northwest Research Library*
*See also: 02-water-filtration.md | 03-food-safety.md*
