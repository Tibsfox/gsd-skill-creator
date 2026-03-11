# Waste Heat Recovery

> **Module ID:** B-WHR
> **Domain:** Industrial Energy Efficiency & Thermal Recovery
> **Through-line:** *Energy does not disappear -- it downgrades.* Every industrial process that burns fuel, moves fluid, or drives a reaction sheds heat into exhaust stacks, cooling loops, and radiant surfaces. That rejected heat is not loss in the thermodynamic sense -- it is energy at a lower temperature than the process needed, still carrying extractable work. Waste heat recovery is the discipline of intercepting that energy before it reaches the atmosphere and converting it into something useful: electricity, process heating, space conditioning, or feedstock for another thermodynamic cycle. The technologies range from century-old recuperators to solid-state thermoelectric devices, and the economic case strengthens every year as fuel costs rise and carbon constraints tighten.

---

## Table of Contents

1. [Industrial Waste Heat: Scale and Significance](#1-industrial-waste-heat-scale-and-significance)
2. [Temperature Classification](#2-temperature-classification)
3. [High-Grade Recovery Technologies](#3-high-grade-recovery-technologies)
4. [Medium-Grade Recovery Technologies](#4-medium-grade-recovery-technologies)
5. [Low-Grade Recovery Technologies](#5-low-grade-recovery-technologies)
6. [Organic Rankine Cycle (ORC) -- Deep Dive](#6-organic-rankine-cycle-orc----deep-dive)
7. [Thermoelectric Generators (TEGs) -- Deep Dive](#7-thermoelectric-generators-tegs----deep-dive)
8. [Heat Pipe Systems -- Deep Dive](#8-heat-pipe-systems----deep-dive)
9. [Phase-Change Materials (PCM) -- Deep Dive](#9-phase-change-materials-pcm----deep-dive)
10. [Kalina Cycle](#10-kalina-cycle)
11. [Mechanical Vapor Recompression (MVR)](#11-mechanical-vapor-recompression-mvr)
12. [Decision Framework: Selecting WHR Technology](#12-decision-framework-selecting-whr-technology)
13. [PNW Industrial Context](#13-pnw-industrial-context)
14. [Integration with Other Modules](#14-integration-with-other-modules)
15. [Research Frontiers](#15-research-frontiers)
16. [Sources](#16-sources)

---

## 1. Industrial Waste Heat: Scale and Significance

### 1.1 The Magnitude of the Problem

Industrial processes are thermodynamically imperfect. The U.S. Department of Energy estimates that between 20% and 50% of all energy input to U.S. industrial operations is ultimately rejected as waste heat -- exhausted through flue gases, discharged in cooling water, radiated from hot surfaces, or carried away in heated product streams [DOE-WHR]. This is not a rounding error. U.S. industrial energy consumption exceeds 30 quadrillion BTU per year (EIA data), which means the waste heat stream represents roughly 6 to 15 quadrillion BTU annually -- an energy flow comparable to the total primary energy consumption of many mid-sized nations.

A 2025 review published in the Journal of Thermal Analysis and Calorimetry (lead author: Jouhara) examined the state of waste heat recovery systems across multiple industrial sectors and found that WHR technologies can reduce industrial energy consumption and associated carbon emissions by 20 to 30 percent when properly implemented [JOUHARA]. This is a system-level finding, not a laboratory curiosity. It accounts for the practical constraints of retrofit installation, variable heat source quality, and the parasitic energy costs of the recovery equipment itself.

### 1.2 Where the Heat Goes

Waste heat exits industrial facilities through several primary pathways:

- **Exhaust gases** -- Combustion exhaust from furnaces, kilns, boilers, and dryers. These streams carry the highest temperatures (often 200 to 1,400+ degrees C) but may contain corrosive compounds, particulates, or condensable vapors that complicate heat exchanger design.
- **Cooling water** -- Process cooling loops that absorb heat from equipment and reject it through cooling towers or once-through discharge. Temperatures are typically low (30 to 90 degrees C) but flow volumes are large.
- **Heated product streams** -- Hot steel, glass, cement clinker, and chemical products that cool during storage and transport. The heat is diffuse and often difficult to capture economically.
- **Radiant and convective surface losses** -- Heat radiating from furnace walls, pipe surfaces, and uninsulated equipment. These losses are distributed and low-density but cumulative.
- **Condensate and blowdown** -- Steam system condensate and boiler blowdown that carries thermal energy at temperatures between 100 and 200 degrees C.

### 1.3 Sector Breakdown

Waste heat intensity varies dramatically by industry. The following table summarizes the primary waste heat sources, typical temperature ranges, and estimated recovery potential for major industrial sectors, drawing on DOE and IEA data:

| Industrial Sector | Primary Waste Heat Source | Typical Temperature Range | Estimated Waste Heat (% of input) | Recovery Potential |
|---|---|---|---|---|
| Iron and steel | Blast furnace gas, slag, coke oven gas, rolling mill exhaust | 200--1,600 C | 30--45% | High (HRSG, ORC, recuperators) |
| Cement | Kiln exhaust gas, clinker cooler exhaust | 150--450 C | 25--40% | High (ORC, raw material preheating) |
| Glass | Melting furnace exhaust, annealing lehr exhaust | 400--1,500 C | 25--50% | High (regenerators, recuperators, ORC) |
| Chemical processing | Reactor exhaust, distillation column overhead, exothermic reaction heat | 50--500 C (varies widely) | 20--35% | Medium to high (heat integration, ORC, heat pumps) |
| Petroleum refining | Flue gas from process heaters, catalytic cracker regenerator exhaust | 150--600 C | 20--30% | Medium to high (HRSG, economizers, heat integration) |
| Pulp and paper | Black liquor recovery boiler exhaust, paper machine dryer exhaust | 100--300 C | 20--35% | Medium (economizers, heat exchangers, MVR) |
| Food and beverage | Boiler exhaust, oven/dryer exhaust, refrigeration condenser heat, pasteurization waste heat | 30--250 C | 15--30% | Medium (heat exchangers, heat pumps, MVR, PCM) |
| Aluminum smelting | Pot exhaust gas, cast house ventilation, anode baking furnace exhaust | 100--400 C | 25--40% | Medium (heat exchangers, ORC) |
| Data centers | Server exhaust air, liquid cooling loops | 30--60 C | 95+% (nearly all input becomes heat) | Low to medium (district heating, heat pumps) |

[DOE-WHR, JOUHARA]

### 1.4 The Low-Grade Challenge

The single most important fact about industrial waste heat is its temperature distribution: approximately 63% of all industrial waste heat streams occur below 100 degrees C [DOE-WHR]. This low-grade heat is the most abundant category and simultaneously the most technically challenging to recover. Carnot efficiency limits the theoretical work extractable from a heat source, and that limit drops steeply as source temperature approaches ambient:

- A heat source at 500 C rejecting to 25 C has a Carnot efficiency of approximately 61%.
- A heat source at 200 C rejecting to 25 C has a Carnot efficiency of approximately 37%.
- A heat source at 80 C rejecting to 25 C has a Carnot efficiency of approximately 16%.
- A heat source at 50 C rejecting to 25 C has a Carnot efficiency of approximately 8%.

Real conversion devices achieve 30 to 60% of Carnot efficiency depending on technology, so the practical electricity yield from an 80 C waste heat stream is in the range of 5 to 10%. At 50 C, power generation is rarely economic. This does not mean the heat is useless -- it means the recovery strategy must shift from power generation to direct thermal use: preheating combustion air, preheating boiler feedwater, space heating, district heating networks, or serving as the source-side input for heat pumps.

The economic significance of low-grade waste heat is substantial precisely because of its abundance. A steel mill may have 50 MW of high-temperature exhaust that justifies a dedicated HRSG, but a food processing complex may have 200 MW of low-grade heat distributed across dozens of streams. Recovering even 20% of that low-grade heat displaces purchased fuel.

---

## 2. Temperature Classification

Waste heat recovery technologies are fundamentally organized by the temperature of the available heat source. The classification system used throughout the WHR literature and by the DOE divides waste heat into three grades [DOE-WHR]:

| Temperature Class | Range | Characteristics | Primary Recovery Strategy |
|---|---|---|---|
| **High grade** | Above 400 C | Highest exergy content. Directly useful for power generation and high-temperature process heating. Sources include furnace exhaust, kiln gases, and combustion turbine exhaust. | Heat-to-power (steam Rankine, HRSG). Heat-to-heat (recuperators, regenerators, waste heat boilers). |
| **Medium grade** | 100--400 C | Moderate exergy. Power generation possible with specialized cycles. Direct use for process heating, drying, and preheating is often more economic. Sources include boiler exhaust, dryer exhaust, and catalytic process streams. | ORC, absorption heat pumps, heat pipes, MVR, conventional heat exchangers. |
| **Low grade** | Below 100 C | Low exergy but high abundance. Power generation marginal or uneconomic. Thermal uses dominate. Sources include cooling water, condenser heat, and data center exhaust. | Heat exchangers, advanced ORC (marginal economics), PCM thermal storage, Kalina cycle, TEGs (niche), heat pumps (temperature upgrade). |

### 2.1 Exergy and the Quality of Heat

Temperature is a proxy for exergy -- the maximum useful work extractable from a heat stream relative to the environment. A kilowatt of heat at 1,000 C carries far more exergy than a kilowatt at 60 C, even though both contain the same thermal energy. WHR technology selection is fundamentally an exergy-matching problem: the recovery device must be matched to the quality of the available heat, not just its quantity.

This is why a steam Rankine cycle makes sense for a 500 C exhaust stream but is absurd for a 70 C cooling loop. The steam cycle needs superheat to function efficiently; the 70 C stream cannot provide it. Conversely, using a high-grade heat source merely to warm a building is thermodynamically wasteful -- it destroys exergy that could have generated electricity first, with the residual heat then used for space conditioning (a cascaded or combined heat and power approach).

### 2.2 Technology-Temperature Mapping

The following table maps specific WHR technologies to their effective operating temperature ranges and primary outputs:

| Technology | Effective Source Temperature | Primary Output | Typical Scale | Maturity |
|---|---|---|---|---|
| Recuperator | 400--1,400 C | Preheated combustion air | Single furnace/kiln | Commercial (decades) |
| Regenerator | 800--1,500 C | Preheated combustion air | Single furnace | Commercial (centuries) |
| Waste heat boiler | 300--1,000 C | Steam (power or process) | Facility-scale | Commercial |
| HRSG | 400--650 C (gas turbine exhaust) | Steam (power via steam turbine) | Utility-scale | Commercial |
| Organic Rankine Cycle (ORC) | 80--400 C | Electricity | 10 kW to 10 MW | Commercial |
| Kalina cycle | 80--200 C | Electricity | 1--50 MW | Demonstrated |
| Thermoelectric generator (TEG) | 150--1,000+ C | Electricity (DC) | Watts to low kW | Commercial (niche) |
| Heat pipe heat exchanger | 50--1,000 C | Transferred heat | Module-scale | Commercial |
| Shell-and-tube heat exchanger | 30--800 C | Transferred heat | Any scale | Commercial (universal) |
| Plate heat exchanger | 30--250 C | Transferred heat | Any scale | Commercial |
| Absorption heat pump | 80--200 C (driving heat) | Upgraded heat or cooling | Building to district | Commercial |
| Mechanical vapor recompression | 70--150 C (steam input) | Higher-pressure steam | Process-scale | Commercial |
| Phase-change material storage | 30--800 C (depends on PCM) | Time-shifted heat | Module to facility | Emerging to commercial |

---

## 3. High-Grade Recovery Technologies

### 3.1 Recuperators

A recuperator is a continuous-flow heat exchanger that transfers heat from hot exhaust gas to incoming combustion air (or another process stream) across a solid wall. The two streams flow simultaneously -- typically in counterflow arrangement for maximum temperature approach -- and heat transfers by conduction through a metallic or ceramic dividing surface.

Recuperators are the oldest and most straightforward WHR technology. They require no working fluid, no moving parts (in the heat exchange section), and no external energy input. The combustion air enters the furnace at an elevated temperature, reducing the fuel required to reach process temperature. Fuel savings of 10 to 30% are typical for furnace applications in the 600 to 1,400 C range [DOE-WHR].

**Materials:** Metallic recuperators (stainless steel, Inconel, other nickel alloys) handle exhaust temperatures up to approximately 1,100 C. Above that, ceramic recuperators (silicon carbide, alumina) are necessary but more fragile and expensive. Corrosive exhaust components (sulfur compounds, alkali metals in biomass combustion, chlorine in waste incineration) drive material selection and limit service life.

**Limitations:** Fouling from particulates and condensed volatiles reduces effectiveness over time. Thermal cycling causes fatigue cracking at weld joints. Recuperators capture heat only while the furnace is running -- no storage capability.

**Design variants:**

- **Radiation recuperators** position the heat exchange surface in the radiant section of the furnace, where heat transfer is dominated by radiation from the flame and hot gas. These are used in the highest-temperature applications (steel reheating furnaces, glass melting) and are typically constructed from high-alloy steel or ceramic tubes arranged concentrically or in a panel configuration.
- **Convective recuperators** are placed downstream of the radiant section, in the convective zone where exhaust gas temperatures have dropped to 400 to 800 C. Shell-and-tube and plate-fin configurations are common. These are simpler and cheaper than radiation recuperators but capture less energy per unit of heat transfer area because convective heat transfer coefficients are lower than radiative coefficients at high temperature.
- **Combined radiation-convection recuperators** use both mechanisms sequentially, with a radiation section near the furnace exit transitioning to a convective section further downstream. This staged approach maximizes total heat recovery while managing material temperature limits.

### 3.2 Regenerators

Regenerators achieve the same goal as recuperators -- preheating combustion air -- but use a thermal storage medium (typically a packed bed of refractory bricks or ceramic media) that alternately absorbs heat from exhaust gas and releases it to incoming air. The flow direction reverses periodically (every few minutes in a traditional Siemens regenerator, or continuously in a rotary regenerator).

Regenerators can handle higher temperatures than metallic recuperators because the storage medium is already refractory material. Glass melting furnaces commonly use regenerators operating with exhaust gas above 1,400 C. The packed bed stores thermal energy across the flow reversal, delivering combustion air at temperatures that can reach 80% of the exhaust gas temperature [DOE-WHR].

**Rotary regenerators (heat wheels)** are a compact variant used for lower-temperature applications (HVAC, industrial drying). A rotating wheel of corrugated metal or ceramic passes alternately through the hot exhaust and cold intake streams, transferring both sensible and (if the surface is hygroscopic) latent heat.

### 3.3 Waste Heat Boilers

A waste heat boiler generates steam by passing hot exhaust gas over water-filled tubes (fire-tube configuration) or by passing water through tubes immersed in the exhaust gas stream (water-tube configuration). The generated steam can drive a turbine for electricity, provide process heat, or both.

Waste heat boilers are standard equipment in the chemical, refining, and metals industries wherever exhaust gas temperatures exceed 300 C with sufficient mass flow. They are essentially conventional boilers with the combustion chamber replaced by the waste heat source.

**Design considerations:**

- **Gas-side fouling** -- exhaust streams from combustion of heavy fuels, biomass, or waste contain ash, soot, and condensable tars that deposit on boiler tubes. Soot blowers (steam or compressed air jets) are installed to periodically clean tube surfaces. Tube spacing must accommodate fouling without blocking gas flow.
- **Corrosion** -- sulfur in the fuel produces SO2 and SO3, which combine with water vapor to form sulfuric acid when the gas temperature drops below the acid dew point (120 to 160 C for heavy fuel oil). Waste heat boiler outlet temperatures must be maintained above this threshold, or corrosion-resistant materials (Cor-Ten steel, glass-lined tubes) must be used for the cold end.
- **Supplementary firing** -- some waste heat boilers include a supplementary burner (duct burner) between the waste heat source and the boiler tubes. This allows the boiler to generate additional steam when waste heat alone is insufficient, providing operational flexibility at the cost of additional fuel consumption.

### 3.4 Heat Recovery Steam Generators (HRSG)

The HRSG is a specialized waste heat boiler designed specifically to recover heat from gas turbine exhaust in combined-cycle power plants. Gas turbine exhaust typically exits at 450 to 650 C with high mass flow rates, making it an excellent steam generation source. The HRSG produces steam at one, two, or three pressure levels to drive a steam turbine, boosting the combined-cycle plant efficiency from roughly 35 to 40% (gas turbine alone) to 55 to 63% (combined cycle) [DOE-WHR].

In industrial applications, HRSGs recover heat from any high-temperature, high-flow exhaust -- not just gas turbines. Cement kilns, incinerators, and large industrial furnaces can feed HRSGs to generate steam for power or process use.

---

## 4. Medium-Grade Recovery Technologies

### 4.1 Organic Rankine Cycle (ORC)

The ORC is covered in detail in Section 6 below. It is the dominant power-generation technology for medium-grade waste heat (100 to 400 C) where steam Rankine is impractical due to scale or temperature constraints.

### 4.2 Absorption Heat Pumps

An absorption heat pump uses a thermally driven cycle (typically lithium bromide/water or ammonia/water) to upgrade low-temperature waste heat to a more useful temperature or to provide cooling. Unlike vapor-compression heat pumps that require electricity to drive a compressor, absorption systems are driven by heat -- making them ideal for situations where waste heat is abundant but electricity is expensive or constrained.

In WHR applications, an absorption heat pump can take waste heat at 80 to 150 C and upgrade a portion of it to 150 to 200 C for process use, rejecting the remainder at a lower temperature. The coefficient of performance (COP) for heat delivery is typically 1.3 to 1.8 -- meaning more useful heat is delivered than the driving heat consumed, with the balance drawn from the low-temperature source [IEA-HP].

### 4.3 Economizers

An economizer is a heat exchanger that preheats boiler feedwater using exhaust gas that has already passed through the primary heat exchange surfaces. By cooling the flue gas from perhaps 250 C to 120 to 150 C (above the acid dew point to prevent corrosion), the economizer recovers 5 to 10% of the boiler's fuel input. Economizers are standard on any boiler above a few MW and represent one of the most cost-effective WHR investments, with payback periods often under two years [DOE-WHR].

Condensing economizers push further, cooling the exhaust below the water vapor dew point (approximately 55 C for natural gas combustion products) to capture latent heat. This requires corrosion-resistant materials (stainless steel, polymer-coated surfaces) but can recover an additional 10 to 15% of fuel input on top of sensible heat recovery.

### 4.4 Heat Integration (Pinch Analysis)

Heat integration is not a device but a systematic methodology for minimizing external heating and cooling requirements in a process plant by maximizing internal heat exchange between hot and cold streams. Pinch analysis, developed by Linnhoff in the 1970s, identifies the thermodynamic bottleneck (the pinch point) in a network of process streams and designs a heat exchanger network that approaches the theoretical minimum energy requirement.

Pinch analysis has reduced external energy consumption by 20 to 40% in chemical plants, refineries, and food processing facilities [DOE-WHR]. It is the essential first step before investing in any WHR hardware: if internal heat exchange can eliminate the waste heat stream entirely, no recovery device is needed.

---

## 5. Low-Grade Recovery Technologies

### 5.1 The Low-Grade Toolkit

Recovering useful work from heat below 100 C pushes against the thermodynamic floor. The Carnot limit constrains power generation to single-digit efficiency, so the primary strategy for low-grade heat is direct thermal use: preheating, space heating, district heating, aquaculture heating, greenhouse heating, or serving as the source side for a heat pump that upgrades the temperature for process use.

Where power generation from low-grade heat is attempted, the technologies include:

- **Advanced ORC systems** with ultra-low-boiling working fluids (see Section 6)
- **Kalina cycle** using ammonia-water mixtures (see Section 10)
- **Thermoelectric generators** exploiting the Seebeck effect (see Section 7)

Where thermal use is the strategy:

- **Heat exchangers** (plate, shell-and-tube, spiral) transfer heat directly between streams
- **Heat pumps** (vapor compression or absorption) upgrade low-grade heat to useful temperatures (see Module A, cross-reference B-A-HP)
- **Phase-change materials** store heat for time-shifted delivery (see Section 9)
- **District heating networks** distribute low-grade heat to buildings within a few kilometers

### 5.2 District Heating from Industrial Waste Heat

District heating networks -- insulated pipe systems that distribute hot water from a central source to multiple buildings -- are the most established pathway for utilizing low-grade industrial waste heat at scale. Scandinavian countries lead this field: in Denmark, over 60% of building heating is supplied by district heating, and industrial waste heat is a significant input alongside combined heat and power plants and biomass boilers.

Fourth-generation district heating (4GDH) systems operate at supply temperatures of 50 to 70 C -- low enough to directly accept waste heat from data centers, industrial cooling loops, and heat pump output without requiring booster heating in most cases. The lower supply temperature reduces distribution losses (pipe heat loss is proportional to the temperature difference between pipe and ground) and enables integration of more low-grade waste heat sources.

For the PNW, district heating from industrial waste heat is most feasible where:

- Industrial heat sources are co-located with dense residential or commercial development
- Local governments are willing to invest in or facilitate pipe network infrastructure
- Building heating loads are large enough to justify the pipe network capital cost
- Alternative heating (natural gas, electric resistance) is expensive or carbon-constrained

The primary barrier is infrastructure cost. Insulated pipe networks cost $500 to $2,000 per linear meter depending on diameter and ground conditions. A 1 km pipe run serving 200 buildings from an industrial waste heat source might cost $1 to $2 million -- requiring long-term contracts and often public sector involvement to justify the upfront investment.

### 5.3 Data Center Waste Heat

Data centers are a special case of low-grade waste heat. Nearly 100% of the electricity consumed by computing equipment is converted to heat -- there is no chemical or physical product, only computation and thermal exhaust. A 10 MW data center produces approximately 10 MW of heat, typically at 30 to 45 C (air-cooled) or 45 to 65 C (liquid-cooled). This heat is currently rejected to the atmosphere by cooling towers or chillers in most facilities.

The volume is large and growing. U.S. data center electricity consumption has increased sharply with the expansion of cloud computing and AI workloads. In the Pacific Northwest, where data centers cluster in central Oregon and eastern Washington to access cheap hydroelectric power, the waste heat resource is substantial (see Section 13).

Recovery strategies for data center waste heat include:

- **District heating** -- piping warm water to nearby buildings (demonstrated in Scandinavian cities)
- **Greenhouse heating** -- maintaining growing temperatures in adjacent agricultural facilities
- **Absorption cooling** -- using waste heat to drive absorption chillers for the data center itself
- **Heat pump source** -- using data center reject heat as the warm-side source for heat pumps serving nearby buildings, achieving COPs of 4 to 6 due to the elevated source temperature relative to ambient air

---

## 6. Organic Rankine Cycle (ORC) -- Deep Dive

### 6.1 Operating Principle

The Organic Rankine Cycle is thermodynamically identical to the steam Rankine cycle that drives most of the world's thermal power plants, with one critical substitution: the working fluid is an organic compound with a boiling point well below that of water. This allows the cycle to operate efficiently with heat sources at 80 to 400 C -- temperatures where water would remain liquid or generate steam at impractically low pressures.

The cycle follows four stages:

1. **Pump** -- Liquid working fluid is pressurized by a feed pump (low parasitic power due to the small specific volume of the liquid).
2. **Evaporator** -- The pressurized liquid absorbs heat from the waste heat source, vaporizing (and optionally superheating) the working fluid.
3. **Expander** -- The high-pressure vapor expands through a turbine or volumetric expander, converting thermal energy to mechanical work (and then to electricity via a generator).
4. **Condenser** -- The low-pressure vapor rejects heat to a cooling medium (air or water), condensing back to liquid, completing the cycle.

### 6.2 Working Fluid Selection

The choice of working fluid is the central engineering decision in ORC design. The fluid's thermodynamic properties -- boiling point, critical temperature, latent heat of vaporization, specific heat, and the slope of the saturation vapor curve on a temperature-entropy diagram -- determine the cycle's efficiency, component sizing, and operational characteristics.

| Working Fluid | Boiling Point (1 atm) | Critical Temp | Fluid Type | Typical Application | GWP | ODP |
|---|---|---|---|---|---|---|
| R245fa (1,1,1,3,3-pentafluoropropane) | 15 C | 154 C | Dry | Low to medium temp ORC (80--150 C) | 1,030 | 0 |
| R134a (1,1,1,2-tetrafluoroethane) | -26 C | 101 C | Wet | Very low temp ORC, automotive | 1,430 | 0 |
| R1233zd(E) | 18 C | 166 C | Dry | R245fa replacement (lower GWP) | 1 | 0 |
| R1234yf | -29 C | 95 C | Mildly flammable | Automotive, low temp | <1 | 0 |
| Toluene | 111 C | 319 C | Dry | Medium to high temp ORC (200--350 C) | ~3 | 0 |
| n-Pentane | 36 C | 197 C | Dry | Geothermal ORC | ~5 | 0 |
| Cyclohexane | 81 C | 281 C | Dry | Higher temp ORC | ~3 | 0 |
| Siloxane (MM, MDM) | 100--153 C | 245--291 C | Dry | High-temp ORC (250--400 C), biomass CHP | ~0 | 0 |
| Isobutane | -12 C | 135 C | Dry (mildly flammable) | Geothermal (binary plants) | ~3 | 0 |

**Dry vs. wet fluids:** The saturation vapor curve slope on a T-s diagram determines whether the fluid is "dry" (positive slope, vapor becomes superheated during expansion), "wet" (negative slope, expansion can produce liquid droplets), or "isentropic" (vertical slope). Dry fluids are preferred for ORC because they eliminate the risk of turbine blade erosion from liquid droplets and reduce the need for superheating [JOUHARA].

**GWP and regulatory pressure:** Several legacy ORC working fluids (R245fa, R134a) have high global warming potential. The EU F-gas regulation and Kigali Amendment are driving replacement with low-GWP alternatives (R1233zd(E), R1234yf, natural hydrocarbons). Fluid selection increasingly must balance thermodynamic performance against environmental and regulatory constraints [EPA-ESTAR for refrigerant context].

### 6.3 Efficiency and Performance

ORC systems achieve net electrical efficiencies (electricity output divided by waste heat input, minus parasitic loads) that depend primarily on the heat source temperature and the temperature difference available for the cycle:

| Heat Source Temperature | Typical Net ORC Efficiency | Notes |
|---|---|---|
| 80--100 C | 4--8% | Marginal economics; large heat exchangers needed |
| 100--150 C | 8--12% | Sweet spot for geothermal and many industrial sources |
| 150--250 C | 10--15% | Cost-effective for cement, glass, metal industries |
| 250--400 C | 12--20% | Approaches small steam turbine territory; fluid stability limits apply |

[DOE-WHR, JOUHARA]

These efficiencies are well below Carnot limits (which range from roughly 16% at 80 C to 55% at 400 C, with a 25 C sink). The gap reflects real-world irreversibilities: finite heat exchanger area, expander isentropic efficiency (70 to 85% for turbines, 60 to 75% for scroll/screw expanders), pump work, and pressure drops. Nonetheless, the ORC captures energy that would otherwise be entirely wasted.

### 6.4 Expander Technologies

Two expander classes dominate ORC installations:

**Turbine expanders** (radial inflow or axial flow) are preferred for larger systems (above 100 kW). They offer higher isentropic efficiency (80 to 88%), can handle large volume flow ratios, and have long service lives with proper bearing design. Their cost per kW decreases with scale.

**Volumetric expanders** (scroll, screw, piston) are preferred for smaller systems (1 to 100 kW). They tolerate liquid ingestion better than turbines, have simpler construction, and are manufactured in large quantities for the refrigeration industry (which uses the same machine types as compressors, run in reverse). Isentropic efficiency is typically 60 to 75%.

### 6.5 ORC vs. Steam Rankine: When Does ORC Win?

| Criterion | ORC Advantage | Steam Rankine Advantage |
|---|---|---|
| Heat source temperature | Below 350 C (steam pressures too low for efficient expansion) | Above 350 C (steam turbines well-developed and efficient) |
| System size | Below 5 MW (steam turbine minimum economic scale is larger) | Above 10 MW |
| Operator skill | Sealed system, low maintenance, minimal water treatment | Requires licensed boiler operators in many jurisdictions |
| Part-load performance | Good (some ORC systems maintain efficiency down to 30% load) | Poor below 50% load |
| Working fluid safety | Some fluids are flammable or mildly toxic; contained in sealed loop | Water is inherently safe |
| Capital cost per kW | Higher at large scale | Lower at large scale (economies of scale in steam turbines) |

### 6.6 Installed Base and Market

The global installed ORC capacity exceeds 4 GW as of 2025, spread across geothermal (dominant), biomass combined heat and power, and industrial WHR applications. Major manufacturers include Turboden (Mitsubishi), ORMAT, Exergy International, Againity, and Enertime. System costs range from $2,000 to $5,000 per kW installed depending on scale, heat source temperature, and site-specific factors [JOUHARA].

### 6.7 Real-World ORC WHR Deployments

The following examples illustrate the range of ORC waste heat recovery installations:

**Cement industry:** HeidelbergCement and other major producers have installed ORC systems on clinker cooler and kiln exhaust streams. A typical cement plant ORC installation recovers 5 to 15 MW of electricity from exhaust gas at 250 to 400 C, displacing 10 to 20% of the plant's purchased electricity. The payback period is 3 to 6 years depending on local electricity prices and carbon costs. Turboden (a Mitsubishi subsidiary) has delivered over 50 cement ORC installations worldwide [JOUHARA].

**Steel industry:** ArcelorMittal and Tata Steel have piloted ORC systems on electric arc furnace (EAF) exhaust and continuous casting cooling loops. The challenge in steelmaking is the extreme variability of the heat source -- an EAF operates in batch mode with exhaust temperatures swinging from ambient to above 1,000 C within each heat cycle. ORC systems must tolerate rapid thermal transients or be buffered by a thermal oil intermediate loop that dampens temperature swings.

**Marine applications:** The International Maritime Organization's energy efficiency regulations have driven interest in ORC systems for recovering waste heat from ship diesel engine exhaust. A large container ship's main engine exhaust at 250 to 350 C can support a 500 kW to 2 MW ORC system, reducing fuel consumption by 3 to 5%. Opcon Marine and Viking Heat Engines have delivered commercial marine ORC installations operating in the North Sea and Baltic.

**Geothermal (technology transfer context):** The largest ORC installations are geothermal binary plants, where the technology was first commercialized. ORMAT alone has installed over 3 GW of geothermal ORC capacity. The operational lessons -- working fluid management, expander bearing reliability, condenser fouling in wet climates -- transfer directly to industrial WHR applications. PNW geothermal development at Newberry Crater (AltaRock) uses the same ORC technology base [ALTAROCK].

### 6.8 Operational Challenges

ORC systems in WHR service face several operational challenges distinct from geothermal or biomass applications:

- **Variable heat source** -- industrial exhaust temperatures and flow rates vary with production schedules, batch cycles, and seasonal demand. The ORC must either tolerate part-load operation efficiently or be paired with a thermal buffer (thermal oil loop, PCM storage) to smooth input variations.
- **Fouling and corrosion** -- industrial exhaust may carry particulates, acid gases, or condensable organics that foul the evaporator. Intermediate heat transfer loops (thermal oil at 200 to 350 C) isolate the ORC working fluid from direct contact with the exhaust, at the cost of an additional temperature drop and heat exchanger.
- **Working fluid degradation** -- organic fluids decompose at elevated temperatures. Siloxanes are stable to approximately 350 C, toluene to approximately 400 C, and R245fa to approximately 200 C. Operating above the fluid's thermal stability limit causes molecular breakdown, producing non-condensable gases that accumulate in the condenser and reduce cycle efficiency. Periodic fluid analysis and replacement is necessary.
- **Ambient temperature sensitivity** -- ORC condenser performance depends on ambient temperature (air-cooled) or cooling water temperature (water-cooled). In PNW climates, cool winters improve ORC efficiency but hot summer days reduce it. Annual average performance is favorable compared to desert or tropical installations.

---

## 7. Thermoelectric Generators (TEGs) -- Deep Dive

### 7.1 The Seebeck Effect

A thermoelectric generator converts heat directly into electricity using the Seebeck effect: when a temperature difference is maintained across a junction of two dissimilar conducting or semiconducting materials, a voltage is produced proportional to the temperature gradient. There are no moving parts, no working fluids, no turbines, and no phase changes. The device is entirely solid-state.

This simplicity is the TEG's primary advantage and its primary limitation. The absence of moving parts means zero maintenance, silent operation, and indefinite service life (decades in spacecraft applications). But the conversion efficiency is low -- typically 5 to 8% for commercial devices, compared to 10 to 20% for ORC systems operating at similar temperatures [DOE-WHR, CEC-WHR].

### 7.2 Materials

TEG performance is governed by the dimensionless figure of merit ZT of the thermoelectric material, defined as:

```
ZT = (S^2 * sigma * T) / kappa
```

where S is the Seebeck coefficient (voltage per unit temperature difference), sigma is electrical conductivity, T is absolute temperature, and kappa is thermal conductivity. A good thermoelectric material has a high Seebeck coefficient, high electrical conductivity (to minimize resistive losses), and low thermal conductivity (to maintain the temperature gradient). These requirements are partially contradictory -- good electrical conductors tend to be good thermal conductors -- so materials optimization is a delicate balance.

| Material Class | Temperature Range | Typical ZT | Status |
|---|---|---|---|
| Bismuth telluride (Bi2Te3) | 20--250 C | 0.8--1.2 | Commercial standard for low-temp TEGs |
| Lead telluride (PbTe) | 200--600 C | 1.0--1.5 | Commercial; toxicity concerns (lead, tellurium) |
| Skutterudites (CoSb3-based) | 200--600 C | 1.0--1.7 | Advanced; rare-earth filled variants improve ZT |
| Half-Heusler alloys (TiNiSn, ZrNiSn) | 300--700 C | 0.8--1.5 | Promising; earth-abundant elements; mechanically robust |
| Silicon-germanium (SiGe) | 600--1,000 C | 0.6--1.0 | Space-proven (RTGs on Voyager, Curiosity); expensive |
| Tin selenide (SnSe) | 300--700 C | 2.0--2.8 (single crystal) | Laboratory record ZT; challenging to manufacture at scale |
| Oxide thermoelectrics | 300--900 C | 0.3--0.5 | Low cost, stable in air; lower performance |

The DOE and the California Energy Commission have identified TEGs as among the most actively researched WHR technologies, driven by the potential for zero-maintenance operation in harsh industrial environments where rotating equipment is difficult to install or maintain [DOE-WHR, CEC-WHR].

### 7.3 System Architecture

A practical TEG waste heat recovery system consists of:

1. **Hot-side heat exchanger** -- extracts heat from the waste stream and delivers it to the hot face of the TEG modules
2. **TEG module array** -- stacked semiconductor pellet pairs (p-type and n-type) connected electrically in series and thermally in parallel
3. **Cold-side heat sink** -- removes heat from the cold face to maintain the temperature gradient (air fins, water cooling, or heat pipes)
4. **DC-DC converter or inverter** -- conditions the TEG's variable DC output for load or grid connection
5. **Clamping and thermal interface** -- mechanical pressure and thermal grease/pads ensure good thermal contact on both faces

The hot-side and cold-side thermal resistances are as important as the TEG material itself. A TEG module with a ZT of 1.5 will deliver poor performance if the heat exchanger cannot maintain a large temperature difference across the module. System-level optimization requires co-design of the heat exchangers and the thermoelectric elements.

### 7.4 Applications

TEGs are best suited for WHR applications where one or more of the following conditions hold:

- **Remote or inaccessible locations** where maintenance is impractical (pipeline cathodic protection, remote sensors, offshore platforms)
- **Harsh environments** where rotating equipment would fail (high vibration, corrosive atmospheres, extreme temperatures)
- **Small power demands** (watts to low kilowatts) where ORC minimum scale is too large
- **Automotive exhaust** where packaging constraints favor thin, flat devices (experimental; Ford and BMW have tested prototypes generating 500 to 1,000 W from exhaust heat)
- **Solid oxide fuel cell (SOFC) exhaust** -- the 600 to 800 C SOFC exhaust provides an excellent hot-side temperature for TEGs, and the combined system improves overall fuel-to-electricity efficiency (see Module D cross-reference, B-D-TEG)

### 7.5 Current Limitations and Research Directions

The fundamental barrier to wider TEG deployment is cost per watt. At current ZT values and manufacturing costs, TEGs produce electricity at $20 to $50 per watt -- an order of magnitude more expensive than ORC for comparable waste heat sources [DOE-WHR]. Research directions that could change this include:

- **Nanostructured materials** -- quantum dot superlattices, nanowire arrays, and nanocomposites that reduce thermal conductivity without proportionally reducing electrical conductivity, achieving ZT above 2.0 in the laboratory
- **Additive manufacturing** -- 3D printing of thermoelectric elements to reduce fabrication costs and enable complex geometries matched to specific exhaust stream shapes
- **Module-level optimization** -- segmented legs that stack different materials optimized for different temperature ranges across the same module, capturing more of the available temperature gradient
- **Flexible TEGs** -- polymer-based or thin-film devices that conform to curved surfaces (pipes, exhaust manifolds) for easier retrofit installation

---

## 8. Heat Pipe Systems -- Deep Dive

### 8.1 Operating Principle

A heat pipe is a passive two-phase heat transfer device. It consists of a sealed tube or vessel containing a small quantity of working fluid (water, methanol, acetone, sodium, or other fluids depending on operating temperature). Heat applied to one end (the evaporator section) vaporizes the working fluid. The vapor travels to the cooler end (the condenser section) where it releases latent heat and condenses back to liquid. The liquid returns to the evaporator by gravity (in a thermosyphon) or by capillary action through a wick structure (in a traditional heat pipe), completing the cycle.

The effective thermal conductivity of a heat pipe can be 100 to 1,000 times that of solid copper, making heat pipes extraordinarily efficient at transporting heat over distances of centimeters to meters with minimal temperature drop. They require no pumps, no external power, and no control systems -- the phase-change cycle is self-sustaining as long as a temperature difference exists between the evaporator and condenser sections.

### 8.2 Heat Pipe Types for WHR

| Heat Pipe Type | Operating Principle | Temperature Range | WHR Application |
|---|---|---|---|
| **Gravity-assisted thermosyphon** | Liquid return by gravity; evaporator below condenser | -40 to 400+ C (water-based); to 1,000+ C (sodium) | Exhaust gas heat recovery in vertical or tilted configurations |
| **Capillary-wick heat pipe** | Liquid return by capillary action in sintered metal or mesh wick | -40 to 250 C (typical) | Orientation-independent heat transport; electronics cooling; space-constrained WHR |
| **Loop heat pipe (LHP)** | Separates liquid and vapor flow paths for longer transport distances | -40 to 300 C | Heat recovery from distributed sources; building integration |
| **Pulsating (oscillating) heat pipe (PHP)** | Liquid slugs and vapor bubbles oscillate in a serpentine capillary tube | 20 to 200 C | Compact, low-cost heat recovery; no wick needed |

### 8.3 The P-HEX Project: California Heat Pipe Demonstration

The California Energy Commission funded the P-HEX (Passive Heat Exchanger) project (CEC-500-2025-001), a demonstration of heat pipe-based waste heat recovery in the food and beverage processing sector. The project, completed in the 2024-2025 timeframe, installed heat pipe heat exchangers at brewery and winery pilot sites in California with the following results [CEC-WHR]:

- **Heat exchanger effectiveness:** 80% -- meaning 80% of the thermodynamically available heat transfer was achieved in practice
- **Target GHG emission reduction:** 25% for the California industrial sector if heat pipe WHR were widely deployed across food and beverage processing
- **Replicability:** The P-HEX design was explicitly intended to be standardized and replicable, with modular heat pipe bundles that can be configured for different exhaust stream temperatures and flow rates

These results are significant for the PNW context because the Pacific Northwest has a substantial food and beverage processing industry (wine, craft beer, dairy, seafood) with thermal profiles similar to the California pilot sites. The P-HEX design is directly transferable (see Section 13).

### 8.4 Advantages and Limitations

**Advantages:**
- Entirely passive -- no pumps, no electricity, no controls
- High effective thermal conductivity
- Self-contained and sealed -- minimal maintenance
- Can transfer heat across temperature ranges from cryogenic to above 1,000 C (with appropriate working fluids)
- Can be arranged in arrays to form heat pipe heat exchangers (HPHEs) for gas-to-gas, gas-to-liquid, or liquid-to-liquid recovery
- Intrinsic failure mode is graceful -- a failed heat pipe simply stops transferring heat; it does not leak process fluid into the waste stream

**Limitations:**
- Capillary limit constrains maximum heat flux per pipe
- Gravity-assisted types require specific orientation (evaporator below condenser)
- Working fluid selection limits temperature range (water: 30 to 250 C; sodium: 600 to 1,100 C; gap between 250 and 600 C is covered by potassium or cesium, which are more exotic)
- Heat pipe heat exchangers have larger footprint than compact plate heat exchangers for equivalent duty
- Startup transients in high-temperature heat pipes (sodium, potassium) can cause temperature oscillations

---

## 9. Phase-Change Materials (PCM) -- Deep Dive

### 9.1 The Storage Problem

Many industrial waste heat sources are intermittent or variable -- batch furnaces, shift-based operations, solar-thermal systems, and processes with cyclic heating and cooling stages. The heat is available when the process runs, not necessarily when it is needed. Phase-change materials address this mismatch by storing thermal energy as latent heat during the phase transition (typically solid-to-liquid melting), then releasing it during solidification when the heat is demanded.

The key advantage of PCM over sensible heat storage (hot water tanks, rock beds) is energy density. The latent heat of fusion is typically 5 to 14 times the sensible heat capacity of the same material per degree of temperature change. A PCM thermal store can be physically smaller and maintain a more constant output temperature than a sensible heat store of equivalent capacity.

### 9.2 PCM Classification

| PCM Category | Temperature Range | Latent Heat | Examples | Advantages | Limitations |
|---|---|---|---|---|---|
| **Paraffin waxes** | 20--70 C | 150--250 kJ/kg | n-Octadecane (28 C), n-Eicosane (37 C), paraffin blends | Chemically inert, non-corrosive, long cycle life, widely available | Low thermal conductivity (0.2 W/mK); flammable |
| **Salt hydrates** | 15--120 C | 150--300 kJ/kg | CaCl2*6H2O (29 C), Na2SO4*10H2O (32 C), MgCl2*6H2O (117 C) | Higher thermal conductivity than paraffins; non-flammable; cheap | Supercooling; phase segregation over cycles; corrosive to some metals |
| **Fatty acids** | 20--70 C | 150--200 kJ/kg | Stearic acid (69 C), palmitic acid (63 C), lauric acid (44 C) | Bio-derived; good cycling stability; non-toxic | Mildly corrosive; cost higher than paraffins |
| **Sugar alcohols** | 90--190 C | 200--350 kJ/kg | Erythritol (118 C), xylitol (94 C), mannitol (166 C) | Very high latent heat; bio-compatible | Supercooling; limited cycle data; hygroscopic |
| **Molten salts** | 200--600 C | 100--200 kJ/kg | Solar salt (NaNO3/KNO3, 220 C), LiNO3 (254 C), NaCl/KCl eutectic (657 C) | Proven at CSP plant scale; high temperature capability | Corrosive at temperature; containment challenges; freeze protection needed |
| **Metallic PCMs** | 100--900 C | 30--80 kJ/kg (but high volumetric density) | Gallium (30 C), tin (232 C), aluminum (660 C), Al-Si eutectic (577 C) | Extremely high thermal conductivity; fast charge/discharge | Dense and heavy; expensive (gallium); containment with reactive metals |

### 9.3 Thermal Conductivity Enhancement

The fundamental limitation of organic PCMs (paraffins, fatty acids) is their low thermal conductivity -- typically 0.2 to 0.3 W/mK in the liquid phase. This means a large PCM thermal store charges and discharges slowly, with the material near the heat exchanger surface melting quickly while the material in the interior remains solid. Engineering solutions include:

- **Metal foam infiltration** -- filling aluminum or copper foam (90 to 97% porosity) with PCM increases effective conductivity to 3 to 15 W/mK
- **Graphite matrices** -- expanded natural graphite or graphite nanoplatelets mixed with PCM achieve effective conductivities of 5 to 30 W/mK
- **Finned heat exchangers** -- metal fins extending into the PCM volume reduce the conduction path length
- **Encapsulation** -- micro-encapsulating PCM in polymer or metal shells (1 to 1,000 micrometer diameter) increases the surface-to-volume ratio and prevents phase segregation in salt hydrates
- **Carbon nanotube or graphene additives** -- nanoparticle loading of 1 to 5% by weight can double effective thermal conductivity, though dispersion stability over repeated cycles remains a research challenge

### 9.4 PCM in WHR Systems

In a waste heat recovery context, PCM storage serves several roles:

1. **Buffer storage** -- absorbing waste heat during peak production hours and releasing it during off-peak periods for space heating, hot water, or process preheating
2. **Load leveling for ORC** -- smoothing a variable-temperature waste heat source to provide a more constant input to an ORC evaporator, improving cycle efficiency and reducing thermal stress on the expander
3. **Emergency thermal reserve** -- maintaining critical process temperatures during brief interruptions in the waste heat source
4. **Integration with heat pumps** -- storing low-grade waste heat as a PCM "battery" that provides a stable source temperature for a heat pump operating during off-peak electricity hours (see Module A cross-reference, B-A-PCM)

### 9.5 Cycle Life and Degradation

PCM systems must endure thousands of melt-freeze cycles over their service life. Paraffin waxes are the most stable, with commercial products rated for 10,000+ cycles with less than 10% degradation in latent heat capacity. Salt hydrates are more problematic -- phase segregation (where the anhydrous salt settles to the bottom of the container) and supercooling (where the material fails to crystallize at the expected freezing point) are well-documented failure modes that require nucleating agents and thickeners to mitigate. Metallic PCMs and molten salts face corrosion and containment challenges that limit their cycle life without appropriate vessel materials.

---

## 10. Kalina Cycle

### 10.1 Operating Principle

The Kalina cycle is a thermodynamic power cycle that uses a binary mixture of ammonia and water as the working fluid, rather than a pure substance. The key advantage of a mixture is that it boils and condenses over a temperature range (non-isothermal phase change) rather than at a single temperature. This allows the evaporator to better match the temperature profile of a cooling waste heat source, reducing the average temperature difference between the heat source and the working fluid and thereby reducing exergy destruction.

In a pure-substance cycle (steam Rankine or ORC), the boiling process occurs at constant temperature under constant pressure. If the waste heat source is cooling from 150 C to 80 C as it transfers heat to the working fluid, the working fluid boils at a single temperature -- say, 100 C -- and there is a large temperature mismatch at the hot end of the evaporator. The Kalina cycle's ammonia-water mixture boils progressively from a lower temperature (ammonia-rich) to a higher temperature (water-rich), tracking the declining temperature of the heat source more closely.

### 10.2 Comparison with ORC

| Criterion | Kalina Cycle | ORC |
|---|---|---|
| Working fluid | Ammonia-water mixture (variable composition) | Pure organic compound |
| Evaporation profile | Non-isothermal (gliding temperature) | Isothermal (at saturation temperature) |
| Thermodynamic match to variable-temp source | Better (reduced exergy destruction in evaporator) | Worse (constant boiling temperature) |
| System complexity | Higher (separator, multiple pressure levels, composition control) | Lower (standard Rankine layout) |
| Efficiency advantage | 10--20% higher than ORC for matching heat sources (theoretical and some measured) | Simpler and more proven at commercial scale |
| Installed base | Limited (Husavik geothermal plant in Iceland, 2 MW; several industrial demos) | Large (4+ GW globally) |
| Working fluid toxicity | Ammonia is toxic and pungent (but widely handled industrially) | Varies (some fluids flammable or mildly toxic) |

The Kalina cycle has found its primary niche in geothermal power where the heat source temperature declines as the geothermal fluid cools, and in certain industrial WHR applications where the exhaust gas temperature drops significantly across the evaporator. For constant-temperature heat sources (condensing steam, isothermal reactions), the Kalina cycle's advantage disappears.

### 10.3 Practical Status

Despite theoretical advantages, the Kalina cycle has not achieved broad commercial deployment. The additional system complexity (distillation/separation equipment, multiple pressure levels, composition monitoring) increases capital cost and operational complexity relative to ORC. Most WHR project developers default to ORC unless the specific thermal profile of the waste heat source creates a compelling thermodynamic case for the Kalina cycle [JOUHARA].

### 10.4 Where Kalina Still Makes Sense

The Kalina cycle retains advantages in specific niches:

- **Geothermal brines with moderate temperatures (100 to 150 C)** where the brine cools significantly across the heat exchanger, creating a large temperature glide that the ammonia-water mixture can match
- **Combined heat and power applications** where the cycle must simultaneously produce electricity and deliver heat at a specific temperature -- the variable ammonia concentration allows tuning the condensation temperature to match the heat demand
- **Waste heat streams with large temperature drops** -- for example, kiln exhaust cooling from 300 C to 100 C across the evaporator, where a fixed-boiling-point ORC fluid would suffer a large average temperature mismatch at the hot end

---

## 11. Mechanical Vapor Recompression (MVR)

### 11.1 Operating Principle

Mechanical vapor recompression takes low-pressure steam or vapor generated by an evaporation or drying process and compresses it mechanically (via centrifugal or positive-displacement compressor) to a higher pressure and corresponding higher saturation temperature. The recompressed vapor is then used as the heating medium for the same evaporation process, replacing fresh boiler steam.

The energy input is only the mechanical work of compression -- typically 30 to 60 kJ per kg of steam recompressed -- compared to the 2,200 to 2,700 kJ per kg of latent heat carried by the steam. This gives MVR an effective coefficient of performance (COP) of 5 to 10 for the evaporation process, meaning one unit of electrical energy in the compressor replaces 5 to 10 units of thermal energy from the boiler [DOE-WHR].

### 11.2 Applications

MVR is most effective where:

- **Large-scale evaporation** is the primary energy consumer -- desalination, dairy processing (milk concentration), sugar refining, paper pulp concentration, chemical distillation
- **The required temperature lift is small** -- MVR works best when the vapor needs to be raised by only 5 to 15 C (a pressure ratio of 1.1 to 1.5), keeping compressor power low
- **Electricity is cheaper than thermal fuel** -- MVR substitutes electrical energy for thermal energy, so the economics depend on the local electricity-to-fuel price ratio
- **Continuous operation** -- MVR systems have high capital costs and are most economic at high utilization factors (above 6,000 hours per year)

### 11.3 MVR in Food Processing

In the PNW food processing sector, MVR is relevant for:

- **Dairy processing** -- concentrating milk and whey before drying; Oregon and Washington have significant dairy industries
- **Fruit juice concentration** -- reducing water content before shipping or further processing
- **Craft brewing** -- wort boiling generates large volumes of low-pressure steam that MVR could partially recapture (though the batch nature of brewing limits MVR economics compared to continuous processes)
- **Seafood processing** -- surimi production and fish meal rendering involve evaporation stages

MVR competes with multi-effect evaporation (which uses waste steam from one stage to heat the next at lower pressure) and thermal vapor recompression (TVR, which uses a steam jet ejector instead of a mechanical compressor). MVR has the highest COP but the highest capital cost; TVR has the lowest capital cost but the lowest COP; multi-effect evaporation falls in between [DOE-WHR].

---

## 12. Decision Framework: Selecting WHR Technology

### 12.1 The Kosmadakis Framework

A December 2025 study published in ScienceDirect (lead author: Kosmadakis) developed a multi-criteria decision framework for selecting among 13 heat-to-heat waste heat recovery technologies [KOSMADAKIS]. The framework evaluated technologies against criteria including:

- Source temperature and temperature lift required
- Heat recovery effectiveness
- Technology maturity and commercial availability
- Capital and operating costs
- Maintenance complexity
- Retrofit feasibility for existing plants
- Environmental impact (refrigerant GWP, noise, footprint)

### 12.2 Key Findings

The Kosmadakis framework found that **heat pumps and conventional heat exchangers dominated** for the most common industrial WHR scenario: medium-temperature exhaust gas (150 to 300 C) serving a low-temperature heat demand (40 to 90 C space or process heating). In this scenario:

1. **Heat exchangers** (plate, shell-and-tube) provided the simplest and most cost-effective solution when the source and sink temperatures were compatible without temperature upgrading
2. **Heat pumps** (vapor compression and absorption) ranked highest when the waste heat needed to be upgraded in temperature -- converting 50 C cooling water to 80 C process heating, for example
3. **ORC** ranked highest when the goal was electricity generation rather than heat delivery
4. **PCM thermal storage** ranked highest when temporal mismatch between heat availability and demand was the primary challenge

The framework explicitly noted that no single technology dominates all scenarios -- the optimal choice depends on the specific combination of source temperature, sink temperature, heat quantity, temporal profile, available space, and economic context [KOSMADAKIS].

### 12.3 Cost and Payback Comparison

The following table summarizes typical capital costs and payback periods for the primary WHR technologies, based on industry data and DOE estimates. These figures vary significantly with scale, site conditions, and local energy prices -- the ranges shown represent the middle 50% of reported installations.

| Technology | Capital Cost Range | Typical Payback Period | Key Cost Driver |
|---|---|---|---|
| Recuperator | $5--$30/kW recovered | 1--3 years | Materials (alloy grade vs. exhaust chemistry) |
| Economizer | $10--$40/kW recovered | 1--2 years | Acid dew point management; condensing vs. non-condensing |
| Shell-and-tube HX | $20--$80/kW recovered | 1--4 years | Pressure rating, materials, fouling allowance |
| Plate HX | $15--$60/kW recovered | 1--3 years | Gasket materials, plate count, pressure |
| Heat pipe HX (P-HEX type) | $30--$100/kW recovered | 2--5 years | Custom fabrication; fewer moving parts offset maintenance |
| ORC system | $2,000--$5,000/kWe | 3--7 years | Scale (cost/kW drops sharply above 500 kWe); working fluid |
| Kalina cycle | $3,000--$7,000/kWe | 5--10 years | System complexity; limited vendor competition |
| TEG system | $20,000--$50,000/kWe | 10+ years (niche value justifies) | Thermoelectric material cost; heat exchanger design |
| MVR system | $200--$500/kW evaporative capacity | 2--4 years | Compressor type; motor efficiency; continuous vs. batch |
| Absorption heat pump | $300--$800/kW heating | 3--7 years | Driving heat temperature; cooling tower requirements |
| PCM thermal storage | $20--$100/kWh stored | 3--8 years | PCM material; encapsulation; thermal conductivity enhancement |

[DOE-WHR, JOUHARA, KOSMADAKIS]

Note: costs for heat-to-heat technologies are expressed per kW of recovered heat, while costs for heat-to-power technologies are expressed per kW of electrical output. Direct comparison requires converting to a common basis using local energy prices.

### 12.4 Decision Matrix for PNW Applications

| Application | Source Temp | Demand | Recommended Primary Technology | Alternative |
|---|---|---|---|---|
| Brewery exhaust gas to process hot water | 150--250 C | 60--80 C hot water | Heat pipe heat exchanger (P-HEX type) | Plate heat exchanger |
| Data center liquid cooling to greenhouse heating | 40--60 C | 25--35 C growing space | Direct heat exchange (water loop) | Heat pump (if higher temp needed) |
| Pulp mill recovery boiler exhaust to power | 300--450 C | Electricity | ORC (200--400 C range) or small steam turbine | HRSG if scale warrants |
| Aluminum smelter pot exhaust to district heating | 100--300 C | 70--90 C district heating supply | Economizer + heat exchanger | Absorption heat pump for temp upgrade |
| Seafood processing refrigeration condenser to water preheating | 35--50 C | 40--60 C preheated water | Heat pump (COP 4--6) | Direct exchange if temp compatible |
| Intermittent kiln exhaust to continuous process heating | 200--400 C (batch) | 100--150 C (continuous) | ORC + PCM buffer storage | Heat pipe + PCM |

---

## 13. PNW Industrial Context

### 13.1 Food and Beverage Processing

The Pacific Northwest supports a large and diverse food and beverage processing sector with significant low-grade waste heat opportunities:

**Wine production** -- Oregon's Willamette Valley and Washington's Columbia Valley are major wine-producing regions. Winery operations generate waste heat from fermentation (exothermic, 20 to 35 C), pasteurization (60 to 85 C), and barrel/tank washing (hot water at 60 to 80 C). Individual winery thermal loads are modest (tens to hundreds of kW), but the P-HEX heat pipe technology demonstrated in California wineries (80% heat exchanger effectiveness) is directly applicable [CEC-WHR].

**Craft brewing** -- Washington and Oregon rank among the top U.S. states for craft brewery density. The brewing process generates waste heat from wort boiling (100 C exhaust steam), spent grain drying, pasteurization, and refrigeration condensers. A typical craft brewery (10,000 to 50,000 barrels per year) rejects 500 to 2,000 MWh of thermal energy annually. Recovery technologies include heat exchangers for wort cooling (pre-heating brew water), MVR for wort boiling energy recovery, and heat pump integration for simultaneous heating and cooling needs.

**Dairy processing** -- Oregon and Washington dairy operations include milk pasteurization (72 to 85 C), whey concentration (evaporation at 50 to 70 C), and clean-in-place (CIP) hot water systems (80 to 95 C). MVR is commercially deployed in dairy evaporation worldwide and directly applicable to PNW dairy plants.

**Seafood processing** -- Alaska, Washington, and Oregon seafood processing generates waste heat from cooking (steam at 100 to 130 C), smoking (50 to 80 C), and refrigeration systems (condenser heat at 35 to 50 C). The seafood processing season is highly concentrated (summer and fall for salmon), creating temporal peaks that PCM buffering could help smooth.

### 13.2 Pulp and Paper Industry

Washington and Oregon have historically been major pulp and paper producing states, though the industry has contracted from its peak. Remaining mills generate substantial medium-grade waste heat:

- **Recovery boiler exhaust** (250 to 400 C) -- the primary energy source in kraft pulping, where black liquor combustion generates steam. Additional heat recovery from the exhaust stack is possible via economizers or ORC.
- **Paper machine dryer exhaust** (100 to 200 C) -- large volumes of moist, warm air exhausted from the drying section. Heat recovery is complicated by the high moisture content (risk of condensation and biological growth in heat exchangers) but economically significant because drying is the largest energy consumer in papermaking.
- **Effluent water** (40 to 60 C) -- large volumes of warm process water discharged to treatment. Heat recovery via heat exchangers can preheat incoming fresh water.

### 13.3 Aluminum Smelting

The Pacific Northwest was historically the center of U.S. aluminum smelting, attracted by abundant cheap hydroelectric power from the Columbia River system. While most PNW smelters have closed (Alcoa Wenatchee closed 2015, Columbia Falls closed 2009), the remaining operations and the industrial heritage are relevant to understanding WHR potential:

- Aluminum smelting pot exhaust exits at 100 to 200 C with high volume flow
- The exhaust carries fluoride compounds that require scrubbing, complicating heat recovery
- Where smelters operated near population centers, the waste heat could have served district heating -- a missed opportunity that informs current planning for any future industrial facilities

### 13.4 Data Centers

The Pacific Northwest has become a major data center market, driven by:

- **Cheap electricity** -- Washington's hydroelectric rates are among the lowest in the nation (industrial rates below $0.04/kWh in some BPA customer service areas) [EIA-WA]
- **Cool climate** -- annual average temperatures in central Oregon and eastern Washington allow extensive free cooling (economizer hours), reducing cooling energy consumption
- **Fiber connectivity** -- submarine cable landings and terrestrial fiber routes through the region
- **Major operators** -- Microsoft, Google, Amazon, Apple, and Meta all operate or are building data center campuses in Oregon and Washington

The waste heat opportunity is enormous in aggregate. A 100 MW data center campus produces approximately 100 MW of heat at 30 to 55 C (depending on cooling architecture). Current practice rejects this heat entirely. Recovery options include:

- **District heating supply** -- viable where data centers are near residential or commercial developments. Stockholm (Sweden) and Helsinki (Finland) have demonstrated data center district heating at scale.
- **Greenhouse integration** -- co-locating agricultural greenhouses with data centers to use reject heat for year-round growing. Pilot projects exist in the Netherlands and Norway.
- **Heat pump source** -- using data center cooling water (40 to 55 C) as the source for industrial heat pumps that deliver 70 to 90 C process heating, with COP values of 4 to 6 enabled by the elevated source temperature [IEA-HP]
- **Aquaculture** -- warm water for fish farming (tilapia, shrimp) -- demonstrated in Nordic projects

The barrier to data center WHR is rarely technical -- the heat is clean, consistent, and predictable. The barrier is geographic and economic: data centers are often sited in remote locations (for land cost and power access) far from heat consumers, and the capital cost of piping networks and heat exchangers must compete against the near-zero marginal cost of simply rejecting the heat via cooling towers.

### 13.5 PNW WHR Economic Context

The Pacific Northwest's energy economics create a distinctive WHR landscape compared to other U.S. regions:

**Low electricity prices favor electrical WHR technologies.** Washington and Oregon industrial electricity rates are among the lowest in the nation due to the Columbia River hydroelectric system [EIA-WA]. This makes electrically-driven technologies (heat pumps, MVR) more attractive relative to fuel-fired alternatives. An MVR system with a COP of 8 consuming $0.04/kWh electricity displaces thermal energy at an effective cost of $1.40/MMBtu -- far below natural gas prices in most markets.

**Carbon policy pressure is increasing.** Washington's Climate Commitment Act (cap-and-invest program, operational since 2023) places a price on industrial carbon emissions, adding $10 to $25 per ton of CO2 to the cost of burning fossil fuels for process heat. This carbon cost improves the payback period for all WHR investments by increasing the value of avoided fuel consumption. Oregon is considering similar legislation.

**Seasonal alignment.** PNW industrial waste heat is available year-round, but the heating demand for buildings peaks in winter. This seasonal alignment is favorable for WHR-to-district-heating schemes -- the heat is needed when the weather is coldest and buildings consume the most energy. In summer, waste heat that cannot serve building heating needs must find alternative sinks (absorption cooling, ORC power generation, thermal storage).

**Grid integration value.** Electricity generated by ORC or TEG from waste heat displaces grid electricity. In the PNW, marginal grid electricity during winter peak periods is often supplied by natural gas peaker plants at $40 to $80/MWh. WHR electricity generated during these periods has high avoided-cost value, even though average PNW electricity prices are low.

### 13.6 Emerging Industrial Heat Sources

Several growing PNW industries present future WHR opportunities:

- **Cannabis processing** -- indoor growing facilities in Oregon and Washington consume large amounts of electricity for lighting and HVAC, with significant waste heat from lighting systems and dehumidification
- **Semiconductor manufacturing** -- Intel's operations in Hillsboro, Oregon, and other chip fabrication facilities generate waste heat from cleanroom HVAC and process cooling
- **Battery manufacturing** -- the growing EV supply chain is attracting battery manufacturing to the PNW, with electrode drying and formation processes generating medium-grade waste heat

---

## 14. Integration with Other Modules

### 14.1 Module A: HVAC and Heat Pumps (B-A-HP)

Waste heat recovery and heat pump technology are natural complements. A heat pump upgrades the temperature of a low-grade waste heat stream to make it useful for space heating or process heating. The waste heat provides an elevated source temperature compared to ambient air, which improves the heat pump's COP and capacity:

- Ambient air at 5 C as heat pump source: COP approximately 2.5 to 3.5
- Waste heat at 40 C as heat pump source: COP approximately 4.5 to 6.5
- Waste heat at 60 C as heat pump source: COP approximately 6.0 to 10.0

[IEA-HP, HOEG]

This coupling is especially relevant for PNW data center waste heat, where 40 to 55 C cooling water can serve as a heat pump source for nearby building heating or industrial process heat. The emerging field of high-temperature heat pumps (delivering up to 150 C, as discussed in Module A) further expands the range of waste heat that can be upgraded to useful process temperatures [HOEG].

### 14.2 Module C: Catalytic Conversion (B-C-CAT)

Catalytic converters in automotive applications and industrial catalytic reactors both generate waste heat. Automotive catalytic converters operate at 300 to 900 C and have been studied as TEG heat sources (Ford and BMW exhaust TEG prototypes). Industrial catalytic processes (ammonia synthesis, methanol production, petroleum cracking) generate large quantities of waste heat at temperatures that vary with the reaction -- see Module C for specific catalyst operating conditions and the potential for waste heat recovery from catalytic reactor exhaust.

### 14.3 Module D: Fuel Cell Technology (B-D-FC)

Fuel cells generate electricity with waste heat as a byproduct. The waste heat temperature depends on the fuel cell type:

| Fuel Cell Type | Operating Temp | Waste Heat Temp | WHR Technology Match |
|---|---|---|---|
| PEM (Proton Exchange Membrane) | 60--80 C | 50--70 C | Heat pump source, direct space heating |
| Phosphoric Acid (PAFC) | 150--200 C | 120--180 C | ORC, absorption cooling, process heating |
| Molten Carbonate (MCFC) | 600--700 C | 400--600 C | HRSG, steam turbine, high-temp ORC |
| Solid Oxide (SOFC) | 600--1,000 C | 500--800 C | HRSG, TEG, steam turbine, gas turbine bottoming |

[DOE-FC]

The SOFC is particularly interesting for WHR because its high exhaust temperature can drive either a gas turbine bottoming cycle (SOFC-GT hybrid, demonstrated at the Bloom Energy Fremont facility) or a high-temperature TEG array. The combined fuel cell + WHR system can achieve 70 to 85% total fuel utilization efficiency -- approaching the thermodynamic limit for the available temperature difference. See Module D for detailed fuel cell performance data and cross-reference B-D-TEG for TEG integration specifics.

### 14.4 Module E: Solar Electrolysis (B-E-ELEC)

Waste heat recovery can contribute to green hydrogen production through two pathways:

1. **WHR to electricity via ORC to electrolysis** -- industrial waste heat is converted to electricity by an ORC system, and that electricity powers an electrolyzer to produce hydrogen. The overall efficiency is low (8 to 15% WHR times 60 to 80% electrolyzer = 5 to 12% waste heat to hydrogen), but the marginal cost of the waste heat is near zero, potentially making the hydrogen cost-competitive with grid-powered electrolysis during peak electricity prices.

2. **WHR as thermal input to high-temperature electrolysis** -- solid oxide electrolysis cells (SOECs) operate at 700 to 900 C and can use thermal energy to reduce the electrical energy required for water splitting. If high-grade waste heat is available at these temperatures (from SOFC exhaust, glass furnace exhaust, or steel mill exhaust), it can directly reduce the electricity consumption of the electrolyzer by 20 to 30% compared to ambient-temperature PEM or alkaline electrolysis [NREL-H2].

See Module E for detailed electrolyzer performance data and the economics of waste-heat-assisted hydrogen production.

### 14.5 Module F: PNW Geothermal and Hydroelectric (B-F-GEO)

Geothermal energy and waste heat recovery share a core technology: the ORC. Binary geothermal plants use ORC systems to generate electricity from geothermal brine at 100 to 180 C -- the same temperature range as many industrial waste heat sources. The engineering expertise, component supply chains, and operational experience from PNW geothermal development (including the AltaRock Newberry EGS project) directly transfer to industrial WHR applications.

Additionally, PNW hydroelectric power provides the cheap electricity that makes electrically-driven WHR technologies (heat pumps, MVR) economically attractive compared to regions with higher electricity costs.

---

## 15. Research Frontiers

### 15.1 Thermoelectric Materials Beyond ZT 2.0

Laboratory demonstrations of ZT values above 2.0 in tin selenide (SnSe) single crystals have generated intense research interest. If these performance levels can be achieved in polycrystalline, manufacturable forms at reasonable cost, TEG economics would improve dramatically -- potentially bringing TEG cost per watt to within striking distance of ORC for certain applications. Current research focuses on:

- Polycrystalline SnSe with controlled crystal orientation
- Nanocomposite approaches (Bi2Te3 with nanostructured inclusions)
- Machine learning-guided discovery of new thermoelectric compositions
- Flexible, printed thermoelectric devices for retrofit installation on existing hot surfaces

### 15.2 Supercritical CO2 (sCO2) Power Cycles

Supercritical CO2 operates as a single-phase fluid above its critical point (31 C, 74 bar), with density approaching that of a liquid but with the flow characteristics of a gas. sCO2 power cycles can achieve higher efficiencies than ORC for medium to high temperature sources (300 to 600 C) with dramatically more compact turbomachinery (because of the high working fluid density). The DOE has invested heavily in sCO2 cycle development for nuclear, CSP, and WHR applications. Commercial-scale demonstration is in progress but not yet widespread.

### 15.3 Thermophotovoltaics (TPV)

Thermophotovoltaic devices convert thermal radiation directly to electricity using photovoltaic cells tuned to infrared wavelengths. Recent laboratory results have demonstrated TPV efficiencies above 40% for heat sources at 1,900 to 2,400 C -- far higher than any TEG. While these temperatures exceed most industrial waste heat sources, TPV is relevant for:

- Combustion-heated emitters (natural gas or hydrogen flame) as a combined heat and power technology
- Very high-temperature industrial processes (glassmaking, steelmaking) where radiant losses are significant
- Integration with thermal energy storage (molten silicon or other high-temperature media)

### 15.4 Electrochemical Heat Engines

Thermogalvanic cells and thermoelectrochemical cells convert low-grade heat directly to electricity through temperature-dependent electrochemical reactions. These devices achieve Seebeck coefficients 10 to 100 times higher than solid-state thermoelectrics, potentially enabling practical power generation from heat sources below 100 C. The technology is at an early research stage, with laboratory demonstrations at milliwatt scale, but represents a fundamentally new approach to the low-grade waste heat challenge.

### 15.5 AI-Driven Heat Integration

Machine learning and optimization algorithms are increasingly applied to industrial heat integration problems that are too complex for manual pinch analysis. A large chemical plant or refinery may have hundreds of process streams with time-varying temperatures and flow rates. AI-driven heat exchanger network synthesis can identify recovery opportunities that human engineers miss, potentially increasing WHR capture by 10 to 20% beyond what conventional pinch analysis achieves.

---

## 16. Sources

### Government and Agency Sources

| Key | Full Citation |
|---|---|
| DOE-WHR | U.S. Department of Energy, Office of Energy Efficiency and Renewable Energy. *Waste Heat Recovery: Technology and Opportunities in U.S. Industry.* |
| CEC-WHR | California Energy Commission. *CEC-500-2025-001: Demonstrating Replicable, Innovative, Large-Scale Heat Recovery in the Industrial Sector.* January 2025. |
| DOE-FC | U.S. DOE Hydrogen and Fuel Cell Technologies Office. *Fuel Cells Overview.* energy.gov/eere/fuelcells |
| NREL-H2 | National Renewable Energy Laboratory. *Hydrogen Production and Delivery: Renewable Electrolysis.* Updated December 2025. |
| IEA-HP | International Energy Agency. *The Future of Heat Pumps.* World Energy Outlook Special Report. |
| EIA-WA | U.S. Energy Information Administration. *Washington State Energy Profile.* 2024-2025 data. |
| EPA-ESTAR | U.S. EPA. *ENERGY STAR Most Efficient 2025 and Version 6.2 Heat Pump Specification.* December 2024. |

### Peer-Reviewed Research

| Key | Full Citation |
|---|---|
| JOUHARA | Jouhara et al. *Innovative approaches to waste heat recovery.* Journal of Thermal Analysis and Calorimetry, September 2025. Springer Nature. |
| KOSMADAKIS | Kosmadakis et al. *Decision support tool for waste heat to heat recovery technologies.* ScienceDirect, December 2025. |
| HOEG | Hoeg, Vartdal et al. *Emerging opportunities for high-temperature solid-state and gas-cycle heat pumps.* Nature Energy, December 2025. |

### Cross-Module References

| ID | Connection | Relevant Section |
|---|---|---|
| B-A-HP | WHR as heat pump source (elevated COP) | Section 14.1 |
| B-A-PCM | PCM storage with heat pump scheduling | Section 14.1 |
| B-C-CAT | Catalytic reactor waste heat recovery | Section 14.2 |
| B-D-FC | Fuel cell waste heat (PEM through SOFC) | Section 14.3 |
| B-D-TEG | TEG on SOFC exhaust | Section 14.3 |
| B-E-ELEC | WHR electricity to electrolysis; WHR thermal to SOEC | Section 14.4 |
| B-F-GEO | Shared ORC technology; cheap PNW hydro enables heat pumps/MVR | Section 14.5 |

---

*Module B: Waste Heat Recovery -- Thermal & Hydrogen Energy Systems*
*Cross-reference IDs: B-ORC, B-TEG, B-PCM, B-PIPE, B-KALINA, B-MVR, B-DECISION*
*Sensitivity protocol: SC-SRC, SC-NUM, SC-MED applied throughout*