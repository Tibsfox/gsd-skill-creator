# Bio-Physics Sensing — Cross-Reference Atlas

> **Module:** Synthesis — Capstone Document
> **Through-line:** *The physics does not change.* This atlas maps every phenomenon to every biological implementation, every engineering analogue, and every Pacific Northwest species. The relationships are not loose metaphors — they are precise functional equivalences governed by the same equations.

---

## Table of Contents

1. [Full Interrelationships Table](#1-full-interrelationships-table)
2. [ASCII Relationship Diagram](#2-ascii-relationship-diagram)
3. [Signal Processing Chain Comparison](#3-signal-processing-chain-comparison)
4. [Physics-to-Biology Domain Map](#4-physics-to-biology-domain-map)
5. [Cross-Module Connection Analysis](#5-cross-module-connection-analysis)
6. [Deep-Link Page Index](#6-deep-link-page-index)

---

## 1. Full Interrelationships Table

Every physics phenomenon documented in this atlas, mapped to its biological implementations, engineering analogues, and Pacific Northwest species. The governing equation is listed for each phenomenon to ground every connection in mathematics.

---

### 1.1 Acoustic Physics Phenomena

#### Sonar Equation / Echo-Delay Ranging

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Sonar equation: active echo-delay detection |
| **Governing Equation** | `SL - 2TL + TS - NL = SE` (power budget); `r = c * dt / 2` (ranging) |
| **SI Units** | dB re 1 uPa @ 1m (SL, TS, NL, SE); m (range); m/s (sound speed); s (time) |
| **Acoustic Bio** | Orca echolocation (SL up to 224 dB, 10-100 kHz); dolphin biosonar (SL up to 229 dB, 10-150 kHz); bat FM sweep echolocation (SL ~134 dB in air, 20-80 kHz) |
| **EM Bio** | — |
| **Signal Processing** | Matched filter (cross-correlation of echo with transmitted pulse); pulse compression (FM chirp → range resolution); software-defined radio ("near-optimal" processing despite "mediocre" transducers) |
| **Engineering Analogue** | Navy hull-mounted sonar (SL 220-235 dB, 1-10 kHz); fish-finding echosounders (50-200 kHz); medical ultrasound |
| **PNW Species** | Southern Resident orca (*Orcinus orca*) — Salish Sea Chinook hunting; Big Brown Bat (*Eptesicus fuscus*) — PNW forest insect capture; Little Brown Bat (*Myotis lucifugus*) — riparian zone foraging |
| **Related Phenomena** | Doppler effect, transmission loss, refraction, reflection, impedance matching, comb filtering |
| **Source Page** | [01-sonar-echo-delay.md](01-sonar-echo-delay.md) |

#### Doppler Effect / Blue Shift

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Frequency shift from relative motion |
| **Governing Equation** | `f_echo = f_0 * (c + v) / (c - v)` (echo Doppler); `delta_f ≈ 2 * f_0 * v / c` (approximation) |
| **SI Units** | Hz (frequency); m/s (velocity, sound speed) |
| **Acoustic Bio** | CF bat Doppler Shift Compensation (DSC) — *Hipposideros armiger*: 110 Hz std dev at 67.5 kHz (0.16% precision); FM bat broadband tolerance — PNW bats absorb Doppler shifts without compensation; orca time-domain velocity estimation via range differencing across click trains |
| **EM Bio** | — |
| **Signal Processing** | Superheterodyne receiver analogy (bat DSC = frequency-locked loop); Moving Target Indication (MTI) — silent frequency band isolates prey from clutter; micro-Doppler signature analysis (wing flutter detection at 20-1000 Hz modulation) |
| **Engineering Analogue** | Police radar (K-band 24.15 GHz); ADCP current profilers (75-1200 kHz, deployed in Puget Sound); Doppler weather radar (NEXRAD WSR-88D); medical Doppler ultrasound |
| **PNW Species** | Big Brown Bat, Little Brown Bat (FM strategy — range over velocity in cluttered PNW forests); Southern Resident orca (time-domain Doppler via ICI tracking) |
| **Related Phenomena** | Sonar equation, auditory fovea, comb filtering, phase-locked loop |
| **Source Page** | [02-doppler-effect.md](02-doppler-effect.md) |

#### Refraction (Snell's Law)

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Wave direction change at velocity boundaries |
| **Governing Equation** | `sin(theta_1) / c_1 = sin(theta_2) / c_2` |
| **SI Units** | degrees or radians (angle); m/s (sound speed) |
| **Acoustic Bio** | Dolphin/orca melon — graded-index (GRIN) acoustic lens (c_core ~1350 m/s, c_periphery ~1420-1450 m/s); mandible fat pad reception waveguide; Salish Sea sound speed variations (Fraser River plume, thermocline, tidal mixing) |
| **EM Bio** | — |
| **Signal Processing** | GRIN lens theory; ray-tracing propagation models; total internal reflection waveguide |
| **Engineering Analogue** | Phased array beam steering; fiber optic total internal reflection; graded-index optical lenses; SOFAR channel exploitation |
| **PNW Species** | Southern Resident orca (melon beam-forming in Salish Sea); all PNW odontocetes |
| **Related Phenomena** | Acoustic impedance, reflection, transmission loss, compression waves |
| **Source Page** | [03-refraction-reflection-compression.md](03-refraction-reflection-compression.md) |

#### Acoustic Impedance / Reflection

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Energy transmission/reflection at material boundaries |
| **Governing Equation** | `Z = rho * c`; `R = (Z_2 - Z_1) / (Z_2 + Z_1)`; `R_I = [(Z_2 - Z_1)/(Z_2 + Z_1)]^2` |
| **SI Units** | Pa*s/m (Rayl) for impedance; dimensionless for reflection coefficient |
| **Acoustic Bio** | Swim bladder as acoustic mirror — 99.9% reflection (Z_water/Z_air ratio ~3,800:1); fish muscle nearly invisible (0.12% reflection); melon internal boundaries minimally reflective (0.35%); tympanic-periotic air sinuses provide 99.99% acoustic isolation between ears |
| **EM Bio** | — |
| **Signal Processing** | Impedance matching transformers (middle ear ossicles: area ratio 17.2:1 + lever ratio 1.3:1 = ~22 dB gain); mandible fat pad impedance grading; target strength spectral analysis for species discrimination |
| **Engineering Analogue** | Transformer impedance matching; anti-reflection coatings; acoustic windows; bubble curtain noise barriers |
| **PNW Species** | Chinook salmon (*O. tshawytscha*) — largest swim bladder, highest TS (-28 to -22 dB at 38 kHz); Southern Resident orca — discriminates Chinook from other salmon by swim bladder echo |
| **Related Phenomena** | Sonar equation (TS term), refraction, signal processing analogues (impedance matching) |
| **Source Page** | [03-refraction-reflection-compression.md](03-refraction-reflection-compression.md) |

#### Compression Waves

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Longitudinal mechanical wave propagation |
| **Governing Equation** | `d^2p/dt^2 = c^2 * nabla^2(p)`; `c = f * lambda`; `c = sqrt(K / rho)` |
| **SI Units** | Pa (pressure); m/s (speed); Hz (frequency); m (wavelength) |
| **Acoustic Bio** | All biological sound — every dolphin click, orca call, bat chirp, whale song propagates as compression wave; shear waves do NOT propagate in fluids |
| **EM Bio** | — |
| **Signal Processing** | Wave equation governs all acoustic signal propagation; non-dispersive in water/air (pulse shapes preserved) |
| **Engineering Analogue** | Seismic P-wave analysis; sonar pulse propagation; acoustic communication |
| **PNW Species** | All acoustically active PNW species; blue whale infrasound (10-40 Hz, ~188 dB, hundreds of km range via SOFAR); SRKW orca communication (0.5-10 kHz) |
| **Related Phenomena** | Sonar equation, refraction, impedance, transmission loss |
| **Source Page** | [03-refraction-reflection-compression.md](03-refraction-reflection-compression.md) |

#### Phase / Binaural Localization

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Directional sound source localization from phase and level differences at two receivers |
| **Governing Equation** | `ITD = (d/c) * (theta + sin(theta))`; `ILD(f, theta) ≈ head_shadow(f) * sin(theta)`; Rayleigh duplex: ITD dominant below f_crossover, ILD dominant above |
| **SI Units** | seconds (ITD); dB (ILD); degrees (azimuth/elevation) |
| **Acoustic Bio** | Orca mandible binaural hearing (35 cm separation, ILD >30 dB at 50 kHz); bat pinna-based HRTF (complex spectral notches encode elevation); dolphin mandible fat pad bilateral reception; barn owl asymmetric ears (ITD resolution ~3 us) |
| **EM Bio** | — |
| **Signal Processing** | Jeffress model cross-correlator (neural coincidence detection); lateral superior olive as differential amplifier (ILD); HRTF spectral filtering for elevation |
| **Engineering Analogue** | Phased array beam-forming (`theta_3dB ≈ lambda / (N*d)`); radio interferometry (VLBI: same equation, continental baselines); stereo audio localization |
| **PNW Species** | Southern Resident orca (ILD-dominant echolocation, ITD for communication calls); Big Brown Bat (ILD-dominant at 25-50 kHz); Little Brown Bat |
| **Related Phenomena** | Sonar equation, Doppler, impedance matching, comb filtering |
| **Source Page** | [04-phase-comb-filter.md](04-phase-comb-filter.md) |

#### Comb Filtering

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Regularly spaced spectral peaks from periodic or delayed signals |
| **Governing Equation** | `|H(f)|^2 = 2*(1 + cos(2*pi*f*tau))`; peaks at `f_n = n/tau`; notches at `f_n = (n+0.5)/tau` |
| **SI Units** | Hz (frequency); s (delay tau) |
| **Acoustic Bio** | Click trains produce comb spectra (peak spacing = 1/ICI); orca whistles with harmonic stacks (f, 2f, 3f, ...); bat CF-FM calls with micro-Doppler sidebands (f_ref ± n*f_flutter); auditory fovea as biological high-Q comb filter (Q = 50-200+) |
| **EM Bio** | — |
| **Signal Processing** | FFT-based comb detection on GPU; matched filter bank at regular frequency spacing; spectrogram pattern recognition for call classification |
| **Engineering Analogue** | Room acoustic comb filters; FFT bin structure; ORCA-SPOT CNN spectrogram analysis; OrcaHello real-time detection |
| **PNW Species** | Southern Resident orca (pulsed calls with harmonic comb structure); PNW bats (click train spectral structure) |
| **Related Phenomena** | Doppler (auditory fovea), phase (spectral analysis), GPU pipeline |
| **Source Page** | [04-phase-comb-filter.md](04-phase-comb-filter.md) |

#### Auditory Fovea / Silent Band

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Specialized cochlear region with extreme frequency resolution; DSC-created spectral guard band |
| **Governing Equation** | `Q = f_center / bandwidth`; Q = 200 at 83 kHz → 415 Hz bandwidth; Gabor limit: `delta_f * delta_t >= 1/(4*pi)` |
| **SI Units** | dimensionless (Q factor); Hz (bandwidth) |
| **Acoustic Bio** | CF bat auditory fovea: 400-500 hair cells/mm (vs ~100 normal), Q = 50-200+, 30-50% of auditory cortex devoted to <1% of frequency range; DSC + fovea + silent band = integrated clutter rejection + target detection + target classification pipeline |
| **EM Bio** | — |
| **Signal Processing** | High-Q bandpass filter; superheterodyne IF stage; Moving Target Indication (MTI) radar analogue; phase-locked loop (DSC = biological PLL with 0.16% stability) |
| **Engineering Analogue** | Crystal oscillator (Q = 10,000-100,000); superheterodyne receiver; MTI radar clutter cancellation |
| **PNW Species** | NOT present in PNW FM bats (no auditory fovea — broadband cochlea instead); but the physics principles apply to all echolocating species as fundamental trade-offs |
| **Related Phenomena** | Doppler effect, comb filtering, signal processing analogues |
| **Source Page** | [04-phase-comb-filter.md](04-phase-comb-filter.md); [02-doppler-effect.md](02-doppler-effect.md) |

---

### 1.2 Electromagnetic Physics Phenomena

#### Earth's Magnetic Field / Magnetoreception

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Geomagnetic field detection for navigation |
| **Governing Equation** | Maxwell's equations (div(B)=0; curl(E)=-dB/dt); magnetic torque: `tau = m * B * sin(theta)`; dipole energy: `U = -m * B * cos(theta)` |
| **SI Units** | T (tesla) or uT (microtesla) for field; A*m^2 (magnetic moment); N*m (torque); J (energy) |
| **Acoustic Bio** | — |
| **EM Bio** | Magnetite-based sensing — single-domain Fe3O4 crystals (30-120 nm) in chains; magneto-mechanical transduction (torque → membrane deformation → ion channels → action potential); two-coordinate magnetic map (field intensity F + inclination I = biological GPS); inherited magnetic map in pink salmon |
| **Signal Processing** | Temporal averaging (reduces transient noise); spatial averaging across receptor clusters; multi-modal sensor fusion (magnetic → compass → olfactory) analogous to Kalman filtering |
| **Engineering Analogue** | Fluxgate magnetometer (~0.1 nT sensitivity); MEMS compass; GPS (two-parameter position system analogy); SQUID magnetometer (~1 fT) |
| **PNW Species** | Pacific salmon (Chinook, pink, sockeye, coho, steelhead) — magnetic map navigation; gray whale — coastal migration correlated with geomagnetic features; humpback whale; red fox (*Vulpes vulpes*) — magnetic rangefinder component |
| **PNW Data** | Seattle: F=55.1 uT, I=69.5 deg, D=15.8 deg E; inclination range 67-72 deg across PNW |
| **Related Phenomena** | Fox magnetic rangefinder, cryptochrome compass, electroreception (Faraday induction), radio telemetry (electromagnetic engineering) |
| **Source Page** | [10-magnetic-fields-magnetoreception.md](10-magnetic-fields-magnetoreception.md) |

#### Fox Magnetic Rangefinder

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Multi-modal magnetic-acoustic triangulation for distance estimation |
| **Governing Equation** | Triangulation: `d = (h + D) / tan(I)` where I = magnetic inclination; Error: ~1.5 cm for 2 deg angular uncertainty at ~1 m range |
| **SI Units** | m (distance); degrees (inclination angle) |
| **Acoustic Bio** | Acoustic component: binaural prey localization through snow (bearing from sound) |
| **EM Bio** | Magnetic component: cryptochrome visual overlay provides inclination reference angle; fox aligns NE (20-40 deg magnetic) for maximum pounce success (74% NE vs 18% other directions) |
| **Signal Processing** | Acoustic-magnetic fusion architecture; two-angle triangulation (acoustic azimuth + magnetic inclination → range); multi-sensor integration |
| **Engineering Analogue** | Radar/lidar rangefinder; triangulation surveying; compass + clinometer range estimation |
| **PNW Species** | Red fox (*Vulpes vulpes*) — throughout PNW forests, meadows, alpine; PNW magnetic inclination (67-72 deg) provides steep reference angle |
| **Key Data** | Cerveny et al. 2011: 592 pounces, 84 foxes; NE pounces 74% success vs 18% other |
| **Related Phenomena** | Earth's magnetic field, cryptochrome compass, binaural localization |
| **Source Page** | [11-fox-magnetic-rangefinder.md](11-fox-magnetic-rangefinder.md) |

#### Cryptochrome Radical-Pair Quantum Compass

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Quantum mechanical spin dynamics modulated by weak magnetic fields |
| **Governing Equation** | Zeeman interaction: `H_Z = -gamma_e * S . B`; singlet-triplet interconversion rate modulated by field angle; angular dependence: `cos^2(theta)` pattern in visual field |
| **SI Units** | J (energy); T (field); Hz (Larmor frequency) |
| **Acoustic Bio** | — |
| **EM Bio** | Cry4 protein in retina — blue light (450 nm) triggers FAD radical pair; electron spin entanglement creates magnetic-field-dependent singlet/triplet ratio; produces visual magnetic overlay pattern (cos^2 angular dependence); quantum coherence ~1-10 us at body temperature (vs 114 ns minimum required) |
| **Signal Processing** | Quantum state → photoreceptor signaling → visual cortex → directional pattern; dual magnetoreception: cryptochrome (compass/direction) + magnetite (map/intensity) |
| **Engineering Analogue** | Quantum magnetometer; NV-center diamond sensor; atomic clock spin dynamics |
| **PNW Species** | Pacific Flyway migratory birds — raptors (Red-tailed Hawk, Osprey), songbirds (Swainson's Thrush, Rufous Hummingbird), waterfowl (Dunlin, Western Sandpiper); red fox (Cry4 in retina) |
| **Related Phenomena** | Earth's magnetic field, magnetite magnetoreception, fox rangefinder |
| **Source Page** | [12-cryptochrome-quantum-compass.md](12-cryptochrome-quantum-compass.md) |

#### Electroreception / Ampullae of Lorenzini

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Detection of bioelectric fields and Faraday-induced EMF |
| **Governing Equation** | Electrostatic: `E ~ p / (4*pi*sigma*r^3)` (dipole field); electromagnetic: `E_induced = v x B` (Faraday induction for moving conductor in field); `V_induced ≈ v * B * L * sin(theta)` |
| **SI Units** | V/m (electric field); nV/cm (sensitivity); T (magnetic field); m/s (velocity) |
| **Acoustic Bio** | — |
| **EM Bio** | Ampullae of Lorenzini: gel-filled canals (proton semiconductor, 1.8 S/m conductivity); sensory epithelium with modified hair cells; sensitivity 5 nV/cm; frequency tuning 0.5-8 Hz passband; dual function: (1) electrostatic prey detection (bioelectric field 1/r^3 falloff) and (2) electromagnetic navigation (Faraday induction, E = v x B, ~55 uV/m at 1 m/s in Earth's field) |
| **Signal Processing** | Bandpass filtering (0.5-8 Hz rejects DC and high-frequency noise); common-mode rejection across bilateral ampullae pairs; gain modulation (efferent control of sensitivity) |
| **Engineering Analogue** | Low-noise voltmeter; lock-in amplifier; gradiometer; cathodic protection monitoring; submarine cable field sensors |
| **PNW Species** | Spiny dogfish (*Squalus acanthias*) — most abundant PNW shark; big skate (*Beringraja binoculata*) — Puget Sound benthic specialist; Pacific angel shark (*Squatina californica*); sixgill shark (*Hexanchus griseus*) |
| **Related Phenomena** | Earth's magnetic field, Faraday's law, bioelectric field generation, radio telemetry (EM induction) |
| **Source Page** | [13-electroreception-lorenzini.md](13-electroreception-lorenzini.md) |

#### Radio Telemetry / Electromagnetic Induction

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Electromagnetic induction for passive RFID and wildlife tracking |
| **Governing Equation** | Faraday's law: `EMF = -dPhi/dt`; resonant frequency: `f = 1/(2*pi*sqrt(L*C))`; PIT tag at 134.2 kHz |
| **SI Units** | V (EMF); Wb (magnetic flux); H (inductance); F (capacitance); Hz (frequency) |
| **Acoustic Bio** | — |
| **EM Bio** | Biological coils: cochlear hair cell bundles as micro-resonant structures; bioelectric field generation (the fields sharks detect are governed by the same EM induction physics) |
| **Signal Processing** | RFID signal encoding (unique 14-digit hexadecimal tag code); time-series analysis of detection events; survival estimation from sequential dam detections |
| **Engineering Analogue** | PTAGIS PIT tags (12 mm x 2 mm, 134.2 kHz, passive, no battery); interrogation antenna arrays at 500+ sites; Columbia-Snake River 14 dam detection network; 60+ million tags deployed cumulative |
| **PNW Species** | Chinook, coho, sockeye, steelhead, bull trout — all tracked by PTAGIS through Columbia-Snake system |
| **Related Phenomena** | Earth's magnetic field, electroreception (Faraday induction navigation), magnetoreception |
| **Source Page** | [14-radio-telemetry-coils.md](14-radio-telemetry-coils.md) |

---

### 1.3 Signal Processing Phenomena

#### Impedance Matching

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Maximizing energy transfer across media boundaries |
| **Governing Equation** | `T_I = 4*Z_1*Z_2 / (Z_1 + Z_2)^2`; maximum transfer when Z_1 = Z_2 |
| **SI Units** | Pa*s/m (acoustic impedance); dimensionless (transmission coefficient) |
| **Acoustic Bio** | Middle ear ossicles: area ratio (55/3.2 mm^2 = 17.2:1) + lever ratio (1.3:1) = ~22 dB gain; overcomes 32 dB air-to-cochlear-fluid loss; dolphin melon: graded lipid gradient minimizes internal reflections (0.35%); mandible fat pads: reverse impedance matching for reception |
| **EM Bio** | Ampullae gel: conductivity matched to seawater (proton semiconductor, 1.8 S/m) |
| **Signal Processing** | Transformer analogy (voltage step-up = pressure amplification); quarter-wave matching layers; graded-index transitions |
| **Engineering Analogue** | Audio impedance matching transformer; anti-reflection coatings; coaxial cable impedance matching |
| **PNW Species** | All acoustically sensing PNW species; all electroreceptive PNW elasmobranchs |
| **Related Phenomena** | Acoustic impedance, reflection, refraction |
| **Source Page** | [05-signal-processing-analogues.md](05-signal-processing-analogues.md) |

#### Cochlear Fourier Analysis

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Frequency decomposition by mechanical resonance along basilar membrane |
| **Governing Equation** | Tonotopic mapping: position along basilar membrane maps logarithmically to frequency; `f(x) = f_max * e^(-alpha*x)` |
| **SI Units** | Hz (frequency); mm (position) |
| **Acoustic Bio** | Basilar membrane stiffness gradient: base (stiff, high-frequency) to apex (flexible, low-frequency); each position resonates at a specific frequency; hair cells transduce mechanical vibration to neural signal; auditory fovea = expanded frequency representation at f_ref (CF bats) |
| **Signal Processing** | Biological filter bank; real-time Fourier analysis; constant-Q filter bank (logarithmic frequency spacing); STFT analogy |
| **Engineering Analogue** | FFT; filter bank; Short-Time Fourier Transform; spectrograph |
| **PNW Species** | All PNW mammals and birds with cochlea; PNW bats (broadband cochlea for FM processing) |
| **Related Phenomena** | Comb filtering, auditory fovea, binaural processing, Nyquist |
| **Source Page** | [05-signal-processing-analogues.md](05-signal-processing-analogues.md) |

#### Nyquist Sampling / Neural Spike Trains

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Minimum sampling rate for faithful signal reconstruction |
| **Governing Equation** | `f_sample >= 2 * f_max` (Nyquist theorem); neural spike rate as biological sampling rate |
| **SI Units** | Hz (frequency); spikes/s (firing rate) |
| **Acoustic Bio** | Hair cell firing rates up to ~5 kHz (volley principle extends to ~5 kHz through population coding); phase-locking degrades above ~3-5 kHz; explains ITD dominance below ~1.5 kHz (Rayleigh duplex theory) |
| **Signal Processing** | Aliasing when undersampled; volley principle = distributed sampling across population; place coding above Nyquist frequency of individual neurons |
| **Engineering Analogue** | Analog-to-digital converter; sample-and-hold circuit; Nyquist-Shannon sampling theorem |
| **PNW Species** | All acoustically sensing PNW species |
| **Related Phenomena** | Cochlear analysis, binaural processing, neural error correction |
| **Source Page** | [05-signal-processing-analogues.md](05-signal-processing-analogues.md) |

#### Error Correction / Neural Redundancy

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Information reliability through redundant encoding |
| **Governing Equation** | Shannon channel capacity: `C = B * log2(1 + S/N)`; redundancy reduces error rate exponentially |
| **SI Units** | bits/s (capacity); Hz (bandwidth); dB (SNR) |
| **Acoustic Bio** | ~100,000 auditory nerve fibers (comparable to human); hypertrophied brainstem nuclei in dolphins; population coding: distributed representation across thousands of neurons for each feature; redundant representation at multiple processing stages |
| **Signal Processing** | Parity codes; Reed-Solomon codes; CRC; population coding as biological equivalent of error-correcting codes |
| **Engineering Analogue** | Forward error correction; RAID (redundant storage); triple modular redundancy |
| **PNW Species** | Southern Resident orca (compensates for "mediocre" transducers with "near-optimal" processing); all PNW echolocators |
| **Related Phenomena** | All signal processing analogues; sensor fusion |
| **Source Page** | [05-signal-processing-analogues.md](05-signal-processing-analogues.md) |

#### Sensor Fusion

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Integrating multiple independent sensory channels for optimal state estimation |
| **Governing Equation** | Kalman filter: `x_k = F*x_{k-1} + B*u_k + w_k`; Bayesian posterior: `P(state|data) proportional to P(data|state) * P(state)` |
| **SI Units** | Application-dependent |
| **Acoustic Bio** | Orca: echolocation + communication + passive listening; fox: acoustic (binaural) + magnetic (inclination) = rangefinder |
| **EM Bio** | Salmon: magnetic map + magnetic compass + olfactory homing (three-phase fusion with distance-dependent weighting); birds: cryptochrome compass + magnetite intensity sensor + star compass + sun compass + landmark memory |
| **Signal Processing** | Weighted sensor integration; Kalman filtering; Bayesian estimation; multi-modal neural integration |
| **Engineering Analogue** | INS/GPS fusion; biologging tag sensor fusion (accelerometer + magnetometer + depth + acoustic); ORCA-SPOT multi-channel hydrophone processing |
| **PNW Species** | Chinook salmon (three-phase navigation); Pacific Flyway migratory birds (five+ compass systems); red fox (acoustic-magnetic fusion); Southern Resident orca (echolocation + passive acoustics + vision) |
| **Related Phenomena** | All phenomena — sensor fusion is the capstone integration pattern |
| **Source Page** | [05-signal-processing-analogues.md](05-signal-processing-analogues.md) |

---

### 1.4 GPU / Computational Pipeline

#### GPU-Accelerated Bioacoustic Detection

| Attribute | Value |
|-----------|-------|
| **Physics Phenomenon** | Real-time spectral analysis and neural network classification of biological signals |
| **Governing Equation** | STFT: `S(t,f) = |integral[x(tau)*w(tau-t)*e^(-j*2*pi*f*tau) dtau]|^2`; CNN feature extraction; matched filter: `Y = sum_{n=0}^{N-1} S(n*delta_f)` |
| **SI Units** | Hz (frequency); s (time); dimensionless (classification probability) |
| **System** | ORCA-SPOT CNN: >95% accuracy, 19,000 hrs training data, 46,357 labeled segments; OrcaHello real-time pipeline; BirdNET avian classifier; GPU pipeline latency ~5 ms per second of audio |
| **Engineering Implementation** | Multi-channel hydrophone → STFT spectrogram → CNN inference → real-time alert; comb filter detection on GPU (trivially parallelizable); Kalman filtering for biologging tag fusion |
| **PNW Application** | Orca Behavior Institute hydrophone network; NOAA NWFSC biologging analysis; Quiet Sound vessel noise monitoring; Pacific Flyway bird acoustic surveys |
| **Related Phenomena** | Comb filtering, sonar equation, Fourier analysis, Doppler |
| **Source Page** | [07-gpu-ml-pipeline.md](07-gpu-ml-pipeline.md) |

---

## 2. ASCII Relationship Diagram

The following diagram maps every phenomenon in the atlas, grouped by physics domain, with cross-domain connections shown explicitly. Each box represents a documented physics phenomenon or biological implementation. Lines represent physics-level connections (not loose associations).

```
=====================================================================================
                     BIO-PHYSICS SENSING — RELATIONSHIP MAP
=====================================================================================

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                          ACOUSTIC PHYSICS (Module 1)                            │
  │                                                                                 │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
  │  │ 01-SONAR     │───>│ 02-DOPPLER   │    │ 03-REFRACT   │    │ 04-PHASE     │  │
  │  │ ECHO-DELAY   │    │ BLUE SHIFT   │    │ REFLECT      │    │ COMB FILTER  │  │
  │  │              │    │              │    │ COMPRESSION  │    │ BINAURAL     │  │
  │  │ r = c*dt/2   │    │ f=f0(c+v)/   │    │              │    │              │  │
  │  │ SL-2TL+TS   │    │    (c-v)     │    │ sin01/c1 =   │    │ ITD, ILD     │  │
  │  │  -NL = SE   │    │              │    │ sin02/c2     │    │ HRTF, Q fac  │  │
  │  └──────┬───────┘    └───────┬──────┘    └──────┬───────┘    └──────┬───────┘  │
  │         │                    │                   │                   │          │
  │         │    ┌───────────────┼───────────────────┼───────────────────┘          │
  │         │    │               │                   │                              │
  │         v    v               v                   v                              │
  │  ┌──────────────────────────────────────────────────────────────────────┐       │
  │  │         05-SIGNAL PROCESSING ANALOGUES (Module 3)                   │       │
  │  │  Impedance Matching | Cochlear Fourier | Nyquist | Error Correction │       │
  │  │         Sensor Fusion | Software-Defined Radio                      │       │
  │  └────────────────────────────────┬────────────────────────────────────┘       │
  └───────────────────────────────────┼───────────────────────────────────────────  ┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                         │                           │
           v                         v                           v
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                    ELECTROMAGNETIC PHYSICS (Module 2)                          │
  │                                                                                │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
  │  │ 10-MAGNETIC  │───>│ 11-FOX       │    │ 12-CRYPTO-   │    │ 13-ELECTRO-  │  │
  │  │ FIELDS       │    │ RANGEFINDER  │    │ CHROME       │    │ RECEPTION    │  │
  │  │ MAGNETO-     │    │              │    │ QUANTUM      │    │ LORENZINI    │  │
  │  │ RECEPTION    │    │ tau=m x B    │    │ COMPASS      │    │              │  │
  │  │              │    │ Triangulat.  │    │              │    │ 5 nV/cm      │  │
  │  │ F, I, D     │    │ Acoustic +   │    │ Radical pair │    │ E = v x B    │  │
  │  │ div(B)=0    │    │ Magnetic     │    │ Cry4 retina  │    │ Faraday law  │  │
  │  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
  │         │                   │                    │                   │          │
  │         │    ┌──────────────┘                    │                   │          │
  │         │    │      ┌────────────────────────────┘                   │          │
  │         │    │      │                                                │          │
  │         v    v      v                                                v          │
  │  ┌──────────────────────────────────────────────────────────────────────┐       │
  │  │         14-RADIO TELEMETRY, COILS, INDUCTORS                        │       │
  │  │  PTAGIS | PIT Tags | Faraday EMF = -dPhi/dt | f = 1/(2pi*sqrt(LC)) │       │
  │  │  134.2 kHz | 60M+ tags | 500+ detection sites | 14 dams            │       │
  │  └─────────────────────────────────┬───────────────────────────────────┘       │
  └────────────────────────────────────┼──────────────────────────────────────────  ┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                          │                            │
           v                          v                            v
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                    GPU / ML PIPELINE (Module 5)                                │
  │                                                                                │
  │  ┌─────────────────────────────────────────────────────────────────────────┐   │
  │  │              07-GPU-ML-PIPELINE                                         │   │
  │  │  ORCA-SPOT (>95% accuracy) | OrcaHello (real-time) | BirdNET           │   │
  │  │  STFT → CNN → classification | Comb filter GPU detection               │   │
  │  │  Biologging tag Kalman fusion | 19,000 hrs training data                │   │
  │  └─────────────────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────────────────────────────────────────────────────┘

           ┌───────────────────────────────────────────────────────┐
           │                                                       │
           v                                                       v
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                    PNW SPECIES (Module 4 — 6 Species)                          │
  │                                                                                │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                         │
  │  │ pnw-01       │  │ pnw-02       │  │ pnw-03       │                         │
  │  │ S. RESIDENT  │  │ PACIFIC      │  │ PNW FM BATS  │                         │
  │  │ ORCA         │  │ SALMON       │  │              │                         │
  │  │              │  │              │  │ E. fuscus    │                         │
  │  │ Biosonar     │  │ Magnetic map │  │ M. lucifugus │                         │
  │  │ Echolocation │  │ Multi-modal  │  │ FM sweep     │                         │
  │  │ 10-100 kHz   │  │ sensor fusion│  │ 20-80 kHz    │                         │
  │  │ Chinook prey │  │ ESA-listed   │  │ Range over   │                         │
  │  │ Vessel noise │  │ 28 ESUs      │  │ velocity     │                         │
  │  └──────────────┘  └──────────────┘  └──────────────┘                         │
  │                                                                                │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                         │
  │  │ pnw-04       │  │ pnw-05       │  │ pnw-06       │                         │
  │  │ PACIFIC      │  │ RED FOX      │  │ MIGRATORY    │                         │
  │  │ ELASMO-      │  │ MAGNETIC     │  │ BIRDS        │                         │
  │  │ BRANCHS      │  │ HUNTING      │  │              │                         │
  │  │              │  │              │  │ Pacific      │                         │
  │  │ Spiny dogfish│  │ V. vulpes    │  │ Flyway       │                         │
  │  │ Big skate    │  │ Cerveny 2011 │  │ Cry4 compass │                         │
  │  │ 5 nV/cm      │  │ 74% NE hit   │  │ Multi-modal  │                         │
  │  │ Faraday nav  │  │ Acoustic +   │  │ navigation   │                         │
  │  │              │  │ magnetic     │  │              │                         │
  │  └──────────────┘  └──────────────┘  └──────────────┘                         │
  └────────────────────────────────────────────────────────────────────────────────┘

  =====================================================================================
   CROSS-DOMAIN CONNECTIONS (lines between modules):
  =====================================================================================

  ACOUSTIC ←→ EM:
    • Fox rangefinder fuses ACOUSTIC (binaural) + EM (magnetic inclination)
    • Orca hunts salmon that navigate by EM (magnetic map) — physics chains
    • Shark electroreception detects bioelectric fields generated by same
      organisms that produce acoustic signatures detectable by orca sonar
    • Radio telemetry (EM) tracks organisms that use acoustic sensing (orca)
      and EM sensing (salmon) — engineering mirrors biology

  ACOUSTIC ←→ GPU:
    • ORCA-SPOT processes orca click trains (acoustic → STFT → CNN)
    • Comb filter detection on GPU mirrors biological cochlear analysis
    • BirdNET processes avian vocalizations (acoustic → spectrogram → ML)

  EM ←→ GPU:
    • Biologging tags (EM sensors: magnetometer, accelerometer) →
      Kalman filter fusion on GPU → behavioral state estimation
    • PTAGIS detection data → time-series analysis → survival models

  SIGNAL PROCESSING bridges ALL modules:
    • Impedance matching: acoustic (ossicles, melon) + EM (ampullae gel)
    • Fourier analysis: acoustic (cochlea) + GPU (STFT)
    • Sensor fusion: acoustic+EM (fox) + all-modal (salmon, birds)
    • Error correction: neural redundancy across all biological systems
```

---

## 3. Signal Processing Chain Comparison

All six PNW species side by side, showing the complete signal processing chain from source through action. This table reveals the deep structural parallels across radically different physics domains and taxa.

---

### 3.1 Six-Species Signal Processing Chain

| Stage | Southern Resident Orca | Pacific Salmon | PNW FM Bats | Pacific Elasmobranchs | Red Fox | Migratory Birds |
|-------|----------------------|----------------|-------------|----------------------|---------|-----------------|
| **Source** | Phonic lips: broadband click, SL up to 224 dB, 10-100 kHz | Earth's magnetic field: F=52-57 uT, I=62-74 deg | Larynx: FM sweep 20-80 kHz, SL ~134 dB (in air) | Prey bioelectric fields: gill/heart dipole, 1-100 uV at source; Earth's B field (55 uT) | Prey acoustic signal: rustling under snow; Earth's B field (I=67-72 deg PNW) | Earth's magnetic field: F, I, D; stars, sun, landmarks |
| **Propagation Medium** | Seawater (c=1500 m/s); Salish Sea multipath environment | Direct field penetration (mu ~ mu_0, negligible attenuation) | Air (c=343 m/s); PNW forest clutter | Seawater (conductivity ~4 S/m); bioelectric dipole 1/r^3 falloff | Air (sound) + direct magnetic field (EM) | Direct field penetration (magnetic); photons (star/sun) |
| **Transducer** | Mandible fat pads → tympanic-periotic complex (impedance-matched, acoustically isolated) | Magnetite crystal chains in ethmoid tissue (torque → membrane deformation → ion channels via trigeminal nerve) | Pinna (large, complex shape) → tympanic membrane → ossicles → cochlea | Ampullae of Lorenzini: gel-filled canals (proton semiconductor) → sensory hair cells (5 nV/cm) | Pinnae (binaural) + retinal Cry4 (cryptochrome visual overlay) | Retinal Cry4 (radical-pair → visual pattern) + magnetite in beak (torque → trigeminal) |
| **Signal Conditioning** | Cochlear tonotopy (frequency analysis); air sinuses provide bilateral acoustic isolation; 100,000 auditory nerve fibers | Trigeminal ganglion integration; temporal averaging; comparison across receptor clusters | Cochlear tonotopy (broadband, uniform hair cell distribution); pinna HRTF spectral filtering | 0.5-8 Hz bandpass (rejects DC and high-freq noise); common-mode rejection across bilateral pairs; efferent gain control | Binaural ILD/ITD processing; visual magnetic pattern integration | Visual cortex processes magnetic overlay; brainstem integrates magnetite compass + multiple non-magnetic compasses |
| **Feature Extraction** | Target range (echo delay); target species (swim bladder spectral signature); target direction (ILD at 10-100 kHz); approach phase (ICI structure) | Field intensity gradient (dF/dx ~2-5 nT/km); inclination gradient (dI/dx ~0.01-0.05 deg/km); position on two-coordinate map | Target range (echo delay, dr = c/2B ≈ 2.9 mm); target direction (ILD); clutter separation (range gating) | Prey location (bioelectric field gradient, direction and distance); heading relative to magnetic field (Faraday EMF ≈ 55 uV/m at 1 m/s) | Prey bearing (binaural azimuth); prey range via magnetic triangulation (d = (h+D)/tan(I)); alignment to NE maximizes accuracy | Compass bearing (visual magnetic pattern, cos^2 angular dependence); map position (intensity isoline + inclination isoline) |
| **Decision / Action** | Search → pursuit → terminal buzz → acrobatic capture; adjust ICI to track decreasing range; compensate for vessel noise via Lombard effect | Phase 1: magnetic map (ocean, >100 km) → Phase 2: magnetic compass (coastal) → Phase 3: olfactory homing (river, <10 km) | Search → approach → terminal buzz → insect capture; adaptive call design in PNW forest clutter (shorten sweep, increase repetition) | Orient to buried prey; strike from above; follow magnetic highways between foraging areas (Klimley) | Align NE (20-40 deg magnetic); acoustic localization of prey bearing; high pounce arc (fixed ~1 m range); 74% success when NE-aligned | Navigate Pacific Flyway; multi-modal compass switching (magnetic primary → star compass at night → sun compass by day → landmark memory near breeding site) |
| **Conservation Physics** | Vessel noise raises NL, reduces SE and detection range by up to 10x; Quiet Sound initiative, 1000-yd vessel buffers | Dam EM interference on magnetic navigation; 28 ESA-listed ESUs; PTAGIS tracks 60M+ tagged fish | White-Nose Syndrome habitat loss; light pollution disrupts foraging; habitat fragmentation | Submarine cable EM fields; trawling habitat destruction; bycatch | Habitat fragmentation; limited direct conservation concern | Light pollution disrupts Cry4; RF noise disrupts radical-pair coherence; habitat fragmentation along Pacific Flyway |

---

### 3.2 Cross-Species Convergences

The signal processing chain comparison reveals deep convergences that arise from physics, not from shared evolutionary ancestry:

```
CONVERGENCE 1: Terminal Buzz
  Orca: ICI drops from 150-200 ms (search) to 2-10 ms (capture)
  Bat:  ICI drops from 50-100 ms (search) to 5-10 ms (capture)
  Physics: As range decreases, two-way travel time decreases,
           allowing faster pulse repetition → higher update rate.
  Same equation: ICI >= 2*r_max/c + t_processing

CONVERGENCE 2: Broadband Click → Range Resolution
  Orca: ~100 kHz bandwidth → ~7.5 mm range resolution (in water)
  Bat:  ~60 kHz bandwidth  → ~2.9 mm range resolution (in air)
  Physics: dr = c / (2*B). Same equation, different c.

CONVERGENCE 3: Impedance Matching at Every Boundary
  Orca: Melon (graded lipid) + mandible fat pads (graded reception)
  Bat:  Pinna (air to tympanum) + ossicles (air to cochlear fluid)
  Shark: Ampullae gel (seawater to sensory cell, matched conductivity)
  Physics: Maximum energy transfer requires Z_1 ≈ Z_2. Same principle.

CONVERGENCE 4: Multi-Modal Sensor Fusion
  Salmon: Magnetic map → magnetic compass → olfactory
  Fox:    Acoustic bearing → magnetic inclination → range
  Birds:  Cryptochrome + magnetite + star + sun + landmarks
  Physics: Kalman-like optimal estimation from multiple noisy channels.

CONVERGENCE 5: Two-Coordinate Position Systems
  Salmon: Field intensity + inclination = biological GPS
  Engineering GPS: Time delays from multiple satellites
  Birds:  Cryptochrome direction + magnetite intensity
  Physics: Two independent measurements → unique position.
```

---

## 4. Physics-to-Biology Domain Map

This section maps each physics domain to its biological implementations with quantitative parameters, expanding the schema defined in [00-data-schema.md](00-data-schema.md).

---

### 4.1 Acoustic Domain

| Physics Sub-Domain | Governing Equation | Biological Implementation | Key Parameters | PNW Species |
|--------------------|--------------------|--------------------------|----------------|-------------|
| Time-of-flight ranging | r = c*dt/2 | Click-echo delay measurement | Orca: c=1500, 152 m max range; Bat: c=343, 1-10 m typical | Orca, bat |
| Transmission loss (spreading) | TL = 20*log10(r) | Maximum detection range constraint | Orca: 2TL=91.8 dB at 152 m; Bat: 2TL=40 dB at 10 m | Orca, bat |
| Transmission loss (absorption) | TL_abs = alpha*r | Frequency-dependent range limit | alpha = 0.015 dB/m at 50 kHz seawater; alpha ≈ 1.2 dB/m at 50 kHz air | Orca, bat |
| Frequency-dependent reflection | R_I = [(Z2-Z1)/(Z2+Z1)]^2 | Target detection/discrimination | Swim bladder: 99.9% reflection; fish muscle: 0.12% | Orca, salmon (as target) |
| Refraction / beam-forming | sin(theta1)/c1 = sin(theta2)/c2 | Directional emission and reception | Melon GRIN lens: c_core=1350, c_periph=1450; beam ~10 deg | Orca, dolphin |
| Doppler shift | f_echo = f_0*(c+v)/(c-v) | Velocity estimation | Bat DSC: 110 Hz std dev at 67.5 kHz; Orca: time-domain differencing | Bat (CF), orca |
| Binaural localization | ITD = (d/c)*(theta+sin(theta)) | Directional hearing | Orca ILD >30 dB at 50 kHz; Bat ILD dominant above ~11 kHz | Orca, bat, fox |
| Resonance / comb filtering | f_n = n/tau; Q = f/BW | Frequency analysis, target classification | Auditory fovea Q=50-200+; click train comb spacing = 1/ICI | Bat (CF), orca |
| Impedance matching | T_I = 4*Z1*Z2/(Z1+Z2)^2 | Energy coupling across boundaries | Ossicles: 22 dB gain; melon: <0.35% internal reflection | All acoustic species |

### 4.2 Electromagnetic Domain

| Physics Sub-Domain | Governing Equation | Biological Implementation | Key Parameters | PNW Species |
|--------------------|--------------------|--------------------------|----------------|-------------|
| Magnetostatic torque | tau = m*B*sin(theta) | Magnetite compass/map | Single crystal: m~5e-17 A*m^2; chain of 20: SNR~11.6 | Salmon, birds, fox, whales |
| Two-coordinate map | F(lat,lon) + I(lat,lon) = position | Inherited magnetic GPS | Gradient: dF/dx ~2-5 nT/km, dI/dx ~0.01-0.05 deg/km | Pink salmon, Chinook salmon |
| Radical-pair quantum mechanics | H_Z = -gamma_e*S.B | Cryptochrome visual compass | Cry4 in retina; cos^2 angular dependence; coherence ~1-10 us | Migratory birds, red fox |
| Electrostatic field sensing | E ~ p/(4*pi*sigma*r^3) | Ampullae of Lorenzini | 5 nV/cm sensitivity; 0.5-8 Hz passband; proton semiconductor gel | Spiny dogfish, big skate |
| Faraday electromagnetic induction | E_induced = v x B | Navigation via self-motion EMF | E ≈ 55 uV/m at 1 m/s in Earth's field (55 uT) | Sharks (Faraday nav), salmon (dam interference) |
| Resonant inductive coupling | f = 1/(2*pi*sqrt(LC)) | PIT tag telemetry | 134.2 kHz; 12 mm x 2 mm; passive; 60M+ deployed | Tracked: all PNW salmonids |

### 4.3 Signal Processing Domain

| Physics Sub-Domain | Governing Equation | Biological Implementation | Engineering Equivalent | PNW Species |
|--------------------|--------------------|--------------------------|----------------------|-------------|
| Impedance matching | Z_out = Z_in (conjugate match) | Ossicles, melon, mandible fat pads, ampullae gel | Transformer, matching network, anti-reflection coating | All sensing species |
| Fourier analysis | f(x) = f_max*e^(-alpha*x) (tonotopy) | Cochlear basilar membrane | FFT, filter bank, STFT | All auditory species |
| Sampling theorem | f_sample >= 2*f_max | Neural spike rates, phase-locking | ADC, sample-and-hold | All auditory species |
| Error correction | C = B*log2(1+S/N) | Redundant neural pathways, population coding | Parity, Reed-Solomon, CRC | All sensing species |
| Sensor fusion | x_k = F*x_{k-1} + B*u_k + w_k | Multi-modal integration | Kalman filter, Bayesian estimation | Salmon, fox, birds, orca |
| Frequency-locked loop | f_emit adjusted to hold f_echo = f_ref | Bat DSC | PLL, superheterodyne receiver | CF bats (not PNW native) |
| Matched filtering | R(tau) = integral[x(t)*h(t-tau)dt] | Neural template matching | Cross-correlator, matched filter bank | Orca, bat, GPU pipeline |
| Clutter rejection | Silent frequency band from DSC | DSC + fovea + silent band | MTI radar, clutter map subtraction | CF bats |

---

## 5. Cross-Module Connection Analysis

This section examines the deep physics connections that span multiple modules and cannot be understood from any single page in isolation.

---

### 5.1 Doppler ↔ Compression Wave Coupling

The Doppler effect requires a propagation medium with defined wave speed. The magnitude of Doppler shift is determined by the ratio v/c — velocity relative to wave speed. This creates a fundamental asymmetry between air and water echolocators:

```
In air (c = 343 m/s):
  v/c at 5 m/s = 0.0146 → delta_f = 1,458 Hz at 50 kHz
  Result: Doppler shifts are LARGE — CF bat strategy viable

In water (c = 1500 m/s):
  v/c at 5 m/s = 0.00333 → delta_f = 333 Hz at 50 kHz
  Result: Doppler shifts are SMALL — FM strategy preferred

This is why CF bats evolved in air but not in water.
This is why orcas use time-domain velocity estimation (range differencing).
The physics of the propagation medium constrains the sensing strategy.
```

**Pages connected:** [01-sonar-echo-delay.md](01-sonar-echo-delay.md) (compression waves, sound speed), [02-doppler-effect.md](02-doppler-effect.md) (Doppler equation, medium dependence), [03-refraction-reflection-compression.md](03-refraction-reflection-compression.md) (wave equation), [pnw-01-southern-resident-orca.md](pnw-01-southern-resident-orca.md) (orca time-domain approach), [pnw-03-bat-echolocation.md](pnw-03-bat-echolocation.md) (bat FM strategy)

---

### 5.2 Magnetic Inclination ↔ Acoustic Ranging in the Fox

The fox magnetic rangefinder is the most remarkable cross-domain connection in the atlas. It fuses two entirely independent physics channels into a single targeting solution:

```
ACOUSTIC CHANNEL (Module 1):
  Input: Prey rustling sounds under snow
  Processing: Binaural localization (ITD/ILD)
  Output: Bearing to prey (azimuth angle)

MAGNETIC CHANNEL (Module 2):
  Input: Earth's magnetic field (I = 67-72 deg in PNW)
  Processing: Cryptochrome visual overlay (Cry4 in retina)
  Output: Inclination reference angle (constant at any location)

FUSION:
  Acoustic bearing gives DIRECTION to prey
  Magnetic inclination gives a REFERENCE ANGLE (the "crosshair" in the fox's visual field)
  When the fox aligns NE (~20-40 deg magnetic), the prey sound source
  intersects the magnetic inclination line at a specific distance:
    d = (h + D) / tan(I)
  This is two-angle triangulation: acoustic azimuth + magnetic dip = range.

EVIDENCE:
  592 pounces, 84 foxes (Cerveny et al. 2011)
  NE-aligned pounces: 74% success
  Other directions: 18% success
  The NE alignment is where the triangulation geometry is optimal.
```

This connection spans:
- **Acoustic physics:** binaural localization ([04-phase-comb-filter.md](04-phase-comb-filter.md))
- **EM physics:** magnetic field inclination ([10-magnetic-fields-magnetoreception.md](10-magnetic-fields-magnetoreception.md))
- **Quantum biology:** cryptochrome visual sense ([12-cryptochrome-quantum-compass.md](12-cryptochrome-quantum-compass.md))
- **Signal processing:** multi-modal sensor fusion ([05-signal-processing-analogues.md](05-signal-processing-analogues.md))
- **Species biology:** red fox hunting behavior ([11-fox-magnetic-rangefinder.md](11-fox-magnetic-rangefinder.md), [pnw-05-fox-magnetic-hunting.md](pnw-05-fox-magnetic-hunting.md))

---

### 5.3 Electromagnetic Induction Across Three Contexts

Faraday's law (`EMF = -dPhi/dt`) appears in three distinct biological/engineering contexts within this atlas:

```
CONTEXT 1: Shark Navigation (Faraday induction)
  A shark swimming at velocity v through Earth's field B
  experiences an induced EMF across its body:
    E_induced = v x B ≈ v * B * sin(theta)
  At 1 m/s in 55 uT: E ≈ 55 uV/m
  Detected by ampullae of Lorenzini (5 nV/cm sensitivity)
  → Provides heading relative to magnetic field lines
  Pages: 13-electroreception-lorenzini.md, pnw-04-elasmobranchs-electroreception.md

CONTEXT 2: PIT Tag Telemetry (resonant inductive coupling)
  An interrogation antenna drives an AC magnetic field at 134.2 kHz
  The PIT tag coil (inductance L) experiences induced EMF
  Powers the tag circuit, which backscatters a modulated signal
    EMF = -dPhi/dt = -N * A * dB/dt
  Resonant condition: f = 1/(2*pi*sqrt(LC)) = 134.2 kHz
  → Individual fish identified at dam passage
  Pages: 14-radio-telemetry-coils.md, pnw-02-pacific-salmon-magnetic.md

CONTEXT 3: Biological "Coils" (cochlear hair bundles)
  The stereocilia bundles of hair cells in the cochlea
  are mechanically resonant structures that respond to
  specific frequencies — analogous to tuned LC circuits.
  The resonant frequency depends on bundle stiffness (analogue of L)
  and mass loading (analogue of C).
  Pages: 14-radio-telemetry-coils.md, 05-signal-processing-analogues.md

Same law (Faraday). Same equation. Three implementations:
  biological navigation, engineering telemetry, biological transduction.
```

---

### 5.4 Impedance Matching in Both Acoustic and Electromagnetic Systems

Impedance matching — maximizing energy transfer at a boundary between media of different impedance — is a universal principle that appears in both acoustic and electromagnetic sensing:

```
ACOUSTIC IMPEDANCE MATCHING:
  Problem: Air (Z=415 Rayl) → cochlear fluid (Z=1.5 MRayl) → 99.94% reflection
  Solution: Middle ear ossicles (area ratio 17.2:1 + lever 1.3:1 = 22 dB gain)
  Also: Melon lipid gradient (transmission, Z graded from 1.28 to 1.54 MRayl)
  Also: Mandible fat pads (reception, Z graded from water to middle ear)

ELECTROMAGNETIC IMPEDANCE MATCHING:
  Problem: Seawater (sigma ~4 S/m) → sensory epithelium → detect 5 nV/cm
  Solution: Ampullae gel (proton semiconductor, conductivity 1.8 S/m,
            matched to seawater to minimize junction potentials)
  Also: PIT tag coil resonance (impedance matching at 134.2 kHz
        maximizes energy transfer from interrogation field)

The same principle — Z_source ≈ Z_load for maximum transfer —
governs energy coupling in BOTH domains. The physics is identical;
the implementation differs (pressure waves vs electromagnetic fields).
```

**Pages connected:** [03-refraction-reflection-compression.md](03-refraction-reflection-compression.md) (acoustic impedance), [05-signal-processing-analogues.md](05-signal-processing-analogues.md) (impedance matching analogy), [13-electroreception-lorenzini.md](13-electroreception-lorenzini.md) (ampullae gel conductivity), [14-radio-telemetry-coils.md](14-radio-telemetry-coils.md) (resonant impedance matching)

---

### 5.5 Error Correction Across All Domains

Every biological sensing system faces noise. Every system employs redundancy and error correction — the biological equivalent of Shannon's channel coding theorem:

```
ACOUSTIC ERROR CORRECTION:
  Orca: ~100,000 auditory nerve fibers; hypertrophied brainstem nuclei;
        population coding across thousands of neurons;
        "near-optimal" processing despite "mediocre" transducers (Au & Simmons)
  Bat:  Redundant frequency representation across cochlea;
        cortical map expansion for f_ref (30-50% of auditory cortex)

MAGNETIC ERROR CORRECTION:
  Salmon: Chain of 20 magnetite crystals (SNR = 20 * 0.58 = 11.6);
          temporal averaging across multiple neural samples;
          spatial averaging across multiple receptor clusters
  Birds: Dual magnetoreception systems (cryptochrome + magnetite)
         provide independent, redundant compass information;
         additional non-magnetic compasses (star, sun, landmark)

ELECTRORECEPTIVE ERROR CORRECTION:
  Sharks: Bilateral ampullae pairs enable common-mode rejection
          (signals present equally on both sides are subtracted);
          0.5-8 Hz bandpass rejects out-of-band noise;
          efferent gain control adjusts sensitivity to ambient conditions

CROSS-DOMAIN:
  Fox: Two independent physics channels (acoustic + magnetic)
       provide redundancy — if one is degraded (e.g., wind noise
       obscures acoustic channel), the other still constrains the estimate

Shannon's theorem applies universally:
  C = B * log2(1 + S/N)
  More redundancy (effectively more bandwidth) → lower error rate
```

---

### 5.6 The Orca-Salmon-Physics Chain

The most significant conservation-relevant connection in this atlas spans the entire Acoustic and Electromagnetic modules:

```
CHAIN:
  Earth's magnetic field (EM physics, 10-magnetic-fields)
    → Salmon navigate via magnetic map (EM biology, pnw-02-pacific-salmon)
    → Salmon approach natal streams (EM→chemical sensor fusion, 05-signal-processing)
    → Salmon swim bladder reflects orca echolocation (acoustic physics, 03-refraction)
    → Orca detects Chinook by swim bladder TS (sonar equation, 01-sonar-echo-delay)
    → Orca discriminates species by acoustic signature (signal processing, 05-analogues)
    → Vessel noise raises NL, reduces detection range (sonar equation, 01-sonar-echo-delay)
    → Fewer Chinook detected → reduced foraging success → population decline
    → Dam EM interference may disrupt salmon magnetic navigation
    → Fewer salmon returning → fewer Chinook for orcas
    → CASCADING FAILURE from physics disruption at multiple points

CONSERVATION IMPLICATION:
  Every physics phenomenon in this atlas connects to this chain.
  Acoustic noise disrupts orca hunting (Module 1).
  Electromagnetic interference disrupts salmon navigation (Module 2).
  Both feed into the same population outcome:
    75 remaining Southern Resident orcas.
```

---

### 5.7 The GPU Pipeline as Cross-Domain Integrator

The GPU/ML pipeline (Module 5) bridges acoustic and electromagnetic domains by processing data from both:

```
ACOUSTIC INPUTS TO GPU:
  Hydrophone recordings → STFT → ORCA-SPOT CNN → orca detection (>95%)
  Orca call classification → harmonic comb pattern recognition
  Click train analysis → ICI extraction → behavioral state estimation
  BirdNET → avian species identification from vocalizations

ELECTROMAGNETIC INPUTS TO GPU:
  Biologging tags: 3-axis accelerometer + magnetometer + depth sensor
  → Kalman filter fusion → 3D dive reconstruction
  → Behavioral state classification (search, pursuit, capture)
  PTAGIS detections: time-stamped tag reads at 500+ sites
  → Survival models → population dynamics

SYNTHESIS ON GPU:
  Acoustic behavioral state (from click trains) +
  Kinematic state (from biologging tags) +
  Environmental state (from hydrophones, temperature, depth) =
  Complete picture of orca foraging ecology
  → Informs conservation policy (Quiet Sound, vessel buffers)
```

---

## 6. Deep-Link Page Index

Every page in the Bio-Physics Sensing atlas, with its full metadata: title, URL slug, physics phenomena documented, species referenced, and cross-links to other pages.

---

### 6.1 Support Pages

| # | Title | File | Type | Content Summary |
|---|-------|------|------|----------------|
| 00a | Data Schema | `00-data-schema.md` | Schema | Page schemas for physics and species pages; file naming conventions; interrelationships map schema |
| 00b | Source Index | `00-source-index.md` | Reference | Complete source catalog: G1-G5 (government), P1-P12 (peer-reviewed), O1-O4 (professional); reliability tiers (Gold/Silver/Bronze) |

### 6.2 Physics Phenomenon Pages

| # | Title | File | Domain | Governing Equations | Species Referenced | Cross-Links |
|---|-------|------|--------|--------------------|--------------------|-------------|
| 01 | Sonar and Echo-Delay Ranging | `01-sonar-echo-delay.md` | Acoustic | SL-2TL+TS-NL=SE; r=c*dt/2; TL=20*log10(r)+alpha*r; TS=10*log10(sigma/4pi); dr=c/(2B) | Orca, dolphin, bat (E. fuscus, M. lucifugus), Chinook salmon (as target) | 02, 03, 04, 05 |
| 02 | Doppler Effect and Blue Shift | `02-doppler-effect.md` | Acoustic | f_echo=f_0*(c+v)/(c-v); delta_f≈2*f_0*v/c; micro-Doppler: f_uD(t)=4pi*f_0*f_wing*A_wing*cos(2pi*f_wing*t)/c | Horseshoe bat (DSC), PNW FM bats, orca, dolphin | 01, 03, 04, 05 |
| 03 | Refraction, Reflection, Compression | `03-refraction-reflection-compression.md` | Acoustic | sin(theta1)/c1=sin(theta2)/c2; Z=rho*c; R=(Z2-Z1)/(Z2+Z1); R_I=R^2; c=sqrt(K/rho); wave equation | Dolphin/orca (melon), Chinook (swim bladder), blue whale, PNW bats | 01, 02, 04, 05 |
| 04 | Phase, Comb Filtering, Binaural | `04-phase-comb-filter.md` | Acoustic | ITD=(d/c)*(theta+sin(theta)); ILD(f,theta); Q=f_center/BW; |H(f)|^2=2*(1+cos(2pi*f*tau)); delta_f*delta_t>=1/(4pi) | Orca, dolphin, barn owl, PNW bats, CF bats | 01, 02, 03, 05 |
| 05 | Signal Processing Analogues | `05-signal-processing-analogues.md` | Signal Processing | T_I=4Z1Z2/(Z1+Z2)^2; f(x)=f_max*e^(-alpha*x); f_sample>=2*f_max; C=B*log2(1+S/N); Kalman filter | All acoustic species, salmon (sensor fusion), orca (software-defined radio analogy) | 01, 02, 03, 04, 10, 11 |
| 10 | Magnetic Fields and Magnetoreception | `10-magnetic-fields-magnetoreception.md` | Electromagnetic | Maxwell's eqs; tau=m*B*sin(theta); U=-m*B*cos(theta); B=(Bx,By,Bz); F=sqrt(H^2+Z^2); tan(I)=Z/H | Salmon (all 5 PNW species), steelhead trout, gray whale, humpback, red fox, pigeons, sea turtles | 11, 12, 13, 14 |
| 11 | Fox Magnetic Rangefinder | `11-fox-magnetic-rangefinder.md` | EM + Acoustic | d=(h+D)/tan(I); triangulation geometry; error ~1.5 cm at 2 deg uncertainty | Red fox | 10, 12, 04, 05 |
| 12 | Cryptochrome Quantum Compass | `12-cryptochrome-quantum-compass.md` | EM / Quantum | H_Z=-gamma_e*S.B; singlet-triplet interconversion; cos^2(theta) angular dependence; quantum coherence ~1-10 us | Migratory birds (Pacific Flyway), red fox, European robin (model species) | 10, 11, 13 |
| 13 | Electroreception / Ampullae of Lorenzini | `13-electroreception-lorenzini.md` | Electrostatic / EM | E~p/(4pi*sigma*r^3); E_induced=v x B; V≈v*B*L*sin(theta); 0.5-8 Hz bandpass | Sharks, skates, rays — spiny dogfish, big skate, Pacific angel shark, sixgill | 10, 12, 14 |
| 14 | Radio Telemetry, Coils, Inductors | `14-radio-telemetry-coils.md` | Electromagnetic | EMF=-dPhi/dt; f=1/(2pi*sqrt(LC)); 134.2 kHz resonance; mutual inductance coupling | All PTAGIS-tracked salmonids; biological coil analogues | 10, 13 |

### 6.3 Species Pages

| # | Title | File | Primary Sensing | Key Physics | Conservation Status | Cross-Links (Phenomenon Pages) |
|---|-------|------|----------------|-------------|--------------------|-----------------------------|
| pnw-01 | Southern Resident Orca | `pnw-01-southern-resident-orca.md` | Biosonar (echolocation) | Sonar eq, echo delay, impedance, refraction (melon), binaural (mandible) | ESA Endangered (<75 individuals) | 01, 02, 03, 04, 05, 07 |
| pnw-02 | Pacific Salmon — Magnetic Map | `pnw-02-pacific-salmon-magnetic.md` | Magnetoreception | Magnetic torque, two-coordinate map, multi-modal sensor fusion | 28 ESA-listed ESUs | 10, 11, 14, 05 |
| pnw-03 | PNW FM Bats — Echolocation | `pnw-03-bat-echolocation.md` | FM echolocation | Echo delay, FM sweep bandwidth, Doppler tolerance, range resolution | Least Concern (E. fuscus) / Endangered (M. lucifugus, WNS) | 01, 02, 03, 04, 05 |
| pnw-04 | Pacific Elasmobranchs — Electroreception | `pnw-04-elasmobranchs-electroreception.md` | Electroreception | Bioelectric dipole fields, Faraday induction, ampullae 5 nV/cm | Species-dependent | 13, 10, 14 |
| pnw-05 | Red Fox — Magnetic Hunting | `pnw-05-fox-magnetic-hunting.md` | Acoustic + magnetic fusion | Binaural localization, magnetic inclination triangulation, cryptochrome | Least Concern | 11, 10, 12, 04, 05 |
| pnw-06 | Migratory Birds — Compass | `pnw-06-migratory-birds-compass.md` | Cryptochrome + magnetite | Radical-pair quantum mechanics, magnetite torque, multi-modal navigation | Species-dependent (Pacific Flyway) | 12, 10, 05 |

### 6.4 Synthesis and Pipeline Pages

| # | Title | File | Type | Content Summary |
|---|-------|------|------|----------------|
| 06 | Cross-Reference Atlas | `06-interrelationships-atlas.md` | Synthesis (this document) | Full interrelationships table, ASCII diagram, signal processing comparison, physics-to-biology domain map, cross-module analysis, deep-link index |
| 07 | GPU / ML Pipeline | `07-gpu-ml-pipeline.md` | Pipeline | ORCA-SPOT CNN, OrcaHello, BirdNET, STFT mathematics, comb filter GPU detection, biologging Kalman fusion, biological-computational convergence |
| 08 | Bibliography | `08-bibliography.md` | Reference | Complete bibliography organized by category with reliability tiers |
| 09 | Verification Matrix | `09-verification-matrix.md` | Verification | 12 success criteria assessment + 4 safety-critical tests |

---

### 6.5 Complete Cross-Reference Matrix

This matrix shows which physics phenomena appear in which species pages. An "X" indicates the phenomenon is substantively discussed (not merely mentioned) in the species page.

```
                     pnw-01  pnw-02  pnw-03  pnw-04  pnw-05  pnw-06
                     Orca    Salmon  Bats    Sharks  Fox     Birds
                     ------  ------  ------  ------  ------  ------
Sonar equation        X               X
Echo-delay ranging    X               X                X
Doppler effect        X               X
Refraction/melon      X
Impedance/reflection  X
Compression waves     X               X
Binaural/phase        X               X                X
Comb filtering        X
Auditory fovea                        X
Magnetic field                X                        X       X
Magnetic torque               X                        X       X
Magnetic map/nav              X                        X       X
Cryptochrome                                           X       X
Electroreception                              X
Faraday induction                             X
Radio telemetry               X
Sensor fusion         X       X       X       X        X       X
Impedance matching    X               X       X
GPU pipeline          X                                        X
```

**Species with broadest physics coverage:** Southern Resident orca (9 phenomena) and red fox (7 phenomena, spanning acoustic and EM domains).

**Only cross-domain species:** Red fox — the only species in the atlas that uses BOTH acoustic AND electromagnetic physics as primary sensing channels simultaneously integrated into a single targeting solution.

---

### 6.6 Source Distribution Across Pages

| Source | Type | Pages Citing | Total Citations |
|--------|------|-------------|-----------------|
| G1 — NOAA NWFSC | Government | 01, 02, 03, 04, 05, 07, 10, pnw-01, pnw-02 | 9 |
| G2 — USGS Geomagnetism | Government | 10, 11, 12, 13, pnw-02, pnw-04, pnw-05, pnw-06 | 8 |
| G3 — Puget Sound Institute | Government | 02, 03, pnw-04 | 3 |
| G4 — PTAGIS | Government | 10, 14, pnw-02 | 3 |
| G5 — NOAA Vital Signs | Government | 01, 03, 04, 10, pnw-01, pnw-02 | 6 |
| P1 — Putman et al. (2020) | Peer-reviewed | 10, pnw-02, pnw-06 | 3 |
| P2 — Au & Simmons (2007) | Peer-reviewed | 01, 02, 03, 04, 05, pnw-01, pnw-03, pnw-05 | 8 |
| P3 — Mulsow et al. (2020) | Peer-reviewed | 01, 03, 04, pnw-01 | 4 |
| P4 — Cerveny et al. (2011) | Peer-reviewed | 10, 11, pnw-05 | 3 |
| P5 — Lohmann Lab | Peer-reviewed | 10, 11, 12, pnw-02, pnw-05, pnw-06 | 6 |
| P6 — Knauer et al. (2025) | Peer-reviewed | 02, 04, pnw-03 | 3 |
| P7 — Kagawa et al. (2024) | Peer-reviewed | 02, 04 | 2 |
| P8 — Bergler et al. (2019) | Peer-reviewed | 01, 04, 07, pnw-01 | 4 |
| P9 — Holt/Tennessen NWFSC | Peer-reviewed | 01, 02, 03, 04, 07, pnw-01 | 6 |
| P10 — Walker et al. (1977) | Peer-reviewed | 10 | 1 |
| P11 — Fleissner et al. (2003) | Peer-reviewed | 10, pnw-06 | 2 |
| P12 — Klimley | Peer-reviewed | 13, pnw-04 | 2 |
| O1 — dolphins.org | Professional | 01, 03, 05 | 3 |
| O2 — Orca Behavior Institute | Professional | 01, 02, 04, 07, pnw-01 | 5 |
| O3 — Center for Whale Research | Professional | pnw-01 | 1 |
| O4 — Acoustics Today / ASA | Professional | 03, 04 | 2 |

**Most-cited source:** P2 (Au & Simmons, 2007) with 8 pages — the foundational reference for echolocation physics across both dolphins and bats.

**Most-cited government source:** G1 (NOAA NWFSC) with 9 pages — the primary authority for orca echolocation, salmon conservation, and Salish Sea acoustics.

---

## Summary Statistics

```
Total physics phenomena documented:     17+
Total governing equations:              30+
Total PNW species with detailed pages:  6 (orca, salmon, bats, sharks, fox, birds)
Total additional species referenced:    20+ (other salmon species, whales, trout, raptors,
                                             songbirds, waterfowl, pigeons, sea turtles)
Total unique sources:                   21 (G1-G5, P1-P12, O1-O4)
Total source citations across pages:    74
Total research files in atlas:          19 (2 support + 10 physics + 6 species + 1 GPU)
Total synthesis files:                  3 (this atlas + bibliography + verification)

Physics domains covered:
  Acoustic:       8 phenomena (sonar, Doppler, refraction, impedance, compression,
                              binaural, comb filter, auditory fovea)
  Electromagnetic: 6 phenomena (magnetic field, fox rangefinder, cryptochrome,
                               electroreception, Faraday induction, radio telemetry)
  Signal Processing: 7 analogues (impedance matching, Fourier, Nyquist,
                                  error correction, sensor fusion, PLL, matched filter)
  GPU/Computational: 1 pipeline (STFT + CNN + comb detection + Kalman fusion)

Cross-domain connections:     12 identified and analyzed (Section 5)
Conservation-relevant chains: 3 major (orca-salmon-physics, dam EM interference,
                                       bird light/RF pollution)
```

---

*The physics does not change. What this atlas demonstrates is that the same equations govern a Navy sonar array and a dolphin's melon, a GPS satellite and a salmon's magnetite crystals, a quantum magnetometer and a bird's retinal cryptochrome, an RFID reader and a shark's ampullae. The implementations differ. The frequencies differ. The taxa differ. The mathematics is identical. This atlas is the map of those identities.*
