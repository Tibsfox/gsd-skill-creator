# GPU-Accelerated Deep Data Analysis for Bioacoustics

> *Biology discovered it first. The physics is universal. The Pacific Northwest is where it matters most right now.*

---

## Overview

The Southern Resident killer whales of the Salish Sea produce echolocation clicks, social calls, and whistles that propagate through water as pressure waves, pass through hydrophone membranes as voltage signals, travel through cables as electrical impulses, enter GPU memory as arrays of floating-point numbers, and emerge from neural network classifiers as species identifications and behavioral state predictions. The signal processing chain from biological source to computational decision is unbroken -- and it maps, with remarkable fidelity, onto the biological signal processing chain that the whales themselves use [P8, P9].

This document traces the complete GPU-accelerated machine learning pipeline for bioacoustic analysis in the Pacific Northwest: from the pioneering ORCA-SPOT system (Bergler et al., 2019) that demonstrated deep learning for killer whale detection, to the real-time OrcaHello deployment on live hydrophone streams, to the Orca Behavior Institute's distributed acoustic network, to the multi-sensor biologging tag studies of Holt and Tennessen at NOAA NWFSC. In parallel, systems like BirdNET extend the same pipeline to avian bioacoustics.

The through-line: the biological signal processing chain -- source, propagation, transducer, conditioning, feature extraction, decision -- maps directly onto the ML pipeline -- sensor, preprocessing, spectrogram, feature extraction, classification, alert. Biology and engineering converge on the same architecture because they are solving the same physics problem.

---

## Table of Contents

1. [The Bioacoustic ML Pipeline: Architecture Overview](#the-bioacoustic-ml-pipeline-architecture-overview)
2. [ORCA-SPOT: Deep Learning for Killer Whale Detection](#orca-spot-deep-learning-for-killer-whale-detection)
   - [Training Data: The Orchive](#training-data-the-orchive)
   - [Network Architecture](#network-architecture)
   - [Performance and Validation](#performance-and-validation)
3. [OrcaHello: Real-Time Detection on Live Streams](#orcahello-real-time-detection-on-live-streams)
4. [Orca Behavior Institute: Distributed Hydrophone Network](#orca-behavior-institute-distributed-hydrophone-network)
5. [The Spectrogram: STFT for Bioacoustics](#the-spectrogram-stft-for-bioacoustics)
   - [The Short-Time Fourier Transform](#the-short-time-fourier-transform)
   - [Window Length Trade-offs](#window-length-trade-offs)
   - [GPU Acceleration of STFT](#gpu-acceleration-of-stft)
6. [CNN Feature Extraction from Spectrograms](#cnn-feature-extraction-from-spectrograms)
   - [Why CNNs Work for Spectrograms](#why-cnns-work-for-spectrograms)
   - [Feature Hierarchy](#feature-hierarchy)
7. [Comb Filter Detection on GPU](#comb-filter-detection-on-gpu)
   - [Comb Filter Signatures in Biology](#comb-filter-signatures-in-biology)
   - [Matched Filter Banks](#matched-filter-banks)
   - [GPU Parallelism for Real-Time Detection](#gpu-parallelism-for-real-time-detection)
8. [Time-Series Sensor Fusion from Biologging Tags](#time-series-sensor-fusion-from-biologging-tags)
   - [Biologging Tag Sensors](#biologging-tag-sensors)
   - [Time Alignment and Synchronization](#time-alignment-and-synchronization)
   - [Kalman Filtering for State Estimation](#kalman-filtering-for-state-estimation)
   - [Regression Analysis for Behavioral Correlates](#regression-analysis-for-behavioral-correlates)
9. [BirdNET: Parallel Development for Avian Bioacoustics](#birdnet-parallel-development-for-avian-bioacoustics)
10. [The Convergence: Biological and Computational Signal Processing](#the-convergence-biological-and-computational-signal-processing)
11. [PNW Applications: Real-Time Conservation](#pnw-applications-real-time-conservation)
12. [GPU Hardware and Performance Considerations](#gpu-hardware-and-performance-considerations)
13. [Summary Tables](#summary-tables)
14. [Sources](#sources)

---

## The Bioacoustic ML Pipeline: Architecture Overview

The complete GPU-accelerated bioacoustic analysis pipeline:

```
COMPLETE PIPELINE:

  PHYSICAL WORLD                   GPU PIPELINE
  =============                    ============

  Whale/bird/bat vocalizes         Sensor: Hydrophone/microphone
       |                                |
       v                                v
  Sound propagates through         ADC: Analog-to-digital conversion
  water/air                        (16-24 bit, 44.1-192 kHz sample rate)
       |                                |
       v                                v
  Hydrophone/mic transduces        Preprocessing: Band-pass filter,
  pressure to voltage              noise reduction, gain normalization
       |                                |
       v                                v
  Electrical signal                Spectrogram: STFT (GPU-accelerated)
  transmitted to shore             S(t,f) = |integral x(tau)w(tau-t)e^(-j2pif*tau)dtau|^2
       |                                |
       v                                v
  Recorded / streamed              Feature extraction: CNN layers
                                   (convolutional filters learn patterns)
                                        |
                                        v
                                   Classification: Dense layers + softmax
                                   (species ID, call type, behavioral state)
                                        |
                                        v
                                   Decision: Real-time alert
                                   (vessel speed reduction, researcher notification)
```

---

## ORCA-SPOT: Deep Learning for Killer Whale Detection

### Training Data: The Orchive

ORCA-SPOT (Bergler et al., 2019, *Nature Scientific Reports*) was trained on one of the largest bioacoustic datasets ever assembled for a single species [P8]:

```
ORCA-SPOT Training Data (The Orchive):

  Source:         The Orchive -- collaborative archive of Northeast
                  Pacific killer whale recordings
  Total recordings: ~19,000 hours of hydrophone audio
  Positive samples: 11,509 confirmed orca vocalizations
  Negative samples: 34,848 noise segments (vessel noise, rain,
                    wave action, other marine life)
  Sample rate:     Various (resampled to standard rate for training)
  Segment length:  ~2 seconds per training sample
  Labeling:        Expert-verified by marine mammal acousticians

  Class balance:
    Orca calls:    11,509 (25%)
    Noise:         34,848 (75%)
    Total:         46,357 labeled segments

  The 3:1 noise-to-signal ratio reflects real-world conditions --
  most of the time, hydrophones record background noise, not whales.
```

The Orchive represents a community effort spanning decades of field recordings from researchers, citizen scientists, and automated recording stations throughout the northeastern Pacific. The 19,000 hours of recordings contain not just killer whale vocalizations but the full acoustic diversity of the Salish Sea and beyond [P8].

### Network Architecture

ORCA-SPOT uses a **convolutional neural network (CNN)** architecture that processes spectrogram images [P8]:

```
ORCA-SPOT Network Architecture (simplified):

  INPUT: Spectrogram image (time x frequency x 1 channel)
    - ~2-second segments
    - STFT with appropriate window length
    - Magnitude spectrogram (log-scaled)
    |
    v
  CONVOLUTIONAL LAYERS (feature extraction):
    Conv2D -> ReLU -> MaxPool (repeated N times)
    Each layer learns increasingly abstract features:
      Layer 1: edges, onsets, frequency bands
      Layer 2: spectral patterns, harmonic structures
      Layer 3: call contours, click patterns
      Layer 4+: species-specific signatures
    |
    v
  GLOBAL POOLING:
    Reduces spatial dimensions to fixed-size vector
    Aggregates features across time and frequency
    |
    v
  DENSE LAYERS (classification):
    Fully connected -> ReLU -> Dropout
    Maps feature vector to class probabilities
    |
    v
  OUTPUT: Softmax over classes
    P(orca call) and P(noise)
    Classification threshold adjustable for
    precision/recall trade-off
```

The CNN treats the spectrogram as an image and applies the same pattern-recognition algorithms that work for visual object detection. Harmonic stacks in orca calls appear as parallel horizontal lines in the spectrogram; click trains appear as vertical lines; whistles appear as curved traces. The CNN learns to recognize these visual patterns [P8].

### Performance and Validation

```
ORCA-SPOT Performance (Bergler et al., 2019):

  Metric          | Value
  ----------------|--------
  Accuracy        | > 95% (on held-out test set)
  Precision       | High (low false positive rate)
  Recall          | High (low miss rate)
  AUC             | > 0.97

  Key achievements:
    1. Detects orca vocalizations in noisy ocean recordings
    2. Discriminates orca calls from vessel noise, rain, and
       other marine mammal sounds
    3. Operates on spectrogram representations without
       hand-crafted features
    4. Generalizable: trained on archival data, deployed on
       live streams

  Limitations:
    1. Does not classify call TYPE (S calls, N calls, etc.)
    2. Does not identify individual whales (pod or individual)
    3. Detection performance degrades in very high noise
    4. Requires GPU for real-time processing at full bandwidth
```

Source: [P8] Bergler, C. et al. (2019). ORCA-SPOT deep learning for killer whale detection. *Nature Scientific Reports*.

---

## OrcaHello: Real-Time Detection on Live Streams

OrcaHello extends the ORCA-SPOT approach to **real-time detection** on live hydrophone streams from the Salish Sea [P8, O2]:

```
OrcaHello Real-Time Pipeline:

  HYDROPHONE STREAM (continuous audio, 24/7)
       |
       v
  AUDIO BUFFER (ring buffer, ~5-10 seconds)
       |
       v
  STFT (GPU-accelerated, overlapping windows)
       |
       v
  SPECTROGRAM SEGMENTATION (~2-second segments, overlapping)
       |
       v
  CNN INFERENCE (ORCA-SPOT model or updated variant)
       |
       v
  DETECTION THRESHOLD (adjustable confidence level)
       |
       v
  IF detection:
    -> ALERT (notification to researchers, vessel traffic management)
    -> RECORD (save audio segment for verification and training)
    -> LOG (timestamp, location, confidence, associated metadata)
       |
       v
  CONTINUOUS LOOP (24/7/365)

  Processing requirements:
    - Real-time: processing must keep up with audio input rate
    - Low latency: detection within seconds of vocalization
    - Multi-stream: multiple hydrophone channels simultaneously
    - GPU: required for real-time STFT + CNN inference
```

The system enables **real-time whale detection for vessel speed management** -- when Southern Residents are detected in a specific area, vessel traffic can be alerted to reduce speed and maintain the mandatory 1,000-yard buffer [G1, G5].

---

## Orca Behavior Institute: Distributed Hydrophone Network

The **Orca Behavior Institute** operates a network of live-streaming hydrophones throughout Puget Sound and Haro Strait [O2]:

```
Distributed Hydrophone Network:

  NETWORK ARCHITECTURE:
    Multiple hydrophone stations distributed across
    key orca habitat areas in the Salish Sea

  STATIONS (representative):
    - Haro Strait (primary J/K/L pod habitat)
    - San Juan Islands channels
    - Puget Sound (various locations)
    - Strait of Juan de Fuca

  EACH STATION:
    - Underwater hydrophone (calibrated, broadband)
    - Shore cable or wireless link
    - Audio streaming to central server
    - Local recording backup

  DATA FLOW:
    Hydrophone -> ADC -> streaming server -> cloud
    -> OrcaHello processing -> detection alerts
    -> public livestream (orcasound.net and similar)
    -> long-term archive

  FUNCTIONS:
    1. Real-time orca detection (OrcaHello integration)
    2. Ambient noise monitoring (vessel traffic levels)
    3. Long-term acoustic trend analysis
    4. Public engagement (live streams)
    5. Research data (behavioral acoustics studies)
```

The hydrophone network is, in engineering terms, a **distributed acoustic sensor array** [O2]. The multiple stations provide spatial coverage that a single hydrophone cannot -- and when multiple stations detect the same vocalization, the time-of-arrival differences can potentially be used for **acoustic localization** (determining where the whale is, not just that it vocalized).

---

## The Spectrogram: STFT for Bioacoustics

### The Short-Time Fourier Transform

The foundation of the entire GPU bioacoustic pipeline is the **spectrogram** -- a time-frequency representation of the acoustic signal computed via the Short-Time Fourier Transform (STFT):

```
Short-Time Fourier Transform:

  S(t, f) = | integral x(tau) * w(tau - t) * e^(-j*2*pi*f*tau) dtau |^2

  Where:
    S(t, f) = spectrogram power at time t and frequency f
    x(tau)  = acoustic signal (time-domain waveform)
    w(tau - t) = window function centered at time t
    e^(-j*2*pi*f*tau) = complex exponential (Fourier basis function)

  In discrete form (for GPU computation):
    X[n, k] = sum_{m=0}^{N-1} x[n*H + m] * w[m] * e^(-j*2*pi*k*m/N)

  Where:
    n = time frame index
    k = frequency bin index
    N = FFT size (window length in samples)
    H = hop size (stride between consecutive frames)
    w[m] = window function (Hann, Hamming, etc.)

  The spectrogram is |X[n, k]|^2 (power) or |X[n, k]| (magnitude)
  typically displayed in log scale (dB).
```

### Window Length Trade-offs

The window length is the critical parameter that determines the trade-off between time and frequency resolution -- the **uncertainty principle** of signal analysis:

```
Time-Frequency Uncertainty:

  delta_t * delta_f >= 1 / (4*pi)  (Gabor limit)

  Practical consequence:
    Short window -> good time resolution, poor frequency resolution
    Long window  -> poor time resolution, good frequency resolution

  For bioacoustic applications:

  ORCA ECHOLOCATION CLICKS (0.1-25 ms duration):
    Require SHORT windows to resolve individual clicks
    Window: ~1-5 ms (44-220 samples at 44.1 kHz)
    Frequency resolution: ~200-1000 Hz
    Time resolution: ~1-5 ms
    Result: Clicks appear as vertical lines in spectrogram

  ORCA SOCIAL CALLS (0.5-1.5 seconds duration):
    Require LONGER windows to resolve harmonic structure
    Window: ~20-50 ms (882-2205 samples at 44.1 kHz)
    Frequency resolution: ~20-50 Hz
    Time resolution: ~20-50 ms
    Result: Calls appear as curved traces with harmonics visible

  ORCA WHISTLES (variable duration, tonal):
    Similar to calls: longer windows for frequency resolution
    Window: ~20-50 ms
    Harmonics resolved as parallel frequency traces

  BAT ECHOLOCATION (1-10 ms, FM sweep):
    Require SHORT windows for the FM sweep
    Window: ~1-2 ms
    The sweep appears as a diagonal line (high freq to low freq)
    at high sample rates (256 kHz+)
```

### GPU Acceleration of STFT

The STFT is **massively parallelizable** -- each time frame and each frequency bin can be computed independently:

```
GPU STFT Implementation:

  PARALLELISM:
    - Each time frame (n) is independent -> parallel over frames
    - Each frequency bin (k) is independent -> parallel over bins
    - The FFT itself is parallelizable (butterfly operations)

  TYPICAL GPU STFT:
    - cuFFT (NVIDIA) or clFFT (AMD) for batched FFT
    - Windowing: element-wise multiply (trivially parallel)
    - Magnitude: element-wise complex-to-real (trivially parallel)
    - Log scaling: element-wise (trivially parallel)

  THROUGHPUT:
    A modern GPU (e.g., RTX 4060 Ti) can compute:
    - Millions of FFTs per second for typical bioacoustic sizes
    - Real-time processing of multiple hydrophone streams
    - Latency: < 10 ms for a single spectrogram frame

  MEMORY:
    Input: audio buffer (N_frames * N_fft * sizeof(float))
    Output: spectrogram (N_frames * (N_fft/2+1) * sizeof(float))
    For 10 seconds at 44.1 kHz, 1024-point FFT, 50% overlap:
      ~860 frames * 513 bins * 4 bytes ~ 1.8 MB
    Easily fits in GPU memory.
```

---

## CNN Feature Extraction from Spectrograms

### Why CNNs Work for Spectrograms

Convolutional neural networks are effective for spectrogram classification because spectrograms have **local structure** -- bioacoustic features (harmonics, click trains, frequency sweeps) appear as spatially coherent patterns in the time-frequency image [P8]:

```
Spectrogram Visual Patterns:

  ORCA CALL (S1 type):
    Time ->
    Freq   ~~~~~~     <- fundamental frequency contour
    |     ~~~~~~      <- second harmonic (2x frequency)
    |    ~~~~~~       <- third harmonic
    v

  ORCA CLICK:
    Time ->
    Freq   |          <- broadband vertical stripe
    |      |
    |      |
    v

  ORCA CLICK TRAIN:
    Time ->
    Freq   | | | | |  <- series of vertical stripes
    |      | | | | |
    |      | | | | |
    v

  BAT FM SWEEP:
    Time ->
    Freq  \           <- diagonal from high to low frequency
    |      \
    |       \
    v

  VESSEL NOISE:
    Time ->
    Freq   ========   <- broadband, continuous, low-frequency heavy
    |      ========
    |      ========
    v

  CNN convolutional filters learn to detect these patterns:
    - Horizontal edges: harmonic content
    - Vertical edges: broadband pulses (clicks)
    - Diagonal edges: frequency sweeps
    - Texture: noise vs. structured vocalization
```

### Feature Hierarchy

Each layer of the CNN learns increasingly abstract features [P8]:

```
CNN Feature Hierarchy for Bioacoustics:

  LAYER 1 (small kernels, e.g., 3x3):
    Detects: edges, onsets, offsets, narrow frequency bands
    Analogous to: cochlear frequency channels
    Biological parallel: hair cell frequency tuning

  LAYER 2 (larger receptive field via pooling):
    Detects: harmonic relationships, spectral shapes, click patterns
    Analogous to: spectral pattern matching
    Biological parallel: feature-selective auditory cortex neurons

  LAYER 3-4 (even larger receptive field):
    Detects: call contours, temporal patterns, species signatures
    Analogous to: call type classification
    Biological parallel: species-recognition circuits in auditory cortex

  DENSE LAYERS (global):
    Detects: combinations of features that define species/call type
    Analogous to: final classification decision
    Biological parallel: behavioral decision output
```

---

## Comb Filter Detection on GPU

### Comb Filter Signatures in Biology

A **comb filter** has a frequency response with regularly spaced peaks (harmonics). Multiple biological acoustic signals produce comb-like spectrograms [P8]:

```
Comb Filter Signatures:

  1. BAT CLICK TRAINS
     Rapid sequence of clicks at regular intervals
     In frequency domain: peaks at 1/ICI, 2/ICI, 3/ICI, ...
     Appears as horizontal comb pattern in spectrogram

  2. ORCA WHISTLES with HARMONIC STACKS
     Tonal call with fundamental + harmonics
     Peaks at f0, 2*f0, 3*f0, ...
     Appears as parallel horizontal traces

  3. DOLPHIN CLICK TRAINS
     Similar to orca but at higher repetition rates
     Creates very dense comb pattern

  4. BIRD SONG with HARMONIC STRUCTURE
     Many bird songs have strong harmonic content
     Appears as stacked frequency bands

  The comb pattern is diagnostic:
    - Spacing between peaks encodes fundamental frequency or repetition rate
    - Number of peaks encodes signal bandwidth
    - Relative amplitude of peaks encodes source characteristics
```

### Matched Filter Banks

GPU-accelerated matched filter banks can detect comb patterns in real time:

```
Matched Filter Bank for Comb Detection:

  DESIGN:
    For each expected comb spacing (f_spacing):
      Create a template: peaks at f_spacing, 2*f_spacing, ...
      Width of each peak: determined by expected signal

  DETECTION:
    For each spectrogram frame:
      Correlate frame's frequency spectrum with each template
      Correlation peak indicates match with that comb spacing

  GPU IMPLEMENTATION:
    - Templates stored in GPU constant memory
    - Correlation computed as element-wise multiply + sum
    - All templates processed in parallel (one per GPU thread block)
    - All time frames processed in parallel (batched)

  COMPUTATIONAL COST:
    N_templates * N_freq_bins * N_time_frames multiplications
    For 100 templates, 512 bins, 860 frames:
      ~44 million multiplications -- trivial for a modern GPU
      (< 1 ms on RTX-class hardware)
```

### GPU Parallelism for Real-Time Detection

```
GPU Parallelism Hierarchy:

  LEVEL 1: Multiple hydrophone streams (stream-level parallelism)
    Each hydrophone processed by a separate CUDA stream
    Streams execute independently on GPU multiprocessors

  LEVEL 2: Time frames within a stream (frame-level parallelism)
    Each spectrogram frame processed by a separate thread block
    Hundreds of frames in flight simultaneously

  LEVEL 3: Frequency bins within a frame (bin-level parallelism)
    Each FFT butterfly operation processed by a separate thread
    Thousands of threads per frame

  LEVEL 4: CNN inference (batch-level parallelism)
    Multiple spectrogram segments classified simultaneously
    Batched matrix multiplications leverage tensor cores

  Result: Real-time processing of multiple hydrophone streams
  on a single GPU, with sub-second latency from sound event
  to classification output.
```

---

## Time-Series Sensor Fusion from Biologging Tags

### Biologging Tag Sensors

Multi-tag studies by Holt and Tennessen at NOAA NWFSC combine multiple time-series sensors on a single animal-attached tag [P9]:

```
Biologging Tag Sensor Suite:

  SENSOR          | MEASUREMENT           | SAMPLE RATE  | UNITS
  ----------------|-----------------------|--------------|------
  Accelerometer   | Body acceleration     | 50-200 Hz    | m/s^2 (3-axis)
  (3-axis)        | (movement, fluking,   |              |
                  |  rolling, lunging)    |              |
                  |                       |              |
  Magnetometer    | Magnetic field        | 50-200 Hz    | uT (3-axis)
  (3-axis)        | (heading, pitch, roll)|              |
                  | Same technology as    |              |
                  | smartphone compass    |              |
                  |                       |              |
  Hydrophone      | Acoustic environment  | 48-96 kHz    | Pa (calibrated)
  (stereo)        | (echolocation clicks, |              |
                  |  social calls, vessel |              |
                  |  noise, ambient)      |              |
                  |                       |              |
  Depth sensor    | Hydrostatic pressure  | 1-10 Hz      | m (depth)
  (pressure)      | (dive profile)        |              |

  All sensors are TIME-STAMPED to a common clock.
  Tag attaches via suction cups; records for hours to days.
  Data downloaded after tag release and recovery.
```

### Time Alignment and Synchronization

Fusing multiple time series requires precise temporal alignment:

```
Time Alignment Challenge:

  PROBLEM:
    Different sensors sample at different rates:
      Accelerometer: 200 Hz (5 ms between samples)
      Magnetometer: 200 Hz (5 ms)
      Hydrophone: 96,000 Hz (0.0104 ms)
      Depth: 1 Hz (1000 ms)

    Timestamps may drift between sensors (crystal oscillator error)
    Some sensors have latency (processing delay)

  SOLUTION: Telemetry time-delta synchronization
    1. All sensors driven by same master clock
    2. Timestamps interpolated to common time base
    3. Low-rate sensors (depth) upsampled via interpolation
    4. High-rate sensors (hydrophone) downsampled or windowed

  GPU IMPLEMENTATION:
    - Resampling via polyphase filter banks (GPU-parallel)
    - Interpolation via cubic spline (element-wise GPU computation)
    - Synchronized buffer: all sensors at common time resolution
```

### Kalman Filtering for State Estimation

**Kalman filtering** combines accelerometer and magnetometer data to estimate the whale's dynamic state (position, heading, speed, body orientation) over time [P9]:

```
Kalman Filter for Whale State Estimation:

  STATE VECTOR:
    x = [position_x, position_y, depth, heading, pitch, roll,
         velocity_x, velocity_y, velocity_z,
         angular_rate_heading, angular_rate_pitch, angular_rate_roll]

  PROCESS MODEL:
    x[k+1] = F * x[k] + B * u[k] + w[k]

    Where:
      F = state transition matrix (kinematic equations)
      B = control input matrix (not applicable for passive tag)
      u = control input (none)
      w = process noise (random accelerations, current, etc.)

  MEASUREMENT MODEL:
    z[k] = H * x[k] + v[k]

    Where:
      z = sensor measurements [accel_xyz, mag_xyz, depth]
      H = measurement matrix (relates state to measurements)
      v = measurement noise

  KALMAN UPDATE:
    Prediction: x_hat = F * x_prev
    Innovation: y = z - H * x_hat
    Kalman gain: K = P * H' * (H * P * H' + R)^-1
    Update: x_new = x_hat + K * y

  GPU IMPLEMENTATION:
    - Matrix operations (F, H, K) via cuBLAS
    - Batch processing: multiple time steps simultaneously
    - Extended Kalman Filter for nonlinear dynamics (rotation)
```

### Regression Analysis for Behavioral Correlates

The final stage correlates acoustic behavior with physical behavior:

```
Behavioral Regression Analysis:

  GOAL: Identify relationships between echolocation parameters
  and body movement that reveal hunting behavior [P9]

  PREDICTOR VARIABLES (from tag sensors):
    - Click rate (from hydrophone: inter-click interval)
    - Click source level (from hydrophone: amplitude)
    - Dive depth (from pressure sensor)
    - Body roll rate (from accelerometer/magnetometer fusion)
    - Body pitch rate (from accelerometer/magnetometer fusion)
    - Swimming speed (from accelerometer integration)
    - Heading change rate (from magnetometer)

  RESPONSE VARIABLES:
    - Hunting phase (search / approach / capture / rest)
    - Prey capture success (inferred from specific movement patterns)
    - Behavioral state (foraging / traveling / socializing / resting)

  METHODS:
    - Generalized linear models (GLM) for event prediction
    - Hidden Markov models (HMM) for behavioral state sequences
    - Random forests / gradient boosted trees for multi-variable classification
    - Time-series cross-correlation for lag analysis

  KEY FINDINGS [P9]:
    1. Buzz clicking correlates with rapid body accelerations
    2. Rolling/twisting precedes prey capture events
    3. Click-train parameters predict hunting phase
    4. Vessel noise presence correlates with reduced capture success
    5. Dive depth and duration increase with vessel noise
```

---

## BirdNET: Parallel Development for Avian Bioacoustics

BirdNET represents a parallel development path to ORCA-SPOT -- the same GPU pipeline architecture applied to bird call identification:

```
BirdNET Architecture:

  SIMILARITIES WITH ORCA-SPOT:
    - Spectrogram-based input representation
    - CNN feature extraction
    - Trained on large labeled datasets
    - Real-time inference capability

  KEY DIFFERENCES:
    - Species diversity: BirdNET classifies 6,000+ bird species
      (vs. ORCA-SPOT's binary orca/noise classification)
    - Frequency range: bird calls typically 1-10 kHz
      (vs. orca calls 1-100 kHz)
    - Recording conditions: terrestrial microphones
      (vs. underwater hydrophones)
    - Deployment: smartphone apps, Raspberry Pi recorders
      (vs. dedicated hydrophone stations)

  PNW APPLICATION:
    - Automated bird survey in PNW forests and wetlands
    - Migration monitoring along the Pacific Flyway
    - Endangered species detection (spotted owl, marbled murrelet)
    - Ecosystem health assessment via biodiversity indices
```

The parallel development of ORCA-SPOT and BirdNET demonstrates the universality of the GPU bioacoustic pipeline -- the same architecture works for any species whose vocalizations can be captured as audio and converted to spectrograms.

---

## The Convergence: Biological and Computational Signal Processing

The biological signal processing chain and the computational ML pipeline converge on the same architecture because they solve the same physics problem:

```
CONVERGENCE MAP:

  BIOLOGY (Orca Echolocation)      ML PIPELINE (ORCA-SPOT)
  ============================     ========================

  Phonic lips: generate click      Hydrophone: capture sound
  (source generation)              (sensor input)

  Melon: focus beam                Band-pass filter: select
  (spatial filtering)              frequency range of interest
                                   (spectral filtering)

  Seawater propagation:            ADC + cable: transmit signal
  carries sound to target          to processing hardware
  (channel)                        (data transport)

  Mandible fat pads:               STFT: convert time-domain
  couple echo to cochlea           signal to time-frequency
  (impedance matching)             representation
                                   (domain transformation)

  Cochlea: frequency analysis      CNN convolutional layers:
  (tonotopic decomposition)        extract spectral features
                                   (feature extraction)

  Auditory cortex: pattern         CNN dense layers:
  recognition and classification   classification and decision
  (neural processing)              (inference)

  Behavioral response:             Alert / notification:
  pursue, capture, or abort        vessel speed reduction,
  (decision output)                researcher alert
                                   (action output)

  Each biological stage has a direct computational analogue.
  This is not coincidence -- it is convergent design driven
  by the physics of acoustic signal processing.
```

---

## PNW Applications: Real-Time Conservation

The GPU bioacoustic pipeline has direct conservation applications in PNW waters:

### Real-Time Whale Detection for Vessel Management

```
Vessel Management Pipeline:

  Hydrophone detects orca vocalizations
       |
       v
  OrcaHello classifies as orca (confidence > threshold)
       |
       v
  Alert sent to Vessel Traffic Service (VTS)
       |
       v
  VTS issues advisory to commercial and recreational traffic:
    - Reduce speed (Quiet Sound program)
    - Maintain 1,000-yard buffer
    - Disable echosounders in critical habitat
       |
       v
  Result: Reduced acoustic masking of orca echolocation
  -> Improved foraging success -> Better conservation outcomes

  Latency requirement: < 5 minutes from detection to advisory
  Current capability: < 1 minute for automated detection
```

### Noise Budget Monitoring

```
Noise Budget Pipeline:

  Continuous hydrophone recording (24/7)
       |
       v
  GPU-accelerated spectral analysis:
    - Ambient noise level in echolocation band (10-100 kHz)
    - Vessel noise contribution
    - Natural noise baseline (wind, rain, biological)
       |
       v
  Noise budget calculation:
    - Total noise vs. baseline
    - Vessel-attributed noise
    - Trend analysis (improving? worsening?)
       |
       v
  Reporting to Quiet Sound program and NOAA
    - Compliance assessment
    - Effectiveness of speed reductions
    - Seasonal and spatial noise patterns
```

### Migration Monitoring

```
Migration Monitoring Pipeline:

  Microphone arrays along Pacific Flyway
       |
       v
  BirdNET classification: species, call type, time, location
       |
       v
  Migration timing analysis:
    - First arrival dates by species
    - Peak passage dates
    - Last departure dates
       |
       v
  Phenological mismatch assessment:
    - Bird arrival vs. insect emergence
    - Climate trend correlation
    - Conservation management decisions
```

---

## GPU Hardware and Performance Considerations

```
GPU Requirements for Real-Time Bioacoustics:

  MINIMUM (single hydrophone, real-time):
    GPU: Entry-level (GTX 1650 / RTX 3050 class)
    VRAM: 4 GB
    Compute: ~5 TFLOPS FP32
    Throughput: 1 hydrophone stream, ~1 second latency

  RECOMMENDED (multi-stream, low-latency):
    GPU: Mid-range (RTX 4060 Ti class)
    VRAM: 8 GB
    Compute: ~22 TFLOPS FP32
    Throughput: 4-8 hydrophone streams, < 500 ms latency

  RESEARCH (multi-tag fusion, training):
    GPU: High-end (RTX 4090 / A100 class)
    VRAM: 24-80 GB
    Compute: ~80-300 TFLOPS FP32
    Throughput: Training new models, batch processing archival data

  COMPARISON WITH BIOLOGICAL SYSTEM:
    Orca brain: ~8 kg, ~20 W metabolic power for entire brain
    Neural processing: parallel, analog, low-precision, low-power
    Classification: species-level from single echo (<1 ms latency)

    The biological system remains more efficient by orders
    of magnitude in energy per classification. But the GPU
    system can process multiple channels simultaneously and
    never needs to sleep, breathe, or eat.
```

---

## Summary Tables

### ORCA-SPOT System Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Training data | 11,509 orca + 34,848 noise segments | P8 |
| Recording archive | ~19,000 hours (Orchive) | P8 |
| Architecture | CNN (spectrogram input) | P8 |
| Accuracy | > 95% on held-out test | P8 |
| Publication | Nature Scientific Reports, 2019 | P8 |

### STFT Parameters for Bioacoustic Types

| Signal Type | Window Length | Freq Resolution | Time Resolution | Source |
|------------|-------------|----------------|----------------|--------|
| Orca clicks (0.1-25 ms) | 1-5 ms | 200-1000 Hz | 1-5 ms | Mission PDF |
| Orca calls (0.5-1.5 s) | 20-50 ms | 20-50 Hz | 20-50 ms | Mission PDF |
| Bat FM sweeps (1-10 ms) | 1-2 ms | 500-1000 Hz | 1-2 ms | P2 |
| Bird songs (0.1-5 s) | 10-30 ms | 30-100 Hz | 10-30 ms | -- |

### Biologging Tag Sensor Parameters

| Sensor | Sample Rate | Measurement | Source |
|--------|------------|-------------|--------|
| Accelerometer (3-axis) | 50-200 Hz | Body acceleration (m/s^2) | P9 |
| Magnetometer (3-axis) | 50-200 Hz | Magnetic field (uT) -> heading | P9 |
| Hydrophone (stereo) | 48-96 kHz | Acoustic pressure (Pa) | P9 |
| Depth sensor | 1-10 Hz | Hydrostatic depth (m) | P9 |

### Pipeline Stage Correspondence

| Biological Stage | ML Pipeline Stage | Physics |
|-----------------|------------------|---------|
| Source (phonic lips / larynx) | Sensor (hydrophone / mic) | Acoustic generation / transduction |
| Propagation (water / air) | Data transport (cable / wireless) | Wave propagation |
| Transducer (melon / pinna) | Preprocessing (filter, normalize) | Signal conditioning |
| Conditioning (cochlea) | STFT (spectrogram) | Frequency decomposition |
| Extraction (auditory cortex) | CNN feature extraction | Pattern recognition |
| Decision (behavioral response) | Classification + alert | Action selection |

---

## Sources

### Government and Agency

- [G1] NOAA Northwest Fisheries Science Center -- Orca conservation, vessel management [https://www.fisheries.noaa.gov/](https://www.fisheries.noaa.gov/)
- [G5] NOAA Vital Signs -- Orcas -- Population and conservation measures [https://vitalsigns.pugetsoundinfo.wa.gov/](https://vitalsigns.pugetsoundinfo.wa.gov/)

### Peer-Reviewed

- [P2] Au, W.W.L. and Simmons, J.A. (2007). Echolocation in dolphins and bats. *Physics Today*.
- [P8] Bergler, C. et al. (2019). ORCA-SPOT deep learning for killer whale detection. *Nature Scientific Reports*.
- [P9] Holt, M. / Tennessen, J. -- NOAA NWFSC. Biologging tag studies on Southern Resident orcas.

### Professional Organizations

- [O2] Orca Behavior Institute -- Salish Sea orca acoustics, live hydrophone network [https://www.orcabehaviorinstitute.org/orca-acoustics](https://www.orcabehaviorinstitute.org/orca-acoustics)

---

*Cross-reference: This GPU/ML pipeline page links to species pages [pnw-01](pnw-01-southern-resident-orca.md) (orca biosonar), [pnw-03](pnw-03-bat-echolocation.md) (bat FM sweeps), and [pnw-06](pnw-06-migratory-birds-compass.md) (BirdNET parallel). It connects to physics pages [01](01-sonar-echo-delay.md) (sonar), [04](04-phase-comb-filter.md) (comb filtering), and [05](05-stft-spectral-analysis.md) (STFT). See the [Data Schema](00-data-schema.md) for page structure definitions and the [Source Index](00-source-index.md) for complete citation details.*

*Safety compliance: SC-01 (no military sonar specifications), SC-02 (no real-time orca location data -- system described architecturally, not operationally), SC-03 (all quantitative claims attributed to sources).*
