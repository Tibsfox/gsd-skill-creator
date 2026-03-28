/* ═══════════════════════════════════════════════════════════════
   Seed Growth Data Pass 2 — 128 seeds x 10 more iterations (11-20)
   How each seed grew from sapling to old-growth canopy
   Builds on seed-growth.js (iterations 1-10)
   finalState: 'sapling' | 'old-growth' | 'canopy'
   ═══════════════════════════════════════════════════════════════ */

var SEED_GROWTH_2 = [

// ═══ GROVE 1: THE OBSERVATORY (1-16) ═══
{seedId:1,iterations:[
'Multi-pendulum array: 12 pendulums showing wave interference patterns',
'Phase space visualization: position vs velocity plotted in real time',
'Energy conservation overlay: kinetic vs potential shown as bar graph',
'Coupled to seismograph seed: pendulums respond to simulated quakes',
'Damping comparison: air vs oil vs magnetic eddy current braking',
'Foucault mode: 24-hour rotation showing Earth spin at PNW latitude',
'Parametric resonance: pumping energy in at twice natural frequency',
'PNW tidal pendulum: period modulated by gravitational pull of moon',
'Teaching mode: guided experiments with hypothesis-test-conclude flow',
'Full canopy: networked pendulum observatory with 5 experiment tracks'
],finalState:'old-growth'},

{seedId:2,iterations:[
'Spectral fingerprinting: match unknown elements by emission lines',
'Atmospheric absorption bands: why the sky is blue at 47N',
'Doppler shift demo: redshift and blueshift of moving light sources',
'PNW aurora prediction: solar wind energy vs visible spectrum',
'Fluorescence mode: UV excitation of minerals found in Cascadia',
'Leaf pigment analyzer: chlorophyll absorption spectra across seasons',
'Water color decoder: why glacial lakes are turquoise, bogs are brown',
'Stellar classification: OBAFGKM sequence with local star examples',
'Cross-reference to telescope seed for spectroscopic observation',
'Full canopy: multi-mode spectrum lab with 7 analysis tools'
],finalState:'old-growth'},

{seedId:3,iterations:[
'Satellite tracking overlay: ISS, Starlink, polar orbiters in real time',
'Double star finder: binary systems visible from PNW with separation',
'Variable star monitor: Algol, Mira, Cepheids with light curves',
'Lunar phase calculator: rise/set times and illumination at PNW coords',
'Eclipse predictor: next solar and lunar events visible from the Pacific NW',
'Milky Way core visibility calendar: best dates and light pollution maps',
'Comet tracker: orbital elements plotted as they approach perihelion',
'Radio sky overlay: pulsar and hydrogen line positions mapped to optical',
'Astrophotography exposure calculator: ISO, f-stop, and star trail length',
'Full canopy: multi-wavelength sky atlas with observation planner'
],finalState:'old-growth'},

{seedId:4,iterations:[
'Diatom gallery: 50 species from PNW rivers with silica shell patterns',
'Water bear survival simulator: tardigrade stress response experiments',
'Mycorrhizal network tracer: follow nutrient packets through hyphae',
'Root tip growth time-lapse: cell division at the meristem boundary',
'Decomposition timeline: leaf litter to humus over 36 simulated months',
'Soil pH mapper: acidity variation under cedar, alder, and hemlock',
'Nematode taxonomy game: match species to feeding strategy',
'Microplastic detection: identify synthetic fibers in soil samples',
'Cross-reference to chanterelle seed for fungal network deep dive',
'Full canopy: complete soil biome academy with 8 investigation modules'
],finalState:'old-growth'},

{seedId:5,iterations:[
'Thermal imaging overlay: infrared map of forest floor at dawn',
'Albedo comparison: snow vs basalt vs canopy reflectance values',
'Geothermal gradient: temperature increase with depth in Cascadia crust',
'Volcanic heat budget: energy flow from magma chamber to hot spring',
'Urban heat island: Portland vs surrounding forest temperature delta',
'Permafrost thaw model: Arctic feedback loop visualized step by step',
'Ocean thermal layering: thermocline depth in the Northeast Pacific',
'Climate proxy reader: tree ring width as temperature archive',
'Cross-reference to barometer seed for pressure-temperature coupling',
'Full canopy: thermal dynamics explorer with 6 scenario modes'
],finalState:'old-growth'},

{seedId:6,iterations:[
'Jet stream tracker: real-time ridge-trough pattern over the Pacific',
'Atmospheric river simulator: moisture transport from Hawaii to PNW',
'Fog prediction model: marine layer depth vs inversion strength',
'Storm cell anatomy: updraft, downdraft, and precipitation core',
'Snow level calculator: freezing line altitude from sounding data',
'Wind chill and heat index overlays for PNW elevation bands',
'Lightning frequency map: where strikes cluster in the Cascades',
'Climate oscillation dashboard: PDO, ENSO, and AO index history',
'Citizen weather station network: compare your readings to NWS',
'Full canopy: integrated weather intelligence center with forecast game'
],finalState:'old-growth'},

{seedId:7,iterations:[
'Magnitude energy comparison: each whole number = 32x more energy',
'Liquefaction risk map: soil types that amplify shaking in the PNW',
'Tsunami travel time calculator: Cascadia fault to coastal communities',
'Building resonance simulator: match structure period to ground motion',
'Aftershock sequence generator: Bath law and Omori decay modeled',
'Deep tremor tracker: episodic tremor and slip events on Cascadia',
'Paleoseismology layer: turbidite records from ocean cores',
'Early warning timeline: seconds of notice vs epicenter distance',
'Cross-reference to building code seed for structural response',
'Full canopy: seismic hazard assessment tool with scenario planning'
],finalState:'old-growth'},

{seedId:8,iterations:[
'Refraction tank: light bending through water, glass, and diamond',
'Lens formula lab: thin lens equation with virtual image construction',
'Fiber optics simulator: total internal reflection in curved glass',
'Camera obscura room: pinhole projection of PNW landscape scenes',
'Diffraction grating: measuring wavelength from slit interference',
'Polarization filters: cross-polarized stress analysis of plastic',
'Holography basics: reference beam plus object beam interference',
'Adaptive optics: deformable mirror correcting atmospheric turbulence',
'Cross-reference to prism seed for spectral decomposition link',
'Full canopy: geometric optics laboratory with 8 experiment stations'
],finalState:'old-growth'},

{seedId:9,iterations:[
'Solar cell efficiency: IV curves for silicon, thin-film, and perovskite',
'Battery chemistry comparison: lithium-ion vs flow vs solid-state',
'Grid frequency regulation: balancing supply and demand in real time',
'Hydroelectric head calculator: dam height to power output formula',
'Wind farm siting: topographic acceleration and capacity factor maps',
'Tidal energy potential: Bay of Fundy vs Puget Sound comparison',
'Energy storage duration: seconds for capacitors to seasons for hydrogen',
'Embodied energy tracker: manufacturing cost of each generation source',
'Cross-reference to greenhouse seed for carbon intensity per kWh',
'Full canopy: renewable energy planning simulator with grid balancer'
],finalState:'old-growth'},

{seedId:10,iterations:[
'Magnetic field line tracer: dipole and quadrupole configurations',
'Electromagnetic induction: Faraday law with moving coil animation',
'Radio wave propagation: ground wave, sky wave, and line-of-sight',
'Antenna pattern plotter: dipole, yagi, and patch radiation diagrams',
'Magnetic declination map: true north vs magnetic north across PNW',
'Aurora mechanism: solar wind-magnetosphere interaction visualization',
'MRI basics: nuclear magnetic resonance in water molecules explained',
'Geomagnetic reversal timeline: polarity flips in ocean floor basalt',
'Cross-reference to compass seed for navigation applications',
'Full canopy: electromagnetic spectrum explorer with 7 frequency bands'
],finalState:'old-growth'},

{seedId:11,iterations:[
'Ohm law circuit builder: add resistors, measure current and voltage',
'Kirchhoff loops: current conservation at junctions demonstrated',
'Capacitor charge curve: RC time constant with interactive slider',
'Transistor switch: NPN amplifier circuit with gain calculation',
'Logic gate sandbox: build AND, OR, NOT, XOR from transistors',
'Breadboard simulator: drag and drop components with wire routing',
'Oscilloscope view: waveform display for circuit test points',
'PCB layout preview: auto-route traces from schematic capture',
'Cross-reference to radio seed for receiver circuit applications',
'Full canopy: complete electronics workbench with 6 project tracks'
],finalState:'old-growth'},

{seedId:12,iterations:[
'Mechanical advantage calculator: lever, pulley, inclined plane',
'Friction coefficient table: wood on wood, rubber on asphalt, ice',
'Centripetal force demo: spinning bucket water stays inside',
'Projectile trajectory plotter with air resistance toggle',
'Momentum conservation: elastic and inelastic collision simulator',
'Gyroscope precession: angular momentum direction visualization',
'Fluid dynamics: Bernoulli principle with wing cross-section',
'PNW applications: log boom physics, ski jump trajectory, tide mills',
'Cross-reference to pendulum seed for harmonic motion connection',
'Full canopy: classical mechanics playground with 8 sandbox modes'
],finalState:'old-growth'},

{seedId:13,iterations:[
'Periodic table explorer: click element for electron configuration',
'Chemical bond visualizer: ionic, covalent, metallic, hydrogen',
'Reaction balancer: drag coefficients to balance equations',
'pH indicator strips: virtual litmus test for PNW water sources',
'Crystal structure gallery: cubic, hexagonal, monoclinic unit cells',
'Electrochemistry cell: galvanic vs electrolytic with voltage readout',
'PNW geochemistry: mineral composition of Cascade volcanic rocks',
'Atmospheric chemistry: ozone formation and destruction cycle',
'Cross-reference to microscope seed for molecular visualization',
'Full canopy: interactive chemistry lab with 7 experiment benches'
],finalState:'old-growth'},

{seedId:14,iterations:[
'Cloud chamber simulator: particle tracks from cosmic rays',
'Nuclear decay chains: uranium to lead with half-life timeline',
'Fusion energy balance: deuterium-tritium reaction cross-section',
'Particle zoo gallery: quarks, leptons, and bosons with properties',
'Wave-particle duality: double slit experiment with single photons',
'Heisenberg uncertainty demo: position vs momentum measurement',
'Quantum tunneling: probability wave through potential barrier',
'PNW connection: TRIUMF cyclotron and Hanford legacy sites',
'Cross-reference to prism seed for photon energy calculations',
'Full canopy: particle physics explorer with Standard Model guide'
],finalState:'old-growth'},

{seedId:15,iterations:[
'Hubble expansion: galaxy recession velocity vs distance plot',
'Cosmic microwave background: temperature map of the early universe',
'Dark matter rotation curves: observed vs predicted galaxy spin',
'Gravitational lensing: mass bending light around galaxy clusters',
'Stellar lifecycle: main sequence to red giant to white dwarf path',
'Neutron star density comparison: teaspoon weighs a billion tons',
'Black hole anatomy: event horizon, ergosphere, accretion disk',
'Multiverse speculation: landscape of string theory vacua mapped',
'Cross-reference to telescope seed for deep sky observations',
'Full canopy: cosmology timeline from Big Bang to heat death'
],finalState:'old-growth'},

{seedId:16,iterations:[
'Genetic code table: 64 codons mapped to 20 amino acids',
'DNA replication animation: helicase, primase, polymerase assembly',
'CRISPR mechanism: guide RNA finding and cutting target sequence',
'Phylogenetic tree: PNW salmon species divergence over millions of years',
'Epigenetics overlay: methyl groups silencing genes in response to stress',
'Population genetics: Hardy-Weinberg equilibrium with drift simulator',
'Gene expression heatmap: tissue-specific activation patterns',
'Ancient DNA: woolly mammoth genome fragments found in permafrost',
'Cross-reference to microscope seed for cellular visualization',
'Full canopy: molecular biology workstation with 6 investigation tools'
],finalState:'old-growth'},

// ═══ GROVE 2: THE LIBRARY (17-32) ═══
{seedId:17,iterations:[
'Dewey Decimal navigator: browse the classification tree interactively',
'Citation graph: follow references forward and backward through papers',
'Open access finder: locate free versions of paywalled research',
'PNW special collections: digitized field notebooks from early surveys',
'Reading speed tracker: words per minute with comprehension questions',
'Annotation layer: highlight, tag, and link passages across documents',
'Bibliography generator: format citations in APA, MLA, Chicago',
'Research methodology guide: experimental design decision tree',
'Cross-reference to knowledge seed for information literacy skills',
'Full canopy: personal research library with discovery engine'
],finalState:'old-growth'},

{seedId:18,iterations:[
'Map projection comparison: Mercator, Robinson, equal-area side by side',
'Contour line reader: translate topographic lines to 3D terrain',
'GPS triangulation demo: three satellite signals fix a position',
'PNW watershed boundaries: HUC-12 drainage divides on interactive map',
'Geological map layers: bedrock, surficial deposits, fault traces',
'Fire history overlay: burn perimeters from 1900 to present',
'Trail difficulty calculator: elevation gain, distance, exposure rating',
'Orienteering course: navigate between control points using map and compass',
'Cross-reference to compass seed for navigation fundamentals',
'Full canopy: geographic information system with 8 data layers'
],finalState:'old-growth'},

{seedId:19,iterations:[
'Timeline ruler: drag events onto a calibrated historical axis',
'Parallel civilizations view: PNW cultures alongside global events',
'Primary source reader: interpret historical documents with context',
'Oral history recorder: template for structured interview collection',
'Archaeological site mapper: artifact distribution and stratigraphy',
'Trade route tracer: obsidian, dentalium, and eulachon grease paths',
'Climate history overlay: Little Ice Age, Medieval Warm Period effects',
'Demographic transition: population curves for PNW communities',
'Cross-reference to salmon seed for First Peoples fishery management',
'Full canopy: multimedia history workstation with 7 source types'
],finalState:'old-growth'},

{seedId:20,iterations:[
'Vocabulary builder: PNW ecology terms with spaced repetition',
'Etymology explorer: trace word origins through language families',
'Place name atlas: Indigenous, Spanish, French, English layers on PNW map',
'Scientific nomenclature decoder: Latin and Greek roots in species names',
'Writing workshop: nature journaling prompts with sentence frameworks',
'Poetry generator: syllable patterns and meter from natural rhythms',
'Translation comparison: same passage in Lushootseed, Chinook Jargon, English',
'Field guide language: how to write clear species descriptions',
'Cross-reference to knowledge seed for communication patterns',
'Full canopy: language arts studio with 6 creative writing modes'
],finalState:'old-growth'},

{seedId:21,iterations:[
'Fractal generator: Mandelbrot and Julia sets with zoom and colormap',
'Golden ratio finder: spiral overlays on PNW shells, ferns, and pinecones',
'Fibonacci sequence in nature: seed head counts and branching patterns',
'Tessellation workshop: create Escher-style tilings from simple shapes',
'Topology playground: Mobius strips, Klein bottles, knot classification',
'Graph theory sandbox: Euler paths, minimum spanning trees, coloring',
'Probability simulator: Monte Carlo estimation of pi with random darts',
'Chaos theory: Lorenz attractor sensitivity to initial conditions',
'Cross-reference to pendulum seed for dynamical systems connection',
'Full canopy: mathematical visualization gallery with 9 interactive exhibits'
],finalState:'old-growth'},

{seedId:22,iterations:[
'Logical syllogism builder: construct valid arguments from premises',
'Fallacy detector: identify 15 common reasoning errors in passages',
'Thought experiment gallery: trolley problem, ship of Theseus, Chinese room',
'Ethics framework comparison: deontological, consequentialist, virtue',
'Philosophy of science: Popper falsification, Kuhn paradigm shifts',
'Mind-body problem: dualism, physicalism, functionalism explained',
'Environmental ethics: deep ecology, land ethic, rights of nature',
'PNW Indigenous philosophy: relational ontology and place-based knowing',
'Cross-reference to knowledge seed for epistemology foundations',
'Full canopy: philosophy seminar room with Socratic dialogue engine'
],finalState:'old-growth'},

{seedId:23,iterations:[
'Chord progression player: I-IV-V-I and ii-V-I with voicing options',
'Scale explorer: major, minor, pentatonic, blues mapped to keyboard',
'Rhythm pattern library: 4/4, 3/4, 6/8, odd meters with click track',
'Frequency ratio table: just intonation vs equal temperament comparison',
'Instrument family tree: evolution from ancient to modern forms',
'Song structure analyzer: verse, chorus, bridge patterns in popular music',
'PNW acoustic ecology: dawn chorus, rain percussion, river white noise',
'Spectrogram viewer: visualize birdsong as frequency over time',
'Cross-reference to musical forest for muse instrument connections',
'Full canopy: music theory studio with composition and analysis tools'
],finalState:'old-growth'},

{seedId:24,iterations:[
'Color wheel mixer: additive and subtractive color theory interactive',
'Perspective grid: one-point, two-point, three-point construction lines',
'Composition templates: rule of thirds, golden section, dynamic symmetry',
'Art history timeline: cave paintings to digital art with PNW examples',
'Texture library: bark rubbings, leaf prints, stone patterns digitized',
'Light and shadow: chiaroscuro technique with adjustable light source',
'PNW art traditions: formline design, basket weaving patterns, totem styles',
'Digital art toolkit: brushes, layers, blend modes for nature illustration',
'Cross-reference to art trail for installation design patterns',
'Full canopy: multimedia art studio with 8 creative workspaces'
],finalState:'old-growth'},

{seedId:25,iterations:[
'Narrative arc plotter: exposition, rising action, climax, resolution',
'Character sheet builder: traits, motivations, relationships mapped',
'World-building checklist: geography, history, culture, technology layers',
'Dialogue workshop: tag variations, subtext, pacing exercises',
'Point of view comparison: first, second, third limited, omniscient',
'Genre conventions guide: mystery, sci-fi, fantasy, literary fiction',
'PNW storytelling traditions: Coyote tales, transformation stories',
'Revision toolkit: sentence-level editing, scene restructuring, pacing',
'Cross-reference to stories seed for campfire narrative patterns',
'Full canopy: creative writing workshop with 7 craft modules'
],finalState:'old-growth'},

{seedId:26,iterations:[
'Boolean search builder: AND, OR, NOT with Venn diagram visualization',
'Database query designer: SELECT, JOIN, WHERE with sample datasets',
'Algorithm visualizer: sorting, searching, and graph traversal animated',
'Data structure explorer: arrays, trees, hash maps with operations',
'Encryption demo: Caesar cipher to AES with plaintext comparison',
'Network protocol layers: OSI model packet encapsulation walkthrough',
'Version control timeline: commits, branches, merges visualized as graph',
'PNW tech history: early internet nodes, submarine cable landing sites',
'Cross-reference to radio seed for digital communication fundamentals',
'Full canopy: computer science fundamentals lab with 8 topics'
],finalState:'old-growth'},

{seedId:27,iterations:[
'Supply and demand curves: drag sliders to find equilibrium price',
'GDP components: consumption, investment, government, net exports',
'Inflation calculator: purchasing power change over decades',
'Trade balance visualization: import and export flows between regions',
'PNW economic sectors: timber, tech, agriculture, fisheries, tourism',
'Cooperative economics: how mutual aid structures differ from corporate',
'Commons management: Ostrom principles applied to PNW fisheries',
'Circular economy mapper: waste streams becoming resource inputs',
'Cross-reference to building seed for construction economics',
'Full canopy: economic literacy dashboard with 7 interactive models'
],finalState:'old-growth'},

{seedId:28,iterations:[
'Solar system scale model: AU distances with zoom from Sun to Oort cloud',
'Kepler orbit simulator: eccentricity, period, and area swept per time',
'Rocket equation calculator: delta-v, specific impulse, mass ratio',
'Space environment: radiation, microgravity, thermal vacuum explained',
'Mars mission planner: Hohmann transfer window calculator',
'Satellite constellation designer: coverage area vs orbit altitude',
'Space debris tracker: collision probability and Kessler syndrome model',
'PNW connections: JPL missions, SpaceX Starship tests, Canadian arm',
'Cross-reference to telescope seed for ground-based observation support',
'Full canopy: space exploration mission designer with 6 scenario modes'
],finalState:'old-growth'},

{seedId:29,iterations:[
'Nutrition label reader: parse macronutrients and daily value percentages',
'Calorie balance simulator: intake vs expenditure with activity levels',
'Immune system animation: innate and adaptive response to pathogen',
'Heart rate zones: aerobic, anaerobic, and recovery with age adjustment',
'Sleep architecture: REM, deep, and light sleep cycles over 8 hours',
'First aid decision tree: assess, act, and alert for common emergencies',
'PNW outdoor health: hypothermia prevention, altitude sickness, sun safety',
'Mental health toolkit: stress response, coping strategies, when to seek help',
'Cross-reference to salmon seed for omega-3 nutritional pathways',
'Full canopy: health science center with 8 self-assessment tools'
],finalState:'old-growth'},

{seedId:30,iterations:[
'Governance structures: direct democracy, representative, consensus models',
'Constitutional comparison: US, Canadian, and tribal sovereignty frameworks',
'Treaty timeline: PNW treaties with Indigenous nations, terms and outcomes',
'Voting system simulator: plurality, ranked-choice, approval, proportional',
'Budget allocation game: distribute public funds across priorities',
'Media literacy checklist: identify bias, check sources, verify claims',
'Civic engagement toolkit: how to attend, speak at, and follow public meetings',
'PNW governance: tribal councils, county commissions, port authorities',
'Cross-reference to trust seed for web-of-trust governance patterns',
'Full canopy: civics education center with 7 participatory exercises'
],finalState:'old-growth'},

{seedId:31,iterations:[
'Cognitive bias catalog: 30 biases with examples and counter-strategies',
'Memory model: working memory capacity, chunking, and retrieval cues',
'Perception illusions: 20 optical and auditory illusions explained',
'Learning styles myth: evidence-based study techniques that actually work',
'Emotional regulation: amygdala hijack, prefrontal override, grounding',
'Social psychology: conformity, obedience, bystander effect experiments',
'Developmental milestones: cognitive, social, and motor across lifespan',
'PNW research: UW psychology department contributions to the field',
'Cross-reference to philosophy seed for consciousness studies',
'Full canopy: psychology exploration lab with 8 interactive experiments'
],finalState:'old-growth'},

{seedId:32,iterations:[
'Kinematic equation solver: displacement, velocity, acceleration, time',
'Force diagram builder: draw free-body diagrams with auto-calculation',
'Torque and rotation: angular acceleration with moment of inertia',
'Work-energy theorem: net work equals change in kinetic energy demo',
'Elastic potential energy: spring constant and compression visualized',
'Power delivery: watts, horsepower, and efficiency in real machines',
'Friction and drag: terminal velocity of falling objects in PNW rain',
'Impulse and momentum: airbag design optimization challenge',
'Cross-reference to mechanics seed for advanced applications',
'Full canopy: dynamics problem solver with step-by-step solutions'
],finalState:'old-growth'},

// ═══ GROVE 3: THE STUDIO (33-48) ═══
{seedId:33,iterations:[
'Color temperature guide: warm candlelight to cool daylight in Kelvin',
'Shadow mapping: sun angle calculator for any PNW location and date',
'Reflected light: how forest canopy creates green-tinted fill light',
'Backlighting techniques: silhouettes of old-growth trees at sunset',
'Golden hour tracker: exact times for optimal warm light at latitude 47N',
'Fog as diffuser: how marine fog creates perfectly even illumination',
'Firelight simulation: flickering warm tones for campfire scenes',
'Underwater light: how wavelengths filter with depth in PNW waters',
'Cross-reference to prism seed for wavelength and perception link',
'Full canopy: lighting design studio with 8 scene presets'
],finalState:'old-growth'},

{seedId:34,iterations:[
'Clay pinch pot guide: start from a ball, form walls with thumb pressure',
'Coil building technique: stack and smooth clay ropes into vessels',
'Slab construction: cut flat sheets, score and slip to join',
'Glaze chemistry basics: silica, flux, alumina triangle explained',
'Kiln temperature profiles: bisque, stoneware, and porcelain curves',
'PNW clay sources: glacial deposits, riverbank clay, volcanic ash bodies',
'Raku firing: thermal shock reduction techniques for crackle glazes',
'Functional vs sculptural: design constraints for cups, bowls, art pieces',
'Cross-reference to geology seed for mineral composition of clays',
'Full canopy: ceramics workshop with 7 technique tutorials'
],finalState:'old-growth'},

{seedId:35,iterations:[
'Loom warping guide: calculate thread count and pattern repeat width',
'Tabby weave fundamentals: over-under plain weave structure',
'Twill patterns: 2/2, 3/1, herringbone, and diamond variations',
'Natural dye recipes: PNW plants for color — alder bark, Oregon grape, lichen',
'Fiber preparation: washing, carding, spinning raw wool from PNW sheep',
'Pattern drafting: translate design to threading and treadling notation',
'Tapestry techniques: weft-faced pictorial weaving methods',
'Basket weaving connection: coiled, twined, and plaited PNW traditions',
'Cross-reference to art seed for textile design principles',
'Full canopy: fiber arts studio with 8 project patterns'
],finalState:'old-growth'},

{seedId:36,iterations:[
'Darkroom timer: enlarger exposure calculator with test strip guide',
'Film speed comparison: grain size and sensitivity tradeoffs visualized',
'Zone system: Ansel Adams 10-zone exposure with PNW landscape examples',
'Digital sensor basics: pixel size, dynamic range, and noise at high ISO',
'Macro photography: magnification ratios and depth-of-field calculator',
'Astrophotography settings: star trail vs point-source exposure times',
'Infrared photography: false-color images of PNW forest canopy',
'Photo editing workflow: raw processing, color correction, output sharpening',
'Cross-reference to optics seed for lens physics fundamentals',
'Full canopy: photography school with 8 technique modules'
],finalState:'old-growth'},

{seedId:37,iterations:[
'Dovetail joint anatomy: pin and tail layout with angle calculator',
'Mortise and tenon: proportions, shoulder cuts, and drawbore pinning',
'Wood grain orientation: why flat-sawn cups and quarter-sawn resists warp',
'PNW wood species guide: cedar, fir, maple, alder working properties',
'Hand plane setup: blade angle, chip breaker, mouth opening adjustment',
'Japanese joinery: through-wedged tenons and butterfly keys',
'Steam bending: curve radius limits for different species and thickness',
'Finishing comparison: oil, varnish, shellac, lacquer durability and feel',
'Cross-reference to beaver seed for natural wood engineering parallels',
'Full canopy: woodworking fundamentals course with 8 project plans'
],finalState:'old-growth'},

{seedId:38,iterations:[
'Knit stitch anatomy: front loop, back loop, yarn over mechanics',
'Cable patterns: 2-stitch twist to 8-stitch braid with chart reading',
'Gauge calculator: needle size and yarn weight to finished dimensions',
'Colorwork techniques: stranded, intarsia, and mosaic knitting compared',
'Sock architecture: heel turn options — short row, flap, afterthought',
'Shaping math: increase and decrease rates for custom garment fit',
'Blocking methods: wet, steam, and spray for different fibers',
'PNW wool sourcing: local sheep breeds and fiber characteristics',
'Cross-reference to weaving seed for textile structure comparisons',
'Full canopy: knitting pattern studio with 7 technique tutorials'
],finalState:'old-growth'},

{seedId:39,iterations:[
'Print preparation: image resolution, bleed, and color profile setup',
'Letterpress basics: type lockup, ink distribution, impression depth',
'Screen printing: emulsion coating, exposure, and registration marks',
'Risograph layer separation: spot color planning for overprint effects',
'Bookbinding methods: perfect bind, saddle stitch, coptic, Japanese stab',
'Paper selection guide: weight, texture, opacity for different uses',
'PNW print shops: history of small press publishing in the Pacific NW',
'Zine layout templates: fold patterns for 8-page, 16-page, and accordion',
'Cross-reference to typography seed for font selection and pairing',
'Full canopy: print production studio with 8 technique demonstrations'
],finalState:'old-growth'},

{seedId:40,iterations:[
'Vocal warm-up sequence: lip trills, sirens, and resonance placement',
'Breath support mechanics: diaphragm engagement and air column control',
'Harmony singing: thirds, sixths, and octave doubling with pitch guide',
'Vocal percussion: basic beatbox patterns for rhythm section filling',
'Microphone technique: proximity effect, off-axis rejection, pop shields',
'Recording environment: room treatment for voice capture in small spaces',
'PNW vocal traditions: work songs, protest songs, camp songs, whale songs',
'Vocal health: hydration, rest, warm-up and cool-down protocols',
'Cross-reference to birdsong seed for natural vocalization patterns',
'Full canopy: vocal performance studio with 7 training modules'
],finalState:'old-growth'},

{seedId:41,iterations:[
'Scene composition: foreground, midground, background layering',
'Movement choreography: how to guide the eye through a sequence',
'Timing and spacing: ease-in, ease-out for natural motion curves',
'Character design: silhouette readability and personality in shape',
'Background painting: atmospheric perspective in PNW forest layers',
'Storyboard layout: shot types, transitions, and pacing notation',
'Sound design sync: footsteps, ambience, and impact timing',
'PNW animation studios: Laika, indie shops, and their techniques',
'Cross-reference to film seed for cinematic storytelling principles',
'Full canopy: animation production pipeline with 8 stage walkthroughs'
],finalState:'old-growth'},

{seedId:42,iterations:[
'Garden zone map: USDA hardiness zones across the Pacific Northwest',
'Companion planting chart: which vegetables help or hinder neighbors',
'Succession planting timeline: stagger harvests over the growing season',
'Soil amendment calculator: compost, lime, and fertilizer ratios',
'Pollinator garden design: bloom sequence for year-round bee support',
'Seed saving protocols: isolation distances and drying techniques',
'PNW native plant nursery: propagation methods for restoration species',
'Food forest layers: canopy, understory, shrub, herb, ground cover, vine, root',
'Cross-reference to ecology seed for garden ecosystem connections',
'Full canopy: permaculture design course with 8 project templates'
],finalState:'old-growth'},

{seedId:43,iterations:[
'Sourdough starter: feeding schedule, hydration ratio, float test',
'Bread scoring patterns: ear formation, bloom direction, decorative cuts',
'Fermentation science: yeast metabolism, gluten development, acid balance',
'Whole grain milling: roller vs stone, extraction rate, freshness impact',
'Enriched doughs: butter, eggs, sugar lamination for pastry layers',
'PNW grain varieties: locally grown wheat, rye, and heritage grains',
'Wood-fired oven physics: thermal mass, heat retention, crust development',
'Sourdough pancakes, crackers, pizza: extending the starter culture',
'Cross-reference to chemistry seed for fermentation biochemistry',
'Full canopy: artisan bakery workshop with 8 recipe technique modules'
],finalState:'old-growth'},

{seedId:44,iterations:[
'Container garden setup: drainage, soil mix, and container sizing',
'Vertical growing systems: trellises, wall planters, and tower gardens',
'Aquaponics basics: fish waste to plant nutrient conversion cycle',
'Indoor lighting: PAR values, spectrum, and photoperiod for food crops',
'Microgreens growing guide: 10-day seed-to-harvest tray method',
'Composting systems: hot pile, worm bin, bokashi fermentation compared',
'PNW urban farms: community gardens, rooftop projects, food co-ops',
'Season extension: cold frames, row covers, and greenhouse design',
'Cross-reference to garden seed for outdoor growing connections',
'Full canopy: urban agriculture toolkit with 8 growing methods'
],finalState:'old-growth'},

{seedId:45,iterations:[
'Hand tool maintenance: sharpening, rust prevention, handle fitting',
'Measuring and marking: precision techniques for layout and joinery',
'Metalworking basics: filing, drilling, tapping, and riveting',
'Soldering station: iron temperature, flux types, and joint quality',
'3D printing primer: FDM vs resin, layer height, and support strategies',
'Laser cutting guide: kerf compensation, focus depth, material settings',
'PNW maker spaces: community workshops and tool lending libraries',
'Project documentation: how to write clear build instructions',
'Cross-reference to woodworking seed for material preparation skills',
'Full canopy: maker skills workshop with 8 tool mastery modules'
],finalState:'old-growth'},

{seedId:46,iterations:[
'Rhythm exercises: clapping patterns from simple to complex polyrhythm',
'Drum rudiments: single stroke, double stroke, paradiddle, and flam',
'Hand drum techniques: tone, bass, slap, and muted positions',
'World percussion overview: djembe, cajon, tabla, frame drum styles',
'Body percussion: stomps, claps, snaps, and chest beats as instruments',
'Rhythm notation: reading and writing standard percussion notation',
'PNW percussion traditions: cedar plank drumming, rattles, clapper sticks',
'Ensemble coordination: how rhythm section locks with melody instruments',
'Cross-reference to musical forest for percussion instrument connections',
'Full canopy: percussion academy with 8 progressive skill levels'
],finalState:'old-growth'},

{seedId:47,iterations:[
'Wire wrapping: spiral and weave patterns for jewelry and sculptures',
'Sheet metal forming: bending, raising, and planishing techniques',
'Patina recipes: liver of sulfur, vinegar, and salt for aged finishes',
'Casting basics: lost-wax process from sculpt to finished metal piece',
'Forging fundamentals: drawing out, upsetting, and scrollwork at the anvil',
'PNW blacksmith traditions: logging tools, fish hooks, gate hardware',
'Welding overview: MIG, TIG, stick, and oxy-fuel process comparison',
'Metal finishing: grinding, polishing, and powder coating methods',
'Cross-reference to geology seed for ore formation and metallurgy',
'Full canopy: metalworking studio with 8 technique progressions'
],finalState:'old-growth'},

{seedId:48,iterations:[
'Stage presence: body language, eye contact, and spatial awareness',
'Improvisation games: yes-and, status shifts, and emotional ranges',
'Mask work: neutral mask to character mask transformation exercises',
'Puppetry basics: hand, rod, and shadow puppet construction and operation',
'Site-specific performance: adapting shows to PNW outdoor venues',
'Devised theater: collaborative creation from theme to performance',
'PNW theater scene: community stages, outdoor amphitheaters, fringe festivals',
'Technical theater: basic lighting, sound, and set construction skills',
'Cross-reference to storytelling seed for narrative performance patterns',
'Full canopy: performance arts school with 8 workshop modules'
],finalState:'old-growth'},

// ═══ GROVE 4: THE CONCERT HALL (49-64) ═══
{seedId:49,iterations:[
'Acoustic guitar voicings: open chords, barre chords, and CAGED system',
'Fingerpicking patterns: Travis picking, arpeggios, and hybrid technique',
'Alternate tunings: DADGAD, open G, open D for PNW folk and blues',
'String action setup: truss rod, saddle height, intonation adjustment',
'Tone wood comparison: spruce, cedar, mahogany, rosewood sound profiles',
'Effects chain basics: reverb, delay, chorus, and signal path order',
'PNW guitar makers: luthiers and their old-growth tonewood sourcing',
'Songwriting with guitar: chord-melody, rhythm patterns, and form',
'Cross-reference to music theory seed for harmonic analysis tools',
'Full canopy: guitar academy with 8 progressive study tracks'
],finalState:'old-growth'},

{seedId:50,iterations:[
'Piano keyboard geography: octave patterns and landmark note naming',
'Chord inversions: root, first, second position voicings explained',
'Left hand accompaniment: Alberti bass, block chords, walking bass',
'Sight reading practice: progressive exercises from quarter notes up',
'Pedal technique: sustain, sostenuto, and una corda applications',
'Jazz piano comping: shell voicings and rhythmic patterns',
'PNW piano history: Steinway dealers, conservatory culture, jazz clubs',
'Practice routines: structured warm-up, technique, repertoire, and review',
'Cross-reference to music theory seed for keyboard harmony foundations',
'Full canopy: piano studio with 8 skill-building modules'
],finalState:'old-growth'},

{seedId:51,iterations:[
'Drum kit setup: throne height, pedal angle, cymbal reach optimization',
'Basic beats: rock, jazz, funk, and Latin patterns at 80-120 BPM',
'Hi-hat technique: open, closed, half-open, and foot splash variations',
'Snare rudiment application: paradiddles and flams in groove context',
'Bass drum independence: syncopated patterns while maintaining ride',
'Fill construction: how to build 1-bar and 2-bar fills that land on one',
'PNW drummers: Pacific Northwest jazz, punk, and indie rhythm traditions',
'Recording drums: mic placement, room sound, and overhead techniques',
'Cross-reference to percussion seed for hand drum technique crossover',
'Full canopy: drum kit mastery course with 8 progressive levels'
],finalState:'old-growth'},

{seedId:52,iterations:[
'Violin bow hold: French and Russian grip comparison with wrist mechanics',
'Open string exercises: long bows for tone production and control',
'First position fingering: whole and half step patterns across strings',
'Vibrato development: arm, wrist, and finger vibrato techniques',
'Shifting between positions: anchor notes and guide finger method',
'Double stops: thirds, sixths, and octaves for harmonic richness',
'PNW fiddle traditions: old-time, Celtic, and Scandinavian styles',
'Ensemble playing: intonation, blend, and section bow direction',
'Cross-reference to music theory seed for string instrument acoustics',
'Full canopy: violin studio with 8 technique and repertoire modules'
],finalState:'old-growth'},

{seedId:53,iterations:[
'Vocal range finder: chest, mixed, and head voice register boundaries',
'Vowel modification: adjusting formants for even tone across range',
'Consonant articulation: crisp diction without interrupting legato line',
'Choir blend: matching vowels, dynamics, and vibrato width with section',
'Solo performance: interpretation, phrasing, and stage presence',
'Sight singing: solfege, interval recognition, and rhythm reading',
'PNW choral traditions: church choirs, community ensembles, shape note sings',
'Vocal pedagogy history: bel canto principles adapted for modern styles',
'Cross-reference to vocal warm-up seed for daily practice connection',
'Full canopy: vocal performance academy with 8 development tracks'
],finalState:'old-growth'},

{seedId:54,iterations:[
'Clarinet embouchure: lip pressure, jaw position, and reed angle',
'Tone production: air support, oral cavity shape, and throat openness',
'Fingering chart: standard and alternate fingerings for all registers',
'Articulation: legato, staccato, accent, and slur execution',
'Register transitions: throat tones to clarion to altissimo smoothly',
'Reed selection: strength, cut, and material affecting response and tone',
'PNW wind ensembles: community bands, orchestras, and jazz combos',
'Extended techniques: multiphonics, circular breathing, pitch bends',
'Cross-reference to music theory seed for wind instrument transposition',
'Full canopy: woodwind studio with 8 technical development modules'
],finalState:'old-growth'},

{seedId:55,iterations:[
'Trumpet embouchure: mouthpiece placement, aperture, and air stream',
'Long tone routine: centering pitch and building endurance systematically',
'Lip slur exercises: harmonic series flexibility across valve combinations',
'Mute collection: straight, cup, harmon, plunger effects demonstrated',
'High register development: systematic approach to extending range',
'Jazz trumpet language: bebop scales, enclosures, and articulation style',
'PNW brass traditions: military bands, Dixieland revival, mariachi',
'Ensemble lead playing: projection, time feel, and section leadership',
'Cross-reference to music theory seed for brass instrument acoustics',
'Full canopy: brass studio with 8 performance skill modules'
],finalState:'old-growth'},

{seedId:56,iterations:[
'Electric bass setup: string height, pickup balance, and neck relief',
'Fingerstyle technique: alternating fingers, thumb, and slap basics',
'Root-fifth patterns: building solid bass lines from chord symbols',
'Walking bass lines: chromatic approach, scale, and arpeggio movement',
'Groove construction: note length, ghost notes, and rhythmic placement',
'Slap and pop: thumb strike, string pull, double thumb technique',
'PNW bass players: funk, punk, indie, and jazz bottom end traditions',
'Band dynamics: locking with drums and supporting harmonic changes',
'Cross-reference to music theory seed for bass line harmonic analysis',
'Full canopy: bass guitar mastery course with 8 style modules'
],finalState:'old-growth'},

{seedId:57,iterations:[
'Sound wave basics: frequency, amplitude, wavelength, and phase',
'Room acoustics: reflection, absorption, diffusion, and standing waves',
'Microphone types: dynamic, condenser, ribbon characteristics and uses',
'Signal flow: preamp to EQ to compressor to reverb to output',
'Digital audio: sample rate, bit depth, dithering explained',
'Mixing fundamentals: level balance, panning, frequency carving',
'Mastering chain: limiter, EQ, stereo width for final output',
'PNW recording studios: analog heritage, indie recording culture',
'Cross-reference to radio seed for broadcast audio standards',
'Full canopy: audio engineering school with 8 production modules'
],finalState:'old-growth'},

{seedId:58,iterations:[
'Synth architecture: oscillator, filter, amplifier, envelope, LFO',
'Waveform comparison: sine, square, sawtooth, triangle, and noise',
'Subtractive synthesis: filter sweeps and resonance shaping',
'FM synthesis: modulator-carrier ratios for bell and metallic tones',
'Wavetable scanning: morphing between wave shapes over time',
'Granular synthesis: time-stretching and texture from audio fragments',
'Modular patching: signal routing with virtual cables and modules',
'PNW electronic music: ambient, techno, and experimental scenes',
'Cross-reference to audio engineering seed for production techniques',
'Full canopy: synthesis laboratory with 8 sound design workshops'
],finalState:'old-growth'},

{seedId:59,iterations:[
'Song form analysis: AABA, ABAB, verse-chorus-bridge patterns',
'Melody writing: contour, range, interval patterns, and motif development',
'Lyric craft: rhyme schemes, syllable stress, and imagery techniques',
'Harmonic rhythm: how often chords change and its effect on energy',
'Arrangement: intro, build, drop, breakdown for dynamic contrast',
'Co-writing techniques: top-line, track-first, and jam-based methods',
'PNW songwriting scenes: open mics, songwriting circles, house concerts',
'Demo production: recording ideas quickly with minimal gear',
'Cross-reference to music theory seed for compositional structure',
'Full canopy: songwriting workshop with 8 creative process modules'
],finalState:'old-growth'},

{seedId:60,iterations:[
'Concert program planning: pacing, variety, and audience energy arc',
'Stage management: tech rehearsal checklist and cue sheet template',
'Front-of-house sound: PA setup, system tuning, and monitor mixing',
'Lighting design: mood, color, and timing for musical performance',
'Artist hospitality: green room, technical rider, and communication',
'Venue acoustics: room treatment options for different space types',
'PNW music venues: historic theaters, coffee shops, outdoor festivals',
'Event promotion: poster design, social media, and community outreach',
'Cross-reference to community seed for event organizing patterns',
'Full canopy: concert production guide with 8 planning modules'
],finalState:'old-growth'},

{seedId:61,iterations:[
'Conducting patterns: 2/4, 3/4, 4/4, and 6/8 beat shapes',
'Score reading: transposing instruments and concert pitch alignment',
'Rehearsal planning: warm-up, sectionals, run-through, and notes',
'Balance and blend: adjusting dynamics across instrument families',
'Tempo management: rubato, accelerando, ritardando with clear gesture',
'Interpretation: historically informed vs personal artistic choices',
'PNW ensembles: youth orchestras, community bands, chamber groups',
'Programming diversity: representing multiple traditions in one season',
'Cross-reference to music theory seed for score analysis fundamentals',
'Full canopy: ensemble leadership course with 8 conducting modules'
],finalState:'old-growth'},

{seedId:62,iterations:[
'DJ setup: turntable, mixer, and headphone cue workflow explained',
'Beat matching: tempo alignment by ear and with visual waveforms',
'Track selection: energy management and key compatibility mapping',
'EQ mixing: using frequency cuts to blend two tracks seamlessly',
'Effects usage: delay throws, filter sweeps, and reverb tails in mix',
'Set structure: opening, build, peak, and cool-down arc planning',
'PNW DJ culture: warehouse events, radio shows, and festival stages',
'Digital vs vinyl: workflow differences and creative tradeoffs',
'Cross-reference to audio engineering seed for sound system design',
'Full canopy: DJ performance school with 8 technique modules'
],finalState:'old-growth'},

{seedId:63,iterations:[
'Ukulele tuning: GCEA standard and alternate tunings for different keys',
'Strumming patterns: island, folk, and syncopated rhythm variations',
'Fingerpicking on uke: melody and accompaniment on four strings',
'Chord melody arrangements: combining bass notes with melody on top',
'Ukulele ensemble: soprano, concert, tenor, and baritone voice parts',
'Building a ukulele: cigar box, 3D printed, and traditional koa builds',
'PNW ukulele community: clubs, jams, and festival gatherings',
'Hawaiian music foundations: slack key and steel guitar context',
'Cross-reference to guitar seed for fretted instrument technique links',
'Full canopy: ukulele studio with 8 progressive playing modules'
],finalState:'old-growth'},

{seedId:64,iterations:[
'Recorder fingering chart: baroque and German fingering systems',
'Breath control: diaphragm support for even tone across registers',
'Articulation styles: tonguing patterns for different musical periods',
'Ensemble recorder: soprano, alto, tenor, bass voice leading',
'Ornamentation: trills, mordents, and grace notes in Renaissance style',
'Recorder consort: playing from parts in four-voice polyphony',
'PNW early music societies: Renaissance faires and period instrument groups',
'Historical context: recorder as serious concert instrument, not just school',
'Cross-reference to woodwind seed for breath and embouchure comparisons',
'Full canopy: recorder academy with 8 historical style modules'
],finalState:'old-growth'},

// ═══ GROVE 5: THE PHILOSOPHY GARDEN (65-80) ═══
{seedId:65,iterations:[
'Socratic method practice: ask questions that reveal hidden assumptions',
'Dialectic exercise: thesis, antithesis, synthesis in three rounds',
'Pre-Socratic cosmology: Thales water, Heraclitus fire, Parmenides being',
'Plato cave allegory: interactive shadow-to-light progression',
'Aristotle categories: substance, quantity, quality, relation explored',
'Stoic practices: morning intention, evening review, negative visualization',
'Epicurean garden: pleasure calculus and ataraxia path mapped',
'PNW philosophical traditions: Indigenous relational philosophy, pragmatism',
'Cross-reference to philosophy seed for ethics framework connection',
'Full canopy: ancient philosophy walk with 8 guided meditation stops'
],finalState:'old-growth'},

{seedId:66,iterations:[
'Formal logic: propositional calculus with truth table generator',
'Predicate logic: universal and existential quantifiers with examples',
'Modal logic: necessity, possibility, and possible worlds semantics',
'Set theory basics: union, intersection, complement with Venn diagrams',
'Proof techniques: direct, contradiction, contraposition, induction',
'Godel incompleteness: what formal systems cannot prove about themselves',
'Paradox collection: liar, Russell, Zeno, and their resolutions',
'PNW logic and CS: connections between formal systems and software',
'Cross-reference to math seed for mathematical logic foundations',
'Full canopy: logic training ground with 8 exercise levels'
],finalState:'old-growth'},

{seedId:67,iterations:[
'Utilitarian calculator: greatest good for greatest number scenarios',
'Kantian duty: categorical imperative test for proposed actions',
'Virtue ethics: character traits and the golden mean between extremes',
'Care ethics: relationship-centered moral reasoning in practice',
'Environmental ethics: anthropocentric vs ecocentric value frameworks',
'Bioethics cases: informed consent, genetic modification, end of life',
'Technology ethics: surveillance, AI bias, digital rights, and privacy',
'PNW ethical dilemmas: dam removal vs power generation, logging vs habitat',
'Cross-reference to governance seed for ethical policy making',
'Full canopy: ethics case study center with 8 deliberation exercises'
],finalState:'old-growth'},

{seedId:68,iterations:[
'Metaphysics primer: what exists, substance, properties, and identity',
'Personal identity: psychological continuity vs physical continuity',
'Free will debate: determinism, libertarian, and compatibilist positions',
'Causation models: regularity, counterfactual, and process theories',
'Time philosophy: presentism vs eternalism and the flow of time',
'Consciousness theories: functionalism, panpsychism, integrated information',
'Simulation argument: probability reasoning about virtual reality',
'PNW nature philosophy: wilderness ethics and the land ethic tradition',
'Cross-reference to physics seed for philosophy of science connections',
'Full canopy: metaphysics exploration lab with 8 thought experiments'
],finalState:'old-growth'},

{seedId:69,iterations:[
'Epistemology basics: justified true belief and Gettier problems',
'Skeptical scenarios: brain in vat, evil demon, and dream argument',
'Empiricism vs rationalism: Locke, Hume, Descartes, and Leibniz',
'Scientific method: observation, hypothesis, experiment, theory cycle',
'Social epistemology: testimony, expertise, and collective knowledge',
'Indigenous knowledge systems: place-based, relational, intergenerational',
'Epistemic injustice: testimonial and hermeneutical forms identified',
'PNW Traditional Ecological Knowledge: long-term environmental observation',
'Cross-reference to philosophy seed for knowledge framework comparisons',
'Full canopy: epistemology seminar with 8 case-based inquiry modules'
],finalState:'old-growth'},

{seedId:70,iterations:[
'Aesthetics questions: what is beauty, taste, and artistic value',
'Sublime in nature: Burke and Kant on overwhelming natural grandeur',
'PNW aesthetic tradition: landscape painting, nature photography, land art',
'Japanese aesthetics: wabi-sabi, mono no aware applied to PNW forests',
'Art criticism frameworks: formal, contextual, expressive, mimetic analysis',
'Environmental aesthetics: appreciating nature on its own terms',
'Everyday aesthetics: finding beauty in routine, craft, and attention',
'Digital aesthetics: pixel art, generative art, and interactive media',
'Cross-reference to art seed for creative expression connections',
'Full canopy: aesthetics gallery with 8 contemplation exercises'
],finalState:'old-growth'},

{seedId:71,iterations:[
'Political philosophy overview: social contract, liberty, justice, rights',
'Rawls justice: veil of ignorance thought experiment interactive',
'Nozick libertarian: minimal state and self-ownership arguments',
'Communitarianism: MacIntyre, Sandel on shared values and belonging',
'Anarchist traditions: mutual aid, direct action, and voluntary association',
'Feminist political theory: intersectionality and structural analysis',
'Indigenous sovereignty: self-determination, treaty rights, nation-to-nation',
'PNW political culture: progressive activism, tribal governance, environmentalism',
'Cross-reference to governance seed for institutional design patterns',
'Full canopy: political philosophy forum with 8 debate simulations'
],finalState:'old-growth'},

{seedId:72,iterations:[
'Philosophy of mind: mental states, qualia, and the hard problem',
'Artificial intelligence: Chinese room, Turing test, and symbol grounding',
'Animal cognition: tool use, language, and self-awareness evidence',
'Embodied cognition: how body and environment shape thinking',
'Extended mind thesis: notebooks, phones, and tools as cognitive aids',
'Neurodiversity: different cognitive styles as variation, not deficit',
'Meditation and contemplation: attention training and phenomenology',
'PNW cognitive science: UW, UBC research in perception and language',
'Cross-reference to psychology seed for empirical mind research',
'Full canopy: philosophy of mind laboratory with 8 inquiry modules'
],finalState:'old-growth'},

{seedId:73,iterations:[
'Philosophy of language: meaning, reference, truth, and context',
'Speech act theory: how saying things does things — Austin and Searle',
'Metaphor and meaning: cognitive linguistics and conceptual mapping',
'Translation philosophy: indeterminacy, untranslatability, and equivalence',
'Language and thought: Sapir-Whorf hypothesis weak and strong forms',
'Formal semantics: model-theoretic approaches to natural language',
'PNW language diversity: Salish, Sahaptin, Chinook language families',
'Language revitalization: community-driven language recovery efforts',
'Cross-reference to language seed for practical communication skills',
'Full canopy: philosophy of language center with 8 analysis exercises'
],finalState:'old-growth'},

{seedId:74,iterations:[
'Philosophy of science: demarcation, explanation, and theory change',
'Realism vs anti-realism: do scientific theories describe reality',
'Paradigm shifts: Copernican, Darwinian, quantum as case studies',
'Underdetermination: when evidence supports multiple theories equally',
'Values in science: objectivity ideal vs situated knowledge reality',
'Philosophy of biology: species concepts, adaptation, and teleology',
'Philosophy of physics: space, time, and quantum interpretation',
'PNW natural history: how philosophical assumptions shaped early surveys',
'Cross-reference to epistemology seed for knowledge validation methods',
'Full canopy: philosophy of science seminar with 8 case analyses'
],finalState:'old-growth'},

{seedId:75,iterations:[
'Existentialism overview: Kierkegaard, Nietzsche, Heidegger, Sartre, Camus',
'Authenticity: living according to self-chosen values vs social conformity',
'Absurdism: Sisyphus and the response to meaninglessness',
'Anxiety and dread: Heidegger being-toward-death as motivation',
'Freedom and responsibility: Sartre radical freedom and bad faith',
'Existential therapy: finding meaning through choices and commitments',
'PNW existential landscapes: solitude in old growth, ocean vastness, volcanic impermanence',
'Literature connections: Dostoevsky, Kafka, Camus novels as philosophy',
'Cross-reference to storytelling seed for existential narrative patterns',
'Full canopy: existential philosophy retreat with 8 reflective walks'
],finalState:'old-growth'},

{seedId:76,iterations:[
'Eastern philosophy survey: Buddhism, Taoism, Confucianism, Hinduism',
'Buddhist four noble truths: suffering, origin, cessation, path',
'Taoist concepts: wu wei, the uncarved block, and natural flow',
'Zen practice: zazen posture, breath counting, koan contemplation',
'Confucian ethics: ren, li, and the five relationships',
'Hindu philosophy: Vedanta, yoga paths, and dharma concepts',
'PNW Buddhist centers: Zen, Tibetan, and Vipassana communities',
'Comparative philosophy: parallel concepts across Eastern and Western traditions',
'Cross-reference to meditation seed for contemplative practice tools',
'Full canopy: Eastern philosophy garden with 8 practice-based modules'
],finalState:'old-growth'},

{seedId:77,iterations:[
'Technology philosophy: tool as extension of human capability',
'Philosophy of AI: alignment, consciousness, and moral status questions',
'Digital ethics: privacy, surveillance, attention economy, and consent',
'Transhumanism debate: enhancement, life extension, and human nature',
'Technology and democracy: information access, filter bubbles, misinformation',
'Maker ethics: right to repair, open source, and knowledge sharing',
'PNW tech culture: Silicon Forest, open source movement, DIY ethics',
'Philosophy of the internet: virtual communities and digital identity',
'Cross-reference to computer science seed for technical foundations',
'Full canopy: tech philosophy forum with 8 deliberation scenarios'
],finalState:'old-growth'},

{seedId:78,iterations:[
'Environmental philosophy timeline: Thoreau to deep ecology to today',
'Aldo Leopold land ethic: thinking like a mountain exercise',
'Deep ecology: Naess platform principles and self-realization',
'Ecofeminism: parallels between domination of nature and of women',
'Climate justice: who bears the costs of environmental destruction',
'Rights of nature: legal personhood for rivers, forests, ecosystems',
'PNW environmental thought: Muir, Leopold, and Coast Salish stewardship',
'Restoration philosophy: what counts as healing a damaged ecosystem',
'Cross-reference to ecology seed for environmental science foundations',
'Full canopy: environmental philosophy trail with 8 reflection stations'
],finalState:'old-growth'},

{seedId:79,iterations:[
'Pragmatism overview: Peirce, James, Dewey and truth as what works',
'Instrumentalism: ideas as tools for solving problems, not mirrors',
'Dewey education: learning by doing, inquiry-based progressive pedagogy',
'Pragmatic ethics: consequences matter but so does character and context',
'Neopragmatism: Rorty, Putnam, and the linguistic turn',
'PNW pragmatic tradition: practical environmentalism and civic engagement',
'Indigenous pragmatism: traditional knowledge as proven practice over millennia',
'Design thinking: pragmatist principles applied to creative problem-solving',
'Cross-reference to governance seed for pragmatic policy approaches',
'Full canopy: pragmatism workshop with 8 problem-solving exercises'
],finalState:'old-growth'},

{seedId:80,iterations:[
'Philosophy of education: what is education for, and who decides',
'Socratic teaching: questioning as primary pedagogical method',
'Montessori principles: prepared environment, auto-education, sensitive periods',
'Freire critical pedagogy: education as liberation from oppression',
'Place-based education: curriculum grounded in local ecology and culture',
'Outdoor education: wilderness experience as transformative learning',
'PNW education innovations: Waldorf, forest schools, tribal schools',
'Philosophy for children: P4C community of inquiry methodology',
'Cross-reference to knowledge seed for learning science foundations',
'Full canopy: education philosophy center with 8 pedagogical models'
],finalState:'old-growth'},

// ═══ GROVE 6: THE WORKSHOP (81-96) ═══
{seedId:81,iterations:[
'Timber framing: post and beam layout, mortise sizing, and raising',
'Foundation types: slab, crawlspace, basement for PNW soil conditions',
'Roof truss design: common, hip, and gambrel load calculations',
'Insulation comparison: fiberglass, mineral wool, cellulose, foam R-values',
'Plumbing rough-in: drain-waste-vent layout and sizing rules',
'Electrical panel sizing: load calculation and circuit breaker selection',
'PNW building codes: seismic requirements, wind loads, and snow loads',
'Green building: passive solar, thermal mass, and natural ventilation',
'Cross-reference to seismograph seed for structural resilience',
'Full canopy: residential construction academy with 8 trade modules'
],finalState:'old-growth'},

{seedId:82,iterations:[
'Bicycle frame geometry: head angle, trail, and wheelbase effects',
'Drivetrain mechanics: gear ratios, chain tension, and derailleur alignment',
'Wheel building: spoke lacing, tension, and trueing procedures',
'Brake systems: rim, disc mechanical, and disc hydraulic comparison',
'Tire selection: width, tread pattern, and pressure for PNW conditions',
'Fit and ergonomics: saddle height, reach, and handlebar drop',
'PNW cycling culture: bike commuting, gravel routes, and touring trails',
'Maintenance schedule: seasonal checklist for Pacific Northwest riding',
'Cross-reference to mechanics seed for force and motion principles',
'Full canopy: bicycle mechanics workshop with 8 service modules'
],finalState:'old-growth'},

{seedId:83,iterations:[
'Sailboat rigging: standing and running rigging identification and trim',
'Points of sail: close-hauled, beam reach, broad reach, running explained',
'Navigation fundamentals: chart reading, compass course, and dead reckoning',
'Weather routing: using forecasts and currents for passage planning',
'Knot tying: bowline, cleat hitch, clove hitch, sheet bend essentials',
'Boat systems: fresh water, electrical, and engine maintenance basics',
'PNW sailing waters: Puget Sound, San Juan Islands, Inside Passage',
'Seamanship: right-of-way rules, anchoring, and docking maneuvers',
'Cross-reference to wind seed for sailing wind pattern analysis',
'Full canopy: sailing school with 8 on-water skill modules'
],finalState:'old-growth'},

{seedId:84,iterations:[
'Engine types: two-stroke, four-stroke, diesel, and electric comparison',
'Cooling system: radiator, thermostat, water pump, and antifreeze mix',
'Ignition system: spark plug, coil, distributor, and electronic ignition',
'Fuel system: carburetor vs fuel injection, air filter maintenance',
'Transmission basics: manual, automatic, CVT gear selection logic',
'Suspension tuning: spring rate, damping, and ride height for PNW roads',
'PNW automotive culture: rally racing, overlanding, and winter driving',
'Emissions and efficiency: catalytic converter, EGR, and hybrid systems',
'Cross-reference to mechanics seed for thermodynamic foundations',
'Full canopy: automotive technology course with 8 systems modules'
],finalState:'old-growth'},

{seedId:85,iterations:[
'Network topology: star, ring, mesh, and hybrid configurations',
'IP addressing: subnets, CIDR notation, and NAT explained',
'Wireless standards: 802.11 a/b/g/n/ac/ax frequency and speed comparison',
'Firewall rules: allow, deny, and stateful inspection basics',
'DNS resolution: how domain names map to IP addresses step by step',
'VPN tunneling: encapsulation, encryption, and split tunneling options',
'PNW internet infrastructure: submarine cables, peering points, data centers',
'Mesh networking: ad-hoc node discovery and routing for resilience',
'Cross-reference to radio seed for wireless communication physics',
'Full canopy: network engineering lab with 8 configuration exercises'
],finalState:'old-growth'},

{seedId:86,iterations:[
'Operating system layers: kernel, drivers, shell, and user space',
'Process management: scheduling, context switching, and priority queues',
'Memory hierarchy: registers, cache, RAM, and virtual memory paging',
'File system structures: inodes, directory trees, journaling, and snapshots',
'Shell scripting: variables, loops, conditionals, and pipe chains',
'Container basics: namespaces, cgroups, and image layering explained',
'PNW systems heritage: early UNIX culture, BSD distributions, Linux community',
'Security fundamentals: permissions, sandboxing, and audit logging',
'Cross-reference to computer science seed for algorithm foundations',
'Full canopy: systems administration bootcamp with 8 lab exercises'
],finalState:'old-growth'},

{seedId:87,iterations:[
'Crop rotation planner: four-year cycle for soil health and pest control',
'Irrigation design: drip, sprinkler, and swale systems for PNW climate',
'Soil testing: nitrogen, phosphorus, potassium, and pH interpretation',
'Cover crop selection: winter rye, crimson clover, and vetch for PNW',
'Integrated pest management: beneficial insects, traps, and thresholds',
'Harvest timing: days to maturity, frost dates, and storage preparation',
'PNW agricultural heritage: orchards, berry farms, and seed companies',
'Market garden economics: crop value per square foot and labor analysis',
'Cross-reference to ecology seed for agricultural ecosystem services',
'Full canopy: sustainable farming toolkit with 8 seasonal modules'
],finalState:'old-growth'},

{seedId:88,iterations:[
'Soldering iron technique: tinning, flux application, and joint quality',
'Through-hole assembly: component placement and lead forming standards',
'Surface mount: hot air and reflow techniques for small components',
'Multimeter mastery: voltage, current, resistance, and continuity tests',
'Power supply design: linear vs switching regulators with efficiency curves',
'Microcontroller programming: Arduino and ESP32 basic I/O projects',
'PNW electronics community: ham radio clubs, maker faires, and hackspaces',
'Troubleshooting methodology: signal tracing and component substitution',
'Cross-reference to electronics seed for circuit theory foundations',
'Full canopy: electronics assembly workshop with 8 build projects'
],finalState:'old-growth'},

{seedId:89,iterations:[
'Sewing machine threading: upper thread path and bobbin loading',
'Straight stitch fundamentals: seam allowance, backstitch, and pivot',
'Pattern reading: symbols, grainline, notches, and cutting layout',
'Fabric selection: fiber content, weight, and drape for different projects',
'Zipper installation: centered, lapped, and invisible methods compared',
'Fitting adjustments: darts, ease, and muslin prototype workflow',
'PNW textile traditions: wool trade, outdoor gear manufacturing heritage',
'Mending and repair: visible mending, patching, and darning techniques',
'Cross-reference to weaving seed for fabric construction understanding',
'Full canopy: garment sewing studio with 8 progressive projects'
],finalState:'old-growth'},

{seedId:90,iterations:[
'Knife selection: blade geometry, steel types, and handle ergonomics',
'Cutting technique: rock chop, push cut, and pull cut for different foods',
'Mise en place: organizing ingredients and tools before cooking',
'Heat management: searing, braising, roasting temperature fundamentals',
'Sauce foundations: mother sauces and their PNW-ingredient derivatives',
'Fermentation: lacto-ferment vegetables, kombucha, and miso basics',
'PNW cuisine: salmon, berries, mushrooms, hazelnuts, and Dungeness crab',
'Food preservation: canning, dehydrating, smoking, and cold storage',
'Cross-reference to garden seed for farm-to-table ingredient sourcing',
'Full canopy: culinary arts school with 8 technique modules'
],finalState:'old-growth'},

{seedId:91,iterations:[
'Campsite selection: wind protection, drainage, and leave-no-trace criteria',
'Shelter systems: tent, tarp, hammock, and bivvy for PNW weather',
'Water purification: filter, UV, chemical, and boiling methods compared',
'Navigation skills: map, compass, and natural wayfinding techniques',
'Fire craft: friction fire, ferro rod, and safe fire ring construction',
'Rope work: trucker hitch, tautline hitch, and bear hang systems',
'PNW backcountry: alpine zones, rainforest, and coastal camping specifics',
'Weather reading: cloud identification and pressure change interpretation',
'Cross-reference to barometer seed for weather prediction tools',
'Full canopy: wilderness skills academy with 8 field modules'
],finalState:'old-growth'},

{seedId:92,iterations:[
'Lead climbing: clipping, rope management, and fall factor calculation',
'Belaying technique: device comparison, brake hand discipline, and communication',
'Anchor building: equalized multi-point systems with redundancy',
'Rappelling: backup systems, edge management, and knot passing',
'Route reading: hold identification, sequence planning, and rest positions',
'Crack climbing: hand jams, finger jams, and off-width techniques',
'PNW climbing areas: Smith Rock, Index, Squamish, and volcanic peaks',
'Mountain rescue basics: self-arrest, crevasse rescue, and emergency shelter',
'Cross-reference to geology seed for rock type and friction properties',
'Full canopy: climbing skills course with 8 progressive modules'
],finalState:'old-growth'},

{seedId:93,iterations:[
'Canoe strokes: J-stroke, draw, pry, and cross-bow technique',
'Kayak roll: hip snap, sweep, and brace recovery in moving water',
'River reading: eddies, hydraulics, and route selection through rapids',
'Equipment selection: boat type, paddle length, and PFD fit',
'Portage technique: single carry, tandem carry, and trail navigation',
'Tidal paddling: current prediction, crossing ferries, and eddy hopping',
'PNW paddling waters: Columbia River, Willamette, Puget Sound, and coast',
'Leave-no-trace paddling: camp selection, waste management, and wildlife distance',
'Cross-reference to water dynamics seed for river hydrology',
'Full canopy: paddling skills school with 8 progressive water modules'
],finalState:'old-growth'},

{seedId:94,iterations:[
'Snowpack assessment: pit profiles, crystal types, and stability tests',
'Skinning technique: kick turns, trail breaking, and transition efficiency',
'Avalanche terrain: slope angle, aspect, and trigger points identified',
'Route planning: terrain maps, weather forecast, and group assessment',
'Companion rescue: beacon search, probe, and shovel technique drills',
'Snow camping: platform building, cold management, and melt water',
'PNW ski areas: Cascades volcanoes, coastal mountains, and backcountry zones',
'Climate and snowpack: how warming changes the PNW snow line over decades',
'Cross-reference to glacier seed for long-term ice dynamics',
'Full canopy: winter backcountry course with 8 safety modules'
],finalState:'old-growth'},

{seedId:95,iterations:[
'Tidepool identification: sea stars, anemones, urchins, and crabs by zone',
'Wave energy: period, height, and fetch as predictors of surf and erosion',
'Sand composition: mineral analysis revealing source geology',
'Driftwood ecology: nurse log function and habitat creation on beaches',
'Seabird observation: species, behavior, and seasonal migration patterns',
'Marine mammal protocol: approach distances and disturbance avoidance',
'PNW coastal geology: sea stacks, arches, and wave-cut platforms',
'Beach cleanup methodology: survey grids, data collection, and MOOP tracking',
'Cross-reference to marine seed for ocean ecosystem connections',
'Full canopy: coastal science field course with 8 tidepool modules'
],finalState:'old-growth'},

{seedId:96,iterations:[
'Mycological survey: fruiting body identification and spore printing',
'Edible vs toxic: key identification features and look-alike warnings',
'Mycelium network mapping: tracer experiments showing nutrient transport',
'Decomposition roles: white rot, brown rot, and soft rot fungal strategies',
'Lichen as bioindicator: air quality assessment from species composition',
'Truffle ecology: hypogeous fungi and animal dispersal partnerships',
'PNW mushroom foraging: chanterelle, matsutake, morel, and lobster',
'Cultivation basics: growing oyster, shiitake, and lion mane at home',
'Cross-reference to chanterelle seed for mycelial network deep dive',
'Full canopy: mycology field school with 8 identification modules'
],finalState:'old-growth'},

// ═══ GROVE 7: THE COMMONS (97-112) ═══
{seedId:97,iterations:[
'Community meeting facilitation: agenda, roles, and decision protocols',
'Consensus building: gradients of agreement and blocking concerns',
'Conflict resolution: nonviolent communication and mediation steps',
'Volunteer coordination: matching skills to needs with rotation schedules',
'Event planning: venue, logistics, promotion, and post-event review',
'Mutual aid networks: how neighbors help neighbors without bureaucracy',
'PNW community models: granges, co-ops, land trusts, and village councils',
'Digital community tools: forums, wikis, and shared calendars',
'Cross-reference to trust seed for relationship-based governance',
'Full canopy: community organizing toolkit with 8 facilitation guides'
],finalState:'old-growth'},

{seedId:98,iterations:[
'Skill share format: teaching circles where everyone contributes expertise',
'Mentorship structures: one-on-one, group, and peer mentoring models',
'Knowledge documentation: how to write guides others can actually follow',
'Workshop design: learning objectives, hands-on activities, and feedback',
'Open source pedagogy: learning by contributing to shared projects',
'Library science: collection development, cataloging, and access equity',
'PNW learning institutions: community colleges, tribal education, trade schools',
'Intergenerational learning: elders teaching youth, youth teaching technology',
'Cross-reference to education seed for pedagogical frameworks',
'Full canopy: knowledge sharing network with 8 exchange formats'
],finalState:'old-growth'},

{seedId:99,iterations:[
'Food system mapping: production, distribution, and access in a community',
'Seed library: saving, sharing, and adapting varieties to local conditions',
'Community kitchen: shared processing space for value-added food products',
'Gleaning networks: harvesting surplus from farms and orchards',
'Farmers market infrastructure: stall layout, vendor support, and regulations',
'Food forest commons: perennial plantings managed by community stewards',
'PNW food security: food banks, community gardens, and tribal food sovereignty',
'Season extension sharing: greenhouse co-ops and cold storage facilities',
'Cross-reference to garden seed for growing technique connections',
'Full canopy: community food system toolkit with 8 program templates'
],finalState:'old-growth'},

{seedId:100,iterations:[
'Tool library inventory: what tools to stock and how to track lending',
'Maintenance protocols: care standards for shared tools between users',
'Safety training: required certification for power tools and equipment',
'Space layout: workbench areas, storage, and project staging zones',
'Scheduling system: fair access to limited tools and workspace time',
'Mobile workshop: trailer-mounted tools for neighborhood outreach',
'PNW maker culture: repair cafes, tool lending, and community workshops',
'Insurance and liability: protecting shared resources and their users',
'Cross-reference to maker seed for tool mastery skill building',
'Full canopy: tool library operations guide with 8 management modules'
],finalState:'old-growth'},

{seedId:101,iterations:[
'Community energy audit: building-by-building heat loss and usage mapping',
'Solar co-op: group purchasing and shared installation coordination',
'Weatherization teams: volunteer insulation and air sealing blitzes',
'Community solar gardens: shared panel arrays for renters and apartments',
'Battery storage cooperatives: neighborhood-scale energy resilience',
'Microgrid design: islanding capability for community power continuity',
'PNW energy transition: hydroelectric legacy, wind farms, and solar growth',
'Energy equity: ensuring clean energy benefits reach all income levels',
'Cross-reference to energy seed for renewable technology foundations',
'Full canopy: community energy toolkit with 8 project templates'
],finalState:'old-growth'},

{seedId:102,iterations:[
'Community land trust: removing land from speculative market permanently',
'Housing cooperative: shared ownership, maintenance, and governance models',
'Cohousing design: private units with shared common house and grounds',
'Accessory dwelling: backyard cottages and garage conversions for density',
'Sweat equity: contributing labor toward homeownership in affordable housing',
'Anti-displacement: community organizing tools for neighborhood stability',
'PNW housing: affordability crisis, tiny homes, and innovative solutions',
'Zoning reform: how land use rules shape who can live where',
'Cross-reference to building seed for construction cost management',
'Full canopy: community housing resource with 8 development models'
],finalState:'old-growth'},

{seedId:103,iterations:[
'Watershed stewardship: volunteer water quality monitoring protocols',
'Riparian restoration: planting native species along stream corridors',
'Invasive species management: identification, mapping, and removal methods',
'Trail maintenance: drainage, tread repair, and brushing techniques',
'Citizen science programs: bird counts, mushroom surveys, and phenology',
'Land conservation: easements, acquisitions, and stewardship agreements',
'PNW conservation organizations: land trusts, watershed councils, and tribes',
'Youth conservation corps: service learning in environmental stewardship',
'Cross-reference to ecology seed for ecosystem restoration science',
'Full canopy: environmental stewardship handbook with 8 action modules'
],finalState:'old-growth'},

{seedId:104,iterations:[
'Community radio: low-power FM licensing, programming, and technical setup',
'Zine production: layout, printing, and distribution for local media',
'Oral history collection: interview techniques and archival standards',
'Public art: mural projects, sculpture trails, and performance in public space',
'Film screening series: community cinema with discussion facilitation',
'Podcast production: recording, editing, and publishing community voices',
'PNW independent media: alternative newspapers, community radio stations',
'Cultural documentation: preserving and sharing community stories',
'Cross-reference to storytelling seed for narrative arts connections',
'Full canopy: community media center with 8 production modules'
],finalState:'old-growth'},

{seedId:105,iterations:[
'Wellness check system: neighbor-to-neighbor daily contact networks',
'Disaster preparedness: household and neighborhood emergency plans',
'First responder coordination: CERT training and incident command basics',
'Communication plan: how to reach everyone when phones and internet fail',
'Supply cache: what to stockpile and how to rotate community reserves',
'Shelter operations: opening, staffing, and managing temporary refuge',
'PNW hazards: earthquake, tsunami, wildfire, flood, and volcanic ash',
'Community resilience: social cohesion as the strongest disaster response',
'Cross-reference to seismograph seed for earthquake preparedness',
'Full canopy: community resilience plan with 8 preparedness modules'
],finalState:'old-growth'},

{seedId:106,iterations:[
'Time banking: hour-for-hour skill exchange without money',
'Barter networks: direct trade agreements with community matching',
'Local currency: designing and managing community scrip systems',
'Cooperative business: worker-owned, consumer-owned, and multi-stakeholder',
'Community investment: local lending circles and crowdfunding platforms',
'Fair trade connections: ethical supply chains for imported goods',
'PNW alternative economics: credit unions, co-ops, and benefit corporations',
'Economic resilience: diversifying local economy against external shocks',
'Cross-reference to economics seed for theoretical foundations',
'Full canopy: alternative economics toolkit with 8 exchange models'
],finalState:'old-growth'},

{seedId:107,iterations:[
'Community health assessment: mapping needs, assets, and access gaps',
'Preventive care: vaccination, screening, and health education programs',
'Mental health support: peer counseling, support groups, and crisis lines',
'Traditional medicine: herbal, Indigenous healing practices with proper protocols',
'Community fitness: outdoor exercise groups, walking clubs, and park programs',
'Nutrition education: cooking classes, label reading, and meal planning',
'PNW health systems: rural access challenges, tribal health services',
'Health equity: addressing disparities in care access and outcomes',
'Cross-reference to health seed for individual wellness connections',
'Full canopy: community health center model with 8 program areas'
],finalState:'old-growth'},

{seedId:108,iterations:[
'Public transit advocacy: route analysis, frequency, and equity mapping',
'Bike infrastructure: protected lanes, parking, and repair stations',
'Pedestrian safety: crosswalk design, traffic calming, and lighting',
'Ride sharing: community van pools and carpool matching systems',
'Electric vehicle: charging infrastructure planning for neighborhoods',
'Complete streets: designing roads for all users, not just cars',
'PNW transportation: ferry systems, light rail, and regional trail networks',
'Mobility equity: ensuring transportation serves everyone regardless of ability',
'Cross-reference to bicycle seed for cycling infrastructure details',
'Full canopy: community transportation planner with 8 modal guides'
],finalState:'old-growth'},

{seedId:109,iterations:[
'Youth program design: age-appropriate activities with developmental goals',
'Outdoor education: nature camps, forest schools, and wilderness trips',
'Arts education: community studios offering classes in multiple media',
'Sports and recreation: leagues, open play, and adaptive programs',
'After-school programs: homework help, enrichment, and safe space',
'Youth leadership: councils, decision-making roles, and project management',
'PNW youth organizations: 4-H, scouts, tribal youth programs, and camps',
'Youth voice: meaningful participation in community planning processes',
'Cross-reference to education seed for learning theory foundations',
'Full canopy: youth development program guide with 8 activity tracks'
],finalState:'old-growth'},

{seedId:110,iterations:[
'Elder care networks: neighbor support, meal delivery, and companionship',
'Lifelong learning: continuing education, technology training, and book clubs',
'Memory and storytelling: oral history recording and reminiscence groups',
'Age-friendly design: home modifications, accessible spaces, and wayfinding',
'Intergenerational programs: shared activities bridging age groups',
'End-of-life planning: advance directives, hospice, and legacy projects',
'PNW elder care: tribal elder programs, senior centers, and village models',
'Wisdom transmission: structured ways to pass on knowledge and skills',
'Cross-reference to community seed for mutual support frameworks',
'Full canopy: elder support network with 8 care coordination modules'
],finalState:'old-growth'},

{seedId:111,iterations:[
'Cultural event calendar: festivals, celebrations, and observances year-round',
'Public gathering space: design principles for inclusive outdoor venues',
'Cultural exchange: respectful cross-cultural learning and sharing events',
'Heritage preservation: documenting and protecting cultural landmarks',
'Artist support: studio space, grants, residencies, and exhibition venues',
'Cultural tourism: responsible visitor programs that benefit communities',
'PNW cultural diversity: Indigenous, Asian, Latino, Scandinavian, and other traditions',
'Creative placemaking: using arts to strengthen community identity',
'Cross-reference to art seed for creative expression frameworks',
'Full canopy: cultural vitality program with 8 community arts modules'
],finalState:'old-growth'},

{seedId:112,iterations:[
'Environmental justice mapping: pollution burden by neighborhood',
'Advocacy training: how to testify, write letters, and organize campaigns',
'Coalition building: bringing diverse groups together around shared goals',
'Policy analysis: reading proposed legislation and regulatory changes',
'Direct action: nonviolent protest, civil disobedience, and legal support',
'Media strategy: press releases, social media, and storytelling for change',
'PNW social movements: labor, environmental, Indigenous rights, and housing',
'Movement history: learning from past successes and failures',
'Cross-reference to governance seed for policy change mechanisms',
'Full canopy: social justice organizing guide with 8 campaign modules'
],finalState:'old-growth'},

// ═══ GROVE 8: THE FRONTIER (113-128) ═══
{seedId:113,iterations:[
'Machine learning basics: supervised, unsupervised, and reinforcement learning',
'Neural network anatomy: layers, weights, biases, and activation functions',
'Training loop: forward pass, loss calculation, backpropagation, optimization',
'Computer vision: convolutional networks for image recognition tasks',
'Natural language: transformers, attention, and token prediction explained',
'AI ethics: bias in training data, explainability, and human oversight',
'PNW AI research: Allen Institute, UW AI lab, and industry applications',
'Hands-on: train a simple classifier on PNW species image data',
'Cross-reference to computer science seed for algorithm foundations',
'Full canopy: AI literacy course with 8 interactive learning modules'
],finalState:'old-growth'},

{seedId:114,iterations:[
'Qubit basics: superposition, entanglement, and measurement explained',
'Quantum gates: Hadamard, CNOT, and Toffoli operations visualized',
'Quantum circuits: building simple programs with gate sequences',
'Shor algorithm: how quantum computing threatens current encryption',
'Grover search: quadratic speedup for unstructured search problems',
'Quantum error correction: why qubits need redundancy and how',
'PNW quantum research: Microsoft Station Q, UW quantum computing lab',
'Near-term applications: optimization, simulation, and cryptography',
'Cross-reference to physics seed for quantum mechanics foundations',
'Full canopy: quantum computing primer with 8 concept modules'
],finalState:'old-growth'},

{seedId:115,iterations:[
'Genome sequencing: DNA extraction, library prep, and read assembly',
'Gene editing: CRISPR-Cas9 mechanism and delivery methods explained',
'Synthetic biology: designing genetic circuits for custom behavior',
'Protein engineering: directed evolution and rational design approaches',
'Gene therapy: replacing faulty genes with functional copies in patients',
'Agricultural biotech: drought-resistant crops and biological pest control',
'PNW biotech: conservation genomics for salmon, forest genetics research',
'Bioethics framework: safety, consent, equity, and environmental impact',
'Cross-reference to genetics seed for molecular biology foundations',
'Full canopy: biotechnology explorer with 8 guided laboratory simulations'
],finalState:'old-growth'},

{seedId:116,iterations:[
'Prosthetic design: mechanical, myoelectric, and osseointegrated limbs',
'Brain-computer interfaces: EEG, ECoG, and intracortical electrode arrays',
'Exoskeleton mechanics: powered assistance for mobility and rehabilitation',
'Robotic surgery: da Vinci system precision and minimally invasive approach',
'Diagnostic AI: medical imaging analysis outperforming human radiologists',
'Wearable health: continuous glucose monitors, heart rhythm, and SpO2',
'PNW biomedical engineering: OHSU research, UW bioengineering innovations',
'Accessibility technology: universal design principles in medical devices',
'Cross-reference to health seed for human anatomy and physiology',
'Full canopy: biomedical engineering showcase with 8 innovation profiles'
],finalState:'old-growth'},

{seedId:117,iterations:[
'Hydrogen fuel cells: PEM operation, efficiency, and water byproduct',
'Small modular reactors: passive safety, modular construction, waste reduction',
'Fusion progress: tokamak, stellarator, and inertial confinement approaches',
'Advanced geothermal: enhanced systems accessing deep heat everywhere',
'Space-based solar: orbital collection and microwave power beaming concepts',
'Ocean thermal: temperature gradient energy extraction in tropical waters',
'PNW future energy: tidal, wave, and enhanced geothermal potential sites',
'Grid of the future: distributed, intelligent, and resilient power networks',
'Cross-reference to energy seed for current renewable technology baseline',
'Full canopy: future energy technology survey with 8 feasibility assessments'
],finalState:'old-growth'},

{seedId:118,iterations:[
'Autonomous vehicle sensing: lidar, radar, camera, and sensor fusion',
'Drone delivery: airspace management, routing, and package handling',
'Hyperloop concept: vacuum tube, magnetic levitation, and pod design',
'Electric aircraft: battery density requirements and regional range limits',
'Urban air mobility: eVTOL vehicles and vertiport infrastructure',
'Autonomous shipping: collision avoidance and port automation systems',
'PNW transport innovation: ferry electrification, smart highway corridors',
'Mobility-as-a-service: integrated multi-modal transportation platforms',
'Cross-reference to transportation seed for current infrastructure context',
'Full canopy: future mobility explorer with 8 technology assessments'
],finalState:'old-growth'},

{seedId:119,iterations:[
'Mars habitat: radiation shielding, ISRU, and pressurized volume design',
'Lunar base: regolith sintering, ice mining, and solar power at the poles',
'Space agriculture: closed-loop life support and crop selection for zero-g',
'Asteroid mining: delta-v budgets, extraction methods, and return economics',
'O Neill cylinders: rotating habitat physics and interior ecology design',
'Space elevator: carbon nanotube tether, counterweight, and climber systems',
'PNW aerospace: Blue Origin, SpaceX Starship tests, and satellite industry',
'Space debris cleanup: nets, harpoons, lasers, and deorbit sails',
'Cross-reference to space seed for orbital mechanics foundations',
'Full canopy: space settlement design studio with 8 habitat concepts'
],finalState:'old-growth'},

{seedId:120,iterations:[
'Soft robotics: pneumatic actuators, silicone bodies, and flexible sensors',
'Swarm coordination: decentralized algorithms for collective behavior',
'Bipedal locomotion: dynamic balance, gait cycles, and terrain adaptation',
'Manipulation: multi-finger grasping, force feedback, and dexterous tasks',
'Robot vision: object recognition, SLAM, and scene understanding',
'Human-robot interaction: social cues, safety zones, and task collaboration',
'PNW robotics: warehouse automation, agricultural robots, and marine drones',
'Ethics of automation: labor displacement, responsibility, and design values',
'Cross-reference to AI seed for machine learning control systems',
'Full canopy: robotics engineering course with 8 build-and-program modules'
],finalState:'old-growth'},

{seedId:121,iterations:[
'Graphene properties: single-atom-thick carbon sheet with extreme strength',
'Carbon nanotubes: electrical conductivity and structural applications',
'Metamaterials: engineered structures with properties not found in nature',
'Self-healing materials: microcapsule and vascular network repair systems',
'Aerogel applications: ultralight insulation and filtration from silica',
'Biomimetic materials: spider silk proteins, nacre layering, and lotus effect',
'PNW materials research: PNNL composites, UW nanomaterials, and forestry products',
'Sustainable materials: mycelium composites, bamboo engineering, recycled plastics',
'Cross-reference to chemistry seed for molecular structure foundations',
'Full canopy: advanced materials explorer with 8 application profiles'
],finalState:'old-growth'},

{seedId:122,iterations:[
'CRISPR diagnostics: rapid pathogen detection using gene-editing tools',
'mRNA therapeutics: platform technology beyond vaccines for protein diseases',
'Organ-on-a-chip: microfluidic tissue models replacing animal testing',
'Phage therapy: bacteriophage treatment for antibiotic-resistant infections',
'Precision nutrition: genetic and microbiome-informed dietary guidance',
'Digital twin health: computational models of individual patients',
'PNW health innovation: Adaptive Biotechnologies, Fred Hutch, OHSU research',
'Global health equity: ensuring new technologies reach underserved populations',
'Cross-reference to biomedical seed for medical technology context',
'Full canopy: future medicine survey with 8 breakthrough assessments'
],finalState:'old-growth'},

{seedId:123,iterations:[
'Precision agriculture: GPS-guided planting, variable-rate fertilization',
'Vertical farming: LED-lit stacked growing with controlled environment',
'Cellular agriculture: cultured meat, dairy proteins without animals',
'Gene-edited crops: disease resistance and nutritional enhancement',
'Soil microbiome management: inoculants and biological soil amendments',
'Aquaculture innovation: recirculating systems and offshore ocean farming',
'PNW food innovation: plant-based companies, sustainable fisheries tech',
'Food system resilience: distributed production and regional supply chains',
'Cross-reference to farming seed for traditional agriculture context',
'Full canopy: future food systems explorer with 8 innovation profiles'
],finalState:'old-growth'},

{seedId:124,iterations:[
'Carbon capture: direct air, point source, and ocean-based methods',
'Carbon storage: geological injection, mineralization, and bio-sequestration',
'Rewilding: large-scale ecosystem restoration and wildlife corridors',
'Ocean restoration: kelp farming, artificial reefs, and whale recovery',
'Geoengineering debate: solar radiation management risks and governance',
'Nature-based solutions: wetland restoration, mangrove planting, and agroforestry',
'PNW climate action: forest carbon credits, salmon habitat restoration',
'Climate adaptation: infrastructure, agriculture, and community resilience planning',
'Cross-reference to ecology seed for ecosystem science foundations',
'Full canopy: climate solutions assessment with 8 technology-policy pairs'
],finalState:'old-growth'},

{seedId:125,iterations:[
'Decentralized web: IPFS, blockchain naming, and peer-to-peer hosting',
'Federated social: ActivityPub, AT Protocol, and community governance',
'Zero-knowledge proofs: privacy-preserving verification without disclosure',
'Digital identity: self-sovereign credentials and verifiable presentations',
'Cooperative platforms: worker-owned alternatives to gig economy apps',
'AI governance: open-source models, safety standards, and public oversight',
'PNW digital culture: open source community, privacy advocacy, and mesh networks',
'Digital commons: shared infrastructure for community benefit',
'Cross-reference to trust seed for web-of-trust governance patterns',
'Full canopy: future internet explorer with 8 architecture assessments'
],finalState:'old-growth'},

{seedId:126,iterations:[
'Ocean thermal gradient: energy from temperature differences between surface and deep',
'Wave energy converters: point absorbers, oscillating columns, and overtopping devices',
'Blue carbon: salt marshes, seagrass beds, and mangroves as carbon sinks',
'Deep sea mining: manganese nodules, seafloor vents, and environmental cost',
'Marine protected areas: network design for biodiversity and fisheries recovery',
'Floating cities: seastead design for climate adaptation and governance experiments',
'PNW ocean frontier: offshore wind, wave energy test sites, and marine reserves',
'Ocean literacy: understanding ocean systems as foundation for ocean policy',
'Cross-reference to marine seed for ocean ecosystem science',
'Full canopy: ocean frontier explorer with 8 innovation assessments'
],finalState:'old-growth'},

{seedId:127,iterations:[
'Circular economy mapping: material flows, waste streams, and recovery loops',
'Biomimicry design: nature-inspired solutions for engineering challenges',
'Regenerative agriculture: soil building, biodiversity, and water cycle restoration',
'Urban ecology: green infrastructure, urban forests, and wildlife corridors in cities',
'Indigenous land management: fire stewardship, camas meadows, and forest gardens',
'Systems thinking tools: causal loop diagrams, stock-flow models, and leverage points',
'PNW regenerative projects: watershed restoration, agroforestry, and tribal land returns',
'Design for disassembly: products built to be repaired, reused, and recycled',
'Cross-reference to ecology seed for ecosystem principles',
'Full canopy: regenerative design studio with 8 systems mapping exercises'
],finalState:'old-growth'},

{seedId:128,iterations:[
'Federation protocol: how nodes discover, sync, and resolve conflicts',
'Trust propagation: web-of-trust extending through introductions and vouching',
'Sovereignty spectrum: fully autonomous to fully federated governance options',
'Gift economy dynamics: reciprocity, surplus sharing, and abundance mindset',
'Cultural protocol: respecting local customs while maintaining interoperability',
'Resilience patterns: graceful degradation when nodes go offline',
'PNW federation examples: tribal confederacies, bioregional collaboration, mesh networks',
'The forest as federation: each tree sovereign, all connected through mycelium',
'Cross-reference to trust seed for relationship-based governance patterns',
'Full canopy: federation architecture guide with 8 governance templates'
],finalState:'old-growth'}

];
