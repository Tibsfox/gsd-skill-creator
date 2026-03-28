// ═══════════════════════════════════════════════════════════════
// NEW TRAILS — 22 deep knowledge trails through the research forest
// ═══════════════════════════════════════════════════════════════
// Each trail has a muse guide, a theme, and 4-5 waypoints linking
// to real research projects. These extend the 10 trails in deep-trails.html.
// ═══════════════════════════════════════════════════════════════

var NEW_TRAILS = [
{ id:1, name:'The Pollinator Crisis', guide:'wren', color:'#d4a017', theme:'Native bees are vanishing — and the forests feel it first', waypoints:[
  { title:'The Silent Meadow', text:'Native bumble bee populations in the PNW have declined 57% since 1990. Bombus occidentalis, once the most common bumble bee west of the Cascades, is now a candidate for Endangered Species Act listing.', project:'ECO' },
  { title:'The Huckleberry Connection', text:'Huckleberries depend on bumble bees for 90% of pollination. Without native pollinators, the berry crops that feed bears, birds, and Indigenous harvest traditions collapse within a generation.', project:'GDN' },
  { title:'The Neonicotinoid Trail', text:'Imidacloprid persists in PNW forest soils for 1,000+ days. A single treated seed produces enough residue in one sunflower to kill a foraging bee — the dose arrives through pollen, not spray.', project:'BPS' },
  { title:'The Mason Bee Alternative', text:'Osmia lignaria, the blue orchard mason bee, pollinates 2,000 flowers per day — 100x the rate of a honeybee. PNW orchardists increasingly rely on native mason bees rather than imported European hives.', project:'AVI' },
  { title:'The Corridor Fix', text:'Pollinator corridors along PNW power line rights-of-way now connect 12,000 acres of native wildflower habitat. Bonneville Power Administration manages these strips as functional ecosystem bridges.', project:'AWF' }
]},
{ id:2, name:'The Urchin Barren', guide:'kelp', color:'#2a8a96', theme:'When the otters vanished, the kelp forests fell', waypoints:[
  { title:'The Trophic Cascade', text:'Sea otters eat 25% of their body weight daily in sea urchins. When fur traders removed 300,000 otters by 1911, urchin populations exploded 100-fold along the Pacific coast.', project:'MAM' },
  { title:'The Barren Zone', text:'Purple sea urchins can strip a kelp forest to bare rock in 18 months. Off Northern California and Oregon, urchin barrens now cover 90% of former bull kelp habitat since 2014.', project:'ECO' },
  { title:'The Sunflower Star', text:'Sunflower sea stars once consumed 5 urchins per day. Sea star wasting disease killed 90% of them between 2013-2017 — the largest marine wildlife die-off ever recorded in the Pacific.', project:'SAL' },
  { title:'The Carbon Forest', text:'Kelp forests sequester up to 20x more carbon per acre than terrestrial forests. Bull kelp grows 10 cm per day, reaching 30 meters in a single season — the fastest-growing organism in the sea.', project:'COL' },
  { title:'The Return', text:'Sea otter reintroduction at Olympic Coast increased kelp canopy 300% within a decade. The otters are ecosystem engineers — their return rebuilds the entire marine food web from the substrate up.', project:'AWF' }
]},
{ id:3, name:'The Grease Trail Economy', guide:'chinook', color:'#c8b890', theme:'Eulachon oil built the first trade network on the Pacific coast', waypoints:[
  { title:'The Liquid Gold', text:'Eulachon (candlefish) are so oil-rich they burn like candles when dried. A single eulachon is 20% fat by weight — more energy-dense than any other Pacific fish, and the basis of First Nations coastal economy.', project:'SAL' },
  { title:'The Trade Routes', text:'Grease trails carried rendered eulachon oil 300 km inland from the coast. The Nuxalk-Carrier trail through the Coast Range predates European contact by 5,000+ years — the oldest maintained trade route in North America.', project:'TIBS' },
  { title:'The Collapse', text:'Fraser River eulachon runs declined 98% between 1990 and 2010. Industrial bycatch, ocean warming, and habitat loss combined to destroy a trade network that had operated for millennia.', project:'FFA' },
  { title:'The Living Highway', text:'Grease trails follow river corridors that also carry salmon, connect bear denning sites, and link eagle nesting territories. The trade route IS the ecosystem — the economy mapped the ecology.', project:'ECO' }
]},
{ id:4, name:'The Beaver Comeback', guide:'beaver', color:'#7a6a3a', theme:'The original ecosystem engineers are rebuilding the PNW watershed', waypoints:[
  { title:'The Lost Millions', text:'Before the fur trade, an estimated 200 million beavers maintained 25 million dams across North America. By 1900, trapping had reduced them to 100,000 — eliminating the continent\'s primary hydrological infrastructure.', project:'MAM' },
  { title:'The Water Table', text:'A single beaver dam raises the local water table by 1-3 meters and stores 5,000-10,000 cubic meters of water. PNW streams with beaver dams maintain summer flows 40% higher than undammed reaches.', project:'COL' },
  { title:'The Salmon Nursery', text:'Beaver ponds create slow-water habitat that juvenile coho salmon need to survive their first winter. Streams with beaver dams produce 2-3x more smolts per kilometer than channelized streams.', project:'SAL' },
  { title:'The Fire Break', text:'Beaver-dammed valleys in the 2020 Oregon fires retained green vegetation while surrounding hillsides burned. Satellite imagery confirmed beaver complexes acted as fire refugia across 12 separate fire perimeters.', project:'AWF' },
  { title:'The Restoration Model', text:'Washington\'s Methow Valley beaver relocation program moved 350 beavers to fire-damaged watersheds. Within 3 years, relocated beavers built 1,200 dams and restored 40 km of degraded stream habitat.', project:'GDN' }
]},
{ id:5, name:'The Acoustic Ecology', guide:'wren', color:'#5eb8c4', theme:'Every ecosystem has a soundscape — and silence means something broke', waypoints:[
  { title:'The Biophony', text:'Bernie Krause recorded PNW old-growth soundscapes for 40 years. Each species occupies a unique acoustic frequency band — a spectral niche. When a species disappears, its frequency slot goes silent.', project:'AVI' },
  { title:'The Anthrophony', text:'Road noise from Highway 101 reduces bird detection distances by 70% in Olympic forest. Spotted owls abandon territories within 500 meters of chronic noise above 45 dB — roughly the volume of a conversation.', project:'SHE' },
  { title:'The Dawn Chorus Index', text:'The number of species singing at dawn correlates with ecosystem health. PNW old-growth forests host 15-22 dawn chorus species. Second-growth forests average 6-8. Tree plantations average 3-4.', project:'ECO' },
  { title:'The Underwater Sound', text:'Orca echolocation clicks reach 230 dB — louder than a jet engine. Ship noise in the Salish Sea masks orca communication across 97% of their critical habitat, forcing whales to call louder and less often.', project:'MAM' }
]},
{ id:6, name:'The Volcanic Ring', guide:'fire', color:'#c75b3a', theme:'The Cascades are young volcanoes on a live subduction zone', waypoints:[
  { title:'The Subduction Engine', text:'The Juan de Fuca plate slides beneath North America at 4 cm per year. This subduction powers every Cascade volcano from Lassen to Baker — 13 major stratovolcanoes in a 1,100 km arc.', project:'THE' },
  { title:'The Lahar Clock', text:'Mount Rainier\'s Osceola Mudflow 5,600 years ago buried 550 km2 of Puget Sound lowland under 30 meters of debris. The same valleys now hold 100,000+ people. The next lahar is a matter of when, not if.', project:'HGE' },
  { title:'The Renewal Zone', text:'Mount St. Helens\' 1980 blast zone hosts 350+ plant species today. Lupines were first colonizers — their nitrogen fixation rebuilt soil fertility. The eruption created the most studied ecological succession on Earth.', project:'GDN' },
  { title:'The Geothermal Gift', text:'Newberry Volcanic Monument\'s hot springs maintain 40C year-round, supporting thermophilic bacteria communities found nowhere else. The geothermal gradient beneath the Cascades holds 5,000+ MW of extractable energy.', project:'ROF' }
]},
{ id:7, name:'The Timber Wars', guide:'eagle', color:'#4a7c3f', theme:'The spotted owl battle redefined the relationship between forests and economy', waypoints:[
  { title:'The Old Growth Fraction', text:'In 1800, the PNW held 30 million acres of old-growth forest. By 1990, 90% had been logged. The remaining 10% contained 80% of the region\'s terrestrial biodiversity — including the northern spotted owl.', project:'COL' },
  { title:'The Injunction', text:'Judge William Dwyer\'s 1991 injunction halted logging on 24 million acres of federal forest to protect spotted owl habitat. It was the largest court-ordered land management change in U.S. history.', project:'AWF' },
  { title:'The Northwest Forest Plan', text:'The 1994 Northwest Forest Plan set aside 80% of remaining old-growth as reserves. Timber harvest dropped 80% — from 5 billion board feet annually to under 1 billion. 30,000 mill jobs disappeared in a decade.', project:'CAS' },
  { title:'The Barred Owl Problem', text:'Barred owls expanded westward across Canada and now outcompete spotted owls across 80% of their range. The spotted owl\'s population drops 3.8% per year despite habitat protection — the threat shifted.', project:'AVI' }
]},
{ id:8, name:'The Dam Removal', guide:'steelhead', color:'#3a7ac7', theme:'The largest dam removals in history are happening in the PNW right now', waypoints:[
  { title:'The Elwha Experiment', text:'The 2011-2014 removal of two Elwha River dams released 24 million cubic yards of sediment trapped for a century. The river rebuilt its delta by 80 acres in 3 years — geology happening in real time.', project:'ROF' },
  { title:'The Salmon Return', text:'Within 5 years of the Elwha dam removal, 4,000 Chinook spawned above the former dam sites. Steelhead, bull trout, and coho followed. Seventy miles of river habitat reopened after 100 years of closure.', project:'SAL' },
  { title:'The Klamath Next', text:'The 2024 removal of four Klamath River dams is the largest dam removal project in world history. It reopens 400 miles of salmon habitat and restores Yurok and Karuk tribal fisheries eliminated since 1918.', project:'TIBS' },
  { title:'The Snake River Question', text:'The four lower Snake River dams generate 1,000 MW but block 5,500 miles of spawning habitat. Removing them could recover 13 ESA-listed salmon and steelhead runs — the largest fish restoration opportunity remaining.', project:'HGE' }
]},
{ id:9, name:'The Urban Coyote', guide:'coyote', color:'#9b8a4a', theme:'The most adaptable predator in North America now lives in every PNW city', waypoints:[
  { title:'The Range Expansion', text:'Coyotes occupied every major PNW city by 2000. Portland\'s Forest Park hosts 15-20 resident coyotes. Seattle\'s Discovery Park pack has been studied continuously since 2008 — the longest urban coyote study on the West Coast.', project:'MAM' },
  { title:'The Diet Shift', text:'Urban coyotes eat 40% human-associated food (fruit trees, pet food, garbage) and 60% natural prey (rats, rabbits, voles). They reduce urban rat populations by 30-50% — more effective than any pest control program.', project:'ECO' },
  { title:'The Coexistence Protocol', text:'Portland\'s coyote hazing program reduced conflicts 68% in 3 years. The key insight: coyotes that have never been hazed approach humans within 5 meters. Hazed coyotes maintain 50+ meter flight distances.', project:'AWF' },
  { title:'The Mesopredator Release', text:'Where coyotes are removed, raccoon and feral cat populations explode 3-5x. Raccoon-vectored distemper and cat-driven bird mortality both increase. The coyote is the keystone predator of the urban ecosystem.', project:'AVI' }
]},
{ id:10, name:'The Whale Song Highway', guide:'orca', color:'#1a5c8a', theme:'The Salish Sea is a corridor for the longest-studied orca population on Earth', waypoints:[
  { title:'The Resident Pods', text:'Southern Resident orcas (J, K, L pods) have been photo-identified since 1976 — every individual known by name. As of 2025, 73 individuals remain. They eat exclusively Chinook salmon and nothing else.', project:'MAM' },
  { title:'The Acoustic Identity', text:'Each orca pod has a unique dialect — a set of 7-17 discrete calls passed from mother to calf. J pod and L pod share some calls but K pod\'s dialect is distinct. Cultural transmission, not genetics, defines the group.', project:'FFA' },
  { title:'The Salmon Dependency', text:'Southern Residents need 350,000 Chinook per year to sustain themselves. Fraser River Chinook runs have declined 60% since 1990. The orcas are literally starving — they burn their own blubber, releasing stored toxins.', project:'SAL' },
  { title:'The Noise Crisis', text:'Vessel noise in Haro Strait reduces orca foraging efficiency by 25%. Whale-watching boats within 400 meters cause behavioral disruption in 75% of encounters. In 2019, Washington mandated 300-yard approach distances.', project:'SHE' }
]},
{ id:11, name:'The Moss Cathedral', guide:'moss', color:'#5a8a4a', theme:'The Hoh Rainforest holds more biomass per acre than any ecosystem on Earth', waypoints:[
  { title:'The Epiphyte Load', text:'A single bigleaf maple in the Hoh Valley supports 35 kg of epiphytic moss — enough to hold 200 liters of water. The moss acts as a suspended soil layer, hosting ferns, lichens, and even other trees rooted in mid-air.', project:'COL' },
  { title:'The Fog Harvest', text:'Epiphytic moss captures fog drip and adds 25-35% to the forest\'s effective precipitation. During summer dry periods, moss-drip is the primary water source for ground-level plants. The canopy waters the floor.', project:'ECO' },
  { title:'The Nitrogen Factory', text:'Cyanolichen (Lobaria oregana) on old-growth branches fixes 2-5 kg of atmospheric nitrogen per hectare per year. When branches fall, this nitrogen fertilizes the forest floor — the canopy feeds the soil.', project:'GDN' },
  { title:'The Carbon Sponge', text:'PNW temperate rainforests store 500-2,000 tonnes of carbon per hectare — exceeding tropical rainforests. The moss layer alone accounts for 10-15% of this storage. Preserving old-growth is the most efficient carbon strategy on Earth.', project:'COL' }
]},
{ id:12, name:'The Lightning Trail', guide:'fire', color:'#d4881a', theme:'Fire shaped every PNW forest — suppression broke the cycle', waypoints:[
  { title:'The Natural Regime', text:'Before fire suppression, PNW dry forests burned every 7-25 years. Low-intensity fire cleared understory, recycled nutrients, and maintained open stands. Ponderosa pine bark evolved 10 cm thick specifically to survive these fires.', project:'CAS' },
  { title:'The Suppression Debt', text:'A century of fire suppression increased PNW forest fuel loads 5-10x. Forests that historically held 40-60 trees per acre now hold 400-600. Every suppressed fire makes the next one more catastrophic.', project:'AWF' },
  { title:'The Megafire Era', text:'The 2020 Oregon Labor Day fires burned 1 million acres in 72 hours — more than the previous 10 years combined. Wind-driven crown fires in fuel-loaded stands produced fire behavior that no suppression force can contain.', project:'THE' },
  { title:'The Indigenous Fire', text:'Kalapuya, Siletz, and other PNW tribes used prescribed fire for 10,000+ years to maintain prairies, improve berry crops, and manage game habitat. Fire suppression was colonization\'s ecological weapon — it broke the land management system that worked.', project:'TIBS' }
]},
{ id:13, name:'The Tidal Clock', guide:'crab', color:'#6a9abc', theme:'Every estuary runs on a 12-hour 25-minute cycle that never stops', waypoints:[
  { title:'The Lunar Engine', text:'Pacific tides follow a mixed semidiurnal pattern — two highs and two lows daily, but unequal in height. The tidal range at Anchorage is 12 meters; at Puget Sound 3-4 meters. The Moon pulls the schedule.', project:'BPS' },
  { title:'The Intertidal Zones', text:'Rocky intertidal zones compress an entire ecosystem into 3 vertical meters. Each 30 cm of elevation change creates a distinct community. Sea stars, mussels, barnacles, and anemones partition space by minutes of air exposure per day.', project:'ECO' },
  { title:'The Estuary Nursery', text:'80% of PNW commercial fish species spend critical juvenile stages in estuaries. Willapa Bay produces 10% of U.S. oyster harvest. Grays Harbor hosts 500,000 shorebirds during spring migration — all timed to tidal cycles.', project:'SAL' },
  { title:'The Tidal Energy', text:'Puget Sound\'s Tacoma Narrows channel moves 2 million cubic meters of water per tidal cycle. The kinetic energy in PNW tidal flows could generate 600 MW — enough to power Seattle, captured from lunar gravity alone.', project:'ROF' }
]},
{ id:14, name:'The Migration Highway', guide:'hawk', color:'#c8a040', theme:'The Pacific Flyway funnels 1 billion birds through PNW airspace twice a year', waypoints:[
  { title:'The Flyway Funnel', text:'The Pacific Flyway channels migratory birds between Arctic breeding grounds and Central American wintering areas. The Cascade Range and Pacific coast compress flight paths into corridors 50-100 km wide.', project:'AVI' },
  { title:'The Shorebird Marathon', text:'Bar-tailed godwits fly 11,000 km nonstop from Alaska to New Zealand — the longest non-stop flight of any animal. They pass through PNW airspace at 10,000 meters, burning 50% of their body weight in 8 days.', project:'AVI' },
  { title:'The Raptor River', text:'Bonney Butte in Oregon counts 3,000-5,000 migrating raptors each fall. Cooper\'s hawks, sharp-shinned hawks, and red-tails ride thermal columns along the Cascade crest like an aerial highway.', project:'MAM' },
  { title:'The Stopover Crisis', text:'Estuarine stopover habitat has declined 70% since 1900. Western sandpipers that cannot refuel at Grays Harbor or Willapa Bay arrive at breeding grounds 15% lighter — too depleted to breed successfully.', project:'AWF' }
]},
{ id:15, name:'The Root Network', guide:'fern', color:'#6a9a5a', theme:'The wood wide web connects every tree in the forest through fungal highways', waypoints:[
  { title:'The Mycorrhizal Mesh', text:'One cubic centimeter of PNW forest soil contains 1-10 km of fungal hyphae. 95% of PNW conifers depend on ectomycorrhizal fungi for phosphorus uptake. The fungi get carbon in return — a 400-million-year-old deal.', project:'COL' },
  { title:'The Mother Tree', text:'Suzanne Simard\'s research in BC interior Douglas-fir forests proved that mature trees send carbon and nutrients to seedlings through mycorrhizal networks. A single mother tree connects to 47 other trees on average.', project:'ECO' },
  { title:'The Warning System', text:'When Douglas-fir trees are attacked by western spruce budworm, they send chemical signals through mycorrhizal networks. Connected neighbors upregulate defensive enzymes before the insects arrive. The forest has an immune system.', project:'CAS' },
  { title:'The Carbon Pipeline', text:'Dying trees dump their stored carbon into the mycorrhizal network in the weeks before death. Neighboring trees absorb this carbon pulse. The forest redistributes resources from the dying to the living — metabolic solidarity.', project:'GDN' }
]},
{ id:16, name:'The Color Trail', guide:'madrone', color:'#c75b3a', theme:'PNW nature produces every pigment from structural blue to carotenoid gold', waypoints:[
  { title:'The Structural Blue', text:'Steller\'s jay feathers contain zero blue pigment. The color comes from nanostructured keratin that scatters short wavelengths — coherent back-scattering, not dye. Crush the feather and the blue disappears. The structure IS the color.', project:'AVI' },
  { title:'The Madrone Bark', text:'Pacific madrone sheds its outer bark to reveal cinnamon-red photosynthetic inner bark. It is one of few trees that photosynthesizes through its trunk. The color is chlorophyll behind carotenoid and anthocyanin filters.', project:'COL' },
  { title:'The Lichen Palette', text:'PNW lichens produce 800+ unique chemical compounds, many of which are pigments. Letharia vulpina (wolf lichen) produces vulpinic acid — a brilliant chartreuse compound toxic enough to poison wolves.', project:'ECO' },
  { title:'The Salmon Red', text:'Sockeye salmon turn crimson using astaxanthin — a carotenoid pigment concentrated from marine algae through the food chain. The red signals reproductive fitness. The deeper the red, the more energy stored in the flesh.', project:'SAL' }
]},
{ id:17, name:'The Shelter Trail', guide:'beaver', color:'#7a6a3a', theme:'From beaver lodges to bald-faced hornets, PNW animals are master architects', waypoints:[
  { title:'The Beaver Lodge', text:'A beaver lodge maintains 0C interior temperature when exterior air hits -30C. The walls are 1-meter-thick mud-and-stick insulation with underwater entrances that prevent predator access. R-value exceeds modern insulation.', project:'MAM' },
  { title:'The Pileated Cathedral', text:'Pileated woodpeckers excavate nesting cavities 50 cm deep in live old-growth snags. These cavities are later used by 40+ species — from wood ducks to flying squirrels. The woodpecker is the forest\'s housing contractor.', project:'AVI' },
  { title:'The Hornet Paper', text:'Bald-faced hornets build nests from wood fiber masticated into paper — a technology humans didn\'t replicate until 1844. A single nest contains 400 cells and 6 envelope layers with dead-air insulation between each.', project:'ECO' },
  { title:'The Caddisfly Case', text:'Caddisfly larvae build protective cases from stream gravel, sand, and plant fragments, each species using a signature material and architecture. The cases are engineering — hydrodynamically shaped to reduce drag in current.', project:'SAL' }
]},
{ id:18, name:'The Medicine Trail', guide:'cedar', color:'#4a7c3f', theme:'PNW Indigenous peoples used 300+ plant species as medicine — and the science confirms them', waypoints:[
  { title:'The Cedar Pharmacy', text:'Western red cedar bark contains thujone and thujaplicins — compounds with demonstrated antifungal and antibacterial properties. Coast Salish peoples used cedar preparations for respiratory infections, wounds, and arthritis for 10,000+ years.', project:'COL' },
  { title:'The Willow Aspirin', text:'Pacific willow bark contains salicin — the precursor to aspirin. PNW tribes used willow bark tea for pain and fever millennia before Bayer synthesized acetylsalicylic acid in 1897. The molecule was already in use.', project:'GDN' },
  { title:'The Devil\'s Club Shield', text:'Oplopanax horridus (devil\'s club) is the most widely used medicinal plant among PNW First Nations. Modern research confirms anti-diabetic, antimicrobial, and anti-tuberculosis properties in its root bark compounds.', project:'TIBS' },
  { title:'The Taxol Discovery', text:'Pacific yew bark yields paclitaxel (Taxol), one of the most important cancer drugs ever discovered. Found in 1967 from PNW forest samples. Now semi-synthesized, it treats ovarian, breast, and lung cancers worldwide.', project:'CAS' }
]},
{ id:19, name:'The Night Trail', guide:'owl', color:'#2a3a5c', theme:'Half the forest is alive only after dark — and most of it has never been counted', waypoints:[
  { title:'The Owl Shift', text:'PNW forests host 15 owl species occupying distinct nocturnal niches. Northern saw-whet owls hunt in dense understory, great horned owls patrol canopy edges, and barn owls work open clearings. The night forest has a roster.', project:'AVI' },
  { title:'The Bat Highway', text:'Little brown bats (Myotis lucifugus) consume 1,000 mosquitoes per hour using echolocation at 40-100 kHz. PNW bat populations face 90% mortality from white-nose syndrome — a fungal disease spreading westward since 2006.', project:'MAM' },
  { title:'The Bioluminescent Floor', text:'Foxfire (Armillaria ostoyae) in PNW old-growth produces bioluminescence visible on moonless nights. The same fungal species holds the record as the largest living organism — a single individual in Oregon covers 2,385 acres.', project:'ECO' },
  { title:'The Moth Migration', text:'PNW moth diversity exceeds butterfly diversity 10:1. The army cutworm moth migrates to alpine talus fields at 12,000 feet, where grizzly bears dig them from rocks — each moth is 72% fat, more calorie-dense than elk meat.', project:'CAS' }
]},
{ id:20, name:'The Ice Core Trail', guide:'glacier', color:'#7a9abc', theme:'PNW glaciers are melting archives — each layer a year of climate data', waypoints:[
  { title:'The Frozen Record', text:'Mount Rainier\'s Emmons Glacier — the largest glacier in the contiguous U.S. at 11.2 km2 — contains ice layers dating back 500+ years. Each annual layer records temperature, precipitation, volcanic ash, and atmospheric chemistry.', project:'HGE' },
  { title:'The Retreat', text:'PNW glaciers lost 25% of their area between 1900 and 2020. Mount Baker\'s Easton Glacier retreated 300 meters in the last 30 years. At current rates, most Cascade glaciers will disappear by 2100.', project:'THE' },
  { title:'The Water Tower', text:'Glacier meltwater provides 25-50% of late-summer streamflow in PNW mountain rivers. When glaciers disappear, August river temperatures will rise 2-4C — lethal for salmon that evolved in glacial water.', project:'SAL' },
  { title:'The Ash Layers', text:'PNW glacier cores contain visible ash bands from Mount St. Helens (1980), Novarupta (1912), and Krakatoa (1883). These tephra layers are precise chronological markers — volcanic clocks frozen in ice.', project:'ROF' }
]},
{ id:21, name:'The Seed Dispersal Trail', guide:'nutcracker', color:'#8a6a4a', theme:'Forests walk — one seed cache, one bird flight, one bear scat at a time', waypoints:[
  { title:'The Nutcracker Cache', text:'Clark\'s nutcracker caches 30,000 whitebark pine seeds per year in 5,000-10,000 separate locations. They recover 70% — the forgotten 30% become the next generation of trees. The bird plants the alpine forest.', project:'AVI' },
  { title:'The Bear Disperser', text:'A single black bear deposits 400,000 viable seeds per summer in scat piles across a 50 km2 home range. Berry seeds germinate 3x better after passing through bear digestive acids. Bears are the forest\'s gardeners.', project:'MAM' },
  { title:'The Wind Distance', text:'Douglas-fir seeds with their single wing rotate at 1-2 meters per second descent rate, traveling 100-400 meters from the parent tree. In strong winds, seeds reach 1.6 km — enough to colonize a burned slope in one dispersal event.', project:'CAS' },
  { title:'The Squirrel Forest', text:'Douglas squirrels bury 10,000+ conifer cones per year in midden piles. Forgotten caches in disturbed soil germinate into dense seedling clusters. The patchy structure of PNW second-growth forests maps squirrel territory boundaries.', project:'COL' }
]},
{ id:22, name:'The Extinction Trail', guide:'raven', color:'#5a3a5a', theme:'The PNW has already lost species — and the list is growing', waypoints:[
  { title:'The Columbian Mammoth', text:'Columbian mammoths roamed the PNW until 11,000 years ago. The Manis mastodon site near Sequim, WA, preserves a bone spear point embedded in a mastodon rib — the oldest evidence of human hunting in the PNW (13,900 BP).', project:'TIBS' },
  { title:'The Oregon Silverspot', text:'The Oregon silverspot butterfly (Speyeria zerene hippolyta) survives in 5 coastal prairie fragments totaling under 200 acres. Its larval food plant, the early blue violet, depends on fire-maintained grasslands that no longer burn.', project:'AWF' },
  { title:'The Marbled Murrelet', text:'Marbled murrelets nest on old-growth moss platforms 60 meters above the forest floor — a nesting behavior not confirmed by science until 1974. PNW populations declined 4.3% annually from 1992-2021 as nesting habitat was logged.', project:'AVI' },
  { title:'The Whitebark Pine Crisis', text:'Whitebark pine was listed as Threatened under the ESA in 2022. Mountain pine beetle, blister rust, and fire suppression have killed 50-90% of mature trees across their PNW range. Without them, Clark\'s nutcrackers leave — and the alpine ecosystem unravels.', project:'ECO' }
]}
];
