# PNW Mammalian Taxonomy -- Shared Species Card Schema

> **Structural reference for all PNW Mammalian Taxonomy species profiles**
>
> This document defines the species card template, marine mammal profile extensions, relationship schema, and cross-reference conventions used by all six research modules. Every species profile produced during Waves 1-3 follows this schema exactly.
>
> **Design principle:** Consistent structure enables cross-module referencing, elevation-matrix population, and downstream chipset derivation. No module should invent ad-hoc fields. When a field does not apply to a given species, use the documented null convention rather than omitting the field.
>
> **Upstream dependency:** This schema references elevation bands, habitat types, ecological roles, conservation status categories, and cultural significance frameworks from the ECO shared-attributes document (`www/PNW/ECO/research/shared-attributes.md`). All IDs (ELEV-xxx, HAB-xxx, ROLE-xxx, CULT-xxx) are defined there.

---

## 1. Terrestrial Mammal Species Card Template

Every terrestrial mammal species profile uses the following template. Fields marked REQUIRED must appear in every profile. Fields marked CONDITIONAL appear when the condition is met. Fields marked OPTIONAL provide enrichment when data exists.

---

```markdown
### [Common Name] (*Scientific name*)

**Taxonomy**
| Field | Value |
|-------|-------|
| Order | [Taxonomic order] |
| Family | [Taxonomic family] |
| Genus | [Genus] |
| Species | [species epithet] |
| Subspecies | [if applicable; note if PNW populations represent a distinct subspecies] |
| Taxonomic authority | [accepted authority -- e.g., Wilson & Reeder 2005, ASM Mammal Diversity Database] |

**Size & Morphometrics**
| Field | Value |
|-------|-------|
| Size class | [large (>20 kg) / medium (1-20 kg) / small (50 g - 1 kg) / micro (<50 g)] |
| Total length | [range in cm, including tail; note sexual dimorphism if >10% difference] |
| Mass | [range in g or kg; male/female ranges if sexually dimorphic] |
| Distinguishing features | [2-3 key field marks for identification] |

**Habitat & Distribution**
| Field | Value |
|-------|-------|
| Habitat type | [HAB-ID(s) from ECO shared-attributes] |
| Locomotion mode | [terrestrial / fossorial / arboreal / volant / scansorial / semi-aquatic] |
| Elevation range | [feet range] ([meters]) |
| Ecoregion bands | [ELEV-xxx ID(s) -- primary and secondary] |
| Minecraft Y range | [y=min to y=max] |
| PNW distribution | [2-3 sentences: which states/provinces, which mountain ranges, habitat specifics] |

**Ecological Profile**
| Field | Value |
|-------|-------|
| Ecological role(s) | [ROLE-xxx ID(s) from ECO shared-attributes] |
| Diet | [dietary category: carnivore / herbivore / omnivore / insectivore / fungivore / piscivore] |
| Trophic level | [primary consumer / secondary consumer / tertiary consumer / apex predator] |
| Key prey/food items | [3-5 primary food sources] |
| Key predators | [list predator species; cross-ref AVI raptor profiles where applicable] |

**Reproductive Ecology**
| Field | Value |
|-------|-------|
| Breeding season | [month range] |
| Gestation | [days or months] |
| Litter size | [range, typical] |
| Weaning age | [days or months] |
| Sexual maturity | [age] |
| Lifespan | [wild max / typical; captive if notably different] |

**Conservation Status**
| Field | Value |
|-------|-------|
| ESA status | [Endangered / Threatened / Species of Concern / Candidate / Not listed / Delisted] |
| MMPA status | [N/A for terrestrial species] |
| WA state status | [Endangered / Threatened / Sensitive / Candidate / Not listed / Monitor] |
| OR state status | [Endangered / Threatened / Sensitive-Critical / Sensitive-Vulnerable / Not listed] |
| IUCN Red List | [CR / EN / VU / NT / LC / DD / NE] |
| NatureServe rank | [G-rank S-rank] |
| Population trend | [increasing / stable / decreasing / unknown] |

**Ecological Interaction** (one highlighted interaction)
[2-3 sentences describing a single notable ecological interaction -- predator-prey, mutualism, ecosystem engineering, competition, or parasitism. Include the interacting species by common and scientific name.]

**Cultural Note** (one cultural or human-wildlife connection)
[2-3 sentences. Must name a specific Indigenous nation if referencing TEK. May also reference human-wildlife conflict dynamics or skill-creator metaphor. Source must be from published, Nation-authorized material.]

**Salmon Thread**
| Field | Value |
|-------|-------|
| Salmon-connected | [yes / no] |
| Connection | [if yes: brief description of how this species connects to salmon ecology -- e.g., marine-derived nutrients, riparian habitat, predation] |

**White-Nose Syndrome** (CONDITIONAL: Chiroptera only)
| Field | Value |
|-------|-------|
| WNS status | [present / not-detected / not-susceptible / unknown] |
| WNS notes | [detection year if present; susceptibility assessment; monitoring status] |

**Key Sources**
[Minimum 2 source IDs from source-index.md -- e.g., G09, P01, O04]

**Cross-Module References**
- [Links to related species/networks in other MAM modules or PNW series documents]
- Format: `See [module]: [species or topic]`
```

---

## 2. Marine Mammal Species Card Template

Marine mammal profiles use all fields from the terrestrial template above with the following extensions and modifications.

### Modifications to Base Template

- **Locomotion mode:** Always `aquatic` or `semi-aquatic` (for pinnipeds)
- **MMPA status:** REQUIRED (replace N/A with actual MMPA stock designation)
- **Salmon Thread:** Especially important for orca, harbor seal, Steller sea lion, and other piscivorous marine mammals

### Marine Mammal Extension Fields

```markdown
**Marine Mammal Profile Extension**
| Field | Value |
|-------|-------|
| MMPA stock | [official NOAA stock name -- e.g., "Eastern North Pacific Southern Resident" for SRKW] |
| Stock assessment reference | [NOAA SAR year and document ID -- e.g., "NOAA-TM-NMFS-SWFSC-XXX, 2024"] |
| Stock status (MMPA) | [strategic / non-strategic / depleted] |
| Ecotype | [CONDITIONAL: for orca -- resident / Bigg's (transient) / offshore; for harbor seal -- coastal / inland] |
| Critical habitat designation | [yes (Federal Register cite) / no / proposed] |
| Haul-out site regions | [CONDITIONAL: for pinnipeds -- generalized to county/watershed level per safety rules; NEVER specific GPS or site names for ESA-listed species] |
| Migration pattern | [resident / seasonal migrant / passage migrant / vagrant / irruptive] |
| PNW seasonal presence | [month range when typically present; "year-round" for residents] |
| Strandings data source | [NOAA West Coast Stranding Network reference if applicable] |

**Ecotype Details** (CONDITIONAL: Orcinus only)
| Field | Value |
|-------|-------|
| Ecotype | [resident / Bigg's / offshore / transient] |
| Proposed taxonomy | [O. orca ater (resident) / O. orca rectipinnus (Bigg's) per Morin et al. 2024 / pending SMM review] |
| Population (most recent census) | [count, year, source] |
| Pod structure | [matriline description if applicable] |
| Primary prey | [fish-specialist / marine-mammal-specialist / generalist] |
| Cultural significance | [Nation-specific: Coast Salish, Lummi, Makah, Nuu-chah-nulth connections] |
```

---

## 3. Paleontological Species Card Template

For Pleistocene megafauna documented in Module 5 (Evolutionary Biology), use a modified card.

```markdown
### [Common Name] (*Scientific name*) -- EXTINCT

**Taxonomy**
| Field | Value |
|-------|-------|
| Order | [Taxonomic order] |
| Family | [Taxonomic family] |
| Genus | [Genus] |
| Species | [species epithet] |
| Extinction date | [approximate years BP; period (Late Pleistocene / Early Holocene)] |
| Cause of extinction | [climate change / human hunting / combination / unknown] |

**Size & Morphometrics**
| Field | Value |
|-------|-------|
| Size class | [mega (>1,000 kg) / large / medium] |
| Estimated mass | [range in kg; based on fossil evidence] |
| Distinguishing features | [key morphological characters from fossil record] |

**PNW Fossil Record**
| Field | Value |
|-------|-------|
| Known PNW sites | [generalized locations -- county level; NEVER GPS coordinates] |
| Specimen repositories | [Burke Museum, Oregon Museum of Science and Industry, university collections] |
| Key publications | [source IDs] |

**Ecological Legacy**
[2-3 sentences on how this species' extinction altered PNW ecosystems. What modern species occupy parts of its former niche? What ecological functions were lost?]

**Modern Analog**
| Field | Value |
|-------|-------|
| Closest living relative | [species name] |
| Niche overlap | [brief description of ecological similarity/difference] |

**Key Sources**
[Minimum 2 source IDs]
```

---

## 4. Field Definitions and Vocabulary

### Size Classes

| Class | Mass Range | Examples |
|-------|-----------|----------|
| mega | >1,000 kg | Gray whale, humpback whale, orca (extinct: mammoth, mastodon) |
| large | 20-1,000 kg | Black bear, elk, cougar, harbor seal, sea otter |
| medium | 1-20 kg | Beaver, river otter, marten, porcupine, raccoon |
| small | 50 g - 1 kg | Douglas squirrel, chipmunk, pika, muskrat, mountain beaver |
| micro | <50 g | Shrews, voles, mice, most bats |

### Locomotion Modes

| Mode | Definition | Examples |
|------|-----------|----------|
| terrestrial | Primarily ground-dwelling, walking/running | Deer, elk, bear, wolf, cougar |
| fossorial | Burrowing; spends significant time underground | Pocket gopher, mole, mountain beaver |
| arboreal | Tree-dwelling; primary habitat in forest canopy | Red tree vole, northern flying squirrel, Douglas squirrel |
| volant | Capable of powered flight | All Chiroptera (bats) |
| scansorial | Climbs but not exclusively arboreal | Raccoon, porcupine, marten, fisher |
| semi-aquatic | Divides time between land and water | Beaver, river otter, muskrat, mink, water shrew |
| aquatic | Fully aquatic; does not voluntarily come ashore (or only for breeding/hauling) | Cetaceans; sea otter (semi-aquatic in some classifications); pinnipeds haul out but are primarily aquatic |

### Diet Categories

| Category | Definition | Examples |
|----------|-----------|----------|
| carnivore | >90% animal matter | Wolf, cougar, orca, weasel, shrew |
| herbivore | >90% plant matter | Elk, mountain goat, pika, mountain beaver, porcupine |
| omnivore | Mixed plant and animal matter | Black bear, raccoon, opossum, deer mouse |
| insectivore | Primarily arthropods | Bats (most PNW species), shrews, moles |
| fungivore | Primarily fungi (truffles, mushrooms) | Red-backed vole, northern flying squirrel (partial) |
| piscivore | Primarily fish | River otter, mink (partial), resident orca |
| mycophagy-disperser | Consumes fungi and disperses spores in fecal pellets | Red-backed vole, deer mouse, northern flying squirrel |

### Trophic Levels

| Level | Definition |
|-------|-----------|
| primary consumer | Feeds on plants, fungi, or algae |
| secondary consumer | Feeds on primary consumers |
| tertiary consumer | Feeds on secondary consumers |
| apex predator | No natural predators in its ecosystem; top of food chain |

---

## 5. Relationship Schema

Species profiles include one highlighted ecological interaction. The relationship types below define the vocabulary for cross-referencing ecological connections between species.

### Relationship Types

| Relationship ID | Type | Definition | Example |
|----------------|------|-----------|---------|
| REL-PRED | Predator-prey | Direct predation between species | Orca -> Chinook salmon; cougar -> mule deer |
| REL-KEYSTONE | Keystone interaction | Interaction where one species has disproportionate effect on community structure | Sea otter -> sea urchin -> kelp forest cascade |
| REL-ENGINEER | Ecosystem engineering | One species physically modifies habitat used by the other | Beaver dam -> salmon rearing habitat; pocket gopher -> soil turnover -> plant diversity |
| REL-MUTUALIST | Mutualism | Both species benefit from the interaction | Vole disperses mycorrhizal fungal spores -> fungus colonizes tree roots -> tree provides carbon to fungus |
| REL-COMMENSAL | Commensalism | One species benefits, other unaffected | Deer mouse nesting in woodpecker cavity |
| REL-COMPETITION | Competition | Both species compete for the same resource | Barred owl vs. spotted owl (interspecific); wolf vs. cougar (interference) |
| REL-PARASITE | Parasitism / Disease | One species benefits at the expense of the other | White-nose syndrome (*Pseudogymnoascus destructans*) -> bat species |
| REL-FACILITATION | Facilitation | One species creates conditions that benefit another (beyond engineering) | Salmon carcass nitrogen -> riparian vegetation -> bear habitat quality |
| REL-SCAVENGE | Scavenging | One species feeds on carrion of the other | Bear / eagle / raven scavenging wolf-killed ungulate |
| REL-TROPHIC-CASCADE | Trophic cascade | Indirect effect transmitted through 2+ trophic levels | Wolf -> elk behavior change -> willow recovery -> beaver habitat -> salmon rearing |

### Relationship Notation Format

In species profiles, ecological interactions reference the relationship type and cross-referenced species:

```
**Ecological Interaction** [REL-MUTUALIST]
The California red-backed vole (*Myodes californicus*) consumes truffles -- the
underground fruiting bodies of ectomycorrhizal fungi -- and deposits viable fungal
spores in fecal pellets throughout the forest floor. These spores colonize conifer
rootlets, establishing the mycorrhizal networks essential for tree nutrient uptake.
The vole depends on old-growth forest structure for cover; the forest depends on the
vole for fungal dispersal. See M4: Old-Growth Forest Community; M6: Mycorrhizal
Dispersal Network.
```

---

## 6. Cross-Reference Conventions

### Within MAM Modules

Cross-references between the six MAM modules use this format:

```
See M1: Gray wolf (apex predator, elk population regulation)
See M2: Northern flying squirrel (primary prey item)
See M3: Southern Resident killer whale (orca ecotype comparison)
See M4: Alpine Community (mountain goat keystone herbivore)
See M5: Columbian mammoth (Pleistocene niche predecessor)
See M6: Beaver as Watershed Architect (engineering interaction)
```

### To ECO Shared Attributes

Reference the ECO shared-attributes document for elevation bands, habitat types, ecological roles, and conservation status definitions:

```
Elevation: ELEV-ALPINE (see ECO shared-attributes 1.1)
Habitat: HAB-OLD-GROWTH (see ECO shared-attributes 2.1)
Role: ROLE-ECOSYSTEM-ENGINEER (see ECO shared-attributes 3.9)
```

### To AVI (Avian Taxonomy) Species

Cross-references to avian species use the format established in the PNW Avian Taxonomy:

```
Predator: Bald eagle (AVI: Haliaeetus leucocephalus) -- scavenges salmon carcasses
  alongside bears; both are salmon-thread species
Predator: Northern goshawk (AVI: Accipiter gentilis) -- preys on Douglas squirrel
  and snowshoe hare in montane forest
Competitor: Great horned owl (AVI: Bubo virginianus) -- nocturnal predator overlap
  with mesocarnivores (marten, fisher)
```

### To PNW Research Series Documents

Cross-references to COL (Columbia Valley), CAS (Cascade Range), and other PNW series documents:

```
See CAS: Cascade Range Biodiversity -- alpine mammal community context
See COL: Columbia Valley Rainforest -- temperate rainforest mammal habitat
See ECO: PNW Living Systems -- shared attribute definitions
```

### To GSD Skill-Creator

The mammal-as-skill metaphor framework connects mammalian adaptations to skill-creator patterns:

```
Skill metaphor: Beaver dam construction -> Infrastructure-as-code pattern
  (see M6: Mammal-as-Skill Framework, skill-creator pattern language)
```

---

## 7. Null Conventions

When a field does not apply to a given species or data is unavailable, use these standardized null values rather than omitting the field:

| Field | Null Convention |
|-------|----------------|
| Subspecies | "Monotypic in PNW" or "No recognized PNW subspecies" |
| ESA status | "Not listed" |
| WA state status | "Not listed" or "Not evaluated" |
| OR state status | "Not listed" or "Not evaluated" |
| MMPA status | "N/A" (terrestrial species) |
| WNS status | "N/A" (non-Chiroptera) |
| Salmon Thread | "no" with Connection field: "No documented connection to salmon ecology" |
| Cultural Note | "Not specifically documented in available published sources" -- never fabricate cultural associations |
| Critical habitat designation | "No critical habitat designated" |
| Haul-out site regions | "N/A" (cetaceans; or "Not documented" for pinnipeds) |
| Population trend | "Unknown" (when monitoring data is insufficient) |

---

## 8. Safety Boundaries in Species Cards

These constraints are absolute and override all other schema instructions.

### Location Data (ABSOLUTE)

- **Never** include GPS coordinates, specific den sites, roost locations, haul-out site names, or calving areas for any ESA-listed or MMPA-protected species.
- Haul-out sites for pinnipeds: generalize to county or watershed level (e.g., "outer Olympic coast, Jefferson and Clallam counties").
- Wolverine, fisher, and lynx den locations: generalize to mountain range or wilderness area (e.g., "North Cascades Wilderness complex").

### Population Data (GATE)

- All population counts must cite a government source (NOAA, USFWS, USGS, WDFW, ODFW) or peer-reviewed study.
- Never estimate population numbers without a cited source.
- Use the most recent available count and note the year.

### Indigenous Knowledge (ABSOLUTE)

- Every cultural reference names a specific nation.
- Never extrapolate one nation's knowledge to another.
- Never include culturally restricted information (ceremony specifics, sacred site locations, medicine preparation details).
- Source must be published and community-authorized (O06-O08, O19-O23, O27-O28 or equivalent).

### Conservation Advocacy (ANNOTATE)

- Present conservation status and threats factually.
- Do not advocate for specific policy positions (e.g., "wolves should be relisted" or "hunting seasons should be closed").
- Note ongoing management controversies without endorsing a position.

---

## 9. Example Profiles

### Terrestrial Example: American Pika

```markdown
### American Pika (*Ochotona princeps*)

**Taxonomy**
| Field | Value |
|-------|-------|
| Order | Lagomorpha |
| Family | Ochotonidae |
| Genus | Ochotona |
| Species | princeps |
| Subspecies | Multiple PNW subspecies recognized; taxonomy under review |
| Taxonomic authority | Smith & Weston 1990 (Mammalian Species No. 352) |

**Size & Morphometrics**
| Field | Value |
|-------|-------|
| Size class | small |
| Total length | 16.2-21.6 cm (no external tail) |
| Mass | 121-176 g; no significant sexual dimorphism |
| Distinguishing features | Round ears, no visible tail, grayish-brown pelage, distinctive high-pitched alarm call ("eenk!") |

**Habitat & Distribution**
| Field | Value |
|-------|-------|
| Habitat type | HAB-ALPINE-MEADOW |
| Locomotion mode | terrestrial |
| Elevation range | 5,000-13,000 ft (1,524-3,962 m) |
| Ecoregion bands | ELEV-ALPINE (primary), ELEV-SUBALPINE (secondary) |
| Minecraft Y range | y=84 to y=319 |
| PNW distribution | Talus slopes and rock fields in the Cascades (WA, OR), Olympics, Blue Mountains (OR), Wallowa Mountains, northern Rockies extending into ID. Absent from Coast Range. |

**Ecological Profile**
| Field | Value |
|-------|-------|
| Ecological role(s) | ROLE-PRIMARY-CONSUMER, ROLE-INDICATOR |
| Diet | herbivore |
| Trophic level | primary consumer |
| Key prey/food items | Grasses, sedges, forbs, lichen, moss; builds "haypiles" of dried vegetation for winter |
| Key predators | American marten (*Martes americana*), long-tailed weasel (*Neogale frenata*), golden eagle (AVI: *Aquila chrysaetos*), red-tailed hawk (AVI: *Buteo jamaicensis*) |

**Reproductive Ecology**
| Field | Value |
|-------|-------|
| Breeding season | April-June (after snowmelt) |
| Gestation | 30 days |
| Litter size | 2-6 (typically 3) |
| Weaning age | ~30 days |
| Sexual maturity | 1 year (breed in second summer) |
| Lifespan | 7 years maximum in wild; typically 3-4 years |

**Conservation Status**
| Field | Value |
|-------|-------|
| ESA status | Species of Concern (petition for listing denied 2010) |
| MMPA status | N/A |
| WA state status | Not listed |
| OR state status | Sensitive-Vulnerable |
| IUCN Red List | LC |
| NatureServe rank | G5 S4 (WA), G5 S4 (OR) |
| Population trend | Decreasing at low-elevation range margins; stable at high elevations |

**Ecological Interaction** [REL-FACILITATION]
Pika haypiles -- cached collections of dried vegetation stored in talus interstices -- serve as food sources for other alpine mammals including golden-mantled ground squirrels and bushy-tailed woodrats during harsh winters when other food is scarce. The pika's territory defense and alarm calling also alerts neighboring species to approaching predators, creating an alpine early-warning system.

**Cultural Note**
Not specifically documented in available published sources for PNW nations. The pika's behavior of caching food for winter parallels the ahead-of-time compilation pattern in skill-creator: pre-processing resources during favorable conditions for later use.

**Salmon Thread**
| Field | Value |
|-------|-------|
| Salmon-connected | no |
| Connection | No documented connection to salmon ecology |

**White-Nose Syndrome**
| Field | Value |
|-------|-------|
| WNS status | N/A |

**Key Sources**
P25 (Smith & Weston 1990), G09 (WDFW SWAP), P26 (Ray et al. 2012)

**Cross-Module References**
- See M4: Alpine Community (talus habitat specialist, climate indicator)
- See M5: Glacial Refugia (alpine isolate populations, climate sensitivity)
- See CAS: Cascade Range Biodiversity -- alpine zone context
```

### Marine Example: Southern Resident Killer Whale

```markdown
### Southern Resident Killer Whale (*Orcinus orca ater* -- proposed)

**Taxonomy**
| Field | Value |
|-------|-------|
| Order | Artiodactyla (Cetacea) |
| Family | Delphinidae |
| Genus | Orcinus |
| Species | orca |
| Subspecies | ater (proposed; Morin et al. 2024; provisionally recognized by SMM Taxonomy Committee) |
| Taxonomic authority | SMM Taxonomy Committee; NOAA Fisheries 2024 (G03) |

**Size & Morphometrics**
| Field | Value |
|-------|-------|
| Size class | mega |
| Total length | Males 6.0-8.0 m; females 5.0-7.0 m |
| Mass | Males 3,600-5,400 kg; females 1,400-3,800 kg; marked sexual dimorphism |
| Distinguishing features | Black and white coloration, tall dorsal fin (males up to 1.8 m), saddle patch behind dorsal fin (individually unique), rounded pectoral fins (vs. pointed in Bigg's ecotype) |

**Habitat & Distribution**
| Field | Value |
|-------|-------|
| Habitat type | HAB-PELAGIC, HAB-KELP (foraging), HAB-DEEP-BASIN |
| Locomotion mode | aquatic |
| Elevation range | Sea level to -930 ft (0 to -283 m) |
| Ecoregion bands | ELEV-DEEP-MARINE (primary), ELEV-SHALLOW-MARINE (primary) |
| Minecraft Y range | y=-64 to y=-41 |
| PNW distribution | Salish Sea (Puget Sound, Strait of Georgia, Strait of Juan de Fuca), outer WA/OR coast, and seasonally to central California. Core summer habitat in San Juan Islands and southern Gulf Islands. |

**Ecological Profile**
| Field | Value |
|-------|-------|
| Ecological role(s) | ROLE-APEX, ROLE-KEYSTONE |
| Diet | piscivore (fish specialist) |
| Trophic level | apex predator |
| Key prey/food items | Chinook salmon (>80% of diet by biomass), chum salmon, Coho salmon, lingcod, halibut |
| Key predators | None (apex) |

**Reproductive Ecology**
| Field | Value |
|-------|-------|
| Breeding season | Year-round; peak conception Oct-Jan |
| Gestation | 17 months |
| Litter size | 1 (twins extremely rare) |
| Weaning age | ~2 years (nursing continues intermittently) |
| Sexual maturity | Females 12-15 years; males 15-18 years |
| Lifespan | Females 50-80 years (maximum ~90); males 30-50 years (maximum ~60) |

**Conservation Status**
| Field | Value |
|-------|-------|
| ESA status | Endangered (listed 2005) |
| MMPA status | Depleted, Strategic |
| WA state status | Endangered |
| OR state status | Not separately listed (federal ESA applies) |
| IUCN Red List | EN (as part of global orca assessment; SRKW population specifically CR) |
| NatureServe rank | G4T1 (global orca secure; SRKW DPS critically imperiled) |
| Population trend | Decreasing (73 individuals, July 2024 census) |

**Ecological Interaction** [REL-TROPHIC-CASCADE]
The Southern Resident killer whale's dependence on Chinook salmon creates a trophic cascade connecting ocean, river, and forest ecosystems. Declining Chinook runs -- caused by dam construction, habitat loss, and hatchery practices -- directly reduce orca foraging success. Conversely, orca predation historically helped regulate salmon population dynamics and age structure. The SRKW-Chinook link is the most visible thread in the salmon-forest-ocean nutrient cycle that defines PNW ecology.

**Cultural Note**
The Lummi Nation (O19) regards orcas as relatives -- the blackfish people -- and was instrumental in the effort to return Tokitae (Lolita), a Southern Resident captured in 1970, from captivity before her death in 2023. Coast Salish peoples throughout the Salish Sea region hold orcas as culturally significant beings depicted in art, story, and ceremony. The orca is a crest animal for multiple Coast Salish and Kwakwaka'wakw families.

**Salmon Thread**
| Field | Value |
|-------|-------|
| Salmon-connected | yes |
| Connection | Obligate Chinook salmon specialist; population recovery directly dependent on Chinook restoration. The defining salmon-thread species in the marine mammal module. |

**Marine Mammal Profile Extension**
| Field | Value |
|-------|-------|
| MMPA stock | Eastern North Pacific Southern Resident |
| Stock assessment reference | NOAA-TM-NMFS-SWFSC, 2024 (G15) |
| Stock status (MMPA) | Strategic, Depleted |
| Ecotype | Resident (fish-specialist) |
| Critical habitat designation | Yes -- 50 CFR 226.206; Puget Sound inland waters (2006) and outer coast (2021) |
| Haul-out site regions | N/A (fully aquatic) |
| Migration pattern | Seasonal migrant (core summer: Salish Sea; winter: outer coast WA/OR to central CA) |
| PNW seasonal presence | Year-round in PNW waters; concentrated in Salish Sea May-October |
| Strandings data source | NOAA West Coast Marine Mammal Stranding Network |

**Ecotype Details**
| Field | Value |
|-------|-------|
| Ecotype | Resident |
| Proposed taxonomy | *Orcinus orca ater* (Morin et al. 2024; SMM provisional recognition) |
| Population (most recent census) | 73 individuals (July 2024; O01) |
| Pod structure | Three pods (J, K, L) organized by matrilines; lifelong maternal bonds |
| Primary prey | Fish specialist (Chinook salmon >80%) |
| Cultural significance | Coast Salish (Lummi, Tulalip, Samish); Makah; Nuu-chah-nulth -- crest animal, relative, ceremonial figure |

**Key Sources**
G02, G03, G04, G13, G14, P06, P17, P18, P36, O01, O02, O19

**Cross-Module References**
- See M1: Gray wolf (parallel apex predator recovery narrative)
- See M4: Salish Sea Marine Community (apex predator role)
- See M5: Orca Ecotype Speciation (evolutionary divergence)
- See M6: Orca as Coast Salish Relative (cultural significance)
- See AVI: Bald eagle (shared salmon-thread connection)
- See ECO: Salmon-Forest-Ocean Nutrient Cycle
```

---

## 10. Chiroptera-Specific Extension: White-Nose Syndrome Protocol

All bat species profiles (Order Chiroptera) must include the White-Nose Syndrome (WNS) status field. WNS is caused by the fungus *Pseudogymnoascus destructans* (Pd) and has killed millions of bats in North America since 2006.

### WNS Status Values

| Status | Definition | Usage |
|--------|-----------|-------|
| present | Pd detected and/or WNS diagnosed in this species in PNW | Cite USGS detection year and location (generalized) |
| not-detected | Species is susceptible but Pd/WNS has not been detected in PNW populations | Note: "as of [year]; monitoring ongoing" |
| not-susceptible | Species is not known to be susceptible to Pd (e.g., tree-roosting species with limited cave use) | Note basis for assessment |
| unknown | Insufficient data to assess WNS status | Note: "monitoring data insufficient" |

### PNW WNS Context (as of 2024-2025)

- *Pseudogymnoascus destructans* was first detected in Washington State in March 2016 (King County).
- As of 2024, Pd has been detected in multiple WA counties but mass mortality events have not been documented at the scale seen in eastern North America.
- Oregon: Pd detected in 2023 (first confirmation).
- British Columbia: Pd not detected as of 2024.
- Species of highest concern in PNW: little brown bat (*Myotis lucifugus*), Yuma myotis (*Myotis yumanensis*), Townsend's big-eared bat (*Corynorhinus townsendii*).
- Source: G21 (USGS WNS surveillance), G10 (WDFW Bat Conservation Plan), O24 (BCI).

---

*Wave 0 -- Foundation: Shared Species Card Schema*
*PNW Mammalian Taxonomy ("Fur, Fin & Fang")*
