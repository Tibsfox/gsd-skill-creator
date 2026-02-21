# Module 4: Diodes -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: The Diode Knee

**Why does a diode have a "knee" in its I-V curve rather than turning on instantly at exactly 0.6V?**

Think about the Shockley diode equation and what happens to current as voltage increases through the 0.4V to 0.7V range.

## Question 2: Half-Wave Rectifier Output

**A half-wave rectifier is connected to a 120Vrms AC source. Calculate the peak output voltage across the load.**

Given: Vrms = 120V, silicon diode with Vf = 0.6V.

## Question 3: Bridge Rectifier Ripple

**A bridge rectifier with a 100uF filter capacitor feeds a 100mA load from a 60Hz AC source. Estimate the ripple voltage on the DC output.**

Given: C = 100uF, I_load = 100mA, f_line = 60Hz.

## Question 4: LED Circuit Design

**Design a circuit to drive a blue LED (Vf = 3.3V) at 15mA from a 9V battery. Calculate the required current-limiting resistor value and the power dissipated in the resistor.**

Given: Vsupply = 9V, Vf_LED = 3.3V, I_target = 15mA.

## Question 5: Schottky vs Silicon

**Why do switching power supplies prefer Schottky diodes over standard silicon rectifiers?**

Consider both the forward voltage drop and the switching behavior.

---

## Answer Key

### Answer 1

The diode I-V curve has a knee because current follows the Shockley equation: I = Is * (exp(V/(n*Vt)) - 1). This is an exponential function, not a step function. At V = 0.4V, the exponent exp(0.4/0.026) ~ 4.7 million, but multiplied by Is (around 1e-12 A), the current is still only microamps. At V = 0.6V, exp(0.6/0.026) ~ 10^10, giving milliamps. At V = 0.7V, current reaches tens of milliamps. The "knee" is where the exponential curve transitions from negligible to significant current -- it is smooth, not sharp, because exponential growth is continuous. The 0.6V figure is a convenient approximation, not a physical threshold.

### Answer 2

Peak voltage: Vpeak = Vrms * sqrt(2) = 120 * 1.414 = 169.7V.

Peak output voltage: Vout = Vpeak - Vf = 169.7 - 0.6 = **169.1V**.

The half-wave rectifier passes only positive half-cycles, each peaking at 169.1V, with the output dropping to zero between peaks (before filtering).

### Answer 3

For a bridge rectifier, the ripple frequency is twice the line frequency: f_ripple = 2 * 60Hz = 120Hz.

Ripple voltage: Vripple = I_load / (f_ripple * C) = 0.100 / (120 * 100e-6) = 0.100 / 0.012 = **8.33V**.

This is very large ripple, indicating that 100uF is too small for a 100mA load. A practical design would use at least 1000uF (giving 0.83V ripple) or add a voltage regulator after the filter.

### Answer 4

Resistor value: R = (Vsupply - Vf) / I_target = (9 - 3.3) / 0.015 = 5.7 / 0.015 = **380 ohm**.

The nearest standard value is 390 ohm (E24 series), giving I = 5.7/390 = 14.6mA (close enough to 15mA).

Power in resistor: P = I^2 * R = (0.015)^2 * 380 = 0.0855W = **85.5mW**.

A standard 1/4W (250mW) resistor is adequate. The LED dissipates P_LED = Vf * I = 3.3 * 0.015 = 49.5mW. Total power from battery = 9 * 0.015 = 135mW.

### Answer 5

Switching power supplies prefer Schottky diodes for two reasons:

1. **Lower forward voltage**: Schottky diodes drop 0.2-0.4V vs 0.6-0.7V for silicon. At high currents (e.g., 5A), this saves 1.5-2.5W per diode -- significant at switching frequencies where diodes conduct during a large fraction of each cycle.

2. **No reverse recovery time**: Schottky diodes use a metal-semiconductor junction with no minority carrier storage. They switch from forward to reverse conduction in picoseconds. Standard silicon diodes have reverse recovery times of 10-100 nanoseconds, during which they briefly conduct in reverse. At 100kHz+ switching frequencies, this reverse recovery causes power loss, voltage spikes, and electromagnetic interference. Schottky diodes eliminate this problem entirely.

The trade-off is lower reverse voltage ratings (typically 40-100V), which limits Schottky use to low-voltage outputs. For high-voltage rectification (>100V), fast-recovery silicon or SiC diodes are used instead.
