# Simulation Progression: From Games to Engineering

*What Minecraft and Factorio taught you about physical infrastructure*

---

## Introduction

If you have spent time in Minecraft building redstone contraptions or in Factorio optimizing your factory's fluid network, you already have stronger intuition for physical infrastructure engineering than most people starting from scratch. This guide makes those connections explicit.

The physical world has rules. Games simulate those rules with simplifications. As you move from Minecraft to Factorio to React simulation tools to professional-grade solvers (OpenFOAM, SPICE), each step removes simplifications and adds accuracy -- but the underlying concepts remain the same. A redstone torch and an industrial relay both implement the same boolean logic. A Factorio pipe and a Schedule 40 steel pipe both obey pressure-driven flow. The difference is precision, not principle.

This document is part of the [Physical Infrastructure Engineering Pack](../skills/) and connects to the [simulation-bridge](../skills/simulation-bridge/SKILL.md) skill for higher-fidelity tools.

---

## Part 1: Redstone to Relay Logic (Electrical Systems)

### 1.1 Logic Gates

You already know how to build logic gates in redstone. Here is how each maps to relay logic -- the technology that powered industrial automation before transistors and still runs safety-critical systems today.

| Redstone Construction | Relay Logic Equivalent | Truth Table Identical? | Notes |
|---|---|---|---|
| Redstone torch (inverts input) | Normally-closed (N/C) relay contact | Yes | Torch off = signal present; N/C relay opens when coil energizes. Both invert. |
| Two torches in sequence (AND) | Series N/C contacts (AND gate) | Yes | Both inputs must be low (torches off) to allow signal through |
| Parallel redstone paths | Parallel contacts (OR gate) | Yes | Either path energizes the output coil |
| Torch on block with two inputs (NOR/XOR) | Cross-coupled relay pair (XOR) | Yes | Two relays wired so only one can energize at a time |
| Comparator in subtract mode | Differential relay | Approximately | Comparator compares signal strengths; differential relay trips on current difference between two windings |
| Piston + redstone block (latching) | Latching relay (bistable) | Yes | Piston extends and holds position = relay latches via holding contact |

**Key insight:** Both redstone AND relay logic use contact state (open/closed, on/off) as the fundamental unit. The difference is Minecraft uses tick-based simulation (1 tick = 100ms); real relays respond in 5-20 milliseconds. The logic is identical.

**Standards reference:** IEC 60617 (international relay logic symbology), NEMA ICS 1 (industrial relay standards). The [power-systems skill](../skills/power-systems/SKILL.md) uses these standards for all relay logic outputs.

### 1.2 Signal Propagation

In Minecraft, a redstone signal travels 15 blocks and decays by 1 signal strength per block. Repeaters restore the signal to full strength (15).

This maps directly to voltage drop in real wiring:

```
V_drop = I x R_per_meter x L
```

Where I is current (amps), R_per_meter is conductor resistance per unit length, and L is wire run distance.

- A **repeater** is a signal amplifier or relay station -- it boosts a degraded signal back to nominal.
- The **15-block limit** is analogous to a voltage drop budget. The NEC limits voltage drop to 3% for branch circuits and 5% total from service entrance to final outlet.
- **Repeater delay** (1-4 ticks in Minecraft) maps to propagation delay in real circuits -- relevant in high-speed digital systems and protective relay coordination.

The voltage drop budget is why long cable runs in data centers use higher voltages (400V DC or 480V AC) -- higher voltage means lower current for the same power, which means less I*R drop per meter.

### 1.3 Power Sources

| Minecraft Source | Real-World Equivalent | Engineering Term |
|---|---|---|
| Redstone block (always on) | DC bus / main power supply | Continuous power source |
| Lever (toggle) | SPDT maintained-contact switch | Manual transfer switch |
| Button (momentary) | Pushbutton, normally-open (NO) | Momentary contact |
| Daylight detector | Photovoltaic cell / photorelay | Solar sensor or light-activated relay |
| Observer (state change) | Edge-triggered relay / PLC input | Rising/falling edge detection |
| Tripwire hook | Limit switch / proximity sensor | Presence detection |

Every Minecraft power source has a direct counterpart in industrial controls. If you have built a daylight-activated door in Minecraft, you understand the concept behind a dusk-to-dawn lighting controller.

---

## Part 2: Factorio Fluid Network to Pipe Network Modeling

### 2.1 Component Equivalences

| Factorio Component | Engineering Equivalent | Key Parameter |
|---|---|---|
| Pipe | Schedule 40 steel pipe (or copper, PVC by application) | Flow capacity (GPM), pressure drop (PSI/100ft) |
| Underground pipe pair | Pipe sleeve / conduit crossing | Maintains pressure boundary through walls/floors |
| Pump | Centrifugal pump | Head-flow curve, best efficiency point (BEP) |
| Storage tank (25,000 units) | Expansion tank / receiver vessel | Volume buffer for pressure stability and thermal expansion |
| Fluid box (building connection) | Process equipment nozzle | Inlet/outlet connection point with defined flow requirement |
| Valve (circuit network controlled) | Motorized control valve | On/off or modulating flow control |
| Offshore pump | Well pump or municipal supply | Source with essentially unlimited head |

### 2.2 Flow Fundamentals

Factorio rule: fluids flow from higher pressure to lower pressure. Pumps add pressure to move fluid against the gradient.

Real engineering: exactly the same. This is Bernoulli's principle:

```
P_1 + (1/2)*rho*v_1^2 + rho*g*h_1 = P_2 + (1/2)*rho*v_2^2 + rho*g*h_2
```

Where P is pressure, rho is fluid density, v is velocity, g is gravity (9.81 m/s^2), and h is elevation.

**What Factorio simplifies away:**
- **Reynolds number** -- Factorio does not model laminar vs. turbulent flow transitions. Real systems at Re > 4000 (virtually all piped water systems) are turbulent.
- **Pipe roughness** -- A Factorio pipe has no friction factor. Real pipes have roughness (epsilon) that increases pressure drop.
- **Viscosity changes** -- Factorio fluids have fixed properties. Real fluids change viscosity with temperature (glycol thickens when cold).

The real-world equivalent of Factorio's simplified flow model is the Darcy-Weisbach equation:

```
delta_P = f * (L/D) * (rho * v^2 / 2)
```

Where f is the Moody friction factor (from Reynolds number and pipe roughness), L is pipe length, and D is internal diameter. The [fluid-systems skill](../skills/fluid-systems/SKILL.md) implements this fully.

### 2.3 Network Loops and Deadlocks

**Factorio problem:** Building loops in pipe networks causes fluid to circulate unpredictably. Experienced players know to use pumps to force direction and avoid mixing fluids in shared pipe segments.

**Real engineering:** The same problem is called "hydraulic short-circuiting." It occurs when flow takes the path of least resistance and bypasses intended equipment. Solutions include:

- **Balancing valves** -- adjustable resistance devices that equalize flow across parallel branches
- **Three-way valves** -- divert flow between two paths (common in heating/cooling systems)
- **Variable frequency drives (VFDs)** on pumps -- modulate pump speed to control flow rate dynamically
- **Check valves** -- prevent reverse flow (the real equivalent of Factorio's one-way pump enforcement)

If you have ever debugged a Factorio fluid system where petroleum gas backed up into your oil refinery, you understand why check valves and dedicated pipe runs exist in real engineering.

### 2.4 The Throughput vs. Pressure Trade-off

**Factorio:** Larger pipes carry more fluid, but Factorio does not model the cost.

**Real engineering:** Bigger pipes give lower velocity and lower pressure drop, but higher capital cost (material, supports, insulation, labor). The engineering sweet spot balances operating cost (pump energy to overcome friction) against capital cost (bigger pipe). Industry guidelines:

- Cooling water: 1.5-3.0 m/s (ASHRAE TC 9.9)
- Steam: 25-35 m/s
- Compressed air: 6-10 m/s

The Darcy-Weisbach equation quantifies this precisely -- doubling pipe diameter reduces friction loss by a factor of 32 (fifth-power relationship with diameter).

---

## Part 3: Progressive Fidelity Path

Each level below removes simplifications and increases accuracy. Use the lowest level that answers your question.

| Level | Tool | Accuracy | When to Use | What It Costs |
|---|---|---|---|---|
| 1 -- Minecraft | Redstone + pistons | Conceptual (boolean) | Learning logic gate composition and signal propagation | Free (you already have the game) |
| 2 -- Factorio | Fluid networks + circuits | Topological (flow paths) | Understanding flow routing, balancing, and throughput limits | Free (you already have the game) |
| 3 -- React Artifact | Interactive browser calculator | +/- 5-10% | Quick feasibility checks, stakeholder demos, parameter exploration | Minutes to build with simulation-bridge skill |
| 4 -- Hand Calculations | Darcy-Weisbach, NEC tables | +/- 3-5% | Engineering design, code compliance verification | The Physical Infrastructure skills automate this |
| 5 -- OpenFOAM / ngspice | CFD / SPICE circuit simulation | +/- 1-2% | Complex 3D geometry, detailed transient analysis, regulatory evidence | Hours of setup; requires local solver installation |
| 6 -- Physical Prototype | Real hardware, real measurements | Ground truth | Final verification before construction | Thousands to millions of dollars |

**Guidance by purpose:**
- **Levels 1-2:** Conceptual understanding and teaching. If you can build it in a game, you understand the topology.
- **Level 3:** Client presentations, rough scoping, "what if" exploration. The [simulation-bridge skill](../skills/simulation-bridge/SKILL.md) generates these.
- **Level 4:** Engineering design -- this is what the Physical Infrastructure skills produce. Accurate enough for construction documents.
- **Levels 5-6:** High-stakes designs where turbulence, transients, or complex geometry matter. Simulation bridge generates the input files; you run the solver.

The jump from Level 2 to Level 3 is where game intuition becomes engineering tool. The jump from Level 4 to Level 5 is where hand calculations become computational fluid dynamics. Most practical engineering lives at Level 4.

---

## Part 4: Interactive Artifact -- Redstone to Relay Translator

This section describes the "Redstone to Relay" interactive artifact for reference by the simulator-agent when generating React artifacts.

**Purpose:** Translate a user's description of a Minecraft redstone circuit into an equivalent relay logic diagram using standard IEC 60617 symbology.

**Input:** User describes a redstone circuit in natural language or provides a structured circuit description listing components and connections.

**Output:** Equivalent relay ladder logic diagram in IEC 60617 / ISA-5.1 notation.

**Mapping engine (4-step process):**

1. **Parse** -- extract redstone components from the description (torches, repeaters, comparators, pistons, levers, buttons, observers)
2. **Translate** -- apply the truth table equivalence table from Section 1.1 to convert each component to its relay equivalent
3. **Generate** -- produce relay ladder diagram notation with standard rung structure (L1 power rail, contacts in series/parallel, output coil on R1 rail)
4. **Label** -- annotate with IEC 60617 symbol codes and wire/contact designators

**Example translation:**

- **Redstone input:** "Two levers in parallel feeding a redstone torch, output to a piston"
- **Translation:** Lever = maintained switch (SPDT). Parallel = OR gate. Torch = N/C inverter. Piston = latching contactor.
- **Relay output:** L1 -- [S1 parallel S2] -- [N/C contact K1] -- (K2 latching coil) -- L2

The artifact template lives in `skills/physical-infrastructure/simulation-bridge/references/artifact-templates/redstone-relay-translator/`. The [simulation-bridge skill](../skills/simulation-bridge/SKILL.md) provides the React artifact generation infrastructure.

---

## Further Reading

- [`skills/physical-infrastructure/power-systems/SKILL.md`](../skills/power-systems/SKILL.md) -- Relay logic in industrial power systems, NEC conductor sizing
- [`skills/physical-infrastructure/fluid-systems/SKILL.md`](../skills/fluid-systems/SKILL.md) -- Pipe network modeling, Darcy-Weisbach, pump curves
- [`skills/physical-infrastructure/simulation-bridge/SKILL.md`](../skills/simulation-bridge/SKILL.md) -- OpenFOAM, ngspice, React artifact generation tools
- [`educational/math-connections.md`](./math-connections.md) -- Mathematical foundations behind these engineering concepts
