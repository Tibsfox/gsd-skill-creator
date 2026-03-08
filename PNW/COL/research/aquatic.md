# Aquatic Analysis: Salmon as Keystone Connector

> **Module 04 of PNW Rainforest Biodiversity research (v1.49.22)**
>
> This module documents Pacific salmon as the primary vector for marine-derived nutrients entering terrestrial ecosystems. It traces the N-15 isotope pathway from ocean through salmon to bear-mediated forest deposition, compiles a comprehensive fish species inventory, and maps the salmon-wildlife dependency web.
>
> All species entries use the shared species template from [00-shared-schemas.md](./00-shared-schemas.md).
> All data attributed via `source_id` references from the shared Source Index.

---

## Section 1: The Salmon-Forest Nitrogen Pathway (AQUA-01)

The marine-derived nitrogen pathway is the single most important nutrient subsidy connecting ocean and forest ecosystems in the Pacific Northwest. Nitrogen-15 (N-15), a stable isotope enriched in marine environments relative to terrestrial sources, serves as a natural tracer. Because the ocean N-15/N-14 ratio is distinct from terrestrial nitrogen signatures, researchers can track marine-origin nitrogen as it moves from salmon carcasses into soil, plants, invertebrates, and wildlife -- quantifying the flow at each stage.

### Step 1: Ocean Accumulation

Pacific salmon (*Oncorhynchus* spp.) spend 1-5 years feeding in the North Pacific Ocean, accumulating marine-derived nitrogen, phosphorus, and carbon in their body tissues. During this ocean residency, salmon biomass becomes enriched in N-15 relative to terrestrial nitrogen sources. The marine N-15 signature is isotopically distinct (delta-N-15 values of +10 to +14 per mil in salmon tissue versus +0 to +3 per mil in terrestrial soil nitrogen), making it a reliable tracer of marine-origin nutrients once transported to freshwater and terrestrial systems. (Source: PR-02, GOV-01)

Six Pacific salmon species carry this marine nutrient load:

| Common Name | Scientific Name | Ocean Residency | Body Mass Range (adult) |
|-------------|----------------|-----------------|------------------------|
| Chinook salmon | *Oncorhynchus tshawytscha* | 2-5 years | 10-25 kg (up to 60 kg) |
| Coho salmon | *Oncorhynchus kisutch* | 1-2 years | 3-6 kg |
| Sockeye salmon | *Oncorhynchus nerka* | 1-3 years | 2-4 kg |
| Chum salmon | *Oncorhynchus keta* | 2-5 years | 4-10 kg |
| Pink salmon | *Oncorhynchus gorbuscha* | 1.5 years (fixed) | 1.5-3 kg |
| Steelhead | *Oncorhynchus mykiss* | 1-3 years | 3-12 kg |

> **Isotope note:** The enriched N-15 signature persists through every subsequent step of the pathway, allowing researchers to quantify marine-origin nitrogen in any organism or substrate that receives it. This is the foundation of all quantitative claims in this section. (Source: PR-02)

### Step 2: Spawning Migration

Salmon transport marine biomass upstream from the ocean into freshwater systems. A single adult Chinook salmon can carry 15-20 kg of marine-origin biomass into a river system. Smaller species contribute proportionally: a pink salmon carries 1.5-3 kg, a coho 3-6 kg. (Source: PR-02)

At historical scale, PNW rivers received hundreds of millions of kilograms of marine-derived nutrients annually from salmon runs. The Columbia River basin alone historically supported an estimated 7-16 million adult salmon returning per year. Across the PNW, the aggregate nutrient transport represented a massive marine subsidy to freshwater and terrestrial ecosystems that had no terrestrial equivalent. (Source: PR-02, CON-05)

The spawning migration concentrates this marine biomass in specific locations -- spawning reaches of rivers and tributaries -- creating hotspots of nutrient deposition. This spatial concentration is critical: it means riparian zones along salmon streams receive disproportionate nutrient subsidies compared to adjacent upland forests. (Source: PR-02)

**Relationship entry (Step 2):**

| Field | Value |
|-------|-------|
| relationship_type | nutrient_transfer |
| subtype | marine_derived |
| species_a | Pacific salmon (*Oncorhynchus* spp.) |
| species_b | Freshwater stream ecosystem |
| directionality | unidirectional |
| strength | obligate |
| mechanism | Anadromous spawning migration transports 15-20 kg of marine-origin biomass per adult Chinook from ocean to freshwater; salmon die after spawning, releasing marine N, P, and C into the stream nutrient pool |
| cross_module | true |
| source | PR-02 |

### Step 3: Bear-Mediated Forest Deposition

Black bears (*Ursus americanus*) and grizzly bears (*Ursus arctos horribilis*) are the primary vectors that transfer salmon biomass from streams into the forest. Individual bears ferry an estimated 500-700 salmon per season from streams into surrounding forest, carrying carcasses up to 500 meters from the stream bank. Bears preferentially consume the protein-rich brain and roe, leaving 40-60% of carcass biomass on the forest floor. (Source: PR-02, CON-05)

This selective feeding behavior is ecologically significant: the discarded portions (muscle tissue, skin, skeleton) contain the highest concentrations of marine-derived nitrogen. Bear scat and urine further distribute marine N across the forest floor. (Source: PR-02)

**Other vertebrate vectors:**

| Vector Species | Mechanism | Distance from Stream | Source |
|---------------|-----------|---------------------|--------|
| Bald eagle (*Haliaeetus leucocephalus*) | Carries salmon to perch trees; drops remains below roost sites | Up to 1 km | CON-05 |
| River otter (*Lontra canadensis*) | Carries salmon onto stream banks; latrine sites concentrate nutrients | 10-50 m | CON-05 |
| Gray wolf (*Canis lupus*) | Carries salmon carcasses into forest; pack feeding sites create nutrient patches | Up to 500 m | CON-05 |
| Mink (*Neogale vison*) | Caches salmon carcasses along stream banks | 5-30 m | CON-05 |
| Streamside die-off | Salmon carcasses decompose in-stream and on banks after spawning | 0-5 m | PR-02 |

**Relationship entry (Step 3):**

| Field | Value |
|-------|-------|
| relationship_type | predator_prey |
| subtype | predation |
| species_a | Black bear (*Ursus americanus*) |
| species_b | Pacific salmon (*Oncorhynchus* spp.) |
| directionality | unidirectional |
| strength | facultative |
| mechanism | Bears ferry 500-700 salmon per season into forest up to 500m from streams; consume brain and roe, leaving 40-60% of carcass biomass on forest floor; bear scat and urine further distribute marine-derived N |
| cross_module | true |
| source | PR-02, CON-05 |

### Step 4: Decomposition and Soil Uptake

Salmon carcass material on the forest floor is decomposed by terrestrial invertebrates (beetles, flies, mites) and soil microorganisms (bacteria, fungi). This decomposition releases marine-derived nitrogen into the soil nutrient pool. The N-15 isotopic signature is preserved through decomposition, allowing researchers to trace marine nitrogen from carcass through invertebrate to soil. (Source: PR-02)

Hocking and Reimchen (2002) demonstrated that marine-derived N-15 from salmon is detectable in terrestrial invertebrates at all trophic levels in coniferous forests of the Pacific Northwest -- from primary decomposers (dipteran larvae on carcasses) to secondary consumers (predatory beetles and spiders) to tertiary consumers (insectivorous songbirds). This confirmed that the salmon-forest nutrient pathway extends far beyond the immediate carcass zone. (Source: PR-02)

Riparian soils within 500 meters of salmon streams show elevated N-15 signatures compared to soils in equivalent forests without salmon runs. The enrichment is greatest within 50 meters of the stream and decreases with distance, following the distribution pattern of bear-deposited carcasses. (Source: PR-02)

**Relationship entry (Step 4):**

| Field | Value |
|-------|-------|
| relationship_type | nutrient_transfer |
| subtype | decomposition |
| species_a | Salmon carcass material |
| species_b | Riparian forest soil |
| directionality | unidirectional |
| strength | obligate |
| mechanism | Invertebrate and microbial decomposition of salmon carcasses releases marine-derived N-15 into soil nutrient pool; enrichment detectable within 500m of salmon streams |
| cross_module | true |
| source | PR-02 |

### Step 5: Tree Uptake and Growth Response

Sitka spruce (*Picea sitchensis*), western red cedar (*Thuja plicata*), and other riparian conifers near salmon streams absorb marine-derived nitrogen through their root systems, aided by ectomycorrhizal fungal networks. Trees within 500 meters of salmon streams show measurably elevated N-15 signatures in their foliage and wood. (Source: PR-02)

Dr. John Reynolds' 50-watershed study at Simon Fraser University compared tree growth rates, invertebrate biomass, and songbird density across watersheds with varying salmon abundance. Key finding: riparian conifers near salmon streams grow up to 3 times faster than equivalent trees along salmon-free streams. This growth enhancement correlates directly with salmon spawner density. (Source: Dr. John Reynolds, SFU)

Marine-derived nitrogen has been detected in tree rings, enabling historical reconstruction of salmon abundance going back centuries. Years of high salmon returns correspond to wider tree rings with elevated N-15 signatures, and years of low returns show reduced growth and lower marine nitrogen content. This dendrochronological record provides independent confirmation of the salmon-forest nutrient link and a tool for estimating historical salmon populations. (Source: PR-02)

**Relationship entry (Step 5):**

| Field | Value |
|-------|-------|
| relationship_type | nutrient_transfer |
| subtype | marine_derived |
| species_a | Riparian forest soil (marine-derived N) |
| species_b | Sitka spruce (*Picea sitchensis*) |
| directionality | unidirectional |
| strength | facultative |
| mechanism | Riparian conifers absorb marine-derived N-15 from soil via root systems and mycorrhizal networks; trees near salmon streams grow up to 3x faster than those along salmon-free streams (Reynolds 50-watershed study) |
| cross_module | true |
| source | PR-02, Dr. John Reynolds (SFU) |

### CASCADE-01: Salmon-Forest Nutrient Cascade (Formal Entry)

| Field | Value |
|-------|-------|
| cascade_id | CASCADE-01 |
| cascade_name | Salmon-Forest Nutrient Cascade |
| modules_spanned | aquatic, fauna, flora, fungi |
| source | PR-02, CON-05 |

| Step | Species A | Relationship Type | Species B | Mechanism |
|------|-----------|-------------------|-----------|-----------|
| 1 | Pacific salmon (*Oncorhynchus* spp.) | nutrient_transfer (marine_derived) | Freshwater stream ecosystem | Salmon accumulate marine N-15 during 1-5 years of ocean feeding; transport 15-20 kg marine biomass per adult Chinook to freshwater via spawning migration |
| 2 | Black bear (*Ursus americanus*) | predator_prey (predation) | Pacific salmon | Bears ferry 500-700 salmon per season into forest up to 500m from streams; leave 40-60% of carcass biomass on forest floor |
| 3 | Salmon carcass / bear scat | nutrient_transfer (decomposition) | Forest floor soil | Invertebrate and microbial decomposition releases marine-derived N, P, and C into soil; 40-80% of riparian N is marine-origin |
| 4 | Riparian soil (marine N) | symbiotic (mycorrhizal_network) | EMF fungi and tree roots | Trees access marine-derived soil nutrients via ectomycorrhizal fungal sheaths; mycorrhizal networks extend nutrient access zone |
| 5 | EMF fungi | symbiotic (mycorrhizal_network) | Connected tree network | Fungal hyphae redistribute carbon, water, and marine-derived nutrients between trees; mother trees preferentially supply seedlings |

---

## Section 2: Marine-Derived Nutrient Quantification (AQUA-02)

### 40-80% of Riparian Nitrogen is Marine-Origin

In watersheds with healthy salmon runs, 40-80% of the nitrogen in riparian vegetation is of marine origin. This finding, based on N-15 isotope analysis by Dr. Tom Reimchen and colleagues at the University of Victoria, represents one of the most striking quantitative demonstrations of cross-ecosystem nutrient subsidies documented anywhere in ecology. (Source: PR-02, Dr. Tom Reimchen, UVic)

The range (40-80%) reflects variation across watersheds, stream sizes, and distance from spawning reaches. Watersheds with the largest salmon runs and highest spawner densities show the upper end of the range. Watersheds with depleted salmon populations show proportionally reduced marine nitrogen signatures. (Source: PR-02)

### N-15 Isotope Evidence Across Trophic Levels

Marine N-15 signatures have been detected in every component of the riparian food web:

| Trophic Level | Organisms | N-15 Enrichment | Source |
|--------------|-----------|-----------------|--------|
| Primary producers | Riparian trees (Sitka spruce, western red cedar), shrubs, herbaceous plants | Elevated N-15 in foliage and wood; growth correlated with salmon density | PR-02 |
| Primary consumers | Terrestrial invertebrates (soil mites, collembola, dipteran larvae) | Direct marine N-15 uptake from carcass decomposition | PR-02 |
| Secondary consumers | Predatory beetles, spiders, parasitoid wasps | Marine N-15 biomagnified through invertebrate food chain | PR-02 |
| Tertiary consumers | Insectivorous songbirds (winter wrens, Pacific-slope flycatchers) | Elevated N-15 in feathers and blood near salmon streams | PR-02, Dr. John Reynolds (SFU) |
| Top predators | Black bears, bald eagles | Direct salmon consumption; highest marine N-15 concentrations | PR-02, CON-05 |

This multi-trophic detection confirms that the salmon-forest nutrient pathway is not a narrow specialist interaction but a broad ecosystem subsidy affecting organisms at every level of the food web. (Source: PR-02)

### Phosphorus and Carbon Transfer

While nitrogen is the primary limiting nutrient in PNW coniferous forests and the most extensively studied, salmon also deliver substantial quantities of marine-derived phosphorus (P) and carbon (C) to freshwater and terrestrial ecosystems. (Source: PR-02)

- **Phosphorus:** Marine-derived P enters stream and riparian systems through carcass decomposition and bear-mediated deposition. P is often co-limiting with N in freshwater systems, making the salmon P subsidy important for stream productivity. (Source: PR-02)
- **Carbon:** Salmon biomass represents a substantial carbon input. Marine-derived C is less easily traced than N-15 because carbon isotope ratios (C-13/C-12) are less distinct between marine and terrestrial sources. Nevertheless, the caloric input from salmon carcasses fuels decomposer communities and contributes to soil organic matter. (Source: PR-02)

### Watershed-Scale Impact: The 50-Watershed Study

Dr. John Reynolds and colleagues at Simon Fraser University conducted a landmark study comparing ecosystem metrics across 50 watersheds in coastal British Columbia with varying levels of salmon abundance. Key quantitative findings: (Source: Dr. John Reynolds, SFU)

| Metric | Salmon-Rich Watersheds | Salmon-Poor Watersheds | Difference |
|--------|----------------------|----------------------|------------|
| Riparian tree growth rate | Up to 3x higher | Baseline | 200-300% increase |
| Terrestrial invertebrate biomass | Significantly elevated | Baseline | Correlated with spawner density |
| Songbird density | Higher near salmon streams | Lower | Correlated with invertebrate availability |
| Soil nitrogen (total) | Elevated with marine N-15 | Terrestrial-only N | 40-80% marine origin |

This landscape-scale study provided the strongest evidence that salmon subsidies operate at the watershed level, not just in the immediate vicinity of individual carcasses. (Source: Dr. John Reynolds, SFU)

### Hyporheic Exchange

Salmon spawning physically disturbs streambed gravels during redd (nest) construction, enhancing hyporheic nutrient exchange -- the movement of water and dissolved nutrients between surface stream water and shallow groundwater beneath the streambed. (Source: PR-02)

This disturbance increases:
- Permeability of streambed gravels, enhancing water exchange
- Dissolved organic matter (DOM) movement between surface and subsurface
- Nutrient availability to riparian root zones via lateral hyporheic flow
- Invertebrate habitat complexity in the hyporheic zone

**Relationship entry (Hyporheic):**

| Field | Value |
|-------|-------|
| relationship_type | nutrient_transfer |
| subtype | hyporheic |
| species_a | Pacific salmon (*Oncorhynchus* spp.) |
| species_b | Riparian root zones / hyporheic invertebrates |
| directionality | bidirectional |
| strength | facultative |
| mechanism | Salmon spawning disturbs streambed gravels during redd construction, enhancing hyporheic nutrient exchange between surface water and groundwater; increases DOM movement and nutrient availability to riparian vegetation |
| cross_module | true |
| source | PR-02 |

### Scale of Loss

Historical Pacific salmon runs in the PNW were 2-6 times larger than current populations. Some individual river systems (notably the Columbia River basin) have experienced declines of 90% or more from pre-European-contact levels. The nutrient subsidies that salmon deliver to forests have declined proportionally with population declines. (Source: CON-05)

This means that current measurements of marine-derived nitrogen in riparian forests (40-80% in healthy systems) represent a fraction of the historical nutrient transfer. In many degraded watersheds, marine nitrogen signatures in riparian vegetation are now minimal, and the ecosystem services that salmon nutrient subsidies supported -- accelerated tree growth, enhanced invertebrate productivity, increased songbird density -- have been correspondingly reduced. (Source: CON-05, PR-02)

The loss is not merely quantitative but structural: when salmon populations decline below a threshold, the nutrient cascade (CASCADE-01) weakens at every step simultaneously. Bears shift foraging strategies, fewer carcasses reach the forest, decomposer communities lose their primary substrate, trees grow more slowly, and mycorrhizal networks receive fewer nutrients to distribute. (Source: CON-05)

---

## Section 3: PNW Fish Species Inventory (AQUA-03)

### Salmon Stocks Inventory

Conservation status varies significantly by stock (distinct population segment), not just by species. The following inventory documents 12 salmon stocks individually, reflecting their ESA listing status and population trends.

#### Chinook Salmon Stocks

| Stock | Scientific Name | Run Timing | Federal Status | State (WA) | State (OR) | IUCN | Trend | Source |
|-------|----------------|-----------|----------------|------------|------------|------|-------|--------|
| Chinook -- Spring | *O. tshawytscha* | Mar-Jun | threatened | candidate | threatened | NE | declining | GOV-01 |
| Chinook -- Summer | *O. tshawytscha* | Jun-Aug | threatened | candidate | threatened | NE | declining | GOV-01 |
| Chinook -- Fall (Tule) | *O. tshawytscha* | Aug-Oct | threatened | candidate | none | NE | declining | GOV-01 |
| Chinook -- Late Fall (Bright) | *O. tshawytscha* | Oct-Dec | species_of_concern | monitor | none | NE | stable | GOV-01 |

**Detailed entry: Chinook Salmon (species level)**

| Field | Value |
|-------|-------|
| common_name | Chinook salmon |
| scientific_name | *Oncorhynchus tshawytscha* |
| taxonomic_group | fish |
| taxonomic_hierarchy | Kingdom: Animalia, Phylum: Chordata, Class: Actinopterygii, Order: Salmoniformes, Family: Salmonidae, Genus: *Oncorhynchus*, Species: *O. tshawytscha* |
| zones_present | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| habitat_description | Large rivers and tributaries with cold, clean water; gravel-bottomed spawning reaches; estuarine rearing habitat; deep pools for adult holding |
| elevation_range | min_m: 0, max_m: 1500 |
| endemic_status | none |
| federal_status | threatened (most Columbia River ESUs) |
| state_status_wa | candidate |
| state_status_or | threatened |
| iucn_status | NE |
| trend | declining |
| life_history | anadromous |
| spawning_habitat | Large gravel beds in mainstem rivers and major tributaries; requires cold water (< 13C), adequate dissolved oxygen, and low fine sediment; redds constructed in riffles and pool tail-outs |
| marine_derived_nutrients | true |
| diet_type | carnivore (ocean: fish, squid, crustaceans; freshwater juvenile: insects, crustaceans) |
| migratory_status | migratory |
| breeding_habitat | Cold-water gravel-bottomed rivers and tributaries with adequate flow for redd construction and egg incubation |
| anomalous_elevation | false |
| primary_source | GOV-01 |
| data_quality | verified_agency |

#### Coho Salmon Stocks

| Stock | Scientific Name | Run Timing | Federal Status | State (WA) | State (OR) | IUCN | Trend | Source |
|-------|----------------|-----------|----------------|------------|------------|------|-------|--------|
| Coho -- Lower Columbia | *O. kisutch* | Sep-Nov | threatened | none | threatened | NE | declining | GOV-01 |
| Coho -- Upper Columbia | *O. kisutch* | Sep-Nov | endangered | endangered | none | NE | declining | GOV-01 |

**Detailed entry: Coho Salmon (species level)**

| Field | Value |
|-------|-------|
| common_name | Coho salmon |
| scientific_name | *Oncorhynchus kisutch* |
| taxonomic_group | fish |
| taxonomic_hierarchy | Kingdom: Animalia, Phylum: Chordata, Class: Actinopterygii, Order: Salmoniformes, Family: Salmonidae, Genus: *Oncorhynchus*, Species: *O. kisutch* |
| zones_present | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| habitat_description | Small to medium streams and tributaries with complex woody debris; off-channel rearing ponds; estuarine habitat |
| elevation_range | min_m: 0, max_m: 1000 |
| endemic_status | none |
| federal_status | threatened (Lower Columbia), endangered (Upper Columbia) |
| state_status_wa | endangered (Upper Columbia populations) |
| state_status_or | threatened |
| iucn_status | NE |
| trend | declining |
| life_history | anadromous |
| spawning_habitat | Small tributaries and side channels with gravel substrate; requires complex woody debris for juvenile rearing; off-channel alcoves and beaver ponds used extensively by juveniles |
| marine_derived_nutrients | true |
| diet_type | carnivore (ocean: fish, squid; freshwater juvenile: insects) |
| migratory_status | migratory |
| breeding_habitat | Small gravel-bottomed tributaries with abundant woody debris cover and low gradient |
| anomalous_elevation | false |
| primary_source | GOV-01 |
| data_quality | verified_agency |

#### Sockeye Salmon Stocks

| Stock | Scientific Name | Run Timing | Federal Status | State (WA) | State (OR) | IUCN | Trend | Source |
|-------|----------------|-----------|----------------|------------|------------|------|-------|--------|
| Sockeye -- Lake Ozette | *O. nerka* | Apr-Aug | threatened | none | none | NE | declining | GOV-01 |
| Sockeye -- Baker Lake | *O. nerka* | Jun-Sep | none | none | none | NE | stable | GOV-01 |

**Detailed entry: Sockeye Salmon (species level)**

| Field | Value |
|-------|-------|
| common_name | Sockeye salmon |
| scientific_name | *Oncorhynchus nerka* |
| taxonomic_group | fish |
| taxonomic_hierarchy | Kingdom: Animalia, Phylum: Chordata, Class: Actinopterygii, Order: Salmoniformes, Family: Salmonidae, Genus: *Oncorhynchus*, Species: *O. nerka* |
| zones_present | olympic_peninsula, cascade_western_slopes |
| habitat_description | Lake-rearing systems; juveniles rear 1-2 years in freshwater lakes before ocean migration; adults spawn in lake tributaries or along lake beaches |
| elevation_range | min_m: 0, max_m: 800 |
| endemic_status | none |
| federal_status | threatened (Ozette Lake ESU) |
| state_status_wa | none |
| state_status_or | none |
| iucn_status | NE |
| trend | declining |
| life_history | anadromous |
| spawning_habitat | Lake tributary streams with gravel substrate; some populations spawn on lake beaches with upwelling groundwater; requires clear, cold lake habitat for juvenile rearing |
| marine_derived_nutrients | true |
| diet_type | omnivore (ocean: zooplankton; freshwater: zooplankton, insects) |
| migratory_status | migratory |
| breeding_habitat | Lake tributary streams and lake shorelines with groundwater upwelling |
| anomalous_elevation | false |
| primary_source | GOV-01 |
| data_quality | verified_agency |

#### Chum Salmon Stocks

| Stock | Scientific Name | Run Timing | Federal Status | State (WA) | State (OR) | IUCN | Trend | Source |
|-------|----------------|-----------|----------------|------------|------------|------|-------|--------|
| Chum -- Columbia River | *O. keta* | Oct-Dec | threatened | candidate | none | NE | declining | GOV-01 |
| Chum -- Hood Canal (Summer) | *O. keta* | Aug-Oct | threatened | none | none | NE | declining | GOV-01 |

#### Pink Salmon Stocks

| Stock | Scientific Name | Run Timing | Federal Status | State (WA) | State (OR) | IUCN | Trend | Source |
|-------|----------------|-----------|----------------|------------|------------|------|-------|--------|
| Pink -- Odd-Year | *O. gorbuscha* | Jul-Sep | none | none | none | NE | stable | GOV-01 |
| Pink -- Even-Year | *O. gorbuscha* | Jul-Sep | species_of_concern | none | none | NE | declining | GOV-01 |

#### Steelhead Stocks

| Stock | Scientific Name | Run Timing | Federal Status | State (WA) | State (OR) | IUCN | Trend | Source |
|-------|----------------|-----------|----------------|------------|------------|------|-------|--------|
| Steelhead -- Winter | *O. mykiss* | Nov-Apr | threatened | none | threatened | NE | declining | GOV-01 |
| Steelhead -- Summer | *O. mykiss* | May-Oct | threatened | candidate | threatened | NE | declining | GOV-01 |

**Detailed entry: Steelhead (species level)**

| Field | Value |
|-------|-------|
| common_name | Steelhead |
| scientific_name | *Oncorhynchus mykiss* |
| taxonomic_group | fish |
| taxonomic_hierarchy | Kingdom: Animalia, Phylum: Chordata, Class: Actinopterygii, Order: Salmoniformes, Family: Salmonidae, Genus: *Oncorhynchus*, Species: *O. mykiss* |
| zones_present | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| habitat_description | Cold, clear rivers and streams with gravel substrates; unlike other Pacific salmon, steelhead are iteroparous (can survive spawning and return to the ocean to spawn again) |
| elevation_range | min_m: 0, max_m: 1800 |
| endemic_status | none |
| federal_status | threatened (multiple DPSs) |
| state_status_wa | candidate |
| state_status_or | threatened |
| iucn_status | NE |
| trend | declining |
| life_history | anadromous |
| spawning_habitat | Gravel-bottomed riffles in cold, clear streams; requires high dissolved oxygen; juveniles rear 1-3 years in freshwater before smolting |
| marine_derived_nutrients | true |
| diet_type | carnivore (ocean: fish, squid; freshwater: insects, crustaceans, small fish) |
| migratory_status | migratory |
| breeding_habitat | Cold-water gravel-bottomed streams with moderate gradient and complex habitat structure |
| anomalous_elevation | false |
| primary_source | GOV-01 |
| data_quality | verified_agency |

### Non-Salmonid Fish Inventory

#### Lamprey

| Common Name | Scientific Name | Federal Status | State (WA) | State (OR) | Life History | MDN | Trend | Source |
|-------------|----------------|----------------|------------|------------|-------------|-----|-------|--------|
| Pacific lamprey | *Entosphenus tridentatus* | species_of_concern | none | sensitive | anadromous | true | declining | GOV-01 |
| Western brook lamprey | *Lampetra richardsoni* | none | none | sensitive | resident | false | unknown | GOV-01 |
| River lamprey | *Lampetra ayresi* | species_of_concern | candidate | sensitive | anadromous | false | declining | GOV-01 |

**Detailed entry: Pacific Lamprey**

| Field | Value |
|-------|-------|
| common_name | Pacific lamprey |
| scientific_name | *Entosphenus tridentatus* |
| taxonomic_group | fish |
| taxonomic_hierarchy | Kingdom: Animalia, Phylum: Chordata, Class: Hyperoartia, Order: Petromyzontiformes, Family: Petromyzontidae, Genus: *Entosphenus*, Species: *E. tridentatus* |
| zones_present | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| habitat_description | Freshwater streams and rivers for spawning and larval rearing; larvae (ammocoetes) burrow in fine sediment for 3-7 years; adults parasitic in Pacific Ocean; culturally significant to Pacific Northwest tribal nations |
| elevation_range | min_m: 0, max_m: 1200 |
| endemic_status | none |
| federal_status | species_of_concern |
| state_status_wa | none |
| state_status_or | sensitive |
| iucn_status | LC |
| trend | declining |
| life_history | anadromous |
| spawning_habitat | Gravel-bottomed streams; larvae require fine-sediment areas for burrowing during 3-7 year freshwater larval phase |
| marine_derived_nutrients | true |
| diet_type | carnivore (parasitic in ocean; filter-feeder as larvae) |
| migratory_status | migratory |
| breeding_habitat | Low-gradient streams with mixed gravel and fine sediment |
| anomalous_elevation | false |
| primary_source | GOV-01 |
| data_quality | verified_agency |

#### Native Trout and Char

| Common Name | Scientific Name | Federal Status | State (WA) | State (OR) | Life History | MDN | Trend | Source |
|-------------|----------------|----------------|------------|------------|-------------|-----|-------|--------|
| Bull trout | *Salvelinus confluentus* | threatened | candidate | threatened | resident (some anadromous) | false | declining | GOV-01 |
| Coastal cutthroat trout | *Oncorhynchus clarkii clarkii* | species_of_concern | none | sensitive | resident / anadromous | false | declining | GOV-01 |
| Westslope cutthroat trout | *Oncorhynchus clarkii lewisi* | species_of_concern | sensitive | sensitive | resident | false | declining | GOV-01 |
| Mountain whitefish | *Prosopium williamsoni* | none | none | none | resident | false | stable | GOV-01 |
| Dolly Varden | *Salvelinus malma* | none | none | none | resident / anadromous | false | stable | GOV-01 |
| Lake trout (non-native) | *Salvelinus namaycush* | none | none | none | resident | false | increasing | GOV-01 |

**Detailed entry: Bull Trout**

| Field | Value |
|-------|-------|
| common_name | Bull trout |
| scientific_name | *Salvelinus confluentus* |
| taxonomic_group | fish |
| taxonomic_hierarchy | Kingdom: Animalia, Phylum: Chordata, Class: Actinopterygii, Order: Salmoniformes, Family: Salmonidae, Genus: *Salvelinus*, Species: *S. confluentus* |
| zones_present | olympic_peninsula, cascade_western_slopes, columbia_river_gorge |
| habitat_description | Requires the coldest and cleanest water of any salmonid in the PNW; headwater streams with temperatures below 12C; extremely sensitive to sedimentation and warming; indicator species for watershed health |
| elevation_range | min_m: 100, max_m: 2000 |
| endemic_status | none |
| federal_status | threatened |
| state_status_wa | candidate |
| state_status_or | threatened |
| iucn_status | VU |
| trend | declining |
| life_history | resident (some populations migratory within freshwater; rare anadromous forms exist) |
| spawning_habitat | Cold headwater streams (< 9C) with clean gravel; highly sensitive to fine sediment intrusion; fall spawner |
| marine_derived_nutrients | false |
| diet_type | carnivore (fish, including juvenile salmon and other trout) |
| migratory_status | partial (some populations migratory within freshwater systems) |
| breeding_habitat | Cold headwater tributaries with pristine gravel substrate and minimal sedimentation |
| anomalous_elevation | false |
| primary_source | GOV-01 |
| data_quality | verified_agency |

#### Sculpin Family (Cottidae)

| Common Name | Scientific Name | Federal Status | State (WA) | State (OR) | Life History | MDN | Trend | Source |
|-------------|----------------|----------------|------------|------------|-------------|-----|-------|--------|
| Prickly sculpin | *Cottus asper* | none | none | none | resident | false | stable | GOV-01 |
| Coastrange sculpin | *Cottus aleuticus* | none | none | none | resident | false | stable | GOV-01 |
| Riffle sculpin | *Cottus gulosus* | none | none | none | resident | false | stable | GOV-01 |
| Shorthead sculpin | *Cottus confusus* | none | none | sensitive | resident | false | stable | GOV-01 |
| Torrent sculpin | *Cottus rhotheus* | none | none | none | resident | false | stable | GOV-01 |
| Mottled sculpin | *Cottus bairdii* | none | none | none | resident | false | stable | GOV-01 |
| Slimy sculpin | *Cottus cognatus* | none | none | none | resident | false | stable | GOV-01 |

> **Ecological role:** Sculpin are benthic invertivores that serve as indicators of stream health. They consume salmon eggs opportunistically and are prey for bull trout, river otters, and mergansers. Their abundance correlates with substrate quality and water clarity. (Source: GOV-01)

#### Minnow Family (Cyprinidae / Leuciscidae)

| Common Name | Scientific Name | Federal Status | State (WA) | State (OR) | Life History | MDN | Trend | Source |
|-------------|----------------|----------------|------------|------------|-------------|-----|-------|--------|
| Northern pikeminnow | *Ptychocheilus oregonensis* | none | none | none | resident | false | stable | GOV-01 |
| Longnose dace | *Rhinichthys cataractae* | none | none | none | resident | false | stable | GOV-01 |
| Speckled dace | *Rhinichthys osculus* | none | none | none | resident | false | stable | GOV-01 |
| Redside shiner | *Richardsonius balteatus* | none | none | none | resident | false | stable | GOV-01 |
| Peamouth | *Mylocheilus caurinus* | none | none | none | resident | false | stable | GOV-01 |
| Chiselmouth | *Acrocheilus alutaceus* | none | none | sensitive | resident | false | declining | GOV-01 |

#### Sucker Family (Catostomidae)

| Common Name | Scientific Name | Federal Status | State (WA) | State (OR) | Life History | MDN | Trend | Source |
|-------------|----------------|----------------|------------|------------|-------------|-----|-------|--------|
| Largescale sucker | *Catostomus macrocheilus* | none | none | none | resident | false | stable | GOV-01 |
| Bridgelip sucker | *Catostomus columbianus* | none | none | none | resident | false | stable | GOV-01 |
| Mountain sucker | *Catostomus platyrhynchus* | none | none | sensitive | resident | false | declining | GOV-01 |

#### Smelt (Osmeridae)

| Common Name | Scientific Name | Federal Status | State (WA) | State (OR) | Life History | MDN | Trend | Source |
|-------------|----------------|----------------|------------|------------|-------------|-----|-------|--------|
| Eulachon | *Thaleichthys pacificus* | threatened | candidate | threatened | anadromous | true | declining | GOV-01 |
| Longfin smelt | *Spirinchus thaleichthys* | candidate | candidate | sensitive | amphidromous | false | declining | GOV-01 |

**Detailed entry: Eulachon**

| Field | Value |
|-------|-------|
| common_name | Eulachon (candlefish) |
| scientific_name | *Thaleichthys pacificus* |
| taxonomic_group | fish |
| taxonomic_hierarchy | Kingdom: Animalia, Phylum: Chordata, Class: Actinopterygii, Order: Osmeriformes, Family: Osmeridae, Genus: *Thaleichthys*, Species: *T. pacificus* |
| zones_present | columbia_river_gorge, olympic_peninsula |
| habitat_description | Anadromous smelt; adults spawn in lower reaches of large rivers on sand/gravel substrate; extremely high oil content (historically burned as candles by coastal First Nations); major prey species for sturgeon, marine mammals, and seabirds |
| elevation_range | min_m: 0, max_m: 50 |
| endemic_status | none |
| federal_status | threatened |
| state_status_wa | candidate |
| state_status_or | threatened |
| iucn_status | NT |
| trend | declining |
| life_history | anadromous |
| spawning_habitat | Sandy-gravel substrate in lower reaches of large rivers; spawning runs historically massive but have declined dramatically |
| marine_derived_nutrients | true |
| diet_type | omnivore (zooplankton, phytoplankton) |
| migratory_status | migratory |
| breeding_habitat | Lower reaches of large rivers with sandy-gravel substrate |
| anomalous_elevation | false |
| primary_source | GOV-01 |
| data_quality | verified_agency |

#### Sturgeon (Acipenseridae)

| Common Name | Scientific Name | Federal Status | State (WA) | State (OR) | Life History | MDN | Trend | Source |
|-------------|----------------|----------------|------------|------------|-------------|-----|-------|--------|
| White sturgeon | *Acipenser transmontanus* | species_of_concern | none | sensitive | amphidromous | false | declining | GOV-01 |
| Green sturgeon (Southern DPS) | *Acipenser medirostris* | threatened | none | sensitive | anadromous | false | declining | GOV-01 |

**Detailed entry: White Sturgeon**

| Field | Value |
|-------|-------|
| common_name | White sturgeon |
| scientific_name | *Acipenser transmontanus* |
| taxonomic_group | fish |
| taxonomic_hierarchy | Kingdom: Animalia, Phylum: Chordata, Class: Actinopterygii, Order: Acipenseriformes, Family: Acipenseridae, Genus: *Acipenser*, Species: *A. transmontanus* |
| zones_present | columbia_river_gorge |
| habitat_description | Largest freshwater fish in North America; lives in deep pools and runs of large rivers; can exceed 6 m in length and 600 kg; extremely long-lived (100+ years); bottom feeder consuming fish, crustaceans, and mollusks |
| elevation_range | min_m: 0, max_m: 200 |
| endemic_status | none |
| federal_status | species_of_concern |
| state_status_wa | none |
| state_status_or | sensitive |
| iucn_status | LC |
| trend | declining |
| life_history | amphidromous |
| spawning_habitat | Deep, fast-moving river channels with rocky substrate; requires specific temperature and flow conditions; spawns in spring-early summer |
| marine_derived_nutrients | false |
| diet_type | carnivore (benthic fish, crustaceans, mollusks, salmon carcasses) |
| migratory_status | partial (moves between freshwater and estuarine/marine habitats) |
| breeding_habitat | Deep, swift river channels with rocky substrate and temperatures of 14-16C |
| anomalous_elevation | false |
| primary_source | GOV-01 |
| data_quality | verified_agency |

#### Invasive Species

| Common Name | Scientific Name | Federal Status | State (WA) | State (OR) | Life History | MDN | Trend | Source |
|-------------|----------------|----------------|------------|------------|-------------|-----|-------|--------|
| Smallmouth bass | *Micropterus dolomieu* | none (non-native) | none | none | resident | false | increasing | GOV-01 |
| Largemouth bass | *Micropterus salmoides* | none (non-native) | none | none | resident | false | increasing | GOV-01 |
| Walleye | *Sander vitreus* | none (non-native) | none | none | resident | false | increasing | GOV-01 |
| Northern pike | *Esox lucius* | none (non-native) | none | none | resident | false | increasing | GOV-01 |
| Common carp | *Cyprinus carpio* | none (non-native) | none | none | resident | false | stable | GOV-01 |
| Yellow perch | *Perca flavescens* | none (non-native) | none | none | resident | false | stable | GOV-01 |
| Brook trout (non-native in PNW) | *Salvelinus fontinalis* | none (non-native) | none | none | resident | false | stable | GOV-01 |
| Brown trout (non-native) | *Salmo trutta* | none (non-native) | none | none | resident | false | stable | GOV-01 |

> **Ecological impact:** Non-native predatory fish (especially smallmouth bass, walleye, and northern pike) prey on juvenile salmon and steelhead, increasing mortality during the critical freshwater rearing and outmigration phases. Brook trout hybridize with bull trout, threatening genetic integrity of the native species. (Source: GOV-01)

**Competition relationship entry:**

| Field | Value |
|-------|-------|
| relationship_type | competition |
| subtype | interference |
| species_a | Smallmouth bass (*Micropterus dolomieu*) |
| species_b | Juvenile Chinook salmon (*O. tshawytscha*) |
| directionality | unidirectional |
| strength | facultative |
| mechanism | Non-native smallmouth bass prey on and compete with juvenile salmon in warming mainstem habitats; expanding range correlates with rising water temperatures |
| cross_module | false |
| source | GOV-01 |

### Fish Species Inventory Summary

| Category | Species Count | Threatened/Listed Species |
|----------|--------------|--------------------------|
| Salmon (6 species, 12 stocks) | 6 species / 12 stocks | 10 stocks (threatened or endangered) |
| Lamprey | 3 | 2 (species_of_concern + sensitive) |
| Native trout and char | 6 | 3 (bull trout threatened; 2 cutthroat species_of_concern/sensitive) |
| Sculpin | 7 | 1 (shorthead sculpin sensitive) |
| Minnow | 6 | 1 (chiselmouth sensitive) |
| Sucker | 3 | 1 (mountain sucker sensitive) |
| Smelt | 2 | 2 (eulachon threatened; longfin smelt candidate) |
| Sturgeon | 2 | 2 (green sturgeon threatened; white sturgeon species_of_concern/sensitive) |
| Invasive species | 8 | 0 (non-native, not conservation-listed) |
| **Total** | **43 native + 8 non-native = 51 species** | **22 native species/stocks with federal or state listing** |

> **Note on threatened species count:** When counting salmon stocks individually by ESA listing status (10 listed stocks) plus other listed fish species (12), the inventory identifies 22 distinct native fish populations with federal or state conservation concern. Including additional state-level "sensitive" and "candidate" designations across all taxa brings the total to 25+ threatened aquatic species. See the Salmon-Wildlife Dependency Web (Section 4) for additional threatened aquatic invertebrates and amphibians dependent on salmon ecosystems.

---

## Section 4: Salmon as Keystone Connector (AQUA-04)

### The 137+ Species Dependency Web

Pacific salmon are a keystone connector species: 137 or more wildlife species depend on salmon for food, nutrients, or ecosystem services. This dependency web extends from stream to forest, from microorganisms to apex predators, and from aquatic invertebrates to canopy trees. Removing salmon from this web cascades through every trophic level and across every ecosystem module documented in this research project. (Source: CON-05)

The following inventory organizes salmon-dependent species by taxonomic group, documenting the nature and strength of each dependency.

### Mammals (20+ species)

| Species | Dependency Type | Strength | Mechanism | Source |
|---------|---------------|----------|-----------|--------|
| Black bear (*Ursus americanus*) | predator_prey | facultative | Primary salmon predator; ferries 500-700 carcasses per season into forest; pre-hibernation caloric intake depends heavily on salmon | CON-05 |
| Grizzly bear (*Ursus arctos horribilis*) | predator_prey | facultative | Salmon provide 50-90% of pre-hibernation calories in coastal populations; foraging concentrations at salmon streams | CON-05 |
| Gray wolf (*Canis lupus*) | predator_prey | opportunistic | Coastal wolf packs shift diet to 25%+ salmon during spawning season; carry carcasses into forest | CON-05 |
| River otter (*Lontra canadensis*) | predator_prey | facultative | Salmon primary prey item; latrine sites near streams concentrate marine nutrients | CON-05 |
| American mink (*Neogale vison*) | predator_prey | opportunistic | Opportunistic salmon predation; caches carcasses along stream banks | CON-05 |
| Raccoon (*Procyon lotor*) | predator_prey | opportunistic | Scavenges salmon carcasses along stream margins | CON-05 |
| Coyote (*Canis latrans*) | predator_prey | opportunistic | Scavenges salmon carcasses; documented at spawning sites | CON-05 |
| Red fox (*Vulpes vulpes*) | predator_prey | opportunistic | Scavenges salmon carcasses in riparian areas | CON-05 |
| Cougar (*Puma concolor*) | predator_prey | opportunistic | Occasional salmon consumption documented; primarily benefits indirectly through prey fitness | CON-05 |
| Bobcat (*Lynx rufus*) | predator_prey | opportunistic | Scavenges salmon carcasses; documented at spawning streams | CON-05 |
| American marten (*Martes americana*) | predator_prey | opportunistic | Scavenges salmon carcasses in riparian forests | CON-05 |
| Fisher (*Pekania pennanti*) | predator_prey | opportunistic | Scavenges salmon carcasses; riparian habitat user | CON-05 |
| Long-tailed weasel (*Neogale frenata*) | predator_prey | opportunistic | Scavenges salmon remains along small streams | CON-05 |
| Short-tailed weasel (*Mustela erminea*) | predator_prey | opportunistic | Scavenges salmon remains | CON-05 |
| Deer mouse (*Peromyscus maniculatus*) | nutrient_transfer | opportunistic | Consumes salmon carcass tissue; benefits from increased invertebrate prey near salmon streams | CON-05, PR-02 |
| Shrew species (*Sorex* spp.) | nutrient_transfer | opportunistic | Consume invertebrates enriched with marine-derived N from salmon decomposition | PR-02 |
| Townsend's vole (*Microtus townsendii*) | nutrient_transfer | opportunistic | Herbivore benefiting from enhanced vegetation growth near salmon streams | PR-02 |
| Roosevelt elk (*Cervus canadensis roosevelti*) | nutrient_transfer | opportunistic | Browses riparian vegetation enriched with marine-derived nitrogen | PR-02 |
| Black-tailed deer (*Odocoileus hemionus columbianus*) | nutrient_transfer | opportunistic | Browses riparian vegetation enriched with marine-derived nitrogen | PR-02 |
| Steller sea lion (*Eumetopias jubatus*) | predator_prey | facultative | Predates on salmon at river mouths during spawning runs | CON-05 |
| Harbor seal (*Phoca vitulina*) | predator_prey | facultative | Predates on salmon in estuaries and lower river reaches | CON-05 |

### Birds (40+ species)

| Species | Dependency Type | Strength | Mechanism | Source |
|---------|---------------|----------|-----------|--------|
| Bald eagle (*Haliaeetus leucocephalus*) | predator_prey | facultative | Primary salmon predator from air; congregations of 100+ eagles at spawning streams; nesting success correlates with salmon abundance | CON-05 |
| Osprey (*Pandion haliaetus*) | predator_prey | facultative | Catches live salmon from streams; nesting near salmon rivers | CON-05 |
| Great blue heron (*Ardea herodias*) | predator_prey | facultative | Wades in shallow spawning streams to capture juvenile and spawned-out salmon | CON-05 |
| Belted kingfisher (*Megaceryle alcyon*) | predator_prey | facultative | Dives for salmon fry and eggs in spawning streams | CON-05 |
| American dipper (*Cinclus mexicanus*) | predator_prey | obligate | Underwater foraging for salmon eggs, larvae, and aquatic invertebrates enriched by salmon decomposition; year-round stream resident | CON-05 |
| Common merganser (*Mergus merganser*) | predator_prey | facultative | Dives for salmon fry and small fish in rivers | CON-05 |
| Hooded merganser (*Lophodytes cucullatus*) | predator_prey | opportunistic | Dives for salmon fry and aquatic invertebrates | CON-05 |
| Turkey vulture (*Cathartes aura*) | predator_prey | opportunistic | Scavenges salmon carcasses | CON-05 |
| Common raven (*Corvus corax*) | predator_prey | opportunistic | Scavenges salmon carcasses at spawning streams; intelligent foraging behavior | CON-05 |
| American crow (*Corvus brachyrhynchos*) | predator_prey | opportunistic | Scavenges salmon carcasses and eggs | CON-05 |
| Steller's jay (*Cyanocitta stelleri*) | predator_prey | opportunistic | Scavenges salmon carcass scraps | CON-05 |
| Gray jay (Canada jay) (*Perisoreus canadensis*) | predator_prey | opportunistic | Scavenges and caches salmon tissue | CON-05 |
| Black-billed magpie (*Pica hudsonia*) | predator_prey | opportunistic | Scavenges salmon carcasses | CON-05 |
| Red-tailed hawk (*Buteo jamaicensis*) | nutrient_transfer | opportunistic | Indirectly benefits from increased rodent populations near salmon streams | PR-02 |
| Northern harrier (*Circus hudsonius*) | nutrient_transfer | opportunistic | Benefits from increased vole populations in salmon-enriched riparian meadows | PR-02 |
| Barred owl (*Strix varia*) | nutrient_transfer | opportunistic | Benefits from elevated small mammal prey in salmon-enriched forests | PR-02 |
| Winter wren (*Troglodytes hiemalis*) | nutrient_transfer | facultative | Insectivore; feeds on invertebrates enriched with marine-derived N near salmon streams; density correlates with salmon abundance (Reynolds study) | PR-02 |
| Pacific-slope flycatcher (*Empidonax difficilis*) | nutrient_transfer | facultative | Insectivore; elevated N-15 in tissues near salmon streams | PR-02 |
| Varied thrush (*Ixoreus naevius*) | nutrient_transfer | opportunistic | Ground-foraging insectivore; benefits from enriched invertebrate community near salmon streams | PR-02 |
| Swainson's thrush (*Catharus ustulatus*) | nutrient_transfer | opportunistic | Insectivore benefiting from elevated invertebrate biomass in salmon-enriched forests | PR-02 |
| American robin (*Turdus migratorius*) | nutrient_transfer | opportunistic | Ground-foraging insectivore; feeds on invertebrates in salmon-enriched soils | PR-02 |
| Song sparrow (*Melospiza melodia*) | nutrient_transfer | opportunistic | Riparian insectivore; benefits from elevated invertebrate prey near salmon streams | PR-02 |
| White-crowned sparrow (*Zonotrichia leucophrys*) | nutrient_transfer | opportunistic | Seed and insect diet; benefits from productive riparian vegetation near salmon streams | PR-02 |
| Dark-eyed junco (*Junco hyemalis*) | nutrient_transfer | opportunistic | Ground forager benefiting from enriched soil invertebrate community | PR-02 |
| Chestnut-backed chickadee (*Poecile rufescens*) | nutrient_transfer | opportunistic | Insectivore benefiting from elevated invertebrate biomass in riparian canopy | PR-02 |
| Brown creeper (*Certhia americana*) | nutrient_transfer | opportunistic | Bark-gleaning insectivore in salmon-enriched riparian forests | PR-02 |
| Red-breasted nuthatch (*Sitta canadensis*) | nutrient_transfer | opportunistic | Conifer specialist; insectivore benefiting from enriched arthropod community | PR-02 |
| Golden-crowned kinglet (*Regulus satrapa*) | nutrient_transfer | opportunistic | Tiny insectivore; benefits from elevated canopy arthropod biomass | PR-02 |
| Rufous hummingbird (*Selasphorus rufus*) | nutrient_transfer | opportunistic | Benefits from enhanced flowering in salmon-enriched riparian areas | PR-02 |
| Northern flicker (*Colaptes auratus*) | nutrient_transfer | opportunistic | Ground-foraging ant specialist; benefits from soil enrichment near salmon streams | PR-02 |
| Pileated woodpecker (*Dryocopus pileatus*) | nutrient_transfer | opportunistic | Benefits from healthier riparian trees supporting larger beetle larvae populations | PR-02 |
| Downy woodpecker (*Dryobates pubescens*) | nutrient_transfer | opportunistic | Bark-gleaning insectivore in riparian forests | PR-02 |
| Hairy woodpecker (*Dryobates villosus*) | nutrient_transfer | opportunistic | Insectivore benefiting from productive riparian trees near salmon streams | PR-02 |
| Spotted sandpiper (*Actitis macularius*) | predator_prey | opportunistic | Forages along salmon streams for aquatic invertebrates and salmon eggs | CON-05 |
| Harlequin duck (*Histrionicus histrionicus*) | predator_prey | opportunistic | Dives for salmon eggs and aquatic invertebrates in fast-flowing salmon streams | CON-05 |
| Great horned owl (*Bubo virginianus*) | nutrient_transfer | opportunistic | Top predator benefiting from enriched prey base in salmon-adjacent forests | PR-02 |
| Western screech-owl (*Megascops kennicottii*) | nutrient_transfer | opportunistic | Benefits from elevated small mammal and insect prey near salmon streams | PR-02 |
| Peregrine falcon (*Falco peregrinus*) | nutrient_transfer | opportunistic | Preys on songbirds and shorebirds concentrated at salmon spawning sites | CON-05 |
| Herring gull (*Larus argentatus*) | predator_prey | opportunistic | Scavenges salmon carcasses at spawning sites and river mouths | CON-05 |
| Glaucous-winged gull (*Larus glaucescens*) | predator_prey | opportunistic | Scavenges salmon carcasses at coastal and river sites | CON-05 |
| Double-crested cormorant (*Nannopterum auritum*) | predator_prey | opportunistic | Dives for juvenile salmon in estuaries and lower rivers | CON-05 |

### Fish (15+ species)

| Species | Dependency Type | Strength | Mechanism | Source |
|---------|---------------|----------|-----------|--------|
| Dolly Varden (*Salvelinus malma*) | predator_prey | facultative | Feeds extensively on salmon eggs during spawning season; egg consumption is primary fall/winter diet | CON-05 |
| Bull trout (*Salvelinus confluentus*) | predator_prey | facultative | Predates on juvenile salmon; benefits from salmon egg consumption; competes for cold-water habitat | GOV-01 |
| Coastal cutthroat trout (*O. clarkii clarkii*) | predator_prey | opportunistic | Feeds on salmon eggs and fry; benefits from marine-derived nutrients in shared streams | GOV-01 |
| Northern pikeminnow (*Ptychocheilus oregonensis*) | predator_prey | facultative | Major predator of juvenile salmon during outmigration; primary native predation source for smolts | GOV-01 |
| Prickly sculpin (*Cottus asper*) | predator_prey | opportunistic | Consumes salmon eggs that drift from redds | GOV-01 |
| Coastrange sculpin (*Cottus aleuticus*) | predator_prey | opportunistic | Consumes drifting salmon eggs; benthic invertivore benefiting from carcass-enriched substrates | GOV-01 |
| Riffle sculpin (*Cottus gulosus*) | predator_prey | opportunistic | Opportunistic salmon egg consumer in spawning reaches | GOV-01 |
| Torrent sculpin (*Cottus rhotheus*) | predator_prey | opportunistic | Consumes salmon eggs in cold, fast-water spawning habitat | GOV-01 |
| Mountain whitefish (*Prosopium williamsoni*) | predator_prey | opportunistic | Feeds on drifting salmon eggs and invertebrates enriched by salmon decomposition | GOV-01 |
| Pacific lamprey (*Entosphenus tridentatus*) | nutrient_transfer | opportunistic | Anadromous; co-migrates with salmon; carcasses contribute marine-derived nutrients alongside salmon | GOV-01 |
| Largescale sucker (*Catostomus macrocheilus*) | predator_prey | opportunistic | Consumes drifting salmon eggs and invertebrates from carcass decomposition | GOV-01 |
| Redside shiner (*Richardsonius balteatus*) | predator_prey | opportunistic | Small cyprinid consuming drifting salmon eggs and carcass-derived invertebrates | GOV-01 |
| Peamouth (*Mylocheilus caurinus*) | predator_prey | opportunistic | Feeds on salmon eggs and aquatic invertebrates enriched by carcass decomposition | GOV-01 |
| Longnose dace (*Rhinichthys cataractae*) | predator_prey | opportunistic | Benthic feeder consuming drifting salmon eggs | GOV-01 |
| White sturgeon (*Acipenser transmontanus*) | predator_prey | opportunistic | Consumes salmon carcasses and eggs; large adults documented scavenging at spawning sites | GOV-01 |

### Invertebrates (30+ species / groups)

| Species / Group | Dependency Type | Strength | Mechanism | Source |
|----------------|---------------|----------|-----------|--------|
| Blowflies (Calliphoridae) | nutrient_transfer | facultative | Primary colonizers of salmon carcasses; larvae decompose carcass tissue and are consumed by secondary predators | PR-02 |
| Flesh flies (Sarcophagidae) | nutrient_transfer | facultative | Carcass decomposition; larvae enriched with marine N-15 | PR-02 |
| Rove beetles (Staphylinidae) | predator_prey | opportunistic | Predatory beetles feeding on carcass-associated fly larvae | PR-02 |
| Ground beetles (Carabidae) | predator_prey | opportunistic | Predatory beetles at carcass sites; marine N-15 detected in tissues | PR-02 |
| Burying beetles (Silphidae) | nutrient_transfer | facultative | Carcass-specialist beetles that bury and consume salmon remains | PR-02 |
| Soil mites (Acari) | nutrient_transfer | opportunistic | Decompose salmon-derived organic matter in soil; marine N-15 signature in tissues | PR-02 |
| Collembola (springtails) | nutrient_transfer | opportunistic | Soil microarthropods processing salmon-derived organic matter; key detritivores | PR-02 |
| Spiders (Araneae, multiple families) | predator_prey | opportunistic | Consume carcass-associated flies and beetles; elevated marine N-15 | PR-02 |
| Caddisfly larvae (Trichoptera) | nutrient_transfer | facultative | Aquatic larvae that consume salmon carcass material and biofilm enriched with marine nutrients | PR-02 |
| Mayfly larvae (Ephemeroptera) | nutrient_transfer | opportunistic | Aquatic larvae benefiting from nutrient enrichment from salmon carcass decomposition in streams | PR-02 |
| Stonefly larvae (Plecoptera) | nutrient_transfer | opportunistic | Cold-water aquatic insects; shredder species process salmon carcass material | PR-02 |
| Chironomid midges (Chironomidae) | nutrient_transfer | facultative | Aquatic larvae colonize and decompose salmon carcasses in streams; emerge as adults carrying marine N | PR-02 |
| Blackflies (Simuliidae) | nutrient_transfer | opportunistic | Filter-feeding larvae benefit from increased dissolved organic matter from carcass decomposition | PR-02 |
| Aquatic snails (Gastropoda) | nutrient_transfer | opportunistic | Graze on biofilm enriched by salmon-derived nutrients on stream substrates | PR-02 |
| Freshwater mussels (Unionidae) | nutrient_transfer | opportunistic | Filter feeders benefiting from increased particulate organic matter from carcass decomposition | GOV-01 |
| Crayfish (Pacifastacus leniusculus) | predator_prey | opportunistic | Signal crayfish scavenge salmon carcass material in streams | GOV-01 |
| Earthworms (Lumbricidae) | nutrient_transfer | opportunistic | Process salmon-derived organic matter deposited on forest floor by bears; enhance nutrient cycling | PR-02 |
| Millipedes (Diplopoda) | nutrient_transfer | opportunistic | Detritivores processing salmon-derived organic material in riparian soils | PR-02 |
| Isopods (Isopoda) | nutrient_transfer | opportunistic | Soil detritivores processing salmon carcass fragments | PR-02 |
| Parasitoid wasps (Hymenoptera: Ichneumonidae) | predator_prey | opportunistic | Parasitize carcass-associated fly larvae; tertiary consumers carrying marine N-15 | PR-02 |
| Predatory mites (Mesostigmata) | predator_prey | opportunistic | Predatory soil mites feeding on decomposer communities at carcass sites | PR-02 |
| Centipedes (Chilopoda) | predator_prey | opportunistic | Soil predators feeding on invertebrates enriched by salmon-derived nutrients | PR-02 |
| Ants (Formicidae) | nutrient_transfer | opportunistic | Scavenge salmon carcass tissue; transport marine nutrients into soil via nest construction | PR-02 |
| Dung beetles (Scarabaeidae) | nutrient_transfer | opportunistic | Process bear scat containing salmon-derived nutrients | PR-02 |
| Aquatic amphipods (Amphipoda) | nutrient_transfer | opportunistic | Shredder-decomposers of salmon carcass material in streams | PR-02 |
| Water mites (Hydrachnidiae) | nutrient_transfer | opportunistic | Aquatic mites benefiting from increased prey in salmon-enriched streams | PR-02 |
| Crane fly larvae (Tipulidae) | nutrient_transfer | opportunistic | Aquatic and terrestrial detritivores processing salmon-derived organic matter | PR-02 |
| Bark beetles (Scolytinae) | nutrient_transfer | opportunistic | Indirectly affected; bark beetle dynamics influenced by tree vigor which is enhanced by salmon-derived nutrients | PR-02 |
| Nematodes (Nematoda) | nutrient_transfer | opportunistic | Soil nematodes processing salmon-derived microbial biomass | PR-02 |
| Fungus gnats (Mycetophilidae) | nutrient_transfer | opportunistic | Larvae feed on fungi growing on salmon-enriched soil; adults carry marine N-15 | PR-02 |

### Plants (30+ species / groups)

| Species / Group | Dependency Type | Strength | Mechanism | Source |
|----------------|---------------|----------|-----------|--------|
| Sitka spruce (*Picea sitchensis*) | nutrient_transfer | facultative | Up to 3x growth increase near salmon streams; N-15 detectable in tree rings; primary recipient of marine N | PR-02 |
| Western red cedar (*Thuja plicata*) | nutrient_transfer | facultative | Marine N-15 in foliage near salmon streams; enhanced growth in salmon-enriched riparian zones | PR-02 |
| Western hemlock (*Tsuga heterophylla*) | nutrient_transfer | facultative | Marine N uptake via mycorrhizal networks; growth enhancement near salmon streams | PR-02 |
| Douglas fir (*Pseudotsuga menziesii*) | nutrient_transfer | facultative | Accesses marine N via EMF mycorrhizal networks; N-15 signature in tissues near salmon streams | PR-02 |
| Red alder (*Alnus rubra*) | nutrient_transfer | opportunistic | Nitrogen-fixing species; may interact with marine N deposition in complex riparian nutrient dynamics | PR-02 |
| Bigleaf maple (*Acer macrophyllum*) | nutrient_transfer | opportunistic | Riparian deciduous tree with elevated N-15 in foliage near salmon streams | PR-02 |
| Black cottonwood (*Populus trichocarpa*) | nutrient_transfer | opportunistic | Riparian specialist; elevated marine N in foliage near salmon-bearing streams | PR-02 |
| Pacific willow (*Salix lasiandra*) | nutrient_transfer | opportunistic | Streamside shrub-tree with direct exposure to salmon carcass nutrient input | PR-02 |
| Salmonberry (*Rubus spectabilis*) | nutrient_transfer | facultative | Dominant riparian shrub; directly fertilized by salmon carcass deposition; fruit production may increase near salmon streams | PR-02 |
| Devil's club (*Oplopanax horridus*) | nutrient_transfer | opportunistic | Riparian understory shrub absorbing marine-derived nutrients from enriched soils | PR-02 |
| Sword fern (*Polystichum munitum*) | nutrient_transfer | opportunistic | Dominant understory fern; marine N-15 detected in fronds near salmon streams | PR-02 |
| Deer fern (*Blechnum spicant*) | nutrient_transfer | opportunistic | Understory fern benefiting from marine-enriched riparian soils | PR-02 |
| Lady fern (*Athyrium filix-femina*) | nutrient_transfer | opportunistic | Understory fern in salmon-enriched riparian areas | PR-02 |
| Skunk cabbage (*Lysichiton americanus*) | nutrient_transfer | opportunistic | Wetland plant in salmon stream floodplains; may benefit from marine nutrient input | PR-02 |
| Stream violet (*Viola glabella*) | nutrient_transfer | opportunistic | Riparian herb with elevated N-15 near salmon streams | PR-02 |
| False lily-of-the-valley (*Maianthemum dilatatum*) | nutrient_transfer | opportunistic | Ground-cover plant in salmon-enriched riparian forests | PR-02 |
| Oxalis (*Oxalis oregana*) | nutrient_transfer | opportunistic | Understory herb benefiting from marine-derived N in riparian soils | PR-02 |
| Foam flower (*Tiarella trifoliata*) | nutrient_transfer | opportunistic | Herb in salmon-enriched riparian understory | PR-02 |
| Red huckleberry (*Vaccinium parvifolium*) | nutrient_transfer | opportunistic | Understory shrub; fruit production may benefit from marine nutrient enrichment | PR-02 |
| Oval-leaf blueberry (*Vaccinium ovalifolium*) | nutrient_transfer | opportunistic | Understory shrub in riparian forests near salmon streams | PR-02 |
| Thimbleberry (*Rubus parviflorus*) | nutrient_transfer | opportunistic | Riparian shrub benefiting from salmon-derived soil enrichment | PR-02 |
| Elderberry (*Sambucus racemosa*) | nutrient_transfer | opportunistic | Riparian shrub absorbing marine-derived nutrients from enriched soils | PR-02 |
| Oregon grape (*Mahonia nervosa*) | nutrient_transfer | opportunistic | Understory shrub in riparian forests near salmon streams | PR-02 |
| Mosses (Bryophyta, multiple species) | nutrient_transfer | opportunistic | Epiphytic and ground mosses absorbing dissolved marine N from precipitation and throughfall | PR-02 |
| Liverworts (Marchantiophyta) | nutrient_transfer | opportunistic | Ground and epiphytic liverworts benefiting from elevated nitrogen deposition near salmon streams | PR-02 |
| Lichens (multiple species) | nutrient_transfer | opportunistic | Epiphytic lichens absorbing atmospheric N; may benefit from elevated N cycling near salmon streams | PR-02 |
| Sedges (*Carex* spp.) | nutrient_transfer | opportunistic | Riparian/wetland plants absorbing marine-derived nutrients from salmon-enriched soils | PR-02 |
| Rushes (*Juncus* spp.) | nutrient_transfer | opportunistic | Wetland plants in salmon stream floodplains | PR-02 |
| Horsetails (*Equisetum* spp.) | nutrient_transfer | opportunistic | Riparian plants absorbing nutrients from salmon-enriched substrates | PR-02 |
| Stinging nettle (*Urtica dioica*) | nutrient_transfer | opportunistic | Nitrophilous herb; particularly responsive to elevated nitrogen from salmon carcass deposition | PR-02 |
| Stream bank algae (Chlorophyta) | nutrient_transfer | facultative | Periphyton and filamentous algae directly fertilized by dissolved nutrients from salmon carcass decomposition | PR-02 |

### Fungi

| Species / Group | Dependency Type | Strength | Mechanism | Source |
|----------------|---------------|----------|-----------|--------|
| EMF fungi (*Rhizopogon* spp.) | symbiotic (mycorrhizal_network) | facultative | Ectomycorrhizal fungi access marine-derived N through host tree roots; redistribute nutrients through hyphal networks connecting multiple trees | PR-02 |
| EMF fungi (*Russula* spp.) | symbiotic (mycorrhizal_network) | facultative | Major EMF genus; facilitates marine N uptake for host trees near salmon streams | PR-02 |
| EMF fungi (*Cortinarius* spp.) | symbiotic (mycorrhizal_network) | facultative | Ectomycorrhizal partner accessing salmon-derived soil nitrogen | PR-02 |
| Saprotrophic fungi (wood decomposers) | nutrient_transfer | opportunistic | Decompose nurse logs and woody debris; growth enhanced by marine-derived nitrogen input to riparian soils | PR-02 |
| Aquatic hyphomycetes | nutrient_transfer | opportunistic | Fungal decomposers of leaf litter in salmon streams; activity enhanced by dissolved nutrients from carcass decomposition | PR-02 |
| Soil fungi (general community) | nutrient_transfer | opportunistic | Soil fungal biomass and diversity correlate with salmon-derived nutrient input; mediates nutrient cycling in riparian soils | PR-02 |

> **Cross-module link to Phase 605 (Fungi Survey):** The connection between salmon-derived nutrients and mycorrhizal network function is a primary cross-module relationship. Marine nitrogen entering riparian soil is accessed by EMF fungi, which redistribute it through Common Mycorrhizal Networks (CMNs) connecting multiple host trees. This means salmon nutrient subsidies affect tree growth not only at the individual level but at the network level -- a single salmon carcass decomposing near one tree potentially enriches dozens of connected trees via fungal highways. (Source: PR-02, cross-referenced with Phase 605 fungi module)

### The Keystone Concept: Cascade Through the Food Web

Salmon qualify as a keystone connector because their removal (or severe reduction) cascades through the entire ecosystem at every trophic level simultaneously. Unlike a typical keystone predator (which affects prey populations), salmon function as a keystone nutrient vector -- their impact operates through the nutrient transfer pathway (CASCADE-01) rather than through predation dynamics alone.

**Keystone loss scenario -- what happens when salmon populations decline:**

| Cascade Level | Impact | Mechanism | Source |
|--------------|--------|-----------|--------|
| Stream ecosystem | Reduced aquatic invertebrate biomass; decreased nutrient availability for juvenile fish rearing | Loss of marine-derived N, P, and C from carcass decomposition in streams | PR-02 |
| Bear fitness | Reduced pre-hibernation body mass; lower reproductive success; smaller cubs | Loss of primary high-calorie fall food source (20-33% of annual caloric intake for black bears) | CON-05 |
| Eagle nesting | Reduced nesting success; fewer chicks fledged per nest | Loss of primary winter food source; reduced congregations at spawning sites | CON-05 |
| Riparian tree growth | Trees near salmon-free streams grow up to 3x slower than those near salmon streams | Loss of marine-derived nitrogen subsidy (40-80% of riparian N in healthy systems) | PR-02 |
| Soil invertebrate community | Reduced biomass and diversity of decomposer invertebrates | Loss of salmon carcass substrate that supports blowfly, beetle, and mite communities | PR-02 |
| Songbird density | Reduced insectivorous songbird populations near streams | Cascading loss: fewer invertebrates (less marine N) = less food for birds | PR-02, Dr. John Reynolds (SFU) |
| Mycorrhizal networks | Reduced EMF fungal diversity and network connectivity | Less marine-derived N in soil = less to share through mycorrhizal networks | PR-02 |
| Fungal diversity | Potential loss of EMF species dependent on marine N input | Nutrient-limited soils support lower fungal diversity | PR-02 |
| Forest productivity | Reduced overall forest biomass accumulation; slower successional recovery | Compounding loss: fewer nutrients + weaker mycorrhizal networks + slower tree growth | PR-02, CON-05 |

This is CASCADE-01 running in reverse: each step of nutrient loss propagates forward through the system, and the effects are multiplicative rather than additive. A 50% decline in salmon abundance does not produce a 50% decline in forest nitrogen -- it produces a cascading series of reductions that compound at each trophic transfer.

### Summary Relationship Table: Salmon as Keystone Connector

The following table documents 25 formal relationship entries connecting salmon to dependent species across the ecosystem, using the relationship schema from 00-shared-schemas.md.

| # | Relationship Type | Subtype | Species A | Species B | Directionality | Strength | Cross-Module | Source |
|---|------------------|---------|-----------|-----------|---------------|----------|-------------|--------|
| 1 | nutrient_transfer | marine_derived | Pacific salmon (*Oncorhynchus* spp.) | Freshwater stream ecosystem | unidirectional | obligate | true | PR-02 |
| 2 | predator_prey | predation | Black bear (*Ursus americanus*) | Pacific salmon | unidirectional | facultative | true | PR-02, CON-05 |
| 3 | predator_prey | predation | Grizzly bear (*Ursus arctos horribilis*) | Pacific salmon | unidirectional | facultative | true | CON-05 |
| 4 | predator_prey | predation | Bald eagle (*Haliaeetus leucocephalus*) | Pacific salmon | unidirectional | facultative | true | CON-05 |
| 5 | predator_prey | predation | Gray wolf (*Canis lupus*) | Pacific salmon | unidirectional | opportunistic | true | CON-05 |
| 6 | predator_prey | predation | River otter (*Lontra canadensis*) | Pacific salmon | unidirectional | facultative | true | CON-05 |
| 7 | predator_prey | predation | Osprey (*Pandion haliaetus*) | Pacific salmon | unidirectional | facultative | true | CON-05 |
| 8 | predator_prey | predation | American dipper (*Cinclus mexicanus*) | Salmon eggs / aquatic invertebrates | unidirectional | obligate | true | CON-05 |
| 9 | predator_prey | predation | Northern pikeminnow (*Ptychocheilus oregonensis*) | Juvenile Pacific salmon | unidirectional | facultative | false | GOV-01 |
| 10 | predator_prey | predation | Dolly Varden (*Salvelinus malma*) | Salmon eggs | unidirectional | facultative | false | CON-05 |
| 11 | predator_prey | predation | Bull trout (*Salvelinus confluentus*) | Juvenile Pacific salmon | unidirectional | facultative | false | GOV-01 |
| 12 | nutrient_transfer | decomposition | Salmon carcass material | Riparian forest soil | unidirectional | obligate | true | PR-02 |
| 13 | nutrient_transfer | marine_derived | Riparian soil (marine N) | Sitka spruce (*Picea sitchensis*) | unidirectional | facultative | true | PR-02 |
| 14 | nutrient_transfer | marine_derived | Riparian soil (marine N) | Western hemlock (*Tsuga heterophylla*) | unidirectional | facultative | true | PR-02 |
| 15 | nutrient_transfer | marine_derived | Riparian soil (marine N) | Douglas fir (*Pseudotsuga menziesii*) | unidirectional | facultative | true | PR-02 |
| 16 | symbiotic | mycorrhizal_network | EMF fungi (*Rhizopogon* spp.) | Connected tree network | bidirectional | facultative | true | PR-02 |
| 17 | nutrient_transfer | hyporheic | Pacific salmon | Riparian root zones / hyporheic invertebrates | bidirectional | facultative | true | PR-02 |
| 18 | nutrient_transfer | decomposition | Blowflies (Calliphoridae) | Salmon carcass material | unidirectional | facultative | true | PR-02 |
| 19 | predator_prey | predation | Rove beetles (Staphylinidae) | Carcass-associated fly larvae | unidirectional | opportunistic | true | PR-02 |
| 20 | nutrient_transfer | marine_derived | Salmon carcass material | Deer mouse (*Peromyscus maniculatus*) | unidirectional | opportunistic | true | PR-02 |
| 21 | nutrient_transfer | marine_derived | Marine-enriched invertebrates | Winter wren (*Troglodytes hiemalis*) | unidirectional | facultative | true | PR-02 |
| 22 | competition | interference | Smallmouth bass (*Micropterus dolomieu*) | Juvenile Chinook salmon | unidirectional | facultative | false | GOV-01 |
| 23 | nutrient_transfer | marine_derived | Salmon carcass material | Salmonberry (*Rubus spectabilis*) | unidirectional | facultative | true | PR-02 |
| 24 | nutrient_transfer | marine_derived | Riparian soil (marine N) | Sword fern (*Polystichum munitum*) | unidirectional | opportunistic | true | PR-02 |
| 25 | nutrient_transfer | marine_derived | Bear-deposited salmon carcasses | Riparian soil invertebrate community | unidirectional | facultative | true | PR-02, CON-05 |

**Cross-module count:** 21 of 25 relationships marked `cross_module: true` -- confirming salmon's role as a cross-ecosystem connector.

---

## Document Summary Statistics

| Metric | Count |
|--------|-------|
| Total fish species documented | 51 (43 native + 8 non-native) |
| Salmon stocks individually profiled | 12 (Chinook x4, Coho x2, Sockeye x2, Chum x2, Pink x2, Steelhead x2) |
| Threatened/listed fish (federal + state) | 25+ (10 salmon stocks + 15 other species/populations with federal or state listing) |
| Salmon-dependent wildlife species | 137+ (21 mammals, 41 birds, 15 fish, 30 invertebrate groups, 31 plant groups, 6 fungal groups) |
| Formal relationship entries | 25 (in summary table) + 7 (inline relationship entries in Sections 1-3) = 32 total |
| Cross-module relationships | 21 flagged `cross_module: true` in summary table |
| Source citations used | GOV-01, PR-02, CON-05, Dr. Tom Reimchen (UVic), Dr. John Reynolds (SFU) |
| N-15 pathway steps documented | 5 (ocean -> migration -> bear deposition -> decomposition -> tree uptake) |
| Marine-origin nitrogen in riparian zones | 40-80% (healthy watersheds) |
| CASCADE-01 entries | 5-step cascade fully documented with formal schema entries |

---

*Document created: 2026-03-07 | Phase 606 Plan 01 | PNW Rainforest Biodiversity v1.49.22*
*Shared schemas: [00-shared-schemas.md](./00-shared-schemas.md)*
