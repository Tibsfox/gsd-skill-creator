# Module 9: Data Conversion

> **Tier**: 3 | **H&H Reference**: Ch.13 | **Safety Mode**: Gate

## Overview

Data conversion is the bridge between the analog physical world and the digital processing world. Every microcontroller, every audio system, every sensor interface, and every digital instrument relies on ADCs (analog-to-digital converters) to capture real-world signals and DACs (digital-to-analog converters) to produce analog outputs. Your phone alone contains dozens of converters -- for the microphone, speaker, touchscreen, accelerometer, temperature sensor, and cellular radio. Without data conversion, digital systems would be deaf and mute to the physical world. This module covers the fundamental principles (sampling, quantization, Nyquist) and the major converter architectures (R-2R DAC, SAR ADC, flash ADC, sigma-delta ADC), drawing from H&H Ch.13 throughout.

## Topics

### Topic 1: Sampling

Converting a continuous analog signal into a sequence of discrete samples is the first step in digitization. A sample-and-hold circuit captures the instantaneous voltage at regular intervals determined by the sample rate (samples per second, or Hz). A signal sampled at 44,100 Hz (CD audio) takes 44,100 snapshots per second. The critical question is: how fast must you sample to avoid losing information? The answer is the Nyquist-Shannon sampling theorem, which states that a bandlimited signal can be perfectly reconstructed from its samples if the sample rate is at least twice the highest frequency present in the signal. In practice, systems sample at 2.5x to 4x the maximum frequency to provide margin for real-world filter rolloff. -- H&H Ch.13

### Topic 2: Nyquist Frequency and Aliasing

The Nyquist frequency is half the sample rate: f_Nyquist = f_sample / 2. Any signal component above this frequency cannot be correctly represented by the sampled data. Instead, it "aliases" -- folds back into the baseband as a phantom frequency that is indistinguishable from a real lower-frequency signal. For example, a 6 kHz tone sampled at 8 kHz appears as a 2 kHz alias (|8000 - 6000| = 2000). Once aliased, the false frequency cannot be removed by any digital processing. The solution is an anti-aliasing filter: an analog low-pass filter placed before the ADC that attenuates all frequencies above f_Nyquist. This filter must be analog because digital filtering happens after sampling, by which point aliasing has already occurred. -- H&H Ch.13

### Topic 3: Quantization

After sampling captures discrete time points, quantization maps each sample's continuous voltage to the nearest discrete level. An N-bit converter provides 2^N levels. The smallest voltage step is the LSB (least significant bit): LSB = Vref / 2^N. With a 3.3V reference and 12 bits, the LSB is 3.3V / 4096 = 0.806 mV. Every quantized sample has an error of at most +/- 0.5 LSB, producing quantization noise. The signal-to-quantization-noise ratio is SNR_q = 6.02*N + 1.76 dB, meaning each additional bit adds about 6 dB of dynamic range. An 8-bit converter gives 49.9 dB, 12-bit gives 74.0 dB, 16-bit gives 98.1 dB, and 24-bit gives 146.2 dB. -- H&H Ch.13

### Topic 4: R-2R DAC

The R-2R resistor ladder is the most elegant DAC topology. It uses only two resistor values -- R and 2R -- arranged in a ladder network where each bit drives a switch that connects to either Vref or ground. The binary weighting emerges naturally from the network: the MSB contributes Vref/2, the next bit Vref/4, then Vref/8, and so on. For an N-bit DAC with digital code D, the output voltage is V_out = Vref * D / 2^N. The R-2R architecture is inherently monotonic (increasing codes always produce increasing voltages), easy to fabricate with matched resistors, and scales to any bit count. Its main limitation is code-transition glitches caused by switches not changing simultaneously, which can be smoothed with a sample-and-hold output stage. -- H&H Ch.13

### Topic 5: SAR ADC

The Successive Approximation Register ADC is the workhorse of the converter world. It performs a binary search: start with the MSB, set it to 1, and compare the internal DAC output with the analog input. If the DAC output exceeds the input, clear the bit; otherwise keep it. Move to the next bit and repeat. After N comparisons (one per bit), the register holds the digital code closest to the input voltage. SAR ADCs offer moderate speed (100 kSps to 5 MSps typical), good resolution (12 to 18 bits), low power consumption, and small die area. They are the ADC architecture inside most microcontrollers and are used wherever cost, power, and moderate speed matter -- sensor interfaces, data acquisition, battery-powered devices. -- H&H Ch.13

### Topic 6: Flash ADC

The flash (parallel) ADC is the fastest architecture. It uses 2^N - 1 comparators, each connected to a different reference voltage from a resistor ladder. All comparators fire simultaneously, and a priority encoder converts the thermometer code to binary. An 8-bit flash ADC needs 255 comparators and achieves GHz-class sample rates. The exponential hardware cost limits practical flash ADCs to 8-10 bits. Flash ADCs are used in digital oscilloscopes, video digitizers, radar receivers, and communications systems where speed is paramount and resolution requirements are moderate. Interleaved and folding architectures extend flash performance while reducing comparator count. -- H&H Ch.13

### Topic 7: Sigma-Delta ADC

The sigma-delta (delta-sigma) ADC takes the opposite approach to flash: trade speed for resolution. It uses a 1-bit quantizer (a simple comparator) sampling at many times the Nyquist rate (oversampling). The key innovation is noise shaping: a feedback loop (integrator + quantizer) pushes quantization noise to higher frequencies where a digital decimation filter removes it. The result is extraordinary resolution -- 24 bits for audio applications, achieved with a circuit barely more complex than a comparator. Sigma-delta ADCs dominate precision measurement (strain gauges, thermocouples, weigh scales), professional audio (recording, mixing), and any application where resolution matters more than speed. -- H&H Ch.13

### Topic 8: ADC Specifications

Reading an ADC datasheet requires understanding key specifications beyond resolution and sample rate. ENOB (effective number of bits) measures real-world performance: ENOB = (SINAD - 1.76) / 6.02, where SINAD is the signal-to-noise-and-distortion ratio. A "12-bit" ADC with 10.5 ENOB wastes 1.5 bits to noise and distortion. THD (total harmonic distortion) measures nonlinearity-generated spurious tones. DNL (differential nonlinearity) and INL (integral nonlinearity) quantify code-to-code accuracy and overall transfer function straightness. Missing codes (DNL > 1 LSB) mean some digital values never appear. The sample-and-hold aperture time determines the maximum input frequency for a given accuracy. -- H&H Ch.13

### Topic 9: DAC Specifications and Applications

DAC performance is characterized by settling time (how quickly the output reaches its final value after a code change), glitch energy (the transient spike during code transitions), and output drive capability (how much current the DAC can source/sink). Settling time limits the update rate; glitch energy matters in audio (audible clicks) and RF (spectral purity). Applications span nearly all of electronics: audio output (headphones, speakers), arbitrary waveform generators, motor control (PWM alternative), programmable voltage references, digital potentiometers, and closed-loop control systems where a microcontroller must output an analog signal to drive actuators. -- H&H Ch.13

### Topic 10: Anti-Aliasing and Reconstruction Filters

Every ADC system needs an analog anti-aliasing filter before the converter to remove signal components above the Nyquist frequency. Every DAC system needs an analog reconstruction filter after the converter to smooth the staircase output into a continuous waveform. These are both low-pass filters with a cutoff at or below f_sample / 2. Higher-order filters (4th-order Butterworth or Bessel) provide sharper rolloff but add phase distortion and component cost. Oversampling offers an elegant alternative: sample at a much higher rate (e.g., 4x or 8x), then use a digital anti-aliasing filter and decimate. This relaxes the analog filter requirements dramatically -- a gentle first-order analog filter suffices when the digital filter does the heavy lifting. Most modern sigma-delta systems exploit this tradeoff. -- H&H Ch.13

## Learn Mode Depth Markers

### Level 1: Practical

> An ADC converts analog voltage to a digital number. More bits means finer resolution. The sampling rate must be at least twice the highest signal frequency (Nyquist rule). -- H&H Ch.13

> A DAC converts a digital number back to analog voltage. Glitches during transitions can be smoothed with a sample-and-hold output stage. -- H&H Ch.13

### Level 2: Reference

> See H&H Ch.13 for ADC architectures (successive approximation, delta-sigma, flash), DAC topologies (R-2R ladder, current-steering), and quantization error analysis. -- H&H Ch.13

### Level 3: Mathematical

> Resolution: LSB = V_ref / 2^n. Quantization noise: SNR_q = 6.02*n + 1.76 dB. Nyquist criterion: f_sample >= 2*f_max. Oversampling gain: +3dB SNR per doubling of sample rate. ENOB = (SINAD - 1.76)/6.02. -- H&H Ch.13
