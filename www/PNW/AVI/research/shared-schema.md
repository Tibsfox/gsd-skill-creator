# PNW Avian Taxonomy — Shared Species Card Schema

> **Wings of the Pacific Northwest — AVI Mission, Wave 0 Foundation**
>
> This document defines the species card schema for all avian profiles produced during Wave 1-3 execution. Every species profile in every module follows the templates defined here. The schema extends the ECO mission's shared-attributes species profile template (see `www/PNW/ECO/research/shared-attributes.md` Section 6) with avian-specific fields required by the AVI mission pack.
>
> **Design principle:** Define once, reference everywhere. All agents writing species profiles use this schema. No agent invents new fields or omits required fields.
>
> **Taxonomy authority:** AOS Check-list of North and Middle American Birds, 7th edition through 62nd Supplement (source O-03).

---

## 1. Full Species Card Template

Used for all resident (Module 1) and migratory (Module 2) species with regular PNW occurrence. Target: 400+ species at this detail level.

```markdown
### [Common Name] (*Scientific Name*)

**Taxonomy:**
- Order: [Taxonomic order]
- Family: [Family name] ([Family common name])
- Genus: *[Genus]*
- Species: *[Full binomial]*
- Subspecies: [If applicable — PNW-relevant subspecies with authority]

**AOS Authority:** [AOS Check-list reference — edition/supplement number for most recent taxonomic action]

**Residency Status:** [Resident | Summer Breeder | Winter Visitor | Passage Migrant | Irruptive | Vagrant]

**Elevation Range:**
- Breeding: [feet range] ([meters range])
- Wintering: [feet range] ([meters range]) [if different]
- Elevation Band IDs: [ELEV-xxx, ELEV-xxx]

**Ecoregion Affiliations:** [List of ELEV-xxx IDs from ECO shared-attributes where this species regularly occurs]

**Habitat:** [HAB-xxx IDs from ECO shared-attributes]

**Ecological Role:** [ROLE-xxx IDs from ECO shared-attributes]

**Conservation Status:**
- Federal ESA: [Listed status or "Not listed"]
- Washington State: [Status or "Not listed"]
- Oregon State: [Status or "Not listed"]
- Idaho State: [Status or "Not listed" — if applicable]
- IUCN Red List: [Category code: LC/NT/VU/EN/CR]
- Partners in Flight: [PIF assessment score if available]

**Morphometrics:**
- Length: [range in cm] ([range in inches])
- Wingspan: [range in cm] ([range in inches])
- Mass: [range in grams] ([range in ounces])

**Plumage Description:** [2-3 sentences: breeding plumage, non-breeding if different, sexual dimorphism if present, juvenile if distinctive]

**Diet & Foraging Guild:**
- Primary diet: [Description]
- Foraging guild: [Aerial insectivore | Bark prober | Canopy gleaner | Ground forager | Raptor (diurnal/nocturnal) | Diving piscivore | Surface seizer | Seed specialist | Nectarivore | Scavenger | Generalist]
- Foraging stratum: [Ground | Understory | Mid-canopy | Canopy | Aerial | Aquatic surface | Aquatic subsurface]

**Nesting Ecology:**
- Nest type: [Cavity (primary/secondary) | Platform | Cup | Scrape | Burrow | Pendant | Parasitic | Cliff ledge | Tree branch (open) | Moss platform (murrelet)]
- Nest location: [Height range, substrate description]
- Clutch size: [range]
- Incubation period: [days range]
- Fledging period: [days range]
- Broods per year: [number]

**Vocalization:** [Brief description of primary song and call; reference Macaulay Library (O-26) for audio]

**Migration (if applicable):**
- Migration strategy: [Short-distance | Medium-distance | Long-distance (neotropical) | Altitudinal | Nomadic | Sedentary]
- Spring arrival: [Date range for PNW]
- Fall departure: [Date range for PNW]
- Wintering range: [Geographic description]
- Key PNW staging areas: [If applicable]

**Ecological Interactions:**
- [One primary interaction described in 2-3 sentences. Types: predator-prey, competition, mutualism, commensalism, parasitism, cavity nester guild. Name the interacting species with scientific names.]

**Cultural Note:**
- [One cultural observation. Must name a specific nation if referencing Indigenous knowledge. Can also reference citizen science significance, cultural symbolism, or skill metaphor. If no documented cultural association: "No specific cultural documentation in available published sources."]

**Salmon Thread:** [Yes/No]
- [If Yes: 1-2 sentences describing the species' connection to Pacific salmon ecology — direct consumption, scavenging, nutrient cycling, riparian habitat use, or marine-derived nutrient pathway. Cross-reference ECO salmon documentation.]

**Key Sources:** [Minimum 2 source IDs from source-index.md, format: G-xx, P-xx, O-xx, C-xx]

**Cross-Module References:**
- [Minimum 1 cross-reference to another AVI module or to ECO/MAM/GDN mission documents]
- [Format: See [module/mission]: [species or topic] ([relationship])]
```

---

## 2. Abbreviated Species Card Template

Used for vagrant and accidental species (CF-16 target: 100+ abbreviated profiles). These are species documented in the PNW but not regularly occurring. Requires only identification-level data.

```markdown
### [Common Name] (*Scientific Name*) — VAGRANT

**Taxonomy:** [Order] > [Family]
**AOS Authority:** [Check-list reference]

**Normal Range:** [Geographic description of regular range]
**Vagrant Occurrence Pattern:** [Frequency: rare/casual/accidental] [Season bias if any] [Geographic bias within PNW if any]
**Last PNW Sighting:** [Date and location if documented by state records committee, or "Multiple records" with approximate count]
**Records Committee Status:** [Accepted by WBRC/OBRC/other | Under review | Historical only]

**Brief Description:** [1 sentence: size, field marks, similar species confusion risk]

**Key Sources:** [State records committee reference, O-24, O-25, G-10]
```

---

## 3. Relationship Schema

Species profiles include one ecological interaction in the full card. Relationships are also aggregated in Module 5 (Ecological Networks). The following relationship types are recognized:

### Predator-Prey

```markdown
**Relationship ID:** REL-PRED-[predator-code]-[prey-code]
**Type:** Predator-Prey
**Predator:** [Common Name] (*Scientific Name*) [AVI/MAM/ECO module reference]
**Prey:** [Common Name] (*Scientific Name*) [AVI/MAM/ECO module reference]
**Interaction Strength:** [Obligate | Primary | Secondary | Opportunistic]
**Evidence:** [Source ID(s) and brief description of evidence type: dietary study, pellet analysis, direct observation]
**Directionality:** [Predator → Prey]
**Cross-Taxonomy:** [Yes/No — does this relationship span AVI and another taxonomy (MAM, ECO)?]
```

### Mutualism

```markdown
**Relationship ID:** REL-MUT-[species1-code]-[species2-code]
**Type:** Mutualism
**Species A:** [Common Name] (*Scientific Name*) [module reference]
**Species B:** [Common Name] (*Scientific Name*) [module reference]
**Mutualism Type:** [Seed dispersal | Pollination | Cleaning | Nest site provision]
**Evidence:** [Source ID(s)]
**Reciprocal Benefit:** [What A gets] / [What B gets]
```

### Competition

```markdown
**Relationship ID:** REL-COMP-[species1-code]-[species2-code]
**Type:** Competition
**Species A:** [Common Name] (*Scientific Name*) [module reference]
**Species B:** [Common Name] (*Scientific Name*) [module reference]
**Competition Type:** [Interference | Exploitative | Apparent]
**Resource Contested:** [Nest cavities | Territory | Food source | Habitat]
**Outcome:** [Coexistence with niche partitioning | Competitive exclusion | Ongoing displacement]
**Evidence:** [Source ID(s)]
```

### Cavity Nester Guild

A special relationship class for species sharing the cavity-nesting resource. PNW old-growth forests have complex cavity nester guilds with primary excavators (woodpeckers), secondary users (owls, ducks, small passerines), and competitors.

```markdown
**Relationship ID:** REL-CAVITY-[species-code]
**Type:** Cavity Nester Guild
**Species:** [Common Name] (*Scientific Name*)
**Guild Role:** [Primary excavator | Secondary user | Competitor | Nest parasite]
**Cavity Source:** [Self-excavated | Woodpecker cavity | Natural cavity | Nest box]
**Tree Species Preference:** [If documented]
**Guild Associates:** [List of co-occurring cavity nesters at same site]
**Evidence:** [Source ID(s)]
```

### Seed Disperser

```markdown
**Relationship ID:** REL-DISP-[bird-code]-[plant-code]
**Type:** Seed Dispersal
**Disperser:** [Bird species] (*Scientific Name*)
**Plant:** [Plant species] (*Scientific Name*) [ECO flora module reference]
**Dispersal Mechanism:** [Scatter-hoarding | Endozoochory (gut passage) | Epizoochory (adhesion)]
**Dispersal Distance:** [Estimated range if documented]
**Obligacy:** [Obligate mutualism | Facultative | Opportunistic]
**Evidence:** [Source ID(s)]
```

### Pollinator

```markdown
**Relationship ID:** REL-POLL-[bird-code]-[plant-code]
**Type:** Pollination
**Pollinator:** [Bird species] (*Scientific Name*)
**Plant:** [Plant species] (*Scientific Name*) [ECO flora module reference]
**Pollination Syndrome:** [Ornithophily — red tubular flowers, dilute nectar]
**Coevolution Evidence:** [If documented — morphological or phenological match]
**Evidence:** [Source ID(s)]
```

---

## 4. Cross-Reference Conventions

### Referencing ECO Shared Attributes

When a species profile uses elevation band, habitat, or ecological role IDs from the ECO shared-attributes document, use the canonical IDs exactly as defined:

- **Elevation:** `ELEV-ALPINE`, `ELEV-SUBALPINE`, `ELEV-MONTANE`, `ELEV-LOWLAND`, `ELEV-RIPARIAN`, `ELEV-INTERTIDAL`, `ELEV-SHALLOW-MARINE`, `ELEV-DEEP-MARINE`
- **Habitat:** `HAB-OLD-GROWTH`, `HAB-SECOND-GROWTH`, `HAB-ALPINE-MEADOW`, `HAB-SUBALPINE-PARKLAND`, `HAB-RIPARIAN`, `HAB-STREAM`, `HAB-LAKE`, `HAB-WETLAND`, `HAB-ROCKY-INTERTIDAL`, `HAB-SANDY-BEACH`, `HAB-EELGRASS`, `HAB-KELP`, `HAB-PELAGIC`, `HAB-DEEP-BASIN`, `HAB-VOLCANIC`, `HAB-URBAN`, `HAB-OAK-PRAIRIE`
- **Ecological Role:** `ROLE-KEYSTONE`, `ROLE-APEX`, `ROLE-MESOPREDATOR`, `ROLE-SECONDARY-CONSUMER`, `ROLE-PRIMARY-CONSUMER`, `ROLE-PRIMARY-PRODUCER`, `ROLE-POLLINATOR`, `ROLE-SEED-DISPERSER`, `ROLE-ECOSYSTEM-ENGINEER`, `ROLE-DECOMPOSER`, `ROLE-INDICATOR`, `ROLE-FOUNDATION`, `ROLE-NURSE`

### AVI-Specific Habitat Extensions

The ECO shared-attributes habitat list covers terrestrial and marine types but lacks some avian-specific micro-habitats. The following extensions are used within AVI profiles only (not modifying the shared-attributes canonical list):

| AVI Habitat ID | Name | Parent ECO Habitat | Description |
|---------------|------|-------------------|-------------|
| AVI-HAB-SNAG | Standing Dead Tree (Snag) | HAB-OLD-GROWTH, HAB-SECOND-GROWTH | Dead trees used for nesting, roosting, foraging by woodpeckers, owls, and other cavity nesters |
| AVI-HAB-SAGEBRUSH | Sagebrush Steppe | (not in ECO — east-side habitat) | Big sagebrush (*Artemisia tridentata*) communities on Columbia Plateau and Great Basin fringe |
| AVI-HAB-GRASSLAND | Native Grassland/Prairie | HAB-OAK-PRAIRIE | Bunchgrass prairie (Willamette Valley, Palouse) for ground-nesting species |
| AVI-HAB-CLIFF | Cliff/Rock Face | HAB-VOLCANIC, ELEV-ALPINE | Cliff-nesting sites for falcons, swifts, swallows |
| AVI-HAB-OFFSHORE-ROCK | Offshore Rock/Sea Stack | HAB-ROCKY-INTERTIDAL | Sea stacks and offshore rocks used by colonial seabirds (Oregon Islands NWR) |
| AVI-HAB-MUDFLAT | Tidal Mudflat | HAB-SANDY-BEACH, ELEV-INTERTIDAL | Exposed mud at low tide — critical shorebird foraging habitat |

### Referencing MAM (Mammal Taxonomy) Species

When a bird profile references a mammal species (prey, competitor, habitat associate), use the format:

```
See MAM: [Mammal common name] (*Scientific Name*) ([relationship type])
```

Example: `See MAM: Northern Flying Squirrel (*Glaucomys sabrinus*) (primary prey item)`

If the MAM module has not yet been produced, use the cross-reference format with a note:

```
See MAM (pending): Northern Flying Squirrel (*Glaucomys sabrinus*) (primary prey item)
```

### Referencing ECO Mission Documents

For cross-references to the existing ECO ecosystem documents:

```
See ECO: [Document slug] ([topic])
```

Examples:
- `See ECO: shared-attributes (ELEV-MONTANE habitat characterization)`
- `See ECO: flora-taxonomy (western red cedar as nesting substrate)`
- `See ECO: salmon-nutrient-cycling (marine-derived nitrogen in riparian forests)`

### Referencing GDN (Garden/Heritage) Documents

For cross-references to heritage skills and garden mission documents:

```
See GDN: [Document slug] ([topic])
```

Example: `See GDN: heritage-skills (Forest Stewardship badge trail)`

---

## 5. Ecoregion Zone Definitions for Avian Communities

The mission pack defines 7 avian ecoregion zones (plus 1 special zone) that map onto but are not identical to the ECO elevation bands. These zones organize Module 3 (Ecoregion Communities).

| AVI Zone | Name | ECO Elevation Band(s) | Characteristic Avifauna |
|----------|------|----------------------|------------------------|
| AVI-ZONE-1 | Alpine / Subalpine | ELEV-ALPINE, ELEV-SUBALPINE | Ptarmigan, rosy-finches, pipits, mountain bluebirds, Clark's Nutcracker |
| AVI-ZONE-2 | Montane Forest | ELEV-MONTANE | Spotted Owls, goshawks, nutcrackers, crossbills, Townsend's Warbler |
| AVI-ZONE-3 | Foothill / Oak Woodland | ELEV-LOWLAND (upper) | Bluebirds, Lewis's Woodpecker, Acorn Woodpecker, White-breasted Nuthatch |
| AVI-ZONE-4 | Lowland Forest / Urban | ELEV-LOWLAND (lower), ELEV-RIPARIAN | Steller's Jay, chickadees, wrens, hummingbirds, urban raptors |
| AVI-ZONE-5 | Riparian / Wetland / Estuarine | ELEV-RIPARIAN | Herons, kingfishers, dippers, swallows, rails, waterfowl |
| AVI-ZONE-6 | Coastal / Marine / Pelagic | ELEV-INTERTIDAL, ELEV-SHALLOW-MARINE, ELEV-DEEP-MARINE | Murrelets, puffins, storm-petrels, cormorants, gulls, alcids |
| AVI-ZONE-7 | East-Side Steppe / Shrubland | (ECO east-side equivalent) | Sage-grouse, burrowing owls, shrikes, sage sparrows |
| AVI-ZONE-8 | Agricultural / Modified | ELEV-LOWLAND (modified) | Barn Owl, American Kestrel, European Starling, House Sparrow |

---

## 6. Conservation Status Encoding

Standardized encoding for conservation status across all profiles. Follow this format exactly.

### Federal ESA Status Codes

| Code | Meaning |
|------|---------|
| ESA-E | Endangered (federal) |
| ESA-T | Threatened (federal) |
| ESA-C | Candidate for listing |
| ESA-PT | Proposed Threatened |
| ESA-PE | Proposed Endangered |
| ESA-NL | Not listed |
| ESA-DL | Delisted (with date) |

### State Status Codes (WA, OR, ID)

| Code | Meaning |
|------|---------|
| ST-E | State Endangered |
| ST-T | State Threatened |
| ST-SC | State Species of Concern |
| ST-SM | State Sensitive-Monitor |
| ST-NL | State Not Listed |

### IUCN Red List Codes

| Code | Meaning |
|------|---------|
| IUCN-LC | Least Concern |
| IUCN-NT | Near Threatened |
| IUCN-VU | Vulnerable |
| IUCN-EN | Endangered |
| IUCN-CR | Critically Endangered |
| IUCN-DD | Data Deficient |
| IUCN-NE | Not Evaluated |

### Example Conservation Status Block

```
**Conservation Status:**
- Federal ESA: ESA-T (Threatened, listed 1990)
- Washington State: ST-E (State Endangered)
- Oregon State: ST-T (State Threatened)
- IUCN Red List: IUCN-NT (Near Threatened)
- Partners in Flight: High Continental Concern
```

---

## 7. Source Citation Format

All source citations in species profiles use the source IDs from `source-index.md`. Format rules:

1. **Minimum 2 sources per full profile.** At least one must be Tier 1 (government or peer-reviewed).
2. **Format:** `G-xx`, `P-xx`, `O-xx`, `C-xx` — matching source-index.md IDs exactly.
3. **Inline citations:** When a specific claim needs attribution within a profile, use `(source: G-18)` inline.
4. **Key Sources field:** List the 2-5 most relevant sources at the end of each profile.
5. **Safety-relevant claims:** Population counts, ESA status, Indigenous knowledge, and climate data MUST have inline citations to specific sources. This is enforced by safety tests SC-NUM, SC-END, SC-IND, SC-CLI.

---

## 8. Data Validation Rules

These rules apply to all species profiles and are checked during Wave 4 verification.

| Rule | Description | Enforcement |
|------|-------------|-------------|
| V-01 | Scientific name follows AOS Check-list | SC-TAX (BLOCK) |
| V-02 | Elevation band IDs are canonical ECO IDs | Verification pass |
| V-03 | Habitat IDs are canonical ECO IDs or AVI extensions | Verification pass |
| V-04 | Conservation status uses encoded format | Verification pass |
| V-05 | Minimum 2 source citations per full profile | CF-03 (BLOCK) |
| V-06 | Minimum 1 cross-module reference per profile | CF-03 (BLOCK) |
| V-07 | Morphometrics include ranges (not single values) | Verification pass |
| V-08 | No ESA species nest/lek/den coordinates | SC-END (BLOCK) |
| V-09 | Indigenous references name specific nation | SC-IND (BLOCK) |
| V-10 | Population numbers cite specific source | SC-NUM (BLOCK) |
| V-11 | Salmon Thread field present (Yes/No) | Verification pass |
| V-12 | Vagrant profiles use abbreviated template | CF-16 (LOG) |

---

*Wave 0 — Foundation: Shared Species Card Schema*
*PNW Avian Taxonomy v0.1*
*Wings of the Pacific Northwest — AVI Mission*
