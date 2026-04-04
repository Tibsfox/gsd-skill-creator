# Lunar Helium-3 Mining -- From Regolith to Reactor

## Purpose

Document 11 established He-3's properties, terrestrial supply constraint, and critical applications. This document goes deep on the one supply source that could break the constraint: the Moon. It covers the resource itself, what extraction actually requires, who is building the technology, what it costs, when it could happen, and what it means for the PNW helium corridor described throughout this series.

The honest framing: lunar He-3 mining is no longer science fiction, but it is not yet engineering reality. It sits in the gap between prototype and production -- the gap where most ambitious programs die. The evidence for proceeding is stronger in 2026 than at any prior point. The evidence for caution is also strong.

## The Lunar He-3 Resource

### How He-3 Gets Into Regolith

The Sun emits a continuous stream of ionized particles -- the solar wind -- at velocities of 300-800 km/s. This plasma contains approximately 4% helium, of which roughly 1 in 2,500 atoms is He-3 (the rest is He-4). The solar wind He-3/He-4 ratio of approximately 4 x 10^-4 is orders of magnitude higher than Earth's crustal ratio (~10^-8) because solar helium preserves the primordial nucleosynthesis ratio rather than being dominated by radiogenic He-4.

The Moon has no magnetic field and essentially no atmosphere. Solar wind ions impact the lunar surface directly, burying themselves in the top few micrometers of regolith grain surfaces at energies of 1-4 keV per nucleon. Over billions of years of bombardment, the cumulative implantation has loaded the upper regolith with trapped volatiles -- hydrogen, helium-4, helium-3, neon, nitrogen, carbon compounds. The grains act as a solid-state trap: He-3 atoms lodge in lattice vacancies and crystal defects with high activation energies for diffusion, meaning they stay put until heated.

The process is slow and continuous. The solar wind flux at 1 AU is approximately 2-4 x 10^8 ions/cm^2/s. Over 4 billion years, this integrates to enormous cumulative doses. The regolith is simultaneously being churned by micrometeorite impacts (a process called "gardening"), which buries exposed grains and exposes fresh surfaces, distributing He-3 through the upper 2-3 meters of regolith rather than concentrating it in just the top millimeter.

### How Much Is There

Apollo sample measurements provide the ground truth. Concentrations vary significantly by location and soil maturity:

| Mission | Location Type | He-3 Concentration (ppb by mass) |
|---------|--------------|----------------------------------|
| Apollo 11 | Mare (Tranquility) | 15.1 |
| Apollo 12 | Mare (Oceanus Procellarum) | 7.1 |
| Apollo 14 | Mare (Fra Mauro) | 5.7 |
| Apollo 15 | Mare (Hadley Rille) | 4.4 |
| Apollo 16 | Highland (Descartes) | 1.4 |
| Apollo 17 | Mare (Taurus-Littrow) | 7.5 |

Conservative working estimates: 3 ppb for highlands, 6 ppb for maria, with localized enrichments up to 20-50 ppb in mature, high-titanium mare soils.

The mare-highlands disparity is not random. It reflects two factors. First, mare basalts are richer in ilmenite (FeTiO3), a titanium-iron oxide mineral that retains implanted helium more effectively than other lunar minerals. The crystal structure of ilmenite provides better trapping sites. Second, mare regions tend to have older, more mature regolith surfaces with longer cumulative solar wind exposure.

**Total lunar inventory:** The University of Wisconsin Fusion Technology Institute estimated approximately 1.1 million metric tonnes of He-3 in the top 3 meters of lunar regolith. Chang'E-1 microwave radiometer data refined this to approximately 6.6 x 10^8 kg (660,000 tonnes), with the nearside containing somewhat higher concentrations than the farside due to differences in mare coverage. Either estimate dwarfs terrestrial supply by a factor of 10^8 or more.

A 2024 study published in *Communications Earth & Environment* identified an additional reservoir: metallic iron nanoparticles within impact-generated glass contain helium at concentrations of 10-24 atoms/nm^3. These vesicular iron nanoparticles are widespread across mature lunar surfaces and may represent a significant helium reservoir not fully captured by bulk regolith concentration measurements.

### Distribution Is Not Uniform

He-3 concentration correlates with three measurable parameters: TiO2 content (proxy for ilmenite abundance), optical maturity (proxy for cumulative space weathering), and latitude (proxy for solar wind flux angle). The richest targets are mature, high-titanium mare soils at low to mid latitudes on the nearside -- essentially Oceanus Procellarum, Mare Tranquillitatis, and Mare Serenitatis.

Polar regions, despite their strategic importance for water ice, are poor He-3 targets. The oblique solar wind incidence angle at high latitudes reduces implantation rates. Permanently shadowed craters receive no solar wind at all.

## Extraction Technology

### The Process Chain

Extracting He-3 from lunar regolith is conceptually simple and engineeringly brutal. The full chain:

**1. Mining (excavation and transport).** Strip-mine the top 1-3 meters of regolith. This is the easiest step conceptually -- the material is loose, unconsolidated soil -- but the volumes are staggering. At 6 ppb average concentration and a regolith bulk density of approximately 1.5 g/cm^3, extracting 1 gram of He-3 requires processing approximately 150 tonnes of regolith. One kilogram requires 150,000 tonnes. The regolith must be excavated, transported to a processing unit, and the processed tailings returned to the surface.

**2. Beneficiation (size sorting).** Sieve regolith to isolate the fine fraction (<100 micrometers). He-3 concentrations are highest in fine grains because smaller particles have higher surface-area-to-volume ratios and thus higher implanted gas per unit mass. This step reduces the mass that must be heated by roughly 50%, a significant energy savings.

**3. Thermal extraction (heating).** Heat the sieved regolith to release trapped volatiles. Apollo sample thermal desorption experiments established that approximately 86% of He-3 is released by 700C. The remaining 14% requires temperatures up to 900-1000C, with diminishing returns. The 700C target represents the practical engineering optimum: high enough for most of the He-3, low enough to avoid sintering the regolith (which would clog the processing equipment).

The heating must occur in vacuum (the lunar surface obliges) using either solar concentrators or nuclear power. A 2021 NASA technical report (AIAA ASCEND) describes a recuperative moving-bed heat pipe heat exchanger: regolith flows through a heated pipe, volatiles are collected from the headspace, and outgoing hot regolith preheats incoming cold regolith to recover approximately 80% of the thermal energy. This recuperation is essential -- without it, the power requirements are prohibitive.

**4. Gas collection and separation.** The outgassed volatiles are a mixture: H2, He-4, He-3, N2, CO, CO2, H2S, and trace noble gases. He-3 must be separated from this mixture, which requires cryogenic distillation or membrane separation. The He-3/He-4 separation is the hardest step -- the isotopes differ by only one neutron and have nearly identical chemical properties. Cryogenic distillation exploiting the different boiling points (He-3: 3.19 K, He-4: 4.22 K) is the proven approach but requires extreme cryogenic infrastructure on the lunar surface.

**5. Storage and transport to Earth.** Purified He-3 is stored as compressed gas (the quantities are small enough -- kilograms per year initially -- that cryogenic liquid storage may not be necessary). Transport to Earth requires a lunar-to-orbit vehicle (ascent stage), orbital transfer, Earth reentry vehicle, and ground recovery. The mass of He-3 per shipment is trivially small relative to the vehicle mass -- the challenge is the infrastructure cost per mission, not the payload.

### Power Requirements

The dominant energy cost is heating regolith. To process 150 tonnes of regolith (yielding ~1 gram He-3):
- Specific heat of regolith: approximately 0.2 cal/g/C (840 J/kg/K)
- Temperature rise: approximately 680 K (from ~20C average to 700C)
- Energy per gram He-3 (no recuperation): 150,000 kg x 840 J/kg/K x 680 K = 85.7 GJ = 23.8 MWh
- With 80% recuperation: approximately 4.8 MWh per gram He-3

At 1 kg/year production rate (150,000 tonnes regolith/year), continuous operation requires approximately 550 kW of thermal power -- achievable with either a large solar concentrator array or a small fission reactor (NASA's Kilopower/KRUSTY design produces 10 kWe/40 kWt per unit; a cluster of 15-20 units could provide sufficient thermal energy).

### Equipment List (Minimum Viable Operation)

| System | Function | Mass Estimate | TRL |
|--------|----------|---------------|-----|
| Excavator/hauler | Mine and transport regolith | 2,000-5,000 kg | 4-5 |
| Sieve/classifier | Size-sort to <100 um | 200-500 kg | 3-4 |
| Thermal processor (heat exchanger) | Heat regolith to 700C | 3,000-8,000 kg | 3-4 |
| Gas collection manifold | Capture released volatiles | 200-500 kg | 4-5 |
| Cryogenic separation unit | Isolate He-3 from He-4 and other gases | 1,000-3,000 kg | 3 |
| Power system (solar or nuclear) | Provide 500+ kW thermal | 5,000-15,000 kg | 4-6 |
| Habitat/teleops station | Crew or autonomous operations | 5,000-10,000 kg | 5-6 |
| **Total landed mass** | | **16,000-42,000 kg** | |

At current launch costs of $50,000-$100,000 per kg to lunar surface (Starship-class), delivering this equipment costs $800M-$4.2B before a single gram of He-3 is produced. This is the central economic challenge.

## Companies and Programs

### Interlune (Seattle, WA)

The most advanced private lunar He-3 company. Founded 2022 by Rob Meyerson (former Blue Origin president) and Gary Lai (former New Shepard chief architect). Headquarters: Seattle.

**Funding and contracts (as of early 2026):**
- ~$20 million total equity funding plus government contracts (~28 employees)
- $300M+ supply agreement with Bluefors (September 2025) -- up to 10,000 liters He-3 annually, 2028-2037. This is the largest purchase agreement for an extraterrestrial resource ever signed.
- DOE has agreed to purchase 3 liters of lunar He-3 no later than April 2029
- $1.25 million AFWERX Direct-to-Phase II SBIR contract (November 2025) -- developing cryogenic He-3 separation technology to increase near-term supply while lunar infrastructure is built
- NASA STTR Phase I contract ($150K, 2026) -- the SILT (Scalable Implement for Lunar Trenching) excavator project with Colorado School of Mines

**Technology milestones:**
- Full-scale prototype excavator built in partnership with Vermeer Corporation (Iowa), demonstrated at 100 metric tons/hour regolith processing rate
- Multispectral camera developed with NASA Ames Research Center for lunar surface He-3 prospecting -- could fly as early as 2026
- SILT excavator Phase I work completing mid-2026

**Stated timeline:**
- 2027: Lunar demonstration mission (prospecting, sample extraction, and return)
- 2029: Pilot plant on the Moon
- 2028-2037: Bluefors deliveries (implies operational extraction by ~2028-2029)

**Honest assessment:** The 2028 delivery commitment to Bluefors is aggressive. It requires a successful demonstration mission in 2027, rapid scale-up in 2028, and cryogenic separation capability on the lunar surface -- all within a ~$20M funding base that will need to grow by at least 100x. The Bluefors agreement is structured as a purchase commitment, not a prepayment -- it validates market demand but does not fully fund the infrastructure. Additional funding rounds of $500M+ will be necessary. The team (Blue Origin alumni, Vermeer partnership, NASA/DOD contracts) is credible. The timeline is aspirational.

### China's Chang'e Program

China is the only nation besides the US to have returned lunar samples with measured He-3 content. The Beijing Research Institute of Uranium Geology has analyzed Chang'e-5 samples (returned December 2020 from Oceanus Procellarum) to determine He-3 content and optimal extraction parameters. Chang'e-6 (June 2024) returned the first samples from the lunar farside (South Pole-Aitken basin) -- He-3 analysis is underway but results not yet published.

Ouyang Ziyuan, chief scientist of China's Lunar Exploration Program, has stated the Moon's He-3 could "solve humanity's energy demand for around 10,000 years." China is studying a joint Russia-China lunar research station at the Moon's South Pole by 2035, with resource utilization as a stated objective. China has also proposed a magnetic launcher concept for returning extracted resources from the lunar surface.

China's program is state-funded with effectively unlimited patience. It does not need to close a business case the way Interlune does. This is both its strength (long-term commitment) and its weakness (no market discipline on timeline or efficiency).

### ispace (Tokyo, Japan)

ispace, the Japanese lunar transportation company, has partnered with Magna Petra for He-3 exploration. Mission 2 (RESILIENCE lander, launched 2025) carries a micro rover for regolith sample collection. Mission 3 (APEX 1.0, targeting 2026) and Mission 6 (Series 3 lander, targeting 2027) extend the capability toward resource prospecting. ispace's approach is platform-based: providing landing and surface access services to resource companies rather than doing the extraction itself.

### NASA Artemis and ESA Argonaut

NASA's Artemis program is not specifically an He-3 program, but it provides the transportation infrastructure (SLS/Orion, Gateway, Human Landing System via Starship) that makes lunar surface operations possible. Artemis III (crewed landing) has been repeatedly delayed; current target is 2026-2027. ESA's Argonaut programme is developing a European lunar lander for cargo delivery.

Neither agency has an He-3 extraction program per se. They provide the enabling infrastructure -- landing capability, surface habitation, power systems -- that commercial He-3 operators like Interlune would leverage.

### ISRO

India's Chandrayaan program has conducted orbital remote sensing relevant to He-3 prospecting (mineral mapping, surface maturity assessment) but has no announced He-3 extraction program.

## Economics

### Cost Per Gram Delivered to Earth

The delivered cost of lunar He-3 depends entirely on scale and transportation costs:

| Scenario | Regolith Processed (tonnes/yr) | He-3 Produced (kg/yr) | Estimated Cost/gram | Assumptions |
|----------|-------------------------------|----------------------|--------------------|-|
| Pilot (2029-2032) | 150,000 | ~1 | $50,000-$500,000 | Amortized infrastructure over 5 years, high transport cost |
| Early commercial (2032-2036) | 1,500,000 | ~10 | $5,000-$50,000 | Reduced launch costs, equipment reuse |
| Mature (2036+) | 15,000,000 | ~100 | $1,000-$5,000 | Starship-class costs realized, autonomous operations |

**Comparison to terrestrial He-3:** $2,000-$3,500 per liter STP. One liter of He-3 gas at STP weighs approximately 0.134 grams. So terrestrial He-3 costs approximately $15,000-$26,000 per gram ($15-26M per kilogram). At mature-phase lunar costs of $1,000-$5,000 per gram, lunar He-3 would be cheaper than terrestrial. At pilot-phase costs, it would be dramatically more expensive. The crossover depends on achieving the scale that the economic models assume.

### Total Addressable Market

| Application | Annual He-3 Demand (2026) | Projected Demand (2036) | Price Sensitivity |
|-------------|--------------------------|------------------------|------------------|
| Dilution refrigerators (quantum computing) | 5,000-10,000 liters (~700-1,300 g) | 20,000-100,000 liters (~2.7-13.4 kg) | Low (small fraction of refrigerator cost) |
| Neutron detection | 5,000-10,000 liters (~700-1,300 g) | 5,000-15,000 liters (~700-2,000 g) | Medium (alternatives exist) |
| Medical imaging | 1,000-3,000 liters (~130-400 g) | 500-2,000 liters (~70-270 g) | High (Xe-129 substitution) |
| Fusion energy (D-He3) | 0 | 0-100 kg (if demonstration reactor built) | N/A (no market yet) |
| **Total (non-fusion)** | **~1.5-3.0 kg/year** | **~3.5-16 kg/year** | |

The near-term market (quantum computing + neutron detection) is approximately 1.5-3 kg/year at $15-26M/kg = $22-78M/year. This is the market Interlune is targeting. It is real but small. The fusion market -- potentially thousands of kg/year -- does not yet exist and depends on physics that has not been demonstrated.

### Minimum Viable Operation

The Bluefors contract (10,000 liters/year = ~1.34 kg/year) at approximately $30M/year revenue sets the floor. To justify the infrastructure investment ($1-5B), Interlune needs either this contract at very low operating costs (unlikely in the pilot phase) or additional customers and higher volume. The minimum viable operation is probably 5-10 kg/year at $15-20M/kg, generating $75-200M/year revenue -- enough to service the capital investment over a 10-20 year horizon.

## Fusion Energy Connection

### State of D-He3 Fusion Science

D-He3 fusion requires approximately 600-800 million degrees Celsius (50-70 keV ion temperature) -- six times hotter than D-T fusion. No facility has demonstrated net energy from D-He3. The reaction rate peaks at ~200 keV, but useful reaction rates occur in the 50-70 keV range.

**Helion Energy** (Everett, WA -- another PNW company) is the most prominent D-He3 fusion developer. Their 7th-generation Polaris prototype reached 150 million degrees C in February 2026, making it the first privately funded machine to achieve this temperature -- a necessary stepping stone to D-He3. Helion's approach is field-reversed configuration (FRC) with pulsed magnetic compression and direct electricity extraction from expanding plasma. They have a power purchase agreement with Microsoft. Orion commercial plant construction began July 2025 in Malaga, WA, targeting 50+ MW by 2028 under the PPA with Microsoft. However, Polaris has not yet demonstrated net electricity production, and the 150M degree C achievement is still a factor of 4-5x below D-He3 requirements.

**Honest assessment of D-He3 fusion timeline:** D-T fusion (the easier reaction) has not yet achieved sustained commercial power generation despite 70 years of research and $50B+ cumulative investment. D-He3 fusion is at least one generation behind -- plausibly 20-30 years from a pilot plant, 30-50 years from commercial deployment, if ever. The physics is not guaranteed to close.

### Fuel Requirements

A 1 GW D-He3 fusion plant would consume approximately 100-150 kg of He-3 per year. A global fusion economy (1,000 GW, replacing a significant fraction of fossil generation) would require 100,000-150,000 kg/year. Terrestrial supply (~7-10 kg/year from tritium decay) cannot support even a single reactor. Lunar supply (potentially thousands of kg/year at scale) could support dozens to hundreds of reactors. The lunar resource is necessary for a D-He3 fusion economy. There is no terrestrial alternative at scale.

## Timeline Assessment

### Technology Gates

1. **Lunar landing reliability** (2026-2028): Starship HLS, commercial landers (ispace, Astrobotic, Intuitive Machines) must demonstrate reliable cargo delivery to the lunar surface.
2. **Regolith thermal processing demonstration** (2027-2029): Prove that a thermal processor can operate in lunar vacuum, process regolith at scale, and collect volatiles. This has never been done on the Moon.
3. **Cryogenic He-3/He-4 separation on the Moon** (2029-2033): The hardest technical step. Requires operating a cryogenic distillation column at 3-4 Kelvin on the lunar surface with no maintenance access.
4. **Return logistics** (2029-2033): Routine, low-cost Earth-return of small He-3 payloads.
5. **Autonomous operations** (2033+): Mining at the required scale (millions of tonnes/year) cannot be supervised by crew in real-time. Autonomous or teleoperated mining with minimal human intervention is required.

### 10-Year Outlook (2026-2036)

Realistic best case: Interlune or a comparable program demonstrates extraction on the Moon by 2029-2031, delivers first commercial quantities (1-5 kg/year) by 2032-2035, at costs significantly above terrestrial He-3 prices. The operation is subsidized by defense contracts, scientific interest, and strategic positioning rather than pure economics. Lunar He-3 remains a minor supplement to terrestrial supply, not a replacement.

Probable case: Demonstration missions slip to 2030-2033. Commercial delivery begins late 2030s. The program survives on government contracts and patient capital.

Downside case: Technical failures (thermal processing doesn't scale, cryogenic separation doesn't work in lunar environment, launch costs don't decrease as projected) push commercial viability beyond 2040.

### 20-Year Outlook (2026-2046)

If D-He3 fusion demonstrates net energy by 2035-2040 (a big if), the demand signal transforms from kilograms to tonnes per year, fundamentally changing the economics. Lunar He-3 mining at scale (100+ kg/year) becomes viable and possibly inevitable. Multiple nations (US, China, possibly Japan/India) operate extraction facilities.

If D-He3 fusion does not materialize, lunar He-3 mining serves a niche market (quantum computing, neutron detection) of 10-50 kg/year -- economically viable at mature costs but not transformative.

## PNW Connection

The Pacific Northwest is uniquely positioned in the lunar He-3 value chain:

**Interlune headquarters: Seattle.** The company developing the extraction technology, employing cryogenic engineers, space systems engineers, and mining engineers drawn from the PNW's aerospace workforce (Blue Origin in Kent, SpaceX satellite office in Redmond, UW aerospace engineering).

**Helion Energy: Everett, WA.** The company building the D-He3 fusion reactor that would be the largest He-3 consumer if successful. Helion's Orion commercial plant began construction in July 2025 in Malaga, WA (eastern Washington), targeting 50+ MW by 2028. A functioning Helion reactor would transform He-3 from a niche cryogenic commodity into a primary energy fuel.

**PNNL: Richland, WA.** The national laboratory with the most expertise in He-3 neutron detection, He-3 alternatives, and isotope handling. PNNL's gas separation and cryogenic capabilities are directly relevant to processing lunar-derived He-3. If lunar He-3 arrives at a PNW port, PNNL is the natural partner for quality assurance, isotope verification, and distribution logistics.

**Microsoft Quantum: Redmond, WA.** Major He-3 consumer for dilution refrigerators. Microsoft's topological qubit program requires the coldest temperatures achievable -- and those temperatures require He-3.

**University of Washington:** CENPA (Center for Experimental Nuclear Physics and Astrophysics) operates He-3-dependent instruments. UW's Earth and Space Sciences department has lunar sample analysis capability.

**Blue Origin: Kent, WA.** Provides launch vehicle capability (New Glenn, and eventually Blue Moon lander) that could transport He-3 extraction equipment to the Moon or return He-3 to Earth.

The PNW helium corridor described in Documents 7, 18, and 19 is focused on He-4 (bulk helium for semiconductors, hospitals, and industry). But the same geographic concentration that makes the PNW an efficient hub for He-4 distribution -- proximity to consumers, hydroelectric power for cryogenics, port access for import/export -- makes it the natural receiving and distribution point for lunar He-3. If Interlune succeeds, lunar He-3 enters the terrestrial supply chain in Seattle and reaches its highest-value customers (Microsoft Quantum, PNNL, UW) within the same metropolitan area. No other region combines the extraction company, the fusion company, the national laboratory, and the quantum computing customers within a 200-mile radius.

## Cross-Reference Summary

This document extends and deepens:
- **Document 11 (Helium-3):** The isotope's properties, terrestrial supply, and applications -- this document adds the lunar supply dimension.
- **Document 7 (I-5 Corridor):** The PNW as a helium processing hub -- this document adds the lunar import pathway.
- **Document 9 (Economics):** Cost analysis for terrestrial helium -- this document provides the lunar cost comparison.
- **Document 18 (Hub Design):** Physical infrastructure for helium processing -- a future facility might include He-3 receiving and distribution.
- **Document 23 (Financial Model):** Co-op economics -- lunar He-3 as a potential premium product line for a PNW helium cooperative (long-term).

## The Bottom Line

Lunar He-3 mining is closer to reality than at any point in history. Interlune has a prototype excavator, a $300M customer contract, government funding, and a credible team. China has returned lunar samples and is analyzing He-3 extraction parameters. The market (quantum computing) is real and growing.

But "closer to reality" is not "real." The technology readiness is at TRL 3-5 for most systems. The economics require launch costs to decrease by 10-100x from 2020 levels (SpaceX Starship is the bet). The cryogenic separation challenge on the lunar surface has no demonstrated solution. The timeline is probably a decade longer than Interlune's public statements suggest.

The most likely path: Interlune demonstrates extraction on the Moon by 2030-2033, delivers first commercial He-3 by 2033-2036, reaches economic viability for the quantum computing market by the late 2030s, and achieves the scale needed for fusion fuel (if fusion works) by the 2040s. This is not the timeline that makes investors excited. It is the timeline that the physics and engineering support.

For the PNW helium corridor, the implication is clear: plan for terrestrial He-3 supply for the next 10-15 years (Document 11's constraint remains binding), but watch Interlune. If they succeed, the PNW becomes not just a helium processing hub but the entry point for an extraterrestrial supply chain. That is worth paying attention to.
