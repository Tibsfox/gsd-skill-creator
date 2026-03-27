# Maritime Compute Architecture

> **Domain:** Ocean Infrastructure & Data Center Engineering
> **Module:** 1 -- Maritime Compute & Maglev Bridge: Floating and Underwater Compute Systems
> **Through-line:** *Compute follows the cable, energy follows the ocean, knowledge follows both -- and the bridge that connects them carries hardware, data, and understanding at the speed of levitation.*

---

## Table of Contents

1. [The Case for Maritime Compute](#1-the-case-for-maritime-compute)
2. [Terrestrial Concentration Problem](#2-terrestrial-concentration-problem)
3. [Floating Data Center Precedents](#3-floating-data-center-precedents)
4. [Underwater Data Center Research](#4-underwater-data-center-research)
5. [Containerized Compute Modules](#5-containerized-compute-modules)
6. [Seawater Cooling Systems](#6-seawater-cooling-systems)
7. [Cooling Economics and PUE Analysis](#7-cooling-economics-and-pue-analysis)
8. [Barge and Platform Engineering](#8-barge-and-platform-engineering)
9. [Corrosion Mitigation and Material Science](#9-corrosion-mitigation-and-material-science)
10. [Operational Model for Remote Compute Nodes](#10-operational-model-for-remote-compute-nodes)
11. [Ocean Temperature Zone Analysis](#11-ocean-temperature-zone-analysis)
12. [Phase 1 Deployment Architecture](#12-phase-1-deployment-architecture)
13. [Integration with Submarine Cable Infrastructure](#13-integration-with-submarine-cable-infrastructure)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Case for Maritime Compute

The ocean covers seventy percent of the Earth's surface, yet global computational infrastructure clings to land like a species that never learned to swim. Server farms cluster in deserts, cool themselves with diverted rivers, and connect through cables buried in the seabed -- treating the ocean as an obstacle rather than a platform. The maritime compute vision inverts this relationship: the ocean becomes the deployment surface, the cooling medium, the energy source, and the transport corridor for computational infrastructure.

The Amiga Principle applies at every scale: specialized execution paths and architectural leverage over brute force. A single floating compute node positioned near a submarine cable landing station reduces latency for an entire hemisphere. The same containerized compute module that runs on a barge can be loaded onto a maglev carrier, a truck, or a rail car -- the intermodal compatibility of the ISO container standard transforms hardware refresh from a months-long logistics problem into a days-long transport operation.

This module documents the engineering foundations for cargo-container data centers deployed on floating platforms, covering structural design, cooling systems, power integration, corrosion mitigation, and the operational model for remote ocean compute nodes.

---

## 2. Terrestrial Concentration Problem

Global data center infrastructure clusters in a small number of land-based locations, creating latency deserts across vast ocean regions.

| Region | Primary Hub | Round-Trip Latency to Nearest Major DC |
|--------|------------|---------------------------------------|
| Northern Virginia | Ashburn, VA | <5 ms local |
| Singapore | Jurong / Changi | <5 ms local |
| Dublin | Dublin / Clonee | <5 ms local |
| Pacific Islands | Fiji, Tonga, Samoa | 100-200+ ms to Sydney or LA |
| Coastal West Africa | Lagos, Accra | 80-150 ms to London or Marseille |
| Southern Atlantic | Ascension Island area | 150-250 ms to nearest hub |
| Indian Ocean | Maldives, Seychelles | 100-180 ms to Singapore or Mumbai |

Land-based data centers consume approximately 1-2% of global electricity and enormous volumes of fresh water for cooling. The AI compute surge is accelerating both demands. Northern Virginia alone hosts over 300 data centers drawing from a regional power grid that is increasingly strained. Singapore has imposed a moratorium on new data center construction due to land and power constraints.

The maritime compute model addresses this concentration by positioning compute at ocean waypoints -- not replacing terrestrial infrastructure, but extending it into the seventy percent of the planet's surface that currently hosts zero compute capacity.

---

## 3. Floating Data Center Precedents

### Nautilus Data Technologies -- Port of Stockton

Nautilus Data Technologies deployed the first commercial floating data center at the Port of Stockton, California. The facility achieved a power usage effectiveness (PUE) of 1.15 through closed-loop seawater cooling at approximately 4,500 gallons per minute. The system borrows water for approximately sixteen seconds, returning it with minimal thermal impact.

Key performance characteristics:
- **PUE:** 1.15 (compared to industry land-based average of 1.58)
- **Cooling method:** Closed-loop seawater, no evaporation
- **Rack density:** Exceeding 100 kW per rack
- **Water consumption:** Zero net consumption (borrow-and-return cycle)
- **Chemical treatment:** None required
- **Refrigerants:** None used

The Nautilus deployment validated that floating platforms can support high-density computing without the water consumption, chemical treatment, or refrigerant use that characterize land-based cooling systems.

### Keppel Data Centres -- Singapore FDCP

Keppel Data Centres (Singapore) is developing the Floating Data Centre Park (FDCP), a modular and scalable solution designed specifically for land-scarce urban coastal areas. The FDCP uses surrounding seawater as a heat sink, reducing water consumption compared to traditional data centers while addressing Singapore's fundamental constraint: available land.

The FDCP design demonstrates that floating data centers are not solely a remote-ocean concept. Urban harbors and port facilities can host floating compute infrastructure, adding capacity without consuming scarce terrestrial real estate.

### China -- Hainan Underwater AI Cluster

China's Hainan province hosts a fully operational underwater AI-focused compute cluster, demonstrating large-scale underwater computing with reported minimal environmental impact. The Hainan installation represents the first national-scale commitment to ocean-based AI compute, moving beyond experimental prototypes into production deployment.

### Subsea Cloud -- Pressure-Equalized Pods

Subsea Cloud deploys pressure-equalized pods that offer an alternative to sealed-vessel approaches. By equalizing internal pressure with the surrounding water column, these pods achieve simpler deployment, easier maintenance access, and enhanced physical security compared to sealed cylinders.

The pressure-equalized approach trades the hermetic isolation of sealed containers for operational accessibility -- a significant advantage for hardware refresh cycles that the maglev bridge transport concept directly enables.

---

## 4. Underwater Data Center Research

### Microsoft Project Natick (2015-2024)

Microsoft's Project Natick deployed sealed cylindrical server containers on the ocean floor off the coast of Scotland. The project ran for nearly a decade and produced findings that reshaped the industry's understanding of maritime compute.

Key findings:
- **Reliability:** Submerged servers experienced **eight times fewer hardware failures** than comparable land-based installations
- **Cooling:** Seawater validated as an effective free-cooling medium
- **PUE:** Achieved values well below land-based averages (reported PUE approaching 1.07)
- **Atmosphere:** Nitrogen-filled sealed environment eliminated humidity and oxygen-related corrosion
- **Marine interaction:** Submerged containers attracted marine life, functioning as artificial reefs

The eight-fold reliability improvement is the most significant finding. Microsoft attributed this to the elimination of temperature cycling, humidity variation, and human-introduced contaminants (dust, accidental contact) that plague land-based facilities. The sealed nitrogen atmosphere created a near-ideal operating environment.

Project Natick concluded in 2024 with findings that informed Microsoft's broader data center strategy. While Microsoft did not pursue full-scale underwater deployment, the reliability and cooling data validated the engineering feasibility of ocean-based compute.

### Implications for Maritime Compute Architecture

The Natick findings establish two critical principles for maritime compute design:

1. **Environmental stability matters more than cooling capacity.** The reliability improvement came from atmospheric control, not just temperature management. Maritime compute modules must prioritize environmental isolation.

2. **The ocean is a better neighbor than expected.** Marine life colonization of submerged structures is beneficial, not problematic. Floating and submerged compute infrastructure can coexist with marine ecosystems when thermal discharge is managed within regulatory thresholds.

---

## 5. Containerized Compute Modules

ISO-standard shipping containers (20-foot and 40-foot) serve as the standard form factor for modular data centers. This choice is not arbitrary -- it is the key to the entire maritime compute and maglev bridge vision.

### ISO Container Specifications

| Specification | 20-foot (TEU) | 40-foot High Cube |
|--------------|---------------|-------------------|
| External length | 6,058 mm | 12,192 mm |
| External width | 2,438 mm | 2,438 mm |
| External height | 2,591 mm | 2,896 mm |
| Internal volume | 33.2 m3 | 76.3 m3 |
| Max gross weight | 30,480 kg | 30,480 kg |
| Tare weight | 2,300 kg | 4,020 kg |
| Max payload | 28,180 kg | 26,460 kg |

### Intermodal Compatibility

The critical advantage of the ISO container form factor: **the same container that carries compute can be loaded onto a maglev carrier, a barge, a truck, or a rail car.** This intermodal compatibility means hardware refresh -- the periodic replacement of server components -- uses the same global logistics infrastructure that moves 800 million container movements per year.

CenCore and similar providers offer containerized data centers compatible with C-17 aircraft, military mobilizers, semi-truck trailers, and cargo ships. Standard features include:
- 42U rack capacity per container
- Integrated HVAC and environmental control
- Fire suppression (clean agent, typically FM-200 or Novec 1230)
- Redundant power distribution
- RF shielding options up to TEMPEST compliance

### Google Water-Based Data Center Patent (2008)

Google's patent (US7525207B2) described a water-based data center system using standard shipping containers on floating platforms, with sea-based electrical generators and seawater cooling. The patent specifically noted the advantage of using standard containers whose handling is familiar to dock workers and seamen, enabling deployment without specialized training.

This insight -- that maritime compute deployment should leverage existing maritime labor skills rather than requiring specialized data center technicians at sea -- remains central to the operational model.

---

## 6. Seawater Cooling Systems

Seawater cooling eliminates the primary cost driver of land-based data centers. Three cooling architectures are applicable to maritime compute:

### Direct Seawater Cooling (Open Loop)

Seawater is drawn from the surrounding ocean, passed through heat exchangers in contact with server rack coolant loops, and returned to the ocean at a slightly elevated temperature. This is the simplest architecture and the one used by Nautilus Data Technologies.

**Advantages:** Simplest engineering, lowest capital cost, proven at commercial scale.
**Constraints:** Biofouling management, thermal discharge regulation, intake screening for marine life protection.

### Indirect Seawater Cooling (Closed Loop with Heat Exchanger)

A closed freshwater or glycol loop circulates through the compute modules, transferring heat to seawater through titanium plate heat exchangers. The compute environment never contacts seawater directly.

**Advantages:** No biofouling in compute loops, easier corrosion management, more precise temperature control.
**Constraints:** Higher capital cost, additional pumping energy, heat exchanger maintenance.

### Pressure-Equalized Immersion

Used by Subsea Cloud, compute hardware is submerged in dielectric fluid within pressure-equalized enclosures. The surrounding seawater provides the ultimate heat sink, but the electronics never contact water.

**Advantages:** Highest density cooling, excellent reliability (Natick-style sealed environment), natural physical security.
**Constraints:** Hardware access requires pod retrieval, dielectric fluid cost, pressure management systems.

---

## 7. Cooling Economics and PUE Analysis

Power Usage Effectiveness (PUE) measures total facility energy divided by IT equipment energy. A PUE of 1.0 means all energy goes to computing; higher values indicate overhead from cooling, lighting, and other facility systems.

| Facility Type | Typical PUE | Cooling Method |
|--------------|-------------|----------------|
| Average global data center | 1.58 | Air conditioning |
| Hyperscaler (Google, Meta) | 1.10-1.12 | Evaporative + free cooling |
| Nautilus floating DC | 1.15 | Direct seawater |
| Project Natick (submerged) | ~1.07 | Ambient seawater immersion |
| Maritime compute target | <1.15 | Seawater (open or closed loop) |

Nautilus Data Technologies reports 75% greater energy efficiency in cooling compared to air conditioning, with zero water consumption and no chemical treatment or refrigerants. The thermal stability of ocean water -- minimal diurnal variation at depth -- provides more consistent cooling than land-based systems subject to ambient temperature swings.

### Cooling Energy Savings Model

For a 1 MW IT load:
- **Land-based air cooling (PUE 1.58):** 580 kW overhead = 5,082 MWh/year cooling energy
- **Seawater cooling (PUE 1.15):** 150 kW overhead = 1,314 MWh/year cooling energy
- **Annual savings:** 3,768 MWh per MW of IT load
- **At $0.10/kWh:** $376,800 annual cooling cost reduction per MW

Over a 10-year facility life, a 10 MW maritime compute installation saves approximately $37.7 million in cooling costs alone, before accounting for water savings, land cost avoidance, and reduced HVAC maintenance.

---

## 8. Barge and Platform Engineering

Floating compute platforms must satisfy three engineering constraints simultaneously: structural stability in ocean conditions, precise environmental control for electronics, and compatibility with intermodal container handling.

### Platform Types

**Pontoon Barge (Near-Shore):** Steel or concrete pontoon hull supporting containerized compute modules on deck. Suitable for harbor, port, and near-shore deployment. Washington State's floating bridge program demonstrates that pontoon structures can support heavy loads (including light rail transit, tested June 2025) in open water conditions.

**Semi-Submersible Platform:** Partially submerged hull that reduces wave-induced motion. Used extensively in offshore oil and gas. Provides more stable platform for sensitive electronics but higher construction and deployment cost.

**Tension Leg Platform (TLP):** Moored to the seabed by vertical tethers under tension. Near-zero heave motion. Suitable for deep-water deployments near submarine cable landing stations.

**Spar Buoy Configuration:** Deep-draft cylindrical hull with low center of gravity. Excellent stability in deep water. Compute modules housed in the hull rather than on deck.

### Motion Tolerance

Server hardware is rated for specific shock and vibration envelopes. Enterprise servers typically tolerate:
- **Operating vibration:** 0.21 G RMS, 5-500 Hz
- **Operating shock:** 6 G, 11 ms half-sine
- **Non-operating shock:** 40 G, 11 ms half-sine

Pontoon barges in harbor conditions remain well within these envelopes. Open-ocean deployment requires either motion compensation (active or passive damping systems) or semi-submersible/TLP platforms that inherently minimize motion.

---

## 9. Corrosion Mitigation and Material Science

The marine environment is the most corrosive natural environment on Earth. Maritime compute infrastructure must address corrosion at every structural level.

### Material Selection

| Component | Recommended Material | Corrosion Protection |
|-----------|---------------------|---------------------|
| Hull / pontoon | Marine-grade steel (ABS DH36) or reinforced concrete | Cathodic protection + marine coating |
| Container shell | Corten steel (standard ISO container) | Marine-grade paint + sacrificial anodes |
| Heat exchangers | Titanium Grade 2 | Inherent corrosion resistance |
| Piping (seawater) | Copper-nickel alloy (90/10 CuNi) | Inherent biofouling resistance |
| Electrical enclosures | 316L stainless steel | Passivation + sealed gaskets |
| Fasteners | Duplex stainless steel (2205) | Avoid galvanic couples |

### Cathodic Protection

Sacrificial anode systems (zinc or aluminum alloy anodes) are standard for marine steel structures. Impressed current cathodic protection (ICCP) provides active corrosion control for larger structures. Both systems are mature technologies used on every ship and offshore platform worldwide.

### Biofouling Management

Marine organisms colonize submerged surfaces within days. While Project Natick demonstrated that this colonization can be ecologically beneficial, biofouling on cooling water intakes reduces flow rates and heat exchange efficiency. Management strategies include:

- Copper-nickel alloy piping (inherent antifouling properties)
- Electrolytic antifouling systems (copper ion release)
- Mechanical cleaning schedules for heat exchanger surfaces
- Intake screening with velocity caps to protect marine life

---

## 10. Operational Model for Remote Compute Nodes

Maritime compute nodes operating at ocean waypoints require an operational model fundamentally different from land-based data centers. No on-site staff. No utility grid. No municipal water supply. The node must be largely autonomous.

### Autonomous Operations

- **Remote monitoring:** Full telemetry via satellite uplink (Starlink, Iridium) and submarine cable backhaul
- **Automated failover:** N+1 redundancy at the container level; failed containers isolated and flagged for replacement
- **Environmental sensing:** Wave height, wind speed, current, water temperature, hull stress monitoring
- **Security:** Physical isolation (ocean location), encrypted communications, tamper detection sensors

### Maintenance Cycles

- **Quarterly:** Autonomous resupply vessel delivers consumables (generator fuel if hybrid power, replacement parts inventory)
- **Semi-annual:** Technician visit for hardware inspection, heat exchanger cleaning, cathodic protection system check
- **Annual:** Full system audit, firmware updates requiring physical access, structural inspection

### Hardware Refresh via Container Swap

The container form factor enables a uniquely efficient hardware refresh model: rather than upgrading individual servers in place, an entire compute container is swapped. A resupply vessel (or, in Phase 3, a maglev bridge carrier) delivers a fresh container and retrieves the aging one for refurbishment on land. This swap operation takes hours, not weeks.

---

## 11. Ocean Temperature Zone Analysis

Maritime compute PUE varies with ocean temperature. Three temperature zones define the deployment envelope:

### Tropical Zone (20-30 C Surface Temperature)

- **Regions:** Equatorial Pacific, Indian Ocean, Caribbean, Gulf of Guinea
- **Cooling challenge:** Higher ambient water temperature reduces delta-T for heat exchange
- **PUE projection:** 1.18-1.25
- **Mitigation:** Deep-water intake (below thermocline at 200-1000m, water temperature 4-10 C)
- **Advantage:** Proximity to underserved island communities

### Temperate Zone (10-20 C Surface Temperature)

- **Regions:** North Pacific, North Atlantic, Southern Ocean margins
- **Cooling performance:** Excellent delta-T for heat exchange
- **PUE projection:** 1.10-1.15
- **Advantage:** Proximity to major submarine cable routes and landing stations
- **Note:** Seasonal variation requires design for peak summer temperatures

### Polar-Adjacent Zone (0-10 C Surface Temperature)

- **Regions:** Norwegian Sea, Bering Sea, Southern Ocean
- **Cooling performance:** Near-optimal for electronics cooling
- **PUE projection:** 1.05-1.10
- **Constraint:** Icing risk on deck structures and cooling intakes
- **Constraint:** Extreme weather loads on platform structure
- **Advantage:** Minimal cooling energy required; potentially sub-1.10 PUE year-round

---

## 12. Phase 1 Deployment Architecture

Phase 1 deploys standardized ISO-container data centers on pontoon barges positioned at strategic ocean waypoints.

### Deployment Criteria

1. **Proximity to submarine cable landing station** (within 50 km for fiber connection)
2. **Adequate ocean energy resource** (wave, tidal, or wind for power generation)
3. **Manageable sea state** (significant wave height <4m for 90%+ of the year)
4. **Water depth** (50-500m for mooring; deeper for TLP or spar configurations)
5. **Navigation clearance** (outside shipping lanes, compliant with COLREGS)
6. **Jurisdictional clarity** (EEZ vs. international waters, UNCLOS framework)

### Reference Node Configuration

| Component | Specification |
|-----------|--------------|
| Platform | Steel pontoon barge, 60m x 20m |
| Compute | 8x 40-foot ISO compute containers |
| IT capacity | ~2 MW total (250 kW per container) |
| Cooling | Closed-loop seawater, titanium heat exchangers |
| Power | Hybrid wave/solar/wind + battery storage |
| Connectivity | Fiber to nearest cable landing station |
| Crew | Unmanned; quarterly maintenance visits |
| Design life | 25 years (hull), 5-year container refresh cycle |

---

## 13. Integration with Submarine Cable Infrastructure

Floating compute nodes connect to the global data network through submarine cable landing stations. There are over six hundred active and planned submarine cables globally, spanning approximately 1.2 million kilometers. Each cable landing station represents a potential integration point for maritime compute.

The integration model positions compute barges within fiber-optic reach of landing stations, creating edge compute capability at the ocean-land boundary. A compute barge near a Pacific cable landing could provide sub-millisecond cache access for island communities that currently experience 100+ ms round-trip times to the nearest land-based data center.

This integration pathway extends naturally into Module 3 (Subsea Data Transfer Infrastructure), where the cable network topology and landing station geography are mapped in detail.

---

## 14. Cross-References

- **[OCN] Open Compute Node:** Containerized compute architecture, GB200 NVL72 reference case, container form factor rationale -- the terrestrial complement to maritime compute modules
- **[PSG] Pacific Spine Gateway:** Terrestrial anchor for the maritime compute network; BNSF right-of-way, community fiber, maglev guideway integration points
- **[CMH] Computational Mesh:** Mesh networking architecture applicable to inter-node communication between floating compute platforms
- **[HGE] Hydro-Geothermal Energy:** Geothermal energy systems for terrestrial nodes; ocean thermal energy conversion (OTEC) as parallel concept
- **[THE] Thermal Energy:** Thermal management principles applicable to seawater cooling system design and waste heat utilization
- **[K8S] Kubernetes:** Container orchestration for distributed compute across floating nodes; federation patterns for ocean mesh
- **[SYS] Systems Administration:** Operational procedures for remote infrastructure management; monitoring and maintenance protocols
- **[ROF] Ring of Fire:** Pacific Rim seismic context for submarine cable vulnerability and floating infrastructure resilience

---

## 15. Sources

### Government and Agency Sources
- U.S. Department of Energy, Water Power Technologies Office -- Marine Energy Program
- Bureau of Ocean Energy Management (BOEM) -- Renewable Energy on the Outer Continental Shelf
- National Renewable Energy Laboratory (NREL) -- Wave Energy Resource Atlas

### Industry and Research
- Microsoft Research -- Project Natick findings (2015-2024): 8x reliability improvement, PUE validation
- Nautilus Data Technologies -- Port of Stockton floating data center: PUE 1.15, 4,500 GPM seawater cooling
- Keppel Data Centres -- Floating Data Centre Park (FDCP), Singapore
- Subsea Cloud -- Pressure-equalized pod deployment data
- Google -- Patent US7525207B2: Water-based data center system (2008)
- CenCore -- Containerized data center specifications and intermodal compatibility

### Standards
- ISO 668 -- Series 1 freight containers: classification, dimensions, and ratings
- ABS Rules for Building and Classing Marine Vessels -- Steel vessel structural requirements
- ASHRAE TC 9.9 -- Thermal guidelines for data processing environments

---

*The ocean is not the gap between continents. It is the platform upon which the next generation of infrastructure will float.*
