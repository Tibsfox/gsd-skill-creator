# Module 1: Formal Foundations

## The Turing Machine Model (1936)

Alan Turing introduced the computing machine in 1936 as a formalization of "effective procedure." A Turing machine consists of:

- A **finite set of states** Q
- A **tape alphabet** Γ including a blank symbol B
- An **input alphabet** Σ ⊂ Γ
- A **one-way infinite tape** divided into cells each holding one symbol from Γ
- A **read-write head**
- A **transition function** δ: Q × Γ → Q × Γ × {L, R}

The **configuration** of a machine at any moment is the triple: (current state, tape contents, head position). This is the total instantaneous description of the computation.

*Source: Stanford Encyclopedia of Philosophy, "Turing Machines" (2024)*

## Configuration Space

For a machine with *m* states, *n* tape symbols, and tape restricted to *k* cells, the maximum number of distinct configurations is:

```
C_max = m × n^k × k
```

This quantity is finite whenever *k* is bounded. This observation is the foundation of the configuration space argument that underlies the entire Chomsky hierarchy.

## The Church-Turing Thesis

The Church-Turing thesis (1936) states that any function computable by an "effective procedure" is computable by a Turing machine. This is a **thesis**, not a theorem -- it cannot be proved because "effective procedure" is an informal notion. However, every formal model of computation proposed since 1936 (lambda calculus, recursive functions, Post systems, cellular automata, quantum circuits) has been shown to compute exactly the same class of functions as Turing machines.

The thesis has philosophical implications: it draws a boundary between the computable and the uncomputable that appears to be a fundamental feature of mathematics, not an artifact of Turing's particular formalization.

## Deterministic vs. Nondeterministic Machines

A **deterministic** Turing machine has exactly one transition for each (state, symbol) pair. A **nondeterministic** Turing machine may have multiple possible transitions -- the machine "branches" into parallel computations and accepts if any branch accepts.

For Turing machines, nondeterminism does not add computational power: every nondeterministic TM can be simulated by a deterministic TM (by systematically exploring all branches). However, the simulation may require exponentially more time. Whether this time blowup is necessary is the P vs. NP question -- one of the deepest open problems in mathematics.

## Finite State Machines as the No-Tape Special Case

A finite state machine (FSM) is equivalent to a Turing machine restricted to read-only operations with head movement only rightward. Its configuration space is exactly Q -- a finite set independent of input length. Consequently FSMs recognize precisely the **regular languages** (Type 3): languages decidable by a single left-to-right scan with constant memory.

*Source: Wikipedia, "Finite-State Machine" (2025)*

The relationship between FSMs and Turing machines is not one of degree but of kind. The FSM's finite configuration space means it cannot count beyond a fixed bound, cannot match parentheses to arbitrary depth, cannot recognize palindromes. These are not performance limitations -- they are provable impossibilities that follow directly from the absence of writable tape.

## Key Definitions

| Term | Definition | Source |
|------|-----------|--------|
| Turing machine | Finite control + infinite read-write tape + transition function | Turing (1936) |
| Configuration | Triple: (state, tape contents, head position) | SEP (2024) |
| Church-Turing thesis | Every effective procedure is Turing-computable | Church (1936), Turing (1936) |
| FSM | Turing machine with read-only, right-moving head | Standard definition |
| Regular language | Language recognizable by a finite automaton (Type 3) | Chomsky (1956) |

> **Related:** [Shannon Trade-off](02-shannon-tradeoff.md) for what happens when you vary states and symbols within this model. [Tape-Length Hierarchy](03-tape-hierarchy.md) for what happens when you vary tape resources.
