---
exercise: 3
title: "Memory and Arithmetic"
slug: calculator
chapter: 3
difficulty: intermediate
programSlug: calculator
description: "Add two numbers from erasable memory and display the result"
---

# Exercise 3: Memory and Arithmetic -- Calculator

## Overview

This exercise demonstrates the AGC's arithmetic and memory operations. You
will add two numbers stored in memory, store the result, and display it on
the DSKY. Along the way, you will learn about ones' complement addition and
the TS overflow skip.

## Prerequisites

- Chapter 3: Instruction Set (CA, AD, TS, ones' complement arithmetic)
- Chapter 4: Assembly (DEC, ERASE, labels)
- Exercise 1: Hello DSKY (I/O channel writes)

## The Program

Open `programs/calculator.agc`:

```agc
# Calculator -- add two numbers
SETLOC   4000

CALC     CA     OPERAND1     # Load first operand
         AD     OPERAND2     # Add second operand
         TS     RESULT       # Store sum
         EXTEND
         WRITE  10           # Display on R1
         TC     DONE

DONE     TC     DONE         # Halt

OPERAND1 DEC    25
OPERAND2 DEC    37
RESULT   ERASE
```

## Step-by-Step Walkthrough

### Step 1: Trace the arithmetic

| Step | Instruction | A Register | Memory |
|------|-------------|------------|--------|
| 1 | CA OPERAND1 | 25 | -- |
| 2 | AD OPERAND2 | 25 + 37 = 62 | -- |
| 3 | TS RESULT | 62 | RESULT = 62 |
| 4 | EXTEND | 62 | -- |
| 5 | WRITE 10 | 62 | channel 10 = 62 |
| 6 | TC DONE | 62 | -- |

### Step 2: Understand ones' complement addition

The AGC uses ones' complement arithmetic. For positive numbers like 25 and
37, addition works the same as in two's complement (or regular decimal):

```
25 = 0 000 000 011 001  (15-bit binary)
37 = 0 000 000 100 101
───────────────────────
62 = 0 000 000 111 110
```

No overflow, no end-around carry. Simple.

### Step 3: Run and verify

```typescript
const source = readFileSync('src/agc/curriculum/programs/calculator.agc', 'utf-8');
const program = assembleProgramSource(source);
const result = runProgram(program, { maxSteps: 100 });

const writes = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
console.log(`Sum displayed: ${writes[0]?.value}`);
// Expected: 62
```

### Step 4: Understand TS overflow handling

The TS instruction has a special behavior: if A has overflowed (bit 15 is
set), TS stores the corrected value AND **skips the next instruction**. This
is how the AGC handles overflow:

```agc
         AD     HUGE         # A might overflow
         TS     RESULT       # Store. If overflow: skip next, A=corrected
         TC     NORMAL       # Reached only if NO overflow
         # This line reached only on overflow
         TC     OVERFLOW     # Handle overflow case
```

In our calculator, 25 + 37 = 62, which is well within the 15-bit range
(max +16,383), so no overflow occurs.

## Expected Output

- The program runs for approximately 6-8 steps
- Channel 10 receives a write with value 62
- Halts with "TC to self (busy loop)"

## Try It

1. **Subtract**: Use CS (Clear and Subtract) to compute OPERAND1 - OPERAND2:
   ```agc
   CALC     CS     OPERAND2     # Load complement of OPERAND2
            AD     OPERAND1     # Add OPERAND1 (= OPERAND1 - OPERAND2)
            TS     RESULT
   ```

2. **Multiply**: Use EXTEND + MP to multiply:
   ```agc
   CALC     CA     OPERAND1
            EXTEND
            MP     OPERAND2     # Product in A:L
            TS     RESULT       # Store high word of product
   ```

3. **Handle overflow**: Set OPERAND1 to 16000 and OPERAND2 to 1000. The sum
   (17000) exceeds +16383 and will overflow. Observe that TS skips the next
   instruction.

4. **Three-way add**: Add three numbers by chaining AD instructions:
   ```agc
   CALC     CA     OP1
            AD     OP2
            AD     OP3
            TS     RESULT
   ```

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Wrong sum | DEC vs OCT confusion | Use DEC for decimal values |
| Sum is 0 | ERASE label not used correctly | Check RESULT is ERASE |
| No I/O write | Forgot EXTEND before WRITE | Add EXTEND line |
| Unexpected value | Overflow correction by TS | Check if sum > 16383 |
