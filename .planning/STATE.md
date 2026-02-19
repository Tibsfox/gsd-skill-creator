# State: GSD Skill Creator

## Current Position

Phase: 222 of 222 (AGC GSD-OS Integration) -- COMPLETE
Plan: 4 of 4 in current phase (COMPLETE)
Status: Phase 222 complete -- 4 plans, 4 commits, 131 new pack tests (1021 AGC tests total)
Last activity: 2026-02-19 -- Completed Phase 222 (AGC GSD-OS Integration)

Progress: [########################] 100% (24/24 phases)

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Skills, agents, and teams must match official Claude Code patterns -- and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible
**Current focus:** v1.23 Project AMIGA -- Phase 222 complete (FINAL PHASE), AGC GSD-OS integration pack (5 blocks, 6 widgets, chipset, rope loader, manifest), 1021 AGC tests, all 24 phases DONE

## Current Milestone

**v1.23 Project AMIGA** -- 24 phases (199-222), 5 waves, 99 requirements
- Three workstreams: AMIGA mission infrastructure (phases 199-212, 215, 220), Apollo AGC (201, 207, 213-214, 216-219, 221-222), RFC skill (202)
- Wave 0 COMPLETE: 199, 200, 201, 202
- Wave 1 COMPLETE: 203, 204, 205, 206, 207
- Integration Gate 1 (Phase 208) COMPLETE: MC-1/ME-1 integration verified
- Human-in-the-loop gates: Foundation Gate DONE, Integration Gate 1 DONE, Integration Gate 2 DONE, Launch Gate DONE

## Next Actions

1. Wave 0 COMPLETE: 199, 200, 201, 202 all done
2. Phase 203 (Control Surface Foundation) COMPLETE -- 4 plans, 8 commits, 104 tests
3. Phase 204 (Control Surface Alerts & Telemetry) COMPLETE -- 3 plans, 6 commits, 42 tests
4. Phase 205 (Mission Environment Schema & Engine) COMPLETE -- 3 plans, 9 commits, 124 tests
5. Phase 206 (Mission Environment Coordination & Archive) COMPLETE -- 3 plans, 8 commits, 124 tests
6. Phase 207 (AGC Architectural Study) COMPLETE -- 2 plans, 2 commits, 4 study documents
7. Wave 1 COMPLETE: 203, 204, 205, 206, 207 all done
8. Phase 208 (MC-1/ME-1 Integration -- Integration Gate 1) COMPLETE -- 2 plans, 4 commits, 39 tests
9. Integration Gate 1 CLEARED: MC-1 and ME-1 work end-to-end with live telemetry
10. Full AMIGA test suite: 662 tests passing across 23 test files (zero regressions)
11. Phase 211 (Governance Charter & Documentation) COMPLETE -- 3 plans, 6 commits, 68 GL-1 tests
12. Phase 209 (Commons Engine Data & Recording) COMPLETE -- 4 plans, 8 commits, 135 CE-1 tests
13. Full AMIGA test suite: 865 tests passing across 31 test files (zero regressions)
14. Phase 213 (AGC CPU & Memory) COMPLETE -- 4 plans, 10 commits, 210 AGC tests
15. AGC module: types, registers, memory (bank switching), ALU (ones' complement), 38 instructions, decoder, CPU (fetch-decode-execute), barrel index
16. Phase 210 (Commons Engine Calculation) COMPLETE -- 3 plans, 6 commits, 88 new CE-1 tests
17. CE-1 calculation: WeightingEngine (frequency/critical-path/depth-decay), DividendCalculator (3-tier distribution), LedgerSealGuard (SHA-256 tamper evidence)
18. Full AMIGA test suite: 1004 tests passing across 37 test files (zero regressions)
19. Phase 212 (Governance Engine & Policy) COMPLETE -- 3 plans, 6 commits, 67 new GL-1 tests
20. GL-1 governance engine: RulesEngine (4 constitutional constraints), DecisionLog (append-only), PolicyQueryHandler (4 query types via ICD-03)
21. Full AMIGA test suite: 1020 tests passing across 37 test files (zero regressions)
22. Phase 214 (AGC Interrupts & Timing) COMPLETE -- 3 plans, 5 commits, 117 new AGC tests
23. AGC interrupts: 10 hardware vectors, priority ordering, RUPT entry/exit, INHINT/RELINT gating
24. AGC counters: TIME1-TIME6, CDUX/Y/Z, overflow-triggered interrupts, accumulator-based ticking
25. AGC I/O channels: 512 channels, bitwise ops, 7 peripheral groups, configurable stubs
26. AGC timing: 2.048 MHz / 11.72us MCT, instruction timing table, real-time conversion
27. AGC stepAgc: integrated cycle (interrupts -> execute -> I/O -> counters -> timing)
28. Total AGC tests: 327 passing across 11 test files (zero regressions from Phase 213)
29. Phase 215 (Full Stack Integration) COMPLETE -- 2 plans, 3 commits, 43 new integration tests
30. FullStackController: four-component harness (MC-1, ME-1, CE-1, GL-1) with dual onEmit bridge
31. Integration Gate 2 acceptance criteria proven: INTG-04 (attribution flow), INTG-05 (governance check), INTG-06 (all four ICDs active)
32. Full AMIGA test suite: 1063 tests passing across 39 test files (zero regressions)
33. Phase 216 (AGC Executive & Restart) COMPLETE -- 3 plans, 7 commits, 99 new AGC tests
34. AGC Executive: 8 core sets, NOVAC/FINDVAC job creation, priority scheduling, context switching
35. AGC Waitlist: 9-entry timer scheduler, centisecond dispatch, T3RUPT integration
36. AGC BAILOUT: 3 restart groups (CRITICAL/IMPORTANT/DEFERRABLE), controlled restart with state preservation
37. Apollo 11 1202 alarm scenario validated: overload -> BAILOUT -> recovery -> scheduling
38. Total AGC tests: 426 passing across 15 test files (zero regressions from Phase 213/214)
39. Phase 217 (DSKY Interface) COMPLETE -- 3 plans, 4 commits, 149 new DSKY tests
40. DSKY display model: relay word decoding (5-bit EL encoding), PROG/VERB/NOUN (2-digit), R1/R2/R3 (5-digit signed), 11 annunciators, COMP ACTY
41. DSKY keyboard model: 19 keys, 5-bit key codes matching real AGC, channel 15 injection, KEYRUPT1 interrupt, PRO special handling (channel 32 bit 14)
42. DSKY VERB/NOUN commander: 11-state input machine, data entry via V21/V22/V23, CLR/RSET/KEY REL, display feedback
43. AGC barrel index updated with all Phase 217 DSKY exports
44. Total AGC tests: 575 passing across 18 test files (zero regressions from Phase 213/214/216)
45. Phase 218 (Executive Monitor & Learn Mode) COMPLETE -- 3 plans, 7 commits, 88 new tests
46. Executive Monitor: read-only snapshot extraction from all 5 AGC subsystems (core sets, waitlist, interrupts, counters, restart)
47. 1202 Alarm Scenario: parameterizable Apollo 11 overload reproduction with 8 event types and MonitorSnapshot timeline
48. Learn Mode: 12 AGC concept annotations with modern computing equivalents and GSD mappings
49. AGC barrel index updated with all Phase 218 exports (MonitorSnapshot, AlarmScenario, LearnAnnotation)
50. Total AGC tests: 805 passing across 24 test files (zero regressions from Phase 213/214/216/217)
51. Phase 220 (AMIGA Meta-Mission) COMPLETE -- 3 plans, 6 commits, 60 new meta-mission tests
52. MetaMissionHarness: wraps FullStackController with pre-configured AMIGA provisioning meta-mission (4 contributors, 6 agents, 4 teams)
53. SkillCandidateDetector: 4 detection methods (provisioning_workflow, sequence_repetition, phase_correlation, attribution_cluster)
54. Launch Gate validated: INTG-07 (6-phase lifecycle), INTG-08 (dashboard-only interaction), INTG-09 (skill candidate surfacing)
55. End-to-end test validates all 3 requirements + 4 ICD channels + schema validation in single Launch Gate scenario
56. Full AMIGA test suite: 1123 tests passing across 42 test files (zero regressions)
57. Phase 219 (AGC Tools & Validation) COMPLETE -- 5 plans, 12 commits, 443 new tool/validation tests
58. AGC disassembler: word/bank/rope-level output, register operand naming, EXTEND tracking
59. AGC assembler: two-pass yaYUL format, 38 instructions + 10 directives, auto-EXTEND injection
60. AGC debugger: step/run, breakpoints, watchpoints, state inspection, history, onEvent callback
61. AGC validation suite: 54 tests across 7 categories (basic, extracode, special, interrupt, counter, bank, sequence)
62. Fixed counter overflow: carry-based detection at max positive (0o37777) instead of sign-based ALU overflow
63. AGC rope loader: Virtual AGC binary format, parity stripping, full/partial image support
64. Synthetic boot test: load rope -> create state -> step -> DSKY channel write -> idle loop
65. AGC tools barrel and main AGC index re-export all Phase 219 tools
66. Total AGC tests: 869 passing across 26 test files (zero regressions from Phase 213/214/216/217/218)
67. Phase 222 (AGC GSD-OS Integration) COMPLETE -- 4 plans, 4 commits, 131 new pack tests
68. AGC pack: 5 block definitions (cpu, dsky, peripheral-bus, executive-monitor, assembly-editor) for blueprint editor
69. AGC chipset: agc-educational.yaml with 5 skills, 3 agents, 1 team, 6% budget, routing rules
70. AGC widgets: 6 dashboard widgets (registers, memory-map, executive-state, dsky-display, telemetry-feed, instruction-trace)
71. Virtual AGC rope loader: 3 flight software sources (Luminary 099/131, Colossus 249) at virtualagc.github.io
72. Pack manifest: standalone=true with install/remove via chipset YAML presence
73. Integration tests: 33 tests verifying all 5 AGCI requirements end-to-end (block-widget wiring, chipset validation, standalone operation)
74. Total AGC tests: 1021 passing across 32 test files (zero regressions)
75. ALL 24 PHASES COMPLETE -- v1.23 Project AMIGA milestone ready for archival

## Decisions

- Phase structure maps AMIGA M-0 through M-5 into 16 AMIGA phases + 5 AGC simulator phases + 2 AGC content phases + 1 RFC phase = 24 total
- AGC archive (201) and RFC skill (202) run parallel with AMIGA foundation (Wave 0)
- AGC simulator phases (213-214, 216-219) interleave with AMIGA Waves 2-3 for maximum parallelism
- ContributorID uses min(8) constraint to enforce at least one char after prefix
- Enum constant arrays exported alongside Zod enum schemas for downstream iteration
- AMIGA_SCHEMAS map enables programmatic schema iteration without knowing names
- Agent registry uses ReadonlyMap for frozen immutable data access
- Route lookup returns sender/receiver/requiresAck without event type key
- OPS agents assigned 'cross-cutting' component (not a specific component ID)
- Zod v4 z.record() requires two-arg form z.record(z.string(), z.unknown()) -- single-arg crashes
- Envelope source/destination regex includes MC (component) and bare team names for routing compat
- ICD event types without routing table entries are warnings not errors (response events use implicit correlation routing)
- All ICD schemas use .passthrough() for forward compatibility
- DependencyNodeSchema exported from ICD-02 for reuse; EvidenceItemSchema and AlgorithmAdjustmentSchema exported from ICD-04
- GovernanceResponse reasoning field mandatory (min 1 char) per FOUND-06
- DisputeRecord algorithm_adjustment uses nullable+optional pattern
- RFC index curates 57 RFCs across 9 protocol families with obsolescence chains
- RFC scripts use pathlib with script-dir-relative resolution for portability
- Three RFC agents share single rfc-reference skill for unified trigger routing
- RFC pack follows archive/study/implement model with 3-tier reading paths
- AGC catalog uses stable IDs (agc-{category}-{NNN}) for cross-referencing across 5 YAML files
- AGC reading paths: Quick Start (10 essential, 3-4 hrs), Deep Dive (50 docs, 8 thematic sections), Complete Study (full 210)
- ME-1 manifest is machine-parseable (Zod), human-readable (descriptive fields), incrementally writable (createManifest + updateManifest)
- ME-1 provisioner is in-memory (no filesystem I/O) -- pure and testable without mocking
- ME-1 phase engine enforces strict transition graph with entry criteria and telemetry emission
- COMPLETION and ABORT are terminal states in the phase engine
- ME-1 GateController wraps PhaseEngine; redirect uses engine re-creation at target phase
- ME-1 SwarmCoordinator extracts team prefix from AgentID for REDIRECT routing (ME-1 -> ME)
- ME-1 ArchiveWriter uses SHA-256 via node:crypto (synchronous) and deep-freezes all structures
- ME-1 three-phase integration test validates ALL telemetry against ICD-01 schemas at envelope level
- MC-1 StubME1 uses pull-based iterator pattern (next/reset/drain) for flexible test data consumption
- MC-1 command parser validates output against ICD-01 schema as safety net
- MC-1 dashboard resets alert_level to nominal on fresh telemetry (advisory clears with new data)
- MC-1 barrel re-exports all components; AMIGA barrel includes MC-1 module
- AlertRenderer uses discriminated union on `tier` field (nominal/advisory/gate) for type-safe view models
- Advisory alerts auto-clear on telemetry arrival; gates require explicit respondToGate
- TelemetryConsumer routes TELEMETRY_UPDATE + ALERT_SURFACE to both Dashboard and AlertRenderer; GATE_SIGNAL to AlertRenderer only
- Gate response emits valid ICD-01 GATE_RESPONSE envelope via callback, with correlation to original GATE_SIGNAL
- MissionController bypasses provision() for emitter creation to wire onEmit bridge callback before any emission
- MissionController injects gate suspension manually when reaching REVIEW_GATE via single-step engine.transition()
- Engine re-creation after gate redirect to sync with GateController's internal engine replacement
- AMIGA barrel exports ME-1 and Integration modules alongside MC-1, ICD, and foundation types
- Charter uses js-yaml for YAML parsing; ratification hash computed on pre-ratification content via JSON.stringify + SHA-256
- GovernanceDisputeSchema extends ICD-04 DisputeRecordPayloadSchema via .extend() for schema compatibility
- Dispute lifecycle is immutable: resolve/reject return new objects, never mutate input
- GL-1 barrel follows same pattern as MC-1 and ME-1 barrel indexes
- CE-1 entry IDs use le-NNNNNN format with padded sequential numbers
- CE-1 query returns defensive copies to prevent external mutation
- ContributionRegistry uses BFS graph walk for circular dependency detection
- InvocationRecorder has NO direct dependency on TelemetryEmitter -- pure event-driven design
- Token architecture is specification only (not implementation) per Out of Scope
- CE-1 barrel follows same pattern as MC-1, ME-1, and GL-1 barrel indexes
- WeightingEngine: critical-path 40%, frequency 30%, depth-decay 30% -- double normalization (per-component then composite)
- DividendCalculator: Tier 1 (60% direct), Tier 2 (25% infrastructure), Tier 3 (15% UBD) -- Tier 2 redistributes to Tier 1 when empty
- LedgerSealGuard: SHA-256 sorted-key hash for tamper evidence, deep-freeze for immutability
- AGC types use branded number types (Word15, Word16, Address12) for type safety without runtime cost
- AGC registers use immutable pattern: setRegister returns new state, BB/EBANK/FBANK sync on write
- AGC edit registers (CYR/SR/CYL/EDOP) perform bit manipulation on write, reading returns transformed value
- AGC memory uses resolveAddress for bank switching: EBANK (3-bit, 8 banks), FBANK (5-bit, 36 banks), superbank
- AGC ALU uses iterative end-around carry (max 2 passes) for ones' complement addition
- AGC quarter-code instructions (opcodes 2, 5) use 10-bit effective address (bits 9-0)
- AGC INDEX adds to full instruction word before decoding (can modify opcode and address)
- AGC CPU Z advances to Z+1 before instruction execution; branches override Z
- AGC barrel index at src/agc/index.ts exports all types and functions for downstream phases
- RulesEngine: no-retroactive-reduction is structural check only (full comparison requires ledger access in Phase 215)
- Near-boundary thresholds: UBD < 5% allocation is advisory, infrastructure < 10% is advisory
- Concentration risk: single recipient > 80% of tier1 triggers advisory referencing clause-005
- DecisionLog returns defensive copies to prevent external mutation of internal state
- PolicyQueryHandler uses keyword fallback when exact substring match fails for policy_lookup/weight_review
- AMIGA barrel auto-propagates GL-1 barrel updates via wildcard re-export
- AGC ZRUPT register added at RegisterId address 7 for interrupt return address storage
- AGC interrupt pending stored as 10-bit bitmask; lowest set bit = highest priority
- AGC counter tick uses accumulator pattern: fractional MCTs accumulate across calls
- AGC TIME6 has explicit enable/disable gate (digital autopilot timer only active when needed)
- AGC IoChannelState uses Map for sparse channel storage; peripheral read map checked first on read
- AGC stepAgc wraps inner step() with subsystem integration (decorator pattern)
- AGC RUPT entry sets Z to vector address (not vector+1); next step fetches from vector
- AGC INHINT/RELINT synced via change detection between CPU and InterruptState
- AGC Executive priority 0 = highest (guidance), priority 7 = lowest (display) matching real AGC convention
- AGC NOVAC for lightweight jobs, FINDVAC for 44-word VAC area workspace allocation
- AGC 1202 alarm on core set exhaustion, 1201 on VAC exhaustion, 1203 on Waitlist overflow
- AGC BAILOUT preserves IMPORTANT jobs when fewer than 4 core sets used by CRITICAL
- AGC unregistered jobs treated as DEFERRABLE during BAILOUT (safe default: always discarded)
- AGC Waitlist dispatch one-entry-per-T3RUPT matching real AGC behavior
- AGC BAILOUT always clears entire Waitlist; timer tasks must re-register after restart
- FullStackController uses composition (not inheritance) with MissionController pattern -- builds all components directly
- Dual onEmit bridge: TelemetryConsumer (ICD-01) AND InvocationRecorder (ICD-02) both receive every emitted event
- emitLedgerEntry routes LEDGER_ENTRY events through emitter.record() to share onEmit pipeline
- Governance query requestor must be valid AgentID (CS-1) or 'human', not MC-1 (MC is not a team prefix)
- ACTIVE_PHASES gate: LEDGER_ENTRY only permitted in PLANNING, EXECUTION, INTEGRATION, REVIEW_GATE
- Cross-ICD validation pattern: map event types to ICD schemas, validate every event in lifecycle
- DSKY relay sign codes: plus=27 (0b11011), minus=28 (0b11100) matching real AGC EL display
- DSKY PRO key routes to channel 32 bit 14 without KEYRUPT1 (monitored by Executive, not keyboard ISR)
- DSKY VERB/NOUN state machine returns to IDLE after second digit (not auto-advance to next register)
- DSKY data entry verbs V21/V22/V23 emit command AND transition to DATA_SIGN mode for target register
- DSKY DisplayUpdates uses Partial<DisplayRegister> for incremental display feedback during input
- DSKY annunciator full-replacement: each channel 11 write replaces all 11 flags (not incremental)
- Executive Monitor deep-freezes all snapshot objects recursively for immutability guarantee
- InterruptView.currentlyServicing always null (AGC doesn't track which interrupt is being serviced after RUPT entry)
- Alarm scenario makeRunnable helper transitions DORMANT->RUNNABLE since Executive lacks explicit activation API
- Alarm scenario preemption includes idle job as valid preemption target
- Learn mode annotations are pure data objects (not UI components) consumed by Phase 222 visualization
- Map/Set iteration uses forEach instead of for-of for TypeScript downlevelIteration compat (or Array.from for barrel-included code)
- AGC counter overflow is carry-based: counters overflow at max positive (0o37777), NOT at 15-bit boundary (0o77777)
- AGC counter overflow detection: value === 0o37777 triggers overflow, cascade, and interrupt request
- AGC assembler auto-injects EXTEND prefix for extracode instructions during assembly
- AGC rope loader strips parity bit (bit 15) from Virtual AGC binary format words
- Luminary 099 boot test conditional on file presence (describe.skipIf) with diagnostic output
- MetaMissionHarness uses composition (wraps FullStackController) with pre-configured AMIGA provisioning meta-mission
- infrastructureContributorIds added to FullStackConfig for governance compliance (DividendCalculator Tier 2 requires non-empty infrastructure set)
- emitAlert() added to FullStackController for external alert emission during debrief
- SkillCandidateDetector: 4 independent methods -- provisioning_workflow (0.8+ base), sequence_repetition (bigram), phase_correlation (co-occurrence), attribution_cluster (handoffs)
- Skill package snapshot before debrief: buildSkillPackageDraft() runs before ALERT_SURFACE events, total_events reflects pre-debrief count
- Debrief pattern: detector analyzes event log post-mission, surfaces candidates as ALERT_SURFACE advisory alerts through MC-1
- AGC pack module pattern: types.ts + block-definitions.ts + widgets.ts + rope-loader.ts + manifest.ts + barrel index.ts
- Widget data sources reference block input/output ports AND config entries (display_data is a DSKY input, downlink_stub is a peripheral config)
- AGC chipset follows minecraft-knowledge-world.yaml schema with routing rules and disambiguation (6% budget under 40% ceiling)
- All rope source URLs reference unmodified Virtual AGC binaries at virtualagc.github.io
- Pack manifest blocks/widgets arrays start empty -- populated by barrel import connections
- Widget pure render pattern: typed data interface in, HTML string out, escapeHtml for XSS safety

## Accumulated Context

### From v1.22 (Minecraft Knowledge World)
- Wave-based execution proven effective for large milestones
- Template/local-values pattern: zero secrets in version control
- 20 SKILL.md files, 10 agents, 5 teams, chipset with trigger routing

### Milestone History
- 26 milestones shipped (v1.0-v1.22 + v1.8.1 patch)
- 198 phases, 520+ plans, ~220k LOC
- Phase numbering continues from 199

## Blockers

None.

## Pending Todos

None.

## Session Continuity

Last session: 2026-02-19
Stopped at: Phase 222 (AGC GSD-OS Integration) complete -- 4 plans, 4 commits, 131 new pack tests (1021 AGC total). ALL 24 phases of v1.23 COMPLETE.

### Key Files
- `.planning/ROADMAP.md` -- 24 phases across 5 waves
- `.planning/REQUIREMENTS.md` -- 99 requirements with traceability
- `src/amiga/mc1/stub-me1.ts` -- Stub ME-1 telemetry emitter (4 sequence factories)
- `src/amiga/mc1/command-parser.ts` -- Command parser (8 commands, ICD-01 validated)
- `src/amiga/mc1/dashboard.ts` -- Dashboard state manager (telemetry + alert processing)
- `src/amiga/mc1/alert-renderer.ts` -- Three-tier alert renderer (nominal/advisory/gate)
- `src/amiga/mc1/telemetry-consumer.ts` -- Event router bridging ME-1 to Dashboard + AlertRenderer
- `src/amiga/mc1/index.ts` -- MC-1 barrel exports (Phase 203 + 204)
- `src/amiga/me1/manifest.ts` -- Mission manifest schema, factory, update utility
- `src/amiga/me1/telemetry-emitter.ts` -- ICD-01 event emitter (TELEMETRY_UPDATE, ALERT_SURFACE, GATE_SIGNAL)
- `src/amiga/me1/provisioner.ts` -- Clean environment creation from mission briefs
- `src/amiga/me1/phase-engine.ts` -- Lifecycle transition management with criteria enforcement
- `src/amiga/me1/gate-controller.ts` -- Gate suspension/clearance wrapping PhaseEngine
- `src/amiga/me1/swarm-coordinator.ts` -- Command dispatch and resource locking for agent teams
- `src/amiga/me1/archive-writer.ts` -- Sealed immutable mission archive records
- `src/amiga/me1/index.ts` -- ME-1 barrel index (Phase 205 + 206 exports)
- `src/amiga/integration/mission-controller.ts` -- MissionController wiring real ME-1 to real MC-1 via onEmit bridge
- `src/amiga/integration/index.ts` -- Integration barrel exports
- `src/amiga/index.ts` -- AMIGA barrel (types, registry, envelope, ICD, MC-1, ME-1, Integration, CE-1, GL-1)
- `src/amiga/ce1/attribution-ledger.ts` -- ICD-02 conforming attribution ledger with queries and seal
- `src/amiga/ce1/contribution-registry.ts` -- Contributor registry with version tracking and cycle detection
- `src/amiga/ce1/invocation-recorder.ts` -- Event-driven LEDGER_ENTRY capture from ME-1 telemetry
- `src/amiga/ce1/token-architecture.ts` -- Token architecture specification with YAML export
- `src/amiga/ce1/weighting-engine.ts` -- Three-component weighting (frequency/critical-path/depth-decay)
- `src/amiga/ce1/dividend-calculator.ts` -- Three-tier distribution (direct/infrastructure/UBD)
- `src/amiga/ce1/ledger-seal.ts` -- SHA-256 tamper-evident seal with deep freeze
- `src/amiga/ce1/index.ts` -- CE-1 barrel exports (Phase 209 + 210)
- `src/amiga/gl1/charter.ts` -- Commons charter schema, constitutional constraints, ratification with SHA-256
- `src/amiga/gl1/weighting-docs.ts` -- Weighting algorithm parameter documentation (frequency/critical-path/depth-decay)
- `src/amiga/gl1/dispute-record.ts` -- Governance dispute record lifecycle extending ICD-04
- `src/amiga/gl1/rules-engine.ts` -- Rules engine evaluating distribution plans against 4 constitutional constraints
- `src/amiga/gl1/decision-log.ts` -- Append-only governance decision log with query capabilities
- `src/amiga/gl1/policy-query.ts` -- ICD-03 policy query handler for all 4 query types
- `src/amiga/gl1/index.ts` -- GL-1 barrel exports (Phase 211 + 212)
- `src/agc/types.ts` -- AGC foundation types (Word15, Word16, Address12, RegisterId, masks)
- `src/agc/registers.ts` -- Immutable register file with edit register transforms (CYR/SR/CYL/EDOP)
- `src/agc/memory.ts` -- Memory system with bank switching (EBANK/FBANK/superbank)
- `src/agc/alu.ts` -- Ones' complement arithmetic (add/sub/mul/div/overflow/diminish)
- `src/agc/instructions.ts` -- All 38 Block II instructions (15 basic + 18 extracode + 5 special)
- `src/agc/decoder.ts` -- Instruction decoder for basic/extracode/quarter-code encodings
- `src/agc/cpu.ts` -- CPU step function (fetch-decode-execute cycle)
- `src/agc/interrupts.ts` -- Interrupt controller: 10 vectors, priority, RUPT entry/exit, INHINT/RELINT
- `src/agc/counters.ts` -- Involuntary counters: TIME1-TIME6, CDUX/Y/Z, overflow, accumulator ticking
- `src/agc/io-channels.ts` -- I/O channels: 512 channels, bitwise ops, peripheral stubs, downlink log
- `src/agc/timing.ts` -- Timing model: 2.048 MHz, 11.72us MCT, instruction timing, time conversion
- `src/agc/cpu.ts` -- CPU step (inner) + integrated stepAgc (full AGC cycle with all subsystems)
- `src/agc/executive.ts` -- Executive scheduler: 8 core sets, NOVAC/FINDVAC, priority scheduling, context switching
- `src/agc/waitlist.ts` -- Waitlist timer scheduler: 9 entries, centisecond dispatch, cancellation
- `src/agc/restart.ts` -- BAILOUT restart protection: restart groups, state preservation, controlled restart
- `src/agc/dsky-display.ts` -- DSKY display model: relay word decoding, 6 registers, 11 annunciators, channels 10/11/13
- `src/agc/dsky-keyboard.ts` -- DSKY keyboard model: 19 keys, key codes, channel 15 injection, KEYRUPT1, PRO special
- `src/agc/dsky-commander.ts` -- DSKY VERB/NOUN command processor: 11-state input machine, data entry, CLR/RSET/KEY REL
- `src/agc/executive-monitor.ts` -- Executive Monitor: read-only snapshot extraction and derived metrics
- `src/agc/alarm-scenario.ts` -- 1202 alarm scenario: parameterizable Apollo 11 overload reproduction
- `src/agc/learn-mode.ts` -- Learn mode: 12 AGC annotations with modern computing and GSD mappings
- `src/agc/index.ts` -- AGC barrel index re-exporting all Phase 213 + 214 + 216 + 217 + 218 + 219 + 222 public APIs
- `src/agc/tools/disassembler.ts` -- AGC disassembler: word/bank/rope-level output with register naming
- `src/agc/tools/assembler.ts` -- AGC assembler: two-pass yaYUL format, 38 instructions + 10 directives
- `src/agc/tools/debugger.ts` -- AGC debugger: step/run, breakpoints, watchpoints, state inspection
- `src/agc/tools/validation.ts` -- AGC validation harness: assembler-based test loading, assertion checking
- `src/agc/tools/rope-loader.ts` -- Rope image loader: Virtual AGC binary format, parity stripping
- `src/agc/tools/index.ts` -- AGC tools barrel exporting all 5 tool modules
- `src/amiga/integration/full-stack-controller.ts` -- FullStackController wiring MC-1, ME-1, CE-1, GL-1 with dual onEmit bridge + emitAlert
- `src/amiga/integration/index.ts` -- Integration barrel exports (Phase 208 + 215)
- `src/amiga/meta-mission/meta-mission-harness.ts` -- MetaMissionHarness wrapping FullStackController with AMIGA provisioning meta-mission
- `src/amiga/meta-mission/skill-candidate-detector.ts` -- SkillCandidateDetector with 4 detection methods for event log analysis
- `src/amiga/meta-mission/index.ts` -- Meta-mission barrel exports (Phase 220)
- `src/agc/pack/types.ts` -- AGC pack type system (BlockDefinition, WidgetDefinition, PackManifest, ValidationResult)
- `src/agc/pack/block-definitions.ts` -- 5 AGC block definitions (cpu, dsky, peripheral-bus, executive-monitor, assembly-editor)
- `src/agc/pack/widgets.ts` -- 6 dashboard widgets with pure render functions
- `src/agc/pack/rope-loader.ts` -- Virtual AGC rope image source catalog (3 sources)
- `src/agc/pack/manifest.ts` -- Pack manifest (standalone: true, 5 skills, install detection)
- `src/agc/pack/index.ts` -- Pack barrel re-exporting all modules
- `.chipset/agc-educational.yaml` -- AGC educational chipset (5 skills, 3 agents, 1 team, 6% budget)
- `src/amiga/index.ts` -- AMIGA barrel (types, registry, envelope, ICD, MC-1, ME-1, Integration, CE-1, GL-1, Meta-Mission)
