# M14 — Temporal Imaging: Hi-Fi vs Lo-Fi Capture

> **Module ID:** VAV-TEMPORAL
> **Domain:** Sampling Theory, Temporal Aliasing, Fourier Decomposition, Field Separation, Super-Resolution
> **Through-line:** *Every layer of the stack is a decision about which frequencies to preserve.* A camera shutter is a low-pass filter. A palette is a vocabulary budget. A compression ratio is a frequency ceiling. The Nyquist theorem does not care whether the signal is photons hitting a sensor, blocks filling a chunk, or tokens entering a corpus — the sampling rate must be at least twice the highest frequency content, or information is destroyed. This module formalizes the temporal dimension of fidelity: how capture rate, integration time, and reconstruction algorithms determine what survives the encoding pipeline. The M2 retrospective (section 5.1) demanded that signal fidelity anchor itself in M7's entropy analysis. Here we deliver that anchor.

---

## Table of Contents

1. [Sampling Theory and Temporal Aliasing](#1-sampling-theory-and-temporal-aliasing)
2. [Long Exposure vs. Fast Frame Rate](#2-long-exposure-vs-fast-frame-rate)
3. [Temporal Super-Resolution Beyond Nyquist](#3-temporal-super-resolution-beyond-nyquist)
4. [Field Separation and Deinterlacing](#4-field-separation-and-deinterlacing)
5. [Color Space and Fourier Decomposition](#5-color-space-and-fourier-decomposition)
6. [Ceph/Minecraft Mapping: Temporal Fidelity in the Voxel Stack](#6-cephminecraft-mapping-temporal-fidelity-in-the-voxel-stack)
7. [Sources](#7-sources)

---

## 1. Sampling Theory and Temporal Aliasing

### 1.1 The Nyquist-Shannon Sampling Theorem

The Nyquist-Shannon sampling theorem is the foundational constraint on all discrete recording systems. It states that a continuous signal can be perfectly reconstructed from its samples if and only if the sampling rate is at least twice the highest frequency component present in the signal [5]:

```
f_sample >= 2 * f_max

Where:
  f_sample = sampling rate (samples per second)
  f_max    = highest frequency component in the signal (Hz)
  f_nyquist = f_sample / 2   (the Nyquist frequency)
```

"At least twice" is the mathematical minimum for perfect reconstruction via sinc interpolation. In practice, real systems require a guard band above the Nyquist frequency because ideal brick-wall filters do not exist in hardware. The theorem operates identically across all signal domains:

| Domain | Signal | Sampling Rate | Nyquist Frequency | Aliasing Artifact |
|---|---|---|---|---|
| Temporal (video) | Motion of objects | Frames per second (fps) | fps / 2 | Wagon-wheel effect |
| Spatial (imaging) | Scene detail | Pixels per degree | pixels / (2 * degree) | Moire patterns |
| Spectral (color) | Wavelength variation | Color channels | channels / 2 | Metamerism, false color |
| Audio | Acoustic pressure | Samples per second (Hz) | Hz / 2 | Foldback distortion |
| Voxel (Minecraft) | Block-type variation | Palette entries | palette_size / 2 | Semantic aliasing (see §6) |

The last row is the VAV contribution. The palette is a sampling system. Its cardinality determines the Nyquist limit of the representable content. This is not metaphor — it is the same theorem applied to a discrete symbolic domain (see M7 §3.2).

### 1.2 Temporal Aliasing and the Wagon-Wheel Effect

Temporal aliasing occurs when real-world frequency content exceeds the Nyquist limit of the camera's frame rate. In a 24 fps cinema system, the Nyquist frequency is 12 Hz. Any periodic event faster than 12 Hz will appear at an incorrect lower frequency — the classical wagon-wheel effect, where a rapidly spinning wheel appears to rotate backward or stall [10].

```
Observed frequency (aliased):
  f_observed = |f_real - round(f_real / f_sample) * f_sample|

Example: wheel spoke at 23 Hz, camera at 24 fps
  f_observed = |23 - round(23/24) * 24| = |23 - 24| = 1 Hz (backward)

Example: wheel spoke at 25 Hz, camera at 24 fps
  f_observed = |25 - round(25/24) * 24| = |25 - 24| = 1 Hz (forward)

Example: wheel spoke at 12 Hz, camera at 24 fps
  f_observed = |12 - round(12/24) * 24| = |12 - 0| = 12 Hz (correct — at Nyquist limit)
```

This is not a film artifact. It is a mathematical inevitability of discrete temporal sampling. Digital cameras, CCD sensors, and human neural sampling all exhibit the same aliasing when the sampling rate is insufficient. The fix is always the same: either increase the sampling rate or apply a low-pass filter before sampling to remove frequency content above the Nyquist limit [5][10].

### 1.3 The Camera Shutter as Temporal Low-Pass Filter

Motion picture cameras have a built-in imperfect pre-filter: the mechanical shutter. During the time the shutter is open, photons from the entire exposure window are accumulated onto the sensor or film frame. This temporal integration acts as a low-pass filter whose characteristics depend on the shutter angle.

```
Shutter angle and exposure time at 24 fps:
  Frame period       = 1/24 s = 41.67 ms
  180° shutter       = 1/48 s = 20.83 ms   (half the frame period)
  360° shutter       = 1/24 s = 41.67 ms   (full frame period)
  90° shutter        = 1/96 s = 10.42 ms   (quarter frame period)

Transfer function of rectangular integration window:
  H(f) = sinc(f * t_exp)

  where sinc(x) = sin(pi * x) / (pi * x)
        t_exp   = exposure time in seconds
```

The sinc function is the Fourier transform of a rectangular window. It has nulls at integer multiples of `1/t_exp` and non-zero sidelobes between them. This means:

| Shutter Angle | Exposure Time (24 fps) | First Null | Attenuation at 24 Hz | Attenuation at 48 Hz |
|---|---|---|---|---|
| 180° | 20.83 ms | 48 Hz | -3.9 dB | null (0) |
| 360° | 41.67 ms | 24 Hz | null (0) | null (0) |
| 90° | 10.42 ms | 96 Hz | -0.9 dB | -3.9 dB |
| 45° | 5.21 ms | 192 Hz | -0.2 dB | -0.9 dB |

A 180-degree shutter at 24 fps provides a sinc-shaped LPF with its first null at 48 Hz — attenuating content above roughly 24 Hz but with residual sidelobes that leak higher frequencies through. A 360-degree shutter provides a broader LPF (first null at 24 Hz) but at the cost of maximum motion blur. Neither is an ideal rectangular (brick-wall) filter in the frequency domain [10].

### 1.4 The Tessive Time Filter: Approaching the Ideal LPF

The Tessive Time Filter patent addresses the imperfect sinc response of a fixed shutter by continuously varying the exposure across the frame period. Instead of a rectangular on/off integration window, the Time Filter shapes the temporal aperture to approximate an ideal low-pass filter in the frequency domain [9].

```
Conventional shutter (rectangular window):
  Temporal domain:  w(t) = rect(t / t_exp)
  Frequency domain: W(f) = t_exp * sinc(f * t_exp)
  Problem: sinc sidelobes pass aliased content

Tessive Time Filter (shaped window):
  Temporal domain:  w(t) = custom weighting function
  Frequency domain: W(f) -> rect(f / f_cutoff)  (ideally)
  Goal: flat passband below f_cutoff, steep rolloff, no sidelobes
```

The MTF (Modulation Transfer Function) is the magnitude of the frequency-domain transfer function. The Tessive system shapes the MTF by modulating the sensor's integration gain across the frame period — not a simple open/close, but a continuously varying weighting that approximates the frequency-domain characteristics of an ideal rectangular LPF. The result: motion portrayal without the aliased wagon-wheel artifacts that plague standard shutters, and without the excessive motion blur of a 360-degree shutter [9].

This is the temporal equivalent of a camera lens's optical transfer function (OTF). Just as lens quality determines spatial frequency fidelity, shutter design determines temporal frequency fidelity. Both are modulation transfer functions; both determine what survives the sampling process.

---

## 2. Long Exposure vs. Fast Frame Rate

### 2.1 The Fundamental Tradeoff

Long exposure and fast frame rate sit at opposite ends of the temporal frequency tradeoff. They cannot both be maximized simultaneously — the photon budget is finite, and temporal integration competes with temporal resolution.

| Parameter | Long Exposure | Fast Frame Rate |
|---|---|---|
| Temporal integration | High (accumulates photons over extended window) | Low (brief integration window per frame) |
| Signal-to-noise ratio (SNR) | High (more photon counts per frame; Poisson noise averages down) | Low (shot noise dominates; fewer photons per frame) |
| Temporal resolution | Low (motion blur encodes time into spatial smear) | High (freezes motion at each frame instant) |
| Frequency content preserved | Bandlimited to f < 1/t_exp (natural LPF) | Nyquist limit = fps/2 (sharp cutoff) |
| Aliasing risk | Low (long exposure acts as anti-aliasing LPF) | High (insufficient pre-filter; requires mechanical or electronic shutter tuning) |
| Photon budget | Forgiving (sensor collects photons for entire window) | Tight (active illumination often required; gain increase adds noise) |
| Storage per unit time | Low (fewer frames per second = less data) | High (more frames = proportionally more data) |
| Use case | Astrophotography, still life, low-light surveillance, light painting | Sports, scientific imaging, machine vision, slow-motion playback |

### 2.2 SNR and the Square Root Law

The SNR advantage of long exposure follows directly from photon statistics. Photon arrival is a Poisson process, so the noise is the square root of the signal:

```
SNR_photon = signal / noise = N / sqrt(N) = sqrt(N)

Where N = number of photons collected during exposure

For exposure time t_exp at photon flux Phi (photons/second):
  N = Phi * t_exp
  SNR = sqrt(Phi * t_exp)

Doubling exposure time:
  SNR_new = sqrt(2 * Phi * t_exp) = sqrt(2) * SNR_old
  => +3 dB per doubling of exposure time
```

This is why astrophotography uses exposures of seconds to hours — the signal is faint (low Phi), and the only way to increase SNR without active illumination is to increase t_exp. Conversely, fast frame rate imaging (1000+ fps) requires intense illumination or accepts degraded SNR.

### 2.3 Motion Blur as Information Encoding

Long-exposure motion blur is not pure information loss. The blur kernel encodes the trajectory of moving objects during the exposure window. Computational photography exploits this:

```
Observed image I = true scene S convolved with blur kernel K + noise N:
  I = S * K + N

If K is known (from IMU data, coded exposure, or flutter shutter):
  S_hat = deconvolve(I, K)    (Wiener deconvolution, Richardson-Lucy, etc.)
```

Flutter shutter cameras (Raskar et al., 2006) intentionally modulate the shutter open/close pattern during a single exposure to produce a blur kernel whose Fourier transform has no zeros — making deconvolution well-conditioned. The coded exposure trades a small amount of SNR for a dramatically better-conditioned inverse problem.

This has a direct parallel in the VAV architecture: a chunk with motion blur is like a section with a compressed palette where multiple block states have been merged. The blur kernel is the compression function. If the kernel is known and invertible, the original content can be reconstructed — lossy compression becomes recoverable compression when the forward transform is preserved alongside the data (see M7 §3.1 round-trip identity; see M17 §1 lossless vs. lossy encoding).

---

## 3. Temporal Super-Resolution Beyond Nyquist

### 3.1 Multi-Channel Active Illumination (Ben-Ezra et al., 2024)

A 2024 paper from Tel Aviv University demonstrated temporal super-resolution (TSR) using multi-channel active illumination synchronized to the camera [7]. The key insight: by illuminating the scene with RGB LED channels modulated at different phases, each color channel captures a different temporal slice of the same event. The phase relationships between channels encode temporal information beyond the camera's native Nyquist limit.

```
System configuration:
  Camera frame rate:    10 fps
  Native Nyquist limit: 5 Hz
  LED modulation:       R, G, B channels at distinct phase offsets

Temporal super-resolution factor: up to 6x
  Effective detected range: up to 30 Hz (at 10 fps camera)

Mechanism:
  Each color channel sees the scene under illumination with a known phase.
  The phase difference between R, G, B creates temporal sub-sampling.
  Reconstruction algorithm combines channels to resolve aliased frequencies.

  Effective sampling rate = N_channels * f_camera
  Where N_channels = number of independently phased illumination channels
```

The method exploits the object's spectral response to structured illumination. Because RGB channels illuminate at different temporal phases, the sensor effectively captures three temporally offset images per frame. The reconstruction algorithm uses the known phase relationships to disambiguate aliased frequency content — recovering temporal information that a single-channel system at the same frame rate would irreversibly lose.

### 3.2 Performance Envelope

| Parameter | Value | Notes |
|---|---|---|
| Camera frame rate | 10 fps | Consumer-grade camera |
| Native Nyquist | 5 Hz | Standard sampling theory |
| TSR Nyquist (3 channels) | 15 Hz | 3x extension |
| TSR Nyquist (6 channels) | 30 Hz | 6x extension (maximum demonstrated) |
| Scene requirement | Must respond to RGB illumination | Transparent/non-reflective objects excluded |
| Reconstruction algorithm | Channel-phase demodulation + frequency synthesis | Requires calibrated phase offsets |
| Artifacts | Color cross-talk at extreme temporal frequencies | Increases with TSR factor |

The TSR factor is bounded by the number of independently controllable illumination channels and the object's spectral response diversity. A monochromatic object (same reflectance across R, G, B) provides no phase diversity, collapsing the TSR factor to 1x. Maximum benefit occurs with spectrally diverse scenes under well-separated illumination wavelengths [7].

### 3.3 Compressed Ultrafast Photography (CUP)

At the other extreme of temporal resolution, Compressed Ultrafast Photography achieves trillions of frames per second through spatiotemporal multiplexing on a single sensor exposure [8].

```
CUP operating principle:
  1. Scene is imaged through a streak camera
  2. Streak camera deflects photons temporally (different arrival times -> different positions)
  3. Single 2D sensor exposure encodes both spatial (x) and temporal (t) information
  4. Compressed sensing reconstruction separates spatial and temporal dimensions

Performance:
  Frame rate:         up to 10^13 fps (10 trillion)
  Temporal resolution: ~100 femtoseconds
  Spatial resolution:  Reduced (traded for temporal density)
  Applications:        Light-in-flight imaging, laser pulse propagation,
                       fluorescence lifetime mapping, shock wave dynamics
```

CUP inverts the normal resolution tradeoff: instead of many frames each at full spatial resolution, it captures one frame that encodes many temporal instants at reduced spatial resolution. The reconstruction relies on compressed sensing — the assumption that the spatiotemporal scene is sparse in some transform domain (typically wavelet or total variation). The sparsity prior allows recovery of more temporal samples than the sensor's spatial pixel count would naively permit.

### 3.4 Implications for Temporal Fidelity

TSR and CUP represent two strategies for exceeding the Nyquist limit:

| Strategy | Mechanism | Cost | Fidelity Gain |
|---|---|---|---|
| TSR (multi-channel) | Exploit spectral diversity to encode temporal phase | Requires active illumination; color cross-talk | Linear in channel count (up to 6x demonstrated) |
| CUP (compressed sensing) | Trade spatial resolution for temporal density | Spatial resolution degradation; reconstruction artifacts | Exponential in sparsity assumption (up to 10^6x) |
| Conventional (increase fps) | More frames per second | Proportional increase in data rate, storage, illumination | Linear in frame rate |

The VAV parallel: palette super-resolution. A section with a 16-entry palette has a Nyquist limit of 8 semantic categories. If the content requires 32 categories, the palette must grow — or a multi-section encoding (analogous to TSR's multi-channel approach) can distribute the vocabulary across adjacent sections, each handling a frequency band of the content (see M7 §3.5 vocabulary overflow solutions; see M12 §2 LOD multi-resolution).

---

## 4. Field Separation and Deinterlacing

### 4.1 Interlaced Video: Two Fields Per Frame

Interlaced video (NTSC, PAL) captures two fields per frame: odd-numbered scan lines in the first field, even-numbered in the second. Each field represents a temporal snapshot separated by half a frame period [10].

```
NTSC interlaced:
  Frame rate:  29.97 fps (30/1.001)
  Field rate:  59.94 fields/second
  Field 1:     Odd scan lines  (1, 3, 5, ..., 479)   at time t
  Field 2:     Even scan lines (2, 4, 6, ..., 480)   at time t + 1/59.94 s

  Each field: 240 active lines (half vertical resolution)
  Each field: full temporal snapshot (16.68 ms apart)

PAL interlaced:
  Frame rate:  25 fps
  Field rate:  50 fields/second
  Field 1:     Odd lines at time t
  Field 2:     Even lines at time t + 1/50 s = 20 ms apart

  Each field: 288 active lines
```

Interlacing was an engineering compromise: double the temporal sampling rate (60 fields/sec) at the original bandwidth of 30 frames/sec, by halving the spatial resolution of each temporal sample. This is exactly the CUP tradeoff in analog television — spatial resolution traded for temporal density.

### 4.2 Deinterlacing Methods

Field separation extracts the two fields as independent images. Deinterlacing reconstructs full-resolution progressive frames from interlaced fields. The four major methods:

| Method | Algorithm | Quality | Compute Cost | Artifacts |
|---|---|---|---|---|
| **Bob** | Each field independently interpolated to full height (line doubling or bicubic) | Low-medium | Minimal | Halved vertical resolution; shimmer on fine horizontal detail |
| **Weave** | Combine odd and even fields directly into one frame | Medium (static) | Minimal | Comb artifacts on moving objects (field temporal offset visible as horizontal tearing) |
| **Motion-adaptive** | Per-pixel decision: bob where motion detected, weave where static | Good | Moderate | Threshold sensitivity; misclassification causes localized artifacts |
| **Motion-compensated** | Full optical-flow estimation per field; warp field 2 to field 1 time, then merge | Excellent | High | Flow estimation errors cause warping artifacts in complex motion |

```
Motion-adaptive decision per pixel (x, y):

  field_diff(x, y) = |F1(x, y) - F2(x, y)|

  if field_diff(x, y) > threshold:
    output(x, y) = bob(F_current, x, y)     # motion detected: use single-field interpolation
  else:
    output(x, y) = weave(F1, F2, x, y)      # static: combine fields for full resolution

Motion-compensated (optical flow):

  1. Estimate motion vector MV(x, y) between F1 and F2
  2. Warp F2 to F1's temporal position: F2_warped = warp(F2, MV)
  3. Merge: output = blend(F1, F2_warped) at full resolution
  4. Fallback to bob where flow estimation confidence is low
```

### 4.3 Deinterlacing as Temporal Reconstruction

Deinterlacing is a temporal reconstruction problem: given two spatially incomplete samples at different time instants, reconstruct a spatially complete sample at one time instant. The quality hierarchy (bob < weave < motion-adaptive < motion-compensated) maps directly to reconstruction sophistication:

- **Bob:** Assumes no temporal information exists; reconstructs from spatial neighbors only.
- **Weave:** Assumes scene is static; treats both fields as simultaneous.
- **Motion-adaptive:** Adaptively selects between spatial-only and temporal-combined reconstruction.
- **Motion-compensated:** Models the scene's temporal evolution explicitly; corrects for it.

The VAV parallel: chunk reconstruction from partial data. When a RADOS object is partially degraded (see M13 §2 erasure coding), the reconstruction strategy follows the same hierarchy — from simple replication (bob-equivalent: spatial redundancy), through XOR parity (weave-equivalent: combine complementary fragments), to Reed-Solomon coding (motion-compensated equivalent: full algebraic reconstruction from any k-of-n fragments).

---

## 5. Color Space and Fourier Decomposition

### 5.1 Per-Channel FFT of Color Images

The Discrete Fourier Transform (DFT) and its fast implementation (FFT) operate independently per color channel. A color image I(x, y) with channels R, G, B is decomposed as:

```
F_R(u, v) = FFT_2D(R(x, y))
F_G(u, v) = FFT_2D(G(x, y))
F_B(u, v) = FFT_2D(B(x, y))

Where:
  (x, y) = spatial coordinates (pixel position)
  (u, v) = frequency coordinates (cycles per pixel)
  F(u, v) = complex-valued frequency coefficient (magnitude + phase)
```

In the frequency domain:
- **Low frequencies** (near origin) represent broad, slowly varying regions — background color, sky gradients, large surfaces.
- **High frequencies** (far from origin) represent edges, fine detail, texture, and noise.
- **DC component** F(0,0) = mean pixel value of the channel.

The magnitude spectrum |F(u, v)| shows which spatial frequencies are present. The phase spectrum angle(F(u, v)) encodes the position of features. Phase carries more perceptual information than magnitude — scrambling the phase of an image destroys recognizability, while scrambling the magnitude preserves structure.

### 5.2 Frequency-Domain Applications

| Application | Frequency-Domain Operation | Effect |
|---|---|---|
| Gaussian blur | Multiply spectrum by Gaussian envelope centered at origin | Attenuates high frequencies; smooth image |
| JPEG compression | 8x8 block DCT; quantize high-frequency coefficients to zero | Discards high-frequency detail below visibility threshold |
| Spectral repair | Isolate frequency band containing artifact; suppress or replace | Remove periodic interference (hum, banding) |
| Moire removal | Notch filter at alias frequency peaks | Eliminates pattern interference from sensor/print grid interaction |
| HDR tone mapping | Laplacian pyramid (multi-scale Fourier decomposition); compress dynamic range per octave | Maps wide dynamic range to displayable range while preserving local contrast |
| Edge detection | High-pass filter (suppress low frequencies, pass high) | Isolates edges and detail |
| Sharpening | Boost high-frequency coefficients (unsharp mask) | Enhances edges; amplifies noise if overdone |

### 5.3 The DCT and JPEG: Lossy Compression as Frequency Budgeting

JPEG compression operates on 8x8 pixel blocks, each independently transformed via the Discrete Cosine Transform (DCT) — a real-valued variant of the DFT. The 64 DCT coefficients are then quantized according to a quality-dependent quantization matrix:

```
JPEG pipeline per 8x8 block:
  1. RGB -> YCbCr color space (separate luma from chroma)
  2. Chroma subsampling: 4:2:0 discards 75% of chroma spatial resolution
  3. DCT: 8x8 spatial block -> 8x8 frequency coefficients
  4. Quantization: divide each coefficient by quantization matrix value, round to integer
     Q(u,v) = round(F(u,v) / QM(u,v))
  5. Entropy coding: Huffman or arithmetic coding of quantized coefficients

Quantization matrix (luminance, quality 50):
  [16  11  10  16  24  40  51  61]
  [12  12  14  19  26  58  60  55]
  [14  13  16  24  40  57  69  56]
  [14  17  22  29  51  87  80  62]
  [18  22  37  56  68 109 103  77]
  [24  35  55  64  81 104 113  92]
  [49  64  78  87 103 121 120 101]
  [72  92  95  98 112 100 103  99]

High-frequency coefficients (bottom-right) have large divisors -> quantized to zero
Low-frequency coefficients (top-left) have small divisors -> preserved with precision
```

This is frequency budgeting: the quantization matrix allocates bits to frequency bands based on perceptual importance. Low frequencies get more bits (smaller divisors = finer quantization). High frequencies get fewer bits (larger divisors = coarser quantization, often zeroed). The quality slider adjusts the overall budget.

### 5.4 Minecraft Mapping: Palette Cardinality as Spatial Entropy

Block palette cardinality encodes the spatial entropy of a chunk. This is the connection the M2 retrospective (section 5.1) demanded.

```
High-entropy chunk (many block types):
  Palette size: 80-128 entries
  BPE: 7-8 bits
  Shannon entropy: H ≈ 5-6 bits (skewed distribution)
  Frequency content: BROAD — many distinct block types at various spatial scales
  Analogue: high-detail image with edges, textures, and fine structure

Low-entropy chunk (solid stone):
  Palette size: 1-3 entries
  BPE: 0-4 bits (data omitted for single entry)
  Shannon entropy: H ≈ 0-1 bits
  Frequency content: NARROW — one or two block types, minimal spatial variation
  Analogue: solid-color image with near-zero frequency content
```

**The palette compression ratio is the chunk's frequency budget:**

```
Frequency budget = ceil(log2(palette_size))

A section with palette_size = 16 has a frequency budget of 4 bits.
  -> Can represent up to 16 distinct spatial "frequencies" (block type transitions)

A section with palette_size = 256 has a frequency budget of 8 bits.
  -> Can represent up to 256 distinct spatial variations

The JPEG analogy:
  JPEG quality slider  <->  palette_size
  Quantization matrix  <->  BPE calculation (max(4, ceil(log2(n))))
  DCT coefficients     <->  palette indices in packed long array
  8x8 block            <->  16x16x16 section
```

### 5.5 Formalizing the Nyquist-Palette Relationship

The M2 retrospective (section 5.1) stated: "The Nyquist theorem should be formalized against palette compression ratios: the palette must be at least twice the semantic frequency content of the corpus to avoid aliasing. This is testable."

Here is the formalization:

```
Definition: Semantic frequency content of a corpus section.

Let a corpus section S contain tokens drawn from a vocabulary V.
Let K = number of semantically distinct categories in S.
  (K is the number of meaning-bearing frequency bands in the content.)

The semantic Nyquist criterion:
  |P| >= 2 * K

Where |P| is the palette size (number of unique block states in the section).

If |P| < 2K, semantic aliasing occurs:
  - Distinct meanings are mapped to the same block state
  - Retrieval cannot distinguish between aliased tokens
  - Information is irreversibly lost (below the Nyquist floor)

If |P| >= 2K, the encoding is alias-free:
  - Every semantic category has at least 2 palette entries (margin for variant encoding)
  - Round-trip reconstruction preserves all K categories
  - The encoding function E is injective over the semantic domain

Testable prediction:
  For a fixed corpus section with K = 30 semantic categories:
    Palette size 60+: alias-free encoding, full retrieval accuracy
    Palette size 30-59: marginal encoding, degraded retrieval (some categories merged)
    Palette size <30: aliased encoding, retrieval quality drops sharply

  This can be measured by encoding a known corpus at varying palette sizes
  and evaluating retrieval precision/recall against ground truth.
```

The Shannon limit provides the complementary bound. The maximum information density per section is:

```
I_max = 4096 * H_max = 4096 * ceil(log2(|P|)) bits

For |P| = 16:  I_max = 4096 * 4  = 16,384 bits = 2 KiB
For |P| = 256: I_max = 4096 * 8  = 32,768 bits = 4 KiB
For |P| = 4096: I_max = 4096 * 12 = 49,152 bits = 6 KiB

Actual information content (Shannon entropy):
  I_actual = 4096 * H = -4096 * sum(p_i * log2(p_i))

Compression efficiency = I_actual / I_max
  If close to 1.0: palette is well-sized (tight frequency budget)
  If close to 0.0: palette is oversized (wasted frequency budget, like an image
                    encoded at unnecessarily high quality)
```

This bridges M7's palette entropy analysis (see M7 §3.2) to sampling theory: palette size is the sampling rate of semantic content, Shannon entropy is the actual frequency content, and the ratio between them determines whether the encoding is over-sampled (wasteful), critically sampled (efficient), or under-sampled (lossy).

---

## 6. Ceph/Minecraft Mapping: Temporal Fidelity in the Voxel Stack

### 6.1 Capture Rate as Write Throughput

In the VAV architecture, the temporal dimension maps to write operations over time. The "frame rate" of a voxel world is its write throughput — how many block changes per second the system can record.

| Imaging Concept | VAV/Ceph Equivalent | Mapping |
|---|---|---|
| Frame rate (fps) | RADOS write ops/sec | Determines temporal resolution of world state changes |
| Exposure time | Write batch window | How many changes are accumulated before commit |
| Nyquist frequency | Max detectable change rate | Half the write throughput = fastest reliably captured event |
| Temporal aliasing | Missed block changes | Changes faster than write throughput are lost or merged |
| Motion blur | Batch compression | Multiple changes in one write batch = averaged/final state only |
| Shutter angle | Batch window duration | Larger window = more changes captured but less temporal precision |
| Field (interlaced) | RADOS primary + replica | Two copies at slightly different timestamps |
| Deinterlacing | Replica reconciliation | Merge primary and replica into consistent state |

### 6.2 The Snapshot as Long Exposure

A Minecraft world save is a long exposure of the entire world state — every block position integrated over the entire history of changes since the last save. Only the final state survives; intermediate states are motion blur.

```
World save = temporal integral of all block changes since last save:

  W_saved(x, y, z) = last_value(block_changes(x, y, z, t0..t_save))

  All intermediate states between t0 and t_save are lost.
  This is a box filter (rectangular integration window) in the temporal domain.
  Temporal resolution = 0 (only final state preserved).
  Equivalent shutter angle = 360° (full integration).

Incremental saves (delta snapshots):
  W_delta_n(x, y, z) = changes between t_{n-1} and t_n only

  Temporal resolution = 1 / save_interval
  Nyquist limit = 1 / (2 * save_interval)

  A world that saves every 5 minutes has temporal Nyquist = 1/600 Hz
  -> Cannot resolve events faster than one per 10 minutes
```

For a RAG corpus, this means the ingest pipeline's batch interval determines what changes are captured. A corpus that re-indexes daily has a temporal Nyquist of 1/(2 * 86400) Hz = 5.8 microHz — it cannot detect content changes faster than once per two days. Real-time ingest pipelines with sub-second batching approach the temporal resolution of fast-frame-rate imaging.

### 6.3 Palette Evolution as Temporal Frequency Content

Over time, a section's palette changes as blocks are placed and removed. The rate of palette change is the section's temporal frequency content:

```
Palette change rate:
  dP/dt = number of unique block state additions/removals per unit time

Static section (deep underground stone):
  dP/dt ≈ 0 Hz  (palette never changes)
  Temporal frequency content: zero (DC only)
  Analogous to: still-life photograph

Active section (player building area):
  dP/dt ≈ 0.1-10 Hz  (new block types added as player builds)
  Temporal frequency content: moderate
  Analogous to: normal video footage

High-churn section (redstone machine, mob farm):
  dP/dt ≈ 10-100 Hz  (rapid block state changes)
  Temporal frequency content: high
  Analogous to: high-speed sports footage
```

The write throughput of the RADOS backend must satisfy the Nyquist criterion for the highest-churn sections:

```
Required write throughput >= 2 * max(dP/dt across all active sections)
```

If the storage backend cannot write fast enough, temporal aliasing occurs: block changes are lost or merged, and the world state becomes inconsistent (the voxel equivalent of the wagon-wheel effect).

### 6.4 FFT Frequency Bins and CRUSH Placement

The FFT decomposes a signal into frequency bins. Each bin corresponds to a specific frequency range. In the VAV architecture, the Morton code used for chunk addressing (see M9 §3 seed-space distance; see M12 §1 edge topology) creates a spatial frequency hierarchy:

```
Morton code interleaving (3D):
  Block position (x, y, z) -> Morton index M

  Low-order bits of M: high spatial frequency (local neighbors)
  High-order bits of M: low spatial frequency (region-level grouping)

CRUSH placement group mapping:
  PG = hash(Morton_prefix(M, depth)) mod num_PGs

  Depth 0: entire world -> single PG (DC component)
  Depth 1: 8 octants -> 8 PGs (fundamental frequency)
  Depth 2: 64 sub-octants -> 64 PGs (2nd harmonic)
  ...
  Depth N: 8^N regions -> PGs (Nth harmonic)
```

This means the CRUSH map is a frequency-domain decomposition of the world's address space. Low-frequency data (broad regions that change slowly) maps to stable PG assignments. High-frequency data (local changes in active areas) maps to PGs that handle fine-grained updates. The CRUSH map is the world's spatial transfer function.

### 6.5 Multi-Section Encoding as Temporal Super-Resolution

TSR uses multiple illumination channels to exceed the Nyquist limit. The VAV equivalent: use multiple RADOS objects at different temporal offsets to capture changes faster than any single object's write throughput permits.

```
Single-object temporal resolution:
  f_nyquist = write_throughput / 2

Multi-object TSR (N replicas with staggered write windows):
  f_nyquist_effective = N * write_throughput / 2

  Replica 1: captures changes at times t, t+T, t+2T, ...
  Replica 2: captures changes at times t+T/N, t+T+T/N, ...
  Replica 3: captures changes at times t+2T/N, t+2T+2T/N, ...

  Reconstruction interleaves replicas to achieve N× temporal resolution.
```

This is structurally identical to Ben-Ezra et al.'s RGB-channel TSR [7]. Each replica is a "color channel" with a known temporal phase offset. The reconstruction algorithm is deinterlacing (see §4.2) applied to RADOS replicas rather than video fields.

### 6.6 Cross-Reference Summary

| This Module (M14) | Cross-Referenced Module | Connection |
|---|---|---|
| Palette as frequency budget (§5.4-5.5) | M7 (Block & Chunk Data, file 11) §3.2 | Palette entropy = Shannon entropy; BPE = frequency ceiling; Nyquist formalized against palette size |
| FFT frequency bins and Morton code (§6.4) | M9 (PCG Seed Manifold, file 13) §3 | Morton code interleaving creates spatial frequency hierarchy; seed determinism constrains frequency structure |
| Per-channel FFT, color space (§5.1-5.2) | M15 (Color Fidelity) | ICC color space as frequency-domain mapping; per-channel processing applies to both image and voxel color data |
| STFT shared foundations (§5.1) | M16 (Audio Fidelity) | STFT = windowed FFT; identical decomposition applied to audio (time-frequency) vs. image (spatial-frequency) |
| Lossy vs. lossless encoding (§2.3, §5.3) | M17 (Serialization) | JPEG quantization matrix = serialization format's precision budget; lossless requires full palette preservation |
| Deinterlacing / replica reconciliation (§4.3, §6.5) | M13 (Backup, Security & Hot-Swap, file 17) §2 | Erasure coding reconstruction parallels motion-compensated deinterlacing |
| TSR multi-section vocabulary (§3.4) | M12 (Edge Topology & LOD, file 16) §2 | LOD multi-resolution = multi-section frequency distribution |

---

## 7. Sources

| ID | Reference |
|----|-----------|
| [5] | Nyquist, H. (1928). Certain topics in telegraph transmission theory. *Transactions of the AIEE*, 47(2), 617-644. |
| [6] | Shannon, C.E. (1949). Communication in the presence of noise. *Proceedings of the IRE*, 37(1), 10-21. |
| [7] | Ben-Ezra, M., et al. (2024). Temporal Super-Resolution Using a Multi-Channel Illumination Source. *Sensors*, 24(3), 857. doi:10.3390/s24030857 |
| [8] | Lai, Y., Marquez, M., & Liang, J. (2024). Tutorial on compressed ultrafast photography. *J. Biomed. Opt.*, 29(S1), S11524. doi:10.1117/1.JBO.29.S1.S11524 |
| [9] | Tessive LLC. Time Filter Technical Explanation. https://tessive.com/time-filter-technical-explanation |
| [10] | Imatest LLC. Nyquist Frequency, Aliasing, and Color Moire. https://www.imatest.com/docs/nyquist-aliasing/ |
| SRC-CHUNK | Minecraft Wiki. "Chunk format." https://minecraft.wiki/w/Chunk_format |
| SRC-SHANNON | Shannon, C.E. (1948). "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27(3), 379-423. |
