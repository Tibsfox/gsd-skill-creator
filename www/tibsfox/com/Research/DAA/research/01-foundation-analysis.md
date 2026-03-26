# The Cold Start

> **Domain:** Digital Signal Processing
> **Module:** 1 -- Foundation Analysis Engine
> **Through-line:** *The frogs didn't start calling because the analysis got better. They started calling because the fox sat still long enough.* Before context, before hypotheses, before meaning -- there is the raw waveform. The foundation pass reads what the audio file actually contains, without assumptions, without prior knowledge, letting the numbers speak first.

---

## Table of Contents

1. [The Refinement Cycle](#1-the-refinement-cycle)
2. [Waveform Characterization](#2-waveform-characterization)
3. [Spectral Density Estimation](#3-spectral-density-estimation)
4. [Frequency Band Taxonomy](#4-frequency-band-taxonomy)
5. [Activity and Silence Segmentation](#5-activity-and-silence-segmentation)
6. [Initial Hypothesis Generation](#6-initial-hypothesis-generation)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. The Refinement Cycle

The Deep Audio Analyzer implements a multi-pass refinement cycle inspired by how experts actually decode complex audio. Each pass applies progressively more targeted analysis, guided by accumulating context from prior passes and human input [1].

```
Pass 1: FOUNDATION (cold analysis, no priors)
  Input:  Raw audio file
  Tools:  Waveform stats, spectral density, RMS timeline,
          zero-crossing rate, spectral centroid
  Output: Technical characterization + initial hypotheses
           |
Pass 2: HYPOTHESIS-DRIVEN (human context applied)
  Input:  Pass 1 results + human context
  Tools:  Species-specific band analysis, call pattern detection,
          chorus dynamics, modulation index
  Output: Source identification + spatial overview
           |
Pass 3: GEOMETRIC REFINEMENT (physical context applied)
  Input:  Pass 2 results + spatial context
  Tools:  GCC-PHAT, ILD/ITD mapping, comb filter analysis,
          reflection timing, RT60 estimation
  Output: Spatial map + source profiles + narrative arc
           |
Pass N: NARRATIVE SYNTHESIS (meaning-making)
  Input:  All prior passes + behavioral/ecological context
  Tools:  Temporal correlation, energy narrative, event detection
  Output: Complete scene reconstruction
```

The cycle is not a fixed pipeline -- it is a conversation between the analyzer and the human, mediated by mathematical tools that sharpen with each iteration. This module covers Pass 1: the foundation.

---

## 2. Waveform Characterization

The foundation pass extracts file-level properties and computes global statistics. Each measurement has specific diagnostic value [2]:

| Measurement | Algorithm | Diagnostic Value |
|-------------|-----------|------------------|
| Peak amplitude | max(\|x[n]\|) | Headroom assessment; clipping detection |
| RMS level | sqrt(1/N * sum(x[n]^2)) | Overall loudness; distance proxy for biological sources |
| Crest factor | Peak / RMS | Transient vs. sustained content; speech vs. drone |
| Zero-crossing rate | Sign change count / N | Speech (1000-3000/s) vs. tonal (low) vs. noise (high) |
| Spectral centroid | sum(f * P(f)) / sum(P(f)) | Brightness tracking; source characterization |
| Activity ratio | Windows > threshold / total | Silence-to-sound ratio; recording context |

### 2.1 What Each Measurement Reveals

**RMS level** is a distance proxy for biological sources because sound energy decreases with the square of the distance (inverse square law). A frog calling 1 meter from the microphone has an RMS contribution 4x higher than one at 2 meters. The RMS timeline -- computed in overlapping windows across the recording -- reveals the energy arc of the entire soundscape.

**Zero-crossing rate (ZCR)** separates content types rapidly. Speech has a characteristic ZCR range (1000-3000 sign changes per second) because voiced phonemes produce periodic waveforms with predictable zero crossings. Pure tones have very low ZCR. Broadband noise has very high ZCR. A recording dominated by frog calls will show ZCR in the 2000-5000 range during active chorus, dropping to near-zero during silence.

**Spectral centroid** tracks the "brightness" of the sound over time. An ascending centroid trajectory indicates higher-frequency sources becoming more prominent -- consistent with a chorus recruiting additional callers at progressively higher frequencies.

---

## 3. Spectral Density Estimation

Welch's method -- overlapping windowed FFT segments averaged to reduce variance -- is the primary spectral tool [2][3].

### 3.1 Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| FFT size (nperseg) | 4096 samples | 85ms at 48kHz; 11.7 Hz frequency resolution for frog calls |
| High-resolution | 8192 samples | 170ms; 5.9 Hz resolution for comb filter detection |
| Overlap | 50% default | Standard Welch overlap; 90% for comb filter analysis |
| Window | Hann (default) | Low spectral leakage; suitable for tonal and broadband sources |

### 3.2 Why These Parameters Matter

Frequency resolution determines whether you can distinguish two calls at close frequencies. At 11.7 Hz resolution, two frogs calling at 2050 Hz and 2100 Hz appear as separate peaks. At 23.4 Hz resolution (2048-point FFT), they merge into a single broad peak. The tradeoff is time resolution: a longer FFT window means more frequency precision but less ability to track rapid changes.

The 85ms window at 4096 points is tuned for biological acoustic analysis in the 1-5 kHz range -- the band where most temperate anurans, many passerine birds, and numerous insect species call.

---

## 4. Frequency Band Taxonomy

The foundation pass divides the spectrum into diagnostic bands. For environmental recordings, the following taxonomy proved effective on the reference recording [2]:

| Band | Range | Typical Sources |
|------|-------|-----------------|
| Sub/Bass | 20-250 Hz | Footsteps, rumble, wind, large machinery |
| Low ambient | 250-800 Hz | Mid-range environmental noise, some large frog species |
| Low frog | 800-1500 Hz | Larger tree frogs, some toad species |
| Core frog | 1500-2500 Hz | Pacific tree frog primary calling range |
| High frog | 2500-4000 Hz | Spring peepers, cricket frogs |
| Insect | 4000-10000 Hz | Crickets, cicadas, katydids |
| Ultra-high | 10000-20000 Hz | Bat echolocation, some orthopterans |

This taxonomy is extensible. For urban recordings, bands would shift to emphasize traffic (60-250 Hz), HVAC (250-1000 Hz), and speech (300-3000 Hz). For marine recordings, bands would cover fish communication (100-1000 Hz), cetacean calls (2-20 kHz), and echolocation clicks (20-150 kHz).

---

## 5. Activity and Silence Segmentation

The foundation pass segments the recording into active and silent regions using adaptive thresholding on the RMS timeline [2]:

1. Compute RMS in overlapping windows (typically 50ms windows, 25ms hop)
2. Estimate the noise floor from the lowest 10th percentile of RMS values
3. Set threshold at noise floor + configurable margin (default: +6 dB)
4. Classify windows as active (above threshold) or silent (below)
5. Apply minimum duration constraints to prevent fragmentation

The activity ratio (active windows / total windows) is a powerful first-order diagnostic. A recording with 95% activity is continuous sound (traffic, machinery, dense chorus). A recording with 20% activity is sparse events in silence (individual bird calls, distant thunder, intermittent speech).

### 5.1 The Silence Is the Story

In the reference recording (Pacific tree frog chorus), the first 18 seconds are nearly silent -- just a distant chorus bed at -30 dB below eventual peak levels. This silence is not empty. It is the frogs assessing the fox's arrival. The 18-second silence is the most information-rich part of the recording because it encodes a behavioral event: the entire chorus independently decided to stop calling, then independently decided it was safe to resume.

---

## 6. Initial Hypothesis Generation

The foundation pass concludes with hypothesis generation based on measured features [1]:

| Feature Pattern | Hypothesis |
|----------------|------------|
| Energy concentrated in 1500-2500 Hz, high activity ratio, moderate crest factor | Anuran (frog/toad) chorus |
| Broadband energy, low spectral centroid, low ZCR | Environmental noise (wind, water) |
| Energy in 300-3000 Hz, periodic pauses, moderate ZCR | Speech |
| Sharp transients, high crest factor, low activity ratio | Discrete events (bird calls, impacts) |
| Multiple narrow peaks at harmonic intervals | Mechanical source (engine, fan, pump) |

These hypotheses are presented to the human for confirmation or correction. The human's response -- "yes, those are frogs" or "no, that's a mechanical pump" -- primes the next pass with domain-specific analysis tools.

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Signal processing fundamentals; spectral analysis shared between audio and biosonar domains |
| [LED](../LED/index.html) | Oscilloscope parallels; Nyquist theorem; sampling and reconstruction |
| [SHE](../SHE/index.html) | ADC fundamentals; sensor signal conditioning; analog-to-digital conversion |
| [WAL](../WAL/index.html) | Audio production; note-perfect signal reproduction as technical achievement |
| [STA](../STA/index.html) | Entertainment audio engineering; broadcast signal quality |

---

## 8. Sources

1. Deep Audio Analyzer Mission Package (GSD, March 8, 2026).
2. SciPy Signal Processing Library -- Welch PSD, windowing functions, spectral analysis.
3. Oppenheim, A.V. & Schafer, R.W. (2009). *Discrete-Time Signal Processing*. Prentice Hall.
