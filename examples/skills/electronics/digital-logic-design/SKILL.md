---
name: digital-logic-design
description: Design and analysis of combinational and sequential digital circuits using Boolean algebra, truth tables, K-maps, CMOS gate implementation, flip-flops, registers, counters, and finite state machines. Covers De Morgan's theorems, canonical sum-of-products and product-of-sums forms, minimization techniques, propagation delay, setup and hold times, metastability, synchronous design discipline, and FSM encoding. Use when designing, minimizing, verifying, or debugging any circuit whose signals take only discrete logic values.
type: skill
category: electronics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/skills/electronics/digital-logic-design/SKILL.md
superseded_by: null
---
# Digital Logic Design

Digital logic is the subset of electronics where signal values are restricted to a small number of discrete levels (usually two: logic 0 and logic 1). This restriction buys enormous simplification — Boolean algebra replaces differential equations, truth tables replace transfer functions — at the cost of needing to worry about timing, glitches, metastability, and the difference between what the logic says and what the silicon actually does. This skill covers combinational and sequential design in the order a designer typically needs them.

**Agent affinity:** kilby (integrated logic and gate-level implementation), noyce (planar process and mass production of logic families)

**Concept IDs:** elec-combinational-logic, elec-sequential-logic-design

## Boolean Algebra

Digital logic rests on Boolean algebra, where variables take values in {0, 1} and three operations dominate: AND (conjunction, written A * B or A∧B), OR (disjunction, A + B or A∨B), and NOT (negation, A' or ¬A). Several identities make manipulation tractable:

| Identity | Name |
|---|---|
| A + 0 = A, A * 1 = A | Identity |
| A + 1 = 1, A * 0 = 0 | Domination |
| A + A = A, A * A = A | Idempotent |
| (A')' = A | Double negation |
| A + A' = 1, A * A' = 0 | Complement |
| A + B = B + A, A * B = B * A | Commutative |
| (A + B) + C = A + (B + C) | Associative |
| A * (B + C) = A*B + A*C | Distributive |
| (A + B)' = A' * B' | De Morgan |
| (A * B)' = A' + B' | De Morgan |

De Morgan's theorems are the lever that converts NAND-only gate sets to full Boolean expressiveness and back. In CMOS, NAND and NOR are the natural primitives because they come for free from the complementary pull-up/pull-down network.

## Technique 1 — Truth Tables and Canonical Forms

**Truth table.** Exhaustively list every input combination and the desired output. For n inputs there are 2^n rows.

**Sum of products (SoP).** Write the function as the OR of all minterms (product terms) corresponding to rows where the output is 1. Example: F(A, B, C) = A'BC + AB'C + ABC'.

**Product of sums (PoS).** Write the function as the AND of all maxterms (sum terms) corresponding to rows where the output is 0, with each variable negated.

**Worked example.** A three-input majority function has output 1 when at least two inputs are 1. Truth table:

| A | B | C | F |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 0 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 1 |

The SoP is F = A'BC + AB'C + ABC' + ABC, which simplifies to AB + AC + BC.

## Technique 2 — Karnaugh Map (K-map) Minimization

A K-map is a two-dimensional arrangement of a truth table where physically adjacent cells differ in exactly one variable. Groups of 1s in powers of two (1, 2, 4, 8...) correspond to product terms where the variables that change within the group drop out.

**Procedure.** Draw the K-map, circle the largest possible groups of 1s that cover every 1 exactly (groups may overlap and may wrap around edges), write each group as a product term, OR them together.

**Worked example (majority function above).** The K-map has four 1s at (ABC) = 011, 101, 110, 111. The groupings produce AB, AC, and BC. The minimal SoP is F = AB + AC + BC — confirming the algebraic simplification above.

**Limits.** K-maps become impractical above five variables. For larger functions use the Quine-McCluskey tabular method or hand it to a synthesis tool.

## Technique 3 — CMOS Gate Implementation

In CMOS, every gate has a complementary pull-up (PMOS) and pull-down (NMOS) network. The pull-down conducts when the pull-up does not, and vice versa, so the output is always connected to either V_DD or GND through a low-resistance path (except during transitions). Static power is near zero — dynamic power dominates, set by C * V^2 * f.

**NAND gate.** Two PMOS in parallel pull up, two NMOS in series pull down. Output is LOW only when both inputs are HIGH.

**NOR gate.** Two PMOS in series pull up, two NMOS in parallel pull down. Output is LOW if either input is HIGH.

**Why NAND and NOR are preferred.** Inverting gates are structurally natural in CMOS. An AND gate is a NAND followed by an inverter — two levels of logic for what could have been one. Good synthesis tools automatically convert AND/OR expressions to NAND/NOR.

## Technique 4 — Combinational Building Blocks

| Block | Function | Typical use |
|---|---|---|
| Multiplexer | Select one of N inputs based on select lines | Data path routing, ROM readout |
| Decoder | One-hot output indicating which of N states is active | Address decoding, FSM state output |
| Encoder | Priority encoding of one-hot input to binary | Interrupt priority, keypad scanning |
| Adder | Binary addition with carry propagation | Arithmetic unit core |
| Comparator | Output 1 if A > B, A = B, or A < B | Sorting, control logic |
| Parity generator | XOR tree producing even or odd parity | Error detection |

These blocks are the lego bricks of digital design. Most real circuits are compositions of multiplexers and decoders with a sprinkle of arithmetic.

## Technique 5 — Flip-Flops and Registers

**D flip-flop.** On the active edge of the clock, captures the value at the D input and holds it on Q until the next active edge. The most commonly used sequential primitive.

**JK flip-flop.** Extension of SR latch that toggles when both J and K are high. Rarely used in modern design; D flip-flops plus combinational feedback can express the same behavior.

**Register.** An array of D flip-flops sharing a common clock, used to hold a multi-bit value.

**Setup and hold times.** A flip-flop requires its input to be stable for t_setup before the clock edge and t_hold after. Violating either causes metastability — the output takes an unbounded time to settle to a valid logic level. This is the central timing constraint in synchronous design.

**Propagation delay.** After the clock edge, the output takes t_CQ to reflect the captured value. All timing budgets are sums of t_CQ + combinational delay + t_setup, which must be less than the clock period.

## Technique 6 — Finite State Machines

**Definition.** A finite state machine has a finite set of states, a set of input signals, a transition function from (state × inputs) to next state, and an output function from state (Moore) or (state × inputs) (Mealy).

**Design procedure.**

1. Identify the states.
2. Draw a state transition diagram.
3. Encode the states in binary (binary, one-hot, gray code, etc.).
4. Write the next-state logic as a combinational block.
5. Write the output logic.
6. Implement state registers as D flip-flops.

**State encoding trade-offs:**

| Encoding | Bits for N states | Next-state complexity | Output complexity |
|---|---|---|---|
| Binary | ceil(log2(N)) | Complex | Complex |
| One-hot | N | Simple | Simple |
| Gray | ceil(log2(N)) | Medium | Complex |

One-hot is usually preferred for FPGAs (flip-flops are cheap) and binary for ASICs (routing and area matter). The reason Kilby's original integrated circuit mattered so much is that these trade-offs only became economic when hundreds of gates per chip were possible.

## Technique 7 — Synchronous Design Discipline

The single most important rule in practical digital design: **every flip-flop in the system should be clocked by the same clock signal**, or by clock signals derived from a common root through known-good synchronization paths.

**Why.** Multiple independent clocks create clock domain crossings where metastability can occur. Asynchronous resets create their own release-time issues. Gated clocks hide timing from the synthesis tool.

**The synchronous discipline:**

1. One clock domain unless absolutely necessary.
2. Synchronize any asynchronous input with at least two flip-flops in series (double-flopping).
3. Use synchronous reset rather than asynchronous where possible.
4. Do not gate clocks in RTL; let the synthesis tool insert clock gates if power demands it.
5. Make every FSM have a defined reset state.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Combinational loop | Latches form; timing indeterminate | Break the loop with a flip-flop |
| Missing else branch in RTL | Unintended latch inferred | Always assign every signal in every path |
| Asynchronous handshakes without synchronizers | Metastability propagates | Double-flop the incoming signal |
| State machines with undefined reachable states | Hangs after power-up glitch | Define a default next-state assignment |
| Gated clocks in RTL | Synthesis complications, timing violations | Use clock-enable inputs instead |
| Mixing blocking and nonblocking assignments | Race conditions in simulation | Blocking for combinational, nonblocking for sequential |
| Depending on propagation delay for pulse width | Varies with process, voltage, temperature | Generate pulse widths with counters |

## Cross-References

- **microcontroller-firmware skill:** Uses digital logic results inside the MCU — GPIO, PWM, UART, SPI, I2C are all synchronous FSMs internally.
- **kilby agent:** Primary agent for integrated circuit topology and logic family questions.
- **noyce agent:** Primary agent for monolithic process and practical fabrication questions.
- **signal-processing-dsp-basics skill:** Takes digital values and processes them as samples of a continuous signal.

## References

- Harris, D. & Harris, S. (2022). *Digital Design and Computer Architecture*. 3rd ed. Morgan Kaufmann.
- Wakerly, J. F. (2018). *Digital Design: Principles and Practices*. 5th ed. Pearson.
- Mano, M. M. & Ciletti, M. D. (2018). *Digital Design*. 6th ed. Pearson.
- Horowitz, P. & Hill, W. (2015). *The Art of Electronics*. 3rd ed. Cambridge University Press, chapters 10-11.
- Kilby, J. S. (1976). "Invention of the integrated circuit." *IEEE Transactions on Electron Devices*, 23(7), 648-654.
