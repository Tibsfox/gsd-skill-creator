# Module 2: Passive Components -- Assessment

> 5 questions testing understanding, not memorization

## Questions

## Question 1: Conceptual

**Explain why a capacitor blocks DC but passes AC, using the concept of impedance.**

Consider a capacitor connected in series with a signal path. What happens to the capacitor's impedance as frequency approaches zero (DC)? What happens as frequency increases? How does this explain the capacitor's behavior as a frequency-dependent element?

## Question 2: Calculation

**Given R = 10k ohm and C = 100nF, calculate:**
1. The RC time constant
2. The -3dB cutoff frequency of a low-pass filter using these components
3. The time required for a capacitor to reach 99% of the supply voltage when charging through R

## Question 3: Analysis

**An RLC series circuit has R = 50 ohm, L = 1mH, C = 1uF. Calculate:**
1. The resonant frequency f_0
2. The quality factor Q
3. The bandwidth of the resonant peak
4. The voltage magnification across L or C at resonance (relative to the source)

## Question 4: Application

**Design a low-pass filter with a cutoff frequency of 10kHz using a 1k ohm resistor. What capacitor value is needed?**

Show your calculation using f_c = 1/(2*pi*RC) and express the result in practical units (nF or pF).

## Question 5: Reasoning

**Explain why Thevenin's theorem is useful for analyzing circuits with multiple loads.**

Consider a power supply connected to three different loads. Why is it more practical to use the Thevenin equivalent than to analyze the full circuit each time a load changes? What information does V_th and R_th give you about the source's behavior?

## Answer Key

## Answer 1

The impedance of a capacitor is Z_C = 1/(jwC) = 1/(j * 2*pi*f * C).

- **At DC (f = 0):** The impedance is Z_C = 1/(j*0*C) = infinity. An infinite impedance means no current flows -- the capacitor acts as an open circuit, blocking DC completely.
- **At high frequency:** As f increases, Z_C = 1/(j*2*pi*f*C) decreases toward zero. A very small impedance means the capacitor acts like a short circuit, passing the AC signal freely.
- **At intermediate frequencies:** The impedance varies smoothly with 1/f, giving the capacitor its characteristic frequency-dependent filtering behavior. This is why capacitors are the fundamental building block of frequency-selective circuits.

The key insight: impedance Z_C is inversely proportional to frequency, which is why a capacitor's behavior is opposite to an inductor's (Z_L = jwL, proportional to frequency).

## Answer 2

Given R = 10k ohm = 10,000 ohm, C = 100nF = 100 * 10^-9 F = 10^-7 F:

1. **Time constant:** tau = RC = 10,000 * 10^-7 = 10^-3 s = **1 ms**

2. **Cutoff frequency:** f_c = 1/(2*pi*RC) = 1/(2*pi*10^-3) = 1/(6.283 * 10^-3) = **159.15 Hz**

3. **Time to 99%:** At 99%, V(t)/Vs = 0.99 = 1 - e^(-t/tau), so e^(-t/tau) = 0.01, giving -t/tau = ln(0.01) = -4.605. Therefore t = 4.605 * tau = 4.605 * 1ms = **4.605 ms** (approximately 5 time constants, confirming the 5-tau rule).

## Answer 3

Given R = 50 ohm, L = 1mH = 10^-3 H, C = 1uF = 10^-6 F:

1. **Resonant frequency:** f_0 = 1/(2*pi*sqrt(LC)) = 1/(2*pi*sqrt(10^-3 * 10^-6)) = 1/(2*pi*sqrt(10^-9)) = 1/(2*pi * 31.62 * 10^-6) = 1/(198.7 * 10^-6) = **5,033 Hz** (approximately 5.03 kHz)

2. **Quality factor:** Q = (1/R)*sqrt(L/C) = (1/50)*sqrt(10^-3/10^-6) = (1/50)*sqrt(1000) = (1/50)*31.62 = **0.632**

3. **Bandwidth:** BW = f_0/Q = 5033/0.632 = **7,963 Hz** (a very wide bandwidth, indicating low selectivity)

4. **Voltage magnification:** V_L = V_C = Q * V_source. With Q = 0.632, the voltage across L or C at resonance is only **0.632 times** the source voltage -- less than the source! This low Q means the resonance peak is very broad and there is no voltage amplification. For Q < 1, the circuit is overdamped.

## Answer 4

Using f_c = 1/(2*pi*RC), solve for C:

C = 1/(2*pi*R*f_c) = 1/(2*pi * 1000 * 10000) = 1/(62,831,853) = 1.592 * 10^-8 F

**C = 15.92 nF** (approximately 16nF)

In practice, the nearest standard capacitor value would be **15nF** (E12 series) or **16nF** (E24 series), giving cutoff frequencies of 10.6 kHz and 9.95 kHz respectively -- both close to the 10kHz target.

## Answer 5

Thevenin's theorem is useful for multi-load circuits because:

1. **Separation of source and load:** The Thevenin equivalent (V_th, R_th) completely characterizes the source network's behavior at its output terminals. Once calculated, you never need to re-analyze the internal source circuitry -- regardless of which load is connected.

2. **Quick load analysis:** For each new load R_load, the output voltage is simply V_load = V_th * R_load/(R_th + R_load). Changing the load requires only this one-line calculation, not a full circuit re-analysis.

3. **Source limitations:** R_th reveals the source's output impedance, which tells you how much voltage drops under load. A low R_th means the source can deliver current without significant voltage sag. A high R_th means the source is "weak" and its voltage varies greatly with load.

4. **Load interaction:** When multiple loads share a source, Thevenin makes it easy to see that all loads effectively see R_th in their current path. Heavy loads (low R_load) draw more current through R_th, dropping voltage for all loads -- a direct consequence visible from the Thevenin model.

Without Thevenin, analyzing three loads would require solving the full circuit three separate times. With Thevenin, you solve the source once and then apply a simple voltage divider formula for each load.
