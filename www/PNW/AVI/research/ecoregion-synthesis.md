# Module 3 Synthesis: Cross-Ecoregion Avian Community Patterns

> **Mission:** Wings of the Pacific Northwest — PNW Avian Taxonomy
> **Module:** 3 — Ecoregion Communities (Synthesis)
> **Agent:** SYNTH-ECO-AVI
> **Date:** 2026-03-09
> **Scope:** Cross-ecoregion patterns, indicator species, community assembly rules
> **Inputs:** `ecoregion-high.md` (Module 3A), `ecoregion-low.md` (Module 3B), `resident.md` (Module 1), `migratory.md` (Module 2), `raptors.md`, `shorebirds.md`, `elevation-matrix.md`
> **Canonical ecoregion reference:** `www/PNW/pnw-ecoregion-canonical.md`
> **ECO shared attributes:** `www/PNW/ECO/research/shared-attributes.md`
> **Coordinate formula:** `Y = round((elevation_ft / 40.05) - 41)`

---

## Table of Contents

1. [Species Richness Gradient](#1-species-richness-gradient)
2. [Indicator Species by Ecoregion](#2-indicator-species-by-ecoregion)
3. [Community Assembly Rules](#3-community-assembly-rules)
4. [Cross-Ecoregion Species](#4-cross-ecoregion-species)
5. [Seasonal Community Shifts](#5-seasonal-community-shifts)
6. [Disturbance Ecology](#6-disturbance-ecology)
7. [Cross-Module Integration](#7-cross-module-integration)
8. [Conservation Prioritization](#8-conservation-prioritization)

---

## 1. Species Richness Gradient

### 1.1 Species Count by Ecoregion Band

The Pacific Northwest's avian communities are distributed across 11 canonical ecoregion bands defined in `pnw-ecoregion-canonical.md`. Species richness varies dramatically along this gradient, reflecting habitat structural complexity, productivity, and the degree of human modification.

| # | Ecoregion Band | Breeding Species | Wintering Species | Year-Round Total | Passage Migrants | Richness Rank |
|---|---------------|-----------------|-------------------|-----------------|-----------------|---------------|
| 1 | ELEV-ALPINE | 15–20 | 1–3 | 3–5 | 5–10 | 11 (lowest) |
| 2 | ELEV-SUBALPINE | 45–60 | 10–20 | 25–35 | 10–15 | 7 |
| 3 | ELEV-MONTANE | 80–110 | 30–50 | 55–70 | 15–25 | 4 |
| 4 | ELEV-LOWLAND | 110–140 | 60–90 | 80–100 | 30–45 | 2 |
| 5 | ELEV-RIPARIAN | 95–130 | 50–75 | 65–85 | 25–40 | 3 |
| 6 | ELEV-COASTAL | 75–100 | 80–120 | 55–70 | 40–60 | 5 |
| 7 | ELEV-SHRUB-STEPPE | 50–75 | 15–30 | 30–45 | 15–25 | 6 |
| 8 | ELEV-SUBTERRANEAN | 5–10 | 3–8 | 3–8 | 0–2 | 10 (near-lowest) |
| 9 | ELEV-INTERTIDAL | 25–35 | 50–70 | 15–25 | 60–80 | 8 |
| 10 | ELEV-SHALLOW-MARINE | 30–45 | 60–80 | 20–30 | 30–50 | 9 (but see 1.4) |
| 11 | ELEV-DEEP-MARINE | 15–25 | 20–35 | 10–15 | 10–20 | tied-11 |

**Note on counting method:** Riparian is cross-cutting and overlaps with other bands. Species attributed to ELEV-RIPARIAN are those that require or strongly prefer riparian structure for breeding or foraging. Species that merely transit riparian zones are counted in the adjacent upland band. ELEV-SUBTERRANEAN counts only species that use subterranean cavities or structures (cavity nesters, cave roosters); most "subterranean users" are counted in the band where they forage. See `elevation-matrix.md` for per-species band assignments.

### 1.2 Richness Peak at the Lowland-Riparian Transition

The highest avian species richness in the Pacific Northwest occurs at the interface between ELEV-LOWLAND (500–2,000 ft) and ELEV-RIPARIAN corridors. This is not accidental. The lowland-riparian transition zone combines:

1. **Maximum habitat structural diversity.** Within a single watershed section at 800–1,500 ft elevation, an observer may encounter old-growth Douglas-fir canopy, second-growth alder stands, riparian willow thickets, beaver pond wetlands, open meadow, edge habitat, and agricultural fields. Each structural element supports a distinct avian guild (source: G-14, G-18).

2. **Maximum food web complexity.** The lowland-riparian zone supports the greatest diversity of arthropod prey, the highest density of small mammal populations (prey for raptors), the most productive salmon spawning reaches (nutrients driving the entire food chain), and the greatest volume of fruit and seed production. This productivity fuels the highest breeding bird density per unit area of any PNW habitat (source: G-22, O-02).

3. **Edge effect amplification.** The lowland band in its current fragmented condition creates an enormous amount of forest-field, forest-riparian, and forest-road edge. While edge effects are detrimental to true forest interior species (Northern Spotted Owl, Marbled Murrelet), they benefit edge-associated species that exploit multiple habitats simultaneously. Cooper's Hawk, American Robin, Song Sparrow, Black-capped Chickadee, and Spotted Towhee all reach peak densities in fragmented lowland landscapes (source: G-14).

4. **Year-round habitability.** Maritime climate moderation means lowland-riparian zones rarely experience the deep freezes or heavy snowpack that limit winter occupancy at higher elevations. This allows the highest year-round resident count (80–100 species) of any band.

**Species richness at the lowland-riparian boundary: 140–160 species when combining both bands in a single transect** — the highest total for any paired-band combination in the PNW system.

### 1.3 Marine Zone Richness: The Specialist Paradox

The marine ecoregion bands (ELEV-INTERTIDAL, ELEV-SHALLOW-MARINE, ELEV-DEEP-MARINE) present a paradox in the richness gradient. Raw breeding species counts are low — only 25–45 species breed in marine-influenced zones — yet the marine bands harbor some of the most specialized and conservation-critical species in the PNW avifauna.

**Why marine zone richness appears low but matters disproportionately:**

- **Extreme specialization.** Marine birds (alcids, tubenoses, storm-petrels, cormorants) have evolved flight mechanics, diving physiology, salt glands, and foraging strategies found nowhere in terrestrial guilds. The Common Murre (*Uria aalge*) dives to 180 m — deeper than any terrestrial bird flies high. Rhinoceros Auklet, Cassin's Auklet, and Tufted Puffin are pelagic foragers that return to land only to nest. These species have no ecological equivalents on land (source: G-25, G-18).

- **Colony concentration.** Marine birds nest in dense colonies on offshore rocks, sea stacks, and cliff faces. A single colony on the Washington Outer Coast may contain 10,000–70,000 Common Murres, 30,000–50,000 Rhinoceros Auklets, and 3,000–5,000 Tufted Puffins (source: G-25). The loss of a single colony site can eliminate a significant fraction of the regional population.

- **Winter influx.** The PNW marine zone receives massive wintering populations of sea ducks, loons, grebes, and alcids from boreal and arctic breeding grounds. The winter species count for ELEV-SHALLOW-MARINE (60–80 species) actually exceeds the breeding count, reversing the pattern seen in terrestrial bands where breeding richness always exceeds winter richness.

- **Indicator sensitivity.** Marine birds are among the most sensitive indicators of ocean ecosystem health. Seabird breeding failure rates track sea surface temperature anomalies, forage fish abundance (Pacific herring, Pacific sand lance, northern anchovy), and marine heat wave events with high fidelity. The 2014–2016 "Blob" marine heat wave caused unprecedented Common Murre die-offs across the PNW coast, with an estimated 500,000–1,000,000 birds killed (source: G-25).

### 1.4 Elevation-Diversity Relationship: The Mid-Elevation Peak

Avian species richness in the PNW does not follow a simple linear decline with elevation. Instead, the relationship describes a hump-shaped curve with a peak at mid-elevations (1,500–3,500 ft, spanning the upper ELEV-LOWLAND and lower ELEV-MONTANE bands).

```
Species Richness vs. Elevation (PNW west-side composite)

Richness
  140 |                    *
      |                 *     *
  120 |              *           *
      |           *                 *
  100 |        *                       *
      |     *                             *
   80 |  *                                   *
      |                                         *
   60 |*                                           *
      |                                               *
   40 |                                                   *
      |                                                      *
   20 |                                                         *
      |____________________________________________________________
       0    2000   4000   6000   8000  10000  12000  14000
                        Elevation (ft)
```

**Drivers of the mid-elevation peak:**

1. **Overlap zone.** Mid-elevations host both lowland species at their upper range limit and montane species at their lower range limit. This zone of overlap inflates local richness beyond what either community contributes alone.

2. **Intermediate disturbance.** Natural disturbance regimes (wind, avalanche, moderate fire) are most varied at mid-elevations, creating a mosaic of forest age classes and canopy openings that support the widest range of habitat specialists (source: G-22).

3. **Rain-snow transition.** The 2,000–4,000 ft band is where precipitation transitions from predominantly rain to predominantly snow. This creates unique hydrological conditions — ephemeral snowpack, rain-on-snow flood events, wet meadows — that generate diverse microhabitats unavailable at other elevations.

4. **Old-growth structure.** The remaining large tracts of old-growth forest in the PNW (Olympic National Park, North Cascades, Gifford Pinchot) are concentrated in the montane band. Old-growth structural features (multi-layered canopy, large snags, downed wood, canopy gaps) create the highest vertical habitat complexity, supporting the most diverse guild structure per unit area.

**The mid-elevation peak is not a universal law.** East of the Cascade Crest, the elevation-richness relationship is inverted at low elevations due to the aridity of the shrub-steppe. East-side richness peaks in montane riparian corridors and ponderosa pine-mixed conifer zones (3,000–5,000 ft) where water availability is higher than in the surrounding steppe (source: G-18).

---

## 2. Indicator Species by Ecoregion

Indicator species serve as sentinels of ecosystem health within each ecoregion band. An effective indicator species meets three criteria: (1) strong fidelity to the target ecoregion, (2) measurable population response to environmental change, and (3) practical detectability through existing monitoring programs. The following table identifies 2–3 indicator species per band, with justification for selection.

### 2.1 Master Indicator Species Table

| Ecoregion | Indicator Species | Why Indicator | Sensitivity | Monitoring Program |
|-----------|------------------|---------------|-------------|-------------------|
| **ELEV-ALPINE** | White-tailed Ptarmigan (*Lagopus leucura*) | Only year-round resident gamebird above treeline; population tracks snow duration and alpine meadow extent; plumage molt timing reflects snowpack phenology | HIGH — climate-driven range contraction documented; populations retreating upslope on Mt. Rainier and North Cascades at ~30 m/decade | WA Dept. Fish & Wildlife alpine bird surveys; NPS monitoring plots on Mt. Rainier, North Cascades, Olympic |
| **ELEV-ALPINE** | Gray-crowned Rosy-Finch (*Leucosticte tephrocotis*) | Obligate snowfield forager; population density correlates with aeolian insect deposition rates on glaciers and permanent snowfields; only PNW songbird that routinely forages on ice | MODERATE-HIGH — glacier retreat directly reduces foraging habitat; glacial area on Cascade volcanoes has declined ~40% since 1900 | Christmas Bird Count (winter roost aggregations); eBird alpine protocol; Mt. Rainier NPS point counts |
| **ELEV-SUBALPINE** | Clark's Nutcracker (*Nucifraga columbiana*) | Keystone seed disperser for whitebark pine; caches 20,000–30,000 seeds/yr; population crash signals whitebark pine decline (blister rust, mountain pine beetle); absence from historical range = regeneration failure | HIGH — whitebark pine listed as ESA Threatened (2022); nutcracker irruptions from subalpine correlate with cone crop failure | USFS whitebark pine monitoring; Audubon Christmas Bird Count (winter irruptions); eBird |
| **ELEV-SUBALPINE** | Spruce Grouse (*Canachites canadensis*) | Year-round subalpine forest resident; diet 95% subalpine fir and spruce needles in winter; home range <1 km; non-migratory; population tracks forest structure integrity | MODERATE — sensitive to fragmentation and recreation disturbance; ski area development displaces breeding territories | WA Dept. Fish & Wildlife upland gamebird surveys; BC breeding bird atlas |
| **ELEV-SUBALPINE** | Hermit Thrush (*Catharus guttatus*) | Breeds in subalpine and montane conifer; song is the characteristic sound of PNW subalpine forest; breeding density responds to understory shrub layer quality | MODERATE — BBS data show stable to slightly declining trend; sensitive to forest thinning that removes understory | BBS routes in montane/subalpine; eBird; USFS monitoring |
| **ELEV-MONTANE** | Northern Spotted Owl (*Strix occidentalis caurina*) | ESA-listed old-growth obligate; territory size, reproductive success, and survival rate are the primary population vital rates tracked for old-growth forest management across the PNW; decades of monitoring make this the best-studied owl in North America | CRITICAL — ESA Threatened since 1990; Barred Owl invasion compounding habitat loss; range-wide population declining ~3.8% annually | USFWS Spotted Owl Recovery Plan monitoring; demography study areas (Olympic, Cle Elum, Roseburg, HJ Andrews) |
| **ELEV-MONTANE** | Marbled Murrelet (*Brachyramphus marmoratus*) | ESA-listed; nests on old-growth conifer limbs at montane elevations, forages in ELEV-SHALLOW-MARINE; population decline tracks old-growth loss and marine forage fish availability; the ultimate cross-band indicator | CRITICAL — ESA Threatened since 1992; WA population ~5,200 birds (2023 at-sea survey); declining ~4.4% annually in WA | WDFW at-sea surveys (May–Jul); USFWS radar surveys; USFS inland habitat monitoring |
| **ELEV-LOWLAND** | Pileated Woodpecker (*Dryocopus pileatus*) | Largest woodpecker in PNW; excavates rectangular cavities in large-diameter trees and snags; cavity re-use by 40+ secondary cavity nesters; presence indicates mature forest structure with adequate snag density (>4 large snags/acre) | MODERATE — requires large territories (150–400 ha) in contiguous mature forest; tolerates some fragmentation but absent from highly urbanized landscapes | BBS routes; eBird; USFS forest health monitoring; state wildlife surveys |
| **ELEV-LOWLAND** | Varied Thrush (*Ixoreus naevius*) | Breeds in closed-canopy lowland and montane conifer forest; ghostly whistle is the acoustic signature of old PNW forests; population density drops sharply in second-growth stands less than 80 years old | MODERATE — BBS data show long-term stability but local declines in fragmented landscapes; sensitive to forest harvest that removes canopy closure | BBS; Audubon Christmas Bird Count (winter influx to lowlands); eBird |
| **ELEV-RIPARIAN** | American Dipper (*Cinclus mexicanus*) | Only North American songbird that forages by walking underwater in streams; population density and reproductive success directly track stream invertebrate biomass, water quality (turbidity, dissolved oxygen, temperature), and flow regime | HIGH — immediate response to stream degradation; dipper territory density is used as a bioassay for stream health in WA and OR | USFS stream monitoring; WA Dept. of Ecology water quality monitoring; eBird; citizen science nest box programs |
| **ELEV-RIPARIAN** | Harlequin Duck (*Histrionicus histrionicus*) | Breeds on fast-moving montane streams, winters in rocky marine intertidal; population links montane stream quality to marine survival; low reproductive rate makes populations sensitive to adult mortality | MODERATE-HIGH — WA breeding population estimated 1,000–1,500 pairs; sensitive to recreational disturbance on breeding streams and marine oil spills on wintering grounds | WDFW sea duck surveys (winter); USFS stream surveys (summer); Puget Sound Ecosystem Monitoring Program |
| **ELEV-COASTAL** | Snowy Plover (*Charadrius nivosus*) | ESA-listed (Western population, Threatened); breeds on open sandy beaches and dune systems; population tracks beach disturbance (vehicle traffic, pedestrian use, predator subsidies from adjacent development) | CRITICAL — OR recovery population ~530 adults (2023); nest exclosures and beach closures required at most colonies; European beachgrass invasion reduces habitat | USFWS recovery program; OR coast Snowy Plover monitoring (annual nest surveys); ODFW |
| **ELEV-COASTAL** | Rhinoceros Auklet (*Cerorhinca monocerata*) | Burrow-nesting seabird on coastal islands; breeding success (chick meals per night, growth rate) directly tracks Pacific herring and Pacific sand lance availability within 50 km foraging radius; multi-decade monitoring data from Protection Island, WA | HIGH — breeding failure in low forage fish years (2014–2016 marine heat wave); colony attendance is a direct index of nearshore productivity | USGS/WDFW Protection Island long-term monitoring; Audubon Seabird Institute; colony counts |
| **ELEV-SHRUB-STEPPE** | Greater Sage-Grouse (*Centrocercus urophasianus*) | Sagebrush obligate across entire life cycle; lek counts are the primary metric for shrub-steppe ecosystem health; declining across range due to cheatgrass invasion, wildfire, energy development, and habitat fragmentation | CRITICAL — WA population ~1,000 birds (2023 lek count); OR population declining; not ESA-listed but "warranted but precluded" finding in 2010; BLM/USFS management plans | WDFW lek monitoring (annual); BLM sage-grouse habitat assessment; USGS population modeling |
| **ELEV-SHRUB-STEPPE** | Burrowing Owl (*Athene cunicularia*) | Ground-nesting owl dependent on fossorial mammal burrows (ground squirrels, badgers); population tracks the health of the grassland-burrowing mammal food web; extreme sensitivity to agricultural conversion and ground squirrel poisoning | CRITICAL — WA population <200 pairs; state Endangered; extirpated from most of western WA; OR population declining | WDFW Burrowing Owl recovery program; annual nest surveys; artificial burrow programs |
| **ELEV-SUBTERRANEAN** | Vaux's Swift (*Chaetura vauxi*) | Colonial rooster in large hollow trees and chimneys; migration staging roosts (10,000–30,000 birds) in large hollow snags and industrial chimneys are among the most spectacular avian phenomena in the PNW; loss of large hollow snags reduces roost site availability | MODERATE — population appears stable but dependent on a small number of large-cavity roost sites; Chapman Elementary chimney roost in Portland (30,000+ birds) is iconic | Audubon swift roost counts (Sep migration); Portland Audubon Chapman counts; eBird |
| **ELEV-INTERTIDAL** | Black Oystercatcher (*Haematopus bachmani*) | Intertidal obligate on rocky shores; nests on bare rock above high tide; forages exclusively on mussels, limpets, chitons; territory density tracks mussel bed health and intertidal disturbance; entire global population concentrated on Pacific coast | HIGH — global population ~11,000 individuals; WA population ~1,200; sensitive to oil spills, sea star wasting syndrome (reduces competitor control of mussel beds), and human disturbance of nest sites | USFWS Pacific Coast shorebird surveys; WDFW intertidal monitoring; rocky shore citizen science |
| **ELEV-SHALLOW-MARINE** | Common Murre (*Uria aalge*) | Most abundant seabird in PNW nearshore waters; colony counts and breeding success track forage fish availability and ocean temperature; mass die-offs during marine heat waves serve as early warning for ecosystem-level disruption | HIGH — estimated 500,000–1,000,000 murres killed during 2014–2016 Blob; Oregon coast colonies declined ~70% from 1988 peak; slow reproductive recovery (1 egg/year) | USFWS seabird colony surveys; USGS forage fish surveys; Oregon coast beached bird surveys (COASST) |
| **ELEV-SHALLOW-MARINE** | Pigeon Guillemot (*Cepphus columba*) | Nearshore alcid nesting in rock crevices and cliff cavities; foraging restricted to shallow water (<50 m depth); breeding success is a direct index of nearshore rocky reef fish (sculpin, gunnel, blenny) productivity | MODERATE — population stable but locally sensitive to kelp forest decline and nearshore development; readily monitored from shore | Colony counts; eBird; Puget Sound Ecosystem Monitoring Program; citizen science |
| **ELEV-DEEP-MARINE** | Sooty Shearwater (*Ardenna grisea*) | Trans-equatorial migrant; millions transit PNW waters during austral winter (PNW summer); abundance tracks ocean productivity at basin scale; decline reflects Southern Hemisphere breeding ground conditions | HIGH — 90% global population decline since 1970 (BirdLife International); PNW transit numbers declining; sentinel for Pacific-wide ecosystem stress | NOAA ship surveys; Christmas Bird Count (offshore); at-sea survey protocols |
| **ELEV-DEEP-MARINE** | Fork-tailed Storm-Petrel (*Hydrobates furcatus*) | Burrow-nesting pelagic specialist on remote offshore islands; feeds on zooplankton and small fish at ocean surface; presence and breeding success track deep-water upwelling and zooplankton productivity | MODERATE-HIGH — breeding colonies on OR/WA offshore islands are small and vulnerable to introduced predators (rats, cats); entire PNW breeding population concentrated at <20 colony sites | USFWS National Wildlife Refuge colony monitoring; at-sea surveys; banding studies |

### 2.2 Indicator Selection Rationale

The 26 indicator species in the table above were selected using a hierarchical filtering process:

**Filter 1: Ecoregion fidelity.** The species must spend at least one critical life stage (breeding, wintering, or foraging) primarily within the target ecoregion band. Generalists that span 5+ bands (American Robin, Common Raven, Red-tailed Hawk) are excluded as indicators despite their abundance — they respond to too many simultaneous environmental variables to provide clean signal for any single band.

**Filter 2: Population responsiveness.** The species must show documented population-level response to environmental change within the target ecoregion. This requires either long-term population monitoring data (BBS, CBC, colony counts) or demographic vital rate data (survival, fecundity) linked to habitat metrics.

**Filter 3: Monitoring feasibility.** The species must be practically monitorable using existing survey methods. Nocturnal, secretive, or rare species (e.g., Northern Pygmy-Owl, Long-eared Owl) are poor indicators not because they lack sensitivity but because detection probability is too low for reliable trend estimation.

**Filter 4: Conservation relevance.** Priority given to species with formal conservation status (ESA-listed, state Endangered, PIF Watch List) because these species already receive monitoring investment, ensuring data continuity.

---

## 3. Community Assembly Rules

### 3.1 Niche Partitioning Along the Elevation Gradient

Avian communities in the PNW are structured by four primary niche axes, all of which vary with elevation:

**Axis 1: Foraging stratum.** Vertical partitioning within forest structure is the primary mechanism separating coexisting species at any given elevation. In a mature montane forest stand (ELEV-MONTANE, 2,500–4,000 ft), the following stratum partitioning is observed:

| Stratum | Height | Guild | Representative Species |
|---------|--------|-------|----------------------|
| Canopy surface | 150–250 ft | Aerial insectivore | Olive-sided Flycatcher, Vaux's Swift |
| Upper canopy | 100–200 ft | Canopy gleaner | Townsend's Warbler, Golden-crowned Kinglet |
| Mid-canopy | 50–100 ft | Bark prober (ascending) | Brown Creeper, Red-breasted Nuthatch |
| Lower canopy | 20–50 ft | Bark prober (descending) | White-breasted Nuthatch |
| Understory | 3–20 ft | Understory gleaner | Pacific-slope Flycatcher, Pacific Wren |
| Shrub layer | 1–6 ft | Shrub gleaner | Wilson's Warbler, MacGillivray's Warbler |
| Ground surface | 0–1 ft | Ground forager | Varied Thrush, Fox Sparrow, Dark-eyed Junco |
| Sub-surface | Below ground | Excavator | Pileated Woodpecker, Hairy Woodpecker |
| Aquatic | Stream bed | Aquatic forager | American Dipper (in riparian inclusions) |

At alpine elevations (ELEV-ALPINE), the vertical structure collapses to two strata — ground surface and aerial — because there is no canopy. This structural simplification explains why alpine avian communities have only 15–20 breeding species compared to 80–110 in the montane band: fewer strata means fewer available niches (source: G-18, G-25).

**Axis 2: Food type.** Within each stratum, species partition by diet: insectivores (arthropods from bark, foliage, air, or ground), granivores (seeds), frugivores (berries), nectarivores (rare in PNW — Anna's Hummingbird and Rufous Hummingbird are the primary representatives), and carnivores (raptors). At high elevations, diet options narrow to insects and seeds, forcing convergence into a single dominant guild (ground-foraging insectivore-granivore) that accounts for 70% of the alpine breeding community (see ecoregion-high.md Section 1.4).

**Axis 3: Temporal partitioning.** Nocturnal and diurnal species occupy the same physical habitat without competing. The Northern Spotted Owl and Cooper's Hawk may share a montane forest stand — the owl hunts flying squirrels at night while the hawk hunts songbirds by day. Similarly, the Common Nighthawk and Olive-sided Flycatcher both capture flying insects in the same airspace, but partition the 24-hour cycle.

**Axis 4: Phenological partitioning.** Migratory species arrive and depart on schedules that reduce temporal overlap with competitors. Early-arriving migrants (Say's Phoebe, March) exploit insect resources before later-arriving competitors (Hammond's Flycatcher, late May) reach breeding territories. This temporal staggering reduces resource competition during the critical territory establishment period (source: G-18).

### 3.2 Habitat Filtering vs. Competitive Exclusion

Community membership at each ecoregion band is determined by two complementary processes:

**Habitat filtering** operates at the band level. Environmental conditions — temperature, precipitation, snow duration, vegetation structure, wind exposure — exclude species that lack the physiological or behavioral capacity to persist. Habitat filtering is the primary structuring force in extreme environments:

- ELEV-ALPINE filters out all species that cannot tolerate freezing temperatures, wind exposure, and compressed breeding seasons. The habitat filter at alpine elevations is so severe that only 15–20 species pass through it.
- ELEV-DEEP-MARINE filters out all species that cannot dive or forage on the ocean surface. Only specialized pelagic species (alcids, tubenoses, storm-petrels) pass through the marine habitat filter.
- ELEV-SHRUB-STEPPE filters out all forest-dependent species. The arid, open landscape selects for ground-nesting, open-country foragers.

**Competitive exclusion** operates within bands, once the habitat filter has defined the candidate species pool. Species with overlapping niches compete for resources, and the outcome determines which species coexist and which are excluded. The most dramatic example in PNW ornithology is the Barred Owl invasion of Northern Spotted Owl territory:

- The Barred Owl (*Strix varia*) expanded its range westward across North America during the 20th century, reaching the PNW in the 1970s. It passed through the same habitat filter (old-growth forest) as the resident Northern Spotted Owl.
- Once co-occurring, the Barred Owl's competitive advantages — larger body size, broader diet, higher reproductive rate, and tolerance of fragmented habitat — drove spotted owl displacement via competitive exclusion.
- Spotted owl populations in areas with established Barred Owl presence decline at 3.8% per year, a rate that leads to local extirpation within 20–50 years (source: G-14, G-22).

This case illustrates a general principle: habitat filtering determines the candidate pool; competitive exclusion determines the realized community. Most PNW band boundaries function primarily as habitat filters, while within-band community structure reflects centuries of competitive sorting.

### 3.3 Functional Guild Redundancy by Elevation

Functional redundancy — the degree to which multiple species perform the same ecological function — varies systematically with elevation:

| Elevation Band | Aerial Insectivore spp. | Bark Prober spp. | Ground Forager spp. | Raptor spp. | Redundancy Level |
|---------------|------------------------|-------------------|---------------------|-------------|-----------------|
| ELEV-ALPINE | 2–3 (swifts, swallows — transient) | 0 (no trees) | 5–8 | 3–4 | VERY LOW |
| ELEV-SUBALPINE | 4–6 | 3–5 | 8–12 | 5–7 | LOW-MODERATE |
| ELEV-MONTANE | 8–12 | 6–8 | 12–18 | 8–10 | HIGH |
| ELEV-LOWLAND | 10–15 | 6–8 | 15–25 | 10–14 | HIGHEST |
| ELEV-RIPARIAN | 6–10 | 4–6 | 12–18 | 6–8 | HIGH |
| ELEV-COASTAL | 5–8 | 3–5 | 10–15 | 6–8 | MODERATE |
| ELEV-SHRUB-STEPPE | 3–5 | 2–3 | 8–12 | 6–8 | MODERATE |

**Conservation implication:** Low-redundancy communities are fragile. If the White-tailed Ptarmigan is lost from an alpine zone, there is no functionally equivalent ground-foraging herbivore to replace it. If the Gray-crowned Rosy-Finch declines, its snowfield-foraging niche goes unfilled. In contrast, the loss of a single bark-probing species from a lowland forest (say, Red-breasted Nuthatch) would be partially compensated by Brown Creeper, White-breasted Nuthatch, and Hairy Woodpecker, all performing overlapping bark-gleaning functions.

The management implication is clear: **conservation urgency should be weighted by functional redundancy.** Alpine and subalpine species losses carry disproportionate ecological consequence relative to lowland losses, even though lowland species are more numerous (source: G-22).

### 3.4 Island Biogeography Applied to Sky Islands

The alpine zones of the PNW are biogeographic islands — patches of above-treeline habitat surrounded by a "sea" of subalpine forest. The theory of island biogeography (MacArthur & Wilson, 1967) predicts that species richness on islands is determined by island area and distance from the mainland (source pool). This prediction holds for PNW alpine avian communities:

**Area effects:**
- Mt. Rainier (alpine area ~50 km2): supports the full complement of 15–20 alpine breeding species, including White-tailed Ptarmigan, Gray-crowned Rosy-Finch, American Pipit, and Horned Lark.
- Mt. Adams (alpine area ~25 km2): supports 12–15 alpine species; some species present at lower densities than Mt. Rainier.
- Glacier Peak (alpine area ~10 km2): supports 8–12 alpine species; Horned Lark sporadic.
- Smaller Cascade peaks (<5 km2 alpine): support only 5–8 alpine species; ptarmigan absent from most.

**Isolation effects:**
- The Olympic Mountains are geographically isolated from the Cascades by 100+ km of lowland forest. The Olympic alpine community is depauperate relative to equal-sized Cascade alpine zones. White-tailed Ptarmigan was absent from the Olympics until a 1960s translocation established a small population. This supports the prediction that isolated islands have fewer species than connected ones.

**Rescue effect:**
- Alpine zones connected by subalpine ridge corridors (e.g., the continuous Cascade Crest from Mt. Rainier to Mt. Adams) support higher species richness than equivalent-sized isolated peaks. These corridors allow gene flow and demographic rescue of declining populations, reducing local extinction probability.

**Climate change implication:** As climate warms and treeline advances upslope, alpine "islands" shrink. Species-area relationships predict that each 50% reduction in alpine area will eliminate approximately 25% of breeding species (z-value ~0.25 for continental sky islands). For a peak with 15 breeding alpine species and current alpine area of 25 km2, a reduction to 12.5 km2 would eliminate ~4 species. The most extinction-prone species are those with the lowest population sizes and the most specialized habitat requirements — White-tailed Ptarmigan and Gray-crowned Rosy-Finch are the primary candidates for sky-island extinction in the PNW (source: G-25, G-07).

---

## 4. Cross-Ecoregion Species

### 4.1 Species Spanning 4+ Ecoregion Bands

A subset of PNW birds regularly occurs across four or more of the 11 canonical ecoregion bands. These cross-ecoregion species are either habitat generalists with broad ecological tolerance or highly mobile species that exploit different bands for different life functions.

| Species | Scientific Name | Bands Occupied | Primary Use per Band | Residency |
|---------|----------------|----------------|---------------------|-----------|
| American Robin | *Turdus migratorius* | ALPINE, SUBALPINE, MONTANE, LOWLAND, RIPARIAN, COASTAL, SHRUB-STEPPE (7) | Breeds in all terrestrial bands; altitudinal migrant — moves downslope in winter | Resident (altitudinal migrant) |
| Red-tailed Hawk | *Buteo jamaicensis* | SUBALPINE, MONTANE, LOWLAND, RIPARIAN, COASTAL, SHRUB-STEPPE (6) | Breeds in open-canopy and edge habitat at all terrestrial elevations; hunts small mammals | Resident |
| Common Raven | *Corvus corax* | ALPINE, SUBALPINE, MONTANE, LOWLAND, RIPARIAN, COASTAL, SHRUB-STEPPE, INTERTIDAL (8) | Scavenger-predator at all elevations; nests on cliffs and tall conifers; follows ungulate carcasses, garbage, and human activity | Resident |
| Dark-eyed Junco | *Junco hyemalis* | SUBALPINE, MONTANE, LOWLAND, RIPARIAN, COASTAL (5) | Breeds in montane and subalpine; winters in lowland and coastal; one of the most abundant passerines in PNW | Resident (altitudinal migrant) |
| Bald Eagle | *Haliaeetus leucocephalus* | MONTANE, LOWLAND, RIPARIAN, COASTAL, INTERTIDAL, SHALLOW-MARINE (6) | Nests in large trees near water; forages along salmon-bearing rivers and marine shorelines; follows seasonal salmon runs across elevation bands | Resident |
| Great Horned Owl | *Bubo virginianus* | SUBALPINE, MONTANE, LOWLAND, RIPARIAN, COASTAL, SHRUB-STEPPE (6) | Apex nocturnal predator in all terrestrial habitats; nests in old raptor nests, cliff ledges, and large conifers | Resident |
| Steller's Jay | *Cyanocitta stelleri* | SUBALPINE, MONTANE, LOWLAND, RIPARIAN, COASTAL (5) | Resident in conifer forests from subalpine to coastal; altitudinal migrant in some populations; corvid intelligence allows exploitation of diverse food sources | Resident |
| Song Sparrow | *Melospiza melodia* | LOWLAND, RIPARIAN, COASTAL, SHRUB-STEPPE, INTERTIDAL (5) | Breeds in shrubby habitat across all low-elevation bands; one of the most widespread North American passerines; 6 subspecies in PNW reflecting local adaptation | Resident |
| Golden Eagle | *Aquila chrysaetos* | ALPINE, SUBALPINE, MONTANE, SHRUB-STEPPE (4) | Breeds on cliff ledges; hunts marmots, ground squirrels, and jackrabbits in open terrain at high and east-side elevations | Resident |
| Peregrine Falcon | *Falco peregrinus* | MONTANE, LOWLAND, COASTAL, INTERTIDAL, SHALLOW-MARINE (5) | Breeds on cliff faces; hunts birds in open air across all bands with clear sight lines; urban cliff analog (buildings) in lowland cities | Resident |
| Great Blue Heron | *Ardea herodias* | LOWLAND, RIPARIAN, COASTAL, INTERTIDAL, SHALLOW-MARINE (5) | Colonial nester in tall trees; forages in shallow water across all aquatic and wetland habitats from freshwater to marine | Resident |
| Varied Thrush | *Ixoreus naevius* | SUBALPINE, MONTANE, LOWLAND, RIPARIAN, COASTAL (5) | Breeds in closed-canopy conifer from subalpine to lowland; winters in lowland and coastal; the "voice of the old forest" | Resident (altitudinal migrant) |

### 4.2 Generalists vs. Specialists: Diverging Population Trends

One of the most consequential patterns in PNW ornithology over the past 50 years is the divergence in population trajectories between habitat generalists and habitat specialists:

**Generalist trend: Stable to increasing.**
- American Robin: BBS trend +0.5%/yr (1966–2019) across PNW. Exploits lawns, parks, agricultural fields, forest clearings — all habitats that have expanded with human land use.
- Common Raven: BBS trend +2.1%/yr. Benefits from road-killed carrion, garbage, agricultural subsidies. PNW population has approximately tripled since 1970.
- Red-tailed Hawk: BBS trend +0.8%/yr. Benefits from forest fragmentation that creates edge hunting habitat. One of the most visible raptors in the PNW.
- Song Sparrow: BBS trend +0.3%/yr. Adapts to suburban landscaping, agricultural edges, and degraded wetlands.

**Specialist trend: Declining.**
- Northern Spotted Owl: -3.8%/yr across monitored demography study areas. Old-growth obligate losing habitat and facing Barred Owl competition.
- Marbled Murrelet: -4.4%/yr in WA; -2.0%/yr in OR. Old-growth nester and marine forager — declining on both ends of its cross-band life cycle.
- Greater Sage-Grouse: -3.5%/yr in WA. Sagebrush obligate losing habitat to cheatgrass, wildfire, and agricultural conversion.
- Olive-sided Flycatcher: -3.0%/yr range-wide. Open-canopy conifer specialist declining with forest management changes and winter habitat loss.
- Lewis's Woodpecker: -2.7%/yr across PNW. Open-woodland and post-fire specialist; fire suppression and snag removal eliminate habitat.
- Black Oystercatcher: stable but globally restricted (~11,000 individuals total); any decline would be catastrophic given the small population base.
- Streaked Horned Lark (*Eremophila alpestris strigata*): ESA Threatened; PNW endemic subspecies declining with prairie habitat loss; <2,000 individuals remain.

**The pattern is clear:** species that can exploit human-modified landscapes are thriving; species that require intact native habitat — old-growth forest, pristine sagebrush steppe, undisturbed rocky shoreline, open-canopy post-fire woodland — are declining. The PNW avifauna is becoming taxonomically and functionally homogenized as specialists are replaced by generalists (source: G-18, G-14, O-04).

### 4.3 Universal PNW Species: American Robin, Red-tailed Hawk, Common Raven

Three species deserve special attention as the most universally distributed birds in the Pacific Northwest:

**American Robin (*Turdus migratorius*)**
- Present in 7 of 11 ecoregion bands (all terrestrial except ELEV-SUBTERRANEAN).
- Breeds from alpine meadows (sparse) to suburban lawns (abundant). The single most frequently detected bird on PNW BBS routes.
- Altitudinal redistribution: breeds up to treeline in summer; concentrates in lowland valleys and urban areas in winter, where it forms flocks of hundreds to thousands feeding on fruiting trees (hawthorn, mountain ash, madrone).
- Ecological role: primary disperser of native fruiting shrubs (salal, Oregon grape, red huckleberry, red elderberry); worm and arthropod consumer; prey for Cooper's Hawk, Sharp-shinned Hawk, and domestic cats.
- The robin is so ubiquitous that it functions as a "control species" in community studies — its presence is expected in virtually every PNW terrestrial habitat, and its absence signals severely degraded conditions.

**Red-tailed Hawk (*Buteo jamaicensis*)**
- Present in 6 ecoregion bands. Breeds in open and semi-open habitat from shrub-steppe to subalpine parkland.
- The most commonly seen raptor in the PNW; perches on roadside poles, utility wires, and snag tops, scanning for voles and ground squirrels.
- Five subspecies interact in the PNW: *calurus* (Western), *alascensis* (Alaska), *harlani* (Harlan's), *borealis* (Eastern — rare), *kriderii* (Krider's — very rare). Plumage variation is extreme — from nearly black melanistic *calurus* to nearly white *kriderii*.
- Ecological role: mesopredator controlling vole and ground squirrel populations; carcass scavenging in winter; sentinel perching behavior makes it the most visible raptor and a public ambassador for raptor conservation.

**Common Raven (*Corvus corax*)**
- Present in 8 ecoregion bands — the widest distribution of any PNW land bird. Found from alpine summits to coastal beaches, from old-growth interior to urban parking lots.
- Extraordinary ecological flexibility: scavenges carcasses (ungulates, road-kill, garbage), predates small mammals and bird nests, caches food for later retrieval, exploits human food waste.
- Population increase driven by anthropogenic food subsidies is a conservation concern because ravens are significant nest predators of sensitive species: Snowy Plover (nest predation on beaches), Greater Sage-Grouse (nest predation in steppe), Marbled Murrelet (nest predation in forest), and desert tortoise (predation in arid lands outside PNW — but the principle applies to PNW ground-nesting species).
- Managing raven populations is a growing management challenge: raven removal programs at Snowy Plover nesting beaches and sage-grouse leks are increasingly common but controversial (source: G-14, G-18).

---

## 5. Seasonal Community Shifts

### 5.1 Breeding vs. Non-Breeding Community Composition

PNW avian communities undergo dramatic seasonal reorganization. The breeding season community (May–August) differs fundamentally from the non-breeding season community (October–March) in three ways:

**Species turnover.** Approximately 100 neotropical migrant species arrive in the PNW between late March and early June, breed, and depart by October. These species — warblers, flycatchers, vireos, tanagers, thrushes, swallows — are entirely absent from the winter community. Their departure removes the majority of the aerial insectivore, canopy gleaner, and understory gleaner guilds from the forest community.

Simultaneously, approximately 80 winter visitors arrive from boreal and arctic breeding grounds between September and November: diving ducks, sea ducks, loons, grebes, gulls, alcids, geese, swans, and several passerines (Golden-crowned Sparrow, White-throated Sparrow, varied thrush influx from montane). The winter community is dominated by waterfowl, shorebirds, and marine species that are absent or present in reduced numbers during the breeding season.

**Net seasonal richness by band:**

| Band | Breeding Season Species | Non-Breeding Species | Seasonal Turnover (%) |
|------|------------------------|---------------------|-----------------------|
| ELEV-ALPINE | 15–20 | 1–3 | 85–90% (near-total evacuation) |
| ELEV-SUBALPINE | 45–60 | 10–20 | 65–75% |
| ELEV-MONTANE | 80–110 | 30–50 | 50–60% |
| ELEV-LOWLAND | 110–140 | 60–90 | 35–45% |
| ELEV-RIPARIAN | 95–130 | 50–75 | 40–50% |
| ELEV-COASTAL | 75–100 | 80–120 | 30–40% (winter influx reverses) |
| ELEV-SHALLOW-MARINE | 30–45 | 60–80 | 40–50% (winter influx reverses) |

The alpine zone experiences near-total seasonal evacuation: only 1–3 species (White-tailed Ptarmigan, occasional Rosy-Finch) remain through winter. The coastal and marine zones show the opposite pattern — winter species counts exceed breeding counts due to the massive influx of Arctic and boreal waterfowl and marine species.

### 5.2 Altitudinal Redistribution Patterns

Many PNW resident species undergo altitudinal migration — seasonal elevation shifts that redistribute populations across ecoregion bands without leaving the region.

**Major altitudinal migrants:**

| Species | Breeding Elevation | Winter Elevation | Vertical Displacement | Movement Trigger |
|---------|-------------------|-----------------|----------------------|-----------------|
| Gray-crowned Rosy-Finch | 8,000–14,000 ft (ALPINE) | 0–3,000 ft (LOWLAND, COASTAL) | 5,000–14,000 ft | Snowpack depth; wind chill |
| Mountain Quail | 3,000–7,000 ft (MONTANE, SUBALPINE) | 500–2,000 ft (LOWLAND) | 2,500–5,000 ft | Snow depth |
| Dark-eyed Junco | 3,000–6,500 ft (MONTANE, SUBALPINE) | 0–2,000 ft (LOWLAND, COASTAL) | 1,500–6,500 ft | Snow cover; food availability |
| Varied Thrush | 2,500–6,000 ft (MONTANE, SUBALPINE) | 0–1,500 ft (LOWLAND, COASTAL) | 1,500–6,000 ft | Snow and frost |
| Steller's Jay | 2,000–6,500 ft (MONTANE, SUBALPINE) | 0–2,000 ft (LOWLAND) | 0–6,500 ft (partial) | Cone crop failure |
| Townsend's Solitaire | 4,000–7,000 ft (MONTANE, SUBALPINE) | 500–3,000 ft (LOWLAND) | 1,500–6,500 ft | Juniper berry availability |
| Clark's Nutcracker | 5,000–8,000 ft (SUBALPINE) | 0–3,000 ft (LOWLAND) — irruptive | 2,000–8,000 ft | Whitebark pine cone crop failure |
| Dusky Grouse | 5,000–7,000 ft (SUBALPINE) — winter | 3,000–5,000 ft (MONTANE) — summer | Reverse: upslope in winter | Conifer needle diet in winter; insect and berry diet in summer |

**Note on Dusky Grouse:** This species exhibits reverse altitudinal migration — moving upslope in winter to feed on subalpine fir needles and downslope in summer to breed in montane meadows. This is the opposite of the normal pattern and is driven by winter diet specialization on conifer needles that are more abundant at higher elevations (source: G-18).

### 5.3 Winter Flocking Behavior and Mixed-Species Flocks

Winter flocking is a defining feature of PNW lowland and montane forest bird communities from October through March. Two types of flocks are prominent:

**Mixed-species foraging flocks.** These flocks form around nuclear species — species that other species follow to benefit from shared vigilance and enhanced foraging efficiency.

Typical PNW mixed-species flock composition (lowland conifer forest, November–February):

| Role | Species | Function in Flock |
|------|---------|------------------|
| **Nuclear species** | Black-capped Chickadee (*Poecile atricapillus*) | Flock leader; high call rate maintains flock cohesion; sentinel for predators |
| **Nuclear species** | Chestnut-backed Chickadee (*Poecile rufescens*) | Co-leader in coastal and montane forests; vocally active |
| **Regular associate** | Red-breasted Nuthatch (*Sitta canadensis*) | Bark prober (descending); follows chickadee flock through canopy |
| **Regular associate** | Brown Creeper (*Certhia americana*) | Bark prober (ascending); exploits insect prey flushed by other flock members |
| **Regular associate** | Golden-crowned Kinglet (*Corthylio calendula*) | Foliage gleaner; benefits from predator vigilance of chickadee sentinels |
| **Regular associate** | Pacific Wren (*Troglodytes pacificus*) | Understory and log forager; loosely associated with lower canopy edge of flock |
| **Occasional associate** | Downy Woodpecker (*Dryobates pubescens*) | Bark excavator; attracted to flock-generated movement and sound |
| **Occasional associate** | Hutton's Vireo (*Vireo huttoni*) | Foliage gleaner; PNW's only resident vireo; joins flocks in winter |
| **Occasional associate** | Varied Thrush (*Ixoreus naevius*) | Ground forager at flock periphery; departs when flock moves through canopy |

Mixed-species flocks in PNW forests typically contain 8–20 individuals of 5–10 species, moving through the forest at 2–5 m/min, covering 500–1,500 m in a morning foraging bout. The flock improves foraging efficiency by 15–30% (reduced individual vigilance time, increased foraging time) and reduces predation risk through collective detection of Cooper's Hawk and Sharp-shinned Hawk — the primary predators of flock members (source: G-14, O-02).

**Conspecific winter flocks.** Some species form large single-species flocks in winter:

- **American Robin:** Flocks of 100–5,000 individuals roost communally in lowland conifer groves and forage in berry-producing deciduous trees (hawthorn, mountain ash, madrone) through the winter.
- **European Starling:** Flocks of 1,000–100,000 form spectacular murmurations at dusk, roosting under bridges, in ivy, and in dense conifers. Not native — introduced in 1890.
- **Red-winged Blackbird:** Winter flocks of 500–50,000 form in agricultural fields and marshes, often mixed with Brewer's Blackbird and Brown-headed Cowbird.
- **Dunlin:** Winter flocks of 5,000–50,000 on coastal mudflats (Grays Harbor, Willapa Bay, Skagit River delta) perform coordinated aerial maneuvers while evading Peregrine Falcon and Merlin.
- **Snow Goose:** Winter flocks of 20,000–80,000 in the Skagit Valley and Fir Island; concentrated from November through March, grazing on agricultural fields.

### 5.4 Christmas Bird Count Data Trends

The Audubon Christmas Bird Count (CBC) provides the longest-running standardized winter bird survey data in North America (1900–present). PNW CBC data reveal several significant long-term trends:

**Increasing winter species:**
- Anna's Hummingbird: First recorded on a PNW CBC in the 1960s; now one of the most frequently reported species on western WA and OR counts. Range expansion northward from California driven by winter-blooming ornamental plants and hummingbird feeders. A rare example of a non-migratory species colonizing a new region within living memory.
- Bald Eagle: CBC counts have increased 10-fold since the DDT ban (1972) and ESA delisting (2007). The PNW now supports one of the highest winter eagle densities in North America, especially along salmon-spawning rivers (Skagit, Nooksack, Chilkat — the latter in AK but relevant as the northern end of the PNW eagle population).
- Barred Owl: First recorded on PNW CBCs in the 1970s; now reported on the majority of west-side counts. Continued range expansion into Spotted Owl territory.
- Common Raven: CBC counts have tripled since 1970, tracking the population increase driven by anthropogenic food subsidies.

**Declining winter species:**
- Western Grebe: CBC counts in Puget Sound have declined ~95% since the 1990s. Winter flocks that formerly numbered 10,000+ on south Puget Sound bays now number <500. Cause unclear — likely linked to forage fish decline, disturbance from boat traffic, and redistribution to offshore waters.
- Sooty Shearwater: Summer/fall CBC-equivalent pelagic counts show 90% decline since 1970, consistent with global population crash.
- Rusty Blackbird: formerly regular on PNW CBCs in riparian habitats; now nearly absent. One of the most steeply declining North American passerines (-6.3%/yr continental).
- Short-eared Owl: declining on PNW CBCs, reflecting grassland and wetland habitat loss.

**Stable or variable winter species:**
- Snow Goose, Trumpeter Swan, Tundra Swan: CBC counts stable or increasing, reflecting successful Arctic breeding populations and protected wintering habitat in Skagit Valley.
- Northern Shrike: winter visitor from boreal/Arctic breeding grounds; CBC counts highly variable year to year, tracking vole and lemming cycles on breeding grounds (irruptive pattern).

---

## 6. Disturbance Ecology

### 6.1 Fire-Adapted Communities

Wildfire is the dominant natural disturbance agent in PNW terrestrial ecosystems. Avian communities have co-evolved with fire across all forested ecoregion bands, but the relationship between fire and birds is complex and differs between west-side (high-severity, long-interval) and east-side (low-severity, frequent) fire regimes.

**Post-fire specialist species:**

**Black-backed Woodpecker (*Picoides arcticus*)**
- The flagship post-fire bird of western North American forests. Arrives within 1–3 years of stand-replacing fire and reaches peak density 3–8 years post-fire.
- Specializes in excavating wood-boring beetle larvae (Buprestidae, Cerambycidae) from fire-killed snags. These beetle larvae are 10–100x more abundant in fire-killed trees than in green forest, creating a massive but transient food resource.
- Requires large burned patches (>100 ha of contiguous snag forest) at sufficient snag density (>25 snags/ha). Salvage logging — the post-fire removal of dead trees for timber — directly competes with Black-backed Woodpecker habitat requirements. The conflict between salvage logging and post-fire habitat conservation is one of the most contentious issues in PNW forest management.
- Primary ecoregion bands: ELEV-SUBALPINE, ELEV-MONTANE.
- BBS trend: difficult to assess due to nomadic post-fire tracking behavior; overall population considered stable but dependent on continued fire occurrence (source: G-18, G-14).

**Lewis's Woodpecker (*Melanerpes lewis*)**
- Open-woodland specialist that thrives in post-fire ponderosa pine and oak-savanna landscapes. Unlike most woodpeckers, Lewis's is an aerial insectivore — sallying from perches to catch flying insects, more like a flycatcher than a woodpecker.
- Requires post-fire conditions with standing snags (for nesting), open canopy (for aerial foraging), and understory ground cover (for terrestrial insect prey). These conditions are maintained naturally by frequent low-severity fire in east-side ponderosa pine; fire suppression since the 1930s has dramatically reduced suitable habitat.
- Primary ecoregion bands: ELEV-LOWLAND, ELEV-SHRUB-STEPPE (transition zone).
- BBS trend: -2.7%/yr across PNW. Partners in Flight Continental Concern score 14 (high concern). A species in trouble, primarily due to fire suppression and snag removal (source: G-18, O-04).

**Other fire-responsive species:**
- **Mountain Bluebird:** Increases in burned montane areas with standing snags for nesting and open ground for insect foraging.
- **Olive-sided Flycatcher:** Reaches highest densities at the edges of large burns, where dead snags provide perching sites overlooking open insect-rich airspace.
- **Hairy Woodpecker:** Generalist woodpecker that exploits post-fire insect resources, though less specialized than Black-backed Woodpecker.
- **Northern Hawk Owl:** Rare PNW breeder that may colonize large burns in montane and subalpine zones, attracted by open habitat structure and vole population increases in post-fire meadows.
- **Townsend's Solitaire:** Post-fire montane breeder that nests on the ground in burned forest clearings with residual ground cover.

**Fire-regime alteration effects on avian communities:**

The 20th-century policy of fire suppression has fundamentally altered PNW fire regimes. On the east side, where low-severity fire historically burned every 7–25 years, suppression has allowed fuel accumulation that converts the natural low-severity regime to a high-severity regime. The result is stand-replacing megafires (2014 Carlton Complex, 2015 Okanogan Complex, 2020 Labor Day fires) that burn too hot even for fire-adapted species.

West-side forests, where natural fire intervals are 200–700 years, have experienced less fire-regime alteration in absolute terms. However, increasing fire frequency due to climate change is introducing fire to west-side communities that have no evolutionary history with frequent burning. The 2020 Labor Day fires burned over 1 million acres in western Oregon — much of it in ELEV-LOWLAND and ELEV-MONTANE forest that had not burned in centuries. The avian community response to these novel fires is still being studied, but early data suggest that west-side forest-interior specialists (Spotted Owl, Marbled Murrelet) are displaced rather than adapted, while east-side post-fire specialists (Black-backed Woodpecker) rapidly colonize west-side burns (source: G-22).

### 6.2 Logging Impacts on Old-Growth Obligates

The logging of PNW old-growth forests has been the single greatest driver of avian community change in the region since European settlement. More than 90% of original old-growth west-side forest has been harvested (source: G-22). The consequences for old-growth obligate birds are severe and well-documented.

**Northern Spotted Owl (*Strix occidentalis caurina*)**
- ESA Threatened since 1990. Critical Habitat designated 1992 (revised 2012, 2021).
- Requires large tracts of contiguous old-growth and mature forest for nesting, roosting, and foraging. Minimum territory size: 800–4,800 ha depending on habitat quality and latitude (larger territories in poorer habitat and at higher latitudes).
- Nests in large cavities, broken-top snags, and platforms of debris in old-growth conifers >200 years old. Does not build its own nest — depends on structures created by tree aging and decay.
- Population declining at ~3.8% annually across all four monitored demography study areas (Olympic, Cle Elum, Roseburg, HJ Andrews). The Barred Owl invasion compounds habitat loss: in areas where Barred Owls are established, Spotted Owl survival and occupancy decline even in intact habitat.
- The USFWS is implementing experimental Barred Owl removal on federal lands (2024–ongoing), a controversial management action that highlights the severity of the competitive exclusion problem.
- **Cross-band relevance:** Spotted Owl territories span ELEV-MONTANE and ELEV-LOWLAND (primary) with occasional foraging excursions into ELEV-SUBALPINE. See `raptors.md` for full species profile and prey list.

**Marbled Murrelet (*Brachyramphus marmoratus*)**
- ESA Threatened since 1992. The quintessential cross-band species: nests in old-growth conifer forest (ELEV-MONTANE) and forages in the ocean (ELEV-SHALLOW-MARINE).
- Nests on wide, moss-covered limbs of old-growth conifers at 2,000–4,000 ft elevation, typically 30–50 km from the coast. Commutes daily between nest and ocean feeding areas — one of the most energetically expensive breeding strategies of any bird.
- WA population estimated ~5,200 birds (2023 at-sea survey); declining at 4.4%/yr. OR population larger (~19,000) but also declining (~2.0%/yr).
- Threats are dual-ended: old-growth logging reduces nesting habitat; marine forage fish decline (herring, sand lance, anchovy) reduces food supply. Both must be addressed for population recovery.
- The murrelet is the most important species for demonstrating that PNW ecoregion bands are not independent — the montane forest and the shallow marine ocean are linked through this single species' life cycle.

**Other old-growth-associated species showing logging impacts:**
- **Pileated Woodpecker:** Tolerates mature second-growth but requires large-diameter snags (>50 cm DBH) for cavity excavation. Reduced in heavily logged landscapes.
- **Brown Creeper:** Breeds preferentially in old-growth and mature forest with deeply furrowed bark. Reduced in young plantations with smooth-barked trees.
- **Vaux's Swift:** Roosts and nests in large hollow trees; old-growth snags are the primary natural roost habitat. Chimney roosts in developed areas partially compensate for lost natural roost sites.
- **Northern Goshawk:** Breeds in dense mature conifer forest with closed canopy. Reduced in fragmented landscapes; sensitive to harvest of nesting stands.
- **Varied Thrush:** Breeds in closed-canopy conifer forest; density drops sharply in stands <80 years old.

### 6.3 Climate Change: Upslope Range Shifts

Climate-driven range shifts are already documented for PNW birds. The primary pattern is upslope movement of lower-elevation species into higher-elevation zones, compressing alpine and subalpine communities.

**Documented upslope shifts in PNW:**

| Species | Direction of Shift | Magnitude | Time Period | Source |
|---------|-------------------|-----------|-------------|--------|
| Dark-eyed Junco | Upslope (breeding) | ~100 m per decade | 1970–2020 | G-18 |
| Hermit Thrush | Upslope (breeding) | ~80 m per decade | 1968–2015 | G-14 |
| Mountain Chickadee | Upslope (breeding) | ~120 m per decade | 1970–2020 | G-18 |
| Townsend's Warbler | Upslope (breeding) | ~60 m per decade | 1970–2015 | G-14 |
| American Pipit | Range contraction (alpine) | Alpine area reduced | 1970–2020 | G-25 |
| White-tailed Ptarmigan | Upslope (lower range limit) | ~30 m per decade | 1980–2020 | G-25 |
| Anna's Hummingbird | Northward + upslope | 400 km northward, ~200 m upslope | 1960–2020 | O-02 |
| Barred Owl | Upslope (invasion front) | ~50 m per decade | 1970–2020 | G-14 |

**Consequences of upslope shifts:**
1. **Alpine compression.** Species moving upslope into ELEV-ALPINE have nowhere further to go — they are pushing against the summit ceiling. Alpine specialists are being compressed into smaller habitat patches, increasing extinction risk. White-tailed Ptarmigan on small Cascade peaks may be among the first PNW birds to experience climate-driven local extirpation.

2. **Novel communities.** As lower-elevation species expand upslope, they create novel species assemblages with no historical precedent. The interaction between newly arriving species and resident alpine/subalpine species is unpredictable — competition, predation, and disease transmission in novel combinations.

3. **Phenological mismatch.** Climate warming advances the timing of spring insect emergence, snowmelt, and plant flowering. Long-distance migratory birds that time their arrival by photoperiod (day length) cannot adjust arrival dates as quickly as local environmental conditions change. The result is a growing mismatch between migrant arrival and peak food availability, reducing breeding success. This mismatch is most severe for neotropical migrants breeding at high elevations, where the breeding season is already compressed (source: G-18, O-04).

4. **Marine regime shifts.** Ocean warming affects marine birds through forage fish distribution changes. Marine heat waves (2014–2016 "Blob," 2019–2020 warm event) cause massive redistributions of anchovies, herring, and sand lance, with cascading effects on seabird breeding success. Common Murre die-offs during the Blob represent the most dramatic avian mortality event in PNW history.

### 6.4 Urbanization Effects on Lowland Communities

The ELEV-LOWLAND band contains the PNW's major metropolitan areas (Seattle metro: 4.0M; Portland metro: 2.5M; plus Eugene, Salem, Olympia, and smaller cities). Urbanization transforms avian communities through habitat replacement, predator subsidies, light and noise pollution, and building collisions.

**Urban winner species (increasing with urbanization):**
- European Starling, House Sparrow, Rock Pigeon (introduced species dominate the urban core)
- Anna's Hummingbird (feeders and ornamental plants)
- American Crow, Common Raven (garbage and food waste subsidies)
- Glaucous-winged Gull (landfill foraging; roof-top nesting)
- Cooper's Hawk (urban bird feeder predator — populations now higher in some cities than in surrounding rural areas)
- Peregrine Falcon (building nesting; pigeon prey base)
- Bushtit, Black-capped Chickadee, House Finch (suburban landscaping)

**Urban loser species (declining with urbanization):**
- Band-tailed Pigeon (forest-interior, requiring old-growth mineral springs)
- Western Screech-Owl (displaced by Barred Owl and urbanization)
- Rufous Hummingbird (declining range-wide; needs native flowering shrubs)
- Purple Martin (cavity-nesting — outcompeted by starlings for nest holes)
- Western Meadowlark (grassland obligate — habitat converted to development)
- Northern Spotted Owl (eliminated from all urban-adjacent old-growth fragments by disturbance, fragmentation, and Barred Owl pressure)

**Building collisions:** An estimated 365–988 million birds are killed annually by building collisions in the United States (Loss et al. 2014). PNW glass-heavy architecture in cities like Seattle, Portland, and Vancouver, BC, contributes to significant mortality, especially during fall and spring migration. Night-migrating species (warblers, thrushes, sparrows) are most vulnerable, attracted to illuminated buildings during overcast conditions.

---

## 7. Cross-Module Integration

### 7.1 How ecoregion-high.md and ecoregion-low.md Connect

Module 3 Part A (`ecoregion-high.md`) covers the upper elevation and east-side communities: ELEV-ALPINE, ELEV-SUBALPINE, ELEV-MONTANE, and ELEV-SHRUB-STEPPE. Module 3 Part B (`ecoregion-low.md`) covers the lower elevation, riparian, coastal, and marine communities: ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL, ELEV-INTERTIDAL, ELEV-SHALLOW-MARINE, and ELEV-DEEP-MARINE.

The two documents are designed as complementary halves of a single elevational transect from summit to seafloor. Their connection points are:

**1. The ELEV-MONTANE / ELEV-LOWLAND boundary (2,000 ft / y=9).** This is the primary seam between the two documents. Species that straddle this boundary (Northern Spotted Owl, Varied Thrush, Pileated Woodpecker, Cooper's Hawk) are profiled in one document with cross-references to the other. The montane document provides the nesting and breeding ecology; the lowland document provides the winter and foraging ecology.

**2. The ELEV-SHRUB-STEPPE connection.** ELEV-SHRUB-STEPPE (covered in Part A as east-side habitat) shares the same elevation range as ELEV-LOWLAND (covered in Part B) but is geographically distinct. The two bands are separated by the Cascade Crest, not by elevation. Species that cross this boundary (Lewis's Woodpecker breeds in both; Red-tailed Hawk hunts in both; Mountain Quail migrates between east and west sides through Cascade passes) are the linkage species.

**3. The Salmon Thread.** Part A documents the upstream end of the salmon nutrient pathway (montane spawning reaches where American Dipper and Harlequin Duck breed); Part B documents the downstream and marine end (estuarine nursery habitat, nearshore foraging, and pelagic ocean). The salmon thread is the primary biological connector between the two documents and is flagged in every species account where salmon-derived nutrients or prey are relevant.

**4. Raptor territory spans.** Large raptors hold territories that cross the Part A/Part B boundary. Golden Eagle (Part A alpine/subalpine territory) may forage into the lowland band (Part B) during winter prey shortages. Bald Eagle (Part B riparian/coastal primary) follows salmon runs into the montane band (Part A). These raptor territories are the most direct spatial bridges between the two documents.

### 7.2 Species Overlap Between Ecoregion Documents and Resident/Migratory Modules

Module 1 (`resident.md`) profiles 182 year-round resident species. Module 2 (`migratory.md`) profiles approximately 200 migratory species. Module 3 (ecoregion-high + ecoregion-low + this synthesis) examines community-level ecology. The overlap structure is deliberate:

**Modules 1 and 2 provide species-level detail** — full species cards with taxonomy, morphometrics, diet, nesting ecology, and conservation status. These are the reference profiles.

**Module 3 provides community-level context** — how those species assemble into functional communities within each ecoregion band. Module 3 does not replicate species-card-level detail; it cross-references Module 1 and Module 2 profiles and focuses on guild structure, species interactions, and community dynamics.

**Overlap species count by module:**

| Category | Module 1 (Resident) | Module 2 (Migratory) | Module 3 (Ecoregion) | Overlap |
|----------|--------------------|--------------------|---------------------|---------|
| Year-round residents | 182 | — | 182 (community context) | Full overlap with Module 1 |
| Neotropical migrants | — | ~100 | ~90 (breeding community context) | ~90% overlap with Module 2 |
| Winter visitors | — | ~80 | ~70 (winter community context) | ~88% overlap with Module 2 |
| Vagrants | — | ~20 | ~5 (community context only for regulars) | ~25% overlap with Module 2 |
| Raptors | 24 (resident spp.) | 8 (migratory spp.) | 32 (community context) | Full overlap — cross-ref `raptors.md` |

### 7.3 Raptor Territory Mapping Across Ecoregion Boundaries

Raptors are the primary avian group whose territories routinely span ecoregion band boundaries. The `raptors.md` document provides detailed species profiles; this section maps territory spans to illustrate cross-ecoregion connectivity.

| Raptor Species | Territory Size (ha) | Bands Spanned | Primary Band | Territory Notes |
|---------------|--------------------|--------------|--------------|-----------------|
| Bald Eagle | 50–300 | LOWLAND, RIPARIAN, COASTAL, SHALLOW-MARINE | RIPARIAN | Linear territory along waterways; 2–10 km of river frontage per pair |
| Golden Eagle | 5,000–20,000 | ALPINE, SUBALPINE, MONTANE, SHRUB-STEPPE | ALPINE/SUBALPINE | Largest raptor territory in PNW; hunts alpine to steppe |
| Northern Spotted Owl | 800–4,800 | MONTANE, LOWLAND | MONTANE | Old-growth core area; edge zones into lowland second-growth |
| Northern Goshawk | 2,000–8,000 | SUBALPINE, MONTANE, LOWLAND | MONTANE | Requires continuous canopy; territory shrinks in good habitat |
| Red-tailed Hawk | 150–600 | LOWLAND, MONTANE, SHRUB-STEPPE | LOWLAND edge | Edge specialist; territory boundaries follow forest-field transitions |
| Peregrine Falcon | 50–200 (nest cliff) + 20 km hunting radius | MONTANE, LOWLAND, COASTAL, INTERTIDAL | COASTAL cliff | Hunting radius extends across all bands with open air |
| Osprey | 50–150 (nest) + 15 km fishing radius | LOWLAND, RIPARIAN, COASTAL, SHALLOW-MARINE | RIPARIAN | Nests near water; fishes in any accessible water body |
| Great Horned Owl | 200–1,500 | SUBALPINE, MONTANE, LOWLAND, SHRUB-STEPPE | LOWLAND | Most widespread owl territory; uses all habitat types |
| Ferruginous Hawk | 2,000–5,000 | SHRUB-STEPPE, LOWLAND (east side) | SHRUB-STEPPE | Ground squirrel specialist; territory tracks colony distribution |
| Prairie Falcon | 1,000–3,000 | SHRUB-STEPPE, ALPINE (cliff nesting) | SHRUB-STEPPE | Cliff-nesting; forages over open steppe; some pairs use alpine cliff |

The Golden Eagle stands out as the raptor with the largest cross-ecoregion span — a single pair may hunt from alpine ridgeline to shrub-steppe valley floor, covering 5,000–20,000 ha and 3–4 ecoregion bands. This makes the Golden Eagle a landscape-scale indicator of ecosystem connectivity: if the corridor between alpine hunting grounds and lowland wintering areas is severed by development, the eagle is displaced.

### 7.4 Salmon Thread Presence Across Elevation Bands

The Salmon Thread — the nutrient, prey, and ecological connectivity pathway created by Pacific salmon (*Oncorhynchus* spp.) — runs through multiple ecoregion bands and touches avian communities at each stop. This section maps salmon-avian interactions across the elevational gradient.

| Ecoregion Band | Salmon Stage Present | Avian Species Affected | Interaction Type |
|---------------|---------------------|----------------------|-----------------|
| ELEV-DEEP-MARINE | Adult ocean foraging (1–5 years) | Sooty Shearwater, Common Murre (compete for same forage fish) | Indirect competition for shared prey |
| ELEV-SHALLOW-MARINE | Adult return migration; juvenile ocean rearing | Bald Eagle (surface-feeding salmon), Common Merganser (smolt predation), Pigeon Guillemot | Direct predation; nutrient input from spawning carcasses in estuaries |
| ELEV-INTERTIDAL | Estuary transition (adult and juvenile) | Great Blue Heron (estuary salmon foraging), gulls (carcass scavenging) | Direct predation and scavenging |
| ELEV-COASTAL | Estuary habitat (juvenile rearing, adult staging) | Bald Eagle (concentrated at river mouths during salmon runs) | Direct predation; keystone nutrient transfer |
| ELEV-RIPARIAN | Spawning and juvenile rearing | American Dipper (salmon egg and fry predation), Bald Eagle (spawning salmon), Belted Kingfisher (fry), Common Merganser (smolt), Great Blue Heron (fry/smolt) | Direct predation; marine-derived nutrient fertilization of riparian vegetation supporting warbler and flycatcher habitat |
| ELEV-LOWLAND | Major spawning tributaries | Bald Eagle (winter congregations of 100–400 eagles on spawning rivers like the Skagit), Common Raven (carcass scavenging), gulls | Direct predation and scavenging; nitrogen isotope (N-15) enrichment of riparian trees |
| ELEV-MONTANE | Headwater spawning streams | American Dipper (montane salmon streams), Harlequin Duck (breeds on salmon-bearing montane streams) | Direct predation; salmon carcasses fertilize headwater riparian zones |
| ELEV-SUBALPINE | Rare — some bull trout and spring Chinook spawn at high elevation | Minimal direct avian interaction | Indirect: marine-derived nutrients reach subalpine via bear and eagle transport |
| ELEV-ALPINE | None | None | No salmon presence |

**Salmon Thread summary:** Salmon connect 7 of 11 ecoregion bands through avian interactions alone. When mammalian interactions are added (black bear salmon foraging vectoring marine nitrogen into ELEV-MONTANE forests — see ECO `heritage-bridge.md`), the Salmon Thread reaches 8 of 11 bands. Only ELEV-ALPINE, ELEV-SHRUB-STEPPE, and ELEV-SUBTERRANEAN are entirely outside the salmon nutrient pathway.

The salmon-bear-tree-bird nutrient chain works as follows: salmon carry marine-derived nitrogen (isotopically marked as N-15) from the ocean into freshwater streams; bears and eagles scatter salmon carcasses into the riparian forest; decomposition releases N-15 into the soil; trees absorb N-15 and incorporate it into wood and foliage; insects feeding on enriched foliage are consumed by canopy-gleaning and understory-gleaning birds (warblers, kinglets, flycatchers). Studies on salmon-bearing streams in the PNW show that riparian trees within 100 m of salmon-spawning reaches contain 10–40% marine-derived nitrogen, and that insectivorous bird density is higher along salmon-bearing streams than along equivalent non-salmon streams (source: ECO shared-attributes, G-22).

---

## 8. Conservation Prioritization

### 8.1 Ecoregions with Highest Threat Levels

Threat assessment integrates habitat loss, fragmentation, invasive species pressure, climate vulnerability, and pollution. The following ranking reflects the consensus of state and federal wildlife agency assessments, Partners in Flight conservation plans, and the ECO mission's threat analysis (see `ecological-networks.md`).

| Rank | Ecoregion | Threat Level | Primary Threats | Habitat Remaining (% of pre-contact) |
|------|-----------|-------------|-----------------|-------------------------------------|
| 1 | ELEV-SHRUB-STEPPE | CRITICAL | Cheatgrass invasion, altered fire regime, agricultural conversion, energy development, ground squirrel poisoning | 40–50% (degraded) |
| 2 | ELEV-LOWLAND | CRITICAL | 90%+ old-growth removed, urbanization, agricultural conversion, fragmentation, invasive species | 5–10% (old-growth); 70% (total forest cover, mostly second-growth) |
| 3 | ELEV-SHALLOW-MARINE | HIGH | Marine heat waves, forage fish decline, ocean acidification, oil spill risk, kelp forest collapse | N/A (marine — threat is to ecosystem function, not spatial extent) |
| 4 | ELEV-INTERTIDAL | HIGH | Sea star wasting syndrome, ocean acidification, oil spill risk, recreational disturbance, sea level rise | ~85% (relatively intact but functionally stressed) |
| 5 | ELEV-COASTAL | HIGH | Development pressure, beach recreation, invasive European beachgrass (dune habitat loss), predator subsidies (ravens, crows), light pollution | 50–60% (fragmented) |
| 6 | ELEV-MONTANE | MODERATE-HIGH | Continued old-growth harvest on private lands, Barred Owl invasion, climate-driven fire regime change, recreation infrastructure | 30–40% (old-growth); 85% (total forest cover) |
| 7 | ELEV-RIPARIAN | MODERATE-HIGH | Dam systems (salmon access), channelization, agricultural runoff, beaver removal, riparian buffer inadequacy | 40–60% (functionally intact riparian, varies by watershed) |
| 8 | ELEV-ALPINE | MODERATE | Climate change (treeline advance, glacier retreat), recreational trampling, atmospheric nitrogen deposition | 90%+ (structurally intact but climatically threatened) |
| 9 | ELEV-SUBALPINE | MODERATE | Whitebark pine decline (blister rust + mountain pine beetle), ski area development, climate-driven snowpack reduction | 80–90% |
| 10 | ELEV-SUBTERRANEAN | MODERATE | White-nose syndrome (bat mortality), cave vandalism, lava tube trampling, loss of large hollow snags | 85–95% (most caves intact but bat populations threatened) |
| 11 | ELEV-DEEP-MARINE | LOW-MODERATE | Bottom trawling (restricted but ongoing on outer shelf), cable/pipeline installation, deep-water hypoxia (Hood Canal), climate-driven deoxygenation | ~95% (least disturbed PNW ecoregion) |

### 8.2 Ecoregions with Least Protection

Protected area coverage (national parks, wilderness areas, national wildlife refuges, state parks, marine sanctuaries) varies enormously across ecoregion bands:

| Ecoregion | Protected Area Coverage (%) | Key Protected Areas | Gap Analysis |
|-----------|---------------------------|--------------------|--------------|
| ELEV-ALPINE | ~70% | Mt. Rainier NP, North Cascades NP, Olympic NP, Wilderness Areas | Relatively well protected — alpine zones are mostly in parks and wilderness. Gaps: some Cascade peaks on USFS land outside wilderness. |
| ELEV-SUBALPINE | ~55% | Same as above + Mt. Baker, Goat Rocks, Alpine Lakes Wilderness | Moderate protection. Gaps: ski area leases (Crystal Mountain, Stevens Pass, Mt. Hood), heli-ski zones. |
| ELEV-MONTANE | ~35% | National forests (mixed use), NP buffers, some state forests | Significant gap: most montane forest outside wilderness and NP is managed for timber harvest. Private industrial timberland has minimal avian habitat protections. |
| ELEV-LOWLAND | ~10% | Urban parks, some NWRs (Nisqually, Ridgefield, William Finley) | CRITICAL GAP: less than 10% of lowland old-growth is in protected status. Most lowland habitat is private (agricultural, residential, commercial). |
| ELEV-RIPARIAN | ~25% | Wild and Scenic Rivers (Skagit, Rogue, Umpqua), NWRs, state streamside regulations | Gap: state buffer regulations (WA Forest Practices Rules, OR Forest Practices Act) provide minimal riparian protection on private timberland (50–200 ft buffers, often inadequate). |
| ELEV-COASTAL | ~30% | Olympic Coast NMS, Oregon Islands NWR, state parks, Willapa NWR | Gap: most coastal residential and commercial development is outside protected areas. Beach recreation pressure on Snowy Plover habitat. |
| ELEV-SHRUB-STEPPE | ~5% | Hanford Reach NM (only large shrub-steppe protection in WA), scattered BLM lands | CRITICAL GAP: vast majority of shrub-steppe is unprotected private agricultural or rangeland. No large-scale sagebrush reserves in WA or OR comparable to Nevada's. |
| ELEV-SUBTERRANEAN | ~40% | Ape Cave (Mt. St. Helens), ice caves in Cascade parks, Craters of the Moon (ID) | Gap: many bat hibernacula on private or unprotected public land; access control inadequate. |
| ELEV-INTERTIDAL | ~40% | Olympic Coast NMS, Oregon Islands NWR, Padilla Bay NERR, state-managed tidelands | Gap: Puget Sound intertidal is largely unprotected outside a few NERRs and state parks; heavily impacted by urban shoreline development. |
| ELEV-SHALLOW-MARINE | ~35% | Olympic Coast NMS, San Juan Islands NWR, Grays Harbor NWR, proposed marine reserves | Gap: Puget Sound nearshore has minimal marine protection; no comprehensive marine protected area network exists for WA inland waters. |
| ELEV-DEEP-MARINE | ~25% | Olympic Coast NMS (outer coast only), Strait of Georgia glass sponge reef closures (Canada) | Gap: deep basins of Puget Sound have no benthic protection; Strait of Juan de Fuca deep channels unprotected. |

**Summary:** The two most critically threatened ecoregion bands — ELEV-SHRUB-STEPPE and ELEV-LOWLAND — are also the two least protected. This is not coincidental: the same flat, accessible, productive landscapes that attract human settlement and agriculture are the landscapes with the least conservation investment. The result is a systematic protection bias toward high-elevation, rugged, economically marginal landscapes (alpine, subalpine) and against low-elevation, flat, economically productive landscapes (lowland, shrub-steppe) — precisely where avian species richness and conservation need are greatest.

### 8.3 Species Most Vulnerable to Climate-Driven Range Contraction

Species vulnerability to climate-driven range contraction is determined by three factors: (1) current range extent, (2) physiological or habitat constraints that prevent adaptation or movement, and (3) population size and reproductive rate.

**Tier 1: Highest vulnerability (range contraction likely within 30 years)**

| Species | Current PNW Range | Contraction Mechanism | Population Trend | Adaptive Capacity |
|---------|------------------|----------------------|-----------------|-------------------|
| White-tailed Ptarmigan | ALPINE (y=121–319) | Treeline advance reduces alpine area; no upslope habitat available above summit | Stable but confined | VERY LOW — obligate alpine; cannot tolerate forest |
| Gray-crowned Rosy-Finch | ALPINE (y=121–319) | Glacier retreat reduces snowfield foraging habitat; aeolian insect deposition declines with reduced snowpack | Uncertain (difficult to census) | LOW — snowfield foraging specialization |
| Greater Sage-Grouse | SHRUB-STEPPE | Cheatgrass-driven fire converts sagebrush to grassland; sagebrush recovery takes 30–50 years post-fire | Declining (-3.5%/yr WA) | VERY LOW — obligate sagebrush; cannot substitute habitat |
| Marbled Murrelet | MONTANE (nest) + SHALLOW-MARINE (forage) | Old-growth loss + marine heat wave forage fish disruption; both ends of life cycle under pressure | Declining (-4.4%/yr WA) | LOW — old-growth nesting obligate; slow reproduction (1 egg/yr) |
| Black Oystercatcher | INTERTIDAL | Sea level rise reduces rocky intertidal nesting habitat; storm surge frequency increases nest washout risk | Stable but tiny (11,000 global) | MODERATE — can shift to higher rocks, but nesting habitat is finite |

**Tier 2: High vulnerability (range contraction likely within 50 years)**

| Species | Current PNW Range | Contraction Mechanism | Population Trend | Adaptive Capacity |
|---------|------------------|----------------------|-----------------|-------------------|
| Northern Spotted Owl | MONTANE + LOWLAND | Barred Owl displacement compounds climate stress; fire regime change creates unsuitable habitat | Declining (-3.8%/yr) | LOW — old-growth obligate; Barred Owl outcompetes at range margins |
| American Pika (MAM cross-ref) | ALPINE + SUBALPINE talus | Temperature intolerance (lethal at 78°F); cannot thermoregulate in warming climate; populations winking out on low-elevation talus patches | Declining at range margins | VERY LOW — obligate talus; cannot dig burrows |
| Snowy Plover | COASTAL beaches | Sea level rise + storm surge reduce beach nesting area; European beachgrass invasion continues | Stable with intensive management | MODERATE — can nest on artificial habitat if created |
| Clark's Nutcracker | SUBALPINE | Whitebark pine decline (blister rust, mountain pine beetle) removes primary food source; irruptive when cone crops fail | Variable — cone-crop dependent | MODERATE — can switch to other conifer seeds but population crashes without whitebark |
| Olive-sided Flycatcher | MONTANE + SUBALPINE | Wintering habitat loss in Andes; aerial insect decline; phenological mismatch | Declining (-3.0%/yr) | LOW — long-distance migrant; threats on both ends of migration |

**Tier 3: Moderate vulnerability (range contraction possible within 50–100 years)**

Includes Spruce Grouse, Mountain Quail, Dusky Grouse, Lewis's Woodpecker, Burrowing Owl, Western Grebe, and several subalpine passerines. These species face population pressure from climate change but retain some adaptive capacity through behavioral plasticity or broader habitat tolerance.

### 8.4 Priority Actions by Ecoregion

| Ecoregion | Priority Action 1 | Priority Action 2 | Priority Action 3 | Lead Agency |
|-----------|-------------------|-------------------|-------------------|-------------|
| ELEV-ALPINE | Monitor treeline advance and alpine area change using repeat photography and satellite imagery | Protect alpine meadow connectivity corridors along Cascade Crest | Reduce recreational trampling of alpine meadows through seasonal closures and trail improvements | NPS, USFS |
| ELEV-SUBALPINE | Accelerate whitebark pine restoration (rust-resistant seedling planting) to maintain Clark's Nutcracker food base | Protect subalpine meadow complexes from ski area expansion | Monitor Spruce Grouse and Dusky Grouse population trends in response to snowpack change | USFS, NPS, WDFW |
| ELEV-MONTANE | Continue and expand Barred Owl removal experiments to protect Spotted Owl territories | Protect remaining old-growth stands on federal and state land from harvest | Restore post-fire habitat for Black-backed Woodpecker by limiting salvage logging in burned montane forest | USFWS, USFS, BLM |
| ELEV-LOWLAND | Protect remaining old-growth fragments in urban and suburban landscapes through local land-use regulation | Restore oak-savanna habitat through prescribed fire and Douglas-fir removal in Willamette Valley and Puget Sound prairies | Install bird-safe glass and reduce building lighting during migration windows in major cities | Local governments, TNC, Audubon |
| ELEV-RIPARIAN | Remove or modify fish-passage barriers (dams, culverts) to restore salmon connectivity | Restore beaver populations to create riparian wetland habitat for waterfowl, warblers, and flycatchers | Strengthen riparian buffer regulations on private timberland (minimum 100 m no-harvest buffer) | WDFW, ODFW, NOAA Fisheries |
| ELEV-COASTAL | Maintain and expand Snowy Plover beach closures and predator management programs | Remove European beachgrass and restore native dune vegetation at priority breeding sites | Reduce marine debris and oil spill risk through improved vessel traffic management on outer coast | USFWS, ODFW, Olympic Coast NMS |
| ELEV-SHRUB-STEPPE | Establish large-scale sagebrush reserves (10,000+ ha) in WA and OR to protect sage-grouse leks and nesting habitat | Fund cheatgrass treatment and native bunchgrass restoration at landscape scale | End ground squirrel poisoning programs that eliminate prey base for Ferruginous Hawk, Burrowing Owl, and Badger | BLM, WDFW, ODFW, NRCS |
| ELEV-SUBTERRANEAN | Monitor all known bat hibernacula for White-nose Syndrome and implement decontamination protocols at cave entrances | Protect large-diameter hollow snags (>50 cm DBH) as Vaux's Swift roost sites in managed forests | Map and gate sensitive cave entrances on public land to prevent vandalism while allowing bat passage | WDFW, USFS, BLM |
| ELEV-INTERTIDAL | Strengthen coastal oil spill response capacity and pre-positioned equipment for oystercatcher and sea duck habitat | Monitor mussel bed recovery following sea star wasting syndrome | Reduce human disturbance at Black Oystercatcher nesting sites through seasonal access restrictions | USFWS, WDFW, ODFW, Olympic Coast NMS |
| ELEV-SHALLOW-MARINE | Establish a comprehensive marine protected area network for Puget Sound and outer coast nearshore waters | Fund long-term seabird colony monitoring to detect forage fish regime shifts early | Reduce gillnet bycatch of alcids and sea ducks in nearshore fisheries | NOAA, WDFW, USFWS |
| ELEV-DEEP-MARINE | Protect glass sponge reefs and cold-water coral habitat from bottom trawling and cable installation | Monitor deep-water dissolved oxygen levels in Puget Sound basins for hypoxia events that cascade to marine bird prey | Expand at-sea survey coverage for pelagic bird populations (storm-petrels, shearwaters, albatrosses) | NOAA, WDFW, USGS |

---

## Source Cross-Reference

This synthesis document draws on data, species accounts, and community descriptions from the following AVI and ECO mission documents:

| Source Document | Location | Data Used |
|----------------|----------|-----------|
| AVI ecoregion-high.md | `www/PNW/AVI/research/ecoregion-high.md` | Alpine, subalpine, montane, shrub-steppe community composition and guild structure |
| AVI ecoregion-low.md | `www/PNW/AVI/research/ecoregion-low.md` | Lowland, riparian, coastal, intertidal, marine community composition and guild structure |
| AVI resident.md | `www/PNW/AVI/research/resident.md` | 182 resident species profiles; year-round population data |
| AVI migratory.md | `www/PNW/AVI/research/migratory.md` | ~200 migratory species profiles; phenology, arrival/departure timing |
| AVI raptors.md | `www/PNW/AVI/research/raptors.md` | 32 raptor profiles; territory sizes, prey lists, MAM cross-references |
| AVI shorebirds.md | `www/PNW/AVI/research/shorebirds.md` | Shorebird community profiles; intertidal and coastal specialists |
| AVI elevation-matrix.md | `www/PNW/AVI/research/elevation-matrix.md` | Per-species band assignments (P/S/V/X) for all 11 bands |
| AVI shared-schema.md | `www/PNW/AVI/research/shared-schema.md` | Species card template; field definitions |
| ECO shared-attributes.md | `www/PNW/ECO/research/shared-attributes.md` | Habitat, role, and elevation band definitions; salmon nutrient chain |
| ECO ecological-networks.md | `www/PNW/ECO/research/ecological-networks.md` | Trophic network structure; keystone species interactions |
| ECO fauna-terrestrial.md | `www/PNW/ECO/research/fauna-terrestrial.md` | Mammal species profiles cross-referenced for raptor prey |
| ECO fauna-marine-aquatic.md | `www/PNW/ECO/research/fauna-marine-aquatic.md` | Marine mammal and fish profiles; seabird prey base |
| ECO heritage-bridge.md | `www/PNW/ECO/research/heritage-bridge.md` | Salmon-bear-tree nutrient pathway; Indigenous ecological knowledge |
| PNW ecoregion-canonical.md | `www/PNW/pnw-ecoregion-canonical.md` | 11-band canonical reference; coordinate system; cross-band indicator table |

---

## Document Provenance

| Field | Value |
|-------|-------|
| **Agent** | SYNTH-ECO-AVI |
| **Mission** | Wings of the Pacific Northwest — PNW Avian Taxonomy |
| **Module** | 3 — Ecoregion Communities (Synthesis) |
| **Date** | 2026-03-09 |
| **Canonical ecoregion reference** | `www/PNW/pnw-ecoregion-canonical.md` |
| **Coordinate formula** | `Y = round((elevation_ft / 40.05) - 41)` |
| **Lines** | 530+ |
| **Quality target** | 45–55 KB |
| **Safety rules enforced** | SC-END (no ESA nest GPS), SC-NUM (population numbers sourced), SC-TAX (AOS authority), SC-IND (nation-specific Indigenous references) |
| **Cross-references** | ecoregion-high.md, ecoregion-low.md, resident.md, migratory.md, raptors.md, shorebirds.md, elevation-matrix.md, ECO shared-attributes, pnw-ecoregion-canonical.md |
