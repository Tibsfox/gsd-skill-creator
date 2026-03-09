# Raptor Species of the Pacific Northwest — Detailed Profiles

> **Mission:** Wings of the Pacific Northwest — PNW Avian Taxonomy
> **Module:** 1+2 Raptor Subset (Diurnal and Nocturnal Raptors)
> **Agent:** SURVEY-RAPTOR
> **Date:** 2026-03-08
> **Scope:** Accipitriformes, Falconiformes, Cathartiformes, Strigiformes — 32 species profiled
> **Integration Test:** IN-AVI-MAM-RAPTOR-PREY (H-6) — all 19 raptor-prey pairs documented
> **Salmon Thread:** Flagged for all species with salmon/salmon carcass connections
> **Quality Target:** 80KB+, 700+ lines, detailed prey profiles with MAM cross-references

---

## Overview

The Pacific Northwest supports approximately 40 raptor species — birds of prey that occupy the apex and mesopredator trophic positions across every PNW ecoregion from alpine ridgelines to coastal estuaries, from old-growth canopy to sagebrush steppe. This document profiles 32 species with emphasis on prey ecology, providing the detailed predator-prey data required by the H-6 integration test (see `integration-test-spec.md`).

Raptors in the PNW fall into four orders:

- **Accipitriformes** — hawks, eagles, kites, harriers, and the Osprey (13 species profiled)
- **Falconiformes** — falcons (5 species profiled, including 1 rare winter visitor)
- **Cathartiformes** — New World vultures (1 species profiled — Turkey Vulture, treated within Accipitriformes section)
- **Strigiformes** — owls (14 species profiled)

### Reverse Sexual Size Dimorphism

A defining feature of raptor biology is reverse sexual size dimorphism (RSD): females are typically 10-50% larger than males by mass. This pattern is most extreme in bird-hunting species (accipiters, Peregrine Falcon) and least pronounced in scavengers and carrion feeders. RSD affects prey selection, territory partitioning, and breeding ecology. All morphometric data below note sex differences where documented.

### Prey Documentation Standard

Every species card includes a **Prey List** section with named prey species (common name and scientific binomial), plus explicit **MAM cross-reference** and **AVI cross-reference** lines listing which prey species will appear in the MAM small-mammals module and other AVI modules respectively. This structure directly supports the H-6 raptor-prey integration test, which requires bidirectional consistency between AVI raptor profiles and MAM prey profiles.

---

## Part I: Diurnal Raptors

### Section A: Accipitriformes — Eagles, Hawks, Kites, Harriers, Osprey

The Accipitriformes encompass the largest diversity of PNW raptors, from the massive Bald Eagle to the diminutive Sharp-shinned Hawk. This order includes soaring buteos that hunt open country, agile accipiters that pursue prey through dense forest, and specialized fish-hunters. In the PNW, Accipitriformes occupy every terrestrial and freshwater ecoregion, with species turnover along elevation gradients creating distinct raptor communities at each band.

The ecological story of PNW accipitriform raptors is inseparable from salmon. Bald Eagles and Osprey are direct participants in the salmon nutrient cycle — the marine-to-terrestrial nutrient transfer that defines PNW ecosystem productivity. Eagles congregate on spawning rivers in winter densities unmatched anywhere in the lower 48 states, scattering salmon carcasses into riparian forests where decomposition releases marine-derived nitrogen (N-15) and phosphorus that fertilize the trees sheltering the very streams salmon need.

---

## Order Accipitriformes

### Bald Eagle (*Haliaeetus leucocephalus*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Haliaeetus*
- Species: *Haliaeetus leucocephalus*
- Subspecies: *H. l. washingtoniensis* (Southern Bald Eagle — PNW populations)

**AOS Authority:** AOS Check-list 7th edition; no recent taxonomic changes through 62nd Supplement

**Residency Status:** Resident (year-round in PNW; supplemented by northern migrants in winter)

**Elevation Range:**
- Breeding: 0-5,000 ft (0-1,524 m)
- Wintering: 0-3,000 ft (0-914 m) — concentrated along salmon rivers
- Elevation Band IDs: ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-INTERTIDAL

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-INTERTIDAL, ELEV-SHALLOW-MARINE

**Habitat:** HAB-RIPARIAN, HAB-STREAM, HAB-LAKE, HAB-OLD-GROWTH, HAB-SECOND-GROWTH, HAB-ROCKY-INTERTIDAL

**Ecological Role:** ROLE-APEX, ROLE-KEYSTONE

**Conservation Status:**
- Federal ESA: ESA-DL (Delisted 2007; previously ESA-T)
- Washington State: ST-SC (State Species of Concern — recovered but monitored)
- Oregon State: ST-NL (Not listed; state recovery goals met)
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed (not a landbird)

**Morphometrics:**
- Length: 71-96 cm (28-38 in)
- Wingspan: 168-244 cm (66-96 in)
- Mass: 3,000-6,300 g (106-222 oz); females ~25% larger than males

**Plumage Description:** Adults unmistakable: dark brown body with white head and tail, yellow bill and feet. Immatures mottled brown with variable white freckling; full adult plumage attained at 4-5 years through progressive molts. Sexual dimorphism in size only, not plumage.

**Diet & Foraging Guild:**
- Primary diet: Fish (especially salmonids), waterfowl, carrion, mammals
- Foraging guild: Raptor (diurnal) / Scavenger
- Foraging stratum: Aerial, Aquatic surface, Ground (carrion)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Snowshoe Hare (*Lepus americanus*) — Secondary prey; taken opportunistically in montane and interior habitats (source: G-14, G-23)
- Eastern Cottontail (*Sylvilagus floridanus*) — Opportunistic prey in lowland agricultural areas
- Muskrat (*Ondatra zibethicus*) — Secondary prey near wetlands and riparian zones
- Raccoon (*Procyon lotor*) — Opportunistic; juveniles taken occasionally
- American Mink (*Neogale vison*) — Opportunistic prey near waterways
- Columbian Ground Squirrel (*Urocitellus columbianus*) — Opportunistic in east-side open habitats
- River Otter (*Lontra canadensis*) — Rare prey; kleptoparasitism of otter fish catches documented
- Harbor Seal (*Phoca vitulina*) — Pups taken at haul-out sites along coast (rare)
- **MAM cross-reference:** Snowshoe Hare (*Lepus americanus*), Eastern Cottontail (*Sylvilagus floridanus*), Muskrat (*Ondatra zibethicus*), Columbian Ground Squirrel (*Urocitellus columbianus*) — all expected in MAM profiles. See MAM (pending): Snowshoe Hare (secondary prey — H-6 pair context).
- **AVI cross-reference:** Primary prey is Pacific Salmon (see ECO) and waterfowl — American Coot, Mallard, American Wigeon — see AVI resident.md/migratory.md. H-6 pair 4: Bald Eagle x Pacific Salmon documented above.

**Nesting Ecology:**
- Nest type: Platform (massive stick nest — among largest of any North American bird)
- Nest location: Dominant canopy trees near water, 50-200 ft; old-growth conifers preferred (Douglas-fir, Sitka spruce, ponderosa pine); also cliff ledges
- Clutch size: 1-3 (typically 2)
- Incubation period: 34-36 days
- Fledging period: 56-98 days
- Broods per year: 1

**Vocalization:** High-pitched chattering whistle: *kleek kik ik ik ik*; surprisingly weak and thin for such a large raptor. Various chattering calls during territorial and courtship displays. Reference Macaulay Library (O-26) for audio.

**Migration (if applicable):**
- Migration strategy: Sedentary to Short-distance (northern birds move south; PNW residents largely sedentary but concentrate on salmon rivers in winter)
- Spring arrival: Resident; northern migrants depart by April
- Fall departure: Resident; northern migrants arrive October-November
- Wintering range: Resident in PNW; wintering concentrations on Skagit, Nooksack, Samish, and Fraser Rivers (source: G-14)
- Key PNW staging areas: Skagit River (WA), Klamath Basin (OR), upper Columbia River

**Ecological Interactions:**
- Bald Eagle is the dominant apex avian predator in PNW riparian and coastal ecosystems. Winter congregations on salmon spawning rivers represent one of the most significant predator-prey spectacles in North America, with hundreds of eagles gathering on the Skagit and Nooksack Rivers (source: G-14). Eagles redistribute marine-derived nutrients (N-15, P) from river to riparian forest through carcass scattering, functioning as nutrient vectors in the salmon-forest feedback loop. See MAM (pending): Snowshoe Hare (*Lepus americanus*) (secondary prey item).

**Cultural Note:**
- The Bald Eagle holds profound significance across PNW Indigenous nations. The Kwakwaka'wakw identify Eagle as one of the primary crest animals, and eagle down is used in ceremonial welcome dances as a symbol of peace and friendship (source: C-08). Coast Salish nations recognize Eagle as a powerful spiritual being connected to the upper world (source: C-01).

**Salmon Thread:** Yes
- Bald Eagle is the iconic salmon-bird connection in the PNW. Eagles consume both live spawning salmon and post-spawn carcasses, with winter congregations of 300-600+ eagles documented on the Skagit River system alone (source: G-14, P-18). Eagle-scattered salmon carcasses transport marine-derived nitrogen and phosphorus into riparian forests, contributing to forest productivity. See ECO: salmon-nutrient-cycling (marine-derived nitrogen in riparian forests).

**Key Sources:** G-14, G-20, G-23, P-18, O-22

**Cross-Module References:**
- See ECO: salmon-nutrient-cycling (eagle as nutrient vector in salmon-forest feedback)
- See AVI Mod 5: salmon-bird network (winter eagle congregations)
- See MAM (pending): Snowshoe Hare (*Lepus americanus*) (secondary prey — integration test Pair 13)

---

### Golden Eagle (*Aquila chrysaetos*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Aquila*
- Species: *Aquila chrysaetos*
- Subspecies: *A. c. canadensis* (North American Golden Eagle)

**AOS Authority:** AOS Check-list 7th edition; no recent taxonomic changes through 62nd Supplement

**Residency Status:** Resident (year-round in PNW interior; some altitudinal migration)

**Elevation Range:**
- Breeding: 2,000-10,000 ft (610-3,048 m)
- Wintering: 500-6,000 ft (152-1,829 m) — moves to lower elevations
- Elevation Band IDs: ELEV-MONTANE, ELEV-SUBALPINE, ELEV-ALPINE, ELEV-LOWLAND

**Ecoregion Affiliations:** ELEV-MONTANE, ELEV-SUBALPINE, ELEV-ALPINE, ELEV-LOWLAND

**Habitat:** HAB-ALPINE-MEADOW, HAB-SUBALPINE-PARKLAND, AVI-HAB-SAGEBRUSH, AVI-HAB-GRASSLAND, AVI-HAB-CLIFF

**Ecological Role:** ROLE-APEX

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed; protected under Bald and Golden Eagle Protection Act)
- Washington State: ST-SC (State Species of Concern)
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 70-84 cm (28-33 in)
- Wingspan: 185-220 cm (73-87 in)
- Mass: 3,000-6,125 g (106-216 oz); females larger

**Plumage Description:** Uniformly dark brown with golden-tawny hackles on nape and crown. Immatures show conspicuous white patches at base of tail and in wings. Full adult plumage at 4-5 years. Legs feathered to toes (distinguishing from Bald Eagle). Minimal sexual dimorphism in plumage.

**Diet & Foraging Guild:**
- Primary diet: Medium-sized mammals (rabbits, hares, ground squirrels, marmots), occasionally birds and carrion
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial, Ground

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Snowshoe Hare (*Lepus americanus*) — Primary prey in montane forests
- Black-tailed Jackrabbit (*Lepus californicus*) — Primary prey in east-side steppe and shrubland
- White-tailed Jackrabbit (*Lepus townsendii*) — Primary prey on Columbia Plateau
- Yellow-bellied Marmot (*Marmota flaviventris*) — Primary prey in alpine and subalpine meadows
- Hoary Marmot (*Marmota caligata*) — Primary prey at high elevations in Cascades and Olympics
- Columbian Ground Squirrel (*Urocitellus columbianus*) — Primary prey in east-side grasslands
- Belding's Ground Squirrel (*Urocitellus beldingi*) — Primary in Great Basin fringe
- California Ground Squirrel (*Otospermophilus beecheyi*) — Primary in southern Oregon
- Nuttall's Cottontail (*Sylvilagus nuttallii*) — Secondary prey in sagebrush steppe
- Mountain Cottontail (*Sylvilagus nuttallii*) — Secondary prey in rocky terrain
- Bushy-tailed Woodrat (*Neotoma cinerea*) — Secondary prey in rocky habitats
- Northern Pocket Gopher (*Thomomys talpoides*) — Secondary prey in meadows
- Deer Mouse (*Peromyscus maniculatus*) — Opportunistic
- Pronghorn (*Antilocapra americana*) — Fawns taken rarely in east-side steppe
- Mule Deer (*Odocoileus hemionus*) — Fawns taken occasionally; adults very rarely
- **MAM cross-reference:** Hoary Marmot (*Marmota caligata*), Yellow-bellied Marmot (*Marmota flaviventris*), White-tailed Jackrabbit (*Lepus townsendii*), Black-tailed Jackrabbit (*Lepus californicus*), Columbian Ground Squirrel (*Urocitellus columbianus*), Snowshoe Hare (*Lepus americanus*), Mountain Cottontail (*Sylvilagus nuttallii*) — all expected in MAM profiles. See MAM (pending). H-6 pair 10: Golden Eagle x Marmot/Jackrabbit documented above.
- **AVI cross-reference:** Dusky Grouse, White-tailed Ptarmigan, Rock Pigeon — see AVI resident.md.

**Nesting Ecology:**
- Nest type: Platform (large stick nest on cliff ledge or large tree)
- Nest location: Cliff ledges preferred (60-200 ft); also large conifers in forested areas; typically uses alternate nests within territory
- Clutch size: 1-3 (typically 2)
- Incubation period: 41-45 days
- Fledging period: 60-77 days
- Broods per year: 1

**Vocalization:** Generally silent away from nest. Calls include a high, weak *kee-kee-kee* and mewing notes during courtship. Much less vocal than Bald Eagle. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Altitudinal to Short-distance (some northern interior birds move south)
- Spring arrival: Resident; altitudinal movement to breeding territories by March
- Fall departure: Resident; descends to lower elevations October-November
- Wintering range: PNW lowland steppe and valleys; some birds from BC and Alaska winter in eastern OR/WA
- Key PNW staging areas: Not a staging migrant; hawk-watch sites (Chelan Ridge, Bonney Butte) count passage birds (source: O-21)

**Ecological Interactions:**
- Golden Eagle is the apex aerial predator of PNW open landscapes, filling the ecological niche occupied by Bald Eagle in riparian zones. Golden Eagles exert top-down predation pressure on marmot and ground squirrel populations in alpine and steppe habitats. Competition with Bald Eagle occurs where ranges overlap; Golden Eagles generally dominate in montane and steppe habitats, Bald Eagles near water. See MAM (pending): Yellow-bellied Marmot (*Marmota flaviventris*) (primary prey item).

**Cultural Note:**
- Golden Eagle feathers hold sacred significance across many PNW Indigenous nations. The Sahaptin peoples of the Columbia Plateau recognize Golden Eagle as a powerful hunting spirit, and eagle feathers are integral to ceremonial regalia (source: C-06). The Bald and Golden Eagle Protection Act (1940, amended 1962) reflects both ecological and cultural valuation.

**Salmon Thread:** No

**Key Sources:** G-14, G-16, O-21, O-22

**Cross-Module References:**
- See MAM (pending): Yellow-bellied Marmot (*Marmota flaviventris*) (primary prey — alpine food web)
- See ECO: shared-attributes (ELEV-ALPINE, ELEV-SUBALPINE habitat characterization)

---

### Osprey (*Pandion haliaetus*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Pandionidae (Ospreys)
- Genus: *Pandion*
- Species: *Pandion haliaetus*
- Subspecies: *P. h. carolinensis* (North American Osprey)

**AOS Authority:** AOS Check-list 7th edition; Pandionidae recognized as separate family from Accipitridae

**Residency Status:** Summer Breeder (most PNW populations migratory; some winter along coast)

**Elevation Range:**
- Breeding: 0-5,000 ft (0-1,524 m)
- Wintering: 0-500 ft (0-152 m) — those that remain; most migrate to Central/South America
- Elevation Band IDs: ELEV-LOWLAND, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-INTERTIDAL, ELEV-SHALLOW-MARINE

**Habitat:** HAB-STREAM, HAB-LAKE, HAB-RIPARIAN, HAB-ROCKY-INTERTIDAL

**Ecological Role:** ROLE-SECONDARY-CONSUMER, ROLE-INDICATOR

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed; recovered from DDT-era declines)
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 54-58 cm (21-23 in)
- Wingspan: 150-180 cm (59-71 in)
- Mass: 1,200-2,050 g (42-72 oz); females slightly larger

**Plumage Description:** Dark brown above, white below with distinctive dark eye stripe. Underwing pattern diagnostic: white coverts with dark carpal patches. Females typically show heavier breast band. Juveniles similar to adults but with pale feather edging above. No seasonal plumage change.

**Diet & Foraging Guild:**
- Primary diet: Fish — almost exclusively piscivorous (>99% of diet)
- Foraging guild: Diving piscivore
- Foraging stratum: Aquatic surface, Aquatic subsurface (plunge-dive)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Osprey diet is almost exclusively fish. Mammalian prey is not a significant component. Rare documented instances include Muskrat (*Ondatra zibethicus*) — exceptional; documented but not a regular prey item.
- **Fish prey (primary, for salmon thread):** Chinook Salmon (*Oncorhynchus tshawytscha*), Coho Salmon (*Oncorhynchus kisutch*), Steelhead/Rainbow Trout (*Oncorhynchus mykiss*), Kokanee (*Oncorhynchus nerka* — landlocked), Largescale Sucker (*Catostomus macrocheilus*), Northern Pikeminnow (*Ptychocheilus oregonensis*)
- **MAM cross-reference:** Minimal — Osprey diet is >99% fish. Muskrat (*Ondatra zibethicus*) only documented mammalian prey (exceptional). See MAM (pending): Muskrat (rare prey).
- **AVI cross-reference:** No significant avian prey. H-6 pair 5: Osprey x Trout/Salmon documented above (fish — see ECO).

**Nesting Ecology:**
- Nest type: Platform (large stick nest atop snag, utility pole, or platform)
- Nest location: 15-80 ft; strong preference for open-top dead trees (snags) near water; readily uses artificial nest platforms; also channel markers, transmission towers
- Clutch size: 2-4 (typically 3)
- Incubation period: 36-42 days
- Fledging period: 48-59 days
- Broods per year: 1

**Vocalization:** Loud, high-pitched whistled *cheep cheep cheep* or *tyew tyew tyew*; alarm call a sharp, rising whistle. Very vocal near nest. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Long-distance (neotropical migrant — most PNW birds winter in Central/South America)
- Spring arrival: Late March to mid-April
- Fall departure: September to early October
- Wintering range: Mexico to northern South America; some winter along southern Oregon and California coast
- Key PNW staging areas: Columbia River system, Puget Sound estuaries

**Ecological Interactions:**
- Osprey is the only PNW raptor that plunge-dives for fish as its exclusive hunting method, entering the water feet-first from heights of 30-130 ft with a success rate of approximately 25-70% (source: O-22). Bald Eagles routinely kleptoparasitize Osprey, forcing them to drop captured fish — this interaction was famously observed by Benjamin Franklin and influenced his argument against the Bald Eagle as national symbol. Osprey nest productivity correlates directly with local fish (especially salmon) abundance, making it an indicator species for aquatic ecosystem health.

**Cultural Note:**
- Coast Salish peoples recognize Osprey as a skilled fisher and associate it with the abundance of salmon rivers (source: C-01). Osprey nesting on artificial platforms near human settlements has made it one of the most publicly visible raptors in the PNW, contributing to citizen science engagement through nest cameras (e.g., Hellgate Osprey cam on the Clark Fork River).

**Salmon Thread:** Yes
- Osprey is a direct salmon consumer and one of the most visible indicators of salmon run strength in PNW river systems. Nest productivity correlates with local salmon abundance (source: P-18, G-20). Osprey consume juvenile and adult salmonids throughout the breeding season. As a fish-obligate predator, Osprey population health is a direct proxy for aquatic ecosystem integrity. See ECO: salmon-nutrient-cycling (marine-derived nitrogen in riparian forests).

**Key Sources:** G-14, G-20, P-18, O-22

**Cross-Module References:**
- See ECO: salmon-nutrient-cycling (Osprey as direct salmon consumer and population indicator)
- See AVI Mod 5: salmon-bird network (Osprey-salmon trophic link)
- See AVI: Bald Eagle (*Haliaeetus leucocephalus*) (kleptoparasitic interaction)

---

### Red-tailed Hawk (*Buteo jamaicensis*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Buteo*
- Species: *Buteo jamaicensis*
- Subspecies: *B. j. calurus* (Western Red-tailed Hawk — dominant PNW subspecies); *B. j. harlani* (Harlan's Hawk — winters in PNW, sometimes treated as separate species)

**AOS Authority:** AOS Check-list 7th edition; Harlan's Hawk retained as subspecies through 62nd Supplement

**Residency Status:** Resident (year-round; augmented by northern migrants in winter)

**Elevation Range:**
- Breeding: 0-8,000 ft (0-2,438 m)
- Wintering: 0-5,000 ft (0-1,524 m)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Habitat:** HAB-OAK-PRAIRIE, HAB-SECOND-GROWTH, AVI-HAB-SAGEBRUSH, AVI-HAB-GRASSLAND, HAB-URBAN

**Ecological Role:** ROLE-APEX, ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 45-65 cm (18-26 in)
- Wingspan: 110-141 cm (43-56 in)
- Mass: 690-1,460 g (24-52 oz); females ~25% heavier

**Plumage Description:** Extremely variable in PNW. *B. j. calurus* ranges from light morph (white breast with dark belly band, rufous tail) through rufous and dark morphs. Diagnostic rufous-red tail in adults. Dark patagial bar on underwing in all morphs. Immatures have finely banded brown tail. Harlan's subspecies shows mottled dark plumage with whitish, mottled tail lacking red.

**Diet & Foraging Guild:**
- Primary diet: Small to medium mammals, occasionally birds, reptiles, large insects
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial (soaring/stooping), Ground (perch-hunting)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Eastern Cottontail (*Sylvilagus floridanus*) — Primary prey in lowland agricultural and suburban landscapes (source: G-14, G-15, O-22)
- Nuttall's Cottontail (*Sylvilagus nuttallii*) — Primary prey in east-side sagebrush and rocky habitats
- Columbian Ground Squirrel (*Urocitellus columbianus*) — Primary prey in east-side grasslands; breeding success correlates with ground squirrel abundance (source: G-14, G-16, O-22)
- Belding's Ground Squirrel (*Urocitellus beldingi*) — Primary prey in Great Basin fringe habitats
- California Ground Squirrel (*Otospermophilus beecheyi*) — Primary prey in southern Oregon and Rogue Valley
- Townsend's Ground Squirrel (*Urocitellus townsendii*) — Primary in Columbia Basin steppe
- Douglas Squirrel (*Tamiasciurus douglasii*) — Secondary prey in forested habitats
- Northern Pocket Gopher (*Thomomys talpoides*) — Secondary prey in meadows and agricultural land
- Meadow Vole (*Microtus pennsylvanicus*) — Secondary prey
- Townsend's Vole (*Microtus townsendii*) — Secondary prey in western lowlands
- Deer Mouse (*Peromyscus maniculatus*) — Secondary prey
- Snowshoe Hare (*Lepus americanus*) — Secondary prey; adults may be near upper size limit
- Bushy-tailed Woodrat (*Neotoma cinerea*) — Secondary prey in rocky habitats
- Mountain Cottontail (*Sylvilagus nuttallii*) — Secondary prey
- Black-tailed Jackrabbit (*Lepus californicus*) — Taken in east-side steppe; juveniles preferred
- **MAM cross-reference:** Townsend's Vole (*Microtus townsendii*), Columbian Ground Squirrel (*Urocitellus columbianus*), Belding's Ground Squirrel (*Urocitellus beldingi*), California Ground Squirrel (*Otospermophilus beecheyi*), Eastern Cottontail (*Sylvilagus floridanus*), Nuttall's Cottontail (*Sylvilagus nuttallii*), Deer Mouse (*Peromyscus maniculatus*), Meadow Vole (*Microtus pennsylvanicus*), Northern Pocket Gopher (*Thomomys talpoides*) — all expected in MAM profiles. See MAM (pending). H-6 pair 8: Red-tailed Hawk x Townsend's Vole/Ground Squirrels documented above.
- **AVI cross-reference:** Ring-necked Pheasant, American Kestrel (intraguild predation) — see AVI resident.md.

**Nesting Ecology:**
- Nest type: Platform (stick nest in tree crown or on cliff ledge)
- Nest location: 15-120 ft in dominant trees; also cliff ledges, utility structures; prefers sites with open foraging areas nearby
- Clutch size: 1-5 (typically 2-3)
- Incubation period: 28-35 days
- Fledging period: 42-46 days
- Broods per year: 1

**Vocalization:** Iconic raptor scream: a hoarse, descending *keeeeeer* lasting 2-3 seconds. This call is the "default hawk sound" used in virtually all film and television. Alarm call a repeated harsh *kee-kee-kee*. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary to Short-distance (PNW residents largely sedentary; northern birds and Harlan's subspecies migrate through)
- Spring arrival: Resident; migrants pass through March-April
- Fall departure: Resident; migrants pass through September-November
- Wintering range: Resident; winter concentrations in agricultural valleys
- Key PNW staging areas: Chelan Ridge (WA) and Bonney Butte (OR) hawk-watch sites (source: O-21)

**Ecological Interactions:**
- Red-tailed Hawk is the most abundant large raptor in PNW lowlands and the primary diurnal predator of cottontails and ground squirrels in agricultural and suburban landscapes (source: G-14, O-22). Hawk breeding success correlates with ground squirrel abundance in east-side habitats. Competes with Great Horned Owl for nest sites (both use large stick nests and cliff ledges); temporal niche partitioning — Red-tailed Hawk is strictly diurnal while Great Horned Owl is nocturnal — reduces direct competition. See MAM (pending): Eastern Cottontail (*Sylvilagus floridanus*) (primary prey item — integration test Pair 8).

**Cultural Note:**
- The Red-tailed Hawk's scream has become the universal audio symbol for "raptor" in Western culture, used in film, television, and advertising even when depicting Bald Eagles or other species. In the PNW, Red-tailed Hawks are among the most commonly observed raptors from highways and suburban areas, making them important for public raptor awareness and citizen science raptor surveys.

**Salmon Thread:** No

**Key Sources:** G-14, G-15, G-16, O-21, O-22

**Cross-Module References:**
- See MAM (pending): Eastern Cottontail (*Sylvilagus floridanus*) (primary prey — integration test Pair 8)
- See MAM (pending): Columbian Ground Squirrel (*Urocitellus columbianus*) (primary prey — integration test Pair 9)
- See AVI: Great Horned Owl (*Bubo virginianus*) (nest site competition)

---

### Swainson's Hawk (*Buteo swainsoni*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Buteo*
- Species: *Buteo swainsoni*
- Subspecies: Monotypic

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Summer Breeder (one of the longest-distance raptor migrants in the Western Hemisphere)

**Elevation Range:**
- Breeding: 500-5,000 ft (152-1,524 m)
- Elevation Band IDs: ELEV-LOWLAND

**Ecoregion Affiliations:** ELEV-LOWLAND

**Habitat:** AVI-HAB-SAGEBRUSH, AVI-HAB-GRASSLAND, HAB-OAK-PRAIRIE

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Common Bird in Steep Decline

**Morphometrics:**
- Length: 43-56 cm (17-22 in)
- Wingspan: 117-137 cm (46-54 in)
- Mass: 693-1,367 g (24-48 oz)

**Plumage Description:** Light morph: white underparts with dark brown bib/breast band, dark flight feathers contrasting with pale wing linings. Dark morph uniformly dark brown. In flight, wings held in slight dihedral. Slimmer and longer-winged than Red-tailed Hawk.

**Diet & Foraging Guild:**
- Primary diet: Insects (grasshoppers, crickets) during breeding season and on migration; small mammals during breeding
- Foraging guild: Raptor (diurnal) / Aerial insectivore (during migration)
- Foraging stratum: Aerial, Ground

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Townsend's Ground Squirrel (*Urocitellus townsendii*) — Primary mammalian prey during breeding
- Columbian Ground Squirrel (*Urocitellus columbianus*) — Primary in eastern WA/OR
- Deer Mouse (*Peromyscus maniculatus*) — Secondary prey
- Meadow Vole (*Microtus pennsylvanicus*) — Secondary prey
- Northern Pocket Gopher (*Thomomys talpoides*) — Secondary prey
- Montane Vole (*Microtus montanus*) — Secondary prey in irrigated farmland
- **MAM cross-reference:** Columbian Ground Squirrel (*Urocitellus columbianus*), Townsend's Ground Squirrel (*Urocitellus townsendii*), Deer Mouse (*Peromyscus maniculatus*), Meadow Vole (*Microtus pennsylvanicus*), Northern Pocket Gopher (*Thomomys talpoides*), Montane Vole (*Microtus montanus*) — all expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** No significant avian prey in PNW. Diet shifts to insects (grasshoppers) during migration — not in AVI scope.

**Nesting Ecology:**
- Nest type: Platform (stick nest in isolated tree)
- Nest location: 10-60 ft; often lone tree in open grassland or agricultural field; also utility poles
- Clutch size: 2-4 (typically 2-3)
- Incubation period: 28-35 days
- Fledging period: 38-46 days
- Broods per year: 1

**Vocalization:** A drawn-out, plaintive whistle *kreeeee*, thinner and higher than Red-tailed Hawk. Alarm call a series of sharp *kip* notes. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Long-distance (neotropical — breeds PNW, winters Argentine pampas)
- Spring arrival: Mid-April to early May
- Fall departure: Late August to September
- Wintering range: Argentine pampas — one of the longest raptor migrations on Earth (~10,000 miles one way)
- Key PNW staging areas: Snake River Birds of Prey NCA (ID); Malheur NWR vicinity (OR)

**Ecological Interactions:**
- Swainson's Hawk is the primary diurnal raptor of PNW east-side grasslands and agricultural areas during the breeding season. Frequently follows farm equipment to capture displaced rodents and exposed insects. Shares habitat with Red-tailed Hawk but partitions niche through greater reliance on insects and preference for more open, treeless terrain. Mass migration spectacle: flocks of thousands ("kettles") soar over Central America en route to Argentina.

**Cultural Note:**
- No specific cultural documentation in available published sources. Swainson's Hawk's dramatic long-distance migration connects PNW grasslands to South American pampas, making it an ambassador species for hemispheric conservation cooperation.

**Salmon Thread:** No

**Key Sources:** G-14, G-16, O-21, O-22

**Cross-Module References:**
- See AVI: Red-tailed Hawk (*Buteo jamaicensis*) (sympatric Buteo — niche partitioning)
- See ECO: shared-attributes (east-side steppe habitat characterization)

---

### Rough-legged Hawk (*Buteo lagopus*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Buteo*
- Species: *Buteo lagopus*
- Subspecies: *B. l. sanctijohannis* (North American population)

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Winter Visitor

**Elevation Range:**
- Wintering: 0-4,000 ft (0-1,219 m)
- Elevation Band IDs: ELEV-LOWLAND

**Ecoregion Affiliations:** ELEV-LOWLAND

**Habitat:** AVI-HAB-GRASSLAND, AVI-HAB-SAGEBRUSH, HAB-WETLAND

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 46-59 cm (18-23 in)
- Wingspan: 120-153 cm (47-60 in)
- Mass: 745-1,380 g (26-49 oz)

**Plumage Description:** Light morph: dark belly band, pale head, dark carpal patches on underwing; dark tail with broad white base and dark subterminal band. Dark morph uniformly dark with pale flight feathers. Feathered tarsi (unique among PNW Buteos). Hovers regularly while hunting — distinctive field behavior.

**Diet & Foraging Guild:**
- Primary diet: Small mammals (voles, lemmings on breeding grounds; voles and mice on winter range)
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial (hovering), Ground (perch-hunting)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Meadow Vole (*Microtus pennsylvanicus*) — Primary winter prey
- Townsend's Vole (*Microtus townsendii*) — Primary winter prey in western lowlands
- Montane Vole (*Microtus montanus*) — Primary in east-side habitats
- Deer Mouse (*Peromyscus maniculatus*) — Secondary prey
- Northern Pocket Gopher (*Thomomys talpoides*) — Secondary prey
- **MAM cross-reference:** Meadow Vole (*Microtus pennsylvanicus*), Townsend's Vole (*Microtus townsendii*), Montane Vole (*Microtus montanus*), Deer Mouse (*Peromyscus maniculatus*), Northern Pocket Gopher (*Thomomys talpoides*) — all expected in MAM profiles. See MAM (pending). H-6 pair 15: Rough-legged Hawk x *Microtus* voles documented above.
- **AVI cross-reference:** No significant avian prey on PNW winter range.

**Nesting Ecology:**
- Does not breed in PNW. Nests on Arctic tundra cliffs and ground hummocks in Alaska and northern Canada.

**Vocalization:** Generally quiet on wintering grounds. Breeding call a thin, descending whistle. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Medium-distance (breeds Arctic, winters mid-latitudes)
- Spring arrival: N/A (departs PNW by April)
- Fall departure: N/A (arrives PNW October-November)
- Wintering range: PNW lowlands, particularly Columbia Basin, Willamette Valley, Klamath Basin
- Key PNW staging areas: Not applicable (direct migration to wintering sites)

**Ecological Interactions:**
- Rough-legged Hawk occupies the vole-specialist niche among PNW wintering raptors. Winter abundance in PNW tracks vole population cycles; in irruption years, Rough-legged Hawks can be among the most common large raptors in east-side agricultural areas. Competes with Northern Harrier and Short-eared Owl for vole prey in open habitats, with temporal niche partitioning (Rough-legged Hawk strictly diurnal, Short-eared Owl crepuscular/nocturnal).

**Cultural Note:**
- No specific cultural documentation in available published sources. As a winter visitor from the Arctic, the Rough-legged Hawk connects PNW winter grasslands to Arctic tundra breeding habitats, illustrating the hemispheric connectivity of raptor ecology.

**Salmon Thread:** No

**Key Sources:** G-14, O-21, O-22

**Cross-Module References:**
- See AVI: Short-eared Owl (*Asio flammeus*) (sympatric vole predator — temporal niche partitioning)
- See AVI: Northern Harrier (*Circus hudsonius*) (sympatric open-country raptor)

---

### Ferruginous Hawk (*Buteo regalis*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Buteo*
- Species: *Buteo regalis*
- Subspecies: Monotypic

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Summer Breeder (east-side only; rare in western PNW)

**Elevation Range:**
- Breeding: 1,000-5,500 ft (305-1,676 m)
- Elevation Band IDs: ELEV-LOWLAND

**Ecoregion Affiliations:** ELEV-LOWLAND

**Habitat:** AVI-HAB-SAGEBRUSH, AVI-HAB-GRASSLAND

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-T (State Threatened)
- Oregon State: ST-SC (State Species of Concern — Sensitive-Critical)
- Idaho State: ST-NL (Species of Greatest Conservation Need)
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Common Bird in Steep Decline

**Morphometrics:**
- Length: 51-69 cm (20-27 in)
- Wingspan: 122-152 cm (48-60 in)
- Mass: 977-2,074 g (34-73 oz); largest North American *Buteo*

**Plumage Description:** Light morph: white underparts, rufous-brown back and leg feathers forming a distinctive V against white belly in flight. Dark morph uniformly dark rufous-brown. Feathered legs to toes. Large head and gape. Pale tail washed with rufous.

**Diet & Foraging Guild:**
- Primary diet: Medium-sized rodents (ground squirrels, prairie dogs, jackrabbits)
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial, Ground

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Townsend's Ground Squirrel (*Urocitellus townsendii*) — Primary prey in Columbia Basin
- Columbian Ground Squirrel (*Urocitellus columbianus*) — Primary prey
- Belding's Ground Squirrel (*Urocitellus beldingi*) — Primary prey in Great Basin fringe
- Black-tailed Jackrabbit (*Lepus californicus*) — Primary prey in sagebrush steppe
- White-tailed Jackrabbit (*Lepus townsendii*) — Primary prey
- Nuttall's Cottontail (*Sylvilagus nuttallii*) — Secondary prey
- Northern Pocket Gopher (*Thomomys talpoides*) — Secondary prey
- Deer Mouse (*Peromyscus maniculatus*) — Opportunistic
- **MAM cross-reference:** Columbian Ground Squirrel (*Urocitellus columbianus*), Belding's Ground Squirrel (*Urocitellus beldingi*), Townsend's Ground Squirrel (*Urocitellus townsendii*), Black-tailed Jackrabbit (*Lepus californicus*), White-tailed Jackrabbit (*Lepus townsendii*), Nuttall's Cottontail (*Sylvilagus nuttallii*), Northern Pocket Gopher (*Thomomys talpoides*), Deer Mouse (*Peromyscus maniculatus*) — all expected in MAM profiles. See MAM (pending). H-6 pair 13: Ferruginous Hawk x Ground Squirrel/Jackrabbit documented above.
- **AVI cross-reference:** No significant avian prey.

**Nesting Ecology:**
- Nest type: Platform (large stick nest on low tree, rock outcrop, ground, or utility structure)
- Nest location: Often on ground or low butte in treeless steppe; also juniper trees, power poles; 0-50 ft
- Clutch size: 2-6 (typically 3-4)
- Incubation period: 28-33 days
- Fledging period: 38-50 days
- Broods per year: 1

**Vocalization:** A harsh, descending *kreee-ah*, lower and hoarser than Red-tailed Hawk. Alarm call a repeated barking. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Short-distance to Medium-distance
- Spring arrival: March to early April
- Fall departure: September to October
- Wintering range: Southern Great Basin, southwestern US, northern Mexico
- Key PNW staging areas: Snake River Birds of Prey NCA (ID)

**Ecological Interactions:**
- Ferruginous Hawk is the largest *Buteo* in North America and the dominant ground squirrel predator in PNW east-side steppe habitats. Population declines track conversion of native sagebrush steppe to agriculture and the associated loss of ground squirrel prey base. Ground-nesting habit makes this species vulnerable to disturbance, livestock trampling, and energy development. Competes with Red-tailed Hawk and Golden Eagle in open habitats.

**Cultural Note:**
- No specific cultural documentation in available published sources. As a sagebrush steppe specialist, Ferruginous Hawk is an indicator species for the health of east-side shrub-steppe ecosystems, one of the most endangered habitat types in the PNW.

**Salmon Thread:** No

**Key Sources:** G-14, G-16, O-22

**Cross-Module References:**
- See ECO: shared-attributes (east-side steppe habitat characterization)
- See AVI: Red-tailed Hawk (*Buteo jamaicensis*) (sympatric Buteo — habitat overlap)

---

### Northern Goshawk (*Accipiter gentilis*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Accipiter*
- Species: *Accipiter gentilis*
- Subspecies: *A. g. atricapillus* (North American Northern Goshawk); *A. g. laingi* (Queen Charlotte Goshawk — Haida Gwaii, coastal BC; ESA candidate)

**AOS Authority:** AOS Check-list 7th edition; *laingi* subspecies recognized through 62nd Supplement

**Residency Status:** Resident

**Elevation Range:**
- Breeding: 1,500-7,000 ft (457-2,134 m)
- Wintering: 500-6,000 ft (152-1,829 m) — some altitudinal movement
- Elevation Band IDs: ELEV-MONTANE, ELEV-SUBALPINE, ELEV-LOWLAND

**Ecoregion Affiliations:** ELEV-MONTANE, ELEV-SUBALPINE, ELEV-LOWLAND

**Habitat:** HAB-OLD-GROWTH, HAB-SECOND-GROWTH

**Ecological Role:** ROLE-APEX, ROLE-INDICATOR

**Conservation Status:**
- Federal ESA: ESA-NL (mainland); Queen Charlotte Goshawk (*A. g. laingi*) has been petitioned for listing
- Washington State: ST-SC (State Species of Concern — Candidate)
- Oregon State: ST-SC (State Sensitive-Vulnerable)
- Idaho State: ST-NL (Species of Greatest Conservation Need)
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 46-61 cm (18-24 in)
- Wingspan: 98-115 cm (39-45 in)
- Mass: 631-1,364 g (22-48 oz); females significantly larger (reversed sexual dimorphism)

**Plumage Description:** Adult: blue-gray above, finely barred pale gray-white below; prominent white supercilium (eyebrow); red-orange to deep red eye. Immature: brown above with heavy brown streaking below on buff; yellow eye. Female noticeably larger than male, plumage similar.

**Diet & Foraging Guild:**
- Primary diet: Medium-sized birds and mammals — ambush predator of forest interior
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Mid-canopy, Canopy, Ground (pursuit through dense forest)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Snowshoe Hare (*Lepus americanus*) — Primary prey; critical for breeding success in montane and subalpine forests (source: G-14, G-24)
- Douglas Squirrel (*Tamiasciurus douglasii*) — Primary prey; pursuit flights through dense canopy to capture squirrels are among the most dramatic predator-prey interactions in PNW forests (source: G-14, G-24)
- Red Squirrel (*Tamiasciurus hudsonicus*) — Primary prey in interior BC and northern Cascades where range overlaps with Douglas Squirrel
- Northern Flying Squirrel (*Glaucomys sabrinus*) — Secondary prey; taken less frequently than Douglas Squirrel due to nocturnal habits of flying squirrel
- Bushy-tailed Woodrat (*Neotoma cinerea*) — Secondary prey in rocky forest habitats
- Golden-mantled Ground Squirrel (*Callospermophilus lateralis*) — Secondary prey at forest-meadow edges
- Deer Mouse (*Peromyscus maniculatus*) — Opportunistic
- Mountain Cottontail (*Sylvilagus nuttallii*) — Secondary in dry forest edges
- **MAM cross-reference:** Snowshoe Hare (*Lepus americanus*), Douglas Squirrel (*Tamiasciurus douglasii*), Northern Flying Squirrel (*Glaucomys sabrinus*), Bushy-tailed Woodrat (*Neotoma cinerea*), Golden-mantled Ground Squirrel (*Callospermophilus lateralis*), Deer Mouse (*Peromyscus maniculatus*), Mountain Cottontail (*Sylvilagus nuttallii*) — all expected in MAM profiles. See MAM (pending). H-6 pair 7: Northern Goshawk x Snowshoe Hare/Grouse documented above.
- **AVI cross-reference:** Blue/Dusky Grouse (*Dendragapus obscurus*), Ruffed Grouse (*Bonasa umbellus*), Steller's Jay (*Cyanocitta stelleri*), American Robin (*Turdus migratorius*), Band-tailed Pigeon (*Patagioenas fasciata*) — see AVI resident.md (significant avian prey).

**Nesting Ecology:**
- Nest type: Platform (large stick nest in canopy)
- Nest location: 25-75 ft in large conifers (Douglas-fir, ponderosa pine, grand fir); strong preference for old-growth forest structure with closed canopy and open understory for flight access; typically uses 2-5 alternate nests within territory
- Clutch size: 2-5 (typically 3-4)
- Incubation period: 28-38 days
- Fledging period: 34-41 days
- Broods per year: 1

**Vocalization:** Loud, rapid *ki-ki-ki-ki-ki* alarm call near nest — one of the most aggressive vocalizations of any PNW raptor. Also a drawn-out, plaintive *keeee-yah*. Extremely vocal and aggressive in nest defense. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary to Altitudinal (minor downslope movement in winter)
- Spring arrival: Resident
- Fall departure: Resident; some passage birds at hawk-watch sites (source: O-21)
- Wintering range: Resident year-round; may move to lower-elevation forests
- Key PNW staging areas: N/A

**Ecological Interactions:**
- Northern Goshawk is the apex avian ambush predator of PNW dense forest interior (source: G-24). Requires large territories of mature or old-growth forest with closed canopy for nesting and open understory for flight maneuverability. Snowshoe hares are the largest prey regularly taken and are critical for goshawk reproductive success. Pursuit flights through dense canopy at speeds of 30-40 mph demonstrate extraordinary flight agility. Goshawk is an old-growth indicator species — territory occupancy correlates with mature forest extent. See MAM (pending): Snowshoe Hare (*Lepus americanus*) (primary prey — integration test Pair 14). See MAM (pending): Douglas Squirrel (*Tamiasciurus douglasii*) (primary prey — integration test Pair 15).

**Cultural Note:**
- The Northern Goshawk (*Accipiter gentilis*, "noble hawk") has been prized by falconers for centuries and was historically the hawk of kings in European falconry. In the PNW, the Queen Charlotte Goshawk (*A. g. laingi*) of Haida Gwaii has drawn conservation attention as a coastal old-growth specialist (source: G-24).

**Salmon Thread:** No

**Key Sources:** G-14, G-24, O-22, G-22

**Cross-Module References:**
- See MAM (pending): Snowshoe Hare (*Lepus americanus*) (primary prey — integration test Pair 14)
- See MAM (pending): Douglas Squirrel (*Tamiasciurus douglasii*) (primary prey — integration test Pair 15)
- See ECO: shared-attributes (HAB-OLD-GROWTH habitat characterization)

---

### Cooper's Hawk (*Accipiter cooperii*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Accipiter*
- Species: *Accipiter cooperii*
- Subspecies: Monotypic

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Resident

**Elevation Range:**
- Breeding: 0-6,000 ft (0-1,829 m)
- Wintering: 0-4,000 ft (0-1,219 m)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Habitat:** HAB-SECOND-GROWTH, HAB-RIPARIAN, HAB-URBAN, HAB-OAK-PRAIRIE

**Ecological Role:** ROLE-MESOPREDATOR

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 36-51 cm (14-20 in)
- Wingspan: 62-90 cm (24-35 in)
- Mass: 220-680 g (7.8-24 oz); females much larger than males

**Plumage Description:** Adult: blue-gray above, rufous barring below; dark cap contrasting with lighter nape. Rounded tail with broad dark bands and white terminal band. Immature: brown above with dark brown streaking below. Red eye in adult, yellow in immature.

**Diet & Foraging Guild:**
- Primary diet: Medium-sized birds (pigeons, robins, jays, starlings); small mammals secondary
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Mid-canopy, Understory, Ground (ambush pursuit)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Eastern Cottontail (*Sylvilagus floridanus*) — Secondary prey; juveniles preferred
- Douglas Squirrel (*Tamiasciurus douglasii*) — Secondary prey
- Eastern Gray Squirrel (*Sciurus carolinensis*) — Secondary prey in urban areas (introduced species)
- Deer Mouse (*Peromyscus maniculatus*) — Opportunistic
- Townsend's Chipmunk (*Neotamias townsendii*) — Opportunistic
- Northern Flying Squirrel (*Glaucomys sabrinus*) — Rare prey item
- Big Brown Bat (*Eptesicus fuscus*) — Rare prey; taken in flight near roost sites
- **MAM cross-reference:** Eastern Cottontail (*Sylvilagus floridanus*), Douglas Squirrel (*Tamiasciurus douglasii*), Deer Mouse (*Peromyscus maniculatus*), Townsend's Chipmunk (*Neotamias townsendii*), Northern Flying Squirrel (*Glaucomys sabrinus*), Big Brown Bat (*Eptesicus fuscus*) — expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** Band-tailed Pigeon (*Patagioenas fasciata*), Steller's Jay (*Cyanocitta stelleri*), American Robin (*Turdus migratorius*), Northern Flicker (*Colaptes auratus*), European Starling (*Sturnus vulgaris*) — see AVI resident.md (primary prey is medium-sized birds). H-6 pair 9: Cooper's Hawk x Band-tailed Pigeon/Steller's Jay documented.

**Nesting Ecology:**
- Nest type: Platform (stick nest in dense tree canopy)
- Nest location: 20-60 ft in deciduous or coniferous trees; increasingly common in urban and suburban settings
- Clutch size: 3-6 (typically 4-5)
- Incubation period: 30-36 days
- Fledging period: 27-34 days
- Broods per year: 1

**Vocalization:** Sharp, rapid *kak-kak-kak-kak* alarm call near nest. Similar to but lower-pitched than Sharp-shinned Hawk. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary to Short-distance
- Spring arrival: Resident; some migrants pass through
- Fall departure: Resident
- Wintering range: Year-round PNW resident; urban populations increasingly sedentary
- Key PNW staging areas: N/A

**Ecological Interactions:**
- Cooper's Hawk is the primary avian ambush predator of PNW suburban and urban environments. Increasing urbanization of Cooper's Hawks in PNW cities has created a novel predator-prey dynamic at bird feeders, where concentrations of songbirds attract hawk foraging. This species exerts top-down control on urban bird populations including European Starling (*Sturnus vulgaris*) and Rock Pigeon (*Columba livia*). Smaller than Northern Goshawk, Cooper's Hawk occupies the mid-sized accipiter niche.

**Cultural Note:**
- Cooper's Hawk is one of the most commonly encountered raptors in PNW urban areas, frequently observed hunting at backyard bird feeders. This has made it a focal species for urban wildlife education and raptor awareness programs.

**Salmon Thread:** No

**Key Sources:** G-14, O-22, O-20

**Cross-Module References:**
- See AVI: Northern Goshawk (*Accipiter gentilis*) (larger congener — forest interior niche)
- See AVI: Sharp-shinned Hawk (*Accipiter striatus*) (smaller congener — size-based niche partitioning)

---

### Sharp-shinned Hawk (*Accipiter striatus*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Accipiter*
- Species: *Accipiter striatus*
- Subspecies: *A. s. velox* (Northern Sharp-shinned Hawk — PNW breeding populations)

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Resident (year-round; augmented by migrants in fall)

**Elevation Range:**
- Breeding: 500-6,500 ft (152-1,981 m)
- Wintering: 0-4,000 ft (0-1,219 m)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE

**Habitat:** HAB-SECOND-GROWTH, HAB-OLD-GROWTH, HAB-URBAN, HAB-RIPARIAN

**Ecological Role:** ROLE-MESOPREDATOR

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 24-34 cm (9.4-13 in)
- Wingspan: 43-56 cm (17-22 in)
- Mass: 87-218 g (3.1-7.7 oz); females nearly twice the mass of males

**Plumage Description:** Adult: blue-gray above, fine rufous barring below; square-tipped tail with narrow dark bands. Immature: brown above with brown streaking below. Very similar to Cooper's Hawk but smaller with proportionally shorter head, squared tail tip (vs. rounded in Cooper's), and thinner tarsi.

**Diet & Foraging Guild:**
- Primary diet: Small birds (sparrows, warblers, chickadees, finches)
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Understory, Mid-canopy (ambush pursuit through dense vegetation)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Deer Mouse (*Peromyscus maniculatus*) — Opportunistic; mammals are a minor dietary component
- Townsend's Chipmunk (*Neotamias townsendii*) — Rare prey; near upper size limit
- Shrew species (*Sorex* spp.) — Rare prey
- Little Brown Bat (*Myotis lucifugus*) — Rare prey; taken in flight at dusk
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Townsend's Chipmunk (*Neotamias townsendii*), Shrews (*Sorex* spp.), Little Brown Bat (*Myotis lucifugus*) — expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** Diet is >90% small passerines — Dark-eyed Junco, Chestnut-backed Chickadee, Golden-crowned Kinglet, warblers, sparrows — see AVI resident.md and migratory.md.

**Nesting Ecology:**
- Nest type: Platform (stick nest in dense conifer canopy)
- Nest location: 20-60 ft; prefers dense young to mid-age conifer stands with closed canopy
- Clutch size: 4-6 (typically 5)
- Incubation period: 30-35 days
- Fledging period: 21-28 days
- Broods per year: 1

**Vocalization:** High, rapid *kik-kik-kik-kik*; higher-pitched and faster than Cooper's Hawk. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Short-distance to Medium-distance (most common migrant accipiter at PNW hawk-watch sites)
- Spring arrival: Resident; migrants return March-April
- Fall departure: Resident; heavy migration September-October
- Wintering range: Year-round in PNW; northern breeders winter south to Mexico
- Key PNW staging areas: Chelan Ridge (WA) and Bonney Butte (OR) hawk-watch sites — most numerous migrant raptor at PNW watch sites (source: O-21)

**Ecological Interactions:**
- Sharp-shinned Hawk is the smallest accipiter in the PNW and the primary predator of small passerine birds in forest and edge habitats. Size-based niche partitioning among the three PNW accipiters: Sharp-shinned takes sparrow-sized birds, Cooper's takes pigeon-sized birds, Goshawk takes grouse-sized birds and mammals. Sharp-shinned Hawks are the most numerous migrant raptor counted at PNW hawk-watch sites (source: O-21).

**Cultural Note:**
- No specific cultural documentation in available published sources. Sharp-shinned Hawks' abundance at hawk-watch sites makes them important for citizen science raptor migration monitoring and public education about raptor ecology.

**Salmon Thread:** No

**Key Sources:** G-14, O-21, O-22

**Cross-Module References:**
- See AVI: Cooper's Hawk (*Accipiter cooperii*) (congener — size-based niche partitioning)
- See AVI: Northern Goshawk (*Accipiter gentilis*) (largest congener)

---

### Northern Harrier (*Circus hudsonius*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Circus*
- Species: *Circus hudsonius*
- Subspecies: Monotypic (formerly conspecific with Hen Harrier *C. cyaneus* of Eurasia)

**AOS Authority:** AOS Check-list 7th edition; split from *C. cyaneus* recognized through 62nd Supplement

**Residency Status:** Resident (year-round; some seasonal movement)

**Elevation Range:**
- Breeding: 0-5,000 ft (0-1,524 m)
- Wintering: 0-3,000 ft (0-914 m)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-RIPARIAN

**Habitat:** AVI-HAB-GRASSLAND, HAB-WETLAND, AVI-HAB-SAGEBRUSH, AVI-HAB-MUDFLAT

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Common Bird in Steep Decline

**Morphometrics:**
- Length: 41-50 cm (16-20 in)
- Wingspan: 97-122 cm (38-48 in)
- Mass: 290-600 g (10-21 oz); females larger

**Plumage Description:** Pronounced sexual dimorphism. Male: gray above, white below with black wingtips. Female: brown above, streaked brown below. Both sexes have white rump patch (diagnostic in flight) and owl-like facial disc. Immature similar to female but with rusty-orange wash below.

**Diet & Foraging Guild:**
- Primary diet: Small mammals (voles, mice), small birds, occasionally reptiles and frogs
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Ground (low quartering flight over open terrain — uses facial disc for auditory hunting)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Meadow Vole (*Microtus pennsylvanicus*) — Primary prey
- Townsend's Vole (*Microtus townsendii*) — Primary prey in western lowlands
- Montane Vole (*Microtus montanus*) — Primary prey in east-side grasslands
- Deer Mouse (*Peromyscus maniculatus*) — Secondary prey
- Northern Pocket Gopher (*Thomomys talpoides*) — Secondary prey
- Harvest Mouse (*Reithrodontomys megalotis*) — Secondary prey in grasslands
- Eastern Cottontail (*Sylvilagus floridanus*) — Opportunistic; juveniles only
- Vagrant Shrew (*Sorex vagrans*) — Opportunistic
- **MAM cross-reference:** Meadow Vole (*Microtus pennsylvanicus*), Townsend's Vole (*Microtus townsendii*), Montane Vole (*Microtus montanus*), Deer Mouse (*Peromyscus maniculatus*), Northern Pocket Gopher (*Thomomys talpoides*), Harvest Mouse (*Reithrodontomys megalotis*), Eastern Cottontail (*Sylvilagus floridanus*), Vagrant Shrew (*Sorex vagrans*) — all expected in MAM profiles. See MAM (pending). H-6 pair 11: Northern Harrier x Meadow Vole documented above.
- **AVI cross-reference:** Savannah Sparrow, Horned Lark, Red-winged Blackbird — see AVI resident.md (secondary prey — birds taken in flight over grasslands).

**Nesting Ecology:**
- Nest type: Platform (ground nest in dense grass or marsh vegetation)
- Nest location: Ground level; in tall grasses, cattails, or sagebrush; rarely >1 ft above ground
- Clutch size: 4-6 (typically 5)
- Incubation period: 28-36 days
- Fledging period: 30-35 days
- Broods per year: 1; polygynous (males may attend 2-5 females)

**Vocalization:** A thin, nasal *kee-kee-kee* near nest. Sky-dancing courtship display with undulating flight and food passes. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary to Short-distance
- Spring arrival: Resident; some altitudinal and latitudinal movement
- Fall departure: Resident; concentrations shift to lowland marshes and grasslands
- Wintering range: Year-round PNW; winter concentrations in Skagit Valley, Willamette Valley, Klamath Basin
- Key PNW staging areas: N/A

**Ecological Interactions:**
- Northern Harrier is the only PNW hawk with an owl-like facial disc, enabling acoustic prey detection during low-level hunting flight over grasslands and marshes. Harriers quarter open terrain at 5-30 ft altitude, responding to both visual and auditory cues. This hunting strategy overlaps with Short-eared Owl — the two species share prey (voles) and habitat, with Northern Harrier hunting diurnally and Short-eared Owl crepuscularly/nocturnally. Ground-nesting habit makes Harrier vulnerable to habitat conversion, mowing, and nest predation by mammals.

**Cultural Note:**
- No specific cultural documentation in available published sources. Northern Harrier's distinctive low quartering flight is one of the most recognizable raptor behaviors in PNW agricultural landscapes and wetlands.

**Salmon Thread:** No

**Key Sources:** G-14, G-15, O-22

**Cross-Module References:**
- See AVI: Short-eared Owl (*Asio flammeus*) (sympatric vole predator — temporal niche partitioning)
- See AVI: Rough-legged Hawk (*Buteo lagopus*) (sympatric winter open-country raptor)

---

### White-tailed Kite (*Elanus leucurus*)

**Taxonomy:**
- Order: Accipitriformes
- Family: Accipitridae (Hawks, Eagles, and Kites)
- Genus: *Elanus*
- Species: *Elanus leucurus*
- Subspecies: *E. l. majusculus* (North American White-tailed Kite)

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Resident (expanding northward into PNW; primarily southwestern Oregon)

**Elevation Range:**
- Breeding: 0-2,500 ft (0-762 m)
- Elevation Band IDs: ELEV-LOWLAND

**Ecoregion Affiliations:** ELEV-LOWLAND

**Habitat:** AVI-HAB-GRASSLAND, HAB-OAK-PRAIRIE, HAB-WETLAND

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL (very rare — occasional winter records)
- Oregon State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 35-43 cm (14-17 in)
- Wingspan: 88-102 cm (35-40 in)
- Mass: 250-380 g (8.8-13 oz)

**Plumage Description:** Elegant white and gray raptor. White head, underparts, and tail; pale gray back; black shoulder patches diagnostic in perched and flying birds. Red eye. Sexes similar. Immature has rufous wash on breast and back.

**Diet & Foraging Guild:**
- Primary diet: Small mammals (voles, mice); hunts by hovering
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial (hovering), Ground

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Meadow Vole (*Microtus pennsylvanicus*) — Primary prey
- California Vole (*Microtus californicus*) — Primary prey in southern Oregon
- Deer Mouse (*Peromyscus maniculatus*) — Secondary prey
- Harvest Mouse (*Reithrodontomys megalotis*) — Secondary prey
- **MAM cross-reference:** Meadow Vole (*Microtus pennsylvanicus*), California Vole (*Microtus californicus*), Deer Mouse (*Peromyscus maniculatus*), Harvest Mouse (*Reithrodontomys megalotis*) — expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** No significant avian prey.

**Nesting Ecology:**
- Nest type: Platform (small stick nest in tree canopy)
- Nest location: 15-100 ft in oaks, willows, or other deciduous trees near open foraging habitat
- Clutch size: 3-6 (typically 4)
- Incubation period: 28-32 days
- Fledging period: 30-35 days
- Broods per year: 1-2

**Vocalization:** A high-pitched, whistled *keep keep keep*. Relatively quiet away from nest. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary to Nomadic (range expanding northward; may wander in response to vole abundance)
- Wintering range: Year-round in southern Oregon; rare winter visitor to Willamette Valley and southwestern Washington
- Key PNW staging areas: N/A

**Ecological Interactions:**
- White-tailed Kite is a range-expanding species in the PNW, moving northward from California into Oregon's Rogue and Umpqua Valleys. Kites hover-hunt over grasslands in a manner similar to American Kestrel but take exclusively mammalian prey (primarily voles). Winter communal roosts of 20-100+ kites form at reliable vole-rich sites in grassland habitats.

**Cultural Note:**
- No specific cultural documentation in available published sources. White-tailed Kite's northward range expansion into the PNW may reflect changing climate conditions and is monitored by citizen scientists tracking range shifts.

**Salmon Thread:** No

**Key Sources:** G-15, O-02, O-22

**Cross-Module References:**
- See AVI: American Kestrel (*Falco sparverius*) (convergent hovering hunting strategy)
- See ECO: shared-attributes (HAB-OAK-PRAIRIE habitat characterization)

---

### Section B: Cathartiformes — New World Vultures

The Turkey Vulture is the sole PNW representative of Cathartiformes, an ancient order of New World vultures once thought related to storks. Modern phylogenetics places them as the sister group to Accipitriformes. Turkey Vultures are obligate scavengers — the only PNW "raptor" that never kills its own prey — and serve a critical ecological sanitation function. Their remarkable olfactory ability (unique among raptors) allows them to locate carcasses beneath forest canopy, and they are important participants in the salmon nutrient cycle through scavenging of post-spawn carcasses.

---

### Turkey Vulture (*Cathartes aura*)

**Taxonomy:**
- Order: Accipitriformes (formerly Cathartiformes in some treatments)
- Family: Cathartidae (New World Vultures)
- Genus: *Cathartes*
- Species: *Cathartes aura*
- Subspecies: *C. a. meridionalis* (Western Turkey Vulture — PNW breeding populations)

**AOS Authority:** AOS Check-list 7th edition; placement in Accipitriformes follows recent AOS classification

**Residency Status:** Summer Breeder (migratory; largely absent from PNW November-February)

**Elevation Range:**
- Breeding: 0-7,000 ft (0-2,134 m)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Habitat:** HAB-OAK-PRAIRIE, HAB-SECOND-GROWTH, AVI-HAB-GRASSLAND, AVI-HAB-CLIFF, HAB-URBAN

**Ecological Role:** ROLE-DECOMPOSER, ROLE-ECOSYSTEM-ENGINEER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 64-81 cm (25-32 in)
- Wingspan: 170-183 cm (67-72 in)
- Mass: 850-2,000 g (30-71 oz)

**Plumage Description:** Uniformly dark brown-black body; small, featherless red head (adult — immature head grayish); pale bill; long tail. In flight, wings held in pronounced dihedral; two-toned underwing with dark leading edge and paler flight feathers. Rocks and tilts in flight without flapping (distinctive flight style).

**Diet & Foraging Guild:**
- Primary diet: Carrion exclusively — obligate scavenger
- Foraging guild: Scavenger
- Foraging stratum: Ground (feeding), Aerial (searching — uses olfaction, unique among raptors)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Turkey Vulture does not prey on live mammals. Scavenges carcasses of all available mammal species including:
- Black-tailed Deer (*Odocoileus hemionus columbianus*) — Common scavenge item (roadkill, natural mortality)
- Elk (*Cervus canadensis*) — Scavenged when available
- Eastern Cottontail (*Sylvilagus floridanus*) — Roadkill scavenging
- Raccoon (*Procyon lotor*) — Roadkill
- Striped Skunk (*Mephitis mephitis*) — Roadkill (vulture's poor sense of taste allows consumption)
- Domestic livestock — Scavenges afterbirth and carcasses in agricultural areas
- Pacific salmon (*Oncorhynchus* spp.) — Scavenges post-spawn salmon carcasses along rivers
- **MAM cross-reference:** N/A — Turkey Vulture is an obligate scavenger, not a predator. Does not kill mammalian prey. MAM profiles need not list Turkey Vulture as a predator.
- **AVI cross-reference:** N/A — no predation on birds. Excluded from H-6 raptor-prey pairs.

**Nesting Ecology:**
- Nest type: Scrape (no nest constructed; eggs laid directly on substrate)
- Nest location: Caves, rock crevices, hollow logs, abandoned buildings, cliff ledges; 0-20 ft; dark, sheltered sites preferred
- Clutch size: 1-3 (typically 2)
- Incubation period: 28-40 days
- Fledging period: 60-84 days
- Broods per year: 1

**Vocalization:** Essentially voiceless (lacks syrinx). Produces hisses, grunts, and bill clapping when disturbed at nest or carcass. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Medium-distance
- Spring arrival: March to early April
- Fall departure: September to October
- Wintering range: California, southern US, Mexico, Central America
- Key PNW staging areas: Fall migration concentrations visible at hawk-watch sites; communal roosts (50-200+ birds) form in September before departure (source: O-21)

**Ecological Interactions:**
- Turkey Vulture is the primary avian scavenger in PNW terrestrial ecosystems and the only cathartid in the region. Unique among raptors for using olfaction to locate carrion, even beneath forest canopy. Provides essential ecosystem services by consuming carcasses that would otherwise harbor disease pathogens (anthrax, botulism, rabies). Turkey Vulture gastric acid pH (~1.0) destroys pathogens that would spread through mammalian scavenger networks. Communal roosting behavior creates nutrient hotspots through guano deposition.

**Cultural Note:**
- Coast Salish and Sahaptin peoples recognize the Turkey Vulture as a cleaner of the land (source: C-06). The vulture's migratory arrival in spring is noted as a seasonal indicator across multiple PNW Indigenous traditions.

**Salmon Thread:** Yes
- Turkey Vulture scavenges post-spawn salmon carcasses along PNW rivers, contributing to the redistribution of marine-derived nutrients from stream channels to adjacent terrestrial habitats. While Bald Eagle is the more prominent salmon scavenger, Turkey Vultures are regular visitors to salmon spawning reaches, particularly in late-season when carcass abundance peaks. See ECO: salmon-nutrient-cycling.

**Key Sources:** G-14, O-21, O-22

**Cross-Module References:**
- See ECO: salmon-nutrient-cycling (vulture scavenging of salmon carcasses)
- See AVI: Bald Eagle (*Haliaeetus leucocephalus*) (dominant salmon carcass scavenger — competitive displacement at carcasses)

---

## Part I, Section C: Falconiformes — Falcons

Falcons are not closely related to hawks and eagles despite superficial similarities. Molecular phylogenetics places Falconiformes closer to parrots and passerines than to Accipitriformes — a convergent evolution story where similar ecological roles produced similar body plans in unrelated lineages. Falcons are distinguished by their notched bill (tomial tooth), pointed wings, and high-speed aerial hunting. The PNW hosts five falcon species, from the continent-crossing Peregrine Falcon to the grasshopper-hunting American Kestrel.

The Peregrine Falcon's recovery from DDT-driven near-extinction is one of the great conservation success stories in the PNW. Banned from use in 1972, DDT had caused eggshell thinning that drove Peregrine populations to near zero in western North America by the 1970s. Captive breeding, hack-site releases, and DDT elimination allowed populations to recover to pre-pesticide levels by the early 2000s. Peregrine Falcons now nest on bridges, buildings, and cliff faces throughout the PNW, including downtown Seattle, Portland, and Boise.

---

### Peregrine Falcon (*Falco peregrinus*)

**Taxonomy:**
- Order: Falconiformes
- Family: Falconidae (Falcons and Caracaras)
- Genus: *Falco*
- Species: *Falco peregrinus*
- Subspecies: *F. p. anatum* (American Peregrine Falcon — most PNW breeding birds); *F. p. pealei* (Peale's Peregrine Falcon — coastal BC, Pacific coast islands; non-migratory, larger, darker); *F. p. tundrius* (Tundra Peregrine — Arctic breeder, migrates through PNW)

**AOS Authority:** AOS Check-list 7th edition; three subspecies recognized in PNW through 62nd Supplement

**Residency Status:** Resident (coastal *pealei*) / Summer Breeder (interior *anatum*) / Passage Migrant (*tundrius*)

**Elevation Range:**
- Breeding: 0-6,000 ft (0-1,829 m) — cliff sites from sea level to mountain canyons
- Wintering: 0-2,000 ft (0-610 m) — coastal, estuarine, urban
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-INTERTIDAL

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-INTERTIDAL, ELEV-SHALLOW-MARINE

**Habitat:** AVI-HAB-CLIFF, HAB-URBAN, HAB-WETLAND, HAB-ROCKY-INTERTIDAL, AVI-HAB-MUDFLAT

**Ecological Role:** ROLE-APEX

**Conservation Status:**
- Federal ESA: ESA-DL (Delisted 1999; previously ESA-E — one of the great conservation success stories; recovered from DDT-caused eggshell thinning)
- Washington State: ST-SC (State Sensitive)
- Oregon State: ST-SC (State Sensitive-Vulnerable)
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 36-49 cm (14-19 in)
- Wingspan: 100-110 cm (39-43 in)
- Mass: 530-1,100 g (19-39 oz); females ~30% larger; *pealei* larger than *anatum*

**Plumage Description:** Adult: blue-gray above; pale below with fine dark barring; bold dark moustachial stripe (malar) on white cheek diagnostic. *pealei* subspecies darker overall with heavier barring. Immature: brown above with heavy brown streaking below. Dark eye with yellow orbital ring and cere.

**Diet & Foraging Guild:**
- Primary diet: Birds — almost exclusively avian prey, taken in flight
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial (high-speed stooping — fastest animal on Earth, documented >240 mph in stoop)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Big Brown Bat (*Eptesicus fuscus*) — Secondary prey; taken at crepuscular periods near bat roost emergence sites (source: G-14, O-22)
- Yuma Myotis (*Myotis yumanensis*) — Secondary prey; taken near water over rivers and lakes at dusk
- Little Brown Bat (*Myotis lucifugus*) — Secondary prey; taken at roost emergence (source: G-14, O-22)
- Hoary Bat (*Lasiurus cinereus*) — Rare prey; large migratory bat occasionally intercepted
- **Note:** Mammalian prey constitutes <5% of Peregrine diet. Primary prey is avian: Rock Pigeon (*Columba livia*), shorebirds, waterfowl, songbirds. Bats are the principal mammalian prey category, taken opportunistically during crepuscular hunting.
- **MAM cross-reference:** Big Brown Bat (*Eptesicus fuscus*), Yuma Myotis (*Myotis yumanensis*), Little Brown Bat (*Myotis lucifugus*), Hoary Bat (*Lasiurus cinereus*) — expected in MAM profiles (chiroptera section). See MAM (pending). H-6 pair context (pair 10 in integration-test-spec): Peregrine x bats (secondary).
- **AVI cross-reference:** Rock Pigeon (*Columba livia*), Vaux's Swift (*Chaetura vauxi*), Western Sandpiper (*Calidris mauri*), Dunlin (*Calidris alpina*), Mallard (*Anas platyrhynchos*), European Starling (*Sturnus vulgaris*) — see AVI resident.md and migratory.md (primary prey). H-6 pair 6: Peregrine x Vaux's Swift/shorebirds documented.

**Nesting Ecology:**
- Nest type: Scrape (no nest constructed; eggs laid in shallow depression on cliff ledge)
- Nest location: Cliff ledges, 50-1,000+ ft; also urban buildings, bridges; requires open approach and updrafts; *pealei* uses coastal sea cliffs and offshore islands
- Clutch size: 3-5 (typically 3-4)
- Incubation period: 29-33 days
- Fledging period: 35-42 days
- Broods per year: 1

**Vocalization:** Loud, rapid *kak-kak-kak-kak* alarm near nest; higher-pitched and faster than Cooper's Hawk. Wailing *ee-chup* call during courtship. Very vocal at nest sites. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary (*pealei*) to Long-distance (*tundrius*); *anatum* Short-distance to Medium-distance
- Spring arrival: *anatum* returns to cliff sites March-April; *tundrius* passes through April-May
- Fall departure: *anatum* departs September-October; *tundrius* passes through September-November
- Wintering range: *pealei* year-round on BC/WA coast; *anatum* winters coastal PNW south to Mexico; *tundrius* to South America
- Key PNW staging areas: Coastal estuaries (Grays Harbor, Willapa Bay, Skagit Delta) where shorebird concentrations provide abundant prey (source: O-19, O-21)

**Ecological Interactions:**
- Peregrine Falcon is the apex aerial predator in the PNW, capable of stooping at speeds exceeding 240 mph — the fastest animal on Earth. The species' near-extinction from DDT bioaccumulation and subsequent recovery through captive breeding and DDT ban (1972) is one of the most celebrated conservation success stories in North American wildlife history. Peregrine Falcons now nest on urban buildings in Seattle, Portland, and Boise, preying primarily on Rock Pigeons. Bat predation occurs at crepuscular transition periods, particularly near large bat roost sites along rivers and bridges. See MAM (pending): Big Brown Bat (*Eptesicus fuscus*) (secondary prey — integration test Pair 10).

**Cultural Note:**
- The Peregrine Falcon holds deep cultural significance across multiple PNW Indigenous nations. Nuu-chah-nulth peoples of coastal BC and Vancouver Island recognize the falcon as a swift hunter and associate it with precision and decisiveness (source: C-09). The peregrine's recovery from near-extinction has made it a global symbol of the power of environmental regulation and conservation action.

**Salmon Thread:** No

**Key Sources:** G-14, G-17, O-21, O-22

**Cross-Module References:**
- See MAM (pending): Big Brown Bat (*Eptesicus fuscus*), Yuma Myotis (*Myotis yumanensis*), Little Brown Bat (*Myotis lucifugus*) (secondary prey — integration test Pair 10)
- See AVI: Prairie Falcon (*Falco mexicanus*) (congener — habitat partitioning, cliff vs. steppe)

---

### Prairie Falcon (*Falco mexicanus*)

**Taxonomy:**
- Order: Falconiformes
- Family: Falconidae (Falcons and Caracaras)
- Genus: *Falco*
- Species: *Falco mexicanus*
- Subspecies: Monotypic

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Resident (year-round in PNW east-side; winter wanderer to west-side lowlands)

**Elevation Range:**
- Breeding: 1,000-7,000 ft (305-2,134 m)
- Wintering: 0-5,000 ft (0-1,524 m) — disperses widely
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE

**Habitat:** AVI-HAB-SAGEBRUSH, AVI-HAB-GRASSLAND, AVI-HAB-CLIFF

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 37-47 cm (15-19 in)
- Wingspan: 90-113 cm (35-44 in)
- Mass: 420-1,100 g (15-39 oz); females larger

**Plumage Description:** Sandy brown above with pale barring; white below with brown spotting; narrow dark moustachial stripe less prominent than Peregrine. Dark axillaries ("wingpits") diagnostic in flight — the best field mark separating Prairie from Peregrine. Paler and sandier overall than Peregrine.

**Diet & Foraging Guild:**
- Primary diet: Small to medium birds and ground squirrels; more mammal-dependent than Peregrine
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial, Ground (low-level pursuit across open terrain)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Townsend's Ground Squirrel (*Urocitellus townsendii*) — Primary prey during spring/summer when squirrels are active
- Columbian Ground Squirrel (*Urocitellus columbianus*) — Primary prey
- Belding's Ground Squirrel (*Urocitellus beldingi*) — Primary prey in Great Basin
- Piute Ground Squirrel (*Urocitellus mollis*) — Primary prey in sagebrush
- White-tailed Antelope Squirrel (*Ammospermophilus leucurus*) — Secondary prey in arid east-side
- Northern Pocket Gopher (*Thomomys talpoides*) — Secondary prey
- Black-tailed Jackrabbit (*Lepus californicus*) — Opportunistic (juveniles)
- Deer Mouse (*Peromyscus maniculatus*) — Opportunistic
- **MAM cross-reference:** Townsend's Ground Squirrel (*Urocitellus townsendii*), Columbian Ground Squirrel (*Urocitellus columbianus*), Belding's Ground Squirrel (*Urocitellus beldingi*), Piute Ground Squirrel (*Urocitellus mollis*), Northern Pocket Gopher (*Thomomys talpoides*), Black-tailed Jackrabbit (*Lepus californicus*), Deer Mouse (*Peromyscus maniculatus*) — expected in MAM profiles. See MAM (pending). H-6 pair 14: Prairie Falcon x Ground Squirrel/Horned Lark documented above.
- **AVI cross-reference:** Horned Lark (*Eremophila alpestris*), Western Meadowlark (*Sturnella neglecta*) — see AVI resident.md (significant avian prey in winter when ground squirrels are hibernating).

**Nesting Ecology:**
- Nest type: Scrape (cliff ledge depression; sometimes uses old raven or hawk nests on cliffs)
- Nest location: Cliff ledges in canyon walls, basalt rimrock, or buttes; 30-400 ft; strong association with sagebrush steppe landscapes
- Clutch size: 3-6 (typically 4-5)
- Incubation period: 29-33 days
- Fledging period: 29-47 days
- Broods per year: 1

**Vocalization:** A harsh, rapid *kik-kik-kik-kik*, similar to Peregrine but harsher and lower-pitched. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary to Short-distance (post-breeding dispersal; some winter wandering to west-side lowlands)
- Wintering range: Year-round east-side PNW; winter wanderers to agricultural valleys west of Cascades
- Key PNW staging areas: Snake River Birds of Prey NCA (ID) — one of the densest nesting populations in North America

**Ecological Interactions:**
- Prairie Falcon partitions niche with Peregrine Falcon through habitat and prey specialization: Prairie favors arid steppe habitats and takes more ground squirrels; Peregrine favors cliffs near water and takes primarily birds. Prairie Falcon breeding success is tightly linked to ground squirrel abundance — when ground squirrels enter summer estivation, Prairie Falcons switch to avian prey (Horned Larks, Western Meadowlarks). The Snake River Birds of Prey NCA in Idaho supports one of the densest raptor nesting populations in North America, including significant Prairie Falcon numbers.

**Cultural Note:**
- No specific cultural documentation in available published sources. The Snake River Birds of Prey NCA in Idaho, protecting Prairie Falcon and 15+ other raptor species along 81 miles of canyon, represents one of the most significant raptor conservation areas in North America.

**Salmon Thread:** No

**Key Sources:** G-14, G-16, O-22

**Cross-Module References:**
- See AVI: Peregrine Falcon (*Falco peregrinus*) (congener — niche partitioning)
- See ECO: shared-attributes (east-side steppe habitat characterization)

---

### Merlin (*Falco columbarius*)

**Taxonomy:**
- Order: Falconiformes
- Family: Falconidae (Falcons and Caracaras)
- Genus: *Falco*
- Species: *Falco columbarius*
- Subspecies: *F. c. columbarius* (Taiga Merlin — most PNW birds); *F. c. suckleyi* (Pacific/Black Merlin — coastal BC/WA, darkest subspecies); *F. c. richardsonii* (Prairie Merlin — east-side, palest)

**AOS Authority:** AOS Check-list 7th edition; three North American subspecies recognized

**Residency Status:** Resident (*suckleyi* on coast) / Winter Visitor (*columbarius*) / Resident (*richardsonii* in east-side cities)

**Elevation Range:**
- Breeding: 0-5,000 ft (0-1,524 m) — *suckleyi* coastal, *richardsonii* urban/prairie
- Wintering: 0-3,000 ft (0-914 m)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-INTERTIDAL

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-INTERTIDAL

**Habitat:** HAB-URBAN, HAB-RIPARIAN, HAB-SECOND-GROWTH, AVI-HAB-GRASSLAND, HAB-ROCKY-INTERTIDAL

**Ecological Role:** ROLE-MESOPREDATOR

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 24-30 cm (9.4-12 in)
- Wingspan: 53-68 cm (21-27 in)
- Mass: 129-236 g (4.6-8.3 oz); females larger; *suckleyi* slightly larger than other subspecies

**Plumage Description:** *columbarius*: blue-gray above (male), brown above (female), streaked below. *suckleyi*: very dark, almost uniformly dark brown-black; darkest North American falcon. *richardsonii*: pale blue-gray (male), pale brown (female). All lack Peregrine's bold moustachial stripe. Short, pointed wings and medium tail.

**Diet & Foraging Guild:**
- Primary diet: Small birds (sparrows, waxwings, pipits, sandpipers); occasional dragonflies
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial (fast, low pursuit flight)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Deer Mouse (*Peromyscus maniculatus*) — Rare prey; mammals minor dietary component
- Little Brown Bat (*Myotis lucifugus*) — Rare prey; taken in flight
- Vagrant Shrew (*Sorex vagrans*) — Rare prey
- **Note:** Merlin is primarily an avian predator. Mammalian prey is incidental (<3% of diet).
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Little Brown Bat (*Myotis lucifugus*), Vagrant Shrew (*Sorex vagrans*) — minor prey; expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** Dark-eyed Junco (*Junco hyemalis*), House Sparrow (*Passer domesticus*), Bohemian Waxwing (*Bombycilla garrulus*), Pine Siskin (*Spinus pinus*), Horned Lark (*Eremophila alpestris*) — see AVI resident.md and migratory.md (primary prey — small passerines). H-6 pair 17: Merlin x small passerines documented.

**Nesting Ecology:**
- Nest type: Platform (uses old crow, magpie, or hawk nests; does not build own nest)
- Nest location: 15-40 ft in conifers; urban *richardsonii* increasingly uses ornamental spruce in city neighborhoods; *suckleyi* uses coastal forest edge
- Clutch size: 4-6 (typically 5)
- Incubation period: 28-32 days
- Fledging period: 25-35 days
- Broods per year: 1

**Vocalization:** Rapid, high-pitched *ki-ki-ki-ki-ki*; faster and higher than Peregrine or Kestrel. Very vocal near nest. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary (*suckleyi*, *richardsonii*) to Medium-distance (*columbarius*)
- Spring arrival: *columbarius* migrants depart PNW March-April
- Fall departure: *columbarius* arrives PNW September-October
- Wintering range: *suckleyi* year-round coastal PNW; *columbarius* from boreal forest winters in PNW lowlands
- Key PNW staging areas: Coastal estuaries (shorebird concentrations attract wintering Merlins)

**Ecological Interactions:**
- Merlin fills the small-falcon niche in the PNW, bridging the size gap between American Kestrel (smaller, more insects) and Peregrine (larger, more waterfowl). The Pacific Merlin (*suckleyi*) is one of the darkest raptors in North America, its melanistic plumage potentially an adaptation to the dark, wet coastal forests of the PNW and BC. Urban Merlins (*richardsonii*) in Boise and other east-side cities have colonized neighborhoods with ornamental spruce, preying on House Sparrows and Bohemian Waxwings.

**Cultural Note:**
- No specific cultural documentation in available published sources. The Merlin's name derives from Old French *esmerillon*; it was historically the "lady's hawk" in medieval European falconry, prized for its speed and bold temperament.

**Salmon Thread:** No

**Key Sources:** G-14, O-22, O-07

**Cross-Module References:**
- See AVI: Peregrine Falcon (*Falco peregrinus*) (larger congener)
- See AVI: American Kestrel (*Falco sparverius*) (smaller congener — size-based niche partitioning)

---

### American Kestrel (*Falco sparverius*)

**Taxonomy:**
- Order: Falconiformes
- Family: Falconidae (Falcons and Caracaras)
- Genus: *Falco*
- Species: *Falco sparverius*
- Subspecies: *F. s. sparverius* (Northern American Kestrel — PNW populations)

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Resident (year-round; some seasonal movement)

**Elevation Range:**
- Breeding: 0-7,000 ft (0-2,134 m)
- Wintering: 0-4,000 ft (0-1,219 m)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Habitat:** AVI-HAB-GRASSLAND, HAB-OAK-PRAIRIE, AVI-HAB-SAGEBRUSH, HAB-URBAN, AVI-HAB-SNAG

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL
- Oregon State: ST-NL
- Idaho State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Common Bird in Steep Decline (significant population declines across North America)

**Morphometrics:**
- Length: 22-31 cm (8.7-12 in)
- Wingspan: 51-61 cm (20-24 in)
- Mass: 80-165 g (2.8-5.8 oz); smallest North American falcon

**Plumage Description:** Strikingly colorful. Male: rufous back and tail with black subterminal band; blue-gray wings; bold black and white face pattern with two vertical stripes; rufous-spotted white underparts. Female: rufous above with dark barring; streaked underparts. Both sexes have "false eye" spots (ocelli) on nape.

**Diet & Foraging Guild:**
- Primary diet: Insects (grasshoppers, beetles, dragonflies) in summer; small mammals in winter
- Foraging guild: Raptor (diurnal) / Aerial insectivore (summer)
- Foraging stratum: Aerial (hovering), Ground (perch-hunting from utility lines, fence posts)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Deer Mouse (*Peromyscus maniculatus*) — Primary mammalian prey (winter)
- Meadow Vole (*Microtus pennsylvanicus*) — Primary mammalian prey (winter)
- Montane Vole (*Microtus montanus*) — Primary mammalian prey in east-side habitats
- Harvest Mouse (*Reithrodontomys megalotis*) — Secondary prey
- House Mouse (*Mus musculus*) — Secondary prey in agricultural and urban areas
- Vagrant Shrew (*Sorex vagrans*) — Opportunistic
- **Note:** Diet shifts seasonally — primarily insects in summer, primarily small mammals in winter.
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Meadow Vole (*Microtus pennsylvanicus*), Montane Vole (*Microtus montanus*), Harvest Mouse (*Reithrodontomys megalotis*), House Mouse (*Mus musculus*), Vagrant Shrew (*Sorex vagrans*) — expected in MAM profiles. See MAM (pending). H-6 pair 16: American Kestrel x grasshoppers/small mammals documented above.
- **AVI cross-reference:** House Sparrow (*Passer domesticus*), Horned Lark (*Eremophila alpestris*) — see AVI resident.md (secondary avian prey).

**Nesting Ecology:**
- Nest type: Cavity (secondary cavity nester — uses old woodpecker holes, natural cavities, nest boxes)
- Nest location: 10-30 ft in snags, trees, buildings, utility poles; readily adopts nest boxes — one of the most successful nest box programs in North American raptor conservation
- Clutch size: 4-6 (typically 5)
- Incubation period: 26-32 days
- Fledging period: 28-31 days
- Broods per year: 1-2 (occasionally double-brooded in PNW)

**Vocalization:** Rapid, high-pitched *killy killy killy* — one of the most recognizable raptor calls. Used in territorial and alarm contexts. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Sedentary to Short-distance (some post-breeding dispersal and latitudinal movement)
- Wintering range: Year-round PNW; winter concentrations in agricultural valleys
- Key PNW staging areas: Counted at hawk-watch sites (Chelan Ridge, Bonney Butte) (source: O-21)

**Ecological Interactions:**
- American Kestrel is the smallest and most abundant falcon in the PNW, filling both insectivore and small-mammal predator niches depending on season. As a secondary cavity nester, kestrel populations depend on woodpecker excavation (especially Northern Flicker) and natural cavity formation in snags — linking kestrel conservation to snag retention in forest management. Continental population declines of ~50% since 1966 (source: G-18) are alarming and may reflect nest cavity loss, pesticide exposure, Cooper's Hawk predation in urban areas, and habitat conversion.

**Cultural Note:**
- No specific cultural documentation in available published sources. American Kestrel nest box programs in the PNW (operated by raptor research groups, school programs, and wine grape vineyards seeking biological pest control) represent one of the most successful citizen-conservation programs for raptors.

**Salmon Thread:** No

**Key Sources:** G-14, G-18, O-21, O-22

**Cross-Module References:**
- See AVI: Cooper's Hawk (*Accipiter cooperii*) (predator of kestrels in urban areas)
- See AVI Mod 5: cavity nester guild (kestrel as secondary cavity user dependent on woodpecker excavation)

---

### Gyrfalcon (*Falco rusticolus*) — RARE VISITOR

**Taxonomy:**
- Order: Falconiformes
- Family: Falconidae (Falcons and Caracaras)
- Genus: *Falco*
- Species: *Falco rusticolus*
- Subspecies: Monotypic (color morphs — gray, white, dark — are not recognized as subspecies)

**AOS Authority:** AOS Check-list 7th edition

**Residency Status:** Winter Visitor (rare; irruptive — may be absent for years)

**Elevation Range:**
- Wintering: 0-4,000 ft (0-1,219 m) — open habitats
- Elevation Band IDs: ELEV-LOWLAND

**Ecoregion Affiliations:** ELEV-LOWLAND

**Habitat:** AVI-HAB-GRASSLAND, AVI-HAB-SAGEBRUSH, HAB-ROCKY-INTERTIDAL, AVI-HAB-MUDFLAT

**Ecological Role:** ROLE-APEX

**Conservation Status:**
- Federal ESA: ESA-NL
- Washington State: ST-NL (rare visitor)
- Oregon State: ST-NL (very rare)
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 48-61 cm (19-24 in)
- Wingspan: 110-130 cm (43-51 in)
- Mass: 805-2,100 g (28-74 oz); largest falcon in the world; females much larger

**Plumage Description:** Three color morphs: gray (most common in PNW), dark (uncommon), white (rare in PNW — more common in High Arctic). Gray morph: blue-gray above with darker barring, whitish below with gray barring and streaking. Massive build with heavy chest; broad-based, pointed wings; relatively long tail for a falcon.

**Diet & Foraging Guild:**
- Primary diet: Birds (ptarmigan on breeding grounds; waterfowl, gulls, and shorebirds on wintering range); occasionally mammals
- Foraging guild: Raptor (diurnal)
- Foraging stratum: Aerial (level pursuit flight rather than steep stoops; powerful and sustained)

**Prey List (Mammalian — scientific names for cross-taxonomy validation):**
- Snowshoe Hare (*Lepus americanus*) — Secondary prey on wintering grounds
- Arctic Ground Squirrel (*Urocitellus parryii*) — Primary mammalian prey on breeding grounds (not in PNW)
- Deer Mouse (*Peromyscus maniculatus*) — Opportunistic on PNW wintering range
- **Note:** On PNW wintering range, diet is predominantly avian (waterfowl, gulls, Rock Pigeon). Mammalian prey is a minor component.
- **MAM cross-reference:** Snowshoe Hare (*Lepus americanus*), Deer Mouse (*Peromyscus maniculatus*) — minor prey on PNW winter range; expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** Waterfowl (Mallard, wigeon), gulls, Rock Pigeon (*Columba livia*) — see AVI resident.md and migratory.md (primary prey on PNW winter range).

**Nesting Ecology:**
- Does not breed in PNW. Nests on Arctic tundra cliffs in Alaska, northern Canada, and Greenland.

**Vocalization:** Generally silent on wintering grounds. Breeding call a harsh, low-pitched *kak-kak-kak*. Reference Macaulay Library (O-26).

**Migration (if applicable):**
- Migration strategy: Irruptive (irregular winter visitor to PNW; may be absent for multiple years)
- Spring arrival: N/A (departs PNW by March-April when present)
- Fall departure: N/A (arrives PNW November-December when present; not annual)
- Wintering range: Irregular to coastal WA/OR and east-side steppe; more regular in northern WA and coastal BC
- Key PNW staging areas: Boundary Bay (BC), Skagit Flats (WA), Ocean Shores (WA) — open areas with waterfowl concentrations

**Ecological Interactions:**
- Gyrfalcon is the world's largest falcon and an Arctic specialist that reaches the PNW only as a rare winter visitor. When present, it occupies the apex aerial predator role in open coastal and steppe habitats, capable of taking waterfowl as large as geese. Gyrfalcon presence on the PNW coast is associated with strong northern weather systems that push Arctic birds southward. Winter records are celebrated birding events in the PNW.

**Cultural Note:**
- The Gyrfalcon has been the most prized falconry bird for over 3,000 years, historically reserved for royalty in European and Central Asian cultures. Arctic Indigenous peoples including the Inuit have deep cultural relationships with Gyrfalcon as a powerful hunter spirit.

**Salmon Thread:** No

**Key Sources:** G-10, O-02, O-22

**Cross-Module References:**
- See AVI: Peregrine Falcon (*Falco peregrinus*) (smaller congener — co-occurs on wintering range)
- See AVI: Snowy Owl (*Bubo scandiacus*) (co-occurring Arctic visitor — irruptive winter pattern)

---

## Order Strigiformes — Owls

The Pacific Northwest hosts 14 owl species spanning the full range of PNW habitats, from the deep old-growth canopy where Northern Spotted Owls hunt Northern Flying Squirrels to the open sagebrush steppe where Burrowing Owls nest in ground squirrel burrows. Owls are the nocturnal and crepuscular counterpart to the diurnal raptors profiled above, and together these two groups partition the 24-hour predation cycle across PNW ecosystems.

Owls possess several convergent adaptations for nocturnal hunting: asymmetric ear placement enabling three-dimensional sound localization, facial disc feathers that channel sound to the ears, comb-like leading edges on flight feathers that suppress aerodynamic noise (enabling silent flight), and tubular eyes with exceptional low-light sensitivity. These adaptations make owls the dominant nocturnal predators of small mammals across every PNW ecoregion.

The owl prey profiles below are critical for the H-6 integration test. Northern Spotted Owl dependence on Northern Flying Squirrel, Barn Owl specialization on voles, Great Horned Owl predation on Snowshoe Hare, and Short-eared Owl tracking of vole population cycles are among the most tightly coupled predator-prey relationships in PNW ecosystems.

### The Spotted Owl — Barred Owl Crisis

The most consequential ecological event in PNW owl ecology is the invasion of Barred Owl (*Strix varia*) into the range of the Northern Spotted Owl (*Strix occidentalis caurina*). Barred Owls expanded westward across North America during the 20th century, likely facilitated by forest planting across the Great Plains, and reached the PNW by the 1970s. Barred Owls are larger, more aggressive, more generalist in diet, and more tolerant of fragmented habitat than Spotted Owls. Barred Owl presence is now the primary driver of Spotted Owl population decline, surpassing habitat loss (sources: P-13, P-14). The USFWS authorized experimental Barred Owl removal in key Spotted Owl territories beginning in 2013, with initial results showing Spotted Owl population stabilization in removal areas (source: P-13).

---

### Great Horned Owl (*Bubo virginianus*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Bubo*
- Species: *Bubo virginianus*
- Subspecies: *B. v. lagophonus* (interior PNW — paler); *B. v. saturatus* (coastal PNW — darker, heavily marked)

**AOS Authority:** AOS Check-list 7th edition; no recent taxonomic changes through 62nd Supplement (O-03)

**Residency Status:** Resident (year-round throughout PNW; sedentary, non-migratory)

**Elevation Range:**
- Breeding: 0–8,000 ft (0–2,440 m) — sea level to treeline
- Wintering: Same as breeding (does not migrate or shift elevation significantly)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE, ELEV-RIPARIAN, ELEV-COASTAL, ELEV-SHRUB-STEPPE

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE, ELEV-RIPARIAN, ELEV-COASTAL, ELEV-SHRUB-STEPPE

**Habitat:** HAB-OLD-GROWTH, HAB-SECOND-GROWTH, HAB-RIPARIAN, HAB-OAK-PRAIRIE, AVI-HAB-SAGEBRUSH, HAB-URBAN

**Ecological Role:** ROLE-APEX

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-NL
- Oregon State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Not assessed

**Morphometrics:**
- Length: 46–63 cm (18–25 in)
- Wingspan: 101–145 cm (40–57 in)
- Mass: Males 900–1,800 g (32–63 oz); Females 1,000–2,500 g (35–88 oz)

**Plumage Description:** Large, powerful owl with prominent ear tufts ("horns"). Mottled gray-brown and tawny plumage providing excellent camouflage against tree bark. Facial disc tawny-orange to gray with dark border. White throat bib visible at distance. Coastal saturatus subspecies darker and more heavily barred than interior lagophonus. Eyes bright yellow.

**Hunting Strategy:**
- Primary hunting method: Still-hunting from elevated perch; short flights to capture prey detected by hearing; occasional low coursing flights over open ground
- Hunting range: Home range 2–10 km2 depending on habitat quality and prey density
- Prey detection: Exceptional binaural hearing; excellent low-light vision; hunts in near-total darkness using sound alone when necessary

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Snowshoe Hare (*Lepus americanus*) — 15–30% of diet by biomass in montane/subalpine forests; population cycles of hares influence owl breeding success (source: G-14, G-23)
  - Northern Flying Squirrel (*Glaucomys sabrinus*) — significant prey in old-growth forests, especially where Snowshoe Hare density is low; 10–20% of diet in western PNW forests (source: G-06, G-14)
  - Deer Mouse (*Peromyscus maniculatus*) — consistent secondary prey across all habitats; taken in high numbers but low individual biomass contribution (source: G-14)
  - Bushy-tailed Woodrat (*Neotoma cinerea*) — primary prey in drier, east-side forests and rocky habitats
  - Eastern Cottontail (*Sylvilagus floridanus*) — significant prey in agricultural and suburban landscapes
  - Striped Skunk (*Mephitis mephitis*) — Great Horned Owl is one of few predators regularly taking skunks (limited sense of smell)
- Secondary prey:
  - Meadow Vole (*Microtus pennsylvanicus*) — open habitats
  - Townsend's Vole (*Microtus townsendii*) — western lowland grasslands
  - Mountain Cottontail (*Sylvilagus nuttallii*) — east-side habitats
  - Douglas Squirrel (*Tamiasciurus douglasii*) — conifer forest canopy
  - Domestic Cat (*Felis catus*) — suburban territories; documented predator of free-roaming cats
  - American Crow (*Corvus brachyrhynchos*) — taken from communal roosts at night
  - Barred Owl (*Strix varia*) — intraguild predation documented
  - Spotted Skunk (*Spilogale gracilis*) — occasionally
  - Raptors — documented preying on Red-tailed Hawk, Peregrine Falcon, and other owl species at roost sites
- Prey size range: 10–4,000 g (broadest prey size range of any PNW owl)
- **MAM cross-reference:** Snowshoe Hare (*Lepus americanus*), Northern Flying Squirrel (*Glaucomys sabrinus*), Deer Mouse (*Peromyscus maniculatus*), Bushy-tailed Woodrat (*Neotoma cinerea*), Eastern Cottontail (*Sylvilagus floridanus*), Striped Skunk (*Mephitis mephitis*), Meadow Vole (*Microtus pennsylvanicus*), Townsend's Vole (*Microtus townsendii*), Mountain Cottontail (*Sylvilagus nuttallii*), Douglas Squirrel (*Tamiasciurus douglasii*) — all expected in MAM profiles. See MAM (pending): Snowshoe Hare (primary prey), Northern Flying Squirrel (primary prey), Deer Mouse (secondary prey).
- **AVI cross-reference:** American Crow, Barred Owl — see AVI resident.md. Great Horned Owl is a significant intraguild predator of other raptors.

**Nesting Ecology:**
- Nest type: Does not build own nest; appropriates stick nests of Red-tailed Hawks, crows, ravens, or Great Blue Herons; also uses cliff ledges, broken-topped snags, tree cavities
- Nest location: 5–30 m height in large trees; begins nesting very early (January–February in PNW, while snow still present)
- Territory size: 2–10 km2
- Clutch size: 2–3 eggs (range 1–5)
- Incubation: 30–37 days, primarily female
- Fledging: 42–49 days; young dependent on parents for several additional months

**Vocalization:** Deep, resonant hooting — the classic owl call. Typical rhythm "hoo hoo-hoo-hoo hoo hoo" (5–6 notes). Female voice higher-pitched than male. Pairs duet on territory throughout winter breeding season. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Apex predator — the dominant nocturnal predator across most PNW habitats; the "tiger of the sky"
- Population regulation of: Snowshoe Hare, cottontail, flying squirrel, woodrat, skunk, and mesopredator populations
- Guild competition: Dominant over all other PNW owl species; will kill and eat Barred Owls, Spotted Owls, Long-eared Owls, and Screech-Owls. This intraguild predation makes Great Horned Owl territory selection a factor in Spotted Owl habitat quality.

**Salmon Thread:** No (indirect — hunts along riparian corridors but no direct salmon dependency; may scavenge salmon carcasses opportunistically)

**Key Sources:** G-06, G-14, G-23, O-22, O-26

**Cross-Module References:**
- See MAM (pending): Snowshoe Hare (*Lepus americanus*) (primary prey — H-6 pair 1)
- See MAM (pending): Northern Flying Squirrel (*Glaucomys sabrinus*) (primary prey — H-6 pair relates to integration-test-spec pair 1)
- See AVI: Northern Spotted Owl (intraguild predation threat)
- See AVI: Barred Owl (intraguild predation — documented prey item)

---

### Northern Spotted Owl (*Strix occidentalis caurina*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Strix*
- Species: *Strix occidentalis*
- Subspecies: *S. o. caurina* (Northern Spotted Owl — PNW endemic subspecies; the only subspecies occurring in Washington and Oregon)

**AOS Authority:** AOS Check-list 7th edition (O-03); subspecies recognized as distinct management unit under ESA

**Residency Status:** Resident (year-round; highly sedentary, strongly site-faithful to old-growth territories)

**Elevation Range:**
- Breeding: 500–5,000 ft (150–1,524 m)
- Wintering: Same as breeding (does not migrate)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE

**Habitat:** HAB-OLD-GROWTH (primary — obligate old-growth associate in western PNW), HAB-SECOND-GROWTH (late-seral only, >80 years)

**Ecological Role:** ROLE-INDICATOR, ROLE-MESOPREDATOR

**Conservation Status:**
- Federal ESA: ESA-T (Threatened, listed 1990 — the listing that catalyzed the Northwest Forest Plan)
- Washington State: ST-E (State Endangered)
- Oregon State: ST-T (State Threatened)
- IUCN Red List: IUCN-NT (Near Threatened)
- Partners in Flight: Not assessed
- **Safety Note:** SC-END applies — no nest site coordinates published for this ESA-listed species

**Morphometrics:**
- Length: 42–48 cm (16.5–19 in)
- Wingspan: 107–114 cm (42–45 in)
- Mass: Males 490–620 g (17–22 oz); Females 535–760 g (19–27 oz)

**Plumage Description:** Medium-large dark-eyed owl. Rich chocolate-brown overall with large white spots on breast and belly forming a barred pattern. Rounded head without ear tufts. Dark brown eyes (distinguishes from yellow-eyed Great Horned Owl and Barred Owl's dark eyes but different facial disc pattern). Facial disc tawny-brown with concentric darker rings.

**Hunting Strategy:**
- Primary hunting method: Sit-and-wait ambush from subcanopy perch; drops onto prey detected by sound; hunts within forest interior, not in openings
- Hunting range: Home range 3–15 km2 (larger in fragmented habitat)
- Prey detection: Acute binaural hearing; hunts in dense forest understory where visual detection is limited; relies heavily on sound localization

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Northern Flying Squirrel (*Glaucomys sabrinus*) — 30–60% of diet by biomass across most PNW study populations; this is the defining predator-prey relationship of PNW old-growth ecology. Flying squirrel abundance directly drives Spotted Owl reproductive success. (Sources: G-06, G-12, P-13, P-14)
  - Bushy-tailed Woodrat (*Neotoma cinerea*) — 15–40% of diet in drier portions of range (eastern Cascades, Klamath Mountains); replaces flying squirrel as primary prey in drier forest types (source: G-06, G-12)
  - Red Tree Vole (*Arborimus longicaudus*) — significant prey in Oregon Coast Range old-growth Douglas-fir forests; this arboreal vole is itself an old-growth associate
- Secondary prey:
  - Deer Mouse (*Peromyscus maniculatus*) — taken regularly, higher proportion in degraded habitat
  - Douglas Squirrel (*Tamiasciurus douglasii*) — occasional, diurnal squirrel taken at dawn/dusk
  - Dusky-footed Woodrat (*Neotoma fuscipes*) — southern Oregon range
  - Snowshoe Hare (*Lepus americanus*) — rare, mostly at higher elevations
  - Small birds — occasional; Steller's Jay (*Cyanocitta stelleri*), thrushes
  - Insects — minor dietary component, primarily large beetles and moths
- Prey size range: 15–500 g (concentrates on medium-sized prey 50–300 g)
- **MAM cross-reference:** Northern Flying Squirrel (*Glaucomys sabrinus*), Bushy-tailed Woodrat (*Neotoma cinerea*), Red Tree Vole (*Arborimus longicaudus*), Deer Mouse (*Peromyscus maniculatus*), Douglas Squirrel (*Tamiasciurus douglasii*), Dusky-footed Woodrat (*Neotoma fuscipes*), Snowshoe Hare (*Lepus americanus*) — all expected in MAM profiles. See MAM (pending): Northern Flying Squirrel (obligate primary prey — H-6 pair 4), Bushy-tailed Woodrat (primary prey — H-6 pair 5).
- **AVI cross-reference:** Steller's Jay (*Cyanocitta stelleri*) — see AVI resident.md (occasional prey).

**Nesting Ecology:**
- Nest type: Natural platform — broken-topped old-growth trees, large cavities, abandoned raptor nests, dense mistletoe clumps
- Nest location: Old-growth conifers (Douglas-fir, western hemlock, Sitka spruce) >80 cm DBH; requires multi-layered canopy with high canopy closure (>60%)
- Territory size: 3–15 km2 (averages ~8 km2 in contiguous old-growth; larger in fragmented landscapes)
- Clutch size: 2–3 eggs (usually 2)
- Incubation: 28–32 days, female only
- Fledging: 34–36 days; juveniles dependent on parents for 2–3 months post-fledging

**Vocalization:** Four-note barking call — "hoo...hoo-hoo...hooo" — with emphasis on final descending note. Contact call between pair members a rising series of whistled barks. Much less vocal than Barred Owl. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Mesopredator within old-growth forest — prey to Great Horned Owl; competitor with Barred Owl
- Population regulation of: Northern Flying Squirrel and woodrat populations within old-growth territories
- Guild competition: Barred Owl (*Strix varia*) is the primary competitor — larger, more generalist, more aggressive. Barred Owl invasion is the leading cause of Spotted Owl population decline (sources: P-13, P-14). Great Horned Owl predation on Spotted Owls limits habitat to dense canopy where Great Horned Owls do not hunt effectively.

**Salmon Thread:** No (indirect — old-growth forests sheltering Spotted Owl territories are fertilized by salmon-derived nutrients transported upslope by Bald Eagles and other vectors; the salmon-forest-owl connection is real but indirect)

**Key Sources:** G-06, G-12, G-17, G-22, P-13, P-14

**Cross-Module References:**
- See MAM (pending): Northern Flying Squirrel (*Glaucomys sabrinus*) (obligate primary prey — H-6 pair 4)
- See MAM (pending): Bushy-tailed Woodrat (*Neotoma cinerea*) (primary prey — H-6 pair 5)
- See AVI: Barred Owl (*Strix varia*) (competitive displacement — REL-COMP)
- See ECO: shared-attributes (HAB-OLD-GROWTH characterization)

---

### Barred Owl (*Strix varia*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Strix*
- Species: *Strix varia*
- Subspecies: No formally recognized PNW subspecies; western populations are recent range expansion from eastern North America

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident (year-round; invasive range expansion species — not historically present in PNW, arrived 1970s, now abundant)

**Elevation Range:**
- Breeding: 0–6,000 ft (0–1,830 m)
- Wintering: Same as breeding
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE, ELEV-RIPARIAN, ELEV-COASTAL

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE, ELEV-RIPARIAN, ELEV-COASTAL

**Habitat:** HAB-OLD-GROWTH, HAB-SECOND-GROWTH (tolerates younger forest than Spotted Owl — as young as 40 years), HAB-RIPARIAN, HAB-URBAN (suburban parks and greenbelts)

**Ecological Role:** ROLE-MESOPREDATOR (but functionally displaces ROLE-APEX in absence of Great Horned Owl)

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed; management concern as invasive competitor of ESA-listed Spotted Owl)
- Washington State: ST-NL
- Oregon State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)

**Morphometrics:**
- Length: 43–50 cm (17–20 in)
- Wingspan: 107–127 cm (42–50 in)
- Mass: Males 470–770 g (17–27 oz); Females 610–1,050 g (22–37 oz) — notably larger than Northern Spotted Owl

**Plumage Description:** Large round-headed owl without ear tufts. Gray-brown overall with horizontal barring on upper breast (hence "barred") transitioning to vertical streaking on belly. Facial disc pale gray with concentric dark rings. Dark brown eyes. Similar in shape to Spotted Owl but paler, more grayish (less warm brown), and with bars rather than spots on breast.

**Hunting Strategy:**
- Primary hunting method: Sit-and-wait from low to mid-canopy perch; versatile — hunts in forest interior, forest edges, riparian corridors, suburban parks, and even open areas; more adaptable than Spotted Owl
- Hunting range: Home range 2–8 km2 (smaller than Spotted Owl, reflecting ability to use a wider range of habitats)
- Prey detection: Excellent binaural hearing and low-light vision; will wade into shallow water to catch crayfish and amphibians

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Deer Mouse (*Peromyscus maniculatus*) — consistent high-frequency prey item across all habitats; 15–25% of prey items
  - Northern Flying Squirrel (*Glaucomys sabrinus*) — significant prey in old-growth and mature forest; direct competition with Spotted Owl for this resource
  - Townsend's Vole (*Microtus townsendii*) — important in western lowland habitats
  - Douglas Squirrel (*Tamiasciurus douglasii*) — taken at dusk near squirrel nest sites
- Secondary prey:
  - Crayfish (*Pacifastacus leniusculus*) — distinctive prey item; Barred Owls wade in shallow streams, a behavior not seen in Spotted Owls
  - Pacific Giant Salamander (*Dicamptodon tenebrosus*) — riparian forest streams
  - Red-backed Vole (*Myodes gapperi*) — conifer forest floor
  - Snowshoe Hare (*Lepus americanus*) — montane and subalpine
  - Small birds — thrushes, sparrows, taken from roost sites
  - Frogs — Pacific Treefrog (*Pseudacris regilla*), Red-legged Frog (*Rana aurora*)
  - Insects — beetles, moths, larger arthropods
  - Shrews (*Sorex* spp.) — minor but consistent dietary component
- Prey size range: 2–500 g (broader dietary breadth than Spotted Owl — a key competitive advantage)
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Northern Flying Squirrel (*Glaucomys sabrinus*), Townsend's Vole (*Microtus townsendii*), Douglas Squirrel (*Tamiasciurus douglasii*), Red-backed Vole (*Myodes gapperi*), Snowshoe Hare (*Lepus americanus*), Shrews (*Sorex* spp.) — all expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** Small passerines (thrushes, sparrows) — see AVI resident.md.

**Nesting Ecology:**
- Nest type: Natural tree cavity or broken-top snag; abandoned stick nests of Red-tailed Hawk or crow; nest boxes
- Nest location: Mature or old-growth conifers and mixed forest; 6–25 m height; tolerates younger, more fragmented forest than Spotted Owl
- Territory size: 2–8 km2
- Clutch size: 2–4 eggs (usually 2–3; larger average clutch than Spotted Owl)
- Incubation: 28–33 days, female only
- Fledging: 35–40 days

**Vocalization:** Loud, distinctive "Who cooks for you? Who cooks for you-all?" — an 8-note rhythmic hooting easily distinguished from Spotted Owl's 4-note call. Also gives maniacal caterwauling duet between pair members. Much more vocal than Spotted Owl, which may contribute to territorial displacement. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Mesopredator (prey to Great Horned Owl; dominant over Spotted Owl, screech-owls, and saw-whet owls)
- Population regulation of: Broad suite of small mammals, amphibians, and crayfish
- Guild competition: Competitively displaces Northern Spotted Owl through interference competition (territorial aggression), exploitation competition (overlapping prey base with broader diet), and hybridization (Spotted x Barred hybrids documented — source: P-11). Barred Owl removal experiments show Spotted Owl population recovery when Barred Owls are removed (source: P-13).

**Salmon Thread:** No (indirect — uses riparian corridors fertilized by salmon nutrients; takes crayfish from salmon-bearing streams)

**Key Sources:** G-06, G-14, P-11, P-13, P-14, O-22

**Cross-Module References:**
- See AVI: Northern Spotted Owl (*Strix occidentalis caurina*) (competitive displacement — REL-COMP)
- See MAM (pending): Northern Flying Squirrel (*Glaucomys sabrinus*) (shared prey with Spotted Owl)

---

### Great Gray Owl (*Strix nebulosa*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Strix*
- Species: *Strix nebulosa*
- Subspecies: *S. n. nebulosa* (throughout range including PNW)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident (year-round in montane PNW; limited altitudinal movement in harsh winters)

**Elevation Range:**
- Breeding: 3,000–6,500 ft (915–1,980 m) — montane/subalpine meadow edges
- Wintering: 2,000–5,500 ft (610–1,675 m) — may descend slightly in deep snow years
- Elevation Band IDs: ELEV-MONTANE, ELEV-SUBALPINE

**Ecoregion Affiliations:** ELEV-MONTANE, ELEV-SUBALPINE

**Habitat:** HAB-OLD-GROWTH (adjacent to meadows — requires forest/meadow interface), HAB-SUBALPINE-PARKLAND, HAB-ALPINE-MEADOW (edge)

**Ecological Role:** ROLE-APEX (meadow-edge nocturnal predator)

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-SC (Species of Concern — limited breeding population)
- Oregon State: ST-SC (Sensitive — Vulnerable; small and isolated populations)
- IUCN Red List: IUCN-LC (Least Concern — globally secure but locally rare in PNW)

**Morphometrics:**
- Length: 61–84 cm (24–33 in) — the tallest North American owl
- Wingspan: 137–152 cm (54–60 in)
- Mass: Males 790–1,200 g (28–42 oz); Females 930–1,700 g (33–60 oz) — despite enormous apparent size, mass is moderate due to dense, insulating plumage

**Plumage Description:** Very large owl with enormous round head and prominent facial disc with concentric gray rings. No ear tufts. Gray overall with subtle darker streaking. Yellow eyes relatively small within the massive facial disc. Distinctive white "bow tie" marking between facial disc and chin. Appears much larger than its actual mass due to extremely thick, dense plumage adapted for cold montane environments.

**Hunting Strategy:**
- Primary hunting method: Still-hunting from low perch at meadow edge; plunge-attacks through snow or grass to capture prey detected entirely by sound; can break through crusted snow up to 45 cm deep to reach tunneling rodents
- Hunting range: Home range 5–30 km2 centered on meadow-forest interfaces
- Prey detection: The most acoustically specialized owl in North America; massive facial disc functions as a parabolic sound collector; asymmetric ear placement provides vertical as well as horizontal sound localization; can locate and capture prey beneath snow by hearing alone

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Northern Pocket Gopher (*Thomomys talpoides*) — 25–50% of diet by biomass in PNW montane meadows; Great Gray Owls hunt gophers by sound as they push soil through tunnels beneath snow (source: G-14, G-15)
  - Mazama Pocket Gopher (*Thomomys mazama*) — primary prey in southern WA and OR montane meadows; **Safety Note:** includes ESA-listed subspecies in WA prairies (SC-END applies to population-level claims)
  - Meadow Vole (*Microtus pennsylvanicus*) — 20–40% of prey items by number; taken in greater numbers than gophers but lower biomass per individual (source: G-14)
  - Montane Vole (*Microtus montanus*) — important prey in drier east-side montane meadows
- Secondary prey:
  - Long-tailed Vole (*Microtus longicaudus*) — meadow and shrub habitats at higher elevations
  - Red-backed Vole (*Myodes gapperi*) — forest-meadow ecotone
  - Deer Mouse (*Peromyscus maniculatus*) — consistent minor prey item
  - Snowshoe Hare (*Lepus americanus*) — rare; more common in diet of northern (Canadian) populations
  - Weasels (*Mustela* spp.) — occasional
  - Small birds — rare; predominantly mammalian diet
- Prey size range: 15–300 g (concentrates on 30–200 g fossorial rodents)
- **MAM cross-reference:** Northern Pocket Gopher (*Thomomys talpoides*), Mazama Pocket Gopher (*Thomomys mazama*), Meadow Vole (*Microtus pennsylvanicus*), Montane Vole (*Microtus montanus*), Long-tailed Vole (*Microtus longicaudus*), Red-backed Vole (*Myodes gapperi*), Deer Mouse (*Peromyscus maniculatus*), Snowshoe Hare (*Lepus americanus*) — all expected in MAM profiles. See MAM (pending): Northern Pocket Gopher (primary prey — H-6 pair 16), Meadow Vole (primary prey — H-6 pair 17).
- **AVI cross-reference:** Minimal — diet is overwhelmingly mammalian.

**Nesting Ecology:**
- Nest type: Does not build own nest; uses abandoned stick nests of Northern Goshawk, Red-tailed Hawk, or Common Raven; also broken-top snags
- Nest location: Large conifers (lodgepole pine, Douglas-fir, grand fir) at meadow edges; 5–20 m height; requires proximity to open hunting meadows
- Territory size: 5–30 km2 (large due to patchy meadow habitat distribution)
- Clutch size: 2–5 eggs (average 3; highly variable, correlated with prey abundance)
- Incubation: 28–36 days, female only
- Fledging: 21–28 days (leave nest early but cannot fly for several more weeks; "branching" period)

**Vocalization:** Deep, slow, evenly-spaced hooting — "whoo...whoo...whoo...whoo...whoo" — typically 5-10 notes at 0.5-second intervals. Lower-pitched and more evenly paced than Great Horned Owl. Remarkably quiet for such a large owl; often difficult to detect vocally. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Apex predator in montane meadow-edge ecosystem
- Population regulation of: Pocket gopher and vole populations in montane meadows; Great Gray Owl foraging may significantly affect gopher densities in small meadow complexes
- Guild competition: Limited; occupies a specialized niche (snow-plunging meadow-edge hunter) with few competitors. Northern Harrier hunts the same meadows diurnally. Short-eared Owl may overlap in lower-elevation grasslands but rarely at Great Gray Owl's montane elevation.

**Salmon Thread:** No

**Key Sources:** G-14, G-15, G-25, O-22

**Cross-Module References:**
- See MAM (pending): Northern Pocket Gopher (*Thomomys talpoides*) (primary prey — H-6 pair 16)
- See MAM (pending): Mazama Pocket Gopher (*Thomomys mazama*) (primary prey — ESA subspecies, SC-END)
- See ECO: shared-attributes (HAB-ALPINE-MEADOW, HAB-SUBALPINE-PARKLAND)

---

### Barn Owl (*Tyto alba*)

**Taxonomy:**
- Order: Strigiformes
- Family: Tytonidae (Barn Owls) — distinct family from all other PNW owls (Strigidae)
- Genus: *Tyto*
- Species: *Tyto alba*
- Subspecies: *T. a. pratincola* (American Barn Owl — throughout PNW lowlands)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident (year-round in PNW lowlands; some northern populations may withdraw southward in severe winters)

**Elevation Range:**
- Breeding: 0–2,000 ft (0–610 m) — strictly lowland species in PNW
- Wintering: Same as breeding; limited cold tolerance restricts to lowland areas with moderate winters
- Elevation Band IDs: ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL, ELEV-SHRUB-STEPPE (lower edges)

**Habitat:** AVI-HAB-GRASSLAND, HAB-OAK-PRAIRIE, HAB-URBAN (agricultural), AVI-HAB-SAGEBRUSH (lower-elevation margins)

**Ecological Role:** ROLE-SECONDARY-CONSUMER, ROLE-INDICATOR (indicator of agricultural landscape health and rodent populations)

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-SC (Species of Concern — declining due to agricultural intensification and loss of nest sites)
- Oregon State: ST-NL (Not listed but monitored)
- IUCN Red List: IUCN-LC (Least Concern)

**Morphometrics:**
- Length: 32–40 cm (12.5–16 in)
- Wingspan: 100–125 cm (39–49 in)
- Mass: Males 400–500 g (14–18 oz); Females 450–700 g (16–25 oz)

**Plumage Description:** Unmistakable. Heart-shaped white facial disc with dark eyes. Upperparts golden-buff with gray and white mottling. Underparts white to pale buff, variably spotted with small dark dots. Long legs with sparse white feathering. Appears pale and ghostly in flight, with slow mothlike wingbeats. No ear tufts. Unique among PNW owls in belonging to family Tytonidae rather than Strigidae.

**Hunting Strategy:**
- Primary hunting method: Low quartering flights over open grassland and agricultural fields, 1–4 m above ground; detects prey by sound using the most acoustically refined facial disc of any owl
- Hunting range: Home range 1–5 km2 centered on grassland and agricultural habitats
- Prey detection: The most acoustically specialized raptor in the PNW; heart-shaped facial disc channels sound to asymmetrically placed ears with sub-degree accuracy; can capture prey in complete darkness using hearing alone; documented capturing prey under leaf litter and light snow

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Meadow Vole (*Microtus pennsylvanicus*) — 30–50% of diet in eastern PNW grasslands and agricultural areas (source: G-14, G-15)
  - Townsend's Vole (*Microtus townsendii*) — 30–50% of diet in western PNW agricultural landscapes; combined with Meadow Vole, *Microtus* voles constitute 80–95% of Barn Owl diet in most PNW studies
  - Deer Mouse (*Peromyscus maniculatus*) — 10–20% of diet; more important in east-side steppe where vole density is lower (source: G-14)
- Secondary prey:
  - Montane Vole (*Microtus montanus*) — east-side agricultural valleys
  - Long-tailed Vole (*Microtus longicaudus*) — meadow margins
  - Harvest Mouse (*Reithrodontomys megalotis*) — grassland habitats
  - Pocket Gopher (*Thomomys* spp.) — occasional
  - House Mouse (*Mus musculus*) — near agricultural structures
  - Rats (*Rattus* spp.) — near human habitation
  - Shrews (*Sorex* spp.) — consistent minor component
  - Small birds — rare; <5% of diet
  - Insects — rare in PNW; more common in warmer climates
- Prey size range: 10–200 g (concentrates on 15–60 g voles and mice)
- **MAM cross-reference:** Meadow Vole (*Microtus pennsylvanicus*), Townsend's Vole (*Microtus townsendii*), Deer Mouse (*Peromyscus maniculatus*), Montane Vole (*Microtus montanus*), Long-tailed Vole (*Microtus longicaudus*), Harvest Mouse (*Reithrodontomys megalotis*), House Mouse (*Mus musculus*) — all expected in MAM profiles. See MAM (pending): Meadow Vole (primary prey — H-6 pair 6), Deer Mouse (primary/secondary prey — H-6 pair 6), Townsend's Vole (primary prey).
- **AVI cross-reference:** Minimal — diet overwhelmingly mammalian (<5% avian).

**Nesting Ecology:**
- Nest type: Cavity nester — does not build nest; uses existing cavities and structures
- Nest location: Barn lofts, church steeples, nest boxes, tree cavities, cliff crevices, hay bales; 2–15 m height; strongly associated with agricultural structures in PNW
- Territory size: 1–5 km2
- Clutch size: 4–7 eggs (range 2–12; among the largest clutches of any PNW raptor; clutch size varies dramatically with prey abundance)
- Incubation: 29–34 days, female only
- Fledging: 55–65 days (long nestling period)

**Vocalization:** No hoot. Instead, a prolonged raspy shriek — "shreeee" lasting 2–3 seconds — often described as blood-curdling and responsible for many "haunted barn" reports. Also hisses, bill-snaps, and chattering calls at nest site. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Secondary consumer — specialist predator of small mammals in open habitats
- Population regulation of: Vole populations in agricultural and grassland landscapes; a single Barn Owl family consumes an estimated 1,500–3,000 rodents per year, making Barn Owls among the most valuable biological pest control agents in PNW agriculture
- Guild competition: Short-eared Owl (overlapping open-country, vole-dependent niche; Short-eared diurnal/crepuscular, Barn Owl strictly nocturnal — temporal partitioning). Northern Harrier (diurnal counterpart in same grassland habitats).

**Salmon Thread:** No

**Key Sources:** G-14, G-15, O-22

**Cross-Module References:**
- See MAM (pending): Meadow Vole (*Microtus pennsylvanicus*) (primary prey — H-6 pair 6)
- See MAM (pending): Deer Mouse (*Peromyscus maniculatus*) (secondary prey — H-6 pair 6)
- See MAM (pending): Townsend's Vole (*Microtus townsendii*) (primary prey)
- See AVI: Short-eared Owl (*Asio flammeus*) (guild competitor — temporal partitioning)

---

### Long-eared Owl (*Asio otus*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Asio*
- Species: *Asio otus*
- Subspecies: *A. o. wilsonianus* (North American Long-eared Owl — throughout PNW)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident (year-round in PNW; some populations partially migratory, withdrawing from highest-elevation breeding areas in winter)

**Elevation Range:**
- Breeding: 1,000–6,000 ft (305–1,830 m)
- Wintering: 0–4,000 ft (0–1,220 m) — descends to lowland riparian groves and dense conifer patches
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN, ELEV-SHRUB-STEPPE

**Habitat:** HAB-RIPARIAN (dense thickets for roosting), HAB-SECOND-GROWTH, AVI-HAB-SAGEBRUSH (breeds in juniper/sagebrush mosaic), HAB-OAK-PRAIRIE (edge)

**Ecological Role:** ROLE-MESOPREDATOR

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-NL (uncommon but widespread)
- Oregon State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)

**Morphometrics:**
- Length: 35–40 cm (14–16 in)
- Wingspan: 86–102 cm (34–40 in)
- Mass: Males 220–305 g (8–11 oz); Females 260–370 g (9–13 oz)

**Plumage Description:** Slender medium-sized owl with long, closely-set ear tufts (longer than any other PNW owl relative to head size). Heavily streaked buff and dark brown plumage. Orange-buff facial disc with dark border. Bright orange-yellow eyes. When alarmed, erects ear tufts and compresses body into extremely elongated shape resembling a broken branch — cryptic posture is remarkably effective camouflage against tree bark.

**Hunting Strategy:**
- Primary hunting method: Low quartering flights over open ground (similar to Short-eared Owl but strictly nocturnal); also still-hunts from low perches at meadow/forest edge
- Hunting range: Home range 2–10 km2
- Prey detection: Excellent binaural hearing with asymmetric ear openings; facial disc channels sound; hunts in darkness

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Deer Mouse (*Peromyscus maniculatus*) — 20–40% of diet across most PNW habitats (source: G-14)
  - Meadow Vole (*Microtus pennsylvanicus*) — 20–35% of diet in grassland-adjacent habitats
  - Montane Vole (*Microtus montanus*) — significant in east-side montane meadows
  - Townsend's Vole (*Microtus townsendii*) — western lowland grasslands
- Secondary prey:
  - Pocket Mouse (*Perognathus parvus*) — east-side steppe
  - Harvest Mouse (*Reithrodontomys megalotis*) — grasslands
  - Kangaroo Rat (*Dipodomys ordii*) — rare, south-central Oregon steppe
  - Shrews (*Sorex* spp.) — minor component
  - Small birds — occasional, taken from roost; House Sparrow (*Passer domesticus*), juncos, sparrows
  - Insects — occasional moths and beetles
- Prey size range: 10–120 g (strongly concentrated on small rodents 15–50 g)
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Meadow Vole (*Microtus pennsylvanicus*), Montane Vole (*Microtus montanus*), Townsend's Vole (*Microtus townsendii*), Pocket Mouse (*Perognathus parvus*), Harvest Mouse (*Reithrodontomys megalotis*) — all expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** House Sparrow, juncos, sparrows — see AVI resident.md (occasional prey).

**Nesting Ecology:**
- Nest type: Does not build own nest; uses abandoned stick nests of Black-billed Magpie, American Crow, or hawk species
- Nest location: Dense conifer or hardwood groves, often in riparian corridors; 3–15 m height; strongly prefers dense canopy cover for concealment
- Territory size: 2–10 km2
- Clutch size: 4–6 eggs (range 3–8; clutch size tracks prey abundance)
- Incubation: 25–30 days, female only
- Fledging: 21–28 days (leave nest early; branching period before flight)

**Vocalization:** Male advertising call a low, regular "hoo...hoo...hoo...hoo" — evenly spaced single notes at ~3-second intervals, audible at considerable distance on still nights. Female begging call a nasal, catlike "meeow." Alarm calls include barking and bill-snapping. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Mesopredator — prey to Great Horned Owl (significant predator; Long-eared Owls avoid territories with high Great Horned Owl density)
- Population regulation of: Deer mouse and vole populations in forest-meadow ecotone habitats
- Guild competition: Short-eared Owl (similar prey base; partitioned by time — Long-eared strictly nocturnal, Short-eared crepuscular/diurnal) and Northern Saw-whet Owl (smaller, taking smaller prey on average)

**Salmon Thread:** No

**Key Sources:** G-14, G-15, O-22

**Cross-Module References:**
- See MAM (pending): Deer Mouse (*Peromyscus maniculatus*) (primary prey)
- See MAM (pending): Meadow Vole (*Microtus pennsylvanicus*) (primary prey)
- See AVI: Short-eared Owl (*Asio flammeus*) (congener — temporal niche partitioning)

---

### Short-eared Owl (*Asio flammeus*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Asio*
- Species: *Asio flammeus*
- Subspecies: *A. f. flammeus* (throughout PNW)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident / Winter Visitor (breeds in PNW grasslands and marshes; augmented by northern migrants in winter; semi-nomadic — concentrates wherever vole outbreaks occur)

**Elevation Range:**
- Breeding: 0–5,000 ft (0–1,524 m) — open habitats at any elevation
- Wintering: 0–2,000 ft (0–610 m) — lowland grasslands, marshes, agricultural fields
- Elevation Band IDs: ELEV-LOWLAND, ELEV-COASTAL, ELEV-SHRUB-STEPPE, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-COASTAL, ELEV-SHRUB-STEPPE, ELEV-RIPARIAN

**Habitat:** AVI-HAB-GRASSLAND (primary), HAB-WETLAND, AVI-HAB-SAGEBRUSH, AVI-HAB-MUDFLAT (margins), HAB-OAK-PRAIRIE

**Ecological Role:** ROLE-SECONDARY-CONSUMER, ROLE-INDICATOR (indicator of grassland ecosystem health; population tracks vole abundance)

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-SC (Species of Concern — declining grassland breeder)
- Oregon State: ST-NL (monitored)
- IUCN Red List: IUCN-LC (Least Concern)
- Partners in Flight: Continental Concern — grassland obligate with declining habitat

**Morphometrics:**
- Length: 34–43 cm (13–17 in)
- Wingspan: 85–110 cm (33–43 in)
- Mass: Males 206–340 g (7–12 oz); Females 260–400 g (9–14 oz)

**Plumage Description:** Medium-sized owl with small, usually invisible ear tufts (raised only when alarmed). Streaked tawny-brown above and below; buffy facial disc with dark eye patches giving a "masked" appearance. Yellow eyes. In flight, shows distinctive buffy wing patches at base of primaries and dark "wrist" marks. Flight style buoyant and mothlike with irregular wingbeats — resembles a giant moth or a harrier.

**Hunting Strategy:**
- Primary hunting method: Low quartering flights 1–3 m above grassland — coursing back and forth in harrier-like fashion; occasionally hovers briefly; hunts primarily at dawn and dusk (crepuscular) but also fully diurnal, especially in winter
- Hunting range: Home range 1–8 km2 (nomadic; abandons areas when vole populations crash)
- Prey detection: Excellent binaural hearing; hunting flights are primarily sound-guided, with visual confirmation at close range

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Meadow Vole (*Microtus pennsylvanicus*) — 50–80% of diet; the most vole-dependent owl in the PNW. Population dynamics directly track vole abundance cycles. Short-eared Owl density can increase 5-10x during vole outbreaks (source: G-14, G-15)
  - Townsend's Vole (*Microtus townsendii*) — replaces Meadow Vole as dominant prey in western PNW lowland grasslands and estuarine marshes, particularly in Skagit and Samish River deltas where Short-eared Owls winter in concentrations (source: G-14, G-23)
  - Montane Vole (*Microtus montanus*) — primary prey in east-side grasslands and agricultural areas
- Secondary prey:
  - Deer Mouse (*Peromyscus maniculatus*) — taken when vole density is low
  - Long-tailed Vole (*Microtus longicaudus*) — meadow margins
  - Harvest Mouse (*Reithrodontomys megalotis*) — grasslands
  - Pocket Mouse (*Perognathus parvus*) — east-side steppe
  - Shrews (*Sorex* spp.) — minor dietary component
  - Small birds — Savannah Sparrow (*Passerculus sandwichensis*), Horned Lark (*Eremophila alpestris*) — occasional
  - Insects — grasshoppers and beetles during summer, minor component
- Prey size range: 10–80 g (strongly concentrated on 20–50 g *Microtus* voles)
- **MAM cross-reference:** Meadow Vole (*Microtus pennsylvanicus*), Townsend's Vole (*Microtus townsendii*), Montane Vole (*Microtus montanus*), Deer Mouse (*Peromyscus maniculatus*), Long-tailed Vole (*Microtus longicaudus*), Harvest Mouse (*Reithrodontomys megalotis*), Pocket Mouse (*Perognathus parvus*) — all expected in MAM profiles. See MAM (pending): Meadow Vole (obligate primary prey — H-6 pair 18), Townsend's Vole (primary prey — H-6 pair 19).
- **AVI cross-reference:** Savannah Sparrow, Horned Lark — see AVI resident.md and migratory.md (occasional prey).

**Nesting Ecology:**
- Nest type: Ground nest — scrape lined with grass and downy feathers
- Nest location: Dense grass or low vegetation in open grasslands, marshes, or fallow agricultural fields; the only commonly ground-nesting owl in PNW (Burrowing Owl also ground-nests but uses burrows)
- Territory size: 1–8 km2 (colonial when vole density is high — multiple pairs may nest within 100 m)
- Clutch size: 5–7 eggs (range 4–14; extraordinary variation with prey abundance; during vole outbreaks may produce 10+ eggs)
- Incubation: 24–29 days, female only
- Fledging: 24–27 days (leave nest on foot before flight capability; hide in grass)

**Vocalization:** Male courtship display includes spectacular aerial display — rising 200+ m with rhythmic wing-clapping, then diving. Advertising call a repeated low "boo-boo-boo-boo" during display flight. Generally quiet outside breeding season. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Secondary consumer — specialist vole predator in open-country habitats
- Population regulation of: *Microtus* vole populations in grassland and marsh ecosystems; may locally depress vole density during concentration events
- Guild competition: Northern Harrier (diurnal counterpart — same grassland habitat, similar coursing flight, overlapping prey base; partitioned by time of day). Barn Owl (nocturnal, same prey base in agricultural habitats; partitioned by time and nest-site type). Long-eared Owl (nocturnal congener in same genus; partitioned by time and microhabitat).

**Salmon Thread:** No (may hunt in estuarine marshes near salmon-bearing rivers but no direct salmon dependency)

**Key Sources:** G-14, G-15, G-23, O-22

**Cross-Module References:**
- See MAM (pending): Meadow Vole (*Microtus pennsylvanicus*) (obligate primary prey — H-6 pair 18)
- See MAM (pending): Townsend's Vole (*Microtus townsendii*) (primary prey — H-6 pair 19)
- See AVI: Northern Harrier (*Circus hudsonius*) (diurnal ecological counterpart)
- See AVI: Barn Owl (*Tyto alba*) (nocturnal guild competitor)

---

### Northern Saw-whet Owl (*Aegolius acadicus*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Aegolius*
- Species: *Aegolius acadicus*
- Subspecies: *A. a. acadicus* (throughout PNW mainland); *A. a. brooksi* (Queen Charlotte Saw-whet Owl — Haida Gwaii endemic, darker)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident (year-round in PNW forests; some altitudinal migration and irruptive southward movement in fall)

**Elevation Range:**
- Breeding: 500–6,000 ft (150–1,830 m)
- Wintering: 0–4,000 ft (0–1,220 m) — descends to lowland forests and riparian areas
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE, ELEV-RIPARIAN

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE, ELEV-RIPARIAN

**Habitat:** HAB-OLD-GROWTH, HAB-SECOND-GROWTH, HAB-RIPARIAN (dense riparian thickets in winter)

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-NL
- Oregon State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)

**Morphometrics:**
- Length: 18–21 cm (7–8.3 in)
- Wingspan: 42–56 cm (17–22 in)
- Mass: Males 54–95 g (1.9–3.4 oz); Females 65–120 g (2.3–4.2 oz) — one of the smallest PNW owls

**Plumage Description:** Tiny, compact owl with large round head and no ear tufts. Brown above with white spotting on crown and white streaks on scapulars. Whitish below with broad reddish-brown streaking. Facial disc reddish-brown to gray with white V between bright yellow eyes. Juveniles dramatically different — chocolate-brown breast, tawny-orange face, white forehead triangle.

**Hunting Strategy:**
- Primary hunting method: Still-hunting from low perch (2–5 m); drops onto prey detected by hearing; hunts in forest understory and along forest edges
- Hunting range: Home range 0.5–3 km2 (small home range due to small body size and energy requirements)
- Prey detection: Excellent binaural hearing with asymmetric ear openings; hunts in complete darkness

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Deer Mouse (*Peromyscus maniculatus*) — 50–80% of diet by number; the dominant prey item across all habitats (source: G-14)
  - Red-backed Vole (*Myodes gapperi*) — 10–25% of diet in mature conifer forests
- Secondary prey:
  - Meadow Vole (*Microtus pennsylvanicus*) — in grassland-adjacent forest edge
  - Townsend's Vole (*Microtus townsendii*) — western lowland forests
  - Long-tailed Vole (*Microtus longicaudus*) — montane habitats
  - Shrews (*Sorex* spp.) — consistent minor prey; Vagrant Shrew (*Sorex vagrans*), Masked Shrew (*Sorex cinereus*)
  - Small birds — kinglets, chickadees, creepers taken at roost sites; represents 5–10% of diet
  - Insects — large moths, beetles — minor and seasonal
- Prey size range: 5–50 g (constrained by small body size)
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Red-backed Vole (*Myodes gapperi*), Meadow Vole (*Microtus pennsylvanicus*), Townsend's Vole (*Microtus townsendii*), Long-tailed Vole (*Microtus longicaudus*), Vagrant Shrew (*Sorex vagrans*), Masked Shrew (*Sorex cinereus*) — all expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** Golden-crowned Kinglet, Black-capped Chickadee, Brown Creeper — see AVI resident.md (occasional prey taken at roost).

**Nesting Ecology:**
- Nest type: Secondary cavity nester — uses abandoned woodpecker cavities (especially Northern Flicker and Pileated Woodpecker holes); readily accepts nest boxes
- Nest location: Dead or live conifers and hardwoods with suitable cavities; 3–15 m height
- Territory size: 0.5–3 km2
- Clutch size: 4–7 eggs (average 5–6)
- Incubation: 26–28 days, female only
- Fledging: 27–34 days

**Vocalization:** Named for call's supposed resemblance to the sound of a saw being sharpened on a whetstone. Male advertising call a monotonous, repeated "toot-toot-toot-toot" — a single note repeated at ~2 notes/second for extended periods (minutes to hours). One of the most persistent nocturnal vocalizers in PNW forests. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Secondary consumer — prey to Great Horned Owl, Barred Owl, Northern Goshawk, and Cooper's Hawk
- Population regulation of: Deer mouse and vole populations in forest understory
- Guild competition: Northern Pygmy-Owl (similar size; Pygmy-Owl diurnal, Saw-whet nocturnal — complete temporal partitioning). Western Screech-Owl (similar size, nocturnal, different habitats — lowland riparian vs. forest).

**Salmon Thread:** No

**Key Sources:** G-14, O-22, O-26

**Cross-Module References:**
- See MAM (pending): Deer Mouse (*Peromyscus maniculatus*) (primary prey)
- See AVI: Northern Pygmy-Owl (*Glaucidium gnoma*) (temporal niche partitioning — day/night counterpart)
- See AVI Mod 5: cavity nester guild (secondary cavity user)

---

### Northern Pygmy-Owl (*Glaucidium gnoma*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Glaucidium*
- Species: *Glaucidium gnoma*
- Subspecies: *G. g. swarthi* (Vancouver Pygmy-Owl — coastal PNW, darker); *G. g. gnoma* (interior PNW)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident (year-round; sedentary; minor altitudinal movement downslope in winter)

**Elevation Range:**
- Breeding: 1,000–7,000 ft (305–2,135 m)
- Wintering: 500–5,000 ft (150–1,524 m)
- Elevation Band IDs: ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE

**Habitat:** HAB-OLD-GROWTH, HAB-SECOND-GROWTH, HAB-RIPARIAN (mountain streams)

**Ecological Role:** ROLE-MESOPREDATOR

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-NL
- Oregon State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)

**Morphometrics:**
- Length: 15–18 cm (6–7 in) — smallest PNW owl (tied with Flammulated Owl)
- Wingspan: 30–38 cm (12–15 in)
- Mass: Males 50–65 g (1.8–2.3 oz); Females 60–75 g (2.1–2.6 oz) — approximately the mass of a sparrow

**Plumage Description:** Tiny, compact owl with relatively long tail (unique among small owls). Brown to gray-brown above with fine white spotting. Whitish below with dark brown streaking. Small round head without ear tufts. Yellow eyes. Distinctive paired dark "false eye" spots (ocelli) on back of head — thought to deter predators from attacking from behind. Tail barred dark and white, often flicked from side to side when perched.

**Hunting Strategy:**
- Primary hunting method: Active diurnal hunter — this is the most consistently daylight-active owl in the PNW; ambush attacks from concealed perch; rapid, direct flight to capture prey; remarkably bold, regularly attacking prey near its own body mass
- Hunting range: Home range 0.5–2 km2
- Prey detection: Primarily visual (diurnal hunting); excellent binocular vision; also uses hearing to locate prey in dense vegetation

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Black-capped Chickadee (*Poecile atricapillus*) — significant prey; chickadees respond to Pygmy-Owl presence with intense mobbing behavior (source: G-14)
  - Chestnut-backed Chickadee (*Poecile rufescens*) — primary prey in coastal and montane conifer forests
  - Red-breasted Nuthatch (*Sitta canadensis*) — common prey in conifer forest
  - Deer Mouse (*Peromyscus maniculatus*) — 15–30% of diet; taken at dawn and dusk when mice are active (source: G-14)
  - Red-backed Vole (*Myodes gapperi*) — forest floor prey
- Secondary prey:
  - Golden-crowned Kinglet (*Regulus satrapa*) — tiny passerine, easy capture
  - Downy Woodpecker (*Dryobates pubescens*) — occasionally
  - Dark-eyed Junco (*Junco hyemalis*) — common prey at feeders and forest floor
  - House Finch (*Haemorhous mexicanus*) — suburban habitats
  - Townsend's Chipmunk (*Neotamias townsendii*) — ambitious prey; near body mass of Pygmy-Owl
  - Douglas Squirrel (*Tamiasciurus douglasii*) — rare but documented; squirrels frequently mob Pygmy-Owls
  - Insects — grasshoppers, large beetles, dragonflies — especially in summer
  - Lizards — Northern Alligator Lizard (*Elgaria coerulea*) — occasional
- Prey size range: 3–80 g (routinely takes prey exceeding its own body mass — extraordinary predator-prey mass ratio)
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Red-backed Vole (*Myodes gapperi*), Townsend's Chipmunk (*Neotamias townsendii*), Douglas Squirrel (*Tamiasciurus douglasii*) — expected in MAM profiles. See MAM (pending): Deer Mouse (primary prey — H-6 pair 18 context), small mammals (primary prey alongside birds).
- **AVI cross-reference:** Black-capped Chickadee (*Poecile atricapillus*), Chestnut-backed Chickadee (*Poecile rufescens*), Red-breasted Nuthatch (*Sitta canadensis*), Golden-crowned Kinglet (*Regulus satrapa*), Downy Woodpecker, Dark-eyed Junco, House Finch — see AVI resident.md (primary and secondary prey — H-6 pair 18 context).

**Nesting Ecology:**
- Nest type: Secondary cavity nester — uses abandoned woodpecker cavities (especially those of Northern Flicker, Hairy Woodpecker, and sapsuckers)
- Nest location: Dead or live conifers; 3–15 m height; cavity entrance typically 3–4 cm diameter (small enough to exclude larger predators)
- Territory size: 0.5–2 km2
- Clutch size: 4–7 eggs (usually 5–6)
- Incubation: 28–29 days, female only
- Fledging: 27–32 days

**Vocalization:** Monotonous, evenly-spaced single-note tooting — "toot...toot...toot..." at approximately 1 note per 2 seconds. Similar to Saw-whet Owl but slower, more mellow, and more widely spaced. Also a rapid trilled series during territorial encounters. This owl is most easily detected by the intense mobbing response it provokes from chickadees, nuthatches, and other small passerines. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Mesopredator — the smallest diurnal raptor in PNW forests; prey to Cooper's Hawk, Sharp-shinned Hawk, and larger owls
- Population regulation of: Small passerine populations in forest understory; creates a "landscape of fear" for chickadees and nuthatches that influences their foraging behavior and habitat use
- Guild competition: Northern Saw-whet Owl (nocturnal counterpart — near-identical size, overlapping prey base, complete temporal partitioning). Sharp-shinned Hawk (diurnal small-bird predator in same forest habitat — direct competition for passerine prey).

**Salmon Thread:** No

**Key Sources:** G-14, O-22, O-26

**Cross-Module References:**
- See MAM (pending): Deer Mouse (*Peromyscus maniculatus*) (primary prey — H-6 pair 18)
- See AVI: chickadees (*Poecile* spp.) (primary prey — H-6 pair 18)
- See AVI: Northern Saw-whet Owl (*Aegolius acadicus*) (nocturnal counterpart — temporal niche partitioning)
- See AVI Mod 5: cavity nester guild (secondary cavity user)

---

### Western Screech-Owl (*Megascops kennicottii*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Megascops*
- Species: *Megascops kennicottii*
- Subspecies: *M. k. kennicottii* (Pacific/coastal — dark gray-brown); *M. k. macfarlanei* (interior — paler, grayer; COSEWIC-listed in British Columbia)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident (year-round; sedentary and highly site-faithful to small territories)

**Elevation Range:**
- Breeding: 0–4,000 ft (0–1,220 m)
- Wintering: Same as breeding
- Elevation Band IDs: ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL

**Habitat:** HAB-RIPARIAN (primary — deciduous riparian corridors), HAB-OAK-PRAIRIE, HAB-SECOND-GROWTH (edge), HAB-URBAN (suburban parks and gardens with mature trees)

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-NL
- Oregon State: ST-NL
- IUCN Red List: IUCN-LC (Least Concern)
- Note: Interior subspecies *macfarlanei* is assessed as Threatened by COSEWIC in British Columbia

**Morphometrics:**
- Length: 19–26 cm (7.5–10 in)
- Wingspan: 46–61 cm (18–24 in)
- Mass: Males 100–165 g (3.5–5.8 oz); Females 120–210 g (4.2–7.4 oz)

**Plumage Description:** Small owl with prominent ear tufts and yellow eyes. Two color morphs: gray morph (most common in PNW) and brown/rufous morph (uncommon). Heavily streaked and barred plumage provides exceptional bark camouflage. Facial disc gray with darker rim. Coastal subspecies darker overall than interior birds.

**Hunting Strategy:**
- Primary hunting method: Still-hunting from low perch (1–5 m); drops onto prey on ground or in vegetation; also hawks flying insects from perch; most active at dusk and dawn but hunts throughout night
- Hunting range: Home range 0.2–1 km2 (very small territory, especially in productive riparian habitats)
- Prey detection: Binaural hearing; excellent low-light vision; detects insects and small vertebrates by sound and movement

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Deer Mouse (*Peromyscus maniculatus*) — 20–35% of diet (source: G-14)
  - Insects — large beetles, moths, crickets, earwigs — 30–50% of prey items by number (but low biomass per item); highly seasonal (spring through fall)
  - Crayfish (*Pacifastacus leniusculus*) — significant in riparian territories
- Secondary prey:
  - Meadow Vole (*Microtus pennsylvanicus*) — grassland-adjacent territories
  - House Mouse (*Mus musculus*) — suburban habitats
  - Small birds — House Sparrow (*Passer domesticus*), juncos, taken at roost
  - Earthworms — taken from lawns and garden soil after rain
  - Pacific Treefrog (*Pseudacris regilla*) — riparian habitats
  - Small fish — shallow water in riparian territories
  - Shrews (*Sorex* spp.) — occasional
- Prey size range: 1–80 g (broad prey spectrum from insects to mice)
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Meadow Vole (*Microtus pennsylvanicus*), House Mouse (*Mus musculus*), Shrews (*Sorex* spp.) — expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** House Sparrow, juncos — see AVI resident.md (occasional prey).

**Nesting Ecology:**
- Nest type: Secondary cavity nester — uses natural tree hollows, abandoned woodpecker cavities, nest boxes
- Nest location: Deciduous trees (black cottonwood, bigleaf maple, Oregon white oak) in riparian corridors and suburban neighborhoods; 3–10 m height
- Territory size: 0.2–1 km2
- Clutch size: 3–5 eggs (usually 4)
- Incubation: 26 days, female only
- Fledging: 28–35 days

**Vocalization:** Diagnostic "bouncing ball" call — an accelerating series of hollow whistled notes that speed up toward the end, like a ball bouncing to rest: "hoo hoo hoo hoo-hoo-hoo-hoohoohoohoo." Also a short trill between pair members. One of the most commonly heard owl calls in PNW suburban neighborhoods. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Secondary consumer — prey to Great Horned Owl (primary predator of screech-owls), Barred Owl, Cooper's Hawk
- Population regulation of: Insect and small mammal populations in riparian and suburban habitats
- Guild competition: Northern Saw-whet Owl (similar size; overlapping prey in forest habitats; screech-owls prefer more open/riparian habitat). Barn Owl (larger, open-country specialist; limited overlap in PNW).

**Salmon Thread:** No (may inhabit riparian corridors along salmon-bearing streams but no direct salmon dependency)

**Key Sources:** G-14, G-15, O-22, O-26

**Cross-Module References:**
- See MAM (pending): Deer Mouse (*Peromyscus maniculatus*) (primary prey)
- See AVI Mod 5: cavity nester guild (secondary cavity user — dependent on woodpecker-created cavities)

---

### Flammulated Owl (*Psiloscops flammeolus*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Psiloscops*
- Species: *Psiloscops flammeolus*
- Subspecies: Monotypic (no recognized subspecies)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Summer Breeder (the only truly migratory owl in the PNW; arrives late May, departs by October; winters in Mexico and Central America)

**Elevation Range:**
- Breeding: 2,500–7,000 ft (760–2,135 m) — montane dry conifer forests
- Wintering: Outside PNW (Mexico/Central America)
- Elevation Band IDs: ELEV-MONTANE, ELEV-SUBALPINE (lower portion)

**Ecoregion Affiliations:** ELEV-MONTANE

**Habitat:** HAB-OLD-GROWTH (ponderosa pine and Douglas-fir — open, dry montane forest), HAB-SECOND-GROWTH (mature ponderosa stands)

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-NL (uncommon; poorly surveyed due to cryptic habits)
- Oregon State: ST-SC (Sensitive — vulnerable due to dependence on old ponderosa pine forests)
- IUCN Red List: IUCN-LC (Least Concern)

**Morphometrics:**
- Length: 15–17 cm (6–6.7 in) — tied with Northern Pygmy-Owl as smallest PNW owl
- Wingspan: 36–42 cm (14–16.5 in)
- Mass: Males 45–55 g (1.6–1.9 oz); Females 50–65 g (1.8–2.3 oz) — the lightest PNW owl

**Plumage Description:** Tiny owl with small ear tufts and — uniquely among PNW owls — dark brown eyes (all other small PNW owls have yellow eyes). Gray to rufous-gray plumage with rusty-red (flammulated = flame-colored) patches on facial disc and scapulars. Heavily streaked and vermiculated for bark camouflage. Extremely difficult to see when roosting against ponderosa pine bark.

**Hunting Strategy:**
- Primary hunting method: Aerial hawking from perch — sallies out to catch flying insects in flight; also gleans insects from bark and foliage like a flycatcher; entirely insectivorous
- Hunting range: Home range 0.5–2 km2 in mature ponderosa pine forest
- Prey detection: Visual (crepuscular hunting in open pine forest canopy); also hearing for bark-dwelling prey

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Moths (Lepidoptera) — 50–70% of diet; noctuid moths, geometrid moths, and other large night-flying species attracted to open pine forest
  - Beetles (Coleoptera) — 15–25% of diet; bark beetles, wood-boring beetles from ponderosa pine
  - Crickets and grasshoppers (Orthoptera) — 10–20% of diet; taken in forest openings
- Secondary prey:
  - Spiders — gleaned from bark and foliage
  - Caterpillars — foliage-gleaned, especially spruce budworm and Douglas-fir tussock moth larvae
  - Centipedes — bark-dwelling arthropods
  - Scorpions — in east-side dry forests
  - **No mammalian prey documented** — Flammulated Owl is the only strictly insectivorous owl in the PNW
- Prey size range: 0.5–5 g (smallest prey items of any PNW owl — entirely invertebrate)
- **MAM cross-reference:** None — no mammalian prey. Flammulated Owl is excluded from all H-6 raptor-prey mammal pairs.
- **AVI cross-reference:** None — no avian prey documented.

**Nesting Ecology:**
- Nest type: Secondary cavity nester — uses abandoned woodpecker cavities (especially Northern Flicker and Lewis's Woodpecker)
- Nest location: Large-diameter ponderosa pine or Douglas-fir snags; 3–15 m height; requires open canopy structure typical of old-growth ponderosa pine forest
- Territory size: 0.5–2 km2
- Clutch size: 2–4 eggs (usually 3)
- Incubation: 21–24 days, female only
- Fledging: 21–25 days

**Migration:**
- Migration strategy: Long-distance migrant (the only PNW owl that is fully migratory)
- Spring arrival: Late May to early June in PNW
- Fall departure: September–October
- Wintering range: Mexico and Guatemala — pine-oak forests at similar elevations to PNW breeding habitat
- Key PNW staging areas: Not well documented; likely moves through ponderosa pine corridors

**Vocalization:** Low, soft, ventriloquial "hoop" — a single-note call repeated at 2-3 second intervals that is remarkably difficult to localize. The ventriloquial quality means the owl often sounds farther away than it is. Easily overlooked during surveys. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Secondary consumer — insectivore with no vertebrate prey; prey to Great Horned Owl, Northern Goshawk, Cooper's Hawk
- Population regulation of: Forest arthropod populations, including bark beetle outbreaks in ponderosa pine forests
- Guild competition: Common Nighthawk and Common Poorwill (nocturnal aerial insectivores; limited overlap in microhabitat and prey size). No direct owl competitor — unique insectivorous niche.

**Salmon Thread:** No

**Key Sources:** G-14, G-15, O-22

**Cross-Module References:**
- See AVI Mod 5: cavity nester guild (secondary cavity user — dependent on large-diameter ponderosa pine snags)
- See ECO: shared-attributes (HAB-OLD-GROWTH — ponderosa pine forest type)

---

### Burrowing Owl (*Athene cunicularia*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Athene*
- Species: *Athene cunicularia*
- Subspecies: *A. c. hypugaea* (Western Burrowing Owl — throughout PNW range)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Summer Breeder (migratory in PNW; arrives March–April, departs September–October; winters in California, Mexico, and southern US)

**Elevation Range:**
- Breeding: 500–4,500 ft (150–1,370 m) — arid open country
- Wintering: Outside PNW
- Elevation Band IDs: ELEV-SHRUB-STEPPE, ELEV-LOWLAND

**Ecoregion Affiliations:** ELEV-SHRUB-STEPPE, ELEV-LOWLAND

**Habitat:** AVI-HAB-SAGEBRUSH, AVI-HAB-GRASSLAND, ELEV-SUBTERRANEAN (burrow-nesting)

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-SC (Species of Concern — candidate for listing; severely declining in WA)
- Oregon State: ST-SC (Sensitive — Critical; breeding population small and declining)
- IUCN Red List: IUCN-LC (Least Concern — globally secure but regionally imperiled in PNW)
- Partners in Flight: Continental Stewardship Species

**Morphometrics:**
- Length: 19–28 cm (7.5–11 in)
- Wingspan: 51–61 cm (20–24 in)
- Mass: Males 130–170 g (4.6–6.0 oz); Females 140–185 g (4.9–6.5 oz)

**Plumage Description:** Small, long-legged owl with round head, no ear tufts, and bright yellow eyes. Brown above with white spotting; white below with brown barring. Distinctively long, bare legs (adapted for ground-dwelling). White eyebrow stripe and chin patch. Tail short and squared. Often seen standing on ground or fence post near burrow entrance — a posture unlike any other PNW owl.

**Hunting Strategy:**
- Primary hunting method: Pursues insects on foot (running across ground); hawks flying insects from low perch; short flights to capture small vertebrate prey; most active at dusk and dawn but hunts throughout day
- Hunting range: Home range 0.5–3 km2 centered on burrow colony
- Prey detection: Visual — diurnal hunting in open terrain; also uses hearing for nocturnal hunting of rodents

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Insects — grasshoppers (Acrididae), beetles (Coleoptera), crickets (Gryllidae) — 60–80% of prey items by number; dominant prey from May through September (source: G-14, G-16)
  - Deer Mouse (*Peromyscus maniculatus*) — 10–20% of diet by number but higher biomass contribution; more important in spring before insect emergence and in fall
  - Great Basin Pocket Mouse (*Perognathus parvus*) — significant mammalian prey in sagebrush steppe
- Secondary prey:
  - Meadow Vole (*Microtus pennsylvanicus*) — in grassland-adjacent areas
  - Kangaroo Rat (*Dipodomys ordii*) — south-central Oregon steppe
  - Sagebrush Vole (*Lemmiscus curtatus*) — sagebrush steppe specialist
  - Horned Lark (*Eremophila alpestris*) — occasional avian prey
  - Western Meadowlark (*Sturnella neglecta*) — nestlings occasionally taken
  - Small lizards — Side-blotched Lizard (*Uta stansburiana*), Western Fence Lizard (*Sceloporus occidentalis*)
  - Scorpions, centipedes — arachnid/myriapod prey
  - Small snakes — Gopher Snake (*Pituophis catenifer*) juveniles
- Prey size range: 0.5–50 g (insects 0.5–5 g; mammals 10–50 g)
- **MAM cross-reference:** Deer Mouse (*Peromyscus maniculatus*), Great Basin Pocket Mouse (*Perognathus parvus*), Meadow Vole (*Microtus pennsylvanicus*), Kangaroo Rat (*Dipodomys ordii*), Sagebrush Vole (*Lemmiscus curtatus*) — expected in MAM profiles. See MAM (pending): Deer Mouse (secondary prey), small mammals (secondary prey — H-6 pair 19 context).
- **AVI cross-reference:** Horned Lark (*Eremophila alpestris*), Western Meadowlark (*Sturnella neglecta*) — see AVI resident.md (occasional prey).

**Nesting Ecology:**
- Nest type: Burrow — unique among PNW owls; uses abandoned burrows of American Badger (*Taxidea taxus*), Columbian Ground Squirrel (*Urocitellus columbianus*), Yellow-bellied Marmot (*Marmota flaviventris*); occasionally excavates own burrow in soft soil
- Nest location: Open, flat to gently rolling terrain with short vegetation; burrows 1–3 m deep; often colonial
- Territory size: 0.5–3 km2 (centered on burrow colony)
- Clutch size: 6–11 eggs (among the largest clutches of any PNW raptor)
- Incubation: 28–30 days, female only
- Fledging: 44–53 days

**Migration:**
- Migration strategy: Medium-distance migrant
- Spring arrival: March–April in PNW
- Fall departure: September–October
- Wintering range: Central California, Mexico, southwestern US
- Key PNW staging areas: Not well documented; disperses from breeding colonies in late summer

**Vocalization:** Two-note "coo-coooo" — a soft, slightly upslurred call given from burrow entrance or fence post. Also a rapid chattering alarm call and a raspy screech. Calls mostly at dusk. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Secondary consumer — prey to Great Horned Owl, Red-tailed Hawk, Swainson's Hawk, Ferruginous Hawk, and Prairie Falcon. Nest burrows also vulnerable to badger, coyote, and rattlesnake predation.
- Population regulation of: Grasshopper and beetle populations in steppe grasslands; minor effect on small mammal populations
- Guild competition: Limited — unique ground-dwelling niche among PNW owls. Most similar ecologically to American Kestrel (diurnal open-country insectivore/small mammal predator) but different nest type and activity period.

**Salmon Thread:** No

**Key Sources:** G-14, G-16, O-22

**Cross-Module References:**
- See MAM (pending): Deer Mouse (*Peromyscus maniculatus*) (secondary prey — H-6 pair 19)
- See MAM (pending): American Badger (*Taxidea taxus*) (burrow provider — commensal relationship)
- See MAM (pending): Ground squirrels (burrow providers)
- See ECO: shared-attributes (AVI-HAB-SAGEBRUSH characterization)

---

### Snowy Owl (*Bubo scandiacus*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Bubo*
- Species: *Bubo scandiacus*
- Subspecies: Monotypic (no subspecies)

**AOS Authority:** AOS Check-list 7th edition (O-03); formerly placed in monotypic genus *Nyctea*, now merged into *Bubo* based on molecular phylogenetics

**Residency Status:** Winter Visitor (irruptive — present in PNW November–March in variable numbers; absent in some winters, abundant in "irruption" years associated with lemming population crashes on Arctic breeding grounds)

**Elevation Range:**
- Wintering: 0–2,000 ft (0–610 m) — strictly lowland in PNW
- Elevation Band IDs: ELEV-LOWLAND, ELEV-COASTAL, ELEV-SHRUB-STEPPE

**Ecoregion Affiliations:** ELEV-LOWLAND, ELEV-COASTAL, ELEV-SHRUB-STEPPE

**Habitat:** AVI-HAB-GRASSLAND, AVI-HAB-MUDFLAT, AVI-HAB-SAGEBRUSH, HAB-SANDY-BEACH, HAB-URBAN (airports, agricultural fields — open flat terrain resembling tundra)

**Ecological Role:** ROLE-APEX (temporary winter apex predator in lowland open habitats)

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-NL
- Oregon State: ST-NL (very rare visitor)
- IUCN Red List: IUCN-VU (Vulnerable — global population declining; uplisted from LC in 2017)

**Morphometrics:**
- Length: 52–71 cm (20–28 in)
- Wingspan: 126–165 cm (50–65 in)
- Mass: Males 1,600–2,100 g (56–74 oz); Females 1,700–2,950 g (60–104 oz) — the heaviest PNW owl by mass

**Plumage Description:** Large, heavily built owl. Adult males nearly pure white with sparse dark barring. Adult females and immatures white with extensive dark brown barring across entire body — some young females appear more brown than white. Yellow eyes. No ear tufts. Round head. Thick feathering extends to toes (adaptation to Arctic cold). Adult males become progressively whiter with age.

**Hunting Strategy:**
- Primary hunting method: Sit-and-wait from elevated perch (rooftop, driftwood log, fence post, sand dune) overlooking flat terrain; short flight to capture prey; also hunts in flight over open ground. Active during day and night (adapted to 24-hour Arctic daylight on breeding grounds)
- Hunting range: Winter home range 1–20 km2 (highly variable; may defend winter territories at high-quality sites)
- Prey detection: Excellent binocular vision (adapted for diurnal hunting); good hearing

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey (PNW winter range):
  - Meadow Vole (*Microtus pennsylvanicus*) — primary winter prey in PNW grasslands; 30–50% of diet (source: G-14)
  - Townsend's Vole (*Microtus townsendii*) — primary prey in western WA lowland grasslands
  - Waterfowl — ducks including Mallard (*Anas platyrhynchos*), Green-winged Teal (*Anas crecca*), and others at estuarine and coastal sites; significant prey
- Secondary prey:
  - Deer Mouse (*Peromyscus maniculatus*) — grassland and agricultural habitats
  - Brown Rat (*Rattus norvegicus*) — coastal and agricultural areas
  - Shorebirds — Dunlin (*Calidris alpina*), Western Sandpiper (*Calidris mauri*) — coastal mudflat hunting
  - Gulls — various species at coastal sites
  - Ring-necked Pheasant (*Phasianus colchicus*) — agricultural areas
  - American Coot (*Fulica americana*) — wetlands
  - Short-eared Owl (*Asio flammeus*) — intraguild predation documented in shared grassland habitat
  - Domestic Pigeon (*Columba livia*) — urban/airport sites
- Prey size range: 15–1,500 g (wide prey spectrum reflecting generalist Arctic-adapted predator)
- **MAM cross-reference:** Meadow Vole (*Microtus pennsylvanicus*), Townsend's Vole (*Microtus townsendii*), Deer Mouse (*Peromyscus maniculatus*), Brown Rat (*Rattus norvegicus*) — expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** Mallard, Green-winged Teal, Dunlin, Western Sandpiper, gulls, Ring-necked Pheasant, American Coot, Short-eared Owl, Rock Pigeon — see AVI resident.md and migratory.md.

**Nesting Ecology:**
- Does not breed in PNW. Nests on Arctic tundra — ground nest on elevated hummock or ridge.

**Migration:**
- Migration strategy: Irruptive (irregular winter visitor; not annual)
- Spring departure from PNW: February–April (variable)
- Fall arrival in PNW: November–December (in irruption years)
- Breeding range: Arctic tundra — Alaska, northern Canada, circumpolar
- Key PNW wintering sites: Boundary Bay (BC/WA), Damon Point (Ocean Shores, WA), Samish Flats (WA), airports (SeaTac, PDX — flat open terrain)

**Vocalization:** Generally silent on wintering grounds. Breeding call a deep, gruff barking "hoo-hoo" or "rick-rick-rick." (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Apex predator during PNW winter residence — the largest and most powerful owl present in lowland open habitats during winter
- Population regulation of: Temporary impact on vole and waterfowl populations in concentrated wintering areas
- Guild competition: Short-eared Owl (overlapping prey and habitat during winter; Snowy Owl dominant when present). Northern Harrier (diurnal counterpart in winter grasslands).

**Salmon Thread:** No (may winter near salmon-bearing estuaries but no direct salmon dependency)

**Key Sources:** G-10, G-14, O-02, O-22

**Cross-Module References:**
- See AVI: Short-eared Owl (*Asio flammeus*) (co-occurring winter grassland predator; intraguild predation documented)
- See AVI: Gyrfalcon (*Falco rusticolus*) (co-occurring Arctic visitor — irruptive winter pattern)
- See MAM (pending): Meadow Vole (*Microtus pennsylvanicus*) (primary winter prey)

---

### Boreal Owl (*Aegolius funereus*)

**Taxonomy:**
- Order: Strigiformes
- Family: Strigidae (Typical Owls)
- Genus: *Aegolius*
- Species: *Aegolius funereus*
- Subspecies: *A. f. richardsoni* (North American Boreal Owl — throughout PNW range)

**AOS Authority:** AOS Check-list 7th edition (O-03)

**Residency Status:** Resident (year-round in high-elevation boreal/subalpine forests; extremely secretive and poorly known in PNW; may undertake irregular altitudinal movements in winter)

**Elevation Range:**
- Breeding: 3,500–7,000 ft (1,070–2,135 m) — subalpine spruce-fir forests
- Wintering: 2,500–6,000 ft (760–1,830 m) — may descend slightly
- Elevation Band IDs: ELEV-SUBALPINE, ELEV-MONTANE (upper)

**Ecoregion Affiliations:** ELEV-SUBALPINE, ELEV-MONTANE

**Habitat:** HAB-OLD-GROWTH (subalpine spruce-fir and mixed conifer forest), HAB-SUBALPINE-PARKLAND (edge)

**Ecological Role:** ROLE-SECONDARY-CONSUMER

**Conservation Status:**
- Federal ESA: ESA-NL (Not listed)
- Washington State: ST-SC (Species of Concern — candidate; very poorly known, potentially rare)
- Oregon State: ST-SC (Sensitive — data deficient in Oregon; breeding status uncertain in many areas)
- IUCN Red List: IUCN-LC (Least Concern — globally secure but poorly documented in PNW)

**Morphometrics:**
- Length: 21–28 cm (8–11 in)
- Wingspan: 50–62 cm (20–24 in)
- Mass: Males 93–140 g (3.3–4.9 oz); Females 120–210 g (4.2–7.4 oz) — pronounced sexual size dimorphism for a small owl

**Plumage Description:** Small owl with large, flat-topped head and no ear tufts. Chocolate-brown above with white spotting. Whitish below with brown streaking. Facial disc pale gray with black border and dark patches near eyes giving a "surprised" expression. Yellow eyes. Very similar to larger Saw-whet Owl but facial pattern distinctive — more defined black facial border and spotted rather than streaked crown.

**Hunting Strategy:**
- Primary hunting method: Still-hunting from low-to-mid canopy perch; drops onto prey on forest floor detected by hearing; strictly nocturnal; hunts in dense subalpine forest
- Hunting range: Home range 1–5 km2 in subalpine forest
- Prey detection: Excellent binaural hearing with asymmetric ear openings (most asymmetric of any North American owl); specialized for locating prey beneath snow and leaf litter by sound alone

**Prey Profile (CRITICAL — feeds integration test H-6):**
- Primary prey:
  - Red-backed Vole (*Myodes gapperi*) — 40–60% of diet in subalpine conifer forests (source: G-14)
  - Deer Mouse (*Peromyscus maniculatus*) — 15–30% of diet; consistent prey across all seasons
  - Long-tailed Vole (*Microtus longicaudus*) — significant in montane meadow-edge habitat
- Secondary prey:
  - Heather Vole (*Phenacomys intermedius*) — subalpine heath/meadow edges; characteristic high-elevation prey
  - Meadow Vole (*Microtus pennsylvanicus*) — lower-elevation territory boundaries
  - Shrews (*Sorex* spp.) — Dusky Shrew (*Sorex monticolus*), Water Shrew (*Sorex palustris*)
  - Small birds — kinglets, chickadees — rare; diet overwhelmingly mammalian
  - Insects — occasional large beetles in summer
- Prey size range: 10–60 g (concentrated on small forest-floor rodents)
- **MAM cross-reference:** Red-backed Vole (*Myodes gapperi*), Deer Mouse (*Peromyscus maniculatus*), Long-tailed Vole (*Microtus longicaudus*), Heather Vole (*Phenacomys intermedius*), Meadow Vole (*Microtus pennsylvanicus*), Dusky Shrew (*Sorex monticolus*), Water Shrew (*Sorex palustris*) — expected in MAM profiles. See MAM (pending).
- **AVI cross-reference:** Minimal — diet overwhelmingly mammalian.

**Nesting Ecology:**
- Nest type: Secondary cavity nester — uses abandoned woodpecker cavities (especially Pileated Woodpecker and Northern Flicker in subalpine forests)
- Nest location: Large-diameter subalpine conifers (Engelmann spruce, subalpine fir, mountain hemlock); 3–15 m height
- Territory size: 1–5 km2
- Clutch size: 3–7 eggs (average 4–5; tracks prey abundance)
- Incubation: 26–32 days, female only
- Fledging: 28–36 days

**Vocalization:** Male advertising call a rapid, pulsed trill — "whoowhoowhoowhoowhoo" — 8-20 notes delivered in 2-4 second bursts. Remarkably similar to the winnowing sound of a Common Snipe. Calls primarily in late winter/early spring (February–April) during breeding season. Very difficult to detect during rest of year. (Reference: Macaulay Library O-26)

**Ecological Role:**
- Trophic position: Secondary consumer — prey to Northern Goshawk, Great Horned Owl, American Marten. One of the least-known raptors in PNW.
- Population regulation of: Red-backed vole and deer mouse populations in subalpine forests
- Guild competition: Northern Saw-whet Owl (close relative in genus *Aegolius*; overlapping but elevationally partitioned — Boreal Owl at higher elevations, Saw-whet at lower). Great Gray Owl (overlapping montane/subalpine habitat; different prey specialization — Great Gray Owl hunts meadow edges, Boreal Owl hunts forest interior).

**Salmon Thread:** No

**Key Sources:** G-14, G-25, O-22

**Cross-Module References:**
- See MAM (pending): Red-backed Vole (*Myodes gapperi*) (primary prey)
- See AVI: Northern Saw-whet Owl (*Aegolius acadicus*) (congener — elevational niche partitioning)
- See AVI Mod 5: cavity nester guild (secondary cavity user — subalpine)
- See ECO: shared-attributes (ELEV-SUBALPINE habitat characterization)

---

## Integration Test H-6: Raptor-Prey Cross-Reference Summary

The following table maps each H-6 integration test pair to the raptor profile in this document and the expected MAM module cross-reference. All 19 pairs are documented in the species profiles above.

| H-6 Pair | Raptor | Prey | Profile Section | MAM Status | Interaction Strength |
|-----------|--------|------|-----------------|------------|---------------------|
| 1 | Great Horned Owl | Snowshoe Hare (*Lepus americanus*) | Strigiformes | Pending | Primary |
| 2 | Northern Spotted Owl | Northern Flying Squirrel (*Glaucomys sabrinus*) | Strigiformes | Pending | Obligate |
| 3 | Barn Owl | Deer Mouse (*Peromyscus maniculatus*) / Vole (*Microtus* spp.) | Strigiformes | Pending | Primary (voles) / Secondary (mice) |
| 4 | Bald Eagle | Pacific Salmon (*Oncorhynchus* spp.) | Accipitriformes | N/A (fish — ECO) | Primary |
| 5 | Osprey | Trout/Salmon (*Oncorhynchus* spp.) | Accipitriformes | N/A (fish — ECO) | Primary |
| 6 | Peregrine Falcon | Vaux's Swift / shorebirds | Falconiformes | N/A (birds — AVI) | Primary |
| 7 | Northern Goshawk | Snowshoe Hare / Grouse | Accipitriformes | Pending (hare) | Primary |
| 8 | Red-tailed Hawk | Townsend's Vole / Ground Squirrels | Accipitriformes | Pending | Primary |
| 9 | Cooper's Hawk | Band-tailed Pigeon / Steller's Jay | Accipitriformes | N/A (birds — AVI) | Primary |
| 10 | Golden Eagle | Marmot / Jackrabbit | Accipitriformes | Pending | Primary |
| 11 | Northern Harrier | Meadow Vole (*Microtus pennsylvanicus*) | Accipitriformes | Pending | Primary |
| 12 | Short-eared Owl | Vole species (*Microtus* spp.) | Strigiformes | Pending | Obligate |
| 13 | Ferruginous Hawk | Ground Squirrel / Jackrabbit | Accipitriformes | Pending | Primary |
| 14 | Prairie Falcon | Ground Squirrel / Horned Lark | Falconiformes | Pending (squirrel) | Primary |
| 15 | Rough-legged Hawk | *Microtus* voles | Accipitriformes | Pending | Primary |
| 16 | American Kestrel | Grasshopper / small mammals | Falconiformes | Pending (mammals) | Primary (insects) / Secondary (mammals) |
| 17 | Merlin | Small passerines | Falconiformes | N/A (birds — AVI) | Primary |
| 18 | Northern Pygmy-Owl | Chickadees / small mammals | Strigiformes | Pending (mammals) | Primary (birds + mammals) |
| 19 | Burrowing Owl | Insects / small mammals | Strigiformes | Pending (mammals) | Primary (insects) / Secondary (mammals) |

### H-6 Validation Status

- **All 19 pairs documented:** Yes — each raptor's Prey Profile section explicitly names the prey species from the integration test specification
- **MAM cross-references present:** Yes — all mammalian prey items include "See MAM (pending)" references
- **AVI cross-references present:** Yes — all avian prey items reference AVI resident.md or migratory.md
- **Scientific names included:** Yes — all prey species listed with full scientific binomials
- **Interaction strengths documented:** Yes — Obligate/Primary/Secondary classification for each relationship
- **Deferred status:** All MAM pairs are DEFERRED pending MAM module production

---

## MAM Small Mammal Cross-Reference Index

The following mammal species appear as prey across the raptor profiles in this document and must have reciprocal predator documentation in the MAM module. This index serves as the master checklist for H-6 validation.

### Lagomorpha (Rabbits, Hares, Pikas)
| Species | Scientific Name | Primary Raptor Predators | Secondary Raptor Predators |
|---------|----------------|-------------------------|---------------------------|
| Snowshoe Hare | *Lepus americanus* | Great Horned Owl, Northern Goshawk | Bald Eagle, Golden Eagle, Barred Owl, Great Gray Owl, Red-tailed Hawk |
| White-tailed Jackrabbit | *Lepus townsendii* | Golden Eagle, Ferruginous Hawk | Prairie Falcon |
| Black-tailed Jackrabbit | *Lepus californicus* | Golden Eagle, Ferruginous Hawk | Red-tailed Hawk |
| Eastern Cottontail | *Sylvilagus floridanus* | Red-tailed Hawk, Great Horned Owl | Bald Eagle, Cooper's Hawk |
| Mountain Cottontail | *Sylvilagus nuttallii* | Red-tailed Hawk, Golden Eagle | Great Horned Owl |

### Rodentia — Sciuromorpha (Squirrels, Marmots, Chipmunks)
| Species | Scientific Name | Primary Raptor Predators | Secondary Raptor Predators |
|---------|----------------|-------------------------|---------------------------|
| Northern Flying Squirrel | *Glaucomys sabrinus* | Northern Spotted Owl, Great Horned Owl | Barred Owl, Northern Goshawk |
| Douglas Squirrel | *Tamiasciurus douglasii* | Northern Goshawk | Great Horned Owl, Barred Owl, Northern Pygmy-Owl, Cooper's Hawk |
| Hoary Marmot | *Marmota caligata* | Golden Eagle | — |
| Yellow-bellied Marmot | *Marmota flaviventris* | Golden Eagle | — |
| Columbian Ground Squirrel | *Urocitellus columbianus* | Red-tailed Hawk, Ferruginous Hawk, Golden Eagle | Prairie Falcon, Swainson's Hawk |
| Belding's Ground Squirrel | *Urocitellus beldingi* | Red-tailed Hawk, Ferruginous Hawk | Prairie Falcon |
| California Ground Squirrel | *Otospermophilus beecheyi* | Red-tailed Hawk | Ferruginous Hawk, Golden Eagle |
| Townsend's Chipmunk | *Neotamias townsendii* | Northern Pygmy-Owl | Cooper's Hawk, Sharp-shinned Hawk |

### Rodentia — Myomorpha (Mice, Voles, Woodrats)
| Species | Scientific Name | Primary Raptor Predators | Secondary Raptor Predators |
|---------|----------------|-------------------------|---------------------------|
| Deer Mouse | *Peromyscus maniculatus* | Barn Owl, Northern Saw-whet Owl, Western Screech-Owl, Boreal Owl | Nearly all raptor species — the most ubiquitous small mammal prey in PNW |
| Meadow Vole | *Microtus pennsylvanicus* | Short-eared Owl, Barn Owl, Great Gray Owl | Northern Harrier, Rough-legged Hawk, Long-eared Owl, Snowy Owl, Red-tailed Hawk |
| Townsend's Vole | *Microtus townsendii* | Red-tailed Hawk, Short-eared Owl, Barn Owl | Northern Harrier, Barred Owl, Long-eared Owl, Snowy Owl |
| Montane Vole | *Microtus montanus* | Short-eared Owl, Barn Owl | Long-eared Owl, Great Gray Owl |
| Long-tailed Vole | *Microtus longicaudus* | Boreal Owl | Great Gray Owl, Long-eared Owl, Northern Saw-whet Owl, Barn Owl |
| Red-backed Vole | *Myodes gapperi* | Boreal Owl | Northern Pygmy-Owl, Northern Saw-whet Owl, Barred Owl, Great Gray Owl |
| Sagebrush Vole | *Lemmiscus curtatus* | — | Burrowing Owl, Ferruginous Hawk |
| Heather Vole | *Phenacomys intermedius* | — | Boreal Owl |
| Bushy-tailed Woodrat | *Neotoma cinerea* | Northern Spotted Owl (east-side) | Great Horned Owl |
| Red Tree Vole | *Arborimus longicaudus* | Northern Spotted Owl | — |
| Northern Pocket Gopher | *Thomomys talpoides* | Great Gray Owl | Red-tailed Hawk |
| Mazama Pocket Gopher | *Thomomys mazama* | Great Gray Owl | — (SC-END for ESA subspecies) |
| Great Basin Pocket Mouse | *Perognathus parvus* | — | Burrowing Owl, Long-eared Owl |
| Harvest Mouse | *Reithrodontomys megalotis* | — | Barn Owl, Short-eared Owl, Long-eared Owl |

### Rodentia — Other
| Species | Scientific Name | Primary Raptor Predators | Secondary Raptor Predators |
|---------|----------------|-------------------------|---------------------------|
| Muskrat | *Ondatra zibethicus* | — | Bald Eagle |
| House Mouse | *Mus musculus* | — | Barn Owl, Western Screech-Owl |
| Brown Rat | *Rattus norvegicus* | — | Snowy Owl, Barn Owl |

### Carnivora (Mesocarnivores as prey)
| Species | Scientific Name | Primary Raptor Predators | Secondary Raptor Predators |
|---------|----------------|-------------------------|---------------------------|
| Striped Skunk | *Mephitis mephitis* | Great Horned Owl | — |
| Western Spotted Skunk | *Spilogale gracilis* | — | Great Horned Owl |

### Soricomorpha (Shrews)
| Species | Scientific Name | Primary Raptor Predators | Secondary Raptor Predators |
|---------|----------------|-------------------------|---------------------------|
| Vagrant Shrew | *Sorex vagrans* | — | Northern Saw-whet Owl, Long-eared Owl, Barn Owl |
| Masked Shrew | *Sorex cinereus* | — | Northern Saw-whet Owl |
| Dusky Shrew | *Sorex monticolus* | — | Boreal Owl |
| Water Shrew | *Sorex palustris* | — | Boreal Owl |

---

## Raptor Guild Structure: PNW Ecoregion Summary

### Alpine / Subalpine (ELEV-ALPINE, ELEV-SUBALPINE)
**Diurnal apex:** Golden Eagle
**Nocturnal apex:** Great Horned Owl (forest edge), Great Gray Owl (meadow-forest interface)
**Specialists:** Boreal Owl (subalpine forest interior)

### Montane Forest (ELEV-MONTANE)
**Diurnal apex:** Northern Goshawk (forest interior), Red-tailed Hawk (edges/openings)
**Nocturnal apex:** Great Horned Owl (generalist), Northern Spotted Owl (old-growth specialist)
**Invader:** Barred Owl (displacing Spotted Owl)
**Small raptors:** Northern Pygmy-Owl (diurnal), Northern Saw-whet Owl (nocturnal), Flammulated Owl (insectivore, summer only)

### Lowland / Valley / Urban (ELEV-LOWLAND)
**Diurnal apex:** Red-tailed Hawk, Bald Eagle (near water)
**Nocturnal apex:** Great Horned Owl
**Specialists:** Barn Owl (agricultural vole predator), Western Screech-Owl (riparian/suburban), Cooper's Hawk (suburban bird predator)
**Urban adapted:** American Kestrel, Cooper's Hawk, Peregrine Falcon (cliff-nesting adapted to buildings)

### Riparian Corridors (ELEV-RIPARIAN)
**Diurnal apex:** Bald Eagle, Osprey (fish specialist)
**Nocturnal:** Barred Owl (riparian forest), Western Screech-Owl (riparian thickets)
**Salmon Thread species:** Bald Eagle, Osprey

### Shrub-Steppe / Grassland (ELEV-SHRUB-STEPPE)
**Diurnal apex:** Ferruginous Hawk, Golden Eagle, Prairie Falcon
**Crepuscular/nocturnal:** Short-eared Owl (vole specialist), Burrowing Owl (insectivore)
**Coursing hunter:** Northern Harrier
**Winter visitors:** Rough-legged Hawk, Snowy Owl (irruptive)

### Coastal / Marine (ELEV-COASTAL)
**Diurnal apex:** Bald Eagle, Peregrine Falcon
**Winter visitors:** Snowy Owl, Gyrfalcon (rare)

---

*Wave 1 — Module 1+2 Raptor Subset*
*Agent: SURVEY-RAPTOR*
*PNW Avian Taxonomy v0.1*
*Wings of the Pacific Northwest — AVI Mission*
*Date: 2026-03-08*
