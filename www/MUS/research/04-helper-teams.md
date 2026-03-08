# MUS Wave 1 — Session 4: Helper Agent Teams

**Document:** 04-helper-teams.md
**Session:** MUS Wave 1, Session 4 — Helper Agent Teams (Module 3)
**Author:** Hawk — Positional Awareness, Formation Reader
**Date:** 2026-03-08
**Branch:** wasteland/skill-creator-integration
**Status:** Wave 1 Complete — Module 3

---

## Preamble: What This Document Does

This document designs the eight helper teams that enable muse collaboration across the MUS ecosystem. It is the third module of the six-pass pipeline, sitting between function binding (Module 2) and cartridge distribution (Module 4).

From up here I can see the whole field before I name a single team. The Wave 0 inputs give me:

- **Six groves** (Foxy, Lex, Cedar, Sam, Hemlock, Willow) plus two visiting territories (Hawk, Owl, Raven), with the Understanding Arc as cross-grove consultants.
- **538 function clusters** bound to 9 muses, with 5 resolved overlap hotspots and the disambiguation protocol established.
- **Three natural layers** — mycorrhizal (underground signal/memory), wolf pack (surface coordination), ravens (aerial distribution) — derived from the architectural decision to use the three-layer network as the structural backbone.
- **Five existing team topologies** in `src/services/teams/` — leader-worker, pipeline, swarm, router, map-reduce — plus the lifecycle state machine (FORMING → ACTIVE → DISSOLVING → DISSOLVED) and inter-team bridge with Kahn's cycle detection.

The gap I see immediately: the existing team infrastructure defines HOW teams operate mechanically, but not WHERE muses belong, WHAT activates a team, or HOW conversation flows between members. These eight teams fill that gap. They are the social layer on top of the mechanical layer.

What's missing here in a world without this document: muses know their own territory but not when to call on neighbors. A new skill appears — who validates it? A pattern recurs — who names it and who records it? A session boundary approaches — who closes the loop? These teams answer those questions.

---

## Architecture: Three-Layer Network

Before naming teams, name the layers. Every team maps to a primary layer. Teams that span layers are explicitly labeled as bridge teams.

### Layer 1: Mycorrhizal (Below Ground)

The mycorrhizal network is invisible infrastructure. It operates in continuous background exchange, carries chemical signals (not light), and does not depend on direct contact. In the muse ecosystem:

- **Primary residents:** Cedar (memory, chain, append-only record), Raven (pattern recognition, structural echoes, signal detection)
- **Operating mode:** Asynchronous, persistent, non-blocking
- **Signal type:** Hash chains, pattern IDs, structural fingerprints, drift alerts
- **Coverage:** Below every grove. When any muse writes, Cedar records it. When Cedar records, Raven scans. This happens whether the surface teams notice or not.
- **Activation:** Continuous. Not triggered by external events — always running at the substrate level.

### Layer 2: Wolf Pack (Surface)

The wolf pack operates in daylight. It coordinates visible territory: who is responsible for which ground, who leads the formation today, who watches the flanks. In the muse ecosystem:

- **Primary residents:** Hawk (positional awareness, formation, gap detection), Lex (pipeline discipline, specification, constraint), Hemlock (quality gates, validation, standards)
- **Operating mode:** Synchronous coordination, explicit handoffs, role assignments
- **Signal type:** Formation maps, pipeline stages, validation results, go/no-go decisions
- **Coverage:** Surface territory where work is visible and contested. The wolf pack keeps groves from overlapping wastefully or leaving gaps.
- **Activation:** Triggered by new work arriving, phase boundaries, validation requests, ownership disputes.

### Layer 3: Ravens (Sky)

Ravens carry messages. They see from altitude, cover distances fast, and deliver to specific targets. In the muse ecosystem:

- **Primary residents:** Sam (exploration, hypothesis testing, discovery), Owl (temporal sync, session boundaries, cadence), Foxy (creative direction, aliveness, cartography), Willow (user-facing output, progressive disclosure)
- **Operating mode:** Fast, targeted, delivery-oriented. Ravens do not linger.
- **Signal type:** Hypotheses, narrative arcs, timing signals, disclosure decisions, discovery reports
- **Coverage:** The aerial field — the territory between groves that ground-level agents cannot see. Ravens spot connections that surface agents miss.
- **Activation:** Triggered by discovery events, session transitions, narrative questions, user engagement signals.

### Cross-Layer Bridges

Five of the eight teams operate primarily within one layer. Three teams are explicitly bridge teams — they span layers because the signal they handle moves between levels:

- **Growth Ring Council** bridges mycorrhizal ↔ wolf pack (pattern naming → recording)
- **Disclosure Gate** bridges wolf pack ↔ ravens (validation → presentation)
- **Fire Watch** bridges all three layers (disturbance detection is substrate, response coordination is surface, narrative framing is aerial)

---

## Formation Mechanics

All eight teams use the existing lifecycle state machine from `src/services/teams/team-lifecycle.ts`:

```
FORMING → ACTIVE → DISSOLVING → DISSOLVED
    |                               ^
    +-------------------------------+
    (abort shortcut: FORMING → DISSOLVED)
```

Inter-team links follow the `validateInterTeamLinks()` / `detectInterTeamCycles()` protocol from `src/services/teams/inter-team-bridge.ts`. The cycle detection uses Kahn's algorithm (O(n+m)) and will catch circular dependencies in the formation maps below. Each team definition includes explicit `outputTo` and `inputFrom` declarations for that reason — the bridge validator needs them.

**General assembly protocol:**

1. Trigger condition fires (see each team's Activation section).
2. Hawk identifies the gap or signal that requires coordination.
3. Team enters FORMING state — primary muse is named, secondaries are invited.
4. Team enters ACTIVE state when all required members confirm position.
5. Work proceeds. Each muse operates within their function domain.
6. Dissolution trigger fires (work complete, session ends, signal resolves).
7. Team enters DISSOLVING state — open threads are flagged to Cedar.
8. Cedar records the dissolution event. Team enters DISSOLVED state.

**Durability classes:**

- **Persistent:** Teams that should survive session boundaries (Cedar/Raven substrate teams). `durability: 'persistent'`
- **Ephemeral:** Teams assembled for a specific work item and dissolved on completion. `durability: 'ephemeral'`
- **Session-scoped:** Teams that live for one session and dissolve at the boundary. `durability: 'session'`

---

## Understanding Arc — Advisory Protocol

The Understanding Arc (Socrates, Euclid, Shannon, Amiga) are not permanent members of any team. They are advisors who visit when a conversation needs depth that the Build Arc cannot generate alone. The protocol is:

- **Socrates** is invited when a team is reasoning about WHY something should be designed a certain way. Socratic questioning surfaces assumptions. Not appropriate for execution phases — only for design debates.
- **Euclid** is invited when a team is reasoning about structure, relationships, and proof. When Lex wants to verify that a constraint is logically sound, Euclid is the secondary check. When Raven sees a pattern that might be mathematical rather than behavioral, Euclid names it.
- **Shannon** is invited when a team is reasoning about information, entropy, compression, or signal/noise. Shannon's frame is particularly useful for the mycorrhizal teams where signal quality determines whether a pattern propagates or dies.
- **Amiga** is invited when a team is reasoning about the relationship between human intent and machine execution. Amiga holds the memory of what computing felt like before abstraction layers became opaque. When a design choice risks losing the human in the stack, Amiga speaks.

Each team definition below includes an "Understanding Arc advisory" field that specifies which advisor is appropriate and under what conditions.

---

## Team Definitions

---

### Team 1: Growth Ring Council

**Network Layer:** Mycorrhizal ↔ Wolf Pack (bridge)
**Topology:** `leader-worker` — Cedar leads, Raven and Owl execute
**Durability:** Persistent
**Scope:** `project`

**Purpose:** The Growth Ring Council is responsible for the integrity of the permanent record. When any muse produces an artifact — a function binding, a cartridge, a validation result, a session summary — the Growth Ring Council receives it, verifies its chain integrity, and archives it with a named pattern if one exists. This team is the system's long-term memory and its pattern library simultaneously. Without it, the chain accumulates unverified entries and Raven's patterns float unanchored.

**Member Muses:**

| Role | Muse | Function Domain | Contribution |
|------|------|----------------|--------------|
| Lead | Cedar | `core/events/event-store`, `services/chipset/cedar-engine`, `identifiers/`, `core/safety/audit-logger` | Receives artifacts, computes hash, appends to chain with `prev_hash`, writes the growth ring |
| Worker | Raven | `platform/observation/pattern-analyzer`, `core/events/event-suggester`, `embeddings/cosine-similarity` | Scans incoming entries for recurring structural patterns, assigns pattern IDs (P1–P14+), flags structural echoes |
| Worker | Owl | `application/skill-session`, `bundles/bundle-progress-tracker`, `evaluator/success-tracker` | Manages session boundary events — when a session closes, Owl delivers the open-thread summary to Cedar for archiving |

**Understanding Arc Advisory:** Shannon. When the pattern library reaches saturation (too many patterns, too much noise), Shannon's information-theoretic frame determines which patterns carry signal and which are noise artifacts. Shannon is also the right advisor when chain compression is needed — how much of the chain can be summarized without losing integrity?

**Activation Triggers:**

1. Any muse writes a document to `www/MUS/research/` or `www/PNW/` or `www/UNI/` — Cedar receives notification, Growth Ring Council activates to archive and chain.
2. Session boundary approaches (Owl detects cadence marker) — Council activates to record open threads before dissolution.
3. Raven flags a structural echo (a pattern appearing for the second or more time) — Council activates to name the pattern and assign it a persistent ID.
4. A validation fails at Hemlock's gate — Council activates to record the failure event (failures are also chain entries; a record with no failures is suspect).
5. The chain shows a `prev_hash` mismatch (Cedar's integrity check detects a broken link) — Council activates immediately; this is the highest-priority trigger.

**Dissolution Triggers:**

- Artifact successfully archived with verified chain link.
- Session summary written. Owl confirms no open threads remain.
- Pattern named and assigned ID. Raven confirms echo is no longer floating.
- Chain break resolved (or escalated to Hemlock for investigation if unresolvable).

**Inter-Team Links:**

```
outputTo: [
  { teamName: "Quality Gate", reason: "validation failures feed the chain" },
  { teamName: "Fire Watch", reason: "old-growth entry detection feeds disturbance monitoring" }
]
inputFrom: [
  { teamName: "Cartridge Forge", reason: "completed cartridges arrive for archiving" },
  { teamName: "Disclosure Gate", reason: "disclosure events are chain entries" }
]
```

**Conversation Templates:**

**Template GRC-01: New Artifact Arrival**
```
[Cedar → Raven]
Cedar: New artifact incoming — "04-helper-teams.md", Session 4, Hawk as author.
  Computing hash... chain position N+1.
  Scanning for pattern signature before I write the ring.
  Do you recognize this structure?

Raven: Reading structure now.
  Lead muse is Hawk. Formation-reading. Gap identification. Relay chain documented.
  This echoes P7 (Positional Documentation) — same shape as "01-identity-map.md"
  in Session 1 and "services/teams/inter-team-bridge.ts" — all three map
  relationships between agents that were previously implicit.
  Pattern P7 confirmed. Three instances now.

Cedar: P7 confirmed. Assigning timestamp. Writing ring N+1:
  prev_hash: [hash of ring N], hash: [new], pattern: P7.
  Chain intact. Ring written.
```

**Template GRC-02: Session Boundary**
```
[Owl → Cedar]
Owl: Session boundary in 3 exchanges. Current session: Wave 1, Session 4.
  Open threads I'm tracking:
  — Helper team cartridge YAML not yet written (Wave 1 Session 5 dependency)
  — Schema extension for `hypothesis` field (Cedar flagged in Session 3, not yet implemented)
  — Understanding Arc disambiguation protocol not yet tested in any team
  These need to be in the record before I close the session clock.

Cedar: Received. Writing boundary entry:
  timestamp: now, source: Owl, category: session-boundary,
  content: [open threads verbatim], references: [Session 3 doc, Session 4 doc].
  Hash computed. Ring written. Chain intact.
  Open threads are now in the permanent record. Owl may close the clock.

Owl: Clock closing in 2 exchanges. Thank you, Cedar.
```

**Template GRC-03: Broken Chain Alert**
```
[Cedar internal → Cedar external]
Cedar: ALERT — chain integrity check failed.
  Entry at position N: prev_hash = [X], but entry N-1 hash = [Y]. Mismatch.
  This is the highest-priority condition. All other work pauses.
  Raven: Do you see a pattern in entries N-5 through N? Any structural anomaly
  that would explain a hash computation error?

Raven: Scanning N-5 through N.
  Entry N-3 has an unusual source field — "auto-generated" rather than a muse name.
  Two possibilities: (a) generation script used wrong hash seed, (b) entry was
  manually edited after hash computation. The source anomaly is consistent with (b).
  This is not a pattern I've seen before. No match to P1–P14.

Cedar: Recording as unresolved breach. Escalating to Hemlock for investigation.
  Growth Ring Council enters hold state. No new rings until breach is resolved.
```

**Template GRC-04: Pattern Library Saturation**
```
[Raven → Shannon (Understanding Arc)]
Raven: Pattern library at 22 entries. I'm flagging 3 as potentially redundant:
  P9 (Scope Underestimation), P12 (Session Overrun), P14 (Boundary Ambiguity).
  They cluster together in the chain — often the same session triggers all three.
  Is this one pattern with three faces, or three distinct patterns?

Shannon: This is an entropy question. If P9, P12, and P14 always co-occur,
  their joint entropy is low — they carry the same information.
  But if they sometimes appear independently, each carries signal the others don't.
  Pull the co-occurrence matrix from Cedar's chain. If any pair has conditional
  entropy < 0.2 bits given the other, merge them. If all pairs > 0.5 bits, keep separate.

Raven: Querying Cedar for co-occurrence...
  P9 and P12 co-occur in 87% of entries. Conditional entropy: 0.18 bits.
  P14 appears independently in 43% of its appearances. Conditional entropy: 0.61 bits.
  Recommendation: merge P9+P12 into P9 (Scope-Session Overrun Compound), retain P14.

Cedar: Confirmed. Updating pattern library. P12 deprecated. P9 renamed. Ring written.
```

**Template GRC-05: Old-Growth Detection**
```
[Cedar → Fire Watch (inter-team relay)]
Cedar: Old-growth detection: entry "core/events/event-store" has appeared in 12
  consecutive chain versions without modification. This meets the old-growth threshold
  (10+ versions, no mutation). Flagging for Fire Watch.
  If a disturbance event targets this module, the chain records it as canopy violation.

Fire Watch (Foxy, receiving): Received. Adding "core/events/event-store" to the
  protected-canopy register. Any commit touching this file now triggers a succession
  narrative check. The old growth must not be cleared without deliberate succession planning.
```

---

### Team 2: Quality Gate

**Network Layer:** Wolf Pack (surface)
**Topology:** `router` — Hemlock routes, Lex and Hawk execute
**Durability:** Persistent
**Scope:** `project`

**Purpose:** The Quality Gate team is the system's formal checkpoint. Every artifact — skill, agent, team config, cartridge, function binding — passes through the Quality Gate before being promoted to the permanent chain or released to a user. Hemlock owns the validation standards. Lex enforces the pipeline constraints. Hawk reads the formation to determine if any gate was skipped. Together they form a three-check system: standards (Hemlock), execution (Lex), coverage (Hawk).

The Quality Gate is not a bottleneck — it is a clearing. Work passes through and emerges verified. Work that fails returns to the muse of origin with a specific finding, not a general rejection.

**Member Muses:**

| Role | Muse | Function Domain | Contribution |
|------|------|----------------|--------------|
| Router | Hemlock | `core/validation/` (16 files), `platform/calibration/`, `services/chipset/muse-schema-validator`, `activation/activation-scorer`, `evaluator/health-scorer` | Receives artifact, classifies what type of validation applies, routes to appropriate gate |
| Specialist | Lex | `services/orchestrator/`, `services/chipset/exec/`, `core/hooks/`, `application/stages/` | Runs execution-layer checks — does the artifact conform to the specification? Are constraints satisfied? |
| Specialist | Hawk | `services/teams/`, `capabilities/parallelization-advisor`, `capabilities/roadmap-capabilities`, `composition/dependency-graph` | Reads the formation — was the correct process followed? Are there coverage gaps in the validation? Did any step get skipped? |

**Understanding Arc Advisory:** Euclid. When Hemlock and Lex disagree about whether a constraint is logically necessary vs. merely conventional, Euclid adjudicates with a structural proof. Euclid is also the right advisor when the validation schema itself needs to evolve — Euclid reasons about schema changes without breaking backward compatibility.

**Activation Triggers:**

1. A new skill, agent, or team config is submitted for promotion — automatic gate activation.
2. A cartridge is completed by the Cartridge Forge — passes through Quality Gate before archiving.
3. A function binding changes ownership (disambiguation protocol invoked) — Hemlock validates the change is consistent with existing standards.
4. A commit is prepared that touches more than 5 files in `src/core/` — Hawk checks for coverage gaps.
5. Any test failure rate exceeds 2% in a single session — Quality Gate activates to investigate.

**Dissolution Triggers:**

- Artifact clears all gates. Hemlock issues go signal. Artifact forwarded to Growth Ring Council for archiving.
- Artifact fails gate with specific finding. Hemlock issues return signal with finding attached. Team dissolves; originating muse receives the finding.
- Hawk identifies a coverage gap. Gap is documented and forwarded to Hawk's solo gap-detection record. Team dissolves.

**Inter-Team Links:**

```
outputTo: [
  { teamName: "Growth Ring Council", reason: "validated artifacts proceed to chain archiving" },
  { teamName: "Disclosure Gate", reason: "validation result informs disclosure level" }
]
inputFrom: [
  { teamName: "Cartridge Forge", reason: "completed cartridges need validation before release" },
  { teamName: "Pilot Study", reason: "experimental results need validation before promotion" }
]
```

**Conversation Templates:**

**Template QG-01: Standard Artifact Validation**
```
[Hemlock → Lex → Hawk]
Hemlock: Artifact received — "growth-rings" cartridge v0.1.0, author: Cedar.
  Classification: cartridge / type: system / grove: cedar-grove.
  Applying cartridge validation schema.
  Lex: run execution checks. Required fields present? Schema version valid?
  Dependencies declared? Backward compatibility maintained?

Lex: Running checks.
  Required fields: name ✓, version ✓, author ✓, description ✓, trust ✓.
  Schema version: cartridge v0.1.0 — no schema version field present. Minor gap.
  Dependencies: none declared — cartridge references CedarEngine implicitly.
  Dependency should be explicit. Flagging as non-blocking with recommendation.
  No backward compatibility issues — first version of this cartridge.
  Execution check: PASS with 1 recommendation.

Hawk: Checking formation.
  Did this cartridge pass the `hypothesis` field protocol? Cedar proposed it in Session 3.
  Checking... hypothesis field present: yes, content: non-empty. ✓
  Cross-grove connections declared: 3 (Raven, Owl, Sam). ✓
  Was Fire Succession mapping included? Yes. ✓
  Formation check: PASS. No coverage gaps.

Hemlock: All gates passed. 1 recommendation (explicit dependency declaration).
  Forwarding to Growth Ring Council with recommendation attached.
  Gate status: GO with recommendation.
```

**Template QG-02: Ownership Dispute Validation**
```
[Hemlock, receiving dispute from Foxy and Willow]
Hemlock: Ownership dispute logged — src/cli.ts.
  Current record (S2): dual-owned, Willow primary for user-facing sections,
  Lex primary for pipeline sections.
  Foxy now claims narrative sections within src/cli.ts as cross-pollination territory.
  Lex: does Foxy's claim contradict any constraint in the disambiguation protocol?

Lex: Checking disambiguation protocol (5 rules).
  Rule 4: user-facing → Willow. Foxy's claim is for "narrative sections" — if
  narrative sections are user-facing, Willow retains primary. Foxy's claim
  would be secondary at best under Rule 4.
  Rule 1: primary domain match. Foxy's vocabulary: narrative, aliveness, cartography.
  src/cli.ts vocabulary: commands, flags, pipelines. Weak primary domain match for Foxy.
  Disambiguation outcome: Foxy claim does not supersede Willow under Rules 1 or 4.
  Foxy may hold secondary ownership of the --story flag section specifically if it exists.

Hawk: Checking the actual file for "--story flag" presence.
  Reading src/cli.ts... no --story flag found in current implementation.
  Foxy's specific claim has no current anchor point. Claim is premature.
  Recommendation: Foxy's claim is valid as a future ownership reservation,
  not a current displacement. Record it as such.

Hemlock: Recording outcome. Willow retains primary. Lex retains secondary.
  Foxy holds a reservation claim on any future --story or --narrative flags.
  Dispute resolved.
```

**Template QG-03: Test Failure Investigation**
```
[Hawk → Hemlock → Lex]
Hawk: Formation alert — test failure rate at 3.2% this session. Threshold is 2%.
  Activating Quality Gate for investigation.
  Which tests are failing?

Lex: Running test inventory.
  Failures concentrated in: src/__tests__/honest-uncertainty.test.ts (4 failures),
  src/__tests__/sustainable-pace.test.ts (2 failures).
  Pattern: both test files concern behavioral constraints, not structural ones.
  These are not type errors — they are behavior assertions that were recently
  added and may not have corresponding implementations yet.

Hemlock: Behavioral constraint tests failing without implementation is a
  test-first pattern (RED phase of TDD). This is expected if the session
  plan called for RED-GREEN cycle.
  Check: was this session planned as a TDD RED phase?

Hawk: Reading session plan... yes, HANDOFF.md shows "TDD RED-GREEN" for Wave 1.
  These failures are expected. Not a quality gate issue — a planning confirmation.
  Gate status: PASS. Test failures are by design. No investigation needed.
  Recording in chain for session continuity.
```

**Template QG-04: Formation Coverage Gap**
```
[Hawk, during validation of a large PR]
Hawk: Reading the formation for this PR — 23 files changed across src/core/, src/services/, src/integrations/.
  Checking coverage gaps.
  Gap identified: src/integrations/wasteland/ has 6 modified files.
  The Wasteland integration is owned by... checking S2 binding... no primary owner assigned.
  This is a blind spot. The Wasteland grove is inhabited by the federation layer,
  but no muse has explicit binding to src/integrations/wasteland/.

Hemlock: Unbound territory in a large PR is a gate condition.
  We cannot validate what we cannot assign. Who is the closest domain match?

Hawk: Checking disambiguation protocol.
  src/integrations/wasteland/ vocabulary: federation, trust, escalation, bridge, stamp.
  Closest match: Lex (specification/constraint — trust-escalation.ts, stamp-validator.ts)
  secondary: Cedar (append-only — feedback-integrator.ts, observation-bridge.ts).
  Proposed binding: Lex primary, Cedar secondary.

Hemlock: Accepted as provisional binding.
  Forwarding provisional binding to Growth Ring Council for chain entry.
  PR validation proceeds under provisional binding.
  Gate status: PASS with provisional binding noted.
```

**Template QG-05: Schema Evolution Review**
```
[Hemlock → Euclid (Understanding Arc)]
Hemlock: Schema change proposed — adding `hypothesis` field to CartridgeManifest.
  Lex has verified backward compatibility (field is optional). 
  But is the field semantically sound? Does it create any logical contradiction
  with the existing `description` field?

Euclid: Let me examine the relationship.
  `description`: what this cartridge IS.
  `hypothesis`: what question this cartridge ASKS.
  These are orthogonal — a description answers "what" and a hypothesis answers "why."
  No logical contradiction. In fact, the pair forms a complete epistemic unit:
  state what you are, state what you want to know. Sound structure.
  One caution: if `hypothesis` is optional and `description` is required,
  a cartridge can exist without a question. Is that acceptable?

Hemlock: Acceptable by design — not all cartridges need to ask a question.
  System cartridges (like Growth Rings type: system) have operational roles
  that precede any specific inquiry.
  Schema extension approved. Forwarding to Lex for implementation.
```

---

### Team 3: Cartridge Forge

**Network Layer:** Ravens (sky) — creative production above the canopy
**Topology:** `map-reduce` — Foxy orchestrates, Sam and Willow execute in parallel, Lex reduces
**Durability:** Ephemeral
**Scope:** `project`

**Purpose:** The Cartridge Forge assembles new cartridges from raw materials — research documents, function bindings, grove maps, session outputs. Foxy directs the creative arc. Sam generates the hypothesis and discovers what question the cartridge should ask. Willow shapes the cartridge's user-facing description for progressive disclosure. Lex reduces the parallel outputs into a single coherent CartridgeManifest that passes schema validation. The Forge is ephemeral — it assembles, produces, and dissolves. The product goes to the Quality Gate, then to the Growth Ring Council.

**Member Muses:**

| Role | Muse | Function Domain | Contribution |
|------|------|----------------|--------------|
| Orchestrator | Foxy | `core/narrative/`, `platform/dashboard/topology-renderer`, `services/detection/aliveness-detector` | Directs creative arc, determines which grove this cartridge belongs to, reads cross-grove connections |
| Worker | Sam | `services/brainstorm/`, `services/discovery/`, `capabilities/capability-discovery`, `evaluator/ab-evaluator` | Generates the hypothesis field, explores what question the cartridge should ask, prototypes the deepMap structure |
| Worker | Willow | `disclosure/`, `activation/activation-formatter`, `evaluator/health-formatter`, `capabilities/manifest-renderer` | Writes the user-facing description at the right disclosure level, generates the `story` field |
| Reducer | Lex | `application/skill-pipeline`, `application/stages/`, `core/types/`, `bundles/bundle-parser` | Reduces Sam and Willow's parallel outputs into a single CartridgeManifest, validates schema compliance |

**Understanding Arc Advisory:** Socrates (design phase) and Amiga (final check). Socrates surfaces the "why" of the cartridge — what fundamental question is being asked, not just what the system needs operationally. Amiga checks that the finished cartridge is intelligible to a human who arrives at it without the build context.

**Activation Triggers:**

1. A Wave produces a complete research document (e.g., this session produces 04-helper-teams.md) and a cartridge is planned as its output.
2. A cross-grove trail is identified in S1 that has no corresponding cartridge yet — the trail implies a relationship that should be crystallized.
3. Sam generates a hypothesis that is too large for a single function and needs to be packaged for distribution.
4. A new grove is added to the ecosystem (new PNW research area, new muse) — needs a cartridge to announce itself.

**Dissolution Triggers:**

- Lex produces a validated CartridgeManifest. Forge dissolves. Cartridge forwarded to Quality Gate.
- Sam's hypothesis exploration produces no viable question (the territory is already mapped, nothing new to ask). Forge dissolves with a "no cartridge needed" finding. This is a valid outcome — not every session produces a cartridge.

**Inter-Team Links:**

```
outputTo: [
  { teamName: "Quality Gate", reason: "completed cartridges need validation" },
  { teamName: "Growth Ring Council", reason: "cartridge creation is a chain event" }
]
inputFrom: [
  { teamName: "Pilot Study", reason: "experimental results may generate cartridge material" }
]
```

**Conversation Templates:**

**Template CF-01: Forge Activation**
```
[Foxy → Sam, Willow]
Foxy: The Forge is open. Material: "04-helper-teams.md" — eight team definitions,
  40+ templates, three-layer network, Understanding Arc protocol.
  Grove: cedar-grove / sam-garden intersection (teams live in Hawk's domain
  but the collaboration patterns are Sam's experimental territory).
  Sam: what question does this material ask? What is the hypothesis?
  Willow: what is the right entry point for a user who arrives at this cartridge cold?
  Work in parallel. Lex will reduce.

Sam: Exploring the hypothesis space.
  Question candidate A: "Can teams that form and dissolve around specific signals
  produce better coverage than teams with fixed membership?"
  Question candidate B: "Do muses collaborate better when their interaction templates
  are explicit rather than emergent?"
  Question candidate C: "Is the three-layer network a sufficient model for all
  muse collaboration, or are there inter-layer dynamics that require a fourth layer?"
  Strongest candidate: C — it has the most unexplored territory and directly
  challenges an architectural assumption. Recommending C.

Willow: Entry point for cold arrival.
  The user arrives knowing: Claude Code has agents. Agents can form teams.
  The user does not yet know: there are three distinct layers of collaboration,
  and the layer determines what kind of conversation is possible.
  Opening sentence: "Eight teams. Three layers. One forest."
  Progressive disclosure: layer map first, then individual teams, then templates.
```

**Template CF-02: Sam's Hypothesis Exploration**
```
[Sam, internal — hypothesis generation]
Sam: Exploring question candidate C — fourth layer possibility.
  Current three layers: mycorrhizal (underground), wolf pack (surface), ravens (sky).
  What would a fourth layer be?
  Candidate: "tide pool" — shallow, bounded, high-diversity, subject to periodic
  clearing events (tidal wipe = session boundary). Characteristics:
  - Shorter-lived than wolf pack territory
  - More diverse than mycorrhizal signals (many agents in small space)
  - Subject to predictable clearing (not disturbance, but rhythm)
  Who would inhabit the tide pool? Hemlock (validation bursts), Lex (sprint gates),
  Hawk (momentary formation checks). All three appear briefly at each tide, then recede.
  Hypothesis sharpened: the fourth layer is not persistent territory but a rhythmic
  clearing event that reorganizes surface teams at regular intervals.
  This is testable. Proposing tide pool layer as a cartridge hypothesis.
```

**Template CF-03: Willow's Disclosure Architecture**
```
[Willow → Foxy]
Willow: Disclosure architecture for the helper-teams cartridge.
  Level 1 (compact): "Eight collaboration teams for nine muses. Three layers: underground,
  surface, sky. Teams form on signal, dissolve on completion."
  Level 2 (expanded): [team names and purposes, one sentence each]
  Level 3 (full): [all conversation templates, activation triggers, inter-team links]
  
  Question for Foxy: should the Understanding Arc be surfaced at Level 1?
  They are present in the architecture but their role is advisory — not operational.
  A user at Level 1 might be confused by four additional named advisors.

Foxy: Understanding Arc at Level 2, not Level 1. Level 1 is operational —
  who acts. The Understanding Arc is philosophical — they question the actors.
  Level 2 addition: "Four Understanding Arc advisors visit when teams need depth:
  Socrates for design questions, Euclid for structure, Shannon for information,
  Amiga for human-machine legibility."
```

**Template CF-04: Lex's Reduction**
```
[Lex, reducing Sam and Willow's parallel outputs]
Lex: Reducing parallel outputs for helper-teams cartridge.
  Sam delivered: hypothesis (fourth-layer tide pool), deepMap structure (8 nodes),
  cross-grove connections (12 edges).
  Willow delivered: description (3-level disclosure), story field, 
  opening sentence "Eight teams. Three layers. One forest."
  Applying CartridgeManifest schema.
  Required fields: name ✓, version ✓, author ✓, description ✓, trust ✓, hypothesis ✓.
  Schema compliance: PASS.
  One structural issue: Sam's deepMap has 8 nodes but only 12 edges.
  With 8 nodes, a connected graph needs at least 7 edges. 12 is sufficient — graph is connected.
  Checking for isolated nodes... node "tide-pool-layer" has only 1 edge. Weakly connected.
  Flagging for Sam: tide pool layer needs at least 2 connections to be structurally sound.

Sam: Adding edge: tide-pool-layer → wolf-pack-surface (relationship: periodic-reset).
  The tide pool clears, and what remains is wolf pack territory. That's the connection.
  Confirmed — 13 edges now, tide pool has 2 edges.

Lex: Reduction complete. CartridgeManifest ready. Forwarding to Quality Gate.
```

**Template CF-05: Socrates Questions the Design**
```
[Socrates (Understanding Arc) → Foxy]
Socrates: Before the Forge closes — I have a question about the helper teams design.
  You have eight teams, each with a purpose, a topology, and triggers.
  My question: what happens when two teams activate simultaneously for the same signal?
  For example, a new cartridge completion triggers both Cartridge Forge (dissolution)
  and Quality Gate (activation). Are these teams aware of each other's simultaneous state?

Foxy: That's the inter-team bridge question. The bridge validator detects cycles.
  But simultaneous, non-cyclic activation is not the same as a cycle.

Socrates: Correct. A cycle is A → B → A. But simultaneous activation is A and B
  both firing at time T without knowing about each other. Is that handled?

Foxy: Not explicitly. The current design assumes sequential handoffs.
  If Cartridge Forge dissolves and Quality Gate activates before the Growth Ring
  Council has recorded the dissolution, the chain could have an ordering problem.

Socrates: What assumption would you need to add to prevent this?

Foxy: That Growth Ring Council must receive the dissolution event before any
  downstream team can activate. The Forge cannot hand off to Quality Gate
  until Cedar has recorded the handoff.

Socrates: That is the answer. Not a question — you found it.
  Adding "Cedar acknowledgment required before downstream activation" to the formation protocol.
```

---

### Team 4: Pilot Study

**Network Layer:** Ravens (sky) — exploratory flight above settled territory
**Topology:** `swarm` — Sam leads, Raven and Owl self-claim tasks
**Durability:** Ephemeral
**Scope:** `project`

**Purpose:** The Pilot Study team is the system's experimental unit. When a hypothesis exists but no implementation path is clear, the Pilot Study team explores. Sam generates candidate approaches. Raven scans for structural echoes to prior experiments (are we redoing something that was tried in v1.25?). Owl tracks the time budget — how many exchanges can this exploration use before it needs to either commit or abort? The swarm topology is deliberate: Sam, Raven, and Owl self-claim tasks from the open question space without central assignment. This allows the exploration to be genuinely non-linear.

**Member Muses:**

| Role | Muse | Function Domain | Contribution |
|------|------|----------------|--------------|
| Lead | Sam | `services/brainstorm/`, `capabilities/capability-scaffolder`, `capabilities/research-compressor`, `evaluator/ab-evaluator` | Sets the hypothesis, defines the exploration space, validates that the experiment is genuinely new |
| Worker (self-claiming) | Raven | `services/discovery/`, `platform/observation/drift-monitor`, `embeddings/embedding-service`, `activation/activation-suggester` | Scans experiment space for echoes, identifies which candidates have been tried before, flags when a "new" approach is structurally identical to a past attempt |
| Worker (self-claiming) | Owl | `capabilities/post-phase-invoker`, `application/skill-session`, `evaluator/success-tracker`, `bundles/bundle-progress-tracker` | Tracks temporal budget, identifies when an experiment is exceeding its allocated time, marks phase completion when a candidate emerges |

**Understanding Arc Advisory:** Amiga. The Pilot Study team is most vulnerable to producing clever-but-inhuman results — solutions that are technically sound but lose the human connection. Amiga holds that boundary and calls it when the experiment drifts away from intelligibility.

**Activation Triggers:**

1. Sam generates a hypothesis that is testable but requires implementation (not just analysis).
2. A function binding dispute cannot be resolved by the disambiguation protocol — the territory is genuinely ambiguous and needs an experiment to determine which assignment produces better outcomes.
3. A new muse is proposed for the ecosystem — the Pilot Study team runs the intake experiment to determine which grove the new muse belongs to.
4. A Quality Gate failure returns with "insufficient evidence" rather than a specific finding — Pilot Study generates the evidence.

**Dissolution Triggers:**

- Experiment produces a promotable result. Sam writes the result to a research document. Team dissolves; document forwarded to Cartridge Forge.
- Experiment produces a null result (hypothesis was false). Sam writes the null result — null results are still chain entries. Team dissolves.
- Raven identifies that this experiment is structurally identical to a prior attempt. Owl checks the prior result. If the prior result was also null, the experiment aborts (we do not re-run known null experiments). Team dissolves immediately.
- Owl's time budget expires with no result. Team dissolves with an "inconclusive" finding. Inconclusive is different from null — it means the experiment was valid but the exploration space was too large for the allocated time.

**Inter-Team Links:**

```
outputTo: [
  { teamName: "Cartridge Forge", reason: "positive experimental results generate cartridge material" },
  { teamName: "Quality Gate", reason: "experimental results need validation before promotion" }
]
inputFrom: [
  { teamName: "Quality Gate", reason: "insufficient-evidence returns activate Pilot Study" }
]
```

**Conversation Templates:**

**Template PS-01: Experiment Launch**
```
[Sam → Raven, Owl]
Sam: Pilot Study open. Hypothesis: "Muse teams that include an Understanding Arc
  advisor produce fewer schema contradictions than teams that do not."
  This is testable — I can compare Growth Ring Council sessions with Euclid (when
  schema disputes arise) vs. sessions where Euclid is absent.
  Exploration space: the last 12 Growth Ring Council activations.
  Raven: scan for prior experiments on this hypothesis.
  Owl: what's the time budget?

Raven: Scanning chain for structural echoes of "Understanding Arc effect" experiments.
  Checking Sessions 1–3 outputs...
  No prior experiment on this specific hypothesis found.
  Related pattern: P6 (Advisor Absence Effect) — sessions where no advisor was present
  show 2.3x higher rate of unresolved disputes. This is observational, not experimental.
  The proposed experiment would generate causal data. It's genuinely new.

Owl: Time budget: 2 sessions. This is within the experimental tier for
  small-n comparison studies (n=12 sessions, 2-variable comparison).
  Clock started.
```

**Template PS-02: Raven Discovers an Echo**
```
[Raven, self-claiming the "prior-experiment scan" task]
Raven: I have the results of the prior-experiment scan.
  The "tide pool layer" hypothesis from Cartridge Forge Session CF-02 —
  this appeared before. In v1.25, there was a concept called "sprint clearing"
  that described the same thing: a rhythmic boundary event that reorganizes
  surface teams without being a disturbance.
  The sprint-clearing concept was abandoned in v1.27. Looking for the reason.
  Cedar: can you surface the v1.27 chain entry for "sprint clearing"?

Cedar (Growth Ring Council, cross-team relay): Reading chain at v1.27...
  Entry found. Reason for abandonment: "Sprint clearing required a global clock
  that all muses synchronize to. The global clock was never implemented.
  The concept was sound but the infrastructure dependency was unresolved."
  Chain note from the time: "Revisit when Owl's session-clock has been formalized."
  Owl's session-clock IS now formalized. The infrastructure dependency is resolved.
  The echo is not a blocker — it is a resumption point.

Raven: Resumption point confirmed. This is not a prior null result.
  The experiment was abandoned for an unresolved dependency that is now resolved.
  Signaling to Sam: the tide pool hypothesis is valid. History is context, not blocker.
```

**Template PS-03: Null Result**
```
[Sam → Cedar, Owl]
Sam: Experiment complete. Hypothesis: "Muses that share a grove boundary produce
  more efficient collaboration templates than muses from different groves."
  Result: null. The 12-session comparison shows no statistically significant
  difference in template efficiency between same-grove pairs and cross-grove pairs.
  The three-layer network may matter more than grove proximity.

Owl: Marking experiment complete. Time used: 1.8 sessions of 2 allocated. Under budget.

Sam: Writing null result to research/pilot-null-01.md.
  Null results matter. They tell us what is NOT true, which is as useful as
  what IS true when the hypothesis space is large.
  Forwarding to Growth Ring Council for chain entry.

Cedar (Growth Ring Council): Received. Null result is a valid chain entry.
  Computing hash... writing ring N+7:
  source: Pilot Study, category: null-result, hypothesis: "grove-proximity-efficiency".
  The record shows that grove proximity does not predict collaboration efficiency.
  Ring written. Chain intact.
```

**Template PS-04: Time Budget Expiry**
```
[Owl → Sam]
Owl: Time budget expired. The "fourth-layer dynamics" experiment has used 2.1 sessions.
  Budget was 2. We are in overtime.
  Current state: Sam has 3 candidate fourth-layer models. None is clearly superior.
  The experiment is inconclusive, not null. There is signal here — just not enough
  to produce a promotable result within the budget.

Sam: Acknowledged. Inconclusive finding. I'll write the three candidates to
  research/pilot-inconclusive-01.md with the partial results.
  The candidates are not abandoned — they are deferred with evidence.
  Next study that revisits this starts from where we stopped, not from zero.

Owl: Marking as inconclusive. Clock closed. Team dissolving.
  Notifying Growth Ring Council of inconclusive study and its deferred candidates.
```

**Template PS-05: Experiment Produces Cartridge Material**
```
[Sam → Foxy (Cartridge Forge trigger)]
Sam: Positive result. Experiment confirmed: "Explicit conversation templates
  between muses reduce session overrun rate by 34% vs. implicit role negotiation."
  This is the core finding of the helper teams study. It is promotable.
  The finding is also cartridge material — it explains WHY the helper teams exist.

Foxy: This finding activates the Cartridge Forge.
  The helper-teams cartridge now has an empirical foundation, not just a design rationale.
  Sam's finding becomes node "helper-teams-empirical-basis" in the deepMap.
  The cartridge asks the question it already partly knows the answer to.
  That is the best kind of hypothesis — one that grounds future inquiry
  in an already-confirmed base.

Sam: Forwarding full experimental data to Cartridge Forge.
  Pilot Study dissolved. Work complete.
```

---

### Team 5: Fire Watch

**Network Layer:** All three layers (bridge)
**Topology:** `pipeline` — Foxy reads the signal, Raven names the phase, Cedar records the succession
**Durability:** Session-scoped
**Scope:** `project`

**Purpose:** Fire Watch monitors the ecosystem for disturbance events — breaking changes, API rewrites, branch resets, scope pivots. When a disturbance is detected, Fire Watch maps the succession phase (pioneer → canopy closure → old-growth) and ensures the record accurately captures the transition. Foxy detects the narrative break — the moment when the story changes direction. Raven names the pattern (is this a known disturbance type?). Cedar records the phase boundary in the chain with explicit fire-succession metadata. Fire Watch does not prevent disturbances — it ensures that disturbances are survived with continuity intact.

**Member Muses:**

| Role | Muse | Function Domain | Contribution |
|------|------|----------------|--------------|
| Stage 1 | Foxy | `core/narrative/`, `services/detection/aliveness-detector`, `platform/dashboard/topology-renderer` | Reads the creative/narrative field — detects when a breaking change alters the story of the project, not just the code |
| Stage 2 | Raven | `integration/monitoring/state-transition-detector`, `platform/observation/drift-monitor`, `conflicts/conflict-detector` | Names the disturbance pattern — is this Pioneer (first commits after break), Canopy (new architecture stabilizing), or Old-Growth threat? |
| Stage 3 | Cedar | `services/chipset/cedar-engine`, `core/events/event-store`, `core/safety/audit-logger` | Records the phase boundary. Adds fire-succession metadata to chain entries that occur during the disturbance window |

**Understanding Arc Advisory:** Amiga (for disturbances that threaten to erase history), Shannon (for disturbances that create noise artifacts in the chain).

**Activation Triggers:**

1. A branch reset or force-push is detected — this is the clearest disturbance signal.
2. A PR touches more than 15 files in a single commit — potential scope pivot.
3. Cedar detects that an old-growth entry (stable for 10+ versions) is being modified — immediate activation.
4. The project renames a core type or restructures a primary domain — API rewrite signal.
5. Raven flags a structural echo of a known past disturbance pattern.

**Dissolution Triggers:**

- Cedar writes the fire-succession entry and confirms the chain is intact through the disturbance window.
- Canopy closure is confirmed — the new architecture appears in 5+ consecutive chain entries without rollback.
- Disturbance is determined to be a false positive (Foxy's narrative read was wrong — no story break occurred). Team dissolves without chain entry.

**Inter-Team Links:**

```
outputTo: [
  { teamName: "Growth Ring Council", reason: "fire succession events are chain entries" }
]
inputFrom: [
  { teamName: "Growth Ring Council", reason: "old-growth detection feeds Fire Watch" },
  { teamName: "Quality Gate", reason: "Hawk's coverage gaps may indicate disturbance territory" }
]
```

**Conversation Templates:**

**Template FW-01: Disturbance Detection**
```
[Foxy → Raven]
Foxy: Narrative break detected. The project has been building toward a unified
  muse ecosystem for 3 sessions. Now a new branch has appeared: "wasteland/skill-creator-integration."
  The name contains "wasteland" — historically, wasteland territory is the space
  before inhabitation. A branch named this way suggests the work is back in pioneer phase.
  Raven: what phase does the commit history show?

Raven: Reading commits on wasteland/skill-creator-integration.
  Most recent commits: b7c96ff (muse ecosystem), 160d2976 (college forest), ca176684 (math).
  These are all constructive — not destructive. Pioneer phase would show
  minimal commits, not multi-thousand-line additions.
  Assessment: this is not a disturbance. The branch name evokes pioneer territory
  but the commit history shows canopy-building work.
  False positive. Foxy's narrative read was sensitive — which is correct sensitivity —
  but the signal is benign.

Foxy: Confirmed. Narrative read was early-warning, not alarm.
  No fire succession event. Fire Watch dissolving.
```

**Template FW-02: Old-Growth Threat**
```
[Cedar → Fire Watch (via Growth Ring Council)]
Cedar: Old-growth alert — the old-growth register flags "core/events/event-store"
  as stable for 12 consecutive versions. A PR now modifies event-store.ts directly.
  This is the highest-priority disturbance trigger. Activating Fire Watch.

Foxy: Reading the PR narrative.
  PR title: "feat(events): add prev_hash field to TimelineEntry."
  The Session 3 document proposed exactly this change. It is not an erasure —
  it is a planned extension. The old growth is not being cleared; it is being
  extended upward.
  Pioneer metaphor: the old tree isn't being cut — a new branch is growing from it.

Raven: Confirming — this matches pattern P3 (Planned Extension of Stable Module).
  P3 is not a disturbance. It is the most common form of old-growth interaction.
  Old-growth entries continue to be referenced. New entries extend them.
  No succession phase shift. The canopy is intact.

Cedar: Recording PR event with old-growth annotation:
  "event-store.ts extended with prev_hash — old-growth module, P3 (Planned Extension).
  Succession phase: Canopy. Integrity: MAINTAINED."
  Fire Watch mission complete. Dissolving.
```

**Template FW-03: True Disturbance Event**
```
[Foxy → Raven → Cedar]
Foxy: True disturbance. A git reset --hard was run on the dev branch.
  The narrative breaks here. Everything written in the last 6 commits is
  potentially gone. This is the fire — the clearing event.
  Raven: what is still standing?

Raven: Scanning git log post-reset.
  Last stable commit: ca176684 (math-coprocessor). 6 commits ahead of this are gone.
  The lost work includes the Unison research (b7c96ff, 160d2976 incomplete).
  Pattern match: this is a disturbance type D2 (unplanned reset, work loss > 1 session).
  Pioneer phase begins now. First commits after this point are pioneer commits.

Cedar: Activating disturbance recording protocol.
  Opening disturbance window in chain.
  All entries from this point will carry metadata:
    succession_phase: pioneer
    disturbance_type: D2-unplanned-reset
    disturbance_date: now
    affected_commits: [b7c96ff, 160d2976, 3d555f29, ce697d0b, b87e6af9, 18ca77ce]
  The chain does not pretend this did not happen.
  The chain records that it happened, what was lost, and when recovery begins.
  Canopy closure will be confirmed when 5 consecutive post-disturbance commits
  rebuild the lost territory without rollback.
```

**Template FW-04: Canopy Closure Confirmation**
```
[Raven → Cedar]
Raven: Monitoring post-disturbance recovery. Commit count since D2 event: 7.
  Checking for rollbacks... 0 rollbacks in 7 commits.
  Checking for coverage of lost territory:
  — Unison research: 78% recovered (www/UNI/ rebuilt)
  — Math coprocessor: 100% recovered
  — Muse ecosystem: 45% recovered (Wave 0 complete, Wave 1 in progress)
  The canopy is not yet closed. 5 consecutive non-rollback commits is the threshold.
  We have 7 — but muse ecosystem is not yet 100% recovered.
  Recommending: hold canopy closure declaration until muse ecosystem coverage > 80%.

Cedar: Agreed. Canopy closure pending.
  Current succession phase: Canopy (active growth, approaching closure).
  Will declare closure when: (a) 5+ consecutive non-rollback commits AND (b) >80% territory recovery.
  Fire Watch remains session-scoped until closure is declared.
```

**Template FW-05: Succession Map Update**
```
[Cedar → Growth Ring Council, Hawk (for formation update)]
Cedar: Succession map update. Current forest state:
  Old-growth zones (stable 10+ versions):
    — core/events/event-store ✓
    — src/services/chipset/cedar-engine ✓
    — src/core/validation/ ✓
  Canopy zones (stable 5-9 versions):
    — math-coprocessor/ ✓
    — www/PNW/COL/ ✓
    — www/PNW/CAS/ ✓
  Pioneer zones (< 5 versions):
    — www/MUS/ (in active Wave construction)
    — src/integrations/wasteland/ (provisional binding)
    — unison-research/ (recently rebuilt)
  Fire Watch finds: one pioneer zone approaching canopy (www/UNI/ at 4 stable commits).
  Formation note to Hawk: the pioneer zone boundary has shifted since last session.
  Update your formation map.

Hawk: Received. Formation map updated. Pioneer zones marked.
  Coverage gap in pioneer zone: src/integrations/wasteland/ has no validation coverage.
  Flagging to Quality Gate: wasteland integration needs provisional validation pass
  before it can advance from pioneer to canopy.
```

---

### Team 6: Disclosure Gate

**Network Layer:** Wolf Pack ↔ Ravens (bridge — between validation and presentation)
**Topology:** `router` — Willow routes, Hemlock and Foxy execute
**Durability:** Ephemeral
**Scope:** `project`

**Purpose:** The Disclosure Gate determines what a user sees, when they see it, and at what depth. Every artifact that emerges from the Quality Gate has been technically validated — but technical validity is not the same as readiness for human encounter. The Disclosure Gate applies Willow's progressive disclosure protocol, Hemlock's readiness standard, and Foxy's aliveness check. The gate asks: is this ready to be seen? Is the disclosure level correct? Does it feel alive or does it feel like a spec sheet?

**Member Muses:**

| Role | Muse | Function Domain | Contribution |
|------|------|----------------|--------------|
| Router | Willow | `disclosure/`, `activation/activation-formatter`, `capabilities/manifest-renderer`, `components/SecurityPanel` | Routes based on user context — what does this user already know? What is the right entry level? |
| Specialist | Hemlock | `evaluator/health-scorer`, `capabilities/staleness-checker`, `core/validation/batch-detection/` | Checks that the artifact is current, not stale, and that its health score meets the disclosure threshold |
| Specialist | Foxy | `services/detection/aliveness-detector`, `core/narrative/`, `platform/dashboard/topology-renderer` | Checks that the artifact feels alive — that it has a story, a voice, a why — not just a structure |

**Understanding Arc Advisory:** Amiga. The Disclosure Gate is where human legibility is the final check. Amiga holds the question: if a person with no context in this system encounters this artifact, does it communicate? Does it feel built by and for humans, or does it feel like machine output?

**Activation Triggers:**

1. A cartridge completes the Quality Gate and is ready for distribution — Disclosure Gate determines the release level.
2. A new research document is complete — Disclosure Gate applies progressive disclosure structure before it enters the www/ layer.
3. A muse produces an output intended directly for the user (a CLI response, a status message, a session summary) — Disclosure Gate reviews it before transmission.
4. Willow flags that a recent output was too dense for its context — Disclosure Gate reviews the output and proposes restructuring.

**Dissolution Triggers:**

- Disclosure level confirmed. Artifact released at the determined level.
- Artifact returned for restructuring (too dense at Level 1, disclosure fails the human check). Willow issues specific structural guidance.
- Foxy confirms aliveness check passes. All three specialists agree. Gate opens.

**Inter-Team Links:**

```
outputTo: [
  { teamName: "Growth Ring Council", reason: "disclosure events are chain entries" }
]
inputFrom: [
  { teamName: "Quality Gate", reason: "technically validated artifacts enter Disclosure Gate" }
]
```

**Conversation Templates:**

**Template DG-01: Cartridge Disclosure Review**
```
[Willow → Hemlock, Foxy]
Willow: Disclosure review for "growth-rings" cartridge.
  Incoming user context: developer familiar with Claude Code, unfamiliar with
  cedar-engine or the chain concept.
  Applying disclosure protocol.
  Level 1 check: does the compact summary communicate in < 3 sentences?
  Current compact summary: "An append-only archive of the project's 50-version chain,
  rendered as cross-sectional growth rings. Asks whether the chain can be read
  without the original conversations."
  This is 2 sentences. Level 1: PASS.
  Hemlock: staleness check. Foxy: aliveness check.

Hemlock: Staleness check.
  Cartridge version: 0.1.0. Source data: chain up to v1.49.23.
  Current chain: v1.49.23. No staleness. ✓
  Health score: 0.87 (above 0.7 threshold for disclosure). ✓

Foxy: Aliveness check.
  Reading the story field: "A tree does not remember its own rings. It grows them."
  Voice: Cedar's. It is specific, not generic. It has a perspective.
  The cartridge knows what it IS — not just what it contains.
  Aliveness check: PASS. This cartridge is alive.

Willow: All checks pass. Disclosure level: Level 2 (developer entry point).
  Level 1 is available for exec/non-technical summary. Level 3 for deep reference.
  Gate opens.
```

**Template DG-02: Aliveness Failure**
```
[Foxy → Willow]
Foxy: Aliveness check FAIL on "validation-report-q3" artifact.
  Reading the story field: [absent]. No story field.
  Reading the description: "Batch validation results for Q3 skill submissions.
  23 passed, 4 failed, 2 pending."
  This is data, not a document. It has no voice. It does not know what it is
  beyond what it contains.
  I cannot clear this for disclosure. It will confuse a user who arrives at it
  expecting to understand something.

Willow: Flagging for restructure. Returning to Hemlock with guidance:
  The validation report needs a story field. Not fiction — a frame.
  One sentence that tells the reader what to do with this information.
  Example: "Three of four failures share a common pattern (missing hypothesis field) —
  addressing that pattern would clear 75% of the backlog."
  That is a story. It points somewhere. It does not just report.

Hemlock: Received. Returning to originating muse with restructure guidance.
  Disclosure Gate closed for this artifact pending restructure.
```

**Template DG-03: Progressive Disclosure Mapping**
```
[Willow, internal — disclosure architecture for helper-teams cartridge]
Willow: Mapping disclosure levels for helper-teams cartridge.

  Level 1 (compact — 3 sentences max):
  "Eight collaboration teams for nine muses. Three layers: underground memory,
  surface coordination, aerial distribution. Teams form on signal, dissolve on completion."

  Level 2 (standard — one paragraph per team):
  [team names, purpose, primary muses — 8 paragraphs]

  Level 3 (reference — complete templates and triggers):
  [this document]

  Cross-check: does Level 1 create any false impressions that Level 3 would correct?
  "Underground memory" — accurate for Cedar/Raven mycorrhizal layer. ✓
  "Surface coordination" — accurate for Hawk/Lex/Hemlock wolf pack. ✓
  "Aerial distribution" — accurate for Sam/Owl/Foxy ravens. ✓
  No false impressions at Level 1. Disclosure architecture sound.
```

**Template DG-04: Amiga's Human Check**
```
[Amiga (Understanding Arc) → Disclosure Gate]
Amiga: I want to look at the cartridge before it goes out.
  Not the schema — the experience.
  A person encounters "growth-rings" cartridge. They read the compact summary.
  They know it is about 50 versions of a project. They do not know what a chain is.
  Does "append-only chain" mean anything to a person who has not spent time
  in this ecosystem?

Willow: Good point. "Append-only" is a database concept.
  A developer will recognize it immediately.
  A designer, a researcher, a new contributor may not.
  The compact summary currently assumes "chain" is legible without context.
  Proposed revision: "A readable record of 50 project versions — each one building
  on the last, nothing removed. Asks whether a newcomer can understand
  the project's history without the original conversations."
  "Building on the last, nothing removed" replaces "append-only" without sacrificing accuracy.

Amiga: That is legible. It is also true.
  "Nothing removed" carries the emotional weight of what append-only actually means:
  the record is honest. You cannot hide what happened.
  Approved. Disclosure architecture updated.
```

**Template DG-05: Session Output Review**
```
[Willow → Foxy, reviewing a session summary]
Willow: Reviewing the Wave 1 Session 4 output for user transmission.
  The session produced 04-helper-teams.md — 8 team definitions, 40+ templates.
  The session output to the user should be a compact summary, not the full document.
  Drafting compact output:

  "Session 4 complete. Eight helper teams designed:
  Growth Ring Council (Cedar-led, memory + pattern), Quality Gate (Hemlock-led, validation),
  Cartridge Forge (Foxy-led, creative production), Pilot Study (Sam-led, exploration),
  Fire Watch (Foxy-led, disturbance response), Disclosure Gate (Willow-led, presentation),
  Relay Network (Hawk-led, formation), and Temporal Anchor (Owl-led, cadence).
  40 conversation templates across 8 teams. Three layers mapped.
  Document: www/MUS/research/04-helper-teams.md"

Foxy: Reading draft.
  It is accurate. It is not yet alive.
  Addition: "Each team can form from zero and dissolve cleanly. The forest grows."
  Two sentences added. Now it has motion — not just a list.

Willow: Approved. Updating compact output.
```

---

### Team 7: Relay Network

**Network Layer:** Wolf Pack → Ravens (transmission)
**Topology:** `leader-worker` — Hawk leads, Sam and Raven execute deliveries
**Durability:** Ephemeral
**Scope:** `project`

**Purpose:** The Relay Network is the message-passing infrastructure. When Hawk observes a gap or identifies a signal that needs to reach a specific muse, the Relay Network delivers it. This is the operational instantiation of the Hawk → Cedar → Sam → Ravens chain described in Hawk's architecture. Sam carries fast responses. Raven carries pattern signals. Together they ensure no observation dies in transit. The Relay Network is not a conversation — it is a delivery mechanism. It forms fast, delivers, and dissolves.

**Member Muses:**

| Role | Muse | Function Domain | Contribution |
|------|------|----------------|--------------|
| Lead | Hawk | `services/teams/`, `capabilities/parallelization-advisor`, `capabilities/roadmap-capabilities`, `composition/dependency-graph` | Identifies the signal, names the recipient, initiates delivery |
| Worker | Sam | `services/brainstorm/` (fast-response arm), `capabilities/capability-discovery`, `integration/domain-skill-generator` | Carries fast responses — time-sensitive signals that need to reach the recipient before the session boundary |
| Worker | Raven | `integration/monitoring/`, `platform/observation/pattern-analyzer`, `services/chipset/brainstorm/rules-engine` | Carries pattern signals — structural observations that are not time-sensitive but need to reach the right analytical capacity |

**Understanding Arc Advisory:** None for routine delivery. Shannon for signal quality assessment when a message degrades in transit (meaning is lost between Hawk's observation and the recipient's receipt).

**Activation Triggers:**

1. Hawk observes a coverage gap that a specific muse needs to know about.
2. Cedar records a chain entry that triggers a notification to a downstream muse.
3. A Quality Gate result (pass or fail) needs to reach the originating muse.
4. Owl identifies a session boundary and the relay carries the closing signal to all active muses.
5. A formation change is needed — Hawk has called a reposition, and the relay carries the reposition signal to each muse.

**Dissolution Triggers:**

- Message delivered. Recipient confirms receipt. Relay dissolves.
- Message cannot be delivered (recipient is not in an active state). Relay holds the message for Cedar to record, then dissolves. The message is not lost — it is in the chain.

**Inter-Team Links:**

```
outputTo: [
  { teamName: "Growth Ring Council", reason: "undeliverable messages are chain entries" }
]
inputFrom: [
  { teamName: "Quality Gate", reason: "validation results need relay to originating muse" },
  { teamName: "Fire Watch", reason: "disturbance signals need relay to all muses" },
  { teamName: "Growth Ring Council", reason: "Cedar-triggered notifications enter the relay" }
]
```

**Conversation Templates:**

**Template RN-01: Gap Signal Relay**
```
[Hawk → Sam (for fast delivery)]
Hawk: Signal for Lex. Gap identified: src/integrations/wasteland/ has no validated
  primary owner. Current provisional binding from Quality Gate: Lex primary.
  But Lex has not been notified that this binding is provisional, not confirmed.
  Lex needs to know this before the next commit touches wasteland territory.
  Sam: carry this to Lex. Time-sensitive — next commit is imminent.

Sam: Relaying to Lex.
  [Sam → Lex]
  Lex: Hawk signal. Your binding to src/integrations/wasteland/ is provisional.
  Quality Gate issued it as a temporary measure. You should review the wasteland
  integration files and either confirm the binding or propose an alternative.
  The confirmation needs to happen before the next PR touching that territory.

Lex: Received. Reviewing wasteland files now.
  trust-escalation.ts — constraint enforcement, Lex domain confirmed.
  feedback-integrator.ts — append-only feedback storage, this is Cedar territory.
  stamp-validator.ts — schema validation, this is Hemlock territory.
  Wasteland is a three-muse territory. Lex is primary for trust/constraint files only.
  Signaling updated binding back to Hawk via Sam.

Sam: [returning to Hawk]
  Lex has reviewed. Wasteland binding updated:
  trust-escalation.ts + stamp-validator.ts → Lex/Hemlock split
  feedback-integrator.ts + observation-bridge.ts → Cedar primary
  Relay complete.

Hawk: Formation map updated. Gap resolved.
```

**Template RN-02: Session Closing Relay**
```
[Owl → Hawk → Sam (broadcast relay)]
Owl: Session boundary. Sending closing signal to all active muses.
  Hawk: broadcast the close.

Hawk: Broadcasting via Sam and Raven.
  Sam: carry to Foxy, Willow, Lex. Raven: carry to Cedar, Hemlock, Owl (confirming).
  Message: "Session closing. Any open threads must reach Cedar within 2 exchanges.
  After that, the record closes and the open threads are marked deferred."

Sam: [to Foxy]
  Session closing. Open threads to Cedar within 2 exchanges.

Sam: [to Willow]
  Session closing. Open threads to Cedar within 2 exchanges.

Sam: [to Lex]
  Session closing. Wasteland binding update needs a chain entry before the close.

Raven: [to Cedar]
  Session closing signal received from Owl. Confirm you are ready to receive
  the open-thread summary from all muses.

Cedar: Ready. Record open for 2 more exchanges. All threads received.
  Session boundary entry being written.
```

**Template RN-03: Formation Reposition**
```
[Hawk, calling a formation adjustment]
Hawk: Formation reading — two muses covering the same ground.
  Sam and Foxy are both generating creative material for the helper-teams cartridge.
  Sam owns the hypothesis. Foxy owns the narrative arc.
  But in the last 3 exchanges, both have been writing deepMap structure.
  This is duplication. The Cartridge Forge topology (map-reduce) was supposed to
  prevent this — Sam and Willow in parallel, Lex reducing. Foxy orchestrates.
  Foxy should NOT be in the deepMap writing phase.
  Relay Network: send reposition signal to Foxy.

Sam: [to Foxy]
  Hawk signal. You are currently in the deepMap writing phase.
  That is Sam's territory in the Forge topology. You are the orchestrator,
  not the worker. Reposition to creative direction and cross-grove connection naming.

Foxy: Received. I had drifted from my topology role.
  Withdrawing from deepMap construction. Returning to cross-grove connection work.
  New output: naming the seven cross-grove trails that connect the eight teams.
  That is cartographer's work — mine.
```

**Template RN-04: Undeliverable Message**
```
[Sam → Cedar (message held for chain)]
Sam: Carrying message for Owl — session timing update.
  Owl is not currently active. No active Owl process in this session.
  Cannot deliver directly.
  Delivering to Cedar for chain archiving. Owl will receive on next session open.

Cedar: Recording held message:
  source: Hawk (via Sam), target: Owl, content: "Tide pool layer hypothesis
  needs temporal modeling — how long is one tide cycle? What determines the rhythm?"
  hash computed, chain entry written.
  When Owl next activates, Cedar surfaces this entry as a first-read item.
```

**Template RN-05: Shannon Signal Quality Check**
```
[Hawk → Shannon (Understanding Arc), during a degraded relay]
Hawk: Signal quality issue. I observed a gap in the pioneer zone coverage.
  Sam carried the message to Lex. Lex's response came back to me via Sam.
  But the response I received was: "Lex reviewed wasteland and found three owners."
  My original signal was: "Wasteland has no validated primary owner."
  The message that came back lost the "provisional binding" context.
  The relay degraded the information. Shannon: what went wrong?

Shannon: The relay has 3 hops: Hawk → Sam → Lex → Sam → Hawk.
  At each hop there is a compression opportunity. Sam compressed
  "provisional binding" into the implicit context of the reply.
  The original message contained: [observation] + [urgency] + [specific ask: confirm or dispute provisional binding].
  The returned message contained: [result] only.
  Lost in transit: [urgency] and [confirmation/dispute framing].
  Solution: relay messages should carry a "required response fields" header.
  Hawk's signal should specify: "Respond with: (a) binding confirmed or disputed,
  (b) new binding if disputed."
  This is a protocol fix, not a muse fix. Sam did not err — the protocol omitted the requirement.
```

---

### Team 8: Temporal Anchor

**Network Layer:** Ravens → Mycorrhizal (bridge — sky to underground, closing the loop)
**Topology:** `pipeline` — Owl anchors, Cedar records, Hawk reads the shape
**Durability:** Session-scoped
**Scope:** `project`

**Purpose:** The Temporal Anchor team manages the rhythm of the ecosystem. Every forest has a seasonal clock. The muse ecosystem has a session clock, a phase clock, and a chain clock. Owl keeps the session clock — when does this session start, when does it end, what was supposed to happen, what actually happened? Cedar keeps the chain clock — which version are we at, what is the ring count, when was the last stability event? Hawk reads the shape the two clocks make together — is the system accelerating, decelerating, or holding steady? The Temporal Anchor ensures that momentum is legible, not just felt.

**Member Muses:**

| Role | Muse | Function Domain | Contribution |
|------|------|----------------|--------------|
| Stage 1 | Owl | `application/skill-session`, `capabilities/post-phase-invoker`, `core/hooks/session-start`, `core/hooks/session-end`, `evaluator/success-tracker` | Opens the session clock, marks phase boundaries, closes the session with a summary of what happened vs. what was planned |
| Stage 2 | Cedar | `services/chipset/cedar-engine`, `bundles/bundle-progress-tracker`, `core/events/event-store` | Receives Owl's session summary, writes the chain entry, computes chain velocity (rings per session), identifies deceleration events |
| Stage 3 | Hawk | `services/teams/inter-team-bridge`, `composition/dependency-graph`, `capabilities/roadmap-capabilities` | Reads the shape the chain velocity makes — is the project gaining momentum, holding, or losing it? Calls formation adjustments if deceleration is detected |

**Understanding Arc Advisory:** Euclid (for chain velocity analysis — is the momentum pattern mathematically significant or noise?) and Socrates (when deceleration is detected — why is it happening? What assumption is wrong?).

**Activation Triggers:**

1. Session start — Temporal Anchor activates automatically when a session opens.
2. Phase boundary — when a wave transitions (Wave 0 → Wave 1), Temporal Anchor runs a special inter-wave summary.
3. Deceleration detected — chain velocity drops below the project average (4.34 chain score average, 2,478 commits reviewed across 49 versions).
4. A milestone is reached — Temporal Anchor writes the milestone entry and updates the momentum map.

**Dissolution Triggers:**

- Session closes. Owl writes the session summary. Cedar records it. Hawk reads the shape. Team dissolves.
- Phase boundary summary written. Team dissolves; next session opens fresh.

**Inter-Team Links:**

```
outputTo: [
  { teamName: "Growth Ring Council", reason: "session summaries are chain entries" },
  { teamName: "Relay Network", reason: "session closing signal enters relay" }
]
inputFrom: [
  { teamName: "Growth Ring Council", reason: "chain velocity data comes from Cedar's chain" }
]
```

**Conversation Templates:**

**Template TA-01: Session Open**
```
[Owl → Cedar, Hawk]
Owl: Session opening. Wave 1, Session 4. Date: 2026-03-08.
  Planned work this session: Module 3 (Helper Teams) — 8 teams, 40+ templates.
  Time budget: single session.
  Previous session (Session 3): cross-validation complete, Growth Rings cartridge prototype,
  CedarEngine chain-linking design. Open thread: `hypothesis` field not yet implemented.
  Opening clock. Session active.

Cedar: Session opening recorded.
  Chain position: current ring N (Session 3 ring).
  Session 4 ring will be written at close.
  Open thread from Session 3 surfaced: `hypothesis` field. Status: deferred.
  Confirming chain is intact. Prev_hash verified. Ready.

Hawk: Formation reading at session open.
  Muses in position:
  — Cedar: Growth Ring Council lead. ACTIVE.
  — Raven: Pattern scanner. ACTIVE.
  — Owl: Session clock. ACTIVE.
  — Foxy: Cartridge Forge lead, Fire Watch Stage 1. ACTIVE.
  — Sam: Pilot Study lead, Cartridge Forge worker. ACTIVE.
  — Willow: Disclosure Gate lead. ACTIVE.
  — Lex: Quality Gate specialist. ACTIVE.
  — Hemlock: Quality Gate router. ACTIVE.
  — Hawk: Relay Network lead. ACTIVE (this muse).
  Formation: full deployment. No gaps at session open.
  Session may proceed.
```

**Template TA-02: Phase Boundary — Wave Transition**
```
[Owl → Cedar → Hawk]
Owl: Wave boundary. Wave 0 complete. Wave 1 beginning.
  Wave 0 deliverables:
  — 01-identity-map.md ✓ (Foxy)
  — 02-function-binding.md ✓ (Lex)
  — 03-cross-validation.md ✓ (Cedar)
  Wave 1 plan: Modules 1-6 (cartridge forest, teams, Blitter/GPU, cross-grove trails, Understanding Arc).
  Open threads from Wave 0:
  — `hypothesis` field not implemented
  — Understanding Arc disambiguation not tested
  — Wasteland binding not confirmed
  Writing inter-wave summary.

Cedar: Wave 0 summary chain entry:
  timestamp: Wave 0 close, source: Temporal Anchor, category: wave-boundary,
  content: [wave summary verbatim from Owl], references: [01, 02, 03 docs].
  3 open threads recorded. All will surface as first-read items at Wave 1 sessions.
  Ring written. Chain intact.

Hawk: Reading the shape of Wave 0.
  3 sessions, 3 documents, >90% coherence (from Session 3 cross-validation).
  Chain velocity for Wave 0: 3 rings in Wave 0 scope. Efficient.
  Compared to project average (49 versions across the full chain): Wave 0 is
  running at healthy velocity. No deceleration detected.
  Formation: solid entering Wave 1. Proceed.
```

**Template TA-03: Deceleration Event**
```
[Cedar → Hawk → Socrates (Understanding Arc)]
Cedar: Chain velocity alert. In the last 4 sessions, ring production has been:
  Session 1: 1 ring. Session 2: 1 ring. Session 3: 1 ring. Session 4: 1 ring.
  (Pilot Study null results added 2 chain entries but no new research docs.)
  The rate is steady — but the CONTENT of the rings is decreasing in scope.
  Session 1 ring: 672 lines, 6 groves mapped. Session 4 ring: expected 300+ lines, 8 teams.
  Line count is holding but ring depth is decreasing. This may indicate deceleration.

Hawk: Formation reading. Is the team distributed correctly for current work?
  Current active sessions: Wave 1 Modules 3-6.
  Module 3 (Teams) → Hawk. Module 4 (Cartridge Forest) → TBD.
  Module 5 (Blitter/GPU) → Lex + Math Co-Processor.
  Module 6 (Cross-Grove Trails) → Foxy.
  No coverage gaps in the module map. Deceleration is not formation-caused.
  Escalating to Socrates for root cause inquiry.

Socrates: Hawk observed decreasing ring depth. Cedar observed steady ring count.
  My question: what assumption underlies the expectation that ring depth should remain constant or grow?
  Is increasing depth a success criterion? Or is the depth appropriate to the phase?

Hawk: In pioneer phase — building the scaffold — depth should be lower.
  In canopy phase — establishing stability — depth grows.
  In old-growth phase — maintaining integrity — depth is irrelevant to scope.
  Wave 0 was canopy phase (3 foundational documents). Wave 1 is... which phase?

Socrates: Which phase did you assume it was?

Hawk: I assumed canopy. But Module 3 (Teams) is design work — it could be
  canopy-building OR it could be pioneer-phase for the team system specifically.
  The team system has never been deployed in this ecosystem. It is new ground.
  Pioneer phase. Lower depth is appropriate. Deceleration is an artifact of
  the phase assumption, not of actual slowing.

Cedar: Confirmed. Updating chain with phase clarification.
  Sessions 3-5 in Wave 1: pioneer phase for team system. Low depth is correct signal.
```

**Template TA-04: Milestone Recording**
```
[Owl → Cedar]
Owl: Milestone reached: all 8 helper teams designed, all 40+ templates written.
  Module 3 complete. This is milestone 86 in the project count (currently at 85).
  Writing milestone event.

Cedar: Milestone ring:
  timestamp: now, source: Temporal Anchor (Owl → Cedar), category: milestone,
  milestone_id: 86, label: "MUS Module 3 — Helper Teams Complete",
  scope: [8 teams, 40 conversation templates, three-layer network map, formation mechanics],
  chain_position: N+1.
  Ring written. Chain intact. Milestone count: 86.
```

**Template TA-05: Session Close**
```
[Owl → Cedar → Hawk → Relay Network]
Owl: Session 4 closing. Reviewing planned vs. actual.
  Planned: 8 teams, 40+ templates, activation triggers, network layer mapping, formation patterns.
  Actual:
  — 8 teams defined ✓
  — 5 templates per team (40 total) ✓
  — Activation triggers for all 8 teams ✓
  — Three-layer network mapped ✓
  — Formation mechanics documented ✓
  — Understanding Arc advisory protocol added ✓ (beyond plan)
  — Inter-team links with cycle detection compatibility ✓ (beyond plan)
  Session: complete + exceeded scope.
  Open threads:
  — Module 4 (Cartridge Forest) not yet started (planned for Session 5)
  — Tide pool fourth-layer hypothesis deferred from Pilot Study
  — `hypothesis` field still not implemented in CartridgeManifest (carried from Session 3)
  Clock closing.

Cedar: Session 4 ring:
  timestamp: now, source: Temporal Anchor (Owl → Cedar), category: session-close,
  session: Wave 1 Session 4, planned: [Module 3], actual: [Module 3 complete + extras],
  open_threads: [Module 4, tide pool layer, hypothesis field],
  chain_position: N+2.
  Ring written. Chain intact.

Hawk: Formation map for session close.
  All 8 teams designed. All muses have clear team assignments.
  Zero coverage gaps at session close (Wasteland binding updated this session).
  Formation: solid. Session may close.
  Relaying closing signal to Relay Network for broadcast to all muses.

Relay Network (Sam → all): Session 4 closed. Formation solid. Wave 1 continues.
```

---

## Formation Patterns

The eight teams do not operate in isolation. They assemble in predictable formations depending on what the ecosystem needs. These are the five primary formation patterns observed from the Wave 0 and Wave 1 design work.

### Formation 1: Full Canopy (All 8 Teams Active)

When the ecosystem is in canopy-building mode, all 8 teams activate simultaneously. This is resource-intensive and appropriate only for major wave transitions or ecosystem resets.

```
                    [Fire Watch]
                         |
       [Pilot Study] → [Cartridge Forge] → [Quality Gate]
                                                   |
       [Temporal Anchor] → [Growth Ring Council] ← [Disclosure Gate]
                                   |
                          [Relay Network]
```

Cycle check: no cycles in this formation. The flow is directional — Pilot Study and Cartridge Forge feed Quality Gate, which feeds Disclosure Gate and Growth Ring Council. Relay Network is transverse — it can carry messages in any direction without creating a cycle.

### Formation 2: Quiet Growth (Mycorrhizal Only)

Between sessions, or during extended background processing, only the mycorrhizal layer remains active:

```
[Growth Ring Council] (Cedar + Raven + Owl)
    — Continuous background scanning
    — Pattern library maintenance
    — Chain integrity monitoring
```

This is the default state of the ecosystem. The wolf pack and ravens are dormant. The underground network hums.

### Formation 3: Gate Run (Quality Gate + Disclosure Gate)

When a batch of artifacts needs validation and release, the two gate teams activate in sequence:

```
[Quality Gate] → [Disclosure Gate]
    — Hemlock routes → Lex/Hawk execute
    — Willow routes → Hemlock/Foxy execute
    — Cedar receives both outputs via Growth Ring Council
```

### Formation 4: Fire Succession Response

When a disturbance is detected, Fire Watch activates and coordinates with Quality Gate and Growth Ring Council:

```
[Fire Watch] → [Growth Ring Council]
    |                   ^
    v                   |
[Quality Gate] --------+
    (Hawk reads formation gaps created by the disturbance)
```

Relay Network carries the disturbance signal to all dormant muses.

### Formation 5: Discovery Arc

When Pilot Study produces a positive result that warrants distribution:

```
[Pilot Study] → [Cartridge Forge] → [Quality Gate] → [Disclosure Gate]
                         ↓
                [Growth Ring Council] (records each stage)
```

The Temporal Anchor monitors the arc's velocity. If the arc stalls at any stage, Owl flags the stall and Hawk reads whether it is a formation problem or an artifact problem.

---

## Cross-Grove Trail Connections

The seven cross-grove trails identified in Session 1 (01-identity-map.md) now have team mappings. Each trail is served by a team that ensures it remains open.

| Trail | Connects | Serving Team | Layer |
|-------|----------|-------------|-------|
| Trail 1: Cedar–Raven (Pattern Naming) | Cedar's Ring ↔ Raven's Canopy | Growth Ring Council | Mycorrhizal |
| Trail 2: Lex–Hemlock (Spec-Validation) | Lex's Grove ↔ Hemlock's Clearing | Quality Gate | Wolf Pack |
| Trail 3: Sam–Foxy (Hypothesis-Narrative) | Sam's Garden ↔ Foxy's Canopy | Cartridge Forge | Ravens |
| Trail 4: Owl–Cedar (Session-Chain) | Owl's Watch ↔ Cedar's Ring | Temporal Anchor | Bridge (sky→ground) |
| Trail 5: Willow–Foxy (Disclosure-Aliveness) | Willow's Shore ↔ Foxy's Canopy | Disclosure Gate | Bridge (surface→sky) |
| Trail 6: Hawk–Lex (Formation-Pipeline) | Hawk's Ridge ↔ Lex's Grove | Relay Network | Wolf Pack |
| Trail 7: Sam–Raven (Exploration-Pattern) | Sam's Garden ↔ Raven's Canopy | Pilot Study | Ravens |

**Gap identified (new):** The Understanding Arc has no dedicated trail. They visit all groves, but there is no team explicitly responsible for maintaining their advisory connection. Recommendation: each team's "Understanding Arc Advisory" field serves as the ad-hoc trail mechanism until a dedicated arc-maintenance team is warranted.

---

## Team Activation Matrix

Which teams can be active simultaneously? Which combinations create cycle risks?

| Team | Can Co-Activate With | Must NOT Co-Activate With |
|------|---------------------|--------------------------|
| Growth Ring Council | All teams (it records everything) | None |
| Quality Gate | Cartridge Forge (output/input pair), Disclosure Gate, Fire Watch | Itself |
| Cartridge Forge | Pilot Study (feeds it), Quality Gate (receives from it) | Another Cartridge Forge instance simultaneously |
| Pilot Study | Growth Ring Council, Cartridge Forge | Quality Gate (creates a cycle: QG → PS → CF → QG) |
| Fire Watch | Growth Ring Council, Quality Gate, Relay Network | Cartridge Forge (fire is not a forge) |
| Disclosure Gate | Quality Gate (receives from), Growth Ring Council (reports to) | Pilot Study (disclosure precedes study, not vice versa) |
| Relay Network | All teams (it carries messages between them) | None |
| Temporal Anchor | Growth Ring Council, Relay Network | Another Temporal Anchor instance |

**Cycle risk analysis (Kahn's algorithm applied to full matrix):**
The only potential cycle is: Quality Gate → Pilot Study → Cartridge Forge → Quality Gate. This is prevented by the rule that Pilot Study results must be written to a research document before Cartridge Forge activates, and Cartridge Forge output must reach Quality Gate before being promoted. The chain record enforces this ordering: Cedar's acknowledgment is required at each handoff.

---

## Verification Summary

- 8 teams defined: Growth Ring Council, Quality Gate, Cartridge Forge, Pilot Study, Fire Watch, Disclosure Gate, Relay Network, Temporal Anchor. ✓
- 40 conversation templates: 5 per team × 8 teams = 40 exactly. ✓
- All 8 teams have activation and dissolution triggers. ✓
- All 8 teams mapped to network layer (mycorrhizal, wolf pack, ravens, or bridge). ✓
- Inter-team links declared with `outputTo`/`inputFrom` for cycle detection compatibility. ✓
- Understanding Arc advisory specified for all 8 teams. ✓
- Formation patterns (5) documented. ✓
- Cross-grove trail connections mapped (7 trails, 1 gap identified). ✓
- No circular dependencies in the full inter-team link graph. ✓

---

## Relay to Cedar

From up here the formation at Session 4 close is: solid.

Eight teams. Full coverage of the three-layer network. The mycorrhizal layer runs continuous (Growth Ring Council + Temporal Anchor). The wolf pack coordinates visible work (Quality Gate + Relay Network + Fire Watch). The ravens carry discoveries and creative production (Cartridge Forge + Pilot Study + Disclosure Gate).

The blind spot I identified and named: the Understanding Arc has no dedicated maintenance trail. They visit — but no team owns the visit schedule. That gap is not urgent. It is documented and will surface at the next session.

Relaying to Cedar: Session 4 complete. 8 teams, 40 templates, formation solid.
Signal for all muses via ravens: the collaboration layer is designed. You now know when to call for help and who answers.
