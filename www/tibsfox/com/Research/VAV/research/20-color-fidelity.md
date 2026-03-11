# M15: Color Fidelity — Photography, Calibration, Studio Setup

> **Module ID:** VAV-COLOR
> **Domain:** Color Science, ICC Profiling, RAW Processing & Studio Practice
> **Through-line:** *The color is the truth.* A photograph is not a picture — it is a measurement. Every pixel records the spectral power distribution of light that fell on that photosite during the exposure, filtered through a Bayer mosaic, compressed by a sensor's quantum efficiency curve, and delivered as a raw integer. The integer is meaningless without context. Color management is the discipline of preserving that context through every transform in the pipeline: from photon to photosite, from RAW file to working space, from monitor phosphor to print ink to web browser. The chain is fragile. Every device in the pipeline has its own gamut, its own response curve, its own lies. ICC profiles are the contracts that keep devices honest. DNG profiles are the camera-specific dictionaries that translate sensor language into human color. Studio lighting is the controlled illuminant that makes the translation repeatable. Without calibration, every image is a guess. With calibration, every image is evidence. In the VAV architecture, a Minecraft block palette is a color space, a texture pack is a gamut, and the palette-to-meaning mapping is an ICC profile by another name. The same discipline that makes a photograph truthful makes a voxel world legible.

---

## Table of Contents

1. [Color Management Architecture](#1-color-management-architecture)
2. [Color Space Hierarchy](#2-color-space-hierarchy)
3. [ICC Profiles — The Device Contract](#3-icc-profiles--the-device-contract)
4. [DNG Camera Profiles — Dual-Illuminant Transforms](#4-dng-camera-profiles--dual-illuminant-transforms)
5. [Camera Calibration Workflow](#5-camera-calibration-workflow)
6. [Studio Setup and Lighting](#6-studio-setup-and-lighting)
7. [RAW Processing Pipeline](#7-raw-processing-pipeline)
8. [Hi-Fi Image Editing Principles](#8-hi-fi-image-editing-principles)
9. [Minecraft / Ceph Mapping](#9-minecraft--ceph-mapping)
10. [Cross-Reference](#10-cross-reference)
11. [Sources](#11-sources)

---

## 1. Color Management Architecture

### 1.1 The End-to-End Pipeline

A color-managed workflow requires calibration at every device interface. The pipeline has five stages, and each stage is a transform between two color representations:

```
Camera sensor (device RGB)
  → RAW processor (demosaic + profile)
    → Working color space (scene-referred linear)
      → Monitor profile (display-referred)
        → Output profile (print / web / archival)
```

At every boundary, a profile mediates the translation. Without the profile, the receiving device interprets the color values according to its own native response — which is guaranteed to differ from the sending device. The monitor does not know what the camera saw. The printer does not know what the monitor showed. Profiles carry the ground truth through the chain. [21]

### 1.2 Why Calibration Matters

The human eye adapts to ambient illumination (chromatic adaptation). A white sheet of paper looks white under tungsten, under daylight, under fluorescent. Cameras do not adapt — they record the actual spectral content. A photograph of a white card under 3200K tungsten light contains orange data. White balance corrects this at rendering time, but white balance is a single global operation — it shifts the entire image by a uniform factor per channel. It does not correct for non-linear sensor response, per-channel crosstalk, or spectral metamerism (two colors that look identical under one illuminant but differ under another).

ICC profiling corrects what white balance cannot: the camera's unique spectral sensitivity function. Every camera sensor has a different quantum efficiency curve per channel (how efficiently it converts photons at each wavelength to electrons). Two cameras photographing the same scene under the same light will produce different RGB values. The ICC profile maps each camera's specific response to a device-independent reference space, making the output of any calibrated camera comparable to any other. [22]

### 1.3 Device-Independence — The Core Principle

Color management exists because devices lie. Every device in the imaging chain has a different native color space:

- A camera sensor has a gamut defined by its filter dyes and silicon response
- A monitor has a gamut defined by its phosphor or LED primaries
- A printer has a gamut defined by its ink set and paper stock
- A projector has a gamut defined by its light source and color wheel

None of these gamuts are the same. None of them match the human visual system. The ICC framework creates a device-independent bridge: every device's native colors are mapped to a Profile Connection Space (PCS), and from the PCS they are mapped to the destination device. The PCS is the Rosetta Stone — it speaks the language of human perception, not hardware. [22]

---

## 2. Color Space Hierarchy

### 2.1 What a Color Space Is

A color space is a coordinate system for color. It defines three things:

1. **Primaries** — the red, green, and blue basis vectors that span the gamut (the set of representable colors)
2. **White point** — the specific chromaticity that is defined as "white" (typically D65 at 6504K)
3. **Transfer function** — the mapping between linear light intensity and encoded value (gamma curve or perceptual transfer function)

The choice of color space is a precision-versus-range tradeoff. A wider gamut can represent more colors but spreads the same bit depth across a larger perceptual volume, reducing the precision per color step. A narrower gamut concentrates precision on a smaller range. [22]

### 2.2 Color Space Comparison Table

| Color Space | CIExy Gamut Coverage | White Point | Gamma / TRC | Bit Depth (typical) | Primary Use |
|-------------|---------------------|-------------|-------------|---------------------|-------------|
| sRGB | ~35% | D65 (6504K) | ~2.2 (piecewise linear + power) | 8-bit | Web, consumer displays, JPEG default |
| Adobe RGB (1998) | ~50% | D65 | 2.2 (pure power) | 8-bit or 16-bit | Print prepress, CMYK-bound workflows |
| ProPhoto RGB | ~90% | D50 (5003K) | 1.8 (pure power) | 16-bit mandatory | Internal working space, RAW processing |
| Display P3 | ~45% | D65 | ~2.2 (sRGB TRC) | 8-bit or 10-bit | Apple displays, HDR content, cinema |
| Rec. 709 | ~35% (≈sRGB primaries) | D65 | BT.1886 (2.4 effective) | 8-bit | HDTV broadcast |
| Rec. 2020 | ~75% | D65 | PQ or HLG (HDR) | 10-bit or 12-bit | UHD/4K broadcast, HDR cinema |
| ACES (AP0) | ~100% (exceeds CIExy) | ACES white (~D60) | Linear | 16-bit float (half) | Motion picture pipeline, VFX |
| CIE XYZ | 100% (by definition) | E (equal energy) | Linear | Float | Mathematical reference, PCS |

### 2.3 The Frequency-Domain Insight

Color space selection is a frequency-domain decision. The visible spectrum runs from approximately 380 nm to 780 nm — a continuous signal. A color space samples this signal with three basis functions (the spectral sensitivities of the primaries). A wider gamut uses primaries that are more spectrally pure (closer to monochromatic), which means the basis functions span a wider region of the spectral locus. This preserves more spectral information at the cost of a larger address space.

The analogy to audio sampling is direct:
- **sRGB** is like 44.1 kHz / 16-bit — sufficient for consumer delivery, clips extended range
- **Adobe RGB** is like 48 kHz / 24-bit — headroom for professional work
- **ProPhoto RGB** is like 96 kHz / 32-bit float — captures everything the sensor saw, requires careful handling to avoid quantization artifacts in narrow-gamut output
- **ACES** is like DSD or 192 kHz / 32-bit float — archival-grade, scene-referred, designed for future-proof interchange

The key principle: always work in the widest space your pipeline can handle, and convert to narrower spaces only at the final output stage. Down-conversion is a lossy operation — gamut mapping discards colors outside the destination space. You cannot recover them later. [22] [23]

---

## 3. ICC Profiles — The Device Contract

### 3.1 What an ICC Profile Contains

An ICC profile is a binary file (extension `.icc` or `.icm`) containing a set of tagged data structures that describe a color device's behavior. The International Color Consortium specification (currently ICC.1:2022, version 4.4) defines the format. [22]

The critical tags in a camera/scanner input profile:

| Tag | Signature | Purpose |
|-----|-----------|---------|
| Profile Description | `desc` | Human-readable device name |
| Media White Point | `wtpt` | The XYZ tristimulus of the device's white under the profiling illuminant |
| Red/Green/Blue Matrix Column | `rXYZ`, `gXYZ`, `bXYZ` | 3x3 matrix: device RGB → PCS XYZ (for matrix-based profiles) |
| Red/Green/Blue TRC | `rTRC`, `gTRC`, `bTRC` | Tone reproduction curves: linearize the device's transfer function |
| A2B0 / B2A0 | `A2B0`, `B2A0` | Multi-dimensional LUT transforms (for LUT-based profiles): device → PCS and PCS → device |
| Chromatic Adaptation | `chad` | Bradford matrix adapting from profile illuminant to PCS illuminant (D50) |

### 3.2 Profile Connection Space (PCS)

The PCS is the neutral territory where all device colors meet. ICC v4 defines the PCS as **CIEXYZ** (for matrix-based profiles) or **CIELAB** (for LUT-based profiles), both under a **D50 illuminant** (5003K). The choice of D50 is historical — it is the standard illuminant for graphic arts and print evaluation.

The PCS is perceptually uniform enough for practical color matching but not mathematically uniform (CIELAB has known non-uniformities, addressed by CIEDE2000). For VAV's purposes, the PCS is the "canonical address space" — every device color maps to a PCS coordinate, and every PCS coordinate maps to a device color. This is the same relationship as Ceph's CRUSH map: the PCS is the placement function that routes colors to devices.

### 3.3 Matrix-Based vs. LUT-Based Profiles

**Matrix-based profiles** use a 3x3 matrix plus per-channel tone curves. They are compact (~1-4 KB), fast to compute, and sufficiently accurate for cameras and monitors with well-behaved (near-linear) response functions. The transform is:

```
[X]   [rXYZ.x  gXYZ.x  bXYZ.x]   [linearR]
[Y] = [rXYZ.y  gXYZ.y  bXYZ.y] × [linearG]
[Z]   [rXYZ.z  gXYZ.z  bXYZ.z]   [linearB]

where linearR = TRC_R(deviceR), etc.
```

**LUT-based profiles** use multi-dimensional lookup tables (typically 33x33x33 or 17x17x17 grid points with trilinear interpolation). They can model arbitrary non-linear response functions, including printers with ink-interaction effects. They are larger (100 KB - 2 MB) and slower to compute.

For camera profiling, matrix-based profiles are standard. The camera's spectral response is well-approximated by a linear transform from sensor RGB to XYZ, plus per-channel gamma curves. The 3x3 matrix captures the chromatic adaptation and spectral sensitivity correction; the TRCs capture the non-linear sensor response. [22]

### 3.4 Rendering Intents

When the source gamut is larger than the destination gamut, some colors cannot be reproduced. The ICC profile specifies four rendering intents for handling out-of-gamut colors:

| Rendering Intent | Behavior | Use Case |
|-----------------|----------|----------|
| Perceptual | Compress entire source gamut into destination gamut; preserves relative color relationships | Photography to print/web — maintains "look" |
| Relative Colorimetric | Map colors within destination gamut identically; clip out-of-gamut to nearest boundary | Proofing — accurate reproduction of in-gamut colors |
| Absolute Colorimetric | Same as relative, but also matches the source white point (no white point adaptation) | Simulating one medium on another (e.g., newsprint on glossy) |
| Saturation | Maximize saturation in destination gamut; sacrifices accuracy for vividness | Business graphics, charts, logos |

For photographic work, **Perceptual** is the default choice for output. For archival conversion between working spaces, **Relative Colorimetric** preserves accuracy. [22]

---

## 4. DNG Camera Profiles — Dual-Illuminant Transforms

### 4.1 What a DNG Profile Is

Adobe's DNG (Digital Negative) specification includes a camera profiling system that is distinct from ICC. A DNG camera profile is embedded in the DNG file itself (as TIFF/EP metadata tags) or stored as an external `.dcp` file. It describes the camera's color response using one or two 3x3 color matrices plus optional per-hue, per-saturation adjustments (the "HueSatMap"). [23]

### 4.2 Dual-Illuminant Model

Most DNG profiles are **dual-illuminant**: they contain two complete sets of color matrices, one for each of two standard illuminants:

| Illuminant | Color Temp | Description | Standard |
|-----------|------------|-------------|----------|
| Standard Illuminant A | 2856K | Tungsten/incandescent (warm, orange-biased) | CIE |
| D65 | 6504K | Average daylight (cool, blue-biased) | CIE |

At processing time, Adobe Camera RAW (ACR) / Lightroom reads the image's color temperature metadata (from the EXIF or the user's white balance selection) and **interpolates** between the two matrices:

```
M_effective = lerp(M_A, M_D65, t)

where t is derived from the image's correlated color temperature (CCT):
  t = 0.0 at 2856K (pure Illuminant A)
  t = 1.0 at 6504K (pure D65)
  intermediate CCTs interpolate linearly in reciprocal color temperature (MRed)
```

This dual-illuminant approach handles the fact that a camera's spectral response varies with illuminant color temperature — blue and red channel crosstalk changes as the illuminant's spectral power distribution shifts. A single matrix would be accurate at only one color temperature. Two matrices, interpolated, cover the practical range of photographic illuminants (roughly 2000K-25000K). [23]

### 4.3 HueSatMap — Per-Hue Correction

Beyond the 3x3 matrix, DNG profiles can include a HueSatMap: a 3D lookup table indexed by hue, saturation, and value (HSV). Each entry specifies a hue shift, saturation scale, and value scale. This handles colors where the linear matrix produces unacceptable errors — typically skin tones, foliage greens, and saturated blues.

The HueSatMap is optional. Profiles generated by X-Rite or Calibrite software include it; profiles generated by manual matrix optimization may omit it.

### 4.4 DNG vs. ICC for Camera Work

| Property | DNG Profile (.dcp) | ICC Profile (.icc) |
|----------|-------------------|---------------------|
| Illuminant model | Dual-illuminant (interpolated) | Single illuminant |
| Embedding | In DNG metadata or external .dcp | External .icc file |
| Software support | Lightroom, ACR, DNG-compatible RAW processors | CaptureOne, PhaseOne, Photoshop (assign profile) |
| Per-hue correction | HueSatMap (3D LUT in HSV) | LUT-based profiles only (A2B/B2A tags) |
| Matrix size | 3x3 per illuminant (two matrices) | 3x3 (matrix) or nxnxn LUT |
| Typical accuracy (ΔE) | 1.5-3.0 (24-patch target) | 1.0-2.5 (24-patch target) |
| File size | 2-50 KB | 1 KB - 2 MB |

For mixed-illuminant field photography, DNG profiles are superior because of the dual-illuminant interpolation. For controlled studio work under a single known illuminant, ICC profiles can achieve slightly lower ΔE because the single matrix is optimized for exactly one spectral condition. [21] [23]

---

## 5. Camera Calibration Workflow

### 5.1 Equipment Required

- **Calibration target:** X-Rite ColorChecker Classic (24-patch) or X-Rite ColorChecker Digital SG (140-patch)
  - 24-patch: 6 rows x 4 columns. Top two rows: chromatic colors. Third row: primaries and secondaries. Bottom row: grayscale ramp (black to white, 6 steps)
  - 140-patch: 10 rows x 14 columns. Includes skin tones, foliage, sky, saturated primaries, neutral ramp. Provides denser sampling for LUT-based profiles
- **Profiling software:** Calibrite PROFILER (successor to X-Rite ColorChecker Camera Calibration) or open-source alternatives (ArgyllCMS + DCamProf)
- **Camera:** Any digital camera shooting RAW
- **Lighting:** Controlled, single-source, known color temperature (see Section 6)

### 5.2 The 7-Step Protocol

| Step | Action | Technical Detail |
|------|--------|-----------------|
| 1 | Photograph target under controlled illumination | D65/studio flash preferred. Avoid fluorescent (narrow-band emission peaks cause metamerism). Avoid LED panels unless CRI > 95 and spectral curve verified. Single source; no ambient contamination. |
| 2 | Verify white patch exposure | White patch RGB values: 180-242 per channel (ideally ~235). Below 180 = underexposed (noise dominates). Above 242 = clipped highlights (lost data). Check histogram — the white patch should be near but not at the right edge. |
| 3 | Export as 16-bit linear TIFF | RAW processor settings: no color correction, no white balance adjustment, linear tone curve, 16-bit output, no sharpening, no noise reduction. The goal is to deliver the sensor's native response as faithfully as possible. |
| 4 | Import into profiling software | Calibrite PROFILER or X-Rite software. Select camera model. Select target type (24-patch or 140-patch). |
| 5 | Software detects patches | Auto-detection locates the 24 (or 140) color patches in the image. Manual adjustment if auto-detection fails (e.g., tilted or partially obscured target). |
| 6 | Compute profile | Software computes the 3x3 matrix transform minimizing ΔE error across all patches. The optimization target is typically CIEDE2000 (perceptually weighted). Output: ICC profile (`.icc`) for CaptureOne/Photoshop workflows, or DNG profile (`.dcp`) for Lightroom/ACR. Report includes per-patch ΔE and average ΔE. |
| 7 | Apply profile | Assign the profile to all images captured under identical lighting conditions. If lighting changes (different power, different modifier, different color temperature), re-profile. A profile is valid only for the specific sensor + illuminant combination it was created for. |

### 5.3 White Balance vs. ICC Calibration

These are independent operations that address different problems:

| Operation | What It Corrects | When Applied | Scope |
|-----------|-----------------|--------------|-------|
| White balance | Global color temperature shift (illuminant color cast) | RAW decode time (rendering parameter) | Uniform per-channel multiplier |
| ICC/DNG profile | Camera's spectral response errors (per-wavelength sensitivity deviation from ideal) | After white balance, before output conversion | 3x3 matrix + optional per-hue LUT |

White balance says: "the light was 3200K, shift everything to compensate." The ICC profile says: "this camera's blue channel is 8% too sensitive at 460 nm and 3% too weak at 490 nm relative to the standard observer — here is the correction matrix." Both are necessary. Neither substitutes for the other. [21] [22]

### 5.4 Validation — ΔE Acceptance Criteria

After profiling, validate the result by photographing the target again under the same conditions, applying the new profile, and measuring the ΔE between the corrected image patches and the target's reference values:

| ΔE (CIEDE2000) | Interpretation |
|----------------|----------------|
| < 1.0 | Imperceptible to trained observer — excellent |
| 1.0 - 2.0 | Perceptible upon close inspection — good (typical for 24-patch) |
| 2.0 - 3.5 | Noticeable at a glance — acceptable for general photography |
| 3.5 - 5.0 | Obvious color difference — re-profile or check lighting |
| > 5.0 | Unacceptable — lighting contamination, target degradation, or workflow error |

The 24-patch target typically achieves average ΔE 1.5-2.5. The 140-patch target achieves average ΔE 1.0-1.8 because the denser sampling provides better constraint on the optimization. [21]

---

## 6. Studio Setup and Lighting

### 6.1 Light Quality Hierarchy for Color Fidelity

Not all light sources are equal for color-critical work. The hierarchy reflects spectral completeness, consistency, and predictability:

| Tier | Source | CCT | CRI | Spectral Character | Notes |
|------|--------|-----|-----|-------------------|-------|
| **Best** | Studio strobe / flash | ~5500K (daylight) | 95-98 | Full-spectrum continuous (xenon arc) | Consistent shot-to-shot; no warm-up drift; ~1/1000s effective duration freezes subject |
| **Good** | High-CRI LED panel (CRI > 95) | 3200K-5600K (tunable) | 95-98 | Near-continuous (verify — some LEDs have narrow-band spikes at 450 nm blue and gap at 480 nm cyan) | Must verify spectral curve with spectrometer; "CRI > 95" alone is insufficient — CRI averages 8 test color samples and can hide narrow-band deficiency |
| **Acceptable** | Tungsten / halogen | 2700-3400K | 99-100 | Perfectly continuous blackbody curve | Full-spectrum but low CCT; strong orange/red bias requires large white balance shift; consistent and predictable; generates heat |
| **Avoid** | Standard fluorescent | ~4100K (varies) | 62-82 | Narrow-band emission (mercury lines at 405, 436, 546, 578 nm + phosphor peaks) | Severe metameric failure; colors that look correct to the eye can be wildly wrong in photographs |
| **Avoid** | Mixed sources | Multiple | Varies | Different CCTs in different regions of the frame | Uncorrectable in post — white balance is a global operation; mixed illuminants create per-region color casts that cannot be removed with a single matrix |

### 6.2 CRI — Why the Number Lies

The Color Rendering Index (CRI, formally Ra) is calculated by averaging the color rendering fidelity across only 8 test color samples (R1-R8), all of which are moderate-saturation pastels. It does not include saturated reds (R9), which are critical for skin tones and many natural materials. A light source can score CRI 95 while rendering saturated reds poorly.

**TM-30** (IES TM-30-20) is the modern replacement: it uses 99 test color samples across the full gamut and reports both fidelity (Rf, analogous to CRI) and gamut (Rg, a measure of saturation shift). For color-critical work, demand both CRI > 95 AND R9 > 90, or use TM-30 Rf > 90 with Rg between 97 and 103. [21]

### 6.3 Composition Requirements for Calibration Targets

When photographing a color calibration target, the setup must satisfy:

| Requirement | Specification | Why |
|-------------|---------------|-----|
| Target fills ≥20% of frame | At least 1/5 of the sensor area devoted to the target | Sufficient pixel density per patch for reliable color measurement |
| Optical axis perpendicular | Camera sensor plane parallel to target plane | Avoids foreshortening, which causes non-uniform illumination across patches and geometric distortion |
| Uniform illumination | < 0.5 stop falloff across target area | Illumination gradient introduces per-patch exposure variation that the profiling software cannot distinguish from color error |
| No specular reflections | Matte/diffuse target surface; light angle avoids glare | Specular reflections add the light source's color to the patch, corrupting the measurement |
| Controlled ambient | No bounce light from colored walls/surfaces | Colored ambient light contaminates patches with the wall's reflected color — the profile will "correct" for a contamination that is not present in subsequent images |
| Lens selection | Avoid extreme wide-angle (< 35mm equivalent) | Wide-angle lenses introduce vignetting and chromatic aberration at frame edges; calibration target should be in the center 60% of the frame |

### 6.4 Studio Setup Diagram

```
                     ┌─────────────────────┐
                     │  CALIBRATION TARGET  │
                     │    (ColorChecker)    │
                     │                      │
                     │  perpendicular to    │
                     │  camera optical axis │
                     └──────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
              ▼                 │                  ▼
     ┌─────────────┐           │        ┌─────────────┐
     │ KEY LIGHT   │           │        │ FILL LIGHT  │
     │ (strobe +   │           │        │ (optional,  │
     │  diffuser)  │           │        │  same CCT)  │
     │  45° left   │           │        │  45° right  │
     └─────────────┘           │        └─────────────┘
                                │
                     ┌──────────▼──────────┐
                     │      CAMERA         │
                     │  (tripod, manual    │
                     │   exposure, RAW)    │
                     └─────────────────────┘

  Room: neutral gray walls (18% gray ideal)
  Distance: key light 1.5-2m from target
  Modifier: softbox or beauty dish (broad, even)
  Power: consistent (manual mode, not ETTL/TTL)
  Ambient: eliminated or negligible (<2 stops below key)
```

---

## 7. RAW Processing Pipeline

### 7.1 What a RAW File Is

RAW files are **not images**. They are sensor data — a grid of integer values, one per photosite, recording the charge accumulated during exposure. Most camera sensors use a Bayer color filter array (CFA): a 2x2 repeating pattern of R, G, G, B filters over the photosites. Each photosite records only one color channel. The full-color image does not exist until demosaicing interpolates the missing channels. [22]

Alternative CFA patterns exist:
- **X-Trans** (Fujifilm): 6x6 repeating pattern with more green samples; reduces moiré without optical low-pass filter
- **Quad Bayer** (smartphone sensors): 2x2 sub-pixels per color, binned for sensitivity or split for resolution
- **Foveon** (Sigma): Three vertically stacked silicon layers, each absorbing a different wavelength band — true per-pixel RGB without demosaicing (discontinued in practice)

### 7.2 The Complete RAW Processing Pipeline

```
RAW sensor data (12-16 bit per photosite)
  │
  ├─ 1. BLACK LEVEL SUBTRACTION
  │     Subtract the sensor's dark current offset (typically 256-1024 DN)
  │     This establishes true zero; without it, shadows are lifted and noisy
  │
  ├─ 2. LINEARIZATION
  │     Some sensors have non-linear response at extremes
  │     Apply per-channel linearization LUT if camera provides one
  │
  ├─ 3. HOT/DEAD PIXEL CORRECTION
  │     Flag photosites with values > threshold or == 0
  │     Replace with median of same-channel neighbors
  │
  ├─ 4. DEMOSAICING (Bayer Interpolation)
  │     Input: mosaic of single-channel values (RGGB)
  │     Output: full RGB triplet at every pixel
  │     Algorithms: bilinear (fast, artifacts), VNG (Variable Number of Gradients),
  │                 AHD (Adaptive Homogeneity-Directed), LMMSE (least-squares),
  │                 AMaZE (libraw/RawTherapee — high quality, slow)
  │     Artifact: zippering (color fringes at high-contrast edges)
  │
  ├─ 5. WHITE BALANCE
  │     Multiply R, G, B channels by illuminant-derived scalars
  │     R' = R × (Gref/Rref),  B' = B × (Gref/Bref)  (green channel as reference)
  │     This is a rendering decision, not a correction — it interprets the illuminant
  │
  ├─ 6. CAMERA PROFILE MATRIX (ICC or DNG)
  │     Apply 3×3 matrix transform: camera RGB → XYZ (or PCS)
  │     For DNG dual-illuminant: interpolate between M_A and M_D65
  │     For ICC: apply TRC (linearize) then matrix multiply
  │     This is the spectral correction — the camera's lies become truth
  │
  ├─ 7. NOISE REDUCTION
  │     Performed in linear light (before tone curve)
  │     Noise model: Poisson (photon shot noise) + Gaussian (read noise)
  │     Poisson: variance = signal (noise increases with brightness, but SNR improves)
  │     Algorithms: wavelet shrinkage, BM3D (Block-Matching 3D), NLMeans
  │     Must balance noise removal against detail preservation
  │
  ├─ 8. TONE CURVE (Linear → Perceptual)
  │     Linear light has most of its data concentrated in highlights
  │     Tone curve redistributes values to match human perception
  │     Standard: sRGB TRC (linear below 0.0031308, power curve above)
  │     Film emulation curves: S-curve with shoulder roll-off and toe lift
  │     This is where the image becomes "viewable" — linear data looks dark
  │
  ├─ 9. COLOR SPACE CONVERSION
  │     Working space (ProPhoto RGB) → Output space (Adobe RGB or sRGB)
  │     Apply rendering intent (perceptual for photography)
  │     Gamut mapping: compress out-of-gamut colors into destination gamut
  │     Embed destination ICC profile in output file
  │
  └─ 10. QUANTIZATION AND OUTPUT
        16-bit preservation: TIFF or DNG (archival, editing)
        8-bit quantization: JPEG (delivery, web)
        8-bit = 256 levels per channel = 16.7M colors
        16-bit = 65,536 levels per channel = 281 trillion colors
        The 8-bit quantization is lossy — banding appears in smooth gradients
        if the working space is too wide for 8-bit (ProPhoto at 8-bit = visible banding)
```

### 7.3 Bit Depth and Quantization

| Bit Depth | Levels per Channel | Total Colors | Gradient Steps (8-stop range) | Use |
|-----------|-------------------|--------------|-------------------------------|-----|
| 8-bit | 256 | 16.7 million | 32 per stop | JPEG delivery, web, consumer |
| 10-bit | 1,024 | 1.07 billion | 128 per stop | HDR display, video |
| 12-bit | 4,096 | 68.7 billion | 512 per stop | Entry-level RAW cameras |
| 14-bit | 16,384 | 4.4 trillion | 2,048 per stop | Professional RAW cameras |
| 16-bit | 65,536 | 281 trillion | 8,192 per stop | TIFF working files, ProPhoto RGB |
| 32-bit float | Continuous | Continuous | Continuous | EXR, HDR compositing, ACES |

The "gradient steps per stop" column reveals why bit depth matters: an 8-bit file has only 32 distinguishable levels in the darkest stop of a photograph. Push the shadows in post-processing by +2 stops, and you are working with 8 levels — visible banding is inevitable. A 14-bit RAW file has 2,048 levels in the same stop, which survives significant post-processing without banding. [22]

---

## 8. Hi-Fi Image Editing Principles

### 8.1 The Preservation Hierarchy

Hi-fi image editing follows a principle: maximize the fidelity of each transform by preserving precision at every stage:

1. **Shoot RAW** — preserves the sensor's full dynamic range and spectral data
2. **Process at 16-bit** — avoids quantization artifacts during mathematical operations
3. **Work in ProPhoto RGB** — the widest standard working space; contains the full gamut of most camera sensors
4. **Apply corrections in linear light where possible** — noise reduction, exposure adjustment, and color grading in linear light avoid the perceptual non-linearity of gamma-encoded spaces
5. **Convert to output space last** — delay gamut compression until the final output stage
6. **Embed the ICC profile in the output file** — ensures correct interpretation by every downstream device
7. **Never re-compress a JPEG** — each JPEG encode/decode cycle is lossy; work from RAW or TIFF originals

### 8.2 Destructive Operations to Avoid

| Operation | Why It Destroys Data | Alternative |
|-----------|---------------------|-------------|
| Working in 8-bit | Quantization after every operation; rounding errors accumulate | Work in 16-bit, convert to 8-bit only at final output |
| Working in sRGB | Gamut clipping of saturated colors; shadow posterization | Work in ProPhoto RGB (16-bit), convert to sRGB at output |
| Applying tone curve before noise reduction | Tone curve amplifies shadow noise non-linearly | Denoise in linear light, then apply curve |
| Multiple JPEG saves | Each save re-quantizes DCT coefficients | Work from RAW/TIFF; export JPEG once at the end |
| Resizing before color grading | Resampling averages pixel values, softening color transitions | Grade at full resolution, resize at output |
| Sharpening before noise reduction | Sharpening amplifies noise | Denoise first, sharpen last |

### 8.3 Non-Destructive Editing Paradigm

Modern RAW processors (Lightroom, CaptureOne, DarkTable, RawTherapee) implement non-destructive editing: the original RAW file is never modified. All edits are stored as metadata (XMP sidecar files in Lightroom, session databases in CaptureOne). The final image is rendered from the RAW data plus the edit instructions at export time. This means:

- The RAW file is the archival master — it survives any number of re-edits
- Edit instructions are small (a few KB per image) compared to the output
- Multiple outputs (web, print, social media) can be generated from the same RAW + edit set
- The edit history is a complete record of every transform applied

This is directly analogous to version control: the RAW file is the initial commit, each edit is a delta, and the export is a build artifact. [23]

---

## 9. Minecraft / Ceph Mapping

### 9.1 The Block Palette as Color Space

In Minecraft, every chunk stores a **block palette** — a list of the block types present in that chunk's section. Each voxel references a palette index. The palette is the chunk's vocabulary; the indices are the words. This structure is directly analogous to a color space:

| Color Management Concept | Minecraft/VAV Equivalent | Detail |
|--------------------------|--------------------------|--------|
| Color space gamut | Block palette | The set of representable values; palette size = gamut size |
| Color value (R,G,B) | Block state (type + properties) | The specific state within the gamut |
| Gamut size (% of CIExy) | Palette cardinality | Number of distinct block types; wider palette = wider gamut |
| Bit depth (8/16/32-bit) | Palette index bit width | `ceil(log2(palette_size))` bits per voxel; wider palette = more bits per voxel |
| Quantization error | Palette approximation error | When the desired block type is not in the palette, the nearest palette entry substitutes — this is gamut mapping |
| Dithering | Block mixing / checkerboard patterns | Alternating two block types to simulate an intermediate color/meaning, just as Floyd-Steinberg dithering approximates continuous tone |

### 9.2 Texture Pack Resolution as Spatial Sampling

The texture pack's resolution (16x16, 32x32, 64x64, 128x128 pixels per block face) is the spatial sampling resolution of the visual encoding:

| Texture Resolution | Pixels per Block Face | Visual Information Density | Ceph Object Size (per face, uncompressed) | Analogy |
|-------------------|-----------------------|---------------------------|-------------------------------------------|---------|
| 16x16 | 256 | Low — iconic, readable at distance | 768 bytes (RGB) | 44.1 kHz / 16-bit audio (CD quality) |
| 32x32 | 1,024 | Medium — recognizable detail | 3 KB | 48 kHz / 24-bit audio (professional) |
| 64x64 | 4,096 | High — surface texture visible | 12 KB | 96 kHz / 24-bit audio (high-res) |
| 128x128 | 16,384 | Very high — near-photographic | 48 KB | 192 kHz / 32-bit float (archival) |

The block itself is 1 meter^3 in Minecraft's coordinate system. At 16x16, each texel represents ~6.25 cm of surface. At 128x128, each texel represents ~0.78 cm. Higher resolution preserves more surface detail but increases storage and bandwidth proportionally — the same tradeoff as wider color spaces and higher bit depths. [SRC-RESPACK]

### 9.3 ICC Profile ≡ Palette-to-Meaning Mapping

An ICC profile translates between a device's native color values and a device-independent meaning (the PCS). In VAV:

```
ICC PIPELINE:                          VAV PIPELINE:

Camera sensor RGB                      Document (raw knowledge)
  → ICC profile (device → PCS)           → Embedding model (content → vector)
    → Working space (PCS → linear)          → Block selection (vector → block state)
      → Monitor profile (linear → display)    → Texture binding (state → visual)
        → Perceived color                       → Rendered voxel
```

The **ICC profile** is the **palette-to-meaning mapping**. It translates between the block's visual representation (what you see when you look at it in the rendered world) and its semantic category (what knowledge it represents in the corpus). Without this mapping, a diamond block is just blue pixels. With the mapping, a diamond block means "high-confidence, semantically dense knowledge node."

### 9.4 RAW ≡ DNG — Maximum Fidelity Format

A RAW/DNG file preserves the sensor's full data before any lossy rendering decision. In VAV:

| Photography Concept | VAV Equivalent | Preservation |
|--------------------|----------------|--------------|
| RAW / DNG file | Original document + embedding vector (full precision) | All spectral/semantic information preserved |
| 16-bit TIFF | Block state + NBT metadata (full fidelity) | Lossless intermediate; all properties retained |
| 8-bit JPEG | Rendered block face texture (quantized) | Lossy delivery format; visual approximation only |
| ICC profile embedded in file | Palette mapping embedded in chunk metadata | Self-describing: the data carries its own interpretation key |

The principle: store the RAW form in Ceph (maximum fidelity), render to lossy display format only at consumption time. Never discard the original. The RADOS object in `vav-regions` is the DNG negative; the rendered Minecraft chunk is the JPEG export. You can always re-render from the negative.

### 9.5 Color Management Pipeline ≡ VAV Encoding Pipeline

The complete mapping, stage by stage:

```
COLOR MANAGEMENT:                      VAV ENCODING:

1. Photon hits sensor                  1. Document enters ingestion
   (physical event, continuous)           (knowledge artifact, unstructured)

2. Sensor records charge               2. Embedding model encodes content
   (quantized by pixel well depth)        (quantized by vector dimension)

3. RAW file stores sensor data         3. RADOS object stores embedding + source
   (12-16 bit, Bayer mosaic)              (float32 vector + original document)

4. ICC profile transforms to PCS       4. Block selection maps vector to block type
   (device-dependent → device-independent) (corpus-specific → Minecraft vocabulary)

5. Working space for editing           5. Chunk palette for spatial composition
   (ProPhoto RGB, 16-bit)                 (per-section palette, log2(n) bits per voxel)

6. Monitor profile for display         6. Texture binding for rendering
   (working space → display gamut)        (block type → texture pack PNG)

7. Output profile for delivery         7. Client renders voxel world
   (display → print/web/archival)         (palette + textures → OpenGL/Vulkan scene)
```

Every stage in the color management pipeline has a structural counterpart in the VAV encoding pipeline. The discipline is the same: preserve maximum fidelity through the chain, defer lossy decisions to the latest possible stage, and always embed the interpretation key (profile / palette mapping) alongside the data.

### 9.6 Ceph Storage for Color-Critical Assets

When the VAV system stores photographic textures derived from calibrated photography (e.g., photographing real geological specimens for block textures), the color management metadata must travel with the asset:

| RADOS Object xattr | Value | Purpose |
|--------------------|-------|---------|
| `vav.color.profile` | ICC profile hash (SHA-256) | Links to the ICC profile stored as a separate RADOS object in `vav-meta` |
| `vav.color.space` | `sRGB` / `AdobeRGB` / `ProPhotoRGB` | Working space the texture was exported from |
| `vav.color.intent` | `perceptual` / `relative` | Rendering intent used during gamut conversion |
| `vav.color.illuminant` | `D65` / `A` / `D50` | Illuminant under which the source was photographed |
| `vav.color.deltaE` | Float (e.g., `1.8`) | Average ΔE of the calibration profile — a quality metric |
| `vav.color.bitdepth` | `8` / `16` | Bit depth of the stored PNG |

This metadata enables the VAV system to perform color-aware operations: matching block textures by perceptual similarity, detecting gamut mismatches between texture packs, and verifying that photographic textures were captured under calibrated conditions.

---

## 10. Cross-Reference

| Module | Connection |
|--------|------------|
| M1 (Thesis) | Color fidelity is a specific instance of the thesis: the voxel is a vessel for knowledge, and color is one channel of that knowledge — miscalibrated color is corrupted data |
| M2 (Ceph/RADOS) | ICC profiles, DNG profiles, and color-calibrated textures are all RADOS objects; profile metadata stored as xattrs enables color-aware retrieval |
| M7 (Block & Chunk Data, file 11) | The block palette is the color space of a chunk; palette cardinality = gamut width; index bit depth = quantization depth |
| M8 (Texture/Resource Packs, file 12) | Texture pack resolution = spatial sampling frequency; PBR layers (MER, normal) extend the "color" concept to material properties — each PBR channel is an additional color space |
| M14 (Temporal Imaging) | Color channels in Fourier decomposition — each R/G/B channel can be independently analyzed in the frequency domain; spectral analysis of block color distributions reveals spatial patterns |
| M16 (Audio Fidelity) | Calibration as a shared principle across modalities: camera profiling ≡ microphone calibration; ICC profiles ≡ frequency response curves; ΔE ≡ THD+N; the discipline is identical, only the sensory domain differs |
| M17 (Serialization) | DNG as a serialization format for RAW data; the parallel to FlatBuffers/MessagePack in the VAV pipeline — both are structured containers that preserve maximum fidelity with embedded schema |

---

## 11. Sources

| ID | Reference |
|----|-----------|
| [21] | Calibrite. "PROFILER — Camera, Display, and Printer Calibration." https://calibrite.com/profiler |
| [22] | International Color Consortium. "ICC Profile Specification (ICC.1:2022)." https://color.org/specification/ICC.1-2022-05.pdf |
| [23] | X-Rite / Calibrite. "ColorChecker Camera Calibration — DNG and ICC Profile Creation Workflow." https://xritephoto.com/colorchecker-camera-calibration |
| SRC-RESPACK | Minecraft Wiki. "Resource pack." https://minecraft.wiki/w/Resource_pack |
| SRC-DNG | Adobe. "Digital Negative (DNG) Specification, Version 1.7.1.0." https://helpx.adobe.com/camera-raw/digital-negative.html |
| SRC-CIELAB | CIE. "Colorimetry — Part 4: CIE 1976 L*a*b* Colour Space." CIE 015:2018 |
| SRC-CIEDE2000 | Sharma, G., Wu, W., Dalal, E. "The CIEDE2000 Color-Difference Formula." *Color Research and Application*, 30(1), 2005, pp. 21-30 |
| SRC-TM30 | IES. "TM-30-20: IES Method for Evaluating Light Source Color Rendition." Illuminating Engineering Society, 2020 |
| SRC-BAYER | Bayer, B.E. "Color Imaging Array." US Patent 3,971,065, 1976 |
