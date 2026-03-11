# HVAC & Heat Pump Systems

> **Module ID:** A (Cross-reference prefix: A-xxx)
> **Domain:** Thermal Energy -- Heating, Ventilation, and Air Conditioning
> **Through-line:** *A heat pump is a refrigerator pointed the other way.* The thermodynamic cycle is the same one Willis Carrier commercialized in 1902 and the same one keeping your groceries cold right now. What changed is the engineering: variable-speed compressors, low-GWP refrigerants, cold-climate performance down to -15F, and grid-interactive controls that let a building become a thermal battery. The physics has not changed. The execution has.

---

## Table of Contents

1. [Thermodynamic Principles](#1-thermodynamic-principles)
2. [Performance Metrics](#2-performance-metrics)
3. [Heat Pump Types and Architecture](#3-heat-pump-types-and-architecture)
4. [Variable-Speed and Inverter Technology](#4-variable-speed-and-inverter-technology)
5. [Global Deployment and Market Context](#5-global-deployment-and-market-context)
6. [Refrigerant Transition](#6-refrigerant-transition)
7. [Cold-Climate Performance](#7-cold-climate-performance)
8. [Grid Interaction and Demand Response](#8-grid-interaction-and-demand-response)
9. [Building Envelope Coupling](#9-building-envelope-coupling)
10. [PNW-Specific Context](#10-pnw-specific-context)
11. [System Sizing and Design Considerations](#11-system-sizing-and-design-considerations)
12. [Maintenance and Lifecycle](#12-maintenance-and-lifecycle)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Thermodynamic Principles

### 1.1 The Vapor-Compression Cycle

Every heat pump, every refrigerator, every air conditioner, and every freezer in the world operates on the same thermodynamic principle: the vapor-compression cycle. The cycle exploits the fact that a fluid absorbs heat when it evaporates and releases heat when it condenses. By mechanically compressing and expanding a refrigerant in a closed loop, the system moves thermal energy from a cold reservoir to a hot reservoir -- the opposite direction from what happens naturally.

The cycle has four stages:

1. **Evaporation.** Liquid refrigerant enters the evaporator coil at low pressure. It absorbs heat from the surrounding environment (outdoor air, ground loop fluid, or exhaust air) and boils into a low-pressure gas. The evaporator temperature is lower than the heat source, so thermal energy flows into the refrigerant.

2. **Compression.** The low-pressure gas enters the compressor, which does mechanical work on it. The gas pressure and temperature rise substantially. In a modern residential heat pump, discharge temperatures from the compressor commonly reach 150-180F (65-82C). The compressor is the component that consumes electrical energy -- it is the "input" side of the efficiency equation.

3. **Condensation.** The high-pressure, high-temperature gas enters the condenser coil inside the building. Because the refrigerant is now hotter than the indoor air (or the hydronic loop), it releases its thermal energy into the building and condenses back into a high-pressure liquid.

4. **Expansion.** The high-pressure liquid passes through an expansion valve (also called a metering device or throttling valve), which drops its pressure rapidly. The refrigerant becomes a cold, low-pressure mixture of liquid and vapor, ready to re-enter the evaporator and repeat the cycle.

In cooling mode, the cycle reverses direction via a reversing valve. The indoor coil becomes the evaporator (absorbing heat from the room), and the outdoor coil becomes the condenser (rejecting heat to the outside). This is why a heat pump can both heat and cool -- it is the same cycle, run in either direction.

### 1.2 The Second Law and Carnot Limits

The second law of thermodynamics states that heat flows spontaneously only from hot to cold. A heat pump moves heat against this natural gradient, which requires work input. The theoretical maximum efficiency of this process is bounded by the Carnot coefficient of performance:

```
COP_Carnot = T_hot / (T_hot - T_cold)
```

where temperatures are in Kelvin. For a heat pump delivering heat at 40C (313 K) from an outdoor source at 0C (273 K):

```
COP_Carnot = 313 / (313 - 273) = 313 / 40 = 7.83
```

Real heat pumps achieve 40-60% of Carnot efficiency due to irreversibilities in the compressor, heat exchangers, and refrigerant flow. This still yields COP values of 3 to 5 for commercial systems under rated conditions (IEA-HP). The key insight: a heat pump delivering a COP of 4 produces four units of heat for every one unit of electricity consumed. Three of those four units are "free" -- extracted from the ambient environment.

### 1.3 Heat Sources and Sinks

The efficiency of a heat pump depends heavily on the temperature difference between the source (where heat is extracted) and the sink (where heat is delivered). Smaller temperature lifts mean higher COP. This is why ground-source systems, which draw from a stable 45-55F (7-13C) earth temperature year-round, outperform air-source systems in extreme cold, where outdoor air temperatures may drop below 0F (-18C).

| Heat Source | Typical Temperature Range | Stability | Installation Cost |
|------------|--------------------------|-----------|------------------|
| Outdoor air | -15F to 115F (-26C to 46C) | Highly variable by season | Lowest |
| Ground (horizontal loop) | 45-55F (7-13C) at 4-6 ft depth | Very stable year-round | Moderate |
| Ground (vertical bore) | 50-60F (10-16C) at 150-400 ft depth | Extremely stable | Highest |
| Groundwater (open loop) | 45-60F (7-16C) depending on aquifer | Stable | Moderate (requires well) |
| Exhaust air (ventilation) | 65-75F (18-24C) | Stable during occupancy | Low (ducting only) |
| Wastewater / sewage | 50-70F (10-21C) | Moderately stable | Moderate-high |

---

## 2. Performance Metrics

### 2.1 COP -- Coefficient of Performance

COP is the instantaneous ratio of useful thermal output to electrical input:

```
COP = Q_delivered / W_electrical
```

where Q_delivered is the heat energy transferred to (or from) the conditioned space and W_electrical is the electrical energy consumed by the compressor, fans, pumps, and controls. A COP of 4.0 means the system delivers 4 kWh of heating for every 1 kWh of electricity consumed.

COP varies with operating conditions. The same heat pump will have a COP of 4.5 at 47F outdoor temperature and a COP of 2.5 at 5F. This is not a deficiency -- it is physics. As the temperature lift increases, more compressor work is required per unit of delivered heat.

IEA reports COP values of 3 to 5 for commercial heat pumps under standard rating conditions (IEA-HP). These figures represent a weighted average across a range of operating points, not peak or minimum performance.

### 2.2 HSPF and HSPF2 -- Heating Seasonal Performance Factor

HSPF measures heating efficiency across an entire heating season, accounting for the full range of outdoor temperatures the system encounters. It is expressed in BTU per watt-hour:

```
HSPF = Total seasonal heating output (BTU) / Total seasonal electrical input (Wh)
```

HSPF2 is the updated metric adopted by the U.S. Department of Energy in January 2023, using a revised testing procedure (Appendix M1) that better reflects real-world conditions including defrost cycles and standby power. HSPF2 values are typically 10-15% lower than HSPF for the same equipment because the test conditions are more demanding (DOE-WHR).

| Rating | Minimum (Federal) | ENERGY STAR | ENERGY STAR Most Efficient 2025 |
|--------|-------------------|-------------|--------------------------------|
| HSPF2 | 7.5 | 8.1+ | Varies by climate zone |
| SEER2 | 15.0 (split) | 15.2+ | Varies by system type |
| COP at 5F | Not required | Not required | >= 1.75 (cold-climate) |

Source: EPA-ESTAR

### 2.3 SEER and SEER2 -- Seasonal Energy Efficiency Ratio

SEER measures cooling efficiency across a cooling season, expressed in BTU per watt-hour. SEER2 uses updated testing procedures (M1 testing) with higher external static pressure to simulate real-world duct conditions. SEER2 values are approximately 5% lower than SEER for the same equipment.

A SEER2 of 20 means the system delivers 20 BTU of cooling per watt-hour consumed over the season. Higher SEER2 indicates better cooling efficiency.

### 2.4 EER -- Energy Efficiency Ratio

EER measures cooling efficiency at a single operating point (95F outdoor, 80F indoor dry bulb, 67F wet bulb). Unlike SEER, EER captures performance at peak load conditions -- the hottest afternoon when the grid is most stressed. Systems with high SEER but low EER may perform well on average but struggle during heat waves.

### 2.5 ENERGY STAR Most Efficient 2025 -- Cold-Climate Criteria

The EPA ENERGY STAR Most Efficient 2025 designation establishes performance floors for cold-climate heat pumps that go beyond standard ENERGY STAR requirements (EPA-ESTAR):

- **Minimum COP at 5F (-15C):** >= 1.75
- **Heating capacity retention at 5F relative to 47F:** >= 70%
- **Compressor type:** Variable-speed (inverter-driven) required

These criteria reflect the recognition that cold-climate performance is the limiting factor for heat pump adoption in northern states. A COP of 1.75 at 5F means the heat pump still delivers 1.75 units of heat per unit of electricity consumed even at cold extremes -- substantially better than electric resistance heating (COP = 1.0) and competitive with gas furnaces on a primary energy basis when the grid contains significant renewable or nuclear generation.

The capacity retention metric is equally important. A heat pump rated at 48,000 BTU/h at 47F that retains 70% capacity at 5F still delivers 33,600 BTU/h -- enough to heat many well-insulated homes without supplemental resistance heat. Systems that lose more than 30% of their rated capacity at 5F require either oversizing (reducing cooling efficiency) or supplemental heating (reducing seasonal efficiency).

### 2.6 Converting Between Metrics

| Conversion | Formula |
|-----------|---------|
| COP to EER | EER = COP x 3.412 |
| EER to COP | COP = EER / 3.412 |
| HSPF to COP (seasonal avg) | COP_seasonal = HSPF / 3.412 |
| SEER to EER (rough) | EER ~ SEER x 0.875 (approximate) |

These conversions are useful for comparing equipment rated under different standards or for converting between SI and imperial units. The factor 3.412 is the number of BTU in one watt-hour.

---

## 3. Heat Pump Types and Architecture

### 3.1 Air-Source Heat Pumps (ASHP)

Air-source heat pumps are the most widely deployed type globally, accounting for the vast majority of installations due to lower cost and simpler installation requirements (IEA-HP). They extract heat from outdoor air in heating mode and reject heat to outdoor air in cooling mode.

**Advantages:**
- Lowest installation cost ($3,500-$7,500 for residential ducted systems, before incentives)
- No ground loop, well, or excavation required
- Suitable for most building types and lot sizes
- Mature technology with wide product availability
- Dual-mode: heating and cooling from a single system

**Limitations:**
- COP degrades as outdoor temperature drops (physics, not design flaw)
- Outdoor unit requires defrost cycles in cold, humid conditions
- Fan noise from outdoor unit (25-55 dBA depending on model and speed)
- Peak heating demand coincides with lowest COP -- exactly when the grid is most stressed

**Configuration types:**

| Configuration | Description | Best For |
|--------------|-------------|----------|
| Ducted split | Outdoor unit + indoor air handler with ductwork | Homes with existing duct systems |
| Ductless mini-split | Outdoor unit + wall/ceiling cassette(s) | Room-by-room zoning, retrofits, additions |
| Multi-split | One outdoor unit serving 2-8 indoor heads | Multi-room zoning without ductwork |
| Packaged / rooftop | All components in a single outdoor unit | Commercial buildings, flat-roof installations |

### 3.2 Ground-Source Heat Pumps (GSHP)

Ground-source (geothermal) heat pumps exchange heat with the earth rather than outdoor air. The earth below the frost line maintains a relatively stable temperature year-round -- typically 45-60F (7-16C) in the Pacific Northwest -- which provides a much more favorable heat source in winter and heat sink in summer compared to ambient air.

**Performance comparison to air-source:**

| Metric | Air-Source (at 17F) | Ground-Source (at 17F outdoor) |
|--------|---------------------|-------------------------------|
| Heating COP | 2.0-2.8 | 3.0-4.5 |
| Source temperature | 17F (-8C) ambient | 45-55F (7-13C) ground |
| Temperature lift | ~83F to reach 100F delivery | ~45-55F to reach 100F delivery |
| Capacity derating | Significant | Negligible |
| Defrost cycles needed | Yes | No |

Sources: IEA-HP, EPA-ESTAR

**Ground loop configurations:**

- **Horizontal closed loop:** Polyethylene pipe buried 4-6 feet deep in trenches. Requires 1,500-3,000 square feet of land per ton of capacity. Most cost-effective where land is available.
- **Vertical closed loop:** Pipe inserted into boreholes 150-400 feet deep. Requires minimal surface area but higher drilling cost. Necessary where lot size is limited.
- **Open loop (groundwater):** Pumps groundwater from a supply well through the heat exchanger, then returns it to a discharge well or surface water. Highest efficiency but requires adequate aquifer yield and water quality. Subject to local groundwater regulations.
- **Pond/lake loop:** Submerged coils in a body of water. Requires a sufficiently large and deep water body that does not freeze to the bottom.

**Installation costs** for ground-source systems run $15,000-$35,000 for residential applications, 3-5 times the cost of air-source equipment, with the ground loop accounting for the majority of the premium. Payback periods vary from 5-15 years depending on climate, energy prices, and the system being replaced (WEF-HP).

### 3.3 Water-Source and Hybrid Systems

Water-source heat pumps use a water loop as the intermediate heat exchange medium. In commercial buildings, a central water loop serves multiple zones, each with its own water-source heat pump. Zones that need cooling reject heat to the loop; zones that need heating extract heat from the loop. When the building has simultaneous heating and cooling loads (common in large commercial buildings), the loop acts as an internal energy recycling system.

Hybrid systems combine an air-source heat pump with a fossil fuel backup (typically natural gas). The heat pump handles heating down to a preset outdoor temperature (the "balance point"), and the gas furnace takes over below that temperature. This approach captures most of the heat pump's efficiency advantage during mild weather while avoiding the COP penalty at extreme cold. Hybrid systems are a transitional strategy -- they reduce but do not eliminate fossil fuel consumption.

### 3.4 Air-to-Water Heat Pumps

Air-to-water heat pumps extract heat from outdoor air (like a standard ASHP) but deliver it to a hydronic distribution system -- radiant floors, radiators, or fan coils -- rather than forced air. These systems are dominant in European markets and are gaining traction in North America for several reasons:

- Hydronic distribution operates at lower supply temperatures (90-120F for radiant floor vs. 120-140F for forced air), which allows the heat pump to operate at a smaller temperature lift and higher COP
- Radiant floor heating delivers superior thermal comfort at lower air temperatures
- The water buffer tank provides built-in thermal storage for demand response
- Compatible with domestic hot water production via the same heat pump

---

## 4. Variable-Speed and Inverter Technology

### 4.1 Why Variable Speed Matters

Traditional heat pumps use single-speed or two-speed compressors that cycle on and off to maintain temperature. At part-load conditions (which represent the majority of operating hours), these systems overshoot, undershoot, and consume energy during startup transients. Each on-off cycle subjects the compressor to inrush current, mechanical stress, and a brief period of low-efficiency operation as pressures equalize.

Variable-speed (inverter-driven) compressors adjust their speed continuously to match the building's thermal load. When the building needs 30% of rated capacity, the compressor runs at 30% speed. When it needs 80%, the compressor runs at 80%. The system rarely cycles off entirely.

The efficiency gains from variable-speed operation are substantial:

| Operating Mode | Single-Speed Behavior | Variable-Speed Behavior |
|---------------|----------------------|------------------------|
| Mild weather (30% load) | Cycles on/off frequently | Runs continuously at low speed, highest COP |
| Moderate weather (60% load) | Long on-cycles, some off-time | Runs at moderate speed, high COP |
| Design day (100% load) | Runs continuously at full speed | Runs at full speed, same as single-speed |
| Sub-design conditions | Runs continuously, may not meet load | Can boost to 120%+ capacity briefly |

The part-load advantage is where variable-speed systems excel. Because COP is highest when the compressor runs at lower speeds (less superheat, better heat exchanger utilization, lower friction losses), and because buildings spend most of their hours below design load, the seasonal efficiency of a variable-speed system is significantly higher than its rated COP at any single operating point.

### 4.2 Inverter Drive Technology

An inverter drive converts the incoming AC power to DC, then synthesizes variable-frequency AC to drive the compressor motor. By varying the frequency, the drive controls motor speed. Modern inverter drives use insulated-gate bipolar transistors (IGBTs) or silicon carbide (SiC) MOSFETs for power switching.

Key technical characteristics:

- **Speed range:** Typically 15-120 Hz (compared to fixed 60 Hz for single-speed). Some systems extend to 150 Hz for boost mode.
- **Modulation range:** 20-120% of rated capacity in many current models
- **Soft start:** Eliminates the 5-8x inrush current of direct-on-line starting, reducing electrical stress and allowing operation on smaller circuit breakers
- **Power factor:** Near unity (0.95-0.99) due to active power factor correction in the drive
- **Harmonic content:** Modern drives include harmonic filtering to meet IEEE 519 limits

### 4.3 Electronic Expansion Valves (EEV)

Variable-speed compressors are paired with electronic expansion valves rather than traditional thermostatic expansion valves (TXVs). An EEV uses a stepper motor to precisely control refrigerant flow based on sensor feedback from multiple points in the system -- evaporator superheat, condenser subcooling, compressor discharge temperature, and suction pressure.

The EEV allows the system to optimize refrigerant charge distribution across the full speed range. At low compressor speeds, the TXV may not respond quickly enough to changing conditions, leading to liquid slugging or excessive superheat. The EEV adjusts in real time, maintaining optimal conditions across the entire operating envelope.

### 4.4 Enhanced Vapor Injection (EVI)

Enhanced vapor injection is a modification to the basic vapor-compression cycle that improves cold-climate performance. An additional heat exchanger (the "economizer") partially expands a portion of the liquid refrigerant, which cools the remaining liquid before it enters the main expansion valve. The flash gas from the economizer is injected into the compressor at an intermediate pressure port.

The result: the compressor handles two pressure ratios in series rather than one large ratio, reducing discharge temperature, improving volumetric efficiency, and increasing heating capacity at low ambient temperatures. EVI-equipped heat pumps can maintain 70-100% of rated capacity at 5F (-15C), compared to 50-65% for non-EVI systems (EPA-ESTAR).

---

## 5. Global Deployment and Market Context

### 5.1 Current Scale

Heat pumps currently provide approximately 10% of global space heating demand, with a total installed capacity of roughly 1,000 GW as of 2021 (IEA-HP). This represents a significant existing industrial base, but it also means that 90% of the world's buildings still rely on direct combustion (natural gas, oil, coal, biomass) or electric resistance heating.

The IEA Net Zero Emissions by 2050 Scenario projects installed heat pump capacity reaching 2,600 GW by 2030 -- a 2.6x increase from 2021 levels (IEA-HP). Meeting this target requires sustained annual growth rates of approximately 15-18% globally, with the steepest growth curves in Europe and North America where gas boiler replacement represents the largest addressable market.

### 5.2 Regional Deployment Patterns

| Region | Key Data Point | Source |
|--------|---------------|--------|
| Global | ~10% of space heating met by heat pumps (2021) | IEA-HP |
| Global | ~1,000 GW installed capacity (2021) | IEA-HP |
| Global | Projected 2,600 GW by 2030 (Net Zero Scenario) | IEA-HP |
| Global | Heat pump sales outpaced gas boiler sales by 30% in 2024 -- largest gap ever recorded | IEA-GER |
| China | ~30% of global heat pump installations | IEA-HP |
| Europe | 40% year-over-year sales growth in 2022 | EHPA |
| Norway | 632 heat pumps per 1,000 households -- highest saturation globally | EHPA |
| United States | ~18 million heat pumps installed (2023 estimate) | IEA-REN |
| Japan | Heat pumps provide >90% of residential space cooling, growing heating share | IEA-HP |

### 5.3 Market Dynamics and Drivers

The 2024 market signal is significant: heat pump sales outpaced gas boiler sales by 30%, the largest margin ever recorded (IEA-GER). This gap reflects multiple converging forces:

**Energy security.** Europe's 40% year-over-year growth in 2022 was catalyzed by the energy crisis following Russia's invasion of Ukraine. Natural gas prices spiked to 10-15x their historical average in European spot markets during 2022, making the operating cost advantage of heat pumps immediately visible to consumers and policymakers. While gas prices have partially normalized, the policy and investment momentum has persisted (EHPA).

**Regulatory push.** The European Union's REPowerEU plan targets 60 million heat pump installations by 2030. Several EU member states have enacted or proposed bans on new fossil fuel heating installations in new construction (Netherlands, Denmark, Norway already enforce such measures). In the United States, the Inflation Reduction Act (2022) provides federal tax credits up to $2,000 for heat pump installations and up to $8,000 for low-income households through the High-Efficiency Electric Home Rebate Act.

**Technology maturation.** Cold-climate heat pump performance has improved dramatically since 2015. Systems now available from multiple manufacturers maintain rated heating capacity down to 5F (-15C) and continue operating at reduced capacity to -15F (-26C) or below. This eliminates the historical objection that heat pumps "don't work" in cold climates.

**China's scale.** China represents approximately 30% of global heat pump installations, driven by district heating electrification in northern provinces and the dominant position of Chinese manufacturers (Midea, Gree, Haier) in the global supply chain (IEA-HP). Chinese manufacturing scale has driven component costs down globally.

### 5.4 Projected Impact

The IEA estimates that heat pumps could reduce global CO2 emissions by 500 million tonnes per year by 2030 if deployment follows the Net Zero Scenario trajectory (IEA-HP). This projection assumes:

- Replacement of fossil fuel heating systems (primarily natural gas and oil boilers)
- Grid decarbonization proceeding in parallel (heat pumps powered by fossil electricity reduce but do not eliminate emissions)
- Building envelope improvements that reduce total heating demand

MIT Technology Review named heat pumps one of the "10 Breakthrough Technologies of 2024," citing their potential to displace fossil fuel heating at scale with existing, commercially mature technology (MIT-HP). The World Economic Forum has documented the household-level economics: in many European markets, a heat pump reduces heating costs by 25-50% compared to a gas boiler, even at 2024 gas prices (WEF-HP).

### 5.5 Norway -- A Saturation Case Study

Norway's 632 heat pumps per 1,000 households represents the highest market penetration globally and provides a look at what mature adoption looks like (EHPA). Several factors enabled this:

- Electricity in Norway is nearly 100% hydroelectric, making electric heating effectively zero-carbon
- Historically high electricity taxes created an incentive for efficiency (heat pumps use 1/3 to 1/4 the electricity of resistance heaters)
- Government subsidy programs running since the early 2000s
- Cold climate makes the heating load large enough to justify the investment
- Widespread air-to-air mini-splits as the dominant form factor (lower cost, easier installation)

The Norwegian case demonstrates that heat pump adoption is not limited by technology or consumer acceptance -- it is limited by economics and policy. When the incentive structure aligns, adoption can reach near-universal levels within two decades.

---

## 6. Refrigerant Transition

### 6.1 The Problem with R-410A

R-410A has been the dominant refrigerant in residential and light commercial heat pumps since the early 2000s, when it replaced R-22 (which was phased out under the Montreal Protocol due to ozone depletion). R-410A does not deplete the ozone layer (ODP = 0), but it has a global warming potential (GWP) of approximately 2,088 -- meaning one kilogram of R-410A released to the atmosphere has the same warming effect as 2,088 kilograms of CO2 over a 100-year period (EPA-ESTAR).

Hydrofluorocarbons (HFCs) as a class contributed approximately 2.5% of global greenhouse gas emissions in 2019, and their atmospheric concentration has been growing at 10-15% per year due to increasing HVAC deployment worldwide (IEA-HP). Left unchecked, HFC emissions from the HVAC sector alone could add 0.3-0.5C to global warming by 2100.

### 6.2 Regulatory Timeline

The Kigali Amendment to the Montreal Protocol (2016, entered into force 2019) established a global HFC phase-down schedule. The United States ratified the Kigali Amendment in 2022 and enacted domestic implementation through the AIM Act (American Innovation and Manufacturing Act of 2020).

EPA regulations effective 2025-2026 restrict the use of R-410A in new equipment in favor of lower-GWP alternatives (EPA-ESTAR):

| Milestone | Year | Requirement |
|-----------|------|-------------|
| AIM Act baseline | 2020 | Established HFC production/consumption baseline |
| First phase-down step | 2024 | 40% reduction from baseline |
| New equipment restrictions | 2025-2026 | R-410A restricted in new residential/commercial AC and heat pump equipment |
| Second phase-down step | 2029 | 60% reduction from baseline |
| Third phase-down step | 2034 | 80% reduction from baseline |
| Final target | 2036 | 85% reduction from baseline |

### 6.3 Replacement Refrigerants

| Refrigerant | GWP (100-yr) | Flammability | ODP | Status |
|------------|-------------|-------------|-----|--------|
| R-410A | 2,088 | Non-flammable (A1) | 0 | Being phased down |
| R-32 | 675 | Mildly flammable (A2L) | 0 | Leading replacement for split systems |
| R-454B | 466 | Mildly flammable (A2L) | 0 | Carrier/Lennox preferred replacement |
| R-290 (propane) | 3 | Flammable (A3) | 0 | Growing in Europe, charge-limited |
| R-744 (CO2) | 1 | Non-flammable (A1) | 0 | Commercial/industrial, high pressure |
| R-717 (ammonia) | 0 | Toxic, mildly flammable (B2L) | 0 | Industrial, not residential |

Sources: EPA-ESTAR, IEA-HP

### 6.4 R-32 -- The Near-Term Transition

R-32 (difluoromethane, CH2F2) has emerged as the leading replacement for R-410A in split-system heat pumps and air conditioners. Its GWP of 675 represents a 68% reduction from R-410A. R-32 also has favorable thermodynamic properties: higher volumetric capacity means smaller compressors and refrigerant charges, and single-component composition simplifies recycling (R-410A is a 50/50 blend of R-32 and R-125, which complicates reclamation).

Daikin, the world's largest HVAC manufacturer by revenue, has been shipping R-32 equipment in Asian and European markets since 2012. As of 2024, Daikin began shipping R-32 residential equipment to six U.S. states including Washington and Oregon (IEA-HP). This is significant for the PNW market -- R-32 equipment is available now, not prospectively.

The main engineering consideration with R-32 is its A2L flammability classification ("mildly flammable" or "lower flammability"). A2L refrigerants have a burning velocity below 10 cm/s and require an ignition energy significantly higher than common A3 (flammable) refrigerants. Updated building codes (UL 60335-2-40, adopted 2023) and ASHRAE Standard 15 revisions accommodate A2L refrigerants with specific requirements for charge limits, leak detection, and equipment placement.

### 6.5 Natural Refrigerants -- Long-Term Direction

Natural refrigerants represent the lowest-GWP option and the likely long-term direction for the industry:

**CO2 (R-744)** operates in a transcritical cycle at pressures 5-10 times higher than conventional refrigerants (design pressure ~130 bar vs. ~25 bar for R-410A). This requires heavier, more expensive heat exchangers and compressors, but CO2 excels at producing high-temperature hot water (up to 194F / 90C) for domestic hot water and industrial process heat. CO2 heat pump water heaters (marketed as "Eco Cute" in Japan) have been deployed at scale in Japan since 2001, with millions of units installed. The high discharge temperature is a thermodynamic advantage for hot water production -- CO2 heat pumps achieve COP values of 3.0-4.5 for 140-160F water delivery (HOEG).

**Propane (R-290)** has a GWP of 3, near-zero climate impact, and excellent thermodynamic properties for heat pumping. European manufacturers are shipping R-290 monoblock heat pumps (all refrigerant contained in the outdoor unit, hydronic connection to the building) that comply with EU charge limits. The charge limit for R-290 in occupied spaces is typically 150 grams per circuit under IEC 60335-2-40, which restricts its use in split systems with indoor refrigerant lines. Monoblock designs sidestep this restriction by keeping all refrigerant outdoors.

**Ammonia (R-717)** has a GWP of 0 and is the most thermodynamically efficient common refrigerant, but its toxicity (B2L classification) restricts it to industrial applications with dedicated machine rooms, leak detection, and emergency ventilation. Ammonia has been the standard refrigerant in industrial refrigeration (cold storage, food processing, ice rinks) for over a century.

### 6.6 Refrigerant Charge Management

The climate impact of refrigerants depends not only on GWP but also on charge size and leak rate. A residential heat pump typically contains 5-15 pounds (2.3-6.8 kg) of refrigerant. Annual leak rates for well-maintained equipment are 2-5%, while poorly maintained or damaged systems can lose 10-30% per year.

Reducing climate impact from refrigerants involves three strategies:
1. **Lower GWP:** Switch to R-32, R-290, or R-744
2. **Smaller charges:** Microchannel heat exchangers and optimized system design reduce the required refrigerant charge by 20-40%
3. **Lower leak rates:** Brazed connections, factory-charged line sets, leak detection systems, and proper installation practices

---

## 7. Cold-Climate Performance

### 7.1 The Historical Objection

The perception that heat pumps "don't work in cold climates" was true for first-generation equipment. Early air-source heat pumps from the 1980s and 1990s used single-speed scroll compressors optimized for cooling, with heating as a secondary function. At temperatures below 20F (-7C), these systems lost 40-60% of their rated heating capacity and dropped to COP values of 1.5-2.0. Supplemental electric resistance heating -- effectively a built-in space heater at COP 1.0 -- was required for much of the heating season in northern climates.

This is no longer the case.

### 7.2 Current Cold-Climate Performance

Modern cold-climate heat pumps incorporate multiple technologies that dramatically improve low-temperature performance:

| Technology | Contribution |
|-----------|-------------|
| Variable-speed inverter compressor | Maintains capacity by increasing speed at low ambient |
| Enhanced vapor injection (EVI) | Injects flash gas at intermediate pressure, improving volumetric efficiency |
| Larger outdoor coils | Greater surface area for heat extraction at lower temperature differentials |
| Advanced defrost algorithms | Sensor-driven defrost (vs. timed) reduces energy waste and capacity loss |
| Low-temperature-optimized refrigerant blends | Wider operating envelope for evaporator temperatures |

The result, quantified across commercially available equipment:

| Outdoor Temperature | Typical COP (modern ccHP) | Capacity Retention vs. 47F |
|--------------------|--------------------------|---------------------------|
| 47F (8C) | 3.5-4.5 | 100% (rated condition) |
| 17F (-8C) | 2.5-3.5 | 75-90% |
| 5F (-15C) | 1.75-2.5 | 65-80% |
| -5F (-21C) | 1.4-2.0 | 50-70% |
| -15F (-26C) | 1.1-1.6 | 35-55% |
| -22F (-30C) | 0.9-1.3 | 25-40% (minimum operating limit for most models) |

Sources: EPA-ESTAR, IEA-HP, MIT-HP

Even at -15F, a cold-climate heat pump delivering a COP of 1.3 is still 30% more efficient than electric resistance heating. The crossover point where a heat pump becomes less efficient than a high-efficiency gas furnace (on a source energy basis) depends on the grid's carbon intensity and the cost ratio of electricity to gas -- not on the heat pump's absolute performance.

### 7.3 Defrost Cycles

When outdoor air temperature is near or below freezing and humidity is significant, moisture in the air freezes on the outdoor evaporator coil, forming frost. This frost acts as insulation, blocking airflow and reducing heat transfer. The system must periodically reverse its cycle to melt the frost -- running in cooling mode briefly to send hot refrigerant through the outdoor coil.

Defrost cycles consume energy and reduce net heating output. A poorly designed defrost strategy (e.g., timed defrost every 30 minutes regardless of frost accumulation) can reduce seasonal efficiency by 10-15%. Modern systems use demand defrost -- sensors measure coil temperature, air pressure drop across the coil, or both to trigger defrost only when needed. Some systems use hot-gas bypass rather than full cycle reversal to minimize comfort disruption.

In the PNW, the mild-but-damp winter climate means frost formation is a common operating condition from November through March. Coastal areas (Seattle, Portland, Olympia) rarely see temperatures below 20F, but relative humidity is frequently above 80%. This combination produces moderate frost accumulation that well-designed demand defrost handles effectively.

### 7.4 Supplemental Heating Strategies

Even with modern cold-climate heat pumps, there are design conditions where the heat pump alone may not meet the building's full heating load. Three supplemental heating strategies are common:

1. **Electric resistance backup** (most common): Built-in strip heaters in the air handler activate when the heat pump cannot maintain setpoint alone. Simple and reliable, but COP drops to 1.0 for the resistance portion. Sized to cover the gap between heat pump capacity and design heating load.

2. **Dual-fuel / hybrid:** Heat pump paired with a gas furnace. Below a predetermined balance point temperature (typically 25-35F), the gas furnace takes over entirely. Above that temperature, the heat pump handles the load. This approach minimizes gas consumption while avoiding grid stress during extreme cold events.

3. **Thermal storage:** A water buffer tank or phase-change material (PCM) thermal store is charged by the heat pump during off-peak hours (when electricity is cheaper and grid load is lower) and discharged during peak demand periods. This decouples heat pump operation from real-time heating demand.

---

## 8. Grid Interaction and Demand Response

### 8.1 The Load Curve Problem

Mass adoption of heat pumps shifts a large portion of building heating load from the gas grid to the electric grid. The IEA models this impact directly: adding a heat pump to a poorly insulated home can nearly triple peak winter electricity demand for that building (IEA-HP). This does not mean heat pumps are bad for the grid -- it means the grid must plan for the load, and building envelope improvements are a prerequisite for efficient electrification.

The load curve problem is most acute during cold snaps, when every heat pump in a region runs at maximum capacity simultaneously. This is a correlated load -- unlike air conditioning (which varies by building orientation, shading, and occupant behavior), heating load during extreme cold is nearly uniform across all buildings. Utilities call these "heat pump coincidence peaks."

### 8.2 Building Envelope as Grid Infrastructure

The single most effective strategy for managing heat pump grid impact is reducing heating demand through building envelope improvements. This is not an HVAC topic alone -- it is grid infrastructure.

IEA analysis shows that improving a building's energy rating by two grades (e.g., from EPC class E to class C in European systems) can halve the heating demand (IEA-HP). Danish data reinforces this: well-insulated homes using heat pumps consume 30% less electricity than poorly insulated homes with the same equipment (IEA-HP).

The implication: a well-insulated home with a right-sized heat pump adds 3-5 kW of peak winter demand to the grid. A poorly insulated home with an oversized heat pump adds 8-15 kW. At the scale of millions of homes, this difference determines whether the existing distribution grid can handle electrified heating or requires billions in upgrades.

### 8.3 Demand Response Programs

Heat pumps are well-suited to demand response because buildings have thermal mass -- they can coast for 1-4 hours without active heating before occupants notice discomfort. Grid operators and utilities are developing programs to leverage this flexibility:

**Pre-heating (thermal charging):** Before an anticipated cold snap or grid peak period, the heat pump raises the building temperature 2-4F above setpoint. The building's thermal mass stores this energy. During the peak period, the heat pump reduces output or shuts off, and the building coasts down to normal setpoint. Net energy consumption is roughly the same, but peak demand is reduced.

**Price-responsive operation:** Time-of-use electricity rates incentivize heat pump operation during off-peak hours (typically overnight). Variable-speed heat pumps can modulate output to maximize operation during cheap/clean electricity hours and minimize operation during expensive/dirty hours. Smart thermostats and utility communication protocols (OpenADR, CTA-2045) enable automated response.

**Frequency regulation:** Fast-responding inverter-driven heat pumps can adjust compressor speed within seconds to support grid frequency. While each individual unit contributes only 0.5-3 kW of flexibility, aggregated across thousands of units, the resource becomes significant. Pilot programs in Europe and Japan have demonstrated the technical feasibility.

### 8.4 PNW Grid Characteristics

The Pacific Northwest electric grid has characteristics that interact favorably with heat pump adoption:

- **Hydroelectric baseload:** Washington generates 63.2% of its electricity from hydropower (EIA-WA). Oregon generates approximately 40-45% from hydropower (EIA-OR). Hydroelectric generation is dispatchable (output can be ramped up and down), flexible, and nearly zero-carbon.
- **Wind resource in the Columbia Gorge:** The Columbia River Gorge is one of the best onshore wind resources in North America. Wind generation in the BPA system has grown from negligible in 2000 to several thousand MW of installed capacity. Wind output is variable but partially predictable.
- **Mild winter climate:** Coastal PNW (Seattle, Portland, Olympia) has a mild heating climate compared to the Midwest and Northeast. Design temperatures are typically 20-28F (-2 to -7C), compared to -5 to -15F (-21 to -26C) for Minneapolis or Chicago. Heat pumps in the PNW operate at higher average COP and experience fewer extreme-cold events.
- **Wet winters:** High humidity and temperatures near freezing mean moderate frost accumulation on outdoor coils. This increases defrost frequency but is well within the capability of demand-defrost systems.

The combination of hydroelectric flexibility, growing wind capacity, and mild winter climate makes the PNW one of the most favorable regions in North America for heat pump electrification. The grid can absorb significant new heating load without the coal-heavy generation mix that raises emissions concerns in other regions.

### 8.5 Emissions Comparison by Heating System

The carbon intensity of heat pump heating depends on the grid that powers it. In the PNW, this comparison is particularly favorable:

| Heating System | Input Efficiency | Grid Carbon Factor (PNW avg) | Effective CO2 per Delivered MMBtu |
|---------------|-----------------|------------------------------|----------------------------------|
| Natural gas furnace (96% AFUE) | 0.96 | N/A (direct combustion) | ~117 lbs CO2 / MMBtu (gas combustion) |
| Electric resistance | 1.00 (COP) | ~0.25 lbs CO2/kWh (PNW avg) | ~73 lbs CO2 / MMBtu |
| Air-source heat pump (COP 3.0) | 3.00 | ~0.25 lbs CO2/kWh | ~24 lbs CO2 / MMBtu |
| Ground-source heat pump (COP 4.0) | 4.00 | ~0.25 lbs CO2/kWh | ~18 lbs CO2 / MMBtu |
| Air-source HP on 100% clean grid | 3.00 | 0 | 0 |

Sources: EIA-WA, EIA-OR, IEA-HP

In the PNW, an air-source heat pump at COP 3.0 produces roughly one-fifth the CO2 per unit of delivered heat compared to a high-efficiency gas furnace. On a national-average grid (roughly 0.9 lbs CO2/kWh), the advantage shrinks but the heat pump still wins at COP 2.5 or above. As PNW grids approach their 100% clean electricity mandates by 2040-2045, the heat pump's emissions approach zero regardless of COP.

### 8.6 CTA-2045 Communication Standard

CTA-2045 is a modular communication interface standard developed by the Consumer Technology Association, specifically designed for grid-interactive water heaters, HVAC systems, and other controllable loads. Oregon and Washington have been leaders in CTA-2045 adoption:

- Washington state requires CTA-2045 communication ports on all electric water heaters sold in the state (since 2021)
- The standard defines a physical interface (USB-like port) and a communication protocol that allows utility demand-response signals to reach the appliance
- Heat pump manufacturers including Mitsubishi, Daikin, and Carrier are integrating CTA-2045 or equivalent communication interfaces into new equipment

The practical significance: a heat pump with CTA-2045 can receive signals from the utility to reduce output during grid peaks, pre-heat before anticipated demand events, or shift to a higher-efficiency operating point. The building occupant sets comfort boundaries; the utility optimizes within those boundaries. This transforms heat pumps from passive loads into grid assets.

---

## 9. Building Envelope Coupling

### 9.1 Insulation Quality Determines Heat Pump Sizing

The relationship between building envelope performance and heat pump sizing is not optional -- it is the primary determinant of system cost, comfort, and grid impact. A tight, well-insulated building with low air infiltration has a small heating load, which means:

- Smaller (less expensive) heat pump equipment
- Higher proportion of operating hours at part load, where variable-speed systems achieve peak COP
- Lower peak electrical demand
- Greater thermal coastdown time for demand response
- Potential elimination of supplemental resistance heating

Conversely, a leaky, poorly insulated building requires a large heat pump, which:

- Costs more to purchase and install
- Runs at or near full capacity more often, reducing seasonal COP
- Creates higher peak grid demand
- May require supplemental heating that undermines the efficiency case
- Delivers less consistent comfort (cold drafts, temperature stratification)

### 9.2 Manual J Load Calculations

Proper heat pump sizing starts with a Manual J heating and cooling load calculation (ACCA Manual J, 8th Edition). This engineering procedure calculates the building's heating and cooling loads based on:

- Building dimensions and orientation
- Wall, ceiling, and floor insulation values (R-values)
- Window area, type, orientation, and solar heat gain coefficient (SHGC)
- Air infiltration rate (measured by blower door test, expressed in ACH50)
- Internal heat gains (occupants, appliances, lighting)
- Local design temperatures (ASHRAE 99% heating design temperature)

Common Manual J inputs for PNW residential buildings:

| Component | Older Home (pre-1990) | Code-Built (2020s) | High-Performance |
|-----------|----------------------|--------------------|-----------------:|
| Wall insulation | R-11 to R-13 | R-21 to R-23 | R-30 to R-40 |
| Ceiling insulation | R-19 to R-30 | R-49 to R-60 | R-60 to R-80 |
| Floor insulation | R-0 to R-19 | R-30 to R-38 | R-38 to R-60 |
| Window U-factor | 0.50-1.00 | 0.28-0.32 | 0.15-0.22 |
| Air infiltration (ACH50) | 8-15 | 3-5 | 0.6-1.5 |
| Heating load (per sq ft) | 25-45 BTU/h | 12-20 BTU/h | 5-10 BTU/h |

A 2,000 sq ft older home with R-11 walls and single-pane windows might have a design heating load of 60,000-80,000 BTU/h. The same home upgraded to R-21 walls, R-49 ceiling, and double-pane low-E windows might have a load of 24,000-36,000 BTU/h. The upgraded home can be served by a 2-3 ton heat pump; the un-upgraded home needs 5+ tons or supplemental heating.

### 9.3 Passive House Integration

Passive House (Passivhaus) buildings represent the highest level of building envelope performance, with annual heating demand limited to 15 kWh/m2 (4.75 kBTU/sq ft) and peak heating load limited to 10 W/m2 (3.17 BTU/h per sq ft). A 2,000 sq ft Passive House in Portland has a peak heating load of roughly 6,300 BTU/h -- less than half a ton of heat pump capacity.

At this scale, the heat pump becomes almost trivially small. A single ductless mini-split head can heat the entire building. The cost of the heat pump equipment drops to $2,000-$4,000, and the seasonal COP is extremely high because the system operates almost entirely at part load.

The economics of Passive House + heat pump versus standard construction + large heat pump are compelling for new construction:

| Cost Element | Standard + 4-Ton HP | Passive House + 1-Ton HP |
|-------------|---------------------|-------------------------|
| Envelope premium | Baseline | +$15,000-$30,000 |
| Heat pump equipment | $8,000-$12,000 | $2,000-$4,000 |
| Annual heating energy (kWh) | 8,000-12,000 | 1,500-3,000 |
| Annual heating cost ($0.10/kWh) | $800-$1,200 | $150-$300 |
| 20-year heating cost | $16,000-$24,000 | $3,000-$6,000 |

The envelope premium pays for itself through reduced equipment cost and operating cost. This calculation does not account for comfort improvements, noise reduction, or resilience (a Passive House can maintain habitable temperatures for days without active heating during a power outage).

### 9.4 Retrofit Economics

Most existing buildings cannot achieve Passive House levels of performance without gut renovation, but significant improvements are cost-effective:

**Priority 1 -- Air sealing.** Reducing air infiltration from 10 ACH50 to 3 ACH50 typically costs $1,000-$3,000 in a residential building and reduces heating load by 20-35%. This is the highest-return envelope investment because air leakage bypasses insulation entirely.

**Priority 2 -- Attic/ceiling insulation.** Heat rises. Adding insulation from R-19 to R-49 in an accessible attic costs $1,500-$3,000 and reduces heating load by 10-20%.

**Priority 3 -- Window replacement.** Replacing single-pane or old double-pane windows with modern double-pane low-E windows (U-factor 0.28) costs $8,000-$20,000 for a typical home. The heating load reduction is 10-25%, but the investment is harder to justify on energy savings alone. Comfort, noise, and aesthetics drive most window replacements.

**Priority 4 -- Wall insulation.** Adding insulation to existing walls is the most disruptive and expensive envelope improvement. Options include blown-in cellulose, spray foam, or exterior rigid foam with re-siding. Costs range from $5,000-$20,000+. Load reduction is 10-20%.

The combined approach -- air seal + attic insulation + heat pump -- is the sweet spot for most existing PNW homes. Total cost of $8,000-$15,000 (before incentives) achieves 30-50% reduction in heating energy use and eliminates direct fossil fuel consumption.

---

## 10. PNW-Specific Context

### 10.1 Climate Profile

The Pacific Northwest west of the Cascades has a marine climate (Koppen Csb) characterized by mild, wet winters and dry, warm summers. This climate profile interacts favorably with heat pump technology:

| Climate Parameter | Seattle (SEA) | Portland (PDX) | Spokane (GEG) |
|------------------|---------------|-----------------|---------------|
| ASHRAE 99% heating design temp | 24F (-4C) | 23F (-5C) | 2F (-17C) |
| ASHRAE 1% cooling design temp | 89F (32C) | 93F (34C) | 95F (35C) |
| Annual heating degree days (HDD65) | 4,797 | 4,400 | 6,655 |
| Annual cooling degree days (CDD65) | 213 | 383 | 517 |
| Average winter relative humidity | 80-85% | 78-83% | 70-75% |
| Frost days per year | 25-35 | 30-40 | 120-140 |

West of the Cascades, the design heating temperature of 23-24F is well within the comfort zone of modern air-source heat pumps. Even standard (non-cold-climate) equipment performs well at these temperatures. Cold-climate rated equipment is essentially never capacity-limited in Portland or Seattle.

East of the Cascades (Spokane, Boise corridor), the colder continental climate (design temp 2F) makes cold-climate heat pump specification important. COP at 2F is typically 1.8-2.5, still favorable compared to resistance heating but requiring careful sizing and potentially supplemental heating for the coldest days.

### 10.2 Washington and Oregon Clean Energy Targets

Washington's Clean Energy Transformation Act (CETA, 2019) requires:
- All retail electricity sales to be greenhouse gas neutral by 2030
- 100% clean electricity by 2045
- Social cost of carbon included in utility resource planning

Oregon's House Bill 2021 (2021) requires:
- 80% reduction in greenhouse gas emissions from retail electricity by 2030 (from 2010 baseline)
- 90% reduction by 2035
- 100% clean electricity by 2040

These targets mean that electricity consumed by heat pumps in Washington and Oregon will become progressively cleaner over the next two decades. A heat pump installed today operates on a grid that is already 60-70% carbon-free (hydroelectric + wind + solar). By 2040, the same heat pump will operate on a grid that is 100% clean by law. The carbon advantage of heat pumps over gas heating widens every year as the grid decarbonizes.

### 10.3 Natural Gas Transition

The transition from natural gas to electric heating is a live policy and infrastructure question in the PNW:

- Washington enacted building codes (effective 2023) requiring electric-ready construction in new homes -- prewiring for heat pumps even if gas is initially installed
- Several PNW cities (Bellingham, Eugene, Multnomah County) have enacted or considered restrictions on natural gas in new construction
- Puget Sound Energy, the largest gas and electric utility in Washington, is developing plans for long-term gas system management as heating electrification progresses
- The existing gas distribution network represents billions in ratepayer-funded infrastructure; the transition timeline affects the remaining useful life of these assets

These are factual observations about the current regulatory and infrastructure landscape. The pace and approach of the transition remain subjects of ongoing policy discussion.

### 10.4 Grid Impact of Mass Adoption

Modeling by BPA and regional utilities suggests that electrifying 50% of PNW residential heating with heat pumps would add approximately 3,000-5,000 MW of winter peak demand to the regional grid. For context, BPA's current firm winter peak capability is approximately 28,000-30,000 MW, and the regional grid includes an additional ~15,000 MW from investor-owned and municipal utilities.

The PNW's hydroelectric system provides significant flexibility for absorbing new heating load:
- Reservoir storage allows generation to be shifted to match heating demand patterns
- Run-of-river plants provide baseload that aligns with winter high-flow periods
- Pumped storage (planned and existing) can absorb overnight wind surplus and dispatch during morning heating peaks

The limiting factor is not annual energy (the PNW has surplus renewable generation during many hours of the year) but peak capacity during multi-day cold events when heating demand is highest, wind may be calm, and hydroelectric reservoirs may be constrained by flood control or fish passage requirements.

---

## 11. System Sizing and Design Considerations

### 11.1 Right-Sizing Principles

Oversizing a heat pump is as problematic as undersizing:

| Issue | Undersized System | Oversized System |
|-------|-------------------|------------------|
| Comfort | Cannot maintain setpoint in extreme cold | Short-cycling causes temperature swings |
| Efficiency | Runs at full capacity (moderate COP) | Runs at minimum speed, cycles off, loses efficiency |
| Humidity control | N/A (heating mode) | In cooling mode, short cycles fail to dehumidify |
| Equipment life | Higher wear from continuous operation | Higher wear from frequent on-off cycling |
| Cost | Lower equipment cost, may need supplemental | Higher equipment cost, wasted capacity |

Variable-speed systems are more tolerant of mild oversizing because they can modulate down to 20-30% of rated capacity. But they still have a minimum operating speed, and if the building load is consistently below that minimum, the system will cycle. The goal is to match the heat pump's capacity range to the building's load range.

### 11.2 Balance Point Analysis

The balance point is the outdoor temperature at which the heat pump's heating capacity exactly equals the building's heating demand. Above the balance point, the heat pump runs at part load. Below the balance point, supplemental heating is required (or the heat pump cannot maintain setpoint).

For a well-insulated PNW home (design load 24,000 BTU/h at 24F) with a 2-ton cold-climate heat pump (rated 30,000 BTU/h at 47F, 21,000 BTU/h at 5F):
- Balance point: approximately 28-32F
- Hours below balance point in Seattle: approximately 200-400 per year
- Supplemental heat requirement: 500-1,500 kWh/year of electric resistance

For the same home with a 3-ton system:
- Balance point: approximately 10-15F
- Hours below balance point in Seattle: approximately 0-20 per year
- Supplemental heat requirement: near zero

The optimal sizing depends on the relative cost of the larger heat pump versus the cost of supplemental electricity over the system lifetime.

### 11.3 Ductwork Design

Heat pumps deliver air at lower temperatures than gas furnaces (typically 90-110F vs. 120-140F for gas). This means:

- **Higher airflow required:** To deliver the same BTU/h at a lower temperature, the blower must move more air. Ductwork must be sized for the higher airflow rate.
- **Duct leakage more costly:** Because the air temperature is closer to room temperature, each CFM of duct leakage wastes a smaller absolute amount of energy -- but the higher total airflow means more total leakage in CFM.
- **Existing ductwork may be inadequate:** Homes originally built with gas furnaces may have undersized ductwork for heat pump operation. A duct evaluation (Manual D) should accompany any furnace-to-heat-pump conversion.
- **Duct sealing critical:** Sealing duct leaks in unconditioned spaces (attics, crawlspaces) is one of the highest-return improvements for heat pump performance. Reducing duct leakage from 25% to 5% can improve delivered efficiency by 15-20%.

### 11.4 Refrigerant Line Sizing

For split systems (outdoor unit + indoor air handler or heads), refrigerant line sizing must account for:
- Equivalent length of refrigerant piping (including fittings and elbows)
- Elevation change between indoor and outdoor units
- Manufacturer's specifications for maximum and minimum line lengths
- Line insulation requirements (both suction and liquid lines in heating mode)

Mini-split and multi-split systems have specific maximum line lengths (typically 50-100 feet equivalent) and maximum elevation differences (30-50 feet). Exceeding these limits causes refrigerant charge imbalance, oil return problems, and capacity loss.

---

## 12. Maintenance and Lifecycle

### 12.1 Expected Service Life

| Component | Expected Life | Failure Mode |
|-----------|--------------|-------------|
| Compressor | 12-20 years | Bearing wear, valve plate erosion, motor winding failure |
| Reversing valve | 15-25 years | Internal seat wear, solenoid failure |
| Outdoor coil | 15-25 years | Corrosion (coastal environments), physical damage |
| Indoor coil | 20-30 years | Corrosion (rare), refrigerant leak at joints |
| Inverter drive board | 10-15 years | Capacitor aging, IGBT/MOSFET degradation |
| Expansion valve (EEV) | 10-20 years | Stepper motor failure, orifice clogging |
| Controls/thermostat | 8-15 years | Electronics aging, firmware obsolescence |

Overall system life for a quality air-source heat pump is typically 15-20 years. Ground-source systems, which have fewer outdoor-exposed components and run the compressor at lower stress levels, commonly achieve 20-25 years for the heat pump unit and 50+ years for the ground loop.

### 12.2 Routine Maintenance

**Annual (homeowner or technician):**
- Clean or replace air filter (monthly during heavy use)
- Clear vegetation and debris from outdoor unit (maintain 24 inches of clearance)
- Inspect condensate drain for blockage
- Verify thermostat operation and programming

**Biennial (qualified technician):**
- Check refrigerant charge (weigh-in method, not sight glass)
- Inspect electrical connections and tighten terminals
- Measure airflow across indoor coil
- Clean outdoor coil (coil cleaner and low-pressure rinse)
- Test defrost cycle operation
- Verify reversing valve operation (heating and cooling modes)
- Measure supply and return air temperatures (delta-T check)
- Inspect ductwork for leaks (if accessible)

**Ground-source specific:**
- Check loop fluid pressure and antifreeze concentration annually
- Inspect loop pump operation and flow rate
- Verify entering and leaving water temperatures match design

### 12.3 Common Failure Modes and Diagnostics

| Symptom | Likely Cause | Diagnostic |
|---------|-------------|-----------|
| System runs but does not heat | Low refrigerant charge, reversing valve stuck, compressor failure | Check suction/discharge pressures, reversing valve solenoid |
| System short-cycles | Oversized equipment, dirty filter, blocked coil, refrigerant overcharge | Measure cycle time, check pressures, inspect airflow |
| Ice on outdoor coil (persistent) | Defrost failure, low refrigerant, blocked coil, faulty defrost sensor | Check defrost board, sensor placement, refrigerant charge |
| High electric bills, comfort OK | Excessive supplemental heat use, duct leakage, low COP | Monitor auxiliary heat runtime, check duct leakage |
| Noise from outdoor unit | Compressor bearing wear, fan blade imbalance, vibration isolation failure | Isolate noise source, check mounting, inspect bearings |

### 12.4 Heat Pump Water Heating

Heat pump water heaters (HPWH) apply the same vapor-compression cycle to domestic hot water production. A typical HPWH has an integrated compressor and evaporator mounted on top of a storage tank, extracting heat from the surrounding air (garage, utility room, or basement) and depositing it into the water.

Performance characteristics:

| Metric | Electric Resistance Tank | Heat Pump Water Heater |
|--------|--------------------------|----------------------|
| Uniform Energy Factor (UEF) | 0.90-0.95 | 2.5-4.0 |
| Annual energy use (4-person household) | 4,500-5,000 kWh | 1,200-1,800 kWh |
| First-hour delivery (50-gal) | 60-70 gallons | 50-65 gallons |
| Recovery rate | 20-25 GPH | 8-12 GPH (heat pump only) |
| Ambient air requirement | None | Needs 700+ cubic feet of air space |
| Noise | Silent | 45-55 dBA (compressor hum) |

Sources: EPA-ESTAR, DOE-WHR

HPWHs have an important grid interaction property: the storage tank is inherently a thermal battery. A 50-gallon tank at 140F holds approximately 14 kWh of useful thermal energy. By heating water during off-peak hours and drawing from the stored hot water during peak hours, HPWHs can provide significant demand flexibility without any occupant discomfort. This is why Washington state mandated CTA-2045 communication ports on electric water heaters -- the combination of thermal storage and grid communication makes HPWHs one of the most cost-effective demand response resources available.

### 12.5 High-Temperature Heat Pumps -- The Frontier

Conventional heat pumps deliver heat at temperatures up to approximately 130-150F (55-65C), suitable for space heating and domestic hot water. A growing class of high-temperature heat pumps (HTHPs) can deliver heat at 200-300F (90-150C) and beyond, opening applications in industrial process heat, district heating, and food processing (HOEG).

Research published in Nature Energy (Hoeg, Vartdal et al., December 2025) identifies two emerging pathways for high-temperature heat pumps:

1. **High-temperature solid-state heat pumps** using thermoelectric, electrocaloric, or magnetocaloric effects rather than vapor compression. These systems have no moving parts and no refrigerant, offering potential advantages in reliability and environmental impact. Current efficiencies are below vapor-compression systems, but the research trajectory is promising.

2. **Gas-cycle heat pumps** using supercritical CO2 or other working fluids in Brayton-cycle configurations. These systems can achieve delivery temperatures above 300F (150C) with COP values of 1.5-2.5, making them competitive with direct combustion for industrial process heat.

The significance for the broader thermal energy picture: industrial process heat below 400F (200C) represents approximately 50% of all industrial thermal energy demand. If high-temperature heat pumps can cost-effectively serve this range, the electrification pathway extends far beyond building HVAC into industrial decarbonization. This is the bridge between Module A (HVAC) and Module B (Waste Heat Recovery) -- the same thermodynamic principles, applied at higher temperatures and larger scales.

---

## 13. Cross-References

| ID | Topic | Related Module |
|----|-------|---------------|
| A-COP | COP fundamentals, Carnot limits | B-ORC (ORC COP comparison), D-PEM (fuel cell efficiency comparison) |
| A-REF | Refrigerant transition, GWP data | C-TWC (catalytic converter emissions context) |
| A-GRID | Grid interaction, demand response | F-HYDRO (hydroelectric dispatch flexibility), F-GRID (PNW grid capacity) |
| A-ENV | Building envelope coupling | B-PCM (phase change materials for thermal storage) |
| A-PNW | PNW climate and policy context | F-GEO (geothermal resources), F-GRID (clean electricity targets) |
| A-INV | Inverter technology, variable-speed drives | D-SOFC (power electronics in fuel cell systems) |
| A-R744 | CO2 heat pumps, transcritical cycle | E-LCOH (CO2 as refrigerant and as electrolysis product) |
| A-HIGHTEMP | High-temperature heat pumps | B-ORC (waste heat recovery temperature ranges), HOEG reference |

---

## 14. Sources

### Primary Sources Cited in This Module

| Key | Full Citation | Used For |
|-----|--------------|----------|
| IEA-HP | IEA. *The Future of Heat Pumps.* World Energy Outlook Special Report | COP ranges (3-5), global installed capacity (1,000 GW), 10% heating share, Net Zero 2,600 GW projection, 500 Mt CO2 reduction, building envelope analysis, China market share, defrost and grid interaction analysis |
| EPA-ESTAR | U.S. EPA. *ENERGY STAR Most Efficient 2025 and Version 6.2 Heat Pump Specification.* December 2024 | Cold-climate COP criteria (>=1.75 at 5F), 70% capacity retention requirement, HSPF2/SEER2 thresholds, refrigerant GWP data |
| IEA-GER | IEA. *Global Energy Review 2025* | 2024 heat pump vs. gas boiler sales gap (30%), market momentum data |
| IEA-REN | IEA. *Renewables 2025 Report* | U.S. installed base estimate, global deployment projections |
| EHPA | European Heat Pump Association. *2024 European Heat Pump Market and Statistics Report* | Europe 40% growth (2022), Norway 632 per 1,000 households |
| WEF-HP | World Economic Forum. *How much money and energy can heat pumps save households?* September 2025 | Household economics, GSHP installation cost ranges, payback data |
| MIT-HP | MIT Technology Review. *Heat pumps: 10 Breakthrough Technologies 2024.* January 2024 | Cold-climate performance characterization, technology prominence |
| HOEG | Nature Energy (Hoeg, Vartdal et al.). *Emerging opportunities for high-temperature solid-state and gas-cycle heat pumps.* December 2025 | High-temperature heat pump research, CO2 transcritical cycle COP data |
| DOE-WHR | U.S. DOE. *Waste Heat Recovery: Technology and Opportunities in U.S. Industry.* EERE | HSPF2 testing methodology context |
| EIA-WA | U.S. EIA. *Washington State Energy Profile.* 2024-2025 data | Washington 63.2% hydroelectric generation |
| EIA-OR | U.S. EIA. *Oregon State Energy Profile.* 2024-2025 data | Oregon generation mix, hydroelectric share |

### Additional References

- ACCA. *Manual J -- Residential Load Calculation.* 8th Edition. Air Conditioning Contractors of America.
- ACCA. *Manual D -- Residential Duct Systems.* Air Conditioning Contractors of America.
- ASHRAE. *ASHRAE Handbook -- HVAC Systems and Equipment.* Chapter 9: Applied Heat Pump and Heat Recovery Systems.
- ASHRAE. *Standard 15: Safety Standard for Refrigeration Systems.*
- UL. *UL 60335-2-40: Safety of Household and Similar Electrical Appliances -- Heat Pumps, Air Conditioners, and Dehumidifiers.* 2023 Edition.
- Bonneville Power Administration (BPA). Regional load and resource data, winter peak capacity planning documents.

---

*Module A -- HVAC & Heat Pump Systems*
*Cross-reference prefix: A-xxx*
*Thermal & Hydrogen Energy Systems -- PNW Energy Research*