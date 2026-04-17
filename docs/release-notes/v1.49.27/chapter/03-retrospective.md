# Retrospective — v1.49.27

## What Worked

- **Wave-based parallel execution scales to chipset code.** The same pattern used for PNW research docs (COL, CAS, AVI+MAM, BPS) translates cleanly to TypeScript chipset implementation. Waves 1A and 1B were fully parallel tracks — sensing and communication — with no file conflicts.
- **Frog Protocol as testable state machine.** Using explicit phase advancement (not timers) made all 285 tests deterministic. Zero flakiness, zero async waits. The protocol is complex (5 phases, scout-first dispatch, human approval gates) but the test-first design keeps it fully controllable.
- **Output synthesis creates physical feedback.** Mapping Frog Protocol phases to colors (green BASELINE, blue SILENCE, orange ASSESS, yellow PROBE, red CLASSIFY, teal RESUME) across DMX, LED, and laser outputs means agent state becomes visible in physical space. The laser interlock (SC-LAS) is a genuine safety constraint, not a checkbox.
- **SimulatedEnvironment enables realistic integration tests.** The 5-agent test environment with anomaly injection and 9 preset scenarios (nominal, context exhaustion, cascading failure, noisy) provided enough coverage to catch subtle multi-source correlation bugs during Wave 2.

## What Could Be Better

- **Two `z.record(z.unknown())` calls slipped through to Wave 0.** The Zod v4 incompatibility (needs `z.record(z.string(), z.unknown())`) was documented in the handoff but wasn't caught until the build-check hook blocked the push. Future waves should run `tsc --noEmit` as part of the pre-commit, not just pre-push.
- **Wave 2+3 combined into a single commit.** Ideally the Frog Protocol (Wave 2) and verification suites (Wave 3) would have separate commits for cleaner bisect history. The session boundary forced a combined commit.

## Lessons Learned

1. **Build-check hooks catch what tests miss.** The 285 tests all passed but `tsc --noEmit` caught the Zod v4 type error. Runtime behavior was correct (Zod v3 accepts single-arg `z.record()`), but the type signatures were wrong. Hooks as quality gates work.
2. **Explicit phase advancement > timer-based for testability.** The Frog Protocol could have used `setTimeout` for phase transitions, but explicit `advancePhase()` calls made every state transition deterministic and testable. This is the right pattern for any protocol state machine.
3. **Physical output mapping makes abstract systems concrete.** Seeing "ASSESS = orange, pulsing at 1Hz" on an LED strip or DMX fixture gives immediate feedback about system state that log files can't match. The output synthesis layer is an investment in operational visibility.
4. **The Paula Chipset is growing.** With audio-engineering (Release 1) and spatial-awareness (Release 2), the chipset architecture is proving extensible. Each release adds modules without modifying existing ones — the barrel export pattern and typed interfaces keep modules orthogonal.
