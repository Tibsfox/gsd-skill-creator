# Headphone Technology & Personal Audio

> **Domain:** Electroacoustic Engineering
> **Module:** 5 -- Personal Listening Systems and Miniature Transducers
> **Through-line:** *The headphone collapses the entire signal chain into a space smaller than your fist. The room vanishes -- replaced by an acoustic chamber sealed against your ear, or open to the air, depending on the designer's choice. The amplifier shrinks from rack-mount to pocket-sized. The speaker driver, instead of pushing a 200mm cone against the resistance of a room, drives a 50mm diaphragm against the compliance of a few cubic centimeters of trapped air. The physics is the same. The constraints are completely different. And the intimate coupling between driver and ear canal creates both extraordinary opportunities (controlled acoustic environment, eliminated room interaction) and unique challenges (HRTF simulation, comfort, isolation, and the fundamental question of what "natural" means when there is no room).*

---

## Table of Contents

1. [Headphone Acoustic Fundamentals](#1-headphone-acoustic-fundamentals)
2. [Dynamic Driver Technology](#2-dynamic-driver-technology)
3. [Planar Magnetic Headphones](#3-planar-magnetic-headphones)
4. [Electrostatic Headphones](#4-electrostatic-headphones)
5. [Balanced Armature and IEM Design](#5-balanced-armature-and-iem-design)
6. [Open-Back vs Closed-Back Design](#6-open-back-vs-closed-back-design)
7. [Headphone Amplifier Design](#7-headphone-amplifier-design)
8. [HRTF and Binaural Audio](#8-hrtf-and-binaural-audio)
9. [Measurement Standards and Target Curves](#9-measurement-standards-and-target-curves)
10. [Wireless and DSP-Enhanced Headphones](#10-wireless-and-dsp-enhanced-headphones)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Headphone Acoustic Fundamentals

### The Ear-Coupler System

A headphone driver does not radiate into free space -- it radiates into a small, enclosed (or semi-enclosed) volume bounded by the driver diaphragm on one side and the listener's ear on the other. This coupled acoustic system behaves fundamentally differently from a loudspeaker in a room. The acoustic impedance seen by the driver is dominated by the compliance of the trapped air volume and the acoustic impedance of the ear canal, not by the radiation impedance of free air [1].

```
HEADPHONE ACOUSTIC MODEL
================================================================

  Over-Ear (Circumaural):
    Driver --> [Air volume ~80-120 cm^3] --> Pinna --> Ear canal
                                         --> Leakage path (pad seal)

  On-Ear (Supra-aural):
    Driver --> [Air volume ~20-40 cm^3] --> Pinna --> Ear canal
                                         --> Leakage path (larger)

  In-Ear (IEM):
    Driver --> [Air volume ~1-3 cm^3] --> Ear canal --> Eardrum
              (direct coupling, minimal leakage)

  Coupling volume determines:
    - Low-frequency extension (larger = deeper bass)
    - Sensitivity to seal quality (smaller = more sensitive)
    - Resonant frequency of the acoustic chamber
```

### The Seal Problem

The low-frequency response of a headphone is determined almost entirely by the acoustic seal between the earpad (or ear tip) and the listener's head. A perfect seal creates a closed acoustic system where the driver can pressurize the trapped volume at any frequency, producing flat bass response down to the driver's resonant frequency. Any leak creates a high-pass filter whose cutoff frequency depends on the leak's acoustic impedance [2].

This is why over-ear headphones with thick, compliant earpads produce deeper bass than on-ear designs -- the circumaural seal is more complete. It is also why eyeglass frames, which break the earpad seal, reduce bass response by 5-15 dB below 100 Hz.

> **SAFETY WARNING:** Headphones and IEMs can produce sound pressure levels exceeding 130 dB SPL at the eardrum. The WHO recommends a maximum of 85 dB for 8 hours of daily exposure. Many portable devices can drive sensitive IEMs to 110+ dB, which causes hearing damage after 1.5 minutes of continuous exposure. Volume limiting software or hardware is strongly recommended for hearing conservation [3].

---

## 2. Dynamic Driver Technology

### Miniature Moving-Coil Drivers

The vast majority of headphones use miniature moving-coil (dynamic) drivers, typically 30-50mm in diameter for over-ear designs and 6-15mm for earbuds and IEMs. The physics is identical to a full-size loudspeaker driver: a voice coil in a magnetic gap drives a diaphragm, producing sound [4].

Key design differences from loudspeaker drivers:
- **Diaphragm materials:** Mylar, PET, beryllium, bio-cellulose, liquid crystal polymer (LCP), graphene-coated PET. Lighter, stiffer materials push the first breakup mode above 10 kHz
- **Magnetic circuits:** Neodymium magnets dominate due to their high energy product (enabling compact motor assemblies)
- **Voice coil diameter:** 25-40mm for over-ear, 5-10mm for IEM
- **Impedance:** 16-600 ohms (IEMs typically 16-32 ohms, audiophile headphones 150-600 ohms)

### Impedance and Sensitivity

Headphone sensitivity is specified as dB SPL per milliwatt (dB/mW) or dB SPL per volt (dB/V). The distinction matters because the amplifier topology determines which specification is relevant:

```
HEADPHONE SENSITIVITY SPECIFICATIONS
================================================================

  Sensitivity (dB/mW): Relevant for current-limited sources
    Typical range: 90-115 dB/mW
    Higher impedance headphones are less sensitive per mW

  Sensitivity (dB/V): Relevant for voltage-source amplifiers
    Typical range: 90-130 dB/V
    Higher impedance headphones are less sensitive per V

  Conversion:
    dB/V = dB/mW + 10*log10(1000/Z)

  Example: 300-ohm headphone at 103 dB/mW
    dB/V = 103 + 10*log10(1000/300) = 103 + 5.2 = 108.2 dB/V

  Example: 32-ohm IEM at 110 dB/mW
    dB/V = 110 + 10*log10(1000/32) = 110 + 14.9 = 124.9 dB/V
```

---

## 3. Planar Magnetic Headphones

### Full-Size Planar Magnetic

Planar magnetic headphones use the same operating principle as full-size planar magnetic speakers: a thin diaphragm with a conductive trace suspended in a magnetic field from an array of bar magnets. The force is distributed across the entire diaphragm, eliminating the concentrated stress and breakup modes of dynamic drivers [5].

Modern planar magnetic headphones (Audeze LCD series, HiFiMAN Susvara, Dan Clark Audio Stealth) achieve:
- THD below 0.1% across the audible band
- Extended frequency response to 50+ kHz
- Extremely fast transient response (low moving mass per unit area)
- Flat impedance curve (no resonant peak)

The tradeoffs are: higher weight (300-600g vs 200-300g for dynamic), lower sensitivity (typically requiring a dedicated headphone amplifier), and higher cost.

### Driver Geometry

The planar magnetic driver's frequency response and distortion are strongly influenced by the magnet array geometry and the diaphragm trace pattern. Single-sided magnet arrays (magnets on one side only) are lighter and more open-sounding but produce asymmetric force distribution. Double-sided arrays (Fazor technology in Audeze designs) provide symmetric drive but increase weight and acoustic opacity [6].

```
PLANAR MAGNETIC DRIVER -- CROSS SECTION
================================================================

  Single-sided:
    [Magnet array N-S-N-S-N] |||||||
              Air gap
    [Diaphragm with trace]   -------
              Open air (no rear magnets)

  Double-sided (symmetric drive):
    [Magnet array N-S-N-S-N] |||||||
              Air gap
    [Diaphragm with trace]   -------
              Air gap
    [Magnet array S-N-S-N-S] |||||||

  The trace pattern determines the force distribution:
    - Spiral trace: radial force, good for circular drivers
    - Serpentine trace: parallel force, good for rectangular
    - Fibonacci trace: optimized uniformity (Audeze patent)
```

---

## 4. Electrostatic Headphones

### The Stax Legacy

Stax (Japan, founded 1938) pioneered the electrostatic headphone in 1960 with the SR-1, the world's first electrostatic headphone. The operating principle is identical to electrostatic loudspeakers: a thin diaphragm charged with a DC bias voltage is driven by audio-modulated stator electrodes [7].

Electrostatic headphones require a dedicated energizer (amplifier with high-voltage bias supply). The Stax standard uses a 580V DC bias (Pro Bias) or 230V (Normal Bias). The audio signal is stepped up to several hundred volts peak-to-peak by the energizer's output transformer.

### Performance Characteristics

Electrostatic headphones achieve the lowest distortion of any headphone technology:
- THD typically below 0.01% at 100 dB SPL
- Diaphragm mass as low as 1-2 milligrams per cm^2
- Impulse response settling time under 10 microseconds
- Frequency response extending to 40+ kHz

The diaphragm's extreme thinness (typically 1-2 micrometers for Stax designs) and negligible mass produce transient response that approaches the theoretical ideal. The audible result is often described as "transparent" -- the sensation that there is no transducer between the recording and the ear [8].

### Limitations

- Dedicated amplification required (not compatible with standard headphone outputs)
- Limited maximum SPL (approximately 110 dB before nonlinearity)
- Humidity sensitivity (moisture on the diaphragm causes arcing at the bias voltage)
- High cost (Stax SR-009S: ~$4,000; energizer: ~$2,000-5,000)
- Open-back design only (no isolation)

---

## 5. Balanced Armature and IEM Design

### Balanced Armature Operating Principle

The balanced armature (BA) driver uses a magnetic armature (a small reed) balanced between two magnets. The audio signal flows through a coil wrapped around the armature, causing it to pivot. This pivoting motion drives a diaphragm through a mechanical linkage (drive pin). The armature is "balanced" at rest -- no net force acts on it -- making the driver efficient and sensitive [9].

```
BALANCED ARMATURE DRIVER -- SIMPLIFIED
================================================================

  [Permanent magnet poles]
        N    S
        |    |
  ======[Armature]======  <-- pivots on flexure
        |
    [Drive pin]
        |
    [Diaphragm]
        |
    [Sound port] --> Ear canal

  Signal coil around armature creates alternating field
  Armature pivots between magnet poles
  Drive pin converts pivot to diaphragm displacement
  Very small: 1-5mm width, ideal for IEM
```

### Multi-Driver IEM Architectures

Because individual BA drivers have limited bandwidth (typically 2-3 octaves of useful response), high-fidelity IEMs use multiple BA drivers with passive crossover networks to cover the full audible range:

| Configuration | Drivers | Typical Crossover | Example |
|--------------|---------|-------------------|---------|
| Single BA | 1 | None | Etymotic ER3 |
| Dual BA | 2 | 2-way at ~2 kHz | Shure SE425 |
| Triple BA | 3 | 3-way | Westone W30 |
| Quad BA | 4 | 3 or 4-way | 64 Audio U4 |
| 6+ BA | 6-12 | 3-4 way | Noble Kaiser 10 |
| Hybrid (DD + BA) | 2-7 | 2-3 way | Campfire Solaris |

Hybrid IEMs combine a dynamic driver for bass (exploiting its larger diaphragm displacement capability) with BA drivers for midrange and treble (exploiting their speed and detail). The crossover point is typically 200-500 Hz, where the dynamic driver hands off to the BA array [10].

### Bone Conduction

Bone conduction headphones transmit vibrations through the temporal bone directly to the cochlea, bypassing the outer and middle ear entirely. The transducer (typically a piezoelectric or electromagnetic actuator) is pressed against the mastoid bone behind the ear. The primary advantage is that the ear canal remains open, allowing simultaneous awareness of ambient sound. The primary limitation is reduced bass response and lower maximum SPL compared to air-conduction headphones [11].

---

## 6. Open-Back vs Closed-Back Design

### Open-Back Architecture

Open-back headphones use a perforated or mesh-covered enclosure behind the driver, allowing air to flow freely in and out. The acoustic consequence is that the driver radiates into a half-space (similar to a loudspeaker on a baffle), producing a more natural, spacious sound at the cost of zero isolation [12].

**Advantages:**
- More natural spatial presentation (reduced internal reflections)
- Lower distortion (driver operates into a more resistive load)
- Reduced ear fatigue (better ventilation, lower pressure buildup)
- Extended low-frequency response (no internal cavity resonances)

**Disadvantages:**
- No noise isolation (unsuitable for noisy environments)
- Sound leakage disturbs nearby listeners
- Bass response depends on seal quality, not cavity pressurization

### Closed-Back Architecture

Closed-back headphones seal the rear of the driver enclosure, creating a pressure chamber. The driver works against both the ear-side volume and the rear cavity volume. Internal reflections from the rear cup walls create standing waves and resonances that must be controlled with acoustic damping material [13].

**Advantages:**
- Passive noise isolation (10-25 dB broadband)
- No sound leakage
- Deep bass possible in smaller form factors
- Suitable for recording monitoring (prevents microphone bleed)

**Disadvantages:**
- Internal resonances color the sound
- Increased ear temperature and moisture buildup
- Can produce a "cupped" or "closed-in" spatial presentation
- Higher distortion at low frequencies (working against sealed volume)

---

## 7. Headphone Amplifier Design

### Impedance Matching

Unlike loudspeaker amplifiers (which are voltage sources with near-zero output impedance), headphone amplifier output impedance has a significant effect on frequency response because headphone impedance varies with frequency. The "1/8 rule" states that the amplifier output impedance should be less than 1/8 of the headphone's minimum impedance to keep frequency response variation below 1 dB [14].

```
OUTPUT IMPEDANCE EFFECT
================================================================

  The amplifier and headphone form a voltage divider:
    V_headphone = V_amp * Z_hp / (Z_amp + Z_hp)

  If Z_amp << Z_hp: V_headphone ≈ V_amp (voltage drive, flat)
  If Z_amp is significant relative to Z_hp:
    Frequency response follows the headphone impedance curve

  Example: 120-ohm output impedance + dynamic headphone
    At resonance (Z_hp = 200 ohm): +1.7 dB boost
    At minimum (Z_hp = 32 ohm): -5.7 dB cut
    Net variation: 7.4 dB -- clearly audible!

  The 1/8 rule: Z_amp < Z_hp_min / 8
    For 32-ohm IEM: Z_amp < 4 ohms
    For 300-ohm headphone: Z_amp < 37.5 ohms
```

### Voltage and Current Requirements

Different headphone technologies require dramatically different amplification:

| Headphone Type | Impedance | Sensitivity | Required Voltage | Required Current |
|---------------|-----------|-------------|-----------------|-----------------|
| Sensitive IEM | 16-32 ohm | 110-120 dB/mW | 0.1-0.3 V RMS | 3-10 mA |
| Dynamic (low-Z) | 32-80 ohm | 95-105 dB/mW | 0.5-2 V RMS | 10-50 mA |
| Dynamic (high-Z) | 250-600 ohm | 95-103 dB/mW | 2-8 V RMS | 5-15 mA |
| Planar magnetic | 15-100 ohm | 85-95 dB/mW | 2-10 V RMS | 50-200 mA |
| Electrostatic | 100k+ ohm | N/A (requires energizer) | 200-600 V peak | <1 mA |

Planar magnetic headphones are the most demanding to drive: they require both high voltage and high current simultaneously. A headphone amplifier capable of driving all types must deliver at least 4V RMS into 32 ohms (500mW) and 7V RMS into 300 ohms (163mW) [15].

### Topology Choices

- **Op-amp based:** Simple, low cost, excellent measured performance. The OPA1656 and AD8397 are popular audio op-amps for headphone output stages.
- **Discrete transistor:** Higher voltage swing, potentially better driving ability. Common in boutique headphone amplifiers.
- **Tube hybrid:** Tube input/voltage gain stage followed by solid-state output buffer. Combines "tube warmth" with low output impedance.
- **Class A:** Some headphone amplifiers (Burson, Violectric) operate the output stage in pure Class A, exploiting the low power requirement (typically <1W) to maintain Class A operation at all signal levels.

---

## 8. HRTF and Binaural Audio

### Head-Related Transfer Function

The HRTF describes the acoustic filtering that a sound undergoes as it travels from a point in space to the eardrum, including the effects of the head, torso, and pinnae. Each person's HRTF is unique -- determined by the size and shape of their head, torso, and external ears [16].

To render accurate spatial audio over headphones, the audio signal must be convolved with the appropriate HRTF for the desired source position. This creates the illusion that sound is originating from a specific point in space outside the head -- "externalization" -- rather than being perceived as inside the head, which is the default headphone experience.

### Binaural Recording

Binaural recording uses a dummy head (Kunstkopf) with microphones placed at the ear canal entrances. The recording naturally captures the HRTF of the dummy head and, when played back over headphones, reproduces the spatial impression of the original sound field. The Neumann KU 100 is the industry-standard binaural recording head [17].

### Individualized HRTF

Generic HRTFs (measured on a standard dummy head) provide approximate spatialization but often produce front-back confusion and poor elevation perception because they do not match the listener's individual anatomy. Research at Apple (for Spatial Audio), Sony (for 360 Reality Audio), and academic institutions aims to estimate individualized HRTFs from photographs of the listener's ears or from brief acoustic measurements [18].

```
HRTF APPLICATION -- BINAURAL RENDERING
================================================================

  Source signal: S(f)
  Left HRTF for angle (theta, phi): HL(f, theta, phi)
  Right HRTF for angle (theta, phi): HR(f, theta, phi)

  Left ear signal:  L(f) = S(f) * HL(f, theta, phi)
  Right ear signal: R(f) = S(f) * HR(f, theta, phi)

  For moving sources, HRTF must be interpolated in real time
  between measured positions (typically 72 horizontal x 14 vertical
  = ~1,000 measurement positions for a full HRTF set)
```

---

## 9. Measurement Standards and Target Curves

### IEC 60268-7

The international standard for headphone measurement (IEC 60268-7) specifies measurement using an ear simulator (artificial ear) conforming to IEC 60318-1 (occluded-ear simulator for insert headphones) or IEC 60318-4 (ear simulators for audiometric testing). The ear simulator replicates the acoustic impedance of the average human ear canal and eardrum [19].

### Measurement Rigs

The two primary headphone measurement systems in use are:

**GRAS 43AG ear simulator:** A precision laboratory instrument conforming to IEC 60318-4, providing calibrated SPL measurements at the "eardrum reference point." Used by professional review sites (Rtings, Inner Fidelity, SoundStage).

**Head Acoustics HMS II.3 (or HATS):** A full head-and-torso simulator providing binaural measurement capability, capturing the complete acoustic coupling including pinna effects.

### The Diffuse-Field and Free-Field Targets

Two historical target curves exist:

**Diffuse-field (DF) target:** The headphone should reproduce the same spectrum at the eardrum that a flat loudspeaker in a diffuse field (anechoic, infinite number of reflections) would produce. This target includes the ear canal resonance peak near 3 kHz.

**Free-field (FF) target:** The headphone should reproduce the spectrum that a flat loudspeaker directly in front of the listener (0 degrees, anechoic) would produce. Similar to DF but with a more pronounced 3 kHz peak [20].

### The Harman Target for Headphones

The Harman headphone target curve, developed by Sean Olive and colleagues through extensive preference testing, has become the de facto industry reference. It features: a bass shelf boost of approximately +4 dB below 200 Hz, flat midrange through 1 kHz, a broad presence peak of +2-3 dB centered at 3 kHz, and a gentle treble roll-off above 6 kHz. This target accounts for the bass and spatial presentation differences between headphone and speaker listening [21].

---

## 10. Wireless and DSP-Enhanced Headphones

### Bluetooth Audio Codecs

Wireless headphones use Bluetooth audio codecs to transmit compressed audio from the source device to the headphone. The codec determines the maximum audio quality:

| Codec | Bit Rate | Latency | Resolution | License |
|-------|----------|---------|-----------|---------|
| SBC | 198-345 kbps | 120-170 ms | 16-bit/48kHz | Free |
| AAC | 250 kbps | 120-180 ms | 16-bit/44.1kHz | Apple/Fraunhofer |
| aptX | 352 kbps | 60-80 ms | 16-bit/48kHz | Qualcomm |
| aptX HD | 576 kbps | 80-100 ms | 24-bit/48kHz | Qualcomm |
| LDAC | 330/660/990 kbps | 100-200 ms | 24-bit/96kHz | Sony |
| LC3plus | Up to 400 kbps | 20-30 ms | 24-bit/96kHz | Fraunhofer |

At the highest quality settings (LDAC at 990 kbps, aptX HD at 576 kbps), Bluetooth audio is perceptually transparent for the vast majority of listeners and program material. The persistent belief that "Bluetooth sounds bad" dates from early SBC implementations and does not reflect current codec performance [22].

### Active Noise Cancellation

ANC headphones use microphones (feedforward, feedback, or hybrid) to sample ambient noise and generate an anti-phase signal that cancels it at the ear. Modern ANC systems (Apple AirPods Max, Sony WH-1000XM5, Bose 700) achieve 20-30 dB of noise reduction below 500 Hz, with lesser reduction at higher frequencies [23].

```
ANC ARCHITECTURES
================================================================

  Feedforward:
    External mic --> ANC processor --> Anti-noise mixed with audio
    + Faster response (no loop delay)
    + Works for broadband noise
    - Cannot compensate for headphone acoustic variability

  Feedback:
    Internal mic (near ear) --> ANC processor --> Anti-noise
    + Self-correcting (measures what the ear actually hears)
    + Compensates for fit variability
    - Loop delay limits high-frequency cancellation

  Hybrid (most modern implementations):
    External mic + Internal mic --> ANC processor
    Best of both: feedforward speed + feedback correction
    Achieves 25-35 dB cancellation at 100-500 Hz
```

> **SAFETY WARNING:** ANC systems can fail suddenly if the microphone or processor is overloaded, potentially exposing the user to full ambient noise at levels that were previously masked. In environments with sustained noise above 85 dB (aircraft cabins, industrial settings), ANC failure represents a hearing hazard. Users should not rely on ANC as hearing protection -- use rated earplugs or earmuffs in high-noise environments [24].

### Parametric EQ and Room Simulation

Modern DSP-enabled headphones support user-adjustable parametric EQ (AutoEQ, Wavelet, manufacturer apps) that allows the user to tune the frequency response to their preference or to match a specific target curve. Some systems (Apple Spatial Audio, Dolby Atmos for Headphones) perform real-time HRTF processing with head tracking, creating a speaker-like presentation that remains fixed in space as the listener turns their head [25].

---

## 11. Cross-References

> **Related:** [Speaker Physics](01-speaker-physics-transducers.md) -- miniature transducer variants of full-size driver technologies. [Room Acoustics](04-room-acoustics-psychoacoustics.md) -- psychoacoustic principles, HRTF foundations, the Harman target. [Amplifier Topology](02-amplifier-topology.md) -- headphone amplifier requirements, output impedance considerations.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** Headphone frequency response measurement and analysis
- **SGL (Signal & Light):** DSP for ANC filter implementation; adaptive algorithms
- **LED (LED & Controllers):** Bluetooth protocol parallels; SPI driver technology
- **EMG (Electric Motors):** Balanced armature as miniature electromagnetic actuator
- **BPS (Sensor Physics):** MEMS microphones in ANC headphones
- **SNL (Sound & Noise Lab):** Noise measurement methodology; hearing conservation
- **SNY (Synthesis):** Binaural audio rendering; spatial audio DSP

---

## 12. Sources

1. Borwick, J. (ed.). *Loudspeaker and Headphone Handbook*. 3rd ed. Focal Press, 2001. Chapter 14: Headphones.
2. Bruel & Kjaer. "Headphone Testing: Couplers and Ear Simulators." Application Note, 2008.
3. WHO. "Make Listening Safe." World Health Organization, 2015.
4. Beyer Dynamic. "The Physics of Headphone Transducers." Technical Documentation, 2018.
5. Audeze. "Planar Magnetic Technology for Headphones." White Paper, 2019.
6. Griffin, L. (Audeze). "Fazor Waveguide Technology." AES Convention Presentation, 2014.
7. Stax Ltd. "Earspeaker Technology: Fifty Years of Electrostatic Headphones." Technical History, 2010.
8. Voishvillo, A. "Assessment of Nonlinearity in Transducers and Sound Systems -- From THD to Perceptual Models." AES Convention Preprint, 2006.
9. Knowles Electronics. "Balanced Armature Receiver Design Guide." Application Note, 2015.
10. 64 Audio. "Multi-Driver IEM Design and the Tubeless Architecture." Technical Documentation, 2020.
11. Walker, B.N. and Lindsay, J. "Navigation Performance with a Virtual Auditory Display: Effects of Beacon Sound, Capture Radius, and Practice." *Human Factors*, vol. 48, no. 2, 2006.
12. Sennheiser. "Open-Back vs. Closed-Back Headphone Design." Technical Notes, 2019.
13. AKG Acoustics. "Closed-Back Headphone Design Considerations." Technical Documentation, 2017.
14. NwAvGuy. "Headphone Amp Output Impedance and Damping." Technical Blog, 2011.
15. Benchmark Media. "Headphone Amplifier Requirements." Application Note AHB2, 2018.
16. Wightman, F.L. and Kistler, D.J. "Headphone Simulation of Free-Field Listening." *J. Acoust. Soc. Am.*, vol. 85, 1989.
17. Neumann/Sennheiser. "KU 100 Dummy Head Microphone." Technical Specification, 2002.
18. Guezenoc, C. and Seguier, R. "HRTF Individualization: A Survey." AES Convention Preprint 10123, 2018.
19. IEC 60268-7. "Sound System Equipment -- Part 7: Headphones and Earphones." International Electrotechnical Commission, 2010.
20. Olive, S.E. et al. "Differences in Performance and Preference of Trained versus Untrained Listeners in Loudspeaker Tests." *J. Audio Eng. Soc.*, vol. 51, no. 9, 2003.
21. Olive, S.E. et al. "A Statistical Model that Predicts Listeners' Preference Ratings of Around-the-Ear and On-Ear Headphones." AES Convention Preprint 9598, 2018.
22. Aptx.com. "Understanding Bluetooth Audio Quality." Qualcomm Technical Overview, 2020.
23. Kuo, S.M. and Morgan, D.R. "Active Noise Control: A Tutorial Review." *Proc. IEEE*, vol. 87, no. 6, 1999.
24. NIOSH. "Criteria for a Recommended Standard: Occupational Noise Exposure." Publication 98-126, 1998.
25. Apple Inc. "Spatial Audio with Dynamic Head Tracking." Technical Overview, 2021.

---

*Hi-Fidelity Audio Reproduction -- Module 5: Headphone Technology & Personal Audio. The headphone eliminates the room, shrinks the amplifier, and places the transducer millimeters from the eardrum. Everything changes; the physics remains.*
