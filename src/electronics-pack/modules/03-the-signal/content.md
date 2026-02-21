# Module 3: The Signal

> **Tier**: 1 | **H&H Reference**: 1.5/1.7/8.11 | **Safety Mode**: Annotate

## Overview

Everything in Modules 1 and 2 dealt with DC -- voltages and currents that stay constant. Real electronics lives in the world of signals: voltages that change with time. A guitar pickup, a microphone, a radio antenna, a digital clock line -- all produce time-varying voltages. To understand these signals, you need two new mental tools: frequency (how fast a signal changes) and impedance (how components respond to different frequencies). This module bridges the gap from DC thinking to frequency-domain analysis, which is the foundation for filters, amplifiers, oscillators, and every communication system ever built. -- H&H 1.5

## Topics

### Topic 1: AC Signals

An alternating current (AC) signal is a voltage or current that periodically reverses direction. The most fundamental AC waveform is the sinusoid: V(t) = V_peak * sin(2*pi*f*t + phi). The key parameters are amplitude (V_peak, the maximum excursion from zero), frequency (f, how many complete cycles per second), period (T = 1/f, the time for one complete cycle), and phase (phi, the timing offset relative to a reference). For measurement purposes, the RMS (root-mean-square) value is often more useful than peak: V_rms = V_peak / sqrt(2) for a sinusoid. RMS represents the equivalent DC voltage that would deliver the same power to a resistive load. A 120V AC wall outlet means 120V RMS, which is actually 170V peak. -- H&H 1.5

### Topic 2: Frequency and Period

Frequency f and period T are reciprocals: f = 1/T. Frequency is measured in hertz (Hz), where 1 Hz means one cycle per second. The human ear hears roughly 20 Hz to 20 kHz. AM radio broadcasts at 540-1600 kHz. FM radio operates at 88-108 MHz. Wi-Fi uses 2.4 GHz and 5 GHz. Digital processors run at several GHz. Each of these frequency ranges demands different circuit techniques, component values, and layout practices. Understanding where your signal sits on the frequency spectrum is the first step in any circuit design. The logarithmic nature of frequency means that a "decade" (10x change) is the natural unit for thinking about frequency ranges. -- H&H 1.5

### Topic 3: Impedance

Impedance is the generalized form of resistance that applies to AC circuits. While a resistor has the same resistance at all frequencies, capacitors and inductors have frequency-dependent impedance. Impedance is written as a complex number: Z = R + jX, where R is resistance (the real part, which dissipates energy) and X is reactance (the imaginary part, which stores and returns energy). The magnitude |Z| = sqrt(R^2 + X^2) tells you the total opposition to current flow. The phase angle theta = arctan(X/R) tells you the timing relationship between voltage and current. Ohm's law generalizes perfectly: V = I * Z, where V, I, and Z are all complex quantities. -- H&H 1.7

### Topic 4: Capacitive Reactance

A capacitor's impedance is purely reactive: Z_C = 1/(j*2*pi*f*C) = -j/(2*pi*f*C). The reactance magnitude X_C = 1/(2*pi*f*C) decreases with increasing frequency. At DC (f=0), X_C is infinite -- the capacitor is an open circuit. At very high frequencies, X_C approaches zero -- the capacitor is a short circuit. The current through a capacitor leads the voltage by 90 degrees (the "ICE" mnemonic: current I leads voltage E in a capacitor C). This frequency-dependent behavior is why capacitors are the building blocks of filters: a capacitor to ground creates a low-pass filter because it shorts high frequencies while blocking DC. -- H&H 1.7

### Topic 5: Inductive Reactance

An inductor's impedance is also purely reactive but in the opposite direction: Z_L = j*2*pi*f*L. The reactance magnitude X_L = 2*pi*f*L increases with frequency. At DC, X_L is zero -- the inductor is a short circuit (just a wire). At high frequencies, X_L becomes very large -- the inductor blocks AC signals. The voltage across an inductor leads the current by 90 degrees (the "ELI" mnemonic: voltage E leads current I in an inductor L). Inductors and capacitors are complementary: where one passes, the other blocks. This duality makes LC combinations the basis for resonant circuits, bandpass filters, and impedance matching networks. -- H&H 1.7

### Topic 6: Transfer Functions

A transfer function H(jw) describes how a circuit modifies a signal at each frequency. It is the ratio of output to input: H(jw) = V_out/V_in, where w = 2*pi*f is the angular frequency. The transfer function is a complex number at each frequency, carrying both gain information (|H|, how much the amplitude changes) and phase information (angle of H, how much the timing shifts). For an RC low-pass filter, H(jw) = 1/(1 + jwRC). At low frequencies, |H| approaches 1 (signal passes through). At high frequencies, |H| approaches zero (signal is attenuated). The frequency where |H| = 1/sqrt(2) is the cutoff frequency f_c = 1/(2*pi*RC). -- H&H 1.7

### Topic 7: Bode Plots

A Bode plot displays the transfer function on axes optimized for engineering insight: the horizontal axis is log-frequency, and the vertical axis shows magnitude in decibels (dB) or phase in degrees. The log-frequency axis compresses the wide range of frequencies (Hz to GHz) into a manageable display. The dB magnitude axis converts multiplicative gains into additive ones. A first-order low-pass filter appears as a flat line at 0dB in the passband, breaking at the -3dB cutoff frequency, then rolling off at a straight -20dB/decade slope in the stopband. This straight-line approximation (asymptotic Bode plot) makes it easy to sketch frequency responses by hand and to reason about cascaded systems. -- H&H 1.7

### Topic 8: Decibels

The decibel (dB) is a logarithmic ratio: dB = 20*log10(V_out/V_in) for voltage ratios, or 10*log10(P_out/P_in) for power ratios. Key reference values: 0dB = unity (no change), +3dB = double power (1.414x voltage), +6dB = double voltage, +10dB = 10x power, +20dB = 10x voltage (100x power), -3dB = half power (0.707x voltage), -20dB = 1/10 voltage, -40dB = 1/100 voltage. The power of dB is that cascaded gains add: a +20dB amplifier followed by a -6dB attenuator gives +14dB total gain. This additive property makes dB the universal language of signal processing, communications, and audio engineering. -- H&H 1.7

### Topic 9: Signal Coupling

AC coupling uses a series capacitor to block the DC component of a signal while passing the AC content. This is essential when connecting stages with different DC bias points -- the coupling capacitor prevents the DC voltage of one stage from disturbing the operating point of the next. The coupling capacitor must be large enough that its reactance X_C = 1/(2*pi*f*C) is much smaller than the load impedance at the lowest signal frequency of interest. If the capacitor is too small, it attenuates low frequencies, acting as a high-pass filter. DC coupling passes everything, including the DC offset. Oscilloscopes have AC/DC coupling switches on each channel for exactly this reason. -- H&H 1.5

### Topic 10: Noise

Every resistor generates random voltage fluctuations due to thermal motion of charge carriers. This Johnson (thermal) noise has an RMS voltage of V_n = sqrt(4*k*T*R*BW), where k = 1.381e-23 J/K is Boltzmann's constant, T is absolute temperature in kelvin, R is resistance in ohms, and BW is measurement bandwidth in hertz. Noise power is proportional to both resistance and bandwidth. The signal-to-noise ratio (SNR) quantifies how far the desired signal sits above the noise floor: SNR = signal_power/noise_power, often expressed in dB. Noise figure (NF) measures how much noise a circuit adds beyond the theoretical minimum. Reducing bandwidth with filters improves SNR but limits the information capacity of the channel. -- H&H 8.11

## Learn Mode Depth Markers

### Level 1: Practical

> Every real signal carries noise -- unwanted random fluctuations. Wider bandwidth lets in more noise. Filtering narrows bandwidth to improve signal-to-noise ratio. -- H&H 8.11

> A Bode plot shows how a circuit's gain changes with frequency. Flat in the passband, rolling off in the stopband. The -3dB point is where power drops to half. -- H&H 1.7

### Level 2: Reference

> See H&H 1.7 for Bode plot construction, impedance-based filter analysis, and the transition from time-domain to frequency-domain thinking. Section 8.11 covers noise spectral density and noise figure. -- H&H 1.7

### Level 3: Mathematical

> Transfer function magnitude: |H(jw)| = V_out/V_in. Decibels: dB = 20*log10(|H|). Johnson noise voltage: V_n = sqrt(4*k*T*R*BW). SNR = signal_power/noise_power. First-order rolloff: -20dB/decade = -6dB/octave. -- H&H 8.11
