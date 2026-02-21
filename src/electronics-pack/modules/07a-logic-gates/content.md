# Module 7A: Logic Gates

> **Tier**: 3 | **H&H Reference**: 10.1-10.2 | **Safety Mode**: Annotate

## Overview

Digital logic is the bridge between the analog world of voltages and currents and the abstract world of computation. While Tiers 1 and 2 dealt with continuous quantities -- voltage dividers, RC time constants, op-amp gain -- digital electronics reduces everything to two discrete states: HIGH (logic 1) and LOW (logic 0). This simplification is what makes digital systems robust against noise and manufacturing variation. -- H&H 10.1

Logic gates are the fundamental building blocks of all digital systems, from simple combinational circuits to billion-transistor microprocessors. Each gate implements a Boolean function: it takes one or more binary inputs and produces a binary output according to a fixed truth table. Understanding gate behavior, Boolean algebra, and combinational design is essential before progressing to sequential logic (flip-flops, counters) and programmable devices. -- H&H 10.1

At the physical level, modern logic gates are built from CMOS (Complementary Metal-Oxide-Semiconductor) transistors. Every CMOS gate uses a complementary pair of networks: a PMOS pull-up network that connects the output to VDD when the output should be HIGH, and an NMOS pull-down network that connects the output to ground when the output should be LOW. This complementary structure means zero static power consumption in either logic state -- power is only consumed during switching transitions. -- H&H 10.2

## Topics

### 1. Binary Number System

Digital systems represent information using binary digits (bits). A single bit can be 0 or 1. Groups of 8 bits form a byte (0-255). Binary numbers use positional notation with base 2, while hexadecimal (base 16) provides a compact representation where each hex digit maps to exactly 4 bits. For example, binary 1010_1100 = hex AC = decimal 172. -- H&H 10.1

### 2. Boolean Algebra

Boolean algebra operates on binary variables using three fundamental operations: AND (conjunction, written AB or A*B), OR (disjunction, written A+B), and NOT (complement, written A' or ~A). These operations satisfy familiar algebraic laws -- commutative, associative, distributive -- plus unique Boolean identities like A+A'=1, A*A'=0, and A+AB=A. Truth tables enumerate all possible input combinations and their outputs, providing a complete specification of any Boolean function. -- H&H 10.1

### 3. Logic Gate Types

The eight fundamental gate types are:
- **AND**: Output HIGH only when ALL inputs are HIGH
- **OR**: Output HIGH when ANY input is HIGH
- **NOT** (Inverter): Output is complement of input
- **NAND**: NOT-AND -- output LOW only when all inputs HIGH
- **NOR**: NOT-OR -- output LOW when any input HIGH
- **XOR**: Exclusive-OR -- output HIGH when inputs differ
- **XNOR**: Exclusive-NOR -- output HIGH when inputs are equal
- **BUF** (Buffer): Output equals input, provides drive strength

Each gate has a standard IEEE/IEC symbol and a characteristic truth table. NAND and NOR are called universal gates because any Boolean function can be implemented using only NAND gates (or only NOR gates). -- H&H 10.1

### 4. CMOS Gate Construction

CMOS gates use complementary MOSFET networks. The PMOS pull-up network connects the output to VDD (logic HIGH), and the NMOS pull-down network connects the output to GND (logic LOW). The networks are complementary: when one conducts, the other does not, ensuring a low-impedance path to either supply rail.

For a CMOS NAND gate: the PMOS transistors are connected in **parallel** (either input LOW pulls the output HIGH), while the NMOS transistors are connected in **series** (both inputs must be HIGH to pull the output LOW). A 2-input NAND uses 4 MOSFETs total (2 PMOS + 2 NMOS). For N inputs: 2N MOSFETs.

For a CMOS NOR gate: the topology is reversed -- PMOS in **series**, NMOS in **parallel**. AND and OR gates require an additional inverter stage (6 MOSFETs for 2-input). -- H&H 10.2

### 5. De Morgan's Laws

De Morgan's laws provide the fundamental relationship between AND and OR operations through complementation:

- **First law**: NOT(A AND B) = NOT(A) OR NOT(B) -- equivalently, (AB)' = A' + B'
- **Second law**: NOT(A OR B) = NOT(A) AND NOT(B) -- equivalently, (A+B)' = A'B'

These laws are essential for gate conversion (NAND = bubbled OR, NOR = bubbled AND), Boolean simplification, and understanding why NAND and NOR are universal gates. They extend naturally to N inputs. -- H&H 10.1

### 6. Boolean Simplification

Simplifying Boolean expressions reduces gate count, which saves area, power, and propagation delay. Key techniques include:

- **Algebraic identities**: Apply Boolean laws systematically (e.g., AB + AB' = A(B+B') = A)
- **Karnaugh maps (K-maps)**: Visual method for 2-4 variable functions. Adjacent cells in a K-map differ by one variable, allowing groupings of 1s to be read as simplified product terms. Groups must be rectangular and have power-of-2 size (1, 2, 4, 8 cells).
- **Don't-care conditions**: Input combinations that cannot occur can be treated as either 0 or 1, whichever yields better simplification.

For functions with more than 4 variables, the Quine-McCluskey algorithm provides a systematic tabular approach. -- H&H 10.1

### 7. Combinational Building Blocks

Standard combinational circuits built from logic gates include:

- **Half adder**: XOR for sum, AND for carry (2 inputs, no carry-in)
- **Full adder**: Adds three bits (A, B, carry-in) producing sum and carry-out. Uses 2 XOR, 2 AND, 1 OR gate.
- **Ripple-carry adder**: N full adders cascaded, with each carry-out feeding the next carry-in. Simple but slow (carry must ripple through all N stages).
- **Multiplexer (MUX)**: Routes one of 2^N data inputs to output based on N select lines. A 4-to-1 MUX uses AND/OR/NOT gates.
- **Decoder**: Activates exactly one of 2^N outputs based on N-bit input. A 2-to-4 decoder uses AND/NOT gates.
- **Encoder**: Reverse of decoder -- converts 2^N input lines to N-bit output. -- H&H 10.1

### 8. Propagation Delay and Timing

Every logic gate introduces a propagation delay (t_pd) between input change and output response. Typical values range from sub-nanosecond (modern CMOS) to tens of nanoseconds (older technologies).

- **Critical path**: The longest combinational delay through a circuit determines maximum operating frequency: f_max = 1 / t_critical_path
- **Setup time (t_su)**: How long data must be stable BEFORE the clock edge
- **Hold time (t_h)**: How long data must remain stable AFTER the clock edge
- **Clock-to-Q (t_cq)**: Delay from clock edge to valid flip-flop output

In a ripple-carry adder, the critical path runs through all N carry stages: t_critical = N * t_pd_carry. This is why carry-lookahead and carry-select adders exist -- they trade area for speed. -- H&H 10.2

### 9. Power Consumption

CMOS power has two components:

- **Static power**: Leakage current when gates are not switching. P_static = I_leak * V_DD. Negligible in older technologies but significant at nanometer scales.
- **Dynamic power**: Consumed during switching transitions as load capacitance charges/discharges. P_dynamic = C_L * V_DD^2 * f, where C_L is load capacitance, V_DD is supply voltage, and f is switching frequency.

Reducing V_DD is the most effective way to cut dynamic power (quadratic dependence), but it reduces noise margins and increases gate delay. This voltage-speed-power tradeoff is fundamental to digital design. -- H&H 10.2

### 10. Universal Gates

NAND and NOR are called universal gates because any Boolean function can be implemented using only one type:

- **NOT from NAND**: Connect both inputs together: NAND(A, A) = NOT(A)
- **AND from NAND**: NAND followed by NOT (another NAND with tied inputs)
- **OR from NAND**: NOT each input, then NAND the results (De Morgan's)

Similarly, NOR can implement NOT, OR, and AND. In practice, NAND gates are preferred in CMOS because NMOS transistors (used in the series pull-down) are faster than PMOS transistors, and NAND's series path is in the pull-down network. This is why NAND flash memory, NAND-based logic synthesis, and standard cell libraries are NAND-centric. -- H&H 10.1

## Learn Mode Depth Markers

### Level 1: Practical

> Digital logic has only two states: HIGH (1) and LOW (0). Gates combine inputs using AND, OR, NOT rules. Any logic function can be built from NAND gates alone. -- H&H 10.1

> CMOS gates use complementary MOSFET pairs: when the output is HIGH, the pull-up network is on and pull-down is off, and vice versa. No static power consumption in either state. -- H&H 10.2

### Level 2: Reference

> See H&H 10.1 for Boolean algebra, truth tables, De Morgan's laws, and canonical forms (SOP/POS). Section 10.2 covers CMOS gate implementation, propagation delay, fan-out, and noise margins. -- H&H 10.1

### Level 3: Mathematical

> Boolean identities: A + A'B = A + B, (A+B)' = A'B' (De Morgan). Propagation delay: t_pd = 0.7*R*C per stage. Dynamic power: P = C_L * V_DD^2 * f. NAND transistor count: 2N MOSFETs for N inputs. -- H&H 10.2
