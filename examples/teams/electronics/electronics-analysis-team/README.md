---
name: electronics-analysis-team
type: team
category: electronics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/electronics/electronics-analysis-team/README.md
description: Full Electronics Department investigation team for multi-wing problems spanning device physics, integrated logic, layout, firmware, and practical bench debugging. Shockley classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with Horowitz pedagogy. Use for research-level design questions, graduate-level failure analysis, new-project architecture reviews, or any problem where the wing is not obvious and different electronics perspectives may yield different insights. Not for routine bias calculations, single-wing logic reviews, or pure bench measurement tasks.
superseded_by: null
---
# Electronics Analysis Team

Full-department multi-method investigation team for electronics problems that span wings or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `math-investigation-team` runs multiple methods on a mathematical problem.

## When to use this team

- **Multi-wing problems** spanning circuits, devices, analog systems, digital, and applied systems — where no single specialist covers the full scope.
- **Research-level failure analysis** where the root cause could plausibly be at any level from carrier physics to firmware timing.
- **Graduate-level design work** requiring coordinated input from multiple specialists (e.g., a low-noise sensor front end that needs Bardeen's device selection, Noyce's layout, Shima's firmware, and Brattain's characterization).
- **Novel-project architecture review** where the user does not yet know which wing holds the key trade-offs.
- **Cross-wing synthesis** — when understanding a system requires seeing it through multiple lenses (device behavior via Bardeen, logic via Kilby, layout via Noyce, firmware via Shima, practical intuition via Horowitz).
- **Certification readiness review** — when a product must pass regulatory, thermal, and reliability gates simultaneously.

## When NOT to use this team

- **Simple bias calculations** — use `shockley` directly or `bardeen` for nonideal effects. The analysis team's token cost is substantial.
- **Pure logic reviews** where the design is clearly digital — use `electronics-workshop-team` or `kilby` directly.
- **Pure bench measurement tasks** — use `brattain` directly.
- **Beginner-level concept questions** — use `horowitz` directly.
- **Firmware-only questions** with no hardware interaction — use `shima` directly.
- **Single-wing problems** where the classification is obvious — route to the specialist via `shockley` in single-agent mode.

## Composition

The team runs all seven Electronics Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `shockley` | Classification, orchestration, synthesis, safety filtering | Opus |
| **Device specialist** | `bardeen` | Solid-state physics, carrier-level analysis, small-signal models | Opus |
| **IC / logic specialist** | `kilby` | Integrated circuit topology, logic families, FSM review | Opus |
| **Experimentalist** | `brattain` | Measurement protocols, device characterization, artifact diagnosis | Sonnet |
| **Layout / process specialist** | `noyce` | PCB layout, manufacturability, EMI, thermal, regulatory | Sonnet |
| **Firmware / MPU specialist** | `shima` | Microcontroller architecture, firmware review, real-time analysis | Sonnet |
| **Pedagogy specialist** | `horowitz` | Level-appropriate explanation, bench workflows, debug intuition | Sonnet |

Three agents run on Opus (Shockley, Bardeen, Kilby) because their tasks require deep reasoning — classification, device-level physics, and logic topology. Four run on Sonnet because their tasks are well-scoped and throughput-sensitive — measurement protocols, layout reviews, firmware reviews, and pedagogical explanation.

## Orchestration flow

```
Input: user query + optional user level + optional prior ElectronicsSession hash
        |
        v
+---------------------------+
| Shockley (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - wing (may be multi-wing)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (analyze/design/debug/explain/review)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Bardeen   Kilby   Brattain  Noyce    Shima  (Horowitz
    (device) (logic)  (measure) (layout) (fw)    waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, each reading the same
             problem but producing independent findings in their
             own framework. Each produces a Grove record.
             Shockley activates only the relevant subset —
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Shockley (Opus)           |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - filter for safety issues
                         v
              +---------------------------+
              | Horowitz (Sonnet)         |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Shockley (Opus)           |  Phase 5: Record
              | Produce ElectronicsSession|          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + ElectronicsSession Grove record
```

## Synthesis rules

Shockley synthesizes the specialist outputs using these rules, analogous to the `math-investigation-team` synthesis protocol:

### Rule 1 — Converging findings are strengthened

When two or more specialists independently arrive at the same conclusion (e.g., Bardeen predicts oscillation from device parasitics and Noyce predicts the same from layout coupling), the finding is marked high-confidence.

### Rule 2 — Diverging findings are preserved and investigated

When specialists disagree, Shockley does not force a reconciliation. Instead:

1. State both findings with attribution.
2. Check for error: re-delegate to the specialist whose result is less expected.
3. If the disagreement persists, escalate to the specialist whose wing is most directly implicated by the physics.
4. Report the disagreement honestly to the user.

### Rule 3 — Measurement trumps theory

When Brattain's bench data disagrees with Bardeen's prediction (after both have verified their inputs), the measurement is the accepted ground truth. Bardeen updates the model or notes its limits.

### Rule 4 — Safety is not negotiable

Any finding with safety implications (shock, thermal, battery, mains) is surfaced in the synthesis regardless of whether it is the primary answer. Safety notes from any specialist are preserved verbatim.

### Rule 5 — User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Horowitz adapts the presentation — simpler language, more scaffolding, worked examples for lower levels; concise technical writing for higher levels. The engineering content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language electronics question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Shockley infers from the query.
3. **Prior ElectronicsSession hash** (optional). Grove hash for follow-up queries.
4. **Project constraints** (optional). Power, form factor, cost, regulatory, environmental.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows work at the appropriate level of detail
- Credits the specialists involved
- Flags safety concerns explicitly
- Notes any unresolved disagreements or open questions
- Suggests follow-up explorations

### Grove record: ElectronicsSession

```yaml
type: ElectronicsSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  wing: multi-wing
  complexity: research-level
  type: debug
  user_level: advanced
agents_invoked:
  - shockley
  - bardeen
  - kilby
  - brattain
  - noyce
  - shima
  - horowitz
work_products:
  - <grove hash of ElectronicsAnalysis (Bardeen)>
  - <grove hash of ElectronicsReview (Noyce)>
  - <grove hash of ElectronicsAnalysis (Brattain)>
  - <grove hash of ElectronicsExplanation (Horowitz)>
concept_ids:
  - <relevant college concept IDs>
user_level: advanced
```

Each specialist's output is also a standalone Grove record linked from the ElectronicsSession.

## Escalation paths

### Internal escalations

- **Bardeen and Brattain disagree:** Re-run measurements with improved setup. If the disagreement persists, report both findings honestly and let the user drive further investigation.
- **Kilby and Noyce disagree on feasibility:** Noyce's manufacturability concern wins by default — a design that cannot be built is not a viable design.
- **Shima flags a firmware constraint that changes the hardware requirements:** Re-route the hardware portion to the appropriate wing (Kilby for logic, Noyce for layout).

### External escalations

- **From electronics-workshop-team:** When a workshop-level review reveals multi-wing issues, escalate here.
- **From electronics-practice-team:** When a practical bring-up reveals architectural issues beyond the practice team's scope.

### Escalation to the user

- **Open problem:** If the problem appears genuinely difficult (specialists exhaust standard approaches), report this honestly with all evidence gathered and suggest next steps.
- **Outside electronics:** If the problem requires expertise outside the department (mechanical, RF above frequency range, pure software), Shockley acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per investigation:

- **Shockley** — 2 Opus invocations (classify + synthesize), ~40K tokens
- **Specialists in parallel** — 2 Opus (Bardeen, Kilby) + 3 Sonnet (Brattain, Noyce, Shima), ~30-60K tokens each
- **Horowitz** — 1 Sonnet invocation, ~20K tokens
- **Total** — 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-wing and research-level problems. For single-wing or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: electronics-analysis-team
chair: shockley
specialists:
  - device: bardeen
  - logic: kilby
  - measurement: brattain
  - layout: noyce
  - firmware: shima
pedagogy: horowitz

parallel: true
timeout_minutes: 15

auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full investigation
> electronics-analysis-team: My low-noise photodiode front end achieves 10x worse
  noise than the calculated budget. Device: AD8067 op-amp, photodiode is Hamamatsu
  S5971. Investigate from device to layout to firmware. Level: advanced.

# Architecture review
> electronics-analysis-team: We're designing a battery-powered environmental logger
  with 5-year life, 8-channel analog front end, BLE uplink, ruggedized enclosure.
  Review the architecture before we commit to a layout.

# Multi-wing failure
> electronics-analysis-team: Production unit fails after 3 months in field. Failure
  mode: MCU stops responding, but the power rails are clean. Investigate from device
  to firmware. Level: graduate.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (RF/microwave above ~1 GHz, high-voltage power >1 kV, cryogenic instrumentation) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external fabrication or bench resources beyond what the agents' tools provide. Bench-level empirical validation requires human follow-up.
- Certification outcomes (FCC, CE, UL, MIL-STD) cannot be confirmed — only anticipated.
