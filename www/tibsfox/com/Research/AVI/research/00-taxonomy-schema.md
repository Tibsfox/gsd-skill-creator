# PNW Avian Taxonomy — Shared Schema

**Version:** 1.0
**Authority:** AOS Check-list of North and Middle American Birds, 7th ed. through 62nd Supplement
**Scope:** All bird species documented in Washington, Oregon, Idaho, and British Columbia

---

## Taxonomic Hierarchy

All species organized following AOS taxonomic sequence:

```
Order > Family > Genus > Species [> Subspecies where PNW-relevant]
```

### AOS Taxonomic Orders Represented in PNW

| Order | Common Name | PNW Examples | Est. PNW Species |
|-------|------------|--------------|-----------------|
| Anseriformes | Waterfowl | Ducks, geese, swans | 48+ |
| Galliformes | Landfowl | Grouse, quail, ptarmigan | 12+ |
| Podicipediformes | Grebes | Western, Clark's, Eared | 6 |
| Columbiformes | Pigeons/Doves | Band-tailed Pigeon, Eurasian Collared-Dove | 4 |
| Caprimulgiformes | Nightjars | Common Nighthawk, Common Poorwill | 3 |
| Apodiformes | Swifts/Hummingbirds | Vaux's Swift, Rufous Hummingbird, Anna's | 9 |
| Gruiformes | Rails/Cranes | Sandhill Crane, American Coot, Virginia Rail | 6 |
| Charadriiformes | Shorebirds/Gulls/Alcids | Sandpipers, plovers, murrelets, puffins | 65+ |
| Pelecaniformes | Pelicans/Herons | Great Blue Heron, American White Pelican | 10 |
| Accipitriformes | Hawks/Eagles | Bald Eagle, Northern Goshawk, Red-tailed Hawk | 14 |
| Strigiformes | Owls | Northern Spotted Owl, Great Horned, Barn Owl | 14 |
| Piciformes | Woodpeckers | Pileated, Lewis's, Red-breasted Sapsucker | 11 |
| Falconiformes | Falcons | Peregrine, American Kestrel, Merlin | 5 |
| Passeriformes | Perching Birds | Flycatchers, vireos, corvids, warblers, sparrows | 200+ |

**Total estimated PNW species:** 500–550 regularly occurring + 100+ accidental/vagrant

---

## Species Profile Template

Every species documented in Modules 1 and 2 follows this standardized format:

### Required Fields (All Species)

```yaml
common_name: ""           # AOS standard common name
scientific_name: ""        # Binomial nomenclature (Genus species)
taxonomic_order: ""        # AOS order
family: ""                 # Taxonomic family
status: ""                 # resident | breeding | wintering | transient | vagrant | accidental
conservation_status:
  federal_esa: ""          # Endangered | Threatened | Candidate | Not listed
  iucn: ""                 # LC | NT | VU | EN | CR
  state_wa: ""             # State status if applicable
  state_or: ""             # State status if applicable
  pif_score: ""            # Partners in Flight assessment if available
ecoregions: []             # List of PNW ecoregions where found
```

### Full Profile Fields (400+ Species)

```yaml
morphometrics:
  length_cm: ""            # Total length range
  wingspan_cm: ""          # Wingspan range
  mass_g: ""               # Mass range, by sex if dimorphic
  plumage_description: ""  # Key field marks, seasonal variation
  sexual_dimorphism: ""    # Notable differences

habitat:
  breeding: ""             # Breeding habitat description
  wintering: ""            # Winter habitat (if different)
  elevation_range_ft: ""   # Elevation range in study area
  ecoregion_primary: ""    # Primary ecoregion association
  ecoregion_secondary: []  # Additional ecoregion presence
  microhabitat: ""         # Specific niche requirements

diet_and_foraging:
  primary_diet: ""         # Diet categories
  foraging_strategy: ""    # Foraging behavior description
  seasonal_variation: ""   # Diet shifts across seasons

reproduction:
  nest_type: ""            # Cavity, cup, ground, platform, etc.
  nest_location: ""        # Typical nest placement
  clutch_size: ""          # Range
  incubation_days: ""      # Range
  fledging_days: ""        # Range
  broods_per_year: ""      # Typical number
  breeding_season: ""      # Timing in PNW

population:
  trend: ""                # Increasing | Stable | Declining
  estimate: ""             # Population estimate with source
  threats: []              # Primary conservation threats
  source: ""               # Attribution for population data

vocalizations:
  primary_song: ""         # Description of primary vocalization
  calls: ""                # Notable call descriptions
  dawn_song: ""            # If notable

evolutionary_note: ""      # At least one phylogenetic/evolutionary observation
cross_links: []            # Links to other PNW Research Series documents
sources: []                # Specific citations for this species
```

### Abbreviated Profile Fields (100+ Vagrant/Accidental Species)

```yaml
common_name: ""
scientific_name: ""
taxonomic_order: ""
family: ""
status: "vagrant" | "accidental"
occurrence_notes: ""       # When/where recorded in PNW
records: ""                # Number of accepted records, dates
nearest_regular_range: ""  # Where species normally occurs
source: ""                 # Records committee or authority
```

---

## Migratory Species Additional Fields

```yaml
migration:
  flyway: "Pacific"        # Primary flyway
  route_description: ""    # Migration route through PNW
  spring_arrival: ""       # Typical spring arrival window
  fall_departure: ""       # Typical fall departure window
  staging_areas: []        # Key PNW stopover sites
  breeding_grounds: ""     # Breeding destination
  wintering_grounds: ""    # Wintering destination
  distance_km: ""          # Approximate migration distance
  flyway_threats: []       # Migration-specific threats
```

---

## Ecoregion Cross-Reference Format

Each species is tagged to one or more of the 7 PNW ecoregion zones defined in `00-ecoregion-definitions.md`. This enables community-level analysis in Module 3.

```yaml
ecoregion_presence:
  - zone: ""
    season: ""             # year-round | breeding | wintering | migration
    abundance: ""          # common | uncommon | rare | irregular
    role: ""               # indicator | keystone | characteristic | visitor
```

---

## Source Citation Format

All citations follow this pattern:

```
[CODE] Author/Organization. "Title." Publication/Agency. Year. URL (if available).
```

Source categories:
- **[G##]** — Government & Agency Sources (USFWS, USGS, USFS, WDFW, ODFW, IDFG, Environment Canada)
- **[P##]** — Peer-Reviewed Research (journals, theses)
- **[O##]** — Professional Organizations & References (Cornell Lab, AOS, Partners in Flight)
- **[C##]** — Ethnographic & Cultural Sources (published, publicly available only)

---

## Safety Boundaries (ABSOLUTE)

1. **No GPS coordinates, nest sites, den locations, or lek sites for ESA-listed species.** All locations generalized to county or watershed level.
2. **Every Indigenous knowledge reference names a specific nation** (Coast Salish, Makah, Kwakwaka'wakw, Nuu-chah-nulth). Never "Indigenous peoples" generically.
3. **All population data attributed to specific agencies** (USFWS, USGS, state agencies) or peer-reviewed studies.
4. **No policy advocacy.** Conservation evidence presented without legislative positions.
5. **Only Level 1 (publicly available) cultural content.** No Level 2–3 restricted or sacred knowledge.
6. **All climate data sourced** to specific agency publications (NOAA, EPA, IPCC scenarios).
7. **AOS Check-list is taxonomic authority.** Disputed classifications noted but AOS followed.
8. **Cultural sovereignty respected.** All ethnographic references from published, peer-reviewed sources.

---

## Quality Standards

- Every numerical claim (population count, decline percentage, range measurement) must cite a specific source
- Every species must have at least one evolutionary/phylogenetic note
- Every species appearing in multiple modules must use consistent data
- Subspecies complexes (Song Sparrow, Fox Sparrow, Northern Flicker) must document PNW-specific forms
- Zero entertainment media, blogs, or unsourced claims
