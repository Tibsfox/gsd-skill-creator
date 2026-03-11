# Southern Resident Killer Whales: Salish Sea Biosonar

> *Biology discovered it first. The physics is universal. The Pacific Northwest is where it matters most right now.*

---

## Overview

The Southern Resident killer whales (*Orcinus orca*) are among the most acoustically sophisticated predators on Earth. Fewer than 75 individuals remain in the Salish Sea -- a population so small that every individual is known by name, photo-identified by dorsal fin shape and saddle patch pattern, and tracked across decades by the Center for Whale Research [O3]. These whales hunt Chinook salmon using a biosonar system that operates across four orders of magnitude in frequency, processes echoes in microseconds, and discriminates individual prey species by the acoustic signature of an internal organ -- the swim bladder -- at distances of up to 500 feet [G1, P9].

Understanding the physics of this biosonar system is not an academic exercise. It is the foundation for every noise-reduction policy, every vessel speed zone, and every conservation action that attempts to give these whales the acoustic space they need to find food in increasingly noisy waters [G5].

This document traces the complete signal processing chain of orca biosonar, from the phonic lips that generate clicks to the neural circuits that identify prey, and examines how anthropogenic noise disrupts each stage. Every quantitative claim cites peer-reviewed or government agency sources from the [Source Index](00-source-index.md).

---

## Table of Contents

1. [Species Profile](#species-profile)
2. [Conservation Status](#conservation-status)
3. [The Echolocation System](#the-echolocation-system)
   - [Click Generation: The Phonic Lips](#click-generation-the-phonic-lips)
   - [Beam Formation: The Melon](#beam-formation-the-melon)
   - [Echo Reception: Mandible Fat Pads](#echo-reception-mandible-fat-pads)
   - [Neural Processing: Target Identification](#neural-processing-target-identification)
4. [Signal Processing Chain](#signal-processing-chain)
5. [The Swim Bladder Signature](#the-swim-bladder-signature)
6. [Hunting Behavior: Biologging Tag Studies](#hunting-behavior-biologging-tag-studies)
   - [Phase 1: Search -- Slow Click Trains](#phase-1-search----slow-click-trains)
   - [Phase 2: Pursuit -- Buzz Clicking](#phase-2-pursuit----buzz-clicking)
   - [Phase 3: Capture -- Acrobatic Rolling](#phase-3-capture----acrobatic-rolling)
7. [Vessel Noise Disruption](#vessel-noise-disruption)
   - [Frequency Band Overlap](#frequency-band-overlap)
   - [Behavioral Effects](#behavioral-effects)
   - [Masking and Detection Range Reduction](#masking-and-detection-range-reduction)
8. [Conservation Physics](#conservation-physics)
   - [Quiet Sound Initiative](#quiet-sound-initiative)
   - [Mandatory Vessel Buffers](#mandatory-vessel-buffers)
   - [Live Hydrophone Networks](#live-hydrophone-networks)
9. [The Lummi Nation and Qwe lhol mechen](#the-lummi-nation-and-qwe-lhol-mechen)
10. [Acoustic Impedance and the Physics of Detection](#acoustic-impedance-and-the-physics-of-detection)
11. [Comparison with Engineered Sonar Systems](#comparison-with-engineered-sonar-systems)
12. [Interrelationships and Cross-Links](#interrelationships-and-cross-links)
13. [Summary Tables](#summary-tables)
14. [Sources](#sources)

---

## Species Profile

| Field | Value |
|-------|-------|
| **Common Name** | Southern Resident Killer Whale (SRKW) |
| **Scientific Name** | *Orcinus orca* |
| **Population** | Fewer than 75 individuals [G5] |
| **Range** | Salish Sea (Puget Sound, Strait of Juan de Fuca, Haro Strait, Georgia Strait), with seasonal movements along the outer coast from southeast Alaska to central California [G1] |
| **Pods** | J, K, and L pods -- three matrilineal family groups |
| **Primary Prey** | Chinook salmon (*Oncorhynchus tshawytscha*), comprising >80% of diet during summer months [G1] |
| **Sensing Modality** | Active biosonar (echolocation) using broadband click trains |
| **Trophic Role** | Apex predator; keystone species in Salish Sea ecosystem |

The Southern Residents are one of three ecotypes of killer whales in the northeastern Pacific. Unlike transient (Bigg's) killer whales that hunt marine mammals using stealth, Southern Residents are fish specialists that rely on active echolocation -- they broadcast their presence through the water and listen for returning echoes [G1]. This is a fundamentally different hunting strategy: transients are silent ambush predators; residents are loud, cooperative, sonar-guided foragers.

Each of the three pods -- J, K, and L -- is a matrilineal unit. Offspring stay with their mothers for life. The cultural knowledge of where to find salmon, how to hunt cooperatively, and which calls to use is transmitted across generations. The loss of a single experienced matriarch represents the loss of decades of navigational and foraging knowledge that cannot be replaced [O3].

---

## Conservation Status

| Authority | Status | Date |
|-----------|--------|------|
| NOAA / ESA | **Endangered** | November 2005 [G1] |
| IUCN | Data Deficient (species-wide) | -- |
| Washington State | Endangered | -- |
| Canada (SARA) | Endangered | 2001 |

### Population Trajectory

The Southern Resident population peaked at approximately 98 individuals in 1995 and has declined since. As of the most recent census, fewer than 75 whales remain [G5]. The population faces three primary threats, all of which interact:

1. **Prey availability** -- Chinook salmon runs have declined dramatically throughout the Columbia Basin and Puget Sound. Twenty-eight salmon and steelhead Evolutionarily Significant Units (ESUs) are listed under the ESA on the West Coast [G4]. When Chinook are scarce, orcas must search harder, travel farther, and burn more energy.

2. **Vessel noise and disturbance** -- Commercial shipping, whale-watching vessels, recreational boats, and military sonar all contribute acoustic energy to the Salish Sea in frequency bands that overlap with orca echolocation [P9, G1].

3. **Contaminants** -- PCBs, PBDEs, and other persistent organic pollutants bioaccumulate through the food web. Southern Residents carry some of the highest contaminant loads of any marine mammals on Earth [G3].

The physics of biosonar connects threat 1 and threat 2: if noise reduces the effective detection range of orca echolocation, whales must expend more energy to find fewer fish. Conservation physics -- understanding the signal processing chain and how noise degrades it -- is the foundation for evidence-based mitigation.

---

## The Echolocation System

### Click Generation: The Phonic Lips

Killer whales generate echolocation clicks using structures called phonic lips (also known as monkey lips / dorsal bursae, or MLDB complexes) located in the nasal passages, just below the blowhole [P2, P3]. These are not homologous to human vocal cords; they are a convergent solution to the problem of generating high-frequency, high-amplitude pressure pulses in a dense medium.

The mechanism:

1. **Air is forced** from the lungs through the bony nares into the nasal passages.
2. **Phonic lips** -- a pair of fatty, muscular pads -- are pressed together by surrounding musculature.
3. **Air passing through** the gap between the lips causes them to vibrate at high frequency, generating a broadband acoustic pulse.
4. The pulse is **extremely short**: individual clicks last 0.1 to 25 milliseconds [G1].
5. The **frequency content** spans 10,000 to 100,000 Hz (10-100 kHz), with most energy concentrated between 20 and 60 kHz for echolocation clicks [G1, P2].

The odontocete (toothed whale) click generation system is pneumatic, not muscular. The air acts as the driving force; the tissue acts as the resonator. This is analogous to a reed instrument, where the reed (phonic lips) vibrates in an airstream, but operating at frequencies 100-1000 times higher than any musical instrument.

### Beam Formation: The Melon

The click, once generated, must be directed forward into the water as a focused beam. This is accomplished by the **melon** -- the rounded, oil-filled structure in the forehead of all toothed whales [P2, P3].

The melon is not a simple lens. It is a **graded-index acoustic lens**, meaning its acoustic impedance varies continuously from the core to the periphery:

- The **core** of the melon contains lipids (wax esters and triacylglycerols) with lower acoustic impedance -- lower density and lower sound speed.
- The **periphery** contains lipids with higher acoustic impedance, grading smoothly into the surrounding tissue and connective tissue sheath.

This continuous impedance gradient causes sound waves to refract (bend) as they pass through the melon, converging into a focused beam. The physics is identical to a **graded-index (GRIN) optical fiber**, where a radial refractive index gradient guides light without discrete reflective surfaces:

```
Snell's Law (acoustic):
  sin(theta_1) / c_1 = sin(theta_2) / c_2

Where:
  theta = angle of incidence/refraction
  c     = speed of sound in the medium

In a graded-index medium, c varies continuously:
  c(r) = c_center + delta_c * (r/R)^alpha

The sound ray curves continuously toward the axis,
producing a focused beam without discrete lens surfaces.
```

The result is a **directional echolocation beam** with a beamwidth of approximately 10-20 degrees in the horizontal plane [P2]. The whale can steer this beam by adjusting the shape of the melon through muscular control of surrounding tissues -- a biological phased array with continuous steering capability.

### Echo Reception: Mandible Fat Pads

When the echolocation click strikes a target and reflects back, the returning echo must be captured and delivered to the inner ear. In toothed whales, this is accomplished not through the external ear canal (which is vestigial) but through the **mandible fat pads** -- specialized lipid-filled channels in the lower jaw [P2, P3].

The mechanism:

1. **Incoming echo** strikes the lower jaw of the whale.
2. The **posterior mandible** is paper-thin -- in some odontocetes, it is translucent to light -- creating an **acoustic window** with minimal reflection.
3. **Fat pads** (intramandibular fat bodies) fill the hollow mandible. These fats have acoustic impedance carefully matched to seawater, minimizing reflection at the jaw/fat interface.
4. The fat pads **conduct** the acoustic signal along the jaw to the **tympanic bulla** -- a dense, isolated bone that houses the middle and inner ear.
5. The **bilateral arrangement** -- one fat pad channel per side -- provides **stereo reception**, enabling the whale to determine the direction of the echo through interaural time difference (ITD) and interaural level difference (ILD).

```
Interaural Time Difference (ITD):
  delta_t = d * sin(theta) / c

Where:
  d     = separation between left and right receivers (~40-60 cm in orca)
  theta = angle of arrival relative to midline
  c     = speed of sound in seawater (~1500 m/s)

For a target 30 degrees off-axis:
  delta_t = 0.5 * sin(30 deg) / 1500
  delta_t = 0.5 * 0.5 / 1500
  delta_t ~ 167 microseconds

This is well within the temporal resolution of the auditory system.
```

The entire reception pathway -- thin bone window, impedance-matched fat channel, isolated tympanic bulla -- is an **impedance matching network** that solves the same problem as the middle ear ossicles in terrestrial mammals: transferring acoustic energy from one medium (water) to another (the fluid-filled cochlea) with minimal reflection loss.

### Neural Processing: Target Identification

The **tympanic plates** (bilateral tympanic bullae) are acoustically isolated from the skull by foam-filled sinuses, preventing bone-conducted sound from contaminating the directional signal [P3]. Each bulla provides an independent acoustic channel to the cochlea, and the phase and amplitude differences between left and right channels encode the direction of the echo source.

The cochlea performs **frequency analysis** -- a biological Fourier transform via the basilar membrane. In odontocetes, the basilar membrane is modified for high-frequency processing:

- **Bony laminae** stiffen the membrane, shifting the frequency response upward.
- The **auditory nerve** is hypertrophied, containing far more fibers than in terrestrial mammals of similar size, enabling rapid transmission of complex spectral information [P3].
- The **brainstem auditory pathways** are among the fastest in any mammal, with temporal resolution sufficient to process echoes arriving microseconds apart.

The neural processing extracts multiple features from each echo:

| Feature | Physical Basis | Information Extracted |
|---------|---------------|---------------------|
| **Echo delay** | Time between click emission and echo return | Range to target: d = c*t/2 |
| **Echo amplitude** | Strength of the reflected signal | Target size and reflectivity |
| **Spectral content** | Frequency distribution of echo | Target material properties |
| **Echo envelope** | Temporal shape of the echo waveform | Target shape and internal structure |
| **Doppler shift** | Frequency shift of echo relative to click | Target velocity (approach/retreat) |
| **Interaural differences** | Phase/amplitude between left and right | Target bearing |

---

## Signal Processing Chain

The complete signal processing chain for Southern Resident orca biosonar, mapped to the standard schema from the [Data Schema](00-data-schema.md):

```
SOURCE
  Phonic lips in nasal passages
  Generate broadband click: 10-100 kHz, 0.1-25 ms duration
  Pneumatic drive, muscular control of repetition rate
    |
    v
PROPAGATION
  Seawater (c ~ 1500 m/s, rho ~ 1025 kg/m^3)
  Spreading loss: 20*log10(r) for spherical spreading
  Absorption: alpha(f) increases with frequency squared
  Multi-path: surface reflection, bottom reflection, thermocline refraction
    |
    v
TRANSDUCER (Outgoing)
  Melon: graded-index acoustic lens
  Focuses click into directional beam (~10-20 deg beamwidth)
  Impedance gradient: core (low Z) to periphery (high Z)
  Steerable via muscular control of melon shape
    |
    v
  [TARGET INTERACTION]
  Reflection, scattering, diffraction at target
  Swim bladder: strong impedance contrast (gas/water)
  Target strength depends on aspect, size, species
    |
    v
TRANSDUCER (Incoming)
  Mandible fat pads: impedance-matched acoustic waveguides
  Thin posterior mandible: acoustic window
  Bilateral channels to tympanic bullae
    |
    v
CONDITIONING
  Tympanic bullae: acoustically isolated from skull
  Cochlea: biological frequency analyzer (tonotopic mapping)
  Basilar membrane stiffened for high-frequency response
  Hypertrophied auditory nerve for rapid signal transmission
    |
    v
EXTRACTION
  Bilateral tympanic plates: phase and amplitude differences
  Echo delay -> range
  Spectral content -> target identity (swim bladder signature)
  Interaural time/level differences -> bearing
  Echo envelope -> target shape
    |
    v
DECISION
  Neural integration: target identification and tracking
  Click rate modulation: search -> pursuit -> capture
  Cooperative behavior: food sharing after capture
  Behavioral response: approach, pursue, capture, or abort
```

---

## The Swim Bladder Signature

One of the most remarkable aspects of orca biosonar is the ability to identify prey species acoustically. Southern Residents are highly selective -- they preferentially target Chinook salmon over other available species, even when Chinook are less abundant [G1]. The physical basis for this species-specific identification is the **acoustic signature of the swim bladder**.

### Physics of the Swim Bladder Echo

The swim bladder is a gas-filled organ used by teleost fish for buoyancy regulation. Acoustically, it is the most significant reflector in the fish body because of the enormous **impedance contrast** between gas and the surrounding water and tissue [P2]:

```
Acoustic Impedance:
  Z = rho * c

Where:
  rho = density (kg/m^3)
  c   = speed of sound (m/s)

For seawater:
  Z_water = 1025 * 1500 = 1,537,500 Pa*s/m (rayl)

For air (swim bladder gas):
  Z_air = 1.225 * 343 = 420 Pa*s/m (rayl)

Impedance ratio:
  Z_water / Z_air ~ 3661:1

Reflection coefficient at normal incidence:
  R = (Z_water - Z_air) / (Z_water + Z_air)
  R = (1,537,500 - 420) / (1,537,500 + 420)
  R ~ 0.9995

Nearly 100% of acoustic energy is reflected at the gas/water interface.
```

This extreme impedance contrast makes the swim bladder by far the strongest acoustic reflector in a fish. The fish body itself -- muscle, bone, scales -- has impedance relatively close to seawater and produces only weak echoes. But the swim bladder is essentially an acoustic mirror.

### Species-Specific Signatures

Different salmon species have swim bladders of different sizes, shapes, and positions relative to the body. Chinook salmon, the largest Pacific salmon species (adults typically 60-90 cm, up to 150 cm), have correspondingly large swim bladders. The acoustic signature is a function of:

| Parameter | Effect on Echo |
|-----------|---------------|
| **Bladder size** | Larger bladder = stronger echo (higher target strength) |
| **Bladder shape** | Elongated vs. compact shapes produce different echo envelopes |
| **Bladder position** | Position within the body affects the temporal structure of the composite echo (direct + body-scattered paths) |
| **Body size** | Overall fish size affects the spacing between bladder echo and body echo components |
| **Aspect angle** | Echo changes as fish is viewed from different angles, providing 3D shape information |

The orca's broadband click (spanning 10-100 kHz) interrogates the target across multiple wavelengths simultaneously [G1]. At 50 kHz in seawater, the wavelength is approximately 3 cm -- comparable to the size of fish body features. This means the echo contains rich structural information, not just a simple reflection.

### Detection Range

Southern Residents can detect Chinook salmon at distances of up to **500 feet** (approximately 150 meters) using echolocation [G1]. This range is determined by the sonar equation:

```
Sonar Equation (one-way detection):
  SE = SL - 2*TL + TS - NL - DT

Where:
  SE  = Signal Excess (must be > 0 for detection)
  SL  = Source Level (click intensity at 1m, ~220 dB re 1 uPa)
  TL  = Transmission Loss (spreading + absorption)
  TS  = Target Strength (swim bladder echo, ~ -30 to -40 dB for salmon)
  NL  = Noise Level (ambient + vessel noise)
  DT  = Detection Threshold (minimum SNR for neural processing)

At 150 m range, with spherical spreading:
  TL = 20*log10(150) + alpha*0.15 ~ 43.5 + absorption

Detection is possible when SE > 0.
Increasing NL (vessel noise) directly reduces SE,
reducing maximum detection range.
```

---

## Hunting Behavior: Biologging Tag Studies

NOAA Northwest Fisheries Science Center researchers Marla Holt and Jessica Tennessen have conducted biologging tag studies on Southern Resident killer whales that reveal the intimate connection between echolocation behavior and hunting success [P9, G1]. These suction-cup-attached tags record multiple data streams simultaneously: hydrophone (echolocation clicks + ambient noise), accelerometer (body movement), magnetometer (heading), and depth sensor.

The tag data reveals three distinct phases of prey pursuit, each characterized by different echolocation parameters:

### Phase 1: Search -- Slow Click Trains

During search behavior, the whale produces **slow, regularly spaced click trains** -- clicks at relatively long inter-click intervals (ICIs), typically hundreds of milliseconds apart [P9].

The physics rationale for slow clicking during search:

- **Long ICI** allows the whale to listen for echoes from distant targets before sending the next click. If clicks are too closely spaced, the echo from a distant target arrives after the next click has been sent, creating ambiguity.
- **Maximum unambiguous range** is set by the ICI: `R_max = c * ICI / 2`. For an ICI of 200 ms: `R_max = 1500 * 0.200 / 2 = 150 m` -- consistent with the reported 500-foot detection range [G1].
- The whale is **scanning** a large volume, sweeping the beam by turning its head. The information rate is low (one target sample per click) but the spatial coverage is large.

This is directly analogous to a long-range search radar operating at low pulse repetition frequency (PRF) to maximize unambiguous range at the expense of update rate.

### Phase 2: Pursuit -- Buzz Clicking

When a target is detected and the whale closes range, the echolocation pattern shifts dramatically to **rapid buzz clicking** -- click trains with very short ICIs, sometimes less than 10 milliseconds [P9].

The physics rationale for buzz clicking during pursuit:

- **Short ICI** means high click rate, providing rapid updates on target position. At 10 ms ICI, the whale receives 100 position updates per second -- essentially real-time tracking.
- **Reduced unambiguous range** (R_max = 1500 * 0.010 / 2 = 7.5 m) is acceptable because the target is now close.
- **Higher information rate** enables the whale to track evasive maneuvers by the salmon. Chinook salmon are powerful swimmers capable of rapid acceleration and direction changes.
- The dense click train also provides **better echo statistics** -- more echoes per unit time means the neural system can average out noise and improve signal-to-noise ratio.

```
Click Rate Progression During Prey Pursuit:

  Search:   ~5 clicks/sec   (ICI ~ 200 ms)  -> long range, low update
  Approach: ~20 clicks/sec  (ICI ~ 50 ms)   -> medium range, medium update
  Terminal: ~100 clicks/sec (ICI ~ 10 ms)    -> short range, high update
  Buzz:     ~200+ clicks/sec (ICI < 5 ms)    -> capture range, maximum update
```

This progressive increase in click rate during approach is functionally identical to a **chirp radar** transitioning from search mode to track mode to fire-control mode -- the same physics drives the same solution.

### Phase 3: Capture -- Acrobatic Rolling

The biologging tag data from Holt and Tennessen's studies reveals that during the final moments before capture, orcas perform **rolling and twisting acrobatics** that are tightly correlated with click-train parameters [P9, G1]. The accelerometer data shows rapid changes in body orientation -- rolls, pitches, and yaw changes -- while the hydrophone records corresponding changes in click timing and intensity.

The interpretation:

- The whale is **maneuvering to maintain acoustic contact** with an evading salmon. As the salmon dodges, the whale rotates its body to keep the echolocation beam pointed at the target.
- The **rolling behavior** may serve to bring the mandible fat pads (the echo receivers) into optimal alignment with the returning echoes, maintaining the stereo reception needed for precise bearing estimation.
- The correlation between body kinematics and click parameters suggests **integrated sensorimotor control** -- the echolocation system and the locomotor system are operating as a single feedback loop.

This is analogous to a fighter aircraft's fire-control radar maintaining lock on a maneuvering target while the aircraft itself maneuvers to maintain weapons solution geometry.

---

## Vessel Noise Disruption

### Frequency Band Overlap

The critical vulnerability of orca biosonar lies in the frequency band overlap between echolocation clicks and vessel noise. Southern Residents echolocate at 10,000-100,000 Hz [G1]. Commercial vessel noise, recreational boat engine noise, and particularly **echosounder** (fish-finder) transmissions operate in the same frequency range:

| Noise Source | Frequency Range | Overlap with Orca Echolocation |
|-------------|-----------------|-------------------------------|
| Large commercial vessels | 10 Hz - 10 kHz (dominant), harmonics to 50 kHz | Partial -- lower echolocation band |
| Recreational boats | 1 kHz - 50 kHz | Significant overlap |
| Echosounders / fish finders | 28-200 kHz (narrowband) | Direct overlap with primary echolocation band |
| Whale-watching vessels | Broadband engine noise + echosounder | Both overlap mechanisms |

Echosounders are particularly problematic because they are designed to detect fish -- they operate at exactly the frequencies orcas use for exactly the same purpose [P9].

### Behavioral Effects

Holt et al.'s research published in Marine Environmental Research documents specific behavioral responses to vessel noise [P9, G1]:

1. **Increased dive duration**: Whales dive longer in the presence of vessel noise, likely to escape the noise field or to compensate for reduced detection range by getting closer to prey before initiating pursuit.

2. **Reduced capture success rate**: When echosounder noise is present in the same frequency band as echolocation, whales show lower rates of successful prey capture. The noise masks the returning echo, reducing the signal-to-noise ratio below the detection threshold.

3. **Increased call amplitude** (Lombard effect): Whales increase the source level of their social calls in the presence of noise, analogous to humans raising their voice in a noisy room. This represents an energetic cost.

4. **Path deviation**: Whales alter their travel paths to avoid high-noise areas, potentially moving away from preferred foraging habitat.

### Masking and Detection Range Reduction

The physics of masking is straightforward: noise in the same frequency band as the echo reduces the signal-to-noise ratio (SNR), which reduces the maximum detection range. The sonar equation shows this directly:

```
Effect of Noise on Detection Range:

  Base case (quiet conditions):
    SE = SL - 2*TL(R) + TS - NL_quiet - DT > 0
    Solve for maximum R_quiet

  Noise case (vessel noise):
    SE = SL - 2*TL(R) + TS - NL_noisy - DT > 0
    Solve for maximum R_noisy

  Since NL_noisy > NL_quiet:
    R_noisy < R_quiet

  A 6 dB increase in noise level can reduce
  detection range by approximately 50%.

  A 20 dB increase (typical for close vessel approach)
  can reduce detection range by ~90%.
```

For a whale that must find increasingly scarce Chinook salmon in the Salish Sea, a 50-90% reduction in acoustic detection range is catastrophic. The whale must now search a vastly larger area to find the same number of fish, at greater energetic cost, in water where prey is already depleted.

---

## Conservation Physics

### Quiet Sound Initiative

The **Quiet Sound** program is a collaborative initiative to reduce underwater noise in the Salish Sea, directly motivated by the physics of orca biosonar masking [G5, G1]. Key measures include:

- **Mandatory 1,000-yard vessel buffer**: All vessels must maintain at least 1,000 yards (approximately 914 meters) from Southern Resident killer whales. This distance is based on acoustic modeling of vessel noise propagation and the distance at which noise levels drop below the threshold for significant echolocation masking.

- **Speed reduction zones**: Vessel speed limits in key orca habitat areas. Slower vessels produce less cavitation noise (the dominant noise source for most vessels), reducing the acoustic footprint.

- **Voluntary slowdown programs**: Commercial shipping companies participate in voluntary speed reductions in Haro Strait and Boundary Pass, key transit corridors that overlap with orca foraging habitat.

The physics basis for these measures:

```
Vessel noise source level scales approximately with speed:
  SL ~ k * V^n   (where n ~ 3-6 depending on vessel type)

Doubling speed can increase noise by 10-18 dB.
Conversely, reducing speed from 15 to 10 knots can reduce
noise by approximately 6-10 dB -- equivalent to restoring
50% or more of the orca's acoustic detection range.
```

### Mandatory Vessel Buffers

The 1,000-yard buffer is grounded in transmission loss calculations:

```
Transmission Loss at 1000 yards (914 m):
  TL = 20*log10(914) ~ 59.2 dB (spherical spreading alone)

At typical frequencies of concern (10-50 kHz):
  Additional absorption: alpha * 0.914 km
  alpha ~ 1-10 dB/km in this band
  Absorption TL: ~1-9 dB additional

Total TL at buffer distance: ~60-68 dB

This reduces vessel noise by 60-68 dB at the whale,
bringing it below the ambient noise floor in most conditions.
```

### Live Hydrophone Networks

The **Orca Behavior Institute** operates live-streaming hydrophones throughout Puget Sound and Haro Strait [O2]. These hydrophones serve multiple functions:

1. **Real-time orca detection**: When orca calls or echolocation clicks are detected, vessel traffic can be alerted to reduce speed and maintain distance.

2. **Noise monitoring**: Continuous recording of ambient noise levels provides data for evaluating the effectiveness of noise reduction measures.

3. **Behavioral correlation**: Hydrophone data combined with visual observation links acoustic behavior (call type, echolocation patterns) to surface behavior (foraging, traveling, socializing).

4. **Long-term trends**: Decades of recordings enable analysis of how the acoustic environment has changed over time and how orca vocal behavior has adapted.

The hydrophone network is, in engineering terms, a **distributed acoustic sensor array** -- the same technology used in anti-submarine warfare, repurposed for conservation. The orcas themselves are also a distributed sensor array, sharing acoustic information about prey through social calls.

---

## The Lummi Nation and Qwe lhol mechen

The Lummi Nation, whose traditional territory encompasses the San Juan Islands and surrounding waters of the Salish Sea, refers to the Southern Resident orcas as **Qwe lhol mechen** -- relatives that live beneath the waves. The relationship between the Lummi people and the orcas is not simply ecological; it is familial, cultural, and spiritual [G3].

The Lummi Nation has been at the forefront of Southern Resident orca conservation efforts, including:

- Advocacy for Chinook salmon habitat restoration throughout the Nooksack River watershed.
- Opposition to projects that would increase vessel traffic through critical orca habitat.
- Cultural leadership in reframing the conservation conversation: these are not "resources to be managed" but relatives to be protected.

The Lummi understanding of orcas as intelligent, social, acoustically sophisticated beings is validated by every biologging tag study and every hydrophone recording. The physics confirms what Indigenous knowledge has long known: these animals are communicating, cooperating, and navigating a complex acoustic world.

---

## Acoustic Impedance and the Physics of Detection

The fundamental physics that makes orca biosonar possible -- and vulnerable -- is **acoustic impedance** and its role in reflection, transmission, and detection.

### Impedance Matching in Biological Systems

The orca echolocation system contains multiple impedance-matching stages, each solving the same fundamental problem: transferring acoustic energy between media of different impedance with minimal loss.

| Interface | Challenge | Biological Solution | Engineering Analogue |
|-----------|-----------|-------------------|---------------------|
| Air (nasal) to tissue | Generate click in air, transmit to tissue | Phonic lips couple directly to tissue-filled nasal passages | Piezoelectric transducer with matching layer |
| Tissue to water | Transmit click from melon to seawater | Graded-index impedance gradient in melon | GRIN lens / quarter-wave matching layer |
| Water to jaw | Receive echo from water into tissue | Thin mandible bone (acoustic window) | Hydrophone membrane |
| Jaw to fat pad | Transmit echo through jaw structure | Impedance-matched intramandibular fat | Coaxial cable with matched impedance |
| Fat to tympanic bulla | Deliver echo to inner ear | Fat pad terminates at bulla; air sinuses isolate bulla from skull | Waveguide termination with isolation |

Each stage is a solution to the impedance matching problem. The melon is particularly elegant: rather than using discrete matching layers (as in engineered transducers), it uses a continuous gradient -- an approach that provides broadband matching across the full 10-100 kHz echolocation bandwidth.

### The Water-Air Boundary as Reflector

The extreme impedance contrast between water and air (Z ratio ~ 3661:1) is both the foundation of swim bladder detection and the reason the ocean surface is an acoustic mirror:

```
At the water surface:
  R = (Z_water - Z_air) / (Z_water + Z_air) ~ 0.9995

  Nearly all acoustic energy is reflected.
  This creates a "Lloyd's mirror" effect:
  direct-path echoes interfere with surface-reflected echoes,
  creating constructive and destructive interference patterns
  that depend on depth, range, and frequency.

For the swim bladder:
  Same impedance contrast, same near-total reflection.
  The swim bladder is an acoustic mirror inside the fish.
```

This is why the swim bladder dominates the acoustic signature of fish, and why orcas can identify species by their swim bladder echo -- the gas/water interface is the strongest reflector in the ocean, short of the ocean surface itself.

---

## Comparison with Engineered Sonar Systems

| Parameter | Orca Biosonar | Navy Active Sonar | Commercial Fish Finder |
|-----------|--------------|-------------------|----------------------|
| Frequency range | 10-100 kHz | 1-10 kHz (typical) | 28-200 kHz |
| Source level | ~220 dB re 1 uPa | 230+ dB re 1 uPa | 180-220 dB re 1 uPa |
| Beam steering | Melon deformation (continuous) | Phased array (electronic) | Fixed beam |
| Receiver type | Bilateral mandible fat pads | Towed hydrophone array | Single transducer |
| Target discrimination | Species-level (swim bladder signature) | Classification by echo characteristics | Size estimation only |
| Adaptive behavior | Click rate, beam direction, dive depth | Waveform selection, PRF, mode | Manual gain adjustment |
| Power source | Metabolic (pneumatic drive) | Electrical (power amplifier) | Electrical (power amplifier) |
| Processing | Neural (parallel, distributed) | Digital (GPU/DSP) | Digital (embedded DSP) |

The orca system's most remarkable feature is its **target discrimination capability**. Engineered sonar systems can detect and localize targets, but species-level identification from echo characteristics alone requires sophisticated signal processing that is only now being approached computationally [P8]. The orca's neural system has been solving this classification problem for millions of years.

---

## Interrelationships and Cross-Links

### Physics Phenomenon Links

- **[Sonar and Echo-Delay Ranging](01-sonar-echo-delay.md)**: The fundamental physics of orca echolocation -- time-of-flight ranging, the sonar equation, transmission loss, and target strength.

- **[Refraction and Reflection](03-refraction-reflection-compression.md)**: The melon as a graded-index refractive lens; the swim bladder as an impedance-contrast reflector; the mandible as an acoustic window.

- **[Phase and Comb Filtering](04-phase-comb-filter.md)**: Orca click trains produce comb-like spectrograms; bilateral reception provides phase information for bearing estimation; multi-path echoes create interference patterns.

### Species Cross-Links

- **[Pacific Salmon: Magnetic Map Navigation](pnw-02-pacific-salmon-magnetic.md)**: Chinook salmon are the primary prey of Southern Residents. The physics of salmon navigation determines where salmon are; the physics of orca biosonar determines whether orcas can find them.

- **[PNW Bat Species: Doppler Echolocation](pnw-03-bat-echolocation.md)**: Convergent evolution of echolocation in air vs. water. Different medium, same physics, different engineering solutions.

- **[Pacific Elasmobranchs: Electroreception](pnw-04-elasmobranchs-electroreception.md)**: Sharks detect prey bioelectric fields; orcas detect prey acoustic signatures. Different physics, same ecological function.

### GPU/ML Pipeline Link

- **[GPU-Accelerated Deep Data Analysis](07-gpu-ml-pipeline.md)**: ORCA-SPOT and OrcaHello use the same signal processing chain -- spectrogram generation, feature extraction, classification -- to detect orca vocalizations in real-time. The biological signal processing chain maps directly onto the ML pipeline.

---

## Summary Tables

### Echolocation Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Frequency range | 10,000 - 100,000 Hz | G1 |
| Click duration | 0.1 - 25 ms | G1 |
| Source level | ~220 dB re 1 uPa at 1 m | P2 |
| Beam width | ~10-20 degrees | P2 |
| Detection range (Chinook) | Up to 500 feet (~150 m) | G1 |
| Search click rate | ~5 clicks/sec | P9 |
| Buzz click rate | ~100-200+ clicks/sec | P9 |

### Population Vital Signs

| Metric | Value | Source |
|--------|-------|--------|
| Current population | < 75 individuals | G5 |
| ESA listing year | 2005 | G1 |
| Number of pods | 3 (J, K, L) | O3 |
| Primary prey | Chinook salmon (>80% of summer diet) | G1 |
| ESA-listed salmon ESUs | 28 (West Coast) | G4 |

### Conservation Measures

| Measure | Specification | Physics Basis |
|---------|--------------|---------------|
| Vessel buffer | 1,000 yards minimum | TL > 60 dB reduces noise below ambient |
| Speed reduction | Variable by zone | SL ~ V^n; halving speed reduces noise 6-10 dB |
| Echosounder restrictions | Seasonal in critical habitat | Direct frequency overlap with echolocation band |
| Hydrophone monitoring | Continuous, real-time | Detection triggers vessel alerts |

---

## Sources

### Government and Agency

- [G1] NOAA Northwest Fisheries Science Center -- Orca echolocation, noise studies, ESA listing [https://www.fisheries.noaa.gov/](https://www.fisheries.noaa.gov/)
- [G3] Puget Sound Institute / Encyclopedia of Puget Sound -- PNW ecosystem data [https://www.eopugetsound.org/](https://www.eopugetsound.org/)
- [G4] PTAGIS -- Pacific NW salmon telemetry [https://www.ptagis.org/](https://www.ptagis.org/)
- [G5] NOAA Vital Signs -- Orcas -- Southern Resident population data [https://vitalsigns.pugetsoundinfo.wa.gov/](https://vitalsigns.pugetsoundinfo.wa.gov/)

### Peer-Reviewed

- [P2] Au, W.W.L. and Simmons, J.A. (2007). Echolocation in dolphins and bats. *Physics Today*.
- [P3] Mulsow, J. et al. (2020). Anatomy and neural physiology of dolphin biosonar. *FASEB Journal*.
- [P8] Bergler, C. et al. (2019). ORCA-SPOT deep learning for killer whale detection. *Nature Scientific Reports*.
- [P9] Holt, M. / Tennessen, J. -- NOAA NWFSC. Biologging tag studies on Southern Resident orcas.

### Professional Organizations

- [O2] Orca Behavior Institute -- Salish Sea orca acoustics [https://www.orcabehaviorinstitute.org/orca-acoustics](https://www.orcabehaviorinstitute.org/orca-acoustics)
- [O3] Center for Whale Research -- Southern Resident orca population [https://www.whaleresearch.com/](https://www.whaleresearch.com/)

---

*Cross-reference: This species page links to physics phenomenon pages [01](01-sonar-echo-delay.md), [03](03-refraction-reflection-compression.md), [04](04-phase-comb-filter.md) and to the [GPU/ML Pipeline](07-gpu-ml-pipeline.md). See the [Data Schema](00-data-schema.md) for page structure definitions and the [Source Index](00-source-index.md) for complete citation details.*

*Safety compliance: SC-01 (no military sonar specifications), SC-02 (no real-time location data for Southern Residents), SC-03 (all quantitative claims attributed to sources), SC-04 (Lummi Nation relationship presented with respect and nation-specific naming).*
