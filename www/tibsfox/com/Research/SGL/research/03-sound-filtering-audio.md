# Sound Filtering & Audio Processing

> **Domain:** Audio Engineering
> **Module:** 3 -- Practical Filter Design, Psychoacoustics, and Real-Time Constraints
> **Through-line:** *The ear doesn't hear frequencies. It hears relationships.* A parametric EQ doesn't make a mix "better" by boosting or cutting individual bands -- it changes the relationships between bands until the brain perceives the sound as natural, balanced, present. The math serves the perception, not the other way around.

---

## Table of Contents

1. [Parametric Equalization](#1-parametric-equalization)
2. [Crossover Networks](#2-crossover-networks)
3. [Dynamic Range Compression](#3-dynamic-range-compression)
4. [Filter Bank Architectures](#4-filter-bank-architectures)
5. [Psychoacoustic Foundations](#5-psychoacoustic-foundations)
6. [Real-Time Constraints and Latency Budgets](#6-real-time-constraints-and-latency-budgets)
7. [The Hearing Aid Pipeline: A Complete Example](#7-the-hearing-aid-pipeline-a-complete-example)
8. [Audio Metering and Level Management](#8-audio-metering-and-level-management)
9. [Multi-Rate Processing](#9-multi-rate-processing)
10. [Practical Implementation Patterns](#10-practical-implementation-patterns)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Parametric Equalization

A parametric equalizer uses cascaded biquad sections, each adjustable in three parameters [1]:

- **Center frequency (fc):** The frequency at maximum boost or cut
- **Bandwidth (Q factor):** The width of the affected frequency range; higher Q = narrower bandwidth
- **Gain (G):** The amount of boost (positive) or cut (negative) in dB

### Biquad Coefficient Formulas

For a peaking (bell) EQ filter with center frequency `fc`, sampling frequency `fs`, gain `G_dB`, and quality factor `Q`:

```
A  = 10^(G_dB / 40)
w0 = 2 * pi * fc / fs
alpha = sin(w0) / (2 * Q)

b0 = 1 + alpha * A
b1 = -2 * cos(w0)
b2 = 1 - alpha * A
a0 = 1 + alpha / A
a1 = -2 * cos(w0)
a2 = 1 - alpha / A

Normalize all coefficients by dividing by a0.
```

These coefficients produce a second-order transfer function that boosts or cuts a bell-shaped region of the frequency spectrum centered at `fc` [2].

### Common EQ Types

| Type | Application | Typical Parameters |
|---|---|---|
| High-pass (HPF) | Remove rumble, wind noise | fc: 20-120 Hz, Q: 0.707 |
| Low-shelf | Bass boost/cut | fc: 80-300 Hz, G: +/-12 dB |
| Peaking (bell) | Surgical frequency adjustment | fc: 20-20,000 Hz, Q: 0.5-16 |
| High-shelf | Treble boost/cut | fc: 2-16 kHz, G: +/-12 dB |
| Low-pass (LPF) | Remove hiss, aliasing guard | fc: 8-20 kHz, Q: 0.707 |
| Notch | Remove specific interference | fc: 50/60 Hz (mains), Q: 10-30 |
| All-pass | Phase adjustment without gain change | fc: variable, Q: variable |

### Cascaded EQ Chains

Professional mixing consoles typically provide 4-8 bands of parametric EQ per channel. Each band is an independent biquad section, and the sections cascade (multiply in the z-domain). The total filter is:

```
H_total(z) = H1(z) * H2(z) * H3(z) * ... * HN(z)
```

Because biquad sections are independent, each can be tuned without affecting the others. This is a direct consequence of using second-order sections rather than a single high-order filter -- the Amiga Principle applied to filter topology: small, specialized units doing one thing well, composed for complex behavior.

---

## 2. Crossover Networks

Crossover networks split the audio spectrum into frequency bands for multi-driver speaker systems. Each driver (woofer, midrange, tweeter) receives only the frequencies it can reproduce efficiently [3].

### Crossover Types

**Butterworth (maximally flat magnitude):** -3 dB at crossover frequency. When summed, produces a flat magnitude response but phase shifts between bands can cause interference at the crossover point. The standard for most professional audio applications.

**Linkwitz-Riley (LR):** Two cascaded Butterworth filters. -6 dB at crossover frequency for LR-4 (4th order). When summed, produces a flat magnitude response with zero phase shift at crossover. The gold standard for speaker system design [4].

**Bessel (maximally flat group delay):** Preserves transient shape through the crossover region. Used in time-critical applications where waveform fidelity matters more than frequency-domain flatness.

### Filter Order and Slope

| Order | Slope | Type | Phase at Crossover | Summed Response |
|---|---|---|---|---|
| 1st | 6 dB/oct | Butterworth | 90 degrees | Flat (with tilt) |
| 2nd | 12 dB/oct | Butterworth | 180 degrees | Null at crossover |
| 2nd | 12 dB/oct | LR-2 | 180 degrees | Flat (inverted polarity) |
| 4th | 24 dB/oct | LR-4 | 360 degrees | Flat (in-phase) |
| 8th | 48 dB/oct | LR-8 | 720 degrees | Flat (in-phase) |

LR-4 (4th order Linkwitz-Riley) is the most commonly used crossover for professional loudspeaker systems because it provides steep attenuation (24 dB/octave) with perfect magnitude summation and in-phase behavior at the crossover frequency.

### Three-Way Crossover Architecture

```
THREE-WAY CROSSOVER SIGNAL FLOW
================================================================

                    ┌─── LPF (fc1) ───────────> Woofer
                    │
  Input ────────────┼─── BPF (fc1 to fc2) ────> Midrange
                    │
                    └─── HPF (fc2) ───────────> Tweeter

  Typical frequencies:
    fc1 = 500 Hz  (woofer-to-midrange)
    fc2 = 3500 Hz (midrange-to-tweeter)
```

Each band uses LR-4 filters to ensure flat summation. The bandpass section is constructed by cascading a high-pass filter at fc1 with a low-pass filter at fc2.

---

## 3. Dynamic Range Compression

Dynamic range compression reduces the amplitude range of an audio signal by applying gain reduction above a threshold [5]. It is essential for broadcast, live sound, hearing aids, and music mastering.

### Compressor Parameters

- **Threshold:** The level above which gain reduction begins (typically -20 to 0 dBFS)
- **Ratio:** The amount of gain reduction (e.g., 4:1 means 4 dB of input increase produces 1 dB of output increase)
- **Attack time:** How quickly gain reduction engages after the signal exceeds the threshold (0.1-100 ms)
- **Release time:** How quickly gain reduction disengages after the signal drops below the threshold (10-1000 ms)
- **Knee:** The transition sharpness at the threshold (hard knee = abrupt, soft knee = gradual)
- **Makeup gain:** Fixed gain added after compression to restore average level

### Gain Computation

The compressor gain in dB for an input level `L_in` above the threshold `T` with ratio `R`:

```
if L_in <= T:
    G_dB = 0                        (no compression)
else:
    G_dB = (T - L_in) * (1 - 1/R)  (gain reduction)
```

For a 4:1 ratio with -20 dBFS threshold, an input at -10 dBFS (10 dB above threshold) produces:
```
G_dB = (-20 - (-10)) * (1 - 1/4) = -10 * 0.75 = -7.5 dB gain reduction
```

### Envelope Detection

The compressor needs to track the signal's instantaneous level. Two common envelope detectors:

**Peak detection:** Follows the absolute peak value. Fast response, aggressive compression. Used for limiting (preventing clipping).

**RMS detection:** Follows the root-mean-square level over a window. Smoother response, more "musical" compression. Requires a running average computation [6].

### Attack and Release Implementation

```
COMPRESSOR ENVELOPE FOLLOWER
================================================================

  Signal ──> |abs| ──> [Attack/Release] ──> Envelope
                           │
                           │  if input > envelope:
                           │    envelope += (input - envelope) * attack_coeff
                           │  else:
                           │    envelope += (input - envelope) * release_coeff
                           │
                           │  attack_coeff  = 1 - exp(-1 / (fs * t_attack))
                           │  release_coeff = 1 - exp(-1 / (fs * t_release))
```

The exponential smoothing coefficients convert time constants (in seconds) to per-sample multipliers. At 48 kHz with a 10 ms attack time: `attack_coeff = 1 - exp(-1 / (48000 * 0.01)) = 0.00208`.

---

## 4. Filter Bank Architectures

Filter banks decompose a signal into multiple frequency bands for independent processing [7].

### Octave-Band and Fractional-Octave

ANSI S1.11 defines standard octave and fractional-octave band filters for acoustic measurement:

| Band Type | Bands (20-20kHz) | Q Factor | Application |
|---|---|---|---|
| 1-octave | 10 | 1.41 | Room acoustics, rough analysis |
| 1/3-octave | 31 | 4.32 | Standard acoustic measurement |
| 1/6-octave | 62 | 8.65 | Detailed spectral analysis |
| 1/12-octave | 124 | 17.31 | Fine-grained parametric control |

### Uniform vs. Non-Uniform Bands

**Uniform (FFT-based):** Equal-width frequency bins. Natural for spectral analysis but poorly matched to human hearing, which has logarithmic frequency resolution.

**Non-uniform (critical-band):** Band widths approximate the ear's critical bands (Bark or ERB scale). Better perceptual relevance but more complex to implement.

### Polyphase Filter Banks

Polyphase decomposition restructures a filter bank to share computation across bands. An N-band polyphase filter bank processes each band at 1/N the original sample rate, reducing total computation by a factor of N [8]. This technique is fundamental to MP3 and AAC audio coding.

---

## 5. Psychoacoustic Foundations

### Critical Bands

The basilar membrane of the cochlea performs a mechanical frequency analysis. Each region responds to a limited bandwidth called a critical band. Critical bandwidth is approximately 100 Hz below 500 Hz and approximately 20% of center frequency above 500 Hz [9].

The Bark scale divides the audible range into 24 critical bands:

| Bark | Center (Hz) | Width (Hz) | Bark | Center (Hz) | Width (Hz) |
|---|---|---|---|---|---|
| 1 | 50 | 80 | 13 | 1850 | 280 |
| 2 | 150 | 100 | 14 | 2150 | 320 |
| 3 | 250 | 100 | 15 | 2500 | 380 |
| 4 | 350 | 100 | 16 | 2900 | 450 |
| 5 | 450 | 110 | 17 | 3400 | 550 |
| 6 | 570 | 120 | 18 | 4000 | 700 |
| 7 | 700 | 140 | 19 | 4800 | 900 |
| 8 | 840 | 150 | 20 | 5800 | 1100 |
| 9 | 1000 | 160 | 21 | 7000 | 1300 |
| 10 | 1170 | 190 | 22 | 8500 | 1800 |
| 11 | 1370 | 210 | 23 | 10500 | 2500 |
| 12 | 1600 | 240 | 24 | 13500 | 3500 |

### Simultaneous Masking

A loud tone masks quieter tones within the same critical band and adjacent bands. The masking threshold spreads asymmetrically -- more toward higher frequencies than lower. This property is exploited by audio codecs (MP3, AAC) to discard inaudible components.

### Loudness Perception

Equal-loudness contours (ISO 226:2003) show that human sensitivity varies dramatically with frequency. The ear is most sensitive around 3-4 kHz (the resonant frequency of the ear canal) and least sensitive below 100 Hz and above 10 kHz. A-weighting approximates the equal-loudness contour at moderate levels and is the standard for noise measurement [10].

### Temporal Masking

**Pre-masking:** A loud sound masks quieter sounds occurring up to 20 ms *before* it (retroactive masking via neural processing delay).

**Post-masking:** A loud sound masks quieter sounds for 100-200 ms *after* it ceases. The decay follows approximately:

```
Masking threshold (dB) = Initial level - 10 * log10(t / t0)
```

Where `t` is time after the masker and `t0` is the reference time constant (~5 ms).

---

## 6. Real-Time Constraints and Latency Budgets

### Sample-Rate Timing

| Sample Rate | Period | Application |
|---|---|---|
| 8 kHz | 125 us | Telephone, VoIP |
| 16 kHz | 62.5 us | Wideband speech |
| 44.1 kHz | 22.7 us | CD audio, consumer |
| 48 kHz | 20.8 us | Professional audio, broadcast |
| 96 kHz | 10.4 us | High-resolution audio |
| 192 kHz | 5.2 us | Ultra-high-resolution studio |

### Latency Budget Analysis

Professional live sound targets total system latency under 10 ms. A typical signal chain:

```
LIVE SOUND LATENCY BUDGET
================================================================

  Component              Latency        Running Total
  ────────────────────   ──────────     ─────────────
  Microphone/ADC         0.5 ms         0.5 ms
  Input buffer (64 smp)  1.3 ms         1.8 ms
  DSP processing         0.1 ms         1.9 ms
  Output buffer (64 smp) 1.3 ms         3.2 ms
  DAC                    0.5 ms         3.7 ms
  Network (Dante/AES67)  1.0 ms         4.7 ms
  Amplifier              0.1 ms         4.8 ms
  Acoustic propagation   2.9 ms (1m)    7.7 ms
  ────────────────────   ──────────     ─────────────
  Total                                 7.7 ms
  Budget                               10.0 ms
  Margin                                2.3 ms
```

### Application-Specific Targets

| Application | Max Latency | Critical Constraint |
|---|---|---|
| Hearing aids | < 6 ms | Bone conduction path (ear occluded) |
| ANC headphones | < 2 ms | Feedback stability |
| Live monitoring | < 10 ms | Performer perception |
| Broadcast | < 40 ms | Lip sync tolerance |
| Streaming | < 150 ms | Conversational delay |
| Post-production | No limit | Non-real-time processing |

> **SAFETY WARNING:** In hearing aid applications, latency exceeding 10 ms creates a comb-filter effect between the direct sound (through the ear mold vent) and the processed sound, producing an unnatural "hollow" quality that can cause the user to reject the device. The 6 ms target is a clinical threshold, not an engineering convenience [11].

---

## 7. The Hearing Aid Pipeline: A Complete Example

The hearing aid DSP pipeline integrates virtually every concept in this module into a single, latency-constrained, power-limited system [12]:

```
HEARING AID DSP PIPELINE
================================================================

  Microphone ──> ADC ──> HPF ──> Filter Bank ──> Compression ──> Sum ──> DAC
                  │        │        │ (18 bands)    │ (per-band)    │
                  │        │        │               │               │
                  │        │        └── Noise Est ──┘               │
                  │        │            (per-band)                  │
                  │        │                                        │
                  │        └── Feedback Cancellation <──────────────┘
                  │               (adaptive FxLMS)
                  │
                  └── Wind Noise Detection & Suppression
```

### Processing Stages

1. **High-pass filter:** Removes low-frequency noise below 100 Hz
2. **Feedback cancellation:** Adaptive FxLMS filter suppresses acoustic feedback between speaker and microphone (the "whistling" problem)
3. **Filter bank:** 18-band 1/3-octave analysis per ANSI S1.11
4. **Noise estimation:** Per-band noise floor tracking during silence periods
5. **Dynamic compression:** Per-band gain with audiogram-based prescription
6. **Band summation:** Overlap-add reconstruction
7. **Output limiting:** Hard limiter at 132 dB SPL maximum

### Power Budget

Total DSP power consumption: 1.2 mW at 1.8V. Battery life (size 312 zinc-air, 180 mAh): approximately 120 hours. Every additional filter tap, every wider wordlength, every higher sample rate directly reduces battery life.

---

## 8. Audio Metering and Level Management

### Peak vs. RMS vs. LUFS

- **Peak metering:** Instantaneous maximum sample value. Used for clipping prevention. Does not correlate with perceived loudness.
- **RMS metering:** Root-mean-square over a time window (typically 300 ms). Better loudness correlation but frequency-independent.
- **LUFS (Loudness Units relative to Full Scale):** ITU-R BS.1770 standard. K-weighted RMS with frequency weighting matching human loudness perception. The broadcast standard [13].

### K-Weighting Filter

The K-weighting filter specified by ITU-R BS.1770 consists of two stages:
1. **High-shelf pre-filter:** +4 dB above 1500 Hz (models the effect of the head on sound field)
2. **High-pass filter:** -3 dB at 38 Hz, 2nd order (removes inaudible low frequencies)

Both stages are biquad filters with precisely specified coefficients at 48 kHz sampling rate.

---

## 9. Multi-Rate Processing

### Decimation (Downsampling)

Decimation reduces the sample rate by a factor M:
1. Apply anti-aliasing low-pass filter (cutoff at fs/(2M))
2. Discard M-1 out of every M samples

### Interpolation (Upsampling)

Interpolation increases the sample rate by a factor L:
1. Insert L-1 zero-valued samples between each original sample
2. Apply anti-imaging low-pass filter (cutoff at fs/(2L))

### Efficient Implementation

The polyphase decomposition allows the anti-aliasing/anti-imaging filter to operate at the lower sample rate, reducing computation by the decimation/interpolation factor. For a factor-of-4 decimation, the filter runs at 1/4 the input rate -- a 4x reduction in MAC operations [14].

### Sample Rate Conversion

Converting between non-integer-related rates (e.g., 44.1 kHz to 48 kHz) requires rational resampling: interpolate by L, filter, decimate by M, where L/M = 48000/44100 = 160/147. The polyphase implementation makes this practical at audio rates.

---

## 10. Practical Implementation Patterns

### Coefficient Smoothing

When EQ parameters change in real time (user adjusting a knob), direct coefficient updates produce clicks and zipper noise. Solutions:
- **Crossfade:** Run two filter instances, crossfade between old and new coefficients over 5-10 ms
- **Parameter smoothing:** Low-pass filter the parameter changes before recalculating coefficients
- **Interpolation:** Linearly interpolate coefficients over a block boundary

### Denormal Protection

Very small floating-point numbers (denormals) cause massive CPU performance penalties on x86 processors. DSP code must either flush denormals to zero or add a small DC offset to prevent them:

```
// Denormal protection: add and subtract a tiny constant
const float DENORMAL_GUARD = 1e-15f;
output = process(input + DENORMAL_GUARD) - DENORMAL_GUARD;
```

### Double-Precision Accumulators

Even when using 32-bit floating-point for signal storage, MAC accumulators should use 64-bit (double) precision to prevent roundoff error accumulation in long filter chains. This is especially important for IIR filters where feedback amplifies quantization errors [15].

---

## 11. Cross-References

> **Related:** [Real-Time DSP Algorithms](01-real-time-dsp-algorithms.md) -- theoretical foundations for the filters applied here. [ASIC & FPGA DSP](02-asic-fpga-dsp.md) -- hardware implementation of these audio processing chains. [LED Persistence of Vision](04-led-persistence-of-vision.md) -- audio-reactive LED driving connects Module 3 to Module 4.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** Multi-pass audio analysis uses the filter architectures described here
- **FQC (Frequency Continuum):** Spectral analysis and frequency-domain processing overlap
- **SPA (Spatial Awareness):** Spatial audio processing extends the filter concepts to 3D
- **LED (LED & Controllers):** Audio-reactive LED systems consume the output of these filters

---

## 12. Sources

1. Zolzer, U. *DAFX: Digital Audio Effects*. 2nd ed. Wiley, 2011.
2. Smith, J.O. "Introduction to Digital Filters with Audio Applications." CCRMA, Stanford University, 2007.
3. Linkwitz, S. and Riley, R. "Active Crossover Networks for Noncoincident Drivers." JAES, vol. 24, no. 1, pp. 2-8, 1976.
4. D'Appolito, J.A. *Testing Loudspeakers*. Audio Amateur Press, 1998.
5. Giannoulis, D., Massberg, M., and Reiss, J.D. "Digital Dynamic Range Compressor Design -- A Tutorial and Analysis." JAES, vol. 60, no. 6, pp. 399-408, 2012.
6. McNally, G.W. "Dynamic Range Control of Digital Audio Signals." JAES, vol. 32, no. 5, pp. 316-327, 1984.
7. Vaidyanathan, P.P. *Multirate Systems and Filter Banks*. Prentice-Hall, 1993.
8. Crochiere, R.E. and Rabiner, L.R. *Multirate Digital Signal Processing*. Prentice-Hall, 1983.
9. Zwicker, E. and Fastl, H. *Psychoacoustics: Facts and Models*. 3rd ed. Springer, 2007.
10. ISO 226:2003. "Acoustics -- Normal equal-loudness-level contours."
11. Stone, M.A. and Moore, B.C.J. "Tolerable Hearing Aid Delays." Ear & Hearing, vol. 20, no. 3, pp. 218-228, 1999.
12. Deepu, C.J. et al. "Design and implementation of a signal processing ASIC for digital hearing aids." ScienceDirect, 2022.
13. ITU-R BS.1770-5. "Algorithms to measure audio programme loudness and true-peak audio level." 2023.
14. Crochiere, R.E. "A Weighted Overlap-Add Method of Short-Time Fourier Analysis/Synthesis." IEEE Trans. ASSP, vol. 28, no. 1, pp. 99-102, 1980.
15. Dattorro, J. "Effect Design: Part 1 -- Reverberator and Other Filters." JAES, vol. 45, no. 9, pp. 660-684, 1997.

---

*Signal & Light -- Module 3: Sound Filtering & Audio Processing. The ear decides what matters. The filter serves the ear.*
