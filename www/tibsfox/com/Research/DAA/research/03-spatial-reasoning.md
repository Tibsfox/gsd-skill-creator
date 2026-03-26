# The Geometry of Sound

> **Domain:** Acoustic Localization & Spatial Analysis
> **Module:** 3 -- Spatial Reasoning Engine
> **Through-line:** *A stereo recording contains geometric information. Interaural level differences, time delays, coherence spectra, and reflection patterns encode the physical space. The mathematics exists. The integration into an iterative reasoning pipeline does not -- until now.*

---

## Table of Contents

1. [Spatial Information in Stereo Audio](#1-spatial-information-in-stereo-audio)
2. [GCC-PHAT: Angular Source Localization](#2-gcc-phat-angular-source-localization)
3. [Interaural Level Difference](#3-interaural-level-difference)
4. [Stereo Coherence and Diffuse Field Analysis](#4-stereo-coherence-and-diffuse-field-analysis)
5. [Reflection Detection and Room Geometry](#5-reflection-detection-and-room-geometry)
6. [Constructing the Spatial Map](#6-constructing-the-spatial-map)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. Spatial Information in Stereo Audio

A stereo recording is not just two copies of the same sound. Each microphone captures a slightly different version of the acoustic scene because they are separated in space. These differences encode geometry [1]:

- **Time differences** (ITD) -- A sound arriving from the left reaches the left microphone before the right
- **Level differences** (ILD) -- A sound closer to the left microphone is louder in the left channel
- **Coherence** -- A single localized source produces highly correlated signals; many scattered sources produce low coherence
- **Reflections** -- Sound bouncing off surfaces arrives with characteristic delays and spectral modifications

The Spatial Reasoning Engine extracts these signals to build a map of the acoustic scene: where sources are positioned, where reflecting surfaces exist, and what the geometry of the space looks like.

---

## 2. GCC-PHAT: Angular Source Localization

The Generalized Cross-Correlation with Phase Transform is the primary angular localization algorithm [1][2].

### 2.1 The Algorithm

For a stereo recording with microphone spacing *d*, the time delay between channels is estimated by:

```
tau_hat = argmax_tau IFFT( L(f) * R*(f) / |L(f) * R*(f)| )
```

The PHAT weighting (the denominator) whitens the cross-spectrum, sharpening the correlation peak and improving robustness to reverberation. The angular position is then:

```
theta = arcsin( tau_hat * c / (d * fs) )
```

where c = 343 m/s (speed of sound), d is microphone spacing, and fs is sample rate.

### 2.2 Parameters Validated on Reference Recording

| Parameter | Value | Notes |
|-----------|-------|-------|
| Window size | 50 ms | Short enough for temporal resolution |
| Hop size | 25 ms | 50% overlap |
| Search range | +/-34 samples | For assumed 17 cm microphone spacing |

### 2.3 Limitations in Dense Choruses

The reference recording showed limited angular separation via GCC-PHAT alone -- a single cluster at +2 degrees. In a dense chorus, all callers blend into a single spatial blob because their signals overlap in time. Sub-band analysis is essential: apply GCC-PHAT independently to frequency bands that isolate different callers.

---

## 3. Interaural Level Difference

ILD proved more effective than ITD for the reference recording due to source density [1]:

```
ILD(f) = 20 * log10( RMS_R(f) / RMS_L(f) )  dB
```

### 3.1 Sub-Band ILD Mapping

By computing ILD per frequency sub-band, sources at different frequencies can be separated spatially even when they overlap in time. The reference recording revealed five distinct caller groups through combined frequency + ILD analysis:

| Group | Frequency Band | ILD | Interpretation |
|-------|---------------|-----|----------------|
| F1 | 2050-2250 Hz | -2.0 dB | LEFT, ~1m from microphone |
| F2 | 1800-2050 Hz | +0.2 dB | CENTER, directly ahead |
| F3 | 2050-2250 Hz | -4.0 dB | FAR LEFT, ~2-3m |
| F4 | 2250-2500 Hz | -2.4 dB | LEFT, slightly farther than F1 |
| F5 | 2250-2500 Hz | -3.8 dB | FAR LEFT, similar distance to F3 |

### 3.2 ILD as Distance Proxy

ILD magnitude correlates with lateral distance from the microphone axis. A source directly ahead (0 degrees) has ILD near 0 dB. A source far to one side has increasingly negative or positive ILD. Combined with the inverse square law (energy decreases with distance squared), ILD provides both angular and rough distance information.

---

## 4. Stereo Coherence and Diffuse Field Analysis

The magnitude-squared coherence between left and right channels indicates whether energy at a given frequency comes from a localized source (coherence near 1) or from many scattered sources (coherence near 0) [1][3].

### 4.1 Reference Recording Coherence Spectrum (60-120s, Full Chorus)

| Band | Range | Coherence | Interpretation |
|------|-------|-----------|----------------|
| Low ambient | 100-500 Hz | 0.401 | Partially diffuse -- some localized ambient sources |
| Lower frog | 1500-1800 Hz | 0.275 | Mostly diffuse -- multiple lower-frequency callers |
| Core frog | 2000-2200 Hz | 0.153 | Mostly diffuse -- dense chorus zone |
| Upper frog | 2200-2500 Hz | 0.016 | Fully diffuse -- scattered small callers |
| Above frogs | 3000-6000 Hz | 0.059 | Fully diffuse -- insects, background |

### 4.2 What the Coherence Gradient Reveals

The progressive drop in coherence from lower to upper frog range tells a story: larger (lower-pitched) males hold preferred calling positions closer to the microphone -- resulting in higher coherence because fewer sources dominate the signal. Smaller (higher-pitched) males are more spatially distributed, producing nearly random phase relationships between channels.

This is behavioral ecology extracted from a coherence spectrum. No camera needed.

---

## 5. Reflection Detection and Room Geometry

Sound bouncing off surfaces creates characteristic signatures that encode the geometry of the space [1][4].

### 5.1 Comb Filtering

When a direct sound and its reflection combine, they create a comb filter pattern in the spectrum -- alternating peaks and nulls with spacing:

```
delta_f = c / (2 * d)
```

where d is the path length difference between direct and reflected sound. A reflector at 3.5 meters creates a comb pattern with 49 Hz spacing (343 / (2 * 3.5)).

### 5.2 Reference Recording Results

| Method | Distance Estimate | Confidence | Interpretation |
|--------|------------------|------------|----------------|
| Comb filter analysis | 3.3-3.7 m | 0.68-0.73 | Near bank or low wall |
| Time-domain reflection | 18-19 ms (~3.1-3.2 m) | Medium | Near bank |
| Time-domain reflection | 35-38 ms (~6.0-6.5 m) | Medium | Concrete wall candidate |
| Time-domain reflection | 55-57 ms (~9.5-9.8 m) | Low | Far boundary or treeline |

Concrete sound walls have reflection coefficients of approximately 0.95, making them excellent acoustic mirrors. The 6.0-6.5 m estimate aligns with the known concrete wall on the far side of the pond.

### 5.3 RT60 and Space Characterization

RT60 -- the time for sound to decay by 60 dB -- characterizes the overall reverberance of a space. Estimates of 16-76 ms from the reference recording confirm an open outdoor space with minimal enclosure. Compare: a small bathroom has RT60 of 0.5-1.0 seconds; a concert hall 1.5-3.0 seconds; an open field effectively 0 ms.

---

## 6. Constructing the Spatial Map

The Spatial Reasoning Engine synthesizes all spatial information into a map [1]:

```
SPATIAL MAP — Reference Recording (Frog Pond)

          TREELINE (~10m)
    ----------------------------------------
    |                                      |
    |        F3 (FAR LEFT)                 |
    |            F5 (FAR LEFT)             |
    |                                      |
    |   CONCRETE WALL (~6m) ============== |
    |                                      |
    |       F1 (LEFT)    F2 (CENTER)       |
    |           F4 (LEFT)                  |
    |                                      |
    |          [POND]                      |
    |                                      |
    ===== MICROPHONE (near bank, ~3m) =====
```

The map integrates:
- Source positions from ILD analysis (lateral placement)
- Distance estimates from RMS attenuation (rough depth)
- Reflector positions from comb filter and time-domain analysis
- Space characterization from RT60

Each element has a confidence score. The map improves with each refinement pass as additional context constrains the geometry.

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Animal navigation; echolocation spatial mapping; biosonar geometry |
| [SPA](../SPA/index.html) | Spatial awareness from acoustic sensing; phone-in-dark-room geometry reconstruction |
| [ECO](../ECO/index.html) | Habitat mapping from acoustic surveys; biodiversity monitoring through sound |
| [VAV](../VAV/index.html) | Voxel spatial data representation; 3D scene reconstruction from signal data |

---

## 8. Sources

1. Deep Audio Analyzer Mission Package (GSD, March 8, 2026).
2. Knapp, C.H. & Carter, G.C. (1976). "The Generalized Correlation Method for Estimation of Time Delay." *IEEE Trans. Acoustics, Speech, Signal Processing*, 24(4), 320-327.
3. Benesty, J. et al. (2008). *Microphone Array Signal Processing*. Springer.
4. Kuttruff, H. (2009). *Room Acoustics*. 5th ed. Spon Press.
