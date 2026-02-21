# Module 5: Transistors

> **Tier**: 2 | **H&H Reference**: Ch.2-3 | **Safety Mode**: Gate

## Overview

The transistor is the most important invention in electronics. It is a three-terminal semiconductor device that can amplify signals and switch currents, forming the foundation of every digital computer, every radio, and most analog circuits. A single modern processor contains billions of transistors, each acting as a tiny electronic switch. This module covers the two major transistor families -- bipolar junction transistors (BJTs) and metal-oxide-semiconductor field-effect transistors (MOSFETs) -- and teaches you to analyze and design circuits with both. -- H&H Ch.2

## Topics

### Topic 1: BJT Structure (NPN and PNP)

A bipolar junction transistor has three regions of doped semiconductor forming two back-to-back PN junctions. An NPN transistor sandwiches a thin P-type base between two N-type regions (collector and emitter). A PNP transistor reverses the doping: N-type base between P-type collector and emitter. The base region is intentionally made very thin (fractions of a micrometer) so that charge carriers injected from the emitter can diffuse across and be swept into the collector. The three terminals are called base (B), collector (C), and emitter (E). The emitter is the source of charge carriers, the collector gathers them, and the base controls the flow. In schematics, the arrow on the emitter indicates conventional current direction: pointing outward for NPN, inward for PNP. -- H&H Ch.2

### Topic 2: BJT as a Switch

A BJT makes an excellent electronic switch. In the OFF state (cutoff), no base current flows, so no collector current flows -- the collector-emitter path is an open circuit. In the ON state (saturation), sufficient base current drives the transistor so hard that V_CE drops to its minimum value, V_CE(sat), typically 0.1 to 0.3 volts. The collector-emitter path behaves like a closed switch with a small residual voltage. To guarantee saturation, designers overdrive the base: they ensure that beta times I_B far exceeds the available collector current I_C = (V_CC - V_CE(sat)) / R_C. A "forced beta" of 10 or less is the standard design rule. BJT switches are used to drive relays, LEDs, motors, and other loads that require more current than a logic output can provide directly. -- H&H Ch.2

### Topic 3: BJT Current Gain (Beta)

The defining property of a BJT is current amplification. A small base current I_B controls a much larger collector current I_C according to I_C = beta * I_B, where beta (also written h_FE) is the DC current gain. Typical beta values range from 50 to 300, depending on the transistor type, collector current, and temperature. Beta is not a precise parameter: it varies by a factor of 2 to 3 across production lots and changes with temperature (increasing at about 0.5% per degree Celsius). Good circuit design avoids depending on the exact value of beta. Instead, circuits use feedback (like an emitter resistor) to make performance depend on resistor ratios rather than transistor parameters. The total emitter current is I_E = I_C + I_B = (beta + 1) * I_B, so for large beta, I_E is approximately equal to I_C. -- H&H Ch.2

### Topic 4: Common-Emitter Amplifier

The common-emitter (CE) amplifier is the most widely used BJT amplifier configuration. The input signal is applied to the base, the output is taken from the collector, and the emitter is common to both (often connected to ground through a resistor). A voltage divider network (R1 and R2) sets the DC bias point at the base, establishing a stable operating point that is relatively independent of beta. The voltage gain is A_v = -g_m * R_C, where g_m is the transconductance. With an emitter resistor R_E for stability, the gain simplifies to A_v approximately equal to -R_C / R_E. The negative sign indicates phase inversion: a positive-going input produces a negative-going output. The CE amplifier provides both voltage gain and current gain, making it the workhorse of analog design. -- H&H Ch.2

### Topic 5: Emitter Follower (Common-Collector)

The emitter follower connects the input to the base and takes the output from the emitter, with the collector tied directly to the supply. Its voltage gain is approximately unity (just under 1), so it does not amplify voltage. Its value lies in impedance transformation: the input impedance is (beta + 1) times the emitter load impedance, while the output impedance is the source resistance divided by (beta + 1). This means the emitter follower can accept a high-impedance signal and deliver it to a low-impedance load without significant voltage loss. It is used as a buffer between stages, before driving cables, and in any situation where you need current gain without voltage gain. The output voltage follows the input minus one V_BE drop (about 0.6V). -- H&H Ch.2

### Topic 6: The Ebers-Moll Model

The Ebers-Moll model is the fundamental large-signal model for BJT behavior. In its simplified form for the forward-active region: I_C = beta * I_B with V_BE approximately 0.6V. The transconductance is g_m = I_C / V_T, where V_T is the thermal voltage (about 26mV at room temperature). At 1mA collector current, g_m = 1/26 ohms, giving the transistor a small-signal output current of 38.5 microamps per millivolt of input change. The full Ebers-Moll model includes reverse-active operation and saturation, modeled by two coupled diodes and two current sources. For most amplifier design, the simplified model (I_C = beta * I_B, V_BE = 0.6V, g_m = I_C / V_T) is sufficient. The exponential relationship between V_BE and I_C (I_C proportional to exp(V_BE / V_T)) underlies both the amplification mechanism and the temperature sensitivity of BJTs. -- H&H Ch.2

### Topic 7: MOSFETs

The metal-oxide-semiconductor field-effect transistor (MOSFET) is a voltage-controlled device. Unlike a BJT, where a base current controls the collector current, a MOSFET uses a gate voltage to control the drain current. The gate is insulated from the channel by a thin oxide layer, so no DC gate current flows -- the input impedance is essentially infinite. MOSFETs come in two flavors: N-channel (NMOS) and P-channel (PMOS). An NMOS turns ON when V_GS exceeds the threshold voltage V_th (typically 1-4V for power MOSFETs). When ON, the drain-source channel conducts with a resistance R_ds(on) that can be as low as a few milliohms. MOSFETs dominate digital logic (CMOS), power switching (motor drives, power supplies), and RF applications. -- H&H Ch.3

### Topic 8: MOSFET as Switch

When used as a switch, a MOSFET operates in just two states: OFF (V_GS < V_th, drain-source is open circuit) and ON (V_GS >> V_th, drain-source is a low resistance R_ds(on)). The key advantage over BJT switches is that the gate draws no DC current, so the drive circuit needs only to charge and discharge the gate capacitance. Logic-level MOSFETs have V_th below 2V, allowing direct drive from 3.3V or 5V logic outputs. Power dissipation in the ON state is P = I_D^2 * R_ds(on), which can be extremely low. For example, the IRFZ44N has R_ds(on) of 17.5 milliohms at V_GS=10V, so at 10A it dissipates only 1.75W. The main switching losses come from the transition between ON and OFF states, where the MOSFET briefly passes through its linear (amplifying) region. -- H&H Ch.3

### Topic 9: Current Mirrors

A current mirror is a circuit that copies a reference current from one branch to another. The basic mirror uses two matched BJTs: Q1 is diode-connected (collector tied to base), and Q2 shares the same base-emitter voltage. Since matched transistors with the same V_BE carry the same collector current, Q2's collector current mirrors Q1's collector current. The reference current is set by a resistor: I_ref = (V_CC - V_BE) / R_ref. The mirror current I_mirror equals I_ref to the extent that the transistors are matched. Accuracy limitations include finite beta (base current steal) and the Early effect (V_CE dependence). The Wilson mirror adds a third transistor to improve output resistance by a factor of beta, and the cascode mirror improves it further. Current mirrors are the fundamental current source in analog integrated circuits: they bias amplifier stages, create active loads, and set operating points. -- H&H Ch.2

### Topic 10: Transistor Selection Guide

For general-purpose NPN switching and amplification, the 2N2222 (or its surface-mount equivalent MMBT2222) is the industry standard: V_CE(max) = 40V, I_C(max) = 600mA, beta = 100-300, f_T = 300MHz. Its PNP complement is the 2N3906. For power switching, the IRFZ44N N-channel MOSFET handles 49A and 55V with R_ds(on) = 17.5 milliohms. Package types matter: TO-92 is the small plastic package for signal transistors (up to ~500mW), TO-220 is the standard power package with a metal tab for heatsinking (up to ~50W with heatsink), and SOT-23 is the tiny surface-mount package for space-constrained designs. When selecting a transistor, check: voltage ratings (V_CE or V_DS must exceed circuit voltage), current ratings (I_C or I_D must exceed load current), power dissipation (package thermal limits), and switching speed (f_T for BJTs, gate charge Q_g for MOSFETs). -- H&H Ch.2-3

## Learn Mode Depth Markers

### Level 1: Practical

> A bipolar transistor (BJT) amplifies current: a small base current controls a large collector current. Think of it as a current-controlled valve. -- H&H Ch.2

> A MOSFET is a voltage-controlled switch: gate voltage controls drain current. No gate current flows, so it is easy to drive from logic circuits. -- H&H Ch.3

### Level 2: Reference

> See H&H Ch.2 for BJT biasing, common-emitter amplifiers, current mirrors, and the Ebers-Moll model. Ch.3 covers FET types (JFET, MOSFET), transfer characteristics, and CMOS analog switches. -- H&H Ch.2

### Level 3: Mathematical

> BJT: I_C = beta * I_B, V_BE ~ 0.6V. Transconductance: g_m = I_C / V_T. Voltage gain: A_v = -g_m * R_C. MOSFET saturation: I_D = (1/2)*mu*C_ox*(W/L)*(V_GS - V_th)^2. -- H&H Ch.2
