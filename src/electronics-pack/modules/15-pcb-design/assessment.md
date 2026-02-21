# Module 15: PCB Design -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Component Placement

Explain why decoupling capacitors should be placed as close to IC power pins as possible. What parasitic effect does distance introduce, and how does it degrade high-frequency decoupling? (H&H Ch.12)

## Question 2: Trace Width Calculation

Using the IPC-2221 standard, a 2A power trace on an external layer with 1 oz copper (1.4 mil) and 10C temperature rise requires what minimum trace width? Show the calculation using area = (I / (k * dT^0.44))^(1/0.725) and width = area / (thickness * 1.378), where k=0.048 for external. Why does an internal layer require a wider trace for the same current?

## Question 3: Controlled Impedance

Calculate the approximate impedance of a microstrip trace with w=8 mil, h=4.5 mil dielectric height, t=1.4 mil copper thickness on FR4 (er=4.4). Use Z0 = (87/sqrt(er+1.41)) * ln(5.98*h/(0.8*w+t)). If the target is 50 ohms, is this trace too wide, too narrow, or correct? What would you change?

## Question 4: EMI Analysis

A 75mm trace carries a 200 MHz clock signal. Calculate the wavelength at 200 MHz (lambda = c/f, where c = 3e8 m/s), determine the trace-to-wavelength ratio, and assess the EMI risk. What three specific layout techniques would you use to minimize radiation?

## Question 5: DFM Review

You receive a DRC report with these violations: (a) 4-mil trace on inner layer, (b) 3-mil clearance between signal and power trace, (c) 8-mil via drill with 2-mil annular ring. For each, explain the manufacturing risk and how to fix it.

## Answer Key

### Answer 1: Component Placement

Every trace between a decoupling capacitor and an IC power pin adds **parasitic inductance** (approximately 1 nH per mm of trace). This inductance creates an impedance that increases with frequency: Z = 2 * pi * f * L. At 100 MHz, just 10mm of trace (10 nH) presents 6.3 ohms of impedance -- effectively disconnecting the capacitor from the IC at the frequencies where it is most needed. The capacitor is supposed to provide a low-impedance path to ground for high-frequency noise on the power rail. Distance defeats this purpose. The solution is to place the cap within 3-5mm of the power pin and use short, wide traces (or direct pad-to-pad routing) to minimize inductance. H&H Ch.12 emphasizes this as one of the most important layout rules.

### Answer 2: Trace Width Calculation

For 2A external with k=0.048, dT=10C, thickness=1.4 mil:

- area = (2 / (0.048 * 10^0.44))^(1/0.725) = (2 / (0.048 * 2.754))^1.379 = (2 / 0.1322)^1.379 = 15.13^1.379 = approximately 39.5 square mils
- width = 39.5 / (1.4 * 1.378) = 39.5 / 1.929 = approximately 20.5 mils

An internal layer requires a wider trace because it has poorer thermal dissipation -- surrounded by FR4 insulator rather than air. The IPC-2221 standard uses k=0.024 for internal layers (half the external value), which roughly doubles the required cross-sectional area for the same current and temperature rise.

### Answer 3: Controlled Impedance

Z0 = (87 / sqrt(4.4 + 1.41)) * ln(5.98 * 4.5 / (0.8 * 8 + 1.4))
Z0 = (87 / sqrt(5.81)) * ln(26.91 / 7.8)
Z0 = (87 / 2.411) * ln(3.450)
Z0 = 36.09 * 1.238
Z0 = approximately 44.7 ohms

This trace is slightly **too wide** (impedance is below the 50-ohm target). To increase impedance to 50 ohms, you could: (a) reduce the trace width to approximately 6-7 mils, (b) increase the dielectric height, or (c) use a lower-er material. In practice, the PCB fab adjusts the dielectric thickness during stackup design to hit the target impedance for a given trace width.

### Answer 4: EMI Analysis

Wavelength at 200 MHz: lambda = 3e8 / 200e6 = 1.5 meters = 1500 mm.
Trace-to-wavelength ratio: 75mm / 1500mm = 0.05.

At ratio = 0.05 (exactly lambda/20), this trace is at the boundary between moderate and high EMI risk. It will radiate noticeably and may fail EMC compliance testing.

Three layout techniques to minimize radiation:
1. **Continuous ground plane** directly beneath the trace -- provides a close return current path that minimizes the radiating loop area
2. **Series termination** at the source (33-47 ohm resistor) -- slows the edge rate, reducing high-frequency spectral content that drives radiation
3. **Minimize trace length** -- reroute to reduce the 75mm length, or move the source and load ICs closer together on the board

### Answer 5: DFM Review

**(a) 4-mil trace on inner layer:** Manufacturing risk is trace breakage during etching. The etchant can over-etch narrow traces, creating opens (broken connections). Standard minimum for most fabs is 6 mil. **Fix:** Widen the trace to at least 6 mils. If the trace carries significant current, use the IPC-2221 calculator to determine the correct width.

**(b) 3-mil clearance between signal and power trace:** Manufacturing risk is a copper bridge (short circuit) between the two traces. During etching, 3 mils leaves almost no margin for process variation. A short between signal and power can damage components. **Fix:** Increase clearance to at least 6 mils. Reroute one of the traces or move components to create space.

**(c) 8-mil via drill with 2-mil annular ring:** Manufacturing risk is a broken connection between the via barrel and the pad. The drill registration has a tolerance of 2-3 mils, so a 2-mil annular ring may result in the drill breaking out of the pad entirely, creating an open circuit. **Fix:** Increase the annular ring to at least 4 mils by either enlarging the pad (outer diameter = drill + 2 * annular ring = 8 + 8 = 16 mil pad) or reducing the drill size if the via does not need to be that large.
