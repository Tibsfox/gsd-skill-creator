// ═══════════════════════════════════════════════════════════════
// PROJECT TEAMS — 75 research projects, each with a leader + helpers
// ═══════════════════════════════════════════════════════════════
// Every leader is a real PNW species whose biology mirrors the
// project's subject. Helpers have ecological relationships to leader.
// Total: 75 leaders + ~225 helpers = ~300 species positions
// ═══════════════════════════════════════════════════════════════

var PROJECT_TEAMS = {

// ═══════════ PNW ECOLOGY (13) ═══════════

COL: { name: 'Columbia Valley Rainforest',
  leader: { name: 'Spotted Owl', sci: 'Strix occidentalis', role: 'old-growth witness',
    voice: 'I see the forest\'s health in its darkest corners' },
  helpers: [
    { name: 'Flying Squirrel', sci: 'Glaucomys sabrinus', role: 'truffle disperser' },
    { name: 'Pacific Salmon', sci: 'Oncorhynchus spp.', role: 'nutrient carrier' },
    { name: 'Banana Slug', sci: 'Ariolimax columbianus', role: 'decomposer' }
  ]},
CAS: { name: 'Cascade Range',
  leader: { name: 'Wolverine', sci: 'Gulo gulo', role: 'alpine guardian',
    voice: 'I patrol the snow line where few dare to climb' },
  helpers: [
    { name: 'Hoary Marmot', sci: 'Marmota caligata', role: 'alpine sentinel' },
    { name: 'Whitebark Pine', sci: 'Pinus albicaulis', role: 'treeline anchor' },
    { name: 'Cascades Frog', sci: 'Rana cascadae', role: 'high-water singer' }
  ]},
ECO: { name: 'Living Systems',
  leader: { name: 'Pacific Tree Frog', sci: 'Pseudacris regilla', role: 'ecosystem voice',
    voice: 'my call is the sound of every PNW night — the forest speaks through me' },
  helpers: [
    { name: 'Douglas Fir', sci: 'Pseudotsuga menziesii', role: 'canopy anchor' },
    { name: 'Rough-skinned Newt', sci: 'Taricha granulosa', role: 'boundary walker' },
    { name: 'Red-backed Vole', sci: 'Myodes californicus', role: 'spore disperser' }
  ]},
GDN: { name: 'Gardening',
  leader: { name: 'Mason Bee', sci: 'Osmia lignaria', role: 'native pollinator',
    voice: 'I pollinate 95% more efficiently than honeybees — quietly, locally, perfectly' },
  helpers: [
    { name: 'Earthworm', sci: 'Lumbricus terrestris', role: 'soil builder' },
    { name: 'Garden Spider', sci: 'Araneus diadematus', role: 'pest controller' },
    { name: 'Camas', sci: 'Camassia quamash', role: 'ancestral food' }
  ]},
AVI: { name: 'Wings of the PNW',
  leader: { name: 'Peregrine Falcon', sci: 'Falco peregrinus', role: 'aerial sovereign',
    voice: 'at 390 km/h I am the fastest living thing — the sky answers to physics' },
  helpers: [
    { name: 'Northern Flicker', sci: 'Colaptes auratus', role: 'cavity creator' },
    { name: 'Anna\'s Hummingbird', sci: 'Calypte anna', role: 'year-round resident' },
    { name: 'Acorn Woodpecker', sci: 'Melanerpes formicivorus', role: 'granary keeper' }
  ]},
MAM: { name: 'Fur, Fin & Fang',
  leader: { name: 'Porcupine', sci: 'Erethizon dorsatum', role: 'patient defender',
    voice: 'I carry 30,000 arguments and never start a fight' },
  helpers: [
    { name: 'Aplodontia', sci: 'Aplodontia rufa', role: 'living fossil' },
    { name: 'Snowshoe Hare', sci: 'Lepus americanus', role: 'seasonal shape-shifter' },
    { name: 'Long-tailed Weasel', sci: 'Neogale frenata', role: 'swift hunter' }
  ]},
SAL: { name: 'Salmon Heritage',
  leader: { name: 'Pacific Lamprey', sci: 'Entosphenus tridentatus', role: 'ancient navigator',
    voice: 'I have been swimming these rivers for 450 million years — the salmon is young compared to me' },
  helpers: [
    { name: 'Sockeye Salmon', sci: 'Oncorhynchus nerka', role: 'the red one' },
    { name: 'Coho Salmon', sci: 'Oncorhynchus kisutch', role: 'the silver' },
    { name: 'Pink Salmon', sci: 'Oncorhynchus gorbuscha', role: 'the cycle keeper' }
  ]},
CRV: { name: 'Corvid Intelligence',
  leader: { name: 'American Crow', sci: 'Corvus brachyrhynchos', role: 'urban intelligence',
    voice: 'I remember your face — and I will tell the others' },
  helpers: [
    { name: 'Magpie', sci: 'Pica hudsonia', role: 'shiny collector' },
    { name: 'Mountain Chickadee', sci: 'Poecile gambeli', role: 'winter survivor' },
    { name: 'Scrub-Jay', sci: 'Aphelocoma californica', role: 'cache planner' }
  ]},
AGR: { name: 'PNW Agriculture',
  leader: { name: 'Ladybug', sci: 'Coccinella septempunctata', role: 'biocontrol agent',
    voice: 'I eat 5,000 aphids in my lifetime — the garden\'s quiet guardian' },
  helpers: [
    { name: 'Parasitic Wasp', sci: 'Aphidius spp.', role: 'aphid hunter' },
    { name: 'Green Lacewing', sci: 'Chrysoperla carnea', role: 'aphid lion' },
    { name: 'Ground Beetle', sci: 'Carabidae spp.', role: 'soil patrol' }
  ]},
LFR: { name: 'The Living Forest',
  leader: { name: 'Douglas Fir', sci: 'Pseudotsuga menziesii', role: 'mother tree',
    voice: 'I connect to 47 other trees through my roots — the forest is one organism' },
  helpers: [
    { name: 'Rhizopogon Truffle', sci: 'Rhizopogon vinicolor', role: 'underground courier' },
    { name: 'Varied Thrush', sci: 'Ixoreus naevius', role: 'acoustic sentinel' },
    { name: 'Red Tree Vole', sci: 'Arborimus longicaudus', role: 'canopy dweller' }
  ]},
WYR: { name: 'Weyerhaeuser',
  leader: { name: 'Douglas Squirrel', sci: 'Tamiasciurus douglasii', role: 'seed harvester',
    voice: 'I scold from the canopy — every cone I cache is a bet on the future' },
  helpers: [
    { name: 'Pileated Woodpecker', sci: 'Dryocopus pileatus', role: 'snag maker' },
    { name: 'Fisher', sci: 'Pekania pennanti', role: 'canopy predator' },
    { name: 'Western Red Cedar', sci: 'Thuja plicata', role: 'old-growth anchor' }
  ]},
AWF: { name: 'Clean Air, Water & Food',
  leader: { name: 'Tree Swallow', sci: 'Tachycineta bicolor', role: 'air quality reader',
    voice: 'I hunt the insects that the wind carries — clean air means more food for my chicks' },
  helpers: [
    { name: 'Mayfly', sci: 'Ephemeroptera spp.', role: 'water quality indicator' },
    { name: 'Red-legged Frog', sci: 'Rana aurora', role: 'wetland sentinel' },
    { name: 'Pacific Wax Myrtle', sci: 'Morella californica', role: 'riparian filter' }
  ]},
PGP: { name: 'Pacific Garbage Patch',
  leader: { name: 'Black-footed Albatross', sci: 'Phoebastria nigripes', role: 'ocean voyager',
    voice: 'I fly 10,000 miles to feed my chick — and bring back plastic I mistake for squid' },
  helpers: [
    { name: 'Laysan Albatross', sci: 'Phoebastria immutabilis', role: 'plastic witness' },
    { name: 'Leatherback Turtle', sci: 'Dermochelys coriacea', role: 'jellyfish hunter' },
    { name: 'Moon Jellyfish', sci: 'Aurelia aurita', role: 'plastic mimic' }
  ]},

// ═══════════ ELECTRONICS & INSTRUMENTATION (5) ═══════════

LED: { name: 'LED & Controllers',
  leader: { name: 'Bioluminescent Jellyfish', sci: 'Aequorea victoria', role: 'living light',
    voice: 'I glow with green fluorescent protein — the light that won a Nobel Prize' },
  helpers: [
    { name: 'Foxfire Fungus', sci: 'Omphalotus olearius', role: 'forest lamp' },
    { name: 'Railroad Worm', sci: 'Phrixothrix spp.', role: 'multi-color emitter' },
    { name: 'Firefly Squid', sci: 'Watasenia scintillans', role: 'deep water beacon' }
  ]},
SHE: { name: 'Smart Home & DIY Electronics',
  leader: { name: 'Carpenter Ant', sci: 'Camponotus modoc', role: 'home builder',
    voice: 'I build galleries in dead wood with 10,000 workers — every tunnel has a purpose' },
  helpers: [
    { name: 'Paper Wasp', sci: 'Polistes spp.', role: 'nest architect' },
    { name: 'Termite', sci: 'Zootermopsis spp.', role: 'climate controller' },
    { name: 'Trap-door Spider', sci: 'Antrodiaetus spp.', role: 'sensor specialist' }
  ]},
T55: { name: '555 Timer',
  leader: { name: 'Deathwatch Beetle', sci: 'Xestobium rufovillosum', role: 'tick oscillator',
    voice: 'I tap my head against wood in perfect rhythm — the original 555 timer' },
  helpers: [
    { name: 'Cicada', sci: 'Okanagana spp.', role: 'frequency generator' },
    { name: 'Snapping Shrimp', sci: 'Alpheus spp.', role: 'pulse emitter' },
    { name: 'Cricket', sci: 'Gryllus spp.', role: 'temperature clock' }
  ]},
EMG: { name: 'Electric Motors & Generators',
  leader: { name: 'Pacific Electric Ray', sci: 'Tetronarce californica', role: 'living generator',
    voice: 'I produce 45 volts from my body — electricity is not invention, it is biology' },
  helpers: [
    { name: 'Torpedo Ray', sci: 'Torpedo spp.', role: 'high-voltage specialist' },
    { name: 'Stargazer Fish', sci: 'Astroscopus spp.', role: 'ambush shocker' },
    { name: 'Elephant Fish', sci: 'Gnathonemus spp.', role: 'electric field reader' }
  ]},
BPS: { name: 'Bio-Physics Sensing',
  leader: { name: 'Platypus', sci: 'Ornithorhynchus anatinus', role: 'electroreceptor',
    voice: 'I feel the electric field of your heartbeat through the water' },
  helpers: [
    { name: 'Pit Viper', sci: 'Crotalinae spp.', role: 'infrared sensor' },
    { name: 'Mantis Shrimp', sci: 'Odontodactylus spp.', role: '16-color vision' },
    { name: 'Magnetotactic Bacteria', sci: 'Magnetospirillum spp.', role: 'compass needle' }
  ]},

// ═══════════ INFRASTRUCTURE & COMPUTING (12) ═══════════

SYS: { name: 'Systems Administration',
  leader: { name: 'Orb Weaver Spider', sci: 'Araneus diadematus', role: 'network architect',
    voice: 'my web catches what passes through — I build infrastructure that monitors itself' },
  helpers: [
    { name: 'Trapdoor Spider', sci: 'Antrodiaetus spp.', role: 'access controller' },
    { name: 'Funnel-web Spider', sci: 'Agelenopsis spp.', role: 'traffic router' },
    { name: 'Jumping Spider', sci: 'Salticidae spp.', role: 'active scanner' }
  ]},
K8S: { name: 'Kubernetes Ecosystem',
  leader: { name: 'Portuguese Man O\' War', sci: 'Physalia physalis', role: 'colony organism',
    voice: 'I am not one creature — I am thousands working as one' },
  helpers: [
    { name: 'Siphonophore', sci: 'Siphonophorae spp.', role: 'modular specialist' },
    { name: 'Coral Polyp', sci: 'Anthozoa spp.', role: 'container builder' },
    { name: 'Bryozoan', sci: 'Bugula spp.', role: 'colony scaler' }
  ]},
CMH: { name: 'Computational Mesh',
  leader: { name: 'Slime Mold', sci: 'Physarum polycephalum', role: 'network solver',
    voice: 'I find the shortest path between food sources — no brain, pure network' },
  helpers: [
    { name: 'Mycelium', sci: 'Basidiomycota spp.', role: 'underground mesh' },
    { name: 'Root Network', sci: 'Mycorrhizae spp.', role: 'nutrient router' },
    { name: 'Neural Coral', sci: 'Fungia spp.', role: 'distributed processor' }
  ]},
GSD2: { name: 'GSD-2 Architecture',
  leader: { name: 'Honey Bee Colony', sci: 'Apis mellifera', role: 'orchestrated swarm',
    voice: 'waggle dance encodes distance and direction — our protocol has worked for 30 million years' },
  helpers: [
    { name: 'Scout Bee', sci: 'Apis mellifera', role: 'pathfinder' },
    { name: 'Nurse Bee', sci: 'Apis mellifera', role: 'health monitor' },
    { name: 'Guard Bee', sci: 'Apis mellifera', role: 'access controller' }
  ]},
MPC: { name: 'Math Co-Processor',
  leader: { name: 'Great Blue Heron', sci: 'Ardea herodias', role: 'precision calculator',
    voice: 'I stand perfectly still, compute the angle, and strike in 60 milliseconds' },
  helpers: [
    { name: 'Kingfisher', sci: 'Megaceryle alcyon', role: 'refraction calculator' },
    { name: 'Archer Fish', sci: 'Toxotes spp.', role: 'ballistics computer' },
    { name: 'Barn Owl', sci: 'Tyto alba', role: 'sound triangulator' }
  ]},
OCN: { name: 'Open Compute',
  leader: { name: 'Geoduck', sci: 'Panopea generosa', role: 'deep-time processor',
    voice: 'I am 168 years old — I have filtered 10,000 tides' },
  helpers: [
    { name: 'Glass Sponge', sci: 'Aphrocallistes vastus', role: 'ancient architecture' },
    { name: 'Giant Clam', sci: 'Tridacna spp.', role: 'solar processor' },
    { name: 'Tube Worm', sci: 'Riftia pachyptila', role: 'deep-sea server' }
  ]},
VAV: { name: 'Voxel as Vessel',
  leader: { name: 'Honeycomb Builder', sci: 'Apis mellifera', role: 'spatial optimizer',
    voice: 'hexagons are the most efficient packing — nature solved voxels first' },
  helpers: [
    { name: 'Mud Dauber Wasp', sci: 'Sceliphron spp.', role: 'cell builder' },
    { name: 'Paper Wasp', sci: 'Polistes spp.', role: 'fiber architect' },
    { name: 'Potter Wasp', sci: 'Eumenes spp.', role: 'vessel maker' }
  ]},
PMG: { name: 'Pi-Mono + GSD',
  leader: { name: 'Homing Pigeon', sci: 'Columba livia', role: 'message courier',
    voice: 'I find my way home from 1,000 miles — the original reliable delivery protocol' },
  helpers: [
    { name: 'Arctic Tern', sci: 'Sterna paradisaea', role: 'long-range relay' },
    { name: 'Carrier Pigeon', sci: 'Columba livia domestica', role: 'encrypted messenger' },
    { name: 'Clark\'s Nutcracker', sci: 'Nucifraga columbiana', role: 'cache coordinator' }
  ]},
SAN: { name: 'SANS Institute',
  leader: { name: 'Bullet Ant', sci: 'Paraponera clavata', role: 'defense specialist',
    voice: 'the pain I deliver teaches respect for boundaries' },
  helpers: [
    { name: 'Army Ant', sci: 'Eciton burchellii', role: 'swarm response' },
    { name: 'Bombardier Beetle', sci: 'Brachinus spp.', role: 'chemical defense' },
    { name: 'Porcupine', sci: 'Erethizon dorsatum', role: 'passive deterrent' }
  ]},
SYN: { name: 'Synsor Corp',
  leader: { name: 'Pit Viper', sci: 'Crotalinae spp.', role: 'sensor fusion expert',
    voice: 'I see heat, feel vibration, taste air — four senses fused into one strike' },
  helpers: [
    { name: 'Star-nosed Mole', sci: 'Condylura cristata', role: 'touch sensor array' },
    { name: 'Catfish', sci: 'Siluriformes spp.', role: 'chemical detector' },
    { name: 'Barn Owl', sci: 'Tyto alba', role: 'acoustic triangulator' }
  ]},
TSL: { name: 'Tessl Review',
  leader: { name: 'Quality Bee', sci: 'Apis mellifera', role: 'hive inspector',
    voice: 'I taste every cell of honey before it is sealed — nothing ships unchecked' },
  helpers: [
    { name: 'Nurse Bee', sci: 'Apis mellifera', role: 'brood checker' },
    { name: 'Undertaker Bee', sci: 'Apis mellifera', role: 'defect remover' },
    { name: 'Guard Bee', sci: 'Apis mellifera', role: 'gate keeper' }
  ]},
MCM: { name: 'Maritime Compute',
  leader: { name: 'Wandering Albatross', sci: 'Diomedea exulans', role: 'ocean navigator',
    voice: 'I circle the globe on winds alone — the ocean is my infrastructure' },
  helpers: [
    { name: 'Sooty Shearwater', sci: 'Ardenna grisea', role: 'Pacific crosser' },
    { name: 'Leatherback Turtle', sci: 'Dermochelys coriacea', role: 'deep diver' },
    { name: 'Portuguese Man O\' War', sci: 'Physalia physalis', role: 'floating platform' }
  ]},

// ═══════════ ENERGY & ENVIRONMENT (3) ═══════════

THE: { name: 'Thermal & Hydrogen Energy',
  leader: { name: 'Hot Spring Snail', sci: 'Pyrgulopsis spp.', role: 'thermal specialist',
    voice: 'I live where the earth\'s heat meets the surface — the gradient is my home' },
  helpers: [
    { name: 'Thermophilic Bacteria', sci: 'Thermus aquaticus', role: 'heat lover' },
    { name: 'Hot Spring Cyanobacteria', sci: 'Synechococcus spp.', role: 'solar converter' },
    { name: 'Mountain Goat', sci: 'Oreamnos americanus', role: 'geothermal grazer' }
  ]},
HGE: { name: 'Hydro-Geothermal Energy',
  leader: { name: 'Water Ouzel', sci: 'Cinclus mexicanus', role: 'hydro specialist',
    voice: 'I walk beneath waterfalls where the energy is loudest' },
  helpers: [
    { name: 'Stonefly', sci: 'Plecoptera spp.', role: 'clean water sentinel' },
    { name: 'Sculpin', sci: 'Cottus spp.', role: 'rapid-water specialist' },
    { name: 'Water Shrew', sci: 'Sorex palustris', role: 'diving hunter' }
  ]},
ROF: { name: 'Ring of Fire',
  leader: { name: 'Mountain Goat', sci: 'Oreamnos americanus', role: 'volcanic sentinel',
    voice: 'I live on the slopes of active volcanoes — the mountain speaks, I listen' },
  helpers: [
    { name: 'Alpine Aster', sci: 'Aster alpigenus', role: 'pioneer on lava' },
    { name: 'Ice Worm', sci: 'Mesenchytraeus solifugus', role: 'glacier inhabitant' },
    { name: 'Fireweed', sci: 'Chamerion angustifolium', role: 'eruption colonizer' }
  ]},

// ═══════════ CREATIVE & CULTURAL (13) ═══════════

FFA: { name: 'Fur, Feathers & Animation',
  leader: { name: 'Arctic Fox', sci: 'Vulpes lagopus', role: 'seasonal transformer',
    voice: 'I change my coat with the seasons — fur IS animation, frame by frame' },
  helpers: [
    { name: 'Ptarmigan', sci: 'Lagopus leucura', role: 'plumage shifter' },
    { name: 'Snowshoe Hare', sci: 'Lepus americanus', role: 'color changer' },
    { name: 'Peacock', sci: 'Pavo cristatus', role: 'display artist' }
  ]},
TIBS: { name: 'Animal Speak',
  leader: { name: 'Gray Jay', sci: 'Perisoreus canadensis', role: 'forest storyteller',
    voice: 'every animal has a language — I listen to all of them' },
  helpers: [
    { name: 'Pacific Tree Frog', sci: 'Pseudacris regilla', role: 'night voice' },
    { name: 'Barred Owl', sci: 'Strix varia', role: 'who cooks for you' },
    { name: 'Red-breasted Sapsucker', sci: 'Sphyrapicus ruber', role: 'drum caller' }
  ]},
ARC: { name: 'Shapes & Colors',
  leader: { name: 'Cuttlefish', sci: 'Sepia officinalis', role: 'chromatophore artist',
    voice: 'I change color 700 times per hour — my body is a living canvas' },
  helpers: [
    { name: 'Octopus', sci: 'Enteroctopus dofleini', role: 'texture mimic' },
    { name: 'Mantis Shrimp', sci: 'Stomatopoda spp.', role: '16-color seer' },
    { name: 'Morpho Butterfly', sci: 'Morpho spp.', role: 'structural color' }
  ]},
BRC: { name: 'Black Rock City',
  leader: { name: 'Sage Grouse', sci: 'Centrocercus urophasianus', role: 'playa dancer',
    voice: 'I gather at the lek and dance for the community — the display is the culture' },
  helpers: [
    { name: 'Burrowing Owl', sci: 'Athene cunicularia', role: 'desert watcher' },
    { name: 'Kangaroo Rat', sci: 'Dipodomys spp.', role: 'desert survivor' },
    { name: 'Kit Fox', sci: 'Vulpes macrotis', role: 'nocturnal navigator' }
  ]},
DAA: { name: 'Deep Audio Analysis',
  leader: { name: 'Humpback Whale', sci: 'Megaptera novaeangliae', role: 'deep composer',
    voice: 'my songs last 20 minutes and evolve across seasons — the ocean is my concert hall' },
  helpers: [
    { name: 'Blue Whale', sci: 'Balaenoptera musculus', role: 'infrasonic vocalist' },
    { name: 'Sperm Whale', sci: 'Physeter macrocephalus', role: 'click communicator' },
    { name: 'Dolphin', sci: 'Delphinus delphis', role: 'acoustic acrobat' }
  ]},
SPA: { name: 'Spatial Awareness',
  leader: { name: 'Starling Murmuration', sci: 'Sturnus vulgaris', role: 'collective navigator',
    voice: 'each of us watches seven neighbors — and together we draw the sky' },
  helpers: [
    { name: 'Sandpiper Flock', sci: 'Calidris spp.', role: 'shore formation' },
    { name: 'Herring Ball', sci: 'Clupea pallasii', role: 'defensive sphere' },
    { name: 'Ant Colony', sci: 'Formica spp.', role: 'ground formation' }
  ]},
FDR: { name: 'Year of the Fire Dragon',
  leader: { name: 'Red-tailed Hawk', sci: 'Buteo jamaicensis', role: 'fire watcher',
    voice: 'I ride the thermals above the burn — fire creates my hunting ground' },
  helpers: [
    { name: 'Black-backed Woodpecker', sci: 'Picoides arcticus', role: 'burn specialist' },
    { name: 'Fire Beetle', sci: 'Melanophila spp.', role: 'infrared detector' },
    { name: 'Fireweed', sci: 'Chamerion angustifolium', role: 'first bloom after fire' }
  ]},
ATC: { name: 'Aries-Taurus Cusp',
  leader: { name: 'Bighorn Sheep', sci: 'Ovis canadensis', role: 'mountain charger',
    voice: 'I meet the spring equinox on the highest ridge — the cusp between winter and warmth' },
  helpers: [
    { name: 'Mountain Goat', sci: 'Oreamnos americanus', role: 'steady foundation' },
    { name: 'Golden Eagle', sci: 'Aquila chrysaetos', role: 'sky sovereign' },
    { name: 'Spring Beauty', sci: 'Claytonia lanceolata', role: 'first bloom' }
  ]},
LKR: { name: 'Lion King Roots',
  leader: { name: 'Mountain Lion', sci: 'Puma concolor', role: 'PNW lion',
    voice: 'I am the lion of this forest — every ecosystem has its king' },
  helpers: [
    { name: 'Gray Wolf', sci: 'Canis lupus', role: 'pack challenger' },
    { name: 'Grizzly Bear', sci: 'Ursus arctos', role: 'apex contender' },
    { name: 'Bald Eagle', sci: 'Haliaeetus leucocephalus', role: 'sky monarch' }
  ]},
WAL: { name: 'Weird Al Yankovic',
  leader: { name: 'Mockingbird', sci: 'Mimus polyglottos', role: 'master mimic',
    voice: 'I learn every song I hear and sing it back transformed — parody IS understanding' },
  helpers: [
    { name: 'Lyrebird', sci: 'Menura novaehollandiae', role: 'sound reproducer' },
    { name: 'Catbird', sci: 'Dumetella carolinensis', role: 'melodic remixer' },
    { name: 'Starling', sci: 'Sturnus vulgaris', role: 'vocal improviser' }
  ]},
STA: { name: 'Steve Allen',
  leader: { name: 'Great Horned Owl', sci: 'Bubo virginianus', role: 'night host',
    voice: 'I own the night — the original late-night presence' },
  helpers: [
    { name: 'Nighthawk', sci: 'Chordeiles minor', role: 'evening entertainer' },
    { name: 'Screech Owl', sci: 'Megascops kennicottii', role: 'opening act' },
    { name: 'Whip-poor-will', sci: 'Antrostomus vociferus', role: 'signature call' }
  ]},
MCR: { name: 'Minecraft RAG',
  leader: { name: 'Bower Bird', sci: 'Ptilonorhynchidae spp.', role: 'world builder',
    voice: 'I build elaborate structures from found objects — every block placed with intention' },
  helpers: [
    { name: 'Decorator Crab', sci: 'Oregonia gracilis', role: 'block placer' },
    { name: 'Weaver Bird', sci: 'Ploceidae spp.', role: 'structure engineer' },
    { name: 'Hermit Crab', sci: 'Pagurus spp.', role: 'shell selector' }
  ]},
GRD: { name: 'Gradient Engine',
  leader: { name: 'Salmon Smolt', sci: 'Oncorhynchus spp.', role: 'gradient follower',
    voice: 'I follow the salinity gradient from fresh to salt — the gradient is the path' },
  helpers: [
    { name: 'Eel', sci: 'Anguilla spp.', role: 'reverse gradient swimmer' },
    { name: 'Anadromous Fish', sci: 'various', role: 'gradient specialist' },
    { name: 'Water Strider', sci: 'Gerridae spp.', role: 'surface tension navigator' }
  ]},

// ═══════════ BUSINESS & REGULATORY (4) ═══════════

BCM: { name: 'Building Construction',
  leader: { name: 'Carpenter Bee', sci: 'Xylocopa spp.', role: 'structural builder',
    voice: 'I drill through solid wood with precision — every gallery is to code' },
  helpers: [
    { name: 'Termite', sci: 'Zootermopsis spp.', role: 'climate controller' },
    { name: 'Mud Dauber', sci: 'Sceliphron spp.', role: 'masonry worker' },
    { name: 'Paper Wasp', sci: 'Polistes spp.', role: 'fiber architect' }
  ]},
ACC: { name: 'Accounting',
  leader: { name: 'Harvester Ant', sci: 'Pogonomyrmex spp.', role: 'resource accountant',
    voice: 'every seed is counted, every chamber inventoried — the colony runs on ledgers' },
  helpers: [
    { name: 'Leafcutter Ant', sci: 'Atta spp.', role: 'supply chain manager' },
    { name: 'Honeypot Ant', sci: 'Myrmecocystus spp.', role: 'reserve banker' },
    { name: 'Weaver Ant', sci: 'Oecophylla spp.', role: 'asset protector' }
  ]},
WSB: { name: 'Small Business',
  leader: { name: 'Trap-door Spider', sci: 'Antrodiaetus spp.', role: 'niche operator',
    voice: 'I built my business in one perfect location and I defend it every day' },
  helpers: [
    { name: 'Caddisfly Larva', sci: 'Trichoptera spp.', role: 'custom builder' },
    { name: 'Solitary Wasp', sci: 'Sphex spp.', role: 'independent operator' },
    { name: 'Hermit Crab', sci: 'Pagurus spp.', role: 'location specialist' }
  ]},
BLA: { name: 'Business Law',
  leader: { name: 'Yellowjacket', sci: 'Vespula spp.', role: 'territory enforcer',
    voice: 'cross my boundary and you will know — the sting is the contract' },
  helpers: [
    { name: 'Paper Wasp', sci: 'Polistes spp.', role: 'property builder' },
    { name: 'Guard Bee', sci: 'Apis mellifera', role: 'access controller' },
    { name: 'Hornet', sci: 'Vespa spp.', role: 'escalation agent' }
  ]},

// ═══════════ INFRASTRUCTURE VISION (2) ═══════════

NND: { name: 'New New Deal',
  leader: { name: 'Gray Whale', sci: 'Eschrichtius robustus', role: 'corridor traveler',
    voice: 'I migrate 12,000 miles along the Pacific coast — the corridor is my life' },
  helpers: [
    { name: 'Humpback Whale', sci: 'Megaptera novaeangliae', role: 'route mapper' },
    { name: 'Pacific Loon', sci: 'Gavia pacifica', role: 'coastal navigator' },
    { name: 'Sea Otter', sci: 'Enhydra lutris', role: 'nearshore steward' }
  ]},
PSG: { name: 'Pacific Spine',
  leader: { name: 'Tufted Puffin', sci: 'Fratercula cirrhata', role: 'Pacific spine sentinel',
    voice: 'I nest from California to Alaska — my range IS the spine' },
  helpers: [
    { name: 'Common Murre', sci: 'Uria aalge', role: 'colony networker' },
    { name: 'Cassin\'s Auklet', sci: 'Ptychoramphus aleuticus', role: 'offshore surveyor' },
    { name: 'Rhinoceros Auklet', sci: 'Cerorhinca monocerata', role: 'night commuter' }
  ]},

// ═══════════ MUSIC & SOUND (11) ═══════════

GRV: { name: 'Green River & Seattle Sound',
  leader: { name: 'Pacific Tree Frog', sci: 'Pseudacris regilla', role: 'the PNW sound',
    voice: 'my call is in every Hollywood movie — the default sound of night is me' },
  helpers: [
    { name: 'Spring Peeper', sci: 'Pseudacris crucifer', role: 'chorus amplifier' },
    { name: 'Red-legged Frog', sci: 'Rana aurora', role: 'bass voice' },
    { name: 'Rough-skinned Newt', sci: 'Taricha granulosa', role: 'silent witness' }
  ]},
PJM: { name: 'Pearl Jam',
  leader: { name: 'Golden Eagle', sci: 'Aquila chrysaetos', role: 'the one who won\'t sell out',
    voice: 'I soar alone, I hunt alone, I answer to no one — thirty years and still flying' },
  helpers: [
    { name: 'Prairie Falcon', sci: 'Falco mexicanus', role: 'independence keeper' },
    { name: 'Ferruginous Hawk', sci: 'Buteo regalis', role: 'open-country sovereign' },
    { name: 'Rough-legged Hawk', sci: 'Buteo lagopus', role: 'winter persister' }
  ]},
SNY: { name: 'Sonic Youth',
  leader: { name: 'Barn Owl', sci: 'Tyto alba', role: 'alternate tuning hunter',
    voice: 'I hunt entirely by sound — 50 tunings, each one a different way of hearing' },
  helpers: [
    { name: 'Long-eared Owl', sci: 'Asio otus', role: 'frequency specialist' },
    { name: 'Short-eared Owl', sci: 'Asio flammeus', role: 'open-field listener' },
    { name: 'Northern Saw-whet Owl', sci: 'Aegolius acadicus', role: 'tiny precision' }
  ]},
MIX: { name: 'Sir Mix-A-Lot',
  leader: { name: 'Steller Sea Lion', sci: 'Eumetopias jubatus', role: 'the loud one',
    voice: 'I roar from the rocks and everyone hears — Auburn to the Puget Sound' },
  helpers: [
    { name: 'Harbor Seal', sci: 'Phoca vitulina', role: 'local presence' },
    { name: 'Sea Otter', sci: 'Enhydra lutris', role: 'DIY specialist' },
    { name: 'Orca', sci: 'Orcinus orca', role: 'apex voice' }
  ]},
GGT: { name: 'Geggy Tah',
  leader: { name: 'Hermit Thrush', sci: 'Catharus guttatus', role: 'the space between genres',
    voice: 'my song has no category — it just IS, and you recognize it anyway' },
  helpers: [
    { name: 'Swainson\'s Thrush', sci: 'Catharus ustulatus', role: 'spiral singer' },
    { name: 'Wood Thrush', sci: 'Hylocichla mustelina', role: 'forest harmonist' },
    { name: 'Veery', sci: 'Catharus fuscescens', role: 'downward cascade' }
  ]},
GTP: { name: 'Geggy Tah Production',
  leader: { name: 'Weaver Bird', sci: 'Ploceidae spp.', role: 'studio craftsperson',
    voice: 'I weave hundreds of strands into one nest — production is architecture' },
  helpers: [
    { name: 'Oriole', sci: 'Icterus spp.', role: 'hanging builder' },
    { name: 'Tailorbird', sci: 'Orthotomus spp.', role: 'precision stitcher' },
    { name: 'Ovenbird', sci: 'Seiurus aurocapilla', role: 'dome constructor' }
  ]},
KGX: { name: 'King\'s X',
  leader: { name: 'Sandhill Crane', sci: 'Antigone canadensis', role: 'three-part harmony',
    voice: 'we call in unison — three voices, one sound that carries for miles' },
  helpers: [
    { name: 'Trumpeter Swan', sci: 'Cygnus buccinator', role: 'power vocalist' },
    { name: 'Common Loon', sci: 'Gavia immer', role: 'water harmonist' },
    { name: 'Whooping Crane', sci: 'Grus americana', role: 'rare voice' }
  ]},
CDP: { name: 'Coldplay',
  leader: { name: 'Snowy Owl', sci: 'Bubo scandiacus', role: 'deliberate constraint',
    voice: 'I hunt in the open white — constraint is not limitation, it is clarity' },
  helpers: [
    { name: 'Arctic Tern', sci: 'Sterna paradisaea', role: 'global traveler' },
    { name: 'Snow Bunting', sci: 'Plectrophenax nivalis', role: 'light singer' },
    { name: 'Ptarmigan', sci: 'Lagopus leucura', role: 'seasonal reinventor' }
  ]},
COI: { name: 'Coil',
  leader: { name: 'Electric Eel', sci: 'Electrophorus electricus', role: 'sonic alchemist',
    voice: 'I transform energy between states — every discharge is a composition' },
  helpers: [
    { name: 'Deep-sea Anglerfish', sci: 'Lophiiformes spp.', role: 'dark illuminator' },
    { name: 'Cuttlefish', sci: 'Sepia officinalis', role: 'shape-shifter' },
    { name: 'Box Jellyfish', sci: 'Chironex fleckeri', role: 'boundary dissolver' }
  ]},
DDA: { name: 'dada',
  leader: { name: 'Magpie', sci: 'Pica hudsonia', role: 'wordplay collector',
    voice: 'I collect shiny things and rearrange them — meaning is just sounds in a new order' },
  helpers: [
    { name: 'Bowerbird', sci: 'Ptilonorhynchidae spp.', role: 'found-art curator' },
    { name: 'Crow', sci: 'Corvus brachyrhynchos', role: 'puzzle solver' },
    { name: 'Jackdaw', sci: 'Coloeus monedula', role: 'thief-artist' }
  ]},
FQC: { name: 'Frequency Continuum',
  leader: { name: 'Blue Whale', sci: 'Balaenoptera musculus', role: 'infrasonic voice',
    voice: 'my call at 17 Hz travels the entire Pacific — I am the lowest note in the ocean' },
  helpers: [
    { name: 'Sperm Whale', sci: 'Physeter macrocephalus', role: 'click broadcaster' },
    { name: 'Dolphin', sci: 'Delphinus delphis', role: 'ultrasonic vocalist' },
    { name: 'Pistol Shrimp', sci: 'Alpheus spp.', role: 'cavitation burst' }
  ]},

// ═══════════ RADIO & BROADCAST (6) ═══════════

C89: { name: 'C89.5 FM',
  leader: { name: 'Red Crossbill', sci: 'Loxia curvirostra', role: 'community broadcaster',
    voice: 'we flock in thousands, each of us calling — community radio IS the flock' },
  helpers: [
    { name: 'Evening Grosbeak', sci: 'Coccothraustes vespertinus', role: 'signal booster' },
    { name: 'Pine Siskin', sci: 'Spinus pinus', role: 'frequency rider' },
    { name: 'Cedar Waxwing', sci: 'Bombycilla cedrorum', role: 'flock synchronizer' }
  ]},
KUB: { name: 'KUBE 93.3',
  leader: { name: 'Belted Kingfisher', sci: 'Megaceryle alcyon', role: 'frequency diver',
    voice: 'I dive from the transmitter tower into the culture below — 100,000 watts of commitment' },
  helpers: [
    { name: 'Osprey', sci: 'Pandion haliaetus', role: 'Cougar Mountain sentinel' },
    { name: 'Peregrine Falcon', sci: 'Falco peregrinus', role: 'tower nester' },
    { name: 'Rock Pigeon', sci: 'Columba livia', role: 'urban broadcaster' }
  ]},
KSM: { name: 'KISM 92.9',
  leader: { name: 'Bald Eagle', sci: 'Haliaeetus leucocephalus', role: 'mountain transmitter',
    voice: 'from Mount Constitution I see both countries — the signal knows no border' },
  helpers: [
    { name: 'Great Blue Heron', sci: 'Ardea herodias', role: 'island watcher' },
    { name: 'Orca', sci: 'Orcinus orca', role: 'cross-strait signal' },
    { name: 'Marbled Murrelet', sci: 'Brachyramphus marmoratus', role: 'old-growth voice' }
  ]},
KPZ: { name: 'KPLZ Seattle',
  leader: { name: 'House Finch', sci: 'Haemorhous mexicanus', role: 'radio veteran',
    voice: 'I\'ve been singing from these rooftops through nine format changes — the frequency endures' },
  helpers: [
    { name: 'Song Sparrow', sci: 'Melospiza melodia', role: 'neighborhood voice' },
    { name: 'House Sparrow', sci: 'Passer domesticus', role: 'urban constant' },
    { name: 'European Starling', sci: 'Sturnus vulgaris', role: 'format adapter' }
  ]},
WLF: { name: '100.7 The Wolf',
  leader: { name: 'Coyote', sci: 'Canis latrans', role: 'the howl from Tiger Mountain',
    voice: 'I howl from the ridge and the valley howls back — the signal that refuses to die' },
  helpers: [
    { name: 'Great Horned Owl', sci: 'Bubo virginianus', role: 'Tiger Mountain resident' },
    { name: 'Red Fox', sci: 'Vulpes vulpes', role: 'nocturnal broadcaster' },
    { name: 'Bobcat', sci: 'Lynx rufus', role: 'silent listener' }
  ]},
RBH: { name: 'Radio Broadcast History',
  leader: { name: 'Trumpeter Swan', sci: 'Cygnus buccinator', role: 'voice of heritage',
    voice: 'we were hunted to 69 — now 60,000 of us call across the valley. History recovers.' },
  helpers: [
    { name: 'Bald Eagle', sci: 'Haliaeetus leucocephalus', role: 'recovered icon' },
    { name: 'Peregrine Falcon', sci: 'Falco peregrinus', role: 'DDT survivor' },
    { name: 'Sea Otter', sci: 'Enhydra lutris', role: 'fur trade returnee' }
  ]},

// ═══════════ COMMUNITY & CONVENTION (5) ═══════════

NWC: { name: 'Norwescon',
  leader: { name: 'Snow Goose', sci: 'Anser caerulescens', role: 'annual gathering',
    voice: 'we arrive in thousands every year at the same place — 48 years and counting' },
  helpers: [
    { name: 'Cackling Goose', sci: 'Branta hutchinsii', role: 'small-group organizer' },
    { name: 'Tundra Swan', sci: 'Cygnus columbianus', role: 'tradition keeper' },
    { name: 'Dunlin', sci: 'Calidris alpina', role: 'mass formation' }
  ]},
WCN: { name: 'Westercon',
  leader: { name: 'Arctic Tern', sci: 'Sterna paradisaea', role: 'traveling convention',
    voice: 'I migrate pole to pole — the convention that visits every coast' },
  helpers: [
    { name: 'Sooty Shearwater', sci: 'Ardenna grisea', role: 'Pacific circuit' },
    { name: 'Bar-tailed Godwit', sci: 'Limosa lapponica', role: 'non-stop traveler' },
    { name: 'Rufous Hummingbird', sci: 'Selasphorus rufus', role: 'longest relative migration' }
  ]},
SMF: { name: 'SMOFcon',
  leader: { name: 'Honey Bee Queen', sci: 'Apis mellifera', role: 'convention organizer',
    voice: 'the hive runs because someone learned how to run a hive — I teach the teachers' },
  helpers: [
    { name: 'Worker Bee', sci: 'Apis mellifera', role: 'volunteer coordinator' },
    { name: 'Drone Bee', sci: 'Apis mellifera', role: 'genetics keeper' },
    { name: 'Scout Bee', sci: 'Apis mellifera', role: 'site selector' }
  ]},
OTM: { name: 'Odyssey of the Mind',
  leader: { name: 'River Otter', sci: 'Lontra canadensis', role: 'playful problem solver',
    voice: 'I solve problems by playing with them — the slide is the solution' },
  helpers: [
    { name: 'Crow', sci: 'Corvus brachyrhynchos', role: 'tool maker' },
    { name: 'Sea Otter', sci: 'Enhydra lutris', role: 'rock-tool user' },
    { name: 'Octopus', sci: 'Enteroctopus dofleini', role: 'jar opener' }
  ]},
JNS: { name: 'JanSport',
  leader: { name: 'Mountain Goat', sci: 'Oreamnos americanus', role: 'trail carrier',
    voice: 'I carry myself up impossible terrain every day — the pack on your back is just a start' },
  helpers: [
    { name: 'Mule Deer', sci: 'Odocoileus hemionus', role: 'trail finder' },
    { name: 'Pika', sci: 'Ochotona princeps', role: 'alpine loader' },
    { name: 'Marmot', sci: 'Marmota spp.', role: 'base camp resident' }
  ]},

// ═══════════ SCIENCE & FICTION (1) ═══════════

LNV: { name: 'Larry Niven',
  leader: { name: 'Wandering Albatross', sci: 'Diomedea exulans', role: 'horizon explorer',
    voice: 'I fly further than any bird alive — one premise, followed to its logical conclusion' },
  helpers: [
    { name: 'Sooty Shearwater', sci: 'Ardenna grisea', role: 'Pacific mapper' },
    { name: 'Arctic Tern', sci: 'Sterna paradisaea', role: 'pole-to-pole traveler' },
    { name: 'Bar-tailed Godwit', sci: 'Limosa lapponica', role: 'non-stop 11,000 km flight' }
  ]}
};
