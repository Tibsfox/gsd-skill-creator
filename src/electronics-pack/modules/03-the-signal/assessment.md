# Module 3: The Signal — Assessment

> 5 questions testing understanding, not memorization

## Questions

### Question 1: The -3dB Point

What does the -3dB point on a Bode plot represent physically, and why is it significant in circuit design?

### Question 2: Amplifier Gain Calculation

A signal of 0.5V passes through an amplifier with 26dB of voltage gain. What is the output voltage?

### Question 3: Impedance at Two Frequencies

Given an RC circuit with R = 4.7k ohm and C = 33nF, calculate the impedance magnitude |Z| at 1kHz and at 10kHz.

### Question 4: Thermal Noise Voltage

A 10k ohm resistor at room temperature (T = 300K) is used in a circuit with 20kHz measurement bandwidth. How much thermal noise voltage does it produce?

### Question 5: Cascaded Filter Rolloff

Why does cascading two identical first-order low-pass filters produce a -40dB/decade rolloff in the stopband instead of -20dB/decade? Explain using the dB addition principle.

## Answer Key

### Answer 1

The -3dB point is the frequency where the output power drops to exactly half of the input power (or equivalently, the voltage drops to 1/sqrt(2) = 0.707 of the input voltage). It is significant because it defines the boundary between the passband and stopband of a filter. At -3dB, |H(jw)| = 1/sqrt(2), which means power = |H|^2 = 1/2. This is the standard "cutoff frequency" used to specify filter bandwidth. For a first-order RC filter, f_c = 1/(2*pi*R*C). The -3dB point also marks where the phase shift is exactly -45 degrees for a first-order low-pass filter.

### Answer 2

Convert dB gain to a voltage ratio: 26dB = 20*log10(V_out/V_in), so V_out/V_in = 10^(26/20) = 10^1.3 = 19.95 (approximately 20). Therefore V_out = 0.5V * 19.95 = 9.98V, approximately 10V. Quick mental check: 20dB = 10x voltage and 6dB = 2x voltage, so 26dB = 20dB + 6dB = 10 * 2 = 20x voltage. V_out = 0.5 * 20 = 10V.

### Answer 3

At f = 1kHz:
- X_C = 1/(2*pi*1000*33e-9) = 1/(207.3e-6) = 4823 ohm
- |Z| = sqrt(4700^2 + 4823^2) = sqrt(22.09e6 + 23.26e6) = sqrt(45.35e6) = 6734 ohm

At f = 10kHz:
- X_C = 1/(2*pi*10000*33e-9) = 1/(2.073e-3) = 482.3 ohm
- |Z| = sqrt(4700^2 + 482.3^2) = sqrt(22.09e6 + 0.2326e6) = sqrt(22.32e6) = 4725 ohm

At 1kHz the capacitor's reactance is comparable to R (near-equal impedance), so the total impedance is significantly larger than R alone. At 10kHz the capacitor's reactance is small compared to R, so the total impedance is dominated by R and is only slightly larger than 4.7k.

### Answer 4

Using the Johnson noise formula: V_n = sqrt(4 * k_B * T * R * BW)
- k_B = 1.381e-23 J/K
- T = 300 K
- R = 10,000 ohm
- BW = 20,000 Hz

V_n = sqrt(4 * 1.381e-23 * 300 * 10000 * 20000)
V_n = sqrt(4 * 1.381e-23 * 6e10)
V_n = sqrt(3.314e-12)
V_n = 1.821e-6 V = 1.821 microvolts

This is the RMS noise voltage. Note that doubling the bandwidth from 10kHz to 20kHz increased the noise by a factor of sqrt(2) compared to the 10kHz case (1.286 uV), because noise power is proportional to bandwidth.

### Answer 5

Each first-order filter has a transfer function |H(f)| that rolls off at -20dB/decade in the stopband. When you cascade two identical stages, the total transfer function is the product of the individual transfer functions: H_total = H1 * H2. In dB, multiplication becomes addition:

|H_total|_dB = |H1|_dB + |H2|_dB

In the stopband, where each stage contributes -20dB/decade of rolloff:

Total rolloff = -20dB/decade + -20dB/decade = -40dB/decade

This is the dB addition principle: logarithmic (dB) gains add when stages are cascaded. At a frequency 10x above the cutoff, a single stage provides -20dB attenuation. Two cascaded stages provide -20dB + -20dB = -40dB attenuation at the same frequency. More generally, N cascaded first-order stages produce -20N dB/decade rolloff. Note that in practice, loading between unbuffered stages modifies the exact response, but the asymptotic rolloff rate remains -40dB/decade.
