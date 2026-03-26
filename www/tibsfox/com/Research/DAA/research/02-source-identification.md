# The Hypothesis Ear

> **Domain:** Bioacoustics & Source Classification
> **Module:** 2 -- Source Identification Engine
> **Through-line:** *A 30 RMS signal at 2187 Hz means nothing without context. With the context "frogs in a pond," it becomes a distant chorus. Context transforms data into information, and context arrives iteratively.*

---

## Table of Contents

1. [Hypothesis-Driven Analysis](#1-hypothesis-driven-analysis)
2. [Pacific Tree Frog: A Reference Species](#2-pacific-tree-frog-a-reference-species)
3. [Chorus Dynamics](#3-chorus-dynamics)
4. [Source Classification Framework](#4-source-classification-framework)
5. [Extensible Species Library](#5-extensible-species-library)
6. [Cross-References](#6-cross-references)
7. [Sources](#7-sources)

---

## 1. Hypothesis-Driven Analysis

The Source Identification Engine is the second pass of the refinement cycle. Once the Foundation Analysis has characterized the audio and the human has provided context -- or the foundation hypotheses have been confirmed -- this module applies domain-specific analysis [1].

The key insight: general-purpose spectral analysis treats all energy equally. Domain-specific analysis knows where to look and what to look for. If the hypothesis is "frogs in a pond," the engine focuses on the 1500-2500 Hz band, looks for pulsed call patterns with 10-15 ms onset durations, and tracks chorus recruitment dynamics. If the hypothesis is "traffic on a highway," the engine focuses on 60-250 Hz, looks for Doppler shifts indicating passing vehicles, and estimates traffic density from event rates.

### 1.1 The Context Injection Point

Between Pass 1 and Pass 2, the human provides context. This is the critical interaction:

- **Human:** "Those are frogs. Pacific tree frogs, I think. It's a pond near my house."
- **Engine:** Activates *P. regilla* frequency profile, call pattern templates, chorus recruitment models

The human's context is not just helpful -- it is transformative. It changes which mathematical tools are applied and what the results mean.

---

## 2. Pacific Tree Frog: A Reference Species

The Pacific tree frog (*Pseudacris regilla*) served as the primary biological source in the reference recording. Identification was confirmed through convergence of multiple indicators [1][2]:

### 2.1 Frequency Signature

94-96% of active-period energy concentrates in the 1500-2500 Hz band. Peak calling frequency centers at 2050-2250 Hz with individual variation of +/-200 Hz. This range is diagnostic for *P. regilla* and distinguishes it from syntopic species in the Pacific Northwest.

### 2.2 Call Characteristics

| Parameter | Value | Diagnostic Significance |
|-----------|-------|------------------------|
| Call duration (onset) | 10-15 ms | Tentative chirps during assessment period |
| Call duration (full) | 300-435 ms | Full advertisement calls during stable chorus |
| Call rate (onset) | ~8 calls/sec | Early recruitment phase |
| Call rate (peak) | 10+ calls/sec | Full chorus density |
| Inter-call interval SD (early) | 104 ms | Individual calls distinguishable |
| Inter-call interval SD (peak) | 39 ms (drops, then rises to 161 ms) | Synchronization, then overlap |

### 2.3 Pitch-Size Correlation

Lower-pitched callers (1800-2050 Hz) may represent larger males. Higher-pitched callers (2250-2500 Hz) are typically smaller individuals. This is consistent with the general anuran pattern where body size correlates inversely with call frequency -- larger vocal apparatus produces lower fundamental frequencies.

In the reference recording, five distinct caller groups were identified by combining frequency band with spatial position:

| Group | Frequency | Position | Duration Active |
|-------|-----------|----------|----------------|
| F1 | 2050-2250 Hz | LEFT (-2.0 dB ILD) | 90 seconds |
| F2 | 1800-2050 Hz | CENTER (+0.2 dB ILD) | 96 seconds |
| F3 | 2050-2250 Hz | FAR LEFT (-4.0 dB ILD) | Intermittent |
| F4 | 2250-2500 Hz | LEFT (-2.4 dB ILD) | 67 seconds |
| F5 | 2250-2500 Hz | FAR LEFT (-3.8 dB ILD) | 42 seconds |

---

## 3. Chorus Dynamics

The species exhibits classic chorus recruitment behavior -- one of the most information-rich acoustic phenomena in nature [2][3].

### 3.1 Recruitment Cascade

1. **Pioneer call** (~18s) -- A single frog breaks the post-disturbance silence with a tentative 10-15 ms chirp
2. **Gradual joining** (18-30s) -- Additional callers join, each assessing safety from the pioneer's survival
3. **Steady-state buildup** (30-60s) -- Call rate accelerates, inter-call intervals tighten
4. **Peak density** (60-130s) -- Maximum caller density; modulation index drops to 0.098 (continuous wash)
5. **Late arrivals** (130+s) -- Distant or cautious callers finally join

### 3.2 Modulation Index as Density Metric

The modulation index of the aggregate signal provides a quantitative measure of chorus density:

- **High modulation (>0.3):** Individual calls distinguishable -- sparse chorus, early recruitment
- **Moderate modulation (0.1-0.3):** Calls overlapping but structure visible -- building chorus
- **Low modulation (<0.1):** Continuous energy wash -- full chorus, individual calls indistinguishable

At modulation index 0.098, the chorus has become a wall of sound. This is the acoustic equivalent of a crowd where individual voices merge into a roar.

### 3.3 The Assessment Period

The 18-second silence at the beginning of the reference recording is the chorus's distributed threat assessment. The fox (recorder) arrived at 0.5 seconds (identifiable by a broadband transient with 64% sub-bass energy and +30 dB ILD hard right). Every frog independently detected this disturbance and independently stopped calling. No coordinator. No message passing. Just shared silence.

The first probe at 18 seconds is a frog sacrificing its safety to generate information for the group. If the fox moves toward the chirp, the frog dies and the others know the threat is active. If the fox stays still, the frog survives and the others learn the threat may be passive.

---

## 4. Source Classification Framework

Beyond biological sources, the engine classifies [1]:

| Source Type | Key Features | Analysis Tools |
|-------------|-------------|----------------|
| **Biological** | Narrowband energy, pulsed patterns, species-specific frequency | Band analysis, call detection, chorus dynamics |
| **Environmental** | Broadband, continuous, correlated with weather/terrain | Wind profile, water flow estimation, rain detection |
| **Mechanical** | Harmonic series, fundamental + overtones, steady-state | Harmonic tracking, RPM estimation, bearing analysis |
| **Speech** | Formant structure, prosody, turn-taking | Formant analysis, speaker segmentation |
| **Music** | Tonal structure, rhythm, harmonic progression | Pitch tracking, beat detection, key estimation |

Each source type activates a different analysis toolkit. The engine maintains a library of spectral signatures that grows through use -- a direct connection to skill-creator's observation pipeline.

---

## 5. Extensible Species Library

The source identification library is designed for extension. Initial species profiles include [2][3]:

| Species | Frequency Range | Call Type | PNW Presence |
|---------|----------------|-----------|--------------|
| Pacific tree frog (*P. regilla*) | 1500-2500 Hz | Pulsed advertisement | Common |
| Red-legged frog (*R. aurora*) | 200-500 Hz | Low growl/chuckle | Declining |
| Pacific chorus frog (*P. regilla* complex) | 1000-2500 Hz | Multi-note trill | Common |
| American bullfrog (*L. catesbeianus*) | 200-400 Hz | Deep resonant call | Invasive |
| Western toad (*A. boreas*) | 500-1500 Hz | Soft trill | Declining |

Each profile includes frequency signature, call duration, inter-call interval, seasonal activity window, and habitat association. The library expands as the analyzer encounters and confirms new species.

---

## 6. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Biosonar species identification; spectral signature libraries for marine mammals |
| [ECO](../ECO/index.html) | Anuran ecology; species identification as biodiversity indicator |
| [MAM](../MAM/index.html) | Mammalian vocalizations; orca call classification |
| [AVI](../AVI/index.html) | Bird call identification; dawn chorus dynamics parallel frog chorus |
| [WAL](../WAL/index.html) | Source analysis as foundation for production; signal deconstruction parallels parody analysis |

---

## 7. Sources

1. Deep Audio Analyzer Mission Package (GSD, March 8, 2026).
2. Elliott, L., Gerhardt, H.C., & Davidson, C. (2009). *The Frogs and Toads of North America*. Houghton Mifflin.
3. Gerhardt, H.C. & Huber, F. (2002). *Acoustic Communication in Insects and Anurans*. University of Chicago Press.
