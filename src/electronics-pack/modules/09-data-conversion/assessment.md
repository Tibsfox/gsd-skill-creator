# Module 9: Data Conversion -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Sampling Theorem

State the Nyquist-Shannon sampling theorem in your own words. If you need to digitize a 10 kHz audio signal, what is the minimum sample rate required? What sample rate would a practical system use, and why?

## Question 2: Quantization Calculation

A 12-bit ADC has a 3.3V reference voltage.

(a) Calculate the SNR due to quantization noise alone (use SNR_q = 6.02*N + 1.76 dB).

(b) What is the voltage of one LSB?

(c) If the ADC measures a 1.650V input, what is the maximum quantization error in millivolts?

## Question 3: Aliasing Analysis

You are sampling a signal at 8 kHz and observe a 2 kHz component in the digitized data. However, the original analog signal does not contain a 2 kHz component.

(a) Explain what happened.

(b) What frequency in the original signal caused this alias?

(c) How would you prevent this from occurring in a redesigned system?

## Question 4: ADC Architecture Comparison

Compare the three major ADC architectures: SAR, flash, and sigma-delta. For each, state:

- Typical resolution range (bits)
- Typical speed range
- Key advantage
- Key limitation
- One application where it is the best choice

## Question 5: DAC Output Stage Design

You are designing the output stage for a 16-bit audio DAC running at 44.1 kHz.

(a) What is the Nyquist frequency for this system?

(b) What cutoff frequency should the reconstruction filter have, and why?

(c) Why must the reconstruction filter be analog (placed after the DAC) rather than digital (before the DAC)?

(d) What filter type would you recommend (Butterworth, Bessel, Chebyshev) and why?

## Answer Key

### Answer 1

The Nyquist-Shannon sampling theorem states that a bandlimited analog signal can be perfectly reconstructed from its discrete samples if and only if the sampling rate is at least twice the highest frequency component in the signal. For a 10 kHz signal, the minimum (Nyquist) sample rate is 20 kHz. A practical system would use 40-80 kHz (2x-4x the signal frequency) to provide margin for the anti-aliasing filter's transition band -- no real filter has a perfectly sharp cutoff, so the extra bandwidth gives the filter room to roll off before the Nyquist frequency.

### Answer 2

(a) SNR_q = 6.02 * 12 + 1.76 = 74.0 dB

(b) LSB = Vref / 2^N = 3.3V / 4096 = 0.8057 mV (approximately 0.806 mV)

(c) Maximum quantization error = 0.5 * LSB = 0.5 * 0.806 mV = 0.403 mV. This is independent of the input voltage -- every sample has at most +/- 0.5 LSB error regardless of its value.

### Answer 3

(a) Aliasing occurred. A frequency component above the Nyquist frequency (4 kHz = 8 kHz / 2) folded back into the baseband during sampling, creating a phantom 2 kHz signal.

(b) The original frequency was 6 kHz. When sampled at 8 kHz, the alias appears at |f_sample - f_signal| = |8000 - 6000| = 2000 Hz.

(c) Add an analog anti-aliasing low-pass filter before the ADC with a cutoff at or below 4 kHz (the Nyquist frequency). This removes the 6 kHz component before it reaches the sampler. Alternatively, increase the sample rate above 12 kHz (2 * 6 kHz) so that 6 kHz falls below the new Nyquist frequency.

### Answer 4

| Architecture | Resolution | Speed | Key Advantage | Key Limitation | Best Application |
|-------------|-----------|-------|---------------|----------------|-----------------|
| **SAR** | 12-18 bits | 100 kSps - 5 MSps | Low power, good balance of speed/resolution | Speed limited by serial bit decisions | Microcontroller sensor interfaces, battery-powered data acquisition |
| **Flash** | 6-10 bits | 100 MSps - 5 GSps | Fastest possible conversion (single clock cycle) | Exponential hardware cost (2^N - 1 comparators) | Digital oscilloscopes, radar receivers, video digitizers |
| **Sigma-Delta** | 16-24 bits | 10 SPS - 200 kSps | Highest resolution achievable, simple analog front-end | Slow conversion rate due to oversampling requirement | Precision measurement (strain gauges, thermocouples), professional audio |

### Answer 5

(a) Nyquist frequency = 44,100 / 2 = 22,050 Hz.

(b) The reconstruction filter cutoff should be at or just below 22.05 kHz. Its purpose is to remove the spectral images (replicas of the signal) that appear at multiples of the sample rate. These images start at 44.1 kHz - 20 kHz = 22.1 kHz, so the filter must attenuate frequencies above ~22 kHz while passing the audio band (20 Hz - 20 kHz) with minimal distortion.

(c) The reconstruction filter must be analog because it operates on the DAC's analog output. The DAC produces a staircase waveform with sharp transitions that contain high-frequency spectral images. A digital filter before the DAC cannot remove these because the staircase shape is created by the DAC itself during digital-to-analog conversion.

(d) A Bessel (or linear-phase) filter is recommended for audio applications because it has maximally flat group delay, meaning all frequencies experience the same time delay through the filter. This preserves the waveshape and avoids phase distortion that would be audible as smeared transients. A Butterworth has flatter amplitude response but more group delay variation. A Chebyshev has passband ripple that would color the audio. Modern audio DACs often use oversampling (e.g., 8x at 352.8 kHz) followed by a simple first-order analog filter, which avoids the need for a sharp analog filter altogether.
