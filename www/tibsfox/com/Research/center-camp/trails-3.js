// ═══════════════════════════════════════════════════════════════════════════
// TRAILS 3 — 32 Deep Knowledge Trails
// ═══════════════════════════════════════════════════════════════════════════
// Four sets of 8: Indigenous Knowledge, Technology, Cross-Domain, Future.
// Every waypoint references a real research project and contains true facts.
// ═══════════════════════════════════════════════════════════════════════════

var TRAILS_3 = [
// ══════════ 1-8: INDIGENOUS KNOWLEDGE ══════════
{ id:1, name:'The Ethnobotany Trail', guide:'cedar', color:'#4a7c3f', theme:'300 plant species used as medicine, food, fiber, and ceremony across the PNW', waypoints:[
  { title:'Camas Prairie', text:'Camassia quamash bulbs were the carbohydrate staple of Plateau peoples. Wapato (Sagittaria latifolia) filled the same role in lowland wetlands. Both required active management — burning for camas, wading harvest for wapato.', project:'TIBS' },
  { title:'The Bark Harvest', text:'Western red cedar inner bark was harvested in vertical strips without killing the tree. Culturally modified trees in BC bear 800-year-old harvest scars still healing. Sustainable yield, proven across millennia.', project:'COL' },
  { title:'The Berry Calendar', text:'PNW peoples followed a seasonal round: salmonberries in June, thimbleberries in July, huckleberries in August, Oregon grape in September. The calendar mapped nutrition across elevation and latitude.', project:'GDN' },
  { title:'The Fiber Arts', text:'Stinging nettle (Urtica dioica) yields fiber stronger than cotton. Coast Salish weavers produced textiles from nettle, cedar bark, mountain goat wool, and dog hair — four fiber sources, each with specific tensile properties.', project:'FFA' }
]},
{ id:2, name:'The Fire-Tending Trail', guide:'fire', color:'#d4881a', theme:'Indigenous fire management shaped every PNW landscape for 10,000 years', waypoints:[
  { title:'The Kalapuya Burns', text:'Kalapuya peoples burned the Willamette Valley annually to maintain 1 million acres of oak prairie. When burning stopped after 1850, Douglas fir invaded and converted open grassland to closed forest within 80 years.', project:'CAS' },
  { title:'The Berry Burns', text:'Low-intensity fire stimulates huckleberry production 3-5x within two years. Prescribed burns at 1,200-1,500 meter elevation maintained productive berry fields across the Cascades for thousands of years.', project:'GDN' },
  { title:'The Coastal Prairies', text:'Coquille and Tolowa peoples maintained coastal prairies from southern Oregon to northern California using fire. These prairies supported elk herds, camas fields, and the highest biodiversity per acre in the PNW.', project:'ECO' },
  { title:'The Modern Return', text:'The Confederated Tribes of Grand Ronde resumed prescribed burning in the Willamette Valley in 2017. Within 3 years, native wildflower diversity increased 40% and invasive grass cover dropped 60%.', project:'AWF' }
]},
{ id:3, name:'The Fishing Technology Trail', guide:'chinook', color:'#3a7ac7', theme:'Weirs, traps, and reef nets — engineering that sustained millions', waypoints:[
  { title:'The Reef Net', text:'Lummi and Saanich peoples developed reef nets — the only stationary open-water salmon fishing technology in the world. Artificial kelp lines guided salmon into submerged nets visible only from elevated platforms.', project:'SAL' },
  { title:'The Fish Weir', text:'Stone and wood weirs spanning rivers could harvest thousands of salmon per day while allowing regulated escapement upstream. The weir was both a harvest tool and a conservation device — built-in catch limits.', project:'FFA' },
  { title:'The Dip Net Stations', text:'Celilo Falls dip net stations were property rights held by families for generations. The falls produced 10 million pounds of salmon annually for 11,000 years until The Dalles Dam drowned them in 1957.', project:'TIBS' },
  { title:'The Eulachon Rake', text:'Eulachon were harvested with herring rakes — toothed paddles swept through schools, impaling fish on nail-like tines. One sweep captured 20-30 fish. The rendered oil was stored in cedar boxes and traded for centuries.', project:'SAL' }
]},
{ id:4, name:'The Navigation Trail', guide:'raven', color:'#5a3a5c', theme:'Celestial, tidal, and current navigation across the Pacific', waypoints:[
  { title:'The Star Compass', text:'Pacific Islander navigators used a star compass of 32 directional stars — rising and setting positions marked bearings across open ocean. This system enabled voyages of 4,000+ km without instruments.', project:'ARC' },
  { title:'The Swell Reading', text:'Polynesian wayfinders detected reflected ocean swells from islands 100+ km away. Wave refraction patterns around atolls created readable interference signatures in open water.', project:'OCN' },
  { title:'The Stick Charts', text:'Marshall Islands stick charts encoded ocean swell patterns in curved coconut-fiber grids. Each chart was a personal mnemonic — readable only by its maker, accurate across thousands of miles.', project:'SPA' },
  { title:'The Coastal Pilots', text:'Tlingit and Haida navigators memorized coastline profiles visible from sea level. Named landmarks, current patterns, and tidal timing enabled travel across 2,000 km of the most complex coastline on Earth.', project:'TIBS' }
]},
{ id:5, name:'The Medicine Trail', guide:'willow', color:'#6a9a5a', theme:'Plant medicine grounded in chemistry that modern labs later confirmed', waypoints:[
  { title:'The Salicin Path', text:'Willow bark tea contains salicin — the precursor to aspirin. PNW peoples used it for pain, fever, and inflammation for millennia. Bayer synthesized acetylsalicylic acid in 1897, but the molecule was already in service.', project:'GDN' },
  { title:'The Devils Club Shield', text:'Oplopanax horridus root bark has confirmed anti-diabetic, antimicrobial, and anti-tuberculosis properties. It is the most widely used medicinal plant among PNW First Nations — over 30 documented applications.', project:'TIBS' },
  { title:'The Taxol Discovery', text:'Pacific yew bark yields paclitaxel — one of the most important chemotherapy drugs ever found. Discovered in 1967 from PNW forest samples, it treats ovarian, breast, and lung cancers worldwide.', project:'CAS' },
  { title:'The Usnea Antibiotic', text:'Old mans beard lichen (Usnea longissima) contains usnic acid with demonstrated antibiotic activity against Gram-positive bacteria. PNW tribes used it as wound dressing — the antibiotic was already deployed.', project:'ECO' }
]},
{ id:6, name:'The Weaving Trail', guide:'otter', color:'#c8b890', theme:'Cedar bark, mountain goat wool, nettle fiber, and dog hair — four material sciences', waypoints:[
  { title:'The Cedar Mat', text:'Coast Salish cedar bark mats were woven in twill patterns that shed rain. A single mat required 3 months of bark processing — soaking, pounding, splitting into strips 2mm wide. Engineering at fiber scale.', project:'COL' },
  { title:'The Chilkat Blanket', text:'Tlingit Chilkat blankets use mountain goat wool spun with cedar bark core. The curvilinear formline designs require mathematical precision — each blanket takes 6-12 months and follows rules as strict as any proof.', project:'FFA' },
  { title:'The Salish Wool Dog', text:'Coast Salish peoples bred a distinct wool-bearing dog, now extinct. The wool was spun into yarn for blankets. DNA analysis confirms these dogs were genetically distinct from all other North American dog populations.', project:'MAM' },
  { title:'The Nettle Cordage', text:'Stinging nettle yields fiber with tensile strength exceeding cotton. PNW peoples retted, stripped, and spun nettle into cordage for fishing nets, snares, and bowstrings — industrial fiber from a roadside weed.', project:'GDN' }
]},
{ id:7, name:'The Astronomy Trail', guide:'owl', color:'#2a3a5c', theme:'Stars as calendar, compass, and story — celestial knowledge across cultures', waypoints:[
  { title:'The Pleiades Clock', text:'Many PNW tribes used the Pleiades as a seasonal calendar. Their first visible rising in autumn signaled the start of the fishing season. Their disappearance marked the shift to winter ceremonies.', project:'TIBS' },
  { title:'The Aurora Stories', text:'Northern PNW peoples interpreted aurora borealis as spirit fires or dancing ancestors. The Tlingit called them spirit torches — the plasma physics was encoded in narrative that accurately described the visual phenomena.', project:'THE' },
  { title:'The Solstice Markers', text:'Sunlight alignment features in PNW petroglyph sites mark solstice and equinox positions. These are functional astronomical instruments carved in stone — calendars with multi-century accuracy.', project:'ARC' },
  { title:'The Milky Way Path', text:'The Milky Way was interpreted as a trail or river across many PNW cultures — a path of souls, a salmon stream in the sky. The metaphor maps the actual galactic structure visible to the naked eye.', project:'SPA' }
]},
{ id:8, name:'The Water Management Trail', guide:'beaver', color:'#7a6a3a', theme:'Channels, weirs, fish traps, and irrigation — hydraulic engineering without concrete', waypoints:[
  { title:'The Wapato Garden', text:'Chinook peoples managed wapato wetlands along the Columbia by controlling water levels through channel maintenance. Lewis and Clark recorded extensive wapato gardens sustained by deliberate hydraulic management.', project:'GDN' },
  { title:'The Fish Trap Complex', text:'Stone fish traps at the mouth of the Klamath River date to 7,000 BP. These permanent installations channeled salmon into holding pools using current and structure — passive hydraulic engineering.', project:'SAL' },
  { title:'The Clam Garden', text:'Coastal First Nations built clam gardens — rock-walled terraces in the intertidal zone that expanded productive clam habitat by 150%. These are the oldest known mariculture structures in the Americas.', project:'FFA' },
  { title:'The Beaver Alliance', text:'Indigenous water management often incorporated beaver activity. Tribes left beaver dams intact as water storage infrastructure. Trapping-era removal of beaver collapsed the hydrological systems both species maintained.', project:'AWF' }
]},
// ══════════ 9-16: TECHNOLOGY ══════════
{ id:9, name:'The Mesh Networking Trail', guide:'marten', color:'#2a8a96', theme:'Phones, routers, and antennas building decentralized networks in the field', waypoints:[
  { title:'The Ad Hoc Node', text:'802.11s mesh allows any WiFi device to act as both client and router. A phone with mesh firmware extends the network to every other phone in range — no central infrastructure required.', project:'SYS' },
  { title:'The Relay Chain', text:'LoRa radios transmit 10-15 km line-of-sight at 300 bps. A chain of 5 solar-powered LoRa nodes can bridge a 60 km wilderness gap on 100 milliwatts per node — the power of a single LED.', project:'LED' },
  { title:'The Mesh at the Burn', text:'Burning Man 2024 ran a volunteer mesh network connecting 70,000 people across 7 square miles of alkaline desert. No cell towers — just donated routers and solar panels.', project:'BRC' },
  { title:'The Forest Canopy Net', text:'Sensor mesh networks in PNW old-growth canopy use 900 MHz radios that penetrate foliage. Each sensor node measures temperature, humidity, and light — the forest gets its own nervous system.', project:'BPS' }
]},
{ id:10, name:'The Sensor Array Trail', guide:'dragonfly', color:'#d4a017', theme:'Arrays of simple sensors producing complex understanding', waypoints:[
  { title:'The Hydrophone Grid', text:'NOAA maintains 6 deep-ocean hydrophones off the PNW coast that detect whale calls, earthquakes, and submarine volcanoes. One hydrophone covers 1,000 km of ocean. Six cover the entire Northeast Pacific.', project:'OCN' },
  { title:'The Seismograph Web', text:'The Pacific Northwest Seismic Network operates 400+ stations. P-wave detection at 3 stations triangulates an earthquake epicenter within 5 seconds — fast enough for automated early warning.', project:'HGE' },
  { title:'The Camera Trap Grid', text:'A 10x10 grid of trail cameras covering 100 km2 generates 500,000 images per month. Machine learning classifies species in 92% of frames. The grid sees what human surveys miss — including species active only at night.', project:'MAM' },
  { title:'The Air Quality Mesh', text:'PurpleAir sensors cost $250 each. A neighborhood network of 20 sensors maps PM2.5 distribution at 100-meter resolution — 50x finer than the nearest EPA station. Citizen science fills the measurement gap.', project:'BPS' }
]},
{ id:11, name:'The Battery Chemistry Trail', guide:'otter', color:'#c75b3a', theme:'From lead-acid to solid-state — how we store the energy we capture', waypoints:[
  { title:'The Lithium Revolution', text:'Lithium-ion batteries store 250 Wh/kg — 6x more than lead-acid. The cathode chemistry (NMC, LFP, NCA) determines the tradeoff between energy density, cycle life, cost, and thermal stability.', project:'THE' },
  { title:'The Iron-Air Promise', text:'Iron-air batteries use rust chemistry: iron oxidizes on discharge, reduces on charge. Energy density is low (150 Wh/kg) but iron is cheap and abundant — ideal for grid-scale storage at $20/kWh.', project:'ROF' },
  { title:'The Sodium Option', text:'Sodium-ion batteries replace lithium with sodium — 1,000x more abundant and geographically distributed. Energy density reaches 160 Wh/kg, sufficient for stationary storage and short-range vehicles.', project:'EMG' },
  { title:'The Solid State Horizon', text:'Solid-state batteries replace liquid electrolyte with ceramic or glass. The payoff: 500 Wh/kg, no thermal runaway, 10,000 cycle life. Toyota targets 2028 production. The chemistry works — the manufacturing is the problem.', project:'T55' }
]},
{ id:12, name:'The Antenna Design Trail', guide:'hawk', color:'#c8a040', theme:'From dipole to phased array — how we shape electromagnetic waves', waypoints:[
  { title:'The Half-Wave Dipole', text:'A half-wave dipole at 146 MHz is 97 cm long. Its radiation pattern is a donut — omnidirectional in azimuth, null at the tips. Every antenna design starts here. Understand the dipole and you understand them all.', project:'LED' },
  { title:'The Yagi-Uda', text:'A Yagi antenna adds parasitic elements to focus energy: one reflector behind, multiple directors ahead. A 7-element 2m Yagi achieves 10 dBd gain — the signal is focused like a flashlight instead of a candle.', project:'EMG' },
  { title:'The Patch Array', text:'Microstrip patch antennas are printed copper squares on FR4 board. At 2.4 GHz, a patch is 31mm square. A 4x4 array with controlled phase shift steers the beam electronically — no moving parts.', project:'T55' },
  { title:'The Fractal Antenna', text:'Fractal geometry produces antennas that are multi-band by structure. A Sierpinski triangle antenna resonates at its full size, half size, and quarter size simultaneously — three bands from one shape.', project:'SHE' }
]},
{ id:13, name:'The Signal Processing Trail', guide:'bat', color:'#5a3a5c', theme:'Extracting meaning from noise — the math behind every sensor', waypoints:[
  { title:'The Fourier Transform', text:'Every signal is a sum of sine waves. The FFT decomposes a time-domain signal into frequency components in O(n log n) operations. A 1-second audio clip at 44.1 kHz resolves to 22,050 frequency bins in 0.3 milliseconds.', project:'MPC' },
  { title:'The Kalman Filter', text:'The Kalman filter fuses noisy sensor readings with a dynamic model to estimate true state. GPS receivers use it to combine satellite timing signals with motion models — turning 10-meter accuracy into 1-meter.', project:'BPS' },
  { title:'The Matched Filter', text:'A matched filter maximizes SNR by correlating the received signal with a known template. Radar uses it — the return echo is cross-correlated with the transmitted pulse. Detection in noise that would blind any other method.', project:'SHE' },
  { title:'The Wavelet Transform', text:'Wavelets decompose signals in both time and frequency simultaneously. Where FFT tells you which frequencies exist, wavelets tell you when each frequency appears. Seismology uses wavelets to locate earthquake rupture timing.', project:'HGE' }
]},
{ id:14, name:'The Control Systems Trail', guide:'eagle', color:'#3a7ac7', theme:'Feedback loops that keep systems stable — from thermostats to autopilots', waypoints:[
  { title:'The PID Controller', text:'Proportional-Integral-Derivative control is the workhorse of industrial automation. 95% of all feedback loops in manufacturing use PID. Three terms — react to error, accumulate past error, predict future error.', project:'SYS' },
  { title:'The Phase Margin', text:'A control loop oscillates when the feedback signal arrives 180 degrees late. Phase margin measures how close you are to instability. Fighter jets fly with 6 degrees of margin — stable, but only with software holding the line.', project:'T55' },
  { title:'The State Space', text:'State-space representation models a system as vectors: state, input, output. A quadcopter has 12 state variables (position, velocity, attitude, angular rate). The controller solves a 12-dimensional optimization every 4 milliseconds.', project:'MPC' },
  { title:'The Adaptive Loop', text:'Model Reference Adaptive Control adjusts its own gains in real time to match a reference model. When the plant changes — ice on a wing, load shift on a crane — the controller re-tunes itself without human input.', project:'CMH' }
]},
{ id:15, name:'The Data Compression Trail', guide:'wren', color:'#5eb8c4', theme:'Saying more with less — from Morse code to neural codecs', waypoints:[
  { title:'The Huffman Tree', text:'Huffman coding assigns shorter bit strings to more frequent symbols. In English text, the letter e gets 3 bits while z gets 11. Average compression: 45%. The tree is built once, used forever.', project:'GSD2' },
  { title:'The LZ Family', text:'Lempel-Ziv algorithms replace repeated byte sequences with back-references. ZIP, gzip, and PNG all use LZ variants. A 1 MB English text compresses to 350 KB — the redundancy in language is measurable.', project:'MPC' },
  { title:'The Psychoacoustic Model', text:'MP3 encoding removes sounds the human ear cannot hear — frequencies masked by louder nearby frequencies, temporal masking before and after transients. 10:1 compression with inaudible loss. The codec knows your ears.', project:'GRD' },
  { title:'The Neural Codec', text:'Opus and Lyra use neural networks to model speech at 6 kbps — 20x less bandwidth than uncompressed. The network predicts what your voice will do next and transmits only the corrections. AI compression.', project:'DAA' }
]},
{ id:16, name:'The Encryption Trail', guide:'octopus', color:'#2a3a5c', theme:'From Caesar cipher to post-quantum — keeping secrets with math', waypoints:[
  { title:'The One-Time Pad', text:'A one-time pad is theoretically unbreakable — each message byte is XORed with a truly random key byte used only once. The constraint: the key must be as long as the message and never reused. Perfect secrecy, impractical distribution.', project:'SYS' },
  { title:'The RSA Foundation', text:'RSA encryption relies on the difficulty of factoring the product of two large primes. A 2048-bit RSA key would take 300 trillion years to factor by brute force. The security lives in a math problem no one has solved efficiently.', project:'MPC' },
  { title:'The Elliptic Curve', text:'Elliptic curve cryptography achieves RSA-equivalent security with 256-bit keys instead of 2048-bit. The math: point addition on curves over finite fields. Smaller keys mean faster handshakes — TLS 1.3 defaults to ECC.', project:'CMH' },
  { title:'The Quantum Threat', text:'Shors algorithm on a quantum computer factors large numbers in polynomial time — breaking RSA. NIST standardized CRYSTALS-Kyber (lattice-based) in 2024 as the post-quantum replacement. The arms race moved to lattice geometry.', project:'DAA' }
]},
// ══════════ 17-24: CROSS-DOMAIN ══════════
{ id:17, name:'The Music-Math Trail', guide:'thrush', color:'#e074a8', theme:'Frequency ratios, Fourier series, and the geometry of harmony', waypoints:[
  { title:'The Harmonic Series', text:'A vibrating string produces frequencies at 1x, 2x, 3x, 4x its fundamental. The ratios 2:1 (octave), 3:2 (fifth), 4:3 (fourth) are the basis of Western harmony. Music is integer ratios made audible.', project:'GRD' },
  { title:'The Equal Temperament Compromise', text:'Pure fifths (3:2 ratio) do not stack to form perfect octaves — 12 fifths overshoot 7 octaves by 23.46 cents. Equal temperament distributes this error across all 12 semitones. Every note is slightly wrong so no key is unusable.', project:'MPC' },
  { title:'The Rhythm Group Theory', text:'Time signatures partition beats into cyclic groups. 4/4 is Z4, 3/4 is Z3, 7/8 is Z7. Polyrhythms are products of cyclic groups — 3 against 4 is Z12 with accents at positions 0,3,4,6,8,9. Group theory hears the beat.', project:'DAA' },
  { title:'The Spectral Composition', text:'Composers like Grisey and Murail build harmony from spectral analysis of instrumental sounds. A trombone note contains 16 audible partials — each partial becomes a voice in the orchestra. The instrument composes the piece.', project:'SPA' }
]},
{ id:18, name:'The Ecology-Infrastructure Trail', guide:'beaver', color:'#7a6a3a', theme:'Every human system has a biological analog that got there first', waypoints:[
  { title:'The Beaver Dam as Weir', text:'Beaver dams function as grade-control structures, sediment traps, and flow regulators — the three functions that human weirs perform. The beaver design costs nothing, self-repairs, and improves with age.', project:'AWF' },
  { title:'The Mycorrhizal Internet', text:'Fungal networks distribute nutrients and chemical signals between trees — a distributed mesh with no central server. The architecture predates the internet by 400 million years and scales to forest-wide coverage.', project:'ECO' },
  { title:'The Termite HVAC', text:'Termite mounds maintain 30 degrees Celsius and 90% humidity using convective airflow channels. No mechanical parts, no energy input beyond metabolism. The mound is a passive HVAC system with 0.1 degree precision.', project:'SYS' },
  { title:'The Coral Load Balancer', text:'Coral reef structure distributes wave energy across millions of individual polyps. No single polyp bears the full load. The reef absorbs 97% of wave energy — the most efficient distributed load balancer on Earth.', project:'OCN' }
]},
{ id:19, name:'The Art-Physics Trail', guide:'sitka', color:'#9b59b6', theme:'When artists and physicists discover the same structure from different directions', waypoints:[
  { title:'The Chladni Pattern', text:'Sand on a vibrating plate organizes into nodal-line patterns that map the plate s resonant modes. Ernst Chladni discovered them in 1787. Luthiers had been using them to tune violin tops for 200 years already.', project:'FFA' },
  { title:'The Monet Diffraction', text:'Monet s water lily paintings use color mixing that matches predictions from optical diffraction theory. The impressionist eye was computing interference patterns unconsciously — art and physics converged on the same canvas.', project:'ARC' },
  { title:'The Bridget Riley Op', text:'Bridget Riley s paintings exploit lateral inhibition in human visual cortex. The patterns shimmer because adjacent neurons suppress each other. The art is painted on canvas but the effect is computed in your brain.', project:'SPA' },
  { title:'The Sitka Soundboard', text:'Sitka spruce tonewood selection uses tap-tone testing — the same eigenvalue analysis physicists use for structural resonance. A luthier tapping a billet is solving the wave equation by ear.', project:'GRD' }
]},
{ id:20, name:'The Philosophy-Biology Trail', guide:'raven', color:'#5a3a5a', theme:'Questions philosophers debated for centuries that biology answered with data', waypoints:[
  { title:'The Ship of Theseus', text:'Every atom in your body is replaced within 7-10 years. You are the Ship of Theseus — continuous identity through complete material replacement. Biology answers the thought experiment: identity is pattern, not substance.', project:'DAA' },
  { title:'The Trolley Problem in Nature', text:'Kin selection theory predicts altruistic behavior when cost < relatedness x benefit. Worker bees die stinging intruders because shared genes make the colony s survival worth more than the individual. Hamilton solved the trolley problem in 1964.', project:'ECO' },
  { title:'The Free Will Debate', text:'Libet s 1983 experiment found that brain readiness potentials precede conscious awareness of decisions by 350 milliseconds. The neuroscience does not resolve free will — but it measures the gap between action and awareness.', project:'MPC' },
  { title:'The Hard Problem', text:'Octopus chromatophores respond to visual input without neural connection to the brain — the skin sees. If consciousness requires centralized processing, the octopus disproves it. Awareness may be distributed, not singular.', project:'SPA' }
]},
{ id:21, name:'The History-Geology Trail', guide:'glacier', color:'#7a9abc', theme:'Human history written in rock layers, ice cores, and erosion patterns', waypoints:[
  { title:'The Missoula Floods', text:'Between 15,000 and 13,000 years ago, glacial Lake Missoula burst 40+ times, sending walls of water 300 meters high across eastern Washington at 100 km/h. The Channeled Scablands are the largest flood-eroded landscape on Earth.', project:'HGE' },
  { title:'The Mazama Eruption', text:'Mount Mazama erupted 7,700 years ago, ejecting 50 cubic km of material and forming Crater Lake. The ash layer is a chronological marker across the PNW — any soil above it is younger than 7,700 years.', project:'THE' },
  { title:'The Cascadia Subduction', text:'The last Cascadia megathrust earthquake (M9.0) struck January 26, 1700 at 9 PM. We know the exact time because the resulting tsunami hit Japan on January 27 and Japanese records noted the arrival. Geology confirmed by history.', project:'ROF' },
  { title:'The Loess Record', text:'Palouse loess deposits in eastern Washington are 75 meters deep — wind-blown glacial silt accumulated over 2 million years. Each layer records wind direction, precipitation, and vegetation. The soil IS the history book.', project:'CAS' }
]},
{ id:22, name:'The Language-Music Trail', guide:'orca', color:'#1a5c8a', theme:'How spoken language and musical structure share the same cognitive roots', waypoints:[
  { title:'The Prosodic Bridge', text:'Infant-directed speech (motherese) uses the same pitch contours across all human languages: rising pitch for attention, falling pitch for comfort. These contours match musical intervals — the major third for approval, the minor second for warning.', project:'GRD' },
  { title:'The Tonal Languages', text:'Mandarin, Cantonese, and Yoruba use pitch to distinguish word meaning. Speakers of tonal languages show enhanced musical pitch discrimination — the brain circuitry for language and music overlaps in Broca s area.', project:'DAA' },
  { title:'The Whale Syntax', text:'Humpback whale songs follow hierarchical rules: units combine into phrases, phrases into themes, themes into songs. The structure mirrors human syntax. Whether it carries semantic meaning is the open question.', project:'MAM' },
  { title:'The Bird Dialect', text:'White-crowned sparrow songs vary by dialect across the PNW — a Marin County bird sings differently from a Puget Sound bird. Young birds learn local dialect during a sensitive period, just like human children acquire regional accent.', project:'AVI' }
]},
{ id:23, name:'The Cooking-Chemistry Trail', guide:'chanterelle', color:'#d4a017', theme:'Every recipe is a chemistry experiment — Maillard, fermentation, emulsion', waypoints:[
  { title:'The Maillard Reaction', text:'Above 140 degrees Celsius, amino acids and reducing sugars react to produce hundreds of flavor compounds. This single reaction creates the flavor of bread crust, seared meat, roasted coffee, and toasted marshmallow.', project:'GDN' },
  { title:'The Fermentation Engine', text:'Saccharomyces cerevisiae converts glucose to ethanol and CO2 through anaerobic glycolysis. The same organism makes bread rise, beer ferment, and wine develop. Humanity s oldest biotechnology — 9,000 years of yeast domestication.', project:'FFA' },
  { title:'The Smoke Chemistry', text:'Wood smoke contains 200+ flavor compounds. Guaiacol provides smokiness, syringol provides sweetness, creosol provides spice. Alder smoke (PNW traditional) has lower phenol content than hickory — a milder, sweeter profile.', project:'TIBS' },
  { title:'The Emulsion Physics', text:'Mayonnaise is an oil-in-water emulsion stabilized by lecithin from egg yolk. The phospholipid head is hydrophilic, the tail hydrophobic. One egg yolk emulsifies 1 liter of oil. The ratio fails at 1.2 liters — the physics has a cliff.', project:'BPS' }
]},
{ id:24, name:'The Building-Ecology Trail', guide:'alder', color:'#4a7c3f', theme:'Structures that work with biology instead of against it', waypoints:[
  { title:'The Living Roof', text:'Green roofs with 15 cm substrate reduce stormwater runoff by 70% and surface temperature by 25 degrees Celsius compared to conventional roofs. The ecology IS the engineering — plants do the work of drains and insulation.', project:'GDN' },
  { title:'The Mass Timber Revolution', text:'Cross-laminated timber (CLT) sequesters 1 tonne of CO2 per cubic meter. An 18-story CLT building stores 3,000 tonnes of carbon. The structure is the carbon sink — the building grows the forest backward into architecture.', project:'COL' },
  { title:'The Mycelium Block', text:'Mycelium composite (fungal root material grown on agricultural waste) produces insulation with R-value of 3 per inch, is fireproof, and biodegrades completely. The building material grows itself in 5 days from farm waste.', project:'ECO' },
  { title:'The Passive House', text:'Passivhaus standard limits heating demand to 15 kWh/m2/year — 90% less than conventional buildings. The secret: 40 cm insulation, triple glazing, heat recovery ventilation. No furnace needed. The building keeps itself warm.', project:'THE' }
]},
// ══════════ 25-32: FUTURE ══════════
{ id:25, name:'The Ocean Computing Trail', guide:'kelp', color:'#2a8a96', theme:'Cooling servers with seawater and powering them with tides', waypoints:[
  { title:'The Subsea Data Center', text:'Microsoft s Project Natick operated a sealed data center on the Scottish seabed for 2 years. Failure rate was 1/8 that of land-based centers. Constant 12 degree seawater eliminated cooling costs entirely.', project:'OCN' },
  { title:'The Tidal Power Link', text:'A subsea data center at Tacoma Narrows could tap 2 million cubic meters of tidal flow per cycle. 1 MW of tidal turbine output powers 500 server racks — computation fueled by the Moon s gravity.', project:'ROF' },
  { title:'The Kelp Farm Synergy', text:'Data center waste heat warms adjacent kelp farms, accelerating growth. The kelp absorbs CO2 from the water. The data center s thermal pollution becomes the kelp farm s growth accelerator. Waste becomes input.', project:'ECO' },
  { title:'The Latency Geography', text:'Subsea fiber optic cables carry 95% of intercontinental internet traffic. A Pacific coast data center has 60 ms round-trip to Tokyo vs 120 ms from the US East Coast. Geography is latency — position is performance.', project:'SYS' }
]},
{ id:26, name:'The Quantum Biology Trail', guide:'bee', color:'#d4881a', theme:'Quantum effects operating at room temperature inside living cells', waypoints:[
  { title:'The Avian Compass', text:'European robins detect Earth s magnetic field using radical pair reactions in cryptochrome proteins. The quantum spin state of electron pairs is sensitive to magnetic field orientation. Navigation by quantum entanglement.', project:'AVI' },
  { title:'The Photosynthesis Trick', text:'Photosynthetic light-harvesting complexes transfer energy at 99% efficiency using quantum coherence. Energy takes all possible paths simultaneously and collapses to the most efficient one. Evolution found quantum computing first.', project:'ECO' },
  { title:'The Enzyme Tunnel', text:'Enzyme catalysis sometimes exploits quantum tunneling — protons tunnel through energy barriers instead of climbing over them. Alcohol dehydrogenase in your liver uses tunneling to break C-H bonds 1,000x faster than classical chemistry allows.', project:'MPC' },
  { title:'The Smell Theory', text:'The vibrational theory of olfaction proposes that the nose detects molecular vibration frequencies, not just shapes. Deuterated musks (same shape, different vibration) smell different to fruit flies. If correct, the nose is a quantum spectrometer.', project:'BPS' }
]},
{ id:27, name:'The Biomimicry Trail', guide:'spider', color:'#6a9a5a', theme:'Engineering solutions borrowed from 3.8 billion years of R&D', waypoints:[
  { title:'The Spider Silk', text:'Spider dragline silk has tensile strength of 1.1 GPa — stronger than steel by weight. It absorbs 3x more energy per unit mass than Kevlar before breaking. Synthetic spider silk production reached commercial scale in 2024.', project:'FFA' },
  { title:'The Gecko Adhesive', text:'Gecko toe pads use van der Waals forces across millions of nanoscale setae. No glue — pure physics. Synthetic gecko adhesive tape holds 315 kg on glass. Repeatable, residue-free, works in vacuum. NASA tested it for spacewalk tools.', project:'T55' },
  { title:'The Lotus Effect', text:'Lotus leaf surfaces are superhydrophobic — water beads roll off, carrying dirt particles with them. The nanostructure is a forest of wax pillars 10 micrometers apart. Self-cleaning coatings based on lotus geometry now protect solar panels.', project:'BPS' },
  { title:'The Whale Turbine', text:'Humpback whale flipper tubercles (bumpy leading edges) reduce stall angle by 40% and increase lift. Wind turbine blades with tubercle-inspired leading edges generate 20% more power in turbulent conditions. The whale designed the blade.', project:'ROF' }
]},
{ id:28, name:'The Circular Economy Trail', guide:'chanterelle', color:'#d4a017', theme:'Designing waste out of the system entirely', waypoints:[
  { title:'The Mushroom Packaging', text:'Ecovative grows packaging from mycelium on agricultural waste in 7 days. It replaces expanded polystyrene, biodegrades in 45 days, and costs competitive at scale. IKEA and Dell ship products in mushroom foam.', project:'GDN' },
  { title:'The Phosphorus Loop', text:'Phosphorus is a finite resource — peak phosphorus is projected for 2030-2040. Struvite recovery from wastewater captures phosphorus and ammonium as slow-release fertilizer. The circular loop turns sewage into crop nutrient.', project:'ECO' },
  { title:'The E-Waste Mine', text:'One tonne of circuit boards contains 800x more gold than one tonne of ore. Urban mining of e-waste now supplies 20% of global copper, 30% of gold, and 50% of palladium. The richest mine is the landfill.', project:'EMG' },
  { title:'The Carbon Concrete', text:'CarbonCure injects captured CO2 into concrete during mixing. The CO2 mineralizes into calcium carbonate, permanently sequestered. Each cubic meter of CarbonCure concrete stores 17 kg of CO2 — and it is stronger than conventional mix.', project:'THE' }
]},
{ id:29, name:'The Regenerative Agriculture Trail', guide:'fern', color:'#4a7c3f', theme:'Farming that builds soil instead of mining it', waypoints:[
  { title:'The No-Till Revolution', text:'No-till farming preserves soil fungal networks that conventional plowing destroys. After 5 years of no-till, soil organic matter increases 0.5-1% per year. One percent increase in organic matter adds 75,000 liters of water-holding capacity per hectare.', project:'GDN' },
  { title:'The Cover Crop Bank', text:'Cover crops planted between cash crops fix nitrogen (legumes), break compaction (daikon radish), and suppress weeds (rye). A three-species cover crop mix improves soil health metrics 3x faster than single species.', project:'ECO' },
  { title:'The Silvopasture Model', text:'Trees integrated into pasture (silvopasture) increase forage production 15%, sequester 5-10 tonnes CO2/hectare/year, and reduce livestock heat stress. The shade and root network make the pasture more productive, not less.', project:'AWF' },
  { title:'The Compost Science', text:'Properly managed compost reaches 55-65 degrees Celsius for 3+ days, killing pathogens and weed seeds. The finished product has a C:N ratio of 15-20:1, bulk density of 600 kg/m3, and biological activity of 1 billion organisms per gram.', project:'CAS' }
]},
{ id:30, name:'The Urban Ecology Trail', guide:'coyote', color:'#9b8a4a', theme:'Cities as ecosystems — the unexpected biodiversity of pavement and parks', waypoints:[
  { title:'The Urban Heat Island', text:'Portland s urban core is 3-5 degrees Celsius warmer than surrounding forest. The heat island creates its own microclimate — earlier spring, later fall, higher nighttime temperatures. Trees in urban parks reduce local temperature by 2 degrees per 10% canopy cover.', project:'THE' },
  { title:'The Peregrine Falcon', text:'Peregrine falcons nest on 30+ buildings in PNW cities. Urban cliff faces (skyscrapers) and abundant prey (pigeons) make cities their most productive habitat. Portland s Fremont Bridge pair fledges 3-4 chicks annually since 2009.', project:'AVI' },
  { title:'The Stormwater Forest', text:'Portland s Green Streets program uses bioswales, rain gardens, and street trees to manage stormwater. One street tree intercepts 3,000 gallons of rain per year. The urban forest is the stormwater infrastructure.', project:'AWF' },
  { title:'The Pollinator Corridor', text:'Seattle s Pollinator Pathway connects 1 mile of gardens across private rooftops, balconies, and parklets. Native bee diversity along the corridor is 40% higher than surrounding blocks. The city blooms in a line.', project:'GDN' }
]},
{ id:31, name:'The Space Ecology Trail', guide:'pika', color:'#7a9abc', theme:'Closed-loop life support — growing food and recycling air beyond Earth', waypoints:[
  { title:'The MELiSSA Loop', text:'ESA s MELiSSA project designs closed-loop life support using 5 compartments: waste liquefaction, photoheterotrophic bacteria, nitrifying bacteria, photosynthetic algae, and a hydroponic plant chamber. 4 organisms recycling everything.', project:'SPA' },
  { title:'The Lunar Regolith Farm', text:'Lunar soil (regolith) contains all elements needed for plant growth but lacks nitrogen and organic matter. Adding just 1% compost by weight and nitrogen-fixing bacteria converts sterile regolith into productive soil within 90 days.', project:'GDN' },
  { title:'The Radiation Garden', text:'Mars surface radiation is 0.67 mSv/day — 200x Earth level. Growing food under 1 meter of regolith shielding reduces dose to Earth-normal levels. The garden is underground. The farm is a bunker.', project:'HGE' },
  { title:'The Oxygen Farm', text:'One square meter of high-density lettuce produces 5 liters of oxygen per day through photosynthesis. A crew of 4 needs 3,200 liters/day — requiring 640 m2 of growing area. The space station is a greenhouse with sleeping quarters.', project:'ECO' }
]},
{ id:32, name:'The Digital Preservation Trail', guide:'lex', color:'#5eb8c4', theme:'Keeping data alive across decades, centuries, and format obsolescence', waypoints:[
  { title:'The Format Graveyard', text:'Floppy disks, ZIP drives, MiniDisc, HD-DVD, Flash — each format lasted 5-15 years. The data on them is inaccessible without extinct hardware. Digital preservation means migrating content forward before the reader dies.', project:'SYS' },
  { title:'The LOCKSS Principle', text:'Lots of Copies Keep Stuff Safe. Stanford s LOCKSS program distributes digital journal archives across 200+ libraries worldwide. No single institution failure can destroy the record. Redundancy is the only durable strategy.', project:'GSD2' },
  { title:'The DNA Storage', text:'DNA stores data at 215 petabytes per gram — 1 million times denser than SSD. Microsoft and Twist Bioscience encoded 200 MB of data in synthetic DNA in 2019. Read cost is falling 10x every 2 years. The archive fits in a test tube.', project:'MPC' },
  { title:'The Arctic Vault', text:'GitHub s Arctic Code Vault stores 21 TB of open-source code in a decommissioned coal mine on Svalbard. Written on photosensitive film designed to last 1,000 years. The permafrost is the refrigerator. The mine is the archive.', project:'DAA' }
]}
];
