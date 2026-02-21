# Module 7: Power Supplies

> **Tier**: 2 | **H&H Reference**: Ch.9 | **Safety Mode**: Gate

## Overview

Every electronic circuit needs power. From wall outlets to batteries, raw power must be converted, regulated, and protected before reaching sensitive components. A 9V battery cannot directly power a 3.3V microcontroller. A 120V AC outlet cannot directly feed a 5V USB device. Power supply design bridges this gap -- converting what is available into what is needed, safely and efficiently. This is where theory meets the physical world of heat, efficiency, and reliability. -- H&H Ch.9

## Topics

### 1. Linear Regulators

The simplest voltage regulator uses a pass transistor controlled by an error amplifier and voltage reference. The 78xx series (7805 for 5V, 7812 for 12V) are the classic examples. The pass transistor acts as a variable resistor, dropping the excess voltage as heat: P_dissipated = (V_in - V_out) * I_load. Simple, low noise, and requiring only two capacitors for stability, but fundamentally wasteful -- a 7805 running from 12V is only 42% efficient. Every watt of useful output creates 1.4 watts of heat. The dropout voltage (minimum V_in - V_out for regulation, typically 2V for the 78xx series) sets the minimum input voltage. -- H&H Ch.9

### 2. LDO Regulators

Low-Dropout Regulators reduce the minimum input-output differential to as little as 100-300mV. They achieve this by using a PMOS pass transistor instead of the NPN Darlington in standard regulators. An LDO like the AMS1117-3.3 can regulate 3.3V output from a 3.5V input -- impossible for a 78xx. LDOs excel when V_in is close to V_out (high efficiency) and when low noise is critical (no switching artifacts). Popular choices include the MCP1700 (250mV dropout, 250mA) for battery-powered designs and the AMS1117 series for USB-powered projects. The tradeoff: LDOs still dissipate (V_in - V_out) * I as heat, so they are inefficient when the voltage drop is large. -- H&H Ch.9

### 3. Buck Converter (Step-Down)

A buck converter uses a switch (MOSFET), inductor, diode, and output capacitor to step voltage down efficiently. The switch chops the input at 100kHz-2MHz, and the LC filter smooths the output. The fundamental relationship is V_out = D * V_in, where D is the duty cycle (fraction of time the switch is ON). At D = 0.275, a 12V input produces 3.3V output. Efficiency reaches 85-95% because the switch is either fully ON (low R_ds_on losses) or fully OFF (no current flow) -- it never operates in the linear region. The PWM controller adjusts D continuously to maintain the target output voltage under varying load and input conditions. -- H&H Ch.9

### 4. Boost Converter (Step-Up)

A boost converter stores energy in an inductor when the switch is ON, then releases it at a higher voltage through a diode to the output capacitor when the switch turns OFF. The output voltage is always higher than the input: V_out = V_in / (1 - D). At D = 0.34, a 3.3V input produces 5.0V output. This is how portable battery packs generate 5V USB from a single 3.7V lithium cell. Boost converters are also used for LED drivers (white LEDs need 3.0-3.5V per LED, and series strings can require 12V or more). Efficiency is typically 85-92%, decreasing at very high step-up ratios (D > 0.85) due to switch and inductor losses. -- H&H Ch.9

### 5. Buck-Boost and Inverting Converters

When the input voltage can be either above or below the desired output -- as with a battery discharging from 4.2V to 3.0V while you need 3.3V -- a buck-boost topology is needed. The basic inverting buck-boost produces V_out = -V_in * D / (1 - D), giving a negative output. The SEPIC (Single-Ended Primary-Inductor Converter) provides a non-inverting output with the same range flexibility. Both topologies are less efficient than pure buck or boost (two energy storage elements, more switch losses) but solve the "input crosses output" problem elegantly. Modern integrated buck-boost ICs like the TPS63000 series handle 1.8V-5.5V input to 3.3V output seamlessly. -- H&H Ch.9

### 6. Ripple Voltage and Filtering

No switching converter produces perfectly smooth DC. The output ripple voltage is approximately delta_V = I_load / (f_sw * C_out). Lower ripple requires larger output capacitance or higher switching frequency. At 500kHz with a 47uF ceramic capacitor supplying 500mA, ripple is about 21mV peak-to-peak. The capacitor's ESR (Equivalent Series Resistance) adds another ripple component: V_ripple_ESR = I_ripple * ESR. Ceramic capacitors (ESR < 10 milliohm) far outperform aluminum electrolytics (ESR 0.1-1 ohm) for ripple suppression. Input capacitors are equally important -- they provide the pulsed current the switching transistor demands, preventing conducted noise from propagating back to the source. -- H&H Ch.9

### 7. Thermal Management

Every milliwatt dissipated in a regulator becomes heat. For linear regulators, P_dissipated = (V_in - V_out) * I_load tells you exactly how much cooling is needed. Junction temperature is T_J = T_ambient + P * R_theta_JA, where R_theta_JA is the junction-to-ambient thermal resistance (typically 40-60 C/W for a TO-220 without heatsink, 5-15 C/W with one). If T_J exceeds the maximum rating (usually 125-150C), the regulator enters thermal shutdown. Design for at least 20C margin. Derating curves in datasheets show how maximum current decreases with ambient temperature. For switching regulators, losses are lower but concentrated in the MOSFET (switching and conduction losses) and inductor (core and copper losses). -- H&H Ch.9

### 8. Battery Charging

Lithium-ion cells use a CC/CV (Constant Current / Constant Voltage) charging profile. In the CC phase, the charger delivers a fixed current (typically 0.5C to 1C, where C is the cell capacity) until the cell voltage reaches 4.2V. Then the charger switches to CV mode, holding 4.2V while the current tapers exponentially. Charging terminates when the current drops below C/10 (e.g., 50mA for a 500mAh cell). Never exceed 4.2V per cell -- overvoltage causes lithium plating, leading to capacity loss, internal shorts, and fire. Dedicated charger ICs (TP4056, MCP73831) handle the CC/CV transition, termination detection, and safety monitoring. Temperature monitoring is critical: charging below 0C or above 45C degrades the cell. -- H&H Ch.9

### 9. Power Distribution

Modern circuits have multiple voltage rails: 5V for USB, 3.3V for microcontrollers, 1.8V for memory, 1.2V for processor cores. Point-of-load (POL) regulation places a small switching regulator next to each major IC, minimizing the distance high current must travel. Every IC needs local decoupling capacitors -- typically 100nF ceramic placed as close as possible to the power pins, plus a bulk electrolytic (10-100uF) shared among nearby ICs. Power planes in multi-layer PCBs provide low-impedance current paths. Multi-rail systems may require sequencing (which rail powers up first) to prevent latch-up in ICs with multiple supply pins. -- H&H Ch.9

### 10. Practical Power Supply Selection

Choosing the right regulator starts with four questions: What is the input voltage range? What output voltage and current are needed? How much noise can the load tolerate? How much PCB space is available? For low-noise analog circuits (ADCs, audio), use an LDO. For high-current digital loads, use a buck converter. For battery-to-USB, use a boost. Popular ICs: LM7805 (linear, 1.5A), AMS1117 (LDO, 1A), LM2596 (buck, 3A, easy to use), MT3608 (boost, 2A). Rules of thumb: always add 20% margin on current rating; keep V_in within datasheet range; use the recommended inductor and capacitor values from the datasheet; check efficiency curves at your actual operating point, not just the peak. -- H&H Ch.9

## Learn Mode Depth Markers

### Level 1: Practical

> A linear regulator wastes excess voltage as heat. Simple and low-noise, but inefficient when the input-output voltage difference is large. -- H&H Ch.9

> A switching regulator chops the input voltage rapidly and filters it to get the desired output. Much more efficient than linear, but introduces switching noise. -- H&H Ch.9

### Level 2: Reference

> See H&H Ch.9 for linear regulator design (pass transistor, error amplifier, dropout), switching converter topologies (buck, boost, buck-boost), and thermal management. -- H&H Ch.9

### Level 3: Mathematical

> Linear regulator: P_dissipated = (V_in - V_out) * I_load. Buck converter: V_out = D * V_in, where D = duty cycle. Boost: V_out = V_in/(1-D). Efficiency: eta = P_out/P_in. Inductor ripple: delta_I = (V_in - V_out)*D/(L*f_sw). -- H&H Ch.9
