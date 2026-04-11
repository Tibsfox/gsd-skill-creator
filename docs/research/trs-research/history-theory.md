# Trace Scheduling: History, Theory, and the Fisher Legacy

*A deep survey of instruction-level parallelism, the trace scheduling algorithm, VLIW architectures, and their lasting impact on compiler design and computer architecture.*

---

## Preface

In the history of computer architecture, few ideas have proven as intellectually fertile -- or as commercially vexing -- as trace scheduling. Conceived in the late 1970s by Joseph A. Fisher during his doctoral work at New York University, trace scheduling was the first practical algorithm to extract large-scale instruction-level parallelism from ordinary sequential programs. It gave compilers permission to look beyond the confines of a single basic block and schedule instructions across branch boundaries, treating the most frequently executed path through a program as a single, monolithic scheduling unit. The consequences of this insight rippled through three decades of processor design, compiler engineering, and computer systems research.

This document traces the full arc of that story: from the fundamental problem of instruction-level parallelism and the limitations of basic-block scheduling, through the formalization of traces and the invention of VLIW (Very Long Instruction Word) architectures, to the rise and fall of commercial VLIW systems like Multiflow and Itanium, and finally to the enduring influence of trace scheduling ideas in modern compilers and embedded processors. It is written as a survey in the style of a textbook chapter or extended tutorial, intended for an audience with a working knowledge of computer architecture and compiler design.

The central thesis is straightforward: trace scheduling, as both an algorithm and a design philosophy, represents one of the most important contributions to the compiler-architecture interface. Even in an era where out-of-order superscalar processors dominate general-purpose computing, the ideas Fisher pioneered -- profile-guided compilation, global code motion, compiler-managed parallelism -- remain foundational to how we think about extracting performance from hardware.

---

# Part 1: The Problem -- Instruction-Level Parallelism

---

## 1. The ILP Wall

### 1.1 Sequential Execution and Wasted Resources

The Von Neumann model of computation specifies a single thread of control: instructions execute one after another, each completing before the next begins. For the first several decades of computing, this model was an adequate abstraction. Processors executed one instruction per clock cycle (or fewer, in early microcoded machines), and performance improvements came primarily from faster clock speeds and denser transistors.

By the late 1970s and early 1980s, however, processor designers had begun building hardware capable of doing more than one thing per cycle. Pipelining allowed different stages of instruction execution -- fetch, decode, execute, memory access, writeback -- to overlap in time, so that while one instruction was executing, the next was being decoded, and the one after that was being fetched. Superscalar designs went further, replicating functional units so that multiple instructions could execute simultaneously in the same cycle.

The problem was that the software -- the instruction stream emitted by compilers -- was not keeping up. A processor with four integer ALUs, two floating-point units, and two load/store ports might be capable of initiating eight operations per cycle, but the sequential program it was running might have only one or two independent instructions available at any given moment. The rest of the hardware sat idle, burning power and producing nothing.

This gap between what the hardware *could* do and what the software *asked* it to do became known as the **instruction-level parallelism (ILP) wall**. The processor had abundant resources for parallel execution, but the sequential instruction stream contained insufficient parallelism to keep those resources busy.

### 1.2 Amdahl's Law at the Instruction Level

Gene Amdahl's famous law, first articulated in 1967, states that the speedup achievable by parallelizing a computation is limited by the fraction of the computation that must remain sequential. If a program is 90% parallelizable and 10% inherently sequential, then no amount of parallel hardware can deliver more than a 10x speedup.

The same principle applies at the instruction level, but with a crucial twist: the "sequential fraction" is not a fixed property of the algorithm. It depends on the **data dependencies** between instructions and on the **control flow** of the program. Two instructions that read and write different registers and different memory locations can execute in parallel; two instructions where the second reads the result of the first cannot.

Consider a simple fragment of code:

```
    a = b + c
    d = a * e
    f = g - h
    i = f + j
```

Instructions 1 and 3 are independent -- they read and write different variables. They could execute in parallel on a machine with two ALUs. But instruction 2 depends on instruction 1 (it needs the value of `a`), and instruction 4 depends on instruction 3 (it needs the value of `f`). The maximum parallelism in this fragment is 2 -- two pairs of dependent instructions that are mutually independent.

In real programs, the picture is more complex. Chains of dependent instructions create **critical paths** through the computation that bound the minimum execution time regardless of available hardware. The ILP available in a program is the ratio of total work to critical-path length. A program with 100 instructions and a critical path of 25 instructions has an ILP of 4 -- it could, in theory, execute on a 4-wide machine in 25 cycles instead of 100.

The challenge is extracting this ILP. The compiler must identify which instructions are independent, schedule them to execute simultaneously, and do all of this statically -- before the program runs -- in a way that is correct for all possible inputs.

### 1.3 The Limits of Dynamic Extraction

Modern out-of-order superscalar processors attack the ILP problem dynamically, at runtime. They maintain a **window** of in-flight instructions (the reorder buffer), use **register renaming** to eliminate false dependencies (WAR and WAW hazards), and employ **dynamic scheduling** (Tomasulo's algorithm or its descendants) to issue instructions as soon as their operands are available, regardless of program order.

These techniques are remarkably effective for moderate amounts of ILP. A typical out-of-order processor can sustain 2-4 instructions per cycle on integer code and somewhat more on floating-point-heavy scientific workloads. But they have fundamental limitations:

1. **Window size**: The reorder buffer is finite. A processor with a 256-entry ROB can only look ahead 256 instructions for parallelism. If the ILP exists across a wider span, it goes unexploited.

2. **Branch prediction**: At runtime, the processor does not know which way a branch will go until it is resolved. Branch predictors are accurate (95-99% for well-behaved code), but mispredictions cause pipeline flushes that destroy cycles of work.

3. **Power and complexity**: The scheduling hardware -- the reservation stations, the common data bus, the branch predictor, the memory disambiguation logic -- consumes significant die area and power. Scaling these structures to wider issue widths yields diminishing returns.

4. **Memory latency**: Cache misses stall the pipeline for tens or hundreds of cycles. Dynamic scheduling can partially hide this latency, but only if there are sufficient independent instructions to fill the gap.

The alternative approach -- and the one that motivated trace scheduling -- is to do the work of finding parallelism **statically, in the compiler**, and to build hardware that is simple enough to execute whatever the compiler says, without second-guessing. This is the VLIW philosophy.

### 1.4 The ILP Landscape: Empirical Studies

The question "how much ILP exists in real programs?" was the subject of intensive empirical study throughout the 1980s and 1990s. The answer depends critically on the assumptions made about the hardware and the compiler.

**Wall's 1991 study**: David Wall of DEC Western Research Lab published a landmark study, *"Limits of Instruction-Level Parallelism,"* at ASPLOS-IV in 1991. Wall simulated an idealized processor with unlimited functional units, perfect branch prediction, perfect memory disambiguation, and unlimited register renaming, running the SPEC89 benchmarks. His findings:

- With a **realistic window size** (64-256 instructions) and realistic branch prediction (95% accuracy), the available ILP was approximately 2-5 for integer programs and 3-8 for floating-point programs.
- With an **unlimited window** and perfect branch prediction, the ILP rose to 10-60 for integer programs and much higher for floating-point programs.
- The critical bottleneck for integer programs was **branch prediction accuracy**: even small misprediction rates dramatically reduced achievable ILP.
- For floating-point programs, **memory disambiguation** (the ability to reorder loads and stores when they access different addresses) was the key enabler.

**Lam and Wilson's study (1992)**: Monica Lam and Robert Wilson explored ILP limits specifically for VLIW architectures, finding that trace scheduling could exploit ILP of 5-10 on scientific programs but only 2-3 on control-intensive integer programs.

**Austin and Sohi (1992)**: Tom Austin and Gurindar Sohi studied "dynamic instruction reuse" and found that many programs exhibit repetitive instruction sequences that could be exploited for additional parallelism.

These studies established a consensus view:

1. There is substantial ILP in most programs, far more than basic-block scheduling can exploit.
2. The practical achievable ILP is limited by branch prediction accuracy, memory latency, and the compiler/hardware's ability to look ahead.
3. Floating-point and scientific programs have more ILP than integer programs.
4. Trace scheduling (and related techniques) can approach the limits for floating-point programs but fall short for integer programs due to irregular control flow.

### 1.5 The ILP Wall in Historical Context

The ILP wall was not merely an academic concern. By the mid-1990s, processor designers at Intel, IBM, DEC, and elsewhere were facing a practical crisis: each successive generation of superscalar processor delivered diminishing returns in ILP exploitation.

The Intel Pentium Pro (1995) was a 3-wide out-of-order superscalar. The Pentium 4 (2000) pushed clock speeds higher but did not significantly increase issue width. The Core architecture (2006) returned to sensible clock speeds and achieved 4-wide issue. By the 2010s, mainstream processors had stabilized at 4-6 wide issue, with sustained IPC (instructions per clock) of 2-4 on integer workloads.

The reason for this plateau was precisely the ILP wall: integer programs simply do not contain enough parallelism to sustain wider issue, regardless of how sophisticated the hardware becomes. This realization drove the industry toward **thread-level parallelism** (multicore processors) and **data-level parallelism** (SIMD/vector extensions, GPUs) as the paths to continued performance scaling.

Fisher's trace scheduling was, in many ways, the first serious attempt to break through the ILP wall by looking beyond basic blocks. The techniques Fisher developed remain the most effective compiler-based approaches to ILP extraction, even though the hardware industry ultimately chose a different path for general-purpose computing.

---

## 2. Basic Blocks as the Natural Unit

### 2.1 Definition and Properties

A **basic block** is a maximal sequence of instructions with one entry point and one exit point. No instruction within a basic block is a branch target (except the first instruction), and no instruction within a basic block is a branch (except the last instruction). Execution enters a basic block at the beginning and exits at the end; once you start executing a basic block, you execute every instruction in it.

Basic blocks are the natural unit of compiler analysis because within a basic block, the control flow is trivial: it is a straight line. The only dependencies that matter are data dependencies -- read-after-write (RAW), write-after-read (WAR), and write-after-write (WAW) -- and these can be analyzed precisely.

The compiler can build a **data dependency DAG** (directed acyclic graph) for a basic block, where nodes are instructions and edges represent dependencies. Any topological ordering of this DAG is a valid schedule. The compiler's job is to find the topological ordering that minimizes execution time on the target machine, subject to resource constraints (finite numbers of functional units, memory ports, etc.).

This problem -- **local instruction scheduling** -- is well-understood and efficiently solvable for most practical cases, typically via **list scheduling** (described in detail in Part 6).

### 2.2 The Branch Density Problem

The difficulty is that basic blocks are, in practice, very small. Extensive measurements of real programs, conducted by researchers throughout the 1980s and 1990s, consistently showed that:

- The **average dynamic branch frequency** in typical programs is between 15% and 25%. That is, roughly one in every 4 to 7 instructions is a branch.

- The **average basic block size** is therefore 4 to 7 instructions, depending on the instruction set architecture and the type of program.

- Control-intensive programs (compilers, operating systems, interpreters, database engines) tend to have even smaller basic blocks, sometimes averaging 3-4 instructions.

- Scientific and numerical programs tend to have larger basic blocks, sometimes 8-12 instructions, particularly in inner loops.

These measurements have been replicated across many architectures and workload classes. Hennessy and Patterson, in their influential textbook *Computer Architecture: A Quantitative Approach*, report average basic block sizes of 4-7 instructions for the SPECint benchmarks and somewhat larger values for SPECfp.

### 2.3 The ILP Ceiling Within a Basic Block

If the average basic block contains 5 instructions, and some of those instructions are dependent on each other, the ILP available within a single basic block is typically 1.5 to 2.5. A 4-wide superscalar or VLIW processor scheduling within basic blocks alone would sustain, at best, about 2 operations per cycle -- far below its peak throughput.

This is the fundamental limitation that trace scheduling was designed to overcome. To exploit the full parallelism of a wide-issue processor, the compiler must schedule across basic block boundaries, moving instructions from one basic block into another, past branches and join points, to fill the available operation slots.

Consider a simple example:

```
    Block A:                Block B:                Block C:
      x = load [p]           y = x + 1               z = x - 1
      if (x > 0) goto B      w = y * 2               v = z * 3
                              ...                     ...
```

Block A has 2 instructions. Block B has 2 instructions (plus more). Block C has 2 instructions (plus more). If the compiler is limited to scheduling within each block independently, it can only find parallelism within each 2-instruction block -- essentially none.

But if the compiler knows that the branch in Block A is almost always taken (going to Block B), it could treat the sequence A-B as a single scheduling unit of 4+ instructions and find parallelism between `x = load [p]` and later instructions in Block B that are independent of `x`.

This is exactly what trace scheduling does.

### 2.4 Historical Context: The State of Compilers in the Late 1970s

When Fisher began his doctoral work in the mid-1970s, compilers for horizontal microcode were already performing a kind of local compaction within basic blocks. The problem of compacting microcode -- packing multiple micro-operations into a single horizontal microinstruction -- was well-studied. Researchers at IBM, Bell Labs, and various universities had developed algorithms for basic-block-level microcode compaction.

But these algorithms stopped at basic block boundaries. The idea of moving microcode operations across branches was considered too complex and too error-prone. The bookkeeping required to maintain program correctness seemed intractable.

Fisher's insight was that the bookkeeping *was* tractable, that it could be formalized, and that the payoff -- dramatically increased parallelism -- was worth the effort. This insight became his dissertation.

---

## 3. The Key Insight: Scheduling Across Basic Block Boundaries

### 3.1 The Barrier at the Branch

Why is scheduling within a single basic block so limiting? Because branches are the boundaries of certainty. Within a basic block, the compiler knows that every instruction will execute if any of them does. But at a branch, the compiler faces a fork: execution will proceed down one path or the other, and the compiler (working statically, before the program runs) does not know which.

Moving an instruction across a branch means potentially executing it in a context where it would not have been executed in the original program. This raises two concerns:

1. **Correctness**: If an instruction is moved above a branch and executed speculatively, its side effects (writes to registers or memory) must not corrupt the program state if the branch goes the other way.

2. **Redundancy**: If an instruction is moved across a join point (where two paths merge), it might need to be duplicated on both incoming paths to ensure that no matter how control reaches the join point, the instruction has been executed.

These concerns are real, but they are manageable. Fisher's contribution was to show that by carefully tracking which instructions have been moved and where, the compiler can insert **compensation code** (also called **bookkeeping code** or **fixup code**) at the appropriate points to maintain correctness. The cost is increased code size; the benefit is dramatically increased parallelism.

### 3.2 The Fundamental Contribution of Trace Scheduling

Trace scheduling gives the compiler permission -- and a mechanism -- to schedule across branch boundaries. Its key ideas are:

1. **Trace selection**: Identify the most frequently executed path through the program's control flow graph. This path, called a **trace**, may span many basic blocks, connected by the most probable branch outcomes.

2. **Trace compaction**: Schedule the trace as if it were a single basic block, ignoring branch boundaries. Use the full DAG-based scheduling algorithm, with the target machine's resources as constraints.

3. **Bookkeeping**: After compaction, insert compensation code at trace entry points (where off-trace paths join the trace) and trace exit points (where off-trace paths depart from the trace) to ensure that the less-likely paths still compute correctly.

4. **Iteration**: After scheduling one trace, select the next most-frequent trace from the remaining unscheduled code (which now includes any compensation blocks), and repeat until all code is scheduled.

This approach transforms the problem of scheduling code with complex control flow into a sequence of single-block scheduling problems, each applied to a long, straight-line sequence of instructions from the most frequently executed paths.

### 3.3 Why This Matters

The impact of trace scheduling is best understood through an example. Consider a loop body with 5 basic blocks, averaging 5 instructions each, connected by branches with various probabilities. Without trace scheduling, the compiler can find ILP of perhaps 2 within each block. With trace scheduling, the compiler can form a trace of, say, 20 instructions (the 4 most-probable blocks), schedule them as a single unit, and potentially find ILP of 5 or more.

On a VLIW machine with 7 or 14 operation slots, this difference is the difference between using 2 of 7 slots (28% utilization) and using 5 of 7 slots (71% utilization). The speedup is proportional.

Fisher's 1981 paper demonstrated these gains concretely, using profile-guided trace selection on realistic programs, and showed that trace scheduling could consistently expose ILP of 5 to 10 or more on scientific and systems code -- far beyond what basic-block scheduling could achieve.

---

# Part 2: Joseph A. Fisher and the Origins of Trace Scheduling

---

## 4. Josh Fisher: A Biographical Sketch

### 4.1 Early Life and Education

Joseph A. Fisher -- universally known as Josh Fisher -- was born on July 22, 1946, in the Bronx, New York. He earned a Bachelor of Arts in mathematics from New York University in 1968. After completing his undergraduate work, he pursued graduate studies in computer science at the Courant Institute of Mathematical Sciences at NYU, one of the premier research institutions in applied mathematics and computer science in the United States.

Fisher completed both a Master's degree and a Doctor of Philosophy in computer science at the Courant Institute, receiving his Ph.D. in 1979. His dissertation, titled *"The Optimization of Horizontal Microcode Within and Beyond Basic Blocks: An Application of Processor Scheduling with Resources,"* laid the groundwork for everything that followed.

### 4.2 The Dissertation

Fisher's dissertation addressed the problem of compacting horizontal microcode -- the low-level control words that drive the functional units of a processor. In the late 1970s, microprogrammed processors were the norm: the instruction set visible to the programmer (the ISA) was implemented by sequences of microinstructions stored in a control ROM. Each horizontal microinstruction specified the operations to be performed by every functional unit in a single cycle.

The challenge was compaction: given a sequence of micro-operations, pack them into as few horizontal microinstructions as possible. Within a basic block, this was equivalent to the scheduling problem described above. Fisher's key contribution was extending compaction *beyond* basic blocks, to sequences of micro-operations spanning multiple branch points.

In his dissertation, Fisher developed the **trace scheduling** algorithm as a systematic way to perform this extension. He also coined a term to describe the property he was exploiting: **instruction-level parallelism** (ILP). This term would go on to become one of the most widely used in all of computer architecture.

### 4.3 Yale University (1979-1984)

Upon completing his doctorate, Fisher joined the Department of Computer Science at Yale University as an assistant professor in 1979. He was promoted to associate professor in 1983. At Yale, Fisher pursued two interconnected lines of research:

1. **Trace scheduling as a compilation technique**: Fisher and his graduate students refined the trace scheduling algorithm, developed heuristics for trace selection, studied the code-size costs of compensation code, and demonstrated the algorithm's effectiveness on a variety of programs.

2. **VLIW architecture design**: Fisher realized that trace scheduling was most effective when targeted at machines with very wide instruction words -- machines designed from the ground up to exploit the parallelism that the compiler could find. He proposed the **Very Long Instruction Word (VLIW)** architectural style, in which each instruction contains multiple independent operations, one for each functional unit, and the hardware executes exactly what the instruction says, without dynamic scheduling or interlocking.

Fisher coined the term "VLIW" and published the foundational paper on VLIW architecture in 1983, at the 10th International Symposium on Computer Architecture (ISCA): *"Very Long Instruction Word Architectures and the ELI-512."*

### 4.4 The ELI-512 Project

The ELI-512 (Enormously Long Instruction -- 512 bits) was the VLIW machine design that Fisher and his Yale group developed as a concrete target for the trace scheduling compiler. The name was aspirational: "512" referred to the target instruction word width of 512 bits. In practice, the design evolved, and the actual instruction word exceeded 1,200 bits in later iterations.

Key properties of the ELI-512 design:

- **Instruction word**: Over 500 bits (later exceeding 1,200 bits), encoding 10 to 30 RISC-level operations per cycle.
- **Functional units**: Multiple integer ALUs, floating-point units, memory ports, and branch units, all controlled directly by fields in the instruction word.
- **No hardware interlocks**: The compiler was solely responsible for avoiding hazards. If the compiler placed two operations in the same instruction that had a data dependency, the hardware would produce incorrect results -- silently.
- **No dynamic scheduling**: No reorder buffer, no reservation stations, no register renaming. The hardware was simple; all the intelligence was in the compiler.

The ELI-512 was never built as a physical machine. But the practicality of compiling for it was demonstrated by a compiler built at Yale by Fisher and three of his graduate students: John Ruttenberg, Alexandru Nicolau, and -- most notably -- John Ellis, whose work became the **Bulldog compiler** (described in Section 19).

### 4.5 Multiflow Computer (1984-1990)

In 1984, Fisher, along with Yale colleagues John O'Donnell (who had led the ELI hardware project) and John Ruttenberg, co-founded **Multiflow Computer, Inc.** in Branford, Connecticut, near New Haven. The company's mission was to commercialize VLIW technology, building and selling general-purpose computers based on the trace scheduling compilation approach. The Multiflow story is covered in detail in Section 20.

### 4.6 Hewlett-Packard Labs (1990-2006)

When Multiflow ceased operations in March 1990, Fisher joined Hewlett-Packard Laboratories, initially working in HP's Palo Alto facility. In 1994, he became the director of HP Labs' Cambridge, Massachusetts, research center. At HP, Fisher continued his work on ILP, VLIW, and compiler technology. His research contributed to HP's work on the **PA-WideWord** architecture and, subsequently, to the **IA-64 / EPIC** architecture developed jointly with Intel.

Fisher was named an **HP Fellow** in 2000 and an **HP Senior Fellow** in 2002 -- the highest technical ranks within Hewlett-Packard. He retired from HP Labs in 2006 as Senior Fellow Emeritus.

### 4.7 Later Career and Recognition

After retiring from HP, Fisher returned to academia and consulting. His contributions to computer architecture were recognized by the field's most prestigious awards:

- **NSF Presidential Young Investigator's Award** (1984) -- for early-career excellence in research.
- **Connecticut Entrepreneur of the Year** (1987) -- for co-founding Multiflow.
- **Eckert-Mauchly Award** (2003) -- the most prestigious award in computer architecture, jointly given by the ACM and the IEEE Computer Society, recognizing Fisher's "25 years of seminal contributions to instruction-level parallelism, pioneering work on VLIW architectures, and the formulation of the Trace Scheduling compilation technique."
- **B. Ramakrishna Rau Award** (2012) -- named after Fisher's contemporary and fellow VLIW pioneer, this award recognized Fisher for his foundational work on VLIW and trace scheduling.

Fisher also co-authored the textbook *Embedded Computing: A VLIW Approach to Architecture, Compilers and Tools* (Morgan Kaufmann, 2005), with Paolo Faraboschi and Cliff Young, which presented VLIW as a practical approach for embedded and media processing.

Fisher holds Spanish citizenship through Sephardic heritage and is married to Elizabeth Fisher, with whom he has two children.

---

## 5. Fisher's 1981 Paper: The Foundational Document

### 5.1 Publication Details

Fisher's foundational paper, **"Trace Scheduling: A Technique for Global Microcode Compaction,"** was published in the *IEEE Transactions on Computers*, volume C-30, number 7, in July 1981 (pages 478-490). The paper has garnered over 1,700 citations, making it one of the most influential papers in the history of compiler design and computer architecture.

### 5.2 The Problem Statement

The paper opens by framing the problem in terms of horizontal microcode. In the late 1970s, microprogrammed processors used horizontal microinstructions to control their functional units directly. A horizontal microinstruction might be 100 to 200 bits wide, with separate fields for each ALU, multiplier, memory port, and branch unit. Vertical microcode -- the compact, sequential form -- needed to be "compacted" into horizontal microcode to exploit the available hardware parallelism.

Fisher observed that existing compaction techniques worked only within basic blocks. They could rearrange the micro-operations within a single straight-line sequence to fill the horizontal microinstruction slots, but they could not move operations across branches. Since basic blocks were typically small (4-7 micro-operations), the available parallelism was severely limited.

### 5.3 The Proposed Solution

Fisher proposed trace scheduling as a way to extend compaction beyond basic blocks. The key insight was deceptively simple:

> Select the most frequently executed path through the program (a "trace"), treat it as a single scheduling unit, compact it as if it were one large basic block, and then insert compensation code to handle the less-frequently-executed paths.

This approach exploited a crucial asymmetry: in most programs, a small fraction of the execution paths accounts for the vast majority of dynamic instruction executions. By optimizing the hot path and accepting some overhead on the cold paths, the compiler could achieve large average-case speedups.

### 5.4 The Algorithm Overview

The paper described the trace scheduling algorithm in four phases:

1. **Trace selection**: Using execution profile data (or static heuristics), identify the most frequently executed trace -- a linear sequence of basic blocks connected by the most probable branch edges.

2. **Data dependency analysis**: Build a DAG of data dependencies for all operations in the trace, ignoring control-flow boundaries.

3. **Compaction**: Use a list-scheduling algorithm to pack the trace's operations into horizontal microinstructions, subject to the target machine's resource constraints.

4. **Bookkeeping**: For each operation that was moved across a control-flow boundary during compaction, insert a copy of that operation on the off-trace path(s) to ensure correctness.

The paper proved that the bookkeeping rules were sufficient to maintain correctness and described the conditions under which compensation code was needed.

### 5.5 Why It Mattered

Fisher's paper was the first to demonstrate a practical, general-purpose algorithm for global code motion -- moving instructions across arbitrary branch boundaries in a correctness-preserving way. Previous work on global optimization (e.g., common subexpression elimination, loop-invariant code motion) had addressed specific patterns, but none had provided a systematic framework for arbitrary code rearrangement across control flow.

The paper also introduced the concept of **profile-driven compilation**: using runtime execution frequencies to guide the compiler's optimization decisions. This idea, now ubiquitous as **profile-guided optimization (PGO)** in modern compilers, was radical in 1981.

### 5.6 The Context of the 1981 Paper

To appreciate the significance of Fisher's paper, it is helpful to understand the state of compiler research in 1981:

- **Local optimization was well-understood**: Techniques for optimizing within basic blocks -- common subexpression elimination, constant folding, dead code elimination, register allocation by graph coloring -- had been developed throughout the 1970s and were being implemented in production compilers (the PCC portable C compiler, IBM's PL/I compiler, DEC's VAX compilers).

- **Global optimization was emerging**: Dataflow analysis for global optimization (reaching definitions, available expressions, live variables) had been formalized by Kildall (1973) and Hecht (1977), and was being used for optimizations like global constant propagation and global dead code elimination. But these optimizations worked by propagating information across block boundaries, not by moving instructions across them.

- **Instruction scheduling was primitive**: Most compilers performed no instruction scheduling at all. The few that did operated strictly within basic blocks, using ad hoc algorithms rather than systematic DAG-based scheduling.

- **Profile-guided optimization was virtually unknown**: A few researchers had experimented with using execution profiles to guide optimization (notably at IBM), but the technique was not widely known or used.

- **VLIW did not exist as a concept**: Microprogramming was widespread, but the idea of exposing the horizontal microinstruction directly to the compiler as the ISA was Fisher's innovation.

Fisher's paper simultaneously introduced: (1) a systematic algorithm for instruction scheduling across basic blocks, (2) a general framework for code motion with correctness-preserving compensation, (3) the concept of profile-guided trace selection, and (4) the VLIW architectural target for which these techniques were most effective. Any one of these contributions would have been significant; together, they constituted a paradigm shift in compiler design.

The paper's impact was amplified by its timing. The early 1980s were a period of explosive growth in computer architecture -- the RISC revolution was beginning (Berkeley RISC-I in 1982, Stanford MIPS in 1983), and researchers were actively seeking new ways to exploit the growing transistor budgets provided by Moore's Law. Fisher's work provided one of the most intellectually coherent answers to the question "what should we do with more transistors?"

---

## 6. The Key Insight Formalized

### 6.1 What Is a Trace?

A **trace** is a sequence of basic blocks connected by the most likely control-flow edges, forming a linear path through the program's control flow graph (CFG). Formally:

Given a control flow graph G = (V, E), where V is the set of basic blocks and E is the set of control-flow edges (each labeled with an execution frequency or probability), a trace T is a sequence of basic blocks (B_1, B_2, ..., B_k) such that:

1. For each i from 1 to k-1, there is an edge from B_i to B_{i+1} in E.
2. The edge from B_i to B_{i+1} is the most-probable successor edge of B_i (or one of the most-probable, in case of ties).
3. The sequence is maximal under some termination criterion (maximum length, back-edge encountered, profitability threshold, etc.).

The trace is a **linear** structure: it has one entry (the top of B_1) and one exit (the bottom of B_k), but it may have **side entries** (where off-trace paths join the trace at the tops of B_2, B_3, ..., B_k) and **side exits** (where off-trace paths depart from the trace at branches within B_1, B_2, ..., B_{k-1}).

### 6.2 The Trace as a Scheduling Unit

The compiler treats the trace as a single, large basic block for scheduling purposes. It builds a data-dependency DAG for all operations in the trace, combining the operations from all constituent basic blocks into one unified dependency graph. Branch instructions within the trace are included as nodes in the DAG (they may have dependencies and resource requirements), but the control-flow edges they represent are *ignored* for scheduling purposes.

The result is a DAG that may contain significantly more operations than any single basic block -- and therefore significantly more opportunities for parallelism. An operation from B_3 that is independent of all operations in B_1 can be scheduled in the same instruction as an operation from B_1, even though they were originally in different basic blocks separated by two branches.

### 6.3 Compensation Code: The Correctness Mechanism

When the scheduler moves an operation across a control-flow boundary, it may violate the original program semantics for paths that do not follow the trace. Compensation code restores correctness.

There are two fundamental types of code motion across a branch boundary, and each requires a different form of compensation:

**Type 1: Upward motion past a join point (trace entry)**

Consider a trace that includes blocks B and C, where B is followed by C on the trace, but block A from off-trace also branches to C:

```
        A (off-trace)
         \
          v
    B --> C --> ...  (trace)
```

If an operation originally in C is moved upward past the join point (into B), it will no longer execute when control arrives at C via A. The compiler must insert a **copy** of the moved operation on the off-trace path from A to C.

This is called **above-the-join** or **join compensation**.

**Type 2: Downward motion past a branch (trace exit)**

Consider a trace that includes blocks B and C, where B branches to C on the trace, but also has an off-trace exit to block D:

```
    B --> C (trace)
     \
      v
      D (off-trace)
```

If an operation originally in B is moved downward past the branch (into C), it will no longer execute when control goes from B to D. The compiler must insert a **copy** of the moved operation on the off-trace path from B to D.

This is called **below-the-branch** or **branch compensation**.

In both cases, the compensation code ensures that every operation executes on every path through the program, exactly as it would have in the original code, even though the operations have been rearranged to exploit parallelism on the most-frequently-executed path.

### 6.4 The Cost of Compensation

Compensation code comes at a price: **increased code size**. Every time an operation is moved across a boundary, a copy may be inserted on an off-trace path. If the trace is long and many operations are moved, the number of copies can grow substantially.

Measurements of practical trace scheduling compilers have shown that the average code-size increase due to trace scheduling is modest for well-structured programs. Researchers at Multiflow reported code-size increases of approximately 6% for the SPEC89 benchmark suite. However, for programs with complex, irregular control flow, the increase can be larger.

The compiler must balance the benefit of increased parallelism (on the hot path) against the cost of increased code size (on the cold paths). This trade-off is inherent in the trace scheduling approach and is controlled by the trace selection heuristics, the aggressiveness of code motion, and various compiler tuning parameters.

---

# Part 3: Trace Scheduling -- The Algorithm

---

## 7. Step 1: Trace Selection

### 7.1 The Goal

The first step in trace scheduling is to identify the trace: the sequence of basic blocks that will be treated as a single scheduling unit. The quality of this selection is critical -- a well-chosen trace captures the most frequently executed path and provides ample scheduling opportunities, while a poorly chosen trace wastes compilation effort on infrequently executed code.

### 7.2 Profile-Guided Selection

The most accurate method of trace selection uses **execution profile data**. The compiler instruments the program, runs it on representative inputs, and collects branch frequencies: for each branch instruction, how often was each outcome taken?

With profile data, the compiler can annotate the control flow graph with **edge weights** (execution counts) and **block weights** (the number of times each basic block was executed). Trace selection then proceeds by following the heaviest path through the weighted CFG.

Profile-guided selection requires a two-phase compilation process:

1. **Instrumented build**: Compile the program with profiling instrumentation, producing an executable that records branch outcomes during execution.
2. **Profile collection**: Run the instrumented program on representative inputs, generating a profile database.
3. **Optimized build**: Recompile the program using the profile data to guide trace selection and other optimizations.

This approach produces the highest-quality traces but has practical limitations:

- The representative inputs must accurately reflect production workloads. If the profiling inputs are unrepresentative, the selected traces may be suboptimal.
- The two-phase process adds complexity to the build pipeline.
- Programs whose behavior varies significantly across inputs may not benefit much from any single profile.

Despite these limitations, profile-guided compilation has become standard practice in high-performance computing. Modern compilers -- including GCC, LLVM/Clang, and the Intel compiler -- all support profile-guided optimization (PGO), and the technique descends directly from Fisher's work.

### 7.3 Heuristic Selection

When profile data is unavailable, the compiler can use **static heuristics** to estimate branch probabilities. Common heuristics, validated by extensive empirical measurements, include:

- **Loop back-edges are likely taken**: A branch that transfers control to the top of a loop is taken on most iterations. If the loop executes N iterations, the back-edge is taken N-1 times and not taken once. For typical loops (N >> 1), the back-edge probability is very high.

- **Forward branches to error handlers are unlikely taken**: A branch to an error-handling block (e.g., a null-pointer check, an array-bounds check) is rarely taken in correctly functioning programs.

- **Branches conditioned on equality (==) are less likely taken than those conditioned on inequality (!=)**: This heuristic reflects the observation that most conditional tests are guards against unusual conditions.

- **Negative-constant comparisons are unlikely**: A test like `if (x < 0)` is often a guard for an error condition.

These heuristics are surprisingly effective. Research by Ball and Larus (1993) showed that simple static heuristics could predict branch outcomes with 70-80% accuracy -- not as good as profile data, but far better than random guessing.

### 7.4 Fisher's Greedy Algorithm

Fisher's original trace-selection algorithm is a **greedy** approach:

```
Algorithm: GREEDY-TRACE-SELECTION(CFG, weights)

Input:  Control flow graph CFG = (V, E) with edge weights
Output: A trace T = (B_1, B_2, ..., B_k)

1.  Let B_seed = the basic block with the highest execution count
2.  Initialize T = (B_seed)

    // Extend the trace downward (forward)
3.  Let B_current = B_seed
4.  While B_current has successors:
5.      Let B_next = the successor of B_current with the highest edge weight
6.      If B_next is already in a trace, or extension is unprofitable:
7.          Break
8.      Append B_next to the end of T
9.      Set B_current = B_next

    // Extend the trace upward (backward)
10. Let B_current = B_seed
11. While B_current has predecessors:
12.     Let B_prev = the predecessor of B_current with the highest edge weight
13.     If B_prev is already in a trace, or extension is unprofitable:
14.         Break
15.     Prepend B_prev to the beginning of T
16.     Set B_current = B_prev

17. Return T
```

The algorithm starts at the most-frequently-executed block and greedily extends the trace in both directions by always following the most-probable successor (forward) or predecessor (backward). Extension stops when a block is already part of another trace, when a loop back-edge is encountered, when a maximum trace length is reached, or when the profitability of further extension drops below a threshold.

This algorithm is simple, runs in O(n) time where n is the number of blocks, and produces reasonable traces. It is not optimal -- it can make locally greedy choices that produce suboptimal global coverage -- but in practice, it works well enough that it remained the standard approach for decades.

### 7.5 The Outer Loop

After the first trace is selected and scheduled, the algorithm removes the trace's blocks from the CFG (or marks them as scheduled) and repeats the process on the remaining blocks. This continues until all blocks have been assigned to traces.

The order in which traces are selected matters: the first trace gets the most scheduling freedom (it can move operations freely), while later traces are more constrained (they include compensation code from earlier traces and have fewer scheduling options). The greedy strategy -- scheduling the hottest trace first -- ensures that the most frequently executed code gets the best schedule.

---

## 8. Step 2: Trace Compaction (Scheduling)

### 8.1 Building the Dependency DAG

Once a trace has been selected, the compiler builds a **data dependency DAG** for all operations in the trace. This DAG has nodes representing individual operations and directed edges representing dependencies.

Three types of dependencies are tracked:

1. **True dependencies (RAW -- Read After Write)**: Operation B reads a register or memory location that operation A writes. B cannot execute before A completes. This is a **true** or **flow** dependency and cannot be eliminated by renaming.

2. **Anti-dependencies (WAR -- Write After Read)**: Operation B writes a register or memory location that operation A reads. If B executes before A reads, A will get the wrong value. This is a **false** or **anti** dependency and can potentially be eliminated by register renaming or by using a different register for B's result.

3. **Output dependencies (WAW -- Write After Write)**: Both operations A and B write to the same register or memory location. The final value must be B's (assuming B comes after A in the original order). This is also a false dependency that can potentially be eliminated by renaming.

For register operands, dependency analysis is straightforward: the compiler knows exactly which registers each operation reads and writes. For memory operands, the analysis is more complex because the compiler must determine whether two memory operations might access the same address (the **memory aliasing** problem, discussed in Section 26).

### 8.2 Cross-Block Dependencies

A crucial aspect of trace scheduling is that the dependency DAG spans the entire trace, crossing basic block boundaries. An operation in block B_3 that reads a register written by an operation in block B_1 has a true dependency edge connecting them, even though they are separated by two branch instructions.

The branch instructions themselves are nodes in the DAG. They may have dependencies (e.g., a conditional branch reads the condition code set by a comparison instruction) and resource requirements (the branch unit is a functional unit that can only handle one branch per cycle, in most architectures).

### 8.3 The Scheduling Algorithm

With the dependency DAG in hand, the compiler schedules the trace using **list scheduling** (described in detail in Section 25). The algorithm proceeds cycle by cycle:

```
Algorithm: LIST-SCHEDULE-TRACE(DAG, machine)

Input:  Dependency DAG, machine resource model
Output: A schedule mapping operations to cycles and functional units

1.  Initialize cycle = 0
2.  Initialize ready_list = { operations with no predecessors in DAG }
3.  While ready_list is not empty:
4.      For each operation O in ready_list, sorted by priority:
5.          If a functional unit is available in this cycle for O:
6.              Schedule O in this cycle on that unit
7.              For each successor S of O in DAG:
8.                  If all predecessors of S are scheduled:
9.                      Add S to ready_list (available at cycle + latency(O))
10.             Remove O from ready_list
11.     Advance to next cycle
12. Return schedule
```

The priority function used to sort the ready list is a critical design choice. Common priority functions include:

- **Critical path length**: Priority is the length of the longest path from the operation to the end of the DAG. This ensures that operations on the critical path are scheduled first, minimizing the total schedule length.

- **Resource urgency**: Priority accounts for how scarce the required functional unit is. An operation that needs the only floating-point multiplier gets higher priority than one that can use any of four integer ALUs.

- **Speculative distance**: Priority accounts for how far the operation has been moved from its original position. Operations that have been moved across many branches (more speculative) may get lower priority.

### 8.4 Resource Model

The scheduling algorithm uses a **resource model** that describes the target machine's functional units and their capabilities:

- How many integer ALUs, floating-point adders, floating-point multipliers, memory ports, and branch units are available.
- The latency of each operation type (e.g., an integer add takes 1 cycle, a multiply takes 3 cycles, a cache-hit load takes 4 cycles).
- Any restrictions on which operations can be paired (e.g., at most one branch per cycle, at most two memory operations per cycle).

For a VLIW machine, the resource model directly corresponds to the instruction word format: each field in the instruction word corresponds to a functional unit, and the scheduler's job is to fill as many fields as possible in each instruction word.

---

## 9. Step 3: Bookkeeping (Compensation Code)

### 9.1 The Necessity of Bookkeeping

After the trace has been compacted (scheduled), some operations will have been moved from their original basic blocks to different positions in the schedule. If an operation has crossed a control-flow boundary -- moved above a join point or below a branch -- the program semantics may be violated on the off-trace paths. Bookkeeping restores correctness by inserting copies of moved operations at the appropriate points.

### 9.2 Upward Code Motion Past a Join Point

Consider a trace containing blocks B and C, where C has two predecessors: B (on-trace) and A (off-trace).

```
    Original:               After moving op from C above join:

    A (off-trace)           A (off-trace)
     \                       \
      v                       v
    B --> C                 B --> C'   (op has been moved to B)
                              \
                               v
                              A' (compensation block: copy of op)
```

When an operation `op` that was originally in C is moved upward into B (or before the join point), it will no longer execute when control arrives at C via A. The fix: insert a copy of `op` on the edge from A to C. This may require creating a new compensation block (A' in the diagram).

**Rules for above-the-join compensation:**

- The copy must preserve all effects of the original operation: same source operands, same destination, same semantics.
- If the moved operation writes a register that is also written by some other operation on the off-trace path, the compiler must check for conflicts and may need to rename registers.
- If multiple operations from C are moved above the join, all of them must be copied.

### 9.3 Downward Code Motion Past a Branch

Consider a trace containing blocks B and C, where B has two successors: C (on-trace) and D (off-trace).

```
    Original:               After moving op from B below branch:

    B --> C (trace)         B' --> C  (op removed from B)
     \                       \
      v                       v
      D (off-trace)           D' (compensation: copy of op before D)
```

When an operation `op` that was originally in B is moved downward into C (or below the branch), it will no longer execute when control goes from B to D. The fix: insert a copy of `op` on the edge from B to D.

**Rules for below-the-branch compensation:**

- The copy must appear on every off-trace exit edge that the operation crosses.
- If the operation is moved below multiple branches (e.g., from B_1 past branches to B_2, B_3, and B_4), copies may be needed on multiple off-trace paths.
- The compiler must check that the copied operation does not introduce new dependencies on the off-trace path.

### 9.4 Combined Motion

In practice, a single operation may be moved both upward past join points and downward past branches during the scheduling of a trace. Each such motion may require its own compensation code. The total bookkeeping for a trace can involve many compensation copies across many off-trace edges.

Fisher's original paper formalized the bookkeeping rules and proved that they are sufficient to maintain program correctness for arbitrary code motion within a trace. The proof proceeds by induction on the number of code motions: each individual motion, combined with its compensation, preserves the program semantics.

### 9.5 The Code-Size Trade-off

Every compensation copy increases the total code size. In the worst case, if every operation in the trace is moved across every boundary, the code size can grow exponentially. In practice, the growth is much more modest:

- Most operations are not moved very far from their original positions.
- Many operations are not moved across any boundary at all (they stay in their original block, just rearranged within it).
- The compensation code is on cold paths (by construction, since the trace captures the hot path), so it rarely executes.

Researchers at Multiflow measured the code-size overhead of trace scheduling on the SPEC89 benchmarks and found an average increase of approximately 6%. This is a modest price for the parallelism gains.

However, the increased code size can have secondary effects: it increases instruction cache pressure, which may cause additional cache misses. This is a concern for programs with large working sets, and trace scheduling compilers typically include heuristics to limit code growth.

### 9.6 Techniques for Reducing Compensation Code

Two principal techniques have been developed to reduce the amount of compensation code:

**Avoidance**: The compiler restricts code motion to cases where no compensation code is needed. For example, if an operation can be moved upward within its own basic block without crossing a join point, no compensation is required. This is conservative but eliminates code growth entirely.

**Suppression**: The compiler performs global dataflow analysis to determine when a compensation copy is redundant -- when the off-trace path already computes the same value or when the moved operation's result is not live on the off-trace path. Redundant copies are suppressed.

The avoidance and suppression techniques were studied extensively by Freudenberger and Ruttenberg in their paper *"Avoidance and Suppression of Compensation Code in a Trace Scheduling Compiler"* (ACM TOPLAS, 1994), which showed that these techniques could reduce compensation code by 30-50% compared to naive bookkeeping.

---

## 10. Step 4: Iteration

### 10.1 The Iterative Process

After one trace has been selected, compacted, and its bookkeeping completed, the trace scheduling algorithm iterates. The next most-frequent trace is selected from the **remaining** unscheduled blocks -- which now include any compensation blocks generated by the first trace's bookkeeping. This new trace is compacted and bookkeeping is performed, and the process repeats.

```
Algorithm: TRACE-SCHEDULING(program)

Input:  Program with control flow graph, execution profile
Output: Fully scheduled program

1.  Build weighted control flow graph from program and profile data.
2.  While there are unscheduled blocks:
3.      Select the next trace T from the unscheduled blocks.
4.      Build dependency DAG for T.
5.      Compact T using list scheduling.
6.      Perform bookkeeping: insert compensation code.
7.      Mark T's blocks as scheduled.
8.      Update the CFG with any new compensation blocks.
9.  Return the fully scheduled program.
```

### 10.2 Order Dependence

The order in which traces are selected affects the quality of the final schedule. The first trace is scheduled in isolation and gets the best result. Subsequent traces are constrained by the compensation code from earlier traces and by the fact that some operations have already been duplicated.

The greedy strategy -- always selecting the hottest remaining trace -- works well in practice because:

- The hottest trace accounts for the most dynamic instructions, so optimizing it yields the greatest benefit.
- Compensation code for the hottest trace appears on cooler paths, where the overhead matters less.
- Later traces, being cooler, contribute less to total execution time, so suboptimal scheduling of these traces has a smaller impact.

### 10.3 Convergence

The iterative process terminates when all basic blocks have been assigned to traces. The resulting program is a fully scheduled version of the original, with the same semantics but a different (and, on the hot paths, much more compact) arrangement of operations.

The total compilation time for trace scheduling is dominated by the list scheduling step, which is O(n^2) per trace in the worst case (where n is the number of operations in the trace). Since the total number of operations across all traces is bounded by the size of the original program (plus compensation code), the overall compilation time is polynomial.

### 10.4 A Worked Example

To make the entire trace scheduling process concrete, consider the following small program fragment with four basic blocks and a simple control flow graph:

```
    Block A (weight: 1000):
        r1 = load [r10]        // A1: load from memory
        r2 = load [r11]        // A2: load from memory
        if (r1 > 0) goto B     // A3: conditional branch
        else goto C

    Block B (weight: 900):     // taken 90% of the time
        r3 = r1 + r2           // B1: add
        r4 = r3 * r3           // B2: multiply (3-cycle latency)
        r5 = r4 + 1            // B3: add
        goto D

    Block C (weight: 100):     // taken 10% of the time
        r3 = r1 - r2           // C1: subtract
        r5 = r3 * 2            // C2: shift/multiply
        goto D

    Block D (weight: 1000):
        store r5 -> [r12]      // D1: store result
```

**Target machine**: 2-wide VLIW (2 ALU slots per instruction, 1 memory slot, 1 branch slot). Load latency: 3 cycles. Multiply latency: 3 cycles. All other operations: 1 cycle.

**Step 1: Trace Selection**

The hottest path is A -> B -> D (total weight 900). This becomes our first trace.

```
Trace 1: A1, A2, A3, B1, B2, B3, D1
         (7 operations spanning 3 basic blocks)
```

**Step 2: Dependency DAG for the trace**

```
    A1 (load r1)  --[3 cycles]--> A3 (compare r1)
    A1 (load r1)  --[3 cycles]--> B1 (r1 + r2)
    A2 (load r2)  --[3 cycles]--> B1 (r1 + r2)
    B1 (r3 = r1+r2) --[1 cycle]--> B2 (r3 * r3)
    B2 (r4 = r3*r3) --[3 cycles]--> B3 (r4 + 1)
    B3 (r5 = r4+1)  --[1 cycle]--> D1 (store r5)
    A3 (branch)      --[1 cycle]--> B1 (control dep, relaxed for trace)
```

The critical path is: A1 -> B1 -> B2 -> B3 -> D1 = 3 + 1 + 3 + 1 = 8 cycles.

**Step 3: Compaction**

Without trace scheduling (basic-block scheduling only):

```
Cycle 1:  A1 (load r1)
Cycle 2:  A2 (load r2)
Cycle 3:  --- (waiting for A1, A2)
Cycle 4:  A3 (branch, r1 ready)     // enters block B
Cycle 5:  B1 (r1 + r2, both ready)
Cycle 6:  B2 (r3 * r3)
Cycle 7:  ---
Cycle 8:  ---
Cycle 9:  B3 (r4 + 1, r4 ready)
Cycle 10: D1 (store r5)
Total: 10 cycles, 7 operations = 0.7 ops/cycle
```

With trace scheduling (scheduling across block boundaries):

```
Cycle 1:  A1 (load r1)  |  A2 (load r2)     [2 ops in parallel]
Cycle 2:  ---            |  ---               [waiting for loads]
Cycle 3:  ---            |  ---               [waiting for loads]
Cycle 4:  A3 (branch)   |  B1 (r1+r2)        [B1 moved above its block!]
Cycle 5:  B2 (r3*r3)    |  ---
Cycle 6:  ---            |  ---               [waiting for multiply]
Cycle 7:  ---            |  ---
Cycle 8:  B3 (r4+1)     |  D1 (store r5)     [D1 moved up from block D]
Total: 8 cycles, 7 operations = 0.875 ops/cycle
```

The key code motions were:
- B1 was moved from block B into the same cycle as A3 (across the branch boundary).
- D1 was moved from block D into the same cycle as B3.

**Step 4: Bookkeeping**

Because B1 (r3 = r1 + r2) was executed speculatively (it now runs even if the branch goes to C), we need to verify that this is safe. Since B1 is a pure computation (no side effects), speculating it is safe -- if the branch goes to C, the value of r3 computed by B1 will simply be overwritten by C1.

However, D1 was moved upward past the trace exit to D. Since block C also goes to D, and D1 has been incorporated into the trace schedule, we need compensation: a copy of D1 on the C -> D path.

```
    Compensation block C' (after C):
        store r5 -> [r12]      // copy of D1
```

**Result**: The trace-scheduled version executes in 8 cycles instead of 10 -- a 20% improvement. On a wider machine (7 or 14 operations per cycle), the improvement would be much more dramatic.

### 10.5 Observations from the Example

Several important points emerge from this example:

1. **The benefit scales with machine width**: On a 2-wide machine, the benefit of trace scheduling is modest. On a 7-wide or 14-wide machine, the same code motions would fill many more slots, producing much larger speedups.

2. **Memory operations dominate the critical path**: The 3-cycle load latency is the main bottleneck. Trace scheduling helps by starting loads as early as possible (moving them above branches) and overlapping them with other work.

3. **Compensation code is on the cold path**: The compensation copy of D1 appears on the C -> D path, which executes only 10% of the time. The 20% speedup on the hot path (90% of executions) far outweighs the overhead of the compensation code.

4. **Speculative execution of pure computations is free**: Moving B1 above the branch costs nothing because pure computations have no side effects.

---

# Part 4: Trace Selection Algorithms in Depth

---

## 11. The Trace Selection Problem

### 11.1 Formal Statement

Given a weighted control flow graph G = (V, E, w), where w(e) gives the execution frequency of each edge e in E, the **trace selection problem** is to partition V into a set of traces T_1, T_2, ..., T_m that covers all blocks, such that the total weighted execution time of the scheduled program is minimized.

This problem is, in general, **NP-hard**. The difficulty arises from the interaction between trace selection and trace compaction: the quality of a trace depends on how well it compacts, which depends on the data dependencies within the trace, which depend on which blocks are included. Different partitions into traces can yield very different final schedules.

### 11.2 Heuristic Approaches

Because the problem is NP-hard, all practical trace-selection algorithms use heuristics. Fisher's greedy algorithm (Section 7.4) is the simplest and most widely used. More sophisticated approaches include:

- **Weighted-coverage algorithms**: These aim to maximize the total execution weight covered by the first k traces, using dynamic-programming or branch-and-bound techniques.

- **Shape-aware algorithms**: These consider the shape of the trace (number of side entries and side exits) and prefer traces with fewer compensation points.

- **Feedback-directed algorithms**: These use information from earlier compilation runs (or earlier iterations of the current compilation) to refine trace selection.

### 11.3 Trace Length Considerations

Longer traces offer more scheduling opportunities but also more compensation overhead. The optimal trace length depends on the target machine's issue width and the program's dependency structure:

- For a machine that issues 7 operations per cycle, a trace of 28-35 operations (4-5 cycles worth) provides enough material for effective scheduling.
- For a machine that issues 28 operations per cycle, traces of 100+ operations may be needed.
- Very long traces increase compilation time and may introduce excessive compensation code.

Most trace scheduling compilers impose a maximum trace length, typically 50-200 operations, and stop extending a trace when this limit is reached.

---

## 12. Fisher's Greedy Algorithm in Detail

### 12.1 The Algorithm

Fisher's greedy trace-selection algorithm (described in Section 7.4) is the standard approach used in most trace scheduling implementations. Its key properties:

- **Time complexity**: O(n) per trace, O(n) total for trace selection (where n = |V|).
- **Simplicity**: Easy to implement, easy to understand, easy to debug.
- **Effectiveness**: Produces traces that, while not optimal, are within a small factor of optimal for most programs.

### 12.2 Limitations

The greedy algorithm has several known limitations:

1. **Local optimality**: It always follows the most-probable edge, even when a slightly less probable edge would lead to a better trace (e.g., one with more scheduling opportunities or fewer side entries).

2. **Trace interference**: Early traces may "steal" blocks that would have been more profitable in later traces. The greedy algorithm does not look ahead to consider how the selection of one trace affects the quality of subsequent traces.

3. **Sensitivity to seed selection**: The choice of the initial seed block (the most-frequently-executed block) determines the starting point of the first trace, and this choice propagates through the entire partitioning.

### 12.3 Improvements

Several researchers have proposed improvements to the basic greedy algorithm:

- **Two-pass selection**: First select all trace seeds, then extend each trace. This avoids some interference between traces.

- **Profitability-weighted extension**: Instead of always following the most-probable edge, weight the extension decision by an estimate of the scheduling benefit (e.g., the number of independent operations that would be added).

- **Backtracking**: Allow the algorithm to undo a trace selection if a subsequent selection reveals a better partitioning.

In practice, the basic greedy algorithm works well enough that most of these improvements provide only marginal benefit. The real bottleneck in trace scheduling quality is usually the compaction step, not the selection step.

---

## 13. Superblocks: Eliminating Side Entries

### 13.1 The Problem with Join Points

One of the most significant complications in trace scheduling is the handling of **side entries** -- points within a trace where off-trace control flow joins the trace. When an operation is moved upward past a side entry, a copy must be placed on every off-trace path that enters at that point. This above-the-join compensation is complex to implement, difficult to optimize, and can cause significant code growth.

### 13.2 The Superblock Concept

In 1992, Wen-mei Hwu, Scott Mahlke, and their colleagues at the University of Illinois (the IMPACT research group) proposed the **superblock** as a simplified alternative to the trace. Their paper, *"The Superblock: An Effective Technique for VLIW and Superscalar Compilation,"* published in the *Journal of Supercomputing*, introduced a scheduling region with a crucial constraint:

> A superblock is a trace with **one entry** but **multiple exits** -- no side entries are allowed.

By eliminating side entries, the superblock eliminates the need for above-the-join compensation entirely. The only compensation code needed is for downward code motion past branches (side exits), which is simpler and produces less code growth.

### 13.3 Forming Superblocks via Tail Duplication

If a trace has side entries, the compiler can convert it to a superblock by **tail duplication**: for each side entry, the portion of the trace below the entry point is duplicated, creating a separate copy for the off-trace path. The duplicated code forms its own block (or superblock), reached by the off-trace path.

```
Original trace with side entry at C:

    A (off-trace)     B (on-trace)
     \                 |
      v                v
      C ------------> D --> E   (trace: B, C, D, E)

After tail duplication:

    A (off-trace)     B (on-trace)
     |                 |
     v                 v
    C' --> D' --> E'   C --> D --> E   (superblock: B, C, D, E)
                                       (no side entry)
```

The off-trace path from A now goes to a copy of the trace tail (C', D', E'), while the on-trace path from B goes to the original blocks (C, D, E). The resulting superblock (B, C, D, E) has only one entry (the top of B) and can be scheduled without any join compensation.

### 13.4 Trade-offs

The superblock approach trades join compensation for **increased code size due to tail duplication**. In the worst case, tail duplication can significantly increase the total code size, especially for traces with many side entries.

However, the simplification in the scheduler is substantial:

- The bookkeeping logic is simpler (only below-the-branch compensation).
- The compiler can perform more aggressive optimization within the superblock because there are no join-point constraints.
- Register allocation is simpler because there is only one entry point.

The IMPACT group demonstrated that superblock scheduling produced performance comparable to full trace scheduling on the SPECint and SPECfp benchmarks, with simpler compiler implementation and more predictable code-size behavior.

### 13.5 The IMPACT Compiler Project

The IMPACT (Illinois Microarchitecture Project using Advanced Compiler Technology) research group, led by Wen-mei Hwu at the University of Illinois at Urbana-Champaign, was the crucible in which superblocks and hyperblocks were forged. The IMPACT project, which ran from the late 1980s through the 2000s, produced some of the most influential compiler research of its era.

The IMPACT-I C compiler was a complete, retargetable optimizing compiler that implemented:

- **Profile-guided superblock formation**: Using execution profiles collected from representative inputs, the compiler identified hot traces and formed superblocks through tail duplication.
- **Superblock optimization**: A suite of classical optimizations (constant propagation, dead code elimination, copy propagation, strength reduction) applied within the expanded superblock scope, exploiting the single-entry property for simpler dataflow analysis.
- **Superblock scheduling**: List scheduling applied to the entire superblock, with below-the-branch compensation code for speculated operations.
- **Aggressive speculation**: The IMPACT compiler was one of the first to systematically study the benefits and costs of speculative code motion, including the impact on exception behavior and register pressure.
- **Predicated execution support**: When targeting architectures with predication support, the compiler could form hyperblocks and apply predicate-aware scheduling.

The IMPACT project trained a generation of compiler researchers who went on to leadership positions in industry and academia. Alumni of the group contributed to compilers at Intel, AMD, Qualcomm, ARM, and other major chip vendors. The group's publications -- dozens of papers at MICRO, ISCA, ASPLOS, PLDI, and other top venues -- form a substantial fraction of the foundational literature on ILP compilation.

### 13.6 Superblocks in Practice

Superblock formation became widely adopted in production compilers. GCC implements superblock-based scheduling through its `tracer.c` module, which forms superblocks from the most frequently executed traces based on profile information. The superblock approach is also used in various forms in the Intel compiler, the Open64 compiler, and LLVM.

The **Open64 compiler**, originally developed by SGI for the MIPS and IA-64 architectures, was one of the most complete implementations of superblock and hyperblock scheduling in a production compiler. Open64 was later open-sourced and formed the basis for several academic and commercial compiler projects. Its ILP optimization framework directly descended from the IMPACT and Multiflow lineages.

In the modern compiler landscape, superblock ideas appear in multiple forms:

- **GCC's `tracer.c`**: Implements the classic superblock formation algorithm -- profile-guided trace selection with tail duplication to eliminate side entries. The tracer runs early in the optimization pipeline, before instruction scheduling, and transforms the CFG to expose larger scheduling regions.

- **GCC's selective scheduling (`sel-sched.c`)**: A more advanced scheduling pass that can schedule across arbitrary regions, not limited to superblocks. This pass implements a form of global scheduling that considers multiple paths and makes path-sensitive scheduling decisions.

- **LLVM's machine scheduling framework**: While LLVM does not use the term "superblock" explicitly in its scheduling infrastructure, its `MachineScheduler` and `PostMachineScheduler` passes schedule within regions that are effectively superblock-like: single-entry scheduling regions formed by the control flow analysis.

- **LLVM's tail duplication pass**: LLVM includes a tail duplication pass in its code generation pipeline that duplicates blocks to eliminate merge points, directly analogous to the superblock formation technique.

---

## 14. Hyperblocks: Predicated Execution

### 14.1 The Idea

The **hyperblock**, proposed by Scott Mahlke, David Lin, William Chen, Richard Hank, and Roger Bringmann in their 1992 paper *"Effective Compiler Support for Predicated Execution Using the Hyperblock"* (25th Annual International Symposium on Microarchitecture), takes a radically different approach to eliminating branches: instead of scheduling around them, it eliminates them entirely using **predicated execution**.

### 14.2 Predicated Execution

In a processor that supports predicated execution, every instruction can be conditionally executed based on the value of a **predicate register**. A predicate register holds a boolean value (true or false), and an instruction annotated with a predicate register executes only if that predicate is true. Otherwise, the instruction becomes a no-op.

For example, the code:

```
    if (x > 0) {
        a = b + c;
    } else {
        a = b - c;
    }
```

Can be compiled to predicated instructions:

```
    p1, p2 = compare(x > 0)     // p1 = true if x > 0, p2 = true if x <= 0
    (p1) a = b + c               // executes only if p1 is true
    (p2) a = b - c               // executes only if p2 is true
```

No branch is needed. Both instructions are fetched and issued; only one writes its result.

### 14.3 Hyperblock Formation

A hyperblock is formed by **if-conversion**: the compiler takes a set of basic blocks connected by conditional branches and converts them into a single block of predicated instructions. All branches within the hyperblock are eliminated; the control flow is expressed entirely through predicate values.

The resulting hyperblock has:

- One entry point (like a superblock).
- **No branches** (all paths are predicated).
- All instructions from all paths within the hyperblock, annotated with appropriate predicates.

### 14.4 Scheduling a Hyperblock

Because a hyperblock contains no branches, it can be scheduled as a single basic block. The scheduler builds a dependency DAG (with predicate dependencies in addition to data dependencies) and applies standard list scheduling. Instructions from different paths -- which would have been in different basic blocks in the original program -- can be scheduled in the same cycle if they use different functional units.

### 14.5 Requirements and Limitations

The hyperblock approach requires:

1. **Hardware support for predication**: The processor must support predicate registers and predicated execution of all (or most) instruction types. Notable architectures with this support include IA-64/Itanium (64 predicate registers), ARM (conditional execution of most instructions), and various DSP architectures.

2. **Effective if-conversion**: The compiler must be able to identify profitable regions for if-conversion. Not all control flow is profitably if-converted; if both branches of a conditional are equally likely and both contain many instructions, predication may waste functional units executing instructions whose results are discarded.

3. **Predicate-aware scheduling**: The scheduler must understand predicate dependencies to avoid scheduling conflicts between predicated instructions.

### 14.6 Hyperblocks vs. Superblocks

The hyperblock and superblock approaches are complementary:

| Property | Superblock | Hyperblock |
|----------|-----------|------------|
| Entry points | One | One |
| Branches | Yes (side exits) | None (all predicated) |
| Hardware requirements | None special | Predication support |
| Compensation code | Below-the-branch | None |
| Wasted work | None (only hot path executes) | Instructions on cold paths execute but discard results |
| Best for | Programs with strong hot paths | Programs with balanced, short-path conditionals |

The hyperblock is most effective for **diamond-shaped** control flow: an if-then-else with short arms that merge quickly. The superblock is most effective for **linear** hot paths with occasional cold-path branches.

---

## 15. Treegions: Tree-Shaped Regions

### 15.1 Motivation

Both traces and superblocks are **linear** scheduling regions: they represent a single path through the control flow graph. Treegions, proposed by Michael Schlansker and B. Ramakrishna Rau (both at HP Labs), generalize the scheduling region to a **tree-shaped** subgraph of the CFG.

### 15.2 Definition

A **treegion** is a single-entry, multiple-exit region of the control flow graph where the control flow forms a tree. It has one root block (the entry point) and multiple leaf blocks (the exit points). Unlike a trace, which is a linear sequence, a treegion includes both sides of branches, forming a tree that fans out from the root.

```
Example treegion:

           A         (root, entry)
          / \
         B   C       (both branches of A's conditional)
        / \   \
       D   E   F    (further branches)
```

This treegion includes blocks A, B, C, D, E, and F. It has one entry (A) and four exits (D, E, F, and any edge leaving C that is not to F).

### 15.3 Advantages

Treegions offer several advantages over linear traces:

1. **Larger scheduling regions**: By including both sides of branches, treegions capture more operations and more scheduling opportunities.

2. **No side entries**: Like superblocks, treegions have a single entry point, so above-the-join compensation is not needed.

3. **Multiple paths**: Unlike traces, treegions consider multiple execution paths simultaneously. This allows the scheduler to make better trade-offs between paths.

4. **No profile data required**: Because treegions are defined structurally (by the CFG shape), they can be formed without profile data. Trace and superblock formation both benefit from profile data to determine the hot path.

### 15.4 Scheduling Treegions

Scheduling a treegion is more complex than scheduling a linear trace because the scheduler must consider multiple paths. The typical approach is to schedule the tree from root to leaves, making scheduling decisions at each branch point that balance the needs of both successors.

GCC has explored treegion scheduling as an alternative to superblock scheduling. The GCC implementation (`sched-rgn.c` with treegion extensions) constructs treegions from the CFG by traversing from the procedure entry, absorbing successor blocks as long as they are not merge points, and stopping at join points to form treegion boundaries. This approach requires only a single pass over the CFG.

### 15.5 Limitations

Treegion scheduling has seen limited adoption compared to superblocks, partly because:

- The scheduling algorithm is more complex.
- The benefits over superblocks are modest for programs with strong hot paths (which are well-served by linear traces).
- The interaction with register allocation is more complex.

---

## 16. Region-Based Scheduling

### 16.1 Generalization

Traces, superblocks, hyperblocks, and treegions are all specific types of **scheduling regions** -- subgraphs of the control flow graph that are treated as single scheduling units. Region-based scheduling generalizes this concept to allow arbitrary region shapes, selected by heuristic algorithms that balance scheduling opportunities against compilation complexity.

### 16.2 Extended Basic Blocks

An **extended basic block (EBB)** is a maximal sequence of basic blocks where each block (except the first) has exactly one predecessor. EBBs have one entry and multiple exits, like superblocks, but are formed structurally (following unique-predecessor chains) rather than by profile data.

GCC implements EBB-based scheduling in its `sched-ebb.c` module.

### 16.3 Arbitrary Regions

Some research compilers have explored scheduling of arbitrary CFG regions, including regions with multiple entries and exits, cycles (loops), and irreducible control flow. These approaches offer the most scheduling freedom but require the most complex bookkeeping and have seen limited practical adoption.

### 16.4 The Region Selection Spectrum

The various scheduling region types form a spectrum from simple to complex:

```
Basic Block  <  EBB  <  Superblock  <  Trace  <  Treegion  <  Arbitrary Region
   (local)                                                      (fully global)

Simpler bookkeeping  --------------------------------->  More scheduling freedom
Less code growth     --------------------------------->  More potential code growth
Less compilation time --------------------------------->  More compilation time
```

In practice, the sweet spot for most compilers has been the **superblock** or **trace** level. These provide substantial scheduling improvements over basic blocks with manageable complexity and code growth.

---

# Part 5: VLIW Architectures -- The Hardware Side

---

## 17. What Is VLIW?

### 17.1 Definition

A **Very Long Instruction Word (VLIW)** architecture is a processor design in which each instruction word contains multiple independent operations, one for each functional unit in the processor. The instruction word is "very long" because it must encode a separate operation for every functional unit, resulting in instruction widths of 128 bits to over 1,000 bits.

In a VLIW processor:

- The compiler is **solely responsible** for finding parallelism, scheduling operations, and avoiding hazards.
- The hardware executes exactly what the instruction word says, dispatching each operation to its designated functional unit.
- There are **no hardware interlocks** (or minimal interlocking): if the compiler places two dependent operations in the same instruction, the hardware will produce incorrect results.
- There is **no out-of-order execution**: operations execute in the order specified by the instruction stream.
- There is **no register renaming** in hardware: the compiler must manage register allocation to avoid WAR and WAW hazards.

### 17.2 The VLIW Philosophy

The VLIW philosophy is a deliberate trade-off: move complexity from hardware to software.

```
+------------------+------------------+
|   Superscalar    |      VLIW        |
+------------------+------------------+
| Complex hardware | Simple hardware  |
| Simple compiler  | Complex compiler |
| Dynamic sched.   | Static sched.    |
| Reg. renaming    | Compiler renaming|
| Branch predictor | Profile data     |
| Large die area   | Small die area   |
| High power       | Low power        |
| Binary compat.   | Recompile needed |
+------------------+------------------+
```

The bet is that the compiler, working with global knowledge of the program and profile data about execution behavior, can do a better job of scheduling than the hardware, which sees only a local window of instructions. This bet has proven correct for some workload classes (DSP, media processing) and incorrect for others (general-purpose computing).

### 17.3 Instruction Word Format

A typical VLIW instruction word is divided into **slots**, each corresponding to a functional unit:

```
+-------+-------+-------+-------+-------+-------+-------+
| ALU 0 | ALU 1 | ALU 2 | ALU 3 | FPU 0 | FPU 1 | BR    |
+-------+-------+-------+-------+-------+-------+-------+
|<---32--->|<---32--->|<---32--->|<---32--->|<---32--->|<---32--->|<---32--->|
|<----------------------------  256 bits  ------------------------------>|
```

In this example (similar to the Multiflow TRACE 7/300), the instruction word is 256 bits wide and contains 7 operation slots: four integer/memory ALUs, two floating-point units, and one branch unit. Each slot encodes a complete operation (opcode, source registers, destination register) in 32 bits, plus additional control bits.

If a functional unit has nothing useful to do in a given cycle, its slot contains a **NOP** (no-operation). NOP slots are a significant source of code bloat in VLIW programs, especially for code with limited parallelism.

### 17.4 Comparison with Superscalar

The key difference between VLIW and superscalar architectures is **who decides what runs in parallel**:

| Aspect | Superscalar | VLIW |
|--------|------------|------|
| Parallelism discovery | Hardware (dynamic) | Compiler (static) |
| Scheduling | Runtime (OOO) | Compile time |
| Hazard detection | Hardware interlocks | Compiler analysis |
| Register management | Hardware renaming | Compiler allocation |
| Binary compatibility | Different widths OK | Tied to specific width |
| Power consumption | Higher (sched. HW) | Lower (no sched. HW) |
| Code density | Higher (no NOPs) | Lower (NOP padding) |
| Performance on irregular code | Better | Worse |
| Performance on regular code | Comparable | Comparable or better |

### 17.5 The Binary Compatibility Problem

One of VLIW's most significant practical problems is **binary compatibility**. Because the instruction word format is tightly coupled to the number and types of functional units, a program compiled for a 7-wide VLIW cannot run on a 14-wide VLIW (or vice versa) without recompilation.

In contrast, a superscalar processor can run any binary compiled for its instruction set, regardless of the processor's internal issue width. A program compiled for a 2-wide superscalar runs correctly (if perhaps suboptimally) on a 4-wide superscalar.

This limitation has been addressed in various ways:

- **Itanium/EPIC**: Uses template bits in the instruction word to specify parallelism, allowing hardware to group instructions flexibly.
- **Transmeta Crusoe**: Uses binary translation (Code Morphing Software) to translate x86 binaries into VLIW instructions at runtime.
- **Instruction packets**: Some VLIW architectures (TI C6x, Qualcomm Hexagon) use variable-length packets rather than fixed-width instruction words, reducing NOP padding.

---

## 18. ELI-512 (Fisher, Yale, 1983)

### 18.1 The First VLIW Architecture

The ELI-512 (Enormously Long Instruction -- 512 bits) was the first VLIW architecture, designed by Fisher and his group at Yale University between 1979 and 1983. It was presented at the 10th International Symposium on Computer Architecture (ISCA) in 1983 in the paper *"Very Long Instruction Word Architectures and the ELI-512."*

### 18.2 Architecture

The ELI-512 design had the following characteristics:

- **Instruction word**: Originally targeted at 512 bits, the design eventually exceeded 1,200 bits.
- **Operations per cycle**: 10 to 30 RISC-level operations, depending on the configuration.
- **Functional units**: Multiple integer ALUs, floating-point units, memory ports, and branch units, all controlled by separate fields in the instruction word.
- **Register file**: Large, multiported register file to support the many simultaneous reads and writes required by the wide instruction word.
- **No interlocks**: The hardware assumed the compiler had correctly scheduled all operations to avoid hazards.

### 18.3 The Compiler

The ELI-512 was a paper design -- it was never built as physical hardware. But its real contribution was as a **compiler target**: it demonstrated that the trace scheduling compiler could generate code for a machine with extreme parallelism, and that such code could run scientific programs 10 to 30 times faster than equivalent sequential code.

The compiler was developed by Fisher and his graduate students, particularly John Ellis (the Bulldog compiler), John Ruttenberg, and Alexandru Nicolau. The compiler generated code, measured its quality on simulations of the ELI-512, and demonstrated that trace scheduling could consistently exploit large amounts of ILP.

### 18.4 Legacy

The ELI-512 was important not as a machine but as a proof of concept. It demonstrated that:

1. VLIW architectures were feasible.
2. Compilers could generate effective code for very wide machines.
3. Trace scheduling could extract enough ILP to justify the wide instruction word.

These demonstrations motivated the founding of Multiflow and, indirectly, influenced every subsequent VLIW design.

---

## 19. The Bulldog Compiler (Ellis, 1985)

### 19.1 Background

The Bulldog compiler, developed by John R. Ellis as his Ph.D. dissertation at Yale University under Fisher's supervision, was the first complete implementation of a trace scheduling compiler for a VLIW architecture. The dissertation was published as a book by MIT Press in 1985 under the title *Bulldog: A Compiler for VLIW Architectures*, and it received the **ACM Doctoral Dissertation Award** for 1985 -- the highest recognition for a doctoral thesis in computer science.

### 19.2 The Name

The compiler was named "Bulldog" after the Yale Bulldogs, the athletic teams of Yale University. (The Yale mascot is a bulldog named Handsome Dan.)

### 19.3 Technical Contributions

The Bulldog compiler made several key contributions:

1. **Complete trace scheduling implementation**: Bulldog demonstrated that trace scheduling was not just theoretically interesting but practically implementable. It handled all the bookkeeping rules, compensation code generation, and iterative trace processing described in Fisher's 1981 paper.

2. **Memory-reference disambiguation**: Bulldog included techniques for determining when two memory operations (loads and stores) could safely be reordered. This is critical for code motion in the presence of pointers and arrays, where the compiler often cannot determine statically whether two memory addresses are the same (the aliasing problem).

3. **Memory-bank disambiguation**: For machines with banked memory systems (where different memory banks could be accessed simultaneously), Bulldog included analysis to determine when two memory accesses went to different banks and could therefore be executed in parallel.

4. **New code-generation algorithms**: Bulldog introduced several new algorithms for generating VLIW code from the intermediate representation, including techniques for handling complex control flow and multi-way branches.

### 19.4 Impact

The Bulldog compiler proved that the VLIW concept was viable. It generated correct, efficient code for a wide-issue machine and demonstrated speedups that justified the complexity of trace scheduling. Without Bulldog, VLIW might have remained a theoretical curiosity.

Ellis's award-winning dissertation also trained a generation of compiler researchers in the techniques of global instruction scheduling, and many of Bulldog's ideas were incorporated into the Multiflow compiler and subsequent compilers at HP, Intel, and elsewhere.

---

## 20. Multiflow Computer (1984-1990)

### 20.1 Founding

Multiflow Computer, Inc. was founded in April 1984 in Branford, Connecticut (near New Haven), by three Yale researchers:

- **Joseph A. (Josh) Fisher** -- the inventor of trace scheduling and VLIW.
- **John Ruttenberg** -- a graduate student who had worked on the trace scheduling compiler.
- **John O'Donnell** -- who had led the ELI hardware project at Yale.

The company was incorporated in Delaware. In January 1985, the first financing round closed, and the company had approximately 20 employees. In 1985, Donald E. Eckdahl, a former NCR division head, was hired as CEO to lead the business side.

### 20.2 The TRACE Product Line

Multiflow's products were the **TRACE** series of VLIW minisupercomputers. The product line included several configurations:

| Model | Operations/Cycle | Instruction Width | Notes |
|-------|-----------------|-------------------|-------|
| TRACE 7/200 | 7 | 256 bits | Initial model. 4 integer/memory + 2 FP + 1 branch |
| TRACE 7/300 | 7 | 256 bits | Faster clock |
| TRACE 14/200 | 14 | 512 bits | Double-wide |
| TRACE 14/300 | 14 | 512 bits | Faster clock. Most commercially successful model |
| TRACE 28/... | 28 | 1024 bits | Widest configuration |
| TRACE .../100 | Various | Various | Entry-level series (launched circa 1988) |

The 7-wide configuration had four integer/memory operations, two floating-point operations, and one branch operation per instruction. Each operation was encoded as a 32-bit subinstruction, with a 32-bit utility field, totaling 256 bits per instruction word.

The hardware used CMOS gate arrays, third-party floating-point chips, and medium-scale integrated circuits. The machines ran **Berkeley Unix** (BSD), which was compiled and fully functional on the VLIW hardware -- a significant achievement, as it meant that all of Unix (kernel, utilities, libraries) had been successfully compiled by the trace scheduling compiler.

### 20.3 Timeline

- **April 1984**: Company founded.
- **January 1985**: First financing round closes (~20 employees).
- **1985**: Compiler generates correct code.
- **Early 1987**: First systems delivered to three beta sites: Grumman Aircraft, Sikorsky Helicopter, and the Supercomputer Research Center.
- **May 1987**: Public demonstration of the TRACE 14/200 at a supercomputing conference in Santa Clara, California.
- **1987**: Compiler producing significant ILP exposure.
- **1988**: Faster floating-point chips introduced; /100 entry-level series launched.
- **1989**: Offices and distributors throughout Western Europe, Japan, and major US cities. GEI Rechnersysteme GmbH (a Daimler-Benz division) distributed systems in Germany.
- **March 27, 1990**: Company ceases operations.

### 20.4 Customers and Applications

Multiflow sold approximately **125 VLIW minisupercomputers** in the United States, Europe, and Japan. The primary application was numerical simulation for product development:

- Mechanical engineering simulation
- Aerodynamic analysis
- Defense and weapons design
- Crash dynamics
- General scientific computing

### 20.5 The Compiler

The Multiflow TRACE compiler was the company's crown jewel. Built on the foundations of the Yale trace scheduling work (and the Bulldog compiler), it was a production-quality optimizing compiler that could:

- Compile standard Fortran and C programs.
- Apply trace scheduling to exploit ILP across basic block boundaries.
- Generate code for 7-, 14-, or 28-wide instruction words.
- Produce competitive performance on numerical benchmarks.

The compiler's quality was so high that, after Multiflow's closure, it was licensed by many of the largest computer companies in the world:

- **Intel** -- Intel signed for access to Multiflow's trace scheduling compilers, sealing the deal with a $4 million equity investment and additional engineering funding. Descendants of the Multiflow compiler contributed to Intel's `icc` compiler (codenamed "Proton").
- **Hewlett-Packard** -- In May 1990, Multiflow perpetually licensed HP to use certain of Multiflow's intellectual property rights, including information relating to the Trace compiler. HP also hired Fisher.
- **Digital Equipment Corporation (DEC)**
- **Fujitsu**
- **Hughes**
- **HAL Computer Systems**
- **Silicon Graphics (SGI)**
- **Equator Technologies**
- **Hitachi**
- **NEC** -- The NEC Earth Simulator, once the world's fastest supercomputer, used a compiler with roots in the Multiflow technology.

Compilers descended from the Multiflow codebase were used for advanced development and benchmark reporting for the most important superscalar processors of the 1990s. Remarkably, descendants of the compiler were still in wide use more than 20 years after it first started generating correct code.

### 20.6 The Multiflow Trace Scheduling Compiler in Detail

The definitive technical description of the Multiflow compiler was published by Lowney, Freudenberger, Karzes, Lichtenstein, Nix, O'Donnell, and Ruttenberg in the *Journal of Supercomputing* in 1993: *"The Multiflow Trace Scheduling Compiler."* At 92 pages, it remains one of the most detailed accounts of a production-quality ILP compiler ever published.

The compiler operated in several phases:

**Front end**: Standard C and Fortran front ends parsed source code into an intermediate representation. The IR was a low-level, machine-independent form that preserved the program's control flow graph and data dependencies.

**Classical optimizations**: Before trace scheduling, the compiler performed a suite of classical optimizations: constant propagation, dead code elimination, common subexpression elimination, loop-invariant code motion, strength reduction, and induction variable optimization. These optimizations were critical because they simplified the code and exposed more ILP for the trace scheduler.

**Profiling and trace formation**: The compiler used execution profile data to weight the control flow graph and form traces. The profiling infrastructure was integrated into the compilation system, making the two-phase (instrument, then optimize) process seamless.

**Trace scheduling**: The core trace scheduling algorithm -- selection, compaction, bookkeeping -- as described in this document. The Multiflow implementation handled all the edge cases that arise in real programs: exception behavior, memory aliasing, function calls within traces, and interactions with the operating system.

**Memory disambiguation**: The compiler included sophisticated analysis to determine when two memory references could safely be reordered. This was critical for code motion: a load could be moved above a store only if the compiler could prove that they accessed different memory locations. The Multiflow compiler used a combination of type-based analysis, index analysis (for arrays), and knowledge of the Fortran aliasing rules to disambiguate memory references.

**Register allocation**: Global register allocation across the entire procedure, using graph coloring. The large register files of the TRACE machines (32 or more registers per class) reduced spilling pressure compared to register-starved architectures, but the wide instruction words increased the number of simultaneously live values, creating a different set of challenges.

**Code emission**: The final phase emitted the scheduled code as VLIW instruction words, padding unused functional unit slots with NOPs.

The paper reported performance results on a variety of benchmarks, showing that the TRACE 14/300 achieved 60-75% of peak floating-point throughput on well-structured numerical code -- a remarkable utilization rate for a 14-wide machine.

### 20.7 Why Multiflow Failed

Multiflow's closure on March 27, 1990, came two days after a large deal with Digital Equipment Corporation fell apart. The board determined that the prospects for successful additional financing were too unlikely to justify continuation.

The technical product was a success. The commercial failure had multiple causes:

1. **The killer micro revolution**: By 1990, it was clear that microprocessor-based systems (built around commodity chips like the Intel 486 and the emerging RISC chips from MIPS, SPARC, and PA-RISC) would deliver steadily increasing performance at steadily decreasing prices. Multiflow's custom hardware could not compete on cost.

2. **Economies of scale**: Building a full-scale, general-purpose computer company required hundreds of millions of dollars by 1990. Multiflow's venture-capital funding was insufficient for the scale required.

3. **The software ecosystem**: No new general-purpose computer company had succeeded without an existing large software base. Multiflow had to port everything -- operating system, compilers, libraries, applications -- to its VLIW architecture.

4. **VLIW's silicon requirements**: VLIW architectures required more silicon than contemporary microprocessor densities could support cost-effectively. The wide instruction word, large register file, and multiple functional units needed transistor budgets that would not be economical in single-chip form for years.

5. **Superscalar competition**: The major microprocessor vendors were beginning to implement ILP exploitation in hardware, through superscalar designs. These achieved much of the performance benefit of VLIW without requiring recompilation.

Despite its commercial failure, Multiflow's technical contributions were enormous. The company's approximately 20-person core engineering group subsequently produced:

- Four fellows at major American computer companies.
- Two Eckert-Mauchly Award winners (Fisher and Rau, who was not at Multiflow but whose Cydrome work was parallel).
- Multiple successful startup founders.
- Leaders of major development efforts at large corporations.

One TRACE system is preserved at the **Computer History Museum** in Mountain View, California.

---

## 21. Cydrome and the Cydra-5 (1984-1988)

### 21.1 Founding

Cydrome, Inc. was founded in 1984 in San Jose, California, by five engineers: David Yen, Wei Yen, Ross Towle, Arun Kumar, and **B. Ramakrishna (Bob) Rau**, who served as chief architect. The company was originally named "Axiom Systems" but sold that name to Sun Microsystems and hired the naming firm NameLab to develop a new identity. The resulting name combined "cyber" (computer) and "drome" (racecourse).

### 21.2 Bob Rau

Bob Rau was, alongside Fisher, one of the two central figures in VLIW and statically-scheduled ILP. While Fisher pursued trace scheduling, Rau pursued a complementary approach: **software pipelining** and **modulo scheduling** for loops, combined with architectural innovations like **rotating register files**.

Rau received the **Eckert-Mauchly Award** in 2002 -- one year before Fisher -- for "pioneering contributions to statically-scheduled instruction-level parallel processors and their compilers."

### 21.3 The Cydra-5 Architecture

The Cydra-5 (1987) was Cydrome's VLIW minisupercomputer. Its key features:

- **Instruction word**: 256 bits wide, with 7 operation fields.
- **Clock frequency**: 25 MHz (ECL technology).
- **Functional units**: Multiple integer and floating-point units.
- **Rotating register file**: A revolutionary feature where a set of registers could be "rotated" by one position each iteration of a loop. This allowed different iterations of a pipelined loop to use different registers without explicit renaming, enabling efficient software pipelining.
- **Predicated (guarded) execution**: Every instruction could be conditionally executed based on a predicate, enabling if-conversion and reducing branch overhead.
- **No data cache**: The Cydra-5 used a 64-way interleaved, 4-port memory system with hashed addressing to prevent hotspots, instead of a data cache. The designers were concerned that caching would introduce unpredictable latencies that would defeat static scheduling.
- **Instruction cache**: Present, as instruction access patterns are more predictable.

### 21.4 Software Pipelining

Rather than trace scheduling (which optimizes across basic blocks within a single trace), the Cydra-5 compiler emphasized **software pipelining**, a technique for overlapping successive iterations of a loop.

In software pipelining, the compiler creates a steady-state loop kernel in which one new iteration starts every *initiation interval* (II) cycles, while previous iterations are still in progress. The result is a pipeline of loop iterations, analogous to a hardware pipeline of instruction stages.

The rotating register file made this possible: each iteration used a different set of registers (shifted by the rotation), so multiple in-flight iterations did not conflict. This innovation was later adopted by the IA-64/Itanium architecture.

### 21.5 Commercial History

Cydrome relocated from San Jose to Milpitas in 1985. The company attracted an investment from Prime Computers, which OEM'd the Cydra-5 (Prime's systems were distinguished by black skins, versus Cydrome's white). Nine Cydra-5 systems were built: three prototypes and six production units. The machine was demonstrated publicly at the first Supercomputer Conference in 1987.

Cydrome's fate was sealed when Prime Computers' board withdrew from a planned acquisition in summer 1988. Without Prime's backing, Cydrome could not secure additional funding, and the company closed in 1988 after approximately four years of operation.

### 21.6 Legacy

Despite building only nine machines, Cydrome's impact was profound:

- **Rotating register files** became a standard feature in IA-64/Itanium.
- **Software pipelining** became a standard compiler technique, implemented in GCC, LLVM, and most production compilers.
- **Predicated execution** influenced IA-64 and ARM.
- **Bob Rau** and colleague **Mike Schlansker** were hired by HP Labs in 1988, where they led the **FAST (Formulation and Application of Software Techniques)** research project and developed the **HPL-PlayDoh** architecture, which directly influenced IA-64.
- HP acquired Cydrome's intellectual property upon hiring Rau and Schlansker.

---

## 22. Intel IA-64 / Itanium (2001-2021)

### 22.1 The Most Ambitious VLIW-Family Architecture

The Intel Itanium, based on the IA-64 instruction set architecture, was the most ambitious attempt to build a mainstream processor based on VLIW-derived principles. It represented a twenty-year, multi-billion-dollar bet that compiler technology could outperform dynamic hardware scheduling for general-purpose workloads.

It lost that bet.

### 22.2 Origins at HP Labs

The Itanium story begins at Hewlett-Packard Laboratories in the late 1980s. HP needed a successor to its PA-RISC architecture, and Dick Lampman (head of HP Labs' computer research) saw an opportunity to leapfrog RISC by exploiting ILP through compiler technology.

In 1988, Lampman hired Bob Rau and Mike Schlansker from the defunct Cydrome. They established the FAST research project and developed the HPL-PlayDoh architecture -- a research VLIW design that explored predication, speculation, rotating registers, and software pipelining.

In 1990, Josh Fisher was also hired by HP Labs (after Multiflow's closure), contributing to what became the PA-WideWord (PA-WW) project -- a wide-issue successor to PA-RISC.

### 22.3 The HP-Intel Partnership

By 1992, HP recognized that building a next-generation processor required semiconductor manufacturing capabilities it did not possess. In late 1993, HP approached Intel about a partnership. Intel had been separately exploring 64-bit architecture extensions and was impressed by HP's PA-WideWord design.

In June 1994, HP and Intel publicly announced their collaboration on a new 64-bit architecture. The joint team was led by **John Crawford** (Intel's chief architect for the effort) and **Jerry Huck** (HP's lead architect). The team included approximately 500 engineers, many of them recent college graduates -- a decision that would later be criticized as contributing to the project's delays.

### 22.4 EPIC: Explicitly Parallel Instruction Computing

The resulting architecture was dubbed **EPIC** (Explicitly Parallel Instruction Computing). Intel and HP deliberately avoided calling it "VLIW" for marketing reasons, but EPIC was firmly rooted in VLIW principles. The key differences from classical VLIW were:

1. **Template bits**: Instead of a fixed mapping from instruction slots to functional units, EPIC used 5-bit template fields to specify which slots could execute in parallel. This allowed some flexibility in hardware scheduling.

2. **Instruction grouping**: Instructions were organized into **groups** separated by **stop bits**. All instructions within a group were guaranteed by the compiler to be independent and could execute in parallel. Groups could span multiple bundles.

3. **Full interlocking**: Unlike pure VLIW, IA-64 included hardware interlocks to handle variable-latency operations (like cache misses). This sacrificed some of VLIW's simplicity but provided robustness.

4. **Predication**: 64 one-bit predicate registers, enabling extensive if-conversion and hyperblock scheduling.

5. **Speculation**: Hardware support for speculative loads through the **Advanced Load Address Table (ALAT)**, which tracked speculative memory accesses and validated them later.

6. **Rotating registers**: 96 rotating general-purpose registers, 48 rotating predicate registers, and 96 rotating floating-point registers, supporting efficient software pipelining.

### 22.5 Instruction Format

The IA-64 instruction format was organized as follows:

- **Bundle**: 128 bits, containing three 41-bit instruction syllables plus a 5-bit template field.
- **Template**: Specifies the types of the three syllables (M = memory, I = integer, F = floating-point, B = branch) and indicates stop bits.
- **Instruction syllable**: 41 bits encoding opcode, register specifiers, predicate register, and immediate values.

```
+----------+----------+----------+--------+
| Syllable | Syllable | Syllable |Template|
|  2 (41b) |  1 (41b) |  0 (41b) | (5b)   |
+----------+----------+----------+--------+
|<-----------------  128 bits  ------------------>|
```

### 22.6 Register File

The IA-64 register file was extraordinarily large:

- **128 general-purpose integer registers** (64-bit), each with a NaT (Not a Thing) trap bit for speculation. 32 static, 96 rotating.
- **128 floating-point registers** (82-bit), with NaTVal flags. 32 static, 96 rotating.
- **64 predicate registers** (1-bit). 16 static, 48 rotating.
- **8 branch registers** for indirect jumps and calls.
- **128 application registers** and **128 special-purpose registers** for kernel use.

### 22.7 Performance History

Itanium's performance history was a chronicle of disappointment:

- **Merced (Itanium 1, May 2001)**: Shipped after a decade of development. Performance was not competitive with existing RISC (PA-RISC, SPARC, POWER) and CISC (x86) processors. The x86 emulation layer was "particularly poor." Initial price: over $5,000 per processor.

- **McKinley (Itanium 2, July 2002)**: Significantly improved. Competitive with high-end RISC processors for server workloads. But it arrived too late to prevent the market from moving to x86-64.

- **Madison (2003)**: Incremental improvement.

- **Montecito (2006)**: Dual-core, 90nm. Competitive for specific enterprise workloads.

- **Tukwila (2010)**: Quad-core, QPI interconnect.

- **Poulson (2012)**: 8-core, 32nm. The most advanced Itanium.

- **Kittson (2017)**: Final generation. Functionally identical to Poulson.

### 22.8 The AMD64 Kill Shot

In 2003, AMD released the Opteron processor, implementing the **AMD64** instruction set: a 64-bit extension of the existing x86 architecture. AMD64 was a pragmatic design that provided 64-bit addressing and additional registers while maintaining full backward compatibility with existing 32-bit x86 software.

AMD64's advantage was immediate and devastating:

- **No recompilation required**: Existing 32-bit x86 software ran unmodified. New 64-bit software could be compiled using standard toolchains.
- **Easy migration**: Customers could upgrade hardware without replacing software.
- **Microsoft adoption**: Under pressure from AMD's success, Intel adopted AMD64 (rebranded as "Intel 64" or "EM64T") for its Xeon server processors, creating an industry standard.

Itanium required a complete ecosystem rebuild: new compilers, new operating systems, new applications. By the time the ecosystem was partially ready, AMD64 had won.

### 22.9 The Itanium Compiler Challenge

The IA-64 compiler was one of the most ambitious software engineering projects in the history of computing. The architecture was explicitly designed to be "written mainly by compilers, not by humans," and the compiler was expected to perform tasks that no compiler had ever successfully performed at scale:

**Predicate analysis**: The compiler had to manage 64 predicate registers, tracking which predicates were true or false on each path, combining predicates through compare-and-branch sequences, and ensuring that predicated instructions were scheduled correctly with respect to the predicate-producing instructions. The dataflow analysis required for predicate-aware optimization was substantially more complex than for conventional code.

**Speculation management**: The compiler had to decide which loads to speculate, insert the appropriate `ld.s` (speculative load) and `chk.s` (speculation check) instructions, manage the ALAT entries, and handle the recovery code for failed speculations. Getting this wrong could produce silent data corruption -- a compiler bug of the most dangerous kind.

**Software pipelining with rotating registers**: The compiler had to perform modulo scheduling for loops, manage the rotating register file (determining the number of rotating registers needed, inserting the `ctop`/`cexit` loop control instructions, and generating prologue/epilogue code), and handle complex loop structures including loops with conditional exits and nested loops.

**Bundle packing**: The compiler had to pack instructions into 128-bit bundles with valid templates. Not all combinations of instruction types fit into a single bundle (e.g., there is no template for three memory instructions), and the compiler had to insert stop bits at the correct positions to indicate instruction group boundaries. This added a combinatorial constraint to the already complex scheduling problem.

**Cross-bundle scheduling**: The compiler had to schedule instruction groups that could span multiple bundles, managing the dispersal of instructions across functional units while respecting template constraints and stop bit placement. This was far more complex than scheduling for a fixed-width VLIW instruction word.

The Intel compiler team -- which grew to hundreds of engineers -- worked for years to achieve competitive performance. The compiler eventually became quite good on specific workload classes (particularly floating-point-intensive scientific computing, where Itanium's large register file and wide issue width shone), but it never achieved competitive performance on the integer-intensive workloads that dominate the server market.

One illuminating anecdote: early Itanium benchmarks showed that the same C code, compiled with the Intel Itanium compiler, often ran slower on Itanium than on a contemporary Xeon processor compiled with the Intel x86 compiler. The compiler simply could not find enough ILP in general-purpose C code to fill the Itanium's wide instruction bundles, while the Xeon's dynamic scheduling hardware could exploit the available ILP without compiler assistance.

### 22.10 Why Itanium Failed

The Itanium's failure had multiple technical and market causes:

1. **Compiler difficulty**: The IA-64 architecture and compiler turned out to be "much more difficult to implement than originally thought." The EPIC concept depended on compiler capabilities that had never been demonstrated at scale for general-purpose workloads.

2. **Memory wall**: Statically scheduling around cache misses proved extremely difficult. A cache miss introduces a latency of 100+ cycles, and the compiler cannot reliably predict which loads will miss. Out-of-order superscalar processors handle this dynamically; Itanium could not. The compiler could use speculative loads (`ld.s`) to start loads early, but if the speculation was wrong (the load address was invalid, or a subsequent store overwrote the loaded value), the recovery cost was high.

3. **Branch prediction**: For irregular, control-intensive code (operating systems, databases, interpreters), hardware branch predictors outperform static compiler analysis. Itanium's predication helped for short conditional sequences, but was counterproductive for long conditional blocks -- predicated instructions from both paths consumed functional unit slots, reducing throughput when only one path's results were needed.

4. **Development delays**: The project took over a decade from announcement to first shipment, during which time x86 processors improved dramatically. The "500-person design team, many of them recent college graduates" struggled with the unprecedented complexity of the design. Early floorplanning in 1996 revealed that the chip was much larger than expected, forcing cuts to L2 cache size (from the planned 256 KB to 96 KB) and reducing performance.

5. **Binary compatibility**: The fundamental VLIW weakness -- lack of backward compatibility -- meant that Itanium required a complete software ecosystem rebuild. HP, Intel, Microsoft, Oracle, Red Hat, and others invested billions of dollars in porting operating systems, databases, and applications to IA-64, but the ecosystem never reached critical mass.

6. **The x86 emulation debacle**: Itanium included hardware for emulating x86 instructions, allowing existing 32-bit software to run on the new architecture. But this emulation was so slow -- roughly 10x slower than native execution -- that it was useless for production workloads. Users could not run their existing software at acceptable speeds, and the new native software was not yet available.

6. **AMD64 competition**: The pragmatic AMD64 extension provided 64-bit computing without ecosystem disruption, making Itanium's clean-sheet approach unnecessary.

### 22.10 End of Life

By 2015, only HP (later Hewlett Packard Enterprise) sold Itanium-based systems. In 2017, Intel announced that Kittson would be the last Itanium processor. Production orders ceased on January 30, 2020, and final shipments were completed on July 29, 2021.

Linux kernel support for Itanium was removed in Linux 6.7 (2024). As Linus Torvalds remarked: "It's dead, Jim."

### 22.11 Legacy

Despite its commercial failure, Itanium's legacy includes:

- **Predication**: Demonstrated the value of compiler-managed conditional execution.
- **Speculative loads**: The ALAT mechanism influenced later speculation support in other architectures.
- **Rotating registers**: Proved the concept for efficient software pipelining.
- **Large register files**: Pushed the state of the art in register file design.
- **Compiler research**: Funded enormous advances in compiler technology, particularly at Intel, HP, and academic institutions.

The IA-64 architecture was a magnificent engineering achievement that answered the wrong question. The question was not "Can compilers exploit ILP?" (they can). The question was "Can compilers exploit ILP *better than hardware* on *general-purpose workloads* at *acceptable cost*?" The answer, for the foreseeable future, is no.

---

## 23. TI TMS320C6x DSPs

### 23.1 The VLIW Success Story

While VLIW failed in general-purpose computing, it found spectacular success in **digital signal processing (DSP)**. The Texas Instruments TMS320C6000 family is the most prominent example, and it remains one of the largest commercial successes for VLIW architecture.

### 23.2 Architecture

The TMS320C6x family is built around TI's **VelociTI** VLIW architecture:

- **Operations per cycle**: Up to 8 (eight 32-bit operations executed simultaneously).
- **Instruction packet**: 256 bits (eight 32-bit operation slots).
- **Functional units**: 8 total -- four per data path (two are ALU/shift units, one is a multiplier, one is an ALU that also handles memory access). The processor has two data paths (A and B), each with 4 functional units.
- **Register file**: Two register files (A and B), each with 16 or 32 32-bit registers, supporting 40-bit and 64-bit wide modes.
- **Clock speed**: Up to 1.2 GHz in later generations.
- **Peak performance**: Up to 6,000 MIPS (millions of instructions per second) at highest clock speeds and full utilization.

### 23.3 The C6x Instruction Packet

The C6x uses a variable-length instruction packet rather than a fixed-width instruction word:

```
+------+------+------+------+------+------+------+------+
| Op 7 | Op 6 | Op 5 | Op 4 | Op 3 | Op 2 | Op 1 | Op 0 |
+------+------+------+------+------+------+------+------+
|<-------------------------  256 bits  ----------------------->|
```

Each 32-bit operation contains a **p-bit** (parallel bit) that indicates whether it executes in parallel with the next operation. This allows the hardware to determine packet boundaries without a fixed instruction word width, reducing NOP padding.

### 23.4 Why VLIW Works for DSP

The TMS320C6x's success in DSP applications stems from the characteristics of DSP workloads:

1. **Predictable workloads**: DSP algorithms (FIR filters, FFTs, codecs) have well-understood computational patterns. Loops are tight and regular. Branch behavior is predictable.

2. **Compile-time optimization**: Because the workload is known in advance, the compiler can be carefully tuned for specific algorithms. Developers often hand-optimize critical kernels.

3. **Modulo scheduling**: DSP inner loops are prime candidates for software pipelining (modulo scheduling), which the VLIW architecture supports natively through its wide instruction word.

4. **Power efficiency**: VLIW eliminates the power-hungry dynamic scheduling hardware, making the processor suitable for battery-powered and thermally constrained embedded devices.

5. **Deterministic latency**: DSP applications often have hard real-time requirements (e.g., telecom signal processing). VLIW's static scheduling provides deterministic, predictable execution timing.

6. **Cost**: The simple hardware is cheaper to fabricate than an equivalent out-of-order superscalar.

### 23.5 Applications

The TMS320C6x family has been used in:

- Wireless base stations (3G, 4G/LTE)
- Medical imaging (ultrasound, MRI)
- Radar and sonar systems
- Video surveillance and analytics
- Audio processing
- Industrial automation
- Military and defense systems

The C6x family remains in production and continues to evolve, with recent generations targeting AI/ML inference workloads in addition to traditional DSP.

---

## 24. Qualcomm Hexagon DSP

### 24.1 The Modern VLIW Powerhouse

The Qualcomm Hexagon is arguably the most widely deployed VLIW architecture in history, with over **1.2 billion DSP cores shipped** by 2012 (averaging 2.3 cores per Snapdragon SoC). It powers the DSP and AI processing in billions of smartphones, automotive systems, wearables, and network equipment worldwide.

### 24.2 Architecture

The Hexagon is a 32-bit/64-bit load-store architecture with a **4-way VLIW** design:

- **Operations per cycle**: Up to 4 instructions dispatched to 4 execution units.
- **Instruction packet**: Variable-length, containing 1 to 4 fixed-length 32-bit instructions.
- **Functional units**: Two SIMD execution units and two load/store units (in recent versions).
- **Register file**: 32 general-purpose 32-bit registers, usable pairwise as 64-bit register pairs.
- **Hardware multithreading**: Originally barrel (round-robin) multithreading; V5+ added dynamic multithreading (DMT) with thread switching on L2 misses.

### 24.3 Evolution: DSP to NPU

The Hexagon architecture has evolved dramatically since its introduction:

| Version | Year | Key Feature |
|---------|------|-------------|
| V1-V4 | 2006-2011 | Pure DSP focus |
| V5 | 2013 | Added floating-point, dynamic multithreading |
| V6+ | 2016+ | Hexagon Vector Extensions (HVX) for AI |
| V73+ | 2021+ | Hexagon Tensor Accelerator (HTA) |
| Latest | 2024+ | 50+ TOPS (INT8) performance, NPU branding |

The latest generations integrate the **Hexagon Tensor Accelerator** for AI/ML workloads, capable of 50 TOPS (trillions of operations per second) at INT8 precision. Qualcomm now brands the Hexagon as a **Neural Processing Unit (NPU)** rather than a DSP, reflecting its evolution from signal processing to AI inference.

### 24.4 Why Hexagon Succeeds

Hexagon's success stems from the same factors that favor VLIW in embedded computing:

- **Known workloads**: Imaging, video codecs (H.264, H.265, VP9, AV1), computer vision, and AI inference are well-characterized, predictable workloads.
- **Power efficiency**: The simple VLIW core consumes less power than an equivalent out-of-order design.
- **Integration**: Hexagon is deeply integrated into the Snapdragon SoC, sharing memory and data paths with the CPU, GPU, and other accelerators.
- **Compiler maturity**: Qualcomm has invested heavily in the Hexagon compiler toolchain, including LLVM-based compilers and AI model compilers.

### 24.5 Other Modern VLIW Implementations

Several other VLIW architectures have found success in embedded and media processing:

- **NXP (Philips) TriMedia**: A VLIW media processor used in set-top boxes, IP cameras, and consumer electronics. The TM3260 ran at 266 MHz with RISC-like VLIW operations. Over 40 million SoCs shipped by 2009 containing TriMedia cores (over 70 million cores total, as many SoCs contained multiple TriMedia processors).

- **STMicroelectronics ST200**: Based on the **Lx** VLIW platform jointly developed by HP Labs and STMicroelectronics. Each cluster executes up to 4 instructions per cycle. Used in set-top boxes, digital TVs, and -- notably -- HP LaserJet printers, where it reached millions of consumers without their knowing they were using a VLIW processor.

- **Analog Devices SHARC**: VLIW DSP for high-end audio processing, automotive audio, and industrial control.

- **Fujitsu FR-V**: VLIW processor for multimedia applications.

- **Elbrus**: Russian VLIW processors (Elbrus 2000/4S) with 512-bit-wide instruction words, used in military and government computing.

---

## 25. The Intel i860: VLIW on a Single Chip

### 25.1 The First Million-Transistor Chip

The Intel i860 (80860), announced on February 27, 1989, holds a special place in VLIW history as the first processor to implement VLIW principles on a single chip and the first microprocessor to exceed one million transistors.

### 25.2 Architecture

The i860 combined RISC and VLIW ideas:

- **Dual-instruction mode**: In its VLIW mode, the i860 executed 64-bit instruction pairs: a 32-bit "core" (integer/control) instruction paired with a 32-bit floating-point or graphics instruction, fetched simultaneously over a 64-bit bus.
- **Triple operation**: Using dual-operation floating-point instructions, the i860 could execute up to three operations per clock: one ALU operation, one floating-point multiply, and one floating-point add/subtract.
- **Separate pipelines**: The ALU, floating-point adder, floating-point multiplier, and graphics unit each had independent pipelines.
- **Programmed pipelines**: The pipelines were "program-accessible" -- the compiler directly controlled the pipeline stages, VLIW-style.

### 25.3 Performance Reality

On paper, the i860 could achieve 60-80 MFLOPS (million floating-point operations per second). In practice:

- Most compilers achieved only about 10 MFLOPS.
- Hand-optimized assembly code reached approximately 40 MFLOPS.
- Context switching was catastrophically expensive: 62 cycles in the best case, nearly 2,000 cycles in the worst, due to the large pipeline state that needed saving.
- Runtime code paths were "exceedingly difficult" to predict at compile time, making static scheduling ineffective for general-purpose code.

### 25.4 Applications and Legacy

Despite its general-purpose limitations, the i860 found niche applications:

- Intel supercomputers (iPSC/860, Paragon).
- Graphics accelerators (NeXTdimension board in the NeXTcube, SGI RealityEngine).
- Signal processing and military systems.
- Early Windows NT development (NT was initially developed on i860-based systems before being ported to x86).

The i860 demonstrated both the promise and the peril of single-chip VLIW: impressive peak throughput but difficult-to-achieve sustained performance on real workloads. Its graphics capabilities, particularly its SIMD-like pixel-processing operations, influenced Intel's later MMX extensions for the Pentium.

---

## 26. Transmeta Crusoe: VLIW Through the Looking Glass

### 26.1 A Different Approach

The Transmeta Crusoe (2000) took a radically different approach to the VLIW binary-compatibility problem: instead of requiring programs to be compiled for the VLIW architecture, it used **dynamic binary translation** to translate x86 binaries into VLIW instructions at runtime.

### 26.2 Code Morphing Software

The Crusoe was a simple VLIW core running Transmeta's proprietary **Code Morphing Software (CMS)**, which consisted of:

- An **interpreter**: Executed x86 instructions one at a time, profiling execution frequencies.
- A **dynamic binary translator**: When a code block was executed frequently enough, CMS translated it into optimized VLIW code, which was cached for future execution.
- A **runtime system**: Managed the translation cache, handled exceptions, and detected self-modifying code.

### 26.3 VLIW Core

The Crusoe VLIW core executed bundles called **molecules**, composed of multiple **atoms** (individual operations). Molecules were either 64 bits (two atoms) or 128 bits (four atoms). The core included hardware support for:

- General speculation (executing instructions before knowing they are needed).
- Memory aliasing detection (detecting conflicts between speculative loads and stores).
- Self-modifying code detection (invalidating translations when x86 code modifies itself).

### 26.4 Significance

Transmeta demonstrated that VLIW and x86 compatibility were not mutually exclusive. The Code Morphing approach solved the binary compatibility problem by making it a software concern rather than a hardware one. However, the performance overhead of runtime translation was significant, and Transmeta's processors were positioned for low-power mobile use rather than high performance.

The company shipped processors from 2000 to about 2007 before pivoting away from processor design. The technology influenced subsequent work on binary translation, including Intel's x86-to-Itanium compatibility layer and various academic research projects.

---

## 26.5 The Elbrus Architecture: VLIW Behind the Iron Curtain

One of the most fascinating VLIW implementations came from an unexpected quarter. The Russian **Elbrus** processor family, developed by the Moscow Center of SPARC Technologies (MCST), implemented a full VLIW architecture with 512-bit-wide instruction words encoding up to 23 operations per instruction. The Elbrus 2000 (or E2K) was designed in the late 1990s and early 2000s, targeting military, government, and high-security computing applications.

The Elbrus architecture is notable for several reasons:

1. **Hardware-managed binary translation**: Like Transmeta, the Elbrus includes a binary translation layer that can execute x86 code on the VLIW core, providing backward compatibility with the vast x86 software ecosystem.

2. **Array protection**: The architecture includes hardware-assisted memory safety features, checking array bounds at runtime, a feature decades ahead of similar proposals in Western architectures.

3. **Government deployment**: Elbrus processors are used in Russian military and government computing systems where Western processors are either unavailable (due to export controls) or untrusted (due to concerns about hardware backdoors).

The Elbrus demonstrates that the VLIW idea, far from being dead, continues to find application in contexts where the usual objections (binary compatibility, compiler difficulty) are either solved or irrelevant.

---

## 26.6 Software Pipelining: The Complementary Technique

### The Problem of Loop-Bound Parallelism

While trace scheduling addresses the problem of ILP across basic blocks in general control flow, a complementary technique -- **software pipelining** -- addresses the equally important problem of ILP across iterations of loops.

Consider a simple loop:

```
    for (i = 0; i < N; i++) {
        A[i] = B[i] * C[i] + D[i];
    }
```

Each iteration performs the same sequence of operations: two loads, a multiply, an add, and a store. If the multiply has a 3-cycle latency, then within a single iteration, the add must wait 3 cycles after the multiply starts. But the loads for iteration i+1 are completely independent of the computation in iteration i (assuming no aliasing). Software pipelining exploits this by overlapping iterations.

### The Concept

In software pipelining, the compiler creates a **steady-state loop kernel** where operations from different iterations execute in the same cycle:

```
Without software pipelining:

    Cycle 1:  load B[0], load C[0]
    Cycle 2:  ---
    Cycle 3:  ---
    Cycle 4:  mul B[0]*C[0], load D[0]
    Cycle 5:  add result+D[0]
    Cycle 6:  store A[0]
    Cycle 7:  load B[1], load C[1]      <-- iteration 1 starts
    ...

With software pipelining (initiation interval II = 2):

    Prologue:
    Cycle 1:  load B[0], load C[0]
    Cycle 2:  load B[1], load C[1]
    
    Kernel (steady state, repeats):
    Cycle 3:  mul B[0]*C[0], load D[0], load B[2], load C[2]
    Cycle 4:  mul B[1]*C[1], load D[1], load B[3], load C[3]
    Cycle 5:  add res[0]+D[0], mul B[2]*C[2], load D[2], load B[4], load C[4]
    ...

    Epilogue:
    (drain the pipeline)
```

In the steady state, every cycle initiates a new iteration and completes an old one, achieving much higher throughput.

### Modulo Scheduling

**Modulo scheduling**, formalized by Bob Rau in his 1994 paper *"Iterative Modulo Scheduling: An Algorithm for Software Pipelining Loops,"* is the standard algorithm for constructing software-pipelined loop kernels. The key concept is the **initiation interval (II)**: the number of cycles between the start of consecutive iterations.

The minimum II is determined by two constraints:

1. **Resource constraint**: MII_res = ceil(total resource usage per iteration / available resources). If each iteration uses 2 multiplier cycles and there is 1 multiplier, MII_res = 2.

2. **Recurrence constraint**: MII_rec = length of the longest recurrence (dependency cycle through a loop-carried dependency). If iteration i+1 depends on iteration i through a chain of latency 4, MII_rec = 4.

The minimum initiation interval is: MII = max(MII_res, MII_rec).

Modulo scheduling then tries to find a valid schedule with II = MII, incrementing II if no valid schedule exists. The algorithm uses a modular resource table to track functional unit usage and ensures that the same functional unit is not used by operations from different iterations in the same cycle.

### Rotating Register Files

Software pipelining creates a problem for register allocation: multiple iterations are in flight simultaneously, and each needs its own set of registers. The **rotating register file**, pioneered by Cydrome's Cydra-5 and adopted by IA-64, solves this elegantly:

- A set of registers (e.g., r32-r127 in IA-64) can be "rotated" by one position each iteration.
- Iteration i uses r32, while iteration i-1 uses what was r32 but is now r33 (after rotation).
- No explicit register renaming is needed; the hardware performs the rotation automatically.

This is a hardware feature explicitly designed to support the compiler's software pipelining efforts -- a prime example of compiler-architecture co-design.

### Software Pipelining vs. Trace Scheduling

Software pipelining and trace scheduling are complementary techniques:

| Aspect | Trace Scheduling | Software Pipelining |
|--------|-----------------|---------------------|
| Target | Acyclic control flow | Loops |
| Parallelism source | Between basic blocks | Between loop iterations |
| Profile data | Essential | Not needed (loop structure provides info) |
| Code growth | Compensation code | Prologue/epilogue |
| Inventor | Fisher (1981) | Rau (1981), Lam (1988) |
| Best for | Irregular control flow | Regular loops |

A complete VLIW compiler uses both: software pipelining for inner loops, and trace scheduling (or superblock scheduling) for the rest of the code. The Multiflow compiler, the Cydra-5 compiler, and the IA-64 compiler all implemented both techniques.

### Monica Lam's Contribution

Monica Lam's 1988 paper, *"Software Pipelining: An Effective Scheduling Technique for VLIW Machines,"* published at PLDI, was a watershed. Lam demonstrated that software pipelining could achieve near-optimal loop schedules for VLIW machines, provided the loop had a small recurrence depth. Her modulo variable expansion technique handled the register allocation problem by creating multiple copies of variables, each used by a different in-flight iteration.

Lam's work, combined with Rau's iterative modulo scheduling algorithm, established software pipelining as one of the most important optimization techniques in compiler design. It is implemented in GCC (swing modulo scheduling in `modulo-sched.c`), LLVM, the Intel compiler, and virtually every compiler targeting a VLIW or EPIC architecture.

---

# Part 6: Trace Compaction -- The Scheduling Engine

---

## 27. List Scheduling

### 27.1 The Standard Algorithm

**List scheduling** is the dominant algorithm for instruction scheduling, used in virtually every production compiler. It is the engine that drives trace compaction in trace scheduling compilers. The algorithm is a **greedy heuristic** that builds a schedule one cycle at a time, selecting operations from a prioritized ready list.

### 27.2 Algorithm

```
Algorithm: LIST-SCHEDULING(DAG, machine_model)

Input:  
    DAG = (V, E) where V is the set of operations and E is the set
          of dependency edges, each labeled with a latency
    machine_model = set of functional units with capabilities

Output:
    schedule: V -> (cycle, unit)

1.  ready_list := { v in V : v has no predecessors in DAG }
2.  cycle := 0
3.  
4.  while ready_list is not empty:
5.      // Sort the ready list by priority (highest first)
6.      sort(ready_list, by = priority_function)
7.      
8.      for each operation v in ready_list (in priority order):
9.          // Find an available functional unit for v in this cycle
10.         unit := find_available_unit(v, cycle, machine_model)
11.         if unit != null:
12.             schedule(v) := (cycle, unit)
13.             mark unit as busy for latency(v) cycles
14.             remove v from ready_list
15.             for each successor s of v in DAG:
16.                 if all predecessors of s are scheduled:
17.                     add s to ready_list with
18.                         earliest_start := cycle + latency(v)
19.     
20.     cycle := cycle + 1
21.
22. return schedule
```

### 27.3 Priority Functions

The quality of the schedule depends critically on the **priority function** used to order the ready list. Common priority functions, roughly in order of effectiveness:

**1. Critical-Path Length (CPL)**

The priority of an operation is the length of the longest path from that operation to any sink (leaf) in the DAG. This ensures that operations on the critical path -- the longest dependency chain -- are scheduled first, preventing them from delaying the overall schedule.

```
priority(v) = max over all paths from v to a sink of
              (sum of latencies along the path)
```

This is the most widely used priority function and produces near-optimal schedules for many programs.

**2. Resource-Constrained Critical Path**

Like CPL, but adjusted for resource contention. If a particular functional unit is scarce (e.g., only one floating-point multiplier), operations that need that unit get a priority boost.

**3. Last Use / Register Pressure**

Priority accounts for the effect of scheduling on register pressure. Operations whose results are consumed soon (short lifetime) may be prioritized to reduce the number of live values and hence the number of registers needed.

**4. Speculative Distance**

For trace scheduling, operations that have been moved a long distance from their original position (across many branches) may get lower priority, reflecting the reduced confidence that they will actually execute.

**5. Combined Heuristics**

In practice, most compilers use a combination of these heuristics, with tie-breaking rules that consider multiple factors.

### 27.4 Complexity

List scheduling runs in O(n^2) time in the worst case (for each of n operations, it may scan the entire ready list), where n is the number of operations in the scheduling region. For typical traces of 50-200 operations, this is fast enough for practical use.

The optimal scheduling problem (minimizing schedule length for a given DAG and machine model) is NP-hard in general (for machines with more than two identical functional units). List scheduling is a heuristic that produces good but not necessarily optimal schedules. Research on optimal scheduling via integer linear programming (ILP) and constraint programming has produced exact solutions for small problems, but these are too expensive for production compilers.

### 27.5 A Worked Example of List Scheduling

Consider a small DAG with 8 operations, targeting a 2-wide machine with one ALU and one multiplier:

```
Operation    Type      Latency    Dependencies
---------    ------    -------    ------------
A            ALU       1          none
B            ALU       1          none
C            MUL       3          A (RAW)
D            ALU       1          B (RAW)
E            ALU       1          C (RAW), D (RAW)
F            MUL       3          D (RAW)
G            ALU       1          E (RAW)
H            ALU       1          F (RAW), G (RAW)
```

The dependency DAG:

```
    A           B
    |           |
    v           v
    C (mul)     D
    |          / \
    |         v   v
    |         E   F (mul)
    |         |   |
    |         v   |
    +-------> G   |
              |   |
              v   v
              H
```

**Critical path lengths** (from each node to the sink H):

```
A: A(1) -> C(3) -> E(1) -> G(1) -> H(1) = 7
B: B(1) -> D(1) -> F(3) -> H(1) = 6  or  B(1) -> D(1) -> E(1) -> G(1) -> H(1) = 5
C: C(3) -> E(1) -> G(1) -> H(1) = 6
D: D(1) -> F(3) -> H(1) = 5  or  D(1) -> E(1) -> G(1) -> H(1) = 4
E: E(1) -> G(1) -> H(1) = 3
F: F(3) -> H(1) = 4
G: G(1) -> H(1) = 2
H: 1
```

**Priority order** (by critical path length): A(7), C(6), B(6), D(5), F(4), E(3), G(2), H(1).

**Schedule construction**:

```
Cycle 0:  ALU: A (priority 7)   MUL: ---    [B ready but lower priority; no mul work ready]
          Also schedule B on ALU? No, only 1 ALU. But B is also ready...
```

Wait -- let us say the machine has 1 ALU + 1 MUL (2 functional units, different types). Then:

```
Cycle 0:  ALU: A               MUL: ---         Ready: {A, B}
Cycle 1:  ALU: B               MUL: C           Ready: {B, C} (C ready at cycle 1, after A)
Cycle 2:  ALU: D               MUL: [C busy]    Ready: {D} (D ready at cycle 2, after B)
Cycle 3:  ALU: ---             MUL: [C busy]    Ready: {} (waiting for C to finish)
Cycle 4:  ALU: E               MUL: F           Ready: {E, F} (C done at end of cycle 3)
Cycle 5:  ALU: G               MUL: [F busy]    Ready: {G}
Cycle 6:  ALU: ---             MUL: [F busy]    Ready: {}
Cycle 7:  ALU: H               MUL: ---         Ready: {H} (F done at end of cycle 6, G done)

Total: 8 cycles for 8 operations
```

The critical path length is 7 cycles (A -> C -> E -> G -> H), and the schedule achieves 8 cycles -- just 1 cycle above the critical path bound. The one wasted cycle (cycle 3) occurs because the ALU has no work while waiting for the multiplier to finish operation C.

This example illustrates several key points:

1. **Critical-path priority works well**: By scheduling A before B (both are ready at cycle 0, but A has higher critical-path priority), we start the long-latency multiply C as early as possible, minimizing the impact of C's 3-cycle latency on the overall schedule.

2. **Resource conflicts matter**: In cycle 3, the ALU is idle because no operations are ready. If we had 2 ALUs, we could have overlapped more work.

3. **The schedule is near-optimal**: The theoretical minimum (critical path length) is 7 cycles; we achieved 8. For this small example, the gap is just one cycle.

### 27.6 Variants

Several variants of list scheduling have been developed:

- **Forward list scheduling**: Schedules from the entry of the region to the exit (as described above). Natural for trace scheduling.
- **Backward list scheduling**: Schedules from the exit to the entry. Can produce better schedules in some cases, particularly when minimizing register pressure is important. In backward scheduling, the priority function is based on the longest path from the source to each node (rather than from each node to the sink). This can produce different schedules because tie-breaking works differently.
- **Bidirectional list scheduling**: Combines forward and backward passes. The compiler runs both forward and backward scheduling and selects the better result. Some implementations alternate between forward and backward passes within a single scheduling run, scheduling from both ends toward the middle.
- **Iterative list scheduling**: Runs multiple passes with different priority functions and selects the best result. This approach can explore a larger portion of the schedule space at the cost of increased compilation time.
- **Height-based scheduling**: A variant where priority is based on the "height" of each operation in the DAG (distance from the roots), rather than the critical-path length. This tends to produce schedules with lower register pressure because it delays operations until their results are needed.

### 27.7 List Scheduling for VLIW vs. Superscalar

List scheduling serves different purposes depending on the target architecture:

**For VLIW targets**: The schedule produced by list scheduling is the final schedule. The hardware will execute exactly what the compiler specifies. The compiler must produce a correct, complete schedule that avoids all hazards, respects all resource constraints, and fills the instruction word slots as completely as possible. NOP slots represent wasted hardware resources.

**For superscalar targets**: The schedule is a suggestion. The hardware's dynamic scheduler may reorder instructions at runtime, so the compiler's schedule is not definitive. However, a good compile-time schedule still helps: it reduces the work the hardware scheduler must do, improves instruction cache locality, and can help the branch predictor by placing instructions in a logical order.

**For in-order superscalar targets** (e.g., ARM Cortex-A53, many embedded processors): The schedule is critical, because the hardware will stall on hazards rather than reordering. For these targets, the compiler's job is similar to VLIW scheduling, though the instruction word is narrower and the functional unit model is simpler.

---

## 28. The DAG Construction

### 28.1 Data Dependencies

The dependency DAG is the foundation of all instruction scheduling. Its accuracy directly determines the quality of the schedule: overly conservative dependencies (treating independent operations as dependent) prevent useful code motion, while missed dependencies (treating dependent operations as independent) produce incorrect code.

The three types of data dependencies are:

**Read After Write (RAW) -- True Dependency**

```
    I1: R3 := R1 + R2      (writes R3)
    I2: R5 := R3 * R4      (reads R3)
```

I2 must execute after I1, because I2 needs the value that I1 produces. This is a **true** (or **flow**) dependency. It cannot be eliminated by renaming; the semantic connection is real.

**Write After Read (WAR) -- Anti-Dependency**

```
    I1: R5 := R3 + R4      (reads R3)
    I2: R3 := R1 * R2      (writes R3)
```

If I2 executes before I1, I1 will read the wrong value of R3. This is an **anti-dependency** -- a false dependency caused by reuse of the register name R3. It can be eliminated by **register renaming**: assigning I2's result to a different register.

**Write After Write (WAW) -- Output Dependency**

```
    I1: R3 := R1 + R2      (writes R3)
    I2: R3 := R4 * R5      (writes R3)
```

Both instructions write R3. If I2 executes before I1, the final value in R3 will be incorrect (it will be I1's value instead of I2's). This is an **output dependency**, also a false dependency that can be eliminated by renaming.

### 28.2 Memory Dependencies

Memory dependencies are the most challenging to analyze because the compiler often cannot determine statically whether two memory operations access the same address.

```
    I1: store R1 -> [R5]     (writes to memory at address R5)
    I2: R2 := load [R6]     (reads from memory at address R6)
```

Do R5 and R6 point to the same memory location? If the compiler cannot prove they are different, it must conservatively assume a dependency (RAW from I1 to I2), preventing the load from being moved above the store.

**Alias analysis** (or **memory disambiguation**) is the set of compiler techniques that attempt to determine whether two memory references can alias (access the same location). The responses are:

- **Must alias**: The references definitely access the same location. A dependency exists.
- **May alias**: The references might access the same location. The compiler must conservatively assume a dependency.
- **No alias**: The references definitely access different locations. No dependency; the operations can be freely reordered.

The precision of alias analysis has a direct and significant impact on the effectiveness of trace scheduling. More precise alias analysis means fewer false memory dependencies, which means more code motion opportunities, which means more ILP.

Common alias analysis techniques include:

- **Type-based analysis (TBAA)**: Memory accesses through pointers of different types cannot alias (under the C/C++ strict aliasing rule). For example, in C, an `int*` and a `float*` cannot alias (they point to objects of different types), so a load through an `int*` can be freely reordered with a store through a `float*`. TBAA is fast and produces useful results for well-typed programs, but it is defeated by casts and by the `void*` type.

- **Flow-sensitive analysis**: Tracks the values of pointer variables through the program's control flow. If the compiler can determine that at a given point, pointer `p` points to variable `x` and pointer `q` points to variable `y`, it knows that `*p` and `*q` do not alias. Flow-sensitive analysis is more precise than type-based analysis but more expensive, requiring iterative dataflow analysis over the control flow graph.

- **Field-sensitive analysis**: Distinguishes between different fields of a structure. If `p` points to a struct with fields `a` and `b`, then `p->a` and `p->b` do not alias (they are at different offsets within the struct). This allows the compiler to reorder loads and stores to different fields of the same structure.

- **Array analysis**: Uses subscript analysis and dependence testing to determine when array references in loops access different elements. The key tests include:
  - **GCD test**: If two array subscripts have the form `a*i + b` and `c*i + d`, they can only be equal if `gcd(a, c)` divides `(d - b)`. If it does not, the references are independent.
  - **Banerjee test**: A more precise test that bounds the range of subscript differences across all iterations of a loop.
  - **Omega test**: The most precise polynomial-time test, based on integer programming. The Omega test can determine independence in cases where the GCD and Banerjee tests are inconclusive.

- **Points-to analysis**: Computes, for each pointer variable, the set of memory locations it might point to. Andersen's analysis (inclusion-based) is more precise but slower than Steensgaard's analysis (unification-based). Modern compilers typically use a combination of fast, imprecise analyses for whole-program scope and slower, precise analyses for critical regions.

- **Modular analysis**: Analyzes the aliasing effects of function calls. Without modular analysis, the compiler must conservatively assume that a function call may modify any memory location accessible through its arguments or through global variables. Modular analysis computes summaries of each function's aliasing behavior, allowing the caller's optimizer to reason about the effects of the call.

### 28.3 The Impact of Alias Analysis on Trace Scheduling

The relationship between alias analysis precision and trace scheduling effectiveness is direct and measurable. Studies on the Multiflow compiler showed that:

- With no memory disambiguation (assuming all memory references may alias), the trace scheduler could exploit only 30-40% of the available ILP.
- With basic type-based disambiguation, ILP exploitation rose to 50-60%.
- With full array analysis and interprocedural disambiguation, ILP exploitation reached 70-80%.

The difference is dramatic because memory operations are frequent (loads and stores account for 30-40% of all instructions in typical programs) and because many of the most profitable code motions involve moving loads above stores. A load that can be moved above a store and started several cycles earlier can hide the load's memory latency, which is often the critical bottleneck in the schedule.

This is why the Fortran language, with its strict aliasing rules (arrays passed as arguments cannot overlap unless explicitly declared to do so via `EQUIVALENCE`), produces better VLIW code than C, with its permissive pointer aliasing model. It is also why the `restrict` keyword was added to C99: it allows the programmer to promise the compiler that pointers do not alias, enabling the same memory disambiguation that Fortran provides by default.

### 28.4 Control Dependencies

In addition to data dependencies, the compiler must respect **control dependencies**: an operation in block B is control-dependent on the branch that selects B. Normally, this means the operation cannot be moved above the branch.

Trace scheduling relaxes this constraint by allowing **speculative code motion**: moving an operation above a branch, so that it executes even when the branch goes the other way. The safety of speculative code motion depends on the operation's side effects:

- A pure computation (add, multiply) with no side effects can be safely speculated. If the branch goes the wrong way, the result is simply not used.
- A load from memory can be speculated if the address is valid. If the address might be invalid, the load could cause a page fault or segmentation fault. Hardware support (speculative loads, poison bits) can mitigate this.
- A store to memory generally **cannot** be speculated, because it has a visible side effect (modifying memory) that cannot be undone.

---

## 29. Speculative Code Motion

### 29.1 The Opportunity

Speculative code motion -- moving instructions above branches that might not be taken -- is one of the most powerful techniques available to trace scheduling compilers. By executing instructions speculatively (before knowing whether they are needed), the compiler can hide latencies and fill otherwise empty instruction slots.

### 29.2 The Risk

The risk is that speculated instructions may have side effects that corrupt program state. There are three categories of speculated instructions, in increasing order of risk:

1. **Safe speculation**: Pure arithmetic operations (add, subtract, multiply, logical operations) that write to registers. If the speculation is wrong, the register write is harmless -- the value will simply be overwritten later. This is always safe.

2. **Conditionally safe speculation**: Memory loads that might cause exceptions. If the load address is valid, speculation is safe. If the address is invalid (null pointer, unmapped page), the load will cause a fault. The compiler must either prove the address is valid or rely on hardware support.

3. **Unsafe speculation**: Memory stores, I/O operations, and other operations with visible side effects. These generally cannot be speculated.

### 29.3 Hardware Support for Speculative Loads

Several hardware mechanisms have been developed to support speculative loads:

**Poison Bits**

Each register has an associated **poison bit** (also called a **NaT bit** in IA-64). When a speculative load faults, instead of triggering an exception, the hardware sets the poison bit on the destination register. Any subsequent instruction that reads a poisoned register also sets the poison bit on its destination. If the speculated computation is eventually needed (the branch goes the expected way), a **check instruction** tests the poison bit and either accepts the result or re-executes the computation non-speculatively.

**Advanced Load Address Table (ALAT)**

The IA-64 architecture includes an ALAT -- a hardware structure that records the addresses of speculative loads. When a store is executed, the ALAT checks whether any speculative load has been invalidated (because the store writes to the same address). A **check** instruction verifies that the speculative load is still valid and, if not, re-executes it.

**Sentinel Scheduling**

Mahlke, Chen, Hwu, Rau, and Schlansker proposed **sentinel scheduling** (1992) as a software-only approach to speculative code motion. The compiler inserts **sentinel** instructions that detect exceptions from speculated operations and trigger recovery code if needed. This approach does not require hardware support but incurs software overhead.

### 29.4 A Taxonomy of Speculative Code Motion

To fully understand speculation in the context of trace scheduling, it is useful to classify the types of speculative code motion systematically:

**Control speculation (above a branch)**

An instruction from a basic block below a branch is moved above the branch, so that it executes regardless of the branch outcome. If the branch goes the "wrong" way (the instruction would not have executed in the original program), the instruction's result is simply unused.

Example:
```
    Original:                    After speculation:
    if (cond) goto L1            r3 = r1 + r2       // speculated
    r3 = r1 + r2                 if (cond) goto L1
    use(r3)                      use(r3)
```

This is safe as long as the speculated instruction has no side effects (or its side effects can be suppressed if the branch goes to L1). Pure arithmetic and logical operations are always safe to speculate. Memory loads require additional care.

**Data speculation (reordering ambiguous memory operations)**

A load is moved above a store that might write to the same address. If the load and store do alias, the load will read a stale value and must be re-executed after the store. This requires runtime detection of the conflict, typically through hardware support like the ALAT.

Example:
```
    Original:                    After data speculation:
    store r1 -> [r5]             r2 = ld.a [r6]     // advanced load
    r2 = load [r6]               store r1 -> [r5]
    use(r2)                      ld.c [r6]           // check: was r2 invalidated?
                                 use(r2)
```

The `ld.a` (advanced load) executes the load speculatively and records the address in the ALAT. The `ld.c` (load check) verifies that no intervening store has written to the same address. If a conflict is detected, the load is re-executed.

**Exception speculation (loads that might fault)**

A load whose address might be invalid is moved above a branch that would have avoided the invalid address. For example:

```
    Original:                    After exception speculation:
    if (p != NULL) {             r1 = ld.s [p]       // speculative load
        r1 = load [p]            if (p != NULL) {
        use(r1)                      chk.s r1        // check: did load fault?
    }                                use(r1)
                                 }
```

The `ld.s` (speculative load) executes the load but, if it faults (e.g., p is NULL), sets the NaT (Not a Thing) bit on the destination register instead of triggering an exception. The `chk.s` (speculation check) tests the NaT bit; if set, it branches to a recovery routine that re-executes the load (or handles the exception).

### 29.5 The Cost-Benefit Analysis of Speculation

The decision of whether to speculate an instruction involves a cost-benefit analysis:

**Benefits**:
- Reduced critical-path length (the instruction starts earlier, so its result is available sooner).
- Better functional-unit utilization (the instruction fills a slot that would otherwise be empty).
- Latency hiding (especially for loads that might hit in the cache).

**Costs**:
- Wasted work if the speculation is wrong (the instruction executed but its result is not needed).
- Increased register pressure (the speculated result occupies a register from the point of speculation until it is consumed or discarded).
- Additional instructions for checks and recovery (chk.s, ld.c, etc.).
- Potential cache pollution (a speculated load may evict useful cache lines).
- Code size increase (recovery code adds instructions).

The profitability of speculation depends on the probability that the branch goes the expected way. If the branch is taken 95% of the time (in the direction that makes the speculation useful), speculation is almost always profitable. If the branch is taken only 60% of the time, speculation may or may not be profitable, depending on the instruction's latency, the machine's width, and the availability of alternative work.

Most trace scheduling compilers use a **speculation threshold**: only speculate an instruction across a branch if the branch probability exceeds a configurable threshold (typically 70-85%). Instructions with side effects (loads that might fault) have a higher threshold than pure computations.

### 29.6 Speculation in Practice

Speculative code motion is most effective for:

- Loads that are likely to hit in the cache (hiding the load latency by starting the load early).
- Operations that feed into critical paths (starting the computation earlier reduces the critical-path length).
- Programs with good branch prediction profiles (so that the speculation is usually correct).
- Inner loops where the same speculation decision is made millions of times (amortizing the cost of wrong speculation).

The cost of wrong speculation is wasted work (the speculated instruction executed but its result was not needed) and potentially increased register pressure (the speculated result occupies a register until it is consumed or discarded).

Empirical studies of speculation in trace scheduling compilers have found that:

- For floating-point-intensive scientific programs, speculation across 1-2 branches provides most of the benefit. Speculating across 3+ branches yields diminishing returns.
- For integer-intensive programs, the benefit of speculation is smaller because the branches are less predictable and the available ILP is lower.
- The combination of control speculation and data speculation (moving loads above both branches and ambiguous stores) provides significantly more ILP than either technique alone.
- Hardware support for speculation (NaT bits, ALAT) is essential for aggressive speculation. Without it, the compiler must either avoid speculating loads entirely or insert expensive software checks.

---

## 30. The Interaction with Register Allocation

### 30.1 The Phase-Ordering Problem

Instruction scheduling and register allocation are two of the most important optimizations in a compiler, and they interact in complex and often conflicting ways. This interaction is known as the **phase-ordering problem**: should the compiler schedule first and then allocate registers, or allocate registers first and then schedule?

### 30.2 Schedule-First, Then Allocate

If the compiler schedules first, it has maximum freedom to reorder instructions for parallelism. But the scheduled code may have many simultaneously live values, requiring more registers than the machine provides. When the register allocator runs after scheduling, it may need to insert **spill code** (loads and stores to memory for values that don't fit in registers), which can undo the benefits of scheduling.

### 30.3 Allocate-First, Then Schedule

If the compiler allocates registers first, it minimizes register usage and avoids spill code. But the allocation introduces false dependencies (WAR and WAW hazards through register reuse) that constrain the scheduler, reducing the exploitable ILP.

### 30.4 The Tension

The fundamental tension is:

- **Scheduling wants long lifetimes**: To maximize parallelism, the scheduler moves instructions far from their original positions, creating long intervals between when a value is produced and when it is consumed. Long lifetimes mean more simultaneously live values, which means more register pressure.

- **Register allocation wants short lifetimes**: To minimize spilling, the allocator wants values to be produced shortly before they are consumed, so that registers can be reused quickly. Short lifetimes constrain scheduling.

### 30.5 Approaches in Trace Scheduling Compilers

Trace scheduling compilers have used several approaches to manage this tension:

1. **Separate phases with limits**: Schedule first, but impose a **register pressure limit** on the scheduler -- do not allow more than R values to be simultaneously live, where R is the number of available registers. This prevents the scheduler from creating impossible register demands.

2. **Integrated scheduling and allocation**: Perform scheduling and register allocation simultaneously, making trade-off decisions at each step. This is more complex but can produce better results. The paper "Combining Register Allocation and Instruction Scheduling" (Motwani et al., NYU, 1995) explored this approach.

3. **Iterative approach**: Schedule, allocate, re-schedule with the spill code, re-allocate, and iterate until convergence. This is expensive but produces good results in practice.

4. **Registers on Demand**: An integrated method that allocates registers dynamically during scheduling, obtaining a register for each value only when it is needed and releasing it when the value is dead.

For VLIW machines with large register files (32-128 registers per class), the register pressure problem is less severe than for machines with small register files. The IA-64 architecture, with 128 general-purpose registers and 128 floating-point registers, was designed specifically to reduce the impact of the phase-ordering problem.

---

# Part 7: Modern Relevance and the Compiler/Architecture Interface

---

## 31. Why VLIW "Failed" in General-Purpose Computing

### 31.1 The Verdict

By the mid-2000s, the verdict on VLIW for general-purpose computing was clear: out-of-order superscalar processors had won. The x86/AMD64 architecture, with increasingly sophisticated dynamic scheduling hardware, dominated desktops, laptops, and servers. Itanium was in terminal decline. No new general-purpose VLIW processors were being designed.

But the reasons for this outcome are more nuanced than a simple "VLIW is bad" narrative. VLIW failed in general-purpose computing for a specific set of reasons, most of which do not apply to embedded and DSP workloads.

### 31.2 Binary Compatibility

The most fundamental problem is **binary compatibility**. In the general-purpose market, software is the dominant asset. Users have accumulated decades of software -- operating systems, databases, office suites, games, scientific applications -- compiled for a specific instruction set (primarily x86). Any new architecture that requires recompilation of this entire software base faces an enormous adoption barrier.

Superscalar processors solve this implicitly: a wider or more advanced superscalar implementation runs the same binaries faster, without any software changes. VLIW processors cannot do this because their binary format encodes the specific hardware configuration (number of functional units, latencies, etc.).

AMD64 defeated Itanium precisely because it provided 64-bit computing without breaking binary compatibility with 32-bit x86 software.

### 31.3 The Memory Wall

Static scheduling assumes that the compiler knows (or can accurately predict) the latency of every operation. For arithmetic operations, this is true: an integer add takes 1 cycle, a multiply takes 3-5 cycles. But for memory operations, the latency depends on whether the data is in the L1 cache (4 cycles), L2 cache (12 cycles), L3 cache (30-40 cycles), or main memory (200+ cycles).

The compiler cannot predict cache behavior with sufficient accuracy for general-purpose workloads. A load that hits in the cache on one execution may miss on the next. Static scheduling that assumes a cache hit will stall if the load misses; static scheduling that assumes a cache miss will waste slots if the load hits.

Out-of-order superscalar processors handle this dynamically: when a load misses, the processor continues executing other, independent instructions, filling the stall time productively. This dynamic adaptation to memory latency is one of the most compelling advantages of superscalar over VLIW.

### 31.4 Branch Prediction

For irregular, control-intensive code (operating systems, interpreters, databases, web browsers), branch behavior is highly data-dependent and difficult to predict statically. Hardware branch predictors, trained on the program's runtime behavior, achieve prediction accuracies of 95-99% for well-behaved branches.

Static prediction (using profile data or heuristics) is less accurate, particularly for:

- Branches that change behavior depending on input data.
- Branches in polymorphic code (virtual method dispatch, interpreted languages).
- Branches in rarely-executed code paths (where profile data is sparse or nonexistent).

VLIW processors can include hardware branch predictors (as IA-64 did), but the fundamental issue remains: the compiler must schedule code *before* knowing which way branches will go, while superscalar processors can dynamically adapt.

### 31.5 Compiler Complexity

The compiler for a VLIW processor is fundamentally more complex than one for a superscalar processor, because it must perform tasks that superscalar hardware does automatically:

- Instruction scheduling (in superscalar, done by the hardware scheduler).
- Hazard avoidance (in superscalar, done by hardware interlocks).
- Register renaming to eliminate false dependencies (in superscalar, done by the rename stage).
- Speculation management (in superscalar, done by the branch predictor and recovery logic).

This complexity manifests as longer compilation times, more compiler bugs, and greater difficulty in achieving optimal performance. The IA-64 compiler was notoriously difficult to develop, and its quality never reached the level needed to compete with x86 compilers backed by decades of optimization effort.

### 31.6 The Success of Superscalar

Perhaps the most important reason for VLIW's failure in general-purpose computing is simply the overwhelming success of the alternative. Intel's out-of-order x86 processors (starting with the Pentium Pro in 1995) achieved remarkable ILP without compiler assistance, and subsequent generations (Core, Nehalem, Sandy Bridge, Skylake, and beyond) steadily improved.

These processors effectively hid their complexity from the software: the same x86 binary ran faster on each new generation, without recompilation. This "free" performance improvement -- which required enormous hardware engineering but zero software effort -- proved irresistible to the market.

---

## 32. Why VLIW Succeeded in Embedded/DSP

### 32.1 The Embedded Advantage

While VLIW failed in general-purpose computing, it thrived in embedded and DSP applications. The reasons are essentially the mirror image of the reasons it failed in general-purpose computing:

### 32.2 Predictable Workloads

DSP and media processing workloads are characterized by:

- Tight, regular loops (FIR filters, FFTs, convolutions).
- Predictable memory access patterns (streaming through arrays).
- Few and predictable branches (loop back-edges are taken; error checks are not).
- Known and stable algorithms (codecs, filters, transforms).

These properties are ideal for static scheduling. The compiler can analyze the workload completely and produce an optimal schedule. The resulting code achieves near-peak utilization of the VLIW hardware.

### 32.3 Power Efficiency

In embedded systems, power consumption is often the primary constraint. VLIW eliminates the power-hungry hardware required for dynamic scheduling:

- No reorder buffer (saves area and power).
- No reservation stations (saves area and power).
- No register renaming logic (saves area and power).
- No branch predictor (or a simpler one; saves area and power).

The result is a processor that delivers high throughput per watt -- a critical metric for battery-powered devices, thermally constrained systems, and energy-sensitive data centers.

### 32.4 Deterministic Latency

Many embedded applications have **hard real-time** requirements: the computation must complete within a fixed time bound, with no exceptions. VLIW's static scheduling provides **deterministic, predictable** execution timing. The compiler knows exactly how many cycles each section of code will take, enabling precise worst-case execution time (WCET) analysis.

Out-of-order superscalar processors have variable, data-dependent execution times, making WCET analysis difficult or impossible.

### 32.5 Cost

The simple hardware of a VLIW processor is cheaper to design, verify, and fabricate than an equivalent superscalar processor. For cost-sensitive embedded markets, this is a significant advantage.

### 32.6 No Binary Compatibility Requirement

Embedded software is typically compiled for a specific target platform and is not expected to run on different hardware without recompilation. The binary compatibility problem that plagues VLIW in general-purpose computing is irrelevant in embedded systems.

### 32.7 The Embedded VLIW Ecosystem

The combination of these factors has made VLIW the architecture of choice for a wide range of embedded applications:

- **Digital signal processing**: TI TMS320C6x, Analog Devices SHARC.
- **Mobile computing**: Qualcomm Hexagon (billions of units).
- **Media processing**: NXP TriMedia, ST200 (tens of millions of units).
- **Network processing**: Various VLIW-based network processors.
- **Printer controllers**: HP LaserJet (using ST200/Lx cores).
- **Automotive**: Various VLIW DSPs for sensor processing and ADAS.

---

## 33. Trace Scheduling Ideas in Modern Compilers

### 33.1 The Living Legacy

Even though pure VLIW trace scheduling is niche in general-purpose computing, the *ideas* pioneered by Fisher and his colleagues permeate modern compilers. Every major compiler -- GCC, LLVM/Clang, the Intel compiler, the Microsoft compiler -- uses techniques that descend directly from trace scheduling.

### 33.2 Profile-Guided Optimization (PGO)

Fisher's 1981 paper introduced the idea of using runtime execution profiles to guide compiler optimization. Today, PGO is a standard feature of every major compiler:

- **GCC**: `-fprofile-generate` / `-fprofile-use` for profile collection and application.
- **LLVM/Clang**: `-fprofile-instr-generate` / `-fprofile-instr-use`.
- **Intel compiler**: `-prof-gen` / `-prof-use`.
- **MSVC**: `/GENPROFILE` / `/USEPROFILE`.

PGO is used to guide not only instruction scheduling but also:

- **Basic block layout**: Placing frequently executed blocks together for better instruction cache behavior.
- **Function inlining**: Inlining functions that are frequently called from specific call sites.
- **Branch prediction hints**: Inserting hints that help the hardware branch predictor.
- **Loop optimization**: Deciding which loops to unroll, vectorize, or software-pipeline.

### 33.3 Superblock Formation in GCC

GCC implements superblock-based scheduling through several modules:

- **`tracer.c`**: Forms superblocks from the most frequently executed traces. The tracer locates the most frequently executed basic block, grows the trace forward by following edges with probability > 50%, and applies tail duplication to eliminate side entries.

- **`sched-ebb.c`**: Schedules extended basic blocks (EBBs), which are similar to superblocks but formed structurally rather than by profiling.

- **`sched-rgn.c`**: Schedules arbitrary regions of the CFG, though currently limited to loop-free procedures and reducible inner loops.

### 33.4 Trace-Based Compilation in LLVM

LLVM's compilation framework incorporates several trace-scheduling-inspired techniques:

- **Block frequency analysis**: LLVM computes block frequencies (either from profile data or from static heuristics) and uses them to guide optimization decisions.

- **Machine block placement**: LLVM's `MachineBlockPlacement` pass reorders basic blocks to maximize fall-through on hot paths, similar to trace linearization.

- **If-conversion**: LLVM performs if-conversion (converting branches to predicated or selected instructions) when profitable, similar to hyperblock formation.

- **Loop optimizations**: LLVM's loop unrolling, vectorization, and software pipelining passes all use profile data and dependency analysis descended from trace scheduling techniques.

### 33.5 Software Pipelining

Software pipelining, pioneered by Bob Rau and Monica Lam, is implemented in both GCC and LLVM. GCC's **swing modulo scheduling** pass (`modulo-sched.c`) implements iterative modulo scheduling for innermost loops, overlapping iterations to exploit ILP.

LLVM has also explored swing modulo scheduling, as described in Tanya Lattner's 2005 master's thesis, *"An Implementation of Swing Modulo Scheduling with Extensions for Superblocks."*

### 33.6 The Ideas That Persist

The following ideas from the trace scheduling era have become permanent fixtures of compiler technology:

1. **Global code motion**: Moving instructions across basic block boundaries, with compensation code for correctness.
2. **Profile-guided optimization**: Using runtime data to prioritize hot paths.
3. **Speculative execution**: Executing instructions before knowing they are needed.
4. **If-conversion**: Replacing branches with predicated or conditional instructions.
5. **Software pipelining**: Overlapping loop iterations for increased throughput.
6. **Alias analysis for scheduling**: Determining when memory operations can be reordered.
7. **Integrated scheduling and optimization**: Combining instruction scheduling with other optimizations (register allocation, code layout).

---

## 34. Trace Scheduling and GPU Architectures

### 34.1 The VLIW-GPU Connection

An often-overlooked chapter in the VLIW story is the role of VLIW architectures in graphics processing units (GPUs). Several generations of AMD (ATI) GPUs used VLIW shader processors, and understanding why they eventually moved away from VLIW illuminates the same fundamental trade-offs that shaped the CPU VLIW story.

### 34.2 AMD/ATI TeraScale: VLIW in the GPU

AMD's TeraScale GPU architecture (2007-2012), used in the Radeon HD 2000 through HD 6000 series, employed VLIW shader processors:

- **TeraScale 1 (R600)**: 5-wide VLIW (VLIW5). Each shader processor could execute 5 operations per cycle: 4 vector operations and 1 scalar/transcendental operation.
- **TeraScale 2 (RV770)**: Continued the VLIW5 design with improved efficiency.
- **TeraScale 3 (Cayman)**: Moved to VLIW4, dropping one of the five slots for better utilization.

The VLIW design made sense for the GPU workloads of the era: vertex and pixel shaders were highly regular, with predictable execution patterns and abundant data parallelism. The compiler (in this case, the shader compiler in the graphics driver) could effectively pack shader operations into the VLIW slots.

### 34.3 The Move Away from VLIW

Starting with the Graphics Core Next (GCN) architecture in 2012 (Radeon HD 7000 series), AMD abandoned VLIW for a scalar, RISC-like instruction set. The reasons mirror the general-purpose VLIW story:

1. **GPGPU workloads**: With the rise of general-purpose GPU computing (CUDA, OpenCL), GPU workloads became more irregular and harder to pack into VLIW slots. Compute shaders had more complex control flow than graphics shaders.

2. **Compiler complexity**: The VLIW shader compiler became increasingly complex as it tried to fill 4-5 slots from code with limited ILP. Slot utilization dropped to 60-70% for complex shaders.

3. **Occupancy vs. VLIW**: AMD found that spending the transistor budget on more, simpler scalar processors (higher occupancy for latency hiding) was more effective than fewer, wider VLIW processors for modern workloads.

NVIDIA, by contrast, never used VLIW in its GPU shader processors (their architectures have always been scalar, RISC-like designs with SIMT execution), though their early texture and fixed-function units had VLIW-like characteristics.

The GPU VLIW story reinforces the central lesson: VLIW excels when workloads are regular and predictable, and loses its advantage when workloads become irregular.

### 34.4 JIT Compilation and Dynamic VLIW

An emerging area that bridges the gap between static VLIW and dynamic superscalar is **just-in-time (JIT) compilation** for VLIW-like targets. In a JIT compilation model, the compiler runs at program execution time, using runtime information to guide scheduling decisions.

This approach combines the strengths of both worlds:

- **Compiler-managed parallelism**: Like static VLIW compilation, the JIT compiler explicitly schedules operations into parallel slots.
- **Runtime information**: Like dynamic scheduling, the JIT compiler can use runtime profile data, cache behavior observations, and workload characteristics to make informed decisions.
- **Adaptive recompilation**: The JIT can recompile hot code paths with different scheduling strategies as the workload changes.

Transmeta's Code Morphing Software was an early example of this approach. More modern examples include:

- **Java HotSpot JIT**: While targeting superscalar processors, uses profile-guided trace formation and scheduling techniques descended from trace scheduling.
- **LLVM's JIT infrastructure**: Supports runtime compilation with profile-guided optimization.
- **AI framework compilers** (XLA, TVM, TensorRT): Perform workload-specific scheduling at deployment time, often targeting VLIW or VLIW-like hardware (DSPs, NPUs).

The JIT approach addresses the binary compatibility problem (code is compiled for the target at execution time) and the profile accuracy problem (the JIT can profile the actual workload). It does so at the cost of runtime compilation overhead, which is acceptable for long-running workloads but problematic for short-lived programs.

---

## 35. The Compiler-Architecture Co-Design Principle

### 34.1 The Fisher Philosophy

Trace scheduling embodies a broader philosophical principle: **complexity should be allocated between hardware and software to maximize overall system performance**. Fisher's insight was that by shifting scheduling complexity from hardware to the compiler, the hardware could be simplified, made cheaper, and made more power-efficient, while the compiler -- running once, offline, with global knowledge of the program -- could make better scheduling decisions than hardware constrained to a local window.

This philosophy is not unique to VLIW. It appears throughout the history of computing:

### 35.2 RISC: A Parallel Revolution

The Reduced Instruction Set Computer (RISC) movement of the 1980s, led by David Patterson and Carlo Sequin at Berkeley (RISC-I, RISC-II) and John Hennessy at Stanford (MIPS), made a remarkably similar argument to Fisher's VLIW philosophy: by simplifying the instruction set, the hardware could be faster (shorter pipeline, higher clock speed), and the compiler could generate efficient code from simple instructions. The trade-off: more instructions executed, but each executing faster.

The RISC and VLIW movements were contemporaneous and philosophically aligned. Both argued that hardware should be simple and regular, and that the compiler should do the heavy lifting. Fisher and the RISC architects were aware of each other's work and shared many of the same intellectual commitments.

But the paths diverged. RISC succeeded spectacularly in the general-purpose market, leading to the MIPS, SPARC, PA-RISC, Alpha, ARM, and POWER architectures. VLIW did not. The reason is instructive:

- **RISC simplified the instruction set but kept the sequential execution model.** Programs compiled for a RISC processor still executed one instruction at a time (in the early implementations), and the instruction set was defined independently of the microarchitecture. This preserved binary compatibility: a RISC binary ran correctly on any implementation of the ISA, whether the hardware was single-issue, superscalar, or out-of-order.

- **VLIW simplified the hardware but changed the execution model.** Programs compiled for a VLIW processor executed multiple operations per cycle, and the binary format encoded the specific parallelism of the target machine. This broke binary compatibility.

The irony is that RISC processors eventually became superscalar and then out-of-order, adding back much of the hardware complexity that RISC originally sought to eliminate. A modern ARM or POWER processor is vastly more complex than a CISC VAX-11/780. But the simplicity of the ISA allowed this evolution to happen transparently, without breaking the software ecosystem.

Fisher observed this irony. In a 2000 interview, he noted that superscalar processors were essentially "doing VLIW in hardware" -- finding and scheduling parallel instructions dynamically, using exactly the same dependency analysis and resource management that a VLIW compiler does statically. The hardware was rediscovering, at runtime, the parallelism that the compiler could have specified at compile time.

### 35.3 Software-Defined Systems

The VLIW philosophy -- "let software do the hard work" -- echoes in modern software-defined systems:

- **Software-defined networking (SDN)**: Instead of complex, specialized networking hardware, use simple, programmable switches controlled by software (OpenFlow protocol, P4 language). The network topology, routing policy, and quality-of-service are specified in software and compiled to the switch hardware.

- **Software-defined radio (SDR)**: Instead of fixed radio circuits, use programmable processors that implement radio protocols in software. The same hardware can run different radio protocols (Wi-Fi, Bluetooth, 5G) depending on the software configuration. This is directly analogous to VLIW: the hardware is a simple, wide processor; the software specifies what operations execute in parallel.

- **FPGA-based computing**: Field-Programmable Gate Arrays are the ultimate expression of the "simple hardware, complex compiler" philosophy. The hardware is a blank slate of configurable logic blocks; the compiler (synthesis tool) maps the application to the hardware. Like VLIW, this approach shifts all intelligence to the compilation stage.

- **GPU compute (GPGPU)**: While modern GPUs are not VLIW, the GPU programming model (CUDA, OpenCL, Vulkan Compute) embodies the same principle: the programmer/compiler specifies the parallelism explicitly, and the hardware executes it with minimal dynamic scheduling.

In each case, the trade-off is the same: simpler hardware, more complex software, greater flexibility, lower cost at scale.

### 35.4 The Enduring Trade-off

The fundamental trade-off between hardware complexity and software complexity is not settled -- it shifts over time with technology trends:

- When transistors are scarce and expensive, simplifying hardware (VLIW, RISC) is attractive.
- When transistors are abundant and cheap, adding hardware complexity (out-of-order execution, branch prediction, speculative execution) is affordable and provides performance without compiler effort.
- When power is the limiting constraint (mobile, embedded), simplifying hardware (VLIW, in-order cores) is again attractive.
- When workloads are specialized (DSP, AI, media), domain-specific hardware with compiler-managed parallelism is ideal.

The current trend toward **domain-specific architectures** (DSPs, GPUs, TPUs, NPUs) echoes the VLIW philosophy: build simple, specialized hardware and let the compiler (or the programmer, or the framework) manage the complexity. In this sense, Fisher's vision of compiler-managed parallelism is more relevant than ever.

### 35.5 The RISC-V Connection

The emergence of RISC-V as an open-source instruction set architecture has renewed interest in VLIW-style extensions. Several research groups have proposed VLIW extensions to RISC-V for embedded and DSP applications:

- **RISC-V "P" extension (packed SIMD)**: Adds SIMD operations to RISC-V, allowing multiple data operations to be packed into a single instruction. While not VLIW per se, this is in the same spirit of statically specified parallelism.

- **Custom VLIW extensions**: The RISC-V architecture's extensibility (through custom instruction extensions) makes it straightforward to add VLIW-like features for specific workloads. Several academic and commercial implementations have demonstrated RISC-V processors with VLIW execution engines for DSP and AI inference.

- **Instruction fusion**: Modern RISC-V implementations (and ARM implementations, and even x86) use **macro-operation fusion**: the hardware detects common instruction sequences (e.g., compare followed by branch) and executes them as a single operation. This is the inverse of VLIW -- instead of the compiler specifying parallelism, the hardware detects it -- but it demonstrates that the boundary between static and dynamic scheduling continues to blur.

The RISC-V ecosystem's openness may provide the context in which VLIW ideas are finally integrated into mainstream architectures, not as a replacement for dynamic scheduling, but as an additional tool in the architect's toolkit.

---

# Part 8: Advanced Topics and Open Problems

---

## 35. Optimal Trace Scheduling

### 35.1 The Optimality Gap

Fisher's greedy trace-selection algorithm and list scheduling are heuristics -- they produce good but not necessarily optimal schedules. The question of how far these heuristics are from optimal has been studied extensively.

### 35.2 Optimal Approaches

Several researchers have developed optimal trace scheduling algorithms:

- **Enumeration-based**: The paper *"Optimal Trace Scheduling Using Enumeration"* (Artigas et al., ACM TACO, 2009) developed an algorithm that enumerates all possible schedules for a trace and selects the best one. This is computationally expensive (exponential in the worst case) but produces provably optimal results for small traces.

- **Integer Linear Programming (ILP)**: Formulate the scheduling problem as an ILP and solve it with a commercial ILP solver (CPLEX, Gurobi). This approach can handle moderate-sized problems (50-100 operations) and produces optimal schedules. The ILP formulation includes variables for the cycle assignment of each operation, constraints for dependencies and resources, and an objective function minimizing the total schedule length.

- **Constraint programming**: Similar to ILP but using constraint satisfaction solvers. Particularly effective when the resource model has complex constraints.

### 35.3 Results

Studies comparing optimal and heuristic schedules have found that:

- For small traces (< 30 operations), list scheduling is usually optimal or within 1-2 cycles of optimal.
- For larger traces (50-200 operations), list scheduling is typically within 5-10% of optimal.
- The gap increases for machines with many functional units and complex resource models.

These results suggest that list scheduling is a remarkably effective heuristic, and that the optimization effort is better spent on trace selection and other algorithmic improvements than on optimal scheduling.

---

## 36. Trace Scheduling and Predication

### 36.1 The Intersection

Predicated execution and trace scheduling address the same problem -- exploiting ILP across branches -- but from different angles:

- **Trace scheduling** keeps branches but schedules across them, using compensation code.
- **Predicated execution** eliminates branches, using predicate registers to conditionally execute instructions.

### 36.2 Combined Approaches

Modern compilers often combine both approaches:

1. **If-convert short diamonds**: For simple if-then-else constructs with short arms, use if-conversion (predication) to eliminate the branch.
2. **Trace-schedule longer sequences**: For longer, more complex control flow, use trace scheduling or superblock scheduling.
3. **Hyperblock for medium complexity**: For medium-complexity control flow with hardware predication support, use hyperblocks.

The choice between approaches depends on:

- The architecture's support for predication.
- The relative probabilities of the branch outcomes.
- The length and complexity of the branch arms.
- The register pressure.

### 36.3 The Decision Algorithm

The IMPACT compiler project developed a systematic decision algorithm for choosing between trace scheduling, superblock scheduling, if-conversion, and hyperblock formation:

```
Algorithm: CHOOSE-REGION-TYPE(CFG_region, profile, target)

1.  Compute branch probabilities for all branches in the region.
2.  For each branch B with two successors (taken, not-taken):
    a.  If max(prob_taken, prob_not_taken) > TRACE_THRESHOLD (e.g., 0.85):
        - The branch is highly biased. Mark for trace/superblock treatment.
        - The cold path will receive compensation code.
    b.  Else if both arms are short (< SHORT_LIMIT instructions, e.g., 4):
        - Mark for if-conversion (predication).
        - Both paths will be predicated and scheduled together.
    c.  Else if target supports predication AND combined_cost < HYPERBLOCK_LIMIT:
        - Mark for hyperblock formation.
    d.  Else:
        - Mark for trace scheduling (the general case).
3.  Form the scheduling region according to the markings.
4.  Apply the appropriate scheduling algorithm.
```

This decision framework reflects the insight that different control-flow patterns call for different optimization strategies. No single technique is best for all cases; the compiler must analyze each region and choose the most effective approach.

### 36.4 Predication Overhead

A subtle point about predication that affects the trace-vs-hyperblock decision is **predication overhead**. When both arms of a conditional are predicated and scheduled together:

- Both arms' instructions are fetched and decoded, consuming fetch bandwidth.
- Both arms' instructions occupy functional unit slots, even though only one arm's results will be used.
- Both arms' instructions increase register pressure (both produce values, though only one set is live).

For a branch with probability 90/10 (90% taken, 10% not taken), predication wastes 10% of the functional unit slots on the taken path and 90% on the not-taken path. If the not-taken path has many instructions, this waste is substantial. Trace scheduling, by contrast, optimizes the 90% path and pays a small compensation cost on the 10% path.

The break-even point depends on the machine width and the arm lengths. On a 4-wide machine with both arms having 4 instructions each, predication uses 8 instruction slots (4 cycles on a 2-wide equivalent) while trace scheduling uses 4 instruction slots for the hot path plus a small compensation code. For highly biased branches (>80%), trace scheduling is typically more efficient than predication.

---

## 37. Trace Scheduling for Superscalar Processors

### 37.1 Beyond VLIW

Although trace scheduling was developed for VLIW targets, the ideas are applicable to superscalar processors as well. A compiler targeting a superscalar processor can use trace scheduling to:

- **Pre-schedule** instructions in an order that helps the hardware scheduler. While an out-of-order processor will reorder instructions dynamically, presenting instructions in a good initial order reduces the work the hardware must do and may allow it to look further ahead.

- **Reduce branch mispredictions** by linearizing hot paths. When the compiler places the hot-path blocks contiguously in memory, with branches falling through on the common case, the branch predictor has an easier job. Fall-through paths are predicted taken by default in many predictor designs.

- **Improve cache locality** by placing frequently executed instructions together. If the hot trace fits in a single cache line (or a small number of lines), the instruction cache miss rate drops, improving throughput.

- **Eliminate unnecessary branches** through if-conversion. Every branch eliminated is a branch that cannot be mispredicted.

- **Improve instruction fetch bandwidth**. Modern processors fetch instructions in aligned blocks (typically 16 or 32 bytes). If branches cause execution to jump between distant code locations, many fetch cycles are wasted on partial blocks. Linearizing the hot path maximizes the useful instructions per fetch cycle.

### 37.2 The Hwu-Mahlke Contribution

Hwu and Mahlke's 1992 superblock paper was explicitly titled *"The Superblock: An Effective Technique for VLIW and Superscalar Compilation"* (emphasis added). They demonstrated that superblock scheduling improved performance on both VLIW machines and superscalar processors, because even superscalar processors benefit from well-organized code:

- Fewer branches to predict means fewer mispredictions.
- Instructions in execution order reduces the distance the hardware scheduler must look ahead.
- Better code layout improves instruction cache hit rates.

### 37.3 Profile-Guided Code Layout

One of the most impactful applications of trace scheduling ideas to superscalar compilation is **profile-guided code layout**. The compiler uses execution profile data to:

1. **Order basic blocks**: Place blocks in the order they appear on the hot trace, so that the hot path executes as a straight-line sequence with branches falling through.

2. **Split hot and cold code**: Move rarely executed blocks (error handlers, initialization code, diagnostic paths) to a separate section of the executable. This improves instruction cache utilization on the hot path.

3. **Function placement**: Order functions in the executable based on their call frequency, placing frequently called functions near their callers to improve instruction TLB and cache behavior.

4. **Function splitting**: Split functions into hot and cold sections, placing the hot section in the main code section and the cold section (rarely executed basic blocks) in a separate section.

These techniques are direct descendants of trace scheduling's profile-guided approach. They are implemented in GCC (`-freorder-blocks`, `-freorder-functions`, `-fprofile-reorder-functions`), LLVM (`MachineBlockPlacement`, `BranchFolding`), and the Microsoft compiler (`/LTCG` with PGO).

Google's **BOLT** (Binary Optimization and Layout Tool) and Facebook's **HFSort** are post-link optimizers that reorder machine code based on execution profiles -- applying trace-scheduling-inspired code layout to already-compiled binaries. These tools have shown 5-15% performance improvements on large-scale server applications (search engines, social media backends) through better instruction cache behavior alone.

The fact that trace scheduling ideas deliver measurable performance improvements even on modern out-of-order superscalar processors -- processors that should, in theory, be insensitive to instruction order -- demonstrates the lasting relevance of Fisher's work.

---

## 38. The Fisher Legacy: A Retrospective

### 38.1 What Fisher Got Right

1. **ILP exists and can be exploited by compilers**: Fisher demonstrated convincingly that ordinary programs contain far more ILP than basic-block scheduling can extract, and that compilers can find and exploit this ILP.

2. **Profile-guided compilation is essential**: Fisher's early use of profile data to guide optimization was visionary. Today, PGO is standard practice.

3. **The compiler-architecture interface matters**: Fisher's insistence that architecture and compiler must be co-designed -- that the architecture must provide what the compiler needs and the compiler must exploit what the architecture offers -- shaped decades of research.

4. **VLIW is ideal for embedded/DSP**: Fisher later co-authored *Embedded Computing: A VLIW Approach*, explicitly recognizing that VLIW's strengths align with embedded workloads. This insight has been vindicated by the success of TI C6x, Qualcomm Hexagon, and others.

5. **Global code motion is fundamental**: The concept of moving instructions across branch boundaries, with systematic compensation for correctness, is now a basic technique in every optimizing compiler.

### 38.2 What Fisher Underestimated

1. **The power of dynamic scheduling**: Fisher believed that compilers could outperform hardware schedulers for general-purpose workloads. This turned out to be wrong for the memory-bound, branch-intensive workloads that characterize most general-purpose computing.

2. **The binary compatibility barrier**: Fisher underestimated the economic importance of binary compatibility. The software ecosystem is the dominant asset, and architectures that require recompilation face an enormous adoption barrier.

3. **The rate of hardware improvement**: The dramatic improvements in superscalar processors through the 1990s and 2000s -- driven by Moore's Law and aggressive microarchitectural innovation -- made the VLIW hardware-simplicity argument less compelling.

### 38.3 The Lasting Contributions

Trace scheduling and the VLIW concept have left an indelible mark on computer science:

1. **The term "instruction-level parallelism"** -- coined by Fisher -- is fundamental to the field.
2. **Trace scheduling** is taught in every graduate course on compiler design and computer architecture.
3. **Profile-guided optimization** is standard practice in production compilers.
4. **Superblocks and hyperblocks** are used in major compilers (GCC, LLVM, Intel).
5. **Software pipelining** (developed by Rau and Lam, complementary to Fisher's work) is a standard loop optimization.
6. **VLIW DSPs and media processors** power billions of devices worldwide.
7. **The compiler-architecture co-design philosophy** continues to influence the design of domain-specific accelerators (GPUs, TPUs, NPUs).

Fisher's work transformed compiler technology from a craft focused on single-block optimizations into a discipline capable of global, whole-program analysis and transformation. This transformation underlies the performance of every modern processor, whether VLIW or not.

---

## 39. The VLIW/Trace Scheduling Family Tree

### 39.1 A Genealogy of Ideas

The intellectual lineage of trace scheduling and VLIW is remarkably well-defined. A small number of researchers, working at a handful of institutions, created the entire field. Understanding this lineage helps explain why certain ideas emerged when they did and why they evolved as they did.

```
                    Fisher (NYU, 1979)
                    |
                    |--- Trace Scheduling (1981)
                    |--- VLIW concept / ELI-512 (1983)
                    |
            +-------+--------+
            |                |
    Ellis (Yale)      Ruttenberg (Yale)
    Bulldog (1985)    |
            |         |
            +----+----+
                 |
           Multiflow (1984-1990)
                 |
        +--------+--------+--------+
        |        |        |        |
    Intel    HP Labs    DEC    Fujitsu...
    (icc)    (Fisher,   (Alpha  (compiler
             Rau)       tools)  licensing)
                 |
                 +--- PA-WideWord / EPIC
                 |
                 +--- IA-64 / Itanium (2001-2021)
```

Parallel to Fisher's lineage:

```
                    Rau (TRW/ESL, 1981)
                    |
                    |--- Polycyclic Architecture
                    |--- Software Pipelining
                    |
                Cydrome (1984-1988)
                Cydra-5
                    |
                HP Labs (1988-)
                    |
            +-------+-------+
            |               |
        HPL-PlayDoh     FAST project
        (architecture)  (compilers)
            |               |
            +-------+-------+
                    |
                IA-64 / EPIC
```

And the IMPACT lineage:

```
                    Hwu (Illinois, 1988-)
                    |
                    |--- IMPACT compiler
                    |
            +-------+-------+-------+
            |       |       |       |
        Superblocks  Hyperblocks  Sentinel
        (1992)      (1992)       Scheduling
            |       |            (1992)
        Mahlke  Chang  Chen  Bringmann
            |
            +--- Open64 compiler
            +--- Influenced GCC, LLVM
```

### 39.2 The Key People

The field of trace scheduling and VLIW was shaped by a remarkably small group of researchers. Their careers intertwined repeatedly:

**Joseph A. (Josh) Fisher** (1946-): Inventor of trace scheduling and VLIW. NYU -> Yale -> Multiflow -> HP Labs. Eckert-Mauchly Award 2003. B.R. Rau Award 2012.

**B. Ramakrishna (Bob) Rau** (1951-2002): Inventor of software pipelining and modulo scheduling. Co-architect of Cydra-5. TRW/ESL -> Cydrome -> HP Labs. Eckert-Mauchly Award 2002. Died unexpectedly in 2002, shortly after receiving his award, at age 51. The B.R. Rau Award was named in his honor.

**John R. Ellis**: Developer of the Bulldog compiler. Yale (PhD under Fisher). ACM Doctoral Dissertation Award 1985. Later at DEC Systems Research Center and Google.

**John Ruttenberg**: Co-founder of Multiflow, key compiler developer. Yale -> Multiflow -> Silicon Graphics -> Google.

**Alexandru Nicolau**: Graduate student of Fisher at Yale. Later professor at UC Irvine, contributed to ILP research.

**Wen-mei Hwu** (1958-): Leader of the IMPACT group at University of Illinois. Inventor of the superblock. Co-authored influential textbooks on parallel programming and GPU computing. AMD Chief Technology Officer for Software Development. His IMPACT compiler project trained a generation of compiler researchers.

**Scott Mahlke** (1967-2014): Key contributor to superblocks, hyperblocks, and sentinel scheduling at Illinois (under Hwu). Later professor at University of Michigan. Died in 2014 at age 47. The field lost one of its brightest minds.

**Mike Schlansker**: HP Labs researcher, co-developed HPL-PlayDoh and EPIC concepts with Rau.

**Monica Lam**: Proved the effectiveness of software pipelining for VLIW (1988 PLDI paper). Stanford professor. Later co-founded startups in mobile security.

**John Crawford**: Intel's chief architect for IA-64/Itanium. Previously led the i486 design.

**Jerry Huck**: HP's lead architect for IA-64. Previously led PA-RISC development.

### 39.3 The Institutional Map

The geographic and institutional concentration of VLIW research is striking:

- **Yale University** (New Haven, CT): Fisher, Ellis, Ruttenberg, Nicolau. Birthplace of trace scheduling and VLIW.
- **Multiflow Computer** (Branford, CT): Fisher, Ruttenberg, O'Donnell, Lowney, Freudenberger. First commercial VLIW.
- **Cydrome** (San Jose -> Milpitas, CA): Rau, D. Yen, W. Yen, Towle, Kumar. Software pipelining pioneer.
- **HP Labs** (Palo Alto, CA / Cambridge, MA): Fisher, Rau, Schlansker, Faraboschi. PlayDoh architecture, Lx/ST200, EPIC.
- **University of Illinois** (Urbana-Champaign, IL): Hwu, Mahlke, Chang, Chen. IMPACT compiler, superblocks, hyperblocks.
- **Intel** (Santa Clara, CA / Hillsboro, OR): Crawford, Dulong. IA-64/Itanium implementation.
- **Stanford University** (Stanford, CA): Lam. Software pipelining.
- **MIT** (Cambridge, MA): Various ILP research.

---

## 40. Domain-Specific Accelerators: Fisher's Vision Fulfilled

### 40.1 The New VLIW Landscape

In the 2020s, a new generation of processors has emerged that embodies Fisher's vision in unexpected ways. **Domain-specific accelerators** (DSAs) -- processors designed for specific workload classes rather than general-purpose computing -- have become the primary source of performance improvement in modern computing.

These DSAs share key characteristics with VLIW:

1. **Compiler-managed parallelism**: The parallelism is specified at compile time (or at framework deployment time), not discovered dynamically by hardware.
2. **Simple hardware, complex software**: The hardware is optimized for a specific set of operations, with the software stack responsible for mapping workloads to the hardware efficiently.
3. **Known workloads**: The target applications (AI inference, signal processing, video encoding) have well-characterized computational patterns.

### 40.2 AI Accelerators and the VLIW Echo

Modern AI accelerators -- Google's TPU (Tensor Processing Unit), Apple's Neural Engine, Qualcomm's Hexagon NPU, and many others -- operate on principles that Fisher would recognize:

- The **systolic array** in a TPU is essentially a fixed-function pipeline whose schedule is determined at compile time by the XLA compiler. The compiler decides which matrix operations execute when, how data flows through the array, and how memory is managed -- exactly the tasks that a VLIW compiler performs.

- The **instruction-level scheduling** in Hexagon NPU uses VLIW packets, directly descending from the trace scheduling tradition.

- The **AI compilers** (XLA, TVM, MLIR, Glow) perform many of the same optimizations as trace scheduling compilers: dependency analysis, resource-constrained scheduling, loop tiling and pipelining, and profile-guided optimization of hot operations.

### 40.3 The AI Compiler Revolution

The rise of AI/ML workloads has created a renaissance in compiler technology that directly echoes the trace scheduling era. Modern AI compilers face challenges remarkably similar to those faced by Fisher's group at Yale:

**Dependency analysis**: AI computation graphs (TensorFlow, PyTorch, ONNX) are directed acyclic graphs of tensor operations -- structurally identical to the dependency DAGs that trace scheduling compilers build for instruction sequences. The compiler must schedule these operations across the available hardware resources (compute units, memory bandwidth, interconnect).

**Resource-constrained scheduling**: AI accelerators have limited compute units, memory bandwidth, and on-chip storage. The compiler must schedule tensor operations to maximize throughput while respecting these constraints -- exactly the list-scheduling problem that trace compilers solve.

**Memory management**: AI models often exceed the on-chip memory of the accelerator. The compiler must decide when to move data between on-chip and off-chip memory, overlapping data transfers with computation to hide latency -- a problem analogous to trace scheduling's management of register spilling and load/store scheduling.

**Profile-guided optimization**: AI compilers use profiling (tensor shape analysis, execution timing) to guide optimization decisions, just as trace scheduling compilers use branch profiles.

**Operator fusion**: AI compilers fuse multiple tensor operations into a single kernel to reduce memory traffic and overhead -- conceptually similar to trace scheduling's fusion of basic blocks into a single scheduling unit.

The tools have changed (MLIR, TVM, Triton, XLA instead of Bulldog and the Multiflow compiler), the targets have changed (TPUs, GPUs, NPUs instead of TRACE 14/300 and Cydra-5), and the operations have changed (matrix multiplications and convolutions instead of integer arithmetic and floating-point operations), but the fundamental compiler problems are the same ones Fisher identified in 1981.

### 40.4 The Wheel Turns

In the 1980s, Fisher argued that compilers could do a better job of scheduling than hardware, and the general-purpose market disagreed. In the 2020s, for the specific workloads that dominate modern computing (AI inference, media processing, signal processing), the market has agreed. The VLIW approach -- simple hardware, complex compilers, statically scheduled parallelism -- has won in precisely the domains where its advantages are most compelling.

The irony is that Fisher's vision was not wrong; it was just ahead of its time for general-purpose computing and perfectly timed for domain-specific computing. The billions of Hexagon DSP cores, the millions of TI C6x chips, the ubiquitous AI accelerators -- these are the real legacy of trace scheduling, even if they do not always bear the VLIW name.

### 40.5 Quantifying the Legacy

To appreciate the scale of trace scheduling's impact, consider the sheer number of processors running code shaped by VLIW and trace scheduling ideas:

- **Qualcomm Hexagon**: Over 1.2 billion cores shipped by 2012, and billions more since. Every modern Snapdragon SoC contains at least one Hexagon core. With roughly 1.5 billion smartphones shipped annually, and Qualcomm holding approximately 25-30% market share, the number of Hexagon-equipped devices in active use exceeds 3 billion.

- **TI TMS320C6x**: Deployed in virtually every 3G, 4G, and 5G base station worldwide. With approximately 7 million cell towers globally, and multiple C6x DSPs per base station, hundreds of millions of C6x chips are in active service.

- **STMicroelectronics ST200**: Over 70 million cores shipped by 2009, embedded in set-top boxes, digital TVs, and laser printers.

- **NXP TriMedia**: Over 40 million SoCs shipped, with multiple cores per SoC.

- **AI accelerators**: Google's TPUs process billions of search queries, translation requests, and AI inferences daily. Qualcomm's Hexagon NPU runs AI workloads on billions of smartphones. Apple's Neural Engine processes camera, speech, and on-device AI workloads on over a billion active devices.

Conservative estimates place the total number of VLIW-family processors in active use at well over **5 billion** -- more than any other non-x86, non-ARM architecture family. The vast majority of these processors run code that was produced by compilers using techniques directly descended from Fisher's trace scheduling algorithm.

This is, by any measure, one of the most commercially impactful contributions in the history of compiler research.

---

## 41. A Comprehensive Timeline

The following timeline traces the complete arc of trace scheduling and VLIW, from Fisher's dissertation through the present day:

| Year | Event |
|------|-------|
| 1967 | Amdahl's law articulated |
| 1976 | Fisher begins doctoral work at NYU Courant Institute |
| 1979 | Fisher completes PhD: "Optimization of Horizontal Microcode Within and Beyond Basic Blocks" |
| 1979 | Fisher joins Yale as assistant professor |
| 1981 | Fisher publishes "Trace Scheduling" in IEEE Trans. Computers |
| 1981 | Rau develops Polycyclic Architecture at TRW/ESL |
| 1983 | Fisher presents "Very Long Instruction Word Architectures and the ELI-512" at ISCA |
| 1983 | Fisher promoted to associate professor at Yale |
| 1984 | Fisher, Ruttenberg, O'Donnell found Multiflow Computer |
| 1984 | Rau, Yen, Yen, Towle, Kumar found Cydrome |
| 1984 | Fisher receives NSF Presidential Young Investigator Award |
| 1985 | Ellis's Bulldog compiler receives ACM Doctoral Dissertation Award |
| 1985 | Multiflow compiler generates correct code |
| 1987 | Multiflow delivers first TRACE systems to beta sites |
| 1987 | Cydra-5 demonstrated at Supercomputer Conference |
| 1987 | Fisher named Connecticut Entrepreneur of the Year |
| 1988 | Cydrome closes; HP Labs hires Rau and Schlansker |
| 1988 | Lam publishes "Software Pipelining" at PLDI |
| 1989 | Intel announces i860 (first VLIW on a single chip) |
| 1989 | HP begins research on RISC successor (leads to EPIC) |
| 1990 | Multiflow ceases operations (March 27) |
| 1990 | Fisher joins HP Labs; HP acquires Multiflow IP |
| 1990 | Intel, HP, DEC, others license Multiflow compiler |
| 1991 | Wall publishes "Limits of Instruction-Level Parallelism" |
| 1992 | Hwu, Mahlke et al. publish superblock and hyperblock papers |
| 1992 | Mahlke, Chen, Hwu, Rau, Schlansker publish sentinel scheduling |
| 1993 | Ball and Larus publish static branch prediction heuristics |
| 1993 | HP approaches Intel about IA-64 partnership |
| 1994 | HP-Intel partnership on IA-64 announced |
| 1994 | Rau publishes "Iterative Modulo Scheduling" |
| 1994 | Freudenberger and Ruttenberg publish compensation code optimization |
| 1997 | "EPIC" term coined for IA-64 |
| 1999 | TI TMS320C6000 VLIW DSP family achieves major commercial success |
| 2000 | Transmeta Crusoe ships (VLIW with x86 binary translation) |
| 2000 | Fisher named HP Fellow |
| 2000 | Faraboschi et al. present Lx/ST200 VLIW platform at ISCA |
| 2001 | Itanium (Merced) ships (May). Performance disappoints. |
| 2002 | Rau receives Eckert-Mauchly Award; dies later that year |
| 2002 | Itanium 2 (McKinley) ships. Competitive for server workloads. |
| 2002 | Fisher named HP Senior Fellow |
| 2003 | AMD launches Opteron with AMD64 -- the Itanium killer |
| 2003 | Fisher receives Eckert-Mauchly Award |
| 2005 | Fisher, Faraboschi, Young publish *Embedded Computing: A VLIW Approach* |
| 2006 | Qualcomm Hexagon V1 ships in first Snapdragon SoC |
| 2006 | Fisher retires from HP Labs |
| 2009 | STMicroelectronics reports 40M+ SoCs with ST200 VLIW cores shipped |
| 2012 | Fisher receives B.R. Rau Award; Qualcomm reports 1.2B Hexagon cores shipped |
| 2014 | Scott Mahlke dies at age 47 |
| 2017 | Intel announces Kittson as final Itanium generation |
| 2021 | Final Itanium shipments complete (July 29) |
| 2024 | Linux 6.7 removes Itanium support. Torvalds: "It's dead, Jim." |
| 2024+ | Qualcomm Hexagon NPU achieves 50+ TOPS for AI inference |

---

## 42. Lessons for Computer Architecture

### 42.1 The Architecture-Compiler Contract

The history of trace scheduling and VLIW teaches several lessons that remain relevant to the design of any computer system:

**Lesson 1: The compiler can only exploit what the architecture provides.**

A VLIW architecture with too few functional units limits the ILP the compiler can exploit. A VLIW architecture without predication support prevents the use of hyperblocks. A VLIW architecture without hardware support for speculative loads limits the effectiveness of speculative code motion. Architecture and compiler must be co-designed; neither can succeed alone.

**Lesson 2: The architecture must not depend on the compiler for properties the compiler cannot guarantee.**

If the architecture depends on the compiler predicting cache behavior, it will fail on workloads with unpredictable cache behavior. If the architecture depends on the compiler predicting branch outcomes, it will fail on workloads with unpredictable branches. The Itanium's dependence on compiler technology that could not reliably predict memory latency and branch behavior for general-purpose workloads was its fatal flaw.

**Lesson 3: Binary compatibility is an economic force, not a technical one.**

From a purely technical standpoint, recompilation is a minor inconvenience. From an economic standpoint, it is a near-insurmountable barrier. The installed base of software represents billions of dollars of investment, and any architecture that requires discarding that investment faces fierce resistance.

**Lesson 4: Workload characteristics determine which approach wins.**

VLIW is ideal for workloads that are predictable, regular, and amenable to static analysis. Superscalar is ideal for workloads that are unpredictable, irregular, and require dynamic adaptation. There is no universally best approach; the choice depends on the workload.

**Lesson 5: Sometimes the "inferior" approach wins on other merits.**

VLIW is technically elegant: it produces simpler hardware, requires less power, and places the intelligence in the compiler where it can be improved without changing hardware. But superscalar won in general-purpose computing because it offered binary compatibility, dynamic adaptation to runtime conditions, and a simpler compiler. Technical elegance is not sufficient for commercial success; practical considerations dominate.

### 42.2 The Counterfactual: What If VLIW Had Won?

It is interesting to speculate about an alternate history in which VLIW had succeeded in general-purpose computing:

- **Compilers would be much more sophisticated**: The economic incentive to improve compilers would have been enormous. Compiler teams at Intel, AMD, and other vendors would be ten times their current size, and compiler optimization would be a critical competitive differentiator. Instead of competing on microarchitectural tricks invisible to software, chip vendors would compete on compiler quality -- who can extract the most parallelism from the same program.

- **Binary compatibility would be solved differently**: Perhaps through standardized VLIW ISAs with scalable instruction word formats, or through ubiquitous binary translation (as Transmeta attempted), or through intermediate representations compiled to the target at install time (as .NET and Java partially implement). The concept of "fat binaries" -- executables containing code for multiple machine widths -- might have become standard.

- **Processors would be simpler and more power-efficient**: Without the overhead of out-of-order execution, register renaming, and complex branch prediction, processors would use a fraction of the die area and power budget for the same computational throughput. The "dark silicon" problem (too many transistors to power simultaneously) might be less severe in a VLIW world where the hardware is simpler.

- **The memory wall would be addressed differently**: Without dynamic scheduling to hide cache misses, the pressure to solve the memory latency problem would have been even greater. Perhaps prefetching techniques, scratchpad memories, or non-caching architectures would have been developed more aggressively. The Cydra-5's decision to use banked memory instead of a data cache might have been vindicated.

- **Programming languages might have evolved differently**: Languages might include more explicit parallelism hints, annotations for branch probability, and aliasing specifications to help the compiler. The `restrict` keyword in C99 might have been introduced a decade earlier, and similar features in other languages might be more widespread.

- **Moore's Law scaling might have continued differently**: The transistor budget spent on dynamic scheduling hardware in today's processors could instead have been spent on more functional units, larger caches, or additional cores. The architectural landscape would look quite different.

This counterfactual is not merely academic. As the computing industry increasingly moves toward domain-specific accelerators with statically scheduled parallelism, elements of this alternate history are becoming reality -- just not for general-purpose computing.

### 42.3 The Integrated Future

The most likely future is not a return to pure VLIW or a continuation of pure superscalar, but an integration of both approaches in heterogeneous systems:

- **CPU cores**: Out-of-order superscalar, handling irregular, general-purpose workloads. The compiler performs trace-scheduling-inspired code layout and PGO, but the hardware does the heavy lifting of dynamic scheduling.

- **DSP/NPU cores**: VLIW-family architectures, handling regular, predictable workloads (signal processing, AI inference). The compiler does the heavy lifting of static scheduling.

- **GPU cores**: Wide SIMT architectures, handling massively parallel data workloads. The compiler manages thread scheduling and memory management.

- **Custom accelerators**: Application-specific logic, compiled from high-level descriptions (HLS, domain-specific languages). The compiler maps the application to fixed hardware.

In this heterogeneous world, every core type uses scheduling techniques descended from trace scheduling, but they use them differently depending on the workload and the hardware. The compiler is the unifying element -- the layer that maps software to the diverse hardware landscape.

Fisher's vision of compiler-managed parallelism has not replaced hardware-managed parallelism. Instead, both approaches coexist in modern systems, each applied where it is most effective. The compiler-architecture co-design principle that Fisher articulated remains the guiding framework for this integration.

---

## 43. Conclusion

### 43.1 The Intellectual Achievement

The story of trace scheduling is, at its heart, a story about the relationship between algorithms and machines. Fisher's insight -- that the compiler, given the right tools and the right architecture, could exploit parallelism far beyond the natural boundaries of basic blocks -- was one of the most consequential ideas in the history of computer science.

The algorithm itself is elegant in its simplicity: select a hot path, schedule it as a single unit, fix up the cold paths with compensation code, and repeat. The bookkeeping is meticulous but systematic. The greedy trace selection is straightforward. The list scheduling is standard. None of the individual components is revolutionary; the revolution was in combining them into a coherent system that could take an ordinary sequential program and transform it into highly parallel code.

Consider the magnitude of what Fisher accomplished. Before trace scheduling, compilers treated branch boundaries as inviolable walls. Operations in one basic block could not be moved to another. The compiler's view of parallelism was limited to the 4-7 instructions between consecutive branches -- a tiny window that could exploit almost no ILP.

After trace scheduling, the compiler's view expanded to the entire hot path through the program -- potentially hundreds of instructions spanning dozens of branches. The parallelism exposed was not merely incremental; it was qualitative. Workloads that showed ILP of 1.5 within basic blocks could show ILP of 5-10 or more across a trace. This was the difference between a VLIW machine sitting 80% idle and a VLIW machine running at 60-70% of peak throughput.

The key ideas that made this possible -- profile-guided selection, the distinction between hot and cold paths, systematic compensation code, speculative code motion -- were individually simple but collectively powerful. Their combination created a framework that has stood for over four decades as the standard approach to global instruction scheduling.

### 43.2 The Commercial Arc

The VLIW architecture that trace scheduling was designed for -- simple hardware, wide instruction words, compiler-managed everything -- was a beautiful idea that did not survive contact with the general-purpose market. The reasons were economic and practical, not technical: binary compatibility, unpredictable workloads, the success of dynamic scheduling, and the raw economic power of the x86 ecosystem.

The commercial arc of VLIW followed a classic technology trajectory:

1. **Academic proof of concept** (1979-1984): Fisher at Yale, demonstrating trace scheduling and VLIW on simulations and the Bulldog compiler.

2. **Startup commercialization** (1984-1990): Multiflow and Cydrome, building real VLIW machines and selling them to early adopters.

3. **Industry investment** (1990-2001): HP and Intel, pouring billions into the Itanium project to bring VLIW-derived principles to the mainstream.

4. **Commercial failure in the target market** (2001-2021): Itanium's slow decline, overtaken by the pragmatic AMD64 extension and the relentless improvement of out-of-order x86 processors.

5. **Triumph in a different market** (1999-present): VLIW's spectacular success in DSP, embedded, and media processing -- markets where its technical advantages (power efficiency, deterministic performance, low cost) align with customer requirements.

This arc is not a story of failure. It is a story of an idea that found its true home. The general-purpose market was the wrong market for VLIW, but the embedded and DSP markets were the right ones, and in those markets, VLIW has succeeded beyond anyone's 1984 predictions.

### 43.3 The Living Ideas

The most important measure of trace scheduling's impact is not the machines it ran on or the companies it created, but the ideas it introduced into the practice of compiler construction. These ideas are alive in every modern compiler:

- **Profile-guided optimization** is standard practice at Google, Facebook, Microsoft, and every major software company. The techniques descend directly from Fisher's profile-guided trace selection.

- **Global code motion** -- moving instructions across branch boundaries with compensation code -- is used by GCC, LLVM, the Intel compiler, and every other optimizing compiler. The bookkeeping rules Fisher formalized in 1981 remain the foundation of this technique.

- **Superblock and hyperblock formation** shape how compilers handle control flow in performance-critical code. The IMPACT group's contributions built directly on Fisher's trace scheduling framework.

- **Software pipelining** -- the complementary technique developed by Rau and Lam -- overlaps loop iterations in the inner loops of virtually every high-performance program.

- **Instruction scheduling itself** -- the list scheduling algorithm, the dependency DAG, the resource model -- is performed on every function in every compiled program, whether the target is VLIW, superscalar, or in-order.

- **Profile-guided code layout** -- placing hot code together, splitting hot and cold sections, ordering functions by call frequency -- delivers measurable performance improvements on the most advanced out-of-order processors, demonstrating that even hardware-managed scheduling benefits from compiler-managed code organization.

### 43.4 The Final Word

Perhaps the most fitting epitaph for trace scheduling was offered by Fisher himself, in the context of the compiler-architecture co-design principle: the best systems are built when the architecture and the compiler are designed together, each providing what the other needs. Trace scheduling was the first, and perhaps still the most influential, demonstration of this principle.

The billions of VLIW processors in smartphones, DSP systems, AI accelerators, and embedded devices around the world are Fisher's legacy -- the quiet triumph of an idea that was too elegant to die, even if it had to find a different home than the one originally intended.

In the end, the story of trace scheduling is not a story of VLIW versus superscalar. It is a story about the power of compiler technology to transform the performance landscape of computing. Whether the parallelism is managed by hardware or by software, the ideas Fisher introduced -- look beyond the basic block, follow the hot path, schedule aggressively, fix up the cold paths -- remain the foundation of how we extract performance from silicon. They will remain so for as long as we build machines that execute instructions.

---

# References

---

## Primary Sources

1. Fisher, J.A. "Trace Scheduling: A Technique for Global Microcode Compaction." *IEEE Transactions on Computers*, vol. C-30, no. 7, pp. 478-490, July 1981.

2. Fisher, J.A. "Very Long Instruction Word Architectures and the ELI-512." *Proceedings of the 10th Annual International Symposium on Computer Architecture (ISCA)*, pp. 140-150, 1983.

3. Ellis, J.R. *Bulldog: A Compiler for VLIW Architectures*. MIT Press, 1986. (ACM Doctoral Dissertation Award, 1985.)

4. Fisher, J.A. "The Optimization of Horizontal Microcode Within and Beyond Basic Blocks: An Application of Processor Scheduling with Resources." Ph.D. Dissertation, Courant Institute of Mathematical Sciences, New York University, 1979.

## VLIW Architectures

5. Lowney, P.G., Freudenberger, S.M., Karzes, T.J., Lichtenstein, W.D., Nix, R.P., O'Donnell, J.S., and Ruttenberg, J.C. "The Multiflow Trace Scheduling Compiler." *The Journal of Supercomputing*, vol. 7, pp. 51-142, 1993.

6. Rau, B.R., Yen, D.W.L., Yen, W., and Towle, R.A. "The Cydra 5 Departmental Supercomputer: Design Philosophies, Decisions, and Trade-offs." *IEEE Computer*, vol. 22, no. 1, pp. 12-35, January 1989.

7. Rau, B.R. "Iterative Modulo Scheduling: An Algorithm for Software Pipelining Loops." *Proceedings of the 27th Annual International Symposium on Microarchitecture (MICRO-27)*, pp. 63-74, 1994.

8. Lam, M.S. "Software Pipelining: An Effective Scheduling Technique for VLIW Machines." *Proceedings of the ACM SIGPLAN Conference on Programming Language Design and Implementation (PLDI)*, pp. 318-328, 1988.

## Superblocks and Hyperblocks

9. Hwu, W.W., Mahlke, S.A., Chen, W.Y., Chang, P.P., Warter, N.J., Bringmann, R.A., Ouellette, R.G., Hank, R.E., Kiyohara, T., Haab, G.E., Holm, J.G., and Lavery, D.M. "The Superblock: An Effective Technique for VLIW and Superscalar Compilation." *The Journal of Supercomputing*, vol. 7, pp. 229-248, 1993.

10. Mahlke, S.A., Lin, D.C., Chen, W.Y., Hank, R.E., and Bringmann, R.A. "Effective Compiler Support for Predicated Execution Using the Hyperblock." *Proceedings of the 25th Annual International Symposium on Microarchitecture (MICRO-25)*, pp. 45-54, 1992.

11. Mahlke, S.A., Chen, W.Y., Hwu, W.W., Rau, B.R., and Schlansker, M.S. "Sentinel Scheduling for VLIW and Superscalar Processors." *Proceedings of the 5th International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS-V)*, pp. 238-247, 1992.

## IA-64 and EPIC

12. Schlansker, M.S. and Rau, B.R. "EPIC: Explicitly Parallel Instruction Computing." *IEEE Computer*, vol. 33, no. 2, pp. 37-45, February 2000.

13. Dulong, C. "The IA-64 Architecture at Work." *IEEE Computer*, vol. 31, no. 7, pp. 24-32, July 1998.

14. Smotherman, M. "Historical Background for HP/Intel EPIC and IA-64." Clemson University, online resource. https://people.computing.clemson.edu/~mark/epic.html

## Region-Based Scheduling

15. Schlansker, M.S. and Rau, B.R. "Methods of Selecting Regions." HPL Technical Report, Hewlett-Packard Laboratories, 1992.

16. Rosier, M.C. and Conte, T.M. "Treegion Instruction Scheduling in GCC." *Proceedings of the GCC Developers' Summit*, 2006.

## Compensation Code

17. Freudenberger, S.M. and Ruttenberg, J.C. "Avoidance and Suppression of Compensation Code in a Trace Scheduling Compiler." *ACM Transactions on Programming Languages and Systems (TOPLAS)*, vol. 16, no. 4, pp. 1156-1214, July 1994.

## Phase Ordering

18. Freudenberger, S.M. and Ruttenberg, J.C. "Phase Ordering of Register Allocation and Instruction Scheduling." In *Code Generation: Concepts, Tools, Techniques*, Springer, 1992.

19. Motwani, R., Palem, K.V., Sarkar, V., and Reyen, S. "Combining Register Allocation and Instruction Scheduling." Technical Report TR1995-698, Courant Institute, NYU, 1995.

## Modern VLIW Implementations

20. Texas Instruments. "TMS320C6000 Technical Brief." Literature Number SPRU197D, February 1999.

21. Codrescu, L. "Qualcomm Hexagon DSP: An Architecture Optimized for Mobile Multimedia and Communications." *IEEE Hot Chips 25*, 2013.

22. Faraboschi, P., Brown, G., Fisher, J.A., Desoli, G., and Homewood, F. "Lx: A Technology Platform for Customizable VLIW Embedded Processing." *Proceedings of the 27th Annual International Symposium on Computer Architecture (ISCA)*, pp. 203-213, 2000.

23. Fisher, J.A., Faraboschi, P., and Young, C. *Embedded Computing: A VLIW Approach to Architecture, Compilers and Tools*. Morgan Kaufmann, 2005.

## The Intel i860 and Transmeta

24. Kohn, L. and Margulis, N. "Introducing the Intel i860 64-bit Microprocessor." *IEEE Micro*, vol. 9, no. 4, pp. 15-30, August 1989.

25. Dehnert, J.C., Grant, B.K., Banning, J.P., Johnson, R., Kistler, T., Klaiber, A., and Mattson, J. "The Transmeta Code Morphing Software: Using Speculation, Recovery, and Adaptive Retranslation to Address Real-Life Challenges." *Proceedings of the 1st Annual IEEE/ACM International Symposium on Code Generation and Optimization (CGO)*, pp. 15-24, 2003.

## Branch Prediction and ILP Studies

26. Ball, T. and Larus, J.R. "Branch Prediction for Free." *Proceedings of the ACM SIGPLAN Conference on Programming Language Design and Implementation (PLDI)*, pp. 300-313, 1993.

27. Wall, D.W. "Limits of Instruction-Level Parallelism." *Proceedings of the 4th International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS-IV)*, pp. 176-188, 1991.

28. Hennessy, J.L. and Patterson, D.A. *Computer Architecture: A Quantitative Approach*. 6th Edition, Morgan Kaufmann, 2019.

## Awards and Recognition

29. ACM/IEEE Computer Society. "Eckert-Mauchly Award: Joseph A. (Josh) Fisher, 2003." Citation: "For outstanding contributions to instruction-level parallelism and the formulation of the trace scheduling approach to VLIW compilation."

30. ACM/IEEE Computer Society. "Eckert-Mauchly Award: B. Ramakrishna (Bob) Rau, 2002." Citation: "For pioneering contributions to statically-scheduled instruction-level parallel processors and their compilers."

---

## Acknowledgments

This survey draws on three decades of published research, from Fisher's 1981 foundational paper through the postmortem analyses of Itanium's commercial failure. The history of trace scheduling is, in many ways, the history of the compiler-architecture interface itself: a story of ideas that were sometimes ahead of their time, sometimes perfectly timed, and always intellectually rich.

The field owes an enormous debt to Josh Fisher, Bob Rau, John Ellis, Wen-mei Hwu, Scott Mahlke, Monica Lam, and the many other researchers who built the intellectual foundations described here. Their work -- whether it led to commercial success or commercial failure -- advanced the science of computing in ways that continue to shape the systems we build and use today.

---

*Document prepared for the PNW Research Series, April 2026.*
*Trace Scheduling Research Project (TRS).*
