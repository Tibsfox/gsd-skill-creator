# Module 2: Passive Components

> **Tier**: 1 | **H&H Reference**: 1.4/1.5/1.7 | **Safety Mode**: Annotate

## Overview

Beyond resistors, two more passive components form the core of analog electronics: capacitors and inductors. While resistors dissipate energy as heat, capacitors store energy in electric fields and inductors store energy in magnetic fields. These energy-storing components introduce time-dependent behavior -- circuits that charge, discharge, filter, and resonate. Understanding capacitors and inductors unlocks the entire world of AC signal processing, from simple audio filters to radio frequency tuning circuits.

## Topics

### Topic 1: Capacitors

A capacitor stores electric charge on two parallel conducting plates separated by an insulator (dielectric). The fundamental relationship is C = Q/V, where C is capacitance in farads, Q is stored charge in coulombs, and V is voltage across the plates. A 1 farad capacitor stores 1 coulomb per volt -- an enormous amount, so practical capacitors range from picofarads (pF) to millifarads (mF). The parallel plate model gives C = epsilon * A / d, where A is plate area and d is separation. Larger plates and thinner dielectrics yield more capacitance. Current through a capacitor is proportional to the rate of voltage change: I = C * dV/dt. -- H&H 1.4

### Topic 2: Inductors

An inductor stores energy in a magnetic field created by current flowing through a coil of wire. The voltage across an inductor is proportional to the rate of current change: V = L * dI/dt, where L is inductance in henries. A 1 henry inductor produces 1 volt when current changes at 1 amp per second. Practical inductors range from nanohenries (nH) in RF circuits to henries (H) in power supplies. The inductance depends on the coil geometry: more turns, larger area, and magnetic core materials all increase L. Inductors resist changes in current -- they "want" current to keep flowing at its present value, which is why they can produce voltage spikes when switched off. -- H&H 1.5

### Topic 3: Time Constants

When a capacitor charges through a resistor, the voltage rises exponentially: V(t) = Vs * (1 - e^(-t/tau)), where tau = RC is the time constant. After one time constant, the voltage reaches 63.2% of the supply. After five time constants (5*tau), the capacitor is effectively fully charged (>99%). For RL circuits, the time constant is tau = L/R, and the current rises as I(t) = (Vs/R) * (1 - e^(-t/tau)). The same 63.2% rule applies at t = tau, and the same 5-tau rule for "fully settled." These exponential curves appear everywhere in electronics -- from switch debouncing to power supply startup to communication timing. -- H&H 1.4

### Topic 4: RC Low-Pass Filter

An RC low-pass filter passes low-frequency signals while attenuating high-frequency ones. Connect R in series and C to ground: at low frequencies, the capacitor impedance (1/(jwC)) is high, so the output (across C) equals the input. At high frequencies, the capacitor acts as a short circuit, shunting the signal to ground. The cutoff frequency is f_c = 1/(2*pi*RC), where the output drops to -3dB (70.7% voltage, 50% power). Above cutoff, the response rolls off at -20dB per decade. RC low-pass filters are the most common filter topology, used for noise reduction, anti-aliasing before ADCs, and smoothing power supply ripple. -- H&H 1.4

### Topic 5: RC High-Pass Filter

Swapping the positions of R and C creates a high-pass filter: C in series, R to ground. Low frequencies are blocked because the capacitor impedance is high, dividing the signal away from the output. High frequencies pass because the capacitor impedance is low, acting as a short circuit in series. The cutoff frequency is the same formula: f_c = 1/(2*pi*RC). Below cutoff, the response falls at +20dB per decade. High-pass filters are used for AC coupling (blocking DC offsets while passing signals), removing low-frequency drift from sensor readings, and as part of crossover networks in audio systems. -- H&H 1.4

### Topic 6: RL Filters

Inductors can also form filters. An RL low-pass filter uses R in series and L to ground: at low frequencies, the inductor impedance (jwL) is low, shorting the output to ground -- wait, that is a high-pass topology. For RL low-pass: L in series, R to ground. At low frequencies, L has low impedance (passes signal). At high frequencies, L has high impedance (blocks signal). The cutoff frequency is f_c = R/(2*pi*L). RL filters are less common than RC filters at audio frequencies because inductors are bulky and expensive, but they are essential at RF frequencies where small inductors are practical and capacitor parasitic effects limit RC filter performance. -- H&H 1.5

### Topic 7: RLC Resonance

When inductors and capacitors are combined with resistors, resonance occurs at the frequency where inductive and capacitive reactances cancel: f_0 = 1/(2*pi*sqrt(LC)). In a series RLC circuit, the impedance at resonance equals R alone (minimum impedance, maximum current). In a parallel RLC circuit, the impedance at resonance is maximum. The quality factor Q = (1/R)*sqrt(L/C) for series circuits measures the sharpness of the resonance peak. Higher Q means a narrower bandwidth BW = f_0/Q. At resonance, the voltage across L or C can exceed the source voltage by a factor of Q -- voltage magnification that enables radio receivers to select a single station from many broadcast signals. -- H&H 1.7

### Topic 8: Impedance

Impedance Z generalizes resistance to AC circuits, unifying resistors, capacitors, and inductors under one framework. For a resistor: Z_R = R (purely real). For a capacitor: Z_C = 1/(jwC) (purely imaginary, decreases with frequency). For an inductor: Z_L = jwL (purely imaginary, increases with frequency). Impedances combine like resistances: in series they add, in parallel the reciprocals add. The complex nature of impedance means circuits can have both magnitude and phase relationships between voltage and current. This framework transforms circuit analysis from differential equations into algebra -- the key insight that makes AC analysis tractable. -- H&H 1.7

### Topic 9: Thevenin's Theorem

Any linear two-terminal network (no matter how complex) can be replaced by a single voltage source V_th in series with a single resistance R_th. To find V_th: measure the open-circuit voltage at the terminals. To find R_th: zero all independent sources (short voltage sources, open current sources) and measure the resistance between the terminals. This theorem dramatically simplifies circuit analysis -- a complex power supply with dozens of components can be modeled as just V_th + R_th when analyzing its behavior with a specific load. The load voltage is then simply V_load = V_th * R_load / (R_th + R_load). -- H&H 1.2

### Topic 10: Norton's Theorem

Norton's theorem is the dual of Thevenin's: any linear two-terminal network can be replaced by a current source I_N in parallel with a resistance R_N. The Norton current I_N equals the short-circuit current at the terminals (current when the output is shorted). R_N equals R_th (same resistance). The relationship is I_N = V_th / R_th and R_N = R_th. Norton equivalents are sometimes more convenient than Thevenin -- particularly when analyzing circuits with current-mode signals or when combining multiple sources in parallel. Converting between Thevenin and Norton is trivial, making them interchangeable tools for circuit simplification. -- H&H 1.2

## Learn Mode Depth Markers

### Level 1: Practical

> A capacitor blocks DC and passes AC. Larger capacitors pass lower frequencies. Think of it as a tiny rechargeable battery that charges and discharges rapidly. -- H&H 1.4

> An inductor resists changes in current. It passes DC freely but opposes AC -- the opposite of a capacitor. -- H&H 1.5

### Level 2: Reference

> See H&H 1.4 for capacitor behavior in AC circuits, RC time constants, and high-pass/low-pass filter configurations. Section 1.7 covers impedance and resonant circuits. -- H&H 1.4

> See H&H 1.7 for the generalized impedance concept that unifies resistors, capacitors, and inductors in AC analysis, including series and parallel resonance. -- H&H 1.7

### Level 3: Mathematical

> Capacitive impedance: Z_C = 1/(jwC). Inductive impedance: Z_L = jwL. RC time constant: tau = RC. Resonant frequency: f_0 = 1/(2*pi*sqrt(LC)). Quality factor: Q = f_0/BW = (1/R)*sqrt(L/C). -- H&H 1.7
