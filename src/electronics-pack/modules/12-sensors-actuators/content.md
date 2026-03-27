# Module 12: Sensors and Actuators

> **Tier**: 4 | **H&H Reference**: Ch.2/5/12 | **Safety Mode**: Gate

## Overview

Sensors are the eyes, ears, and nerve endings of electronic systems. Actuators are the muscles. Together they close the loop between the digital world (MCU, DSP) and physical reality. Every robot, every process controller, every smart device relies on sensors to measure and actuators to act. This module covers the signal chain from sensor to ADC and from DAC/PWM to motor, drawing from H&H Ch.2 (transistor switches), Ch.5 (precision circuits), and Ch.12 (construction techniques). You will build a Wheatstone bridge, amplify its output with an instrumentation amplifier, drive a motor with an H-bridge, sequence a stepper, and isolate signals with an optocoupler.

## Topics

### Topic 1: Sensor Types and Classification (H&H Ch.5/12)

Sensors convert a physical quantity into an electrical signal. **Resistive sensors** change their resistance: strain gauges deform under stress (gauge factor ~2), RTDs track temperature linearly (alpha = 0.00385/degree C for platinum), thermistors have exponential temperature response, and photoresistors drop from megohms in dark to hundreds of ohms in bright light. **Voltage-generating sensors** produce their own EMF: thermocouples generate ~41 uV/K (type K), piezoelectric elements produce millivolts under pressure, and solar cells produce ~0.6V open-circuit. **Current sensors** like photodiodes generate current proportional to light intensity. **Capacitive sensors** detect humidity or proximity through dielectric changes. **Digital sensors** like rotary encoders and Hall-effect switches output logic levels directly. Each sensor type has a transfer function -- the mathematical relationship between the physical input and electrical output -- and understanding it is the first step in any measurement system design. -- H&H Ch.5/12

### Topic 2: Wheatstone Bridge (H&H Ch.5)

The Wheatstone bridge is the workhorse of precision resistance measurement. Four resistors arranged in a diamond, powered by an excitation voltage Vs, produce an output V_out = Vs * (R3/(R3+R4) - R1/(R1+R2)). When balanced (R1*R4 = R2*R3), the output is exactly zero. Replace one resistor with a sensor and the output becomes proportional to the resistance change. For small changes: V_out ~ Vs * deltaR / (4*R). A strain gauge with gauge factor 2 under 500 microstrain changes resistance by 0.1%, producing millivolts at the bridge output. This matters because the bridge nulls out the large DC offset, measuring only the tiny delta -- far more sensitive than a simple voltage divider. Load cells (kitchen scales, industrial weighing), pressure transducers, and RTD temperature sensors all use bridges. The excitation voltage trades off sensitivity (higher Vs = larger signal) against self-heating (sensor power = Vs^2/R). -- H&H Ch.5

### Topic 3: Instrumentation Amplifier (H&H Ch.5)

The instrumentation amplifier (INA) is a three-op-amp circuit packaged as a single device, purpose-built for amplifying small differential signals in the presence of large common-mode voltages. Gain is set by a single external resistor: G = 1 + 2R/Rg. A Wheatstone bridge might output 12mV riding on a 2.5V common-mode; the INA amplifies the 12mV to ~1.2V while rejecting the 2.5V -- a CMRR of 80-120 dB. Key specifications: input impedance exceeds 1 Giga-ohm (no loading of the bridge), offset voltage under 50 uV, temperature drift under 0.5 uV/degree C. The INA128 (TI) and AD620 (Analog Devices) are industry standards. In the signal chain, the INA sits between the bridge and the anti-aliasing filter, converting millivolts to volts suitable for the ADC. -- H&H Ch.5

### Topic 4: Signal Conditioning Chain (H&H Ch.5/12)

A complete sensor-to-digital pipeline: Sensor -> bridge excitation -> instrumentation amplifier -> anti-aliasing filter -> ADC. Each stage solves a specific problem. The bridge provides sensitivity by nulling the baseline. The INA provides gain and rejects common-mode noise. The anti-aliasing filter (low-pass, typically 2nd-order Butterworth) removes frequencies above the Nyquist limit to prevent aliasing in the ADC. The ADC digitizes the conditioned signal. Between stages, practical concerns dominate: grounding (star topology to avoid ground loops), shielding (driven guard ring around high-impedance inputs), and twisted-pair wiring for differential signals. For long cable runs, the 4-20mA current loop is the industrial standard -- current signals are immune to voltage drops along the wire. This architecture appears in every data acquisition system, from laboratory instruments to factory floor PLCs. -- H&H Ch.5/12

### Topic 5: H-Bridge Motor Driver (H&H Ch.2)

The H-bridge is four transistor switches (typically N-channel MOSFETs with high-side bootstrapping, or a P+N complementary pair) arranged in an H pattern with the motor in the crossbar. Turning on one diagonal (Q1+Q4) drives current through the motor in one direction (forward); the other diagonal (Q2+Q3) reverses it. All switches off allows the motor to coast. The critical failure mode is shoot-through: if both switches on the same leg turn on simultaneously, supply is shorted to ground through near-zero resistance, destroying the switches in microseconds. Prevention requires dead-time insertion -- a brief blanking interval (typically 0.5-2 us) between turning off one switch and turning on the other. Integrated driver ICs like L298, DRV8833, and BTS7960 handle dead-time internally. Speed control uses PWM on the enable pin: 10 kHz is typical, high enough to be inaudible but low enough to minimize switching losses. -- H&H Ch.2

### Topic 6: Stepper Motors (H&H Ch.2)

Stepper motors move in precise angular steps without feedback. A typical motor has 200 steps per revolution (1.8 degrees/step). Two coils (A and A', B and B') create a rotating magnetic field when energized in sequence. Full-step drive (two-phase-on) energizes two coils at a time for maximum torque: the 4-step sequence [AB, BA', A'B', B'A] advances the rotor by 1.8 degrees per step. Half-step drive interleaves single-coil and double-coil states, producing 8 phases at 0.9 degrees each -- finer resolution at the cost of uneven torque. Microstepping uses sinusoidal current profiles to subdivide each full step into 16, 32, or 256 microsteps, achieving sub-degree precision for CNC machines and 3D printers. The holding torque (torque at standstill with coils energized) exceeds the dynamic torque (torque while moving). Stepper drivers (A4988, DRV8825, TMC2209) handle the sequencing, current regulation, and microstepping automatically. -- H&H Ch.2

### Topic 7: DC Motor Characteristics (H&H Ch.2)

A DC motor is an energy converter: electrical energy in, mechanical rotation out. Its behavior is governed by two equations. The back-EMF is V_emf = K_e * omega, where K_e is the motor constant and omega is the angular velocity. At stall (omega = 0), back-EMF is zero and the full supply voltage drives current through the winding resistance: I_stall = V_supply / R_winding. This stall current can be 10-50 times the running current, a serious thermal risk. The speed-torque curve is approximately linear: as load torque increases, speed decreases proportionally. The H-bridge + PWM combination controls both direction and speed: duty cycle sets the effective voltage seen by the motor. Current sensing via a low-side shunt resistor (0.1-1 ohm) monitors load and enables current-limiting protection. Flyback diodes across each switch protect against the inductive voltage spike (L * di/dt) that occurs when switching off a current-carrying motor winding. -- H&H Ch.2

### Topic 8: Servo Motors (H&H Ch.14-15)

A servo motor packages a DC motor, gearbox, feedback potentiometer, and control circuit into a single unit. The control interface is a PWM signal: pulse width maps to shaft angle. The standard convention: 1ms pulse = 0 degrees, 1.5ms = 90 degrees (center), 2ms = 180 degrees. The PWM frequency is 50 Hz (20ms period), leaving most of the cycle idle. The internal controller compares the command pulse width against the potentiometer feedback and drives the motor until they match -- a closed-loop position control system. Servo specifications include torque (measured in kg-cm) and speed (seconds per 60-degree rotation). Digital servos sample the PWM signal faster than analog servos, providing stiffer position holding and quicker response. Continuous-rotation servos replace the potentiometer with speed control: 1.5ms = stop, 1ms = full reverse, 2ms = full forward. Servos are ubiquitous in robotics, RC vehicles, and camera gimbals. -- H&H Ch.14-15

### Topic 9: Optocouplers and Isolation (H&H Ch.12)

An optocoupler transfers signals across a galvanic isolation barrier using light: an LED on the input side illuminates a phototransistor on the output side, with no electrical connection between them. Isolation ratings range from 1 kV (basic insulation) to 7.5 kV (reinforced, medical-grade). The current transfer ratio (CTR) is the ratio of output collector current to input LED current, typically 50-300% and declining with age and temperature. When the input drives the LED (through a current-limiting resistor), the phototransistor conducts and pulls the output LOW through a pull-up resistor -- an inherently inverting configuration. CTR determines the minimum input current needed to saturate the output: for reliable switching, design for 50% of the nominal CTR. Speed ranges from DC to several MHz depending on the device; the 4N35 is a general-purpose type, while the 6N137 reaches 10 Mbps for digital data links. Applications: isolating MCU from industrial relay circuits, breaking ground loops in audio systems, and protecting measurement circuits from transient high voltages. -- H&H Ch.12

### Topic 10: Actuator Drive Circuits (H&H Ch.2/12)

Every actuator type needs a specific drive circuit. **Relay drivers**: a small-signal transistor (2N2222) or MOSFET switches the relay coil; a flyback diode (1N4148) clamps the inductive spike. **Solenoid drivers**: a power MOSFET (IRF540N) handles the higher current; an RC snubber damps the transient. **Piezo drivers**: require high-voltage amplifiers (up to 200V) because piezoelectric actuators need voltage, not current. **Heating elements**: controlled by zero-crossing solid-state relays (SSRs) that switch at the AC zero-crossing to minimize EMI. **LED drivers**: constant-current circuits (using a MOSFET + sense resistor or dedicated IC like CAT4101) because LED brightness depends on current, not voltage. The common thread: match the driver to the actuator's voltage, current, and switching-speed requirements, and always include protection for inductive loads. Inductive kickback (V = -L * di/dt) is the most common cause of drive transistor failure -- the flyback diode is not optional. -- H&H Ch.2/12

## Learn Mode Depth Markers

### Level 1: Practical

> Sensors convert physical quantities (temperature, light, pressure) into electrical signals. The signal is usually small and noisy, requiring amplification and filtering before the ADC. -- H&H Ch.5

> A Wheatstone bridge detects tiny resistance changes in sensors (strain gauges, RTDs). Balance the bridge, then amplify the difference signal. -- H&H Ch.5

### Level 2: Reference

> See H&H Ch.5 for precision circuit techniques (auto-zero amplifiers, chopper stabilization, guard rings) and Ch.12 for practical construction methods, shielding, and grounding. -- H&H Ch.5

### Level 3: Mathematical

> Wheatstone bridge: V_out = V_s * (R3/(R3+R4) - R1/(R1+R2)). Thermocouple: V = alpha * delta_T (Seebeck coefficient ~41uV/K for type K). RTD: R(T) = R_0 * (1 + alpha*T + beta*T^2). -- H&H Ch.5
