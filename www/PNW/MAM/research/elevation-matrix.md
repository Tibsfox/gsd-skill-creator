# PNW Mammalian Taxonomy -- Elevation-Species Matrix

> **Foundation data structure for mapping mammal species distributions across PNW ecoregion bands**
>
> This matrix maps ~170 PNW mammal species against 11 ecoregion bands using a standardized presence vocabulary. Initial population covers the most well-documented species based on mission pack research reference data. Full population occurs during Waves 1-3 as species profiles are produced.
>
> **Upstream dependencies:**
> - ECO shared-attributes: 8 canonical elevation bands (ELEV-ALPINE through ELEV-DEEP-MARINE)
> - MAM mission pack: 3 additional mammal-relevant zones (Steppe, Subterranean, Coastal-Dune)
> - MAM shared-schema: species taxonomy, habitat types, size classes
> - MAM source-index: all data citations

---

## 1. Ecoregion Band Definitions

### Canonical ECO Bands (8)

These bands are defined in `www/PNW/ECO/research/shared-attributes.md` and used across all PNW taxonomy modules.

| Column ID | Band Name | Elevation (ft) | Minecraft Y |
|-----------|-----------|----------------|-------------|
| ELEV-ALPINE | Arctic-Alpine | 9,500-14,410 | y=196-319 |
| ELEV-SUBALPINE | Subalpine | 5,000-9,500 | y=84-196 |
| ELEV-MONTANE | Montane | 3,000-5,000 | y=34-84 |
| ELEV-LOWLAND | Lowland Forest | 500-3,000 | y=-29-34 |
| ELEV-RIPARIAN | Riparian/Estuary | 0-500 | y=-41--29 |
| ELEV-INTERTIDAL | Intertidal | -15-0 | y=-41 |
| ELEV-SHALLOW-MARINE | Shallow Marine | -200--15 | y=-46--41 |
| ELEV-DEEP-MARINE | Deep Marine | -930--200 | y=-64--46 |

### MAM-Extended Bands (3)

These bands are extensions specific to the Mammalian Taxonomy, capturing habitat dimensions that cross-cut elevation but are critical for mammal distribution.

| Column ID | Band Name | Description | Minecraft Y |
|-----------|-----------|-------------|-------------|
| ELEV-STEPPE | East-Side Steppe/Shrubland | Columbia Plateau, Great Basin fringe, Malheur Basin. Arid shrub-steppe and grassland east of the Cascade crest, 500-4,000 ft. Overlaps ELEV-LOWLAND and ELEV-MONTANE in elevation but differs in precipitation (<15 in/yr), vegetation (sagebrush, bunchgrass), and soil type (aridisols). | y=-29-34 (same as LOWLAND; differentiated by biome) |
| ELEV-SUBTERRANEAN | Subterranean/Fossorial | Lava tubes, caves, mine adits, extensive burrow systems. Depth below surface rather than elevation above sea level. Critical for bats (roosting, hibernacula), mountain beaver (burrow systems), pocket gophers, and fossorial invertebrates. | N/A (subsurface) |
| ELEV-COASTAL-DUNE | Coastal Dune/Beach | Outer coast sandy beaches, dune systems, coastal headlands. Overlaps ELEV-INTERTIDAL and ELEV-RIPARIAN but captures the terrestrial coastal margin habitat used by pinnipeds (hauling out), river otters, and shore-associated mammals. 0-100 ft. | y=-41 (same as INTERTIDAL; differentiated by substrate) |

---

## 2. Presence Vocabulary

| Code | Meaning | Definition |
|------|---------|-----------|
| **P** | Primary habitat | Species regularly occurs and breeds in this ecoregion band; core habitat |
| **S** | Secondary/seasonal | Species uses this band seasonally, for dispersal, or as marginal habitat; not primary breeding zone |
| **V** | Vagrant/occasional | Species has been documented but does not regularly occur; represents range edge, dispersal event, or rare occurrence |
| **X** | Absent | Species does not occur in this ecoregion band; outside known range or ecological tolerance |
| **M** | Migratory passage | Species passes through during seasonal migration but does not breed or overwinter (primarily marine mammals and bats) |
| **H** | Historical only | Species historically present but now extirpated from this band in the PNW; recovery may be possible |
| **?** | Data deficient | Insufficient data to assign presence status; monitoring needed |

---

## 3. Elevation-Species Matrix

### Order Carnivora

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|
| *Ursus americanus* | Black Bear | V | P | P | P | P | X | X | X | S | X | S |
| *Ursus arctos horribilis* | Grizzly Bear | S | P | P | S | S | X | X | X | X | X | X |
| *Canis lupus* | Gray Wolf | S | S | P | S | S | X | X | X | S | X | X |
| *Canis latrans* | Coyote | V | S | P | P | P | X | X | X | P | X | S |
| *Puma concolor* | Cougar | S | P | P | P | S | X | X | X | S | X | X |
| *Lynx canadensis* | Canada Lynx | X | P | P | S | X | X | X | X | X | X | X |
| *Lynx rufus* | Bobcat | X | S | P | P | S | X | X | X | P | X | S |
| *Vulpes vulpes cascadensis* | Cascade Red Fox | P | P | S | X | X | X | X | X | X | X | X |
| *Vulpes vulpes* | Red Fox (lowland) | X | X | S | P | P | X | X | X | P | X | S |
| *Urocyon cinereoargenteus* | Gray Fox | X | X | S | P | S | X | X | X | S | X | X |
| *Gulo gulo* | Wolverine | P | P | S | X | X | X | X | X | X | X | X |
| *Martes americana* | American Marten | S | P | P | S | X | X | X | X | X | X | X |
| *Pekania pennanti* | Fisher | X | S | P | P | S | X | X | X | X | X | X |
| *Neogale vison* | American Mink | X | X | S | P | P | X | X | X | S | X | P |
| *Mustela erminea* | Short-tailed Weasel (Ermine) | S | P | P | P | S | X | X | X | S | X | X |
| *Neogale frenata* | Long-tailed Weasel | S | P | P | P | P | X | X | X | P | X | X |
| *Taxidea taxus* | American Badger | X | X | S | S | S | X | X | X | P | P | X |
| *Spilogale gracilis* | Western Spotted Skunk | X | X | S | P | S | X | X | X | S | X | X |
| *Mephitis mephitis* | Striped Skunk | X | X | S | P | P | X | X | X | P | X | S |
| *Lontra canadensis* | North American River Otter | X | X | S | P | P | S | S | X | S | X | P |
| *Procyon lotor* | Raccoon | X | X | S | P | P | X | X | X | S | X | S |
| *Bassariscus astutus* | Ringtail | X | X | S | S | S | X | X | X | S | X | X |
| *Enhydra lutris* | Sea Otter | X | X | X | X | X | S | P | X | X | X | S |
| *Orcinus orca (resident)* | Orca (Resident ecotype) | X | X | X | X | X | X | P | P | X | X | X |
| *Orcinus orca (Bigg's)* | Orca (Bigg's ecotype) | X | X | X | X | X | X | P | P | X | X | X |

### Order Artiodactyla (Ungulates)

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|
| *Oreamnos americanus* | Mountain Goat | P | P | S | X | X | X | X | X | X | X | X |
| *Cervus canadensis roosevelti* | Roosevelt Elk | X | S | P | P | P | X | X | X | X | X | S |
| *Cervus canadensis nelsoni* | Rocky Mountain Elk | X | S | P | P | S | X | X | X | S | X | X |
| *Odocoileus hemionus columbianus* | Columbian Black-tailed Deer | X | S | P | P | P | X | X | X | X | X | S |
| *Odocoileus hemionus hemionus* | Mule Deer | X | S | P | P | S | X | X | X | P | X | X |
| *Odocoileus virginianus leucurus* | Columbian White-tailed Deer | X | X | X | S | P | X | X | X | X | X | X |
| *Rangifer tarandus caribou* | Woodland Caribou | X | H | H | X | X | X | X | X | X | X | X |
| *Alces americanus* | Moose | X | S | P | S | S | X | X | X | X | X | X |
| *Antilocapra americana* | Pronghorn | X | X | X | X | X | X | X | X | H | X | X |

### Order Rodentia

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|
| *Aplodontia rufa* | Mountain Beaver | X | S | P | P | S | X | X | X | X | P | X |
| *Castor canadensis* | North American Beaver | X | X | S | P | P | X | X | X | S | X | X |
| *Tamiasciurus douglasii* | Douglas Squirrel | X | S | P | P | S | X | X | X | X | X | X |
| *Tamiasciurus hudsonicus* | Red Squirrel | X | P | P | S | X | X | X | X | X | X | X |
| *Sciurus griseus* | Western Gray Squirrel | X | X | X | P | S | X | X | X | X | X | X |
| *Glaucomys sabrinus* | Northern Flying Squirrel | X | S | P | P | X | X | X | X | X | X | X |
| *Glaucomys oregonensis* | Humboldt's Flying Squirrel | X | X | S | P | S | X | X | X | X | X | X |
| *Marmota olympus* | Olympic Marmot | P | P | X | X | X | X | X | X | X | X | X |
| *Marmota caligata* | Hoary Marmot | P | P | S | X | X | X | X | X | X | X | X |
| *Marmota flaviventris* | Yellow-bellied Marmot | S | P | S | X | X | X | X | X | S | X | X |
| *Callospermophilus saturatus* | Cascade Golden-mantled Ground Squirrel | S | P | P | X | X | X | X | X | X | X | X |
| *Callospermophilus lateralis* | Golden-mantled Ground Squirrel | X | P | P | S | X | X | X | X | S | X | X |
| *Urocitellus washingtoni* | Washington Ground Squirrel | X | X | X | X | X | X | X | X | P | P | X |
| *Urocitellus columbianus* | Columbian Ground Squirrel | X | P | P | S | X | X | X | X | S | X | X |
| *Urocitellus beldingi* | Belding's Ground Squirrel | X | P | P | X | X | X | X | X | P | X | X |
| *Otospermophilus beecheyi* | California Ground Squirrel | X | X | X | P | S | X | X | X | S | P | X |
| *Neotamias townsendii* | Townsend's Chipmunk | X | S | P | P | S | X | X | X | X | X | X |
| *Neotamias amoenus* | Yellow-pine Chipmunk | X | P | P | S | X | X | X | X | S | X | X |
| *Neotamias minimus* | Least Chipmunk | S | P | S | X | X | X | X | X | P | X | X |
| *Thomomys talpoides* | Northern Pocket Gopher | S | P | P | S | X | X | X | X | S | P | X |
| *Thomomys mazama* | Western Pocket Gopher | X | X | S | P | S | X | X | X | X | P | X |
| *Thomomys bottae* | Botta's Pocket Gopher | X | X | S | P | S | X | X | X | P | P | X |
| *Perognathus parvus* | Great Basin Pocket Mouse | X | X | X | S | X | X | X | X | P | X | X |
| *Dipodomys ordii* | Ord's Kangaroo Rat | X | X | X | X | X | X | X | X | P | P | X |
| *Arborimus longicaudus* | Red Tree Vole | X | X | S | P | X | X | X | X | X | X | X |
| *Arborimus albipes* | White-footed Vole | X | X | S | P | P | X | X | X | X | X | X |
| *Myodes californicus* | California Red-backed Vole | X | S | P | P | S | X | X | X | X | X | X |
| *Myodes gapperi* | Southern Red-backed Vole | X | P | P | S | X | X | X | X | X | X | X |
| *Microtus townsendii* | Townsend's Vole | X | X | X | P | P | X | X | X | X | X | S |
| *Microtus longicaudus* | Long-tailed Vole | S | P | P | S | S | X | X | X | S | X | X |
| *Microtus oregoni* | Creeping Vole | X | X | P | P | S | X | X | X | X | X | X |
| *Microtus richardsoni* | Water Vole | X | P | P | X | X | X | X | X | X | X | X |
| *Microtus montanus* | Montane Vole | X | P | P | S | S | X | X | X | P | X | X |
| *Ondatra zibethicus* | Muskrat | X | X | S | P | P | X | X | X | S | X | S |
| *Erethizon dorsatum* | North American Porcupine | X | S | P | P | S | X | X | X | S | X | X |
| *Peromyscus maniculatus* | Deer Mouse | S | P | P | P | P | X | X | X | P | S | S |
| *Peromyscus keeni* | Keen's Mouse | X | X | S | P | P | X | X | X | X | X | S |
| *Neotoma cinerea* | Bushy-tailed Woodrat | S | P | P | S | X | X | X | X | S | S | X |
| *Neotoma fuscipes* | Dusky-footed Woodrat | X | X | S | P | S | X | X | X | X | X | X |
| *Rattus norvegicus* | Brown Rat (introduced) | X | X | X | P | P | X | X | X | S | X | S |
| *Mus musculus* | House Mouse (introduced) | X | X | X | P | P | X | X | X | P | X | S |

### Order Lagomorpha

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|
| *Ochotona princeps* | American Pika | P | S | X | X | X | X | X | X | X | X | X |
| *Sylvilagus bachmani* | Brush Rabbit | X | X | X | P | S | X | X | X | X | X | X |
| *Sylvilagus nuttallii* | Mountain Cottontail | X | S | P | S | X | X | X | X | P | X | X |
| *Sylvilagus floridanus* | Eastern Cottontail (introduced) | X | X | X | P | P | X | X | X | S | X | X |
| *Lepus americanus* | Snowshoe Hare | X | P | P | P | S | X | X | X | X | X | X |
| *Lepus townsendii* | White-tailed Jackrabbit | X | X | S | S | X | X | X | X | P | X | X |
| *Lepus californicus* | Black-tailed Jackrabbit | X | X | X | S | X | X | X | X | P | X | X |
| *Brachylagus idahoensis* | Pygmy Rabbit | X | X | X | X | X | X | X | X | P | P | X |

### Order Chiroptera (Bats)

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST | WNS |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|-----|
| *Myotis lucifugus* | Little Brown Bat | X | S | P | P | P | X | X | X | S | P | S | not-detected |
| *Myotis yumanensis* | Yuma Myotis | X | X | S | P | P | X | X | X | S | P | S | not-detected |
| *Myotis evotis* | Long-eared Myotis | X | S | P | P | S | X | X | X | S | P | X | not-detected |
| *Myotis thysanodes* | Fringed Myotis | X | X | S | P | S | X | X | X | S | P | X | not-detected |
| *Myotis volans* | Long-legged Myotis | X | P | P | S | X | X | X | X | S | P | X | not-detected |
| *Myotis californicus* | California Myotis | X | X | S | P | S | X | X | X | P | S | S | not-detected |
| *Myotis ciliolabrum* | Western Small-footed Myotis | X | X | S | S | S | X | X | X | P | P | X | not-detected |
| *Myotis keenii* | Keen's Myotis | X | X | S | P | S | X | X | X | X | S | S | ? |
| *Corynorhinus townsendii* | Townsend's Big-eared Bat | X | S | S | P | S | X | X | X | S | P | X | not-detected |
| *Antrozous pallidus* | Pallid Bat | X | X | X | S | S | X | X | X | P | P | X | not-detected |
| *Eptesicus fuscus* | Big Brown Bat | X | S | P | P | P | X | X | X | P | P | S | not-detected |
| *Lasiurus cinereus* | Hoary Bat | X | S | P | P | S | X | X | X | S | X | S | not-susceptible |
| *Lasiurus blossevillii* | Western Red Bat | X | X | X | P | P | X | X | X | X | X | X | not-susceptible |
| *Lasionycteris noctivagans* | Silver-haired Bat | X | S | P | P | P | X | X | X | S | S | S | not-detected |
| *Parastrellus hesperus* | Canyon Bat | X | X | X | S | S | X | X | X | P | P | X | ? |

**WNS column key:** WNS = White-nose syndrome status in PNW populations. See shared-schema.md Section 10 for definitions. *Pseudogymnoascus destructans* first detected in WA 2016 (King County); no mass mortality events documented in PNW as of 2024-2025. Source: G21, G10.

### Order Soricomorpha (Shrews and Moles)

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|
| *Sorex vagrans* | Vagrant Shrew | S | P | P | P | P | X | X | X | S | X | X |
| *Sorex trowbridgii* | Trowbridge's Shrew | X | X | P | P | P | X | X | X | X | X | X |
| *Sorex monticolus* | Dusky Shrew | S | P | P | S | S | X | X | X | S | X | X |
| *Sorex palustris* | American Water Shrew | X | S | P | P | P | X | X | X | X | X | X |
| *Sorex bendirii* | Pacific Water Shrew | X | X | S | P | P | X | X | X | X | X | X |
| *Sorex merriami* | Merriam's Shrew | X | X | X | X | X | X | X | X | P | X | X |
| *Sorex preblei* | Preble's Shrew | X | X | X | X | X | X | X | X | P | X | X |
| *Neurotrichus gibbsii* | American Shrew-mole | X | X | S | P | P | X | X | X | X | P | X |
| *Scapanus townsendii* | Townsend's Mole | X | X | X | P | P | X | X | X | X | P | X |
| *Scapanus orarius* | Coast Mole | X | X | S | P | P | X | X | X | X | P | X |
| *Scapanus latimanus* | Broad-footed Mole | X | X | X | P | S | X | X | X | X | P | X |

### Order Didelphimorphia

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|
| *Didelphis virginiana* | Virginia Opossum (introduced) | X | X | X | P | P | X | X | X | X | X | S |

### Order Cetacea (Whales, Dolphins, Porpoises)

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|
| *Orcinus orca* (resident) | Southern Resident Killer Whale | X | X | X | X | X | X | P | P | X | X | X |
| *Orcinus orca* (Bigg's) | Bigg's (Transient) Killer Whale | X | X | X | X | X | X | P | P | X | X | X |
| *Megaptera novaeangliae* | Humpback Whale | X | X | X | X | X | X | P | S | X | X | X |
| *Eschrichtius robustus* | Gray Whale | X | X | X | X | X | X | P | S | X | X | X |
| *Balaenoptera musculus* | Blue Whale | X | X | X | X | X | X | S | P | X | X | X |
| *Balaenoptera physalus* | Fin Whale | X | X | X | X | X | X | S | P | X | X | X |
| *Balaenoptera borealis* | Sei Whale | X | X | X | X | X | X | V | S | X | X | X |
| *Balaenoptera acutorostrata* | Common Minke Whale | X | X | X | X | X | X | P | S | X | X | X |
| *Eubalaena japonica* | North Pacific Right Whale | X | X | X | X | X | X | V | V | X | X | X |
| *Phocoena phocoena* | Harbor Porpoise | X | X | X | X | X | X | P | S | X | X | X |
| *Phocoenoides dalli* | Dall's Porpoise | X | X | X | X | X | X | P | S | X | X | X |
| *Lagenorhynchus obliquidens* | Pacific White-sided Dolphin | X | X | X | X | X | X | P | S | X | X | X |
| *Delphinus delphis* | Common Dolphin | X | X | X | X | X | X | S | S | X | X | X |
| *Lissodelphis borealis* | Northern Right Whale Dolphin | X | X | X | X | X | X | S | S | X | X | X |
| *Physeter macrocephalus* | Sperm Whale | X | X | X | X | X | X | V | P | X | X | X |
| *Ziphius cavirostris* | Cuvier's Beaked Whale | X | X | X | X | X | X | V | P | X | X | X |
| *Mesoplodon stejnegeri* | Stejneger's Beaked Whale | X | X | X | X | X | X | V | S | X | X | X |
| *Kogia breviceps* | Pygmy Sperm Whale | X | X | X | X | X | X | V | S | X | X | X |

### Order Pinnipedia (Seals and Sea Lions)

| Species | Common Name | ALP | SUB | MON | LOW | RIP | INT | SHL | DEP | STP | SUB-T | CST |
|---------|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|-----|
| *Phoca vitulina* | Harbor Seal | X | X | X | X | S | S | P | S | X | X | P |
| *Zalophus californianus* | California Sea Lion | X | X | X | X | X | S | P | S | X | X | P |
| *Eumetopias jubatus* | Steller Sea Lion | X | X | X | X | X | S | P | S | X | X | P |
| *Mirounga angustirostris* | Northern Elephant Seal | X | X | X | X | X | X | P | P | X | X | P |
| *Callorhinus ursinus* | Northern Fur Seal | X | X | X | X | X | X | P | S | X | X | S |

### Order Carnivora -- Marine (Sea Otter, moved here for matrix clarity)

*Sea otter appears in the Carnivora section above.*

---

## 4. Summary Statistics

### Species by Order (PNW total, this matrix)

| Order | Species in Matrix | Estimated PNW Total | Coverage |
|-------|-------------------|---------------------|----------|
| Carnivora (terrestrial) | 24 | ~25 | 96% |
| Artiodactyla | 9 | ~9 | 100% |
| Rodentia | 42 | ~70 | 60% |
| Lagomorpha | 8 | ~8 | 100% |
| Chiroptera | 15 | ~15 | 100% |
| Soricomorpha | 11 | ~20 | 55% |
| Didelphimorphia | 1 | 1 | 100% |
| Cetacea | 18 | ~25 | 72% |
| Pinnipedia | 5 | ~6 | 83% |
| **Total** | **133** | **~179** | **74%** |

### Species Remaining for Wave 1-3 Population

The following groups need additional species during profile production:

- **Rodentia:** ~28 species remaining -- additional vole species (*Microtus* spp.), wood mice, harvest mice, kangaroo rats, additional pocket gophers
- **Soricomorpha:** ~9 species remaining -- additional *Sorex* species (bairdii, lyelli, etc.), *Scapanus* species
- **Cetacea:** ~7 species remaining -- additional beaked whales, rare/vagrant cetaceans
- **Pinnipedia:** ~1 species remaining -- Guadalupe fur seal (vagrant)

### Ecoregion Band Richness (from populated matrix)

| Band | Species with P or S | Richest Orders |
|------|---------------------|----------------|
| ELEV-ALPINE | 14 | Rodentia (7), Carnivora (5) |
| ELEV-SUBALPINE | 40 | Rodentia (17), Carnivora (8), Chiroptera (7) |
| ELEV-MONTANE | 59 | Rodentia (22), Carnivora (12), Chiroptera (11) |
| ELEV-LOWLAND | 74 | Rodentia (27), Carnivora (13), Chiroptera (12) |
| ELEV-RIPARIAN | 56 | Rodentia (18), Carnivora (11), Chiroptera (9), Soricomorpha (8) |
| ELEV-INTERTIDAL | 5 | Pinnipedia (3), Carnivora (1) |
| ELEV-SHALLOW-MARINE | 27 | Cetacea (17), Pinnipedia (5), Carnivora (2) |
| ELEV-DEEP-MARINE | 22 | Cetacea (17), Pinnipedia (4) |
| ELEV-STEPPE | 47 | Rodentia (19), Chiroptera (10), Carnivora (9), Lagomorpha (5) |
| ELEV-SUBTERRANEAN | 27 | Chiroptera (12), Rodentia (8), Soricomorpha (5) |
| ELEV-COASTAL-DUNE | 19 | Pinnipedia (4), Carnivora (5), Rodentia (4) |

**Observation:** The montane-to-lowland transition (ELEV-MONTANE and ELEV-LOWLAND) harbors the highest mammalian diversity, consistent with the mid-elevation diversity peak documented in PNW biogeography (Rickart 2001, P23). The steppe band is notably species-rich for its area, reflecting the distinct community of shrub-steppe specialists not found west of the Cascades.

---

## 5. Temporal Layer (Wave 2 Extension)

### Monthly Presence Vectors

During Wave 2 (Deep Analysis), migratory and seasonally active species will receive a 12-month presence vector indicating monthly activity status. This applies primarily to:

**Migratory marine mammals:**
- Gray whale: passage March-May (northbound), October-December (southbound); some year-round residents
- Humpback whale: present April-November; absent December-March (breeding grounds)
- Northern fur seal: passage/present October-June; absent July-September (breeding islands)
- California sea lion: males present September-May; females rarely reach PNW

**Hibernating/torpor species:**
- Bears (*Ursus* spp.): active April-November; denning December-March
- Marmots (*Marmota* spp.): active May-September; hibernating October-April
- Ground squirrels (*Urocitellus*, *Callospermophilus*): active March-September; hibernating October-February
- Bats (many species): active April-October; hibernating/migrating November-March

**Seasonal elevation migrants:**
- Elk: summer at ELEV-SUBALPINE/MONTANE; winter descent to ELEV-LOWLAND/RIPARIAN
- Mule deer: summer at ELEV-MONTANE/SUBALPINE; winter at ELEV-LOWLAND/STEPPE
- Mountain goat: generally resident but may descend during extreme winter

### Monthly Vector Format

```
Species: Humpback Whale (*Megaptera novaeangliae*)
Band: ELEV-SHALLOW-MARINE
  J   F   M   A   M   J   J   A   S   O   N   D
  X   X   S   P   P   P   P   P   P   P   S   X

Species: Black Bear (*Ursus americanus*)
Band: ELEV-MONTANE
  J   F   M   A   M   J   J   A   S   O   N   D
  X   X   X   S   P   P   P   P   P   S   X   X
  (denning Dec-Mar; active Apr-Nov; peak foraging Jul-Sep)
```

This temporal layer will be populated during Wave 2 as ecoregion community profiles are produced.

---

## 6. Pleistocene Ghost Matrix (Module 5 Reference)

Species that historically occupied PNW ecoregion bands but are now extinct. Included for Module 5 (Evolutionary Biology) context.

| Species | Common Name | Extinction (~yr BP) | ALP | SUB | MON | LOW | RIP | STP |
|---------|-------------|---------------------|-----|-----|-----|-----|-----|-----|
| *Mammuthus columbi* | Columbian Mammoth | 11,000 | X | X | X | H | H | H |
| *Mammut americanum* | American Mastodon | 11,000 | X | X | H | H | H | X |
| *Megalonyx jeffersonii* | Jefferson's Ground Sloth | 11,000 | X | X | H | H | H | X |
| *Smilodon fatalis* | Saber-toothed Cat | 11,000 | X | X | H | H | H | H |
| *Aenocyon dirus* | Dire Wolf | 12,000 | X | X | H | H | H | H |
| *Arctodus simus* | Giant Short-faced Bear | 11,000 | X | S? | H | H | H | H |
| *Bison antiquus* | Ancient Bison | 10,000 | X | X | H | H | H | H |
| *Camelops hesternus* | Yesterday's Camel | 11,000 | X | X | X | H | H | H |
| *Equus* sp. | American Horse | 10,000 | X | X | H | H | H | H |
| *Bootherium bombifrons* | Woodland Muskox | 11,000 | X | X | H | H | X | X |

**Notes:**
- "H" = Historical presence based on fossil record; species now globally extinct.
- "S?" = Uncertain; limited fossil evidence for this band.
- All dates approximate; extinction timing varies by region and is subject to ongoing research.
- PNW fossil sites: Sequim (Manis mastodon site, WA), Tualatin (mammoth, OR), Paisley Caves (OR), Woodburn (OR), East Wenatchee (WA Clovis cache).
- Sources: P14 (Grayson 2016), P15 (Barnosky et al. 2004), O04 (Burke Museum collections).

---

## 7. Matrix Maintenance Protocol

### During Wave 1 (Species Profile Production)

As each species profile is completed during Wave 1 tracks (A: Carnivores+Ungulates, B: Small Mammals+Bats, C: Marine Mammals):

1. Verify or update the species' row in this matrix based on profile data.
2. Add any new species not yet in the matrix.
3. Flag any disagreements between profile data and matrix assignments for reconciliation.

### During Wave 2 (Ecoregion Community Analysis)

1. Verify matrix consistency within each ecoregion band community profile.
2. Populate monthly presence vectors for seasonal/migratory species.
3. Resolve any cross-profile conflicts in band assignments.

### During Wave 4 (Verification)

1. Final reconciliation pass: every species profile's elevation data must match its matrix row.
2. No species profile should reference an ecoregion band where its matrix value is X.
3. Richness counts updated to final values.

---

*Wave 0 -- Foundation: Elevation-Species Matrix*
*PNW Mammalian Taxonomy ("Fur, Fin & Fang")*
