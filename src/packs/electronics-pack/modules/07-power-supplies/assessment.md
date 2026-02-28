# Module 7: Power Supplies -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Linear Regulator Thermal Analysis

A 7805 voltage regulator has V_in = 9V and supplies I_load = 1A to a circuit. Calculate the power dissipated in the regulator and explain why a heatsink might be needed.

## Question 2: Buck Converter Design

Design a buck converter for a 24V input that must produce a 5V output.

a) What duty cycle is required?
b) If the converter switches at 500kHz with a 47uH inductor, calculate the peak-to-peak inductor ripple current using: delta_I = (V_in - V_out) * D / (L * f_sw).

## Question 3: Boost Converter Analysis

Explain why a boost converter cannot produce V_out less than V_in. What happens to the duty cycle D as the desired V_out increases? At what point does a real boost converter become impractical?

## Question 4: Topology Selection

A Li-ion battery drops from 4.2V (fully charged) to 3.0V (empty) during discharge. You need a stable 3.3V output to power a microcontroller. Which converter topology would you choose, and why? Consider what happens at both ends of the battery discharge curve.

## Question 5: Output Capacitor ESR

Why do switching regulators need output capacitors with low ESR (Equivalent Series Resistance)? What happens to the output ripple voltage if you replace a 47uF ceramic capacitor (ESR ~ 5 milliohm) with a 47uF aluminum electrolytic capacitor (ESR ~ 0.5 ohm)?

## Answer Key

### Answer 1

P_dissipated = (V_in - V_out) * I_load = (9V - 5V) * 1A = 4W.

Four watts is substantial heat. The 7805 in a TO-220 package has a junction-to-ambient thermal resistance of approximately 50 C/W (without heatsink). The junction temperature rise would be 4W * 50 C/W = 200C above ambient -- far exceeding the 150C maximum junction temperature.

With a heatsink (R_theta_JA ~ 10 C/W), the rise is 4W * 10 C/W = 40C, keeping T_J at roughly 65C in a 25C environment. A heatsink is essential at this power level. Alternatively, consider a switching regulator for better efficiency.

### Answer 2

a) Duty cycle: D = V_out / V_in = 5V / 24V = 0.2083 (approximately 20.8%).

b) Inductor ripple current:
delta_I = (V_in - V_out) * D / (L * f_sw)
delta_I = (24V - 5V) * 0.2083 / (47e-6 H * 500e3 Hz)
delta_I = 19V * 0.2083 / 23.5
delta_I = 3.958 / 23.5
delta_I = 0.168A (approximately 168mA peak-to-peak).

This ripple current flows through the output capacitor and creates output voltage ripple. The inductor must be rated for a DC current of I_load plus half the ripple current, and the output capacitor must handle the AC ripple current without excessive heating.

### Answer 3

A boost converter cannot produce V_out < V_in because of how it operates. The boost formula is V_out = V_in / (1 - D), where D ranges from 0 to 1. When D = 0, V_out = V_in (minimum output). As D increases toward 1, V_out increases toward infinity. There is no D value that produces V_out < V_in.

As V_out increases, D = 1 - V_in/V_out approaches 1. The switch stays ON for a longer fraction of each cycle, and the inductor must store more energy per cycle. Real boost converters become impractical above about D = 0.85 (roughly 6:1 step-up) because: (a) conduction losses increase as the switch carries current for most of the cycle, (b) the inductor must handle large peak currents, and (c) the diode reverse-recovery losses increase. Efficiency drops below 80% and thermal management becomes difficult.

### Answer 4

A buck-boost topology is the correct choice. Here is why:

- At V_bat = 4.2V (full charge), V_in > V_out (3.3V), so you need to step DOWN.
- At V_bat = 3.0V (empty), V_in < V_out (3.3V), so you need to step UP.
- In the middle of discharge (~3.3V), V_in = V_out.

A pure buck converter fails when V_bat drops below 3.3V. A pure boost converter fails when V_bat is above 3.3V. Only a buck-boost (or SEPIC) topology handles the full range.

In practice, an integrated buck-boost IC like the TPS63000 series handles 1.8V-5.5V input to 3.3V output with 90%+ efficiency, automatically transitioning between buck and boost modes as the battery voltage crosses V_out.

### Answer 5

The output ripple voltage in a switching regulator has two components:

1. **Capacitive ripple**: delta_V_C = I_load / (f_sw * C) -- depends on capacitance and switching frequency.
2. **ESR ripple**: delta_V_ESR = I_ripple * ESR -- depends on the capacitor's internal resistance.

With a 47uF ceramic (ESR ~ 5 milliohm) and 500mA ripple current:
- V_ESR = 0.5A * 0.005 ohm = 2.5mV

With a 47uF electrolytic (ESR ~ 0.5 ohm):
- V_ESR = 0.5A * 0.5 ohm = 250mV

The electrolytic produces 100x more ESR-related ripple. At 250mV, this dominates the total ripple and can cause problems for noise-sensitive loads (ADCs, PLLs, RF circuits). The ceramic capacitor keeps ESR ripple negligible.

This is why modern switching regulator designs specify ceramic output capacitors. The datasheet-recommended capacitor values assume ceramic -- substituting electrolytic capacitors with the same capacitance can cause stability problems (the ESR zero moves in the frequency domain) and excessive ripple.
