# PNW Mammalian Taxonomy — Shared Schema

**Version:** 1.0
**Authority:** Society for Marine Mammalogy (marine), ASM Mammal Diversity Database (terrestrial), WDFW/ODFW/IDFG state lists
**Scope:** All mammal species documented in Washington, Oregon, Idaho, and British Columbia — terrestrial, marine, and volant

---

## Taxonomic Orders Represented in PNW

| Order | Common Name | PNW Examples | Est. Species |
|-------|------------|--------------|-------------|
| Didelphimorphia | Opossums | Virginia opossum (introduced) | 1 |
| Soricomorpha | Shrews/Moles | Pacific water shrew, American shrew-mole, Townsend's mole | 15+ |
| Chiroptera | Bats | Hoary bat, little brown bat, Townsend's big-eared bat | 15 |
| Carnivora | Carnivores | Black bear, gray wolf, cougar, wolverine, river otter | 20+ |
| Artiodactyla | Ungulates | Roosevelt elk, mule deer, mountain goat, pronghorn | 8+ |
| Rodentia | Rodents | Mountain beaver, red tree vole, pocket gophers, squirrels | 50+ |
| Lagomorpha | Rabbits/Pikas | American pika, pygmy rabbit, snowshoe hare | 6+ |
| Cetacea | Whales/Dolphins | Orca, gray whale, humpback, harbor porpoise | 25+ |
| Pinnipedia | Seals/Sea Lions | Harbor seal, Steller sea lion, northern elephant seal | 6 |
| Carnivora (marine) | Sea Otter | Sea otter (Enhydra lutris) | 1 |

**Total:** ~175–200 species (140+ terrestrial, 35+ marine)

---

## Species Profile Template

### Required Fields (All Species)

```yaml
common_name: ""
scientific_name: ""
taxonomic_order: ""
family: ""
status: ""              # resident | seasonal | migratory | extirpated | recolonizing | introduced
conservation_status:
  federal_esa: ""        # Endangered | Threatened | Candidate | Not listed
  mmpa: ""               # Marine mammals: depleted | strategic stock | N/A
  iucn: ""
  state_wa: ""
  state_or: ""
ecoregions: []
```

### Full Profile Fields (175+ Species)

```yaml
morphometrics:
  length_cm: ""
  mass_kg: ""
  sexual_dimorphism: ""
  distinguishing_features: ""

habitat:
  primary: ""
  elevation_range_ft: ""
  ecoregion_primary: ""
  ecoregion_secondary: []
  home_range: ""
  denning_sites: ""       # NO GPS for ESA species

diet_and_foraging:
  primary_diet: ""
  foraging_strategy: ""
  seasonal_variation: ""
  prey_species: []

reproduction:
  mating_system: ""
  breeding_season: ""
  gestation_days: ""
  litter_size: ""
  weaning_age: ""
  sexual_maturity: ""
  lifespan: ""

social_structure: ""
population:
  trend: ""
  estimate: ""
  threats: []
  recovery_status: ""     # For recovering species (wolf, grizzly, orca)
  source: ""

ecological_role: ""        # Predator | prey | engineer | disperser | pollinator
ecosystem_engineering: ""  # For keystone engineers (beaver, sea otter, pocket gopher)
evolutionary_note: ""
cross_links: []
sources: []
```

### Marine Mammal Additional Fields

```yaml
marine:
  migration_route: ""
  seasonal_presence: ""
  population_stock: ""     # DPS or stock designation
  mmpa_status: ""
  ecotype: ""              # For orca: resident | transient | offshore
  prey_dependence: ""      # Primary prey species
  vessel_impact: ""
  jurisdiction: ""         # NOAA Fisheries vs. USFWS
```

---

## 8 Ecoregion Zones (Mammalian)

1. Alpine / Subalpine (>5,000 ft)
2. Montane Conifer Forest (2,500–5,000 ft)
3. Lowland Forest / Urban (<500 ft)
4. Foothill / Oak Woodland (500–2,500 ft)
5. Riparian / Wetland / Estuarine
6. Coastal / Marine / Pelagic
7. East-Side Steppe / Shrubland
8. Fossorial / Subterranean (cross-cutting — pocket gophers, moles, shrews)

---

## Safety Boundaries (ABSOLUTE)

1. **No GPS coordinates, den sites, haul-outs, or calving areas for ESA-listed species.** County/watershed only.
2. **Every Indigenous knowledge reference names a specific nation** (Coast Salish, Makah, Lummi, Nuu-chah-nulth). Never generic.
3. **Marine mammal protection laws cited accurately** — MMPA and ESA jurisdictional boundaries (NOAA vs. USFWS).
4. **All population data from NOAA, USFWS, USGS, state agencies, or peer-reviewed research.**
5. **No policy advocacy.** Present conservation evidence without management positions.
6. **Human-wildlife conflict documented factually** without endorsing specific management positions.
7. **Only Level 1 cultural content.** No restricted/sacred knowledge.
8. **Taxonomic authority followed.** Disputed classifications (e.g., orca ecotypes) noted explicitly.

---

## Cross-Links to PNW Avian Taxonomy

This taxonomy shares the AVI ecoregion framework (Zones 1–7) and adds Zone 8 (Fossorial). Key integration points:
- Salmon-nutrient cycling: mammals (bear, otter) and birds (eagle, heron, dipper) share the same pathway
- Predator-prey: raptors hunt small mammals documented in Module 2
- Old-growth dependence: same forests support Spotted Owl AND flying squirrel/marten/fisher
- Same Indigenous knowledge sources (Suttles, Stewart, Makah Cultural Center)
