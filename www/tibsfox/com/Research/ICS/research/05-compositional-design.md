# Compositional Design

> **Domain:** Systems Engineering & Architecture
> **Module:** 5 -- Composing Complex Systems from Simple Parts
> **Through-line:** *The Amiga Principle is a theorem about composition: four specialized chips, each doing one thing with perfect fidelity, produce emergent capability that no single general-purpose processor can replicate. The principle holds at every scale -- from a spring terminal on cardboard to the Standard Model of particle physics. Composition is not assembly. It is architecture.* The spaces between the parts are where the meaning lives.

---

## Table of Contents

1. [Composition vs. Assembly](#1-composition-vs-assembly)
2. [The Amiga Principle Formalized](#2-the-amiga-principle-formalized)
3. [Separation of Concerns](#3-separation-of-concerns)
4. [Design Patterns as Compositional Templates](#4-design-patterns-as-compositional-templates)
5. [Layered Architecture](#5-layered-architecture)
6. [Pipeline Architecture](#6-pipeline-architecture)
7. [Compositional Verification](#7-compositional-verification)
8. [Emergent Properties](#8-emergent-properties)
9. [The Standard Model as Compositional Design](#9-the-standard-model-as-compositional-design)
10. [Compositional Design in GSD](#10-compositional-design-in-gsd)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Composition vs. Assembly

Assembly is putting parts together. Composition is putting parts together *such that the resulting system has properties that no individual part possesses* [1].

A pile of LEGO bricks is an assembly. A LEGO bridge that spans a gap and bears a load is a composition -- the bridge has the emergent property of load-bearing that no individual brick has. The distinction is precise:

- **Assembly:** The aggregate properties are the sum of the parts (total mass = sum of part masses)
- **Composition:** The system properties are the *product* of the architecture (bridge strength > sum of brick strengths in isolation)

```
ASSEMBLY vs. COMPOSITION
================================================================

  ASSEMBLY (additive):
    Property(System) = sum(Property(Part_i))
    Example: Total mass, total cost, total part count

  COMPOSITION (multiplicative/emergent):
    Property(System) >> sum(Property(Part_i))
    Example: Bridge load capacity, Amiga graphics capability,
             neural network intelligence, LHC collision energy
```

Brooks (1987) captured this in the famous distinction between *essential complexity* (inherent in the problem) and *accidental complexity* (introduced by the tools and methods). Good compositional design minimizes accidental complexity by making the architecture match the problem structure [2].

**The Amiga example:** A Motorola 68000 at 7.16 MHz has approximately 1 MIPS throughput. An IBM PC AT with a 16 MHz 80286 has approximately 2.6 MIPS. By assembly logic (additive), the IBM is 2.6x more capable. By compositional logic, the Amiga produces 4096-color graphics with 4-channel audio simultaneously while the IBM cannot, because the Amiga's architecture (Agnus + Denise + Paula + 68000) composes specialized capabilities that a single general-purpose processor cannot replicate regardless of clock speed [3].

---

## 2. The Amiga Principle Formalized

The Amiga Principle can be stated formally [3, 4]:

**Principle:** For a system requiring capabilities C_1, C_2, ..., C_n, a design using n specialized modules (each implementing one C_i with high fidelity) will outperform a design using one general-purpose module (implementing all C_i at lower fidelity per capability), when the capabilities can be executed in parallel and the inter-module communication cost is low relative to the computation cost.

**Conditions for the Amiga Principle to hold:**
1. **Parallelism:** The capabilities must be independently executable (Agnus, Denise, and Paula operate on separate data streams simultaneously)
2. **Specialization advantage:** Each specialized module must achieve higher fidelity per capability than the general-purpose alternative (Denise's bitplane hardware produces better graphics than CPU-driven framebuffer)
3. **Low communication overhead:** The inter-module interface must not bottleneck the system (Agnus's cycle-stealing DMA provides zero-overhead data movement)

**When the principle fails:** If capabilities are inherently sequential (C_2 depends on the output of C_1), specialization provides no parallel speedup. If communication overhead dominates computation (Amdahl's Law: speedup = 1 / (s + p/n) where s is the serial fraction), adding specialized modules has diminishing returns [5].

```
AMIGA PRINCIPLE -- FORMAL CONDITIONS
================================================================

  Given: Capabilities C = {C1, C2, ..., Cn}
         General processor G with throughput T_G per capability
         Specialized modules S = {S1, S2, ..., Sn}
         Communication cost K per module interaction

  Amiga Principle holds when:
    sum(T_Si) - n*K > n * T_G

  In practice:
    Agnus DMA  (T_Agnus >> T_68000_DMA) with K_Agnus ~ 0 (cycle stealing)
    Denise GFX (T_Denise >> T_68000_GFX) with K_Denise ~ 0 (shared bus)
    Paula AUD  (T_Paula >> T_68000_AUD) with K_Paula ~ 0 (DMA channels)

  Result: Amiga 500 (7 MHz) > IBM PC AT (16 MHz) for multimedia
```

---

## 3. Separation of Concerns

Dijkstra (1974) introduced the term "separation of concerns" to describe the principle that a system should be decomposed into components, each addressing a distinct concern [6]. This is the abstract form of the Amiga Principle:

**Concern mapping for the Amiga chipset:**

| Chip | Concern | Interface | Fidelity Metric |
|---|---|---|---|
| Agnus | Memory access scheduling | DMA channel registers | Bus utilization % |
| Denise | Video output generation | Bitplane pointers, color registers | Color depth, resolution |
| Paula | Audio output + I/O | DMA audio channels, serial port | Sample rate, bit depth |
| MC68000 | Application logic | Instruction stream, bus requests | IPC (instructions per cycle) |

*Source: Maher (2018) [3]*

**In software architecture:** Separation of concerns is the foundation of:
- **MVC (Model-View-Controller):** Trygve Reenskaug, 1979. Data (Model), presentation (View), and logic (Controller) are separate modules [7].
- **Microservices:** Each service owns one business capability, communicates via API. Amazon (2002) mandated that all teams expose functionality through service interfaces (Jeff Bezos's "API mandate") [8].
- **Unix philosophy:** "Do one thing and do it well" (McIlroy, 1978). cat reads files, grep filters lines, sort orders them. Composition via pipes: `cat file | grep pattern | sort` [9].

**The cost of violating separation of concerns:** When concerns are mixed, a change in one concern forces changes across the entire system. This is the definition of tight coupling (Module 1, Section 3). The maintenance cost of a mixed-concern system grows quadratically with system size, while a well-separated system grows linearly [6].

---

## 4. Design Patterns as Compositional Templates

Design patterns (Gamma, Helm, Johnson, Vlissides, 1994 -- the "Gang of Four") are reusable compositional templates that solve recurring design problems [10].

**Construction set analogs of software design patterns:**

| Pattern | Software | Construction Set | Physical |
|---|---|---|---|
| Factory | Object creation | Part selection from inventory | Assembly line station |
| Adapter | Interface translation | LEGO-to-Duplo converter | Electrical adapter plug |
| Composite | Tree of uniform nodes | Sub-assembly within assembly | Fractal structure |
| Decorator | Adding behavior to objects | Attachment on existing model | Paint on a wall |
| Observer | Event notification | Sensor triggering actuator | Fire alarm system |
| Strategy | Interchangeable algorithms | Swappable gear ratios | Transmission modes |
| Pipeline | Sequential processing | Assembly line | Signal processing chain |

**The Builder pattern** is literally named after the construction set concept: it separates the construction of a complex object from its representation so that the same construction process can create different representations. A LEGO instruction manual is a Builder: the same construction process (step-by-step placement) applied to different part sets produces different models [10].

**Pattern language:** Christopher Alexander (1977) coined "pattern language" in architecture: a collection of design patterns that together describe how to construct buildings, towns, and communities. Software adopted the term. The construction set is the physical bridge between Alexander's architectural patterns and the Gang of Four's software patterns [11].

---

## 5. Layered Architecture

The construction set's ten-layer curriculum (Matter, Signal, Logic, Compute, Software, Network, Intelligence, Quantum, Collider, Fidelity) is a layered architecture where each layer depends only on the layer below [12]:

```
LAYERED ARCHITECTURE -- THE TEN-LAYER STACK
================================================================

  L10: FIDELITY    (depends on all below)
  L09: COLLIDER    (depends on L08, L07, L06)
  L08: QUANTUM     (depends on L01, L02, L03)
  L07: INTELLIGENCE(depends on L04, L05, L06)
  L06: NETWORK     (depends on L02, L04)
  L05: SOFTWARE    (depends on L04)
  L04: COMPUTE     (depends on L03)
  L03: LOGIC       (depends on L02)
  L02: SIGNAL      (depends on L01)
  L01: MATTER      (foundation)
```

**Properties of layered architecture:**
1. **Abstraction:** Each layer presents a simplified interface to the layer above
2. **Encapsulation:** Each layer hides its implementation from layers above
3. **Substitutability:** Any implementation of a layer's interface can replace the current one
4. **Testability:** Each layer can be tested independently against its interface contract

The OSI model (ISO 7498, 1984) is the canonical layered architecture: 7 layers from Physical to Application. The construction set's 10 layers are the generalization: from matter to fidelity, each layer adds abstraction and hides complexity [12, 13].

**The violation pattern:** "Layer skipping" -- when a higher layer directly accesses a lower layer, bypassing intermediate abstractions. Example: a web application writing raw SQL instead of using an ORM. In the construction set: a software engineer optimizing GPU kernel code (layer 7 reaching down to layer 3) bypasses the software abstraction layer. Layer skipping is sometimes necessary for performance but always increases coupling [12].

---

## 6. Pipeline Architecture

A pipeline processes data through a sequence of stages, where each stage's output is the next stage's input [14]:

**The Unix pipe (Thompson & Ritchie, 1973):** The pipe operator `|` connects the stdout of one process to the stdin of the next. This is the simplest pipeline architecture: each stage is a module with a uniform interface (text stream in, text stream out) [9].

**The RISC CPU pipeline (Hennessy & Patterson, 1990):** IF -> ID -> EX -> MEM -> WB. Five stages, one instruction per clock cycle at steady state (CPI = 1.0). Data hazards require forwarding; control hazards require prediction. Pipeline stalls are fidelity failures: the pipeline should sustain one instruction per cycle, and any stall degrades throughput [14, 15].

**The signal processing pipeline:** Microphone -> ADC -> DSP -> DAC -> Speaker. Each stage transforms the signal; each stage can introduce noise or distortion. The pipeline's total fidelity is the product of the stage fidelities. This is the construction set's signal-layer expression of the compositional fidelity principle [16].

**The construction set as pipeline:**

```
CONSTRUCTION SET PIPELINE
================================================================

  Raw material -> Parts fabrication -> Quality control ->
  Inventory -> Assembly -> Testing -> Deployment

  At each stage, information is transformed:
    Material properties -> Part geometry -> Verified specification ->
    Available inventory -> Physical assembly -> Verified assembly ->
    Operational system

  Fidelity at each stage:
    Material purity -> Tolerance (10 um LEGO) -> Pass/fail ->
    Stock accuracy -> Assembly correctness -> Test coverage ->
    Operational reliability
```

---

## 7. Compositional Verification

Compositional verification proves that a system satisfies its specification by verifying each component independently and then proving that composition preserves the verified properties [17].

**Assume-guarantee reasoning:** Component A is verified under the assumption that component B satisfies its specification. Component B is verified under the assumption that A satisfies its specification. If both verifications pass, the composed system A || B satisfies both specifications. Pnueli (1984) formalized this for concurrent systems [17].

**For construction sets:**
1. Verify each part meets its specification (LEGO: 10 um tolerance, correct ABS formulation)
2. Verify each connection meets its interface contract (clutch power, stud diameter)
3. Verify the composed assembly meets its structural and functional requirements

**The advantage of compositional verification over monolithic testing:** Testing the complete system requires exploring all possible states -- exponential in system size. Compositional verification requires testing each component independently (linear in component count) plus verifying interface compatibility (linear in connection count). The total verification cost is polynomial rather than exponential [17, 18].

**NIST traceability as compositional verification:** The spring terminal's contact resistance is verified against a NIST-traceable resistance standard. The resistance standard is verified against the quantum Hall effect (R_K = h/e^2). The quantum Hall effect is verified against the CODATA fundamental constants. Each link in the traceability chain is a compositional verification step: verify locally, compose globally [19].

---

## 8. Emergent Properties

Emergent properties are system properties that arise from composition but are not present in any individual component [20]:

- **Wetness** emerges from the composition of H2O molecules; no individual molecule is wet
- **Consciousness** (arguably) emerges from the composition of neurons; no individual neuron is conscious
- **Load-bearing capacity** emerges from the composition of structural members; no individual LEGO brick bears a bridge load
- **Intelligence** emerges from the composition of simple neural operations; no individual matrix multiplication is intelligent

**Strong emergence vs. weak emergence:**
- **Weak emergence:** The system property can be predicted from the component properties and composition rules (in principle, with enough computation). Most engineering emergence is weak.
- **Strong emergence:** The system property cannot be predicted from component properties even in principle. Whether strong emergence exists in physical systems is a philosophical question [20].

The construction set curriculum takes the engineering position: all emergent properties of interest are weakly emergent -- predictable from the components and their composition, given sufficient analysis. The Amiga's multimedia capability is weakly emergent: it can be predicted from Agnus's DMA scheduling, Denise's bitplane hardware, Paula's audio channels, and the 68000's instruction throughput, given knowledge of the bus arbitration scheme [3, 20].

**Emergent failure:** Composition can produce undesired emergent properties. Two individually correct modules can compose into an incorrect system when their interaction produces an unintended state. The Therac-25 radiation therapy accidents (1985--1987) resulted from a race condition between two individually correct software modules -- an emergent failure at the composition boundary [21].

---

## 9. The Standard Model as Compositional Design

The Standard Model of particle physics is the universe's compositional design: 17 fundamental particles and 4 fundamental interactions compose all known matter and energy [22].

**The construction set at the fundamental level:**

| Category | Parts | Composition Rule | Emergent Structure |
|---|---|---|---|
| Quarks (6) | u, d, s, c, b, t | Strong force (gluon) | Protons, neutrons, mesons |
| Leptons (6) | e, mu, tau, nu_e, nu_mu, nu_tau | Weak force (W, Z) | Beta decay products |
| Gauge bosons (4) | photon, W+/-, Z, gluon | Gauge symmetry | Force carriers |
| Scalar boson (1) | Higgs (H) | BEH mechanism | Mass generation |

*Source: Particle Data Group, Review of Particle Physics (2024) [22]*

Two up quarks and one down quark, composed by the strong force (mediated by gluons), produce a proton with emergent properties (charge +1, mass 938.3 MeV/c^2, spin 1/2) that no individual quark possesses. The proton is a composite module. Atoms are compositions of protons, neutrons, and electrons. Molecules are compositions of atoms. Materials are compositions of molecules. Devices are compositions of materials. Systems are compositions of devices.

The construction set's ten layers trace this compositional chain:
```
Quarks -> Nucleons -> Atoms -> Materials -> Components ->
Circuits -> Computers -> Software -> Networks -> Intelligence
```

Each arrow is a composition operation. Each arrow is also a fidelity boundary where information can be lost. The curriculum makes this entire chain visible, walkable, and measurable [22, 23].

---

## 10. Compositional Design in GSD

The GSD skill-creator is a compositional design system for AI capabilities [24]:

| Construction Set Concept | GSD Implementation |
|---|---|
| Part type | Skill definition (YAML + implementation) |
| Interface contract | Skill activation conditions + output schema |
| Assembly manual | Mission pack (vision -> research -> mission) |
| Sub-assembly | Agent (composed of skills + context) |
| Complete system | Team (composed of agents + orchestrator) |
| Quality control | Verification matrix (test plan) |
| Part catalog | Skills directory (.claude/skills/) |
| Backward compatibility | Skill versioning + chipset compatibility |

**The skill as module:** Each skill has:
- **Activation condition:** When does this skill apply? (analogous to "when does this part connect?")
- **Input specification:** What context does the skill need? (analogous to interface dimensions)
- **Output specification:** What does the skill produce? (analogous to module output)
- **Fidelity metric:** How well does the skill perform its function? (test pass rate, accuracy)

**The mission pack as assembly manual:** A GSD mission pack (vision document -> research reference -> mission specification) is a construction set assembly manual. It specifies: what parts (skills) are needed, how they connect (agent composition), what the build sequence is (wave execution plan), and how to verify the result (test plan). The Infinite and One Construction Set's own mission pack is a self-referential example: a construction set assembly manual that describes a construction set [24].

> **Related:** [GSD2 -- GSD-2 architecture](../GSD2/index.html), [MPC -- Amiga chipset as compositional reference](../MPC/index.html), [ACE -- compute engine as compositional design](../ACE/index.html)

---

## 11. Cross-References

- **ACE (Compute Engine):** Pipeline architecture, parallel composition
- **MPC (Math Co-Processor):** Amiga Principle as compositional theorem
- **GSD2 (GSD Architecture):** Skill-creator compositional design
- **SGM (Signal Geometry):** Signal chain as compositional pipeline
- **BCM (Building):** Building systems as compositional design
- **SPA (Spatial Design):** Spatial composition, arrangement as design
- **OTM (Operator Theory):** Operator composition as mathematical foundation
- **COK (Cooking):** Recipe as compositional template, mise en place as module preparation

---

## 12. Sources

1. Rechtin, E., & Maier, M. W. (2009). *The Art of Systems Architecting* (3rd ed.). CRC Press.
2. Brooks, F. P. (1987). No silver bullet: Essence and accidents of software engineering. *Computer*, 20(4), 10--19.
3. Maher, J. (2018). *The Future Was Here: The Commodore Amiga*. MIT Press.
4. Commodore-Amiga. (1987). *Amiga Hardware Reference Manual* (revised ed.). Addison-Wesley.
5. Amdahl, G. M. (1967). Validity of the single processor approach to achieving large scale computing capabilities. *AFIPS Conference Proceedings*, 30, 483--485.
6. Dijkstra, E. W. (1974). On the role of scientific thought. In *Selected Writings on Computing: A Personal Perspective*. Springer-Verlag.
7. Reenskaug, T. (1979). *Models-Views-Controllers*. Xerox PARC Technical Note.
8. Bezos, J. (2002). Internal mandate (API-first architecture). Documented in Yegge, S. (2011). Google+ platform rant.
9. McIlroy, M. D. (1978). Unix time-sharing system: Foreword. *Bell System Technical Journal*, 57(6), 1899--1904.
10. Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.
11. Alexander, C. (1977). *A Pattern Language: Towns, Buildings, Construction*. Oxford University Press.
12. Bass, L., Clements, P., & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley.
13. ISO. (1994). *ISO/IEC 7498-1: Information Technology -- Open Systems Interconnection -- Basic Reference Model*.
14. Hennessy, J. L., & Patterson, D. A. (2017). *Computer Architecture: A Quantitative Approach* (6th ed.). Morgan Kaufmann.
15. Patterson, D. A., & Hennessy, J. L. (2020). *Computer Organization and Design: RISC-V Edition* (2nd ed.). Morgan Kaufmann.
16. Oppenheim, A. V., & Willsky, A. S. (1997). *Signals and Systems* (2nd ed.). Prentice Hall.
17. Pnueli, A. (1984). In transition from global to modular temporal reasoning about programs. In *Logics and Models of Concurrent Systems*. Springer. NATO ASI Series.
18. Clarke, E. M., Grumberg, O., & Peled, D. A. (2018). *Model Checking* (2nd ed.). MIT Press.
19. NIST. (2024). *NIST Traceability Policy*. nist.gov/traceability
20. Holland, J. H. (1998). *Emergence: From Chaos to Order*. Addison-Wesley.
21. Leveson, N. G., & Turner, C. S. (1993). An investigation of the Therac-25 accidents. *Computer*, 26(7), 18--41.
22. Particle Data Group. (2024). *Review of Particle Physics*. Physical Review D, 110, 030001.
23. CERN. (2022--2025). *LHC Run 3 Technical Documentation*. CERN Document Server.
24. GSD Ecosystem. (2026). *GSD Skill-Creator Architecture*. github.com/Tibsfox/gsd-skill-creator
