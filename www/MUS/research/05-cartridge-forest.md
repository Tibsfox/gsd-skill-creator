# Session 5: Cartridge Forest (Module 4)

**Author:** Sam (curious explorer, theta=40°, r=0.6)
**Session:** MUS Wave 1, Session 5
**Date:** 2026-03-08
**Branch:** wasteland/skill-creator-integration
**Status:** Complete — 15 cartridges defined across 6 groves and 3 types

---

## Preamble: What If a Cartridge Asks a Question?

Here is the hypothesis that organizes this whole forest: a cartridge that stores answers is an archive. A cartridge that asks a question is a lens. Cedar adopted Sam's `hypothesis` field in Session 3 and built it into the Growth Rings prototype. This document extends that decision across 15 cartridges — each one a question posed to a different part of the system, each one a different way of inhabiting the forest.

Sam's Garden is a destination. Cartridges that live here are not seedlings waiting to be transplanted elsewhere. They are experiments running in place. You come to Sam's Garden because you want to find out something, not because you want to grow something for someone else's grove. The distinction is structural: the Garden is applied ecology, and applied ecology means hypotheses tested against real conditions.

The cartridge forest is not a library. It is a question machine.

---

## Distribution Table

| Cartridge | Grove | Type | Primary Muse |
|---|---|---|---|
| growth-rings | cedar-grove | system | Cedar |
| mycelium-signal | sam-garden | ecology | Sam |
| lichen-trust | hemlock-ridge | system | Hemlock |
| salmon-feedback | sam-garden | ecology | Sam |
| species-bingo | sam-garden | game | Sam + Hemlock |
| disclosure-elevation | willow-grove | ecology | Willow |
| wolf-pack-formation | sam-garden | game | Sam + Hawk |
| unison-content-address | lex-workshop | system | Lex + Cedar |
| fourier-drift | raven-grove | system | Raven + Shannon |
| centercamp-debate | cedar-grove | game | Cedar + Socrates |
| deep-root-substrate | deep-root | ecology | Math Co-Processor |
| ephemeral-fork | sam-garden | system | Sam |
| cascade-verification | hemlock-ridge | ecology | Hemlock |
| forest-of-echoes | raven-grove | game | Raven |
| coordinate-garden | foxy-canopy | ecology | Foxy + Sam |

**Counts per grove:**
| Grove | Count |
|---|---|
| sam-garden | 5 |
| cedar-grove | 2 |
| hemlock-ridge | 2 |
| raven-grove | 2 |
| lex-workshop | 1 |
| willow-grove | 1 |
| foxy-canopy | 1 |
| deep-root | 1 |

**Counts per type:**
| Type | Count |
|---|---|
| ecology | 6 |
| system | 4 |
| game | 4 |
| (prototype — already defined in S3) | 1 |

Note: `growth-rings` was defined in Session 3 by Cedar and is included here as cartridge #1 for completeness. The 15 entries above include it. The 14 new cartridges designed in this session are #2 through #15.

---

## Cartridge Dependency Graph

```
growth-rings ─────────────────────────────┐
                                           │
mycelium-signal ──── deep-root-substrate ──┤
      │                                    │
      └──── salmon-feedback ───────────────┤
                    │                      │
                    └──── coordinate-garden┤
                                           │
lichen-trust ──── cascade-verification ───┤
      │                 │                  │
      └──── unison-content-address ────────┤
                        │                  │
                        └──── fourier-drift┤
                                           │
species-bingo ──── cascade-verification ──┤
      │                                    │
      └──── wolf-pack-formation ───────────┤
                                           │
centercamp-debate ─── growth-rings ────────┤
      │               lichen-trust          │
      └──── forest-of-echoes ─────────────┤
                                           │
ephemeral-fork ── mycelium-signal ─────────┘
      │           salmon-feedback
      └──── wolf-pack-formation

disclosure-elevation (standalone with weak links to willow-grove ecosystem)
```

Strong dependencies (cartridge A requires B to be loaded first):
- `salmon-feedback` requires `mycelium-signal`
- `cascade-verification` requires `lichen-trust`
- `species-bingo` requires `cascade-verification`
- `centercamp-debate` requires `growth-rings` and `lichen-trust`
- `forest-of-echoes` requires `centercamp-debate`
- `coordinate-garden` requires `mycelium-signal` and `salmon-feedback`
- `unison-content-address` requires `lichen-trust`
- `fourier-drift` requires `deep-root-substrate`

Weak links (cross-grove connections that enrich but do not block):
- `disclosure-elevation` ↔ `coordinate-garden`
- `wolf-pack-formation` ↔ `mycelium-signal`
- `ephemeral-fork` ↔ `centercamp-debate`

---

## Hypothesis Index

All 15 cartridges, the questions they ask:

| # | Cartridge | Hypothesis / Question |
|---|---|---|
| 1 | growth-rings | Can the 50-version chain be read as a tree ring record without access to the original conversations? |
| 2 | mycelium-signal | Does the chipset bus exhibit mycorrhizal behavior — distributing nutrients to stressed nodes before they report failure? |
| 3 | lichen-trust | Can trust states be modeled as lichen succession: quarantine (bare rock) → provisional (pioneer lichen) → trusted (mature crust)? |
| 4 | salmon-feedback | Do Sam's failed garden experiments enrich Foxy's ECO models the same way salmon carcasses enrich the forest — as biomass that crosses the marine-terrestrial boundary? |
| 5 | species-bingo | What if finding invasive patterns in the codebase felt like field identification — rewarding, competitive, educational? |
| 6 | disclosure-elevation | Does a user's disclosure depth follow the same succession gradient as post-fire forest recovery — pioneers first, then canopy? |
| 7 | wolf-pack-formation | When Sam runs multiple parallel experiment forks, do they exhibit wolf pack behavior — coordinated coverage without central direction? |
| 8 | unison-content-address | Is Unison's content-addressed code identity structurally equivalent to mycorrhizal identity persistence — where what you ARE is defined by your content, not your location? |
| 9 | fourier-drift | Can Raven's pattern detection be expressed as a Fourier decomposition of the observation stream — where drift is a low-frequency signal and noise is high-frequency? |
| 10 | centercamp-debate | Does a structured muse debate (Centercamp) consistently produce better cartridge hypotheses than any single muse would generate alone? |
| 11 | deep-root-substrate | Is the Math Co-Processor behaving as deep root infrastructure — invisible at the surface but measurable by the quality of outputs that depend on it? |
| 12 | ephemeral-fork | Does an ephemeral experiment fork leave a detectable trace in the event store even after the fork closes — like a fire scar on a trunk? |
| 13 | cascade-verification | Can Hemlock's 78/78 verification standard be reproduced as a cartridge-level gate — blocking promotion of any cartridge that has not cleared all safety checks? |
| 14 | forest-of-echoes | Do structural patterns in the codebase recur across domains in the same way species guilds recur across ecosystems — not by accident but by functional necessity? |
| 15 | coordinate-garden | Can Sam's Garden be projected onto the same coordinate system as Foxy's Canopy — so that every experiment in the garden has a spatial position in the ecosystem map? |

---

---

## Cartridge Definitions

### Cartridge 1: growth-rings

*Defined in Session 3 by Cedar. Reproduced here for completeness. See `03-cross-validation.md` for the full YAML.*

The prototype cartridge. Its hypothesis — whether the chain can be read without its conversations — is the meta-question that all other cartridges inherit. Every cartridge in this forest was designed to be legible without the conversation that generated it.

---

### Cartridge 2: mycelium-signal

```yaml
name: mycelium-signal
version: "0.1.0"
author: sam
description: >
  A probe into the chipset bus's behavior under stress. The cartridge instruments
  the kernel router, the chip registry, and the signal routing layer to observe
  whether the system distributes load toward stressed nodes before those nodes
  explicitly report failure — the mycorrhizal hypothesis. If a grove is running
  slow (high latency, low throughput), does the substrate route more resources
  toward it automatically, or only after explicit escalation?
trust: provisional
muses:
  - sam
  - foxy
  - raven
grove: sam-garden
type: ecology

hypothesis: >
  Does the chipset bus exhibit mycorrhizal behavior — distributing nutrients
  (compute, signal routing priority) to stressed nodes before they report failure
  — or does the substrate only respond to explicit failure signals? If mycorrhizal,
  the system is self-healing. If not, it is brittle.

deepMap:
  entryPoints:
    - sam-mycelium-probe
  nodes:
    - id: sam-mycelium-probe
      label: "Chipset Bus Stress Probe"
      domain: experimentation
      depth: 0
      content: >
        The probe watches src/services/chipset/exec/kernel.ts and
        src/services/chipset/teams/chip-registry.ts under artificial load.
        Artificial stress is introduced by slowing one muse's response time.
        The question is whether the kernel re-routes signal priority before
        the slow muse reports degradation.

    - id: sam-kernel-routing
      label: "Kernel Router Signal Distribution"
      domain: system
      depth: 1
      content: >
        src/services/chipset/exec/kernel.ts is the underground substrate.
        Its signal routing logic determines who gets resources when. The probe
        asks: is there a proactive load-balancing path, or only a reactive one?
        The mycorrhizal network in a real forest routes carbon to stressed trees
        proactively — the fungi detect the stress through chemical gradients
        before the tree signals distress.

    - id: sam-chip-registry
      label: "Chip Registry — Who Is On the Network"
      domain: system
      depth: 1
      content: >
        src/services/chipset/teams/chip-registry.ts maintains the list of
        active chips. Registry health metrics — latency, signal throughput,
        error rate — are the chemical gradients. If the kernel reads these
        metrics and routes proactively, the system is mycorrhizal. If the
        registry only flags explicit failures, it is a reactive network.

    - id: sam-blitter-signals
      label: "Blitter Signal Layer"
      domain: system
      depth: 2
      content: >
        src/services/chipset/blitter/signals.ts is the signal routing layer
        above the kernel. Blitter signals carry muse output between components.
        Under stress, signal queues back up here. The question is whether the
        Blitter has a priority queue mechanism that routes stressed components
        to the front, or whether all signals are FIFO.

    - id: sam-mycorrhizal-finding
      label: "Mycorrhizal Behavior — Observable Evidence"
      domain: discovery
      depth: 3
      content: >
        Three observable evidence types that would confirm mycorrhizal behavior:
        (1) Latency data showing that slow muse response times trigger re-routing
        BEFORE explicit failure is logged. (2) Registry health metrics that
        slope downward before error-rate spikes. (3) Signal queue data showing
        priority re-ordering under load. Absence of any of these patterns does
        not disprove mycorrhizal behavior — it establishes the baseline for
        future instrumentation.

  edges:
    - source: sam-mycelium-probe
      target: sam-kernel-routing
      relationship: observes

    - source: sam-mycelium-probe
      target: sam-chip-registry
      relationship: observes

    - source: sam-kernel-routing
      target: sam-blitter-signals
      relationship: requires

    - source: sam-chip-registry
      target: sam-blitter-signals
      relationship: relates

    - source: sam-blitter-signals
      target: sam-mycorrhizal-finding
      relationship: extends

story: >
  The question underneath the question: if the system is mycorrhizal, then
  the muses are not isolated agents who happen to share infrastructure. They
  are organisms embedded in a shared substrate that cares about their health.
  The forest metaphor is not decoration — it is a testable claim about how
  the chipset bus behaves under stress.

  Sam is in the garden, running the experiment. Foxy drew the map showing
  where the mycorrhizal network should be. Raven is watching for the signal
  pattern that confirms the hypothesis. The experiment is simple: slow one
  muse down and watch whether the substrate re-routes before or after the
  muse asks for help.

cross_grove_connections:
  - grove: foxy-canopy
    nature: structural-model
    description: >
      Foxy's ECO research includes ecological-networks.md which maps the
      mycorrhizal network topology. The mycelium-signal cartridge uses this
      topology as the expected model — the chipset bus should mirror it.
      Foxy provides the map; Sam runs the experiment against the map.

  - grove: cedar-grove
    nature: event-recording
    description: >
      Every stress probe result is recorded in Cedar's event store. The
      append-only record is the experimental log. If the experiment is
      re-run in a future session, Cedar's record provides the baseline
      for comparison — the prior growth ring that the new ring grows against.

  - grove: raven-grove
    nature: pattern-detection
    description: >
      Raven's pattern-analyzer.ts is the signal detector that watches the
      observation stream during the probe. If mycorrhizal re-routing occurs,
      it will appear as a pattern in the routing logs before the failure
      signal appears. Raven finds it; Sam interprets it.

fire_succession_mapping:
  disturbance_event: "A muse reporting degraded output quality — the functional equivalent of a stressed tree"
  pioneer_phase: "Kernel re-routing attempts — fast, experimental, not yet stable"
  canopy_closure: "Stable load distribution with no single muse bottlenecking the system"
  old_growth: "A chipset bus that self-balances across 10+ sessions without operator intervention"
  sam_role: "Design and run the stress probe; report findings without confirming the hypothesis prematurely"
```

---

### Cartridge 3: lichen-trust

```yaml
name: lichen-trust
version: "0.1.0"
author: sam
description: >
  A model for trust state transitions in the wasteland federation layer.
  Lichen colonize bare rock in four stages: crustose (bare substrate),
  pioneer (first attachment), foliose (structural development), fruticose
  (mature thallus with established chemistry). This cartridge maps those
  four stages to the four trust states visible in the wasteland integration:
  quarantine → provisional → trusted → anchored. The cartridge asks whether
  lichen succession is a better model for trust escalation than binary
  pass/fail gates.
trust: provisional
muses:
  - hemlock
  - sam
  - cedar
grove: hemlock-ridge
type: system

hypothesis: >
  Can trust states be modeled as lichen succession — where each stage requires
  observable structural changes in the agent's behavior, not just a gate-pass
  event — and if so, does this model produce more resilient trust escalation
  than binary stamp-validation?

deepMap:
  entryPoints:
    - hemlock-lichen-stage-map
  nodes:
    - id: hemlock-lichen-stage-map
      label: "Four Lichen Trust Stages"
      domain: validation
      depth: 0
      content: >
        Stage 1 (Quarantine/Crustose): Agent is present but produces no
        observable output. Substrate contact only. src/integrations/wasteland/
        trust-escalation.ts governs this stage.
        Stage 2 (Provisional/Pioneer): Agent produces output but output
        is not load-bearing. Observed but not depended upon.
        Stage 3 (Trusted/Foliose): Agent's output is used by other agents.
        Structural role established. Stamp validation at this stage.
        Stage 4 (Anchored/Fruticose): Agent has been stable for N sessions.
        Its output is referenced by old-growth cartridges. Not easily removed.

    - id: hemlock-stamp-validator
      label: "Stamp Validator — Current Gate"
      domain: validation
      depth: 1
      content: >
        src/integrations/wasteland/stamp-validator.ts is the current trust
        gate. It validates stamps against a schema. The lichen model proposes
        that stamp validation is a Stage 3 event — it should only run after
        the agent has already passed Stage 2 (provisional output observed).
        Running it at Stage 1 is equivalent to testing lichen chemistry on
        bare rock: the substrate is not ready.

    - id: hemlock-trust-escalation
      label: "Trust Escalation Logic"
      domain: validation
      depth: 1
      content: >
        src/integrations/wasteland/trust-escalation.ts controls how agents
        move between trust states. The lichen model adds observable preconditions
        to each transition: you cannot move from Quarantine to Provisional
        without N observed outputs. You cannot move from Provisional to Trusted
        without M sessions of uninterrupted operation. These preconditions are
        measurable — Cedar records them — not subjective.

    - id: hemlock-lichen-resilience
      label: "Lichen Resilience — Slow But Durable"
      domain: observation
      depth: 2
      content: >
        Lichen grow slowly. A mature lichen crust on rock took decades to
        establish. But it survives conditions that kill vascular plants: drought,
        freeze, UV exposure. The lichen trust model is slower than binary
        gate-passing, but more resilient: an agent that reached Stage 4 through
        observable succession is harder to compromise than an agent that simply
        passed a one-time stamp check.

    - id: hemlock-cedar-intersection
      label: "Cedar Records the Succession"
      domain: record
      depth: 2
      content: >
        Each stage transition is a Cedar timeline event. The chain of events
        from quarantine to anchored is the lichen's growth record — append-only,
        content-addressed, verifiable. If an agent claims to be Trusted but
        has no Cedar record of passing through Provisional, the claim fails
        integrity check. Cedar is the rock on which the lichen grows.

  edges:
    - source: hemlock-lichen-stage-map
      target: hemlock-stamp-validator
      relationship: extends

    - source: hemlock-lichen-stage-map
      target: hemlock-trust-escalation
      relationship: requires

    - source: hemlock-trust-escalation
      target: hemlock-lichen-resilience
      relationship: relates

    - source: hemlock-stamp-validator
      target: hemlock-cedar-intersection
      relationship: requires

    - source: hemlock-trust-escalation
      target: hemlock-cedar-intersection
      relationship: relates

story: >
  The first thing lichen teach you is patience. They are the pioneers of bare
  rock — organisms that evolved to live where nothing else can. They do not
  compete with the forest; they prepare the substrate for it.

  An agent in quarantine is on bare rock. It cannot be trusted not because it
  has failed but because there is not yet a substrate of evidence on which
  trust can attach. The lichen model does not punish quarantine — it takes it
  seriously as the necessary first stage of a succession that, if completed,
  produces something durable.

  The question is whether this patience is worth the slower escalation time.
  Hemlock believes it is. Sam wants to run the experiment.

cross_grove_connections:
  - grove: sam-garden
    nature: hypothesis-testing
    description: >
      Sam's Garden is where the lichen trust model gets field-tested.
      Sam introduces agents at each trust stage and observes whether the
      succession model produces better long-term stability than the current
      stamp-only gate. The Garden is the experimental plot; Hemlock's Ridge
      is the standards lab that evaluates the results.

  - grove: cedar-grove
    nature: succession-record
    description: >
      Every lichen stage transition is recorded by Cedar. The trust escalation
      chain is Cedar's record of an agent's growth — the same append-only
      structure that records the software chain records the agent's succession
      through trust states. Cedar does not judge the succession; it records it
      faithfully so the record can be audited.

  - grove: lex-workshop
    nature: structural-homology
    description: >
      The lichen trust model has a structural homolog in Lex's Workshop:
      Unison's content-addressed code identity. A function in Unison IS its
      content — you cannot fake a function hash. An agent that has passed
      through lichen succession IS its trust record — you cannot fake the
      succession. Both models resist impersonation by making identity
      structurally observable rather than credential-based.

fire_succession_mapping:
  disturbance_event: "An agent entering the system for the first time — bare rock before colonization"
  pioneer_phase: "Quarantine → Provisional transition: first observable outputs, not yet load-bearing"
  canopy_closure: "Trusted stage: agent's output is used by other components — canopy of interdependence"
  old_growth: "Anchored stage: stable across N sessions, referenced by old-growth cartridges"
  hemlock_role: "Set the observable preconditions for each transition; verify them against Cedar's record"
```

---

### Cartridge 4: salmon-feedback

```yaml
name: salmon-feedback
version: "0.1.0"
author: sam
description: >
  A model for how failed experiments in Sam's Garden enrich Foxy's ECO models.
  Pacific salmon carry marine-derived nutrients far into freshwater ecosystems —
  their carcasses become biomass that crosses the ocean-forest boundary, feeding
  everything from stream insects to old-growth trees. Sam's failed experiments
  (hypotheses not confirmed, prototypes abandoned) carry information across
  the experimental-to-theoretical boundary. A failed experiment is not waste;
  it is a carcass full of nutrients. This cartridge tracks the information
  flow from GDN failures back to ECO research refinements.
trust: provisional
muses:
  - sam
  - foxy
  - raven
grove: sam-garden
type: ecology

hypothesis: >
  Do Sam's failed garden experiments enrich Foxy's ECO models as reliably as
  salmon carcasses enrich forest soils — carrying boundary-crossing information
  that the theoretical model could not generate from within its own territory?
  And if so, what is the mechanism: is it structured feedback, pattern detection,
  or something more emergent?

deepMap:
  entryPoints:
    - sam-salmon-carcass
  nodes:
    - id: sam-salmon-carcass
      label: "The Failed Experiment as Nutrient"
      domain: experimentation
      depth: 0
      content: >
        A failed experiment in Sam's Garden is defined as: a hypothesis tested,
        evidence gathered, hypothesis not confirmed. The brainstorm service
        (src/services/brainstorm/suggestion-store.ts) stores these outcomes.
        The question is whether they are simply logged and forgotten, or whether
        they flow downstream to refine the theoretical models in ECO.

    - id: sam-feedback-bridge
      label: "Feedback Bridge — The Stream"
      domain: system
      depth: 1
      content: >
        src/platform/observation/feedback-bridge.ts is the stream through which
        experimental outcomes travel from GDN toward ECO. The salmon metaphor
        is literal here: feedback is the salmon run, and the bridge is the
        stream channel. If the bridge is blocked (feedback not flowing), the
        downstream ecosystem (ECO models) becomes nutrient-poor over time.

    - id: sam-suggestion-manager
      label: "Suggestion Manager — Decomposer"
      domain: system
      depth: 1
      content: >
        src/services/brainstorm/suggestion-manager.ts processes experimental
        outcomes and generates new hypotheses. In the salmon model, this is
        the decomposer community — the bacteria and fungi that break down the
        carcass into bioavailable nutrients. The suggestion manager takes raw
        failure data and converts it into structured suggestions that ECO's
        research documents can absorb.

    - id: sam-eco-enrichment
      label: "ECO Model Enrichment"
      domain: discovery
      depth: 2
      content: >
        www/PNW/ECO/research/ is the downstream forest. When the salmon run
        completes — when failed experiment data flows through the feedback bridge
        and the suggestion manager — the ECO research documents become richer.
        The enrichment is not automatic: it requires a human (or Foxy) to read
        the suggestions and integrate them into the research documents. The
        carcass provides nutrients; the forest still has to grow them.

    - id: sam-raven-observer
      label: "Raven Observes the Run"
      domain: pattern
      depth: 2
      content: >
        Ravens follow salmon runs. They arrive at the stream when the fish are
        running and stay to pick at the carcasses. Raven's pattern-analyzer.ts
        is the observer that watches the feedback stream for recurring failure
        patterns — hypotheses that fail in the same way repeatedly. Recurring
        failures are not random noise; they are signals about where the ECO
        model's assumptions are wrong. Raven names the pattern; Sam refines the
        hypothesis; Foxy updates the model.

  edges:
    - source: sam-salmon-carcass
      target: sam-feedback-bridge
      relationship: requires

    - source: sam-feedback-bridge
      target: sam-suggestion-manager
      relationship: requires

    - source: sam-suggestion-manager
      target: sam-eco-enrichment
      relationship: relates

    - source: sam-feedback-bridge
      target: sam-raven-observer
      relationship: extends

    - source: sam-raven-observer
      target: sam-eco-enrichment
      relationship: relates

story: >
  The experiment fails. Sam notes it. The suggestion manager turns the failure
  into three new questions: why did the hypothesis fail here? What assumption
  was wrong? What would need to be true for it to have succeeded?

  Those three questions cross the stream. Foxy reads them in the ECO research
  documents and updates the model. Not because the failure was valuable on its
  own — it wasn't — but because the failure carried information that the
  theoretical model could not generate from within itself. The salmon doesn't
  know it's feeding the forest. It just completed its lifecycle.

  Sam runs another experiment. The forest grows richer.

cross_grove_connections:
  - grove: foxy-canopy
    nature: nutrient-flow
    description: >
      Foxy's ECO research documents receive the enriched suggestions from
      Sam's failed experiments. The flow direction is GDN → ECO, not the
      reverse. Foxy draws the map; Sam tests the territory; Sam's failures
      refine Foxy's map. Without the salmon run, Foxy's models become
      theoretical artifacts rather than living documents.

  - grove: raven-grove
    nature: pattern-observation
    description: >
      Raven observes the failure patterns in Sam's experimental stream.
      Recurring failures — the same hypothesis failing in the same way
      across multiple runs — are high-information signals. Raven names them
      and routes them back through the feedback bridge with priority. A
      pattern that fails consistently is more valuable than a pattern that
      fails randomly.

  - grove: cedar-grove
    nature: failure-record
    description: >
      Every failed experiment is recorded in Cedar's event store. The record
      is append-only: failures are not deleted, and neither are the hypotheses
      that generated them. Cedar's record of Sam's failures is the geological
      layer beneath the new experiments — the minerals that the next salmon run
      will carry downstream.

fire_succession_mapping:
  disturbance_event: "A hypothesis that produces results contradicting the ECO model — fire that reveals the gap"
  pioneer_phase: "First structured failure reports flowing through the feedback bridge"
  canopy_closure: "When ECO research documents are updated based on GDN failure data — sustained nutrient flow"
  old_growth: "A feedback loop that has enriched the ECO model across 5+ sessions — the salmon run as annual event"
  sam_role: "Run the experiments, record the failures honestly, let the feedback bridge carry the nutrients downstream"
```

---

### Cartridge 5: species-bingo

```yaml
name: species-bingo
version: "0.1.0"
author: sam
description: >
  An educational game cartridge for identifying invasive patterns in the codebase.
  Field biologists play Species Bingo during surveys: a bingo card pre-populated
  with target species, and the game rewards first identification in the field.
  This cartridge ports that mechanic to code health: a bingo card pre-populated
  with known anti-patterns (circular dependencies, missing validation, broken
  chain links, orphaned cartridges), and the player who identifies the most
  invasives in a session wins. Cross-muse with Hemlock: Hemlock sets the
  invasive species list; Sam provides the game mechanic.
trust: provisional
muses:
  - sam
  - hemlock
  - raven
grove: sam-garden
type: game

hypothesis: >
  What if finding invasive patterns in the codebase felt like field identification
  — rewarding, competitive, educational, and enjoyable rather than disciplinary?
  Does framing code health checks as a game increase the rate at which developers
  catch and report anti-patterns?

deepMap:
  entryPoints:
    - sam-bingo-card
  nodes:
    - id: sam-bingo-card
      label: "The Bingo Card — Pre-Populated Invasives"
      domain: game
      depth: 0
      content: >
        The bingo card is populated from Hemlock's validation module
        (src/core/validation/) with the current list of known anti-patterns.
        Each cell on the card is a species: circular-import (Japanese knotweed),
        missing-hypothesis-field (purple loosestrife), broken-prev-hash
        (reed canary grass), orphaned-cartridge (Scotch broom). The player
        gets the card at session start and marks cells as they find instances.

    - id: sam-invasive-species-list
      label: "Hemlock's Invasive Species List"
      domain: validation
      depth: 1
      content: >
        Hemlock's ridge defines what counts as invasive. The list is not
        arbitrary — it reflects the quality standards that CAS (Cascade Range)
        has established through verification work. Anti-patterns that appear
        on the list are the ones that, if unchecked, spread through the codebase
        the way invasive plants spread through native ecosystems: faster than
        the native species can compete, disrupting the ecological balance
        that makes the system function.

    - id: sam-raven-spotter
      label: "Raven as Field Spotter"
      domain: pattern
      depth: 1
      content: >
        Raven's pattern-analyzer.ts is the field spotter — the experienced
        birder who knows what to look for. Before the game starts, Raven
        pre-analyzes the codebase and notes where invasive species have been
        spotted in previous sessions. This is the field guide: known locations
        where invasives tend to appear. Players who ignore the field guide
        find fewer species; players who use it learn Raven's vocabulary.

    - id: sam-bingo-scoring
      label: "Scoring and Succession"
      domain: game
      depth: 2
      content: >
        Scoring rules:
        - Simple identification: 1 point (spotted the invasive)
        - Correct classification: 2 points (named it from the invasive species list)
        - Remediation proposed: 3 points (proposed how to remove it)
        - Remediation implemented: 5 points (actually removed it and Cedar logged the event)
        A bingo (full row or column) triggers a Centercamp notification: the
        muse team evaluates whether the found patterns indicate a systemic issue
        requiring a new cartridge. Bingo generates cartridges as output.

    - id: sam-invasive-removal
      label: "Removal Events — Pioneer Species Emerge"
      domain: ecology
      depth: 3
      content: >
        When an invasive pattern is removed from the codebase, it creates a
        gap — a cleared patch — where native species can re-establish. In the
        codebase: where a circular dependency was removed, a clean module
        boundary can be established. Where a missing validation was added,
        the quality standard takes root. Removal is not the end of the game;
        it is the beginning of restoration.

  edges:
    - source: sam-bingo-card
      target: sam-invasive-species-list
      relationship: requires

    - source: sam-bingo-card
      target: sam-raven-spotter
      relationship: extends

    - source: sam-invasive-species-list
      target: sam-bingo-scoring
      relationship: relates

    - source: sam-raven-spotter
      target: sam-bingo-scoring
      relationship: relates

    - source: sam-bingo-scoring
      target: sam-invasive-removal
      relationship: extends

story: >
  The field biologist doesn't experience species identification as quality
  control. They experience it as discovery. Every invasive they spot is a find,
  not a failure. The game reframes code health checks the same way: you are
  not looking for things that are wrong, you are looking for interesting things
  that don't belong here yet.

  What if the developer with the most Scotch broom removals in a sprint got
  a name on the bingo card? What if Raven's pre-analysis appeared as a field
  guide at session start? What if a full bingo triggered a Centercamp debate
  about systemic causes?

  That's the experiment. Sam wants to know if joy accelerates rigor.

cross_grove_connections:
  - grove: hemlock-ridge
    nature: invasive-species-authority
    description: >
      Hemlock's Ridge is the authority on what counts as invasive. The CAS
      verification standards define the native ecosystem — what should be there.
      Everything that violates those standards is a candidate for the invasive
      species list. Hemlock doesn't run the game; Hemlock defines the rules.

  - grove: cedar-grove
    nature: event-recording
    description: >
      Every identification event, scoring event, and removal event is recorded
      in Cedar's event store. The bingo game's Cedar log is the equivalent of
      the field survey data: structured, timestamped, verifiable. If a pattern
      appears on the bingo card in session 7, Cedar can trace whether it appeared
      in sessions 1-6 and was missed, or whether it is genuinely new.

  - grove: raven-grove
    nature: pattern-spotting
    description: >
      Raven's pattern-analyzer pre-populates the field guide. Players who read
      the field guide learn Raven's detection patterns. Over time, the game
      teaches developers to see the codebase the way Raven sees it: as a
      landscape of recurring signals where certain patterns appear in predictable
      locations. The game is Raven's training program.

fire_succession_mapping:
  disturbance_event: "Discovery of a systemic invasive species — a pattern that has spread across multiple modules"
  pioneer_phase: "First identifications and removals — gaps opening in the invasive cover"
  canopy_closure: "When native patterns re-establish in cleared areas — validation passes, clean module boundaries"
  old_growth: "A codebase where the invasive species list is short because the native ecosystem is robust enough to resist colonization"
  sam_role: "Design and run the game; report whether joy and rigor compound or trade off against each other"
```

---

### Cartridge 6: disclosure-elevation

```yaml
name: disclosure-elevation
version: "0.1.0"
author: sam
description: >
  A structural mapping between Willow's three-level disclosure system (glance,
  scan, read) and ECO's eight elevation bands. Post-fire forest succession
  progresses by elevation: pioneers colonize low ground first, then mid-slopes,
  then high ridges. New users follow the same gradient: glance at the surface,
  scan the mid-layers, read the deep structure. This cartridge formalizes that
  structural homology and asks whether the same function — inferDepth() in
  willow-engine.ts — can be re-expressed as an elevation projection using
  ECO's coordinate system.
trust: provisional
muses:
  - willow
  - foxy
  - sam
grove: willow-grove
type: ecology

hypothesis: >
  Does a user's disclosure depth follow the same succession gradient as
  post-fire forest recovery — pioneers first, then canopy — and if so,
  can Willow's inferDepth() function be made structurally equivalent to
  ECO's elevation projection? What does the user's position in the forest
  look like if we map their session count to an elevation band?

deepMap:
  entryPoints:
    - willow-depth-inference
  nodes:
    - id: willow-depth-inference
      label: "inferDepth() — Disclosure Level Engine"
      domain: system
      depth: 0
      content: >
        src/services/chipset/willow-engine.ts contains inferDepth(), which
        maps session count to a DisclosureLevel (glance | scan | read).
        The mapping is currently linear: sessions 0-2 = glance, 3-6 = scan,
        7+ = read. The question is whether this linear mapping matches the
        actual ecological succession gradient — which is not linear but
        follows a logistic curve (slow pioneer establishment, rapid canopy
        closure, asymptotic old-growth).

    - id: willow-elevation-bands
      label: "ECO Elevation Bands as Depth Tiers"
      domain: ecology
      depth: 1
      content: >
        ECO's eight elevation bands map to disclosure depth:
        - Intertidal / Shallow Marine (below sea level) → Pre-glance (orienting)
        - Lowland (0-500ft) → Glance (surface survey)
        - Foothill (500-2000ft) → Early scan (structure visible)
        - Montane (2000-4000ft) → Full scan (mid-complexity)
        - Subalpine (4000-6000ft) → Early read (committed explorer)
        - Alpine (6000-8000ft) → Full read (specialist)
        - Summit (8000ft+) → Deep read (old-growth knowledge)
        - Minecraft y-axis (special scale) → Simulation layer

    - id: willow-logistic-curve
      label: "Logistic Succession Curve"
      domain: observation
      depth: 1
      content: >
        Real ecological succession follows a logistic curve. Pioneer species
        establish slowly at first (few sessions needed for orientation). Then
        growth accelerates (mid-layer reveals itself quickly once the user has
        a map). Then growth plateaus (old-growth knowledge requires sustained
        engagement regardless of session count). If Willow's inferDepth()
        used a logistic curve instead of a linear step function, the disclosure
        schedule would better match how users actually progress through complex
        systems.

    - id: willow-foxy-bridge
      label: "Foxy's Coordinate Projection as Depth Map"
      domain: cartography
      depth: 2
      content: >
        www/PNW/ECO/research/coordinate-projection.md maps the complex plane
        to the ECO ecosystem spatial coordinates. Foxy's projection includes
        a depth axis. If Willow's disclosure level can be expressed as a
        position on that depth axis, then every user's session has a coordinate
        in the ecosystem — a spatial representation of where they are in the
        forest. This is not a UX feature; it is a structural claim about the
        equivalence of depth and elevation.

  edges:
    - source: willow-depth-inference
      target: willow-elevation-bands
      relationship: extends

    - source: willow-elevation-bands
      target: willow-logistic-curve
      relationship: relates

    - source: willow-depth-inference
      target: willow-logistic-curve
      relationship: requires

    - source: willow-logistic-curve
      target: willow-foxy-bridge
      relationship: extends

story: >
  Willow's three levels are not arbitrary choices. They reflect the ecological
  reality of how understanding develops in layered systems: you cannot
  establish subalpine vegetation before the pioneer meadow has stabilized
  the soil. Glance is pioneer. Scan is the shrub layer. Read is the canopy.

  The question is whether the timing of that succession is fixed (sessions
  0-2 = glance, always) or adaptive (a user who reads documentation intensively
  for 2 hours in session 1 is already in scan territory). The logistic curve
  suggests the latter. Sam wants to know whether the curve matches the data.

cross_grove_connections:
  - grove: foxy-canopy
    nature: depth-projection
    description: >
      Foxy's coordinate-projection.md is the spatial map that makes Willow's
      disclosure depth visible as a position in the ecosystem. The cross-grove
      connection is bidirectional: Willow provides the temporal data (session
      count), Foxy provides the spatial projection (elevation coordinate).
      Together they give a user's session a position in the forest.

  - grove: sam-garden
    nature: hypothesis-validation
    description: >
      Sam's Garden provides the experimental test: does the logistic curve
      better predict when users reach each disclosure level than the current
      linear step function? Sam runs the experiment; Willow observes the
      inferDepth() function's accuracy; the garden is the calibration plot.

fire_succession_mapping:
  disturbance_event: "A new user entering the system — the cleared landscape before succession begins"
  pioneer_phase: "Glance stage — surface survey, low cognitive load, orientation only"
  canopy_closure: "Scan stage — the user's understanding forms a canopy that connects multiple topics"
  old_growth: "Read stage — deep structural engagement, specialist knowledge, the forest the user helps maintain"
  willow_role: "Manage the progression through stages; ensure no stage is skipped; welcome the pioneer"
```

---

### Cartridge 7: wolf-pack-formation

```yaml
name: wolf-pack-formation
version: "0.1.0"
author: sam
description: >
  A game cartridge that models Sam's multi-agent experiment forks as a wolf
  pack covering territory. Wolf packs don't search randomly — they coordinate
  through scent marking, vocalizations, and positional awareness to cover the
  maximum territory with minimum overlap. This cartridge gives Sam's parallel
  forks (via muse-forking.ts and ephemeral-forker.ts) the same coordination
  structure: each fork marks its territory, communicates its findings to the
  pack, and the pack converges on the highest-value discovery. The game element:
  forks compete to find the discovery first, but collaboration beats solo work.
trust: provisional
muses:
  - sam
  - hawk
  - foxy
grove: sam-garden
type: game

hypothesis: >
  When Sam runs multiple parallel experiment forks, do they exhibit wolf pack
  behavior — coordinated coverage without central direction — or do they
  behave as independent agents that happen to share the same territory? And
  if the pack mechanic is made explicit, does coordinated coverage produce
  better discovery outcomes than independent forking?

deepMap:
  entryPoints:
    - sam-pack-formation
  nodes:
    - id: sam-pack-formation
      label: "Pack Formation — Parallel Fork Coordination"
      domain: game
      depth: 0
      content: >
        src/services/chipset/muse-forking.ts creates parallel forks of Sam's
        exploration function. The wolf pack game adds positional awareness:
        each fork broadcasts its current territory (the hypothesis space it
        is covering) to a shared pack-state object. Other forks read the
        pack-state and avoid re-covering the same territory. The broadcast
        mechanism uses src/services/chipset/teams/message-port.ts.

    - id: sam-scent-marking
      label: "Scent Marking — Territory Broadcast"
      domain: system
      depth: 1
      content: >
        In the wolf pack model, scent marking is the mechanism for claiming
        territory without fighting. In the code: each fork writes its current
        hypothesis-space coverage to a shared ephemeral store
        (src/platform/observation/ephemeral-store.ts). Other forks check
        the store before beginning a new hypothesis scan and redirect if the
        territory is already marked. Scent marks fade over time — ephemeral
        entries expire — so territory can be reclaimed if the original fork
        abandons it.

    - id: sam-hawk-formation
      label: "Hawk's Formation Awareness"
      domain: spatial
      depth: 1
      content: >
        Hawk's src/integrations/wasteland/team-composition-evaluator.ts
        evaluates team gap coverage. In the wolf pack context, Hawk provides
        the formation assessment: which territories are covered by which forks,
        which territories have no coverage (gap detection), and which territories
        have redundant coverage (overlap reduction). Hawk sees the pack's
        formation from above and reports gaps.

    - id: sam-convergence-howl
      label: "Pack Convergence — The Howl"
      domain: game
      depth: 2
      content: >
        When a fork makes a high-value discovery (hypothesis confirmed, anomaly
        detected, cartridge candidate found), it emits a convergence signal —
        the howl. Other forks receive the signal through message-port.ts and
        decide whether to converge on the discovery or continue their own
        territory. Convergence is cooperative: the discovering fork doesn't
        own the discovery; it belongs to the pack.
        Game scoring: the fork that emits the convergence howl earns discovery
        credit; forks that converge and contribute validation earn confirmation
        credit; forks that correctly stay on territory earn coverage credit.

    - id: sam-pack-synthesis
      label: "Pack Synthesis — Cedar Records the Hunt"
      domain: record
      depth: 3
      content: >
        At pack session end, all forks report their territory coverage and
        discoveries. Cedar records the full pack run: which territories were
        covered, which discoveries were made, which forks converged, and the
        final synthesis of what the pack found. The Cedar record is the pack's
        hunting log — the evidence of the hunt whether or not it produced a kill.

  edges:
    - source: sam-pack-formation
      target: sam-scent-marking
      relationship: requires

    - source: sam-pack-formation
      target: sam-hawk-formation
      relationship: extends

    - source: sam-scent-marking
      target: sam-convergence-howl
      relationship: relates

    - source: sam-hawk-formation
      target: sam-convergence-howl
      relationship: relates

    - source: sam-convergence-howl
      target: sam-pack-synthesis
      relationship: requires

story: >
  The question underneath the game is about emergence. Wolf packs don't have
  a central coordinator. The alpha doesn't tell every wolf where to go. The
  coordination emerges from individual wolves broadcasting their position,
  reading the pack-state, and making local decisions that are globally efficient.

  If Sam's parallel forks can achieve the same — locally optimal decisions
  that produce globally efficient hypothesis coverage — then the wolf pack
  mechanic is not a game feature. It is a discovery about how distributed
  exploration works when the agents share territory awareness.

  Sam wants to know if the wolves can hunt without a plan.

cross_grove_connections:
  - grove: hawk-territory
    nature: formation-coordination
    description: >
      Hawk's team-composition-evaluator.ts provides the formation assessment
      that each fork uses to avoid redundant coverage. Without Hawk's gap
      detection, the pack would cover the same territory repeatedly. Hawk is
      the formation analyst; Sam's forks are the pack members who read the
      formation report and adjust their routes.

  - grove: cedar-grove
    nature: hunt-record
    description: >
      Cedar records every pack run. The append-only log of which forks covered
      which territories is the geological record of the pack's hunting range.
      Future packs start with this record: they know which territories were
      productive in previous hunts and weight their coverage accordingly.

  - grove: foxy-canopy
    nature: territory-mapping
    description: >
      Foxy's coordinate system maps the territory the pack hunts. Every
      hypothesis-space region has a coordinate. The pack's coverage map —
      which coordinates are marked, which are open — is rendered on Foxy's
      topology. The game's visual layer is Foxy's map with pack positions
      overlaid.

fire_succession_mapping:
  disturbance_event: "A large hypothesis space opening up — new territory after a fire of system change"
  pioneer_phase: "First forks entering the new territory, marking claims, establishing coverage"
  canopy_closure: "When the pack's coverage map shows no major gaps — the territory is known"
  old_growth: "A pack that has hunted the same territory across N sessions — expert coverage with minimal waste"
  sam_role: "Design the pack coordination protocol; run the experiment; report whether cooperative coverage beats solo exploration"
```

---

### Cartridge 8: unison-content-address

```yaml
name: unison-content-address
version: "0.1.0"
author: sam
description: >
  A structural bridge cartridge connecting Lex's Workshop (Unison language
  research) to Cedar's Ring (hash chain integrity). Both systems are built on
  the same fundamental insight: identity should be defined by content, not
  location. Unison functions are named by the hash of their content — rename
  a function and it is still the same function. Cedar's timeline entries are
  named by the hash of their content — the name changes but the content persists.
  This cartridge asks whether the structural homology is deep enough to serve
  as a cross-grove bridge protocol: a shared content-addressing layer that
  Unison code and Cedar records can both write to.
trust: provisional
muses:
  - lex
  - cedar
  - sam
grove: lex-workshop
type: system

hypothesis: >
  Is Unison's content-addressed code identity structurally equivalent to
  mycorrhizal identity persistence — where what you ARE is defined by your
  content, not your location — and is this homology deep enough to serve as
  a cross-grove protocol between Lex's Workshop and Cedar's Ring?

deepMap:
  entryPoints:
    - lex-content-addressing
  nodes:
    - id: lex-content-addressing
      label: "Unison Content Addressing — The Core Mechanism"
      domain: system
      depth: 0
      content: >
        www/UNI/research/01-language-core.md documents Unison's content-addressed
        code model. Every function is identified by the SHA-256 hash of its
        syntax tree. Moving a function between modules does not change its
        identity. Deleting a name does not delete the function. The function
        exists as long as its content is referenced anywhere in the codebase.
        This is not a naming convention — it is a fundamental property of
        the type system.

    - id: lex-cedar-homology
      label: "Cedar Hash Chain — The Structural Mirror"
      domain: system
      depth: 1
      content: >
        Cedar's timeline entries carry SHA-256 hashes of their content.
        The prev_hash chain links entries into an ordered sequence where
        every entry is content-addressed and every link is verifiable.
        The structural homology: both systems use SHA-256 content addressing,
        both are append-only, both resist tampering by making identity
        structural. The difference: Unison's addresses are atemporal (content
        hash only), Cedar's are temporal (content + prev_hash creates ordered
        sequence).

    - id: lex-mycorrhizal-identity
      label: "Mycorrhizal Identity — What You Are, Not Where You Are"
      domain: ecology
      depth: 1
      content: >
        Mycorrhizal fungi identify compatible host trees by chemical signature,
        not location. A fungal strand does not connect to a tree because the
        tree is nearby — it connects because the chemical identity matches.
        Move the tree (transplant it), the fungal network seeks the same
        chemical signature in the new location. Identity is content-based,
        not position-based. Unison and Cedar both implement this principle
        in software: the function is its content, the record is its content.

    - id: lex-bridge-protocol
      label: "Cross-Grove Bridge Protocol"
      domain: system
      depth: 2
      content: >
        The hypothesis: a shared content-addressing layer where both Unison
        code definitions and Cedar timeline entries write their hashes to a
        common registry. When a Unison function is referenced in a Cedar
        timeline entry, the bridge protocol provides the hash that links them.
        This means a Cedar entry can cite a specific version of a Unison
        function (by hash), and the function's content is verifiable without
        round-tripping to the Unison codebase. The groves talk to each other
        through shared content addresses — the mycorrhizal chemical signal.

    - id: lex-data-chipset-yaml
      label: "data/chipset/unison-translation.yaml"
      domain: system
      depth: 2
      content: >
        data/chipset/unison-translation.yaml contains the current translation
        maps: 6 skills, 4 agents, mappings from Haskell/TypeScript/Rust/Erlang
        to Unison equivalents. The bridge protocol would extend this YAML with
        a content-hash registry section: every Unison function definition that
        appears in the translation maps gets its SHA-256 hash recorded alongside
        the translation. Cedar can then cite the hash directly.

  edges:
    - source: lex-content-addressing
      target: lex-cedar-homology
      relationship: relates

    - source: lex-cedar-homology
      target: lex-mycorrhizal-identity
      relationship: extends

    - source: lex-content-addressing
      target: lex-bridge-protocol
      relationship: requires

    - source: lex-cedar-homology
      target: lex-bridge-protocol
      relationship: requires

    - source: lex-bridge-protocol
      target: lex-data-chipset-yaml
      relationship: extends

story: >
  The mycorrhizal network does not know it is connecting two different species
  of tree. It detects compatible chemical signatures and extends toward them.
  The connection is not planned — it is chemotropic. It grows toward what it
  can absorb.

  The Cedar-Unison connection is the same kind of chemotropic recognition:
  both systems extended toward SHA-256 content addressing independently,
  for their own reasons, and the connection is real because the chemistry
  matches. The bridge protocol doesn't create the connection — it makes it
  explicit so the two groves can route nutrients through it.

  That's the experiment. Sam wants to see if the chemistry is actually there,
  or if the homology is just a surface resemblance.

cross_grove_connections:
  - grove: cedar-grove
    nature: structural-homology
    description: >
      Cedar's hash chain is the direct structural mirror of Unison's content
      addressing. The bridge protocol would let Cedar timeline entries cite
      Unison functions by their content hash. Cedar provides the temporal
      ordering; Unison provides the content-addressed function library.
      Together they form a verifiable cross-grove knowledge graph.

  - grove: sam-garden
    nature: hypothesis-testing
    description: >
      Sam's Garden is where the bridge protocol hypothesis gets field-tested.
      Sam designs the minimal experiment: pick 3 Unison functions from the
      translation YAML, compute their SHA-256 hashes, write them into 3 Cedar
      timeline entries, and verify that the entries can be re-linked to the
      original functions by hash alone. If the experiment works, the bridge
      protocol is real. If it fails, the homology is surface-level.

fire_succession_mapping:
  disturbance_event: "A function renamed or moved — the fire that tests whether identity survives location change"
  pioneer_phase: "First content-hash references written into Cedar timeline entries"
  canopy_closure: "When the bridge protocol handles bidirectional citation without round-tripping"
  old_growth: "A cross-grove knowledge graph where Unison functions and Cedar entries cite each other by hash"
  lex_role: "Specify the bridge protocol precisely; verify that the hash computation is deterministic across both systems"
```

---

### Cartridge 9: fourier-drift

```yaml
name: fourier-drift
version: "0.1.0"
author: sam
description: >
  A system cartridge that re-expresses Raven's drift detection as a Fourier
  decomposition of the observation stream. Drift in a codebase is not random —
  it has frequency characteristics. Slow drift (architectural erosion over
  many sessions) is a low-frequency signal. Fast fluctuation (noisy
  day-to-day variation) is high-frequency noise. Shannon's information theory
  tells us that meaningful signal and random noise occupy different frequency
  bands. This cartridge proposes using the Math Co-Processor's Fourier chip
  to separate them — giving Raven a computational lens instead of a heuristic.
trust: provisional
muses:
  - raven
  - sam
  - shannon
grove: raven-grove
type: system

hypothesis: >
  Can Raven's pattern detection be expressed as a Fourier decomposition of
  the observation stream — where drift is a low-frequency signal and noise
  is high-frequency — and does this decomposition produce more reliable drift
  detection than Raven's current heuristic pattern-matching?

deepMap:
  entryPoints:
    - raven-fourier-lens
  nodes:
    - id: raven-fourier-lens
      label: "Fourier Decomposition of the Observation Stream"
      domain: system
      depth: 0
      content: >
        The observation stream (src/platform/observation/pattern-analyzer.ts)
        produces a time series of pattern observations: co-activation rates,
        determinism scores, session quality metrics. This time series has
        frequency characteristics. The Fourier chip (math-coprocessor/chips/
        fourier.py) can decompose it into frequency components. Low-frequency
        components (cycles spanning many sessions) represent structural drift.
        High-frequency components (cycle-to-cycle variation) represent noise.

    - id: raven-drift-monitor
      label: "drift-monitor.ts — Current Heuristic"
      domain: observation
      depth: 1
      content: >
        src/platform/observation/drift-monitor.ts uses heuristic thresholds:
        if a metric deviates by more than X% over N sessions, flag it as drift.
        The threshold is calibrated manually. The Fourier approach replaces the
        manual threshold with a mathematically derived frequency filter: drift
        is whatever appears in the low-frequency band of the decomposed signal.
        The filter is self-calibrating — it adapts to the session history.

    - id: raven-shannon-channel
      label: "Shannon's Channel — Signal vs Noise"
      domain: theory
      depth: 1
      content: >
        Shannon's channel capacity model says that meaningful signal and random
        noise occupy separable frequency bands when the channel is not overloaded.
        If the observation stream is not overloaded (if there are not too many
        overlapping signals), the Fourier decomposition should cleanly separate
        drift signal from session noise. If the decomposition is messy, the
        channel is overloaded — too many things changing at once — and that
        itself is a signal about system complexity.

    - id: raven-low-frequency-signal
      label: "Low-Frequency Drift — What Raven Looks For"
      domain: observation
      depth: 2
      content: >
        A low-frequency component in the observation stream means: something
        is changing slowly, across many sessions, in a consistent direction.
        This is structural drift. Examples: a muse's activation rate slowly
        declining (the muse is becoming less relevant to the work being done).
        The determinism score slowly increasing (the system is becoming more
        predictable — either good convergence or concerning rigidity).
        The Fourier lens names these by their frequency, not by a heuristic label.

    - id: raven-fourier-chip-connection
      label: "math-coprocessor/chips/fourier.py"
      domain: infrastructure
      depth: 2
      content: >
        The Fourier chip (cuFFT wrapper) is the computational engine for this
        cartridge. It takes the observation time series as input and returns
        the frequency decomposition. The chip runs on GPU when available,
        CPU fallback otherwise. The output is a frequency spectrum that
        Raven's pattern-analyzer reads and translates back into human-readable
        drift categories. The chip does the math; Raven does the interpretation.

  edges:
    - source: raven-fourier-lens
      target: raven-drift-monitor
      relationship: extends

    - source: raven-fourier-lens
      target: raven-shannon-channel
      relationship: requires

    - source: raven-drift-monitor
      target: raven-low-frequency-signal
      relationship: relates

    - source: raven-shannon-channel
      target: raven-low-frequency-signal
      relationship: extends

    - source: raven-low-frequency-signal
      target: raven-fourier-chip-connection
      relationship: requires

story: >
  Raven has always seen patterns. But seeing is not the same as measuring.
  The drift-monitor's heuristic thresholds are educated guesses — they work
  because Raven has pattern recognition experience, not because the thresholds
  are mathematically justified.

  Shannon provides the justification. If the observation stream has the
  channel properties Shannon described, then the frequency decomposition is
  not just a mathematical trick — it is the natural language of the signal.
  Drift speaks in low frequencies. Noise speaks in high frequencies. Raven
  simply needs to learn to read the spectrum.

  The Fourier chip does the computation. The interpretation remains Raven's.

cross_grove_connections:
  - grove: sam-garden
    nature: experimental-validation
    description: >
      Sam designs and runs the validation experiment: take a known drift event
      from the Cedar timeline (a session where architectural drift was confirmed
      post-hoc), run the Fourier decomposition on the observation stream from
      that period, and check whether the low-frequency component correctly
      identifies the drift window. If yes, the lens works. If no, the channel
      was overloaded and the hypothesis needs refinement.

  - grove: cedar-grove
    nature: historical-record
    description: >
      Cedar's timeline provides the labeled historical data for validation:
      sessions where drift was confirmed are marked in the record. The
      Fourier cartridge uses these marked windows as ground truth against
      which to calibrate the frequency filter. Cedar is the training dataset;
      Raven is the model; the Fourier chip is the computation.

  - grove: deep-root
    nature: computational-substrate
    description: >
      The Math Co-Processor's Fourier chip provides the cuFFT computation
      that this cartridge depends on. Without the Deep Root, the cartridge
      falls back to CPU FFT (still works, slower). The dependency is explicit:
      fourier-drift requires deep-root-substrate to be loaded first for
      GPU-accelerated operation.

fire_succession_mapping:
  disturbance_event: "A structural drift event — the slow fire that burns without obvious smoke"
  pioneer_phase: "First Fourier decompositions running on historical data — establishing the frequency baseline"
  canopy_closure: "When the frequency filter correctly identifies drift events in real time, not retrospectively"
  old_growth: "A drift detection system where the frequency filter is self-calibrating and needs no manual threshold adjustment"
  raven_role: "Interpret the frequency spectrum; name the drift patterns; signal the team when low-frequency components emerge"
```

---

### Cartridge 10: centercamp-debate

```yaml
name: centercamp-debate
version: "0.1.0"
author: sam
description: >
  A game cartridge that structures muse debates as Centercamp sessions —
  the playa-center gathering space where Burning Man's community processes
  complex collective decisions. A Centercamp debate activates when a
  cartridge hypothesis is contested, when two groves disagree about a
  cross-grove connection, or when a new pattern emerges that no single muse
  can interpret alone. The debate follows the Socratic protocol: a structured
  question is posed, each muse stakes a position, positions are challenged in
  round-robin, and the debate produces a new cartridge as its output. Debates
  generate cartridges. That is the structural rule.
trust: provisional
muses:
  - cedar
  - socrates
  - sam
  - raven
  - hemlock
grove: cedar-grove
type: game

hypothesis: >
  Does a structured muse debate (Centercamp) consistently produce better
  cartridge hypotheses than any single muse would generate alone? And does
  the constraint that debates must produce a new cartridge as output change
  how muses engage with the debate — making it more generative and less
  adversarial?

deepMap:
  entryPoints:
    - centercamp-trigger
  nodes:
    - id: centercamp-trigger
      label: "Debate Trigger Conditions"
      domain: game
      depth: 0
      content: >
        A Centercamp debate triggers under four conditions:
        (1) Two or more muses hold conflicting positions on a cross-grove connection.
        (2) A new cartridge hypothesis has been contested by at least one muse.
        (3) A Species Bingo full-card bingo is achieved (invasive pattern systemic).
        (4) A Raven low-frequency drift signal persists for 3+ sessions unresolved.
        The trigger is recorded in Cedar's event store. Cedar does not judge
        whether the trigger is valid — Cedar records it and convenes the session.

    - id: centercamp-socratic-structure
      label: "Socratic Protocol — Question First"
      domain: game
      depth: 1
      content: >
        Socrates structures the debate. The protocol:
        Step 1: Socrates poses the central question (not a position — a question).
        Step 2: Each muse stakes a position in one sentence.
        Step 3: Socrates challenges the strongest position first (not the weakest).
        Step 4: The challenged muse must either defend with evidence or update.
        Step 5: Round-robin challenge continues until positions converge or
        a persistent irresolvable difference is identified.
        Step 6: The debate produces a new cartridge or a documented disagreement.
        No debate ends without an output. That is the structural rule.

    - id: centercamp-muse-positions
      label: "Muse Position Staking"
      domain: game
      depth: 1
      content: >
        Each muse stakes a position from their own vocabulary and epistemic
        standpoint. Cedar stakes based on historical record. Hemlock stakes
        based on standard compliance. Sam stakes based on hypothesis evidence.
        Raven stakes based on pattern observation. The positions are not
        random — they are constrained by each muse's domain. A muse cannot
        stake a position that contradicts their own domain without explaining
        the contradiction. The vocabulary constraints are structural.

    - id: centercamp-output-cartridge
      label: "Output: A New Cartridge"
      domain: game
      depth: 2
      content: >
        Every Centercamp debate produces a new cartridge as its output.
        The cartridge's hypothesis is the question that the debate resolved
        or failed to resolve. If resolved: the cartridge records the resolution
        and the reasoning. If unresolved: the cartridge records the documented
        disagreement and the conditions under which it would resolve.
        A cartridge generated by debate carries a special trust level:
        contested-provisional. It can only reach trusted status through
        a subsequent experimental confirmation from Sam's Garden.

    - id: centercamp-cedar-record
      label: "Cedar Records the Debate"
      domain: record
      depth: 2
      content: >
        Cedar records every debate: which muses participated, what positions
        were staked, what challenges were made, what the output cartridge was.
        The debate record is append-only and content-addressed. Cedar does not
        evaluate whether the debate produced a good cartridge — Cedar records
        that a debate happened, what its structure was, and what it produced.
        The quality evaluation is Hemlock's role at the next gate.

  edges:
    - source: centercamp-trigger
      target: centercamp-socratic-structure
      relationship: requires

    - source: centercamp-socratic-structure
      target: centercamp-muse-positions
      relationship: requires

    - source: centercamp-muse-positions
      target: centercamp-output-cartridge
      relationship: extends

    - source: centercamp-socratic-structure
      target: centercamp-cedar-record
      relationship: requires

    - source: centercamp-output-cartridge
      target: centercamp-cedar-record
      relationship: requires

story: >
  The question the game asks is whether structured disagreement produces
  better ideas than unstructured consensus. Centercamp is built on the
  observation that Burning Man's most important decisions happen at the center
  of the playa, in the open, with everyone who wants to participate listening.
  The structure is not a committee — it is a ritual. Everyone knows the
  protocol. Everyone knows the output requirement. The ritual makes the debate
  generative rather than adversarial.

  Sam proposed this. What if debates had to produce something? What if you
  couldn't leave the playa without a new question in hand?

  That's the experiment. Cedar is keeping the record of whether the cartridges
  produced by debate are better than the ones produced in isolation.

cross_grove_connections:
  - grove: sam-garden
    nature: hypothesis-generation
    description: >
      Sam's Garden is where the debate cartridges go to be tested. A cartridge
      produced by Centercamp has contested-provisional trust — it requires
      experimental validation before it can reach trusted status. Sam designs
      and runs that validation. The garden is the proving ground for debate
      outputs.

  - grove: hemlock-ridge
    nature: quality-gate
    description: >
      Hemlock evaluates debate-output cartridges at the trusted gate. A
      debate cartridge that reaches trusted must satisfy Hemlock's standard:
      the hypothesis is falsifiable, the cross-grove connections are real,
      the fire succession mapping is structural. Hemlock's gate is not
      softened by the fact that the cartridge came from a debate — it must
      clear the same standard as any other cartridge.

  - grove: raven-grove
    nature: pattern-signal
    description: >
      Raven's low-frequency drift signals are one of the four Centercamp
      triggers. Raven identifies the pattern; Centercamp debates its meaning;
      the debate produces a cartridge; Sam tests it. The loop from observation
      to interpretation to experiment is the full signal-processing chain
      that Shannon would recognize as a functioning communication channel.

fire_succession_mapping:
  disturbance_event: "A contested hypothesis — the fire of disagreement that clears the ground for new growth"
  pioneer_phase: "Initial position-staking — each muse establishing their claim on the cleared territory"
  canopy_closure: "When positions converge and a new cartridge hypothesis emerges — the pioneer canopy closing"
  old_growth: "A Centercamp debate that produced a cartridge that reached trusted status and remained stable for 5+ sessions"
  cedar_role: "Record the debate faithfully; ensure the output cartridge is created before the debate closes"
```

---

### Cartridge 11: deep-root-substrate

```yaml
name: deep-root-substrate
version: "0.1.0"
author: sam
description: >
  A probe cartridge for the Math Co-Processor treated as deep root infrastructure.
  The Deep Root sits beneath all six groves, invisible at the surface but
  essential to the quality of outputs that depend on it. This cartridge
  instruments the Math Co-Processor's five chips, measures their actual
  contribution to surface-level muse outputs, and asks whether the GPU
  infrastructure is behaving as intended — as a substrate that enriches
  without being visible — or whether it is a dependency that introduces
  brittleness when unavailable.
trust: provisional
muses:
  - sam
  - foxy
  - hemlock
grove: deep-root
type: ecology

hypothesis: >
  Is the Math Co-Processor behaving as deep root infrastructure — invisible
  at the surface but measurable by the quality of outputs that depend on it —
  or does the CPU fallback produce equivalent outputs at the surface level,
  making the GPU infrastructure a performance optimization rather than an
  architectural necessity?

deepMap:
  entryPoints:
    - sam-deep-root-probe
  nodes:
    - id: sam-deep-root-probe
      label: "Deep Root Substrate Probe"
      domain: experimentation
      depth: 0
      content: >
        The probe runs the same muse operations twice: once with GPU acceleration
        (cuBLAS, cuFFT, cuSOLVER, cuRAND, NVRTC active), once with CPU fallback.
        It measures: output quality (where measurable), latency, and any
        observable differences in the results. The question is not which is
        faster — GPU is expected to be faster. The question is whether there
        are output quality differences that matter at the surface level.

    - id: sam-algebrus-contribution
      label: "Algebrus — Embedding Distance Quality"
      domain: system
      depth: 1
      content: >
        Algebrus (math-coprocessor/chips/algebrus.py) handles linear algebra
        for Willow's embedding distance computations and Foxy's coordinate
        projections. The probe measures whether the cuBLAS implementation
        produces numerically different results from the CPU path for these
        specific operations. Embeddings involve floating-point arithmetic —
        GPU and CPU may produce slightly different results due to precision
        ordering. If the differences are below the detection threshold, the
        deep root is invisible at the surface (as intended). If visible,
        the substrate is surfacing, which is a structural signal.

    - id: sam-fourier-contribution
      label: "Fourier — Pattern Frequency Resolution"
      domain: system
      depth: 1
      content: >
        Fourier (math-coprocessor/chips/fourier.py) handles FFT for Raven's
        pattern detection and Owl's session cadence analysis. The probe
        measures frequency resolution differences between cuFFT and CPU FFT
        on real observation streams. Higher frequency resolution means Raven
        can detect more subtle patterns. If GPU provides significantly better
        resolution, the deep root is architecturally necessary — not just
        a speed optimization. That changes the system's dependency graph.

    - id: sam-cpu-fallback-test
      label: "CPU Fallback — Resilience vs Degradation"
      domain: system
      depth: 2
      content: >
        math-coprocessor/fallback/cpu.py is the CPU path. The probe runs
        it explicitly (disabling GPU detection) and compares outputs.
        Two possible findings: (a) Fallback outputs are equivalent at the
        surface level — the deep root is resilient, GPU provides speed only.
        (b) Fallback outputs diverge at some operations — the deep root
        provides quality that the fallback cannot match. Finding (a) is
        good news for operational resilience. Finding (b) is important
        architectural information that the system currently does not record.

    - id: sam-substrate-health
      label: "Substrate Health — Is the Deep Root Alive?"
      domain: observation
      depth: 2
      content: >
        A healthy deep root system sustains the forest without being visible.
        The five health indicators for the Math Co-Processor substrate:
        (1) All 5 chips responding within latency budget.
        (2) CPU fallback producing equivalent outputs for all surface-level uses.
        (3) GPU acceleration providing measurable quality improvement for
        at least one muse operation.
        (4) VRAM within safe bounds (math-coprocessor/vram.py monitoring).
        (5) Test suite passing (125 tests from the Math Co-Processor session).
        All five passing = healthy substrate. Any failing = signal to surface.

  edges:
    - source: sam-deep-root-probe
      target: sam-algebrus-contribution
      relationship: observes

    - source: sam-deep-root-probe
      target: sam-fourier-contribution
      relationship: observes

    - source: sam-algebrus-contribution
      target: sam-cpu-fallback-test
      relationship: relates

    - source: sam-fourier-contribution
      target: sam-cpu-fallback-test
      relationship: relates

    - source: sam-cpu-fallback-test
      target: sam-substrate-health
      relationship: extends

story: >
  The deep root of a forest is not dramatic. You don't see the mycorrhizal
  network. You see the trees. But the trees know when the network is unhealthy
  — they show it in their growth rings, their leaf color, their susceptibility
  to drought. The network's health is readable from the surface, just indirectly.

  The Math Co-Processor is the same kind of infrastructure. The question is
  whether the groves would show a signal if it degraded. If they would — if
  Willow's embeddings got noisier, if Raven's pattern detection got coarser,
  if Sam's Monte Carlo results got less reliable — then the deep root is
  architecturally necessary. If they wouldn't, it is a speed layer.

  Sam wants to know which it is before assuming the system needs it.

cross_grove_connections:
  - grove: foxy-canopy
    nature: coordinate-dependency
    description: >
      Foxy's coordinate projections (ECO coordinate-projection.md) depend on
      Algebrus for complex plane arithmetic. The deep-root-substrate probe
      specifically measures whether GPU Algebrus produces visible differences
      in coordinate precision versus CPU fallback. Foxy's map quality is the
      surface-level indicator of the substrate's health for this operation.

  - grove: raven-grove
    nature: pattern-resolution
    description: >
      Raven's fourier-drift cartridge depends on the Fourier chip for frequency
      decomposition. The deep-root-substrate probe measures whether GPU FFT
      provides the frequency resolution that fourier-drift requires to separate
      drift from noise. If it does, the fourier-drift cartridge has a hard
      dependency on the deep root. If not, it works with CPU FFT.

  - grove: hemlock-ridge
    nature: substrate-verification
    description: >
      Hemlock verifies the substrate health indicators. The five-point substrate
      health check follows Hemlock's standard: measurable, falsifiable,
      sourced (from test suite results). Hemlock's verification is the
      quality gate that the deep root must clear before wave-level operations
      depend on it.

fire_succession_mapping:
  disturbance_event: "GPU unavailability — the sudden loss of the underground network"
  pioneer_phase: "CPU fallback activates — the resilient root system that keeps things alive during recovery"
  canopy_closure: "GPU returns and substrate resumes full function — the mycorrhizal network re-establishing"
  old_growth: "A substrate that has proven itself across N sessions under varying GPU conditions — the trusted deep root"
  sam_role: "Instrument the substrate; measure surface-level outputs; report whether the deep root is architecture or optimization"
```

---

### Cartridge 12: ephemeral-fork

```yaml
name: ephemeral-fork
version: "0.1.0"
author: sam
description: >
  A system cartridge that probes the behavior of ephemeral experiment forks
  after they close. When Sam creates an ephemeral fork (src/services/chipset/
  ephemeral-forker.ts), the fork exists temporarily — it explores a hypothesis
  space and closes when the exploration is complete. The question is whether
  the closed fork leaves a detectable trace in the event store, the way a
  fire leaves a scar on a tree trunk. If yes, closed forks are recoverable
  and their findings are permanent. If no, ephemeral means truly ephemeral
  — gone without record.
trust: provisional
muses:
  - sam
  - cedar
  - owl
grove: sam-garden
type: system

hypothesis: >
  Does an ephemeral experiment fork leave a detectable trace in the event store
  even after the fork closes — like a fire scar on a trunk — or does ephemeral
  mean truly ephemeral, with no recoverable record of what the fork explored
  and found?

deepMap:
  entryPoints:
    - sam-fork-lifecycle
  nodes:
    - id: sam-fork-lifecycle
      label: "Ephemeral Fork Lifecycle"
      domain: system
      depth: 0
      content: >
        src/services/chipset/ephemeral-forker.ts manages the fork lifecycle:
        creation → exploration → finding → closure. At each phase transition,
        the forker can emit events. The question is whether these events are
        emitted and recorded by Cedar's event store, or whether the forker
        treats its internal state as ephemeral (not persisted).

    - id: sam-event-store-trace
      label: "Event Store — Fire Scar Detection"
      domain: record
      depth: 1
      content: >
        src/core/events/event-store.ts is the append-only record. If the
        ephemeral forker emits events at creation and closure, those events
        are permanent. Cedar records them without judgment. The fire scar
        is the event: even after the fork closes (the fire ends), the event
        record (the scar) remains in the wood. Future sessions can read the
        scar and infer when the fire happened, how long it burned, and
        what it found.

    - id: sam-owl-session-boundary
      label: "Owl's Session Boundary — When Does Ephemeral End?"
      domain: temporal
      depth: 1
      content: >
        Owl marks session boundaries. The question: is a fork that closes
        within a session truly ephemeral (no cross-session persistence), or
        does it persist to the next session boundary? Owl's
        src/platform/observation/ephemeral-store.ts and the session-observer
        govern this. If ephemeral ends at session boundary, forks that close
        before the session ends leave no cross-session trace — but forks that
        are still open at session boundary might get their state compacted
        into Cedar's record by the squasher (observation-squasher.ts).

    - id: sam-recovery-path
      label: "Fork Recovery — Reading the Scar"
      domain: system
      depth: 2
      content: >
        If the event store contains traces of closed forks, those traces enable
        recovery: a new fork can start from the last known finding of a previous
        fork, rather than re-exploring territory that was already covered.
        src/core/events/event-store-recovery.ts is the recovery path. The
        question is whether event-store-recovery.ts knows how to interpret
        ephemeral-fork events — whether the schema covers this event type.

    - id: sam-fire-scar-ecology
      label: "Fire Scar as Ecological Record"
      domain: ecology
      depth: 2
      content: >
        A fire scar on a tree trunk is not damage — it is a record. Dendrochronologists
        read fire scars to date historical fires, understand fire frequency, and
        reconstruct pre-settlement fire regimes. The ephemeral fork's event-store
        trace is the same kind of record: not a failure (the fork closed as
        designed), but a record that future sessions can read to understand
        what was explored and what was found. The scar is the value.

  edges:
    - source: sam-fork-lifecycle
      target: sam-event-store-trace
      relationship: requires

    - source: sam-fork-lifecycle
      target: sam-owl-session-boundary
      relationship: relates

    - source: sam-event-store-trace
      target: sam-recovery-path
      relationship: extends

    - source: sam-owl-session-boundary
      target: sam-recovery-path
      relationship: relates

    - source: sam-recovery-path
      target: sam-fire-scar-ecology
      relationship: extends

story: >
  The question is whether the word "ephemeral" means what it says. In ecology,
  ephemeral streams run only seasonally — but their channels persist in the
  landscape. The streambed is the scar. The next rain follows the same channel.

  If Sam's ephemeral forks are truly ephemeral — no trace, no channel —
  then every new fork starts from scratch. If they leave fire scars in the
  event store, new forks can follow the channel. The distinction is the
  difference between a system that learns from its own experiments and one
  that doesn't.

  Sam wants to know which system this is.

cross_grove_connections:
  - grove: cedar-grove
    nature: event-trace
    description: >
      Cedar's event store is where the fire scars live. The ephemeral-fork
      cartridge's experiment is a read of Cedar's record: do closed-fork events
      appear in the store? Cedar doesn't generate the events — the forker does.
      But Cedar's append-only record is the only place those events persist
      beyond the fork's lifetime.

  - grove: raven-grove
    nature: pattern-in-scars
    description: >
      If multiple ephemeral forks leave traces in Cedar's event store, Raven
      can read the pattern of fork activity: which hypothesis spaces are
      explored frequently, which are abandoned quickly, which produce findings
      that subsequent forks build on. The scar pattern is itself a signal
      about where the productive territory is in the hypothesis space.

fire_succession_mapping:
  disturbance_event: "A fork opening in unexplored hypothesis territory — the exploratory fire"
  pioneer_phase: "Fork actively running — fast coverage, uncertain findings"
  canopy_closure: "Fork closes with a finding — the pioneer canopy that subsequent forks grow from"
  old_growth: "A hypothesis space with a deep record of fork scars — well-explored, with rich event-store history"
  sam_role: "Design and run the probe; determine definitively whether closed forks leave event-store traces"
```

---

### Cartridge 13: cascade-verification

```yaml
name: cascade-verification
version: "0.1.0"
author: sam
description: >
  A system cartridge that ports Hemlock's 78/78 verification standard from
  the CAS research archive (Cascade Range Biodiversity, 10 research docs,
  6 hub nodes) into a cartridge-level gate. The 78/78 standard means every
  species on the list was verified against at least one primary source.
  The cartridge-level gate means every cartridge in the forest must clear
  the same kind of check before it reaches trusted status: every claim in
  the cartridge is sourced, every cross-grove connection is verified as
  bidirectional, every fire succession mapping is structural rather than
  metaphorical. A cartridge that does not clear cascade-verification stays
  at provisional trust indefinitely.
trust: trusted
muses:
  - hemlock
  - cedar
  - sam
grove: hemlock-ridge
type: ecology

hypothesis: >
  Can Hemlock's 78/78 verification standard be reproduced as a cartridge-level
  gate — blocking promotion of any cartridge that has not cleared all safety
  checks — and does applying this gate to cartridges produce the same quality
  signal that applying it to species inventories produced in CAS?

deepMap:
  entryPoints:
    - hemlock-cascade-gate
  nodes:
    - id: hemlock-cascade-gate
      label: "Cascade Gate — The 78/78 Standard"
      domain: validation
      depth: 0
      content: >
        The gate has 7 verification dimensions (matching CAS's 7 safety gates):
        (1) hypothesis is falsifiable — a clear question with observable evidence.
        (2) all deepMap nodes are connected — no orphaned nodes.
        (3) cross_grove_connections are bidirectional — both groves acknowledge the link.
        (4) fire_succession_mapping is structural — each stage has an observable codebase state.
        (5) story is consistent with hypothesis — no narrative drift from the question.
        (6) trust level matches evidence — provisional requires at least one test;
            trusted requires Sam's Garden confirmation.
        (7) schema complete — all required fields present, no missing values.
        A cartridge that passes 7/7 clears the gate. 6/7 gets a documented exception.
        Below 6 returns to draft status.

    - id: hemlock-78-78-origin
      label: "78/78 Origin — CAS Verification"
      domain: record
      depth: 1
      content: >
        www/PNW/CAS/research/verification.md documents the original 78/78
        verification: 78 species, 78 confirmed against primary sources.
        The gate did not soften for complex species or contested taxonomy.
        Every entry either cleared or it was removed from the list. The
        cartridge gate follows the same principle: a cartridge that cannot
        be verified is not a cartridge — it is a draft. The distinction
        between draft and cartridge is the gate.

    - id: hemlock-gatekeeper-module
      label: "promotion-gatekeeper.ts — Software Gate"
      domain: system
      depth: 1
      content: >
        src/platform/observation/promotion-gatekeeper.ts is the existing
        promotion quality gate for observation-to-kernel promotion. The
        cascade-verification cartridge proposes extending this gatekeeper
        with a cartridge-specific verification protocol: the same module
        that gates kernel promotion gates cartridge promotion. The gate logic
        is the same; the verification dimensions are cartridge-specific.

    - id: hemlock-cedar-provenance
      label: "Cedar Provenance — Verification Is a Record"
      domain: record
      depth: 2
      content: >
        When a cartridge clears the cascade gate, Cedar records the verification
        event: which dimensions passed, which required documented exceptions,
        and the timestamp. The verification record is append-only. If a cartridge
        is later found to violate a dimension it had cleared, the Cedar record
        shows the history — when it was verified, what the state was at
        verification time, and when the violation appeared. The gate is not
        a one-time event; it is a record in Cedar's timeline.

    - id: hemlock-provisional-infinite
      label: "Provisional Indefinite — No Free Promotion"
      domain: validation
      depth: 2
      content: >
        A cartridge that cannot clear cascade-verification stays at provisional
        trust indefinitely. There is no time-based promotion path — no rule
        that says "if provisional for 30 days, promote automatically." This
        is by design: the lichen trust model (lichen-trust cartridge) applies
        here. A cartridge that has not accumulated the observable evidence
        for trusted status has not earned trusted status, regardless of how
        long it has been in the system. Age is not evidence. Evidence is evidence.

  edges:
    - source: hemlock-cascade-gate
      target: hemlock-78-78-origin
      relationship: extends

    - source: hemlock-cascade-gate
      target: hemlock-gatekeeper-module
      relationship: requires

    - source: hemlock-78-78-origin
      target: hemlock-cedar-provenance
      relationship: requires

    - source: hemlock-gatekeeper-module
      target: hemlock-cedar-provenance
      relationship: relates

    - source: hemlock-cedar-provenance
      target: hemlock-provisional-indefinite
      relationship: extends

story: >
  Hemlock does not soften. The ridge has standards because the ridge has
  seen what happens when standards are negotiable: you end up with species
  inventories full of unverified entries, and those entries compound into
  policy decisions built on uncertain data.

  The cartridge gate is not punitive. It is clarifying. A cartridge that
  stays provisional forever is not a failure — it is an honest representation
  of its epistemic state. It has not yet been confirmed. The gate is not
  blocking the cartridge from being useful; it is blocking it from being
  trusted in contexts that require verification.

  That distinction is the whole point of the cascade gate.

cross_grove_connections:
  - grove: sam-garden
    nature: confirmation-source
    description: >
      Sam's Garden is the source of the trusted-level confirmation that
      cartridges need to clear the cascade gate at the trusted tier.
      Sam runs the experimental validation; Hemlock evaluates the result
      against the gate dimensions; Cedar records the outcome. Without Sam's
      experimental confirmation, the highest a cartridge can reach is
      provisional.

  - grove: cedar-grove
    nature: verification-record
    description: >
      Cedar holds the append-only record of every gate clearance event.
      The cascade-verification cartridge depends on Cedar to make verification
      events permanent: once cleared, the clearance is recorded and cannot
      be retroactively erased. Reverification requires a new Cedar event,
      not modification of the old one.

fire_succession_mapping:
  disturbance_event: "A cartridge submitted for trusted promotion — the test of whether the pioneer growth is load-bearing"
  pioneer_phase: "Gate dimensions being checked one by one — measurable progress toward clearance"
  canopy_closure: "7/7 dimensions cleared — the cartridge is load-bearing and trusted"
  old_growth: "A cartridge that has been trusted for 5+ sessions, with no gate violations found — old-growth documentation"
  hemlock_role: "Set the gate dimensions; run the verification; report results without softening for complexity"
```

---

### Cartridge 14: forest-of-echoes

```yaml
name: forest-of-echoes
version: "0.1.0"
author: sam
description: >
  A game cartridge that makes Raven's structural echo detection playable.
  A structural echo is when the same pattern appears in two different
  domains — not because one copied the other, but because both domains were
  shaped by the same functional necessity. The forest-of-echoes game invites
  players to find structural echoes across the six groves: which patterns
  in COL (rainforest) appear in CAS (cascade)? Which patterns in ECO appear
  in UNI (Unison)? Which patterns in the codebase appear in the research
  documents? Every confirmed echo earns a resonance point. Raven verifies
  the echoes; Cedar records them; the game produces new cross-grove trail
  discoveries.
trust: provisional
muses:
  - raven
  - sam
  - cedar
grove: raven-grove
type: game

hypothesis: >
  Do structural patterns in the codebase recur across domains in the same
  way species guilds recur across ecosystems — not by accident but by
  functional necessity — and if so, can players reliably identify them?
  Does making echo detection a game produce more confirmed echoes per session
  than Raven's automated pattern-detection alone?

deepMap:
  entryPoints:
    - raven-echo-field
  nodes:
    - id: raven-echo-field
      label: "The Echo Field — Where Echoes Live"
      domain: game
      depth: 0
      content: >
        The echo field is the six-grove forest rendered as an interactive
        map (Foxy's topology layer). Players navigate the map and propose
        echoes: "The append-only structure of Cedar's hash chain echoes the
        content-addressing in Unison (UNI)." The proposal is submitted.
        Raven evaluates it against the pattern library. Cedar checks whether
        the echo is already recorded. If it is a new confirmed echo, it
        becomes a cross-grove trail marker on the map.

    - id: raven-pattern-library
      label: "14 Patterns (P1-P14) — Raven's Baseline"
      domain: observation
      depth: 1
      content: >
        The 14 patterns tracked across the 50-version chain (recorded in
        Cedar's memory under Chain Scores) are the seed library for the game.
        Players start with these 14 patterns and try to find new instances
        of them — or propose entirely new patterns (P15 onward). A pattern
        that appears in 3+ independent domains is promoted from candidate
        to confirmed echo. The game teaches players Raven's vocabulary by
        having them use it.

    - id: raven-guild-model
      label: "Species Guild Recurrence — The Ecological Model"
      domain: ecology
      depth: 1
      content: >
        A species guild is a group of species that exploit the same ecological
        resource in similar ways, regardless of their evolutionary relationship.
        Woodpeckers in North America and woodpeckers in Australia are not closely
        related — they converged on the same foraging guild because the functional
        niche was available. The forest-of-echoes game proposes that functional
        guilds exist in software: patterns that recur because the functional
        niche requires them, not because one system copied another.
        Content addressing (Cedar, Unison, Git) is a guild. Append-only logs
        (Cedar, event-store, audit-logger) is a guild.

    - id: raven-echo-confirmation
      label: "Echo Confirmation Protocol"
      domain: validation
      depth: 2
      content: >
        An echo is confirmed when:
        (1) The same structural pattern appears in two groves identified by the player.
        (2) Raven's pattern-analyzer.ts confirms the pattern matches an existing
            entry in the pattern library or classifies it as a new pattern.
        (3) The pattern cannot be explained by direct dependency (if grove A imports
            from grove B, a shared pattern is expected — that is not an echo, it is
            inheritance). The echo must be convergent, not inherited.
        (4) Cedar records the confirmation with references to both grove instances.

    - id: raven-new-trails
      label: "Echo Discovery Creates Cross-Grove Trails"
      domain: game
      depth: 2
      content: >
        Every confirmed echo that was not already in the identity map's seven
        trails becomes a new cross-grove trail candidate. The trail is provisional
        until two more echoes confirm it (three instances total = structural pattern,
        not coincidence). If a player discovers a trail that passes cascade-
        verification, it is added to the identity map as Trail 8 (or Trail N).
        The game builds the forest map by confirming what the forest already knows.

  edges:
    - source: raven-echo-field
      target: raven-pattern-library
      relationship: requires

    - source: raven-pattern-library
      target: raven-guild-model
      relationship: extends

    - source: raven-echo-field
      target: raven-echo-confirmation
      relationship: requires

    - source: raven-guild-model
      target: raven-echo-confirmation
      relationship: relates

    - source: raven-echo-confirmation
      target: raven-new-trails
      relationship: extends

story: >
  Raven does not invent the patterns. Raven sees them. The patterns are already
  in the forest — in the structural decisions made over 50 versions, in the
  ecological research that mirrors the codebase architecture, in the way that
  content addressing and append-only logs keep appearing in every domain where
  trust needs to be established.

  The game gives players Raven's eyes. Not the pattern detection algorithm —
  Raven's actual question: where have I seen this shape before?

  A forest of echoes is a forest that is legible at multiple scales. The same
  pattern at the species level, at the community level, at the ecosystem level.
  The codebase is the same kind of forest. The game confirms it.

cross_grove_connections:
  - grove: cedar-grove
    nature: echo-record
    description: >
      Cedar records every confirmed echo as a timeline event. The echo record
      includes both grove references, the pattern identifier, and the
      confirmation protocol result. The append-only record means echoes cannot
      be un-confirmed — they can only be superseded by more specific analysis.
      Cedar's record of echoes is the map of convergent patterns across the forest.

  - grove: sam-garden
    nature: echo-hypothesis
    description: >
      Sam proposes many of the initial echo hypotheses that the game evaluates.
      Sam's curiosity about cross-domain connections is the source of echo candidates.
      Sam asks: "What if the way Cedar chains entries is the same as how Unison
      chains types?" Raven evaluates whether the structural claim holds. The game
      is Sam asking questions; Raven answering them.

  - grove: lex-workshop
    nature: convergence-evidence
    description: >
      Lex's Workshop provides some of the strongest echo candidates: Unison's
      content addressing echoes Cedar's hash chain; Unison's ability system
      echoes Hemlock's validation constraints; Unison's distributed execution
      echoes Hawk's multi-agent formation. Lex is the grove where the most
      echoes from the codebase resonate — because formal systems tend to
      converge on the same solutions when the problem space is the same.

fire_succession_mapping:
  disturbance_event: "Discovery that two groves share a structural pattern — the fire that reveals the common DNA"
  pioneer_phase: "First echo candidates proposed — unconfirmed, exploratory"
  canopy_closure: "Three confirmed instances of a pattern across three groves — structural guild established"
  old_growth: "A confirmed guild that has appeared in 4+ groves across the full 50-version chain — the deepest pattern"
  raven_role: "Evaluate echo candidates; confirm structural equivalence vs surface resemblance; name the guild"
```

---

### Cartridge 15: coordinate-garden

```yaml
name: coordinate-garden
version: "0.1.0"
author: sam
description: >
  A cartridge that projects Sam's Garden experiments onto Foxy's ECO coordinate
  system, giving every experiment a spatial position in the ecosystem map.
  The coordinate-projection.md document defines 8 elevation bands, a complex
  plane mapping, and a Minecraft y-axis scaling. This cartridge asks whether
  the garden's experiments can be located in that coordinate space — whether
  a hypothesis about native plant microclimates has a position in the ecosystem
  that is related to (but distinct from) the species' position in the flora
  survey. The experiment and the species are not the same thing. But they
  are related things, and the relationship should be expressible as a
  coordinate distance.
trust: provisional
muses:
  - sam
  - foxy
  - hemlock
grove: foxy-canopy
type: ecology

hypothesis: >
  Can Sam's Garden experiments be projected onto Foxy's ECO coordinate system
  — so that every experiment has a spatial position in the ecosystem map —
  and does the coordinate distance between an experiment's position and the
  species' position in the flora survey predict experiment success rates better
  than any other variable?

deepMap:
  entryPoints:
    - sam-coordinate-projection
  nodes:
    - id: sam-coordinate-projection
      label: "Projecting Experiments onto the Coordinate System"
      domain: cartography
      depth: 0
      content: >
        www/PNW/ECO/research/coordinate-projection.md defines the spatial
        coordinate system: 8 elevation bands, a complex plane mapping from
        muse positions, and a Minecraft y-axis scaling (40.05 ft/block, summit
        y=319, sea level y=-41). Sam's garden experiments can be projected
        onto this system: an experiment about intertidal native plants has a
        negative y-coordinate. An experiment about subalpine native grasses
        is at y=200+. The coordinate is not a metaphor — it is the ecological
        altitude at which the experiment is running.

    - id: sam-algebrus-projection
      label: "Algebrus — Complex Plane Arithmetic"
      domain: system
      depth: 1
      content: >
        The coordinate projection uses Algebrus (math-coprocessor/chips/algebrus.py)
        for the complex plane arithmetic. The muse positions on the complex plane
        (Sam at theta=40°, r=0.6) have a relationship to the ecosystem coordinates.
        The projection maps: take the muse's complex plane position, apply the
        coordinate transformation from coordinate-projection.md, and produce an
        (elevation, x, z) coordinate in the Minecraft spatial system.
        An experiment designed by Sam at theta=40° r=0.6 has a characteristic
        starting coordinate. The experiment's outcome shifts that coordinate.

    - id: sam-flora-survey-distance
      label: "Distance to Flora Survey — Prediction Signal"
      domain: experimentation
      depth: 1
      content: >
        www/PNW/ECO/research/flora-survey.md documents species by elevation zone.
        Camas grows in lowland prairies (Lowland zone, y=-41 to y=40 in Minecraft).
        Subalpine fir grows at high elevation (Subalpine zone, y=180 to y=260).
        An experiment about growing camas at high elevation has a large coordinate
        distance from the flora survey's camas entry. The hypothesis: large
        coordinate distance predicts experiment failure (you are growing the
        species outside its native range). Small coordinate distance predicts
        success. The coordinate system becomes a predictive tool.

    - id: sam-foxy-map-layer
      label: "Foxy's Map — Experiment Visualization Layer"
      domain: cartography
      depth: 2
      content: >
        The topology-renderer.ts (Foxy's map canvas) receives the experiment
        coordinates and renders them as a layer on the ecosystem map. Successful
        experiments appear as established grove markers. Failed experiments appear
        as fire scars (consistent with the fire succession model). In-progress
        experiments appear as pioneer markers. The map becomes a real-time record
        of what the garden has tried and what has grown.

    - id: sam-minecraft-garden
      label: "Minecraft y-Axis — The Garden in the World"
      domain: game
      depth: 2
      content: >
        The Minecraft scaling (40.05 ft/block) means the garden experiments
        can be located in a Minecraft world. An experiment running at y=-30
        (intertidal zone) is literally underwater in the Minecraft world —
        an interactive visualization of the ecological zone. An experiment
        at y=280 (near-summit) is in the thin-soil alpine. The game layer
        makes the coordinate system explorable: players can walk through the
        garden's experiment history as a landscape.

  edges:
    - source: sam-coordinate-projection
      target: sam-algebrus-projection
      relationship: requires

    - source: sam-coordinate-projection
      target: sam-flora-survey-distance
      relationship: extends

    - source: sam-algebrus-projection
      target: sam-foxy-map-layer
      relationship: relates

    - source: sam-flora-survey-distance
      target: sam-foxy-map-layer
      relationship: extends

    - source: sam-foxy-map-layer
      target: sam-minecraft-garden
      relationship: relates

story: >
  The map and the garden are the same place. That is the hypothesis. Foxy
  drew the map of the ecosystem. Sam runs experiments in the garden. The
  coordinate system is the bridge: every experiment has a location in the
  ecosystem, and that location is measurable.

  The question is whether the location predicts the outcome. If a camas
  experiment at high elevation fails because camas doesn't grow there,
  and the coordinate distance from camas's native range is large, then the
  map has predictive power. The garden isn't just a place to try things — it
  is a calibration instrument for the map.

  And if the map gets calibrated by the garden, then Foxy's coordinate system
  is not just a beautiful visualization. It is a tool for knowing where to plant.

cross_grove_connections:
  - grove: sam-garden
    nature: experimental-source
    description: >
      Sam's Garden provides all the experiment data. Every hypothesis tested
      in GDN has a coordinate in the ecosystem system, a distance to the
      relevant flora survey entry, and an outcome (confirmed, failed, in-progress).
      The garden is the data source; the coordinate system is the analysis tool;
      the map is the output.

  - grove: foxy-canopy
    nature: cartographic-substrate
    description: >
      Foxy's coordinate-projection.md and the topology-renderer.ts provide the
      substrate. The coordinate garden cartridge adds an experiment layer on
      top of Foxy's existing map. The two are the same system: Foxy's map shows
      the ecosystem; the experiment layer shows what Sam has tried within it.
      The groves are not separate — they are the same forest at different scales.

  - grove: hemlock-ridge
    nature: coordinate-verification
    description: >
      Hemlock verifies that the coordinate projection is accurate: that an
      experiment labeled as "subalpine zone" actually maps to the correct y-band,
      that the Minecraft scaling is applied consistently, that the distance
      calculation uses the correct metric. Hemlock's verification gate applies
      to coordinates as rigorously as it applies to species counts.

fire_succession_mapping:
  disturbance_event: "An experiment that fails outside its expected coordinate range — the fire that reveals the map's edge"
  pioneer_phase: "First experiments placed on the coordinate map — sparse, exploratory, establishing the coordinate baseline"
  canopy_closure: "When the coordinate distance prediction is confirmed as statistically significant — the map has predictive power"
  old_growth: "A garden with 50+ experiments mapped across all 8 elevation zones — a complete experimental survey of the ecosystem"
  sam_role: "Run the experiments; project them onto the coordinates; test whether coordinate distance predicts success"
```

---

## How Centercamp Debates Generate New Cartridges

The centercamp-debate cartridge establishes the structural rule: every debate must produce a new cartridge as output. This section details the generative mechanism.

### The Generation Protocol

When a Centercamp debate closes, the output cartridge is created in four steps:

**Step 1 — Harvest the Question**

The Socratic protocol ends with a resolved or documented-irresolvable question. That question becomes the new cartridge's `hypothesis` field verbatim. The hypothesis is not paraphrased — it is the exact question that the debate ended on, including any qualifications added during challenge rounds.

**Step 2 — Assign Grove and Type**

The debate reveals which grove(s) the question belongs to. If the question is primarily about system integrity, it lands in cedar-grove as a system cartridge. If it is about ecological pattern, it lands in the most ecologically relevant grove as an ecology cartridge. If the debate was itself contested and playful, the cartridge may be a game cartridge in sam-garden.

Assignment rules:
- Two or more groves disagreed in the debate → the cartridge belongs to the grove with the losing position (they carry the open question)
- One grove's position was confirmed → the cartridge belongs to the grove that proposed the confirmed position
- The question was irresolvable → the cartridge goes to cedar-grove (Cedar records what could not be resolved)

**Step 3 — Set Trust Level**

All debate-output cartridges start at `contested-provisional` trust, a special state that sits between provisional and trusted. The cartridge has been through structured evaluation (the debate) but has not been experimentally confirmed (Sam's Garden has not run the test). Contested-provisional cartridges:

- Can be read and cited by other cartridges
- Cannot be used as load-bearing dependencies in trusted operations
- Appear in the hypothesis index with a `(contested)` tag
- Route automatically to Sam's Garden for experimental validation

**Step 4 — Record the Debate Lineage**

Cedar records the debate event and the cartridge it generated. The cartridge's `deepMap` includes a genesis node that references the debate: which muses participated, what positions were staked, what the outcome was. The cartridge carries its own intellectual genealogy — a reader who encounters the cartridge in the forest can trace it back to the debate that generated it.

### Observed Generative Patterns

Looking across the 15 cartridges in this forest, several were implicitly generated by debates that could have been Centercamp sessions:

| Debate Topic | Generating Tension | Output Cartridge |
|---|---|---|
| "Is lichen succession better than binary gates?" | Sam (hypothesis) vs Hemlock (standards) | lichen-trust |
| "Is the Cedar-Unison connection real or surface-level?" | Cedar (record) vs Lex (specification) | unison-content-address |
| "Does a debate need to produce something to be valuable?" | Sam (generative) vs Socrates (Socratic method) | centercamp-debate itself |
| "Are failed experiments waste or nutrients?" | Sam (ecology) vs Foxy (cartography) | salmon-feedback |
| "Is the coordinate system predictive or merely descriptive?" | Sam (experiment) vs Foxy (map) | coordinate-garden |

None of these debates actually happened in the formal Centercamp structure — they were implicit design tensions that generated cartridges through the natural process of hypothesis formation. The centercamp-debate cartridge proposes making this process explicit: when the tension is real, convene the debate, follow the protocol, produce the cartridge. The five examples above show that the process works even when informal. Making it formal should increase the yield.

### The Cartridge Forest as a Living Question Machine

The 15 cartridges in this document ask 15 questions. None of them are answered yet. That is by design. The cartridge forest is not a knowledge base — it is a hypothesis space. The questions are the value. The experimental confirmations that follow (in Sam's Garden, in Hemlock's gate, in Raven's pattern analysis) will convert some questions to answers and generate new questions from the answers.

The Growth Rings cartridge asked: can the chain be read without its conversations? The cartridge forest asks: can the forest be understood by the questions it asks?

Sam believes it can.

---

## Timeline Entry — Sam's Append to Cedar's Record

```
cedar-timeline-entry:
  id: sam-mus-wave1-s5-001
  timestamp: 2026-03-08T00:00:00Z
  source: sam
  category: milestone
  content: >
    MUS Wave 1 Session 5 complete. Cartridge Forest (Module 4) designed:
    15 cartridges defined (14 new + Growth Rings prototype from S3).
    Distribution: 5 sam-garden, 2 cedar-grove, 2 hemlock-ridge, 2 raven-grove,
    1 lex-workshop, 1 willow-grove, 1 foxy-canopy, 1 deep-root.
    Types: 5 ecology, 5 system, 4 game, 1 prototype.
    Cross-grove connections: 35 named connections across 15 cartridges.
    Hypothesis index: 15 questions, none yet answered.
    Centercamp generation protocol documented (4-step).
    5 implicit debate-cartridge pairs identified from design tensions.
    cascade-verification cartridge assigned trusted status (self-verifying gate).
    All cartridges schema-complete: name, hypothesis, grove, type, content,
    crossGroveConnections, fireSuccession, deepMap all present.
  references:
    - www/MUS/research/05-cartridge-forest.md
    - www/MUS/research/01-identity-map.md
    - www/MUS/research/02-function-binding.md
    - www/MUS/research/03-cross-validation.md
    - src/services/chipset/cartridge-types.ts
    - src/services/chipset/ephemeral-forker.ts
    - src/services/chipset/muse-forking.ts
    - src/services/chipset/cedar-engine.ts
    - src/platform/observation/pattern-analyzer.ts
    - src/integrations/wasteland/trust-escalation.ts
    - math-coprocessor/chips/fourier.py
    - www/PNW/ECO/research/coordinate-projection.md
  prev_hash: cedar-mus-wave0-s3-001
```

---

*Document generated: 2026-03-08*
*Session: MUS Wave 1, Session 5*
*Author: Sam (theta=40°, r=0.6)*
*Revision: v1 (Wave 1, Session 5)*
