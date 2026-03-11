# Fauna Survey: Animal Biodiversity of the Pacific Northwest Temperate Rainforest

> **Survey module for PNW Rainforest Biodiversity research (v1.49.22)**
>
> This document uses shared definitions from [00-shared-schemas.md](./00-shared-schemas.md) including the species template, relationship schema, and source index.
> All species entries follow the universal template with fauna-specific extension fields (diet_type, migratory_status, breeding_habitat, anomalous_elevation).

---

## Introduction

The Pacific Northwest temperate rainforest supports one of North America's most diverse and ecologically interconnected animal communities. From the fog-draped valleys of the Olympic Peninsula to the basalt cliffs of the Columbia River Gorge, the region's fauna have evolved in tight association with old-growth forest structure, salmon-bearing watersheds, and dramatic elevation gradients spanning sea level to alpine zones above 2,400 meters. Over 300 bird species, 80+ mammal species, and dozens of amphibians, reptiles, and fish inhabit the four study zones, making this one of the most biologically productive temperate regions on Earth (PR-04, PR-01).

These animals are not isolated taxonomic entries. They are nodes in ecological networks whose connections define ecosystem function. Black bears ferry marine-derived nitrogen from salmon streams into the forest interior, fertilizing trees and fungi kilometers from any watercourse. Northern spotted owls depend on northern flying squirrels, which in turn depend on ectomycorrhizal truffles connected to Douglas fir root networks. American dippers forage on aquatic invertebrates whose abundance signals stream health. Remove any node and the network degrades. This interdependence is why biodiversity loss cascades through the system rather than remaining contained.

The four study zones each support distinct fauna communities shaped by geography, climate, and vegetation structure. The Olympic Peninsula harbors Roosevelt elk herds and endemic subspecies found nowhere else. The Cascade western slopes provide elevation gradients from lowland old-growth to subalpine meadows. The Columbia River Gorge creates a unique transition zone where coastal and interior species overlap. The Oregon Coast Range maintains continuous forest cover supporting wide-ranging carnivores and old-growth dependent birds. This survey documents fauna across all four zones, mapping not just species presence but the ecological relationships that bind them into a functioning whole.

---

## Mammals

The mammal community of the PNW temperate rainforest encompasses large carnivores, ungulates, small mammals, marine mammals, and bats. Organized below by ecological guild rather than strict taxonomy, each species is documented with the full shared species template fields including fauna-specific extensions. Ecological relationships are presented both within individual species entries and as formal relationship schema entries in the summary subsection.

### Large Carnivores and Omnivores

---

### Black Bear

| Field | Value |
|-------|-------|
| **Common name** | Black bear |
| **Scientific name** | *Ursus americanus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Carnivora > Ursidae > *Ursus* > *U. americanus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Coniferous and mixed forests from sea level to subalpine; concentrated along salmon-bearing streams during spawning season; uses dense understory for denning |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Dens in hollow logs, root cavities, or excavated hillside burrows in dense forest; cubs born in winter den |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01, PR-02 |
| **Data quality** | verified_agency |

Black bears are the primary terrestrial vector for marine-derived nutrients in the PNW forest ecosystem. Individual bears ferry an estimated 500-700 salmon per season from spawning streams into the surrounding forest (PR-02). Carcass remnants and bear scat deposit marine-origin nitrogen (N-15) and phosphorus across the forest floor, where isotopic analysis has confirmed that 40-80% of riparian nitrogen originates from the ocean via this pathway (PR-02). This predator-prey relationship with Pacific salmon is one of the most consequential ecological links in the entire study area, forming the terrestrial leg of the Salmon-Forest Nutrient Cascade (CASCADE-01 in 00-shared-schemas.md).

---

### Cougar

| Field | Value |
|-------|-------|
| **Common name** | Cougar |
| **Scientific name** | *Puma concolor* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Carnivora > Felidae > *Puma* > *P. concolor* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Wide-ranging predator across all forested habitats; prefers rugged terrain with dense cover for ambush hunting; uses ridgelines and riparian corridors for travel |
| **Elevation range** | 0-2,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Secluded rocky outcrops, dense brush, or caves; females raise kittens alone in concealed den sites |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Apex predator in the PNW terrestrial food web. Primary prey is black-tailed deer, with occasional elk calves and small mammals. Cougar predation regulates ungulate populations and prevents overgrazing of understory vegetation, an indirect trophic cascade that benefits forest regeneration. Home ranges of 100-300 km2 require large contiguous forest tracts, making cougars sensitive indicators of habitat fragmentation (GOV-04).

---

### Coyote

| Field | Value |
|-------|-------|
| **Common name** | Coyote |
| **Scientific name** | *Canis latrans* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Carnivora > Canidae > *Canis* > *C. latrans* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Generalist occupying forest edges, meadows, riparian zones, and disturbed habitats; highly adaptable to forest fragmentation |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | increasing |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Denning in burrows, hollow logs, or rock crevices in mixed forest-meadow edge habitats |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Mesopredator that has expanded its range in the PNW as wolf populations declined. Preys on small mammals, rabbits, and occasionally scavenges salmon carcasses. Competition with bobcat for small mammal prey creates exploitative competition dynamics in areas of range overlap (GOV-01).

---

### Bobcat

| Field | Value |
|-------|-------|
| **Common name** | Bobcat |
| **Scientific name** | *Lynx rufus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Carnivora > Felidae > *Lynx* > *L. rufus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Dense forest with brushy understory; prefers rocky terrain for denning; uses edge habitats for hunting |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Rocky crevices, hollow logs, or dense thickets; females select sheltered den sites with multiple escape routes |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Solitary predator specializing in rabbits, hares, and small rodents. Plays an important role in controlling snowshoe hare and woodrat populations in forest habitats. Competes with coyotes where ranges overlap, with bobcats generally displaced from open habitats but dominant in dense forest (GOV-01).

---

### River Otter

| Field | Value |
|-------|-------|
| **Common name** | North American river otter |
| **Scientific name** | *Lontra canadensis* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Carnivora > Mustelidae > *Lontra* > *L. canadensis* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Rivers, streams, lakes, and coastal estuaries; requires clean water with abundant fish populations; uses bank dens, logjams, and beaver lodges |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Bank dens near water with underwater entrances; also uses abandoned beaver lodges and hollow logs adjacent to streams |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Critical aquatic-terrestrial link species. River otters prey on salmon, trout, crayfish, and aquatic invertebrates, transferring aquatic nutrients into the terrestrial zone through scat deposition along stream banks (cross-module relationship to aquatic module). Their presence indicates healthy stream ecosystems with adequate fish populations (GOV-04).

---

### American Marten

| Field | Value |
|-------|-------|
| **Common name** | American marten |
| **Scientific name** | *Martes americana* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Carnivora > Mustelidae > *Martes* > *M. americana* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, oregon_coast_range |
| **Habitat description** | Dense old-growth and mature coniferous forest with complex structure; requires large diameter snags and fallen logs for denning; sensitive to forest fragmentation |
| **Elevation range** | 300-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Cavity dens in large-diameter snags or hollow logs in late-successional forest |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Old-growth dependent mesocarnivore that preys on voles, squirrels, and small birds. Martens are highly sensitive to timber harvest because they require the complex physical structure of old-growth stands including large-diameter logs, snags, and interconnected canopy. Their declining trend reflects ongoing old-growth loss across the region (GOV-03).

---

### Ungulates

---

### Roosevelt Elk

| Field | Value |
|-------|-------|
| **Common name** | Roosevelt elk |
| **Scientific name** | *Cervus canadensis roosevelti* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Artiodactyla > Cervidae > *Cervus* > *C. canadensis roosevelti* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, oregon_coast_range |
| **Habitat description** | Old-growth and second-growth forests with open meadows and river valleys; seasonal movements between lowland winter range and subalpine summer meadows |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | regional_endemic |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | herbivore |
| **Migratory status** | partial |
| **Breeding habitat** | Open meadows and river flats adjacent to forest cover; bulls establish rutting territories in valley bottoms during autumn |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Flagship subspecies of the Olympic Peninsula and the largest-bodied elk in North America. Roosevelt elk herds in Olympic National Park number approximately 5,000 individuals across several distinct populations (GOV-04). Their herbivory relationship with understory vegetation shapes forest structure: heavy browsing in riparian corridors creates open gravel bars favoring salmon spawning habitat, while grazing in subalpine meadows maintains herbaceous diversity. This cross-module relationship links fauna to flora and indirectly to aquatic systems through riparian vegetation dynamics.

---

### Black-tailed Deer

| Field | Value |
|-------|-------|
| **Common name** | Black-tailed deer |
| **Scientific name** | *Odocoileus hemionus columbianus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Artiodactyla > Cervidae > *Odocoileus* > *O. hemionus columbianus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | All forested habitats from coastal lowlands to montane forests; prefers forest edges and early successional areas with browse; most abundant ungulate in the study region |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | herbivore |
| **Migratory status** | partial |
| **Breeding habitat** | Dense forest with shrub cover; fawns hidden in understory vegetation during first weeks of life |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The most abundant ungulate across all four study zones and the primary prey of cougar. Black-tailed deer browsing influences understory composition, particularly in areas where predator populations have been reduced. Their predator-prey relationship with cougar is a central dynamic in PNW forest trophic structure (GOV-01).

---

### Mountain Goat

| Field | Value |
|-------|-------|
| **Common name** | Mountain goat |
| **Scientific name** | *Oreamnos americanus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Artiodactyla > Bovidae > *Oreamnos* > *O. americanus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes |
| **Habitat description** | Alpine and subalpine zones above treeline; steep rocky cliffs, talus slopes, and alpine meadows; descends to lower elevations during severe winter storms |
| **Elevation range** | 1,200-2,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | herbivore |
| **Migratory status** | resident |
| **Breeding habitat** | Steep cliffs and rocky ledges above treeline; kids born on cliff shelves inaccessible to predators |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Alpine specialist restricted to the highest elevations in the study area. Mountain goats in Olympic National Park were historically introduced and have been the subject of management actions, though native populations exist in the Cascades. Their grazing in fragile alpine meadows can damage rare plant communities, creating a competition dynamic with endemic alpine flora (GOV-04).

---

### Small Mammals

---

### American Pika

| Field | Value |
|-------|-------|
| **Common name** | American pika |
| **Scientific name** | *Ochotona princeps* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Lagomorpha > Ochotonidae > *Ochotona* > *O. princeps* |
| **Zones present** | cascade_western_slopes, columbia_river_gorge |
| **Habitat description** | Talus slopes and rock fields in montane to alpine zones; requires cool microclimates beneath rocks; sensitive to high temperatures |
| **Elevation range** | 600-2,500 m |
| **Endemic status** | none |
| **Federal status** | species_of_concern |
| **State status (WA)** | none |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | herbivore |
| **Migratory status** | resident |
| **Breeding habitat** | Rock crevices in talus fields; creates hay piles of dried vegetation cached in rock interstices for winter forage |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Climate-sensitive alpine indicator species. Pikas have a narrow thermal tolerance and die from heat stress at temperatures as low as 25.5 degrees C with prolonged exposure (GOV-01). Populations at lower elevations in the Cascade range are disappearing as temperatures increase, though anomalous low-elevation populations in the Columbia River Gorge are documented separately in Plan 02 (FAUNA-04) with anomalous_elevation: true. In this survey, standard-elevation populations are documented with anomalous_elevation: false. Their herbivory on alpine plants and role as prey for weasels and raptors positions them as a key node in alpine food webs.

---

### Douglas Squirrel

| Field | Value |
|-------|-------|
| **Common name** | Douglas squirrel |
| **Scientific name** | *Tamiasciurus douglasii* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Rodentia > Sciuridae > *Tamiasciurus* > *T. douglasii* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Coniferous forest from lowland to montane; strongly associated with Douglas fir, Sitka spruce, and western hemlock; territorial and vocal |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | herbivore |
| **Migratory status** | resident |
| **Breeding habitat** | Cavities in large conifers or constructed dreys in tree canopy; middens of cone scales accumulate at base of territory trees |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

PNW endemic squirrel and a major conifer seed disperser. Douglas squirrels cache conifer seeds in middens, and unrecovered caches contribute to forest regeneration. Their cone-harvesting activity produces the characteristic "cone rain" heard in PNW old-growth forests. They are also an important prey item for northern goshawks and American martens (GOV-03).

---

### Northern Flying Squirrel

| Field | Value |
|-------|-------|
| **Common name** | Northern flying squirrel |
| **Scientific name** | *Glaucomys sabrinus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Rodentia > Sciuridae > *Glaucomys* > *G. sabrinus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Old-growth and mature coniferous forest with complex canopy structure; requires large-diameter snags for cavity nesting; strongly nocturnal |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Cavity nests in large-diameter snags and hollow trees; also uses woodpecker cavities and stick nests in dense canopy |
| **Anomalous elevation** | false |
| **Primary source** | GOV-05, PR-03 |
| **Data quality** | verified_agency |

Keystone species linking above-ground fauna to below-ground fungal networks. Northern flying squirrels are the primary dispersal agent for ectomycorrhizal (EMF) truffles, particularly *Rhizopogon* species that form the Common Mycorrhizal Network (CMN) connecting Douglas fir trees (PR-03, PR-05). When flying squirrels consume truffles, the fungal spores pass through their digestive tract and are deposited across the forest in fecal pellets, inoculating new root zones. This mutualistic relationship (symbiotic/mutualism) is a critical cross-module link between fauna and fungi. Flying squirrels are also the primary prey of the northern spotted owl, making them the obligate link between the mycorrhizal network and the old-growth indicator raptor guild (GOV-05).

---

### Townsend's Chipmunk

| Field | Value |
|-------|-------|
| **Common name** | Townsend's chipmunk |
| **Scientific name** | *Neotamias townsendii* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Rodentia > Sciuridae > *Neotamias* > *N. townsendii* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Dense coniferous and mixed forest with heavy shrub cover and downed logs; uses root tunnels and log cavities |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Underground burrows beneath logs and root systems; single litter of 3-5 young in spring |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

PNW endemic chipmunk found across all four study zones. Contributes to seed dispersal and serves as prey for raptors, weasels, and bobcats. Townsend's chipmunks also consume fungi and contribute to secondary truffle spore dispersal, supporting mycorrhizal network connectivity (GOV-01).

---

### Aplodontia (Mountain Beaver)

| Field | Value |
|-------|-------|
| **Common name** | Aplodontia (mountain beaver) |
| **Scientific name** | *Aplodontia rufa* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Rodentia > Aplodontiidae > *Aplodontia* > *A. rufa* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Moist slopes with deep soil near streams; creates extensive burrow systems in riparian areas; requires constant access to water due to primitive kidney function |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | herbivore |
| **Migratory status** | resident |
| **Breeding habitat** | Underground burrow systems near water; elaborate tunnel networks with separate nesting, feeding, and waste chambers |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The world's most primitive living rodent, a PNW endemic sometimes called a "living fossil." Aplodontia is the sole surviving member of family Aplodontiidae. Despite the common name "mountain beaver," it is not a beaver and not restricted to mountains. Its extensive burrowing activity aerates soil and creates habitat for other small animals, functioning as a small-scale ecosystem engineer. Their herbivory on sword fern, salal, and other understory plants influences plant community composition in riparian zones (GOV-01).

---

### Snowshoe Hare

| Field | Value |
|-------|-------|
| **Common name** | Snowshoe hare |
| **Scientific name** | *Lepus americanus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Lagomorpha > Leporidae > *Lepus* > *L. americanus* |
| **Zones present** | cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Dense coniferous and mixed forest with heavy shrub cover; prefers montane zones with winter snow cover for pelage camouflage |
| **Elevation range** | 300-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | herbivore |
| **Migratory status** | resident |
| **Breeding habitat** | Dense thickets of young conifers and shrubs; leverets born fully furred in shallow depressions under dense cover |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Important prey species supporting multiple predator populations including bobcat, coyote, and great horned owl. Snowshoe hares undergo population cycles that ripple through predator communities. Their browsing on young conifers and shrubs affects forest regeneration dynamics, particularly in early successional habitats following disturbance (GOV-01).

---

### Bushy-tailed Woodrat

| Field | Value |
|-------|-------|
| **Common name** | Bushy-tailed woodrat |
| **Scientific name** | *Neotoma cinerea* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Rodentia > Cricetidae > *Neotoma* > *N. cinerea* |
| **Zones present** | cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Rocky cliffs, talus slopes, old buildings, and caves; constructs elaborate stick-and-debris middens (pack rat nests) that can persist for thousands of years |
| **Elevation range** | 0-2,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | herbivore |
| **Migratory status** | resident |
| **Breeding habitat** | Rocky crevices and caves; middens built near den sites provide insulation and food cache storage |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Woodrat middens are paleontological resources preserving thousands of years of plant material, providing researchers with historical vegetation records. As herbivores and food cachers, bushy-tailed woodrats influence seed dynamics in talus environments and serve as prey for owls, weasels, and bobcats (GOV-01).

---

### Deer Mouse

| Field | Value |
|-------|-------|
| **Common name** | Deer mouse |
| **Scientific name** | *Peromyscus maniculatus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Rodentia > Cricetidae > *Peromyscus* > *P. maniculatus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Ubiquitous generalist in all forest types from coastal lowlands to subalpine; found in old-growth, second-growth, clearcuts, and meadows |
| **Elevation range** | 0-2,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Nests in hollow logs, under bark, in rock crevices, or underground burrows; highly reproductive with multiple litters per year |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The most abundant small mammal across all study zones and a foundational prey species supporting owls, hawks, weasels, foxes, and snakes. Deer mice also contribute to seed dispersal and secondary truffle spore dispersal. Their population density and reproductive rate make them a primary energy conduit from plant producers to mammalian and avian predators (GOV-01).

---

### Marine Mammals

---

### Harbor Seal

| Field | Value |
|-------|-------|
| **Common name** | Harbor seal |
| **Scientific name** | *Phoca vitulina* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Carnivora > Phocidae > *Phoca* > *P. vitulina* |
| **Zones present** | olympic_peninsula, oregon_coast_range |
| **Habitat description** | Coastal waters, estuaries, and lower reaches of large rivers; hauls out on rocky shorelines, sandbars, and log booms; forages at river mouths where salmon concentrate |
| **Elevation range** | 0 m (sea level) |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Rocky shorelines and protected sandy beaches; pups born in spring and can swim immediately |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Salmon predator at river mouths and estuaries, creating a marine-freshwater trophic link. Harbor seals congregate at the mouths of salmon-bearing rivers during spawning runs, where they intercept returning adults before they reach upstream spawning habitat. This predator-prey relationship is a cross-module connection between the marine and freshwater aquatic systems (GOV-04).

---

### Gray Whale

| Field | Value |
|-------|-------|
| **Common name** | Gray whale |
| **Scientific name** | *Eschrichtius robustus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Artiodactyla > Eschrichtiidae > *Eschrichtius* > *E. robustus* |
| **Zones present** | olympic_peninsula |
| **Habitat description** | Nearshore coastal waters; migrates between Arctic feeding grounds and Mexican breeding lagoons; summer residents feed on benthic invertebrates in shallow Olympic coast waters |
| **Elevation range** | 0 m (sea level) |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Warm lagoons of Baja California; calves born in shallow protected waters during winter months |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Coastal migrant visible from the Olympic Peninsula shoreline during spring and fall migration. A small population of approximately 200 "summer resident" gray whales remains along the Washington and Oregon coast year-round, feeding on benthic amphipods rather than migrating to Arctic waters (GOV-04). Their benthic feeding stirs up sediments and releases nutrients, connecting marine bottom substrates to the water column food web.

---

### Bats

---

### Silver-haired Bat

| Field | Value |
|-------|-------|
| **Common name** | Silver-haired bat |
| **Scientific name** | *Lasionycteris noctivagans* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Chiroptera > Vespertilionidae > *Lasionycteris* > *L. noctivagans* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Old-growth and mature coniferous forest; roosts under loose bark, in woodpecker cavities, and in large-diameter snags; forages over ponds, streams, and forest openings |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Maternity colonies in hollow trees and snags in old-growth forest; females raise pups in communal roosts |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Old-growth dependent bat species that requires large-diameter snags for roosting and maternity colonies. Silver-haired bats consume forest pest insects including moths, beetles, and flies, providing natural pest control services valued in forest management. Their dependence on old-growth snag habitat makes them sensitive to timber harvest (GOV-03).

---

### Big Brown Bat

| Field | Value |
|-------|-------|
| **Common name** | Big brown bat |
| **Scientific name** | *Eptesicus fuscus* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Chiroptera > Vespertilionidae > *Eptesicus* > *E. fuscus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Generalist habitat use across forests, edges, and developed areas; roosts in buildings, tree cavities, and rock crevices; forages in open areas and forest edges |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Maternity colonies in buildings, tree cavities, and rock crevices; largest PNW bat, robust enough for cold-weather activity |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The most common and adaptable bat species in the study region. Big brown bats consume large quantities of beetles, including forest pest species. They are more tolerant of habitat modification than other PNW bats and serve as a useful comparison species against old-growth dependent bats for assessing forest management impacts (GOV-01).

---

### Townsend's Big-eared Bat

| Field | Value |
|-------|-------|
| **Common name** | Townsend's big-eared bat |
| **Scientific name** | *Corynorhinus townsendii* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Chiroptera > Vespertilionidae > *Corynorhinus* > *C. townsendii* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Caves, mines, old buildings, and large hollow trees in forested areas; extremely sensitive to disturbance at roost sites; forages in forest understory and along edges |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | none |
| **Federal status** | species_of_concern |
| **State status (WA)** | candidate |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Maternity colonies in caves, mines, and large buildings; extremely sensitive to human disturbance during maternity season; colonies abandon roosts if disturbed |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01, CON-01 |
| **Data quality** | verified_agency |

Species of concern due to extreme sensitivity to roost site disturbance and declining availability of suitable caves and structures. Townsend's big-eared bats specialize in gleaning moths from vegetation, a foraging technique that requires the forest understory structure found in old-growth stands. Maternity colonies are critically vulnerable to human intrusion and will permanently abandon roosts after even a single disturbance event (GOV-01, CON-01).

---

### Mammal Ecological Relationships

The following formal relationship schema entries document the key ecological connections among mammal species and their cross-module links to other survey modules.

#### Black Bear - Pacific Salmon (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Black bear (*Ursus americanus*) |
| **Species B** | Pacific salmon (*Oncorhynchus* spp.) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Bears intercept spawning salmon and carry carcasses 50-100 m into the forest. An individual bear may consume 500-700 salmon per season. Partially consumed carcasses and bear scat deposit marine-derived nitrogen (N-15) and phosphorus into forest soil, where it enters tree roots and fungal networks. Isotopic analysis confirms 40-80% of riparian nitrogen is marine-origin in salmon-bearing watersheds. |
| **Cross-module** | true (links to aquatic module: salmon; flora module: riparian vegetation; fungi module: EMF uptake of deposited N) |
| **Source** | PR-02 |

#### Northern Flying Squirrel - EMF Truffles (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | symbiotic |
| **Subtype** | mutualism |
| **Species A** | Northern flying squirrel (*Glaucomys sabrinus*) |
| **Species B** | EMF truffles (*Rhizopogon* spp., *Gautieria* spp.) |
| **Directionality** | bidirectional |
| **Strength** | obligate |
| **Mechanism** | Flying squirrels are the primary dispersal agent for hypogeous (below-ground) EMF fungi. Truffles provide 80-90% of flying squirrel diet. Squirrels consume fruiting bodies and deposit viable spores in fecal pellets across the forest, inoculating new root zones for mycorrhizal colonization. Without squirrel dispersal, truffle species would be limited to passive spore spread over very short distances. |
| **Cross-module** | true (links to fungi module: EMF truffle ecology; flora module: CMN connectivity via *Rhizopogon*) |
| **Source** | GOV-05, PR-03 |

#### Roosevelt Elk - Understory Vegetation (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | herbivory |
| **Species A** | Roosevelt elk (*Cervus canadensis roosevelti*) |
| **Species B** | Understory vegetation (sword fern, vine maple, salmonberry) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Heavy elk browsing reduces shrub layer density in riparian corridors and forest understory. This creates open ground that facilitates conifer seedling establishment and maintains structural diversity. In riparian zones, elk browsing keeps vegetation low, maintaining open gravel bars that benefit salmon spawning habitat. Exclosure experiments show dramatic vegetation differences between browsed and unbrowsed areas. |
| **Cross-module** | true (links to flora module: understory plant communities; aquatic module: riparian zone structure affecting salmon habitat) |
| **Source** | GOV-04 |

#### River Otter - Salmon/Trout (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | River otter (*Lontra canadensis*) |
| **Species B** | Salmon and trout (*Oncorhynchus* spp., *Salmo* spp.) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | River otters prey on juvenile and adult salmonids in streams and rivers. Scat deposited along stream banks transfers aquatic-derived nutrients to terrestrial riparian zones. Otter latrines (communal scat sites) create localized nutrient hotspots enriching riparian vegetation. |
| **Cross-module** | true (links to aquatic module: salmonid populations; flora module: riparian nutrient enrichment) |
| **Source** | GOV-04 |

#### Cougar - Black-tailed Deer

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Cougar (*Puma concolor*) |
| **Species B** | Black-tailed deer (*Odocoileus hemionus columbianus*) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Cougar predation is the primary source of mortality for adult black-tailed deer. Predation pressure regulates deer populations and prevents overgrazing of understory vegetation, creating an indirect trophic cascade that benefits forest regeneration. Deer alter their habitat use and foraging behavior in response to cougar presence, creating a "landscape of fear" that distributes browsing pressure across the forest. |
| **Cross-module** | false |
| **Source** | GOV-04 |

---

## Birds

The PNW temperate rainforest supports over 300 bird species across resident, migratory, and partial migratory guilds. This section documents 200+ species organized by ecological guild, with detailed narrative profiles for the 35+ most ecologically significant species and summary tables for the remaining species grouped by family. Birds are critical nodes in the forest ecosystem network: old-growth dependent species like the northern spotted owl indicate forest health, raptors link terrestrial and aquatic food webs through salmon predation, and the sheer diversity of passerines drives insect population regulation, seed dispersal, and pollination across all four study zones.

### Old-growth Dependent Species

This flagship guild includes species whose populations are directly tied to the structural complexity of late-successional and old-growth forests. Their presence, absence, and population trends serve as primary indicators of forest ecosystem integrity. The two federally threatened species in this guild -- northern spotted owl and marbled murrelet -- are the most studied and contested species in PNW forest management history.

---

### Northern Spotted Owl

| Field | Value |
|-------|-------|
| **Common name** | Northern spotted owl |
| **Scientific name** | *Strix occidentalis caurina* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Strigiformes > Strigidae > *Strix* > *S. occidentalis caurina* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Old-growth and late-successional coniferous forest with multi-layered canopy; requires large contiguous stands of mature forest (typically >200 years old) with high canopy closure, large-diameter trees, snags, and downed logs providing complex vertical structure |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | threatened |
| **State status (WA)** | endangered |
| **State status (OR)** | threatened |
| **IUCN status** | NT |
| **Trend** | declining |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Nests in large tree cavities, broken-top snags, platforms of debris in old-growth canopy, or abandoned raptor nests; requires minimum 2,200-acre territory of contiguous old-growth forest; largest territories (up to 14,000 acres) found on the Olympic Peninsula where prey density is lower |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03, CON-01 |
| **Data quality** | verified_agency |

**Flagship endangered species profile:**

The northern spotted owl is the most intensely studied raptor in North America and the species whose decline catalyzed the Pacific Northwest timber wars of the 1980s and 1990s. Listed as federally threatened in 1990, the spotted owl requires large contiguous tracts of old-growth forest for nesting, roosting, and foraging (GOV-03). Individual territory sizes range from 2,200 acres in productive Oregon forests to 14,000 acres on the Olympic Peninsula, reflecting variation in prey density across the study area (GOV-03).

**Prey base:** The northern flying squirrel (*Glaucomys sabrinus*) is the obligate primary prey species, comprising 50-80% of spotted owl diet depending on location and season (GOV-03). This creates a direct dependency chain: spotted owl depends on flying squirrel, which depends on EMF truffles, which depend on old-growth tree root networks. Woodrats, voles, and other small mammals supplement the diet.

**Barred owl competition:** The invasive barred owl (*Strix varia*) has expanded westward from eastern North America into all four study zones since the 1970s. Barred owls are larger, more aggressive, more generalist in diet and habitat, and outcompete spotted owls through territorial displacement (interference competition). Spotted owl populations have declined 3.8% per year in Washington and 2.9% per year in Oregon, with barred owl invasion identified as the primary proximate cause (GOV-03, CON-01). Federal management actions now include experimental barred owl removal in select areas to assess spotted owl recovery potential.

**Conservation significance:** The spotted owl's decline reflects the cumulative loss of old-growth forest habitat across the PNW. As an apex predator with large territory requirements and obligate old-growth dependency, the species integrates habitat quality signals across landscape scales. Recovery depends on protecting remaining old-growth stands and managing the barred owl competitive threat.

---

### Marbled Murrelet

| Field | Value |
|-------|-------|
| **Common name** | Marbled murrelet |
| **Scientific name** | *Brachyramphus marmoratus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Charadriiformes > Alcidae > *Brachyramphus* > *B. marmoratus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, oregon_coast_range |
| **Habitat description** | Dual habitat: marine waters for foraging, old-growth forest canopy for nesting; feeds on small fish and invertebrates in nearshore ocean waters; nests on moss-covered branches of large old-growth conifers up to 80 km inland |
| **Elevation range** | 0-1,200 m (nesting); 0 m (foraging at sea) |
| **Endemic status** | none |
| **Federal status** | threatened |
| **State status (WA)** | threatened |
| **State status (OR)** | threatened |
| **IUCN status** | EN |
| **Trend** | declining |
| **Diet type** | carnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Nests on wide moss-covered branches of large-diameter old-growth conifers (Douglas fir, Sitka spruce, western hemlock); single egg laid directly on moss platform without constructing a nest; nesting sites typically 30-60 m above ground in trees >200 years old |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

**Flagship endangered species profile:**

The marbled murrelet is a seabird with one of the most unusual nesting strategies in the avian world. While it feeds at sea on small fish and zooplankton, it flies inland -- sometimes more than 80 km -- to nest on the moss-covered branches of old-growth conifers (GOV-04). Its nesting behavior was not confirmed until 1974, making it one of the last North American birds to have its nest discovered.

**Old-growth dependency:** Murrelets require the thick moss mats that develop only on the large horizontal branches of ancient conifers. A single egg is laid directly on the moss platform without any nest construction. The tree must be large enough (typically >80 cm DBH) to support the weight of the bird and egg on a stable horizontal branch, and the canopy must be open enough to allow the murrelet's awkward takeoff and landing. These conditions exist almost exclusively in old-growth and late-successional stands exceeding 200 years of age (GOV-04).

**Population decline:** Murrelet populations have declined significantly across their range, with an estimated 96% decline from historical levels in Washington, Oregon, and California combined (GOV-04). Primary threats include loss of old-growth nesting habitat, increased nest predation by corvids (jays and crows) attracted to forest edges created by logging, and at-sea mortality from oil spills, gill nets, and prey depletion. The species is listed as threatened under both the federal Endangered Species Act and Washington and Oregon state laws.

**Cross-module relationship:** The murrelet's dependence on old-growth canopy moss platforms creates a direct link between marine and forest ecosystems. This commensalism with old-growth trees connects the fauna and flora modules: murrelet survival depends on the persistence of ancient trees that are also critical for the CMN (Common Mycorrhizal Network) and spotted owl habitat.

---

### Pileated Woodpecker

| Field | Value |
|-------|-------|
| **Common name** | Pileated woodpecker |
| **Scientific name** | *Dryocopus pileatus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Piciformes > Picidae > *Dryocopus* > *D. pileatus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Mature and old-growth forest with large-diameter snags; requires standing dead trees of sufficient girth for excavating rectangular nest cavities; forages on carpenter ants in dead wood |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | candidate |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Excavates large rectangular cavities in dead or dying large-diameter trees; both sexes excavate; cavity entrance is characteristically rectangular rather than round |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

The largest woodpecker in the PNW and a primary ecosystem engineer. Pileated woodpecker cavities are subsequently used by dozens of other species that cannot excavate their own -- including northern flying squirrels, Vaux's swifts, various owls, American martens, and bats (GOV-03). A single pair's territory may contain 10-20 old cavities used by a rotating community of secondary cavity nesters. The species' dependence on large snags makes it an indicator of old-growth structural complexity.

---

### Vaux's Swift

| Field | Value |
|-------|-------|
| **Common name** | Vaux's swift |
| **Scientific name** | *Chaetura vauxi* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Apodiformes > Apodidae > *Chaetura* > *C. vauxi* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Aerial forager over forested landscapes; roosts and nests in hollow old-growth trees and large chimneys; highly social with spectacular communal roosting behavior during migration |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | candidate |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Nests inside hollow old-growth trees, attaching small twig nests to interior walls with saliva; historically dependent on large hollow conifers; now also uses large industrial chimneys as surrogate habitat |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Old-growth dependent aerial insectivore whose natural nesting habitat is the interior of large hollow trees. Loss of old-growth forest has reduced natural nest sites, though Vaux's swifts have partially adapted by using large chimneys. Fall migration staging roosts in chimneys (notably the Chapman Elementary School chimney in Portland, Oregon) can attract tens of thousands of birds, creating one of the region's most spectacular wildlife events (GOV-03).

---

### Brown Creeper

| Field | Value |
|-------|-------|
| **Common name** | Brown creeper |
| **Scientific name** | *Certhia americana* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Certhiidae > *Certhia* > *C. americana* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Mature and old-growth coniferous forest; forages by spiraling up tree trunks probing bark crevices for insects; requires deeply furrowed bark of large old conifers |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Nests behind loose bark slabs on large dead or dying trees; nest is a crescent-shaped cup of bark strips and spider silk wedged between bark and wood |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Old-growth bark specialist whose foraging strategy depends on the deeply furrowed bark of large-diameter conifers. Brown creepers are significantly more abundant in old-growth stands compared to younger forests, making them a reliable old-growth indicator species. They nest behind loose bark slabs on large snags, a microhabitat that exists almost exclusively in late-successional forests (GOV-03).

---

### Red-breasted Sapsucker

| Field | Value |
|-------|-------|
| **Common name** | Red-breasted sapsucker |
| **Scientific name** | *Sphyrapicus ruber* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Piciformes > Picidae > *Sphyrapicus* > *S. ruber* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Mixed and coniferous forest; drills sap wells in living trees (especially red alder, birch, and hemlock); sap wells attract insects which are also consumed |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | omnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Excavates nest cavities in snags or dead portions of living trees in coniferous and mixed forest |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Sapsucker sap wells create shared resources used by hummingbirds, warblers, and insects -- a form of ecosystem engineering. The orderly rows of drilled holes in tree bark provide a consistent sugar source throughout the breeding season, and rufous hummingbirds in particular time their spring arrival to coincide with sapsucker well activity (GOV-03).

---

### Varied Thrush

| Field | Value |
|-------|-------|
| **Common name** | Varied thrush |
| **Scientific name** | *Ixoreus naevius* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Turdidae > *Ixoreus* > *I. naevius* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Dense, moist coniferous forest with thick leaf litter; iconic voice of the old-growth forest -- a single ethereal whistled note on one pitch, described as the sonic signature of the PNW rainforest |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | omnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Nests in dense coniferous branches, typically on horizontal limbs close to the trunk in dark forest interior; nest of moss, twigs, and mud |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

The varied thrush's haunting single-note whistle is the defining sound of PNW old-growth forest. This species forages on the forest floor, turning leaf litter for invertebrates and consuming berries. It is strongly associated with closed-canopy forest and is less abundant in fragmented or second-growth stands. Partial migrant: lowland populations are largely resident while montane breeders descend to valleys in winter (GOV-04).

---

### Hermit Warbler

| Field | Value |
|-------|-------|
| **Common name** | Hermit warbler |
| **Scientific name** | *Setophaga occidentalis* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Parulidae > *Setophaga* > *S. occidentalis* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, oregon_coast_range |
| **Habitat description** | Canopy of mature and old-growth coniferous forest; forages in the upper canopy on insects gleaned from conifer needles; rarely descends below mid-canopy |
| **Elevation range** | 200-1,800 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Nests high in the canopy of large conifers; nest placed on horizontal branch, often near trunk, concealed by overhanging foliage |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

PNW breeding endemic warbler that is almost exclusively a canopy forager. Hermit warblers hybridize with Townsend's warblers where their ranges overlap, creating a narrow hybrid zone. The species is a neotropical migrant that winters in the cloud forests of Mexico and Central America, linking PNW old-growth canopy ecology to tropical forest conservation (GOV-03).

---

### Pacific-slope Flycatcher

| Field | Value |
|-------|-------|
| **Common name** | Pacific-slope flycatcher |
| **Scientific name** | *Empidonax difficilis* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Tyrannidae > *Empidonax* > *E. difficilis* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Shaded forest interiors, ravines, and stream canyons with dense canopy cover; often near water in cool, damp forest |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Nests on ledges, in crevices, or on mossy banks along forest streams; nest of moss, rootlets, and bark strips placed in sheltered overhangs |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Common neotropical migrant of shaded forest interiors. The Pacific-slope flycatcher was formerly lumped with the cordilleran flycatcher as "western flycatcher" and is one of the most abundant breeding birds in PNW old-growth. Its presence indicates intact riparian and ravine forest structure (GOV-03).

---

### Hutton's Vireo

| Field | Value |
|-------|-------|
| **Common name** | Hutton's vireo |
| **Scientific name** | *Vireo huttoni* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Vireonidae > *Vireo* > *V. huttoni* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Mixed and coniferous forest with dense understory; forages deliberately through mid-canopy gleaning insects from twigs and leaves |
| **Elevation range** | 0-1,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Hanging cup nest suspended from forked branch in dense shrub or small tree; nest of moss, bark, and spider silk |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

One of the few vireo species that is year-round resident in PNW forests. Hutton's vireo is associated with mature mixed forest and is a reliable indicator of forest with complex understory structure. Often found in mixed-species foraging flocks with chickadees and kinglets during the non-breeding season (GOV-03).

---

### Raptors

---

### Bald Eagle

| Field | Value |
|-------|-------|
| **Common name** | Bald eagle |
| **Scientific name** | *Haliaeetus leucocephalus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Accipitriformes > Accipitridae > *Haliaeetus* > *H. leucocephalus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Large trees near water; nests in the tallest available trees (old-growth conifers) within 1 km of rivers, lakes, or coast; forages on fish, especially salmon during spawning runs |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | sensitive |
| **State status (OR)** | threatened |
| **IUCN status** | LC |
| **Trend** | increasing |
| **Diet type** | carnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Massive stick nests (up to 3 m across) in the largest available trees, typically old-growth conifers near water; nest sites reused and expanded annually for decades |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04, CON-05 |
| **Data quality** | verified_agency |

Recovery success story. Bald eagles were delisted from the Endangered Species Act in 2007 following DDT ban and habitat protection. In the PNW, eagle populations have rebounded strongly, with concentrations along salmon-bearing rivers during spawning season (CON-05). A single eagle may consume 1-2 salmon per day during peak runs, and communal winter roosts along the Skagit and Nooksack rivers can hold 300+ eagles (GOV-04). The eagle-salmon predator-prey relationship is a major cross-module link between the bird and aquatic survey modules.

---

### Osprey

| Field | Value |
|-------|-------|
| **Common name** | Osprey |
| **Scientific name** | *Pandion haliaetus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Accipitriformes > Pandionidae > *Pandion* > *P. haliaetus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Open areas near clear water with visible fish; nests on large snags, utility poles, and artificial platforms near rivers and lakes |
| **Elevation range** | 0-1,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | increasing |
| **Diet type** | carnivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Large stick nests on snag tops, utility poles, or artificial platforms; prefers open nest sites near productive fishing waters |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Obligate fish-eater and highly visible indicator of aquatic ecosystem health. Osprey nest success correlates directly with fish abundance and water clarity. Along the Columbia River and its tributaries, osprey populations have recovered strongly following DDT-era declines. Their exclusive dependence on live fish creates a direct cross-module link to the aquatic survey (GOV-04).

---

### Red-tailed Hawk

| Field | Value |
|-------|-------|
| **Common name** | Red-tailed hawk |
| **Scientific name** | *Buteo jamaicensis* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Accipitriformes > Accipitridae > *Buteo* > *B. jamaicensis* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Forest edges, meadows, clearings, and open country adjacent to forested areas; hunts from perches along road edges and forest margins |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Large stick nests in tall trees at forest edge; prefers nest sites with good visibility over open hunting areas |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Most common large raptor in the study area. Red-tailed hawks occupy forest edge habitat and benefit from forest fragmentation, making them more abundant in logged areas than in contiguous old-growth. Primary prey includes voles, squirrels, rabbits, and snakes (GOV-01).

---

### Cooper's Hawk

| Field | Value |
|-------|-------|
| **Common name** | Cooper's hawk |
| **Scientific name** | *Accipiter cooperii* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Accipitriformes > Accipitridae > *Accipiter* > *A. cooperii* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Deciduous and mixed forest with open understory for high-speed pursuit hunting of small birds; uses forest interior and edges |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | increasing |
| **Diet type** | carnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Stick nests in dense tree canopy, typically in deciduous or mixed stands; concealed nest placement in mid-canopy fork |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Agile accipiter specialized in pursuing small birds through dense forest. Cooper's hawk populations have increased across North America as the species has adapted to fragmented forest and suburban habitats. In the PNW, they are important regulators of songbird populations (GOV-01).

---

### Sharp-shinned Hawk

| Field | Value |
|-------|-------|
| **Common name** | Sharp-shinned hawk |
| **Scientific name** | *Accipiter striatus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Accipitriformes > Accipitridae > *Accipiter* > *A. striatus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Dense coniferous and mixed forest; smallest accipiter in North America; hunts small birds by ambush in forest understory |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Concealed stick nest in dense conifer canopy; highly secretive at nest site |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Smallest forest accipiter and an important predator of small passerines. Sharp-shinned hawks are more dependent on dense forest than Cooper's hawks and may be negatively affected by forest fragmentation. They are common during fall migration through the Gorge, where strong east-west winds concentrate raptors along the ridgelines (GOV-01).

---

### Northern Goshawk

| Field | Value |
|-------|-------|
| **Common name** | Northern goshawk |
| **Scientific name** | *Accipiter gentilis* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Accipitriformes > Accipitridae > *Accipiter* > *A. gentilis* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, oregon_coast_range |
| **Habitat description** | Mature and old-growth coniferous forest with open understory allowing high-speed aerial pursuit; requires large territory of contiguous forest; sensitive to timber harvest |
| **Elevation range** | 200-2,000 m |
| **Endemic status** | none |
| **Federal status** | species_of_concern |
| **State status (WA)** | candidate |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Large stick nests in old-growth trees with clear flight paths to and from nest; requires mature forest with open understory for high-speed prey pursuit |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Old-growth dependent raptor that requires large contiguous forest stands for hunting. Northern goshawks are apex avian predators in interior forest habitats, preying on squirrels, woodpeckers, grouse, and other medium-sized birds and mammals. Their large territory requirements (2,000-6,000 acres) and sensitivity to forest fragmentation make them a management indicator species for old-growth habitat integrity (GOV-03).

---

### Great Horned Owl

| Field | Value |
|-------|-------|
| **Common name** | Great horned owl |
| **Scientific name** | *Bubo virginianus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Strigiformes > Strigidae > *Bubo* > *B. virginianus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Generalist across all forested and open habitats; uses forest edges, woodlands, and open country; nests in abandoned raptor or crow nests, tree cavities, and cliff ledges |
| **Elevation range** | 0-2,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Uses abandoned hawk, crow, or heron nests; also cliff ledges, tree cavities, and broken-top snags; earliest breeder among PNW raptors, nesting in January-February |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Most powerful owl in the study area and an important predator of medium-sized mammals including snowshoe hares, rabbits, skunks, and other raptors. Great horned owls are known predators of both spotted owls and barred owls, adding a layer of complexity to the spotted owl conservation picture. Their generalist habits and tolerance of habitat fragmentation make them a competitive threat to more habitat-specialized owls (GOV-01).

---

### Barred Owl

| Field | Value |
|-------|-------|
| **Common name** | Barred owl |
| **Scientific name** | *Strix varia* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Strigiformes > Strigidae > *Strix* > *S. varia* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Broad habitat tolerance from old-growth to second-growth and fragmented forest; native to eastern North America, expanded westward across the Great Plains and into the PNW beginning in the 1970s; now established across all four study zones |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | increasing |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Cavity nests in large trees or abandoned raptor/crow nests; less specific habitat requirements than spotted owl; successfully nests in younger forest stands |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03, CON-01 |
| **Data quality** | verified_agency |

Invasive competitor to the northern spotted owl. The barred owl is larger, more aggressive, has a broader diet, and tolerates younger forest than the spotted owl. Since colonizing the PNW in the 1970s, barred owls have expanded exponentially and now outnumber spotted owls across most of the study area (GOV-03). Direct interference competition (territorial aggression, nest site displacement) and exploitative competition (overlapping prey base including flying squirrels) have driven continued spotted owl decline. Barred owls also hybridize with spotted owls, producing "sparred owls," threatening the genetic integrity of the spotted owl population. Federal management experiments involving lethal removal of barred owls are underway to assess whether spotted owl populations can recover when the competitive pressure is reduced (CON-01).

---

### Waterbirds and Shorebirds

---

### American Dipper

| Field | Value |
|-------|-------|
| **Common name** | American dipper |
| **Scientific name** | *Cinclus mexicanus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Cinclidae > *Cinclus* > *C. mexicanus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Fast-flowing clear mountain streams and rivers; the only aquatic songbird in North America; walks underwater on stream bottoms foraging on aquatic invertebrate larvae |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Dome-shaped moss nest built on rock ledges behind waterfalls, on bridge supports, or on boulders in mid-stream; always directly over or adjacent to fast-flowing water |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

The American dipper is North America's only truly aquatic songbird and an unparalleled indicator of stream water quality. Dippers forage underwater on aquatic insect larvae, particularly caddisfly, stonefly, and mayfly nymphs, whose abundance directly reflects water quality and stream health. The presence or absence of dippers along a stream segment is one of the most reliable biological indicators of aquatic ecosystem condition (GOV-04). Their predator-prey relationship with aquatic invertebrates creates a direct cross-module link between the bird and aquatic survey modules.

---

### Great Blue Heron

| Field | Value |
|-------|-------|
| **Common name** | Great blue heron |
| **Scientific name** | *Ardea herodias* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Pelecaniformes > Ardeidae > *Ardea* > *A. herodias* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Shallow water margins of rivers, lakes, estuaries, and tidal flats; colonial nester in tall trees (heronries) near productive fishing waters |
| **Elevation range** | 0-1,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Colonial nesting in tall trees (heronries), often in cottonwoods or conifers near water; colonies may contain 10-200+ nests; highly sensitive to disturbance during nesting season |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Conspicuous wading bird found along all waterways in the study area. Great blue herons prey on fish, frogs, crayfish, and small mammals in shallow water habitats. Colonial nesting heronries are sensitive to human disturbance and require mature trees near productive fishing areas (GOV-01).

---

### Harlequin Duck

| Field | Value |
|-------|-------|
| **Common name** | Harlequin duck |
| **Scientific name** | *Histrionicus histrionicus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Anseriformes > Anatidae > *Histrionicus* > *H. histrionicus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes |
| **Habitat description** | Breeds on fast-flowing mountain streams; winters on rocky marine shorelines; one of the few ducks specialized for whitewater stream habitats |
| **Elevation range** | 0-1,500 m (breeding); 0 m (wintering) |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Nests on the ground near fast-flowing mountain streams, hidden under logs, rocks, or dense vegetation; ducklings enter whitewater streams within days of hatching |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Mountain stream specialist duck whose breeding habitat overlaps with salmon spawning habitat. Harlequin ducks feed on aquatic invertebrates in fast-flowing water, using their compact build and strong legs to navigate rapids that other ducks cannot. Their presence indicates high-quality mountain stream habitat (GOV-04).

---

### Common Merganser

| Field | Value |
|-------|-------|
| **Common name** | Common merganser |
| **Scientific name** | *Mergus merganser* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Anseriformes > Anatidae > *Mergus* > *M. merganser* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Clear rivers, lakes, and large streams; cavity nester in large trees along waterways; serrated bill adapted for catching fish |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Cavity nests in large trees near water; also uses nest boxes and cliff crevices; ducklings jump from cavity to water shortly after hatching |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Fish-eating duck common on clear rivers and lakes. Common mergansers prey on small fish including juvenile salmonids, creating a cross-module trophic connection to the aquatic survey. Their cavity-nesting habit requires large trees near water, linking their population to riparian old-growth availability (GOV-01).

---

### Additional Waterbirds and Shorebirds

The following species are documented across the four study zones in coastal, estuarine, and freshwater habitats.

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Diet Type | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|-----------|----------------|
| Western grebe | *Aechmophorus occidentalis* | olympic_peninsula, oregon_coast_range | partial | species_of_concern | candidate | sensitive | carnivore | GOV-04 |
| Spotted sandpiper | *Actitis macularius* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | insectivore | GOV-01 |
| Killdeer | *Charadrius vociferus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | insectivore | GOV-01 |
| Greater yellowlegs | *Tringa melanoleuca* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | carnivore | GOV-01 |
| Dunlin | *Calidris alpina* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | insectivore | GOV-04 |
| Western sandpiper | *Calidris mauri* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | insectivore | GOV-04 |
| Black oystercatcher | *Haematopus bachmani* | olympic_peninsula, oregon_coast_range | resident | none | none | none | carnivore | GOV-04 |
| Semipalmated plover | *Charadrius semipalmatus* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | insectivore | GOV-04 |
| Green heron | *Butorides virescens* | columbia_river_gorge, oregon_coast_range | migratory | none | none | none | carnivore | GOV-01 |
| Belted kingfisher | *Megaceryle alcyon* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | carnivore | GOV-01 |
| Wood duck | *Aix sponsa* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | omnivore | GOV-01 |
| Hooded merganser | *Lophodytes cucullatus* | olympic_peninsula, cascade_western_slopes, oregon_coast_range | partial | none | none | none | carnivore | GOV-01 |

---

### Songbirds and Passerines

The PNW temperate rainforest supports an exceptionally diverse passerine community with over 100 species across resident and migratory guilds. Below are detailed profiles of key species followed by a comprehensive summary table.

---

### Winter Wren

| Field | Value |
|-------|-------|
| **Common name** | Winter wren |
| **Scientific name** | *Troglodytes hiemalis* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Troglodytidae > *Troglodytes* > *T. hiemalis* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Dense understory of old-growth and mature coniferous forest; forages in root tangles, fallen logs, and dense fern cover on the forest floor; song is a remarkably complex rapid cascade of trills and warbles lasting up to 10 seconds |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | partial |
| **Breeding habitat** | Nest cavities in root tangles, under fallen logs, and in stream bank crevices; males build multiple dummy nests within territory; actual nest is a sphere of moss with side entrance |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

The winter wren (Pacific wren in some taxonomies) is the quintessential understory bird of the PNW temperate rainforest. Its elaborate song, disproportionate to its tiny body, is a defining sonic element of old-growth forest. Strongly associated with complex forest floor structure including downed logs, root wads, and fern thickets (GOV-04).

---

### Swainson's Thrush

| Field | Value |
|-------|-------|
| **Common name** | Swainson's thrush |
| **Scientific name** | *Catharus ustulatus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Turdidae > *Catharus* > *C. ustulatus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Moist coniferous and mixed forest with dense shrub understory; prefers riparian corridors and forest edges with salmonberry, elderberry, and other fruit-bearing shrubs |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | omnivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Cup nest in dense shrub layer, typically in salmonberry, vine maple, or young conifer; nest of twigs, moss, and leaves placed 1-3 m above ground |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Neotropical migrant whose upward-spiraling flute-like song defines PNW summer evenings. Swainson's thrush populations in salmon-bearing watersheds are denser than in non-salmon watersheds, likely because salmon-derived nutrients boost the invertebrate prey base and fruit production that thrushes depend on (GOV-03, PR-02). This indirect link to the aquatic module demonstrates how salmon influence even non-aquatic species.

---

### Wilson's Warbler

| Field | Value |
|-------|-------|
| **Common name** | Wilson's warbler |
| **Scientific name** | *Cardellina pusilla* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Parulidae > *Cardellina* > *C. pusilla* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Dense riparian thickets, wet meadow edges, and forest openings with willows and alders; forages actively in shrub layer for insects |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Ground or low shrub nest hidden in dense vegetation near water; nest of grass and moss placed at base of shrub or in moss hummock |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Abundant neotropical migrant associated with riparian thickets. Wilson's warbler is one of the most common breeding warblers in the PNW lowlands and is a key insectivore in wet shrub habitats. Declining populations are attributed to habitat loss on both breeding and wintering grounds (GOV-03).

---

### Black-throated Gray Warbler

| Field | Value |
|-------|-------|
| **Common name** | Black-throated gray warbler |
| **Scientific name** | *Setophaga nigrescens* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Parulidae > *Setophaga* > *S. nigrescens* |
| **Zones present** | cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Dry mixed coniferous and oak forest; more common in drier forest types than most PNW warblers; forages in canopy on insects |
| **Elevation range** | 100-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | migratory |
| **Breeding habitat** | Cup nest in conifer or oak branch, placed in dense foliage at mid to upper canopy level |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Warbler of drier conifer-oak forests, common in the Columbia River Gorge and eastern Cascades slopes. Represents the dry-forest element of PNW bird diversity (GOV-03).

---

### Steller's Jay

| Field | Value |
|-------|-------|
| **Common name** | Steller's jay |
| **Scientific name** | *Cyanocitta stelleri* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Corvidae > *Cyanocitta* > *C. stelleri* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Coniferous and mixed forest at all elevations; bold, conspicuous, and vocal; caches seeds and nuts |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Bulky stick nest in dense conifer branch, typically well-concealed near trunk |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Common corvid and an important seed disperser in PNW forests. Steller's jays cache acorns, hazelnuts, and conifer seeds, with unrecovered caches contributing to tree regeneration. However, they are also significant nest predators of smaller birds and are attracted to forest edges created by logging, where they increase predation pressure on marbled murrelet nests -- a conservation concern (GOV-01).

---

### Chestnut-backed Chickadee

| Field | Value |
|-------|-------|
| **Common name** | Chestnut-backed chickadee |
| **Scientific name** | *Poecile rufescens* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Paridae > *Poecile* > *P. rufescens* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Coniferous and mixed forest; forages through all forest layers from canopy to shrub in mixed-species flocks; cavity nester |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Cavity nester in small snags, woodpecker holes, or nest boxes; excavates own cavities in rotting wood |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

PNW chickadee species and a nucleus of mixed-species foraging flocks. Chestnut-backed chickadees lead mixed flocks containing kinglets, nuthatches, creepers, and warblers through the forest canopy, with flock participation increasing foraging efficiency and predator vigilance for all members (GOV-03).

---

### Red Crossbill

| Field | Value |
|-------|-------|
| **Common name** | Red crossbill |
| **Scientific name** | *Loxia curvirostra* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Fringillidae > *Loxia* > *L. curvirostra* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Coniferous forest with productive cone crops; nomadic, moving in response to conifer seed availability; crossed mandibles are specialized for prying open cones |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | herbivore |
| **Migratory status** | resident |
| **Breeding habitat** | Breeds year-round when cone crops are available; nest in dense conifer canopy; timing driven by food availability rather than photoperiod |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Conifer seed specialist with mandibles uniquely adapted to pry open closed cones. Multiple call types (ecotypes) exist in the PNW, each associated with different conifer species and cone sizes. Red crossbills breed year-round depending on cone availability rather than following a fixed seasonal cycle, making them one of the most ecologically unusual passerines in the study area (GOV-03).

---

### Band-tailed Pigeon

| Field | Value |
|-------|-------|
| **Common name** | Band-tailed pigeon |
| **Scientific name** | *Patagioenas fasciata* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Columbiformes > Columbidae > *Patagioenas* > *P. fasciata* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Mixed and coniferous forest, especially near mineral springs and fruit-bearing trees; forms flocks at mineral licks and berry patches |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | herbivore |
| **Migratory status** | partial |
| **Breeding habitat** | Flimsy stick platform nest in conifer or deciduous tree; single egg per nesting attempt; colonial tendency at mineral springs |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Large native pigeon dependent on mineral springs for sodium supplementation. Band-tailed pigeons congregate at mineral licks throughout the PNW, creating predictable concentration points. Their dependence on both mineral springs and fruit-bearing trees links them to specific landscape features. Declining populations are attributed to habitat loss and historical overhunting (GOV-01).

---

### Additional Songbirds and Passerines

The following table documents the remaining passerine diversity across the four study zones. Species are grouped by family.

#### Thrushes (Turdidae)

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| American robin | *Turdus migratorius* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Hermit thrush | *Catharus guttatus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Townsend's solitaire | *Myadestes townsendi* | cascade_western_slopes, columbia_river_gorge | partial | none | none | none | GOV-01 |

#### Warblers (Parulidae)

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Yellow warbler | *Setophaga petechia* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Yellow-rumped warbler | *Setophaga coronata* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Townsend's warbler | *Setophaga townsendi* | olympic_peninsula, cascade_western_slopes, oregon_coast_range | migratory | none | none | none | GOV-03 |
| Orange-crowned warbler | *Leiothlypis celata* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| MacGillivray's warbler | *Geothlypis tolmiei* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Common yellowthroat | *Geothlypis trichas* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Nashville warbler | *Leiothlypis ruficapilla* | cascade_western_slopes, columbia_river_gorge | migratory | none | none | none | GOV-01 |

#### Sparrows and Towhees (Passerellidae)

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Song sparrow | *Melospiza melodia* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-01 |
| Fox sparrow | *Passerella iliaca* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Dark-eyed junco | *Junco hyemalis* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| White-crowned sparrow | *Zonotrichia leucophrys* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Golden-crowned sparrow | *Zonotrichia atricapilla* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Spotted towhee | *Pipilo maculatus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-01 |
| Lincoln's sparrow | *Melospiza lincolnii* | cascade_western_slopes, columbia_river_gorge | migratory | none | none | none | GOV-01 |
| Savannah sparrow | *Passerculus sandwichensis* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Chipping sparrow | *Spizella passerina* | cascade_western_slopes, columbia_river_gorge | migratory | none | none | none | GOV-01 |

#### Finches (Fringillidae)

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Pine siskin | *Spinus pinus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-01 |
| American goldfinch | *Spinus tristis* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Evening grosbeak | *Coccothraustes vespertinus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-03 |
| Purple finch | *Haemorhous purpureus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Cassin's finch | *Haemorhous cassinii* | cascade_western_slopes, columbia_river_gorge | partial | none | none | none | GOV-01 |
| White-winged crossbill | *Loxia leucoptera* | cascade_western_slopes | resident | none | none | none | GOV-03 |

#### Swallows (Hirundinidae)

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Tree swallow | *Tachycineta bicolor* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Violet-green swallow | *Tachycineta thalassina* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Barn swallow | *Hirundo rustica* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Cliff swallow | *Petrochelidon pyrrhonota* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Northern rough-winged swallow | *Stelgidopteryx serripennis* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Bank swallow | *Riparia riparia* | columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |

#### Kinglets, Nuthatches, and Creepers

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Golden-crowned kinglet | *Regulus satrapa* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-03 |
| Ruby-crowned kinglet | *Corthylio calendula* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Red-breasted nuthatch | *Sitta canadensis* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-03 |
| White-breasted nuthatch | *Sitta carolinensis* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-01 |
| Pygmy nuthatch | *Sitta pygmaea* | cascade_western_slopes, columbia_river_gorge | resident | none | none | none | GOV-01 |

#### Wrens

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Bewick's wren | *Thryomanes bewickii* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-01 |
| Marsh wren | *Cistothorus palustris* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| House wren | *Troglodytes aedon* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |

#### Vireos

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Cassin's vireo | *Vireo cassinii* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Warbling vireo | *Vireo gilvus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Red-eyed vireo | *Vireo olivaceus* | cascade_western_slopes, columbia_river_gorge | migratory | none | none | none | GOV-01 |

#### Flycatchers (Tyrannidae)

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Western wood-pewee | *Contopus sordidulus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Olive-sided flycatcher | *Contopus cooperi* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | species_of_concern | none | sensitive | GOV-03 |
| Hammond's flycatcher | *Empidonax hammondii* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-03 |
| Willow flycatcher | *Empidonax traillii* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Western kingbird | *Tyrannus verticalis* | columbia_river_gorge | migratory | none | none | none | GOV-01 |

#### Tanagers, Grosbeaks, and Buntings

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Western tanager | *Piranga ludoviciana* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Black-headed grosbeak | *Pheucticus melanocephalus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | GOV-01 |
| Lazuli bunting | *Passerina amoena* | cascade_western_slopes, columbia_river_gorge | migratory | none | none | none | GOV-01 |

#### Blackbirds, Meadowlarks, and Orioles (Icteridae)

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Red-winged blackbird | *Agelaius phoeniceus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Brewer's blackbird | *Euphagus cyanocephalus* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Brown-headed cowbird | *Molothrus ater* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Bullock's oriole | *Icterus bullockii* | columbia_river_gorge | migratory | none | none | none | GOV-01 |
| Western meadowlark | *Sturnella neglecta* | columbia_river_gorge | partial | none | none | none | GOV-01 |

#### Miscellaneous Passerines

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| American pipit | *Anthus rubescens* | olympic_peninsula, cascade_western_slopes | migratory | none | none | none | GOV-04 |
| Cedar waxwing | *Bombycilla cedrorum* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | GOV-01 |
| Bushtit | *Psaltriparus minimus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-01 |
| European starling | *Sturnus vulgaris* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-01 |
| Dipper (see detailed profile) | *Cinclus mexicanus* | — | — | — | — | — | — |

#### Hummingbirds (Trochilidae)

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|----------------|
| Rufous hummingbird | *Selasphorus rufus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | species_of_concern | none | none | GOV-03 |
| Anna's hummingbird | *Calypte anna* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | GOV-01 |
| Calliope hummingbird | *Selasphorus calliope* | cascade_western_slopes, columbia_river_gorge | migratory | none | none | none | GOV-01 |

---

### Woodpeckers

In addition to the pileated woodpecker profiled above, the following woodpecker species are found across the study zones.

---

### White-headed Woodpecker

| Field | Value |
|-------|-------|
| **Common name** | White-headed woodpecker |
| **Scientific name** | *Dryobates albolarvatus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Piciformes > Picidae > *Dryobates* > *D. albolarvatus* |
| **Zones present** | cascade_western_slopes |
| **Habitat description** | Open ponderosa pine and mixed conifer forest; forages on pine seeds rather than insects, unique among North American woodpeckers; requires large-diameter ponderosa snags for nesting |
| **Elevation range** | 600-2,000 m |
| **Endemic status** | none |
| **Federal status** | species_of_concern |
| **State status (WA)** | candidate |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Excavates cavity nests in large-diameter ponderosa pine snags; requires open park-like stand structure maintained by fire |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Unusual woodpecker that feeds primarily on pine seeds rather than wood-boring insects. Strongly associated with ponderosa pine forest maintained by natural fire regimes. Fire suppression and logging of large ponderosa have reduced suitable habitat, driving population declines (GOV-03).

---

### Hairy Woodpecker

| Field | Value |
|-------|-------|
| **Common name** | Hairy woodpecker |
| **Scientific name** | *Dryobates villosus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Piciformes > Picidae > *Dryobates* > *D. villosus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Mature coniferous and mixed forest; forages on wood-boring insects in dead wood; requires moderate to large-diameter trees and snags |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Excavates cavity in dead wood of moderate to large diameter trees |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Common woodpecker of mature forests, important bark beetle predator. Hairy woodpeckers increase in density following bark beetle outbreaks, providing natural biological control. Cavity nests are subsequently used by chickadees, wrens, and small owls (GOV-03).

---

### Downy Woodpecker

| Field | Value |
|-------|-------|
| **Common name** | Downy woodpecker |
| **Scientific name** | *Dryobates pubescens* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Piciformes > Picidae > *Dryobates* > *D. pubescens* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Deciduous and mixed forest, riparian corridors, and forest edges; smallest North American woodpecker; forages on small branches and weed stems as well as tree trunks |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Excavates small cavity in dead branch or small-diameter snag; often joins mixed-species foraging flocks in winter |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Smallest woodpecker in the study area. Downy woodpeckers forage on smaller branches and stems than other woodpeckers, reducing competitive overlap. Common participant in mixed-species winter foraging flocks led by chickadees (GOV-01).

---

### Three-toed Woodpecker

| Field | Value |
|-------|-------|
| **Common name** | American three-toed woodpecker |
| **Scientific name** | *Picoides dorsalis* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Piciformes > Picidae > *Picoides* > *P. dorsalis* |
| **Zones present** | cascade_western_slopes |
| **Habitat description** | High-elevation coniferous forest, especially post-fire and bark-beetle-killed stands; specializes in recently dead trees |
| **Elevation range** | 900-2,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | candidate |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Excavates cavity in recently dead conifer; strongly associated with post-disturbance forests |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Specialist of post-fire and bark-beetle-killed forest stands. Three-toed woodpeckers are among the first colonizers of burned forest, where they exploit the explosion of wood-boring beetle larvae in recently killed trees. Their presence indicates recent disturbance and active forest succession (GOV-03).

---

### Lewis's Woodpecker

| Field | Value |
|-------|-------|
| **Common name** | Lewis's woodpecker |
| **Scientific name** | *Melanerpes lewis* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Piciformes > Picidae > *Melanerpes* > *M. lewis* |
| **Zones present** | cascade_western_slopes, columbia_river_gorge |
| **Habitat description** | Open ponderosa pine forest, oak woodland, and burned forest with standing snags; fly-catches insects from exposed perches rather than drilling into wood |
| **Elevation range** | 200-1,800 m |
| **Endemic status** | none |
| **Federal status** | species_of_concern |
| **State status (WA)** | candidate |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | omnivore |
| **Migratory status** | partial |
| **Breeding habitat** | Cavities in large-diameter snags in open woodland; often uses cavities excavated by other woodpecker species |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03, CON-01 |
| **Data quality** | verified_agency |

Species of concern with an unusual foraging behavior for a woodpecker: it catches insects in flight like a flycatcher rather than drilling into wood. Lewis's woodpecker requires open woodland structure maintained by fire and has declined with fire suppression and logging of large snags. The Columbia River Gorge supports some of the best remaining habitat in the PNW (GOV-03, CON-01).

---

### Northern Flicker

| Field | Value |
|-------|-------|
| **Common name** | Northern flicker |
| **Scientific name** | *Colaptes auratus* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Piciformes > Picidae > *Colaptes* > *C. auratus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Open woodland, forest edges, meadows, and suburban areas; unique among woodpeckers in foraging extensively on the ground for ants |
| **Elevation range** | 0-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | partial |
| **Breeding habitat** | Excavates cavity in dead trees, utility poles, or buildings; also uses nest boxes |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Ground-foraging woodpecker specializing in ants. The red-shafted subspecies (western form) is found throughout the PNW. Northern flickers are one of the most important cavity excavators for secondary cavity nesters, including American kestrels, small owls, swallows, and starlings. Despite their abundance, populations have declined continent-wide (GOV-01).

---

### Corvids

---

### Common Raven

| Field | Value |
|-------|-------|
| **Common name** | Common raven |
| **Scientific name** | *Corvus corax* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Corvidae > *Corvus* > *C. corax* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | All habitats from coastal cliffs to alpine zones; highly intelligent generalist; nests on cliff ledges, in large conifers, and on human structures |
| **Elevation range** | 0-2,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | increasing |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Large stick nests on cliff ledges, in tall trees, or on human structures; highly territorial during breeding; mates for life |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Highly intelligent corvid present across all habitats and elevations. Ravens are important scavengers that consume salmon carcasses, winter-killed deer, and road-killed animals, cycling nutrients through the terrestrial food web. They are also nest predators of smaller birds including marbled murrelets (GOV-01).

---

### American Crow

| Field | Value |
|-------|-------|
| **Common name** | American crow |
| **Scientific name** | *Corvus brachyrhynchos* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Corvidae > *Corvus* > *C. brachyrhynchos* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Forest edges, agricultural areas, and urban/suburban environments; less common in deep forest interior than raven |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Stick nests in trees at forest edges and in suburban areas; cooperative breeding with family groups |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Common generalist corvid that, like Steller's jays, is attracted to forest edges created by logging. Increased crow abundance near fragmented forest increases nest predation on forest interior bird species, including marbled murrelet (GOV-01).

---

### Canada Jay

| Field | Value |
|-------|-------|
| **Common name** | Canada jay (gray jay) |
| **Scientific name** | *Perisoreus canadensis* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Corvidae > *Perisoreus* > *P. canadensis* |
| **Zones present** | olympic_peninsula, cascade_western_slopes |
| **Habitat description** | Subalpine and upper montane coniferous forest; caches food using sticky saliva to adhere items to tree bark and lichen; dependent on cold temperatures to preserve cached food |
| **Elevation range** | 800-2,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Nests in dense conifer branches, one of the earliest breeders in the PNW (February-March while snow is still deep); relies on cached food to feed nestlings |
| **Anomalous elevation** | false |
| **Primary source** | GOV-04 |
| **Data quality** | verified_agency |

Climate-sensitive corvid that caches food in tree bark, relying on subfreezing temperatures to preserve stores through winter. Rising temperatures are causing cached food to spoil before retrieval, which may explain population declines at lower elevations. Canada jays are among the earliest breeders in the PNW, nesting while snow still covers the ground, and depend on cached food reserves to feed chicks before insect emergence (GOV-04).

---

### Clark's Nutcracker

| Field | Value |
|-------|-------|
| **Common name** | Clark's nutcracker |
| **Scientific name** | *Nucifraga columbiana* |
| **Taxonomic group** | bird |
| **Taxonomic hierarchy** | Animalia > Chordata > Aves > Passeriformes > Corvidae > *Nucifraga* > *N. columbiana* |
| **Zones present** | cascade_western_slopes |
| **Habitat description** | Subalpine conifer forest, especially whitebark pine (*Pinus albicaulis*) habitat; caches thousands of whitebark pine seeds annually; extraordinary spatial memory for cache retrieval |
| **Elevation range** | 1,200-2,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Nests in dense subalpine conifers; breeds early (February-March) fueled by cached pine seeds |
| **Anomalous elevation** | false |
| **Primary source** | GOV-03 |
| **Data quality** | verified_agency |

Keystone mutualist of the subalpine zone. Clark's nutcrackers cache an estimated 30,000-90,000 whitebark pine seeds per bird per year, and unrecovered caches are the primary mechanism of whitebark pine regeneration (GOV-03). The relationship is obligate from the tree's perspective: whitebark pine cones do not open on their own and the seeds are too large for wind dispersal. As whitebark pine declines from blister rust and climate change, nutcracker populations lose their primary food source, creating a mutualistic collapse feedback loop. This symbiotic/mutualism relationship connects the fauna and flora modules.

---

### Grouse and Quail

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Diet Type | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|-----------|----------------|
| Sooty grouse | *Dendragapus fuliginosus* | olympic_peninsula, cascade_western_slopes, oregon_coast_range | resident | none | none | none | herbivore | GOV-04 |
| Ruffed grouse | *Bonasa umbellus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | omnivore | GOV-01 |
| White-tailed ptarmigan | *Lagopus leucura* | cascade_western_slopes | resident | none | none | none | herbivore | GOV-03 |
| Mountain quail | *Oreortyx pictus* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | sensitive | omnivore | GOV-01 |
| California quail | *Callipepla californica* | columbia_river_gorge | resident | none | none | none | omnivore | GOV-01 |

---

### Additional Raptors and Owls

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Diet Type | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|-----------|----------------|
| Northern saw-whet owl | *Aegolius acadicus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | carnivore | GOV-01 |
| Western screech-owl | *Megascops kennicottii* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | carnivore | GOV-01 |
| Northern pygmy-owl | *Glaucidium gnoma* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | carnivore | GOV-01 |
| Short-eared owl | *Asio flammeus* | olympic_peninsula, columbia_river_gorge | partial | none | none | none | carnivore | GOV-01 |
| Long-eared owl | *Asio otus* | cascade_western_slopes, columbia_river_gorge | resident | none | none | none | carnivore | GOV-01 |
| Barn owl | *Tyto alba* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | carnivore | GOV-01 |
| American kestrel | *Falco sparverius* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | carnivore | GOV-01 |
| Peregrine falcon | *Falco peregrinus* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | sensitive | sensitive | carnivore | GOV-01 |
| Merlin | *Falco columbarius* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | carnivore | GOV-01 |
| Prairie falcon | *Falco mexicanus* | columbia_river_gorge | partial | none | none | none | carnivore | GOV-01 |
| Turkey vulture | *Cathartes aura* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | carnivore | GOV-01 |
| Rough-legged hawk | *Buteo lagopus* | olympic_peninsula, columbia_river_gorge | migratory | none | none | none | carnivore | GOV-01 |

---

### Additional Waterbirds, Seabirds, and Waterfowl

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Diet Type | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|-----------|----------------|
| Double-crested cormorant | *Nannopterum auritum* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | partial | none | none | none | carnivore | GOV-04 |
| Brandt's cormorant | *Urile penicillatus* | olympic_peninsula, oregon_coast_range | resident | none | none | none | carnivore | GOV-04 |
| Pelagic cormorant | *Urile pelagicus* | olympic_peninsula, oregon_coast_range | resident | none | none | none | carnivore | GOV-04 |
| Brown pelican | *Pelecanus occidentalis* | olympic_peninsula, oregon_coast_range | migratory | none | endangered | none | carnivore | GOV-04 |
| Common loon | *Gavia immer* | olympic_peninsula, cascade_western_slopes, oregon_coast_range | partial | none | sensitive | none | carnivore | GOV-04 |
| Pacific loon | *Gavia pacifica* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Red-throated loon | *Gavia stellata* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Horned grebe | *Podiceps auritus* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | carnivore | GOV-01 |
| Pied-billed grebe | *Podilymbus podiceps* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | carnivore | GOV-01 |
| Red-necked grebe | *Podiceps grisegena* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Mallard | *Anas platyrhynchos* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | omnivore | GOV-01 |
| Green-winged teal | *Anas crecca* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | omnivore | GOV-01 |
| Northern pintail | *Anas acuta* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | omnivore | GOV-01 |
| American wigeon | *Mareca americana* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | herbivore | GOV-01 |
| Northern shoveler | *Spatula clypeata* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | omnivore | GOV-01 |
| Ring-necked duck | *Aythya collaris* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge | partial | none | none | none | omnivore | GOV-01 |
| Greater scaup | *Aythya marila* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | omnivore | GOV-04 |
| Lesser scaup | *Aythya affinis* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | omnivore | GOV-01 |
| Bufflehead | *Bucephala albeola* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | carnivore | GOV-01 |
| Common goldeneye | *Bucephala clangula* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | carnivore | GOV-01 |
| Barrow's goldeneye | *Bucephala islandica* | olympic_peninsula, cascade_western_slopes | partial | none | none | none | carnivore | GOV-04 |
| Surf scoter | *Melanitta perspicillata* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| White-winged scoter | *Melanitta deglandi* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Black scoter | *Melanitta americana* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Long-tailed duck | *Clangula hyemalis* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Ruddy duck | *Oxyura jamaicensis* | olympic_peninsula, columbia_river_gorge | partial | none | none | none | omnivore | GOV-01 |
| Canada goose | *Branta canadensis* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | herbivore | GOV-01 |
| Trumpeter swan | *Cygnus buccinator* | olympic_peninsula | migratory | none | none | none | herbivore | GOV-04 |
| Tundra swan | *Cygnus columbianus* | olympic_peninsula, columbia_river_gorge | migratory | none | none | none | herbivore | GOV-01 |
| Tufted puffin | *Fratercula cirrhata* | olympic_peninsula | partial | species_of_concern | candidate | none | carnivore | GOV-04 |
| Rhinoceros auklet | *Cerorhinca monocerata* | olympic_peninsula, oregon_coast_range | partial | none | none | none | carnivore | GOV-04 |
| Common murre | *Uria aalge* | olympic_peninsula, oregon_coast_range | partial | none | none | none | carnivore | GOV-04 |
| Pigeon guillemot | *Cepphus columba* | olympic_peninsula, oregon_coast_range | resident | none | none | none | carnivore | GOV-04 |
| Cassin's auklet | *Ptychoramphus aleuticus* | olympic_peninsula, oregon_coast_range | partial | species_of_concern | candidate | sensitive | carnivore | GOV-04 |
| Ancient murrelet | *Synthliboramphus antiquus* | olympic_peninsula | migratory | none | none | none | carnivore | GOV-04 |
| Black-legged kittiwake | *Rissa tridactyla* | olympic_peninsula | migratory | none | none | none | carnivore | GOV-04 |
| Glaucous-winged gull | *Larus glaucescens* | olympic_peninsula, oregon_coast_range | resident | none | none | none | omnivore | GOV-04 |
| Western gull | *Larus occidentalis* | olympic_peninsula, oregon_coast_range | resident | none | none | none | omnivore | GOV-04 |
| Herring gull | *Larus argentatus* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | omnivore | GOV-04 |
| California gull | *Larus californicus* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | partial | none | none | none | omnivore | GOV-01 |
| Mew gull | *Larus canus* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | omnivore | GOV-04 |
| Bonaparte's gull | *Chroicocephalus philadelphia* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | carnivore | GOV-01 |
| Caspian tern | *Hydroprogne caspia* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | carnivore | GOV-01 |
| Common tern | *Sterna hirundo* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Black turnstone | *Arenaria melanocephala* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Surfbird | *Calidris virgata* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Sanderling | *Calidris alba* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | insectivore | GOV-04 |
| Least sandpiper | *Calidris minutilla* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | insectivore | GOV-01 |
| Long-billed dowitcher | *Limnodromus scolopaceus* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | insectivore | GOV-01 |
| Wilson's snipe | *Gallinago delicata* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | insectivore | GOV-01 |
| Whimbrel | *Numenius phaeopus* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| Wandering tattler | *Tringa incana* | olympic_peninsula | migratory | none | none | none | insectivore | GOV-04 |

---

### Additional Songbirds

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Diet Type | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|-----------|----------------|
| American redstart | *Setophaga ruticilla* | cascade_western_slopes, columbia_river_gorge | migratory | none | none | none | insectivore | GOV-01 |
| Yellow-breasted chat | *Icteria virens* | columbia_river_gorge | migratory | none | none | sensitive | omnivore | GOV-01 |
| Northern waterthrush | *Parkesia noveboracensis* | olympic_peninsula, cascade_western_slopes | migratory | none | none | none | insectivore | GOV-01 |
| Mountain bluebird | *Sialia currucoides* | cascade_western_slopes, columbia_river_gorge | partial | none | none | none | insectivore | GOV-01 |
| Western bluebird | *Sialia mexicana* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | insectivore | GOV-01 |
| Rock wren | *Salpinctes obsoletus* | columbia_river_gorge | partial | none | none | none | insectivore | GOV-01 |
| Canyon wren | *Catherpes mexicanus* | columbia_river_gorge | resident | none | none | none | insectivore | GOV-01 |
| Gray catbird | *Dumetella carolinensis* | columbia_river_gorge | migratory | none | none | none | omnivore | GOV-01 |
| Horned lark | *Eremophila alpestris* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge | partial | none | none | none | omnivore | GOV-01 |
| Pacific wren | *Troglodytes pacificus* | olympic_peninsula, cascade_western_slopes, oregon_coast_range | resident | none | none | none | insectivore | GOV-04 |
| Black swift | *Cypseloides niger* | olympic_peninsula, cascade_western_slopes | migratory | species_of_concern | candidate | none | insectivore | GOV-04 |

---

### Nightjars and Swifts

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Diet Type | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|-----------|----------------|
| Common nighthawk | *Chordeiles minor* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | migratory | none | none | none | insectivore | GOV-01 |
| Common poorwill | *Phalaenoptilus nuttallii* | columbia_river_gorge | migratory | none | none | none | insectivore | GOV-01 |

---

### Pigeons and Doves

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Diet Type | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|-----------|----------------|
| Mourning dove | *Zenaida macroura* | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range | partial | none | none | none | herbivore | GOV-01 |
| Eurasian collared-dove | *Streptopelia decaocto* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | herbivore | GOV-01 |
| Rock pigeon | *Columba livia* | cascade_western_slopes, columbia_river_gorge, oregon_coast_range | resident | none | none | none | herbivore | GOV-01 |

---

### Herons, Egrets, and Bitterns

| Common Name | Scientific Name | Zones Present | Migratory Status | Federal Status | State (WA) | State (OR) | Diet Type | Primary Source |
|-------------|----------------|---------------|------------------|---------------|------------|------------|-----------|----------------|
| Great egret | *Ardea alba* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | partial | none | none | none | carnivore | GOV-01 |
| Snowy egret | *Egretta thula* | olympic_peninsula, oregon_coast_range | migratory | none | none | none | carnivore | GOV-04 |
| American bittern | *Botaurus lentiginosus* | olympic_peninsula, columbia_river_gorge, oregon_coast_range | partial | none | monitor | none | carnivore | GOV-01 |
| Black-crowned night-heron | *Nycticorax nycticorax* | columbia_river_gorge, oregon_coast_range | partial | none | none | none | carnivore | GOV-01 |

---

### Bird Ecological Relationships

The following formal relationship schema entries document the key ecological connections among bird species and their cross-module links.

#### Northern Spotted Owl - Barred Owl (Competition)

| Field | Value |
|-------|-------|
| **Relationship type** | competition |
| **Subtype** | interference |
| **Species A** | Northern spotted owl (*Strix occidentalis caurina*) |
| **Species B** | Barred owl (*Strix varia*) |
| **Directionality** | unidirectional |
| **Strength** | obligate |
| **Mechanism** | Barred owls aggressively displace spotted owls from territories through direct confrontation, nest site usurpation, and competitive exclusion. Barred owls have broader diet and habitat tolerance, allowing them to establish territories in both old-growth and second-growth forest, reducing spotted owl habitat availability. Hybridization produces "sparred owls," threatening genetic integrity. Spotted owl populations have declined 3.8% per year in Washington since barred owl colonization. |
| **Cross-module** | false |
| **Source** | GOV-03, CON-01 |

#### Northern Spotted Owl - Northern Flying Squirrel (Obligate Prey)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Northern spotted owl (*Strix occidentalis caurina*) |
| **Species B** | Northern flying squirrel (*Glaucomys sabrinus*) |
| **Directionality** | unidirectional |
| **Strength** | obligate |
| **Mechanism** | Northern flying squirrels comprise 50-80% of spotted owl diet depending on location and season. Spotted owls are obligate predators on flying squirrels, which in turn depend on EMF truffles connected to old-growth root networks. This creates a three-level dependency chain: owl -> squirrel -> truffle -> tree, where disruption at any level cascades through the system. |
| **Cross-module** | false |
| **Source** | GOV-03 |

#### Bald Eagle - Pacific Salmon (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Bald eagle (*Haliaeetus leucocephalus*) |
| **Species B** | Pacific salmon (*Oncorhynchus* spp.) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Eagles concentrate along salmon-bearing rivers during spawning runs, consuming 1-2 salmon per day. Communal winter roosts near productive salmon streams can hold 300+ eagles. Eagle-transferred salmon carcasses and fecal deposition move marine-derived nutrients into riparian forest, supplementing the bear-mediated nutrient transfer pathway. |
| **Cross-module** | true (links to aquatic module: salmonid populations) |
| **Source** | GOV-04, CON-05 |

#### Marbled Murrelet - Old-growth Canopy (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | symbiotic |
| **Subtype** | commensalism |
| **Species A** | Marbled murrelet (*Brachyramphus marmoratus*) |
| **Species B** | Old-growth conifers (Douglas fir, Sitka spruce, western hemlock) |
| **Directionality** | unidirectional |
| **Strength** | obligate |
| **Mechanism** | Murrelets nest exclusively on moss-covered branches of large old-growth conifers, requiring moss platforms on horizontal branches of trees typically >200 years old. The tree is unaffected by the nesting relationship. Loss of old-growth nesting habitat is the primary long-term threat to murrelet populations. |
| **Cross-module** | true (links to flora module: old-growth tree structure and canopy moss communities) |
| **Source** | GOV-04 |

#### Pileated Woodpecker - Cavity-nesting Species (Ecosystem Engineering)

| Field | Value |
|-------|-------|
| **Relationship type** | symbiotic |
| **Subtype** | commensalism |
| **Species A** | Pileated woodpecker (*Dryocopus pileatus*) |
| **Species B** | Cavity-nesting species (northern flying squirrel, Vaux's swift, American marten, screech-owls, bats) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Pileated woodpeckers excavate large rectangular cavities in snags that are subsequently used by dozens of species that cannot excavate their own. A single pair's territory may provide 10-20 old cavities used by a rotating community of secondary cavity nesters. Pileated woodpecker presence increases the carrying capacity for cavity-dependent species across the forest stand. |
| **Cross-module** | false |
| **Source** | GOV-03 |

#### American Dipper - Aquatic Invertebrates (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | American dipper (*Cinclus mexicanus*) |
| **Species B** | Aquatic invertebrates (caddisfly, stonefly, mayfly larvae) |
| **Directionality** | unidirectional |
| **Strength** | obligate |
| **Mechanism** | Dippers walk underwater on stream bottoms to forage on aquatic insect larvae. Their presence and breeding success directly reflects aquatic invertebrate abundance, which in turn reflects water quality, stream temperature, and habitat integrity. Dipper absence from historically occupied stream segments signals water quality degradation. |
| **Cross-module** | true (links to aquatic module: aquatic invertebrate communities and stream health indicators) |
| **Source** | GOV-04 |

#### Clark's Nutcracker - Whitebark Pine (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | symbiotic |
| **Subtype** | mutualism |
| **Species A** | Clark's nutcracker (*Nucifraga columbiana*) |
| **Species B** | Whitebark pine (*Pinus albicaulis*) |
| **Directionality** | bidirectional |
| **Strength** | obligate |
| **Mechanism** | Nutcrackers cache 30,000-90,000 whitebark pine seeds annually per bird. Unrecovered caches are the sole natural mechanism of whitebark pine regeneration, as cones do not open and seeds are too large for wind dispersal. In return, whitebark pine provides the nutcracker's primary food source. As whitebark pine declines from blister rust and climate change, nutcracker populations lose food and pine loses its dispersal agent, creating a mutualistic collapse spiral. |
| **Cross-module** | true (links to flora module: subalpine tree communities and whitebark pine conservation) |
| **Source** | GOV-03 |

---

## Amphibians and Reptiles

The Columbia River Gorge and surrounding PNW temperate rainforest harbor a rich herpetofauna shaped by the region's abundant moisture, complex forest structure, and topographic diversity. Amphibians dominate in number and ecological significance: the cool, wet forests of the Pacific Northwest support the highest diversity of lungless salamanders (family Plethodontidae) in western North America, while stream-breeding species serve as sensitive indicators of watershed health. Reptiles are less diverse in this moisture-dominated biome but include species of high conservation concern, particularly the Northwestern pond turtle, the only native freshwater turtle in the Pacific Northwest. Together, the 21 herp species documented below occupy microhabitats from subterranean talus interstices to canopy-gap basking sites, and their ecological relationships link forest floor invertebrate communities, stream ecosystems, and old-growth canopy structure into a tightly interconnected network (GOV-01, GOV-03).

### Amphibians

---

### Larch Mountain Salamander

| Field | Value |
|-------|-------|
| **Common name** | Larch Mountain salamander |
| **Scientific name** | *Plethodon larselli* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Caudata > Plethodontidae > *Plethodon* > *P. larselli* |
| **Zones present** | columbia_river_gorge |
| **Habitat description** | Moss-covered talus slopes and rock crevices beneath old-growth coniferous canopy; requires stable cool temperatures, high humidity, and specific basalt or andesite rock substrate |
| **Elevation range** | 30-900 m |
| **Endemic status** | gorge_endemic |
| **Federal status** | species_of_concern |
| **State status (WA)** | sensitive |
| **State status (OR)** | sensitive |
| **IUCN status** | NT |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Deep talus interstices with stable moisture; eggs deposited in rock crevices and attended by female; direct development (no aquatic larval stage) |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01, GOV-03, CON-01 |
| **Data quality** | verified_agency |

The Larch Mountain salamander is the flagship endemic species of the Columbia River Gorge and one of the most geographically restricted vertebrates in North America. A member of the lungless salamander family Plethodontidae, *Plethodon larselli* breathes entirely through its skin and the lining of its mouth, possessing no lungs whatsoever. This respiratory strategy constrains the species to environments where moisture is constant and temperatures remain cool: the thin, permeable skin that serves as its respiratory surface also makes it acutely vulnerable to desiccation and thermal stress. Adults are small, typically 4-5 cm snout-to-vent length, with a distinctive reddish-brown dorsal stripe on a dark background. The species was first described from specimens collected on Larch Mountain near the western end of the Columbia River Gorge in 1928, and subsequent surveys have confirmed that its entire global distribution falls within the Gorge and immediately adjacent slopes in Oregon and Washington (GOV-01, GOV-03).

The range of the Larch Mountain salamander is extremely limited, extending roughly from the Multnomah Falls area eastward to the Hood River vicinity along the Oregon side of the Gorge, with scattered populations documented on the Washington side as well. Within this narrow geographic band, the species occupies an even narrower ecological niche: moss-covered talus slopes composed of basalt or andesite rubble, typically on north-facing aspects beneath closed old-growth coniferous canopy. The talus provides the interstitial spaces the salamanders inhabit, moving vertically within the rock matrix in response to seasonal moisture and temperature changes -- retreating deeper during summer dry periods and emerging to the surface layer during cool, wet autumn and spring conditions. Elevations range from approximately 30 meters near the Columbia River to 900 meters on upper slopes, but occupied sites share the same microhabitat characteristics regardless of elevation: stable temperatures between 10-15 degrees C, relative humidity consistently above 80%, and overhead canopy that regulates moisture input and blocks direct solar radiation (GOV-03, CON-01).

The species' obligate dependence on old-growth canopy for microhabitat maintenance is among the most tightly coupled plant-animal relationships in the Gorge ecosystem. The closed canopy of old-growth Douglas fir and western hemlock intercepts precipitation and releases it gradually through throughfall and stemflow, maintaining the high humidity that talus-dwelling salamanders require. Canopy removal -- whether through timber harvest, windthrow, or fire -- fundamentally alters the moisture and temperature regime of underlying talus slopes. Studies in similar Pacific Northwest salamander habitats have documented that clearcut logging above occupied talus can reduce relative humidity by 20-30% and increase temperature extremes by 5-10 degrees C, conditions lethal to lungless salamanders within a single season. Road construction through talus slopes physically destroys habitat, and even recreational trail development can fragment populations by creating barriers of compacted, exposed substrate that salamanders cannot cross. Climate change compounds these threats by projecting warmer summers and reduced snowpack in the Gorge, potentially drying microhabitats that have been stable for millennia (GOV-01, GOV-03, CON-01).

Conservation of the Larch Mountain salamander requires protecting both the talus substrate and the old-growth canopy above it -- neither alone is sufficient. The species is listed as a federal species of concern and as a sensitive species by both Oregon and Washington. The IUCN classifies it as Near Threatened. The Columbia River Gorge National Scenic Area management plan provides some regulatory protection for forested talus habitats, but much of the species' range falls outside the most restrictive land-use zones. The salamander's ecological role, while localized, is significant: as a predator of forest floor invertebrates including mites, springtails, and small beetles, it participates in the decomposition and nutrient cycling networks that process leaf litter and maintain soil health in the Gorge's forest ecosystems. Its presence serves as a bioindicator of intact old-growth microhabitat conditions -- where Larch Mountain salamanders persist, the ancient forest structure that supports them remains functional (GOV-03, CON-01).

---

### Pacific Giant Salamander

| Field | Value |
|-------|-------|
| **Common name** | Pacific giant salamander |
| **Scientific name** | *Dicamptodon tenebrosus* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Caudata > Ambystomatidae > *Dicamptodon* > *D. tenebrosus* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Cold, clear streams in old-growth and mature forest; larvae aquatic in rocky streams, adults semi-terrestrial under logs and rocks near water |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Cold, rocky headwater streams; eggs deposited under submerged rocks and logs in flowing water; aquatic larvae may take 2-3 years to metamorphose |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The largest terrestrial salamander in North America, reaching up to 30 cm total length. Unusually for a salamander, *Dicamptodon tenebrosus* is capable of vocalizing with a low bark when disturbed. Adults are apex predators of the stream-forest interface, consuming invertebrates, small fish, and even small mice. Aquatic larvae are important predators in headwater stream food webs, and their abundance reflects stream quality and old-growth canopy cover that maintains cool water temperatures. Some individuals are paedomorphic, retaining larval gills and remaining aquatic throughout their lives (GOV-01).

---

### Ensatina

| Field | Value |
|-------|-------|
| **Common name** | Ensatina |
| **Scientific name** | *Ensatina eschscholtzii* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Caudata > Plethodontidae > *Ensatina* > *E. eschscholtzii* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Forest floor under logs, bark, and leaf litter in coniferous and mixed forests; requires moist microhabitats |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Moist cavities under logs and rocks; eggs deposited in terrestrial nest sites, direct development without aquatic larval stage |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

A widespread lungless salamander and a classic species ring study organism. In the PNW, the Oregon ensatina (*E. e. oregonensis*) subspecies predominates, characterized by uniform brown dorsal coloration. Ensatinas are among the most abundant forest floor vertebrates in old-growth stands, with population densities that can exceed those of all birds and mammals combined in terms of biomass per hectare. Their predation on litter-dwelling invertebrates makes them significant regulators of decomposition communities. When threatened, they raise their tail and secrete a milky, mildly toxic substance from tail glands (GOV-01).

---

### Western Red-backed Salamander

| Field | Value |
|-------|-------|
| **Common name** | Western red-backed salamander |
| **Scientific name** | *Plethodon vehiculum* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Caudata > Plethodontidae > *Plethodon* > *P. vehiculum* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Forest floor under logs, rocks, and bark in moist coniferous forest; closely tied to coarse woody debris |
| **Elevation range** | 0-1,200 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Terrestrial nest sites beneath logs and in decayed wood; direct development; female guards eggs |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

Another lungless plethodontid salamander common on the forest floor of PNW old-growth and mature second-growth forests. Distinguished by a broad tan, reddish, or yellowish dorsal stripe. Strongly associated with coarse woody debris -- populations are densest in forests with abundant downed logs in advanced stages of decay, making the species a useful indicator of forest structural complexity. Preys on springtails, mites, small beetles, and other litter-dwelling arthropods, contributing to nutrient cycling through the detrital food web (GOV-01).

---

### Rough-skinned Newt

| Field | Value |
|-------|-------|
| **Common name** | Rough-skinned newt |
| **Scientific name** | *Taricha granulosa* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Caudata > Salamandridae > *Taricha* > *T. granulosa* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Moist forests, woodland edges, and meadows; breeds in ponds, lakes, and slow-moving streams; adults terrestrial outside breeding season |
| **Elevation range** | 0-1,400 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Still or slow-moving freshwater ponds and lakes; males develop smooth skin and flattened tail for aquatic breeding; eggs deposited individually on submerged vegetation |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The rough-skinned newt produces tetrodotoxin (TTX), one of the most potent naturally occurring neurotoxins, in its skin glands. This chemical defense has driven a remarkable coevolutionary arms race with the common garter snake (*Thamnophis sirtalis*), which has evolved varying degrees of TTX resistance across its range. Gorge and western Oregon garter snake populations possess among the highest TTX resistance levels documented anywhere, reflecting intense selective pressure from newt toxicity. A single adult newt contains enough TTX to kill most vertebrate predators, making this the most toxic amphibian in the Pacific Northwest (GOV-01, PR-01).

---

### Long-toed Salamander

| Field | Value |
|-------|-------|
| **Common name** | Long-toed salamander |
| **Scientific name** | *Ambystoma macrodactylum* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Caudata > Ambystomatidae > *Ambystoma* > *A. macrodactylum* |
| **Zones present** | cascade_western_slopes, columbia_river_gorge |
| **Habitat description** | Moist forests and meadows; breeds in ponds, lakes, and marshes; adults fossorial under logs and rocks |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Seasonal and permanent ponds; mass spawning events in early spring; eggs attached to submerged vegetation and debris |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

A mole salamander that spends most of its life underground, emerging primarily for breeding migrations to ponds in early spring. Distinguished by a bright green or yellowish dorsal blotch. Larvae are important predators of mosquito larvae and other aquatic invertebrates in breeding ponds. Road mortality during spring breeding migrations is a significant threat in areas where roads bisect migration routes between upland forest habitat and breeding ponds (GOV-01).

---

### Pacific Tree Frog

| Field | Value |
|-------|-------|
| **Common name** | Pacific tree frog |
| **Scientific name** | *Pseudacris regilla* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Anura > Hylidae > *Pseudacris* > *P. regilla* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Extremely varied: forests, meadows, wetlands, agricultural edges, suburban areas; breeds in still water from temporary puddles to permanent ponds |
| **Elevation range** | 0-2,400 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Still or slow-moving shallow water; males chorus from emergent vegetation; eggs deposited in small clusters attached to submerged plants |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The most abundant and widespread frog in the Pacific Northwest, and the species whose characteristic "ribbit" call is the sound of PNW wetlands in spring. Despite its common name, the Pacific tree frog spends most of its time on the ground or in low vegetation rather than in tree canopies. Its ability to change color between green and brown provides camouflage across multiple habitat types. Serves as a prey base for garter snakes, herons, raccoons, and numerous other predators, making it a foundational node in wetland and forest edge food webs (GOV-01).

---

### Northern Red-legged Frog

| Field | Value |
|-------|-------|
| **Common name** | Northern red-legged frog |
| **Scientific name** | *Rana aurora* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Anura > Ranidae > *Rana* > *R. aurora* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Moist forests with access to still-water breeding sites; requires cool, shaded ponds and wetlands; adults use forest floor far from water outside breeding season |
| **Elevation range** | 0-1,000 m |
| **Endemic status** | none |
| **Federal status** | species_of_concern |
| **State status (WA)** | none |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Still, cool ponds and wetlands with emergent vegetation; breeds in late winter (January-March); eggs deposited in large communal masses attached to submerged vegetation |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01, CON-01 |
| **Data quality** | verified_agency |

A conservation-priority species declining throughout its range due to habitat loss and competition from invasive American bullfrogs (*Lithobates catesbeianus*). Red-legged frogs are early breeders, depositing eggs in late winter before bullfrogs become active, but bullfrog larvae and adults prey on red-legged frog tadpoles and juveniles during the overlap period. Habitat fragmentation between breeding wetlands and upland forest foraging areas further isolates populations. The species serves as an indicator of wetland-forest connectivity -- its persistence requires both intact breeding wetlands and adjacent old-growth or mature forest (GOV-01, CON-01).

---

### Coastal Tailed Frog

| Field | Value |
|-------|-------|
| **Common name** | Coastal tailed frog |
| **Scientific name** | *Ascaphus truei* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Anura > Ascaphidae > *Ascaphus* > *A. truei* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Cold, fast-flowing headwater streams in old-growth and mature forest; larvae require cold, clear water with rocky substrates |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | species_of_concern |
| **State status (WA)** | sensitive |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Cold, rocky headwater streams with temperatures below 15 degrees C; internal fertilization (unique among frogs); larvae with specialized oral disc for clinging to rocks in fast current |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01, GOV-04 |
| **Data quality** | verified_agency |

One of the most ancient and primitive living frog lineages, with a fossil record extending back over 200 million years. The "tail" is actually a copulatory organ used for internal fertilization -- an adaptation unique among frogs and thought to be necessary for reproduction in fast-flowing streams where external fertilization would fail. Tadpoles possess a large, flattened oral disc that functions as a suction cup, allowing them to cling to rocks in torrential headwater streams. Their strict dependence on cold, clear, undisturbed headwater streams makes tailed frogs one of the most sensitive indicators of old-growth forest watershed health. Timber harvest that increases stream temperature or sedimentation eliminates tailed frog populations within affected stream reaches (GOV-01, GOV-04).

---

### Western Toad

| Field | Value |
|-------|-------|
| **Common name** | Western toad |
| **Scientific name** | *Anaxyrus boreas* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Anura > Bufonidae > *Anaxyrus* > *A. boreas* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Wide variety of forested and open habitats; breeds in shallow ponds, lake margins, and slow streams; adults range far from water through forests and meadows |
| **Elevation range** | 0-2,500 m |
| **Endemic status** | none |
| **Federal status** | species_of_concern |
| **State status (WA)** | candidate |
| **State status (OR)** | sensitive |
| **IUCN status** | NT |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Shallow margins of ponds, lakes, and slow streams; breeds in spring; long strings of eggs deposited in shallow water |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

A declining species across the Pacific Northwest, affected by the amphibian disease chytridiomycosis caused by the fungal pathogen *Batrachochytrium dendrobatidis* (Bd), habitat loss, and UV-B radiation increases at higher elevations. Western toads undertake long-distance breeding migrations, sometimes traveling several kilometers between terrestrial foraging habitat and breeding ponds, making them vulnerable to road mortality and habitat fragmentation. Mass emergence of metamorphic toadlets from breeding ponds in late summer is a conspicuous seasonal event, with thousands of tiny toads dispersing into the surrounding landscape simultaneously (GOV-01).

---

### Cascades Frog

| Field | Value |
|-------|-------|
| **Common name** | Cascades frog |
| **Scientific name** | *Rana cascadae* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Anura > Ranidae > *Rana* > *R. cascadae* |
| **Zones present** | cascade_western_slopes |
| **Habitat description** | Montane and subalpine meadows, ponds, and lake margins in the Cascade Range; breeds in shallow, still water in open mountain meadows |
| **Elevation range** | 600-2,400 m |
| **Endemic status** | regional_endemic |
| **Federal status** | species_of_concern |
| **State status (WA)** | sensitive |
| **State status (OR)** | sensitive |
| **IUCN status** | NT |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Shallow margins of montane ponds, lakes, and meadow wetlands; breeds shortly after snowmelt; eggs deposited in communal masses in warm, shallow water |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

A Cascade Range endemic frog experiencing significant population declines, particularly at southern range limits. Highly susceptible to chytridiomycosis (Bd), with documented mass die-offs at several montane sites. Also threatened by introduced trout in historically fishless alpine lakes, which prey on tadpoles and eggs. The species' restricted range in Cascade montane meadows and lakes makes it vulnerable to climate change as snowpack reduction shortens the breeding season and warms breeding habitat beyond thermal tolerance (GOV-01).

---

### Oregon Spotted Frog

| Field | Value |
|-------|-------|
| **Common name** | Oregon spotted frog |
| **Scientific name** | *Rana pretiosa* |
| **Taxonomic group** | amphibian |
| **Taxonomic hierarchy** | Animalia > Chordata > Amphibia > Anura > Ranidae > *Rana* > *R. pretiosa* |
| **Zones present** | cascade_western_slopes |
| **Habitat description** | Warm, shallow marshes and springs with emergent vegetation; requires connected wetland complexes with seasonal and permanent water |
| **Elevation range** | 300-1,500 m |
| **Endemic status** | regional_endemic |
| **Federal status** | threatened |
| **State status (WA)** | endangered |
| **State status (OR)** | sensitive |
| **IUCN status** | VU |
| **Trend** | declining |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Warm, shallow marshes with short emergent vegetation; one of the earliest breeding frogs; eggs deposited communally in shallow water exposed to direct sunlight |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The most aquatic native frog in the Pacific Northwest and one of the most endangered amphibians in the region. The Oregon spotted frog has lost an estimated 90% of its historical range due to wetland drainage, invasive species, and habitat fragmentation. Bullfrog predation and reed canarygrass invasion of breeding habitat are primary ongoing threats. Federal listing as threatened under the ESA in 2014 triggered critical habitat designation for remaining populations in the Cascade foothills of Washington and Oregon. Active conservation includes captive rearing, wetland restoration, and invasive species control (GOV-01).

---

### Reptiles

---

### Northwestern Pond Turtle

| Field | Value |
|-------|-------|
| **Common name** | Northwestern pond turtle |
| **Scientific name** | *Actinemys marmorata* |
| **Taxonomic group** | reptile |
| **Taxonomic hierarchy** | Animalia > Chordata > Reptilia > Testudines > Emydidae > *Actinemys* > *A. marmorata* |
| **Zones present** | columbia_river_gorge, cascade_western_slopes, oregon_coast_range |
| **Habitat description** | Slow-moving rivers, ponds, marshes, and lakes with basking sites; requires terrestrial nesting habitat on south-facing slopes near water |
| **Elevation range** | 0-600 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | species_of_concern |
| **State status (WA)** | endangered |
| **State status (OR)** | sensitive |
| **IUCN status** | VU |
| **Trend** | declining |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Terrestrial nesting on open, south-facing slopes within 400 m of water; females dig nest cavities in compacted soil; hatchlings overwinter in nest |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01, GOV-03, CON-01, CON-02 |
| **Data quality** | verified_agency |

*See Flagship Species: Northwestern Pond Turtle section below for full conservation profile including biology, threats, and active intervention programs.*

---

### Common Garter Snake

| Field | Value |
|-------|-------|
| **Common name** | Common garter snake |
| **Scientific name** | *Thamnophis sirtalis* |
| **Taxonomic group** | reptile |
| **Taxonomic hierarchy** | Animalia > Chordata > Reptilia > Squamata > Colubridae > *Thamnophis* > *T. sirtalis* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Extremely varied: forests, meadows, wetland edges, riparian corridors, suburban areas; most abundant near water |
| **Elevation range** | 0-2,000 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Mates at or near communal hibernacula in spring; gives live birth; young born in late summer near maternal foraging areas |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The most abundant and widespread reptile in the Pacific Northwest. Common garter snakes are generalist predators consuming frogs, salamanders, slugs, earthworms, and small fish. PNW populations are notable for their evolved resistance to tetrodotoxin (TTX) produced by rough-skinned newts, a coevolutionary arms race that has produced some of the most TTX-resistant snake populations on Earth. Communal hibernation sites (hibernacula) may aggregate hundreds of individuals in winter, making these sites critical for population persistence (GOV-01).

---

### Northwestern Garter Snake

| Field | Value |
|-------|-------|
| **Common name** | Northwestern garter snake |
| **Scientific name** | *Thamnophis ordinoides* |
| **Taxonomic group** | reptile |
| **Taxonomic hierarchy** | Animalia > Chordata > Reptilia > Squamata > Colubridae > *Thamnophis* > *T. ordinoides* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Open meadows, forest clearings, and edges in moist habitats; often found under cover objects in grassy areas |
| **Elevation range** | 0-1,200 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Mates in spring; gives live birth in late summer; young born in grass and herb layer of meadow habitats |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

A small, slender garter snake largely restricted to the Pacific Northwest. Primarily a slug and earthworm specialist, making it one of the few vertebrate predators that significantly impacts terrestrial slug populations. Highly variable in dorsal coloration and stripe pattern. Occupies meadow and edge habitats that complement the common garter snake's more aquatic-associated niche, reducing direct competition between the two species (GOV-01).

---

### Northern Alligator Lizard

| Field | Value |
|-------|-------|
| **Common name** | Northern alligator lizard |
| **Scientific name** | *Elgaria coerulea* |
| **Taxonomic group** | reptile |
| **Taxonomic hierarchy** | Animalia > Chordata > Reptilia > Squamata > Anguidae > *Elgaria* > *E. coerulea* |
| **Zones present** | olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Forest floor, rock outcrops, talus margins, and woodland edges; uses rock crevices and bark for thermoregulation; tolerates cooler temperatures than most lizards |
| **Elevation range** | 0-1,500 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Mates in spring; viviparous (gives live birth); young born in late summer in sheltered forest floor microhabitats |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

The most cold-tolerant lizard in the Pacific Northwest, active at temperatures that would immobilize most other reptile species. Named for its superficial resemblance to alligators due to stiff, armored lateral scales. Forages in leaf litter and under bark for spiders, beetles, millipedes, and other arthropods. Its tolerance of cool, moist forest floor conditions allows it to occupy the same old-growth habitats as lungless salamanders, though the two groups partition microhabitat by the lizard's preference for drier, sun-exposed microsites within the forest mosaic (GOV-01).

---

### Rubber Boa

| Field | Value |
|-------|-------|
| **Common name** | Rubber boa |
| **Scientific name** | *Charina bottae* |
| **Taxonomic group** | reptile |
| **Taxonomic hierarchy** | Animalia > Chordata > Reptilia > Squamata > Boidae > *Charina* > *C. bottae* |
| **Zones present** | cascade_western_slopes, columbia_river_gorge, oregon_coast_range |
| **Habitat description** | Moist forest with abundant coarse woody debris; fossorial, spending most time underground or under logs and rocks; old-growth associated |
| **Elevation range** | 0-1,800 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | carnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Mates in spring; viviparous; young born in late summer in or near coarse woody debris habitat |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01 |
| **Data quality** | verified_agency |

One of only two boa species found in North America and the northernmost boa in the world. Rubber boas are secretive, nocturnal, and primarily fossorial, making them among the least frequently observed reptiles in the PNW. They specialize in raiding rodent nests, using their blunt tail as a decoy to deflect bites from defending parents while consuming nestlings. Their association with old-growth forest structure -- particularly abundant coarse woody debris and deep duff layers -- makes them an indicator of forest maturity, though their cryptic habits mean population monitoring is difficult (GOV-01).

---

### Western Fence Lizard

| Field | Value |
|-------|-------|
| **Common name** | Western fence lizard |
| **Scientific name** | *Sceloporus occidentalis* |
| **Taxonomic group** | reptile |
| **Taxonomic hierarchy** | Animalia > Chordata > Reptilia > Squamata > Phrynosomatidae > *Sceloporus* > *S. occidentalis* |
| **Zones present** | columbia_river_gorge |
| **Habitat description** | Dry, sunny rock outcrops, fence posts, and open woodland; concentrated in the drier eastern reaches of the Columbia River Gorge where open basalt cliffs provide basking habitat |
| **Elevation range** | 30-600 m |
| **Endemic status** | none |
| **Federal status** | none |
| **State status (WA)** | none |
| **State status (OR)** | none |
| **IUCN status** | LC |
| **Trend** | stable |
| **Diet type** | insectivore |
| **Migratory status** | resident |
| **Breeding habitat** | Eggs deposited in loose soil beneath rocks on warm, south-facing slopes; oviparous with no parental care |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01, GOV-03 |
| **Data quality** | verified_agency |

A sun-loving lizard reaching the northwestern limit of its range in the eastern Columbia River Gorge, where the dry, continental-influenced climate provides the warm, open basking habitat it requires. Males display bright blue ventral patches during territorial defense. Western fence lizards play an unusual role in disease ecology: a protein in their blood kills the spirochete *Borrelia burgdorferi* (the Lyme disease agent) in attached ticks, effectively cleansing ticks of the pathogen. In areas where western fence lizards are abundant, Lyme disease transmission rates to humans are correspondingly lower (GOV-01, GOV-03).

---

### Herp Ecological Relationships

The following formal relationship schema entries document key ecological connections among amphibian and reptile species, including cross-module links to old-growth canopy, aquatic systems, and invertebrate communities.

#### Larch Mountain Salamander - Old-growth Canopy (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | symbiotic |
| **Subtype** | commensalism |
| **Species A** | Larch Mountain salamander (*Plethodon larselli*) |
| **Species B** | Old-growth conifers (Douglas fir, western hemlock) |
| **Directionality** | unidirectional |
| **Strength** | obligate |
| **Mechanism** | The closed canopy of old-growth conifers maintains the cool, humid microclimate within talus slopes that the Larch Mountain salamander requires for survival. Canopy intercepts precipitation and releases it gradually, maintains shade that prevents direct solar heating of talus surface, and reduces wind exposure that would increase evaporation. Removal of canopy above occupied talus slopes causes microhabitat desiccation and temperature extremes lethal to this lungless salamander. The tree community is unaffected by the salamander's presence. |
| **Cross-module** | true (links to flora module: old-growth canopy structure and microclimate regulation) |
| **Source** | GOV-01, GOV-03 |

#### Coastal Tailed Frog - Aquatic Invertebrates (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Coastal tailed frog (*Ascaphus truei*) |
| **Species B** | Aquatic invertebrates (caddisfly, stonefly, mayfly larvae) |
| **Directionality** | unidirectional |
| **Strength** | obligate |
| **Mechanism** | Adult tailed frogs and their aquatic larvae prey on stream invertebrates in headwater reaches. Larval tailed frogs use their specialized oral disc to scrape periphyton and capture invertebrate larvae from rock surfaces in fast-flowing water. Their presence and abundance directly reflects stream health: cold water temperature, low sediment load, and intact riparian canopy. Tailed frog disappearance from a stream reach is a reliable early indicator of watershed degradation from logging, road construction, or climate warming. |
| **Cross-module** | true (links to aquatic module: headwater stream invertebrate communities and water quality) |
| **Source** | GOV-01, GOV-04 |

#### Pacific Giant Salamander - Fish and Invertebrates (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Pacific giant salamander (*Dicamptodon tenebrosus*) |
| **Species B** | Small fish (sculpin, juvenile salmonids) and aquatic invertebrates |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Both aquatic larvae and terrestrial adults of the Pacific giant salamander prey on aquatic invertebrates and small fish in headwater streams. Larvae are apex predators in fishless headwater reaches, regulating invertebrate communities that process leaf litter inputs. In streams with fish, giant salamander larvae compete with and occasionally prey upon juvenile salmonids, creating a bidirectional predation dynamic in small stream food webs. |
| **Cross-module** | true (links to aquatic module: headwater stream fish and invertebrate communities) |
| **Source** | GOV-01 |

#### Northern Red-legged Frog - American Bullfrog (Competition)

| Field | Value |
|-------|-------|
| **Relationship type** | competition |
| **Subtype** | interference |
| **Species A** | American bullfrog (*Lithobates catesbeianus*) |
| **Species B** | Northern red-legged frog (*Rana aurora*) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Invasive American bullfrogs prey on red-legged frog tadpoles and juveniles and competitively exclude adults from breeding habitat. Bullfrogs prefer warm, permanent ponds -- the same habitat type red-legged frogs use for breeding. Bullfrog introduction has caused local extirpation of red-legged frog populations throughout lowland sites in the Willamette Valley and Columbia River Gorge. Red-legged frogs persist primarily in cooler, shadier wetlands where bullfrog populations are limited by lower water temperatures. |
| **Cross-module** | false |
| **Source** | GOV-01, CON-01 |

#### Rough-skinned Newt - Common Garter Snake (Coevolutionary Arms Race)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Common garter snake (*Thamnophis sirtalis*) |
| **Species B** | Rough-skinned newt (*Taricha granulosa*) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Common garter snakes in the PNW have evolved extraordinary resistance to tetrodotoxin (TTX), the potent neurotoxin produced in rough-skinned newt skin glands. This coevolutionary arms race has driven escalating toxin levels in newts and corresponding resistance in snakes across their shared range, with the most toxic newts and most resistant snakes found in western Oregon. Resistant snakes pay a locomotor cost -- TTX resistance alleles reduce maximum sprint speed, creating a fitness trade-off. This is one of the best-documented coevolutionary arms races in vertebrate ecology. |
| **Cross-module** | false |
| **Source** | GOV-01, PR-01 |

---

## Flagship Species: American Pika -- Anomalous Low-Elevation Populations

| Field | Value |
|-------|-------|
| **Common name** | American pika |
| **Scientific name** | *Ochotona princeps* |
| **Taxonomic group** | mammal |
| **Taxonomic hierarchy** | Animalia > Chordata > Mammalia > Lagomorpha > Ochotonidae > *Ochotona* > *O. princeps* |
| **Zones present** | columbia_river_gorge, cascade_western_slopes |
| **Habitat description** | Talus slopes and rock fields; typical range is alpine/subalpine, but anomalous low-elevation populations persist in Columbia River Gorge talus where microclimate conditions replicate alpine conditions near sea level |
| **Elevation range** | 30-4,000 m (Gorge populations at 30-90 m; typical range 2,500-4,000 m) |
| **Endemic status** | none |
| **Federal status** | species_of_concern |
| **State status (WA)** | none |
| **State status (OR)** | sensitive |
| **IUCN status** | LC |
| **Trend** | declining |
| **Diet type** | herbivore |
| **Migratory status** | resident |
| **Breeding habitat** | Rock crevices in talus fields; creates haypiles of cached vegetation in rock interstices for winter forage; territorial, maintains individual territory within colony |
| **Anomalous elevation** | TRUE |
| **Primary source** | GOV-01, GOV-02, CON-01 |
| **Data quality** | verified_agency |

The American pika is a small lagomorph -- related to rabbits despite its rodent-like appearance -- weighing approximately 170 grams and occupying a unique ecological niche in the talus slopes and rock fields of western North American mountains. Unlike its rabbit relatives, the pika does not hibernate. Instead, it survives harsh mountain winters by constructing "haypiles," carefully cached collections of dried vegetation stored deep within talus interstices during the summer and fall months. Individual pikas are fiercely territorial, defending their haypile territories from conspecifics with sharp alarm calls that echo across talus fields. Throughout the vast majority of its range, the American pika is an alpine and subalpine specialist, found at elevations between 2,500 and 4,000 meters (8,000-13,000 feet) in the Sierra Nevada, Rocky Mountains, and Cascade Range crest. This high-elevation affinity is driven by a fundamental physiological constraint: pikas cannot survive prolonged exposure to ambient temperatures above approximately 25-28 degrees C (77-82 degrees F). At body temperatures only slightly above this threshold, pikas succumb to hyperthermia within hours, making them among the most thermally sensitive mammals in North America (GOV-01, GOV-02).

In the Columbia River Gorge, pikas shatter this elevational expectation. Populations persist at dramatically lower elevations than anywhere else in the species' range -- as low as 30-90 meters (100-300 feet) above sea level, a full 2,000 meters or more below the typical lower elevation limit documented across western North America. This is the biogeographic anomaly at the heart of FAUNA-04. The explanation lies in the Gorge's unique physical geography. The Columbia River Gorge is the only sea-level breach in the Cascade Range, creating an east-west wind corridor 130 kilometers long and up to 1,200 meters deep. This corridor channels marine-influenced air inland, producing microclimates along the Gorge walls that bear no resemblance to the surrounding lowland conditions. Deep talus slopes composed of Gorge basalt accumulate cold air through gravitational drainage, trapping dense, cool air in rock interstices while warmer air rises above. Old-growth canopy shading on north-facing slopes further depresses temperatures and maintains humidity levels comparable to alpine conditions. The result is a series of talus microrefugia where conditions at 60 meters elevation replicate those found at 2,500 meters in the open Cascades -- cool, humid, thermally stable environments embedded within a landscape that is otherwise far too warm for pikas (GOV-01, CON-01).

These Gorge pika populations may represent Pleistocene relicts -- animals that descended to low elevations during glacial periods when cooler climate conditions prevailed across the region, then became stranded in Gorge microclimates as postglacial warming eliminated suitable habitat in the surrounding lowlands. If this interpretation is correct, the Gorge populations have persisted in their current low-elevation refugia for 10,000 or more years, surviving every warm period of the Holocene in talus microhabitats buffered from regional temperature trends. This biogeographic history makes them both scientifically remarkable and profoundly vulnerable: unlike high-elevation populations that can theoretically shift upslope as temperatures rise, Gorge pikas are already at the bottom of the landscape. There is no cooler elevation to retreat to. If the microclimate conditions that sustain them degrade, these populations have no refuge left (GOV-01, GOV-02).

The climate implications of Gorge pika populations are substantial and extend well beyond the species itself. Pikas are widely recognized as one of North America's most climate-vulnerable mammals, with documented range contraction already underway across the Great Basin, where populations are disappearing from lower-elevation sites at rates that track regional temperature increases. The Columbia River Gorge populations represent a natural experiment in thermal vulnerability: they are the lowest-elevation, warmest-ambient-temperature pika populations on the continent, living at the absolute physiological margin of the species' tolerance. Projected temperature increases of 4.7-10 degrees F across the Pacific Northwest (GOV-02, consistent with IPCC AR6 scenarios) would reduce the microclimate buffering that currently sustains these populations. Even modest warming that does not eliminate the talus cold-air drainage effect could extend summer temperature spikes above the 25-28 degree C lethal threshold for enough consecutive hours to cause mortality events. Loss of old-growth canopy shading above occupied talus -- whether from wildfire, insect mortality, or land management -- would compound warming by removing the shade component of the microclimate system. Monitoring these populations therefore serves as an early warning system for climate impacts on talus-dependent species throughout the Pacific Northwest: if Gorge pikas decline, it signals that microclimate refugia across the region are degrading faster than organisms can adapt (GOV-02, CON-01).

### Pika Ecological Relationships

#### American Pika - Talus Vegetation (Herbivory)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | herbivory |
| **Species A** | American pika (*Ochotona princeps*) |
| **Species B** | Alpine and talus-margin vegetation (grasses, forbs, shrubs) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Pikas harvest vegetation from areas surrounding their talus territories to construct haypiles for winter survival. Selective harvesting of particular plant species over others shapes plant community composition around occupied talus fields, favoring unpalatable or fast-regenerating species and suppressing preferred forage plants. The haypile-building behavior also transports plant material into talus interstices where it decomposes, enriching otherwise nutrient-poor rock substrates. |
| **Cross-module** | true (links to flora module: alpine and talus-margin plant communities) |
| **Source** | GOV-01 |

#### American Pika - Predators (Prey Species)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Weasels (*Mustela* spp.), raptors (red-tailed hawk, golden eagle), American marten |
| **Species B** | American pika (*Ochotona princeps*) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Pikas are prey for multiple predator species that hunt talus habitats. Weasels and martens pursue pikas into talus interstices; raptors take pikas during surface foraging bouts. Pika alarm calls warn colony members of approaching predators and may also alert neighboring prey species (marmots, ground squirrels) to threats, creating an indirect protective benefit across the talus community. |
| **Cross-module** | false |
| **Source** | GOV-01 |

#### American Pika - Talus Microhabitat (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | symbiotic |
| **Subtype** | commensalism |
| **Species A** | American pika (*Ochotona princeps*) |
| **Species B** | Talus slope microhabitat (maintained by old-growth canopy shade and cold-air drainage) |
| **Directionality** | unidirectional |
| **Strength** | obligate |
| **Mechanism** | In the Columbia River Gorge, low-elevation pika populations depend on microclimate conditions within talus slopes that are maintained by old-growth canopy shade, cold-air drainage, and Gorge wind corridor cooling. The pika does not modify the talus habitat; it simply requires that the thermal and moisture regime remain within its narrow physiological tolerance. Loss of canopy (wildfire, logging) or warming beyond the cold-air drainage buffering capacity would eliminate the microhabitat conditions these populations depend on. |
| **Cross-module** | true (links to flora module: old-growth canopy maintenance of talus microclimate) |
| **Source** | GOV-01, GOV-02, CON-01 |

---

## Flagship Species: Northwestern Pond Turtle -- Conservation and Active Interventions

| Field | Value |
|-------|-------|
| **Common name** | Northwestern pond turtle (formerly western pond turtle) |
| **Scientific name** | *Actinemys marmorata* |
| **Taxonomic group** | reptile |
| **Taxonomic hierarchy** | Animalia > Chordata > Reptilia > Testudines > Emydidae > *Actinemys* > *A. marmorata* |
| **Zones present** | columbia_river_gorge, cascade_western_slopes, oregon_coast_range |
| **Habitat description** | Slow-moving rivers, ponds, marshes, and lakes with emergent basking sites (logs, rocks); requires open, south-facing terrestrial slopes within 400 m of water for nesting |
| **Elevation range** | 0-600 m |
| **Endemic status** | pnw_endemic |
| **Federal status** | species_of_concern |
| **State status (WA)** | endangered |
| **State status (OR)** | sensitive |
| **IUCN status** | VU |
| **Trend** | declining |
| **Diet type** | omnivore |
| **Migratory status** | resident |
| **Breeding habitat** | Terrestrial nesting on open, south-facing slopes within 400 m of water; females dig nest cavities in compacted soil during June-July; hatchlings typically overwinter in nest, emerging the following spring |
| **Anomalous elevation** | false |
| **Primary source** | GOV-01, GOV-03, CON-01, CON-02 |
| **Data quality** | verified_agency |

The Northwestern pond turtle is the only native freshwater turtle in the Pacific Northwest, a distinction that underscores both its ecological uniqueness and the precariousness of its position. Historically abundant throughout lowland waterways from British Columbia to California, the species has experienced dramatic range contraction and population fragmentation across its northern range, particularly in Washington and Oregon. Adults are medium-sized (12-20 cm carapace length), drab olive-brown with faint darker mottling, and remarkably long-lived -- individuals may survive 40-70 years in the wild. This longevity is paired with exceptionally slow reproductive maturity: females do not begin breeding until 8-12 years of age, and annual clutch sizes are small (3-13 eggs). The combination of delayed maturity and low fecundity means that population recovery from decline is measured in decades, not years, and that adult mortality has disproportionate impact on population viability. Pond turtles are ectotherms that depend on behavioral thermoregulation, spending hours basking on logs, rocks, and emergent vegetation to maintain body temperatures conducive to digestion, growth, and immune function. This basking requirement makes them visible and vulnerable, but it also makes them easy to monitor -- the sight of a row of olive-brown turtles lined up on a basking log is the most reliable field indicator of population presence (GOV-01, GOV-03).

The threats facing Northwestern pond turtles are multiple, synergistic, and ongoing. Habitat loss and fragmentation have eliminated the species from much of its historical range in the Willamette Valley and Puget Sound lowlands, where wetland drainage for agriculture and urban development destroyed the slow-water habitats and terrestrial nesting sites the species requires. Where suitable aquatic habitat persists, invasive species create additional pressure. American bullfrogs (*Lithobates catesbeianus*), introduced throughout the Pacific Northwest, prey on juvenile pond turtles -- hatchlings and yearlings are within the size range that adult bullfrogs routinely consume, and the overlap in pond habitats means that many pond turtle populations coexist with their primary aquatic predator. Red-eared sliders (*Trachemys scripta elegans*), released pet turtles now established in many PNW waterways, compete directly with pond turtles for limited basking sites, with sliders typically outcompeting the smaller, less aggressive natives for the best thermoregulation spots. Road mortality is a significant threat during the nesting season (June-July), when gravid females leave the water to travel overland to nesting sites on south-facing slopes, crossing roads in the process. Nest predation by raccoons, non-native red foxes, and other mesopredators further reduces recruitment. Water quality degradation from agricultural runoff, urban stormwater, and algal blooms affects both food resources and turtle health (GOV-01, GOV-03, CON-01).

The conservation response to pond turtle decline has been one of the most active and multi-faceted wildlife recovery programs in the Pacific Northwest, involving collaboration between state and federal agencies, zoos, land trusts, and research institutions. Head-starting programs represent the most visible intervention: eggs are collected from wild nests or gravid females are brought into captivity to lay, and hatchlings are reared in controlled environments for 1-2 years until they reach a body size too large for bullfrog predation. The Oregon Zoo in Portland, Woodland Park Zoo in Seattle, and other facilities participate in head-starting, with hundreds of captive-reared juveniles released back into managed wetland sites annually. This approach bypasses the highest-mortality life stage -- the first two years when hatchlings are small enough to be prey for bullfrogs and wading birds -- dramatically increasing recruitment into the breeding population. Complementary habitat restoration efforts include installation of artificial basking structures (anchored logs and floating platforms), removal of invasive vegetation that shades basking sites, creation and restoration of pond habitat, and maintenance of nesting site access through vegetation management. Bullfrog control programs employ targeted removal of adult bullfrogs from priority pond turtle sites using trapping, shooting, and egg mass destruction, reducing predation pressure on juvenile turtles. Nest protection measures include predator exclusion cages placed over known nest sites and fencing to redirect nesting females away from road-adjacent areas. Population monitoring through mark-recapture studies tracks population trends, age structure, and recruitment rates across managed sites in both Washington and Oregon. Land acquisition and conservation easements by organizations including the Columbia Land Trust protect key wetland habitats from development, ensuring long-term habitat security for managed populations (GOV-01, GOV-03, CON-01, CON-02).

The pond turtle's conservation story illustrates what active intervention looks like when a species' decline is driven by threats that are unlikely to abate on their own. Bullfrogs will not disappear from the Pacific Northwest. Road networks will not be removed from wetland landscapes. Raccoon populations, subsidized by human food waste, will not decline to pre-settlement levels. In this context, passive conservation -- simply protecting remaining habitat and hoping populations recover -- is insufficient. The ongoing programs represent a commitment to sustained active management: head-starting every year, controlling bullfrogs every season, monitoring populations every survey period. The species' long lifespan means that even small improvements in juvenile survival compound over decades, offering a realistic path to population stabilization if management intensity is maintained. The Northwestern pond turtle thus serves as a model for conservation action in landscapes where threats are permanent features rather than temporary disturbances (CON-01, CON-02).

### Pond Turtle Ecological Relationships

#### Northwestern Pond Turtle - Red-eared Slider (Competition)

| Field | Value |
|-------|-------|
| **Relationship type** | competition |
| **Subtype** | interference |
| **Species A** | Red-eared slider (*Trachemys scripta elegans*) |
| **Species B** | Northwestern pond turtle (*Actinemys marmorata*) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Invasive red-eared sliders compete with native pond turtles for limited basking sites. Sliders are larger, more aggressive, and outcompete pond turtles for preferred thermoregulation positions on logs and rocks. Displacement from optimal basking sites reduces pond turtle thermoregulation efficiency, potentially affecting digestion, growth, immune function, and reproductive output. Slider populations are self-sustaining in PNW waterways with warming water temperatures. |
| **Cross-module** | false |
| **Source** | GOV-01 |

#### Northwestern Pond Turtle - American Bullfrog (Predation)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | American bullfrog (*Lithobates catesbeianus*) |
| **Species B** | Northwestern pond turtle (*Actinemys marmorata*) -- juveniles |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Adult bullfrogs prey on hatchling and juvenile pond turtles during the first 1-2 years of life when turtles are small enough to be consumed. Bullfrog predation is a primary source of juvenile mortality in lowland pond turtle populations, driving the rationale for head-starting programs that rear turtles past the vulnerable size threshold in captivity. |
| **Cross-module** | false |
| **Source** | GOV-01, CON-01 |

#### Northwestern Pond Turtle - Aquatic Invertebrates (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | predator_prey |
| **Subtype** | predation |
| **Species A** | Northwestern pond turtle (*Actinemys marmorata*) |
| **Species B** | Aquatic invertebrates (crayfish, aquatic insects, snails) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Pond turtles are opportunistic omnivores that prey on aquatic invertebrates as a significant component of their diet. Turtle foraging contributes to invertebrate community regulation in pond and slow-water habitats. Invertebrate abundance and diversity in turn reflects water quality and wetland habitat integrity. |
| **Cross-module** | true (links to aquatic module: pond and slow-water invertebrate communities) |
| **Source** | GOV-01 |

#### Northwestern Pond Turtle - Riparian Flora (Cross-module)

| Field | Value |
|-------|-------|
| **Relationship type** | symbiotic |
| **Subtype** | commensalism |
| **Species A** | Northwestern pond turtle (*Actinemys marmorata*) |
| **Species B** | Riparian and wetland vegetation (emergent plants, basking-site logs) |
| **Directionality** | unidirectional |
| **Strength** | facultative |
| **Mechanism** | Pond turtles depend on riparian structure for basking sites (fallen logs, emergent vegetation platforms) and nesting site access (open canopy on south-facing slopes near water). Riparian vegetation management -- particularly balancing shade for water temperature regulation against open basking and nesting areas -- is a key factor in pond turtle habitat quality. The vegetation community is not materially affected by turtle presence. |
| **Cross-module** | true (links to flora module: riparian vegetation structure and management) |
| **Source** | GOV-03, CON-02 |

---

## Fauna Survey Synthesis

This fauna survey documents a total of 244 animal species across the four study zones of the Pacific Northwest temperate rainforest: 22 mammals with full ecological profiles, 204 birds (40 detailed profiles plus 164 species in summary tables), and 18 amphibians and reptiles with individual species entries. These 244 species are not a list -- they are nodes in an ecological network whose connections define how the PNW temperate rainforest functions as an integrated system. The three flagship species profiled in this survey each illuminate a different dimension of that network's structure and vulnerability.

The Larch Mountain salamander (*Plethodon larselli*) represents microhabitat sensitivity and the meaning of endemism. Its entire global distribution falls within the Columbia River Gorge, confined to moss-covered talus slopes beneath old-growth canopy. The salamander's existence is proof that the Gorge's ancient forest structure is intact at the microhabitat level -- where it persists, the canopy-moisture-temperature regime that has characterized these slopes for millennia remains functional. The American pika (*Ochotona princeps*) represents climate vulnerability and the power of anomaly as signal. Its presence at 30-90 meters elevation in the Gorge -- 2,000+ meters below its typical range -- is both a scientific curiosity and a climate early-warning system. These populations exist on a thermal knife-edge maintained by Gorge microclimates; their decline would signal that refugia across the region are failing. The Northwestern pond turtle (*Actinemys marmorata*) represents the conservation imperative and what sustained active intervention requires when threats are permanent features of the landscape. Head-starting, bullfrog control, habitat restoration, and population monitoring together constitute a multi-decade commitment to species persistence in the face of irreversible habitat modification.

The ecological relationships documented throughout this survey are the connective tissue that binds individual species into ecosystem function. The following cross-module relationships have been formally documented and feed directly into the Phase 607 network synthesis.

### Cross-module Relationship Summary

| # | Species A | Relationship | Species B / Target | Module Link | Key Mechanism | Source |
|---|-----------|-------------|-------------------|-------------|---------------|--------|
| 1 | Black bear | predator_prey (predation) | Pacific salmon | fauna-aquatic | Bears ferry 500-700 salmon/season into forest; N-15 deposition (CASCADE-01 step 2) | PR-02 |
| 2 | Northern flying squirrel | symbiotic (mutualism) | EMF truffles (*Rhizopogon* spp.) | fauna-fungi | Obligate truffle dispersal; 80-90% of squirrel diet; spore inoculation of new root zones | GOV-05, PR-03 |
| 3 | Roosevelt elk | predator_prey (herbivory) | Understory vegetation | fauna-flora | Browsing regulates shrub density; creates open ground for conifer regeneration; shapes riparian structure | GOV-04 |
| 4 | River otter | predator_prey (predation) | Salmon and trout | fauna-aquatic | Aquatic nutrient transfer via scat deposition along stream banks; latrine nutrient hotspots | GOV-04 |
| 5 | Bald eagle | predator_prey (predation) | Pacific salmon | fauna-aquatic | Scavenges and hunts spawning salmon; salmon availability determines winter territory quality | GOV-04 |
| 6 | Marbled murrelet | symbiotic (commensalism) | Old-growth conifers | fauna-flora | Obligate nester on moss platforms in old-growth canopy; loss of nesting habitat is primary threat | GOV-04 |
| 7 | Clark's nutcracker | symbiotic (mutualism) | Whitebark pine | fauna-flora | Obligate seed dispersal; 30,000-90,000 seeds cached/bird/year; sole regeneration mechanism | GOV-03 |
| 8 | American dipper | predator_prey (predation) | Aquatic invertebrates | fauna-aquatic | Obligate stream forager; breeding success reflects water quality and invertebrate abundance | GOV-04 |
| 9 | Larch Mountain salamander | symbiotic (commensalism) | Old-growth conifers | fauna-flora | Obligate dependence on canopy-maintained talus microclimate; canopy removal lethal | GOV-01, GOV-03 |
| 10 | Coastal tailed frog | predator_prey (predation) | Aquatic invertebrates | fauna-aquatic | Headwater stream health indicator; larvae scrape periphyton; absence signals watershed degradation | GOV-01, GOV-04 |
| 11 | Pacific giant salamander | predator_prey (predation) | Small fish and invertebrates | fauna-aquatic | Apex predator in fishless headwater reaches; competes with juvenile salmonids in shared streams | GOV-01 |
| 12 | American pika | symbiotic (commensalism) | Talus microhabitat (canopy-maintained) | fauna-flora | Low-elevation Gorge populations depend on old-growth shade for thermal refugia; climate indicator | GOV-01, GOV-02 |
| 13 | American pika | predator_prey (herbivory) | Talus-margin vegetation | fauna-flora | Selective haypile harvesting shapes plant community composition around occupied talus | GOV-01 |
| 14 | Northwestern pond turtle | predator_prey (predation) | Aquatic invertebrates | fauna-aquatic | Omnivore foraging regulates pond invertebrate communities; reflects water quality | GOV-01 |
| 15 | Northwestern pond turtle | symbiotic (commensalism) | Riparian vegetation | fauna-flora | Depends on fallen logs for basking; open canopy on south-facing slopes for nesting | GOV-03, CON-02 |

Of the 15 cross-module relationships documented above, the bear-salmon nutrient transfer (row 1) is the single most consequential ecological link in the study area, forming step 2 of CASCADE-01 (the Salmon-Forest Nutrient Cascade). Bear predation on spawning salmon and subsequent carcass deposition transfers marine-derived nitrogen deep into the forest interior, where isotopic analysis has confirmed that 40-80% of riparian nitrogen originates from the ocean via this pathway (PR-02). Step 3 of CASCADE-01 -- carcass decomposition by invertebrates and fungi, with nutrient uptake by tree roots through ectomycorrhizal networks -- connects this fauna module to the fungi and flora surveys.

The flying squirrel-truffle mutualism (row 2) forms part of CASCADE-02 (the Truffle-Mammal-Raptor cascade documented in the fungi module), linking old-growth fungal communities to the northern spotted owl through the food chain: truffle > flying squirrel > spotted owl. This cascade means that old-growth logging affects spotted owls not only through nesting habitat loss but also through disruption of the fungal communities that feed the owl's primary prey.

The pika-microclimate relationship (row 12) is unique in this survey as the only climate-signal cross-module link. The anomalous low-elevation pika populations in the Columbia River Gorge provide a natural experiment in thermal vulnerability that Phase 607 can use to model how climate change propagates through talus-dependent species networks across the region. Their monitoring status as an early-warning system connects the fauna module to the climate analysis in the synthesis phase.

The elk herbivory relationship (row 3) is the broadest-impact fauna-flora connection, affecting understory plant community structure across all four study zones. Exclosure experiments demonstrate that elk browsing creates the open ground conditions required for conifer seedling establishment, meaning that ungulate population management indirectly determines the trajectory of forest regeneration -- a link that feeds into the flora module's documentation of successional dynamics.

These 15 cross-module connections, combined with the 25 cross-module relationships documented in the aquatic module's salmon dependency web, the 9 connections flagged in the flora module, and the cascade relationships in the fungi module, together form the raw material for the Phase 607 network synthesis. The fauna survey's contribution to that synthesis is concentrated in two areas: the large-bodied mobile species (bears, elk, eagles, otters) that physically transport nutrients and propagules across ecosystem boundaries, and the microhabitat-specialist species (Larch Mountain salamander, tailed frog, pika) whose presence or absence signals the integrity of specific environmental conditions. Both roles are essential for constructing the network model that Phase 607 will produce.

---

*Document updated: 2026-03-07 | Phase 604 Plans 01-02 | PNW Rainforest Biodiversity v1.49.22*
