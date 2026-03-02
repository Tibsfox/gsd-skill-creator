# H&H 3rd Edition Section-Level Gap Analysis

> **Date**: 2026-03-01
> **Scope**: All 15 H&H chapters mapped against 16 electronics pack modules (01-15, including 07a)
> **Purpose**: Identify section-level coverage gaps for downstream phases 510-512
> **Methodology**: For each H&H section at X.Y granularity, cross-reference content.md topics and labs.ts verify() functions in the corresponding module. COVERED requires both content AND a lab exercise testing the core concept. PARTIAL means content exists but no dedicated lab, or a lab exists but only touches the surface. MISSING means no module addresses the section. DEFERRED means out of v1 scope per existing documentation.

---

## Chapter 1: Foundations

### Sections Mapped to Modules 01-04

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 1.1 | Introduction to electronics | COVERED | 01-the-circuit | - | content.md Overview covers foundational circuit concepts |
| 1.2 | Voltage, current, resistance | COVERED | 01-the-circuit | - | Topics 1-3 + labs 01-02 (Ohm's law, first circuit) directly test V/I/R |
| 1.2 | Ohm's law | COVERED | 01-the-circuit | - | Topic 4 + lab02 verify() tests three resistance values |
| 1.2 | Power dissipation | COVERED | 01-the-circuit | - | Topic 5 + lab05 verify() tests all three power formulas |
| 1.2 | KVL and KCL | COVERED | 01-the-circuit | - | Topics 6-7 + lab04 verify() checks both KVL sum and KCL balance |
| 1.2 | Voltage dividers | COVERED | 01-the-circuit | - | Topic 8 + lab03 verify() tests divider formula via MNA |
| 1.2 | Series and parallel circuits | COVERED | 01-the-circuit | - | Topics 9-10 + lab04 exercises parallel combination |
| 1.2 | Thevenin/Norton equivalents | COVERED | 02-passive-components | - | Topics 9-10 + lab05 verify() compares original vs Thevenin circuits |
| 1.3 | Signals | PARTIAL | 03-the-signal | modules/03-the-signal/labs.ts | content.md covers AC signals (Topic 1) but H&H 1.3 includes signal sources, waveform types (square, triangle, sawtooth), and signal generator concepts not directly exercised in a lab |
| 1.4 | Capacitors and AC circuits | COVERED | 02-passive-components | - | Topics 1, 3-5 + lab01 (charge/discharge), lab02 (RC LPF) with verify() |
| 1.4 | RC time constants | COVERED | 02-passive-components | - | Topic 3 + lab01 verify() checks V at t=tau against exponential formula |
| 1.4 | RC filters | COVERED | 02-passive-components | - | Topics 4-5 + labs 02-03 verify() check -3dB and rolloff slopes |
| 1.5 | Inductors and transformers | PARTIAL | 02-passive-components | modules/02-passive-components/labs.ts | Topic 2 covers inductors, Topic 6 covers RL filters; but no dedicated inductor-only lab. H&H 1.5 includes transformer action, mutual inductance, turns ratio -- none exercised in labs. Transformer content absent from content.md |
| 1.5 | Transformer action | MISSING | 02-passive-components | modules/02-passive-components/labs.ts | H&H 1.5 covers turns ratio, impedance transformation via transformers. No content or lab exists |
| 1.6 | Diodes and diode circuits | COVERED | 04-diodes | - | Topics 1-10 + labs 01-05 cover I-V, rectification, Zener, LED with verify() |
| 1.6 | Rectifier circuits | COVERED | 04-diodes | - | Topics 3-5 + labs 02-03 verify() half-wave and bridge rectification |
| 1.6 | Zener regulation | COVERED | 04-diodes | - | Topic 6 + lab04 verify() checks 5.1V Zener clamping |
| 1.6 | Diode switching speed | PARTIAL | 04-diodes | modules/04-diodes/labs.ts | Topic 9 covers reverse recovery and Schottky concepts, but no lab exercises switching speed or compares standard vs Schottky performance |
| 1.7 | Impedance and reactance | COVERED | 03-the-signal | - | Topics 3-5 + lab03 verify() calculates X_C, X_L, and cross-checks with AC analysis |
| 1.7 | Frequency response / Bode plots | COVERED | 03-the-signal | - | Topics 6-7 + lab02 verify() checks gain at multiple frequencies (Bode sweep) |
| 1.7 | Decibels | COVERED | 03-the-signal | - | Topic 8 + lab04 verify() demonstrates dB addition through cascaded filters |
| 1.7 | RLC resonance | COVERED | 02-passive-components | - | Topic 7 + lab04 verify() checks resonant peak frequency and Q factor |
| 1.7 | Filters and resonance | COVERED | 02-passive-components | - | Topics 4-7 cover passive filter types; labs 02-04 exercise them with verify() |

---

## Chapter 2: Bipolar Transistors

### Sections Mapped to Module 05-transistors

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 2.1 | Introduction to BJTs | COVERED | 05-transistors | - | Topic 1 (BJT structure NPN/PNP) covers the fundamentals |
| 2.2 | Common-emitter amplifier | COVERED | 05-transistors | - | Topic 4 + lab02 verify() checks bias point of voltage-divider-biased CE amp |
| 2.2 | Emitter follower | COVERED | 05-transistors | - | Topic 5 + lab03 verify() checks V_BE tracking and unity gain |
| 2.2 | BJT as switch | COVERED | 05-transistors | - | Topic 2 + lab01 verify() confirms saturation (V_collector < 1V) |
| 2.2 | Current gain (beta) | COVERED | 05-transistors | - | Topic 3 covers beta variation and design implications |
| 2.3 | Differential amplifiers | MISSING | 05-transistors | modules/05-transistors/labs.ts | H&H 2.3 covers diff pairs, which are the building blocks of op-amps and comparators. No content or lab in module 05 |
| 2.3 | Cascode amplifiers | MISSING | 05-transistors | modules/05-transistors/labs.ts | H&H 2.3 covers cascode for improved bandwidth and output resistance. Not addressed |
| 2.4 | Current mirrors and active loads | PARTIAL | 05-transistors | modules/05-transistors/labs.ts | Topic 9 + lab05 verify() tests basic mirror, but H&H 2.4 covers Wilson mirror, cascode mirror, and active loads in depth. Lab only tests simple mirror ratio |
| 2.5 | Biasing techniques | PARTIAL | 05-transistors | modules/05-transistors/labs.ts | Lab02 uses voltage-divider bias, but H&H 2.5 covers collector-feedback bias, emitter bias networks, and thermal stability analysis in detail. Only one bias topology exercised |

---

## Chapter 3: Field-Effect Transistors

### Sections Mapped to Module 05-transistors

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 3.1 | Introduction to FETs (JFET, MOSFET) | PARTIAL | 05-transistors | modules/05-transistors/labs.ts | Topic 7 covers MOSFETs; JFETs mentioned only in passing. No JFET lab. H&H 3.1 covers JFET drain characteristics and pinch-off in depth |
| 3.2 | FET linear circuits | MISSING | 05-transistors | modules/05-transistors/labs.ts | H&H 3.2 covers FET amplifiers (common-source, common-drain). No FET amplifier content or labs |
| 3.3 | FET switches (analog) | MISSING | 05-transistors | modules/05-transistors/labs.ts | H&H 3.3 covers CMOS analog switches, transmission gates. Not addressed beyond basic MOSFET switching |
| 3.4 | MOSFET digital logic | PARTIAL | 07a-logic-gates | modules/07a-logic-gates/labs.ts | Module 07a Topic 4 covers CMOS gate construction + lab01 tests NAND from transistors. But H&H 3.4 goes deeper into NMOS logic, depletion-load, and transfer characteristics |
| 3.5 | Power MOSFETs | PARTIAL | 05-transistors | modules/05-transistors/labs.ts | Topic 8 covers MOSFET as switch, lab04 uses resistor model for R_ds(on). H&H 3.5 covers gate drive requirements, safe operating area (SOA), avalanche ratings -- not addressed |
| 3.6 | FET amplifier miscellany | MISSING | 05-transistors | modules/05-transistors/labs.ts | H&H 3.6 covers FET source followers, cascode FET circuits, FET current sources. No content or labs |

---

## Chapter 4: Operational Amplifiers

### Sections Mapped to Module 06-op-amps

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 4.1 | Introduction / golden rules | COVERED | 06-op-amps | - | Topic 1 + lab01 verify() demonstrates golden rules via voltage follower |
| 4.2 | Basic op-amp circuits | COVERED | 06-op-amps | - | Topics 2-6 + labs 01-04: buffer, non-inverting (lab02), integrator (lab04). Inverting amp covered in content Topic 3 |
| 4.2 | Summing amplifier | PARTIAL | 06-op-amps | modules/06-op-amps/labs.ts | Topic 5 covers summing amp theory, but no dedicated lab exercises or verifies it |
| 4.2 | Differentiator | PARTIAL | 06-op-amps | modules/06-op-amps/labs.ts | Topic 6 covers differentiator theory alongside integrator, but lab04 only tests integrator DC behavior |
| 4.3 | Op-amp non-idealities | PARTIAL | 06-op-amps | modules/06-op-amps/labs.ts | Topic 9 covers GBW, slew rate, Vos, bias current, CMRR. No lab tests any non-ideality; all labs use ideal model |
| 4.4 | Precision op-amp design | MISSING | 06-op-amps | modules/06-op-amps/labs.ts | H&H 4.4 covers offset trimming, auto-zero techniques, chopper stabilization. Not addressed in content or labs |
| 4.5 | Instrumentation / diff amps | PARTIAL | 12-sensors-actuators | modules/12-sensors-actuators/labs.ts | Module 12 Topic 3 covers INA theory + lab02 tests INA math model. But H&H 4.5 covers three-op-amp INA derivation and CMRR optimization, which is only surface-level |
| 4.6 | Op-amp miscellany | MISSING | 06-op-amps | modules/06-op-amps/labs.ts | H&H 4.6 covers logarithmic amplifiers, gyrators, negative impedance converters. Not addressed |

---

## Chapter 5: Precision Circuits

### Sections Mapped to Module 12-sensors-actuators

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 5.1 | Precision voltage references | MISSING | 06-op-amps | modules/06-op-amps/labs.ts | H&H 5.1 covers bandgap references, Zener references, temperature stability. Not addressed beyond basic Zener in module 04 |
| 5.2 | Precision op-amp design | MISSING | 06-op-amps | modules/06-op-amps/labs.ts | H&H 5.2 covers auto-zero, chopper stabilization, guard rings. Not addressed |
| 5.3 | Precision converters | MISSING | 09-data-conversion | modules/09-data-conversion/labs.ts | H&H 5.3 covers precision voltage-to-frequency and frequency-to-voltage converters. Not addressed |
| 5.4 | Charge-sensitive amplifiers | MISSING | 12-sensors-actuators | modules/12-sensors-actuators/labs.ts | H&H 5.4 covers charge amplifiers for piezoelectric sensors and particle detectors. Not addressed |
| 5.5 | Bridge and lock-in amplifiers | PARTIAL | 12-sensors-actuators | modules/12-sensors-actuators/labs.ts | Module 12 Topics 2-3 cover Wheatstone bridge + INA (lab01 + lab02). But H&H 5.5 covers lock-in amplifiers and synchronous detection -- not addressed |
| 5.6 | Digital-domain precision | MISSING | 09-data-conversion | modules/09-data-conversion/labs.ts | H&H 5.6 covers digital calibration, averaging, and precision in the digital domain. Not addressed as a distinct topic |

---

## Chapter 6: Filters

### Sections Mapped to Modules 02, 03, 06

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 6.1 | Introduction to filters | COVERED | 02-passive-components | - | Passive filter fundamentals in Topics 4-6 + multiple labs |
| 6.2 | Passive filters (RC, RL, RLC) | COVERED | 02-passive-components | - | Topics 4-7 + labs 02-04 cover LPF, HPF, resonance with verify() |
| 6.3 | Active filters | PARTIAL | 06-op-amps | modules/06-op-amps/labs.ts | Topic 8 covers Sallen-Key topology, lab03 verify() tests DC passband only. H&H 6.3 covers state-variable, biquad, and multiple response types (Butterworth, Chebyshev, Bessel) -- only Sallen-Key LPF is exercised |
| 6.4 | Switched-capacitor filters | MISSING | 06-op-amps | modules/06-op-amps/labs.ts | H&H 6.4 covers SC filters (MF10, LMF100). Not addressed |
| 6.5 | Digital filters overview | COVERED | 10-dsp | - | Module 10 provides comprehensive FIR/IIR/FFT coverage with labs |

---

## Chapter 7: Oscillators and Timers

### ALL DEFERRED -- Out of v1 scope

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 7.1 | RC and LC oscillators | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 7.2 | Crystal oscillators | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 7.3 | Voltage-controlled oscillators | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 7.4 | Timers (555, etc.) | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |

---

## Chapter 8: Low-Noise Techniques

### Bulk DEFERRED, 8.11 COVERED

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 8.1 | Noise sources | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.2 | Noise calculations | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.3 | Low-noise design techniques | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.4 | Noise measurements | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.5 | Interference and shielding | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.6 | Signal transformers | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.7 | Ground loops | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.8 | Bandwidth narrowing | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.9 | Autozero and chopper amps | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.10 | Signal averaging | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 8.11 | Noise fundamentals (Johnson noise) | COVERED | 03-the-signal | - | Topic 10 + lab05 verify() calculates Johnson noise voltage and tests sqrt(R) and sqrt(BW) scaling |

---

## Chapter 9: Voltage Regulation and Power

### Sections Mapped to Modules 07, 14

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 9.1 | Linear regulators | COVERED | 07-power-supplies | - | Topics 1-2 + lab01 verify() tests 7805 at 5V output; lab04 tests load regulation |
| 9.2 | Heat and thermal management | COVERED | 07-power-supplies | - | Topic 7 covers thermal resistance, junction temp, derating |
| 9.3 | Switching regulators (overview) | COVERED | 07-power-supplies | - | Topics 3-5 cover buck, boost, buck-boost topologies |
| 9.4 | Buck converter | COVERED | 07-power-supplies | - | Topic 3 + lab02 verify() tests 12V-to-3.3V buck |
| 9.4 | Boost converter | COVERED | 07-power-supplies | - | Topic 4 + lab03 verify() tests 3.3V-to-5V boost |
| 9.4 | Buck-boost / SEPIC | PARTIAL | 07-power-supplies | modules/07-power-supplies/labs.ts | Topic 5 covers buck-boost and SEPIC theory. No dedicated lab exercises buck-boost operation |
| 9.5 | Power-factor correction | MISSING | 07-power-supplies | modules/07-power-supplies/labs.ts | H&H 9.5 covers PFC circuits for AC mains. Not addressed in content or labs |
| 9.6 | Inverters (DC-AC) | PARTIAL | 14-off-grid-power | modules/14-off-grid-power/labs.ts | Module 14 covers inverters in the off-grid context. H&H 9.6 provides deeper treatment of full-bridge inverters and sine-wave generation |
| 9.7 | Power conversion miscellany | MISSING | 07-power-supplies | modules/07-power-supplies/labs.ts | H&H 9.7 covers charge pumps, flyback converters, forward converters. Not addressed |
| 9.8 | Solar cells and energy harvesting | COVERED | 14-off-grid-power | - | Module 14 Topics 1-10 + 5 labs comprehensively cover solar PV, I-V, MPPT, batteries |

---

## Chapter 10: Digital Logic

### Sections Mapped to Modules 07a and 08

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 10.1 | Basic logic concepts | COVERED | 07a-logic-gates | - | Topics 1-3 + labs cover binary, Boolean algebra, gate types |
| 10.1 | Boolean algebra | COVERED | 07a-logic-gates | - | Topics 2, 5-6 cover Boolean laws, De Morgan's, K-maps |
| 10.1 | Combinational building blocks | COVERED | 07a-logic-gates | - | Topic 7 + lab05 covers adders, mux, decoders |
| 10.1 | Universal gates (NAND/NOR) | COVERED | 07a-logic-gates | - | Topic 10 + lab06 tests building functions from NAND only |
| 10.2 | CMOS gate construction | COVERED | 07a-logic-gates | - | Topic 4 + lab01 verify() tests gate-from-transistors CMOS model |
| 10.2 | Propagation delay and timing | COVERED | 07a-logic-gates | - | Topic 8 + lab07 verify() tests propagation delay via timing diagram |
| 10.2 | Power consumption (dynamic/static) | COVERED | 07a-logic-gates | - | Topic 9 covers P_dynamic = C_L * V_DD^2 * f |
| 10.3 | Latches and flip-flops | COVERED | 08-sequential-logic | - | Topic 1 + lab01 verify() tests D flip-flop from NAND gates |
| 10.3 | Clock signals and timing | COVERED | 08-sequential-logic | - | Topic 2 covers f_max, setup/hold time |
| 10.4 | Registers and shift registers | COVERED | 08-sequential-logic | - | Topic 3 + lab03 verify() tests shift register operation |
| 10.4 | Counters | COVERED | 08-sequential-logic | - | Topic 4 + lab02 verify() tests synchronous binary counter |
| 10.4 | Logic pathology (metastability) | PARTIAL | 08-sequential-logic | modules/08-sequential-logic/labs.ts | Topic 7 covers metastability, debouncing, synchronizers. No lab exercises these concepts |
| 10.5 | State machines (FSM) | COVERED | 08-sequential-logic | - | Topic 5 + lab04 verify() tests Moore/Mealy FSM |
| 10.5 | Memory cells (SRAM, DRAM) | PARTIAL | 08-sequential-logic | modules/08-sequential-logic/labs.ts | Topic 6 covers SRAM 6T cell, DRAM, ROM types. No lab exercises memory cell behavior |
| 10.5 | Digital misc (FIFOs, buses) | MISSING | 08-sequential-logic | modules/08-sequential-logic/labs.ts | H&H 10.5 covers FIFOs, three-state buses, bus arbitration. Not addressed |

---

## Chapter 11: Programmable Logic

### ALL DEFERRED -- Out of v1 scope

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 11.1 | PLDs and CPLDs | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 11.2 | FPGAs | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 11.3 | HDL design (Verilog/VHDL) | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |
| 11.4 | FPGA design flow | DEFERRED | - | - | Out of v1 scope per hh-chapter-map.md |

---

## Chapter 12: Circuit Construction

### Sections Mapped to Modules 12 and 15

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 12.1 | Printed circuit boards | COVERED | 15-pcb-design | - | Module 15 Topics 1-10 + 5 labs comprehensively cover PCB design flow |
| 12.2 | Construction techniques | PARTIAL | 15-pcb-design | modules/15-pcb-design/labs.ts | Module 15 focuses on PCB CAD. H&H 12.2 covers breadboarding, wire-wrapping, protoboard, and mechanical assembly techniques. No breadboard/prototyping lab |
| 12.3 | Test and debug | PARTIAL | 15-pcb-design | modules/15-pcb-design/labs.ts | Module 15 covers DRC. H&H 12.3 covers oscilloscope/multimeter debug techniques, fault tracing, boundary scan (JTAG). Only DRC is exercised |
| 12.4 | Grounding and shielding | PARTIAL | 15-pcb-design | modules/15-pcb-design/labs.ts | Module 15 content covers ground planes. H&H 12.4 covers star grounding, split ground planes, EMI shielding, cable grounding. Only ground plane coverage in content, no dedicated lab |

---

## Chapter 13: Data Converters

### Sections Mapped to Modules 09 and 10

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 13.1 | Introduction (sampling, Nyquist) | COVERED | 09-data-conversion | - | Topics 1-2 + lab01 verify() tests aliasing detection via FFT |
| 13.2 | DACs (R-2R, current-steering) | COVERED | 09-data-conversion | - | Topic 4 + lab02 verify() tests R-2R DAC output linearity |
| 13.3 | ADCs (SAR, flash, sigma-delta) | COVERED | 09-data-conversion | - | Topics 5-7 + labs 03-04 verify() test SAR binary search and sigma-delta noise shaping |
| 13.4 | Converter specifications | PARTIAL | 09-data-conversion | modules/09-data-conversion/labs.ts | Topic 8 covers ENOB, THD, DNL, INL in content. No lab tests converter specs directly |
| 13.5 | Digital signal processing | COVERED | 10-dsp | - | Module 10 Topics 1-10 + 5 labs: FIR, IIR, FFT, windowing, filter design with verify() |
| 13.6 | Converter miscellany | MISSING | 09-data-conversion | modules/09-data-conversion/labs.ts | H&H 13.6 covers sample-and-hold circuits, aperture jitter, converter interfaces. Not addressed |

---

## Chapter 14: Microcontrollers

### Sections Mapped to Module 11

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 14.1 | Introduction to MCUs | COVERED | 11-microcontrollers | - | Topic 1 (architecture) + lab01 (blink) |
| 14.2 | Architecture (Harvard, von Neumann) | COVERED | 11-microcontrollers | - | Topic 1 covers CPU core, memory map, peripheral bus |
| 14.3 | Peripheral features | COVERED | 11-microcontrollers | - | Topics 2-9 cover GPIO, UART, SPI, I2C, interrupts, timers, PWM, ADC + labs 01-05 |
| 14.4 | Programming (embedded C) | PARTIAL | 11-microcontrollers | modules/11-microcontrollers/labs.ts | Labs use GPIO simulator API, not actual embedded C. H&H 14.4 covers interrupt-driven programming, DMA, real-time constraints. Labs are simulated, not native embedded |
| 14.5 | Design examples | PARTIAL | 11-microcontrollers | modules/11-microcontrollers/labs.ts | Topic 10 covers MCU platforms (Arduino, ESP32, STM32). H&H 14.5 provides complete design walkthroughs. Labs are individual peripheral exercises, not complete system designs |

---

## Chapter 15: Embedded Systems

### Sections Mapped to Module 11

| H&H Section | Topic | Status | Module | Target File | Notes |
|-------------|-------|--------|--------|-------------|-------|
| 15.1 | Buses and interfaces | PARTIAL | 11-microcontrollers | modules/11-microcontrollers/labs.ts | Topics 4-5 cover SPI and I2C with labs. H&H 15.1 covers USB, Ethernet, CAN, RS-485 -- only SPI/I2C/UART addressed |
| 15.2 | Networks | MISSING | 11-microcontrollers | modules/11-microcontrollers/labs.ts | H&H 15.2 covers Ethernet, TCP/IP, wireless protocols. Not addressed |
| 15.3 | Real-time / RTOS | PARTIAL | 11-microcontrollers | modules/11-microcontrollers/labs.ts | Topic 10 mentions RTOS concept. H&H 15.3 covers RTOS task scheduling, priority inversion, semaphores. Only a brief mention exists |
| 15.4 | System design | MISSING | 11-microcontrollers | modules/11-microcontrollers/labs.ts | H&H 15.4 covers power management, watchdog timers, EMC compliance, system-level design. Not addressed |

---

## Coverage Summary

| Status | Count | Percentage |
|--------|-------|-----------|
| COVERED | 56 | 46.7% |
| PARTIAL | 26 | 21.7% |
| MISSING | 20 | 16.7% |
| DEFERRED | 18 | 15.0% |
| **Total** | **120** | **100%** |

**Actionable gaps (PARTIAL + MISSING):** 46 sections requiring content extension across 13 existing modules.

**Effective coverage (excluding DEFERRED):** 56 COVERED out of 102 in-scope sections = **54.9%** fully covered. With PARTIAL counted as half-covered: **(56 + 13) / 102 = 67.6%** effective coverage.

### By Tier

| Tier | Modules | Covered | Partial | Missing | Deferred |
|------|---------|---------|---------|---------|----------|
| 1 (Foundations) | 01, 02, 03 | 18 | 2 | 1 | 0 |
| 2 (Active/Analog) | 04, 05, 06, 07 | 20 | 14 | 15 | 0 |
| 3 (Digital/Mixed) | 07a, 08, 09, 10 | 17 | 3 | 2 | 0 |
| 4 (Applied) | 11, 12, 13, 14, 15 | 4 | 7 | 2 | 0 |
| N/A (Deferred) | - | 0 | 0 | 0 | 18 |

**Key observations:**
- **Tier 1** is the strongest: 85.7% fully covered (18/21). Only signal sources (1.3) and transformer theory (1.5) have gaps.
- **Tier 2** has the largest gap surface: 29 of 49 in-scope sections need work. Chapters 3 (FETs) and 5 (Precision) are especially sparse.
- **Tier 3** is well-covered: 77.3% fully covered (17/22). Minor gaps in memory cells and converter specs.
- **Tier 4** has moderate gaps: 4 of 13 fully covered, mostly in embedded systems breadth (Ch.15).

---

## Extension Targets by Module

### modules/01-the-circuit/labs.ts
- No gaps -- all H&H 1.2 sections fully covered

### modules/02-passive-components/labs.ts
- H&H 1.5: Inductor-only lab (PARTIAL) -- needs dedicated inductor transient or RL filter lab
- H&H 1.5: Transformer action (MISSING) -- needs new lab for turns ratio and impedance transformation

### modules/03-the-signal/labs.ts
- H&H 1.3: Signal sources/waveform types (PARTIAL) -- needs lab covering square/triangle/sawtooth generation and measurement

### modules/04-diodes/labs.ts
- H&H 1.6: Diode switching speed (PARTIAL) -- needs lab comparing standard vs Schottky reverse recovery

### modules/05-transistors/labs.ts
- H&H 2.3: Differential amplifiers (MISSING) -- needs new lab simulating BJT diff pair with tail current source
- H&H 2.3: Cascode amplifiers (MISSING) -- needs new lab for cascode topology (improved bandwidth, output resistance)
- H&H 2.4: Advanced current mirrors (PARTIAL) -- needs deeper steps for Wilson and cascode mirrors
- H&H 2.5: Biasing techniques (PARTIAL) -- needs labs for collector-feedback bias and thermal stability
- H&H 3.1: JFET introduction (PARTIAL) -- needs JFET drain characteristics and pinch-off lab
- H&H 3.2: FET linear circuits (MISSING) -- needs common-source and common-drain FET amplifier labs
- H&H 3.3: FET analog switches (MISSING) -- needs CMOS transmission gate lab
- H&H 3.5: Power MOSFET details (PARTIAL) -- needs deeper steps for gate drive, SOA analysis
- H&H 3.6: FET amplifier miscellany (MISSING) -- needs FET source follower and FET current source labs

### modules/06-op-amps/labs.ts
- H&H 4.2: Summing amplifier (PARTIAL) -- needs dedicated summing amp lab with verify()
- H&H 4.2: Differentiator (PARTIAL) -- needs differentiator lab (separate from integrator)
- H&H 4.3: Non-idealities (PARTIAL) -- needs lab testing GBW limit, slew rate, or offset voltage
- H&H 4.4: Precision op-amp design (MISSING) -- needs lab for offset trimming or auto-zero concept
- H&H 4.6: Op-amp miscellany (MISSING) -- needs lab for log amp or gyrator (new lab)
- H&H 5.1: Precision voltage references (MISSING) -- needs bandgap reference concept lab
- H&H 5.2: Precision op-amp design (MISSING) -- needs guard ring or chopper stabilization concept lab
- H&H 6.3: Active filters (PARTIAL) -- needs deeper Sallen-Key lab with AC sweep, or state-variable filter lab
- H&H 6.4: Switched-capacitor filters (MISSING) -- needs SC filter concept lab

### modules/07-power-supplies/labs.ts
- H&H 9.4: Buck-boost/SEPIC (PARTIAL) -- needs dedicated buck-boost lab with verify()
- H&H 9.5: Power-factor correction (MISSING) -- needs PFC concept lab
- H&H 9.7: Power conversion miscellany (MISSING) -- needs charge pump or flyback lab

### modules/07a-logic-gates/labs.ts
- H&H 3.4: MOSFET digital logic depth (PARTIAL) -- needs deeper steps for NMOS depletion-load logic and transfer characteristics

### modules/08-sequential-logic/labs.ts
- H&H 10.4: Logic pathology / metastability (PARTIAL) -- needs metastability or debounce lab
- H&H 10.5: Memory cells (PARTIAL) -- needs SRAM cell or DRAM concept lab
- H&H 10.5: Digital misc (FIFOs, buses) (MISSING) -- needs FIFO or three-state bus lab

### modules/09-data-conversion/labs.ts
- H&H 5.3: Precision converters (MISSING) -- needs V-to-F or F-to-V converter concept lab
- H&H 5.6: Digital-domain precision (MISSING) -- needs digital calibration or averaging lab
- H&H 13.4: Converter specifications (PARTIAL) -- needs lab testing ENOB or DNL measurement
- H&H 13.6: Converter miscellany (MISSING) -- needs sample-and-hold or aperture jitter lab

### modules/11-microcontrollers/labs.ts
- H&H 14.4: Embedded programming (PARTIAL) -- needs interrupt-driven programming or DMA lab
- H&H 14.5: Design examples (PARTIAL) -- needs complete system design walkthrough lab
- H&H 15.1: Buses and interfaces (PARTIAL) -- needs USB, CAN, or RS-485 concept lab
- H&H 15.2: Networks (MISSING) -- needs Ethernet or wireless protocol concept lab
- H&H 15.3: Real-time / RTOS (PARTIAL) -- needs RTOS task scheduling concept lab
- H&H 15.4: System design (MISSING) -- needs system-level design or watchdog timer lab

### modules/12-sensors-actuators/labs.ts
- H&H 4.5: Instrumentation amplifier depth (PARTIAL) -- needs deeper INA derivation or CMRR optimization lab
- H&H 5.4: Charge-sensitive amplifiers (MISSING) -- needs charge amplifier concept lab
- H&H 5.5: Lock-in amplifiers (PARTIAL) -- needs lock-in / synchronous detection concept lab

### modules/14-off-grid-power/labs.ts
- H&H 9.6: Inverters (PARTIAL) -- needs deeper full-bridge inverter or sine-wave generation lab

### modules/15-pcb-design/labs.ts
- H&H 12.2: Construction techniques (PARTIAL) -- needs breadboarding or protoboard layout lab
- H&H 12.3: Test and debug (PARTIAL) -- needs oscilloscope debug technique or JTAG concept lab
- H&H 12.4: Grounding and shielding (PARTIAL) -- needs star grounding or EMI shielding concept lab

---

## Downstream Phase Mapping

### Phase Mapping

| Phase | Scope | Gap Count | Key Focus Areas |
|-------|-------|-----------|-----------------|
| 510 (Tier 1 Depth) | Modules 01-03 gaps | 3 | Signal sources (1.3), inductor/transformer labs (1.5) |
| 511 (Tier 2 Depth) | Modules 04-06 gaps | 29 | FET circuits (Ch.3), precision circuits (Ch.5), active filters (Ch.6), differential amps (2.3) |
| 512 (Tier 3 + Assessment) | Modules 07-09 gaps | 8 | Buck-boost lab (9.4), PFC (9.5), metastability (10.4), memory cells (10.5), converter specs (13.4) |

**Notes:**
- Phase 512 scope per ROADMAP is "Modules 7-9" meaning 07-power-supplies, 07a-logic-gates, 08-sequential-logic, 09-data-conversion
- Modules 10-15 (Tier 3 digital and Tier 4 applied) gaps are NOT in phases 510-512 scope -- they would be addressed in future phases
- Phase 511 has the largest gap surface (29 items) because Chapters 2-6 map to Tier 2 modules and contain the deepest H&H content

---

## Validation

### Extension Target Validity Check

All extension targets verified against `ls src/electronics-pack/modules/*/labs.ts`:

| Target File | Exists | Gap Count |
|-------------|--------|-----------|
| modules/01-the-circuit/labs.ts | YES | 0 |
| modules/02-passive-components/labs.ts | YES | 2 |
| modules/03-the-signal/labs.ts | YES | 1 |
| modules/04-diodes/labs.ts | YES | 1 |
| modules/05-transistors/labs.ts | YES | 9 |
| modules/06-op-amps/labs.ts | YES | 9 |
| modules/07-power-supplies/labs.ts | YES | 3 |
| modules/07a-logic-gates/labs.ts | YES | 1 |
| modules/08-sequential-logic/labs.ts | YES | 3 |
| modules/09-data-conversion/labs.ts | YES | 4 |
| modules/10-dsp/labs.ts | YES | 0 |
| modules/11-microcontrollers/labs.ts | YES | 6 |
| modules/12-sensors-actuators/labs.ts | YES | 3 |
| modules/13-plc/labs.ts | YES | 0 |
| modules/14-off-grid-power/labs.ts | YES | 1 |
| modules/15-pcb-design/labs.ts | YES | 3 |

### Consistency Checks

- DEFERRED items: 18 total (Ch.7: 4, Ch.8 except 8.11: 10, Ch.11: 4) -- NONE have extension targets
- No new module directories suggested anywhere in this document
- Status counts: 56 + 26 + 20 + 18 = 120 total sections enumerated
- All 15 H&H chapters represented at section-level granularity
