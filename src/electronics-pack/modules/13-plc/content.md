# Module 13: Programmable Logic Controllers

> **Tier**: 4 | **H&H Reference**: IEC 61131-3 | **Safety Mode**: Redirect

## Overview

PLCs are the backbone of industrial automation -- from factories to water treatment plants to building management. Born as relay replacements in the late 1960s (Bedford Associates / Modicon 084), PLCs now run everything from conveyor belts to nuclear power plants. They are designed for reliability: no moving parts, no operating system vulnerabilities, scan-cycle determinism, and operation in harsh environments (heat, vibration, dust, EMI). IEC 61131-3 standardizes five programming languages: Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Instruction List (IL), and Sequential Function Chart (SFC). This module covers the core concepts and the two most important languages (ladder logic and structured text).

## Topics

### Topic 1: PLC Architecture (IEC 61131-3)

A PLC consists of a CPU module, I/O modules (digital and analog), a power supply, and a backplane or rack that connects them. The CPU executes the user program in a deterministic scan cycle with four phases: (1) read all inputs into the input image table, (2) execute the program top-to-bottom, (3) update all outputs from the output image table, (4) perform housekeeping (diagnostics, communication). Scan time is typically 1-50ms depending on program size and I/O count. Every input combination always produces the same output -- deterministic execution is what makes PLCs trustworthy in safety-critical applications. Real-world example: a water treatment plant PLC scans 500 I/O points in under 10ms, ensuring valve responses are always predictable. -- IEC 61131-3

### Topic 2: Ladder Logic (IEC 61131-3)

Ladder logic derives from relay circuit diagrams -- it was designed so electricians could program PLCs without learning computer science. The diagram has two vertical power rails (left = L1, right = L2/N) with horizontal rungs between them. Rungs are evaluated top-to-bottom, left-to-right. Contacts on the left represent conditions: Normally Open (NO) contacts close when the associated input is ON; Normally Closed (NC) contacts close when the input is OFF. Coils on the right represent actions: a coil energizes when the rung evaluates true. Contacts in series create AND logic; parallel branches create OR logic. The classic start/stop motor circuit uses a seal-in contact (output feeding back as input) to create latching behavior. Real-world example: every conveyor belt in a factory uses this exact pattern. -- IEC 61131-3

### Topic 3: Function Block Diagram (IEC 61131-3)

Function Block Diagram (FBD) is a graphical language that connects function blocks with signal lines. Standard blocks include AND, OR, NOT gates, timers (TON for on-delay, TOF for off-delay, TP for pulse), counters (CTU count-up, CTD count-down, CTUD bidirectional), comparators, and math operations. Custom function blocks encapsulate reusable logic. Data flows left-to-right through block inputs and outputs. FBD excels at analog signal processing and PID control where the signal flow is more intuitive than ladder rungs. Real-world example: a chemical plant uses FBD to implement cascade PID control where the output of one controller feeds the setpoint of another -- a pattern that is awkward in ladder logic but natural in FBD. -- IEC 61131-3

### Topic 4: Structured Text (IEC 61131-3)

Structured Text (ST) is a Pascal-like high-level language with IF/THEN/ELSE, CASE, FOR/WHILE loops, and function calls. It is the best choice for complex math, string processing, recipe management, and algorithm implementation. Example: a PID controller in ST is a few lines of arithmetic rather than dozens of function blocks. ST combines well with other languages -- you can call an ST function from inside an FBD block, or use ST for the complex calculations while ladder handles the discrete I/O. Modern PLC environments support all five IEC 61131-3 languages within a single project. Real-world example: pharmaceutical batch processes use ST for recipe calculations (ingredient ratios, timing sequences) because the math would be unreadable in ladder. -- IEC 61131-3

### Topic 5: Addressing and Data Types (IEC 61131-3)

PLC addresses follow IEC conventions: inputs use I or X (e.g., %IX0.0), outputs use Q or Y (e.g., %QX0.0), and memory/markers use M (e.g., %MX0.0). Data types include BOOL (single bit), BYTE (8 bits), WORD (16 bits), DWORD (32 bits), and REAL (floating point). Structured variables (STRUCT) and arrays organize complex data. Variables can be global (accessible everywhere) or local (scoped to a program/function block). Direct addressing (%IX0.0) maps to physical I/O; symbolic addressing (StartButton) maps to variable names. Modern practice favors symbolic addressing for readability and portability. Real-world example: migrating a program between PLC brands requires only remapping symbolic addresses to new physical I/O -- the logic stays unchanged. -- IEC 61131-3

### Topic 6: Timers and Counters (IEC 61131-3)

Timers and counters are standard function blocks used in nearly every PLC program. TON (on-delay timer): output goes ON after the input has been ON continuously for the preset time -- used for debouncing, startup delays, and timeout monitoring. TOF (off-delay timer): output stays ON for the preset time after the input goes OFF -- used for run-on ventilation fans and cooling pumps. TP (pulse timer): generates a fixed-duration pulse regardless of how long the input stays on -- used for dosing and one-shot events. CTU (count up) increments on each rising edge until it reaches preset; CTD (count down) decrements; CTUD does both. All have enable, reset, preset value, current value, and done flag. Real-world example: a packaging line uses CTU to count 12 bottles, then triggers a carton-sealing sequence. -- IEC 61131-3

### Topic 7: PID Control (IEC 61131-3)

PID (Proportional-Integral-Derivative) control regulates continuous process variables: temperature, pressure, flow, and level. The proportional term (P) responds to the current error -- larger error means stronger correction. The integral term (I) accumulates past errors to eliminate steady-state offset -- without it, the process settles slightly off-target. The derivative term (D) responds to the rate of change to dampen oscillation -- it acts as a brake when the process approaches setpoint quickly. Tuning methods include Ziegler-Nichols (increase P until oscillation, then calculate I and D) and trial-and-error. Anti-windup prevents the integral term from growing unbounded when the output is saturated. Discrete PID formula: u[n] = Kp*e[n] + Ki*T*sum(e[k]) + Kd*(e[n]-e[n-1])/T. Real-world example: every HVAC system in a commercial building uses PID to maintain room temperature within 0.5C of setpoint. -- IEC 61131-3

### Topic 8: Communication and Modbus (IEC 61131-3)

Industrial communication connects PLCs to sensors, drives, HMIs, and other PLCs. Modbus (1979, Modicon) is the most widely adopted protocol -- simple, open, and supported by virtually every industrial device. Modbus RTU uses RS-485 serial; Modbus TCP uses Ethernet. The data model has four regions: coils (single-bit read/write), discrete inputs (single-bit read-only), holding registers (16-bit read/write), and input registers (16-bit read-only). Function codes define operations: FC01 reads coils, FC05 writes a single coil, FC03 reads holding registers, FC06 writes a single register. Modern protocols include Profibus, Profinet, EtherNet/IP, and EtherCAT -- each optimized for different use cases (speed, determinism, distance). Real-world example: a building management system uses Modbus TCP to poll 200 sensors every second from a single PLC. -- IEC 61131-3

### Topic 9: Safety PLCs and SIL (IEC 61508/62061)

Safety Integrity Levels (SIL 1-4) define the required reliability of safety functions. SIL 1 requires a probability of failure on demand (PFD) less than 0.1; SIL 4 requires PFD less than 0.00001. Safety PLCs achieve high SIL ratings through redundant I/O, diagnostic coverage (self-test), safe failure fraction, and dual-channel processing with cross-checking. Emergency stop circuits are classified as Category 0 (immediate power removal) or Category 1 (controlled stop then power removal). Safety devices include E-stop buttons, light curtains, safety mats, and guard door interlocks. The critical difference between a standard PLC and a safety PLC: safety PLCs have redundant CPUs that cross-check every calculation, watchdog timers, and continuous self-diagnostics. Never rely on software alone for safety -- hardwired E-stop circuits are mandatory regardless of the PLC type. -- IEC 61508/62061

### Topic 10: Real-World PLC Applications

PLCs dominate industrial automation. Manufacturing: conveyor sorting (photoeyes + pneumatic diverters), pick-and-place robots (coordinated motion), CNC machine tool changers. Process control: water treatment (chemical dosing, filter backwash, pump sequencing), HVAC (zone control, economizer logic, demand ventilation), chemical batching (recipe management, reactor temperature). Building automation: lighting schedules, access control, elevator dispatch. Energy: substation automation (breaker control, fault detection), wind turbine pitch control (blade angle vs. wind speed). PLC vs. microcontroller: PLCs win on reliability (designed for 20+ year operation), I/O density (hundreds of channels), and harsh environments (rated for -40 to +60C, high vibration, EMI immunity). Microcontrollers win on cost, flexibility, and rapid prototyping. Real-world example: an automotive assembly line has 500+ PLCs coordinating welding, painting, and assembly across a 1km-long factory. -- IEC 61131-3

## Learn Mode Depth Markers

### Level 1: Practical

> A PLC (Programmable Logic Controller) is an industrial computer designed for harsh environments. It scans inputs, runs a program, and updates outputs in a repeating cycle. -- IEC 61131-3

> Ladder logic looks like electrical relay diagrams. Contacts on the left represent conditions; coils on the right represent actions. Read left-to-right, top-to-bottom. -- IEC 61131-3

### Level 2: Reference

> See IEC 61131-3 for the five standard PLC programming languages: Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Instruction List (IL), and Sequential Function Chart (SFC). -- IEC 61131-3

### Level 3: Mathematical

> PID control: u(t) = Kp*e(t) + Ki*integral(e(t)dt) + Kd*de(t)/dt. Discrete PID: u[n] = Kp*e[n] + Ki*T*sum(e[k]) + Kd*(e[n]-e[n-1])/T. Scan time: T_scan = T_input + T_execute + T_output. -- IEC 61131-3
