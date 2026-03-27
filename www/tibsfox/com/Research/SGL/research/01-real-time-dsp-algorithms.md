# Real-Time DSP Algorithms

> **Domain:** Digital Signal Processing
> **Module:** 1 -- Adaptive Noise Cancellation and Spectral Methods
> **Through-line:** *The signal is already there. The noise is what you add by not listening carefully enough.* Active noise cancellation doesn't create silence -- it generates the precise inverse of what shouldn't be there, sample by sample, in real time. The mathematics are elegant. The engineering is unforgiving.

---

## Table of Contents

1. [The Adaptive Filter Problem](#1-the-adaptive-filter-problem)
2. [LMS: Least Mean Squares](#2-lms-least-mean-squares)
3. [NLMS: Normalized LMS](#3-nlms-normalized-lms)
4. [FxLMS: Filtered-Reference LMS](#4-fxlms-filtered-reference-lms)
5. [RLS: Recursive Least Squares](#5-rls-recursive-least-squares)
6. [Spectral Methods](#6-spectral-methods)
7. [AI-Enhanced Noise Suppression](#7-ai-enhanced-noise-suppression)
8. [ANC System Architectures](#8-anc-system-architectures)
9. [Convergence Analysis and Stability](#9-convergence-analysis-and-stability)
10. [The Z-Transform Framework](#10-the-z-transform-framework)
11. [Implementation Considerations](#11-implementation-considerations)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Adaptive Filter Problem

Active noise cancellation operates on the principle of destructive interference: generating an anti-noise signal with equal amplitude but inverted phase relative to the unwanted noise. The system requires two inputs -- a primary input containing signal plus noise, and a reference input correlated with the noise but uncorrelated with the desired signal [1].

The adaptive filter continuously adjusts its coefficients (weights) to minimize the error signal -- the difference between the desired output and the filter's actual output. This is a fundamentally different problem from fixed-filter design: the filter must track changes in the noise characteristics in real time, converging fast enough to be useful but not so fast that it becomes unstable.

```
ADAPTIVE NOISE CANCELLATION -- BASIC ARCHITECTURE
================================================================

  Noise Source ──────────────┐
       │                     │
       │                     v
       │              ┌──────────────┐
       │              │  Reference   │
       │              │  Microphone  │
       │              └──────┬───────┘
       │                     │ x(n)
       │                     v
       │              ┌──────────────┐
       │              │  Adaptive    │
       │              │  Filter W(z) │
       │              └──────┬───────┘
       │                     │ y(n) = W(z) * x(n)
       v                    │
  ┌──────────┐              │
  │ Primary  │              │
  │ Signal   │──── + ──── - ────> e(n) = d(n) - y(n)
  │ d(n)     │                         (error signal)
  └──────────┘
```

The key algorithms form a hierarchy of increasing complexity and performance. Each trades computational cost for convergence speed, stability, or both.

> **SAFETY WARNING:** ANC system failures can expose users to loud transients. If the adaptive filter diverges (coefficients grow without bound), the anti-noise signal becomes additive rather than canceling, potentially doubling the sound pressure level at the listener's ear. Hearing damage thresholds begin at approximately 85 dB SPL for sustained exposure [2].

---

## 2. LMS: Least Mean Squares

The LMS algorithm is the foundational adaptive filter. Proposed by Widrow and Hoff in 1960 [3], it remains the most widely implemented adaptive algorithm due to its simplicity and low computational cost.

### Weight Update Rule

The LMS algorithm updates filter weights proportional to the instantaneous error gradient:

```
w(n+1) = w(n) + mu * e(n) * x(n)
```

Where:
- `w(n)` is the weight vector at time n (length N, the filter order)
- `mu` is the step size (learning rate), controlling convergence speed vs. stability
- `e(n) = d(n) - w(n)^T * x(n)` is the error signal
- `x(n)` is the reference input vector `[x(n), x(n-1), ..., x(n-N+1)]`

### Computational Cost

LMS requires exactly `2N + 1` multiply-accumulate operations per sample:
- N multiplications for the filter output `y(n) = w^T * x(n)`
- N multiplications for the weight update `mu * e(n) * x(n)`
- 1 subtraction for the error `e(n) = d(n) - y(n)`

This O(N) per-sample cost is the algorithm's primary advantage. For a 64-tap filter at 48 kHz sampling rate, LMS requires only 129 MACs per 20.8-microsecond sample period -- trivially achievable on any modern DSP or microcontroller.

### Step-Size Bounds

The step size `mu` must satisfy the stability condition:

```
0 < mu < 2 / (N * Px)
```

Where `Px` is the input signal power (mean of x^2). If `mu` exceeds this bound, the filter weights diverge and the system becomes unstable. In practice, `mu` is typically set to 10-50% of the theoretical maximum to provide a stability margin [4].

### Convergence Behavior

LMS convergence speed is inversely proportional to the eigenvalue spread of the input signal's autocorrelation matrix. When the input has a flat spectrum (white noise), convergence is fast and uniform across all filter taps. When the input is colored (e.g., speech or music with strong spectral peaks), convergence slows dramatically because the step size is limited by the largest eigenvalue but convergence of individual modes is governed by their respective eigenvalues.

The time constant for the slowest mode is approximately:

```
tau_max = 1 / (2 * mu * lambda_min)
```

Where `lambda_min` is the smallest eigenvalue of the autocorrelation matrix. This eigenvalue spread problem motivates the normalized and transform-domain variants.

---

## 3. NLMS: Normalized LMS

The Normalized LMS algorithm addresses LMS's sensitivity to input signal power variations by normalizing the step size by the instantaneous input power [5].

### Weight Update Rule

```
w(n+1) = w(n) + (mu / (x(n)^T * x(n) + epsilon)) * e(n) * x(n)
```

Where:
- `epsilon` is a small positive constant (regularization) preventing division by zero
- The denominator `x(n)^T * x(n) + epsilon` is the squared norm of the input vector plus regularization

### Effective Step Size

The effective step size at each sample is:

```
mu_eff(n) = mu / (||x(n)||^2 + epsilon)
```

This normalization provides several advantages:
- **Automatic adaptation** to input level changes -- the effective step size decreases when input power is high and increases when it's low
- **Faster convergence** for colored inputs because the normalization partially decorrelates the eigenvalue spread
- **Reduced sensitivity** to initial step-size selection

### Computational Cost

NLMS requires `3N + 2` operations per sample -- one additional division and N additional multiplications for the norm calculation compared to LMS. On modern DSP hardware with single-cycle multiply-accumulate units, this overhead is negligible.

### Stability Condition

For NLMS, the stability bound simplifies to:

```
0 < mu < 2
```

This is independent of the input signal power, making step-size selection much more straightforward than standard LMS. In practice, `mu` values between 0.1 and 1.0 are typical for audio applications [6].

---

## 4. FxLMS: Filtered-Reference LMS

The Filtered-x LMS algorithm is required whenever an acoustic delay (the "secondary path") exists between the cancellation output and the error measurement point [7]. This is the standard algorithm for real-world ANC systems.

### The Secondary Path Problem

In a physical ANC system, the anti-noise signal passes through:
1. A digital-to-analog converter (DAC)
2. A power amplifier
3. A loudspeaker
4. The acoustic path from loudspeaker to error microphone
5. An analog-to-digital converter (ADC) at the error microphone

This combined transfer function `S(z)` introduces delay, frequency-dependent gain, and phase shift. If ignored (i.e., if standard LMS is used), the algorithm may converge to the wrong solution or diverge entirely, because the error signal's phase relationship to the reference input is distorted by the secondary path.

### Algorithm Structure

FxLMS filters the reference signal through an estimate of the secondary path `S_hat(z)` before using it in the weight update:

```
x_f(n) = S_hat(z) * x(n)          -- filtered reference
e(n)   = d(n) - S(z) * (w^T * x(n))  -- error through actual secondary path
w(n+1) = w(n) + mu * e(n) * x_f(n)   -- update with filtered reference
```

### Secondary Path Identification

The secondary path estimate `S_hat(z)` is typically obtained through an offline identification procedure:

1. Inject white noise through the cancellation speaker
2. Record the noise at the error microphone
3. Use LMS or NLMS to identify the impulse response of the path
4. Store the identified FIR filter coefficients

Some systems perform online secondary path identification using auxiliary noise injection, but this adds residual noise to the output and increases complexity.

### Convergence Conditions

FxLMS converges when the phase error between `S(z)` and `S_hat(z)` is less than 90 degrees across the frequency band of interest:

```
|angle(S(f)) - angle(S_hat(f))| < 90 degrees, for all f in band
```

This phase constraint means the secondary path estimate must be reasonably accurate -- large modeling errors cause instability, not just poor performance [8].

```
FxLMS SIGNAL FLOW
================================================================

  Reference ──> x(n) ──┬──────────────> W(z) ────> y(n) ──> S(z) ──┐
  Microphone            │                                             │
                        │                                             v
                        v                                         ┌──────┐
                    S_hat(z) ──> x_f(n)                           │  +   │
                        │                                         │  -   │──> e(n)
                        │                                         └──┬───┘
                        │                                            ^
                        v                                            │
                    ┌────────────────────┐                    Primary │
                    │  w(n+1) = w(n)     │                    Signal  │
                    │  + mu*e(n)*x_f(n)  │<───── e(n) ───────────────┘
                    └────────────────────┘
```

---

## 5. RLS: Recursive Least Squares

The RLS algorithm minimizes the weighted sum of squared errors over the entire signal history, rather than the instantaneous error [9]. This provides dramatically faster convergence at significantly higher computational cost.

### Algorithm

RLS maintains and updates an inverse autocorrelation matrix `P(n)` (size N x N):

```
k(n)   = P(n-1) * x(n) / (lambda + x(n)^T * P(n-1) * x(n))
e(n)   = d(n) - w(n)^T * x(n)
w(n+1) = w(n) + k(n) * e(n)
P(n)   = (P(n-1) - k(n) * x(n)^T * P(n-1)) / lambda
```

Where:
- `k(n)` is the Kalman gain vector
- `lambda` is the forgetting factor (typically 0.95-1.0), controlling how quickly past data is discounted
- `P(n)` is the inverse correlation matrix (initialized to `delta * I` where `delta` is a large positive constant)

### Computational Cost

RLS requires O(N^2) operations per sample due to the matrix update, compared to O(N) for LMS. For a 64-tap filter:
- LMS: ~129 MACs per sample
- RLS: ~4,225 MACs per sample

This 33x increase in computation makes RLS impractical for long filters on constrained hardware, but appropriate for short filters where fast convergence is critical.

### Convergence Comparison

| Algorithm | Convergence Speed | Computation (N taps) | Memory | Tracking |
|-----------|-------------------|----------------------|--------|----------|
| LMS       | Slow              | O(N)                 | O(N)   | Fair     |
| NLMS      | Moderate          | O(N)                 | O(N)   | Good     |
| FxLMS     | Moderate          | O(N + M)             | O(N+M) | Good     |
| RLS       | Fast              | O(N^2)               | O(N^2) | Excellent|

Where M is the secondary path filter length for FxLMS.

### When to Use RLS

RLS is preferred when:
- The noise characteristics change rapidly (non-stationary environments)
- The filter order is small (N < 32)
- Computational resources are abundant
- Fast initial convergence is more important than steady-state performance

---

## 6. Spectral Methods

Frequency-domain processing provides complementary tools for noise reduction, particularly for non-adaptive scenarios where noise statistics can be estimated in advance.

### Spectral Subtraction

Spectral subtraction estimates the noise spectrum during silence periods and subtracts it from the noisy signal's spectrum [10]:

```
|S_hat(f)|^2 = |X(f)|^2 - alpha * |N_hat(f)|^2
```

Where:
- `|X(f)|^2` is the noisy signal's power spectrum
- `|N_hat(f)|^2` is the estimated noise power spectrum (from silence frames)
- `alpha` is an oversubtraction factor (typically 1.0-4.0) controlling noise reduction aggressiveness
- The result is half-wave rectified to prevent negative power estimates

Spectral subtraction introduces "musical noise" -- isolated spectral peaks that appear and disappear randomly, creating tonal artifacts. Mitigation strategies include spectral floor constraints (minimum gain per frequency bin) and multi-frame averaging.

### Wiener Filtering

The Wiener filter provides the optimal linear filter in the minimum mean-square error sense when signal and noise power spectra are known [11]:

```
H(f) = Pss(f) / (Pss(f) + Pnn(f))
```

Where `Pss(f)` is the signal power spectral density and `Pnn(f)` is the noise power spectral density. The Wiener filter is optimal for stationary signals but degrades for non-stationary content, which is the common case in audio.

### Short-Time Fourier Transform (STFT)

The STFT enables frequency-domain processing of non-stationary signals by windowing the input into overlapping frames:

```
X(m, k) = sum_{n=0}^{N-1} x(n + mH) * w(n) * exp(-j*2*pi*k*n/N)
```

Where:
- `m` is the frame index
- `k` is the frequency bin index
- `H` is the hop size (frame advance, typically N/4 for 75% overlap)
- `w(n)` is the analysis window (Hann or Hamming)

The overlap-add method reconstructs the time-domain signal after spectral modification. Window choice affects the trade-off between frequency resolution (longer windows) and temporal resolution (shorter windows).

---

## 7. AI-Enhanced Noise Suppression

### DTLN: Dual-Signal Transformation LSTM Network

The Dual-signal Transformation LSTM Network (DTLN) represents the current state of the art in real-time speech enhancement [12]. The architecture combines two complementary processing stages:

**Stage 1:** STFT-based magnitude spectrum processing using an LSTM network. This stage learns the spectral envelope of clean speech and applies a gain mask to suppress noise in the magnitude domain.

**Stage 2:** A learned analysis/synthesis basis (similar to a learned filter bank) processes the complex signal including phase information. This stage captures fine temporal structure that STFT-based processing misses.

### Performance Characteristics

- **Model size:** Fewer than one million parameters
- **Latency:** Processes one second of audio in approximately 33ms on modern hardware
- **Quality:** Competitive with models 10-100x larger
- **Real-time capable:** Runs within a single sample buffer at 16 kHz on edge hardware

The DTLN architecture demonstrates that the Amiga Principle applies to neural network design: a specialized, efficient architecture tuned to the problem structure outperforms brute-force scaling. The same approach -- dedicated computation paths for distinct aspects of the signal -- that made Paula effective in 1985 makes DTLN effective in 2024.

---

## 8. ANC System Architectures

### Feedforward ANC

Feedforward systems sample the noise before it reaches the cancellation point. The reference microphone is placed upstream of the cancellation speaker, providing advance information about the incoming noise [13].

**Narrowband feedforward** systems handle periodic noise (engines, fans, compressors) by generating reference signals matched to the noise's fundamental frequency and harmonics. A tachometer signal from the noise source often provides the fundamental frequency directly, allowing the system to track RPM changes without adaptation delay.

**Broadband feedforward** systems use the FxLMS algorithm to handle non-periodic noise with continuous spectral content. The reference microphone must be far enough from the cancellation speaker that the acoustic delay provides sufficient processing time for the filter computation.

### Feedback ANC

Feedback systems cancel noise without a separate reference microphone, using a delayed version of the error signal as the reference [14]. The cancellation speaker and error microphone are co-located (e.g., inside a headphone ear cup).

This architecture is effective when:
- The noise is narrowband and the desired signal is broadband
- The noise is predictable (repeating patterns)
- The acoustic delay through the secondary path is short

Feedback ANC is inherently limited in bandwidth because the system must process and output the anti-noise signal within the time it takes sound to travel around the feedback loop. For headphones with a 5mm path length, this gives approximately 15 microseconds -- enough for narrowband cancellation but insufficient for broadband noise at high frequencies.

### Hybrid Systems

Modern ANC headphones combine feedforward and feedback architectures. The feedforward path handles broadband noise using external microphones; the feedback path refines the cancellation using the internal microphone. Combined systems achieve 20-40 dB noise reduction across 50 Hz to 2 kHz, with narrowband performance up to 5 kHz [15].

---

## 9. Convergence Analysis and Stability

### Misadjustment

The misadjustment `M` quantifies how far the adapted filter's steady-state performance is from the optimal (Wiener) solution:

```
M = mu * N * Px / 2    (for LMS)
M = mu * N / 2         (for NLMS)
```

Lower misadjustment means better steady-state performance but slower convergence. The fundamental trade-off: fast adaptation requires large step sizes, which increase steady-state error.

### Stability Margins

For safety-critical ANC applications (hearing aids, aircraft cabin systems), the stability margin should be at least 6 dB -- the step size should be set to no more than 50% of the theoretical maximum. This provides a factor-of-two safety margin against sudden input power increases.

### Failure Modes

| Failure Mode | Cause | Symptom | Mitigation |
|---|---|---|---|
| Weight divergence | mu too large | Exponentially growing output | Constrained mu, weight projection |
| Slow convergence | mu too small | Noise persists for seconds | Variable mu, NLMS |
| Secondary path error | S_hat outdated | Oscillation at specific frequencies | Online path ID, periodic re-identification |
| Narrowband ringing | Poles near unit circle | Tonal artifacts | Higher-order sections, pole radius constraint |

> **SAFETY WARNING:** In hearing aid applications, ANC failure can expose the user to amplified noise rather than cancelled noise. IEC 60118-13 specifies maximum output sound pressure levels. All adaptive filter systems in hearing aids must include hard-limiter output stages that prevent the output from exceeding 132 dB SPL under any failure condition [16].

---

## 10. The Z-Transform Framework

The z-transform provides the mathematical bridge between continuous-time filter design and discrete-time implementation. For a discrete-time sequence `x(n)`, the z-transform is:

```
X(z) = sum_{n=-inf}^{inf} x(n) * z^(-n)
```

### Key Properties for DSP Implementation

- **Delay:** `x(n-k)` maps to `z^(-k) * X(z)` -- each unit delay is one multiplication by z^(-1)
- **Convolution:** Time-domain convolution maps to z-domain multiplication -- filter cascading is simple polynomial multiplication
- **Stability:** A causal system is stable if and only if all poles of its transfer function `H(z)` lie strictly inside the unit circle `|z| < 1`

### Filter Design Workflow

```
CONTINUOUS-TIME TO DISCRETE-TIME PIPELINE
================================================================

  Analog spec ──> Continuous H(s) ──> Bilinear transform ──> H(z)
       │                                                       │
       │          s = (2/T) * (1 - z^(-1)) / (1 + z^(-1))     │
       │                                                       │
       v                                                       v
  Frequency      Pre-warping at critical frequencies      Coefficient
  response       compensates for bilinear nonlinearity    quantization
  specification                                           (see Module 2)
```

The bilinear transform maps the entire left half of the s-plane (stable region) to the interior of the unit circle in the z-plane, preserving stability. However, it compresses the frequency axis nonlinearly -- a phenomenon called frequency warping -- which must be pre-compensated at the design stage.

---

## 11. Implementation Considerations

### Buffer Sizing and Latency

At 48 kHz sampling rate, each sample period is approximately 20.8 microseconds. Processing typically occurs in blocks:

| Buffer Size | Latency | Frequency Resolution (FFT) | Typical Application |
|---|---|---|---|
| 32 samples | 0.67 ms | 1500 Hz | Hearing aids |
| 64 samples | 1.33 ms | 750 Hz | ANC headphones |
| 256 samples | 5.33 ms | 187.5 Hz | Live sound monitoring |
| 1024 samples | 21.3 ms | 46.9 Hz | Music production |
| 4096 samples | 85.3 ms | 11.7 Hz | Offline analysis |

For ANC in headphones, the total acoustic delay from noise source through the secondary path to the ear must be shorter than the processing delay, placing an upper bound on filter length and algorithm complexity [17].

### Fixed-Point vs. Floating-Point

Embedded DSP implementations often use fixed-point arithmetic for cost and power efficiency. The coefficient wordlength directly affects filter performance:

- **16-bit fixed-point:** Adequate for filters with poles away from the unit circle; introduces quantization noise floor around -96 dB
- **24-bit fixed-point:** Standard for professional audio; noise floor around -144 dB
- **32-bit floating-point:** Eliminates most quantization concerns; standard on modern DSPs like the TI TMS320C6748

Fixed-point coefficient quantization is the single most common cause of filter instability in real implementations. Module 2 covers this in detail.

### Hardware Acceleration

Modern DSP processors provide dedicated multiply-accumulate (MAC) units optimized for filter computation. The TI TMS320C6748 VLIW architecture executes up to 8 MACs per clock cycle at 456 MHz, providing 3,648 MMACs/s -- sufficient for hundreds of simultaneous adaptive filters at audio rates [18].

---

## 12. Cross-References

> **Related:** [ASIC & FPGA DSP](02-asic-fpga-dsp.md) -- hardware implementation of the algorithms described here. [Sound Filtering & Audio](03-sound-filtering-audio.md) -- practical application of filter theory to audio processing. [MIDI & Control Protocols](06-midi-control-protocols.md) -- MIDI 2.0 Jitter Reduction Timestamps apply similar timing-critical concepts.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** Shares DSP algorithm foundations, extends into multi-pass analysis
- **FQC (Frequency Continuum):** Fourier analysis and spectral methods overlap
- **T55 (555 Timer):** Fixed-point timing precision concepts
- **GRD (Gradient Engine):** Gradient descent parallels in LMS optimization
- **EMG (Electric Motors):** ANC for motor-generated noise

---

## 13. Sources

1. Widrow, B. and Stearns, S.D. *Adaptive Signal Processing*. Prentice-Hall, 1985.
2. NIOSH. "Criteria for a Recommended Standard: Occupational Noise Exposure." Publication No. 98-126, 1998.
3. Widrow, B. and Hoff, M.E. "Adaptive Switching Circuits." IRE WESCON Convention Record, Part 4, pp. 96-104, 1960.
4. Haykin, S. *Adaptive Filter Theory*. 5th ed. Prentice-Hall, 2014.
5. Nagumo, J. and Noda, A. "A Learning Method for System Identification." IEEE Trans. Automatic Control, vol. 12, no. 3, pp. 282-287, 1967.
6. Douglas, S.C. "Normalized Natural Gradient Adaptive Filtering." IEEE Signal Processing Letters, vol. 7, no. 2, 2000.
7. Elliott, S.J. and Nelson, P.A. "Active Noise Control." IEEE Signal Processing Magazine, vol. 10, no. 4, pp. 12-35, 1993.
8. Texas Instruments. "Design of Active Noise Control Systems With the TMS320 Family." Application Report SPRA042, 1996.
9. Cioffi, J.M. and Kailath, T. "Fast, Recursive-Least-Squares Transversal Filters for Adaptive Filtering." IEEE Trans. ASSP, vol. 32, no. 2, pp. 304-337, 1984.
10. Boll, S.F. "Suppression of Acoustic Noise in Speech Using Spectral Subtraction." IEEE Trans. ASSP, vol. 27, no. 2, pp. 113-120, 1979.
11. Wiener, N. *Extrapolation, Interpolation, and Smoothing of Stationary Time Series*. MIT Press, 1949.
12. Westhausen, N.L. and Meyer, B.T. "Dual-Signal Transformation LSTM Network for Real-Time Noise Suppression." Proc. Interspeech, 2020.
13. NASA ADS. "Digital Signal Processing System for Active Noise Reduction." Technical Report, 1992.
14. Kuo, S.M. and Morgan, D.R. *Active Noise Control Systems: Algorithms and DSP Implementations*. Wiley, 1996.
15. Bose Corporation. Technical specifications for QuietComfort series ANC performance, 2023.
16. IEC 60118-13:2019. "Electroacoustics -- Hearing aids -- Part 13: Electromagnetic compatibility (EMC)."
17. Sennheiser. "Adaptive ANC Technical White Paper: Latency Budgets in Consumer Headphones." 2022.
18. Texas Instruments. "TMS320C6748 Fixed- and Floating-Point DSP Datasheet." SPRS577K, 2021.

---

*Signal & Light -- Module 1: Real-Time DSP Algorithms. The mathematics of cancellation: making nothing from something, precisely.*
