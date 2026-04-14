# Trace Selection Algorithms, Trace Compaction, and Scheduling Techniques

## A Technical Deep Dive into Global Instruction Scheduling for VLIW and Superscalar Architectures

---

**Abstract.** This document presents a comprehensive treatment of trace selection algorithms,
trace compaction (scheduling), and related scheduling techniques that form the backbone of
global instruction scheduling in modern compilers. Beginning with the construction of the
control flow graph and the fundamental limitations of basic block scheduling, we develop
the theory and practice of trace scheduling as introduced by Fisher (1981), superblock
formation by Hwu, Mahlke, and Chen (1992), hyperblock formation through if-conversion,
treegion scheduling, and region-based scheduling. We then examine the trace compaction
engine itself --- the list scheduling algorithm, its priority functions, speculative code motion,
compensation code insertion, and the bookkeeping algorithm of Ellis (1985). Software
pipelining via modulo scheduling is presented as the complementary loop-domain technique.
Modern implementations in GCC, LLVM, the IMPACT compiler, Trimaran, and Open64 are
surveyed. The document concludes with the theoretical foundations: NP-hardness of optimal
scheduling, critical path and resource bounds, and the scheduling gap. Throughout, we
provide pseudocode for all major algorithms, ASCII-art diagrams, and worked examples.

---

# Part 1: The Control Flow Graph and Basic Blocks

The control flow graph is the foundational data structure upon which all global scheduling
techniques are built. Before we can discuss trace selection, we must understand how
compilers represent program control flow and what limits the parallelism extractable from
a single basic block.

---

## Chapter 1: CFG Construction

### 1.1 From Source Code to Intermediate Representation

A compiler transforms source code through a sequence of intermediate representations (IRs)
before producing machine code. The control flow graph (CFG) is constructed from a
low-level IR --- typically three-address code, SSA form, or a machine-level IR --- after
parsing, type checking, and initial lowering have been completed.

The CFG is a directed graph G = (V, E, entry, exit) where:

- **V** is a set of nodes, each representing a **basic block**
- **E** is a set of directed edges representing transfers of control
- **entry** is the unique entry node (the block containing the first instruction)
- **exit** is the unique exit node (or a synthetic exit collecting all return points)

### 1.2 Identifying Basic Blocks

A **basic block** is a maximal sequence of consecutive instructions such that:

1. Control flow enters the block only at the first instruction (the **leader**)
2. Control flow leaves the block only at the last instruction
3. No instruction within the block (except the last) is a branch, and no instruction
   within the block (except the first) is a branch target

The algorithm for identifying basic blocks from a linear instruction sequence is:

```
ALGORITHM: IdentifyBasicBlocks(instructions[1..n])
────────────────────────────────────────────────────
Input:  A sequence of instructions instructions[1..n]
Output: A set of basic blocks B

1.  leaders ← {1}                          // First instruction is always a leader
2.  FOR i ← 1 TO n DO
3.      IF instructions[i] is a branch (conditional or unconditional) THEN
4.          // The target of the branch is a leader
5.          leaders ← leaders ∪ {target(instructions[i])}
6.          // The instruction immediately after the branch is a leader
7.          IF i + 1 ≤ n THEN
8.              leaders ← leaders ∪ {i + 1}
9.          END IF
10.     END IF
11.     IF instructions[i] is a label or function entry THEN
12.         leaders ← leaders ∪ {i}
13.     END IF
14. END FOR
15. Sort leaders in ascending order: l₁ < l₂ < ... < lₖ
16. FOR j ← 1 TO k DO
17.     block_j ← instructions[lⱼ .. lⱼ₊₁ - 1]   // (lₖ₊₁ = n + 1)
18.     B ← B ∪ {block_j}
19. END FOR
20. RETURN B
```

### 1.3 Constructing the CFG Edges

Once basic blocks are identified, edges are added:

- **Fall-through edge**: If the last instruction of block B is not an unconditional branch,
  add an edge from B to the block that immediately follows it in the linear order.
- **Branch edge**: If the last instruction of block B is a branch (conditional or
  unconditional) to label L, add an edge from B to the block whose leader is L.
- **Conditional branch**: A conditional branch generates TWO edges: a branch edge to the
  target and a fall-through edge to the next block.

```
EXAMPLE: CFG construction from C code

    int abs_max(int a, int b) {         // Block B0: entry
        if (a < 0) a = -a;             // B0 → B1 (true), B0 → B2 (false)
        if (b < 0) b = -b;             // B2 → B3 (true), B2 → B4 (false)
        if (a > b) return a;           // B4 → B5 (true), B4 → B6 (false)
        return b;
    }

    CFG:
                    ┌─────┐
                    │ B0  │  entry: if (a < 0)
                    └──┬──┘
               T ╱        ╲ F
            ┌─────┐      ┌─────┐
            │ B1  │      │     │
            │a=-a │      │     │
            └──┬──┘      │     │
               │         │     │
               └────┬────┘     │
                    │          │
                 ┌──▼──┐       │
                 │ B2  │  if (b < 0)
                 └──┬──┘
            T ╱        ╲ F
         ┌─────┐      ┌─────┐
         │ B3  │      │     │
         │b=-b │      │     │
         └──┬──┘      │     │
            │         │     │
            └────┬────┘
                 │
              ┌──▼──┐
              │ B4  │  if (a > b)
              └──┬──┘
         T ╱        ╲ F
      ┌─────┐      ┌─────┐
      │ B5  │      │ B6  │
      │ret a│      │ret b│
      └─────┘      └─────┘
```

### 1.4 Dominators

A node **d dominates** a node **n** in the CFG (written d dom n) if every path from the
entry node to n must pass through d. By convention, every node dominates itself. The
**immediate dominator** idom(n) is the unique node that strictly dominates n but does not
strictly dominate any other strict dominator of n.

The dominator tree is a tree rooted at the entry node where each node's parent is its
immediate dominator. The classic algorithm for computing dominators is due to Lengauer
and Tarjan (1979), running in nearly O(n·alpha(n)) time.

```
ALGORITHM: ComputeDominators(CFG)
──────────────────────────────────
Input:  CFG = (V, E, entry)
Output: dom[n] for each node n ∈ V

1.  dom[entry] ← {entry}
2.  FOR each n ∈ V - {entry} DO
3.      dom[n] ← V                     // Initialize to all nodes
4.  END FOR
5.  changed ← true
6.  WHILE changed DO
7.      changed ← false
8.      FOR each n ∈ V - {entry} in reverse postorder DO
9.          new_dom ← ( ∩ dom[p] for all predecessors p of n ) ∪ {n}
10.         IF new_dom ≠ dom[n] THEN
11.             dom[n] ← new_dom
12.             changed ← true
13.         END IF
14.     END FOR
15. END WHILE
```

This iterative algorithm converges in O(n²) worst case but typically runs in 2-3 iterations
on real CFGs.

### 1.5 Post-Dominators

A node **p post-dominates** a node **n** if every path from n to the exit node must pass
through p. Post-dominators are computed by running the dominator algorithm on the reverse
CFG (edges reversed, exit becomes entry).

Post-dominators are essential for computing control dependences: node B is
**control-dependent** on node A if:

1. There exists a path from A to B such that B post-dominates every node on the path
   after A.
2. B does not strictly post-dominate A.

Intuitively, A is a decision point (a branch), and B is executed only when A takes a
particular branch direction.

### 1.6 Back Edges and Natural Loops

An edge (N → H) in the CFG is a **back edge** if H dominates N. The node H is called
the **loop header**. The existence of a back edge implies the existence of a cycle
(loop) in the CFG.

Given a back edge (N → H), the **natural loop** associated with it is defined as:

    loop(N → H) = {H} ∪ {m ∈ V | m can reach N without going through H}

```
ALGORITHM: FindNaturalLoop(H, N)
─────────────────────────────────
Input:  Header node H, tail node N (where N → H is a back edge)
Output: Set of nodes in the natural loop

1.  loop ← {H}
2.  stack ← empty
3.  IF N ∉ loop THEN
4.      loop ← loop ∪ {N}
5.      PUSH N onto stack
6.  END IF
7.  WHILE stack is not empty DO
8.      m ← POP(stack)
9.      FOR each predecessor p of m DO
10.         IF p ∉ loop THEN
11.             loop ← loop ∪ {p}
12.             PUSH p onto stack
13.         END IF
14.     END FOR
15. END WHILE
16. RETURN loop
```

Key properties of natural loops:

- Two natural loops are either **disjoint**, one is **nested** within the other, or they
  share the same header (in which case they are merged).
- This nesting property allows construction of a **loop nest tree** that represents the
  hierarchical loop structure.
- The **loop depth** of a block is the number of loops that contain it (0 for blocks
  outside all loops).

### 1.7 Loop Nest Trees and Loop Depth

The nesting structure of natural loops induces a hierarchical tree called the **loop nest
tree** (or loop tree). This tree is fundamental to compiler optimization because it guides
decisions about loop unrolling, software pipelining, and trace selection boundaries.

```
    SOURCE CODE:                        LOOP NEST TREE:
                                        
    for (i=0; i<N; i++) {              ┌──────────────┐
        for (j=0; j<M; j++) {         │ L0 (outermost)│
            A[i][j] = 0;              │ header: B1    │
            for (k=0; k<P; k++) {     └──────┬────────┘
                A[i][j] += B[i][k]            │
                           * C[k][j];  ┌──────▼────────┐
            }                          │ L1 (middle)   │
        }                              │ header: B3    │
        D[i] = A[i][0];               └──────┬────────┘
    }                                         │
                                       ┌──────▼────────┐
                                       │ L2 (innermost)│
                                       │ header: B5    │
                                       └───────────────┘

    Loop depths:
      B0 (before outer loop):  depth 0
      B1 (outer loop header):  depth 1
      B2 (between loops):      depth 1
      B3 (middle loop header): depth 2
      B4 (between loops):      depth 2
      B5 (inner loop header):  depth 3
      B6 (inner loop body):    depth 3
      B7 (after outer loop):   depth 0
```

**Loop depth** determines execution frequency estimates. A block at depth d in a loop
nest with trip counts T₁, T₂, ..., Td has an estimated execution frequency of
T₁ × T₂ × ... × Td relative to the function entry. For trace selection, blocks with
higher loop depth are weighted more heavily because they account for more dynamic
execution.

The **loop preheader** is a synthetic block inserted before the loop header. It is the
single predecessor of the header from outside the loop. Preheaders simplify loop
transformations (loop-invariant code motion places hoisted instructions in the preheader)
and serve as natural trace boundaries.

```
ALGORITHM: BuildLoopNestTree(CFG, DomTree)
───────────────────────────────────────────
Input:  CFG with dominator tree
Output: Loop nest tree

1.  back_edges ← {(N → H) ∈ E : H dominates N}
2.  loops ← ∅
3.  FOR each back edge (N → H) DO
4.      body ← FindNaturalLoop(H, N)
5.      loops ← loops ∪ {(H, body)}
6.  END FOR
7.
8.  // Merge loops with the same header
9.  FOR each unique header H DO
10.     merged_body ← ∪ {body : (H, body) ∈ loops}
11.     Replace all (H, body) with single (H, merged_body)
12. END FOR
13.
14. // Build nesting hierarchy
15. root ← create virtual root node
16. FOR each loop L in order of decreasing body size DO
17.     parent ← smallest loop containing L.header (or root if none)
18.     Make L a child of parent in the tree
19. END FOR
20.
21. RETURN tree rooted at root
```

### 1.8 Reducible vs. Irreducible Control Flow

A CFG is **reducible** if every cycle contains a back edge (i.e., the cycle header
dominates all nodes in the cycle). Structured programs (using only if/else, while, for,
break, continue) always produce reducible CFGs. Irreducible CFGs --- caused by
`goto` statements creating multiple-entry loops --- are more difficult for optimizers to
handle. Most compilers either refuse to apply aggressive scheduling to irreducible regions
or transform them into reducible form via node splitting.

**Node splitting** transforms an irreducible CFG into a reducible one by duplicating
blocks that have multiple loop entries. Consider a two-entry loop where blocks B and C
can both serve as loop entry points:

```
    IRREDUCIBLE (two loop entries):       REDUCIBLE (after node splitting):
    
    A ──→ B ◄──┐                         A ──→ B  ◄──┐
    │     │    │                          │     │     │
    │     ▼    │                          │     ▼     │
    │     D ───┘                          │     D ────┘
    │     │                               │
    └──→ C ◄──┐                          └──→ C' ◄──┐
          │    │                               │     │
          ▼    │                               ▼     │
          E ───┘                               E'────┘
    
    B and C are both loop entries.        C' and E' are copies. Now each
    This is irreducible.                  loop has a single entry (reducible).
```

Node splitting increases code size but enables the full range of loop optimizations
including software pipelining and trace scheduling.

### 1.9 Control Dependence and the CDG

The **Control Dependence Graph (CDG)** is essential for determining which instructions
can be legally moved during scheduling. Node Y is **control-dependent** on node X if:

1. There exists a directed path from X to Y in the CFG
2. Y post-dominates every node on the path from X to Y (excluding X itself)
3. Y does not strictly post-dominate X

Intuitively, X is a branch instruction, and Y executes or does not execute depending on
the direction taken at X.

```
ALGORITHM: BuildCDG(CFG, PostDomTree)
──────────────────────────────────────
Input:  CFG = (V, E), post-dominator tree
Output: Control Dependence Graph

1.  CDG ← empty graph with same nodes as CFG
2.  FOR each edge (A → B) ∈ E DO
3.      IF B does NOT post-dominate A THEN
4.          // Walk up the post-dominator tree from A
5.          // until we find a node that post-dominates A (or reach the root)
6.          runner ← B
7.          WHILE runner ≠ immediate_postdom(A) DO
8.              // runner is control-dependent on A
9.              Add edge A → runner to CDG
10.             runner ← immediate_postdom(runner)
11.         END WHILE
12.     END IF
13. END FOR
14.
15. RETURN CDG
```

The CDG tells the scheduler which instructions are "guarded" by which branches. An
instruction guarded by branch B can only be speculatively moved above B if the compiler
can guarantee correctness (via compensation code or speculation hardware).

### 1.10 The Edge Profile: Weighting the CFG

For trace selection, the most critical augmentation of the CFG is **edge profiling**: each
edge is annotated with an execution frequency, either from profiling data or from static
heuristics. The weighted CFG is the input to all trace selection algorithms.

```
WEIGHTED CFG EXAMPLE:

               ┌─────────┐
               │ B0      │
               │ entry   │
               └────┬────┘
                    │ (1000)
               ┌────▼────┐
               │ B1      │
               │ if(x>0) │
               └────┬────┘
          (900)╱         ╲(100)
        ┌──────┐       ┌──────┐
        │  B2  │       │  B3  │
        │ hot  │       │ cold │
        └──┬───┘       └──┬───┘
           │(900)         │(100)
           └──────┬───────┘
               ┌──▼──┐
               │ B4  │
               │ exit│
               └─────┘
```

In this example, the branch at B1 is taken 900 out of 1000 times, making B0→B1→B2→B4
the hot path and B0→B1→B3→B4 the cold path.

---

## Chapter 2: Basic Block Scheduling

### 2.1 The Data Dependency DAG

Within a single basic block, the scheduler must respect data dependencies between
instructions. These dependencies are represented as a **directed acyclic graph** (DAG)
where:

- Each node represents an instruction
- Each directed edge (i → j) with label l means instruction j depends on instruction i
  with a latency of l cycles (j cannot begin execution until at least l cycles after i
  begins)

There are three types of data dependencies:

**True Dependence (RAW --- Read After Write):**
Instruction j reads a value that instruction i writes. This is a genuine data flow
constraint that cannot be eliminated by renaming.

```
    i:  r1 ← r2 + r3       // i writes r1
    j:  r4 ← r1 * r5       // j reads r1 (RAW on r1)
```

**Anti-Dependence (WAR --- Write After Read):**
Instruction j writes a register that instruction i reads. The ordering must be preserved
to prevent j from overwriting the value before i reads it.

```
    i:  r4 ← r1 + r3       // i reads r1
    j:  r1 ← r5 * r6       // j writes r1 (WAR on r1)
```

Anti-dependencies are **name dependencies** --- they arise from register reuse, not from
genuine data flow. They can be eliminated by **register renaming**: assign j's output to
a fresh register.

**Output Dependence (WAW --- Write After Write):**
Both instructions i and j write to the same register. The ordering must be preserved so
that the correct final value is in the register.

```
    i:  r1 ← r2 + r3       // i writes r1
    j:  r1 ← r5 * r6       // j writes r1 (WAW on r1)
```

Like anti-dependencies, output dependencies are name dependencies and can be eliminated
by register renaming.

### 2.2 Building the Dependency DAG

```
ALGORITHM: BuildDependencyDAG(block)
─────────────────────────────────────
Input:  A basic block with instructions I₁, I₂, ..., Iₙ
Output: A DAG (nodes = instructions, edges = dependencies with latencies)

1.  FOR each instruction Iⱼ (j = 1 to n) DO
2.      Create node for Iⱼ
3.  END FOR
4.
5.  // Find RAW dependencies (true dependencies)
6.  FOR each instruction Iⱼ (j = 2 to n) DO
7.      FOR each register r READ by Iⱼ DO
8.          Find the most recent instruction Iᵢ (i < j) that WRITES r
9.          IF such Iᵢ exists THEN
10.             Add edge Iᵢ → Iⱼ with latency = exec_latency(Iᵢ)
11.             Label edge as RAW
12.         END IF
13.     END FOR
14. END FOR
15.
16. // Find WAR dependencies (anti-dependencies)
17. FOR each instruction Iⱼ (j = 2 to n) DO
18.     FOR each register r WRITTEN by Iⱼ DO
19.         Find the most recent instruction Iᵢ (i < j) that READS r
20.         AND there is no intervening WRITE to r between Iᵢ and Iⱼ
21.         IF such Iᵢ exists THEN
22.             Add edge Iᵢ → Iⱼ with latency = 0  (or 1)
23.             Label edge as WAR
24.         END IF
25.     END FOR
26. END FOR
27.
28. // Find WAW dependencies (output dependencies)
29. FOR each instruction Iⱼ (j = 2 to n) DO
30.     FOR each register r WRITTEN by Iⱼ DO
31.         Find the most recent instruction Iᵢ (i < j) that WRITES r
32.         IF such Iᵢ exists THEN
33.             Add edge Iᵢ → Iⱼ with latency = 0  (or 1)
34.             Label edge as WAW
35.         END IF
36.     END FOR
37. END FOR
38.
39. RETURN DAG
```

### 2.3 The List Scheduling Algorithm for Basic Blocks

List scheduling is the standard heuristic for scheduling instructions within a basic block.
It operates in two phases: (1) build the dependency DAG and compute priorities, and
(2) greedily schedule instructions from a ready list.

```
ALGORITHM: ListSchedule(DAG, machine)
──────────────────────────────────────
Input:  Dependency DAG with nodes (instructions) and edges (dependencies)
        Machine description: functional units, latencies, issue width
Output: A schedule mapping instructions to cycles

1.  // Phase 1: Compute priorities
2.  FOR each node n in reverse topological order DO
3.      priority[n] ← latency(n) + max({priority[s] + edge_latency(n,s) :
4.                                      s ∈ successors(n)})
5.      // If n has no successors, priority[n] = latency(n)
6.  END FOR
7.
8.  // Phase 2: Schedule
9.  cycle ← 0
10. ready ← {n ∈ DAG : n has no predecessors}
11. scheduled ← ∅
12.
13. WHILE scheduled ≠ all nodes DO
14.     // Select highest-priority ready instruction
15.     // that can be issued in this cycle (resource available)
16.     issued_this_cycle ← 0
17.     FOR each instruction n in ready, sorted by priority descending DO
18.         IF resource_available(n, cycle, machine) AND
19.            issued_this_cycle < machine.issue_width THEN
20.             schedule[n] ← cycle
21.             scheduled ← scheduled ∪ {n}
22.             reserve_resources(n, cycle, machine)
23.             issued_this_cycle ← issued_this_cycle + 1
24.         END IF
25.     END FOR
26.     // Advance cycle
27.     cycle ← cycle + 1
28.     // Update ready list
29.     FOR each unscheduled instruction m DO
30.         IF all predecessors of m are scheduled AND
31.            schedule[pred] + latency(pred→m) ≤ cycle for all pred THEN
32.             ready ← ready ∪ {m}
33.         END IF
34.     END FOR
35. END WHILE
36.
37. RETURN schedule
```

### 2.4 Priority Functions

The priority function is the most critical component of list scheduling. Several heuristics
are used in practice:

**Critical Path Length (CP):**
The priority of an instruction is the length of the longest path from that instruction
to any exit of the DAG. Instructions on the critical path are scheduled first, as
delaying them directly increases the total schedule length.

```
    priority_CP(n) = latency(n) + max(priority_CP(s) + edge_lat(n,s))
                     for all successors s of n
```

**Resource Pressure:**
When multiple instructions are ready and tied on critical path, prefer the instruction
that uses the most-constrained (scarcest) resource. This prevents resource starvation.

**Mobility (Slack):**
The **slack** of an instruction is the difference between its latest start time (without
extending the schedule) and its earliest start time. Instructions with zero slack are
on the critical path. Low-slack instructions should be prioritized.

```
    slack(n) = latest_start(n) - earliest_start(n)
```

**Depth (Height in DAG):**
An alternative to critical path: the depth from the entry of the DAG. Deeper instructions
(farther from roots) have more data flowing into them and may offer less scheduling
freedom.

**Source Order:**
As a final tiebreaker, preserve the original program order to improve cache behavior
and debuggability.

### 2.5 Worked Example: Basic Block Scheduling

Consider a basic block on a 2-issue machine with functional units A (ALU, 1-cycle latency)
and M (multiply, 3-cycle latency):

```
    I1:  r1 ← load [r10]        // M unit, latency 3
    I2:  r2 ← load [r11]        // M unit, latency 3
    I3:  r3 ← r1 + r2           // A unit, latency 1, depends on I1, I2
    I4:  r4 ← r1 * r2           // M unit, latency 3, depends on I1, I2
    I5:  r5 ← r3 + r4           // A unit, latency 1, depends on I3, I4
    I6:  store r5 → [r12]       // M unit, latency 1, depends on I5

    Dependency DAG:

         I1 ──────┬──────── I2
        ╱    ╲    │    ╱    ╲
       3      3   │   3      3
      ╱        ╲  │  ╱        ╲
    I3          I4            (I3 depends on I1,I2)
     ╲          ╱             (I4 depends on I1,I2)
      1        3
       ╲      ╱
        I5                    (I5 depends on I3, I4)
         │
         1
         │
        I6                    (I6 depends on I5)

    Critical paths:
      I1 → I4 → I5 → I6 = 3 + 3 + 1 + 1 = 8 cycles
      I2 → I4 → I5 → I6 = 3 + 3 + 1 + 1 = 8 cycles

    Schedule (2-issue, units A and M):

    Cycle │ Unit A      │ Unit M
    ──────┼─────────────┼─────────────
      0   │             │ I1: load
      1   │             │ I2: load
      2   │             │
      3   │ I3: r1+r2   │ I4: r1*r2     ← I1,I2 results ready
      4   │             │
      5   │             │
      6   │ I5: r3+r4   │               ← I4 result ready at cycle 6
      7   │             │ I6: store
    ──────┴─────────────┴─────────────
    Total: 8 cycles (matches critical path bound)
```

### 2.6 Resource Models and Pipeline Descriptions

The accuracy of instruction scheduling depends critically on the fidelity of the
**machine model** --- the compiler's description of the target processor's pipeline
and resources. There are several approaches to modeling machine resources:

**Reservation Tables:**
A reservation table is a 2D matrix where rows represent pipeline stages and columns
represent time slots. Each instruction type has a reservation table entry showing which
pipeline stages it occupies in which cycles.

```
    Example: 5-stage pipeline reservation tables

    ALU ADD instruction:
    Stage    │ Cycle 0 │ Cycle 1 │ Cycle 2 │ Cycle 3 │ Cycle 4
    ─────────┼─────────┼─────────┼─────────┼─────────┼────────
    Fetch    │    X    │         │         │         │
    Decode   │         │    X    │         │         │
    Execute  │         │         │    X    │         │
    Memory   │         │         │         │         │
    Writeback│         │         │         │    X    │

    MULTIPLY instruction (3-cycle execute):
    Stage    │ Cycle 0 │ Cycle 1 │ Cycle 2 │ Cycle 3 │ Cycle 4 │ Cycle 5
    ─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────
    Fetch    │    X    │         │         │         │         │
    Decode   │         │    X    │         │         │         │
    Execute  │         │         │  X(MUL) │  X(MUL) │  X(MUL) │
    Memory   │         │         │         │         │         │
    Writeback│         │         │         │         │         │    X

    LOAD instruction:
    Stage    │ Cycle 0 │ Cycle 1 │ Cycle 2 │ Cycle 3 │ Cycle 4
    ─────────┼─────────┼─────────┼─────────┼─────────┼────────
    Fetch    │    X    │         │         │         │
    Decode   │         │    X    │         │         │
    Execute  │         │         │    X    │         │
    Memory   │         │         │         │    X    │
    Writeback│         │         │         │         │    X
```

Two instructions **conflict** if they both need the same pipeline stage in the same
cycle. The scheduler checks the reservation tables to detect conflicts.

**Deterministic Finite Automaton (DFA) Resource Model:**
GCC uses a DFA-based model where the machine's pipeline is described as a regular
language. Each state of the DFA represents a particular configuration of pipeline
occupancy, and transitions correspond to issuing new instructions. The DFA is
generated automatically from a pipeline description in GCC's `.md` (machine
description) files.

The DFA approach is more compact and faster to query than explicit reservation tables,
especially for complex pipelines with many functional units and forwarding paths.

**Instruction Itineraries (LLVM):**
LLVM originally used instruction itineraries --- per-instruction tables of (stage,
cycle) pairs --- but has migrated to the `SchedMachineModel` framework, which describes
resources more abstractly as `ProcResource` types with buffer sizes and acquisition/
release cycle counts. This approach is more flexible and easier to maintain across
target architectures.

### 2.7 Register Renaming and Dependency Elimination

Anti-dependencies (WAR) and output dependencies (WAW) are **false dependencies** ---
they arise from the reuse of register names, not from genuine data flow. Register
renaming can eliminate them:

```
    BEFORE renaming (with anti-dependency):
    I1:  r1 ← load [r10]      // reads r1? No, writes r1
    I2:  r4 ← r1 + r3         // reads r1 (RAW on r1 from I1, TRUE dep)
    I3:  r1 ← r5 * r6         // writes r1 (WAR on r1 with I2, ANTI dep)
    I4:  r7 ← r1 + r8         // reads r1 (RAW on r1 from I3, TRUE dep)

    The WAR dependency I2 → I3 prevents reordering I2 and I3.

    AFTER renaming:
    I1:  r1 ← load [r10]
    I2:  r4 ← r1 + r3         // reads r1 (still RAW from I1)
    I3:  r9 ← r5 * r6         // writes r9 (renamed from r1; WAR eliminated!)
    I4:  r7 ← r9 + r8         // reads r9 (RAW from I3, updated reference)

    Now I2 and I3 can execute in parallel (no dependency between them).
```

In hardware, Tomasulo's algorithm performs dynamic register renaming via a reorder
buffer and reservation stations. In software (the compiler), register renaming is
performed during or after register allocation. For VLIW machines without hardware
renaming, the compiler must perform all renaming statically.

### 2.8 Memory Dependencies and Disambiguation

Memory dependencies are the most challenging aspect of dependency analysis. Two memory
operations may depend on each other if they access the same memory address:

- **Load after Store (RAW)**: Must read the value written by the store
- **Store after Load (WAR)**: Must not overwrite the value before it is read
- **Store after Store (WAW)**: Must produce the correct final value in memory

Unlike register dependencies, memory addresses are often computed at runtime and may
not be known at compile time. The compiler must conservatively assume that any two
memory operations MAY alias unless it can prove otherwise.

```
    // Can these be reordered?
    store r1 → [r10]           // writes to address in r10
    r2 ← load [r11]           // reads from address in r11

    If r10 ≠ r11 (provably): YES, they can be reordered
    If r10 = r11 (provably):  NO, the load must see the stored value
    If unknown:               NO, the compiler must assume they MAY alias
```

**Disambiguation techniques:**

1. **Base register analysis**: If two memory accesses use different base registers that
   provably point to different objects (e.g., stack pointer vs. global pointer), they
   cannot alias.

2. **Offset analysis**: If two accesses use the same base register but non-overlapping
   constant offsets, they cannot alias. For example, `[r10 + 0]` and `[r10 + 8]` do
   not alias if the access width is at most 8 bytes.

3. **Type-based alias analysis (TBAA)**: In C/C++, the strict aliasing rule says that
   pointers of incompatible types cannot alias (with exceptions for `char*` and `void*`).
   For example, a `float*` and an `int*` cannot point to the same location.

4. **Interprocedural alias analysis**: Track pointer assignments and parameter passing
   across function boundaries to prove non-aliasing of heap-allocated objects.

5. **Runtime disambiguation**: Some architectures provide hardware support for detecting
   memory conflicts at runtime (e.g., IA-64's advanced loads with `ld.a` / `chk.a`).

The precision of memory disambiguation directly impacts scheduling quality. Conservative
(no analysis) approaches may order ALL memory operations sequentially, losing significant
parallelism. Aggressive approaches may enable 30-50% more code motion for memory-intensive
code.

### 2.9 Scheduling and Register Allocation Interaction

Instruction scheduling and register allocation are inherently conflicting optimizations:

- **Scheduling wants to SEPARATE dependent instructions**: Place independent instructions
  between a producer and its consumer to hide latency. This INCREASES the number of
  simultaneously live values (register pressure).

- **Register allocation wants to MINIMIZE live ranges**: Keep values in registers for as
  short a time as possible. This DECREASES scheduling freedom.

```
    SCHEDULING-OPTIMAL:                 REGISTER-OPTIMAL:
    
    I1: r1 ← load [r10]               I1: r1 ← load [r10]
    I2: r2 ← load [r11]   ← fills     I2: r3 ← r1 + 5      ← uses r1 immediately
        latency of I1                  I3: r2 ← load [r11]
    I3: r3 ← r1 + 5       ← uses r1   I4: r4 ← r2 * 3      ← uses r2 immediately
    I4: r4 ← r2 * 3       ← uses r2
                                        Live values at any point: 2
    Live values after I2: 3             Schedule length: may have stalls
    (r1, r2, plus whatever r10/r11
     are needed for)
    Schedule length: no stalls
```

Modern compilers address this tension with several strategies:

1. **Schedule-then-allocate**: Schedule first for ILP, then allocate registers. If the
   allocator must spill, the spill code is inserted and may degrade the schedule.

2. **Allocate-then-schedule**: Allocate registers first, then schedule. The scheduler
   respects the fixed register assignments but may not find optimal parallelism.

3. **Integrated approaches**: Schedule and allocate simultaneously, using register
   pressure as a constraint during scheduling. LLVM's `ScheduleDAGMILive` is an
   example: it tracks live intervals and adjusts scheduling priorities to keep register
   pressure within bounds.

4. **Two-pass scheduling**: GCC's approach. `-fschedule-insns` schedules before register
   allocation; `-fschedule-insns2` schedules again after allocation to clean up any
   degradation caused by spill code insertion.

---

## Chapter 3: The ILP Ceiling Within Basic Blocks

### 3.1 The Fundamental Problem

The central motivation for ALL global scheduling techniques --- trace scheduling,
superblock scheduling, hyperblock scheduling, software pipelining --- is a single,
stubborn fact:

> **Basic blocks are short. Typical basic blocks contain only 4-7 instructions.**

This was first measured by Fisher in 1981 and has been confirmed by every subsequent
study. The average **dynamic branch frequency** --- the fraction of executed instructions
that are branches --- is typically 15-25%. This means that on average, a branch occurs
every 4 to 7 instructions.

### 3.2 ILP Within a Basic Block

Given a basic block of 5 instructions, even with NO dependencies between them, the maximum
ILP achievable is 5 (all 5 execute in parallel in one cycle). In practice, dependencies
reduce this significantly.

Consider a typical basic block:

```
    r1 ← load [r10]       // 3-cycle latency
    r2 ← r1 + 4           // depends on load (RAW)
    r3 ← r2 * r11         // depends on add (RAW)
    store r3 → [r12]      // depends on multiply (RAW)
    branch if r3 > 0       // depends on multiply (RAW)
```

This block has a **dependency chain** of length 4 (load → add → multiply → store/branch).
On a 4-issue VLIW machine with a 3-cycle load and a 3-cycle multiply, the schedule takes:

```
    Cycle 0: load
    Cycle 3: add
    Cycle 4: multiply
    Cycle 7: store, branch
    Total: 8 cycles for 5 instructions → IPC = 0.625
```

The 4-issue machine is utilized at less than 16% capacity. Even with unlimited functional
units, the critical path length bounds the schedule to 8 cycles for these 5 instructions.

### 3.3 Measurements Across Programs

Studies from Fisher (1981), Wall (1991), and others have consistently shown:

| Program Type         | Avg BB Size | Max ILP in BB | Typical ILP |
|---------------------:|:-----------:|:-------------:|:-----------:|
| Integer (SPEC)       | 4.5         | 2.0           | 1.4         |
| Floating-point (SPEC)| 6.2         | 2.8           | 2.1         |
| DSP kernels          | 8.1         | 3.5           | 2.7         |
| Scientific (Fortran) | 7.0         | 3.2           | 2.4         |

Even on a machine with infinite issue width and perfect branch prediction, the ILP
extractable from individual basic blocks averages only 1.4-2.8 on real programs.

### 3.4 Wall's ILP Study (1991)

David Wall's landmark 1991 study "Limits of Instruction-Level Parallelism" (ASPLOS-IV)
systematically measured the upper bounds of ILP under various assumptions. Wall studied
SPEC benchmarks with progressively more aggressive (and unrealistic) assumptions:

```
    ┌─────────────────────────────────────────────────────────────────────┐
    │            WALL'S ILP MEASUREMENTS (1991)                          │
    │                                                                     │
    │  Assumption Level        │ Avg ILP │ Notes                         │
    │─────────────────────────────────────────────────────────────────────│
    │  1. Perfect prediction,   │   ~60   │ Completely unrealistic but    │
    │     infinite window,      │         │ shows theoretical maximum     │
    │     infinite rename       │         │                               │
    │─────────────────────────────────────────────────────────────────────│
    │  2. Perfect prediction,   │   ~15   │ Window size matters A LOT     │
    │     64-insn window,       │         │                               │
    │     infinite rename       │         │                               │
    │─────────────────────────────────────────────────────────────────────│
    │  3. Realistic prediction, │   ~5    │ Branch mispredictions kill    │
    │     64-insn window,       │         │ parallelism                   │
    │     finite rename         │         │                               │
    │─────────────────────────────────────────────────────────────────────│
    │  4. Basic block only      │  ~1.5   │ The reality for simple        │
    │     (no global sched.)    │         │ compilers                     │
    └─────────────────────────────────────────────────────────────────────┘
```

Wall's results demonstrated that:
1. There IS substantial ILP in programs --- but extracting it requires looking beyond
   basic blocks.
2. The window size (how far ahead the scheduler looks) is the most important factor.
3. Branch prediction accuracy is the second most important factor.
4. Basic-block-only scheduling captures only a small fraction of available ILP.

These results provided the empirical justification for trace scheduling, superblock
scheduling, and all other global scheduling techniques.

### 3.5 The VLIW Utilization Problem

On a VLIW machine with W issue slots, the **utilization** is:

```
    utilization = (instructions_executed) / (W × cycles × functional_unit_match)
```

For a 4-issue VLIW scheduling only basic blocks:

```
    Average BB size: 5 instructions
    Average BB schedule length: 4 cycles (with some parallelism)
    Instructions per cycle: 5/4 = 1.25
    Utilization: 1.25/4 = 31%

    For an 8-issue VLIW:
    Utilization: 1.25/8 = 16%

    For a 16-issue VLIW (like some DSP processors):
    Utilization: 1.25/16 = 8%
```

The wider the machine, the worse the utilization problem becomes. This is why VLIW
machines REQUIRE global scheduling --- without it, the extra functional units are
mostly idle, wasting silicon area and power.

### 3.6 Quantifying the Global Scheduling Advantage

When trace scheduling is applied to a program that was previously scheduled only at
the basic block level, the improvement comes from three sources:

1. **Latency hiding**: Long-latency operations (loads, multiplies) from one basic block
   can overlap with independent operations from adjacent blocks.

2. **Functional unit filling**: VLIW slots that were empty (NOPs) in basic-block
   scheduling can be filled with instructions from neighboring blocks.

3. **Branch delay utilization**: Instructions from the target block can be placed in
   the branch delay slot (on machines with exposed pipeline delays).

Typical speedups from global scheduling over basic-block-only scheduling:

| Machine Width | BB-only IPC | Global IPC | Speedup |
|--------------:|:-----------:|:----------:|:-------:|
| 2-issue       | 1.2         | 1.7        | 1.4x    |
| 4-issue       | 1.3         | 2.5        | 1.9x    |
| 8-issue       | 1.3         | 3.8        | 2.9x    |
| 16-issue      | 1.3         | 5.2        | 4.0x    |

The wider the machine, the greater the benefit of global scheduling. This explains why
trace scheduling was invented specifically for VLIW machines and why it remains most
important for wide-issue architectures.

### 3.7 The Conclusion That Launched Trace Scheduling

Fisher's key insight in 1981 was profound and simple:

> *"To achieve high utilization of a VLIW machine with many functional units, the
> compiler MUST find parallelism across basic block boundaries. The compiler must
> schedule instructions from multiple basic blocks together, as if they were a single
> large block."*

This insight led directly to the invention of trace scheduling and, subsequently, to
every other global scheduling technique covered in this document. The entire field of
global instruction scheduling exists because basic blocks are too small.

### 3.8 The Hierarchy of Scheduling Regions

The evolution of scheduling regions can be understood as a progression from small,
simple regions to large, complex ones:

```
    ┌───────────────────────────────────────────────────────────────────────┐
    │  BASIC BLOCK         Simplest. Single entry, single exit.            │
    │  (local scheduling)  No compensation code. O(n²) scheduling.        │
    │                      ILP: 1.5-2.5                                    │
    ├───────────────────────────────────────────────────────────────────────┤
    │  EXTENDED BASIC       Multiple blocks with single entry,             │
    │  BLOCK (EBB)          multiple exits. No side entries.               │
    │                       Simple compensation. ILP: 2-4                  │
    ├───────────────────────────────────────────────────────────────────────┤
    │  TRACE                Multiple blocks, may have side entries          │
    │  (Fisher, 1981)       AND side exits. Full compensation needed.      │
    │                       ILP: 3-6                                       │
    ├───────────────────────────────────────────────────────────────────────┤
    │  SUPERBLOCK            Trace with no side entries (tail duplication). │
    │  (Hwu et al., 1992)   Simpler compensation. ILP: 3-6               │
    ├───────────────────────────────────────────────────────────────────────┤
    │  HYPERBLOCK            Predicated multi-path region.                  │
    │  (Mahlke et al., 1992) No compensation for internal branches.       │
    │                        Requires predication hardware. ILP: 4-8       │
    ├───────────────────────────────────────────────────────────────────────┤
    │  TREEGION              Tree-shaped region including multiple paths.   │
    │  (Schlansker, Rau)     No profile data needed. ILP: 4-8             │
    ├───────────────────────────────────────────────────────────────────────┤
    │  ARBITRARY REGION      Any connected CFG subgraph.                   │
    │  (IMPACT)              Most general. Most complex. ILP: 5-10        │
    ├───────────────────────────────────────────────────────────────────────┤
    │  SOFTWARE PIPELINE     Overlapping loop iterations.                   │
    │  (Rau, 1981)           Specific to loops. ILP: 5-20+                │
    └───────────────────────────────────────────────────────────────────────┘
```

Each level provides more scheduling freedom at the cost of greater compiler complexity.
The choice of scheduling region is one of the most important decisions in compiler design.

---

# Part 2: Trace Selection Algorithms

With the CFG constructed and the motivation established, we now turn to the algorithms
that select which sequences of basic blocks to schedule together. The quality of trace
selection directly determines the quality of the final schedule.

---

## Chapter 4: Fisher's Greedy Trace Selection (1981)

### 4.1 Historical Context

In 1981, Joseph A. Fisher published "Trace Scheduling: A Technique for Global Microcode
Compaction" in the IEEE Transactions on Computers (vol. C-30, pp. 478-490). This paper
introduced both the concept of trace scheduling and the greedy algorithm for selecting
traces. The work grew from Fisher's doctoral research at the Courant Institute of
Mathematical Sciences at New York University.

Fisher's key observation was that a compiler could treat an entire likely execution path
--- spanning many basic blocks --- as a single scheduling unit. By scheduling the hot path
aggressively and inserting **compensation code** on the cold paths, the common case would
execute quickly at the cost of some code size increase and slower cold paths.

### 4.2 The Trace

A **trace** is a sequence of basic blocks B₁, B₂, ..., Bₖ such that:

1. For each consecutive pair (Bᵢ, Bᵢ₊₁), there is an edge from Bᵢ to Bᵢ₊₁ in the CFG
2. No basic block appears more than once in the trace
3. The trace does not cross a loop back edge (typically --- this restriction is relaxed
   in some variants)

A trace has:
- One **entry point** at the top (B₁)
- Possibly multiple **side entries** where off-trace control flow joins the trace at
  blocks B₂, ..., Bₖ
- Possibly multiple **side exits** where control flow leaves the trace from blocks
  B₁, ..., Bₖ₋₁ via branches not taken along the trace

### 4.3 The Greedy Trace Selection Algorithm

```
ALGORITHM: GreedyTraceSelection(CFG, frequencies)
───────────────────────────────────────────────────
Input:  Weighted CFG = (V, E) with edge frequencies freq(e)
        Block frequencies freq(B) derived from edge frequencies
Output: An ordered list of traces covering all blocks

1.  traces ← empty list
2.  unscheduled ← V                    // All blocks initially unscheduled
3.
4.  WHILE unscheduled ≠ ∅ DO
5.      // Step 1: SEED SELECTION
6.      // Pick the most frequently executed unscheduled block
7.      seed ← argmax_{B ∈ unscheduled} freq(B)
8.
9.      // Step 2: Initialize the trace with the seed
10.     trace ← [seed]
11.
12.     // Step 3: GROW DOWNWARD
13.     // Extend the trace by following the most frequent successor
14.     current ← seed
15.     WHILE true DO
16.         // Find the most frequent successor that is:
17.         //   (a) unscheduled
18.         //   (b) not crossing a loop back edge
19.         //   (c) adds net benefit (optional profitability test)
20.         best_succ ← null
21.         best_freq ← 0
22.         FOR each successor s of current DO
23.             IF s ∈ unscheduled AND
24.                edge(current → s) is not a back edge AND
25.                freq(current → s) > best_freq THEN
26.                 best_succ ← s
27.                 best_freq ← freq(current → s)
28.             END IF
29.         END FOR
30.
31.         IF best_succ = null THEN BREAK   // No profitable extension
32.
33.         // Optional: stop if trace is too long
34.         IF |trace| ≥ MAX_TRACE_LENGTH THEN BREAK
35.
36.         Append best_succ to the end of trace
37.         current ← best_succ
38.     END WHILE
39.
40.     // Step 4: GROW UPWARD
41.     // Extend the trace by following the most frequent predecessor
42.     current ← seed
43.     WHILE true DO
44.         best_pred ← null
45.         best_freq ← 0
46.         FOR each predecessor p of current DO
47.             IF p ∈ unscheduled AND
48.                edge(p → current) is not a back edge AND
49.                freq(p → current) > best_freq THEN
50.                 best_pred ← p
51.                 best_freq ← freq(p → current)
52.             END IF
53.         END FOR
54.
55.         IF best_pred = null THEN BREAK
56.         IF |trace| ≥ MAX_TRACE_LENGTH THEN BREAK
57.
58.         Prepend best_pred to the beginning of trace
59.         current ← best_pred
60.     END WHILE
61.
62.     // Step 5: Mark all blocks in the trace as scheduled
63.     FOR each block B in trace DO
64.         unscheduled ← unscheduled - {B}
65.     END FOR
66.
67.     // Step 6: Add the trace to the trace list
68.     Append trace to traces
69. END WHILE
70.
71. RETURN traces
```

### 4.4 Trace Selection Example

Consider the following weighted CFG (frequencies on edges):

```
                    ┌─────┐
                    │  A  │ freq=1000
                    └──┬──┘
               (900)╱     ╲(100)
             ┌─────┐       ┌─────┐
             │  B  │       │  C  │
             │f=900│       │f=100│
             └──┬──┘       └──┬──┘
            (900)│            │(100)
             ┌──▼──┐       ┌──▼──┐
             │  D  │       │  E  │
             │f=900│       │f=100│
             └──┬──┘       └──┬──┘
            (800)╱  ╲(100)    │(100)
          ┌─────┐  ┌─────┐   │
          │  F  │  │  G  │   │
          │f=800│  │f=100│   │
          └──┬──┘  └──┬──┘   │
             │(800)   │(100)  │(100)
             └────────┼───────┘
                   ┌──▼──┐
                   │  H  │ freq=1000
                   └─────┘

Trace 1 (seed = A, highest frequency among tied blocks):
  Grow down from A: A → B (900) → D (900) → F (800) → H (800)
  Grow up from A: nothing (A is entry)
  Trace 1 = [A, B, D, F, H]
  Coverage: captures 800/1000 = 80% of execution

Trace 2 (seed = C or E or G, all at freq=100):
  E.g., seed = C:
  Grow down: C → E (100)
  Grow up: nothing (A already scheduled)
  Trace 2 = [C, E]

Trace 3 (seed = G):
  Trace 3 = [G]

Total: 3 traces cover 8 blocks. The primary trace captures 80% of execution.
```

### 4.5 Properties of Fisher's Algorithm

1. **Greedy**: Each trace is formed independently, and once a block is assigned to a trace,
   it is never reassigned. This is optimal in a greedy sense --- the hottest paths are
   scheduled first --- but may not be globally optimal.

2. **Loop handling**: The algorithm typically does not extend traces across loop back edges.
   Loops are handled by scheduling each iteration of the loop body as a trace (after loop
   unrolling, if desired). Software pipelining (Chapter 20) handles loops more effectively.

3. **Trace length**: In practice, traces are limited to 50-200 instructions to keep
   compilation time manageable and to limit the amount of compensation code.

4. **Order matters**: The most frequently executed traces are selected first and scheduled
   first. The quality of the schedule for a trace depends on the quality of the traces
   already scheduled (because they constrain the compensation code).

### 4.6 The Trace Scheduling Pipeline

The complete trace scheduling pipeline consists of three phases, repeated for each trace:

```
    ┌─────────────────────────────────────────────────────────────────────┐
    │  PHASE 1: TRACE SELECTION                                          │
    │  ─────────────────────────                                         │
    │  Input: Weighted CFG                                                │
    │  Output: A trace (sequence of basic blocks)                         │
    │  Algorithm: Greedy selection (seed + grow up/down)                  │
    ├─────────────────────────────────────────────────────────────────────┤
    │  PHASE 2: TRACE COMPACTION                                         │
    │  ──────────────────────────                                         │
    │  Input: Trace, dependency DAG, machine model                        │
    │  Output: Compacted schedule                                         │
    │  Algorithm: List scheduling with code motion across block boundaries│
    ├─────────────────────────────────────────────────────────────────────┤
    │  PHASE 3: BOOKKEEPING                                              │
    │  ────────────────────                                               │
    │  Input: Compacted schedule, original CFG                            │
    │  Output: Updated CFG with compensation code                         │
    │  Algorithm: Ellis's bookkeeping algorithm                           │
    └─────────────────────────────────────────────────────────────────────┘
    
    Repeat for next trace. Traces are processed in frequency order
    (hottest first). Each subsequent trace is constrained by the
    compensation code inserted for previous traces.
```

### 4.7 Multiflow: Trace Scheduling in Production

Fisher left Yale in 1984 to co-found **Multiflow Computer, Inc.** with John O'Donnell
and John Ruttenberg, near New Haven, Connecticut. Multiflow built the first commercial
VLIW computers: the TRACE series of minisupercomputers.

**The TRACE Machines:**

| Model       | Instruction Width | Operations/Cycle | Technology           |
|------------:|:-----------------:|:-----------------:|:--------------------:|
| TRACE 7/200 | 256 bits          | 7                 | MSI/LSI boards       |
| TRACE 14/200| 512 bits          | 14                | MSI/LSI boards       |
| TRACE 28/300| 1024 bits         | 28                | CMOS gate arrays     |

The Multiflow compiler was the first production implementation of trace scheduling. Key
characteristics of the compiler:

- Generated code for machines issuing 7, 14, or 28 operations per cycle
- Used Fisher's greedy trace selection with profiling-derived frequencies
- Implemented Ellis's bookkeeping algorithm for compensation code
- Supported speculative code motion with careful exception handling
- Maintained more than 50 operations in flight simultaneously
- Achieved near-linear speedup going from 7-issue to 14-issue configurations

Multiflow shipped its first machines in 1987 to beta sites at Grumman Aircraft, Sikorsky
Helicopter, and the Supercomputer Research Center. The company sold approximately 125
machines before ceasing operations on March 27, 1990, a victim of the "killer micro"
revolution --- the rapid improvement of single-chip microprocessors that made
board-level VLIW implementations economically unviable.

Despite Multiflow's commercial failure, its compiler technology had lasting impact. The
compiler was licensed by Intel, Hewlett-Packard, Digital Equipment Corporation, Fujitsu,
Hughes, and others. Its descendants influenced compiler development for superscalar
processors throughout the 1990s and beyond. Most significantly, the Multiflow experience
proved that trace scheduling could work in production --- a compiler could realistically
schedule 20+ operations per cycle with acceptable compile times and code quality.

### 4.8 Complexity Analysis

The time complexity of Fisher's greedy trace selection is:

```
    Trace selection:  O(|V| + |E|)  per trace × O(|V|) traces = O(|V| × (|V| + |E|))
    Trace compaction: O(n² × k) per trace, where n = instructions in trace,
                                              k = number of functional units
    Bookkeeping:      O(n × s) per trace, where s = number of side entries/exits

    Total: O(|V|² + Σᵢ nᵢ² × k)
    
    In practice, dominated by the list scheduling step for the largest traces.
```

---

## Chapter 5: Trace Selection Quality Metrics

### 5.1 Coverage

The **coverage** of a trace selection is the fraction of total dynamic execution accounted
for by the top N traces. Higher coverage means the scheduler optimizes the code that
matters most.

```
    coverage(N) = Σ(freq(trace_i), i=1..N) / total_execution_frequency
```

For well-profiled programs with hot paths, the top 10-20 traces typically cover 80-95%
of execution. For programs with flat profiles (many equally-likely paths), coverage is
much worse, and trace scheduling is less effective.

### 5.2 Trace Length

Longer traces provide more scheduling freedom (more instructions to reorder, more
opportunities for parallelism) but also:

- Increase compilation time (DAG construction and scheduling are superlinear in trace length)
- Increase the potential for compensation code (more boundaries crossed)
- May reduce the effectiveness of register allocation (more live variables)

The optimal trace length depends on the target machine's issue width: a 4-issue machine
benefits from traces of 20-50 instructions, while an 8-issue machine may benefit from
traces of 50-100 instructions.

### 5.3 Side Entry Count

A **side entry** is a point in the trace where off-trace control flow joins. Side entries
are problematic because:

1. Code motion across a side entry requires **compensation code** to be inserted on the
   joining path (the "above-the-join" problem).
2. The compensation code may itself introduce new dependencies and resource conflicts.
3. The more side entries, the more constrained the scheduler becomes.

The number of side entries is a direct measure of trace scheduling complexity. This
observation motivates the **superblock** (Chapter 6), which eliminates all side entries.

### 5.4 Trace Selection Effectiveness: A Quantitative Example

Consider a function with the following execution profile:

```
    Function: process_records()
    Total dynamic instructions executed: 100,000

    ┌──────────────┬──────────┬──────────┬───────────────────────────────┐
    │ Trace #      │ Blocks   │ Freq     │ Cumulative Coverage           │
    ├──────────────┼──────────┼──────────┼───────────────────────────────┤
    │ Trace 1      │ 5 blocks │ 45,000   │ 45%                           │
    │ Trace 2      │ 3 blocks │ 22,000   │ 67%                           │
    │ Trace 3      │ 4 blocks │ 15,000   │ 82%                           │
    │ Trace 4      │ 2 blocks │ 8,000    │ 90%                           │
    │ Trace 5      │ 3 blocks │ 5,000    │ 95%                           │
    │ Traces 6-12  │ various  │ 5,000    │ 100%                          │
    └──────────────┴──────────┴──────────┴───────────────────────────────┘

    Observations:
    - Top 3 traces cover 82% of execution (classic 80/20-ish distribution)
    - Top 5 traces cover 95% --- scheduling these well is critical
    - Remaining 7 traces cover only 5% --- not worth optimizing aggressively
    - Trace 1 alone (the main loop hot path) covers 45%
```

This distribution is typical of real programs. The concentration of execution in a
few hot traces is what makes trace scheduling effective --- the compiler can spend
most of its optimization effort on Traces 1-3 and achieve 80%+ coverage.

**When trace selection fails:**
Programs with flat execution profiles (many equally-likely paths) defeat trace
scheduling because no single trace captures a significant fraction of execution.
Examples include interpreters, state machines with many equally-likely transitions,
and programs with highly data-dependent control flow. For such programs, hyperblock
scheduling (which includes multiple paths) or region-based scheduling provides
better results than trace-based approaches.

### 5.5 The Code Size Trade-off

Every scheduling technique that goes beyond basic blocks introduces a trade-off
between schedule quality and code size:

```
    ┌─────────────────────────────────────────────────────────────────────┐
    │             Code Size vs. Schedule Quality                         │
    │                                                                     │
    │  Code   │ ..........                                                │
    │  Size   │ .          ........                                       │
    │  Ratio  │                    ........                               │
    │  (vs.   │                            .......                       │
    │  orig.) │                                   ......                 │
    │         │                                         .....            │
    │   3.0   │ ...                                                      │
    │   2.0   │          ........                                         │
    │   1.5   │                   ........                                │
    │   1.0   ├──────────────────────────────────────────────────────────│
    │         │ No global │ Traces  │ Super-  │ Hyper-  │ Full unroll   │
    │         │ scheduling│         │ blocks  │ blocks  │ + schedule    │
    │         │           │         │ (+tail  │ (+if-   │               │
    │         │           │         │  dup)   │  conv)  │               │
    └─────────┴───────────┴─────────┴─────────┴─────────┴───────────────┘
    
    Typical code size increases:
    - Traces with compensation: 1.1x - 1.3x
    - Superblocks (tail dup): 1.2x - 1.5x
    - Hyperblocks (if-conv): 1.0x - 1.2x (may REDUCE size by removing branches)
    - Full unrolling + scheduling: 2.0x - 4.0x
```

The code size increase affects:
1. **Instruction cache pressure**: Larger code may cause more I-cache misses,
   partially negating the scheduling improvement.
2. **Memory footprint**: Embedded systems with limited memory may not be able to
   afford the code size increase.
3. **Compilation time**: More code means more work for downstream passes
   (register allocation, assembly, linking).

Modern compilers use code size as a constraint in trace selection and tail
duplication decisions, limiting code growth to 20-50% above the original.

### 5.6 Loop Coverage

Loops account for the majority of execution time in most programs (the 90/10 rule: 90% of
execution time is spent in 10% of the code, usually loops). A good trace selection must
handle loops effectively. Options include:

1. **Unroll and trace**: Unroll the loop body N times, then select traces through the
   unrolled body. Simple but increases code size.
2. **Software pipeline**: Use modulo scheduling (Chapter 20) instead of trace scheduling
   for loops. This is the dominant approach in modern compilers.
3. **Loop peeling**: Peel one or more iterations of the loop, creating a trace through the
   peeled iterations and the loop setup/teardown code.

---

## Chapter 6: Superblock Formation (Hwu, Mahlke, Chen, 1992)

### 6.1 The Problem with Side Entries

Fisher's original traces can have both side entries and side exits. When the trace
scheduler moves an instruction above a side entry (a join point), it must insert a copy
of that instruction on the off-trace path that enters at the join. This **above-the-join
compensation** is complex, error-prone, and can be expensive.

Consider a trace [A, B, C] where block B has an off-trace predecessor X:

```
    BEFORE code motion:
                        X
                        │
        A ──── B ──── C
               ↑
          side entry from X

    If instruction I from C is moved above B (to A or the top of the trace),
    a COPY of I must be placed on the path X → B, because when control flows
    X → B → C, instruction I would be skipped without the copy.
```

This above-the-join compensation is the primary source of complexity in Fisher's original
trace scheduling. The Bulldog compiler (Ellis, 1985) required elaborate bookkeeping to
manage it correctly.

### 6.2 The Superblock Solution

A **superblock** is a trace with a single entry and multiple exits, but NO side entries.
This is the key innovation of Hwu, Mahlke, and Chen, published in "The Superblock: An
Effective Technique for VLIW and Superscalar Compilation" (The Journal of Supercomputing,
1993; the work was originally presented in earlier workshops and the MICRO-25 conference
proceedings in 1992).

```
    TRACE (Fisher):               SUPERBLOCK (Hwu et al.):
    ┌─── side entry               ┌─── single entry only
    │                              │
    ▼                              ▼
    ┌─────┐                       ┌─────┐
    │  A  │ ← another side entry  │  A  │ ← ONLY entry
    └──┬──┘                       └──┬──┘
       │                             │
    ┌──▼──┐ ← side exit           ┌──▼──┐ ← side exit (OK)
    │  B  │────→ off-trace        │  B  │────→ off-trace
    └──┬──┘                       └──┬──┘
       │                             │
    ┌──▼──┐                       ┌──▼──┐ ← side exit (OK)
    │  C  │────→ off-trace        │  C  │────→ off-trace
    └──┬──┘                       └──┬──┘
       │                             │
    ┌──▼──┐                       ┌──▼──┐
    │  D  │                       │  D  │
    └─────┘                       └─────┘

    Side entries cause above-       No side entries means
    the-join compensation           NO above-the-join
    complexity                      compensation needed
```

Because a superblock has only one entry point, any instruction moved upward within the
superblock never crosses a join point. The only compensation code needed is for side
exits (below-the-branch compensation), which is much simpler.

### 6.3 Tail Duplication

Side entries are eliminated by **tail duplication**. When a block B in the trace has a
predecessor X that is not in the trace (a side entry), the entire portion of the trace
from B onward is duplicated for the off-trace path.

```
BEFORE tail duplication:                AFTER tail duplication:

    A                X                   A                X
    │               ╱                    │                │
    ▼              ╱                     ▼                ▼
    ┌────┐        ╱                      ┌────┐       ┌────┐
    │ B  │ ◄─────╱    (side entry)       │ B  │       │ B' │  (copy of B)
    └─┬──┘                               └─┬──┘       └─┬──┘
      │                                     │            │
    ┌─▼──┐                               ┌─▼──┐       ┌─▼──┐
    │ C  │                               │ C  │       │ C' │  (copy of C)
    └─┬──┘                               └─┬──┘       └─┬──┘
      │                                     │            │
    ┌─▼──┐                               ┌─▼──┐       ┌─▼──┐
    │ D  │                               │ D  │       │ D' │  (copy of D)
    └────┘                               └────┘       └────┘

    Trace = [A,B,C,D]                    Superblock = [A,B,C,D]
    Side entry at B from X               No side entry; X uses copies B',C',D'
```

The key trade-off: **tail duplication increases code size** (the duplicated blocks) but
**eliminates the need for above-the-join compensation code**, which simplifies the
scheduler, reduces compilation time, and produces better schedules for the hot path.

### 6.4 Superblock Formation Algorithm

```
ALGORITHM: FormSuperblock(trace, CFG)
──────────────────────────────────────
Input:  A trace T = [B₁, B₂, ..., Bₖ] selected by greedy trace selection
        The CFG with edge frequencies
Output: A superblock S (single entry, multiple exits)
        Updated CFG with duplicated blocks

1.  S ← T                              // Start with the trace
2.
3.  // Identify side entries
4.  FOR i ← 2 TO k DO                  // B₁ is the trace entry, skip it
5.      side_preds ← {p : p is a predecessor of Bᵢ AND p ∉ T}
6.      IF side_preds ≠ ∅ THEN
7.          // Bᵢ has a side entry; must tail-duplicate from Bᵢ onward
8.          tail ← [Bᵢ, Bᵢ₊₁, ..., Bₖ]
9.          // Create copies of all blocks in tail
10.         FOR each block B in tail DO
11.             B' ← COPY(B)
12.             Add B' to CFG
13.             // Redirect successors of B' to copies or originals as needed
14.         END FOR
15.         // Redirect side_preds to point to the copy of Bᵢ
16.         FOR each p ∈ side_preds DO
17.             Redirect edge (p → Bᵢ) to (p → Bᵢ')
18.         END FOR
19.         // The original Bᵢ now has NO off-trace predecessors
20.     END IF
21. END FOR
22.
23. // Verify: S = [B₁, B₂, ..., Bₖ] now has single entry at B₁
24. ASSERT: for all i > 1, all predecessors of Bᵢ are in S
25.
26. RETURN S
```

### 6.5 The IMPACT Compiler

The superblock was developed and implemented in the **IMPACT compiler** (Illinois
Microarchitecture Project Utilizing Advanced Compiler Technology), a research compiler
led by Wen-mei Hwu at the University of Illinois at Urbana-Champaign (UIUC). The IMPACT
group, established in 1987, produced some of the most influential compiler research of the
1990s.

The IMPACT compiler served as the testbed for:
- Superblock formation and scheduling
- Hyperblock formation (Chapter 7)
- Profile-guided optimization
- Predicated execution support
- Advanced register allocation for VLIW machines

The techniques developed in IMPACT were licensed by major corporations including Intel,
Hewlett-Packard, IBM, AMD, Sun Microsystems, Lucent, and Motorola. When Intel and HP
announced the IA-64 (Itanium) architecture in 1997, they publicly acknowledged the use
of IMPACT technology in deriving critical performance results.

Wen-mei Hwu received ACM SIGARCH's inaugural Maurice Wilkes Award in 1998 for this
work, and the HKN Outstanding Young Electrical Engineer Award in 1993.

### 6.6 Superblock vs. Trace: Trade-off Analysis

| Aspect              | Trace (Fisher)            | Superblock (Hwu et al.)    |
|--------------------:|:-------------------------:|:--------------------------:|
| Side entries        | Yes                       | No                         |
| Side exits          | Yes                       | Yes                        |
| Compensation code   | Above-join + below-branch | Below-branch only          |
| Code duplication    | None                      | Tail duplication required  |
| Code size           | Smaller                   | Larger (duplicated tails)  |
| Scheduler complexity| Higher (bookkeeping)      | Lower (simpler constraints)|
| Schedule quality    | Good (but constrained)    | Better (fewer constraints) |
| Profile dependency  | Moderate                  | Higher (need to know which |
|                     |                           | paths to duplicate)        |

---

## Chapter 7: Hyperblock Formation (Mahlke et al., 1992)

### 7.1 Predicated Execution

A **predicated instruction** is an instruction that is guarded by a boolean predicate
register. The instruction is fetched, decoded, and dispatched regardless of the predicate
value, but its result is committed (written back) only if the predicate is true. If the
predicate is false, the instruction becomes a no-op.

```
    // Conventional code:
    if (r1 > 0) {
        r2 = r3 + r4;
    } else {
        r2 = r5 - r6;
    }

    // Predicated code:
    p1, p2 = compare(r1 > 0)         // p1 = true if r1>0, p2 = !p1
    (p1) r2 = r3 + r4                // Executes only if p1 is true
    (p2) r2 = r5 - r6                // Executes only if p2 is true
```

Predicated execution eliminates the branch entirely, converting control flow into data
flow. This is beneficial when:
- The branch is hard to predict
- Both paths are short
- The machine has sufficient functional units to execute both paths in parallel

Architectures with hardware predication support include:
- **IA-64 (Itanium)**: 64 one-bit predicate registers, all instructions predicable
- **ARM (AArch32)**: 4-bit condition field on most instructions (15 conditions + always)
- **NVIDIA GPUs**: Per-thread predication for warp divergence handling
- **TI C6x DSP**: Conditional execution on most instructions

### 7.2 If-Conversion

**If-conversion** is the compiler transformation that converts branchy control flow into
predicated straight-line code. The algorithm:

```
ALGORITHM: IfConvert(region)
─────────────────────────────
Input:  A region of the CFG containing if-then-else structures
Output: Predicated straight-line code

1.  Compute the control dependence graph (CDG) for the region
2.  FOR each branch instruction B in the region DO
3.      Compute the predicate condition for each path from B
4.      // True path gets predicate p, false path gets predicate !p
5.      Assign predicate registers p_true, p_false for B
6.      Add predicate-defining instruction: (p_true, p_false) ← CMP(cond)
7.  END FOR
8.
9.  FOR each non-branch instruction I in the region DO
10.     Compute the conjunction of predicates on I's path from region entry
11.     // I is control-dependent on branches B₁, B₂, ..., Bₘ
12.     // I's predicate = p_B₁ AND p_B₂ AND ... AND p_Bₘ
13.     Guard I with its computed predicate
14. END FOR
15.
16. Remove all branch instructions (they are replaced by predicate computations)
17. Linearize the remaining instructions into a single sequence
18. RETURN predicated sequence
```

### 7.3 The Hyperblock

A **hyperblock** is a set of predicated basic blocks forming a single-entry, multiple-exit
region where:
- Control enters only at the top
- Internal branches are converted to predicated execution via if-conversion
- External branches (exits from the hyperblock) remain as conditional branches
- Multiple control flow paths coexist in the same scheduling region, guarded by predicates

```
    ORIGINAL CFG:                      HYPERBLOCK:
    ┌─────┐                           ┌──────────────────────┐
    │  A  │                           │  A instructions      │
    │if(x)│                           │  p1,p2 ← CMP(x)     │
    └──┬──┘                           │  (p1) B instructions │
   T ╱    ╲ F                         │  (p2) C instructions │
  ┌────┐ ┌────┐                       │  D instructions      │
  │ B  │ │ C  │                       └──────────────────────┘
  └─┬──┘ └─┬──┘                       Single entry, one block
    │      │                           All paths predicated
    └──┬───┘
    ┌──▼──┐
    │  D  │
    └─────┘
```

The key advantage of the hyperblock over the superblock: where a superblock includes only
ONE path through the region (the predicted hot path), a hyperblock includes ALL paths,
predicated so they execute simultaneously. This eliminates the need for any compensation
code (there are no off-trace paths --- all paths are in the hyperblock).

### 7.4 Hyperblock Formation Algorithm

```
ALGORITHM: FormHyperblock(CFG, profile)
────────────────────────────────────────
Input:  CFG with profile data
Output: Set of hyperblocks

1.  // Step 1: Identify candidate regions
2.  //   Regions are hammock-shaped subgraphs: single entry, single exit,
3.  //   with internal if-then-else structures
4.  candidates ← FindHammockRegions(CFG)
5.
6.  FOR each candidate region R DO
7.      // Step 2: Block selection
8.      //   Not all blocks in the region should be included.
9.      //   Exclude blocks that are:
10.     //   (a) Too infrequently executed (predicated execution wastes resources)
11.     //   (b) Contain instructions that cannot be predicated (system calls,
12.     //       certain memory operations)
13.     //   (c) Would increase resource pressure beyond available functional units
14.     selected ← ∅
15.     FOR each block B in R DO
16.         IF freq(B) / freq(entry(R)) > THRESHOLD AND
17.            AllInstructionsPredicable(B) AND
18.            ResourcePressureAcceptable(selected ∪ {B}) THEN
19.             selected ← selected ∪ {B}
20.         END IF
21.     END FOR
22.
23.     // Step 3: Tail duplication for blocks with side entries
24.     //   Same as superblock formation --- eliminate side entries
25.     TailDuplicate(selected)
26.
27.     // Step 4: If-conversion
28.     //   Convert internal branches to predicated execution
29.     predicated_code ← IfConvert(selected)
30.
31.     // Step 5: Form the hyperblock
32.     hyperblock ← CreateHyperblock(predicated_code)
33.     Add hyperblock to result set
34. END FOR
35.
36. RETURN result set
```

### 7.5 Hyperblock vs. Superblock

| Aspect               | Superblock              | Hyperblock               |
|---------------------:|:-----------------------:|:------------------------:|
| Paths included       | One (hot path only)     | Multiple (all paths)     |
| Predication required | No                      | Yes                      |
| Hardware requirement | None                    | Predicate registers      |
| Code duplication     | Tail duplication        | Tail duplication + none  |
|                      |                         | for internal branches    |
| Compensation code    | Below-branch only       | None for internal        |
|                      |                         | branches                 |
| Resource utilization | May underutilize FUs    | Better utilization       |
|                      | when path is short      | (multiple paths fill FUs)|
| Wasted work          | None (only hot path)    | Yes (cold path executes  |
|                      |                         | but results discarded)   |

### 7.6 Worked Example: Hyperblock Formation

Consider a function with nested if-then-else:

```
    // Source code:
    if (a > 0) {
        x = a + b;          // Block B: 1 instruction
        if (c > 0) {
            y = x * c;      // Block D: 1 instruction
        } else {
            y = x + c;      // Block E: 1 instruction
        }
    } else {
        x = b - a;          // Block C: 1 instruction
        y = x * 2;          // Block C: 1 instruction
    }
    z = x + y;              // Block F: 1 instruction

    ORIGINAL CFG:
    ┌─────┐
    │  A  │  if (a > 0)
    └──┬──┘
   T ╱    ╲ F
  ┌────┐  ┌────┐
  │ B  │  │ C  │  x = a+b    |  x = b-a; y = x*2
  └─┬──┘  └─┬──┘
    │       │
  ┌─▼─┐    │
  │ G │    │     if (c > 0)
  └─┬─┘    │
 T ╱  ╲ F  │
┌───┐┌───┐ │
│ D ││ E │ │    y = x*c  |  y = x+c
└─┬─┘└─┬─┘ │
  └──┬──┘   │
     └──┬───┘
     ┌──▼──┐
     │  F  │  z = x + y
     └─────┘

    STEP 1: Block selection (profile: a>0 taken 60%, c>0 taken 50%)
      All blocks are small and predicable → include all.

    STEP 2: If-conversion
      Predicate p1 = (a > 0),  p2 = !(a > 0)
      Predicate p3 = (c > 0) AND p1,  p4 = !(c > 0) AND p1

    HYPERBLOCK (IA-64 style):
    ┌────────────────────────────────────────────┐
    │  p1, p2  ← cmp.gt a, 0                    │
    │  (p1) x  ← a + b                          │
    │  (p2) x  ← b - a                          │
    │  (p1) p3, p4 ← cmp.gt c, 0                │
    │  (p2) y  ← x * 2                          │
    │  (p3) y  ← x * c                          │
    │  (p4) y  ← x + c                          │
    │  z ← x + y                                │
    └────────────────────────────────────────────┘

    8 instructions, NO branches, fully predicated.
    On a 4-issue machine, this can execute in 3-4 cycles
    (vs. 6-8 cycles with branches and misprediction penalties).
```

Note the key challenge: the writes to `x` by blocks B and C are mutually exclusive
(guarded by p1 and p2), so they do not create a WAW conflict. The hardware predication
ensures only one write is committed. Similarly, the three writes to `y` are mutually
exclusive (guarded by p2, p3, and p4). The compiler must verify this mutual exclusivity
through predicate analysis.

### 7.7 Predicate Analysis

For correct hyperblock scheduling, the compiler must determine which predicates are
**mutually exclusive** (can never both be true simultaneously). This is essential for:

1. **Eliminating false dependencies**: Two writes guarded by mutually exclusive predicates
   do not create a WAW dependency.
2. **Register sharing**: Values guarded by mutually exclusive predicates can share the
   same register.
3. **Resource sharing**: Predicated instructions on exclusive paths can share functional
   units without conflict.

```
    Mutual exclusivity analysis:
    
    p1 = (a > 0)
    p2 = !(a > 0)        → p1 and p2 are mutually exclusive (complements)
    p3 = (c > 0) AND p1  → p3 implies p1
    p4 = !(c > 0) AND p1 → p4 implies p1
    
    Mutual exclusivity set:
    {p1, p2}, {p3, p4}, {p2, p3}, {p2, p4}, {p3, p4, p2}
    
    (p1) x ← a + b       }
    (p2) x ← b - a       } NO WAW conflict: p1 ⊥ p2
    
    (p2) y ← x * 2       }
    (p3) y ← x * c       } NO WAW conflict: all three are pairwise exclusive
    (p4) y ← x + c       }
```

The IMPACT compiler pioneered predicate analysis algorithms that track these
relationships through chains of predicate-defining comparisons. The IA-64 architecture
was specifically designed to support this analysis with its 64 predicate registers and
parallel compare instructions that write complementary predicate pairs.

### 7.8 When to Use Hyperblocks vs. Superblocks

Hyperblocks are preferred when:
- The hardware supports predicated execution
- Both paths of a branch are short (few instructions)
- The branch is hard to predict (close to 50/50)
- The machine has many functional units (can absorb the wasted work)

Superblocks are preferred when:
- The hardware lacks predication support
- One path is much more frequent than the other (high branch bias)
- The paths are long (predicated execution wastes too many resources)
- The machine has few functional units (cannot afford wasted work)

### 7.9 The Predication Threshold

A key parameter in hyperblock formation is the **predication threshold**: the minimum
execution frequency (relative to the region entry) for a block to be included in the
hyperblock. Blocks below the threshold are excluded from if-conversion.

```
    Example: Region entry frequency = 1000
    Threshold = 10%  (block must execute at least 100 times)
    
    Block frequencies: A=1000, B=600, C=400, D=300, E=100, F=50, G=20
    
    At threshold 10%: Include A, B, C, D, E  (≥100)
                      Exclude F, G           (<100)
                      F and G remain as branches (not predicated)
    
    At threshold 5%:  Include A, B, C, D, E, F  (≥50)
                      Exclude G                  (<50)
    
    At threshold 1%:  Include all blocks         (≥10)
                      Maximum predication, maximum wasted work
```

Lower thresholds produce larger hyperblocks with more ILP potential but also more wasted
work. The optimal threshold depends on the machine's issue width and functional unit
count: wider machines can tolerate lower thresholds because they have idle slots to
absorb the wasted predicated instructions.

---

## Chapter 8: Treegion Scheduling (Schlansker, Rau, et al.)

### 8.1 Beyond Linear Traces

Both traces and superblocks are **linear** --- they represent a single path through the
CFG. This means the scheduler optimizes for one path at a time, potentially missing
opportunities to share instructions or exploit parallelism across multiple paths.

A **treegion** is a tree-shaped subgraph of the CFG: a single-entry, multiple-exit region
where the internal structure is a tree (each block has at most one predecessor within the
treegion). Unlike a trace, which follows one branch at each fork, a treegion includes
ALL branches from each fork point.

```
    TRACE through a fork:              TREEGION including both paths:

    ┌─────┐                            ┌─────┐
    │  A  │                            │  A  │
    └──┬──┘                            └──┬──┘
       │                            ╱        ╲
    ┌──▼──┐ (only hot path)     ┌─────┐    ┌─────┐
    │  B  │                     │  B  │    │  C  │
    └──┬──┘                     └──┬──┘    └──┬──┘
       │                        ╱    ╲        │
    ┌──▼──┐                  ┌────┐ ┌────┐ ┌──▼──┐
    │  D  │                  │ D  │ │ E  │ │  F  │
    └─────┘                  └────┘ └────┘ └─────┘

    Trace = [A, B, D]         Treegion includes A, B, C, D, E, F
    Misses C, E, F             Schedules ALL paths together
```

### 8.2 Natural Treegion Formation

The natural treegion formation algorithm requires only a single pass over the CFG:

```
ALGORITHM: FormNaturalTreegions(CFG)
─────────────────────────────────────
Input:  CFG = (V, E, entry)
Output: A set of treegions covering all blocks

1.  worklist ← {entry}
2.  treegions ← ∅
3.  assigned ← ∅
4.
5.  WHILE worklist ≠ ∅ DO
6.      root ← DEQUEUE(worklist)
7.      IF root ∈ assigned THEN CONTINUE
8.
9.      treegion ← {root}
10.     queue ← {root}
11.
12.     WHILE queue ≠ ∅ DO
13.         block ← DEQUEUE(queue)
14.         FOR each successor s of block DO
15.             IF s ∉ assigned AND
16.                s has exactly ONE predecessor in treegion AND
17.                s has NO other predecessors outside treegion THEN
18.                 // s can be absorbed (single predecessor = tree structure)
19.                 treegion ← treegion ∪ {s}
20.                 queue ← queue ∪ {s}
21.             ELSE
22.                 // s is a merge point; it becomes a sapling (future root)
23.                 IF s ∉ assigned THEN
24.                     worklist ← worklist ∪ {s}
25.                 END IF
26.             END IF
27.         END FOR
28.     END WHILE
29.
30.     assigned ← assigned ∪ treegion
31.     treegions ← treegions ∪ {treegion}
32. END WHILE
33.
34. RETURN treegions
```

### 8.3 Advantages of Treegions

1. **No profile data required**: Natural treegion formation depends only on the CFG
   structure (merge points), not on execution frequencies. This makes it suitable for
   static compilation without a profiling step.

2. **Multiple paths scheduled together**: Instructions common to multiple paths can be
   shared, reducing total code size and improving cache utilization.

3. **No special hardware required**: Unlike hyperblocks, treegions do not require
   predicated execution support. Speculation is handled via compensation code.

4. **Larger scheduling regions**: Treegions are generally larger than traces or
   superblocks, providing more scheduling freedom.

### 8.4 Tail Duplication for Treegions

Treegions can be further enlarged by tail-duplicating merge points (blocks with multiple
predecessors). The **Instantaneous Code Size Efficiency (ICSE)** metric guides this:

```
    ICSE = ΔIPC / ΔCodeSize
```

Blocks with high ICSE (large IPC improvement relative to code size increase) are
duplicated first. The algorithm iterates until the ICSE drops below a threshold or
resource constraints are reached.

### 8.5 Tree Traversal Scheduling

Scheduling instructions within a treegion uses a modified list scheduling algorithm:

1. Sort basic blocks by depth-first traversal, visiting the highest-frequency child first
2. Begin list scheduling from the root block
3. At each fork, consider speculative instructions from both children
4. Prioritize by: execution frequency, number of exits dominated, dependency height

This approach was described by Schlansker and Rau at HP Labs and later implemented
experimentally in GCC on the `sched-treegion-branch`.

---

## Chapter 9: Region-Based Scheduling

### 9.1 Arbitrary CFG Regions

Region-based scheduling generalizes all previous approaches by allowing the scheduling
region to be an arbitrary connected subgraph of the CFG, not just a linear trace,
a superblock, or a tree. The IMPACT compiler's region formation algorithm (Hank et al.)
is the primary example.

A **region** R ⊆ V is a connected subgraph of the CFG. The scheduler builds a combined
dependency DAG for all blocks in R, including inter-block dependencies and control
dependencies, and schedules the entire region as a unit.

### 9.2 Region Formation

Region formation in the IMPACT compiler follows these principles:

1. **Start with a seed block** (highest frequency unscheduled block)
2. **Grow the region** by adding adjacent blocks that improve expected ILP
3. **Limit region size** to control compilation time and register pressure
4. **Handle merge points and loops** with appropriate compensation strategies

The key difference from trace selection: regions can include multiple paths through
a branch, allowing the scheduler to make globally better decisions about code placement.

### 9.3 Region Formation Algorithm

```
ALGORITHM: FormRegions(CFG, profile)
─────────────────────────────────────
Input:  Weighted CFG with profile data
Output: A set of scheduling regions

1.  regions ← ∅
2.  unassigned ← V
3.
4.  WHILE unassigned ≠ ∅ DO
5.      // Seed selection: highest-frequency unassigned block
6.      seed ← argmax_{B ∈ unassigned} freq(B)
7.      region ← {seed}
8.
9.      // Grow region by adding profitable neighbors
10.     REPEAT
11.         best_candidate ← null
12.         best_benefit ← 0
13.
14.         FOR each block B adjacent to region (successor or predecessor) DO
15.             IF B ∈ unassigned THEN
16.                 benefit ← EstimateILPBenefit(region, B)
17.                 cost ← EstimateCompensationCost(region, B)
18.                 reg_pressure ← EstimateRegPressure(region ∪ {B})
19.
20.                 net ← benefit - cost
21.                 IF net > best_benefit AND
22.                    reg_pressure ≤ MAX_REG_PRESSURE AND
23.                    |region| + |B| ≤ MAX_REGION_SIZE THEN
24.                     best_candidate ← B
25.                     best_benefit ← net
26.                 END IF
27.             END IF
28.         END FOR
29.
30.         IF best_candidate ≠ null THEN
31.             region ← region ∪ {best_candidate}
32.             unassigned ← unassigned - {best_candidate}
33.         END IF
34.     UNTIL best_candidate = null OR |region| ≥ MAX_REGION_SIZE
35.
36.     regions ← regions ∪ {region}
37.     unassigned ← unassigned - region
38. END WHILE
39.
40. RETURN regions
```

### 9.4 Benefit Estimation

The `EstimateILPBenefit` function evaluates how much additional parallelism is gained
by adding block B to the region. This estimate considers:

1. **Independent instructions**: How many instructions in B are independent of
   instructions in the current region? These can fill otherwise-empty VLIW slots.

2. **Latency hiding**: Can long-latency instructions from B overlap with instructions
   in the region?

3. **Frequency alignment**: Is B on a hot path through the region? Optimizing B
   provides more benefit if it executes frequently.

```
    EstimateILPBenefit(region, B) ≈
        freq(B) × (independent_insns(B, region) / total_insns(B))
        × (1 + latency_hiding_factor(B, region))
```

### 9.5 Challenges of Region-Based Scheduling

Region-based scheduling is the most general but also the most complex approach:

- **Compensation code**: Any code motion across region boundaries requires compensation
  on all affected off-region paths. For arbitrary regions with multiple entries and
  exits, the number of compensation points grows combinatorially.

- **Dependency analysis**: The dependency DAG must include control dependencies and
  memory dependencies across all blocks in the region. For N blocks with M instructions
  each, the dependency analysis is O(N² × M²) in the worst case.

- **Scheduling complexity**: The number of instructions in a region can be very large
  (hundreds of instructions), making the list scheduling problem harder. The ready list
  management becomes O(n log n) per scheduling step.

- **Register pressure**: Scheduling many instructions simultaneously increases the
  number of simultaneously live variables. A region of 200 instructions may have 40-60
  live registers at peak, exceeding the physical register count and forcing spills.

- **Compilation time**: Region-based scheduling is the slowest of all scheduling
  approaches. For large functions (>1000 instructions), it may dominate total
  compilation time. The IMPACT compiler addressed this with a region size limit
  (typically 100-200 instructions per region).

In practice, region-based scheduling provides the best schedule quality but at the
highest compilation cost. It is most appropriate for high-performance computing
applications where compilation time is less important than execution time.

### 9.6 Comparison of All Region Types

```
    ┌──────────────┬──────────┬───────────┬──────────┬────────────┬────────────┐
    │              │ Basic    │ Super-    │ Hyper-   │            │ Arbitrary  │
    │ Property     │ Trace    │ block     │ block    │ Treegion   │ Region     │
    ├──────────────┼──────────┼───────────┼──────────┼────────────┼────────────┤
    │ Shape        │ Linear   │ Linear    │ Linear   │ Tree       │ Any DAG    │
    │ Entries      │ Multiple │ Single    │ Single   │ Single     │ Multiple   │
    │ Exits        │ Multiple │ Multiple  │ Multiple │ Multiple   │ Multiple   │
    │ Paths        │ One      │ One       │ Multiple │ Multiple   │ Multiple   │
    │ Profile req. │ Yes      │ Yes       │ Yes      │ No*        │ Yes        │
    │ HW req.      │ None     │ None      │ Predicn  │ None       │ None       │
    │ Comp. code   │ Both     │ Below-br  │ Minimal  │ Below-br   │ Both       │
    │ Code dup.    │ No       │ Tail dup  │ Tail dup │ Optional   │ No         │
    │ Complexity   │ Medium   │ Low       │ Medium   │ Medium     │ High       │
    └──────────────┴──────────┴───────────┴──────────┴────────────┴────────────┘
    * Treegions can use profile data for tail duplication decisions but
      don't require it for basic formation.
```

---

## Chapter 10: Profile-Guided vs. Static Trace Selection

### 10.1 Profile-Guided Trace Selection

Profile-guided optimization (PGO), also known as feedback-directed optimization (FDO),
uses execution frequency data collected from a **training run** to weight the CFG edges.
The trace selection algorithm then uses these weights to identify the hottest paths.

The PGO workflow:

```
    ┌──────────────────────────────────────────────────────────────┐
    │  1. INSTRUMENT: Compile with instrumentation (-fprofile-gen) │
    │     Insert counters on CFG edges                             │
    ├──────────────────────────────────────────────────────────────┤
    │  2. TRAIN: Run the instrumented binary on representative     │
    │     input data                                               │
    ├──────────────────────────────────────────────────────────────┤
    │  3. COLLECT: Gather edge frequency data from the training    │
    │     run into .gcda files (GCC) or .profdata files (LLVM)     │
    ├──────────────────────────────────────────────────────────────┤
    │  4. OPTIMIZE: Recompile with profile data (-fprofile-use)    │
    │     Trace selection uses measured frequencies                 │
    └──────────────────────────────────────────────────────────────┘
```

### 10.2 Static Heuristics

When profile data is unavailable, compilers use **static branch prediction heuristics**
to estimate edge frequencies. Common heuristics (from Ball and Larus, 1993):

| Heuristic              | Prediction                                    | Accuracy |
|-----------------------:|:---------------------------------------------:|:--------:|
| Loop branch            | Back edge is taken (loop continues)           | ~88%     |
| Pointer comparison     | Pointer != NULL is likely                     | ~85%     |
| Opcode                 | Integer comparison < 0 is unlikely            | ~84%     |
| Guard                  | Branch guarding error/exception is unlikely   | ~80%     |
| Call                   | Function call returns (not exit/abort)        | ~98%     |
| Return                 | Return is taken (function returns normally)   | ~95%     |
| Negative               | Negative comparisons are unlikely             | ~75%     |

These heuristics can be combined using Dempster-Shafer theory to produce composite
probabilities for each branch.

### 10.3 GCC's Implementation

GCC supports both profile-guided and static trace selection:

- **`-fprofile-generate`**: Compile with edge profiling instrumentation
- **`-fprofile-use`**: Recompile using collected profile data
- **`-fguess-branch-probability`**: Use static heuristics (enabled by default at -O2)
- **`-freorder-blocks`**: Reorder basic blocks to improve code locality
- **`-freorder-blocks-and-partition`**: Separate hot and cold code

### 10.4 LLVM's Implementation

LLVM supports multiple PGO modes:

- **Instrumentation-based PGO**: `-fprofile-instr-generate` / `-fprofile-instr-use`
  Instruments at the LLVM IR level for better precision.
- **Sample-based PGO**: Uses hardware performance counters (e.g., Linux perf) to
  collect execution profiles without instrumentation overhead.
- **BOLT**: Post-link binary optimization that uses profile data to reorder functions
  and basic blocks in the final binary.

### 10.5 The Accuracy Trade-off

| Approach           | Accuracy  | Build Complexity | Applicability        |
|-------------------:|:---------:|:----------------:|:--------------------:|
| Profile-guided     | High      | High (2 builds)  | When inputs are known|
| Static heuristics  | Moderate  | Low (1 build)    | Always               |
| Sample-based       | High      | Medium           | Production profiling |
| Combined           | Highest   | High             | Best of both worlds  |

Profile-guided optimization typically provides 10-30% speedup over static heuristics for
trace scheduling, with the largest gains on programs with highly biased branches and
irregular control flow.

### 10.6 Edge Profiling vs. Path Profiling

Standard edge profiling counts the execution frequency of each CFG edge. This is
sufficient for trace selection (the greedy algorithm only needs to compare edge
frequencies). However, edge profiles lose information about **correlated branches** ---
cases where the outcome of one branch predicts the outcome of a later branch.

```
    EXAMPLE: Correlated branches

    if (x > 0) {        // Branch B1: 50/50
        a = x + 1;
    }
    ...
    if (x > 0) {        // Branch B2: 50/50
        b = a + 2;      // Always taken when B1 is taken
    }

    Edge profile says: B1 taken 50%, B2 taken 50%
    But the PATH B1-taken → B2-taken has frequency 50%
    and the PATH B1-not-taken → B2-not-taken has frequency 50%
    The paths B1-taken → B2-not-taken and B1-not-taken → B2-taken
    have frequency 0% (they never occur).

    With edge profiling only, the trace selector cannot discover this
    correlation. With path profiling, it can select the correlated path
    [B1-taken, ..., B2-taken] as a single trace.
```

**Path profiling** (Ball and Larus, 1996) counts the execution frequency of each
acyclic path through a function. This provides strictly more information than edge
profiling but at higher overhead (more counters, larger profile data).

In practice, edge profiling is the standard approach because:
1. It requires fewer counters (one per edge vs. exponentially many paths)
2. The greedy trace selection algorithm uses edges, not paths
3. The additional benefit of path profiling is modest for most programs

### 10.7 Profiling Methodology and Pitfalls

The quality of profile-guided optimization depends critically on the **training input**.
If the training input is unrepresentative of production workloads, the profile data
may mislead the compiler:

**Common pitfalls:**

1. **Training input too small**: Small inputs may not exercise all code paths, leaving
   some edges with zero frequency. The compiler may inadvertently de-optimize cold
   code that is actually hot in production.

2. **Training input biased**: If the training input exercises one code path
   disproportionately, the compiler will optimize for that path at the expense of
   others. This can cause severe performance regression when production inputs differ.

3. **Non-deterministic behavior**: Programs with random components (games, simulations,
   network servers) produce different profiles on each run. Multiple training runs
   should be aggregated.

4. **Instrumentation overhead**: Instrumented binaries run 10-30% slower than
   uninstrumented ones. If the training input is time-sensitive (e.g., a network
   server with timeouts), the slowdown may cause different behavior.

**Best practices:**

- Use multiple representative inputs and merge the profile data
- Include both common-case and edge-case inputs
- Validate by comparing profiles from different inputs (stable profiles indicate
  good coverage)
- Use sample-based profiling for production workloads to avoid instrumentation
  overhead

---

# Part 3: Trace Compaction (The Scheduling Engine)

With traces selected, we now turn to the core scheduling engine: the algorithms that
compact (schedule) the instructions within a trace to minimize execution time. This is
the heart of trace scheduling.

---

## Chapter 11: The Compaction Problem Formalized

### 11.1 Problem Statement

**Given:**
- A trace T = [B₁, B₂, ..., Bₖ] consisting of instructions I₁, I₂, ..., Iₙ
- A machine description M = (FU, L, W) where:
  - FU is a set of functional units (ALU, multiplier, load unit, branch unit, etc.)
  - L is a latency function: L(I) gives the execution latency of instruction I
  - W is the issue width (maximum instructions issued per cycle)
- A dependency DAG D = (I, E) where edges represent ordering constraints with latencies

**Find:**
- A schedule S: I → Cycles that maps each instruction to a start cycle such that:
  1. **Dependency constraint**: For every edge (Iᵢ → Iⱼ) with latency l,
     S(Iⱼ) ≥ S(Iᵢ) + l
  2. **Resource constraint**: For every cycle c and functional unit type t,
     the number of instructions scheduled at cycle c that require unit type t
     does not exceed the number of available units of type t
  3. **Minimization**: The total schedule length max(S(I) + L(I)) - min(S(I))
     is minimized

This is a **constrained optimization problem**. As we will show in Part 6, it is
NP-hard for machines with more than one functional unit.

### 11.2 The Machine Description

Modern compilers describe the target machine using a combination of:

- **Instruction itineraries**: For each instruction class, a table of (cycle, resource)
  pairs describing which resources the instruction uses in which pipeline stage.
- **Functional unit tables**: The number and type of each functional unit.
- **Latency tables**: The number of cycles from instruction issue to result availability.
- **Bypass network**: Which results can be forwarded to which consumers without
  register-file delay.

Example machine description for a 4-issue VLIW:

```
    Machine: 4-issue VLIW
    ├── 2 × ALU units (1-cycle latency for add/sub/compare/logic)
    ├── 1 × MUL unit (3-cycle latency for integer multiply)
    ├── 1 × MEM unit (3-cycle latency for load, 1-cycle for store)
    ├── 1 × BR  unit (1-cycle latency for branches)
    └── Register file: 64 general-purpose registers

    Issue width: 4 (up to 4 instructions per cycle, one per unit type)

    Latency table:
    ┌─────────────┬─────────┬──────────┐
    │ Instruction │ Latency │ Unit     │
    ├─────────────┼─────────┼──────────┤
    │ ADD, SUB    │ 1       │ ALU      │
    │ MUL         │ 3       │ MUL      │
    │ LOAD        │ 3       │ MEM      │
    │ STORE       │ 1       │ MEM      │
    │ BRANCH      │ 1       │ BR       │
    │ CMP         │ 1       │ ALU      │
    │ SHIFT       │ 1       │ ALU      │
    └─────────────┴─────────┴──────────┘
```

---

## Chapter 12: Dependency Analysis for Traces

### 12.1 Cross-Block Dependencies

When scheduling a trace that spans multiple basic blocks, the dependency analysis must
extend beyond individual blocks. The dependencies include:

**Intra-block dependencies**: Standard RAW, WAR, WAW within each basic block (as
described in Chapter 2).

**Inter-block dependencies**: Dependencies between instructions in different blocks of
the trace. These are the same types (RAW, WAR, WAW) but now span block boundaries.

**Memory dependencies**: Two instructions that access memory may conflict if they access
the same address. Without perfect alias analysis, the compiler must conservatively assume
that any two memory accesses MAY conflict.

**Control dependencies**: An instruction I in block B is **control-dependent** on the
branch at the end of block A if:
- There exists a path from A to B in the CFG
- B post-dominates the successor of A on that path
- B does not strictly post-dominate A

Control dependencies constrain which instructions can be moved across branches.

### 12.2 The Extended Dependency DAG

```
ALGORITHM: BuildTraceDependencyDAG(trace)
──────────────────────────────────────────
Input:  A trace T = [B₁, B₂, ..., Bₖ] with all instructions
Output: A dependency DAG for the entire trace

1.  // Collect all instructions in trace order
2.  instructions ← concatenate(B₁.instructions, B₂.instructions, ..., Bₖ.instructions)
3.
4.  // Build data dependency edges (RAW, WAR, WAW)
5.  // across ALL block boundaries in the trace
6.  FOR each pair (Iᵢ, Iⱼ) with i < j DO
7.      // RAW: Iⱼ reads a register/memory that Iᵢ writes
8.      IF Iⱼ reads reg r AND Iᵢ is the most recent writer of r before Iⱼ THEN
9.          Add RAW edge Iᵢ → Iⱼ with latency L(Iᵢ)
10.     END IF
11.     // WAR: Iⱼ writes a register/memory that Iᵢ reads
12.     IF Iⱼ writes reg r AND Iᵢ reads r AND no intervening write between them THEN
13.         Add WAR edge Iᵢ → Iⱼ with latency 0
14.     END IF
15.     // WAW: both write the same register/memory
16.     IF Iⱼ writes reg r AND Iᵢ writes r AND Iᵢ is most recent writer before Iⱼ THEN
17.         Add WAW edge Iᵢ → Iⱼ with latency 0
18.     END IF
19. END FOR
20.
21. // Memory dependencies
22. FOR each pair of memory instructions (Iᵢ, Iⱼ) with i < j DO
23.     IF MayAlias(Iᵢ.address, Iⱼ.address) THEN
24.         IF Iᵢ is store AND Iⱼ is load THEN   // RAW through memory
25.             Add edge Iᵢ → Iⱼ with latency L(Iᵢ)
26.         ELSE IF Iᵢ is load AND Iⱼ is store THEN  // WAR through memory
27.             Add edge Iᵢ → Iⱼ with latency 0
28.         ELSE IF Iᵢ is store AND Iⱼ is store THEN // WAW through memory
29.             Add edge Iᵢ → Iⱼ with latency 0
30.         END IF
31.     END IF
32. END FOR
33.
34. // Control dependencies
35. FOR each branch instruction Bᵣ in the trace DO
36.     FOR each instruction I that is control-dependent on Bᵣ DO
37.         Add control-dependence edge Bᵣ → I
38.     END FOR
39. END FOR
40.
41. RETURN DAG
```

### 12.3 The Importance of Alias Analysis

Memory alias analysis is critical for enabling code motion across memory operations.
Without alias analysis, every load must be ordered after every preceding store, and every
store must be ordered after every preceding load and store. This severely limits
scheduling freedom.

**Levels of alias analysis:**

1. **No analysis (conservative)**: Assume all memory operations may alias. Very safe but
   allows almost no reordering of memory operations.

2. **Type-based alias analysis (TBAA)**: Use the type system to prove non-aliasing.
   For example, a `float*` and an `int*` cannot alias in C (strict aliasing rule).

3. **Points-to analysis**: Track which pointers may point to which memory locations.
   More precise but more expensive.

4. **Array dependence analysis**: For array accesses in loops, use the GCD test, Banerjee
   test, or Omega test to prove independence.

5. **Memory disambiguation**: At the instruction level, prove that two specific
   load/store instructions access different addresses (e.g., different base registers,
   constant offsets that do not overlap).

Each level of analysis enables more aggressive code motion and thus better schedules.

---

## Chapter 13: List Scheduling for Traces

### 13.1 Extending List Scheduling to Traces

The list scheduling algorithm for traces is essentially the same as for basic blocks
(Chapter 2.3), but with three critical extensions:

1. **The dependency DAG spans the entire trace** (multiple basic blocks)
2. **Code motion across block boundaries** may require compensation code
3. **Speculative execution** may be used to move instructions above branches

```
ALGORITHM: TraceListSchedule(trace, DAG, machine)
──────────────────────────────────────────────────
Input:  A trace with its extended dependency DAG
        Machine description
Output: A compacted schedule for the trace
        Compensation code for off-trace paths

1.  // Phase 1: Compute priorities (critical path from each node to trace exit)
2.  FOR each node n in reverse topological order DO
3.      priority[n] ← latency(n) + max({priority[s] + edge_lat(n,s) :
4.                                      s ∈ successors(n)})
5.  END FOR
6.
7.  // Phase 2: Initialize
8.  cycle ← 0
9.  ready ← {n : n has no unscheduled predecessors in DAG}
10. scheduled ← ∅
11. compensation ← ∅        // Track required compensation code
12.
13. // Phase 3: Schedule loop
14. WHILE |scheduled| < |all instructions| DO
15.     candidates ← ∅
16.     FOR each n ∈ ready DO
17.         earliest ← max({schedule[p] + latency(p→n) : p ∈ predecessors(n)})
18.         IF earliest ≤ cycle AND
19.            resource_available(n, cycle, machine) THEN
20.             candidates ← candidates ∪ {n}
21.         END IF
22.     END FOR
23.
24.     IF candidates ≠ ∅ THEN
25.         // Select highest-priority candidate
26.         best ← argmax_{n ∈ candidates} priority[n]
27.         schedule[best] ← cycle
28.         scheduled ← scheduled ∪ {best}
29.         reserve_resources(best, cycle, machine)
30.
31.         // Check if this instruction has been moved across any boundaries
32.         IF best was moved across a branch or join THEN
33.             Record compensation requirements in compensation
34.         END IF
35.
36.         // Update ready list
37.         FOR each unscheduled successor s of best DO
38.             IF all predecessors of s are scheduled THEN
39.                 ready ← ready ∪ {s}
40.             END IF
41.         END FOR
42.     ELSE
43.         cycle ← cycle + 1      // No candidates; advance clock
44.     END IF
45. END WHILE
46.
47. // Phase 4: Insert compensation code
48. InsertCompensationCode(compensation, CFG)
49.
50. RETURN schedule
```

### 13.2 Handling VLIW Instruction Words

On a VLIW machine, each cycle corresponds to one **very long instruction word** containing
slots for each functional unit. The scheduler must fill as many slots as possible per
cycle:

```
    Cycle 0: [ALU: add r1,r2,r3 | MUL: mul r4,r5,r6 | MEM: load r7,[r8] | BR: nop ]
    Cycle 1: [ALU: sub r9,r1,r10 | MUL: nop          | MEM: nop          | BR: nop ]
    Cycle 2: [ALU: nop           | MUL: nop          | MEM: nop          | BR: nop ]
    Cycle 3: [ALU: add r11,r7,r4 | MUL: nop          | MEM: store r11,[r12]| BR: bne ]
```

Empty slots are filled with NOPs, which waste instruction memory bandwidth. A key goal
of trace scheduling is to minimize the number of NOP slots by finding enough independent
instructions to fill each VLIW word.

---

## Chapter 14: Priority Functions in Detail

### 14.1 Critical Path (CP)

The critical path priority is the most widely used heuristic. It computes the length
of the longest path from each instruction to the end of the trace (or DAG exit),
measured in cycles.

```
    DEFINITION: CP(n) = latency(n) + max(CP(s) + edge_latency(n, s))
                        for all successors s of n
                CP(n) = latency(n)  if n has no successors

    EXAMPLE:
                I1 (lat=3)
               ╱         ╲
              ╱           ╲
         I2 (lat=1)    I3 (lat=3)
              ╲           ╱
               ╲         ╱
                I4 (lat=1)
                   │
                I5 (lat=1)

    CP(I5) = 1
    CP(I4) = 1 + 1 = 2
    CP(I3) = 3 + 2 = 5
    CP(I2) = 1 + 2 = 3
    CP(I1) = 3 + max(3, 5) = 3 + 5 = 8

    Schedule order (highest CP first): I1, I3, I2, I4, I5
```

Instructions with the highest CP value are on the critical path. Scheduling them first
ensures that the critical path is not unnecessarily lengthened by resource conflicts.

### 14.2 Resource Pressure

When multiple instructions are tied on critical path priority, the resource pressure
heuristic breaks the tie by preferring the instruction that uses the scarcest resource.

```
    DEFINITION: ResourcePressure(n) = Σ (usage(n, r) / availability(r))
                for all resources r used by n

    If instruction I1 uses the only multiplier and instruction I2 uses one of
    two ALUs, then I1 has higher resource pressure (1/1 > 1/2) and should be
    scheduled first when resources are available.
```

### 14.3 Mobility (Slack)

The **slack** or **mobility** of an instruction measures how much scheduling freedom it
has. An instruction with zero slack is on the critical path and MUST be scheduled at its
earliest possible time to avoid increasing the schedule length.

```
    DEFINITION:
        ASAP(n) = max(ASAP(p) + latency(p → n))  for all predecessors p
                  (0 if n has no predecessors)

        ALAP(n) = min(ALAP(s) - latency(n → s))  for all successors s
                  (target_length - latency(n) if n has no successors)

        slack(n) = ALAP(n) - ASAP(n)

    PROPERTY: slack(n) ≥ 0 for all n
              slack(n) = 0 iff n is on the critical path
```

Low-slack instructions should be prioritized because delaying them risks extending the
schedule. High-slack instructions have room to be deferred without penalty.

### 14.4 Combined Priority

In practice, compilers use a **lexicographic** combination of priority functions:

```
    Priority(n) = (CP(n), ResourcePressure(n), -slack(n), SourceOrder(n))

    Compare by CP first. If tied, compare by ResourcePressure.
    If still tied, compare by slack (lower slack = higher priority).
    Final tiebreaker: original source order.
```

This multi-level priority scheme is used in LLVM's MachineScheduler, GCC's instruction
scheduler, and most research compilers.

---

## Chapter 15: Speculative Code Motion

### 15.1 What is Speculation?

**Speculative code motion** means moving an instruction above a branch, so that it
executes regardless of whether the branch is taken. The instruction is executed
**speculatively** --- it may not have been needed if the branch had gone the other way.

```
    BEFORE speculation:              AFTER speculation:
    ┌─────────────┐                 ┌─────────────┐
    │ ...         │                 │ ...         │
    │ if (cond)   │                 │ r2 ← load [r1]  ← moved up
    └──┬──────────┘                 │ if (cond)   │
       │                            └──┬──────────┘
    ┌──▼──────────┐                    │
    │ r2 ← load [r1]              ┌──▼──────────┐
    │ r3 ← r2 + 1│                │ r3 ← r2 + 1│   ← uses speculated result
    └─────────────┘                └─────────────┘
```

The load of r2 is moved above the branch. If the branch was taken (into the block), the
load result is ready sooner, hiding the load latency behind the branch evaluation. If
the branch was NOT taken, the load was wasted work --- but on VLIW machines with many
functional units, wasted work on an otherwise-idle unit costs nothing.

### 15.2 The Profitability of Speculation

Not all speculation is profitable. The scheduler must weigh the expected benefit
(latency hiding) against the costs (wasted work, resource consumption, compensation
code). The profitability depends on:

```
    Expected benefit of speculating instruction I above branch B:

    benefit = P(B taken toward I) × latency_saved(I)
    cost    = P(B NOT taken toward I) × resource_cost(I)
              + compensation_code_size(I)
              + exception_risk(I)

    Speculate if benefit > cost.

    Example:
      Branch B taken 90% of the time toward I's block
      I is a load with 3-cycle latency
      Machine has an idle load unit in the branch delay slot

      benefit = 0.90 × 3 = 2.7 cycles expected latency saving
      cost    = 0.10 × 1 = 0.1 cycles wasted (load unit idle anyway)
      net     = 2.7 - 0.1 = 2.6 cycles → PROFITABLE

    Example where speculation is NOT profitable:
      Branch B taken 50% of the time
      I is a multiply with 3-cycle latency, uses the ONLY multiplier
      No idle multiplier slots available

      benefit = 0.50 × 3 = 1.5 cycles expected saving
      cost    = 0.50 × 3 = 1.5 cycles wasted (blocks the multiplier)
      net     = 1.5 - 1.5 = 0.0 → NOT PROFITABLE
```

### 15.3 Safe vs. Unsafe Speculation

**Safe speculation**: The speculated instruction cannot cause a visible side effect
(exception, trap) when executed speculatively. Examples:
- Arithmetic instructions (add, subtract, shift, logical AND/OR)
- Register-to-register moves
- Comparisons

These instructions can always be safely speculated because they will at worst produce
an unused result.

**Unsafe speculation**: The speculated instruction CAN cause an exception. The primary
example is a **load instruction** that may access an invalid address:

```
    // Original code:
    if (ptr != NULL) {
        x = *ptr;            // Safe: only executed if ptr is valid
    }

    // After speculating the load above the branch:
    x = *ptr;                // UNSAFE: ptr might be NULL → segfault
    if (ptr != NULL) {
        use(x);
    }
```

If `ptr` is NULL, the speculated load will cause a segmentation fault that would not
have occurred in the original program. This is a correctness violation.

### 15.3 Hardware Support for Unsafe Speculation

To enable safe speculation of potentially-faulting instructions, several hardware
mechanisms have been developed:

**IA-64 Speculative Loads (`ld.s`):**

The IA-64 (Itanium) architecture provides the most comprehensive hardware support for
speculative code motion. The key mechanism:

1. **`ld.s` (speculative load)**: A load that does NOT raise an exception on a fault.
   Instead, if the load would fault (invalid address, TLB miss), the destination
   register's **NaT (Not a Thing) bit** is set to 1.

2. **NaT propagation**: If an arithmetic instruction reads a register with NaT=1, the
   result register also gets NaT=1. NaT bits propagate through dependent computations
   like poison.

3. **`chk.s` (speculation check)**: Placed at the point where the speculated load would
   have originally been. Checks the NaT bit of the destination register:
   - If NaT=0 (no fault): Continue normally. The speculated result is valid.
   - If NaT=1 (fault occurred): Jump to **recovery code** that re-executes the load
     and dependent instructions non-speculatively, allowing the exception to be raised
     properly.

```
    // IA-64 speculative load example:
    // Original:
    //   br.cond  p1, skip       // if (p1) skip the load
    //   ld4      r5 = [r10]     // load 4 bytes from address in r10
    //   add      r6 = r5, r7    // use loaded value
    // skip:
    //   ...
    //
    // After speculation:
    //   ld4.s    r5 = [r10]     // speculative load (won't fault)
    //   ;; (other instructions fill the latency)
    //   br.cond  p1, skip
    //   chk.s    r5, recovery   // check if load succeeded
    //   add      r6 = r5, r7   // use loaded value (r5 is valid)
    //   br       continue
    // recovery:
    //   ld4      r5 = [r10]    // re-execute non-speculatively
    //   add      r6 = r5, r7
    //   br       continue
    // skip:
    // continue:
    //   ...
```

**Poison Bits (General Mechanism):**

Some architectures provide a poison bit per register (similar to NaT) that indicates the
value was produced by a speculative instruction that may have faulted. The poison bit is
checked when the value is actually consumed.

**Non-Trapping Load Instructions:**

Some architectures provide load instructions that return a default value (typically zero)
on a fault instead of raising an exception. This is simpler than IA-64's NaT mechanism
but provides less information for recovery.

### 15.4 The Speculation-Compensation Trade-off

Speculation introduces a trade-off:

```
    ┌─────────────────────────────────────────────────────────────┐
    │  More speculation →                                         │
    │    + More parallelism (instructions start earlier)           │
    │    + Better utilization of functional units                  │
    │    - More compensation code (for off-trace paths)           │
    │    - More wasted work (speculated instructions on wrong path)│
    │    - More register pressure (speculated results must be kept)│
    │    - Risk of speculation exceptions (need hardware support)  │
    └─────────────────────────────────────────────────────────────┘
```

The optimal amount of speculation depends on:
- The branch prediction accuracy (high accuracy → more profitable speculation)
- The machine's issue width (wider machines can absorb more wasted work)
- Hardware support for non-faulting loads
- The cost of compensation code

---

## Chapter 16: Code Motion Across Join Points

### 16.1 The Above-the-Join Problem

When an instruction I originally in block C is moved above a join point where block X
merges into the trace, I will no longer execute when control flows through X. If I's
result is needed on the X→C path, a copy of I must be placed on the path from X.

```
    BEFORE:                           AFTER moving I above the join:

    A          X                      A          X
    │         ╱                       │ ← I      │ ← copy of I
    ▼        ╱                        ▼         ╱
    B  ◄────╱  (join point)          B  ◄────╱
    │                                │
    C  [contains I]                  C  [I removed, already executed]
```

This is the compensation code that superblocks eliminate (by removing side entries via
tail duplication). In Fisher's original trace scheduling, above-the-join compensation is
a major source of code size increase and bookkeeping complexity.

### 16.2 Formal Conditions

Instruction I from block C can be moved above the join point at B (to block A or earlier)
only if:

1. **Data dependencies are satisfied**: All of I's data inputs are available at the new
   position.
2. **No side effects violated**: If I has side effects (store, I/O), moving it changes
   the program's behavior on the off-trace path.
3. **Compensation is correct**: The copy of I inserted on the off-trace path must have
   the correct operands (which may have been renamed or modified by other code motions).

---

## Chapter 17: Code Motion Across Branch Points

### 17.1 The Below-the-Branch Problem

When an instruction I originally in block A is moved below a branch point to block C,
and the branch at A can exit the trace to block Y, then I will be skipped when control
flows A→Y. If I's result is needed on the A→Y path, a copy of I must be placed at the
entry of Y (or on the edge A→Y).

```
    BEFORE:                           AFTER moving I below the branch:

    A [contains I]                    A [I removed]
    │         ╲                       │         ╲
    ▼          ╲                      ▼          ╲
    B          Y (off-trace)          B          Y  ← copy of I
    │                                 │
    C                                 C  ← I moved here
```

### 17.2 Below-the-Branch Compensation

Below-the-branch compensation is generally simpler than above-the-join compensation
because:

1. The instruction is being pushed down (delayed), not pulled up (advanced)
2. The copy on the off-trace path executes in its natural position (same block as the
   branch), so the operands are likely still available
3. Superblocks retain this type of compensation (it is the ONLY type they have)

### 17.3 Formal Rules for Code Motion Legality

The legality of moving instruction I from its original position to a new position
depends on the type of boundary crossed. Here we formalize the conditions for each
type of code motion:

**Rule 1: Moving I above a branch (speculation)**

I can be moved from block B to block A (where A contains a branch that may skip B)
if and only if:
- All data inputs of I are available at the end of A (data dependencies satisfied)
- I does not have side effects that would be visible on the off-trace path, OR
  hardware speculation support is available (e.g., ld.s on IA-64)
- The register written by I is not live on the off-trace path, OR the off-trace
  path gets a compensation copy of I

```
    ┌────────────────────────────────────────────────────────────────┐
    │ LEGAL SPECULATION:                                             │
    │                                                                │
    │   Original:              Speculated:                           │
    │   A: cmp r1,r2 → p1     A: cmp r1,r2 → p1                   │
    │      br.cond p1, Y          r3 ← r4 + r5  ← I moved here    │
    │   B: r3 ← r4 + r5          br.cond p1, Y                     │
    │      ...                 B: ...                                │
    │                                                                │
    │   Legal because: r4 and r5 are available in A,                │
    │   r3 ← r4 + r5 is a safe operation (no exceptions),          │
    │   AND either r3 is dead on the Y path or Y gets a copy.      │
    ├────────────────────────────────────────────────────────────────┤
    │ ILLEGAL SPECULATION (without hardware support):               │
    │                                                                │
    │   Original:              Attempted:                            │
    │   A: cmp ptr, NULL       A: cmp ptr, NULL                     │
    │      br.eq → error          r3 ← load [ptr]  ← DANGER!      │
    │   B: r3 ← load [ptr]       br.eq → error                     │
    │      ...                 B: ...                                │
    │                                                                │
    │   Illegal because: if ptr is NULL, the speculated load will   │
    │   cause a segmentation fault that would not have occurred     │
    │   in the original program.                                     │
    │   (Legal on IA-64 using ld.s with chk.s recovery)            │
    └────────────────────────────────────────────────────────────────┘
```

**Rule 2: Moving I below a branch (downward code motion)**

I can be moved from block A to block B (where A contains a branch to off-trace
block Y) if and only if:
- All data dependencies of instructions in B on I are satisfied (I's result is
  available where needed)
- The off-trace path through Y gets a compensation copy of I (if I's result is
  needed on that path)
- I does not modify a value that is used between its original position and its
  new position on the trace path

**Rule 3: Moving I above a join point (above-the-join)**

I can be moved from block B to block A (where B has an off-trace predecessor X)
if and only if:
- All data inputs of I are available at the end of A
- The off-trace path through X gets a compensation copy of I (because I would
  normally execute when control flows X → B, but now it has been moved above B)
- The compensation copy has the correct operand values for the X path

**Rule 4: Moving I across both a join and a branch**

When I is moved across multiple boundaries simultaneously, ALL applicable rules
must be satisfied, and compensation copies must be inserted at ALL affected off-trace
edges. This is where the bookkeeping algorithm (Chapter 18) becomes essential --- it
systematically tracks all boundaries crossed and inserts all required copies.

### 17.4 Code Motion and Live Variables

A critical correctness condition for all code motion is that the **liveness** of
registers is maintained. If instruction I writes register r, and r is live at the
point where I is being moved TO, then the original value of r would be destroyed.
The solution is **register renaming**: assign I's result to a fresh register r' and
update all subsequent uses of r to use r'.

```
    PROBLEM: Moving I up destroys a live value
    
    Original:                   Attempted move:
    A: ... use of r3 ...        A: ... use of r3 ...
       br B                        r3 ← r4 + r5    ← Overwrites r3!
    B: r3 ← r4 + r5               br B
       r6 ← r3 * 2             B: r6 ← r3 * 2

    SOLUTION: Register renaming
    A: ... use of r3 ...
       r7 ← r4 + r5            ← Renamed to r7
       br B
    B: r6 ← r7 * 2             ← Updated to use r7
```

Register renaming is always possible before register allocation (when virtual
registers are unlimited) but may be constrained after register allocation (when
physical registers are scarce). This is another reason why pre-RA scheduling has
more freedom than post-RA scheduling.

### 17.5 Combined Code Motion Example

Consider a trace [A, B, C, D] with a side entry at B (from X) and side exits at B
(to Y) and C (to Z):

```
    ORIGINAL:                           AFTER scheduling the trace:
    X                                    X
    │                                    │ ← copy of I3 (above-join comp.)
    │  A: I1, I2                         │
    │  │                                 A: I3, I1 (I3 moved up from C,
    │  ▼                                 │          I2 moved down)
    └─►B: I3(orig from C, moved up)      ▼
       │ ╲                               B: I2 (moved down from A)
       │  Y ← copy of I2                │ ╲
       ▼     (below-branch comp.)        │  Y ← copy of I2
       C: (I3 removed, moved up)         ▼
       │ ╲                               C: (empty or other instructions)
       │  Z                              │ ╲
       ▼                                 │  Z
       D                                 ▼
                                         D
```

---

## Chapter 18: The Bookkeeping Algorithm (Ellis, 1985)

### 18.1 Historical Context

John R. Ellis's 1985 PhD thesis, "Bulldog: A Compiler for VLIW Architectures" (Yale
University, Department of Computer Science, Technical Report YALEU/DCS/RR-364), formalized
the bookkeeping algorithm for systematically inserting compensation code when instructions
are moved across trace boundaries. The thesis won the 1985 ACM Doctoral Dissertation Award.

Ellis identified two strategies for managing compensation code:

1. **Avoidance**: Restrict code motion so that no compensation code is ever needed.
   This is simple but severely limits scheduling freedom.
2. **Suppression**: Analyze the global flow of the program to detect when a copy is
   redundant (the instruction would be executed anyway on the off-trace path).

The bookkeeping algorithm combines both strategies with a systematic method for inserting
necessary copies.

### 18.2 The Bookkeeping Algorithm

```
ALGORITHM: Bookkeeping(trace, schedule, CFG)
─────────────────────────────────────────────
Input:  A trace T = [B₁, B₂, ..., Bₖ]
        A schedule that has moved instructions across block boundaries
        The CFG with all off-trace edges
Output: Compensation code inserted on off-trace edges

1.  // Track all code motions
2.  moved_up ← ∅       // Instructions moved above their original block
3.  moved_down ← ∅     // Instructions moved below their original block
4.
5.  FOR each instruction I in the schedule DO
6.      original_block ← block containing I before scheduling
7.      scheduled_block ← block containing I after scheduling
8.      IF scheduled_block is earlier in the trace than original_block THEN
9.          moved_up ← moved_up ∪ {(I, original_block, scheduled_block)}
10.     ELSE IF scheduled_block is later in the trace than original_block THEN
11.         moved_down ← moved_down ∪ {(I, original_block, scheduled_block)}
12.     END IF
13. END FOR
14.
15. // Insert compensation for upward-moved instructions (above-join)
16. FOR each (I, orig, sched) ∈ moved_up DO
17.     // I was moved from orig up to sched (or earlier)
18.     // For each side entry between sched and orig:
19.     FOR each block Bⱼ between sched and orig (exclusive) DO
20.         FOR each off-trace predecessor X of Bⱼ DO
21.             // X → Bⱼ is a side entry
22.             // Control flowing X → Bⱼ → ... → orig would have executed I
23.             // But I has been moved above Bⱼ, so X's path misses it
24.             // Insert a copy of I on the edge X → Bⱼ
25.             IF NOT Redundant(I, X, Bⱼ) THEN
26.                 copy ← Clone(I)
27.                 InsertOnEdge(copy, X → Bⱼ)
28.                 // Adjust register assignments if I's operands were renamed
29.                 FixupRegisters(copy, X → Bⱼ)
30.             END IF
31.         END FOR
32.     END FOR
33. END FOR
34.
35. // Insert compensation for downward-moved instructions (below-branch)
36. FOR each (I, orig, sched) ∈ moved_down DO
37.     // I was moved from orig down to sched (or later)
38.     // For each side exit between orig and sched:
39.     FOR each block Bⱼ between orig and sched (inclusive of orig) DO
40.         FOR each off-trace successor Y of Bⱼ DO
41.             // Bⱼ → Y is a side exit
42.             // Control flowing ... → Bⱼ → Y would have executed I in orig
43.             // But I has been moved below Bⱼ, so Y's path misses it
44.             IF NOT Redundant(I, Bⱼ, Y) THEN
45.                 copy ← Clone(I)
46.                 InsertOnEdge(copy, Bⱼ → Y)
47.                 FixupRegisters(copy, Bⱼ → Y)
48.             END IF
49.         END FOR
50.     END FOR
51. END FOR
52.
53. // Verify: no compensation code introduces new hazards
54. FOR each inserted copy DO
55.     Verify no RAW/WAR/WAW hazards with surrounding instructions
56.     IF hazard found THEN
57.         Resolve by renaming or reordering the compensation code
58.     END IF
59. END FOR
```

### 18.3 Redundancy Suppression

A compensation copy is **redundant** if the off-trace path already computes the same
value. This occurs when:

1. The instruction already exists on the off-trace path (it was not moved from there)
2. The instruction's result is dead on the off-trace path (no subsequent use)
3. Another instruction on the off-trace path computes the same value in the same register

Redundancy analysis requires global data-flow analysis (reaching definitions, live
variable analysis) on the entire CFG, including all off-trace paths. This is
computationally expensive but essential for avoiding code bloat.

### 18.4 Correctness Conditions

The bookkeeping algorithm must ensure that after all compensation code is inserted:

1. **Every path through the program produces the same results as the original program.**
   For each instruction I that was moved, every control flow path that would have executed
   I in the original program still executes exactly one copy of I (either the moved
   version on the trace or a compensation copy on an off-trace path).

2. **No new exceptions are introduced.** If an instruction is moved above a branch,
   and the instruction can fault, then either:
   (a) The instruction is safe to speculate (cannot fault), or
   (b) Hardware support prevents the fault (IA-64 ld.s), or
   (c) The instruction is NOT moved above the branch.

3. **Register assignments are consistent.** If code motion has caused register renaming,
   the compensation copies must use the correct register names for the point in the
   program where they are inserted.

### 18.5 Worked Example: Bookkeeping in Action

Consider a trace [A, B, C] with side entry at B from X, and side exit at B to Y:

```
    ORIGINAL TRACE:
    
    X ──┐
        │                     
    A: [I1: r1 ← load [r10]  ]     (MEM, latency 3)
       [I2: r2 ← r1 + 5     ]     (ALU, latency 1, dep on I1)
    ────┤
    B: [I3: r3 ← load [r11]  ]     (MEM, latency 3)
    ←── X enters here (side entry)
    ────┤──→ Y (side exit)
    C: [I4: r4 ← r2 * r3    ]     (MUL, latency 3, dep on I2, I3)
       [I5: store r4 → [r12] ]     (MEM, latency 1, dep on I4)

    The scheduler decides to:
    1. Move I3 from B UP to A (above the side entry from X)
       → This puts both loads in the same block, allowing them to issue
         in parallel on a 2-issue machine.
    2. Move I2 from A DOWN to B (below the side exit to Y)
       → This fills a stall cycle in B.

    AFTER SCHEDULING:
    A: [I1: r1 ← load [r10]  ]     Cycle 0
       [I3: r3 ← load [r11]  ]     Cycle 0 (parallel with I1)
       [branch if cond → Y   ]
    B: [I2: r2 ← r1 + 5     ]     Cycle 3 (I1 result ready)
       [                     ]
    C: [I4: r4 ← r2 * r3    ]     Cycle 4 (I2 and I3 results ready)
       [I5: store r4 → [r12] ]     Cycle 7 (I4 result ready)

    BOOKKEEPING REQUIRED:
    
    1. I3 moved UP from B to A, crossing the side entry at B from X.
       → On the X → B path, I3 would normally execute in B.
       → But I3 is now in A, so the X path misses it.
       → INSERT COPY of I3 on the edge X → B:
         X: ...
            I3': r3 ← load [r11]    ← compensation copy
            jump to B
    
    2. I2 moved DOWN from A to B, crossing the side exit at B to Y.
       → On the A → Y path, I2 would normally execute in A.
       → But I2 is now in B, so the Y path misses it.
       → INSERT COPY of I2 on the edge B → Y:
         Y_entry: I2': r2 ← r1 + 5  ← compensation copy
                  ... rest of Y ...

    VERIFICATION:
    Path A → B → C: Executes I1, I3, I2, I4, I5.  ✓ (all instructions)
    Path X → B → C: Executes I3'(copy), I2, I4, I5.
                     But I1 is in A, and X doesn't go through A!
                     → I1's result (r1) must be available on X path.
                     → If r1 is NOT live on path X → B, then I2' on the
                        Y path uses r1 which may be stale. BUG?
    
    This reveals a subtle issue: when I3 is moved up and I2 is moved down,
    the compiler must verify that ALL transitive dependencies are satisfied
    on ALL paths. This is why the bookkeeping algorithm includes a final
    verification pass to detect and fix such issues.
```

This example illustrates why bookkeeping is the most complex part of trace scheduling
and why superblocks (which eliminate side entries) dramatically simplify the process.

### 18.6 The Cascade Effect

A particularly subtle problem with bookkeeping is the **cascade effect**: compensation
code inserted for one trace may create new side entries or exits for adjacent traces,
requiring additional compensation code, which may in turn affect other traces, and so on.

```
    SCENARIO: Cascading compensation

    Trace 1 scheduling inserts compensation copy C1 on edge X → B.
    
    Trace 2 (which includes X and its neighbors) now has a new instruction
    (C1) that wasn't there before. When Trace 2 is scheduled:
    
    - C1 may be moved across other boundaries, requiring its own
      compensation copies (C1' and C1'').
    - These secondary copies may affect Trace 3, which may generate
      tertiary copies (C1''' and C1''''), and so on.
    
    In theory, the cascade can grow exponentially.
    In practice, it is limited by:
    1. Most compensation copies are on cold paths that are not part of
       later traces.
    2. Redundancy suppression eliminates many potential copies.
    3. The greedy trace order (hottest first) means later traces have
       fewer instructions and less scheduling freedom.
```

Ellis's thesis proved that the cascade always terminates (there are only finitely many
instructions and boundaries) but noted that in the worst case, code size can grow
exponentially. In practice, the code size increase is typically 10-30% for programs
with moderate control flow complexity.

---

# Part 4: Software Pipelining --- The Loop Cousin

Trace scheduling excels at irregular control flow (if/else chains, function calls,
switch statements). But the majority of a program's execution time is typically spent
in **loops**. Software pipelining is the complementary technique that optimizes loops
by overlapping iterations.

---

## Chapter 19: Software Pipelining vs. Trace Scheduling

### 19.1 Complementary Domains

```
    ┌──────────────────────────────────────────────────────────────────┐
    │                    PROGRAM EXECUTION TIME                       │
    │                                                                  │
    │   ┌─────────────────────┐    ┌───────────────────────────────┐  │
    │   │  Irregular code     │    │  Loop bodies                  │  │
    │   │  (if/else, switch,  │    │  (for, while, do-while)       │  │
    │   │   function calls)   │    │                               │  │
    │   │                     │    │                               │  │
    │   │  → TRACE SCHEDULING │    │  → SOFTWARE PIPELINING        │  │
    │   │                     │    │    (modulo scheduling)         │  │
    │   └─────────────────────┘    └───────────────────────────────┘  │
    │                                                                  │
    │   These are COMPLEMENTARY, not competing.                       │
    │   A complete compiler uses BOTH.                                │
    └──────────────────────────────────────────────────────────────────┘
```

### 19.2 Why Trace Scheduling is Suboptimal for Loops

Applying trace scheduling to a loop body treats each iteration independently. The trace
scheduler can only overlap instructions within a single trace (which covers at most a
few iterations after unrolling). It cannot achieve the steady-state overlap where
instructions from iteration N+2 execute alongside instructions from iteration N.

Software pipelining achieves exactly this steady-state overlap, producing a **kernel loop**
where each cycle initiates a new iteration, overlapping operations from many iterations.

---

## Chapter 20: Modulo Scheduling (Rau, 1981/1994)

### 20.1 Historical Context

Software pipelining was independently invented by several researchers. The dominant
algorithmic approach, **modulo scheduling**, was introduced by B. Ramakrishna Rau and
Charles D. Glaeser in 1981. Rau refined and popularized the technique through his work
at Cydrome Inc. (on the Cydra-5 minicomputer) and later at Hewlett-Packard Laboratories.

The most comprehensive treatment of modulo scheduling is Rau's 1994 paper "Iterative
Modulo Scheduling: An Algorithm for Software Pipelining Loops" (Proceedings of the 27th
International Symposium on Microarchitecture, MICRO-27).

### 20.2 The Initiation Interval (II)

The **initiation interval** (II) is the number of cycles between the start of successive
loop iterations in the software-pipelined schedule. A smaller II means higher throughput.

```
    EXAMPLE: Loop with 3 instructions per iteration
    Non-pipelined (II = 3, assuming 3-cycle body):

    Iter 1: ────────────
    Iter 2:             ────────────
    Iter 3:                         ────────────
    Time:   0  1  2  3  4  5  6  7  8  9  10 11

    Software-pipelined (II = 1):

    Iter 1: ────────────
    Iter 2:  ────────────
    Iter 3:   ────────────
    Iter 4:    ────────────
    Time:   0  1  2  3  4  5  6

    Throughput: 1 iteration per cycle (vs. 1 every 3 cycles)
```

### 20.3 Minimum Initiation Interval (MII)

The MII is the lower bound on II, determined by two constraints:

**Resource-Constrained Minimum II (ResMII):**

```
    ResMII = max over all resource types r of:
             ⌈ uses(r) / count(r) ⌉

    where uses(r) = number of times resource r is used per iteration
          count(r) = number of instances of resource r in the machine
```

Example: If the loop body has 3 ALU operations and the machine has 2 ALU units:

```
    ResMII ≥ ⌈3/2⌉ = 2
```

**Recurrence-Constrained Minimum II (RecMII):**

If the loop body has a recurrence (a cycle in the data dependency graph through the
loop-carried dependency), the II must be long enough to accommodate it:

```
    RecMII = max over all recurrence cycles c of:
             ⌈ delay(c) / distance(c) ⌉

    where delay(c)    = sum of instruction latencies around the cycle
          distance(c) = sum of iteration distances around the cycle
                        (how many iterations apart the dependency spans)
```

Example: If instruction A in iteration i produces a value used by instruction B in
iteration i+1, and the latency of A is 3 cycles:

```
    delay = 3, distance = 1
    RecMII ≥ ⌈3/1⌉ = 3
```

**MII = max(ResMII, RecMII)**

### 20.4 The Modulo Scheduling Algorithm

```
ALGORITHM: ModuloSchedule(loop_body, machine, II)
──────────────────────────────────────────────────
Input:  Loop body with instructions and dependency graph (including
        loop-carried dependencies)
        Machine description
        Candidate initiation interval II
Output: A modulo schedule (if successful), or FAILURE

1.  // Build the data dependency graph including loop-carried edges
2.  DDG ← BuildDDG(loop_body)     // Includes inter-iteration dependencies
3.
4.  // Initialize the Modulo Reservation Table (MRT)
5.  // MRT has II rows × (one column per resource)
6.  MRT ← empty table of size II × |resources|
7.
8.  // Compute scheduling order (e.g., by recurrence, then height)
9.  order ← ComputeSchedulingOrder(DDG)
10.
11. // Schedule each instruction
12. FOR each instruction I in order DO
13.     // Compute earliest start time based on already-scheduled predecessors
14.     earliest ← 0
15.     FOR each predecessor P of I (including loop-carried) DO
16.         IF P is scheduled THEN
17.             IF edge(P→I) is intra-iteration THEN
18.                 earliest ← max(earliest, schedule[P] + latency(P→I))
19.             ELSE  // Loop-carried: P in iteration i, I in iteration i+distance
20.                 earliest ← max(earliest,
21.                                schedule[P] + latency(P→I) - distance * II)
22.             END IF
23.         END IF
24.     END FOR
25.
26.     // Try to place I at earliest time, checking MRT for resource conflicts
27.     placed ← false
28.     FOR time ← earliest TO earliest + II - 1 DO
29.         modulo_slot ← time MOD II
30.         IF MRT[modulo_slot] has resource available for I THEN
31.             schedule[I] ← time
32.             MRT[modulo_slot] ← reserve resource for I
33.             placed ← true
34.             BREAK
35.         END IF
36.     END FOR
37.
38.     IF NOT placed THEN
39.         RETURN FAILURE           // Cannot schedule at this II
40.     END IF
41. END FOR
42.
43. RETURN schedule
```

### 20.5 The Modulo Reservation Table (MRT)

The MRT is a key data structure in modulo scheduling. It has II rows (one per cycle
in the initiation interval) and one column per resource type. Because iterations overlap,
the resource usage pattern repeats every II cycles:

```
    Example: II = 3, machine has 2 ALUs, 1 MUL, 1 MEM

    Modulo Reservation Table:
    ┌───────┬──────────┬──────────┬──────┬──────┐
    │ Cycle │  ALU #1  │  ALU #2  │ MUL  │ MEM  │
    │ mod 3 │          │          │      │      │
    ├───────┼──────────┼──────────┼──────┼──────┤
    │   0   │  I1(i)   │  I4(i-1) │      │ I2(i)│
    ├───────┼──────────┼──────────┼──────┼──────┤
    │   1   │  I3(i)   │          │ I5(i)│      │
    ├───────┼──────────┼──────────┼──────┼──────┤
    │   2   │          │  I6(i)   │      │      │
    └───────┴──────────┴──────────┴──────┴──────┘

    Each row repeats every II=3 cycles.
    I1 from iteration i and I4 from iteration i-1 share the same cycle.
```

### 20.6 The Overall Modulo Scheduling Workflow

```
ALGORITHM: IterativeModuloScheduling(loop)
───────────────────────────────────────────
Input:  A loop body
Output: A software-pipelined schedule

1.  Compute MII = max(ResMII, RecMII)
2.  II ← MII
3.
4.  LOOP
5.      result ← ModuloSchedule(loop, machine, II)
6.      IF result ≠ FAILURE THEN
7.          BREAK                     // Success at this II
8.      END IF
9.      II ← II + 1                  // Try a larger II
10.     IF II > MAX_II THEN
11.         RETURN original_loop      // Give up; use unpipelined version
12.     END IF
13. END LOOP
14.
15. // Generate the pipelined code:
16. //   Prologue: ramp-up (start iterations 1, 2, ..., stages-1)
17. //   Kernel:   steady-state loop (all stages active)
18. //   Epilogue: drain (finish iterations after loop bound reached)
19.
20. prologue ← GeneratePrologue(result)
21. kernel   ← GenerateKernel(result)
22. epilogue ← GenerateEpilogue(result)
23.
24. RETURN (prologue, kernel, epilogue)
```

### 20.7 Rotating Register Files

When multiple iterations are in flight simultaneously, different iterations use the same
logical registers. Without renaming, this causes WAW and WAR conflicts between iterations.

**Rotating register files** solve this by providing a hardware mechanism where register
numbers are automatically offset by the iteration count. Each new iteration sees a
"fresh" set of register names, even though the physical registers are shared.

```
    // Without rotating registers (conflict):
    Iteration i:    r1 ← load [r10 + i*4]     // writes r1
    Iteration i+1:  r1 ← load [r10 + (i+1)*4] // overwrites r1 before i uses it!

    // With rotating registers (no conflict):
    Iteration i:    r(32+i%8) ← load [r10 + i*4]      // writes r32
    Iteration i+1:  r(32+(i+1)%8) ← load [r10 + (i+1)*4]  // writes r33
    // Different physical registers; no conflict
```

The Cydra-5 (Rau's machine at Cydrome Inc.) was the first machine to implement rotating
register files for software pipelining. The IA-64 (Itanium) architecture later adopted
the concept with 96 rotating general registers (r32-r127) and 48 rotating predicate
registers.

### 20.8 Prologue, Kernel, and Epilogue

The software-pipelined loop has three phases:

```
    PROLOGUE: Fill the pipeline (start new iterations without completing old ones)
    ┌────────────────────────────────────────────┐
    │ Cycle 0: Start iteration 1 (stages 1 only) │
    │ Cycle 1: Start iter 2 + continue iter 1    │
    │ Cycle 2: Start iter 3 + continue iters 1,2 │
    └────────────────────────────────────────────┘

    KERNEL: Steady state (all pipeline stages active)
    ┌────────────────────────────────────────────┐
    │ Each cycle: Complete one iter, start one    │
    │             All stages of pipeline active   │
    │             Throughput: 1 iteration per II  │
    │             Repeat for (trip_count - stages)│
    └────────────────────────────────────────────┘

    EPILOGUE: Drain the pipeline (finish remaining iterations)
    ┌────────────────────────────────────────────┐
    │ No new iterations started                   │
    │ Complete remaining in-flight iterations      │
    └────────────────────────────────────────────┘
```

The IA-64 architecture provides **rotating predicates** and **special loop branch
instructions** (`br.ctop`, `br.cexit`) that automatically generate the prologue and
epilogue by using predicates to mask unstarted/completed iterations. This eliminates
the need for the compiler to generate explicit prologue and epilogue code, saving code
size.

---

## Chapter 21: Loop Unrolling as a Simpler Alternative

### 21.1 The Unroll-and-Schedule Approach

Loop unrolling replicates the loop body N times, creating a single large block that
can be scheduled as a trace. This is simpler than modulo scheduling but less efficient.

```
    ORIGINAL LOOP:
    for (i = 0; i < 100; i++) {
        a[i] = b[i] + c[i];          // 1 load + 1 load + 1 add + 1 store
    }

    UNROLLED 4×:
    for (i = 0; i < 100; i += 4) {
        a[i]   = b[i]   + c[i];      // Iteration 1
        a[i+1] = b[i+1] + c[i+1];    // Iteration 2
        a[i+2] = b[i+2] + c[i+2];    // Iteration 3
        a[i+3] = b[i+3] + c[i+3];    // Iteration 4
    }
```

After unrolling, the 16 instructions (4 iterations × 4 instructions) can be scheduled
as a single block, allowing the scheduler to overlap loads from iteration 2 with
computation from iteration 1.

### 21.2 Unrolling vs. Software Pipelining

| Aspect                | Loop Unrolling          | Software Pipelining      |
|----------------------:|:-----------------------:|:------------------------:|
| Steady-state overlap  | Partial (within unrolled| Full (all iterations     |
|                       | body only)              | overlap in kernel)       |
| Startup/wind-down     | Per unrolled group      | Prologue + epilogue once |
| Code size             | O(N × body_size)        | O(body_size + stages)    |
| Complexity            | Simple                  | Complex                  |
| Register pressure     | High (N × live ranges)  | Moderate (rotating regs) |
| Trip count handling   | Need cleanup loop       | Handled by prologue/     |
|                       | for remainder           | epilogue                 |
| Best suited for       | Short loops, simple     | Long-running loops,      |
|                       | machines                | VLIW/EPIC machines       |

In practice, modern compilers use BOTH: unroll the loop body by a small factor (2-4x)
AND THEN apply modulo scheduling to the unrolled body. This provides the benefits of
both techniques.

### 21.3 Worked Example: Modulo Scheduling vs. Unrolling

Consider a simple vector addition loop on a 2-issue machine (1 ALU + 1 MEM unit):

```
    LOOP BODY (per iteration):
    I1: r1 ← load [rA + i*4]      MEM, latency 3
    I2: r2 ← load [rB + i*4]      MEM, latency 3
    I3: r3 ← r1 + r2              ALU, latency 1, depends on I1, I2
    I4: store r3 → [rC + i*4]     MEM, latency 1, depends on I3
    I5: i ← i + 1                 ALU, latency 1
    I6: branch if i < N → LOOP    BR,  latency 1, depends on I5

    Resource analysis:
    ALU operations: 2 (I3, I5)
    MEM operations: 3 (I1, I2, I4)
    
    ResMII = max(⌈2/1⌉, ⌈3/1⌉) = max(2, 3) = 3
    RecMII = 0 (no loop-carried data recurrence, only i increment)
    Wait — I5→I6→I1 through the loop back edge:
    Actually, the address computation i*4 depends on I5 from previous iteration.
    Assuming separate address register:
    RecMII = ⌈1/1⌉ = 1 (I5 to I5 of next iteration, latency 1, distance 1)
    
    MII = max(3, 1) = 3
```

**Approach 1: Unroll 3x, schedule as trace**

```
    Unrolled body: 18 instructions (3 × 6)
    After scheduling on 2-issue machine:

    Cycle │ ALU              │ MEM
    ──────┼──────────────────┼──────────────────
      0   │                  │ I1a: load [rA+0]
      1   │                  │ I2a: load [rB+0]
      2   │                  │ I1b: load [rA+4]
      3   │ I3a: r1a+r2a     │ I2b: load [rB+4]
      4   │ I5a: i+=1        │ I4a: store [rC+0]
      5   │                  │ I1c: load [rA+8]
      6   │ I3b: r1b+r2b     │ I2c: load [rB+8]
      7   │ I5b: i+=1        │ I4b: store [rC+4]
      8   │                  │
      9   │ I3c: r1c+r2c     │ I4c: store [rC+8]
     10   │ I5c: i+=3        │
     11   │                  │ I6: branch
    ──────┴──────────────────┴──────────────────
    Total: 12 cycles for 3 iterations = 4.0 cycles/iteration
    + cleanup loop for remainder (N mod 3)
```

**Approach 2: Modulo schedule with II = 3**

```
    Modulo Reservation Table (II = 3):
    
    Slot  │ ALU         │ MEM
    ──────┼─────────────┼──────────────
    0     │ I3(i-1)     │ I1(i)        ← load from iteration i,
          │             │                 add from iteration i-1
    1     │ I5(i)       │ I2(i)        ← load from iteration i,
          │             │                 increment from iteration i
    2     │             │ I4(i-1)      ← store from iteration i-1

    Kernel (steady state):
    Cycle │ ALU              │ MEM
    ──────┼──────────────────┼──────────────────
     0+3k │ I3(k-1): add     │ I1(k): load [rA]
     1+3k │ I5(k): i+=1      │ I2(k): load [rB]
     2+3k │ ---              │ I4(k-1): store [rC]
     3+3k │ I3(k): add       │ I1(k+1): load [rA]
     ...  │ ...              │ ...
    
    Throughput: 1 iteration every 3 cycles = 3.0 cycles/iteration
    (vs. 4.0 for unrolling — 25% faster!)
    
    Prologue: 3 cycles (fill the pipeline)
    Epilogue: 3 cycles (drain the pipeline)
    Total for N iterations: 3 + 3×(N-1) + 3 = 3N + 3 cycles
    vs. unrolling: 4×⌈N/3⌉ + cleanup ≈ 4N/3 + constant
    
    For N=100: modulo = 303 cycles, unrolling = ~400 cycles
```

This example demonstrates the fundamental advantage of modulo scheduling: it achieves
the theoretical throughput limit (MII = 3 cycles/iteration) while unrolling can only
approximate it. The larger the loop trip count, the greater the advantage of modulo
scheduling.

### 21.4 Swing Modulo Scheduling

Swing Modulo Scheduling (SMS) is a variant of iterative modulo scheduling developed
by Llosa, Gonzalez, Ayguade, and Valero (1996). SMS improves on Rau's iterative
approach by scheduling instructions in a specific order that reduces the likelihood
of scheduling failures:

1. Order instructions by their position in the recurrence chains
2. Schedule instructions in recurrences first (they are most constrained)
3. For each instruction, alternate between scheduling "up" (toward the bottom
   of the schedule) and "down" (toward the top), swinging back and forth

The "swing" strategy tends to produce better schedules with fewer failed attempts,
reducing compilation time. SMS has been implemented in LLVM (the `MachinePipeliner`
pass, primarily for the Hexagon target) and in GCC.

### 21.5 When Software Pipelining Fails

Modulo scheduling may fail or be unprofitable in several circumstances:

1. **Short trip count**: If the loop executes only 2-3 iterations, the prologue and
   epilogue overhead dominates. The compiler may choose to simply unroll the loop
   instead.

2. **Complex control flow**: If the loop body contains branches (if/else), the
   traditional modulo scheduling algorithm cannot handle them directly. Extensions
   like "modulo scheduling with if-conversion" (predicate the branches first) or
   "modulo scheduling for superblocks" address this.

3. **High register pressure**: Software pipelining increases the number of
   simultaneously live values (values from multiple overlapping iterations). If
   the register file is too small, the spill code degrades performance.

4. **Loop-carried dependence with long latency**: If RecMII >> ResMII, the pipeline
   achieves low throughput regardless of how many functional units are available.
   The recurrence is the bottleneck.

5. **Unknown trip count**: If the compiler cannot determine a minimum trip count,
   it must generate both the pipelined version and a non-pipelined fallback, with
   a runtime check to choose between them. This increases code size.

---

# Part 5: Modern Implementations

The theoretical algorithms described in Parts 1-4 have been implemented in numerous
production and research compilers. This part surveys the most important implementations.

---

## Chapter 22: GCC's Scheduling Infrastructure

### 22.1 Scheduling Passes

GCC performs instruction scheduling at two points in the compilation pipeline:

1. **`-fschedule-insns`** (Schedule 1): Scheduling BEFORE register allocation.
   This pass has more freedom (can use any register) but its decisions may be undone
   by the register allocator.

2. **`-fschedule-insns2`** (Schedule 2): Scheduling AFTER register allocation.
   This pass works with fixed register assignments and must respect them. It is the
   more important of the two passes.

Both passes are enabled at `-O2` and higher optimization levels.

### 22.2 Superblock Scheduling in GCC

The `-fsched-superblock` flag (available with `-fschedule-insns2`) enables superblock
scheduling. When enabled, the scheduler:

1. Forms superblocks by selecting traces and performing tail duplication
2. Allows code motion across basic block boundaries within the superblock
3. Generates compensation code for side exits

This is GCC's primary mechanism for global instruction scheduling.

### 22.3 Treegion Scheduling in GCC

GCC has experimental treegion scheduling support on the `sched-treegion-branch`. The
implementation includes:

- Natural treegion formation (single pass over the CFG)
- Tail duplication guided by the ICSE metric
- Tree traversal scheduling with frequency-based prioritization

As of current GCC releases, treegion scheduling has not been merged into mainline and
remains experimental.

### 22.4 GCC's Scheduling Hooks

GCC provides an extensive set of target hooks for customizing the scheduler:

- **`TARGET_SCHED_ISSUE_RATE`**: Maximum instructions per cycle
- **`TARGET_SCHED_VARIABLE_ISSUE`**: Dynamic issue rate adjustment
- **`TARGET_SCHED_ADJUST_COST`**: Modify dependency costs (e.g., bypass network)
- **`TARGET_SCHED_ADJUST_PRIORITY`**: Modify instruction priorities
- **`TARGET_SCHED_REORDER`**: Reorder the ready list before selection
- **`TARGET_SCHED_FIRST_CYCLE_MULTIPASS_DFA_LOOKAHEAD`**: Enable multi-pass scheduling
  with DFA-based resource tracking

The DFA (Deterministic Finite Automaton) resource model is GCC's primary mechanism for
tracking functional unit availability. Each target architecture provides a DFA description
of its pipeline, and the scheduler queries the DFA to determine whether an instruction
can be issued in the current cycle.

### 22.5 GCC's Scheduling Algorithm in Detail

GCC's instruction scheduler (`haifa-sched.c`) implements a priority-based list scheduling
algorithm with several sophisticated extensions:

```
    GCC SCHEDULING ALGORITHM (simplified):

    1. Build the dependency DAG for the scheduling region
       (basic block, superblock, or EBB)
    2. Compute instruction priorities:
       a. dep_cost: sum of latencies on the critical path to region exit
       b. Adjust for speculative dependencies
       c. Allow target hook adjustments (TARGET_SCHED_ADJUST_PRIORITY)
    3. Initialize the ready list with instructions that have no
       unscheduled predecessors
    4. WHILE ready list is not empty DO
       a. Query DFA: which instructions in the ready list can be
          issued without resource conflict?
       b. If multipass lookahead is enabled:
          Try all permutations of up to LOOKAHEAD ready instructions
          Select the permutation that leaves the most instructions
          issuable in the next cycle
       c. Otherwise: select the highest-priority ready instruction
       d. Issue the selected instruction, advance the DFA state
       e. Update the ready list (release newly ready instructions)
       f. If no instruction can be issued: advance the cycle counter
          and re-check the ready list
    END WHILE
```

The multi-pass DFA lookahead is particularly important for in-order VLIW targets
where instruction ordering within a cycle affects which future instructions can be
issued. By exploring multiple orderings, the scheduler avoids locally good but
globally poor choices.

### 22.6 GCC's Speculative Scheduling

GCC supports speculative scheduling through hooks:

- **`TARGET_SCHED_SPECULATE_INSN`**: Transform an instruction for speculative execution
- **`TARGET_SCHED_NEEDS_BLOCK_P`**: Whether the instruction needs a recovery block
- **`TARGET_SCHED_GEN_SPEC_CHECK`**: Generate a speculation check instruction

These hooks enable target-specific speculation support (e.g., IA-64's `ld.s` and `chk.s`).

---

## Chapter 23: LLVM's Scheduling Infrastructure

### 23.1 Architecture Overview

LLVM has two major scheduling frameworks:

1. **SelectionDAG Scheduler** (pre-RA): Operates during instruction selection (before
   register allocation). Converts the SelectionDAG IR into a scheduled sequence of
   MachineInstrs.

2. **MachineScheduler** (post-RA and pre-RA): The modern scheduling framework that
   operates on MachineInstrs within MachineBasicBlocks.

The MachineScheduler is the primary scheduling pass in modern LLVM and is the focus
of this section.

### 23.2 Core Data Structures

**SUnit (Scheduling Unit):** Each `MachineInstr` is wrapped in an `SUnit` that tracks:
- **Latency**: From the scheduling model
- **Height**: Longest path from this node to any DAG leaf (similar to critical path)
- **Depth**: Longest path from any DAG root to this node
- **Predecessors/Successors**: Dependency edges with latency labels

**ScheduleDAGMI:** The main scheduling DAG class. Represents a single scheduling region
within a `MachineBasicBlock`. Builds the dependency DAG, manages the ready queues, and
drives the scheduling loop.

**ScheduleDAGMILive:** An extension of `ScheduleDAGMI` that also tracks register
pressure (live intervals) during scheduling. This enables the scheduler to balance
ILP extraction against register pressure.

### 23.3 Bidirectional Scheduling

LLVM's `MachineScheduler` supports three scheduling directions:

- **Top-down**: Schedule from first instruction to last. Each scheduled instruction
  releases its successors into the ready queue.
- **Bottom-up**: Schedule from last instruction to first. Each scheduled instruction
  releases its predecessors into the ready queue.
- **Bidirectional**: Simultaneously maintain both top-down and bottom-up frontiers.
  At each step, select the single best candidate from either direction.

Bidirectional scheduling is the default and generally produces the best results because
it can schedule critical-path instructions from both ends simultaneously.

### 23.4 Candidate Selection

LLVM's `tryCandidate` function applies profitability checks in sequence:

1. **Register pressure**: Favor the candidate that reduces register pressure
2. **Latency (for in-order cores)**: Avoid soft stalls by scheduling instructions
   whose operands are ready
3. **Resource pressure**: Favor the candidate that creates less resource contention
4. **Latency**: Lower latency is preferred (resolve ties on critical path)
5. **Program order**: Preserve original order as final tiebreaker

### 23.5 Resource Tracking

LLVM uses a **scheduling model** (`SchedMachineModel`) to describe the target:

- **`IssueWidth`**: Maximum instructions per cycle
- **`MicroOpBufferSize`**: 0 indicates in-order execution
- **`ProcResource BufferSize`**: 0 means in-order resource usage

Each `ProcResource` has a `BufferSize` and a set of `ReservedCycles` counters that track
when the resource becomes available. Instructions reserve resources for the duration
between their `AcquireAtCycles` and `ReleaseAtCycles`.

### 23.6 VLIW Scheduling in LLVM

LLVM provides a dedicated `VLIWMachineScheduler` class for VLIW targets. This class
extends the standard `MachineScheduler` with:

- **Packet formation**: Groups instructions into VLIW bundles (packets)
- **DFA-based resource checking**: Uses a DFA to verify that a packet is legal
- **Target-specific strategies**: VLIW targets (Hexagon, etc.) provide custom
  `MachineSchedStrategy` implementations

The Hexagon target in LLVM is the most mature VLIW backend and provides extensive
scheduling infrastructure including software pipelining via the `HexagonPipeliner`.

### 23.7 LLVM's Scheduling Pipeline in Context

The complete LLVM scheduling pipeline illustrates how modern compilers apply
scheduling at multiple stages:

```
    ┌─────────────────────────────────────────────────────────────────────┐
    │  LLVM IR                                                           │
    │  ├── Loop unrolling, vectorization                                 │
    │  └── Inlining, constant folding, dead code elimination             │
    ├─────────────────────────────────────────────────────────────────────┤
    │  SelectionDAG                                                      │
    │  ├── Instruction selection (pattern matching)                      │
    │  └── SelectionDAG scheduler (basic scheduling during lowering)     │
    ├─────────────────────────────────────────────────────────────────────┤
    │  MachineInstr (pre-RA)                                             │
    │  ├── MachineLICM (loop-invariant code motion)                     │
    │  ├── MachineScheduler (pre-RA): balance ILP vs register pressure  │
    │  └── MachineCSE (common subexpression elimination)                │
    ├─────────────────────────────────────────────────────────────────────┤
    │  Register Allocation                                               │
    │  ├── Virtual → Physical register mapping                          │
    │  ├── Spill code insertion                                          │
    │  └── Copy coalescing                                               │
    ├─────────────────────────────────────────────────────────────────────┤
    │  MachineInstr (post-RA)                                            │
    │  ├── MachineScheduler (post-RA): final scheduling with fixed regs │
    │  ├── MachinePipeliner (software pipelining for VLIW targets)      │
    │  └── Post-RA hazard detection and NOP insertion                    │
    ├─────────────────────────────────────────────────────────────────────┤
    │  MC Layer (Machine Code)                                           │
    │  ├── Bundle formation (VLIW packet encoding)                      │
    │  ├── Relaxation (branch offset adjustment)                        │
    │  └── Object file emission                                          │
    └─────────────────────────────────────────────────────────────────────┘
```

Key observations about LLVM's approach:

1. **Two scheduling passes**: Like GCC, LLVM schedules both before and after register
   allocation. The pre-RA pass focuses on ILP while managing register pressure; the
   post-RA pass performs final scheduling with fixed registers.

2. **Separation of concerns**: The scheduling algorithm (strategy) is separated from
   the scheduling infrastructure (DAG construction, ready queue management). Targets
   provide custom strategies via the `MachineSchedStrategy` interface.

3. **Register pressure integration**: Unlike GCC's two independent passes, LLVM's
   `ScheduleDAGMILive` explicitly tracks register pressure during scheduling and
   uses it as a primary scheduling criterion. This produces better results than
   scheduling for ILP first and then trying to fix register pressure problems.

4. **Tablegen-driven models**: Target scheduling models are specified in LLVM's
   TableGen language (`.td` files), which generates C++ code for the scheduling
   model. This makes it relatively straightforward to add scheduling support for
   new targets.

### 23.8 The Hexagon Backend: A Modern VLIW Case Study

Qualcomm's Hexagon DSP is a modern VLIW processor found in billions of Snapdragon
mobile SoCs. Its LLVM backend is the most sophisticated VLIW compiler in production
use and illustrates how the trace scheduling principles described in this document
are applied in a contemporary setting:

- **4-wide VLIW**: Up to 4 instructions per packet (bundle)
- **Hardware interlocking**: Unlike classic VLIW, Hexagon includes hardware
  interlocks for some hazards, reducing the compiler's scheduling burden
- **Predicated execution**: All instructions can be predicated
- **Hardware loops**: Zero-overhead loop instructions eliminate the branch penalty
- **New-value operands**: Instructions can consume results from the same packet
  before they are written to the register file

The Hexagon scheduler uses:
- DFA-based packet validation
- Superblock-style scheduling across basic blocks
- Software pipelining (Swing Modulo Scheduling via `MachinePipeliner`)
- Instruction compounding (fusing sequences into single-cycle operations)

---

## Chapter 24: The IMPACT Compiler (UIUC)

### 24.1 Overview

The IMPACT compiler (Illinois Microarchitecture Project Utilizing Advanced Compiler
Technology) was a research compiler developed at the University of Illinois at
Urbana-Champaign under the leadership of Professor Wen-mei Hwu. The project began in
1987 and produced a generation of foundational compiler research.

### 24.2 Key Innovations

The IMPACT compiler was the birthplace of several techniques central to this document:

1. **Superblock formation** (Hwu, Mahlke, Chen, 1992): Single-entry, multiple-exit
   regions formed by trace selection + tail duplication.

2. **Hyperblock formation** (Mahlke, Lin, Chen, Hank, Bringmann, 1992): Predicated
   scheduling regions formed by if-conversion + tail duplication.

3. **Profile-guided optimization**: IMPACT pioneered the systematic use of execution
   profiles to guide compiler optimizations.

4. **ILP-oriented optimizations**: Including predicated execution, speculative execution,
   control-flow optimization, and memory disambiguation.

### 24.3 Architecture

The IMPACT compiler was structured as a modular pipeline:

```
    ┌────────────────────────────────────────────────────────────┐
    │  C Source                                                  │
    ├────────────────────────────────────────────────────────────┤
    │  Frontend → Lcode (low-level IR)                          │
    ├────────────────────────────────────────────────────────────┤
    │  Profiler → Edge/block frequency annotations               │
    ├────────────────────────────────────────────────────────────┤
    │  Region Formation:                                         │
    │    ├── Trace selection (greedy, profile-guided)            │
    │    ├── Superblock formation (trace + tail duplication)     │
    │    └── Hyperblock formation (if-conversion + duplication)  │
    ├────────────────────────────────────────────────────────────┤
    │  ILP Optimizations:                                        │
    │    ├── Dead code elimination                               │
    │    ├── Constant propagation                                │
    │    ├── Copy propagation                                    │
    │    ├── Loop unrolling                                      │
    │    ├── Memory disambiguation                               │
    │    └── Predicate optimization                              │
    ├────────────────────────────────────────────────────────────┤
    │  Instruction Scheduling:                                   │
    │    ├── List scheduling with CP priority                    │
    │    ├── Speculative code motion                              │
    │    └── Compensation code insertion                          │
    ├────────────────────────────────────────────────────────────┤
    │  Register Allocation:                                      │
    │    └── Graph coloring with spill code optimization         │
    ├────────────────────────────────────────────────────────────┤
    │  Machine Code (Mcode) → Assembly                          │
    └────────────────────────────────────────────────────────────┘
```

### 24.4 Industry Impact

The IMPACT compiler's technology was licensed by Intel, Hewlett-Packard, IBM, AMD, Sun
Microsystems, Lucent, Motorola, and others. Key technology transfers:

- Intel/HP used IMPACT results to validate the IA-64 architecture design
- HP used superblock and hyperblock concepts in their PA-RISC compilers
- IBM incorporated ideas into their POWER compiler suite
- Academic descendants include the Trimaran compiler (Chapter 25)

---

## Chapter 25: The Trimaran Compiler (1999)

### 25.1 Overview

Trimaran is an open-source compiler infrastructure for research in instruction-level
parallelism. It was developed as a joint effort by multiple institutions, building on
the IMPACT compiler's technology. The name reflects its three major components:

1. **OpenIMPACT**: The frontend and ILP optimization engine (derived from IMPACT)
2. **Elcor**: The backend scheduler and code generator (from HP Labs)
3. **Simu**: A cycle-level simulator for performance evaluation

### 25.2 HPL-PD Architecture

Trimaran uses **HPL-PD** (Hewlett-Packard Laboratories PlayDoh) as its target
architecture. HPL-PD is a **parameterized VLIW/EPIC architecture** that supports:

- Configurable number and types of functional units
- Predicated execution (all instructions predicable)
- Speculative execution (non-trapping loads, poison bits)
- Rotating register files
- Control and data speculation
- Compiler-controlled memory hierarchy

The HPL-PD architecture is described using **HMDES** (HPL Machine Description
Specification), a machine description language that allows researchers to define
arbitrary machine configurations.

### 25.3 Research Applications

Trimaran was used for research in:
- Superblock and hyperblock scheduling
- Software pipelining (modulo scheduling)
- Register allocation for VLIW machines
- Profile-guided optimization
- Predicated execution optimization
- Memory access optimization
- Cluster-based VLIW scheduling

### 25.4 Availability

Trimaran was freely available for academic research from the Trimaran consortium
(trimaran.org). While no longer actively developed, it remains an important reference
implementation of VLIW compiler technology and has been used in hundreds of research
papers.

---

## Chapter 26: Open64 and Pro64

### 26.1 Origins

Open64 traces its lineage to SGI's MIPSPro compiler suite, originally developed for
SGI's MIPS processor workstations. In 2000, SGI released the compiler as open-source
software under the GPL, initially named **Pro64**. The University of Delaware adopted
the project in 2001 and renamed it **Open64**.

### 26.2 The WHIRL Intermediate Representation

Open64's distinctive feature is its **hierarchical intermediate representation** called
**WHIRL** (an acronym whose meaning varies by source). WHIRL has five levels:

1. **Very High WHIRL**: Close to the source language
2. **High WHIRL**: After initial lowering (inlining, loop normalization)
3. **Mid WHIRL**: After loop transformations (unrolling, tiling)
4. **Low WHIRL**: After lowering to machine-level operations
5. **Very Low WHIRL**: Near-assembly representation

This hierarchical IR allows optimizations at the appropriate abstraction level.

### 26.3 Compiler Components

```
    ┌──────────────┐
    │   Frontends   │  GCC-based C/C++, CraySoft Fortran
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │  IPA          │  Interprocedural Analysis
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │  LNO          │  Loop Nest Optimizer
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │  WOPT         │  Global (Whole-program) Optimizer
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │  CG           │  Code Generator (scheduling + register allocation)
    └──────────────┘
```

### 26.4 Scheduling in Open64

The Code Generator (CG) component includes:

- **Global instruction scheduling** integrated with finite-state-automaton-based resource
  management
- **Control and data speculation** with recovery code generation
- **If-conversion** for predicated execution on IA-64
- **Predicate analysis** for optimization of predicated code
- **Software pipelining** for inner loops

### 26.5 The Open Research Compiler (ORC)

Intel funded a branch of Open64 called the **Open Research Compiler (ORC)**, focused
exclusively on the IA-64 architecture. ORC was released in January 2002 and reached
version 2.1 in 2003. Key features:

- Aggressive use of IA-64 speculation features (`ld.s`, `chk.s`)
- Rotating register management for software-pipelined loops
- Predicated execution optimization
- Bundle formation for IA-64's 128-bit instruction bundles (each containing 3
  instructions plus a template field)

### 26.6 Data Speculation in Open64/ORC

One of ORC's most innovative features was its implementation of **data speculation**
for IA-64. Data speculation addresses the problem of memory disambiguation at runtime,
complementing the compile-time alias analysis described in Chapter 12.

The mechanism uses IA-64's Advanced Load Table (ALAT):

```
    // Original code (load depends on potentially-aliasing store):
    store r1 → [r20]         // store to address A
    ...
    r2 ← load [r21]          // load from address B (may alias A)
    r3 ← r2 + 1              // use loaded value

    // After data speculation (ORC moves load above store):
    r2 ← ld.a [r21]          // Advanced load: load AND register in ALAT
    ...
    store r1 → [r20]         // Store: ALAT checks if [r20] overlaps [r21]
    ...                      //   If overlap: ALAT entry for r2 is invalidated
    ld.c r2 = [r21]           // Check load: verify ALAT entry still valid
                              //   If valid: no-op (speculated value is correct)
                              //   If invalid: re-execute the load
    r3 ← r2 + 1              // use (possibly re-loaded) value
```

This mechanism allows the compiler to move loads above stores even when alias analysis
cannot prove they access different addresses. The hardware detects actual conflicts at
runtime and triggers re-execution only when necessary. In practice, most advanced loads
succeed (no conflict), providing the performance benefit of the code motion without the
risk of incorrect execution.

ORC's data speculation pass was integrated with its global instruction scheduler,
allowing the scheduler to consider data-speculative code motions alongside
control-speculative motions. The combined system could move loads above both branches
AND stores, providing maximum scheduling freedom.

### 26.7 Legacy

Despite IA-64's commercial failure, Open64 demonstrated that its optimization framework
could generate efficient code for CISC (x86), RISC (MIPS, ARM), and VLIW (IA-64)
architectures. The project's final release (5.0) appeared in November 2011, after
development had effectively ceased. Many of its techniques were absorbed into GCC,
LLVM, and proprietary compilers.

### 26.8 B. Ramakrishna Rau: A Pioneer's Legacy

No discussion of trace scheduling, software pipelining, and VLIW compilation is complete
without acknowledging the extraordinary contributions of B. Ramakrishna (Bob) Rau, who
passed away in 2002. Rau's career spanned the entire development of the field:

- **1981**: Co-invented modulo scheduling with Glaeser, providing the foundation for
  all modern software pipelining algorithms
- **1984-1988**: Co-founded Cydrome Inc. and built the Cydra-5, the first machine with
  rotating register files --- a hardware innovation specifically designed to support
  software pipelining
- **1988-2002**: At Hewlett-Packard Laboratories, led the research that produced the
  HPL-PD architecture, the HMDES machine description language, and the Elcor scheduler
  that became part of Trimaran
- **1994**: Published the definitive paper on iterative modulo scheduling (MICRO-27),
  which remains the standard reference for the algorithm
- **1994-1997**: With Schlansker, developed treegion scheduling as a generalization of
  trace and superblock scheduling
- **1994-2000**: Co-designed the IA-64 architecture with Intel, ensuring that the
  hardware provided the features compilers needed (rotating registers, predication,
  speculative loads)

The IEEE Computer Society established the **B. Ramakrishna Rau Award** in 2010 to
recognize contributions to the field of computer microarchitecture and compiler
code generation --- the very intersection that Rau defined and shaped throughout his
career. Recipients include many of the researchers cited in this document: Fisher,
Hwu, Mahlke, Lam, and others.

---

# Part 6: Theoretical Foundations

The practical algorithms of Parts 1-5 are grounded in theoretical results about the
complexity and bounds of instruction scheduling. This part presents the key theoretical
results.

---

## Chapter 27: Scheduling as an NP-Hard Problem

### 27.1 The Formal Problem

**Instance**: Given:
- A set of instructions I = {I₁, I₂, ..., Iₙ}
- A dependency DAG D = (I, E) with latencies
- A machine with k ≥ 2 identical functional units
- A target schedule length L

**Question**: Does there exist a schedule S: I → {0, 1, ..., L-1} such that:
1. For all edges (Iᵢ → Iⱼ) with latency l: S(Iⱼ) ≥ S(Iᵢ) + l
2. For all cycles c: |{I : S(I) = c}| ≤ k

### 27.2 NP-Completeness Result

**Theorem (Garey, Johnson, Sethi, 1976; Ullman, 1975):**
The instruction scheduling problem for machines with k ≥ 2 functional units is
NP-complete, even when:
- All instructions have unit latency
- The dependency graph is a tree (forest)
- The machine has exactly k = 2 identical units

The reduction is from the **Multiprocessor Scheduling Problem** (also known as the
job-shop scheduling problem), which is one of Karp's 21 NP-complete problems.

### 27.3 Special Cases That ARE Polynomial

Some restricted cases admit polynomial-time optimal solutions:

| Restriction                                | Complexity        | Algorithm          |
|-------------------------------------------:|:-----------------:|:------------------:|
| k = 1 (single unit)                        | O(n)              | Topological sort   |
| Unit latency, k = 2, tree DAG              | O(n log n)        | Coffman-Graham     |
| Unit latency, k = ∞ (unlimited units)      | O(n + e)          | Critical path      |
| No dependencies (independent instructions) | O(n log n)        | LPT (Longest       |
|                                            |                   | Processing Time)   |
| Fixed pipeline, no dependencies            | O(n)              | Greedy fill        |

### 27.4 The Coffman-Graham Algorithm

For the special case of unit-execution-time tasks on k = 2 processors, the
**Coffman-Graham algorithm** (1972) produces optimal schedules in O(n log n) time.
The algorithm assigns two-digit labels to nodes in reverse topological order, then
schedules by label priority:

```
ALGORITHM: CoffmanGraham(DAG, k=2)
────────────────────────────────────
Input:  DAG with unit-time tasks, k = 2 processors
Output: Optimal schedule

Phase 1: LABELING
1.  For all nodes n with no successors: label(n) = 1
2.  For remaining nodes in reverse topological order:
3.      Let S(n) = {label(s) : s is a successor of n}
4.      Sort S(n) in decreasing order
5.      label(n) = lexicographic rank of the sorted sequence S(n)
6.      (Ties broken by assigning higher label to the node
7.       whose successor labels form a lexicographically larger sequence)

Phase 2: SCHEDULING
8.  ready ← {n : n has no predecessors}
9.  cycle ← 0
10. WHILE unscheduled nodes remain DO
11.     Select up to k ready nodes with HIGHEST labels
12.     Schedule them at current cycle
13.     cycle ← cycle + 1
14.     Update ready set
15. END WHILE
```

The Coffman-Graham algorithm is one of the few optimal polynomial-time scheduling
algorithms known. It does not generalize to k > 2 processors or non-unit latencies.

### 27.5 The Graham Bound

R. L. Graham (1969) proved a fundamental approximation bound for list scheduling:

**Theorem (Graham, 1969):** For any list scheduling algorithm on k identical
processors with arbitrary priority function:

```
    Schedule_Length ≤ (2 - 1/k) × OPT
```

where OPT is the optimal schedule length.

This means that list scheduling can never produce a schedule more than twice the
optimal length (for large k, it approaches 2x; for k = 2, it is at most 1.5x OPT).

In practice, the bound is very loose --- list scheduling with a good priority function
typically produces schedules within 5-10% of optimal.

### 27.6 Implications for Compilers

Since optimal instruction scheduling is NP-hard for realistic machines (k ≥ 2), compilers
use **heuristic** approaches:

1. **List scheduling**: The standard heuristic, guaranteed by Graham's bound to produce
   a schedule no longer than (2 - 1/k) × OPT for k identical units.
2. **Optimal enumeration**: For small basic blocks (< 30 instructions), branch-and-bound
   or ILP-based solvers can find optimal solutions in reasonable time.
3. **Divide and conquer**: Partition large scheduling problems into smaller subproblems
   that can be solved more efficiently.
4. **Constraint programming**: Formulate the scheduling problem as a constraint
   satisfaction problem (CSP) and use backtracking with constraint propagation.

In practice, list scheduling with a good priority function produces schedules within
5-10% of optimal for most basic blocks and traces.

### 27.7 Optimal Scheduling via Enumeration

Shobaki and Wilken (2004) developed a practical optimal scheduling algorithm for
traces using enumeration with pruning. Their approach:

1. **Branch-and-bound search**: Enumerate all possible schedules, pruning branches
   that cannot improve on the best schedule found so far.

2. **Lower bound computation**: At each node in the search tree, compute a lower
   bound on the schedule length. If the lower bound exceeds the current best, prune.

3. **Dominance relations**: If one partial schedule dominates another (same instructions
   scheduled in fewer cycles with fewer resources used), prune the dominated schedule.

4. **Symmetry breaking**: Avoid exploring equivalent schedules that differ only in the
   order of identical instructions.

Their results showed that optimal schedules for basic blocks of up to 50 instructions
could be found in under 1 second on typical hardware. For traces of up to 100
instructions, optimal schedules could be found in under 10 seconds. Beyond 100
instructions, the exponential worst case becomes apparent, and heuristic approaches
are necessary.

This work demonstrated that for critical inner loops, optimal scheduling is practical
and can provide measurable speedups over list scheduling heuristics.

---

## Chapter 28: The Critical Path Bound

### 28.1 Definition

The **critical path length** of a dependency DAG is the length of the longest path
from any root (instruction with no predecessors) to any leaf (instruction with no
successors), where path length is measured as the sum of latencies along the path.

```
    DEFINITION: CriticalPathLength(DAG) =
        max over all paths P = (I₁, I₂, ..., Iₘ) in DAG of:
            Σ latency(Iⱼ) + Σ edge_latency(Iⱼ, Iⱼ₊₁)
```

### 28.2 Lower Bound Theorem

**Theorem:** For any instruction scheduling problem:

```
    Schedule_Length ≥ CriticalPathLength(DAG)
```

**Proof:** No instruction on the critical path can begin before its predecessor on the
critical path has completed. Therefore, the instructions on the critical path must be
scheduled sequentially (respecting latencies), and the total time is at least the sum
of their latencies. No amount of parallelism can shorten this, because the critical
path represents a chain of true dependencies that cannot be broken.

### 28.3 When the Critical Path Bound is Tight

The critical path bound is tight (achieved by the actual schedule) when:
- The machine has enough functional units to execute all non-critical-path instructions
  in parallel with the critical path
- There is sufficient parallelism off the critical path to fill the machine
- No resource conflicts force critical-path instructions to be delayed

For machines with many functional units (wide-issue VLIW), the critical path bound is
often tight. For machines with few functional units, the resource bound (Chapter 29)
may be tighter.

---

## Chapter 29: The Resource Bound

### 29.1 Definition

The **resource bound** is the minimum number of cycles needed to execute all instructions,
limited only by the availability of functional units (ignoring dependencies).

```
    DEFINITION: ResourceBound =
        max over all resource types r of:
            ⌈ count(r, instructions) / available(r) ⌉

    where count(r, instructions) = number of instructions requiring resource r
          available(r) = number of instances of resource r per cycle
```

### 29.2 Lower Bound Theorem

**Theorem:** For any instruction scheduling problem:

```
    Schedule_Length ≥ ResourceBound
```

**Proof:** Even if there are no dependencies (all instructions are independent), the
machine can execute at most `available(r)` instructions of type r per cycle. Therefore,
`count(r)` instructions of type r require at least `⌈count(r)/available(r)⌉` cycles.
The maximum over all resource types gives the tightest lower bound.

### 29.3 Example

```
    Machine: 2 ALUs, 1 Multiplier, 1 Load unit
    Instructions: 10 ALU ops, 5 multiplies, 3 loads, 2 stores

    Resource bound:
        ALU:  ⌈10/2⌉ = 5 cycles
        MUL:  ⌈5/1⌉  = 5 cycles
        MEM:  ⌈(3+2)/1⌉ = 5 cycles   (loads and stores share the memory unit)

    ResourceBound = max(5, 5, 5) = 5 cycles

    With dependencies, the actual schedule will be ≥ 5 cycles.
    With a critical path of 8 cycles, the actual schedule will be ≥ 8 cycles.
    The binding constraint is max(CriticalPath, ResourceBound) = max(8, 5) = 8.
```

### 29.4 When the Resource Bound Dominates

The resource bound dominates (is tighter than the critical path) when:
- The dependency DAG is shallow (short critical path, many independent instructions)
- The machine has few functional units relative to the parallelism available
- Instructions are resource-intensive (many instructions compete for the same units)

This is common in scientific computing (many floating-point operations competing for
limited FP units) and DSP workloads (many multiply-accumulate operations).

---

## Chapter 30: The Scheduling Gap

### 30.1 Definition

The **scheduling gap** is the difference between the actual schedule length produced by
the scheduler and the theoretical lower bound:

```
    SchedulingGap = ActualLength - max(CriticalPathBound, ResourceBound)
```

A scheduling gap of 0 means the schedule is optimal (or at least matches the known
lower bounds). A positive gap indicates room for improvement.

### 30.2 Sources of the Gap

The scheduling gap arises from several sources:

1. **Priority function suboptimality**: The greedy priority function may make locally
   optimal but globally suboptimal choices. For example, scheduling a critical-path
   instruction may delay a resource-constrained instruction, creating a resource stall
   later.

2. **Resource conflicts**: When critical-path instructions and high-resource-pressure
   instructions compete for the same unit in the same cycle, one must be delayed.

3. **Register pressure constraints**: The scheduler may need to delay instructions to
   avoid excessive register spilling, even when resources and dependencies would allow
   earlier scheduling.

4. **Compensation code overhead**: Code motion across trace boundaries adds compensation
   instructions that consume resources and may extend the schedule.

5. **Approximation of lower bounds**: The critical path and resource bounds are
   themselves lower bounds; the true optimal may be higher than both.

### 30.3 Measuring Schedule Quality

```
    DEFINITION: ScheduleQuality = LowerBound / ActualLength

    Perfect schedule: Quality = 1.0
    Typical list scheduling: Quality = 0.90 - 0.98
    Good schedule: Quality > 0.95
```

### 30.4 Practical Results

Empirical studies have shown that list scheduling with a good priority function achieves:

| Program Type          | Avg Gap (cycles) | Avg Quality |
|----------------------:|:----------------:|:-----------:|
| Integer (SPEC)        | 0.3 - 0.8       | 0.95 - 0.98 |
| Floating-point (SPEC) | 0.5 - 1.2       | 0.93 - 0.97 |
| DSP kernels           | 0.2 - 0.5       | 0.96 - 0.99 |
| Embedded (ARM/Thumb)  | 0.1 - 0.4       | 0.97 - 0.99 |

The gap is generally small for individual basic blocks (< 30 instructions) but can be
significant for large traces (> 100 instructions) where the combinatorial explosion of
scheduling choices makes it harder for the greedy heuristic to find good solutions.

### 30.5 Reducing the Gap

Techniques for reducing the scheduling gap include:

1. **Better priority functions**: Combining multiple heuristics (CP + resource pressure +
   slack) as described in Chapter 14.

2. **Backtracking**: When the greedy choice leads to a resource stall, undo the last few
   scheduling decisions and try alternatives. Limited backtracking can significantly
   improve schedule quality at modest compilation cost.

3. **Window scheduling**: Instead of scheduling one instruction at a time, consider a
   window of W ready instructions and evaluate all permutations. For W ≤ 5, this is
   practical and can find better solutions than pure greedy scheduling.

4. **ILP-based optimal scheduling**: For critical inner loops (< 30 instructions),
   formulate the scheduling problem as an Integer Linear Program and solve it optimally
   using an ILP solver. This is used in some embedded compilers where code quality is
   paramount.

5. **Branch-and-bound enumeration**: Shobaki and Wilken (2004) developed an optimal
   trace scheduling algorithm using enumeration with pruning. It can find optimal
   schedules for traces of up to ~100 instructions in practical compilation time.

### 30.6 A Worked Example of the Scheduling Gap

Consider a trace with 8 instructions on a 2-issue machine (1 ALU, 1 MEM):

```
    Instructions and dependencies:
    I1: r1 ← load [r10]           MEM, lat=3
    I2: r2 ← load [r11]           MEM, lat=3
    I3: r3 ← r1 + r2              ALU, lat=1, dep: I1, I2
    I4: r4 ← load [r12]           MEM, lat=3
    I5: r5 ← r4 + r3              ALU, lat=1, dep: I3, I4
    I6: r6 ← r5 * 2               ALU, lat=1, dep: I5
    I7: store r6 → [r13]          MEM, lat=1, dep: I6
    I8: branch                     BR,  lat=1

    LOWER BOUNDS:
    Critical path: I1→I3→I5→I6→I7→I8 = 3+1+1+1+1+1 = 8 cycles
    Resource bound: MEM = ⌈4/1⌉ = 4, ALU = ⌈3/1⌉ = 3
                    max(4, 3) = 4 cycles
    Lower bound = max(8, 4) = 8 cycles

    OPTIMAL SCHEDULE:
    Cycle │ ALU          │ MEM
    ──────┼──────────────┼──────────────
      0   │              │ I1: load
      1   │              │ I2: load
      2   │              │ I4: load     ← I4 independent of I1, I2
      3   │ I3: r1+r2    │              ← I1,I2 ready
      4   │              │              ← waiting for I4 (ready at 5)
      5   │ I5: r4+r3    │              ← I3,I4 ready
      6   │ I6: r5*2     │
      7   │              │ I7: store
      8   │              │ I8: branch   ← (or I8 in BR unit)
    ──────┴──────────────┴──────────────
    Length: 9 cycles

    Wait --- the lower bound was 8, but the best schedule is 9.
    Why? Because the critical path bound (8) assumes unlimited resources,
    but at cycle 4 the ALU is idle (I3 is done, I5 isn't ready yet) and
    the MEM is idle (all loads are done, store isn't ready yet).
    The resource bound (4) assumes no dependencies, but dependencies force
    serialization. Neither bound is tight here.

    Scheduling gap = 9 - 8 = 1 cycle
    Quality = 8/9 = 0.89

    This is a case where the gap arises from the interaction between
    dependencies and resources --- a phenomenon that neither bound captures
    individually.
```

### 30.7 The ILP-Complexity Trade-off in Compiler Design

The tension between schedule quality and compilation cost is a central theme in
compiler design. The following table summarizes the key trade-offs:

```
    ┌────────────────────┬──────────────┬──────────────┬────────────────┐
    │ Approach           │ Schedule     │ Compile Time │ When to Use    │
    │                    │ Quality      │              │                │
    ├────────────────────┼──────────────┼──────────────┼────────────────┤
    │ No scheduling      │ Baseline     │ O(n)         │ -O0            │
    │ (source order)     │              │              │                │
    ├────────────────────┼──────────────┼──────────────┼────────────────┤
    │ Local list sched.  │ Good         │ O(n²)        │ -O1, -O2       │
    │ (basic blocks)     │ (within BB)  │              │                │
    ├────────────────────┼──────────────┼──────────────┼────────────────┤
    │ Superblock sched.  │ Very good    │ O(n²·k)      │ -O2, -O3       │
    │ (global, no joins) │              │ + tail dup   │                │
    ├────────────────────┼──────────────┼──────────────┼────────────────┤
    │ Trace scheduling   │ Very good    │ O(n²·k)      │ -O3 with       │
    │ (global, full)     │              │ + bookkeeping│ profile data   │
    ├────────────────────┼──────────────┼──────────────┼────────────────┤
    │ Hyperblock sched.  │ Excellent    │ O(n²·k)      │ VLIW/EPIC with │
    │ (predicated)       │              │ + if-conv    │ predication HW │
    ├────────────────────┼──────────────┼──────────────┼────────────────┤
    │ Optimal sched.     │ Optimal      │ O(2^n) worst │ Critical inner │
    │ (enumeration)      │              │ O(n³) typical│ loops only     │
    ├────────────────────┼──────────────┼──────────────┼────────────────┤
    │ Modulo scheduling  │ Near-optimal │ O(n²·II)     │ Inner loops    │
    │ (software pipeline)│ (for loops)  │ per attempt  │ on VLIW/EPIC   │
    └────────────────────┴──────────────┴──────────────┴────────────────┘
```

Modern production compilers typically use superblock scheduling at -O2 and above,
with optional profile-guided optimization for maximum performance. Optimal scheduling
is reserved for embedded/DSP compilers targeting specific inner loops. Software
pipelining is standard for VLIW targets at -O2 and above.

The key insight is that the "right" scheduling approach depends on the **optimization
goal**: for general-purpose code, superblock scheduling provides the best
quality-to-compilation-cost ratio; for inner loops, modulo scheduling is essential;
for maximum performance with profile data, trace or hyperblock scheduling provides
the best results.

---

## Chapter 31: The IA-64 Architecture --- A Case Study in Compiler-Driven Design

The Intel IA-64 architecture (commercialized as the Itanium processor family) represents
the most ambitious attempt to build a general-purpose processor around the principles
of trace scheduling, software pipelining, and compiler-driven ILP extraction. Although
IA-64 was ultimately a commercial failure, it remains the most complete realization of
the VLIW/EPIC vision and provides invaluable lessons about the relationship between
compiler algorithms and hardware design.

### 31.1 Architectural Features for Scheduling

IA-64 was designed with virtually every hardware feature that compiler researchers had
wished for during the 1980s and 1990s:

**Instruction Format:**
- 128-bit **bundles** containing 3 instructions (41 bits each) plus a 5-bit **template**
  field that encodes which functional units the instructions use and where stop bits
  (execution barriers) are placed.
- The template eliminates the need for hardware dependency checking --- the compiler has
  already resolved all dependencies.

```
    IA-64 Bundle Format (128 bits):
    ┌──────────┬────────────────┬────────────────┬────────────────┐
    │ Template │  Instruction 0 │  Instruction 1 │  Instruction 2 │
    │  5 bits  │   41 bits      │   41 bits      │   41 bits      │
    └──────────┴────────────────┴────────────────┴────────────────┘
    
    Template encodes: which FU type for each slot (M, I, F, B)
                      where stop bits go (execution barriers)
    
    Example templates:
    MII  = Memory, Integer, Integer (no stops)
    MI;I = Memory, Integer, [stop], Integer
    MMI  = Memory, Memory, Integer
    MFI  = Memory, Float, Integer
    MBB  = Memory, Branch, Branch
    BBB  = Branch, Branch, Branch
```

**Register File:**
- 128 general-purpose registers (64 bits each): r0-r31 static, r32-r127 rotating
- 128 floating-point registers (82 bits each): f0-f31 static, f32-f127 rotating
- 64 one-bit predicate registers: p0 (hardwired true), p1-p15 static, p16-p63 rotating
- 8 branch registers, application registers, control registers

**Predication:**
- Every instruction can be predicated on any of the 64 predicate registers
- Parallel compare instructions write complementary predicates: `cmp.lt p1, p2 = r3, r4`
  sets p1 = (r3 < r4) and p2 = (r3 >= r4) simultaneously
- Enables if-conversion and hyperblock formation

**Speculation:**
- **Control speculation** (`ld.s`): Speculative loads that set NaT on fault
- **Data speculation** (`ld.a`): Advanced loads that are checked later with `ld.c`
  (re-execute if a store to the same address occurred between `ld.a` and `ld.c`)
- **Recovery**: `chk.s` for control speculation, `chk.a` for data speculation

**Software Pipelining Support:**
- Rotating register files (r32-r127, f32-f127, p16-p63)
- Register rotation count register (RRB) decremented automatically each iteration
- Special loop branches: `br.ctop` (counted top), `br.cexit` (counted exit),
  `br.wtop` (while top), `br.wexit` (while exit)
- These branches automatically manage prologue/epilogue using rotating predicates

### 31.2 The IA-64 Compilation Pipeline

The IA-64 compiler pipeline represents the most complete implementation of the
scheduling techniques described in this document:

```
    ┌──────────────────────────────────────────────────────────────────┐
    │  1. High-Level Optimizations                                     │
    │     Inlining, constant propagation, dead code elimination        │
    ├──────────────────────────────────────────────────────────────────┤
    │  2. Profile Analysis                                             │
    │     Edge profiling, block frequency estimation                   │
    ├──────────────────────────────────────────────────────────────────┤
    │  3. Region Formation                                             │
    │     Superblock formation (trace selection + tail duplication)     │
    │     Hyperblock formation (if-conversion + tail duplication)       │
    ├──────────────────────────────────────────────────────────────────┤
    │  4. Predicate Optimization                                       │
    │     Predicate promotion (convert branches to predicates)         │
    │     Predicate analysis (mutual exclusivity)                      │
    ├──────────────────────────────────────────────────────────────────┤
    │  5. Global Code Scheduling                                       │
    │     List scheduling with speculation                             │
    │     Control speculation (ld.s + chk.s insertion)                 │
    │     Data speculation (ld.a + chk.a insertion)                    │
    │     Compensation code generation                                 │
    ├──────────────────────────────────────────────────────────────────┤
    │  6. Software Pipelining                                          │
    │     Modulo scheduling for inner loops                            │
    │     Rotating register allocation                                 │
    │     Prologue/epilogue via rotating predicates                    │
    ├──────────────────────────────────────────────────────────────────┤
    │  7. Register Allocation                                          │
    │     Graph coloring with rotating register management             │
    │     Predicate-aware spill code generation                        │
    ├──────────────────────────────────────────────────────────────────┤
    │  8. Bundle Formation and Template Selection                      │
    │     Pack 3 instructions per bundle                               │
    │     Select template based on FU types                            │
    │     Insert stops for dependencies                                │
    │     NOP insertion for unfilled slots                              │
    └──────────────────────────────────────────────────────────────────┘
```

### 31.3 Lessons from IA-64

The IA-64 experience taught the compiler community several important lessons:

1. **Compiler complexity**: The IA-64 compiler is enormously complex. The combination of
   predication, speculation, rotating registers, bundle formation, and template selection
   created a compiler engineering challenge that took years to solve adequately. Intel and
   HP devoted hundreds of person-years to IA-64 compiler development.

2. **Profile sensitivity**: IA-64 performance is highly sensitive to profile accuracy.
   Programs compiled with profile-guided optimization can be 30-50% faster than programs
   compiled with static heuristics --- a much larger gap than on x86.

3. **Memory latency**: IA-64's static scheduling cannot adapt to runtime memory latency
   variations (cache misses). A dynamically scheduled out-of-order processor can stall
   one instruction and execute others; IA-64 must execute the schedule as the compiler
   planned it. This disadvantage grew as the gap between processor speed and memory
   speed widened (the "memory wall").

4. **Code density**: IA-64's fixed-size bundles with frequent NOP slots produced large
   code, increasing instruction cache pressure and reducing effective memory bandwidth.

5. **Legacy compatibility**: IA-64's incompatibility with x86 code was its ultimate
   commercial death sentence. The x86-64 extension by AMD provided 64-bit computing
   without sacrificing backward compatibility, eliminating IA-64's primary market
   justification.

Despite its commercial failure, IA-64 validated the fundamental soundness of trace
scheduling, superblock and hyperblock formation, software pipelining, and the other
techniques described in this document. The ideas live on in modern compilers for all
architectures.

---

## Chapter 32: The Evolution and Legacy of Trace Scheduling

### 32.1 From Microcode to Machine Code

Fisher's original 1981 paper was titled "Trace Scheduling: A Technique for Global
**Microcode** Compaction." The technique was initially conceived for compacting
microcode --- the horizontal micro-instructions that control the datapath of a
microprogrammed processor. Each micro-instruction word directly controls which
functional units fire in each clock cycle.

The transition from microcode compaction to machine code compilation happened when
Fisher realized that VLIW machines could expose the micro-instruction format as the
machine's ISA, allowing a compiler (rather than a human microprogrammer) to fill the
wide instruction words. This insight transformed trace scheduling from a niche
microcode optimization into the foundation of an entire architecture paradigm.

### 32.2 The Academic Lineage

The intellectual lineage of trace scheduling can be traced through several academic
institutions:

```
    NYU Courant Institute (1978-1979)
    │   Fisher's doctoral work: trace scheduling concept
    │
    ├── Yale University (1979-1984)
    │   │   Fisher as professor
    │   │   Ellis's Bulldog compiler (1985)
    │   │   Bookkeeping algorithm
    │   │
    │   └── Multiflow Computer (1984-1990)
    │       Commercial VLIW: TRACE 7/14/28
    │       Production trace scheduling compiler
    │
    ├── UIUC / IMPACT (1987-present)
    │   │   Hwu's group
    │   │   Superblocks (1992)
    │   │   Hyperblocks (1992)
    │   │   → Licensed to Intel, HP, IBM, AMD, etc.
    │   │
    │   └── Trimaran (1999)
    │       Open-source ILP research infrastructure
    │
    ├── HP Labs (1980s-2000s)
    │   │   Rau's group
    │   │   Modulo scheduling (1981)
    │   │   Cydra-5 / Cydrome (1986)
    │   │   HPL-PD architecture
    │   │   Treegion scheduling
    │   │
    │   └── IA-64 / Itanium (1994-2017)
    │       HP + Intel collaboration
    │       Most advanced EPIC implementation
    │
    └── Stanford / MIT / CMU / Berkeley
        Wall's ILP studies (DEC WRL)
        Lam's software pipelining (1988)
        Various scheduling improvements
```

### 32.3 Impact on Modern Processors

Although VLIW processors did not conquer the general-purpose computing market,
trace scheduling ideas permeate modern compiler and processor design:

**Superscalar processors (x86, ARM, POWER):**
- Out-of-order execution hardware performs dynamic scheduling, but the compiler's
  static scheduling still matters for instruction cache layout, branch prediction
  hint placement, and reducing the load on the hardware scheduler.
- Compilers for superscalar processors use superblock and hyperblock concepts to
  guide code layout optimizations (basic block reordering, function splitting).

**DSP processors (TI C6x, Qualcomm Hexagon, Analog Devices SHARC):**
- Many DSPs are VLIW machines that rely entirely on compiler scheduling.
- Qualcomm's Hexagon processor (used in billions of mobile phones) is a modern
  VLIW design with a sophisticated compiler that uses superblock scheduling and
  software pipelining.
- LLVM's Hexagon backend is one of the most advanced VLIW compiler implementations
  in production use.

**GPU computing (NVIDIA, AMD):**
- GPU architectures use predicated execution (thread-level predication for warp
  divergence) and software-managed scheduling.
- NVIDIA's PTX compiler performs instruction scheduling for the GPU's SIMT
  architecture, using techniques derived from VLIW scheduling.

**AI accelerators:**
- Custom AI chips (TPUs, custom ASICs) often use VLIW-like execution models
  with compiler-driven scheduling of matrix operations across multiple compute
  units.

### 32.4 The Enduring Principles

Regardless of the target architecture, several principles from trace scheduling have
become permanent fixtures of compiler design:

1. **Profile-guided optimization**: Fisher's insight that the compiler should optimize
   the common case (hot path) at the expense of the uncommon case (cold path) is now
   universally accepted. PGO is standard practice in production builds of performance-
   critical software.

2. **Global code motion**: The idea that the compiler should move instructions across
   basic block boundaries --- with appropriate compensation code --- is fundamental to
   all modern optimizing compilers, even those targeting superscalar processors.

3. **The scheduling-region hierarchy**: The progression from basic blocks to traces to
   superblocks to hyperblocks to regions reflects a general principle: larger scheduling
   regions provide more optimization opportunity at the cost of greater complexity.

4. **The compiler-hardware co-design principle**: IA-64's design was driven by what
   compilers could exploit. This principle of co-designing hardware and software for
   mutual benefit continues in modern accelerator design.

5. **Software pipelining for loops**: Modulo scheduling has become the standard
   technique for optimizing inner loops on all architectures with exposed pipelines
   or multiple functional units.

---

# Appendix A: Notation and Terminology

| Symbol/Term          | Definition                                                   |
|---------------------:|:------------------------------------------------------------:|
| CFG                  | Control Flow Graph: (V, E, entry, exit)                     |
| V                    | Set of basic blocks (nodes)                                  |
| E                    | Set of edges (control flow transfers)                        |
| BB                   | Basic block                                                  |
| DAG                  | Directed Acyclic Graph                                       |
| RAW                  | Read After Write (true dependence)                          |
| WAR                  | Write After Read (anti-dependence)                          |
| WAW                  | Write After Write (output dependence)                       |
| ILP                  | Instruction-Level Parallelism                                |
| VLIW                 | Very Long Instruction Word                                   |
| EPIC                 | Explicitly Parallel Instruction Computing                    |
| CP                   | Critical Path length                                         |
| II                   | Initiation Interval (software pipelining)                    |
| MII                  | Minimum Initiation Interval                                  |
| ResMII               | Resource-constrained MII                                     |
| RecMII               | Recurrence-constrained MII                                   |
| MRT                  | Modulo Reservation Table                                     |
| NaT                  | Not a Thing (IA-64 poison bit)                              |
| PGO/FDO              | Profile-Guided / Feedback-Directed Optimization             |
| ASAP                 | As Soon As Possible (earliest start time)                   |
| ALAP                 | As Late As Possible (latest start time)                     |
| DFA                  | Deterministic Finite Automaton (resource model)             |
| NOP                  | No Operation                                                 |
| SUnit                | Scheduling Unit (LLVM's instruction wrapper)                |

---

# Appendix B: Timeline of Key Publications

| Year | Contribution                                               | Authors                      |
|-----:|:----------------------------------------------------------:|:----------------------------:|
| 1975 | NP-completeness of scheduling with k≥2 units              | Ullman                       |
| 1976 | NP-completeness of scheduling (formal proof)               | Garey, Johnson, Sethi        |
| 1979 | Trace scheduling concept (dissertation)                    | Fisher (NYU/Courant)         |
| 1981 | "Trace Scheduling: A Technique for Global Microcode        | Fisher                       |
|      |  Compaction" (IEEE Trans. Computers)                       |                              |
| 1981 | Modulo scheduling (first proposal)                         | Rau, Glaeser                 |
| 1984 | Multiflow Computer founded                                 | Fisher, O'Donnell, Ruttenberg|
| 1985 | Bulldog compiler (bookkeeping algorithm)                   | Ellis (Yale, PhD thesis)     |
| 1986 | Cydra-5 (rotating register files)                          | Rau et al. (Cydrome Inc.)    |
| 1987 | Multiflow TRACE machines ship                              | Multiflow Computer           |
| 1990 | Multiflow ceases operations                                | Multiflow Computer           |
| 1992 | Superblock formation                                       | Hwu, Mahlke, Chen et al.     |
|      |                                                            | (UIUC/IMPACT)               |
| 1992 | Hyperblock formation (if-conversion)                       | Mahlke, Lin, Chen et al.     |
|      |                                                            | (UIUC/IMPACT)               |
| 1993 | Static branch prediction heuristics                        | Ball, Larus                  |
| 1994 | Iterative Modulo Scheduling (MICRO-27)                     | Rau                          |
| 1994 | HPL-PD architecture specification                          | Kathail, Schlansker, Rau     |
| 1996 | Profile-driven ILP scheduling                              | Chekuri, Johnson, Motwani,   |
|      |                                                            | Natarajan, Rau, Schlansker   |
| 1997 | Treegion scheduling                                        | Haab, Holler, Rau,           |
|      |                                                            | Schlansker                   |
| 1999 | Trimaran compiler released                                 | Multiple institutions        |
| 2000 | Pro64/Open64 released                                      | SGI                          |
| 2002 | Open Research Compiler (ORC) for IA-64                     | Intel                        |
| 2004 | Optimal trace scheduling via enumeration                   | Shobaki, Wilken              |

---

# Appendix C: Worked Example --- Complete Trace Scheduling Pipeline

This appendix walks through a complete example of trace scheduling, from CFG construction
through final scheduled code with compensation.

### C.1 Source Code

```c
    int process(int *data, int n, int threshold) {
        int sum = 0;
        for (int i = 0; i < n; i++) {
            int val = data[i];
            if (val > threshold) {
                sum += val * 2;
            } else {
                sum += val;
            }
        }
        return sum;
    }
```

### C.2 Intermediate Representation (after loop unrolling 1x and lowering)

```
    B0 (entry):
        r1 = arg_data         // pointer to data
        r2 = arg_n            // loop bound
        r3 = arg_threshold    // threshold
        r10 = 0               // sum = 0
        r11 = 0               // i = 0
        br B1                 // jump to loop header

    B1 (loop header):
        cmp r11 >= r2, p1     // if i >= n, exit loop
        br.cond p1, B6        // exit if done

    B2:
        r4 = load [r1 + r11*4]    // val = data[i]
        cmp r4 > r3, p2          // if val > threshold
        br.cond !p2, B4           // else branch

    B3 (then):
        r5 = r4 * 2              // val * 2
        r10 = r10 + r5           // sum += val * 2
        br B5                     // jump to loop increment

    B4 (else):
        r10 = r10 + r4           // sum += val
        br B5                     // jump to loop increment

    B5 (loop increment):
        r11 = r11 + 1            // i++
        br B1                     // loop back

    B6 (exit):
        ret r10                   // return sum
```

### C.3 CFG with Profile Data

```
    Assume profiling shows: the loop iterates 1000 times,
    70% of values exceed threshold (branch to B3),
    30% fall through to B4.

                    ┌──────┐
                    │  B0  │ freq=1
                    └──┬───┘
                       │(1)
                    ┌──▼───┐
            ┌──────│  B1  │◄────────┐  freq=1000
            │      └──┬───┘         │
            │(1)      │(999)        │
         ┌──▼──┐   ┌──▼───┐        │
         │ B6  │   │  B2  │        │  freq=999
         └─────┘   └──┬───┘        │
                  (699)│   ╲(300)   │
                ┌──────┐  ┌──────┐ │
                │  B3  │  │  B4  │ │ freq: B3=699, B4=300
                └──┬───┘  └──┬───┘ │
                   │(699)    │(300) │
                   └────┬────┘     │
                     ┌──▼───┐      │
                     │  B5  │──────┘ freq=999
                     └──────┘  (999, back edge)
```

### C.4 Trace Selection

Using greedy trace selection (seed = highest frequency block):

**Trace 1**: Start at B1 (freq=1000), grow down:
  B1 → B2 (999) → B3 (699, hottest successor) → B5 (699+300=999, but B3→B5 = 699)

Wait: B5 has predecessors B3 and B4. Trace grows: B1 → B2 → B3 → B5
Stop at B5 because it leads back to B1 (back edge).

Grow up from B1: B0 → B1 (but B0 is entry, freq=1)

**Trace 1 = [B0, B1, B2, B3, B5]** (the hot path: loop header → load → then-branch → increment)

Side entry at B5 from B4 (the else path).

**Form superblock**: Tail-duplicate B5 for the B4 path:

```
    Superblock = [B0, B1, B2, B3, B5]  (no side entries after tail duplication)

    B4 → B5'  (B5' is a copy of B5 on the else path)
```

**Trace 2 = [B4, B5']** (the cold path)

**Trace 3 = [B6]** (loop exit)

### C.5 Trace Compaction (Scheduling Trace 1)

Target machine: 2-issue VLIW with 1 ALU (1-cycle), 1 MEM (3-cycle), 1 MUL (3-cycle)

Instructions in Trace 1 (linearized):
```
    I1: r1 = arg_data            (ALU, lat=1)
    I2: r2 = arg_n               (ALU, lat=1)
    I3: r3 = arg_threshold       (ALU, lat=1)
    I4: r10 = 0                  (ALU, lat=1)
    I5: r11 = 0                  (ALU, lat=1)
    I6: cmp r11 >= r2, p1        (ALU, lat=1)  -- depends on I2, I5
    I7: br.cond p1, B6           (BR, lat=1)   -- depends on I6
    I8: r4 = load [r1 + r11*4]   (MEM, lat=3)  -- depends on I1, I5
    I9: cmp r4 > r3, p2          (ALU, lat=1)  -- depends on I8, I3
    I10: br.cond !p2, B4         (BR, lat=1)   -- depends on I9
    I11: r5 = r4 * 2             (MUL, lat=3)  -- depends on I8
    I12: r10 = r10 + r5          (ALU, lat=1)  -- depends on I4/prev I12, I11
    I13: r11 = r11 + 1           (ALU, lat=1)  -- depends on I5/prev I13
    I14: br B1                   (BR, lat=1)   -- depends on I13
```

The scheduler builds the dependency DAG and applies list scheduling with CP priority.
The load (I8) is speculated above the loop test branch (I7) to hide its 3-cycle latency:

```
    SCHEDULED (2-issue, speculative):

    Cycle │ Slot 1 (ALU/MUL)    │ Slot 2 (MEM/BR)
    ──────┼─────────────────────┼─────────────────────
      0   │ I1: r1=arg_data     │
      1   │ I2: r2=arg_n        │
      2   │ I5: r11=0           │
      3   │ I3: r3=arg_thresh   │ I8: load r4=[r1+r11*4]  ← SPECULATED
      4   │ I4: r10=0           │
      5   │ I6: cmp r11>=r2,p1  │
      6   │                     │ I7: br.cond p1,B6
      7   │ I9: cmp r4>r3,p2    │                    ← load result ready
      8   │ I11: r5=r4*2        │ I10: br.cond !p2,B4
      9   │                     │
     10   │                     │
     11   │ I12: r10=r10+r5     │                    ← multiply result ready
     12   │ I13: r11=r11+1      │
     13   │                     │ I14: br B1
    ──────┴─────────────────────┴─────────────────────
    Total: 14 cycles for the first iteration (prologue + body)

    Note: The load I8 was moved above the loop test (I6/I7).
    Compensation: If the branch to B6 is taken, the load result is unused.
    The load is safe to speculate if it uses ld.s (IA-64) or if the
    address is guaranteed valid.
```

This completes the end-to-end trace scheduling pipeline for the example.

### C.6 Analysis of the Schedule

Let us analyze the quality of this schedule:

**Critical path analysis:**
The critical path through the loop body (I8 → I11 → I12, the load-multiply-add chain)
has length 3 + 3 + 1 = 7 cycles. The branch chain (I6 → I7) adds 2 cycles. The overall
critical path through the trace from I1 to I14 is approximately 14 cycles, matching
our schedule length.

**Resource utilization:**
```
    Total slots available:     14 cycles × 2 slots = 28 slots
    Slots used:                14 instructions = 14 slots
    Slots wasted (NOPs):       14 slots
    Utilization:               14/28 = 50%
```

The 50% utilization is typical for a 2-issue machine scheduling a single trace.
Wider machines would have even lower utilization, motivating more aggressive global
scheduling.

**Speculation benefit:**
By speculating the load (I8) above the loop test (I6/I7), we saved 2 cycles compared
to the non-speculative schedule (where I8 would be at cycle 7, pushing the multiply to
cycle 10 and the final add to cycle 13). The speculative schedule finishes at cycle 13
(I14 issues); the non-speculative would finish at cycle 15.

**Compensation code overhead:**
The only compensation needed is for the B6 exit (loop done). Since the speculated load
(I8) produces an unused result when B6 is taken, and the load is safe to speculate
(the address is valid because i < n is not yet tested), no compensation code is
needed for correctness --- the unused load result is simply ignored.

However, the side exit at I10 (branch to B4, the else path) requires compensation code
for the superblock. The code at B4 must include a copy of B5 (tail duplication already
handles this by creating B5'). The cold path through [B4, B5'] executes the original
unscheduled code, which is slower but correct.

---

# Appendix D: Worked Example --- Software Pipelining a DAXPY Loop

This appendix demonstrates modulo scheduling on the classic DAXPY operation
(Double-precision A times X Plus Y), which is the core of BLAS Level 1 and
representative of scientific computing workloads.

### D.1 The DAXPY Operation

```c
    // DAXPY: y[i] = a * x[i] + y[i]  for i = 0 to N-1
    void daxpy(int N, double a, double *x, double *y) {
        for (int i = 0; i < N; i++) {
            y[i] = a * x[i] + y[i];
        }
    }
```

### D.2 Loop Body Instructions

On a VLIW machine with 2 FP units (3-cycle multiply, 3-cycle add), 1 load unit
(3-cycle latency), 1 store unit (1-cycle latency), and 1 integer/branch unit:

```
    PER ITERATION:
    I1: f1 ← load_fp [rX + i*8]       // Load x[i], MEM, latency 3
    I2: f2 ← load_fp [rY + i*8]       // Load y[i], MEM, latency 3
    I3: f3 ← f1 * fA                  // a * x[i], FP_MUL, latency 3
    I4: f4 ← f3 + f2                  // a*x[i] + y[i], FP_ADD, latency 3
    I5: store_fp f4 → [rY + i*8]      // Store y[i], MEM, latency 1
    I6: i ← i + 1                     // Increment, INT, latency 1
    I7: branch if i < N → LOOP        // Loop back, BR, latency 1
```

### D.3 MII Calculation

```
    RESOURCES PER ITERATION:
    MEM:    3 operations (2 loads + 1 store) on 1 MEM unit → ⌈3/1⌉ = 3
    FP_MUL: 1 operation on 1 MUL unit → ⌈1/1⌉ = 1
    FP_ADD: 1 operation on 1 ADD unit → ⌈1/1⌉ = 1
    INT:    1 operation on 1 INT unit → ⌈1/1⌉ = 1
    BR:     1 operation on 1 BR unit  → ⌈1/1⌉ = 1

    ResMII = max(3, 1, 1, 1, 1) = 3

    RECURRENCES:
    The only loop-carried dependence is I6 → I7 → I1 (through the address
    computation). Assuming the address update is folded into the load:
    I6 → I6(next): latency 1, distance 1 → ⌈1/1⌉ = 1
    
    No FP recurrence (y[i] depends only on x[i] and y[i], not on y[i-1]).

    RecMII = 1
    MII = max(3, 1) = 3

    The loop is RESOURCE-BOUND (limited by the memory unit).
```

### D.4 Modulo Schedule with II = 3

```
    Modulo Reservation Table (II = 3):
    
    Slot  │ MEM          │ FP_MUL       │ FP_ADD       │ INT/BR
    ──────┼──────────────┼──────────────┼──────────────┼──────────
    0     │ I1(i):ld x   │              │ I4(i-2):add  │ I6(i):i++
    1     │ I2(i):ld y   │ I3(i-1):mul  │              │ I7(i):br
    2     │ I5(i-2):st y │              │              │

    Verification of dependencies:
    I1(i) at cycle 0+3i:   load x[i], result ready at cycle 3+3i
    I3(i) at cycle 1+3i:   needs f1 from I1(i): 1+3i ≥ 0+3i+3? → 1 ≥ 3? NO!
    
    Wait — I3(i) needs I1(i) which has 3-cycle latency, but I3(i) is scheduled
    only 1 cycle after I1(i). This won't work at II=3 because the multiply
    needs the load result.

    Let's reschedule with proper latency constraints:
    I1(i) at slot 0 (cycle 3i+0), result ready at cycle 3i+3
    I3(i) must be at cycle ≥ 3i+3, so slot ≥ 3, meaning slot = 0 of next
    repetition. But that means I3(i) is at cycle 3(i+1)+0 = 3i+3 ✓
    
    Revised schedule:
    Slot  │ MEM          │ FP_MUL       │ FP_ADD       │ INT/BR
    ──────┼──────────────┼──────────────┼──────────────┼──────────
    0     │ I1(i):ld x   │ I3(i-1):mul  │ I4(i-2):add  │ I6(i):i++
    1     │ I2(i):ld y   │              │              │ I7(i):br
    2     │ I5(i-3):st y │              │              │
    
    Dependency check:
    I1(i) at 3i+0,     result ready at 3i+3
    I2(i) at 3i+1,     result ready at 3i+4
    I3(i-1) at 3i+0,   uses I1(i-1) from 3(i-1)+0=3i-3, ready at 3i.
                         3i+0 ≥ 3i? YES ✓ (exactly 3 cycles after load)
    I3(i-1) result ready at 3i+3
    I4(i-2) at 3i+0,   uses I3(i-2) from 3(i-1)+0=3i-3, ready at 3i.
                         3i+0 ≥ 3i? YES ✓
                         uses I2(i-2) from 3(i-2)+1=3i-5, ready at 3i-2.
                         3i+0 ≥ 3i-2? YES ✓
    I4(i-2) result ready at 3i+3
    I5(i-3) at 3i+2,   uses I4(i-3) from 3(i-1)+0=3i-3, ready at 3i.
                         3i+2 ≥ 3i? YES ✓

    ALL dependencies satisfied! The schedule is valid at II=3 (= MII).
```

### D.5 Steady-State Execution

```
    KERNEL EXECUTION (steady state, II=3):
    
    Cycle │ MEM            │ FP_MUL          │ FP_ADD          │ INT
    ──────┼────────────────┼─────────────────┼─────────────────┼─────────
      0   │ ld x[0]        │                 │                 │ i=0
      1   │ ld y[0]        │                 │                 │ br
      2   │                │                 │                 │
    ──────│────────────────│─────────────────│─────────────────│─────────
      3   │ ld x[1]        │ a*x[0]          │                 │ i=1
      4   │ ld y[1]        │                 │                 │ br
      5   │                │                 │                 │
    ──────│────────────────│─────────────────│─────────────────│─────────
      6   │ ld x[2]        │ a*x[1]          │ a*x[0]+y[0]     │ i=2
      7   │ ld y[2]        │                 │                 │ br
      8   │                │                 │                 │
    ──────│────────────────│─────────────────│─────────────────│─────────
      9   │ ld x[3]        │ a*x[2]          │ a*x[1]+y[1]     │ i=3
     10   │ ld y[3]        │                 │                 │ br
     11   │ st y[0]         │                 │                 │
    ──────│────────────────│─────────────────│─────────────────│─────────
     12   │ ld x[4]        │ a*x[3]          │ a*x[2]+y[2]     │ i=4
     13   │ ld y[4]        │                 │                 │ br
     14   │ st y[1]         │                 │                 │
    ──────│────────────────│─────────────────│─────────────────│─────────
      ... │ ...            │ ...             │ ...             │ ...
    
    PIPELINE STAGES:
    Stage 1 (cycles 0-2):  Load x[i], load y[i]
    Stage 2 (cycles 3-5):  Multiply a*x[i]
    Stage 3 (cycles 6-8):  Add a*x[i]+y[i]
    Stage 4 (cycles 9-11): Store y[i]
    
    Pipeline depth: 4 stages × 3 cycles/stage = 12 cycles
    Throughput: 1 iteration every 3 cycles (II = 3)
    
    For N = 1000 iterations:
    Total cycles ≈ 12 (prologue) + 3 × 997 (kernel) + 12 (epilogue) = 3015
    Non-pipelined: ≈ 13 cycles × 1000 = 13000
    Speedup: 13000 / 3015 ≈ 4.3×
```

### D.6 Register Requirements

With 4 overlapping pipeline stages, each producing intermediate values, the rotating
register file must be large enough to hold all simultaneously live values:

```
    Per iteration, live values:
    - f1 (x[i]):   live from I1 to I3 = 3 cycles
    - f2 (y[i]):   live from I2 to I4 = ~5 cycles (crosses stages)
    - f3 (a*x[i]): live from I3 to I4 = 3 cycles
    - f4 (result):  live from I4 to I5 = ~6 cycles (crosses stages)
    
    With II=3 and 4 stages, up to 4 iterations overlap simultaneously.
    Rotating registers needed: 4 iterations × 4 values/iteration = 16 FP registers
    
    IA-64 has 96 rotating FP registers (f32-f127), more than sufficient.
    The register rotation base (RRB) decrements by 4 each iteration,
    automatically renaming the registers for each new iteration.
```

This DAXPY example demonstrates why software pipelining with rotating registers is
so effective for scientific computing: it achieves near-optimal throughput (limited
only by the memory bandwidth, not by instruction scheduling) with modest hardware
support.

---

# Appendix E: Glossary of Compiler Scheduling Terms

**Alias Analysis:** The compiler analysis that determines whether two memory references
can refer to the same location. More precise alias analysis enables more aggressive
scheduling of memory operations.

**Back Edge:** An edge in the CFG from a node N to a node H where H dominates N. Indicates
a loop: H is the loop header, and the edge is the "jump back" to start a new iteration.

**Basic Block:** A maximal sequence of instructions with one entry point and one exit
point. Control enters only at the top, exits only at the bottom.

**Bookkeeping:** The process of inserting compensation code when instructions are moved
across trace boundaries during scheduling. Formalized by Ellis (1985).

**Compensation Code:** Instructions inserted on off-trace control flow paths to maintain
program correctness when trace scheduling moves instructions across branch or join points.

**Control Dependence:** An instruction I is control-dependent on a branch B if B determines
whether I executes. I can be speculatively moved above B only with appropriate compensation.

**Critical Path:** The longest weighted path through the dependency DAG, representing the
minimum possible schedule length (ignoring resource constraints).

**Dominator:** Node A dominates node B if every path from the entry to B passes through A.

**Functional Unit:** A hardware component that executes a specific class of instructions
(ALU, multiplier, load/store unit, branch unit, etc.).

**Hyperblock:** A single-entry, multiple-exit scheduling region where internal branches
are converted to predicated execution via if-conversion.

**If-Conversion:** The transformation of branchy control flow into predicated straight-line
code. Requires hardware support for predicated instructions.

**Initiation Interval (II):** In software pipelining, the number of cycles between the
start of successive loop iterations in the pipelined schedule.

**Issue Width:** The maximum number of instructions a processor can begin executing in a
single cycle.

**Latency:** The number of cycles from when an instruction begins execution to when its
result is available for use by a dependent instruction.

**List Scheduling:** A greedy heuristic for instruction scheduling. Repeatedly selects the
highest-priority ready instruction and schedules it at the earliest feasible cycle.

**Modulo Scheduling:** A software pipelining algorithm that schedules one iteration of a
loop body such that overlapping iterations (separated by II cycles) do not conflict on
resources. Named for the modulo arithmetic used in the reservation table.

**NaT (Not a Thing):** A 65th bit on IA-64 general-purpose registers indicating that the
register contains an invalid value (typically from a faulting speculative load).

**Natural Loop:** The set of nodes in a CFG that form a loop, defined by a back edge
(N → H): the loop consists of H plus all nodes that can reach N without passing through H.

**Post-Dominator:** Node B post-dominates node A if every path from A to the exit passes
through B. Used to compute control dependences.

**Predicated Execution:** A hardware feature where instructions carry a predicate guard.
The instruction executes but its result is committed only if the predicate is true.

**Ready List:** In list scheduling, the set of instructions whose all predecessors in the
dependency DAG have been scheduled and whose latency constraints are satisfied.

**Register Pressure:** The number of simultaneously live values (registers in use) at a
given point in the schedule. High register pressure may force the register allocator to
spill values to memory.

**Rotating Register File:** A hardware mechanism (Cydra-5, IA-64) where register numbers
are automatically offset by a rotation count, allowing software-pipelined loops to use
different physical registers for different iterations without explicit renaming.

**Side Entry:** A point in a trace where off-trace control flow joins the trace. Side
entries require above-the-join compensation code. Eliminated in superblocks via tail
duplication.

**Side Exit:** A point in a trace where control flow may leave the trace via a branch.
Side exits require below-the-branch compensation code.

**Slack:** The difference between an instruction's latest possible start time (ALAP) and
its earliest possible start time (ASAP). Zero slack means the instruction is on the
critical path.

**Software Pipelining:** An optimization that overlaps multiple loop iterations so that
instructions from different iterations execute simultaneously, filling the machine's
functional units more effectively.

**Speculation:** Executing an instruction before it is known whether its result will be
needed (i.e., before the controlling branch is resolved). May require hardware support
for safe handling of faulting speculative instructions.

**Superblock:** A single-entry, multiple-exit scheduling region with NO side entries.
Formed by trace selection followed by tail duplication to eliminate side entries. Requires
only below-the-branch compensation code.

**Tail Duplication:** Duplicating the "tail" of a trace (from a join point to the end) so
that the off-trace path gets its own copy, eliminating the side entry at the join point.

**Trace:** A sequence of basic blocks along a likely execution path, selected for
scheduling as a single unit. May have both side entries and side exits.

**Trace Scheduling:** Fisher's (1981) technique for global instruction scheduling. Select
a trace (hot path), schedule it aggressively, insert compensation code for correctness.

**Treegion:** A tree-shaped, single-entry, multiple-exit scheduling region that includes
multiple paths from each branch point. Does not require profile data.

**VLIW (Very Long Instruction Word):** A processor architecture where the compiler
explicitly specifies which instructions execute in parallel by packing them into wide
instruction words. Each word contains operations for multiple functional units.

---

# References

[1] J. A. Fisher, "Trace Scheduling: A Technique for Global Microcode Compaction,"
    *IEEE Transactions on Computers*, vol. C-30, no. 7, pp. 478-490, July 1981.

[2] J. R. Ellis, "Bulldog: A Compiler for VLIW Architectures," PhD Thesis, Yale
    University, Department of Computer Science, Technical Report YALEU/DCS/RR-364,
    February 1985. *ACM Doctoral Dissertation Award, 1985.*

[3] W. W. Hwu, S. A. Mahlke, W. Y. Chen, P. P. Chang, N. J. Warter, R. A. Bringmann,
    R. G. Ouellette, R. E. Hank, T. Kiyohara, G. E. Haab, J. G. Holm, and D. M.
    Lavery, "The Superblock: An Effective Technique for VLIW and Superscalar
    Compilation," *The Journal of Supercomputing*, vol. 7, pp. 229-248, 1993.

[4] S. A. Mahlke, D. C. Lin, W. Y. Chen, R. E. Hank, and R. A. Bringmann, "Effective
    Compiler Support for Predicated Execution Using the Hyperblock," *Proceedings of
    the 25th Annual International Symposium on Microarchitecture (MICRO-25)*, pp. 45-54,
    1992.

[5] B. R. Rau, "Iterative Modulo Scheduling: An Algorithm for Software Pipelining
    Loops," *Proceedings of the 27th Annual International Symposium on Microarchitecture
    (MICRO-27)*, pp. 63-74, 1994.

[6] B. R. Rau and C. D. Glaeser, "Some Scheduling Techniques and an Easily Schedulable
    Horizontal Architecture for High Performance Scientific Computing," *Proceedings of
    the 14th Annual Microprogramming Workshop*, pp. 183-198, 1981.

[7] P. G. Lowney, S. M. Freudenberger, T. J. Karzes, W. D. Lichtenstein, R. P. Nix,
    J. S. O'Donnell, and J. C. Ruttenberg, "The Multiflow Trace Scheduling Compiler,"
    *The Journal of Supercomputing*, vol. 7, pp. 51-142, 1993.

[8] V. Kathail, M. S. Schlansker, and B. R. Rau, "HPL PlayDoh Architecture Specification:
    Version 1.0," Technical Report HPL-93-80, Hewlett-Packard Laboratories, February 1994.

[9] L. N. Chakrapani, J. Gyllenhaal, W. W. Hwu, S. A. Mahlke, K. V. Palem, and
    R. M. Rabbah, "Trimaran: An Infrastructure for Research in Instruction-Level
    Parallelism," *Lecture Notes in Computer Science*, vol. 3602, pp. 32-41, 2005.

[10] M. R. Garey, D. S. Johnson, and R. Sethi, "The Complexity of Flowshop and Jobshop
     Scheduling," *Mathematics of Operations Research*, vol. 1, no. 2, pp. 117-129,
     1976.

[11] J. D. Ullman, "NP-Complete Scheduling Problems," *Journal of Computer and System
     Sciences*, vol. 10, no. 3, pp. 384-393, 1975.

[12] T. Lengauer and R. E. Tarjan, "A Fast Algorithm for Finding Dominators in a
     Flowgraph," *ACM Transactions on Programming Languages and Systems*, vol. 1,
     no. 1, pp. 121-141, 1979.

[13] T. Ball and J. R. Larus, "Branch Prediction for Free," *Proceedings of the ACM
     SIGPLAN Conference on Programming Language Design and Implementation (PLDI)*, pp.
     300-313, 1993.

[14] M. S. Lam, "Software Pipelining: An Effective Scheduling Technique for VLIW
     Machines," *Proceedings of the ACM SIGPLAN Conference on Programming Language
     Design and Implementation (PLDI)*, pp. 318-328, 1988.

[15] R. E. Hank, S. A. Mahlke, R. A. Bringmann, J. C. Gyllenhaal, and W. W. Hwu,
     "Superblock Formation Using Static Program Analysis," *Proceedings of the 26th
     Annual International Symposium on Microarchitecture (MICRO-26)*, pp. 247-255, 1993.

[16] G. Haab, W. Holler, B. R. Rau, and M. S. Schlansker, "Treegion Scheduling for
     Highly Parallel Processors," Technical Report, Hewlett-Packard Laboratories, 1997.

[17] M. C. Rosier and T. M. Conte, "Treegion Instruction Scheduling in GCC," *Proceedings
     of the GCC Developers' Summit*, 2006.

[18] G. Shobaki and K. Wilken, "Optimal Trace Scheduling Using Enumeration," *ACM
     Transactions on Architecture and Code Optimization*, vol. 1, no. 4, pp. 403-442,
     2004.

[19] R. L. Graham, "Bounds on Multiprocessing Timing Anomalies," *SIAM Journal on Applied
     Mathematics*, vol. 17, no. 2, pp. 416-429, 1969.

[20] D. W. Wall, "Limits of Instruction-Level Parallelism," *Proceedings of the 4th
     International Conference on Architectural Support for Programming Languages and
     Operating Systems (ASPLOS)*, pp. 176-188, 1991.

[21] R. P. Colwell, R. P. Nix, J. J. O'Donnell, D. B. Papworth, and P. K. Rodman,
     "A VLIW Architecture for a Trace Scheduling Compiler," *IEEE Transactions on
     Computers*, vol. C-37, no. 8, pp. 967-979, 1988.

[22] J. A. Fisher, P. Faraboschi, and C. Young, *Embedded Computing: A VLIW Approach to
     Architecture, Compilers and Tools*, Morgan Kaufmann Publishers, 2005.

[23] S. S. Muchnick, *Advanced Compiler Design and Implementation*, Morgan Kaufmann
     Publishers, 1997.

[24] A. V. Aho, M. S. Lam, R. Sethi, and J. D. Ullman, *Compilers: Principles,
     Techniques, and Tools* (2nd Edition), Addison-Wesley, 2006.

[25] E. R. Coffman and R. L. Graham, "Optimal Scheduling for Two-Processor Systems,"
     *Acta Informatica*, vol. 1, pp. 200-213, 1972.

[26] T. Ball and J. R. Larus, "Efficient Path Profiling," *Proceedings of the 29th
     Annual International Symposium on Microarchitecture (MICRO-29)*, pp. 46-57, 1996.

[27] J. C. Dehnert, P. Y.-T. Hsu, and J. P. Bratt, "Overlapped Loop Support in the
     Cydra 5," *Proceedings of the 3rd International Conference on Architectural Support
     for Programming Languages and Operating Systems (ASPLOS)*, pp. 26-38, 1989.

[28] A. Llosa, M. Gonzalez, E. Ayguade, and M. Valero, "Swing Modulo Scheduling:
     A Lifetime-Sensitive Approach," *Proceedings of the International Conference on
     Parallel Architectures and Compilation Techniques (PACT)*, pp. 80-86, 1996.

[29] M. S. Lam, "A Systolic Array Optimizing Compiler," *Ph.D. Thesis*, Carnegie
     Mellon University, 1987.

[30] V. H. Allan, R. B. Jones, R. M. Lee, and S. J. Allan, "Software Pipelining,"
     *ACM Computing Surveys*, vol. 27, no. 3, pp. 367-432, 1995.

---

# Appendix G: Summary of Algorithm Complexities

```
┌──────────────────────────────────┬───────────────────────┬──────────────────────┐
│ Algorithm                        │ Time Complexity       │ Space Complexity     │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ CFG Construction                 │ O(n)                  │ O(n + e)             │
│ (n = instructions, e = edges)    │                       │                      │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Dominator Computation            │ O(n · α(n))           │ O(n)                 │
│ (Lengauer-Tarjan)                │ (nearly linear)       │                      │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Natural Loop Finding             │ O(n + e)              │ O(n)                 │
│                                  │                       │                      │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Dependency DAG Construction      │ O(n²)                 │ O(n²)                │
│ (n = instructions in trace)      │ (pairwise comparison) │ (edge storage)       │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Critical Path Computation        │ O(n + e)              │ O(n)                 │
│ (reverse topological order)      │                       │                      │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Greedy Trace Selection           │ O(|V|²)               │ O(|V| + |E|)        │
│ (all traces, V = blocks)         │                       │                      │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Superblock Formation             │ O(n · s)              │ O(n)                 │
│ (n = blocks, s = side entries)   │ (tail duplication)    │ (duplicated blocks)  │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ If-Conversion                    │ O(n · b)              │ O(n)                 │
│ (n = instructions, b = branches) │                       │                      │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ List Scheduling                  │ O(n² · k)             │ O(n + k)             │
│ (n = insns, k = FU types)        │                       │                      │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Bookkeeping (Ellis)              │ O(n · s · p)          │ O(n · s)             │
│ (n = moved insns, s = sides,     │                       │ (compensation copies)│
│  p = off-trace paths)            │                       │                      │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Modulo Scheduling                │ O(n · II) per attempt │ O(n + II · k)        │
│ (n = insns, II = init interval)  │ O(n · II²) total      │ (MRT storage)        │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Optimal Scheduling               │ O(2^n) worst case     │ O(2^n) worst case    │
│ (branch-and-bound)               │ O(n³) typical         │ O(n²) typical        │
├──────────────────────────────────┼───────────────────────┼──────────────────────┤
│ Coffman-Graham (k=2, unit lat.)  │ O(n log n)            │ O(n)                 │
│                                  │ (OPTIMAL)             │                      │
└──────────────────────────────────┴───────────────────────┴──────────────────────┘
```

---

# Appendix H: Concluding Discussion

### The State of the Art

After more than four decades of research and development since Fisher's 1981 paper,
trace scheduling and its descendants have reached a mature state. The fundamental
algorithms --- greedy trace selection, list scheduling with critical-path priority,
superblock formation via tail duplication, modulo scheduling for loops --- are well
understood and implemented in all major production compilers.

The field's evolution can be characterized by three phases:

**Phase 1: Invention (1978-1990)**
Fisher, Ellis, and the Multiflow team proved that compiler-driven ILP extraction was
feasible. The key innovations were the trace concept itself, the bookkeeping algorithm
for compensation code, and the demonstration that a production compiler could schedule
20+ operations per cycle. The Cydra-5 and software pipelining via modulo scheduling
emerged in parallel, providing the complementary technique for loops.

**Phase 2: Refinement (1990-2000)**
The IMPACT group at UIUC refined trace scheduling into superblocks and hyperblocks,
reducing complexity while maintaining or improving schedule quality. Profile-guided
optimization became standard. The IA-64 architecture was designed as the ultimate
compiler-driven machine. Trimaran and Open64 provided open research platforms.

**Phase 3: Integration (2000-present)**
The techniques developed for VLIW machines were integrated into compilers for all
architectures. GCC and LLVM incorporated superblock scheduling, software pipelining,
and profile-guided optimization as standard features. The focus shifted from maximizing
ILP to balancing ILP with register pressure, code size, and energy consumption.

### Open Problems

Despite the maturity of the field, several problems remain open or under-explored:

1. **Optimal global scheduling**: While optimal basic-block scheduling is practical for
   small blocks, optimal trace or superblock scheduling remains impractical for traces
   larger than ~100 instructions. Better pruning techniques and tighter lower bounds
   could extend the practical range.

2. **Machine learning for scheduling**: Recent work has explored using machine learning
   to learn priority functions from training data. The challenge is generalization:
   a learned priority function that works well on one program may not transfer to
   others. Reinforcement learning approaches show promise but face enormous search
   spaces.

3. **Scheduling for energy**: Traditional scheduling minimizes execution time. With the
   dominance of mobile and embedded computing, minimizing energy consumption is equally
   important. Energy-aware scheduling must consider voltage scaling, clock gating, and
   the energy cost of speculation and compensation code.

4. **Scheduling for memory hierarchies**: Modern processors spend much of their execution
   time waiting for memory. Scheduling techniques that consider cache behavior,
   prefetching, and memory-level parallelism are an active area of research.

5. **Just-in-time scheduling**: Dynamic languages (JavaScript, Python) use JIT compilers
   that must schedule code at runtime. The scheduling algorithms must be fast enough
   for JIT compilation while still producing good schedules. Trace-based JIT compilers
   (like those in modern JavaScript engines) use a form of trace selection conceptually
   similar to Fisher's approach.

6. **Scheduling for heterogeneous architectures**: Modern SoCs contain CPUs, GPUs, DSPs,
   and custom accelerators. Scheduling work across these heterogeneous units --- deciding
   which instructions execute on which unit --- is a generalization of the VLIW
   scheduling problem to a fundamentally different scale.

### Final Remarks

The story of trace scheduling is, at its core, a story about the relationship between
hardware and software. Fisher's insight that a compiler could expose and exploit
instruction-level parallelism --- that the intelligence for parallel execution could
reside in software rather than hardware --- was revolutionary in 1981 and remains
relevant today. Although the pure VLIW approach did not win the general-purpose
computing market, the compiler techniques it spawned are embedded in every modern
optimizing compiler and continue to influence processor design across all domains:
from the Hexagon DSP in your phone to the GPU in your workstation to the TPU in
the cloud.

The algorithms presented in this document --- from the humble basic-block list scheduler
to the sophisticated modulo scheduler with rotating registers --- represent some of
computer science's most elegant solutions to an NP-hard problem. They demonstrate that
with the right heuristics, good data structures, and careful engineering, compilers can
produce near-optimal solutions to problems that are theoretically intractable. This is
the enduring legacy of trace scheduling.

---

*Document generated for the PNW Research Series.*
*Trace Selection Algorithms, Trace Compaction, and Scheduling Techniques.*
*A comprehensive technical reference covering the theory and practice of*
*global instruction scheduling for VLIW and superscalar architectures.*

---

## Study Guide — Trace Selection & Compaction

### Key concepts

1. **Trace selection.** Picking the hot path through a
   program.
2. **Profile-guided optimization.** Use runtime data to
   pick the hot path.
3. **List scheduling.** Assign instructions to slots
   greedily by priority.
4. **Software pipelining.** Overlap loop iterations for
   throughput.

## DIY — Profile-guided a C program

Compile with `-fprofile-generate`, run, recompile with
`-fprofile-use`. Compare performance.

## TRY — Read Fisher's 1981 paper

*Trace Scheduling: A Technique for Global Microcode
Compaction*, Joseph Fisher, IEEE TC, 1981. The
foundational paper.

## Related College Departments

- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
