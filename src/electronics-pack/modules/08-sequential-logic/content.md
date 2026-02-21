# Module 8: Sequential Logic

> **Tier**: 3 | **H&H Reference**: 10.3-10.5 | **Safety Mode**: Annotate

## Overview

[To be implemented in Phase 272]

## Topics

[Topic list placeholder]

## Learn Mode Depth Markers

### Level 1: Practical

> A flip-flop remembers one bit. It captures input on a clock edge and holds it until the next edge. Registers are groups of flip-flops that store multi-bit values. -- H&H 10.3

> A counter increments on each clock pulse. Ripple counters are simple but slow; synchronous counters update all bits simultaneously for higher speed. -- H&H 10.4

### Level 2: Reference

> See H&H 10.3 for SR, JK, and D flip-flop operation and timing constraints (setup, hold, propagation). Sections 10.4-10.5 cover counters, shift registers, and finite state machine design. -- H&H 10.3

### Level 3: Mathematical

> Maximum clock frequency: f_max = 1/(t_cq + t_comb + t_setup). Ripple counter delay: t_total = N * t_pd. State encoding: log2(N) flip-flops for N states. Counter modulus: 2^n for n-bit binary counter. -- H&H 10.4
