# v1.29 — Electronics Educational Pack

**Released:** 2026-02-21
**Scope:** feature milestone — engineering-education pack covering circuits, digital logic, DSP, PLC, solar, sensors, microcontrollers, and PCB design under a single chipset with a safety warden and three-level learn mode
**Branch:** dev → main
**Tag:** v1.29 (2026-02-21T05:48:13-08:00) — "Electronics Educational Pack"
**Predecessor:** v1.28 — GSD Den Operations
**Successor:** v1.30 — Vision-to-Mission Pipeline
**Classification:** milestone — first full curriculum pack riding on top of the MNA circuit simulator
**Phases:** 262-278 (17 phases) · **Plans:** 39 · **Requirements:** 95
**Commits:** `f119d65ad..caba7edc3` (92 commits, 18 files changed in the v1.29~5..v1.29 tip window)
**Tests:** 10,707 project-wide · 1,359 inside `src/electronics-pack/` at phase 278
**LOC:** ~29K added across simulator engines, domain engines, module content, labs, and assessments
**Verification:** MNA engine DC + AC + transient analysis cross-checked against 10 reference circuits · 4-bit ripple-carry adder validated exhaustively across all 256 input combinations · 5 PLC labs and 5 PCB labs each backed by `verify()` functions on their respective engines · content-quality suite (112 tests) enforced word counts, H&H citations, and LabStep structure across every module

## Summary

**v1.29 shipped a real circuit simulator, not a calculator.** The MNA (Modified Nodal Analysis) engine at `src/electronics-pack/simulator/mna-engine.ts` performs DC, AC, and transient analysis using Newton-Raphson iteration for nonlinear devices and Gaussian elimination with partial pivoting on the system matrix. Seven component models land in this release — resistor, capacitor, inductor, diode, BJT (Ebers-Moll simplified), MOSFET, op-amp, plus a voltage regulator companion — with each contributing standard MNA stamps to the matrix. Transient analysis uses Backward Euler companion models for capacitors and inductors, the textbook choice for A-stability at the cost of some damping. Ten reference circuit definitions under `src/electronics-pack/simulator/reference-circuits.ts` exercise the engine through voltage dividers, RC filters, diode limiters, common-emitter amplifiers, and op-amp inverting configurations, and every reference circuit ships with an expected-voltage table that the test suite diffs against actual solver output. The stamp logging mode is the pedagogical hook: every component's contribution to the MNA matrix can be printed in sequence, which turns a black-box solver into a teaching tool that shows students *how* the matrix gets built, not just what falls out of it.

**The digital logic simulator is the circuit simulator's categorical twin.** Phases 265-267 built `src/electronics-pack/simulator/logic-simulator.ts`, an event-driven gate-level simulator covering eight gate types (AND, OR, NOT, NAND, NOR, XOR, XNOR, BUF) with propagation-delay modeling and CMOS internal structure for each gate. Truth-table generation is automatic for any combinational circuit, and ASCII timing diagrams render waveforms with propagation delay so students can read a signal race or a hazard off the page. The sequential-logic layer added SR, D, JK, and T flip-flops with clock-edge detection, oscillation detection on feedback loops, and a 4-bit ripple-carry adder that the test harness validates exhaustively — all 256 input combinations, full-coverage — because 4 bits is small enough that exhaustive testing is free and large enough that every carry-chain interaction gets exercised. Extrapolating correctness to wider adders relies on the same gate primitives, so the 4-bit exhaustion covers the foundational claim.

**The Safety Warden is architectural, not decorative.** Phase 268 built `src/electronics-pack/safety/warden-core.ts` with three operating modes (annotate, gate, redirect) and voltage-tier classification per IEC 60449. In annotate mode the warden adds informational callouts; in gate mode it blocks access until acknowledgement; in redirect mode it steers the user to safer content. The critical design choice is that mode escalation is voltage-driven, not user-driven — the user cannot disable gate mode for high-voltage content like mains wiring or capacitor-bank discharge topics. Eight prohibited words are enforced at content-authoring time, and the warden ships with positive-framing assertions so safety messaging teaches rather than frightens. Professional context detection prevents gate mode from blocking expert users unnecessarily, which mattered for the PLC and off-grid power modules where practicing engineers are part of the target audience.

**Learn Mode gave every topic three depths.** Phase 269 shipped `src/electronics-pack/learn/engine.ts` with a three-level content system: L1 for practical (hands-on lab-friendly prose), L2 for reference (datasheet-style summaries with equations), and L3 for mathematical (full derivation with H&H — Horowitz and Hill, *The Art of Electronics* — citations). Every one of the 15 module content files carries depth markers so the sidebar UI component can filter the view down to the reader's current level. The H&H citation lookup is the load-bearing library reference for L3 depth, and the decision to anchor on a single canonical textbook gave the curriculum a consistent authority trail rather than a scattered citation graph.

**Fifteen modules cover four tiers of an engineering curriculum.** Tier 1 (Circuits, Passives, Signals) establishes Ohm's law, Thevenin/Norton equivalents, RLC impedance, and signal representation; Tier 2 (Diodes, Transistors, Op-Amps, Power) covers PN junction physics, Ebers-Moll for BJTs, small-signal MOSFET models, op-amp topologies, and linear/switching power supplies; Tier 3 (Logic Gates, Sequential Logic, Data Conversion, DSP) moves into digital with CMOS gates, flip-flops, ADC/DAC conversion, and FFT/FIR filtering; Tier 4 (Microcontrollers, Sensors, PLC, Off-Grid Power, PCB Design) closes with MCU peripherals, sensor conditioning, ladder-logic PLC programming, photovoltaic systems with MPPT, and PCB layout including trace-width calculation and DRC. Each module ships content, labs, and an assessment with detailed answer keys, all under `src/electronics-pack/modules/<NN>-<slug>/`. Seventy-seven interactive labs total, structured as LabStep records (title, description, `verify()` function, expected outcome) so labs can be programmatically validated, sequenced, and tracked across sessions.

**Five specialized engines run the domain-specific labs.** DSP (`src/electronics-pack/engines/dsp.ts`) wraps FFT, FIR filter design, convolution, and quantization; GPIO (`src/electronics-pack/engines/gpio.ts`) simulates UART, SPI, I2C, PWM, ADC, and hardware timers, filling the gap between a circuit simulator and a microcontroller emulator; PLC (`src/electronics-pack/engines/plc.ts`) runs a ladder-logic scan-cycle simulator with PID control, Modbus communication, and safety-interlock evaluation, citing IEC 61131-3 throughout; Solar (`src/electronics-pack/engines/solar.ts`) implements the single-diode PV model, three MPPT algorithms (perturb-and-observe, incremental conductance, constant-voltage), battery simulation, and inverter modeling; PCB (`src/electronics-pack/engines/pcb-layout.ts`) performs impedance calculation for controlled-impedance traces, design-rule checking, EMI analysis, trace routing, and Gerber output. Each engine is accessed through labs that call its `verify()` function to turn "did the student get the right answer" into an executable predicate, not an essay grade.

**Integration testing closed the pack.** Phase 278 added a 24-case integration suite (`src/electronics-pack/__tests__/integration.test.ts`) exercising the MNA engine, logic simulator, safety-warden mode transitions, learn-mode citation lookup, chipset routing, and all 16 modules' loadability. A 112-case content-quality suite (`src/electronics-pack/__tests__/content-quality.test.ts`) enforces per-module word counts, H&H citation presence, LabStep structure uniformity, and assessment-question-count-plus-answer-key completeness. Total pack test count at v1.29 tip: 1,359 inside `src/electronics-pack/` (up from roughly zero at v1.28) and 10,707 project-wide. Zero regressions on the broader suite after each phase landed.

**The scope was deliberately large.** Seventeen phases in a single minor version — circuit simulator (phases 262-265), logic simulator (265-267), safety warden (266), learn mode (267-268), 15 modules (268-273), five specialized engines (273-277), and integration (277-278) — is the biggest educational-content release in the project's history. The breadth is the feature: a pack that covers analog, digital, DSP, industrial control, photovoltaic, and PCB under one chipset lets a curriculum flow across domains that are typically siloed in university coursework. The trade-off is that per-engine depth varies — the MNA engine is textbook-complete, the DSP engine is a wrapper around a small set of primitives, and the PLC engine is a simulator rather than a real IEC 61131-3 conformance suite. Readers should treat the pack as a teaching scaffold, not an industrial-grade toolchain.

## Key Features

| Area | What Shipped |
|------|--------------|
| MNA engine core (Phase 263-01) | DC analysis with stamp-based matrix construction, Gaussian elimination with partial pivoting, educational stamp logging; `src/electronics-pack/simulator/mna-engine.ts` |
| MNA nonlinear + AC (Phase 263-02) | Diode model (Shockley equation), Newton-Raphson iteration, AC small-signal analysis |
| MNA transient (Phase 263-03) | Backward Euler companion models for C and L, circuit file format, time-step integrator |
| Measurement instruments (Phase 264) | Voltmeter, ammeter, oscilloscope, FFT, windowing, spectrum analyzer; 10 reference circuits validated end-to-end |
| BJT + MOSFET + op-amp + regulator models (Phases 269-01, 270-01) | Ebers-Moll simplified BJT, MOSFET square-law stamps, ideal op-amp with finite gain, linear regulator; full MNA integration |
| Logic simulator core (Phase 265-01) | 8 gates (AND/OR/NOT/NAND/NOR/XOR/XNOR/BUF), step and evaluate modes, oscillation detection, CMOS internals |
| Truth tables + timing (Phase 265-02) | Automatic truth-table generation, ASCII timing diagrams with propagation delay |
| Sequential logic (Phase 265-03) | SR/D/JK/T flip-flops, clock-edge detection, 4-bit ripple-carry adder exhaustively verified (256 combinations) |
| Safety Warden core (Phase 266-01) | 3 modes (annotate/gate/redirect), IEC 60449 voltage classification, per-mode escalation rules; `src/electronics-pack/safety/warden-core.ts` |
| Warden framing + assessments (Phase 266-02) | Positive framing with 8 prohibited words enforced, professional-context detection, per-module safety assessments |
| Learn Mode engine (Phase 267-01) | 3-depth filtering (L1 practical / L2 reference / L3 mathematical), H&H citation lookup, 15-module depth markers |
| Learn Mode sidebar UI (Phase 267-02) | Sidebar component, content markers populated across all 16 module content files |
| Module 1–3: Circuits / Passives / Signals (Phase 268) | Tier 1 foundational content, labs, assessments under `src/electronics-pack/modules/{01..03}/` |
| Module 4–7: Diodes / Transistors / Op-Amps / Power (Phases 269-03, 270-02, 270-03) | Tier 2 analog semiconductor modules with content, labs, assessments |
| Module 7A–10: Logic / Sequential / Data Conv / DSP (Phases 271-273) | Tier 3 digital modules plus DSP engine wrapping FFT, FIR filters, quantization |
| Module 11–12: MCU + Sensors (Phases 274-02, 274-03) | Microcontroller and sensors/actuators modules with GPIO engine (UART/SPI/I2C/PWM/ADC/timers) |
| Module 13 PLC (Phases 275-01, 275-02) | PLC engine with ladder logic / PID / Modbus / scan cycle; 5 labs (relay-to-ladder, home automation, PID temperature, Modbus, safety interlock); IEC 61131-3 citations |
| Module 14 Off-Grid Power (Phases 276-01, 276-02) | Solar engine with single-diode PV model and 3 MPPT algorithms; battery + inverter simulation |
| Module 15 PCB Design (Phases 277-01, 277-02) | PCB layout tool with DRC, EMI, trace routing, impedance calculation, Gerber output; 5 labs (schematic-to-PCB, trace width, ground plane, EMI, DFM review); 10 topics citing H&H Ch. 12 |
| Integration test suite (Phase 278-01) | 24 integration tests covering MNA engine, logic sim, safety modes, learn mode, chipset routing, module loadability |
| Content-quality suite (Phase 278-01) | 112 tests enforcing word counts, H&H citations, LabStep structure, assessment-question counts, answer-key completeness |
| Type-strictness cleanup (v1.29 tip) | Explicit vitest imports, ArrayBuffer type casts, imported test interfaces, annotated empty arrays across `src/aminet/` and `src/knowledge/` |

## Retrospective

### What Worked

- **MNA circuit simulator with full nonlinear solver.** DC, AC, and transient analysis with Newton-Raphson, Gaussian elimination with partial pivoting, and seven component models (resistor, capacitor, inductor, diode, BJT, MOSFET, op-amp, plus regulator) — this is a real circuit simulator, not a resistor calculator. The stamp logging for educational visibility into matrix construction is the kind of feature that makes it a teaching tool rather than a black box.
- **Safety Warden with architectural enforcement.** Three operating modes (annotate/gate/redirect), IEC 60449 voltage classification for mode escalation, and eight prohibited words. The positive-framing requirement means safety messaging teaches rather than frightens. Professional-context detection prevents gate mode from blocking expert users for the PLC and off-grid-power modules.
- **Seventy-seven interactive labs with structured LabStep format across 15 modules.** The labs span from Ohm's law to PLC ladder logic and PCB Gerber output. The structured format means labs can be programmatically validated, sequenced, and tracked across sessions, and every lab carries a `verify()` predicate so correctness is executable rather than essay-graded.
- **Five specialized engines (DSP, GPIO, PLC, Solar, PCB).** Each is a domain-specific simulator: FFT and FIR filters for DSP; UART/SPI/I2C/PWM/ADC/timers for GPIO; ladder logic and PID control for PLC; MPPT and battery simulation for Solar; impedance calculation and DRC for PCB. This is an engineering-education platform, not a single-topic tutorial.
- **TDD discipline across every phase.** Every `feat(NNN-NN)` commit has a matching `test(NNN-NN)` commit that lands first and fails (RED phase), per the commit log. Phases 262-278 ran the red-green pattern consistently, which is why the 1,359 pack tests arrived with zero regressions against the 10,707 project-wide suite.
- **Exhaustive testing where the state space allows it.** The 4-bit ripple-carry adder's 256-combination exhaustion is the right shape for a logic-simulator correctness claim — small enough to be free, large enough to exercise every carry-chain interaction. The MNA engine's 10 reference circuits play the same role for analog simulation: broad-coverage end-to-end diffs rather than unit-level mocking.

### What Could Be Better

- **Seventeen phases is a large scope for one minor release.** Circuit simulator (4 phases), logic simulator (2 phases), safety warden, learn mode, 15 modules (4 phases), 5 specialized engines (3 phases), and integration (2 phases) in one version is the biggest single release in the project's history. The breadth is impressive but the per-engine depth is uneven — the MNA engine is textbook-complete, the DSP engine is a thin wrapper around a small primitive set, and the PLC engine is a simulator rather than an IEC 61131-3 conformance suite. A future release should pull DSP and PLC into their own depth pass.
- **H&H citation lookup with the 3-level depth system assumes access to *The Art of Electronics*.** The L3 mathematical depth level references Horowitz and Hill directly. Users without the book get citation pointers to content they cannot read. A fallback to freely available references (AllAboutCircuits, MIT OCW, IEEE open-access papers) would improve accessibility without undercutting the primary citation trail.
- **No end-to-end student workflow test.** Integration and content-quality suites validate component correctness, but there is no scenario test that walks a hypothetical student through Module 1 → Module 7 in sequence, verifying that Learn Mode depth switching, Safety Warden mode escalation, and chipset routing all cooperate across a realistic study session. Without that test, silent UX regressions between phases are possible.
- **Chipset routing verification lives inside the integration suite, not as a standalone contract.** The 14-skill, 5-agent chipset at `src/electronics-pack/chipset.yaml` is the entry point for every module, but its contract is implicit in how modules reference it rather than asserted as a separate specification. A future phase should lift chipset routing into a dedicated contract test file.

## Lessons Learned

- **Circuit simulators need stamp logging for educational use.** Showing students how each component contributes to the MNA matrix transforms the simulator from a black box into a teaching tool. The matrix construction process IS the lesson, and a simulator that only prints the answer is a calculator.
- **Safety warden modes should escalate based on voltage classification, not user preference.** IEC 60449 voltage tiers determine whether safety content is annotated (informational) or gated (mandatory). Removing the user's ability to disable safety for high-voltage content is the right default — annotate-only mode for mains wiring would be a foot-gun.
- **Exhaustive testing at small scale is the right strategy for combinational-logic verification.** The 4-bit ripple-carry adder's 256-combination exhaustion catches every carry-chain edge case. Extrapolating correctness to wider adders relies on the same gate primitives, so the 4-bit verification covers the foundation — and the cost is near-zero because 2^4 is trivial.
- **PLC scan-cycle simulation bridges industrial and educational computing.** Ladder logic, Modbus, and PID control are rarely taught alongside digital logic and DSP. Including them in the same curriculum shows that computing isn't just software — it's also the control systems that run physical infrastructure. The IEC 61131-3 citation anchor keeps the content defensibly aligned with the industry standard.
- **TDD commit pairing makes a 92-commit release auditable.** Every `feat(NNN-NN)` has a matching `test(NNN-NN)` that lands first. Reading the commit log is equivalent to reading a phase-by-phase red-green protocol, which made reviewing the release an act of walking the log rather than excavating code. Future large releases should preserve this convention.
- **`verify()` functions turn labs from prose into predicates.** Every lab in the 77-lab catalog ships with a `verify()` predicate that calls into the relevant engine. This makes lab correctness executable — a student's answer either passes the predicate or does not — and means lab grading can be automated end-to-end rather than essay-based. It also gives the content-quality suite a hook to assert that every lab has a verify function, a structural property that would have been invisible in a prose-only curriculum.
- **Anchoring citations on a single canonical textbook keeps the depth system coherent.** Horowitz and Hill's *The Art of Electronics* is the L3 anchor across all 15 modules. A scattered citation graph would have forced every reader to navigate a different reference per topic; one canonical source gives a single-library study trail at the cost of accessibility for readers without the book.
- **Separating domain engines from module content is the right layering.** The MNA engine, logic simulator, DSP engine, GPIO simulator, PLC engine, solar engine, and PCB layout tool each live in `src/electronics-pack/simulator/` or `engines/`, while per-module content/labs/assessments live in `src/electronics-pack/modules/<NN>-<slug>/`. This means a future update to, say, the PCB engine does not force a rewrite of the Module 15 content — the content depends on the engine's API, not its internals. This is the same layering the Learn Mode engine already assumed when it put depth markers in content files rather than hard-coding them into the engine.
- **Content-quality tests catch the drift prose reviews miss.** The 112-test content-quality suite asserts word counts, citation presence, LabStep structure uniformity, and assessment-question counts. None of these are correctness properties in the usual sense, but all of them prevent slow rot — a reviewer is unlikely to notice that Module 11 has drifted from 2,400 words to 1,100 over three edits, but a word-count assertion fires immediately. Curriculum content needs structural tests as much as code does.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.28](../v1.28/) | Predecessor — GSD Den Operations shipped the filesystem message bus and staff topology that the electronics pack's chipset registry depends on |
| [v1.30](../v1.30/) | Successor — Vision-to-Mission Pipeline; the electronics pack was one of the proving grounds for the mission-generation pattern that v1.30 formalized |
| [v1.25](../v1.25/) | Ecosystem Integration — the 20-node dependency DAG defines where `electronics-pack` sits in the tiered architecture (Educational tier, inherits from Core + Middleware) |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — the 35-pack substrate that established the pack-authoring conventions Electronics Pack extends |
| [v1.33](../v1.33/) | GSD OpenStack — later milestone that reused the chipset-with-safety-warden shape (ASIC chipset, NASA SE methodology) |
| [v1.34](../v1.34/) | Documentation Ecosystem — canonical docs spine that later ingested the electronics-pack module content as reference material |
| [v1.36](../v1.36/) | Citation Management — the six-adapter bibliography resolver that turned H&H citations into machine-checkable references |
| `src/electronics-pack/` | Root of the pack — simulator engines, domain engines, modules, safety warden, learn mode |
| `src/electronics-pack/simulator/mna-engine.ts` | Core MNA solver (phases 263-01 through 263-03) |
| `src/electronics-pack/simulator/logic-simulator.ts` | Event-driven gate-level simulator (phases 265-01 through 265-03) |
| `src/electronics-pack/safety/warden-core.ts` | Safety Warden with 3 modes + IEC 60449 tiers (phase 266-01) |
| `src/electronics-pack/learn/engine.ts` | Learn Mode with 3-depth filtering and H&H citation lookup (phase 267-01) |
| `src/electronics-pack/chipset.yaml` | 14-skill, 5-agent chipset definition — pack entry point (phase 262-02) |
| `src/electronics-pack/__tests__/integration.test.ts` | 24 integration tests (phase 278-01) |
| `src/electronics-pack/__tests__/content-quality.test.ts` | 112 content-quality tests (phase 278-01) |
| `.planning/MILESTONES.md` | Canonical milestone detail referenced from the v1.29 tag message |
| `docs/release-notes/v1.29/chapter/` | Chapter files: 00-summary, 03-retrospective, 04-lessons, 99-context |
| Horowitz & Hill, *The Art of Electronics* (3rd ed.) | Canonical L3 citation anchor across all 15 modules |
| IEC 60449 | Voltage classification standard driving Safety Warden mode escalation |
| IEC 61131-3 | PLC programming-languages standard cited throughout Module 13 content |

## Engine Position

v1.29 sits between v1.28's den-operations infrastructure and v1.30's vision-to-mission pipeline, and it is the first release where a full-curriculum educational pack rides on top of the project's ecosystem rather than being a standalone toy. The pack depends on the v1.25 four-tier architecture (Educational tier, inherits from Core and Middleware) for its dependency discipline, on the v1.27 foundational-packs substrate for its authoring conventions, and on the v1.28 message-bus topology for its chipset wiring. v1.29 is also the first release where the Safety Warden pattern — architectural enforcement of a non-negotiable constraint — ships in a user-facing form; later releases (v1.33 GSD OpenStack, v1.38 SSH Agent Security) reused the same shape for domain-specific safety surfaces. The MNA engine and logic simulator are load-bearing dependencies for every subsequent electronics-related skill; no later release replaces them. The pack's 77 labs and 15 modules make it the largest single educational surface in the project, and that position is preserved through the v1.49.x series — every later knowledge pack is smaller and more focused.

## Files

- `src/electronics-pack/simulator/mna-engine.ts` — core Modified Nodal Analysis engine (DC/AC/transient, Newton-Raphson, Gaussian elimination)
- `src/electronics-pack/simulator/logic-simulator.ts` — event-driven gate-level simulator with 8 gate types and CMOS internals
- `src/electronics-pack/simulator/reference-circuits.ts` — 10 end-to-end reference circuits validating the MNA engine
- `src/electronics-pack/safety/warden-core.ts` — Safety Warden with 3 operating modes and IEC 60449 voltage tiers
- `src/electronics-pack/learn/engine.ts` — Learn Mode engine with 3-depth filtering and H&H citation lookup
- `src/electronics-pack/learn/sidebar.ts` — Learn Mode sidebar UI component with depth toggles
- `src/electronics-pack/engines/dsp.ts` — DSP engine (FFT, FIR, convolution, quantization)
- `src/electronics-pack/engines/gpio.ts` — GPIO simulator (UART/SPI/I2C/PWM/ADC/timers)
- `src/electronics-pack/engines/plc.ts` — PLC engine with ladder logic, PID, Modbus, scan cycle
- `src/electronics-pack/engines/solar.ts` — Solar engine with single-diode PV model and 3 MPPT algorithms
- `src/electronics-pack/engines/pcb-layout.ts` — PCB layout tool with DRC, EMI, trace routing, Gerber output
- `src/electronics-pack/modules/{01..15}-<slug>/` — 15 module directories, each with content.md, labs.ts, assessment.md
- `src/electronics-pack/chipset.yaml` — 14-skill, 5-agent chipset registration
- `src/electronics-pack/__tests__/integration.test.ts` — 24 integration tests
- `src/electronics-pack/__tests__/content-quality.test.ts` — 112 content-quality tests
- `src/electronics-pack/__tests__/module-13-plc.test.ts` — 19 PLC lab tests (tip-window file)
- `docs/release-notes/v1.29/README.md` — this document
- `docs/release-notes/v1.29/chapter/` — chapter-level breakout (summary, retrospective, lessons, context)
- `.planning/MILESTONES.md` — canonical milestone ledger
