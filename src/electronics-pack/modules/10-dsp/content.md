# Module 10: Digital Signal Processing

> **Tier**: 3 | **H&H Reference**: 13.5 | **Safety Mode**: Gate

## Overview

Digital signal processing replaces analog circuits with math. Instead of building an RC lowpass filter with physical components, you write an equation that performs the same filtering on sampled data -- with perfect repeatability, trivial reconfiguration, and frequency responses that no physical circuit could achieve. DSP is how your phone processes voice calls, how MRI machines reconstruct images, how cell towers decode thousands of simultaneous signals, and how noise-cancelling headphones work in real time. The transition from analog to digital processing is the single most important shift in electronics since the transistor. -- H&H 13.5

## Topics

### Topic 1: Discrete-Time Signals

A digital system samples a continuous signal x(t) at regular intervals, producing a sequence of numbers x[n]. Each sample captures the signal's value at time n*T, where T = 1/fs is the sample period and fs is the sample rate. The critical constraint is the Nyquist theorem: you must sample at least twice the highest frequency present (fs >= 2*fmax) or the reconstructed signal will contain false frequencies called aliases. At 8000 Hz sample rate, you can faithfully represent signals up to 4000 Hz. An anti-aliasing filter (analog lowpass) removes frequencies above fs/2 before sampling. -- H&H 13.5

### Topic 2: Convolution

Convolution is the fundamental operation of linear filtering: y[n] = sum(h[k]*x[n-k]) for k = 0 to N-1. The array h[k] is the filter's impulse response -- it completely defines what the filter does. Every sample of the output is a weighted sum of nearby input samples, where the weights are the filter coefficients. This seems like simple arithmetic, but it has a profound dual: convolution in the time domain equals multiplication in the frequency domain. Design your filter's frequency response H(f), and convolution automatically produces the correct time-domain filtering. -- H&H 13.5

### Topic 3: FIR Filters

A Finite Impulse Response filter computes each output from a finite number of past input samples only -- no feedback. The output y[n] = h[0]*x[n] + h[1]*x[n-1] + ... + h[N-1]*x[n-N+1]. FIR filters are always stable because they have no feedback paths that could cause oscillation. With symmetric coefficients (h[n] = h[N-1-n]), they achieve perfectly linear phase, meaning all frequencies experience the same time delay -- crucial for audio and data communications. The simplest FIR filter is the moving average: N equal coefficients of value 1/N. For precise frequency control, the windowed-sinc method designs coefficients that approximate ideal frequency responses. -- H&H 13.5

### Topic 4: IIR Filters

An Infinite Impulse Response filter uses feedback -- its output depends on both past inputs and past outputs: y[n] = sum(b[k]*x[n-k]) - sum(a[k]*y[n-k]). This feedback makes IIR filters far more efficient: a 4th-order IIR Butterworth lowpass achieves what would require 50+ FIR taps. The cost is potential instability (feedback can cause runaway oscillation) and nonlinear phase (different frequencies are delayed by different amounts). IIR filters are designed by transforming classic analog prototypes (Butterworth, Chebyshev, Bessel) to digital form via the bilinear transform. The biquad (second-order section) is the standard building block. -- H&H 13.5

### Topic 5: The Discrete Fourier Transform and FFT

The DFT converts a time-domain sequence x[n] into frequency-domain coefficients X[k] = sum(x[n]*exp(-j*2*pi*k*n/N)) for n = 0 to N-1. Each X[k] represents the signal's content at frequency k*fs/N Hz. Computing the DFT directly requires O(N^2) operations, but the Fast Fourier Transform (FFT) -- specifically the Cooley-Tukey radix-2 algorithm -- reduces this to O(N*log2(N)) by exploiting symmetry and periodicity. For N=1024, that is a 100x speedup. The frequency resolution is fs/N: more samples means finer frequency discrimination. Zero-padding interpolates between existing frequency bins but does not increase actual spectral resolution. -- H&H 13.5

### Topic 6: Windowing

The FFT assumes its input repeats infinitely. When the signal does not complete an integer number of cycles in the analysis window, the implied repetition creates discontinuities that spread spectral energy across many bins -- this is spectral leakage. Window functions (Hanning, Hamming, Blackman, Kaiser) taper the signal smoothly to zero at the edges, eliminating the discontinuity. The trade-off: tapering widens the main spectral peak (reduced frequency resolution) but dramatically suppresses the sidelobe leakage. Hanning is a safe general-purpose choice. Hamming has slightly better sidelobe rejection. Rectangular (no window) is optimal only when the signal completes exact integer cycles. -- H&H 13.5

### Topic 7: Filter Design Parameters

A filter specification defines four key parameters: passband ripple (how flat the passband must be, typically < 0.1 dB), stopband attenuation (how much the rejected frequencies are suppressed, typically > 40 dB), transition bandwidth (how quickly the filter transitions from pass to stop), and filter order (number of coefficients or poles). These parameters trade off against each other: sharper transitions require higher order (more computation). For FIR filters, the Parks-McClellan algorithm optimally distributes error across the passband and stopband. For IIR filters, Butterworth gives maximally flat passband, Chebyshev allows passband ripple for sharper transitions, and Bessel preserves time-domain waveform shape. -- H&H 13.5

### Topic 8: Fixed-Point Arithmetic

Embedded DSP processors and FPGAs typically use fixed-point arithmetic instead of floating-point to save silicon area, power, and cost. Q-format notation describes the binary point position: Q15 uses 1 sign bit and 15 fractional bits, representing values from -1.0 to +0.999969. Multiplication of two Q15 numbers produces a Q30 result that must be shifted back. The designer must carefully manage scaling to prevent overflow (clipping) and underflow (lost precision). Saturation arithmetic clamps overflow to the maximum representable value instead of wrapping around. Each additional bit of precision costs roughly 2x in multiplier area. Modern ARM Cortex-M4F cores include floating-point units that make fixed-point less necessary for many applications. -- H&H 13.5

### Topic 9: Real-World DSP Applications

Audio processing uses FIR filters for equalization, IIR filters for dynamic range compression, and FFT for spectrum display. Communications systems use DSP for modulation (QAM, OFDM), demodulation, channel equalization, and error correction. Control systems implement digital PID controllers and Kalman filters for state estimation. Biomedical engineering uses DSP for ECG filtering (removing 60 Hz power line noise while preserving the heart signal), EEG analysis (extracting brain wave frequency bands), and medical imaging reconstruction. Image processing extends DSP to two dimensions: 2D DFT for frequency analysis, 2D convolution for edge detection and blurring. Every smartphone performs millions of DSP operations per second. -- H&H 13.5

### Topic 10: DSP Hardware

Dedicated DSP processors (TI C6000 series, Analog Devices SHARC) are optimized for the multiply-accumulate (MAC) operation -- the core of convolution. A single MAC computes one coefficient multiplication and accumulation per clock cycle. Performance is measured in MMAC/s (millions of MACs per second) or GFLOPS for floating-point units. Modern FPGA-based DSP can run thousands of MAC units in parallel, processing entire filter banks simultaneously. Microcontrollers with DSP extensions (ARM Cortex-M4F, M7) bring real-time filtering to low-cost embedded systems. The choice between DSP processor, FPGA, and MCU depends on the required throughput, power budget, and development time. -- H&H 13.5

## Learn Mode Depth Markers

### Level 1: Practical

> Digital filtering processes sampled signals using math instead of analog components. You can design "impossible" filter shapes that no physical circuit could achieve. -- H&H 13.5

> The FFT reveals which frequencies are present in a signal. Think of it as a prism that splits light into a spectrum, but for electronic signals. -- H&H 13.5

### Level 2: Reference

> See H&H 13.5 for FIR and IIR filter design, the discrete Fourier transform, windowing functions, and the relationship between analog and digital filter specifications. -- H&H 13.5

### Level 3: Mathematical

> FIR output: y[n] = sum(h[k]*x[n-k], k=0..N-1). DFT: X[k] = sum(x[n]*exp(-j*2*pi*k*n/N), n=0..N-1). Z-transform: H(z) = Y(z)/X(z). IIR: y[n] = sum(b[k]*x[n-k]) - sum(a[k]*y[n-k]). -- H&H 13.5
