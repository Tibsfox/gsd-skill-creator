# PNW Living Systems: Shared Attribute Layers

> **Foundation reference for all PNW Living Systems Taxonomy research (ECO mission)**
>
> This document defines the shared vocabulary of elevation bands, habitat types, ecological roles, conservation status categories, and cultural significance frameworks used across all six taxonomy modules. Every species profile in every downstream module references attributes defined here by their canonical IDs.
>
> **Design principle:** Define once, reference everywhere. No downstream module should redefine elevation ranges, habitat descriptions, or role definitions. When an agent writes a species profile, it uses the IDs and templates from this document.

---

## 1. Elevation Bands

Eight elevation bands spanning the full PNW vertical transect from deep marine basins to glaciated volcanic summits. Each band is assigned a stable ID, real-world elevation range, Minecraft Y-level mapping, and ecological characterization.

### ELEV-ALPINE: Arctic-Alpine

| Parameter | Value |
|-----------|-------|
| **Band ID** | ELEV-ALPINE |
| **Elevation range** | 9,500-14,410 ft (2,896-4,392 m) |
| **Minecraft Y range** | y=196-319 |
| **Mean temperature** | 15-35F (-9 to 2C) summer highs; -20 to 10F (-29 to -12C) winter |
| **Precipitation** | 80-150 in (2,032-3,810 mm), predominantly snow; 200+ in snowpack on volcanic peaks |
| **Growing season** | 30-60 days |
| **Dominant plant community** | Krummholz whitebark pine (*Pinus albicaulis*), alpine phlox (*Phlox diffusa*), spreading phlox (*Phlox diffusa*), Tolmie's saxifrage (*Micranthes tolmiei*), Lyall's lupine (*Lupinus lyallii*) |
| **Substrate/soil type** | Bare volcanic rock, talus, glacial till, cryosols with minimal organic horizon; permafrost patches above 12,000 ft on north aspects; pumice deposits on Cascade volcanoes |
| **Key ecological processes** | Freeze-thaw weathering, glacial retreat/advance, periglacial patterned ground formation, aeolian seed dispersal, ultraviolet stress adaptation, snow algae blooms on permanent snowfields |

**Ecological character:** The arctic-alpine band is defined by extremes -- sustained high winds (60-120 mph gusts), intense UV radiation, desiccating cold, and a growing season measured in weeks. Vegetation is prostrate or cushion-form, hugging the substrate for warmth and wind protection. Above 12,000 ft, only lichens, snow algae, and ice worms persist. The krummholz zone (9,500-10,500 ft) marks the physiological tree line where subalpine fir and whitebark pine are sculpted into flagged, ground-hugging forms by ice-crystal abrasion. This band hosts disproportionate endemism: many alpine plants are glacial relicts with ranges restricted to single peaks or volcanic summits.

---

### ELEV-SUBALPINE: Subalpine (Hudsonian)

| Parameter | Value |
|-----------|-------|
| **Band ID** | ELEV-SUBALPINE |
| **Elevation range** | 5,000-9,500 ft (1,524-2,896 m) |
| **Minecraft Y range** | y=84-196 |
| **Mean temperature** | 35-55F (2-13C) summer; 10-30F (-12 to -1C) winter |
| **Precipitation** | 70-140 in (1,778-3,556 mm); deep snowpack persists into July-August |
| **Growing season** | 60-120 days |
| **Dominant plant community** | Subalpine fir (*Abies lasiocarpa*), mountain hemlock (*Tsuga mertensiana*), Alaska yellow cedar (*Callitropsis nootkatensis*), white bark pine (*Pinus albicaulis*), avalanche lily (*Erythronium montanum*) |
| **Substrate/soil type** | Thin Spodosols and Inceptisols over volcanic parent material; pumice soils (Vitricryands) in Oregon Cascades; glacial moraines with coarse rocky substrate |
| **Key ecological processes** | Snow-controlled phenology, avalanche corridor maintenance, tree island dynamics (ribbon forests), Clark's nutcracker seed caching driving whitebark pine regeneration, mycorrhizal networks in thin soils |

**Ecological character:** The subalpine band is the zone of contrasts -- deep winter snowpack (15-30 ft at Paradise, Mt. Rainier) alternating with brief, explosive summers. Subalpine meadows support some of the most spectacular wildflower displays in North America, with avalanche lily, lupine, paintbrush, and glacier lily blooming in sequence as snowmelt retreats upslope. The parkland ecotone (upper subalpine) consists of tree clumps separated by meadow, creating high structural diversity. This band is among the most climate-sensitive in the PNW; Alaska yellow cedar die-off is already documented where reduced snowpack exposes shallow roots to freezing injury.

---

### ELEV-MONTANE: Montane (Canadian)

| Parameter | Value |
|-----------|-------|
| **Band ID** | ELEV-MONTANE |
| **Elevation range** | 3,000-5,000 ft (914-1,524 m) |
| **Minecraft Y range** | y=34-84 |
| **Mean temperature** | 40-60F (4-16C) summer; 25-38F (-4 to 3C) winter |
| **Precipitation** | 60-120 in (1,524-3,048 mm); rain-snow transition zone |
| **Growing season** | 120-180 days |
| **Dominant plant community** | Pacific silver fir (*Abies amabilis*), noble fir (*Abies procera*), Alaska yellow cedar (*Callitropsis nootkatensis*), western white pine (*Pinus monticola*), vine maple (*Acer circinatum*) |
| **Substrate/soil type** | Moderately deep Andisols and Spodosols; volcanic ash deposits in eastern Cascades; colluvial slopes with mixed volcanic and sedimentary parent material |
| **Key ecological processes** | Rain-on-snow events (major flood driver), canopy gap dynamics from windthrow and snow loading, montane meadow maintenance by cold air drainage, spotted owl and marbled murrelet nesting habitat |

**Ecological character:** The montane band is the transition from the rain-dominated lowland forest to the snow-dominated subalpine. This zone captures the rain-snow transition, which shifts with warming climate, making it one of the most hydrologically dynamic bands. Pacific silver fir forests here can be extraordinarily dense, with canopy closure exceeding 95%. The montane band is critical habitat for northern spotted owl, marbled murrelet, and numerous amphibians that require cool, moist conditions. Noble fir, a PNW endemic, reaches its greatest stature in this band (up to 250 ft).

---

### ELEV-LOWLAND: Lowland Forest

| Parameter | Value |
|-----------|-------|
| **Band ID** | ELEV-LOWLAND |
| **Elevation range** | 500-3,000 ft (152-914 m) |
| **Minecraft Y range** | y=-29-34 |
| **Mean temperature** | 45-70F (7-21C) summer; 30-45F (-1 to 7C) winter |
| **Precipitation** | 35-100 in (889-2,540 mm); predominantly rain, occasional snow below 1,500 ft |
| **Growing season** | 180-240 days |
| **Dominant plant community** | Douglas-fir (*Pseudotsuga menziesii*), western red cedar (*Thuja plicata*), western hemlock (*Tsuga heterophylla*), bigleaf maple (*Acer macrophyllum*), sword fern (*Polystichum munitum*) |
| **Substrate/soil type** | Deep Inceptisols and Alfisols; alluvial valley bottoms; glacial till and outwash on Puget lowlands; deep weathered basalt on western Cascades slopes |
| **Key ecological processes** | Old-growth succession (250-1,000 year rotations), nurse log recruitment, mycorrhizal networks spanning hectares, canopy epiphyte communities (mosses, lichens, ferns), fire regime (low-frequency, high-severity in west-side; mixed-severity in drier east-side transition) |

**Ecological character:** The lowland forest band is the iconic PNW landscape -- towering Douglas-fir and western red cedar reaching 250-300 ft, draped in mosses and lichens, with understories of sword fern, salal, and Oregon grape. This band contains the most biomass per unit area of any terrestrial ecosystem on Earth (over 500 tonnes/ha in old-growth stands). The lowland forest has also absorbed the greatest human impact: over 90% of original old-growth in this band has been harvested since 1850, making remaining stands (Olympic, North Cascades, Gifford Pinchot) of extraordinary conservation value.

---

### ELEV-RIPARIAN: Riparian/Estuary

| Parameter | Value |
|-----------|-------|
| **Band ID** | ELEV-RIPARIAN |
| **Elevation range** | 0-500 ft (0-152 m) |
| **Minecraft Y range** | y=-41--29 |
| **Mean temperature** | 45-65F (7-18C) summer; 35-45F (2-7C) winter |
| **Precipitation** | 30-80 in (762-2,032 mm); tidal influence in estuaries |
| **Growing season** | 200-280 days |
| **Dominant plant community** | Red alder (*Alnus rubra*), Sitka spruce (*Picea sitchensis*), willow (*Salix* spp.), sedges (*Carex* spp.), skunk cabbage (*Lysichiton americanus*) |
| **Substrate/soil type** | Alluvial deposits, estuarine mud, peat, hydric soils (Histosols); saltmarsh soils with high organic content; tidally influenced substrates |
| **Key ecological processes** | Tidal exchange and salinity gradients, salmon spawning and marine-derived nutrient transport, beaver dam complexes creating wetland mosaics, large wood recruitment from adjacent forest, nitrogen fixation by alder |

**Ecological character:** The riparian/estuary band is where freshwater meets saltwater and where terrestrial meets aquatic. PNW estuaries (Willapa Bay, Grays Harbor, Padilla Bay, Columbia River estuary) are among the most productive ecosystems in the temperate world. This band is the critical nexus for anadromous salmonids -- every salmon and steelhead in the PNW passes through this zone twice (juvenile outmigration, adult return). Sitka spruce reaches its maximum size here (over 300 ft historically in Olympic coastal forests). Red alder, the dominant early-successional hardwood, fixes 40-300 kg nitrogen/ha/year, fundamentally altering soil chemistry for subsequent conifer establishment.

---

### ELEV-INTERTIDAL: Intertidal

| Parameter | Value |
|-----------|-------|
| **Band ID** | ELEV-INTERTIDAL |
| **Elevation range** | -15-0 ft (-4.6-0 m) relative to MLLW |
| **Minecraft Y range** | y=-41 |
| **Mean temperature** | 45-58F (7-14C) water; organisms experience air temperatures during low tide exposure |
| **Precipitation** | N/A (marine); salinity 28-33 ppt, reduced near river mouths |
| **Growing season** | Year-round (productivity peaks April-September) |
| **Dominant plant community** | Rockweed (*Fucus distichus*), sea lettuce (*Ulva* spp.), Turkish towel (*Chondracanthus exasperatus*), surfgrass (*Phyllospadix* spp.), encrusting coralline algae |
| **Substrate/soil type** | Bedrock (basalt, sandstone, mudstone), cobble, sand, mud; substrate type determines community composition |
| **Key ecological processes** | Tidal zonation creating distinct vertical bands, wave energy gradient from exposed to sheltered shores, keystone predation (ochre sea star), desiccation tolerance gradients, upwelling-driven nutrient pulses |

**Ecological character:** The PNW intertidal is among the best-studied in the world, largely because Robert Paine's keystone species concept was developed here (Tatoosh Island, Makah territory). Tidal zonation creates sharply defined bands: high intertidal barnacles and Littorina snails, mid intertidal mussels and anemones, low intertidal kelps and sea stars. The intertidal is also the zone most immediately affected by sea star wasting syndrome (2013-present), ocean acidification, and marine heat waves. Rocky shores on the outer coast (Olympic, Oregon) experience wave forces exceeding 25 m/s, selecting for tenacious attachment and flexible body plans.

---

### ELEV-SHALLOW-MARINE: Shallow Marine

| Parameter | Value |
|-----------|-------|
| **Band ID** | ELEV-SHALLOW-MARINE |
| **Elevation range** | -200--15 ft (-61--4.6 m) |
| **Minecraft Y range** | y=-46--41 |
| **Mean temperature** | 42-54F (6-12C) water; seasonal thermocline develops in summer |
| **Precipitation** | N/A (marine); salinity 30-34 ppt in open coast, 20-30 ppt in Puget Sound |
| **Growing season** | Year-round; spring phytoplankton bloom (March-May) is peak productivity |
| **Dominant plant community** | Bull kelp (*Nereocystis luetkeana*), giant kelp (*Macrocystis pyrifera* -- southern range limit), eelgrass (*Zostera marina*), feather boa kelp (*Egregia menziesii*), winged kelp (*Alaria marginata*) |
| **Substrate/soil type** | Rocky reef, sand, mud, mixed substrate; glacially carved channels in Puget Sound; basalt reefs on outer coast |
| **Key ecological processes** | Kelp forest canopy dynamics (annual in bull kelp, perennial in giant kelp), eelgrass meadow nursery function for juvenile fish and Dungeness crab, upwelling delivery of deep nutrients to photic zone, larval dispersal and settlement, sea otter trophic cascade (where present) |

**Ecological character:** The shallow marine band encompasses kelp forests, eelgrass meadows, rocky reefs, and sandy bottoms -- the most structurally diverse marine zone. Bull kelp forests create three-dimensional habitat analogous to terrestrial forests, supporting over 750 species in PNW waters. Eelgrass meadows are critical nursery habitat for juvenile salmon, herring, and Dungeness crab. This band has experienced dramatic recent change: bull kelp canopy in northern California and parts of Puget Sound has declined 90%+ following sea star wasting syndrome (removing urchin predators) and marine heat waves. Where sea otters have been reintroduced (Olympic coast), kelp forests recover rapidly through top-down urchin control.

---

### ELEV-DEEP-MARINE: Deep Marine

| Parameter | Value |
|-----------|-------|
| **Band ID** | ELEV-DEEP-MARINE |
| **Elevation range** | -930--200 ft (-283--61 m) |
| **Minecraft Y range** | y=-64--46 |
| **Mean temperature** | 39-46F (4-8C) water; stable year-round below 400 ft |
| **Precipitation** | N/A (marine); salinity 33-35 ppt |
| **Growing season** | Aphotic zone -- no photosynthesis; chemosynthesis at hydrothermal vents; detrital food web year-round |
| **Dominant plant community** | None (aphotic); dominant organisms are sponges, cold-water corals (*Primnoa pacifica*, *Paragorgia arborea*), glass sponge reefs, tube worms |
| **Substrate/soil type** | Soft sediment (mud, silt), glacially carved basins (Puget Sound depths to 930 ft), rocky outcrops, submarine canyons (Astoria Canyon, Juan de Fuca Canyon) |
| **Key ecological processes** | Detrital rain from surface productivity, deep-water circulation and oxygen delivery, cold-water coral reef formation (centuries-scale growth), submarine canyon upwelling, deep scattering layer (DSL) vertical migration of zooplankton |

**Ecological character:** The deep marine band includes Puget Sound's glacially carved basins (up to 930 ft in Hood Canal), the continental shelf edge, and submarine canyons. Though light-limited, this zone supports extraordinary biodiversity: glass sponge reefs in the Strait of Georgia (some over 9,000 years old), deep-water coral gardens, and rockfish assemblages with species living 100+ years. Deep basins in Puget Sound experience periodic low-oxygen events (Hood Canal dead zone), exacerbated by climate change and nutrient loading. The deep marine band is least explored and most vulnerable to bottom trawling, cable laying, and deep-water resource extraction.

---

## 2. Habitat Types

Seventeen habitat types covering the full spectrum of PNW ecosystems from volcanic summits to deep ocean basins. Each habitat is assigned a stable ID for cross-referencing by all taxonomy modules.

---

### HAB-OLD-GROWTH: Old-Growth Conifer Forest

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-OLD-GROWTH |
| **Elevation band(s)** | ELEV-LOWLAND, ELEV-MONTANE |
| **Typical elevation** | 500-5,000 ft (152-1,524 m) |
| **Dominant vegetation** | Douglas-fir (*Pseudotsuga menziesii*), western red cedar (*Thuja plicata*), western hemlock (*Tsuga heterophylla*), Sitka spruce (*Picea sitchensis* -- coastal), Pacific silver fir (*Abies amabilis* -- montane) |
| **Indicator species** | Northern spotted owl (*Strix occidentalis caurina*), marbled murrelet (*Brachyramphus marmoratus*), red tree vole (*Arborimus longicaudus*), Pacific giant salamander (*Dicamptodon tenebrosus*) |
| **Primary threats** | Historical and ongoing timber harvest, fire suppression altering stand structure, climate-driven drought stress on legacy trees, invasive pathogens (laminated root rot) |
| **Conservation status** | Critically reduced -- less than 10% of pre-settlement old-growth remains on west-side PNW; largest contiguous stands in Olympic National Park, North Cascades, and Gifford Pinchot NF |

**Description:** Old-growth conifer forest is defined by trees exceeding 200 years old, multi-layered canopy structure, large standing dead trees (snags), and abundant downed wood in various decay stages. These forests accumulate the highest biomass of any terrestrial ecosystem, with individual Douglas-firs exceeding 300 ft and 8 ft diameter. The canopy supports entire ecosystems of epiphytic mosses, lichens, and ferns that intercept fog moisture and host invertebrate communities found nowhere else.

---

### HAB-SECOND-GROWTH: Second-Growth Conifer Forest

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-SECOND-GROWTH |
| **Elevation band(s)** | ELEV-LOWLAND, ELEV-MONTANE |
| **Typical elevation** | 500-5,000 ft (152-1,524 m) |
| **Dominant vegetation** | Douglas-fir (*Pseudotsuga menziesii*), western hemlock (*Tsuga heterophylla*), red alder (*Alnus rubra* -- early seral), bigleaf maple (*Acer macrophyllum*) |
| **Indicator species** | Band-tailed pigeon (*Patagioenas fasciata*), Douglas squirrel (*Tamiasciurus douglasii*), Townsend's chipmunk (*Neotamias townsendii*) |
| **Primary threats** | Short-rotation harvest preventing old-growth characteristics from developing, monoculture plantation management reducing structural diversity, deer/elk browse preventing understory regeneration |
| **Conservation status** | Abundant but structurally simplified -- dominant forest type across managed PNW lands; ecological value increases dramatically with stand age and management for complexity |

**Description:** Second-growth conifer forests regenerated after logging, fire, or other disturbance, typically 40-200 years old. These stands lack the multi-layered canopy, large snags, and downed wood volumes of old-growth, resulting in reduced biodiversity. However, second-growth managed for structural complexity (variable retention harvest, snag creation) can develop old-growth characteristics within 80-150 years, making management decisions in this habitat type critical for long-term PNW forest conservation.

---

### HAB-ALPINE-MEADOW: Alpine Meadow

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-ALPINE-MEADOW |
| **Elevation band(s)** | ELEV-ALPINE, ELEV-SUBALPINE |
| **Typical elevation** | 6,000-10,000 ft (1,829-3,048 m) |
| **Dominant vegetation** | Alpine lupine (*Lupinus lepidus*), Cascade aster (*Eucephalus ledophyllus*), mountain huckleberry (*Vaccinium deliciosum*), subalpine sedges (*Carex* spp.), western pasqueflower (*Anemone occidentalis*) |
| **Indicator species** | Cascade golden-mantled ground squirrel (*Callospermophilus saturatus*), white-tailed ptarmigan (*Lagopus leucura*), gray-crowned rosy-finch (*Leucosticte tephrocotis*) |
| **Primary threats** | Climate-driven upslope tree encroachment, recreational trampling (trails, ski areas), invasive plant establishment from visitor traffic, loss of snowpack shortening growing season timing |
| **Conservation status** | Intact but shrinking -- alpine meadows are migrating upslope with warming temperatures; lower-elevation meadows converting to subalpine forest |

**Description:** Alpine meadows occur above tree line or in subalpine parkland openings maintained by deep snowpack, cold air pooling, or poor soils. These meadows support extraordinary wildflower diversity during a compressed growing season (6-12 weeks), with species composition varying by snowmelt timing, aspect, and soil moisture. PNW alpine meadows are globally significant for their beauty and endemism, with many species restricted to individual volcanic peaks.

---

### HAB-SUBALPINE-PARKLAND: Subalpine Parkland

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-SUBALPINE-PARKLAND |
| **Elevation band(s)** | ELEV-SUBALPINE |
| **Typical elevation** | 5,000-7,500 ft (1,524-2,286 m) |
| **Dominant vegetation** | Subalpine fir (*Abies lasiocarpa*), mountain hemlock (*Tsuga mertensiana*), avalanche lily (*Erythronium montanum*), bear grass (*Xerophyllum tenax*), huckleberry (*Vaccinium* spp.) |
| **Indicator species** | Clark's nutcracker (*Nucifraga columbiana*), hoary marmot (*Marmota caligata*), mountain goat (*Oreamnos americanus*) |
| **Primary threats** | Climate-driven tree infilling of meadow openings, whitebark pine decline from blister rust (*Cronartium ribicola*), altered fire regimes, recreational pressure at popular subalpine destinations |
| **Conservation status** | Generally intact in protected areas (national parks, wilderness); under climate pressure at lower elevation margins |

**Description:** Subalpine parkland is the mosaic ecotone between continuous subalpine forest and alpine meadow, characterized by tree clumps (islands) separated by meadow openings. This mosaic structure creates high edge density and habitat diversity, supporting species from both forest and alpine communities. Tree islands expand and contract in response to multi-decadal climate oscillations, and the position of the parkland ecotone is one of the most sensitive indicators of climate change in the PNW.

---

### HAB-RIPARIAN: Riparian Corridor

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-RIPARIAN |
| **Elevation band(s)** | ELEV-RIPARIAN, ELEV-LOWLAND, ELEV-MONTANE |
| **Typical elevation** | 0-5,000 ft (0-1,524 m) |
| **Dominant vegetation** | Red alder (*Alnus rubra*), black cottonwood (*Populus trichocarpa*), willow (*Salix* spp.), salmonberry (*Rubus spectabilis*), devil's club (*Oplopanax horridus*) |
| **Indicator species** | American dipper (*Cinclus mexicanus*), Pacific giant salamander (*Dicamptodon tenebrosus*), water ouzel, torrent sculpin (*Cottus rhotheus*) |
| **Primary threats** | Agricultural and urban encroachment removing riparian buffers, road crossings fragmenting corridors, beaver removal reducing wetland habitat, invasive plants (knotweed, reed canary grass) |
| **Conservation status** | Heavily degraded in lowlands (estimated 70-80% of historical riparian forest removed in Puget lowlands and Willamette Valley); intact in mountainous and protected areas |

**Description:** Riparian corridors are the linear ecosystems along streams and rivers, forming biological highways that connect upland and aquatic habitats. Riparian zones support disproportionate biodiversity -- though they cover less than 5% of the PNW landscape, they are used by over 80% of wildlife species at some point in their life cycle. Large wood from riparian trees creates pool-riffle complexity essential for salmonid rearing, while canopy shade maintains cold water temperatures that salmon require.

---

### HAB-STREAM: Freshwater Stream/River

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-STREAM |
| **Elevation band(s)** | ELEV-RIPARIAN, ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE |
| **Typical elevation** | 0-7,000 ft (0-2,134 m) |
| **Dominant vegetation** | Attached algae (periphyton), aquatic mosses (*Fontinalis* spp.), water starwort (*Callitriche* spp.) |
| **Indicator species** | Bull trout (*Salvelinus confluentus*), tailed frog (*Ascaphus truei*), Olympic mudminnow (*Novumbra hubbsi*), stonefly nymphs (Plecoptera) |
| **Primary threats** | Flow alteration from dams and water withdrawal, sedimentation from logging and roads, temperature increases from riparian clearing, passage barriers (culverts, dams) blocking fish migration |
| **Conservation status** | Highly variable -- pristine in wilderness headwaters; severely degraded in agricultural and urban lowlands; major dam removals (Elwha, Condit) demonstrating restoration potential |

**Description:** PNW streams and rivers range from glacial-fed torrents to spring-fed cold-water creeks to large mainstem rivers (Columbia, Fraser, Skagit). Stream ecosystems are structured by gradient, substrate, temperature, and flow regime. Headwater streams in old-growth forest are among the coldest and cleanest freshwater habitats in the temperate world, supporting endemic amphibians (tailed frog, torrent salamander) and cold-water-obligate fish (bull trout). The Columbia River system alone historically supported the largest salmon runs on Earth.

---

### HAB-LAKE: Freshwater Lake

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-LAKE |
| **Elevation band(s)** | ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE, ELEV-ALPINE |
| **Typical elevation** | 0-8,000 ft (0-2,438 m) |
| **Dominant vegetation** | Water lily (*Nuphar polysepala*), pondweed (*Potamogeton* spp.), bulrush (*Schoenoplectus* spp.), phytoplankton communities |
| **Indicator species** | Sockeye salmon (*Oncorhynchus nerka* -- lake-rearing populations), western pond turtle (*Actinemys marmorata*), common loon (*Gavia immer*), osprey (*Pandion haliaetus*) |
| **Primary threats** | Eutrophication from nutrient loading, invasive species (Eurasian watermilfoil, warmwater fish), shoreline development, water level management for flood control or irrigation |
| **Conservation status** | Variable -- large natural lakes (Chelan, Ozette, Crescent) generally healthy; lowland lakes heavily impacted by development and invasive species |

**Description:** PNW lakes range from glacially carved alpine tarns to large lowland lakes (Lake Chelan at 1,486 ft deep) to volcanic crater lakes (Crater Lake at 1,943 ft deep, the deepest in the US). Lake ecosystems are structured by depth, thermal stratification, and nutrient input. Many PNW lakes support unique populations of landlocked or lake-rearing salmonids, including kokanee (landlocked sockeye) and lake-dwelling bull trout. High-elevation lakes are typically ultra-oligotrophic with exceptional water clarity.

---

### HAB-WETLAND: Wetland/Bog

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-WETLAND |
| **Elevation band(s)** | ELEV-RIPARIAN, ELEV-LOWLAND, ELEV-MONTANE |
| **Typical elevation** | 0-4,000 ft (0-1,219 m) |
| **Dominant vegetation** | Sphagnum moss (*Sphagnum* spp.), Labrador tea (*Rhododendron groenlandicum*), skunk cabbage (*Lysichiton americanus*), cattail (*Typha latifolia*), sundew (*Drosera rotundifolia*) |
| **Indicator species** | Oregon spotted frog (*Rana pretiosa*), sandhill crane (*Antigone canadensis*), beaver (*Castor canadensis*), bog copper butterfly (*Lycaena epixanthe*) |
| **Primary threats** | Drainage and fill for development and agriculture (estimated 50%+ of PNW wetlands lost since 1850), invasive reed canary grass (*Phalaris arundinacea*), altered hydrology from upstream development |
| **Conservation status** | Severely reduced in lowlands; many remaining wetlands are protected but isolated; peatland bogs (some 10,000+ years old) are irreplaceable on human timescales |

**Description:** PNW wetlands include freshwater marshes, peat bogs, fens, vernal pools, and beaver-created wetland complexes. Bogs are particularly distinctive -- Sphagnum-dominated, acidic, nutrient-poor systems that accumulate peat over millennia and support carnivorous plants (sundew, bladderwort) adapted to nutrient scarcity. Wetlands provide water storage, flood attenuation, water quality filtering, and critical habitat for amphibians, waterfowl, and invertebrates. Beaver-created wetlands are increasingly recognized as keystone habitats that dramatically increase landscape-level water storage and biodiversity.

---

### HAB-ROCKY-INTERTIDAL: Rocky Intertidal

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-ROCKY-INTERTIDAL |
| **Elevation band(s)** | ELEV-INTERTIDAL |
| **Typical elevation** | -15-0 ft (-4.6-0 m) relative to MLLW |
| **Dominant vegetation** | Rockweed (*Fucus distichus*), sea lettuce (*Ulva lactuca*), Turkish towel (*Chondracanthus exasperatus*), coralline algae (*Corallina* spp.), surfgrass (*Phyllospadix scouleri*) |
| **Indicator species** | Ochre sea star (*Pisaster ochraceus*), California mussel (*Mytilus californianus*), giant green anemone (*Anthopleura xanthogrammica*), black oystercatcher (*Haematopus bachmani*) |
| **Primary threats** | Sea star wasting syndrome (SSWS), ocean acidification reducing calcification in mussels and barnacles, oil spill vulnerability, trampling and collection pressure at accessible sites, marine heat waves |
| **Conservation status** | Under active stress from SSWS and climate change; Makah and Quinault tribal marine areas provide some protection; Olympic Coast National Marine Sanctuary provides federal protection |

**Description:** Rocky intertidal shores are among the most studied and ecologically instructive habitats in the PNW. The vertical zonation created by tidal exposure -- from the Littorina zone (highest) through the mussel bed to the kelp zone (lowest) -- is a natural experiment in physiological tolerance. This is where Paine (1966) discovered that removing the ochre sea star caused California mussels to dominate, eliminating 15+ species -- establishing the keystone species concept that transformed ecology.

---

### HAB-SANDY-BEACH: Sandy Beach

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-SANDY-BEACH |
| **Elevation band(s)** | ELEV-INTERTIDAL, ELEV-RIPARIAN |
| **Typical elevation** | -5-15 ft (-1.5-4.6 m) |
| **Dominant vegetation** | Dune grass (American dunegrass *Leymus mollis*, European beach grass *Ammophila arenaria* -- invasive), sea rocket (*Cakile edentula*), yellow sand verbena (*Abronia latifolia*) |
| **Indicator species** | Western snowy plover (*Charadrius nivosus*), razor clam (*Siliqua patula*), Pacific mole crab (*Emerita analoga*), Dungeness crab (*Metacarcinus magister* -- juvenile) |
| **Primary threats** | Invasive European beach grass altering dune morphology, vehicle traffic on beaches, coastal development, sea level rise and increased storm intensity, disturbance to nesting shorebirds |
| **Conservation status** | Mixed -- Long Beach Peninsula and Oregon coast beaches publicly accessible; snowy plover nesting habitat critically limited; some beaches recovering after European beach grass removal |

**Description:** PNW sandy beaches are high-energy systems shaped by wave action, longshore drift, and wind. Despite appearing barren, the sand harbors rich infaunal communities of amphipods, isopods, polychaete worms, and bivalves (razor clams) that support shorebird food webs. Beaches grade into dune systems that provide nesting habitat for western snowy plover (federally threatened) and burrowing habitat for native invertebrates. The invasion of European beach grass (*Ammophila arenaria*) has fundamentally altered PNW dune morphology, converting broad, low, hummocky native dunes into tall, steep foredunes.

---

### HAB-EELGRASS: Eelgrass Meadow

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-EELGRASS |
| **Elevation band(s)** | ELEV-SHALLOW-MARINE, ELEV-INTERTIDAL |
| **Typical elevation** | -30-0 ft (-9-0 m) |
| **Dominant vegetation** | Eelgrass (*Zostera marina*), dwarf eelgrass (*Zostera japonica* -- non-native, now naturalized), widgeon grass (*Ruppia maritima*) |
| **Indicator species** | Pacific herring (*Clupea pallasii* -- spawning substrate), Dungeness crab (*Metacarcinus magister* -- juvenile nursery), great blue heron (*Ardea herodias*), brant goose (*Branta bernicla*) |
| **Primary threats** | Turbidity from shoreline development reducing light penetration, propeller scarring from boat traffic, nutrient pollution causing algal overgrowth, rising water temperatures exceeding thermal tolerance, direct dredging/filling |
| **Conservation status** | Declining in Puget Sound (estimated 30% loss since 1890); stable in protected bays (Padilla Bay NERR is the largest continuous eelgrass bed in WA); recognized as critical habitat under multiple restoration programs |

**Description:** Eelgrass meadows are submerged flowering plant communities that provide foundational ecosystem services: nursery habitat for juvenile salmon, herring, and crab; carbon sequestration (blue carbon); sediment stabilization; and water quality improvement. Padilla Bay, Washington hosts the largest eelgrass bed in the Pacific Northwest at over 8,000 acres. Eelgrass is a true marine angiosperm that evolved from terrestrial ancestors, and its loss triggers cascading declines in fishery productivity, waterfowl populations, and shoreline stability.

---

### HAB-KELP: Kelp Forest

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-KELP |
| **Elevation band(s)** | ELEV-SHALLOW-MARINE |
| **Typical elevation** | -80--10 ft (-24--3 m) |
| **Dominant vegetation** | Bull kelp (*Nereocystis luetkeana*), giant kelp (*Macrocystis pyrifera* -- southern range limit), feather boa kelp (*Egregia menziesii*), winged kelp (*Alaria marginata*) |
| **Indicator species** | Sea otter (*Enhydra lutris*), lingcod (*Ophiodon elongatus*), kelp greenling (*Hexagrammos decagrammus*), red sea urchin (*Mesocentrotus franciscanus*) |
| **Primary threats** | Sea urchin overgrazing (where sea otter/sea star predation is absent), marine heat waves causing tissue die-off, ocean acidification, sedimentation from coastal development, historic overharvest of kelp for alginates |
| **Conservation status** | Severe decline in some areas (90%+ loss in Sonoma/Mendocino CA; significant losses in San Juan Islands); stable where sea otter populations are healthy; restoration efforts underway (urchin culling, sea otter reintroduction support) |

**Description:** Kelp forests are the marine equivalent of old-growth forests -- three-dimensional structures that create habitat for hundreds of species across canopy, midwater, and benthic layers. Bull kelp, the dominant canopy-forming species in the PNW, is an annual alga that grows up to 10 inches per day, reaching 80+ feet from holdfast to floating canopy in a single growing season. Kelp forests demonstrate one of ecology's most famous trophic cascades: sea otters eat sea urchins, which eat kelp -- remove otters and forests collapse into urchin barrens.

---

### HAB-PELAGIC: Open Pelagic

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-PELAGIC |
| **Elevation band(s)** | ELEV-SHALLOW-MARINE, ELEV-DEEP-MARINE |
| **Typical elevation** | Surface to -930 ft (surface to -283 m) |
| **Dominant vegetation** | Phytoplankton (diatoms, dinoflagellates); no macrophytes |
| **Indicator species** | Sooty shearwater (*Ardenna grisea*), blue whale (*Balaenoptera musculus*), Pacific sardine (*Sardinops sagax*), leatherback sea turtle (*Dermochelys coriacea*) |
| **Primary threats** | Overfishing of forage fish, plastic pollution, ocean acidification affecting pteropod shell formation (base of food web), shipping lane strikes on cetaceans, noise pollution from vessel traffic |
| **Conservation status** | Managed under NOAA fisheries; forage fish populations fluctuate with ocean conditions (Pacific Decadal Oscillation); cetacean populations recovering post-whaling but face new threats |

**Description:** The open pelagic zone encompasses the water column beyond nearshore habitats, from the sunlit surface to the deep scattering layer. This habitat is structured vertically by light, temperature, and pressure rather than by substrate. The PNW pelagic system is driven by coastal upwelling (April-September), which brings cold, nutrient-rich deep water to the surface, fueling phytoplankton blooms that support the entire marine food web from krill to blue whales. The pelagic zone connects all other marine habitats through larval transport, nutrient cycling, and migratory species.

---

### HAB-DEEP-BASIN: Deep Basin

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-DEEP-BASIN |
| **Elevation band(s)** | ELEV-DEEP-MARINE |
| **Typical elevation** | -930--200 ft (-283--61 m) |
| **Dominant vegetation** | None (aphotic); sessile invertebrate communities: deep-water corals, glass sponges, tube worms |
| **Indicator species** | Sixgill shark (*Hexanchus griseus*), quillback rockfish (*Sebastes maliger*), spot prawn (*Pandalus platyceros*), Geoduck clam (*Panopea generosa*) |
| **Primary threats** | Bottom trawling destroying coral/sponge habitat, low-oxygen events in enclosed basins (Hood Canal), contaminated sediment accumulation, submarine cable installation |
| **Conservation status** | Poorly surveyed; glass sponge reefs (some 9,000+ years old) recently discovered in Strait of Georgia; increasing recognition of deep basin ecological importance driving protection efforts |

**Description:** Deep basins in Puget Sound (Hood Canal, Main Basin, Saratoga Passage) and the Strait of Juan de Fuca are glacially carved troughs reaching 930 ft depth. These cold, dark environments support slow-growing, long-lived organisms: rockfish living 100+ years, glass sponge reefs growing millimeters per year, and deep-water corals that take centuries to establish. The deep basin food web depends on detrital rain from surface productivity and is vulnerable to oxygen depletion when water column stratification prevents mixing.

---

### HAB-VOLCANIC: Volcanic/Geothermal

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-VOLCANIC |
| **Elevation band(s)** | ELEV-ALPINE, ELEV-SUBALPINE, ELEV-MONTANE |
| **Typical elevation** | 3,000-14,410 ft (914-4,392 m) |
| **Dominant vegetation** | Pioneer species on lahar/lava: prairie lupine (*Lupinus lepidus*), pearly everlasting (*Anaphalis margaritacea*), fireweed (*Chamaenerion angustifolium*), mosses and lichens on new substrate |
| **Indicator species** | Cascade red fox (*Vulpes vulpes cascadensis*), pika (*Ochotona princeps*), ice worm (*Mesenchytraeus solifugus*), endemic cave invertebrates |
| **Primary threats** | Volcanic eruption (episodic, catastrophic), climate change reducing glacial/snowfield habitat, recreational disturbance at volcanic summits, geothermal energy development |
| **Conservation status** | Protected within National Parks and Monuments (Mt. Rainier, Mt. St. Helens, Crater Lake, North Cascades); Mt. St. Helens blast zone is a globally significant natural laboratory for primary succession |

**Description:** Volcanic and geothermal habitats are unique to the Cascades and include active fumaroles, lava tubes, recent lava flows, lahar deposits, and the Mt. St. Helens blast zone. These habitats host extremophile organisms adapted to heat, toxic gases, and mineral-rich substrates. The Mt. St. Helens eruption (1980) created a 230-square-mile natural laboratory for studying primary succession -- the process by which life recolonizes sterile substrate. Lava tube caves support endemic invertebrates found nowhere else on Earth.

---

### HAB-URBAN: Urban Interface

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-URBAN |
| **Elevation band(s)** | ELEV-LOWLAND, ELEV-RIPARIAN |
| **Typical elevation** | 0-1,000 ft (0-305 m) |
| **Dominant vegetation** | Mixed native/non-native: bigleaf maple (*Acer macrophyllum*), Douglas-fir (*Pseudotsuga menziesii*), Oregon white oak (*Quercus garryana*), ornamental plantings, invasive species (Himalayan blackberry, English ivy, Scotch broom) |
| **Indicator species** | Barred owl (*Strix varia* -- invasive), Anna's hummingbird (*Calypte anna* -- range-expanding), raccoon (*Procyon lotor*), coyote (*Canis latrans*), Steller's jay (*Cyanocitta stelleri*) |
| **Primary threats** | Habitat fragmentation, impervious surface increasing stormwater runoff, light and noise pollution, pet predation (cats on birds), pesticide/herbicide use, human-wildlife conflict |
| **Conservation status** | Heavily modified but ecologically important -- urban forests and greenways provide connectivity; cities like Seattle and Portland have significant urban canopy and stream restoration programs |

**Description:** The urban interface encompasses the metropolitan areas of the PNW (Seattle-Tacoma, Portland-Vancouver, Eugene, Victoria, Vancouver BC) and their surrounding suburban matrix. Despite heavy modification, these areas retain significant ecological function: urban streams support cutthroat trout and coho salmon, urban forests provide habitat for dozens of bird species, and green infrastructure provides corridors connecting larger natural areas. The urban interface is where most PNW residents experience nature, making it critical for conservation education and engagement.

---

### HAB-OAK-PRAIRIE: Oak Woodland/Prairie (Lowland)

| Parameter | Value |
|-----------|-------|
| **Habitat ID** | HAB-OAK-PRAIRIE |
| **Elevation band(s)** | ELEV-LOWLAND |
| **Typical elevation** | 100-2,000 ft (30-610 m) |
| **Dominant vegetation** | Oregon white oak (*Quercus garryana*), camas (*Camassia quamash*), Roemer's fescue (*Festuca roemeri*), snowberry (*Symphoricarpos albus*), wild rose (*Rosa nutkana*) |
| **Indicator species** | Western bluebird (*Sialia mexicana*), Fender's blue butterfly (*Icaricia icarioides fenderi* -- ESA endangered), streaked horned lark (*Eremophila alpestris strigata* -- ESA threatened), western gray squirrel (*Sciurus griseus*) |
| **Primary threats** | Douglas-fir encroachment due to fire suppression, agricultural conversion, urban/suburban development, invasive grasses and shrubs displacing native prairie species |
| **Conservation status** | Critically endangered -- less than 2% of historical Willamette Valley prairie and less than 5% of historical oak woodland remains; most remnants under active restoration management |

**Description:** Oak woodland and prairie ecosystems were historically the dominant lowland vegetation of the Willamette Valley, Puget lowlands, and Georgia Basin, maintained by deliberate burning by Kalapuya, Chinook, Coast Salish, and other nations. The cessation of Indigenous fire management in the mid-1800s triggered rapid Douglas-fir invasion, and agricultural conversion eliminated most remaining prairie. These are among the most endangered ecosystems in North America, with multiple ESA-listed species (Fender's blue butterfly, Kincaid's lupine, streaked horned lark) restricted to tiny remnants of their former range.

---

## 3. Ecological Roles

Thirteen ecological roles that define functional positions within PNW ecosystems. Each species in the taxonomy modules is assigned one or more role IDs.

---

### ROLE-KEYSTONE: Keystone Species

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-KEYSTONE |
| **Definition** | A species whose impact on its ecosystem is disproportionately large relative to its abundance. Removal triggers cascading changes affecting many other species. |
| **PNW exemplar species** | Ochre sea star (*Pisaster ochraceus*), sea otter (*Enhydra lutris*), beaver (*Castor canadensis*) |
| **Ecosystem function** | Maintains community structure and biodiversity by regulating dominant competitors or creating habitat complexity. Keystone removal simplifies ecosystems and reduces species richness. |

---

### ROLE-APEX: Apex Predator

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-APEX |
| **Definition** | A top-level predator with no natural predators in its ecosystem. Exerts top-down control on prey populations, influencing community structure and behavior at multiple trophic levels. |
| **PNW exemplar species** | Orca/killer whale (*Orcinus orca*), gray wolf (*Canis lupus*), cougar (*Puma concolor*) |
| **Ecosystem function** | Regulates mesopredator and herbivore populations through direct predation and behaviorally mediated trophic cascades (the "ecology of fear"). Apex predator removal leads to mesopredator release and herbivore overabundance. |

---

### ROLE-MESOPREDATOR: Mesopredator

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-MESOPREDATOR |
| **Definition** | A mid-level predator that is both predator and prey. Population controlled by apex predators; can dominate when apex predators are removed (mesopredator release). |
| **PNW exemplar species** | Coyote (*Canis latrans*), great horned owl (*Bubo virginianus*), mink (*Neogale vison*) |
| **Ecosystem function** | Links upper and lower trophic levels. Controls small mammal, bird, and invertebrate populations. Mesopredator release (when apex predators are absent) can devastate ground-nesting birds, small mammals, and other vulnerable prey. |

---

### ROLE-PRIMARY-PRODUCER: Primary Producer

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-PRIMARY-PRODUCER |
| **Definition** | An organism that converts inorganic energy (sunlight, chemical compounds) into organic matter through photosynthesis or chemosynthesis, forming the base of the food web. |
| **PNW exemplar species** | Douglas-fir (*Pseudotsuga menziesii*), bull kelp (*Nereocystis luetkeana*), eelgrass (*Zostera marina*) |
| **Ecosystem function** | Fixes carbon, produces oxygen, and creates the energy base that supports all consumer trophic levels. In PNW forests, primary production exceeds 1,000 g C/m2/yr in old-growth stands. In marine systems, phytoplankton and kelp drive productivity. |

---

### ROLE-PRIMARY-CONSUMER: Primary Consumer (Herbivore)

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-PRIMARY-CONSUMER |
| **Definition** | An organism that feeds directly on primary producers (plants, algae, phytoplankton). Transfers energy from producers to higher trophic levels. |
| **PNW exemplar species** | Roosevelt elk (*Cervus canadensis roosevelti*), red sea urchin (*Mesocentrotus franciscanus*), mountain beaver (*Aplodontia rufa*) |
| **Ecosystem function** | Regulates plant community composition and structure through selective herbivory. Elk browsing maintains meadow openings; urchin grazing controls kelp abundance. Overabundant herbivores (deer, elk in predator-free areas) can suppress forest regeneration. |

---

### ROLE-SECONDARY-CONSUMER: Secondary Consumer

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-SECONDARY-CONSUMER |
| **Definition** | An organism that feeds on primary consumers, occupying the third trophic level. May also consume primary producers (omnivory). |
| **PNW exemplar species** | Chinook salmon (*Oncorhynchus tshawytscha*), northern spotted owl (*Strix occidentalis caurina*), Pacific giant octopus (*Enteroctopus dofleini*) |
| **Ecosystem function** | Controls herbivore populations and transfers energy to apex predators. Salmon as secondary consumers (feeding on invertebrates and small fish in the ocean) transport marine-derived nutrients into freshwater and terrestrial ecosystems when they spawn and die. |

---

### ROLE-POLLINATOR: Pollinator

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-POLLINATOR |
| **Definition** | An organism that transfers pollen between flowers, enabling sexual reproduction in flowering plants. Essential for fruit set and genetic diversity in plant populations. |
| **PNW exemplar species** | Rufous hummingbird (*Selasphorus rufus*), western bumblebee (*Bombus occidentalis*), Fender's blue butterfly (*Icaricia icarioides fenderi*) |
| **Ecosystem function** | Enables reproduction in 80%+ of flowering plant species. PNW pollinators include native bees (over 600 species), hummingbirds, butterflies, moths, flies, and beetles. Pollinator decline threatens both native plant reproduction and agricultural production (blueberries, cranberries, tree fruits). |

---

### ROLE-SEED-DISPERSER: Seed Disperser

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-SEED-DISPERSER |
| **Definition** | An organism that moves seeds away from parent plants, enabling colonization of new sites, gene flow between populations, and forest regeneration. |
| **PNW exemplar species** | Clark's nutcracker (*Nucifraga columbiana*), Steller's jay (*Cyanocitta stelleri*), black bear (*Ursus americanus*) |
| **Ecosystem function** | Drives forest regeneration and range expansion. Clark's nutcracker caches 30,000-100,000 whitebark pine seeds per year, and unretrieved caches germinate into new trees -- the nutcracker is the primary regeneration mechanism for whitebark pine. Bears disperse berry seeds through fecal deposition across large home ranges. |

---

### ROLE-ECOSYSTEM-ENGINEER: Ecosystem Engineer

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-ECOSYSTEM-ENGINEER |
| **Definition** | An organism that physically modifies, maintains, or creates habitat, thereby influencing the availability of resources for other species. |
| **PNW exemplar species** | North American beaver (*Castor canadensis*), Pacific lamprey (*Entosphenus tridentatus*), burrowing shrimp (*Neotrypaea californiensis*) |
| **Ecosystem function** | Creates habitat complexity that benefits multiple species. Beaver dams raise water tables, create wetlands, trap sediment, moderate stream temperatures, and increase salmonid rearing habitat by 200-300%. Pacific lamprey larvae bioturbate stream substrates, and their spawning carcasses provide marine-derived nutrients. |

---

### ROLE-DECOMPOSER: Decomposer

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-DECOMPOSER |
| **Definition** | An organism that breaks down dead organic matter, releasing nutrients back into the ecosystem. Drives nutrient cycling and soil formation. |
| **PNW exemplar species** | Turkey tail fungus (*Trametes versicolor*), Pacific banana slug (*Ariolimax columbianus*), red-backed vole (*Myodes californicus* -- disperses mycorrhizal fungal spores) |
| **Ecosystem function** | Closes the nutrient loop by converting dead biomass into soil nutrients available for plant uptake. In PNW old-growth forests, decomposition of a single large Douglas-fir log takes 200-500 years, during which it serves as substrate for over 1,500 species of fungi, invertebrates, mosses, and tree seedlings (nurse log function). |

---

### ROLE-INDICATOR: Indicator Species

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-INDICATOR |
| **Definition** | A species whose presence, absence, or condition reflects the health of its ecosystem. Used in monitoring programs to assess environmental quality. |
| **PNW exemplar species** | Bull trout (*Salvelinus confluentus* -- cold, clean water indicator), Letharia vulpina lichen (air quality indicator), tailed frog (*Ascaphus truei* -- stream health indicator) |
| **Ecosystem function** | Provides measurable signal of ecosystem condition. Bull trout require water temperatures below 54F (12C), dissolved oxygen above 7 mg/L, and clean gravels -- their presence confirms high-quality stream habitat. Lichen communities on old-growth trees indicate air quality; species richness declines predictably with nitrogen deposition and particulate pollution. |

---

### ROLE-FOUNDATION: Foundation Species

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-FOUNDATION |
| **Definition** | A species that defines the structure and character of an ecosystem, creating conditions that many other species depend on. Distinguished from keystone species by high abundance and biomass. |
| **PNW exemplar species** | Douglas-fir (*Pseudotsuga menziesii*), bull kelp (*Nereocystis luetkeana*), eelgrass (*Zostera marina*) |
| **Ecosystem function** | Creates the physical framework of the ecosystem. Douglas-fir forests, kelp forests, and eelgrass meadows each support hundreds of dependent species that cannot persist without the foundation species. Foundation species loss causes ecosystem-wide collapse rather than the species-specific cascades triggered by keystone loss. |

---

### ROLE-NURSE: Nurse Species

| Parameter | Value |
|-----------|-------|
| **Role ID** | ROLE-NURSE |
| **Definition** | A species that facilitates the establishment or survival of other species, typically by ameliorating harsh environmental conditions (shade, moisture, wind protection, soil improvement). |
| **PNW exemplar species** | Red alder (*Alnus rubra* -- nitrogen fixation enabling conifer establishment), nurse log (dead conifer providing seedbed), salmonberry (*Rubus spectabilis* -- stabilizing disturbed slopes for forest recovery) |
| **Ecosystem function** | Facilitates succession and community development. Red alder fixes 40-300 kg N/ha/yr, enriching soils depleted by disturbance and enabling Douglas-fir and western red cedar establishment. Nurse logs provide elevated, moss-covered seedbeds that lift conifer seedlings above competing vegetation and fungi-rich substrate, creating the distinctive colonnade root patterns visible in old-growth forests. |

---

## 4. Conservation Status Categories

Standardized conservation status framework used across all species profiles. Each species receives status designations from the applicable jurisdictional authorities.

---

### Federal: US Endangered Species Act (ESA)

| Status | Definition |
|--------|------------|
| **Endangered** | In danger of extinction throughout all or a significant portion of its range. Highest federal protection. |
| **Threatened** | Likely to become endangered in the foreseeable future. Protected with potential for tailored management rules (4(d) rules). |
| **Species of Concern** | Not formally listed but sufficient information exists to suggest listing may be warranted. No regulatory protection. |
| **Candidate** | Under active review for listing; sufficient information to propose listing but action precluded by higher priorities. |
| **Delisted** | Previously listed but removed due to recovery, taxonomy change, or data error. May retain monitoring obligations for 5+ years post-delisting. |

**DPS/ESU note:** For salmon and steelhead, ESA listings apply to Evolutionarily Significant Units (ESUs) or Distinct Population Segments (DPSs), not species-wide. A single species (e.g., Chinook salmon) may have some populations listed as Threatened while others are not listed.

---

### Washington State

| Status | Definition |
|--------|------------|
| **Endangered** | In danger of becoming extinct or extirpated in Washington. Listed by WDFW under WAC 232-12-014. |
| **Threatened** | Likely to become endangered in Washington within the foreseeable future. |
| **Sensitive** | Vulnerable or declining but not at immediate risk of extirpation. Identified by WDFW for monitoring. |
| **Candidate** | Under review for possible listing as Endangered, Threatened, or Sensitive. |

**Authority:** Washington Department of Fish and Wildlife (WDFW) manages state listings independently of federal ESA.

---

### Oregon State

| Status | Definition |
|--------|------------|
| **Endangered** | In danger of extinction throughout any significant portion of its range within Oregon. Listed by ODFW under ORS 496.172-192. |
| **Threatened** | Likely to become endangered in Oregon within the foreseeable future. |
| **Sensitive-Critical** | Species for which listing as Threatened or Endangered is pending; small or declining populations, restricted range, or declining habitat -- at immediate risk. |
| **Sensitive-Vulnerable** | Species with declining populations or habitat but not at immediate risk; may become Critical without management attention. |

**Authority:** Oregon Department of Fish and Wildlife (ODFW) manages state listings under the Oregon Endangered Species Act.

---

### IUCN Red List Categories

| Category | Abbreviation | Definition |
|----------|--------------|------------|
| **Extinct** | EX | No known individuals remaining. |
| **Extinct in the Wild** | EW | Survives only in cultivation or captivity. |
| **Critically Endangered** | CR | Extremely high risk of extinction in the wild. |
| **Endangered** | EN | Very high risk of extinction in the wild. |
| **Vulnerable** | VU | High risk of extinction in the wild. |
| **Near Threatened** | NT | Close to qualifying for a threatened category. |
| **Least Concern** | LC | Low risk; widespread and abundant. |
| **Data Deficient** | DD | Insufficient data for assessment. |
| **Not Evaluated** | NE | Not yet assessed against IUCN criteria. |

**Note:** IUCN assessments are global. A species may be LC globally but Endangered within a specific PNW jurisdiction.

---

### NatureServe Conservation Ranks

NatureServe assigns Global (G) and Subnational (S) conservation ranks that complement formal listing status.

| Rank | Meaning |
|------|---------|
| **G1 / S1** | Critically Imperiled -- at very high risk of extinction/extirpation (typically 5 or fewer occurrences or 1,000 or fewer individuals) |
| **G2 / S2** | Imperiled -- at high risk (6-20 occurrences or 1,000-3,000 individuals) |
| **G3 / S3** | Vulnerable -- at moderate risk (21-100 occurrences or 3,000-10,000 individuals) |
| **G4 / S4** | Apparently Secure -- uncommon but not rare; some cause for long-term concern |
| **G5 / S5** | Secure -- common, widespread, abundant |
| **GNR / SNR** | Not Ranked |
| **GNA / SNA** | Not Applicable (non-native or not a suitable target for conservation) |

**Qualifiers:**
- **T** suffix indicates a subspecies/variety rank (e.g., G5T2 = species is secure globally but the subspecies is imperiled)
- **Q** suffix indicates taxonomic uncertainty
- **?** suffix indicates rank uncertainty
- **Range ranks** (e.g., G2G3) indicate the rank falls between two values

**How to read:** A species ranked G5 S1 is common globally but critically imperiled in the specific state/province. This is common for species at the edge of their range in the PNW.

---

## 5. Cultural Significance Categories

Framework for documenting the cultural relationships between PNW species and the Indigenous nations that have managed, harvested, and co-evolved with these ecosystems for 10,000+ years. All cultural references in species profiles use these categories and **always name specific nations**.

---

### CULT-MATERIAL: Material Culture

Use of species in tools, structures, textiles, art, and watercraft. Material culture reflects deep knowledge of species properties -- strength, flexibility, rot resistance, workability -- developed over millennia.

**Examples:**
- **Western red cedar** (*Thuja plicata*): Coast Salish, Nuu-chah-nulth, Kwakwaka'wakw, Haida -- longhouses, canoes, bentwood boxes, clothing, rope, basketry. Cedar is central to Northwest Coast material culture; some Coast Salish nations refer to it as the "tree of life."
- **Mountain goat wool**: Tlingit, Coast Salish, Tsimshian -- Chilkat and Salish blanket weaving, among the most technically complex textiles in the world.
- **Elk antler and bone**: Chinook, Kalapuya, Klickitat -- wedges, awls, hide-working tools, composite toggling harpoons.

---

### CULT-FOOD-MEDICINE: Food/Medicine

Harvest, preparation, storage, and medicinal use of species. Food systems represent sophisticated ecological management sustained over millennia.

**Examples:**
- **Salmon** (all 5 Pacific species): All PNW nations -- the defining food resource of the region. First Salmon ceremonies (Lummi, Tulalip, Yakama, Nez Perce, and many others) honor the salmon's return and express reciprocal obligation.
- **Camas** (*Camassia quamash*): Kalapuya, Sahaptin, Nez Perce, Coast Salish -- pit-roasted bulb was a staple carbohydrate; Kalapuya management of Willamette Valley camas prairies through deliberate burning created the oak savanna landscape.
- **Devil's club** (*Oplopanax horridus*): Tlingit, Haida, Coast Salish, Nlaka'pamux -- medicine plant for respiratory ailments, spiritual protection, and purification. Specific preparation methods are culturally restricted knowledge.

---

### CULT-SPIRITUAL: Spiritual/Ceremonial

Species with spiritual significance, ceremonial roles, clan/crest associations, or cosmological meaning. These relationships are often the most sensitive culturally and must be referenced with care.

**Examples:**
- **Bald eagle** (*Haliaeetus leucocephalus*): Many PNW nations -- feathers used in ceremony; clan/crest animal for Tlingit, Haida, and Tsimshian Eagle moiety/clan. Eagle feather handling is governed by federal (BGEPA) and tribal law.
- **Orca/killer whale** (*Orcinus orca*): Coast Salish, Makah, Nuu-chah-nulth, Kwakwaka'wakw -- prominent crest animal, depicted in art, associated with family and community values. Southern Resident orcas hold deep cultural significance for Coast Salish nations.
- **Western red cedar** (*Thuja plicata*): Spiritual dimensions extend beyond material use -- cedar bark harvesting follows protocols of gratitude and selective harvest that embody reciprocal relationship with the living tree.

---

### CULT-TEK: Place-Based Knowledge (Traditional Ecological Knowledge)

Ecological observations, management systems, and land-use practices developed through sustained relationship with specific places and species over thousands of years. TEK encompasses phenological knowledge, species behavior, population trends, and ecosystem dynamics.

**Examples:**
- **Makah Nation** -- Centuries of observation of gray whale migration timing, behavior, and population structure, refined into the whaling practices documented at Ozette Village (3,000+ year archaeological record).
- **Lummi Nation** -- Traditional reef net fishing technology at specific reef net sites represents precise understanding of salmon migration routes, tidal currents, and seasonal timing.
- **Confederated Tribes of Warm Springs** -- Fire management knowledge for maintaining huckleberry fields, oak woodland, and meadow habitat in the eastern Cascades, now being reintegrated into federal land management.

---

### CULT-MANAGEMENT: Management Practice

Active ecosystem management practices that shaped PNW landscapes for millennia before European colonization. These are not passive observation but deliberate intervention to maintain productivity, biodiversity, and cultural resources.

**Examples:**
- **Cultural burning**: Kalapuya (Willamette Valley prairies), Coast Salish (Puget lowland prairies), Yakama and Klickitat (eastern Cascades huckleberry fields) -- low-intensity broadcast fire on 1-5 year rotations maintained oak savanna, prairie, and berry-producing habitats. The cessation of Indigenous burning after the 1850s is the primary cause of Douglas-fir encroachment into prairie and oak woodland.
- **Reef net fishing**: Lummi, Samish -- fixed-position net systems at specific sites in the San Juan Islands, designed to selectively harvest sockeye salmon while allowing other species to pass. A technology of precision and restraint.
- **Camas garden management**: Kalapuya, Chinook, Nez Perce -- selective harvest that left small bulbs to regrow, combined with fire management to suppress woody encroachment and maintain camas productivity. These were managed landscapes, not wild harvest.
- **Clam garden construction**: Coast Salish, Kwakwaka'wakw, Heiltsuk -- rock-walled terraces in the intertidal zone that expand productive clam habitat, increase clam growth rates, and concentrate harvest. Clam gardens are examples of marine permaculture.

---

### Data Sovereignty and Ethical Framework

All cultural significance references in this project adhere to the following principles:

**OCAP Principles** (Ownership, Control, Access, Possession): First Nations own information about their peoples and communities. Cultural knowledge referenced in species profiles comes from publicly available, community-authorized sources. Culturally restricted knowledge (specific ceremonial practices, medicine preparation details, sacred site locations) is never included.

**CARE Principles** (Collective Benefit, Authority to Control, Responsibility, Ethics): Data and knowledge from Indigenous communities should benefit those communities. Species profiles reference cultural significance to honor these relationships, not to appropriate or commodify them.

**UNDRIP** (UN Declaration on the Rights of Indigenous Peoples): Indigenous peoples have the right to maintain, control, protect, and develop their cultural heritage, traditional knowledge, and traditional cultural expressions.

**In practice:** Species profiles name specific nations. Cultural references cite publicly available sources (published ethnobotanies, museum collections with tribal authorization, tribal government publications, peer-reviewed ethnoecology). When a cultural reference could be sensitive, the profile notes "culturally significant -- consult [Nation] cultural resources" rather than including restricted details.

---

## 6. Species Profile Template

Standardized template for all species profiles across all six taxonomy modules. Every profile follows this format exactly to ensure consistency and enable cross-module referencing.

---

```
### [Common Name] (*Scientific Name*)

**Taxonomy:** [Order] > [Family]
**Elevation Band:** [ELEV-ID(s)]
**Habitat:** [HAB-ID(s)]
**Ecological Role:** [ROLE-ID(s)]
**Conservation Status:** [Federal | State | IUCN]

**Description:** [2-3 sentences on identification, size, distinguishing features]

**Elevation Range:** [feet range] ([Minecraft Y range])
**Distribution:** [PNW-specific range description]

**Ecological Significance:**
[2-3 sentences on role in ecosystem, key relationships]

**Threats:** [Primary threats with brief explanation]

**Cultural Significance:** [If applicable -- nation-specific reference]
**Heritage Skills Cross-Reference:** [Badge trail reference if applicable]

**Key Sources:** [2-3 primary citations using source IDs]

**Cross-Module References:**
- [Links to related species/networks in other modules]
```

---

### Template Usage Notes

**Field requirements:**
- **Taxonomy, Elevation Band, Habitat, Ecological Role, Conservation Status, Description, Elevation Range, Distribution, Ecological Significance, Threats, Key Sources** -- required for all species.
- **Cultural Significance** -- include when documented; use "Not specifically documented in available sources" when no published reference exists. Never fabricate cultural associations.
- **Heritage Skills Cross-Reference** -- include when a Heritage Bridge badge trail connection exists; omit otherwise.
- **Cross-Module References** -- required; minimum one cross-reference to another module. Format: `See [module-name]: [species/network name]`.

**ID usage:**
- Use multiple IDs when a species spans multiple bands/habitats/roles. Example: `**Elevation Band:** ELEV-LOWLAND, ELEV-MONTANE`
- IDs are always the canonical forms defined in this document (e.g., ELEV-ALPINE, HAB-KELP, ROLE-KEYSTONE).

**Conservation Status format:**
- Federal listing first, then relevant state (WA or OR), then IUCN if assessed.
- Example: `Federal ESA Threatened | WA State Threatened | IUCN EN`
- If not listed: `Not listed | WA Not listed | IUCN LC`

**Source citation format:**
- Use source IDs from the project source index (e.g., GOV-01, PR-01, TRIBAL-01).
- Each profile must cite a minimum of 2 sources.

**Cross-module format examples:**
- `See flora: Western red cedar (foundation species)`
- `See networks: Mycorrhizal Network (nutrient exchange partner)`
- `See aquatic: Bull trout (cold-water indicator, shared habitat)`

---

### Example Profile (for reference)

### Northern Spotted Owl (*Strix occidentalis caurina*)

**Taxonomy:** Strigiformes > Strigidae
**Elevation Band:** ELEV-LOWLAND, ELEV-MONTANE
**Habitat:** HAB-OLD-GROWTH
**Ecological Role:** ROLE-SECONDARY-CONSUMER, ROLE-INDICATOR
**Conservation Status:** Federal ESA Threatened | WA State Endangered | OR State Threatened | IUCN NT

**Description:** Medium-large owl (16-19 in, wingspan 42 in) with dark brown plumage spotted with white on head, breast, and back. Dark eyes (unlike barred owl's dark brown eyes). Lacks ear tufts. Nocturnal hunter with asymmetric ears for sound localization.

**Elevation Range:** 500-5,000 ft (y=-29-84)
**Distribution:** Old-growth and mature conifer forests from southwestern BC through western WA and OR to northwestern CA. Requires large territories (2,500-12,000 acres per pair depending on habitat quality).

**Ecological Significance:**
The northern spotted owl is the defining indicator species for old-growth forest health in the PNW. Its population decline drove the Northwest Forest Plan (1994), the largest ecosystem-scale conservation plan in US history. Spotted owls require large-diameter trees with broken tops for nesting and complex forest structure for hunting flying squirrels and woodrats.

**Threats:** Habitat loss from historical logging; competition and hybridization with invasive barred owl (*Strix varia*); barred owl is now the primary threat, having expanded from eastern North America into all PNW spotted owl habitat since the 1950s.

**Cultural Significance:** Significant in several Coast Salish and Sahaptin oral traditions. The owl's association with old-growth forest aligns with Indigenous relationships to ancient forest stands.
**Heritage Skills Cross-Reference:** Forest Stewardship badge trail -- old-growth indicator species module.

**Key Sources:** GOV-02 (USFS Northwest Forest Plan monitoring), PR-03 (spotted owl demography studies), GOV-05 (USFWS recovery plan)

**Cross-Module References:**
- See flora: Douglas-fir, western hemlock (nesting/hunting habitat)
- See fauna: Barred owl (invasive competitor), Northern flying squirrel (primary prey)
- See networks: Old-growth food web (apex nocturnal predator node)

---

## Appendix A: Quick Reference Tables

### Elevation Band Summary

| Band ID | Name | Elevation (ft) | Elevation (m) | Minecraft Y | Key Character |
|---------|------|----------------|---------------|-------------|---------------|
| ELEV-ALPINE | Arctic-Alpine | 9,500-14,410 | 2,896-4,392 | 196-319 | Krummholz, rock, ice |
| ELEV-SUBALPINE | Subalpine | 5,000-9,500 | 1,524-2,896 | 84-196 | Parkland, deep snow |
| ELEV-MONTANE | Montane | 3,000-5,000 | 914-1,524 | 34-84 | Silver fir, rain-snow |
| ELEV-LOWLAND | Lowland Forest | 500-3,000 | 152-914 | -29-34 | Douglas-fir, cedar |
| ELEV-RIPARIAN | Riparian/Estuary | 0-500 | 0-152 | -41--29 | Alder, estuary, salmon |
| ELEV-INTERTIDAL | Intertidal | -15-0 | -4.6-0 | -41 | Tidal zonation |
| ELEV-SHALLOW-MARINE | Shallow Marine | -200--15 | -61--4.6 | -46--41 | Kelp, eelgrass |
| ELEV-DEEP-MARINE | Deep Marine | -930--200 | -283--61 | -64--46 | Basins, cold coral |

### Habitat Type Summary

| Habitat ID | Name | Primary Band(s) |
|------------|------|-----------------|
| HAB-OLD-GROWTH | Old-Growth Conifer Forest | LOWLAND, MONTANE |
| HAB-SECOND-GROWTH | Second-Growth Conifer Forest | LOWLAND, MONTANE |
| HAB-ALPINE-MEADOW | Alpine Meadow | ALPINE, SUBALPINE |
| HAB-SUBALPINE-PARKLAND | Subalpine Parkland | SUBALPINE |
| HAB-RIPARIAN | Riparian Corridor | RIPARIAN, LOWLAND, MONTANE |
| HAB-STREAM | Freshwater Stream/River | RIPARIAN, LOWLAND, MONTANE, SUBALPINE |
| HAB-LAKE | Freshwater Lake | LOWLAND, MONTANE, SUBALPINE, ALPINE |
| HAB-WETLAND | Wetland/Bog | RIPARIAN, LOWLAND, MONTANE |
| HAB-ROCKY-INTERTIDAL | Rocky Intertidal | INTERTIDAL |
| HAB-SANDY-BEACH | Sandy Beach | INTERTIDAL, RIPARIAN |
| HAB-EELGRASS | Eelgrass Meadow | SHALLOW-MARINE, INTERTIDAL |
| HAB-KELP | Kelp Forest | SHALLOW-MARINE |
| HAB-PELAGIC | Open Pelagic | SHALLOW-MARINE, DEEP-MARINE |
| HAB-DEEP-BASIN | Deep Basin | DEEP-MARINE |
| HAB-VOLCANIC | Volcanic/Geothermal | ALPINE, SUBALPINE, MONTANE |
| HAB-URBAN | Urban Interface | LOWLAND, RIPARIAN |
| HAB-OAK-PRAIRIE | Oak Woodland/Prairie | LOWLAND |

### Ecological Role Summary

| Role ID | Name | Trophic Position |
|---------|------|-----------------|
| ROLE-KEYSTONE | Keystone Species | Variable |
| ROLE-APEX | Apex Predator | Top |
| ROLE-MESOPREDATOR | Mesopredator | Mid |
| ROLE-PRIMARY-PRODUCER | Primary Producer | Base |
| ROLE-PRIMARY-CONSUMER | Primary Consumer | Second |
| ROLE-SECONDARY-CONSUMER | Secondary Consumer | Third |
| ROLE-POLLINATOR | Pollinator | Variable |
| ROLE-SEED-DISPERSER | Seed Disperser | Variable |
| ROLE-ECOSYSTEM-ENGINEER | Ecosystem Engineer | Variable |
| ROLE-DECOMPOSER | Decomposer | Base |
| ROLE-INDICATOR | Indicator Species | Variable |
| ROLE-FOUNDATION | Foundation Species | Base |
| ROLE-NURSE | Nurse Species | Variable |

---

## Appendix B: Cross-Module Reference Map

The six taxonomy modules and their primary interconnections:

| Module | Scope | Key Cross-References |
|--------|-------|---------------------|
| **Flora** | Vascular plants, bryophytes, lichens | Foundation species for fauna habitat; mycorrhizal network partners; cultural plant use |
| **Fauna** | Mammals, birds, reptiles, amphibians | Pollinators/dispersers for flora; prey/predator relationships; indicator species |
| **Fungi** | Macrofungi, mycorrhizae, decomposers | Mycorrhizal partnerships with flora; decomposition of fauna/flora; nurse log function |
| **Aquatic** | Fish, marine invertebrates, marine mammals | Kelp/eelgrass as foundation (flora overlap); marine-terrestrial nutrient transport; cultural fisheries |
| **Invertebrates** | Terrestrial insects, arachnids, mollusks | Pollinators for flora; prey base for fauna; decomposition partners with fungi |
| **Networks** | Food webs, nutrient cycles, trophic cascades | Integrates all modules; documents relationships, energy flows, and cascade dynamics |

**Referencing convention:** When a species profile in one module references a species in another module, use the format: `See [module]: [species common name] ([relationship])`.

---

*Document version: 1.0*
*Created for: PNW Living Systems Taxonomy & Chipset (ECO mission)*
*Scope: Shared foundation for all Wave 1 taxonomy research agents*
