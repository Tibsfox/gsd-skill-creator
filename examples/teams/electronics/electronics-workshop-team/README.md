---
name: electronics-workshop-team
type: team
category: electronics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/electronics/electronics-workshop-team/README.md
description: Focused four-agent subset of the Electronics Department for bench design reviews, circuit debugging, and practical schematic analysis. Pairs Shockley (chair and safety), Bardeen (device physics), Brattain (measurement discipline), and Horowitz (pedagogy and intuition) for problems where the engineering work is concentrated in the circuits and devices wings. Use when you have a specific schematic or working prototype that needs review, a device-level bug to diagnose, or a circuit to characterize at the bench. Not for multi-wing investigations, firmware-heavy problems, or pure layout questions.
superseded_by: null
---
# Electronics Workshop Team

Focused four-agent team for practical bench-level work — schematic review, circuit debugging, device-level diagnosis, and measurement-driven investigation. This is the "bring it to the bench and figure it out" team, analogous to how `proof-workshop-team` in math pairs the proof engineer with the algebraist for focused depth.

## When to use this team

- **Schematic review** of an analog or mixed-signal design before PCB layout.
- **Working prototype debugging** where the board exists and a specific fault needs diagnosis.
- **Device-level bug diagnosis** (oscillation, thermal runaway, bandwidth collapse, distortion).
- **Circuit characterization** where theory and bench must agree before the design is trusted.
- **Analog front-end noise analysis** — identifying dominant sources and measurement-validating the budget.
- **Op-amp stability problems** — compensation design, phase margin verification.

## When NOT to use this team

- **Full-department investigation** spanning digital logic, firmware, layout, and devices — use `electronics-analysis-team`.
- **Digital-only problems** with no analog component — use `kilby` directly or `electronics-analysis-team`.
- **Firmware-only problems** with no hardware interaction — use `shima` directly.
- **Layout-only problems** with no circuit design to review — use `noyce` directly.
- **Beginner concept questions** with no bench context — use `horowitz` directly.

## Composition

Four agents, tightly focused on the circuits and devices wings:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Safety** | `shockley` | Classification, orchestration, safety filtering | Opus |
| **Device specialist** | `bardeen` | Carrier-level physics, small-signal models, nonideal effects | Opus |
| **Experimentalist** | `brattain` | Measurement protocols, artifact diagnosis, characterization | Sonnet |
| **Pedagogy / intuition** | `horowitz` | Bench workflows, debug intuition, level-appropriate explanation | Sonnet |

Two Opus agents (Shockley for routing, Bardeen for device reasoning) and two Sonnet agents (Brattain for measurement throughput, Horowitz for explanation). The team excludes Kilby (logic), Noyce (layout), and Shima (firmware) — those specialties are not needed for circuit-and-device workshop work.

## Orchestration flow

```
Input: schematic or circuit + question or observed fault
        |
        v
+---------------------------+
| Shockley (Opus)           |  Phase 1: Classify and scope
| Chair                     |          - verify this is a workshop-team problem
+---------------------------+          - route to specialists based on question
        |
        +--------+--------+
        |        |        |
        v        v        v
    Bardeen   Brattain  (Horowitz
    (theory)  (bench)    waits)
        |        |
    Phase 2: Theory and bench work in parallel
             Bardeen predicts from first principles
             Brattain designs a measurement to test the prediction
        |        |
        +--------+
             |
             v
    Phase 3: Cross-check
             If Bardeen's prediction and Brattain's setup agree
             on what should be observed, proceed to measurement.
             If they disagree on what to measure, resolve first.
             |
             v
+---------------------------+
| Shockley (Opus)           |  Phase 4: Synthesize
| Merge findings            |
+---------------------------+
             |
             v
+---------------------------+
| Horowitz (Sonnet)         |  Phase 5: Pedagogy wrap
| Level-appropriate output  |
+---------------------------+
             |
             v
+---------------------------+
| Shockley (Opus)           |  Phase 6: Record
| Produce ElectronicsSession|
+---------------------------+
             |
             v
    Final response + ElectronicsSession Grove record
```

## Synthesis rules

The workshop team follows the full analysis team's synthesis rules, with two additional shortcut rules:

### Rule W1 — Measurement is the tiebreaker

In this team, Brattain's bench data is the decisive evidence whenever it is available. Bardeen's theoretical predictions are tested against measurement, not the other way around. Theoretical disagreement with a clean measurement becomes a Bardeen task to update the model.

### Rule W2 — Horowitz always has the final word on tone

The user-facing output is always routed through Horowitz before Shockley's final synthesis. This guarantees that even a highly technical answer carries the intuitive framing and rule-of-thumb context that Art-of-Electronics style demands.

## Input contract

The team accepts:

1. **Schematic or circuit description** (required). The design being reviewed or debugged.
2. **Question or fault description** (required). What the user wants to know or what is going wrong.
3. **Measurement data** (optional). Scope captures, DMM readings, spectrum analyzer plots.
4. **User level** (optional). Inferred if omitted.

## Output contract

### Primary output: Synthesized response

A focused response that:

- Answers the question or identifies the fault
- Shows the theoretical reasoning (Bardeen) and the measurement evidence (Brattain)
- Credits each specialist for their contribution
- Provides a concrete next-step (part change, layout adjustment, compensation network)
- Flags any safety concerns

### Grove record: ElectronicsSession

Same format as `electronics-analysis-team`, but with fewer agents_invoked and typically a narrower concept_ids set.

## Example scenarios

### Scenario 1: Oscillating amplifier

**User:** "My two-stage BJT amp oscillates at 18 MHz. Input coupling cap is 1 μF, output is a 10 kΩ load. Schematic attached."

**Flow:**
1. Shockley classifies: wing=circuits/devices, complexity=challenging, type=debug, user level inferred advanced.
2. Bardeen analyzes the topology: identifies Miller multiplication of C_bc at first-stage collector, supply-rail coupling through inductive V_CC path.
3. Brattain designs a measurement: verify quiescent points, AC-couple scope at each high-impedance node, look for oscillation amplitude and spectrum.
4. Cross-check: both agents agree the oscillation should be observable in both output and first-stage collector, suppressible by adding local supply decoupling.
5. Shockley synthesizes: three specific fixes in priority order (decoupling, base-stopper, layout change).
6. Horowitz wraps: explains Miller effect in intuitive terms, connects to the standard "why amps oscillate" story, gives bench verification steps.
7. Shockley records.

### Scenario 2: Photodiode front end noise

**User:** "Low-noise photodiode amp achieves 10 nV/√Hz instead of the calculated 3 nV/√Hz. AD8067 with Hamamatsu S5971."

**Flow:**
1. Shockley classifies: wing=circuits/devices, complexity=research-level, type=debug, level=advanced.
2. Bardeen computes the noise budget: op-amp input voltage noise, input current noise interacting with source impedance, feedback resistor thermal noise, photodiode shot noise at operating conditions.
3. Brattain designs a measurement to isolate contributions: remove photodiode, short input, measure amp-only noise; reconnect photodiode with amp off, measure cable pickup; full system measurement.
4. Cross-check: dominant contributor should be op-amp voltage noise * (1 + R_f/R_s). Both agents agree the measurement will reveal which term is dominant.
5. Shockley synthesizes: measurement result identifies dominant source, specific fix proposed.
6. Horowitz wraps: explains noise budget reasoning, connects to AoE chapter 8 noise analysis, provides a worked example.
7. Shockley records.

## Escalation paths

### Internal escalations

- **Bardeen requests detailed layout information:** Escalate to `electronics-analysis-team` (add Noyce).
- **Problem reveals digital logic involvement:** Escalate to `electronics-analysis-team` (add Kilby).
- **Problem reveals firmware involvement:** Escalate to `electronics-analysis-team` (add Shima).
- **Brattain cannot measure what Bardeen needs:** Suggest equipment upgrade path and note the unmeasured quantity in the output.

### External escalations

- **From `shockley` alone:** When a single-agent route turns out to need theory-plus-measurement collaboration, escalate here.
- **To `electronics-analysis-team`:** When scope grows beyond circuits and devices.

## Token / time cost

- **Shockley** — 2 Opus invocations, ~30K tokens
- **Bardeen** — 1 Opus invocation, ~40K tokens
- **Brattain** — 1 Sonnet invocation, ~30K tokens
- **Horowitz** — 1 Sonnet invocation, ~20K tokens
- **Total** — 100-150K tokens, 3-8 minutes wall-clock

Significantly cheaper than the full analysis team and appropriate for focused workshop-level queries.

## Configuration

```yaml
name: electronics-workshop-team
chair: shockley
specialists:
  - device: bardeen
  - measurement: brattain
pedagogy: horowitz

parallel: true
timeout_minutes: 8
auto_skip: false  # all four agents expected on every query
min_specialists: 2
```

## Invocation

```
# Schematic review
> electronics-workshop-team: Review this instrumentation amplifier design for
  noise budget and stability. [schematic attached]

# Debug oscillation
> electronics-workshop-team: My cascoded PMOS current source starts oscillating
  at 200 MHz when I add a decoupling capacitor. 2N7002s in cascode, 100 kOhm
  source. What's going on?

# Characterize unknown behavior
> electronics-workshop-team: The gain of my audio preamp drops 3 dB at 100 Hz
  instead of the expected 20 Hz. [schematic attached] Can you tell me what's
  happening and how to verify?
```

## Limitations

- No logic, layout, or firmware expertise — those queries should use the full analysis team or a single specialist.
- Bench measurements are described by protocol; actual data collection requires a human at the bench.
- The team does not own the overall project context; for architecture-level questions, use `electronics-analysis-team`.
