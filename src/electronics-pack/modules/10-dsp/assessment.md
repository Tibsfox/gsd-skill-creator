# Module 10: Digital Signal Processing -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: FIR vs IIR Filters

Explain the fundamental difference between FIR (Finite Impulse Response) and IIR (Infinite Impulse Response) filters. Why are FIR filters always stable while IIR filters can become unstable?

## Question 2: FIR Filter Delay

An FIR lowpass filter has 51 taps and operates at a sample rate of 44,100 Hz. What is the filter's group delay in milliseconds? Show your work.

## Question 3: FFT Resolution

You run a 256-point FFT on a signal sampled at 8000 Hz. (a) What is the frequency resolution (spacing between bins)? (b) What is the maximum frequency you can observe without aliasing?

## Question 4: ECG Noise Removal

You need to remove 60 Hz power line interference from an ECG (electrocardiogram) signal sampled at 500 Hz. Design an appropriate filter: specify the filter type, cutoff frequency or frequencies, and explain why you chose that particular approach over alternatives.

## Question 5: Windowing Trade-offs

Explain why a Hanning window reduces spectral leakage compared to a rectangular window, and what trade-off this introduces. Under what conditions is the rectangular window actually the better choice?

## Answer Key

### Answer 1

An FIR filter computes its output using only a finite number of past **input** samples: y[n] = sum(h[k]*x[n-k]). It has no feedback -- the output never depends on previous outputs. An IIR filter uses **feedback**: its output depends on both past inputs and past outputs: y[n] = sum(b[k]*x[n-k]) - sum(a[k]*y[n-k]).

FIR filters are always stable because they have no feedback paths. Each output is a finite weighted sum of inputs, so even if the input is bounded, the output is guaranteed bounded. There is no mechanism for energy to accumulate or grow over time.

IIR filters can become unstable because their feedback coefficients (the a[k] terms) can cause the output to grow without bound. Mathematically, instability occurs when any pole of the transfer function H(z) lies outside the unit circle in the z-plane. A stable IIR design requires all poles to have magnitude less than 1. Quantization (rounding coefficients to finite precision) can sometimes move poles outside the unit circle, causing an otherwise stable design to oscillate. -- H&H 13.5 (FIR vs IIR filter architectures and stability)

### Answer 2

For a symmetric FIR filter, the group delay is (N-1)/2 samples, where N is the number of taps.

- Group delay in samples: (51 - 1) / 2 = 25 samples
- Group delay in seconds: 25 / 44,100 = 0.000567 seconds
- Group delay in milliseconds: **0.567 ms**

This constant group delay is a key advantage of linear-phase FIR filters: all frequencies are delayed by exactly the same amount, preserving the waveform shape. -- H&H 13.5 (FIR filter group delay and linear phase)

### Answer 3

**(a) Frequency resolution:**

Resolution = fs / N = 8000 / 256 = **31.25 Hz**

Each FFT bin represents a 31.25 Hz frequency band. You cannot distinguish two frequencies that are closer together than 31.25 Hz.

**(b) Maximum observable frequency:**

fmax = fs / 2 = 8000 / 2 = **4000 Hz**

This is the Nyquist frequency. Frequencies above 4000 Hz would alias (fold back) into the 0-4000 Hz range, producing false spectral content. -- H&H 13.5 (DFT frequency resolution and Nyquist limit)

### Answer 4

**Recommended approach: FIR notch (bandstop) filter centered at 60 Hz.**

- **Filter type:** Bandstop (notch) filter
- **Center frequency:** 60 Hz
- **Notch bandwidth:** Narrow, approximately 58-62 Hz (4 Hz wide)
- **Filter order:** High (e.g., 201 taps) to achieve a narrow notch without affecting nearby ECG frequency content

**Why this approach:** The ECG signal contains meaningful content from approximately 0.5 Hz to 150 Hz. A simple lowpass filter cutting off below 60 Hz would remove important QRS complex components. A highpass above 60 Hz would remove the P-wave and T-wave entirely. A bandstop (notch) filter precisely removes the 60 Hz interference while preserving all other frequencies.

**Alternatives considered:**
- An IIR notch filter would work with fewer coefficients but introduces nonlinear phase that could distort the ECG waveform timing, potentially affecting clinical measurements.
- Adaptive filtering (LMS algorithm) could track a varying 60 Hz interference but adds complexity.
- A simple moving average of period 1/60 s = 16.67 ms (approximately 8 samples at 500 Hz) would null 60 Hz but also attenuate harmonics and nearby frequencies.

-- H&H 13.5 (digital filter design for noise removal)

### Answer 5

**Why Hanning reduces spectral leakage:** The FFT assumes its input signal repeats infinitely. When a signal does not complete an integer number of cycles in the analysis window, the implied repetition creates abrupt discontinuities at the window edges. These sharp transitions generate broadband spectral energy that appears as "leakage" across many frequency bins.

The Hanning window multiplies the signal by a smooth cosine taper: w[n] = 0.5*(1 - cos(2*pi*n/(N-1))). This forces the signal smoothly to zero at both edges, eliminating the discontinuity. Without the discontinuity, the leakage energy drops dramatically -- Hanning sidelobes are approximately 31 dB below the main peak, compared to only 13 dB for rectangular.

**The trade-off:** Tapering the signal effectively reduces the useful data at the window edges, making the main spectral peak wider. Hanning has a mainlobe width approximately 2x that of the rectangular window, meaning two closely spaced frequencies become harder to distinguish.

**When rectangular is better:** The rectangular window is optimal when the signal completes an exact integer number of cycles within the analysis window. In this case, there are no edge discontinuities and therefore no leakage. The rectangular window then gives the narrowest possible mainlobe (best frequency resolution). This occurs naturally with synchronous sampling, where the sample clock is derived from or locked to the signal frequency. -- H&H 13.5 (windowing functions and spectral leakage)
