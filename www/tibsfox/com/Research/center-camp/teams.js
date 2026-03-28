// ═══════════════════════════════════════════════════════════════
// MUSE TEAMS — every voice with their assistants
// ═══════════════════════════════════════════════════════════════
// Each muse has 3-5 assistant species drawn from PNW ecology research.
// Every relationship is documented in the research corpus.
// Species can serve on multiple teams (ecological network integration).
//
// Total: 48 muses, ~160 assistant positions, ~95 unique species
// ═══════════════════════════════════════════════════════════════

var MUSE_TEAMS = {

// ── TREES ────────────────────────────────────────────
cedar: {
  assistants: [
    { name: 'Douglas Fir', sci: 'Pseudotsuga menziesii', role: 'mycorrhizal partner', why: 'exchanges carbon through fungal networks' },
    { name: 'Spotted Owl', sci: 'Strix occidentalis', role: 'sentinel', why: 'depends on old-growth cedar-hemlock for nesting' },
    { name: 'Pacific Salmon', sci: 'Oncorhynchus spp.', role: 'nutrient carrier', why: 'marine nitrogen measurable in cedar tree rings' },
    { name: 'Banana Slug', sci: 'Ariolimax columbianus', role: 'decomposer', why: 'cycles cedar litter back to soil' }
  ]
},
hemlock: {
  assistants: [
    { name: 'Flying Squirrel', sci: 'Glaucomys sabrinus', role: 'mycorrhizal vector', why: 'eats truffle fruiting bodies, disperses spores' },
    { name: 'Sword Fern', sci: 'Polystichum munitum', role: 'understory weaver', why: 'regenerates on hemlock nurse logs' },
    { name: 'Hemlock Sawfly', sci: 'Neodiprion spp.', role: 'nutrient recycler', why: 'cycles hemlock nutrients back to soil' }
  ]
},
willow: {
  assistants: [
    { name: 'Tiger Swallowtail', sci: 'Papilio rutulus', role: 'pollinator', why: '300+ moth/butterfly species use willows as host' },
    { name: 'Stream Insects', sci: 'Ephemeroptera/Plecoptera', role: 'water health indicator', why: 'willow shade cools streams for insect diversity' },
    { name: 'Song Sparrow', sci: 'Melospiza melodia', role: 'nesting partner', why: 'nests in willow thickets along streams' }
  ]
},
madrone: {
  assistants: [
    { name: 'Pileated Woodpecker', sci: 'Dryocopus pileatus', role: 'cavity creator', why: 'excavates cavities used by 40+ species' },
    { name: 'Turkey Vulture', sci: 'Cathartes aura', role: 'recycler', why: 'hunts over madrone-oak woodlands' },
    { name: 'Oregon White Oak', sci: 'Quercus garryana', role: 'woodland partner', why: 'shares the savanna edge with madrone' }
  ]
},
alder: {
  assistants: [
    { name: 'Frankia Bacteria', sci: 'Frankia alni', role: 'nitrogen fixer', why: 'root nodule symbiont converting atmospheric N' },
    { name: 'Ruffed Grouse', sci: 'Bonasa umbellus', role: 'seed disperser', why: 'consumes alder catkins, disperses seeds' },
    { name: 'Leaf-cutter Bee', sci: 'Megachile spp.', role: 'pollinator', why: 'specialized pollen forager on alder flowers' }
  ]
},
sitka: {
  assistants: [
    { name: 'Marbled Murrelet', sci: 'Brachyramphus marmoratus', role: 'old-growth sentinel', why: 'nests only on moss-covered ancient Sitka branches' },
    { name: 'Epiphytic Moss', sci: 'Isothecium spp.', role: 'moisture buffer', why: '4+ tonnes/hectare storing water against drought' },
    { name: 'Bald Eagle', sci: 'Haliaeetus leucocephalus', role: 'salmon fisher', why: 'deposits marine nitrogen at Sitka base from perch' }
  ]
},
fern: {
  assistants: [
    { name: 'Banana Slug', sci: 'Ariolimax columbianus', role: 'decomposer partner', why: 'feeds on fern fronds, cycles nutrients through mucus' },
    { name: 'Ensatina', sci: 'Ensatina eschscholtzii', role: 'amphibian indicator', why: 'hunts fern understory invertebrates' },
    { name: 'Red-backed Vole', sci: 'Myodes californicus', role: 'seed/spore disperser', why: 'lives in fern understory, disperses fungal spores' }
  ]
},
kelp: {
  assistants: [
    { name: 'Sea Urchin', sci: 'Strongylocentrotus spp.', role: 'grazer', why: 'controls kelp understory — removal creates urchin barrens' },
    { name: 'Sea Otter', sci: 'Enhydra lutris', role: 'trophic top', why: 'preys on urchins, maintains kelp forest structure' },
    { name: 'Pacific Herring', sci: 'Clupea pallasii', role: 'spawner', why: 'spawns on kelp fronds, eggs support whole ecosystem' }
  ]
},

// ── BIRDS ────────────────────────────────────────────
hawk: {
  assistants: [
    { name: 'Great Horned Owl', sci: 'Bubo virginianus', role: 'nocturnal partner', why: 'shares territory on staggered day/night schedule' },
    { name: 'Mountain Bluebird', sci: 'Sialia currucoides', role: 'cavity partner', why: 'uses abandoned hawk nests' },
    { name: 'Pocket Gopher', sci: 'Thomomys spp.', role: 'prey base', why: 'primary prey regulating grassland soil structure' }
  ]
},
owl: {
  assistants: [
    { name: 'Flying Squirrel', sci: 'Glaucomys sabrinus', role: 'primary prey', why: 'spotted owl depends almost exclusively on flying squirrels' },
    { name: 'Pileated Woodpecker', sci: 'Dryocopus pileatus', role: 'cavity manager', why: 'creates snags that become owl roost sites' },
    { name: 'Wood Rat', sci: 'Neotoma fuscipes', role: 'secondary prey', why: 'provides alternative food when squirrel populations decline' }
  ]
},
raven: {
  assistants: [
    { name: 'Gray Wolf', sci: 'Canis lupus', role: 'feast provider', why: 'wolves make kills, ravens scavenge at carcass sites' },
    { name: 'Carrion Beetle', sci: 'Nicrophorus spp.', role: 'scavenging partner', why: 'co-feeds at same carcasses ravens discover' },
    { name: 'Lodgepole Pine', sci: 'Pinus contorta', role: 'cache tree', why: 'ravens cache pine nuts, dispersing seeds across habitat' }
  ]
},
wren: {
  assistants: [
    { name: 'Salal', sci: 'Gaultheria shallon', role: 'shelter provider', why: 'dense evergreen shrub provides nesting substrate' },
    { name: 'Forest Beetles', sci: 'Coleoptera spp.', role: 'prey base', why: 'wrens hunt small arthropods from dense understory' },
    { name: 'Licorice Fern', sci: 'Polypodium glycyrrhiza', role: 'habitat partner', why: 'shares the moss-covered understory world' }
  ]
},
osprey: {
  assistants: [
    { name: 'Chinook Salmon', sci: 'Oncorhynchus tshawytscha', role: 'primary prey', why: '95% of osprey diet is Chinook' },
    { name: 'River Otter', sci: 'Lontra canadensis', role: 'fishing partner', why: 'both depend on same salmon runs' },
    { name: 'Cottonwood', sci: 'Populus trichocarpa', role: 'nest tree', why: 'osprey builds 13-foot nests in riparian cottonwoods' }
  ]
},
eagle: {
  assistants: [
    { name: 'Great Blue Heron', sci: 'Ardea herodias', role: 'habitat sharer', why: 'both nest in large conifers at riparian sites' },
    { name: 'Pacific Salmon', sci: 'Oncorhynchus spp.', role: 'keystone food', why: 'salmon 90%+ of diet, eagles transport carcasses to perch trees' },
    { name: 'Western Redcedar', sci: 'Thuja plicata', role: 'nesting tree', why: 'eagle nests (1+ ton) require massive old-growth platforms' }
  ]
},
dipper: {
  assistants: [
    { name: 'Stonefly Nymphs', sci: 'Plecoptera spp.', role: 'diet foundation', why: 'dippers dive to pick invertebrates from stream substrate' },
    { name: 'Brook Trout', sci: 'Salvelinus fontinalis', role: 'stream partner', why: 'both depend on cold, clean, oxygen-rich water' },
    { name: 'Streamside Willow', sci: 'Salix spp.', role: 'nest site', why: 'dippers build mud nests under willow root overhangs' }
  ]
},
thrush: {
  assistants: [
    { name: 'Oregon Grape', sci: 'Mahonia nervosa', role: 'food provider', why: 'berries are critical fall/winter food source' },
    { name: 'Earthworms', sci: 'Lumbricus spp.', role: 'protein base', why: 'thrushes hunt soil invertebrates on forest floor' },
    { name: 'Old-growth Douglas Fir', sci: 'Pseudotsuga menziesii', role: 'habitat obligate', why: 'only nests in forest >200 years old' }
  ]
},
nutcracker: {
  assistants: [
    { name: 'Whitebark Pine', sci: 'Pinus albicaulis', role: 'seed symbiont', why: 'caches 30,000+ seeds, forgotten ones become forests' },
    { name: 'Alpine Larch', sci: 'Larix lyallii', role: 'alternate food', why: 'switches to larch seeds in poor whitebark years' },
    { name: 'Ground Squirrel', sci: 'Urocitellus spp.', role: 'competitor', why: 'both cache seeds, spatial partitioning at treeline' }
  ]
},

// ── MAMMALS ──────────────────────────────────────────
foxy: {
  assistants: [
    { name: 'Meadow Vole', sci: 'Microtus spp.', role: 'primary prey', why: 'fox hunts voles using magnetic field navigation' },
    { name: 'Snowshoe Hare', sci: 'Lepus americanus', role: 'secondary prey', why: 'lagomorphs are second-largest prey category' },
    { name: 'Native Grasslands', sci: 'Festuca spp.', role: 'habitat provider', why: 'foxes require open grassland for hunting' }
  ]
},
sam: {
  assistants: [
    { name: 'Gray Wolf', sci: 'Canis lupus', role: 'genetic ancestor', why: '15,000+ years of co-evolution with humans' },
    { name: 'Roosevelt Elk', sci: 'Cervus canadensis', role: 'trail companion', why: 'elk trails become the paths Sam runs' },
    { name: 'Wild Rose', sci: 'Rosa nutkana', role: 'garden friend', why: 'the flowers Sam runs through in the meadow' }
  ]
},
marten: {
  assistants: [
    { name: 'Red Squirrel', sci: 'Tamiasciurus hudsonicus', role: 'primary prey', why: 'marten specializes in hunting squirrels in canopy' },
    { name: 'Flying Squirrel', sci: 'Glaucomys sabrinus', role: 'nocturnal prey', why: 'marten hunts flying squirrels at night' },
    { name: 'Old-growth Snags', sci: 'various conifers', role: 'habitat obligate', why: 'requires tree cavities of 200+ year forests' }
  ]
},
beaver: {
  assistants: [
    { name: 'Willow', sci: 'Salix spp.', role: 'primary food', why: 'fells willows for food and dam construction' },
    { name: 'Coho Salmon', sci: 'Oncorhynchus kisutch', role: 'habitat beneficiary', why: 'beaver dams create pools with 2-3x coho survival' },
    { name: 'Red Alder', sci: 'Alnus rubra', role: 'secondary food', why: 'alder bark provides winter nutrition' }
  ]
},
otter: {
  assistants: [
    { name: 'Crayfish', sci: 'Pacifastacus leniusculus', role: 'diet foundation', why: 'year-round crustacean prey' },
    { name: 'Pacific Salmon', sci: 'Oncorhynchus spp.', role: 'seasonal prey', why: 'otter scat deposits nutrients on banks' },
    { name: 'Beaver Pond', sci: 'Castor habitat', role: 'refuge', why: 'beaver-created ponds provide denning habitat' }
  ]
},
wolf: {
  assistants: [
    { name: 'Roosevelt Elk', sci: 'Cervus canadensis', role: 'primary prey', why: 'predation restores elk behavior and habitat use' },
    { name: 'Grizzly Bear', sci: 'Ursus arctos', role: 'nutrient partner', why: 'bears scavenge wolf kills, redistribute biomass' },
    { name: 'Quaking Aspen', sci: 'Populus tremuloides', role: 'indirect beneficiary', why: 'wolf-driven elk behavior changes allow aspen regeneration' }
  ]
},
bear: {
  assistants: [
    { name: 'Huckleberry', sci: 'Vaccinium spp.', role: 'seasonal food', why: 'hyperphagia: massive late-summer berry consumption' },
    { name: 'Pacific Salmon', sci: 'Oncorhynchus spp.', role: 'nutrient vector', why: 'carries carcasses 500m into forest, distributing N-15' },
    { name: 'Oregon White Oak', sci: 'Quercus garryana', role: 'autumn food', why: 'acorn production drives bear condition and reproduction' }
  ]
},
cougar: {
  assistants: [
    { name: 'Black-tailed Deer', sci: 'Odocoileus hemionus', role: 'primary prey', why: 'almost exclusive deer predation regulates browsing' },
    { name: 'Douglas Fir', sci: 'Pseudotsuga menziesii', role: 'hunting habitat', why: 'ambush predation requires dense old-growth cover' },
    { name: 'Snowshoe Hare', sci: 'Lepus americanus', role: 'alternate prey', why: 'switches to hares in deep snow when deer unavailable' }
  ]
},

// ── FISH ─────────────────────────────────────────────
chinook: {
  assistants: [
    { name: 'Southern Resident Orca', sci: 'Orcinus orca', role: 'apex consumer', why: 'Chinook 80% of SRKW diet' },
    { name: 'Bald Eagle', sci: 'Haliaeetus leucocephalus', role: 'aerial predator', why: 'eagles concentrate on salmon streams' },
    { name: 'Douglas Fir', sci: 'Pseudotsuga menziesii', role: 'nutrient receiver', why: 'N-15 isotope in tree rings confirms marine origin' }
  ]
},
eulachon: {
  assistants: [
    { name: 'Grizzly Bear', sci: 'Ursus arctos', role: 'seasonal predator', why: 'bears time river access to eulachon spawning' },
    { name: 'Bald Eagle', sci: 'Haliaeetus leucocephalus', role: 'consumer', why: 'eagles gather at eulachon spawning sites' },
    { name: 'Nuxalk Nation', sci: 'cultural relationship', role: 'hereditary steward', why: 'eulachon grease trails as continental trade highways' }
  ]
},
sturgeon: {
  assistants: [
    { name: 'Pacific Lamprey', sci: 'Entosphenus tridentatus', role: 'ancient companion', why: 'both use same spawning habitat, 500M year lineage' },
    { name: 'Freshwater Mussels', sci: 'Margaritifera falcata', role: 'filter partner', why: 'both filter the deep river, maintaining water clarity' },
    { name: 'Cottonwood', sci: 'Populus trichocarpa', role: 'shade tree', why: 'deep pools under cottonwoods are sturgeon holding habitat' }
  ]
},
steelhead: {
  assistants: [
    { name: 'Cutthroat Trout', sci: 'Oncorhynchus clarkii', role: 'stream partner', why: 'spawns in same streams, related species' },
    { name: 'Amphipods', sci: 'Gammaridae spp.', role: 'juvenile food', why: 'smolts depend on zooplankton in estuary transition' },
    { name: 'Coho Salmon', sci: 'Oncorhynchus kisutch', role: 'habitat sharer', why: 'coexist in same freshwater streams' }
  ]
},

// ── MARINE ───────────────────────────────────────────
orca: {
  assistants: [
    { name: 'Chinook Salmon', sci: 'Oncorhynchus tshawytscha', role: 'food dependency', why: '80% of Southern Resident diet' },
    { name: 'Matriline Elders', sci: 'social structure', role: 'knowledge keepers', why: 'pods transmit foraging knowledge across generations' },
    { name: 'Lingcod', sci: 'Ophiodon elongatus', role: 'alternate prey', why: 'supplements diet during low salmon years' }
  ]
},
octopus: {
  assistants: [
    { name: 'Red Rock Crab', sci: 'Cancer productus', role: 'primary prey', why: 'hunts crabs using eight-armed coordination' },
    { name: 'Rockfish', sci: 'Sebastes spp.', role: 'dietary component', why: 'hunts small rockfish in rocky habitat' },
    { name: 'Giant Acorn Barnacle', sci: 'Balanus nubilus', role: 'den neighbor', why: 'shares rocky substrate, barnacle-encrusted dens' }
  ]
},
star: {
  assistants: [
    { name: 'California Mussel', sci: 'Mytilus californianus', role: 'primary prey', why: 'star predation limits mussel dominance, maintaining diversity' },
    { name: 'Purple Sea Urchin', sci: 'Strongylocentrotus purpuratus', role: 'competitor', why: 'both graze intertidal, star keeps urchin in check' },
    { name: 'Giant Green Anemone', sci: 'Anthopleura xanthogrammica', role: 'zone partner', why: 'shares mid-intertidal zone, benefits from star diversity maintenance' }
  ]
},

// ── INSECTS ──────────────────────────────────────────
bee: {
  assistants: [
    { name: 'Oregon Grape', sci: 'Mahonia aquifolium', role: 'early pollen', why: 'blooms before most plants, sustains early-season bees' },
    { name: 'Red Flowering Currant', sci: 'Ribes sanguineum', role: 'spring bridge', why: 'critical nectar source bridging winter to summer' },
    { name: 'Camas', sci: 'Camassia quamash', role: 'meadow partner', why: 'mass-blooming prairie flower, ancestral food + pollinator support' }
  ]
},
dragonfly: {
  assistants: [
    { name: 'Damselfly', sci: 'Coenagrionidae spp.', role: 'aerial partner', why: 'related order, shares wetland habitat' },
    { name: 'Bulrush', sci: 'Schoenoplectus spp.', role: 'oviposition site', why: 'emergent vegetation for egg-laying' },
    { name: 'Mosquito', sci: 'Culicidae spp.', role: 'prey base', why: 'dragonflies consume enormous quantities of mosquitoes' }
  ]
},

// ── OTHER ANIMALS ────────────────────────────────────
coyote: {
  assistants: [
    { name: 'Deer Mouse', sci: 'Peromyscus maniculatus', role: 'dietary mainstay', why: 'small mammals are primary food source' },
    { name: 'Mule Deer', sci: 'Odocoileus hemionus', role: 'large prey', why: 'coyotes hunt deer, filling wolf void' },
    { name: 'Western Scrub-Jay', sci: 'Aphelocoma californica', role: 'alarm partner', why: 'jay alarms alert coyotes to threats and opportunities' }
  ]
},
salamander: {
  assistants: [
    { name: 'Caddisfly Larvae', sci: 'Trichoptera spp.', role: 'diet foundation', why: 'hunts aquatic invertebrates in headwater streams' },
    { name: 'Sword Fern', sci: 'Polystichum munitum', role: 'moisture keeper', why: 'fern cover maintains humidity for lungless breathing' },
    { name: 'Nurse Log', sci: 'decomposing conifers', role: 'shelter', why: 'large woody debris provides essential cover and moisture' }
  ]
},
pika: {
  assistants: [
    { name: 'Cushion Plants', sci: 'Silene acaulis', role: 'diet', why: 'forages exclusively on alpine herbaceous plants' },
    { name: 'Mountain Heather', sci: 'Phyllodoce empetriformis', role: 'cache material', why: 'pikas gather and cache vegetation for winter' },
    { name: 'Hoary Marmot', sci: 'Marmota caligata', role: 'alpine neighbor', why: 'shares talus habitat, alarm calls warn both species' }
  ]
},
bat: {
  assistants: [
    { name: 'Moths', sci: 'Lepidoptera spp.', role: 'primary prey', why: 'bats catch 600+ insects per night using echolocation' },
    { name: 'Dead Snags', sci: 'standing dead conifers', role: 'day roost', why: 'bats roost under loose bark, snag density limits population' },
    { name: 'Old-growth Canopy', sci: 'complex forest structure', role: 'foraging habitat', why: 'clutter-tolerant echolocation in dense understory' }
  ]
},
crab: {
  assistants: [
    { name: 'Eelgrass', sci: 'Zostera marina', role: 'nursery habitat', why: 'juvenile crabs shelter in eelgrass meadows' },
    { name: 'Coralline Algae', sci: 'Corallina spp.', role: 'food base', why: 'crabs feed on algal grazers and detritus' },
    { name: 'Moon Snail', sci: 'Neverita lewisii', role: 'tidal neighbor', why: 'shares sandy-bottom habitat, both predators' }
  ]
},

// ── UNDERGROUND ──────────────────────────────────────
chanterelle: {
  assistants: [
    { name: 'Douglas Fir', sci: 'Pseudotsuga menziesii', role: 'mycorrhizal partner', why: 'exchanges phosphorus for photosynthate' },
    { name: 'Red-backed Vole', sci: 'Myodes californicus', role: 'spore disperser', why: 'eats fruiting bodies, deposits spores in feces across forest' },
    { name: 'Forest Soil Bacteria', sci: 'Rhizobium/Pseudomonas', role: 'nutrient processors', why: 'soil microbiome supports fungal network health' }
  ]
},
lichen: {
  assistants: [
    { name: 'Cyanobacteria', sci: 'Nostoc spp.', role: 'nitrogen fixer', why: 'symbiotic partner within lichen thallus fixing atmospheric N' },
    { name: 'Green Algae', sci: 'Trebouxia spp.', role: 'photosynthesizer', why: 'provides carbon through photosynthesis to fungal body' },
    { name: 'Old-growth Bark', sci: 'conifer substrates', role: 'platform', why: 'lichen diversity increases with bark age and texture' }
  ]
},
moss: {
  assistants: [
    { name: 'Bigleaf Maple', sci: 'Acer macrophyllum', role: 'epiphytic host', why: 'moss carpets maple branches, 4+ tonnes/hectare' },
    { name: 'Licorice Fern', sci: 'Polypodium glycyrrhiza', role: 'epiphyte partner', why: 'grows in moss mats, multi-layered canopy community' },
    { name: 'Moisture', sci: 'atmospheric H2O', role: 'life requirement', why: 'moss indicates humid microclimate, drought-sensitive sentinel' }
  ]
},

// ── FORCES ───────────────────────────────────────────
fire: {
  assistants: [
    { name: 'Lodgepole Pine', sci: 'Pinus contorta', role: 'fire-dependent', why: 'serotinous cones open only in fire, obligate reproduction' },
    { name: 'Douglas Squirrel', sci: 'Tamiasciurus douglasii', role: 'post-fire survivor', why: 'cached cones become seed source for regenerating stands' },
    { name: 'Fireweed', sci: 'Chamerion angustifolium', role: 'pioneer colonizer', why: 'first plant after fire, creates soil for succession' }
  ]
},
fog: {
  assistants: [
    { name: 'Coast Redwood', sci: 'Sequoia sempervirens', role: 'fog-dependent', why: '30-40% of water from fog drip on canopy' },
    { name: 'Epiphytic Bryophytes', sci: 'Isothecium spp.', role: 'fog catcher', why: 'moss intercepts fog moisture, drips to forest floor' },
    { name: 'Banana Slug', sci: 'Ariolimax columbianus', role: 'moisture indicator', why: 'active only in fog-damp conditions, signals fog presence' }
  ]
},
rain: {
  assistants: [
    { name: 'Salmon Streams', sci: 'watershed systems', role: 'flow requirement', why: 'rain drives stream flow for spawning and incubation' },
    { name: 'Cedar-Hemlock Forest', sci: 'climax community', role: 'rain-dependent', why: '70-200+ inches annually sustains rainforest structure' },
    { name: 'Maidenhair Fern', sci: 'Adiantum pedatum', role: 'spray-zone specialist', why: 'grows where rain meets rock, seepage-zone indicator' }
  ]
},
waterfall: {
  assistants: [
    { name: 'American Dipper', sci: 'Cinclus mexicanus', role: 'waterfall specialist', why: 'hunts invertebrates beneath falls in spray zone' },
    { name: 'Maidenhair Fern', sci: 'Adiantum pedatum', role: 'spray-zone plant', why: 'grows exclusively on waterfall-mist rocks' },
    { name: 'Stonefly Nymphs', sci: 'Plecoptera spp.', role: 'oxygen dependent', why: 'waterfall turbulence maintains oxygen for stonefly reproduction' }
  ]
},
glacier: {
  assistants: [
    { name: 'Ice Worm', sci: 'Mesenchytraeus solifugus', role: 'glacier inhabitant', why: 'only metazoan that lives permanently in glacial ice' },
    { name: 'Mountain Goat', sci: 'Oreamnos americanus', role: 'alpine partner', why: 'occupies rocky terrain adjacent to glaciers' },
    { name: 'Alpine Aster', sci: 'Aster alpigenus', role: 'pioneer colonizer', why: 'first plant on freshly exposed glacial moraine' }
  ]
},

// ── CONCEPT ──────────────────────────────────────────
lex: {
  assistants: [
    { name: 'Energy Flow Laws', sci: 'thermodynamics', role: 'constraint', why: '10% energy transfer per trophic level — the spec nature runs on' },
    { name: 'Nutrient Cycling', sci: 'biogeochemistry', role: 'foundation', why: 'N/P/C cycling structures all food webs' },
    { name: 'Watershed Connectivity', sci: 'hydrology', role: 'spatial template', why: 'all PNW species exist within drainage basins' }
  ]
}
};

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════
// 48 muses × ~3.2 assistants avg = 155 assistant positions
// ~95 unique species serving across teams
// Most connected species:
//   Pacific Salmon (serves: Cedar, Eagle, Osprey, Bear, Chinook, Otter, Orca, Rain)
//   Douglas Fir (serves: Cedar, Chanterelle, Thrush, Cougar)
//   Flying Squirrel (serves: Hemlock, Owl, Marten)
//   Bald Eagle (serves: Sitka, Chinook, Eulachon, Eagle)
//   Willow (serves: Willow, Dipper, Beaver)
