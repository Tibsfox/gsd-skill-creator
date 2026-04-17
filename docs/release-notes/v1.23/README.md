# v1.23 — Project AMIGA

**Released:** 2026-02-19
**Scope:** milestone — AMIGA mission infrastructure (MC-1 / ME-1 / CE-1 / GL-1), Apollo AGC Block II simulator with DSKY, curriculum, and tools, plus the RFC Reference Skill
**Branch:** dev → main
**Tag:** v1.23 (2026-02-18T22:14:18-08:00) — "Project AMIGA"
**Predecessor:** v1.22 — Minecraft Knowledge World
**Successor:** v1.24 — GSD Conformance Audit
**Classification:** milestone — operational backbone + first educational content packs for GSD-OS
**Phases:** 199-222 (24 phases) · **Plans:** 74 · **Requirements:** 99
**Commits:** `3333d2339..34b690674` (146 commits across 207 files, +61,053 / -265 lines)
**Tests:** 2,164 passing across 74 plans — 54-test AGC validation suite covering all 38 instructions, 33 AGC pack integration tests, 21 curriculum runner tests, 20 curriculum-programs tests
**Verification:** end-to-end meta-mission harness produces a skill package · 4-component AMIGA controller composes MC-1/ME-1/CE-1/GL-1 via typed ICDs · Luminary rope boot loader verified · 1202 alarm reproduced in capstone exercise · yaYUL-compatible assembler round-trips through disassembler

## Summary

**v1.23 is the release where GSD-OS grew both an operational backbone and a curriculum.** Three workstreams shipped in parallel under one milestone tag: the four-component AMIGA mission infrastructure (phases 199-208), the Apollo Guidance Computer Block II simulator with its development tools, DSKY interface, executive monitor, and 11-chapter curriculum (phases 213-221), and the RFC Reference Skill (phase 222). Together they account for 146 commits, 207 changed files, roughly 61,000 net new lines, and 2,164 tests — the highest test density the project had shipped at that point. The tag message frames the release as "the operational backbone and first educational content packs for the GSD-OS platform," and the shape of the diff bears that out. MC-1 is the control surface, ME-1 is the execution environment, CE-1 is the attribution and dividend engine, GL-1 is the policy layer; the Apollo AGC work is the first concrete proof that the platform can host a real educational pack end-to-end, not just carry the idea of one.

**The AMIGA four-component architecture is the load-bearing abstraction for every later mission.** MC-1 (Mission Control) ships a dashboard with an 8-command parser, a 3-tier alert system (info/warning/critical), and Go/No-Go gates that humans flip to advance phase transitions — the human-in-the-loop property is built in at the architecture level, not glued on. ME-1 (Mission Environment) ships an environment provisioner, a phase engine, a swarm coordinator that runs parallel agent execution, and an archive writer that produces immutable mission records. CE-1 (Commons Engine) ships an attribution ledger that tracks every contribution, a weighting engine with configurable factors, and a dividend calculator that distributes resources according to the ledger. GL-1 (Governance Layer) ships a commons charter definition, a rules engine that enforces the charter, and a policy query interface. The four components talk through 4 typed Inter-Component Definitions (ICDs), and the full-stack controller composes them into one object. The end-to-end meta-mission harness proves the composition works by running a real mission that produces a skill package as output. This is the pattern that every mission from v1.23 forward inherits — there is no parallel track.

**The Apollo AGC Block II simulator is not a toy and every fidelity claim is load-bearing.** The CPU emulation covers 38 instructions across arithmetic, logic, control flow, I/O, and special operations. The ALU uses ones' complement with an iterative end-around carry — the same representation the real Block II hardware used, not two's complement with a coercion layer. Memory is bank-switched: EBANK holds 8 banks × 256 words of erasable memory, FBANK holds 32 banks × 1,024 words of fixed memory, and the superbank extension is present. The interrupt system exposes 10 vectors with priority resolution and inhibit/enable control. 512 I/O channels carry peripheral communication. The timing model runs at 2.048 MHz with memory-cycle-time accuracy. The 54-test validation suite in phase 219-04 (commit `d431861d8`) covers every one of the 38 instructions; a counter-overflow fix in the same commit caught a real bug the fidelity level made visible. The Luminary rope image boot test in phase 219-05 (commit `28ccc8723`) runs an actual Apollo program binary through the rope loader and verifies the simulator reaches a known state — the strongest assertion of fidelity the project can make without a physical AGC to compare against.

**Executive, Waitlist, and BAILOUT map directly onto modern scheduling primitives.** Phase 216 shipped the three pieces that turn the AGC simulator from a CPU into an operating system. The Executive is a priority-based cooperative scheduler with 8 core sets — each core set is a register save area, the AGC-era form of what a modern OS calls a thread context. The Waitlist is a timer-driven task queue with 9 entries and centisecond dispatch resolution, the AGC-era form of a timer wheel. BAILOUT is the restart-protection mechanism that reacts to program alarm codes; phase 216 reproduces the Apollo 11 1202 alarm scenario in software. These three primitives together are the same shape as priority-scheduled cooperative threading, timer-driven dispatch, and fault-tolerant restart that appear in every modern real-time kernel. The AGC shipped them in 36K words of rope memory in 1969; v1.23 reproduces them in TypeScript with enough fidelity that the 1202 alarm surfaces in the curriculum capstone exercise as the intended outcome, not an accident.

**DSKY and the Executive Monitor are the visible surface of AGC fidelity.** Phases 217 and 218 shipped the DSKY interface — the authentic display model decodes electroluminescent relay signals, the 6 data registers and 11 annunciator indicators render the same way the crew saw them in flight, and the 19-key keyboard exposes PRO, KEY REL, VERB, NOUN, +, -, 0-9, CLR, and ENTR in their original layout. The VERB/NOUN command processor routes commands to program-specific handlers. The Executive Monitor is the glass-box counterpart — a real-time visualization of scheduler state, core set allocation, and waitlist queue that lets a curriculum student watch the Executive and Waitlist work in real time. Phase 218-03 added the learn mode (commit `a96cb50b6`), 12 AGC-concept annotations that map each AGC primitive onto modern computing and GSD platform patterns; this is the pedagogical bridge that connects the simulator's authenticity to the student's existing mental models without collapsing the AGC into a simple analogy.

**AGC development tools make the simulator programmable, not just executable.** Phase 219 shipped four tools. The yaYUL-compatible assembler parses AGC assembly source into binary — yaYUL-compatible meaning it accepts the same source format as the reference open-source AGC assembler, so real Apollo-era source files can be assembled through v1.23's toolchain. The step debugger supports breakpoints, watchpoints, register inspection, and memory dumps — commit `f478670d7` landed the debugger, `4a01bf967` wired it into the tools barrel. The disassembler converts binary back to readable assembly. The rope loader reads Virtual AGC binary format, which is the format real Apollo program images (Luminary, Colossus, Comanche) are archived in; commit `f3fc5a226` added it and `28ccc8723` verified it against a Luminary boot test. The 54-test AGC validation suite (commit `d431861d8`) ties the whole tools track together — every instruction assembled, executed, and checked, with a counter-overflow regression caught in the process.

**The AGC curriculum is 11 chapters, 8 exercises, 8 bare-metal programs, and a 1202 capstone.** Phase 221 shipped the curriculum in three commits. The foundation chapters (orientation, hardware, ISA, assembly, Executive/Waitlist, DSKY) landed in commit `58cd6218f` along with the curriculum framework, runner infrastructure, and 21 runner tests. The advanced chapters (interpreter double-precision VM, guidance programs P63/P64/P66, BAILOUT failsafe, Apollo 11 story, AGC-to-GSD pattern mapping) landed in `50efbd10b` along with four beginner/intermediate exercises and the first four assembly starter programs. The final commit `0f5473452` added exercises 5-8 (scheduler, priority preemption, restart, capstone 1202), four more programs, and a 20-test curriculum-programs validation suite. The capstone exercise reproduces the 1202 alarm scenario from Apollo 11's descent — a student writes an AGC program that intentionally overflows the Executive's core set allocation, and the Executive's BAILOUT protection fires with the 1202 alarm code exactly as it did during Eagle's descent. The capstone is the single scenario that ties number systems, memory, instructions, Executive scheduling, Waitlist timing, DSKY, interrupts, and I/O together; without it, the 11 chapters are disconnected knowledge.

**The RFC Reference Skill is a 3-agent pipeline with a curated index, not a scraper.** Phase 222 shipped the RFC Reference Skill as four sub-plans. 222-01 (commit `38f7ac9bf`) defined the AGC block definitions and pack type system. 222-02 (commit `7f66489bd`) added the AGC chipset configuration, rope loader, and pack manifest. 222-03 (commit `9501952bc`) added 6 AGC dashboard widgets with pure render functions. 222-04 (commit `d52da7ddf`) wired the pack barrel, updated the AGC index, and added 33 integration tests verifying all 5 AGCI requirements end-to-end — block-to-widget wiring, chipset YAML structure, and standalone operation. The RFC skill itself runs three agents in sequence: Retriever performs HTTP fetching with caching, Analyzer does cross-reference and dependency mapping, and Citation Builder produces formatted output. The built-in 57-RFC index covers 9 protocol families (HTTP, TLS, DNS, TCP/IP, SMTP, and more) with obsolescence awareness — a reference to an obsoleted RFC surfaces the current RFC as well. Multi-format output ships Markdown, JSON, and BibTeX. The RFC Collection Pack scaffold is the distributable-reference-material template that later educational packs extend.

**Scope honesty: 24 phases is the largest release in the v1.x line before the v1.49 consolidation.** Ten phases for mission infrastructure, eight for the AGC simulator, three for the AGC curriculum, one for the RFC skill, and supporting phases throughout. A smaller engineering team would have split this into three releases; v1.23 consolidated because the three workstreams validated each other — AMIGA as the mission framework, the AGC pack as the first pack that runs through AMIGA, and the RFC skill as the reference-material template the AGC pack's documentation chapters draw from. The trade-off is scope discipline: the release boundary is coherent at the "operational backbone + first content packs" level, but readers looking for a single-feature release in the changelog will find the summary dense. Every later mission inherits AMIGA's shape; every later educational pack inherits the AGC pack's shape; every later reference skill inherits the RFC skill's shape. v1.23 is the release where the patterns became load-bearing for everything that follows.

## Key Features

| Area | What Shipped |
|------|--------------|
| MC-1 Control Surface (Phases 199-208) | Dashboard with 8-command parser, 3-tier alert system (info/warning/critical), Go/No-Go gates for human-in-the-loop phase transitions |
| ME-1 Mission Environment | Environment provisioner, phase engine, swarm coordinator for parallel agent execution, archive writer for immutable mission records |
| CE-1 Commons Engine | Attribution ledger tracking contributions, weighting engine with configurable factors, dividend calculator for resource distribution |
| GL-1 Governance Layer | Commons charter definition, rules engine for policy enforcement, policy query interface |
| Inter-Component Definitions | 4 typed ICDs for structured inter-team communication between MC-1 / ME-1 / CE-1 / GL-1 |
| Full-stack AMIGA controller | Composes all 4 components; end-to-end meta-mission harness produces a skill package as output |
| Apollo AGC Block II CPU (Phases 213-214) | 38 instructions covering arithmetic, logic, control flow, I/O, and special operations; ones' complement ALU with iterative end-around carry; 2.048 MHz MCT timing |
| Bank-switched AGC memory | EBANK (8 banks × 256 erasable words), FBANK (32 banks × 1,024 fixed words), superbank extension; 10-vector interrupt system with priority resolution; 512 I/O channels |
| Executive / Waitlist / BAILOUT (Phase 216) | Priority-based cooperative scheduler with 8 core sets, timer-driven task queue with 9 entries and centisecond dispatch, restart protection reproducing the Apollo 11 1202 alarm |
| DSKY Interface (Phase 217) | Electroluminescent relay decoding, 6 data registers, 11 annunciator indicators, 19-key keyboard (PRO, KEY REL, VERB, NOUN, +, -, 0-9, CLR, ENTR), VERB/NOUN command processor |
| Executive Monitor + Learn Mode (Phase 218) | Real-time visualization of scheduler state, core set allocation, waitlist queue; 12-annotation learn mode mapping AGC concepts to modern computing and GSD patterns |
| AGC Development Tools (Phase 219) | yaYUL-compatible assembler, step debugger with breakpoints/watchpoints/register inspection/memory dumps, disassembler, Virtual AGC rope loader verified against Luminary boot |
| AGC Validation Suite (Phase 219-04) | 54-test suite covering all 38 instructions and subsystems; counter-overflow regression caught and fixed |
| AGC Curriculum (Phase 221) | 11 chapters (orientation through AGC-to-GSD pattern mapping), 8 exercises (hello-dsky, countdown, calculator, blinker, scheduler, priority, restart, capstone-1202), 8 bare-metal AGC assembly starter programs; 20-test curriculum-programs suite |
| AGC Pack Integration (Phase 222-01..04) | 6 dashboard widgets with pure render functions, chipset YAML config, rope loader, pack manifest, 33 integration tests verifying all 5 AGCI requirements end-to-end |
| RFC Reference Skill (Phase 222) | 3-agent pipeline (Retriever → Analyzer → Citation Builder), 5 Python scripts for fetch/parse/index/analyze/format, built-in 57-RFC index across 9 protocol families with obsolescence awareness, Markdown/JSON/BibTeX output, RFC Collection Pack scaffold |
| Skill Candidate Detector (Phase 220-03) | Integrated into meta-mission; updated AMIGA barrel (commit `f73c4cd10`) |

## Retrospective

### What Worked

- **AGC simulator with full Block II fidelity.** 38 instructions, ones' complement ALU with iterative end-around carry, bank-switched memory (EBANK/FBANK/superbank), 10 interrupt vectors, 512 I/O channels, and 2.048 MHz MCT timing. This is not a toy. It reproduces the actual hardware behavior, including the 1202 alarm scenario, verified against a Luminary rope image boot test.
- **2,164 tests across 74 plans is the highest test density the project had shipped at that point.** The AGC simulator alone carries a 54-test validation suite covering all 38 instructions. For a CPU emulator where a single bit error propagates catastrophically through every downstream program, this level of coverage is the floor, not the ceiling.
- **AMIGA mission infrastructure as a reusable pattern.** MC-1 (Control), ME-1 (Environment), CE-1 (Commons), GL-1 (Governance) with 4 typed ICDs creates a composable mission framework. The full-stack controller and end-to-end meta-mission harness prove the components work together in a concrete scenario, not just in isolation.
- **RFC Reference Skill with a 3-agent pipeline.** Retriever → Analyzer → Citation Builder is a clean separation of concerns. The 57-RFC index covering 9 protocol families with obsolescence awareness shows the content is curated, not just scraped — obsoleted RFCs surface their successors, which is exactly the property a real reference skill needs.
- **Capstone exercise reproducing the 1202 alarm.** The 8-exercise ladder from hello-dsky through capstone-1202 means a student does not just read about Executive/Waitlist/BAILOUT — they write a program that triggers the 1202 alarm on the simulator and watch the restart protection fire the same way it did during Eagle's descent. The curriculum is not a wall of text.
- **Human-in-the-loop at the architecture level.** MC-1's Go/No-Go gates are wired into phase transitions by default, not opt-in. Every mission running on AMIGA gets human approval at phase boundaries for free.

### What Could Be Better

- **24 phases is enormous scope for a single milestone tag.** Mission infrastructure (10 phases), AGC simulator (8 phases), AGC curriculum (3 phases), RFC skill (1 phase), plus supporting phases. A cleaner split would have been v1.23 (AMIGA), v1.24 (AGC), v1.25 (RFC), but consolidating kept the cross-validation tight. The trade-off is real — readers scanning the changelog for a single-feature release will find the summary dense.
- **AGC development tools (assembler, debugger, disassembler, rope loader) are powerful but niche.** The educational value is clear, but the audience for yaYUL-compatible assembly tooling is small. The learn mode and AGC-to-GSD pattern mapping in the curriculum bridge this gap partially by translating AGC idioms into modern ones, but the tooling itself will see a narrower user base than the simulator.
- **The AMIGA ICDs are typed but the type boundary is internal.** Each component talks to its neighbors through a typed interface, but the 4 ICDs are defined within the AMIGA package rather than in a shared-contract module that external missions could depend on. A later release could extract them into a public API surface; v1.23 left that work on the floor.
- **RFC skill is documented in English but not yet dogfooded by the AGC pack's own documentation chapters.** The curriculum chapters cite RFCs and Apollo-era specifications by name; the next step would be wiring the RFC skill's citation builder into the curriculum's citation format so the pack exercises its own reference tooling. v1.23 shipped the skill and the pack side by side but left the loop open.

## Lessons Learned

1. **CPU emulators are the ultimate test of architectural precision.** Every instruction, every flag, every timing quirk must be exact. The discipline required for AGC Block II fidelity — ones' complement ALU, iterative end-around carry, bank-switched memory with superbank extension, centisecond waitlist dispatch — transfers directly to building reliable state machines elsewhere in the system. A simulator that passes its Luminary boot test is a simulator that has proven its state machine against a real program written by people who did not know the simulator would exist.
2. **Educational content needs a capstone exercise or it remains disconnected knowledge.** The 1202 alarm reproduction ties the entire AGC curriculum together — number systems, memory, instructions, Executive scheduling, Waitlist timing, DSKY interface, interrupt handling, and I/O channels all converge in one scenario the student builds and runs. Without the capstone, the 11 chapters are a bookshelf; with it, they are a ladder.
3. **Commons engines need attribution from day one.** The CE-1 attribution ledger with weighting engine and dividend calculator establishes that contributions are tracked and valued from the moment the engine boots. Retrofitting attribution into an existing system is orders of magnitude harder — provenance gets lost, the weighting factors become contested, the ledger rewrites break downstream consumers. Ship the ledger with the engine.
4. **Executive / Waitlist / BAILOUT map directly to modern scheduling primitives.** Priority-based cooperative scheduling (Executive), timer-driven task dispatch (Waitlist), and restart protection with alarm codes (BAILOUT) are the same patterns used in operating systems and distributed systems today. The AGC just did it in 36K words of rope memory in 1969. A simulator that reproduces these primitives is also a teaching tool for modern kernel design.
5. **Human-in-the-loop gates belong at the architecture level, not at the feature level.** MC-1's Go/No-Go gates are wired into phase transitions by the AMIGA framework itself. Every mission gets human approval at phase boundaries for free. If the gates were implemented mission-by-mission, half the missions would forget them; by building them into the framework, the default is safe.
6. **Large releases only work when the components cross-validate each other.** v1.23 shipped three workstreams in one milestone because AMIGA validates the AGC pack's delivery mechanism, the AGC pack validates AMIGA's end-to-end harness, and the RFC skill validates the reference-material template the AGC pack's citation chapters depend on. If any of the three had been built in isolation, the gaps would not have shown up until integration much later. Cross-validation is the reason the release tag is coherent at 24 phases.
7. **yaYUL compatibility is the right compatibility target for an AGC assembler.** Matching the reference open-source AGC assembler's source format means any Apollo-era program archived in yaYUL form — Luminary, Colossus, Comanche, Sundial — can be assembled through v1.23's toolchain unchanged. Picking a compatible format costs little at authoring time and buys access to every existing AGC program ever transcribed. Compatibility is a multiplier; novelty is a division.
8. **Dashboard widgets should be pure render functions.** Phase 222-03 shipped 6 AGC dashboard widgets as pure render functions — given AGC state, produce HTML, no side effects, no state mutation, no DOM coupling. This is the same discipline that made v1.20's dashboard collectors safe to compose; reapplying it at the widget layer keeps the AGC pack renderable inside or outside the live simulator. Pure render functions are the seam between "works in a demo" and "works in any context."
9. **A built-in curated index beats a runtime scraper for a reference skill.** The RFC skill's 57-RFC index with 9 protocol families and obsolescence awareness ships with the skill. A user asking about RFC 2616 gets RFC 7230 as the current-version pointer without a network round-trip. A scraper would need to be right about what to fetch and what to trust; a curated index is a declaration that the skill's author made those choices and stands by them. Curation is a form of invariant.
10. **Assembler, debugger, disassembler, loader — ship the full toolchain or ship none of it.** Half a toolchain is worse than no toolchain. If v1.23 had shipped the simulator and the assembler but not the debugger and loader, students would have been stuck at the "assembled but can't inspect" step. Shipping all four together means any problem a student hits has a tool that surfaces the state needed to diagnose it. Toolchains are atomic deliverables.
11. **The 1202 alarm is the single most important teaching moment in 20th-century computing.** It is the scenario that proves cooperative scheduling with restart protection works when the scheduler is overloaded. It is the scenario where the program kept running because Margaret Hamilton's team built BAILOUT on purpose. The AGC curriculum's capstone reproduces it deliberately because the lesson is: when the system is designed for graceful degradation, overload is recoverable. That lesson is as current as anything in modern distributed systems.
12. **Test density correlates with fidelity, not ceremony.** The 54-test AGC validation suite exists because every one of the 38 instructions has a distinct behavior that can be wrong in a distinct way. Testing the same function 54 times would be ceremony; testing 54 distinct behaviors once each is fidelity. The 2,164-test total across v1.23 reflects the same principle — each test pins down a specific behavior the release promises.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.22](../v1.22/) | Predecessor — Minecraft Knowledge World; the "content pack" idea that the AGC pack made operational |
| [v1.24](../v1.24/) | Successor — GSD Conformance Audit; 336-checkpoint matrix that certifies the AMIGA + AGC + RFC surface v1.23 shipped |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG that includes AMIGA ICDs as explicit contracts |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — inherits the AGC pack's "pack manifest + chipset config + bundled exercises" shape |
| [v1.29](../v1.29/) | Electronics Educational Pack — second pack to use the AGC curriculum's "chapter + exercise + starter program + capstone" structure |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — 19 skills and 3 crew configurations running on the AMIGA mission framework v1.23 established |
| [v1.34](../v1.34/) | Documentation Ecosystem — consumes the RFC Reference Skill's citation builder for canonical docs |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — 451 primitives; uses the AGC simulator's ones' complement reference for numerical-representation examples |
| [v1.36](../v1.36/) | Citation Management — extends the RFC skill's 3-agent pipeline to a 6-adapter resolution cascade; references CE-1 attribution model |
| [v1.49](../v1.49/) | Mega-release that consolidated many post-v1.23 tracks; every consolidated track inherits AMIGA's 4-component shape |
| [v1.20](../v1.20/) | Dashboard Assembly — pure render function discipline that phase 222-03's 6 AGC widgets follow |
| `src/agc/curriculum/` | 11 chapters, 8 exercises, 8 starter programs (phase 221) |
| `src/agc/pack/` | Pack manifest, chipset config, 6 dashboard widgets, 33 integration tests (phase 222) |
| `src/agc/__tests__/curriculum-runner.test.ts` | 21 runner infrastructure tests (commit `58cd6218f`) |
| `src/agc/__tests__/curriculum-programs.test.ts` | 20 validation tests for 8 starter programs (commit `0f5473452`) |
| `.planning/MILESTONES.md` | Canonical phase-by-phase detail for phases 199-222 |
| `docs/release-notes/v1.23/chapter/00-summary.md` | Machine-parsed summary of this release |
| `docs/release-notes/v1.23/chapter/03-retrospective.md` | Structured retrospective chapter mirrored in this README |
| `docs/release-notes/v1.23/chapter/04-lessons.md` | Extracted lessons with classification status |

## Engine Position

v1.23 is the release where GSD-OS grew an operational backbone and its first educational content packs on the same day. Before v1.23, missions were ad-hoc and educational packs were a plan; after v1.23, every mission runs on AMIGA's four-component architecture (MC-1 / ME-1 / CE-1 / GL-1) with typed ICDs and human-in-the-loop gates, every educational pack inherits the AGC pack's shape (chapters, exercises, starter programs, a capstone that reproduces a real historical scenario, a chipset manifest, pure-render dashboard widgets), and every reference skill inherits the RFC skill's shape (3-agent pipeline, curated index with obsolescence awareness, multi-format output). The v1.24 conformance audit that follows certifies this surface with a 336-checkpoint matrix; the v1.27 foundational knowledge packs extend the AGC pack's manifest into 35 packs across 3 tiers; the v1.29 electronics pack follows the same chapter-plus-capstone pedagogy; the v1.36 citation management release extends the RFC skill's 3-agent pipeline into a 6-adapter resolution cascade. The 146 commits, 207 files, 2,164 tests, and roughly 61,000 new lines of v1.23 are the load-bearing substrate every later mission-platform and content-pack release sits on top of. When the v1.49 mega-release consolidated many tracks, it inherited AMIGA's shape unchanged — there was no reason to replace a framework that was already working.

## Files

- `src/agc/curriculum/chapters/01-orientation.md` through `11-agc-to-gsd.md` — 11 curriculum chapters (phase 221)
- `src/agc/curriculum/exercises/01-hello-dsky.md` through `08-capstone-1202.md` — 8 hands-on exercises including 1202-alarm capstone (phase 221)
- `src/agc/curriculum/programs/hello-dsky.agc`, `countdown.agc`, `calculator.agc`, `blinker.agc`, `scheduler.agc`, `priority.agc`, `restart.agc`, `capstone.agc` — 8 bare-metal AGC assembly starter programs (phase 221)
- `src/agc/curriculum/runner.ts`, `types.ts`, `index.ts` — curriculum framework with `assembleProgramSource()` and `runProgram()` (commit `58cd6218f`)
- `src/agc/__tests__/curriculum-runner.test.ts` — 21 runner infrastructure tests (assembly, execution, metadata validation)
- `src/agc/__tests__/curriculum-programs.test.ts` — 20 validation tests covering all 8 starter programs
- `src/agc/pack/index.ts` + `src/agc/pack/__tests__/integration.test.ts` — pack barrel and 33 integration tests verifying all 5 AGCI requirements end-to-end (commit `d52da7ddf`)
- `src/agc/index.ts` — main AGC barrel with pack and curriculum re-exports
- `.planning/STATE.md` — milestone archive entry (commit `34b690674`)
- `.planning/MILESTONES.md` — canonical phase 199-222 detail (74 plans, 99 requirements)

---

## Version History (preserved from original release notes)

The table below lists the v1.x line that accumulated through v1.23, with the actual shipped summaries for each version. This version history is retained here for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.23** | Project AMIGA — mission infrastructure (MC-1/ME-1/CE-1/GL-1), Apollo AGC Block II simulator with DSKY, curriculum, and tools, RFC Reference Skill (this release) |
| **v1.22** | Minecraft Knowledge World — local cloud infrastructure, Fabric server, platform portability, Amiga emulation, spatial curriculum |
| **v1.21** | GSD-OS Desktop Foundation — Tauri v2 shell, WebGL CRT engine, PTY terminal, Workbench desktop, calibration wizard |
| **v1.20** | Dashboard Assembly — unified CSS pipeline, topology/activity/budget/staging collectors, console page |
| **v1.19** | Budget Display Overhaul — `LoadingProjection`, dual-view display, configurable budgets, dashboard gauge |
| **v1.18** | Information Design System — shape + color encoding, status gantry, topology views, three-speed layering |
| **v1.17** | Staging Layer — analysis, scanning, resource planning, approval queue for parallel execution |
| **v1.16** | Dashboard Console & Milestone Ingestion |
| **v1.15** | Live Dashboard Terminal |
| **v1.14** | Promotion Pipeline |
| **v1.13** | Session Lifecycle & Workflow Coprocessor |
| **v1.12.1** | Live Metrics Dashboard |
| **v1.12** | GSD Planning Docs Dashboard |
| **v1.11** | GSD Integration Layer |
| **v1.10** | Security Hardening |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration |
| **v1.8.1** | Audit Remediation (Patch) |
| **v1.8** | Capability-Aware Planning + Token Efficiency |
| **v1.7** | GSD Master Orchestration Agent |
| **v1.6** | Cross-Domain Examples |
| **v1.5** | Pattern Discovery |
| **v1.4** | Agent Teams |
| **v1.3** | Documentation Overhaul |
| **v1.2** | Test Infrastructure |
| **v1.1** | Semantic Conflict Detection |
| **v1.0** | Core Skill Management |
