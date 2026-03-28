/* ═══════════════════════════════════════════════════════════════
   Seed Growth Data Pass 3 — 128 seeds x 10 final iterations (21-30)
   Final maturation: community testing through graduation
   Builds on seed-growth.js (1-10) and seed-growth-2.js (11-20)
   Every seed reaches old-growth by iteration 30
   ═══════════════════════════════════════════════════════════════ */

var SEED_GROWTH_3 = [

// ═══ GROVE 1: THE OBSERVATORY (1-16) ═══
{seedId:1,iterations:[
'Community beta: 40 testers run the pendulum lab, flagging edge cases in mobile touch input',
'Cross-seed link to spectrum analyzer (seed 2) — pendulum period now feeds wavelength demo',
'Accessibility audit: screen reader narration added for all pendulum motion descriptions',
'Mobile responsive layout: touch gestures replace mouse drag for pendulum angle control',
'i18n pass: labels translated to Spanish, French, Mandarin, Japanese, and Salish placenames',
'Performance tuning: requestAnimationFrame throttled to 30fps on low-power devices',
'Documentation complete: teacher guide with 12 lesson plans mapped to NGSS standards',
'Teaching guide includes 5 formative assessments with rubrics for grades 6-12',
'Assessment rubric: 4-tier proficiency scale for each experiment track (novice to expert)',
'Graduation: pendulum observatory promoted to permanent installation — 5 experiment tracks, 12 lessons, full a11y'
],finalState:'old-growth'},

{seedId:2,iterations:[
'Community beta: astronomers test spectral fingerprinting against real telescope data',
'Cross-seed link to telescope (seed 3) — spectra now overlay live star observations',
'Accessibility audit: high-contrast mode for colorblind users on all spectral displays',
'Mobile optimization: pinch-zoom on spectra, swipe between analysis modes',
'i18n pass: element names and spectral labels in 5 languages plus Lushootseed star names',
'Performance: WebGL fallback to Canvas2D on devices without GPU — no feature loss',
'Documentation: 14-page guide covering spectroscopy from basic prisms to stellar classification',
'Teaching guide: 8 lab activities linking spectrum analysis to PNW light pollution data',
'Assessment rubric: spectral identification accuracy scoring from 50% (novice) to 95% (expert)',
'Graduation: spectrum lab permanent — 7 analysis tools, 8 labs, stellar classification module live'
],finalState:'old-growth'},

{seedId:3,iterations:[
'Community beta: amateur astronomers validate satellite prediction accuracy against Heavens-Above',
'Cross-seed link to spectrum lab (seed 2) — clicking a star shows its spectral class',
'Accessibility: keyboard navigation for all sky objects, audio cues for object magnitude',
'Mobile: gyroscope-driven sky view on phones, tap to identify any visible object',
'i18n: constellation names include Coast Salish, Greek, Arabic, and Chinese traditions',
'Performance: star catalog lazy-loads by magnitude — first paint under 200ms on 3G',
'Documentation: observer\'s guide with seasonal sky maps for 47°N latitude',
'Teaching guide: 6 observation projects from naked-eye to binocular to telescope levels',
'Assessment: light curve analysis rubric — identify variable star type from 10 example curves',
'Graduation: telescope suite permanent — real-time sky, variable stars, spectral overlay, 6 projects'
],finalState:'old-growth'},

{seedId:4,iterations:[
'Community beta: weather enthusiasts compare seismograph output to USGS real-time feeds',
'Cross-seed link to pendulum (seed 1) — seismic waves visualized as pendulum displacement',
'Accessibility: haptic vibration on mobile devices mirrors seismograph trace intensity',
'Mobile: accelerometer input lets users generate their own micro-tremors by tapping the phone',
'i18n: Richter scale descriptions and historical quake names in regional languages',
'Performance: waveform rendering uses OffscreenCanvas for smooth 60fps on desktop',
'Documentation: seismology primer covering P-waves, S-waves, and Cascadia subduction context',
'Teaching guide: 4 activities — build a seismograph, read a seismogram, locate an epicenter, assess risk',
'Assessment: seismogram reading proficiency — locate epicenter within 50km from 3-station data',
'Graduation: seismograph station permanent — real-time display, historical archive, 4 teaching activities'
],finalState:'old-growth'},

{seedId:5,iterations:[
'Community beta: birders validate weather station data against local NOAA observations',
'Cross-seed link to migration (seed 7) — temperature and wind data feed migration timing model',
'Accessibility: all weather data available as structured tables with ARIA live regions',
'Mobile: weather widget mode — single-screen summary optimized for phone home screens',
'i18n: weather terms and Beaufort scale descriptions in 5 languages',
'Performance: data polling reduced to 60-second intervals, cached locally between fetches',
'Documentation: microclimate guide explaining how terrain creates 10°C variation across 1km',
'Teaching guide: 5 weather observation projects with data collection templates',
'Assessment: weather prediction rubric — forecast 24-hour conditions from station data alone',
'Graduation: weather station permanent — real-time display, 5 projects, microclimate guide complete'
],finalState:'old-growth'},

{seedId:6,iterations:[
'Community beta: geology students test mineral identification against hand sample reference',
'Cross-seed link to soil (seed 8) — mineral content maps to soil layer composition',
'Accessibility: texture descriptions for all mineral specimens, audio pronunciation of names',
'Mobile: camera-based mineral color matching — take a photo, get a candidate mineral list',
'i18n: mineral names in English, Latin, and First Nations trade-route terminology',
'Performance: mineral database indexed for sub-100ms search across 200 entries',
'Documentation: field guide to 50 PNW minerals with hand sample identification keys',
'Teaching guide: 6 identification exercises from streak test to hardness to crystal system',
'Assessment: mineral ID proficiency — correctly classify 8/10 unknowns using provided tools',
'Graduation: mineral lab permanent — 200 entries, camera matching, 6 exercises, full field guide'
],finalState:'old-growth'},

{seedId:7,iterations:[
'Community beta: wildlife managers test migration model predictions against banding data',
'Cross-seed link to weather station (seed 5) — departure timing correlates with temperature triggers',
'Accessibility: migration routes described textually with distance and bearing for each segment',
'Mobile: animated migration map runs at 15fps on older phones without dropping frames',
'i18n: species common names in 5 languages, Indigenous seasonal calendar references',
'Performance: SVG path rendering replaced with Canvas for 3x speedup on mobile Safari',
'Documentation: migration ecology primer covering photoperiod, magnetic navigation, stopover sites',
'Teaching guide: 4 projects — track a species, build a phenology calendar, analyze banding data, predict arrivals',
'Assessment: migration timing prediction — estimate arrival date within 1 week for 3 species',
'Graduation: migration map permanent — animated routes, phenology calendar, 4 projects, banding data link'
],finalState:'old-growth'},

{seedId:8,iterations:[
'Community beta: soil scientists validate horizon descriptions against NRCS soil survey data',
'Cross-seed link to mineral lab (seed 6) — soil mineral content links to parent rock geology',
'Accessibility: soil horizon colors described with Munsell notation and plain-language equivalents',
'Mobile: vertical scroll layout replaces horizontal dig animation for narrow screens',
'i18n: soil horizon names and agricultural terms in 5 languages plus traditional land-use terms',
'Performance: soil animation pre-rendered as sprite sheets — 50% less CPU than real-time drawing',
'Documentation: soil formation guide covering climate, organisms, relief, parent material, and time',
'Teaching guide: 5 activities from soil texture by feel to infiltration rate to pH testing',
'Assessment: soil horizon identification rubric — describe and classify 4 horizons from a profile photo',
'Graduation: soil layers permanent — 5 horizons, mineral linkage, 5 activities, NRCS data connection'
],finalState:'old-growth'},

{seedId:9,iterations:[
'Community beta: marine biologists review tide pool species interactions against field data',
'Cross-seed link to pH scale (seed 10) — acidification changes which species appear in pool',
'Accessibility: species icons have alt text with common name, scientific name, and zone',
'Mobile: tap-and-hold species info replaces hover tooltip for touch interfaces',
'i18n: species names in English, Latin, and regional Indigenous coastal vocabulary',
'Performance: idle animation paused when tab hidden — saves 90% CPU in background',
'Documentation: intertidal zone guide with vertical distribution charts for 30 PNW species',
'Teaching guide: 4 field trip activities — zonation survey, species count, quadrat sampling, exposure timing',
'Assessment: zonation prediction — place 10 species in correct zone from organism descriptions alone',
'Graduation: tide pool permanent — 30 species, interactive zonation, 4 field activities, seasonal variation'
],finalState:'old-growth'},

{seedId:10,iterations:[
'Community beta: chemistry teachers test pH visualization accuracy against laboratory standards',
'Cross-seed link to tide pool (seed 9) — adjusting pH shows real-time species survival changes',
'Accessibility: pH scale colors supplemented with pattern fills for colorblind accessibility',
'Mobile: pH slider uses large touch target (48px minimum) with value readout overlay',
'i18n: pH descriptions and ecological consequences translated to 5 languages',
'Performance: species survival calculation cached — recalculates only on pH change, not every frame',
'Documentation: water chemistry guide linking pH to dissolved oxygen, alkalinity, and buffering capacity',
'Teaching guide: 3 labs — measure local water pH, predict species survival, test buffering capacity',
'Assessment: water quality analysis rubric — interpret pH, DO, and temperature data for habitat assessment',
'Graduation: pH scale permanent — species response curves, buffering visualization, 3 labs, full water chemistry guide'
],finalState:'old-growth'},

{seedId:11,iterations:[
'Community beta: naturalists evaluate tree identification accuracy against regional field guides',
'Cross-seed link to soil layers (seed 8) — tree species distributions mapped to soil preferences',
'Accessibility: leaf shape descriptions use tactile analogies for vision-impaired users',
'Mobile: tree ID wizard — answer 5 questions to narrow from 50 species to 3 candidates',
'i18n: tree names in English, Latin, and Coast Salish with pronunciation guides',
'Performance: high-resolution bark photos lazy-loaded only when user zooms in on a species',
'Documentation: tree identification key for 50 PNW species with seasonal identification tips',
'Teaching guide: 4 activities — bark rubbing collection, leaf press, transect survey, canopy estimation',
'Assessment: tree ID proficiency — identify 15/20 species from bark, leaf, or silhouette photos',
'Graduation: tree guide permanent — 50 species, ID wizard, bark gallery, 4 field activities, seasonal tips'
],finalState:'old-growth'},

{seedId:12,iterations:[
'Community beta: mycologists verify fungal identification descriptions against iNaturalist records',
'Cross-seed link to decomposition (seed 14) — fungal species appear in correct log decay stages',
'Accessibility: spore print color descriptions use Pantone-equivalent and plain text names',
'Mobile: fungal ID uses progressive disclosure — overview first, details on tap',
'i18n: mushroom names in 5 languages plus regional foraging tradition terminology',
'Performance: 3D mushroom renders replaced with illustrated SVGs — 80% smaller file size',
'Documentation: fungal ecology guide covering saprophytes, mycorrhizals, parasites, and lichens',
'Teaching guide: 3 activities — spore print collection, mycelium observation, decomposition timeline',
'Assessment: fungal role classification — correctly categorize 10 species by ecological function',
'Graduation: fungal guide permanent — 40 species, spore prints, ecological roles, 3 labs, foraging safety'
],finalState:'old-growth'},

{seedId:13,iterations:[
'Community beta: environmental educators test water quality simulation against real watershed data',
'Cross-seed link to pH (seed 10) and soil (seed 8) — runoff chemistry depends on land use and soil type',
'Accessibility: all watershed health metrics available as data tables with trend descriptions',
'Mobile: simplified watershed view — single-column layout with expandable metric panels',
'i18n: water quality parameters and ecological terms in 5 languages',
'Performance: watershed simulation runs in Web Worker — keeps UI responsive during computation',
'Documentation: watershed health assessment guide with metrics, thresholds, and management actions',
'Teaching guide: 5 activities — map a micro-watershed, measure turbidity, calculate impervious surface, assess riparian buffer',
'Assessment: watershed health report rubric — evaluate a real watershed using 6 provided metrics',
'Graduation: watershed simulator permanent — real-time model, 6 metrics, 5 field activities, management guide'
],finalState:'old-growth'},

{seedId:14,iterations:[
'Community beta: forest ecologists validate decomposition timeline against long-term research plots',
'Cross-seed link to fungal guide (seed 12) — each decay stage shows which fungi are active',
'Accessibility: decomposition stages described with tactile and olfactory sensory language',
'Mobile: timeline scrubber replaces play button — direct access to any decomposition year',
'i18n: decay stage terminology in forestry English, ecology Latin, and 3 additional languages',
'Performance: 400-year timeline pre-computed in 10-year increments — interpolated in real time',
'Documentation: nurse log ecology guide covering CWD classes, carbon cycling, and biodiversity',
'Teaching guide: 3 activities — classify CWD decay stage, measure log dimensions, predict succession',
'Assessment: CWD classification rubric — assign correct decay class to 5 field specimens from photos',
'Graduation: decomposition clock permanent — 400-year timeline, fungal integration, 3 activities, CWD guide'
],finalState:'old-growth'},

{seedId:15,iterations:[
'Community beta: entomologists review insect identification against Pacific Northwest field collections',
'Cross-seed link to food web (seed 16) — each insect\'s trophic connections highlighted in the web',
'Accessibility: insect anatomy diagrams include labeled alt text for every body part',
'Mobile: insect gallery uses card-swipe interface for browsing through 60 species',
'i18n: insect orders and common names in 5 languages with etymology notes',
'Performance: insect illustration sprites combined into single atlas — one HTTP request for all images',
'Documentation: PNW insect orders guide covering 12 orders with representative species',
'Teaching guide: 4 activities — sweep net collection, pitfall trap, light trap survey, pollinator observation',
'Assessment: insect order identification — classify 12/15 specimens to order from photographs',
'Graduation: insect guide permanent — 60 species, anatomy diagrams, food web links, 4 field activities'
],finalState:'old-growth'},

{seedId:16,iterations:[
'Community beta: ecology students run food web simulations and compare to published trophic studies',
'Cross-seed link to insect guide (seed 15) — arthropods are clickable nodes in the food web',
'Accessibility: food web connections described as adjacency list for screen reader traversal',
'Mobile: pinch-zoom on food web with node labels that scale proportionally',
'i18n: species names and trophic level terminology in 5 languages',
'Performance: food web graph layout pre-computed — user interaction only triggers highlighting, not relayout',
'Documentation: food web ecology guide covering trophic levels, energy transfer, and keystone species',
'Teaching guide: 4 activities — build a food web, remove a species, calculate energy transfer, identify keystones',
'Assessment: food web analysis rubric — predict cascade effects of removing 1 species from a 12-species web',
'Graduation: food web permanent — 12 species, cascade simulation, insect integration, 4 activities, keystone analysis'
],finalState:'old-growth'},

// ═══ GROVE 2: THE SOUND GARDEN (17-32) ═══
{seedId:17,iterations:[
'Community beta: music teachers test scale builder against standard tuning references',
'Cross-seed integration with rhythm generator (seed 18) — scales feed rhythmic pattern generator',
'Accessibility: every note has ARIA label with pitch name, octave, and frequency in Hz',
'Mobile: piano keyboard touch targets enlarged to 44px minimum for reliable finger input',
'i18n: scale names include Western, Arabic maqam, Indian raga, and pentatonic traditions',
'Performance: Web Audio oscillators pooled and reused — eliminates click artifacts on note transitions',
'Documentation: scale theory guide from pentatonic through chromatic with interval mathematics',
'Teaching guide: 6 activities — build a major scale, compare modes, find intervals by ear, construct chords',
'Assessment: scale construction rubric — build 5 scales from root note and interval recipe',
'Graduation: scale builder permanent — 24 scale types, chord construction, ear training, 6 activities'
],finalState:'old-growth'},

{seedId:18,iterations:[
'Community beta: percussionists test rhythm accuracy against metronome and DAW grid references',
'Cross-seed link to scale builder (seed 17) — melodic patterns overlay rhythmic sequences',
'Accessibility: rhythm patterns described as text notation (e.g., quarter, eighth, rest)',
'Mobile: tap-to-play mode for creating rhythms by tapping the screen in time',
'i18n: rhythm terminology includes Western notation, Indian tala, West African bell patterns',
'Performance: audio scheduling uses lookahead buffer — zero drift over 10-minute sustained patterns',
'Documentation: rhythm theory guide covering time signatures, polyrhythms, and syncopation',
'Teaching guide: 5 activities — clap a rhythm, layer polyrhythms, transcribe from audio, compose a pattern',
'Assessment: rhythm transcription rubric — notate 8-bar pattern from audio with 90%+ accuracy',
'Graduation: rhythm generator permanent — polyrhythmic layers, notation view, tap input, 5 activities'
],finalState:'old-growth'},

{seedId:19,iterations:[
'Community beta: audio engineers evaluate frequency analyzer against calibrated test tones',
'Cross-seed link to bird call (seed 20) — frequency analysis overlays bird vocalization spectrograms',
'Accessibility: frequency bands described by range and intensity with haptic feedback option',
'Mobile: microphone input mode — analyze ambient sound frequencies through device mic',
'i18n: frequency terminology and musical note equivalents in 5 languages',
'Performance: FFT computed in AudioWorklet — main thread stays responsive during analysis',
'Documentation: acoustics primer covering frequency, amplitude, harmonics, and timbre',
'Teaching guide: 4 activities — identify fundamental frequencies, compare instrument timbres, measure room acoustics, analyze birdsong',
'Assessment: spectrogram reading rubric — identify 5 sound sources from spectrogram alone',
'Graduation: frequency analyzer permanent — real-time FFT, microphone input, spectrogram view, 4 activities'
],finalState:'old-growth'},

{seedId:20,iterations:[
'Community beta: birders verify call identification against Cornell Lab Macaulay Library recordings',
'Cross-seed link to frequency analyzer (seed 19) — each call displayed as labeled spectrogram',
'Accessibility: bird calls described by rhythm, pitch contour, and mnemonic phrase',
'Mobile: bird call quiz mode — listen and choose from 4 species, progressive difficulty',
'i18n: bird names in 5 languages, mnemonic phrases localized to regional expressions',
'Performance: audio files converted to Opus format — 70% smaller than MP3 at equivalent quality',
'Documentation: bird vocalization guide covering songs vs calls, dawn chorus, mimicry, and dialect',
'Teaching guide: 5 activities — morning bird walk, call ID quiz, sonogram drawing, seasonal call calendar',
'Assessment: bird call ID rubric — identify 12/15 species by ear from field recordings',
'Graduation: bird call library permanent — 50 species, spectrogram overlay, quiz mode, 5 field activities'
],finalState:'old-growth'},

{seedId:21,iterations:[
'Community beta: stream ecologists evaluate water sound classification against field recordings',
'Cross-seed link to watershed simulator (seed 13) — stream sounds change with flow volume',
'Accessibility: stream sound types described with flow rate, substrate type, and gradient context',
'Mobile: headphone-optimized stereo imaging for immersive stream sound experience',
'i18n: hydrological terms and stream morphology vocabulary in 5 languages',
'Performance: audio crossfades between stream types use 200ms linear ramp — no audible glitch',
'Documentation: stream acoustics guide — how gradient, substrate, and flow create distinct sounds',
'Teaching guide: 3 activities — classify stream type by sound, estimate flow from audio, map soundscapes',
'Assessment: stream type classification rubric — identify 6 stream types from audio recordings alone',
'Graduation: stream sounds permanent — 12 recordings, flow correlation, soundscape mapping, 3 activities'
],finalState:'old-growth'},

{seedId:22,iterations:[
'Community beta: wind instrument players test resonance tube against physical tube measurements',
'Cross-seed link to weather station (seed 5) — wind speed feeds resonance tube pitch in real time',
'Accessibility: tube length and pitch described numerically with unit conversions available',
'Mobile: blow-into-mic mode uses microphone input to excite virtual resonance tube',
'i18n: instrument acoustics terminology in 5 languages with cultural instrument examples',
'Performance: tube resonance computed analytically — no simulation overhead, instant response',
'Documentation: acoustic resonance guide from closed tubes through open pipes to musical instruments',
'Teaching guide: 4 activities — measure tube resonance, predict harmonics, compare instruments, build a PVC flute',
'Assessment: resonance prediction rubric — calculate fundamental frequency for 5 tube configurations',
'Graduation: resonance tube permanent — variable length, harmonic series, instrument comparison, 4 activities'
],finalState:'old-growth'},

{seedId:23,iterations:[
'Community beta: audio producers compare waveform visualizer output against DAW waveform displays',
'Cross-seed link to frequency analyzer (seed 19) — waveform and spectrum shown simultaneously',
'Accessibility: waveform described as amplitude envelope with peak and RMS values',
'Mobile: touch-draw custom waveforms and hear the result through additive synthesis',
'i18n: waveform terminology (sine, square, sawtooth, triangle) in 5 languages',
'Performance: waveform rendering uses Path2D caching — redraws only on data change',
'Documentation: waveform theory guide from simple sine through Fourier synthesis to complex tones',
'Teaching guide: 4 activities — identify waveform shapes by ear, build complex tones, analyze speech',
'Assessment: waveform identification rubric — match 8 audio samples to their waveform shapes',
'Graduation: waveform visualizer permanent — real-time display, custom wave drawing, Fourier view, 4 activities'
],finalState:'old-growth'},

{seedId:24,iterations:[
'Community beta: music therapists evaluate binaural beat generator against clinical frequency protocols',
'Cross-seed link to rain sounds (seed 21) — nature sounds layer under binaural frequencies',
'Accessibility: frequency difference described in Hz with expected brainwave entrainment range',
'Mobile: background audio mode — binaural beats continue when app is minimized',
'i18n: meditation and focus terminology in 5 languages with cultural mindfulness references',
'Performance: dual oscillators use single AudioContext — battery drain reduced 40% on mobile',
'Documentation: psychoacoustics guide covering binaural beats, isochronal tones, and entrainment',
'Teaching guide: 3 activities — measure focus during different frequencies, compare binaural vs isochronal, journal effects',
'Assessment: frequency selection rubric — choose appropriate binaural frequency for 5 described goals',
'Graduation: binaural generator permanent — frequency control, nature sound layering, focus timer, 3 activities'
],finalState:'old-growth'},

{seedId:25,iterations:[
'Community beta: choir directors verify harmonic series visualization against tuned ensemble recordings',
'Cross-seed link to scale builder (seed 17) — harmonics mapped to scale degree relationships',
'Accessibility: each harmonic described by ordinal number, frequency ratio, and musical interval name',
'Mobile: tap any harmonic to hear it isolated, then in context with the fundamental',
'i18n: harmonic series terminology in 5 languages with cultural instrument examples for each partial',
'Performance: harmonic amplitude calculation uses lookup table — renders 32 partials in under 1ms',
'Documentation: harmonic series guide from fundamentals through overtones to timbre construction',
'Teaching guide: 4 activities — find harmonics on a string, predict overtone frequencies, analyze brass timbre',
'Assessment: harmonic identification rubric — identify which partials are present from spectral display',
'Graduation: harmonic series permanent — 32 partials, timbre construction, instrument comparison, 4 activities'
],finalState:'old-growth'},

{seedId:26,iterations:[
'Community beta: language teachers test vowel space mapper against acoustic phonetics references',
'Cross-seed link to frequency analyzer (seed 19) — vowel formants highlighted on spectral display',
'Accessibility: vowel positions described by tongue height and backness with IPA symbol labels',
'Mobile: real-time microphone vowel tracking — speak and see your vowels plotted on the chart',
'i18n: vowel charts for English, Spanish, French, Mandarin, and Japanese phoneme systems',
'Performance: formant detection algorithm optimized — 15ms latency from microphone to display',
'Documentation: acoustic phonetics guide covering formants, vowel space, and dialectal variation',
'Teaching guide: 3 activities — map your own vowels, compare dialects, analyze singing formants',
'Assessment: vowel identification rubric — place 10 vowels correctly on F1/F2 chart from audio',
'Graduation: vowel space mapper permanent — real-time tracking, 5 language charts, 3 activities, dialect comparison'
],finalState:'old-growth'},

{seedId:27,iterations:[
'Community beta: music producers test ADSR envelope generator against hardware synth measurements',
'Cross-seed link to waveform visualizer (seed 23) — envelope shapes waveform amplitude in real time',
'Accessibility: ADSR values described as milliseconds with plain-language descriptors (snappy, slow, etc.)',
'Mobile: drag corners of ADSR curve directly on touchscreen with 44px hit targets',
'i18n: synthesis terminology in 5 languages with historical instrument context',
'Performance: envelope computation moved to AudioWorklet — zero main-thread audio processing',
'Documentation: synthesis guide from ADSR basics through modulation to subtractive synthesis chains',
'Teaching guide: 4 activities — shape a pluck sound, create a pad, match a target envelope by ear',
'Assessment: envelope design rubric — design ADSR settings for 5 described instrument sounds',
'Graduation: ADSR envelope permanent — visual editor, audio preview, synthesis chain, 4 activities'
],finalState:'old-growth'},

{seedId:28,iterations:[
'Community beta: Doppler shift simulator validated by physics teachers against textbook calculations',
'Cross-seed link to migration map (seed 7) — whale call frequency shifts with simulated approach/recession',
'Accessibility: Doppler shift described numerically with before/after frequency values',
'Mobile: tilt device to control source velocity — accelerometer maps to speed intuitively',
'i18n: Doppler effect terminology and real-world examples in 5 languages',
'Performance: frequency calculation uses closed-form equation — no iterative simulation needed',
'Documentation: Doppler effect guide from ambulance sirens through radar to cosmological redshift',
'Teaching guide: 3 activities — calculate frequency shift, measure shift from audio, connect to redshift',
'Assessment: Doppler calculation rubric — predict observed frequency for 5 source-velocity scenarios',
'Graduation: Doppler simulator permanent — interactive source/observer, audio demo, redshift link, 3 activities'
],finalState:'old-growth'},

{seedId:29,iterations:[
'Community beta: acoustics students verify echo/reverb simulator against measured room impulse responses',
'Cross-seed link to stream sounds (seed 21) — canyon echoes demonstrated with stream recordings',
'Accessibility: reverb parameters described as room dimensions and surface materials in plain language',
'Mobile: tap-to-clap mode — device microphone captures clap, simulator applies room model',
'i18n: acoustic terminology and architectural space types in 5 languages',
'Performance: convolution reverb uses pre-computed 0.5-second impulse responses — 256-sample buffer',
'Documentation: room acoustics guide covering reflection, absorption, RT60, and standing waves',
'Teaching guide: 4 activities — measure RT60 with clap test, compare room shapes, design an ideal space',
'Assessment: room acoustics rubric — predict RT60 within 0.3s for 5 described room configurations',
'Graduation: echo simulator permanent — room modeling, impulse response, RT60 measurement, 4 activities'
],finalState:'old-growth'},

{seedId:30,iterations:[
'Community beta: choir members test interval trainer against piano reference tones',
'Cross-seed link to harmonic series (seed 25) — intervals linked to harmonic relationships',
'Accessibility: intervals described by semitone count, ratio, and characteristic quality descriptor',
'Mobile: ear training quiz delivers one interval per notification for daily practice',
'i18n: interval names in 5 languages with cultural song examples for each interval',
'Performance: audio samples pre-loaded during initialization — zero latency on interval playback',
'Documentation: interval recognition guide from unison through octave with musical context examples',
'Teaching guide: 5 activities — sing intervals, identify by ear, build chords from intervals, dictation',
'Assessment: interval identification rubric — correctly name 12/15 intervals played melodically and harmonically',
'Graduation: interval trainer permanent — 13 intervals, chord builder, daily quiz, 5 activities, ear training log'
],finalState:'old-growth'},

{seedId:31,iterations:[
'Community beta: DJs test beat matching simulator against real-world BPM detection software',
'Cross-seed link to rhythm generator (seed 18) — beat grid aligns to rhythmic pattern output',
'Accessibility: BPM displayed numerically with tempo marking name (Allegro, Andante, etc.)',
'Mobile: tap-tempo BPM detection — tap the screen to set tempo, visual feedback confirms lock',
'i18n: tempo terminology in 5 languages with cultural dance tempo references',
'Performance: BPM detection autocorrelation computed on 2-second window — stable within 0.5 BPM',
'Documentation: tempo and meter guide covering BPM, time signatures, and groove feel',
'Teaching guide: 3 activities — tap tempo matching, crossfade timing, polymetric layering',
'Assessment: tempo matching rubric — synchronize two tracks within 0.5 BPM using only ears',
'Graduation: beat matcher permanent — BPM detection, crossfade simulator, polymetric overlay, 3 activities'
],finalState:'old-growth'},

{seedId:32,iterations:[
'Community beta: sound designers validate spatial audio panner against studio monitor calibration',
'Cross-seed link to echo simulator (seed 29) — spatial positioning includes room reverb model',
'Accessibility: sound position described as clock position (12 o\'clock = front) with distance in meters',
'Mobile: headphone-required stereo panning with gyroscope head tracking on supported devices',
'i18n: spatial audio terminology in 5 languages with cultural spatial sound traditions',
'Performance: HRTF processing uses optimized FIR filters — 128-tap, 48kHz, sub-5ms latency',
'Documentation: spatial audio guide from stereo panning through ambisonics to binaural rendering',
'Teaching guide: 3 activities — pan a sound field, design a 3D soundscape, compare stereo vs binaural',
'Assessment: spatial localization rubric — identify sound source position within 15° from binaural audio',
'Graduation: spatial audio permanent — 3D panner, HRTF rendering, head tracking, 3 activities, soundscape designer'
],finalState:'old-growth'},

// ═══ GROVE 3: THE PATTERN GARDEN (33-48) ═══
{seedId:33,iterations:[
'Community beta: math teachers test fractal generator against published fractal dimension values',
'Cross-seed link to tree branching (seed 34) — L-system rules generate realistic PNW tree silhouettes',
'Accessibility: fractal iteration count and dimension described numerically with complexity descriptors',
'Mobile: pinch-zoom explores fractal detail — progressive rendering adds detail as user zooms',
'i18n: fractal terminology and mathematical notation in 5 languages',
'Performance: fractal rendering uses Web Worker — interface stays responsive during deep iterations',
'Documentation: fractal mathematics guide from self-similarity through dimension to chaos theory',
'Teaching guide: 4 activities — measure coastline with rulers, compute box-counting dimension, design an L-system',
'Assessment: fractal analysis rubric — estimate fractal dimension of 5 natural objects from photographs',
'Graduation: fractal generator permanent — 8 fractal types, L-system editor, dimension calculator, 4 activities'
],finalState:'old-growth'},

{seedId:34,iterations:[
'Community beta: botanists compare L-system tree output against real PNW species branching angles',
'Cross-seed link to fractal generator (seed 33) — tree branching rules are editable L-system grammars',
'Accessibility: branching patterns described as text rules with plain-language growth descriptions',
'Mobile: touch-drag branch angle controls with real-time tree preview update',
'i18n: tree morphology terminology in 5 languages with species-specific growth habit descriptions',
'Performance: L-system string expansion pre-computed — rendering draws from cached geometry',
'Documentation: tree architecture guide covering branching patterns, crown shapes, and growth habits',
'Teaching guide: 3 activities — match L-system parameters to real trees, predict crown shape, model competition',
'Assessment: tree architecture rubric — design L-system rules that match 3 PNW species silhouettes',
'Graduation: tree branching permanent — L-system editor, 10 species presets, competition model, 3 activities'
],finalState:'old-growth'},

{seedId:35,iterations:[
'Community beta: puzzle enthusiasts validate tessellation builder against mathematical tiling proofs',
'Cross-seed link to symmetry explorer (seed 36) — tessellation symmetry groups automatically identified',
'Accessibility: tile shapes described by vertex configuration notation with plain-language equivalents',
'Mobile: drag-and-snap tile placement with magnetic guides for edge alignment',
'i18n: tessellation and symmetry terminology in 5 languages with Islamic art and M.C. Escher references',
'Performance: tile rendering uses instanced drawing — 1000 tiles rendered in a single draw call',
'Documentation: tessellation mathematics guide covering regular, semi-regular, and Penrose tilings',
'Teaching guide: 4 activities — build regular tilings, discover semi-regular tilings, create Escher-style tiles',
'Assessment: tessellation classification rubric — identify symmetry group of 5 provided patterns',
'Graduation: tessellation builder permanent — 17 wallpaper groups, Escher mode, Penrose tiling, 4 activities'
],finalState:'old-growth'},

{seedId:36,iterations:[
'Community beta: art students test symmetry explorer against crystallographic group theory references',
'Cross-seed link to tessellation builder (seed 35) — draw in one cell, symmetry fills the plane',
'Accessibility: symmetry operations described as transforms (rotate 90°, reflect across vertical axis)',
'Mobile: draw with finger — symmetry applied in real time across all equivalent positions',
'i18n: symmetry group names in mathematical notation and 5 languages with cultural pattern examples',
'Performance: symmetry transform matrix pre-computed per group — drawing applies cached transforms',
'Documentation: symmetry guide from bilateral through rotational to the 17 wallpaper groups',
'Teaching guide: 3 activities — find symmetry in nature photos, classify patterns by group, design a symmetric logo',
'Assessment: symmetry identification rubric — correctly classify 8/10 patterns by symmetry group',
'Graduation: symmetry explorer permanent — all 17 groups, freehand drawing, nature photo overlay, 3 activities'
],finalState:'old-growth'},

{seedId:37,iterations:[
'Community beta: statistics students compare histogram builder against R/Python statistical output',
'Cross-seed link to data collector (seed 38) — field measurements flow directly into histogram',
'Accessibility: histogram bins described as ranges with count values, central tendency announced',
'Mobile: camera-scan mode — photograph a data table and auto-populate the histogram',
'i18n: statistical terminology in 5 languages with culturally relevant data set examples',
'Performance: bin calculation and rendering in single requestAnimationFrame — zero flicker on resize',
'Documentation: descriptive statistics guide from mean/median/mode through standard deviation to distributions',
'Teaching guide: 4 activities — collect and histogram 50 leaf lengths, compare distributions, test normality',
'Assessment: distribution analysis rubric — describe shape, center, and spread of 5 data sets from histograms',
'Graduation: histogram builder permanent — auto-binning, distribution overlay, camera input, 4 activities'
],finalState:'old-growth'},

{seedId:38,iterations:[
'Community beta: citizen scientists test field data collector against iNaturalist and eBird protocols',
'Cross-seed link to histogram builder (seed 37) — collected data feeds directly into statistical analysis',
'Accessibility: data entry forms use semantic HTML with label associations and error descriptions',
'Mobile: GPS auto-fill for location, timestamp auto-set, camera for specimen documentation',
'i18n: data collection terms and ecological survey protocols in 5 languages',
'Performance: offline-capable via Service Worker — data cached locally, synced when connection returns',
'Documentation: field survey methods guide covering transects, quadrats, point counts, and mark-recapture',
'Teaching guide: 5 activities — vegetation transect, bird point count, invertebrate sweep, water quality sample, photo survey',
'Assessment: data collection rubric — complete a field survey with correct methodology and clean data entry',
'Graduation: data collector permanent — GPS-tagged entries, offline mode, photo attachment, 5 survey protocols'
],finalState:'old-growth'},

{seedId:39,iterations:[
'Community beta: cartography students evaluate map projection demo against EPSG reference parameters',
'Cross-seed link to migration map (seed 7) — species routes displayed in different projections',
'Accessibility: projection distortion described numerically (area, angle, distance error percentages)',
'Mobile: swipe between projections — each shows the same data with different distortion tradeoffs',
'i18n: projection names and geographic terminology in 5 languages',
'Performance: projection math uses TypedArray for coordinate transforms — 10,000 points in 2ms',
'Documentation: map projection guide from Mercator through Lambert to equal-area with PNW examples',
'Teaching guide: 3 activities — compare Greenland size across projections, measure distortion, choose best projection for task',
'Assessment: projection selection rubric — choose and justify optimal projection for 5 mapping scenarios',
'Graduation: projection demo permanent — 8 projections, distortion visualization, PNW overlay, 3 activities'
],finalState:'old-growth'},

{seedId:40,iterations:[
'Community beta: physics teachers evaluate gravity simulator against analytical orbital mechanics solutions',
'Cross-seed link to tide simulator (seed 9) — gravitational forces drive tidal cycle visualization',
'Accessibility: orbital parameters described numerically with period, eccentricity, and energy values',
'Mobile: flick-to-launch satellite — touch velocity sets initial orbit, gravity does the rest',
'i18n: orbital mechanics terminology in 5 languages with space exploration cultural references',
'Performance: N-body integration uses Verlet method — energy-conserving over arbitrarily long simulations',
'Documentation: gravity and orbits guide from free-fall through Kepler\'s laws to escape velocity',
'Teaching guide: 4 activities — launch a satellite, achieve circular orbit, transfer orbit to new altitude, gravitational slingshot',
'Assessment: orbital mechanics rubric — predict orbital period and velocity for 5 given altitude/mass scenarios',
'Graduation: gravity simulator permanent — N-body engine, orbit designer, Kepler verification, 4 activities'
],finalState:'old-growth'},

{seedId:41,iterations:[
'Community beta: geometry teachers verify compass-and-straightedge constructions against Euclid references',
'Cross-seed link to symmetry explorer (seed 36) — constructions produce symmetric figures automatically',
'Accessibility: construction steps narrated with compass-point and straightedge-edge descriptions',
'Mobile: two-finger compass gesture and single-finger straightedge for natural geometric construction',
'i18n: geometric terminology in 5 languages with Euclidean proposition numbering',
'Performance: intersection computation uses exact arithmetic — no floating-point error accumulation',
'Documentation: geometric construction guide from angle bisection through golden ratio to impossible constructions',
'Teaching guide: 5 activities — bisect angle, construct perpendicular, inscribe hexagon, construct golden rectangle',
'Assessment: construction proficiency rubric — complete 5 constructions using only compass and straightedge',
'Graduation: construction tool permanent — compass, straightedge, midpoint, intersection, 5 construction challenges'
],finalState:'old-growth'},

{seedId:42,iterations:[
'Community beta: probability teachers validate Monte Carlo simulator against analytical solutions',
'Cross-seed link to histogram builder (seed 37) — simulation results automatically histogrammed',
'Accessibility: probability outcomes described as fractions, decimals, and plain-language likelihood',
'Mobile: shake device to roll dice or flip coins — accelerometer triggers random events',
'i18n: probability terminology and game-of-chance names in 5 languages',
'Performance: 100,000 simulation trials run in Web Worker — results stream to UI progressively',
'Documentation: probability guide from counting to conditional probability to Bayesian reasoning',
'Teaching guide: 4 activities — birthday paradox, Monty Hall, random walk, Monte Carlo area estimation',
'Assessment: probability reasoning rubric — correctly solve 5 probability problems with justification',
'Graduation: Monte Carlo simulator permanent — dice/coins/cards, 100K trials, distribution display, 4 activities'
],finalState:'old-growth'},

{seedId:43,iterations:[
'Community beta: coding teachers test cellular automaton against Wolfram rule reference tables',
'Cross-seed link to fire spread (seed 44) — forest fire modeled as probabilistic cellular automaton',
'Accessibility: cell states described as text grid with neighborhood rule tables available as data',
'Mobile: tap cells to toggle initial state, run simulation with play/pause/step controls',
'i18n: cellular automaton terminology in 5 languages with Conway\'s Game of Life cultural references',
'Performance: grid update uses bitwise operations on Uint8Array — 1 million cells updated per frame',
'Documentation: cellular automata guide from 1D rules through Game of Life to Turing completeness',
'Teaching guide: 3 activities — explore Wolfram rules, design a Game of Life pattern, model forest fire',
'Assessment: automaton analysis rubric — predict 5-step evolution of 3 initial configurations by hand',
'Graduation: cellular automaton permanent — 1D and 2D rules, pattern library, forest fire model, 3 activities'
],finalState:'old-growth'},

{seedId:44,iterations:[
'Community beta: network analysts verify graph theory visualizer against NetworkX reference implementations',
'Cross-seed link to food web (seed 16) — trophic networks displayed as directed graphs with metrics',
'Accessibility: graph described as node list and edge list with degree and centrality values',
'Mobile: drag nodes to rearrange layout, pinch to zoom, double-tap for node details',
'i18n: graph theory terminology in 5 languages with social network and ecological examples',
'Performance: force-directed layout uses Barnes-Hut approximation — handles 500 nodes at 60fps',
'Documentation: graph theory guide from paths and cycles through trees to network centrality measures',
'Teaching guide: 4 activities — build a friendship graph, find shortest path, identify bridges, measure centrality',
'Assessment: graph analysis rubric — compute degree, betweenness, and identify bridges for 5 example graphs',
'Graduation: graph visualizer permanent — force layout, centrality metrics, food web overlay, 4 activities'
],finalState:'old-growth'},

{seedId:45,iterations:[
'Community beta: art students validate color theory wheel against Munsell and Pantone references',
'Cross-seed link to spectrum lab (seed 2) — visible spectrum maps to color wheel positions',
'Accessibility: colors described by hue name, saturation percentage, and brightness percentage',
'Mobile: camera color picker — point at any object and see its position on the color wheel',
'i18n: color names in 5 languages with cultural color symbolism notes',
'Performance: color space conversion uses pre-computed lookup table — instant HSL/RGB/CMYK display',
'Documentation: color theory guide from primary colors through complementary schemes to color harmony',
'Teaching guide: 4 activities — mix complementary pairs, design a palette, analyze a painting\'s color scheme',
'Assessment: color scheme rubric — create harmonious palettes for 5 given design scenarios',
'Graduation: color wheel permanent — harmony rules, camera picker, palette generator, 4 activities'
],finalState:'old-growth'},

{seedId:46,iterations:[
'Community beta: physics teachers verify wave interference demo against analytical superposition solutions',
'Cross-seed link to ripple tank (seed 47) — wave patterns from point sources demonstrate interference',
'Accessibility: interference pattern described as node/antinode positions with numerical spacing',
'Mobile: tap to place wave sources, spread fingers to adjust frequency — visual interference updates live',
'i18n: wave terminology in 5 languages with musical and optical interference examples',
'Performance: wave amplitude computed with SIMD-style loop unrolling — handles 4 sources at 60fps',
'Documentation: wave physics guide from single waves through superposition to diffraction and interference',
'Teaching guide: 4 activities — create constructive interference, find nodes, verify Young\'s equation',
'Assessment: interference prediction rubric — calculate node positions for 5 two-source configurations',
'Graduation: wave interference permanent — multi-source, frequency control, node visualization, 4 activities'
],finalState:'old-growth'},

{seedId:47,iterations:[
'Community beta: optics students validate ripple tank patterns against physical ripple tank photos',
'Cross-seed link to wave interference (seed 46) — ripple tank as 2D wave interference visualizer',
'Accessibility: wave pattern described as concentric rings with spacing and amplitude values',
'Mobile: drag finger to create continuous wave source — velocity controls frequency',
'i18n: wave optics terminology in 5 languages with water wave and light wave parallels',
'Performance: 2D wave equation solved on GPU via WebGL fragment shader — real-time at full resolution',
'Documentation: ripple tank physics guide covering reflection, refraction, diffraction, and interference',
'Teaching guide: 3 activities — demonstrate Huygens\' principle, measure wavelength, verify Snell\'s law with water waves',
'Assessment: wave behavior rubric — predict wave pattern for 5 barrier/aperture configurations',
'Graduation: ripple tank permanent — GPU-accelerated, barrier editor, measurement tools, 3 activities'
],finalState:'old-growth'},

{seedId:48,iterations:[
'Community beta: math teachers verify golden ratio explorer against phi computations to 50 decimal places',
'Cross-seed link to fractal generator (seed 33) and tree branching (seed 34) — phi in nature examples',
'Accessibility: ratio values described to 4 decimal places with geometric and natural examples',
'Mobile: camera overlay — grid showing golden ratio rectangles over live camera feed',
'i18n: golden ratio references in 5 languages with cultural architecture and art examples',
'Performance: golden spiral rendering uses single bezier curve approximation — visually perfect at all scales',
'Documentation: golden ratio guide from Fibonacci through phi to applications in art, architecture, and nature',
'Teaching guide: 4 activities — measure phi in pinecones, construct golden rectangle, analyze Renaissance compositions',
'Assessment: golden ratio identification rubric — find and verify phi in 5 natural and artificial objects',
'Graduation: golden ratio permanent — spiral overlay, Fibonacci sequence, camera mode, 4 activities'
],finalState:'old-growth'},

// ═══ GROVE 4: THE STORY CIRCLE (49-64) ═══
{seedId:49,iterations:[
'Community beta: writing teachers test story arc visualizer against published narrative structure analyses',
'Cross-seed integration with character builder (seed 50) — character arcs overlay plot structure',
'Accessibility: story beats described as sequential steps with emotional valence labels',
'Mobile: swipe through story phases with expandable detail panels for each beat',
'i18n: narrative terminology in 5 languages with cultural storytelling tradition examples',
'Performance: arc visualization uses SVG paths — scales perfectly to any screen resolution',
'Documentation: narrative structure guide from three-act to hero\'s journey to kishotenketsu',
'Teaching guide: 4 activities — map a folk tale, identify climax in a film, compare structures across cultures',
'Assessment: narrative analysis rubric — correctly identify structure type and 5 beats in a given story',
'Graduation: story arc permanent — 5 structure templates, beat mapping, comparative view, 4 activities'
],finalState:'old-growth'},

{seedId:50,iterations:[
'Community beta: novelists test character development tracker against published characterization frameworks',
'Cross-seed link to story arc (seed 49) — character growth points align with plot structure beats',
'Accessibility: character traits listed with descriptors and development stage labels',
'Mobile: character card view — swipe between characters with relationship lines shown on tap',
'i18n: characterization terminology in 5 languages with archetypal pattern translations',
'Performance: relationship graph computed once on data change — cached between renders',
'Documentation: character development guide covering flat/round, static/dynamic, and archetypal patterns',
'Teaching guide: 3 activities — analyze a protagonist, map character relationships, track character change across chapters',
'Assessment: characterization rubric — evaluate depth, consistency, and arc of 3 characters in a given text',
'Graduation: character tracker permanent — trait graph, relationship map, arc alignment, 3 activities'
],finalState:'old-growth'},

{seedId:51,iterations:[
'Community beta: poets test meter scanner against hand-scanned anthology poems',
'Cross-seed link to rhythm generator (seed 18) — poetic meter displayed as musical rhythm notation',
'Accessibility: stressed/unstressed syllables announced with audio stress pattern playback',
'Mobile: tap syllables to mark stress pattern, app identifies meter and suggests foot type',
'i18n: metrical terminology in 5 languages with cultural poetic tradition examples',
'Performance: syllable detection uses lightweight rule engine — no network call required for scanning',
'Documentation: prosody guide from iambic through spondee to free verse with audio examples',
'Teaching guide: 4 activities — scan a sonnet, identify meter in song lyrics, write in given meters',
'Assessment: metrical scanning rubric — correctly scan 5 lines of verse identifying foot type and count',
'Graduation: meter scanner permanent — auto-scan, audio playback, foot identification, 4 activities'
],finalState:'old-growth'},

{seedId:52,iterations:[
'Community beta: debate coaches evaluate logical fallacy identifier against critical thinking textbooks',
'Cross-seed link to argument mapper (seed 53) — fallacies highlighted within argument structure',
'Accessibility: each fallacy described with name, definition, example, and correction strategy',
'Mobile: fallacy flash cards with swipe-to-reveal definition and real-world example',
'i18n: fallacy names in English, Latin, and 3 additional languages with localized examples',
'Performance: fallacy database indexed by keyword — sub-50ms search across 40 fallacy types',
'Documentation: informal logic guide covering 40 common fallacies with real-world examples and corrections',
'Teaching guide: 4 activities — identify fallacies in editorials, construct valid arguments, debate with fallacy scoring',
'Assessment: fallacy identification rubric — correctly name and explain 8/10 fallacies in provided arguments',
'Graduation: fallacy identifier permanent — 40 fallacies, flash cards, argument integration, 4 activities'
],finalState:'old-growth'},

{seedId:53,iterations:[
'Community beta: philosophy students test argument mapper against Toulmin model textbook diagrams',
'Cross-seed link to fallacy identifier (seed 52) — weak links in arguments flagged as potential fallacies',
'Accessibility: argument components described as claim, evidence, warrant with structural relationships',
'Mobile: drag-and-drop argument building with snap-to-grid component placement',
'i18n: argumentation terminology in 5 languages with cultural reasoning tradition references',
'Performance: argument graph layout uses Dagre algorithm — handles 30-node arguments at 60fps',
'Documentation: argumentation guide from Toulmin through syllogism to dialectic with mapping exercises',
'Teaching guide: 3 activities — map a persuasive essay, identify unstated warrants, evaluate evidence quality',
'Assessment: argument mapping rubric — construct complete Toulmin diagram for 3 provided arguments',
'Graduation: argument mapper permanent — Toulmin model, visual builder, fallacy integration, 3 activities'
],finalState:'old-growth'},

{seedId:54,iterations:[
'Community beta: history teachers verify timeline builder against primary source chronologies',
'Cross-seed link to tree ring reader (seed 4) — ecological timelines overlay historical events',
'Accessibility: events described with date, duration, significance, and causal connections',
'Mobile: pinch-zoom timeline with decade/century/millennium scale levels',
'i18n: historical events and period names in 5 languages with regional calendar system options',
'Performance: timeline rendering virtualizes off-screen events — handles 10,000 events smoothly',
'Documentation: chronological thinking guide covering periodization, causation, and historiography',
'Teaching guide: 4 activities — build a personal timeline, parallel timelines, causal chain analysis',
'Assessment: chronological reasoning rubric — correctly sequence and causally connect 10 historical events',
'Graduation: timeline builder permanent — zoomable, parallel tracks, causal links, 4 activities'
],finalState:'old-growth'},

{seedId:55,iterations:[
'Community beta: geography teachers evaluate landform identifier against USGS topographic references',
'Cross-seed link to soil layers (seed 8) — landform geology linked to soil formation processes',
'Accessibility: landform shapes described with dimensional measurements and formation process narratives',
'Mobile: AR mode — point camera at terrain and see landform type overlay with formation explanation',
'i18n: geomorphological terms in 5 languages with Indigenous place-name etymologies where appropriate',
'Performance: landform image classifier runs client-side using TensorFlow Lite — no server dependency',
'Documentation: geomorphology guide covering erosional, depositional, volcanic, and tectonic landforms',
'Teaching guide: 4 activities — classify landforms from topo maps, predict erosion patterns, model deposition',
'Assessment: landform identification rubric — correctly classify 10 landforms from photographs and topo maps',
'Graduation: landform identifier permanent — image classifier, topo overlay, formation animations, 4 activities'
],finalState:'old-growth'},

{seedId:56,iterations:[
'Community beta: art history students validate perspective grid tool against Renaissance painting analyses',
'Cross-seed link to golden ratio (seed 48) — compositional grids combine perspective with phi ratios',
'Accessibility: vanishing points and horizon lines described with coordinates and angular measurements',
'Mobile: draw directly on photos — perspective grid snaps to detected architectural lines',
'i18n: perspective terminology in 5 languages with art historical period examples',
'Performance: perspective line rendering uses GPU-accelerated Canvas — smooth even with dense grids',
'Documentation: linear perspective guide from one-point through three-point with foreshortening and atmospheric perspective',
'Teaching guide: 3 activities — draw in one-point perspective, analyze a painting\'s vanishing points, photograph converging lines',
'Assessment: perspective drawing rubric — create accurate one-point and two-point perspective drawings',
'Graduation: perspective tool permanent — 1/2/3 point, photo overlay, composition grid, 3 activities'
],finalState:'old-growth'},

{seedId:57,iterations:[
'Community beta: economics teachers verify supply-and-demand simulator against textbook equilibrium calculations',
'Cross-seed link to population graph (seed 16) — predator-prey oscillations as economic supply-demand analog',
'Accessibility: price and quantity described numerically with surplus/shortage indicators',
'Mobile: drag supply and demand curves directly with finger — equilibrium updates in real time',
'i18n: economics terminology in 5 languages with local market examples',
'Performance: equilibrium calculation is closed-form — instant update on any curve change',
'Documentation: microeconomics primer covering supply, demand, equilibrium, elasticity, and externalities',
'Teaching guide: 4 activities — find equilibrium, model a price floor, estimate elasticity, analyze externalities',
'Assessment: market analysis rubric — predict price/quantity changes for 5 described market shifts',
'Graduation: supply-demand simulator permanent — curve editor, elasticity calculator, externality model, 4 activities'
],finalState:'old-growth'},

{seedId:58,iterations:[
'Community beta: circuit hobby community tests Ohm\'s Law simulator against multimeter measurements',
'Cross-seed link to frequency analyzer (seed 19) — AC circuits visualized as frequency-dependent impedance',
'Accessibility: circuit values described as voltage, current, and resistance with unit labels',
'Mobile: snap-together circuit components with finger drag — values auto-calculate on connection',
'i18n: electrical terminology in 5 languages with SI unit prefixes explained',
'Performance: circuit solver uses modified nodal analysis — handles 20 components in under 1ms',
'Documentation: basic circuits guide from Ohm\'s Law through Kirchhoff\'s laws to RC/RL circuits',
'Teaching guide: 4 activities — build a series circuit, measure parallel resistance, charge a capacitor, build a voltage divider',
'Assessment: circuit analysis rubric — calculate voltage, current, and power for 5 circuit configurations',
'Graduation: circuit simulator permanent — component library, auto-solver, Kirchhoff verification, 4 activities'
],finalState:'old-growth'},

{seedId:59,iterations:[
'Community beta: genetics students verify Punnett square tool against textbook cross results',
'Cross-seed link to population dynamics (seed 16) — allele frequencies tracked across generations',
'Accessibility: genotype ratios described as fractions with phenotype descriptions in plain language',
'Mobile: drag alleles to gamete positions — offspring grid fills automatically',
'i18n: genetics terminology in 5 languages with agricultural breeding tradition examples',
'Performance: multi-gene crosses computed combinatorially — 3-gene cross (64 outcomes) in under 1ms',
'Documentation: genetics primer from Mendel through dihybrid crosses to linked genes and epistasis',
'Teaching guide: 4 activities — mono/dihybrid crosses, test cross, linked genes, population genetics simulation',
'Assessment: genetics problem rubric — predict phenotype ratios for 5 crosses with justification',
'Graduation: Punnett square permanent — multi-gene, linkage, population sim, 4 activities'
],finalState:'old-growth'},

{seedId:60,iterations:[
'Community beta: chemistry students validate periodic table explorer against IUPAC data sheets',
'Cross-seed link to spectrum lab (seed 2) — element emission spectra shown on periodic table selection',
'Accessibility: element data read as structured properties with group/period position descriptions',
'Mobile: periodic table zoomable with tap-for-details and swipe between element cards',
'i18n: element names in 5 languages with discovery history and etymology',
'Performance: element data loaded as single JSON — 118 elements with 15 properties each in 12KB',
'Documentation: periodic trends guide covering electronegativity, ionization energy, radius, and reactivity',
'Teaching guide: 4 activities — predict properties from position, compare groups, identify unknowns from properties',
'Assessment: periodic trends rubric — correctly predict 5 elemental properties from group/period position',
'Graduation: periodic table permanent — trend visualization, spectral link, property predictor, 4 activities'
],finalState:'old-growth'},

{seedId:61,iterations:[
'Community beta: philosophy students test ethics scenario simulator against published thought experiments',
'Cross-seed link to argument mapper (seed 53) — ethical arguments mapped in Toulmin structure',
'Accessibility: scenarios described with stakeholders, consequences, and ethical framework labels',
'Mobile: swipe between ethical frameworks applied to the same scenario for instant comparison',
'i18n: ethical terms and philosophical traditions in 5 languages with cultural case studies',
'Performance: scenario branching tree pre-computed — instant navigation between consequence paths',
'Documentation: ethics primer from utilitarianism through deontology to virtue ethics and care ethics',
'Teaching guide: 4 activities — analyze a trolley problem variant, compare frameworks, debate with structured roles',
'Assessment: ethical reasoning rubric — apply 3 frameworks to a novel scenario with justified conclusion',
'Graduation: ethics simulator permanent — 12 scenarios, framework comparison, argument integration, 4 activities'
],finalState:'old-growth'},

{seedId:62,iterations:[
'Community beta: astronomy students validate solar system model against JPL Horizons ephemeris data',
'Cross-seed link to gravity simulator (seed 40) — planet orbits computed by the same N-body engine',
'Accessibility: orbital parameters described numerically with scale comparisons to familiar distances',
'Mobile: pinch-zoom from inner planets to Kuiper Belt with smooth scale transitions',
'i18n: planet names in 5 languages with cultural mythology references for each world',
'Performance: orbit pre-computed for 100-year span — playback is pure rendering, no physics per frame',
'Documentation: solar system guide from Kepler\'s laws through planet formation to current exploration',
'Teaching guide: 4 activities — verify Kepler\'s third law, compare inner/outer planets, predict conjunction dates',
'Assessment: orbital mechanics rubric — calculate orbital period and velocity for 5 solar system bodies',
'Graduation: solar system model permanent — accurate orbits, Kepler verification, exploration timeline, 4 activities'
],finalState:'old-growth'},

{seedId:63,iterations:[
'Community beta: geography teachers validate climate zone mapper against Koppen classification maps',
'Cross-seed link to biome builder (seed 10) — temperature and rainfall set climate zone automatically',
'Accessibility: climate zones described by temperature range, precipitation pattern, and vegetation type',
'Mobile: location-aware — shows your current Koppen zone with local climate data on launch',
'i18n: climate terminology in 5 languages with regional climate descriptions',
'Performance: Koppen classification computed from two inputs — zero lookup tables needed',
'Documentation: climate classification guide covering Koppen, Thornthwaite, and bioclimatic variables',
'Teaching guide: 3 activities — classify local climate, compare hemispheres, predict zone shifts under warming',
'Assessment: climate classification rubric — correctly classify 5 locations from temperature/precipitation data',
'Graduation: climate zone mapper permanent — Koppen classifier, location awareness, shift prediction, 3 activities'
],finalState:'old-growth'},

{seedId:64,iterations:[
'Community beta: writing students test vocabulary builder against corpus frequency and readability indices',
'Cross-seed link to meter scanner (seed 51) — word-level analysis feeds into prosody scanning',
'Accessibility: word definitions, etymology, and usage examples read with proper pronunciation',
'Mobile: daily word notification with contextual sentence and etymology note',
'i18n: vocabulary roots traced through Latin, Greek, Germanic, and Indigenous language families',
'Performance: dictionary lookup uses prefix trie — sub-10ms search across 15,000 entries',
'Documentation: vocabulary acquisition guide covering morphology, etymology, context clues, and spaced repetition',
'Teaching guide: 4 activities — root word analysis, context clue inference, word family mapping, etymology tracing',
'Assessment: vocabulary proficiency rubric — correctly use 15/20 target words in original sentences with context',
'Graduation: vocabulary builder permanent — 15,000 words, etymology tracing, daily practice, spaced repetition, 4 activities'
],finalState:'old-growth'},

// ═══ GROVE 5: THE WORKSHOP (65-80) ═══
{seedId:65,iterations:[
'Community beta: woodworkers validate joint strength calculator against engineering reference tables',
'Cross-seed link to tree guide (seed 11) — wood species properties feed joint strength calculation',
'Accessibility: joint types described with load ratings and application suitability in plain language',
'Mobile: AR overlay — point camera at a joint and see stress distribution visualization',
'i18n: joinery terminology in 5 languages with traditional woodworking culture references',
'Performance: stress calculation uses analytical beam theory — instant results for all standard joints',
'Documentation: wood joinery guide from butt joints through dovetails to Japanese joinery with PNW wood species',
'Teaching guide: 3 activities — compare joint strengths, design a stool, calculate load capacity',
'Assessment: joinery selection rubric — choose and justify optimal joint type for 5 furniture design scenarios',
'Graduation: joinery guide permanent — 20 joint types, strength calculator, species database, 3 activities'
],finalState:'old-growth'},

{seedId:66,iterations:[
'Community beta: weavers verify loom pattern generator against handwoven sample drafts',
'Cross-seed link to tessellation builder (seed 35) — weave patterns are tessellations on a grid',
'Accessibility: weave patterns described as lift plans with text-based draft notation',
'Mobile: tap grid cells to toggle warp/weft — pattern preview updates in real time',
'i18n: weaving terminology in 5 languages with Coast Salish and Scandinavian traditions',
'Performance: pattern repeat detection uses autocorrelation — identifies repeat unit automatically',
'Documentation: weaving guide from plain weave through twill to overshot with PNW fiber traditions',
'Teaching guide: 3 activities — draft a twill, design a color-and-weave pattern, analyze a traditional blanket',
'Assessment: weave drafting rubric — create correct draft notation for 5 provided woven samples',
'Graduation: loom pattern permanent — draft editor, color preview, repeat finder, 3 activities'
],finalState:'old-growth'},

{seedId:67,iterations:[
'Community beta: potters validate glaze chemistry calculator against fired test tile results',
'Cross-seed link to periodic table (seed 60) — glaze oxides linked to element properties',
'Accessibility: glaze recipes described as oxide percentages with firing temperature ranges',
'Mobile: slider-based recipe adjustment with real-time unity formula recalculation',
'i18n: ceramic terminology in 5 languages with cultural pottery tradition references',
'Performance: unity formula calculation uses matrix operations — instant for any recipe change',
'Documentation: glaze chemistry guide from base oxides through unity formula to atmospheric effects',
'Teaching guide: 3 activities — calculate a unity formula, adjust a recipe for cone 6, predict glaze surface from chemistry',
'Assessment: glaze chemistry rubric — formulate a stable glaze for 3 target properties (matte, glossy, crystalline)',
'Graduation: glaze calculator permanent — recipe editor, unity formula, firing schedule, 3 activities'
],finalState:'old-growth'},

{seedId:68,iterations:[
'Community beta: printmakers test registration alignment tool against physical proof measurements',
'Cross-seed link to color wheel (seed 45) — CMYK separation preview for multi-color prints',
'Accessibility: registration marks described with coordinates and alignment instructions',
'Mobile: camera alignment — photograph print layers and check registration digitally',
'i18n: printmaking terminology in 5 languages with cultural print tradition references',
'Performance: image overlay uses CSS mix-blend-mode — no canvas computation for layer preview',
'Documentation: relief printmaking guide from single-color through reduction to multi-block registration',
'Teaching guide: 3 activities — carve a single-color block, plan a 3-color reduction, register a 2-block print',
'Assessment: print registration rubric — achieve less than 1mm registration error in a 3-color print',
'Graduation: print registration permanent — multi-layer preview, camera check, color separation, 3 activities'
],finalState:'old-growth'},

{seedId:69,iterations:[
'Community beta: basketmakers validate materials calculator against traditional harvest measurements',
'Cross-seed link to weaving (seed 66) — basket weave structures share pattern notation with loom weaving',
'Accessibility: material quantities described by weight, length, and strand count with harvest timing',
'Mobile: project calculator — enter basket dimensions, get material list with harvest calendar',
'i18n: basketry terminology in 5 languages with PNW Indigenous material names and harvest protocols',
'Performance: material calculation is geometric — closed-form based on basket dimensions and weave density',
'Documentation: PNW basketry guide covering materials, harvesting ethics, preparation, and weave structures',
'Teaching guide: 3 activities — identify basket materials in the field, calculate needed materials, weave a small basket',
'Assessment: basketry planning rubric — create complete materials list and harvest plan for a specified basket form',
'Graduation: basketry guide permanent — material calculator, harvest calendar, weave reference, 3 activities'
],finalState:'old-growth'},

{seedId:70,iterations:[
'Community beta: naturalists test plant dye color predictor against actual dye bath results',
'Cross-seed link to color wheel (seed 45) — plant dye colors mapped to color theory positions',
'Accessibility: dye colors described by Munsell notation with fiber and mordant effect descriptions',
'Mobile: color swatch gallery with tap-for-recipe showing plant, mordant, fiber, and process',
'i18n: dye plant names in 5 languages with traditional dyeing culture references',
'Performance: color prediction uses empirical lookup table — indexed by plant, mordant, and fiber type',
'Documentation: natural dye guide covering 20 PNW dye plants with mordant chemistry and light-fastness',
'Teaching guide: 3 activities — dye with onion skins, compare mordants, test light-fastness over 2 weeks',
'Assessment: dye prediction rubric — predict resulting color for 5 plant/mordant/fiber combinations',
'Graduation: dye guide permanent — 20 plants, mordant chemistry, color predictor, 3 activities'
],finalState:'old-growth'},

{seedId:71,iterations:[
'Community beta: blacksmiths validate heat treatment calculator against metallurgical reference data',
'Cross-seed link to mineral lab (seed 6) — ore mineralogy linked to metal extraction chemistry',
'Accessibility: temperatures described in Celsius and Fahrenheit with color-based heat indicators',
'Mobile: timer function — set target temperature, app alerts when hold time is complete',
'i18n: metallurgy terminology in 5 languages with historical smithing tradition references',
'Performance: phase diagram lookup uses interpolated table — continuous output from discrete data',
'Documentation: basic metallurgy guide covering iron-carbon phases, hardening, tempering, and annealing',
'Teaching guide: 3 activities — identify heat colors, calculate tempering temperature, compare quench media',
'Assessment: heat treatment rubric — prescribe correct heat treatment for 5 target steel properties',
'Graduation: heat treatment guide permanent — phase diagram, tempering calculator, timer, 3 activities'
],finalState:'old-growth'},

{seedId:72,iterations:[
'Community beta: rope makers verify cordage calculator against tensile test data for natural fibers',
'Cross-seed link to basketry (seed 69) — fiber preparation techniques shared between cordage and basketry',
'Accessibility: rope specifications described by diameter, lay, and breaking strength in plain units',
'Mobile: twist calculator — enter fiber type and desired diameter, get twist rate and ply count',
'i18n: cordage terminology in 5 languages with traditional rope-making culture references',
'Performance: strength calculation uses empirical power law — instant for any fiber/diameter combination',
'Documentation: cordage guide from fiber preparation through twisting to splicing with PNW plant fibers',
'Teaching guide: 3 activities — twist a 2-ply cord, compare fiber strengths, splice a loop',
'Assessment: cordage design rubric — specify construction for 5 target load applications with safety factor',
'Graduation: cordage guide permanent — fiber database, twist calculator, strength predictor, 3 activities'
],finalState:'old-growth'},

{seedId:73,iterations:[
'Community beta: solar enthusiasts validate sundial calculator against NOAA solar position data',
'Cross-seed link to moon phases (seed 3) — sundial and lunar calendar displayed together',
'Accessibility: hour lines described by angle from noon line with correction factors stated',
'Mobile: AR sundial — hold phone upright and see shadow time overlay on camera feed',
'i18n: sundial terminology in 5 languages with cultural timekeeping tradition references',
'Performance: solar position algorithm runs in under 0.1ms — handles 1-minute resolution for full year',
'Documentation: sundial science guide from hour angle through equation of time to analemma',
'Teaching guide: 3 activities — build a horizontal sundial, verify equation of time, photograph the analemma',
'Assessment: sundial design rubric — calculate hour line angles for 3 sundial types at a given latitude',
'Graduation: sundial permanent — latitude-adjusted, equation of time, AR mode, analemma plotter, 3 activities'
],finalState:'old-growth'},

{seedId:74,iterations:[
'Community beta: fermenters validate pH and temperature curves against published fermentation kinetics',
'Cross-seed link to pH scale (seed 10) — fermentation pH changes contextualized in water chemistry',
'Accessibility: fermentation stages described with sensory cues (smell, taste, visual indicators)',
'Mobile: fermentation log — photograph and timestamp each check, app plots curves automatically',
'i18n: fermentation terminology in 5 languages with cultural fermented food traditions',
'Performance: kinetic model uses Michaelis-Menten equation — continuous curve from discrete measurements',
'Documentation: fermentation science guide covering microbial metabolism, pH control, and temperature management',
'Teaching guide: 3 activities — ferment sauerkraut, track pH over 14 days, compare temperature effects',
'Assessment: fermentation monitoring rubric — diagnose fermentation state from pH, temperature, and sensory data',
'Graduation: fermentation tracker permanent — logging app, kinetic model, diagnostic guide, 3 activities'
],finalState:'old-growth'},

{seedId:75,iterations:[
'Community beta: seed savers validate germination rate tracker against USDA seed viability standards',
'Cross-seed link to seed germination (seed 9) — germination conditions linked to specific species requirements',
'Accessibility: germination data presented as tables with percentage, date, and conditions clearly labeled',
'Mobile: seed packet scanner — photograph packet, app logs variety and expected germination rate',
'i18n: seed saving terminology in 5 languages with cultural seed-keeping tradition references',
'Performance: germination curve fitting uses logistic regression — predicts final rate from 7-day data',
'Documentation: seed saving guide covering harvest timing, drying, storage, and viability testing for 30 PNW species',
'Teaching guide: 3 activities — test germination rate, compare storage methods, build a seed library catalog',
'Assessment: seed viability rubric — correctly predict germination percentage from test data for 5 seed lots',
'Graduation: seed tracker permanent — variety database, germination predictor, storage guide, 3 activities'
],finalState:'old-growth'},

{seedId:76,iterations:[
'Community beta: composters validate temperature and C:N ratio calculator against compost science literature',
'Cross-seed link to decomposition clock (seed 14) — composting as accelerated decomposition analog',
'Accessibility: compost metrics described with target ranges and corrective action recommendations',
'Mobile: compost log — photograph pile, log temperature and turning dates, app tracks progress',
'i18n: composting terminology in 5 languages with cultural soil-building tradition references',
'Performance: C:N calculation is arithmetic — instant result from ingredient list with cached material values',
'Documentation: compost science guide covering microbiology, C:N ratio, temperature phases, and troubleshooting',
'Teaching guide: 3 activities — build a hot compost pile, track temperature curve, diagnose common problems',
'Assessment: compost management rubric — prescribe corrections for 5 described compost pile symptoms',
'Graduation: compost tracker permanent — C:N calculator, temperature log, diagnostic guide, 3 activities'
],finalState:'old-growth'},

{seedId:77,iterations:[
'Community beta: orienteers validate compass and map tools against surveyed benchmark coordinates',
'Cross-seed link to map projection (seed 39) — compass bearings correct for magnetic declination',
'Accessibility: bearings described as degrees from north with cardinal direction equivalents',
'Mobile: device compass integration — phone compass calibrated against known landmarks',
'i18n: navigation terminology in 5 languages with traditional wayfinding method references',
'Performance: bearing calculation is trigonometric — sub-millisecond for any two coordinate pairs',
'Documentation: land navigation guide covering map reading, compass use, triangulation, and GPS basics',
'Teaching guide: 4 activities — take a bearing, triangulate position, navigate to a waypoint, create a sketch map',
'Assessment: navigation proficiency rubric — navigate a 5-waypoint course within 10m accuracy using map and compass',
'Graduation: navigation tools permanent — compass, bearing calculator, triangulation, GPS overlay, 4 activities'
],finalState:'old-growth'},

{seedId:78,iterations:[
'Community beta: weather observers validate cloud identification tool against WMO cloud atlas standards',
'Cross-seed link to weather station (seed 5) — cloud type feeds short-term weather prediction model',
'Accessibility: cloud types described by altitude, shape, and associated weather with visual analogy',
'Mobile: camera cloud identifier — photograph clouds, app suggests genus and weather forecast',
'i18n: cloud names in 5 languages with cultural weather lore references',
'Performance: cloud classifier uses lightweight CNN model — runs in under 100ms on mobile devices',
'Documentation: cloud identification guide covering 10 genera with altitude, composition, and weather significance',
'Teaching guide: 3 activities — photograph and classify 10 cloud types, predict weather from clouds, build a cloud journal',
'Assessment: cloud identification rubric — correctly classify 8/10 cloud photographs by genus',
'Graduation: cloud guide permanent — camera classifier, weather prediction, journal mode, 3 activities'
],finalState:'old-growth'},

{seedId:79,iterations:[
'Community beta: first aid instructors validate wilderness medicine guide against NOLS/WMA protocols',
'Cross-seed link to navigation tools (seed 77) — evacuation planning uses map and distance tools',
'Accessibility: medical protocols described in numbered steps with decision tree navigation',
'Mobile: offline-first — entire guide cached locally for use without cell service',
'i18n: medical terminology in 5 languages with wilderness-specific vocabulary translations',
'Performance: decision tree navigation uses pre-computed graph — instant branching on any response',
'Documentation: wilderness first aid guide covering patient assessment, wound care, splinting, hypothermia, and evacuation criteria',
'Teaching guide: 4 activities — patient assessment scenarios, splinting practice, hypothermia prevention, evacuation planning',
'Assessment: wilderness first aid rubric — correctly triage and treat 5 simulated wilderness medical scenarios',
'Graduation: wilderness medicine permanent — offline protocols, decision trees, evacuation planner, 4 activities'
],finalState:'old-growth'},

{seedId:80,iterations:[
'Community beta: shelter builders validate structural load calculator against engineering timber span tables',
'Cross-seed link to tree guide (seed 11) and joinery (seed 65) — species strength feeds structural calculation',
'Accessibility: load capacities described in kilograms with safety factor and span limitations in plain language',
'Mobile: AR shelter overlay — point camera at available materials, see suggested structure dimensions',
'i18n: shelter construction terminology in 5 languages with cultural dwelling tradition references',
'Performance: span calculation uses NDS timber design equations — handles any species and grade combination',
'Documentation: wilderness shelter guide from emergency debris hut through lean-to to permanent cabin with PNW timber properties',
'Teaching guide: 3 activities — build a debris shelter, calculate ridge beam span, assess existing structure safety',
'Assessment: shelter design rubric — design and justify structural members for 3 shelter configurations with load calculations',
'Graduation: shelter guide permanent — span calculator, species strength database, AR preview, 3 activities'
],finalState:'old-growth'},

// ═══ GROVE 6: THE NAVIGATION TOWER (81-96) ═══
{seedId:81,iterations:[
'Community beta: astronomy students validate star chart accuracy against Stellarium and USNO data',
'Cross-seed link to telescope (seed 3) — star chart feeds observation planning with altitude and azimuth',
'Accessibility: star positions described by constellation, magnitude, and cardinal direction at given time',
'Mobile: gyroscope star chart — hold phone to sky, see star labels overlaid on camera view',
'i18n: star names in 5 languages with cultural constellation traditions from 4 civilizations',
'Performance: star catalog renders 2,000 stars using instanced WebGL points — 60fps on mobile',
'Documentation: stellar navigation guide from Polaris through circumpolar constellations to seasonal star identification',
'Teaching guide: 4 activities — find Polaris, trace 5 constellations, determine latitude from star altitude, plan an observation session',
'Assessment: star identification rubric — identify 15 stars and 8 constellations from a clear-sky photograph',
'Graduation: star chart permanent — 2,000 stars, gyroscope view, observation planner, 4 activities'
],finalState:'old-growth'},

{seedId:82,iterations:[
'Community beta: sailors validate tidal prediction tool against NOAA tide tables for PNW stations',
'Cross-seed link to tide cycles installation (new-installations-2, #3) — same harmonic model, deeper resolution',
'Accessibility: tide heights and times described numerically with current type labels',
'Mobile: widget mode — next high/low tide displayed on phone lock screen',
'i18n: tidal terminology in 5 languages with traditional coastal calendar references',
'Performance: harmonic prediction uses 37 tidal constituents — matches NOAA accuracy within 5cm',
'Documentation: tidal science guide from lunar mechanics through harmonic analysis to tidal current prediction',
'Teaching guide: 3 activities — predict tides from lunar position, compare spring/neap, plan a beach excursion',
'Assessment: tide prediction rubric — predict high/low times within 30 minutes for 5 dates using lunar data alone',
'Graduation: tide predictor permanent — 37-constituent model, current prediction, lock-screen widget, 3 activities'
],finalState:'old-growth'},

{seedId:83,iterations:[
'Community beta: meteorologists validate barometric pressure trend tool against weather station archives',
'Cross-seed link to weather station (seed 5) — pressure trend feeds 12-hour weather forecast model',
'Accessibility: pressure trends described as rising/falling/steady with forecast implications in plain language',
'Mobile: background pressure monitoring using device barometer — alerts on rapid pressure drops',
'i18n: barometric terminology in 5 languages with traditional weather prediction lore',
'Performance: pressure logging uses IndexedDB — stores 30 days of 5-minute readings in under 500KB',
'Documentation: barometric forecasting guide from pressure systems through fronts to local wind patterns',
'Teaching guide: 3 activities — log pressure for a week, correlate with weather, predict tomorrow\'s conditions',
'Assessment: pressure forecasting rubric — correctly predict weather change direction for 5 pressure curve scenarios',
'Graduation: pressure tool permanent — device barometer, trend analysis, forecast model, 3 activities'
],finalState:'old-growth'},

{seedId:84,iterations:[
'Community beta: geologists validate rock cycle simulator against petrological reference sequences',
'Cross-seed link to mineral lab (seed 6) and soil layers (seed 8) — minerals and soils contextualized in rock cycle',
'Accessibility: rock cycle stages described with transformation conditions and example rock types',
'Mobile: tap any rock type to see all pathways leading to and from it in the cycle diagram',
'i18n: petrological terms in 5 languages with PNW geological province examples',
'Performance: cycle diagram uses pre-computed SVG paths — zero runtime calculation for navigation',
'Documentation: rock cycle guide covering igneous, sedimentary, and metamorphic processes with PNW examples',
'Teaching guide: 3 activities — classify 10 hand samples, trace a rock\'s cycle history, map local geology',
'Assessment: rock cycle rubric — trace the complete cycle path for 5 described geological scenarios',
'Graduation: rock cycle permanent — interactive diagram, sample classification, local geology overlay, 3 activities'
],finalState:'old-growth'},

{seedId:85,iterations:[
'Community beta: biologists validate dichotomous key builder against published regional species keys',
'Cross-seed link to tree guide (seed 11) and insect guide (seed 15) — keys built from existing species data',
'Accessibility: key couplets read as binary choices with clear distinguishing feature descriptions',
'Mobile: step-by-step key navigation with back button to revise choices at any point',
'i18n: taxonomic and identification terms in 5 languages with regional species name variants',
'Performance: key traversal uses binary tree — O(log n) steps to any identification in the database',
'Documentation: identification key design guide covering dichotomous, polytomous, and matrix key formats',
'Teaching guide: 3 activities — use a key to identify 10 specimens, build a key for 8 local species, test a peer\'s key',
'Assessment: key construction rubric — build a functional dichotomous key for 10 provided organisms',
'Graduation: key builder permanent — visual editor, species database, testing mode, 3 activities'
],finalState:'old-growth'},

{seedId:86,iterations:[
'Community beta: physics students validate projectile motion simulator against high-speed video data',
'Cross-seed link to gravity simulator (seed 40) — projectile trajectories computed by same physics engine',
'Accessibility: trajectory described with launch angle, velocity, range, and maximum height as numbers',
'Mobile: flick-to-launch interface — finger swipe angle and speed set initial conditions',
'i18n: kinematics terminology in 5 languages with sports and military ballistics examples',
'Performance: trajectory computed analytically for no-drag case — numerical integration for drag model',
'Documentation: projectile motion guide from basic kinematics through air resistance to ballistic curves',
'Teaching guide: 3 activities — maximize range, hit a target, compare with/without air resistance',
'Assessment: projectile calculation rubric — predict landing point for 5 launch angle/velocity combinations',
'Graduation: projectile simulator permanent — drag model, target practice, trajectory comparison, 3 activities'
],finalState:'old-growth'},

{seedId:87,iterations:[
'Community beta: ecologists validate population dynamics model against published long-term population data',
'Cross-seed link to food web (seed 16) — species populations drive food web interaction strengths',
'Accessibility: population curves described with phase (growth, peak, crash) and current values',
'Mobile: parameter sliders with real-time population graph update and phase portrait view',
'i18n: population ecology terms in 5 languages with wildlife management context',
'Performance: Lotka-Volterra ODE solved with 4th-order Runge-Kutta — stable over 1000-generation runs',
'Documentation: population dynamics guide from exponential growth through logistic to predator-prey oscillation',
'Teaching guide: 4 activities — model exponential growth, find carrying capacity, simulate predator-prey, test harvesting strategies',
'Assessment: population modeling rubric — predict population trajectory for 5 parameter configurations',
'Graduation: population dynamics permanent — multi-species model, phase portraits, harvesting simulator, 4 activities'
],finalState:'old-growth'},

{seedId:88,iterations:[
'Community beta: chemistry teachers validate reaction rate simulator against published kinetics data',
'Cross-seed link to periodic table (seed 60) — reactant properties linked to element characteristics',
'Accessibility: reaction progress described numerically with concentration, rate, and energy values',
'Mobile: shake-to-increase-temperature — accelerometer maps to thermal energy input',
'i18n: chemical kinetics terminology in 5 languages with everyday reaction examples',
'Performance: rate equation computed analytically for first/second order — numerical for complex mechanisms',
'Documentation: reaction kinetics guide from rate laws through activation energy to catalysis and equilibrium',
'Teaching guide: 3 activities — measure rate vs concentration, determine reaction order, test a catalyst',
'Assessment: kinetics analysis rubric — determine rate law and predict rate for 5 experimental data sets',
'Graduation: reaction rate permanent — rate law calculator, Arrhenius plotter, catalyst comparison, 3 activities'
],finalState:'old-growth'},

{seedId:89,iterations:[
'Community beta: physics students validate simple harmonic motion tool against spring-mass lab data',
'Cross-seed link to pendulum lab (seed 1) — SHM principles shared between pendulum and spring systems',
'Accessibility: oscillation described with period, amplitude, and phase values with motion phase names',
'Mobile: pull-and-release spring interaction — drag mass down, release to start oscillation',
'i18n: oscillation terminology in 5 languages with musical and mechanical vibration examples',
'Performance: SHM computed analytically — exact solution, no numerical integration error',
'Documentation: oscillation guide from Hooke\'s law through resonance to damped and driven oscillation',
'Teaching guide: 4 activities — measure spring constant, verify period formula, demonstrate resonance, compare damping',
'Assessment: SHM analysis rubric — predict period and amplitude for 5 spring-mass configurations',
'Graduation: SHM simulator permanent — spring-mass, damping control, resonance demo, energy conservation, 4 activities'
],finalState:'old-growth'},

{seedId:90,iterations:[
'Community beta: biology students validate photosynthesis simulator against measured gas exchange data',
'Cross-seed link to carbon counter (new-installations-1, #7) — photosynthesis rates feed forest carbon budget',
'Accessibility: gas exchange rates described numerically with light intensity and CO2 concentration values',
'Mobile: light meter integration — device ambient light sensor feeds simulator input in real time',
'i18n: photosynthesis terminology in 5 languages with agricultural productivity context',
'Performance: light response curve computed from Michaelis-Menten model — smooth curve from 3 parameters',
'Documentation: photosynthesis guide from light reactions through Calvin cycle to C3/C4/CAM pathways',
'Teaching guide: 3 activities — measure light response, compare sun and shade leaves, estimate forest productivity',
'Assessment: photosynthesis analysis rubric — interpret light response curves for 5 plant species',
'Graduation: photosynthesis permanent — light response model, gas exchange simulator, productivity calculator, 3 activities'
],finalState:'old-growth'},

{seedId:91,iterations:[
'Community beta: naturalists test phenology tracker against USA-NPN national phenology network data',
'Cross-seed link to migration timing (seed 7) — animal and plant phenology displayed together',
'Accessibility: phenological events described with date ranges and environmental trigger descriptions',
'Mobile: photo-journal mode — photograph the same plant weekly, app tracks phenological progression',
'i18n: phenology terms in 5 languages with cultural seasonal calendar traditions',
'Performance: phenology database uses DateRange index — sub-50ms query for any species/date combination',
'Documentation: phenology guide from day-length triggers through thermal accumulation to climate change impacts',
'Teaching guide: 4 activities — track 5 species across a season, calculate growing degree days, compare years',
'Assessment: phenology prediction rubric — predict bloom dates within 1 week for 5 species from temperature data',
'Graduation: phenology tracker permanent — species calendar, photo journal, GDD calculator, 4 activities'
],finalState:'old-growth'},

{seedId:92,iterations:[
'Community beta: stream ecologists validate macroinvertebrate index calculator against EPT reference data',
'Cross-seed link to water quality (seed 13) — invertebrate community composition indicates stream health',
'Accessibility: taxa described with tolerance values, functional feeding group, and habitat preferences',
'Mobile: field collection mode — tap to count specimens by taxon, app calculates index in real time',
'i18n: aquatic ecology terms in 5 languages with regional biomonitoring protocol references',
'Performance: index calculation is arithmetic — instant result from taxa counts with pre-stored tolerance values',
'Documentation: biomonitoring guide from specimen collection through identification to index calculation and interpretation',
'Teaching guide: 3 activities — collect a kick sample, identify to order, calculate and interpret EPT index',
'Assessment: biomonitoring rubric — correctly calculate and interpret stream health index from provided specimen data',
'Graduation: biomonitoring tool permanent — taxa database, field counter, index calculator, interpretation guide, 3 activities'
],finalState:'old-growth'},

{seedId:93,iterations:[
'Community beta: cartographers validate contour map reader against USGS 7.5-minute quadrangles',
'Cross-seed link to landform identifier (seed 55) — contour patterns reveal landform type automatically',
'Accessibility: terrain described by elevation range, slope steepness, and landform classification',
'Mobile: 3D terrain view from contour data — tilt device to change viewing angle',
'i18n: topographic terminology in 5 languages with traditional terrain navigation vocabulary',
'Performance: contour rendering uses marching squares on DEM grid — renders 100x100 grid in 10ms',
'Documentation: topographic map reading guide from contour intervals through slope calculation to profile drawing',
'Teaching guide: 4 activities — calculate slope, draw a cross-section, identify features from contours, plan a trail route',
'Assessment: contour reading rubric — correctly interpret elevation, slope, and landform for 5 map excerpts',
'Graduation: contour map permanent — DEM viewer, profile tool, slope calculator, 3D view, 4 activities'
],finalState:'old-growth'},

{seedId:94,iterations:[
'Community beta: physics students verify optics bench simulator against measured focal lengths and image positions',
'Cross-seed link to wave interference (seed 46) — light behavior connects wave and ray optics',
'Accessibility: lens and mirror parameters described with focal length, object/image distances, and magnification',
'Mobile: AR lens — hold phone camera up, see simulated lens/mirror effects overlaid on real image',
'i18n: optics terminology in 5 languages with historical optical instrument references',
'Performance: ray tracing uses thin lens equation — exact analytical solution, zero iteration needed',
'Documentation: geometric optics guide from reflection through refraction to lens systems and optical instruments',
'Teaching guide: 4 activities — find focal length, verify thin lens equation, build a telescope, analyze a camera lens',
'Assessment: optics analysis rubric — predict image position and magnification for 5 lens/mirror configurations',
'Graduation: optics bench permanent — ray tracer, lens editor, image predictor, instrument builder, 4 activities'
],finalState:'old-growth'},

{seedId:95,iterations:[
'Community beta: ecology students validate succession model against chronosequence field data',
'Cross-seed link to nurse log (seed 14) — succession stages mapped to decomposition timeline',
'Accessibility: succession stages described with dominant species, time range, and disturbance context',
'Mobile: time scrubber — drag to move through centuries of succession on a single landscape',
'i18n: succession ecology terms in 5 languages with regional habitat restoration examples',
'Performance: succession model uses state machine — deterministic transitions with stochastic disturbance events',
'Documentation: ecological succession guide from primary through secondary to climax community with PNW examples',
'Teaching guide: 3 activities — predict succession on bare rock, compare primary vs secondary, model fire reset',
'Assessment: succession prediction rubric — correctly sequence community stages for 5 disturbance/site combinations',
'Graduation: succession model permanent — 200-year simulator, disturbance triggers, species tracking, 3 activities'
],finalState:'old-growth'},

{seedId:96,iterations:[
'Community beta: physics teachers verify thermodynamics simulator against calorimetry lab measurements',
'Cross-seed link to reaction rate (seed 88) — temperature changes drive reaction kinetics',
'Accessibility: thermal values described as numbers with unit conversions between Celsius, Fahrenheit, Kelvin',
'Mobile: device temperature sensor integration where available — ambient conditions feed simulation',
'i18n: thermodynamics terminology in 5 languages with everyday heat transfer examples',
'Performance: heat transfer computed analytically for conduction/convection — numerical for radiation',
'Documentation: thermodynamics guide from heat transfer through first and second laws to entropy',
'Teaching guide: 4 activities — measure specific heat, calculate heat transfer, demonstrate entropy, analyze an engine cycle',
'Assessment: thermodynamics rubric — predict equilibrium temperature for 5 heat transfer scenarios',
'Graduation: thermodynamics permanent — heat transfer calculator, entropy demonstrator, engine cycle analyzer, 4 activities'
],finalState:'old-growth'},

// ═══ GROVE 7: THE ARCHIVE (97-112) ═══
{seedId:97,iterations:[
'Community beta: librarians validate citation generator against APA, MLA, and Chicago style manuals',
'Cross-seed link to argument mapper (seed 53) — cited sources linked as evidence nodes in argument structure',
'Accessibility: citation fields labeled with format-specific requirements and example entries',
'Mobile: camera scan of book barcode auto-populates citation fields from ISBN database',
'i18n: citation format conventions in 5 languages with regional academic style preferences',
'Performance: citation formatting is template-based — instant generation from structured metadata',
'Documentation: citation guide covering APA 7, MLA 9, Chicago 17, and scientific journal formats',
'Teaching guide: 3 activities — cite 10 sources in APA, convert to MLA, create an annotated bibliography',
'Assessment: citation accuracy rubric — produce error-free citations in 3 formats for 10 provided sources',
'Graduation: citation generator permanent — 4 formats, barcode scanner, annotated bibliography mode, 3 activities'
],finalState:'old-growth'},

{seedId:98,iterations:[
'Community beta: journalists validate fact-checking framework against established fact-check organization protocols',
'Cross-seed link to fallacy identifier (seed 52) — claims checked for logical fallacies alongside factual accuracy',
'Accessibility: fact-check process described as numbered steps with decision criteria at each stage',
'Mobile: share-to-check mode — share any article URL and get source credibility assessment',
'i18n: media literacy terminology in 5 languages with regional news ecosystem examples',
'Performance: source credibility lookup uses cached database — instant assessment for 5,000 known sources',
'Documentation: fact-checking guide covering source evaluation, claim verification, and lateral reading techniques',
'Teaching guide: 4 activities — check 5 claims, evaluate source credibility, compare coverage across outlets, trace a rumor',
'Assessment: fact-checking rubric — correctly verify or refute 5 claims with documented evidence chain',
'Graduation: fact-check tool permanent — source database, claim tracker, evidence chain builder, 4 activities'
],finalState:'old-growth'},

{seedId:99,iterations:[
'Community beta: archivists validate preservation assessment tool against SAA professional standards',
'Cross-seed link to timeline builder (seed 54) — archived materials placed in chronological context',
'Accessibility: preservation conditions described with temperature, humidity, and light thresholds',
'Mobile: environment monitor — device sensors log storage condition data with alert thresholds',
'i18n: archival terminology in 5 languages with cultural heritage preservation context',
'Performance: environmental log uses circular buffer — stores 90 days of hourly data in 50KB',
'Documentation: preservation guide covering paper, photographic, digital, and textile materials with PNW climate considerations',
'Teaching guide: 3 activities — assess an object\'s condition, design a storage environment, create a preservation plan',
'Assessment: preservation assessment rubric — correctly evaluate condition and prescribe storage for 5 material types',
'Graduation: preservation tool permanent — condition assessor, environment monitor, storage guide, 3 activities'
],finalState:'old-growth'},

{seedId:100,iterations:[
'Community beta: data analysts validate spreadsheet fundamentals trainer against Excel/Sheets function reference',
'Cross-seed link to histogram builder (seed 37) — spreadsheet data feeds directly into statistical visualization',
'Accessibility: cell references described by column letter and row number with formula components explained',
'Mobile: formula builder with tap-to-insert function names and cell references',
'i18n: spreadsheet terminology and function names in 5 languages with locale-specific number formatting',
'Performance: formula parser uses recursive descent — handles nested functions to depth 10 in under 1ms',
'Documentation: spreadsheet fundamentals guide from cell references through formulas to pivot tables and charts',
'Teaching guide: 4 activities — build a budget, create a grade calculator, analyze a dataset, build a dashboard',
'Assessment: spreadsheet proficiency rubric — build a functional model for 3 provided data analysis scenarios',
'Graduation: spreadsheet trainer permanent — formula practice, function reference, data analysis templates, 4 activities'
],finalState:'old-growth'},

{seedId:101,iterations:[
'Community beta: programmers validate code sandbox against language specification test suites',
'Cross-seed link to cellular automaton (seed 43) — code sandbox used to implement custom automata rules',
'Accessibility: code editor supports screen reader with line-by-line navigation and syntax announcements',
'Mobile: simplified editor with auto-indent and syntax highlighting optimized for phone keyboards',
'i18n: programming concepts explained in 5 languages with pseudocode conventions for each',
'Performance: code execution sandboxed in Web Worker with 5-second timeout — prevents infinite loops',
'Documentation: programming fundamentals guide covering variables, loops, functions, and data structures',
'Teaching guide: 4 activities — draw with loops, build a calculator, sort a list, simulate an ecosystem',
'Assessment: programming rubric — write working solutions for 5 problems of increasing complexity',
'Graduation: code sandbox permanent — JavaScript/Python, syntax highlighting, output console, 4 activities'
],finalState:'old-growth'},

{seedId:102,iterations:[
'Community beta: designers validate grid system tool against Bootstrap and Material Design specifications',
'Cross-seed link to perspective tool (seed 56) — layout grid and perspective grid share alignment principles',
'Accessibility: grid dimensions described numerically with gutter, column, and margin values',
'Mobile: overlay grid on any webpage — toggle grid visibility to check alignment in real time',
'i18n: graphic design terminology in 5 languages with typographic tradition references',
'Performance: grid overlay uses CSS variables — zero JavaScript computation for display changes',
'Documentation: grid system guide from golden section through modular grids to responsive breakpoints',
'Teaching guide: 3 activities — design a page layout, compare grid systems, create a responsive grid',
'Assessment: layout design rubric — create layouts on a 12-column grid for 3 content scenarios',
'Graduation: grid system permanent — modular grid builder, responsive preview, alignment checker, 3 activities'
],finalState:'old-growth'},

{seedId:103,iterations:[
'Community beta: linguists validate sentence diagramming tool against traditional Reed-Kellogg references',
'Cross-seed link to meter scanner (seed 51) — diagrammed sentences link to prosodic analysis',
'Accessibility: sentence components described as part-of-speech with grammatical function labels',
'Mobile: drag-and-drop word placement onto diagram skeleton with snap-to-position guides',
'i18n: grammatical terminology in 5 languages with typological comparison examples',
'Performance: diagram layout uses Dagre — handles 30-word sentences at interactive frame rates',
'Documentation: sentence analysis guide from parts of speech through phrases to clauses and complex sentences',
'Teaching guide: 4 activities — diagram simple sentences, identify clause types, analyze complex sentences, compare languages',
'Assessment: sentence diagramming rubric — correctly diagram 5 sentences of increasing syntactic complexity',
'Graduation: sentence diagrammer permanent — visual editor, auto-suggestion, complexity analysis, 4 activities'
],finalState:'old-growth'},

{seedId:104,iterations:[
'Community beta: music teachers verify note reading trainer against ABRSM and RCM sight-reading standards',
'Cross-seed link to scale builder (seed 17) — note reading exercises generated from scale patterns',
'Accessibility: notes described by letter name, octave, and staff position with audio playback',
'Mobile: daily sight-reading exercise notification with progressive difficulty tracking',
'i18n: note naming conventions in 5 languages (fixed-do, movable-do, letter name systems)',
'Performance: note rendering uses custom SVG font — crisp at any zoom level without rasterization',
'Documentation: music notation guide from staff and clef through key signatures to time signatures and dynamics',
'Teaching guide: 4 activities — read notes on treble clef, add bass clef, read rhythms, sight-read a melody',
'Assessment: sight-reading rubric — correctly identify pitch and rhythm for 20 measures at grade-appropriate level',
'Graduation: note reader permanent — progressive exercises, daily practice, dual clef, rhythm integration, 4 activities'
],finalState:'old-growth'},

{seedId:105,iterations:[
'Community beta: exercise scientists validate fitness tracker against published MET tables and VO2 data',
'Cross-seed link to hibernation prep (seed 22 analog) — energy budget concepts from bear metabolism applied to human fitness',
'Accessibility: exercise metrics described with activity type, intensity level, and caloric expenditure',
'Mobile: step counter and heart rate integration via device sensors where available',
'i18n: fitness terminology in 5 languages with cultural physical activity traditions',
'Performance: MET calculation is table lookup + multiplication — instant for any activity/duration/weight',
'Documentation: exercise physiology guide covering energy systems, heart rate zones, and training principles',
'Teaching guide: 3 activities — calculate daily energy expenditure, design a training plan, track progress over 4 weeks',
'Assessment: fitness planning rubric — design evidence-based training plans for 3 described fitness goals',
'Graduation: fitness tracker permanent — MET calculator, heart rate zones, training planner, 3 activities'
],finalState:'old-growth'},

{seedId:106,iterations:[
'Community beta: math teachers validate unit converter against NIST reference conversion factors',
'Cross-seed link to all measurement seeds — unit conversion available as utility across every installation',
'Accessibility: conversion results described with full unit names, abbreviations, and dimensional analysis',
'Mobile: type-as-you-go conversion — result updates with every keystroke, no submit button needed',
'i18n: measurement systems in 5 languages including metric, imperial, and traditional units',
'Performance: conversion factors stored as ratios — exact arithmetic prevents floating-point error accumulation',
'Documentation: measurement and units guide covering SI system, dimensional analysis, and unit conversion strategy',
'Teaching guide: 3 activities — convert between systems, verify with dimensional analysis, design a unit conversion chain',
'Assessment: unit conversion rubric — correctly convert 10 quantities across measurement systems with dimensional analysis shown',
'Graduation: unit converter permanent — 200 units, dimensional analysis checker, conversion chain builder, 3 activities'
],finalState:'old-growth'},

{seedId:107,iterations:[
'Community beta: geography teachers validate coordinate system tool against GPS receiver measurements',
'Cross-seed link to navigation tools (seed 77) — coordinate formats interconvert for map and compass work',
'Accessibility: coordinates described in degrees-minutes-seconds and decimal degrees with hemisphere labels',
'Mobile: GPS coordinate display with one-tap format switching between DMS, DD, and UTM',
'i18n: coordinate terminology in 5 languages with regional datum and projection references',
'Performance: coordinate conversion uses exact trigonometric formulas — sub-microsecond per conversion',
'Documentation: coordinate systems guide from latitude/longitude through UTM to local grid systems with datum explanation',
'Teaching guide: 3 activities — convert between coordinate formats, plot coordinates on a map, calculate distance between points',
'Assessment: coordinate proficiency rubric — correctly convert and plot 5 coordinate pairs in 3 different formats',
'Graduation: coordinate tool permanent — format converter, distance calculator, datum transformer, 3 activities'
],finalState:'old-growth'},

{seedId:108,iterations:[
'Community beta: writing teachers validate paragraph structure analyzer against composition textbook models',
'Cross-seed link to argument mapper (seed 53) — paragraph claims link to argument structure positions',
'Accessibility: paragraph elements labeled with function (topic sentence, evidence, analysis, transition)',
'Mobile: highlight-to-tag interface — select text and tap to label its structural function',
'i18n: composition terminology in 5 languages with rhetorical tradition references',
'Performance: text analysis uses lightweight NLP heuristics — no server call, runs entirely in browser',
'Documentation: paragraph writing guide from topic sentences through evidence integration to conclusions',
'Teaching guide: 4 activities — identify paragraph elements, revise weak paragraphs, write from outline, peer review',
'Assessment: paragraph writing rubric — evaluate structure, coherence, and development of 5 student paragraphs',
'Graduation: paragraph analyzer permanent — structural tagger, revision suggestions, peer review mode, 4 activities'
],finalState:'old-growth'},

{seedId:109,iterations:[
'Community beta: artists validate proportion guide against classical and contemporary figure drawing references',
'Cross-seed link to golden ratio (seed 48) — proportional relationships linked to phi ratios where applicable',
'Accessibility: proportions described as head-count ratios with numerical measurements and visual guides',
'Mobile: camera overlay — photograph a figure and see proportion grid overlaid on the image',
'i18n: figure proportion terminology in 5 languages with cultural artistic canon references',
'Performance: proportion grid calculated from single measurement (head height) — all others derived automatically',
'Documentation: figure proportion guide covering classical canons, age-based proportion changes, and foreshortening',
'Teaching guide: 3 activities — measure proportions from life, compare canons, draw from proportion grid',
'Assessment: proportion drawing rubric — produce anatomically proportional figure drawings from reference',
'Graduation: proportion guide permanent — camera overlay, canon comparison, age slider, 3 activities'
],finalState:'old-growth'},

{seedId:110,iterations:[
'Community beta: educators validate learning style questionnaire against validated psychometric instruments',
'Cross-seed link to all teaching guides — suggested learning path adapts to identified preferences',
'Accessibility: questions and results described with clear answer options and interpretation guidance',
'Mobile: 5-minute assessment with immediate results and personalized study strategy suggestions',
'i18n: learning theory terminology in 5 languages with cultural educational tradition references',
'Performance: questionnaire scoring is instant — weighted sum computed client-side from response array',
'Documentation: metacognition guide covering learning strategies, study habits, self-assessment, and growth mindset',
'Teaching guide: 3 activities — complete self-assessment, design a study plan, track study effectiveness over 2 weeks',
'Assessment: metacognitive awareness rubric — demonstrate evidence-based study strategy selection for 3 learning scenarios',
'Graduation: learning profile permanent — self-assessment, strategy recommendations, progress tracker, 3 activities'
],finalState:'old-growth'},

{seedId:111,iterations:[
'Community beta: art teachers validate visual design principles tool against professional design critique frameworks',
'Cross-seed link to color wheel (seed 45) and grid system (seed 102) — design principles applied to color and layout',
'Accessibility: design principles described with definitions, positive examples, and counter-examples',
'Mobile: design critique mode — photograph any design and check it against principle checklist',
'i18n: design terminology in 5 languages with cultural visual tradition references',
'Performance: principle checklist stored as static JSON — no computation needed, instant rendering',
'Documentation: visual design principles guide covering balance, contrast, emphasis, movement, pattern, rhythm, and unity',
'Teaching guide: 4 activities — critique existing designs, redesign for specific principles, create a design from constraints',
'Assessment: design critique rubric — evaluate 5 designs against 7 principles with evidence-based commentary',
'Graduation: design principles permanent — 7 principles, critique framework, camera mode, 4 activities'
],finalState:'old-growth'},

{seedId:112,iterations:[
'Community beta: debate coaches validate structured discussion protocol against parliamentary procedure references',
'Cross-seed link to argument mapper (seed 53) and fallacy identifier (seed 52) — debate arguments mapped and checked live',
'Accessibility: discussion roles and turn structure described with timing and format requirements',
'Mobile: debate timer with speaker queue management and argument logging',
'i18n: debate terminology in 5 languages with cultural deliberation tradition references',
'Performance: timer uses requestAnimationFrame for smooth countdown — drift-free over 60-minute debates',
'Documentation: structured discussion guide covering parliamentary, Socratic, fishbowl, and Oxford formats',
'Teaching guide: 3 activities — run a Socratic seminar, hold an Oxford debate, conduct a fishbowl discussion',
'Assessment: discussion participation rubric — evaluate claim quality, evidence use, and rebuttal in 5 debate rounds',
'Graduation: discussion protocol permanent — 4 formats, timer, speaker queue, argument logger, 3 activities'
],finalState:'old-growth'},

// ═══ GROVE 8: THE BRIDGE (113-128) ═══
{seedId:113,iterations:[
'Community beta: ecologists validate ecosystem service calculator against published valuation studies',
'Cross-seed link to watershed health (seed 13) — ecosystem services quantified for watershed management',
'Accessibility: service values described in dollars per hectare per year with confidence ranges',
'Mobile: GPS-located valuation — estimate ecosystem services at your current location from land cover data',
'i18n: ecosystem service terminology in 5 languages with cultural value framework comparisons',
'Performance: valuation uses benefit transfer method — lookup table from meta-analysis, instant calculation',
'Documentation: ecosystem services guide covering provisioning, regulating, cultural, and supporting services',
'Teaching guide: 3 activities — value a local park, compare land use scenarios, design payment for ecosystem services scheme',
'Assessment: ecosystem valuation rubric — calculate and justify service values for 3 land management scenarios',
'Graduation: ecosystem service calculator permanent — GPS valuation, scenario comparison, policy design tool, 3 activities'
],finalState:'old-growth'},

{seedId:114,iterations:[
'Community beta: teachers validate rubric builder against established assessment framework standards',
'Cross-seed link to all assessment seeds — rubrics shareable across every teaching module as templates',
'Accessibility: rubric cells described with criterion, level, and descriptor in screen-reader-optimized tables',
'Mobile: rubric scoring mode — tap cells to score student work, totals calculated automatically',
'i18n: assessment terminology in 5 languages with educational framework comparisons',
'Performance: rubric rendering uses CSS grid — handles 10x6 rubrics without layout performance issues',
'Documentation: assessment design guide from learning objectives through rubric construction to grading calibration',
'Teaching guide: 3 activities — build a rubric from learning objectives, calibrate scoring with colleagues, revise based on student data',
'Assessment: rubric design rubric — create valid, reliable rubrics for 3 different learning outcomes',
'Graduation: rubric builder permanent — template library, scoring mode, calibration tools, 3 activities'
],finalState:'old-growth'},

{seedId:115,iterations:[
'Community beta: special educators validate accommodation planner against IEP best practice guidelines',
'Cross-seed link to learning profile (seed 110) — accommodations matched to identified learning needs',
'Accessibility: accommodation descriptions include implementation steps and effectiveness evidence',
'Mobile: quick-reference accommodation cards organized by barrier type with swipe navigation',
'i18n: accommodation terminology in 5 languages with regional legal framework references',
'Performance: accommodation matching uses tagged search — sub-50ms results from 200-item database',
'Documentation: universal design for learning guide covering representation, engagement, and expression with accommodation catalog',
'Teaching guide: 3 activities — identify barriers, select accommodations, evaluate effectiveness over time',
'Assessment: accommodation planning rubric — design appropriate accommodations for 5 described learner profiles',
'Graduation: accommodation planner permanent — barrier identifier, accommodation matcher, effectiveness tracker, 3 activities'
],finalState:'old-growth'},

{seedId:116,iterations:[
'Community beta: curriculum designers validate scope-and-sequence builder against state standards alignments',
'Cross-seed link to all teaching modules — every seed\'s lessons placeable in a year-long scope and sequence',
'Accessibility: scope-and-sequence entries described with timeframe, standard alignment, and prerequisite links',
'Mobile: calendar view — drag teaching units onto weeks with automatic prerequisite checking',
'i18n: curriculum planning terminology in 5 languages with national/regional standard framework options',
'Performance: prerequisite dependency graph uses topological sort — validates ordering in linear time',
'Documentation: curriculum design guide from standards analysis through backward design to scope-and-sequence construction',
'Teaching guide: 3 activities — map standards to learning objectives, sequence a unit, build a year-long plan',
'Assessment: curriculum design rubric — create aligned, sequenced plans for 3 subject areas',
'Graduation: scope-and-sequence builder permanent — standards database, calendar view, prerequisite checker, 3 activities'
],finalState:'old-growth'},

{seedId:117,iterations:[
'Community beta: community organizers validate project planning tool against established PM methodologies',
'Cross-seed link to all project seeds — environmental and educational projects use shared planning framework',
'Accessibility: project tasks described with dependencies, duration, and responsible parties in clear lists',
'Mobile: Kanban board view with swipe-to-advance task status and notification on dependency completion',
'i18n: project management terminology in 5 languages with cultural collaboration tradition references',
'Performance: critical path calculation uses forward/backward pass — handles 100 tasks in under 10ms',
'Documentation: community project guide from needs assessment through planning to implementation and evaluation',
'Teaching guide: 3 activities — define project scope, build a Gantt chart, identify critical path',
'Assessment: project planning rubric — create complete project plan with timeline, budget, and risk register for a community project',
'Graduation: project planner permanent — Gantt and Kanban views, critical path, risk register, 3 activities'
],finalState:'old-growth'},

{seedId:118,iterations:[
'Community beta: environmental educators validate carbon footprint calculator against EPA emission factors',
'Cross-seed link to greenhouse effect (new-installations-2, #25) — personal carbon linked to atmospheric CO2',
'Accessibility: carbon categories described with activity examples and emission values in plain units',
'Mobile: quick-entry mode — 10 questions to estimate annual carbon footprint in under 3 minutes',
'i18n: carbon and climate terminology in 5 languages with regional energy mix and transport contexts',
'Performance: emission factor database is 5KB JSON — loads instantly, calculations are pure arithmetic',
'Documentation: carbon footprint guide covering energy, transport, food, and consumption with reduction strategies',
'Teaching guide: 3 activities — calculate personal footprint, compare reduction strategies, design a carbon reduction plan',
'Assessment: carbon literacy rubric — accurately estimate and propose reductions for 3 lifestyle scenarios',
'Graduation: carbon calculator permanent — quick assessment, detailed breakdown, reduction planner, 3 activities'
],finalState:'old-growth'},

{seedId:119,iterations:[
'Community beta: youth group leaders validate team challenge generator against experiential education frameworks',
'Cross-seed link to all collaborative activities — challenges draw on skills from across the entire seed collection',
'Accessibility: challenge instructions described with step count, material list, and success criteria',
'Mobile: challenge timer with hint system that reveals progressive clues at timed intervals',
'i18n: teamwork and leadership terminology in 5 languages with cultural collaboration tradition examples',
'Performance: challenge selection uses weighted random with tag filtering — under 1ms to pick appropriate challenge',
'Documentation: experiential learning guide covering team dynamics, reflection protocols, and debrief facilitation',
'Teaching guide: 3 activities — run a team challenge, facilitate reflection, transfer lessons to academic content',
'Assessment: collaboration rubric — evaluate contribution, communication, and problem-solving in team challenge context',
'Graduation: challenge generator permanent — 40 challenges, difficulty scaling, debrief guides, 3 activities'
],finalState:'old-growth'},

{seedId:120,iterations:[
'Community beta: museum educators validate exhibit design tool against AAM best practices for interpretive design',
'Cross-seed link to all teaching modules — any seed can be designed as a museum exhibit using this tool',
'Accessibility: exhibit components described with visitor flow, reading level, and multi-sensory engagement options',
'Mobile: AR exhibit preview — hold phone up and see interpretive panels overlaid on physical space',
'i18n: museum and interpretation terminology in 5 languages with cultural institution examples',
'Performance: AR overlay uses WebXR with marker tracking — 30fps on mid-range phones',
'Documentation: interpretive design guide covering exhibit planning, panel writing, multi-sensory engagement, and evaluation',
'Teaching guide: 3 activities — design an exhibit from content, write interpretive panels at 3 reading levels, evaluate visitor engagement',
'Assessment: exhibit design rubric — create a complete interpretive plan for a 5-panel exhibit on a provided topic',
'Graduation: exhibit designer permanent — panel editor, AR preview, reading level checker, 3 activities'
],finalState:'old-growth'},

{seedId:121,iterations:[
'Community beta: trail builders validate trail design tool against USFS trail construction handbook standards',
'Cross-seed link to contour map (seed 93) — trail routes designed on topographic base with grade calculation',
'Accessibility: trail specifications described with grade percentages, tread width, and surface type',
'Mobile: GPS trail survey — walk a route and app logs elevation profile with grade calculations',
'i18n: trail construction terminology in 5 languages with regional trail management references',
'Performance: grade calculation from GPS track uses 10-point moving average — smooth profile from noisy data',
'Documentation: trail design guide covering sustainable grade, drainage, switchback design, and accessibility standards',
'Teaching guide: 3 activities — survey a trail section, calculate sustainable grade, design a switchback',
'Assessment: trail design rubric — design a trail route meeting sustainability and accessibility standards for a provided DEM',
'Graduation: trail design permanent — GPS survey, grade calculator, switchback designer, 3 activities'
],finalState:'old-growth'},

{seedId:122,iterations:[
'Community beta: restoration ecologists validate planting plan tool against regional native plant guides',
'Cross-seed link to tree guide (seed 11) and phenology (seed 91) — species selection matched to site and season',
'Accessibility: plant selections described with sun/water requirements, bloom time, and wildlife value',
'Mobile: site photo assessment — photograph a site and app suggests native species for conditions shown',
'i18n: restoration ecology terms in 5 languages with regional native plant lists',
'Performance: species selection engine filters on 8 criteria — instant results from 200-species database',
'Documentation: ecological restoration guide from site assessment through species selection to maintenance planning',
'Teaching guide: 3 activities — assess a degraded site, select native species, create a 5-year maintenance plan',
'Assessment: restoration planning rubric — design a planting plan for 3 degraded sites with species justification',
'Graduation: planting planner permanent — site assessor, species selector, maintenance calendar, 3 activities'
],finalState:'old-growth'},

{seedId:123,iterations:[
'Community beta: water stewards validate rain garden calculator against USDA engineering standards',
'Cross-seed link to watershed health (seed 13) — rain garden reduces stormwater runoff in watershed model',
'Accessibility: rain garden dimensions described with area, depth, and soil mix ratios in standard units',
'Mobile: roof area calculator — photograph your roof, app estimates impervious area for sizing',
'i18n: stormwater management terms in 5 languages with regional rainfall data references',
'Performance: sizing calculation uses rational method — instant from roof area, soil type, and design storm',
'Documentation: rain garden design guide from site selection through sizing to plant selection and maintenance',
'Teaching guide: 3 activities — calculate design storm, size a rain garden, select plants for infiltration',
'Assessment: rain garden design rubric — produce complete rain garden plans for 3 residential lot scenarios',
'Graduation: rain garden tool permanent — sizing calculator, plant selector, maintenance guide, 3 activities'
],finalState:'old-growth'},

{seedId:124,iterations:[
'Community beta: citizen scientists validate water quality test kit guide against EPA-approved analytical methods',
'Cross-seed link to pH scale (seed 10) and watershed (seed 13) — test results feed water quality assessment',
'Accessibility: test procedures described as numbered steps with acceptable range interpretations',
'Mobile: test result logger — enter values after each test, app plots time series and flags exceedances',
'i18n: water quality parameters in 5 languages with regional regulatory standard references',
'Performance: exceedance detection is threshold comparison — instant flag on any out-of-range value',
'Documentation: water quality testing guide covering pH, DO, nitrate, phosphate, turbidity, and coliform with PNW standards',
'Teaching guide: 3 activities — test a local water body, compare upstream/downstream, track seasonal changes',
'Assessment: water quality assessment rubric — interpret a complete test result set and recommend management actions',
'Graduation: water quality guide permanent — test protocol, data logger, trend analysis, 3 activities'
],finalState:'old-growth'},

{seedId:125,iterations:[
'Community beta: energy auditors validate home energy calculator against utility bill analysis',
'Cross-seed link to carbon footprint (seed 118) — home energy links to household carbon emissions',
'Accessibility: energy values described in kWh with cost equivalents and efficiency ratings',
'Mobile: appliance scanner — photograph a nameplate and app extracts wattage for energy calculation',
'i18n: energy terminology in 5 languages with regional utility rate structure references',
'Performance: energy calculation is arithmetic — instant annual cost from power rating and usage hours',
'Documentation: home energy guide covering lighting, HVAC, appliances, insulation, and renewable options',
'Teaching guide: 3 activities — audit home energy use, calculate payback for efficiency upgrades, compare energy sources',
'Assessment: energy audit rubric — complete an energy audit with upgrade recommendations and payback analysis',
'Graduation: energy calculator permanent — appliance database, utility rate calculator, payback analyzer, 3 activities'
],finalState:'old-growth'},

{seedId:126,iterations:[
'Community beta: citizen scientists validate biodiversity survey tool against NatureServe occurrence data',
'Cross-seed link to dichotomous key (seed 85) and data collector (seed 38) — surveys use ID keys and data protocols',
'Accessibility: survey protocols described with area, time, and observation method specifications',
'Mobile: GPS-tagged species observations with photo attachment and auto-submission to database',
'i18n: biodiversity survey terms in 5 languages with regional conservation status references',
'Performance: observation submission queued offline — syncs when connection available via background sync',
'Documentation: biodiversity survey guide covering transects, plot methods, point counts, and data management',
'Teaching guide: 4 activities — conduct a 30-minute biodiversity survey, calculate species richness, compare habitats',
'Assessment: survey methodology rubric — design and execute a biodiversity survey with proper methodology documentation',
'Graduation: biodiversity survey permanent — GPS logger, photo attachment, species list, 4 field protocols'
],finalState:'old-growth'},

{seedId:127,iterations:[
'Community beta: educators validate portfolio builder against digital portfolio assessment best practices',
'Cross-seed link to all seed assessments — completed work from any seed can be added to portfolio',
'Accessibility: portfolio entries described with title, date, reflection, and evidence attachment labels',
'Mobile: add-to-portfolio button available from every completed activity across all seeds',
'i18n: portfolio assessment terminology in 5 languages with educational showcase tradition references',
'Performance: portfolio stored in IndexedDB — works offline, exports as single HTML file for sharing',
'Documentation: portfolio assessment guide covering evidence selection, reflection writing, and presentation design',
'Teaching guide: 3 activities — select portfolio evidence, write reflections, present portfolio to audience',
'Assessment: portfolio quality rubric — evaluate completeness, reflection depth, and presentation for summative assessment',
'Graduation: portfolio builder permanent — cross-seed collection, reflection prompts, export, 3 activities'
],finalState:'old-growth'},

{seedId:128,iterations:[
'Community beta: community members evaluate the complete forest — all 128 seeds tested end-to-end by 200+ users',
'Cross-seed integration audit — every seed-to-seed link verified bidirectional and functional',
'Accessibility certification — WCAG 2.1 AA compliance verified across all 128 installations',
'Mobile optimization complete — every seed renders correctly on screens from 320px to 2560px',
'Internationalization complete — all 128 seeds available in 5 languages with cultural adaptations verified',
'Performance budget met — every seed loads in under 2 seconds on 3G, runs at 30fps minimum on 2020 hardware',
'Documentation complete — 128 teaching guides totaling 450+ lesson plans mapped to educational standards',
'Teaching guide index complete — searchable catalog of all activities, sorted by subject, grade level, and duration',
'Assessment framework complete — 128 rubrics calibrated, inter-rater reliability above 0.85 for all instruments',
'Graduation: The forest is old-growth. 128 permanent installations. 450 lessons. 5 languages. One trail through everything.'
],finalState:'old-growth'}

];
