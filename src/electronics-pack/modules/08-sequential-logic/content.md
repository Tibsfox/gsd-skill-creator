# Module 8: Sequential Logic

> **Tier**: 3 | **H&H Reference**: 10.3-10.5 | **Safety Mode**: Annotate

## Overview

Sequential logic circuits remember state -- they have memory. Unlike combinational circuits where the output depends only on the current inputs, sequential circuits produce outputs that depend on both current inputs AND past history. Every flip-flop stores one bit of information, and from this simple building block emerges all of digital computing: registers hold data words, counters track events, state machines control complex processes, and memory cells store the programs and data that make computers useful. Sequential logic is the bridge between the static truth tables of combinational logic and the dynamic behavior of computer architecture. -- H&H 10.3

## Topics

### Topic 1: Latches and Flip-Flops

The simplest memory element is the SR latch: two cross-coupled NOR gates (or NAND gates) that lock into one of two stable states. Set the S input high to store a 1; set the R input high to store a 0; both low holds the current value. The forbidden state (both high) makes the SR latch impractical alone, which led to the D flip-flop -- the workhorse of digital design. A D flip-flop captures whatever value is on its D input at the moment of a clock edge and holds it until the next edge. The JK flip-flop resolves the forbidden state by toggling when both J and K are high, making it a "universal" flip-flop. The T flip-flop is a special case that toggles its output on each active clock edge when T is high, making it ideal for building counters. Edge-triggering (responding only to the clock transition, not the level) prevents transparent latch problems where data races through the circuit. Every flip-flop has setup time (how long data must be stable before the clock edge) and hold time (how long after), plus propagation delay from clock to output. -- H&H 10.3

### Topic 2: Clock Signals and Timing

The clock is the heartbeat of synchronous digital systems. It provides a regular timing reference so that all flip-flops update simultaneously, preventing the chaos of asynchronous operation. A clock signal has a frequency (cycles per second), a period (T = 1/f), and a duty cycle (fraction of the period spent high, typically 50%). The maximum clock frequency is constrained by the slowest path through combinational logic between two flip-flops: f_max = 1/(t_cq + t_comb + t_setup), where t_cq is clock-to-Q propagation delay, t_comb is the combinational logic delay, and t_setup is the receiving flip-flop's setup time. If you clock faster than this, data arrives late and the receiving flip-flop captures garbage. Hold time violations occur when data changes too quickly after the clock edge. Clock skew -- the difference in clock arrival time at different flip-flops -- can cause both setup and hold time violations in an otherwise correct design. -- H&H 10.3

### Topic 3: Registers and Shift Registers

A register is simply a group of flip-flops that store a multi-bit value. An 8-bit register uses eight D flip-flops sharing one clock signal, capturing all eight bits simultaneously on each clock edge. This is how processors store operands, addresses, and intermediate results. Shift registers add the ability to move data sideways: in a serial-in parallel-out (SIPO) shift register, data enters one bit at a time at one end and shifts through the chain of flip-flops. After N clock cycles, all N bits are available in parallel. The reverse, parallel-in serial-out (PISO), loads all bits at once and shifts them out one at a time. There are also SISO (serial both ways) and PIPO (parallel both ways, which is just a standard register). Shift registers are everywhere: SPI communication shifts data serially between chips, UART transmitters convert parallel data to serial, and LED driver chains like WS2812B shift color data through hundreds of LEDs. -- H&H 10.4

### Topic 4: Counters

A binary counter is built from T flip-flops where each stage toggles when all lower-order bits are 1. The simplest approach is the ripple counter: Q of the first flip-flop clocks the second, Q of the second clocks the third, and so on. This works but accumulates propagation delay -- the MSB doesn't update until all lower bits have rippled through, making ripple counters slow (t_total = N * t_pd). Synchronous counters solve this by clocking all flip-flops simultaneously and using AND gates to generate the toggle enable signals. A 4-bit synchronous counter has T0 always enabled, T1 enabled when Q0=1, T2 enabled when Q0 AND Q1=1, and T3 enabled when Q0 AND Q1 AND Q2=1. It counts 0000 to 1111 (0 to 15) then wraps to 0000 -- a modulo-16 counter. For modulo-N counting (where N is not a power of 2), add a decoder that detects state N and forces a synchronous reset to 0. A divide-by-N frequency divider outputs one pulse for every N input clocks. Ring counters circulate a single 1-bit through a shift register. Johnson counters twist the feedback to get 2N states from N flip-flops. -- H&H 10.4

### Topic 5: Finite State Machines

A finite state machine (FSM) is a circuit with a fixed number of states, transitions between states driven by inputs and clock edges, and outputs determined by the current state (and possibly inputs). Moore machines produce outputs that depend only on the current state -- the output is "attached" to the state. Mealy machines produce outputs that depend on both the current state and current inputs, which can respond faster but may glitch during input transitions. The design procedure is systematic: (1) draw a state diagram showing all states, transitions, and outputs; (2) create a state table listing next state and output for each current-state/input combination; (3) choose a state encoding (binary is compact, one-hot uses one flip-flop per state for speed, Gray code minimizes transitions); (4) derive the flip-flop excitation equations and output equations; (5) implement with flip-flops and combinational logic. Real applications include traffic light controllers, vending machines, communication protocol handlers, and -- most importantly -- CPU control units that sequence instruction execution. -- H&H 10.5

### Topic 6: Memory Cells

The most fundamental memory cell is the SRAM (Static RAM) cell: two cross-coupled inverters forming a bistable latch. Left alone, the latch holds either a 0 or a 1 indefinitely (as long as power is applied). To read or write, an access transistor (controlled by the word line) connects the latch to the bit line. The standard 6T SRAM cell uses six transistors per bit: two inverters (4 transistors) plus two access transistors. SRAM is fast (sub-nanosecond access) but large (6 transistors per bit). DRAM (Dynamic RAM) trades speed for density by storing each bit as charge on a tiny capacitor, using only one transistor and one capacitor per bit. The capacitor leaks, so DRAM must be periodically refreshed (typically every 64ms). ROM (Read-Only Memory) stores data permanently; PROM can be programmed once; EPROM can be erased with UV light; EEPROM can be electrically erased byte-by-byte; Flash memory (used in SSDs and USB drives) is a form of EEPROM that erases in blocks. Memory arrays are organized with address decoders selecting word lines, bit lines carrying data, and sense amplifiers detecting the small voltage differences during reads. -- H&H 10.5

### Topic 7: Practical Sequential Design

Metastability is the dark side of sequential logic. When a flip-flop's setup or hold time is violated, the output can enter a metastable state -- neither a solid 0 nor a solid 1 -- and may take an arbitrarily long time to resolve. This is especially dangerous when sampling asynchronous signals (like a button press or data from a different clock domain). The standard cure is a synchronizer: two or more flip-flops in series, giving the first flip-flop time to resolve before the second one samples. Mechanical switch bouncing (multiple transitions from a single press) is handled by a debounce circuit: an SR latch or a shift register that waits for stable input. Reset strategies matter: synchronous reset (sampled on clock edge) prevents metastability but requires a running clock; asynchronous reset (immediate) works without a clock but can cause metastability if deasserted near a clock edge. Power-on reset circuits ensure the system starts in a known state. Glitch-free design avoids combinational logic on outputs that could produce transient incorrect values between clock edges. -- H&H 10.4-10.5

## Learn Mode Depth Markers

### Level 1: Practical

> A flip-flop remembers one bit. It captures input on a clock edge and holds it until the next edge. Registers are groups of flip-flops that store multi-bit values. -- H&H 10.3

> A counter increments on each clock pulse. Ripple counters are simple but slow; synchronous counters update all bits simultaneously for higher speed. -- H&H 10.4

### Level 2: Reference

> See H&H 10.3 for SR, JK, and D flip-flop operation and timing constraints (setup, hold, propagation). Sections 10.4-10.5 cover counters, shift registers, and finite state machine design. -- H&H 10.3

### Level 3: Mathematical

> Maximum clock frequency: f_max = 1/(t_cq + t_comb + t_setup). Ripple counter delay: t_total = N * t_pd. State encoding: log2(N) flip-flops for N states. Counter modulus: 2^n for n-bit binary counter. -- H&H 10.4
