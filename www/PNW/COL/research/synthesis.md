# Network Synthesis: Ecological Cascades

> **Module 05 of the PNW Rainforest Biodiversity research document (v1.49.22)**
>
> This synthesis integrates all four Wave 1 survey modules -- flora (01), fauna (02), fungi (03), and aquatic (04) -- into a unified ecological network model. It maps cross-module cascades, analyzes climate change threat vectors by taxonomic group, and produces evidence-based conservation recommendations citing interventions already underway.
>
> References shared definitions from `00-shared-schemas.md` for species template fields, relationship schema types, cascade entry schema, and source_id attribution.
> All numerical claims are attributed to sources in the Source Index (GOV-01 through GOV-06, PR-01 through PR-05, CON-01 through CON-05).

---

## Introduction

The four survey modules preceding this synthesis -- flora (Module 01), fauna (Module 02), fungi (Module 03), and aquatic (Module 04) -- together document more than 1,000 species across four study zones of the Pacific Northwest temperate rainforest. Those modules were organized by taxonomic group, each mapping species presence, conservation status, and ecological relationships within its domain. But the ecosystem does not organize itself by survey module. A salmon carcass deposited by a bear on the forest floor feeds invertebrates that are eaten by songbirds, releases nitrogen that is absorbed by fungal hyphae connected to tree roots, and enriches the soil upon which endemic wildflowers establish. The carcass does not know it spans four modules.

This synthesis document transforms the species and relationship data from all four modules into an integrated network model. The goal is not to restate what the surveys documented but to reveal the architecture that emerges when their cross-module relationships are connected into chains. Three formal cascades -- multi-step pathways that propagate effects across module boundaries -- form the structural backbone of the network. A systems model identifies hub nodes and critical edges whose protection or degradation produces disproportionate effects. Climate threat analysis traces how projected warming (4.7-10 degrees F by century's end, GOV-02) propagates through the network, distinguishing direct impacts from cascade-mediated pathways. Conservation recommendations target the network's leverage points rather than individual species in isolation.

The core claim of this synthesis is that the PNW temperate rainforest functions as a single integrated system, not as four separate communities of plants, animals, fungi, and fish. The 48 cross_module relationships documented across the survey modules are the empirical evidence for that claim. The cascades mapped below are its mechanistic demonstration.

The temperate rainforests of the Pacific Northwest represent the highest-biomass terrestrial ecosystem on Earth (PR-04). This biomass is not merely an accumulation of large trees -- it is the material expression of a network operating at full connectivity. The 800+ vascular plant species, 244 fauna species, 200+ EMF fungi per old-growth stand, and 51 fish species documented across these modules do not coexist by coincidence. They are bound together by nutrient flows, mutualistic exchanges, predator-prey dynamics, and shared habitat requirements that produce the emergent property of the old-growth rainforest: a system whose whole-system function exceeds what any individual component could sustain. This synthesis maps that binding architecture.

The four study zones -- Olympic Peninsula, Cascade western slopes, Columbia River Gorge, and Oregon Coast Range -- span a precipitation gradient from over 200 inches per year to fewer than 15 inches (GOV-04, GOV-01). This gradient creates the spatial diversity of habitats upon which species specialization depends, but the cascades documented here demonstrate that the zones are not ecologically separate. Salmon connect the ocean to inland forests across all zones. Mycorrhizal networks connect trees across topographic gradients within each zone. Climate change acts on all zones simultaneously through shared temperature and precipitation trajectories. The network model must therefore treat the study region as a single connected landscape, not as four independent areas.

---

## Section 1: Cross-Module Cascade Inventory (SYNTH-01)

The four survey modules document a combined total of 48 cross_module ecological relationships: 9 from flora, 15 from fauna, 3 from fungi, and 21 from aquatic. These individual connections are important, but their real significance emerges when they are traced as multi-step chains -- cascades that cross module boundaries and propagate effects through the entire ecosystem. A cascade is not a metaphor. It is a documented sequence of mechanistic steps, each supported by field evidence and source attribution, showing that disruption at any node produces measurable downstream consequences at every subsequent node.

This section maps three formal cascades using the cascade entry schema from `00-shared-schemas.md`.

### CASCADE-01: Salmon-Forest Nutrient Cascade

This cascade traces marine-derived nitrogen from the North Pacific Ocean through salmon, through bear predation, through soil decomposition, through mycorrhizal fungi, and into the connected forest network. It is the single most consequential cross-module interaction in the PNW temperate rainforest, spanning all four survey modules and connecting ocean productivity to inland tree growth rates kilometers from any stream.

| cascade_id | CASCADE-01 |
|---|---|
| cascade_name | Salmon-Forest Nutrient Cascade |
| modules_spanned | aquatic, fauna, flora, fungi |
| source | PR-02, PR-03, CON-05 |

| Step | Species A | Relationship Type | Species B | Mechanism |
|------|-----------|-------------------|-----------|-----------|
| 1 | Pacific salmon (*Oncorhynchus* spp.) | nutrient_transfer (marine_derived) | Freshwater stream ecosystem | Salmon accumulate marine N-15 during 1-5 years of ocean feeding, concentrating nitrogen at delta-N-15 values of +10 to +14 per mil in body tissues -- isotopically distinct from terrestrial nitrogen at +0 to +3 per mil. A single adult Chinook transports 15-20 kg of marine-origin biomass upstream via spawning migration (PR-02). |
| 2 | Black bear (*Ursus americanus*) | predator_prey (predation) | Pacific salmon | Bears ferry an estimated 500-700 salmon per season from streams into forest up to 500 meters from stream banks. They preferentially consume brain and roe, leaving 40-60% of carcass biomass -- the portions with highest marine N concentration -- on the forest floor. Additional vectors include bald eagles (up to 1 km from streams), river otters (10-50 m), and gray wolves (up to 500 m) (PR-02, CON-05). |
| 3 | Salmon carcass / bear scat | nutrient_transfer (decomposition) | Forest floor soil | Terrestrial invertebrates (beetles, flies, mites) and soil microorganisms decompose carcass material, releasing marine-derived N, P, and C into the soil nutrient pool. N-15 isotopic analysis confirms that 40-80% of riparian nitrogen in healthy watersheds is marine-origin. Enrichment is detectable within 500 meters of salmon streams and at every trophic level from primary decomposers to insectivorous songbirds (PR-02). |
| 4 | Riparian soil (marine N) | symbiotic (mycorrhizal_network) | EMF fungi and tree roots | Ectomycorrhizal fungi -- particularly *Rhizopogon* species with extensive mycelial mats -- absorb dissolved marine nitrogen from soil microsites that tree roots cannot access directly. The nitrogen moves from soil to fungal hyphae to the Hartig net interface, where it crosses into tree root cortical cells. N-15 isotope tracing has detected marine-derived nitrogen in tree tissues kilometers from salmon streams, a distance only explicable through hyphal network redistribution (PR-02, PR-03). |
| 5 | EMF fungi (*Rhizopogon* spp.) | symbiotic (mycorrhizal_network) | Connected tree network | Fungal hyphae redistribute carbon, water, and marine-derived nutrients between trees through the Common Mycorrhizal Network (CMN). A single old-growth Douglas fir mother tree connects to up to 47 other trees via shared mycorrhizal fungi. The mother tree preferentially directs resources to kin seedlings, creating a hub-node architecture that distributes salmon-derived nutrients far beyond the riparian corridor (PR-03, PR-05). |

**Quantitative evidence for cascade significance:** Dr. John Reynolds' 50-watershed study at Simon Fraser University compared riparian tree growth rates across watersheds with varying salmon abundance. Trees near salmon streams grow up to 3 times faster than equivalent trees along salmon-free streams (PR-02, Dr. John Reynolds SFU). This growth differential is not explained by any other variable -- it is the integrated signal of CASCADE-01 operating across all five steps.

**Cascade running in reverse:** When salmon populations decline (10 of 12 stocks in the study area are listed as threatened or endangered, GOV-01), CASCADE-01 weakens at every step simultaneously. The effects are multiplicative rather than additive: a 50% decline in salmon abundance produces compounding reductions at each trophic transfer. Bear pre-hibernation body mass declines, fewer carcasses reach the forest, decomposer communities lose their primary substrate, EMF networks receive less marine nitrogen to redistribute, and tree growth rates fall. The Columbia River basin, which historically supported an estimated 7-16 million adult salmon returns per year, has experienced declines of 90% or more from pre-European-contact levels (CON-05, PR-02).

### CASCADE-02: Truffle-Mammal-Raptor Cascade

This cascade traces the indirect pathway through which old-growth logging threatens the northern spotted owl via below-ground fungal diversity. It demonstrates that the spotted owl's endangered status is not solely a habitat loss problem -- it is equally a fungi crisis.

| cascade_id | CASCADE-02 |
|---|---|
| cascade_name | Truffle-Mammal-Raptor Cascade |
| modules_spanned | fungi, fauna |
| source | GOV-06 |

| Step | Species A | Relationship Type | Species B | Mechanism |
|------|-----------|-------------------|-----------|-----------|
| 1 | Old-growth EMF community (*Rhizopogon*, *Gautieria*, *Hysterangium*) | symbiotic (mycorrhizal_network) | Old-growth conifers (Douglas fir, western hemlock) | EMF fungi require old-growth root networks and deep organic soils to maintain full species diversity. Truffle diversity is 4 times higher in old-growth stands than in young plantations, reflecting the structural dependence on large-diameter nurse logs, centuries of accumulated organic soil, and hub-node CMN architecture that young forests cannot replicate (GOV-06). |
| 2 | Truffle fruiting bodies | predator_prey (mycophagy) | Northern flying squirrel (*Glaucomys sabrinus*) | Northern flying squirrels depend on truffles for 80-90% of their diet. They locate hypogeous truffles by scent, excavate and consume fruiting bodies, and disperse truffle spores through fecal pellets deposited across the forest floor -- completing a mutualistic loop essential for both species' persistence (GOV-06). |
| 3 | Truffle fruiting bodies | predator_prey (mycophagy) | California red-backed vole (*Myodes californicus*) | Red-backed voles are the second obligate mycophagist in PNW old-growth forests. Their truffle dependency is obligate in old-growth habitats, and their population density correlates directly with truffle diversity and abundance (GOV-06). |
| 4 | Northern flying squirrel + California red-backed vole | predator_prey (predation) | Northern spotted owl (*Strix occidentalis caurina*) | Flying squirrels and red-backed voles are primary prey species for the northern spotted owl in PNW old-growth forests. Spotted owl reproductive success correlates with small mammal prey density. The owl's federally threatened status (3.8% annual population decline in Washington, GOV-01) reflects not only nesting habitat loss but the degradation of the prey web rooted in fungal diversity (GOV-06). |

**Cascade logic:** When old-growth is clearcut, Step 1 breaks -- EMF truffle diversity collapses by 4x (GOV-06). With fewer truffle species fruiting in lower abundance, Steps 2 and 3 degrade -- flying squirrel and vole populations decline due to food scarcity. With reduced prey density, Step 4 degrades -- spotted owl pairs cannot provision chicks adequately, and reproductive success declines. Compounding this cascade, barred owl (*Strix varia*) competition represents a concurrent non-cascade threat to spotted owls, creating additive pressure on an already declining population (GOV-01).

**Recovery timeline:** EMF community composition requires 150-200 years or more to recover after clearcutting (GOV-06). A single rotation of industrial forestry (typically 40-60 years) harvests a forest long before its fungal community has recovered from the previous harvest, producing a progressive loss of below-ground biodiversity invisible from above ground. The successional trajectory documented in the fungi survey traces this recovery: young plantations (0-30 years) support only 20-40 EMF species dominated by generalists like *Thelephora terrestris*; mid-rotation forests (30-80 years) begin to develop *Rhizopogon* and *Russula* populations but lack the hub-node CMN architecture; only old-growth stands (200+ years) support the full 200+ EMF species community with the 4x truffle diversity that sustains CASCADE-02 (GOV-06).

### CASCADE-03: Climate-Gradient-Endemic Cascade

This cascade traces how climate change propagates through the PNW moisture gradient to threaten endemic species -- organisms whose narrow habitat requirements make them the most sensitive indicators of ecosystem shift. Unlike CASCADE-01 and CASCADE-02, which operate through biological interactions, CASCADE-03 is mediated primarily by abiotic forcing: temperature and precipitation changes that alter the physical conditions upon which specialization depends.

| cascade_id | CASCADE-03 |
|---|---|
| cascade_name | Climate-Gradient-Endemic Cascade |
| modules_spanned | flora, fauna |
| source | GOV-02, GOV-01, GOV-03, CON-01 |

| Step | Species / Process A | Relationship Type | Species / Process B | Mechanism |
|------|-----------|-------------------|-----------|-----------|
| 1 | Temperature increase (4.7-10F projected, GOV-02) | abiotic forcing | Snowpack and evapotranspiration regimes | USDA Northwest Climate Hub projects 4.7 to 10 degrees Fahrenheit warming by end of the 21st century across the PNW. This reduces winter snowpack, increases growing-season evapotranspiration, and shifts the timing and magnitude of precipitation delivery (GOV-02). |
| 2 | Reduced snowpack / increased evapotranspiration | abiotic forcing | Vegetation zone boundaries | Vegetation zones migrate upslope 300-1,000 feet as temperature isoclines shift. The moisture gradient that defines the west-to-east transition from temperate rainforest through dry forest to steppe compresses eastward. Species adapted to specific moisture regimes -- particularly the 75 inch/year to 15 inch/year gradient across the Columbia River Gorge (GOV-01, GOV-03) -- face habitat contraction or displacement (GOV-02). |
| 3 | Moisture gradient shift / microclimate change | competition (habitat narrowing) | Gorge endemic wildflower habitats | Fifteen Gorge endemic wildflowers occupy microhabitats measured in square meters -- basalt cliff seepage zones, spray zone margins, lithosol pockets, and vernal pool edges (CON-01, GOV-03). As seepage rates change and microclimate niches shift, these habitats narrow. The compressed precipitation gradient of the Gorge (60 inches lost across fewer than 50 miles) means that small changes in moisture delivery produce disproportionate habitat impacts on species whose entire global distribution falls within this transition zone (CON-01, GOV-03). |
| 4 | Snowpack decline | abiotic forcing | Alaska yellow-cedar (*Callitropsis nootkatensis*) mortality | Alaska yellow-cedar depends on winter snow insulation to protect its shallow root system from lethal cold during freeze-thaw cycles. Declining snowpack exposes roots to frost damage that kills mature trees. This species -- federally listed as threatened -- is an early indicator of climate-driven vegetation change in the PNW montane zone (GOV-02). |
| 5 | Temperature increase / microclimate degradation | abiotic forcing | American pika (*Ochotona princeps*) refugia viability | Pikas have a narrow thermal tolerance and die from heat stress at temperatures as low as 25.5 degrees C with prolonged exposure (GOV-01). Low-elevation Gorge populations at 30-90 meters (2,000+ meters below typical range) exist on a thermal knife-edge maintained by Gorge microclimates. Their decline signals that refugia across the region are failing (GOV-01, GOV-02). |
| 6 | Old-growth canopy loss + warming | abiotic forcing | Larch Mountain salamander (*Plethodon larselli*) talus microclimate | The Larch Mountain salamander is a Gorge endemic, restricted to moss-covered talus slopes beneath old-growth canopy. This lungless amphibian breathes through its skin and requires constant moisture. Old-growth canopy maintains the temperature and humidity regime in the talus -- canopy removal is lethal to these populations. Climate warming exacerbates the microhabitat degradation even where canopy is retained (GOV-01, GOV-03). |

**Cascade logic:** CASCADE-03 differs from CASCADE-01 and CASCADE-02 in that it propagates through physical environment rather than through trophic or mutualistic interactions. The threat is not a broken link between species but a shift in the abiotic conditions that define the niche boundaries of specialist organisms. Steps 3-6 can occur independently or simultaneously -- they share the same upstream driver (Steps 1-2) but produce parallel downstream effects on different endemic taxa. The common thread is that specialization, which made these species uniquely adapted to PNW microhabitats, now makes them uniquely vulnerable to changes in those microhabitats.

**Interaction with CASCADE-01 and CASCADE-02:** CASCADE-03 is not isolated from the biological cascades. Vegetation zone migration (Step 2) changes the tree species composition available to EMF fungi, potentially disrupting CASCADE-01 Steps 4-5 and CASCADE-02 Step 1 simultaneously. If Douglas fir's range shifts upslope and old-growth stands are lost to fire or drought stress, the EMF communities associated with those stands -- and the CMN architecture they support -- lose their structural foundation. Similarly, snowpack decline (Step 4) alters stream hydrology in ways that compound the aquatic threats to salmon populations, creating a secondary pathway through which CASCADE-03 degrades CASCADE-01. The three cascades are not parallel chains; they are an interconnected web whose shared hub nodes (old-growth structure, Douglas fir, salmon) transmit disruption between pathways.

**The compressed gradient as amplifier:** The Columbia River Gorge's precipitation gradient -- dropping from 75 inches per year at the west end to 15 inches at the east end across fewer than 50 miles (GOV-01, GOV-03) -- functions as an amplifier for CASCADE-03. The same temperature increase that would shift vegetation zones by a few hundred feet in a landscape with gradual moisture transitions can compress or eliminate entire microhabitat bands in the Gorge. The 15 endemic wildflowers profiled in the flora survey occupy the narrowest portions of this gradient, where small environmental changes produce disproportionate biological responses. This compression is why the Gorge concentrates so many sensitive indicator species in so small an area.

---

## Section 2: Network Systems Model (SYNTH-01)

The three cascades documented above are the most consequential multi-step chains in the PNW temperate rainforest. But the ecosystem's network architecture extends far beyond these formal cascades. Across all four survey modules, 48 cross_module relationships have been documented and formally attributed: 9 from flora, 15 from fauna, 3 from fungi, and 21 from aquatic. These relationships, combined with hundreds of within-module connections, form a network whose structure reveals which species are indispensable, which connections are irreplaceable, and where the ecosystem is most vulnerable to disruption.

The network model presented here is a prose representation of the ecosystem's topology. It identifies node categories (groups of species or abiotic factors), edge types (the relationship types that connect them), hub nodes (the most connected elements), and critical edges (the connections whose disruption cascades most widely). This model does not require graph visualization software to be useful -- the topology is encoded in the relationship tables of the four survey modules and synthesized here into a narrative systems analysis.

The fundamental architecture that emerges is a network dominated by two structural features: the marine-to-terrestrial nutrient pipeline (CASCADE-01) anchored by salmon as the primary hub, and the below-ground mycorrhizal infrastructure (CASCADE-02 and the CMN) anchored by Douglas fir and EMF fungi. These two features intersect at the EMF-tree mycorrhizal interface, where marine nitrogen from salmon enters the Common Mycorrhizal Network for redistribution. Climate change (CASCADE-03) threatens both features simultaneously from above, while industrial forestry threatens the mycorrhizal infrastructure from below through old-growth removal. The network's resilience depends on maintaining both features -- neither can compensate for the loss of the other.

### Node Categories

The network model organizes all species and abiotic elements into five node categories:

**Flora nodes** include the structural foundation of the ecosystem: old-growth conifers (Douglas fir, western hemlock, Sitka spruce, western red cedar), deciduous species (red alder, bigleaf maple), understory and ground-layer vegetation, nurse logs, and the 15 Gorge endemic wildflowers with microhabitat-specific distributions. Flora nodes are the physical architecture upon which the entire network is built -- canopy structure determines microhabitat availability for birds, mammals, amphibians, and fungi.

**Fauna nodes** encompass 244 species documented across the four study zones: 22 mammals with full ecological profiles, 204 birds (40 detailed profiles and 164 in summary tables), and 18 amphibians and reptiles with individual species entries. Fauna nodes function as mobile connectors -- bears, eagles, otters, and wolves physically transport nutrients across ecosystem boundaries, while small mammals (flying squirrels, red-backed voles) and birds (nutcrackers, dippers) mediate specific mutualistic or trophic interactions that sustain network integrity. Three flagship species documented in the fauna survey illuminate distinct network roles: the Larch Mountain salamander (*Plethodon larselli*) as a microhabitat integrity indicator, the American pika (*Ochotona princeps*) as a climate sentinel with anomalous low-elevation Gorge populations at 30-90 meters (GOV-01), and the northwestern pond turtle (*Actinemys marmorata*) as an active management case study requiring six concurrent intervention types.

**Fungi nodes** include over 200 EMF species in old-growth stands (GOV-06), the PNW truffle complex (*Rhizopogon*, *Gautieria*, *Hysterangium*), saprotrophic decomposers, and lichenized fungi (*Lobaria pulmonaria*). Fungi nodes are the below-ground infrastructure of the network -- the mycorrhizal highways, nutrient processing systems, and decomposition engines that connect above-ground organisms to soil resources and to each other.

**Aquatic nodes** include 51 fish species (43 native, 8 non-native), aquatic invertebrates, riparian vegetation, and the hyporheic zone interface. The dominant aquatic node is Pacific salmon -- six species (*Oncorhynchus tshawytscha*, *O. kisutch*, *O. nerka*, *O. keta*, *O. gorbuscha*, *O. mykiss*), twelve individually profiled stocks, with 137+ wildlife species dependent on them (CON-05). The salmon dependency web documented in Module 04 includes 21 mammals, 41 birds, 15 fish, 30 invertebrate groups, 31 plant groups, and 6 fungal groups -- spanning every trophic level and every survey module. Aquatic nodes provide the marine nutrient subsidy that drives CASCADE-01 and the cold-water habitats that support specialized species like bull trout (*Salvelinus confluentus*), which requires spawning habitat below 9 degrees C (GOV-01). Non-native predatory fish (smallmouth bass, walleye, northern pike) create interference competition edges that increase juvenile salmon mortality during freshwater rearing (GOV-01).

**Abiotic nodes** include climate (temperature, precipitation), the moisture gradient spanning 200+ inches/year on the Olympic Peninsula to 15 inches/year in the eastern Gorge (GOV-04, GOV-01), substrate geology (basalt cliffs, talus slopes, lithosol soils), and snowpack. Abiotic nodes are not species, but they function as network controllers whose state changes propagate through all biological nodes via CASCADE-03.

### Cross-Module Relationship Detail

The 48 cross_module relationships synthesized in this model are not uniformly distributed. Their concentration reveals the network's architecture:

| Module Pair | cross_module Edges | Key Connections | Primary Cascade |
|-------------|-------------------|-----------------|-----------------|
| Fauna-Aquatic | 7 | Bear-salmon, eagle-salmon, otter-salmon, dipper-invertebrates, tailed frog, giant salamander, pond turtle | CASCADE-01 (Steps 1-3) |
| Fauna-Flora | 6 | Elk-understory, murrelet-canopy, nutcracker-pine, pika-microclimate, pika-vegetation, pond turtle-riparian | CASCADE-03 (Steps 5-6) |
| Fauna-Fungi | 2 | Flying squirrel-truffle, spotted owl-prey web | CASCADE-02 (Steps 2-4) |
| Flora-Fungi | 4 | Douglas fir-EMF, hemlock-nurse log decomposition, coralroot-mycorrhiza, red alder-*Frankia* | CASCADE-01 (Steps 4-5) |
| Flora-Aquatic | 3 | Riparian trees-salmon N, waterfall-spray zone endemics, riverbank-hyporheic | CASCADE-01 (Step 5) |
| Fungi-Aquatic | 3 | Salmon N-to-EMF, CMN nutrient redistribution, saprotrophic decomposition cycle | CASCADE-01 (Step 4) |
| Flora-Fauna (invertebrate) | 8 | Endemic wildflower-pollinator dependencies across 6+ species | Not cascade-linked |
| **Additional within-module** | **15** | **Internal edges supporting cross-module pathways** | **Various** |

The fauna-aquatic pair has the most cross_module edges, driven almost entirely by the salmon dependency web. The fauna-flora pair has the second-highest count, reflecting the dual role of fauna as both habitat-dependent (murrelets needing canopy, pikas needing talus shade) and habitat-modifying (elk browsing shaping understory composition). Flora-invertebrate pollinator relationships, while numerous (8 cross_module connections from Gorge endemic wildflower profiles), are not linked to any of the three formal cascades -- they represent a parallel network of mutualistic dependencies that merits attention in future conservation planning but does not drive the large-scale nutrient or trophic cascades mapped here.

### Edge Types

Connections between nodes follow the four relationship types defined in the shared schema from `00-shared-schemas.md`:

**Predator-prey edges** include predation, herbivory, parasitism, and parasitoidism. These are the most visible connections -- bear-salmon, cougar-deer, elk-understory vegetation, spotted owl-flying squirrel. The network contains 12 formal predator-prey relationship entries from fauna alone, plus 15 additional predation-based connections documented in the aquatic salmon dependency web.

**Symbiotic edges** include mutualism, commensalism, and mycorrhizal network connections. These edges bind the below-ground network: Douglas fir to *Rhizopogon* via EMF partnership (PR-03), mother trees to seedlings via CMN (PR-05), flying squirrels to truffles via spore dispersal mutualism (GOV-06), Clark's nutcracker to whitebark pine via seed caching (GOV-03). Symbiotic edges are often bidirectional and frequently obligate -- their disruption eliminates both partners.

**Nutrient transfer edges** include marine-derived transfers, atmospheric fixation, decomposition, and hyporheic exchange. These are the pipelines that move matter and energy through the ecosystem: salmon-to-forest nitrogen (PR-02), red alder nitrogen fixation at 100-300 kg N/ha/year (PR-04), *Lobaria* canopy nitrogen fixation (GOV-05), saprotrophic decomposition of nurse logs (GOV-05). Nutrient transfer edges are predominantly unidirectional and form the backbone of CASCADE-01.

**Competition edges** include exploitative, interference, and apparent competition. These edges define the boundaries of coexistence: barred owl versus spotted owl (interference competition, GOV-01), conifer-oak competition along the Gorge moisture gradient (GOV-03), invasive bullfrogs displacing northwestern pond turtles from basking sites (GOV-01), reed canarygrass excluding Oregon semaphore grass from wetland habitats (GOV-03).

### Hub Nodes

Hub nodes are species or elements with the highest connectivity in the network -- the nodes whose removal would cascade through the largest number of connections. Four hub nodes emerge from the synthesis:

**Pacific salmon** (*Oncorhynchus* spp.) is the network's primary hub. With 137+ dependent wildlife species spanning mammals, birds, fish, invertebrates, plants, and fungi (CON-05), and 21 of 25 summary relationship entries marked cross_module: true, salmon functions as the single most connected node in the ecosystem. Salmon drives CASCADE-01 and provides the marine nutrient subsidy that enhances riparian tree growth by up to 3x (PR-02). No other species connects ocean productivity to inland forest function.

**Douglas fir** (*Pseudotsuga menziesii*) is the structural and mycorrhizal hub. As the dominant canopy species across three of four study zones, Douglas fir provides nesting habitat for spotted owls and marbled murrelets, forms the primary EMF partnerships that build the CMN, and functions as the mother tree hub-node connecting up to 47 other trees via shared mycorrhizal fungi (PR-05). Old-growth Douglas fir is the shared dependency of CASCADE-01 (Steps 4-5), CASCADE-02 (Step 1), and CASCADE-03 (Step 6).

**EMF fungi** (particularly *Rhizopogon* spp.) are the network's below-ground hub. EMF fungi mediate the interface between soil nutrients and tree roots, enable CMN formation and carbon/nitrogen redistribution, produce the truffle fruiting bodies that sustain flying squirrels and voles (CASCADE-02), and process marine-derived nitrogen entering riparian soils (CASCADE-01 Step 4). Over 200 EMF species coexist in old-growth stands (GOV-06), providing functional redundancy that buffers the network against individual species loss.

**Old-growth forest structure** functions as an emergent hub -- not a single species but a structural condition defined by trees exceeding 200 years, multi-layered canopy, standing snags, large-diameter nurse logs, and deep organic soil. Old-growth structure is the shared prerequisite for agarikon persistence (trees 200+ years old only, GOV-06), marbled murrelet nesting (large moss-covered branches, PR-04), spotted owl habitat (multi-layered canopy, GOV-01), Larch Mountain salamander microclimate (canopy-maintained talus moisture, GOV-01), and EMF community diversity (4x truffle diversity in old-growth versus plantations, GOV-06).

### Critical Edges

Critical edges are connections whose disruption cascades through the network. Three edges stand out:

**Bear-salmon nutrient ferry** (CASCADE-01, Step 2): Bears are the primary mechanism by which marine nutrients leave streams and enter the forest. Without bear predation and carcass transport, marine nitrogen would remain concentrated in riparian zones and streams rather than being distributed across the forest floor. The 500-700 salmon per bear per season (PR-02) represents an irreplaceable nutrient vector -- no other terrestrial predator moves marine biomass at this scale or distance from streams.

**EMF-tree mycorrhizal interface** (CASCADE-01, Steps 4-5; CASCADE-02, Step 1): The Hartig net interface where EMF hyphae exchange nutrients with tree root cells is the chokepoint through which all below-ground nutrient redistribution flows. If this interface is degraded -- through clearcutting that destroys EMF communities, through soil compaction that collapses hyphal networks, or through climate-driven shifts in fungal phenology -- both CASCADE-01 and CASCADE-02 lose their downstream steps simultaneously.

**Old-growth canopy to microhabitat dependency** (CASCADE-03, Steps 4-6): The connection between old-growth canopy and the microhabitats it maintains -- talus moisture for Larch Mountain salamanders, thermal refugia for pikas, attachment substrate for agarikon and *Lobaria* -- is a one-directional dependency with no substitute. Young forests cannot replicate the microhabitat conditions created by centuries of canopy development. Canopy removal is not a disturbance that recovery can repair on relevant timescales; for microhabitat-specialist species, it is effectively permanent.

### Network Vulnerability Analysis

The network's vulnerability profile is shaped by an asymmetry between its hub nodes and critical edges. Hub nodes (salmon, Douglas fir, EMF fungi, old-growth structure) are all currently under active threat: 10 of 12 salmon stocks are listed as threatened or endangered (GOV-01), old-growth forest area continues to decline across the region, and EMF community recovery timelines exceed industrial forestry rotation lengths (GOV-06). The network has no redundant hub nodes -- no other species can substitute for salmon's nutrient vector role, no other tree can replace Douglas fir's mycorrhizal hub architecture, and no young-forest fungal community can replicate old-growth EMF diversity.

Critical edges share this irreplaceability. The bear-salmon nutrient ferry operates at a scale (500-700 salmon per bear per season transported up to 500 m from streams, PR-02) that cannot be replicated by bald eagles, river otters, or any other vector species. The EMF-tree mycorrhizal interface depends on fungal species that take 150-200 years to recolonize after disturbance (GOV-06). The canopy-microhabitat connection requires centuries of canopy development to produce the structural complexity -- multi-layered crowns, deep bark furrows, moss accumulation -- upon which microhabitat-dependent species rely.

The network's most vulnerable configuration is simultaneous degradation of multiple hub nodes. Climate warming (CASCADE-03) threatens old-growth structure from above (fire risk, drought stress) while salmon decline (CASCADE-01 running in reverse) weakens the nutrient subsidy from below. EMF community health depends on both -- healthy trees and adequate soil nutrients are prerequisites for mycorrhizal network maintenance. When both the canopy and the nutrient supply are degraded simultaneously, the fungal network loses support from two directions, and CASCADE-02 (truffle-mammal-raptor) degrades as a downstream consequence.

This multiplicative interaction between cascades is the central finding of the network synthesis: the three cascades are not independent chains but interconnected pathways sharing hub nodes. Disruption of any hub propagates through multiple cascades simultaneously.

### Cascade Interconnection Map

The following table documents where the three cascades share nodes and edges, creating the potential for cross-cascade amplification:

| Shared Element | CASCADE-01 Role | CASCADE-02 Role | CASCADE-03 Role |
|---------------|----------------|----------------|----------------|
| Old-growth Douglas fir | Steps 4-5: EMF host tree, CMN mother tree hub | Step 1: Old-growth root network sustaining truffle diversity | Step 6: Canopy maintaining salamander talus microclimate |
| EMF fungi (*Rhizopogon* spp.) | Step 4: Marine N uptake via Hartig net | Steps 1-2: Truffle production for flying squirrel prey | Not directly involved |
| Old-growth forest structure | Steps 4-5: CMN architecture requires 200+ year trees | Step 1: 4x truffle diversity in old-growth vs plantations (GOV-06) | Steps 4-6: Canopy-dependent microhabitats |
| Snowpack regime | Not directly involved | Not directly involved | Steps 1, 4: Snowpack decline drives both vegetation shift and cedar mortality |
| Moisture gradient | Step 5: CMN redistributes water during drought | Not directly involved | Steps 2-3: Gradient shift narrows endemic habitats |
| Salmon (*Oncorhynchus* spp.) | Steps 1-3: Primary nutrient vector | Not directly involved | Not directly involved, but salmon stream shading depends on canopy health |

The table reveals that old-growth Douglas fir and old-growth forest structure appear as shared nodes in all three cascades. This convergence means that these elements are the network's highest-leverage conservation targets: protecting them simultaneously maintains the nutrient pipeline (CASCADE-01), the prey web foundation (CASCADE-02), and the microhabitat conditions (CASCADE-03). Conversely, their loss would degrade all three cascades simultaneously -- a systemic failure rather than a localized disruption.

### Network Connectivity Summary

| Metric | Count | Source |
|--------|-------|--------|
| Total cross-module relationships synthesized | 48 | 01-flora (9), 02-fauna (15), 03-fungi (3), 04-aquatic (21) |
| Formal cascades mapped | 3 | CASCADE-01, CASCADE-02, CASCADE-03 |
| Hub nodes identified | 4 | Pacific salmon, Douglas fir, EMF fungi, old-growth structure |
| Critical edges identified | 3 | Bear-salmon ferry, EMF-tree interface, canopy-microhabitat |
| Node categories | 5 | Flora, Fauna, Fungi, Aquatic, Abiotic |
| Edge types | 4 | predator_prey, symbiotic, nutrient_transfer, competition |
| Species with salmon dependency | 137+ | CON-05 |
| Trees connected per mother tree (max) | 47 | PR-05 |
| EMF species in old-growth stands | 200+ | GOV-06 |
| Total species documented across all modules | 1,000+ | 800+ flora, 244 fauna, 5 fungi profiles, 51 fish |

---

## Section 3: Climate Threat Integration (SYNTH-02)

The USDA Northwest Climate Hub projects a temperature increase of 4.7 to 10 degrees Fahrenheit by the end of the 21st century across the Pacific Northwest (GOV-02). This warming will interact with the ecosystem network in ways that are determined by the network's structure -- some species face direct climate impacts, while others are threatened through cascade-mediated pathways where climate acts on a connected node and the effects propagate through the network.

The critical insight from the network model is that climate change does not act on species in isolation. It acts on the network, and the network's structure determines how impacts propagate. A species with high connectivity (salmon, Douglas fir) transmits climate impacts to its many connections. A species with low connectivity but high specificity (Gorge endemics, pika) absorbs impacts locally but signals that the network's environmental conditions are shifting. Understanding which pattern applies to which species -- hub-node vulnerability versus indicator-species sensitivity -- is essential for predicting which impacts will cascade and which will remain localized.

The following analysis organizes climate threats by taxonomic group, classifying each as either direct (climate acts on the species itself) or cascade-mediated (climate acts on a connected node and the effects propagate through the network to reach the species of concern). This distinction matters for conservation: direct threats may be addressable through species-level management, while cascade-mediated threats require network-level intervention.

### Flora Threat Vectors

**Upslope vegetation zone migration (direct):** Vegetation zones are projected to shift upslope 300-1,000 feet as temperature isoclines move to higher elevations (GOV-02). Species at the upper margins of their range -- including subalpine meadow communities that currently support 100+ wildflower species (GOV-02) -- will face habitat compression against mountain summits with no further upward retreat available.

**Drought stress at moisture gradient boundaries (direct):** Western hemlock, the climax species on the Cascade western slopes, occupies a moisture regime of 80-100 inches/year (GOV-02). Warming-driven increases in evapotranspiration will shift the effective moisture boundary eastward, causing mid-Gorge populations of moisture-dependent species to contract toward the wetter western end. The Gorge's steep precipitation gradient -- 60 inches lost across fewer than 50 miles (GOV-01, GOV-03) -- means that small temperature increases produce disproportionate habitat impacts.

**Increased fire risk in rain-shadow zones (direct):** The eastern Gorge and lower-elevation eastern Cascades already experience fire regimes driven by summer drought (GOV-02, GOV-03). Warming extends the fire season, increases fire intensity, and expands the area of fire-prone conditions westward into currently mesic forests. Oregon white oak and ponderosa pine communities in the eastern Gorge transition zone are particularly vulnerable to increased fire frequency (GOV-03).

**Snowpack decline and Alaska yellow-cedar mortality (direct):** Alaska yellow-cedar depends on winter snow insulation to protect its shallow root system from lethal freeze-thaw damage. The ongoing decline in PNW snowpack is already driving yellow-cedar mortality -- this federally threatened species is an early indicator of climate-driven vegetation change in the montane zone (GOV-02).

**Gorge endemic wildflower habitat narrowing (cascade-mediated via CASCADE-03):** Fifteen endemic wildflowers occupy microhabitats defined by specific moisture levels, substrate chemistry, and aspect. As the moisture gradient shifts and seepage patterns change, these habitats contract. The narrowing is cascade-mediated because the direct climate driver (temperature) acts on the moisture gradient (Step 2), which then acts on microhabitat conditions (Step 3), which then affects the endemic species. The species themselves have no direct thermal vulnerability -- their threat pathway runs through habitat (CON-01, GOV-03).

**Bark beetle outbreaks (cascade-mediated):** Warming reduces winter mortality of bark beetle populations while simultaneously drought-stressing Douglas fir and other host trees, weakening their resin-based defenses. The interaction between pest population increase and host vulnerability increase is multiplicative -- neither factor alone would produce the outbreak severity that both factors together create (GOV-02). Because Douglas fir is a hub node in the network -- the primary EMF host, the dominant canopy structural element, and the mother tree species of the CMN -- widespread bark beetle mortality in Douglas fir would simultaneously degrade CASCADE-01 (Steps 4-5), CASCADE-02 (Step 1), and the structural foundation of old-growth microhabitats (CASCADE-03, Step 6).

### Fauna Threat Vectors

Fauna face a mixture of direct thermal constraints and cascade-mediated threats that arrive through disrupted food webs, degraded habitats, and weakened mutualistic dependencies. The cascade-mediated threats are generally more difficult to address because they require intervention at nodes distant from the affected species.

**American pika thermal vulnerability (direct):** Pikas die from heat stress at temperatures as low as 25.5 degrees C with prolonged exposure (GOV-01). Standard-elevation populations across the Cascades are already disappearing from lower sites. The anomalous low-elevation Gorge populations at 30-90 meters elevation represent a natural experiment in thermal tolerance -- their persistence or decline will provide early warning about refugia viability across the region (GOV-01, GOV-02).

**Salmon population decline from stream warming (cascade-mediated via CASCADE-01):** Rising stream temperatures reduce cold-water habitat for salmon and bull trout, alter flow timing as snowpack reduction shifts peak runoff earlier in the season, and degrade spawning and rearing conditions. Because salmon drive CASCADE-01, their decline propagates through the entire nutrient network: reduced bear fitness, reduced riparian nitrogen, reduced mycorrhizal nutrient availability, and reduced tree growth. Ten of twelve salmon stocks in the study area are already listed as threatened or endangered (GOV-01); climate warming adds a compounding stressor to populations already diminished by dam construction, habitat degradation, and overharvesting.

**Spotted owl compounding threats (cascade-mediated via CASCADE-02):** The spotted owl faces three simultaneous threats whose interactions are multiplicative: barred owl range expansion (interference competition, GOV-01), old-growth nesting habitat loss, and CASCADE-02 degradation (reduced prey availability through truffle diversity collapse). Climate warming exacerbates all three -- it facilitates barred owl range expansion, increases fire risk to remaining old-growth, and may alter fruiting phenology of truffle species (GOV-01, GOV-06).

**Marbled murrelet nesting habitat loss (direct):** Marbled murrelets nest exclusively on large, moss-covered branches of old-growth emergent conifers, flying up to 50 miles inland from the coast to breed (PR-04). Continued old-growth reduction, compounded by increased fire risk under warming, directly eliminates the only available nesting substrate for this federally threatened seabird. A 96% historical population decline has already occurred (GOV-01).

**Larch Mountain salamander microhabitat sensitivity (cascade-mediated via CASCADE-03):** This Gorge endemic, lungless amphibian breathes through its skin and requires constant moisture in its moss-covered talus habitat. Warming degrades the temperature-humidity regime in the talus even where old-growth canopy is retained, and canopy loss (whether from logging, fire, or wind) eliminates the microhabitat entirely. The cascade pathway runs through abiotic forcing (temperature) to canopy condition to talus microclimate to salamander viability (GOV-01, GOV-03).

### Fungi Threat Vectors

The fungal community is threatened primarily through cascade-mediated pathways because fungi depend on the trees, soils, and moisture conditions that climate change disrupts. Direct thermal impacts on fungi are poorly studied compared to plants and animals, but the indirect impacts through habitat degradation are well documented.

**Old-growth loss degrades EMF diversity (cascade-mediated via CASCADE-02):** The 4x reduction in truffle diversity between old-growth stands and young plantations (GOV-06) is the primary quantitative indicator of how forest management affects the fungal network. Because old-growth EMF community composition takes 150-200 years or more to recover after clearcutting (GOV-06), each rotation of industrial forestry (40-60 years) starts with a more impoverished fungal community than the previous rotation. This progressive below-ground biodiversity loss is invisible from above ground and irreversible on human timescales.

**Agarikon old-growth exclusivity (direct):** Agarikon (*Laricifomes officinalis*) depends exclusively on trees 200+ years old. It cannot persist in managed forests -- it requires the thick, deeply furrowed bark and heartwood decay conditions of old-growth conifers (GOV-06). The species has already been extirpated from most of its European range due to old-growth logging, and its PNW range is contracting as remaining old-growth stands shrink.

**Warming-driven phenology shifts (cascade-mediated):** Climate warming may alter the seasonal timing of truffle fruiting, potentially creating temporal mismatches between truffle availability and the foraging phenology of flying squirrels and red-backed voles. This cascade-mediated threat could degrade CASCADE-02 even in protected old-growth stands where truffle diversity remains high.

**CASCADE-02 degradation cascading to spotted owl (cascade-mediated):** Truffle diversity loss cascades through flying squirrel and vole populations to spotted owl reproductive success. This is a fungi-mediated threat to a raptor -- the pathway from climate to canopy loss to EMF collapse to prey reduction to owl decline runs through four intermediate nodes before reaching the species of conservation concern.

### Aquatic Threat Vectors

Aquatic species face the most immediate and measurable climate impacts because water temperature is a directly constraining physical variable for ectothermic organisms. Unlike terrestrial species that can seek shade or move to cooler microhabitats, fish in warming streams have no behavioral options beyond retreating upstream to colder headwaters -- a retreat that progressively reduces the total available habitat.

**Stream temperature increases (direct):** Salmon and bull trout require cold water -- bull trout spawning habitat must be below 9 degrees C, and juvenile salmon rearing habitat degrades above 15-18 degrees C (GOV-01). Climate warming directly reduces the extent of thermally suitable habitat, confining cold-water species to increasingly isolated headwater refugia.

**Altered flow timing (direct):** Snowpack reduction shifts peak river flows from late spring/early summer to earlier in the season, changing the hydrological regime that salmon spawning and juvenile rearing depend on. Altered flow timing affects redd construction conditions, egg incubation temperatures, juvenile growth rates, and smolt outmigration success (GOV-02).

**CASCADE-01 weakening (cascade-mediated):** When salmon populations decline due to warming, the nutrient cascade weakens at every step. The effects are multiplicative: reduced marine nitrogen entering riparian soils, reduced EMF nutrient access, reduced CMN redistribution, and reduced tree growth across the watershed. Because 40-80% of riparian nitrogen in healthy systems is marine-origin (PR-02), the loss of the salmon nutrient subsidy cannot be compensated by terrestrial nitrogen sources alone. The 50-watershed study documented up to 3x growth differences between salmon-rich and salmon-poor watersheds (Dr. John Reynolds, SFU), quantifying the magnitude of the nutrient subsidy that is at risk. Historical salmon runs in the Columbia River basin were 2-6 times larger than current populations (CON-05), meaning that current marine nitrogen levels in riparian forests already represent a fraction of the historical transfer.

**Compounding ESA listings (direct):** Ten of twelve salmon stocks in the study area are already listed as threatened or endangered (GOV-01). Climate warming adds a stressor to populations whose buffer capacity has already been depleted by habitat degradation, dam construction, and historical overharvesting. The compounding nature of these threats means that climate impacts are not independent -- they interact with existing stressors to produce outcomes worse than either factor alone.

### Threat Classification Summary

The following table classifies all documented climate threats by whether they act directly on the affected group or propagate through cascade pathways:

| Taxonomic Group | Direct Threats | Cascade-Mediated Threats | Primary Cascade Pathway |
|----------------|---------------|------------------------|------------------------|
| Flora | Vegetation zone migration (GOV-02), drought stress (GOV-02), fire risk increase (GOV-02, GOV-03), yellow-cedar mortality (GOV-02) | Endemic habitat narrowing via gradient shift (CASCADE-03), bark beetle via drought-pest interaction (GOV-02) | CASCADE-03 (Steps 1-3) |
| Fauna | Pika thermal vulnerability (GOV-01), murrelet habitat loss (PR-04) | Salmon decline cascading through nutrient web (CASCADE-01), spotted owl via truffle loss (CASCADE-02), salamander via canopy-microclimate (CASCADE-03) | CASCADE-01, CASCADE-02, CASCADE-03 |
| Fungi | Agarikon old-growth exclusivity (GOV-06) | EMF diversity loss via old-growth removal (CASCADE-02), phenology mismatch via warming, CASCADE-02 propagation to owl (GOV-06) | CASCADE-02 (Step 1) |
| Aquatic | Stream temperature increase (GOV-01), flow timing alteration (GOV-02), ESA listing compound stress (GOV-01) | CASCADE-01 weakening from salmon decline (PR-02) | CASCADE-01 (all steps) |

Across all four groups, cascade-mediated threats outnumber direct threats. This is the central implication of the network model for conservation: most climate impacts arrive not through direct thermal or hydrological stress on the species of concern, but through disruption of a connected node elsewhere in the network.

---

## Section 4: Conservation Implications and Recommendations (SYNTH-03)

The network model developed in this synthesis demonstrates that biodiversity conservation in the PNW temperate rainforest cannot succeed as a species-by-species enterprise. The ecosystem's structure is such that protecting hub nodes and critical edges produces conservation benefits that propagate through the entire network, while species-level interventions that ignore network connectivity address symptoms without addressing causes.

The following recommendations are structured around the network model. Each cites specific interventions already documented as underway in the survey modules. The intent is to present evidence and identify ongoing work, not to advocate for specific policy positions (SAFE-06).

### 1. Old-Growth Forest Protection (Hub Node)

Old-growth forest structure is the shared dependency of all three cascades: CASCADE-01 (Steps 4-5 depend on EMF communities hosted by old-growth roots), CASCADE-02 (Step 1 depends on old-growth truffle diversity), and CASCADE-03 (Steps 4-6 depend on canopy-maintained microhabitats). Protecting old-growth simultaneously protects the mycorrhizal network infrastructure, the truffle-mammal-raptor food web, and the microhabitat conditions that sustain endemic species.

The quantitative case is clear: old-growth stands support 200+ EMF species versus 20-40 in young plantations (GOV-06), truffle diversity is 4x higher in old-growth (GOV-06), and EMF community recovery after clearcutting takes 150-200+ years (GOV-06). A single old-growth Douglas fir mother tree connects to up to 47 other trees via the CMN (PR-05), providing carbon subsidies, water sharing, and chemical defense signaling that plantation trees cannot replicate.

**Interventions already underway:** The Conservation Fund has conducted large-scale forest acquisitions protecting old-growth stands critical for EMF networks and spotted owl habitat (CON-03). Columbia Land Trust manages conservation easements in the Columbia River Gorge and lower Columbia River region (CON-02). The USDA Forest Service manages old-growth stands within the Columbia River Gorge National Scenic Area under plans that incorporate old-growth retention and spotted owl habitat requirements (GOV-03). The biological evidence base supports retention forestry approaches that maintain mother tree hub nodes during harvest -- Simard's research demonstrates that seedling survival rates decline measurably in clearcuts compared to partial harvests that retain mother trees (PR-05), providing quantitative support for management practices that preserve CMN connectivity.

### 2. Salmon Population Recovery (Hub Node)

Pacific salmon is the network's most connected hub: 137+ wildlife species depend on salmon (CON-05), and 21 of 25 summary aquatic relationships cross module boundaries. Salmon decline weakens CASCADE-01 at every step, producing multiplicative losses in bear fitness, riparian tree growth (up to 3x reduction, PR-02), soil invertebrate biomass, songbird density, and mycorrhizal nutrient availability. The Columbia River basin historically supported 7-16 million adult salmon returns annually; current runs are a small fraction of that historical abundance (CON-05, PR-02).

**Interventions already underway:** Wild Salmon Center conducts research and advocacy linking salmon population health to terrestrial ecosystem function, including documentation of the 137+ species salmon dependency web that forms the empirical foundation for CASCADE-01 (CON-05). ESA listing and critical habitat designations provide federal protection for 10 of 12 stocks in the study area (GOV-01). Dam removal and fish passage restoration projects are ongoing throughout the Columbia River basin and its tributaries. Hatchery supplementation, while maintaining some population numbers, does not restore the nutrient transport function at the same scale as wild populations because hatchery fish often exhibit different stream distribution patterns and carcass deposition behaviors. The integrated understanding documented in CASCADE-01 -- that salmon productivity sustains forest productivity -- provides the ecological rationale for prioritizing wild population recovery over hatchery augmentation as a long-term conservation strategy.

### 3. Gorge Endemic Habitat Conservation (CASCADE-03)

Fifteen Gorge endemic wildflowers occupy microhabitats measured in square meters -- basalt cliff seepage zones, spray zone margins, lithosol pockets, and vernal pool edges (CON-01, GOV-03). These species' entire global distributions fall within the Columbia River Gorge, making habitat protection in the Gorge synonymous with species survival. CASCADE-03 projects that the moisture gradient shifts driven by warming will narrow these habitats further.

**Interventions already underway:** Friends of the Columbia Gorge provides advocacy for Gorge natural resources and documents endemic species populations and threats (CON-01). The National Scenic Area management plan provides land-use protections within the Columbia River Gorge National Scenic Area (GOV-03). Active invasive species removal -- including English ivy removal at cliff faces where ivy mats shade out endemic species like the Gorge daisy (*Erigeron oreganus*) -- is ongoing at occupied sites (CON-01, GOV-03).

### 4. Northwestern Pond Turtle Active Management (Network Edge)

The northwestern pond turtle (*Actinemys marmorata*) represents a conservation approach that acknowledges permanent landscape modification. Six distinct intervention types are documented as underway in the fauna survey: head-starting programs (rearing hatchlings past the vulnerable size class), bullfrog control (reducing non-native predation), habitat restoration (creating basking and nesting sites), nest protection (excluding predators from nesting areas), population monitoring (tracking demographics across sites), and land acquisition (securing habitat through conservation easements) (GOV-01, GOV-03, CON-02).

This multi-decade, multi-agency commitment illustrates what sustained active management requires when threats -- invasive bullfrogs, habitat fragmentation, road mortality -- are permanent features of the landscape rather than temporary disturbances.

### 5. Mycorrhizal Network Integrity (Critical Edge)

The EMF-tree mycorrhizal interface is the critical edge connecting CASCADE-01 (marine nutrient uptake) and CASCADE-02 (truffle production for the prey web). Protecting mycorrhizal network integrity means protecting the below-ground infrastructure that connects trees, redistributes nutrients, enables defense signaling, and produces the truffle fruiting bodies that sustain the spotted owl's prey species.

**Evidence base:** Simard's research demonstrates that CMN architecture depends on mother tree hub nodes -- large, old trees with extensive root systems and centuries of mycorrhizal colonization history (PR-03, PR-05). USFS surveys document the 4x truffle diversity differential between old-growth and plantation forests (GOV-06). Protecting mycorrhizal networks is inseparable from protecting old-growth forest structure, but the recognition that below-ground biodiversity has independent conservation significance is relatively recent and not yet widely reflected in forest management practices.

The practical implication is that forest management decisions about harvest intensity and retention practices directly determine the future state of the mycorrhizal network. Retention of mother trees during harvest operations preserves the hub-node architecture of the CMN, maintains truffle production for the prey web, and retains the mycorrhizal inoculum necessary for seedling establishment. Conversely, clearcutting severs every CMN connection simultaneously, collapses the hub-node topology to isolated patches, and initiates a 150-200 year recovery trajectory during which the below-ground ecosystem operates at a fraction of its old-growth capacity (GOV-06, PR-05).

### 6. Climate Monitoring Through Indicator Species (Network Signal)

Three species function as biological sensors whose population trends provide early warning of cascade initiation:

**American pika (thermal early-warning):** Pikas' narrow thermal tolerance (lethal at 25.5 degrees C sustained, GOV-01) and their anomalous low-elevation Gorge populations (30-90 m versus typical 2,500-4,000 m) make them natural monitors of thermal refugia viability across the region. Pika decline signals that the thermal conditions maintaining microhabitat diversity are failing (GOV-01, GOV-02).

**Alaska yellow-cedar (snowpack indicator):** Yellow-cedar mortality from root frost exposure following snowpack loss provides a visible, measurable signal of hydrological regime change in the montane zone. Cedar die-off maps correlate with snowpack decline trajectories and serve as spatial indicators of where CASCADE-03 Step 1 is most advanced (GOV-02).

**Gorge endemic wildflowers (gradient stability indicators):** The persistence or contraction of endemic wildflower populations at specific microhabitat sites provides year-to-year monitoring data on whether the Gorge moisture gradient is stable, shifting, or accelerating its shift. Because these species occupy the steepest part of the precipitation gradient (75 inches to 15 inches across fewer than 50 miles, GOV-01, GOV-03), they detect gradient changes before those changes become apparent in more broadly distributed species (CON-01, GOV-03).

These three indicator taxa monitor different dimensions of environmental change -- thermal regime (pika), hydrological regime (yellow-cedar), and moisture gradient stability (endemics). Together, they provide a multi-axis early-warning system for CASCADE-03 initiation. Monitoring all three simultaneously creates redundancy: if pika populations decline but cedar and endemics remain stable, the signal is thermal; if cedar declines but pikas and endemics hold, the signal is snowpack-specific; if endemics contract but pikas and cedar hold, the signal is local gradient shift. Each pattern implies different downstream cascade risks and different conservation responses.

### Conservation Synthesis: Network-Based Versus Species-Based Approaches

The six recommendations above share a structural logic that distinguishes network-based conservation from traditional species-based management. In a species-based approach, the spotted owl's decline would be addressed through owl-specific interventions: habitat reserves, barred owl management, captive breeding. These interventions are necessary but insufficient because they do not address the cascade-mediated threat pathway running through fungal diversity and prey availability.

In the network model, protecting the owl requires protecting the truffle community (CASCADE-02 Step 1), which requires protecting old-growth forest structure (hub node), which simultaneously protects marbled murrelet nesting habitat, Larch Mountain salamander microhabitat, agarikon persistence, and the mycorrhizal infrastructure that processes salmon-derived nutrients (CASCADE-01 Steps 4-5). A single intervention -- old-growth protection -- propagates benefits through multiple cascades to multiple species. This is the practical value of the network model: it identifies leverage points where investment produces disproportionate conservation returns.

Similarly, salmon recovery (Recommendation 2) does not merely save salmon. It restores the marine nutrient subsidy that enhances riparian tree growth by up to 3x (PR-02), supports 137+ dependent wildlife species (CON-05), strengthens EMF community health, and reinforces the old-growth forest structure that all other cascade pathways depend on. Salmon recovery and old-growth protection are not separate conservation goals -- they are two entry points into the same network, and progress on either reinforces the other.

The network perspective also clarifies where species-level interventions remain essential. Northwestern pond turtle management (Recommendation 4) addresses threats -- invasive bullfrogs, habitat fragmentation -- that are not cascade-mediated and cannot be resolved by protecting hub nodes alone. The six intervention types documented in the fauna survey (head-starting, bullfrog control, habitat restoration, nest protection, monitoring, land acquisition, GOV-01, GOV-03, CON-02) represent the species-level management required when permanent landscape modifications create permanent management obligations.

The evidence presented in this synthesis supports a conservation architecture built on three tiers: (1) hub node protection (old-growth, salmon) that generates system-wide benefits, (2) critical edge maintenance (mycorrhizal networks, bear-salmon nutrient transport) that preserves cascade pathways, and (3) species-specific management (pond turtle, Gorge endemics) where cascade-independent threats require direct intervention.

---

## Section 5: Document Summary Statistics

| Metric | Value |
|--------|-------|
| Total cross-module relationships synthesized | 48 (flora 9, fauna 15, fungi 3, aquatic 21) |
| Cascades formally mapped | 3 (CASCADE-01, CASCADE-02, CASCADE-03) |
| Cascade steps documented | 15 (CASCADE-01: 5, CASCADE-02: 4, CASCADE-03: 6) |
| Hub nodes identified | 4 (Pacific salmon, Douglas fir, EMF fungi, old-growth structure) |
| Critical edges identified | 3 (bear-salmon ferry, EMF-tree interface, canopy-microhabitat) |
| Taxonomic groups with climate threat vectors | 4 (flora, fauna, fungi, aquatic) |
| Direct climate threats documented | 9 |
| Cascade-mediated climate threats documented | 8 |
| Conservation recommendations | 6 (old-growth, salmon, Gorge endemics, pond turtle, mycorrhizal networks, indicator species) |
| Conservation interventions cited (already underway) | 12+ (spanning CON-01 through CON-05, GOV-01, GOV-03) |
| Unique source_id citations used | 14 (GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06, PR-01, PR-02, PR-03, PR-04, PR-05, CON-01, CON-02, CON-03, CON-05) |
| Survey modules synthesized | 4 (01-flora, 02-fauna, 03-fungi, 04-aquatic) |
| Total species documented across all modules | 1,000+ (800+ flora, 244 fauna, 5+ fungi profiles with 200+ EMF species per stand, 51 fish) |
| Salmon-dependent wildlife species | 137+ (CON-05) |
| Marine-origin nitrogen in riparian zones | 40-80% in healthy watersheds (PR-02) |
| Projected temperature increase | 4.7-10 degrees F by end of 21st century (GOV-02) |
| Old-growth EMF species per stand | 200+ (GOV-06) |
| Truffle diversity ratio (old-growth : plantation) | 4:1 (GOV-06) |
| Mother tree maximum connections | 47 trees (PR-05) |

---

### Methodological Notes

This synthesis was constructed by extracting all cross_module: true relationships from the four survey modules, tracing multi-step chains through shared species nodes, and identifying the hub-node and critical-edge topology of the resulting network. All quantitative claims are attributed to source_ids from the shared Source Index in `00-shared-schemas.md`. No new data was collected for this synthesis -- all findings represent integration and analysis of data documented in Modules 01-04.

The three cascades (CASCADE-01, CASCADE-02, CASCADE-03) represent the highest-confidence multi-step chains in the data. Additional cascade candidates exist -- the red alder nitrogen fixation pathway through AMF fungi to understory vegetation, the invasive species competition cascades affecting pond turtles and Gorge endemics -- but were not elevated to formal cascade status because their cross-module step counts or source attribution depths did not meet the threshold for formal cascade documentation. These potential cascades are noted here for future investigation.

The network model presented here is a narrative systems analysis, not a mathematical graph model. A formal graph-theoretic analysis would require numerical edge weights, node centrality calculations, and sensitivity analysis -- work that exceeds the scope of this synthesis but could be constructed from the relationship tables in the survey modules.

Safety compliance throughout this document follows the protocols established in the survey modules: no GPS coordinates or specific locations for endangered species (SAFE-01), specific nations referenced for any Indigenous knowledge claims (SAFE-02), no entertainment media citations (SAFE-03), climate projections cited to agency sources (SAFE-04, GOV-02), all numerical claims attributed to source_id (SAFE-05), and evidence presented without policy advocacy (SAFE-06).

The 19 sources in the shared Source Index (6 government, 5 peer-reviewed, 5 conservation organization, 3 key researchers) provide the evidentiary foundation for all claims in this synthesis. Fourteen of the 19 sources are cited at least once in this document.

---

*Document created: 2026-03-07 | Phase 607 Plan 01 | PNW Rainforest Biodiversity v1.49.22*
*Shared schemas: [00-shared-schemas.md](./00-shared-schemas.md)*
*Survey modules synthesized: [01-flora.md](./01-flora.md), [02-fauna.md](./02-fauna.md), [03-fungi.md](./03-fungi.md), [04-aquatic.md](./04-aquatic.md)*
