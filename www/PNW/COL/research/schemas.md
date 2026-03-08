# Shared Schemas: Species Template, Relationship Schema, and Source Index

> **Foundation document for PNW Rainforest Biodiversity research (v1.49.22)**
>
> All four Wave 1 survey modules (flora, fauna, fungi, aquatic) import these shared definitions.
> This document is the single source of truth for data structures and source attribution.

---

## Species Template

The species template defines a universal entry structure applicable to all taxonomic groups across the four study zones. Each species entry uses the core field groups below plus optional group-specific extensions.

### Identity Fields

All taxonomic groups use these fields.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| common_name | string | required | Standard common name (English) |
| scientific_name | string | required | Binomial nomenclature (*Genus species*) |
| taxonomic_group | enum | required | One of: `vascular_plant`, `bryophyte`, `epiphyte`, `lichen`, `mammal`, `bird`, `amphibian`, `reptile`, `fish`, `invertebrate`, `ectomycorrhizal_fungus`, `arbuscular_mycorrhizal_fungus`, `saprotrophic_fungus`, `lichenized_fungus` |
| taxonomic_hierarchy | object | required | Nested classification with fields: `kingdom`, `phylum`, `class`, `order`, `family`, `genus`, `species` |

### Distribution Fields

All taxonomic groups use these fields.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| zones_present | list[enum] | required | One or more of: `olympic_peninsula`, `cascade_western_slopes`, `columbia_river_gorge`, `oregon_coast_range` |
| habitat_description | string | required | Free text describing primary habitat characteristics |
| elevation_range | object (nullable) | optional | Object with `min_m` (integer) and `max_m` (integer); null when elevation data unavailable |
| endemic_status | enum | required | One of: `none`, `gorge_endemic`, `regional_endemic`, `pnw_endemic` |

### Conservation Fields

All taxonomic groups use these fields.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| federal_status | enum | required | One of: `none`, `endangered`, `threatened`, `candidate`, `species_of_concern` |
| state_status_wa | enum | required | Washington State listing. One of: `none`, `endangered`, `threatened`, `sensitive`, `candidate`, `monitor` |
| state_status_or | enum | required | Oregon State listing. One of: `none`, `endangered`, `threatened`, `sensitive`, `candidate` |
| iucn_status | enum (nullable) | optional | IUCN Red List category. One of: `NE` (Not Evaluated), `DD` (Data Deficient), `LC` (Least Concern), `NT` (Near Threatened), `VU` (Vulnerable), `EN` (Endangered), `CR` (Critically Endangered), `EW` (Extinct in Wild), `EX` (Extinct); null when not assessed |
| trend | enum | required | Population trend. One of: `increasing`, `stable`, `declining`, `unknown` |

### Group-Specific Extension Fields

Use only when applicable to the species' taxonomic group. Survey modules include these fields alongside the core fields above.

#### Flora Extensions (vascular_plant, bryophyte, epiphyte, lichen)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| canopy_layer | enum | required | Vertical position. One of: `emergent`, `canopy`, `understory`, `shrub`, `herb`, `ground` |
| growth_form | string | required | Morphological description (e.g., "evergreen conifer", "perennial forb", "cushion moss") |
| pollination_type | string | optional | Primary pollination mechanism (e.g., "wind", "insect", "self") |
| old_growth_indicator | boolean | required | True if species presence indicates old-growth forest conditions |

#### Fauna Extensions (mammal, bird, amphibian, reptile, fish, invertebrate)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| diet_type | string | required | Primary dietary classification (e.g., "omnivore", "carnivore", "herbivore", "insectivore") |
| migratory_status | enum | required | One of: `resident`, `migratory`, `partial` |
| breeding_habitat | string | required | Description of primary breeding/nesting habitat |
| anomalous_elevation | boolean | required | True if species is found at elevations significantly outside its typical range (e.g., American pika at low elevations in the Gorge) |

#### Fungi Extensions (ectomycorrhizal_fungus, arbuscular_mycorrhizal_fungus, saprotrophic_fungus, lichenized_fungus)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mycorrhizal_type | enum | required | One of: `EMF` (ectomycorrhizal), `AMF` (arbuscular mycorrhizal), `saprotrophic`, `parasitic`, `lichenized` |
| host_tree_species | list[string] | optional | Scientific names of known host trees (e.g., ["Pseudotsuga menziesii", "Tsuga heterophylla"]) |
| old_growth_dependent | boolean | required | True if species requires old-growth forest conditions (e.g., agarikon) |
| commercially_harvested | boolean | required | True if species is commercially harvested in the PNW (e.g., chanterelles, matsutake, morels) |

#### Aquatic Extensions (fish, plus aquatic-linked invertebrate)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| life_history | enum | required | One of: `anadromous` (ocean to freshwater), `resident` (freshwater only), `amphidromous` (moves between but not for breeding) |
| spawning_habitat | string | required | Description of spawning habitat requirements |
| marine_derived_nutrients | boolean | required | True if species transports marine-derived nutrients into terrestrial ecosystems (e.g., all Pacific salmon species) |

### Source Attribution Fields

All taxonomic groups use these fields.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| primary_source | string | required | Reference to a source_id from the Source Index (e.g., "GOV-01", "PR-03") |
| data_quality | enum | required | Data provenance. One of: `verified_agency` (government agency primary data), `peer_reviewed` (published in peer-reviewed journal), `conservation_org` (conservation organization report), `expert_estimate` (professional estimate, not yet published) |

---

## Relationship Schema

The relationship schema defines ecological connections between species. Relationships may be within a single survey module or span multiple modules (cross-module relationships are critical for the Phase 607 synthesis).

### Relationship Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| relationship_type | enum | required | One of: `predator_prey`, `symbiotic`, `nutrient_transfer`, `competition` |
| species_a | string | required | Reference to source species (common_name or scientific_name) |
| species_b | string | required | Reference to target species (common_name or scientific_name) |
| directionality | enum | required | One of: `unidirectional` (A acts on B), `bidirectional` (mutual interaction) |
| strength | enum | required | One of: `obligate` (required for survival), `facultative` (beneficial but not required), `opportunistic` (occurs when conditions allow) |
| mechanism | string | required | Free text describing the ecological mechanism of interaction |
| cross_module | boolean | required | True if relationship spans survey modules (e.g., aquatic species to terrestrial species) |
| source | string | required | Reference to a source_id from the Source Index |

### Relationship Type Definitions

#### Predator-Prey

Direct consumption relationships between species, including herbivory and parasitism.

| Subtype | Directionality | Description | Example |
|---------|---------------|-------------|---------|
| predation | unidirectional | Active hunting and consumption | Black bear predation on salmon |
| herbivory | unidirectional | Plant consumption by animals | Roosevelt elk browsing understory vegetation |
| parasitism | unidirectional | Long-term exploitation without immediate death | Dwarf mistletoe on western hemlock |
| parasitoidism | unidirectional | Parasite eventually kills host | Parasitoid wasps on bark beetle larvae |

#### Symbiotic

Persistent biological interactions between two species living in close association.

| Subtype | Directionality | Description | Example |
|---------|---------------|-------------|---------|
| mutualism | bidirectional | Both species benefit | Douglas fir and *Rhizopogon* truffle (EMF network) |
| commensalism | unidirectional | One benefits, other unaffected | Epiphytic mosses on bigleaf maple branches |
| mycorrhizal_network | bidirectional | Special case: fungal network connecting multiple trees, enabling carbon/nutrient transfer and chemical signaling between hosts | Common Mycorrhizal Network (CMN) linking Douglas fir mother trees to seedlings via *Rhizopogon* spp. |

#### Nutrient Transfer

Movement of nutrients between organisms or ecosystem compartments, often crossing module boundaries.

| Subtype | Directionality | Description | Example |
|---------|---------------|-------------|---------|
| marine_derived | unidirectional | Transfer of marine-origin nutrients (N-15, P) to terrestrial systems via salmon | Salmon carcass nitrogen (N-15) entering riparian soil and tree tissues |
| atmospheric_fixation | unidirectional | Biological nitrogen fixation from atmosphere to soil | Red alder root nodule bacteria fixing atmospheric N2 |
| decomposition | unidirectional | Nutrient release through organic matter breakdown | Saprotrophic fungi decomposing nurse logs, releasing nutrients for seedlings |
| hyporheic | bidirectional | Nutrient exchange through groundwater-surface water interface in streambeds | Dissolved organic matter exchange between salmon streams and riparian root zones |

#### Competition

Negative interactions where species compete for shared resources.

| Subtype | Directionality | Description | Example |
|---------|---------------|-------------|---------|
| exploitative | bidirectional | Indirect competition via shared resource depletion | Western hemlock and Sitka spruce competing for canopy light gaps |
| interference | unidirectional | Direct blocking of resource access | Invasive bullfrogs displacing northwestern pond turtle from basking sites |
| apparent | bidirectional | Indirect competition via shared predator or disease | Native and non-native trout sharing predation pressure from river otters |

### Cascade Relationships

Cascades represent multi-step ecological chains that cross module boundaries. They are the connective tissue of the ecosystem model and are essential for the Phase 607 network synthesis.

#### Cascade Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cascade_id | string | required | Unique identifier for the cascade (e.g., "CASCADE-01") |
| cascade_name | string | required | Descriptive name (e.g., "Salmon-Forest Nutrient Cascade") |
| steps | list[object] | required | Ordered list of relationship entries forming the cascade chain |
| modules_spanned | list[string] | required | Which survey modules this cascade connects (e.g., ["aquatic", "fauna", "flora", "fungi"]) |
| source | string | required | Primary source_id supporting the cascade model |

#### Example Cascade: Salmon-Forest Nutrient Cascade (CASCADE-01)

This cascade traces the marine-derived nitrogen pathway from ocean through the entire forest ecosystem, demonstrating why salmon decline affects tree growth and fungal diversity miles from any stream.

| Step | Species A | Relationship Type | Species B | Mechanism |
|------|-----------|-------------------|-----------|-----------|
| 1 | Pacific salmon (*Oncorhynchus* spp.) | nutrient_transfer (marine_derived) | Riparian soil | Salmon accumulate marine N-15 at sea, transport to freshwater via spawning migration |
| 2 | Black bear (*Ursus americanus*) | predator_prey (predation) | Pacific salmon | Bears ferry 500-700 salmon per season into forest; carcass remnants deposit N-15 on forest floor |
| 3 | Salmon carcass / bear scat | nutrient_transfer (decomposition) | Forest floor soil | Decomposition releases marine-derived N, P, and C into soil; 40-80% of riparian N is marine-origin |
| 4 | Douglas fir (*Pseudotsuga menziesii*) | symbiotic (mycorrhizal_network) | EMF fungi (*Rhizopogon* spp.) | Tree roots access soil nutrients via ectomycorrhizal fungal sheaths (Hartig net) |
| 5 | EMF fungi (*Rhizopogon* spp.) | symbiotic (mycorrhizal_network) | Connected tree network | Fungal hyphae redistribute carbon, water, and nutrients between trees; mother trees preferentially supply seedlings |

**Modules spanned:** aquatic, fauna, flora, fungi
**Source:** PR-02 (Hocking & Reimchen 2002), PR-03 (Simard et al. 1997)

---

## Source Index

> **Usage note:** All survey modules MUST use `source_id` values when attributing data to specific sources. Every numerical claim, species count, percentage, or ecological finding must reference a source_id from this index. This supports safety requirements SC-03 (all sources professional/academic) and SC-05 (no unsourced numerical claims) from the mission package verification matrix.

### Category 1: Government and Agency Sources

Primary data from federal agencies conducting field research, species monitoring, and ecosystem management within the study region.

| source_id | Organization | Resource | Domain | URL Pattern | Reliability |
|-----------|-------------|----------|--------|-------------|-------------|
| GOV-01 | U.S. Geological Survey (USGS) | Ecology of Columbia River Gorge National Scenic Area | general | usgs.gov/centers/forest-and-rangeland-ecosystem-science-center | primary_data |
| GOV-02 | USDA Climate Hubs, Northwest Region | Northwest Forests and Woodlands | climate | climatehubs.usda.gov/hubs/northwest | synthesis |
| GOV-03 | USDA Forest Service | Columbia River Gorge National Scenic Area | flora | fs.usda.gov/crgnsa | primary_data |
| GOV-04 | National Park Service (NPS) | Olympic National Park Temperate Rain Forests | general | nps.gov/olym | primary_data |
| GOV-05 | USDA Forest Service, PNW Research Station | Mycorrhizal Symbioses in Temperate Forests (Gen. Tech. Rep. PSW-151) | fungi | fs.usda.gov/pnw | synthesis |
| GOV-06 | USDA Forest Service | Ectomycorrhizal Fungal Diversity in PNW Forests (Gen. Tech. Rep. PNW-GTR-431) | fungi | fs.usda.gov/pnw | primary_data |

### Category 2: Peer-Reviewed Research

Published research from university and institutional scientists providing quantitative data, experimental findings, and theoretical frameworks used throughout the survey modules.

| source_id | Authors | Year | Title | Journal / Publisher | Citation | Domain | Key Finding |
|-----------|---------|------|-------|---------------------|----------|--------|-------------|
| PR-01 | Brandt, P. et al. | 2014 | Multifunctionality and biodiversity: Ecosystem services in temperate rainforests | *Biological Conservation* | 169: 362-371 | general | Temperate rainforests deliver disproportionate ecosystem services relative to area; biodiversity underpins multifunctionality |
| PR-02 | Hocking, M.D. & Reimchen, T.E. | 2002 | Salmon-derived nitrogen in terrestrial invertebrates from coniferous forests of the Pacific Northwest | *BMC Ecology* | 2:4 | aquatic | Marine-derived N-15 from salmon is detectable in terrestrial invertebrates at all trophic levels, confirming nutrient transfer from ocean to forest |
| PR-03 | Simard, S.W. et al. | 1997 | Net transfer of carbon between ectomycorrhizal tree species in the field | *Nature* | 388: 579-582 | fungi | First field evidence of bidirectional carbon transfer between paper birch and Douglas fir via shared mycorrhizal networks |
| PR-04 | DellaSala, D.A. | 2011 | *Temperate and Boreal Rainforests of the World: Ecology and Conservation* | Island Press | ISBN 978-1597266758 | general | Comprehensive reference establishing Pacific temperate rainforests as globally significant biome with highest biomass of any terrestrial ecosystem |
| PR-05 | Simard, S.W. | 2021 | *Finding the Mother Tree: Discovering the Wisdom of the Forest* | Allen Lane / Penguin Random House | ISBN 978-0735237759 | fungi | Accessible synthesis of 30 years of mycorrhizal network research; documents mother tree hub-node architecture where single Douglas fir connects to 47 others |

### Category 3: Conservation Organizations

Non-governmental organizations conducting species conservation, habitat protection, and ecological monitoring in the study region.

| source_id | Organization | Focus | Domain | Relevance |
|-----------|-------------|-------|--------|-----------|
| CON-01 | Friends of the Columbia Gorge | Wonders of the Gorge; Protecting Imperiled Wildlife | flora, fauna | Primary advocacy organization for Gorge endemic species; documents 15 endemic wildflowers and endangered wildlife habitat |
| CON-02 | Columbia Land Trust | Columbia River Gorge conservation projects | general | Land acquisition and habitat restoration in the Gorge; manages conservation easements protecting endemic species habitat |
| CON-03 | The Conservation Fund | Pacific Northwest Forest Protection | flora | Large-scale forest conservation acquisitions; protects old-growth stands critical for EMF networks and spotted owl habitat |
| CON-04 | One Earth / WWF | Central Pacific Northwest Coastal Forests ecoregion | general | Global ecoregion classification placing PNW temperate rainforest in planetary biodiversity context |
| CON-05 | Wild Salmon Center | Salmon as keystone species research | aquatic | Research and advocacy linking salmon population health to terrestrial ecosystem function; documents 137+ wildlife species dependent on salmon |

### Key Researchers

Individual researchers whose work is foundational to this study. Their institutional affiliations and primary contributions are documented here for attribution across all survey modules.

| Researcher | Institution | Primary Domain | Key Contribution |
|------------|------------|----------------|------------------|
| Dr. Suzanne Simard | University of British Columbia (UBC) | fungi, flora | Mycorrhizal network architecture; discovery of Common Mycorrhizal Networks (CMNs) and mother tree hub-node model; demonstrated bidirectional carbon transfer between tree species via shared fungal networks |
| Dr. Tom Reimchen | University of Victoria (UVic) | aquatic, fauna | Salmon-derived nitrogen research; N-15 isotope tracking demonstrating marine nutrient transfer into terrestrial food webs; quantified 40-80% marine-origin nitrogen in riparian vegetation |
| Dr. John Reynolds | Simon Fraser University (SFU) | aquatic, general | 50-watershed salmon-ecosystem impact study; quantified relationship between salmon abundance and forest productivity, invertebrate biomass, and songbird density across landscape scales |

### Source Index Summary

| Category | Count | source_id Range |
|----------|-------|-----------------|
| Government and Agency Sources | 6 | GOV-01 through GOV-06 |
| Peer-Reviewed Research | 5 | PR-01 through PR-05 |
| Conservation Organizations | 5 | CON-01 through CON-05 |
| Key Researchers | 3 | (referenced by name) |
| **Total** | **19** | |

All sources are traceable to government agencies, peer-reviewed journals, or established conservation organizations. Zero entertainment media sources are included in this index.

---

*Document created: 2026-03-07 | Phase 602 Plan 01 | PNW Rainforest Biodiversity v1.49.22*
