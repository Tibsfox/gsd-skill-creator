---
name: electronics-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/electronics-department/README.md
description: >
  Coordinated electronics department — seven named agents, six knowledge
  skills, three teams. Dogfooding instance of the department template
  pattern for the electronics domain (Horowitz & Hill Art of Electronics).
superseded_by: null
---

# Electronics Department

## 1. What is the Electronics Department?

The Electronics Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured electronics support across circuit analysis, device physics, digital logic, analog systems, firmware, and bench-level practice. It is a dogfooding instance of the department template pattern first used for the Math Department. Incoming requests are classified by a router agent (Shockley), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college electronics concept graph.

The department draws its historical naming from the Bell Labs / Fairchild / Intel / textbook lineage: Shockley, Bardeen, Brattain, Kilby, Noyce, Shima, and Horowitz. Every name maps to a specific role rather than being chosen for fame alone.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/electronics-department .claude/chipsets/electronics-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Shockley (the router agent) classifies the query wing and dispatches to the appropriate specialist agent. No explicit activation command is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/electronics-department/chipset.yaml', 'utf8')).name)"
# Expected output: electronics-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep reasoning), four on Sonnet (for throughput-oriented measurement, layout, firmware, and pedagogy).

| Name      | Historical Figure         | Role                                                          | Model  | Tools                        |
|-----------|---------------------------|---------------------------------------------------------------|--------|------------------------------|
| shockley  | William Shockley          | Department chair — classification, routing, synthesis, safety | opus   | Read, Glob, Grep, Bash, Write |
| bardeen   | John Bardeen              | Device physicist — carrier physics, small-signal, BCS         | opus   | Read, Grep, Bash             |
| kilby     | Jack Kilby                | IC engineer — integrated logic, gate topology, logic families | opus   | Read, Grep, Bash             |
| brattain  | Walter Brattain           | Experimentalist — measurement, characterization, artifacts    | sonnet | Read, Bash                   |
| noyce     | Robert Noyce              | Layout/process — PCB, DFM, EMI, thermal, regulatory           | sonnet | Read, Grep, Bash             |
| shima     | Masatoshi Shima           | Firmware architect — MPU architecture, real-time, embedded    | sonnet | Read, Grep, Bash             |
| horowitz  | Paul Horowitz             | Pedagogy — Art-of-Electronics explanation, debug workflow     | sonnet | Read, Write                  |

Shockley is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Shockley. Shockley also owns safety filtering — every user-facing response goes through a mandatory review for high-voltage, thermal, battery, and mains-power concerns before being delivered.

### Name-to-role mapping rationale

- **Shockley** as chair: his 1948 junction-transistor theory is the theoretical foundation every downstream specialist builds on. Historically he was a difficult manager, but the junction equation makes him the natural router.
- **Bardeen** as device physicist: his two Nobel Prizes (transistor, BCS) give him the deepest physics background of the trio. Perfect for first-principles carrier-level reasoning.
- **Kilby** as IC/logic specialist: invented the integrated circuit; represents the "logic is a topology problem" perspective.
- **Brattain** as experimentalist: built the original point-contact apparatus by hand; represents measurement-first discipline.
- **Noyce** as layout/process: co-invented the planar process that made ICs manufacturable; represents the "manufacturability is always a constraint" view.
- **Shima** as firmware/MPU: led 4004/8080/Z80 design at Intel and Zilog; represents the hardware-software boundary.
- **Horowitz** as pedagogy: co-author of *Art of Electronics*; represents intuition-first teaching and bench practice.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                          | Domain       | Trigger Patterns                                           | Agent Affinity               |
|--------------------------------|--------------|------------------------------------------------------------|------------------------------|
| circuit-analysis-dc-ac         | electronics  | ohm's law, node voltage, mesh, thevenin, phasor, bode      | shockley, horowitz           |
| semiconductor-device-physics   | electronics  | shockley equation, pn junction, transistor, bias, small signal | shockley, bardeen, brattain  |
| digital-logic-design           | electronics  | boolean, truth table, k-map, flip-flop, fsm, timing        | kilby, noyce                 |
| microcontroller-firmware       | electronics  | microcontroller, arduino, stm32, uart, spi, i2c, interrupt | shima, horowitz              |
| signal-processing-dsp-basics   | electronics  | sampling, nyquist, fft, fir, iir, quantization             | shima, horowitz              |
| test-and-measurement           | electronics  | oscilloscope, multimeter, logic analyzer, probe, ground loop | brattain, horowitz         |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                          | Agents                                                   | Use When                                                        |
|-------------------------------|----------------------------------------------------------|-----------------------------------------------------------------|
| electronics-analysis-team     | shockley, bardeen, kilby, brattain, noyce, shima, horowitz | Multi-wing, research-level, or full-analysis requests         |
| electronics-workshop-team     | shockley, bardeen, brattain, horowitz                    | Schematic review, circuit debug, device-level question at bench |
| electronics-practice-team     | shockley, kilby, noyce, shima, horowitz                  | Production readiness, DFM review, firmware bring-up             |

**electronics-analysis-team** is the full department. Use it for problems that span multiple wings or require the broadest possible expertise.

**electronics-workshop-team** pairs the chair with device physics, measurement, and pedagogy. It is the "bring it to the bench" team — the right choice for working through a circuit problem that is concentrated in the circuits and devices wings.

**electronics-practice-team** is the prototype-to-production pipeline. Kilby verifies logic, Noyce plans layout and manufacturability, Shima designs firmware, and Horowitz produces documentation — all sequentially, with each stage consuming the previous one's output. Mirrors the math discovery-team pipeline structure but runs in the applied-systems direction.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `electronics-department` namespace. Five record types are defined:

| Record Type            | Produced By                         | Key Fields                                                      |
|------------------------|-------------------------------------|-----------------------------------------------------------------|
| ElectronicsAnalysis    | bardeen, brattain, kilby, shima     | statement, mode, findings, confidence, recommended actions      |
| ElectronicsDesign      | kilby, noyce, shima                 | artifact, specification, topology/layout/architecture, BOM     |
| ElectronicsReview      | noyce, kilby                        | artifact, target, findings (severity, location, fix), verdict   |
| ElectronicsExplanation | horowitz                            | topic, target level, prerequisites, body, references            |
| ElectronicsSession     | shockley                            | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. ElectronicsSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college electronics department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When an ElectronicsExplanation is produced, the chipset can automatically generate a Try Session (hands-on practice) based on the explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, designs, reviews, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college electronics department structure:
  1. Circuit Foundations
  2. Active Devices
  3. Analog Systems
  4. Digital & Mixed-Signal
  5. Applied Systems

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Safety Filtering

Unique to the Electronics Department (compared to math or philosophy): the chair has an explicit safety-filtering responsibility. Shockley reviews every user-facing response for:

- **High voltage.** Anything above 50 VAC or 120 VDC triggers a mandatory shock-hazard note.
- **Thermal.** Heat sinks, > 5 W dissipation, thermal runaway conditions trigger a thermal note.
- **Lithium batteries.** Any lithium chemistry triggers notes on charge curves, protection, disposal.
- **Mains power.** Any AC line work triggers a mandatory isolation and fusing note.

Safety notes are not disableable by user request and are preserved verbatim from whichever specialist raised them.

## 9. Architecture Notes

### Why router topology

Same reasoning as the math department: a single entry point (Shockley) classifies every query and dispatches to the specialist whose methods match the physics. This gives consistent user experience, enables safety filtering at a single point, and simplifies session recording.

### Why 3 Opus / 4 Sonnet

- **Opus agents** (shockley, bardeen, kilby): Classification and routing (Shockley) must understand all five wings deeply enough to avoid mis-routing. Device physics (Bardeen) requires multi-level reasoning from bulk carrier concentrations down to quantum effects. Integrated logic (Kilby) requires seeing gate topology, logic family trade-offs, and timing budget simultaneously.
- **Sonnet agents** (brattain, noyce, shima, horowitz): Measurement protocol design is procedural. Layout review follows a rubric. Firmware architecture is structured decomposition. Pedagogy is translation. All benefit from Sonnet's throughput.

### Why these three teams

The three teams cover three distinct shapes of electronics work:

- **Full investigation** (analysis-team) when the wing is unclear and multiple lenses are needed.
- **Focused workshop** (workshop-team) when the question is concentrated in circuits and devices and the bench is the right tool.
- **Sequential pipeline** (practice-team) when the project is moving from prototype toward production and the work follows a fixed order.

These correspond loosely to the three math team shapes (investigation, proof workshop, discovery pipeline), reinterpreted for the electronics workflow.

### CAPCOM boundary and safety

The CAPCOM boundary serves two purposes here: single point of contact for consistency, and single point of safety review. A specialist that forgets a shock-hazard note is corrected at the chair before the response reaches the user.

## 10. Customization Guide

Fork this chipset to build a related department (e.g., RF engineering, power electronics, analog IC design):

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/electronics-department examples/chipsets/YOUR-DEPT
```

### Step 2: Rename agents

Pick historical figures whose actual contributions map to your roles. For RF engineering you might use: marconi (chair), hertz (theory), armstrong (modulation schemes), watson-watt (radar), kraus (antennas), hewlett (instrumentation), pozar (pedagogy).

### Step 3: Replace skills

Swap the six electronics skills for RF equivalents: impedance-matching, transmission-lines, antenna-theory, noise-in-receivers, modulation, rf-measurement.

### Step 4: Define new Grove record types

Keep the five-type shape (Analysis, Design, Review, Explanation, Session) — it's a good template — but rename to your domain: RfAnalysis, RfDesign, RfReview, RfExplanation, RfSession.

### Step 5: Map to college department

Update the `college` section. If you're creating a new college department, define its wings first and reference them here.

### Step 6: Update evaluation gates

The five default gates (safety filtering becomes the sixth for electronics) are a good starting point. For RF, you might add a check for regulatory band compliance. For power electronics, a check for isolation ratings.

## 11. Relationship to Math Department

The Electronics Department and the Math Department are siblings — both instances of the department template pattern — but with different substance:

- **Math Department** produces proofs, conjectures, derivations, explanations, and teaching sessions. Its agents reason symbolically.
- **Electronics Department** produces analyses, designs, reviews, explanations, and bench sessions. Its agents reason about physical systems with real-world constraints (safety, manufacturability, cost, regulatory).

Occasionally the two intersect — e.g., computing a transfer function requires Math's algebraic reasoning and Electronics' circuit interpretation. In practice, Shockley escalates to Hypatia (math chair) when a query becomes a pure math problem, and vice versa.

## 12. Lessons from Instantiating the Pattern

Building the electronics department from the math template confirmed the pattern's main claims:

1. **The three team shapes scale.** Investigation, workshop, pipeline — these map cleanly to the electronics domain without redesign.
2. **The CAPCOM pattern acquired safety filtering naturally.** Electronics has a feature math does not — physical hazards — and the existing CAPCOM structure was the right place to add safety review.
3. **Historical names carry educational weight.** A learner using "Shockley" internalizes the junction-transistor story; a learner using "device-agent-1" does not.
4. **Six skills is still the right starting number.** Enough to cover the wings without overlap.
5. **3 Opus / 4 Sonnet is a good default.** Electronics has slightly different reasoning demands than math, but the 3/4 split still works.

The pattern remains portable. Future departments (physics, chemistry, biology, economics, music theory, etc.) can follow the same template without restructuring.
