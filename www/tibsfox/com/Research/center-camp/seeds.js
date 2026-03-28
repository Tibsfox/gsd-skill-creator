/* ═══════════════════════════════════════════════════════════════
   The Seed Catalog — 128 future installations waiting to grow
   8 groves × 16 seeds — planted by the muses, grown by visitors
   ═══════════════════════════════════════════════════════════════ */

var SEEDS = [

  // ═══ GROVE 1: THE OBSERVATORY (seeds 1-16) — Science & Physics ═══

  { id: 1, name: 'The Pendulum', muse: 'cedar', type: 'simulation', domain: 'science',
    difficulty: 'seedling',
    description: 'An interactive gravity simulation. Swing a weight and measure how period changes with length. Drag the bob, release, and watch the trace draw a sine wave in real time. The forest keeps time by gravity.',
    teaches: 'Relationship between pendulum length and period — simple harmonic motion',
    connections: [7, 51, 81] },

  { id: 2, name: 'The Prism', muse: 'star', type: 'visualization', domain: 'science',
    difficulty: 'seedling',
    description: 'Split white light into its spectrum by dragging a prism across a beam. Match each color band to its wavelength. Click a color to hear which PNW species sees in that range — bees in ultraviolet, salmon in polarized light.',
    teaches: 'Electromagnetic spectrum, wavelength-color relationship, animal vision',
    connections: [8, 33, 40] },

  { id: 3, name: 'The Telescope', muse: 'lex', type: 'exploration', domain: 'science',
    difficulty: 'sapling',
    description: 'Zoom into the PNW night sky from a clearing in old growth. Find constellations, identify planets, and link each to the astronomy department. Time slider shows how the sky changes across seasons — the same clearing, twelve different skies.',
    teaches: 'Celestial navigation, seasonal sky rotation, light pollution awareness',
    connections: [16, 104, 124] },

  { id: 4, name: 'The Microscope', muse: 'salamander', type: 'exploration', domain: 'science',
    difficulty: 'sapling',
    description: 'Zoom into a cross-section of PNW forest soil. At each magnification level, discover different organisms — root hairs, nematodes, tardigrades, bacteria. The deeper you go, the stranger it gets. Every layer depends on the one below.',
    teaches: 'Soil microbiome, scale of biological organization, ecosystem foundations',
    connections: [21, 87, 116] },

  { id: 5, name: 'The Thermometer', muse: 'hemlock', type: 'visualization', domain: 'science',
    difficulty: 'seedling',
    description: 'A gradient visualization showing how heat flows through PNW thermal systems. Drag a heat source across the landscape — watch conduction through rock, convection through air, radiation from sun to canopy. Colors shift from blue to red.',
    teaches: 'Three modes of heat transfer — conduction, convection, radiation',
    connections: [14, 85, 113] },

  { id: 6, name: 'The Barometer', muse: 'fog', type: 'game', domain: 'science',
    difficulty: 'sapling',
    description: 'A weather prediction game using atmospheric pressure patterns. Read the barometer, check the wind, study the clouds. Make your forecast for the next six hours. The PNW coastal weather system is your teacher — get it wrong and the hikers get rained on.',
    teaches: 'Atmospheric pressure, weather prediction, PNW marine weather patterns',
    connections: [14, 95, 15] },

  { id: 7, name: 'The Seismograph', muse: 'sturgeon', type: 'simulation', domain: 'science',
    difficulty: 'old-growth',
    description: 'The Cascadia Subduction Zone earthquake simulation. Adjust magnitude, depth, and distance. Watch P-waves and S-waves propagate through a cross-section of PNW geology. The needle draws the trace. Every 300-500 years, the big one resets the coast.',
    teaches: 'Seismic wave propagation, subduction zone geology, earthquake preparedness',
    connections: [1, 94, 126] },

  { id: 8, name: 'The Spectrometer', muse: 'lex', type: 'puzzle', domain: 'science',
    difficulty: 'sapling',
    description: 'Match emission lines to elements found in PNW geology. Each rock sample produces a unique spectral fingerprint. Identify the elements in basalt, granite, obsidian, and serpentine. The same technique astronomers use to read distant stars works on the ground beneath your feet.',
    teaches: 'Atomic emission spectra, elemental identification, geological composition',
    connections: [2, 10, 96] },

  { id: 9, name: 'The Particle Cloud', muse: 'fog', type: 'simulation', domain: 'science',
    difficulty: 'seedling',
    description: 'Brownian motion simulation with forest dust particles. Watch pollen grains bounce off invisible air molecules in a shaft of sunlight. Adjust temperature and particle size. Einstein explained this in 1905 — you can see it any afternoon in old growth.',
    teaches: 'Brownian motion, kinetic theory of gases, Einstein\'s 1905 paper',
    connections: [15, 32, 73] },

  { id: 10, name: 'The Half-Life', muse: 'glacier', type: 'visualization', domain: 'science',
    difficulty: 'seedling',
    description: 'Radioactive decay visualization using carbon-14 dating of old-growth wood. Click a tree ring and watch C-14 atoms flip to nitrogen one by one. The older the ring, the fewer remain. A thousand-year-old cedar tells time through isotopes.',
    teaches: 'Radioactive decay, half-life, carbon-14 dating principles',
    connections: [66, 120, 127] },

  { id: 11, name: 'The Refraction Pool', muse: 'osprey', type: 'puzzle', domain: 'science',
    difficulty: 'sapling',
    description: 'Osprey\'s challenge: compute the light bending through water to catch a fish. The fish is never where it appears to be. Adjust your dive angle to account for Snell\'s law. Miss three times and the fish escapes. Osprey corrects for refraction instinctively — can you learn to?',
    teaches: 'Snell\'s law, refraction, apparent vs actual position in water',
    connections: [12, 13, 89] },

  { id: 12, name: 'The Doppler Shift', muse: 'osprey', type: 'visualization', domain: 'science',
    difficulty: 'seedling',
    description: 'Osprey\'s dive whistle as a Doppler effect demonstration. Watch sound waves compress ahead of the diving bird and stretch behind. Drag the speed slider to hear the pitch change. The same effect tells astronomers whether galaxies approach or recede.',
    teaches: 'Doppler effect for sound and light, relative motion, redshift/blueshift',
    connections: [11, 52, 62] },

  { id: 13, name: 'The Wave Tank', muse: 'kelp', type: 'simulation', domain: 'science',
    difficulty: 'sapling',
    description: 'Create standing waves and interference patterns in a PNW tide pool. Drop two pebbles and watch the ripples interact — constructive and destructive interference painted on the water surface. Kelp sways in the resulting pattern.',
    teaches: 'Wave interference, superposition, standing waves, resonance',
    connections: [11, 51, 60] },

  { id: 14, name: 'The Pressure Gradient', muse: 'rain', type: 'visualization', domain: 'science',
    difficulty: 'sapling',
    description: 'How atmospheric pressure drives PNW weather systems. A cross-section from Pacific Ocean to Cascade crest. High pressure over the ocean pushes air onshore, mountains force it upward, rain falls on the west side, dry air descends into the rain shadow. The gradient is the engine.',
    teaches: 'Atmospheric pressure gradients, orographic precipitation, rain shadow effect',
    connections: [5, 6, 84] },

  { id: 15, name: 'The Phase Change', muse: 'rain', type: 'visualization', domain: 'science',
    difficulty: 'seedling',
    description: 'The PNW water cycle made visible. Follow a water molecule from Pacific evaporation to cloud formation to rain on old growth to river to ocean to fog drip. Each phase change absorbs or releases energy. The cycle never stops.',
    teaches: 'States of matter, phase transitions, latent heat, the water cycle',
    connections: [9, 86, 121] },

  { id: 16, name: 'The Magnetic Field', muse: 'star', type: 'visualization', domain: 'science',
    difficulty: 'sapling',
    description: 'Visualize Earth\'s magnetic field that rufous hummingbirds use to navigate their 3,900-mile migration. Iron filings trace the field lines from pole to pole. Flip the field and watch what happens to migration routes. The invisible compass that guides 10 grams of bird across a continent.',
    teaches: 'Earth\'s magnetic field, animal magnetoreception, migration navigation',
    connections: [3, 100, 122] },


  // ═══ GROVE 2: THE LIBRARY (seeds 17-32) — Math & Logic ═══

  { id: 17, name: 'The Fibonacci Garden', muse: 'chanterelle', type: 'visualization', domain: 'math',
    difficulty: 'seedling',
    description: 'Plant seeds in spiral patterns and watch the Fibonacci sequence emerge. Sunflower heads, pinecone scales, fern fiddleheads — nature counts in Fibonacci because it\'s the most efficient packing. Click to add seeds, watch the spiral tighten.',
    teaches: 'Fibonacci sequence, phyllotaxis, optimal packing in nature',
    connections: [19, 28, 87] },

  { id: 18, name: 'The Fractal Fern', muse: 'chanterelle', type: 'visualization', domain: 'math',
    difficulty: 'seedling',
    description: 'A recursive fractal generator that draws fern-like patterns using the Barnsley fern algorithm. Adjust four parameters and watch the shape morph between sword fern, maidenhair, and bracken. Self-similarity at every scale — zoom in and the pattern repeats.',
    teaches: 'Fractals, self-similarity, iterated function systems, recursive geometry',
    connections: [17, 29, 35] },

  { id: 19, name: 'The Golden Spiral', muse: 'nutcracker', type: 'visualization', domain: 'math',
    difficulty: 'seedling',
    description: 'An orb weaver\'s web as golden ratio demonstration. The spider builds outward in a logarithmic spiral — measure any two successive radii and their ratio approaches phi. Overlay the spiral on nautilus shells, hurricane eyes, and galaxy arms.',
    teaches: 'Golden ratio (phi), logarithmic spirals, mathematical beauty in nature',
    connections: [17, 37, 44] },

  { id: 20, name: 'The Binary Forest', muse: 'lex', type: 'game', domain: 'math',
    difficulty: 'seedling',
    description: 'Learn binary counting using tree branching patterns. Each fork is a bit — left is 0, right is 1. Walk the tree to spell numbers. Eight levels deep gives you 256 paths. The same logic that runs every computer, drawn in branches.',
    teaches: 'Binary number system, base-2 counting, tree data structures',
    connections: [30, 96, 115] },

  { id: 21, name: 'The Prime Sieve', muse: 'chanterelle', type: 'visualization', domain: 'math',
    difficulty: 'seedling',
    description: 'The Sieve of Eratosthenes visualized with mushroom spore patterns. Start with 100 numbered spores. Cross out multiples of 2, then 3, then 5, then 7. The survivors are prime — scattered in a pattern that looks random but follows deep rules.',
    teaches: 'Prime numbers, Sieve of Eratosthenes, distribution of primes',
    connections: [24, 31, 116] },

  { id: 22, name: 'The Graph Theory Trail', muse: 'lex', type: 'puzzle', domain: 'math',
    difficulty: 'sapling',
    description: 'Find Euler paths through the forest trail network. Can you walk every trail exactly once without backtracking? Some networks allow it, some don\'t — and the answer depends on how many odd-degree nodes exist. Konigsberg in the woods.',
    teaches: 'Euler paths, graph theory, vertex degree, network traversal',
    connections: [88, 100, 115] },

  { id: 23, name: 'The Sorting Creek', muse: 'bat', type: 'visualization', domain: 'math',
    difficulty: 'sapling',
    description: 'Sort river stones by size using different algorithms. Watch bubble sort slowly swap neighbors while merge sort divides and conquers. Quicksort picks a pivot stone. Count the comparisons. The creek doesn\'t care which algorithm you use — the stones end up sorted either way.',
    teaches: 'Sorting algorithms, algorithmic complexity, Big-O notation',
    connections: [30, 90, 96] },

  { id: 24, name: 'The Probability Pool', muse: 'bat', type: 'simulation', domain: 'math',
    difficulty: 'sapling',
    description: 'A salmon egg survival probability calculator. A female Chinook lays 4,000 eggs. Model predation, flood, temperature, disease. Run the simulation 1,000 times. On average, two adults return. Drag the sliders to see which threats matter most.',
    teaches: 'Probability, Monte Carlo simulation, expected value, sensitivity analysis',
    connections: [25, 89, 114] },

  { id: 25, name: 'The Statistics Meadow', muse: 'nutcracker', type: 'tool', domain: 'math',
    difficulty: 'sapling',
    description: 'Collect and analyze wildflower height distributions. Click to measure 50 lupines. Watch the histogram build in real time. Calculate mean, median, standard deviation. Compare your sample to the true population. The central limit theorem blooms in a meadow.',
    teaches: 'Descriptive statistics, normal distribution, central limit theorem, sampling',
    connections: [24, 95, 113] },

  { id: 26, name: 'The Venn Diagram Pools', muse: 'star', type: 'visualization', domain: 'math',
    difficulty: 'seedling',
    description: 'Three overlapping tide pools showing set theory. Pool A has anemones, Pool B has mussels, Pool C has urchins. Drag species between pools. The intersections are where species coexist. Union, intersection, complement — all visible in the intertidal.',
    teaches: 'Set theory, Venn diagrams, union, intersection, complement',
    connections: [22, 74, 108] },

  { id: 27, name: 'The Coordinates Game', muse: 'foxy', type: 'game', domain: 'math',
    difficulty: 'seedling',
    description: 'A geocaching-style coordinate finder in the forest. Given latitude and longitude, navigate to the hidden cache. Each find reveals a clue that leads to the next. Five caches, five coordinate systems — decimal degrees, DMS, UTM, what3words, and relative bearing.',
    teaches: 'Coordinate systems, latitude/longitude, map reading, navigation',
    connections: [94, 100, 105] },

  { id: 28, name: 'The Symmetry Mirror', muse: 'dragonfly', type: 'puzzle', domain: 'math',
    difficulty: 'seedling',
    description: 'Find lines of symmetry in butterfly wings and fern fronds. Drag mirrors across natural forms. Some have one line, some have many, some have rotational symmetry. Dragonfly wings have bilateral symmetry so precise it\'s measured in microns.',
    teaches: 'Symmetry types, reflection, rotation, bilateral vs radial symmetry',
    connections: [19, 29, 37] },

  { id: 29, name: 'The Tessellation Floor', muse: 'bee', type: 'puzzle', domain: 'math',
    difficulty: 'sapling',
    description: 'Tile the forest floor with geometric patterns. Only three regular polygons tessellate alone — triangles, squares, hexagons. Bees chose hexagons because they maximize area with minimum perimeter. Drag and rotate tiles. Fill the floor with zero gaps.',
    teaches: 'Tessellation, regular polygons, honeycomb conjecture, area optimization',
    connections: [18, 28, 42] },

  { id: 30, name: 'The Logic Gates', muse: 'beaver', type: 'simulation', domain: 'math',
    difficulty: 'old-growth',
    description: 'Build AND, OR, and NOT circuits from beaver dam water flow. Water flowing = 1, blocked = 0. A dam with two inputs that both need flow is AND. A channel that splits is OR. A gate that blocks when open is NOT. Chain them together to build a half-adder from sticks and mud.',
    teaches: 'Boolean logic, logic gates, circuit design, computational fundamentals',
    connections: [20, 23, 96] },

  { id: 31, name: 'The Encryption Trail', muse: 'coyote', type: 'game', domain: 'math',
    difficulty: 'sapling',
    description: 'Encode messages using Chinook Jargon cipher. Start with substitution (easy to break), advance to transposition, then a simple key-based cipher. Coyote hides a message on the trail. Crack the code to find the next clue. Frequency analysis is your friend.',
    teaches: 'Basic cryptography, substitution ciphers, frequency analysis, information security',
    connections: [20, 62, 115] },

  { id: 32, name: 'The Infinity Walk', muse: 'glacier', type: 'meditation', domain: 'math',
    difficulty: 'seedling',
    description: 'Zeno\'s paradox demonstrated on a forest trail. Walk halfway to the tree. Then half of what remains. Then half again. You never arrive — but you get infinitely close. The animation traces a convergent geometric series. Glacier moves slower than Zeno walks, and still arrives.',
    teaches: 'Zeno\'s paradox, convergent series, limits, the concept of infinity',
    connections: [9, 68, 73] },


  // ═══ GROVE 3: THE STUDIO (seeds 33-48) — Art & Design ═══

  { id: 33, name: 'The Color Wheel Meadow', muse: 'madrone', type: 'tool', domain: 'art',
    difficulty: 'seedling',
    description: 'Mix colors from PNW wildflower pigments. Indian paintbrush red, lupine blue, Oregon grape yellow. Drag flowers onto the mixing palette to discover complementary pairs, triads, and split-complementary schemes. The meadow is a color wheel already planted.',
    teaches: 'Color theory, complementary colors, pigment mixing, color harmony',
    connections: [2, 45, 48] },

  { id: 34, name: 'The Perspective Trail', muse: 'foxy', type: 'tool', domain: 'art',
    difficulty: 'sapling',
    description: 'One-point perspective drawing using a corridor of old-growth Douglas fir. The trees converge to a vanishing point on the trail. Draw guidelines from the point to the edges. Place objects along the depth lines. The forest teaches perspective by being a corridor.',
    teaches: 'One-point perspective, vanishing points, foreshortening, depth illusion',
    connections: [41, 47, 94] },

  { id: 35, name: 'The Texture Library', muse: 'madrone', type: 'exploration', domain: 'art',
    difficulty: 'seedling',
    description: 'Explore twenty PNW textures rendered in high detail — Doug fir bark, sphagnum moss, river cobble, sea otter fur, cedar heartwood, obsidian, dried kelp. Each texture card shows close-up, cross-section, and material properties. Madrone bark peels like paper.',
    teaches: 'Visual texture, material properties, observational drawing, natural patterns',
    connections: [18, 43, 46] },

  { id: 36, name: 'The Shadow Sundial', muse: 'owl', type: 'simulation', domain: 'art',
    difficulty: 'sapling',
    description: 'Cast shadows with trees to tell time. Set the latitude to 47°N (Seattle) and watch shadows sweep through a day. Solstice shadows are short. Equinox shadows hit the hour marks. The same principle humans used for 5,000 years, demonstrated with a single tree.',
    teaches: 'Sundial geometry, solar angle, latitude effects, timekeeping history',
    connections: [83, 103, 107] },

  { id: 37, name: 'The Weaving Loom', muse: 'willow', type: 'tool', domain: 'art',
    difficulty: 'old-growth',
    description: 'A Coast Salish weaving pattern generator. Choose warp and weft colors from natural dyes — cedar bark brown, nettle green, beargrass white. Twill, plain, and wrapped twining techniques. Patterns encode stories. The loom remembers what the weaver intended.',
    teaches: 'Weaving techniques, pattern encoding, Coast Salish textile arts, material culture',
    connections: [19, 99, 110] },

  { id: 38, name: 'The Pottery Wheel', muse: 'willow', type: 'simulation', domain: 'art',
    difficulty: 'sapling',
    description: 'Shape clay vessels inspired by PNW Indigenous pottery traditions. Coil-building technique — no wheel. Press, smooth, shape with tools. Fire in a virtual pit kiln. The clay comes from riverbanks, the temper from crushed shell. Form follows function.',
    teaches: 'Ceramics fundamentals, coil construction, pit firing, vessel design',
    connections: [42, 46, 82] },

  { id: 39, name: 'The Printmaking Press', muse: 'foxy', type: 'tool', domain: 'art',
    difficulty: 'seedling',
    description: 'A leaf and bark print simulator. Pick a specimen — big-leaf maple, sword fern, western red cedar — apply ink, press paper. The print reveals vein patterns invisible to casual observation. Flip to negative space. Print in layers.',
    teaches: 'Relief printing, negative space, natural pattern documentation, botanical art',
    connections: [4, 35, 43] },

  { id: 40, name: 'The Light Table', muse: 'dragonfly', type: 'exploration', domain: 'art',
    difficulty: 'seedling',
    description: 'A translucency explorer with leaves, feathers, shells, and wings. Place specimens on the light table. Backlight reveals hidden structures — feather barbules, leaf cell walls, shell growth layers. Dragonfly wings are mostly air between veins.',
    teaches: 'Translucency, light transmission, structural anatomy, observational science',
    connections: [2, 4, 35] },

  { id: 41, name: 'The Photography Walk', muse: 'eagle', type: 'exploration', domain: 'art',
    difficulty: 'sapling',
    description: 'Composition principles demonstrated through forest scenes. Rule of thirds, leading lines, golden ratio, frame within frame. Each scene presents the same clearing — reframe it ten different ways. Eagle\'s eye view provides the master composition.',
    teaches: 'Photographic composition, visual design principles, framing, perspective',
    connections: [19, 34, 48] },

  { id: 42, name: 'The Mosaic Pool', muse: 'octopus', type: 'puzzle', domain: 'art',
    difficulty: 'sapling',
    description: 'Arrange pebbles and shells into mosaic patterns in a shallow tide pool. Match colors, shapes, and textures. Create figurative images or abstract geometry. The tide will erase your work in six hours. Octopus rearranges its den stones the same way.',
    teaches: 'Mosaic art, color matching, impermanence, geometric composition',
    connections: [29, 38, 73] },

  { id: 43, name: 'The Charcoal Sketch', muse: 'fire', type: 'tool', domain: 'art',
    difficulty: 'seedling',
    description: 'Draw with virtual charcoal on bark-texture canvas. Pressure sensitivity controls line weight. Smudge with your finger. Erase to reveal the bark beneath. Fire makes charcoal from wood — the drawing tool and the canvas come from the same tree.',
    teaches: 'Charcoal drawing technique, value, tone, gesture drawing',
    connections: [35, 39, 48] },

  { id: 44, name: 'The Origami Forest', muse: 'wren', type: 'puzzle', domain: 'art',
    difficulty: 'old-growth',
    description: 'Fold paper animals matching the 48 muses. Start with simple forms — crane (Hawk), fish (Chinook), frog (Salamander). Advance to complex multi-sheet sculptures — Bear, Orca, Eagle. Each fold is a geometric transformation. The paper remembers every crease.',
    teaches: 'Paper folding geometry, spatial reasoning, sequential instruction following',
    connections: [19, 28, 47] },

  { id: 45, name: 'The Batik Studio', muse: 'octopus', type: 'tool', domain: 'art',
    difficulty: 'sapling',
    description: 'Wax-resist dyeing with natural PNW plant dyes. Apply wax patterns, dip in Oregon grape yellow, remove wax, reapply, dip in huckleberry purple. Each layer masks the previous color. Octopus changes color by masking pigment cells — same principle, different medium.',
    teaches: 'Resist-dyeing technique, layered color processes, natural pigment chemistry',
    connections: [33, 37, 110] },

  { id: 46, name: 'The Calligraphy Stone', muse: 'glacier', type: 'meditation', domain: 'art',
    difficulty: 'seedling',
    description: 'Practice letterforms inspired by river-carved rock. Water writes on stone over millennia — smooth curves, no sharp angles, every line follows the path of least resistance. Trace the water\'s calligraphy. Then write your own, following the stone\'s grammar.',
    teaches: 'Calligraphy, fluid dynamics in erosion, natural line quality, patience',
    connections: [35, 43, 77] },

  { id: 47, name: 'The Sculpture Garden', muse: 'bear', type: 'tool', domain: 'art',
    difficulty: 'old-growth',
    description: 'Arrange 3D shapes in a virtual forest clearing. Drag, rotate, scale — stone, wood, metal, glass. Compose by negative space. Light from the canopy changes through the day. Bear stacks rocks at salmon streams without calling it sculpture.',
    teaches: '3D composition, spatial relationships, light interaction, found-object art',
    connections: [34, 42, 72] },

  { id: 48, name: 'The Palette Knife', muse: 'madrone', type: 'tool', domain: 'art',
    difficulty: 'sapling',
    description: 'Landscape painting with PNW seasonal color palettes. Spring: lupine purple, new-leaf chartreuse. Summer: dry grass gold, sky blue. Autumn: vine maple red, larch gold. Winter: moss green, fog gray. Load a palette and paint with a knife — thick impasto strokes.',
    teaches: 'Seasonal color observation, palette knife technique, landscape painting, impasto',
    connections: [33, 41, 43] },


  // ═══ GROVE 4: THE CONCERT HALL (seeds 49-64) — Music & Sound ═══

  { id: 49, name: 'The Drum Circle', muse: 'alder', type: 'game', domain: 'music',
    difficulty: 'sapling',
    description: 'A polyrhythm builder using different wood-strike sounds — hollow log, green branch, dry snag, river stone on cedar. Layer three and four beat patterns. When they align, the downbeat hits like thunder. West African djembe meets PNW roundwood.',
    teaches: 'Polyrhythm, time signatures, rhythmic layering, percussive acoustics',
    connections: [53, 59, 63] },

  { id: 50, name: 'The Tuning Fork', muse: 'thrush', type: 'visualization', domain: 'music',
    difficulty: 'sapling',
    description: 'Explore equal temperament versus just intonation. Strike two tuning forks and watch the waveforms. In just intonation, the ratios are clean — 3:2, 4:3, 5:4. In equal temperament, every interval is slightly detuned. Thrush sings in just intonation. Pianos don\'t.',
    teaches: 'Musical temperament, frequency ratios, consonance vs dissonance, tuning systems',
    connections: [51, 54, 61] },

  { id: 51, name: 'The Overtone Series', muse: 'alder', type: 'visualization', domain: 'music',
    difficulty: 'sapling',
    description: 'Visualize harmonic overtones on a vibrating string. Pluck the fundamental — then touch the string at 1/2, 1/3, 1/4 to isolate each harmonic. The overtone series is the DNA of timbre. A flute and a clarinet play the same note but sound different because their overtone recipes differ.',
    teaches: 'Harmonic series, overtones, timbre, standing waves on strings',
    connections: [1, 13, 50] },

  { id: 52, name: 'The Pitch Pipe', muse: 'wren', type: 'game', domain: 'music',
    difficulty: 'sapling',
    description: 'Match frequencies to bird calls across PNW species. Wren sings at 4,000 Hz. Owl hoots at 300 Hz. Varied thrush at 3,500 Hz. Adjust the pitch pipe to match each call. The forest is an orchestra tuned to survival, not concert A.',
    teaches: 'Frequency and pitch relationship, bird vocalizations, acoustic ecology',
    connections: [12, 57, 62] },

  { id: 53, name: 'The Rhythm Machine', muse: 'bat', type: 'visualization', domain: 'music',
    difficulty: 'seedling',
    description: 'Build drum patterns from animal heartbeat rates. Hummingbird at 1,200 BPM. Blue whale at 6 BPM. Human at 72 BPM. Layer them as subdivisions of a master tempo. Every animal carries its own metronome. Bat echolocates at 120 clicks per second.',
    teaches: 'Tempo, BPM, pulse, biological rhythms as musical patterns',
    connections: [49, 59, 122] },

  { id: 54, name: 'The Scale Builder', muse: 'thrush', type: 'tool', domain: 'music',
    difficulty: 'sapling',
    description: 'Construct musical scales from frequency ratios. Start with a root note. Add intervals by ratio — 9:8 for a whole step, 16:15 for a half step. Build major, minor, pentatonic, and chromatic scales. Then build one that doesn\'t exist yet. Every scale is a recipe.',
    teaches: 'Scale construction, interval ratios, modes, music theory fundamentals',
    connections: [50, 55, 61] },

  { id: 55, name: 'The Chord Wheel', muse: 'alder', type: 'visualization', domain: 'music',
    difficulty: 'sapling',
    description: 'Explore chord progressions through color harmony. Major chords are warm colors, minor chords are cool. The circle of fifths becomes a color wheel. A I-IV-V progression is analogous to a primary color triad. Play the wheel and hear the harmony shift.',
    teaches: 'Chord progressions, circle of fifths, harmonic function, music-color synesthesia',
    connections: [33, 54, 64] },

  { id: 56, name: 'The Song Map', muse: 'loon', type: 'story', domain: 'music',
    difficulty: 'old-growth',
    description: 'Trace how folk songs traveled along PNW trade routes. A Nez Perce melody crosses the Cascades. A sea shanty arrives at Astoria. A Haida paddle song moves down the coast. Each song carries its own geography. Loon\'s call travels fifteen miles across water.',
    teaches: 'Ethnomusicology, cultural diffusion, trade routes, oral tradition geography',
    connections: [100, 101, 102] },

  { id: 57, name: 'The Sound Walk', muse: 'loon', type: 'meditation', domain: 'music',
    difficulty: 'seedling',
    description: 'A guided listening meditation through forest acoustic environments. Close your eyes. First layer: wind in canopy. Second: creek over stones. Third: birdsong. Fourth: insects. Fifth: your own heartbeat. Loon calls across the lake. The forest is never silent.',
    teaches: 'Deep listening, acoustic ecology, soundscape awareness, mindfulness',
    connections: [52, 60, 80] },

  { id: 58, name: 'The Instrument Builder', muse: 'beaver', type: 'tool', domain: 'music',
    difficulty: 'old-growth',
    description: 'Design instruments from natural materials. Alder branch flute — bore diameter determines pitch. Cedar box drum — wall thickness determines resonance. Spruce root rattle — seed count determines timbre. Beaver\'s teeth are chisels that carve the resonating chamber.',
    teaches: 'Acoustics of instrument design, resonance, material properties, lutherie basics',
    connections: [49, 51, 91] },

  { id: 59, name: 'The Beat Counter', muse: 'wren', type: 'game', domain: 'music',
    difficulty: 'seedling',
    description: 'Tap along with woodpecker rhythms at different tempos. Pileated woodpecker: slow, deliberate, 15 strikes per burst. Downy woodpecker: fast, light, 25 per second. Red-breasted sapsucker: irregular, jazzy. Score points for staying in sync.',
    teaches: 'Rhythm perception, tempo tracking, syncopation, motor-auditory coordination',
    connections: [49, 53, 63] },

  { id: 60, name: 'The Echo Chamber', muse: 'bat', type: 'simulation', domain: 'music',
    difficulty: 'sapling',
    description: 'Simulate sound reflection in different forest environments. Old growth: long reverb, deep bass absorption. Clear-cut: harsh echo, no diffusion. Canyon: distinct repeats. Cave: infinite sustain. Bat maps its world entirely by echo. The room shapes the sound.',
    teaches: 'Acoustics, reverberation, echo, sound absorption, echolocation principles',
    connections: [13, 57, 62] },

  { id: 61, name: 'The Frequency Stairs', muse: 'thrush', type: 'visualization', domain: 'music',
    difficulty: 'seedling',
    description: 'Climb an octave one step at a time. Each stair doubles a fraction of the frequency. Twelve equal steps in equal temperament. Fewer in pentatonic. Click each step to hear the interval. At the top, the frequency has doubled. The octave is the only universal interval.',
    teaches: 'Octave relationships, equal temperament, frequency doubling, intervals',
    connections: [50, 54, 64] },

  { id: 62, name: 'The Noise Floor', muse: 'marten', type: 'visualization', domain: 'music',
    difficulty: 'sapling',
    description: 'Explore signal-to-noise ratio using forest sounds. Isolate a single bird call from the ambient soundscape. Adjust the noise floor. Below it, signals disappear. Above it, they emerge. Marten\'s signal relay only works when the message clears the noise floor.',
    teaches: 'Signal-to-noise ratio, audio filtering, spectral analysis, information theory',
    connections: [12, 52, 115] },

  { id: 63, name: 'The Loop Station', muse: 'wren', type: 'game', domain: 'music',
    difficulty: 'sapling',
    description: 'Layer four animal sounds into a composition. Record a loop of wren song. Add owl hoot on beat 2 and 4. Layer creek ambience underneath. Drop in a single eagle cry on the downbeat of bar 8. Solo, mute, adjust volume. One-person forest orchestra.',
    teaches: 'Looping, layered composition, mixing, arrangement, musical structure',
    connections: [49, 57, 59] },

  { id: 64, name: 'The Vinyl Groove', muse: 'raven', type: 'visualization', domain: 'music',
    difficulty: 'sapling',
    description: 'Trace a spiral to play a visual record. The groove widens for loud passages, narrows for quiet ones. Stereo channels are cut at different angles. Zoom in to see the actual waveform carved into the surface. Raven collects shiny things — this one plays music.',
    teaches: 'Analog audio recording, groove modulation, stereo encoding, vinyl mechanics',
    connections: [51, 55, 61] },


  // ═══ GROVE 5: THE PHILOSOPHY GARDEN (seeds 65-80) — Philosophy & Mind ═══

  { id: 65, name: 'The Trolley Problem Trail', muse: 'coyote', type: 'game', domain: 'philosophy',
    difficulty: 'sapling',
    description: 'Ecological ethics dilemmas. Save the spotted owl habitat or the logging jobs? Dam the river for clean energy or keep it wild for salmon? Coyote presents five dilemmas with no right answers. Your choices reveal your ethical framework — utilitarian, deontological, or virtue.',
    teaches: 'Ethical frameworks, trolley problem variants, environmental ethics, moral reasoning',
    connections: [74, 97, 109] },

  { id: 66, name: 'The Ship of Theseus Nurse Log', muse: 'cedar', type: 'story', domain: 'philosophy',
    difficulty: 'seedling',
    description: 'Is the nurse log still Cedar after every original cell has been replaced by new growth? Hemlock, spruce, and huckleberry consume the log over centuries. At what point does it stop being the original tree and become something new? The identity paradox, told in wood.',
    teaches: 'Ship of Theseus, personal identity, persistence through change',
    connections: [10, 73, 120] },

  { id: 67, name: 'The Allegory of the Cave', muse: 'chinook', type: 'story', domain: 'philosophy',
    difficulty: 'sapling',
    description: 'Salmon returning from ocean to river as Plato\'s cave allegory. Born in the stream, they know only freshwater. The ocean is the larger reality. Return to the birthplace with new knowledge. The fish who\'ve seen the ocean can never unknow it. The ones who stayed see only shadows.',
    teaches: 'Plato\'s cave allegory, epistemology, the nature of knowledge, perspective shifts',
    connections: [68, 75, 79] },

  { id: 68, name: 'The Paradox Garden', muse: 'coyote', type: 'puzzle', domain: 'philosophy',
    difficulty: 'sapling',
    description: 'Five classic paradoxes illustrated with PNW ecology. The liar paradox: coyote says "everything I say is a trick." The sorites paradox: how many trees make a forest? The grandfather paradox: salmon returning to their birth stream. Examine each one. None have clean solutions.',
    teaches: 'Classical paradoxes, logical contradiction, limits of formal reasoning',
    connections: [32, 66, 79] },

  { id: 69, name: 'The Thought Experiment Lab', muse: 'lex', type: 'exploration', domain: 'philosophy',
    difficulty: 'old-growth',
    description: 'Interactive philosophical thought experiments grounded in PNW ecology. Mary\'s room: a salmon biologist who\'s never seen a live salmon. The experience machine: a VR forest vs the real one. The veil of ignorance: designing forest management without knowing if you\'re an owl, a logger, or a mushroom.',
    teaches: 'Philosophical thought experiments, qualia, distributive justice, epistemology',
    connections: [65, 67, 80] },

  { id: 70, name: 'The Ethics Compass', muse: 'eagle', type: 'tool', domain: 'philosophy',
    difficulty: 'sapling',
    description: 'Navigate moral dilemmas using the complex plane. Real axis: individual vs collective good. Imaginary axis: short-term vs long-term consequence. Plot your decision. Eagle circles high enough to see all four quadrants at once.',
    teaches: 'Ethical reasoning, multi-axis decision making, moral philosophy frameworks',
    connections: [65, 78, 97] },

  { id: 71, name: 'The Meditation Pool', muse: 'kelp', type: 'meditation', domain: 'philosophy',
    difficulty: 'seedling',
    description: 'Guided breathing synced to tidal rhythms. Inhale as the tide rises. Hold at slack water. Exhale as it falls. Kelp sways with the current, never fighting it. Four minutes. No instructions beyond the rhythm. The pool breathes with you.',
    teaches: 'Mindful breathing, tidal rhythms, present-moment awareness, embodied calm',
    connections: [57, 77, 80] },

  { id: 72, name: 'The Gratitude Trail', muse: 'willow', type: 'meditation', domain: 'philosophy',
    difficulty: 'seedling',
    description: 'Walk a short trail and leave virtual stones of thanks at five stations. Each station asks one question: What taught you something? What surprised you? What comforted you? What challenged you? What are you carrying forward? Willow bends under snow and springs back.',
    teaches: 'Gratitude practice, reflective thinking, mindful walking, resilience',
    connections: [77, 80, 112] },

  { id: 73, name: 'The Impermanence Garden', muse: 'kelp', type: 'meditation', domain: 'philosophy',
    difficulty: 'seedling',
    description: 'Watch sand mandalas dissolve. Build a pattern grain by grain in a tide pool. The tide comes in. Everything you made is gone. Start again. Kelp forests grow, storm destroys, grow again. The practice is the product. The doing is the done.',
    teaches: 'Impermanence, non-attachment, process vs product, Buddhist sand mandala tradition',
    connections: [9, 32, 42] },

  { id: 74, name: 'The Empathy Bridge', muse: 'orca', type: 'story', domain: 'philosophy',
    difficulty: 'sapling',
    description: 'See the forest from different species\' perspectives. A day as a Douglas squirrel: everything is food storage and territory. A day as a nurse log: everything is slow decomposition and new growth. A day as Orca: everything is family, language, and the hunt. Same forest, five different worlds.',
    teaches: 'Perspective-taking, Umwelt theory, empathy, species-specific experience',
    connections: [26, 65, 108] },

  { id: 75, name: 'The Memory Palace', muse: 'nutcracker', type: 'tool', domain: 'philosophy',
    difficulty: 'old-growth',
    description: 'Build a spatial memory system in the forest. Place facts at landmarks — the species count at the big cedar, the watershed name at the bridge, the geological age at the rock outcrop. Walk the trail in your mind to recall them. Nutcracker remembers 30,000 seed locations this way.',
    teaches: 'Method of loci, spatial memory, mnemonic techniques, cognitive architecture',
    connections: [27, 67, 105] },

  { id: 76, name: 'The Dream Journal', muse: 'cedar', type: 'story', domain: 'philosophy',
    difficulty: 'seedling',
    description: 'Cedar\'s journal as dream interpretation template. Write a dream. The journal maps its symbols to the forest — water is emotion, trees are growth, animals are instinct, weather is mood. Not Freud. Not Jung. The forest\'s own symbolic language, older than psychology.',
    teaches: 'Symbolic thinking, dream journaling, personal mythology, reflective writing',
    connections: [66, 77, 98] },

  { id: 77, name: 'The Zen Garden', muse: 'fog', type: 'meditation', domain: 'philosophy',
    difficulty: 'seedling',
    description: 'Rake virtual sand patterns in a forest clearing. Drag the rake to create concentric circles around stones. The patterns have no purpose beyond the making. Fog doesn\'t try to be fog. The garden doesn\'t try to be a garden. Rake until the mind empties.',
    teaches: 'Zen aesthetics, process meditation, wabi-sabi, purposeful purposelessness',
    connections: [46, 71, 73] },

  { id: 78, name: 'The Stoic Walk', muse: 'pika', type: 'story', domain: 'philosophy',
    difficulty: 'sapling',
    description: 'Marcus Aurelius meets the PNW trail. Five Stoic principles illustrated by alpine ecology. Pika doesn\'t complain about winter — it gathers hay all summer. The mountain doesn\'t resist the storm. The river doesn\'t wish it were somewhere else. Walk the trail. Read the meditations.',
    teaches: 'Stoic philosophy, Marcus Aurelius, resilience, acceptance, alpine adaptation',
    connections: [72, 117, 125] },

  { id: 79, name: 'The Question Tree', muse: 'sam', type: 'tool', domain: 'philosophy',
    difficulty: 'old-growth',
    description: 'A Socratic questioning engine. Start with any statement. The tree asks "Why?" and branches with each answer. Five levels deep, every certainty dissolves into assumptions. Sam\'s nature is the question — and the best questions are the ones that don\'t end.',
    teaches: 'Socratic method, critical thinking, assumption identification, epistemic humility',
    connections: [67, 68, 69] },

  { id: 80, name: 'The Silence', muse: 'owl', type: 'meditation', domain: 'philosophy',
    difficulty: 'seedling',
    description: 'A page that is completely empty. Just darkness and one instruction: listen. Nothing moves. Nothing loads. The screen stays dark for as long as you stay. Owl hunts in silence. The most important thing in the forest is the thing you almost didn\'t hear.',
    teaches: 'Deep listening, silence as practice, attention, presence',
    connections: [57, 71, 128] },


  // ═══ GROVE 6: THE WORKSHOP (seeds 81-96) — Engineering & Craft ═══

  { id: 81, name: 'The Bridge Builder', muse: 'beaver', type: 'simulation', domain: 'infrastructure',
    difficulty: 'old-growth',
    description: 'Engineer a bridge across a canyon using PNW timber. Choose species (Doug fir for strength, cedar for rot resistance), calculate load, design truss geometry. Test it with a simulated elk herd crossing. Beaver builds bridges every day — the engineering is instinct.',
    teaches: 'Structural engineering, load calculation, truss design, material properties of wood',
    connections: [1, 88, 90] },

  { id: 82, name: 'The Water Filter', muse: 'salamander', type: 'simulation', domain: 'infrastructure',
    difficulty: 'sapling',
    description: 'Build a filtration system from gravel, sand, charcoal, and moss. Pour turbid creek water through your layers. Measure clarity, pH, and bacterial count at each stage. The forest floor is already a water filter — every raindrop is cleaned before it reaches the aquifer.',
    teaches: 'Water filtration principles, particle size, activated charcoal, watershed function',
    connections: [4, 86, 126] },

  { id: 83, name: 'The Solar Tracker', muse: 'sunflower', type: 'simulation', domain: 'infrastructure',
    difficulty: 'sapling',
    description: 'Orient a solar panel following the PNW sun path. At 47°N latitude, the sun angle changes from 19° in December to 66° in June. Track azimuth and elevation through the year. Calculate total insolation. The PNW gets 60% of its solar energy in four summer months.',
    teaches: 'Solar geometry, panel orientation, insolation calculation, seasonal energy variation',
    connections: [36, 84, 123] },

  { id: 84, name: 'The Wind Turbine', muse: 'eagle', type: 'simulation', domain: 'infrastructure',
    difficulty: 'sapling',
    description: 'Design blade geometry for PNW coastal winds. Adjust pitch, chord, and twist. Test in simulated wind from 5 to 25 m/s. The Betz limit says you can capture at most 59.3% of the wind\'s energy. Eagle soars on the same pressure differentials that spin the turbine.',
    teaches: 'Wind energy, Betz limit, blade aerodynamics, power coefficient',
    connections: [14, 83, 123] },

  { id: 85, name: 'The Greenhouse', muse: 'fern', type: 'simulation', domain: 'infrastructure',
    difficulty: 'sapling',
    description: 'Balance temperature, humidity, and light for PNW growing season. Open vents when it\'s too hot, close them when it\'s cold. The maritime climate means mild winters but short photoperiods. Fern grows in the understory — it already knows how to thrive in low light.',
    teaches: 'Greenhouse management, thermal regulation, photoperiod, PNW horticulture',
    connections: [5, 87, 103] },

  { id: 86, name: 'The Rain Collector', muse: 'rain', type: 'simulation', domain: 'infrastructure',
    difficulty: 'sapling',
    description: 'Design a rainwater harvesting system for 80 inches per year. Size the catchment, calculate storage, design overflow and first-flush diverters. The PNW west side gets more rain than most places know what to do with. Rain is infrastructure, not inconvenience.',
    teaches: 'Rainwater harvesting, hydraulic calculations, water storage design, conservation',
    connections: [15, 82, 95] },

  { id: 87, name: 'The Composting Engine', muse: 'chanterelle', type: 'simulation', domain: 'ecology',
    difficulty: 'sapling',
    description: 'Layer browns and greens, adjust moisture, and watch decomposition in time-lapse. Thermophilic bacteria hit 160°F in the core. Fungi arrive next. Then beetles. The pile shrinks by half. Chanterelle\'s network is the composting engine of the forest floor.',
    teaches: 'Composting science, decomposition stages, C:N ratio, thermophilic processes',
    connections: [4, 17, 116] },

  { id: 88, name: 'The Trail Builder', muse: 'elk', type: 'simulation', domain: 'infrastructure',
    difficulty: 'old-growth',
    description: 'Design a sustainable hiking trail across different terrain. Manage grade (never above 10%), plan switchbacks on steep slopes, install water bars for drainage, choose tread material. The trail was there before you — elk wore it in. You\'re just formalizing what was already true.',
    teaches: 'Trail engineering, erosion control, sustainable access, terrain navigation',
    connections: [22, 81, 94] },

  { id: 89, name: 'The Fish Ladder', muse: 'chinook', type: 'simulation', domain: 'infrastructure',
    difficulty: 'old-growth',
    description: 'Engineer a salmon passage around a dam. Design pool-and-weir steps, calculate flow velocity, ensure resting pools at intervals. Too fast and the fish can\'t climb. Too slow and they won\'t try. Chinook jumps waterfalls — but concrete walls need engineered alternatives.',
    teaches: 'Fish passage engineering, hydraulic design, species-specific flow requirements',
    connections: [11, 24, 90] },

  { id: 90, name: 'The Beaver Dam Simulator', muse: 'beaver', type: 'simulation', domain: 'ecology',
    difficulty: 'old-growth',
    description: 'Full watershed engineering. Place dams across a stream network. Watch water table rise, wetlands expand, sediment trap. Remove a dam and watch the cascade. Beaver is the only species besides humans that engineers its own habitat at the watershed scale.',
    teaches: 'Watershed hydrology, beaver dam ecology, water table dynamics, ecosystem engineering',
    connections: [23, 81, 126] },

  { id: 91, name: 'The Shelter Builder', muse: 'bear', type: 'game', domain: 'infrastructure',
    difficulty: 'sapling',
    description: 'Construct emergency shelter from PNW forest materials. Lean-to from fallen branches, debris hut from sword fern, A-frame from deadfall. Rate insulation, waterproofing, and wind resistance. Bear digs a den and sleeps for five months. Different approach, same problem.',
    teaches: 'Wilderness shelter construction, insulation principles, survival skills, material selection',
    connections: [58, 81, 93] },

  { id: 92, name: 'The Knot Board', muse: 'otter', type: 'game', domain: 'infrastructure',
    difficulty: 'sapling',
    description: 'Learn ten essential knots for PNW outdoor skills. Bowline, clove hitch, taut-line, trucker\'s hitch, figure-eight. Drag the rope ends through the sequence. Each knot has a job — some hold, some slip, some jam. Otter knows knots from wrapping kelp around sea urchins.',
    teaches: 'Knot tying, mechanical advantage, friction, practical rope skills',
    connections: [81, 88, 91] },

  { id: 93, name: 'The Fire Starter', muse: 'fire', type: 'simulation', domain: 'science',
    difficulty: 'sapling',
    description: 'Friction fire technique physics simulation. Bow drill: adjust spindle speed, downward pressure, and tinder dryness. Hand drill: the harder method. Fire plow: the oldest. Watch the temperature gauge climb to 800°F ignition point. Fire is a chemical reaction that changed everything.',
    teaches: 'Friction, heat generation, combustion chemistry, traditional fire-making',
    connections: [5, 43, 91] },

  { id: 94, name: 'The Map Maker', muse: 'foxy', type: 'tool', domain: 'infrastructure',
    difficulty: 'old-growth',
    description: 'Topographic map creation from elevation data. Draw contour lines at 40-foot intervals across a virtual PNW landscape. Ridgelines, valleys, saddles, and peaks emerge from the contours alone. Foxy is the map — cartography is seeing the terrain as it actually is.',
    teaches: 'Topographic mapping, contour intervals, terrain interpretation, cartographic skill',
    connections: [27, 34, 88] },

  { id: 95, name: 'The Weather Station', muse: 'rain', type: 'tool', domain: 'science',
    difficulty: 'sapling',
    description: 'Build a virtual weather monitoring station. Anemometer, rain gauge, thermometer, hygrometer, barometer. Place it in the forest and collect data for a simulated year. Graph the patterns. Rain in the PNW follows rhythms you can only see with data.',
    teaches: 'Meteorological instruments, data collection, pattern recognition, climate vs weather',
    connections: [6, 25, 86] },

  { id: 96, name: 'The Circuit Board', muse: 'marten', type: 'simulation', domain: 'infrastructure',
    difficulty: 'old-growth',
    description: 'Electronic circuit simulator using forest-metaphor components. Resistors are fallen logs (impedance). Capacitors are beaver ponds (stored charge). Inductors are coiled roots (magnetic field). Wire up an LED flashlight. Then build an AM radio. Marten\'s signal relay is a circuit in fur.',
    teaches: 'Basic electronics, circuit theory, Ohm\'s law, component function',
    connections: [8, 20, 30] },


  // ═══ GROVE 7: THE COMMONS (seeds 97-112) — Culture & Community ═══

  { id: 97, name: 'The Potlatch Circle', muse: 'madrone', type: 'simulation', domain: 'culture',
    difficulty: 'old-growth',
    description: 'A gift economy simulation. You have resources. Give them away strategically — the more you give, the more status you earn. But hoard and you lose standing. The potlatch system balanced wealth across communities for millennia. Madrone sheds bark and keeps growing.',
    teaches: 'Gift economy, potlatch tradition, reciprocity, wealth distribution systems',
    connections: [65, 70, 102] },

  { id: 98, name: 'The Story Circle', muse: 'willow', type: 'game', domain: 'culture',
    difficulty: 'sapling',
    description: 'A collaborative story builder where each visitor adds a sentence. The story accumulates over time, branching and weaving. Some threads die. Some become epics. Willow\'s branches all come from the same trunk. The story is the trunk.',
    teaches: 'Collaborative narrative, emergent storytelling, community creation, oral tradition',
    connections: [76, 56, 127] },

  { id: 99, name: 'The Totem Reader', muse: 'eagle', type: 'exploration', domain: 'culture',
    difficulty: 'sapling',
    description: 'Explore PNW totem pole symbolism and heraldic meaning. Each figure tells a story — Raven at the top brought light to the world, Bear in the middle holds the family crest, Frog at the base connects to the underworld. Read from bottom to top. Every pole is a library.',
    teaches: 'Totem pole symbolism, PNW Indigenous heraldry, visual storytelling, cultural literacy',
    connections: [37, 104, 110] },

  { id: 100, name: 'The Canoe Journey', muse: 'chinook', type: 'exploration', domain: 'culture',
    difficulty: 'old-growth',
    description: 'Paddle a virtual canoe through the Salish Sea, visiting nations along the route. Each landing teaches protocol, language, trade goods. The annual canoe journeys connect communities across 10,000 years of maritime culture. Chinook is the current that carries you.',
    teaches: 'Salish Sea geography, intertribal protocol, maritime culture, PNW Indigenous nations',
    connections: [16, 22, 56] },

  { id: 101, name: 'The Language Map', muse: 'lex', type: 'exploration', domain: 'culture',
    difficulty: 'sapling',
    description: 'PNW Indigenous language families and their territories. Salishan, Sahaptin, Athabaskan, Chinookan, Wakashan. Click a region to hear a greeting. Some languages have fewer than ten fluent speakers. Every extinct language is a library burned.',
    teaches: 'Language families, linguistic diversity, language endangerment, PNW Indigenous languages',
    connections: [31, 105, 112] },

  { id: 102, name: 'The Trade Network', muse: 'eulachon', type: 'game', domain: 'culture',
    difficulty: 'old-growth',
    description: 'The eulachon grease trail trading game. Rendered oil from the tiny fish was the most valuable trade commodity in the precontact PNW. Trade grease for obsidian, shells for dried salmon, copper for cedar bark. The network spanned from the coast to the plateau.',
    teaches: 'Precontact PNW trade networks, commodity exchange, eulachon fishery, economics',
    connections: [56, 97, 106] },

  { id: 103, name: 'The Seasonal Calendar', muse: 'owl', type: 'visualization', domain: 'ecology',
    difficulty: 'sapling',
    description: 'A thirteen-month ecological calendar based on PNW phenology. January: eagle moon. February: frog moon. Each month tied to what\'s happening in the landscape — what blooms, what migrates, what spawns. Owl keeps time by season, not by clock.',
    teaches: 'Phenology, ecological calendars, seasonal awareness, PNW natural cycles',
    connections: [36, 106, 111] },

  { id: 104, name: 'The Star Map', muse: 'raven', type: 'exploration', domain: 'culture',
    difficulty: 'sapling',
    description: 'Coast Salish and Sahaptin constellation stories mapped onto the PNW night sky. The same stars, different stories. Orion\'s belt becomes three hunters chasing an elk. The Pleiades become the Hole in the Sky. Raven stole the sun — the stars are what was left.',
    teaches: 'Ethnoastronomy, constellation narratives, cultural astronomy, star identification',
    connections: [3, 56, 99] },

  { id: 105, name: 'The Place Names', muse: 'foxy', type: 'exploration', domain: 'culture',
    difficulty: 'sapling',
    description: 'Lushootseed place names for Seattle-area landmarks. Duwamish: the people of the inside. Tacoma: the mountain. Puyallup: generous people. Every colonial name replaced an older one that described what the place actually was. The land remembers both.',
    teaches: 'Indigenous place names, Lushootseed language, colonial renaming, geographic identity',
    connections: [27, 75, 101] },

  { id: 106, name: 'The Recipe Book', muse: 'bear', type: 'exploration', domain: 'culture',
    difficulty: 'sapling',
    description: 'Traditional PNW foods matched to seasons and species. Spring: fiddleheads, nettle, eulachon. Summer: salmonberries, camas, sockeye. Fall: acorns, venison, chanterelle. Winter: dried salmon, root vegetables, herbal teas. Bear knows every seasonal food by instinct.',
    teaches: 'Seasonal eating, traditional PNW foodways, ethnobotany, food preservation',
    connections: [85, 102, 111] },

  { id: 107, name: 'The Medicine Wheel', muse: 'hemlock', type: 'visualization', domain: 'culture',
    difficulty: 'sapling',
    description: 'A four-directions teaching framework. East: spring, beginnings, vision. South: summer, growth, trust. West: autumn, harvest, reflection. North: winter, wisdom, rest. Not a single tradition but a shared pattern across many PNW nations. Hemlock stands at true north.',
    teaches: 'Four directions framework, cyclical thinking, seasonal wisdom, directional symbolism',
    connections: [36, 70, 103] },

  { id: 108, name: 'The Clan System', muse: 'orca', type: 'exploration', domain: 'culture',
    difficulty: 'old-growth',
    description: 'Explore PNW kinship structures and their ecological logic. Orca pods are matrilineal — grandmothers lead. Raven and Eagle moieties divide communities for marriage balance. The kinship system mirrors the ecosystem: diversity through structured relationship.',
    teaches: 'Kinship systems, moiety structure, matrilineal organization, social ecology',
    connections: [26, 74, 114] },

  { id: 109, name: 'The Treaty Map', muse: 'sturgeon', type: 'exploration', domain: 'culture',
    difficulty: 'old-growth',
    description: 'Historical and current tribal treaty boundaries overlaid on the PNW landscape. The Medicine Creek Treaty, the Point Elliott Treaty, the Stevens Treaties. What was promised, what was taken, what remains. Sturgeon has swum these waters for 200 million years — longer than any treaty.',
    teaches: 'Treaty history, tribal sovereignty, PNW Indigenous rights, territorial boundaries',
    connections: [65, 100, 126] },

  { id: 110, name: 'The Regalia Gallery', muse: 'hawk', type: 'exploration', domain: 'culture',
    difficulty: 'sapling',
    description: 'PNW ceremonial art traditions documented respectfully. Button blankets, cedar bark regalia, woven hats, carved masks. Each piece carries lineage, right, and story. Hawk feathers are earned, not taken. The gallery shows what can be shared and explains what cannot.',
    teaches: 'PNW Indigenous art traditions, cultural protocol, material culture, respect boundaries',
    connections: [37, 45, 99] },

  { id: 111, name: 'The First Foods', muse: 'crab', type: 'visualization', domain: 'culture',
    difficulty: 'sapling',
    description: 'A seasonal harvest calendar linking species to cultural practice. First salmon ceremony in spring. Berry gathering in summer. Root digging in fall. Each food has a ceremony because gratitude precedes consumption. Crab arrives with the tide — you gather what is given.',
    teaches: 'First Foods ceremonies, seasonal harvest, gratitude protocols, food sovereignty',
    connections: [103, 106, 112] },

  { id: 112, name: 'The Welcome Protocol', muse: 'willow', type: 'story', domain: 'culture',
    difficulty: 'seedling',
    description: 'How different PNW nations formally welcome visitors. Songs, speeches, gift exchange, protocol order. The welcome establishes relationship before anything else happens. Willow\'s nature is welcome — arms open, shade offered, water shared.',
    teaches: 'Welcome protocols, PNW Indigenous diplomacy, host-guest relationships, ceremony',
    connections: [72, 97, 101] },


  // ═══ GROVE 8: THE FRONTIER (seeds 113-128) — Future & Exploration ═══

  { id: 113, name: 'The Climate Model', muse: 'glacier', type: 'simulation', domain: 'science',
    difficulty: 'old-growth',
    description: 'Interactive climate projection for PNW 2050/2075/2100. Adjust CO2 emissions scenarios. Watch snowpack decrease, fire seasons lengthen, species ranges shift upslope. Glacier has been retreating for decades — the model shows what it already knows.',
    teaches: 'Climate modeling, emissions scenarios, regional climate impacts, adaptation planning',
    connections: [5, 25, 124] },

  { id: 114, name: 'The Rewilding Simulator', muse: 'wolf', type: 'simulation', domain: 'ecology',
    difficulty: 'old-growth',
    description: 'Reintroduce species and watch trophic cascade effects. Bring wolves back to the Cascades. Elk behavior changes. Riparian zones recover. Songbird populations increase. Remove the wolf and watch the cascade reverse. The ecosystem remembers what\'s missing.',
    teaches: 'Trophic cascades, rewilding ecology, keystone predator effects, ecosystem recovery',
    connections: [24, 108, 122] },

  { id: 115, name: 'The Mesh Network', muse: 'marten', type: 'simulation', domain: 'infrastructure',
    difficulty: 'old-growth',
    description: 'Build a communication network across PNW terrain. Place relay nodes on ridgelines. Route messages through the mesh. Handle node failures with redundant paths. Marten\'s signal relay is the biological version — the mesh network is its electronic twin.',
    teaches: 'Mesh networking, routing protocols, network resilience, communication infrastructure',
    connections: [20, 22, 62] },

  { id: 116, name: 'The Mycelium Internet', muse: 'chanterelle', type: 'simulation', domain: 'ecology',
    difficulty: 'old-growth',
    description: 'Design a fungal network that carries messages between trees. Nutrient signals, distress calls, resource sharing. The Wood Wide Web is already running — you\'re just mapping it. Chanterelle is one node in a network that spans the entire forest floor.',
    teaches: 'Mycorrhizal networks, inter-plant communication, network theory, forest ecology',
    connections: [4, 21, 87] },

  { id: 117, name: 'The Seed Vault', muse: 'pika', type: 'game', domain: 'ecology',
    difficulty: 'sapling',
    description: 'Curate which species to preserve for the future. You have 50 slots. The entire PNW flora is 3,500+ species. What criteria do you use? Genetic diversity? Keystone function? Cultural significance? Beauty? Pika caches food for winter — same problem, smaller scale.',
    teaches: 'Conservation prioritization, genetic diversity, seed banking, triage ethics',
    connections: [78, 121, 125] },

  { id: 118, name: 'The Terraform Garden', muse: 'fire', type: 'simulation', domain: 'ecology',
    difficulty: 'old-growth',
    description: 'Restore a degraded landscape step by step. Start with bare soil after a landslide. Plant pioneer species. Wait for nurse logs. Introduce mycorrhizal fungi. Decades pass. The forest returns — not the same forest, but a forest. Fire clears for renewal. Build from the clearing.',
    teaches: 'Ecological succession, habitat restoration, pioneer species, patient engineering',
    connections: [87, 90, 126] },

  { id: 119, name: 'The Generation Ship', muse: 'octopus', type: 'simulation', domain: 'science',
    difficulty: 'old-growth',
    description: 'Design a self-sustaining ecosystem for a 200-year journey. Atmosphere recycling, food production, waste decomposition, water cycling. Every PNW forest already solves these problems. Octopus lives in a sealed system — the tide pool is a generation ship anchored to rock.',
    teaches: 'Closed-loop ecosystems, life support design, biogeochemical cycles, systems thinking',
    connections: [15, 85, 87] },

  { id: 120, name: 'The Time Capsule', muse: 'glacier', type: 'story', domain: 'culture',
    difficulty: 'seedling',
    description: 'Choose what to preserve from this moment for future visitors. Ten items only. A sound, a species, a word, a recipe, a song, a tool, a seed, a story, a measurement, a question. Glacier is a time capsule — every layer records a year. What will you leave in the ice?',
    teaches: 'Archival thinking, cultural preservation, selection criteria, legacy planning',
    connections: [10, 66, 127] },

  { id: 121, name: 'The Coral Calculator', muse: 'star', type: 'simulation', domain: 'science',
    difficulty: 'sapling',
    description: 'Predict ocean acidification effects on PNW marine life. Adjust atmospheric CO2 and watch pH drop. At pH 7.8, pteropods dissolve. At 7.6, juvenile oysters fail. Star\'s tide pool shifts from garden to desert. The math is simple. The consequences are not.',
    teaches: 'Ocean acidification, pH chemistry, carbonate chemistry, marine ecosystem sensitivity',
    connections: [15, 113, 117] },

  { id: 122, name: 'The Migration Tracker', muse: 'goose', type: 'visualization', domain: 'ecology',
    difficulty: 'sapling',
    description: 'Follow species range shifts under warming. Alpine species move upslope. Southern species arrive. Timing shifts — birds arrive before insects hatch. Goose follows the same flyway its ancestors did, but the calendar is shifting beneath the wings.',
    teaches: 'Range shifts, phenological mismatch, migration ecology, climate adaptation',
    connections: [16, 53, 114] },

  { id: 123, name: 'The Renewable Grid', muse: 'sam', type: 'simulation', domain: 'infrastructure',
    difficulty: 'old-growth',
    description: 'Design a power grid for PNW using local energy sources. Hydro on the Columbia, wind on the coast, solar east of the Cascades, tidal in Puget Sound, geothermal near the volcanoes. Balance supply and demand across seasons. The grid is the puzzle. Sam asks: is 100% possible?',
    teaches: 'Renewable energy systems, grid balancing, energy storage, regional resource mapping',
    connections: [83, 84, 115] },

  { id: 124, name: 'The Forest in 2100', muse: 'hemlock', type: 'visualization', domain: 'ecology',
    difficulty: 'old-growth',
    description: 'Walk through the forest as it might look in 75 years. Under the optimistic scenario, hemlock still stands. Under the pessimistic, it\'s replaced by oak and madrone. The species composition shifts. The structure changes. The trails are the same but the trees are different.',
    teaches: 'Forest succession under climate change, species migration, adaptation vs loss',
    connections: [3, 113, 118] },

  { id: 125, name: 'The Ark', muse: 'eagle', type: 'game', domain: 'ecology',
    difficulty: 'sapling',
    description: 'Which 100 species would you save? A prioritization exercise. Keystone species? Pollinators? Cultural icons? Genetic uniqueness? You can\'t save everything. Eagle watches from above — the view is clear but the choices are not.',
    teaches: 'Conservation triage, biodiversity prioritization, ethical decision-making under constraint',
    connections: [78, 117, 114] },

  { id: 126, name: 'The Restoration Plan', muse: 'steelhead', type: 'simulation', domain: 'ecology',
    difficulty: 'old-growth',
    description: 'Design a plan to restore one degraded PNW watershed. Remove the dam, replant riparian zones, reintroduce beavers, reconnect floodplains. Monitor for 50 simulated years. Steelhead returns when the river does. Twice-born — ocean and river — needs both to survive.',
    teaches: 'Watershed restoration, dam removal ecology, riparian recovery, long-term monitoring',
    connections: [7, 82, 90] },

  { id: 127, name: 'The Letter to the Future', muse: 'sitka', type: 'story', domain: 'culture',
    difficulty: 'seedling',
    description: 'Write a message to whoever finds this forest in 100 years. What do you want them to know? What do you hope they still have? What do you wish you\'d done differently? Sitka spruce lives 700 years. Your letter is a seed that germinates when you\'re gone.',
    teaches: 'Long-term thinking, legacy writing, intergenerational responsibility, hope',
    connections: [10, 98, 120] },

  { id: 128, name: 'The Campfire', muse: 'foxy', type: 'meditation', domain: 'culture',
    difficulty: 'seedling',
    description: 'The final seed. An empty clearing with a fire, waiting for the next visitor to sit down. No instructions. No widgets. No data. Just the sound of wood burning and the darkness beyond the light. Everything in the forest leads here, and everything leaves from here.',
    teaches: 'Presence, gathering, the irreducible center of community',
    connections: [80, 97, 112] }

];
