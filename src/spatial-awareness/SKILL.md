# spatial-awareness

Passive Sensing, Threat Assessment, and Coordinated Signaling for Agent Systems.

Paula Chipset Release 2 — The Chorus Protocol.

## Description

Spatial awareness gives multi-agent systems environmental perception without active polling. The system reads ambient computational signals (context fill, token budget, error rates) and physical sensor data (USB audio, accelerometer, RF spectrum), detects threats through probabilistic scoring with multi-source correlation, and coordinates graduated responses using the 5-phase Frog Protocol.

The output synthesis layer maps sensor data to audio oscillators, DMX-512 lighting, WS2812B LED strips, and ILDA laser projectors — making agent state audible and visible.

## Modules

| ID | Module | File | Purpose |
|----|--------|------|---------|
| M1 | Passive Sensor | `passive-sensor.ts` | Reads ambient signals, builds spatial model, detects anomalies |
| M2 | Threat Detection | `threat-engine.ts` | Probabilistic scoring, multi-source correlation, sliding window |
| M3 | Geometry Mapper | `geometry-mapper.ts` | ResourceDimension model, constraint boundaries, fill % tracking |
| M4 | Frog Protocol | `frog-protocol.ts` | 5-phase state machine: BASELINE→SILENCE→ASSESS→PROBE→CLASSIFY→RESUME |
| M5 | Comm Bus | `comm-bus.ts` | 3-tier messaging: COVERT, DIRECTED, BROADCAST |
| M6 | Chorus Protocol | `chorus-proto.ts` | Distributed pause/resume, scout-first re-engagement, state snapshots |

## Supporting Layers

| Layer | File | Purpose |
|-------|------|---------|
| Types | `types.ts` | Zod schemas for all data structures |
| Sensors | `sensor-interface.ts` | Unified SensorStream/OutputDevice contracts |
| USB | `usb-device.ts` | USB device abstraction (audio, serial, bulk, HID) |
| Output | `output-synthesis.ts` | Audio, DMX, LED, laser output with phase color mapping |
| Integration | `integration.ts` | SpatialAwarenessSystem wires full pipeline |
| Test Env | `test-env.ts` | 5-agent SimulatedEnvironment with anomaly injection |

## Safety-Critical Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| SC-HUM | BLOCK threats require human/CAPCOM approval before irreversible action | PASS |
| SC-RES | No agent resumes work while BLOCK-level threat is active and unapproved | PASS |
| SC-COR | SILENCE entry requires correlated signals from ≥2 sources | PASS |
| SC-LAS | Laser output REFUSED without confirmed interlock (ENGAGED + confirmed) | PASS |

## Core Functionality

| ID | Requirement | Status |
|----|-------------|--------|
| CF-06 | SILENCE within 500ms of anomaly detection | PASS |
| CF-07 | ASSESS produces threat characterization within 5s | PASS |
| CF-08 | PROBE dispatches scout; scout acts before others | PASS |
| CF-09 | CLASSIFY correctly labels THREAT/NEUTRAL/OPPORTUNITY | PASS |
| CF-10 | RESUME re-engages agents in priority order (scout-first) | PASS |
| CF-11 | Broadcast delivery to all agents within 1s | PASS |
| CF-12 | Zero missed broadcasts | PASS |
| CF-13 | Covert messages invisible to non-recipients | PASS |
| CF-14 | Zero work loss on pause/resume | PASS |
| CF-19 | Audio synthesis from mapped sensors | PASS |
| CF-20 | DMX-512 frame output at 44Hz | PASS |
| CF-21 | WS2812B LED strip control with phase colors | PASS |
| CF-22 | ILDA laser output with safety interlock | PASS |

## Test Coverage

- **285 tests** across 12 test files
- 15-scenario threat simulation suite (≥85% TP, ≤10% FP)
- 50-signal broadcast reliability (zero missed)
- 10-cycle pause/resume state preservation
- Full pipeline integration (signal → threat → protocol → output)

## Activation

This skill activates when working with:
- Multi-agent coordination and sensing
- Threat detection and response protocols
- Audio/visual output synthesis for agent state
- Distributed pause/resume with state preservation
