# Module 4: Diodes

> **Tier**: 2 | **H&H Reference**: 1.6 | **Safety Mode**: Gate

## Overview

A semiconductor diode is a two-terminal device built from a P-N junction -- the boundary between p-type and n-type silicon. At this junction, a depletion region forms where mobile charges have recombined, creating a barrier. When you apply a forward voltage (positive to anode, negative to cathode), the barrier shrinks and current flows. Reverse the polarity, and the barrier widens, blocking current. This one-way valve behavior is the foundation of rectification, voltage regulation, signal clamping, and light emission. Every power supply, every radio, and every LED relies on the diode's asymmetric conduction. -- H&H 1.6

## Topics

### Topic 1: The Diode I-V Characteristic

A silicon diode does not turn on like a switch at exactly 0.6V. Instead, current rises exponentially with voltage, following a smooth curve. Below roughly 0.5V, current is negligible (nanoamps). Between 0.5V and 0.7V, current increases rapidly -- this is the "knee" region. Above 0.7V, the diode behaves almost like a short circuit with a fixed voltage drop. In reverse bias, a tiny leakage current flows (picoamps to nanoamps) until the breakdown voltage is reached. For practical analysis, we approximate the forward drop as 0.6-0.7V for silicon and treat reverse current as zero. This piecewise-linear model simplifies circuit analysis while capturing the essential behavior. -- H&H 1.6

### Topic 2: The Shockley Diode Equation

The exponential I-V curve is described precisely by the Shockley equation: I = Is * (exp(V / (n * Vt)) - 1). Here Is is the saturation current (typically 1e-12 to 1e-14 A for silicon), Vt is the thermal voltage (kT/q, approximately 26mV at room temperature), and n is the ideality factor (1 for an ideal junction, 1.5-2 for real devices). The equation explains why the I-V curve has a knee rather than a sharp turn-on: the exponential function grows smoothly. At V = 0, current is zero. At V = 0.6V, exp(0.6/0.026) is roughly 10^10, so even a tiny Is produces milliamps. This equation is the foundation for semiconductor device modeling. -- H&H 1.6

### Topic 3: Half-Wave Rectification

A single diode in series with an AC source passes only the positive half-cycles, producing pulsating DC. During positive half-cycles, the diode is forward-biased and the output voltage equals Vpeak minus the forward drop Vf (about 0.6V). During negative half-cycles, the diode blocks and the output is zero. The peak output is therefore Vpeak - Vf. For a 120Vrms mains signal, Vpeak = 120 * sqrt(2) = 169.7V, so the output peaks at approximately 169.1V. Half-wave rectification is simple but wasteful -- it discards half the input energy and produces significant ripple. It is acceptable only for low-power applications where simplicity matters more than efficiency. -- H&H 1.6

### Topic 4: Full-Wave Bridge Rectification

Four diodes arranged in a bridge configuration rectify both halves of the AC cycle. On each half-cycle, two diodes conduct and two block, steering current through the load in the same direction regardless of input polarity. The output peak is Vpeak minus two forward drops (2 * Vf, about 1.2V for silicon). The bridge rectifier doubles the ripple frequency compared to half-wave (120Hz for 60Hz mains), which makes filtering easier. The trade-off is the extra diode drop and the need for four diodes instead of one. Bridge rectifiers are the standard topology in almost every AC-to-DC power supply. -- H&H 1.6

### Topic 5: Filtering and Ripple

A capacitor placed after the rectifier smooths the pulsating DC by storing charge during the peaks and releasing it between peaks. The ripple voltage -- the residual AC component on the DC output -- is approximately Vripple = Iload / (f * C), where f is the ripple frequency and C is the filter capacitance. For a bridge rectifier with 100mA load, 120Hz ripple, and 1000uF capacitor: Vripple = 0.1 / (120 * 0.001) = 0.83V. Larger capacitors reduce ripple but increase inrush current at turn-on. The filter capacitor must be rated for the peak voltage and the ripple current. In practice, additional regulation stages (Zener, linear regulator, or switching regulator) follow the filter to produce a clean, stable DC supply. -- H&H 1.6

### Topic 6: Zener Diodes

A Zener diode is designed to operate in reverse breakdown at a precise, repeatable voltage. Below the Zener voltage Vz, it blocks like a normal diode. At Vz, it conducts heavily in reverse while maintaining a nearly constant voltage across its terminals. This makes it an excellent voltage reference and simple regulator. In a typical circuit, a series resistor limits current while the Zener clamps the output to Vz. The series resistor must absorb the difference between input and Zener voltages: Rs = (Vin - Vz) / Iz. Zener diodes are available from 2.4V to over 200V. Low-voltage Zeners (below 5V) use true Zener tunneling; higher voltages use avalanche breakdown. Both mechanisms produce the same practical result. -- H&H 1.6

### Topic 7: LEDs (Light-Emitting Diodes)

An LED is a diode made from compound semiconductors (GaAs, GaN, InGaN) that emits photons when forward-biased. The forward voltage depends on the semiconductor material and corresponds to the photon energy: red LEDs drop about 1.8V, green about 2.2V, blue and white about 3.0-3.3V. LEDs require a current-limiting resistor to prevent thermal runaway: R = (Vsupply - Vf) / Itarget. For a typical indicator LED at 20mA from a 5V supply with Vf=2V: R = (5-2)/0.020 = 150 ohm. LED brightness is roughly proportional to current. Modern high-power LEDs can produce hundreds of lumens but require careful thermal management. LEDs have largely replaced incandescent indicators and are rapidly displacing fluorescent lighting. -- H&H 1.6

### Topic 8: Clamping and Clipping Circuits

Diode clamp circuits shift the DC level of an AC signal without changing its shape. A capacitor blocks DC while a diode clamps the negative (or positive) peak to a reference voltage, effectively adding a DC offset. Diode clipper circuits limit signal amplitude: a diode to Vcc clips the positive peaks, a diode to ground clips the negative peaks. Clippers protect sensitive inputs from overvoltage. Clampers restore DC levels lost in AC-coupled signal chains. Both circuits exploit the diode's threshold voltage -- signals below 0.6V pass through the diode unchanged, while signals above 0.6V are clamped or clipped. Double-clipping with two opposed diodes creates a voltage limiter that constrains signals to a symmetric window. -- H&H 1.6

### Topic 9: Diode Switching Speed

Real diodes do not switch instantaneously between forward and reverse states. When a forward-biased diode is suddenly reverse-biased, stored minority carriers in the junction must be swept out before the diode blocks. This reverse recovery time (trr) ranges from microseconds for standard rectifiers (1N4001: ~30us) to nanoseconds for fast-recovery and Schottky diodes. Schottky diodes use a metal-semiconductor junction instead of a P-N junction, eliminating minority carrier storage entirely. Their forward drop is also lower (0.2-0.4V vs 0.6-0.7V for silicon). The trade-off is lower reverse voltage ratings (typically 40-100V). In switching power supplies operating at 100kHz+, Schottky diodes are essential to minimize switching losses. -- H&H 1.6

### Topic 10: Practical Diode Selection

Choosing the right diode requires matching four key parameters to the application. Forward current rating (If): the 1N4148 handles 200mA for signal work; the 1N4001 handles 1A for power rectification. Peak inverse voltage (PIV or Vrrm): must exceed the maximum reverse voltage the circuit applies -- for a bridge rectifier on 120Vrms mains, PIV must exceed 170V (the 1N4004 at 400V is a common choice). Forward voltage drop (Vf): matters for efficiency in power circuits -- Schottky diodes save 0.3-0.4V per diode. Reverse recovery time (trr): critical for switching applications above 10kHz. For most hobby and prototyping work, keep a stock of 1N4148 (signal), 1N4001-1N4007 (power), and 1N5819 (Schottky). -- H&H 1.6

## Learn Mode Depth Markers

### Level 1: Practical

> A diode is a one-way valve for current. It drops about 0.6V when conducting (silicon). Below that threshold, almost no current flows. -- H&H 1.6

> A Zener diode conducts in reverse at a specific breakdown voltage, making it useful as a simple voltage reference or clamp. -- H&H 1.6

### Level 2: Reference

> See H&H 1.6 for the diode I-V characteristic, rectifier circuits (half-wave, full-wave, bridge), Zener regulation, and the exponential diode equation. -- H&H 1.6

### Level 3: Mathematical

> Shockley diode equation: I = I_s * (exp(V/(n*V_T)) - 1), where V_T = kT/q ~ 26mV at room temperature, n ~ 1-2. Piecewise-linear model: I = (V - V_th)/R_on for V > V_th, else I = V/R_off. -- H&H 1.6
