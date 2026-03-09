# v1.49.27 — Spatial Awareness: The Chorus Protocol

**Shipped:** 2026-03-09
**Commits:** 6
**Files:** 30 changed | **New Code:** ~9,954 LOC (27 files in `src/spatial-awareness/`)
**Tests:** 285/285 passing across 12 test files | **Safety-Critical:** 4/4 PASS

## Summary

Adds the Spatial Awareness chipset (Paula Chipset Release 2) — a passive sensing, threat assessment, and coordinated signaling system for multi-agent environments. The system reads ambient computational signals (context fill, token budget, error rates) and physical sensor data (USB audio, accelerometer, RF spectrum), detects threats through probabilistic scoring with multi-source correlation, and coordinates graduated responses using the 5-phase Frog Protocol. The output synthesis layer maps agent state to audio oscillators, DMX-512 lighting, WS2812B LED strips, and ILDA laser projectors. Delivered in 4 waves across 6 commits with 285 deterministic tests.

## Key Features

### Chipset Modules (6 chips)

| ID | Module | Purpose |
|----|--------|---------|
| M1 | Passive Environmental Sensor | Reads ambient signals without tool calls, builds spatial model, detects anomalies via configurable thresholds |
| M2 | Threat Detection Engine | Probabilistic EMA scoring, multi-source correlation (>=2 sources to escalate), sliding window trend analysis |
| M3 | Environmental Geometry Mapper | ResourceDimension model, constraint boundaries with time-to-hit estimates, fill % tracking |
| M4 | Frog Protocol Controller | 5-phase state machine: BASELINE->SILENCE->ASSESS->PROBE->CLASSIFY->RESUME. Scout-first dispatch, human approval gate for BLOCK threats |
| M5 | Multi-Tier Communication Bus | COVERT (invisible point-to-point), DIRECTED (named recipients), BROADCAST (all agents). Signal file protocol |
| M6 | Chorus Coordination Protocol | Distributed pause/resume with state preservation. Scout-first re-engagement. No leader election |

### Supporting Layers
- **types.ts** — 11 Zod schemas covering all data structures (Zod v4 compatible)
- **sensor-interface.ts** — SensorStream/OutputDevice contracts, 3 built-in sensors (ContextFill, TokenBudget, ErrorRate)
- **usb-device.ts** — USB device abstraction for audio, serial, bulk, and HID endpoints
- **output-synthesis.ts** — Audio oscillators (CF-19), DMX-512 at 44Hz (CF-20), WS2812B LED strips (CF-21), ILDA laser with safety interlock (CF-22)
- **integration.ts** — SpatialAwarenessSystem factory wiring: sensor -> threat -> protocol -> comm -> chorus -> output
- **test-env.ts** — 5-agent SimulatedEnvironment with anomaly injection and 9 preset scenarios

### Verification Suites (Wave 3)
- **Threat Simulation** — 15-scenario suite: >=85% true positive rate, <=10% false positive rate, single-signal/multi-source/mixed/pipeline coverage
- **Broadcast Reliability** — 50-signal broadcast with 5 agents, rotating senders, tier isolation. CF-12 zero missed broadcasts verified
- **State Preservation** — 10-cycle pause/resume. CF-14 zero work loss. Scout-first re-engagement across all cycles

### Safety-Critical Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| SC-HUM | BLOCK threats require human/CAPCOM approval before irreversible action | PASS |
| SC-RES | No agent resumes work while BLOCK-level threat is active and unapproved | PASS |
| SC-COR | SILENCE entry requires correlated signals from >=2 sources | PASS |
| SC-LAS | Laser output REFUSED without confirmed interlock (ENGAGED + confirmed) | PASS |

### Mission Document
- **PRD expanded** from 27 to 39 pages with USB I/O, output synthesis, and laser projection sections
- Mission pack at `www/MISSIONS/spatial-awareness/spatial-awareness-mission.pdf`

## Wave Execution Timeline

| Wave | Scope | Commits | Tests |
|------|-------|---------|-------|
| 0 | Foundation (types, sensors, test env) | `2fead652` | 56 |
| 1A | Sensing (passive sensor, threat engine, geometry, USB) | `56f6128a` | 62 |
| 1B | Comm/Output (comm bus, chorus, output synthesis) | `d6447b2a` | 78 |
| 2+3 | Integration + Verification + Packaging | `15f0f65f`, `4986c650` | 89 |
| **Total** | | **6 commits** | **285** |

## Retrospective

### What Worked
- **Wave-based parallel execution scales to chipset code.** The same pattern used for PNW research docs (COL, CAS, AVI+MAM, BPS) translates cleanly to TypeScript chipset implementation. Waves 1A and 1B were fully parallel tracks — sensing and communication — with no file conflicts.
- **Frog Protocol as testable state machine.** Using explicit phase advancement (not timers) made all 285 tests deterministic. Zero flakiness, zero async waits. The protocol is complex (5 phases, scout-first dispatch, human approval gates) but the test-first design keeps it fully controllable.
- **Output synthesis creates physical feedback.** Mapping Frog Protocol phases to colors (green BASELINE, blue SILENCE, orange ASSESS, yellow PROBE, red CLASSIFY, teal RESUME) across DMX, LED, and laser outputs means agent state becomes visible in physical space. The laser interlock (SC-LAS) is a genuine safety constraint, not a checkbox.
- **SimulatedEnvironment enables realistic integration tests.** The 5-agent test environment with anomaly injection and 9 preset scenarios (nominal, context exhaustion, cascading failure, noisy) provided enough coverage to catch subtle multi-source correlation bugs during Wave 2.

### What Could Be Better
- **Two `z.record(z.unknown())` calls slipped through to Wave 0.** The Zod v4 incompatibility (needs `z.record(z.string(), z.unknown())`) was documented in the handoff but wasn't caught until the build-check hook blocked the push. Future waves should run `tsc --noEmit` as part of the pre-commit, not just pre-push.
- **Wave 2+3 combined into a single commit.** Ideally the Frog Protocol (Wave 2) and verification suites (Wave 3) would have separate commits for cleaner bisect history. The session boundary forced a combined commit.

## Lessons Learned

1. **Build-check hooks catch what tests miss.** The 285 tests all passed but `tsc --noEmit` caught the Zod v4 type error. Runtime behavior was correct (Zod v3 accepts single-arg `z.record()`), but the type signatures were wrong. Hooks as quality gates work.
2. **Explicit phase advancement > timer-based for testability.** The Frog Protocol could have used `setTimeout` for phase transitions, but explicit `advancePhase()` calls made every state transition deterministic and testable. This is the right pattern for any protocol state machine.
3. **Physical output mapping makes abstract systems concrete.** Seeing "ASSESS = orange, pulsing at 1Hz" on an LED strip or DMX fixture gives immediate feedback about system state that log files can't match. The output synthesis layer is an investment in operational visibility.
4. **The Paula Chipset is growing.** With audio-engineering (Release 1) and spatial-awareness (Release 2), the chipset architecture is proving extensible. Each release adds modules without modifying existing ones — the barrel export pattern and typed interfaces keep modules orthogonal.
