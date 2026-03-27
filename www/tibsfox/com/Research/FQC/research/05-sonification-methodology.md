# Sonification Methodology

> **Domain:** Data Sonification, Astrophysics, Accessibility, Perceptual Science
> **Module:** 5 -- Sonification and Perceptual Mapping
> **Through-line:** *When NASA released the sound of a black hole in May 2022, millions of people heard the universe for the first time. The sound was real -- genuine pressure waves in the plasma of the Perseus galaxy cluster, scaled upward by 57 octaves to reach human hearing. But sonification is more than pitch-shifting. It is the disciplined translation of data into sound, governed by perceptual science, accessibility principles, and the physics of what the data actually represent. Done well, it reveals structure that visualization alone cannot convey. Done poorly, it is audiovisual wallpaper. This module documents how it is done well.*

---

## Table of Contents

1. [What Sonification Is and Is Not](#1-what-sonification-is-and-is-not)
2. [NASA's Universe of Sound Program](#2-nasas-universe-of-sound-program)
3. [Parameter Mapping Sonification](#3-parameter-mapping-sonification)
4. [Audification](#4-audification)
5. [The Perseus Resynthesis](#5-the-perseus-resynthesis)
6. [Multi-Wavelength Layering](#6-multi-wavelength-layering)
7. [LIGO Gravitational Wave Chirps](#7-ligo-gravitational-wave-chirps)
8. [The SYSTEM Sounds Project](#8-the-system-sounds-project)
9. [Perceptual Design Principles](#9-perceptual-design-principles)
10. [Accessibility and Universal Design](#10-accessibility-and-universal-design)
11. [Sonification Across the Frequency Continuum](#11-sonification-across-the-frequency-continuum)
12. [Mapping Parameter Reference](#12-mapping-parameter-reference)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. What Sonification Is and Is Not

### Definition

Sonification is the systematic representation of data through sound. It is the auditory analogue of data visualization: just as a graph maps numerical values to visual properties (position, color, size), sonification maps data values to auditory properties (pitch, volume, timbre, spatial position, duration). The International Community for Auditory Display (ICAD) defines sonification as "the use of non-speech audio to convey information" [1][2].

### Three Categories

Sonification techniques are conventionally divided into three categories [1]:

```
SONIFICATION TAXONOMY
================================================
1. AUDIFICATION
   Direct translation of data to audio waveform
   Data values become sample amplitudes
   Example: LIGO gravitational wave chirps (frequencies already audible)
   Example: Seismograph data played as audio

2. PARAMETER MAPPING
   Data properties mapped to sound properties
   Position → pitch, brightness → volume, color → timbre
   Example: Hubble Ultra Deep Field (galaxy position → note pitch)
   Example: Cassiopeia A (element distribution → instrument family)

3. MODEL-BASED SONIFICATION
   Interactive: sound generated in response to user exploration
   Data defines a "sonic space" that responds to probing
   Example: Navigating a dataset by moving through a sound field
```

### What It Is Not

Sonification is not background music set to a video of space imagery. It is not arbitrary sound design inspired by astronomical themes. It is not "mood music." Each auditory parameter must correspond to a specific, documented data property, and the mapping must be reproducible. If two independent listeners cannot recover the same qualitative data features from the sonification, it is not scientific sonification -- it is art [1].

This distinction does not diminish the artistic value of space-inspired music. It clarifies that scientific sonification has a different purpose: data communication through the auditory channel [1].

---

## 2. NASA's Universe of Sound Program

### Origins and Team

NASA's "Universe of Sound" sonification program is led by the Chandra X-ray Center (CXC), part of the Smithsonian Astrophysical Observatory. The program is a collaboration between astrophysicist Kimberly Arcand (CXC visualization lead), Matt Russo (astrophysicist and musician, University of Toronto), and Andrew Santaguida (musician and sound designer). Together, Russo and Santaguida operate the SYSTEM Sounds project, which develops the sonification algorithms and sound design [2][3].

The program began producing sonifications of Chandra X-ray images around 2020 and expanded to include data from the Hubble Space Telescope, the James Webb Space Telescope, and the Spitzer Space Telescope. As of 2024, the program has produced sonifications of over 30 celestial objects [2][3].

### Goals

The Universe of Sound program has three stated objectives [2]:

1. **Public engagement:** Making astronomical data accessible to broader audiences through a different sensory channel
2. **Accessibility:** Providing access to astronomical data for blind and low-vision individuals who cannot use visual representations
3. **Scientific insight:** Exploring whether auditory representation can reveal data features not apparent in visual representations

---

## 3. Parameter Mapping Sonification

### Methodology

In parameter mapping sonification, properties of the data are assigned to properties of sound. The NASA program uses several standard mappings [2][3]:

| Data Property | Sound Property | Example |
|---|---|---|
| Horizontal position (left to right) | Time (sequence) | Scan across an image |
| Vertical position (bottom to top) | Pitch (low to high) | Y-axis of image |
| Brightness / intensity | Volume (quiet to loud) | Brighter regions louder |
| Color / wavelength | Timbre (instrument family) | X-ray = synth, optical = strings |
| Radial distance from center | Time or pitch | Spiral scan outward |
| Angular position | Stereo panning (left/right) | Circular scan |

### Hubble Ultra Deep Field

One of the program's landmark sonifications is the Hubble Ultra Deep Field (HUDF), the deepest optical image ever taken, containing approximately 10,000 galaxies across 13 billion years of cosmic history. The sonification maps [2][3]:

```
HUDF SONIFICATION MAPPING
================================================
Each galaxy plays a note:
  - Pitch:    Determined by galaxy color (redder = lower, bluer = higher)
  - Volume:   Determined by apparent size (larger = louder)
  - Timbre:   Spiral galaxies = bell-like tones
              Elliptical galaxies = sustained pads
  - Timing:   Bottom-to-top scan across the image
  - Duration: ~30 seconds for full image scan

Result: A rising chorus of notes as the scan moves upward through
        the image, with larger galaxies producing louder tones
        and galaxy color determining the pitch register.
```

### Cassiopeia A

The supernova remnant Cassiopeia A was sonified using multi-wavelength data from Chandra (X-ray), Hubble (optical), and Spitzer (infrared). The sonification scans outward from the center of the remnant, mapping [2][3]:

- **X-ray data** to synthesizer tones
- **Optical data** to string instruments
- **Infrared data** to woodwind-like sounds
- **Radial distance** to time (center = start, edge = end)
- **Intensity** to volume

The elemental composition of the supernova debris (silicon, sulfur, calcium, iron) is distributed in distinct spatial patterns, and the sonification makes these patterns audible as variations in timbre and pitch as the scan progresses outward [2][3].

---

## 4. Audification

### Direct Data-to-Audio Translation

Audification is the most physically direct sonification technique. In audification, data values are treated as audio samples: each numerical value in the dataset becomes a corresponding amplitude in the audio waveform. If the data rate matches a rate in the audible range, no frequency scaling is needed. If the data rate is too slow (sub-audible), the playback is sped up; if too fast (ultrasonic), it is slowed down [1][2].

### When Audification Works Best

Audification is most appropriate when the data represent actual physical oscillations [1]:

- **Seismic data:** Earthquake waveforms, sped up by a factor of 100-10,000, become audible rumbles and tones
- **Gravitational waves:** LIGO data already fall within the audio frequency range
- **Solar oscillations:** Helioseismic data can be sped up to make the Sun's 5-minute oscillations audible
- **Electromagnetic signals:** Whistler waves, chorus emissions, and other space plasma phenomena in the VLF range can be directly played as audio

The power of audification is that the listener is hearing a faithful frequency-scaled version of the actual physical process. The temporal structure -- onset, modulation, decay -- of the original phenomenon is preserved. This is not metaphorical sound; it is the same waveform at a different speed [1].

---

## 5. The Perseus Resynthesis

### The Premier Example

The May 2022 release of the Perseus cluster sonification represents the most discussed single sonification in the history of the field. It is a genuine audification: the data represent actual pressure waves in the intracluster medium, scaled upward to human hearing range [2][4].

### The Scaling

The Perseus pressure waves have a frequency of approximately 3.3 x 10^-15 Hz (see [M1](01-deep-space-pressure-waves.md)). To bring this into the audible range requires scaling upward by 57-58 octaves [2][4]:

```
PERSEUS FREQUENCY SCALING
================================================
Original frequency:   ~3.3 x 10^-15 Hz
Target range:         ~100-300 Hz (lower audible)

Scaling factor:       2^57 to 2^58
                    = 1.44 x 10^17 to 2.88 x 10^17
                    = 144-288 quadrillion times

Rescaled frequency:
  3.3e-15 * 2^57 = 3.3e-15 * 1.44e17 ≈ 475 Hz
  3.3e-15 * 2^58 = 3.3e-15 * 2.88e17 ≈ 950 Hz

The actual sonification uses a range of octave shifts
applied to different radial positions, creating a
multi-frequency composition rather than a single note.
```

### Extraction Method

The sound waves were extracted by measuring X-ray surface brightness fluctuations along radial directions from the center of the cluster. The amplitude of these fluctuations, as a function of distance from the center, traces the pressure wave pattern. The sonification team then [2][4]:

1. Extracted brightness profiles along multiple radial directions
2. Interpreted the radial brightness variations as a time series (distance from center maps to time)
3. Scaled the implied frequency upward by 57-58 octaves
4. Played the result as audio, sweeping anticlockwise around the cluster center

The result is an eerie, rumbling tone that modulates as the radial scan passes through different cavity structures. It was released by NASA as part of their "Black Hole Week" promotion and generated worldwide media coverage [2][4].

### What the Sound Represents

The Perseus sonification is not a recording of sound in the conventional sense. No microphone was placed 250 million light-years away. It is the visual X-ray data (patterns in photon counts detected by Chandra's CCD arrays), interpreted as pressure-wave amplitudes and translated to audio through octave scaling. The key claims are [2][4]:

- **Real pressure waves:** The X-ray ripples are genuine pressure disturbances in the ICM
- **Real frequency relationship:** The scaling preserves the frequency structure; the pitch ratios are maintained
- **Not a literal recording:** The translation involves assumptions about which spatial patterns correspond to which temporal frequencies

---

## 6. Multi-Wavelength Layering

### The Layering Technique

Many celestial objects have been observed by multiple telescopes at different electromagnetic wavelengths. The Universe of Sound program creates multi-wavelength sonifications by assigning different instrument families or audio characteristics to data from each telescope [2][3]:

```
MULTI-WAVELENGTH LAYERING
================================================
Telescope/Instrument     Wavelength Range     Audio Assignment
---------------------------------------------------------------
Chandra X-ray            0.1-10 keV           Synthesizer, high register
Hubble Optical           400-700 nm           Strings, mid register
Webb Infrared            0.6-28 micron        Bass tones, warm pads
Spitzer Infrared         3.6-160 micron       Woodwinds, low register
VLA Radio                cm-m wavelengths     Deep bass, percussion

Objects sonified with multi-wavelength layering:
  - Cassiopeia A (Chandra + Hubble + Spitzer)
  - Pillars of Creation (Hubble + Webb)
  - Crab Nebula (Chandra + Hubble + Spitzer)
  - Galactic Center (Chandra + Hubble + Spitzer)
  - Stephan's Quintet (Webb + Chandra)
```

The layering technique exploits the human auditory system's ability to segregate simultaneous sound streams by timbre. Just as a listener can follow a violin line within a full orchestra, the distinct timbres assigned to each wavelength allow listeners to attend selectively to the X-ray, optical, or infrared "voice" of a celestial object [2][3].

---

## 7. LIGO Gravitational Wave Chirps

### Natural Audification

LIGO's gravitational wave detections represent a unique case in sonification: the data naturally fall within the human audible frequency range without any rescaling. The spacetime strain measured by LIGO (oscillations at frequencies from approximately 5 Hz to 5,000 Hz) can be converted directly to audio by treating the strain time series as a waveform [5][6].

### The Chirp

The characteristic signal from a compact binary merger (black hole or neutron star) is a "chirp" -- a tone that increases in both frequency and amplitude as the two objects spiral inward. The mathematical form is well-described by general relativity [5][6]:

```
CHIRP CHARACTERISTICS
================================================
Binary Black Hole (GW150914):
  Start frequency:    ~35 Hz (bass register)
  End frequency:      ~250 Hz (tenor register)
  Duration in band:   ~0.2 seconds
  Character:          Rapid upward sweep, abrupt end at merger

Binary Neutron Star (GW170817):
  Start frequency:    ~30 Hz (in LIGO band)
  End frequency:      ~1000+ Hz (soprano register)
  Duration in band:   ~100 seconds
  Character:          Gradual upward sweep, extended duration

The chirp mass determines the rate of frequency increase:
  M_chirp = (m1 * m2)^(3/5) / (m1 + m2)^(1/5)

Higher chirp mass → faster frequency evolution → shorter chirp
Lower chirp mass → slower frequency evolution → longer chirp
```

### Audio Quality

The raw LIGO chirp audio requires processing to be clearly audible: the strain amplitude is approximately 10^-21 (one-thousandth the diameter of a proton over LIGO's 4 km arm length), far below any direct acoustic level. The data are amplified and sometimes bandpass-filtered to remove instrument noise below 30 Hz and above 300 Hz. The resulting audio is unmistakably a rising tone -- the "sound" of two massive objects merging [5][6].

### Detection Events

As of 2024, LIGO, Virgo, and KAGRA have detected approximately 90 gravitational wave events across three observing runs. The vast majority are binary black hole mergers. Notable events include [5][6]:

| Event | Date | Source | Frequency Range | Duration |
|---|---|---|---|---|
| GW150914 | 2015-09-14 | BBH (~36+29 Msun) | 35-250 Hz | 0.2 s |
| GW151226 | 2015-12-26 | BBH (~14+8 Msun) | 35-450 Hz | 1 s |
| GW170817 | 2017-08-17 | BNS (~1.4+1.4 Msun) | 30-1000+ Hz | 100 s |
| GW190521 | 2019-05-21 | BBH (~85+66 Msun) | 30-60 Hz | 0.1 s |

GW190521 is notable as the most massive binary detected: the 150-solar-mass remnant produced a chirp so rapid that it lasted only a fraction of a second and barely swept through the LIGO band -- a deep bass "thump" rather than a rising whistle [5][6].

---

## 8. The SYSTEM Sounds Project

### Mission and Method

The SYSTEM Sounds project (system-sounds.com), led by Matt Russo and Andrew Santaguida, is the primary creative team behind NASA's astronomical sonifications. The project's methodology balances scientific rigor with perceptual effectiveness [3]:

```
SYSTEM Sounds Design Process:
================================================
1. DATA SELECTION
   Identify which data properties carry scientific content
   Determine which features should be audible
   Establish priority hierarchy of data channels

2. MAPPING DESIGN
   Assign data properties to perceptual dimensions
   Pitch, volume, timbre, spatial position, duration
   Ensure mappings are intuitive (brighter = louder, etc.)

3. INSTRUMENT SELECTION
   Choose sounds that match the data character
   Smooth data → sustained tones
   Point-source data → plucked or struck tones
   Different wavelengths → different instrument families

4. PERCEPTUAL TESTING
   Test with sighted, blind, and low-vision listeners
   Verify that intended data features are recoverable
   Iterate based on listener feedback

5. PUBLICATION
   Release with detailed methodology documentation
   Include data source credits and mapping description
   Provide both audio and audio-visual versions
```

### Beyond NASA

The SYSTEM Sounds methodology has been applied to non-astrophysical data as well, including climate data, COVID-19 statistics, and geological datasets. The team's approach treats sonification as a general data communication tool, not solely an astrophysical technique [3].

---

## 9. Perceptual Design Principles

### Why Sonification Works

The human auditory system excels at detecting several data features that visual displays handle poorly [1][7]:

- **Temporal patterns:** The ear resolves temporal changes at millisecond scales (10-100x faster than vision for trend detection)
- **Anomaly detection:** Unexpected sounds (a sour note, a click, a change in rhythm) capture attention more effectively than unexpected visual changes
- **Multiple simultaneous streams:** Trained listeners can track 3-5 simultaneous audio streams; visual attention typically handles 1-2 focal points
- **Background monitoring:** Audio can be processed without directed attention, allowing sonification to run as a background monitor while vision is engaged elsewhere

### Perceptual Constraints

Effective sonification must respect the perceptual limits of the auditory system [1][7]:

```
PERCEPTUAL DESIGN CONSTRAINTS
================================================
Pitch:
  Useful range:           ~100 Hz to ~5,000 Hz (wider is possible, less useful)
  Pitch discrimination:   ~5-10 cents (trained), ~20-30 cents (untrained)
  Maximum simultaneous:   ~3-5 separable pitch streams

Volume:
  Useful dynamic range:   ~40 dB (more causes fatigue)
  Level discrimination:   ~1-3 dB (trained)
  Caution:                Loud passages cause listener fatigue

Timbre:
  Categories:             ~5-8 reliably distinguishable timbres
  Familiarity matters:    Known instruments more separable

Duration:
  Minimum note duration:  ~50 ms (shorter = click)
  Maximum useful rate:    ~10-20 events/second
  Faster → temporal fusion (becomes continuous tone)

Spatial:
  Stereo panning:         ~15 distinguishable positions
  3D spatialization:      Elevation discrimination ~10 degrees
```

### Mapping Polarity

Sonification mappings should be "polarity-correct" -- intuitive to the listener [7]:

- **More = louder** (not quieter)
- **Higher = higher pitch** (for spatial data with a vertical axis)
- **Brighter = brighter (timbre)** or louder
- **Closer = louder** (spatial proximity maps naturally to volume)

Reversed polarity mappings (e.g., brighter = quieter) confuse listeners and reduce data recovery accuracy [7].

---

## 10. Accessibility and Universal Design

### Motivation

The Universe of Sound program follows universal design principles, making astronomical data accessible to blind and low-vision users who cannot access the primarily visual astronomical imagery that dominates public outreach [2][3][7]:

### Research Findings

A 2024 study published in Frontiers in Communication (Arcand, K. et al.) evaluated the Universe of Sound sonifications with blind and low-vision participants [7]:

```
ACCESSIBILITY RESEARCH RESULTS (2024)
================================================
Study: "A Universe of Sound: processing NASA data
        for blind and low-vision listeners"
Published: Frontiers in Communication, 2024

Key Findings:
  - Blind/low-vision participants generally rated
    LEARNING higher than sighted participants
  - Cassiopeia A showed the most significant difference
    (p = 0.02407)
  - Sonifications were developed in collaboration with
    consultant Christine Malec (blind astronomer advocate)
  - Testing included both pre- and post-listening assessments
    of astronomical content knowledge
  - Multi-wavelength sonifications were rated higher for
    both enjoyment and learning than single-wavelength versions
```

### Design Collaboration

The sonification team worked directly with Christine Malec, a blind astronomy advocate and communicator, throughout the design process. Malec's input shaped decisions including [7]:

- **Timbre selection:** Instrument sounds were chosen for maximum distinctiveness when the listener cannot see accompanying visual labels
- **Narration:** Optional audio narration describes the object before the sonification plays, providing context
- **Duration:** Sonifications were kept between 30 seconds and 2 minutes for focused listening
- **Spatial audio:** Stereo panning provides directional cues that enhance the sense of spatial structure

---

## 11. Sonification Across the Frequency Continuum

### Mapping the Continuum to Audio

The frequency continuum documented in this research series spans approximately 60 orders of magnitude. Sonification connects the inaudible extremes to human perception through various scaling approaches [1][2]:

| Source Domain | Natural Frequency | Scaling Required | Method |
|---|---|---|---|
| Perseus B-flat | ~3.3 x 10^-15 Hz | +57 octaves | Audification |
| BAO modes | ~10^-14 Hz | +55 octaves | Parameter mapping |
| Earth free oscillations | ~10^-3 Hz | +14 octaves | Audification (speedup) |
| Infrasound (0.1 Hz) | 0.1 Hz | +7 octaves | Speedup playback |
| Schumann (7.83 Hz) | 7.83 Hz | +3-4 octaves | Pitch shift |
| LIGO chirps | 35-250 Hz | None (already audible) | Direct audification |
| Microtonal intervals | 100-5000 Hz | None (already audible) | Direct |

### The Scaling Paradox

The Perseus sonification requires a scaling factor of approximately 10^17. At this scale, any imprecision in the source data is amplified by 17 orders of magnitude in the audio output. This means the sonification is physically accurate in its frequency *relationships* (the pitch ratios between different spatial positions are preserved) but not in its absolute frequency (the exact pitch heard is determined by the arbitrary choice of scaling factor) [2][4].

This is analogous to a map: the relative positions of cities are preserved (London is northeast of Paris), but the absolute distances are scaled by a factor determined by the map maker. No one confuses a map for the territory. Similarly, the Perseus sonification is a map of the pressure waves, not a recording of them [2].

---

## 12. Mapping Parameter Reference

### Standard Mappings Used in the Field

| Data Property | Auditory Property | Polarity | Notes |
|---|---|---|---|
| Brightness / intensity | Volume (amplitude) | Direct | Most intuitive mapping |
| Horizontal position | Time (left to right) | Direct | Western reading direction |
| Vertical position | Pitch (low to high) | Direct | Spatially intuitive |
| Color / wavelength | Timbre (instrument) | Variable | Requires legend |
| Distance from center | Time (or pitch) | Variable | Spiral/radial scan |
| Spectral energy | Timbre brightness | Direct | Physical correspondence |
| Temperature | Pitch (cold=low, hot=high) | Direct | Thermal metaphor |
| Density | Roughness / beating | Direct | Physical correspondence |
| Velocity | Tempo or pitch | Direct | Doppler analogy |
| Angular position | Stereo pan position | Direct | Spatial correspondence |

### Compound Mappings

Complex datasets often require compound mappings where multiple data dimensions are encoded simultaneously [1][7]:

```
COMPOUND MAPPING EXAMPLE: Galactic Center
================================================
Data source: Chandra + Hubble + Spitzer
Scan direction: Left to right across image

Layer 1 (X-ray / Chandra):
  Volume → X-ray intensity
  Pitch → vertical position
  Timbre → synthesizer

Layer 2 (Optical / Hubble):
  Volume → optical intensity
  Pitch → vertical position
  Timbre → violin family

Layer 3 (Infrared / Spitzer):
  Volume → IR intensity
  Pitch → vertical position
  Timbre → piano / bass

All layers play simultaneously, creating a composite
soundscape where each telescope's view can be isolated
by attending to the appropriate timbre.
```

---

## 13. Cross-References

- **[M1: Deep Space Pressure Waves](01-deep-space-pressure-waves.md)** -- The Perseus B-flat is the subject of the most famous astronomical sonification; M1 documents the source physics that the sonification represents
- **[M2: Sub-Hz and Infrasonic Domain](02-sub-hz-infrasonic.md)** -- Infrasonic data from volcanoes, weather systems, and microseisms require sonification (speedup) to become audible, using the same conceptual approach as the Perseus scaling
- **[M3: The Bridge Zone](03-the-bridge-zone.md)** -- LIGO gravitational wave chirps are the premier example of data that naturally falls within the audible range, requiring no frequency scaling
- **[M4: Microtonal and Macrotonal Systems](04-microtonal-macrotonal.md)** -- Sonification pitch mapping must choose a tuning system; microtonal tunings offer finer resolution for data encoding but may be unfamiliar to listeners
- **[DAA: Deep Audio Analyzer](../DAA/index.html)** -- The spectral analysis methods (PSD, spectrogram) used to analyze sonification output are the same tools used for any audio analysis
- **[ARC: Shapes and Colors](../ARC/index.html)** -- Sonification is the auditory complement to visualization; together they provide multi-sensory access to data
- **[SPA: Spatial Awareness](../SPA/index.html)** -- Spatial audio techniques (stereo panning, HRTF, ambisonics) enhance sonification by encoding spatial data properties in the listener's perceived sound field
- **[LED: LED and Controllers](../LED/index.html)** -- LED displays can visualize sonification parameters in real time, creating multi-sensory data displays

---

## 14. Sources

1. Kramer, G. et al. (2010). "Sonification Report: Status of the Field and Research Agenda." International Community for Auditory Display (ICAD). Hermann, T., Hunt, A., & Neuhoff, J.G. (Eds.) (2011). *The Sonification Handbook*. Logos Publishing House.

2. NASA Chandra X-ray Observatory. "A Universe of Sound." Chandra X-ray Center (CXC), Smithsonian Astrophysical Observatory. science.nasa.gov/universe/chandra-sonification.

3. SYSTEM Sounds (system-sounds.com). Matt Russo & Andrew Santaguida. NASA sonification collaboration. Methodology documentation and published sonification catalog.

4. NASA. "Black Hole Sonification: Perseus Cluster." Black Hole Week release, May 2022. Media release and technical documentation.

5. Abbott, B.P. et al. (2016). "Observation of Gravitational Waves from a Binary Black Hole Merger (GW150914)." *Physical Review Letters*, 116(6), 061102. LIGO Scientific Collaboration, Caltech.

6. LIGO Lab, Caltech. "Sounds of Spacetime." LIGO audio releases and chirp documentation. www.ligo.caltech.edu.

7. Arcand, K. et al. (2024). "A Universe of Sound: processing NASA data into sonifications for accessibility." *Frontiers in Communication*, 9. Collaboration with Christine Malec. Blind/low-vision listener studies.
