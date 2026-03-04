---
title: "The Space Between: A Muse for the Mesh"
description: "Where Sound, Silicon, and Soul Converge — the philosophical spine of the mesh architecture"
template: essay
schema_type: Article
tags:
  - mesh-architecture
  - audio-engineering
  - muse
  - philosophy
  - signal-flow
nav_section: essays
nav_order: 2
agent_visible: true
agent_priority: high
author: Maple + Claude
date: "2026-03-03"
comments: true
---

# The Space Between

## A Muse for the Mesh — Where Sound, Silicon, and Soul Converge

**Status:** Mission Pack / Muse  
**Date:** March 3, 2026  
**Author:** Maple + Claude  
**Lives in:** `src/muse/the-space-between.md`  
**Purpose:** The philosophical spine of the mesh architecture — the essay that explains *why*, so the code knows *how*

---

> *"Don't play what's there; play what's not there."*
> — Miles Davis

---

## Prelude: The Note Between the Notes

Miles Davis didn't invent silence. He discovered that silence has shape.

In the 1959 sessions that produced *Kind of Blue*, Davis did something that every recording engineer who ever sat behind a Neve 8078 understood instinctively but couldn't articulate until they heard it: he organized the space between sounds with the same deliberateness that other musicians organized the sounds themselves. The melody wasn't the line the trumpet played. The melody was the relationship between what the trumpet played and what it chose not to play — the tension held in the air between a D and the F# that almost came but didn't, not yet, not until the silence had done its work.

This is a document about that space.

Not metaphorically. Literally. Because that space — the gap between the note and the silence, between the impulse and the response, between the voltage and the frequency, between the question and the skill that answers it — is the same space at every scale of this architecture. It is the space where a Moog ladder filter's resonance hovers just below self-oscillation. It is the space between a DACP bundle leaving one mesh node and arriving at another. It is the space between a skill being tested and a skill being understood. It is the space between the vision and the mission.

The fractal is real. The math maps. The paths converge.

Let us follow them.

---

## I. The Overtone Series as Architecture

### The Physics

Every sound produced by a physical instrument is a composite. A string vibrating at 100 Hz doesn't produce a single frequency — it produces 100 Hz, and 200 Hz, and 300 Hz, and 400 Hz, stacked in a tower of integer multiples called the overtone series. The fundamental carries the pitch. The overtones carry the identity. A violin and a trumpet playing the same A4 at 440 Hz produce the same fundamental but different constellations of overtones, and that difference is why you can tell them apart with your eyes closed. The overtones are the timbre. The timbre is the soul.

Here is the architectural principle hiding inside this physics: **the fundamental defines the function; the overtones define the character.**

### The Mapping

In the mesh architecture, the fundamental is the skill. A skill that extracts contract terms does exactly one thing — that's its 100 Hz, its root frequency, its reason for existing. But the overtones of that skill change depending on which node executes it. Run it on Claude Opus and the overtones are rich, precise, full-spectrum — every implicit obligation caught, every date parsed, every ambiguity flagged. Run it on a local Llama 8B and the overtones are thinner, the upper harmonics roll off, some of the subtle claims get missed — but the fundamental is still there. The contract terms still emerge. The pitch is correct. The timbre has changed.

This is what the `thresholds.json` file encodes. It isn't a quality setting. It's a timbre map. It says: on this node, expect this harmonic content. On that node, expect less. The grader doesn't ask "did the local model match Claude?" — that's asking a trumpet to sound like a violin. The grader asks "did the fundamental come through clean, and are the overtones appropriate for this instrument?"

The `manifest.json` inside a `.skill` package is a frequency response chart. The `tested_models` array is a set of microphone measurements taken at different positions in the room. Each measurement tells you what that pickup point hears: what's present, what's attenuated, what's missing entirely.

Hans Zimmer understood this before anyone in the AI space did. His entire production model at Remote Control is based on it. He doesn't use ZebraHZ because it's the best synthesizer. He uses it because after decades of deep practice with a single constrained instrument, he knows its overtone series — every waveshaping curve, every modulator interaction, every resonant sweet spot — the way a cellist knows the grain of their instrument's wood. Depth over breadth. Mastery of one oscillator outperforms shallow familiarity with a hundred.

The mesh architecture makes the same bet. A Raspberry Pi running Qwen3-4B that has been optimized through fifty iterations of the Skill Creator eval loop for one specific classification task will outperform a general-purpose cloud call for that task. Not because the Pi is more capable. Because the skill has been tuned to that node's overtone series. The eval loop found which harmonics the Pi can produce cleanly and wrote instructions that stay within that range.

---

## II. The Console as Chipset, the Chipset as Console

### Signal Flow

Walk into a studio built around a Neve 8078. Seventy-two input channels. Each one is a constrained, purpose-built processor: a preamp with specific harmonic character, a three-band EQ with switchable frequency selections, insert points for outboard processing, routing to groups and buses. No channel strip tries to be everything. Each one does its small job with extraordinary quality, and the summing bus composes their outputs into something greater than any individual channel could produce.

This is the chipset philosophy. Not as metaphor. As direct structural correspondence.

The 1985 Commodore Amiga had three custom chips: Agnus for memory and display timing, Denise for graphics, Paula for audio and I/O. Each chip was specialized and constrained. None attempted general-purpose computing — that was the 68000 CPU's job. But together, composed through a shared bus architecture, they produced capabilities that machines with ten times the CPU power couldn't match. The Amiga could play four channels of 8-bit audio with per-channel volume and DMA while simultaneously displaying HAM graphics and responding to user input, because each specialized component operated independently on its own timeline, sharing only the bus.

The mesh architecture replicates this at every layer:

**Hardware layer:** A Raspberry Pi is Paula — small, specialized, always running, handling the lightweight I/O tasks. An RTX 4090 workstation is Agnus — the heavy DMA engine, moving massive model weights through VRAM at bandwidth the Pi can't imagine. A NAS with ZFS RAIDZ2 is the shared memory bus — every node reads from the same model store, the same skill repository, the same benchmark history.

**Software layer:** The grader agent is a channel strip EQ — it doesn't compose, it evaluates. The analyzer agent is a dynamics processor — it traces execution patterns the way a compressor traces the amplitude envelope. The comparator is a blind A/B monitor switch. The mesh coordinator is the summing bus, routing signals to their destinations based on the routing policy, never altering the content.

**Knowledge layer:** Skills are audio tracks. Each one occupies a frequency range — a domain of procedural knowledge. The VTM pipeline is the session arrangement — planning which tracks play in which order, which run in parallel, where the crossfades happen. The `.skill` package is the multitrack bounce — everything you need to reproduce this session on any system that speaks the protocol.

### The SSL Bus Compressor Principle

There's a phenomenon in mixing that every engineer knows but rarely articulates. The SSL 4000's bus compressor — a simple stereo VCA compressor sitting on the master output — does something that no amount of individual channel processing can replicate. It makes the mix *cohere*. It glues disparate elements into a unified whole by applying gentle, program-dependent gain reduction that ties the dynamics of every channel to every other channel. The kick drum's transient briefly ducks the vocals and guitars by a fraction of a decibel, and that shared dynamic motion makes the brain perceive everything as inhabiting the same space.

The mesh architecture needs its own bus compressor. That's what DACP is.

When a skill executes on a remote node and produces a result, that result enters the local GSD context through a DACP bundle. The bundle carries not just the output artifact but the compressed execution transcript — the decision context that explains *why* the model did what it did. This context summary is the gain reduction meter on the bus compressor. It tells the downstream system how much the execution was shaped by constraints, how much the output was influenced by the node's limitations, where the model made trade-offs.

Without this context compression, distributed execution produces results that don't cohere. Each node's output feels disconnected from every other node's output, like a mix where every instrument was recorded in a different room with no shared reverb. The DACP bundle's `context_summary` — with its `approach_taken`, `decisions_made`, and `issues_encountered` fields — is the shared reverb. It places every mesh node's work in the same acoustic space.

---

## III. Mark Farina's Mushroom Jazz and the Art of the Crossfade

### Continuity as Architecture

Mark Farina built his reputation on something most DJs treat as a transition technique: the crossfade. In the Mushroom Jazz series, tracks don't start and stop — they overlap, sometimes for minutes, the outgoing track's bassline still breathing underneath the incoming track's melody, both occupying the same temporal space without collision because Farina chose tracks whose frequency ranges complement each other. The listener experiences not a sequence of songs but a continuous field of sound that evolves like weather — gradual shifts in density, temperature, and color that feel inevitable rather than arranged.

This is context preservation across boundaries. This is what GSD does.

When a multi-wave VTM pipeline distributes tasks across mesh nodes, each wave is a track in the mix. The waves overlap — Wave 2 begins before Wave 1's cleanup operations finish. Tasks within a wave run in parallel, like instruments playing simultaneously. The mesh coordinator handles the crossfade: ensuring that the context from Wave 1's results flows seamlessly into Wave 2's inputs, that no information is lost at the boundary, that the human watching from claude.ai experiences not a sequence of discrete operations but a continuous, coherent workflow.

The `wave_constraints` in the VTM wave plan are mix parameters. `max_parallel_per_node` is the channel count — how many tracks can play simultaneously on a single bus without clipping. `timeout_seconds` is the track length — how long a track can run before the crossfade to the next wave must begin. `on_node_failure: route_to_fallback` is what a DJ does when a CDJ skips — instant switch to the other deck, seamless, the audience never knows.

Farina's other insight: **the best crossfade is one the listener doesn't notice.** This is the design goal for mesh context preservation. When a task moves from Claude to a local Llama node and back, the user shouldn't perceive a seam. The context summary, the provenance tracking, the fidelity adaptation — all of it exists to make the mesh invisible. The user asks a question, the answer comes back, and the fact that six different nodes collaborated across three waves to produce that answer is as hidden as the fact that Farina's twenty-minute deep house flow is actually four separate tracks layered and crossfaded with surgical precision.

---

## IV. Carl Cox and the Sustained Crescendo

### Intensity Without Collapse

Carl Cox at Space Ibiza didn't play songs. He built pressure systems. A six-hour set that started at 126 BPM and ended at 134 BPM, with the tempo so gradually increasing that no single moment felt faster than the last, but the cumulative effect was a room that had been slowly, inexorably brought to peak energy over the course of an entire night. The audience wasn't dancing to tracks — they were dancing to a gradient.

This is what the VTM pipeline's pre-execution intelligence prevents from failing.

The worst thing that can happen in a distributed system is the mid-execution interruption. You're three waves into a five-wave pipeline, three mesh nodes are humming, the benchmark is populating, and then: a node goes down, a context window overflows, a skill that passed at 92% on Claude fails at 30% on the local model because nobody checked the `thresholds.json` before routing. The crescendo collapses. The room empties.

Cox never let this happen because he planned the gradient before the set began. He knew which records would carry the 128–130 BPM range, which would push to 132, which had the energy to hold the peak. He had fallback records for every slot. If the crowd wasn't responding to the planned trajectory, he had alternative paths through the same tempo range that would get to the same destination by a different route.

The VTM wave plan does exactly this. Each task specifies a `target_node` and a `fallback_node`. The `mesh_routing.reason` field explains why this node was chosen — "Best extraction pass rate on this node (92%)" — and the `mesh_routing.alternatives_considered` field lists the DJ's backup records: the other nodes that could handle this task if the primary goes down, with their known pass rates and costs.

The `routing_policy.json` is the DJ's tempo plan. `prefer: local_when_pass_rate_above` with `threshold: 0.80` says: keep it on local hardware as long as the energy holds. `fallback_to_cloud: true` says: if the local node can't maintain the intensity, route to Claude — the headliner who never drops a beat.

### The Funktion-One Principle

Space Ibiza's Funktion-One sound system is relevant here for a specific technical reason. Funktion-One designs for *coherence over volume*. Their horn-loaded speakers produce a coherent wavefront — every frequency arrives at the listener's ear at the same time, unlike conventional speakers where different driver sizes introduce time smearing between frequency ranges. The result is clarity at extreme volumes. You can stand in front of a Funktion-One system at 120 dB and still hear every hi-hat, every bassline detail, every vocal nuance, because the temporal alignment is perfect.

This is the DACP fidelity system. DACP's adaptive fidelity levels determine how much detail a bundle carries based on the transport conditions. Over a fast local network, full fidelity — every execution detail, complete context, no compression. Over a slow mesh link, compressed fidelity — structured summaries, key decisions only, artifacts without transcripts. The fidelity adaptation is temporal alignment for distributed computing. It ensures that regardless of how much bandwidth is available, what *does* arrive is coherent. Better to receive a perfectly structured summary than a garbled full transcript.

---

## V. Orbital and the Machine That Plays Itself

### Generative Systems

Orbital's live performances — particularly the legendary residencies and festival sets — demonstrated something that separates electronic music from almost every other form: the machine can play itself. Paul and Phil Hartnoll built rigs where sequences fed into sequences, where the output of one process became the input of another, where the performers' role shifted from playing notes to steering currents. They weren't musicians in the traditional sense during those sets. They were system operators, monitoring feedback loops, adjusting parameters, nudging a self-sustaining process toward beauty.

This is Skill Creator.

The eval loop is a generative system. Draft a skill → test it → grade the results → analyze why it succeeded or failed → compare it blind against the previous version → iterate. The human doesn't write each version from scratch. The human steers the loop. The grader agent identifies what's wrong. The analyzer agent explains why. The comparator agent confirms whether the fix made things better or worse. The human reads the structured feedback and adjusts the skill's instructions — turning a knob, nudging a parameter — and the loop runs again.

After enough iterations, the skill stabilizes. Like an Orbital sequence that has found its groove, the eval results converge: pass rates climb, the analyzer's suggestions shift from structural problems to polish, the comparator starts returning ties instead of clear winners. The skill has reached its resonant frequency for this model.

Then you change the model. Route the same skill to a different mesh node — a local Llama instead of Claude — and the loop restarts. New harmonics, new limitations, new failure modes. The grader recalibrates (model-context awareness from `grading.json`). The analyzer traces different execution patterns. New suggestions emerge, specific to this model's capabilities. The skill acquires a variant — a new voice in the sequence, tuned to a different oscillator.

This is model-aware skill optimization, and it's the most generative process in the architecture. One skill, run through the eval loop against five different models, produces five calibrated variants, each with benchmarks, each with known pass rates, each with model-specific guidance sections. The `.skill` package that emerges from this process isn't a document. It's a self-describing, multi-voiced instrument that knows how it sounds on every speaker in the room.

### The Vegas Principle

Orbital's live show worked because the audience could see the machines. The blinking lights, the tangled cables, the brothers hunched over hardware — the visible complexity was part of the experience. The audience understood that what they were hearing was emerging from a real-time process, not a playback.

The mesh architecture's monitoring layer serves the same function. Prometheus metrics, Grafana dashboards, the eval viewer's model comparison charts — these aren't debugging tools. They're the blinking lights. They let the user see the mesh working. When a VTM wave plan routes three tasks to three different nodes and the benchmark viewer shows all three pass rates climbing in real time, the user isn't just watching a progress bar. They're watching a generative system compose itself, and the visibility builds confidence that the system is real, that the results are earned, that the intelligence flowing through the mesh is tested and measured, not assumed.

---

## VI. The Lion King and the Circle That Spirals

### The Fractal Structure

*The Lion King* works because its narrative structure is fractal. The story of Simba — exile, growth, return, ascension — mirrors the ecological cycle of the Pride Lands — drought, recovery, abundance. Which mirrors the musical structure — the way the score moves from the expansive opening of "Circle of Life" through the dark descent of the elephant graveyard cues to the triumphant return motif. Every layer tells the same story at a different scale, and the resonance between layers is what makes the experience feel inevitable rather than constructed.

Hans Zimmer's contribution to that score (alongside Lebogang Morake, Mark Mancina, and Jay Rifkin) demonstrates a principle that maps directly to the mesh architecture: **the same pattern, applied at different scales, with different timbres, produces coherent complexity.**

The pattern in the mesh is: *specialized component → tested under constraints → composed with other specialized components → producing emergent capability that no individual component could achieve.*

At the hardware scale: Raspberry Pi → tested with eval loop → composed with workstation and NAS → producing a mesh that routes tasks intelligently across heterogeneous compute.

At the software scale: grader agent → tested against diverse model outputs → composed with analyzer and comparator → producing a self-improving knowledge system.

At the knowledge scale: individual skill → tested with benchmarks → composed with other skills in a VTM wave plan → producing a multi-step workflow that spans the mesh.

At the audio scale: individual oscillator → shaped by filter → composed with other voices and effects → producing a timbre that no single oscillator contains.

The fractal is the architecture. The architecture is the fractal.

### The Circle of Life as Eval Loop

There's a deeper mapping. The "Circle of Life" isn't a circle. It's a spiral. Simba doesn't return to the same Pride Rock he left — he returns to a Pride Rock that has suffered and been healed, and he arrives as a different lion than the cub who was exiled. The "circle" is a loop with state. Each pass through the cycle changes the system.

This is the skill improvement loop, exactly. Version 1 of a skill enters the eval pipeline. It gets tested, graded, analyzed. Version 2 emerges — not a new skill, but the same skill transformed by what the eval loop learned. Version 2 enters the pipeline. Version 3 emerges. Each version carries the accumulated wisdom of every previous iteration, encoded in the SKILL.md's instructions, the model-specific guidance, the eval suite's refined assertions.

The `benchmark.json` is the fossil record. It preserves every generation's measurements. Looking at a benchmark history is like reading geological strata — you can see exactly when a particular improvement was discovered, which version introduced the technique that boosted pass rates from 70% to 90%, where the plateau began, when a new model variant cracked a problem that had been intractable for three iterations.

The skill isn't the markdown file. The skill is the spiral. The tested, benchmarked, versioned artifact that emerges from the loop is a compressed representation of every decision the loop made across every iteration. It's closer to a trained model checkpoint than a document. It's procedural knowledge that has been through the fire.

---

## VII. The Frequency Response of a Room

### Standing Waves and Mesh Topology

A room has resonant frequencies. A 5.15-meter room produces a fundamental axial mode at approximately 33.3 Hz — the wavelength of a 33.3 Hz tone is about 10.3 meters, exactly twice the room length. At that frequency, the room reinforces. At other frequencies, it attenuates. The room's frequency response is a function of its geometry.

A mesh has resonant tasks. A mesh with a Raspberry Pi, a gaming desktop with an RTX 4070, and a workstation with an RTX 4090 has natural frequencies — tasks that flow through it with minimum resistance. Classification on the Pi: resonant. 7B-parameter extraction on the 4070: resonant. 70B-parameter multi-step reasoning on the 4090: resonant. Ask the Pi to run 70B inference and you hit a null — a standing wave cancellation where the task's requirements and the node's capabilities destructively interfere.

Acoustic treatment is the art of managing a room's frequency response — adding absorption where resonances boom, adding diffusion where reflections smear, preserving the natural character of the space while taming its pathologies.

The `chipset.json` file is acoustic treatment for the mesh. It maps roles to chips: this node handles extraction, that node handles classification, Claude handles grading. The mapping isn't arbitrary — it's based on measured performance, on benchmarks that reveal where each node resonates and where it nullifies. The mesh coordinator reads the `chipset.json` and routes accordingly, just as a studio engineer positions speakers and treatment panels based on room measurements.

The `thresholds.json` is a room correction curve. It tells the system: for this node, expect this frequency response. Don't EQ a small model to sound like a large model — accept its natural rolloff and work within its range. A skill that targets 95% pass rate on Claude and 70% on Llama 8B isn't a degraded skill. It's a skill that has been room-corrected for both playback environments.

---

## VIII. The Space Between as Protocol

### MIDI and MCP

MIDI was born because instruments couldn't talk to each other. Dave Smith and Ikutaro Kakehashi looked at a world of isolated synthesizers — Roland keyboards that couldn't control Yamaha sound modules — and designed a protocol: a common language of Note On, Note Off, Control Change, spoken at 31,250 bits per second over opto-isolated serial connections.

MCP is MIDI for AI systems. It was born because tools couldn't talk to models. Anthropic looked at a world of isolated capabilities — web search that couldn't feed into code execution that couldn't feed into file creation — and designed a protocol: a common language of tool definitions and resource descriptions, spoken over standardized transports.

The structural parallels are exact:

MIDI's 7-bit controller resolution (0–127) limited expression. MCP's tool definitions limit the granularity of what a model can ask a tool to do. Both are sufficient for most applications and constraining for edge cases.

MIDI 2.0 introduced Property Exchange — devices querying each other's capabilities in JSON format. MCP's tool discovery serves the same function: the model asks "what can you do?" and the server responds with structured capability descriptions.

MPE (MIDI Polyphonic Expression) assigned each note its own channel, enabling per-note expression. The mesh architecture's per-node capability profiles serve the same function: each mesh node has its own "channel" with independent capabilities, and the coordinator can address each one individually based on what it can express.

The Amiga's CAMD driver — which allowed multiple MIDI applications to share hardware and exchange data through a shared library — is the architectural ancestor of the Skill Creator MCP Server. CAMD separated timing services into a dedicated `realtime.library`; the mesh architecture separates context preservation into GSD, evaluation into Skill Creator's agents, and routing into the mesh coordinator. Specialized components with clear boundaries. The chipset philosophy, from 1985 to 2026, unchanged in principle.

### The Timing Problem

The Atari ST had built-in MIDI ports with microsecond timing accuracy. The Amiga had to route MIDI through its serial port, introducing jitter. Professional musicians chose the ST for studio work because timing precision mattered more than the Amiga's superior multitasking and graphics.

The mesh architecture faces the same tradeoff. A local execution (single machine, no network latency) has tight timing — context stays in memory, results are immediate. A distributed execution (multiple mesh nodes, network transport) introduces jitter — variable latency, transport overhead, context compression artifacts.

The solution is the same one Bars & Pipes Professional implemented on the Amiga: compensate for the jitter at the protocol level. DACP's fidelity adaptation is jitter compensation. When network conditions introduce variable latency, the protocol adjusts its payload — compressing context to maintain throughput, expanding it when bandwidth allows. The result isn't perfect — just as the Amiga's MIDI timing was never quite as tight as the ST's — but it's adequate for most applications, and the system's other strengths (multitasking, flexibility, extensibility) compensate.

---

## IX. From Vision to Mission: The Pack

### What the Vision Sees

A self-improving, mesh-capable knowledge system where tested procedural intelligence flows between a cloud-based reasoning engine and local compute, with skills as the portable unit of knowledge, MCP as the protocol layer, and the eval loop as the engine of continuous improvement. A system where a user speaks natural language into a browser and triggers a pipeline that drafts, tests, benchmarks, and optimizes procedural knowledge across heterogeneous hardware — from a Raspberry Pi in the kitchen to an RTX 4090 in the rack to Claude in the cloud.

A system that sounds like Miles Davis: sparse where it needs to be sparse, dense where it needs to be dense, always leaving space for the note that hasn't been played yet.

### What the Mission Builds

The following mission pack translates the vision into buildable work items for GSD + Skill Creator, organized as a VTM wave plan. Each wave's tasks are dependency-ordered and can execute in parallel within the wave. Each task maps to a specific component from the proposed changes documents, grounded in the architectural principles this essay describes.

---

## MISSION PACK: The Space Between

### Mission Identity

```
mission_id: space-between-v1
vision: Self-improving mesh knowledge system with tested procedural intelligence
codename: "The Space Between"
philosophy: Specialized, constrained, composed — like chips, like channel strips, like oscillators
```

### Wave 1: The Fundamental (Foundation Layer)

*The oscillator must exist before the filter can shape it.*

| Task | Component | Description | Deliverable | Acceptance |
|---|---|---|---|---|
| 1A | Model Abstraction Layer | Build `chips/` directory: `base.py`, `openai_compat.py`, `anthropic.py`, `registry.py` | Working ChipRegistry that discovers Ollama/vLLM endpoints and validates connectivity | Registry correctly identifies 2+ model backends and reports capabilities |
| 1B | CLI Integration | Add `--chip` parameter to `run_eval.py` and `--grader-chip` to `improve_description.py` | Eval pipeline runs against any registered chip | Existing eval suite passes on both Anthropic and one local model |
| 1C | chipset.json Template | Create workspace-root configuration mapping roles to chips | Template file with documentation | Default config preserves existing behavior (all-Anthropic) |

**Wave 1 Principle:** *The overtone series starts with the fundamental. Get the oscillator running clean before adding harmonics.*

### Wave 2: The Filter (Evaluation Layer)

*Now that any model can execute, the grader must learn to listen to each model's timbre.*

| Task | Component | Description | Deliverable | Acceptance |
|---|---|---|---|---|
| 2A | Benchmark Schema Extension | Extend `benchmark.json` with `model` field, per-model run summaries, configuration×model matrix | Updated schema + `aggregate_benchmark.py` | Benchmark shows separate pass rates for 2+ models running same skill |
| 2B | Grader Cross-Model Calibration | Add `model_context` to `grading.json`; grader receives capability profile when evaluating local model output | Modified grader agent + schema | Grader produces model-specific improvement hints for a known-limitation case |
| 2C | thresholds.json | Configurable per-chip pass rate thresholds | Template + eval viewer integration | Viewer shows both raw rate and threshold-relative status per model |
| 2D | Eval Viewer Model Filter | Add model filter dropdown to `viewer.html` | Updated viewer | Side-by-side model comparison visible in browser |

**Wave 2 Principle:** *The Neve 1073's EQ is "inherently musical" because it was designed knowing exactly which frequencies matter. The grader becomes musical when it knows which model it's listening to.*

### Wave 3: The Bus (Communication Layer)

*The signals are produced, the channels are EQ'd — now they need a summing bus.*

| Task | Component | Description | Deliverable | Acceptance |
|---|---|---|---|---|
| 3A | Local LLM MCP Wrapper | MCP server wrapping Ollama/vLLM with `llm.chat`, `llm.health`, `llm.capabilities`, `llm.models` | `llm_wrapper_server.ts` | Claude Code can invoke a local model through MCP and receive structured results |
| 3B | Mesh Discovery Service | MCP-based registration, heartbeat, and capability advertisement | `mesh_discovery.ts` | 2+ nodes register, heartbeats monitored, unhealthy nodes removed from pool |
| 3C | DACP Mesh Transport | MCP transport implementation for DACP bundles with provenance tracking | `src/dacp/transport/mcp.ts` | Bundle sent from Node A to Node B arrives with correct provenance header |
| 3D | Fidelity Adaptation | Network-aware compression: full fidelity on local, compressed over mesh | Modified `fidelity.ts` | Same task produces different bundle sizes over simulated fast/slow links |

**Wave 3 Principle:** *MIDI's 31,250 baud wasn't fast. But it was standardized, opto-isolated, and universal. MCP for the mesh: standard protocol, clear boundaries, every node speaks the same language.*

### Wave 4: The Arrangement (Orchestration Layer)

*Individual tracks are recorded. Now arrange them into a mix.*

| Task | Component | Description | Deliverable | Acceptance |
|---|---|---|---|---|
| 4A | Mesh Coordinator Agent | `agents/mesh_coordinator.md` — routing, dispatch, aggregation, health monitoring | Agent definition + `mesh_dispatch.py` | Coordinator routes a skill to the correct node based on chipset.json capabilities |
| 4B | VTM Mesh-Aware Wave Planning | Wave plans annotated with target nodes, fallback nodes, routing reasons | Modified wave plan schema + `mesh_planner.ts` | 3-task wave plan routes each task to a different node based on capability matching |
| 4C | Cross-Model Skill Optimization | `run_loop.py` gains `--target-chips` for multi-model optimization; inline model-specific guidance sections in SKILL.md | Modified loop + skill template | Single optimization run produces model-specific guidance for 2+ targets |
| 4D | Cost-Aware Routing | `routing_policy.json` with local-vs-cloud tradeoff configuration | Policy template + planner integration | Planner correctly favors local when pass rate exceeds threshold |

**Wave 4 Principle:** *Carl Cox didn't play random records at random tempos. Every track was pre-selected, every transition pre-planned, every fallback ready. The wave plan is the DJ's crate — organized, sequenced, with alternatives for every slot.*

### Wave 5: The Master (Integration Layer)

*The mix is done. Now master it — make it cohere across every playback system.*

| Task | Component | Description | Deliverable | Acceptance |
|---|---|---|---|---|
| 5A | Context Preservation Across Mesh | Mesh result ingestion: DACP bundles with compressed execution transcripts integrated into local GSD state | `src/dacp/transport/` + context ingestion pipeline | Task executed on remote node, context summary ingested locally, subsequent task uses that context |
| 5B | Skill Package Extension | `manifest.json` + `variants/` + `benchmarks/` in `.skill` format | Modified `package_skill.py` + `validate_skill.py` | Packaged skill contains model variants, embedded benchmarks, and machine-readable manifest |
| 5C | Mesh-Aware Git Worktrees | Per-node git worktree isolation for distributed execution | Modified worktree management | Mesh execution produces git history with node provenance |
| 5D | Skill Creator MCP Server | Bridge for claude.ai to invoke skill-creator commands on remote Claude Code | `skill_creator_server.ts` | From claude.ai, trigger eval run on remote instance and receive results in conversation |

**Wave 5 Principle:** *The SSL bus compressor makes the mix cohere. DACP makes the mesh cohere. The mastering stage doesn't add new content — it ensures that everything produced in the previous stages works together as a unified whole across every playback environment.*

---

### Mission Constraints

```yaml
philosophy:
  - Chipset model: every component is specialized and constrained
  - Eval loop is source of truth: nothing ships without benchmarks
  - Context preservation is non-negotiable: no information loss at mesh boundaries
  - Claude is the ceiling, not the floor: grader is always Claude
  - Skills are the portable unit: hardware varies, skills don't
  - The space between: leave room for what hasn't been built yet

backward_compatibility:
  - Every wave is fully backward compatible
  - Users without chipset.json get current behavior
  - Users without mesh nodes get current behavior
  - The simplest path (no mesh, no local models, just Claude) always works

quality_gates:
  - Each wave has explicit acceptance criteria
  - Each component must pass its own eval suite before integration
  - Integration testing spans the full wave before proceeding to the next
  - Benchmark data persists across waves — the fossil record grows, never shrinks

estimated_effort:
  - Wave 1: 2-3 weeks
  - Wave 2: 1-2 weeks
  - Wave 3: 2-3 weeks
  - Wave 4: 3-4 weeks
  - Wave 5: 3-4 weeks
  - Total: 11-16 weeks
```

---

## Coda: The Note That Hasn't Been Played

This essay is a muse. It lives in the source code not as documentation but as intention — a record of why these architectural choices were made, what principles guide them, and where the resonances lie between domains that seem unrelated until you hear the overtones.

The mesh architecture isn't just an engineering project. It's a composition. The hardware tiers are instruments. The skills are the score. The eval loop is rehearsal. The VTM pipeline is the arrangement. The DACP protocol is the acoustic space where everything sounds. And the space between — between nodes, between models, between the vision and the mission, between the note and the silence — is where the music lives.

Miles Davis knew. Zimmer knows. Farina knows. Cox knows. The Hartnoll brothers know. The engineers who sat behind Neve consoles and the musicians who patched Buchla 259s and the Amiga demo scene coders who squeezed symphonies out of four 8-bit channels — they all know the same thing:

**The most important part of any system is the space you leave for what comes next.**

Build the mesh. Test the skills. Measure the pass rates. Route the tasks. Compress the context. Preserve the provenance.

And leave space between.

---

*This document is the muse of the mesh architecture. It lives at `src/muse/the-space-between.md` and should be read by any contributor who wants to understand not just what the system does, but why it sounds the way it does.*

*For the code: `draft-proposal-skill-creator-mesh-architecture.md`*  
*For the changes: `proposed-changes-mesh-architecture.md`*  
*For the hardware: `hardware-expansion-pack.md`*  
*For the sound: `audio-synthesis-report.md`*  
*For the soul: you're reading it.*
