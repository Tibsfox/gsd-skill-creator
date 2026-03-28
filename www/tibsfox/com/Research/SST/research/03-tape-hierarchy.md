# Module 3: Tape-Length Hierarchy

## The Chomsky Hierarchy (1956--1963)

Noam Chomsky's hierarchy classifies formal languages by the computational resources required to recognize them:

| Type | Language Class | Recognizer | Tape Resource |
|------|---------------|-----------|---------------|
| 0 | Recursively Enumerable | Turing machine | Infinite tape |
| 1 | Context-Sensitive | Linear bounded automaton | Tape proportional to input |
| 2 | Context-Free | Pushdown automaton | Stack (LIFO tape) |
| 3 | Regular | Finite automaton | No tape |

*Source: Chomsky, "Three Models for the Description of Language" (1956)*

Each level is a **strict subset** of the one above: every regular language is context-free, every context-free language is context-sensitive, every context-sensitive language is recursively enumerable. The reverse is false at every level.

## Linear Bounded Automata

John Myhill introduced the deterministic linear bounded automaton (LBA) in 1960 as a Turing machine restricted to the portion of tape occupied by the input. In 1963, Peter Landweber proved that deterministic LBAs recognize exactly the **context-sensitive languages** (Type 1 in the Chomsky hierarchy).

An LBA with *q* states, *m* tape symbols, and input length *n* can be in at most:

```
q × n × m^n
```

distinct configurations. This quantity is finite for any fixed *n*, meaning that for each specific input, the LBA behaves as a finite automaton: its behavior is enumerable and its halting problem is decidable.

*Source: Wikipedia, "Linear Bounded Automaton" (2026); GeeksforGeeks, "Introduction to LBA" (2021)*

### Endmarker Constraints

The LBA uses special endmarker symbols to prevent the head from moving beyond the input boundaries. These endmarkers are the physical mechanism that enforces the tape bound -- they are the walls of the computation's working memory.

## The LBA Open Problem

Whether nondeterministic LBAs (NLBAs) are strictly more powerful than deterministic LBAs (DLBAs) remains an **open problem**. This is analogous in structure to P vs. NP but for context-sensitive languages:

- NLBAs can recognize all context-sensitive languages (proven)
- DLBAs can recognize all context-sensitive languages (proven by Kuroda, 1964)
- Whether DLBA = NLBA in terms of efficiency/time is unknown

The question is: does nondeterminism buy you anything when your tape is already bounded? For unbounded-tape machines, the answer is definitively no (every nondeterministic TM has a deterministic equivalent). For bounded-tape machines, we don't know.

## The Configuration Space Argument

The fundamental reason bounded tape implies bounded power is the configuration counting argument:

1. Let M be any machine with *q* states, *m* tape symbols, tape bounded to *k* cells.
2. The total number of distinct configurations of M is at most `C = q × m^k × k` -- a finite number.
3. If M runs for more than C steps without halting, it must revisit a configuration.
4. A revisited configuration implies an infinite loop: M will never halt from that configuration.
5. Therefore, halting is **decidable** for any bounded-tape M: simulate for C+1 steps and check.

This argument is elegant and devastating. It means:

- **Infinite tape is necessary** (not merely sufficient) for undecidability
- Any machine whose tape length is a computable function of the input has a decidable halting problem for that input
- The entire hierarchy of undecidability results (halting problem, Rice's theorem) depends on tape being unbounded

## Log-Space Machines

Between pushdown automata and full Turing machines sit log-space machines: Turing machines with a read-only input tape and a read-write work tape of O(log n) cells. These sit strictly between Type 2 and Type 1 in computational power -- they can do more than a stack but less than linear tape allows.

Log-space computation is significant because many practical graph problems (connectivity, shortest path) can be solved in log-space, suggesting that much of what we need in practice requires far less than a full Turing machine.

## Hierarchy Summary

```
COMPUTATIONAL POWER (strictly ordered by tape resource)
=========================================================
  MORE POWER
  ^
  |  Turing Machine      [infinite tape]     UNDECIDABLE halting
  |  LBA                 [O(n) tape]         DECIDABLE halting
  |  Log-space           [O(log n) tape]     DECIDABLE halting
  |  Pushdown            [stack]             DECIDABLE halting
  |  Finite automaton    [no tape]           DECIDABLE halting
  v
  LESS POWER
=========================================================
  Shannon: within any row, states <-> symbols are fungible
  Moving between rows: permanent power change
=========================================================
```

> **Related:** [Formal Foundations](01-formal-foundations.md) for Turing machine definition. [Limits & Undecidability](04-limits-undecidability.md) for why infinite tape enables paradox.
