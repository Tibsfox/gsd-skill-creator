# PNW Living Systems: Ecological Networks

> **Phase 626 deliverable for the PNW Living Systems Taxonomy & Chipset (ECO mission)**
>
> This document maps the five major ecological pathways that connect species across the PNW Living Systems Taxonomy. Each pathway represents a network of energy, nutrient, and information flow that links organisms across elevation bands, habitat types, and trophic levels. In the derived chipset architecture, each pathway becomes a bus route connecting taxonomy modules.
>
> **Design principle:** The species are the nodes. The networks are the wires. This document maps the wires.

---

## Introduction: The Architecture of Relationship

An ecosystem is not a collection of species. It is a collection of *relationships* — and the relationships are where the ecosystem actually lives.

A Douglas-fir standing alone is a tree. A Douglas-fir connected to 200 fungal partners through mycorrhizal networks, feeding marine-derived nitrogen absorbed from decomposing salmon carcasses, providing nesting cavities for flying squirrels that disperse truffle spores, shading a stream where the next generation of salmon incubates — that tree is a node in a living network, and its meaning is defined by its connections.

The Pacific Northwest is one of the most intensively networked ecosystems on Earth. This is not an accident. The combination of extraordinary topographic relief (from -930 ft in Puget Sound to 14,410 ft on Mt. Rainier — ELEV-DEEP-MARINE through ELEV-ALPINE), extreme moisture gradients (300+ inches of precipitation on the Olympic Peninsula to 6 inches in the rain shadow), and the presence of anadromous salmon — biological vectors that physically transport marine nutrients into terrestrial ecosystems — has created a web of ecological connections unmatched in the temperate world.

This document maps five major network pathways:

1. **Salmon Nutrient Pathway** — the arterial system: marine nutrients flowing from ocean to forest
2. **Kelp-Otter-Urchin Cascade** — the classic trophic cascade: predator control shaping entire marine ecosystems
3. **Mycorrhizal Network** — the nervous system: fungal connections linking every tree in the forest
4. **Predator-Prey Dynamics** — the regulatory system: top-down control maintaining diversity
5. **Watershed Connectivity** — the circulatory system: water as the physical template for all other networks

These five pathways are not independent. They intersect, reinforce, and depend on each other in ways that make the PNW a single integrated system rather than a set of separate habitats. A salmon is simultaneously part of the salmon nutrient pathway, the predator-prey network, and the watershed connectivity system. A Douglas-fir is simultaneously a node in the mycorrhizal network, a beneficiary of salmon-derived nitrogen, and a structural element of watershed function. The synthesis section at the end of this document maps these intersections.

In the chipset architecture, each pathway maps to a bus — a communication channel connecting taxonomy modules. The salmon nutrient pathway becomes the `salmon_nutrient` bus. The mycorrhizal network becomes the `mycorrhizal_network` bus. Understanding the biological pathways is prerequisite to deriving the silicon.

---

## Pathway 1: Salmon Nutrient Pathway

**Bus designation:** `salmon_nutrient`
**Bus properties:** Bidirectional, high bandwidth, seasonal pulse
**Elevation span:** ELEV-DEEP-MARINE through ELEV-MONTANE (y=-64 to y=84)
**Habitat types:** HAB-PELAGIC, HAB-KELP, HAB-EELGRASS, HAB-STREAM, HAB-RIPARIAN, HAB-OLD-GROWTH, HAB-SECOND-GROWTH
**Connected modules:** fauna_marine, fauna_terrestrial, flora, fungi_microbiome, aquatic

### Overview

The salmon nutrient pathway is the arterial system of the PNW — a biological conveyor belt that moves marine-derived nutrients from the deep ocean into the heart of terrestrial forests. No other temperate ecosystem has anything comparable. The pathway operates through the life cycle of five species of Pacific salmon (genus *Oncorhynchus*), which spend 1-7 years feeding in the nutrient-rich North Pacific before returning to their natal streams to spawn and die, depositing marine-origin nitrogen, phosphorus, carbon, and micronutrients across the landscape.

This is not a metaphor. It is measurable. Using stable isotope analysis (nitrogen-15 and carbon-13), researchers have traced marine-derived nutrients from salmon carcasses into stream invertebrates, riparian vegetation, upland trees, songbirds, and even insects hundreds of meters from the nearest salmon-bearing stream. The salmon nutrient pathway is the PNW's most important cross-boundary nutrient subsidy, linking the pelagic Pacific Ocean (HAB-PELAGIC, ELEV-DEEP-MARINE) to montane forests (HAB-OLD-GROWTH, ELEV-MONTANE) through a chain of biological vectors.

### The Nutrient Chain

The salmon nutrient pathway operates through a series of linked transfers, each mediated by specific organisms:

#### Stage 1: Marine Accumulation (Ocean Phase)

**Elevation:** ELEV-DEEP-MARINE, ELEV-SHALLOW-MARINE (y=-64 to y=-41)
**Habitat:** HAB-PELAGIC

Pacific salmon spend the majority of their lives in the North Pacific Ocean, feeding on marine invertebrates, small fish, and zooplankton. During this phase, they accumulate marine-derived nitrogen (MDN) — nitrogen with a distinctive isotopic signature (enriched in N-15 relative to terrestrial nitrogen) that serves as a natural tracer. A single adult Chinook salmon (*Oncorhynchus tshawytscha*) returning at 20-40 lbs body weight carries approximately 130-260 grams of nitrogen, 20-30 grams of phosphorus, and substantial quantities of marine-derived carbon, sulfur, and micronutrients (Naiman et al. 2002).

The five Pacific salmon species partition the marine environment:

| Species | Ocean residence | Primary ocean diet | Typical return weight | N content (approx.) |
|---------|----------------|--------------------|--------------------|-------------------|
| **Chinook** (*O. tshawytscha*) | 2-7 years | Fish, squid | 20-50 lbs | 130-325 g |
| **Sockeye** (*O. nerka*) | 1-4 years | Zooplankton | 5-8 lbs | 33-52 g |
| **Coho** (*O. kisutch*) | 1-3 years | Fish, invertebrates | 8-12 lbs | 52-78 g |
| **Chum** (*O. keta*) | 2-5 years | Jellyfish, zooplankton | 8-15 lbs | 52-98 g |
| **Pink** (*O. gorbuscha*) | 2 years (fixed) | Zooplankton, small fish | 3-5 lbs | 20-33 g |

**Ecological roles:** ROLE-SECONDARY-CONSUMER (ocean phase), ROLE-PRIMARY-CONSUMER (juvenile phase)

#### Stage 2: Spawning Migration (River Phase)

**Elevation:** ELEV-RIPARIAN through ELEV-MONTANE (y=-41 to y=84)
**Habitat:** HAB-STREAM, HAB-RIPARIAN

Adult salmon cease feeding upon entering fresh water and rely entirely on stored marine nutrients for energy during upstream migration. Some Chinook populations migrate over 900 miles and gain over 6,500 feet of elevation — from sea level (y=-41) to montane streams above 3,000 ft (y=34+). This is the physical transport phase: marine nutrients, packaged in salmon tissue, moving upstream against gravity, powered by the energy of the ocean.

The density of returning salmon historically defied modern imagination. The Columbia River alone supported an estimated 10-16 million adult salmon annually before dam construction (Northwest Power and Conservation Council estimates). Individual tributaries received tens of thousands to hundreds of thousands of fish. The biomass of marine-derived nutrients delivered to PNW watersheds was measured in thousands of tonnes per year.

#### Stage 3: Carcass Deposition and Terrestrial Vectoring

**Elevation:** ELEV-RIPARIAN, ELEV-LOWLAND (y=-41 to y=34)
**Habitat:** HAB-STREAM, HAB-RIPARIAN, HAB-OLD-GROWTH, HAB-SECOND-GROWTH

After spawning, salmon die and their carcasses become the nutrient payload. This is where the pathway branches from aquatic to terrestrial through biological vectors:

**Bears (ROLE-SECONDARY-CONSUMER, ROLE-SEED-DISPERSER):** Black bears (*Ursus americanus*) and grizzly/brown bears (*Ursus arctos* — historically throughout PNW, now restricted to North Cascades and northern BC) are the primary large-scale terrestrial vectors. Bears catch salmon and carry carcasses into the forest for consumption, typically 50-150 meters from the stream but documented up to 500 meters. Bears consume selectively — brain and roe first, often abandoning partially eaten carcasses — depositing an estimated 40-70% of the carcass nitrogen on the forest floor (Reimchen 2000; Hilderbrand et al. 1999). A single bear may transport 600-700 salmon carcasses per season in productive systems.

**Eagles (ROLE-SECONDARY-CONSUMER):** Bald eagles (*Haliaeetus leucocephalus*) congregate on salmon streams in extraordinary densities during spawning runs — over 3,000 birds on the Skagit River in November-December, one of the largest bald eagle concentrations in the lower 48 states. Eagles carry fish and fragments to perch trees, depositing nutrients at the base of large conifers along the riparian corridor. Eagle-deposited nitrogen has been measured in the foliage of perch trees at significantly elevated N-15 levels (Reimchen et al. 2003).

**Other vectors:**
- **Gulls** (*Larus* spp.) — scavenge carcasses, deposit guano across wider area
- **River otters** (*Lontra canadensis*) — consume salmon, deposit nutrient-rich scat on stream banks
- **Coyotes** (*Canis latrans*) — scavenge carcasses, transport fragments inland
- **Ravens** (*Corvus corax*) — scavenge and cache salmon fragments in forest
- **Mink** (*Neogale vison*) — carry small salmon and fragments into riparian corridors
- **Invertebrates** — blowflies (*Calliphoridae*) colonize carcasses, larvae fall into soil or are consumed by songbirds; stonefly and caddisfly larvae consume carcass tissue in-stream

#### Stage 4: Decomposition and Soil Incorporation

**Elevation:** ELEV-RIPARIAN, ELEV-LOWLAND (y=-41 to y=34)
**Habitat:** HAB-RIPARIAN, HAB-OLD-GROWTH

Salmon carcasses deposited on the forest floor undergo decomposition mediated by bacteria and fungi (ROLE-DECOMPOSER). This process releases marine-derived nitrogen, phosphorus, and carbon into the soil in plant-available forms:

**Fungal decomposition:** Saprophytic fungi colonize carcass tissue within days, breaking down proteins and releasing ammonium and nitrate into the soil. Ectomycorrhizal fungi associated with conifer roots then absorb these nutrients and transport them directly into tree root systems through hyphal networks. This creates a direct nutrient pipeline: salmon carcass → fungal decomposer → mycorrhizal network → tree roots → canopy.

**Bacterial decomposition:** Soil bacteria process carcass nitrogen through nitrification and denitrification pathways. In waterlogged riparian soils, denitrification returns some nitrogen to the atmosphere as N2, but the majority is retained in soil organic matter or absorbed by vegetation.

**Soil fauna:** Earthworms, millipedes, mites, and other soil invertebrates fragment carcass tissue and mix decomposition products into deeper soil horizons, increasing the effective depth of nutrient incorporation.

#### Stage 5: Vegetation Uptake and Canopy Signal

**Elevation:** ELEV-RIPARIAN, ELEV-LOWLAND, ELEV-MONTANE (y=-41 to y=84)
**Habitat:** HAB-RIPARIAN, HAB-OLD-GROWTH, HAB-SECOND-GROWTH

The final stage of the terrestrial pathway: trees and shrubs absorb marine-derived nitrogen through their roots (directly and through mycorrhizal intermediaries) and incorporate it into wood, foliage, and reproductive tissue.

**Helfield and Naiman (2001)** demonstrated that Sitka spruce (*Picea sitchensis*) growing along salmon-bearing streams on the Olympic Peninsula had significantly higher growth rates and elevated N-15 signatures compared to trees along salmon-free streams. Trees within 25 meters of salmon-bearing streams showed 2-3x higher nitrogen content in foliage, and annual ring-width analysis demonstrated that tree growth correlated with salmon run size over multi-decadal timescales.

The spatial extent of the marine nitrogen signal:

| Distance from stream | N-15 enrichment (relative to control) | Primary vector |
|---------------------|---------------------------------------|----------------|
| 0-25 m | High (significant) | Stream flooding, direct carcass decomposition |
| 25-100 m | Moderate (significant) | Bear and eagle transport, mycorrhizal redistribution |
| 100-250 m | Low but detectable | Bear transport, subsurface flow |
| 250-500 m | Trace (occasionally detectable) | Bear transport in high-density bear populations |
| >500 m | Not detected | — |

The riparian vegetation that absorbs salmon-derived nitrogen then stabilizes stream banks, provides shade that maintains cool water temperatures, recruits large wood into the stream channel, and produces leaf litter that feeds aquatic invertebrates — completing a feedback loop that supports the next generation of salmon.

### The Feedback Loop

The salmon nutrient pathway is not a one-way conveyor. It is a cycle with positive feedback:

```
    OCEAN                          FOREST
      |                              |
   Salmon accumulate     Trees absorb marine nitrogen
   marine nutrients      → grow larger, shade streams
      |                  → stabilize banks, recruit
   Salmon return to          large wood
   natal streams              |
      |                  Large wood creates pool-riffle
   Spawn and die         complexity → better juvenile
      |                  salmon habitat
   Carcasses vectored         |
   into forest by        Juvenile salmon rear in
   bears/eagles          high-quality habitat
      |                       |
   Fungi decompose       Smolts migrate to ocean
   carcass tissue        → cycle restarts
      |                       |
   Mycorrhizal network   ←————┘
   transports nutrients
   to tree roots
```

This positive feedback means that salmon nutrient delivery and forest health are coupled: healthy forests produce healthy streams that produce healthy salmon runs that fertilize healthy forests. Conversely, disruption at any point — dam construction blocking salmon migration, logging removing riparian vegetation, overfishing reducing run sizes — degrades the entire cycle.

### Quantitative Dimensions

**Historical nutrient delivery (pre-dam, pre-commercial fishing):**

The Columbia River basin alone historically received an estimated 60,000-160,000 tonnes of salmon biomass annually (calculated from estimated 10-16 million adults × average 15 lbs/fish). At approximately 3% nitrogen and 0.5% phosphorus content, this represents:

| Nutrient | Annual delivery (Columbia basin) | Source |
|----------|--------------------------------|--------|
| Nitrogen | 1,800-4,800 tonnes/year | Naiman et al. 2002 |
| Phosphorus | 300-800 tonnes/year | Naiman et al. 2002 |
| Carbon | 6,000-16,000 tonnes/year | Calculated from biomass |

**Current nutrient delivery:**
Columbia basin salmon runs have declined to approximately 1-2 million adults (including hatchery fish), representing a 75-90% reduction in marine-derived nutrient delivery. Many tributaries that historically received tens of thousands of salmon now receive hundreds or fewer. The nutrient deficit is measurable in reduced tree growth, altered soil chemistry, and simplified riparian food webs.

**Isotopic evidence:**

N-15 enrichment in salmon-fertilized ecosystems:

| Organism/substrate | N-15 enrichment (salmon vs. reference) | Study |
|--------------------|---------------------------------------|-------|
| Sitka spruce foliage | +2.5-3.5 per mil | Helfield & Naiman 2001 |
| Riparian shrubs | +1.5-3.0 per mil | Helfield & Naiman 2001 |
| Stream invertebrates | +3.0-5.0 per mil | Bilby et al. 1996 |
| Soil organic matter | +1.0-2.0 per mil | Helfield & Naiman 2001 |
| Songbird feathers | +2.0-4.0 per mil | Reimchen et al. 2003 |
| Riparian insects | +1.5-3.5 per mil | Hocking & Reimchen 2002 |
| Bear hair | +4.0-6.0 per mil | Hilderbrand et al. 1999 |

### Cross-Module Connections

| Module | Species/System | Connection Type |
|--------|---------------|-----------------|
| **fauna_marine** | Pacific salmon (all 5 spp.) | Primary nutrient vector |
| **fauna_marine** | Pacific lamprey (*Entosphenus tridentatus*) | Parallel nutrient vector (MDN transport) |
| **fauna_terrestrial** | Black bear, grizzly bear | Terrestrial carcass transport |
| **fauna_terrestrial** | Bald eagle | Aerial carcass transport |
| **fauna_terrestrial** | River otter, mink, coyote | Secondary carcass scavengers |
| **flora** | Sitka spruce, western red cedar, red alder | Nutrient recipients (riparian trees) |
| **flora** | Riparian shrubs (salmonberry, devil's club) | Nutrient recipients (understory) |
| **fungi_microbiome** | Saprophytic fungi | Carcass decomposition |
| **fungi_microbiome** | Ectomycorrhizal fungi | Nutrient transport to tree roots |
| **aquatic** | Stream invertebrates (stoneflies, caddisflies) | In-stream carcass consumers |
| **aquatic** | Bull trout, cutthroat trout | Benefit from salmon-derived nutrients |
| **networks** | Mycorrhizal Network pathway | Nutrient redistribution after soil incorporation |
| **networks** | Watershed Connectivity pathway | Physical template for salmon migration |

### Minecraft System Equivalent

The salmon nutrient pathway maps to a **water-flow and item-transport system** in Minecraft:

- **Water channels** (HAB-STREAM → y=-29 to y=84) represent salmon migration routes
- **Item transport** (hopper chains or water item elevators) represents upstream nutrient movement
- **Bone meal dispensers** at stream-adjacent blocks represent carcass decomposition and nutrient release
- **Crop/tree growth acceleration** near water channels represents enhanced riparian vegetation growth
- **Spawning mechanics** (fish mob spawning in flowing water) represent salmon reproduction

The bus operates seasonally — nutrient pulses correspond to salmon run timing (fall for most species, spring for Chinook). In Minecraft, this could be represented by daylight sensor-triggered dispensing cycles.

### Network Diagram

```
                         ┌─────────────────────────┐
                         │    NORTH PACIFIC OCEAN    │
                         │  ELEV-DEEP-MARINE (y=-64) │
                         │  Salmon accumulate MDN    │
                         └────────────┬──────────────┘
                                      │
                                      │ Spawning migration
                                      │ (upstream, against gravity)
                                      ▼
                         ┌─────────────────────────┐
                         │    ESTUARY / RIVER       │
                         │  ELEV-RIPARIAN (y=-41)   │
                         │  Transit zone             │
                         └────────────┬──────────────┘
                                      │
                         ┌────────────┼────────────┐
                         │            │            │
                         ▼            ▼            ▼
                    ┌─────────┐ ┌──────────┐ ┌──────────┐
                    │  BEARS  │ │  EAGLES  │ │  STREAM  │
                    │ 50-500m │ │  perch   │ │  in-situ │
                    │ inland  │ │  trees   │ │  decay   │
                    └────┬────┘ └────┬─────┘ └────┬─────┘
                         │          │             │
                         ▼          ▼             ▼
                    ┌─────────────────────────────────┐
                    │        FOREST FLOOR              │
                    │  ELEV-LOWLAND (y=-29 to y=34)    │
                    │  Carcass decomposition            │
                    │  Fungi + bacteria + invertebrates │
                    └────────────────┬─────────────────┘
                                     │
                         ┌───────────┼───────────┐
                         │                       │
                         ▼                       ▼
                   ┌──────────┐          ┌──────────────┐
                   │  SOIL    │          │  MYCORRHIZAL │
                   │  UPTAKE  │          │  NETWORK     │
                   │  direct  │          │  fungal      │
                   │  root    │          │  transport   │
                   └────┬─────┘          └──────┬───────┘
                        │                       │
                        └───────────┬───────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │     CANOPY / VEGETATION     │
                    │  Enhanced growth, N-15       │
                    │  signal in wood and foliage  │
                    │  → Shade streams             │
                    │  → Recruit large wood        │
                    │  → Stabilize banks           │
                    └──────────────┬──────────────┘
                                   │
                                   │ Positive feedback:
                                   │ better habitat →
                                   │ more salmon →
                                   │ more nutrients
                                   ▼
                    ┌─────────────────────────────┐
                    │  JUVENILE SALMON HABITAT    │
                    │  Pool-riffle complexity     │
                    │  Cold, shaded water         │
                    │  → Smolts to ocean          │
                    │  → Cycle restarts           │
                    └─────────────────────────────┘
```

## The River's Witness

The River's Witness is the cross-series ecological thread connecting all PNW Living Systems Taxonomy research through the life cycle of Pacific salmon (*Oncorhynchus* spp.). Salmon are the only biological vectors that physically transport marine-derived nutrients from the deep Pacific into the heart of PNW terrestrial ecosystems. They appear in ECO (ecological networks, salmon nutrient pathway), AVI (osprey, bald eagle, dipper, kingfisher, corvids at carcass sites), and MAM (black bear, river otter, mink, marten, wolf, and all riparian predators). Any document in the PNW series that references salmon cites this thread by name.

**Cross-series citations:** `www/PNW/AVI/research/salmon-thread-avi.md` | `www/PNW/MAM/research/salmon-thread-mam.md`

---

## Pathway 2: Kelp-Otter-Urchin Cascade

**Bus designation:** `predator_prey` (shared with Pathway 4)
**Bus properties:** Directional (top-down), medium bandwidth
**Elevation span:** ELEV-SHALLOW-MARINE through ELEV-INTERTIDAL (y=-46 to y=-41)
**Habitat types:** HAB-KELP, HAB-ROCKY-INTERTIDAL, HAB-EELGRASS
**Connected modules:** fauna_marine, flora, fungi_microbiome

### Overview

The kelp-otter-urchin cascade is among the most famous trophic cascades in ecology and one of the clearest demonstrations that predators structure ecosystems from the top down. The cascade operates through three trophic levels:

1. **Sea otters** (*Enhydra lutris*) — ROLE-KEYSTONE, ROLE-APEX — eat sea urchins
2. **Sea urchins** (primarily red urchin *Mesocentrotus franciscanus* and purple urchin *Strongylocentrotus purpuratus*) — ROLE-PRIMARY-CONSUMER — eat kelp
3. **Kelp forests** (primarily bull kelp *Nereocystis luetkeana* and giant kelp *Macrocystis pyrifera*) — ROLE-PRIMARY-PRODUCER, ROLE-FOUNDATION — create three-dimensional habitat

When sea otters are present, urchin populations are controlled, kelp forests flourish, and hundreds of species that depend on kelp habitat thrive. When sea otters are absent, urchins overgraze kelp, forests collapse into "urchin barrens" — moonscape-like expanses of bare rock grazed clean of all macroalgae — and the entire community simplifies catastrophically.

### Historical Context

Sea otters once ranged continuously from Baja California through the Aleutian Islands to northern Japan, with an estimated pre-fur-trade population of 150,000-300,000 individuals. Between 1741 and 1911, the maritime fur trade reduced sea otters to approximately 1,000-2,000 animals in 13 scattered remnant populations. The PNW population was essentially extirpated — the last known Washington otter was killed near Destruction Island in 1910 (Kenyon 1969).

The ecological consequences were catastrophic but not immediately recognized. Without otter predation, sea urchin populations exploded across the PNW nearshore. Urchins grazed kelp holdfasts — the root-like structures anchoring kelp to rock — severing entire plants that then washed away. Over decades, vast kelp forests converted to urchin barrens. The full extent of this transformation was not understood until James Estes and John Palmisano published their landmark comparison of otter-present and otter-absent islands in the Aleutians in 1974, documenting a 10-100x difference in kelp canopy coverage between islands with and without otters.

### Cascade Mechanics

#### Top-Down Control: Sea Otter Predation

**Species:** Sea otter (*Enhydra lutris*) — ROLE-KEYSTONE, ROLE-APEX
**Elevation:** ELEV-SHALLOW-MARINE (y=-46 to y=-41)
**Habitat:** HAB-KELP, HAB-ROCKY-INTERTIDAL

Sea otters are the smallest marine mammal, weighing 45-100 lbs, but they have the highest metabolic rate of any marine mammal (2-3x predicted for their body size) and must consume 25-30% of their body weight daily. This extraordinary metabolic demand makes them voracious predators of benthic invertebrates, particularly sea urchins. A single sea otter can consume 50-100 urchins per day.

Otter foraging is not uniform — they preferentially target the largest, most accessible urchins, which are the reproductively dominant individuals. This selective predation is ecologically efficient: removing the largest urchins disproportionately reduces urchin grazing pressure because larger urchins consume more kelp per individual and produce disproportionately more offspring.

Sea otters maintain urchin populations at 1-5% of their ungrazed density in areas where otters are well-established (Estes & Duggins 1995). This level of control is sufficient to allow full kelp forest canopy development.

#### Herbivore Impact: Sea Urchin Grazing

**Species:** Red sea urchin (*Mesocentrotus franciscanus*), purple sea urchin (*Strongylocentrotus purpuratus*) — ROLE-PRIMARY-CONSUMER
**Elevation:** ELEV-SHALLOW-MARINE, ELEV-INTERTIDAL (y=-46 to y=-41)
**Habitat:** HAB-KELP, HAB-ROCKY-INTERTIDAL

In the absence of predator control, sea urchin populations can reach densities of 50-200+ individuals per square meter on formerly kelp-forested reefs. At these densities, urchins form grazing fronts that advance across rocky substrate, consuming all attached macroalgae — kelp, coralline algae, fleshy red algae — and reducing complex reef communities to bare, coralline-crusted rock.

The transition from kelp forest to urchin barren is not gradual. It is a regime shift — a rapid, threshold-driven transition between two alternative stable states. Once urchin density exceeds the threshold (~25-30 individuals/m2 depending on species and productivity), the system tips rapidly to a barren state. Recovery is difficult because urchins in barrens switch to a "starved but persistent" state, surviving on drift algae and microfilm for years while maintaining densities sufficient to prevent kelp reestablishment.

Purple urchins are particularly problematic because they can survive in a starved, reproductively dormant state for years, maintaining barren conditions even when food is nearly absent. Red urchins are larger and commercially valuable, providing some harvest-based population control, but purple urchins have no commercial market and no natural population ceiling in the absence of predation.

#### Foundation Species: Kelp Forest Structure

**Species:** Bull kelp (*Nereocystis luetkeana*), giant kelp (*Macrocystis pyrifera*) — ROLE-PRIMARY-PRODUCER, ROLE-FOUNDATION
**Elevation:** ELEV-SHALLOW-MARINE (y=-46 to y=-41)
**Habitat:** HAB-KELP

Bull kelp is the dominant canopy-forming kelp in the PNW, an annual alga that grows from a single holdfast attached to rocky substrate at depths of 10-80 ft (3-24 m). Each plant produces a single stipe (stem) up to 80 ft long, terminating in a gas-filled pneumatocyst (float) that supports a spreading canopy of photosynthetic blades at the water surface. Bull kelp grows up to 10 inches per day — among the fastest growth rates of any organism on Earth — and completes its entire life cycle in a single growing season (March to December).

The ecological value of kelp forests is analogous to old-growth terrestrial forests (HAB-OLD-GROWTH). Kelp forests create:

- **Canopy layer** (surface): shading, wave attenuation, habitat for surface-associated fish and invertebrates
- **Midwater layer** (stipes): structural complexity used by schooling fish, juvenile rockfish, kelp crabs
- **Benthic layer** (holdfast and substrate): shelter for hundreds of invertebrate species — snails, chitons, worms, small crabs, brittle stars, sponges
- **Detrital export**: kelp fragments that detach and drift to deep water, sandy beaches, and rocky intertidal, subsidizing food webs in habitats far from the living forest

Bull kelp forests in the PNW support an estimated 750+ species (Graham et al. 2007). The loss of kelp forest is therefore not the loss of one species — it is the loss of an entire habitat and all its dependents.

### The Sunflower Sea Star Complication

The kelp-otter-urchin cascade has a fourth player that was not fully appreciated until its catastrophic decline: the sunflower sea star (*Pycnopodia helianthoides*).

Sunflower sea stars are enormous (up to 3.3 ft arm span), fast-moving (capable of covering 160 ft/hour), voracious predators of sea urchins. They provided a parallel, otter-independent mechanism for urchin population control across much of the PNW nearshore, particularly in Puget Sound and the inland waters of British Columbia where sea otters were absent.

Beginning in 2013, Sea Star Wasting Syndrome (SSWS) — a disease complex potentially linked to a densovirus exacerbated by warming ocean temperatures — caused mass mortality of sea stars along the entire Pacific coast. Sunflower sea stars were the hardest hit: populations declined by an estimated 90-99% across their range (Harvell et al. 2019). The species was listed as Critically Endangered by IUCN in 2020.

The loss of sunflower sea stars removed urchin predation control from precisely those areas where sea otters were already absent — creating a "predator vacuum" that triggered explosive urchin population growth and rapid kelp forest collapse:

| Region | Kelp canopy change after SSWS | Otter presence | Primary cause |
|--------|------------------------------|----------------|---------------|
| Northern California (Sonoma/Mendocino) | -95% | No | Urchin overgrazing after sea star loss |
| San Juan Islands (WA) | -40-60% | No | Urchin overgrazing + marine heat wave |
| Olympic outer coast (WA) | Stable to slight decline | Partial (reintroduced) | Otters providing partial control |
| Strait of Juan de Fuca | -30-50% | No | Urchin increase |
| Puget Sound (inner) | Variable, localized declines | No | Urchin increase + water quality |

The sunflower sea star crisis demonstrates that the otter-urchin-kelp cascade is embedded in a broader network — removing *any* urchin predator tips the balance toward barren formation.

### Current State: Partial Recovery on the Olympic Coast

In 1969-1970, 59 sea otters from Amchitka Island, Alaska were translocated to the Olympic coast of Washington (Point Grenville to Cape Flattery). The population has grown to approximately 2,700-3,000 animals (2023 USFWS survey) and is expanding slowly along the outer coast.

Where otters have recolonized, the kelp-otter-urchin cascade has re-engaged:

- Urchin densities have declined dramatically on otter-occupied reefs
- Bull kelp canopy has recovered or remains intact
- Species diversity on otter-occupied reefs is significantly higher than on otter-absent reefs in Puget Sound

However, otters have not yet recolonized Puget Sound, the San Juan Islands, or the Strait of Georgia — the areas most affected by the sunflower sea star collapse. USFWS is currently evaluating sea otter reintroduction to these areas, with a feasibility study expected by 2026.

The Olympic coast otter population demonstrates that the cascade is reversible: restore the predator, and the forest returns. But the window of reversibility may be closing — some heavily grazed reefs have lost the coralline algae substrate that kelp spores require for settlement, and purple urchin populations in barrens may be too dense for even recovering otter populations to control without human-assisted urchin removal.

### Cross-Module Connections

| Module | Species/System | Connection Type |
|--------|---------------|-----------------|
| **fauna_marine** | Sea otter (*Enhydra lutris*) | Keystone predator (top of cascade) |
| **fauna_marine** | Sunflower sea star (*Pycnopodia helianthoides*) | Parallel urchin predator (collapsed) |
| **fauna_marine** | Red/purple sea urchin | Primary herbivore (middle of cascade) |
| **fauna_marine** | Lingcod, rockfish, kelp greenling | Kelp forest-dependent predators |
| **fauna_marine** | Harbor seal, Steller sea lion | Kelp forest users |
| **flora** | Bull kelp, giant kelp | Foundation species (bottom of cascade) |
| **flora** | Coralline algae | Settlement substrate for kelp spores |
| **aquatic** | Pacific herring | Spawn on kelp blades |
| **aquatic** | Dungeness crab (juvenile) | Kelp canopy nursery |
| **fungi_microbiome** | Marine fungi and bacteria | Kelp decomposition, detrital cycling |
| **networks** | Salmon Nutrient Pathway | Marine nutrient subsidy to kelp productivity |
| **networks** | Watershed Connectivity | Terrestrial sediment impacts on kelp clarity |

### Minecraft System Equivalent

The kelp-otter-urchin cascade maps to a **mob spawning and plant growth system:**

- **Kelp blocks** (Minecraft kelp grows from seabed to surface) represent bull kelp forests
- **Mob spawning rules:** when "otter" mobs are present, "urchin" mob spawning is suppressed
- **When urchins are unsuppressed:** kelp blocks are consumed/broken at a rate proportional to urchin density
- **Trophic cascade mechanic:** removing the otter mob from a chunk triggers urchin population explosion → kelp die-off → dependent fish mob despawning

This could be implemented as a custom datapack with mob interaction rules and block-breaking behavior.

### Network Diagram

```
                    ┌──────────────────┐
                    │    SEA OTTER     │
                    │  ROLE-KEYSTONE   │
                    │  ROLE-APEX       │
                    │  Pop: ~2,700 WA  │
                    └────────┬─────────┘
                             │
                    Predation│(25-30% body weight/day)
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌────────────┐ ┌───────────┐ ┌────────────┐
       │ RED URCHIN │ │  PURPLE   │ │  OTHER     │
       │ M.francis. │ │  URCHIN   │ │  INVERTS   │
       │ Commercial │ │  S.purp.  │ │  crabs,    │
       │ value      │ │  No market│ │  clams     │
       └─────┬──────┘ └─────┬─────┘ └────────────┘
             │              │
             └──────┬───────┘
                    │
           Grazing  │ (holdfasts, stipes, blades)
                    │
                    ▼
       ┌─────────────────────────┐
       │     KELP FOREST         │
       │  ROLE-FOUNDATION        │
       │  Bull kelp, giant kelp  │
       │  750+ dependent species │
       │                         │
       │  ┌─ Canopy (surface)    │
       │  ├─ Midwater (stipes)   │
       │  └─ Benthic (holdfast)  │
       └─────────────────────────┘
                    │
        Habitat for │
                    ▼
    ┌───────────────────────────────┐
    │  DEPENDENT COMMUNITY          │
    │  Rockfish (20+ species)       │
    │  Lingcod, greenling           │
    │  Pacific herring (spawning)   │
    │  Juvenile Dungeness crab      │
    │  Harbor seals                 │
    │  Invertebrates (100s spp.)    │
    └───────────────────────────────┘

    PARALLEL PREDATOR (COLLAPSED):
    ┌──────────────────────────┐
    │  SUNFLOWER SEA STAR      │
    │  Pycnopodia              │
    │  Pre-2013: urchin control│
    │  Post-2013: 90-99% loss  │
    │  IUCN: Critically Endang.│
    └──────────────────────────┘
```

---

## Pathway 3: Mycorrhizal Network

**Bus designation:** `mycorrhizal_network`
**Bus properties:** Bidirectional, high bandwidth, persistent infrastructure
**Elevation span:** ELEV-LOWLAND through ELEV-SUBALPINE (y=-29 to y=196)
**Habitat types:** HAB-OLD-GROWTH, HAB-SECOND-GROWTH, HAB-SUBALPINE-PARKLAND, HAB-RIPARIAN
**Connected modules:** flora, fungi_microbiome, fauna_terrestrial

### Overview

The mycorrhizal network — popularly known as the "Wood Wide Web" — is the central infrastructure network of PNW forests. It is to the forest what the internet is to human civilization: a decentralized, scale-free network connecting nodes (trees) through a shared communication and transport medium (fungal hyphae), enabling the exchange of resources (carbon, nitrogen, water, phosphorus) and information (chemical defense signals, stress indicators).

This network is not a metaphor. It is a physical, measurable, experimentally verified system. Suzanne Simard's research group at the University of British Columbia, building on foundational work beginning with Simard et al. (1997), has demonstrated through radiocarbon labeling, isotopic tracing, and network analysis that:

1. Trees are connected through shared mycorrhizal fungal partners
2. Resources (carbon, nitrogen, water) flow through these connections
3. The flow is not random — it follows network topology and responds to need
4. The network has scale-free architecture: a few highly connected "hub trees" (mother trees) connect to many peripheral trees
5. Disrupting the network (through clearcutting, soil disturbance, or herbicide application) degrades forest health and regeneration

The mycorrhizal network is the biological equivalent of the GSD chipset's bus architecture — a bidirectional, high-bandwidth communication channel connecting all nodes in the system.

### Mycorrhizal Biology: The Partnership

Mycorrhiza (literally "fungus-root") is a mutualistic association between plant roots and soil fungi. The partnership is ancient — it predates the evolution of true roots, originating approximately 450 million years ago when the earliest land plants colonized terrestrial environments. Over 90% of all plant species form mycorrhizal associations; in PNW conifer forests, the figure approaches 100%.

#### Ectomycorrhizal (ECM) Networks

PNW conifer forests are dominated by **ectomycorrhizal** (ECM) associations, in which fungal hyphae form a dense sheath (mantle) around the fine root tips of trees and penetrate between root cortical cells (the Hartig net) without entering the cells themselves. The Hartig net is the exchange interface — the biological equivalent of a bus connector — where carbon flows from tree to fungus and mineral nutrients flow from fungus to tree.

Key ECM fungi forming network connections in PNW forests:

| Fungal species | Tree partners | Network role | Fruiting body |
|---------------|---------------|--------------|---------------|
| **Rhizopogon vesiculosus** | Douglas-fir, primarily | Primary network former; connects most trees in Douglas-fir stands | Hypogeous (underground truffle) |
| **Rhizopogon vinicolor** | Douglas-fir, primarily | Co-dominant network former with R. vesiculosus | Hypogeous truffle |
| **Russula brevipes** | Douglas-fir, western hemlock, Sitka spruce | Abundant generalist; widespread connections | Epigeous (above-ground mushroom) |
| **Cortinarius** spp. (100+ species) | Multiple conifer hosts | Deep soil exploration; nutrient mining from mineral soil | Epigeous mushroom |
| **Suillus** spp. | Pine species (whitebark pine, lodgepole pine) | Specialist pine associates; critical in subalpine | Epigeous mushroom (slippery jacks) |
| **Tricholoma murrillianum** (matsutake) | Douglas-fir, hemlock, Sitka spruce, shore pine | Late-seral associate; cultural significance | Epigeous mushroom |
| **Piloderma** spp. | Multiple conifers | Abundant mat-forming genus; organic soil specialist | Resupinate (crust on wood) |
| **Cenococcum geophilum** | Nearly all trees (broadest host range of any ECM fungus) | Drought-tolerance specialist; black sclerotia persist in soil for decades | No conspicuous fruiting body |

**Ecological roles:** ROLE-DECOMPOSER (partial — ECM fungi can access nutrients locked in organic matter), ROLE-FOUNDATION (network infrastructure)

#### Arbuscular Mycorrhizal (AM) Networks

Understory plants, hardwoods (red alder, bigleaf maple), and many shrubs form **arbuscular mycorrhizal** (AM) associations with fungi in the phylum Glomeromycota. AM fungi penetrate root cortical cells, forming branched structures (arbuscules) that serve as the exchange interface. AM networks are generally shorter-range than ECM networks but connect different plant species into mixed communities.

In PNW forests, AM and ECM networks coexist but do not directly interconnect (different fungal phyla). However, they can share the same soil volume, and nutrient cycling by AM-associated plants (particularly nitrogen-fixing red alder) benefits ECM-associated conifers indirectly.

### Network Architecture: Scale-Free Topology

Simard's research has revealed that mycorrhizal networks in Douglas-fir forests have **scale-free topology** — a network structure characterized by a few highly connected nodes (hubs) and many nodes with few connections. This is the same architecture found in the internet, airline route networks, and social networks (Barabasi & Albert 1999).

In forest mycorrhizal networks:

- **Hub trees ("mother trees"):** The largest, oldest trees in a stand serve as network hubs, connected to dozens or hundreds of neighboring trees through shared fungal partners. A single old-growth Douglas-fir may be connected to 47+ other trees through *Rhizopogon* networks (Beiler et al. 2010).

- **Peripheral trees:** Younger, smaller trees have fewer connections (typically 1-8) and depend on hub trees for network access to nutrients and water.

- **Network resilience:** Scale-free networks are resilient to random node failure (losing a peripheral tree has minimal network impact) but vulnerable to targeted hub removal (losing a mother tree can fragment the network and isolate dependent trees).

This has profound implications for forestry. Clearcutting — the dominant harvest method in PNW industrial forestry — removes all trees including hubs, destroying network infrastructure that may have taken centuries to develop. The network does not regenerate quickly: even after replanting, it takes 40-80 years for mycorrhizal network complexity to approach pre-harvest levels, and centuries for full hub tree development.

### Resource Flow: What Moves Through the Network

#### Carbon

The most surprising discovery in mycorrhizal network research is that trees share carbon — the product of their own photosynthesis — through fungal connections. Simard et al. (1997) demonstrated bidirectional carbon transfer between Douglas-fir and paper birch through shared ECM networks using radiocarbon (C-14) labeling: carbon fixed by one tree appeared in the tissues of neighboring trees connected by fungal hyphae.

Carbon flow is not random. It follows source-sink dynamics:

- Carbon flows from **source trees** (high photosynthesis, surplus carbon) to **sink trees** (shaded, stressed, low photosynthesis)
- Shaded understory seedlings receive carbon subsidies from canopy trees through the network — a form of "parental investment" that increases seedling survival in deep shade
- Dying trees dump carbon reserves into the network before death, redistributing accumulated resources to surviving neighbors (Simard 2012)

The network retains approximately 20-30% of transferred carbon as "infrastructure maintenance" — payment to the fungal partner for the transport service. This is not parasitism; it is the cost of network operation, analogous to bandwidth fees in a telecommunications network.

#### Nitrogen

Nitrogen flows through mycorrhizal networks from areas of high concentration to areas of low concentration, and from nitrogen-fixing plants (red alder, through AM networks) toward nitrogen-limited conifers (through ECM networks, indirectly via soil).

Marine-derived nitrogen from salmon carcasses (see Pathway 1: Salmon Nutrient Pathway) enters the mycorrhizal network after soil incorporation and can be redistributed to trees well beyond the immediate riparian zone — the mycorrhizal network extends the spatial reach of the salmon nutrient pathway.

#### Water

ECM fungi with extensive hyphal networks (particularly *Cortinarius* species, whose hyphae can extend 10+ meters from root tips) can access soil water unavailable to roots alone. During drought, water moves through fungal hyphae from moist microsites to water-stressed root tips, and potentially between connected trees through hydraulic redistribution.

This water-transport function is increasingly important under climate change, as summer drought stress intensifies across the PNW. Trees connected to extensive mycorrhizal networks show greater drought tolerance than isolated trees or trees in recently disturbed stands with degraded networks.

#### Defense Signals

Perhaps the most remarkable function of mycorrhizal networks: trees under attack by herbivores or pathogens can send chemical warning signals through the network to neighboring trees, which then upregulate their own defense chemistry *before* they are attacked.

Song et al. (2010) demonstrated that Douglas-fir seedlings connected by mycorrhizal networks to other seedlings being defoliated by western spruce budworm increased their production of defensive enzymes (peroxidase, polyphenol oxidase) — even though the receiving seedlings were not themselves under attack. The signal traveled through the fungal network, not through the air (airborne volatile signaling was controlled for in the experimental design).

This is, functionally, an early warning system — the forest's immune response, mediated by fungal telecommunications.

### The Mother Tree Concept

Simard's "mother tree" concept has become one of the most influential ideas in forest ecology. The key findings:

1. **Hub connectivity:** The largest, oldest trees (typically >200 years old in PNW old-growth) are connected to the most neighbors — up to 47 trees in a single study plot (Beiler et al. 2010). These hub trees function as network routers, mediating resource flow across the stand.

2. **Kin recognition:** Douglas-fir mother trees can distinguish their own seedling offspring from unrelated seedlings and preferentially allocate more carbon to kin through the mycorrhizal network (Simard et al. 2015). This is the first demonstration of kin recognition and kin-directed resource allocation in trees.

3. **Legacy transfer:** When mother trees are fatally injured (windthrow, disease, logging), they transfer carbon and nutrient reserves to neighboring trees through the network — a "dying bequest" that benefits the surviving community (Simard 2012).

4. **Regeneration facilitation:** Seedlings that establish in close proximity to mother trees (within the mother tree's mycorrhizal network radius) have significantly higher survival rates than isolated seedlings or seedlings in clearcuts where the network has been destroyed.

### Network Disturbance and Recovery

| Disturbance type | Network impact | Recovery time | Key reference |
|-----------------|----------------|---------------|---------------|
| **Selective harvest** (retain hubs) | Partial — network degraded but intact | 10-30 years | Teste et al. 2009 |
| **Variable retention** (retain 30%+) | Moderate — hub trees maintain network core | 20-50 years | Simard et al. 2020 |
| **Clearcut** (remove all trees) | Severe — network destroyed; fungi persist as spores/fragments | 40-100+ years | Perry et al. 1989 |
| **Clearcut + burn + herbicide** | Catastrophic — network and fungal inoculum eliminated | 100-300+ years | Amaranthus et al. 1994 |
| **Windthrow** (natural) | Patchy — hub loss in blowdown patch, network intact in surrounding forest | 20-60 years | — |
| **Fire** (low-moderate) | Moderate surface disruption; deep network intact | 10-40 years | Cowan et al. 2016 |

### The Truffle-Mammal Connection

The mycorrhizal network connects to fauna through an elegant food web centered on truffle production:

ECM fungi that form network connections produce hypogeous (underground) fruiting bodies — truffles — as their reproductive structures. Truffles are consumed by small mammals, particularly:

- **Northern flying squirrel** (*Glaucomys sabrinus*) — truffles constitute 50-90% of diet year-round
- **Red-backed vole** (*Myodes gapperi*) — truffles are a major dietary component
- **California red-backed vole** (*Myodes californicus*) — truffle specialist
- **Townsend's chipmunk** (*Neotamias townsendii*) — seasonal truffle consumer
- **Douglas squirrel** (*Tamiasciurus douglasii*) — caches truffles for winter

These mammals disperse fungal spores in their fecal pellets, inoculating new areas of the forest floor with mycorrhizal fungi. This is critical for forest regeneration: tree seedlings establishing on disturbed or newly exposed mineral soil require mycorrhizal inoculation to survive, and mammal-dispersed spores provide this inoculation.

The food web extends further: **Northern spotted owl** (*Strix occidentalis caurina*) — ROLE-SECONDARY-CONSUMER, ROLE-INDICATOR — feeds primarily on northern flying squirrels, which feed primarily on truffles, which are produced by the mycorrhizal fungi that sustain the old-growth trees that provide spotted owl nesting habitat. Remove the old-growth forest, and you lose the mycorrhizal network, which reduces truffle production, which reduces flying squirrel populations, which starves spotted owls.

```
Old-growth tree → Mycorrhizal fungi → Truffles → Flying squirrel → Spotted owl
       ↑                                  |
       └────── Spore dispersal ───────────┘
                (mammal feces)
```

This food chain is sometimes called the "owl-to-fungus connection" and is one of the most compelling arguments for old-growth forest conservation: the entire chain depends on the mycorrhizal network that requires centuries of undisturbed forest development to fully form.

### Cross-Module Connections

| Module | Species/System | Connection Type |
|--------|---------------|-----------------|
| **flora** | Douglas-fir, western hemlock, western red cedar, Sitka spruce | Host trees (network nodes) |
| **flora** | Red alder | Nitrogen fixation input (AM network, indirect) |
| **flora** | Subalpine fir, mountain hemlock, whitebark pine | High-elevation network nodes |
| **fungi_microbiome** | Rhizopogon spp. | Primary network-forming fungi |
| **fungi_microbiome** | Russula, Cortinarius, Suillus, Piloderma | Additional network formers |
| **fungi_microbiome** | Cenococcum geophilum | Drought-tolerance specialist |
| **fungi_microbiome** | Saprophytic fungi | Nutrient cycling (network input) |
| **fauna_terrestrial** | Northern flying squirrel | Truffle consumer, spore disperser |
| **fauna_terrestrial** | Red-backed vole, chipmunk | Truffle consumers, spore dispersers |
| **fauna_terrestrial** | Northern spotted owl | Apex predator in truffle food web |
| **networks** | Salmon Nutrient Pathway | MDN enters network after soil incorporation |
| **networks** | Watershed Connectivity | Water transport through network |

### Minecraft System Equivalent

The mycorrhizal network maps to a **redstone circuit network:**

- **Hub trees** (old-growth, large) = redstone repeaters/comparators with multiple output connections
- **Peripheral trees** (young, small) = redstone dust endpoints with 1-2 connections
- **Fungal hyphae** = redstone dust connecting tree nodes underground
- **Resource transfer** = item transport through hoppers following the redstone-defined network paths
- **Signal propagation** = redstone signal representing defense signaling (can propagate across network)
- **Network destruction** (clearcut) = breaking redstone connections, requiring manual reconstruction

The network operates below ground level (y < surface) in Minecraft, representing the belowground hyphal infrastructure. Hub trees at the surface connect to extensive underground redstone networks.

### Network Diagram

```
                    OLD-GROWTH CANOPY
    ┌──────────────────────────────────────────────┐
    │                                              │
    │    [DF-1]    [WRC-2]    [DF-3]    [SS-4]    │
    │    250yr     400yr      180yr     300yr      │
    │    HUB       HUB        node      HUB       │
    │                                              │
    └──────┬──────┬──────┬──────┬──────┬───────────┘
           │      │      │      │      │
    ═══════╪══════╪══════╪══════╪══════╪═══════════ SOIL SURFACE
           │      │      │      │      │
    ┌──────┴──────┴──────┴──────┴──────┴───────────┐
    │              MYCORRHIZAL NETWORK              │
    │                                               │
    │  DF-1 ─── Rhizopogon ──── DF-3               │
    │   │                        │                  │
    │   ├── Rhizopogon ── WRC-2 ─┤                  │
    │   │        │                │                  │
    │   │    Russula ── SS-4 ────┘                   │
    │   │        │       │                          │
    │   │   [seedling]  [seedling]                  │
    │   │    "kin"       "non-kin"                   │
    │   │    (more C)    (less C)                    │
    │   │                                           │
    │   ├── Cortinarius ──── deep soil N,P ────►    │
    │   │                                           │
    │   └── Cenococcum ──── drought water ────►     │
    │                                               │
    │  RESOURCE FLOWS:                              │
    │  C (carbon) ── source → sink (shaded trees)   │
    │  N (nitrogen) ── high → low concentration     │
    │  H2O (water) ── moist → dry microsites        │
    │  SIGNALS ── stressed tree → neighbors          │
    │                                               │
    │  FUNGAL PAYMENT: ~20-30% of transferred C     │
    │                                               │
    └───────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
    ┌─────────────┐    ┌─────────────────┐
    │   TRUFFLES  │    │  SPORE DISPERSAL│
    │  (fruiting) │───►│  via mammal     │
    │             │    │  fecal pellets   │
    └──────┬──────┘    └─────────────────┘
           │
           ▼
    ┌──────────────┐      ┌────────────────┐
    │ FLYING       │─────►│ SPOTTED OWL    │
    │ SQUIRREL     │ prey │ Apex predator  │
    │ 50-90%       │      │ of truffle     │
    │ truffle diet │      │ food web       │
    └──────────────┘      └────────────────┘

    Legend: DF = Douglas-fir, WRC = Western red cedar,
            SS = Sitka spruce
            HUB = highly connected (>20 partners)
            node = peripheral (<10 partners)
```

---

## Pathway 4: Predator-Prey Dynamics

**Bus designation:** `predator_prey`
**Bus properties:** Directional (top-down, with bottom-up feedbacks), medium bandwidth
**Elevation span:** ELEV-DEEP-MARINE through ELEV-ALPINE (full vertical range, y=-64 to y=319)
**Habitat types:** All habitat types — predator-prey dynamics operate in every PNW habitat
**Connected modules:** fauna_terrestrial, fauna_marine, flora, aquatic

### Overview

Predator-prey dynamics are the regulatory system of PNW ecosystems — the set of interactions through which populations are controlled, energy is transferred between trophic levels, and community structure is maintained. Unlike the salmon nutrient pathway (a nutrient transport system) or the mycorrhizal network (an infrastructure network), predator-prey dynamics are fundamentally about *population control* and the cascading consequences of adding or removing consumers at different trophic levels.

The PNW has a full complement of native apex predators — a rarity in the temperate world, where centuries of persecution have eliminated large carnivores from most landscapes. Gray wolves (*Canis lupus*), cougars (*Puma concolor*), black bears (*Ursus americanus*), orcas (*Orcinus orca*), and historically grizzly bears (*Ursus arctos*) all continue to exert top-down control on PNW prey populations. The presence of this complete predator guild makes the PNW one of the few temperate regions where multi-trophic cascades — effects that ripple from apex predator through multiple intermediate levels to vegetation — can be observed operating in near-natural conditions.

### Multi-Trophic Cascade: Wolves, Elk, and Riparian Vegetation

The recolonization of wolves into the PNW (naturally from Canada into northeastern Washington, with packs now established in the North Cascades, Blue Mountains, and Selkirk Mountains) provides a natural experiment in trophic cascade dynamics comparable to the famous Yellowstone wolf reintroduction.

#### The Cascade

```
APEX PREDATOR          HERBIVORE              VEGETATION
┌──────────┐          ┌──────────┐          ┌──────────────┐
│ Gray Wolf│──prey──►│Roosevelt │──browse──►│ Riparian     │
│ Canis    │ control  │ Elk      │ pressure  │ vegetation   │
│ lupus    │          │ Cervus c.│          │ willow, alder│
│          │          │ roosev.  │          │ cottonwood   │
│ROLE-APEX │          │ROLE-PRIM.│          │ROLE-PRIMARY  │
│          │          │CONSUMER  │          │PRODUCER      │
└──────────┘          └──────────┘          └──────────────┘
```

**Without wolves:** Elk populations in the PNW can reach densities that suppress riparian vegetation regeneration. In wolf-free areas of western Washington and Oregon, Roosevelt elk congregate along river corridors (HAB-RIPARIAN, ELEV-RIPARIAN), browsing willow, cottonwood, and red alder seedlings to the ground. This prevents riparian forest recovery, destabilizes stream banks, increases water temperatures (loss of shade), and degrades salmon habitat.

**With wolves:** Wolf predation reduces elk density in riparian areas through two mechanisms:
1. **Direct predation** — wolves reduce elk numbers, especially in accessible riparian areas
2. **Behaviorally mediated trophic cascade** — the "ecology of fear" (Ripple & Beschta 2004): elk avoid areas where they are vulnerable to wolf predation, particularly narrow riparian corridors with limited sight lines and escape routes. This behavioral shift reduces browsing pressure even where elk numbers have not declined significantly.

The result: riparian vegetation recovery where wolves are present, leading to:
- Increased bank stability (more root mass holding soil)
- Increased stream shade (cooler water temperatures for salmon)
- Increased large wood recruitment (more trees growing large enough to fall into streams)
- Increased songbird diversity (more shrub nesting habitat)
- Increased beaver colonization (more willow and cottonwood for food and dam construction)

This cascade connects directly to the Salmon Nutrient Pathway (Pathway 1) and Watershed Connectivity (Pathway 5): wolves improve salmon habitat by controlling elk, which allows riparian vegetation to recover, which shades and stabilizes the streams salmon depend on.

### Cougar-Deer Dynamics

**Cougar** (*Puma concolor*) — ROLE-APEX — is the most widespread large carnivore in the PNW, present from sea level (ELEV-RIPARIAN) to timberline (ELEV-SUBALPINE). Cougars are solitary, ambush predators that specialize in deer — primarily black-tailed deer (*Odocoileus hemionus columbianus*) in western PNW and mule deer (*Odocoileus hemionus hemionus*) east of the Cascades.

Cougar predation controls deer population density and behavior:

| Factor | Cougar present | Cougar absent/reduced |
|--------|---------------|----------------------|
| Deer density | 15-25/mi2 | 30-50+/mi2 |
| Browse pressure on understory | Moderate | Severe |
| Seedling survival (cedar, yew) | Higher | Lower |
| Songbird nest success | Higher (less browse disturbance) | Lower |
| Mesopredator abundance | Lower (coyote suppression) | Higher (mesopredator release) |

**Mesopredator release:** Cougars suppress coyote populations through interference competition (direct killing). In areas where cougar density declines (due to hunting or habitat loss), coyote populations increase — a phenomenon called mesopredator release. Elevated coyote populations can suppress ground-nesting birds, small mammals, and other prey species, cascading the effect of cougar loss through multiple trophic levels.

### The Spotted Owl Food Web

The northern spotted owl (*Strix occidentalis caurina*) sits atop a food web that epitomizes the interconnection between predator-prey dynamics and forest structure:

```
     SPOTTED OWL (ROLE-SECONDARY-CONSUMER, ROLE-INDICATOR)
                    │
          ┌─────────┼──────────┐
          │         │          │
          ▼         ▼          ▼
    ┌──────────┐ ┌────────┐ ┌────────────┐
    │ FLYING   │ │ WOODRAT│ │ RED TREE   │
    │ SQUIRREL │ │ Neotoma│ │ VOLE       │
    │ Glaucomys│ │ fuscip.│ │ Arborimus  │
    │ sabrinus │ │        │ │ longicaud. │
    └────┬─────┘ └────────┘ └────────────┘
         │
         ▼
    ┌──────────┐
    │ TRUFFLES │ (→ cross-ref Mycorrhizal Network)
    │ Rhizopon │
    │ Leucangi │
    │ Hysteran │
    └────┬─────┘
         │
         ▼
    ┌─────────────────┐
    │ MYCORRHIZAL     │
    │ FUNGI           │
    │ (network nodes) │
    └────┬────────────┘
         │
         ▼
    ┌─────────────────┐
    │ OLD-GROWTH      │
    │ TREES           │
    │ HAB-OLD-GROWTH  │
    │ 250-1000+ yrs   │
    └─────────────────┘
```

This food web demonstrates why old-growth conservation is a predator-prey issue: the spotted owl requires old-growth forest not because of any direct relationship with old trees, but because old-growth structure supports the mycorrhizal networks that produce the truffles that feed the flying squirrels that the owl eats. Remove the old growth, and every link in the chain degrades.

The invasion of barred owls (*Strix varia*) — a larger, more generalist, more aggressive species that expanded from eastern North America into all PNW spotted owl habitat beginning in the 1950s — adds a competitive predator-prey dimension. Barred owls exclude spotted owls through interference competition (territorial aggression), competitive displacement (barred owls outcompete for prey and nest sites), and direct predation (barred owls occasionally kill spotted owls). USFWS has initiated experimental barred owl removal in selected areas to assess whether spotted owl populations can recover.

### Amphibian Predator-Prey: The Invisible Regulators

PNW forests support extraordinary amphibian diversity and biomass — in many old-growth stands, the combined biomass of salamanders exceeds the biomass of all birds and mammals combined (Burton & Likens 1975). This "hidden majority" plays a critical but underappreciated role in predator-prey dynamics:

**Ensatina (*Ensatina eschscholtzii*)**, **western red-backed salamander (*Plethodon vehiculum*)**, and **Oregon slender salamander (*Batrachoseps wrighti*)** are abundant terrestrial predators of soil invertebrates — mites, springtails, beetles, ants, earthworms. Their predation regulates decomposer invertebrate populations, which in turn affects decomposition rates, nutrient cycling, and soil structure.

**Pacific giant salamander (*Dicamptodon tenebrosus*)** — the world's largest terrestrial salamander (up to 13 inches) — is an apex predator in headwater streams (HAB-STREAM, ELEV-LOWLAND to ELEV-MONTANE), consuming aquatic invertebrates, small fish, and even mice. Giant salamander predation helps structure stream invertebrate communities in fishless headwaters.

**Tailed frog (*Ascaphus truei*)** — a living fossil restricted to cold, fast-flowing headwater streams — is both prey (consumed by giant salamanders, dippers, water shrews) and predator (adults consume aquatic and terrestrial invertebrates). Tailed frog presence is an indicator of pristine stream conditions (ROLE-INDICATOR).

### Marine Predator-Prey Dynamics

Marine predator-prey dynamics in the PNW are structured by the same principles as terrestrial systems but operate across different scales:

#### Orca (Killer Whale) — ROLE-APEX

Three ecotypes of orca inhabit PNW waters, each with distinct predator-prey relationships:

| Ecotype | Primary prey | Population (PNW) | Status |
|---------|-------------|-------------------|--------|
| **Southern Resident** | Chinook salmon (>80% of diet) | ~73 individuals | ESA Endangered |
| **Bigg's (Transient)** | Marine mammals (seals, sea lions, porpoises) | ~400+ in eastern N. Pacific | Increasing |
| **Offshore** | Sharks, large fish | Unknown (rarely observed) | Data Deficient |

Southern Resident orcas are functionally linked to the Salmon Nutrient Pathway: they depend on large Chinook salmon, the same fish that transport marine-derived nutrients into PNW forests. The decline of Southern Resident orcas (from ~98 in 1995 to ~73 in 2024) is driven primarily by Chinook salmon decline — linking marine apex predator population dynamics directly to dam construction, habitat degradation, and hatchery practices affecting salmon.

Bigg's (transient) orcas exert top-down control on marine mammal populations, potentially influencing harbor seal (*Phoca vitulina*) abundance. Harbor seals are significant predators of juvenile salmon in estuaries, so Bigg's orca predation on seals may indirectly benefit salmon survival — a multi-trophic marine cascade.

#### Salmon as Prey and Predator

Pacific salmon occupy a dual position in marine food webs:

- **As predators:** Adult salmon in the ocean are secondary consumers (ROLE-SECONDARY-CONSUMER), feeding on herring, sand lance, euphausiids (krill), and squid. Their feeding pressure influences forage fish populations.
- **As prey:** Salmon are consumed by orcas, sea lions, harbor seals, bald eagles, ospreys, bears, river otters, and humans. They are among the most heavily predated fish in the PNW.

This dual role makes salmon a central node in both marine and terrestrial food webs — a species whose population size affects predator and prey populations simultaneously across multiple ecosystems.

### Cross-Module Connections

| Module | Species/System | Connection Type |
|--------|---------------|-----------------|
| **fauna_terrestrial** | Gray wolf, cougar, black bear | Apex predators (terrestrial) |
| **fauna_terrestrial** | Roosevelt elk, black-tailed deer | Primary consumers (herbivores) |
| **fauna_terrestrial** | Northern spotted owl | Secondary consumer (old-growth food web) |
| **fauna_terrestrial** | Northern flying squirrel | Primary consumer (truffle specialist) |
| **fauna_terrestrial** | Coyote | Mesopredator (released when apex absent) |
| **fauna_terrestrial** | Salamanders (multiple species) | Invertebrate predators (hidden majority) |
| **fauna_marine** | Orca (3 ecotypes) | Marine apex predators |
| **fauna_marine** | Harbor seal, Steller sea lion | Marine mesopredators / prey |
| **fauna_marine** | Pacific salmon (all 5 species) | Dual predator/prey role |
| **flora** | Riparian vegetation (willow, alder, cottonwood) | Bottom of wolf-elk-vegetation cascade |
| **aquatic** | Stream invertebrates | Prey base for stream-dwelling predators |
| **networks** | Salmon Nutrient Pathway | Salmon as both predator and nutrient vector |
| **networks** | Mycorrhizal Network | Truffle food web links to predator-prey |
| **networks** | Kelp-Otter-Urchin Cascade | Marine trophic cascade |
| **networks** | Watershed Connectivity | Riparian vegetation cascade connects to watershed |

### Minecraft System Equivalent

Predator-prey dynamics map to **mob interaction and spawning mechanics:**

- **Apex predator mobs** (wolf, cougar, orca) suppress prey mob spawning in their territory
- **Prey mobs** (elk, deer, urchin) suppress vegetation block growth/placement when abundant
- **Trophic cascade:** removing predator mob → prey mob population increase → vegetation suppression
- **Behaviorally mediated effects:** prey mobs avoid blocks/chunks where predator mobs have been recently present (fear mechanic)
- **Mesopredator release:** medium predator mob spawning increases when apex mob is absent

### Network Diagram

```
    TERRESTRIAL                              MARINE
    PREDATOR-PREY                            PREDATOR-PREY

    ┌───────────┐                    ┌──────────────────┐
    │ GRAY WOLF │                    │ ORCA             │
    │ COUGAR    │                    │ (3 ecotypes)     │
    │ ROLE-APEX │                    │ ROLE-APEX        │
    └─────┬─────┘                    └──┬──────────┬────┘
          │                             │          │
    ┌─────┼──────┐              ┌───────┘     ┌────┘
    │     │      │              │             │
    ▼     ▼      ▼              ▼             ▼
  ┌────┐┌────┐┌──────┐   ┌──────────┐  ┌──────────┐
  │ELK ││DEER││MESOP.│   │ SEALS    │  │ CHINOOK  │
  │    ││    ││coyote│   │ SEA LIONS│  │ SALMON   │
  └──┬─┘└──┬─┘└──┬───┘   └────┬─────┘  └────┬─────┘
     │     │     │             │             │
     ▼     ▼     ▼             ▼             ▼
  ┌──────────┐ ┌──────┐  ┌──────────┐  ┌──────────┐
  │RIPARIAN  │ │GROUND│  │ JUVENILE │  │ FORAGE   │
  │VEGETATION│ │BIRDS │  │ SALMON   │  │ FISH     │
  │willow    │ │nests │  │ (prey    │  │herring   │
  │alder     │ │      │  │  of seals│  │sand lance│
  └──────────┘ └──────┘  └──────────┘  └──────────┘

    CROSS-LINK: Wolf → Elk → Riparian → Salmon habitat
                     (Pathway 1 & 5 connection)

    CROSS-LINK: Orca (resident) → depends on Chinook
                     (Pathway 1 connection)

    OLD-GROWTH FOOD WEB:
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ SPOTTED  │───►│ FLYING   │───►│ TRUFFLES │
    │ OWL      │prey│ SQUIRREL │diet│ (fungi)  │
    │ ROLE-IND │    │          │    │          │
    └──────────┘    └──────────┘    └────┬─────┘
                                        │
                              ┌─────────┘
                              ▼
                    ┌──────────────────┐
                    │ MYCORRHIZAL NET  │
                    │ (Pathway 3)      │
                    │ OLD-GROWTH TREES │
                    └──────────────────┘
```

---

## Pathway 5: Watershed Connectivity

**Bus designation:** `watershed`
**Bus properties:** Downstream-dominant (gravitational), high bandwidth, continuous
**Elevation span:** ELEV-ALPINE through ELEV-DEEP-MARINE (full vertical range, y=319 to y=-64)
**Habitat types:** All habitat types — water connects everything
**Connected modules:** All modules — watershed is the physical template

### Overview

Watershed connectivity is the circulatory system of the PNW — the physical template on which all other ecological networks operate. Water flows downhill, and as it flows, it carries sediment, nutrients, organic matter, organisms, heat, and chemical signals from headwater to ocean. Every terrestrial and aquatic species in the PNW exists within a watershed, and the connectivity of that watershed — the degree to which water, materials, and organisms can move freely through the system — determines the health and diversity of every community it supports.

The PNW watershed template is defined by extraordinary topographic relief. A raindrop falling on the summit of Mt. Rainier (14,410 ft, y=319, ELEV-ALPINE) may travel through every elevation band and habitat type as it moves toward Puget Sound (-930 ft, y=-64, ELEV-DEEP-MARINE) — passing through glacial ice, alpine tarns, subalpine meadow streams, montane forest rivers, lowland floodplains, riparian corridors, estuaries, and finally the marine environment. This single raindrop's journey crosses the full vertical extent of the PNW Living Systems Taxonomy.

Watershed connectivity operates at multiple scales:

- **Longitudinal:** Headwater to ocean — the downstream flow of water, nutrients, sediment, and organisms
- **Lateral:** Stream channel to floodplain — periodic flooding connects aquatic and terrestrial habitats
- **Vertical:** Surface water to groundwater — hyporheic exchange beneath the stream channel
- **Temporal:** Seasonal and event-driven — spring snowmelt, fall floods, rain-on-snow events

### Headwater to Estuary: The Longitudinal Gradient

#### Glacial Headwaters (ELEV-ALPINE, ELEV-SUBALPINE)

**Elevation:** 5,000-14,410 ft (y=84 to y=319)
**Habitat:** HAB-ALPINE-MEADOW, HAB-VOLCANIC, HAB-STREAM

PNW watersheds originate in glaciers, snowfields, and alpine meadows on Cascade volcanoes and Olympic peaks. Glacial meltwater is cold (33-40F / 0.5-4C), sediment-laden (glacial flour — rock ground to fine powder by glacial movement), low in dissolved nutrients, and high in dissolved oxygen.

These headwater streams are depauperate in fish (too cold, too steep, too few nutrients) but support specialized invertebrate communities: cold-adapted stoneflies (*Zapada glacier*, *Lednia tumana* — the latter recently petitioned for ESA listing), chironomid midges, and oligochaete worms. Alpine stream invertebrates are among the most climate-sensitive organisms in the PNW — they require water temperatures below 40F (4C) and are being pushed upslope as warming temperatures extend into their habitat.

The glacial headwater zone also produces the sediment that builds downstream floodplains and estuaries. Over geological time, glacial erosion has carved the valleys that define PNW watershed geography — the U-shaped valleys of the Olympics, the deep canyons of the North Cascades, and the broad glacial troughs of Puget Sound.

#### Montane Streams (ELEV-MONTANE)

**Elevation:** 3,000-5,000 ft (y=34 to y=84)
**Habitat:** HAB-STREAM, HAB-RIPARIAN, HAB-OLD-GROWTH

Montane streams are high-gradient, boulder-dominated channels flowing through dense conifer forest. These streams receive significant precipitation (60-120 inches/year), including heavy snowfall that creates a seasonal snowmelt hydrograph — low flow in late summer, high flow during spring melt and fall rains.

The montane zone is where the rain-snow transition occurs — the elevation at which winter precipitation falls as rain instead of snow. This transition is shifting upslope with climate change, converting snow-dominated watersheds to rain-dominated ones. The consequences are profound: snow stores water and releases it slowly over months (natural reservoir function), while rain runs off immediately. Loss of snowpack means:

- Higher winter/spring flood peaks
- Lower summer base flows
- Higher summer stream temperatures
- Reduced water availability during the growing season when biological demand is highest

**Rain-on-snow events** are the most hydrologically significant process in the montane band. When warm, wet atmospheric rivers (Pineapple Express storms) deliver heavy rain onto existing snowpack between 2,500-4,500 ft, the rain melts the snow while simultaneously adding its own volume to runoff. The resulting flood peaks can be 2-5x larger than either rain or snowmelt alone — these events cause the largest floods in PNW history and are the dominant geomorphic process shaping montane stream channels.

Montane streams support resident trout populations (cutthroat trout *Oncorhynchus clarkii*, rainbow/steelhead *O. mykiss*, bull trout *Salvelinus confluentus*) and the upper extent of some salmon populations (spring Chinook, coho). Bull trout, which require the coldest and cleanest water of any PNW salmonid (maximum sustained temperature <54F / 12C), are an indicator species (ROLE-INDICATOR) for montane stream health.

#### Lowland Rivers and Floodplains (ELEV-LOWLAND, ELEV-RIPARIAN)

**Elevation:** 0-3,000 ft (y=-41 to y=34)
**Habitat:** HAB-STREAM, HAB-RIPARIAN, HAB-WETLAND, HAB-OLD-GROWTH, HAB-SECOND-GROWTH

Lowland rivers are the main arteries of PNW watersheds — the Skagit, Nooksack, Snohomish, Green, Nisqually, Chehalis, Cowlitz, Lewis, Willamette, and the mighty Columbia. These rivers meander across broad floodplains, creating a mosaic of channels, side channels, backwaters, oxbow lakes, and wetlands that provide the most productive salmon habitat in the PNW.

**Floodplain connectivity** — the ability of rivers to periodically overflow their banks and connect with adjacent floodplain habitats — is critical for:

- **Salmon rearing:** Juvenile coho and Chinook salmon use off-channel floodplain habitats (side channels, beaver ponds, floodplain wetlands) for rearing during winter high flows. Fish that rear in floodplain habitats grow larger and have higher survival rates than fish confined to the main channel (Beechie et al. 2005).
- **Nutrient processing:** Floodplain soils process and retain nutrients (nitrogen, phosphorus) through denitrification and plant uptake, buffering downstream eutrophication.
- **Groundwater recharge:** Floodplain inundation recharges alluvial aquifers, maintaining summer base flows and cool water temperatures through hyporheic discharge.
- **Sediment management:** Floodplains store sediment during high flows and release it during low flows, moderating downstream sediment transport.

PNW lowland floodplains have been severely degraded by levee construction, channelization, drainage for agriculture, and urban development. An estimated 70-90% of historical floodplain connectivity has been lost in lowland PNW rivers (Collins & Montgomery 2002), with cascading effects on salmon populations, water quality, and flood risk.

### Large Wood Recruitment: Trees in Streams

One of the most distinctive features of PNW watersheds is the role of large wood — fallen trees and tree fragments — in structuring stream habitat. In old-growth forest (HAB-OLD-GROWTH), trees that fall into streams create:

- **Pool-riffle sequences:** Large logs dam flow, creating deep pools upstream (resting and hiding habitat for adult salmon) and scoured riffles downstream (spawning gravel habitat). Natural wood loading creates 2-3x more pool habitat than wood-free streams.
- **Side channels:** Wood jams divert flow into side channels and floodplain habitats, increasing total wetted habitat area.
- **Sediment storage:** Wood traps sediment behind jams, creating gravel bars for spawning and stabilizing channel morphology.
- **Nutrient retention:** Wood jams trap organic matter (leaves, invertebrates, salmon carcasses), increasing nutrient residence time in the stream.
- **Thermal refugia:** Deep pools created by wood jams are colder than surrounding water, providing thermal refugia for cold-water species during summer heat.

**Key metrics:**
- Old-growth stream wood loading: 100-300+ pieces per km of channel (Bilby & Ward 1991)
- Second-growth stream wood loading: 10-50 pieces per km
- Clearcut stream wood loading: <5 pieces per km (no recruitment source)
- Time to restore wood loading after harvest: 100-200+ years (requires trees to grow to full size and fall naturally)

Large wood recruitment connects the mycorrhizal network (Pathway 3) to watershed connectivity: the old-growth trees sustained by mycorrhizal networks eventually fall into streams, creating the habitat structure that supports salmon, which deliver the marine-derived nutrients (Pathway 1) that fertilize the next generation of trees.

### Beaver Dam Complexes: Nature's Water Engineers

**North American beaver** (*Castor canadensis*) — ROLE-ECOSYSTEM-ENGINEER, ROLE-KEYSTONE — is the PNW's most important non-human hydrological engineer. Beaver dams create:

- **Wetland mosaics:** A single beaver dam complex can flood 1-10 acres, creating open water ponds, emergent marshes, wet meadows, and willow thickets. A family of beavers maintaining 2-5 dams can transform a linear stream corridor into a complex wetland landscape.

- **Water table elevation:** Beaver ponds raise the local water table by 1-5 feet, increasing water storage in the landscape and maintaining summer base flows downstream. In semi-arid eastern Washington and Oregon, beaver dam complexes can sustain perennial stream flow in channels that would otherwise go dry in summer.

- **Sediment retention:** Beaver ponds trap fine sediment (silt, clay, organic matter), building thick, fertile soils that support lush riparian vegetation. When beaver dams are eventually abandoned and ponds drain, the exposed sediment becomes productive "beaver meadow" — flat, wet, fertile meadow habitat that persists for decades to centuries.

- **Temperature modulation:** Beaver ponds increase surface area and groundwater interaction, moderating stream temperatures — warming slightly in winter (creating ice-free refugia) and potentially cooling in summer through increased groundwater exchange and riparian shade.

- **Salmon habitat:** Beaver ponds provide critical overwinter rearing habitat for juvenile coho salmon — deep, slow water with abundant food and cover. Some studies show that juvenile coho abundance is 2-10x higher in beaver-influenced reaches than in comparable reaches without beaver dams (Pollock et al. 2004).

**Historical context:** PNW beaver populations were decimated by the fur trade (1780s-1840s). The Hudson's Bay Company's deliberate policy of "fur desert" trapping — removing every beaver from the Columbia drainage to make the region economically unattractive to American settlement — eliminated an estimated 10-50 million beavers from the PNW (estimates vary widely). The hydrological consequences were immense: loss of beaver dams drained wetlands, lowered water tables, simplified stream channels, and reduced summer base flows across the region.

Beaver populations have partially recovered, but remain far below historical levels, and their recolonization of many streams is limited by:
- Lack of riparian vegetation (food and building material)
- Road culverts that prevent upstream colonization
- Conflicts with human land use (flooding of roads, agricultural land, timber)
- Predator loss (wolves and cougars historically controlled beaver, concentrating their habitat modification effects in specific areas)

**"Process-based restoration"** — the intentional reintroduction of beavers or installation of beaver dam analogues (BDAs) — is now a major strategy for PNW watershed restoration, particularly in eastern Washington and Oregon where water scarcity is intensifying under climate change.

### Riparian Nitrogen Fixation

**Red alder** (*Alnus rubra*) — ROLE-NURSE, ROLE-PRIMARY-PRODUCER — is the dominant early-successional hardwood in PNW riparian zones (HAB-RIPARIAN). Through its symbiotic relationship with nitrogen-fixing bacteria (*Frankia* spp.), red alder converts atmospheric nitrogen (N2) into plant-available ammonium, enriching soils at rates of 40-300 kg N/ha/year.

This nitrogen input is ecologically transformative:

- **Soil enrichment:** Red alder stands accumulate 100-300 kg N/ha in the soil organic layer within 30-50 years, fundamentally altering soil fertility from nitrogen-limited (typical of PNW conifer forests) to nitrogen-rich.
- **Stream nitrogen delivery:** Alder leaf litter, the highest-nitrogen leaf tissue of any PNW tree species (2.5-3.0% N by dry weight), falls into streams in autumn, providing a nitrogen-rich food source for aquatic invertebrates and driving stream productivity.
- **Facilitating conifer establishment:** Alder-enriched soils support faster conifer growth during subsequent succession. Douglas-fir and western red cedar planted in former alder stands grow 30-50% faster than in non-alder sites.

Red alder also provides critical shade for small streams, reducing water temperature by 4-8F compared to unshaded reaches — a temperature difference that can determine whether a stream supports salmonids or does not.

### Estuary: The Final Connection

**Elevation:** ELEV-RIPARIAN, ELEV-INTERTIDAL (y=-41)
**Habitat:** HAB-EELGRASS, HAB-SANDY-BEACH, HAB-ROCKY-INTERTIDAL

PNW estuaries — the Skagit River delta, Nisqually delta, Willapa Bay, Grays Harbor, Tillamook Bay, Coos Bay, and the enormous Columbia River estuary — are where freshwater and saltwater meet, creating some of the most productive habitats in the temperate world.

Estuaries are the critical transition zone for anadromous fish:

- **Juvenile salmon outmigration:** Smolts transitioning from freshwater to saltwater undergo physiological transformation (smoltification) that requires brackish water of intermediate salinity. Estuarine habitat provides the gradual salinity transition that reduces stress and increases survival. Juvenile Chinook salmon that rear in estuarine habitat for weeks to months before entering the ocean have significantly higher marine survival than fish that pass through estuaries quickly (Magnusson & Hilborn 2003).

- **Adult salmon return:** Returning adults use olfactory cues from their natal watershed (dissolved minerals, organic compounds) to navigate through the estuary and locate their spawning stream.

- **Nutrient processing:** Estuaries transform, retain, and export nutrients. Tidal mixing, microbial processing, and eelgrass/marsh uptake all modify the nutrient signal before it reaches the open ocean.

Eelgrass meadows (HAB-EELGRASS) within estuaries provide nursery habitat for juvenile salmon, herring, and Dungeness crab; spawning substrate for Pacific herring; foraging habitat for brant geese and great blue herons; and carbon sequestration (blue carbon).

PNW estuaries have been severely modified: diking and filling for agriculture (particularly in the Skagit, Snohomish, and Willamette valleys), port development, urban expansion, and pollution. An estimated 75-90% of historical PNW estuarine habitat has been lost or degraded (Good 2000). Estuary restoration (dike removal, tidal channel reconnection) is now recognized as one of the highest-priority actions for salmon recovery.

### The Complete Vertical Journey

The watershed pathway traverses the complete elevation range of the PNW Living Systems Taxonomy:

```
    ELEV-ALPINE (y=319)        Mt. Rainier summit — glacial melt begins
         │
    ELEV-SUBALPINE (y=84-196)  Alpine streams, snowmelt, cold springs
         │
    ELEV-MONTANE (y=34-84)     High-gradient streams, rain-on-snow zone
         │                      Bull trout habitat, wood recruitment
    ELEV-LOWLAND (y=-29-34)    Lowland rivers, floodplains, beaver dams
         │                      Primary salmon rearing habitat
    ELEV-RIPARIAN (y=-41--29)  Riparian corridors, red alder, estuary
         │                      Salmon spawning, nitrogen fixation
    ELEV-INTERTIDAL (y=-41)    Tidal exchange, eelgrass, mudflats
         │                      Juvenile salmon transition zone
    ELEV-SHALLOW-MARINE (y=-46--41)  Nearshore marine, kelp forests
         │
    ELEV-DEEP-MARINE (y=-64--46)     Puget Sound basins, deep channels
```

Every point on this gradient is connected to every other point through water flow. A pesticide applied at ELEV-LOWLAND affects organisms at ELEV-RIPARIAN and ELEV-INTERTIDAL. A dam at ELEV-MONTANE blocks fish passage from ELEV-RIPARIAN and severs nutrient delivery from ELEV-DEEP-MARINE (salmon nutrient pathway). Logging at ELEV-LOWLAND increases sediment delivery to ELEV-RIPARIAN, reduces shade, and eliminates large wood recruitment for decades.

Watershed connectivity is not just a pathway — it is the physical medium through which all other pathways operate.

### Major PNW Watersheds

| Watershed | Area (mi2) | Length (miles) | Highest point | Key salmon species | Notable features |
|-----------|-----------|---------------|--------------|-------------------|-----------------|
| **Columbia** | 258,000 | 1,243 | Mt. Hood (11,250 ft) | All 5 Pacific salmon + steelhead | Largest PNW watershed; 14 mainstem dams |
| **Fraser** | 86,800 | 854 | Mt. Robson (12,972 ft) | Sockeye (largest runs in world), Chinook, coho | Only major undammed PNW river |
| **Skagit** | 3,115 | 150 | Glacier Peak (10,541 ft) | Chinook, coho, pink, chum, sockeye, steelhead | Largest Puget Sound watershed; bald eagle concentration |
| **Snohomish** | 1,856 | 103 | Multiple Cascade peaks | Chinook, coho, chum, pink | Major urban-wildland interface |
| **Willamette** | 11,478 | 187 | Three Sisters (10,358 ft) | Spring Chinook, winter steelhead | Most fertile agricultural valley in PNW |
| **Nisqually** | 736 | 78 | Mt. Rainier (14,410 ft) | Chinook, coho, chum, steelhead | Glacier-fed; Nisqually Reach estuary |
| **Elwha** | 321 | 45 | Mt. Olympus (7,980 ft) | Chinook, coho, steelhead, bull trout | Two dams removed (2011-2014); ecosystem recovery |
| **Hoh** | 256 | 56 | Mt. Olympus (7,980 ft) | Chinook, coho, steelhead | Undammed; Olympic temperate rainforest |

### Dam Removal: The Elwha Experiment

The Elwha River on the Olympic Peninsula provides the most dramatic demonstration of watershed connectivity restoration in PNW history. Two dams — Elwha Dam (built 1913) and Glines Canyon Dam (built 1927) — blocked fish passage to 70+ miles of habitat for over a century.

Dam removal began in 2011 (Elwha Dam) and 2014 (Glines Canyon Dam), representing the largest dam removal project in US history. The results demonstrate watershed connectivity in real time:

- **Sediment release:** 30+ million tonnes of sediment trapped behind the dams was released downstream, rebuilding the river delta (which had eroded severely during the dam era) and creating new estuary habitat
- **Fish passage:** Chinook, coho, steelhead, and bull trout recolonized upstream habitat within months of dam removal. Chinook salmon were documented spawning above the former Glines Canyon Dam site within the first year.
- **Riparian recovery:** Riparian vegetation established rapidly on newly exposed reservoir sediment
- **Marine-derived nutrients:** Salmon carcass-derived nutrients (N-15 signal) were detected in riparian vegetation upstream of the former dam sites within 3 years of removal
- **Food web recovery:** Macroinvertebrate communities, river otters, American dippers, and bald eagles responded positively to restored connectivity

The Elwha demonstrates that watershed connectivity, once restored, triggers rapid recovery across all five ecological pathways simultaneously — salmon return (Pathway 1), predator-prey dynamics re-engage (Pathway 4), riparian vegetation recovers (enhancing Pathway 3 potential), and the watershed itself reconnects (Pathway 5).

### Cross-Module Connections

| Module | Species/System | Connection Type |
|--------|---------------|-----------------|
| **ALL modules** | Water itself | Physical medium connecting all habitats |
| **flora** | Red alder | Nitrogen fixation, riparian shade |
| **flora** | Old-growth conifers | Large wood recruitment |
| **flora** | Eelgrass, saltmarsh plants | Estuary habitat structure |
| **fauna_terrestrial** | Beaver | Dam construction, wetland creation |
| **fauna_terrestrial** | Roosevelt elk | Riparian browsing (cascade with wolves) |
| **fauna_marine** | Pacific salmon (all 5 species) | Anadromous life cycle spans full watershed |
| **fauna_marine** | Pacific lamprey | Parallel anadromous nutrient vector |
| **aquatic** | Bull trout | Cold-water indicator for montane streams |
| **aquatic** | Tailed frog | Headwater stream indicator |
| **aquatic** | Crayfish, stoneflies | Benthic invertebrate indicators |
| **fungi_microbiome** | Aquatic hyphomycetes | Leaf litter decomposition in streams |
| **networks** | Salmon Nutrient Pathway | Salmon use watershed as migration route |
| **networks** | Predator-Prey Dynamics | Wolf-elk-riparian cascade |
| **networks** | Mycorrhizal Network | Trees sustained by network recruit wood to streams |

### Minecraft System Equivalent

Watershed connectivity maps to **water flow mechanics and terrain generation:**

- **Water source blocks** at high elevation (ELEV-ALPINE, y=196-319) represent glacial headwaters
- **Water flow** following gravity downhill through terrain represents longitudinal connectivity
- **Waterlogged blocks** in floodplain areas represent lateral connectivity
- **Beaver dam structures** (log blocks across water channels) represent dam complexes that create ponds
- **Item transport in water** represents sediment, nutrient, and organism movement downstream
- **Fish mob spawning** restricted to flowing water represents salmonid habitat requirements
- **Dam blocks** (solid barriers across water channels) represent passage barriers — removing them restores flow and fish access

The watershed is the fundamental terrain feature of the Minecraft world — the landscape itself, carved by water.

### Network Diagram

```
    ┌────────────────────────────────────────────────────────┐
    │                  GLACIAL HEADWATERS                     │
    │  ELEV-ALPINE  y=196-319                                │
    │  Snow/ice melt → cold, clear, sediment-laden           │
    │  Species: glacier algae, ice worms, stoneflies         │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌────────────────────────────────────────────────────────┐
    │                  MONTANE STREAMS                        │
    │  ELEV-MONTANE  y=34-84                                 │
    │  High gradient, boulder substrate                      │
    │  Rain-on-snow zone → flood driver                      │
    │  Species: bull trout, tailed frog, dipper              │
    │  Process: wood recruitment from old-growth             │
    └──────────────────────┬─────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │                         │
              ▼                         ▼
    ┌─────────────────┐     ┌───────────────────────┐
    │  LOWLAND RIVER  │     │  BEAVER DAM COMPLEX   │
    │  ELEV-LOWLAND   │     │  Wetland mosaic        │
    │  y=-29 to y=34  │     │  Water table elevation │
    │  Floodplain     │     │  Juvenile salmon       │
    │  connectivity   │◄───►│  rearing habitat       │
    │  Side channels  │     │  Sediment retention    │
    │  Salmon rearing │     │  Temperature buffering │
    └────────┬────────┘     └───────────────────────┘
             │
             ▼
    ┌────────────────────────────────────────────────────────┐
    │               RIPARIAN CORRIDOR                        │
    │  ELEV-RIPARIAN  y=-41 to y=-29                         │
    │  Red alder: N-fixation 40-300 kg/ha/yr                 │
    │  Stream shade: -4 to -8 F water temp                   │
    │  Salmon spawning grounds                               │
    │  Large wood: pool-riffle creation                      │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌────────────────────────────────────────────────────────┐
    │                    ESTUARY                              │
    │  ELEV-RIPARIAN / ELEV-INTERTIDAL  y=-41                │
    │  Freshwater-saltwater mixing                           │
    │  Eelgrass meadows: nursery habitat                     │
    │  Juvenile salmon smoltification zone                   │
    │  Nutrient processing and export                        │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌────────────────────────────────────────────────────────┐
    │                 MARINE ENVIRONMENT                      │
    │  ELEV-SHALLOW-MARINE to ELEV-DEEP-MARINE  y=-64 to -41│
    │  Kelp forests, open ocean                              │
    │  Salmon ocean phase (1-7 years)                        │
    │  Marine nutrient accumulation                          │
    │  → Cycle connects back to Pathway 1                    │
    └────────────────────────────────────────────────────────┘
```

---

## Fire Ecology: The Sixth Network

While not designated as a separate bus pathway, fire ecology permeates all five primary networks and deserves treatment as a cross-cutting ecological process that has shaped PNW landscapes for millennia.

### Historical Fire Regimes

PNW fire regimes vary dramatically across the moisture gradient:

| Zone | Fire return interval | Fire type | Primary driver |
|------|---------------------|-----------|----------------|
| **West-side lowlands** (Puget, Willamette) | 1-5 years (with Indigenous burning) | Low-intensity surface fire | Cultural management |
| **West-side forests** (Olympic, W. Cascades) | 200-750 years | Infrequent, high-severity crown fire | Lightning + drought |
| **East-side forests** (E. Cascades, Blue Mtns) | 5-25 years | Frequent, low-intensity surface fire | Lightning |
| **Oak woodland/prairie** | 1-5 years (with Indigenous burning) | Low-intensity surface fire | Cultural management |
| **Subalpine** | 100-300+ years | Infrequent, stand-replacing | Lightning |
| **Alpine** | Rare to never | N/A | Insufficient fuel |

### Indigenous Fire Management

**This section cross-references directly with the Heritage Bridge document (Phase 627).**

Fire was not merely a natural process in the PNW — it was a tool, managed and applied by Indigenous nations for millennia before European colonization. The ecological landscapes that Europeans encountered in the 1800s were not "wilderness" but managed landscapes shaped by thousands of years of deliberate burning.

**Coast Salish nations** (Lummi, Saanich, Tulalip, Snoqualmie, Duwamish, Muckleshoot, Puyallup, Nisqually, and others) used low-intensity fire in the Puget lowlands to maintain:
- **Camas prairies** — *Camassia quamash* (CULT-FOOD-MEDICINE): fire suppressed woody encroachment (Douglas-fir, snowberry) and stimulated camas bulb production. Prairies burned on 1-3 year rotations produced 2-5x more camas per acre than unburned prairies.
- **Berry fields** — Salal, huckleberry, blackberry (native trailing blackberry *Rubus ursinus*): fire stimulated vigorous new growth with higher berry production.
- **Hunting grounds** — Open prairies and meadows provided visibility for hunting deer and elk. Fire-maintained edges between forest and prairie concentrated game animals.
- **Oak woodland** — Oregon white oak (*Quercus garryana*) (HAB-OAK-PRAIRIE) requires fire to prevent Douglas-fir overtopping. Without fire, oak woodlands convert to closed-canopy Douglas-fir forest within 50-100 years.

**Kalapuya nation** managed the Willamette Valley — the largest valley in western Oregon — as an open landscape of camas prairie, oak savanna, and wet prairie maintained by annual to biennial burning. The Willamette Valley that European settlers encountered in the 1840s was not natural grassland — it was a 4,000-square-mile managed garden, produced and maintained by Kalapuya fire management over thousands of years.

**Yakama, Warm Springs, and Klickitat nations** managed eastern Cascade huckleberry fields, oak woodlands, and ponderosa pine parklands through prescribed fire. High-elevation huckleberry fields (ELEV-SUBALPINE, 4,000-6,000 ft) were burned on 5-15 year rotations to stimulate berry production and maintain open conditions.

### Fire Suppression and Ecological Consequences

The cessation of Indigenous burning following colonization (1850s-1900s) and the subsequent implementation of fire suppression by federal land management agencies (1910s onward) have fundamentally altered PNW landscape ecology:

| Change | Pre-suppression | Post-suppression | Ecological consequence |
|--------|----------------|------------------|----------------------|
| Puget lowland prairie | ~150,000 acres | <5,000 acres (<3% remaining) | Loss of camas, oak woodland, prairie-dependent species |
| Willamette Valley prairie | ~1,000,000 acres | <20,000 acres (<2% remaining) | Critically endangered ecosystem |
| East-side ponderosa pine | Open parkland, 20-40 trees/acre | Dense thickets, 200-400 trees/acre | High-severity fire risk, drought stress |
| Oak woodland (region-wide) | Dominant lowland habitat | <5% remaining | Multiple ESA-listed species (Fender's blue butterfly, streaked horned lark) |
| Subalpine meadows | Maintained by fire + snowpack | Tree encroachment at lower margins | Loss of alpine meadow habitat |

Fire suppression has been called the single largest ecological change in the PNW since the last ice age. The shift from fire-maintained open landscapes (prairie, oak savanna, ponderosa parkland) to closed-canopy conifer forest represents a fundamental reorganization of PNW ecosystem structure — and with it, the loss of fire-dependent species and the cultural practices that sustained them.

### Fire-Network Interactions

Fire interacts with all five primary pathways:

- **Salmon Nutrient Pathway:** Fire in riparian zones can temporarily increase sediment delivery and water temperature, but post-fire nutrient pulses (ash-derived nitrogen and phosphorus) can increase stream productivity. Long-term, fire maintains the open riparian conditions that support nitrogen-fixing alder.
- **Kelp-Otter-Urchin Cascade:** No direct connection (marine).
- **Mycorrhizal Network:** Surface fire causes minimal network damage (networks are belowground); severe fire destroys surface organic horizons and fungal inoculum, requiring decades of network reconstruction. Post-fire mycorrhizal inoculation from surviving forest patches is critical for tree regeneration.
- **Predator-Prey Dynamics:** Fire creates habitat mosaic (burned/unburned patches) that increases landscape-level prey diversity and predator hunting efficiency. Fire-maintained meadows support higher elk and deer densities than closed forest.
- **Watershed Connectivity:** Fire influences hydrology through vegetation removal (increased runoff, reduced transpiration), soil water repellency, and long-term effects on snow accumulation and melt.

---

## Synthesis: The Integrated Network

The five pathways described in this document are not separate systems. They are five views of a single integrated network — the PNW ecosystem. The following synthesis maps their intersections.

### Pathway Intersection Map

```
                        SALMON NUTRIENT (P1)
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                    ▼         │         ▼
          PREDATOR-PREY (P4) │  WATERSHED (P5)
          wolf→elk→riparian   │  physical template
                    │         │         │
                    └────┐    │    ┌────┘
                         │    │    │
                         ▼    ▼    ▼
                    MYCORRHIZAL (P3)
                    central infrastructure
                    nutrient redistribution
                         │
                         │ (marine environment)
                         │
                    KELP-OTTER (P2)
                    marine trophic cascade
                    (connected via salmon
                     and watershed)
```

### Key Intersections

**1. Salmon × Mycorrhizal (P1 × P3):**
Marine-derived nitrogen from salmon carcasses enters the soil through decomposition and is transported through mycorrhizal networks to trees beyond the immediate riparian zone. The mycorrhizal network extends the spatial reach of the salmon nutrient pathway from ~500m (bear transport maximum) to potentially kilometers through hyphal redistribution. Simard's research suggests that mother trees (hub nodes in the mycorrhizal network) may redistribute salmon-derived nutrients to younger trees in their network, creating a pipeline from ocean to seedling.

**2. Predator-Prey × Watershed (P4 × P5):**
The wolf-elk-riparian cascade directly modifies watershed function. Wolves control elk, which allows riparian vegetation to recover, which stabilizes banks, shades streams, recruits large wood, and improves salmon habitat. The predator-prey pathway modifies the physical template of the watershed pathway.

**3. Predator-Prey × Mycorrhizal (P4 × P3):**
The spotted owl food web (owl → flying squirrel → truffle → mycorrhizal fungi → old-growth tree) links predator-prey dynamics to mycorrhizal network integrity. Owl population decline (from habitat loss or barred owl competition) does not directly affect mycorrhizal networks, but the food web illustrates how deeply intertwined these pathways are.

**4. Salmon × Watershed (P1 × P5):**
The watershed is the physical infrastructure of the salmon nutrient pathway — salmon cannot deliver marine nutrients without connected, accessible watersheds. Dams sever this connection. Dam removal (Elwha) restores it. Every modification to watershed connectivity (culverts, levees, channelization) is simultaneously a modification to the salmon nutrient pathway.

**5. Kelp × Watershed (P2 × P5):**
Terrestrial sediment delivered by watersheds affects kelp forest clarity and settlement substrate. Excessive sediment from logging, road construction, or bank erosion in ELEV-LOWLAND and ELEV-RIPARIAN increases turbidity in ELEV-SHALLOW-MARINE, reducing light penetration and kelp productivity. Watershed health and marine health are connected through sediment transport.

**6. Salmon × Predator-Prey (P1 × P4):**
Salmon are simultaneously nutrient vectors (P1) and prey items (P4). Southern Resident orcas depend on Chinook salmon — the same fish that carry the most marine-derived nutrients. Salmon decline affects both the nutrient pathway (less MDN delivery to forests) and the predator-prey pathway (less food for orcas, bears, eagles). The coupling means that salmon conservation is simultaneously nutrient management and predator conservation.

### The Meta-Network

Taken together, the five pathways form a meta-network with the following architecture:

| Property | Description |
|----------|------------|
| **Nodes** | Individual species and populations |
| **Edges** | Trophic links, nutrient flows, mycorrhizal connections, hydrological paths |
| **Topology** | Scale-free (few highly connected hub species, many peripheral species) |
| **Hub species** | Pacific salmon, Douglas-fir, sea otter, beaver, Rhizopogon fungi |
| **Bandwidth** | Varies by pathway — highest in mycorrhizal (continuous) and watershed (continuous) |
| **Latency** | Varies — mycorrhizal signals in hours/days; salmon nutrients seasonal; watershed instantaneous |
| **Resilience** | High to random node loss (scale-free property); low to targeted hub removal |
| **Vulnerability** | Salmon (hub species across multiple pathways); old-growth trees (mycorrhizal hubs); sea otters (marine cascade keystone) |

The PNW ecosystem's extraordinary productivity and diversity emerge from this network architecture. The system is resilient to random perturbation (losing a peripheral species has limited network impact) but catastrophically vulnerable to hub removal. Removing salmon, old-growth trees, sea otters, or beaver — the hub species that connect multiple pathways — causes cascading failures across the entire meta-network.

This is why the PNW conservation challenges of the 20th and 21st centuries — salmon decline, old-growth logging, sea otter extirpation, beaver trapping — have had effects far beyond the targeted species. Each hub removal degraded not one but multiple ecological pathways simultaneously.

And it is why restoration of these hub species — salmon habitat recovery, old-growth protection, sea otter reintroduction, beaver restoration — has the potential to regenerate entire network pathways, cascading benefits across the landscape.

The wires are still there. Many of the nodes are still there. The network can be rebuilt.

---

## Sources

### Primary Research

| ID | Citation | Used in |
|----|----------|---------|
| **PR-01** | Helfield, J.M. & Naiman, R.J. (2001). "Effects of salmon-derived nitrogen on riparian forest growth and implications for stream productivity." *Ecology* 82(9): 2403-2409. | Salmon Nutrient Pathway (P1) |
| **PR-02** | Simard, S.W., Perry, D.A., Jones, M.D., Myrold, D.D., Durall, D.M. & Molina, R. (1997). "Net transfer of carbon between ectomycorrhizal tree species in the field." *Nature* 388: 579-582. | Mycorrhizal Network (P3) |
| **PR-03** | Simard, S.W. (2012). "Mycorrhizal networks and seedling establishment in Douglas-fir forests." In: *Biocomplexity of Plant-Fungal Interactions* (ed. D. Southworth), pp. 85-107. Wiley-Blackwell. | Mycorrhizal Network (P3) |
| **PR-04** | Estes, J.A., Tinker, M.T., Williams, T.M. & Doak, D.F. (1998). "Killer whale predation on sea otters linking oceanic and nearshore ecosystems." *Science* 282: 473-476. | Kelp-Otter-Urchin (P2) |
| **PR-05** | Estes, J.A. & Palmisano, J.F. (1974). "Sea otters: their role in structuring nearshore communities." *Science* 185: 1058-1060. | Kelp-Otter-Urchin (P2) |
| **PR-06** | Estes, J.A. & Duggins, D.O. (1995). "Sea otters and kelp forests in Alaska: generality and variation in a community ecological paradigm." *Ecological Monographs* 65: 75-100. | Kelp-Otter-Urchin (P2) |
| **PR-07** | Ripple, W.J. & Beschta, R.L. (2004). "Wolves and the ecology of fear: can predation risk structure ecosystems?" *BioScience* 54(8): 755-766. | Predator-Prey (P4) |
| **PR-08** | Naiman, R.J., Bilby, R.E., Schindler, D.E. & Helfield, J.M. (2002). "Pacific salmon, nutrients, and the dynamics of freshwater and riparian ecosystems." *Ecosystems* 5: 399-417. | Salmon Nutrient (P1) |
| **PR-09** | Reimchen, T.E. (2000). "Some ecological and evolutionary aspects of bear-salmon interactions in coastal British Columbia." *Canadian Journal of Zoology* 78: 448-457. | Salmon Nutrient (P1) |
| **PR-10** | Hilderbrand, G.V., Hanley, T.A., Robbins, C.T. & Schwartz, C.C. (1999). "Role of brown bears in the flow of marine nitrogen into a terrestrial ecosystem." *Oecologia* 121: 546-550. | Salmon Nutrient (P1) |
| **PR-11** | Beiler, K.J., Durall, D.M., Simard, S.W., Maxwell, S.A. & Kretzer, A.M. (2010). "Architecture of the wood-wide web: *Rhizopogon* spp. genets link multiple Douglas-fir cohorts." *New Phytologist* 185: 543-553. | Mycorrhizal Network (P3) |
| **PR-12** | Song, Y.Y., Zeng, R.S., Xu, J.F., Li, J., Shen, X. & Yihdego, W.G. (2010). "Interplant communication of tomato plants through underground common mycorrhizal networks." *PLoS ONE* 5: e13324. | Mycorrhizal Network (P3) |
| **PR-13** | Pollock, M.M., Pess, G.R., Beechie, T.J. & Montgomery, D.R. (2004). "The importance of beaver ponds to coho salmon production in the Stillaguamish River basin." *North American Journal of Fisheries Management* 24: 749-760. | Watershed (P5) |
| **PR-14** | Bilby, R.E. & Ward, J.W. (1991). "Characteristics and function of large woody debris in streams draining old-growth, clear-cut, and second-growth forests in southwestern Washington." *Canadian Journal of Fisheries and Aquatic Sciences* 48: 2499-2508. | Watershed (P5) |
| **PR-15** | Harvell, C.D., Montecino-Latorre, D., Caldwell, J.M., et al. (2019). "Disease epidemic and a marine heat wave are associated with the continental-scale collapse of a pivotal predator (*Pycnopodia helianthoides*)." *Science Advances* 5: eaau7042. | Kelp-Otter-Urchin (P2) |
| **PR-16** | Beechie, T.J., Liermann, M., Pollock, M.M., Baker, S. & Davies, J. (2005). "Channel pattern and river-floodplain dynamics in forested mountain river systems." *Geomorphology* 78: 124-141. | Watershed (P5) |
| **PR-17** | Quinn, T.P. (2005). *The Behavior and Ecology of Pacific Salmon and Trout.* University of Washington Press. | Salmon Nutrient (P1), Watershed (P5) |
| **PR-18** | Collins, B.D. & Montgomery, D.R. (2002). "Forest development, wood jams, and restoration of floodplain rivers in the Puget Lowland, Washington." *Restoration Ecology* 10: 237-247. | Watershed (P5) |
| **PR-19** | Graham, M.H., Vasquez, J.A. & Buschmann, A.H. (2007). "Global ecology of the giant kelp Macrocystis: from ecotypes to ecosystems." *Oceanography and Marine Biology: An Annual Review* 45: 39-88. | Kelp-Otter-Urchin (P2) |
| **PR-20** | Burton, T.M. & Likens, G.E. (1975). "Salamander populations and biomass in the Hubbard Brook Experimental Forest, New Hampshire." *Copeia* 1975: 541-546. | Predator-Prey (P4) |
| **PR-21** | Paine, R.T. (1966). "Food web complexity and species diversity." *American Naturalist* 100: 65-75. | Predator-Prey (P4), Kelp-Otter-Urchin (P2) |
| **PR-22** | Kenyon, K.W. (1969). "The sea otter in the eastern Pacific Ocean." *North American Fauna* 68: 1-352. | Kelp-Otter-Urchin (P2) |
| **PR-23** | Simard, S.W., Beiler, K.J., Bingham, M.A., Deslippe, J.R., Philip, L.J. & Teste, F.P. (2015). "Mycorrhizal networks: mechanisms, ecology and modelling." *Fungal Biology Reviews* 26: 39-60. | Mycorrhizal Network (P3) |
| **PR-24** | Good, J.W. (2000). "Summary and current status of Oregon's estuarine ecosystems." In: *Oregon State of the Environment Report.* Oregon Progress Board. | Watershed (P5) |
| **PR-25** | Magnusson, A. & Hilborn, R. (2003). "Estuarine influence on survival rates of coho (*Oncorhynchus kisutch*) and Chinook salmon (*Oncorhynchus tshawytscha*) released from hatcheries on the US Pacific coast." *Estuaries* 26: 1094-1103. | Watershed (P5) |

### Government and Agency Reports

| ID | Citation | Used in |
|----|----------|---------|
| **GOV-01** | USFWS (2023). "Washington sea otter stock assessment." Marine Mammal Stock Assessment Reports. | Kelp-Otter-Urchin (P2) |
| **GOV-02** | Northwest Power and Conservation Council. "Columbia River Basin Fish and Wildlife Program." | Salmon Nutrient (P1), Watershed (P5) |
| **GOV-03** | NOAA Fisheries. "ESA-listed Pacific salmon and steelhead." Species directory. | Predator-Prey (P4) |
| **GOV-04** | National Park Service. "Elwha River Restoration Project." Olympic National Park. | Watershed (P5) |

### Tribal and Community Sources

| ID | Citation | Used in |
|----|----------|---------|
| **TRIBAL-01** | Coast Salish nations' published cultural ecology resources. | Fire Ecology |
| **TRIBAL-02** | Kalapuya fire management documented in Boyd, R. (1999). *Indians, Fire, and the Land in the Pacific Northwest.* Oregon State University Press. | Fire Ecology |
| **TRIBAL-03** | Confederated Tribes of Warm Springs fire management program documentation. | Fire Ecology |

---

*Document version: 1.0*
*Created for: PNW Living Systems Taxonomy & Chipset (ECO mission), Phase 626*
*Scope: Ecological network documentation for chipset bus derivation*
*Cross-references: shared-attributes.md (IDs), coordinate-projection.md (elevation mappings), heritage-bridge.md (cultural fire management)*
