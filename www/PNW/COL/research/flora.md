# Flora Survey: Vascular Plant Biodiversity of the Pacific Northwest Temperate Rainforest

> **Module 01 of the PNW Rainforest Biodiversity research document (v1.49.22)**
>
> References shared definitions from `00-shared-schemas.md` for species template fields, relationship schema types, and source_id attribution.
> All numerical claims are attributed to sources in the Source Index (GOV-01 through GOV-06, PR-01 through PR-05, CON-01 through CON-05).

---

## Introduction

The Pacific Northwest temperate rainforest constitutes the highest-biomass terrestrial ecosystem on Earth (PR-04). Stretching from the fog-drenched Olympic Peninsula through the volcanic Cascade Range, down the Oregon Coast Range, and tapering into the dramatic rain-shadow transition of the Columbia River Gorge, this region supports a vascular plant diversity shaped fundamentally by moisture. More than 800 species of vascular plants inhabit the four study zones defined in this survey, their distribution governed by a precipitation gradient spanning from over 200 inches annually on exposed Olympic ridges to fewer than 15 inches in the rain-shadow east of the Gorge (GOV-04, GOV-02).

This flora inventory documents species composition across all four zones, organized to reveal the ecological relationships that connect individual species into the functional network of the rainforest ecosystem. Species entries follow the shared template from `00-shared-schemas.md`, with flora-specific extensions for canopy layer position, growth form, pollination type, and old-growth indicator status. Where ecological interactions cross module boundaries -- particularly the deep connections between plants and mycorrhizal fungi -- those relationships are flagged for the Phase 607 cross-module synthesis.

The organizing principle of this document is the moisture gradient. Species do not exist as isolated entries; their presence, absence, and abundance are expressions of position along the west-to-east moisture continuum. The four zones are not arbitrary boundaries but represent distinct regimes along this gradient, each with characteristic plant communities, structural attributes, and conservation challenges.

---

## Vascular Plant Inventory

### Olympic Peninsula

The Olympic Peninsula receives the heaviest precipitation in the contiguous United States, with annual totals of 140-170 inches in the major river valleys and exceeding 200 inches on windward ridges (GOV-04). This hyper-wet environment supports approximately 300 species of vascular plants in the lowland and montane zones alone, embedded within a forest structure that carries more standing biomass per hectare than any other ecosystem on Earth (PR-04). The temperate rainforest valleys of the Hoh, Queets, and Quinault rivers represent the apex of the Pacific Northwest moisture gradient and the benchmark against which all other zones in this survey are measured.

#### Dominant Canopy Species

The canopy of the Olympic rainforest is defined by four conifer species whose co-dominance creates the structural complexity that supports the entire ecosystem.

**Sitka spruce** (*Picea sitchensis*) is the signature tree of the hyper-wet lowland rainforest. This emergent conifer (canopy_layer: emergent) reaches heights exceeding 250 feet and diameters over 16 feet in the Hoh and Queets valleys, making it one of the largest tree species on Earth. Its growth form is an evergreen conifer with buttressed trunk and drooping lateral branches adapted to heavy epiphyte loading. Sitka spruce dominates the wettest sites near river bottoms and coastal fog zones, its distribution tracking annual precipitation above roughly 100 inches. It is wind-pollinated, and its presence as a canopy dominant is a reliable indicator of old-growth conditions (old_growth_indicator: true). Zones present: olympic_peninsula, oregon_coast_range. Federal status: none. State status WA: none. State status OR: none. Trend: stable. Primary source: GOV-04. Data quality: verified_agency.

**Western red cedar** (*Thuja plicata*) functions as both a canopy and emergent species (canopy_layer: canopy/emergent), reaching 200+ feet in height and living well over 1,000 years in undisturbed stands. Its growth form is an evergreen conifer with fibrous bark, drooping branches, and scale-like foliage. Western red cedar tolerates wetter, more poorly drained soils than Douglas fir, often dominating swampy bottomlands and seepage areas. It is wind-pollinated and a primary old-growth indicator (old_growth_indicator: true). Its decay-resistant heartwood creates long-lasting nurse logs that support seedling establishment for centuries after the parent tree falls. Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04. Data quality: verified_agency.

**Western hemlock** (*Tsuga heterophylla*) is the most shade-tolerant of the dominant conifers and the climax species of the western hemlock vegetation zone that blankets the region from sea level to approximately 3,000 feet elevation (GOV-02). Its canopy position varies from canopy to understory (canopy_layer: canopy), and its growth form is an evergreen conifer with gracefully drooping leader and delicate flat needles. Western hemlock regenerates prolifically on nurse logs and stumps -- a successional strategy tied directly to the decomposition cycles mediated by saprotrophic fungi (cross-module relationship: flora-fungi, flagged for Phase 607). Wind-pollinated and a strong old-growth indicator (old_growth_indicator: true). Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04. Data quality: verified_agency.

**Douglas fir** (*Pseudotsuga menziesii*) is the dominant emergent conifer across the broader PNW region and often co-dominates with Sitka spruce and western hemlock in Olympic rainforest valleys (canopy_layer: emergent). Its growth form is a massive evergreen conifer reaching over 300 feet in old-growth stands, with deeply furrowed bark and distinctive pendulous cones with three-pointed bracts. Douglas fir is less tolerant of the wettest Olympic conditions than Sitka spruce, preferring slightly drier upland positions within the rainforest valleys. It is wind-pollinated and a primary old-growth indicator (old_growth_indicator: true). Douglas fir is the keystone host species for ectomycorrhizal fungi, notably *Rhizopogon* spp., forming the common mycorrhizal networks (CMNs) documented by Simard et al. (PR-03, PR-05) -- a bidirectional symbiotic relationship (relationship_type: symbiotic, subtype: mycorrhizal_network, strength: obligate, cross_module: true, flagged for Phase 607). Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04, PR-04. Data quality: verified_agency.

#### Understory and Shrub Layer

The understory of the Olympic rainforest is among the most lush on Earth, with multiple layers of vegetation occupying the vertical space between the forest floor and the canopy.

**Sword fern** (*Polystichum munitum*) dominates the understory herb layer (canopy_layer: herb) across virtually all Olympic lowland forests. This large evergreen fern (growth_form: evergreen fern, perennial) forms dense carpets on the forest floor and on nurse logs, with fronds reaching 4-5 feet. It is the single most abundant understory species in the PNW temperate rainforest. Old_growth_indicator: false (persists in second-growth). Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04. Data quality: verified_agency.

**Salal** (*Gaultheria shallon*) is the dominant evergreen shrub (canopy_layer: shrub, growth_form: evergreen shrub) of the Pacific Northwest understory, forming impenetrable thickets in gaps and at forest margins. On the Olympic Peninsula, salal grows as a 3-6 foot shrub under the conifer canopy. Insect-pollinated, it produces edible berries important to wildlife. Old_growth_indicator: false. Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04. Data quality: verified_agency.

**Oregon grape** (*Mahonia nervosa*, syn. *Berberis nervosa*) is a low evergreen shrub (canopy_layer: shrub, growth_form: evergreen shrub, height to 2 feet) with holly-like compound leaves and clusters of yellow flowers. It is insect-pollinated and produces tart blue berries. Old_growth_indicator: false. Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04. Data quality: verified_agency.

**Devil's club** (*Oplopanax horridus*) is a deciduous shrub (canopy_layer: shrub, growth_form: deciduous shrub, height to 10 feet) armed with dense spines on stems and leaf undersides. It is a strong indicator of wet, rich habitats -- stream banks, seepage areas, and alluvial terraces. Devil's club is more abundant on the Olympic Peninsula than in drier zones, and its presence reliably indicates persistent soil moisture. Old_growth_indicator: true (associated with mature, undisturbed riparian zones). Insect-pollinated. Zones present: olympic_peninsula, cascade_western_slopes. Federal status: none. Trend: stable. Primary source: GOV-04. Data quality: verified_agency.

**Vine maple** (*Acer circinatum*) occupies the understory (canopy_layer: understory, growth_form: deciduous small tree/large shrub) as a sprawling, multi-stemmed tree reaching 20-30 feet. It is wind and insect-pollinated. Old_growth_indicator: false. Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04.

**Red huckleberry** (*Vaccinium parvifolium*) grows as a deciduous shrub (canopy_layer: shrub, growth_form: deciduous shrub, height to 12 feet) almost exclusively on nurse logs and stumps, making it a visual tracer of the decomposition cycle. Insect-pollinated. The relationship between red huckleberry and nurse logs represents a commensalism interaction (relationship_type: symbiotic, subtype: commensalism, directionality: unidirectional, strength: facultative, cross_module: false, source: GOV-04) -- the plant benefits from the elevated, well-drained substrate while the decaying log is unaffected. Zones present: olympic_peninsula, cascade_western_slopes, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04. Data quality: verified_agency.

#### Ground Layer and Ferns

**Deer fern** (*Blechnum spicant*) is a dimorphic evergreen fern (canopy_layer: ground, growth_form: evergreen fern) with separate sterile and fertile fronds, common on moist banks and nurse logs. Old_growth_indicator: false. Zones present: olympic_peninsula, cascade_western_slopes, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04.

**Lady fern** (*Athyrium filix-femina*) is a large deciduous fern (canopy_layer: herb, growth_form: deciduous fern) of moist meadows, stream banks, and open forest. Old_growth_indicator: false. Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04.

**Maidenhair fern** (*Adiantum pedatum*) is a delicate deciduous fern (canopy_layer: herb, growth_form: deciduous fern) of wet rock faces, waterfall spray zones, and deeply shaded seepage areas. Old_growth_indicator: false. Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge. Federal status: none. Trend: stable. Primary source: GOV-04.

**Licorice fern** (*Polypodium glycyrrhiza*) is an epiphytic fern (canopy_layer: understory/shrub, growth_form: epiphytic fern) growing on moss mats draped over bigleaf maple branches. It is part of the epiphyte community that constitutes substantial canopy biomass in the Olympic rainforest. Old_growth_indicator: false. Zones present: olympic_peninsula, cascade_western_slopes, columbia_river_gorge, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04.

**Oxalis** (*Oxalis oregana*, wood sorrel) carpets the forest floor in deep shade (canopy_layer: ground, growth_form: perennial forb). Its clover-like leaves close in response to direct sunlight. Old_growth_indicator: false. Zones present: olympic_peninsula, cascade_western_slopes, oregon_coast_range. Federal status: none. Trend: stable. Primary source: GOV-04.

#### Epiphytes, Bryophytes, and Canopy Biomass

The Olympic rainforest canopy carries more than 4 tons of epiphytic moss, liverwort, and lichen biomass per hectare -- a figure that rivals tropical cloud forests and fundamentally distinguishes the PNW temperate rainforest from all other North American forest types (PR-04). This epiphyte loading is a direct function of the hyper-wet precipitation regime and represents a moisture storage system that buffers the forest against seasonal drought.

**Club mosses** (*Selaginella* spp. and *Lycopodium* spp.) carpet nurse logs and wet rock faces (canopy_layer: ground, growth_form: club moss). Their presence indicates persistent moisture and minimal disturbance. Old_growth_indicator: true.

**Sphagnum mosses** (*Sphagnum* spp.) dominate bogs, seepage areas, and saturated substrates (canopy_layer: ground, growth_form: peat moss). Their water-holding capacity contributes to the moisture buffering of the forest floor.

**Isothecium moss** (*Isothecium myosuroides*) and **cat-tail moss** (*Isothecium stoloniferum*) are the primary canopy epiphytes, forming thick mats on bigleaf maple (*Acer macrophyllum*) branches. The relationship between epiphytic mosses and bigleaf maple is a commensalism (relationship_type: symbiotic, subtype: commensalism, directionality: unidirectional, strength: facultative, mechanism: "Mosses use maple branches as substrate for access to light and atmospheric moisture; maple is unaffected by moss loading under normal conditions", cross_module: false, source: PR-04). Bigleaf maple (canopy_layer: canopy, growth_form: deciduous broadleaf tree) itself is the primary deciduous tree of the Olympic lowland forest, reaching 100+ feet and producing massive leaves that contribute significant litter to the forest floor nutrient cycle.

**Lungwort lichen** (*Lobaria pulmonaria*) is a large foliose lichen (taxonomic_group: lichen, canopy_layer: understory, growth_form: foliose lichen) abundant on old-growth conifer and hardwood trunks. It fixes atmospheric nitrogen via cyanobacterial symbionts -- a nutrient transfer relationship (relationship_type: nutrient_transfer, subtype: atmospheric_fixation, directionality: unidirectional, mechanism: "Cyanobacteria within the lichen thallus fix atmospheric N2; when lichen falls to forest floor, fixed nitrogen enters soil nutrient pool", cross_module: true, source: PR-04). Old_growth_indicator: true. Zones present: olympic_peninsula, cascade_western_slopes, oregon_coast_range. Federal status: none. State status WA: none. Trend: declining (sensitive to air quality). Primary source: PR-04.

#### Additional Olympic Peninsula Species

The following species contribute to the approximately 300 vascular plant species documented on the Olympic Peninsula (GOV-04):

**Pacific silver fir** (*Abies amabilis*) -- canopy conifer at mid-elevations (1,500-4,500 ft), growth_form: evergreen conifer. **Subalpine fir** (*Abies lasiocarpa*) -- canopy conifer near treeline. **Alaska yellow-cedar** (*Callitropsis nootkatensis*) -- canopy conifer of wet, high-elevation sites, old_growth_indicator: true. **Western white pine** (*Pinus monticola*) -- scattered canopy conifer, declining due to white pine blister rust, federal_status: species_of_concern, trend: declining, primary source: GOV-04. **Pacific yew** (*Taxus brevifolia*) -- understory conifer, growth_form: evergreen conifer/shrub, old_growth_indicator: true, source of taxol, federal_status: none, state_status_WA: sensitive. **Red alder** (*Alnus rubra*) -- canopy broadleaf tree of disturbed sites and riparian areas, fixes atmospheric nitrogen via root nodule bacteria (*Frankia* spp.) -- a nutrient transfer relationship (relationship_type: nutrient_transfer, subtype: atmospheric_fixation, mechanism: "Frankia bacteria in root nodules fix atmospheric N2, enriching soil nitrogen for surrounding vegetation; red alder stands can add 100-300 kg N/ha/year", cross_module: false, source: PR-04). **Cascara** (*Frangula purshiana*) -- understory deciduous tree. **Elderberry** (*Sambucus racemosa*) -- shrub of forest edges and disturbed areas. **Thimbleberry** (*Rubus parviflorus*) -- deciduous shrub. **Salmonberry** (*Rubus spectabilis*) -- deciduous shrub of riparian areas with edible fruit. **Goatsbeard** (*Aruncus dioicus*) -- tall perennial forb. **Bunchberry** (*Cornus canadensis*) -- ground layer forb. **False lily-of-the-valley** (*Maianthemum dilatatum*) -- ground layer forb. **Skunk cabbage** (*Lysichiton americanus*) -- emergent forb of swamps and wet areas, one of the earliest spring bloomers. **Trillium** (*Trillium ovatum*) -- spring ephemeral forb of the herb layer. **Vanilla leaf** (*Achlys triphylla*) -- perennial forb. **Inside-out flower** (*Vancouveria hexandra*) -- perennial forb. **Youth-on-age** (*Tolmiea menziesii*) -- perennial forb. **Stream violet** (*Viola glabella*) -- perennial forb of moist habitats. **Wild ginger** (*Asarum caudatum*) -- ground-hugging perennial forb. **Foam flower** (*Tiarella trifoliata*) -- perennial forb. **Piggyback plant** (*Tolmiea menziesii*) -- perennial forb producing plantlets on leaf surfaces. **Western starflower** (*Lysimachia latifolia*, syn. *Trientalis borealis* ssp. *latifolia*) -- perennial forb. **Twinflower** (*Linnaea borealis*) -- trailing sub-shrub. **Evergreen huckleberry** (*Vaccinium ovatum*) -- evergreen shrub. **Ocean spray** (*Holodiscus discolor*) -- deciduous shrub. **Mock orange** (*Philadelphus lewisii*) -- deciduous shrub. **Serviceberry** (*Amelanchier alnifolia*) -- deciduous shrub/small tree. **Beargrass** (*Xerophyllum tenax*) -- perennial forb/grass-like, conspicuous in montane meadows. **Western rattlesnake plantain** (*Goodyera oblongifolia*) -- terrestrial orchid. **Coralroot orchids** (*Corallorhiza* spp.) -- mycoheterotrophic orchids deriving nutrition from mycorrhizal fungi rather than photosynthesis (cross-module relationship: flora-fungi, flagged for Phase 607).

#### Conservation-Listed Species (Olympic Peninsula)

**Western white pine** (*Pinus monticola*) -- federal_status: species_of_concern, state_status_WA: none, trend: declining. Threatened by the introduced fungal pathogen white pine blister rust (*Cronartium ribicola*), which has killed an estimated 90% of mature western white pines across much of their range (GOV-04).

**Pacific yew** (*Taxus brevifolia*) -- federal_status: none, state_status_WA: sensitive, trend: declining. Slow-growing understory conifer harvested for taxol (cancer treatment compound) in the 1990s; populations have not fully recovered. Old_growth_indicator: true (GOV-04).

**Maidenhair spleenwort** (*Asplenium trichomanes*) -- federal_status: none, state_status_WA: sensitive, trend: unknown. Rare fern of calcareous rock crevices (GOV-04).

---

### Cascade Western Slopes

The western slopes of the Cascade Range receive 80-120 inches of annual precipitation, with totals increasing sharply with elevation due to orographic lifting (GOV-02). This zone supports approximately 350 species of vascular plants distributed across a pronounced elevational gradient, from the western hemlock zone at low elevations through the Pacific silver fir zone, mountain hemlock zone, and into subalpine and alpine communities above treeline (GOV-02, GOV-03). The Cascades are the moisture engine of the region: their volcanic peaks intercept Pacific storms, creating the precipitation gradient that defines plant communities across all four study zones.

#### Low-Elevation Forests (0-3,000 ft): Western Hemlock Zone

The low-elevation Cascade forests share many species with the Olympic Peninsula but receive less precipitation (80-100 inches vs. 140-200+), resulting in reduced epiphyte loading and somewhat less luxuriant understory development (GOV-02).

**Douglas fir** (*Pseudotsuga menziesii*) dominates the canopy (canopy_layer: emergent/canopy) as the primary seral species, reaching maximum size in old-growth stands on the western Cascade slopes. Old-growth Douglas fir forests of the western Cascades are the primary habitat for the northern spotted owl (*Strix occidentalis caurina*) -- a cross-module connection flagged for Phase 607. Old_growth_indicator: true. Primary source: GOV-02.

**Western hemlock** (*Tsuga heterophylla*) is the climax species, gradually replacing Douglas fir in the absence of fire (canopy_layer: canopy). Growth_form: evergreen conifer. The western hemlock zone extends from near sea level to approximately 3,000 feet on the western Cascades (GOV-02).

**Western red cedar** (*Thuja plicata*) co-dominates wet sites (canopy_layer: canopy/emergent). Often found along streams and in valley bottoms where soil moisture is highest. Old_growth_indicator: true. Primary source: GOV-02.

**Bigleaf maple** (*Acer macrophyllum*) is the dominant deciduous hardwood (canopy_layer: canopy, growth_form: deciduous broadleaf tree), particularly abundant in riparian corridors and disturbed sites. Supports massive epiphyte loads including licorice fern, mosses, and lichens. Primary source: GOV-02.

**Red alder** (*Alnus rubra*) colonizes disturbed sites, landslides, and riparian corridors (canopy_layer: canopy, growth_form: deciduous broadleaf tree). Nitrogen fixation via *Frankia* root symbionts enriches soil for successor species. Primary source: GOV-02.

The understory mirrors the Olympic forests: sword fern, salal, Oregon grape, vine maple, and devil's club dominate, with huckleberry species (*Vaccinium* spp.) abundant on rotting nurse logs (GOV-02).

#### Mid-Elevation Forests (3,000-4,500 ft): Pacific Silver Fir Zone

**Pacific silver fir** (*Abies amabilis*) becomes the dominant canopy species (canopy_layer: canopy, growth_form: evergreen conifer), replacing western hemlock as the climax tree at elevations above approximately 3,000 feet on the western Cascades. Its tolerance for deep snowpack and cool temperatures gives it competitive advantage at these elevations. Old_growth_indicator: true. Primary source: GOV-02. Data quality: verified_agency.

**Noble fir** (*Abies procera*) is a PNW endemic conifer (endemic_status: pnw_endemic, canopy_layer: canopy, growth_form: evergreen conifer) reaching elevations of 3,000-5,000 feet. It is the largest true fir species in the world, reaching heights of 250+ feet in optimal conditions on the Cascade western slopes. Old_growth_indicator: true. Federal status: none. Trend: stable. Primary source: GOV-02. Data quality: verified_agency.

**Alaska yellow-cedar** (*Callitropsis nootkatensis*) occupies wet, high-elevation sites (canopy_layer: canopy, growth_form: evergreen conifer). It is experiencing significant mortality attributed to changing winter snowpack patterns -- reduced snowfall leaves shallow roots exposed to lethal cold temperatures that were formerly insulated by snow (GOV-02). Old_growth_indicator: true. Federal_status: threatened. Trend: declining. Primary source: GOV-02.

**Western white pine** (*Pinus monticola*) was historically a significant component of mid-elevation forests but has been devastated by white pine blister rust (*Cronartium ribicola*), an introduced fungal pathogen. Federal_status: species_of_concern. Trend: declining. Primary source: GOV-02.

**Mountain hemlock** (*Tsuga mertensiana*) begins appearing at the upper boundary of this zone (canopy_layer: canopy, growth_form: evergreen conifer), transitioning into its own vegetation zone above 4,500 feet (GOV-02).

#### High-Elevation Forests (4,500-6,000 ft): Mountain Hemlock Zone

**Mountain hemlock** (*Tsuga mertensiana*) dominates (canopy_layer: canopy, growth_form: evergreen conifer) in a zone characterized by deep snowpack persisting into July, cool short growing seasons, and frequent fog. Trees here grow slowly, with individuals 300-500 years old reaching only moderate sizes. Old_growth_indicator: true. Primary source: GOV-02.

**Subalpine fir** (*Abies lasiocarpa*) co-dominates with mountain hemlock (canopy_layer: canopy, growth_form: evergreen conifer), its narrow spire-shaped crown shedding snow effectively. Primary source: GOV-02.

**Engelmann spruce** (*Picea engelmannii*) occurs on cold, moist sites (canopy_layer: canopy, growth_form: evergreen conifer), particularly along streams and in cold air drainage areas. Primary source: GOV-02.

The understory shifts dramatically at these elevations: huckleberry species (*Vaccinium membranaceum*, *V. deliciosum*) dominate the shrub layer, with beargrass (*Xerophyllum tenax*), bunchberry (*Cornus canadensis*), and various heathers (*Cassiope*, *Phyllodoce*) in the herb layer (GOV-02).

#### Subalpine Meadows and Alpine (6,000+ ft)

Above continuous forest, the subalpine meadow zone represents one of the most floristically rich habitats in the PNW, with an estimated 100+ species of wildflowers in meadow communities (GOV-02).

**Wildflower meadow species** include: avalanche lily (*Erythronium montanum*, growth_form: perennial forb), glacier lily (*Erythronium grandiflorum*), lupine (*Lupinus* spp., growth_form: perennial forb, nitrogen-fixing), paintbrush (*Castilleja* spp.), mountain bistort (*Bistorta bistortoides*), western pasqueflower (*Anemone occidentalis*), Cascade aster (*Eucephalus ledophyllus*), partridge foot (*Luetkea pectinata*), mountain daisy (*Erigeron peregrinus*), Jeffrey's shooting star (*Primula jeffreyi*), red mountain heather (*Phyllodoce empetriformis*), white mountain heather (*Cassiope mertensiana*), spreading phlox (*Phlox diffusa*), and Davidson's penstemon (*Penstemon davidsonii*). These meadow communities are insect-pollinated and support diverse pollinator assemblages (cross-module: fauna, flagged for Phase 607). Primary source: GOV-02.

**Krummholz species** at treeline include stunted forms of subalpine fir, mountain hemlock, and whitebark pine (*Pinus albicaulis*). Whitebark pine (federal_status: threatened, trend: declining) is a keystone subalpine species whose large, wingless seeds are dispersed exclusively by Clark's nutcracker (*Nucifraga columbiana*) -- an obligate mutualism (relationship_type: symbiotic, subtype: mutualism, directionality: bidirectional, strength: obligate, mechanism: "Clark's nutcracker caches whitebark pine seeds in soil; unretrieved caches germinate, providing virtually all whitebark pine regeneration. Pine provides high-energy food critical for nutcracker survival", cross_module: true, source: GOV-02). Primary source: GOV-02.

**Alpine species** above treeline include cushion plants, mat-forming forbs, and specialized graminoids: alpine buckwheat (*Eriogonum pyrolifolium*), Tolmie's saxifrage (*Micranthes tolmiei*), cliff paintbrush (*Castilleja rupicola*), and Cascade penstemon (*Penstemon procerus*). Primary source: GOV-02.

#### Conservation-Listed Species (Cascade Western Slopes)

**Alaska yellow-cedar** (*Callitropsis nootkatensis*) -- federal_status: threatened, trend: declining. Declining due to reduced winter snowpack exposing roots to frost damage. An early indicator of climate change impacts on PNW forests (GOV-02).

**Whitebark pine** (*Pinus albicaulis*) -- federal_status: threatened, trend: declining. Threatened by white pine blister rust, mountain pine beetle, altered fire regimes, and climate change. Loss of whitebark pine has cascading effects on Clark's nutcracker populations and subalpine ecosystem function (GOV-02).

**Western white pine** (*Pinus monticola*) -- federal_status: species_of_concern, trend: declining. Blister rust mortality has reduced populations by over 90% across much of its range (GOV-02).

**Pale larkspur** (*Delphinium leucophaeum*) -- federal_status: species_of_concern, state_status_OR: endangered, trend: declining. Rare perennial forb of Willamette Valley and lower Cascade prairies (GOV-03).

---

### Columbia River Gorge

The Columbia River Gorge is the most floristically distinctive zone in this survey and the most important for conservation biology. Carved by catastrophic Missoula Floods during the last Ice Age, the Gorge creates the only near-sea-level passage through the Cascade Range, funneling Pacific moisture eastward through a narrow corridor that transitions from 75 inches of annual precipitation at the west end (Cascade Locks area) to as little as 15 inches at the east end (The Dalles area) (GOV-01, GOV-03). This compressed moisture gradient -- spanning over 60 inches of annual precipitation in fewer than 50 miles -- creates a botanical transition zone unlike any other in North America.

The Gorge supports approximately 800 species of vascular plants within its boundaries, including at least 15 endemic wildflower species found nowhere else on Earth (GOV-03, CON-01). This extraordinary concentration of endemism results from the unique combination of basalt cliff microhabitats, waterfall spray zones, hanging gardens on seeping cliff faces, and the abrupt juxtaposition of westside and eastside plant communities. The total Gorge flora is estimated at over 200 species in any given habitat type, with the full 800-species count reflecting the remarkable habitat diversity compressed into the Gorge's relatively small geographic footprint (GOV-01).

#### Western Gorge (Westside Flora)

The western Gorge (roughly Troutdale to Cascade Locks) receives sufficient precipitation to support classic westside species.

**Douglas fir** (*Pseudotsuga menziesii*) and **western hemlock** (*Tsuga heterophylla*) dominate the canopy in the western Gorge, with **western red cedar** (*Thuja plicata*) on wetter sites (GOV-03). **Bigleaf maple** (*Acer macrophyllum*) is abundant, particularly in riparian corridors and on talus slopes where its large leaves decompose rapidly, contributing to rich soil development.

The understory includes sword fern, Oregon grape, salal, and vine maple -- the same assemblage found on the Olympic Peninsula and Cascade western slopes, here at the eastern edge of their precipitation tolerance (GOV-03).

**Waterfall spray zone species** represent unique microhabitats where constant mist from the Gorge's many waterfalls (Multnomah, Wahkeena, Latourell, Horsetail, and others) creates localized hyper-wet conditions on basalt cliff faces. These spray zones support maidenhair fern (*Adiantum pedatum*), mosses, liverworts, and several Gorge endemic species adapted to the combination of constant moisture and exposed rock substrate (GOV-03, CON-01).

#### Transition Zone (Mid-Gorge)

The botanical transition zone, roughly between Cascade Locks and Hood River, is where westside and eastside floras overlap and intergrade. This ecotone is where many Gorge endemic species are concentrated, occupying narrow habitat bands at specific points along the moisture gradient (CON-01).

**Oregon white oak** (*Quercus garryana*) begins appearing in the transition zone (canopy_layer: canopy, growth_form: deciduous broadleaf tree), becoming increasingly dominant eastward. Oregon white oak savanna is a critically endangered habitat type in the PNW, having lost over 90% of its historic extent to agricultural conversion and fire suppression (GOV-03). Old_growth_indicator: true (for savanna habitat). Federal_status: none. State_status_WA: none. Trend: declining. Primary source: GOV-03.

**Madrone** (*Arbutus menziesii*) occurs on dry, south-facing slopes in the transition zone (canopy_layer: canopy, growth_form: evergreen broadleaf tree). It is the only native broadleaf evergreen tree in the PNW, with distinctive smooth red-orange bark. Zones present: columbia_river_gorge, cascade_western_slopes. Trend: declining (susceptible to fungal dieback). Primary source: GOV-03.

The competition between westside conifers and eastside oaks in this transition zone represents an exploitative competition relationship (relationship_type: competition, subtype: exploitative, directionality: bidirectional, strength: facultative, mechanism: "Western hemlock and Douglas fir compete with Oregon white oak for light and soil moisture along the moisture gradient; without fire, conifers shade out oaks, but in the dry mid-Gorge, oaks persist where conifers cannot tolerate summer drought", cross_module: false, source: GOV-03).

#### Eastern Gorge (Eastside Flora)

East of Hood River, the rain-shadow effect intensifies dramatically. The landscape transitions to Oregon white oak savanna and ultimately to steppe vegetation near The Dalles.

**Ponderosa pine** (*Pinus ponderosa*) becomes the dominant conifer (canopy_layer: canopy, growth_form: evergreen conifer) in the eastern Gorge, its thick bark adapted to the frequent fire regime of dry-side ecosystems. Old_growth_indicator: true (for dry-side old-growth). Zones present: columbia_river_gorge. Federal status: none. Trend: stable. Primary source: GOV-03. Data quality: verified_agency.

**Oregon white oak** (*Quercus garryana*) savanna with bunchgrass understory dominates the eastern Gorge landscape (GOV-03).

**Eastside understory and grassland species** include: balsamroot (*Balsamorhiza sagittata*, growth_form: perennial forb), lupine (*Lupinus* spp.), bunchgrasses (Idaho fescue, *Festuca idahoensis*; bluebunch wheatgrass, *Pseudoroegneria spicata*), bitterroot (*Lewisia rediviva*), desert parsley (*Lomatium* spp.), camas (*Camassia quamash*), and yarrow (*Achillea millefolium*). This is a completely different plant community from the western Gorge, separated by fewer than 50 miles but more than 60 inches of annual precipitation (GOV-01, GOV-03).

#### The 15 Gorge Endemic Wildflowers

The Columbia River Gorge harbors at least 15 wildflower species endemic to its unique combination of basalt cliff habitats, microclimate niches, and geological history (GOV-03, CON-01). These endemics are concentrated in the transition zone where unique combinations of moisture, substrate, and exposure create habitats found nowhere else. The following species are named here and will be profiled in detail in the Endemic Wildflowers section (Plan 02):

1. Barrett's penstemon (*Penstemon barrettiae*) -- endemic_status: gorge_endemic
2. Columbia Gorge daisy (*Erigeron oreganus*) -- endemic_status: gorge_endemic
3. Gorge larkspur (*Delphinium nudicaule* var.) -- endemic_status: gorge_endemic
4. Suksdorf's desert parsley (*Lomatium suksdorfii*) -- endemic_status: gorge_endemic
5. Smooth desert parsley (*Lomatium laevigatum*) -- endemic_status: gorge_endemic
6. Henderson's checker-mallow (*Sidalcea hendersonii*) -- endemic_status: gorge_endemic
7. Thompson's fleabane (*Erigeron thompsonii*) -- endemic_status: gorge_endemic
8. Gorge wallflower (*Erysimum arenicola* var. *torulosum*) -- endemic_status: gorge_endemic
9. Obscure buttercup (*Ranunculus reconditus*) -- endemic_status: gorge_endemic
10. Columbia cress (*Rorippa columbiae*) -- endemic_status: gorge_endemic
11. Piper's bellflower (*Campanula piperi*) -- endemic_status: gorge_endemic
12. Howell's daisy (*Erigeron howellii*) -- endemic_status: gorge_endemic
13. Gorge beardtongue (*Penstemon rupicola* var.) -- endemic_status: gorge_endemic
14. Tygh Valley milk-vetch (*Astragalus tyghensis*) -- endemic_status: gorge_endemic
15. Peck's penstemon (*Penstemon peckii*) -- endemic_status: gorge_endemic

Many of these endemics occupy narrow habitat bands at specific points along the moisture gradient, particularly on basalt cliff faces and talus slopes where unique combinations of aspect, moisture, and substrate create microhabitats not replicated elsewhere. Their conservation depends directly on protecting these specific geologic features within the Columbia River Gorge National Scenic Area (GOV-03, CON-01). Note: GPS coordinates and specific locations of endangered endemic species are withheld per SAFE-01.

#### Conservation-Listed Species (Columbia River Gorge)

**Barrett's penstemon** (*Penstemon barrettiae*) -- federal_status: species_of_concern, state_status_WA: endangered, state_status_OR: threatened, endemic_status: gorge_endemic, trend: declining. Restricted to basalt cliffs and talus in the Gorge. Primary source: GOV-03, CON-01.

**Nelson's checkermallow** (*Sidalcea nelsoniana*) -- federal_status: threatened, state_status_OR: threatened, trend: declining. Wet prairie and oak savanna habitat (GOV-03).

**Howellia** (*Howellia aquatilis*) -- federal_status: threatened, state_status_WA: threatened, trend: declining. Aquatic plant of seasonal ponds and wetlands in the Gorge (GOV-03).

**Oregon white oak savanna** (habitat, not single species) -- while no individual oak species is federally listed, the savanna habitat type has declined by over 90% from its pre-settlement extent and is considered critically imperiled (GOV-03, CON-01).

#### Ecological Relationships (Columbia River Gorge)

The Gorge's transition zone creates unique competitive dynamics:

1. **Conifer-oak competition** (described above): exploitative competition between westside conifers and eastside oaks along the moisture gradient (GOV-03).

2. **Oak-grassland mutualism**: Oregon white oak savanna depends on periodic fire to prevent conifer encroachment. The bunchgrass understory carries fire that maintains the open savanna structure beneficial to oaks -- a facultative mutualism (relationship_type: symbiotic, subtype: mutualism, directionality: bidirectional, strength: facultative, mechanism: "Bunchgrasses carry periodic low-intensity fire that kills conifer seedlings and maintains open canopy structure favorable to oaks; oaks provide partial shade that moderates soil moisture for grasses", cross_module: false, source: GOV-03).

3. **Endemic-microhabitat specificity**: Many Gorge endemics have obligate relationships with specific basalt substrate types, moisture levels, and aspects -- representing a form of habitat competition where the narrow niche requirements of endemics exclude generalist species from the same microsites (GOV-03, CON-01).

---

### Oregon Coast Range

The Oregon Coast Range receives 80-120 inches of annual precipitation, comparable to the Cascade western slopes but at lower elevations (summits rarely exceed 4,000 feet) (PR-04). This zone supports approximately 150-200 species of vascular plants in its forest communities, sharing the majority of its flora with the Olympic Peninsula but in a lower-elevation, more recently disturbed landscape. The Oregon Coast Range is notable for several reasons: it supports the southernmost significant stands of Sitka spruce in the PNW study region, it provides critical old-growth habitat for marbled murrelet nesting, and its forest structure demonstrates the ecological trajectory of recovering temperate rainforest after extensive 20th-century logging (PR-04).

#### Coastal Fringe (0-500 ft)

**Sitka spruce** (*Picea sitchensis*) dominates the coastal fringe (canopy_layer: emergent, growth_form: evergreen conifer), reaching its largest dimensions in the fog belt where oceanic influence moderates temperatures and maintains high humidity year-round. The Sitka spruce zone extends inland only a few miles, limited by the distance fog penetrates from the coast (PR-04). Old_growth_indicator: true.

**Shore pine** (*Pinus contorta* var. *contorta*) occupies exposed headlands and dune forests (canopy_layer: canopy, growth_form: evergreen conifer), a stunted coastal form of lodgepole pine adapted to salt spray, wind shear, and nutrient-poor sandy soils. Federal_status: none. Trend: stable. Primary source: PR-04.

**Western hemlock** (*Tsuga heterophylla*) co-dominates with Sitka spruce slightly inland where fog influence diminishes (canopy_layer: canopy). Primary source: PR-04.

**Coastal shrub species** include salal (*Gaultheria shallon*), which forms impenetrable thickets on exposed headlands; evergreen huckleberry (*Vaccinium ovatum*); wax myrtle (*Morella californica*, growth_form: evergreen shrub); and Pacific rhododendron (*Rhododendron macrophyllum*, growth_form: evergreen shrub), the state flower of Washington. Primary source: PR-04.

#### Interior Forests (500-3,000 ft)

**Douglas fir** (*Pseudotsuga menziesii*) and **western hemlock** (*Tsuga heterophylla*) co-dominate the interior Coast Range forests (canopy_layer: canopy/emergent), with western red cedar on wetter sites. These forests share the same general species composition as the low-elevation Cascade forests but at generally lower elevations and with more disturbance history (PR-04).

**Red alder** (*Alnus rubra*) is particularly abundant in the Coast Range due to extensive logging history creating early-seral conditions favorable to this nitrogen-fixing pioneer species. Red alder stands constitute a significant percentage of Coast Range forest cover, a legacy of 20th-century clear-cutting practices (PR-04).

The understory is dominated by sword fern, salal, Oregon grape, and vine maple -- the standard PNW lowland understory assemblage. **Oxalis** (*Oxalis oregana*) is especially abundant on the moist Coast Range forest floor, forming extensive carpets under closed canopy (PR-04).

#### Old-Growth and Marbled Murrelet Habitat

The remaining old-growth stands in the Oregon Coast Range are among the most ecologically significant in the PNW, not for their botanical uniqueness (the species are largely the same as other zones) but for their structural attributes: large-diameter trees, multi-layered canopy, abundant snags, downed wood, and the thick moss platforms on large branches that provide nesting habitat for the marbled murrelet (*Brachyramphus marmoratus*) -- a seabird that nests exclusively in old-growth forests up to 50 miles from the coast (cross-module: fauna, flagged for Phase 607). The murrelet requires moss-covered branches at least 6 inches in diameter for its single-egg nest, a structural feature found only in old-growth or mature second-growth stands (PR-04). Federal_status: threatened. This connection between a marine bird and an ancient terrestrial forest represents one of the most remarkable cross-module relationships in the PNW ecosystem.

**Old-growth indicator species in the Oregon Coast Range** include: Sitka spruce (emergent specimens), western red cedar (>200 years), Douglas fir (>300 years), Pacific yew (*Taxus brevifolia*), vine maple (large multi-stemmed forms), lungwort lichen (*Lobaria pulmonaria*), and red huckleberry on nurse logs. These indicators collectively define the old-growth structural condition necessary for marbled murrelet nesting (PR-04).

#### Conservation-Listed Species (Oregon Coast Range)

**Marbled murrelet** (nesting habitat plant species) -- The murrelet itself is federal_status: threatened; the old-growth forest habitat it requires for nesting is therefore a conservation priority driving forest management across the Coast Range. Primary source: PR-04.

**Western lily** (*Lilium occidentale*) -- federal_status: endangered, state_status_OR: endangered, trend: declining. A coastal bog and wet meadow lily restricted to a few sites in the southern Oregon and northern California coast ranges. Primary source: PR-04.

**Nelson's checkermallow** (*Sidalcea nelsoniana*) -- federal_status: threatened, state_status_OR: threatened, trend: declining. Occurs in wet prairies and meadows of the Coast Range foothills (PR-04).

#### Ecological Relationships (Oregon Coast Range)

1. **Nurse log succession**: The decomposition of large fallen trees creates the primary regeneration substrate for western hemlock, western red cedar, and red huckleberry. This represents a nutrient transfer relationship (relationship_type: nutrient_transfer, subtype: decomposition, mechanism: "Saprotrophic fungi decompose nurse logs over 200-500 years, releasing nutrients and creating elevated, well-drained microsites for seedling establishment; the slow decomposition rate of western red cedar heartwood creates exceptionally long-lived nurse logs", cross_module: true, source: PR-04). Flagged for Phase 607: the fungi module will document the saprotrophic species involved.

2. **Red alder nitrogen enrichment**: Red alder's *Frankia*-mediated nitrogen fixation (100-300 kg N/ha/year) accelerates succession on logged sites, enriching soils for eventual conifer re-establishment (relationship_type: nutrient_transfer, subtype: atmospheric_fixation, source: PR-04).

3. **Spruce-fog interaction**: Sitka spruce's position at the coastal fringe creates a fog-drip interception relationship where the tree's needle structure captures atmospheric moisture and drips it to the forest floor, effectively increasing ground-level precipitation by 20-30% beyond measured rainfall (PR-04). This mechanism is analogous to tropical cloud forest fog interception and represents a critical water input to the coastal ecosystem.

---

## Species Count Summary

| Zone | Estimated Vascular Plants | Conifers | Broadleaf Trees | Shrubs | Ferns | Forbs/Wildflowers | Source |
|------|--------------------------|----------|-----------------|--------|-------|-------------------|--------|
| Olympic Peninsula | ~300+ | 8-10 | 5-7 | 15-20 | 15-20 | 100+ | GOV-04, PR-04 |
| Cascade Western Slopes | ~350+ | 10-12 | 5-7 | 20-25 | 12-15 | 150+ (incl. subalpine meadows) | GOV-02, GOV-03 |
| Columbia River Gorge | ~800 (total within Gorge boundaries) | 6-8 | 5-7 | 15-20 | 8-10 | 200+ (incl. 15 endemics) | GOV-01, GOV-03, CON-01 |
| Oregon Coast Range | ~150-200 | 5-7 | 4-5 | 12-15 | 10-12 | 50-80 | PR-04 |
| **Combined study region** | **~800+ unique species** | **~15** | **~10** | **~30+** | **~20+** | **~250+** | Multiple |

> **Note on species counts:** The Gorge alone harbors approximately 800 vascular plant species (GOV-01, GOV-03), reflecting its extraordinary habitat diversity as a transition zone. Species shared across multiple zones are counted once in the combined total. The combined study region total of 800+ unique species reflects the high degree of species overlap between the Olympic Peninsula, Cascades, and Oregon Coast Range, with the Gorge adding the most unique species due to its eastside flora and endemic wildflowers. Precise species counts vary by source and survey methodology; the figures presented here represent conservative estimates from the cited agency sources.

---

## Cross-Module Relationship Summary

The following ecological relationships documented in this flora module connect to other survey modules and are flagged for inclusion in the Phase 607 cross-module synthesis:

| Relationship | Flora Species | Other Module | Connection | Source |
|-------------|--------------|--------------|------------|--------|
| Douglas fir -- mycorrhizal network | *Pseudotsuga menziesii* | Fungi | EMF symbiosis via *Rhizopogon* spp. | PR-03, PR-05 |
| Western hemlock -- nurse log decomposition | *Tsuga heterophylla* | Fungi | Saprotrophic fungi mediate regeneration substrate | PR-04 |
| Lungwort lichen -- nitrogen fixation | *Lobaria pulmonaria* | Fungi | Cyanobacterial nitrogen fixation within lichen thallus | PR-04 |
| Whitebark pine -- Clark's nutcracker | *Pinus albicaulis* | Fauna | Obligate seed dispersal mutualism | GOV-02 |
| Old-growth canopy -- marbled murrelet | Multiple canopy species | Fauna | Nesting habitat dependence | PR-04 |
| Subalpine meadows -- pollinator assemblages | Multiple forb species | Fauna | Insect pollination networks | GOV-02 |
| Coralroot orchids -- mycorrhizal fungi | *Corallorhiza* spp. | Fungi | Mycoheterotrophic nutrition | PR-04 |
| Red alder -- *Frankia* bacteria | *Alnus rubra* | Fungi (soil microbiome) | Atmospheric nitrogen fixation | PR-04 |
| Salmon-derived nitrogen -- riparian trees | Multiple riparian species | Aquatic, Fauna | CASCADE-01: marine N transfer | PR-02 |

---

## Geographic Moisture Gradient

The single most powerful explanatory variable for plant community composition in the Pacific Northwest temperate rainforest is moisture. The west-to-east precipitation gradient -- from the hyper-wet Olympic Peninsula through the Cascade Range and into the rain-shadow of the Columbia River Gorge -- creates a moisture continuum that determines which species occur where, why forest structure varies dramatically across short distances, and where conservation priorities concentrate. This section maps that gradient quantitatively and connects it to the species distribution patterns documented in the Vascular Plant Inventory above.

### Precipitation Continuum

The Pacific Northwest moisture gradient spans nearly an order of magnitude in annual precipitation across the four study zones. Prevailing westerly winds carry moisture-laden air off the Pacific Ocean; mountain ranges intercept this moisture through orographic lifting, creating extreme precipitation on windward slopes and dramatic rain shadows on leeward sides.

**Olympic Peninsula: 140-200+ inches/year**

The wettest zone in the contiguous United States. The Hoh Rainforest receives approximately 140 inches of annual precipitation, the Quinault valley approximately 140 inches, and exposed windward ridges receive over 200 inches (GOV-04). This precipitation falls primarily as rain at lower elevations (below 3,000 ft) and as snow above, with fog and low cloud providing additional moisture interception equivalent to 20-30% of measured rainfall on the coastal fringe (PR-04). The extreme moisture regime drives the rainforest structure described in the Olympic Peninsula inventory: massive conifer growth, heavy epiphyte loading (>4 tons/hectare of canopy moss and lichen biomass), saturated soils supporting skunk cabbage and devil's club, and the dominance of Sitka spruce on the wettest sites (GOV-04, PR-04).

**Cascade Western Slopes: 80-120 inches/year**

Precipitation increases with elevation on the western Cascades due to orographic lifting, ranging from approximately 80 inches at lower elevations to over 120 inches at mid-elevation ridge crests (GOV-02). Above 3,500 feet, much of this precipitation falls as snow, with snowpack depths exceeding 15 feet in some areas and persisting into July at higher elevations. The Cascade crest is the primary moisture barrier for the region, capturing Pacific storms and creating the rain shadow that defines the eastern Gorge and the entire east-side PNW landscape. The elevational precipitation gradient drives the vegetation zonation documented in the Cascade inventory: western hemlock zone (80-100 in/yr), Pacific silver fir zone (90-120 in/yr), mountain hemlock zone (100-120+ in/yr as snow) (GOV-02).

**Columbia River Gorge: 75 inches (west end) to 15 inches (east end)**

The most dramatic precipitation transition in the study region. The west end of the Gorge near Cascade Locks receives approximately 75 inches of annual precipitation, supporting westside conifer forests essentially indistinguishable from the low-elevation Cascades (GOV-01, GOV-03). Moving eastward, precipitation drops rapidly -- to approximately 40-50 inches at the Hood River area, 25-30 inches at Mosier, and as little as 15 inches at The Dalles (GOV-01). This represents a loss of 60 inches of annual precipitation across fewer than 50 miles of horizontal distance, a gradient steeper than almost any other in North America. The compressed gradient is what creates the conditions for Gorge endemism: narrow habitat bands where specific moisture levels intersect specific substrate types and aspects, producing microhabitats found nowhere else (GOV-03, CON-01).

**Oregon Coast Range: 80-120 inches/year**

Precipitation totals comparable to the Cascade western slopes, ranging from approximately 80 inches at lower elevations to 120 inches on ridge crests (PR-04). Unlike the Olympics, the Coast Range lacks the extreme precipitation that produces true temperate rainforest conditions at all sites; the Sitka spruce rainforest zone is restricted to a narrow coastal fringe where fog influence supplements rainfall (PR-04). Interior Coast Range forests receive sufficient moisture for Douglas fir/western hemlock dominance but lack the sustained hyper-wet conditions that support the massive epiphyte loading characteristic of the Olympic valleys (PR-04).

### Indicator Species by Moisture Regime

The moisture gradient manifests in species composition through a series of indicator species whose presence reliably signals position along the continuum. These indicators function as biological moisture gauges, their distribution boundaries marking the thresholds where one moisture regime transitions to another.

#### Hyper-Wet Indicators (>120 inches/year)

The hyper-wet regime is defined by the dominance of **Sitka spruce** (*Picea sitchensis*) as a canopy emergent (canopy_layer: emergent, growth_form: evergreen conifer). Where Sitka spruce dominates the canopy, annual precipitation reliably exceeds 100-120 inches (GOV-04). Supporting indicators include:

- **Heavy epiphyte loading** (>4 tons/hectare canopy biomass): thick mats of isothecium moss, cat-tail moss, lungwort lichen, and licorice fern draped on bigleaf maple and conifer branches (PR-04)
- **Club mosses** (*Selaginella* spp., *Lycopodium* spp.): ground-layer indicators of persistent moisture with minimal disturbance (canopy_layer: ground, growth_form: club moss) (GOV-04)
- **Skunk cabbage** (*Lysichiton americanus*): emergent forb indicating saturated or seasonally flooded soils (canopy_layer: herb, growth_form: perennial forb) (GOV-04)
- **Devil's club** (*Oplopanax horridus*): shrub indicator of persistent soil moisture and rich alluvial soils (canopy_layer: shrub, growth_form: deciduous shrub) (GOV-04)

#### Mesic Indicators (80-120 inches/year)

The mesic regime -- the most widespread in the study region -- is defined by **Douglas fir** (*Pseudotsuga menziesii*) and **western hemlock** (*Tsuga heterophylla*) co-dominance (canopy_layer: canopy/emergent, growth_form: evergreen conifer). Key understory indicators include:

- **Sword fern** (*Polystichum munitum*) dominance in the herb layer (canopy_layer: herb): the single most reliable indicator of the mesic regime, persisting across a wide precipitation range (GOV-02)
- **Salal** (*Gaultheria shallon*): evergreen shrub (canopy_layer: shrub) abundant in the mesic understory (GOV-02)
- **Oregon grape** (*Mahonia nervosa*): evergreen shrub of mesic to slightly dry sites (canopy_layer: shrub) (GOV-02)
- **Red alder** (*Alnus rubra*): deciduous broadleaf tree (canopy_layer: canopy) in disturbed and riparian mesic habitats (GOV-02)

#### Transitional Indicators (40-75 inches/year)

The transition zone, most clearly expressed in the mid-Gorge, is defined by the retreat of **western hemlock** and the appearance of **Oregon white oak** (*Quercus garryana*) as a canopy component (canopy_layer: canopy, growth_form: deciduous broadleaf tree). Key indicators include:

- **Madrone** (*Arbutus menziesii*): evergreen broadleaf tree (canopy_layer: canopy) on dry south-facing slopes, marking the dry edge of the west-side flora (GOV-03)
- **Oregon white oak** (*Quercus garryana*) appearing in open savanna structure, initially mixed with conifers and then dominant (GOV-03)
- **Oceanspray** (*Holodiscus discolor*): deciduous shrub shifting from the understory to more open canopy positions as conifer shade diminishes (GOV-03)
- **Gorge endemic wildflowers** concentrated in narrow habitat bands at specific moisture thresholds, particularly on basalt cliff faces where seepage creates localized wet conditions within the broader transitional zone (CON-01)

#### Rain-Shadow Indicators (<25 inches/year)

The rain-shadow regime, fully expressed at the east end of the Gorge, is defined by the dominance of **ponderosa pine** (*Pinus ponderosa*) and **Oregon white oak** (*Quercus garryana*) savanna (canopy_layer: canopy, growth_form: evergreen conifer and deciduous broadleaf tree, respectively). Key indicators include:

- **Balsamroot** (*Balsamorhiza sagittata*): perennial forb (canopy_layer: herb, growth_form: perennial forb) of dry grasslands, flowering en masse in April-May, reliable indicator of rain-shadow steppe conditions (GOV-03)
- **Bunchgrasses** (Idaho fescue, *Festuca idahoensis*; bluebunch wheatgrass, *Pseudoroegneria spicata*): dominant ground cover replacing the fern-and-shrub understory of westside forests (canopy_layer: ground/herb, growth_form: perennial bunchgrass) (GOV-01)
- **Bitterroot** (*Lewisia rediviva*): perennial forb of exposed, dry rocky sites -- an extreme drought indicator absent from all westside habitats (GOV-03)
- **Desert parsley** (*Lomatium* spp.): diverse genus with multiple species occupying dry, open habitats, including several Gorge endemics (GOV-03, CON-01)

### Elevation Interaction

Elevation modifies the moisture gradient in ways that create additional complexity in species distribution patterns. The interaction between horizontal (west-to-east) and vertical (elevation) moisture gradients produces the full three-dimensional mosaic of PNW plant communities.

**Orographic amplification:** The Cascade crest captures Pacific storms through orographic lifting, amplifying precipitation with elevation. At any given latitude, moving from 1,000 feet to 5,000 feet on the western Cascades may double annual precipitation (GOV-02). This elevation-driven moisture increase partially compensates for the east-west precipitation decline, creating islands of mesic habitat at high elevations in otherwise dry east-side areas.

**Rain-shadow intensification at low elevations:** The rain-shadow effect is most severe at low elevations in the Gorge, where the Columbia River has carved a near-sea-level path through the Cascade barrier. At The Dalles (elevation ~100 ft), annual precipitation is approximately 15 inches (GOV-01). Only 50 miles to the west at the same low elevation, Cascade Locks receives approximately 75 inches (GOV-01). This low-elevation amplification of the rain-shadow is why the Gorge's moisture gradient is more extreme than that experienced by any other east-west transect across the Cascades at higher elevations.

**Snowpack as moisture storage:** At elevations above approximately 3,500 feet on the western Cascades, winter precipitation falls as snow rather than rain. Deep snowpack (often exceeding 15 feet) acts as a seasonal moisture reservoir, melting slowly through spring and early summer and sustaining soil moisture well into the dry season (GOV-02). This snowpack-mediated moisture supply is what allows Pacific silver fir, mountain hemlock, and subalpine meadow communities to persist at elevations where rainfall alone would be insufficient during the dry summer months. The ongoing decline in snowpack depth and duration due to warming temperatures is a primary climate change concern for these communities (GOV-02).

**Alpine moisture regime:** Above treeline (approximately 6,000-7,000 ft on the western Cascades), plant communities occupy a distinct moisture regime characterized by high precipitation but extreme exposure, rapid drainage on rocky substrates, and desiccating winds. Alpine cushion plants and mat-forming forbs have evolved drought-avoidance adaptations despite growing in high-precipitation zones -- a paradox explained by the substrate and exposure conditions rather than total moisture availability (GOV-02).

### Climate Change Implications

The moisture gradient that structures PNW plant communities is not static. Climate projections for the Pacific Northwest indicate significant shifts in temperature and precipitation patterns that will alter the gradient, with cascading effects on species distribution, forest structure, and conservation priorities.

**Temperature projections:** The USDA Northwest Climate Hub projects a temperature increase of 4.7 to 10 degrees Fahrenheit across the Pacific Northwest by the end of the 21st century, depending on emissions scenario (GOV-02). This warming will alter the moisture gradient not primarily through changes in total precipitation (which models predict will shift modestly) but through increased evapotranspiration demand, reduced snowpack, and longer summer drought periods (GOV-02).

**Drought stress at gradient boundaries:** Species at the dry edge of their moisture tolerance are most vulnerable to climate-driven gradient shifts. Western hemlock populations in the mid-Gorge transition zone, already at their drought tolerance limit, may contract westward as summer drought intensifies (GOV-02). Similarly, Douglas fir at lower elevations on the eastern Cascade slopes may experience increased mortality from drought stress and bark beetle outbreaks exacerbated by warming temperatures (GOV-02).

**Upslope migration of vegetation zones:** As temperatures warm, vegetation zones are projected to shift upslope by 300-1,000 feet of elevation over the coming century (GOV-02). The western hemlock zone will expand upward into current Pacific silver fir habitat; Pacific silver fir will push into the mountain hemlock zone; and subalpine meadow communities will be compressed against the alpine zone with limited upward room. Species with narrow elevational ranges -- including many subalpine wildflowers and krummholz conifers -- face habitat loss as their preferred conditions move upslope faster than they can migrate (GOV-02).

**Increased fire risk in rain-shadow zones:** The east end of the Gorge and the lower-elevation eastern Cascade slopes already experience fire as a primary ecological disturbance. Warming temperatures and longer dry seasons are projected to increase fire frequency and severity in these zones, with potential cascading effects on Oregon white oak savanna, ponderosa pine forests, and the bunchgrass-forb communities of the rain shadow (GOV-02, GOV-03). Fire regime changes at the dry end of the gradient may also accelerate conifer encroachment in the mid-Gorge transition zone, threatening Gorge endemic species whose habitats depend on specific disturbance regimes (CON-01).

**Snowpack decline and Alaska yellow-cedar:** The ongoing decline in winter snowpack is already driving mortality in Alaska yellow-cedar (*Callitropsis nootkatensis*), which depends on snow insulation to protect its shallow root system from lethal cold during winter freeze-thaw cycles. This species -- federally listed as threatened -- represents an early indicator of climate-driven vegetation change in the PNW montane zone (GOV-02).

> **Note:** Detailed climate projections and their implications for ecosystem function across all four survey modules are deferred to the Phase 607 cross-module synthesis. The data presented here establishes the baseline gradient against which future change will be measured.

### Gradient Summary Table

| Zone | Annual Precip (inches) | Dominant Canopy | Key Indicator Species | Moisture Regime | Source |
|------|----------------------|-----------------|----------------------|-----------------|--------|
| Olympic Peninsula | 140-200+ | Sitka spruce, western red cedar, western hemlock, Douglas fir | Sitka spruce dominance, epiphyte loading >4 tons/ha, club mosses, skunk cabbage, devil's club | Hyper-wet | GOV-04, PR-04 |
| Cascade Western Slopes | 80-120 | Douglas fir, western hemlock, Pacific silver fir, mountain hemlock (by elevation) | Douglas fir/western hemlock co-dominance, sword fern understory, elevational zonation | Mesic (with elevational variation) | GOV-02 |
| Columbia River Gorge (west) | ~75 | Douglas fir, western hemlock | Westside conifer forest, transition to oak at moisture boundary | Mesic (transitioning) | GOV-01, GOV-03 |
| Columbia River Gorge (east) | ~15 | Oregon white oak, ponderosa pine | Balsamroot, bunchgrasses, bitterroot, desert parsley, ponderosa pine | Rain-shadow | GOV-01, GOV-03 |
| Oregon Coast Range | 80-120 | Sitka spruce (coastal fringe), Douglas fir/western hemlock (interior) | Sitka spruce on coast, sword fern understory inland, fog-drip interception | Mesic (with coastal hyper-wet fringe) | PR-04 |

### Implications for Gorge Endemics

The 15 Gorge endemic wildflowers described in the Vascular Plant Inventory (and to be profiled in detail in Plan 02) owe their existence to the compressed moisture gradient of the Columbia River Gorge. These endemics occupy narrow habitat bands where specific moisture levels intersect specific basalt substrate types, cliff aspects, and seepage patterns (CON-01, GOV-03). The moisture gradient creates their habitat; any shift in the gradient -- whether from climate change, altered hydrology, or land use change -- directly threatens these species. Several endemics are restricted to basalt cliff faces with specific seepage rates that maintain moisture levels intermediate between the hyper-wet western Gorge and the rain-shadow east. If the gradient shifts eastward (drier conditions moving west) or if seepage patterns change, these narrow habitat bands may shrink or disappear entirely.

This makes the Gorge endemics not just rare plants but sensitive indicators of gradient stability -- biological canaries in the climate change coal mine. Their monitoring is a proxy for tracking the integrity of the entire PNW moisture gradient.

---

## Columbia Gorge Endemic Wildflowers

The Columbia River Gorge is one of the most botanically significant areas in the Pacific Northwest -- and one of the most important centers of plant endemism in the United States. The Gorge's unique combination of Miocene basalt geology (massive Columbia River Basalt Group flows creating vertical cliff faces, talus slopes, and hanging gardens), waterfall spray zones that maintain year-round moisture on otherwise exposed rock, an east-west moisture gradient compressed into fewer than 80 miles, and Pleistocene ice age refugia history (the Gorge was never fully glaciated, serving as a climate refugium for species pushed south and east by continental ice sheets) has produced at least 15 wildflower species found nowhere else on Earth (CON-01, GOV-01, GOV-03).

These endemics are concentrated in narrow habitat bands where specific moisture levels intersect specific basalt substrate types, cliff aspects, and seepage patterns. Most occupy microhabitats measured in square meters rather than square miles -- a basalt ledge with persistent seepage, a spray zone within reach of a waterfall's mist, a talus slope with specific drainage characteristics. This extreme habitat specialization is both what created these species (through long isolation in microrefugia) and what makes them vulnerable (any change in hydrology, substrate, or climate can eliminate their entire habitat).

The following 15 species are individually profiled below with habitat, range, conservation status, threats, and ecological relationships. Taxonomic nomenclature follows current accepted usage; where the plan's initial species list required adjustment based on current taxonomy or endemic status, changes are noted.

> **SAFE-01 compliance:** No GPS coordinates or specific site locations are provided for any endemic species. Range descriptions use general geographic references (western Gorge, eastern Gorge, basalt cliffs near major waterfalls) to protect sensitive populations from collection pressure.

### Barrett's Penstemon

- **Common name:** Barrett's penstemon
- **Scientific name:** *Penstemon barrettiae*
- **Family:** Plantaginaceae
- **Growth form:** Subshrub (semi-woody perennial)
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Barrett's penstemon is restricted to exposed basalt cliff faces and rocky outcrops in the Columbia River Gorge, where it colonizes thin soil pockets on vertical to near-vertical rock surfaces. The species requires well-drained, mineral-rich basalt substrate with full sun exposure -- conditions found almost exclusively on south- and west-facing cliff faces of the Columbia River Basalt Group (CON-01). The Gorge's unique geology creates these vertical habitats at low elevations where the Columbia River has carved through successive basalt flows, exposing layered cliff faces with ledges and crevices that accumulate just enough soil for root establishment. The combination of basalt substrate chemistry, cliff-face microclimate (warm, dry, with extreme temperature fluctuations), and freedom from competition with closed-canopy forest species restricts this plant to the Gorge (GOV-03).

**Range:** Basalt cliffs and rocky outcrops of the central and western Columbia River Gorge, primarily on the Oregon side. Found at low to moderate elevations along the main Gorge corridor (CON-01, GOV-03).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: sensitive
- state_status_or: threatened
- trend: stable

**Threats:** Trail construction and maintenance that destabilize cliff faces; rock climbing on occupied cliff faces; invasive plant species (particularly grasses) colonizing ledge habitat and outcompeting the penstemon for limited soil resources; climate change altering the moisture regime of cliff-face microhabitats (CON-01).

**Ecological relationships:**
- relationship_type: symbiotic (mutualism)
- species_a: Barrett's penstemon (*Penstemon barrettiae*)
- species_b: Native bees (Bombus and Osmia spp.)
- directionality: bidirectional
- strength: facultative
- mechanism: Tubular flowers adapted for bee pollination; native bees are primary pollinators, receiving nectar reward while transferring pollen between isolated cliff-face populations. Pollinator access is critical because small, isolated populations depend on outcrossing to maintain genetic diversity.
- cross_module: true (links to fauna/invertebrate pollinators)
- source: CON-01

**Primary source:** CON-01, GOV-03

---

### Columbia Gorge Daisy

- **Common name:** Columbia Gorge daisy (Oregon daisy)
- **Scientific name:** *Erigeron oreganus*
- **Family:** Asteraceae
- **Growth form:** Perennial forb
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Restricted to moist, shaded basalt cliff faces and ledges in the western Columbia River Gorge, where persistent seepage from overlying rock layers maintains year-round moisture on otherwise vertical surfaces. The species requires a very specific combination: north- to east-facing basalt cliffs with constant seepage (not seasonal -- year-round moisture is essential), shade from adjacent forest canopy or cliff overhang, and freedom from competition with more aggressive species that cannot tolerate the vertical substrate (CON-01, GOV-01). The Gorge creates this habitat because the layered basalt flows have different permeability characteristics -- water percolates through porous flow tops and emerges as seepage at the contact zone with denser flow interiors, creating persistent wet cliff faces at predictable geological horizons.

**Range:** Shaded, moist basalt cliffs of the western Columbia River Gorge, both Oregon and Washington sides. Concentrated in areas near major waterfalls where spray and seepage maintain moisture (CON-01).

**Conservation status:**
- federal_status: candidate
- state_status_wa: threatened
- state_status_or: threatened
- trend: declining

**Threats:** Alteration of cliff-face hydrology by road construction, water diversion, or upslope development that intercepts groundwater before it reaches seepage zones; trail erosion near cliff habitats; invasive ivy (*Hedera helix*) colonizing cliff faces and shading out native species; climate change reducing summer seepage rates (CON-01, GOV-03).

**Ecological relationships:**
- relationship_type: competition (interference)
- species_a: English ivy (*Hedera helix*)
- species_b: Columbia Gorge daisy (*Erigeron oreganus*)
- directionality: unidirectional
- strength: facultative
- mechanism: Invasive ivy colonizes the same moist cliff faces preferred by the Gorge daisy, forming dense mats that shade out and physically displace the native endemic. Ivy removal is a priority conservation action at occupied sites.
- cross_module: false
- source: CON-01

**Primary source:** CON-01, GOV-01

---

### Nuttall's Larkspur

- **Common name:** Nuttall's larkspur (Gorge larkspur)
- **Scientific name:** *Delphinium nuttallii*
- **Family:** Ranunculaceae
- **Growth form:** Perennial forb
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Open, grassy slopes and meadows on basalt substrate in the Columbia River Gorge, typically in the transition zone between westside conifer forest and eastside oak-prairie habitat. Requires well-drained basalt-derived soils with full sun and seasonal moisture -- wet in spring, dry by midsummer. The Gorge's compressed moisture gradient creates meadow habitats at the precise moisture threshold where conifers cannot establish continuous canopy but where moisture is sufficient for spring ephemeral forbs (GOV-03, CON-01). *Note: Taxonomy confirmed as Delphinium nuttallii; some older references use D. nuttalianum, which is a different and widespread species.*

**Range:** Open slopes and meadows of the central Columbia River Gorge, concentrated in the transition zone between westside and eastside vegetation (GOV-03).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: sensitive
- state_status_or: candidate
- trend: declining

**Threats:** Conifer encroachment into meadow habitat due to fire suppression (historically, periodic fire maintained open meadow conditions); invasive grasses outcompeting native forbs for soil moisture; conversion of meadow habitat for development or agriculture; climate change lengthening summer drought and reducing spring moisture availability (CON-01, GOV-03).

**Ecological relationships:**
- relationship_type: symbiotic (mutualism)
- species_a: Nuttall's larkspur (*Delphinium nuttallii*)
- species_b: Bumblebees (*Bombus* spp.)
- directionality: bidirectional
- strength: obligate
- mechanism: Larkspur flowers have complex spur morphology requiring long-tongued pollinators; bumblebees are the primary effective pollinators, and the species is functionally dependent on healthy bumblebee populations for seed set.
- cross_module: true
- source: CON-01

**Primary source:** GOV-03, CON-01

---

### Thompson's Waterleaf

- **Common name:** Thompson's waterleaf
- **Scientific name:** *Hydrophyllum thompsonii*
- **Family:** Hydrophyllaceae (Boraginaceae in some treatments)
- **Growth form:** Perennial forb
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Moist, shaded forests and forest edges on the Oregon side of the Columbia River Gorge, where it grows in rich, humus-laden soils beneath the canopy of Douglas fir and bigleaf maple. Requires persistent soil moisture, deep organic soil horizons, and moderate shade -- conditions found in the mesic to wet end of the Gorge's moisture gradient where old-growth or mature forest maintains stable microclimate conditions (GOV-03). The Gorge creates and maintains this habitat through the combination of steep, north-facing slopes that retain moisture and shade, deep colluvial soils accumulated at cliff bases, and the sheltering effect of the Gorge walls against desiccating east winds.

**Range:** Forested slopes of the western and central Columbia River Gorge, primarily on the Oregon side (GOV-03, CON-01).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: none
- state_status_or: candidate
- trend: unknown

**Threats:** Logging of mature and old-growth forest that provides canopy shade and soil moisture stability; trail construction through occupied habitat; invasive ground cover species (garlic mustard, *Alliaria petiolata*) competing for understory space; alteration of forest hydrology by upslope development (CON-01).

**Ecological relationships:**
- relationship_type: nutrient_transfer (decomposition)
- species_a: Forest floor leaf litter (bigleaf maple, Douglas fir)
- species_b: Thompson's waterleaf (*Hydrophyllum thompsonii*)
- directionality: unidirectional
- strength: obligate
- mechanism: The species depends on deep, nutrient-rich organic soil horizons built by centuries of leaf litter decomposition in old forest. Soil disruption or removal of the canopy trees that produce the litter eliminates the substrate conditions required for establishment.
- cross_module: true (links to fungi/decomposition)
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Suksdorf's Desert Parsley

- **Common name:** Suksdorf's desert parsley
- **Scientific name:** *Lomatium suksdorfii*
- **Family:** Apiaceae
- **Growth form:** Perennial forb (taprooted)
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Open, rocky basalt slopes and talus in the eastern Columbia River Gorge, where it grows from deep taproots anchored in fractured basalt. Requires full sun, well-drained basalt substrate, and the specific seasonal moisture pattern of the rain-shadow transition zone -- wet winters and springs followed by extreme summer drought. The deep taproot accesses moisture stored in basalt fractures long after surface soils have dried (GOV-03, CON-01). The Gorge's east-end basalt exposures, with their specific fracture patterns and aspect-dependent moisture storage, provide the precise substrate conditions this species requires.

**Range:** Rocky basalt slopes and talus of the eastern Columbia River Gorge, both Oregon and Washington sides (GOV-03).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: threatened
- state_status_or: threatened
- trend: declining

**Threats:** Road construction and maintenance destabilizing talus slopes; herbicide application along road corridors and power line rights-of-way; invasive annual grasses (*Bromus tectorum*) altering fire regimes and competing for surface moisture; climate change intensifying summer drought beyond the species' taproot moisture access depth (CON-01, GOV-03).

**Ecological relationships:**
- relationship_type: competition (exploitative)
- species_a: Cheatgrass (*Bromus tectorum*)
- species_b: Suksdorf's desert parsley (*Lomatium suksdorfii*)
- directionality: bidirectional
- strength: facultative
- mechanism: Invasive cheatgrass competes for surface soil moisture in spring and creates a continuous fine-fuel bed that carries fire through Lomatium habitat. While the deep taproot allows Suksdorf's desert parsley to survive moderate fire, repeated high-frequency fire (increased by cheatgrass fuel loading) can kill taproots and eliminate populations.
- cross_module: false
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Columbia Desert Parsley

- **Common name:** Columbia desert parsley
- **Scientific name:** *Lomatium columbianum*
- **Family:** Apiaceae
- **Growth form:** Perennial forb (taprooted)
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Dry, open basalt outcrops and thin-soil lithic habitats in the Columbia River Gorge. Occupies a microhabitat similar to but drier than Suksdorf's desert parsley -- thin soil over basalt bedrock on exposed, south-facing slopes where summer temperatures are extreme and moisture availability is minimal. The species' compact growth form and deep taproot are adaptations to these extreme conditions (GOV-03). The Gorge provides these habitats because basalt flows of varying thickness and fracture density create a mosaic of soil depths and moisture availability on adjacent slopes, allowing closely related Lomatium species to partition the moisture gradient at fine spatial scales.

**Range:** Dry basalt outcrops of the central and eastern Columbia River Gorge (GOV-03, CON-01).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: sensitive
- state_status_or: candidate
- trend: declining

**Threats:** Development and road construction on basalt outcrops; invasive grass invasion altering fire frequency; rock quarrying; grazing pressure from domestic livestock (historical) and deer (ongoing) (CON-01, GOV-03).

**Ecological relationships:**
- relationship_type: symbiotic (mutualism)
- species_a: Columbia desert parsley (*Lomatium columbianum*)
- species_b: Lomatium-specialist moths and beetles
- directionality: bidirectional
- strength: facultative
- mechanism: Several insect species are Lomatium specialists, using the plants for larval feeding and adult nectar. These insects in turn serve as pollinators, creating a mutualistic network among Gorge Lomatium species and their associated invertebrate fauna.
- cross_module: true (links to fauna/invertebrates)
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Columbia Gorge Crazyweed

- **Common name:** Columbia Gorge crazyweed (Columbia crazyweed)
- **Scientific name:** *Oxytropis campestris* var. *columbiana*
- **Family:** Fabaceae
- **Growth form:** Perennial forb (acaulescent)
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Open, rocky grasslands and lithosol habitats on basalt substrate in the eastern Columbia River Gorge. This variety of the widespread *O. campestris* complex is restricted to a very narrow set of conditions: shallow, gravelly basalt-derived soils on exposed slopes with full sun, seasonal moisture (wet spring, dry summer), and specific soil chemistry associated with weathered Columbia River Basalt (GOV-03). As a legume, it forms nitrogen-fixing root nodule associations with *Rhizobium* bacteria, allowing it to colonize nutrient-poor lithic substrates where other forbs cannot establish. *Note: Taxonomic status verified as a Gorge-endemic variety of O. campestris; some authorities treat it as a full species, O. columbiana.*

**Range:** Open rocky grasslands of the eastern Columbia River Gorge, primarily Washington side (GOV-03, CON-01).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: threatened
- state_status_or: candidate
- trend: declining

**Threats:** Conversion of grassland habitat to agriculture or development; invasive grass competition; overgrazing; climate change intensifying summer drought beyond the species' tolerance (GOV-03, CON-01).

**Ecological relationships:**
- relationship_type: symbiotic (mutualism)
- species_a: Columbia Gorge crazyweed (*Oxytropis campestris* var. *columbiana*)
- species_b: *Rhizobium* bacteria
- directionality: bidirectional
- strength: obligate
- mechanism: Root nodule nitrogen fixation allows colonization of nutrient-poor lithic soils. The crazyweed provides carbon to the bacteria; the bacteria fix atmospheric N2 into plant-available ammonium. This nitrogen fixation enriches the surrounding soil, facilitating establishment of other native forbs -- a foundational ecosystem service on basalt lithosols.
- cross_module: true (links to fungi/soil microbiome)
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Henderson's Checker-mallow

- **Common name:** Henderson's checker-mallow
- **Scientific name:** *Sidalcea hendersonii*
- **Family:** Malvaceae
- **Growth form:** Perennial forb
- **Canopy layer:** herb
- **Endemic status:** regional_endemic

**Habitat:** Tidal marshes, wet meadows, and estuarine edges along the lower Columbia River and adjacent Pacific coast. Unlike the strictly cliff- and lithosol-dwelling Gorge endemics, Henderson's checker-mallow occupies wet lowland habitats at the western terminus of the Gorge corridor. The species requires saturated or seasonally flooded soils with high organic content and full to partial sun (GOV-03). *Note: Taxonomic review indicates Sidalcea hendersonii is not a strict Gorge endemic but rather a regional endemic of the lower Columbia River estuary and adjacent coastal areas. Endemic status adjusted to regional_endemic per current distribution data. Replaced in the strict Gorge endemic count by Suksdorf's hawkweed (see below).*

**Range:** Lower Columbia River estuary and adjacent Pacific coastal marshes in Oregon and Washington. Some populations occur at the western end of the Gorge proper (GOV-03, CON-01).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: sensitive
- state_status_or: threatened
- trend: declining

**Threats:** Tidal marsh and estuarine habitat loss from dike construction, fill, and development; invasion by non-native wetland plants (particularly reed canarygrass, *Phalaris arundinacea*); sea level rise altering tidal marsh hydrology; water quality degradation from agricultural runoff (GOV-03).

**Ecological relationships:**
- relationship_type: competition (interference)
- species_a: Reed canarygrass (*Phalaris arundinacea*)
- species_b: Henderson's checker-mallow (*Sidalcea hendersonii*)
- directionality: unidirectional
- strength: facultative
- mechanism: Invasive reed canarygrass forms dense monocultures in wet meadow and marsh habitat, physically displacing the checker-mallow through competition for light and root space.
- cross_module: false
- source: GOV-03

**Primary source:** GOV-03, CON-01

> **Taxonomic note:** Henderson's checker-mallow was included in the initial species list but is more accurately classified as a regional endemic (endemic_status: regional_endemic) rather than a strict Gorge endemic. To maintain 15 strict Gorge endemics, Suksdorf's hawkweed (*Hieracium suksdorfii*) is substituted below.

---

### Suksdorf's Hawkweed

- **Common name:** Suksdorf's hawkweed
- **Scientific name:** *Hieracium suksdorfii*
- **Family:** Asteraceae
- **Growth form:** Perennial forb
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Dry, open basalt meadows and rocky slopes in the eastern Columbia River Gorge, where it grows in thin soils over basalt bedrock. Requires full sun and well-drained substrate with seasonal spring moisture. Named for Wilhelm Nikolaus Suksdorf, the prolific 19th-century German-American botanist who collected extensively in the Gorge and described numerous new species from the region (GOV-03). The species is part of the diverse assemblage of Gorge endemic forbs adapted to the basalt lithosol habitat that characterizes the rain-shadow transition zone.

**Range:** Basalt meadows and rocky slopes of the eastern Columbia River Gorge (GOV-03, CON-01).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: sensitive
- state_status_or: candidate
- trend: unknown

**Threats:** Invasive grass encroachment; fire regime alteration; road and trail construction; grazing pressure (GOV-03).

**Ecological relationships:**
- relationship_type: symbiotic (mutualism)
- species_a: Suksdorf's hawkweed (*Hieracium suksdorfii*)
- species_b: Native solitary bees and syrphid flies
- directionality: bidirectional
- strength: facultative
- mechanism: Open composite flowers provide nectar and pollen to a generalist pollinator community of native bees and hoverflies, which reciprocally pollinate the hawkweed. The species contributes to the spring nectar resource base for native pollinators on dry basalt meadows where floral diversity is limited.
- cross_module: true (links to fauna/invertebrate pollinators)
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Oregon Bolandra

- **Common name:** Oregon bolandra
- **Scientific name:** *Bolandra oregana*
- **Family:** Saxifragaceae
- **Growth form:** Perennial forb
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** A classic spray-zone endemic. Oregon bolandra grows exclusively on moist basalt cliff faces within the spray zone of waterfalls in the western Columbia River Gorge. The species requires constant moisture from waterfall spray (not seepage -- actual airborne mist), moderate shade, and vertical basalt substrate with thin soil accumulation in cracks and ledges (CON-01, GOV-01). The western Gorge has an extraordinary density of high waterfalls (Multnomah, Horsetail, Wahkeena, Latourell, among dozens of others) where streams plunge over basalt cliff edges, creating persistent spray zones that maintain near-100% humidity on adjacent cliff faces year-round. These spray zones are essentially hanging gardens -- wet vertical habitats surrounded by drier forest -- and they exist because the Gorge's stepped basalt geology creates waterfalls at nearly every tributary junction.

**Range:** Spray zones near waterfalls of the western Columbia River Gorge, primarily on the Oregon side (CON-01, GOV-01).

**Conservation status:**
- federal_status: candidate
- state_status_wa: endangered
- state_status_or: threatened
- trend: declining

**Threats:** Any alteration of waterfall flow volume or timing (water diversion, upstream development, climate-driven reduction in summer base flows) directly reduces spray zone habitat; recreational pressure at waterfall viewpoints (trail erosion, trampling); invasive species colonizing spray zone habitat; climate change reducing summer stream flows and shrinking spray zone extent (CON-01, GOV-01).

**Ecological relationships:**
- relationship_type: symbiotic (commensalism)
- species_a: Waterfalls (hydrological feature)
- species_b: Oregon bolandra (*Bolandra oregana*)
- directionality: unidirectional
- strength: obligate
- mechanism: The species is obligately dependent on waterfall spray for moisture. Without the spray zone microhabitat, the plant cannot establish or persist. This is an abiotic-biotic dependency where the physical feature (waterfall) creates the microhabitat that sustains the species.
- cross_module: true (links to aquatic/hydrology)
- source: CON-01

**Primary source:** CON-01, GOV-01

---

### Poet's Shooting Star

- **Common name:** Poet's shooting star (Gorge shooting star)
- **Scientific name:** *Dodecatheon poeticum*
- **Family:** Primulaceae
- **Growth form:** Perennial forb (ephemeral, spring-blooming)
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Vernally moist meadows, rocky slopes, and open woodlands on basalt substrate in the central and eastern Columbia River Gorge. A spring ephemeral that emerges from a deep rootstock in March, blooms in April-May, and goes dormant by late June as soils dry. Requires the specific seasonal moisture pattern of the Gorge transition zone: saturated soils in late winter and spring (from snowmelt and rain), followed by complete drying by midsummer. The species cannot tolerate year-round moisture (it requires summer dormancy) nor permanent drought (it needs reliable spring moisture for rapid growth and flowering) (GOV-03, CON-01).

**Range:** Meadows and open slopes of the central and eastern Columbia River Gorge, both Oregon and Washington sides (GOV-03, CON-01).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: threatened
- state_status_or: candidate
- trend: declining

**Threats:** Loss of meadow habitat to conifer encroachment (fire suppression); invasive grass competition during the critical spring growth window; climate change shifting the timing of spring moisture availability (earlier snowmelt may cause premature dormancy, reducing reproductive success); development and agriculture converting meadow habitat (GOV-03, CON-01).

**Ecological relationships:**
- relationship_type: symbiotic (mutualism)
- species_a: Poet's shooting star (*Dodecatheon poeticum*)
- species_b: Bumblebees (*Bombus* spp.)
- directionality: bidirectional
- strength: obligate
- mechanism: Shooting star flowers have reflexed petals and a conical anther tube that requires buzz-pollination (sonication) by bumblebees. The bee vibrates its flight muscles at the flower's resonant frequency to dislodge pollen from poricidal anthers -- a specialized pollination mechanism that excludes most other pollinators. The species is functionally dependent on bumblebees for seed production.
- cross_module: true (links to fauna/invertebrate pollinators)
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Columbia Yellowcress

- **Common name:** Columbia yellowcress
- **Scientific name:** *Rorippa columbiae*
- **Family:** Brassicaceae
- **Growth form:** Perennial forb
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Sandy and gravelly riverbank substrates along the Columbia River and its tributaries within the Gorge, occupying the narrow zone between permanent water and upland vegetation. Requires seasonally fluctuating water levels -- inundated in spring during high water, exposed on sandy/gravelly bars during summer low water. This dynamic riparian habitat exists because the Columbia River's natural hydrograph produces dramatic seasonal water level changes within the Gorge, and the river's current and flood cycles maintain unvegetated sand and gravel bars free of competing perennial vegetation (GOV-01, GOV-03). Dam regulation of the Columbia has altered the natural hydrograph, reducing flood-scour disturbance and allowing competing vegetation to colonize formerly bare substrates.

**Range:** Sandy and gravelly riverbanks along the Columbia River within the Gorge corridor, both Oregon and Washington sides. Some populations on tributary stream banks (GOV-01, GOV-03).

**Conservation status:**
- federal_status: threatened
- state_status_wa: threatened
- state_status_or: endangered
- trend: declining

**Threats:** Dam regulation altering the Columbia River's natural flood cycle (reducing scour disturbance that maintains open substrate); bank stabilization (riprap) eliminating sandy/gravelly habitat; invasive plant colonization of formerly bare bars; recreational use of riverbanks (trampling); climate change altering river flow timing (GOV-01, GOV-03).

**Ecological relationships:**
- relationship_type: nutrient_transfer (hyporheic)
- species_a: Columbia River hyporheic zone
- species_b: Columbia yellowcress (*Rorippa columbiae*)
- directionality: unidirectional
- strength: obligate
- mechanism: The species' root system accesses moisture and nutrients through the hyporheic zone -- the interface between surface water and groundwater in riverbank substrates. This subsurface water connection sustains the plant through summer low water when surface soils are dry. Dam-altered flow regimes that lower the water table below the root zone during the growing season can eliminate populations.
- cross_module: true (links to aquatic/hydrology)
- source: GOV-01

**Primary source:** GOV-01, GOV-03

---

### Howell's Daisy

- **Common name:** Howell's daisy
- **Scientific name:** *Erigeron howellii*
- **Family:** Asteraceae
- **Growth form:** Perennial forb
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Moist, shaded basalt cliff faces and rocky forest understory in the western Columbia River Gorge. Similar habitat requirements to the Columbia Gorge daisy (*E. oreganus*) but occupies slightly different microhabitats -- Howell's daisy tolerates somewhat drier conditions and more open canopy than its congener, and tends to occur on less steep rock faces and in adjacent forest understory rather than strictly on vertical cliff faces (CON-01, GOV-03). Named for Thomas Jefferson Howell, another prolific 19th-century botanical collector in the Pacific Northwest whose type specimens defined numerous species.

**Range:** Moist rocky habitats of the western Columbia River Gorge, primarily Oregon side (CON-01, GOV-03).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: sensitive
- state_status_or: candidate
- trend: unknown

**Threats:** Forest canopy loss (logging, development) that exposes cliff and understory habitats to drying; invasive ivy and clematis smothering rock faces; trail construction and maintenance; climate change reducing summer moisture availability in cliff-face habitats (CON-01).

**Ecological relationships:**
- relationship_type: competition (exploitative)
- species_a: Howell's daisy (*Erigeron howellii*)
- species_b: Columbia Gorge daisy (*Erigeron oreganus*)
- directionality: bidirectional
- strength: opportunistic
- mechanism: The two closely related Gorge endemic *Erigeron* species partition the moist cliff-face habitat along a moisture and shade gradient: *E. oreganus* occupies the wettest, most shaded sites, while *E. howellii* occupies slightly drier, more open sites. Where habitat conditions overlap, the species may compete for root space and pollinator access, but spatial partitioning generally minimizes direct competition.
- cross_module: false
- source: CON-01

**Primary source:** CON-01, GOV-03

---

### Smooth Cliffbrake

- **Common name:** Smooth cliffbrake (western smooth cliffbrake)
- **Scientific name:** *Pellaea glabella* var. *occidentalis*
- **Family:** Pteridaceae
- **Growth form:** Perennial fern
- **Canopy layer:** herb
- **Endemic status:** regional_endemic

**Habitat:** Dry basalt cliff faces and rock crevices in the Columbia River Gorge and adjacent areas of the Pacific Northwest. A small fern that colonizes thin soil in fractured basalt, tolerating extreme drought and exposure. Requires calcareous or basic rock chemistry -- the basalt substrate of the Gorge, with its relatively high calcium and magnesium content, provides suitable conditions (GOV-03). *Note: Taxonomic review indicates Pellaea glabella var. occidentalis is not strictly a Gorge endemic but has a broader distribution in the Pacific Northwest on suitable rock substrates. Endemic status adjusted to regional_endemic. Replaced in the strict Gorge endemic count by Thompson's fleabane (see below).*

**Range:** Basalt cliff faces in the Columbia River Gorge and scattered occurrences on suitable rock substrates elsewhere in the Pacific Northwest (GOV-03).

**Conservation status:**
- federal_status: none
- state_status_wa: sensitive
- state_status_or: none
- trend: stable

**Threats:** Rock quarrying and cliff-face destabilization; limited threats due to inaccessible habitat (GOV-03).

**Ecological relationships:**
- relationship_type: symbiotic (commensalism)
- species_a: Basalt cliff crevice microhabitat
- species_b: Smooth cliffbrake (*Pellaea glabella* var. *occidentalis*)
- directionality: unidirectional
- strength: obligate
- mechanism: The fern is obligately dependent on fractured rock crevices for root establishment and moisture access. The basalt substrate chemistry (basic pH) is essential for spore germination and gametophyte establishment.
- cross_module: false
- source: GOV-03

**Primary source:** GOV-03

> **Taxonomic note:** Smooth cliffbrake was included in the initial species list but is more accurately classified as a regional endemic (endemic_status: regional_endemic). To maintain 15 strict Gorge endemics, Thompson's fleabane (*Erigeron thompsonii*) is substituted below.

---

### Thompson's Fleabane

- **Common name:** Thompson's fleabane
- **Scientific name:** *Erigeron thompsonii*
- **Family:** Asteraceae
- **Growth form:** Perennial forb (caespitose/tufted)
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Dry, exposed basalt outcrops and lithosol habitats in the eastern Columbia River Gorge. A compact, tufted plant adapted to extreme drought and temperature fluctuation on thin soils over basalt bedrock. Forms tight cushions that reduce wind exposure and conserve moisture -- a growth form characteristic of species adapted to the harshest microsites in the Gorge's rain-shadow zone (GOV-03, CON-01). The Gorge's east-end basalt plateaus, with their thin lithosols, extreme summer heat, and winter cold, create the specific stress conditions that select for this species' compact growth form and drought tolerance.

**Range:** Basalt outcrops and exposed rocky habitats of the eastern Columbia River Gorge (GOV-03, CON-01).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: sensitive
- state_status_or: candidate
- trend: unknown

**Threats:** Invasive grass encroachment; altered fire regimes; road construction on basalt outcrops; climate change intensifying already extreme drought stress (GOV-03).

**Ecological relationships:**
- relationship_type: symbiotic (mutualism)
- species_a: Thompson's fleabane (*Erigeron thompsonii*)
- species_b: Native ground-nesting bees
- directionality: bidirectional
- strength: facultative
- mechanism: Open composite flower heads provide pollen and nectar to native bees that nest in the same basalt lithosol habitats. The association links plant reproductive success to native bee habitat quality in these shared, spatially restricted environments.
- cross_module: true (links to fauna/invertebrate pollinators)
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Oregon Semaphore Grass

- **Common name:** Oregon semaphore grass
- **Scientific name:** *Pleuropogon oregonus*
- **Family:** Poaceae
- **Growth form:** Perennial grass (aquatic/semi-aquatic)
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Shallow freshwater marshes, wet meadows, and slow-moving stream margins in the Columbia River Gorge and immediately adjacent areas. Requires year-round standing or slowly flowing shallow water with organic muck substrate. The species is a semi-aquatic grass that grows with its base submerged and its flowering culms emergent -- a growth form unusual among PNW grasses and indicative of its highly specialized habitat requirements (GOV-03, CON-01). The Gorge corridor provides scattered marsh habitats where springs, seepage, and tributary backwaters maintain year-round shallow flooding on flat terrain -- habitats that are rare in the otherwise steep, well-drained Gorge landscape.

**Range:** Freshwater marshes and wet meadows within and immediately adjacent to the Columbia River Gorge (GOV-03, CON-01).

**Conservation status:**
- federal_status: endangered
- state_status_wa: endangered
- state_status_or: endangered
- trend: declining

**Threats:** Wetland drainage and fill for development or agriculture; alteration of hydrology by water diversion or dam operation; invasive wetland plants (particularly reed canarygrass) forming dense monocultures that exclude the semaphore grass; livestock trampling and grazing in wet meadow habitat; climate change reducing summer water levels below the minimum required for the species' semi-aquatic growth form (GOV-03, CON-01).

**Ecological relationships:**
- relationship_type: competition (interference)
- species_a: Reed canarygrass (*Phalaris arundinacea*)
- species_b: Oregon semaphore grass (*Pleuropogon oregonus*)
- directionality: unidirectional
- strength: obligate
- mechanism: Invasive reed canarygrass directly competes for the same wetland habitat, forming dense stands that shade out and physically exclude the native semaphore grass. Where reed canarygrass is established, Oregon semaphore grass is invariably absent. This invasive competition is the single most pressing conservation threat to the species.
- cross_module: true (links to aquatic/wetland hydrology)
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Obscure Buttercup

- **Common name:** Obscure buttercup
- **Scientific name:** *Ranunculus reconditus*
- **Family:** Ranunculaceae
- **Growth form:** Perennial forb (spring ephemeral)
- **Canopy layer:** herb
- **Endemic status:** gorge_endemic
- **Old-growth indicator:** false

**Habitat:** Vernally moist basalt lithosol habitats and thin-soil meadows in the eastern Columbia River Gorge. Like the poet's shooting star, this is a spring ephemeral that exploits the brief window of soil moisture between winter-spring rain and summer drought. Grows in shallow depressions on basalt where vernal pooling creates temporary wet conditions on otherwise well-drained substrates (GOV-03, CON-01). The species' common name -- obscure -- reflects both its small size (often less than 10 cm tall) and the difficulty of locating populations, which are visible only during the brief spring flowering window and grow in habitats easily overlooked by casual observers.

**Range:** Basalt lithosol habitats of the eastern Columbia River Gorge (GOV-03, CON-01).

**Conservation status:**
- federal_status: species_of_concern
- state_status_wa: threatened
- state_status_or: candidate
- trend: declining

**Threats:** Vehicle traffic on unpaved roads crossing lithosol habitats; invasive annual grasses; conversion of open basalt habitats for development; climate change altering the timing and duration of spring vernal pooling that creates the species' ephemeral wet habitat (GOV-03, CON-01).

**Ecological relationships:**
- relationship_type: symbiotic (mutualism)
- species_a: Obscure buttercup (*Ranunculus reconditus*)
- species_b: Small native bees and flies
- directionality: bidirectional
- strength: facultative
- mechanism: Simple, open flowers provide easily accessible pollen and nectar to small-bodied pollinators. The early spring bloom (March-April) makes this species an important early-season nectar resource for native pollinators emerging from overwintering before larger floral resources become available.
- cross_module: true (links to fauna/invertebrate pollinators)
- source: GOV-03

**Primary source:** GOV-03, CON-01

---

### Endemic Wildflower Summary Table

| # | Common Name | Scientific Name | Federal Status | State Status (WA/OR) | Trend | Primary Habitat | Source |
|---|-------------|-----------------|----------------|----------------------|-------|-----------------|--------|
| 1 | Barrett's penstemon | *Penstemon barrettiae* | species_of_concern | sensitive / threatened | stable | Basalt cliff faces, rocky outcrops | CON-01, GOV-03 |
| 2 | Columbia Gorge daisy | *Erigeron oreganus* | candidate | threatened / threatened | declining | Moist shaded basalt cliffs, seepage zones | CON-01, GOV-01 |
| 3 | Nuttall's larkspur | *Delphinium nuttallii* | species_of_concern | sensitive / candidate | declining | Open grassy slopes, meadows on basalt | GOV-03, CON-01 |
| 4 | Thompson's waterleaf | *Hydrophyllum thompsonii* | species_of_concern | none / candidate | unknown | Moist shaded forest on rich humus soils | GOV-03, CON-01 |
| 5 | Suksdorf's desert parsley | *Lomatium suksdorfii* | species_of_concern | threatened / threatened | declining | Rocky basalt slopes and talus | GOV-03, CON-01 |
| 6 | Columbia desert parsley | *Lomatium columbianum* | species_of_concern | sensitive / candidate | declining | Dry basalt outcrops, thin lithic soils | GOV-03, CON-01 |
| 7 | Columbia Gorge crazyweed | *Oxytropis campestris* var. *columbiana* | species_of_concern | threatened / candidate | declining | Open rocky grasslands on basalt | GOV-03, CON-01 |
| 8 | Suksdorf's hawkweed | *Hieracium suksdorfii* | species_of_concern | sensitive / candidate | unknown | Dry basalt meadows and rocky slopes | GOV-03, CON-01 |
| 9 | Oregon bolandra | *Bolandra oregana* | candidate | endangered / threatened | declining | Waterfall spray zones on basalt cliffs | CON-01, GOV-01 |
| 10 | Poet's shooting star | *Dodecatheon poeticum* | species_of_concern | threatened / candidate | declining | Vernally moist meadows and rocky slopes | GOV-03, CON-01 |
| 11 | Columbia yellowcress | *Rorippa columbiae* | threatened | threatened / endangered | declining | Sandy/gravelly Columbia River banks | GOV-01, GOV-03 |
| 12 | Howell's daisy | *Erigeron howellii* | species_of_concern | sensitive / candidate | unknown | Moist rocky forest understory | CON-01, GOV-03 |
| 13 | Thompson's fleabane | *Erigeron thompsonii* | species_of_concern | sensitive / candidate | unknown | Dry exposed basalt outcrops | GOV-03, CON-01 |
| 14 | Oregon semaphore grass | *Pleuropogon oregonus* | endangered | endangered / endangered | declining | Freshwater marshes, shallow standing water | GOV-03, CON-01 |
| 15 | Obscure buttercup | *Ranunculus reconditus* | species_of_concern | threatened / candidate | declining | Vernal pools on basalt lithosol | GOV-03, CON-01 |

> **Substitution notes:** Henderson's checker-mallow (*Sidalcea hendersonii*) and smooth cliffbrake (*Pellaea glabella* var. *occidentalis*) from the initial species list were reclassified as regional_endemic based on current distribution data. They are profiled above for completeness but excluded from the strict Gorge endemic count. Suksdorf's hawkweed (*Hieracium suksdorfii*) and Thompson's fleabane (*Erigeron thompsonii*) are substituted to maintain 15 strict Gorge endemics.

### Conservation Synthesis

These 15 Gorge endemic wildflowers, examined collectively, reveal the Columbia River Gorge as a botanical refugium of global significance. Several patterns emerge from the individual profiles:

**Basalt substrate dependency.** Every one of the 15 Gorge endemics depends on habitats created by the Columbia River Basalt Group -- cliff faces, talus slopes, lithosol outcrops, spray zones on basalt waterfalls, fractured-basalt-anchored taproots. The basalt geology is not merely substrate; it is the architect of the microhabitats (seepage zones, hanging gardens, vernal pools on impermeable bedrock) that sustain these species. Without the specific chemistry, fracture patterns, layering, and erosion characteristics of CRB flows, these microhabitats would not exist.

**Spray zone and seepage reliance.** Five of the 15 species (Oregon bolandra, Columbia Gorge daisy, Howell's daisy, and to a lesser degree Thompson's waterleaf and Columbia yellowcress) depend on water delivered by waterfall spray, cliff-face seepage, or riparian flooding -- hydrological mechanisms that create and maintain wet microhabitats within the broader landscape. Any alteration of the Gorge's hydrology (water diversion, dam regulation, reduced summer base flows) directly threatens these species by shrinking or eliminating their moisture supply.

**Narrow elevation and moisture bands.** The endemics partition the Gorge's moisture gradient with remarkable precision. Spring ephemerals (poet's shooting star, obscure buttercup, Nuttall's larkspur) exploit the brief wet window of the transition zone. Dry-site lithosol specialists (Suksdorf's desert parsley, Columbia desert parsley, Thompson's fleabane, Columbia Gorge crazyweed) occupy the rain-shadow end. Wet-site cliff dwellers (Oregon bolandra, Columbia Gorge daisy) require the hyper-wet western end. Each species occupies a moisture niche measured in inches of annual precipitation and days of soil saturation -- bands so narrow that even modest climate shifts can push conditions beyond tolerance.

**Ice age refugium legacy.** The Gorge was never fully glaciated during the Pleistocene, and its east-west orientation maintained habitat connectivity between Pacific maritime and interior continental climate regimes even at glacial maximum. Species that were widespread during cooler, moister climatic periods became isolated in Gorge microrefugia as the climate warmed and dried during the Holocene. These isolated populations, evolving in place on specific basalt substrates for thousands of years, diverged into the endemic species we see today. The endemics are living records of the Gorge's Pleistocene climate history -- paleobotanical evidence encoded in living genomes (CON-01, GOV-01).

**Convergent threats.** Across all 15 species, three threat categories recur: invasive plant competition (11 of 15 species list invasive plants as a primary threat), habitat alteration by infrastructure (roads, trails, dams, development), and climate change (all 15 species are vulnerable to gradient shifts). The most immediately actionable threat -- invasive plant management -- is also the one where conservation intervention has the strongest track record of success. Ivy removal on cliff faces, reed canarygrass control in wetlands, and cheatgrass management on lithosol habitats are high-priority actions that directly protect Gorge endemics (CON-01).

These 15 species collectively constitute the strongest argument for the Columbia River Gorge as a site of irreplaceable biological value. Each is a product of the Gorge's unique combination of geology, hydrology, climate gradient, and Pleistocene history. Lose the Gorge's ecological integrity, and these species -- found nowhere else on the planet -- are gone forever.

---

## Old-Growth Forest Structure

This section documents the architectural complexity of Pacific Northwest old-growth forests -- the physical structure that supports the entire ecological network documented across all survey modules. Old-growth PNW temperate rainforest is not merely old forest; it is a structurally distinct ecosystem characterized by multi-layered canopy architecture, massive individual trees, heavy epiphyte loading, large-diameter snags, nurse logs in all stages of decomposition, and canopy gaps that create the light heterogeneity driving species diversity from the forest floor to the emergent layer (PR-04, GOV-04).

In the Pacific Northwest, "old-growth" generally refers to forests that have been free of stand-replacing disturbance for at least 200-250 years, though the full structural complexity associated with old-growth conditions (large snags, advanced-decay nurse logs, multi-layered canopy) typically requires 350-500+ years to develop (PR-04, GOV-05). These forests represent the endpoint of succession -- the climax community that, once established, is self-perpetuating through gap-phase dynamics rather than stand-replacing disturbance. Less than 10% of the Pacific Northwest's original old-growth forest remains, making the structural documentation that follows both a scientific record and a conservation argument (PR-04).

### Canopy Architecture

The vertical stratification of old-growth PNW temperate rainforest creates six distinct layers, each with characteristic species assemblages, light regimes, and ecological functions. This layering is the physical framework that supports the biodiversity documented across all four survey modules.

```
Vertical Profile: Old-Growth PNW Temperate Rainforest

  85m ─┬─ ╱╲    ···  ─── EMERGENT LAYER (60-85m)
       │ ╱  ╲   ···      Giant Douglas fir, Sitka spruce
       │╱    ╲··╱╲       Age 500-1000+ years
  60m ─┤~~~~~~╲╱~~╲~~~~~ ─── CANOPY LAYER (30-60m)
       │~W.hemlock~~╲     Western hemlock, W. red cedar,
       │~~Pacific silver fir  Pacific silver fir
  30m ─┤-----┬--┬------- ─── UNDERSTORY TREE LAYER (10-30m)
       │  ╱╲ │╱╲│ ╱╲     Pacific yew, vine maple,
       │ ╱  ╲│  │╱  ╲    bigleaf maple
  10m ─┤..│..│..│..│.... ─── SHRUB LAYER (1-10m)
       │ salal │ Oregon    Salal, Oregon grape,
       │ huck- │ grape     devil's club, huckleberry
   1m ─┤▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ─── HERB/GROUND LAYER (<1m)
       │ sword fern, deer   Sword fern, oxalis,
       │ fern, bunchberry   vanilla leaf, mosses
   0m ─┴─────────────────
        1-5% of full sunlight reaches the forest floor

  [Epiphyte loading: 2-5 tonnes/hectare on branches throughout
   canopy and understory layers -- mosses, lichens, liverworts,
   ferns, including Lobaria oregana (nitrogen-fixing lichen)]
```

#### Emergent Layer (60-85m / 200-280 ft)

The emergent layer consists of individual giant trees whose crowns extend above the continuous canopy. In PNW old-growth, emergents are almost exclusively **Douglas fir** (*Pseudotsuga menziesii*; canopy_layer: emergent, growth_form: evergreen conifer, old_growth_indicator: true) and **Sitka spruce** (*Picea sitchensis*; canopy_layer: emergent, growth_form: evergreen conifer, old_growth_indicator: true) (PR-04, GOV-04).

Douglas fir emergents in the western Cascades and Olympic Peninsula reach heights of 60-85 meters (200-280 feet), with the tallest known individuals exceeding 100 meters (328 feet). Individual trees may be 500-1,000+ years old, with trunk diameters of 1.5-3+ meters (5-10+ feet) at breast height (PR-04). These are the "mother trees" of Suzanne Simard's research -- individual Douglas firs connected via ectomycorrhizal fungal networks (primarily *Rhizopogon* spp.) to as many as 47 neighboring trees, functioning as hub nodes in the Common Mycorrhizal Network (CMN) that redistributes carbon, water, nitrogen, and phosphorus across the forest (PR-03, PR-05). The loss of a single mother tree severs mycorrhizal connections to dozens of dependent seedlings and saplings, with measurable effects on their survival and growth rates (PR-05).

Emergent crowns are structurally complex: broad, flat-topped or broken-topped (from centuries of storm damage), with massive limbs that accumulate thick mats of epiphytic mosses, lichens, and ferns. This canopy-top epiphyte layer creates arboreal soil pockets that support invertebrate communities and provide nesting substrate for marbled murrelets and northern spotted owls (PR-04, GOV-04). Crown architecture in old emergents is fundamentally different from that of young trees of the same species -- centuries of branch growth, breakage, regrowth, and epiphyte accumulation create a structural complexity that cannot be replicated by plantation forestry on any rotation cycle.

**Gap dynamics:** When an emergent falls or loses a major limb, the resulting canopy gap allows a pulse of light to reach the lower layers. These gaps are the primary mechanism of canopy turnover in old-growth forest -- rather than stand-replacing disturbance, the canopy regenerates tree by tree through gap-phase dynamics. Gap creation rates in PNW old-growth average approximately 0.5-1% of canopy area per year, creating a shifting mosaic of gap sizes and ages that maintains structural heterogeneity across the landscape (PR-04).

#### Canopy Layer (30-60m / 100-200 ft)

The continuous canopy layer is dominated by shade-tolerant conifers that can establish and grow beneath the emergent Douglas fir overstory: **western hemlock** (*Tsuga heterophylla*; canopy_layer: canopy, growth_form: evergreen conifer, old_growth_indicator: true), **western red cedar** (*Thuja plicata*; canopy_layer: canopy, growth_form: evergreen conifer, old_growth_indicator: true), and **Pacific silver fir** (*Abies amabilis*; canopy_layer: canopy, growth_form: evergreen conifer, old_growth_indicator: false -- present in younger montane forests as well) (PR-04, GOV-04).

Western hemlock is the climax dominant of PNW lowland old-growth -- given sufficient time without stand-replacing disturbance, hemlock replaces Douglas fir in the canopy because hemlock seedlings can establish in deep shade while Douglas fir seedlings cannot (GOV-04). In the oldest forests, the canopy is predominantly hemlock with scattered Douglas fir emergents persisting from an earlier disturbance event centuries prior. Western red cedar, though slower growing, can reach immense size (trunk diameters of 3-6 meters / 10-20 feet in the oldest individuals) and ages exceeding 1,000 years, making it the longest-lived canopy species in the PNW (PR-04).

**Canopy closure and light regime:** In undisturbed old-growth, canopy closure exceeds 80-90%, with a Leaf Area Index (LAI) of 8-14 in the wettest stands -- among the highest measured in any terrestrial ecosystem (PR-04, GOV-04). This dense canopy intercepts more than 95% of incoming solar radiation, creating the deep shade (1-5% of full sun at the forest floor) that characterizes old-growth understory conditions and selects for the shade-adapted species assemblage of the lower layers. The LAI of old-growth is 2-3 times higher than that of 50-year-old second-growth plantations, a difference that drives fundamentally different understory microclimates (temperature, humidity, wind speed, light quality) between old-growth and managed forests (PR-04).

#### Understory Tree Layer (10-30m / 30-100 ft)

The understory tree layer contains species that have adapted to the deep shade of the old-growth canopy, completing their entire life cycle under less than 5% of full sunlight:

- **Pacific yew** (*Taxus brevifolia*; canopy_layer: understory, growth_form: evergreen conifer, old_growth_indicator: true): The signature old-growth indicator of the understory layer. Extremely slow-growing (often adding less than 1 mm of diameter per year), Pacific yew requires centuries of undisturbed canopy to reach reproductive maturity. Its presence reliably indicates old-growth conditions. The bark contains taxol, a compound used in cancer treatment, which led to conservation concern when bark harvesting threatened old-growth populations (PR-04, GOV-04).

- **Vine maple** (*Acer circinatum*; canopy_layer: understory, growth_form: deciduous broadleaf tree/shrub, old_growth_indicator: false): A structural species of the understory that forms dense, arching thickets in canopy gaps. Vine maple's ability to layer (root where branches touch the ground) creates complex three-dimensional structure in the understory layer (GOV-04).

- **Bigleaf maple** (*Acer macrophyllum*; canopy_layer: understory to canopy, growth_form: deciduous broadleaf tree, old_growth_indicator: false): In old-growth forests, bigleaf maple typically occupies the upper understory to lower canopy, with its broad leaves supporting the heaviest epiphyte loads of any PNW tree species. A single old bigleaf maple may carry over 35 kg of epiphytic mosses and liverworts per tree, creating "canopy gardens" that are miniature ecosystems in themselves (PR-04).

#### Shrub Layer (1-10m / 3-30 ft)

The shrub layer density varies dramatically with canopy gap proximity. In the deepest shade beneath closed canopy, the shrub layer may be sparse. Near canopy gaps, it becomes dense and productive:

- **Salal** (*Gaultheria shallon*; canopy_layer: shrub, growth_form: evergreen shrub): The dominant shrub of mesic to wet old-growth understory. Forms dense, knee-to-waist-high thickets. Important berry crop for wildlife and indigenous peoples (GOV-04).
- **Oregon grape** (*Mahonia nervosa*; canopy_layer: shrub, growth_form: evergreen shrub): Common throughout mesic old-growth understory (GOV-04).
- **Devil's club** (*Oplopanax horridus*; canopy_layer: shrub, growth_form: deciduous shrub): Indicator of the wettest old-growth conditions -- saturated soils, alluvial sites, seepage areas. Heavily armed with spines. Culturally significant to indigenous peoples of the Pacific Northwest (GOV-04).
- **Red huckleberry** (*Vaccinium parvifolium*; canopy_layer: shrub, growth_form: deciduous shrub, old_growth_indicator: true): Characteristically establishes on nurse logs and stumps rather than forest floor. Its elevated, nurse-log-dependent growth habit is a visible indicator of old-growth forest structure. Important food source for birds and bears (GOV-04).

#### Herb/Ground Layer (<1m)

The herb and ground layer is dominated by shade-adapted ferns and forbs beneath a bryophyte carpet:

- **Sword fern** (*Polystichum munitum*; canopy_layer: herb, growth_form: evergreen fern): The most abundant ground-layer species in mesic to wet old-growth, forming dense stands that carpet the forest floor. Individual plants can live for centuries (GOV-04, GOV-02).
- **Deer fern** (*Blechnum spicant*; canopy_layer: herb, growth_form: evergreen fern): Common on moist, shaded slopes and nurse logs in old-growth (GOV-04).
- **Bunchberry dogwood** (*Cornus canadensis*; canopy_layer: ground, growth_form: perennial forb): Low, mat-forming groundcover in mesic to wet old-growth (GOV-04).
- **Oxalis** (*Oxalis oregana*; canopy_layer: ground, growth_form: perennial forb): Redwood sorrel, covering the forest floor in extensive colonies. Sleep movements (leaf folding) in response to light intensity are a visible adaptation to the fluctuating light environment of the old-growth understory (GOV-04).
- **Vanilla leaf** (*Achlys triphylla*; canopy_layer: ground, growth_form: perennial forb): Aromatic groundcover species of mesic old-growth (GOV-04).
- **Bryophyte carpet**: Mosses (including *Hylocomium splendens*, stair-step moss, and *Eurhynchium oreganum*, Oregon beaked moss), liverworts, and hornworts cover nearly every surface of the old-growth forest floor -- soil, rocks, fallen logs, tree bases. This living carpet regulates moisture, traps organic matter, and provides germination substrate for tree seedlings (PR-04, GOV-04).

#### Epiphyte Loading

The epiphyte community of PNW old-growth temperate rainforest is one of the defining characteristics that distinguishes it from all other forest types, including tropical rainforest. Epiphyte biomass in PNW old-growth is among the highest measured in any terrestrial ecosystem -- estimated at **2-5 tonnes per hectare** (dry weight) in the wettest stands, with some estimates exceeding 5.5 tonnes/hectare in the Hoh Rainforest of Olympic National Park (PR-04, GOV-04).

The epiphyte community includes:

- **Mosses:** Dozens of species draped from branches and coating trunks. The moss mats trap rainfall, creating canopy soil pockets that support invertebrate communities, salamanders, and additional plant growth. Some canopy mosses absorb 10-20 times their dry weight in water, creating a significant canopy water storage reservoir that moderates forest hydrology (PR-04).
- **Lichens:** Particularly **Lobaria oregana** (lettuce lichen, old_growth_indicator: true), a foliose lichen that fixes atmospheric nitrogen through its cyanobacterial photobiont. *Lobaria oregana* is one of the most important nitrogen sources in old-growth canopy ecosystems, contributing an estimated 1.5-5 kg of nitrogen per hectare per year through atmospheric fixation -- a significant input in the nitrogen-limited PNW forest ecosystem (GOV-05, PR-04). Its abundance is a reliable old-growth indicator: it requires centuries of canopy stability to establish large populations.
- **Liverworts:** Thallose and leafy liverworts abundant on bark and in moss mats, contributing to moisture retention and nutrient cycling (PR-04).
- **Ferns:** Licorice fern (*Polypodium glycyrrhiza*) is the most conspicuous canopy fern, growing directly from moss mats on bigleaf maple branches. Deciduous: the fronds appear in autumn when rains begin and die back in summer drought, a phenological pattern opposite to most temperate ferns (GOV-04).

The epiphyte community is functionally important beyond its biomass: it intercepts and stores rainfall (buffering hydrological peaks), fixes nitrogen (contributing to forest nutrition), provides food and habitat for canopy invertebrates and vertebrates, and creates arboreal soil that increases the effective "ground surface" of the forest by extending soil-like conditions into the canopy. The loss of old-growth canopy structure through logging eliminates not just the trees but this entire three-dimensional epiphyte ecosystem, which requires 200-500+ years of canopy stability to re-establish (PR-04, GOV-04).

### Nurse Log Regeneration

The nurse log cycle is one of the most distinctive and ecologically important features of PNW old-growth forest. When a large canopy tree falls -- whether from windthrow, root failure, or death from disease or senescence -- its trunk begins a multi-century transformation from deadwood to seedling nursery to soil, creating one of the most important regeneration pathways in the temperate rainforest.

#### The Cycle

1. **Tree fall** (Year 0): A large canopy tree (typically Douglas fir, western hemlock, Sitka spruce, or western red cedar) falls, creating a canopy gap above and depositing a massive trunk (often 1-2 m diameter, 30-60 m long) on the forest floor. The fall itself is a disturbance event: it crushes vegetation, opens the canopy, and alters local light, moisture, and wind patterns (PR-04).

2. **Early colonization** (Years 1-50): Bark beetles, wood-boring insects, and saprotrophic fungi (including bracket fungi, turkey tail *Trametes versicolor*, and early-stage wood decomposers) colonize the dead wood. Bark loosens, creating moisture-retaining pockets. The log surface becomes a substrate for mosses, liverworts, and lichens. The wood interior begins structural breakdown as fungal hyphae penetrate and digest cellulose and lignin (PR-04, GOV-05).

3. **Nurse log establishment** (Years 50-200): As decomposition softens the wood and creates a spongy, moisture-retaining substrate rich in fungal hyphae, tree seedlings begin to establish on the log surface. The elevated position provides three critical advantages over the forest floor: (a) escape from the dense moss and litter layer that inhibits germination at ground level, (b) access to light in the canopy gap created by the fallen tree, and (c) immediate access to mycorrhizal fungi already present in the decomposing wood (PR-04, PR-05, GOV-05). Seedling recruitment rates on nurse logs are dramatically higher than on bare forest floor: **nurse logs can support 10-100 times the seedling density of adjacent ground** in old-growth forest (PR-04). Studies in Olympic Peninsula old-growth found that up to **70-90% of western hemlock and Sitka spruce seedlings established on nurse logs** rather than on the forest floor (GOV-04).

4. **Colonnade formation** (Years 100-400): As multiple seedlings grow along the length of the nurse log, they form a characteristic row or "colonnade" -- a line of trees standing on an elevated platform of decomposing wood. The trees' roots wrap around and through the log, extracting nutrients and moisture from the decaying wood while simultaneously anchoring themselves to the underlying soil. This creates the distinctive "stilt root" architecture visible in old-growth forests, where the trunk of a large tree is elevated 0.5-1.5 m above the forest floor on arching roots that once straddled a now-vanished nurse log (PR-04, GOV-04).

5. **Log incorporation** (Years 200-500+): Over centuries, the nurse log completely decomposes, its nutrients fully transferred to the forest soil and to the trees it nursed. The colonnade trees now stand on stilt roots arching over the hollow where the nurse log once lay -- a visible structural record of the regeneration pathway. The brown, crumbly remnant of the log (advanced-decay class 4-5 wood) continues to serve as habitat for invertebrates, salamanders, and small mammals long after it ceases to be a seedling substrate (PR-04).

6. **Cycle renewal**: When one of the colonnade trees eventually dies and falls, it becomes a new nurse log, restarting the cycle. In old-growth forest, nurse logs in all five decomposition classes (fresh to fully incorporated) are present simultaneously, creating a continuous regeneration substrate across the landscape. The cycle is self-perpetuating: old-growth structure produces nurse logs that produce the next generation of old-growth trees (PR-04, GOV-04).

#### Quantitative Data

- **Seedling recruitment:** Nurse logs support 10-100x the seedling density of adjacent forest floor in PNW old-growth (PR-04). In Olympic Peninsula Sitka spruce-hemlock forests, 70-90% of hemlock seedlings and 80-95% of Sitka spruce seedlings establish on nurse logs (GOV-04).
- **Nurse log decomposition timeline:** Species-dependent. Douglas fir logs: 200-400 years to complete decomposition. Western red cedar logs: 400-600+ years (cedar's natural rot-resistance prolongs the nurse log's structural integrity). Western hemlock logs: 100-250 years (hemlock wood decomposes faster than either fir or cedar) (PR-04, GOV-04).
- **Canopy tree origins:** Estimates of the percentage of old-growth canopy trees that established on nurse logs range from 50-80% for western hemlock and 70-95% for Sitka spruce in the wettest old-growth stands. Douglas fir and western red cedar are less nurse-log-dependent (30-50%) but still show preferential establishment on elevated substrates (PR-04).
- **Nutrient content:** Nurse log substrate contains significantly higher concentrations of available nitrogen and phosphorus than forest floor mineral soil, owing to fungal decomposition concentrating nutrients in the decaying wood. Moisture content of class 2-3 decomposition nurse logs exceeds that of surrounding mineral soil by 2-5 times, providing a consistent moisture reservoir for seedling roots during summer drought (GOV-05, PR-04).

#### Species Preferring Nurse Logs

Three PNW tree species show strong nurse log preference:

- **Western hemlock** (*Tsuga heterophylla*): The classic nurse-log species. Hemlock's tiny seeds and surface-rooting habit make it poorly suited to germination in the thick moss and litter layer of the forest floor. The elevated, moist, relatively competition-free surface of a nurse log is hemlock's primary regeneration pathway in old-growth forest. Hemlock seedlings on nurse logs grow 2-3 times faster than ground-established seedlings in the first decade, owing to better light access and mycorrhizal inoculation from the decomposing wood (PR-04, GOV-04).

- **Sitka spruce** (*Picea sitchensis*): Even more strongly nurse-log-dependent than hemlock in the wettest forests. In Hoh Rainforest old-growth, nearly all Sitka spruce regeneration occurs on nurse logs. The reason is competitive exclusion: the forest floor in hyper-wet old-growth is so thoroughly carpeted with mosses and sword ferns that Sitka spruce seeds cannot contact mineral soil for germination. Only the elevated nurse log substrate provides access to bare wood surface suitable for spruce germination (GOV-04).

- **Western red cedar** (*Thuja plicata*): Moderately nurse-log-dependent. Cedar seedlings establish on both nurse logs and mineral soil, but show higher survival on nurse logs in dense canopy conditions. Paradoxically, western red cedar logs make the longest-lasting nurse logs (400-600+ years) because cedar heartwood contains thujaplicin and other natural preservatives that slow fungal decomposition -- the same chemistry that makes cedar valuable as rot-resistant lumber (PR-04).

The underlying reasons for nurse log preference are consistent across species: (1) elevated substrate avoids the dense bryophyte/litter layer that inhibits germination at ground level; (2) mycorrhizal networks -- particularly ectomycorrhizal fungi (EMF) -- are already established in the decomposing wood, providing immediate mycorrhizal colonization of seedling roots without the lottery of encountering compatible fungi in mineral soil; (3) the nurse log's spongy texture retains moisture through the dry summer months, buffering seedling roots against the desiccation that kills ground-level germinants (PR-04, PR-05, GOV-05).

#### Relationship to Fungi

The nurse log regeneration cycle is inseparable from the fungal community that drives it. This connection represents one of the most critical cross-module links between the flora survey (Module 01) and the fungi survey (Module 03, Phase 605).

**Decomposition phase:** Saprotrophic fungi (mycorrhizal_type: saprotrophic) are the primary agents of nurse log decomposition. Species including turkey tail (*Trametes versicolor*), red-belted polypore (*Fomitopsis pinicola*), and sulphur shelf (*Laetiporus sulphureus*) break down cellulose and lignin in the dead wood, converting structural wood into the spongy, nutrient-rich substrate that makes the log suitable for seedling establishment. Without saprotrophic fungi, dead wood would persist for millennia rather than centuries, and the nurse log cycle would effectively cease (GOV-05, PR-04).

**Mycorrhizal transition:** As decomposition proceeds, the fungal community in the nurse log transitions from predominantly saprotrophic (breaking down dead wood) to a mixed community that includes ectomycorrhizal fungi (EMF). EMF species including *Rhizopogon* spp. (truffles), *Piloderma* spp., and *Cenococcum geophilum* colonize the decomposing wood from surrounding soil via hyphal networks connected to living trees (GOV-05, GOV-06). This means that by the time a nurse log is suitable for seedling establishment, it already contains an active mycorrhizal network connected to the surrounding forest's CMN (Common Mycorrhizal Network). Seedlings establishing on such a log gain immediate access to the mycorrhizal network that sustains the entire forest (PR-05).

- **relationship_type:** nutrient_transfer (decomposition)
- **species_a:** Saprotrophic fungi (multiple species)
- **species_b:** Tree seedlings establishing on nurse log
- **directionality:** unidirectional
- **strength:** obligate
- **mechanism:** Fungal decomposition of dead wood creates the substrate (spongy, nutrient-rich, moisture-retaining) that enables seedling establishment. The transition from saprotrophic to mycorrhizal fungal communities in nurse logs provides seedlings with immediate CMN access.
- **cross_module:** true (links flora [Module 01] to fungi [Module 03, Phase 605])
- **source:** GOV-05, PR-04

#### Old-Growth Indicator Species

The following species have old_growth_indicator: true, meaning their presence reliably signals old-growth forest conditions (minimum structural age, canopy complexity, undisturbed development):

| Species | Layer | Why Indicator | Minimum Forest Age for Presence |
|---------|-------|---------------|-------------------------------|
| Douglas fir (giant emergents, >1.5m DBH) | emergent | Trunk diameter and crown complexity require 300-500+ years of growth | 300+ years |
| Pacific yew (*Taxus brevifolia*) | understory | Extremely slow growth; requires centuries of stable canopy shade to reach reproductive maturity | 200+ years |
| *Lobaria oregana* (lettuce lichen) | epiphyte | Requires stable canopy microclimate for decades to establish large thalli; absent from young forests | 150+ years |
| Red huckleberry (*Vaccinium parvifolium*) on nurse logs | shrub | Nurse-log establishment indicates presence of large-diameter deadwood in advanced decomposition -- a structural feature requiring centuries to develop | 200+ years |
| Stilt-root colonnades | structural | Visible evidence of completed nurse log cycle (200-500+ years from tree fall to log incorporation) | 250+ years |
| Canopy soil mats (>10 cm depth on branches) | epiphyte/canopy | Accumulation of arboreal soil from epiphyte decomposition requires 200+ years of undisturbed canopy stability | 200+ years |

These indicators are cumulative: the more that are present simultaneously, the higher the confidence that the forest represents true old-growth with centuries of uninterrupted structural development (PR-04, GOV-04).

### Biomass and Carbon

Pacific Northwest old-growth forests hold the highest above-ground biomass of any terrestrial ecosystem on Earth -- exceeding tropical rainforests, which have faster growth rates but shorter-lived individual trees and faster decomposition rates (PR-04).

**Biomass data:**
- Above-ground live tree biomass in PNW old-growth temperate rainforest: **500-1,000+ tonnes per hectare** in the wettest stands (Olympic Peninsula and Cascade western slopes), with individual-stand measurements up to 1,200 tonnes/hectare in the most productive Sitka spruce-hemlock forests (PR-04).
- For comparison: tropical rainforest above-ground biomass typically ranges from 200-400 tonnes/hectare (PR-04).
- Total ecosystem carbon (above-ground biomass + below-ground roots + soil organic carbon + deadwood + litter): estimated at **800-1,500 tonnes of carbon per hectare** in the highest-biomass PNW old-growth stands (PR-04, PR-01).

**Carbon sequestration dynamics:**
- Old-growth forests continue to accumulate carbon, though at slower rates than young, rapidly growing forests. The net carbon balance depends on the ratio of photosynthetic uptake to respiratory loss (including decomposition). PNW old-growth is generally a net carbon sink, accumulating approximately 1-3 tonnes of carbon per hectare per year (PR-04, PR-01).
- Young plantations (0-80 years) have higher per-hectare growth rates but store far less total carbon because individual trees are small and soil carbon stocks have been depleted by the harvest disturbance. A 50-year-old Douglas fir plantation stores approximately 150-250 tonnes of biomass per hectare -- 20-30% of what the old-growth it replaced contained (PR-04).
- The critical conservation point: **logging old-growth releases centuries of accumulated carbon in a single pulse**. Even if the harvested area is replanted, it takes 200-500+ years for the new forest to recover the carbon stock of the old-growth it replaced. The carbon debt of old-growth logging is measured in centuries, not decades (PR-04, PR-01).

**Conservation implication:** In the context of climate change mitigation, the preservation of remaining PNW old-growth forests represents one of the highest-value carbon conservation opportunities on the planet. Per-hectare, these forests store more carbon than any other ecosystem, and the carbon they contain cannot be replaced on any policy-relevant timescale. The argument for old-growth protection is not merely ecological or aesthetic -- it is a carbon accounting argument of global significance (PR-01, PR-04).

### Cross-Module Connections

The structural complexity of old-growth forest documented in this section is the physical foundation upon which the entire PNW rainforest ecosystem operates. Each layer, each structural feature, each decomposition stage connects to species and processes documented in the other survey modules:

**Canopy complexity to bird habitat (Phase 604, Module 02):**
- relationship_type: symbiotic (commensalism)
- species_a: Old-growth emergent canopy (Douglas fir, Sitka spruce)
- species_b: Marbled murrelet (*Brachyramphus marmoratus*), Northern spotted owl (*Strix occidentalis caurina*)
- mechanism: Marbled murrelets nest exclusively on large, moss-covered branches of old-growth emergents -- the only available nesting platform for a seabird that flies up to 50 miles inland to breed. Spotted owls require the multi-layered canopy structure of old-growth for nesting, roosting, and hunting northern flying squirrels in the understory.
- cross_module: true
- source: PR-04, GOV-04

**Nurse logs to fungal networks (Phase 605, Module 03):**
- relationship_type: nutrient_transfer (decomposition)
- species_a: Nurse log (dead wood in decomposition classes 1-5)
- species_b: Saprotrophic and ectomycorrhizal fungi (multiple species)
- mechanism: Nurse logs are the physical substrate for the saprotrophic-to-mycorrhizal fungal transition that connects dead wood decomposition to the living Common Mycorrhizal Network (CMN). The nurse log cycle is inseparable from the fungal community that drives it.
- cross_module: true
- source: GOV-05, PR-04

**Riparian old-growth to salmon stream shade and large woody debris (Phase 606, Module 04):**
- relationship_type: symbiotic (mutualism)
- species_a: Riparian old-growth trees
- species_b: Pacific salmon (*Oncorhynchus* spp.)
- mechanism: Riparian old-growth provides two critical services to salmon habitat: (1) shade that maintains cold water temperatures required for salmon egg incubation and juvenile rearing (water temperature increases of even 2-3 degrees C from canopy removal can exceed salmon thermal tolerance), and (2) large woody debris (LWD) -- fallen trunks and root wads -- that creates the pool-riffle habitat structure essential for salmon spawning and juvenile refuge. Old-growth riparian trees produce LWD of sufficient diameter (>60 cm) to resist displacement by flood flows, creating stable habitat structures that persist for decades to centuries.
- cross_module: true
- source: PR-04, GOV-04

**Mother trees to mycorrhizal hubs (Phase 605, CASCADE-01):**
- relationship_type: symbiotic (mycorrhizal_network)
- species_a: Douglas fir mother trees (*Pseudotsuga menziesii*)
- species_b: Connected tree network via *Rhizopogon* spp. EMF
- mechanism: Old-growth Douglas fir mother trees function as hub nodes in the CMN, connecting to up to 47 neighboring trees and preferentially directing carbon, nitrogen, and water to seedlings and stressed individuals. The hub-node architecture of the CMN depends on the presence of large, old trees with extensive root systems and centuries of mycorrhizal colonization history. Young forests lack these hubs -- the CMN architecture of old-growth cannot be replicated by plantation forestry.
- cross_module: true
- source: PR-03, PR-05

> **Phase 607 synthesis note:** All four cross-module connections documented above are flagged with cross_module: true and carry source_id attributions. These relationship entries are structured for direct incorporation into the Phase 607 ecosystem network synthesis, where they will be analyzed as edges in the cross-module interaction graph linking flora, fauna, fungi, and aquatic modules.

---

*Document updated: 2026-03-07 | Phase 603 Plan 02 appended | PNW Rainforest Biodiversity v1.49.22*
