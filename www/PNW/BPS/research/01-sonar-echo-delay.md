# Sonar and Echo-Delay Ranging

> **Physics Domain:** Acoustic
> **Module:** 1 — Acoustic Physics
> **Through-line:** *The physics does not change* — the same time-of-flight equation governs a Navy sonar array, a dolphin's melon, and a bat's larynx. What changes is the transducer, the medium, and the frequency.

---

## Table of Contents

1. [The Sonar Equation](#1-the-sonar-equation)
2. [Time-Delta Ranging](#2-time-delta-ranging)
3. [Transmission Loss in Detail](#3-transmission-loss-in-detail)
4. [Biological Sonar — Dolphin Biosonar](#4-biological-sonar--dolphin-biosonar)
5. [Southern Resident Orca Echolocation](#5-southern-resident-orca-echolocation)
6. [Engineering Sonar Systems](#6-engineering-sonar-systems)
7. [The Melon vs. the Array — Comparative Acoustics](#7-the-melon-vs-the-array--comparative-acoustics)
8. [Target Strength and Acoustic Cross-Section](#8-target-strength-and-acoustic-cross-section)
9. [Noise and Signal Excess](#9-noise-and-signal-excess)
10. [Click Train Temporal Patterns](#10-click-train-temporal-patterns)
11. [PNW Cross-Reference](#11-pnw-cross-reference)
12. [Interrelationships](#12-interrelationships)
13. [Sources](#13-sources)

---

## 1. The Sonar Equation

The sonar equation is the fundamental energy budget for any echo-ranging system, biological or engineered. It quantifies whether a reflected signal will be detectable above ambient noise at the receiver. In its simplest active-sonar form:

```
SL - 2TL + TS - NL = SE
```

where:

| Symbol | Name | Definition | Units |
|--------|------|------------|-------|
| SL | Source Level | Acoustic intensity of the transmitted pulse, measured at 1 meter from the source on its acoustic axis | dB re 1 uPa @ 1m |
| TL | Transmission Loss | One-way energy loss due to geometric spreading and absorption as sound propagates through the medium | dB |
| 2TL | Two-Way Transmission Loss | Total propagation loss: source-to-target plus target-to-receiver. The factor of 2 applies to monostatic systems where the transmitter and receiver are co-located | dB |
| TS | Target Strength | Acoustic reflectivity of the target — the ratio of reflected intensity at 1 m from the target to the incident intensity. Depends on target size, shape, material, and impedance contrast | dB |
| NL | Noise Level | Ambient acoustic noise at the receiver, integrated over the receiver bandwidth | dB re 1 uPa |
| SE | Signal Excess | The amount by which the echo exceeds the minimum detectable signal. SE > 0 means detection is possible; SE < 0 means the echo is buried in noise | dB |

The equation is a *power budget*. Every term is expressed in decibels (logarithmic scale), which converts the multiplicative physics of wave propagation into additive arithmetic. This is not a simplification — it is the natural representation because acoustic intensity spans many orders of magnitude.

### 1.1 The Detection Threshold Form

A more complete formulation introduces the detection threshold (DT), which accounts for the receiver's ability to discriminate signal from noise:

```
SL - 2TL + TS - (NL - DI) >= DT
```

where:

| Symbol | Name | Definition | Units |
|--------|------|------------|-------|
| DI | Directivity Index | The gain of the receiving array relative to an omnidirectional receiver. A focused receiver "listens" in a narrow cone, rejecting noise from other directions | dB |
| DT | Detection Threshold | The minimum signal-to-noise ratio required for reliable detection at a specified false-alarm rate | dB |

In biological systems, DI is determined by the anatomy of the receiving apparatus — the lower mandible fat pads in dolphins, the pinna shape in bats, the tympanic bulla geometry in whales. DT is set by the neural processing sophistication of the auditory system.

### 1.2 Why Every System Obeys This Equation

The sonar equation is not an engineering convention — it is a statement of energy conservation applied to wave propagation and reflection. Any system that:

1. Emits acoustic energy into a medium
2. Waits for that energy to reflect off a target
3. Attempts to detect the reflected energy above ambient noise

must obey this budget. A dolphin cannot violate it. A Navy destroyer cannot violate it. The only question is which terms each system optimizes:

- **Dolphins** optimize SL (extremely intense clicks, up to 229 dB re 1 uPa @ 1m), DI (melon beam-forming), and neural DT (sophisticated auditory processing) [P2, O1].
- **Navy sonar** optimizes SL (high-power transducer arrays), DI (phased-array beam steering), and computational DT (matched filtering, signal processing).
- **Bats** optimize pulse design (frequency-modulated sweeps for range resolution, constant-frequency components for Doppler), DI (pinna shape), and neural DT (auditory fovea) [P2].

### 1.3 Decibel Arithmetic

Because the sonar equation uses decibels, the arithmetic is purely additive and subtractive. Consider a concrete example for a bottlenose dolphin echolocating on a fish at 50 meters:

```
SL  = 220 dB re 1 uPa @ 1m   (typical dolphin click)
TL  =  34 dB                  (spherical spreading at 50m: 20*log10(50) = 34)
2TL =  68 dB                  (two-way)
TS  = -25 dB                  (small fish, ~10 cm)
NL  =  80 dB                  (moderate ambient noise in coastal waters)

SE  = 220 - 68 + (-25) - 80
SE  = 220 - 68 - 25 - 80
SE  = 47 dB
```

A signal excess of 47 dB is extremely comfortable — the echo is nearly 50,000 times stronger than the noise floor at the receiver. This explains why dolphins can detect small targets at moderate ranges even in noisy environments. At longer ranges, TL increases and SE drops. The maximum detection range is where SE = 0.

---

## 2. Time-Delta Ranging

### 2.1 The Fundamental Equation

The most elemental function of sonar — biological or engineered — is range measurement through echo delay. The governing equation is:

```
r = c * dt / 2
```

where:

| Symbol | Name | Definition | Units |
|--------|------|------------|-------|
| r | Range | Distance from the source/receiver to the target | meters (m) |
| c | Sound Speed | Speed of sound in the propagation medium | meters per second (m/s) |
| dt | Round-Trip Time | Elapsed time between pulse transmission and echo reception | seconds (s) |
| dt/2 | One-Way Travel Time | Half the round-trip time, corresponding to the one-way path | seconds (s) |

The factor of 2 accounts for the two-way path: source to target, then target back to source. This assumes a monostatic configuration where the transmitter and receiver are co-located — which is the case for both biological sonar (the animal emits and receives) and most engineering sonar (the transducer array both transmits and receives).

### 2.2 Sound Speed in Different Media

The speed of sound depends on the mechanical properties of the medium: its density and elastic modulus. The relationship is:

```
c = sqrt(K / rho)
```

where K is the bulk modulus (resistance to compression) and rho is the density.

| Medium | Sound Speed c | Temperature/Conditions | Notes |
|--------|---------------|----------------------|-------|
| Seawater | ~1500 m/s | 15 C, 35 ppt salinity, surface | Standard reference value |
| Fresh water | ~1480 m/s | 20 C | Slightly lower than seawater |
| Air (sea level) | ~343 m/s | 20 C | 4.4x slower than seawater |
| Air (0 C) | ~331 m/s | 0 C | Temperature-dependent |
| Dolphin melon tissue | ~1350-1450 m/s | Body temperature | Lower than surrounding water; enables refraction [P2] |
| Fish swim bladder (gas) | ~340 m/s | In vivo | Dramatically different from water; creates strong reflection [G1] |
| Bone (cortical) | ~3000-4000 m/s | — | High impedance material |

The dramatic difference in sound speed between water (~1500 m/s) and the gas-filled swim bladder (~340 m/s) is central to the acoustic detection of fish by echolocating predators. This impedance mismatch creates a strong reflection — see [Refraction, Reflection, and Compression Waves](03-refraction-reflection-compression.md).

### 2.3 Sound Speed Variation in Seawater

In the real ocean, c is not constant. It varies with temperature (T), salinity (S), and pressure (P, which increases with depth). The empirical Mackenzie equation (1981) gives:

```
c(T, S, D) = 1448.96 + 4.591*T - 0.05304*T^2 + 0.0002374*T^3
             + 1.340*(S - 35) + 0.0163*D + 1.675e-7*D^2
             - 0.01025*T*(S - 35) - 7.139e-13*T*D^3
```

where T is temperature in degrees Celsius, S is salinity in parts per thousand, and D is depth in meters. For the Salish Sea:

| Parameter | Typical Range | Effect on c |
|-----------|--------------|-------------|
| Temperature | 7-13 C (surface, seasonal) | +4.6 m/s per degree C |
| Salinity | 28-32 ppt (influenced by Fraser River) | +1.3 m/s per ppt |
| Depth | 0-300 m (typical Puget Sound) | +0.016 m/s per meter depth |

These variations create acoustic refraction — sound bends toward regions of lower sound speed. This is governed by Snell's law, detailed in [Refraction, Reflection, and Compression Waves](03-refraction-reflection-compression.md).

### 2.4 Ranging Precision and Pulse Design

The precision of range measurement depends on the ability to resolve the timing of the echo. This is limited by the bandwidth of the transmitted pulse:

```
dr = c / (2 * B)
```

where dr is the range resolution (minimum distinguishable range difference) and B is the bandwidth of the pulse. A broader bandwidth enables finer range discrimination.

| System | Bandwidth | Range Resolution |
|--------|-----------|-----------------|
| Dolphin click (broadband) | ~100 kHz | ~7.5 mm |
| Bat FM sweep (broadband) | ~60 kHz | ~2.9 mm (in air) |
| Navy sonar CW ping (narrowband) | ~100 Hz | ~7.5 m |
| Navy sonar FM chirp (broadband) | ~10 kHz | ~75 mm |

Biological sonar systems, by using extremely broadband pulses, achieve range resolution on the order of millimeters — comparable to or exceeding the best engineering systems [P2].

### 2.5 Worked Example — Orca Detecting Chinook Salmon

An orca in the Salish Sea emits a click and receives an echo from a Chinook salmon:

```
Given:
  c  = 1490 m/s     (typical Salish Sea, ~10 C, ~30 ppt)
  dt = 0.20 ms      (200 microseconds round-trip time)

Range:
  r = 1490 * 0.00020 / 2
  r = 0.149 m
  r ≈ 15 cm         (close-range detection, terminal approach phase)
```

At the maximum reported detection range of 500 feet (~152 m) [G1, G5]:

```
Given:
  c  = 1490 m/s
  r  = 152 m

Required round-trip time:
  dt = 2 * r / c
  dt = 2 * 152 / 1490
  dt = 0.204 s
  dt ≈ 204 ms
```

This 204 ms round-trip time sets a constraint on the click repetition rate: the orca must wait at least 204 ms between clicks to avoid ambiguity between the echo from the current click and the next transmitted click. In practice, NOAA biologging data shows that orcas adjust their inter-click interval (ICI) based on target range — longer ICI during search, shorter ICI during pursuit, rapid "buzz" clicking during terminal capture [G1, P9].

---

## 3. Transmission Loss in Detail

Transmission loss (TL) is the reduction in acoustic intensity as sound propagates through a medium. Two mechanisms dominate:

### 3.1 Geometric Spreading

Sound energy spreads over an increasing area as it propagates outward from the source. For an omnidirectional source in an unbounded medium (spherical spreading):

```
TL_spherical = 20 * log10(r)    [dB]
```

where r is the range in meters from the source. This is the inverse-square law: intensity decreases as 1/r^2, which becomes 20*log10(r) in decibels.

In shallow water (such as Puget Sound, typical depths 30-300 m), the sound field eventually becomes trapped between the surface and bottom, and spreading becomes cylindrical:

```
TL_cylindrical = 10 * log10(r)    [dB]
```

A practical model for shallow-water propagation uses a transition range r_t beyond which spreading shifts from spherical to cylindrical:

```
TL = 20 * log10(r)                  for r <= r_t
TL = 20 * log10(r_t) + 10 * log10(r / r_t)   for r > r_t
```

where r_t is approximately equal to the water depth.

### 3.2 Absorption

In addition to geometric spreading, acoustic energy is absorbed by the medium and converted to heat. Absorption increases strongly with frequency:

```
TL_absorption = alpha * r    [dB]
```

where alpha is the absorption coefficient in dB/m (or more commonly dB/km). In seawater:

| Frequency | Absorption alpha | Dominant Mechanism |
|-----------|-----------------|-------------------|
| 1 kHz | ~0.06 dB/km | Magnesium sulfate relaxation |
| 10 kHz | ~1 dB/km | Magnesium sulfate relaxation |
| 50 kHz | ~15 dB/km | Boric acid + MgSO4 |
| 100 kHz | ~36 dB/km | Viscous absorption dominates |

This frequency-dependent absorption places a fundamental limit on the operating frequency of long-range sonar. Navy sonar operates at low frequencies (1-10 kHz) for long range but poor resolution. Dolphin biosonar operates at high frequencies (10-150 kHz) for excellent resolution but limited range. This is not a design choice — it is a physical constraint. Both systems are optimized within the same physics [P2].

### 3.3 Total Transmission Loss

The complete one-way TL is the sum of spreading and absorption:

```
TL = 20 * log10(r) + alpha * r    [dB]
```

For an orca click at 50 kHz over 152 m (500 ft) in the Salish Sea:

```
TL = 20 * log10(152) + 0.015 * 152
TL = 43.6 + 2.3
TL = 45.9 dB    (one-way)
2TL = 91.8 dB   (two-way)
```

The geometric spreading dominates at this range; absorption is modest. At longer ranges or higher frequencies, absorption becomes the limiting factor.

---

## 4. Biological Sonar — Dolphin Biosonar

### 4.1 The Click Generation Mechanism

Dolphins (order Cetacea, suborder Odontoceti) generate echolocation clicks using a pneumatic mechanism in the nasal passage complex. The process, described in detail by Au and Simmons (Physics Today, 2007), involves [P2]:

1. **Pressurized air** is forced through the phonic lips (also called "monkey lips" or MLDB — Monkey Lip / Dorsal Bursae complex), a pair of fatty structures in the nasal passages just below the blowhole.
2. **Phonic lip vibration** produces a broadband acoustic pulse. The initial pulse is short (40-70 microseconds) and broadband (spanning roughly 10-150 kHz).
3. **The melon** — a fatty, lens-shaped organ in the forehead — focuses and shapes the outgoing beam. The melon acts as a graded-index acoustic lens (see [Refraction, Reflection, and Compression Waves](03-refraction-reflection-compression.md) for the full physics).
4. **The skull** acts as a reflector behind the phonic lips, directing energy forward through the melon.

The result is a highly directional, extremely intense, broadband click:

| Parameter | Typical Value | Range |
|-----------|---------------|-------|
| Source Level (SL) | 210-229 dB re 1 uPa @ 1m | Species-dependent |
| Frequency Range | 10-150 kHz | Broadband |
| Peak Frequency | 40-130 kHz | Species-dependent |
| Click Duration | 40-70 us | Individual click |
| Beam Width (-3 dB) | ~10 degrees | Narrow, directional |
| Inter-Click Interval | 20-200 ms | Target-range-dependent |

### 4.2 Click Train Structure

Dolphins do not emit isolated clicks — they produce click trains, sequences of clicks with regular inter-click intervals (ICI). The ICI is actively controlled and encodes the animal's behavioral state:

| Phase | ICI | Click Rate | Interpretation |
|-------|-----|------------|----------------|
| Search | 50-200 ms | 5-20 clicks/s | Long-range scanning; ICI exceeds two-way travel time to maximum search range |
| Approach | 20-50 ms | 20-50 clicks/s | Target acquired; ICI tracks decreasing target range |
| Terminal Buzz | 2-10 ms | 100-500 clicks/s | Final capture phase; maximum update rate, minimum range |

The transition from search to terminal buzz is a universal pattern in echolocating predators — it appears in dolphins, orcas, and bats [P2, G1]. The physics behind it is simple: as the target gets closer, the two-way travel time decreases, allowing faster click repetition without range ambiguity.

### 4.3 The Reception Pathway

Echo reception in dolphins does not occur through the external ear canal (which is vestigial). Instead, the acoustic pathway is:

1. **Lower mandible fat pads** — specialized lipid bodies in the hollow mandible act as acoustic waveguides, channeling incoming sound toward the middle ear.
2. **Tympanic-periotic complex** — the ear bones are isolated from the skull by air-filled sinuses, providing acoustic isolation that enables directional hearing.
3. **Cochlea** — performs frequency analysis (see [Signal Processing and Engineering Analogues](05-signal-processing-analogues.md)).
4. **Auditory nerve and brainstem** — hypertrophied (enlarged) for rapid signal processing. The dolphin auditory nerve has approximately 100,000 fibers, comparable to humans, but the brainstem nuclei are significantly larger [P3].

This reception pathway means that the dolphin's "ears" are effectively in its jawbone — a fact that has profound implications for binaural localization, discussed in [Phase Separation, Comb Filtering, and Binaural Localization](04-phase-comb-filter.md).

### 4.4 Effective Range and Performance Envelope

Dolphin biosonar performance has been measured extensively in controlled experiments:

| Metric | Measured Value | Conditions | Source |
|--------|---------------|------------|--------|
| Maximum detection range (large target) | ~150 m | Steel sphere, 7.6 cm diameter | [P2] |
| Maximum detection range (fish-sized) | 10-100 m | Depends on target TS and ambient noise | [P2, O1] |
| Range resolution | ~7.5 mm | Derived from ~100 kHz bandwidth | [P2] |
| Angular resolution | ~1-2 degrees | Consistent with beam width | [P2] |
| Target discrimination | Resolves shape, size, material | Distinguishes hollow vs. solid targets | [P2] |

The system is remarkably capable given its biological constraints. Au and Simmons describe dolphin signal processing as "near-optimal" despite what they call "mediocre" transducers — the neural processing compensates for hardware limitations, a direct analogy to software-defined radio in engineering [P2].

---

## 5. Southern Resident Orca Echolocation

### 5.1 Population Context

Southern Resident killer whales (SRKW, *Orcinus orca*) are an endangered population listed under the U.S. Endangered Species Act since 2005 [G5]. Fewer than 75 individuals remain as of 2025. They inhabit the Salish Sea — the inland waters of Puget Sound, the San Juan Islands, and the Strait of Georgia — during summer months, where they hunt almost exclusively Chinook salmon (*Oncorhynchus tshawytscha*) [G1, G5].

Their reliance on echolocation for prey detection makes them uniquely vulnerable to anthropogenic noise — a fact that connects the physics of this chapter directly to conservation biology.

### 5.2 Click Characteristics

NOAA Northwest Fisheries Science Center (NWFSC) research, primarily through the biologging tag studies of Marla Holt and Jennifer Tennessen, has characterized SRKW echolocation in the wild [G1, P9]:

| Parameter | Value | Notes |
|-----------|-------|-------|
| Frequency Range | 10,000 - 100,000 Hz | Broadband, typical of odontocete clicks |
| Click Duration | 0.1 - 25 ms | Varies with behavioral state |
| Source Level | Up to 224 dB re 1 uPa @ 1m | Among the highest of any biological source |
| Detection Range (Chinook) | Up to 500 feet (~152 m) | Maximum effective echolocation range for prey |
| Beam Width | ~10-15 degrees | Directional, forward-focused |

### 5.3 Hunting Behavior — The Sonar Equation in Action

Biologging tag data from NOAA NWFSC reveals a structured hunting sequence that maps directly onto the sonar equation parameters [G1, P9]:

**Phase 1: Search (Slow Clicking)**

The orca produces slow, regular click trains while scanning. The ICI is long (100-200 ms), consistent with searching for targets at maximum range. The sonar equation during search:

```
SL(max) - 2TL(long range) + TS(Chinook) - NL(ambient) >= DT
```

The animal maximizes SL and waits the full two-way travel time between clicks.

**Phase 2: Approach (Rapid Buzz Clicking)**

Upon detecting a target, the click rate increases dramatically. The ICI shortens to track the decreasing range. This is the biological equivalent of increasing the pulse repetition frequency (PRF) in engineering radar/sonar when tracking a closing target.

**Phase 3: Terminal Capture (Acrobatic Maneuvers)**

During the final approach, the orca performs rolling and twisting acrobatics correlated with click-train parameters. The animal is using its echolocation to guide precise motor control during capture — a real-time feedback loop between acoustic sensing and locomotion.

### 5.4 The Chinook Target — Why Swim Bladder Physics Matter

NOAA NWFSC research confirms that orcas identify Chinook salmon specifically by the acoustic signature of the swim bladder [G1]. The swim bladder is a gas-filled cavity within the fish, and its acoustic properties are governed by the massive impedance mismatch between gas and water:

```
Z_water = rho_water * c_water ≈ 1025 * 1500 = 1.54 * 10^6 Pa*s/m
Z_air   = rho_air * c_air     ≈ 1.225 * 343 = 420 Pa*s/m

Impedance ratio: Z_water / Z_air ≈ 3660
```

This enormous impedance contrast means that virtually all incident acoustic energy is reflected at the swim bladder boundary. The swim bladder acts as a resonant acoustic reflector, and its resonant frequency depends on its size — which is correlated with fish species and body size. Chinook salmon, being the largest Pacific salmon species, have proportionally larger swim bladders with distinct resonant characteristics.

The detailed physics of this reflection are covered in [Refraction, Reflection, and Compression Waves](03-refraction-reflection-compression.md).

### 5.5 Anthropogenic Noise — When NL Overwhelms SE

The sonar equation makes the noise vulnerability explicit:

```
SE = SL - 2TL + TS - NL
```

If NL increases due to anthropogenic sources — vessel traffic, echosounders, construction — then SE decreases. When SE drops below zero, the echo becomes undetectable. The orca is effectively blinded.

NOAA NWFSC research documents this directly [G1, P9]:

| Noise Source | Frequency Band | Effect on SRKW |
|-------------|----------------|----------------|
| Vessel engine noise | 0.1-10 kHz | Overlaps communication calls; masks social signals |
| Commercial echosounders | 10-200 kHz | Directly overlaps echolocation band; competes with click echoes |
| Small boat sonar (fish finders) | 50-200 kHz | Peak overlap with echolocation frequencies |

Biologging data shows measurable behavioral changes when vessel noise is present [P9]:

- **Longer dive times** (searching harder for prey)
- **Lower capture success** (reduced SE means missed detections)
- **Increased call amplitude** (the Lombard effect — raising voice in noise)
- **Altered swimming patterns** (avoidance behavior)

The Quiet Sound initiative in Puget Sound and mandatory 1,000-yard vessel buffers around SRKW are direct conservation responses to this acoustic physics [G5].

---

## 6. Engineering Sonar Systems

### 6.1 Active Sonar — Navy Arrays

Military active sonar systems operate on exactly the same physics as biological sonar, with different engineering trade-offs:

| Parameter | Navy Hull-Mounted Sonar | Dolphin Biosonar |
|-----------|------------------------|------------------|
| Source Level | 220-235 dB re 1 uPa @ 1m | 210-229 dB re 1 uPa @ 1m |
| Frequency | 1-10 kHz (long range) | 10-150 kHz (short range, high resolution) |
| Beam Width | Steerable, ~3-15 degrees | ~10 degrees, head-steered |
| Pulse Type | CW ping, FM chirp, coded pulses | Broadband click |
| Array Size | 3-10 m diameter | ~15 cm (melon diameter) |
| Processing | Digital signal processing, matched filter | Neural processing, auditory cortex |
| Range | 10-100+ km (low frequency) | 10-150 m |
| Resolution | Meters (narrowband) to cm (wideband) | Millimeters |
| Power Source | Ship's electrical plant | Metabolic energy |

The frequency trade-off is fundamental: low frequency means low absorption and long range but poor resolution; high frequency means high absorption and short range but excellent resolution. Navy sonar optimizes for range; dolphin sonar optimizes for resolution. Both obey the same physics.

### 6.2 Passive Sonar — Listening Arrays

Passive sonar listens without transmitting. The equation simplifies:

```
SL_target - TL - NL >= DT
```

There is no 2TL (one-way only) and no TS (no reflection — the target is the source). Passive sonar is used for submarine detection (listening for engine noise, propeller cavitation) and in marine biology for cetacean monitoring.

The NOAA hydrophone networks in the Salish Sea operate as passive sonar systems. The Orca Behavior Institute maintains live-streaming hydrophones throughout Puget Sound and the San Juan Islands [O2]. These systems detect orca vocalizations (calls, whistles, clicks) and ambient noise, providing real-time data on SRKW presence and noise exposure.

### 6.3 Sonar Pulse Design — CW vs. FM

Engineering sonar uses two fundamental pulse types, each with distinct physics:

**Continuous Wave (CW) Ping:**
- Fixed frequency for the duration of the pulse
- Excellent for Doppler velocity measurement (see [Doppler Effect](02-doppler-effect.md))
- Poor range resolution (resolution = c*tau/2, where tau is pulse duration)
- Long pulses increase energy on target but degrade range resolution

**Frequency Modulated (FM) Chirp:**
- Frequency sweeps linearly across a bandwidth B during the pulse
- After matched filtering, range resolution = c/(2B), independent of pulse duration
- Can achieve both high energy (long pulse) and fine resolution (wide bandwidth)
- This is exactly what bat FM sweeps accomplish biologically [P2]

The parallels between engineering FM chirp sonar and bat FM sweep echolocation are not coincidental — they are convergent solutions to the same physical optimization problem. Au and Simmons explicitly draw this comparison in their Physics Today analysis [P2].

---

## 7. The Melon vs. the Array — Comparative Acoustics

### 7.1 Beam-Forming Physics

Both biological and engineering sonar systems must form directional beams. The physics is identical — constructive and destructive interference of acoustic waves from spatially distributed sources (or through a refractive medium):

**Engineering approach — Phased Array:**
- Multiple discrete transducer elements arranged in a geometric pattern
- Electronic phase delays between elements steer the beam
- Beam width theta ≈ lambda / D, where lambda is wavelength and D is array diameter
- Beam can be steered electronically without mechanical motion
- Requires precise synchronization of all elements

**Biological approach — Graded-Index Lens (Melon):**
- The melon has a graded sound-velocity profile: lowest velocity at the center, increasing toward the periphery
- Sound refracts toward the low-velocity center, converging the beam
- This is identical to a graded-index (GRIN) optical lens
- CT scans confirm the velocity gradient structure [P2]
- Beam is steered mechanically by head movement and possibly by muscular deformation of the melon

The end result is the same: a directional acoustic beam with angular width determined by the ratio of wavelength to aperture size. The melon is approximately 15 cm in diameter. At 100 kHz (wavelength = 1.5 cm in water), the beam width is approximately:

```
theta ≈ lambda / D = 0.015 / 0.15 = 0.1 radians ≈ 6 degrees
```

This matches measured beam widths of 6-10 degrees in dolphins [P2]. The physics is exactly the diffraction limit — the same equation governs the resolution of a telescope, a radar antenna, and a dolphin's melon.

### 7.2 Source Level Comparison

The fact that a dolphin can produce source levels (up to 229 dB re 1 uPa @ 1m) comparable to a Navy sonar transmitter (220-235 dB) is remarkable. The dolphin achieves this with a pneumatic mechanism weighing a few hundred grams and powered by metabolic energy. The engineering system requires hundreds of kilowatts of electrical power and transducers weighing tons.

The biological efficiency comes from:
- Extremely short pulses (microseconds) — concentrating energy in time
- Narrow bandwidth focusing (the melon concentrates energy spatially)
- Impedance-matched transmission chain (tissue-to-water coupling is inherently good; the melon further optimizes it)

### 7.3 Signal Processing Comparison

The most profound difference is in signal processing:

| Aspect | Engineering Sonar | Dolphin Biosonar |
|--------|------------------|------------------|
| Echo Detection | Matched filter (cross-correlation with transmitted pulse) | Neural template matching (unknown algorithm, but performance comparable to matched filter) |
| Noise Rejection | Adaptive beamforming, noise cancellation | Directional hearing, neural filtering |
| Target Classification | Feature extraction algorithms | Unknown neural mechanism — dolphins distinguish hollow vs. solid, copper vs. steel [P2] |
| Multi-Target Resolution | Range-Doppler processing | Unknown — dolphins can track multiple targets simultaneously |

Au and Simmons describe dolphin signal processing as achieving "near-optimal" performance despite "mediocre" transducers [P2]. This is a striking statement: the biological system compensates for hardware limitations through superior software (neural processing). This is directly analogous to the engineering concept of software-defined radio, where sophisticated signal processing compensates for simple, wideband antennas.

---

## 8. Target Strength and Acoustic Cross-Section

### 8.1 Definition

Target strength (TS) is the acoustic reflectivity of a target, defined as:

```
TS = 10 * log10(sigma / (4 * pi))    [dB]
```

where sigma is the acoustic scattering cross-section in square meters. TS depends on:

- **Target size** relative to wavelength
- **Target shape** (smooth sphere vs. irregular shape)
- **Material properties** (impedance contrast with the medium)
- **Aspect angle** (orientation of the target relative to the incident sound)

### 8.2 Fish Target Strength

For fish, the swim bladder dominates TS. Typical values:

| Species | Length | TS (dorsal aspect) | Notes |
|---------|--------|-------------------|-------|
| Chinook salmon (adult) | 60-90 cm | -30 to -25 dB | Large swim bladder; strong reflector [G1] |
| Sockeye salmon (adult) | 40-60 cm | -35 to -30 dB | Smaller body and swim bladder |
| Herring | 20-30 cm | -45 to -35 dB | Strong tilt dependence |
| Euphausiid (krill) | 1-3 cm | -70 to -60 dB | Extremely weak; requires dense aggregation for detection |

The relationship between fish length L and TS follows an approximate scaling:

```
TS ≈ 20 * log10(L) - 68    [dB, L in cm]
```

This empirical formula (Love 1977) captures the general trend, but actual TS varies significantly with species, aspect angle, and swim bladder morphology. The large swim bladder of Chinook salmon is one reason orcas can detect them at 500 feet — the target strength is relatively high compared to other prey species.

### 8.3 Aspect Dependence and Swim Bladder Resonance

The swim bladder resonates at a frequency determined by its size. The resonant frequency for a gas-filled sphere in water is approximately:

```
f_res = (1 / (2 * pi * a)) * sqrt(3 * gamma * P_0 / rho)
```

where a is the bladder equivalent radius, gamma is the adiabatic gas constant (~1.4 for air), P_0 is the ambient hydrostatic pressure, and rho is the water density. For a Chinook salmon swim bladder (equivalent radius ~3 cm) at 10 m depth:

```
f_res ≈ (1 / (2 * pi * 0.03)) * sqrt(3 * 1.4 * 2.0e5 / 1025)
f_res ≈ 5.3 * sqrt(819)
f_res ≈ 5.3 * 28.6
f_res ≈ 152 Hz
```

At frequencies well above resonance (which is the case for orca echolocation at 10-100 kHz), the swim bladder reflects as a geometric target and its TS scales with physical cross-sectional area. This means orca clicks at tens of kHz are interacting with the swim bladder in the geometric scattering regime, where the echo carries information about the size and shape of the bladder — potentially enabling species discrimination.

---

## 9. Noise and Signal Excess

### 9.1 Ambient Noise Spectrum in the Salish Sea

Ambient noise in the marine environment has multiple sources, each dominant in different frequency bands:

| Frequency Band | Dominant Source | Typical Level | Impact on Biosonar |
|---------------|----------------|---------------|-------------------|
| 1-100 Hz | Shipping traffic, wind, waves | 80-100 dB re 1 uPa | Below echolocation band; affects communication |
| 100 Hz - 1 kHz | Vessel machinery, biologics | 70-90 dB | Overlaps low-frequency communication calls |
| 1-10 kHz | Small vessel propellers, rain | 50-80 dB | Transition zone |
| 10-100 kHz | Echosounder interference, thermal noise | 40-70 dB | Direct overlap with echolocation band |
| >100 kHz | Thermal noise | 30-50 dB | Fundamental noise floor |

### 9.2 Signal Excess Budget — Quiet vs. Noisy Conditions

Consider an orca detecting a Chinook salmon at 100 m range:

**Quiet conditions (no vessel traffic):**
```
SL  = 220 dB
2TL = 2 * (20*log10(100) + 0.01*100) = 2 * (40 + 1) = 82 dB
TS  = -28 dB (Chinook, broadside)
NL  = 55 dB (quiet ambient in echolocation band)

SE  = 220 - 82 - 28 - 55 = 55 dB    (comfortable detection)
```

**Noisy conditions (whale-watching vessel with echosounder):**
```
SL  = 220 dB
2TL = 82 dB  (same range)
TS  = -28 dB (same target)
NL  = 85 dB  (vessel echosounder in band)

SE  = 220 - 82 - 28 - 85 = 25 dB    (still detectable, but 30 dB less margin)
```

**Very noisy conditions (multiple vessels, echosounders active):**
```
NL  = 105 dB

SE  = 220 - 82 - 28 - 105 = 5 dB    (marginal — near detection threshold)
```

A 50 dB increase in noise level cuts the detection margin from 55 dB to 5 dB. In decibel terms, this corresponds to a reduction in maximum detection range from ~500 ft to roughly 50 ft — the orca's acoustic world shrinks by a factor of 10 in linear range [G1, G5].

---

## 10. Click Train Temporal Patterns

### 10.1 Inter-Click Interval and Range Tracking

The relationship between ICI and target range is:

```
ICI >= 2 * r_max / c + t_processing
```

where r_max is the maximum unambiguous range and t_processing is the neural processing time for each echo. If the orca clicks faster than this, the echo from a distant target may arrive after the next click is transmitted, creating range ambiguity.

Biologging data shows that orcas obey this constraint naturally [G1, P9]:

| Behavioral State | Typical ICI | Implied r_max | Click Rate |
|-----------------|-------------|---------------|------------|
| Distant search | 150-200 ms | 112-150 m | 5-7 clicks/s |
| Mid-range tracking | 50-100 ms | 37-75 m | 10-20 clicks/s |
| Close approach | 20-50 ms | 15-37 m | 20-50 clicks/s |
| Terminal buzz | 2-10 ms | 1.5-7.5 m | 100-500 clicks/s |

### 10.2 Click Train as Time Series

A click train is a discrete time series of acoustic events. Each click-echo pair provides one range measurement. The click train as a whole provides:

- **Range rate** (dr/dt) — the time derivative of range, indicating closing speed. This is Doppler information extracted from the time domain rather than the frequency domain (see [Doppler Effect](02-doppler-effect.md)).
- **Range acceleration** — changes in closing speed, useful for tracking maneuvering targets.
- **Target characterization** — echo amplitude and spectral content vary with aspect angle, providing shape information as the relative geometry changes.

The GPU pipeline for bioacoustic analysis processes these click trains as time series, applying spectrogram analysis (Short-Time Fourier Transform) and comb filter detection to extract these features in real time [P8].

---

## 11. PNW Cross-Reference

### 11.1 Salish Sea Orca-Salmon Acoustic Ecosystem

The Southern Resident orca population's dependence on echolocation for Chinook salmon predation creates a direct link between acoustic physics and Pacific Northwest conservation biology:

| Physics Concept | Biological Implementation | Conservation Relevance |
|----------------|--------------------------|----------------------|
| Sonar equation (SE = SL - 2TL + TS - NL) | Orca echolocation performance budget | Anthropogenic noise raises NL, reducing detection range |
| Time-delta ranging | Click-echo range measurement | Click train structure reveals foraging success/failure |
| Transmission loss | Geometric spreading + absorption | Determines effective hunting radius in Salish Sea waters |
| Target strength | Chinook swim bladder reflection | Orcas discriminate Chinook from other salmon by acoustic signature |
| Noise level | Ambient + anthropogenic noise | Vessel echosounders directly compete with echolocation band |
| Signal excess | Detection margin | Quiet Sound initiative targets SE improvement through NL reduction |

### 11.2 PNW Bat Echolocation — Parallel System

Pacific Northwest bat species (Big Brown Bat *Eptesicus fuscus*, Little Brown Bat *Myotis lucifugus*) use the same echo-delay ranging physics in air [P2]:

| Parameter | PNW Bat (FM) | Salish Sea Orca |
|-----------|-------------|-----------------|
| Medium | Air (c = 343 m/s) | Seawater (c = 1500 m/s) |
| Frequency | 20-80 kHz | 10-100 kHz |
| Pulse Type | FM sweep (broadband) | Click (broadband) |
| Range | 1-10 m (insect prey) | 10-150 m (salmon prey) |
| Resolution | ~2.9 mm | ~7.5 mm |
| Ranging Equation | r = 343 * dt/2 | r = 1500 * dt/2 |

The ranging equation is identical. Only the speed of sound differs. PNW FM bats are discussed further in [Doppler Effect](02-doppler-effect.md) in the context of their frequency-modulated sweep strategy.

### 11.3 Hydrophone Monitoring Networks

The Salish Sea is one of the most acoustically monitored marine environments in the world:

- **Orca Behavior Institute** — live-streaming hydrophones at multiple locations in Puget Sound and Haro Strait [O2]
- **OrcaHello / ORCA-SPOT** — GPU-accelerated real-time detection of orca vocalizations using deep neural networks trained on 19,000 hours of recordings [P8]
- **NOAA NWFSC biologging** — suction-cup tags recording echolocation clicks, ambient noise, depth, and acceleration simultaneously [P9]
- **Quiet Sound** — vessel noise monitoring program using hydrophone arrays [G5]

These systems apply the sonar equation in reverse: by measuring the received level of orca vocalizations and knowing the source level, researchers can estimate the range and direction of the animals. This is passive sonar applied to conservation.

---

## 12. Interrelationships

This document connects to every other module in the Bio-Physics Sensing atlas:

| Related Document | Connection |
|-----------------|------------|
| [Doppler Effect](02-doppler-effect.md) | Doppler shifts in echoes encode target velocity; complementary to range from echo delay |
| [Refraction, Reflection, and Compression Waves](03-refraction-reflection-compression.md) | Melon beam-forming (refraction), swim bladder reflection (impedance), compression wave propagation |
| [Phase Separation, Comb Filtering, and Binaural Localization](04-phase-comb-filter.md) | Binaural echo processing for directional hearing; comb filter patterns in click train spectrograms |
| [Signal Processing and Engineering Analogues](05-signal-processing-analogues.md) | Matched filtering, Fourier analysis, impedance matching — every DSP concept has a sonar application |

---

## 13. Sources

### Government and Agency

| ID | Source | Relevance |
|----|--------|-----------|
| G1 | NOAA Northwest Fisheries Science Center | SRKW echolocation parameters, prey detection range, biologging data |
| G5 | NOAA Vital Signs — Orcas | SRKW population status, Quiet Sound initiative, vessel buffer regulations |

### Peer-Reviewed Research

| ID | Citation | Relevance |
|----|----------|-----------|
| P2 | Au, W.W.L. and Simmons, J.A. (2007). Echolocation in dolphins and bats. Physics Today. | Dolphin/bat sonar physics, melon beam-forming, "near-optimal" processing |
| P3 | Mulsow, J. et al. (2020). Anatomy and neural physiology of dolphin biosonar. FASEB Journal. | Dolphin auditory nerve, brainstem hypertrophy, neural processing chain |
| P8 | Bergler, C. et al. (2019). ORCA-SPOT deep learning for killer whale detection. Scientific Reports. | GPU bioacoustic detection, spectrogram pipeline |
| P9 | Holt, M. / Tennessen, J. — NOAA NWFSC. Biologging tag studies on Southern Resident orcas. | Orca foraging behavior, click train structure, vessel noise effects |

### Professional Organizations

| ID | Source | Relevance |
|----|--------|-----------|
| O1 | dolphins.org | Dolphin acoustics overview, source level data |
| O2 | Orca Behavior Institute | Salish Sea hydrophone network, orca acoustic monitoring |

---

*The physics does not change. The sonar equation governs every echo-ranging system in existence — from a 10,000-ton destroyer's hull-mounted array to a 200-kilogram orca's melon and mandible. The only variables are the transducer, the medium, and the frequency. The math is the same.*
