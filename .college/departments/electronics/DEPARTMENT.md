# Electronics

**Domain:** electronics
**Source:** Electronics Educational Pack (Horowitz & Hill, Art of Electronics, 3rd Ed.)
**Status:** Active
**Purpose:** Progressive electronics curriculum from Ohm's law through DSP and industrial systems -- five tier-based wings covering circuit foundations, active devices, analog systems, digital and mixed-signal, and applied embedded systems

## Wings

- Circuit Foundations -- Voltage, current, resistance, passive components (RC/RL/RLC), AC signals and frequency analysis
- Active Devices -- Diode circuits, BJT/MOSFET transistors, semiconductor physics and amplifier configurations
- Analog Systems -- Op-amp circuits, power supply design, feedback, stability, and active filter design
- Digital & Mixed-Signal -- Boolean logic, combinational and sequential digital circuits, ADC/DAC, DSP fundamentals
- Applied Systems -- Microcontrollers, sensors/actuators, PLC/ladder logic, off-grid power, and PCB design

## Entry Point

elec-ohms-law-fundamentals

## Concepts

### Circuit Foundations (3 concepts)
- elec-ohms-law-fundamentals -- Voltage, current, resistance, Ohm's Law, KVL/KCL, series/parallel circuits
- elec-passive-component-behavior -- Capacitors, inductors, RC/RL/RLC filters, impedance, Thevenin/Norton equivalents
- elec-signal-ac-analysis -- AC signals, frequency response, Bode plots, decibels, noise, spectrum analysis

### Active Devices (3 concepts)
- elec-diode-rectification -- Diode I-V characteristics, rectification, Zener regulation, LEDs, Shockley equation
- elec-transistor-amplifiers -- BJT/MOSFET amplifiers, common-emitter, emitter-follower, current mirrors, gain
- elec-semiconductor-physics -- Semiconductor junctions, carrier physics underlying diode and transistor behavior

### Analog Systems (3 concepts)
- elec-opamp-configurations -- Inverting/non-inverting amplifiers, integrator, differentiator, comparator, golden rules
- elec-power-supply-design -- Linear and switching regulators, buck/boost, LDO, ripple, thermal management
- elec-feedback-stability -- Negative feedback, loop gain, stability analysis, compensation techniques

### Digital & Mixed-Signal (3 concepts)
- elec-combinational-logic -- Boolean algebra, CMOS logic gates, truth tables, K-maps, De Morgan's theorem
- elec-sequential-logic-design -- Flip-flops, counters, registers, state machines, clocks, synchronous design
- elec-data-conversion-dsp -- ADC/DAC architectures, Nyquist sampling, FIR/IIR filters, FFT, convolution

### Applied Systems (3 concepts)
- elec-microcontroller-interfacing -- MCU architecture, GPIO, UART/SPI/I2C, interrupts, PWM, Arduino/ESP32
- elec-sensor-actuator-systems -- Wheatstone bridge, H-bridge, stepper motors, thermocouples, instrumentation amps
- elec-industrial-embedded -- PLC/ladder logic, off-grid/solar MPPT, PCB layout, Gerber files, IEC 61131-3

### June-2026 arXiv scan backfill (10 concepts)
- elec-absolute-stability-circle-criterion -- Circle criterion generalizes Nyquist to certify a feedback loop stable for every sector-bounded nonlinearity; relaxed KYP/LMI inequality avoids strict P>0 definiteness (arXiv:2606.19311)
- elec-analog-filter-discretization -- Converts continuous H(s) to discrete H(z) via bilinear/Tustin, impulse-invariance, or matched-z transforms, trading stability, aliasing, and frequency warping near Nyquist (arXiv:2606.18615)
- elec-chopper-stabilization-offset-flicker-noise -- Modulates the signal above the flicker corner then demodulates, banishing DC offset and 1/f noise; capacitor-flipping yields high Fch-independent input impedance (arXiv:2606.13129)
- elec-clock-gating-dynamic-power -- Inserts enable-gated ICG cells so idle registers stop toggling, cutting alpha*C*V^2*f dynamic power; AUTOGATE's LLM-driven RTL rewrite reaches ~49% reduction on small designs (arXiv:2606.17461)
- elec-doherty-power-amplifier -- Carrier Class-AB plus peaking Class-C amplifiers use active load modulation via a quarter-wave impedance inverter to sustain efficiency across ~6 dB back-off (arXiv:2606.18395)
- elec-feedback-linearization -- Algebraically cancels plant nonlinearities with a Lie-derivative control law, leaving a chain of integrators for linear pole placement; fast but demands an accurate model (arXiv:2606.07961)
- elec-low-power-bus-encoding -- Maps each bus word to a codeword minimizing Hamming distance from the last, lowering activity alpha; bus-invert caps transitions at n/2, random codebooks cut flips ~24.7% (arXiv:2606.14203)
- elec-lqr-kalman-duality -- Optimal LQR regulator and Kalman estimator are identical up to a transpose (A<->A', B<->C', Q<->W, R<->V); one Riccati solver serves both, combining as LQG (arXiv:2606.12327)
- elec-pid-anti-windup -- When an actuator saturates the integrator winds up; clamping or back-calculation (tracking gain 1/Tt) keeps it consistent, preventing overshoot; hybrid scheme adds systematic Tt tuning (arXiv:2606.01959)
- elec-wide-bandgap-power-devices -- SiC MOSFETs and GaN HEMTs have ~3x silicon's bandgap, raising E_crit ~10x so specific on-resistance falls 100-1000x (Baliga FOM) and switching runs faster (arXiv:2606.25281)

## Calibration Models

- Electronics domain: circuit simulation parameters, MNA convergence tolerances, safety voltage thresholds

## Safety Boundaries

See Phase 26 -- electrical safety limits (voltage, grounding, component handling) defined there.
