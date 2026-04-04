# Session 7 Batch 3 — College Mappings & Try Sessions

**Date:** 2026-04-04 | **Sources:** CppCon, NASA, Geothermal, IoT Security, PLM/AI

## Video -> Department -> Topic Mappings

### CppCon: First Principles C++ (Safety-Critical)
| Department | Topic | Level |
|-----------|-------|-------|
| coding | Visitor Design Pattern — double dispatch | 300 |
| coding | DO-178B Software Criticality Levels (A-E) | 300 |
| engineering | Safety-Critical C++ — avionics/automotive | 300 |
| logic | Separation of Concerns via design patterns | 200 |
| critical-thinking | C++ Version Migration in regulated environments | 300 |

### NASA: Microgravity Research
| Department | Topic | Level |
|-----------|-------|-------|
| physics | Microgravity vs Zero Gravity — continuous freefall | 100 |
| science | Bubble behavior in microgravity (no buoyancy) | 200 |
| astronomy | ISS orbital mechanics and gravity at altitude | 200 |
| engineering | Ground validation via rotation testing | 200 |
| problem-solving | Containment solutions: glovebox, Velcro, fans | 200 |

### Geothermal: Dandelion Energy
| Department | Topic | Level |
|-----------|-------|-------|
| environmental | Ground-source vs Air-source Heat Pumps | 200 |
| physics | COP — Coefficient of Performance | 200 |
| economics | Behavioral Science for Energy Savings (Opower) | 300 |
| engineering | Residential Geothermal Installation | 300 |
| psychology | Normative Comparison and Energy Behavior | 200 |
| data-science | Smart Meter Disaggregation — isolating heating/cooling/EV loads | 300 |

### IoT Security: Beau Woods
| Department | Topic | Level |
|-----------|-------|-------|
| technology | IoT vs IT — physical consequences | 200 |
| electronics | Hardware Attack Surfaces | 300 |
| engineering | Security-by-Design vs Retrofit | 200 |
| digital-literacy | Consumer IoT Device Audit | 100 |
| critical-thinking | Adversarial Mindset — targeting physical harm | 300 |
| coding | Input Validation for Physical Actuators | 300 |

### PLM/AI: Generative Design
| Department | Topic | Level |
|-----------|-------|-------|
| engineering | Topology Optimization for Manufacturability | 400 |
| mathematics | Structural Optimization — applied math foundations | 400 |
| physics | Electromagnetic Simulation (Maxwell's equations) | 400 |
| coding | AI-Assisted vs AI-Generated (slop vs productivity) | 200 |
| business | SBIR Grants — AI for technical writing | 200 |

## New DIY Try Sessions (15)

### Engineering / Safety-Critical
1. **Visitor Pattern Lab** — Shape hierarchy in C++, add serialize() via Visitor without modifying base class
2. **DO-178B Criticality Audit** — Arduino motor controller, classify each function by failure consequence
3. **C++ Migration Plan** — C++14 raw pointers to C++17 smart pointers, document safety deliberation

### Space Science
4. **Desktop Clinostat** — DC motor + petri dish simulating low-gravity for plant seedling growth
5. **Bubble Behavior** — Sealed syringe with trapped air, observe gravity vs orientation effects
6. **Convection Absence** — Yeast fermentation in sealed jar, flat vs upright, measure CO2 as circulation proxy

### Energy / Geothermal
7. **Heat Pump COP Calculator** — Spreadsheet comparing air-source vs ground-source across temperature range
8. **Normative Comparison Experiment** — Mini Opower: energy reports for half of participants, measure savings
9. **Ground Temperature Logger** — Bury sensor at 1/3/6 ft depth, chart temperature stability over weeks

### IoT Security
10. **IoT Threat Model** — Consumer device STRIDE analysis, score physical vs data consequences
11. **Motor Controller Safety Lab** — Arduino DC motor, send out-of-range values with/without input validation
12. **Long-Lifetime Device Audit** — Inventory home IoT, calculate "unpatched device-years"

### Generative Design / PLM
13. **Topology Optimization** — Free tool (Fusion 360 / topy), design a bracket, compare AI vs hand-designed
14. **EM Simulation Intro** — OpenEMS or MEEP, simulate dipole antenna, compare to analytical formula
15. **AI Writing Benchmark** — Technical spec via 3 methods: pure LLM / stream-of-consciousness cleanup / outline-first, score each

## Rosetta Cluster Assignments

| Source | Primary Cluster | Secondary |
|--------|----------------|-----------|
| CppCon First Principles | AI & Computation | Electronics |
| NASA Zero Gravity | Space | Science |
| Geothermal Breakthrough | Energy | Infrastructure |
| IoT Hacking | Electronics | Infrastructure |
| PLM/AI Generative Design | AI & Computation | Science, Business |

## Running Totals (Session 7)

| Metric | Count |
|--------|-------|
| Videos analyzed | 17 |
| Repos scanned | 10 |
| College topics mapped | 72 |
| Study guide topics | 59 + 20 + 24 + 15 = 118 |
| DIY try sessions | 22 + 15 = 37 |
| Rosetta templates | 5 + 5 cross-domain tables |
| Research pages created | 13 |
| New TypeScript modules | 2 (65 tests) |
| Harness invariants added | 10 (7 implemented + 10 proposed) |
| Forest sim enhancements | Enhanced Kuramoto (adaptive coupling, order parameter, spectral) |
