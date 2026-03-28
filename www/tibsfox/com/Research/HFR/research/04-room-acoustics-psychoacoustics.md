# Room Acoustics & Psychoacoustics

> **Domain:** Acoustic Physics and Perception
> **Module:** 4 -- The Listening Environment and the Human Ear
> **Through-line:** *The room is the last loudspeaker -- and the most problematic one. A perfectly flat speaker in a real room produces anything but flat response at the listening position. Standing waves create peaks and nulls that can vary by 20 dB within a few inches. Reflections create comb filtering. Reverberation smears transients. And then there is the listener's own auditory system -- a nonlinear, frequency-dependent, binaural processor that does not hear what a microphone measures. Understanding room acoustics and psychoacoustics is understanding the final transformation between the electrical signal and the perceived sound. The measurement-subjectivist debate lives here, in the gap between what instruments record and what ears experience.*

---

## Table of Contents

1. [The Room as Acoustic System](#1-the-room-as-acoustic-system)
2. [Room Modes and Standing Waves](#2-room-modes-and-standing-waves)
3. [Reverberation and RT60](#3-reverberation-and-rt60)
4. [Absorption, Diffusion, and Reflection](#4-absorption-diffusion-and-reflection)
5. [Speaker-Room Interaction](#5-speaker-room-interaction)
6. [Psychoacoustic Foundations](#6-psychoacoustic-foundations)
7. [Equal-Loudness Contours](#7-equal-loudness-contours)
8. [Auditory Masking](#8-auditory-masking)
9. [Localization and Spatial Hearing](#9-localization-and-spatial-hearing)
10. [Measurement vs Subjective Listening](#10-measurement-vs-subjective-listening)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Room as Acoustic System

Every room is an acoustic processor that modifies the sound between the loudspeaker and the listener. The room adds three categories of modification: modal resonance (standing waves at low frequencies), early reflections (discrete echoes from walls, floor, and ceiling), and diffuse reverberation (the decaying tail of multiply-reflected sound). Each operates in a different frequency range and time scale, and each has distinct perceptual consequences [1].

Below the Schroeder frequency (typically 200-300 Hz in a domestic room), the room behaves as a resonant cavity with discrete modes. Above the Schroeder frequency, the modal density is high enough that statistical methods apply and the room can be treated as a diffuse sound field. The transition region between these regimes is where most room acoustic problems concentrate.

```
ROOM ACOUSTIC REGIONS
================================================================

  Frequency Region     Behavior              Treatment
  ----------------------------------------------------------------
  Below Schroeder     Discrete modes         Bass traps, room dimensions
  (< ~200 Hz)        Standing waves          Subwoofer placement
                      Sharp peaks/nulls       Modal damping

  Transition          Modal overlap           Broadband absorption
  (~200-500 Hz)       Comb filtering          Diffusion panels

  Above Schroeder     Statistical/diffuse     Absorption coefficient
  (> ~500 Hz)         RT60 reverberation      Diffusion
                      Early reflections       Reflection management

  Schroeder frequency: fs = 2000 * sqrt(RT60 / V)
  Where V = room volume (m^3), RT60 = reverberation time (s)

  Example: Room 5m x 4m x 2.5m (50 m^3), RT60 = 0.4s
  fs = 2000 * sqrt(0.4/50) = 2000 * 0.089 = 179 Hz
```

> **SAFETY WARNING:** Acoustic measurement using swept sine or impulse signals at the SPL levels required for accurate low-frequency measurement (90-100 dB) can cause hearing damage with prolonged exposure. Use hearing protection during measurement sessions and take regular breaks. The NIOSH recommended exposure limit is 85 dB for 8 hours, with halving for every 3 dB increase [2].

---

## 2. Room Modes and Standing Waves

### Modal Physics

Room modes are resonances at frequencies where the room dimensions correspond to integer multiples of half-wavelengths. At these frequencies, sound waves reflecting between parallel surfaces create standing wave patterns with fixed positions of maximum pressure (antinodes) and minimum pressure (nodes) [3].

The three types of room modes are:

```
ROOM MODE TYPES
================================================================

  Axial modes (strongest, between two parallel surfaces):
    f = (c / 2) * (n / L)
    Where c = 343 m/s, n = 1, 2, 3..., L = room dimension

  Tangential modes (between four surfaces):
    f = (c / 2) * sqrt((nx/Lx)^2 + (ny/Ly)^2)
    Approximately 3 dB weaker than axial modes

  Oblique modes (all six surfaces):
    f = (c / 2) * sqrt((nx/Lx)^2 + (ny/Ly)^2 + (nz/Lz)^2)
    Approximately 6 dB weaker than axial modes

  Example room: 5m x 4m x 2.5m
    First axial modes:
      Length (5m):  34.3 Hz, 68.6 Hz, 102.9 Hz ...
      Width (4m):   42.9 Hz, 85.8 Hz, 128.6 Hz ...
      Height (2.5m): 68.6 Hz, 137.2 Hz ...
```

### Mode Distribution and Bonello Criterion

The ideal room has modes evenly distributed across frequency, with no clustering or coincidence. The Bonello criterion states that the number of modes in each one-third-octave band should increase monotonically with frequency. Room dimension ratios that promote even mode distribution include: 1 : 1.26 : 1.59 (Bolt), 1 : 1.4 : 1.9 (IEC recommended), and 1 : 1.28 : 1.54 (Louden optimal) [4].

### Bass Traps

Room modes are controlled by absorption at the modal frequencies. A porous absorber (rockwool, fiberglass) placed in a corner -- where pressure is maximum for all axial modes simultaneously -- provides the most efficient low-frequency absorption. A 100mm-thick broadband absorber achieves absorption coefficients of 0.3-0.5 at 100 Hz. A 300mm panel absorber achieves 0.8+ at 80 Hz. Membrane (panel) absorbers tuned to specific frequencies can achieve near-unity absorption at their resonant frequency [5].

---

## 3. Reverberation and RT60

### The Sabine Equation

Wallace Clement Sabine, working at Harvard University in the 1890s, developed the first quantitative theory of room reverberation. The Sabine equation relates reverberation time to room volume and total absorption:

```
RT60 = 0.161 * V / A

Where:
  RT60 = reverberation time (seconds) -- time for sound to decay 60 dB
  V = room volume (m^3)
  A = total absorption (sabins) = SUM(alpha_i * S_i)
  alpha_i = absorption coefficient of surface i (0 to 1)
  S_i = area of surface i (m^2)
```

### The Eyring Equation

For rooms with higher absorption (RT60 < 0.5s, typical of treated listening rooms), the Eyring equation is more accurate:

```
RT60 = 0.161 * V / (-S * ln(1 - alpha_avg))

Where:
  S = total surface area (m^2)
  alpha_avg = average absorption coefficient
```

### Optimal RT60 for Listening

The optimal reverberation time for a music listening room depends on room volume and music genre. For a domestic listening room (50-80 m^3), an RT60 of 0.3-0.5 seconds provides a good balance between clarity and spaciousness. Professional control rooms target 0.2-0.3 seconds for critical monitoring. Concert halls target 1.5-2.2 seconds for orchestral music [6].

| Room Type | Volume (m^3) | Optimal RT60 (s) | Reference |
|-----------|-------------|-------------------|-----------|
| Home listening room | 40-80 | 0.3-0.5 | EBU Tech 3276 |
| Professional control room | 60-150 | 0.2-0.3 | ITU-R BS.1116 |
| Recording studio | 100-300 | 0.3-0.6 | AES recommendations |
| Chamber music hall | 3,000-8,000 | 1.3-1.7 | Beranek |
| Symphony hall | 15,000-25,000 | 1.8-2.2 | Beranek |

---

## 4. Absorption, Diffusion, and Reflection

### Absorption Mechanisms

Three primary absorption mechanisms exist in room acoustics:

**Porous absorption:** Open-cell materials (fiberglass, mineral wool, acoustic foam) absorb sound by converting kinetic energy to heat through viscous friction as air oscillates in the material's pore structure. Effective at mid and high frequencies; thickness determines low-frequency effectiveness. A material absorbs effectively down to the frequency where its thickness equals one-quarter wavelength [7].

**Membrane (panel) absorption:** A thin, flexible panel mounted over an air cavity resonates at its natural frequency, absorbing energy at and near that frequency. The resonant frequency is:

```
f_res = 60 / sqrt(m * d)

Where:
  f_res = resonant frequency (Hz)
  m = surface density of panel (kg/m^2)
  d = air gap depth (m)

Example: 6mm MDF (7.5 kg/m^2) + 50mm air gap:
  f_res = 60 / sqrt(7.5 * 0.05) = 60 / 0.612 = 98 Hz
```

**Helmholtz resonator absorption:** A cavity with a narrow neck acts as an acoustic resonator, absorbing strongly at its resonant frequency. Perforated panels are Helmholtz absorber arrays. The resonant frequency depends on the hole diameter, hole spacing, panel thickness, and cavity depth [8].

### Diffusion

Diffusion scatters reflected sound uniformly, converting specular (mirror-like) reflections into diffuse energy. Well-designed diffusion preserves the energy of the reflected sound while eliminating the discrete echoes that cause comb filtering and flutter echo.

**Schroeder diffusers** (Quadratic Residue Diffusers, QRD) use a series of wells of depths calculated from a quadratic residue sequence. Each well reflects sound at a frequency-dependent delay, scattering the wavefront across a wide angle. The QRD design frequency determines the lowest frequency of effective diffusion [9].

**Primitive Root Diffusers** extend diffusion to two dimensions, scattering sound hemispherically rather than in a single plane.

---

## 5. Speaker-Room Interaction

### Boundary Reinforcement

A loudspeaker placed near a room boundary (wall, floor, ceiling) receives a bass boost from the boundary's acoustic mirror effect. Each adjacent boundary adds approximately +3 dB at low frequencies where the boundary distance is less than one-quarter wavelength [10]:

```
BOUNDARY GAIN
================================================================

  Free space (no boundaries):         0 dB reference (4-pi radiation)
  Half-space (one boundary):         +3 dB (2-pi radiation)
  Quarter-space (two boundaries):    +6 dB (pi radiation)
  Eighth-space (three boundaries):   +9 dB (pi/2 radiation)

  This is why corner placement produces maximum bass output
  and why speakers designed for free-standing sound thin
  when placed against a wall.
```

### First Reflection Points

The most perceptually significant reflections are the "first reflections" from the nearest surfaces -- the side walls, floor, ceiling, and rear wall. These arrive within 5-30 milliseconds of the direct sound and are not perceived as separate echoes but as coloration of the direct sound (the precedence effect). Absorbing or diffusing these reflections at the "first reflection points" (determinable by the mirror-image method) is one of the most effective room treatments [11].

### Subwoofer Placement

Because room modes create a non-uniform pressure distribution, subwoofer placement dramatically affects bass response. Multiple subwoofer configurations can smooth the modal response: two subwoofers on opposite walls excite half the modes, four subwoofers at the midpoints of all four walls excite only the modes whose wavelength fits both the length and width simultaneously. The Harman International multi-subwoofer research demonstrates that four optimally placed subwoofers reduce seat-to-seat bass variation by 8-12 dB compared to a single subwoofer [12].

---

## 6. Psychoacoustic Foundations

### The Auditory System

The human auditory system is not a measurement microphone. It is a binaural, nonlinear, adaptive processor optimized by evolution for detecting predators, communicating in noise, and extracting spatial information from acoustic reflections. Its frequency response, dynamic range, temporal resolution, and spatial resolution are all frequency-dependent and context-dependent [13].

The cochlea performs a continuous wavelet transform on the incoming acoustic signal, decomposing it into approximately 3,500 frequency channels (inner hair cells along the basilar membrane). The mapping is approximately logarithmic: each octave occupies roughly equal physical distance along the basilar membrane. This is why musical pitch perception is logarithmic -- equal pitch intervals correspond to equal frequency ratios, not equal frequency differences.

### Critical Bands

The auditory system groups frequencies into "critical bands" -- frequency ranges within which the ear integrates energy as a single perceptual unit. The critical bandwidth (Bark scale, named for Heinrich Barkhausen) is approximately 100 Hz below 500 Hz and approximately 20% of center frequency above 500 Hz. There are approximately 24 critical bands spanning the audible range [14].

```
CRITICAL BANDS (BARK SCALE)
================================================================

  Bark  Center (Hz)  Lower  Upper  Width
   1      50          0      100    100
   2     150        100      200    100
   3     250        200      300    100
   4     350        300      400    100
   5     450        400      510    110
   ...
  10    1175        920     1080    160
  15    2700       2320     3150    320
  20    6400       5600     7000    700
  24   13500      12000    15500   1500
```

---

## 7. Equal-Loudness Contours

### Fletcher-Munson and ISO 226

The human ear is not equally sensitive to all frequencies. Harvey Fletcher and Wilden Munson measured this in 1933 at Bell Labs, producing the first equal-loudness contours (commonly called Fletcher-Munson curves). The current international standard (ISO 226:2003) refines these measurements [15].

Key findings:
- At low listening levels (30-40 phon), the ear is dramatically less sensitive to bass and treble, producing a "thin" sound
- At high listening levels (80-90 phon), the response is nearly flat -- bass and treble are perceived in correct proportion
- Maximum sensitivity occurs near 3-4 kHz (the resonant frequency of the ear canal), where the ear is approximately 10 dB more sensitive than at 1 kHz
- The "loudness button" on vintage receivers boosts bass and treble at low volumes to compensate for this effect

```
EQUAL-LOUDNESS CONTOURS (simplified)
================================================================

  SPL required for equal loudness at different frequencies:
  (Reference: 1 kHz at stated phon level)

  Frequency    30 phon    60 phon    80 phon    100 phon
  -------------------------------------------------------
     31 Hz      73 dB      73 dB      85 dB      103 dB
     63 Hz      56 dB      60 dB      74 dB       95 dB
    125 Hz      43 dB      49 dB      65 dB       87 dB
    250 Hz      35 dB      44 dB      61 dB       84 dB
    500 Hz      31 dB      53 dB      72 dB       92 dB
   1000 Hz      30 dB      60 dB      80 dB      100 dB
   2000 Hz      25 dB      55 dB      75 dB       97 dB
   4000 Hz      24 dB      53 dB      73 dB       95 dB
   8000 Hz      35 dB      61 dB      79 dB       99 dB
  16000 Hz      63 dB      76 dB      89 dB      108 dB
```

---

## 8. Auditory Masking

### Simultaneous Masking

A louder sound can render a quieter sound inaudible if they are within the same critical band or close frequency proximity. This is simultaneous masking -- the basis of perceptual audio coding (MP3, AAC, Ogg Vorbis). The masking threshold is asymmetric: low-frequency sounds mask higher frequencies more effectively than the reverse. A 1 kHz tone at 80 dB SPL can mask tones up to 2-3 critical bands above it [16].

### Temporal Masking

Masking also operates in time. **Pre-masking** (backward masking) occurs for approximately 5-20 milliseconds before a loud sound -- the auditory system retroactively masks sounds that immediately preceded a burst. **Post-masking** (forward masking) extends 50-200 milliseconds after a loud sound, with a gradually decreasing threshold [17].

Both pre- and post-masking are exploited by perceptual codecs to remove inaudible signal components, reducing bit rate without audible quality loss. This is also relevant to speaker design: a transient's pre-ringing (from linear-phase digital filters or speaker cone breakup) may be masked if it falls within the pre-masking window.

### Masking and Audio Quality

Masking explains why low-level distortion components may be inaudible in the presence of music. A speaker with 1% THD at full output may sound transparent because the harmonics are masked by the fundamental and its musical overtones. The same 1% distortion would be clearly audible with a pure test tone because there is no masking signal. This discrepancy between tone-burst testing and music listening is one reason amplifier and speaker measurements do not always predict subjective quality [18].

---

## 9. Localization and Spatial Hearing

### ITD and ILD

The auditory system uses two primary cues for horizontal localization:

**Interaural Time Difference (ITD):** The difference in arrival time between the two ears. For a sound source 90 degrees to one side, the ITD is approximately 690 microseconds (the head's acoustic diameter / speed of sound). ITD is the dominant localization cue below approximately 1.5 kHz, where the wavelength is larger than the head [19].

**Interaural Level Difference (ILD):** The difference in sound level between the two ears, caused by the head's acoustic shadow. ILD is the dominant cue above approximately 1.5 kHz, where the head is large relative to the wavelength and casts an effective shadow.

### Head-Related Transfer Function (HRTF)

The HRTF encodes the complete direction-dependent filtering of sound by the head, torso, and pinnae (external ears). The pinna's complex folds create direction-dependent resonances and notches -- particularly a characteristic notch that shifts in frequency with elevation angle -- that the auditory system uses to determine the source's vertical position and distinguish front from rear [20].

### Stereo Imaging

Stereo playback exploits ITD and ILD to create a phantom image between two speakers. For accurate imaging, the speakers and listener should form an equilateral triangle, with the speakers toed in to aim at the listening position. The "sweet spot" is narrow -- moving 30cm off-axis can collapse the stereo image toward the nearer speaker. Acoustic treatment of the first reflection points widens the sweet spot by reducing the early reflections that blur the localization cues [21].

---

## 10. Measurement vs Subjective Listening

### The Measurement-Subjectivist Debate

The audio industry has a decades-long schism between "objectivists" (who believe that measurably identical equipment sounds identical) and "subjectivists" (who believe that standard measurements do not capture all audible differences). The resolution, supported by researchers including Floyd Toole (Harman International), Sean Olive, and Earl Geddes, is nuanced [22]:

1. **Measurements DO predict preferences** -- extensive Harman research shows that speaker preference correlates strongly with on-axis frequency response, early reflections, and directivity index
2. **Standard measurements are incomplete** -- single-frequency THD does not capture dynamic distortion behavior; broadband noise measurements miss frequency-dependent artifacts
3. **Psychoacoustic weighting matters** -- a -3 dB dip at 8 kHz is less audible than a +3 dB peak at 3 kHz, but both register as 3 dB on a frequency response plot
4. **The listening environment dominates** -- room acoustics contribute more audible coloration than differences between competent amplifiers or DACs

### The Harman Preference Curve

Sean Olive and colleagues at Harman International have demonstrated through extensive controlled listening tests that a consistent target frequency response predicts listener preference across populations. The "Harman curve" for loudspeakers is: flat on-axis in an anechoic environment, which translates to a gently downward-sloping in-room response (due to room gain at low frequencies and absorption at high frequencies) [23].

For headphones, the Harman target is: a slight bass boost (3-6 dB below 200 Hz), flat midrange, and a presence peak (2-4 dB at 3 kHz) followed by a gradual treble roll-off. This target accounts for the difference between headphone listening (no room contribution) and speaker listening (with room contribution) [24].

### Room Correction DSP

Digital room correction systems (Dirac Live, Audyssey, REW with convolution) measure the room's acoustic response and apply an inverse filter to compensate. The correction is most effective above the Schroeder frequency, where the room response is relatively stable across small position changes. Below the Schroeder frequency, correction at one position may worsen response at adjacent positions because modal patterns are spatially variant [25].

---

## 11. Cross-References

> **Related:** [Speaker Physics](01-speaker-physics-transducers.md) -- speaker directivity, boundary loading, baffle diffraction. [Amplifier Topology](02-amplifier-topology.md) -- power requirements for room volume and SPL targets. [Headphone Technology](05-headphone-technology-personal-audio.md) -- personal listening as room-independent alternative.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** Room measurement and analysis; impulse response capture
- **SGL (Signal & Light):** DSP room correction filter implementation
- **BPS (Sensor Physics):** Microphone placement for room measurement
- **SNL (Sound & Noise Lab):** Acoustic measurement standards and methodology
- **FQC (Frequency Continuum):** Modal analysis; standing wave mathematics
- **SNY (Synthesis):** Spatial audio rendering; reverb algorithms

---

## 12. Sources

1. Everest, F.A. and Pohlmann, K.C. *Master Handbook of Acoustics*. 6th ed. McGraw-Hill, 2015.
2. NIOSH. "Criteria for a Recommended Standard: Occupational Noise Exposure." Publication 98-126, 1998.
3. Kuttruff, H. *Room Acoustics*. 6th ed. CRC Press, 2016.
4. Bolt, R.H. "Note on Normal Frequency Statistics for Rectangular Rooms." *J. Acoust. Soc. Am.*, vol. 18, no. 1, 1946.
5. Cox, T.J. and D'Antonio, P. *Acoustic Absorbers and Diffusers*. 3rd ed. CRC Press, 2016.
6. Beranek, L.L. *Concert Halls and Opera Houses: Music, Acoustics, and Architecture*. 2nd ed. Springer, 2004.
7. Allard, J.F. and Atalla, N. *Propagation of Sound in Porous Media*. 2nd ed. Wiley, 2009.
8. Helmholtz, H.von. *On the Sensations of Tone*. Dover Publications, 1954 (reprint of 1885 translation).
9. Schroeder, M.R. "Diffuse Sound Reflection by Maximum-Length Sequences." *J. Acoust. Soc. Am.*, vol. 57, no. 1, 1975.
10. Allison, R.F. "The Influence of Room Boundaries on Loudspeaker Power Output." *J. Audio Eng. Soc.*, vol. 22, no. 5, 1974.
11. Toole, F.E. *Sound Reproduction: The Acoustics and Psychoacoustics of Loudspeakers and Rooms*. 3rd ed. Focal Press, 2018.
12. Welti, T. and Devantier, A. "Low-Frequency Optimization Using Multiple Subwoofers." *J. Audio Eng. Soc.*, vol. 54, no. 5, 2006.
13. Moore, B.C.J. *An Introduction to the Psychology of Hearing*. 6th ed. Emerald Group Publishing, 2012.
14. Zwicker, E. and Fastl, H. *Psychoacoustics: Facts and Models*. 3rd ed. Springer, 2007.
15. ISO 226:2003. "Acoustics -- Normal Equal-Loudness-Level Contours." International Organization for Standardization, 2003.
16. Painter, T. and Spanias, A. "Perceptual Coding of Digital Audio." *Proc. IEEE*, vol. 88, no. 4, April 2000.
17. Oxenham, A.J. "Pitch Perception and Auditory Stream Segregation." *Current Opinion in Neurobiology*, vol. 18, no. 4, 2008.
18. Geddes, E.R. and Lee, L.W. "Auditory Perception of Nonlinear Distortion." AES Convention Preprint 5890, 2003.
19. Blauert, J. *Spatial Hearing: The Psychophysics of Human Sound Localization*. Revised ed. MIT Press, 1997.
20. Wightman, F.L. and Kistler, D.J. "Headphone Simulation of Free-Field Listening." *J. Acoust. Soc. Am.*, vol. 85, 1989.
21. Olive, S.E. and Toole, F.E. "The Detection of Reflections in Typical Rooms." *J. Audio Eng. Soc.*, vol. 37, no. 7/8, 1989.
22. Toole, F.E. "Listening Tests -- Turning Opinion into Fact." *J. Audio Eng. Soc.*, vol. 30, no. 6, 1982.
23. Olive, S.E. "A Multiple Regression Model for Predicting Loudspeaker Preference." *J. Audio Eng. Soc.*, vol. 52, no. 6, 2004.
24. Olive, S.E. et al. "A Statistical Model that Predicts Listeners' Preference Ratings of Around-the-Ear and On-Ear Headphones." AES Convention Preprint 9598, 2018.
25. Farina, A. "Advancements in Impulse Response Measurements by Sine Sweeps." AES Convention Preprint 5767, 2007.

---

*Hi-Fidelity Audio Reproduction -- Module 4: Room Acoustics & Psychoacoustics. The room is the last component in the chain, and the one component you cannot buy your way out of. Understanding it is the difference between hearing your speakers and hearing your room.*
