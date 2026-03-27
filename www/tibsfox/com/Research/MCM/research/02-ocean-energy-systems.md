# Ocean Energy Systems

> **Domain:** Marine Renewable Energy & Power Architecture
> **Module:** 2 -- Maritime Compute & Maglev Bridge: Power Generation for Floating Infrastructure
> **Through-line:** *Energy follows the ocean -- wave, tidal, wind, and solar resources converge on the same platform that hosts compute, creating a self-sustaining infrastructure node that draws power from the medium it floats upon.*

---

## Table of Contents

1. [The Energy Mandate](#1-the-energy-mandate)
2. [Wave Energy Converters](#2-wave-energy-converters)
3. [Tidal and Current Energy](#3-tidal-and-current-energy)
4. [Offshore Wind Integration](#4-offshore-wind-integration)
5. [Floating Solar Arrays](#5-floating-solar-arrays)
6. [Hybrid Power Architecture](#6-hybrid-power-architecture)
7. [Energy Storage Systems](#7-energy-storage-systems)
8. [Islanding and Autonomous Operation](#8-islanding-and-autonomous-operation)
9. [Power Density and Resource Assessment](#9-power-density-and-resource-assessment)
10. [Ocean Thermal Energy Conversion](#10-ocean-thermal-energy-conversion)
11. [Grid Integration and Export](#11-grid-integration-and-export)
12. [Reliability and Redundancy Modeling](#12-reliability-and-redundancy-modeling)
13. [Integration Economics](#13-integration-economics)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Energy Mandate

A floating compute node at an ocean waypoint cannot draw from a utility grid. It must generate, store, and manage its own power. This is not a constraint -- it is a design advantage. The ocean offers wave, tidal, wind, and solar energy in concentrations that exceed anything available on land, and the platform that hosts compute infrastructure sits directly within these energy fields.

The U.S. Department of Energy's Marine Energy Program reports that ocean energy resources could supply the equivalent of over sixty percent of U.S. electricity generation. The IEA's Net Zero by 2050 Roadmap projects marine energy electricity generation growing more than sixtyfold by 2050, from roughly 1 GW to a potential 300 GW globally.

For maritime compute, the question is not whether ocean energy is sufficient -- it is how to architect a hybrid power system that provides the reliability data centers demand (99.999% uptime) from inherently variable renewable sources.

---

## 2. Wave Energy Converters

Wave energy provides the most predictable of the ocean energy sources. Waves persist even when wind subsides (swell travels thousands of miles from storm generation areas) and when solar is unavailable (nighttime, overcast conditions). This persistence makes wave energy the baseload backbone of a maritime compute power system.

### CorPower Ocean -- Commercial Wave Energy

CorPower Ocean operates commercially in the Atlantic, deploying CorPack cluster arrays with the following characteristics:

| Parameter | Specification |
|-----------|--------------|
| Array output | 10-30 MW per CorPack cluster |
| Scaling | Modular: hundreds of MW to GW-scale |
| Deployment | Atlantic Ocean, commercial operation |
| Form factor | Point absorber with phase control |
| Survivability | Designed for North Atlantic storm conditions |

The CorPack architecture is directly applicable to maritime compute: a cluster of wave energy converters deployed around a compute barge provides distributed power generation with inherent redundancy. If one converter fails, the remaining units continue generating.

### Wave Energy Physics

Wave energy density depends on wave height and period:

```
P = (rho * g^2 * Hs^2 * Te) / (64 * pi)
```

Where:
- P = power per meter of wave front (W/m)
- rho = seawater density (1025 kg/m3)
- g = gravitational acceleration (9.81 m/s2)
- Hs = significant wave height (m)
- Te = energy period (s)

For the North Pacific (typical Hs = 2.5m, Te = 10s):
- P = (1025 * 96.2 * 6.25 * 10) / (201.1) = **30.6 kW/m**

A 200-meter wave energy array in the North Pacific captures approximately 6.1 MW of raw wave power. At 30% conversion efficiency (state of current technology), this yields approximately 1.8 MW of electrical output -- sufficient to power a Phase 1 compute barge.

### PacWave South -- Oregon Test Facility

Oregon State University's PacWave South project represents the first wave energy lease on the U.S. West Coast. Located six miles off Newport, Oregon, the 20 MW test facility connects offshore wave energy generation to the local electrical grid.

PacWave South is significant for maritime compute because it demonstrates the regulatory pathway for ocean energy deployment in U.S. waters and provides real-world performance data for wave energy converters in Pacific Northwest conditions -- the same waters adjacent to the Fox Infrastructure Pacific Spine's Hillsboro, Oregon anchor point.

---

## 3. Tidal and Current Energy

Tidal energy converters use the horizontal movement of tidal currents through submerged turbines analogous to wind turbines. The fundamental physics advantage of tidal energy is density: seawater is approximately 830 times denser than air.

### Power Density Advantage

The energy in one cubic meter of tidal current is thousands of times greater than the solar energy in one cubic meter of sunlit air. This density means tidal turbines can be physically small while generating significant power.

| Energy Source | Medium Density | Power Density at Typical Speed |
|--------------|---------------|-------------------------------|
| Wind (12 m/s) | 1.225 kg/m3 | ~1,060 W/m2 |
| Tidal current (2.5 m/s) | 1,025 kg/m3 | ~8,000 W/m2 |
| Ratio | 837x denser | ~7.5x more power per m2 |

### FORCE -- Fundy Ocean Research Centre for Energy

FORCE operates an active tidal energy research facility in the Bay of Fundy, Nova Scotia, Canada. The Bay of Fundy hosts the world's highest tides (up to 16 meters vertical range), creating tidal currents exceeding 5 m/s -- an enormous energy resource.

While the Bay of Fundy represents an extreme tidal resource, many submarine cable routes pass through areas with commercially viable tidal currents (>1.5 m/s). Maritime compute nodes positioned at these locations can supplement wave and wind power with tidal baseload generation.

### Tidal Predictability

Tidal energy has a unique advantage for compute operations: **tides are perfectly predictable.** Tidal tables can be calculated centuries in advance. This predictability enables power management systems to schedule compute workloads around tidal generation cycles, unlike wind and solar which require probabilistic forecasting.

---

## 4. Offshore Wind Integration

Offshore wind resources are stronger and more consistent than land-based wind. The absence of terrain-induced turbulence, combined with the thermal uniformity of the ocean surface, produces steadier wind profiles with higher average speeds.

### Floating Offshore Wind

Fixed-bottom offshore wind turbines are limited to water depths under approximately 60 meters. Floating offshore wind platforms -- already deployed commercially in the North Sea (Hywind Scotland, 30 MW; Kincardine, 50 MW) -- remove this depth constraint, enabling deployment anywhere in the ocean.

| Parameter | Hywind Scotland | Kincardine |
|-----------|----------------|------------|
| Capacity | 30 MW (5 x 6 MW) | 50 MW (5 x 9.5 MW + 1 x 2 MW) |
| Depth | 95-129 m | 60-80 m |
| Platform type | Spar buoy | Semi-submersible |
| Distance from shore | 25 km | 15 km |
| Capacity factor | ~54% | ~46% |

### Wind-Compute Co-Location

A floating wind turbine and a compute barge can share mooring infrastructure, electrical distribution, and maintenance logistics. The wind turbine provides the scalable power backbone; the compute barge provides the load. This co-location reduces the cost of both systems by amortizing shared infrastructure.

For a 2 MW compute load with PUE of 1.15 (total facility load 2.3 MW), a single modern floating wind turbine (12-15 MW nameplate, 45-55% capacity factor) generates approximately 5.4-8.25 MW average -- enough to power the compute node with surplus for battery charging and potential grid export.

---

## 5. Floating Solar Arrays

Floating photovoltaic (FPV) systems deploy solar panels on pontoon arrays on water surfaces. While primarily deployed on inland reservoirs and lakes (with over 4.8 GW installed globally by 2024), ocean-deployed floating solar is an emerging technology.

### Ocean Solar Challenges

- **Wave action:** Panel mounting must accommodate wave-induced motion
- **Salt spray:** Corrosion-resistant materials and sealed junction boxes required
- **Biofouling:** Submerged pontoon surfaces accumulate marine organisms
- **Storm survival:** Arrays must survive or be designed to submerge during extreme weather

### Ocean Solar Advantages

- **Cooling effect:** Water beneath the panels cools them, improving efficiency by 5-10% compared to land-mounted panels
- **No land use:** Zero terrestrial land consumption
- **Proximity to load:** Panels can surround the compute barge, minimizing transmission losses
- **Dual use:** Floating solar arrays can serve as wave attenuators, reducing wave energy reaching the compute barge

### Deployment Model

For maritime compute, floating solar serves as a supplementary power source rather than primary generation. A 1-hectare (10,000 m2) floating solar array in tropical waters generates approximately 1.5-2.0 MWp, contributing to the hybrid power mix during daylight hours and reducing battery cycling.

---

## 6. Hybrid Power Architecture

No single ocean energy source provides the reliability required for data center operations. The maritime compute power architecture combines multiple sources into a hybrid system with energy storage.

### Reference Architecture: 2 MW IT Load

```
                    HYBRID POWER ARCHITECTURE
                    =========================

  Wave Energy (CorPack)     Floating Wind        Floating Solar
  [1.5 MW continuous]       [6 MW nameplate]     [500 kW peak]
         |                       |                     |
         v                       v                     v
  +----------------------------------------------------------+
  |           AC Bus (Medium Voltage, 11 kV)                  |
  +----------------------------------------------------------+
         |                       |                     |
         v                       v                     v
  +----------------+    +----------------+    +--------------+
  | Power Control  |    | Battery Energy |    | Diesel Gen   |
  | System (PCS)   |    | Storage (BESS) |    | (Emergency)  |
  | AC/DC Convert  |    | 4 MWh LFP     |    | 500 kW       |
  +----------------+    +----------------+    +--------------+
         |                       |                     |
         +----------+----------+-----------+-----------+
                    |
         +----------v----------+
         | DC Distribution     |
         | 48V / 400V to racks |
         +----------+----------+
                    |
         +----------v----------+
         | 8x Compute          |
         | Containers          |
         | 250 kW each         |
         +---------------------+
```

### Power Source Contributions

| Source | Nameplate | Capacity Factor | Average Output | Role |
|--------|----------|----------------|----------------|------|
| Wave (CorPack) | 1.5 MW | 30-40% | 0.45-0.60 MW | Baseload |
| Wind (floating) | 6 MW | 45-55% | 2.7-3.3 MW | Primary generation |
| Solar (floating) | 500 kW | 15-25% | 75-125 kW | Supplementary |
| Battery (LFP) | 4 MWh | N/A | N/A | Buffer / peak shaving |
| Diesel (emergency) | 500 kW | <1% | <5 kW | Last resort backup |

Total average generation: 3.2-4.0 MW, against a total facility load of 2.3 MW (2 MW IT + 0.3 MW facility overhead at PUE 1.15). The surplus charges batteries and provides a reliability margin.

---

## 7. Energy Storage Systems

Battery energy storage smooths the variability of renewable generation and provides ride-through capability during generation lulls.

### Lithium Iron Phosphate (LFP) Selection

LFP chemistry is preferred for maritime compute energy storage due to:
- **Thermal stability:** No thermal runaway risk (critical for unmanned ocean platforms)
- **Cycle life:** 4,000-6,000 cycles at 80% depth of discharge
- **Calendar life:** 15-20 years
- **No cobalt:** Reduced supply chain risk and ethical concerns
- **Fire safety:** LFP does not produce oxygen during failure, unlike NMC chemistries

### Sizing Model

For a 2.3 MW total facility load:
- **4 MWh battery** provides approximately 1.7 hours of full-load operation without generation
- **Typical use:** 30-minute generation transitions as wind shifts or wave energy varies
- **Worst case:** 90-minute calm period (statistically rare in open ocean, <0.1% of hours)
- **Design margin:** Diesel generator provides indefinite backup if all renewable sources fail simultaneously

### Emerging: Flow Batteries

Vanadium redox flow batteries offer unlimited cycle life and independent scaling of power (kW) and energy (kWh). The aqueous electrolyte is non-flammable. For maritime applications, the ability to store electrolyte in tanks -- which can be refilled during maintenance visits -- makes flow batteries attractive for future deployments.

---

## 8. Islanding and Autonomous Operation

Maritime compute nodes operate as islanded microgrids -- self-contained electrical systems with no connection to a utility grid. This islanding capability is both the defining constraint and the enabling innovation.

### Microgrid Control

The power control system must:
1. **Balance generation and load in real time** (frequency and voltage regulation)
2. **Manage battery state of charge** (prevent over-discharge and overcharge)
3. **Curtail or shed compute load** during extended low-generation periods
4. **Start diesel generator** automatically if battery SOC drops below threshold (typically 20%)
5. **Log all power events** for remote monitoring and predictive maintenance

### Compute Load Management

Unlike traditional data centers that maintain constant load, maritime compute can implement intelligent load management:

- **Elastic workloads:** Batch processing, model training, content pre-caching -- scheduled to coincide with peak generation
- **Guaranteed workloads:** Real-time inference, CDN serving, network routing -- maintained at all times
- **Deferred workloads:** Large file transfers, backup replication -- queued for surplus energy periods

This load-generation co-scheduling is possible because the maritime compute node controls both the generation and the load -- a microgrid advantage unavailable to land-based data centers drawing from shared utility grids.

---

## 9. Power Density and Resource Assessment

### Global Wave Energy Resource

The U.S. DOE estimates technical wave energy potential for the United States alone at 898-1,229 TWh/year (comparable to one-third of total U.S. electricity consumption). Global wave energy resources are estimated at 29,500 TWh/year (approximately equal to total global electricity generation).

### Regional Resource Profiles

| Region | Wave Power (kW/m) | Wind Speed (m/s) | Solar Irradiance (kWh/m2/day) | Tidal Range (m) |
|--------|--------------------|-------------------|-------------------------------|-----------------|
| North Pacific (40-50N) | 30-60 | 8-12 | 3-4 | 1-3 |
| North Atlantic (50-60N) | 40-70 | 9-14 | 2-3 | 2-8 |
| Equatorial Pacific | 10-20 | 5-8 | 5-6 | 0.5-1.5 |
| Southern Ocean (40-50S) | 50-100 | 10-15 | 3-4 | 1-3 |
| South China Sea | 10-25 | 6-9 | 4-5 | 1-4 |

The North Atlantic and Southern Ocean offer the highest wave energy density, while the equatorial Pacific offers the best solar resource. Hybrid architectures adapt the generation mix to local resource profiles.

### GAO Assessment

The U.S. Government Accountability Office's Science & Technology Spotlight on Renewable Ocean Energy (GAO-21-533SP) notes that wave, tidal, and current energy technologies, while costlier than mature renewables, are among the fastest-growing renewable energy sectors. Cost reduction follows the same learning curve pattern as wind and solar -- early deployments are expensive, but costs decline 15-25% with each doubling of installed capacity.

---

## 10. Ocean Thermal Energy Conversion

Ocean Thermal Energy Conversion (OTEC) exploits the temperature difference between warm surface water (25-30 C in tropics) and cold deep water (4-5 C at 1000m depth) to drive a heat engine. The theoretical Carnot efficiency is low (~7%) due to the small temperature differential, but the energy source is inexhaustible and continuous.

OTEC has been demonstrated at pilot scale (Makai Ocean Engineering, Hawaii, 100 kW) and is particularly relevant for tropical maritime compute deployments where wave energy resources are lower. The cold deep water used by OTEC also provides excellent cooling for compute equipment, creating a dual-use infrastructure: power generation and compute cooling from the same deep-water intake.

OTEC integration with maritime compute is complementary to -- not competitive with -- the wave/wind/solar hybrid architecture described above. In tropical deployments where wave resources are modest, OTEC can provide the continuous baseload that wave energy provides at higher latitudes.

---

## 11. Grid Integration and Export

While maritime compute nodes operate as islanded microgrids, Phase 2 and Phase 3 deployments introduce the possibility of grid interconnection via submarine power cables or maglev bridge power corridors.

### Submarine Power Cable

HVDC submarine power cables connect offshore wind farms to onshore grids across distances up to 700+ km (NordLink: 623 km, 1.4 GW). The same technology can export surplus power from maritime compute node clusters to terrestrial grids.

### Maglev Bridge Power Corridor

KIT (Karlsruhe Institute of Technology) has developed a superconducting maglev system that combines levitation with lossless energy transmission via the same superconductor rail structure. In Phase 3, the maglev bridge guideway simultaneously carries vehicles and transmits power -- the rail IS the transmission line. This dual-purpose infrastructure enables maritime compute nodes to export power along the bridge corridor while receiving containerized hardware refreshes.

---

## 12. Reliability and Redundancy Modeling

Data center operations require 99.999% uptime (Tier IV standard: 26.3 minutes of downtime per year). Achieving this with renewable sources on an ocean platform requires multi-layered redundancy.

### Reliability Architecture

| Layer | Component | Redundancy | Failure Mode |
|-------|-----------|------------|-------------|
| Generation | Wave + Wind + Solar | N+2 sources | Any single source can fail |
| Storage | Battery (LFP) | 2x capacity margin | 50% battery can fail |
| Backup | Diesel generator | 1x IT load | Fuel limited (30 days) |
| Distribution | DC power bus | Dual bus (A+B) | Single bus failure tolerated |
| Cooling | Seawater pumps | N+1 pumps | Single pump failure tolerated |
| Connectivity | Fiber + satellite | Dual path | Either path can fail |

### Availability Calculation

With three independent generation sources (wave, wind, solar), each at 95% availability independently:
- P(all three fail) = 0.05^3 = 0.000125 = 0.0125%
- P(at least one generating) = 99.9875%

With battery backup covering the remaining 0.0125% and diesel as last resort, system availability exceeds 99.999%.

---

## 13. Integration Economics

### Levelized Cost of Energy (LCOE) Projections

| Source | Current LCOE ($/MWh) | 2030 Projected ($/MWh) |
|--------|---------------------|----------------------|
| Offshore wind (floating) | 80-120 | 50-70 |
| Wave energy | 200-500 | 100-200 |
| Tidal energy | 150-400 | 80-150 |
| Floating solar | 40-80 | 25-50 |
| Diesel (maritime) | 250-350 | 250-350 |

### Maritime Compute LCOE Target

For a 2 MW IT load operating at 90% utilization (15,768 MWh/year), the blended LCOE from the hybrid system must remain below approximately $150/MWh to be competitive with land-based data center power costs (which range from $50-150/MWh depending on location, including cooling costs).

Current hybrid maritime LCOE is estimated at $120-180/MWh, declining to $70-120/MWh by 2030 as wave and floating wind costs follow established learning curves. Maritime compute becomes cost-competitive with land-based alternatives by the late 2020s, especially when the free cooling benefit (saving $30-50/MWh equivalent) is included.

---

## 14. Cross-References

- **[HGE] Hydro-Geothermal Energy:** Terrestrial geothermal as parallel baseload source; OTEC as ocean analogue to geothermal heat extraction
- **[THE] Thermal Energy:** Waste heat management principles; thermal storage concepts applicable to maritime compute cooling integration
- **[OCN] Open Compute Node:** Solar sizing methodology, battery energy storage design, DC power distribution architecture
- **[PSG] Pacific Spine Gateway:** PacWave South Oregon wave energy integration; Hillsboro corridor as grid interconnection point
- **[SYS] Systems Administration:** Remote monitoring and autonomous operations protocols for unmanned infrastructure
- **[ROF] Ring of Fire:** Tectonic context for ocean energy resources; seismic risk to subsea power cables
- **[CMH] Computational Mesh:** Power-aware workload scheduling across distributed maritime compute nodes

---

## 15. Sources

### Government and Agency Sources
- U.S. Department of Energy, Water Power Technologies Office -- Marine Energy Program: 60%+ of U.S. electricity potential from ocean energy
- Bureau of Ocean Energy Management (BOEM) -- Renewable Energy on the Outer Continental Shelf
- U.S. Government Accountability Office -- Science & Tech Spotlight: Renewable Ocean Energy (GAO-21-533SP)
- National Renewable Energy Laboratory (NREL) -- Wave Energy Resource Atlas: 898-1,229 TWh/year U.S. technical potential
- IEA -- Net Zero by 2050 Roadmap: marine energy 1 GW to 300 GW by 2050

### Industry and Research
- CorPower Ocean -- CorPack cluster arrays: 10-30 MW per array, commercial Atlantic deployment
- Oregon State University -- PacWave South: 20 MW wave energy test facility, Newport, Oregon
- FORCE (Fundy Ocean Research Centre for Energy) -- Bay of Fundy tidal energy research
- Makai Ocean Engineering -- OTEC pilot plant, Hawaii, 100 kW demonstration
- Hywind Scotland -- 30 MW floating offshore wind, 54% capacity factor
- Kincardine -- 50 MW floating offshore wind, semi-submersible platform

### Standards and Data
- IEC 62600 -- Marine energy: wave, tidal, and other water current converters
- IEEE 1547 -- Standard for interconnection of distributed energy resources

---

*Energy follows the ocean. The question is not whether there is enough -- it is whether we build the architecture to harvest it.*
