# Module 9: Data Conversion

> **Tier**: 3 | **H&H Reference**: Ch.13 | **Safety Mode**: Gate

## Overview

[To be implemented in Phase 273]

## Topics

[Topic list placeholder]

## Learn Mode Depth Markers

### Level 1: Practical

> An ADC converts analog voltage to a digital number. More bits means finer resolution. The sampling rate must be at least twice the highest signal frequency (Nyquist rule). -- H&H Ch.13

> A DAC converts a digital number back to analog voltage. Glitches during transitions can be smoothed with a sample-and-hold output stage. -- H&H Ch.13

### Level 2: Reference

> See H&H Ch.13 for ADC architectures (successive approximation, delta-sigma, flash), DAC topologies (R-2R ladder, current-steering), and quantization error analysis. -- H&H Ch.13

### Level 3: Mathematical

> Resolution: LSB = V_ref / 2^n. Quantization noise: SNR_q = 6.02*n + 1.76 dB. Nyquist criterion: f_sample >= 2*f_max. Oversampling gain: +3dB SNR per doubling of sample rate. ENOB = (SINAD - 1.76)/6.02. -- H&H Ch.13
