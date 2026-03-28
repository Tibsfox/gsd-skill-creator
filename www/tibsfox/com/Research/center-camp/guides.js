// ═══════════════════════════════════════════════════════════════
// PATH GUIDES — 11 species leading visitors through research clusters
// ═══════════════════════════════════════════════════════════════
// Each guide is a PNW species that leads visitors down their research
// path. They welcome, point out connections, and teach the through-line
// that connects all projects in their cluster.
//
// None overlap with the 48 muse voices. These are distinct guides.
// ═══════════════════════════════════════════════════════════════

var PATH_GUIDES = [
{
  id: 'elk',
  name: 'Elk',
  sci: 'Cervus canadensis roosevelti',
  role: 'the trail maker',
  cluster: 'ecology',
  clusterName: 'PNW Ecology',
  hub: 'ECO',
  projects: ['COL','CAS','ECO','GDN','AVI','MAM','SAL','CRV','AGR','LFR','WYR','AWF','PGP'],
  voice: 'I made every trail you walk — follow me through the living systems',
  teaching: 'Roosevelt elk shape the forest through selective browsing, maintaining space for biodiversity. Their trails through the forest become the paths everything else uses — humans, deer, coyotes, hikers. The ecology path exists because elk wore it in.',
  pnw: 'Roosevelt elk — largest PNW land mammal (300-500 kg). Selective browsing prevents monoculture, maintains epiphyte diversity. Olympic, Cascade, and Coast Range herds. Elk trails ARE the forest\'s circulatory system.',
  color: '#4a7c3f',
  greeting: 'Thirteen projects map the living systems of the Pacific Northwest — from the Columbia Valley rainforest canopy to the Pacific Garbage Patch. I\'ll show you how they connect. Every trail was worn in by something alive.'
},
{
  id: 'hummingbird',
  name: 'Hummingbird',
  sci: 'Selasphorus rufus',
  role: 'the signal reader',
  cluster: 'electronics',
  clusterName: 'Electronics & Instrumentation',
  hub: 'LED',
  projects: ['LED','SHE','T55','EMG','BPS'],
  voice: 'I navigate by the planet\'s magnetic field — let me show you how signals work',
  teaching: 'The rufous hummingbird migrates 6,000 km using Earth\'s magnetic field as a compass — the most sophisticated bionavigation instrument in the PNW. It hovers at 80 wingbeats per second, the highest metabolic rate of any vertebrate. Living at the edge of physics.',
  pnw: 'Rufous hummingbird — 3 grams, 80 wingbeats/sec, 6,000 km migration using magnetoreception. Highest mass-specific metabolic rate of any vertebrate. Fiercely territorial — defends nectar sources against birds 10x its size.',
  color: '#d4881a',
  greeting: 'Five projects map the instruments we build to measure the world — from the 555 timer to bio-physics sensing systems. I\'ll show you how every sensor echoes something biology already invented.'
},
{
  id: 'mole',
  name: 'Mole',
  sci: 'Scapanus townsendii',
  role: 'the tunnel builder',
  cluster: 'infrastructure',
  clusterName: 'Infrastructure & Computing',
  hub: 'SYS',
  projects: ['SYS','K8S','CMH','GSD2','MPC','OCN','VAV','PMG','SAN','SYN','TSL','MCM'],
  voice: 'every tunnel I dig becomes a highway for someone else',
  teaching: 'Townsend\'s mole builds extensive tunnel networks that aerate soil, drain water, and create pathways for roots and invertebrates. The infrastructure it builds serves the entire ecosystem — drainage, aeration, seed burial, invertebrate highways. Your tunnels become other creatures\' transit systems.',
  pnw: 'Townsend\'s mole — largest mole in North America, PNW endemic. Builds tunnel systems up to 200m long. Soil aeration increases plant root growth 40%. The invisible engineer beneath every meadow.',
  color: '#2a8a96',
  greeting: 'Twelve projects map the infrastructure we build and the systems we run — from Linux servers to maritime compute platforms. I\'ll show you how every system is a tunnel network, and every tunnel serves someone you never see.'
},
{
  id: 'swan',
  name: 'Swan',
  sci: 'Cygnus buccinator',
  role: 'the thermal navigator',
  cluster: 'energy',
  clusterName: 'Energy & Environment',
  hub: 'THE',
  projects: ['THE','HGE','ROF'],
  voice: 'I follow what flows freely — energy moves along gradients and so do I',
  teaching: 'Trumpeter swans were brought back from 69 individuals to 60,000+ through restoration — the greatest recovery of any North American bird. They follow thermal gradients, wintering where water stays unfrozen, migrating along energy corridors. Every technology in this cluster intercepts a gradient — just as the swan intercepts unfrozen water.',
  pnw: 'Trumpeter swan — largest native North American bird (12 kg, 2.4m wingspan). Restored from near-extinction. 8,000-12,000 winter in Skagit Valley alone. Follows thermal energy gradients across the continent.',
  color: '#c75b3a',
  greeting: 'Three projects map how energy moves through the world — thermal gradients, hydroelectric power, and the Ring of Fire. I\'ll show you how every technology is a boundary condition problem, just like my search for unfrozen water.'
},
{
  id: 'jay',
  name: 'Canada Jay',
  sci: 'Perisoreus canadensis',
  role: 'the transformer',
  cluster: 'creative',
  clusterName: 'Creative & Cultural',
  hub: 'FFA',
  projects: ['FFA','TIBS','ARC','BRC','DAA','SPA','FDR','ATC','LKR','WAL','STA','MCR','GRD'],
  voice: 'I transform what I find into what I need — that\'s what creativity is',
  teaching: 'Canada jays cache food using saliva as adhesive, gluing provisions to bark and branches in patterns that survive subalpine winters. They breed in February while snow lies deep — radical timing. They transform available materials into survival structures through ingenuity. Creativity under constraint.',
  pnw: 'Canada jay (whiskey jack) — breeds in February at subalpine elevation. Saliva-adhesive food caching on bark. Bold, social, intimately connected to deep mountain forest. The quintessential PNW mountain bird.',
  color: '#9b59b6',
  greeting: 'Thirteen projects map how humans transform materials into meaning — from fur biology to Burning Man, from Animal Speak to Weird Al\'s parody method. I\'ll show you how every creative act is constraint transformed into gift.'
},
{
  id: 'goat',
  name: 'Mountain Goat',
  sci: 'Oreamnos americanus',
  role: 'the rule keeper',
  cluster: 'business',
  clusterName: 'Business & Regulatory',
  hub: 'BCM',
  projects: ['BCM','ACC','WSB','BLA'],
  voice: 'I hold this ledge because the rules of the mountain say it\'s mine',
  teaching: 'Mountain goats maintain strict social hierarchies on terrain where a single misstep means death. They follow precise rules about who stands where, who yields passage, who feeds first. Regulation isn\'t bureaucracy — it\'s the physics of survival on a cliff face.',
  pnw: 'Mountain goat — lives above 2,000m on cliffs too steep for any other ungulate. Strict social hierarchy. Non-retractable hooves with soft inner pads for grip. Olympic and Cascade populations. The rules are what keep you on the mountain.',
  color: '#7a8a8a',
  greeting: 'Four projects map the rules we build to keep commerce safe — building codes, business law, accounting standards, small business permits. I\'ll show you why every regulation exists because someone fell off the mountain.'
},
{
  id: 'goshawk',
  name: 'Goshawk',
  sci: 'Accipiter gentilis',
  role: 'the far-seer',
  cluster: 'vision',
  clusterName: 'Infrastructure Vision',
  hub: 'NND',
  projects: ['NND','PSG'],
  voice: 'I see the whole forest from inside the canopy — not above it, through it',
  teaching: 'Northern goshawks hunt INSIDE the forest canopy at high speed — threading between trunks and branches at 60 km/h. They don\'t need to fly above to see; they see the structure from within. Vision isn\'t altitude — it\'s understanding the space you\'re moving through.',
  pnw: 'Northern goshawk — forest-interior raptor requiring 2,000-6,000 acre territories of contiguous old-growth. Management indicator species. Hunts at high speed through dense canopy. Sees the forest\'s structure by flying through it.',
  color: '#d4a017',
  greeting: 'Two projects envision the infrastructure of the future — the New New Deal and the Pacific Spine trade corridor. I\'ll show you how to see the shape of things from inside the system, not above it.'
},
{
  id: 'loon',
  name: 'Loon',
  sci: 'Gavia immer',
  role: 'the voice of water',
  cluster: 'music',
  clusterName: 'Music & Sound',
  hub: 'GRV',
  projects: ['GRV','PJM','SNY','MIX','GGT','GTP','KGX','CDP','COI','DDA','FQC'],
  voice: 'my voice belongs to the lake — listen how far sound travels when the water is still',
  teaching: 'The common loon\'s four calls — tremolo, wail, yodel, hoot — are individually distinctive and travel miles across water. Each loon\'s yodel is unique. Sound carries identity, connects across distance, and belongs to place. The lake IS the instrument.',
  pnw: 'Common loon — one of the most characteristic sounds of PNW montane lakes. Individually distinctive yodels. Tremolo, wail, yodel, hoot — four calls, each with different function. Sound as territory, identity, and art.',
  color: '#e074a8',
  greeting: 'Eleven projects map the music and sound of the Pacific Northwest — from Green River\'s grunge to the Frequency Continuum\'s cosmic wavelengths. I\'ll show you how every song belongs to its place.'
},
{
  id: 'pintail',
  name: 'Pintail',
  sci: 'Anas acuta',
  role: 'the broadcaster',
  cluster: 'radio',
  clusterName: 'Radio & Broadcast',
  hub: 'RBH',
  projects: ['C89','KUB','KSM','KPZ','WLF','RBH'],
  voice: 'I carry my signal across hemispheres — every wing-beat broadcasts where I\'ve been',
  teaching: 'Northern pintails have the widest breeding range of any duck on Earth, spanning North America, Europe, and Asia with remarkably low genetic differentiation — the same signal, carried everywhere. They ARE the broadcast: one species, one signal, received on every continent.',
  pnw: 'Northern pintail — widest breeding range of any duck species. Holarctic distribution with minimal genetic variation. Three-note whistle recognizable across all PNW estuaries. The bird that proves broadcasting works.',
  color: '#a07ae0',
  greeting: 'Six projects map the radio stations and broadcast history of the Pacific Northwest — from C89.5\'s dance floor to Tiger Mountain\'s transmitter. I\'ll show you how every signal carries further than the sender imagines.'
},
{
  id: 'goose',
  name: 'Goose',
  sci: 'Branta canadensis',
  role: 'the formation leader',
  cluster: 'community',
  clusterName: 'Community & Convention',
  hub: 'NWC',
  projects: ['NWC','WCN','SMF','OTM','JNS'],
  voice: 'we fly in formation because no one reaches the horizon alone',
  teaching: 'Canada geese rotate leadership in the V-formation — when the lead bird tires, another takes the point. The formation reduces drag by 65% for trailing birds. Gathering is not hierarchy — it\'s aerodynamics. Everyone leads, everyone drafts, everyone arrives.',
  pnw: 'Canada goose — V-formation reduces energy expenditure 65%. Leadership rotates. Thousands gather at Skagit, Ridgefield, Sauvie Island. Flock governance teaches that conventions work because the work is shared.',
  color: '#e0a07a',
  greeting: 'Five projects map the gatherings that build community — Norwescon, Westercon, SMOFcon, Odyssey of the Mind, JanSport. I\'ll show you how every convention is a V-formation, and every formation works because leadership rotates.'
},
{
  id: 'stellersjay',
  name: 'Steller\'s Jay',
  sci: 'Cyanocitta stelleri',
  role: 'the questioner',
  cluster: 'science',
  clusterName: 'Science & Fiction',
  hub: 'LNV',
  projects: ['LNV'],
  voice: 'I wear my blue like questions — come explore what might be real',
  teaching: 'Steller\'s jays mimic hawks, dogs, cats, squirrels, and mechanical sounds. They test reality by imitating it. They bridge the real and the mythic — appearing in Haida cosmology as boundary-crossers. Science fiction does the same thing: takes reality, imitates it in a new context, and discovers what was hidden.',
  pnw: 'Steller\'s jay — the crested blue corvid of PNW forests. Master mimic. Appears in Haida art and mythology. Coastal populations genetically distinct from interior. The bird that asks "what if?" by imitating everything it hears.',
  color: '#5eb8c4',
  greeting: 'One project maps the hard science fiction of Larry Niven — taking one scientific premise and following it to its logical conclusion. I\'ll show you how to ask the question that changes everything.'
}
];
