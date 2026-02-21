# Module 8: Sequential Logic -- Assessment

> 5 questions testing understanding, not memorization

## Questions

## Question 1: Latches vs. Flip-Flops

Explain the difference between a latch and a flip-flop. Why is edge-triggering preferred over level-sensitive operation in synchronous digital systems?

## Question 2: Counter Frequency Division

A synchronous 4-bit binary counter is clocked at 10 MHz. What is the frequency at the Q3 output (MSB)? How long does one complete count cycle (0 to 15 and back to 0) take?

## Question 3: Modulo-6 Counter Design

Design a modulo-6 counter (counts 0, 1, 2, 3, 4, 5, then back to 0). How many flip-flops do you need? What reset logic is required?

## Question 4: Sequence Detector

Draw the state diagram for a simple sequence detector that outputs 1 when it sees the pattern "101" in a serial bit stream. Is this a Moore or Mealy machine? How many states are needed?

## Question 5: SRAM vs. DRAM Tradeoffs

An SRAM cell uses 6 transistors per bit while a DRAM cell uses only 1 transistor and 1 capacitor. Why is SRAM still used for CPU caches despite being less dense? What tradeoff does DRAM make for higher density?

## Answer Key

### Answer 1: Latches vs. Flip-Flops

A **latch** is level-sensitive: its output follows the input whenever the enable signal is active (high or low depending on design). A **flip-flop** is edge-triggered: it samples the input only at the precise moment of a clock transition (rising or falling edge) and holds its output between edges.

Edge-triggering is preferred because it eliminates **transparency problems**. In a level-sensitive latch, data can "race through" multiple stages during a single clock phase, causing unpredictable behavior. With edge-triggering, each flip-flop captures data once per clock cycle at a well-defined instant, making it possible to chain stages in a pipeline without data racing from input to output in a single cycle. This predictable timing is the foundation of synchronous design methodology. -- H&H 10.3

### Answer 2: Counter Frequency Division

Each bit of a binary counter divides the clock frequency by 2. The Q0 output (LSB) runs at 10 MHz / 2 = 5 MHz. The Q3 output (MSB) divides the clock by 2^4 = 16:

**Q3 frequency = 10 MHz / 16 = 625 kHz**

One complete count cycle goes from 0 to 15 and back to 0, which takes exactly 16 clock periods:

**Cycle time = 16 / 10 MHz = 16 x 100 ns = 1.6 microseconds**

The Q3 output completes one full period (high for 8 clocks, low for 8 clocks) in this 1.6 us cycle. -- H&H 10.4

### Answer 3: Modulo-6 Counter Design

A modulo-6 counter needs to represent states 0 through 5, which requires **3 flip-flops** (since 2 flip-flops can only represent 4 states, and ceil(log2(6)) = 3).

The counter counts normally from 000 (0) through 101 (5). When it reaches state 5 (101), the **reset logic** must detect this state and force the counter back to 000 on the next clock edge.

Reset logic: Detect state 110 (which would be the natural next state after 101) using an AND gate on Q2 and Q1 (with Q0 don't-care since 110 always follows 101 in a binary counter). When Q2=1 AND Q1=1, assert synchronous reset to all three flip-flops.

Alternatively, detect state 101 (binary 5) and load 000 on the next clock edge using the counter's synchronous load capability. The key is that the counter never actually displays state 6 or 7 -- it resets before (or as soon as) the invalid state appears. -- H&H 10.4

### Answer 4: Sequence Detector

This is best implemented as a **Mealy machine** for minimum states, since the output depends on both the current state and the current input (the final '1' in "101").

**States needed: 3** (plus initial state = 4 total):

- **S0** (idle): No part of pattern matched. If input=1, go to S1. If input=0, stay in S0.
- **S1** (seen "1"): First '1' matched. If input=0, go to S2. If input=1, stay in S1 (could be start of new pattern).
- **S2** (seen "10"): First two bits matched. If input=1, go to S1 and **output=1** (pattern "101" detected). If input=0, go to S0.

A Moore version would need one extra state (S3 for the output state), requiring **4 states** total, since outputs must be associated with states, not transitions.

The Mealy version detects the pattern one clock cycle earlier than the Moore version because it can assert the output during the transition rather than waiting for the next state. -- H&H 10.5

### Answer 5: SRAM vs. DRAM Tradeoffs

SRAM is used for CPU caches despite lower density because of three critical advantages:

1. **Speed**: SRAM access time is typically 1-2 nanoseconds, while DRAM takes 50-100 nanoseconds. CPU caches must keep up with processor clock speeds (GHz), and only SRAM is fast enough for L1/L2 cache.

2. **No refresh needed**: SRAM holds its data as long as power is applied (the cross-coupled inverters maintain state through positive feedback). DRAM capacitors leak charge and must be refreshed every ~64 milliseconds, which consumes bandwidth and power, and adds complexity.

3. **Simpler interface**: SRAM is truly random access with no refresh controller, no precharge delays, and no row/column multiplexing. This simpler interface means fewer cycles wasted on overhead.

**DRAM's tradeoff for higher density**: By using just 1 transistor + 1 capacitor per bit instead of SRAM's 6 transistors, DRAM achieves roughly 4-6x the density. But the capacitor's tiny charge (femtocoulombs) means slow reads (the sense amplifier must detect a tiny voltage change), destructive reads (the capacitor discharges during read and must be rewritten), and the need for periodic refresh. DRAM trades speed and simplicity for density, which is why it serves as main memory (gigabytes at reasonable cost) while SRAM serves as cache (megabytes at high speed). -- H&H 10.5
