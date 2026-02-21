# Module 6: Op-Amps

> **Tier**: 2 | **H&H Reference**: Ch.4/6 | **Safety Mode**: Gate

## Overview

The operational amplifier is the universal analog building block -- the "Swiss Army knife" of electronics. It is a high-gain differential amplifier packaged in a small IC (typically an 8-pin DIP like the classic 741, the versatile LM358, or the audio-grade TL072). The triangle symbol on schematics has two inputs (inverting `-` and non-inverting `+`), one output, and power supply pins (usually omitted from schematics for clarity). With just a handful of external resistors and capacitors, a single op-amp can amplify, filter, integrate, compare, sum, buffer, or regulate. Nearly every analog system you will encounter uses op-amps, and understanding them unlocks the entire world of analog circuit design. -- H&H Ch.4

## Topics

### Topic 1: The Two Golden Rules

The op-amp has two golden rules that let you analyze *any* feedback circuit without knowing the internal details. **Rule 1:** No current flows into the inputs -- the input impedance is effectively infinite (real op-amps have input currents in the picoamp to nanoamp range). **Rule 2:** With negative feedback connected, the op-amp adjusts its output to make V+ = V- (the differential input voltage is driven to zero). These rules are valid whenever negative feedback is present. Without feedback, the op-amp operates in open-loop mode and the rules do not apply. To use the rules: identify the feedback path, set V+ = V-, and solve the resulting circuit using KCL. This approach works for every linear op-amp circuit. -- H&H Ch.4

### Topic 2: Non-Inverting Amplifier

The non-inverting amplifier connects the input signal to the `+` pin and uses a resistor divider (R_f and R_g) from the output back to the `-` pin. Applying the golden rules: V- = V+ = V_in, and the divider gives V- = V_out * R_g/(R_f + R_g). Solving: **V_out = (1 + R_f/R_g) * V_in**. The gain is always >= 1 (unity when R_f = 0). The signal stays in phase with the input. The key advantage is *high input impedance* -- the signal source drives the `+` pin directly, drawing no current. This makes it ideal for amplifying signals from high-impedance sensors like pH probes, piezoelectric pickups, and bridge circuits. Common in audio preamps and instrumentation front-ends. -- H&H Ch.4

### Topic 3: Inverting Amplifier

The inverting amplifier applies the input through R_in to the `-` pin, with R_f from output to `-`. The `+` pin is grounded. Golden rule 2 means V- = V+ = 0V (a "virtual ground"). All input current (V_in/R_in) flows through R_f, giving **V_out = -(R_f/R_in) * V_in**. The output is inverted (180 degrees out of phase). Input impedance equals R_in (not infinite like the non-inverting configuration). The virtual ground at the inverting input is one of the most important concepts in analog design -- it means the summing junction absorbs current without changing voltage, enabling precise current-to-voltage conversion. Used in transimpedance amplifiers, active filters, and DAC output stages. -- H&H Ch.4

### Topic 4: Voltage Follower / Buffer

The simplest op-amp circuit: connect the output directly to the inverting input (100% negative feedback). The gain is exactly 1 (Av = 1 + 0/infinity = 1). Why is a gain-of-1 amplifier useful? **Impedance transformation.** The input sees the op-amp's enormous input impedance (megohms to teraohms), while the output provides low impedance (typically a few ohms). This isolates a high-impedance source from a low-impedance load. Without the buffer, connecting a 10k source to a 100-ohm load would create a 100:1 voltage divider, losing 99% of the signal. With the buffer, the load sees the full signal voltage. Buffers appear between stages in multi-stage circuits to prevent loading effects. -- H&H Ch.4

### Topic 5: Summing Amplifier

The summing amplifier is an inverting amplifier with multiple input resistors feeding the virtual ground at the `-` pin. Each input contributes a current (V_n/R_n) that flows through R_f: **V_out = -R_f * (V1/R1 + V2/R2 + V3/R3 + ...)**. If all input resistors are equal, V_out = -(R_f/R) * (V1 + V2 + V3) -- a weighted sum. This is the basis of audio mixing consoles (each channel's volume fader adjusts its R_n), DAC resistor ladders (each bit switches a binary-weighted resistor), and analog computers (where voltages represent variables and summing performs addition). The virtual ground ensures that each input is independent -- changing one input voltage does not affect the current from the others. -- H&H Ch.4

### Topic 6: Integrator and Differentiator

**The integrator** replaces R_f with a capacitor C_f: V_out = -(1/R_in*C_f) * integral(V_in dt). The output is proportional to the running integral of the input. A constant DC input produces a linearly ramping output. Practical integrators include a large R_f in parallel with C_f to prevent DC drift from input offset voltage. The time constant tau = R_in * C_f sets the integration rate.

**The differentiator** replaces R_in with a capacitor: V_out = -R_f*C_in * (dV_in/dt). The output is proportional to the rate of change of the input. A ramp input produces a constant output; a step produces a spike. Differentiators amplify high-frequency noise (gain increases with frequency), so practical designs add a small series resistor to limit high-frequency gain. Integrators are more common in practice than differentiators because they are inherently noise-filtering. Both are essential in control loops, waveform generation, and analog computation. -- H&H Ch.4

### Topic 7: Comparator

Without negative feedback, the op-amp operates in **open-loop** mode as a comparator. The output is A*(V+ - V-), where A is the open-loop gain (typically 100,000 to 1,000,000). Even a fraction of a millivolt difference drives the output to the positive or negative supply rail. The comparator is a binary decision maker: output HIGH if V+ > V-, output LOW if V+ < V-. It is essentially a 1-bit analog-to-digital converter.

For noisy signals, a **Schmitt trigger** adds positive feedback (hysteresis) to create two different thresholds: one for the rising edge and one for the falling edge. This prevents rapid oscillation ("chatter") when the input hovers near the threshold. Hysteresis width is set by the positive feedback resistor ratio. Dedicated comparator ICs (LM311, LM339) have faster response and open-collector/open-drain outputs optimized for digital interfacing. -- H&H Ch.4

### Topic 8: Active Filters -- Sallen-Key Topology

Passive RC filters have a maximum rolloff of -20dB/decade per stage, and cascading stages requires buffers to prevent loading. **Active filters** solve both problems: the Sallen-Key topology achieves a second-order response (-40dB/decade) with a single op-amp and two RC pairs. The op-amp (typically configured as a unity-gain buffer) provides isolation and can even add gain.

The Sallen-Key low-pass filter has two resistors and two capacitors arranged so that one capacitor feeds back to the junction between the resistors, creating the complex pole pair needed for second-order behavior. The cutoff frequency is f_c = 1/(2*pi*sqrt(R1*R2*C1*C2)), and the quality factor Q determines the passband shape. Q = 0.707 gives the Butterworth (maximally flat) response. Higher Q gives peaking near cutoff; lower Q gives a gradual rolloff. The same topology works for high-pass filters by swapping R and C positions. Active filters dominate audio, instrumentation, and communication systems. -- H&H Ch.6

### Topic 9: Op-Amp Non-Idealities

Real op-amps deviate from the ideal model in several important ways:

- **Gain-Bandwidth Product (GBW):** The product of gain and bandwidth is constant. A GBW of 1MHz means gain of 10 at 100kHz, gain of 100 at 10kHz, but only gain of 1 at 1MHz. Exceeding the GBW limit causes gain rolloff and phase shift.
- **Slew Rate:** The maximum rate of output voltage change (V/us). A 1V/us slew rate means the output cannot follow a signal faster than 1V per microsecond. Exceeding slew rate causes waveform distortion.
- **Input Offset Voltage (Vos):** A small DC voltage (microvolts to millivolts) between the inputs that shifts the output. At high gain, even 1mV offset produces significant output error.
- **Input Bias Current:** Tiny currents flowing into the inputs (picoamps for JFET/CMOS, nanoamps for BJT input stages). These create voltage errors across source impedances.
- **Common-Mode Rejection Ratio (CMRR):** The ability to reject signals common to both inputs. Typical values: 80-120dB. Important for differential measurements.

For most designs, the ideal model is accurate enough. Non-idealities matter in precision measurement, high-frequency, and low-noise applications. -- H&H Ch.4

### Topic 10: Practical Op-Amp Selection

Choosing the right op-amp depends on your application:

- **LM741:** The classic (1968). Slow (1MHz GBW, 0.5V/us), high offset (1-5mV), but simple and educational. Good for learning, not for new designs.
- **LM358/LM324:** Dual/quad op-amps. Single supply operation (down to 3V), low cost. Ideal for battery-powered circuits and general-purpose applications.
- **TL072/TL082:** JFET input stage gives very low input bias current (30pA) and low noise. The standard for audio applications. Moderate speed (3MHz GBW).
- **OPA2134:** Precision audio op-amp. Extremely low distortion (0.00008%), low noise. Used in professional audio equipment and high-fidelity headphone amplifiers.
- **LM324 (rail-to-rail):** Output swings to within millivolts of the supply rails. Essential when operating from low supply voltages (3.3V, 5V) where headroom is limited.

Rule of thumb: for prototyping, start with LM358 (cheap, forgiving). For audio, TL072. For precision, OPAx series. For battery/low-voltage, rail-to-rail types. Speed requirements (GBW > 10MHz) push toward specialized high-speed op-amps. -- H&H Ch.4

## Learn Mode Depth Markers

### Level 1: Practical

> An op-amp with negative feedback forces its two inputs to be at the same voltage. This "golden rule" lets you analyze any op-amp circuit without knowing the internal details. -- H&H Ch.4

> Active filters use op-amps with capacitors to achieve sharper frequency cutoffs than passive RC filters. They can also provide gain. -- H&H Ch.6

### Level 2: Reference

> See H&H Ch.4 for the ideal op-amp model, inverting/non-inverting configurations, virtual ground concept, and feedback stability. Ch.6 covers active filter topologies (Sallen-Key, state-variable, biquad). -- H&H Ch.4

### Level 3: Mathematical

> Inverting amplifier: V_out = -(R_f/R_in)*V_in. Non-inverting: V_out = (1 + R_f/R_in)*V_in. GBW product: A_v * f_-3dB = constant. Sallen-Key Q: Q = sqrt(C1*C2*R1*R2)/(C2*(R1+R2)). -- H&H Ch.4
