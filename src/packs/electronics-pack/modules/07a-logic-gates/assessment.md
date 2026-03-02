# Module 7A: Logic Gates -- Assessment

> 5 questions testing understanding, not memorization

## Questions

### Q1: Boolean Simplification

Simplify the following Boolean expression using algebraic identities or a Karnaugh map:

**F(A, B, C) = A'BC + AB'C + ABC' + ABC**

Express the simplified result in sum-of-products (SOP) form.

---

### Q2: CMOS Gate Construction

How many MOSFETs are required to build a 3-input NAND gate in CMOS technology?

Draw or describe the pull-up and pull-down networks, identifying which transistor type (PMOS or NMOS) is used in each network and how they are connected (series or parallel).

---

### Q3: De Morgan's Theorem

Convert the following NOR-based expression into an equivalent AND/NOT form using De Morgan's laws:

**Y = (A + B)' + (C + D)'**

Show each step of the conversion.

---

### Q4: Combinational Circuit Design

Design a combinational logic circuit using AND, OR, and NOT gates that implements the following truth table:

| A | B | C | Y |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 1 |
| 0 | 1 | 0 | 0 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 1 |

Write the Boolean expression and identify any simplification opportunities.

---

### Q5: Timing Analysis

A combinational circuit consists of 3 levels of logic:
- Level 1: Two 2-input AND gates (t_pd = 8ns each)
- Level 2: One 2-input OR gate (t_pd = 10ns)
- Level 3: One NOT gate (t_pd = 5ns)

The circuit feeds into a D flip-flop with setup time t_su = 3ns and clock-to-Q delay t_cq = 6ns.

(a) What is the total propagation delay of the combinational logic (critical path)?

(b) What is the maximum clock frequency at which this circuit can operate reliably?

(c) If the AND gate delay is reduced to 5ns (by using a faster technology), what is the new maximum clock frequency?

---

## Answer Key

### Q1 Answer

**Step-by-step algebraic simplification:**

F = A'BC + AB'C + ABC' + ABC

Group the last two terms:
F = A'BC + AB'C + AB(C' + C)
F = A'BC + AB'C + AB * 1
F = A'BC + AB'C + AB

Group the first and third terms:
F = B(A'C + A) + AB'C
F = B(A + C) + AB'C       [using A + A'C = A + C]
F = AB + BC + AB'C

Factor the first and third terms:
F = A(B + B'C) + BC
F = A(B + C) + BC          [using B + B'C = B + C]
F = AB + AC + BC

**Simplified result: F = AB + AC + BC** (majority function) -- H&H 10.1 (Boolean algebra and Karnaugh maps)

**K-map verification** (3-variable):
```
      BC
AB  00  01  11  10
 0 | 0 | 0 | 1 | 0 |
 1 | 0 | 1 | 1 | 1 |
```
Groups: AB (row 1, columns 11+10), BC (columns 11, both rows), AC (row 1, columns 01+11).

---

### Q2 Answer

A 3-input NAND gate requires **6 MOSFETs** (3 PMOS + 3 NMOS).

**Pull-up network (PMOS):** 3 PMOS transistors connected in **parallel** between VDD and output. If ANY input is LOW, its PMOS conducts and pulls the output HIGH.

**Pull-down network (NMOS):** 3 NMOS transistors connected in **series** between output and GND. ALL three inputs must be HIGH for all NMOS to conduct and pull the output LOW.

General formula: An N-input NAND gate uses 2N MOSFETs (N PMOS parallel + N NMOS series). -- H&H 10.2 (CMOS gate construction)

---

### Q3 Answer

**Starting expression:** Y = (A + B)' + (C + D)'

**Step 1:** Apply De Morgan's law to each term:
- (A + B)' = A'B'  [De Morgan: NOT(OR) = AND of NOTs]
- (C + D)' = C'D'

**Step 2:** Substitute back:
Y = A'B' + C'D'

**Result in AND/NOT form:** Y = A'B' + C'D'

This reads as: "Y is HIGH when both A and B are LOW, or when both C and D are LOW." -- H&H 10.1 (De Morgan's theorem)

---

### Q4 Answer

**Reading minterms from the truth table** (rows where Y=1):
- Row 001: A'B'C (minterm 1)
- Row 011: A'BC (minterm 3)
- Row 101: AB'C (minterm 5)
- Row 110: ABC' (minterm 6)
- Row 111: ABC (minterm 7)

**Unsimplified SOP:** Y = A'B'C + A'BC + AB'C + ABC' + ABC

**K-map simplification:**
```
      BC
AB  00  01  11  10
 0 | 0 | 1 | 1 | 0 |
 1 | 0 | 1 | 1 | 1 |
```

Groups:
- Column C=1 (all 4 cells in columns 01 and 11 where C=1): gives **C**
- Cell 110 (AB, C=0): gives **AB**

**Simplified result: Y = C + AB** -- H&H 10.1 (combinational circuit design and K-map simplification)

**Circuit:** One AND gate (A AND B), one OR gate (AND_output OR C). Total: 2 gates.

---

### Q5 Answer

**(a) Critical path delay:**

The critical path is the longest delay path through the combinational logic:
- Level 1 (AND): 8ns
- Level 2 (OR): 10ns
- Level 3 (NOT): 5ns
- **Total: t_pd = 8 + 10 + 5 = 23ns**

**(b) Maximum clock frequency:**

The clock period must accommodate: t_cq + t_pd + t_su
- T_min = t_cq + t_pd + t_su = 6 + 23 + 3 = 32ns
- **f_max = 1 / T_min = 1 / 32ns = 31.25 MHz**

**(c) With faster AND gates (5ns):**

New critical path: 5 + 10 + 5 = 20ns
- T_min = 6 + 20 + 3 = 29ns
- **f_max = 1 / 29ns = 34.48 MHz**

The 3ns reduction in AND gate delay yields a 3.23 MHz improvement (10.3% faster clock). -- H&H 10.2 (propagation delay and timing analysis)
