---
name: electronics-practice-team
type: team
category: electronics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/electronics/electronics-practice-team/README.md
description: Sequential four-agent pipeline for the prototype-to-production path — Kilby for logic correctness, Noyce for layout and manufacturability, Shima for firmware architecture, and Horowitz for documentation and pedagogy. Use when advancing a project from working prototype toward a shipping product: design-for-manufacturing review, firmware bring-up, board-level integration, or first-article qualification. Mirrors the math discovery-team pipeline (explore -> compute -> verify -> document) but runs in the applied-systems direction. Not for theoretical device analysis, pure circuit debugging, or multi-wing research questions.
superseded_by: null
---
# Electronics Practice Team

Sequential four-agent pipeline for advancing an electronics project from prototype toward production. Where `electronics-workshop-team` concentrates on understanding a circuit, and `electronics-analysis-team` spans the whole department, this team runs the practical chain of logic -> layout -> firmware -> documentation that an engineering team follows when making something shippable.

This is the "practice team" in the sense of engineering practice — the discipline of turning a design into a product — not in the sense of a rehearsal. It is analogous to the math department's `discovery-team`, which runs the exploration -> computation -> verification -> documentation pipeline for conjecture generation.

## When to use this team

- **Prototype-to-production path** — you have a working prototype and want to make it shippable.
- **Design-for-manufacturing review** — is the design actually buildable at target cost and volume?
- **Firmware bring-up** on a new board — the hardware exists, the firmware needs an architecture and a debug path.
- **Board-level integration** — bringing together logic design, layout, and firmware for the first time.
- **First-article qualification** — does the first production-intent unit actually work?
- **Pre-tapeout review of a mixed-signal IC** (rare but supported) — logic, analog integration, and on-chip layout concerns.

## When NOT to use this team

- **Theoretical analysis of device behavior** — use `electronics-workshop-team` or `bardeen` directly.
- **Pure circuit debugging** — use `electronics-workshop-team`.
- **Multi-wing research questions** — use `electronics-analysis-team`.
- **Beginner-level concept learning** — use `horowitz` directly.
- **Single-file firmware review** — use `shima` directly.

## Composition

Four agents, running as a **sequential pipeline** rather than in parallel:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Stage 1 — Logic** | `kilby` | Logic correctness, FSM review, timing budget | Opus |
| **Stage 2 — Physical** | `noyce` | Layout, manufacturability, EMI, thermal, BOM cost | Sonnet |
| **Stage 3 — Firmware** | `shima` | Firmware architecture, peripheral binding, real-time analysis | Sonnet |
| **Stage 4 — Pedagogy / docs** | `horowitz` | Bring-up guide, documentation, learning pathway | Sonnet |

Shockley runs as chair (orchestration and routing) but the pipeline is the core mechanism — each stage consumes the output of the previous one and adds its own contribution. Bardeen and Brattain are available as escalation targets when a stage exposes a device-level issue, but they are not routine participants.

## Pipeline flow

```
Input: working prototype (schematic, RTL, breadboard, or rev-A PCB)
        |
        v
+---------------------------+
| Shockley (Opus)           |  Stage 0: Classify and scope
| Chair                     |          - confirm this is a practice-team problem
+---------------------------+          - prepare handoff artifacts for stage 1
        |
        v
+---------------------------+
| Kilby (Opus)              |  Stage 1: Logic correctness
| Logic specialist          |          - verify logic matches spec
+---------------------------+          - verify timing budget
        |                              - identify synchronous discipline issues
        |                              - produce logic verification artifact
        v
+---------------------------+
| Noyce (Sonnet)            |  Stage 2: Physical implementation
| Layout specialist         |          - translate logic into layout strategy
+---------------------------+          - review existing layout if present
        |                              - address EMI, thermal, manufacturability
        |                              - produce layout and BOM artifact
        v
+---------------------------+
| Shima (Sonnet)            |  Stage 3: Firmware architecture
| Firmware specialist       |          - propose or review firmware structure
+---------------------------+          - verify peripheral binding matches layout
        |                              - compute real-time budget
        |                              - produce firmware design artifact
        v
+---------------------------+
| Horowitz (Sonnet)         |  Stage 4: Documentation + bring-up guide
| Pedagogy specialist       |          - produce bring-up checklist
+---------------------------+          - produce user-facing documentation
        |                              - link to college concepts and next steps
        |                              - produce ElectronicsExplanation artifact
        v
+---------------------------+
| Shockley (Opus)            |  Stage 5: Consolidation
| Chair                      |          - link all four stage artifacts
+---------------------------+          - produce ElectronicsSession
        |                              - filter for safety issues
        v
  Final response to user
  + 4 stage artifacts (ElectronicsAnalysis / ElectronicsDesign / ElectronicsExplanation)
  + 1 consolidated ElectronicsSession
```

## Stage interfaces

Each stage consumes a defined artifact from the previous stage and produces one for the next. This is the distinctive property of a pipeline team: stages do not run in parallel, and each stage can request revision of the previous stage if its input is inadequate.

### Stage 1 → Stage 2 interface

**Kilby produces:** Gate-level or RTL design with timing budget closed, BOM of logic parts, list of critical signals (clocks, resets, high-speed data) that layout must protect.

**Noyce consumes:** The BOM and the critical-signal list drive placement and routing strategy. Timing budget constraints drive layer stack and controlled-impedance routing.

### Stage 2 → Stage 3 interface

**Noyce produces:** Layout artifact with final pin assignments, component placements, and rail definitions.

**Shima consumes:** Pin assignments drive firmware peripheral binding. For example, if a timer output is routed to pin 14, the firmware must use TIM3_CH1 (the peripheral that owns that pin on the target MCU).

### Stage 3 → Stage 4 interface

**Shima produces:** Firmware architecture document with bring-up sequence, boot mode, debug interface, and known limitations.

**Horowitz consumes:** The bring-up sequence becomes the user-facing bring-up guide. The boot mode and debug interface become the first paragraphs of the documentation. Known limitations become cautionary notes.

## Revision request protocol

Any stage may determine that its input is inadequate and request revision of the previous stage. The sequence:

1. Stage N identifies the inadequacy (e.g., Shima discovers that Noyce routed a timer output to a pin the MCU cannot use as that timer channel).
2. Stage N returns a revision request to Stage N-1 with the specific issue.
3. Stage N-1 produces a revised artifact.
4. Stage N resumes with the revised input.
5. If Stage N-1 cannot accommodate (e.g., all timer channels are already used), Stage N-1 escalates back further (to Stage 1 or to Shockley for re-planning).

This protocol preserves pipeline discipline while allowing practical iteration. In the worst case, the pipeline runs multiple times with different input variants.

## Example scenarios

### Scenario 1: Environmental logger bring-up

**User:** "I have a rev-A PCB for a battery-powered environmental data logger. STM32L4, BME280, OLED, SPI flash. Board is bare; need firmware from scratch. Target: 3-year battery life."

**Pipeline:**
1. **Kilby (Stage 1).** Verifies the logic — in this case, the STM32L4 itself is off-the-shelf, so Kilby's contribution is lighter. Kilby reviews the schematic for correct clock network, reset topology, boot mode jumper. Flags that the reset circuit has no pull-up.
2. **Noyce (Stage 2).** Reviews the layout. Flags missing decoupling at BME280, ground plane split under the ADC section (which doesn't matter here since no ADC is used), and suggests moving the antenna connector inward for better EMI.
3. **Shima (Stage 3).** Proposes a superloop-with-LPTIM-wakeup firmware structure. Computes the power budget: 5 μA sleep, 8 mA active, 100 ms duty cycle per minute -> 2.8 year life on CR2032. Identifies peripheral assignments: LPTIM1 for wakeup, I2C1 for sensors, SPI1 for flash, USART2 for debug.
4. **Horowitz (Stage 4).** Produces the bring-up guide: blink an LED, get UART printf working, verify each peripheral in sequence, then integrate into the superloop. Writes the user-facing documentation.

### Scenario 2: Small-run motor controller

**User:** "I need to ship 500 units of a stepper motor controller. Working prototype exists. Need DFM review and firmware architecture for production."

**Pipeline:**
1. **Kilby (Stage 1).** Verifies stepper drive logic, protection interlocks, and limit-switch FSM. Identifies a race between overcurrent detect and step pulse — escalates to Shockley for Bardeen consultation on timing. After fix, approves the logic.
2. **Noyce (Stage 2).** Reviews layout for thermal (stepper drivers dissipate ~5 W total), BOM cost ($28 at 500 units), connector durability, and EMC implications. Flags two changes for cost: consolidate regulators, replace a premium MOSFET driver with a cheaper alternative.
3. **Shima (Stage 3).** Reviews firmware. Finds priority inversion risk in the step-pulse ISR and a missing watchdog. Proposes fixes.
4. **Horowitz (Stage 4).** Writes production bring-up checklist and field troubleshooting guide. Notes the known limitation that the controller cannot handle loads above 2 Nm without the optional heat sink.

## Input contract

The team accepts:

1. **Project artifacts** (required). Schematic, RTL or HDL source, layout files, existing firmware — whatever exists.
2. **Stage** (required). Which stages the user wants to run. Default is all four.
3. **Target** (required). Prototype, small batch, production, or flight.
4. **Constraints** (optional). Cost, schedule, regulatory environment, form factor.

## Output contract

### Primary output: Pipeline report

A structured report containing:

- **Stage 1 findings** from Kilby
- **Stage 2 findings** from Noyce
- **Stage 3 findings** from Shima
- **Stage 4 findings** from Horowitz (user-facing docs)
- **Open issues** that require user decision
- **Recommended next steps**

### Grove records

Each stage produces one Grove record (ElectronicsAnalysis, ElectronicsDesign, or ElectronicsExplanation). Shockley produces a consolidating ElectronicsSession that links all four.

## Escalation paths

### Internal escalations

- **Stage discovers device-level issue:** Escalate to Bardeen (via Shockley) before continuing the pipeline.
- **Stage discovers measurement-level question:** Escalate to Brattain for protocol design.
- **Revision request loops more than twice:** Escalate to Shockley for re-planning.

### External escalations

- **To `electronics-analysis-team`:** When the pipeline reveals a research-level or multi-wing problem that cannot be resolved within the practice-team scope.
- **To `electronics-workshop-team`:** When a circuit-level question dominates and the pipeline is not the right tool.

## Token / time cost

- **Shockley** — 2 Opus invocations, ~30K tokens
- **Kilby** — 1 Opus invocation, ~40K tokens
- **Noyce** — 1 Sonnet invocation, ~30K tokens
- **Shima** — 1 Sonnet invocation, ~40K tokens
- **Horowitz** — 1 Sonnet invocation, ~30K tokens
- **Total** — 150-250K tokens, 5-10 minutes wall-clock (sequential, so wall-clock is nearly sum of per-stage times)

The pipeline's sequential nature means wall-clock cost is higher than the parallel analysis team for the same token budget, but the output is more tightly integrated and each stage can revise based on the previous one.

## Configuration

```yaml
name: electronics-practice-team
chair: shockley
pipeline:
  - stage: 1
    agent: kilby
    input: "project artifacts"
    output: "logic verification and BOM"
  - stage: 2
    agent: noyce
    input: "stage 1 output"
    output: "layout strategy and DFM review"
  - stage: 3
    agent: shima
    input: "stage 2 output"
    output: "firmware architecture and real-time budget"
  - stage: 4
    agent: horowitz
    input: "stage 3 output"
    output: "bring-up guide and documentation"

parallel: false
timeout_minutes: 15
revision_max_loops: 2
```

## Invocation

```
# Full pipeline for production prep
> electronics-practice-team: Advance the rev-A photodiode logger to production.
  500 units, cost target $35, field-deployable. Artifacts attached.

# Firmware bring-up stage only
> electronics-practice-team: The rev-A PCB is fabricated and populated. Need
  Stage 3 firmware architecture and Stage 4 bring-up guide. Skip stages 1-2.
  Target MCU: STM32L476. Hardware as-built in attached schematic.

# DFM review only
> electronics-practice-team: Review this working prototype for production
  readiness. Stages 1-2 only. Target: 1000 units/month.
```

## Limitations

- Sequential nature means the wall-clock time is higher than for the parallel analysis team.
- The team presumes a working prototype exists; it is not the right team for clean-sheet design questions.
- Stages cannot run in arbitrary order — the pipeline direction is fixed (logic -> physical -> firmware -> docs).
- Real production readiness requires human review beyond the team's scope (safety certification, reliability testing, market validation).
