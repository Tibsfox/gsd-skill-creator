/* ═══════════════════════════════════════════════════════════════
   Seed Growth Data — 128 seeds x 10 iterations
   How each seed grew from concept to full installation
   finalState: 'seedling' | 'sapling' | 'old-growth'
   ═══════════════════════════════════════════════════════════════ */

var SEED_GROWTH = [

// ═══ GROVE 1: THE OBSERVATORY (1-16) ═══
{seedId:1,name:'The Pendulum',iterations:[
'Concept sketch: gravity as a constant, period as sqrt(L/g)',
'Basic canvas: swinging weight, adjustable string length',
'Added period measurement and comparison to formula',
'Multiple pendulums: coupled oscillation and resonance',
'Chaotic pendulum: double pendulum with butterfly sensitivity',
'Historical context: Galileo, Huygens, Foucault',
'PNW connection: seismic pendulums measuring Cascadia tremor',
'Cross-domain: pendulum frequency as musical pitch',
'Integration: feeds data to the Math Co-Processor Fourier chip',
'Full installation: interactive physics lab with 5 pendulum modes'
],finalState:'old-growth',connections:[7,51,81]},

{seedId:2,name:'The Prism',iterations:[
'White light beam rendered as composite RGB on canvas',
'Draggable prism splits beam into 7 color bands',
'Wavelength labels and nanometer scale added',
'Click a color to hear which PNW species sees in that range',
'UV and IR extensions beyond visible range shown as dashed',
'Bee vision overlay: ultraviolet flower patterns revealed',
'Salmon polarized light detection for navigation',
'Historical thread: Newton prism experiments at Woolsthorpe',
'Cross-reference to spectrometer seed for emission lines',
'Full installation: interactive spectrum explorer with animal vision modes'
],finalState:'sapling',connections:[8,33,40]},

{seedId:3,name:'The Telescope',iterations:[
'Night sky canvas with 50 brightest stars plotted',
'Zoom control: click to magnify star clusters',
'Constellation overlay with PNW-visible patterns',
'Planet identification: Jupiter, Saturn, Venus positions',
'Time slider showing seasonal sky rotation at 47N latitude',
'Light pollution toggle: city vs old-growth darkness',
'PNW Indigenous constellation stories as alternate overlays',
'Meteor shower calendar tied to real dates',
'Deep sky objects: Andromeda, Orion Nebula at max zoom',
'Full installation: four-season interactive planetarium'
],finalState:'old-growth',connections:[16,104,124]},

{seedId:4,name:'The Microscope',iterations:[
'Single zoom level showing root cross-section',
'Three magnification levels: 10x, 100x, 1000x',
'Root hairs and fungal hyphae visible at 100x',
'Nematodes and tardigrades animated at 400x',
'Bacteria colony visualization at 1000x',
'Species labels and ecosystem role descriptions',
'Scale bar showing actual size at each magnification',
'PNW soil comparison: rainforest vs volcanic vs glacial',
'Connection to mycelium internet seed for network view',
'Full installation: infinite-zoom soil biome explorer'
],finalState:'old-growth',connections:[21,87,116]},

{seedId:5,name:'The Thermometer',iterations:[
'Simple gradient bar: blue to red with temperature scale',
'Draggable heat source showing conduction through rock',
'Convection currents animated in air column',
'Radiation from canopy gap to forest floor',
'Split view: all three transfer modes side by side',
'PNW thermal systems: ocean thermal inertia, fog cooling',
'Heat dome 2021 scenario: 116F trapped under ridge',
'Seasonal temperature profile: coast vs inland',
'Cross-reference to greenhouse seed for energy balance',
'Full installation: three-mode heat transfer simulator'
],finalState:'sapling',connections:[14,85,113]},

{seedId:6,name:'The Barometer',iterations:[
'Simple pressure gauge with rising/falling indicator',
'Wind direction compass added for forecasting',
'Cloud type identification: cumulus, stratus, cumulonimbus',
'Six-hour forecast game: predict rain, sun, or wind',
'PNW marine weather patterns: Pineapple Express, convergence zone',
'Scoring system: meteorologist rating from novice to expert',
'Historical data: actual pressure traces from PNW stations',
'Comparison to modern NWS forecasting methods',
'Connection to wind rose and weather station seeds',
'Full installation: interactive weather prediction game'
],finalState:'old-growth',connections:[14,95,15]},

{seedId:7,name:'The Seismograph',iterations:[
'Basic needle trace on scrolling paper canvas',
'P-wave and S-wave visualization with timing difference',
'Magnitude slider from 3.0 to 9.0 with energy comparison',
'Cross-section of Cascadia subduction zone geology',
'Wave propagation animation through layered rock',
'Historical record: 1700 megathrust, magnitude 9.0',
'Liquefaction zones mapped for Portland and Seattle',
'Tsunami wave generation from offshore epicenter',
'Connection to pendulum seed for seismic instrument physics',
'Full installation: Cascadia earthquake simulator with wave propagation'
],finalState:'old-growth',connections:[1,94,126]},

{seedId:8,name:'The Spectrometer',iterations:[
'Emission line display for hydrogen: red, cyan, violet',
'Drag rock samples onto analyzer to see spectrum',
'Element identification game: match lines to atoms',
'PNW geology: basalt, granite, obsidian, serpentine spectra',
'Absorption vs emission spectrum comparison',
'Stellar spectroscopy connection: same technique, distant stars',
'Mineral fluorescence under UV light preview',
'Chemical composition percentages calculated from line strength',
'Cross-reference to prism seed for light fundamentals',
'Full installation: PNW geology spectral fingerprint lab'
],finalState:'sapling',connections:[2,10,96]},

{seedId:9,name:'The Particle Cloud',iterations:[
'Random dots bouncing in a box: basic Brownian motion',
'Temperature slider changes particle velocity',
'Particle size slider: pollen grains to smoke particles',
'Visible air molecules added at low opacity',
'Shaft of sunlight effect with particle illumination',
'Einstein 1905 paper context and diffusion equation',
'PNW connection: old-growth dust motes in canopy gaps',
'Statistical analysis: mean free path calculation',
'Cross-reference to phase change seed for state transitions',
'Full installation: kinetic theory demonstrator with forest setting'
],finalState:'seedling',connections:[15,32,73]},

{seedId:10,name:'The Half-Life',iterations:[
'Grid of 100 atoms, click to start random decay',
'Exponential decay curve drawn in real time',
'C-14 to N-14 conversion animation',
'Half-life marker at 5,730 years for carbon-14',
'Tree ring selection: click a ring to date it',
'1000-year cedar: isotope count decreases with depth',
'Comparison to other isotopes: K-40, U-238',
'Archaeological dating examples from PNW sites',
'Cross-reference to ice core seed for dating layers',
'Full installation: carbon-14 dating lab with old-growth samples'
],finalState:'sapling',connections:[66,120,127]},

{seedId:11,name:'The Refraction Pool',iterations:[
'Fish visible through water surface with offset position',
'Snells law diagram with angle measurements',
'Adjustable dive angle for osprey strike',
'Refraction index slider: air, water, glass, diamond',
'Miss counter: three strikes and fish escapes',
'Osprey biomechanics: corneal correction for underwater vision',
'Total internal reflection demonstration',
'Fiber optic analogy: light trapped by refraction',
'Connection to wave tank seed for water optics',
'Full installation: osprey fishing game with refraction physics'
],finalState:'sapling',connections:[12,13,89]},

{seedId:12,name:'The Doppler Shift',iterations:[
'Moving dot emitting circular sound waves',
'Wave compression ahead, stretching behind visualized',
'Speed slider with pitch change indicator',
'Osprey dive whistle as primary demonstration',
'Ambulance siren analogy for familiar reference',
'Redshift and blueshift for astronomical application',
'Formula display: observed frequency vs source velocity',
'Radar speed detection explained by same principle',
'Connection to pitch pipe seed for frequency perception',
'Full installation: dual-mode Doppler demo for sound and light'
],finalState:'seedling',connections:[11,52,62]},

{seedId:13,name:'The Wave Tank',iterations:[
'Single pebble drop creating concentric ripples',
'Two-source interference pattern visualization',
'Constructive and destructive interference labeled',
'Standing wave patterns with nodal lines',
'Kelp motion responding to wave patterns',
'Wavelength and frequency controls with real-time update',
'Diffraction around obstacles demonstrated',
'Resonance: matching natural frequency amplifies waves',
'Connection to overtone series seed for wave harmonics',
'Full installation: multi-source wave interference lab'
],finalState:'sapling',connections:[11,51,60]},

{seedId:14,name:'The Pressure Gradient',iterations:[
'Pacific Ocean to Cascade crest cross-section diagram',
'High pressure zone over ocean with isobars',
'Air mass movement arrows following pressure gradient',
'Orographic lift on west slopes of Cascades',
'Rain shadow visualization: wet west, dry east',
'Temperature and moisture profiles at elevation',
'Convergence zone formation around Puget Sound',
'Seasonal variation: summer high pressure ridge',
'Connection to barometer and wind turbine seeds',
'Full installation: PNW atmospheric engine cross-section'
],finalState:'sapling',connections:[5,6,84]},

{seedId:15,name:'The Phase Change',iterations:[
'Water molecule bouncing between states: solid, liquid, gas',
'Phase diagram with temperature and pressure axes',
'Latent heat visualization: energy absorbed without temperature rise',
'Pacific evaporation to cloud formation animation',
'Cloud to rain: condensation releases heat aloft',
'Rain to river: gravity-driven surface flow',
'Fog drip: unique PNW water delivery mechanism',
'Complete cycle animation with energy budget',
'Cross-reference to water cycle installation',
'Full installation: PNW water cycle energy tracker'
],finalState:'seedling',connections:[9,86,121]},

{seedId:16,name:'The Magnetic Field',iterations:[
'Iron filing pattern around bar magnet visualization',
'Earth dipole field with field lines pole to pole',
'Compass needle responding to local field direction',
'Rufous hummingbird 3900-mile migration route overlay',
'Magnetoreception: cryptochrome protein in bird retina',
'Field reversal animation: last flip 780,000 years ago',
'Effect on migration routes during reversal event',
'Solar wind interaction with magnetosphere',
'Connection to star map seed for celestial navigation',
'Full installation: geomagnetic navigation explorer'
],finalState:'sapling',connections:[3,100,122]},

// ═══ GROVE 2: THE LIBRARY (17-32) ═══
{seedId:17,name:'The Fibonacci Garden',iterations:[
'Numbered dots placed in spiral pattern',
'Fibonacci sequence display: 1,1,2,3,5,8,13...',
'Sunflower seed packing at golden angle 137.5 degrees',
'Pinecone scale count matching Fibonacci numbers',
'Fern fiddlehead unfurling as recursive growth',
'Efficiency proof: why Fibonacci packing maximizes density',
'Connection to golden spiral for ratio visualization',
'Phyllotaxis parameter adjustment for leaf arrangements',
'Cross-reference to fractal fern for recursive geometry',
'Full installation: nature-counting garden with five specimens'
],finalState:'seedling',connections:[19,28,87]},

{seedId:18,name:'The Fractal Fern',iterations:[
'Barnsley fern algorithm with default parameters',
'Four slider controls for affine transformation weights',
'Sword fern preset matching real PNW species',
'Maidenhair and bracken presets added',
'Self-similarity zoom: click to magnify any region',
'Iteration count display showing point accumulation',
'Color gradient based on iteration depth',
'Comparison to real fern photographs side by side',
'Connection to tessellation seed for geometric tiling',
'Full installation: IFS fractal generator with PNW fern library'
],finalState:'sapling',connections:[17,29,35]},

{seedId:19,name:'The Golden Spiral',iterations:[
'Logarithmic spiral drawn from golden rectangles',
'Phi ratio display: 1.618033988749...',
'Orb weaver web with radii measuring phi ratio',
'Nautilus shell overlay matching spiral',
'Hurricane eye spiral from satellite imagery',
'Galaxy arm spiral at cosmological scale',
'Proof that successive Fibonacci ratios approach phi',
'Golden angle connection to phyllotaxis',
'Cross-reference to photography seed for composition',
'Full installation: phi-ratio explorer across five scales'
],finalState:'seedling',connections:[17,37,44]},

{seedId:20,name:'The Binary Forest',iterations:[
'Single tree with left=0, right=1 branching',
'Binary counter: walk the tree to spell numbers 0-255',
'ASCII encoding: binary to character conversion',
'Comparison to decimal and hexadecimal counting',
'Eight-level tree showing 256 possible paths',
'CPU register metaphor: bits stored in branches',
'Game mode: find the path for a given number',
'Historical: Leibniz, Boole, Shannon contributions',
'Connection to logic gates seed for Boolean operations',
'Full installation: binary number system tree navigator'
],finalState:'seedling',connections:[30,96,115]},

{seedId:21,name:'The Prime Sieve',iterations:[
'100 numbered mushroom spores on canvas',
'Sieve step 1: cross out multiples of 2 in red',
'Steps 2-4: cross out multiples of 3, 5, 7',
'Surviving primes highlighted in gold',
'Prime density visualization: gaps widen with magnitude',
'Ulam spiral pattern for 2D prime distribution',
'Twin primes highlighted: pairs differing by 2',
'Goldbach conjecture: every even number as sum of two primes',
'Connection to encryption seed for RSA fundamentals',
'Full installation: animated Eratosthenes sieve with prime explorer'
],finalState:'seedling',connections:[24,31,116]},

{seedId:22,name:'The Graph Theory Trail',iterations:[
'Simple graph: 5 nodes, 6 edges on trail map',
'Euler path challenge: traverse every edge once',
'Vertex degree calculation and odd-degree count',
'Konigsberg bridge problem historical context',
'Hamiltonian path variant: visit every node once',
'Graph coloring: minimum colors for non-adjacent nodes',
'Shortest path algorithm visualization (Dijkstra)',
'Network connectivity: removing edges to disconnect',
'Connection to mesh network seed for routing',
'Full installation: trail network graph theory puzzle set'
],finalState:'sapling',connections:[88,100,115]},

{seedId:23,name:'The Sorting Creek',iterations:[
'Ten river stones of different sizes to sort',
'Bubble sort animation: slow adjacent swaps',
'Merge sort: divide, sort halves, merge back',
'Quicksort: pick pivot, partition, recurse',
'Comparison counter tracking algorithmic efficiency',
'Big-O notation explained: O(n2) vs O(n log n)',
'Insertion sort and selection sort added',
'Race mode: algorithms compete side by side',
'Connection to logic gates seed for computational basics',
'Full installation: sorting algorithm race with seven methods'
],finalState:'sapling',connections:[30,90,96]},

{seedId:24,name:'The Probability Pool',iterations:[
'4000 salmon eggs visualized as dots in gravel',
'Predation probability slider removes eggs randomly',
'Flood event: temperature surge kills percentage',
'Disease factor: fungal infection spreads through cluster',
'Monte Carlo: run simulation 1000 times, average survivors',
'Expected value calculation: 2 adults from 4000 eggs',
'Sensitivity analysis: which factor matters most',
'Comparison to lottery odds for perspective',
'Connection to statistics meadow for distribution analysis',
'Full installation: salmon survival Monte Carlo simulator'
],finalState:'sapling',connections:[25,89,114]},

{seedId:25,name:'The Statistics Meadow',iterations:[
'Click lupines to measure their height: data collection',
'Histogram builds in real time as measurements accumulate',
'Mean, median, mode calculated and displayed',
'Standard deviation bars on histogram',
'Normal distribution curve overlay at n=50',
'Central limit theorem: sample means cluster around true mean',
'Sample vs population comparison',
'Confidence interval display at 95 percent',
'Connection to climate model seed for statistical projections',
'Full installation: wildflower sampling statistics lab'
],finalState:'sapling',connections:[24,95,113]},

{seedId:26,name:'The Venn Diagram Pools',iterations:[
'Three overlapping circles representing tide pools',
'Drag anemones, mussels, urchins between pools',
'Intersection regions highlight shared species',
'Union operation: all species in at least one pool',
'Complement: species NOT in selected pool',
'Set notation labels: A intersection B, A union C',
'Cardinality counts for each region',
'De Morgan laws demonstrated visually',
'Connection to clan system seed for kinship overlaps',
'Full installation: interactive set theory with intertidal species'
],finalState:'seedling',connections:[22,74,108]},

{seedId:27,name:'The Coordinates Game',iterations:[
'GPS-style display with latitude and longitude readout',
'First cache hidden at decimal degree coordinates',
'DMS format: degrees, minutes, seconds conversion',
'UTM grid reference system for military-style navigation',
'Relative bearing: compass direction and distance',
'Five caches forming a trail through virtual forest',
'Scoring based on accuracy and time to find',
'Comparison of coordinate systems: strengths and weaknesses',
'Connection to map maker seed for cartographic context',
'Full installation: five-cache geocaching navigation challenge'
],finalState:'seedling',connections:[94,100,105]},

{seedId:28,name:'The Symmetry Mirror',iterations:[
'Single butterfly wing with vertical line of symmetry',
'Mirror tool: drag line across any natural form',
'Rotational symmetry: starfish with 5-fold rotation',
'Fern frond with approximate bilateral symmetry',
'Dragonfly wing: bilateral precision measured in microns',
'Symmetry classification: reflective, rotational, translational',
'Snowflake: 6-fold symmetry from crystal structure',
'Asymmetry in nature: crab claws, flatfish',
'Connection to tessellation seed for repeating patterns',
'Full installation: symmetry finder with 12 natural specimens'
],finalState:'seedling',connections:[19,29,37]},

{seedId:29,name:'The Tessellation Floor',iterations:[
'Triangle tiles: drag to fill a region',
'Square tiles added as second option',
'Hexagon tiles: the only other regular tessellation',
'Honeycomb conjecture: hexagons maximize area per perimeter',
'Semi-regular tessellations with mixed polygon types',
'Escher-style deformed tessellations',
'Proof: why pentagons cannot tessellate alone',
'Natural tessellations: basalt columns, turtle shell',
'Connection to weaving seed for pattern generation',
'Full installation: tessellation builder with six tile types'
],finalState:'sapling',connections:[18,28,42]},

{seedId:30,name:'The Logic Gates',iterations:[
'AND gate: two dam inputs both need flow for output',
'OR gate: either channel provides output flow',
'NOT gate: flow blocked when input present',
'Truth tables displayed for each gate type',
'Chain two gates: build NAND from AND plus NOT',
'Half-adder circuit from XOR and AND gates',
'Full adder with carry propagation',
'4-bit counter built from cascaded flip-flops',
'Connection to circuit board seed for electronic version',
'Full installation: beaver dam logic circuit builder'
],finalState:'old-growth',connections:[20,23,96]},

{seedId:31,name:'The Encryption Trail',iterations:[
'Simple substitution cipher: A=Z, B=Y, ...',
'Frequency analysis tool to crack substitution',
'Transposition cipher: rearrange letter positions',
'Key-based cipher with shared secret word',
'Coyote hides message on trail: decode to find next clue',
'Chinook Jargon vocabulary as cipher alphabet',
'One-time pad: provably unbreakable with random key',
'Public key concept: RSA simplified for demonstration',
'Connection to mesh network seed for secure communication',
'Full installation: five-level cryptography challenge trail'
],finalState:'sapling',connections:[20,62,115]},

{seedId:32,name:'The Infinity Walk',iterations:[
'Animated character walking halfway to tree repeatedly',
'Distance remaining counter decreasing by half each step',
'Geometric series sum: 1/2 + 1/4 + 1/8 + ... = 1',
'Convergence proof visualization with epsilon bounds',
'Zeno paradoxes: Achilles and tortoise variant',
'Historical context: Greeks to Cauchy to Weierstrass',
'Glacier metaphor: moves slower than Zeno, still arrives',
'Infinite series that diverge: harmonic series grows without bound',
'Connection to calligraphy stone seed for meditative pacing',
'Full installation: interactive Zeno paradox with convergent series'
],finalState:'seedling',connections:[9,68,73]},

// ═══ GROVE 3: THE STUDIO (33-48) ═══
{seedId:33,name:'The Color Wheel Meadow',iterations:[
'Three primary color flowers: red, blue, yellow',
'Drag flowers onto mixing palette to blend',
'Complementary pairs highlighted on wheel',
'Triadic and split-complementary schemes shown',
'PNW wildflower pigments: paintbrush, lupine, Oregon grape',
'Warm vs cool color temperature zones',
'Color blindness simulation: deuteranopia, protanopia views',
'Natural dye chemistry: which molecules make which colors',
'Connection to batik studio seed for applied color layering',
'Full installation: PNW wildflower color theory lab'
],finalState:'seedling',connections:[2,45,48]},

{seedId:34,name:'The Perspective Trail',iterations:[
'Single vanishing point on forest trail horizon',
'Guideline tool: drag from vanishing point to edges',
'Douglas fir corridor demonstrating natural perspective',
'Object placement along depth lines with size scaling',
'Atmospheric perspective: distant trees fade to blue-gray',
'Two-point perspective variant for building corners',
'Foreshortening demonstration with fallen logs',
'Historical: Brunelleschi, Alberti, Renaissance perspective',
'Connection to photography seed for composition',
'Full installation: one-point perspective drawing tool in old growth'
],finalState:'sapling',connections:[41,47,94]},

{seedId:35,name:'The Texture Library',iterations:[
'Douglas fir bark: deep furrows, cinnamon color',
'Sphagnum moss: compressed green cushion texture',
'River cobble: smooth rounded stones, varied color',
'Sea otter fur: dense underfur with guard hairs',
'Cedar heartwood: straight grain, warm red-brown',
'Obsidian: volcanic glass, conchoidal fracture surface',
'Dried kelp: translucent amber, wrinkled surface',
'Close-up, cross-section, and material properties for each',
'Madrone bark peeling reveal: papery copper sheets',
'Full installation: 20-specimen texture explorer with three views'
],finalState:'seedling',connections:[18,43,46]},

{seedId:36,name:'The Shadow Sundial',iterations:[
'Single tree casting shadow on flat ground',
'Sun position calculated for 47N latitude',
'Shadow sweeps through a full day in time-lapse',
'Hour markers placed where shadow tips fall',
'Summer solstice: short shadows, high sun angle 66 degrees',
'Winter solstice: long shadows, low sun 19 degrees',
'Equinox: shadow hits marks precisely at hour intervals',
'Historical sundial designs: Egyptian, Greek, Islamic',
'Connection to seasonal calendar seed for phenology',
'Full installation: latitude-adjustable sundial simulator'
],finalState:'sapling',connections:[83,103,107]},

{seedId:37,name:'The Weaving Loom',iterations:[
'Plain weave: over-under pattern on simple grid',
'Twill weave: diagonal pattern emerges from offset',
'Color selection from natural dyes: cedar, nettle, beargrass',
'Coast Salish wrapped twining technique demonstrated',
'Pattern editor: design your own weaving draft',
'Story encoding: specific patterns carry specific meanings',
'Material properties: cedar bark flexibility vs wool warmth',
'Historical textile arts of the PNW nations',
'Connection to regalia gallery seed for ceremonial context',
'Full installation: three-technique weaving pattern generator'
],finalState:'old-growth',connections:[19,99,110]},

{seedId:38,name:'The Pottery Wheel',iterations:[
'Coil-building: stack clay ropes in cylinder',
'Smoothing tool: blend coils into continuous wall',
'Shape profiles: bowl, jar, plate, cup templates',
'Riverbank clay sourcing: PNW clay deposits mapped',
'Shell temper: crushed shell mixed to prevent cracking',
'Pit kiln firing simulation: temperature curve over hours',
'Surface decoration: incised and stamped patterns',
'Historical Indigenous pottery traditions of Pacific Northwest',
'Connection to mosaic pool seed for compositional design',
'Full installation: coil-built pottery simulator with pit firing'
],finalState:'sapling',connections:[42,46,82]},

{seedId:39,name:'The Printmaking Press',iterations:[
'Leaf placed on canvas with ink applied',
'Press action transfers vein pattern to paper',
'Negative space revealed: the leaf shape as absence',
'Species library: maple, sword fern, western red cedar',
'Multi-layer printing: two colors in registration',
'Pressure sensitivity: harder press shows more detail',
'Botanical illustration connection: art meets science',
'Historical printmaking: woodblock to lithography to screen',
'Connection to charcoal sketch seed for drawing fundamentals',
'Full installation: natural specimen printmaking studio'
],finalState:'seedling',connections:[4,35,43]},

{seedId:40,name:'The Light Table',iterations:[
'Single leaf on backlit surface showing vein network',
'Feather on light table: barbule structure visible',
'Shell growth layers visible by transmitted light',
'Dragonfly wing: mostly air between delicate veins',
'Translucency slider: control backlight intensity',
'Cross-section view: light reveals internal structure',
'Comparison panel: reflected vs transmitted light side by side',
'Scientific applications: microscopy prep, gem grading',
'Connection to prism seed for light behavior fundamentals',
'Full installation: translucency explorer with 20 PNW specimens'
],finalState:'seedling',connections:[2,4,35]},

{seedId:41,name:'The Photography Walk',iterations:[
'Forest clearing presented as raw photograph',
'Rule of thirds grid overlay: reframe the shot',
'Leading lines: trail curves draw eye to vanishing point',
'Golden ratio spiral overlay for composition balance',
'Frame-within-frame: branches creating natural borders',
'Ten reframings of the same scene scored for impact',
'Eagle eye view: overhead composition perspective',
'Exposure triangle: aperture, shutter speed, ISO demonstrated',
'Connection to perspective trail seed for depth techniques',
'Full installation: ten-composition forest photography trainer'
],finalState:'sapling',connections:[19,34,48]},

{seedId:42,name:'The Mosaic Pool',iterations:[
'Pebbles and shells dragged into shallow tide pool',
'Color matching: group by hue for geometric patterns',
'Shape matching: round, elongated, flat categories',
'Figurative mosaic: arrange to form a fish or star',
'Abstract geometry: concentric circles, spirals',
'Timer counting down to high tide erasing the work',
'Octopus den stones: same arranging instinct documented',
'Historical mosaics: Roman, Byzantine, Islamic traditions',
'Connection to tessellation seed for tiling theory',
'Full installation: impermanent tide pool mosaic maker'
],finalState:'sapling',connections:[29,38,73]},

{seedId:43,name:'The Charcoal Sketch',iterations:[
'Virtual charcoal stick on bark-texture canvas',
'Pressure sensitivity: light press for tone, heavy for line',
'Smudge tool: blend charcoal for gradients',
'Erase to reveal bark texture beneath',
'Value scale exercise: 10 steps from white to black',
'Gesture drawing mode: 30-second quick sketches',
'Fire-to-charcoal connection: drawing tool from the drawn',
'Historical charcoal art: cave paintings to Kathe Kollwitz',
'Connection to palette knife seed for painting techniques',
'Full installation: charcoal drawing studio on bark canvas'
],finalState:'seedling',connections:[35,39,48]},

{seedId:44,name:'The Origami Forest',iterations:[
'Simple crane: 12 folds from square sheet',
'Fish fold: Chinook salmon in 15 steps',
'Frog fold: Salamander base with inflatable body',
'Intermediate: Bear requires 30 precise folds',
'Complex: Orca multi-sheet assembly with 60 folds',
'Eagle: most complex single-sheet fold in collection',
'Geometric transformation labels on each fold step',
'Crease pattern display: unfolded reveals the blueprint',
'Connection to symmetry mirror seed for fold geometry',
'Full installation: 48-animal origami challenge progression'
],finalState:'old-growth',connections:[19,28,47]},

{seedId:45,name:'The Batik Studio',iterations:[
'Wax brush tool draws resist patterns on fabric',
'First dye bath: Oregon grape yellow absorbed by unwaxed areas',
'Remove wax to reveal yellow pattern on white',
'Second wax layer applied over yellow areas',
'Second dye bath: huckleberry purple over remaining white',
'Remove all wax: two-color batik revealed',
'Octopus chromatophore analogy: pigment cell masking',
'Natural dye chemistry: mordants and fixatives explained',
'Connection to weaving seed for textile arts',
'Full installation: three-layer wax-resist dyeing simulator'
],finalState:'sapling',connections:[33,37,110]},

{seedId:46,name:'The Calligraphy Stone',iterations:[
'River-carved rock surface as writing template',
'Water tracing: follow the erosion curves with finger',
'No sharp angles rule: every stroke flows like water',
'Letterform practice: lowercase alphabet in water script',
'Brush width responds to speed: fast=thin, slow=thick',
'Glacial erratic comparison: carved by ice not water',
'Zen calligraphy connection: the stroke IS the practice',
'Historical: Chinese water calligraphy tradition on stone',
'Connection to zen garden seed for meditative craft',
'Full installation: water-erosion calligraphy practice stone'
],finalState:'seedling',connections:[35,43,77]},

{seedId:47,name:'The Sculpture Garden',iterations:[
'Primitive shapes: cube, sphere, cone draggable in 3D space',
'Rotate and scale controls for each object',
'Material selection: stone, wood, metal, glass with textures',
'Negative space composition: the gaps define the piece',
'Canopy light changes through simulated day cycle',
'Shadow casting: position objects for shadow interplay',
'Bear stacking river stones: found-object art instinct',
'Historical sculpture: Brancusi, Noguchi, Goldsworthy',
'Connection to photography walk seed for framing',
'Full installation: 3D found-object sculpture composer in clearing'
],finalState:'old-growth',connections:[34,42,72]},

{seedId:48,name:'The Palette Knife',iterations:[
'Thick impasto strokes on canvas with knife tool',
'Spring palette: lupine purple, new-leaf chartreuse loaded',
'Summer palette: dry grass gold, deep sky blue',
'Autumn palette: vine maple red, larch needle gold',
'Winter palette: moss green, fog gray, bare branch umber',
'Texture variation: knife angle changes stroke character',
'Color mixing on canvas: wet-into-wet blending',
'PNW landscape references: specific views for each season',
'Connection to color wheel seed for harmony theory',
'Full installation: four-season PNW landscape painting studio'
],finalState:'sapling',connections:[33,41,43]},

// ═══ GROVE 4: THE CONCERT HALL (49-64) ═══
{seedId:49,name:'The Drum Circle',iterations:[
'Single log strike: hollow resonance on canvas',
'Second voice: green branch with higher pitch',
'Third voice: dry snag with sharp crack',
'Fourth voice: river stone on cedar for bell tone',
'3-against-4 polyrhythm layering with visual grid',
'Downbeat alignment: when patterns sync, thunder effect',
'West African djembe rhythm patterns as templates',
'PNW roundwood acoustics: species affects timbre',
'Connection to beat counter seed for rhythm perception',
'Full installation: four-voice polyrhythm builder'
],finalState:'sapling',connections:[53,59,63]},

{seedId:50,name:'The Tuning Fork',iterations:[
'Single fork struck: pure sine wave at 440 Hz',
'Second fork at 3:2 ratio: perfect fifth interval',
'Just intonation intervals: 3:2, 4:3, 5:4 ratios clean',
'Equal temperament: every interval slightly detuned from pure',
'Waveform comparison: beating between near-frequencies',
'Thrush song analysis: sings in just intonation naturally',
'Piano tuning: compromise of equal temperament explained',
'Historical: Pythagoras, Zarlino, Bach Well-Tempered Clavier',
'Connection to scale builder seed for interval construction',
'Full installation: temperament comparison lab with waveforms'
],finalState:'sapling',connections:[51,54,61]},

{seedId:51,name:'The Overtone Series',iterations:[
'Fundamental frequency on vibrating string visualization',
'Touch string at 1/2: second harmonic isolated',
'Third harmonic at 1/3: octave plus fifth',
'Fourth and fifth harmonics shown in series',
'Timbre comparison: flute vs clarinet same fundamental',
'Overtone recipe slider: mix harmonics to change timbre',
'Natural harmonics on guitar string demonstrated',
'Connection to acoustic physics: standing wave patterns',
'Cross-reference to pendulum seed for wave fundamentals',
'Full installation: harmonic series explorer with timbre synthesis'
],finalState:'sapling',connections:[1,13,50]},

{seedId:52,name:'The Pitch Pipe',iterations:[
'Adjustable frequency slider: 100 Hz to 6000 Hz',
'Wren call target at 4000 Hz: match to score',
'Owl hoot target at 300 Hz: low frequency challenge',
'Varied thrush at 3500 Hz: haunting single note',
'Frequency-to-species matching game with 10 birds',
'Acoustic ecology: why species sing at different frequencies',
'Frequency niche partitioning in forest soundscape',
'Recording comparison: synthetic vs actual bird calls',
'Connection to noise floor seed for signal isolation',
'Full installation: PNW bird call frequency matching game'
],finalState:'sapling',connections:[12,57,62]},

{seedId:53,name:'The Rhythm Machine',iterations:[
'Hummingbird heartbeat: 1200 BPM as rapid clicks',
'Blue whale heartbeat: 6 BPM as deep slow pulse',
'Human heartbeat: 72 BPM as reference tempo',
'Layer three heartbeats as polyrhythmic subdivisions',
'Tempo relationship: whale=whole note, human=quarter, hummingbird=32nd',
'Bat echolocation: 120 clicks per second added',
'Master tempo slider scales all layers proportionally',
'Biological rhythm research: circadian to heartbeat scales',
'Connection to drum circle seed for polyrhythm building',
'Full installation: heartbeat polyrhythm machine with 5 species'
],finalState:'seedling',connections:[49,59,122]},

{seedId:54,name:'The Scale Builder',iterations:[
'Root note selected on frequency slider',
'Whole step added: 9:8 ratio from root',
'Half step: 16:15 ratio for semitone',
'Major scale built interval by interval',
'Minor scale: flatted 3rd, 6th, 7th compared',
'Pentatonic: 5-note scale common across cultures',
'Chromatic: all 12 semitones equally spaced',
'Custom scale builder: invent your own intervals',
'Connection to chord wheel seed for harmonic context',
'Full installation: scale construction workshop with 8 presets'
],finalState:'sapling',connections:[50,55,61]},

{seedId:55,name:'The Chord Wheel',iterations:[
'Circle of fifths displayed as color wheel',
'Major chords mapped to warm colors',
'Minor chords mapped to cool colors',
'I-IV-V progression: primary color triad analogy',
'ii-V-I jazz progression: secondary colors',
'Click any chord to hear it and see neighbors',
'Chord function labels: tonic, dominant, subdominant',
'Key modulation: rotate the wheel to change key',
'Connection to palette knife seed for color-music synesthesia',
'Full installation: color-harmonic chord progression explorer'
],finalState:'sapling',connections:[33,54,64]},

{seedId:56,name:'The Song Map',iterations:[
'PNW map with trade route overlay',
'Nez Perce melody pin: crosses Cascades east to west',
'Sea shanty pin: arrives at Astoria harbor',
'Haida paddle song: travels south along coast',
'Click route to hear melody fragment and see path',
'Cultural diffusion timeline: centuries of song travel',
'Loon call: 15-mile range across water, nature broadcast',
'Oral tradition: how songs survive without notation',
'Connection to canoe journey seed for cultural routes',
'Full installation: ethnomusicology map of PNW song migration'
],finalState:'old-growth',connections:[100,101,102]},

{seedId:57,name:'The Sound Walk',iterations:[
'Dark screen with single instruction: listen',
'Layer 1 fades in: wind in high canopy',
'Layer 2: creek water over smooth stones',
'Layer 3: birdsong from multiple directions',
'Layer 4: insect hum in understory',
'Layer 5: your own heartbeat if you wait',
'Loon call across lake: distant, haunting, singular',
'Acoustic ecology label: identifying each sound source',
'Connection to silence seed for ultimate quiet',
'Full installation: 5-layer guided forest listening meditation'
],finalState:'seedling',connections:[52,60,80]},

{seedId:58,name:'The Instrument Builder',iterations:[
'Alder branch: bore diameter sets pitch of flute',
'Hole placement calculator for pentatonic scale',
'Cedar box drum: wall thickness determines resonance',
'Membrane tension slider changes drum pitch',
'Spruce root rattle: seed count determines timbre density',
'Beaver tooth chisel: carving the resonating chamber',
'Material density chart: species affects sound speed',
'Acoustic modeling: cavity volume and port tuning',
'Connection to overtone series seed for harmonic design',
'Full installation: three-instrument design workshop from forest materials'
],finalState:'old-growth',connections:[49,51,91]},

{seedId:59,name:'The Beat Counter',iterations:[
'Pileated woodpecker pattern: slow, deliberate, 15 per burst',
'Tap along button: score points for sync accuracy',
'Downy woodpecker: fast, light, 25 strikes per second',
'Red-breasted sapsucker: irregular, jazzy syncopation',
'Tempo detection: system measures your tapping BPM',
'Difficulty progression: patterns get faster and irregular',
'Motor-auditory coordination science explanation',
'Comparison to human drumming entrainment studies',
'Connection to rhythm machine seed for biological tempo',
'Full installation: woodpecker rhythm matching game with 5 species'
],finalState:'seedling',connections:[49,53,63]},

{seedId:60,name:'The Echo Chamber',iterations:[
'Old-growth forest: long reverb, deep bass absorption',
'Clear-cut simulation: harsh echo, no diffusion',
'Canyon walls: distinct repeating echoes',
'Cave environment: infinite sustain, dripping ambiance',
'Impulse response display for each environment',
'Reverb time RT60 measurement and comparison',
'Bat echolocation: mapping space entirely by echo',
'Absorption coefficient chart for different materials',
'Connection to wave tank seed for reflection physics',
'Full installation: four-environment acoustic simulator'
],finalState:'sapling',connections:[13,57,62]},

{seedId:61,name:'The Frequency Stairs',iterations:[
'Single note at bottom: the fundamental frequency',
'Climb one step: frequency increases by 12th root of 2',
'Twelve equal steps in chromatic scale visualized',
'Click each step to hear the interval from root',
'At the top: frequency has exactly doubled (octave)',
'Pentatonic stairs: only 5 steps, wider gaps',
'Whole tone stairs: 6 equal steps, dreamy sound',
'The octave as universal: every culture recognizes it',
'Connection to tuning fork seed for interval ratios',
'Full installation: multi-scale staircase interval explorer'
],finalState:'seedling',connections:[50,54,64]},

{seedId:62,name:'The Noise Floor',iterations:[
'Forest soundscape with mixed bird calls and ambient',
'Signal isolation slider: pull one bird call above noise',
'SNR meter: signal-to-noise ratio in decibels',
'Frequency filter: high-pass, low-pass, bandpass controls',
'Spectral display: frequency vs time waterfall plot',
'Marten signal relay analogy: message must clear noise',
'Information theory: Shannon entropy and channel capacity',
'Practical audio: why studios need quiet rooms',
'Connection to mesh network seed for digital signal noise',
'Full installation: acoustic signal extraction workbench'
],finalState:'sapling',connections:[12,52,115]},

{seedId:63,name:'The Loop Station',iterations:[
'Record button: capture 4-bar loop of wren song',
'Second track: owl hoot on beats 2 and 4',
'Third track: creek ambience as continuous pad',
'Fourth track: single eagle cry on bar 8 downbeat',
'Solo and mute buttons for each track',
'Volume faders for mixing balance',
'Arrangement view: mute patterns create structure',
'Overdub: add details to existing tracks',
'Connection to beat counter seed for rhythmic foundation',
'Full installation: four-track forest sound loop station'
],finalState:'sapling',connections:[49,57,59]},

{seedId:64,name:'The Vinyl Groove',iterations:[
'Spiral groove drawn on rotating disc surface',
'Zoom to see waveform carved into groove wall',
'Loud passages: wide groove excursion visible',
'Quiet passages: narrow, delicate modulation',
'Stereo channels: 45-degree angle cut for L and R',
'Playback speed: 33 1/3 vs 45 RPM comparison',
'Historical: Edison cylinder to modern audiophile vinyl',
'Raven collecting shiny things: the disc catches light',
'Connection to overtone series seed for recorded harmonics',
'Full installation: visual vinyl record anatomy explorer'
],finalState:'sapling',connections:[51,55,61]},

// ═══ GROVE 5: THE PHILOSOPHY GARDEN (65-80) ═══
{seedId:65,name:'The Trolley Problem Trail',iterations:[
'First dilemma: save owl habitat or logging jobs',
'Binary choice presented with consequence preview',
'Second dilemma: dam river for clean energy or keep wild',
'Third dilemma: control invasive species or let nature decide',
'Fourth dilemma: clearcut for fire safety or leave old growth',
'Fifth dilemma: tourism access vs wilderness protection',
'Ethical framework reveal: your choices mapped to school of thought',
'No right answers: the discomfort IS the lesson',
'Connection to ethics compass seed for structured reasoning',
'Full installation: five ecological ethics dilemmas with framework analysis'
],finalState:'sapling',connections:[74,97,109]},

{seedId:66,name:'The Ship of Theseus Nurse Log',iterations:[
'Cedar falls: day one, 100 percent original cells',
'Year 10: moss covers surface, bark softens',
'Year 50: hemlock seedling roots penetrate heartwood',
'Year 100: only 40 percent original cedar remains',
'Year 200: new growth has replaced most original tissue',
'The question appears: is this still Cedar?',
'Year 300: functionally a new organism grown from the old',
'Identity persistence debate: physical vs pattern continuity',
'Connection to impermanence garden seed for process philosophy',
'Full installation: 300-year identity transformation time-lapse'
],finalState:'seedling',connections:[10,73,120]},

{seedId:67,name:'The Allegory of the Cave',iterations:[
'Stream scene: salmon fry know only freshwater',
'Shadows on cave wall analogy: limited perspective',
'Journey to ocean: vastly larger reality encountered',
'Return to birth stream: carrying knowledge of the ocean',
'The fish who stayed see only shadows of the full world',
'Plato dialog excerpts paired with salmon lifecycle',
'Epistemological layers: opinion, belief, understanding, knowledge',
'Modern cave: screen-mediated reality as shadow wall',
'Connection to thought experiment lab seed for philosophy',
'Full installation: salmon lifecycle as Platonic allegory'
],finalState:'sapling',connections:[68,75,79]},

{seedId:68,name:'The Paradox Garden',iterations:[
'Liar paradox: coyote says everything I say is a trick',
'If true then false, if false then true: loop visualized',
'Sorites paradox: remove one tree, still a forest? Repeat',
'Heap problem: how many grains make a pile',
'Grandfather paradox: salmon returning to own birth stream',
'Ship of Theseus callback to nurse log seed',
'No clean solutions: paradoxes reveal limits of logic',
'Godel incompleteness: formal systems contain undecidable truths',
'Connection to question tree seed for Socratic method',
'Full installation: five illustrated paradoxes with PNW ecology'
],finalState:'sapling',connections:[32,66,79]},

{seedId:69,name:'The Thought Experiment Lab',iterations:[
'Marys room: salmon biologist who never saw live salmon',
'The qualia question: does she learn something new upon seeing one',
'Experience machine: VR forest vs real forest, which matters',
'Philosophical zombie: a forest that processes but doesnt feel',
'Veil of ignorance: design forest policy not knowing your species',
'Rawlsian justice applied to ecosystem management',
'Chinese room: does the forest understand or just process',
'Extended mind thesis: is the mycelium network thinking',
'Connection to ethics compass seed for decision frameworks',
'Full installation: six interactive philosophical thought experiments'
],finalState:'old-growth',connections:[65,67,80]},

{seedId:70,name:'The Ethics Compass',iterations:[
'Two-axis grid: individual vs collective, short vs long term',
'Plot a decision as a point on the complex plane',
'Quadrant 1: individual good, short term (selfish rational)',
'Quadrant 2: collective good, short term (utilitarian)',
'Quadrant 3: individual good, long term (virtue ethics)',
'Quadrant 4: collective good, long term (Rawlsian justice)',
'Eagle perspective: high enough to see all four quadrants',
'Historical ethicists: Aristotle, Mill, Kant, Rawls',
'Connection to trolley problem seed for applied ethics',
'Full installation: four-quadrant ethical decision mapper'
],finalState:'sapling',connections:[65,78,97]},

{seedId:71,name:'The Meditation Pool',iterations:[
'Dark canvas with single instruction: breathe',
'Tide animation: water rises slowly',
'Inhale cue synced to rising tide',
'Hold at slack water: pause between breaths',
'Exhale cue synced to falling tide',
'Kelp sway animation responding to breath rhythm',
'Four-minute timer with no other interface elements',
'Heart rate variability concept: coherent breathing',
'Connection to silence seed for pure awareness practice',
'Full installation: tidal breathing meditation with kelp animation'
],finalState:'seedling',connections:[57,77,80]},

{seedId:72,name:'The Gratitude Trail',iterations:[
'Short trail with five station markers',
'Station 1: what taught you something today',
'Station 2: what surprised you',
'Station 3: what comforted you',
'Station 4: what challenged you',
'Station 5: what are you carrying forward',
'Leave a virtual stone of thanks at each station',
'Willow metaphor: bends under snow and springs back',
'Connection to stoic walk seed for resilience philosophy',
'Full installation: five-station reflective walking meditation'
],finalState:'seedling',connections:[77,80,112]},

{seedId:73,name:'The Impermanence Garden',iterations:[
'Empty tide pool canvas with fine sand surface',
'Drag to place grains one at a time into patterns',
'Concentric circles form around central stone',
'Mandala pattern emerges from patient placement',
'Tide timer counting down to high water',
'Waves arrive: pattern dissolves grain by grain',
'Everything gone: pool returns to blank state',
'Start again prompt: the practice IS the product',
'Connection to mosaic pool seed for ephemeral art',
'Full installation: dissolving sand mandala in tide pool'
],finalState:'seedling',connections:[9,32,42]},

{seedId:74,name:'The Empathy Bridge',iterations:[
'Choose a species to experience a day as',
'Douglas squirrel: everything is food storage and territory defense',
'Nurse log: slow decomposition, new growth sprouting from you',
'Orca: everything is family, language, coordinated hunt',
'Salmon: driven upstream by instinct you cannot resist',
'Banana slug: the forest floor at 0.03 mph, every texture amplified',
'Same forest, five completely different worlds experienced',
'Umwelt theory: each species lives in its own perceptual bubble',
'Connection to clan system seed for social perspective',
'Full installation: five-species perspective-taking experience'
],finalState:'sapling',connections:[26,65,108]},

{seedId:75,name:'The Memory Palace',iterations:[
'Forest trail with 10 landmark locations marked',
'Place a fact at the big cedar: species count = 3500',
'Place a fact at the bridge: watershed name',
'Place a fact at the rock outcrop: geological age',
'Walk the trail in imagination to recall each fact',
'Nutcracker comparison: remembers 30,000 seed cache locations',
'Method of loci history: Simonides, Roman orators',
'Cognitive architecture: spatial memory is strongest',
'Connection to place names seed for geographic memory',
'Full installation: 10-station forest memory palace builder'
],finalState:'old-growth',connections:[27,67,105]},

{seedId:76,name:'The Dream Journal',iterations:[
'Blank journal page with writing prompt',
'Write a dream fragment in text input',
'Journal maps water symbols to emotion',
'Trees mapped to growth, animals to instinct',
'Weather mapped to mood, paths to decisions',
'Not Freud, not Jung: the forests own symbolic language',
'Cedar as keeper of the dream record',
'Personal mythology: your symbols are yours alone',
'Connection to story circle seed for narrative building',
'Full installation: forest-symbol dream interpretation journal'
],finalState:'seedling',connections:[66,77,98]},

{seedId:77,name:'The Zen Garden',iterations:[
'Raked sand surface with three stones placed',
'Drag rake tool to draw concentric circles',
'Patterns have no purpose beyond the making',
'Fog analogy: fog doesnt try to be fog',
'Wabi-sabi aesthetic: beauty in imperfection',
'Rock placement: odd numbers, asymmetric balance',
'Rake patterns: straight lines, curves, spirals',
'Empty mind: the garden empties when you stop thinking',
'Connection to calligraphy stone seed for meditative practice',
'Full installation: interactive zen rock garden with rake tool'
],finalState:'seedling',connections:[46,71,73]},

{seedId:78,name:'The Stoic Walk',iterations:[
'Trail through alpine terrain with five stations',
'Station 1: Pika gathers hay without complaint about winter',
'Station 2: Mountain doesnt resist the storm',
'Station 3: River doesnt wish it were somewhere else',
'Station 4: Wind chill is real but suffering is optional',
'Station 5: The trail ends where it ends, not where you wanted',
'Marcus Aurelius Meditations excerpts at each station',
'Epictetus and Seneca for additional Stoic voices',
'Connection to gratitude trail seed for reflective walking',
'Full installation: five-principle Stoic philosophy alpine walk'
],finalState:'sapling',connections:[72,117,125]},

{seedId:79,name:'The Question Tree',iterations:[
'Statement input: enter any claim as root node',
'First Why? branches: answer spawns two sub-questions',
'Second level: each answer generates two more branches',
'Five levels deep: 32 leaf nodes of atomic assumptions',
'Every certainty dissolves into assumptions at depth',
'Sams nature: the question that doesnt end',
'Socratic method: systematic assumption identification',
'Epistemic humility: knowing what you dont know',
'Connection to paradox garden seed for logical limits',
'Full installation: five-level Socratic questioning engine'
],finalState:'old-growth',connections:[67,68,69]},

{seedId:80,name:'The Silence',iterations:[
'Page loads completely dark, no elements visible',
'Single instruction fades in after 3 seconds: listen',
'Nothing else loads, nothing moves, nothing changes',
'Timer hidden in background counts presence duration',
'After 60 seconds of staying: faint heartbeat appears',
'After 120 seconds: a single owl call, then silence again',
'The screen stays dark for as long as you stay',
'Owls hunt in silence: the absence IS the content',
'Connection to sound walk seed for listening practice',
'Full installation: an empty dark page that rewards patience'
],finalState:'seedling',connections:[57,71,128]},

// ═══ GROVE 6: THE WORKSHOP (81-96) ═══
{seedId:81,name:'The Bridge Builder',iterations:[
'Canyon cross-section with gap to span',
'Timber species selection: Doug fir for strength, cedar for rot resistance',
'Simple beam bridge: load capacity calculated from dimensions',
'Truss geometry: triangles distribute load efficiently',
'Simulated elk herd crossing: dynamic load test',
'Failure mode: overloaded beam deflects then breaks',
'Beaver instinct comparison: natural bridge engineering daily',
'Historical timber bridges: covered bridges of Oregon',
'Connection to trail builder seed for infrastructure context',
'Full installation: PNW timber bridge engineering simulator'
],finalState:'old-growth',connections:[1,88,90]},

{seedId:82,name:'The Water Filter',iterations:[
'Turbid creek water poured into top of filter column',
'Gravel layer: removes large particles and debris',
'Sand layer: traps fine sediment particles',
'Charcoal layer: adsorbs dissolved chemicals and color',
'Moss layer: biological filtration of bacteria',
'Clarity meter reading at each stage',
'pH measurement before and after filtration',
'Forest floor analogy: natural multi-stage filter',
'Connection to rain collector seed for water systems',
'Full installation: five-layer water filtration design lab'
],finalState:'sapling',connections:[4,86,126]},

{seedId:83,name:'The Solar Tracker',iterations:[
'Sun path arc for latitude 47N plotted on sky dome',
'December sun angle: only 19 degrees above horizon',
'June sun angle: 66 degrees, nearly overhead',
'Panel tilt optimizer: fixed annual best angle calculated',
'Dual-axis tracking: follow sun for maximum collection',
'Monthly insolation chart: 60 percent of energy in 4 summer months',
'Cloud cover factor: PNW overcast reduces yield',
'Array sizing: panels needed per household at this latitude',
'Connection to renewable grid seed for system integration',
'Full installation: annual solar geometry and panel optimizer'
],finalState:'sapling',connections:[36,84,123]},

{seedId:84,name:'The Wind Turbine',iterations:[
'Blade profile cross-section: airfoil shape like aircraft wing',
'Pitch angle adjustment: too steep stalls, too flat freewheels',
'Chord length variation: wider at hub, narrow at tip',
'Twist distribution: optimal angle changes along blade',
'Wind speed test: 5 to 25 meters per second range',
'Betz limit line: maximum 59.3 percent energy capture',
'Power coefficient curve: peak at optimal tip speed ratio',
'Eagle soaring analogy: same pressure differentials exploited',
'Connection to solar tracker seed for combined renewable system',
'Full installation: wind turbine blade geometry designer'
],finalState:'sapling',connections:[14,83,123]},

{seedId:85,name:'The Greenhouse',iterations:[
'Simple glass box with temperature sensor',
'Vent control: open when too hot, close when cold',
'PNW maritime climate: mild winters but short photoperiods',
'Humidity management: fans and misting system',
'Growing season extension: start seedlings 6 weeks early',
'Heat sink: water barrels absorb daytime warmth for night',
'Fern understory analogy: thriving in low light naturally',
'Crop selection: what grows in PNW greenhouse conditions',
'Connection to composting seed for soil management',
'Full installation: PNW greenhouse climate management simulator'
],finalState:'sapling',connections:[5,87,103]},

{seedId:86,name:'The Rain Collector',iterations:[
'Roof catchment area calculation for typical PNW house',
'Annual yield: 80 inches per year times roof area',
'First-flush diverter: discard dirty initial runoff',
'Storage tank sizing: match supply to summer demand gap',
'Overflow management: excess directed to rain garden',
'Water quality: filtration requirements for different uses',
'Seasonal mismatch: 80 percent of rain falls October through March',
'Historical: cisterns from Roman to modern green building',
'Connection to watershed map installation for drainage context',
'Full installation: rainwater harvesting system designer'
],finalState:'sapling',connections:[15,82,95]},

{seedId:87,name:'The Composting Engine',iterations:[
'Layer browns (carbon) and greens (nitrogen) in bin',
'C:N ratio meter: optimal range 25:1 to 30:1',
'Moisture slider: too dry stops decomposition, too wet goes anaerobic',
'Thermophilic phase: core temperature hits 160F',
'Fungi arrival: white mycelium threads visible',
'Beetle and worm colonization at cooling phase',
'Pile volume shrinks by half over complete cycle',
'Chanterelle forest floor analogy: natural composting engine',
'Connection to soil layers installation for where compost goes',
'Full installation: composting process simulator with thermometer'
],finalState:'sapling',connections:[4,17,116]},

{seedId:88,name:'The Trail Builder',iterations:[
'Terrain cross-section with slope percentage displayed',
'Grade rule: never above 10 percent sustained',
'Switchback design: turn radius for erosion control',
'Water bar placement: angled logs divert runoff',
'Tread material selection: native soil, gravel, boardwalk',
'Drainage: outslope vs crowned tread profiles',
'Elk wore the path first: formalizing existing animal trails',
'Leave No Trace: trail design minimizes impact',
'Connection to map maker seed for topographic planning',
'Full installation: sustainable trail engineering simulator'
],finalState:'old-growth',connections:[22,81,94]},

{seedId:89,name:'The Fish Ladder',iterations:[
'Dam cross-section with blocked salmon migration',
'Pool-and-weir design: stepped pools for resting',
'Flow velocity calculator: too fast and fish cant climb',
'Resting pool depth: minimum 1.2 meters for Chinook',
'Entrance location: where do salmon naturally approach',
'Jump height: maximum 2 meters per step for adults',
'Chinook vs steelhead: different species need different specs',
'Removal alternative: sometimes the best fish ladder is no dam',
'Connection to restoration planner installation for stream recovery',
'Full installation: salmon passage engineering designer'
],finalState:'old-growth',connections:[11,24,90]},

{seedId:90,name:'The Beaver Dam Simulator',iterations:[
'Stream cross-section with unmodified flow',
'Place first dam: water pools behind it immediately',
'Water table rises: surrounding soil becomes saturated',
'Wetland expands: new habitat colonized by plants',
'Sediment trap: turbidity drops downstream of dam',
'Multiple dams: stepped pool system across watershed',
'Remove a dam: cascade of downstream effects visualized',
'Only species besides humans engineering at watershed scale',
'Connection to bridge builder seed for structural engineering',
'Full installation: full watershed beaver dam modeling tool'
],finalState:'old-growth',connections:[23,81,126]},

{seedId:91,name:'The Shelter Builder',iterations:[
'Lean-to frame: fallen branch against standing tree',
'Debris covering: sword fern and duff for insulation',
'A-frame design: two poles meeting at ridge',
'Debris hut: full enclosure from deadfall materials',
'Insulation rating: R-value calculated from material thickness',
'Waterproofing test: simulated rain on shelter designs',
'Wind resistance: orientation relative to prevailing weather',
'Bear den comparison: different approach, same thermal problem',
'Connection to fire starter seed for complete shelter warmth',
'Full installation: four-design wilderness shelter builder'
],finalState:'sapling',connections:[58,81,93]},

{seedId:92,name:'The Knot Board',iterations:[
'Bowline: drag rope through the sequence step by step',
'Clove hitch: securing rope to a post',
'Taut-line hitch: adjustable tension for tent lines',
'Truckers hitch: 3:1 mechanical advantage for lashing',
'Figure-eight: stopper knot for climbing safety',
'Five more knots: sheet bend, timber hitch, prussik, fishermans, square',
'Breaking strength comparison: which knots weaken rope least',
'Otter kelp wrap analogy: instinctive knot tying',
'Connection to bridge builder seed for lashing structures',
'Full installation: ten-knot interactive tying tutorial'
],finalState:'sapling',connections:[81,88,91]},

{seedId:93,name:'The Fire Starter',iterations:[
'Bow drill components: spindle, fireboard, socket, bow',
'Spindle speed control: RPM affects friction heat',
'Downward pressure slider: more pressure means more heat',
'Temperature gauge climbing toward 800F ignition point',
'Tinder dryness factor: wet tinder never catches',
'Hand drill variant: harder, requires more technique',
'Fire plow: oldest method, simplest tools',
'Combustion chemistry: fuel plus oxygen plus heat equals fire',
'Connection to charcoal sketch seed for fire-to-art pipeline',
'Full installation: three-method friction fire physics simulator'
],finalState:'sapling',connections:[5,43,91]},

{seedId:94,name:'The Map Maker',iterations:[
'Elevation data points scattered on virtual terrain',
'Contour line algorithm: connect equal elevations',
'40-foot interval spacing standard for USGS quads',
'Ridgelines emerge: contours form V shapes pointing downhill',
'Valleys: contours V uphill, streams flow in the V',
'Saddles: hourglass shape between two peaks',
'Slope steepness: tight contours mean steep terrain',
'Foxy as cartographer: seeing terrain as it actually is',
'Connection to trail builder seed for route planning',
'Full installation: topographic map creation from raw elevation data'
],finalState:'old-growth',connections:[27,34,88]},

{seedId:95,name:'The Weather Station',iterations:[
'Anemometer: cups spin to measure wind speed',
'Rain gauge: collection funnel with graduated cylinder',
'Thermometer: mercury column with daily high and low',
'Hygrometer: wet and dry bulb for humidity calculation',
'Barometer: pressure trend over 24 hours',
'Data logger: accumulates a simulated year of readings',
'Pattern recognition: when does it rain, when does wind blow',
'Climate vs weather: short-term noise vs long-term signal',
'Connection to barometer seed for pressure forecasting',
'Full installation: five-instrument virtual weather station'
],finalState:'sapling',connections:[6,25,86]},

{seedId:96,name:'The Circuit Board',iterations:[
'Battery and LED: simplest complete circuit',
'Resistor as fallen log: impedes current flow',
'Capacitor as beaver pond: stores charge, releases later',
'Inductor as coiled root: resists change in current',
'Ohms law calculator: V=IR demonstrated interactively',
'Series vs parallel circuits: brightness comparison',
'AM radio build: tuning circuit from inductor and capacitor',
'Marten signal relay analogy: biological circuit in fur',
'Connection to logic gates seed for digital electronics',
'Full installation: forest-metaphor electronic circuit simulator'
],finalState:'old-growth',connections:[8,20,30]},

// ═══ GROVE 7: THE COMMONS (97-112) ═══
{seedId:97,name:'The Potlatch Circle',iterations:[
'Starting resources distributed among 8 participants',
'Give button: transfer resource to another participant',
'Status meter rises with generosity, falls with hoarding',
'Reciprocity tracking: gifts received increase your store',
'Community health meter: collective wellbeing score',
'Hoarding penalty: held resources lose value over time',
'Madrone analogy: sheds bark continuously, keeps growing',
'Historical potlatch: wealth distribution across millennia',
'Connection to ethics compass seed for gift economy philosophy',
'Full installation: multi-round gift economy simulation'
],finalState:'old-growth',connections:[65,70,102]},

{seedId:98,name:'The Story Circle',iterations:[
'Empty story with opening prompt: Once upon a forest...',
'Add-a-sentence mechanic: each visitor contributes one line',
'Story branches when contradictions arise',
'Some threads die out, others grow into epics',
'Character tracking: who appears in the narrative',
'Willow trunk analogy: all branches from same root',
'Oral tradition mechanics: stories evolve through retelling',
'Collaborative emergence: nobody plans the whole story',
'Connection to dream journal seed for narrative symbolism',
'Full installation: crowd-sourced branching forest story builder'
],finalState:'sapling',connections:[76,56,127]},

{seedId:99,name:'The Totem Reader',iterations:[
'Single totem pole displayed with five figures',
'Click bottom figure: Frog connects to underworld',
'Middle figures: Bear holds family crest',
'Upper figures: Eagle watches from above',
'Top figure: Raven who brought light to the world',
'Read from bottom to top: each pole is a library',
'Heraldic meaning: specific rights encoded in figures',
'Protocol: who may carve, who may display which figures',
'Connection to regalia gallery seed for ceremonial arts',
'Full installation: PNW totem pole symbolism reader with five poles'
],finalState:'sapling',connections:[37,104,110]},

{seedId:100,name:'The Canoe Journey',iterations:[
'Salish Sea map with 12 nation territories marked',
'Launch from one shore: canoe animation begins',
'First landing: protocol exchange with host nation',
'Trade goods exchanged: what each nation offers',
'Language sample: greeting in local language played',
'Five more landings through the archipelago',
'Historical context: 10,000 years of maritime culture',
'Chinook current analogy: the water carries you between peoples',
'Connection to language map seed for linguistic context',
'Full installation: interactive Salish Sea canoe journey with 8 stops'
],finalState:'old-growth',connections:[16,22,56]},

{seedId:101,name:'The Language Map',iterations:[
'PNW map with language family boundaries drawn',
'Salishan family: largest territory from coast to plateau',
'Sahaptin family: Columbia plateau region',
'Athabaskan family: southern Oregon and interior BC',
'Click a region to hear greeting in that language',
'Speaker count overlay: red for critically endangered',
'Some languages: fewer than 10 fluent speakers remain',
'Revitalization efforts: immersion schools, digital archives',
'Connection to place names seed for linguistic geography',
'Full installation: PNW Indigenous language family explorer with audio'
],finalState:'sapling',connections:[31,105,112]},

{seedId:102,name:'The Trade Network',iterations:[
'Eulachon: tiny fish rendered into grease, most valuable commodity',
'Grease trail routes mapped from coast to interior',
'Trade mechanic: exchange grease for obsidian at station',
'Shell currency: dentalium from Vancouver Island coast',
'Dried salmon: protein that travels well over mountain passes',
'Copper: prestige item from northern mines',
'Network visualization: 50+ trade relationships',
'Economic complexity rivaling Mediterranean trade routes',
'Connection to potlatch seed for exchange philosophy',
'Full installation: precontact PNW trade network simulation game'
],finalState:'old-growth',connections:[56,97,106]},

{seedId:103,name:'The Seasonal Calendar',iterations:[
'Thirteen-month wheel based on PNW phenology',
'January: eagle moon, bald eagles gather at salmon runs',
'February: frog moon, Pacific tree frogs begin chorus',
'Each month tied to observable natural event',
'Migration markers: when species arrive and depart',
'Bloom calendar: which wildflowers appear when',
'Spawning schedule: salmon species by month',
'Owl timekeeping: season not clock determines schedule',
'Connection to first foods seed for harvest calendar',
'Full installation: thirteen-moon PNW ecological calendar'
],finalState:'sapling',connections:[36,106,111]},

{seedId:104,name:'The Star Map',iterations:[
'PNW night sky rendered with major stars',
'Western constellation overlay: Orion, Ursa Major, etc',
'Toggle to Coast Salish constellation stories',
'Orions belt becomes three hunters chasing elk across sky',
'Pleiades become the Hole in the Sky',
'Raven stole the sun: stars are what remained',
'Seasonal rotation: different stories visible in different months',
'Sahaptin and Nez Perce star stories as additional overlays',
'Connection to telescope seed for sky navigation',
'Full installation: dual-tradition PNW star map with seasonal rotation'
],finalState:'sapling',connections:[3,56,99]},

{seedId:105,name:'The Place Names',iterations:[
'Seattle area map with modern English names',
'Toggle to Lushootseed originals: descriptive names',
'Duwamish: the people of the inside, describes geography',
'Tacoma: the mountain, refers to Rainier directly',
'Puyallup: generous people, describes community character',
'Every colonial name replaced an older descriptive one',
'The land remembers both names simultaneously',
'Pronunciation guide with audio for Lushootseed words',
'Connection to memory palace seed for place-based learning',
'Full installation: bilingual place name explorer for Seattle region'
],finalState:'sapling',connections:[27,75,101]},

{seedId:106,name:'The Recipe Book',iterations:[
'Spring tab: fiddleheads, nettles, eulachon first catch',
'Summer tab: salmonberries, camas bulbs, sockeye salmon',
'Fall tab: acorns, venison, chanterelle mushrooms',
'Winter tab: dried salmon, root vegetables, herbal teas',
'Each food linked to species page and habitat zone',
'Preparation methods: traditional techniques documented',
'Bear knowledge comparison: instinctive seasonal eating',
'Food preservation: smoking, drying, pit-cooking methods',
'Connection to seasonal calendar seed for harvest timing',
'Full installation: four-season PNW traditional recipe explorer'
],finalState:'sapling',connections:[85,102,111]},

{seedId:107,name:'The Medicine Wheel',iterations:[
'Four-direction circle: East, South, West, North',
'East: spring, beginnings, vision, yellow quadrant',
'South: summer, growth, trust, red quadrant',
'West: autumn, harvest, reflection, black quadrant',
'North: winter, wisdom, rest, white quadrant',
'Shared pattern across many PNW nations noted respectfully',
'Cyclical thinking vs linear time: wheel keeps turning',
'Hemlock stands at true north: the anchor of the system',
'Connection to shadow sundial seed for directional awareness',
'Full installation: four-direction teaching framework explorer'
],finalState:'sapling',connections:[36,70,103]},

{seedId:108,name:'The Clan System',iterations:[
'Orca pod structure: matrilineal, grandmother leads',
'Family tree diagram with matrilineal descent tracked',
'Moiety system: Raven and Eagle divide communities',
'Marriage rules: marry outside your moiety for diversity',
'Kinship terminology: different words for maternal vs paternal',
'Ecological logic: kinship mirrors ecosystem diversity needs',
'Comparison to European patrilineal default assumptions',
'Social ecology: structured relationships maintain balance',
'Connection to empathy bridge seed for perspective-taking',
'Full installation: PNW kinship structure interactive diagram'
],finalState:'old-growth',connections:[26,74,114]},

{seedId:109,name:'The Treaty Map',iterations:[
'PNW map circa 1850: pre-treaty territorial boundaries',
'Medicine Creek Treaty 1854: first Stevens treaty overlay',
'Point Elliott Treaty 1855: central Puget Sound nations',
'Ceded lands vs reserved lands comparison',
'What was promised in treaty language vs what was delivered',
'Modern tribal boundaries overlaid on historical',
'Fishing rights: Boldt Decision 1974 restoring treaty rights',
'Sturgeon perspective: 200 million years predating all treaties',
'Connection to trolley problem seed for justice framework',
'Full installation: historical treaty boundary overlay map'
],finalState:'old-growth',connections:[65,100,126]},

{seedId:110,name:'The Regalia Gallery',iterations:[
'Button blanket: wool with mother-of-pearl button designs',
'Cedar bark regalia: harvested, stripped, woven ceremonial wear',
'Woven hat: cedar and spruce root, specific to rank',
'Carved mask: red cedar, represents lineage crest figure',
'Hawk feathers: earned not taken, protocol strictly observed',
'Each piece carries lineage, right, and story',
'Gallery explains what can be shared and what cannot',
'Cultural protocol: viewing vs reproduction vs ownership distinctions',
'Connection to weaving loom seed for textile techniques',
'Full installation: respectful PNW ceremonial art documentation'
],finalState:'sapling',connections:[37,45,99]},

{seedId:111,name:'The First Foods',iterations:[
'Spring: first salmon ceremony opens the fishing season',
'Protocol: gratitude expressed before consumption begins',
'Summer: berry gathering ceremonies mark abundance season',
'Fall: root digging with songs for the earth',
'Each food species has its own ceremony of thanks',
'Crab arrives with the tide: you gather what is given',
'Food sovereignty: right to harvest traditional foods',
'Seasonal calendar integration with phenological markers',
'Connection to recipe book seed for preparation methods',
'Full installation: seasonal harvest ceremony calendar'
],finalState:'sapling',connections:[103,106,112]},

{seedId:112,name:'The Welcome Protocol',iterations:[
'Visitor arrives at territory boundary marker',
'Host nation sends designated welcomer forward',
'Opening song: establishes peaceful intent',
'Speeches: host introduces visitors to land and ancestors',
'Gift exchange: establishes reciprocal relationship',
'Feast: sharing food seals the welcome',
'Willow metaphor: arms open, shade offered, water shared',
'Protocol order matters: relationship before business',
'Connection to potlatch seed for exchange ceremonies',
'Full installation: PNW welcome protocol step-by-step guide'
],finalState:'seedling',connections:[72,97,101]},

// ═══ GROVE 8: THE FRONTIER (113-128) ═══
{seedId:113,name:'The Climate Model',iterations:[
'Baseline PNW climate: temperature and precipitation normals',
'RCP 4.5 scenario: moderate emissions, 2050 projection',
'RCP 8.5 scenario: high emissions, worst case comparison',
'Snowpack decrease: percent reduction by decade',
'Fire season lengthening: days per year of high risk',
'Species range shifts: subalpine moves upslope 300m',
'Glacier retreat: volume loss by decade to 2100',
'Adaptation planning: what communities can do now',
'Connection to statistics meadow seed for projection uncertainty',
'Full installation: three-scenario PNW climate projection tool'
],finalState:'old-growth',connections:[5,25,124]},

{seedId:114,name:'The Rewilding Simulator',iterations:[
'Cascade ecosystem without wolves: baseline measurement',
'Reintroduce wolves: immediate elk behavior change',
'Elk avoid riparian zones: willows recover along streams',
'Songbird populations increase with restored riparian habitat',
'Beaver return to recovered streams: wetland expansion',
'Remove wolves: cascade reverses over 5-10 year period',
'Keystone predator concept: small population, outsized effect',
'Historical: Yellowstone wolf reintroduction as case study',
'Connection to population graph installation for dynamics',
'Full installation: trophic cascade rewilding simulator with 8 species'
],finalState:'old-growth',connections:[24,108,122]},

{seedId:115,name:'The Mesh Network',iterations:[
'PNW terrain map with ridgeline high points marked',
'Place first relay node on a ridge: coverage circle shown',
'Second node: line-of-sight link established',
'Message routing: packet hops between connected nodes',
'Node failure: rerouting through redundant paths',
'Coverage gap analysis: where dead zones remain',
'Marten signal relay: biological mesh network comparison',
'Practical: Wi-Fi, LoRa, cellular mesh protocols',
'Connection to circuit board seed for electronic fundamentals',
'Full installation: PNW terrain mesh network designer'
],finalState:'old-growth',connections:[20,22,62]},

{seedId:116,name:'The Mycelium Internet',iterations:[
'Single tree with root system visible below ground',
'Mycorrhizal fungus connects to root: first link established',
'Second tree connected through shared fungal network',
'Nutrient signal: stressed tree receives carbon from neighbor',
'Distress chemical: insect attack warning propagates through network',
'Resource sharing: mother tree feeds seedlings via mycelium',
'Network topology: hub trees with most connections identified',
'Wood Wide Web mapping: visualize entire forest floor network',
'Connection to composting seed for decomposition networks',
'Full installation: forest mycorrhizal network designer and simulator'
],finalState:'old-growth',connections:[4,21,87]},

{seedId:117,name:'The Seed Vault',iterations:[
'3500 PNW plant species listed: you have 50 storage slots',
'Genetic diversity filter: prioritize unique genomes',
'Keystone function filter: species that support many others',
'Cultural significance filter: species central to traditions',
'Aesthetic value: beauty as a conservation criterion debated',
'Pika cache comparison: same triage at smaller scale',
'Svalbard Global Seed Vault as real-world model',
'Criteria weighting: which values matter most to you',
'Connection to ark seed for animal conservation parallel',
'Full installation: 50-slot conservation prioritization exercise'
],finalState:'sapling',connections:[78,121,125]},

{seedId:118,name:'The Terraform Garden',iterations:[
'Bare soil after landslide: starting from zero',
'Pioneer species planted: alder fixes nitrogen in soil',
'Five years later: grass and shrub colonization',
'Nurse log introduced: dead tree becomes seedling nursery',
'Mycorrhizal fungi inoculation: network begins forming',
'Decade marker: first conifers establish among alders',
'Century marker: closed canopy forest developing',
'Fire clears for renewal: cyclical succession continues',
'Connection to decomposition clock installation for decay timeline',
'Full installation: multi-century ecological succession restorer'
],finalState:'old-growth',connections:[87,90,126]},

{seedId:119,name:'The Generation Ship',iterations:[
'Sealed system requirements: atmosphere, food, water, waste processing',
'Atmosphere recycling: plants convert CO2 to O2',
'Food production: hydroponic gardens in artificial light',
'Waste decomposition: composting closes the nutrient loop',
'Water cycling: evaporation, condensation, purification',
'Energy budget: solar panels at departure, fusion mid-journey',
'PNW forest as existing model: already solves these problems',
'Octopus tide pool analogy: sealed system anchored to rock',
'Connection to greenhouse seed for enclosed ecosystem management',
'Full installation: closed-loop life support system designer'
],finalState:'old-growth',connections:[15,85,87]},

{seedId:120,name:'The Time Capsule',iterations:[
'Ten empty slots: choose what to preserve for the future',
'Slot 1: a sound from the current forest',
'Slot 2: a species name and its population status',
'Slot 3: a word in a PNW Indigenous language',
'Slot 4: a traditional recipe with ingredients list',
'Slot 5: a measurement of current conditions (CO2, temp, pH)',
'Remaining slots: song, tool, seed, story, question',
'Glacier as natural time capsule: every layer is a year',
'Connection to letter to the future seed for legacy writing',
'Full installation: ten-item time capsule curation exercise'
],finalState:'seedling',connections:[10,66,127]},

{seedId:121,name:'The Coral Calculator',iterations:[
'Atmospheric CO2 slider starting at pre-industrial 280 ppm',
'Ocean pH calculated from atmospheric CO2 equilibrium',
'At pH 8.1: healthy conditions, all species present',
'At pH 7.8: pteropod shells begin dissolving',
'At pH 7.6: juvenile oyster shell formation fails',
'Star tide pool shifts from garden to barren rock',
'Carbonate chemistry: CO2 plus water equals carbonic acid',
'Aragonite saturation state as key threshold',
'Connection to ice core installation for historical CO2 data',
'Full installation: ocean acidification impact calculator'
],finalState:'sapling',connections:[15,113,117]},

{seedId:122,name:'The Migration Tracker',iterations:[
'PNW map with current species range boundaries',
'Temperature increase slider: 1C to 4C warming scenarios',
'Alpine species range shifts upslope with warming',
'Southern species arriving: madrone replacing hemlock range',
'Phenological mismatch: birds arrive before insects hatch',
'Goose flyway: same ancient route, shifted calendar',
'Documented range shifts from the last 30 years',
'Adaptation vs extinction threshold for each species',
'Connection to climate model seed for scenario context',
'Full installation: species range shift projector under warming'
],finalState:'sapling',connections:[16,53,114]},

{seedId:123,name:'The Renewable Grid',iterations:[
'PNW map with energy resource zones marked',
'Hydro: Columbia River dams, largest renewable source',
'Wind: coastal and Columbia Gorge high-wind zones',
'Solar: east of Cascades where sun is reliable',
'Tidal: Puget Sound and outer coast tidal energy',
'Geothermal: volcanic zone near Mt Hood, Newberry',
'Supply-demand balancer: seasonal mismatch visualization',
'Storage solutions: pumped hydro, batteries, hydrogen',
'Connection to wind turbine and solar tracker seeds',
'Full installation: regional renewable energy grid designer'
],finalState:'old-growth',connections:[83,84,115]},

{seedId:124,name:'The Forest in 2100',iterations:[
'Current forest walk: hemlock, cedar, Douglas fir dominant',
'Optimistic scenario: 1.5C warming, species persist with shifts',
'Moderate scenario: 2.5C, hemlock retreats to higher elevations',
'Pessimistic scenario: 4C, oak and madrone replace conifers',
'Same trails walked in each scenario for comparison',
'Understory changes: fern replaced by drought-tolerant shrubs',
'Fire regime: more frequent, more intense under warming',
'What persists across all scenarios: the trails themselves',
'Connection to climate model seed for driving projections',
'Full installation: four-scenario future forest walkthrough'
],finalState:'old-growth',connections:[3,113,118]},

{seedId:125,name:'The Ark',iterations:[
'Complete PNW species list: thousands of candidates',
'Budget: only 100 slots available, choose wisely',
'Keystone species filter: salmon, beaver, mycorrhizal fungi',
'Pollinator priority: native bees, butterflies, hummingbirds',
'Cultural icons: eagle, orca, cedar, salmon',
'Genetic uniqueness: endemic species found nowhere else',
'Overlap analysis: some species serve multiple criteria',
'Eagle overhead view: clear perspective, impossible choices',
'Connection to seed vault seed for plant conservation parallel',
'Full installation: 100-species conservation triage game'
],finalState:'sapling',connections:[78,117,114]},

{seedId:126,name:'The Restoration Plan',iterations:[
'Degraded watershed: dam blocks fish, banks eroded',
'Step 1: remove the dam, reconnect river segments',
'Step 2: replant riparian zones with native willows and alder',
'Step 3: reintroduce beavers for natural dam construction',
'Step 4: reconnect floodplain, allow seasonal flooding',
'Monitor year 10: salmon detected returning upstream',
'Monitor year 25: riparian canopy closing over stream',
'Monitor year 50: old-growth characteristics emerging',
'Connection to beaver dam simulator seed for hydrology',
'Full installation: 50-year watershed restoration planner'
],finalState:'old-growth',connections:[7,82,90]},

{seedId:127,name:'The Letter to the Future',iterations:[
'Blank letter template: Dear future visitor...',
'Prompt 1: what do you want them to know about now',
'Prompt 2: what do you hope they still have',
'Prompt 3: what do you wish we had done differently',
'Prompt 4: what is worth fighting to preserve',
'Prompt 5: what gives you hope despite everything',
'Sitka spruce lives 700 years: your letter outlasts you',
'The seed germinates when the writer is gone',
'Connection to time capsule seed for archival thinking',
'Full installation: guided legacy letter writing exercise'
],finalState:'seedling',connections:[10,98,120]},

{seedId:128,name:'The Campfire',iterations:[
'Empty clearing renders: just darkness and ground',
'Single flame appears at center: procedural fire animation',
'Wood crackle audio cue implied by flickering light',
'Darkness beyond the light circle: unknown territory',
'No instructions load, no widgets appear, no data displayed',
'Visitor count hidden: you are not alone, but you feel alone',
'Staying increases the fire slightly: presence feeds the flame',
'Everything in the forest leads here, everything leaves from here',
'Connection to every other seed: the campfire is the hub',
'Full installation: an empty clearing with a fire, waiting'
],finalState:'seedling',connections:[80,97,112]}

];
