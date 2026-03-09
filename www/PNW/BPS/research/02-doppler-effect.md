# Doppler Effect and Blue Shift

> **Physics Domain:** Acoustic
> **Module:** 1 — Acoustic Physics
> **Through-line:** *The physics does not change* — the Doppler equation is identical for a police radar gun, a horseshoe bat in a cave, and a stellar spectrograph measuring the recession velocity of a galaxy. Frequency shift encodes relative velocity. Period.

---

## Table of Contents

1. [The Doppler Equation](#1-the-doppler-equation)
2. [Doppler in Different Media](#2-doppler-in-different-media)
3. [Blue Shift and Red Shift — Universal Concepts](#3-blue-shift-and-red-shift--universal-concepts)
4. [Doppler Shift Compensation in Horseshoe Bats](#4-doppler-shift-compensation-in-horseshoe-bats)
5. [The Silent Frequency Band — 2025 bioRxiv Discovery](#5-the-silent-frequency-band--2025-biorxiv-discovery)
6. [CF Bats vs. FM Bats — Two Strategies for the Same Physics](#6-cf-bats-vs-fm-bats--two-strategies-for-the-same-physics)
7. [Doppler in Marine Biosonar](#7-doppler-in-marine-biosonar)
8. [Engineering Doppler Systems](#8-engineering-doppler-systems)
9. [Wing Flutter Detection — Biological Micro-Doppler](#9-wing-flutter-detection--biological-micro-doppler)
10. [The Auditory Fovea Connection](#10-the-auditory-fovea-connection)
11. [PNW Cross-Reference](#11-pnw-cross-reference)
12. [Interrelationships](#12-interrelationships)
13. [Sources](#13-sources)

---

## 1. The Doppler Equation

### 1.1 The General Form

When a wave source and a receiver are in relative motion, the received frequency differs from the transmitted frequency. The general Doppler equation for sound waves is:

```
f_received = f_0 * (c + v_receiver) / (c - v_source)
```

where:

| Symbol | Name | Definition | Units | Sign Convention |
|--------|------|------------|-------|----------------|
| f_received | Received frequency | Frequency measured by the receiver | Hz | — |
| f_0 | Source frequency | Frequency emitted by the source | Hz | — |
| c | Wave speed | Speed of sound in the medium | m/s | Always positive |
| v_receiver | Receiver velocity | Speed of the receiver toward the source | m/s | Positive = toward source |
| v_source | Source velocity | Speed of the source toward the receiver | m/s | Positive = toward receiver |

The sign convention is critical: velocities toward each other are positive (compression/blue shift); velocities away from each other are negative (expansion/red shift).

### 1.2 The Echo Doppler Equation

For echolocation — where the animal both transmits and receives, and the echo reflects off a moving target — the equation compounds. The outgoing signal is Doppler-shifted as received by the target, and the reflected signal is Doppler-shifted again on the return path. For a bat (or dolphin, or radar) moving at velocity v_bat toward a stationary target:

```
f_echo = f_0 * (c + v_bat) / (c - v_bat)
```

This is the "double Doppler" — the shift is applied twice because the wave is Doppler-shifted on transmission (the source is moving) and again on reception (the receiver is moving). For small velocities relative to c (v_bat << c), this simplifies to:

```
delta_f ≈ 2 * f_0 * v_bat / c
```

where delta_f = f_echo - f_0 is the Doppler shift.

### 1.3 Worked Example — Flying Bat

A greater horseshoe bat (*Rhinolophus ferrumequinum*) emitting a constant-frequency call at f_0 = 83 kHz, flying at v_bat = 5 m/s toward a stationary target in air (c = 343 m/s):

```
f_echo = 83000 * (343 + 5) / (343 - 5)
f_echo = 83000 * 348 / 338
f_echo = 83000 * 1.02959
f_echo = 85,456 Hz

Doppler shift: delta_f = 85,456 - 83,000 = 2,456 Hz
```

A 2.5 kHz upward shift — the echo returns at a higher frequency because the bat is closing on the target. This is acoustic blue shift.

Using the approximate formula:
```
delta_f ≈ 2 * 83000 * 5 / 343 = 2,420 Hz
```

The approximation is within 1.5% — accurate enough for biological analysis but the exact form matters when discussing the precision of bat DSC systems.

### 1.4 Dimensional Analysis

The Doppler equation is dimensionally self-consistent:

```
[f_echo] = [f_0] * [m/s + m/s] / [m/s - m/s]
         = Hz * (dimensionless ratio)
         = Hz
```

The velocity-to-sound-speed ratio v/c is dimensionless and determines the magnitude of the shift. For sound in air (c = 343 m/s) and biological flight speeds (1-10 m/s), v/c ranges from 0.003 to 0.03 — a 0.3% to 3% frequency shift. Small in relative terms, but at 83 kHz, a 3% shift is 2,490 Hz — well within the frequency discrimination capability of the bat auditory system.

For sound in water (c = 1500 m/s) and marine animal speeds (1-10 m/s), v/c is 4.4 times smaller: 0.0007 to 0.007. Doppler shifts in water are correspondingly smaller for the same velocity, because the wave speed is higher.

---

## 2. Doppler in Different Media

### 2.1 The Medium Matters

The magnitude of Doppler shift depends on v/c — the ratio of relative velocity to wave speed. Since c differs dramatically between media, the same physical velocity produces very different frequency shifts:

| Medium | c (m/s) | v/c for 5 m/s | Shift at 50 kHz |
|--------|---------|---------------|-----------------|
| Air (20 C) | 343 | 0.0146 | 1,458 Hz |
| Fresh water (20 C) | 1480 | 0.00338 | 338 Hz |
| Seawater (15 C) | 1500 | 0.00333 | 333 Hz |
| Soft tissue | ~1540 | 0.00325 | 325 Hz |

This has a profound biological consequence: Doppler-based echolocation strategies are approximately 4.4 times more effective in air than in water for the same velocity. This may partially explain why CF (constant-frequency) echolocation with active Doppler compensation evolved in bats (airborne) but not in dolphins (aquatic). In water, the Doppler shifts are smaller and harder to exploit; FM (frequency-modulated) strategies that rely on time-delay ranging are more practical [P2].

### 2.2 Sound Speed in Air — Temperature Dependence

The speed of sound in air depends on temperature:

```
c_air = 331.3 * sqrt(1 + T/273.15)    [m/s, T in Celsius]
```

| Temperature | c_air | Notes |
|-------------|-------|-------|
| -10 C | 325.2 m/s | PNW winter night (bat hibernation temperatures) |
| 0 C | 331.3 m/s | Standard reference |
| 10 C | 337.3 m/s | PNW spring evening (bat emergence) |
| 20 C | 343.2 m/s | PNW summer night (peak bat activity) |
| 30 C | 349.0 m/s | Rare in PNW |

A bat echolocating on a 10 C evening experiences a 1.7% lower sound speed than on a 20 C evening, which translates to a 1.7% larger Doppler shift for the same flight speed. For CF bats that maintain echo frequency within extremely tight tolerances, temperature-induced changes in c must be compensated — either by adjusting call frequency or by neural recalibration.

---

## 3. Blue Shift and Red Shift — Universal Concepts

### 3.1 Definition

- **Blue shift:** The received frequency is higher than the transmitted frequency. This occurs when the source and receiver are approaching each other — the wave crests are compressed.
- **Red shift:** The received frequency is lower than the transmitted frequency. This occurs when the source and receiver are moving apart — the wave crests are stretched.

The terminology originates from optics (blue light has shorter wavelength/higher frequency; red light has longer wavelength/lower frequency), but the physics is universal across all wave phenomena.

### 3.2 The Same Equation Across Domains

| Domain | Medium | v/c | Application |
|--------|--------|-----|-------------|
| Bat echolocation | Air | ~0.01-0.03 | Prey velocity, DSC |
| Dolphin/orca sonar | Water | ~0.001-0.007 | Target motion detection |
| Medical ultrasound | Tissue | ~0.001-0.01 | Blood flow velocity (Doppler ultrasound) |
| Police radar | Electromagnetic (vacuum) | ~10^-7 | Vehicle speed measurement |
| Stellar spectroscopy | Electromagnetic (vacuum) | ~10^-4 to ~0.1 | Galaxy recession velocity |
| Gravitational waves | Spacetime | — | Chirp signal from merging black holes |

In every case, the relationship is the same: frequency shift encodes relative velocity. The equation changes form slightly for electromagnetic waves (which don't require a medium and obey relativistic Doppler), but the core principle is invariant.

### 3.3 Why Blue Shift Matters for Echolocation

For an echolocating animal flying or swimming toward a target, the echo is always blue-shifted (higher frequency). This is because both the outgoing and returning waves experience compression due to the animal's forward motion.

The magnitude of this blue shift carries information:
- **Larger blue shift** = faster closing speed (approaching target or fast-flying bat)
- **Zero shift** = no relative radial velocity (target moving perpendicular to the beam, or both stationary)
- **Red shift** = receding target (prey escaping)

For CF bats, this information is extracted with extraordinary precision through a mechanism that has no engineering parallel: Doppler Shift Compensation.

---

## 4. Doppler Shift Compensation in Horseshoe Bats

### 4.1 The Phenomenon

Horseshoe bats (family Rhinolophidae) and Old World leaf-nosed bats (family Hipposideridae) employ a remarkable behavioral adaptation called Doppler Shift Compensation (DSC). When flying toward a target, the echo returns at a higher frequency due to the Doppler effect. Instead of processing this shifted echo directly, the bat *lowers its outgoing call frequency* by precisely the amount needed so that the echo returns at a specific reference frequency (f_ref) [P6].

```
Mechanism:
  1. Bat at rest emits at f_ref (resting frequency)
  2. Bat in flight: echo returns at f_echo = f_ref * (c + v) / (c - v)
  3. Echo is Doppler-shifted UP by delta_f
  4. Bat LOWERS its emission to f_emit = f_ref - delta_f (approximately)
  5. Echo now returns at approximately f_ref regardless of flight speed
```

The result: the echo frequency is held nearly constant at f_ref, even as the bat accelerates, decelerates, turns, and maneuvers. This is a biological implementation of a frequency-locked loop — the bat's outgoing call frequency is the controlled variable, and the echo frequency is the regulated output.

### 4.2 Precision of DSC — Hipposideros armiger Data

Research published in *Scientific Reports* (2018) on the great roundleaf bat (*Hipposideros armiger*) quantified the precision of DSC:

| Metric | Value | Significance |
|--------|-------|-------------|
| Reference frequency (f_ref) | ~67.5 kHz | Species-specific; determined by auditory fovea tuning |
| Echo frequency standard deviation | 110 Hz | Across ALL flight speeds |
| Relative precision | 110/67,500 = 0.16% | Extraordinary for a biological control system |
| Compensation accuracy | >95% of expected Doppler shift | Nearly perfect tracking |
| Response latency | ~50 ms | Time to adjust emission after speed change |

A standard deviation of 110 Hz at 67.5 kHz means the bat maintains its echo within a band that is **0.16% of the carrier frequency**. For comparison, a typical FM radio station transmits on a carrier that drifts less than 0.002% — the bat's biological control loop achieves frequency stability within two orders of magnitude of an engineered radio transmitter.

### 4.3 The Control Loop

DSC is a negative feedback control system:

```
                    +------------------+
                    |  AUDITORY SYSTEM  |
                    |  Measures f_echo  |
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    |  COMPARATOR       |
                    |  f_echo - f_ref   |
                    +--------+---------+
                             |
                             v (error signal)
                    +--------+---------+
                    |  MOTOR CONTROL    |
                    |  Adjusts larynx   |
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    |  LARYNX           |
                    |  Emits at f_emit  |
                    +--------+---------+
                             |
                             v (outgoing call)
                    +--------+---------+
                    |  DOPPLER PHYSICS  |
                    |  f_echo = f_emit  |
                    |    * (c+v)/(c-v)  |
                    +--------+---------+
                             |
                             v (echo)
                    +--------+---------+
                    |  AUDITORY SYSTEM  |
                    |  (loop repeats)   |
                    +------------------+
```

The loop runs continuously during flight. The "comparator" is the auditory fovea — a specialized region of the cochlea tuned precisely to f_ref (see [Phase Separation, Comb Filtering, and Binaural Localization](04-phase-comb-filter.md)). The "motor control" adjusts laryngeal tension and airflow to change the fundamental frequency of the call. The "plant" is the Doppler physics itself, which the bat cannot change — only compensate for.

### 4.4 Why DSC Evolved

DSC exists because the auditory fovea — the bat's most sensitive frequency-analysis hardware — is tuned to a narrow frequency band around f_ref. By ensuring that echoes always arrive within this band, the bat maximizes:

1. **Frequency resolution** — the fovea has the highest density of hair cells and narrowest tuning, enabling detection of tiny frequency modulations (wing flutter)
2. **Sensitivity** — more hair cells per unit frequency means lower detection threshold
3. **Signal-to-clutter ratio** — echoes are pinned to the fovea band while background clutter (which is not Doppler-compensated) falls outside it

This is the biological equivalent of an engineering superheterodyne receiver that converts all signals to a fixed intermediate frequency (IF) where the best filtering and amplification hardware resides. The bat's "IF stage" is the auditory fovea.

---

## 5. The Silent Frequency Band — 2025 bioRxiv Discovery

### 5.1 The Finding

A 2025 study by Knauer et al. (published on bioRxiv) revealed an additional function of DSC that had not been previously recognized: DSC creates a "silent frequency band" that suppresses background acoustic clutter, dramatically enhancing prey detection [P6].

### 5.2 The Mechanism

The key insight is that DSC only compensates for the bat's own flight velocity. Echoes from the bat's own movement toward stationary background objects (trees, walls, ground) return at f_ref because DSC is precisely tuned for this. But echoes from *prey* — which are moving independently — return at frequencies that differ from f_ref by exactly the prey's velocity component:

```
Echo from background:
  f_bg = f_emit * (c + v_bat) / (c - v_bat)
  With DSC: f_bg ≈ f_ref    (by design)

Echo from prey (with velocity v_prey relative to bat):
  f_prey = f_emit * (c + v_bat + v_prey) / (c - v_bat - v_prey)
  With DSC: f_prey ≈ f_ref + delta_f_prey
  where delta_f_prey ≈ 2 * f_ref * v_prey / c
```

The result: all background echoes cluster at f_ref, while prey echoes are offset from f_ref by an amount proportional to the prey's own velocity. DSC effectively *subtracts the bat's own motion* from the Doppler spectrum, isolating prey-specific velocity information.

### 5.3 The Silent Band

Between the background echo frequency (at f_ref) and the prey echo frequency (at f_ref + delta_f_prey), there exists a frequency gap — the "silent band" — where no echoes are expected from either background or prey. This band acts as a noise floor between the two signal classes:

```
Frequency spectrum with DSC:

  |                     prey echo (f_ref + delta_f_prey)
  |                         |
  |                    [silent band]
  |                         |
  |  background echoes (f_ref)
  |         |
  +-----+---+----+---------+----+----> frequency
       f_ref         f_ref + delta_f
```

The auditory fovea, centered at f_ref, provides maximum frequency resolution in exactly this region — enabling the bat to distinguish the narrow prey echo from the broad background clutter. The silent band is the biological equivalent of a guard band in communications engineering, separating two signals that would otherwise interfere.

### 5.4 Implications

This finding reframes DSC from a simple "echo stabilization" mechanism to a sophisticated clutter-rejection system. The bat is not merely stabilizing its echo frequency — it is actively creating a spectral regime where prey signals are isolated from background clutter by a physics-guaranteed frequency gap.

The engineering parallel is Moving Target Indication (MTI) in radar: by compensating for the radar platform's own motion (ground clutter suppression), the system isolates echoes from targets that have independent velocity. The bat achieves the same result through vocal-motor compensation rather than electronic signal processing [P6].

---

## 6. CF Bats vs. FM Bats — Two Strategies for the Same Physics

### 6.1 Constant-Frequency (CF) Bats

CF bats emit calls dominated by a long, constant-frequency component:

```
Call structure: CF-FM
  |  CF component (long, fixed frequency)  |  FM component (short, downward sweep)  |
  |<------------ 20-60 ms --------------->|<------------ 2-5 ms ----------------->|
```

| Feature | CF Strategy |
|---------|-------------|
| Primary information | Doppler shift (target velocity) from CF component |
| Secondary information | Range (echo delay) from FM component |
| Frequency bandwidth | Narrow CF + moderate FM sweep |
| Prey detection method | Wing flutter creates characteristic frequency modulation on CF echo |
| Key adaptation | DSC + auditory fovea (specialized for f_ref) |
| Representative species | Greater horseshoe bat (*Rhinolophus ferrumequinum*), *Hipposideros armiger* |
| Habitat | Cluttered environments (forests, caves) — CF+DSC excels at clutter rejection |

### 6.2 Frequency-Modulated (FM) Bats

FM bats emit calls that sweep across a wide frequency range:

```
Call structure: FM sweep
  |                                       |
  | 80 kHz ----\                          |
  |             \                         |
  |              \                        |
  |               \                       |
  |                \---- 20 kHz           |
  |<------------ 2-10 ms --------------->|
```

| Feature | FM Strategy |
|---------|-------------|
| Primary information | Range (echo delay) with fine resolution from wideband pulse |
| Secondary information | Limited Doppler (broad cochlear tuning tolerates frequency shifts) |
| Frequency bandwidth | Wide (20-80 kHz typical in PNW species) |
| Prey detection method | Echo delay and amplitude modulation; target characterization from spectral shape |
| Key adaptation | Broadband cochlea, temporal processing |
| Representative species | Big brown bat (*Eptesicus fuscus*), little brown bat (*Myotis lucifugus*) |
| Habitat | Open to semi-cluttered (forest edges, clearings, over water) |

### 6.3 The Physics Trade-Off

The two strategies represent different optimization choices within the same Doppler physics:

| Parameter | CF Bat | FM Bat |
|-----------|--------|--------|
| Doppler sensitivity | Extremely high (auditory fovea, DSC) | Low (broadband cochlea absorbs shifts) |
| Range resolution | Moderate (FM tail provides ranging) | Excellent (wideband = fine range resolution) |
| Velocity resolution | Excellent (narrow CF = precise Doppler) | Poor (wideband = ambiguous Doppler) |
| Clutter rejection | Excellent (DSC + silent band) | Moderate (relies on range gating) |
| Wing flutter detection | Excellent (modulation of CF component) | Poor (obscured by broadband nature) |

This is directly analogous to the engineering trade-off between CW and FM radar/sonar (see [Sonar and Echo-Delay Ranging](01-sonar-echo-delay.md) Section 6.3). CW radar excels at velocity measurement; FM chirp radar excels at range measurement. CF bats are biological CW systems; FM bats are biological FM chirp systems. The physics dictates the trade-off; evolution and engineering arrive at the same solutions independently [P2].

### 6.4 Hybrid Strategies

Some species combine both approaches:

- **CF-FM bats** (horseshoe bats): Long CF component for Doppler, followed by FM sweep for ranging. This is the biological equivalent of a combined CW/FM pulse in engineering radar.
- **FM bats with quasi-CF tails**: Some FM bats (including some *Myotis* species) end their FM sweep with a brief narrowband component, gaining limited Doppler sensitivity.
- **PNW FM bats** (*E. fuscus*, *M. lucifugus*): Primarily FM, with sweep rates and bandwidths adapted to their habitat. In cluttered forest environments (typical PNW old-growth), these bats shorten their sweeps and increase repetition rate — a strategy that emphasizes range over velocity, appropriate for detecting insects at close range among dense obstacles [P2].

---

## 7. Doppler in Marine Biosonar

### 7.1 Why Dolphins Don't Use DSC

Despite being sophisticated echolocators, dolphins and orcas do not employ DSC or CF echolocation. The reason is physical, not biological:

```
Doppler shift in air (bat at 5 m/s, f_0 = 83 kHz):
  delta_f = 2 * 83000 * 5 / 343 = 2,420 Hz

Doppler shift in water (dolphin at 5 m/s, f_0 = 100 kHz):
  delta_f = 2 * 100000 * 5 / 1500 = 667 Hz
```

The Doppler shift in water is 3.6 times smaller than in air for the same velocity, because c_water / c_air ≈ 4.4. This makes Doppler-based strategies less informative in water. Additionally, dolphin prey (fish) typically move at 0.5-2 m/s, producing Doppler shifts of only 67-267 Hz at 100 kHz — within the noise floor of the broadband click echo.

Instead, dolphins extract velocity information from the time-domain: by measuring how the range (echo delay) changes across successive clicks in a click train, the dolphin can compute the rate of change of range (closing speed). This is equivalent to differentiating the range-time curve:

```
v_radial = dr/dt ≈ (r_n - r_{n-1}) / ICI
```

where r_n and r_{n-1} are successive range measurements and ICI is the inter-click interval. This is a time-domain Doppler measurement — mathematically equivalent to frequency-domain Doppler but implemented through range differencing.

### 7.2 Orca Echolocation and Doppler

Southern Resident orcas hunting Chinook salmon in the Salish Sea face Doppler shifts that are small but potentially detectable:

```
Chinook swimming at 1 m/s (typical sustained speed), orca click at 50 kHz:
  delta_f = 2 * 50000 * 1 / 1500 = 67 Hz

Chinook burst at 3 m/s (escape response), orca click at 50 kHz:
  delta_f = 2 * 50000 * 3 / 1500 = 200 Hz
```

Whether orcas can detect these small shifts is unknown. The biologging data from NOAA NWFSC [P9] does not directly address Doppler sensitivity, but the click train analysis (ICI variation during pursuit) is consistent with time-domain velocity estimation.

### 7.3 Medical Doppler Ultrasound — Same Physics, Same Medium

Medical Doppler ultrasound operates in soft tissue (c ≈ 1540 m/s) — nearly identical to seawater acoustics. The Doppler equation for blood flow velocity measurement:

```
v_blood = delta_f * c / (2 * f_0 * cos(theta))
```

where theta is the angle between the ultrasound beam and the blood flow direction. This is the same equation a dolphin's auditory system would need to solve — identical medium, similar frequencies (medical: 2-10 MHz; dolphin: 10-150 kHz), and the same physics.

---

## 8. Engineering Doppler Systems

### 8.1 Radar Speed Measurement

Police radar operates at microwave frequencies (typically 10-35 GHz) and uses the Doppler effect to measure vehicle speed. The electromagnetic Doppler equation:

```
f_echo = f_0 * (1 + 2*v/c_em)    (for v << c_em)
```

where c_em = 3 * 10^8 m/s. Because c_em is enormous, the Doppler shift is tiny in absolute terms but measurable with coherent radar:

```
K-band radar (24.15 GHz) measuring car at 30 m/s (108 km/h):
  delta_f = 2 * 24.15e9 * 30 / 3e8 = 4,830 Hz
```

A 4.8 kHz audio-frequency shift from a 24 GHz carrier — the radar mixes the echo with the transmitted signal to produce an audio beat frequency proportional to target speed. This is heterodyne detection, directly analogous to the bat auditory fovea's role in processing near-f_ref echoes.

### 8.2 Doppler Weather Radar

Weather radar (e.g., NEXRAD WSR-88D) uses Doppler to measure precipitation velocity:

```
v_rain = delta_f * lambda / 2
```

where lambda is the radar wavelength (~10 cm for S-band). Wind velocities of 1-50 m/s produce measurable Doppler shifts. The dual-polarization mode also measures the shape of precipitation particles — analogous to how CF bats use Doppler modulations to characterize wing shape of insects.

### 8.3 Doppler Sonar (ADCP)

Acoustic Doppler Current Profilers (ADCPs), deployed in Puget Sound and throughout the Salish Sea, measure water current velocity at multiple depths using the same Doppler equation applied to sound scattered from suspended particles and plankton:

```
v_current = delta_f * c_water / (2 * f_ADCP * cos(theta))
```

Typical ADCP frequencies range from 75 kHz to 1200 kHz — overlapping directly with the echolocation band of dolphins and orcas. The same Doppler physics that a bat uses to detect insect wing flutter is used by oceanographers to map tidal currents in the Salish Sea.

### 8.4 The Superheterodyne Parallel

Engineering receivers use superheterodyne architecture to convert incoming signals to a fixed intermediate frequency (IF) where the best filtering hardware resides. The bat's DSC system is a biological superheterodyne:

| Component | Engineering Receiver | Bat DSC System |
|-----------|---------------------|----------------|
| Incoming signal | Radio frequency echo | Doppler-shifted echo |
| Local oscillator | Crystal oscillator (stable) | Laryngeal frequency control (adjusted) |
| Mixer | Electronic mixer | Doppler physics (outgoing + incoming) |
| IF stage | Fixed-frequency filter chain | Auditory fovea at f_ref |
| Output | Demodulated signal | Prey velocity information |

The key difference: in engineering, the local oscillator is held constant and the IF filter bandwidth handles the signal variation. In the bat, the "local oscillator" (emission frequency) is actively adjusted so that the "IF" (echo frequency) stays constant. Both achieve the same result — presenting the signal to the most sensitive analysis hardware in the optimal frequency band.

---

## 9. Wing Flutter Detection — Biological Micro-Doppler

### 9.1 The Concept

When a bat's echolocation signal reflects off an insect, the echo is modulated by the insect's wing motion. The wings beat at frequencies of 20-1000 Hz depending on species and size, and each wing stroke produces a periodic Doppler modulation on the echo:

```
f_echo(t) = f_ref + delta_f_body + delta_f_wing(t)
```

where delta_f_body is the Doppler shift from the insect's body velocity (bulk translation) and delta_f_wing(t) is the time-varying Doppler modulation from wing beating.

### 9.2 Wing Flutter as Target Identification

The wing flutter pattern encodes information about the insect:

| Insect Feature | Acoustic Signature | Detection Method |
|---------------|-------------------|-----------------|
| Wing beat frequency | Modulation rate of Doppler shift | Temporal analysis of echo amplitude/frequency |
| Wing size | Depth of Doppler modulation (larger wings = faster tip speed = larger shift) | Peak frequency deviation |
| Wing number (2 vs. 4) | Modulation waveform shape | Spectral harmonic pattern |
| Body size | Mean echo amplitude (target strength) | Echo level measurement |

Research by Kagawa et al. (PMC, 2024) demonstrates that bats can detect and classify prey based on Doppler signatures, with Doppler detection triggering specific escape or approach behaviors [P7].

### 9.3 The Micro-Doppler Framework

In engineering radar, the modulation of a Doppler signal by moving parts of a target (rotating helicopter blades, walking human gait) is called "micro-Doppler." The mathematical framework is:

```
Micro-Doppler signature:
  f_uD(t) = (2 * v_component(t) / lambda)

For insect wing tip (sinusoidal motion):
  v_tip(t) = 2*pi * f_wing * A_wing * cos(2*pi * f_wing * t)

  f_uD(t) = (4*pi * f_0 * f_wing * A_wing / c) * cos(2*pi * f_wing * t)
```

where f_wing is the wing beat frequency, A_wing is the wing amplitude (half the arc length), and the factor of 4*pi arises from the double Doppler and the circular motion.

For a moth with f_wing = 40 Hz, A_wing = 2 cm, detected by a bat at f_0 = 83 kHz in air:

```
Peak micro-Doppler:
  f_uD_max = 4*pi * 83000 * 40 * 0.02 / 343
  f_uD_max = 4*pi * 66,400 / 343
  f_uD_max ≈ 2,432 Hz
```

A peak micro-Doppler of ~2.4 kHz — easily detectable by the auditory fovea, which has frequency resolution on the order of tens of Hz. The wing flutter creates a characteristic frequency modulation pattern on the echo that uniquely identifies the insect type.

### 9.4 CF Bat Advantage for Wing Flutter Detection

CF bats have a fundamental advantage for wing flutter detection: the long, constant-frequency component provides a stable carrier against which wing-induced modulations are clearly visible. The FM bat's broadband echo, by contrast, already spans a wide frequency range — wing flutter modulations are obscured by the signal's inherent bandwidth.

This is analogous to AM vs. FM radio reception: amplitude modulations (like wing flutter) are most easily detected on a narrowband carrier (CF), just as AM radio uses a single carrier frequency. Wideband FM signals are inherently resistant to amplitude modulations — which is why FM radio rejects static but also why FM bat echoes are insensitive to wing flutter.

---

## 10. The Auditory Fovea Connection

### 10.1 The Auditory Fovea — A Frequency-Domain Magnifying Glass

The auditory fovea is a specialized region of the cochlea in CF bats where a disproportionately large number of hair cells are tuned to frequencies at and near f_ref. This is the hardware that makes DSC and wing flutter detection possible.

Detailed coverage of the auditory fovea is in [Phase Separation, Comb Filtering, and Binaural Localization](04-phase-comb-filter.md), but the connection to Doppler physics is essential:

```
DSC ensures echo arrives at f_ref
    |
    v
Auditory fovea provides maximum resolution at f_ref
    |
    v
Wing flutter modulations around f_ref are resolved with extreme precision
    |
    v
Prey identification from micro-Doppler signature
```

Without DSC, the echo frequency would vary with flight speed, sometimes falling outside the fovea's narrow tuning range. With DSC, the echo is always within the fovea's band — guaranteeing maximum sensitivity for the biologically critical information (prey flutter).

### 10.2 The DSC + Fovea + Silent Band Integration

The 2025 bioRxiv finding [P6] reveals that DSC, the auditory fovea, and the silent frequency band form an integrated system:

1. **DSC** pins background echoes at f_ref
2. **The auditory fovea** provides maximum resolution at f_ref
3. **Prey echoes** are offset from f_ref by the prey's velocity Doppler
4. **The silent band** separates background from prey in the frequency domain
5. **The fovea's high resolution** enables precise measurement of the prey-background frequency gap
6. **Wing flutter** further modulates the prey echo, enabling classification

This is a complete signal-processing pipeline: clutter rejection + target detection + target classification, all achieved through the interaction of a behavioral adaptation (DSC), an anatomical specialization (auditory fovea), and fundamental physics (Doppler effect).

---

## 11. PNW Cross-Reference

### 11.1 PNW FM Bats — Eptesicus fuscus and Myotis lucifugus

The Pacific Northwest hosts numerous bat species, with the Big Brown Bat (*Eptesicus fuscus*) and Little Brown Bat (*Myotis lucifugus*) being among the most common and best-studied:

| Parameter | E. fuscus (Big Brown Bat) | M. lucifugus (Little Brown Bat) |
|-----------|---------------------------|--------------------------------|
| Call type | FM sweep | FM sweep |
| Frequency range | 25-50 kHz | 40-80 kHz |
| Call duration | 2-10 ms | 1-5 ms |
| Habitat | Forest edges, urban areas, PNW lowlands | Forests, near water, PNW riparian zones |
| Prey | Beetles, moths, flying insects | Mosquitoes, midges, small insects |
| Doppler strategy | FM broadband — tolerates Doppler shifts | FM broadband — tolerates Doppler shifts |
| Ranging method | Echo delay (time-domain) | Echo delay (time-domain) |
| Conservation status | Least concern (but White-Nose Syndrome threat) | Endangered (Canada), impacted by WNS |

These species do NOT use DSC. Their broadly tuned cochlea absorbs Doppler shifts without compensation — they sacrifice Doppler sensitivity for broadband range resolution. In the cluttered old-growth forests of the PNW (Cascade Range, Olympic Peninsula), this trade-off favors range information over velocity information: knowing exactly where a tree branch is matters more than knowing how fast it's approaching.

### 11.2 CF Bats — Not Native to PNW

Horseshoe bats (Rhinolophidae) and Old World leaf-nosed bats (Hipposideridae), the primary CF/DSC species, are native to the Old World (Europe, Africa, Asia, Australia). They do not occur naturally in the Pacific Northwest. However, the *physics* of their echolocation is directly comparable to PNW species, and the contrast between CF and FM strategies illuminates fundamental acoustic principles that apply to all echolocating animals.

### 11.3 Marine Doppler — Salish Sea Context

Doppler physics is active in the Salish Sea marine environment:

| System | Frequency | Doppler Application | PNW Relevance |
|--------|-----------|--------------------|----|
| ADCP current profilers | 75-1200 kHz | Tidal current velocity mapping | Puget Sound circulation studies [G3] |
| Fish-finding echosounders | 50-200 kHz | Target detection (not Doppler) | Overlaps orca echolocation band [G1] |
| Orca echolocation | 10-100 kHz | Prey detection + possible velocity sensing | SRKW Chinook hunting [G1, P9] |
| Vessel echosounders | 12-200 kHz | Bathymetry (not Doppler) | Noise source for SRKW [G1] |

The frequency overlap between engineering sonar systems and orca echolocation is not coincidental — both are operating in the frequency range that optimizes the absorption-vs-resolution trade-off for their target detection needs in this medium. The physics constrains the design space identically.

### 11.4 Conservation Implications

Doppler-capable sonar systems deployed in orca habitat have conservation implications beyond simple noise:

- **Echosounder interference**: Active sonar signals in the 10-100 kHz band produce echoes from the same targets (fish, bottom) that orca echolocation is trying to detect. These engineering echoes can mask the orca's own echo returns — a form of active interference that goes beyond ambient noise elevation [G1].
- **Doppler disruption**: ADCP systems that produce continuous-wave signals create persistent Doppler-shifted returns in the water column. Whether these interfere with any Doppler-sensitive processing by orcas is unknown but physically possible.

---

## 12. Interrelationships

| Related Document | Connection |
|-----------------|------------|
| [Sonar and Echo-Delay Ranging](01-sonar-echo-delay.md) | Range from echo delay is complementary to velocity from Doppler; both are extracted from the same echo |
| [Refraction, Reflection, and Compression Waves](03-refraction-reflection-compression.md) | Doppler shift depends on sound speed c, which varies with temperature and medium — refraction physics governs c |
| [Phase Separation, Comb Filtering, and Binaural Localization](04-phase-comb-filter.md) | Auditory fovea is the hardware that makes DSC functional; comb filter patterns arise from periodic Doppler modulations |
| [Signal Processing and Engineering Analogues](05-signal-processing-analogues.md) | DSC is biological frequency-locked loop; superheterodyne receiver analogy; matched filtering for Doppler extraction |

---

## 13. Sources

### Peer-Reviewed Research

| ID | Citation | Relevance |
|----|----------|-----------|
| P2 | Au, W.W.L. and Simmons, J.A. (2007). Echolocation in dolphins and bats. Physics Today. | CF vs. FM strategy comparison, dolphin Doppler limitations, fundamental physics |
| P6 | Knauer, A. et al. (2025). Bats create a silent frequency band via DSC. bioRxiv. | Silent frequency band discovery, DSC clutter rejection function |
| P7 | Kagawa, T. et al. (2024). Doppler detection triggers escape in scanning bats. PMC. | Doppler-triggered behavior, wing flutter detection |
| P9 | Holt, M. / Tennessen, J. — NOAA NWFSC. Biologging tag studies on Southern Resident orcas. | Orca click train dynamics, time-domain velocity estimation |

### Government and Agency

| ID | Source | Relevance |
|----|--------|-----------|
| G1 | NOAA Northwest Fisheries Science Center | Orca echolocation parameters, echosounder frequency overlap |
| G3 | Puget Sound Institute / Encyclopedia of Puget Sound | ADCP deployments, Salish Sea circulation |

### Professional Organizations

| ID | Source | Relevance |
|----|--------|-----------|
| O2 | Orca Behavior Institute | Salish Sea acoustic monitoring context |

---

*The physics does not change. A bat adjusting its call frequency to hold its echo at f_ref is performing the same operation as an engineer tuning a superheterodyne receiver's local oscillator. A dolphin computing velocity from successive range measurements is performing numerical differentiation — the discrete-time equivalent of the continuous Doppler equation. The Doppler effect is one equation. Everything else is implementation.*
