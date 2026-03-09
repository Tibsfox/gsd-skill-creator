# PNW Bat Species: Doppler Echolocation

> *Biology discovered it first. The physics is universal. The Pacific Northwest is where it matters most right now.*

---

## Overview

The forests of the Pacific Northwest are among the most acoustically cluttered environments on Earth for an echolocating animal. Dense conifer canopies, tangled understory, rain, wind, and the complex three-dimensional structure of old-growth temperate rainforest create an echo landscape where every surface returns a signal and every signal overlaps the next. Into this acoustic maze, PNW bats launch frequency-modulated (FM) sweeps at 20-80 kHz, resolve echoes separated by microseconds, and capture flying insects in complete darkness [P2, P6].

The Big Brown Bat (*Eptesicus fuscus*) and the Little Brown Bat (*Myotis lucifugus*), along with more than a dozen other *Myotis* species, are the echolocating bats of the Pacific Northwest. They use FM echolocation -- broadband frequency sweeps that sacrifice Doppler velocity information for precise range discrimination through echo delay [P2]. This is the opposite strategy from constant-frequency (CF) bats like the horseshoe bats of the Old World, which maintain a narrow-band signal to exploit Doppler shifts for velocity and flutter detection [P6].

This document traces the physics of FM bat echolocation in PNW forests, from laryngeal click generation to neural target classification, and explains why FM bats tolerate Doppler-shifted echoes while CF bats do not. Every quantitative claim cites sources from the [Source Index](00-source-index.md).

---

## Table of Contents

1. [Species Profiles](#species-profiles)
2. [Conservation Context](#conservation-context)
3. [FM Echolocation: The Physics of Frequency Sweeps](#fm-echolocation-the-physics-of-frequency-sweeps)
   - [The FM Sweep](#the-fm-sweep)
   - [Range Resolution from Bandwidth](#range-resolution-from-bandwidth)
   - [The Time-Bandwidth Product](#the-time-bandwidth-product)
4. [FM vs. CF: Two Solutions to the Same Physics](#fm-vs-cf-two-solutions-to-the-same-physics)
   - [CF Bats and Doppler Shift Compensation](#cf-bats-and-doppler-shift-compensation)
   - [Why PNW FM Bats Tolerate Doppler](#why-pnw-fm-bats-tolerate-doppler)
   - [The Cochlear Difference](#the-cochlear-difference)
5. [Signal Processing Chain](#signal-processing-chain)
6. [Click Generation: The Laryngeal System](#click-generation-the-laryngeal-system)
7. [Beam Formation and Emission](#beam-formation-and-emission)
8. [Echo Reception and Cochlear Processing](#echo-reception-and-cochlear-processing)
   - [Pinna Design](#pinna-design)
   - [The Basilar Membrane as Frequency Analyzer](#the-basilar-membrane-as-frequency-analyzer)
   - [Temporal Processing](#temporal-processing)
9. [Echolocation in Cluttered PNW Forests](#echolocation-in-cluttered-pnw-forests)
   - [The Clutter Problem](#the-clutter-problem)
   - [Adaptive Call Design](#adaptive-call-design)
   - [Short FM Sweeps for Close Range](#short-fm-sweeps-for-close-range)
   - [The Acoustic Scene Analysis Problem](#the-acoustic-scene-analysis-problem)
10. [Hunting Behavior and Call Sequences](#hunting-behavior-and-call-sequences)
    - [Search Phase](#search-phase)
    - [Approach Phase](#approach-phase)
    - [Terminal Buzz](#terminal-buzz)
11. [The Doppler Effect in FM Bat Echolocation](#the-doppler-effect-in-fm-bat-echolocation)
    - [Doppler Shift Physics](#doppler-shift-physics)
    - [Doppler in FM Sweeps](#doppler-in-fm-sweeps)
    - [Why FM Bats Can Ignore Doppler (Mostly)](#why-fm-bats-can-ignore-doppler-mostly)
12. [Comparison: Orca Biosonar vs. Bat Echolocation](#comparison-orca-biosonar-vs-bat-echolocation)
13. [Engineering Parallels](#engineering-parallels)
14. [Interrelationships and Cross-Links](#interrelationships-and-cross-links)
15. [Summary Tables](#summary-tables)
16. [Sources](#sources)

---

## Species Profiles

### Big Brown Bat

| Field | Value |
|-------|-------|
| **Common Name** | Big Brown Bat |
| **Scientific Name** | *Eptesicus fuscus* |
| **Wingspan** | 32-39 cm |
| **Weight** | 14-21 g |
| **Echolocation Type** | FM (frequency modulated) sweeps |
| **Frequency Range** | ~25-75 kHz (fundamental), harmonics to 100+ kHz |
| **Habitat** | PNW lowlands, urban areas, forest edges, riparian zones |
| **Diet** | Flying insects (beetles, moths, flies, wasps) |
| **Roosting** | Buildings, bridges, tree cavities, rock crevices |
| **PNW Range** | Throughout Washington, Oregon, British Columbia |

The Big Brown Bat is one of the most widespread and adaptable bats in North America. In the PNW, it occupies a range of habitats from urban Seattle and Portland to rural agricultural areas and forest edges. It is a relatively large, robust bat with powerful flight -- well suited for foraging in open and semi-cluttered environments [P2].

### Little Brown Bat

| Field | Value |
|-------|-------|
| **Common Name** | Little Brown Bat (Little Brown Myotis) |
| **Scientific Name** | *Myotis lucifugus* |
| **Wingspan** | 22-27 cm |
| **Weight** | 5-14 g |
| **Echolocation Type** | FM sweeps |
| **Frequency Range** | ~40-80 kHz (fundamental) |
| **Habitat** | PNW forests, riparian areas, near water |
| **Diet** | Flying insects (midges, mosquitoes, moths, mayflies) |
| **Roosting** | Tree bark, buildings, caves, mines |
| **PNW Range** | Throughout Washington, Oregon, British Columbia |

The Little Brown Bat is historically one of the most abundant bats in North America, though populations in eastern North America have been devastated by White-Nose Syndrome (WNS, caused by the fungus *Pseudogymnoascus destructans*). PNW populations remain less affected, but the westward spread of WNS is a major conservation concern.

### Other PNW Myotis Species

The Pacific Northwest hosts a diverse assemblage of *Myotis* species, all using FM echolocation:

| Species | Common Name | Key Habitat |
|---------|------------|-------------|
| *Myotis yumanensis* | Yuma Myotis | Riparian, over water |
| *Myotis californicus* | California Myotis | Dry forests, rocky areas |
| *Myotis evotis* | Long-eared Myotis | Conifer forests |
| *Myotis thysanodes* | Fringed Myotis | Mixed forests, caves |
| *Myotis volans* | Long-legged Myotis | High-elevation conifer forests |
| *Myotis keenii* | Keen's Myotis | Old-growth coastal forest (BC, WA) |

All PNW *Myotis* species use FM echolocation, with variations in sweep bandwidth, duration, and intensity that reflect their specific foraging habitats and prey types.

---

## Conservation Context

| Threat | Status | PNW Relevance |
|--------|--------|---------------|
| **White-Nose Syndrome** | Spreading westward; detected in Washington state | Devastating to hibernating species; *M. lucifugus* highly susceptible |
| **Habitat loss** | Ongoing; old-growth forest reduction | Reduces roosting sites and foraging habitat |
| **Wind turbines** | Expanding in PNW | Barotrauma and collision mortality; affects migratory species |
| **Light pollution** | Increasing in urban PNW | Disrupts foraging patterns; concentrates insects at lights |
| **Pesticides** | Agricultural and residential use | Reduces insect prey base; direct toxicity |

PNW bat conservation depends on understanding echolocation because the acoustic environment determines foraging success. Forest management practices that maintain structural complexity (snags, canopy gaps, understory layers) preserve the acoustic conditions that bats have evolved to exploit. Conversely, clear-cutting creates open acoustic environments that favor different foraging strategies and may disadvantage species adapted to cluttered-forest echolocation.

---

## FM Echolocation: The Physics of Frequency Sweeps

### The FM Sweep

An FM echolocation call is a rapid frequency sweep -- the bat starts at a high frequency and sweeps downward to a lower frequency over a few milliseconds [P2]:

```
FM Sweep Structure (Big Brown Bat, typical):

  Start frequency:  ~75 kHz
  End frequency:    ~25 kHz
  Duration:         2-10 ms (varies with context)
  Bandwidth:        ~50 kHz
  Sweep rate:       ~5-25 kHz/ms (downward)
  Harmonics:        2nd harmonic at 50-150 kHz

  Time-frequency representation:

  Freq (kHz)
  75 |*
     | *
     |  *
  50 |   *
     |    *
     |     *
  25 |      *
     +---------> Time (ms)
     0    5   10

  The sweep is approximately linear in frequency vs. time
  (a "linear chirp" in engineering terminology).
```

This FM sweep is fundamentally different from the constant-frequency (CF) calls used by horseshoe bats and some other Old World species. The CF bat emits a long, pure tone at a single frequency; the FM bat emits a short, broadband sweep across many frequencies [P2, P6].

### Range Resolution from Bandwidth

The critical advantage of FM echolocation is **precise range resolution**. In any pulse-echo system, the ability to distinguish two targets at slightly different ranges depends on the bandwidth of the signal [P2]:

```
Range Resolution:

  delta_R = c / (2 * B)

  Where:
    delta_R = minimum resolvable range difference (meters)
    c       = speed of sound in air (~343 m/s at 20 deg C)
    B       = bandwidth of the signal (Hz)

  For a Big Brown Bat FM sweep (B = 50 kHz):
    delta_R = 343 / (2 * 50,000)
    delta_R = 343 / 100,000
    delta_R = 0.00343 m
    delta_R ~ 3.4 mm

  For comparison, a CF bat with B = 1 kHz:
    delta_R = 343 / (2 * 1,000)
    delta_R = 343 / 2,000
    delta_R = 0.17 m
    delta_R ~ 17 cm

  The FM bat resolves targets 50 times more precisely than the CF bat.
```

This 3.4 mm range resolution means the FM bat can distinguish between a moth's body and its wing -- or between a moth and a leaf at nearly the same distance. In the cluttered PNW forest environment, this precision is essential for separating prey echoes from background clutter echoes [P2].

### The Time-Bandwidth Product

The **time-bandwidth product** (TBP) is a fundamental measure of the information content of a signal [P2]:

```
Time-Bandwidth Product:

  TBP = T * B

  Where:
    T = signal duration (seconds)
    B = signal bandwidth (Hz)

  For a Big Brown Bat (T = 5 ms, B = 50 kHz):
    TBP = 0.005 * 50,000 = 250

  For a CF horseshoe bat (T = 50 ms, B = 1 kHz):
    TBP = 0.050 * 1,000 = 50

  The FM bat's signal carries 5 times more information.

  By the uncertainty principle (Gabor limit):
    TBP >= 1

  Both bats operate well above the limit, but the FM bat
  uses its information budget for RANGE precision,
  while the CF bat uses its budget for FREQUENCY precision.
```

This is a fundamental tradeoff -- the same physics that governs radar waveform design. The FM bat has chosen range precision; the CF bat has chosen frequency (velocity) precision. Both are valid solutions to the echolocation problem; which is optimal depends on the environment and prey type.

---

## FM vs. CF: Two Solutions to the Same Physics

### CF Bats and Doppler Shift Compensation

**Constant-frequency (CF) bats** -- primarily the horseshoe bats (Rhinolophidae) and Old World leaf-nosed bats (Hipposideridae) -- use a fundamentally different echolocation strategy. They are **not native to the PNW** (no CF bat species occur in North America), but understanding CF echolocation illuminates why PNW FM bats are different [P6, P7].

CF bats emit a long, narrowband signal at a single frequency (e.g., 83 kHz in *Rhinolophus ferrumequinum*). When the bat is flying toward a target, the Doppler effect shifts the returning echo to a higher frequency:

```
Doppler Shift for CF Bat:

  f_echo = f_emit * (c + v_bat) / (c - v_bat)
           (approximation for bat flying toward stationary target)

  More precisely, for a bat flying at velocity v toward a target:
    delta_f = 2 * f_emit * v / c

  For a horseshoe bat (f = 83 kHz, v = 5 m/s):
    delta_f = 2 * 83,000 * 5 / 343
    delta_f ~ 2,420 Hz

  This 2.4 kHz shift is LARGE relative to the bat's
  narrowband signal and the cochlear tuning bandwidth.
```

CF bats perform **Doppler Shift Compensation (DSC)** -- they actively lower their emission frequency to compensate for the expected Doppler shift, so that the returning echo always falls within a narrow frequency band centered on the bat's resting frequency [P6]. The horseshoe bat's cochlea has an **acoustic fovea** -- a greatly expanded region of the basilar membrane devoted to a very narrow frequency band (~83 kHz), providing extraordinary frequency resolution at the expense of range resolution.

Knauer et al. (2025) demonstrated that CF bats create a "silent frequency band" via DSC -- the emitted call is shifted below the fovea frequency, and the echo falls precisely on the fovea [P6]. This allows the bat to detect tiny Doppler shifts caused by insect wing flutter, enabling identification of insects by their wing-beat frequency.

### Why PNW FM Bats Tolerate Doppler

PNW FM bats (Big Brown Bat, Little Brown Bat, all *Myotis* species) do **not** perform Doppler Shift Compensation. They emit their FM sweeps at fixed frequencies regardless of flight speed, and the returning echoes are Doppler-shifted -- but the bats tolerate this [P2, P6].

The reason: **Doppler shift is small relative to FM bandwidth**.

```
Doppler Shift for FM Bat:

  For a Big Brown Bat (v = 5 m/s, f_center = 50 kHz):
    delta_f = 2 * 50,000 * 5 / 343
    delta_f ~ 1,458 Hz ~ 1.5 kHz

  The FM sweep bandwidth is 50,000 Hz.
  The Doppler shift is 1,500 Hz.

  Ratio: 1,500 / 50,000 = 3%

  A 3% frequency shift across a broadband sweep
  is barely noticeable -- it shifts the entire sweep
  slightly up in frequency, but the sweep still spans
  nearly the same bandwidth and provides the same
  range resolution.

  Compare: for the CF bat with 1 kHz bandwidth:
    1,500 / 1,000 = 150%
    The Doppler shift EXCEEDS the signal bandwidth.
    Without compensation, the echo would fall entirely
    outside the cochlear processing window.
```

### The Cochlear Difference

The cochlea of FM bats and CF bats are structurally different, reflecting their different signal processing strategies [P2, P6]:

| Feature | FM Bat (PNW species) | CF Bat (horseshoe bat) |
|---------|---------------------|----------------------|
| **Basilar membrane** | Broadly tuned; gradual stiffness gradient | Acoustic fovea: expanded region for single frequency |
| **Frequency resolution** | Moderate (wide tuning curves) | Extraordinary at fovea frequency |
| **Temporal resolution** | High (resolves individual echoes in rapid succession) | Moderate |
| **Doppler sensitivity** | Low (shift absorbed by broad tuning) | Extreme (detects wing flutter) |
| **Optimal for** | Range discrimination in clutter | Velocity/flutter detection in open space |

The FM bat's broadly tuned cochlea is like a **wideband radio receiver** -- it picks up a broad range of frequencies with moderate selectivity. The CF bat's acoustic fovea is like a **narrowband communications receiver** -- it is exquisitely sensitive at one frequency but deaf to everything else.

For PNW forest environments -- where the primary challenge is separating prey echoes from clutter echoes at slightly different ranges -- the wideband FM strategy is optimal. The precise range resolution enabled by broad bandwidth is worth more than the velocity information sacrificed by abandoning narrowband processing [P2].

---

## Signal Processing Chain

The complete signal processing chain for PNW FM bat echolocation, following the standard schema from the [Data Schema](00-data-schema.md):

```
SOURCE
  Laryngeal muscles contract to generate ultrasonic pulse
  Cricothyroid and other intrinsic laryngeal muscles
  control fundamental frequency and sweep rate
  FM sweep: 20-80 kHz (species-dependent), 2-10 ms duration
  Emission: mouth (most vespertilionid bats) or nose (leaf-nosed bats)
    |
    v
PROPAGATION
  Air (c ~ 343 m/s at 20 deg C, rho ~ 1.225 kg/m^3)
  Atmospheric absorption: alpha ~ 1-3 dB/m at 50 kHz
  (much higher than in water -- limits bat sonar range to ~10-20 m)
  Spherical spreading: 6 dB per doubling of distance
  Clutter: reflections from vegetation, ground, water surface
    |
    v
TRANSDUCER (Outgoing)
  Mouth opening acts as acoustic aperture
  Some species: noseleaf focuses beam
  Beam width: ~30-60 degrees (broader than orca)
  Source level: ~100-120 dB SPL at 10 cm
    |
    v
  [TARGET INTERACTION]
  Reflection from insect body, wings, vegetation
  Insect target strength: very small (~ -40 to -60 dB)
  Wing flutter: creates amplitude and frequency modulation on echo
    |
    v
TRANSDUCER (Incoming)
  Pinnae (external ears): large, complex shape
  Acts as directional antenna and spectral filter
  Tragus: secondary structure that creates direction-dependent
  spectral cues for vertical localization
    |
    v
CONDITIONING
  Middle ear: impedance matching (air to cochlear fluid)
  Stapedial reflex: middle ear muscles contract during call emission,
  attenuating self-stimulation, and relax before echo return
  Cochlea: broadly tuned basilar membrane (no acoustic fovea)
  Tonotopic frequency analysis: base = high freq, apex = low freq
    |
    v
EXTRACTION
  Echo delay -> range: d = c * t / 2
  Echo amplitude -> target size
  Spectral content -> target features
  Interaural differences -> azimuth
  Pinna spectral cues -> elevation
  Call-to-call variation -> target trajectory
    |
    v
DECISION
  Target classification: insect vs. clutter
  Pursuit initiation: approach + terminal buzz
  Obstacle avoidance: steer away from vegetation
  Roost homing: navigate to known landmarks
```

---

## Click Generation: The Laryngeal System

Bat echolocation calls are generated by the **larynx** -- the same organ that produces vocalizations in all mammals, but modified for ultrasonic production [P2]:

1. **Cricothyroid muscles** stretch the vocal membranes (analogous to vocal cords), increasing their tension and raising the fundamental frequency into the ultrasonic range (20-100+ kHz).

2. **Intrinsic laryngeal muscles** modulate the tension dynamically during each call, producing the characteristic frequency sweep of the FM call. The frequency drops rapidly as muscle tension is released during the call.

3. **Subglottic pressure** from the lungs drives air through the tensioned vocal membranes, causing them to vibrate. The energy source is respiratory -- the same pneumatic drive used by orca phonic lips, but operating in air rather than tissue.

4. **Superlaryngeal vocal tract** (pharynx, mouth, nasal passages) shapes the spectral output. In vespertilionid bats (including all PNW species), calls are emitted through the **open mouth**. In some other families, calls are emitted through the **nostrils** and focused by elaborate noseleaf structures.

```
Call Generation Timeline (single FM sweep):

  t = 0 ms:     Laryngeal muscles reach maximum tension
                 Subglottic pressure drives air through membranes
                 Emission begins at highest frequency (~75 kHz)

  t = 0-2 ms:   Muscles progressively relax
                 Frequency sweeps downward
                 Amplitude peaks mid-call

  t = 2-5 ms:   Sweep continues to lowest frequency (~25 kHz)
                 Emission ends

  t = 5-50 ms:  Listening window
                 Stapedial reflex relaxes
                 Echoes from targets at 0.8-8.5 m arrive

  Total cycle: 5-50 ms depending on search/approach/buzz phase
```

The bat must coordinate its breathing, laryngeal muscles, mouth opening, and flight wing beats with extreme precision. Many bat species synchronize call emission with wing beat -- emitting calls during the upstroke when the flight muscles are not compressing the thorax, ensuring maximum subglottic pressure [P2].

---

## Beam Formation and Emission

The bat's mouth acts as the **acoustic aperture** that determines the beam pattern of the emitted call:

```
Beam Width from Aperture Size:

  theta ~ lambda / D (radians)

  Where:
    theta  = beam half-angle (radians)
    lambda = wavelength
    D      = aperture diameter (mouth opening)

  For Big Brown Bat (f = 50 kHz, D ~ 10 mm):
    lambda = 343 / 50,000 = 6.86 mm
    theta  = 6.86 / 10 ~ 0.69 radians ~ 39 degrees

  This is a broad beam -- much wider than the orca's
  10-20 degree beam. The bat illuminates a large
  volume with each call, at the cost of lower
  on-axis source level.

  For comparison, at 80 kHz:
    lambda = 343 / 80,000 = 4.29 mm
    theta  = 4.29 / 10 ~ 0.43 radians ~ 25 degrees

  Higher frequencies produce narrower beams.
  The FM sweep starts high (narrow beam) and ends
  low (broad beam), effectively scanning a cone.
```

The broad beam is advantageous in cluttered environments -- the bat can detect targets and obstacles across a wide angular range without having to scan its head. This is a different tradeoff from the orca, which uses a narrow, focused beam for long-range detection and must physically steer its head to scan.

---

## Echo Reception and Cochlear Processing

### Pinna Design

PNW bat species have **large, complex pinnae** (external ears) that serve as directional acoustic antennas [P2]:

- **Size**: The pinnae of *Myotis* species are disproportionately large relative to head size, increasing the effective aperture for echo reception.
- **Shape**: The complex folds and ridges of the pinna create direction-dependent spectral filtering -- different arrival angles produce different spectral modifications. This enables the bat to determine the elevation of a sound source from the spectral content alone, without needing a vertically separated pair of ears.
- **Tragus**: A small, pointed structure at the base of the pinna creates additional direction-dependent interference patterns, further refining spatial resolution.

```
Pinna Directional Gain (approximate):

  For a pinna of height h = 20 mm at 50 kHz:
    lambda = 6.86 mm
    h/lambda ~ 2.9 (pinna is several wavelengths tall)

  Directional gain ~ 10-15 dB relative to omnidirectional
  This significantly improves the signal-to-noise ratio
  for echoes arriving from the forward direction.
```

### The Basilar Membrane as Frequency Analyzer

The cochlea of FM bats performs a **biological Fourier transform** -- the basilar membrane is tonotopically organized, with high frequencies processed at the base and low frequencies at the apex [P2]:

```
Cochlear Frequency Map (FM bat):

  Base --------> Apex
  80 kHz ------> 10 kHz

  Each point on the membrane responds to a narrow
  band of frequencies, but the tuning is BROAD:

  Q10 (quality factor at 10 dB down) ~ 5-15 for FM bats
  Compare: Q10 ~ 100-300 for CF bat acoustic fovea

  The broad tuning means each point responds to a
  wider band, providing LESS frequency resolution
  but BETTER temporal resolution (shorter impulse
  response).
```

The FM bat's cochlea is optimized for **temporal processing** -- resolving the arrival time of echoes with microsecond precision. This is because range discrimination requires measuring echo delay, and echo delay is a temporal measurement [P2].

### Temporal Processing

The neural circuits downstream of the cochlea in FM bats are specialized for **echo-delay measurement**:

```
Echo Delay Resolution:

  The bat's neural system can resolve echo delays
  of approximately 10-50 microseconds.

  At c = 343 m/s, this corresponds to:
    Range resolution = c * delta_t / 2
    = 343 * 10e-6 / 2
    = 0.00172 m ~ 1.7 mm (best case)

  This is consistent with the bandwidth-limited
  resolution (3.4 mm for 50 kHz bandwidth) and
  may be slightly better due to neural sharpening.
```

The auditory cortex of FM bats contains **delay-tuned neurons** -- neurons that respond maximally to a specific delay between the emitted call and the returning echo. These neurons form a topographic map of target range in the cortex, directly representing the distances to objects in the bat's environment [P2].

---

## Echolocation in Cluttered PNW Forests

### The Clutter Problem

A PNW old-growth forest presents extreme acoustic clutter for an echolocating bat:

```
Clutter Sources in PNW Forest:

  - Tree trunks: strong reflectors at all frequencies
  - Branches: reflectors at wavelengths comparable to branch diameter
  - Leaves/needles: scattering at high frequencies (> 40 kHz)
  - Understory vegetation: dense reflector field
  - Ground: strong broadband reflector
  - Water surfaces (streams, puddles): specular reflector
  - Other bats: potential false targets and interference

  Total clutter echoes per call: potentially hundreds to thousands
  Target echo (single insect): one, at very low level

  Signal-to-clutter ratio: often negative (clutter louder than target)
```

The bat must extract a single weak insect echo from a dense field of vegetation echoes. This is the same problem faced by an air traffic control radar in mountainous terrain, or a submarine sonar in shallow water with strong bottom reverberation.

### Adaptive Call Design

PNW FM bats adapt their echolocation calls to the acoustic environment in real time [P2]:

| Environment | Call Modification | Physics Rationale |
|------------|-------------------|-------------------|
| **Open space** | Longer calls, narrower bandwidth, lower frequency | Maximize range; less clutter to resolve |
| **Forest edge** | Medium calls, full bandwidth | Balance range and clutter rejection |
| **Dense forest** | Short calls, wide bandwidth, higher frequency | Maximize range resolution; reject clutter |
| **Near vegetation** | Very short calls, high frequency | Avoid overlap between call and nearby echoes |
| **Over water** | Longer calls, lower frequency | Specular reflection; less clutter |

This adaptive behavior is analogous to a cognitive radar that selects its waveform based on the operating environment -- and bats have been doing it for 50+ million years.

### Short FM Sweeps for Close Range

In dense PNW forest, bats shorten their FM sweeps dramatically:

```
Close-Range Call Adaptation:

  Open-space search call:
    Duration: 8-10 ms
    Bandwidth: 50 kHz (75 -> 25 kHz)
    Maximum range: ~15 m (before absorption limits)

  Dense-forest call:
    Duration: 1-3 ms
    Bandwidth: 30-50 kHz
    Maximum range: ~3-5 m (self-limited by short call)

  Why shorten the call?

  Overlap problem: If the call is still being emitted when
  the echo returns from a nearby target, the echo is masked.

  Minimum detection range = c * T / 2
  For T = 10 ms:  R_min = 343 * 0.010 / 2 = 1.7 m
  For T = 2 ms:   R_min = 343 * 0.002 / 2 = 0.34 m

  In dense forest, the bat needs to detect targets and
  obstacles at < 1 m, requiring calls shorter than 3 ms.
```

### The Acoustic Scene Analysis Problem

Beyond simple echo-delay ranging, the bat must perform **acoustic scene analysis** -- separating multiple overlapping echoes into distinct objects and classifying each as target, obstacle, or irrelevant clutter [P2]:

1. **Range gating**: Echoes are sorted by delay (range). Objects at different distances produce echoes at different times.
2. **Spectral analysis**: Each echo has a spectral signature determined by the object's size, shape, and material. Insects have different spectral signatures than leaves.
3. **Spatial filtering**: The pinna's directional sensitivity helps separate echoes arriving from different angles.
4. **Temporal tracking**: Across successive calls, the bat tracks how each echo changes in delay and amplitude, building a 4D model (3D position + velocity) of the acoustic scene.

This is computationally equivalent to synthetic aperture processing -- the bat integrates information across multiple calls to build a higher-resolution picture of the environment than any single call could provide.

---

## Hunting Behavior and Call Sequences

### Search Phase

During search flight, the bat emits calls at a rate of approximately **5-10 calls per second**, with relatively long, broadband FM sweeps [P2]:

```
Search Phase Parameters:

  Call rate:     5-10 Hz
  Call duration: 5-10 ms
  Bandwidth:     40-60 kHz
  Source level:   Maximum (~110-120 dB SPL at 10 cm)
  Flight pattern: Regular, often along forest edges or over water
  Purpose:        Detect insects at maximum range (~10-20 m in open air)
```

The search phase is energy-efficient -- the bat is scanning a large volume at low call rate, waiting for a target echo to exceed the detection threshold.

### Approach Phase

When an insect is detected, the bat begins the **approach phase** -- increasing call rate, shortening call duration, and potentially narrowing bandwidth to focus on the target range [P2]:

```
Approach Phase Parameters:

  Call rate:     20-50 Hz (increasing as range closes)
  Call duration: 3-5 ms (shortening)
  Bandwidth:     30-50 kHz
  Source level:   May decrease (target is closer, less TL to overcome)
  Flight pattern: Curved interception trajectory toward target
  Purpose:        Track target position with increasing precision
```

### Terminal Buzz

In the final 200-500 ms before capture, the bat produces a **terminal buzz** -- an extremely rapid sequence of very short calls [P2]:

```
Terminal Buzz Parameters:

  Call rate:     100-200+ Hz (approaching limits of laryngeal muscles)
  Call duration: 0.5-1 ms
  Bandwidth:     Narrowing (may drop to 15-25 kHz)
  Source level:   Decreasing
  Flight pattern: Final interception; wing or tail membrane capture
  Purpose:        Maximum update rate for final guidance

  The terminal buzz provides:
    - Up to 200 position updates per second
    - Range information every 5 ms
    - Sufficient update rate to track insect evasive maneuvers
    - Guidance for the precise wing/tail membrane scoop motion
```

The terminal buzz is functionally identical to the orca's buzz clicking during prey capture -- both represent the transition from search/track to fire-control mode, with maximum information rate at the expense of maximum range [P9].

```
Convergent Evolution: Terminal Buzz

  Bat terminal buzz:     100-200 calls/sec, 0.5-1 ms/call, air medium
  Orca terminal buzz:    100-200+ clicks/sec, <5 ms ICI, water medium

  Different media (air vs. water)
  Different frequencies (50 kHz vs. 50 kHz -- remarkably similar!)
  Different source mechanisms (larynx vs. phonic lips)
  Different receivers (pinnae vs. mandible fat pads)
  Same physics: maximize information rate for terminal guidance
  Same solution: buzz
```

---

## The Doppler Effect in FM Bat Echolocation

### Doppler Shift Physics

The Doppler effect shifts the frequency of a wave when the source and/or receiver are in relative motion [P2, P7]:

```
Doppler Shift (general):

  f_received = f_emitted * (c + v_receiver) / (c - v_source)

For bat echolocation (bat is both source and receiver,
target is approximately stationary):

  Outgoing: bat moves toward target at velocity v
    f_at_target = f_emit * (c + v) / c    (target "hears" higher freq)

  Returning: echo returns to moving bat
    f_received = f_at_target * c / (c - v) (bat "hears" even higher)

  Combined:
    f_echo = f_emit * (c + v) / (c - v)

  For small v relative to c:
    delta_f / f ~ 2v / c

  For Big Brown Bat (v = 7 m/s, f = 50 kHz):
    delta_f = 2 * 50,000 * 7 / 343 ~ 2,041 Hz
```

### Doppler in FM Sweeps

When a Doppler shift is applied to an FM sweep, the entire sweep shifts up (or down) in frequency:

```
FM Sweep with Doppler:

  Original:  75 kHz -> 25 kHz over 5 ms

  With +2 kHz Doppler (bat approaching target):
  Received:  77 kHz -> 27 kHz over ~5 ms

  The sweep shape is preserved.
  The start and end frequencies shift by the same amount.
  The bandwidth is essentially unchanged.
  The range information (from echo delay) is unchanged.

  The only effect is a small shift in the frequency axis --
  which the broadly tuned cochlea absorbs without difficulty.
```

### Why FM Bats Can Ignore Doppler (Mostly)

FM bats do not need Doppler Shift Compensation because [P2, P6]:

1. **Broad cochlear tuning**: The basilar membrane responds across a wide frequency range. A 2 kHz shift does not move the echo outside the processing window.

2. **Range is the primary measurement**: FM bats extract range from echo delay, not frequency. Doppler shifts delay only slightly (and the shift in delay is negligible for typical flight speeds).

3. **No acoustic fovea**: Without a narrowband frequency-selective region, there is nothing to be "pushed out of" by Doppler.

4. **Environmental compensation not needed**: In cluttered forests, the primary challenge is spatial (separating targets from clutter), not velocity (measuring target speed). FM bats do not need precise velocity measurements.

Kagawa et al. (2024) showed that even in "scanning" bats (which use a mix of FM and CF components), Doppler detection can trigger prey escape responses, demonstrating that some Doppler information is available even to FM bats -- but it is not the primary sensory channel [P7].

---

## Comparison: Orca Biosonar vs. Bat Echolocation

| Parameter | Orca Biosonar [G1, P2] | PNW FM Bat [P2] |
|-----------|----------------------|-----------------|
| **Medium** | Seawater (c = 1500 m/s) | Air (c = 343 m/s) |
| **Frequency range** | 10-100 kHz | 20-80 kHz |
| **Wavelength at 50 kHz** | 3 cm | 6.86 mm |
| **Source mechanism** | Phonic lips (pneumatic) | Larynx (muscular) |
| **Beam former** | Melon (GRIN lens) | Mouth aperture |
| **Beam width** | ~10-20 deg | ~25-40 deg |
| **Receiver** | Mandible fat pads | Pinnae + ear canal |
| **Source level** | ~220 dB re 1 uPa | ~120 dB SPL |
| **Detection range** | ~150 m (500 ft) | ~10-20 m |
| **Absorption** | Low (~1-10 dB/km at 50 kHz) | Very high (~1-3 dB/m at 50 kHz) |
| **Range resolution** | ~1.5 cm (for 50 kHz BW) | ~3.4 mm (for 50 kHz BW) |
| **Terminal buzz** | Yes (100-200+ clicks/sec) | Yes (100-200+ calls/sec) |
| **Doppler use** | Minor (broadband) | Minor (FM absorbs shift) |
| **Clutter environment** | Open water (low clutter) | Forest (extreme clutter) |

The most striking convergence is the **terminal buzz** -- both orcas and bats independently evolved the same strategy of dramatically increasing pulse/call rate during the final approach to prey. This is a convergent solution driven by the physics of echo-delay ranging: as the target gets closer and more maneuverable, the predator needs faster updates [P2, P9].

---

## Engineering Parallels

| Feature | FM Bat | Engineering System |
|---------|--------|-------------------|
| **FM sweep** | Broadband downward chirp | Linear FM (chirp) radar |
| **Range resolution** | c / (2*B) ~ 3.4 mm | Same equation, same principle |
| **Adaptive waveform** | Call design varies with environment | Cognitive radar waveform selection |
| **Terminal buzz** | Maximum PRF for close-range tracking | Track-while-scan, fire-control mode |
| **Pinna** | Directional acoustic antenna with spectral shaping | Horn antenna with mode-selective feed |
| **Stapedial reflex** | Attenuate self-stimulation during transmission | Transmit/receive switch (TR switch) |
| **Delay-tuned neurons** | Range map in auditory cortex | Range gate circuits in radar receiver |
| **Cochlear processing** | Parallel frequency analysis | FFT-based spectrogram |

The FM chirp is perhaps the most direct parallel. The same signal processing technique -- matched filtering of a chirp waveform to achieve range resolution better than the pulse duration -- was independently invented by radar engineers in the 1940s and by bat evolution 50+ million years ago [P2].

---

## Interrelationships and Cross-Links

### Physics Phenomenon Links

- **[Doppler Effect](02-doppler-effect.md)**: The fundamental Doppler physics that FM bats tolerate and CF bats exploit. The two strategies represent opposite ends of the time-bandwidth tradeoff.

- **[Phase and Comb Filtering](04-phase-comb-filter.md)**: Bat click trains can produce comb-like spectrograms with harmonically spaced peaks. The FM sweep itself creates a spectral structure that interacts with target resonances.

### Species Cross-Links

- **[Southern Resident Killer Whales](pnw-01-southern-resident-orca.md)**: Convergent evolution of echolocation in water vs. air. Different medium, different source mechanism, same physics, remarkably similar terminal buzz behavior.

- **[Red Fox: Magnetic Rangefinder](pnw-05-fox-magnetic-hunting.md)**: A PNW predator that uses acoustic cues (prey sounds in snow) combined with magnetic sensing for rangefinding -- a different sensory fusion but analogous targeting problem.

### GPU/ML Pipeline Link

- **[GPU-Accelerated Deep Data Analysis](07-gpu-ml-pipeline.md)**: BirdNET and similar acoustic monitoring systems use GPU-accelerated spectrograms and deep learning to classify bat echolocation calls from field recordings. The bat's FM sweep has a distinctive spectrogram signature that is well suited for automated detection.

---

## Summary Tables

### Echolocation Parameters by Species

| Parameter | Big Brown Bat | Little Brown Bat | Source |
|-----------|--------------|-----------------|--------|
| Frequency range | ~25-75 kHz | ~40-80 kHz | P2 |
| Call duration (search) | 5-10 ms | 3-7 ms | P2 |
| Call duration (buzz) | 0.5-1 ms | 0.3-0.8 ms | P2 |
| Bandwidth | ~50 kHz | ~40 kHz | P2 |
| Range resolution | ~3.4 mm | ~4.3 mm | Calculated |
| Detection range (insects) | ~10-20 m | ~5-15 m | P2 |
| Source level | ~120 dB SPL | ~110 dB SPL | P2 |
| Beam width | ~30-40 deg | ~35-50 deg | P2 |

### FM vs. CF Comparison

| Feature | FM Bats (PNW) | CF Bats (Old World) | Source |
|---------|--------------|--------------------|---------|
| Signal type | Broadband sweep | Narrowband tone | P2, P6 |
| Bandwidth | 30-60 kHz | <1-3 kHz | P2, P6 |
| Range resolution | 3-6 mm | 10-20 cm | Calculated |
| Frequency resolution | Low | Extraordinary (acoustic fovea) | P6 |
| Doppler use | Minimal (absorbed) | Primary (DSC) | P6 |
| Optimal environment | Cluttered (forest) | Open (savanna, cave entrance) | P2 |
| PNW species | All native bats | None (not present in North America) | -- |

### Hunting Phase Parameters

| Phase | Call Rate | Duration | Bandwidth | Range | Source |
|-------|----------|----------|-----------|-------|--------|
| Search | 5-10 Hz | 5-10 ms | 40-60 kHz | Max | P2 |
| Approach | 20-50 Hz | 3-5 ms | 30-50 kHz | Closing | P2 |
| Terminal buzz | 100-200 Hz | 0.5-1 ms | 15-25 kHz | <1 m | P2 |

---

## Sources

### Peer-Reviewed

- [P2] Au, W.W.L. and Simmons, J.A. (2007). Echolocation in dolphins and bats. *Physics Today*.
- [P6] Knauer, A. et al. (2025). Bats create a silent frequency band via DSC. *bioRxiv*. [https://www.biorxiv.org/content/10.1101/2025.10.05.680495](https://www.biorxiv.org/content/10.1101/2025.10.05.680495)
- [P7] Kagawa, T. et al. (2024). Doppler detection triggers escape in scanning bats. *PMC*. [https://pmc.ncbi.nlm.nih.gov/articles/PMC10960053/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10960053/)
- [P9] Holt, M. / Tennessen, J. -- NOAA NWFSC. Biologging tag studies (comparative reference for terminal buzz convergence).

---

*Cross-reference: This species page links to physics phenomenon pages [02](02-doppler-effect.md), [04](04-phase-comb-filter.md) and to species pages [pnw-01](pnw-01-southern-resident-orca.md), [pnw-05](pnw-05-fox-magnetic-hunting.md). See the [Data Schema](00-data-schema.md) for page structure definitions and the [Source Index](00-source-index.md) for complete citation details.*

*Safety compliance: SC-03 (all quantitative claims attributed to sources).*
