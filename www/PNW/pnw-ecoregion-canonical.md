# PNW Ecoregion Canonical Reference

> **Status:** Canonical — authoritative reference for all PNW mission modules
>
> **Resolves:** B-2 blocker — shared ecoregion schema for AVI and MAM missions
>
> **Governed by:** ECO coordinate system (`silicon.yaml`, `coordinate-projection.md`)
>
> **Formula:** `Y = round((elevation_ft / 40.05) - 41)`
>
> **Coordinate constants:** Sea level = y=-41 | Summit (Mt. Rainier, 14,410 ft) = y=319 | Bedrock (Puget Sound floor, -930 ft) = y=-64 | Scale = 40.05 ft/block

---

## Master Table: 11 Ecoregion Bands

| # | Band ID | Elevation Range | Depth (marine) | Minecraft Y | Precipitation | Dominant Vegetation/Habitat | AVI Guilds | MAM Groups |
|---|---------|----------------|----------------|-------------|---------------|-----------------------------|------------|------------|
| 1 | ELEV-ALPINE | 6,500–14,410 ft | — | y=121–319 | 80–150 in (mostly snow) | Krummholz, fellfield, permanent snowfield, glacial ice | Rosy-finch guild, ptarmigan guild | Pikas, marmots, mountain goats |
| 2 | ELEV-SUBALPINE | 4,500–6,500 ft | — | y=71–121 | 70–140 in (deep snowpack) | Subalpine fir, mountain hemlock, parkland meadows | Subalpine parkland guild, Clark's nutcracker guild | Marmots, pikas, black bears (summer foraging) |
| 3 | ELEV-MONTANE | 2,000–4,500 ft | — | y=9–71 | 60–120 in (rain-snow transition) | Pacific silver fir, noble fir, dense montane conifer | Old-growth obligate guild (spotted owl, murrelet) | Martens, fishers, black bears, deer |
| 4 | ELEV-LOWLAND | 500–2,000 ft | — | y=-29–9 | 35–100 in (predominantly rain) | Douglas-fir, western red cedar, western hemlock old-growth | Forest interior guild, raptor guild | Elk, deer, black bears, cougars |
| 5 | ELEV-RIPARIAN | Cross-cutting, all elevations | — | y=-64–319 | Corridor variable | Red alder, cottonwood, willow, estuarine wetlands | Riparian specialist guild (dipper, heron) | Beaver, otter, mink, salmon-dependent mammals |
| 6 | ELEV-COASTAL | Sea level–500 ft (coastal influence) | — | y=-41–-29 | 60–120 in + marine fog | Sitka spruce, red alder, coastal meadow, dunes | Coastal forest guild, shorebird guild | Harbor seals (haul-out), mink, river otter |
| 7 | ELEV-SHRUB-STEPPE | 500–3,000 ft (east Cascades rain shadow) | — | y=-29–34 | 8–18 in (semi-arid) | Sagebrush (*Artemisia tridentata*), bunchgrass (*Pseudoroegneria spicata*) | Shrub-steppe guild (sage thrasher, horned lark) | Ground squirrels, jackrabbits, badgers, pronghorn |
| 8 | ELEV-SUBTERRANEAN | Cross-cutting, subsurface (fossorial/cave) | — | y=-64–319 | N/A (subsurface) | Cave systems, lava tubes, talus interstices, subnivean | Cave-roosting guild (bats), subnivean void users | Bats (Chiroptera), fossorial shrews, pikas (talus) |
| 9 | ELEV-INTERTIDAL | -15–0 ft relative to MLLW | 0–4.6 m | y=-41 (sub-block) | Marine; salinity 28–33 ppt | Rockweed, sea lettuce, surfgrass, mussel beds, barnacle zones | Shorebird guild, wading guild, seaduck guild | Harbor seals (foraging), sea otters (transition) |
| 10 | ELEV-SHALLOW-MARINE | Sea level–200 m depth | 0–200 m | y=-57–-41 | Marine; salinity 30–34 ppt | Bull kelp, eelgrass, rocky reef, sandy bottom | Alcid guild, diving duck guild, marine raptor guild | Harbour seal, Steller sea lion, sea otter (primary zone) |
| 11 | ELEV-DEEP-MARINE | 200 m+ depth (to -930 ft/283 m Puget max) | 200–283 m | y=-64–-57 | Marine; salinity 33–35 ppt | Glass sponge, cold-water coral, soft sediment benthic | Pelagic diving guild (murres at depth) | Harbour porpoise (foraging), deep-diving seals |

---

## Per-Band Detail

---

### Band 1: ELEV-ALPINE

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-ALPINE |
| **Elevation range** | 6,500–14,410 ft (1,981–4,392 m) |
| **Minecraft Y range** | y=121 to y=319 |
| **Precipitation** | 80–150 in/yr (2,032–3,810 mm); predominantly snow; 200+ in snowpack on volcanic peaks (Paradise, Mt. Rainier) |
| **Dominant vegetation/habitat** | Krummholz subalpine fir and whitebark pine (6,500–7,500 ft); alpine fellfield with cushion plants (7,500–9,500 ft); permanent snowfield and glacial ice (above ~10,000 ft on major peaks) |
| **Key indicator species** | Whitebark pine (*Pinus albicaulis*); alpine phlox (*Phlox diffusa*); Lyall's lupine (*Lupinus lyallii*) |
| **AVI relevance** | **Rosy-finch guild:** Gray-crowned rosy-finch (*Leucosticte tephrocotis*) forages on snowfields and talus year-round; nests in rock crevices above 8,000 ft. **Ptarmigan guild:** White-tailed ptarmigan (*Lagopus leucura*) resident above treeline; molts to white plumage in winter; uses krummholz for thermal cover. **Pipit guild:** American pipit (*Anthus rubescens*) breeds in alpine meadows and fellfields, forages on snowfield margins. |
| **MAM relevance** | **Pikas (Lagomorpha):** American pika (*Ochotona princeps*) obligate talus dweller, does not hibernate; haypile caching behavior; climate-vulnerable indicator. **Hoary marmot (*Marmota caligata*):** large colonial hibernator in boulder fields; alarm whistles structure predator behavior. **Mountain goat (*Oreamnos americanus*):** year-round resident on cliffs and steep terrain above 6,000 ft; mineral lick behavior; indicator of alpine structural integrity. |
| **Cross-band notes** | Feeds into ELEV-RIPARIAN via glacial meltwater headwaters. Whitebark pine seeds dispersed by Clark's nutcracker (ELEV-SUBALPINE link). |

---

### Band 2: ELEV-SUBALPINE

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-SUBALPINE |
| **Elevation range** | 4,500–6,500 ft (1,372–1,981 m) |
| **Minecraft Y range** | y=71 to y=121 |
| **Precipitation** | 70–140 in/yr (1,778–3,556 mm); deep winter snowpack (10–20 ft); snowpack persists to July–August |
| **Dominant vegetation/habitat** | Subalpine fir (*Abies lasiocarpa*), mountain hemlock (*Tsuga mertensiana*), Alaska yellow cedar (*Callitropsis nootkatensis*); subalpine meadows with avalanche lily (*Erythronium montanum*), bear grass (*Xerophyllum tenax*), huckleberry (*Vaccinium* spp.); parkland mosaic of tree clumps and meadow openings |
| **Key indicator species** | Subalpine fir (*Abies lasiocarpa*); mountain hemlock (*Tsuga mertensiana*); Clark's nutcracker (*Nucifraga columbiana*) |
| **AVI relevance** | **Clark's nutcracker guild:** Clark's nutcracker is keystone seed disperser for whitebark pine; caches 20,000–30,000 seeds/yr; seed caching drives post-fire whitebark pine regeneration. **Subalpine parkland guild:** Hermit thrush (*Catharus guttatus*), ruby-crowned kinglet (*Corthylio calendula*), Steller's jay (*Cyanocitta stelleri*) nest in subalpine forest. **Grouse guild:** Spruce grouse (*Canachites canadensis*) and dusky grouse (*Dendragapus obscurus*) resident year-round; use subalpine fir needles as primary winter food. |
| **MAM relevance** | **Hoary marmot (*Marmota caligata*):** dominant subalpine herbivore, colonial, 8-month hibernation, critical prey for golden eagles and coyotes at this elevation. **Pika (*Ochotona princeps*):** lower talus margins into subalpine; haypile construction September–October. **Black bear (*Ursus americanus*):** peak summer foraging zone — huckleberries, whitebark pine seeds, ground squirrels; pre-denning hyperphagia in subalpine meadows August–September. **Pacific marten (*Martes caurina*):** montane-subalpine mesopredator; subnivean hunting in winter. |
| **Cross-band notes** | Feeds into ELEV-ALPINE at upper margin; transitions to ELEV-MONTANE below 4,500 ft. Clark's nutcracker link bridges ELEV-ALPINE and ELEV-SUBALPINE for whitebark pine regeneration. |

---

### Band 3: ELEV-MONTANE

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-MONTANE |
| **Elevation range** | 2,000–4,500 ft (610–1,372 m) |
| **Minecraft Y range** | y=9 to y=71 |
| **Precipitation** | 60–120 in/yr (1,524–3,048 mm); rain-snow transition zone; rain-on-snow events drive major flood pulses |
| **Dominant vegetation/habitat** | Pacific silver fir (*Abies amabilis*), noble fir (*Abies procera*), western white pine (*Pinus monticola*); vine maple (*Acer circinatum*) understory; montane meadows in cold-air drainage basins; Andisol and Spodosol soils over volcanic parent material |
| **Key indicator species** | Pacific silver fir (*Abies amabilis*); northern spotted owl (*Strix occidentalis caurina*); Pacific marten (*Martes caurina*) |
| **AVI relevance** | **Old-growth obligate guild:** Northern spotted owl (*Strix occidentalis caurina*) requires old-growth structure with complex canopy; primary nesting zone in Pacific silver fir belt. Marbled murrelet (*Brachyramphus marmoratus*) nests on wide, moss-covered limbs of old-growth conifers 2,000–4,000 ft; feeds in marine zone (ELEV-SHALLOW-MARINE). **Corvid guild:** Steller's jay, gray jay (*Perisoreus canadensis*) resident year-round; gray jay caches food in bark of subalpine and montane conifers. **Owl guild:** Barred owl (*Strix varia*) expanding into this zone, displacing spotted owl. |
| **MAM relevance** | **Pacific marten (*Martes caurina*):** primary elevation zone; old-growth obligate; downed wood denning; indicator of forest connectivity. **Pacific fisher (*Pekania pennanti*):** overlaps montane zone 3,000–5,000 ft; hollow-tree denning; porcupine predator. **Black-tailed deer (*Odocoileus hemionus columbianus*):** summer range in montane; winter migration to lowland. **American black bear (*Ursus americanus*):** year-round use; den sites in large hollow trees; spring foraging on skunk cabbage and early forbs. |
| **Cross-band notes** | Marbled murrelet links ELEV-MONTANE (nesting) to ELEV-SHALLOW-MARINE (foraging) — key AVI cross-band dependency. Spotted owl territory spans ELEV-MONTANE and upper ELEV-LOWLAND. |

---

### Band 4: ELEV-LOWLAND

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-LOWLAND |
| **Elevation range** | 500–2,000 ft (152–610 m) |
| **Minecraft Y range** | y=-29 to y=9 |
| **Precipitation** | 35–100 in/yr (889–2,540 mm); predominantly rain west of Cascades; occasional snow events below 1,500 ft; summer maritime fog on coastal slopes |
| **Dominant vegetation/habitat** | Douglas-fir (*Pseudotsuga menziesii*) dominant on well-drained slopes; western red cedar (*Thuja plicata*) in moist draws; western hemlock (*Tsuga heterophylla*) as climax dominant; bigleaf maple (*Acer macrophyllum*) and red alder in disturbed zones; sword fern (*Polystichum munitum*) and salal (*Gaultheria shallon*) understory; highest biomass density of any terrestrial ecosystem on Earth in old-growth stands |
| **Key indicator species** | Douglas-fir (*Pseudotsuga menziesii*); northern spotted owl (*Strix occidentalis caurina*); Roosevelt elk (*Cervus canadensis roosevelti*) |
| **AVI relevance** | **Forest interior guild:** Northern spotted owl, pileated woodpecker (*Dryocopus pileatus*), brown creeper (*Certhia americana*), winter wren (*Troglodytes hiemalis*) all require closed-canopy old-growth structure. **Raptor guild:** Red-tailed hawk (*Buteo jamaicensis*), Cooper's hawk (*Accipiter cooperii*) hunt forest edges. **Corvid guild:** Common raven (*Corvus corax*), Steller's jay resident; track ungulate carcasses and logging slash. **Wintering guild:** Large influxes of varied thrush (*Ixoreus naevius*), golden-crowned sparrow (*Zonotrichia atricapilla*) November–March. |
| **MAM relevance** | **Roosevelt elk (*Cervus canadensis roosevelti*):** primary resident large ungulate; old-growth conifer provides thermal cover; low-elevation herds winter in valley bottoms; bulls up to 1,200 lbs. **Cougar (*Puma concolor*):** primary range 500–6,000 ft; ambush predator on deer and elk; landscape of fear dynamics. **Black-tailed deer (*Odocoileus hemionus columbianus*):** year-round lowland resident; primary prey for cougar. **Northern flying squirrel (*Glaucomys sabrinus*):** nocturnal; truffle disperser via consumption and defecation; links mycorrhizal network to canopy food web. |
| **Cross-band notes** | Most heavily logged band in PNW (>90% of old-growth removed since 1850). Conservation of remaining stands in Olympic, North Cascades, and Gifford Pinchot NF is priority for old-growth obligate guilds. |

---

### Band 5: ELEV-RIPARIAN

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-RIPARIAN |
| **Elevation range** | Cross-cutting — present at all elevations; character shifts from glacier-fed headwaters (ELEV-ALPINE) to tidal estuary (ELEV-COASTAL) |
| **Minecraft Y range** | y=-64 to y=319 (cross-cutting) |
| **Precipitation** | Corridor precipitation matches adjacent upland band; riparian zones receive additional moisture from stream channel and groundwater |
| **Dominant vegetation/habitat** | **Headwater (ELEV-ALPINE/SUBALPINE):** Mountain alder (*Alnus incana*), willow (*Salix* spp.), streambank bryophytes. **Montane/Lowland:** Black cottonwood (*Populus trichocarpa*), red alder (*Alnus rubra*), salmonberry (*Rubus spectabilis*), devil's club (*Oplopanax horridus*). **Estuary (ELEV-COASTAL):** Sitka spruce (*Picea sitchensis*), sedge (*Carex* spp.), skunk cabbage (*Lysichiton americanus*), saltmarsh grass (*Distichlis spicata*) |
| **Key indicator species** | American dipper (*Cinclus mexicanus*); Chinook salmon (*Oncorhynchus tshawytscha*); North American beaver (*Castor canadensis*) |
| **AVI relevance** | **Riparian specialist guild:** American dipper (*Cinclus mexicanus*) — only North American songbird that walks underwater; indicator of stream invertebrate density and water quality from alpine to lowland. Great blue heron (*Ardea herodias*) forages at all elevations along water. Belted kingfisher (*Megaceryle alcyon*) along all lowland streams. **Warbler guild:** Yellow warbler (*Setophaga petechia*), MacGillivray's warbler (*Geothlypis tolmiei*), common yellowthroat (*Geothlypis trichas*) in riparian shrub layer. **Waterfowl guild:** Mallard, wood duck (*Aix sponsa*), hooded merganser (*Lophodytes cucullatus*) in beaver ponds and slow reaches. |
| **MAM relevance** | **North American beaver (*Castor canadensis*):** keystone engineer; dam complexes create wetland mosaics that raise water tables, retain sediment, and create fish rearing habitat; absent from most of the PNW into the 1800s; recolonizing with active restoration programs. **River otter (*Lontra canadensis*):** cross-band forager from freshwater to salt water; tracks fish runs. **Mink (*Neogale vison*):** semi-aquatic; lowland and coastal riparian specialist; PCB accumulation indicator. **American black bear (*Ursus americanus*):** salmon foraging in all riparian zones during spawning runs; marine nutrient vector into forest. |
| **Cross-band notes** | Every anadromous salmon and steelhead passes through ELEV-RIPARIAN during both juvenile outmigration and adult return. The salmon-bear-tree nutrient pathway originates in ELEV-SHALLOW-MARINE and terminates in ELEV-MONTANE forest stands via this corridor. |

---

### Band 6: ELEV-COASTAL

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-COASTAL |
| **Elevation range** | Sea level–500 ft (0–152 m); coastal influence zone (within ~50 miles of Pacific coast or Puget Sound shoreline) |
| **Minecraft Y range** | y=-41 to y=-29 |
| **Precipitation** | 60–120 in/yr (1,524–3,048 mm) on outer coast; lower in Puget Sound rain shadow; persistent summer marine fog adds 10–30 in equivalent moisture |
| **Dominant vegetation/habitat** | Sitka spruce (*Picea sitchensis*) dominant in fog belt (outer coast); red alder (*Alnus rubra*) on disturbed sites; shore pine (*Pinus contorta* var. *contorta*) on dunes; coastal dune grass (*Ammophila arenaria*), beach strawberry (*Fragaria chiloensis*), dune sedge (*Carex pansa*); saltmarsh in sheltered bays |
| **Key indicator species** | Sitka spruce (*Picea sitchensis*); Dungeness crab (*Metacarcinus magister*; juvenile habitat link); harbor seal (*Phoca vitulina*) |
| **AVI relevance** | **Coastal forest guild:** Chestnut-backed chickadee (*Poecile rufescens*), Pacific wren (*Troglodytes pacificus*), Townsend's warbler (*Setophaga townsendi*) resident in Sitka spruce belt. **Shorebird guild:** Dunlin (*Calidris alpina*), western sandpiper (*Calidris mauri*), least sandpiper (*Calidris minutilla*) use tidal flats and coastal marshes on migration (major Pacific Flyway stopover). **Seabird colony guild:** Tufted puffin (*Fratercula cirrhata*), common murre (*Uria aalge*), pelagic cormorant (*Urile pelagicus*) nest on coastal sea stacks. **Raptor guild:** Bald eagle (*Haliaeetus leucocephalus*) concentrates on coast for marine prey; peregrine falcon (*Falco peregrinus*) nests on coastal cliffs. |
| **MAM relevance** | **Harbor seal (*Phoca vitulina*):** haul-out sites on beaches and rocky shores; pupping (May–July) on protected beaches; forages in nearshore and estuarine waters. **Steller sea lion (*Eumetopias jubatus*):** coastal haul-outs on rock islets; winter–spring resident on outer coast. **Mink (*Neogale vison*):** coastal riparian and shoreline predator; saltmarsh forager. **River otter (*Lontra canadensis*):** occupies coastal estuaries and kelp edge year-round. |
| **Cross-band notes** | The Sitka spruce fog belt is ecologically distinct from interior lowland forest — restricted to outer 30–50 miles of coast. Estuarine areas within this band are critical salmon juvenile rearing habitat (ELEV-RIPARIAN link). |

---

### Band 7: ELEV-SHRUB-STEPPE

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-SHRUB-STEPPE |
| **Elevation range** | 500–3,000 ft (152–914 m) on the east side of the Cascade Crest; rain shadow zone |
| **Minecraft Y range** | y=-29 to y=34 |
| **Precipitation** | 8–18 in/yr (203–457 mm); continental climate; hot dry summers, cold winters; occasional summer thunderstorm |
| **Dominant vegetation/habitat** | Big sagebrush (*Artemisia tridentata*) dominant on well-drained slopes; bluebunch wheatgrass (*Pseudoroegneria spicata*) and Idaho fescue (*Festuca idahoensis*) bunchgrass steppe; antelope bitterbrush (*Purshia tridentata*); rabbit brush (*Ericameria nauseosa*) on disturbed sites; black cottonwood riparian corridors along Columbia River tributaries |
| **Key indicator species** | Big sagebrush (*Artemisia tridentata*); Columbian ground squirrel (*Urocitellus columbianus*); sage grouse (*Centrocercus urophasianus*) |
| **AVI relevance** | **Shrub-steppe guild:** Sage thrasher (*Oreoscoptes montanus*), sagebrush sparrow (*Artemisiospiza nevadensis*), Brewer's sparrow (*Spizella breweri*) are sagebrush obligates; all declining with sagebrush loss to cheatgrass (*Bromus tectorum*) invasion. **Horned lark guild:** Horned lark (*Eremophila alpestris*) is most abundant open-country bird east of Cascades; uses disturbed and bare-ground patches. **Raptor guild:** Ferruginous hawk (*Buteo regalis*), prairie falcon (*Falco mexicanus*), burrowing owl (*Athene cunicularia*) nest in steppe; Swainson's hawk (*Buteo swainsoni*) migrates through. **Grouse guild:** Greater sage-grouse (*Centrocercus urophasianus*) leks in shrub-steppe; declining indicator. |
| **MAM relevance** | **Columbian ground squirrel (*Urocitellus columbianus*):** colonial burrower; primary prey for badgers, prairie falcons, and ferruginous hawks; ecosystem engineer via burrowing. **American badger (*Taxidea taxus*):** fossorial predator on ground squirrels; PNW east side specialist. **Black-tailed jackrabbit (*Lepus californicus*):** open-steppe specialist in Columbia Basin; prey base for raptors. **Pronghorn (*Antilocapra americana*):** fastest North American land mammal; shrub-steppe obligate in east Oregon and Washington; recovering from near-extirpation. **Mule deer (*Odocoileus hemionus hemionus*):** east-side deer, seasonal migration from steppe (winter) to montane (summer). |
| **Cross-band notes** | Physiographically distinct from all west-side bands — rain shadow of the Cascades creates near-desert conditions. Invasive cheatgrass (*Bromus tectorum*) is replacing native bunchgrass and altering fire frequency, compressing shrub-steppe habitat. |

---

### Band 8: ELEV-SUBTERRANEAN

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-SUBTERRANEAN |
| **Elevation range** | Cross-cutting — subsurface environments at all elevations: talus systems (ELEV-ALPINE/SUBALPINE), lava tubes (ELEV-MONTANE/LOWLAND), karst cave systems, subnivean space (seasonal), fossorial burrow networks (ELEV-LOWLAND/SHRUB-STEPPE) |
| **Minecraft Y range** | y=-64 to y=319 (cross-cutting, subsurface voids within any band) |
| **Precipitation** | N/A; groundwater infiltration provides moisture; cave humidity typically 90–100%; subnivean space insulated at ~32°F |
| **Dominant vegetation/habitat** | No photosynthetic vegetation; trophic input from surface organic matter, guano deposition (bat roosts), root infiltration; cave invertebrates (isopods, amphipods, cave spiders); lava tube microbiomes; talus interstice microhabitat |
| **Key indicator species** | Little brown myotis (*Myotis lucifugus*); Townsend's big-eared bat (*Corynorhinus townsendii*); cave crayfish/amphipods (*Stygobromus* spp.) |
| **AVI relevance** | **Cave-roosting guild:** All bat species in PNW use roosting cavities from sea level to subalpine — tree cavities, rock crevices, caves, lava tubes, building voids. Cave-roosting guild is distinct from bat foraging guild (bats forage in all open-air ecoregions). Vaux's swift (*Chaetura vauxi*) roosts colonially in large hollow snags and chimneys — not true cave habitat but structurally analogous. Northern saw-whet owl (*Aegolius acadicus*) and northern pygmy-owl (*Glaucidium californicum*) use tree cavities. **Note:** No bird species are obligate cave nesters in PNW; cave-roosting guild = bats (Mammalia), not Aves. |
| **MAM relevance** | **Bats (Order Chiroptera) — 15 species in PNW:** Little brown myotis (*Myotis lucifugus*), Townsend's big-eared bat (*Corynorhinus townsendii* — cave obligate), big brown bat (*Eptesicus fuscus*), long-legged myotis (*Myotis volans*), California myotis (*Myotis californicus*). Townsend's big-eared bat requires caves and mines for hibernacula; White-nose Syndrome (*Pseudogymnoascus destructans*) is an existential threat. **Fossorial specialists:** Townsend's mole (*Scapanus townsendii*), common mole (*Scapanus orarius*) — underground burrow systems throughout lowland soils. Mountain beaver (*Aplodontia rufa*) — semi-fossorial, PNW endemic; burrow systems in moist lowland and montane habitats. **Subnivean specialists:** Pacific marten (*Martes caurina*) hunts in subnivean space (under snow) in winter months; snowshoe hare (*Lepus americanus*) uses subnivean corridors for predator avoidance. |
| **Cross-band notes** | ELEV-SUBTERRANEAN is uniquely critical for MAM mission: bat hibernacula are the defining constraint for MAM winter season modeling. Cave systems in Olympic and Cascade karst connect ELEV-LOWLAND surface hydrology to spring emergence. White-nose Syndrome status in each cave system must be tracked as a MAM mission safety parameter. |

---

### Band 9: ELEV-INTERTIDAL

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-INTERTIDAL |
| **Elevation range** | -15 ft to 0 ft (-4.6 m to 0 m relative to MLLW); tidal excursion zone |
| **Minecraft Y range** | y=-41 (entire intertidal zone collapses to <1 block at 40.05 ft/block scale; represent as y=-41 with sub-block annotation) |
| **Precipitation** | Marine; salinity 28–33 ppt (reduced near river mouths); organisms exposed to freshwater rain and desiccation during low tide |
| **Dominant vegetation/habitat** | **High intertidal:** Barnacles (*Balanus glandula*), periwinkles (*Littorina* spp.), rockweed (*Fucus distichus*). **Mid intertidal:** California mussel (*Mytilus californianus*), giant green anemone (*Anthopleura xanthogrammica*), ochre sea star (*Pisaster ochraceus*). **Low intertidal:** Bull kelp holdfast zone, surfgrass (*Phyllospadix* spp.), encrusting coralline algae, purple sea urchin (*Strongylocentrotus purpuratus*) |
| **Key indicator species** | Ochre sea star (*Pisaster ochraceus*); California mussel (*Mytilus californianus*); eelgrass (*Zostera marina*; upper intertidal fringe) |
| **AVI relevance** | **Shorebird guild:** Black oystercatcher (*Haematopus bachmani*) is intertidal obligate on rocky shores — nests on bare rock above high tide; forages exclusively on mussels, limpets, and chitons. Surfbird (*Calidris virgata*), wandering tattler (*Tringa incana*) forage on rocky intertidal during migration. **Wading guild:** Great blue heron (*Ardea herodias*) forages in shallow intertidal and tidal flat margins. **Seaduck guild:** Harlequin duck (*Histrionicus histrionicus*) forages in rocky intertidal and fast-moving riffles; breeds in montane streams (ELEV-MONTANE link). **Gull guild:** Glaucous-winged gull (*Larus glaucescens*), western gull (*Larus occidentalis*) forage on intertidal invertebrates and stranded fish. |
| **MAM relevance** | **Harbor seal (*Phoca vitulina*):** primary foraging zone during low-tide fish concentration events; haul-out on exposed rocks at low tide. **Sea otter (*Enhydra lutris*):** historical range on intertidal kelp edge; reintroduced on Olympic coast (2024); primary urchin and mussel predator; keystone species for intertidal community structure. **Mink (*Neogale vison*):** coastal mink regularly forages in rocky intertidal zone for fish, crabs, and amphipods; marine extension of riparian niche. |
| **Cross-band notes** | Sub-block resolution at 40.05 ft/block — the entire 15-ft intertidal zone maps to less than one Minecraft block. Features at this scale require annotation rather than block placement. Ochre sea star (*Pisaster ochraceus*) wasting syndrome (2013–present) is the dominant recent disturbance driver; effects propagate into ELEV-SHALLOW-MARINE via urchin population release. |

---

### Band 10: ELEV-SHALLOW-MARINE

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-SHALLOW-MARINE |
| **Elevation range** | 0–200 m depth (0–656 ft below sea level) |
| **Minecraft Y range** | y=-57 to y=-41 (16 blocks) |
| **Precipitation** | Marine; salinity 30–34 ppt open coast, 20–30 ppt Puget Sound; spring phytoplankton bloom (March–May) peak productivity; seasonal thermocline develops June–September |
| **Dominant vegetation/habitat** | Bull kelp (*Nereocystis luetkeana*) — annual, dominant kelp on rocky reefs to ~60 ft depth; eelgrass (*Zostera marina*) — subtidal meadows to ~30 ft; giant kelp (*Macrocystis pyrifera*) — southern range limit, Puget Sound; feather boa kelp (*Egregia menziesii*); rocky reef, sandy bottom, soft sediment channel |
| **Key indicator species** | Bull kelp (*Nereocystis luetkeana*); lingcod (*Ophiodon elongatus*); Dungeness crab (*Metacarcinus magister*) |
| **AVI relevance** | **Alcid guild:** Common murre (*Uria aalge*) dives to 590 ft (180 m) — deepest diver in band; Pigeon guillemot (*Cepphus columba*) dives to ~150 ft, nests in coastal rock crevices; Marbled murrelet (*Brachyramphus marmoratus*) links ELEV-SHALLOW-MARINE (primary foraging) to ELEV-MONTANE (nesting on old-growth limbs) — critical cross-band bridge species. **Diving duck guild:** Surf scoter (*Melanitta perspicillata*), white-winged scoter (*Melanitta deglandi*), common goldeneye (*Bucephala clangula*) winter in shallow marine, diving for bivalves and crustaceans. **Marine raptor guild:** Bald eagle (*Haliaeetus leucocephalus*) forages on herring ball events and salmon surfacing; osprey (*Pandion haliaetus*) dives to ~3 ft for surface-oriented fish. |
| **MAM relevance** | **Sea otter (*Enhydra lutris*):** primary zone — forages on urchins, Dungeness crab, clams in shallow kelp and rocky reef; keystone predator; range expanding on Olympic coast post-2024 reintroduction. **Harbour seal (*Phoca vitulina*):** primary foraging zone for herring, salmon, rockfish, and flatfish; Puget Sound harbour seals estimated 14,000+ individuals. **Steller sea lion (*Eumetopias jubatus*):** forage in shallow marine for salmon, herring, and rockfish; winter aggregations at river mouths during salmon runs. **Dall's porpoise (*Phocoenoides dalli*):** fast swimmer; Puget Sound and Strait of Juan de Fuca resident; herring and salmon. |
| **Cross-band notes** | Bull kelp canopy has declined 90%+ in parts of Puget Sound and northern California following sea star wasting syndrome and marine heat waves (2014–2023 sequential events). Sea otter reintroduction on the Olympic coast directly links predation pressure in this band to kelp canopy recovery trajectory. Marbled murrelet is the primary AVI cross-band indicator bridging ELEV-MONTANE and ELEV-SHALLOW-MARINE. |

---

### Band 11: ELEV-DEEP-MARINE

| Parameter | Value |
|-----------|-------|
| **Stable ID** | ELEV-DEEP-MARINE |
| **Elevation range** | 200 m+ depth (656 ft+); upper limit is photic zone boundary (~200 m); PNW maximum at -930 ft (-283 m) Puget Sound floor |
| **Minecraft Y range** | y=-64 to y=-57 (7 blocks; note Puget Sound maximum depth is 283 m, below the 200 m band threshold) |
| **Precipitation** | Marine aphotic zone; salinity 33–35 ppt; temperature 39–46°F (4–8°C), stable year-round below ~400 ft; no light penetration; chemosynthesis at hydrothermal vents |
| **Dominant vegetation/habitat** | No photosynthetic vegetation; dominant organisms are glass sponge reefs (*Aphrocallistes vastus*, *Heterochone calyx*; Strait of Georgia, some 9,000 years old), cold-water corals (*Primnoa pacifica*, *Paragorgia arborea*), tube worms, soft sediment (mud, silt) in glacially-carved basins; submarine canyons (Astoria Canyon, Juan de Fuca Canyon) |
| **Key indicator species** | Ratfish (*Hydrolagus colliei*); giant Pacific octopus (*Enteroctopus dofleini*; range extends from intertidal to 330 m); spot prawn (*Pandalus platyceros*) |
| **AVI relevance** | **Pelagic diving guild:** Common murre (*Uria aalge*) reaches upper deep-marine during deep dives (documented to 180 m). Rhinoceros auklet (*Cerorhinca monocerata*) pursues herring and sand lance through shallow-to-deep transition. Loon guild (common loon *Gavia immer*, Pacific loon *Gavia pacifica*) winter in Puget Sound, diving regularly to 50–75 m. **Note:** No bird species are obligate residents of the true deep-marine zone; bird use is incidental during foraging descents from the shallow-marine zone. AVI mission relevance at this band is primarily for tracking murre and loon diving depth as oceanographic indicators. |
| **MAM relevance** | **Harbour porpoise (*Phocoena phocoena*):** common in Puget Sound channels and Strait of Juan de Fuca; echolocates for fish in deep channels. **Harbour seal (*Phoca vitulina*):** documented dives to 400 m; foraging on deep-channel flatfish and rockfish in Puget Sound basins. **Steller sea lion (*Eumetopias jubatus*):** deep diving capacity (600+ m in other populations); PNW individuals likely use upper deep-marine for Pacific cod and other demersal fish. **Killer whale — Bigg's (transient) ecotype (*Orcinus orca*):** pursues harbour seals and Steller sea lions into deep channels; transit through deep-marine corridors in Puget Sound. |
| **Cross-band notes** | Hood Canal (Puget Sound arm) experiences periodic hypoxic events (dissolved oxygen <2 mg/L) in deep basins, linked to restricted water exchange, warming, and nutrient loading — a documented mortality factor for fish and invertebrates. Deep-marine band is least surveyed and most vulnerable to: bottom trawling (restricted in Puget Sound, ongoing on outer shelf); cable/pipeline installation; deep-water sediment disturbance. Glass sponge reefs in Strait of Georgia are protected as Marine Protected Areas (Canada). PNW equivalent protections remain incomplete. |

---

## Coordinate Reference Summary

```
FORMULA:        Y = round((elevation_ft / 40.05) - 41)
INVERSE:        elevation_ft = (Y + 41) * 40.05
SCALE:          1 block = 40.05 ft (all axes)

BAND BOUNDARIES (Y values at band transitions):
  ELEV-DEEP-MARINE lower boundary:     y=-64  (-930 ft / -283 m Puget floor)
  ELEV-DEEP-MARINE / SHALLOW boundary: y=-57  (-656 ft / -200 m photic limit)
  ELEV-SHALLOW-MARINE / INTERTIDAL:    y=-41  (0 ft sea level)
  ELEV-INTERTIDAL / COASTAL:           y=-41  (sub-block; sea level datum)
  ELEV-COASTAL / LOWLAND upper:        y=-29  (500 ft)
  ELEV-LOWLAND upper:                  y=9    (2,000 ft)
  ELEV-MONTANE upper:                  y=71   (4,500 ft)
  ELEV-SUBALPINE upper:                y=121  (6,500 ft)
  ELEV-ALPINE upper (summit):          y=319  (14,410 ft Mt. Rainier)

CROSS-CUTTING BANDS:
  ELEV-RIPARIAN:      y=-64 to y=319 (all elevations along waterways)
  ELEV-SUBTERRANEAN:  y=-64 to y=319 (subsurface voids at any elevation)

SHRUB-STEPPE NOTE:
  ELEV-SHRUB-STEPPE occupies same Y range as ELEV-LOWLAND (y=-29 to y=34)
  but is geographically distinct — east Cascades rain shadow only.
  Horizontal separation from ELEV-LOWLAND and ELEV-COASTAL, not vertical.
```

---

## Cross-Band Indicator Species Table

Species that link two or more bands — critical for AVI and MAM mission cross-band modeling.

| Species | Primary Band | Secondary Band(s) | Mission | Linkage Type |
|---------|-------------|-------------------|---------|--------------|
| Marbled murrelet (*Brachyramphus marmoratus*) | ELEV-SHALLOW-MARINE | ELEV-MONTANE | AVI | Nests inland, forages marine; 50+ km daily commute |
| Chinook salmon (*Oncorhynchus tshawytscha*) | ELEV-RIPARIAN | ELEV-SHALLOW-MARINE, ELEV-DEEP-MARINE | MAM (prey) | Anadromous; full vertical transect from mountain to ocean |
| American black bear (*Ursus americanus*) | ELEV-LOWLAND | ELEV-SUBALPINE, ELEV-RIPARIAN | MAM | Seasonal vertical migration; salmon-bear nutrient vector |
| Bald eagle (*Haliaeetus leucocephalus*) | ELEV-COASTAL | ELEV-RIPARIAN, ELEV-SHALLOW-MARINE | AVI | Follows salmon runs from coast to montane |
| Black-tailed deer (*Odocoileus hemionus columbianus*) | ELEV-LOWLAND | ELEV-MONTANE, ELEV-RIPARIAN | MAM | Altitudinal migration; summer montane, winter lowland |
| River otter (*Lontra canadensis*) | ELEV-RIPARIAN | ELEV-COASTAL, ELEV-SHALLOW-MARINE | MAM | Fresh-to-salt water; entire riparian corridor |
| Harlequin duck (*Histrionicus histrionicus*) | ELEV-INTERTIDAL | ELEV-MONTANE (breeding) | AVI | Nests on montane streams, winters in marine surf zone |
| Common murre (*Uria aalge*) | ELEV-SHALLOW-MARINE | ELEV-DEEP-MARINE (diving) | AVI | Deepest-diving alcid; pelagic-to-benthic forager |
| Pacific marten (*Martes caurina*) | ELEV-MONTANE | ELEV-SUBALPINE, ELEV-SUBTERRANEAN | MAM | Subnivean winter hunting; old-growth summer range |
| Harbor seal (*Phoca vitulina*) | ELEV-SHALLOW-MARINE | ELEV-INTERTIDAL, ELEV-COASTAL | MAM | Haul-out intertidal, forage shallow, transit deep |
| Clark's nutcracker (*Nucifraga columbiana*) | ELEV-SUBALPINE | ELEV-ALPINE | AVI | Whitebark pine seed dispersal; seed caches cross krummholz |
| American pika (*Ochotona princeps*) | ELEV-ALPINE | ELEV-SUBALPINE, ELEV-SUBTERRANEAN | MAM | Talus obligate; uses subsurface interstices as thermal refuge |

---

## Band Compatibility Matrix

Which AVI guilds and MAM groups occur in each band. Legend: `P` = primary, `S` = seasonal, `T` = transient/foraging, `-` = absent.

| Band | Rosy-finch | Ptarmigan | Clark's Nutcracker | Old-Growth Obligate | Shorebird | Shrub-Steppe Guild | Bat/Cave Guild | Alcid | Pikas/Marmots | Mustelids | Ungulates | Seals/Otters |
|------|-----------|-----------|-------------------|---------------------|-----------|-------------------|----------------|-------|---------------|-----------|-----------|-------------|
| ELEV-ALPINE | P | P | T | - | - | - | - | - | P | - | T | - |
| ELEV-SUBALPINE | S | S | P | - | - | - | - | - | P | P | S | - |
| ELEV-MONTANE | - | - | T | P | - | - | S | - | - | P | P | - |
| ELEV-LOWLAND | - | - | T | P | - | - | S | - | - | P | P | - |
| ELEV-RIPARIAN | - | - | - | S | P | - | S | - | - | P | S | S |
| ELEV-COASTAL | - | - | - | S | P | - | S | T | - | S | - | P |
| ELEV-SHRUB-STEPPE | - | - | - | - | S | P | S | - | S | S | P | - |
| ELEV-SUBTERRANEAN | - | - | - | - | - | - | P | - | S | S | - | - |
| ELEV-INTERTIDAL | - | - | - | - | P | - | - | S | - | S | - | P |
| ELEV-SHALLOW-MARINE | - | - | - | - | S | - | - | P | - | - | - | P |
| ELEV-DEEP-MARINE | - | - | - | - | - | - | - | S | - | - | - | S |

---

## Document Provenance

| Field | Value |
|-------|-------|
| **Source coordinate system** | `www/PNW/ECO/research/silicon.yaml` v1.0.0 |
| **Source elevation bands** | `www/PNW/ECO/research/shared-attributes.md` |
| **Source coordinate projection** | `www/PNW/ECO/research/coordinate-projection.md` |
| **Species data** | `www/PNW/ECO/research/fauna-terrestrial.md`, `fauna-marine-aquatic.md` |
| **Blocker resolved** | B-2: shared ecoregion schema for AVI and MAM missions |
| **Band additions from ECO base** | ELEV-SHRUB-STEPPE (east-side), ELEV-SUBTERRANEAN (MAM addition), ELEV-COASTAL (coastal sub-zone of ELEV-RIPARIAN) |
| **Band boundary changes from ECO base** | ELEV-ALPINE onset moved from 9,500 ft (silicon.yaml) to 6,500 ft per blocker resolution spec; ELEV-SUBALPINE and ELEV-MONTANE boundaries adjusted accordingly |
| **Formula** | `Y = round((elevation_ft / 40.05) - 41)` — unchanged from ECO source |
| **Date produced** | 2026-03-08 |
