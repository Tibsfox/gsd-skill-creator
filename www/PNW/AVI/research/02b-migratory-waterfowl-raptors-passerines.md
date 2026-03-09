# PNW Avian Taxonomy — Module 2B: Migratory Waterfowl, Raptors, and Neotropical Passerines

> **Module 2B deliverable for the PNW Avian Taxonomy mission ("Wings of the Pacific Northwest")**
>
> This document profiles approximately 45 migratory bird species in three functional groups: migratory waterfowl (non-breeding visitors and passage migrants using the Pacific Flyway), migratory raptors (long-distance and altitudinal migrants), and neotropical migratory passerines (species breeding in the PNW and wintering in Mexico, Central America, or South America). Each species is documented with full taxonomic profile, migration-specific fields (flyway, route, timing, staging areas, distance), habitat associations, conservation status, and at least one evolutionary or phylogenetic observation.
>
> **Design principle:** Migration is the organizing force. These species connect the PNW to ecosystems thousands of kilometers distant. Their presence and abundance are shaped not only by local habitat quality but by conditions across entire flyways — breeding grounds, staging areas, wintering grounds, and every landscape between. Conservation of PNW migratory birds requires a hemispheric perspective.
>
> **Safety boundaries:** No GPS coordinates or specific nest sites for ESA-listed species (county/watershed level only). All population data attributed to specific agencies or peer-reviewed studies. No policy advocacy. Conservation threats presented with sourced data. All Indigenous knowledge references name specific nations. Only Level 1 (publicly available) cultural content.

---

## Source Organizations

- USFWS Pacific Flyway Program, Migratory Bird Program, Pacific Flyway Data Book [G1, G2, G3]
- Pacific Flyway Council, annual management data and regulatory recommendations [G11, O17]
- USGS Breeding Bird Survey, Bird Banding Laboratory, migration tracking studies [G4]
- USGS Western Ecological Research Center, wildfire-migration study (2022) [G4]
- WDFW Priority Habitats and Species Program, marine bird surveys [G9]
- ODFW Oregon Conservation Strategy, state bird records [G12]
- IDFG State species management plans [G13]
- Environment Canada / Birds Canada, Important Bird Areas, national breeding bird atlas [G14]
- NOAA Pacific Northwest climate assessments, sea-level projections [G15]
- Cornell Lab of Ornithology, Birds of the World, eBird abundance models [O1, O2]
- AOS Check-list of North and Middle American Birds, 7th ed. through 62nd Supplement [O3]
- Partners in Flight, Landbird Conservation Plan, population estimates and assessments [O4]
- National Audubon Society, Important Bird Areas, Christmas Bird Count data [O16]
- WHSRN, Western Hemisphere Shorebird Reserve Network [O18]
- Aversa et al., *Birds of the Pacific Northwest* (2nd ed.) [O7]
- Shewey & Blount, *Birds of the Pacific Northwest* (Timber Press) [O8]
- Marzluff & Sallabanks 1998, *Avian Conservation: Research and Management* [P19]
- DellaSala et al. 2011, Temperate and boreal rainforests [P7]
- Willson & Halupka 1995, Anadromous fish as keystone species [P11]
- Suttles 1990, *Handbook of North American Indians, Vol. 7: Northwest Coast* [C2]

---

## How to Read This Document

Each species follows the standardized profile format defined in `00-taxonomy-schema.md`. Migratory species include the full migration field block (flyway, route, spring arrival, fall departure, staging areas, breeding/wintering grounds, distance, flyway threats). Species designated "extended" receive 5-8KB treatments with deeper ecological and behavioral narrative. Standard profiles are 2-3KB.

Source codes (e.g., [G1], [P7]) refer to the source index in `00-source-index.md`.

Ecoregion zones (e.g., Zone 5, Zone 6) refer to definitions in `00-ecoregion-definitions.md`.

---

# PART I: MIGRATORY WATERFOWL

Waterfowl migration along the Pacific Flyway is among the most visible and ecologically significant wildlife phenomena in the PNW. The region's estuaries, river deltas, agricultural floodplains, and coastal bays serve as critical staging, wintering, and refueling habitats for millions of ducks, geese, swans, and loons moving between Arctic/subarctic breeding grounds and temperate/subtropical wintering areas. The Skagit River delta, Fraser River delta, Klamath Basin, Malheur Basin, and Columbia River estuary are flyway-scale bottleneck sites where the loss of a single wetland complex could disrupt continental waterfowl populations [G1, G3, O17].

The Pacific Flyway — one of four administrative flyways managed by the USFWS — funnels waterfowl along the Pacific Coast and through interior corridors between Alaska/Arctic Canada and wintering areas from British Columbia to Mexico. The PNW sits at the flyway's midpoint, making it simultaneously a destination (wintering), a waystation (staging), and a departure point (breeding) depending on species and season [G2].

---

## Snow Goose (EXTENDED)

```yaml
common_name: "Snow Goose"
scientific_name: "Anser caerulescens"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering / transient"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban", "Zone 7: East-Side Steppe"]
```

### Morphometrics

- **Length:** 64-79 cm
- **Wingspan:** 135-165 cm
- **Mass:** 2,050-3,400 g (males averaging larger)
- **Plumage:** Two morphs — white morph (entirely white with black primaries) and "Blue Goose" dark morph (dark gray-brown body, white head). White morph predominates in Pacific Flyway populations (>95%). Both morphs are a single species; the "Blue Goose" was formerly considered a separate species until lumped by AOS in 1983.
- **Sexual dimorphism:** Minimal; males average slightly larger.

### Habitat

- **Breeding:** Arctic tundra — Wrangel Island (Russia), Banks Island, western Canadian Arctic, northern Alaska. Colonial nesters on flat tundra near water.
- **Wintering:** Agricultural fields (harvested corn, potato, and grain stubble), estuarine marshes, coastal flats. PNW wintering concentrated in Skagit Valley (WA), Fir Island, Fraser River delta (BC), Sauvie Island (OR), Ridgefield NWR (WA), Klamath Basin.
- **Elevation range:** Sea level to 200 ft (lowland agricultural and estuarine habitats).
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)
- **Ecoregion secondary:** Zone 3 (Lowland/Urban — agricultural lands)
- **Microhabitat:** Requires open terrain with short vegetation for visual predator detection. Prefers flooded or recently harvested agricultural fields adjacent to estuarine roost sites.

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Arctic breeding grounds (Wrangel Island, Banks Island, North Slope AK) south through interior BC and along coast to Skagit/Fraser delta complex. Some populations continue to Willamette Valley, Klamath Basin, or Central Valley CA."
  spring_arrival: "N/A (spring departure from PNW: late March to mid-April)"
  fall_departure: "N/A (fall arrival to PNW: late October to mid-November)"
  staging_areas: ["Skagit River delta, WA", "Fir Island, WA", "Fraser River delta, BC", "Ridgefield NWR, WA", "Sauvie Island, OR", "Klamath Basin, OR/CA"]
  breeding_grounds: "Wrangel Island (Russia), Banks Island (NT, Canada), western Arctic coastal plain (AK/YT)"
  wintering_grounds: "Skagit Valley (WA) through Willamette Valley (OR) to Central Valley (CA); smaller numbers Klamath Basin"
  distance_km: "4,000-6,500"
  flyway_threats: ["Agricultural conversion at staging areas", "Sea-level rise threatening estuarine habitat", "Arctic breeding habitat degradation from overgrazing (colony hyperabundance)", "Wind energy development along migration corridors", "Lead shot ingestion in agricultural fields"]
```

### The Skagit Spectacle

The Skagit River delta and Fir Island complex in Skagit County, Washington, hosts one of the most concentrated Snow Goose wintering aggregations on the Pacific Flyway. Peak counts regularly exceed 50,000 individuals, with single-day estimates occasionally surpassing 70,000 during peak winter (December-February). The spectacle of tens of thousands of white geese lifting simultaneously from agricultural fields — a phenomenon triggered by Bald Eagle flyovers — creates one of the Pacific Northwest's most iconic wildlife displays [G3, O16].

The Skagit wintering population is drawn primarily from the Wrangel Island breeding colony in the Russian Far East, one of the largest Snow Goose colonies in the world. Wrangel Island birds migrate southeast across the Bering Strait, through interior Alaska, down the BC coast, and into the Skagit/Fraser delta complex — a route of approximately 5,000-6,500 km. Satellite tracking studies have documented individual birds completing the southbound migration in 10-21 days, with extended staging stops in the Stikine River delta (BC) and Fraser River delta [G4].

The agricultural landscape of the Skagit Valley — dominated by harvested corn, potato, and grain stubble in winter — provides a vast, high-calorie foraging landscape. Snow Geese feed primarily on waste grain and root crops during the day, roosting on tidal flats and estuary margins at night. The interaction between agricultural land management and goose foraging creates both benefits (nutrient cycling, gleaning of crop waste) and conflicts (damage to overwintering cover crops, soil compaction). WDFW coordinates with Skagit Valley farmers through the Skagit Wildlife Area management plan [G9].

The Skagit population has fluctuated significantly over recent decades. Continental Snow Goose populations have increased dramatically since the 1970s — the midcontinent population grew from approximately 2 million to over 15 million, prompting the USFWS to implement a Conservation Order ("light goose conservation order") allowing expanded harvest. Pacific Flyway populations have shown more moderate growth, with the Wrangel Island colony constrained by breeding habitat availability [G1, G3].

### Diet and Foraging

- **Primary diet:** Herbivorous — roots, tubers, waste grain, green shoots of grasses and sedges, aquatic vegetation
- **Foraging strategy:** Grubbing in soil for roots and tubers; gleaning waste grain from harvested fields; grazing on green shoots in estuarine marshes. Feeds in dense flocks with continuous vigilance behavior (heads-up scanning).
- **Seasonal variation:** Winter PNW diet dominated by agricultural crops (waste corn, potatoes, grain stubble). During spring staging, shifts to estuarine marsh vegetation. Arctic breeding diet: sedge roots, moss shoots, willow buds.

### Population

- **Trend:** Stable to increasing (Pacific Flyway); dramatically increasing (midcontinent)
- **Estimate:** Pacific Flyway breeding population approximately 500,000-600,000 (USFWS Pacific Flyway Data Book). Wrangel Island colony approximately 150,000-300,000 breeding pairs (variable annually). Skagit Valley wintering peak 40,000-70,000+ [G1, G3].
- **Threats:** Arctic breeding habitat degradation from overgrazing (hyperabundant colonies strip tundra vegetation), sea-level rise threatening low-elevation estuarine wintering habitat, agricultural land conversion at staging areas, climate-driven mismatch between Arctic snow melt and optimal nesting timing.

### Evolutionary Note

Snow Geese exhibit one of the best-studied cases of balanced polymorphism in birds. The white and "blue" (dark) morphs are controlled primarily by a single gene region (MC1R and associated loci), with dominance of the dark allele. Assortative mating is strong — geese preferentially pair with the morph of their parents, maintaining both morphs in the population despite gene flow. The Pacific Flyway population is overwhelmingly white morph (>95%), while midcontinent populations show higher dark morph frequency (30-40%), suggesting that morph ratio is influenced by founder effects, regional selection, or social learning in mate choice [P2, O1].

### Ecoregion Presence

```yaml
ecoregion_presence:
  - zone: "Zone 5: Riparian/Estuarine"
    season: "wintering"
    abundance: "abundant"
    role: "characteristic"
  - zone: "Zone 3: Lowland/Urban"
    season: "wintering"
    abundance: "common"
    role: "visitor (agricultural lands)"
  - zone: "Zone 7: East-Side Steppe"
    season: "migration"
    abundance: "uncommon"
    role: "visitor (Klamath Basin, Malheur Basin)"
```

### Vocalizations

- **Primary call:** Loud, high-pitched, nasal honking — a continuous *wuck-wuck-wuck* in flight; the collective sound of thousands in flight is a distinctive roar audible at great distance.
- **Alarm call:** Sharp, single-note bark triggering mass flushing.

### Sources

[G1] USFWS Migratory Bird Program — Snow Goose management. [G3] USFWS Pacific Flyway Data Book — population estimates. [G4] USGS Bird Banding Laboratory — satellite tracking data. [G9] WDFW — Skagit Wildlife Area management. [O1] Cornell Lab, Birds of the World — species account. [O16] National Audubon Society — Christmas Bird Count data. [P2] Campagna et al. 2017 — pigmentation genetics.

---

## Greater White-fronted Goose

```yaml
common_name: "Greater White-fronted Goose"
scientific_name: "Anser albifrons"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering / transient"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban", "Zone 7: East-Side Steppe"]
```

### Morphometrics

- **Length:** 64-81 cm
- **Wingspan:** 130-165 cm
- **Mass:** 1,930-3,100 g
- **Plumage:** Grayish-brown overall, white face patch at bill base (adults), irregular black barring on belly ("specklebelly"), orange legs and feet. Juveniles lack white face patch and belly barring.
- **Sexual dimorphism:** Minimal; males average slightly larger.

### Habitat

- **Breeding:** Arctic and subarctic tundra — western Alaska, Arctic Canada.
- **Wintering:** Flooded agricultural fields, marshes, shallow lakes. PNW wintering primarily in Klamath Basin, Willamette Valley, Sauvie Island, and lower Columbia River.
- **Elevation range:** Sea level to 500 ft.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Breeds western Alaska tundra; migrates south through interior BC and eastern OR/WA to Klamath Basin, Willamette Valley, and Central Valley CA. Some birds use coastal route."
  spring_arrival: "Spring departure from PNW: late February to early April"
  fall_departure: "Fall arrival to PNW: late September to mid-November"
  staging_areas: ["Klamath Basin, OR/CA", "Summer Lake, OR", "Malheur NWR, OR", "Sauvie Island, OR"]
  breeding_grounds: "Western Alaska (Yukon-Kuskokwim Delta), Arctic Canada"
  wintering_grounds: "Klamath Basin through Central Valley, CA; smaller numbers Willamette Valley and Columbia Basin"
  distance_km: "3,500-5,500"
  flyway_threats: ["Wetland loss at Klamath Basin (water allocation conflicts)", "Agricultural conversion", "Lead shot ingestion"]
```

### Diet and Foraging

- **Primary diet:** Herbivorous — grasses, sedges, grain, tubers, aquatic vegetation.
- **Foraging strategy:** Grazing on agricultural fields and marsh edges; often in mixed flocks with other geese.
- **Seasonal variation:** Winter diet heavily agricultural (waste grain, green shoots).

### Population

- **Trend:** Stable
- **Estimate:** Pacific Flyway population approximately 600,000 (USFWS). Global population 2.1-3.5 million [G1, G3].
- **Threats:** Water allocation conflicts at Klamath Basin — one of the most contested water management issues in the western US — directly impact wintering habitat availability.

### Evolutionary Note

*Anser albifrons* is a Holarctic species with a circumpolar breeding distribution. Pacific Flyway birds belong to subspecies *A. a. frontalis* (Pacific White-fronted Goose), distinguishable from European *A. a. albifrons* by larger body size and heavier bill. The Greenland White-fronted Goose (*A. a. flavirostris*), restricted to western Greenland and Ireland, is sometimes considered a separate species; molecular phylogenetics confirm deep divergence between Greenland and continental populations, consistent with Pleistocene glacial isolation [O1].

### Vocalizations

- **Primary call:** High-pitched, laughing *kow-kow-kow* — distinctive "laughing" quality separates from other geese at distance.

### Sources

[G1] USFWS Migratory Bird Program. [G3] Pacific Flyway Data Book. [O1] Cornell Lab, Birds of the World.

---

## Brant

```yaml
common_name: "Brant"
scientific_name: "Branta bernicla"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering / transient"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 6: Coastal/Marine/Pelagic", "Zone 5: Riparian/Estuarine"]
```

### Morphometrics

- **Length:** 56-66 cm
- **Wingspan:** 106-121 cm
- **Mass:** 880-1,800 g
- **Plumage:** Dark brown-black head, neck, breast; pale flanks; white neck collar (incomplete in Pacific subspecies *nigricans*). Small, compact goose.
- **Sexual dimorphism:** Minimal.

### Habitat

- **Breeding:** Arctic coastal tundra — primarily western Arctic Alaska, Yukon coast.
- **Wintering:** Coastal bays, estuaries, eelgrass (*Zostera marina*) beds. Padilla Bay (WA), Boundary Bay (BC), Willapa Bay (WA), Tillamook Bay (OR). Obligate on marine/estuarine habitat — rarely found inland.
- **Elevation range:** Sea level.
- **Ecoregion primary:** Zone 6 (Coastal/Marine)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Arctic Alaska breeding grounds south along coast with minimal inland deviation. Strong coastal dependency throughout migration — rarely overflies land extensively."
  spring_arrival: "Spring departure: mid-April to early May; major staging at Padilla Bay, WA"
  fall_departure: "Fall arrival: late October to November"
  staging_areas: ["Padilla Bay, WA", "Boundary Bay, BC", "Izembek Lagoon, AK (critical pre-migration staging)"]
  breeding_grounds: "Arctic coastal Alaska (Yukon-Kuskokwim Delta, North Slope coastal)"
  wintering_grounds: "Padilla Bay (WA) south to Baja California; smaller numbers Willapa Bay, Tillamook Bay"
  distance_km: "4,000-5,000"
  flyway_threats: ["Eelgrass bed decline (warming waters, wasting disease)", "Coastal development", "Oil spill vulnerability (concentrated coastal habitat)", "Sea-level rise altering estuarine morphology"]
```

### Diet and Foraging

- **Primary diet:** Eelgrass (*Zostera marina*) — near-obligate dependency in wintering and staging areas. Also sea lettuce (*Ulva*), salt marsh grasses.
- **Foraging strategy:** Upending and dabbling in shallow estuarine waters; grazing on exposed eelgrass beds at low tide.
- **Seasonal variation:** Arctic breeding diet includes moss, lichen, sedge, and coastal invertebrates.

### Population

- **Trend:** Declining (Pacific population)
- **Estimate:** Pacific Black Brant population approximately 130,000-150,000 (USFWS midwinter survey). PNW wintering population 15,000-25,000 [G1, G3].
- **Threats:** Eelgrass decline is the single greatest threat. Eelgrass wasting disease (*Labyrinthula zosterae*), warming coastal waters, and coastal turbidity from development reduce the food base. The species' near-obligate dependency on eelgrass makes it a direct indicator of estuarine health.

### Evolutionary Note

Pacific Brant (*B. b. nigricans*, Black Brant) is distinguishable from Atlantic Brant (*B. b. hrota*) by darker belly and more extensive dark breast. Contact zones exist in the central Canadian Arctic, where intermediate phenotypes occur. Some authorities elevate Black Brant to full species status; AOS currently maintains subspecies rank. The Brant species complex illustrates Pleistocene vicariance — Atlantic and Pacific populations diverged during glacial periods when Arctic coastal habitat was fragmented by ice sheets, then re-established limited contact during interglacials [O1, O3].

### Sources

[G1] USFWS Pacific Flyway. [G3] Pacific Flyway Data Book. [O1] Cornell Lab, Birds of the World.

---

## Tundra Swan

```yaml
common_name: "Tundra Swan"
scientific_name: "Cygnus columbianus"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering / transient"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban", "Zone 7: East-Side Steppe"]
```

### Morphometrics

- **Length:** 120-150 cm
- **Wingspan:** 168-211 cm
- **Mass:** 3,400-9,600 g (males significantly larger)
- **Plumage:** Entirely white (adults); grayish juvenile plumage molts to white during first winter. Black bill, usually with small yellow loral spot (variable). Legs black.
- **Sexual dimorphism:** Pronounced size dimorphism; males 15-20% heavier.

### Habitat

- **Breeding:** Arctic tundra wetlands — shallow ponds and marshes on coastal tundra.
- **Wintering:** Shallow lakes, flooded agricultural fields, estuarine marshes. PNW: Skagit Valley, lower Columbia River, Sauvie Island, Ridgefield NWR, Klamath Basin, Summer Lake (OR).
- **Elevation range:** Sea level to 500 ft.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Arctic Alaska/Canada south through interior BC to PNW staging areas. Western population winters primarily in the Pacific states; eastern population winters along the Atlantic coast."
  spring_arrival: "Spring departure from PNW: late February to mid-March"
  fall_departure: "Fall arrival to PNW: late October to mid-November"
  staging_areas: ["Skagit Valley, WA", "Ridgefield NWR, WA", "Summer Lake, OR", "Klamath Basin, OR/CA"]
  breeding_grounds: "Arctic Alaska (North Slope, Seward Peninsula), Arctic Canada (Mackenzie Delta, Victoria Island)"
  wintering_grounds: "Pacific states (WA, OR, CA) — primarily Klamath Basin through Central Valley, CA"
  distance_km: "3,500-5,000"
  flyway_threats: ["Wetland loss", "Lead poisoning from ingested shot/sinkers", "Power line collisions", "Water allocation conflicts at Klamath Basin"]
```

### Diet and Foraging

- **Primary diet:** Aquatic vegetation (pondweed, wild celery), tubers, waste grain.
- **Foraging strategy:** Upending in shallow water to reach submerged vegetation; gleaning waste grain from harvested fields.
- **Seasonal variation:** Winter diet increasingly agricultural; spring staging shifts to aquatic vegetation.

### Population

- **Trend:** Stable
- **Estimate:** Western population approximately 100,000 (USFWS midwinter survey). Distinguished from resident Trumpeter Swan (Module 2A resident species) by smaller size, yellow loral spot, and different call quality [G1, G3].
- **Threats:** Lead poisoning from ingested spent shot and fishing sinkers remains a significant mortality source. Power line collisions during dusk/dawn flights between roost and foraging sites.

### Evolutionary Note

The Tundra Swan was long considered conspecific with the Eurasian Bewick's Swan (*C. bewickii*); molecular phylogenetic studies confirm that *columbianus* (Whistling Swan) and *bewickii* are sister taxa within the *Cygnus* genus, with divergence estimated at 0.5-1.0 million years ago during Pleistocene glacial cycles. AOS treats them as separate species. The species epithet *columbianus* honors the Columbia River, where Lewis and Clark first encountered these swans during the Corps of Discovery expedition (1805) — one of the earliest documented bird observations in the PNW [O1, O3].

### Sources

[G1] USFWS Migratory Bird Program. [G3] Pacific Flyway Data Book. [O1] Cornell Lab, Birds of the World.

---

## Eurasian Wigeon

```yaml
common_name: "Eurasian Wigeon"
scientific_name: "Mareca penelope"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering (regular)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 6: Coastal/Marine"]
```

### Morphometrics

- **Length:** 42-50 cm
- **Wingspan:** 71-80 cm
- **Mass:** 500-900 g
- **Plumage:** Male: chestnut head, cream-colored forehead crown stripe, gray body, white wing patch. Female: similar to female American Wigeon but warmer brown tones, darker head.
- **Sexual dimorphism:** Pronounced (typical of dabbling ducks).

### Habitat

- **Wintering:** Estuarine marshes, coastal bays, flooded agricultural fields. PNW: regular in small numbers throughout coastal WA and OR, particularly Padilla Bay, Skagit Valley, Sauvie Island.
- **Elevation range:** Sea level to 200 ft.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)

### Migration

```yaml
migration:
  flyway: "Trans-Pacific (irregular) / Pacific"
  route_description: "Breeds across Eurasia; small numbers cross the Pacific or Bering Strait to winter regularly along the Pacific Coast from Alaska to California. Most PNW birds likely originate from eastern Siberia."
  spring_arrival: "Spring departure from PNW: March to April"
  fall_departure: "Fall arrival to PNW: October to November"
  staging_areas: ["Mixed with American Wigeon flocks at coastal sites"]
  breeding_grounds: "Northern Eurasia — Scandinavia to eastern Siberia"
  wintering_grounds: "Western Europe, Mediterranean, East Asia; small regular numbers Pacific Coast of North America"
  distance_km: "5,000-8,000+ (trans-Pacific)"
  flyway_threats: ["Same as American Wigeon in PNW context"]
```

### Population

- **Trend:** Stable (PNW wintering numbers)
- **Estimate:** Annual PNW occurrence: dozens to low hundreds. One of the most regular Eurasian visitors to North America's Pacific Coast. eBird data show consistent annual reports from Skagit County, WA, and Sauvie Island, OR [O2].
- **Threats:** No PNW-specific threats; small population buffered by mixing with large American Wigeon flocks.

### Evolutionary Note

The Eurasian Wigeon's regular occurrence in the PNW illustrates the permeability of the Bering Strait as a biogeographic barrier. *Mareca penelope* and *Mareca americana* (American Wigeon) are sister species that diverged during the Pleistocene, likely during a period of Beringian land bridge exposure. Hybridization between Eurasian and American Wigeon is documented in the PNW (hybrid males show intermediate head patterns), providing ongoing evidence of incomplete reproductive isolation between these recently diverged species [O1].

### Sources

[O1] Cornell Lab, Birds of the World. [O2] eBird. [G3] Pacific Flyway Data Book.

---

## Northern Pintail

```yaml
common_name: "Northern Pintail"
scientific_name: "Anas acuta"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering / transient (some breeding)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban", "Zone 7: East-Side Steppe"]
```

### Morphometrics

- **Length:** 51-76 cm (males longer due to elongated central tail feathers)
- **Wingspan:** 80-95 cm
- **Mass:** 450-1,135 g
- **Plumage:** Male: chocolate brown head, white breast extending in thin line up side of neck, gray body, elongated black central tail feathers (the "pin tail"). Female: cryptic mottled brown. One of the most elegant dabbling ducks.
- **Sexual dimorphism:** Pronounced.

### Habitat

- **Breeding:** Shallow prairie wetlands, agricultural edges, seasonal ponds. Small numbers breed in eastern OR and WA (Malheur Basin, Columbia Basin).
- **Wintering:** Estuarine marshes, flooded agricultural fields, shallow lakes. Major wintering concentrations at Klamath Basin, Columbia Basin, and throughout western WA/OR lowlands.
- **Elevation range:** Sea level to 4,500 ft (breeding sites at Malheur Basin).
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Breeds across northern prairies and Arctic; migrates through interior corridors to PNW staging areas and on to California Central Valley. The most widely distributed duck in the Northern Hemisphere."
  spring_arrival: "Early migrant — February to March (PNW breeding sites); departure from wintering areas begins January"
  fall_departure: "Fall arrival to PNW: September to November"
  staging_areas: ["Klamath Basin, OR/CA", "Malheur NWR, OR", "Columbia Basin, WA", "Skagit Valley, WA"]
  breeding_grounds: "Prairie pothole region (AB, SK, MT, ND), Arctic Alaska, subarctic Canada"
  wintering_grounds: "Pacific states (WA, OR, CA), Mexico, Central America"
  distance_km: "2,500-5,000"
  flyway_threats: ["Prairie wetland loss (breeding habitat)", "Agricultural intensification", "Avian botulism at staging wetlands", "Drought reducing breeding habitat availability"]
```

### Population

- **Trend:** Declining (long-term)
- **Estimate:** Continental population approximately 3.0-3.5 million (down from 6-10 million historical). Pacific Flyway wintering population approximately 1.0-1.5 million. Pintails have experienced one of the steepest long-term declines of any North American duck species despite large population size [G1, G3].
- **Threats:** Prairie wetland drainage has eliminated vast areas of breeding habitat. Agricultural conversion of native grassland around prairie potholes exposes nesting females to higher predation rates. Drought cycles on the prairies compound the habitat loss signal.

### Evolutionary Note

The Northern Pintail is the most widely distributed dabbling duck in the world, with Holarctic breeding range spanning North America and Eurasia. Unlike most *Anas* ducks, pintails show very low genetic differentiation across their global range, suggesting either recent range expansion from a single glacial refugium or ongoing gene flow through circumpolar movement. The species' long, pointed wings and streamlined body — adaptations for sustained flight — support the longest regular migrations of any dabbling duck [O1].

### Sources

[G1] USFWS Migratory Bird Program. [G3] Pacific Flyway Data Book. [O1] Cornell Lab, Birds of the World.

---

## American Wigeon (Migratory Populations)

```yaml
common_name: "American Wigeon"
scientific_name: "Mareca americana"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering / transient (some resident)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban", "Zone 6: Coastal/Marine"]
```

### Morphometrics

- **Length:** 42-59 cm
- **Wingspan:** 76-89 cm
- **Mass:** 512-1,330 g
- **Plumage:** Male: white forehead/crown, iridescent green postocular stripe, pinkish-brown breast and flanks, white wing patch. Female: grayish-brown head, warm brown body. Both sexes show distinctive pale blue-gray bill with black tip.
- **Sexual dimorphism:** Pronounced.

### Habitat

- **Breeding:** Interior wetlands — primarily boreal parkland and prairie regions of western Canada and Alaska. Small numbers breed in eastern WA and OR.
- **Wintering:** Estuarine marshes, urban parks with ponds, agricultural fields, coastal bays. One of the most abundant wintering ducks in western WA and OR.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Breeds interior AK and western Canada; migrates south through BC interior and coast to PNW wintering areas. One of the most abundant wintering dabbling ducks in the PNW."
  spring_arrival: "Spring departure: March to April"
  fall_departure: "Fall arrival: September to November"
  staging_areas: ["Klamath Basin, OR/CA", "Columbia Basin, WA", "Fraser River delta, BC"]
  breeding_grounds: "Interior Alaska, Yukon, BC, Alberta, Saskatchewan"
  wintering_grounds: "Pacific Coast from BC to Mexico; inland to Central Valley, CA"
  distance_km: "2,000-4,000"
  flyway_threats: ["Wetland loss at staging/wintering areas", "Boreal forest habitat conversion", "Climate-driven changes to prairie breeding habitat"]
```

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 2.5 million. Pacific Flyway wintering population approximately 800,000-1,000,000 [G1, G3].
- **Threats:** Stable overall but dependent on boreal and prairie wetland integrity.

### Evolutionary Note

American Wigeon is one of the few dabbling ducks that feeds extensively by grazing on land and pirating submerged vegetation brought to the surface by diving birds (coots, diving ducks). This kleptoparasitic foraging strategy — rare among ducks — may have evolved as an adaptation to exploit food resources in habitats where the wigeon's relatively short bill limits its ability to feed at depth. In the PNW, American Wigeon regularly associate with American Coots, waiting for coots to surface with aquatic vegetation and then snatching it [O1].

### Sources

[G1] USFWS. [G3] Pacific Flyway Data Book. [O1] Cornell Lab, Birds of the World.

---

## Green-winged Teal (Migratory Populations)

```yaml
common_name: "Green-winged Teal"
scientific_name: "Anas crecca"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering / transient (some breeding)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban", "Zone 7: East-Side Steppe"]
```

### Morphometrics

- **Length:** 31-39 cm
- **Wingspan:** 52-59 cm
- **Mass:** 200-450 g
- **Plumage:** Male: chestnut head, iridescent green crescent from eye to nape, cream-colored vertical bar on breast side, gray flanks. Female: cryptic brown. Smallest North American dabbling duck.
- **Sexual dimorphism:** Pronounced.

### Habitat

- **Breeding:** Boreal and subarctic wetlands, beaver ponds, muskegs. Small numbers breed in eastern WA and OR mountain wetlands.
- **Wintering:** Shallow wetlands, mudflats, estuarine edges, flooded fields. Common throughout lowland PNW.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Breeds across boreal Canada and Alaska; migrates south through interior and coastal corridors to PNW and beyond."
  spring_arrival: "Spring departure: March to April"
  fall_departure: "Fall arrival: September to October (one of earliest fall arrivals)"
  staging_areas: ["Klamath Basin, OR/CA", "Malheur NWR, OR", "Skagit Valley, WA"]
  breeding_grounds: "Boreal Canada, Alaska, northern prairie pothole region"
  wintering_grounds: "Pacific Coast from BC to Mexico"
  distance_km: "2,000-4,000"
  flyway_threats: ["Wetland loss", "Boreal habitat fragmentation"]
```

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 2.9 million [G1, G3].

### Evolutionary Note

The Green-winged Teal species complex illustrates ongoing taxonomic debate. North American *A. crecca carolinensis* (American Green-winged Teal) and Eurasian *A. crecca crecca* (Common Teal) were split by AOS but are treated as conspecific by some authorities. The Eurasian form — distinguished by a horizontal white scapular stripe instead of the American form's vertical breast bar — occurs regularly in the PNW as a rare winter visitor, providing a natural contact zone for studying species boundaries in a recently diverged complex [O1, O3].

### Sources

[G1] USFWS. [G3] Pacific Flyway Data Book. [O1] Cornell Lab, Birds of the World.

---

## Long-tailed Duck

```yaml
common_name: "Long-tailed Duck"
scientific_name: "Clangula hyemalis"
taxonomic_order: "Anseriformes"
family: "Anatidae"
status: "wintering"
conservation_status:
  federal_esa: "Not listed"
  iucn: "VU"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (waterfowl)"
ecoregions: ["Zone 6: Coastal/Marine/Pelagic"]
```

### Morphometrics

- **Length:** 39-47 cm (plus 10-15 cm elongated tail in males)
- **Wingspan:** 73-79 cm
- **Mass:** 500-1,000 g
- **Plumage:** Complex — more seasonal plumage changes than any other duck (four distinct plumage sets annually). Winter male: white head/neck/body with dark cheek patch, dark breast band, long tail streamers. Summer male: dark head and breast. Female: brown and white, variable.
- **Sexual dimorphism:** Pronounced (elongated tail feathers in males).

### Habitat

- **Breeding:** Arctic tundra ponds and lakes.
- **Wintering:** Open coastal waters, bays, inland lakes. PNW: primarily Salish Sea, Strait of Juan de Fuca, and outer coast. Capable of diving to 60+ meters — one of the deepest-diving ducks.
- **Ecoregion primary:** Zone 6 (Coastal/Marine)

### Migration

```yaml
migration:
  flyway: "Pacific (marine)"
  route_description: "Arctic breeding grounds south along coast and through interior to marine wintering areas. PNW birds primarily in Salish Sea and outer coast."
  spring_arrival: "Spring departure: April to May"
  fall_departure: "Fall arrival: October to November"
  staging_areas: ["Salish Sea", "Strait of Juan de Fuca"]
  breeding_grounds: "Arctic tundra — Alaska North Slope, Arctic Canada, Siberia"
  wintering_grounds: "Pacific Coast (Salish Sea south to northern CA); Great Lakes; Atlantic coast"
  distance_km: "3,000-5,000"
  flyway_threats: ["Marine pollution (oil spills)", "Bycatch in commercial fishing gill nets", "Offshore wind energy development (future concern)", "Climate-driven shifts in marine prey availability"]
```

### Population

- **Trend:** Declining (globally significant decline)
- **Estimate:** Global population estimated at 3.2-3.7 million but declining rapidly. Baltic Sea population dropped ~65% between 1992-2009. Pacific population estimates uncertain; PNW wintering numbers in low thousands. IUCN status elevated to Vulnerable (VU) in 2012 based on population trend [G1, O1].
- **Threats:** Gill net bycatch is the single largest documented mortality source globally. Oil spill vulnerability high due to concentrated wintering flocks in shipping lanes.

### Evolutionary Note

The Long-tailed Duck is the sole member of genus *Clangula*, making it phylogenetically isolated within the Anatidae. Its closest relatives are uncertain; molecular studies variably place it near the scoters (*Melanitta*) or the goldeneyes (*Bucephala*). The species' four distinct annual plumages — more than any other duck — may represent an extreme form of signaling flexibility, potentially driven by the strong sexual selection pressures of a species with a highly skewed operational sex ratio (males outnumber females in wintering flocks) [O1].

### Sources

[G1] USFWS. [O1] Cornell Lab, Birds of the World.

---

## Pacific Loon, Red-throated Loon, and Common Loon (Wintering)

```yaml
# Pacific Loon
common_name: "Pacific Loon"
scientific_name: "Gavia pacifica"
taxonomic_order: "Gaviiformes"
family: "Gaviidae"
status: "wintering / transient"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
ecoregions: ["Zone 6: Coastal/Marine/Pelagic"]

# Red-throated Loon
common_name: "Red-throated Loon"
scientific_name: "Gavia stellata"
status: "wintering / transient"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
ecoregions: ["Zone 6: Coastal/Marine/Pelagic"]

# Common Loon
common_name: "Common Loon"
scientific_name: "Gavia immer"
status: "wintering (some breeding)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Sensitive"
ecoregions: ["Zone 6: Coastal/Marine/Pelagic", "Zone 2: Montane Conifer (breeding)"]
```

### Morphometrics (Comparative)

| Species | Length (cm) | Wingspan (cm) | Mass (g) |
|---------|-----------|-------------|--------|
| Pacific Loon | 58-74 | 110-128 | 1,000-2,500 |
| Red-throated Loon | 53-69 | 91-120 | 1,000-1,800 |
| Common Loon | 66-91 | 104-131 | 2,200-6,300 |

All three species share the characteristic loon body plan: torpedo-shaped body with legs set far back for diving efficiency, dense bones (reduced pneumaticity for underwater pursuit), and dagger-like bill.

### Habitat

- **Breeding (Common Loon):** Montane lakes in northern WA, BC, and ID. Requires clear, undisturbed lakes >10 acres with minimal shoreline development. Small PNW breeding population (Zone 2).
- **Breeding (Pacific and Red-throated):** Arctic and subarctic lakes; not breeding in PNW.
- **Wintering (all three):** Marine waters — Salish Sea, outer coast, bays, and inland marine waters. Pacific Loon is the most abundant wintering loon in the PNW; Red-throated Loon prefers shallower coastal waters; Common Loon uses both marine and larger inland lakes.
- **Ecoregion primary:** Zone 6 (Coastal/Marine)

### Migration

```yaml
migration:
  flyway: "Pacific (marine)"
  route_description: "Arctic/subarctic breeding lakes south to Pacific Coast marine waters. Migration primarily over water or along coastline. Loons are heavy-bodied and require long takeoff runs, making them vulnerable during migration stopovers."
  spring_arrival: "Spring departure: April to May"
  fall_departure: "Fall arrival: September to November"
  staging_areas: ["Salish Sea (all three)", "Strait of Juan de Fuca", "Outer coast bays", "Grays Harbor (Red-throated)"]
  breeding_grounds: "Arctic/subarctic lakes (Pacific, Red-throated); northern US/Canada montane lakes (Common)"
  wintering_grounds: "Pacific Coast from Alaska to Baja California"
  distance_km: "2,000-5,000"
  flyway_threats: ["Oil spills (extreme vulnerability — concentrated flocks, diving behavior)", "Marine pollution", "Fishing net entanglement", "Mercury bioaccumulation", "Coastal wind energy (future)"]
```

### Population

- **Pacific Loon:** Abundant winter visitor to PNW coastal waters. Flocks of hundreds to thousands visible from shore during migration. Continental population stable [G1].
- **Red-throated Loon:** Common winter visitor. Smaller flocks, shallower coastal foraging. Continental population stable but less well monitored [G1].
- **Common Loon:** WA breeding population <50 pairs (WDFW Sensitive species). Winter marine population supplemented by migrants from interior populations. Population trends complex — declining as breeder in southern range, stable to increasing at northern range [G9].

### Evolutionary Note

Loons (Gaviidae) represent one of the oldest extant avian lineages, with a fossil record extending to the late Cretaceous/early Paleocene. The family's extreme specialization for underwater pursuit — dense bones, posteriorly placed legs, compressed tarsi — comes at the cost of terrestrial mobility (loons can barely walk on land). Pacific Loon and Arctic Loon (*Gavia arctica*) were considered conspecific until AOS split them in 1985 based on plumage, vocal, and molecular differences. In the PNW, Pacific Loon is the expected species; Arctic Loon is a rare vagrant (fewer than 20 accepted records in Washington) [O1, O3].

### Sources

[G1] USFWS. [G9] WDFW Priority Habitats and Species. [O1] Cornell Lab, Birds of the World. [O3] AOS Check-list.

---

# PART II: MIGRATORY RAPTORS

Raptor migration in the PNW is shaped by topography. The Cascade Range, Olympic Mountains, and Coast Ranges generate ridge-lift thermals and orographic updrafts that soaring raptors exploit during migration. Hawk-watch sites at Chelan Ridge (north-central Cascades) and Bonney Butte (southern Oregon Cascades) document 3,000-10,000+ raptors annually, with peak counts in September-October. Unlike the eastern US, where Appalachian ridges funnel thousands of Broad-winged Hawks into concentrated streams, PNW raptor migration is more diffuse, spread across a broader front — but no less ecologically significant [O16, G4].

The migratory raptors profiled here include both long-distance migrants (Swainson's Hawk, Osprey, Turkey Vulture) that winter in Central or South America and short-distance/partial migrants (Rough-legged Hawk, Sharp-shinned Hawk, Cooper's Hawk) that shift latitudinally or elevationally within North America. The Gyrfalcon represents an Arctic species that appears in the PNW only during the harshest winters — a rare winter visitor that electrifies the birding community when it appears.

---

## Swainson's Hawk (EXTENDED)

```yaml
common_name: "Swainson's Hawk"
scientific_name: "Buteo swainsoni"
taxonomic_order: "Accipitriformes"
family: "Accipitridae"
status: "breeding / transient"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (raptors)"
ecoregions: ["Zone 7: East-Side Steppe", "Zone 4: Foothill/Oak Woodland", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 43-56 cm
- **Wingspan:** 117-137 cm
- **Mass:** 650-1,365 g (females larger)
- **Plumage:** Highly variable — light morph (dark bib/breast, white belly, brown upperparts), dark morph (uniformly dark brown), and intermediate forms. Light morph most common in PNW. In flight, shows distinctive two-toned underwing: dark flight feathers, pale wing linings.
- **Sexual dimorphism:** Reversed size dimorphism (female larger, as in most raptors).

### Habitat

- **Breeding:** Open grasslands, sagebrush steppe, agricultural lands with scattered trees or utility poles for nesting. Eastern WA and OR — Columbia Basin, Snake River Plain, Klamath Basin margins.
- **Wintering:** Argentine pampas grasslands — 10,000+ km from PNW breeding grounds.
- **Elevation range:** 500-4,500 ft (breeding sites).
- **Ecoregion primary:** Zone 7 (East-Side Steppe)
- **Ecoregion secondary:** Zone 4 (Foothill/Oak Woodland — southern OR)

### Migration

```yaml
migration:
  flyway: "Pacific / Central (continental)"
  route_description: "The longest regular migration of any North American raptor. PNW breeders depart east-side steppe in late August-September, funnel through Central America at the Isthmus of Tehuantepec (Mexico) and Isthmus of Panama, then disperse across the Argentine pampas for the austral summer. Return north through the same corridor in February-April."
  spring_arrival: "Late March to mid-April (eastern WA/OR)"
  fall_departure: "Late August to mid-September"
  staging_areas: ["Columbia Basin agricultural lands, WA", "Snake River Plain, ID", "Central Valley, CA (brief)"]
  breeding_grounds: "Western North America — Great Basin, Columbia Plateau, Great Plains"
  wintering_grounds: "Argentine pampas (Buenos Aires, La Pampa, Córdoba provinces)"
  distance_km: "10,000-14,000 (one-way — up to 28,000 round trip)"
  flyway_threats: ["Organophosphate and carbamate pesticide exposure on Argentine wintering grounds (documented mass mortality events)", "Wind energy development along migration corridors", "Loss of grassland breeding habitat to agriculture/development", "Utility pole electrocution"]
```

### The Longest Raptor Migration

Swainson's Hawks undertake one of the most extraordinary migrations in the raptor world. Satellite-tracked birds from the Columbia Basin of Washington have been documented traveling over 10,000 km one-way to wintering grounds in the Argentine pampas — a round trip of up to 28,000 km annually. The southbound journey typically takes 6-8 weeks, with birds averaging 100-200 km per day. They travel primarily by soaring on thermals, forming aggregations ("kettles") of hundreds to thousands at thermal hotspots along the Central American land bridge [G4, O1].

The species' dependence on thermal soaring means migration is concentrated during midday hours when thermals are strongest, and routes are constrained to overland corridors (Swainson's Hawks avoid crossing large bodies of water where thermals are absent). The Central American bottleneck — where the continent narrows to less than 80 km at the Isthmus of Panama — concentrates the entire western North American population into a narrow corridor, creating one of the greatest raptor spectacles on Earth. Single-day counts at Veracruz, Mexico, have exceeded 800,000 Swainson's Hawks.

The Argentine wintering grounds present a paradox: the pampas grasslands that sustain the hawks during the austral summer are also among the most intensively farmed regions in South America. In the 1990s, mass mortality events killed an estimated 20,000+ Swainson's Hawks on Argentine wintering grounds due to exposure to monocrotophos (an organophosphate insecticide) applied to control grasshopper outbreaks. International conservation action led to the ban of monocrotophos in Argentina for this use, but the episode illustrated how a species' conservation depends on conditions across its entire annual cycle [G1, O1].

### Diet and Foraging

- **Primary diet:** Insects (grasshoppers, crickets, dragonflies) during migration and on wintering grounds — a dramatic dietary shift from the breeding season diet of small mammals (voles, ground squirrels, pocket gophers). One of the most insectivorous buteos.
- **Foraging strategy:** Soars over grasslands and follows agricultural machinery during breeding season (flushing rodents). On migration and winter grounds, forages on the ground in agricultural fields, walking through crops to catch insects.
- **Seasonal variation:** Breeding season: 60-80% small mammals. Migration and winter: 90%+ insects.

### Reproduction

- **Nest type:** Stick platform, often reused annually.
- **Nest location:** Trees (cottonwood, willow), utility poles, abandoned buildings. Will nest in isolated trees in otherwise treeless steppe.
- **Clutch size:** 2-3 eggs
- **Incubation:** 28-35 days
- **Fledging:** 38-46 days
- **Broods per year:** 1
- **Breeding season:** May-July in PNW

### Population

- **Trend:** Declining in some regions, stable overall
- **Estimate:** Continental population approximately 580,000 (Partners in Flight). Eastern WA/OR breeding population in low thousands [O4, G1].
- **Threats:** Grassland conversion, pesticide exposure on wintering grounds, wind energy, utility pole electrocution. The species' entire population funnels through a single Central American corridor — any disruption there affects the global population.

### Evolutionary Note

Swainson's Hawk occupies a unique ecological niche among North American buteos: it is the only species that shifts from a mammalian diet during breeding to a primarily insectivorous diet during migration and wintering. This dietary plasticity is reflected in relatively weak feet and talons compared to similarly sized buteos (Red-tailed Hawk, Ferruginous Hawk), an adaptation away from prey-killing grip strength toward ground-foraging efficiency. The species is named for William Swainson, the English naturalist; it was first described by Charles Bonaparte in 1838. Molecular phylogenetics place Swainson's Hawk within the *Buteo* clade but as an early-diverging lineage, consistent with its unique migratory and dietary ecology [O1, P1].

### Vocalizations

- **Primary call:** A drawn-out, descending *kreeeeeer* — thinner and more plaintive than Red-tailed Hawk's scream.
- **Alarm call:** Sharp *ki-ki-ki* near nest.

### Ecoregion Presence

```yaml
ecoregion_presence:
  - zone: "Zone 7: East-Side Steppe"
    season: "breeding"
    abundance: "fairly common"
    role: "characteristic"
  - zone: "Zone 4: Foothill/Oak Woodland"
    season: "breeding"
    abundance: "uncommon"
    role: "visitor"
  - zone: "Zone 3: Lowland/Urban"
    season: "migration"
    abundance: "uncommon"
    role: "visitor"
```

### Sources

[G1] USFWS Migratory Bird Program. [G4] USGS satellite tracking data. [O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [P1] Berv & Field 2018 — avian phylogenetics.

---

## Rough-legged Hawk

```yaml
common_name: "Rough-legged Hawk"
scientific_name: "Buteo lagopus"
taxonomic_order: "Accipitriformes"
family: "Accipitridae"
status: "wintering"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
ecoregions: ["Zone 7: East-Side Steppe", "Zone 3: Lowland/Urban", "Zone 5: Riparian/Estuarine"]
```

### Morphometrics

- **Length:** 46-59 cm
- **Wingspan:** 120-153 cm
- **Mass:** 715-1,400 g (females larger)
- **Plumage:** Light morph: dark belly band, white tail base with dark terminal band, dark carpal patches on underwing. Dark morph: dark brown overall with pale flight feather bases. Feathered tarsi ("rough legs") — shared only with Ferruginous Hawk among North American buteos.
- **Sexual dimorphism:** Reversed; females larger.

### Habitat

- **Breeding:** Arctic tundra — cliff ledges and bluffs overlooking open terrain. Not breeding in PNW.
- **Wintering:** Open agricultural lands, sagebrush steppe, grasslands with elevated perch sites (utility poles, fence posts). Columbia Basin, Klamath Basin, Malheur Basin, Willamette Valley margins, Skagit Valley.
- **Elevation range:** Sea level to 4,000 ft.
- **Ecoregion primary:** Zone 7 (East-Side Steppe)

### Migration

```yaml
migration:
  flyway: "Pacific / interior"
  route_description: "Arctic tundra south to temperate grasslands and agricultural areas. Arrival timing linked to lemming population cycles on breeding grounds — years with lemming crashes produce higher winter counts in PNW."
  spring_arrival: "Spring departure: March to April"
  fall_departure: "Fall arrival: October to November"
  staging_areas: ["Not concentrated — arrives broadly across open habitats"]
  breeding_grounds: "Arctic tundra — Alaska, Yukon, NWT, Nunavut"
  wintering_grounds: "Northern US through Pacific states — open agricultural and steppe habitats"
  distance_km: "3,000-5,000"
  flyway_threats: ["Wind energy development in open habitats", "Rodenticide exposure (secondary poisoning from consuming poisoned prey)"]
```

### Population

- **Trend:** Stable (variable — winter numbers fluctuate with Arctic prey cycles)
- **Estimate:** Continental population approximately 300,000. PNW wintering numbers highly variable — thousands in irruption years, hundreds in low years [G1, O1].
- **Threats:** Rodenticide (anticoagulant) exposure is a growing concern as secondary poisoning from consuming poisoned voles and mice.

### Evolutionary Note

The Rough-legged Hawk is one of only two North American buteos with fully feathered tarsi (the other being the Ferruginous Hawk). This convergent adaptation to cold environments reflects the species' Arctic breeding ecology — feathered legs reduce heat loss during ground-nesting on frozen tundra. *Buteo lagopus* is a Holarctic species; Eurasian populations are ecologically equivalent, hunting lemmings and voles across Scandinavian and Siberian tundra. The species' population dynamics are strongly coupled to the 3-4 year lemming cycle — breeding productivity and winter irruption intensity both track prey availability on the Arctic breeding grounds [O1].

### Sources

[G1] USFWS. [O1] Cornell Lab, Birds of the World.

---

## Broad-winged Hawk

```yaml
common_name: "Broad-winged Hawk"
scientific_name: "Buteo platypterus"
taxonomic_order: "Accipitriformes"
family: "Accipitridae"
status: "transient (rare migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
ecoregions: ["Zone 2: Montane Conifer", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 32-44 cm
- **Wingspan:** 74-100 cm
- **Mass:** 265-560 g (females larger)
- **Plumage:** Compact buteo with rufous-barred breast, broadly banded black-and-white tail (adult), dark brown upperparts.
- **Sexual dimorphism:** Reversed; females larger.

### Habitat

- **Breeding:** Deciduous and mixed forests of eastern North America. Rare breeder in northern ID, very rare elsewhere in PNW.
- **Wintering:** Central and South American forests.
- **Ecoregion primary:** Not regularly associated with any PNW ecoregion (rare migrant).

### Migration

```yaml
migration:
  flyway: "Central/Atlantic (primary); Pacific (rare vagrant)"
  route_description: "Primary migration route is eastern North America through Central America. In the PNW, a rare but annual migrant — typically 1-5 individuals per season detected at Cascade hawk-watch sites. Represents the western fringe of the species' migration corridor."
  spring_arrival: "Rare — late April to May (if detected)"
  fall_departure: "Rare — September to October"
  staging_areas: ["None in PNW (no concentrated staging)"]
  breeding_grounds: "Eastern North America — Great Lakes to Maritimes, south to Gulf states"
  wintering_grounds: "Central America, northern South America"
  distance_km: "5,000-9,000"
  flyway_threats: ["Forest habitat loss on breeding and wintering grounds"]
```

### Population

- **Trend:** Stable (eastern populations); PNW occurrence too rare for trend analysis.
- **Estimate:** Continental population approximately 1.7 million. PNW occurrence: 1-10 individuals annually at hawk-watch sites [O1, O16].

### Evolutionary Note

Broad-winged Hawk is the most migratory eastern North American buteo, famous for forming massive kettles of thousands during fall migration at Appalachian hawk-watch sites. Its rarity in the PNW provides a natural experiment in the western limits of its migration corridor. The handful of Broad-winged Hawks detected annually at Chelan Ridge and Bonney Butte likely represent navigational outliers — individuals that strayed westward from the primary Central flyway. Whether these western vagrants successfully reach Central American wintering grounds via a Pacific route or perish is unknown [O1, O16].

### Sources

[O1] Cornell Lab, Birds of the World. [O16] National Audubon Society — hawk-watch data.

---

## Turkey Vulture (Migratory Populations)

```yaml
common_name: "Turkey Vulture"
scientific_name: "Cathartes aura"
taxonomic_order: "Accipitriformes"
family: "Cathartidae"
status: "breeding / transient (migratory populations)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
ecoregions: ["Zone 3: Lowland/Urban", "Zone 4: Foothill/Oak Woodland", "Zone 7: East-Side Steppe", "Zone 2: Montane Conifer"]
```

### Morphometrics

- **Length:** 62-81 cm
- **Wingspan:** 160-183 cm
- **Mass:** 850-2,000 g
- **Plumage:** Black-brown body, bare red head (adults), silvery-gray flight feathers creating two-toned underwing in flight. Holds wings in distinctive dihedral (shallow V) while soaring.
- **Sexual dimorphism:** Minimal.

### Habitat

- **Breeding:** Nest on ground in sheltered locations — rock crevices, hollow logs, abandoned buildings, cliff ledges. Found across PNW from lowland to mid-elevation in open and semi-open habitats.
- **Wintering:** PNW populations migrate south. A few individuals may overwinter in southwestern OR.
- **Ecoregion primary:** Zone 4 (Foothill/Oak Woodland) and Zone 7 (East-Side Steppe)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "PNW breeding birds migrate south through CA and into Mexico/Central America for winter. One of the most visible migrants — large aggregations soar along ridgelines during September-October. Unlike Swainson's Hawk, Turkey Vultures use a combination of thermal soaring and olfactory foraging during migration."
  spring_arrival: "Late February to April (elevation-dependent)"
  fall_departure: "September to October"
  staging_areas: ["Cascade ridge corridors", "Columbia River Gorge", "Rogue Valley, OR"]
  breeding_grounds: "Throughout PNW — lowland to mid-elevation open and semi-open habitats"
  wintering_grounds: "Central Mexico through Central America; some to northern South America"
  distance_km: "3,000-6,000"
  flyway_threats: ["Lead poisoning from consuming lead-contaminated carcasses", "Vehicle collisions (road-killed prey attraction)", "Wind energy"]
```

### Population

- **Trend:** Increasing
- **Estimate:** Continental population approximately 18 million. PNW breeding population abundant and increasing — range expanding northward into BC over recent decades [O1, O4].
- **Threats:** Lead ammunition poisoning from consuming gut piles and carcasses of hunter-killed animals. The species' obligate scavenging ecology makes it particularly vulnerable to secondary lead exposure.

### Evolutionary Note

Turkey Vultures belong to the family Cathartidae (New World vultures), which are not closely related to Old World vultures (Accipitridae) despite remarkable morphological convergence — an iconic example of convergent evolution driven by similar scavenging niches. Molecular phylogenetics have debated the placement of Cathartidae: early DNA-DNA hybridization studies controversially placed them near storks (Ciconiiformes), but more recent genomic analyses confirm their placement within Accipitriformes, closer to hawks and eagles. Turkey Vultures possess the most developed olfactory system of any bird, with an enlarged olfactory bulb enabling them to locate carrion by smell — a capacity rare among birds and unique among the raptors [O1, P1].

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [P1] Berv & Field 2018.

---

## Osprey (EXTENDED)

```yaml
common_name: "Osprey"
scientific_name: "Pandion haliaetus"
taxonomic_order: "Accipitriformes"
family: "Pandionidae"
status: "breeding / transient (migratory)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "Not assessed (raptors)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 6: Coastal/Marine", "Zone 3: Lowland/Urban", "Zone 2: Montane Conifer"]
```

### Morphometrics

- **Length:** 54-58 cm
- **Wingspan:** 150-180 cm
- **Mass:** 1,200-2,050 g (females larger)
- **Plumage:** Dark brown upperparts, white underparts, distinctive dark eye stripe. White head with dark crown. In flight, shows distinctive M-shaped wing silhouette from below, with dark carpal patches.
- **Sexual dimorphism:** Reversed; females larger and often show darker breast band ("necklace").

### Habitat

- **Breeding:** Near water — rivers, lakes, reservoirs, estuaries, marine coastline. Nests on elevated structures: large snags, utility poles, channel markers, artificial platforms, cell towers. PNW is among the highest-density breeding areas in North America.
- **Wintering:** Central America, Caribbean, northern South America. PNW birds are entirely migratory — no overwintering records in WA or OR.
- **Elevation range:** Sea level to 5,000 ft (montane lakes).
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)
- **Ecoregion secondary:** Zone 6 (Coastal/Marine), Zone 2 (Montane — nesting at elevation lakes)

### Migration

```yaml
migration:
  flyway: "Pacific / Central American"
  route_description: "PNW breeders migrate south through California, Mexico, and Central America to wintering areas along Caribbean and Pacific coasts of Central America, Colombia, and Venezuela. Unlike most raptors, Osprey readily cross large water bodies during migration, including the Gulf of Mexico and Caribbean Sea."
  spring_arrival: "Late March to mid-April (PNW breeding sites)"
  fall_departure: "Late August to early October (adults depart before juveniles)"
  staging_areas: ["Columbia River system", "Deschutes River, OR", "Snake River, ID", "Klamath Basin margins"]
  breeding_grounds: "Throughout PNW near water — Puget Sound lowlands to montane lakes"
  wintering_grounds: "Mexico, Central America, Caribbean coast, northern South America"
  distance_km: "5,000-8,000"
  flyway_threats: ["Contaminant accumulation (PCBs, organochlorines — legacy chemicals)", "Nest platform competition with Bald Eagles", "Power line electrocution and collision", "Climate-driven mismatch between arrival and fish availability"]
```

### The Fish Hawk — PNW Ecological Integration

The Osprey is the only raptor in the world whose diet consists almost entirely (>99%) of live fish. This extreme dietary specialization has driven a suite of morphological adaptations unique among raptors: reversible outer toe (can grip fish with two toes forward, two back), barbed foot pads for gripping slippery prey, closable nostrils to prevent water entry during plunge-dives, and dense, oily plumage that repels water. No other raptor shares this combination of adaptations [O1].

In the PNW, Osprey ecology is intimately linked to the region's anadromous fish runs. Breeding Osprey arrival in spring (late March-April) coincides with the onset of warm-water fish activity in rivers and lakes, and the species' breeding cycle is calibrated to peak fish availability during the chick-rearing period (June-July). Along salmon-bearing rivers — the Columbia, Snake, Deschutes, Skagit, and their tributaries — Osprey serve as visible indicators of fish population health. Nesting density along salmon rivers is significantly higher than along fishless or low-productivity water bodies [P11, G9].

The PNW hosts one of the densest Osprey breeding populations in North America. The Columbia River system alone supports hundreds of nesting pairs. Osprey readily adopt artificial nesting platforms — a management tool that has been widely deployed by utility companies and wildlife agencies to reduce nest-related conflicts on power infrastructure. WDFW, ODFW, and BPA (Bonneville Power Administration) maintain Osprey platform programs along the Columbia and Snake rivers [G9, G12].

Osprey are one of the most successfully recovered raptor species following the DDT era. Like Bald Eagles and Peregrine Falcons, Osprey populations crashed in the 1950s-1970s due to DDT-induced eggshell thinning. Following the DDT ban (1972), Osprey populations rebounded strongly across North America. PNW populations now exceed pre-DDT levels in many areas — a conservation success story, though legacy organochlorine contamination persists in some individuals [G1].

### Diet and Foraging

- **Primary diet:** Fish — almost exclusively live fish, typically 150-500 g. Species taken vary by habitat: trout, bass, suckers in freshwater; perch, flounder, smelt in marine areas.
- **Foraging strategy:** Plunge-diving from 10-40 m height. Hovers briefly to locate fish, then dives feet-first with wings folded. Success rate approximately 25-70% (highly variable by water clarity and fish density).
- **Seasonal variation:** Diet composition shifts with available fish species. Spring: suckers, trout. Summer: bass, perch. Coastal breeders take more marine fish.

### Reproduction

- **Nest type:** Large stick platform, often >1 m diameter, reused and augmented annually for decades.
- **Nest location:** Tops of dead trees (snags), utility poles, channel markers, cell towers, artificial platforms. Prefers elevated, open sites near water.
- **Clutch size:** 2-4 eggs (typically 3)
- **Incubation:** 36-42 days (primarily female, fed by male)
- **Fledging:** 50-55 days
- **Broods per year:** 1
- **Breeding season:** April-August in PNW

### Population

- **Trend:** Increasing
- **Estimate:** Continental population approximately 500,000 (Partners in Flight). PNW breeding population among the densest in North America — thousands of pairs across WA, OR, ID, and BC [G1, O4].
- **Threats:** Legacy contaminants (PCBs, DDE), nest competition with expanding Bald Eagle population (eagles sometimes displace Osprey from prime nest sites), power line electrocution, and climate-driven shifts in fish availability.

### Evolutionary Note

The Osprey is the sole member of the family Pandionidae, which diverged from other raptors approximately 25-30 million years ago (Oligocene). It is one of the most widely distributed raptors in the world, found on every continent except Antarctica, with remarkably low genetic differentiation across its global range — consistent with a species capable of crossing oceans during migration. The Pandionidae's early divergence from the Accipitridae makes the Osprey one of the most phylogenetically isolated raptors; its fish-eating specialization evolved independently from the fish-eating specializations seen in sea eagles (*Haliaeetus*), a textbook case of convergent evolution within the raptorial birds [O1, P1].

### Vocalizations

- **Primary call:** High-pitched, whistled *cheep-cheep-cheep* — surprisingly delicate for such a large raptor. Alarm call near nest is a sharper, more urgent series.
- **Courtship flight call:** Undulating display flight accompanied by continuous calling.

### Ecoregion Presence

```yaml
ecoregion_presence:
  - zone: "Zone 5: Riparian/Estuarine"
    season: "breeding"
    abundance: "common"
    role: "indicator"
  - zone: "Zone 6: Coastal/Marine"
    season: "breeding"
    abundance: "fairly common"
    role: "characteristic"
  - zone: "Zone 2: Montane Conifer"
    season: "breeding"
    abundance: "uncommon"
    role: "visitor (montane lakes)"
  - zone: "Zone 3: Lowland/Urban"
    season: "breeding"
    abundance: "common"
    role: "characteristic (urban waterways)"
```

### Sources

[G1] USFWS Migratory Bird Program. [G9] WDFW Priority Habitats and Species. [G12] ODFW Conservation Strategy. [O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [P1] Berv & Field 2018. [P11] Willson & Halupka 1995 — anadromous fish-wildlife linkage.

---

## Sharp-shinned Hawk (Migratory Populations)

```yaml
common_name: "Sharp-shinned Hawk"
scientific_name: "Accipiter striatus"
taxonomic_order: "Accipitriformes"
family: "Accipitridae"
status: "resident / transient (partially migratory)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
ecoregions: ["Zone 2: Montane Conifer", "Zone 3: Lowland/Urban", "Zone 4: Foothill/Oak Woodland"]
```

### Morphometrics

- **Length:** 24-34 cm
- **Wingspan:** 42-58 cm
- **Mass:** 87-218 g (pronounced reversed size dimorphism — females nearly twice male mass)
- **Plumage:** Blue-gray upperparts (adult), rufous-barred breast, long banded tail with squared tip. Juvenile: brown-streaked breast. Smallest North American accipiter.

### Habitat

- **Breeding:** Dense conifer and mixed forest interior (Zones 2, 3). Secretive nester; nests rarely found.
- **Wintering:** Lowland forest edges, suburban areas (attracted to bird feeders — preys on songbirds). Partial migrant: northern and high-elevation breeders migrate south and downslope; some coastal and lowland populations resident year-round.
- **Ecoregion primary:** Zone 2 (Montane Conifer — breeding)

### Migration

```yaml
migration:
  flyway: "Pacific (diffuse)"
  route_description: "Partial migrant — northern/interior breeders move south along mountain ridges. Most abundant migrant raptor at PNW hawk-watch sites (Chelan Ridge, Bonney Butte). Flight style: rapid wingbeats alternating with glides — does not soar on thermals like buteos."
  spring_arrival: "Resident year-round in lowlands; migrants return March to April"
  fall_departure: "Peak passage: September to October"
  staging_areas: ["Not concentrated — migrates on a broad front"]
  breeding_grounds: "Throughout PNW conifer forests"
  wintering_grounds: "Southern PNW lowlands through Mexico"
  distance_km: "500-3,000"
  flyway_threats: ["Window collisions in urban wintering areas", "Pesticide exposure through prey contamination", "Domestic cat competition for songbird prey"]
```

### Population

- **Trend:** Stable (recovering from DDT-era declines)
- **Estimate:** Continental population approximately 700,000. The most frequently counted raptor at PNW hawk-watch sites — Chelan Ridge records 500-1,500 annually [O1, O4, O16].

### Evolutionary Note

Sharp-shinned Hawks show the most extreme reversed sexual size dimorphism of any North American raptor — females average nearly twice the mass of males. This dimorphism is hypothesized to reduce competition between paired birds: males specialize on smaller prey (warblers, kinglets, chickadees) while females take larger prey (thrushes, robins, jays). The size difference also allows males to provision incubating females with minimal nest-disturbance — the smaller male can approach without triggering the female's territorial response to similarly sized intruders [O1].

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [O16] Audubon hawk-watch data.

---

## Cooper's Hawk (Migratory Populations)

```yaml
common_name: "Cooper's Hawk"
scientific_name: "Accipiter cooperii"
taxonomic_order: "Accipitriformes"
family: "Accipitridae"
status: "resident / transient (partially migratory)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
ecoregions: ["Zone 3: Lowland/Urban", "Zone 4: Foothill/Oak Woodland", "Zone 2: Montane Conifer"]
```

### Morphometrics

- **Length:** 35-46 cm
- **Wingspan:** 62-90 cm
- **Mass:** 220-680 g (reversed size dimorphism)
- **Plumage:** Similar to Sharp-shinned Hawk but larger, with rounded tail tip (vs. squared), relatively larger head, and more barrel-chested appearance. Adult: blue-gray above, rufous-barred below. Distinguished from Sharp-shinned by proportions, not markings.

### Habitat

- **Breeding:** Mixed and deciduous forests, riparian corridors, increasingly suburban areas. One of the most successful urban-adapted raptors in North America.
- **Wintering:** Lowland and suburban areas. Urban populations increasingly resident year-round; northern/interior breeders migrate.
- **Ecoregion primary:** Zone 3 (Lowland/Urban)

### Migration

```yaml
migration:
  flyway: "Pacific (diffuse)"
  route_description: "Partial migrant — similar pattern to Sharp-shinned but shorter average distance. Urban populations tend to be resident; rural/montane populations migratory."
  spring_arrival: "Resident year-round in lowlands; migrants return March to April"
  fall_departure: "September to November (later than Sharp-shinned)"
  staging_areas: ["Not concentrated"]
  breeding_grounds: "Throughout PNW — lowland to mid-elevation forest"
  wintering_grounds: "PNW lowlands through Mexico"
  distance_km: "0-2,000 (partial migrant)"
  flyway_threats: ["Window collisions", "Rodenticide secondary poisoning", "Vehicle collisions"]
```

### Population

- **Trend:** Increasing (significant urban expansion)
- **Estimate:** Continental population approximately 800,000. PNW populations increasing, driven by successful colonization of urban and suburban habitats. Cooper's Hawks now nest in cities throughout the PNW, including downtown Seattle, Portland, and Boise [O1, O4].
- **Threats:** Rodenticide poisoning (secondary exposure from consuming poisoned prey) is an emerging concern in urban populations.

### Evolutionary Note

Cooper's Hawk represents one of the most dramatic examples of urban adaptation in North American raptors. Historically associated with mature deciduous and mixed forests, the species has successfully colonized suburban and urban environments across North America over the past 40 years. Urban Cooper's Hawks show measurably different behavior from rural populations: shorter flight initiation distances (more tolerant of humans), altered prey selection (more European Starlings and Rock Pigeons, fewer native species), and modified nest site selection (ornamental conifers, park trees). Whether these behavioral shifts represent phenotypic plasticity or rapid microevolution is an active area of research [O1, P19].

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [P19] Marzluff & Sallabanks 1998.

---

## Gyrfalcon

```yaml
common_name: "Gyrfalcon"
scientific_name: "Falco rusticolus"
taxonomic_order: "Falconiformes"
family: "Falconidae"
status: "wintering (rare)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
ecoregions: ["Zone 7: East-Side Steppe", "Zone 6: Coastal/Marine"]
```

### Morphometrics

- **Length:** 48-65 cm
- **Wingspan:** 110-160 cm
- **Mass:** 805-2,100 g (females significantly larger)
- **Plumage:** Three color morphs: white (Arctic populations — stunning white with sparse dark markings), gray (most common), dark (dark gray-brown overall). PNW winter visitors most commonly gray morph.
- **Sexual dimorphism:** Reversed; females 30-40% heavier.

### Habitat

- **Breeding:** Arctic tundra and coastal cliffs — circumpolar. Not breeding in PNW.
- **Wintering:** Open terrain — coastlines, agricultural flats, steppe. PNW: rare winter visitor to coastal WA (Ocean Shores, Dungeness Spit, Long Beach Peninsula) and open steppe of eastern WA/OR.
- **Ecoregion primary:** Zone 7 (East-Side Steppe — open terrain)

### Migration

```yaml
migration:
  flyway: "N/A (irregular — nomadic winter dispersal rather than structured migration)"
  route_description: "Does not follow defined flyways. Gyrfalcons disperse southward from Arctic breeding grounds in winter, with extent of southward movement linked to ptarmigan and waterfowl prey availability. PNW records most frequent in winters with Arctic prey crashes."
  spring_arrival: "N/A (departure from PNW: February to March)"
  fall_departure: "N/A (arrival to PNW: November to January)"
  staging_areas: ["None — nomadic"]
  breeding_grounds: "Arctic tundra — circumpolar (Alaska, Canada, Greenland, Scandinavia, Russia)"
  wintering_grounds: "Subarctic to northern temperate — irregular extent"
  distance_km: "1,000-4,000 (variable)"
  flyway_threats: ["Climate change reducing Arctic sea ice and altering prey populations", "Illegal falconry take (historically significant, now reduced)"]
```

### Population

- **Trend:** Stable (globally); PNW occurrence too rare for trend analysis
- **Estimate:** Global population approximately 50,000-100,000. PNW winter occurrence: 1-5 individuals per winter statewide (WA); fewer in OR. A bird of immense excitement among the PNW birding community when reported — eBird reports of Gyrfalcons generate significant chasing activity [O1, O2].

### Evolutionary Note

The Gyrfalcon is the largest falcon in the world, adapted to the harshest environments on Earth. Its three color morphs (white, gray, dark) show clinal variation: white morphs predominate in high Arctic populations (Greenland, Canadian Arctic Archipelago), gray in subarctic, and dark in boreal forest edges. The color polymorphism is under genetic control (MC1R locus, analogous to Snow Goose morph genetics) but also shows environmental correlation, suggesting possible selection for crypsis against different substrate backgrounds across the Arctic landscape. The Gyrfalcon occupies the apex of the Arctic food web, with its population dynamics tied to the ptarmigan cycle — a predator-prey coupling as tight as the Snowy Owl-lemming system [O1, P2].

### Sources

[O1] Cornell Lab, Birds of the World. [O2] eBird. [P2] Campagna et al. 2017 — pigmentation genetics.

# PART III: NEOTROPICAL MIGRATORY PASSERINES

Neotropical migration — the seasonal movement of songbirds between breeding grounds in temperate North America and wintering grounds in Mexico, Central America, the Caribbean, and South America — is one of the most ecologically significant phenomena shaping the PNW avian community. Approximately 80-100 landbird species breeding in the PNW are neotropical migrants, representing the majority of the region's passerine diversity during the breeding season. These species arrive in spring, breed, and depart by fall, spending 6-8 months of the year thousands of kilometers from the forests, wetlands, and shrublands where they reproduce [O1, O4].

The ecological importance of neotropical migrants to PNW ecosystems is disproportionate to their seasonal presence. During the breeding season, these species consume vast quantities of foliage-dwelling insects (caterpillars, beetles, aphids), pollinate native plants, and provision their young with protein-rich arthropod prey. Their departure in fall creates a measurable shift in forest insect predation pressure, partially offset by the arrival of winter-resident species (kinglets, chickadees, nuthatches) that forage differently. The spring return of neotropical migrants — a phenological event tracked by birders and ecologists alike — signals the onset of the PNW growing season and the activation of forest food webs that depend on insect-eating birds [O4, P18, P19].

Conservation of PNW neotropical migrants requires a full-annual-cycle perspective. Breeding habitat quality in the PNW is only half the equation — survival depends equally on conditions along migration corridors (stopover habitat quality, artificial light pollution, building collisions, predation) and on wintering grounds (tropical deforestation, agricultural conversion, pesticide exposure). Partners in Flight estimates that North American landbird populations have declined by approximately 2.9 billion individuals since 1970 (Rosenberg et al. 2019, *Science*), with neotropical migrants among the most affected guilds. The species profiled below represent the PNW's contribution to this hemispheric system — birds whose conservation demands international cooperation across political boundaries that they cross twice annually [O4, G1].

---

## Wilson's Warbler (EXTENDED)

```yaml
common_name: "Wilson's Warbler"
scientific_name: "Cardellina pusilla"
taxonomic_order: "Passeriformes"
family: "Parulidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "12 (moderate concern)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 2: Montane Conifer", "Zone 3: Lowland/Urban", "Zone 1: Alpine/Subalpine"]
```

### Morphometrics

- **Length:** 10-12 cm
- **Wingspan:** 14-17 cm
- **Mass:** 5-10 g (one of the lightest PNW breeding passerines)
- **Plumage:** Bright olive-green above, bright yellow below. Male: distinctive glossy black cap (diagnostic). Female: variable — Pacific populations show reduced or partial black cap; many females show olive-washed crown with little or no black. No wingbars.
- **Sexual dimorphism:** Moderate — male black cap consistently larger and more complete than female.

### Habitat

- **Breeding:** Dense, wet thickets — riparian willow and alder corridors, montane meadow edges, wet subalpine scrub, coastal scrub, and logged areas with dense shrub regeneration. The species' affinity for dense, low vegetation distinguishes it from most other PNW warblers, which forage higher in the canopy. Found from sea level to timberline, wherever dense shrub thickets border moist ground.
- **Wintering:** Tropical lowland and foothill forests, second growth, shade coffee plantations, and scrubby edges from western Mexico through Central America to western Panama. Pacific Coast populations winter primarily in western Mexico (Sinaloa through Oaxaca).
- **Elevation range:** Sea level to 6,500 ft (breeding); reaches treeline in subalpine willow thickets.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine — lowland riparian willow)
- **Ecoregion secondary:** Zone 2 (Montane Conifer — wet understory), Zone 1 (Alpine/Subalpine — willow thickets)
- **Microhabitat:** Ground-to-shrub-layer specialist. Nests on or near the ground in dense vegetation. Forages within 3 m of ground level, gleaning insects from leaf surfaces and catching small flying insects in short sallies.

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Pacific Coast populations migrate south along the coast and through interior valleys to wintering grounds in western Mexico and Central America. Interior PNW breeders may route through the Great Basin and Arizona before turning south into Mexico. The species migrates primarily at night, as do most neotropical warblers."
  spring_arrival: "Late March to mid-April (lowland western WA/OR); late April to May (montane and interior)"
  fall_departure: "Late August to mid-September (adults); September to early October (juveniles)"
  staging_areas: ["Willamette Valley riparian corridors", "Columbia River riparian zones", "Puget Sound lowland thickets", "Rogue Valley, OR"]
  breeding_grounds: "Throughout PNW — dense riparian and montane shrub thickets from sea level to timberline"
  wintering_grounds: "Western Mexico (Sinaloa to Oaxaca) through Central America to western Panama"
  distance_km: "3,000-6,000"
  flyway_threats: ["Tropical deforestation on wintering grounds", "Riparian habitat loss on breeding grounds (development, grazing, water diversion)", "Artificial light pollution causing nocturnal migration disorientation", "Window and building collisions during migration", "Pesticide exposure on wintering grounds (shade coffee operations)"]
```

### The Most Abundant Neotropical Migrant

Wilson's Warbler is the single most abundant neotropical migrant breeding in the PNW. Partners in Flight estimates the global population at approximately 60 million individuals, with the Pacific Coast subspecies (*C. p. chryseola*) heavily concentrated in the PNW and coastal California during the breeding season. eBird relative abundance models show Wilson's Warbler as the most frequently detected warbler across western Washington and Oregon from May through August — more numerous than Yellow-rumped Warbler, which dominates the winter warbler community [O1, O2, O4].

The species' abundance in the PNW reflects its habitat generalism within a single structural niche: dense, low, wet vegetation. Unlike many warblers that specialize in specific forest types or canopy strata, Wilson's Warbler occupies any patch of dense shrub thicket adjacent to moisture — from coastal salal-salmonberry tangles at sea level to subalpine willow carr at 6,000 ft. This structural-niche generalism, combined with the PNW's abundance of wet thicket habitats, makes the region a stronghold for the species [O1, P18].

Despite its abundance, Wilson's Warbler has shown measurable population declines in recent decades (approximately 2% per year in some BBS routes), consistent with the broader pattern of neotropical migrant decline across North America. Threats operate at both ends of the migratory cycle: breeding habitat loss through riparian corridor development and grazing pressure in the PNW, and wintering habitat conversion through tropical deforestation in western Mexico and Central America. The species' use of shade coffee plantations as winter habitat offers a conservation opportunity — bird-friendly coffee certification programs directly benefit wintering Wilson's Warblers [O4, G4].

### Diet and Foraging

- **Primary diet:** Insects — caterpillars (Lepidoptera larvae), small beetles, aphids, flies, spiders. Occasional small berries in fall migration.
- **Foraging strategy:** Active gleaner in dense shrub layer. Picks insects from leaf surfaces, hovers briefly at branch tips, and makes short aerial sallies to catch small flying insects. Forages almost exclusively within 3 m of ground level.
- **Seasonal variation:** Breeding diet predominantly caterpillars and soft-bodied larvae. Fall migration diet includes some berries (elderberry, salal). Winter diet in tropics similar to breeding — insects gleaned from foliage.

### Reproduction

- **Nest type:** Open cup on or near the ground, concealed in dense vegetation (ferns, grasses, moss).
- **Nest location:** On ground or within 30 cm of ground level, at base of shrub or under overhanging vegetation.
- **Clutch size:** 4-6 eggs (typically 5)
- **Incubation:** 11-13 days (female only)
- **Fledging:** 8-11 days
- **Broods per year:** 1
- **Breeding season:** May-July in PNW
- **Brown-headed Cowbird parasitism:** Moderate vulnerability — ground nests in edge habitat accessible to cowbirds. Cowbird parasitism is a documented threat in fragmented riparian corridors.

### Population

- **Trend:** Declining (moderate — approximately 1-2% per year, BBS data)
- **Estimate:** Global population approximately 60 million (Partners in Flight). Pacific subspecies (*chryseola*) approximately 20 million. PNW breeding population in the millions — the most abundant neotropical migrant warbler in the region [O4, G4].
- **Threats:** Riparian habitat loss (breeding), tropical deforestation (wintering), cowbird parasitism in fragmented habitats, window collisions during nocturnal migration, artificial light pollution disrupting migration navigation.

### Evolutionary Note

Wilson's Warbler shows striking geographic variation across its range, with three recognized subspecies: *C. p. pusilla* (eastern and boreal), *C. p. pileolata* (Rocky Mountain), and *C. p. chryseola* (Pacific Coast). Genomic studies reveal that Pacific Coast and Rocky Mountain populations diverged during Pleistocene glacial periods, with the Cascade Range and Great Basin forming a semi-permeable barrier to gene flow. Pacific Coast birds (*chryseola*) are brighter yellow, smaller-billed, and more strongly migratory along the coast than interior populations. The species was formerly placed in genus *Wilsonia* but was moved to *Cardellina* based on molecular phylogenetics showing closer affinity to Red-faced Warbler (*C. rubrifrons*) of the Mexican highlands — a surprising result that upended traditional warbler taxonomy [O1, O3, P6].

### Vocalizations

- **Song:** Rapid, chattering series of chips accelerating and dropping in pitch at the end — *chi-chi-chi-chi-chi-chet-chet*. One of the most frequently heard bird songs in PNW riparian areas during May-June.
- **Call:** Sharp *chimp* contact note.

### Ecoregion Presence

```yaml
ecoregion_presence:
  - zone: "Zone 5: Riparian/Estuarine"
    season: "breeding"
    abundance: "abundant"
    role: "characteristic"
  - zone: "Zone 2: Montane Conifer"
    season: "breeding"
    abundance: "common"
    role: "characteristic (wet understory)"
  - zone: "Zone 3: Lowland/Urban"
    season: "breeding"
    abundance: "common"
    role: "characteristic (urban riparian)"
  - zone: "Zone 1: Alpine/Subalpine"
    season: "breeding"
    abundance: "fairly common"
    role: "characteristic (subalpine willow)"
```

### Sources

[O1] Cornell Lab, Birds of the World. [O2] eBird abundance data. [O4] Partners in Flight. [G4] USGS Breeding Bird Survey. [P6] Van Doren et al. 2017 — genetic diversity and differentiation. [P18] Hagar 2007 — non-coniferous vegetation bird associations.

---

## Swainson's Thrush (EXTENDED)

```yaml
common_name: "Swainson's Thrush"
scientific_name: "Catharus ustulatus"
taxonomic_order: "Passeriformes"
family: "Turdidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "10 (low concern)"
ecoregions: ["Zone 2: Montane Conifer", "Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 16-20 cm
- **Wingspan:** 28-32 cm
- **Mass:** 23-45 g
- **Plumage:** Warm olive-brown upperparts, buffy eye ring and lores (diagnostic — distinguishes from Hermit Thrush), buffy wash on breast with dark spotting. Underparts white. Pacific Coast populations (*ustulatus*) warmer-toned (rustier) than interior populations (*swainsoni*).
- **Sexual dimorphism:** Minimal — sexes similar in plumage and size.

### Habitat

- **Breeding:** Moist conifer and mixed-forest understory — the quintessential PNW old-growth understory species. Prefers dense, shaded understory with thick shrub layer (salal, huckleberry, sword fern) in western hemlock, Douglas-fir, Sitka spruce, and western red cedar forests. Also breeds in riparian alder-willow corridors and regenerating clearcuts with dense shrub regrowth.
- **Wintering:** Tropical lowland and montane forests from southern Mexico through Central America to western Amazonia (Peru, Ecuador, Colombia, western Brazil). Pacific Coast populations winter primarily in Central America and northwestern South America.
- **Elevation range:** Sea level to 5,000 ft (breeding). Highest densities below 3,000 ft in mature, moist forest.
- **Ecoregion primary:** Zone 2 (Montane Conifer — moist understory)
- **Ecoregion secondary:** Zone 5 (Riparian/Estuarine — riparian corridors), Zone 3 (Lowland — mature forest patches)
- **Microhabitat:** Understory specialist. Forages on forest floor and in low shrub layer (0-3 m). Nests in shrubs 1-3 m above ground.

### Migration

```yaml
migration:
  flyway: "Pacific / Neotropical"
  route_description: "Pacific Coast populations migrate south along the coast and through Mexico to Central America and northwestern South America. Nocturnal migrant — one of the most frequently detected species on nocturnal flight call recordings during fall migration. Interior populations take a different route through the Great Basin and western Mexico. Pacific and interior populations follow geographically separate migration routes, a pattern confirmed by geolocator studies."
  spring_arrival: "Late April to mid-May (western WA/OR); May (montane sites)"
  fall_departure: "Late August to early October"
  staging_areas: ["Pacific Coast riparian corridors", "Willamette Valley forest patches", "Columbia River Gorge", "Coastal OR/WA forest edges"]
  breeding_grounds: "Throughout PNW moist conifer forests — sea level to mid-elevation"
  wintering_grounds: "Southern Mexico through Central America to northwestern South America (Colombia, Ecuador, Peru, western Brazil)"
  distance_km: "4,000-9,000"
  flyway_threats: ["Tropical deforestation on wintering grounds (Amazonian and Central American forest loss)", "Old-growth and mature forest loss on breeding grounds", "Artificial light pollution during nocturnal migration", "Climate-driven phenological mismatch between arrival and insect emergence", "Predation by domestic cats during stopover"]
```

### The Voice of the PNW Old-Growth at Dusk

The Swainson's Thrush is, for many observers, the defining sound of the PNW forest. Its song — an ascending spiral of flute-like phrases, each higher and more ethereal than the last — fills the moist understory at dusk from late May through July. In old-growth western hemlock and Sitka spruce forests, where the canopy closes overhead and sword ferns carpet the forest floor, the Swainson's Thrush song is the most conspicuous avian vocalization during the last hour of daylight. It is the sonic signature of intact PNW moist forest, and its absence from a formerly occupied stand is a reliable indicator that habitat quality has degraded [O1, P7].

The species' association with PNW old-growth and mature forest is well documented. Studies of avian community composition in old-growth versus second-growth Douglas-fir forests consistently rank Swainson's Thrush among the species most sensitive to forest structural simplification. The thrush requires a combination of dense understory shrub layer (for nesting), deep leaf litter (for foraging), and closed canopy (for thermal regulation and predator protection) — a suite of habitat features most reliably found in forests older than 80-100 years. In managed forests, the species' abundance is directly correlated with understory shrub density and canopy closure [P7, P18, G6].

Geolocator studies have revealed a remarkable migratory pattern: Pacific Coast Swainson's Thrushes (*C. u. ustulatus*) and interior populations (*C. u. swainsoni*) follow geographically distinct migration routes to geographically distinct wintering areas. Coastal birds migrate south along the Pacific coast and winter in Central America, while interior birds loop east through the Great Plains before turning south through eastern Mexico to South America. This migratory divide, which aligns with the Cascade Range, represents one of the clearest examples of population-level migratory connectivity in any Nearctic-Neotropical migrant — breeding origin predicts wintering destination with high accuracy [O1, G4].

### Diet and Foraging

- **Primary diet:** Insects and other invertebrates during breeding season — beetles, ants, caterpillars, spiders, snails, earthworms. Fruit during fall migration and on wintering grounds.
- **Foraging strategy:** Ground-foraging specialist. Hops through leaf litter, flipping leaves and probing soil for invertebrates. Also gleans insects from low shrub foliage. During fall migration, shifts heavily to frugivory — elderberry, salal, cascara, dogwood berries.
- **Seasonal variation:** Breeding diet 85-90% invertebrates. Fall migration diet shifts to 60-70% fruit. Winter diet mixed invertebrates and tropical fruit.

### Reproduction

- **Nest type:** Open cup of twigs, moss, leaves, and plant fibers, lined with fine rootlets.
- **Nest location:** In dense shrubs or small trees, typically 1-3 m above ground. Prefers salal, huckleberry, or young conifers in western PNW.
- **Clutch size:** 3-4 eggs (typically 4)
- **Incubation:** 12-14 days (female only)
- **Fledging:** 10-14 days
- **Broods per year:** 1
- **Breeding season:** Late May to July in PNW
- **Brown-headed Cowbird parasitism:** Low — the species' preference for dense, interior forest reduces encounter rate with cowbirds, which favor edge habitats.

### Population

- **Trend:** Declining (moderate — approximately 1% per year, BBS data)
- **Estimate:** Global population approximately 100 million (Partners in Flight). PNW breeding population in the millions — one of the most abundant forest-breeding passerines in the region [O4, G4].
- **Threats:** Old-growth and mature forest loss on breeding grounds remains the primary PNW threat. Tropical deforestation on wintering grounds compounds breeding habitat loss. Climate-driven phenological mismatch — if spring warming causes insect emergence to advance faster than thrush arrival, breeding productivity may decline.

### Evolutionary Note

The *Catharus* thrush genus represents a radiation of forest-floor specialists across the Americas, with Swainson's Thrush and its congeners (Hermit Thrush, Gray-cheeked Thrush, Bicknell's Thrush, Veery) occupying a remarkably tight ecological niche space. All are brown-backed, spotted-breasted, ground-foraging, understory-nesting species — differentiated primarily by elevation, latitude, and habitat moisture preference. In the PNW, Swainson's Thrush and Hermit Thrush often breed in close proximity but partition habitat by moisture gradient: Swainson's Thrush in wetter, denser understory, Hermit Thrush in drier, more open forest floor. Molecular phylogenetics confirm that Pacific Coast (*ustulatus*) and interior (*swainsoni*) populations diverged during the Pleistocene, with the Cascade Range serving as a vicariance barrier. Some authors have proposed splitting these into two species based on genetic divergence, plumage differences, migratory route divergence, and differing song structure — a taxonomic decision that may come before the AOS in the next decade [O1, O3, P6].

### Vocalizations

- **Song:** Ascending, spiraling series of flute-like phrases — each phrase higher in pitch than the last, creating an upward-spiraling quality. Typically 5-8 phrases per song bout. Sung primarily at dusk and dawn, continuing into near-darkness. The most ethereal avian vocalization in the PNW forest.
- **Call:** Soft, liquid *whit* — a single, clear note heard from the understory. Flight call: a short, buzzy *queer* given during nocturnal migration (detectable with audio recording equipment at migration monitoring stations).

### Ecoregion Presence

```yaml
ecoregion_presence:
  - zone: "Zone 2: Montane Conifer"
    season: "breeding"
    abundance: "abundant"
    role: "indicator (old-growth understory health)"
  - zone: "Zone 5: Riparian/Estuarine"
    season: "breeding"
    abundance: "common"
    role: "characteristic (riparian corridors)"
  - zone: "Zone 3: Lowland/Urban"
    season: "breeding"
    abundance: "fairly common"
    role: "visitor (mature lowland forest patches)"
```

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS Breeding Bird Survey. [G6] USFS PNW Research Station. [P6] Van Doren et al. 2017. [P7] DellaSala et al. 2011 — temperate rainforests. [P18] Hagar 2007.

---

## Western Tanager (EXTENDED)

```yaml
common_name: "Western Tanager"
scientific_name: "Piranga ludoviciana"
taxonomic_order: "Passeriformes"
family: "Cardinalidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "9 (low concern)"
ecoregions: ["Zone 2: Montane Conifer", "Zone 4: Foothill/Oak Woodland", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 16-19 cm
- **Wingspan:** 28-30 cm
- **Mass:** 24-36 g
- **Plumage:** Male breeding: brilliant orange-red head, bright yellow body, black wings with two wingbars (one yellow, one white), black tail. Female: olive-green above, yellow below, grayish wings with two pale wingbars. Male non-breeding (fall/winter): duller, with yellowish head replacing red.
- **Sexual dimorphism:** Pronounced — male breeding plumage is the most colorful of any regularly occurring PNW passerine.

### Habitat

- **Breeding:** Open to moderately dense conifer and mixed forests at mid-elevation. Prefers ponderosa pine, Douglas-fir, and mixed conifer stands with open canopy — avoids dense, closed-canopy forest. More common in drier, more open montane forests than in the wet westside forests favored by Swainson's Thrush. Found on both sides of the Cascades.
- **Wintering:** Pine-oak and montane forests from central Mexico through Central America to Costa Rica and western Panama.
- **Elevation range:** 1,000-6,000 ft (breeding). Peak densities at 2,000-5,000 ft.
- **Ecoregion primary:** Zone 2 (Montane Conifer — open canopy)
- **Ecoregion secondary:** Zone 4 (Foothill/Oak Woodland — ponderosa-oak transition)
- **Microhabitat:** Mid-to-upper canopy forager. Nests on horizontal conifer branches, typically 15-65 ft above ground. Prefers open stands where canopy gaps allow aerial foraging.

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through interior valleys, eastern Cascades, and Great Basin to Mexico and Central America. Unlike many neotropical migrants, Western Tanager migrates partially by day as well as by night. Spring migration through the PNW is conspicuous — bright males appear in lowland parks and gardens during April-May stopover before ascending to breeding elevation."
  spring_arrival: "Late April to mid-May (appears at low elevations before ascending to montane breeding sites)"
  fall_departure: "Late August to September"
  staging_areas: ["Rogue Valley, OR", "East Cascades foothills", "Columbia Basin riparian", "Snake River Canyon, ID"]
  breeding_grounds: "Montane conifer forests throughout PNW — both slopes of Cascades, Blue Mountains, Selkirks"
  wintering_grounds: "Central Mexico (pine-oak zone) through Central America to Costa Rica/western Panama"
  distance_km: "3,000-6,000"
  flyway_threats: ["Pine-oak forest loss in Mexico (logging, fire)", "Breeding habitat degradation from fire suppression (increased canopy density)", "Pesticide exposure during migration and on wintering grounds", "Window collisions during lowland stopover"]
```

### The Red That Should Not Be

Western Tanager plumage presents one of the most unusual stories in avian pigmentation biochemistry. The brilliant red-orange head of breeding males is colored by rhodoxanthin, a rare carotenoid pigment that the species cannot synthesize de novo. Unlike most red-plumaged birds (Northern Cardinal, House Finch), which derive red carotenoid pigments from dietary sources and metabolically convert them to ketocarotenoids for feather coloration, Western Tanager obtains rhodoxanthin directly from an external dietary source — and the source is insects that feed on conifer needles [O1].

Rhodoxanthin is produced by certain conifers (notably western hemlock and Douglas-fir) and is present in the bodies of insects that consume conifer foliage. Western Tanagers that eat these insects during the spring molt incorporate rhodoxanthin into growing head feathers, producing the diagnostic red coloration. This pigment pathway is unique among North American passerines — no other regularly occurring species is known to use rhodoxanthin as its primary red pigment. Captive Western Tanagers deprived of rhodoxanthin-containing insects grow yellow head feathers instead of red, confirming the dietary dependency [O1, P2].

This discovery connects Western Tanager plumage color to conifer forest health in a direct biochemical chain: conifers produce rhodoxanthin → conifer-feeding insects bioaccumulate rhodoxanthin → Western Tanagers eat insects and incorporate rhodoxanthin into feathers → red plumage signals dietary access to conifer-insect food webs. The intensity of male red coloration may therefore serve as an honest signal of territory quality — males in healthy conifer forests with abundant foliage-feeding insects should display brighter red heads than males in degraded habitats.

### Diet and Foraging

- **Primary diet:** Insects during breeding season (wasps, beetles, caterpillars, grasshoppers, dragonflies); fruit during migration and on wintering grounds. The species' diet is more diverse than most PNW warblers, reflecting its position in a higher trophic level.
- **Foraging strategy:** Canopy gleaner and aerial sallier. Perches on exposed branches and flies out to capture passing insects (flycatcher-like behavior). Also gleans insects from conifer needles and branches. During migration, takes fruit from native and ornamental trees.
- **Seasonal variation:** Breeding diet 70-80% insects. Fall migration and winter diet shifts to 50-70% fruit (hackberry, elderberry, tropical fruits).

### Reproduction

- **Nest type:** Shallow cup of twigs, rootlets, and plant fibers, lined with fine materials.
- **Nest location:** On horizontal conifer branch, typically 15-65 ft above ground, well out from trunk. Douglas-fir and ponderosa pine are common nest trees in PNW.
- **Clutch size:** 3-5 eggs (typically 4)
- **Incubation:** 13 days (female only)
- **Fledging:** 11-15 days
- **Broods per year:** 1
- **Breeding season:** May-July in PNW

### Population

- **Trend:** Stable (slight decline in some regions)
- **Estimate:** Global population approximately 12 million (Partners in Flight). Common throughout montane PNW — one of the most frequently encountered breeding passerines in mid-elevation conifer forests [O4, G4].
- **Threats:** Fire suppression increasing canopy density in east-side forests (reducing preferred open-canopy structure). Pine-oak forest loss on Mexican wintering grounds. Moderate vulnerability to window collisions during lowland migration stopover.

### Evolutionary Note

Despite its common name, the Western Tanager is not a true tanager (Thraupidae). Molecular phylogenetics placed the North American *Piranga* tanagers within the cardinal family (Cardinalidae), far from the true tanagers of South America. The AOS recognized this reclassification, moving *Piranga* from Thraupidae to Cardinalidae — meaning the Western Tanager is more closely related to Northern Cardinal and Rose-breasted Grosbeak than to any South American tanager. The common name "tanager" persists despite the taxonomic correction, a legacy of 19th-century classification based on plumage convergence rather than phylogeny. *Piranga ludoviciana* is the only regularly occurring member of its genus in the PNW; Scarlet Tanager (*P. olivacea*) and Summer Tanager (*P. rubra*) are rare vagrants [O1, O3].

### Vocalizations

- **Song:** A series of hoarse, burry phrases similar in rhythm to American Robin but rougher in quality — *cheer-a-lee, cheer-a-low, cheer-a-lee*. Often described as "a Robin with a sore throat."
- **Call:** Distinctive dry, rising *pit-ick* — one of the most useful ID calls for locating the species in dense conifer canopy.

### Ecoregion Presence

```yaml
ecoregion_presence:
  - zone: "Zone 2: Montane Conifer"
    season: "breeding"
    abundance: "common"
    role: "characteristic"
  - zone: "Zone 4: Foothill/Oak Woodland"
    season: "breeding"
    abundance: "fairly common"
    role: "characteristic (ponderosa-oak transition)"
  - zone: "Zone 3: Lowland/Urban"
    season: "migration"
    abundance: "fairly common"
    role: "visitor (stopover in parks and gardens)"
```

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS Breeding Bird Survey. [P2] Campagna et al. 2017 — pigmentation genetics.

---

## Common Nighthawk (EXTENDED)

```yaml
common_name: "Common Nighthawk"
scientific_name: "Chordeiles minor"
taxonomic_order: "Caprimulgiformes"
family: "Caprimulgidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "13 (moderate concern — declining)"
ecoregions: ["Zone 7: East-Side Steppe", "Zone 3: Lowland/Urban", "Zone 4: Foothill/Oak Woodland"]
```

### Morphometrics

- **Length:** 22-25 cm
- **Wingspan:** 51-61 cm
- **Mass:** 55-98 g
- **Plumage:** Cryptic gray-brown mottled plumage with narrow white throat patch. In flight: long, pointed wings with distinctive white wing patch (bar across primaries, diagnostic). Small, weak bill but enormous gape for aerial insect capture.
- **Sexual dimorphism:** Moderate — male has white throat patch and white subterminal tail band; female has buffy throat and lacks tail band.

### Habitat

- **Breeding:** Open habitats — gravelly prairies, sagebrush steppe, clearcuts, burned areas, and urban flat rooftops. One of the few PNW species that nests successfully on flat gravel rooftops in urban areas. Eastern WA/OR steppe is the primary PNW habitat; urban populations in Portland, Seattle, Spokane, and Boise historically significant but declining.
- **Wintering:** South American lowlands — open grasslands, savannas, and agricultural areas from Colombia through Argentina.
- **Elevation range:** Sea level to 6,000 ft.
- **Ecoregion primary:** Zone 7 (East-Side Steppe)
- **Ecoregion secondary:** Zone 3 (Lowland/Urban — rooftop nesting)

### Migration

```yaml
migration:
  flyway: "Central / Pacific"
  route_description: "One of the longest migrations of any near-passerine. PNW breeders migrate south through the Great Basin, Mexico, Central America, across the Caribbean basin or through eastern Central America, and into South America as far south as Argentina. Fall migration features spectacular aggregations — flocks of hundreds to thousands foraging on swarming insects at dusk during southbound passage. Spring migration more diffuse."
  spring_arrival: "Late May to early June (one of the latest-arriving PNW migrants)"
  fall_departure: "Late August to mid-September (one of the earliest-departing)"
  staging_areas: ["Columbia Basin agricultural areas, WA", "Snake River Plain, ID", "Klamath Basin margins, OR"]
  breeding_grounds: "Throughout PNW — east-side steppe, urban rooftops, clearcuts, burned areas"
  wintering_grounds: "South America — Colombia through Argentina, primarily east of the Andes in open grassland and savanna"
  distance_km: "8,000-10,000+ (one-way — among the longest passerine-like migrations in the Western Hemisphere)"
  flyway_threats: ["Insect population decline (aerial insectivore crisis)", "Urban rooftop conversion from gravel to rubberized membrane (eliminates nesting habitat)", "Pesticide reduction of prey base", "Artificial light attraction causing disorientation and exhaustion", "Wind energy development in open habitats"]
```

### The Aerial Insectivore Crisis

Common Nighthawk is one of the most dramatically declining aerial insectivores in North America, part of a broader pattern that conservation biologists have termed the "aerial insectivore crisis." Across the continent, species that capture insects in sustained flight — nighthawks, swifts, swallows, and flycatchers — have shown steeper and more consistent population declines than any other ecological guild since the 1970s. BBS data show Common Nighthawk declining at approximately 2-3% per year across much of its range, with cumulative losses exceeding 50% since 1970 [O4, G4].

The causes of the aerial insectivore decline remain incompletely understood, but leading hypotheses center on insect population collapse driven by pesticide use (neonicotinoids, organophosphates), habitat loss, light pollution, and climate change. For Common Nighthawk specifically, the convergence of multiple threats creates a perfect storm: breeding habitat loss (gravel rooftop conversion in urban areas, fire suppression in steppe habitats), prey base decline (fewer large flying insects available at dusk), and the species' extreme migration distance (8,000-10,000+ km one-way) which exposes it to threats across a vast geographic range [O4].

Urban nesting on flat gravel rooftops was historically a significant component of Common Nighthawk breeding ecology in PNW cities. The distinctive booming "peent" call and wing-buzzing courtship dive of displaying males at dusk over parking lots, malls, and industrial buildings was once a familiar summer sound in Portland, Seattle, and Spokane. The transition from gravel-topped flat roofs to rubberized membrane roofing — driven by energy efficiency standards and commercial building codes — has eliminated thousands of potential nest sites. Where gravel rooftops with suitable nesting substrate remain, nighthawks continue to breed, but these sites are declining rapidly [O1, G9].

### Diet and Foraging

- **Primary diet:** Flying insects — moths, beetles, flying ants, mosquitoes, mayflies, caddisflies. Takes prey exclusively on the wing, with enormous gape allowing capture of large moths and beetles.
- **Foraging strategy:** Crepuscular and nocturnal aerial forager. Flies with erratic, bat-like wingbeats over open terrain, urban areas, and water bodies, scooping insects from the air. Often attracted to insect swarms around stadium lights, streetlights, and illuminated buildings.
- **Seasonal variation:** Diet varies with local insect availability. Fall migration flocks target dense insect swarms at dusk.

### Reproduction

- **Nest type:** No nest — eggs laid directly on bare substrate.
- **Nest location:** Flat, open ground — gravel bars, rocky steppe, burned areas, flat gravel rooftops. The female's cryptic plumage provides the only nest concealment (she sits motionless on eggs, virtually invisible against gravel substrate).
- **Clutch size:** 2 eggs (invariably)
- **Incubation:** 18-20 days (primarily female)
- **Fledging:** 17-18 days (young can run on substrate before flight-capable)
- **Broods per year:** 1
- **Breeding season:** June-August in PNW (short season due to late arrival)

### Population

- **Trend:** Declining (steep — approximately 2-3% per year, BBS data)
- **Estimate:** Continental population approximately 16 million (Partners in Flight), down from an estimated 30-40 million in the 1970s. PNW populations declining across all habitats — urban, steppe, and wildland [O4, G4].
- **Threats:** Insect population decline (primary driver), urban rooftop habitat conversion, pesticide exposure, light pollution, wind energy.

### Evolutionary Note

Despite its common name, the Common Nighthawk is not a hawk and is only distantly related to hawks. It belongs to the order Caprimulgiformes (nightjars), an ancient lineage that diverged from other birds over 60 million years ago. Caprimulgiformes share remarkable convergent adaptations for nocturnal/crepuscular aerial insectivory: enormous gape surrounded by rictal bristles for insect capture, cryptic plumage for daytime camouflage, and extremely large eyes with high rod density for low-light vision. The Common Nighthawk is actually the most diurnal member of the nightjar family in North America — it regularly forages at dusk and dawn rather than in full darkness, and its pointed, falcon-like wings (as opposed to the broader, softer wings of other nightjars like Whip-poor-will) are adapted for sustained, agile flight rather than slow quartering [O1].

### Vocalizations

- **Flight call:** A loud, nasal, buzzy *peent* — given continuously during crepuscular display flights. One of the most distinctive sounds of summer evenings in the PNW steppe.
- **Wing boom:** During courtship dive, the male pulls up sharply from a steep dive, producing a deep, resonant *vvrrooom* as air rushes over the primary feathers. Audible at distances of 500+ m.

### Ecoregion Presence

```yaml
ecoregion_presence:
  - zone: "Zone 7: East-Side Steppe"
    season: "breeding"
    abundance: "fairly common"
    role: "characteristic"
  - zone: "Zone 3: Lowland/Urban"
    season: "breeding"
    abundance: "uncommon (declining)"
    role: "visitor (urban rooftop nesting)"
  - zone: "Zone 4: Foothill/Oak Woodland"
    season: "breeding"
    abundance: "uncommon"
    role: "visitor (open areas)"
```

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [G4] USGS Breeding Bird Survey. [G9] WDFW Priority Habitats and Species.

---

## Vaux's Swift (EXTENDED)

```yaml
common_name: "Vaux's Swift"
scientific_name: "Chaetura vauxi"
taxonomic_order: "Apodiformes"
family: "Apodidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed (but declining)"
  state_or: "Sensitive (ODFW)"
  pif_score: "13 (moderate concern)"
ecoregions: ["Zone 2: Montane Conifer", "Zone 3: Lowland/Urban", "Zone 5: Riparian/Estuarine"]
```

### Morphometrics

- **Length:** 11-12 cm
- **Wingspan:** 27-30 cm
- **Mass:** 14-21 g
- **Plumage:** Uniformly dark brown-gray above and below, slightly paler on throat and breast. Short, stubby tail with protruding spine tips (stiffened rachis shafts used as props when clinging to vertical surfaces inside hollow trees and chimneys). Cigar-shaped body, long curved wings. The smallest swift in North America.
- **Sexual dimorphism:** None apparent — sexes identical in plumage and size.

### Habitat

- **Breeding:** Old-growth conifer forests with large hollow snags — the species' original and primary nesting habitat. Nests inside hollow snags of old-growth Douglas-fir, western red cedar, and Sitka spruce, attaching a small cup nest to the inner wall with sticky saliva. Increasingly uses large-diameter brick chimneys as surrogate roost and nest sites as old-growth snag availability declines.
- **Wintering:** Southern Mexico through Central America to Venezuela. Poorly documented on wintering grounds — one of the least-studied aspects of the species' ecology.
- **Elevation range:** Sea level to 5,000 ft (breeding). Forages over a wide elevation range, including alpine meadows.
- **Ecoregion primary:** Zone 2 (Montane Conifer — old-growth snag nesting)
- **Ecoregion secondary:** Zone 3 (Lowland/Urban — chimney roosting), Zone 5 (Riparian — foraging over water)
- **Microhabitat:** Aerial forager — spends virtually all daylight hours on the wing. Roost and nest sites are inside enclosed vertical cavities (hollow snags, chimneys). Cannot perch on branches or horizontal surfaces — feet adapted only for clinging to vertical surfaces.

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Migrates south along the Pacific Coast and through interior valleys to wintering grounds in Mexico and Central America. Fall migration features one of the Pacific Northwest's most spectacular wildlife displays — mass communal roosting in large chimneys during September staging."
  spring_arrival: "Late April to mid-May"
  fall_departure: "September to early October (after chimney roosting spectacle)"
  staging_areas: ["Portland, OR (Chapman Elementary School chimney — iconic)", "Seattle, WA (various chimneys)", "Monroe, WA (Wagner Performing Arts Center chimney)", "Eugene, OR", "Corvallis, OR"]
  breeding_grounds: "Old-growth and mature conifer forests throughout PNW — hollow snags and large chimneys"
  wintering_grounds: "Southern Mexico through Central America to Venezuela"
  distance_km: "4,000-7,000"
  flyway_threats: ["Old-growth snag loss (primary breeding habitat)", "Chimney demolition and capping (eliminates surrogate roost/nest sites)", "Aerial insectivore decline (insect prey base reduction)", "Climate-driven phenological mismatch"]
```

### The Chapman Elementary Spectacle

Every September, a massive communal roost of Vaux's Swifts forms at the chimney of Chapman Elementary School in northwest Portland, Oregon — an annual spectacle that draws thousands of human spectators and has become one of the defining wildlife events of the Pacific Northwest. At peak migration (typically mid- to late September), 10,000 to 30,000 Vaux's Swifts stage at the Chapman chimney, spending each evening in a dramatic aerial display as they funnel into the chimney at dusk [O1, G12].

The spectacle unfolds predictably: beginning approximately one hour before sunset, swifts that have spent the day foraging over the Portland metropolitan area begin to aggregate in a loose, swirling cloud above the school. The cloud tightens as sunset approaches, forming a dense, clockwise-rotating vortex directly over the chimney. As light fades, individual birds begin to drop into the chimney — slowly at first, then in a torrent, with the entire flock of thousands funneling into the narrow chimney shaft in 20-30 minutes. The aerial display is frequently punctuated by a Cooper's Hawk or Peregrine Falcon making passes through the swarm, creating explosive evasion maneuvers visible from blocks away.

Chapman Elementary is not unique — Vaux's Swifts use dozens of large-diameter brick chimneys across the PNW for communal roosting during migration. The Monroe, Washington chimney at the Wagner Performing Arts Center regularly hosts 5,000-15,000 swifts. But Chapman has achieved iconic status through community engagement: Portland Audubon Society volunteers monitor the roost nightly during September, the school district protects the chimney (declining offers to cap or demolish it), and the event draws 2,000-3,000 human spectators on peak nights — families picnicking on the school hillside to watch the sunset show.

The conservation significance of these chimney roosts cannot be overstated. Vaux's Swift's natural roosting and nesting substrate — large-diameter hollow snags in old-growth conifer forest — has declined dramatically with timber harvest. Large brick chimneys serve as functional surrogates, but they too are disappearing as buildings are demolished, renovated, or retrofitted with chimney caps. The loss of a single major roost chimney can displace thousands of staging swifts. Portland Audubon and other organizations advocate for chimney preservation and construction of purpose-built swift towers [G12, O11].

### Diet and Foraging

- **Primary diet:** Small flying insects — flies, mosquitoes, flying ants, small beetles, aphids. All prey taken on the wing.
- **Foraging strategy:** Continuous aerial foraging during daylight. Flies with rapid, flickering wingbeats interspersed with glides, coursing low over forests, wetlands, and urban areas. Often forages in loose flocks. Drinks by skimming water surfaces in flight.
- **Seasonal variation:** Diet follows local insect emergence. Spring foraging concentrated over rivers and wetlands (aquatic insect hatches). Summer foraging broader. Fall staging flocks forage heavily to fuel migration.

### Reproduction

- **Nest type:** Small half-cup of twigs glued together and to cavity wall with sticky saliva (similar to Chimney Swift).
- **Nest location:** Inside hollow snags (old-growth) or large-diameter chimneys. Attaches to inner wall, typically 1-5 m below cavity entrance.
- **Clutch size:** 3-6 eggs (typically 4-5)
- **Incubation:** 18-19 days (both sexes)
- **Fledging:** 28-30 days
- **Broods per year:** 1
- **Breeding season:** May-July in PNW

### Population

- **Trend:** Declining (moderate)
- **Estimate:** Continental population approximately 550,000 (Partners in Flight). PNW breeding population declining — old-growth snag loss and chimney demolition reducing available nest and roost sites. Chapman Elementary chimney roost counts have shown year-to-year variability but no clear long-term decline, suggesting that migration staging populations may be more stable than breeding populations [O4, G4, G12].
- **Threats:** Old-growth snag loss (primary), chimney demolition and capping (critical for migration staging), aerial insectivore decline (shared with Common Nighthawk), pesticide reduction of prey base.

### Evolutionary Note

Swifts (Apodidae) are among the most aerial of all birds — Vaux's Swift spends virtually all waking hours on the wing, landing only to roost and nest inside enclosed cavities. The family name *Apodidae* means "footless," a reference to their tiny, weak feet adapted only for clinging to vertical surfaces. Despite superficial resemblance to swallows, swifts are not closely related — they belong to the order Apodiformes, which includes hummingbirds as their closest relatives. Vaux's Swift and Chimney Swift (*Chaetura pelagica*) are sister species that diverged during the Pleistocene, with Vaux's occupying the western and Chimney Swift the eastern half of the continent. Their ecological parallels — both originally nesting in hollow trees, both adopting chimneys as surrogate habitat, both declining as both habitat types disappear — represent a natural continental-scale replicate experiment in habitat loss [O1, P1].

### Vocalizations

- **Flight call:** High-pitched, rapid chittering — *chi-chi-chi-chi-chi* — given in flight, especially near roost and nest sites. The collective sound of thousands of chittering swifts circling a roost chimney at dusk is audible several blocks away.

### Ecoregion Presence

```yaml
ecoregion_presence:
  - zone: "Zone 2: Montane Conifer"
    season: "breeding"
    abundance: "fairly common"
    role: "indicator (old-growth snag availability)"
  - zone: "Zone 3: Lowland/Urban"
    season: "migration"
    abundance: "common (staging)"
    role: "characteristic (chimney roost spectacle)"
  - zone: "Zone 5: Riparian/Estuarine"
    season: "breeding"
    abundance: "fairly common"
    role: "visitor (foraging over water)"
```

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [O11] Bird Alliance of Oregon. [G4] USGS Breeding Bird Survey. [G12] ODFW Conservation Strategy. [P1] Berv & Field 2018 — avian phylogenetics.

---

## Western Wood-Pewee

```yaml
common_name: "Western Wood-Pewee"
scientific_name: "Contopus sordidulus"
taxonomic_order: "Passeriformes"
family: "Tyrannidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "12 (moderate concern)"
ecoregions: ["Zone 2: Montane Conifer", "Zone 4: Foothill/Oak Woodland", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 14-17 cm
- **Wingspan:** 25-27 cm
- **Mass:** 10-17 g
- **Plumage:** Grayish-olive above, pale grayish below with darker breast, two narrow pale wingbars. Dark bill with orange-yellow lower mandible base. Virtually identical to Eastern Wood-Pewee (*C. virens*) in plumage — distinguished primarily by voice and range.
- **Sexual dimorphism:** None apparent.

### Habitat

- **Breeding:** Open-canopy forest and woodland — ponderosa pine, Douglas-fir, oak woodland, cottonwood riparian. Prefers forest edges and openings with exposed perch branches for aerial sallying. Common on east side of Cascades.
- **Wintering:** Tropical forest edges and second growth, Mexico through Central America to northern South America (Colombia, Venezuela, western Ecuador/Peru).
- **Elevation range:** Sea level to 6,000 ft.
- **Ecoregion primary:** Zone 2 (Montane Conifer — open canopy)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through interior valleys and Great Basin to Mexico and Central America. One of the latest spring arrivals among PNW neotropical migrants."
  spring_arrival: "Mid-May to early June"
  fall_departure: "Late August to mid-September"
  staging_areas: ["East Cascades foothills", "Rogue Valley, OR", "Snake River corridor, ID"]
  breeding_grounds: "Open-canopy conifer and mixed forests throughout PNW"
  wintering_grounds: "Mexico through Central America to Colombia, Venezuela, western Peru"
  distance_km: "4,000-8,000"
  flyway_threats: ["Aerial insectivore decline", "Fire suppression increasing canopy density", "Tropical deforestation on wintering grounds"]
```

### Diet and Foraging

- **Primary diet:** Flying insects — bees, wasps, flies, beetles, moths. All prey taken in aerial sallies from exposed perches.
- **Foraging strategy:** Classic tyrant flycatcher behavior — perches on exposed dead branch, flies out to capture passing insects, returns to perch. Sallying flights average 2-8 m.

### Population

- **Trend:** Declining (moderate — approximately 1.5% per year, BBS data)
- **Estimate:** Continental population approximately 32 million. Common breeding species in PNW open-canopy forests [O4, G4].
- **Threats:** Part of the aerial insectivore decline. Fire suppression in east-side forests reduces open-canopy habitat.

### Evolutionary Note

Western and Eastern Wood-Pewees are vocally distinct but morphologically cryptic sister species — their separation by AOS was based primarily on song differences and genetic divergence. In the PNW, only Western Wood-Pewee occurs regularly. The species' diagnostic *pee-wee* song (a burry, descending whistle) is one of the most persistent summer vocalizations in PNW open forests, given continuously from dawn through dusk [O1, O3].

### Vocalizations

- **Song:** A burry, descending *pee-wee* (or *pee-eer*), given from exposed perch repeatedly throughout the day. Also a harsh, upslurred *pree* in dawn song.
- **Call:** Soft *pip* contact note.

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS.

---

## Hammond's Flycatcher

```yaml
common_name: "Hammond's Flycatcher"
scientific_name: "Empidonax hammondii"
taxonomic_order: "Passeriformes"
family: "Tyrannidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "10 (low concern)"
ecoregions: ["Zone 2: Montane Conifer"]
```

### Morphometrics

- **Length:** 12-14 cm
- **Wingspan:** 21-23 cm
- **Mass:** 8-12 g
- **Plumage:** Olive-gray above, yellowish-olive wash below, narrow white eye ring, two pale wingbars. Short bill. Essentially indistinguishable in the field from Dusky Flycatcher and Pacific-slope Flycatcher by plumage alone — the quintessential *Empidonax* identification challenge.
- **Sexual dimorphism:** None apparent.

### Habitat

- **Breeding:** Dense, mature conifer forest — the most interior-forest-dependent *Empidonax* in the PNW. Prefers closed-canopy Douglas-fir, grand fir, Engelmann spruce, and subalpine fir forests at mid-to-high elevation. Forages in mid-canopy.
- **Wintering:** Mountain forests of Mexico and Central America (pine-oak and cloud forest, 1,500-3,000 m).
- **Elevation range:** 2,500-6,500 ft (breeding).
- **Ecoregion primary:** Zone 2 (Montane Conifer — mature forest interior)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through interior mountains to Mexican and Central American highland forests. An early-departing fall migrant."
  spring_arrival: "Late April to mid-May"
  fall_departure: "August to early September"
  staging_areas: ["East Cascades montane, WA/OR", "Blue Mountains, OR"]
  breeding_grounds: "Mid-to-high-elevation mature conifer forests throughout PNW"
  wintering_grounds: "Mountain forests of Mexico and Central America (pine-oak, cloud forest)"
  distance_km: "3,000-5,000"
  flyway_threats: ["Mature forest loss on breeding grounds (logging)", "Mexican pine-oak forest degradation (logging, fire)", "Aerial insectivore decline"]
```

### Diet and Foraging

- **Primary diet:** Small flying insects — flies, beetles, wasps, leafhoppers. Primarily aerial sallier within forest canopy.
- **Foraging strategy:** Perch-and-sally from mid-canopy branches. Shorter sallies than Western Wood-Pewee, capturing smaller prey within the forest interior.

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 20 million. Common in appropriate montane habitat throughout PNW [O4, G4].
- **Threats:** Sensitive to timber harvest that opens canopy structure. Dependent on mature forest retention.

### Evolutionary Note

The *Empidonax* flycatchers represent the most notoriously difficult identification challenge in North American birding — five virtually identical-looking species breed in the PNW (Hammond's, Dusky, Pacific-slope, Willow, and Gray). Voice is the only reliable field identification method. Hammond's is distinguished by its *se-brt, preeep, srlip* three-part song delivered from high canopy perches. The genus diverged relatively recently (Pleistocene), with morphological conservatism suggesting that ecological partitioning (habitat, elevation, foraging height) rather than plumage divergence drove speciation [O1, P6].

### Vocalizations

- **Song:** Three-part song: a low *se-brt*, a higher *preeep*, and a soft *srlip*. Diagnostic — the only reliable field separation from Dusky Flycatcher in overlap zones.
- **Call:** Sharp *peek*.

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [G4] USGS BBS. [P6] Van Doren et al. 2017.

---

## Pacific-slope Flycatcher

```yaml
common_name: "Pacific-slope Flycatcher"
scientific_name: "Empidonax difficilis"
taxonomic_order: "Passeriformes"
family: "Tyrannidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "11 (low concern)"
ecoregions: ["Zone 2: Montane Conifer", "Zone 3: Lowland/Urban", "Zone 5: Riparian/Estuarine"]
```

### Morphometrics

- **Length:** 13-17 cm
- **Wingspan:** 20-23 cm
- **Mass:** 8-13 g
- **Plumage:** Olive-green above, yellowish below with olive breast band, teardrop-shaped white eye ring (broader behind eye — a subtle but useful mark), two pale wingbars. Lower mandible entirely orange-yellow.
- **Sexual dimorphism:** None apparent.

### Habitat

- **Breeding:** Moist, shaded forest — the most moisture-dependent *Empidonax* in the PNW. Western hemlock, Sitka spruce, red cedar, and Douglas-fir forests west of the Cascades. Nests on ledges, under root overhangs, in bridge structures, and in sheltered forest recesses. Often associated with streams and ravines.
- **Wintering:** Western Mexico (Sinaloa to Oaxaca) in subtropical forest and thorn scrub.
- **Elevation range:** Sea level to 4,500 ft (breeding).
- **Ecoregion primary:** Zone 2 (Montane Conifer — wet western forests)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Migrates south along the Pacific Coast and through coastal lowlands to western Mexico. Short-to-medium distance neotropical migrant."
  spring_arrival: "Mid-April to early May"
  fall_departure: "September to early October"
  staging_areas: ["Pacific Coast lowland forests", "Willamette Valley riparian"]
  breeding_grounds: "Moist west-side forests from coastal to mid-elevation throughout PNW"
  wintering_grounds: "Western Mexico (Sinaloa to Oaxaca)"
  distance_km: "2,500-5,000"
  flyway_threats: ["Mature west-side forest loss", "Mexican thorn-scrub habitat conversion", "Aerial insectivore decline"]
```

### Diet and Foraging

- **Primary diet:** Small flying insects captured in short aerial sallies from low perches. Also gleans insects from bark and foliage.
- **Foraging strategy:** Low perch-and-sally from understory and midstory perches. Often forages near streams where aquatic insect emergences provide concentrated prey.

### Population

- **Trend:** Stable to slight decline
- **Estimate:** Continental population approximately 7 million. Common in appropriate moist forest habitat west of the Cascades [O4, G4].

### Evolutionary Note

Pacific-slope Flycatcher and Cordilleran Flycatcher (*E. occidentalis*) were formerly lumped as a single species, "Western Flycatcher," until AOS split them in 1989 based on vocal differences and genetic divergence. In the PNW, only Pacific-slope Flycatcher breeds regularly west of the Cascades; Cordilleran Flycatcher occurs in the interior mountains of Idaho. The split remains debated — some researchers argue that hybridization in zones of contact undermines full species status. The diagnostic call is a sharp, upslurred *su-weet* [O1, O3].

### Vocalizations

- **Song:** An upslurred *su-weet* (or *tsee-weet*), often repeated. Position note: a thin, high *tseet*.
- **Call:** Sharp *seet*.

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS.

---

## Willow Flycatcher

```yaml
common_name: "Willow Flycatcher"
scientific_name: "Empidonax traillii"
taxonomic_order: "Passeriformes"
family: "Tyrannidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed (PNW subspecies); ESA-Endangered: Southwestern Willow Flycatcher (E. t. extimus)"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "14 (high concern)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 13-17 cm
- **Wingspan:** 19-24 cm
- **Mass:** 11-16 g
- **Plumage:** Brown-olive above, whitish below with olive-gray wash on breast, two pale wingbars. No conspicuous eye ring (distinguishes from similar *Empidonax* — other empids show white eye ring). PNW subspecies are *E. t. brewsteri* (Pacific) and *E. t. adastus* (inland).
- **Sexual dimorphism:** None apparent.

### Habitat

- **Breeding:** Dense riparian shrub thickets — willow, alder, and shrub-dominated wetland edges. Strongly associated with riparian corridors in lowland and foothill zones. Avoids forest interior. Habitat overlap with Wilson's Warbler but partitioned by vegetation structure — Willow Flycatcher uses taller, more open shrub canopy.
- **Wintering:** Tropical scrub and second growth from southern Mexico through Central America to northern South America.
- **Elevation range:** Sea level to 4,000 ft (breeding).
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through interior valleys and Mexico to Central American wintering grounds. One of the latest-arriving PNW neotropical migrants."
  spring_arrival: "Mid-May to early June"
  fall_departure: "Late August to September"
  staging_areas: ["Willamette Valley riparian corridors", "Columbia Basin riparian, WA"]
  breeding_grounds: "Riparian shrub thickets throughout PNW lowlands and foothills"
  wintering_grounds: "Southern Mexico through Central America to northern South America"
  distance_km: "3,000-6,000"
  flyway_threats: ["Riparian habitat degradation (grazing, water diversion, development)", "Cowbird parasitism in fragmented riparian corridors", "Tropical scrub habitat conversion"]
```

### Diet and Foraging

- **Primary diet:** Flying insects captured by aerial sallying from riparian shrub perches. Also gleans insects from foliage.
- **Foraging strategy:** Perch-and-sally from shrub-level perches over riparian openings.

### Population

- **Trend:** Stable (PNW subspecies); declining (range-wide)
- **Estimate:** Continental population approximately 8 million. PNW breeding population stable where riparian habitat is intact [O4, G4].
- **Threats:** Riparian habitat loss is the primary threat. Brown-headed Cowbird parasitism significant in fragmented riparian corridors — cowbird removal programs have been implemented for the ESA-listed Southwestern subspecies. PNW subspecies (*brewsteri*, *adastus*) are not ESA-listed but share the same habitat vulnerability.

### Evolutionary Note

Willow Flycatcher and Alder Flycatcher (*E. alnorum*) were formerly lumped as "Traill's Flycatcher" until split by AOS in 1973 based on vocal differences. In the PNW, only Willow Flycatcher breeds regularly — Alder Flycatcher's range barely reaches northeastern Washington. The diagnostic *fitz-bew* song (a sneezy, two-note burst) is the only reliable field identification [O1, O3].

### Vocalizations

- **Song:** A distinctive, sneezy *fitz-bew* — one of the most recognizable empid songs. Also a dry *whit* call.

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS.

---

## Western Kingbird

```yaml
common_name: "Western Kingbird"
scientific_name: "Tyrannus verticalis"
taxonomic_order: "Passeriformes"
family: "Tyrannidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "10 (low concern)"
ecoregions: ["Zone 7: East-Side Steppe", "Zone 3: Lowland/Urban", "Zone 4: Foothill/Oak Woodland"]
```

### Morphometrics

- **Length:** 20-24 cm
- **Wingspan:** 38-41 cm
- **Mass:** 35-48 g
- **Plumage:** Gray head and breast, bright lemon-yellow belly, olive-gray back, black tail with white outer tail feathers (visible in flight). Concealed orange-red crown patch (displayed during aggressive encounters).
- **Sexual dimorphism:** Minimal.

### Habitat

- **Breeding:** Open country with scattered trees, utility poles, or fence posts for nesting perches — agricultural edges, rangeland, towns, and highway corridors. Common in east-side PNW; rare west of the Cascades.
- **Wintering:** Mexico through Central America. Some birds winter along the Pacific Coast of Central America.
- **Elevation range:** 500-5,000 ft (breeding).
- **Ecoregion primary:** Zone 7 (East-Side Steppe)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through Great Basin and Mexico to Central American wintering grounds."
  spring_arrival: "Late April to mid-May"
  fall_departure: "Late August to September"
  staging_areas: ["Columbia Basin agricultural areas, WA", "Snake River Plain, ID"]
  breeding_grounds: "Open country with scattered perches — east-side PNW, Columbia Basin, Snake River Plain"
  wintering_grounds: "Mexico through Central America"
  distance_km: "3,000-5,000"
  flyway_threats: ["Agricultural intensification reducing edge habitat", "Pesticide reduction of insect prey"]
```

### Diet and Foraging

- **Primary diet:** Large flying insects — grasshoppers, beetles, bees, wasps, dragonflies. Also some fruit in fall. One of the most conspicuous flycatcher foragers — sallies from fence posts and wires, often carrying large prey items back to perch.
- **Foraging strategy:** Long aerial sallies from elevated perches (utility wires, fence posts, isolated trees). Aggressive defender of foraging territory — will attack much larger birds (ravens, hawks) that enter territory.

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 24 million. Common east of the Cascades in appropriate open habitat [O4, G4].

### Evolutionary Note

Western Kingbird has expanded its range westward and northward over the past century, colonizing areas of the PNW where agricultural development and utility infrastructure created suitable open habitat with elevated perches. The species' adaptation to anthropogenic structures (utility poles, fence lines) for nesting has enabled expansion into previously unsuitable steppe habitat. Western and Eastern Kingbird (*T. tyrannus*) are sympatric in parts of the PNW east side but differ in habitat preference — Western favors drier, more open terrain while Eastern (a rare PNW breeder) uses taller riparian trees [O1].

### Vocalizations

- **Song:** A rapid, sputtering series of sharp notes — *kip-kip-kip-kip-keedeer* — given during dawn display flights.
- **Call:** A sharp *whit* and a chattering scolding series.

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [G4] USGS BBS.

---

## Warbling Vireo

```yaml
common_name: "Warbling Vireo"
scientific_name: "Vireo gilvus"
taxonomic_order: "Passeriformes"
family: "Vireonidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "9 (low concern)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban", "Zone 4: Foothill/Oak Woodland"]
```

### Morphometrics

- **Length:** 12-15 cm
- **Wingspan:** 20-23 cm
- **Mass:** 10-16 g
- **Plumage:** Plain olive-gray above, whitish below with pale yellow flanks. Indistinct pale supercilium (eyebrow). One of the plainest PNW passerines — often described as "a bird of no field marks." No wingbars, no eye ring.
- **Sexual dimorphism:** None apparent.

### Habitat

- **Breeding:** Deciduous and mixed riparian woodland — cottonwood, alder, aspen, and willow groves. Also oak woodland, urban parks with mature deciduous trees. Canopy and sub-canopy forager.
- **Wintering:** Western Mexico through Central America.
- **Elevation range:** Sea level to 5,000 ft.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine — cottonwood riparian)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through interior valleys and Pacific Coast to Mexico and Central America."
  spring_arrival: "Late April to mid-May"
  fall_departure: "August to September"
  staging_areas: ["Willamette Valley riparian", "Columbia River corridor"]
  breeding_grounds: "Deciduous riparian and woodland habitats throughout PNW"
  wintering_grounds: "Western Mexico through Central America"
  distance_km: "3,000-5,000"
  flyway_threats: ["Riparian cottonwood loss (dams altering floodplain dynamics)", "Tropical deforestation on wintering grounds"]
```

### Diet and Foraging

- **Primary diet:** Insects gleaned from deciduous tree canopy — caterpillars, beetles, leafhoppers, spiders.
- **Foraging strategy:** Deliberate, methodical canopy gleaner. Moves slowly along branches, inspecting leaf surfaces and bark crevices. More sluggish in movements than warblers sharing the same canopy.

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 42 million. Common in PNW riparian deciduous woodlands [O4, G4].

### Evolutionary Note

Warbling Vireo is one of the few PNW passerines more often heard than seen — its persistent, rambling, warbling song (a musical phrase that seems to ask a cheerful question) fills the cottonwood canopy from May through July, often continuing through the midday heat when most other songbirds fall silent. Western populations (*V. g. swainsonii*) differ from eastern (*V. g. gilvus*) in song structure and genetics, and a future AOS split into two species is possible [O1, O3].

### Vocalizations

- **Song:** A rolling, musical warble — a long phrase that rises and falls, often ending on a rising note, as if asking a question. Persistent singer throughout the day. One of the most characteristic sounds of PNW cottonwood riparian corridors.
- **Call:** A harsh, nasal *myah* (scolding note).

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS.

---

## Red-eyed Vireo

```yaml
common_name: "Red-eyed Vireo"
scientific_name: "Vireo olivaceus"
taxonomic_order: "Passeriformes"
family: "Vireonidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "6 (low concern)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 13-14 cm
- **Wingspan:** 23-25 cm
- **Mass:** 12-26 g
- **Plumage:** Olive-green above, white below. Strong head pattern: gray crown bordered by black lateral crown stripes, broad white supercilium, dark eye line. Red iris (adults — visible at close range). No wingbars.
- **Sexual dimorphism:** None apparent.

### Habitat

- **Breeding:** Deciduous forest and riparian woodland — cottonwood-dominated riparian corridors, urban parks with mature deciduous trees. In the PNW, concentrated in eastern WA and OR riparian zones (Snake River, Deschutes River, Grande Ronde) and scattered westside urban parks. Near the western edge of its continental range in the PNW.
- **Wintering:** Amazonian basin and tropical South America — one of the longest migrations of any North American vireo.
- **Elevation range:** Sea level to 3,500 ft.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine — deciduous riparian)

### Migration

```yaml
migration:
  flyway: "Interior / Central"
  route_description: "Migrates south through Great Plains and eastern Mexico, across the Gulf of Mexico or around it, to Amazonian wintering grounds. PNW populations are at the western range margin and likely route eastward before turning south."
  spring_arrival: "Late May to early June (one of the latest arrivals in PNW)"
  fall_departure: "Late August to September"
  staging_areas: ["Eastern WA/OR riparian corridors"]
  breeding_grounds: "Deciduous riparian woodlands — primarily eastern PNW"
  wintering_grounds: "Amazonian basin, tropical South America"
  distance_km: "5,000-9,000"
  flyway_threats: ["Amazonian deforestation on wintering grounds", "Riparian cottonwood decline (dam-altered flow regimes)", "Window collisions during migration"]
```

### Diet and Foraging

- **Primary diet:** Insects gleaned from deciduous canopy — caterpillars (primary prey during breeding), beetles, bugs, spiders. Fruit during fall migration and on wintering grounds.
- **Foraging strategy:** Methodical canopy gleaner, similar to Warbling Vireo but slightly more active. Hops along branches examining leaf undersides.

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 130 million (the most abundant North American vireo). PNW breeding population small — near western range limit. Locally common in eastern WA/OR riparian cottonwood groves [O4, G4].

### Evolutionary Note

Red-eyed Vireo holds the record for the most songs recorded in a single day by an individual bird — over 20,000 song phrases in one day (documented by researchers with audio recording equipment). This extraordinary vocal output is driven by the species' territorial system: males sing persistently from canopy perches to maintain territory boundaries, continuing through midday heat when other species fall silent. In the PNW, the species is near the western edge of its vast continental range, and its presence in eastern WA/OR riparian zones represents a relatively recent westward expansion facilitated by riparian cottonwood restoration [O1].

### Vocalizations

- **Song:** Continuous series of short, musical phrases separated by brief pauses — described as "Here I am, in the tree, look at me, up here..." Each phrase is 2-3 notes. Sings incessantly throughout the day.
- **Call:** A nasal, catlike *myah* (similar to Warbling Vireo but sharper).

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [G4] USGS BBS.

---

## Barn Swallow (Migration Aspects)

```yaml
common_name: "Barn Swallow"
scientific_name: "Hirundo rustica"
taxonomic_order: "Passeriformes"
family: "Hirundinidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "10 (low concern — but declining)"
ecoregions: ["Zone 3: Lowland/Urban", "Zone 5: Riparian/Estuarine", "Zone 7: East-Side Steppe"]
```

### Morphometrics

- **Length:** 15-19 cm (including deeply forked tail)
- **Wingspan:** 29-32 cm
- **Mass:** 17-20 g
- **Plumage:** Iridescent blue-black above, rufous-orange forehead and throat, buffy to rufous-orange underparts. Deeply forked tail with white spots (longest of any PNW passerine). North American subspecies (*H. r. erythrogaster*) has more rufous underparts than Old World subspecies.
- **Sexual dimorphism:** Moderate — males show longer outer tail streamers and deeper rufous coloration.

### Habitat

- **Breeding:** Open country near human structures — barns, bridges, culverts, eaves of buildings. Almost exclusively uses human-built structures for nesting in the PNW (original nest sites were cave ceilings and cliff overhangs). Open agricultural and riparian areas for foraging.
- **Wintering:** Central and South America — open agricultural and wetland areas from Mexico to Argentina. The most widely distributed swallow in the world.
- **Ecoregion primary:** Zone 3 (Lowland/Urban)

### Migration

```yaml
migration:
  flyway: "Pacific / Pan-American"
  route_description: "Migrates south through Mexico and Central America to South American wintering grounds. The most widely distributed swallow in the world (Holarctic breeder), Barn Swallow undertakes one of the longest regular migrations of any passerine — PNW breeders may winter as far south as central Argentina."
  spring_arrival: "Late March to mid-April (among the earliest-arriving neotropical migrants)"
  fall_departure: "Late August to September"
  staging_areas: ["Lowland agricultural areas throughout PNW", "Columbia Basin, WA"]
  breeding_grounds: "Throughout PNW — any open habitat with human structures for nesting"
  wintering_grounds: "Mexico through Central America to central Argentina"
  distance_km: "5,000-10,000"
  flyway_threats: ["Aerial insectivore decline", "Barn and agricultural building demolition (nest site loss)", "Pesticide reduction of insect prey", "Mud availability for nest construction affected by drought"]
```

### Diet and Foraging

- **Primary diet:** Flying insects — flies, beetles, mosquitoes, moths, wasps. All prey taken on the wing in sustained, low-level flight.
- **Foraging strategy:** Low, graceful aerial foraging over fields, wetlands, and water surfaces. The deeply forked tail enables exceptional flight agility.

### Population

- **Trend:** Declining (moderate — part of the aerial insectivore decline)
- **Estimate:** Continental population approximately 44 million (North America). Global population exceeds 100 million. Common throughout PNW but declining at approximately 1% per year since the 1980s [O4, G4].
- **Threats:** Part of the aerial insectivore decline. Loss of barn and agricultural building nesting structures. Drought reducing mud availability for nest construction.

### Evolutionary Note

Barn Swallow is the most widely distributed and abundant swallow in the world, with breeding populations across North America, Europe, Asia, and North Africa. This near-global distribution is largely a consequence of the species' commensal relationship with human agriculture — Barn Swallows expanded dramatically with the spread of farming, using barns and bridges as nest sites. The species' deeply forked tail has been the subject of extensive sexual selection research: females preferentially mate with males that have longer outer tail streamers, and tail length is heritable and correlated with parasite resistance — a textbook example of Fisherian runaway sexual selection [O1].

### Vocalizations

- **Song:** Extended, twittering warble interspersed with a dry, crackling rattle. Given in flight or from perch near nest.
- **Call:** Sharp *vit-vit* contact note.

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [G4] USGS BBS.

---

## Cliff Swallow

```yaml
common_name: "Cliff Swallow"
scientific_name: "Petrochelidon pyrrhonota"
taxonomic_order: "Passeriformes"
family: "Hirundinidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "8 (low concern)"
ecoregions: ["Zone 3: Lowland/Urban", "Zone 7: East-Side Steppe", "Zone 5: Riparian/Estuarine"]
```

### Morphometrics

- **Length:** 13-15 cm
- **Wingspan:** 28-30 cm
- **Mass:** 19-34 g
- **Plumage:** Dark iridescent blue-black crown and back, chestnut face and throat, pale buffy rump patch (diagnostic in flight), pale forehead patch. Squared tail (not forked like Barn Swallow). Stockier build than other PNW swallows.
- **Sexual dimorphism:** Minimal.

### Habitat

- **Breeding:** Colonial nester — builds gourd-shaped mud nests on cliff faces, building walls, bridge undersides, and dam faces. Colonies range from 10 to 3,500+ nests. Forages over open country, agricultural fields, and water bodies. Common on both sides of the Cascades.
- **Wintering:** South America — Brazil, Paraguay, Argentina. Complete absence from North America in winter.
- **Ecoregion primary:** Zone 3 (Lowland/Urban — bridge and building colonies)

### Migration

```yaml
migration:
  flyway: "Pacific / Central"
  route_description: "Migrates south through Mexico and Central America to South American wintering grounds. The famous 'swallows of San Juan Capistrano' are Cliff Swallows — their spring return became a cultural icon of avian migration. PNW colonies show similarly predictable return dates."
  spring_arrival: "Mid-April to early May"
  fall_departure: "August to early September (entire colonies depart abruptly)"
  staging_areas: ["Lowland agricultural areas", "Columbia Basin", "Willamette Valley"]
  breeding_grounds: "Colonial — bridges, buildings, dams, and cliff faces throughout PNW"
  wintering_grounds: "Southern Brazil, Paraguay, Argentina"
  distance_km: "6,000-10,000"
  flyway_threats: ["Nest removal from buildings and bridges (human intolerance)", "Aerial insectivore decline", "Mud availability for nest construction"]
```

### Diet and Foraging

- **Primary diet:** Flying insects — swarming ants, flies, beetles, leafhoppers, mosquitoes.
- **Foraging strategy:** Aerial foraging in flocks over open country. Forages higher than Barn Swallow on average. Colonial foraging behavior — colony members share information about insect swarm locations.

### Population

- **Trend:** Stable to increasing (has benefited from bridge and building construction providing nest sites)
- **Estimate:** Continental population approximately 42 million. Abundant throughout PNW wherever suitable colony structures exist [O4, G4].

### Evolutionary Note

Cliff Swallow colonies are the subject of the longest-running population study of any swallow species, conducted by Charles and Mary Brown in Nebraska since 1982. Their research revealed that colony size is under opposing selection pressures: larger colonies benefit from information sharing about food sources and diluted predation risk, but also suffer higher ectoparasite loads (swallow bugs, *Oeciacus vicarius*) and brood parasitism (females dumping eggs into neighbors' nests). This balancing selection drives the distribution of colony sizes observed across the landscape — a classic test of optimal group size theory. PNW colonies show similar patterns [O1, P19].

### Vocalizations

- **Call:** A low, creaky *churrr* and a sharp alarm *peek*. Colony noise: a continuous low murmur of hundreds of birds calling simultaneously.

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [G4] USGS BBS. [P19] Marzluff & Sallabanks 1998.

---

## Violet-green Swallow

```yaml
common_name: "Violet-green Swallow"
scientific_name: "Tachycineta thalassina"
taxonomic_order: "Passeriformes"
family: "Hirundinidae"
status: "breeding (neotropical migrant — partial)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "9 (low concern)"
ecoregions: ["Zone 2: Montane Conifer", "Zone 3: Lowland/Urban", "Zone 4: Foothill/Oak Woodland"]
```

### Morphometrics

- **Length:** 12-14 cm
- **Wingspan:** 27-31 cm
- **Mass:** 13-18 g
- **Plumage:** Brilliant iridescent violet-green upperparts (the greenest swallow in the PNW), bright white underparts extending above the eye and wrapping around the rump flanks (white face patches nearly meeting over base of tail — diagnostic). Compact build with relatively short, notched tail.
- **Sexual dimorphism:** Moderate — females duller with less extensive white face patches.

### Habitat

- **Breeding:** Forest openings, montane meadow edges, cliff faces, urban areas. Cavity nester — uses old woodpecker holes, rock crevices, building crevices, nest boxes. More forest-associated than other PNW swallows. Found from lowland to high-elevation forest throughout PNW.
- **Wintering:** Mexico and Central America. Some birds may winter in southwestern US (partial migrant).
- **Elevation range:** Sea level to 7,000 ft.
- **Ecoregion primary:** Zone 2 (Montane Conifer — forest openings and meadow edges)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Migrates south along the Pacific Coast and through interior to Mexico and Central America. Earlier spring arrival than Barn or Cliff Swallow in most PNW locations."
  spring_arrival: "Late February to March (one of the earliest-arriving neotropical migrants — often present before true spring warmth)"
  fall_departure: "Late August to September"
  staging_areas: ["Not strongly concentrated — departs broadly across range"]
  breeding_grounds: "Forest openings, cliffs, and urban areas throughout PNW"
  wintering_grounds: "Mexico through Central America; some southwestern US"
  distance_km: "2,000-5,000"
  flyway_threats: ["Cavity nest site competition (European Starlings, House Sparrows)", "Aerial insectivore decline", "Climate-driven mismatch with insect emergence"]
```

### Diet and Foraging

- **Primary diet:** Small flying insects — flies, leafhoppers, beetles, winged ants. Forages at higher altitudes than Barn or Cliff Swallows, often visible as tiny specks high above forest canopy.
- **Foraging strategy:** High-altitude aerial forager. Often forages over montane meadows and forest clearings at 50-200 m above ground.

### Population

- **Trend:** Stable to slight decline
- **Estimate:** Continental population approximately 7 million. Common throughout PNW montane and lowland habitats [O4, G4].

### Evolutionary Note

Violet-green Swallow belongs to genus *Tachycineta*, the New World swallows, which radiated primarily in South America before colonizing North America. The genus includes Tree Swallow (*T. bicolor*), the most closely related species. Violet-green Swallow is the more western, montane, and forest-associated species; Tree Swallow the more eastern, lowland, and wetland-associated. Where both species co-occur in the PNW, they partition habitat by elevation and forest proximity — Violet-green at higher elevations and nearer forest edge, Tree Swallow in lowland wetlands and open areas. The species' early spring arrival (February-March) — weeks before most neotropical migrants — suggests partial migration rather than full neotropical migration in some populations [O1].

### Vocalizations

- **Call:** A rapid, high-pitched *chee-chee-chee* — higher and thinner than Tree Swallow. Dawn song: a complex twittering series.

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [G4] USGS BBS.

---

## Black-headed Grosbeak

```yaml
common_name: "Black-headed Grosbeak"
scientific_name: "Pheucticus melanocephalus"
taxonomic_order: "Passeriformes"
family: "Cardinalidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "9 (low concern)"
ecoregions: ["Zone 4: Foothill/Oak Woodland", "Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 18-19 cm
- **Wingspan:** 31-32 cm
- **Mass:** 35-49 g
- **Plumage:** Male: black head, orange-cinnamon breast and collar, black-and-white wings with prominent white wing patches, yellow wing linings (visible in flight). Female: brown-streaked overall with buffy supercilium, heavy pale bill. Both sexes have a large, conical, pale bill suited for crushing seeds and hard-bodied insects.
- **Sexual dimorphism:** Pronounced.

### Habitat

- **Breeding:** Deciduous and mixed woodland — oak woodland, riparian cottonwood-willow, suburban parks and gardens with mature deciduous trees. One of the most welcome backyard feeder visitors during spring migration. Both sides of the Cascades.
- **Wintering:** Western Mexico (pine-oak and thorn forest).
- **Elevation range:** Sea level to 5,000 ft.
- **Ecoregion primary:** Zone 4 (Foothill/Oak Woodland)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through interior valleys and along the coast to wintering grounds in western Mexico."
  spring_arrival: "Late April to mid-May"
  fall_departure: "Late August to September"
  staging_areas: ["Rogue Valley, OR", "East Cascades foothills", "Willamette Valley margins"]
  breeding_grounds: "Deciduous and mixed woodland throughout PNW — oak woodland, riparian, suburban"
  wintering_grounds: "Western Mexico (Sinaloa to Guerrero)"
  distance_km: "2,500-4,500"
  flyway_threats: ["Mexican oak-pine forest loss", "Pesticide exposure on wintering grounds", "Cowbird parasitism (moderate)"]
```

### Diet and Foraging

- **Primary diet:** Insects (beetles, caterpillars, wasps) and seeds during breeding season. Fruit and seeds during migration and winter. The heavy bill enables consumption of hard-bodied insects and large seeds that smaller-billed species cannot process.
- **Foraging strategy:** Canopy and sub-canopy gleaner. Also forages at bird feeders (sunflower seeds). One of the few PNW passerines that regularly eats Monarch butterflies on the wintering grounds — the grosbeak is immune to the milkweed-derived cardiac glycoside toxins that make Monarchs unpalatable to most predators.

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 14 million. Common in PNW deciduous woodland and suburban habitats [O4, G4].

### Evolutionary Note

Black-headed Grosbeak and Rose-breasted Grosbeak (*P. ludovicianus*) are sister species that hybridize extensively in a narrow Great Plains contact zone — one of the best-studied avian hybrid zones in North America. Hybrid males show intermediate plumage (orange breast with varying amounts of black streaking). In the PNW, only Black-headed Grosbeak breeds regularly; Rose-breasted is a rare vagrant. The species' close relationship to the cardinal family (Cardinalidae) rather than to sparrows or finches is reflected in its song — a rich, warbling, Robin-like quality quite different from sparrow or finch vocalizations [O1, O3].

### Vocalizations

- **Song:** A rich, rolling warble — similar to American Robin but more fluid and musical, with a sweet quality. Males sing from canopy perches and occasionally in flight.
- **Call:** A sharp, metallic *pik*.

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS.

---

## Bullock's Oriole

```yaml
common_name: "Bullock's Oriole"
scientific_name: "Icterus bullockii"
taxonomic_order: "Passeriformes"
family: "Icteridae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "10 (low concern)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 4: Foothill/Oak Woodland", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 17-19 cm
- **Wingspan:** 31-32 cm
- **Mass:** 29-43 g
- **Plumage:** Male: brilliant orange face, breast, and rump, black crown, nape, back, and throat line, bold white wing patch. Female: pale grayish-olive above, pale yellowish-orange below, two white wingbars. Male is one of the most vividly colored PNW breeding passerines.
- **Sexual dimorphism:** Pronounced.

### Habitat

- **Breeding:** Riparian cottonwood and willow groves, shade trees in towns, oak woodland edges. Builds distinctive hanging, woven pouch nests suspended from drooping branch tips — one of the most elaborate nest structures of any PNW passerine.
- **Wintering:** Western Mexico (coastal lowlands and thorn forest).
- **Elevation range:** Sea level to 4,000 ft.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine — cottonwood riparian)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through interior valleys and Great Basin to wintering grounds in western Mexico."
  spring_arrival: "Late April to mid-May"
  fall_departure: "August to early September (one of the earlier-departing PNW passerines)"
  staging_areas: ["Columbia Basin riparian, WA", "Snake River corridor, ID", "Rogue Valley, OR"]
  breeding_grounds: "Riparian cottonwood and shade trees throughout PNW"
  wintering_grounds: "Western Mexico (Sinaloa to Oaxaca — coastal lowlands)"
  distance_km: "2,500-4,500"
  flyway_threats: ["Riparian cottonwood decline (altered hydrology from dams)", "Mexican coastal deforestation", "Pesticide exposure"]
```

### Diet and Foraging

- **Primary diet:** Insects (caterpillars, beetles, ants, wasps) and nectar during breeding season. Fruit and nectar dominant in fall and winter.
- **Foraging strategy:** Canopy gleaner; probes flowers for nectar (especially orange tubular flowers); visits hummingbird feeders and fruit offerings. The slender, slightly curved bill is adapted for nectar extraction.

### Population

- **Trend:** Declining (moderate — approximately 1% per year, BBS data)
- **Estimate:** Continental population approximately 6 million. Common in PNW riparian cottonwood groves but declining with cottonwood habitat loss [O4, G4].
- **Threats:** Cottonwood riparian decline is the primary PNW threat. Dam construction and water management have eliminated the flood dynamics that regenerate cottonwood stands along major rivers.

### Evolutionary Note

Bullock's and Baltimore Orioles (*I. galbula*) were lumped as "Northern Oriole" by AOS in 1973 based on extensive hybridization in the Great Plains contact zone, then re-split in 1995 after research showed the hybrid zone was narrow and stable — not expanding — indicating that hybridization does not threaten species integrity. This taxonomic oscillation (split → lump → re-split) is one of the most famous in North American ornithology. In the PNW, only Bullock's Oriole breeds regularly; Baltimore Oriole is a rare vagrant [O1, O3].

### Vocalizations

- **Song:** A series of rich, whistled notes interspersed with chattering — less musical than Baltimore Oriole but still a distinctive summer riparian sound.
- **Call:** A sharp *chat* and a dry rattle.

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS.

---

## Orange-crowned Warbler

```yaml
common_name: "Orange-crowned Warbler"
scientific_name: "Leiothlypis celata"
taxonomic_order: "Passeriformes"
family: "Parulidae"
status: "breeding (short-distance / neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "8 (low concern)"
ecoregions: ["Zone 3: Lowland/Urban", "Zone 4: Foothill/Oak Woodland", "Zone 5: Riparian/Estuarine", "Zone 2: Montane Conifer"]
```

### Morphometrics

- **Length:** 12-14 cm
- **Wingspan:** 17-19 cm
- **Mass:** 7-11 g
- **Plumage:** Dull olive-green above, dull yellowish below with faint breast streaking, indistinct broken eye ring, faint pale supercilium. The orange crown patch is concealed and rarely visible in the field. One of the plainest warblers — "the warbler with no field marks."
- **Sexual dimorphism:** Minimal — males slightly brighter.

### Habitat

- **Breeding:** Dense shrubby habitats — brushy hillsides, chaparral, riparian thickets, logged areas with shrub regrowth, coastal scrub. Broad habitat tolerance. Pacific Coast subspecies (*L. c. lutescens*) is brighter yellow and more common than interior forms.
- **Wintering:** Southern US through Mexico. Partial migrant — some Pacific Coast populations winter in coastal CA and OR. More of a short-distance migrant than a true neotropical migrant.
- **Elevation range:** Sea level to 5,000 ft.
- **Ecoregion primary:** Zone 3 (Lowland/Urban — shrubby habitats)

### Migration

```yaml
migration:
  flyway: "Pacific"
  route_description: "Pacific Coast populations are short-distance migrants, wintering from coastal OR/CA south through western Mexico. Interior populations migrate farther south. One of the earliest-arriving warblers in spring and among the latest to depart in fall — some birds approach year-round residence in mild coastal PNW areas."
  spring_arrival: "Late February to March (coastal); April (interior)"
  fall_departure: "October to November (late — some individuals linger into winter)"
  staging_areas: ["Coastal scrub habitats", "Willamette Valley margins"]
  breeding_grounds: "Dense shrub habitats throughout PNW"
  wintering_grounds: "Coastal CA/OR through western Mexico; some overwintering in mild coastal PNW"
  distance_km: "500-3,000 (short-distance migrant)"
  flyway_threats: ["Shrub habitat conversion (development)", "Fire suppression altering early-successional habitat availability"]
```

### Diet and Foraging

- **Primary diet:** Insects gleaned from shrub and low tree foliage — caterpillars, beetles, spiders, aphids. Takes nectar and sap from sapsucker wells. Fruit in fall.
- **Foraging strategy:** Active gleaner in dense shrub layer. Probes flower clusters and leaf clusters methodically.

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 82 million. Common throughout PNW shrubby habitats [O4, G4].

### Evolutionary Note

Orange-crowned Warbler was formerly placed in genus *Vermivora* but was moved to *Leiothlypis* (along with Tennessee Warbler and Nashville Warbler) based on molecular phylogenetics. Four subspecies span North America, with the Pacific Coast form (*lutescens*) being the brightest and the most sedentary. The concealed orange crown patch — rarely visible in the field — functions in intraspecific agonistic displays (males erect crown feathers during territorial disputes), making it a case of a diagnostic species feature that is essentially invisible under normal observation conditions [O1, O3].

### Vocalizations

- **Song:** A trill that drops in pitch and intensity toward the end — *see-see-see-see-see-suh-suh-suh*. Weaker and more buzzy than Wilson's Warbler. One of the earliest spring singers in the PNW.
- **Call:** Sharp *tsik*.

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS.

---

## MacGillivray's Warbler

```yaml
common_name: "MacGillivray's Warbler"
scientific_name: "Geothlypis tolmiei"
taxonomic_order: "Passeriformes"
family: "Parulidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "11 (low concern)"
ecoregions: ["Zone 2: Montane Conifer", "Zone 4: Foothill/Oak Woodland", "Zone 5: Riparian/Estuarine"]
```

### Morphometrics

- **Length:** 13-14 cm
- **Wingspan:** 18-20 cm
- **Mass:** 9-13 g
- **Plumage:** Olive-green above, bright yellow below. Male: dark slate-gray hood (head, throat, upper breast) with bold white crescents above and below eye (broken eye arcs — distinguishes from similar Mourning Warbler which has complete eye ring or none). Female: paler gray hood, more prominent pale eye arcs.
- **Sexual dimorphism:** Moderate — male hood darker and more complete.

### Habitat

- **Breeding:** Dense, low shrub thickets in montane and foothill zones — regenerating clearcuts, burned areas, riparian shrub, and mountain chaparral. Similar structural niche to Wilson's Warbler but generally at higher elevation and in drier shrub types. A skulker that is far more often heard than seen.
- **Wintering:** Western Mexico through Central America to Panama. Mountain slopes and tropical second growth.
- **Elevation range:** 1,000-6,000 ft (breeding). Less common at sea level than Wilson's Warbler.
- **Ecoregion primary:** Zone 2 (Montane Conifer — regenerating shrub understory)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through interior mountains and valleys to Mexican and Central American highland wintering areas."
  spring_arrival: "Early May to late May (later arrival than Wilson's Warbler)"
  fall_departure: "Late August to September"
  staging_areas: ["East Cascades foothills", "Rogue Valley, OR"]
  breeding_grounds: "Dense montane and foothill shrub thickets throughout PNW"
  wintering_grounds: "Western Mexico through Central America to Panama"
  distance_km: "3,000-5,500"
  flyway_threats: ["Montane shrub habitat loss (fire suppression reducing early successional stages)", "Tropical highland forest loss", "Cowbird parasitism in fragmented shrub habitats"]
```

### Diet and Foraging

- **Primary diet:** Insects gleaned from dense shrub foliage — caterpillars, beetles, flies, spiders.
- **Foraging strategy:** Ground-to-shrub-layer gleaner, similar to Wilson's Warbler. Extremely skulking — forages deep within dense thickets, rarely emerging into open.

### Population

- **Trend:** Stable to slight decline
- **Estimate:** Continental population approximately 10 million. Common in PNW montane shrub habitats [O4, G4].

### Evolutionary Note

MacGillivray's Warbler and Mourning Warbler (*G. philadelphia*) are sister species with a contact zone in the northern Rocky Mountains. They were formerly placed in genus *Oporornis* but were moved to *Geothlypis* (the yellowthroat genus) based on molecular phylogenetics — a reclassification that surprised many observers, as MacGillivray's and Common Yellowthroat appear quite different morphologically. The name honors Scottish ornithologist William MacGillivray; the species was described by John Kirk Townsend from specimens collected near Fort Vancouver, Washington, in 1839 — one of the earliest PNW bird descriptions [O1, O3].

### Vocalizations

- **Song:** A rolling *chiddle-chiddle-chiddle-turtle-turtle* — two parts, with the first section louder and the second dropping. Heard from dense thickets throughout montane PNW during May-July.
- **Call:** A hard, sharp *tsik* — similar to other thicket-dwelling warblers.

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS.

---

## Yellow Warbler (Migration Aspects)

```yaml
common_name: "Yellow Warbler"
scientific_name: "Setophaga petechia"
taxonomic_order: "Passeriformes"
family: "Parulidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "9 (low concern)"
ecoregions: ["Zone 5: Riparian/Estuarine", "Zone 3: Lowland/Urban"]
```

### Morphometrics

- **Length:** 12-13 cm
- **Wingspan:** 16-20 cm
- **Mass:** 8-13 g
- **Plumage:** Male: entirely bright yellow with reddish-chestnut breast streaking (intensity variable by subspecies). Female: paler yellow overall, reduced or absent breast streaking. Yellow edges to wing feathers. The "yellowest" North American warbler — no other regularly occurring PNW species shows so much unrelieved yellow.
- **Sexual dimorphism:** Moderate — male brighter with breast streaking.

### Habitat

- **Breeding:** Riparian willow, alder, and cottonwood corridors — the most characteristic warbler of PNW lowland riparian habitat. Also urban parks, suburban gardens with dense shrubs, and wetland edges. Avoids closed-canopy forest.
- **Wintering:** Mexico through Central America to northern South America (Venezuela, Colombia, Peru). Also Caribbean islands. One of the most widespread wintering warblers in the Neotropics.
- **Elevation range:** Sea level to 4,000 ft.
- **Ecoregion primary:** Zone 5 (Riparian/Estuarine)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior / Pan-American"
  route_description: "One of the most broadly distributed neotropical migrants — breeds across North America and winters across a vast tropical range. PNW populations likely migrate south along the coast and through interior to Mexico and Central America. Early-departing fall migrant — many adults have left the PNW by late July."
  spring_arrival: "Late April to mid-May"
  fall_departure: "Late July (adults begin departure) to September (juveniles)"
  staging_areas: ["Riparian corridors throughout PNW lowlands"]
  breeding_grounds: "Riparian corridors throughout PNW — willow, alder, cottonwood"
  wintering_grounds: "Mexico through Central America to northern South America and Caribbean"
  distance_km: "3,000-6,000"
  flyway_threats: ["Riparian habitat degradation (grazing, water diversion, development)", "Cowbird parasitism (significant in fragmented riparian)", "Tropical deforestation on wintering grounds", "Pesticide exposure"]
```

### Diet and Foraging

- **Primary diet:** Insects gleaned from riparian foliage — caterpillars (primary breeding prey), beetles, leafhoppers, aphids, spiders.
- **Foraging strategy:** Active canopy and sub-canopy gleaner in riparian trees. Hops rapidly along branches examining leaf surfaces. Also makes short hover-gleaning flights to capture insects from leaf undersides.

### Population

- **Trend:** Stable overall; declining in some regions with riparian habitat loss
- **Estimate:** Continental population approximately 90 million. Common in PNW riparian habitats where willow-alder-cottonwood corridors remain intact [O4, G4].
- **Threats:** Riparian habitat loss is the dominant PNW threat. Brown-headed Cowbird parasitism is significant — Yellow Warbler is one of the few North American species that has evolved a defensive behavior against cowbirds: when a cowbird egg appears in its nest, the warbler may build a new nest floor over the parasitized clutch and lay replacement eggs (burying both cowbird and warbler eggs). Nests with up to six burial layers have been documented [O1].

### Evolutionary Note

Yellow Warbler is one of the most widespread warblers in the Western Hemisphere, with breeding populations from Alaska to Mexico and resident populations throughout the Caribbean and into northern South America. The Caribbean and tropical resident forms (formerly "Mangrove Warbler" and "Golden Warbler") were lumped with migratory Yellow Warbler by AOS. This species complex shows remarkable geographic variation: 43 subspecies are recognized, making it the most subspecifically divided of all North American warblers. PNW breeding birds belong to the *aestiva* group (migratory northern forms), while resident tropical populations show chestnut head coloring in males. The anti-cowbird egg-burial behavior, documented extensively in the PNW, is one of the most sophisticated brood parasite defenses known in any bird species [O1, O3, P20].

### Vocalizations

- **Song:** A bright, musical *sweet-sweet-sweet-I'm-so-sweet* — one of the most cheerful and recognizable songs in PNW riparian corridors. Variable among individuals but consistently bright and emphatic.
- **Call:** Loud *chip*.

### Sources

[O1] Cornell Lab, Birds of the World. [O3] AOS Check-list. [O4] Partners in Flight. [G4] USGS BBS. [P20] Haig et al. 2004 — subspecies taxonomy.

---

## Lazuli Bunting

```yaml
common_name: "Lazuli Bunting"
scientific_name: "Passerina amoena"
taxonomic_order: "Passeriformes"
family: "Cardinalidae"
status: "breeding (neotropical migrant)"
conservation_status:
  federal_esa: "Not listed"
  iucn: "LC"
  state_wa: "Not listed"
  state_or: "Not listed"
  pif_score: "10 (low concern)"
ecoregions: ["Zone 4: Foothill/Oak Woodland", "Zone 7: East-Side Steppe", "Zone 5: Riparian/Estuarine"]
```

### Morphometrics

- **Length:** 13-15 cm
- **Wingspan:** 22-23 cm
- **Mass:** 13-18 g
- **Plumage:** Male: brilliant turquoise-blue head, back, and throat; rich cinnamon-orange breast band; white belly; two bold white wingbars. Female: warm brown above, pale buffy below with faint blue wash on rump and tail, two buffy wingbars. Male breeding plumage is the only bright blue coloration among regularly occurring PNW passerines.
- **Sexual dimorphism:** Pronounced — male structurally colored blue, female cryptic brown.

### Habitat

- **Breeding:** Dry, brushy hillsides, open shrubby habitat, riparian edges with adjacent shrub cover, recently burned or disturbed areas. Prefers drier, more open shrub than Wilson's Warbler or MacGillivray's Warbler. Common on the east side of the Cascades and in the Rogue Valley. Scarcer west of the Cascades except in foothill margins.
- **Wintering:** Western Mexico (Pacific slope, Sinaloa to Guerrero).
- **Elevation range:** 500-5,500 ft (breeding).
- **Ecoregion primary:** Zone 4 (Foothill/Oak Woodland — dry shrub)

### Migration

```yaml
migration:
  flyway: "Pacific / Interior"
  route_description: "Migrates south through Great Basin and western Mexico to Pacific slope wintering grounds. A unique migratory pattern includes a late-summer molt migration: after breeding, adults migrate to staging areas in the desert Southwest (southeastern AZ, southwestern NM) where monsoon rains produce abundant seed resources to fuel pre-migratory molt before continuing south to Mexico."
  spring_arrival: "Early May to late May"
  fall_departure: "August (adults depart for molt staging); September (juveniles)"
  staging_areas: ["Southeastern Arizona / southwestern New Mexico (molt migration staging)", "Rogue Valley, OR", "East Cascades foothills"]
  breeding_grounds: "Dry shrubby hillsides and riparian edges — primarily east-side PNW, Rogue Valley, and foothill margins"
  wintering_grounds: "Western Mexico (Pacific slope — Sinaloa to Guerrero)"
  distance_km: "2,500-4,500"
  flyway_threats: ["Shrub habitat conversion (agriculture, development)", "Cowbird parasitism in fragmented habitats", "Mexican thorn-forest loss"]
```

### Diet and Foraging

- **Primary diet:** Seeds and insects. Breeding diet includes caterpillars, grasshoppers, beetles, and spiders; shifts to seeds (grass, weed, and shrub seeds) as the season progresses. Winter diet primarily seeds.
- **Foraging strategy:** Ground and low-shrub forager. Hops on ground under shrubs, picking seeds and gleaning insects from low vegetation. Males sing from exposed perch tops — often the highest point in otherwise low shrub habitat.

### Population

- **Trend:** Stable
- **Estimate:** Continental population approximately 8 million. Common in PNW east-side and foothill shrub habitats [O4, G4].

### Evolutionary Note

Lazuli Bunting and Indigo Bunting (*P. cyanea*) hybridize extensively in the Great Plains contact zone, parallel to the Black-headed / Rose-breasted Grosbeak and Bullock's / Baltimore Oriole hybrid zones. All three hybrid zones are narrow, stable, and located in the Great Plains — suggesting a common biogeographic mechanism (likely Pleistocene vicariance followed by post-glacial range expansion and secondary contact). Young male Lazuli Buntings learn their songs from older territorial males on their first breeding territory — not from their fathers — a culturally transmitted song-learning system that produces local song dialects. Males that arrive on their first breeding territory with songs that differ from the local dialect copy established neighbors, rapidly converging on the local song type [O1, P2].

### Vocalizations

- **Song:** A rapid, high-pitched, varied warble — *see-see-sweet-sweet-zee-zee-sweet*. Variable among individuals and populations. Typically 8-12 notes, with paired phrases characteristic.
- **Call:** A sharp, dry *pik*.

### Sources

[O1] Cornell Lab, Birds of the World. [O4] Partners in Flight. [G4] USGS BBS. [P2] Campagna et al. 2017.

---

## Safety and Verification Notes

### Safety Boundaries Applied

1. **No GPS coordinates or specific nest locations** — all location data at county, watershed, or named geographic area level.
2. **All population data attributed** to specific agencies (USFWS, Partners in Flight, USGS BBS) or peer-reviewed studies.
3. **No policy advocacy** — conservation threats presented with sourced data and without prescriptive policy recommendations.
4. **Indigenous knowledge** — no cultural content referenced in this module (neotropical migrant passerines are not covered in the ethnographic sources used in this taxonomy project; no unsourced cultural claims included).
5. **Only Level 1 (publicly available) information** — no restricted data.

### Source Attribution Summary

All species profiles cite at minimum:
- [O1] Cornell Lab of Ornithology, Birds of the World
- [O4] Partners in Flight, population estimates and conservation assessments
- [G4] USGS Breeding Bird Survey, population trend data

Extended profiles cite additional specific sources as noted.

### Ecoregion Verification

All ecoregion assignments cross-referenced against zone definitions in `00-ecoregion-definitions.md`. Zone numbering:
- Zone 1: Alpine/Subalpine
- Zone 2: Montane Conifer
- Zone 3: Lowland/Urban
- Zone 4: Foothill/Oak Woodland
- Zone 5: Riparian/Estuarine
- Zone 6: Coastal/Marine/Pelagic
- Zone 7: East-Side Steppe

### Species Count Verification

This document (Part 2) covers **21 neotropical migratory passerine species:**
- 5 extended profiles (~4-5 KB each): Wilson's Warbler, Swainson's Thrush, Western Tanager, Common Nighthawk, Vaux's Swift
- 16 standard profiles (~2-3 KB each): Western Wood-Pewee, Hammond's Flycatcher, Pacific-slope Flycatcher, Willow Flycatcher, Western Kingbird, Warbling Vireo, Red-eyed Vireo, Barn Swallow, Cliff Swallow, Violet-green Swallow, Black-headed Grosbeak, Bullock's Oriole, Orange-crowned Warbler, MacGillivray's Warbler, Yellow Warbler, Lazuli Bunting
