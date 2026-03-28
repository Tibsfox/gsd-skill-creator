# Chirp Signal Analysis & Processing

> **Domain:** Gravitational Wave Signal Processing
> **Module:** 3 -- Signal Recovery, Noise Characterization, and Spectral Analysis
> **Through-line:** *The gravitational wave signal from GW150914 was buried under noise 10,000 times louder. It was not seen -- it was extracted. Matched filtering, the same technique radar engineers use to find aircraft in clutter, searches for a known signal shape in a noisy background. The shape is a chirp: a sinusoid whose frequency and amplitude increase over time as two compact objects spiral together. The Q-transform renders that chirp as a bright diagonal streak on a time-frequency spectrogram -- the visual fingerprint of spacetime ringing.*

---

## Table of Contents

1. [The Noise Problem](#1-the-noise-problem)
2. [Whitening and Bandpassing](#2-whitening-and-bandpassing)
3. [The Q-Transform](#3-the-q-transform)
4. [Matched Filtering](#4-matched-filtering)
5. [Template Banks and Waveform Models](#5-template-banks-and-waveform-models)
6. [The PyCBC Pipeline](#6-the-pycbc-pipeline)
7. [GWpy: The Python Toolkit](#7-gwpy-the-python-toolkit)
8. [Noise Characterization and Glitches](#8-noise-characterization-and-glitches)
9. [Bayesian Parameter Estimation](#9-bayesian-parameter-estimation)
10. [Spectrograms and Visual Analysis](#10-spectrograms-and-visual-analysis)
11. [Implementation Patterns](#11-implementation-patterns)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Noise Problem

Raw LIGO strain data is dominated by detector noise across the entire sensitive frequency band. The amplitude spectral density (ASD) of the noise is typically 10^4 to 10^5 times larger than the gravitational wave signal at any given frequency. The noise has distinct frequency-dependent character [1]:

```
LIGO NOISE SOURCES BY FREQUENCY
================================================================

  Frequency Band     Dominant Noise Source        Typical ASD
  ------------------------------------------------------------------
  < 10 Hz            Seismic noise                 (below detection band)
  10 - 30 Hz         Newtonian / gravity gradient   ~10^-20 /sqrt(Hz)
  30 - 100 Hz        Suspension thermal noise        ~10^-23 /sqrt(Hz)
  100 - 300 Hz       Mirror coating thermal noise    ~3x10^-24 /sqrt(Hz)
  300 - 5000 Hz      Quantum shot noise              ~10^-23 /sqrt(Hz)
  > 5000 Hz          Shot noise (sensitivity falls)  (above detection band)

  GW150914 peak strain: ~10^-21
  Noise ASD at 100 Hz: ~3x10^-24 /sqrt(Hz)
  SNR accumulates over bandwidth: sqrt(integral of |h|^2/S_n df)
```

The signal is not louder than the noise at any single frequency. Detection relies on the fact that the signal has a known phase evolution across a wide frequency band, while the noise is random. Matched filtering accumulates signal power coherently across the bandwidth while the noise accumulates incoherently (as sqrt of bandwidth) [2].

### Non-Stationary and Non-Gaussian Features

LIGO noise is neither perfectly stationary nor perfectly Gaussian. The noise spectrum changes on timescales of minutes to hours due to environmental variations (temperature, wind, seismic activity). In addition, short-duration noise transients ("glitches") produce non-Gaussian tails in the noise distribution. These glitches can mimic or obscure gravitational wave signals and must be identified and mitigated [3].

---

## 2. Whitening and Bandpassing

### Whitening

Whitening transforms the data so that the noise has a flat (white) power spectral density across all frequencies. This is accomplished by dividing the Fourier transform of the data by the amplitude spectral density (ASD):

```
d_whitened(f) = d(f) / sqrt(S_n(f))
```

Where `S_n(f)` is the one-sided noise power spectral density estimated from nearby data segments. After whitening, all frequencies contribute equally to the matched filter SNR, and the signal appears as a time-domain chirp superimposed on unit-variance white noise [4].

### Bandpass Filtering

The standard LIGO analysis bandpass retains frequencies between 20 Hz and 2048 Hz (Nyquist for 4096 Hz sampled data). Below 20 Hz, seismic noise dominates overwhelmingly. Above ~1 kHz, few astrophysical sources emit significant gravitational wave power, and the noise rises steeply.

For visualization purposes, a narrower bandpass of 30-500 Hz is often applied, focusing on the band where compact binary signals are strongest:

```
BANDPASS + WHITENING PIPELINE
================================================================

  Raw strain h(t)          (16384 Hz or 4096 Hz)
       |
       v
  [Downsample to 4096 Hz]  (if needed)
       |
       v
  [Estimate PSD S_n(f)]    (Welch method, 4-8 second segments)
       |
       v
  [FFT -> h(f)]
       |
       v
  [Bandpass: 30-500 Hz]    (Butterworth or Tukey window)
       |
       v
  [Whiten: h(f)/sqrt(S_n)] (divide by ASD)
       |
       v
  [IFFT -> h_white(t)]     (whitened time series)
```

In GWpy, this entire pipeline is accomplished with:

```
strain = TimeSeries.fetch_open_data('H1', t0, t0+duration)
white = strain.whiten(4, 2)  # (fftlength, overlap)
bp = white.bandpass(30, 500)
```

> **Related:** [SGL: Real-Time DSP Algorithms](../SGL/research/01-real-time-dsp-algorithms.md) | [DAA: Deep Audio Analysis](../DAA/)

---

## 3. The Q-Transform

The Q-transform is a constant-Q wavelet transform that provides variable time-frequency resolution: fine frequency resolution at low frequencies and fine time resolution at high frequencies. This makes it ideally suited for chirp signals, which sweep from low to high frequency over time [5].

### Mathematical Definition

The Q-transform decomposes a time series into a set of complex-valued time-frequency tiles. For a given center frequency f0 and quality factor Q:

```
X(tau, f0) = integral[ x(t) * w(t - tau, f0) * exp(-2*pi*i*f0*t) ] dt
```

Where `w(t, f0)` is a window function whose width scales inversely with frequency:

```
sigma_t = Q / (2 * pi * f0)     (time resolution)
sigma_f = f0 / Q                 (frequency resolution)
```

The product `sigma_t * sigma_f = 1/(2*pi)` is constant -- the Q-transform tiles the time-frequency plane at the Heisenberg limit [6].

### Q-Transform for Gravitational Waves

GWpy implements the Q-transform as `TimeSeries.q_transform()`, which returns a `Spectrogram` object. The default Q range is (4, 64), optimized by maximizing the normalized energy across tiles. For a chirp signal:

- Low-frequency inspiral: wide time windows capture the slowly evolving phase
- High-frequency merger: narrow time windows capture the rapid frequency sweep
- The chirp appears as a bright diagonal track from lower-left to upper-right

The output is a 2D array of normalized energy E(t, f) where:

```
E(t, f) = |X(t, f)|^2 / <|X(t, f)|^2>_noise
```

Values of E >> 1 indicate excess power above the noise floor. For GW170817, the Q-transform shows a spectacular 30-second rising track from 30 Hz to ~1 kHz -- the most visually dramatic gravitational wave spectrogram in the catalog [7].

```
Q-TRANSFORM SPECTROGRAM (schematic)
================================================================

  Frequency
  (Hz)
  1000 |                                           *
       |                                        **
   500 |                                     ***
       |                                  ***
   200 |                              ****
       |                         *****
   100 |                    ******
       |              *******
    50 |        ********
       |  *********
    30 |***
       +-----------------------------------------> Time
        -30s        -15s         -5s    -1s  0  (merger)

  * = excess normalized energy (chirp track)
  GW170817: 30-second BNS inspiral
  GW150914: 0.2-second BBH chirp (only visible in last few rows)
```

---

## 4. Matched Filtering

Matched filtering is the optimal linear filter for detecting a known signal in stationary Gaussian noise. The matched filter output is the noise-weighted inner product of the data with a template:

```
z(t) = 4 * Re[ integral_0^inf  d_tilde(f) * h_tilde*(f) / S_n(f) * exp(2*pi*i*f*t) df ]
```

Where `d_tilde(f)` is the data, `h_tilde(f)` is the template, and `S_n(f)` is the noise PSD. The SNR is:

```
rho(t) = |z(t)| / sigma_h
```

Where sigma_h is the template norm:

```
sigma_h^2 = 4 * integral_0^inf |h_tilde(f)|^2 / S_n(f) df
```

The matched filter is a frequency-domain operation: it naturally upweights frequencies where the signal is strong relative to the noise and downweights frequencies where the noise dominates [8].

### Why Matched Filtering Works

The key insight is that matched filtering is a coherent operation. The signal has a deterministic phase evolution (determined by the binary's parameters), so the filter output accumulates signal power constructively across the entire bandwidth. Noise, being random, accumulates as the square root of the bandwidth. The SNR scales as:

```
SNR proportional to sqrt( integral |h(f)|^2 / S_n(f) df )
```

For GW150914, the signal power is spread across approximately 200 Hz of bandwidth (35-250 Hz). Even though the signal is below the noise at every individual frequency, the coherent accumulation over 200 Hz gives SNR = 24.4 [9].

> **SAFETY WARNING:** Matched filtering assumes the signal model is correct. If the true signal deviates significantly from all templates in the bank (e.g., a new type of source), matched filtering may miss it entirely. This is why LIGO also runs unmodeled "burst" searches that do not rely on templates [10].

---

## 5. Template Banks and Waveform Models

### Waveform Approximants

The gravitational wave signal from a compact binary coalescence (CBC) is computed using several approximation methods:

| Family | Method | Regime | Key Models |
|--------|--------|--------|------------|
| Post-Newtonian (PN) | Perturbative expansion in v/c | Inspiral | TaylorF2, TaylorT4 |
| Effective One-Body (EOB) | Maps 2-body to effective 1-body | Inspiral + Merger | SEOBNRv4, SEOBNRv5 |
| Phenomenological (Phenom) | Calibrated to NR | Full IMR | IMRPhenomD, IMRPhenomXPHM |
| Numerical Relativity (NR) | Full Einstein equations | Merger + Ringdown | SXS Catalog, RIT Catalog |

The PyCBC and GstLAL detection pipelines use IMRPhenomD and SEOBNRv4 waveforms for the initial template bank. Parameter estimation uses higher-fidelity models (IMRPhenomXPHM, SEOBNRv5PHM) that include spin precession and higher-order multipole moments [11].

### Template Bank Construction

The template bank must cover the parameter space with sufficient density that no signal falls more than 3% SNR below the nearest template (97% fitting factor). For BBH searches:

```
TEMPLATE BANK PARAMETER SPACE
================================================================

  Parameter          Range              Spacing
  -------------------------------------------------------
  Component mass 1   1 - 500 M_sun      Metric-based
  Component mass 2   1 - 500 M_sun      (hexagonal lattice
  Spin 1 (aligned)   -0.998 to +0.998    in chirp mass /
  Spin 2 (aligned)   -0.998 to +0.998    symmetric mass ratio)

  Total templates:   ~250,000 (BBH search)
                     ~500,000 (full CBC search including BNS)

  Each template: ~10-100 seconds of waveform at 4096 Hz
  Total bank size: ~50-100 GB uncompressed
```

Template placement uses a metric on the parameter space that accounts for the natural correlation between parameters. The chirp mass M_c and symmetric mass ratio eta are the natural coordinates because the phase evolution depends most strongly on these combinations [12].

---

## 6. The PyCBC Pipeline

PyCBC is the primary open-source gravitational wave search pipeline, written in Python with C extensions for performance-critical inner loops. It implements the full analysis chain from data conditioning through detection and parameter estimation [13].

### Pipeline Stages

1. **Data conditioning:** Fetch strain data, apply calibration, high-pass filter (15 Hz), resample to 2048 Hz
2. **PSD estimation:** Welch method, median-average of overlapping segments (128-second windows)
3. **Template generation:** Generate waveforms from the template bank using `pycbc.waveform.get_fd_waveform()`
4. **Matched filtering:** Frequency-domain correlation using FFT convolution
5. **Trigger generation:** Threshold on SNR (typically SNR > 5.5 per detector)
6. **Chi-squared discriminator:** Signal-consistency test that verifies the SNR accumulated gradually across the frequency band (as a real signal would) rather than being concentrated in a narrow band (as a glitch would)
7. **Coincidence:** Require consistent triggers in multiple detectors within the light travel time window
8. **Ranking and FAR:** Assign detection statistic and false alarm rate from time-slide background

### The Chi-Squared Veto

The chi-squared test divides the matched filter frequency band into p equal-power bins and checks whether the SNR contributes equally from each bin. For a true signal matching the template, the chi-squared statistic follows a chi-squared distribution with 2p-2 degrees of freedom. For a glitch that produces high SNR by concentrating power in a narrow band, chi-squared is large. The re-weighted SNR combines the matched filter SNR with the chi-squared discriminator [14]:

```
rho_hat = rho / [ (1 + (chi_r^2)^3) / 2 ]^(1/6)

where chi_r^2 = chi^2 / (2p - 2)
```

This re-weighted SNR strongly suppresses glitch triggers while preserving real signal triggers.

---

## 7. GWpy: The Python Toolkit

GWpy is the standard Python package for gravitational wave data analysis, providing high-level interfaces to LIGO data access, time series manipulation, and visualization [15].

### Core Classes

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `TimeSeries` | Time-domain strain data | `fetch_open_data()`, `whiten()`, `bandpass()`, `q_transform()` |
| `FrequencySeries` | Frequency-domain data | `asd()`, `psd()` |
| `Spectrogram` | Time-frequency representation | `plot()`, `crop()` |
| `EventTable` | GW event catalogs | `fetch()`, `filter()` |

### Data Access

```
# Fetch 32 seconds of strain data around GW150914
from gwpy.timeseries import TimeSeries
gps_time = 1126259462.4  # GW150914 merger time
strain = TimeSeries.fetch_open_data('H1', gps_time - 16, gps_time + 16)

# Sample rate: 4096 Hz (public data)
# Duration: 32 seconds
# Data format: HDF5 via GWOSC REST API
```

### Processing Pipeline

```
# Complete pipeline: fetch, whiten, bandpass, Q-transform
strain = TimeSeries.fetch_open_data('H1', t0, t0 + 32)
white = strain.whiten(4, 2)            # FFT length 4s, overlap 2s
bp = white.bandpass(30, 500)            # Butterworth bandpass
qscan = strain.q_transform(qrange=(4, 64), frange=(20, 500))
```

The Q-transform output is a 2D array suitable for direct rendering as a spectrogram image or as input to a 3D visualization pipeline [16].

---

## 8. Noise Characterization and Glitches

### Glitch Classification

LIGO data contains numerous short-duration noise transients (glitches) that are not Gaussian noise. The Gravity Spy citizen science project and machine learning classifiers have identified over 20 distinct morphological classes [17]:

| Glitch Class | Characteristic | Typical Duration | Impact |
|-------------|----------------|------------------|--------|
| Blip | Symmetric, broadband burst | ~10 ms | Mimics short BBH mergers |
| Scattered light | Arched spectral features | ~1 s | Obscures low-frequency signals |
| Whistle | Narrow-band descending tone | ~0.5 s | Confuses unmodeled searches |
| Koi fish | Broadband with frequency structure | ~0.1 s | High SNR, mimics signals |
| Tomte | Low-frequency broadband | ~0.1 s | Affects BNS inspiral band |
| 60 Hz harmonics | Power line interference | Continuous | Requires notch filtering |

### The GW170817 Glitch

The most famous glitch in LIGO history occurred 1.1 seconds before the GW170817 BNS merger signal at LIGO Livingston. A loud "blip" glitch overlapped with the end of the inspiral signal. The glitch was removed by subtracting a wavelet model of the glitch morphology, allowing the underlying signal to be recovered. This near-miss highlighted the importance of robust glitch mitigation [18].

### Data Quality Vetoes

LIGO maintains data quality flags that categorize time segments:

- **CAT1 (Science mode):** Detector is in nominal science configuration
- **CAT2 (Known issues):** Identified instrumental artifacts; data should be used with caution
- **CAT3 (Severe issues):** Data is unreliable and should be excluded from analysis

Approximately 70-80% of observing time achieves CAT1 quality. Analysis pipelines respect these flags when computing detection statistics and false alarm rates [19].

---

## 9. Bayesian Parameter Estimation

After a candidate signal is identified, Bayesian inference extracts the full posterior probability distribution over the source parameters. The computational cost is dominated by the likelihood evaluation, which requires generating a waveform and computing the matched filter SNR at each sample point in the parameter space [20].

### Sampling Methods

| Method | Package | Characteristic |
|--------|---------|----------------|
| Nested sampling | LALInference/Bilby (dynesty) | Naturally computes evidence integral; standard for LVK |
| MCMC | LALInferenceMCMC | Parallel-tempered chains; good for multi-modal posteriors |
| Relative binning | cogwheel/Jim | Accelerated likelihood via frequency-bin compression |
| Machine learning | DINGO/nessai | Neural posterior estimation; orders of magnitude faster |

A typical parameter estimation run for a BBH event requires 10^6 to 10^8 likelihood evaluations, taking hours to days on a computing cluster. For BNS events (longer signals), the cost is higher [21].

### The 15-Parameter Model

A quasi-circular compact binary coalescence in general relativity is described by 15 parameters:

```
COMPACT BINARY COALESCENCE PARAMETERS
================================================================

  Intrinsic (source physics):
    m1, m2              Component masses
    chi1 (3 components)  Primary spin vector
    chi2 (3 components)  Secondary spin vector
    [tidal: Lambda1, Lambda2 for BNS]

  Extrinsic (geometry):
    alpha, delta         Sky location (RA, Dec)
    d_L                  Luminosity distance
    iota                 Orbital inclination
    psi                  Polarization angle
    phi_c                Coalescence phase
    t_c                  Coalescence time (GPS)
```

The intrinsic parameters determine the waveform shape. The extrinsic parameters determine the waveform's amplitude, phase, and arrival time at each detector. Marginalization over extrinsic parameters (especially sky location and distance) is a major computational cost [22].

---

## 10. Spectrograms and Visual Analysis

### Time-Frequency Representations

Three primary time-frequency representations are used in gravitational wave data analysis:

1. **STFT (Short-Time Fourier Transform):** Fixed window width; uniform time-frequency resolution. Simple but not optimal for chirp signals.

2. **Q-transform (Constant-Q):** Variable window width; finer frequency resolution at low frequencies, finer time resolution at high frequencies. Standard for LIGO visualization.

3. **Wavelet scaleogram (CWT):** Continuous wavelet transform with Morlet or other wavelets. Similar properties to Q-transform but different normalization.

### Visual Fingerprints of Source Types

| Source Type | Spectrogram Appearance | Example |
|------------|----------------------|---------|
| BBH merger | Short diagonal chirp (0.1-1 s), abrupt cutoff at merger | GW150914 |
| BNS merger | Long diagonal chirp (10-100 s), gradual sweep to high frequency | GW170817 |
| NSBH merger | Intermediate chirp (1-10 s), cutoff depends on NS disruption | GW200105 |
| Continuous wave | Horizontal line at constant frequency (with Doppler modulation) | Pulsars (undetected) |
| Burst | Compact blob, no frequency evolution | Core-collapse supernovae (undetected) |
| Stochastic background | Diffuse, no structure | Cosmological (undetected) |

### Omega Scans

LIGO uses "Omega scans" as the standard Q-transform visualization tool. An Omega scan for a candidate event produces a set of spectrograms at multiple time resolutions (0.5 s, 2 s, 10 s) for each detector, enabling quick visual assessment of signal morphology and data quality. Omega scans are the first diagnostic tool applied to new candidate events [23].

```
OMEGA SCAN OUTPUT FORMAT
================================================================

  For each detector (H1, L1, V1):
    - Time-frequency spectrogram (Q-transform)
    - Normalized energy color scale (log10)
    - Three zoom levels: 0.5s, 2s, 10s
    - Whitened strain time series overlay
    - ASD comparison (current vs. reference)

  Color map: sequential (white -> yellow -> orange -> red -> black)
  Energy threshold: typically E > 5 (5x noise floor)
  Used for: event validation, glitch identification, data quality
```

> **Related:** [Visualization & Sonification](05-visualization-and-sonification.md) | [SGL: DSP Algorithms](../SGL/research/01-real-time-dsp-algorithms.md)

---

## 11. Implementation Patterns

### Real-Time vs. Offline Analysis

LIGO operates two parallel analysis modes:

- **Low-latency (real-time):** PyCBC Live and GstLAL Online process data within seconds of acquisition. Triggers are posted to GraceDB within 1-10 minutes. These pipelines use reduced template banks and simplified ranking statistics for speed.
- **Offline:** Full analysis with complete template banks, refined PSD estimation, and detailed parameter estimation. Results are published weeks to months after the observing run. Offline analysis recovers events missed by low-latency pipelines and provides definitive parameter estimates.

### Data Flow Architecture

```
DATA FLOW: LIGO ANALYSIS PIPELINE
================================================================

  Detector Output (16384 Hz, h(t))
       |
  [Calibration]          CDS / real-time
       |
  +----+----+
  |         |
  v         v
  [Low-latency]     [Archival]
  PyCBC Live         GWOSC (public release)
  GstLAL Online      HDF5 / GWF format
  MBTA                |
  |                   v
  v              [Offline Analysis]
  [GraceDB]      PyCBC offline
  (alerts)       GstLAL offline
  |              IAS pipeline
  v                   |
  [GCN/Kafka]         v
  (public alerts)   [GWTC Catalog]
                    (final results)
```

### Computing Requirements

Full offline analysis of one observing run requires approximately:
- 10 million CPU-hours for matched-filter search (template bank x data segments)
- 1 million CPU-hours for parameter estimation (all candidates)
- 100 TB storage for template banks, data products, and posterior samples

This is distributed across the LIGO Data Grid (LDG), Open Science Grid (OSG), and partner computing centers [24].

---

## 12. Cross-References

- **[LIGO Hanford & Interferometry](01-ligo-hanford-interferometry.md)** -- Detector noise sources that define the sensitivity curve
- **[GW150914 Discovery](02-first-detection-gw150914.md)** -- The canonical matched-filter detection
- **[Multi-Messenger Astronomy](04-multi-messenger-astronomy.md)** -- Sky localization from chirp analysis
- **[Visualization & Sonification](05-visualization-and-sonification.md)** -- Q-transform rendering pipelines
- **DAA (Deep Audio Analysis)** -- FFT, STFT, spectral analysis, and cross-correlation methods
- **SGL (Signal & Light)** -- Adaptive filtering, FIR/IIR implementations, DSP hardware
- **GRD (Gradient Methods)** -- Optimization in parameter estimation, template bank placement
- **MPC (Math Co-Processor)** -- FFT computation, matrix operations for matched filtering
- **BHK (Black Hole Kinematics)** -- Waveform physics, numerical relativity, compact binary dynamics
- **FQC (Foundations of Quantum Computing)** -- Quantum noise that limits detector sensitivity

---

## 13. Sources

1. Abbott, B.P. et al. (2016). "Characterization of transient noise in Advanced LIGO relevant to gravitational wave signal GW150914." *Classical and Quantum Gravity*, 33, 134001.
2. Allen, B. et al. (2012). "FINDCHIRP: An algorithm for detection of gravitational waves from inspiraling compact binaries." *Physical Review D*, 85, 122006.
3. Davis, D. et al. (2021). "LIGO detector characterization in the second and third observing runs." *Classical and Quantum Gravity*, 38, 135014.
4. Allen, B. (2005). "chi-squared time-frequency discriminator for gravitational wave detection." *Physical Review D*, 71, 062001.
5. Brown, J.C. (1991). "Calculation of a constant Q spectral transform." *Journal of the Acoustical Society of America*, 89, 425.
6. Chatterji, S. et al. (2004). "Multiresolution techniques for the detection of gravitational-wave bursts." *Classical and Quantum Gravity*, 21, S1809.
7. Macleod, D.M. et al. (2021). "GWpy: A Python package for gravitational-wave astrophysics." *SoftwareX*, 13, 100657.
8. Wainstein, L.A. and Zubakov, V.D. (1962). *Extraction of Signals from Noise*. Prentice-Hall.
9. Abbott, B.P. et al. (2016). "Observation of Gravitational Waves from a Binary Black Hole Merger." *PRL*, 116, 061102.
10. Abbott, B.P. et al. (2016). "Observing gravitational-wave transient GW150914 with minimal assumptions." *PRD*, 93, 122004.
11. Pratten, G. et al. (2021). "Computationally efficient models for the dominant and subdominant harmonic modes of precessing binary black holes." *Physical Review D*, 103, 104056.
12. Owen, B.J. and Sathyaprakash, B.S. (1999). "Matched filtering of gravitational waves from inspiraling compact binaries: Computational cost and template placement." *Physical Review D*, 60, 022002.
13. Nitz, A.H. et al. (2021). "PyCBC software." github.com/gwastro/pycbc
14. Allen, B. (2005). "chi-squared time-frequency discriminator for gravitational wave detection." *PRD*, 71, 062001. Section IV.
15. GWpy Documentation. gwpy.github.io/docs/stable
16. GWOSC Tutorials. gwosc.org/tutorials
17. Zevin, M. et al. (2017). "Gravity Spy: integrating advanced LIGO detector characterization, machine learning, and citizen science." *Classical and Quantum Gravity*, 34, 064003.
18. Abbott, B.P. et al. (2017). "GW170817: Observation of Gravitational Waves from a Binary Neutron Star Inspiral." *PRL*, 119, 161101. Supplemental Material.
19. Davis, D. et al. (2021). "LIGO detector characterization in the second and third observing runs." *CQG*, 38, 135014. Section 4.
20. Veitch, J. et al. (2015). "Parameter estimation for compact binaries with ground-based gravitational-wave observations using the LALInference software library." *Physical Review D*, 91, 042003.
21. Ashton, G. et al. (2019). "BILBY: A user-friendly Bayesian inference library for gravitational-wave astronomy." *Astrophysical Journal Supplement*, 241, 27.
22. Cutler, C. and Flanagan, E.E. (1994). "Gravitational waves from merging compact binaries: How accurately can one extract the binary's parameters from the inspiral waveform?" *PRD*, 49, 2658.
23. Chatterji, S. (2005). "The search for gravitational wave bursts in data from the second LIGO science run." PhD thesis, MIT.
24. Usman, S.A. et al. (2016). "The PyCBC search for gravitational waves from compact binary coalescence." *CQG*, 33, 215004.
